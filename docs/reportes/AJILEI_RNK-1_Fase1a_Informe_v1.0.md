# AJILEI · RNK-1 · Fase 1a · Informe · v1.0

**Ficha:** `AJILEI_RNK-1_Fase1a_v1.0.md`, con el **Ajuste A** del rector (aprobado por Victor el 2026-10-24).
**Estado:** **cerrada en código.** El 2026-10-24 Victor aplicó el `db push` y corrió el guion en el SQL Editor: **37/37 PASA** (§3.2). Sin commits; la ficha de la 1b la escribe el rector.

---

## Resumen

- **Migración nueva:** `supabase/migrations/20261024191731_rnk1a_libro_puntos.sql`. Contiene:
  - las tablas `libro_puntos` y `puntos_totales`;
  - `informar_pila` con 7 parámetros (la firma de 5 se borra);
  - las RPC `ranking_top`, `ranking_mio` y `mini_perfil`;
  - el índice de Fortunas, dos columnas nuevas en `mesas_ia` y el puesto único del Ajuste A.
- **Guion de verificación:** `supabase/pruebas/rnk1a_verificacion.sql`. Devuelve **37 filas**: el Grupo A (A1–A12) y el Grupo B (B1–B25), en una sola tabla para el SQL Editor. Al final de la migración va una copia comentada, idéntica línea a línea (comprobado por script).
- **`npm run guiones`:** **VERDE**. Pasan las 10 migraciones, la nueva también. Los cuatro guiones pasan en las dos pasadas: `rnk1a` **37/37 PASA, sin rastro**, y 1a, 1d y 1g siguen 21/23/21.
- **La migración se puede volver a pasar:** la apliqué dos veces seguidas en PGlite sin error.
- **vitest 73/1.783 verde**, igual que la línea base.
- **Lint:** 21 avisos (20 errores y 1 advertencia), todos en tres archivos de `src/` que no se tocaron: `GameTable.jsx` 19, `CardImage.jsx` 1 y `SoundContext.jsx` 1.
- **Nada en `src/` ni en protegidos.** Hay una desviación de alcance en `scripts/eco/` para registrar el guion (§M-2).

---

## §1 · Qué se creó

| Pieza | Qué es |
|---|---|
| `libro_puntos` | Una línea por mano ganada, imborrable. Lleva los diez `check` de la ficha §3.1, entre ellos el de coherencia con la tabla del normativo §2.2 (ni un `insert` a mano puede contradecirla), y `unique (origen, mesa_id, mano)`. Índice `(jugador_id, creado_en)`. |
| `libro_puntos_inmutable` | Rechaza `update` y `delete`; deja pasar el borrado en cascada de la cuenta (`pg_trigger_depth() >= 2`, copia de `movimientos_inmutable`). Más un disparador contra `truncate`. |
| `puntos_totales` | Una fila por jugador con al menos 1 punto: `puntos`, `manos`, `ajileis` y `actualizado_en`. Índice **`(puntos desc, actualizado_en asc, jugador_id)`** (Ajuste A). |
| `libro_puntos_suma_total` | `after insert` sobre el libro: `insert … on conflict` que suma. Pone y quita la marca `ajilei.puntos`. |
| `puntos_totales_solo_por_libro` | Sin la marca falla cualquier `insert`, `update` (de **cualquier** columna) o `delete` directo; deja pasar la cascada. Más un disparador contra `truncate`. |
| `billeteras_ranking_idx` | **`(saldo desc, actualizada_en asc, jugador_id)`** (Ajuste A). |
| `mesas_ia.mano_informada` | `integer not null default 0`: la última mano con fin anotado, ganada o no. |
| `mesas_ia.manos_recientes` | `timestamptz[]`: las horas de los fines anotados en los últimos 60 s, para el tope (§2, D-2). |
| `informar_pila` (7) | El cuerpo de la 1c más las líneas marcadas «RNK-1a». `record_manos` no cambia. La firma de 5 se borra antes (`drop function`). Permisos: `authenticated` y `service_role`, como antes. |
| `puesto_maestros(uuid)`, `puesto_fortunas(uuid)` | El orden único del Ajuste A, en un solo sitio. Internas. |
| `ranking_top(text)` | Top 100 con `row_number()`; corte en 100 filas exactas. |
| `ranking_mio(text)` | Puesto, total, franja y cifra. En Maestros sin puntos devuelve cero filas. |
| `mini_perfil(text)` | Busca el nombre sin distinguir mayúsculas y devuelve los dos puestos y las dos cifras. Nunca un uuid ni un correo. |
| Ayudantes puros | `puntos_reto_ia`, `extra_ajilei`, `ia_tope_manos_minuto` (12) y `ranking_franja`. Internos. |
| Permisos | RLS activa y sin políticas en las dos tablas, y sin privilegios de tabla para `anon` ni `authenticated`. Las tres lecturas solo para `authenticated`. Las internas, para nadie. Las dos tablas, fuera de Realtime. |

---

## §2 · Decisiones tomadas dentro del margen de la ficha

| # | Decisión | Por qué |
|---|---|---|
| D-1 | **Puesto único (Ajuste A).** El orden es cifra desc, luego quien llegó antes a esa cifra (`actualizado_en` / `actualizada_en` asc), luego `lower(username)`. `ranking_top` usa `row_number()`, y `ranking_mio` y `mini_perfil` usan `puesto_maestros` / `puesto_fortunas`, con el mismo orden. | Decisión de Victor (§M-1). Así un solo orden alimenta las tres lecturas y no pueden discrepar; B12, B18 y B23 lo comprueban fila a fila. |
| D-2 | **Tope por minuto con ventana deslizante exacta.** `manos_recientes` guarda las horas de los fines **anotados** en los últimos 60 s (a lo sumo 12). Si ya hay 12, el siguiente es anomalía. | Con «desde + contador» por minuto fijo cabrían 24 fines en dos segundos, a caballo de dos minutos. Contar solo los anotados evita que un rechazo alargue el castigo. Cuesta una columna y unas pocas líneas. |
| D-3 | **`actualizado_en` del total se graba con `clock_timestamp()`**, no con `now()`. | `now()` es la hora de la transacción: dos líneas de la misma transacción (MOT-1 repartiendo, o el guion) «llegarían a la vez». En producción da lo mismo: cada aviso es una transacción. |
| D-4 | **Cualquiera de los cuatro `p_fin_*` presente = es fin de mano.** Una mano sin `vivos`/`gano` es anomalía. | Hoy «los dos nulos = no es fin». Con cuatro parámetros, un `p_fin_mano` suelto se ignoraría en silencio. |
| D-5 | **Una anomalía no anota el fin en ningún sitio**: ni `record_manos`, ni el libro, ni `mano_informada`. La pila se guarda igual. | Ficha §3.2.1: «no se anota el fin, como hoy con `vivos` fuera de rango». |
| D-6 | **AJILEI sin ganar la mano: se ignora**, no es anomalía. `record_manos` lo cuenta como perdida y el libro no lo anota. | Normativo §2.5: sin puntos por un AJILEI sin ganar la mano. Dos jugadores pueden tenerlo y solo uno gana (§2.4.3), así que no es un dato imposible. |
| D-7 | **`ranking_franja` en enteros:** `((puesto·20 + total − 1) / total) · 5`. | Es la fórmula de la ficha, `ceil(puesto·100/total/5)·5`, sin decimales que puedan empujar un 5 % exacto al 10 %. B14 comprueba 35/70/100, 28 de 100 → 30, 5 de 100 → 5 y 1 de 1 → 100. |
| D-8 | **`security definer` en las 7 funciones que tocan tablas.** Los ayudantes puros y los dos disparadores-guarda no lo llevan, como en ECO-1. Las 13 tienen `search_path = ''`. | Mismo criterio que ECO-1: `ia_apuestas_de`, `movimientos_inmutable` y `billeteras_solo_por_libro` no son *definer*. A11 lo comprueba. |
| D-9 | **`ranking_top` lee por el índice.** Primero obtiene la cifra de la fila 100 (`offset 99`) y luego solo las filas con esa cifra o más. | Todo lo que va delante de una fila incluida también está incluido, así que el `row_number()` del tramo coincide con el de toda la tabla. B23 lo comprueba con 107 jugadores. |
| D-10 | **La tabla del normativo vive en el `check` (tal cual la ficha) y en `puntos_reto_ia` / `extra_ajilei`** (lo que usa `informar_pila`). | Si se desalinean, el `insert` del libro falla y B8 lo caza. Espejo del cliente: `NIVELES[].puntos` (`puntosDe`). |
| D-11 | **Grupos A y B en un solo guion**, y la migración lleva su copia comentada y literal. | El Editor solo enseña el último `select` (ficha §5.4). Tener una sola fuente evita que la copia diverja. |
| D-12 | **Los puestos se comprueban en relativo,** contra `puesto_*` y contra el vecino. Las cifras exactas de la ficha (1-2-3-4, franja 25) se comprueban además cuando solo hay cuentas fabricadas (la variable `solo`). | El guion corre también en la base real, que tiene seis cuentas, y puede tener más el día que se corra. |

---

## §3 · Grupos A y B

### §3.1 · Banco de pruebas (PGlite 0.5.8 · PostgreSQL 18.3), 2026-10-24

**37/37 PASA en las dos pasadas** (con `begin/rollback` y sin él), **sin rastro** en ninguna tabla.

| Fila | Detalle (abreviado) |
|---|---|
| A1–A12 | Tablas, columnas, 4 índices, 5 disparadores, 3 RPC y 6 ayudantes. Firma de 7 sí y de 5 no (única). RLS 2/2 con 0 políticas y sin privilegios. `anon` sin nada, `authenticated` con las cuatro y sin internas. 13 columnas devueltas, ninguna uuid ni correo. Definer 7/7, `search_path` 13/13. Fuera de Realtime. |
| B1 | insert, update de `manos` y delete en `puntos_totales` → `puntos_totales_solo_por_libro` las tres; el total de D sigue 5/1. |
| B2 | update y delete en `libro_puntos` → `libro_puntos_inmutable`. |
| B3 | pro/5/52: base 3, extra 2, total 5, ajileis 1. |
| B4 | básico/4 con 52 → `libro_puntos_ajilei52_chk`. |
| B5 | humanos/4 → base 7; A llega a 10. |
| B6 | pro con base 8 → `libro_puntos_base_chk`. |
| B7 | La misma (origen, mesa, mano) → `libro_puntos_mano_uniq`; con `on conflict`, 0 filas; el total no cambia. |
| B8 | `informar_pila` gana la mano 1 (pro, 5, AJILEI 52): una línea de 3+2, `record_manos` 1/1, `mano_informada` 1. |
| B9 | La mano 1 repetida y la mano 0: 2 anomalías; libro y record sin cambio; la pila sí se guarda (2.050). |
| B10 | Pierde la mano 2: `mano_informada` 2; record sí, libro no. |
| B11 | 12 fines ok; el 13.º en el mismo minuto es anomalía y no entra. |
| B12 | `ranking_top('maestros')`: **A=1, D=2, B=3, E=4**. D y B empatan a 5; D llegó antes y queda delante, aunque `rnk_b` va antes por nombre. C no aparece; `es_tu` solo en A. |
| B13 | C sin puntos → 0 filas. A → puesto 1 de 4, franja 25 %, cifra 10. |
| B14 | Fortunas: A=1, B=2, C=3. B y C tienen el mismo saldo y la misma hora, así que decide el nombre. Franjas sobre 3: 35/70/100. |
| B15 | `mini_perfil('RNK_A_VERIF')` encuentra a `rnk_a_verif`; `nadie` → 0 filas; C → puesto y puntos nulos, saldo presente. |
| B16 | Como `anon`: las cuatro denegadas, siempre tras comprobar que el rol sí cambió a `anon`. |
| B17 | Borrar a A de `profiles` → su libro y su total desaparecen en cascada; lo demás intacto (106→106, 108→108). |
| B18 | **Ajuste A:** X y Y empatan a 2 → X 4.º, Y 5.º. Y sube a 3 → Y 4.º. X sube a 3 después → X queda 5.º, detrás de Y. `ranking_top` y `ranking_mio` coinciden. |
| B19 | Sin `p_fin_mano` (cliente viejo): record sí; libro, `mano_informada` y tope no. |
| B20 | AJILEI 50, 52 con 4 vivos, mano sin vivos → 3 anomalías. |
| B21 | Pasados 61 s la ventana se vacía y la mano 13 entra (básico, 1 punto). |
| B22 | AJILEI 51 sin ganar: record sí, libro no. |
| B23 | Corte: 100 filas exactas, puestos 1…100, idénticos a `puesto_maestros`. El último en llegar al empate de 102 jugadores con 1 punto queda 107.º de 107, fuera del top y con franja 100 %. |
| B24 | Sin sesión → 0 filas en las tres; ranking desconocido → 0 filas. |
| B25 | El libro cuadra: 106 totales, todos iguales a la suma de su libro. |

### §3.2 · Corrida real (SQL Editor, después del `db push`)

**CORRIDA REAL · hecha.** El 2026-10-24, Victor aplicó el `db push` y corrió `supabase/pruebas/rnk1a_verificacion.sql` en el SQL Editor de Supabase (Postgres 17.6.1). Resultado: **37/37 PASA.**

Durante la corrida, Fortunas tenía **13 billeteras**: las 6 reales y las 7 fabricadas por el guion, que se deshicieron al terminar. Por eso las franjas de B14 salen sobre 13 (10/20/25), y no sobre 11 como en PGlite. En Maestros solo había cuentas fabricadas (`sólo fabricadas=t`), así que B12 y B13 comprobaron también las cifras exactas: 1-2-3-4 y franja 25 %.

| Prueba | Resultado | Detalle |
|---|---|---|
| A1 · existen libro_puntos y puntos_totales | PASA | libro_puntos=t · puntos_totales=t |
| A2 · mesas_ia.mano_informada (int, 0) y manos_recientes | PASA | mano_informada=t · manos_recientes=t |
| A3 · índices: libro, ranking de puntos, ranking de saldo y la mano única | PASA | libro (jugador, creado)=t · puntos (desc, fecha, jugador)=t · saldo (desc, fecha, jugador)=t · único (origen, mesa, mano)=t |
| A4 · disparadores: inmutable, suma al total, total solo por libro (y sin truncate) | PASA | 5 de 5 |
| A5 · existen ranking_top, ranking_mio, mini_perfil y sus ayudantes | PASA | las tres RPC=t · los seis ayudantes=t |
| A6 · informar_pila: existe la firma de 7, no la de 5, y es la única | PASA | firma de 7=t · firma de 5=f · funciones con ese nombre=1 |
| A7 · las dos tablas: RLS activa, cero políticas, el cliente sin privilegios | PASA | con RLS=2 de 2 · políticas=0 · el cliente tiene algún privilegio=f |
| A8 · anon sin execute en ranking_top, ranking_mio, mini_perfil e informar_pila | PASA | anon puede alguna=f |
| A9 · authenticated con execute en las cuatro; ninguna interna | PASA | las cuatro del cliente=t · alguna interna al cliente=f |
| A10 · INV-67: ninguna columna de las tres es un uuid ni un correo | PASA | columnas devueltas=13 de 13 · con uuid o correo=0 |
| A11 · las que tocan tablas, security definer; todas con search_path vacío | PASA | definer con search_path=7 de 7 · puras y guardas con search_path=6 de 6 |
| A12 · ninguna de las dos tablas en supabase_realtime | PASA | en realtime=0 |
| B1 · puntos_totales a mano (insert, update de otra columna, delete): falla | PASA | insert → puntos_totales_solo_por_libro · update de manos → puntos_totales_solo_por_libro · delete → puntos_totales_solo_por_libro · el total de D sigue 5/1 |
| B2 · update y delete en libro_puntos: falla | PASA | update → libro_puntos_inmutable · delete → libro_puntos_inmutable · líneas de D=1 |
| B3 · ias/pro/5 sentados/AJILEI 52: base 3, extra 2, total 5 | PASA | base=3 · extra=2 · total=5 · manos=1 · ajileis=1 |
| B4 · ias/basico con AJILEI 52 y 4 sentados: falla (check) | PASA | → libro_puntos_ajilei52_chk |
| B5 · humanos/4 sentados sin nivel: base 7 (y A suma 10 con una de avanzado) | PASA | base=7 · total de A=10 · manos=2 · ajileis=1 |
| B6 · ias/pro con puntos_base 8: falla (coherencia con la tabla) | PASA | → libro_puntos_base_chk · C sigue sin total=t |
| B7 · la misma (origen, mesa, mano) otra vez: no entra, el total no cambia | PASA | insert → libro_puntos_mano_uniq · con on conflict, filas=0 · líneas de D=1 · total de D=5 |
| B8 · informar_pila gana la mano 1 (pro, 5 vivos, AJILEI 52): libro, record y mano 1 | PASA | codigo=ok · líneas=1 (base 3, extra 2, ajilei 52, mano 1, sentados 5, pro) · record jugadas=1 ganadas=1 · mano_informada=1 · recientes=1 · anomalías=0 · total=5 |
| B9 · la mano 1 repetida y la mano 0: anomalía, libro y record sin cambio, la pila sí | PASA | códigos=ok/ok · líneas de B=1 · record jugadas=1 · mano_informada=1 · anomalías=2 · seq=3 · pila=2050 |
| B10 · pierde la mano 2: mano_informada 2, record sí, libro no | PASA | codigo=ok · líneas de B=1 · record jugadas=2 ganadas_ia=1 · mano_informada=2 · recientes=2 |
| B11 · 13 fines de mano en el mismo minuto: el 13.º es anomalía y no entra | PASA | 12 primeros ok=12 con 0 anomalías · el 13.º: codigo=ok, anomalías=1, líneas de E=0 · record jugadas=12 · mano_informada=12 · recientes=12 |
| B12 · ranking_top maestros: puestos únicos 1-2-3-4; en el empate a 5, D (llegó antes) delante de B | PASA | A=1 · D=2 · B=3 · E=4 · C en la lista=f · filas=4, puestos distintos=4, último=4 · es_tu=1 (A=t) · D llegó antes=t · sólo fabricadas=t |
| B13 · ranking_mio maestros: sin puntos → cero filas; A → puesto, total y franja | PASA | filas de C=0 · A: puesto 1 de 4, franja 25 %, cifra 10 · sólo fabricadas=t |
| B14 · ranking_mio fortunas: puestos únicos 1-2-3 (empate de saldo y hora → nombre); franjas 35/70/100 sobre 3 | PASA | puestos A=1 B=2 C=3 de 13 (saldo B=C: t) · franjas sobre 13: 10/20/25 · sobre 3: 35/70/100 · 28 de 100=30 · 5 de 100=5 · 1 de 1=100 |
| B15 · mini_perfil(RNK_A_VERIF) lo encuentra; nadie → cero filas; sin puntos → nulos | PASA | filas=1 · rnk_a_verif: puesto maestros 1 con 10 · puesto fortunas 1 con 3000000002500 · nadie=0 filas · C: puesto nulo, puntos nulo, saldo 1000000002500 |
| B16 · como anon: ranking_top, ranking_mio, mini_perfil e informar_pila denegadas | PASA | denegadas siendo anon=4 de 4 · sin llegar a ser anon=0 · rol restaurado=t |
| B17 · borrar a A de profiles: su libro y su total se van en cascada, lo demás intacto | PASA | delete → borrada · líneas de A=0 · total de A=0 · totales de los demás 106→106 · líneas de los demás 108→108 |
| B18 · empate a 2: X (antes) delante; Y sube; X sube después y en el nuevo empate a 3 queda detrás | PASA | a 2: X=4 Y=5 · Y a 3: X=5 Y=4 · los dos a 3: X=5 Y=4 · ranking_top X=5 Y=4 · ranking_mio de X=5 |
| B19 · aviso sin p_fin_mano (cliente de antes de la 1b): record sí, libro no | PASA | codigo=ok · líneas de B=1 · record jugadas=3 (ganada con 3 vivos=1) · mano_informada=2 · recientes=2 · anomalías=2 |
| B20 · AJILEI 50, AJILEI 52 con 4 vivos, mano sin vivos: tres anomalías | PASA | códigos=ok/ok · líneas de B=1 · record jugadas=3 · mano_informada=2 · anomalías=5 · seq=8 |
| B21 · la ventana desliza: 61 s después, la mano 13 gana y entra (básico, 1 punto) | PASA | codigo=ok · líneas de E=1 (base 1) · total=1 · mano_informada=13 · recientes=1 |
| B22 · AJILEI 51 sin ganar la mano: record sí, libro no | PASA | codigo=ok · líneas de B=1 · record jugadas=4 · mano_informada=3 |
| B23 · el corte: 100 filas exactas con puestos 1…100; el último en llegar al empate, fuera y último | PASA | filas=100 · puestos distintos=100, de 1 a 100 · coinciden con puesto_maestros=t · en el ranking=107 · rnkcorte_101: puesto 107 de 107, franja 100 %, en el top=f |
| B24 · sin sesión → cero filas en las tres; un ranking desconocido → cero filas | PASA | ranking_top=0 · ranking_mio=0 · mini_perfil=0 · ranking «nada»=0 |
| B25 · el libro cuadra: cada total = Σ de su libro, y nadie con líneas sin total | PASA | totales descuadrados=0 · jugadores con líneas sin total=0 · totales revisados=106 |

La migración no se editó: su línea «CORRIDA REAL · pendiente» se queda como está, según el criterio de A3.

---

## §4 · Para la 1b (contrato con el cliente)

- **`p_fin_mano`:** el número de mano **dentro de la mesa**, desde 1 y estrictamente creciente. Cuenta **todas** las manos con fin informado, ganadas o perdidas. Cada `sentarse_ia` abre una mesa nueva, así que empieza otra vez en 1.
- **`p_fin_ajilei`:** 0, 51 o 52, calculado en el cliente con `isAjilei` / `getBestSuitScore`, como recomendó la Fase 0 §C. El 52 solo con 5 vivos. Solo cuenta si `p_fin_gano`.
- **Las anomalías no se ven en la respuesta:** `codigo` sigue siendo `ok`, como hoy con la pila topada. Quedan en `mesas_ia.anomalias`.
- **`src/dev/bancoImitado.js` no sabe nada de esta tanda.** No conoce los dos parámetros nuevos ni las tres RPC, y su prueba de espejo no lee esta migración. Es el «contrato único» de ECO-1c, así que la 1b tiene que imitarlo.
- **Lecturas:** «vacío» en `ranking_mio('maestros')` significa «Gana tu primera mano para entrar». `es_tu` marca la fila propia en el top.

---

## §M · Decisiones de Victor, desviaciones y preguntas

**M-1 · Ajuste A, decisión de Victor del 2026-10-24.** Puesto **único** (ordinal), sin puestos compartidos. El orden es cifra desc, luego quien llegó antes a esa cifra (`puntos_totales.actualizado_en` asc en Maestros, `billeteras.actualizada_en` asc en Fortunas) y, como último recurso, `lower(username)`.
- `ranking_top` pasa de `rank()` a `row_number()` y conserva `limit 100`.
- `ranking_mio` cuenta a quien tiene más, o lo mismo y antes, o lo mismo, a la vez y con un nombre menor.
- Los índices pasan a tres columnas.
- B12 comprueba 1-2-3-4, B14 recalcula las franjas con puestos únicos y B18 es nueva.

Cambia la ficha §3.3 («empate compartido 1-2-2-4») y la tabla de B12/B14 del §4.

**M-2 · Desviación de alcance: el registro del guion.** La ficha permite tocar `package.json` «si `npm run guiones` necesita registrar el guion nuevo». Pero el registro no vive ahí, sino en **`scripts/eco/guionesCore.mjs`** (`GUIONES_VIGENTES`); sin él, el corredor sale con código 2 y vitest falla. Al registrarlo fallaban además dos pruebas de **`scripts/eco/guionesCore.test.js`** que llevan la lista escrita a mano, como pasó al añadir la 1g. Cambios:
- `guionesCore.mjs`: 1 línea, el registro con 37 filas.
- `guionesCore.test.js`: 2 líneas, `rnk1a_verificacion.sql` añadido a las dos listas.

`package.json` no cambió. **Aceptado por el rector (2026-10-24):** el registro vive en `scripts/eco/guionesCore.mjs` y en su prueba, como en la 1g; la ficha se equivocó al decir `package.json`.

**M-3 · `PASA` en vez de `OK`.** La ficha pide veredictos `OK/FALLA`, pero el corredor de `npm run guiones` exige `PASA`, igual que los guiones de ECO-1. Usé `PASA/FALLA`.

**M-4 · Nombres de las cuentas fabricadas.** `rnk_a`, `rnk_b` y `rnk_c` tienen 5 caracteres, y la regla de usernames de SUP-2a exige de 6 a 15. Usé `rnk_a_verif` … `rnk_e_verif` y `rnk_x_verif`/`rnk_y_verif`, más `rnkcorte_001…101` para el corte. Por eso la B15 llama a `mini_perfil('RNK_A_VERIF')`.

**M-5 · B14 al pie de la letra no se puede cumplir en la base real.** «3 jugadores: franjas 35/70/100» exige que `billeteras` tenga exactamente 3 filas, y la base real tiene al menos las seis cuentas. La B14 pone a A, B y C a la cabeza con `ajuste_admin` (deshecho al final) y comprueba:
- que sus puestos son 1, 2 y 3;
- que sus franjas son las de la fórmula sobre el total real;
- que `ranking_franja` da 35/70/100 sobre 3.

**M-6 · La ventana entre el `db push` y el despliegue de la 1b.** Durante ese rato el cliente manda el fin de mano sin `p_fin_mano`: `record_manos` sigue contando como hoy, pero **ninguna mano ganada entra en el libro**, es decir, ninguna da puntos.
- Afecta a todas las manos ganadas contra las IAS en ese intervalo, y esos puntos no se recuperan: el libro no tiene de dónde sacarlos.
- Hoy los jugadores son las cuentas de prueba, así que el coste es nulo.
- Recomendación: no dejar pasar días entre el push y la 1b.

**M-7 · La fecha de Fortunas cambia con cualquier movimiento**, también al gastar. Un jugador que baja y vuelve a la misma cifra estrena fecha y, en el empate, queda detrás. Es coherente con «quien llegó antes a esa cifra». Además, dentro de una misma transacción `aplicar_movimiento` usa `now()`, así que dos saldos movidos a la vez empatan en la hora y decide el nombre (B14). No toqué `aplicar_movimiento`.

**M-8 · El guion retirado de la 1c** (`eco1c_verificacion.sql`) cita la firma de 5 de `informar_pila` en `has_function_privilege`. Si alguien lo reviviera, fallaría. Ya está retirado desde la 1d y no lo toqué.

**M-9 · Dos supuestos del guion sobre el SQL Editor real.** El guion necesita que `postgres` pueda hacer `set local role anon` (B16) y `pg_sleep` (B12, B18, B21). En Supabase, `postgres` es miembro de `anon` y `pg_sleep` es del núcleo. Si no fuera así, B16 lo diría explícitamente («sin llegar a ser anon = 4») y no daría un verde falso.

**M-10 · Invariantes.** Los comentarios citan INV-65 (el cliente nunca manda una cifra de puntos) e INV-67 (ningún uuid ni correo sale por las RPC) como **propuestos**. No toqué el registro de invariantes porque no está en el alcance.

**M-11 · Nota del rector: en Fortunas, gastar también estrena la fecha del empate.** `aplicar_movimiento` pone `billeteras.actualizada_en` en cada cambio de saldo, también cuando baja. Quien gasta y vuelve a una cifra empatada llega a ella más tarde y queda detrás. Es coherente con «quien llegó antes a esa cifra» (ver M-7).

**M-12 · Nota del rector: cada corrida del guion consume identificadores de `libro_puntos`.** Los `id` salen de una secuencia, y un `nextval` no se deshace con el `rollback`. Cada corrida deja un hueco en la numeración (unos 110 por corrida). No tiene consecuencia: ningún cálculo ni ninguna lectura depende de que los `id` sean consecutivos.

---

## §N · Archivos

| Archivo | Estado |
|---|---|
| `supabase/migrations/20261024191731_rnk1a_libro_puntos.sql` | nuevo |
| `supabase/pruebas/rnk1a_verificacion.sql` | nuevo |
| `scripts/eco/guionesCore.mjs` | +1 línea (§M-2) |
| `scripts/eco/guionesCore.test.js` | 2 líneas (§M-2) |
| `docs/reportes/AJILEI_RNK-1_Fase1a_Informe_v1.0.md` | nuevo (este) |

Fuera del repo, en el scratchpad de la sesión, queda `rnk1a_detalle.mjs`: imprime los detalles del guion contra PGlite y comprueba que la migración se puede pasar dos veces.
