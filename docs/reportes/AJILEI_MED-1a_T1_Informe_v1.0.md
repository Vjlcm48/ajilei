# AJILEI · MED-1a · Tanda 1 (la nube) · Informe · v1.0

- **Ficha:** `AJILEI_MED-1a_T1_v1.0.md`. **Base:** `1b35256`. **Fecha:** 2026-11-16.
- **Diseño:** `docs/reportes/AJILEI_MED-1a_Fase0_Informe_v1.0.md`, §B.2 a §B.5, §C y §G. Esta tanda construye lo diagnosticado ahí, con los tres cambios del rector al STOP-A (§1).
- **Estado:** tramos A, B y C hechos; controles del §6 de la ficha en §5. Quedan los commits, tras el visto bueno del mapa, y el paso a la nube de Victor (§7 de la ficha): **la migración antes del deploy**.

---

## Resumen

| Pieza | Qué se hizo | Dónde |
|---|---|---|
| `eventos` | Tabla de solo inserción (copia de `movimientos_inmutable`), `tipo` por formato, `datos` ≤ 2 KB, RLS sin políticas, `revoke all`, índices `(tipo, creado_en)` y `(jugador_id, creado_en)` | `supabase/migrations/20261116120000_med1a_eventos.sql`, §1 |
| `sesiones` + `latido_sesion` | Las cinco ramas de la ficha; `false` también sin perfil | id., §2 |
| `registrar_evento` | Lista blanca (`pvp_reconexion`), tope de 30 por minuto; `false` sin sesión, sin perfil, con `datos` que no es objeto o pasa de 2 KB | id., §3 |
| `profiles.origen` / `origen_datos` | Columnas con formato y tope; el `insert` ya no estaba restringido por columnas y no se tocó; el `update` y el `select` no las incluyen | id., §4 |
| Disparador `ingreso` | Una fila por cuenta y día de Chicago, `datos = { racha }` | id., §5 |
| `aplicar_efectos` | Los tres `anuncio_*`; uno mal formado queda como `medicion_invalida` y la jugada sigue | id., §6 |
| Guion PGlite `med1a` | 36 filas (11 A + 25 B), 2 pasadas, sin rastro; declarado en el corredor | `supabase/pruebas/med1a_verificacion.sql` · `scripts/eco/guionesCore.mjs` (+ su test) |
| El árbitro (Contrato v1.6) | Emite los tres efectos; 6 pruebas nuevas, 2 aserciones al día, una propiedad nueva | `src/arbitro/partida.js` · `src/arbitro/arbitro.test.js` |
| Documentos | Contrato v1.6, INV-87, este informe | `docs/` |

---

## 1 · La migración (tramo A)

Una migración, con sus Grupos A y B comentados al pie (11 y 25 filas, uno por pestaña del SQL Editor). Los grupos del pie se **generan** del guion, para que no diverjan, y se probaron descomentados, sin transacción, como los pegará Victor: 11/11 y 25/25, con el mismo número de filas en `eventos`, `sesiones` y `auth.users` antes y después.

**Lo que no sigue la letra de la ficha, aprobado en el STOP-A:**
1. **El disparador `ingreso`.** El `WHEN (tg_op = 'INSERT' or old.ultimo_dia …)` no es SQL válido: el `WHEN` de un disparador INSERT OR UPDATE no admite `tg_op` ni `OLD`. La condición vive en la función, y además solo cuenta un `ultimo_dia` que es **hoy en Chicago**: `marcar_ingreso` crea la fila con `ultimo_dia` nulo y la rellena después, y `constancia_admin` la lleva a días pasados para las pruebas; ninguna de las dos fabrica un ingreso (B13).
2. **`search_path = ''`** con nombres calificados (la costumbre del repo), no `public`.
3. **`registrar_evento` devuelve `false`, sin error,** también sin sesión, con `datos` que no es objeto o que pasa de 2 KB.

**Los tres cambios del rector al STOP-A:**
1. **La medición nunca tumba la mesa.** La rama de los `anuncio_*` no lanza `estado_incoherente`. Si el asiento no está en la mesa, falta `mano`, `ms` falta o es negativo, o `como` no es `'tope'` ni `'mesa'`, anota `medicion_invalida` (`jugador_id` nulo, `datos = { sala, efecto }`) y sigue. Dos cosas más, para que la regla se cumpla de verdad:
   - los números se leen **solo si son números JSON**: un `"asiento": "x"` con `::smallint` lanzaría, y el manejador final de la función lo convertiría en `estado_incoherente`;
   - el `efecto` en bruto va recortado a 1.500 caracteres, o a 400 si con multibyte pasaría de 1.800 bytes: si no, el check de 2 KB de `datos` lanzaría y tumbaría la jugada (B19 lo prueba con un `como` de 1.400 «ñ»).

   Los efectos de dinero y el tipo desconocido no cambian (B18).
2. **Sin perfil, `false`.** `latido_sesion` y `registrar_evento` miran que exista la fila de `profiles` antes de insertar: la cuenta que verificó el código y aún no se bautizó recibe `false`, no un error de FK (B24, B25).
3. El mapa 1-a lleva también `scripts/eco/guionesCore.mjs` y `guionesCore.test.js`.

**Confirmado en el repo:**
- El `insert` de `profiles` es privilegio de tabla (los privilegios por defecto) más `profiles_insert_propio`: no se tocó. El `update` (`cfg1b_perfil:215-216`) y el `select` (`arn4c_profiles_columnas:13-14`, INV-83) no incluyen las columnas nuevas (A9, B23).
- `neto_mesa` suma `liberado − entrada` de los asientos con `uid` nulo porque los movimientos de una cuenta borrada se van en cascada (`mot1_dinero:327-341`). Por eso el guion prueba «cuenta borrada» borrando `auth.users`, no poniendo `uid = null` a mano: eso descuadra la mesa.

## 2 · El guion PGlite `med1a`

| Grupo | Filas | Qué prueba |
|---|---|---|
| A | 11 | Columnas, FK en cascada, checks e índices de `eventos` y `sesiones`; RLS sin políticas y sin privilegios del cliente; los disparadores de inmutabilidad; las dos RPC (`definer`, una firma, `authenticated` sí y `anon` no); `origen` y sus permisos; el disparador `ingreso`; `aplicar_efectos` con lo nuevo y lo de antes |
| B | 25 | Inmutabilidad (`update`, `delete`, `truncate`); checks de `tipo` y `datos`; el cliente no toca las tablas a mano; `latido_sesion` en sus cinco ramas; `registrar_evento` (lista, sin sesión, tope de 30); `ingreso` (mismo día, otro día, `constancia_admin`); los tres `anuncio_*` con su cuenta y con la cuenta borrada; sin dinero y la mesa cuadra; el tipo desconocido sigue fallando; siete anuncios mal formados no tumban la jugada; la cascada; `origen` (formato, los cuatro valores, una sola escritura); sin perfil, las dos RPC dan `false` |

`npm run guiones`: **VERDE · 22 migraciones · 11 guiones × 2 pasadas**, `med1a` 36/36 en las dos y sin rastro; los diez de antes, sin cambio.

## 3 · El árbitro (tramo B)

`src/arbitro/partida.js`, Contrato v1.6. La apertura se deriva del vencimiento (`vencimiento.hora − ESPERA_PAUSA_ANUNCIO_MS`): el tope es constante y no hace falta guardar `abiertaEn`.

| Momento | Efecto | Dónde |
|---|---|---|
| Se abre la pausa | `anuncio_inicio { asiento, mano }`, uno por asiento que ve el anuncio | `trasManoSiguiente` (`partida.js:335-355`) |
| «Omitir» | `anuncio_omitido { asiento, mano, ms }`, solo si el asiento estaba en el anuncio (lo demás es un rechazo y no emite) | `volverAnuncio` (`partida.js:518-526`) |
| Vencen los 30 s | `anuncio_vuelto { …, como: 'tope' }` por quien seguía | `cerrarPausa(…, 'tope')` desde el vencimiento |
| Quedan ≤ 1 que sigan | `anuncio_vuelto { …, como: 'mesa' }` por quien seguía | `seguirPausa` → `cerrarPausa(…, 'mesa')`, también al abandonar |

`ms` es `Math.max(0, Math.round(ahora − apertura))` (`partida.js:328`): dos instancias de la función pueden discrepar unos ms de reloj, y un negativo sería una `medicion_invalida`. Quien abandona dentro de la pausa no emite vuelta (su `enAnuncio` se apaga al marcarlo): su fila es `anuncio_inicio` sin cierre.

**El cliente y el imitado no cambian.** `supabase/functions/partida/nucleo.js:21` importa el árbitro por ruta relativa: el deploy lo empaqueta desde `src/`. `src/dev/partidaImitada.js` solo lee los efectos `recarga` (`:78-79`) e ignora los demás.

**Pruebas** (`src/arbitro/arbitro.test.js`):
- **Seis nuevas** en «MED-1a · la pausa medida»: la apertura (con un Premium y sin pausa en la mano 6), «Omitir» a los 5.012 ms (con la segunda pulsación y el Premium sin efecto), el último que vuelve sin `anuncio_vuelto`, el tope a los 30.000 ms (con el dinero quieto y un `volver_anuncio` tardío sin efecto), la mesa que se vacía (con la mesa de 3 que no se cierra), y el reloj adelantado que da 0.
- **Dos aserciones al día,** que fijaban la lista exacta de efectos al abrirse la pausa (`quien no cubre el ante…` y `la oferta sigue viva…`): ahora llevan los `anuncio_inicio`.
- **Una propiedad nueva** en las partidas al azar: todo `anuncio_*` sale con exactamente los campos de su tipo, enteros en rango, `ms ≥ 0` y `como` válido, es decir, con la forma que la base entiende (**la regla 1 del lado del árbitro: nunca produce una `medicion_invalida`**), y cada cierre llega después de su apertura y una sola vez. El azar pasa por los tres tipos (`anuncio_vuelto` «mesa» no siempre: lo cubre su prueba).

**Control rojo** (`git stash` de `partida.js`, es decir, el árbitro de `1b35256`, con las pruebas nuevas): **9 fallan** (las 6 nuevas, las 2 aserciones al día y la cobertura de la propiedad), 97 pasan. Con el cambio: **509/509** en `src/arbitro`, `partidaImitada.test.js` y `testFuncionPartida.test.js`.

## 4 · Documentos (tramo C)

- **Contrato v1.6**, mismo archivo: título, línea «Al día con MED-1a, tanda 1», abreviatura `med1a`; §2 `volver_anuncio` (su efecto); §6 «Publicidad», fila «Lo que se mide (v1.6)», con «el anuncio es simulado: no existe “visto entero”»; §7, «Los efectos de medición (v1.6)», con la tabla y la regla; §9, la fila de MED-1a. **Nota:** el §7 no tenía una «tabla de efectos»; los efectos estaban repartidos en sus filas. Se añadió como subsección corta.
- **Invariantes:** INV-87 (nueva), con el guion `med1a` y `arbitro.test.js` de vigilantes; recuento 87 filas, 81 vigiladas; «Actualizado».

## 5 · Los controles del §6

Sobre el árbol con todo (`1b35256-dirty`):

| Vara | Resultado |
|---|---|
| `eslint` | 0 errores y 0 avisos, igual a la base |
| `vitest` | 109/109 archivos, 2.985 pruebas, 0 fallidas, 0 omitidas |
| `build` | compila |
| `guiones` | VERDE · **22** migraciones · 11 guiones × 2 pasadas · `med1a` 36/36 en las dos, sin rastro |
| `1.8b` | **177,9 KiB** en el cable (JS 149,8 · CSS 21,4 · HTML 2,1 · resto 4,6): **no se mueve**. El árbitro entra por `partidaCliente.js`, que va en un trozo diferido, no en la entrada. Meta 185, techo 200 |
| `pvp.mesa` | verde · aislamiento verde (144 contextos, 0 a Supabase) · 7 min 27 s |
| `pvp.lm` | verde · aislamiento verde (398 contextos, 0 a Supabase) · 7 min 42 s |

**Cada letra construye sola** (`npm run aislado -- <sha> --perfil=rapido`, sobre commits sueltos hechos con un índice temporal, sin tocar la rama):

| Letra | Árbol | Resultado |
|---|---|---|
| 1-a | `f59b2e8` | verde · vitest 2.978 pruebas · eslint 0/0 · build |
| 1-b | `5d944cf` | verde · vitest 2.984 (+6, las nuevas del árbitro) · eslint 0/0 · build |
| 1-c | el árbol completo | el de arriba: 2.985 (+1, la fila INV-87 de `testInvariantes`) |

El aislado `rapido` no corre `guiones`; lo que el corredor lee (`supabase/` y `scripts/eco/`) es idéntico en 1-a y en el árbol completo, así que la corrida de arriba vale para 1-a.

## 6 · Lo que hereda la tanda 2

- **`ajilei.origen`**, la clave de `localStorage` del primer toque (30 días, con `llegada`), que `src/lib/origen.js` escribe desde `main.jsx` y `perfilApi.crear` lee para el `insert` del Bautizo. Entra en el censo de INV-12. Sin datos, `origen = 'directo'`. Formato: `^(directo|utm:[a-z0-9_-]{1,40}|invitacion|tienda)$` — **`origen.js` normaliza la campaña `utm` antes de guardarla**: minúsculas, solo `[a-z0-9_-]` (lo demás fuera) y recorte a 40, para que el check nunca haga fallar el Bautizo. Una campaña que queda vacía tras normalizar cuenta como `directo`.
- **`origen_datos`** ≤ 2 KB (`pg_column_size`): `utm_*`, `sala`, `zona_horaria`, `idioma`, `llegada`. Recortar cada valor en el cliente.
- **El latido:** `latido_sesion(id)` cada 60 s con la app visible; parado al ocultarse; menos de 5 min oculta, la misma sesión; más, `crypto.randomUUID()` nuevo. Un `false` = abrir sesión nueva (ajena, más de 10 min, o aún sin perfil: tras el Bautizo, el siguiente latido ya entra). Apagado con el bypass y la simulación. En las consultas, fuera de la media las de menos de 30 s.
- **`pvp_reconexion`** por `registrar_evento('pvp_reconexion', { via: 'arranque' | 'canal' })`; `false` no es un error que enseñar.
- **Sin acción, anotado:** `latido_sesion` no limita cuántas sesiones nuevas abre una cuenta (cada id nuevo es una fila). La ficha no lo pide; si el volumen de `sesiones` se dispara en la ola 0, un tope por minuto como el de `registrar_evento`.
- **Para las consultas (tanda 3):** `medicion_invalida` debería ser siempre 0; una fila es un defecto del árbitro que mirar. La consulta de la pausa cuenta un `anuncio_inicio` sin cierre (ni `anuncio_omitido` ni `anuncio_vuelto` del mismo asiento, sala y mano) como **«no volvió»**: es quien abandonó dentro de la pausa.
