# AJILEI · SAL-B1 · Ajuste A3 · Fase 1 · Informe v1.0
## Un miembro recuperaba una mesa muerta: «¿sigue viva?» pasa delante de «¿ya estabas?» en `unirse_sala`

**Rector:** `AJILEI_SAL-B1_AjusteA3_Fase1_v1.0.md`. Corrige el cuerpo que dejó A1; no toca nada más.
**Punto de partida:** el árbol al cerrar la Fase 0 de A3 (618 pruebas, lint 21, `diagSAL` 66/66, `main` en `12188af`).
**Estado:** migración aplicada, §4 y §5 en verde (2026-09-11). Una migración nueva, **cero cambios en el cliente**.

---

## 0. Resumen en tres líneas

El defecto es de **orden**: en las dos ramas de `unirse_sala`, la reentrada (`es_miembro`) decidía antes que la comprobación de mesa viva, y el anfitrión de una mesa cancelada sigue siendo miembro porque `salir_sala` no borra su silla. La migración `20260911103000_sal_b1_ajuste_a3.sql` reemplaza el cuerpo con las dos comprobaciones invertidas y todo lo demás verbatim de A1. Cliente intacto: 618 pruebas, lint 21, build limpio, 66/66, protegidos intactos.

---

## 1. Las dos respuestas de §2

**¿Borra el camino de cancelar las filas de `sala_jugadores`?** No. No existe `cancelar_sala`; el anfitrión cancela por `salir_sala` (SAL-A §11), que hace `update public.salas set estado = 'cancelada' where id = p_sala and estado = 'esperando'` y **nada más**. Sólo el invitado que se levanta borra su propia fila (`delete from public.sala_jugadores where sala_id = p_sala and jugador_id = v_uid`). `barrer_salas` y `resolver_sala` tampoco tocan las sillas al cancelar o arrancar. Es diseño de SAL-A —«la fila NO se borra al cancelar: se marca», para que los demás se enteren por Realtime— y esta ficha no lo cambia; se anota. Consecuencia: **el anfitrión (y cualquier invitado que no pulsara «Salir») sigue siendo miembro de su mesa muerta**, y eso es exactamente lo que la reentrada premiaba.

**¿Qué mira `es_miembro`?** Sólo `sala_jugadores`: `select exists (select 1 from public.sala_jugadores j where j.sala_id = p_sala and j.jugador_id = p_uid)` (SAL-A §6, `security definer`, `search_path = ''`). No mira `salas.estado` ni `expira_en`; por construcción no sabe si la mesa está viva.

Las dos juntas explican el defecto sin residuo: silla que no se borra + reentrada que no pregunta por el estado + reentrada evaluada primero.

---

## 2. El `diff` lógico del cuerpo

| Paso | Antes (A1) | Después (A3) |
|---|---|---|
| Rama por **código**, tras `select … for update` | 1. `id is null` → `return null` · 2. **`es_miembro` → `return v_sala`** · 3. `estado <> 'esperando' or expira_en <= now()` → `return null` | 1. `id is null` → `return null` · 2. **`estado <> 'esperando' or expira_en <= now()` → `return null`** · 3. `es_miembro` → `return v_sala` |
| Rama por **id** | 1. `id is null` → `raise sala_no_disponible` · 2. **`es_miembro` → `return v_sala`** · 3. viva → `raise sala_no_disponible` | 1. `id is null` → `raise` · 2. **viva → `raise sala_no_disponible`** · 3. `es_miembro` → `return v_sala` |
| Resto del cuerpo | validación del código, purga e inserción en `intentos_codigo`, límite de cinco, `sala_esperando_de`, saldo, silla libre, inserción | **verbatim**, comentarios de A1 incluidos |

Lo que cambia para el jugador: un miembro de una mesa **muerta** recibe por código la fila de nulos → `codigo_invalido` («Código no encontrado o mesa ya iniciada») y por id `sala_no_disponible`; el stub no se pinta. Un miembro de una mesa **viva** la recupera exactamente como antes. El «no existe» y el «existió y murió» siguen siendo indistinguibles para quien sondea. El comentario nuevo lleva la marca provisional hasta MES-PvP: cuando haya partida, la reentrada a una `activa` con `estado_partida` no nulo se decidirá allí.

---

## 3. La migración

`supabase/migrations/20260911103000_sal_b1_ajuste_a3.sql`: cabecera con el porqué, y un único `create or replace function public.unirse_sala(p_codigo text default null, p_sala uuid default null) returns public.salas … security definer set search_path = ''`. Misma firma, mismo nombre; `create or replace` conserva los grants de SAL-A §15. Ninguna otra función.

---

## 4. Verificación en SQL (Victor, tras `db push`)

**Grupo A · orden del cuerpo, leído del catálogo.** Esperado: `t, t, t`.

```sql
with d as (
  select pg_get_functiondef('public.unirse_sala(text, uuid)'::regprocedure) as t
), r as (
  select t, substr(t, position('elsif p_sala is not null' in t)) as rama_id from d
)
select position('estado <> ''esperando''' in t) < position('es_miembro(v_sala.id' in t) as rama_codigo_ok,
       position('estado <> ''esperando''' in rama_id) < position('es_miembro(v_sala.id' in rama_id) as rama_id_ok,
       has_function_privilege('authenticated', 'public.unirse_sala(text, uuid)', 'execute') as grant_vivo
  from r;
```

**Grupo B · conducta.** Se pega entero (está en la migración, listo para copiar); siete filas, todas OK:

| # | Prueba | Esperado |
|---|---|---|
| 1 | Anfitrión arma privada, cancela, pide su mesa por código | `NULL` (antes de A3: la mesa) |
| 2 | Lo mismo por id | `sala_no_disponible` |
| 3 | Mesa viva, no miembro con saldo | se sienta (`1` fila en `sala_jugadores`) |
| 4 | Mesa viva, el miembro repite el código | `MISMA` mesa (la reentrada sigue) |
| 5 | Mesa pasa a `activa` sin partida, el miembro pide por código | `NULL`, coherente con `mi_sala()` |
| 6 | El intento de (1) quedó anotado | `1` fila de UNO en `intentos_codigo` |
| 7 | Los tres de DOS (3, 4, 5) anotados | `3` |

Se limpia solo al final (`delete from auth.users` con cascada).

**Corrida real (2026-09-11, Victor):** Grupo A → `true, true, true`. Grupo B → **7/7 OK**; usuarios fabricados borrados. (La migración no se edita: el resultado vive aquí, por decisión de Victor.)

---

## 5. Repetición con dispositivos · **en verde (2026-09-11, Victor)**

| # | Escenario | Esperado | Resultado |
|---|---|---|---|
| 1 | PC `test1976`, consola abierta · S25 arma privada, anota código, cancela · PC abre `?sala=AJ-XXXX` | `SalaOpciones` con el error rojo, campo vacío, barra sin `?sala=`; consola: `arranque · … · invitación pendiente: AJ-XXXX` y luego `unirse_sala devolvió una fila sin id` | **Verde** (2026-09-11). Mesa `AJ-W54H` cancelada en el S25; el PC abrió `?sala=AJ-W54H` → `SalaOpciones` con error rojo; consola `invitación pendiente: AJ-W54H` → `unirse_sala devolvió una fila sin id`. Antes de A3 (`AJ-EKW4`, `AJ-DAQN`) aterrizaba en el stub |
| 2 | PC `ticotest2022`, mismo circuito | igual que 1 (o «verde antes y después») | **Verde antes y después.** `AJ-S6MY` → error rojo; al volver del lobby, campo vacío y sin error |
| 3 | S25 invitado por enlace a mesa **viva** del Motorola | stub, sentado | **Verde.** El Motorola armó mesa de 3, el S25 entró por código y quedó sentado (2/3). El Motorola mostró 2/3 tras «Actualizar» (esperado en B1, sin Realtime) |
| 4 | Motorola PWA: anfitrión arma → cancela → reabre la app | lobby (`mi_sala`, no `unirse_sala`) | **Verde.** «Salir de la mesa» → cerrar Chrome → reabrir → lobby. Nota: la casita **no** cancela; con la mesa viva, reabrir reanuda al anfitrión, que es lo correcto |

Grupo C de A1, si se quiere: `select jugador_id, intentado_en from intentos_codigo order by intentado_en desc limit 5` tras la prueba 1 → una fila nueva.

---

## 6. Verificación del árbol · §6

| Qué | Resultado |
|---|---|
| Protegidos (`git diff 12188af` sobre los cinco) | vacío |
| `npm test` | **618 / 618**, sin cambio |
| `npx eslint .` | **21** (20 + 1), línea base |
| `npm run build` | limpio |
| `diagSAL sal` | **66 / 66** |
| `git status` | árbol de la Fase 0 + esta migración + este informe |

Cero archivos de `src/`, `scripts/` o `tests/` tocados: el cliente no sabía nada de este defecto y sigue sin saberlo, que es lo correcto —una fila con `id` es una mesa para el cliente; si está viva o no, lo decide el servidor.

---

## 7. Lección para la memoria (§5 en verde el 2026-09-11: fijada)

En una RPC que admite reentrada, la comprobación de que el recurso **sigue vivo** va antes que la de **quién lo pide**; si no, quien estuvo dentro recupera un cadáver. Y una fila con `id` pasa todas las guardas del cliente por definición: el cliente puede decidir «hay mesa», no «la mesa está viva».

---

## STOP

Sin commits. La ficha de commits de SAL-B1 incorpora esta migración en el atómico (d) «`salasApi` + migraciones» y este informe en (f).
