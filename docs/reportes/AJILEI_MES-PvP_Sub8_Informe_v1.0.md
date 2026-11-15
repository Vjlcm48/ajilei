# AJILEI · MES-PvP · Sub-tanda 8 (ganchos, puntos y la pausa) · Informe · v1.0

- **Ficha:** `AJILEI_MES-PvP_Sub8_v1.0.md`. **Base:** `eaef6d4`. **Fecha:** 2026-11-14.
- **Diseño:** `docs/reportes/AJILEI_MES-PvP_Sub8_Fase0_Informe_v1.0.md`. Esta tanda construye lo que dejaron decidido P-1 a P-6.
- **Estado:** tramo A cerrado (STOP-A, aprobado sin ajustes) y tramo C en cuatro commits (§6). Siguen el control de las IAS, el paso a la nube de Victor y el túnel.

---

## Resumen

| Pieza | Qué se hizo | Dónde |
|---|---|---|
| La pausa | Cae después de las manos 7, 15, 22, 30, 37, 45… y dura como mucho 30 s. Contra las IAS no cambia nada | `src/arbitro/reloj.js:59-60` · `src/config/esperas.js:74` |
| Los puntos | El interruptor sigue siendo un dato: lo enciende Victor (P-3). La victoria entre personas suma con la tabla de humanos y «Ver tu nuevo ranking» se enciende | `src/lib/puntos.js` (`puntosDelFin`) · `GameTable.jsx:532` · `PartidaPvP.jsx` · `App.jsx` |
| «Mano actual» | Funciona en la mesa de personas: la mano la dice el servidor, el precio es 500, el contador de gratis es el mismo que contra las IAS y la clave lleva el uid | migración `sub8` · `GameTable.jsx:624-627` |
| `partida_asientos.manos` | Cada `mano_cerrada` suma 1 a los asientos sin cobrar | migración `sub8` |
| El texto del tope | «Demasiados intentos seguidos. Espera un minuto y vuelve a probar.» | `textos.es.js:258` |
| Documentos | Reglas v1.12, Contrato v1.5, Invariantes (INV-65 e INV-75) y Tienda v1.5 | `docs/` |

---

## 1 · El árbitro (commit a)

- **`src/arbitro/reloj.js:60`:** `llevaAnuncio = (mano) => mano % 15 === 7 || mano % 15 === 0`. El comentario de `:59` lleva la serie nueva.
- **`src/config/esperas.js:74`:** `PAUSA_ANUNCIO_MS = 30000`.
- **La semántica** es la de hoy: `mano` es la que acaba de cerrarse (Fase 0, E.2). La serie que sale, medida, es 7, 15, 22, 30, 37, 45, 52, 60.
- **`arbitro.test.js`: 36 líneas, todas de dato.**
  - 3 títulos: «manos 7 y 15 … 30 s», «la pausa dura 30 s», «vencen los 30 s».
  - 14 aserciones: las manos 5/6 pasan a 7/8, 11/12 a 15/16, `[5, 11]` a `[7, 15]` y 45000 a 30000.
  - 19 datos: la mano a la que se llega antes de medir y el campo `mano` de las peticiones.
  - **Ninguna aserción cambió de sentido.**
    - La partida larga sigue exigiendo que entre la mano 1 y la 15 no haya más pausas que `[7, 15]`. Eso prueba también que ya no hay pausa después de la 5 ni de la 11.
    - La de «`fase` con otra mano» pide ahora la mano 6, que sigue siendo «otra».
  - Las demás partidas largas que cruzan la mano 7 salieron verdes sin tocarlas.
- **`partidaImitada.js`:** la escena `recarga-anuncio` pasa de las manos 4/5 a las 6/7. También cambian dos comentarios (la 7 y los 30 s).
- **`partidaImitada.test.js:31, :83`:** `handCount === 7`.
- **`mesaPvPCore.test.js:59`:** el tope del reloj de la pausa, 30.
- **`AnuncioPvP.jsx:9-10`:** el comentario con la serie nueva y «vencen 30 s».
- **La función `partida` no se toca:** empaqueta `src/arbitro/` al desplegar.

## 2 · El SQL (commit b)

**La migración `supabase/migrations/20261114120000_mespvp_sub8_consulta_pvp_manos.sql`:**

1. **`partida_asientos.manos smallint not null default 0`**, con su comentario.
2. **`consultar_mano`**, redefinida entera con la misma firma.
   - El cuerpo es el de `mot1_dinero:82-171`, comparado con `diff`: solo cambian las líneas de la rama nueva.
   - **La rama nueva.** Si `p_mesa` no es una mesa contra las IAS abierta del que llama, busca su asiento sin cobrar en esa sala, con la partida viva.
     - Sin asiento, devuelve `mesa_invalida`.
     - Con otra mano que la de `partidas.estado → motor → handCount`, devuelve **`mano_distinta`**, con el molde de nombre de `mesa_invalida` y `argumento_invalido`.
     - Si todo cuadra, el precio es `precio_consulta('humanos')`, la clave `consulta:<sala>:<uid>:<mano>`, el `ref_tipo` es `'sala'` y el motivo «Mano actual · Humanos».
   - **No lee ni devuelve cartas.**
   - La rama de las IAS no cambia, ni su clave.
   - Los permisos se conservan, por ser `create or replace`.
3. **`aplicar_efectos`**, redefinida entera.
   - El cuerpo es el de `v13_recarga:85-201` con una sola sentencia más en `mano_cerrada` (comparado con `diff`): `update partida_asientos set manos = a.manos + 1 where sala_id = … and not cobrado`.
   - La llamada a los puntos se copia tal cual.

**Lo que la ficha no predijo:** ninguno de los dos cuerpos vigentes difería de las citas del informe.

**El guion `supabase/pruebas/mespvp8_verificacion.sql`** (14 filas, declarado en `scripts/eco/guionesCore.mjs`; cuentas `mespvp8_*_verif`):

| Fila | Qué prueba |
|---|---|
| A1–A4 | `manos` (smallint, no nula, 0) · `consultar_mano`, una firma, definer, `authenticated` sí y `anon` no · `aplicar_efectos`, una versión, con `manos`, puntos y recarga, fuera del cliente · `precio_consulta('humanos') = 500` |
| B1 | Apagado, la mano 1 ganada se guarda y no escribe |
| B2 | Encendido, la mano 2 deja una línea `humanos`, sin nivel, base 6 y extra 1 |
| B5 | `manos` = 2 · 2 · 1: el asiento 2 salió tras la mano 1 |
| B3 | La mano 2 repetida sigue en una línea |
| B4 | Un 52 con 4 sentados no escribe, y la pila de la mano 3 queda guardada |
| C1 | Una consulta contra las IAS y otra en la sala gastan 2 gratis del mismo contador, y la de la sala dice 500 |
| C2 | Sin gratis, A y B consultan la misma mano: dos cobros de 500, cada uno con su clave, y la mesa cuadra |
| C3 | A repite: `repetida`, un solo cobro |
| C4 | Mano 5 o mano 3 con la 4 en juego: `mano_distinta`, sin cobro y sin mover la última mano |
| C5 | Sala ajena y asiento que ya cobró: `mesa_invalida`, sin cobro |

**Los Grupos A y B**, comentados al pie de la migración:
- Salen del mismo guion con un script, para que no puedan divergir: 4 filas el A y 10 el B, con `create or replace` en `pg_temp` para correr uno por pestaña.
- **Comprobados en PGlite** poniéndolos un momento en lugar del guion: 4/4 y 10/10 PASA, sin rastro. El guion quedó restaurado y comparado byte a byte.

## 3 · El cliente (commit c)

- **`src/lib/puntos.js` · `puntosDelFin({ fin, nivel, contraHumanos })`:** lo que «Puntos obtenidos» suma por una mano ganada. Usa la tabla de humanos (`ruleN + 3`) en la mesa de personas y la del reto contra las IAS.
- **`GameTable.jsx:532`:** `puntosMano = puntosDelFin({ fin: finMano, nivel: game.nivelIA, contraHumanos: !!partida })`. Contra las IAS es Δ0 por construcción: sin `partida`, es la misma llamada de antes.
- **`GameTable.jsx:624-627`:** `mesaServidor = control?.mesaId ?? partida?.mesa ?? null` y `nivel: partida ? 'humanos' : nivel`.
  - **El id de la sala en `partida` se llama `mesa`.** Lo pone `creaMesaPvP` (`mesaPvPCore.js:121`, `mesa: sala.id`), y `PartidaPvP` lo esparce en `partidaMesa`.
  - Contra las IAS, Δ0: sin `partida`, las dos expresiones dan lo de antes.
- **`PartidaPvP.jsx` y `App.jsx`:** `apiRanking` y `apiConsulta` bajan de `App` a `MesaViva` y a `GameTable`, y `onSaldo` es `billetera.tomar`.
  - Es el mismo `tomar` que usa la mesa contra las IAS (INV-46).
  - `apiRanking` solo lo lee la victoria (`GameTable.jsx:1028, :2553`).
- **`consultasCore.js`:** sin cambio de lógica. `responderConsulta` ya mandaba cualquier motivo desconocido a «No se pudo consultar»; un comentario nombra `mano_distinta` en esa rama.
- **`textos.es.js:258`:** `sal.error.demasiados_intentos` = «Demasiados intentos seguidos. Espera un minuto y vuelve a probar.» No había ningún otro sitio con la frase vieja.
- **`src/dev/bancoImitado.js`:** una sala del árbitro imitado (`imitada-<escena>`) es la mesa de personas del bypass: 500, el mismo contador y la clave con el uid. Cualquier otro id sigue dando `mesa_invalida`. El banco no conoce la mano del árbitro: `mano_distinta` solo la da el SQL.
- **Pruebas:**
  - `scripts/testRnk1b.test.js`: `puntosDelFin` por mesa.
  - `scripts/testConsultas.test.js`: `mano_distinta` dice «No se pudo consultar».
  - `src/dev/bancoImitado.test.js`: la sala imitada.
- Sin CSS y sin textos nuevos salvo el del tope.

## 4 · Los controles rojo → verde

| Control | Rojo (antes del arreglo) | Verde |
|---|---|---|
| La serie | `esperas.test.js` exige `[7, 15, 22, 30, 37, 45, 52, 60]` en 1–60: «expected [5, 11, 16, 22, 27, 33, 38, 44, …(3)] to deeply equal [7, 15, 22, 30, 37, 45, 52, 60]» | Con `reloj.js:60` |
| 30000 | `esperas.test.js:99`: «expected 45000 to be 30000» | Con `esperas.js:74` |
| `puntosMano` | `puntosDelFin` con el cálculo de hoy (siempre `origen: 'ias'`), ya cableada en `GameTable`; el test exige 6 con personas y `ruleN 3`: «expected 1 to be 6» | Con el origen por mesa: 17/17 |
| Los puntos en PGlite | El guion con el interruptor como hoy, sin encender: «B2 · encendido: la mano 2 deja una línea… → FALLA · líneas=0» (y `manos` aún no existía: A1, A3 y X en rojo) | Con la migración y el encendido del guion: 14/14 en las dos pasadas, sin rastro |

## 5 · Las varas del tramo A

| Vara | Resultado |
|---|---|
| eslint | 0 problemas |
| vitest entero | 109 archivos, 2978 pruebas, verde |
| `npm run guiones` | Verde: 21 migraciones, 10 guiones × 2 pasadas, `mespvp8` 14/14 |
| `diagDSK pvp` | Verde: 20/20 celdas · 62/62 escenas · 98/98 varas LM · aislamiento verde (542 contextos, 0 a Supabase) · código 0. Corrido directo, en 5191/5192, fuera del tope de 10 min |
| `1.8b` | 177,9 KiB en el cable (antes 177,7): verde, con la meta en 185 y el techo en 200 |

## 6 · Tramo C, control de las IAS, la nube y el túnel

**Cuatro commits sobre `eaef6d4`**, cada uno por ruta explícita y con su `npm run aislado -- <sha> --perfil=commit` antes del siguiente:

| | SHA | Mensaje | Aislado |
|---|---|---|---|
| a | `da44d01` | MES-PvP 8-a: el árbitro · la pausa de anuncio después de la 7 y la 15, y 30 s | verde, 807 s (vitest 2976) |
| b | `fe748bd` | MES-PvP 8-b: el SQL · «Mano actual» en la sala y `partida_asientos.manos` | verde, 806 s (vitest 2976). `npm run guiones` aparte, porque el aislado no lo corre: verde, `mespvp8` 14/14 en las dos pasadas |
| c | `9bf8a4f` | MES-PvP 8-c: el cliente · los puntos entre personas, «Mano actual» y el ranking en PvP | verde, 817 s (vitest 2978; `1.8b` 177,8 KiB) |
| d | este commit | MES-PvP 8-d: documentos | su SHA y su aislado van en el chat del STOP-C |

En todos, eslint 0 igual a la base, `1.8b` y humo con código 0, y `git worktree list` en una línea al acabar.

**El control de las IAS** (las 19 varas de la 5b y la 7a, con `pvp.mesa` y `pvp.lm`) corre sobre el último commit tras el STOP-C, en ventana oculta. Su resultado, **la migración, el encendido del interruptor, el deploy de `partida` y el túnel** van en el chat: el informe ya está dentro del commit d.

## 7 · Documentos (commit d)

- **`docs/AJILEI_APU-1_Reglas_v1.12.md`:** el adjunto, tal cual. Es el archivo de Victor en `Downloads/AJILEI/`, cotejado con el del prompt; la v1.11 se queda.
- **Contrato v1.5** (20 cambios, cada ancla única):
  - el título y la cabecera «Al día con MES-PvP, sub-tanda 8»;
  - las abreviaturas `sub7a` y `sub8`;
  - §6: la pausa (`:367`, «Qué manos», «Fin de la pausa»);
  - §7: «no a los 30 s», la fila «Al consultar la mano (v1.5)», la fila `partida_asientos.manos`, el tope de las sentadas y el interruptor «encendido el 2026-11-14 desde el SQL Editor»;
  - §9: cierra `state.winner`, «Mano actual», «Encender los puntos» y las filas de la 7a y la 7b («Hecho: MES-PvP 7a/7b»); fila nueva para AMI-1 (la cascada del anfitrión); las cifras de `esperas.js` pasan a «la ola 0».
- **Invariantes:** INV-65 (el árbitro emite el fin de mano, la línea la escribe `aplicar_efectos` y la victoria entre personas suma con la tabla de humanos) e INV-75 (la mesa de personas: la mano la dice el servidor, mismo contador, 500 de la billetera, clave con uid; «durmiente» se quita). La cabecera lo anota. Ninguna invariante nueva.
- **Tienda:** la convención es un archivo por versión, así que se crea **`AJILEI_Tienda_v1.5.md`** y la v1.4 lleva `> Sustituido por v1.5 — 2026-11-14`, el molde de la v1.2.
  - §10.1 queda al día con lo construido: la serie nueva, 30 s y la tarjeta sin cuenta atrás, con los textos de las Reglas v1.12 §8.6.
  - §11: las dos filas de la pausa.
  - §12: la entrada de la v1.5.
  - **La línea de la v1.1 en §12** («manos 4, 8, 13…, tope de 45 s») es historia de lo que hizo esa versión: no se reescribe, se le añade «la cambian la v1.4 y la v1.5».

## 8 · Lo que quedó distinto de la ficha, y por qué

1. **La Reglas v1.12 no llegó en el primer prompt** del tramo A, solo la ficha. La copia es la de `Downloads/AJILEI/` (fecha de hoy y la §8.6 sellada), y el segundo prompt trajo el adjunto, con el que coincide. No la escribí yo.
2. **Pruebas fuera de la lista literal de la ficha,** todas de módulos que sí están en ella:
   - `scripts/eco/guionesCore.test.js`: sus dos listas literales de guiones crecen con cada guion nuevo, como pasó con `arn4c`;
   - `scripts/testConsultas.test.js`: `mano_distinta` en el test de `consultasCore`;
   - `src/dev/bancoImitado.test.js`: la sala imitada.
3. **`consultasCore` no necesitó lógica:** el motivo nuevo ya caía en «No se pudo consultar». Solo lleva un comentario.
4. **`manos` también la suma quien está sentado fuera de una mano:** sigue sin cobrar. Para AMI-1 no importa, porque el criterio es `≥ 1` y en la mano 1 nadie está sentado fuera. Queda escrito en el Contrato §7.
5. **El banco imitado reconoce la sala por su prefijo `imitada-`:** no tiene salas. No imita `mano_distinta`.
6. **`testInvariantes` pidió quitar dos comillas de código:** en la columna de vigilantes de INV-65 e INV-75 escribí `puntosDelFin` y `mano_distinta` entre comillas, y esa columna solo admite así modos, pruebas, rutas o documentos. Van sin comillas. Error de una línea en lo que escribí yo.
7. **Cuatro commits y no cinco** (decisión de Victor en el mapa del tramo C): el de la §2.4, el arnés, se quedaba sin archivos. La escena `recarga-anuncio` de `partidaImitada` usa el árbitro real y tiene que ir con él en el commit a, o su prueba sale roja en el aislado. Ninguna vara `pvp` fija la mano del anuncio, y `diagDSK pvp` salió verde sin tocar el arnés. Los documentos pasan a ser el commit d.

## 9 · Lo que queda para la 9

- La higiene, la quinta sesión, la CLI v3, los 41/40 px de la carcasa y la semilla de `vuelo` (heredados).
- **La cuenta atrás de la tarjeta del anuncio:** la Tienda v1.5 la quita por decisión; si algún día vuelve, es lámina.
- **E9** (iPhone sin cuenta por `?sala=`), sin probar desde SAL-B2.
- **`unirse_sala` por id no mira el tipo** (Fase 0, §R): riesgo bajo, anterior a MES-PvP.
