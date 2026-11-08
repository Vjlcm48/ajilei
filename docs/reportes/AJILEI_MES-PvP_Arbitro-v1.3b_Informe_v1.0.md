# AJILEI · MES-PvP · Árbitro v1.3-b · Informe · v1.0

**Ficha:** `AJILEI_MES-PvP_Arbitro-v1.3b_v1.0.md` · **Base:** `8b89eb9` (v1.3-a) · **Diseño de referencia:** el bloque D de la Fase 0 (`docs/reportes/AJILEI_MES-PvP_Arbitro-v1.3_Fase0_Informe_v1.0.md`), con las decisiones de Victor sobre su §P.
**Estado:** STOP-C, cinco commits sin push. Sin nube: ni `db push`, ni deploy, ni consultas a la base real. El paso a la nube está en el §4, listo para copiar.

## Resumen

- **La recarga PvP pasa del imitado al árbitro real, a la función y a la base.** Tres acciones (`recargar`, `pedir_recarga`, `anular_recarga`), el movimiento `recarga_pvp` en el libro, y el dinero en la misma transacción que la jugada.
- **El saldo llega por la llamada y nunca se guarda en el estado.** `leer_partida` lo lee junto a la partida. Si al escribir ya no alcanza, la función relee una sola vez.
- **El cliente lee la recarga de la vista real.** La capa ya no la calcula ella. El imitado va sobre el árbitro real con saldos por asiento.
- **El Contrato pasa a v1.3** y recoge también lo del v1.3-a.
- **No se tocaron** `GameTable.jsx`, `config/reacciones.js` ni ningún protegido. Contra las IAS no cambia nada: la mesa ya leía la marca `recarga` de cada asiento, que llega por `vistaAMesa`.

---

## 1 · Lo hecho

### El árbitro

| Qué | Dónde |
|---|---|
| La oferta dura 15 s (provisional) | `src/config/esperas.js:67` |
| La clase `oferta_recarga` | `src/arbitro/reloj.js:30` |
| Cuatro motivos nuevos: `sin_recarga`, `saldo_insuficiente`, `ya_pedida` y `sin_pedido` (19 en total) | `src/arbitro/motivos.js:29-32` |
| Las tres acciones entran en `ACCIONES_ARBITRO` y en las simultáneas | `src/arbitro/partida.js:65`, `:74` |
| `FUERA` (`oferta` o `mano`) y `CANCELADA_SALDO` | `src/arbitro/partida.js:80-81` |
| R2 cuenta a quien está sentado fuera | `src/arbitro/partida.js:100` |
| `recargaActiva`: sin `estado.entrada` (R-4) no hay recarga | `src/arbitro/partida.js:157` |
| `enPausaEntreManos`: la pausa de la mano, la de anuncio o la retención | `src/arbitro/partida.js:162` |
| El saldo se lee de la llamada; sin él, no alcanza | `src/arbitro/partida.js:167` |
| `aplicarRecarga`: la pila vuelve a la entrada y emite el efecto `recarga {asiento, monto, mano}`. No usa `aplicarRecarga` del motor | `src/arbitro/partida.js:179` |
| Los pedidos se resuelven al cerrarse la mano: se aplican, se cancelan en silencio o se cancelan por saldo (`cancelada: {motivo:'saldo', mano}`) | `src/arbitro/partida.js:191` |
| Quien no cubre el ante recibe la oferta | `src/arbitro/partida.js:213` |
| `cerrarMano`: los efectos van `[mano_cerrada, …salidas, …recargas]`; las pilas del cierre, sin la recarga | `src/arbitro/partida.js:228-245` |
| `empezarMano` no liquida a quien está sentado fuera | `src/arbitro/partida.js:299-301` |
| La oferta sigue viva en la pausa de anuncio | `src/arbitro/partida.js:330` |
| `resolverOfertas`: primera vez, sentado fuera; segunda, sale con su residuo; en la mesa de 2, la retención de 15 s | `src/arbitro/partida.js:355-368` |
| Recargar en la retención la resuelve en la misma jugada | `src/arbitro/partida.js:372` |
| `recargar`: en la pausa, en el acto; sentado fuera durante la mano, queda pedida (P-6) | `src/arbitro/partida.js:509` |
| `pedir_recarga` y `anular_recarga` | `src/arbitro/partida.js:530`, `:539` |
| Al vencer `oferta_recarga` salen los que no decidieron; no cuenta para la ausencia | `src/arbitro/partida.js:616` |
| Abandonar limpia la oferta y el pedido | `src/arbitro/partida.js:720` |
| El saldo entra transitorio y se quita antes de devolver el estado | `src/arbitro/partida.js:756-757` |
| `aplicarAccion` y `abandonarPorServidor` aceptan `saldos` | `src/arbitro/partida.js:780`, `:799` |
| `crearPartida` guarda `entrada` = `ENTRADAS[entrada] × apuesta` | `src/arbitro/partida.js:833` |

### La vista

| Qué | Dónde |
|---|---|
| La marca pública por asiento: `decide` en la pausa, `fuera` durante la mano | `src/arbitro/vista.js:22`, `:41` |
| El sentado fuera sale con `eliminated: false`, retirado y sin cartas. Es obligatorio por el cliente publicado, que con `eliminated` enseña la pantalla final | `src/arbitro/vista.js:24-43` |
| La recarga privada: `{monto, oferta, pedida, cancelada, recargas}`, o `null` sin `entrada`. El saldo no va | `src/arbitro/vista.js:49`, `:126` |

### La función

| Qué | Dónde |
|---|---|
| Las tres acciones entran en las simultáneas | `supabase/functions/partida/nucleo.js:27` |
| Los saldos de `leer_partida` llegan al árbitro | `supabase/functions/partida/nucleo.js:175` |
| Si `guardar_jugada` lanza `saldo_insuficiente`, relee y rejuega **una sola vez**, con registro | `supabase/functions/partida/nucleo.js:31`, `:270-286` |

### La base: `supabase/migrations/20261108120000_mespvp_v13_recarga.sql`

| Qué | Dónde |
|---|---|
| El CHECK del libro con `recarga_pvp` | `:29` |
| `neto_jugador_mesa` y `neto_mesa` cuentan `recarga_pvp` | `:41`, `:56` |
| `aplicar_efectos`, redefinida entera, con la rama `recarga`. La clave es `recarga_pvp:<sala>:<uid>:<mano>`. Sin saldo, lanza `saldo_insuficiente` y se deshace la jugada entera. Una clave repetida da `estado_incoherente`. Sube `entrada` y `pila` del asiento | `:85`, `:150-160` |
| `leer_partida` con `saldos bigint[]`: `drop` y `create`, `revoke` a `public`, `anon` y `authenticated`, y `grant` a `service_role` | `:208-234` |
| Grupos A (2 filas) y B (7 filas), comentados; las cuentas de prueba se borran con `v13rec_deshacer` | `:248`, `:277` |
| Los guiones de `cfg1e` y `tie1a` admiten el tipo 14 | `supabase/pruebas/cfg1e_verificacion.sql`, `supabase/pruebas/tie1a_verificacion.sql` |

### El cliente y el imitado

| Qué | Dónde |
|---|---|
| `CLASE_OFERTA_RECARGA` | `src/lib/partidaCliente.js:49` |
| `recargaDeVista(vista, {saldo, entrada})`: lo que pinta la capa sale de la vista. Se quita `pedidoEnLaPausa`, que ahora hace el árbitro | `src/lib/entreManosCore.js:51-69` |
| La foto lleva la vista cruda y el desfase con el reloj del servidor; la billetera se relee cuando cambian las recargas | `src/hooks/mesaPvPCore.js:88-92`, `:145-157` |
| Las recargas propias llegan a la mesa | `src/lib/vistaAMesa.js:100` |
| La neta final: `cobrado − (entrada de la mesa + recargas)` | `src/hooks/vozHumanos.js:135` |
| `RecargaPvP` lee la vista y envía con `foto.enviar`; ante `saldo_insuficiente` relee la billetera | `src/screens/RecargaPvP.jsx:62-64`, `:104-108` |
| `PartidaPvP` monta la recarga también con la mesa real, y pasa el desfase | `src/screens/PartidaPvP.jsx:126`, `:160-161` |
| El imitado, sobre el árbitro real con saldos por asiento (rivales con 99.999) | `src/dev/partidaImitada.js:40`, `:72-84` |
| `recarga-rival` solo en la mesa de 2; el mando ajusta `n` a las mesas en que cabe cada escena | `src/dev/partidaImitada.js:458`, `:593` |
| `repintar()` para las varas | `src/dev/partidaImitada.js:908` |

### La neta de la pantalla final, sin doble cuenta

`entrada` es la de la mesa: la de la sala por la apuesta. No es `partida_asientos.entrada`, que la base sube con cada recarga. `recargas` sale de la vista privada. Con el imitado: quiebra, recarga 1.500 y se va con 1.500, y la neta da **−1.500**. Sin restar la recarga daría 0; con la entrada de la base, −3.000.

### El Contrato v1.3 (`docs/AJILEI_MOT-1_Contrato_v1.0.md`)

| § | Qué cambió |
|---|---|
| Cabecera | La línea v1.3 y las abreviaturas de las 3 migraciones |
| §2 | Nueve acciones, con las fichas de `recargar`, `pedir_recarga` y `anular_recarga`. Se validan contra `mano`; el saldo llega por la llamada. «Ahora no» no es una acción. El mensaje va aparte |
| §3 B | Los 7 motivos nuevos del v1.3; 19 en total |
| §4 | `sorteo.elegidas`, la marca pública `recarga`, el sentado fuera con `eliminated: false` y la recarga privada. El saldo no va en la vista |
| §5 | El evento `mensaje` como excepción escrita a «solo versiones». `leer_partida` con `saldos` |
| §6 | El reparto del sorteo por participantes, el volteo de 5 s y `oferta_recarga` (15 s, provisional, no cuenta para la ausencia). «La recarga», y la reposición uno a uno pendiente para la v1.4 |
| §7 | `recarga_pvp`, el cuadre con recargas, la neta con la entrada de la mesa, y ni tope ni válvula |
| §9 | La sub-tanda 5 y los dos matices de A2, anotados sin corregir |

---

## 2 · Las varas y sus controles rojos

Cada vara nueva se probó con su control: mutar, correr, ver ROJO y restaurar.

| Vara | Control rojo |
|---|---|
| Árbitro: el pedido aplicado, cancelado sin necesidad y cancelado por saldo | El pedido no mira el saldo: cae 1 |
| Árbitro: oferta, sentado fuera, vuelta con la recarga pedida (P-6) y salida a la segunda | `empezarMano` liquida al sentado fuera: caen 4. Sentado fuera, recargar mueve dinero dentro de la mano: cae 1 |
| Árbitro: la retención en la mesa de 2, recargando y sin recargar | Sin retención: caen 2 |
| Árbitro: R2 cuenta a quien está fuera | `sentados()` sin él: cae 1 |
| Árbitro: el sentado fuera sale en la vista con `eliminated: false` | Sin forzarlo: cae 1 |
| Árbitro: oferta en el anuncio, abandono con pedido y con oferta, R-4 con estados v1.2 y v1.3-a, el saldo no se guarda | Guardar el saldo: cae 1 |
| Propiedad, mesas de 2 a 5 con recargas al azar: dinero, versión, idempotencia y relojes | La recarga anota 1 HC de más: caen 5 |
| Función: los saldos llegan al árbitro | Sin pasarlos: caen 2 |
| Función: el reintento por saldo es único | Sin reintento: caen 2. Sin tope: bucle sin fin, el worker se cuelga y la corrida sale con error |
| Cliente: `recargaDeVista` | Sin reconocer al sentado fuera: cae 1. Sin ver la retención: cae 1 |
| La neta final resta lo recargado | Sin restarlo: cae 1 |
| El imitado sobre el árbitro real, con saldo | Sin saldos: cae 1 |
| Vara de fuente: la recarga de la lámina solo vive detrás de la puerta DEV | Las líneas de la capa en `8b89eb9` caen |
| `diagDSK pvp` · `v13·recarga-vista`, 6 casos | La misma vista sin recarga (R-4) no casa: rojo en 6 de 6 |
| Migración en PGlite, con las dos del v1.3: **19/19 PASA, sin rastro** | Sin `anon` en el `revoke` de `leer_partida`: cae A4 (18/19, `anon=t`). Sin el `revoke` entero: cae A4. `neto_mesa` sin `recarga_pvp`: el Grupo B se para con `estado_incoherente` (13/14) |

**Sin el `grant` de `leer_partida` el banco sigue en 19/19.** Supabase da `execute` a `service_role` en toda función nueva por sus privilegios por defecto, y el andamio lo copia (`scripts/guiones.mjs:106`). El `grant` explícito se queda como cinturón. Por la misma razón, `anon` y `authenticated` también lo reciben por defecto: lo que A4 vigila es que el `revoke` los quite a los dos.

**Controles generales:**
- eslint: 0.
- `npm test`: 108 archivos y 2.895 pruebas (antes 2.877).
- `npm run guiones`: verde, con 19 migraciones.
- `diagDSK pvp`: 20/20 celdas, 62/62 escenas y 91/91 varas (88 + 3 del v1.3), código 0.
- `1.8b`: 176,9 KiB antes y después (639,2 en crudo).
- `git diff` vacío en `GameTable.jsx`, `config/reacciones.js` y los siete protegidos.

**Dos fallos del andamio, arreglados y contados (regla andamio/commit):**
- **La primera corrida de `diagDSK pvp` dio 89/90.** El control de `v13·mensaje-id` repintaba con la API de recarga del imitado, que este v1.3-b quita. Pasó a `repintar()`, y la segunda corrida salió verde.
- **El primer control rojo del imitado sin saldos no cayó:** ninguna prueba recorría esa ruta. Se añadió la prueba del pedido aplicado en vivo con saldo, y con ella cae.

---

## 3 · Commits

El commit 3 quita la API `p.recarga` del imitado, que usaba el control de `v13·mensaje-id`. Por eso `scripts/pvp/arbitro13LM.mjs` va en el 3 en versión intermedia (solo `repintar()`) y se completa en el 4.

| # | SHA | Título | `npm run aislado -- --perfil=commit` |
|---|---|---|---|
| 1 | `ad85b1f` | MES-PvP v1.3b-a · la recarga en el núcleo del árbitro | Verde · 2.888 pruebas · eslint 0 · 1.8b y humo en 0 |
| 2 | `e78d9d0` | MES-PvP v1.3b-b · la recarga en la función y la base | Verde · 2.892 pruebas · eslint 0 · 1.8b y humo en 0 |
| 3 | `8095995` | MES-PvP v1.3b-c · el cliente: la recarga sobre la vista real | Verde · 2.895 pruebas · eslint 0 · 1.8b y humo en 0 |
| 4 | `7516900` | MES-PvP v1.3b-d · vara v13·recarga-vista | Verde · 2.895 pruebas · eslint 0 · 1.8b y humo en 0 |
| 5 | este | MES-PvP v1.3b-e · Contrato v1.3 e informe | Solo documentos; su aislado va en el STOP-C |

**Errata del mensaje del commit 2:** dice «Grupos A (2) y B (8)». El Grupo B de la recarga tiene **7 filas** (B1–B5, B8 y B9); B6 y B7 son del mensaje. No se reescribe, para no cambiar SHA ya probados.

`laminas/` queda fuera. Tras el commit 5, el árbol es idéntico al que se probó en el STOP-B: los 25 archivos coinciden con la copia guardada antes del primer `git add`.

---

## 4 · El paso a la nube

Lo hace Victor, en este orden. **Los commits ya están hechos:** la ventana en que ajilei.io sirve el cliente viejo frente al árbitro nuevo dura solo la prueba por túnel. Lo que ve ese cliente viejo está en la Fase 0, §F; no se rompe nada si la migración va antes que el deploy. Si el túnel encuentra un fallo, su arreglo va en un commit nuevo, antes del push.

### 4.1 · Las dos migraciones, con un solo `db push`

Primero, en seco, para ver que salen las dos y solo esas dos:

```
npx supabase db push --linked --dry-run
```

Debe listar `20261107200000_mespvp_v13_mensaje.sql` y `20261108120000_mespvp_v13_recarga.sql`. Luego:

```
npx supabase db push --linked
```

Las dos son compatibles con la función publicada (v1.2):
- `ultimo_mensaje` y `anotar_mensaje` no los usa nadie hasta el deploy.
- `aplicar_efectos` acepta los mismos efectos de antes, más `recarga`.
- `leer_partida` devuelve una columna de más, y la función v1.2 desestructura la fila.

**Si `db push` falla, se para aquí.** Ni deploy ni push.

### 4.2 · Los Grupos A y B de las dos migraciones, en el SQL Editor

En este orden, cada bloque en una pestaña nueva y entero. Todas las filas tienen que decir **PASA**. Los Grupos B crean cuentas de prueba y las borran al final.

**1 · Mensaje · Grupo A** (3 filas: A2, A3, A5)

```sql
with c(orden, comprobacion, v, ok) as (
  select 2, 'A2 · partida_asientos.ultimo_mensaje existe, timestamptz y nula por defecto',
         coalesce((select format('%s · nula=%s · defecto=%s', data_type, is_nullable, coalesce(column_default, 'ninguno'))
                     from information_schema.columns
                    where table_schema = 'public' and table_name = 'partida_asientos' and column_name = 'ultimo_mensaje'), 'no está'),
         coalesce((select data_type = 'timestamp with time zone' and is_nullable = 'YES' and column_default is null
                     from information_schema.columns
                    where table_schema = 'public' and table_name = 'partida_asientos' and column_name = 'ultimo_mensaje'), false)
  union all
  select 3, 'A3 · anotar_mensaje: solo service_role, security definer y search_path vacío',
         format('servicio=%s · aut=%s · anon=%s · definer=%s · config=%s',
                has_function_privilege('service_role', 'public.anotar_mensaje(uuid, uuid)', 'execute'),
                has_function_privilege('authenticated', 'public.anotar_mensaje(uuid, uuid)', 'execute'),
                has_function_privilege('anon', 'public.anotar_mensaje(uuid, uuid)', 'execute'),
                (select prosecdef from pg_proc where oid = 'public.anotar_mensaje(uuid, uuid)'::regprocedure),
                (select proconfig::text from pg_proc where oid = 'public.anotar_mensaje(uuid, uuid)'::regprocedure)),
         has_function_privilege('service_role', 'public.anotar_mensaje(uuid, uuid)', 'execute')
         and not has_function_privilege('authenticated', 'public.anotar_mensaje(uuid, uuid)', 'execute')
         and not has_function_privilege('anon', 'public.anotar_mensaje(uuid, uuid)', 'execute')
         and (select prosecdef from pg_proc where oid = 'public.anotar_mensaje(uuid, uuid)'::regprocedure)
         and (select 'search_path=""' = any (proconfig) from pg_proc where oid = 'public.anotar_mensaje(uuid, uuid)'::regprocedure)
  union all
  select 5, 'A5 · partida_asientos y partidas siguen sin políticas ni privilegios del cliente',
         format('políticas=%s · select aut=%s · update aut=%s',
                (select count(*) from pg_policies where schemaname = 'public' and tablename in ('partida_asientos', 'partidas')),
                has_table_privilege('authenticated', 'public.partida_asientos', 'select'),
                has_table_privilege('authenticated', 'public.partida_asientos', 'update')),
         (select count(*) from pg_policies where schemaname = 'public' and tablename in ('partida_asientos', 'partidas')) = 0
         and not has_table_privilege('authenticated', 'public.partida_asientos', 'select')
         and not has_table_privilege('authenticated', 'public.partida_asientos', 'update')
         and not has_table_privilege('anon', 'public.partida_asientos', 'select')
)
select comprobacion as "comprobación",
       case when ok then 'PASA' else 'FALLA' end as resultado,
       v as detalle
  from c
 order by orden;
```

**2 · Mensaje · Grupo B** (7 filas: B6a–d, B7a–c)

```sql
create or replace function pg_temp.v13m_fila(p_o integer, p_c text, p_ok boolean, p_d text)
returns jsonb language sql immutable as $fn$
  select jsonb_build_object('o', p_o, 'c', p_c, 'r', case when p_ok then 'PASA' else 'FALLA' end, 'd', coalesce(p_d, '(sin detalle)'))
$fn$;

create or replace function pg_temp.v13m_b()
returns table (orden integer, comprobacion text, resultado text, detalle text)
language plpgsql
as $fn$
declare
  U1 constant uuid := 'a13a0000-0000-4000-8000-000000000001';
  U2 constant uuid := 'a13a0000-0000-4000-8000-000000000002';
  U3 constant uuid := 'a13a0000-0000-4000-8000-000000000003';
  CIEN constant bigint := 100000;
  f  jsonb := '[]';
  s  public.salas;
  j  jsonb;
  j2 jsonb;
  t1 timestamptz;
begin
  begin
    insert into auth.users (id, instance_id, aud, role, email, encrypted_password,
                            created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
    select u, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
           'v13msj.' || right(u::text, 2) || '@example.invalid', '', now(), now(), '{}', '{}'
      from unnest(array[U1, U2, U3]) u;
    insert into public.profiles (id, username)
    select u, 'v13msj_verif' || right(u::text, 2) from unnest(array[U1, U2, U3]) u;
    perform public.ajuste_admin(u, CIEN - public.saldo_de(u), 'MES-PvP v1.3 · verificación') from unnest(array[U1, U2]) u;
    delete from public.intentos_dinero where jugador_id in (U1, U2);

    -- Una mesa de 2 arrancada y su partida, por el camino de siempre.
    perform set_config('request.jwt.claims', json_build_object('sub', U1)::text, true);
    s := public.crear_sala('privada', 2::smallint, 100);
    perform set_config('request.jwt.claims', json_build_object('sub', U2)::text, true);
    perform public.unirse_sala(null, s.id);
    perform set_config('request.jwt.claims', json_build_object('sub', U1)::text, true);
    perform public.jugar_ya(s.id);
    perform set_config('request.jwt.claims', '', true);
    j := public.crear_partida(s.id, '{"version":0}'::jsonb, null,
                              jsonb_build_object(U1::text, 0, U2::text, 1),
                              '[{"asiento":0,"vista":{}},{"asiento":1,"vista":{}}]'::jsonb);

    -- ── B6 · el freno de 10 s ──────────────────────────────────────────────────
    j := public.anotar_mensaje(s.id, U1);
    select ultimo_mensaje into t1 from public.partida_asientos where sala_id = s.id and uid = U1;
    f := f || pg_temp.v13m_fila(601, 'B6a · el primero pasa, devuelve su asiento y anota la hora',
              j ->> 'ok' = 'true' and (j ->> 'asiento')::int = 0 and t1 = now(), j::text);

    j := public.anotar_mensaje(s.id, U1);
    f := f || pg_temp.v13m_fila(602, 'B6b · el segundo dentro de los 10 s rebota con freno y no mueve la hora',
              j ->> 'ok' = 'false' and j ->> 'motivo' = 'freno'
              and (select ultimo_mensaje from public.partida_asientos where sala_id = s.id and uid = U1) = t1, j::text);

    j := public.anotar_mensaje(s.id, U2);
    f := f || pg_temp.v13m_fila(603, 'B6c · el freno es por jugador: el otro pasa', j ->> 'ok' = 'true' and (j ->> 'asiento')::int = 1, j::text);

    update public.partida_asientos set ultimo_mensaje = now() - interval '9.999 seconds' where sala_id = s.id and uid = U1;
    j := public.anotar_mensaje(s.id, U1);
    update public.partida_asientos set ultimo_mensaje = now() - interval '10 seconds' where sala_id = s.id and uid = U1;
    j2 := public.anotar_mensaje(s.id, U1);
    f := f || pg_temp.v13m_fila(604, 'B6d · a 9,999 s rebota; a los 10 s justos pasa', j ->> 'motivo' = 'freno' and j2 ->> 'ok' = 'true',
              format('9,999 s → %s · 10 s → %s', j, j2));

    -- ── B7 · ajeno, cobrado o partida terminada ───────────────────────────────
    j := public.anotar_mensaje(s.id, U3);
    f := f || pg_temp.v13m_fila(701, 'B7a · una cuenta sin asiento en la mesa: no_es_de_esta_mesa',
              j ->> 'ok' = 'false' and j ->> 'motivo' = 'no_es_de_esta_mesa', j::text);

    j := public.guardar_jugada(s.id, 0, '{"version":1}'::jsonb, null,
                               '[{"asiento":0,"vista":{}},{"asiento":1,"vista":{}}]'::jsonb, false,
                               '[{"tipo":"salida","asiento":1,"monto":1500}]'::jsonb);
    update public.partida_asientos set ultimo_mensaje = null where sala_id = s.id;
    j2 := public.anotar_mensaje(s.id, U2);
    f := f || pg_temp.v13m_fila(702, 'B7b · quien ya cobró no habla, aunque no tenga freno',
              j ->> 'ok' = 'true' and j2 ->> 'ok' = 'false' and j2 ->> 'motivo' = 'no_es_de_esta_mesa', format('salida=%s · mensaje=%s', j, j2));

    update public.partidas set terminada_en = now() where sala_id = s.id;
    j := public.anotar_mensaje(s.id, U1);
    f := f || pg_temp.v13m_fila(703, 'B7c · con la partida terminada nadie habla',
              j ->> 'ok' = 'false' and j ->> 'motivo' = 'no_es_de_esta_mesa', j::text);

    raise exception 'v13msj_deshacer';
  exception when others then
    if sqlerrm <> 'v13msj_deshacer' then
      f := f || pg_temp.v13m_fila(9999, 'X · el guion se detuvo', false, sqlstate || ' · ' || sqlerrm);
    end if;
  end;

  return query
    select (e ->> 'o')::integer, e ->> 'c', e ->> 'r', e ->> 'd'
      from jsonb_array_elements(f) e;
end
$fn$;

select comprobacion as "comprobación", resultado, detalle
  from pg_temp.v13m_b()
 order by orden;
```

**3 · Recarga · Grupo A** (2 filas: A1, A4)

```sql
with c(orden, comprobacion, v, ok) as (
  select 1, 'A1 · el CHECK del libro admite recarga_pvp y conserva los demás tipos',
         (select pg_get_constraintdef(oid) from pg_constraint where conrelid = 'public.movimientos'::regclass and conname = 'movimientos_tipo_chk'),
         (select pg_get_constraintdef(oid) like '%garantia_pvp%liberacion_pvp%resultado_pvp%recarga_pvp%consulta%'
            from pg_constraint where conrelid = 'public.movimientos'::regclass and conname = 'movimientos_tipo_chk')
  union all
  select 4, 'A4 · leer_partida: devuelve los saldos, solo service_role, security definer y search_path vacío',
         format('devuelve=%s · servicio=%s · aut=%s · anon=%s · definer=%s · config=%s',
                pg_get_function_result('public.leer_partida(uuid)'::regprocedure),
                has_function_privilege('service_role', 'public.leer_partida(uuid)', 'execute'),
                has_function_privilege('authenticated', 'public.leer_partida(uuid)', 'execute'),
                has_function_privilege('anon', 'public.leer_partida(uuid)', 'execute'),
                (select prosecdef from pg_proc where oid = 'public.leer_partida(uuid)'::regprocedure),
                (select proconfig::text from pg_proc where oid = 'public.leer_partida(uuid)'::regprocedure)),
         pg_get_function_result('public.leer_partida(uuid)'::regprocedure) like '%abandonos smallint[], saldos bigint[]%'
         and has_function_privilege('service_role', 'public.leer_partida(uuid)', 'execute')
         and not has_function_privilege('authenticated', 'public.leer_partida(uuid)', 'execute')
         and not has_function_privilege('anon', 'public.leer_partida(uuid)', 'execute')
         and (select prosecdef from pg_proc where oid = 'public.leer_partida(uuid)'::regprocedure)
         and (select 'search_path=""' = any (proconfig) from pg_proc where oid = 'public.leer_partida(uuid)'::regprocedure)
)
select comprobacion as "comprobación",
       case when ok then 'PASA' else 'FALLA' end as resultado,
       v as detalle
  from c
 order by orden;
```

**4 · Recarga · Grupo B** (7 filas: B1–B5, B8, B9)

```sql
create or replace function pg_temp.v13r_fila(p_o integer, p_c text, p_ok boolean, p_d text)
returns jsonb language sql immutable as $fn$
  select jsonb_build_object('o', p_o, 'c', p_c, 'r', case when p_ok then 'PASA' else 'FALLA' end, 'd', coalesce(p_d, '(sin detalle)'))
$fn$;

create or replace function pg_temp.v13r_b()
returns table (orden integer, comprobacion text, resultado text, detalle text)
language plpgsql
as $fn$
declare
  U1 constant uuid := 'a13b0000-0000-4000-8000-000000000001';
  U2 constant uuid := 'a13b0000-0000-4000-8000-000000000002';
  U3 constant uuid := 'a13b0000-0000-4000-8000-000000000003';
  U4 constant uuid := 'a13b0000-0000-4000-8000-000000000004';
  CIEN constant bigint := 100000;
  VISTAS constant jsonb := '[{"asiento":0,"vista":{}},{"asiento":1,"vista":{}}]';
  f  jsonb := '[]';
  s  public.salas;
  s2 public.salas;
  j  jsonb;
  e  text;
  lp record;
  n  integer;
  a0 public.partida_asientos;
  a1 public.partida_asientos;
begin
  begin
    insert into auth.users (id, instance_id, aud, role, email, encrypted_password,
                            created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
    select u, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
           'v13rec.' || right(u::text, 2) || '@example.invalid', '', now(), now(), '{}', '{}'
      from unnest(array[U1, U2, U3, U4]) u;
    insert into public.profiles (id, username)
    select u, 'v13rec_verif' || right(u::text, 2) from unnest(array[U1, U2, U3, U4]) u;
    perform public.ajuste_admin(u, CIEN - public.saldo_de(u), 'MES-PvP v1.3 · verificación') from unnest(array[U1, U2, U3, U4]) u;
    delete from public.intentos_dinero where jugador_id in (U1, U2, U3, U4);

    -- Una mesa de 2 de 100 (entrada corta, 1.500) arrancada y su partida, por el camino de siempre.
    perform set_config('request.jwt.claims', json_build_object('sub', U1)::text, true);
    s := public.crear_sala('privada', 2::smallint, 100);
    perform set_config('request.jwt.claims', json_build_object('sub', U2)::text, true);
    perform public.unirse_sala(null, s.id);
    perform set_config('request.jwt.claims', json_build_object('sub', U1)::text, true);
    perform public.jugar_ya(s.id);
    perform set_config('request.jwt.claims', '', true);
    j := public.crear_partida(s.id, '{"version":0}'::jsonb, null, jsonb_build_object(U1::text, 0, U2::text, 1), VISTAS);

    -- ── B9 · una partida con estado v1.2 sigue jugando ─────────────────────────
    -- Sin `entrada` en el estado y sin efecto `recarga`: los efectos de siempre, con la función nueva.
    j := public.guardar_jugada(s.id, 0, '{"version":1,"motor":{}}'::jsonb, null, VISTAS, false,
           '[{"tipo":"mano_cerrada","mano":1,"ganador":1,"sentados":2,"ajilei":0,"pilas":[700,2300]}]'::jsonb);
    select * into a0 from public.partida_asientos where sala_id = s.id and asiento = 0;
    f := f || pg_temp.v13r_fila(901, 'B9 · una jugada de la v1.2 (mano_cerrada, sin recarga) se guarda igual',
              j ->> 'ok' = 'true' and a0.pila = 700 and a0.entrada = 1500 and public.mesa_cuadra(s.id),
              format('%s · pila=%s · entrada=%s', j, a0.pila, a0.entrada));

    -- ── B1 · la recarga mueve −m y sube entrada y pila, con mesa_cuadra ──────────
    select * into lp from public.leer_partida(s.id);
    j := public.guardar_jugada(s.id, 1, '{"version":2}'::jsonb, null, VISTAS, false,
           '[{"tipo":"recarga","asiento":0,"monto":800,"mano":1}]'::jsonb);
    select * into a0 from public.partida_asientos where sala_id = s.id and asiento = 0;
    f := f || pg_temp.v13r_fila(101, 'B1 · la recarga cobra −800 con su clave, sube entrada y pila, y la mesa cuadra',
              j ->> 'ok' = 'true' and public.saldo_de(U1) = CIEN - 1500 - 800
              and a0.entrada = 2300 and a0.pila = 1500 and public.mesa_cuadra(s.id)
              and exists (select 1 from public.movimientos m where m.jugador_id = U1 and m.tipo = 'recarga_pvp' and m.monto = -800
                            and m.clave_idem = 'recarga_pvp:' || s.id || ':' || U1 || ':1' and m.ref_tipo = 'sala' and m.ref_id = s.id::text)
              and lp.saldos = array[CIEN - 1500, CIEN - 1500]::bigint[],
              format('%s · saldo=%s · entrada=%s · pila=%s · saldos leídos=%s', j, public.saldo_de(U1), a0.entrada, a0.pila, lp.saldos));

    -- ── B3 · la misma clave no cobra dos veces ─────────────────────────────────
    begin
      j := public.guardar_jugada(s.id, 2, '{"version":3}'::jsonb, null, VISTAS, false,
             '[{"tipo":"recarga","asiento":0,"monto":800,"mano":1}]'::jsonb);
      e := 'pasó';
    exception when others then e := sqlerrm;
    end;
    select count(*) into n from public.movimientos where clave_idem = 'recarga_pvp:' || s.id || ':' || U1 || ':1';
    select * into a0 from public.partida_asientos where sala_id = s.id and asiento = 0;
    f := f || pg_temp.v13r_fila(301, 'B3 · la misma recarga otra vez: la jugada entera se deshace y no cobra',
              e = 'estado_incoherente' and n = 1 and public.saldo_de(U1) = CIEN - 2300 and a0.entrada = 2300
              and (select version from public.partidas where sala_id = s.id) = 2,
              format('error=%s · líneas=%s · saldo=%s', e, n, public.saldo_de(U1)));

    -- ── B2 · sin saldo, la jugada entera se deshace ────────────────────────────
    perform public.ajuste_admin(U2, 100 - public.saldo_de(U2), 'MES-PvP v1.3 · verificación');
    begin
      j := public.guardar_jugada(s.id, 2, '{"version":3}'::jsonb, null, VISTAS, false,
             '[{"tipo":"mano_cerrada","mano":2,"ganador":0,"sentados":2,"ajilei":0,"pilas":[2800,1000]},{"tipo":"recarga","asiento":1,"monto":500,"mano":2}]'::jsonb);
      e := 'pasó';
    exception when others then e := sqlerrm;
    end;
    select * into a1 from public.partida_asientos where sala_id = s.id and asiento = 1;
    f := f || pg_temp.v13r_fila(201, 'B2 · sin saldo: saldo_insuficiente y nada cambia, ni el cierre de la mano',
              e = 'saldo_insuficiente' and public.saldo_de(U2) = 100 and a1.pila = 2300 and a1.entrada = 1500
              and (select version from public.partidas where sala_id = s.id) = 2,
              format('error=%s · saldo=%s · pila=%s', e, public.saldo_de(U2), a1.pila));

    -- ── B4 · la salida tras una recarga paga lo recargado; neto_mesa = 0 al terminar ──
    j := public.guardar_jugada(s.id, 2, '{"version":3}'::jsonb, null, VISTAS, true,
           '[{"tipo":"mano_cerrada","mano":2,"ganador":0,"sentados":2,"ajilei":0,"pilas":[3800,0]},{"tipo":"salida","asiento":0,"monto":3800},{"tipo":"salida","asiento":1,"monto":0},{"tipo":"partida_terminada","ganador":0}]'::jsonb);
    f := f || pg_temp.v13r_fila(401, 'B4 · al terminar paga la pila con lo recargado y el libro de la mesa queda en 0',
              j ->> 'ok' = 'true' and public.neto_mesa(s.id) = 0 and public.mesa_cuadra(s.id)
              and public.saldo_de(U1) = CIEN - 1500 - 800 + 3800 and public.neto_jugador_mesa(s.id, U1) = 1500,
              format('%s · neto_mesa=%s · saldo U1=%s · neto U1=%s', j, public.neto_mesa(s.id), public.saldo_de(U1), public.neto_jugador_mesa(s.id, U1)));

    -- ── B5 · una partida muerta con recarga cuadra ─────────────────────────────
    perform set_config('request.jwt.claims', json_build_object('sub', U3)::text, true);
    s2 := public.crear_sala('privada', 2::smallint, 100);
    perform set_config('request.jwt.claims', json_build_object('sub', U4)::text, true);
    perform public.unirse_sala(null, s2.id);
    perform set_config('request.jwt.claims', json_build_object('sub', U3)::text, true);
    perform public.jugar_ya(s2.id);
    perform set_config('request.jwt.claims', '', true);
    j := public.crear_partida(s2.id, '{"version":0}'::jsonb, null, jsonb_build_object(U3::text, 0, U4::text, 1), VISTAS);
    j := public.guardar_jugada(s2.id, 0, '{"version":1}'::jsonb, null, VISTAS, false,
           '[{"tipo":"mano_cerrada","mano":1,"ganador":1,"sentados":2,"ajilei":0,"pilas":[0,3000]},{"tipo":"recarga","asiento":0,"monto":1500,"mano":1}]'::jsonb);
    update public.partidas set actualizada_en = now() - interval '16 minutes' where sala_id = s2.id;
    perform 1 from public.salas where id = s2.id for update;
    perform public.cerrar_partida_muerta(s2.id);
    f := f || pg_temp.v13r_fila(501, 'B5 · la partida muerta paga pilas con lo recargado, cuadra y queda en 0',
              (select terminada_en is not null from public.partidas where sala_id = s2.id)
              and public.neto_mesa(s2.id) = 0 and public.mesa_cuadra(s2.id)
              and public.saldo_de(U3) = CIEN - 1500 and public.saldo_de(U4) = CIEN + 1500,
              format('neto_mesa=%s · U3=%s · U4=%s', public.neto_mesa(s2.id), public.saldo_de(U3), public.saldo_de(U4)));

    -- ── B8 · el efecto desconocido sigue lanzando ──────────────────────────────
    begin
      perform public.aplicar_efectos(s.id, '[{"tipo":"regalo","asiento":0,"monto":5}]'::jsonb, false);
      e := 'pasó';
    exception when others then e := sqlerrm;
    end;
    f := f || pg_temp.v13r_fila(801, 'B8 · un efecto desconocido sigue siendo estado_incoherente', e = 'estado_incoherente', e);

    raise exception 'v13rec_deshacer';
  exception when others then
    if sqlerrm <> 'v13rec_deshacer' then
      f := f || pg_temp.v13r_fila(9999, 'X · el guion se detuvo', false, sqlstate || ' · ' || sqlerrm);
    end if;
  end;

  return query
    select (x ->> 'o')::integer, x ->> 'c', x ->> 'r', x ->> 'd'
      from jsonb_array_elements(f) x;
end
$fn$;

select comprobacion as "comprobación", resultado, detalle
  from pg_temp.v13r_b()
 order by orden;
```

**5 · Sin rastro.** Las dos cifras tienen que ser 0:

```sql
select
  (select count(*) from auth.users
    where email like 'v13msj.%' or email like 'v13rec.%')                          as cuentas_de_prueba,
  (select count(*) from public.movimientos
    where tipo = 'recarga_pvp')                                                     as recargas_en_el_libro;
```

**Si una fila dice FALLA, se para aquí** y se pega el resultado. La migración ya está en la base, pero la función v1.2 no la usa: no hay prisa.

### 4.3 · Sin mesas vivas

Justo antes del deploy. Tiene que dar 0 filas:

```sql
select p.sala_id, p.version, p.creada_en, p.actualizada_en
  from public.partidas p
 where p.terminada_en is null
 order by p.actualizada_en desc;
```

Si sale alguna, se espera a que termine. Una partida que cruce el deploy se juega con los valores por defecto de R-4: sin recarga y con lo demás nuevo.

### 4.4 · El deploy de `partida`

```
npx supabase functions deploy partida --use-api --no-verify-jwt --project-ref cbbnddlapolelbdsprjm
```

### 4.5 · El túnel

S25 = `test1976`, Motorola = `ticotest2022`, PC. Mesas privadas, con el código tecleado a mano.

| Mesa | Qué mirar |
|---|---|
| 2 (S25 + Motorola) | El reparto del sorteo (unos 3,5 s) y que la carta elegida por el rival se vea en su posición · un mensaje y su freno (dos toques seguidos) · la recarga voluntaria en la pausa · `pedir_recarga` durante la mano con la pila por debajo de la entrada, y anularla · quiebra con la oferta: primero «Ahora no» y dejar vencer la retención (15 s, la partida termina bien); en otra partida, recargar dentro de la retención (la mano siguiente arranca en el acto) |
| 3 (+ PC) | El reparto de 5 s · sentado fuera una mano y vuelta con la recarga pedida · sentado fuera dos veces: sale con «Te quedaste sin fichas» y cobra su residuo |
| La transición entre manos con la mesa real | **Nuevo en el v1.3-b:** la foto de la mesa lleva ahora el desfase con el reloj del servidor, y la recogida de la transición de la L-M 3 también lo usa (antes valía 0). Mirar en las dos mesas que las cartas se recogen y la mano siguiente arranca a su hora, sin salto ni corte, y que el anillo de la oferta cuenta 15 s y no se adelanta ni se atrasa |
| Saldo insuficiente | Con el bloque de abajo, dejar a `ticotest2022` con la entrada de la mesa más 50. Al quebrar y pedir, no alcanza: la tarjeta lo dice y no se mueve dinero |
| El libro | Al final, la consulta de cuadre de abajo, con la sala de la partida que recargó |

Saldo justo para `ticotest2022`. Pon en `OBJETIVO` la entrada de la mesa más 50; por ejemplo, 800 en una mesa de 50 con entrada corta (750):

```sql
do $$
declare
  USUARIO  constant text   := 'ticotest2022';
  OBJETIVO constant bigint := 800;
  v_id uuid; v_saldo bigint; r public.movimiento_resultado;
begin
  select id into v_id from public.profiles where username = USUARIO;
  if v_id is null then raise exception 'STOP: no existe «%»', USUARIO; end if;
  select coalesce(b.saldo, 0) into v_saldo from public.billeteras b where b.jugador_id = v_id;
  if coalesce(v_saldo, 0) = OBJETIVO then raise notice 'ok: «%» ya tiene % HC', USUARIO, OBJETIVO; return; end if;
  r := public.ajuste_admin(v_id, OBJETIVO - coalesce(v_saldo, 0), 'MES-PvP v1.3-b · túnel · saldo justo para probar saldo_insuficiente');
  if not r.aplicado then raise exception 'STOP: el ajuste no se aplicó (%)', r.motivo; end if;
  raise notice 'ok: «%» pasa de % a % HC (para volver, OBJETIVO = %)', USUARIO, coalesce(v_saldo, 0), r.saldo, coalesce(v_saldo, 0);
end
$$;
```

El cuadre de una mesa con recargas, tras terminar. `neto_mesa` debe dar 0, y cada recarga aparece una vez:

```sql
select public.neto_mesa('<sala_id>'::uuid) as neto_mesa;

select m.tipo, m.monto, m.clave_idem, m.creado_en
  from public.movimientos m
 where m.clave_idem like 'recarga_pvp:<sala_id>:%'
 order by m.creado_en;
```

### 4.6 · El push

Con el túnel en verde. Sube los cinco commits del v1.3-a, los de la L-M 1, 2 y 3 que esperaban al árbitro, y estos cinco.

---

## 5 · Lo que queda para la sub-tanda 5

- **La reposición uno a uno, en el árbitro y en el cliente,** con la fórmula de la Fase 0 y Rápido ×0,5 (P-4). Toca `GameTable.jsx`: pide el control de las IAS.
- **La mudanza de las `D_*` a `esperas.js`** (`GameTable.jsx:263-269`).
- **Su deploy propio,** porque el árbitro y el cliente cambian a la vez.
- **El arranque** («Arrancando la partida…» frente al barajado de 1.950 ms), antes de quitar «Arrancando».
- **`OFERTA_RECARGA_MS` sigue provisional (15 s):** se confirma o se ajusta con lo que vea Victor en el túnel.
