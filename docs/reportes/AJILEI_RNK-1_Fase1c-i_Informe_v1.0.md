# AJILEI · RNK-1 · Fase 1c-i · La pantalla «Rankings» · Informe · v1.0

- **Ficha:** `AJILEI_RNK-1_Fase1c-i_v1.0.md` (rector) · **Normativo:** `docs/AJILEI_Rankings_v1.0.md` · **Lámina:** `docs/reportes/AJILEI_RNK-1_Fase1L_Informe_v1.0.md`
- **Fecha:** 2026-10-25 · **Ejecutor:** Claude Code · **Base:** `main` en `fb3c30c`
- **Escrito para:** el rector y Victor
- **Escrituras:** `src/` (sin protegidos) y este informe. Nada en `supabase/`. **Sin commits.**

---

## Resumen

La pantalla Rankings está hecha:
- **Pantalla:** las dos pestañas, el top 100 con filas de 56 px y podio en contorno, y la banda «Tu posición» fija al pie (V1 A · V3 B).
- **Estados:** cargando, sin red con «Reintentar», y vacío.
- **Fondo:** verde para Maestros y vino para Fortunas, con un token nuevo en `theme.css`.
- **Navegación:** se entra desde el botón Rankings del lobby; la flecha y la casa vuelven al lobby.
- **Bypass:** sale llena, con 130 jugadores con puntos y 140 con billetera, y la cuenta del bypass en el puesto 7.

La carcasa es `PantallaChips` sin botón dorado y con la lista por dentro: el camino (a) de la lámina. Retar, Salas y Armar mesa no cambian (§4).

**Medidas contra la lámina:** las filas a la vista son las seis de la lámina: 6 · 10 · 4 · 11 · 7 · 11. La banda mide 78,9 · 82 · 82 · 93,5 · 93,5 · 93,5 px, igual. La página no desborda en ningún tamaño y solo desplaza la lista (§3).

**Lo que la ficha daba por hecho y no era así:**
- **D-1:** `SEMBRADOS_DEMO` trae 6 jugadores, no 130/140.
- **D-7:** en `vite preview` no hay bypass.

Las dos se resolvieron dentro del margen. Para Victor quedan las preguntas de §M.

---

## §1 · Lo que cambió, archivo por archivo

| Archivo | Qué |
|---|---|
| `src/components/PantallaChips.jsx:61-68` | Cabecera nueva: cómo es la pantalla sin botón dorado y con la lista por dentro. |
| `src/components/PantallaChips.jsx:88-90` | Dos props nuevas. `listaInterna` (por defecto `false`) y `raiz`, que son los atributos de la raíz (`null`). |
| `src/components/PantallaChips.jsx:117` | Con `listaInterna`, la raíz lleva también `sal--lista-interna`, y recibe los atributos de `raiz`. |
| `src/components/PantallaChips.jsx:161-172` | Con `cta === null` no se pintan ni la caja (`CajaAccion`) ni el botón dorado. La zona anclada se queda con `pie` y con el toast. Si `cta` no se pasa, todo sigue como antes. |
| `src/styles/salas.css:1740-1757` | **§17 nuevo, solo añadido.** Con `.sal.es-anclada.sal--lista-interna` el cuerpo deja de desplazar (`overflow: hidden`, sin márgenes automáticos). Desplaza solo `.sal-desplaza` (`flex: 1 1 0`, `overflow-y: auto`). |
| `src/styles/theme.css:119-139` | **Token vino, añadido:** `--vino` `#7c1d30`, `--vino-deep` `#5a1426`, `--vino-abyss` `#1e070d` (más sus `-rgb`), `--vino-bright` y `--vino-hondo` para el círculo de la inicial, y `--fondo-vino`, que es la rampa de tres paradas con la misma forma que la verde de `salas.css:157-165`. |
| `src/styles/rankings.css` (nuevo, 338 líneas) | Las medidas de §2.5, tal cual: tokens de la fila (`--fila-h` 56 px, `--av` 0,62, `--cols`, `--premium-h`), fondo vino, cuerpo, pestañas, cabecera fija de 7u, fila, podio, tu fila, final, estados, banda, traje apretado y dos columnas. Ni un hex ni un `!important`. |
| `src/screens/rankingsCore.js` (nuevo) | `PESTANAS`, `PESTANA_INICIAL`, `estadoDe`, `textoBanda` (la franja viene del servidor), `cifraTexto` (`montoTexto`), `esTu` y `muestraFin` (`:50-57`, Ajuste A, D-10). |
| `src/screens/Rankings.jsx` (nuevo, 201 líneas) | La pantalla. Pide `top` y `mio` a la vez al entrar y en cada cambio de pestaña, con la respuesta guardada por clave de petición (pestaña + intento). Lista, banda, estados y el enganche `onJugador(username)`, que todavía no hace nada. «Se muestran los 100 primeros.» solo con 100 filas exactas (`:193-194`, D-10). |
| `src/lib/rankingApi.js` (nuevo, 99 líneas) | `crearRankingApi(cliente)` con `top(ranking)` y `mio(ranking)`. Valida el ranking antes de llamar, usa el tope `TOPE_ESPERA_MS` (INV-56) y nunca rechaza: si falla, devuelve `{ ok: false, motivo: 'sinred' }`. Si «hay fila» lo decide el contenido. |
| `src/App.jsx:17`, `:30-31` | Los imports de `Rankings`, `simulacionRanking` y `rankingApi`. |
| `src/App.jsx:277` | `apiRanking`, por el mismo interruptor que la billetera y las mesas: `simulacionRanking() ?? rankingApi`. |
| `src/App.jsx:932-948` | `screen === 'rankings'`, envuelto con `conVideo` y sin `data-escala` (INV-59). La flecha y la casa van al lobby. |
| `src/App.jsx:964` | `onRankings` del lobby. |
| `src/screens/Lobby.jsx:75` | La prop `onRankings`. |
| `src/screens/Lobby.jsx:268-271` | El botón Rankings llama a `onRankings`. El `svg` y la clase no cambian. Tienda y «Cómo se juega» siguen con «Pronto». |
| `src/dev/billeteraFalsa.js:46-48` | Los imports de `crearRankingApi` y `sembradosRanking`. |
| `src/dev/billeteraFalsa.js:73-80` | El banco del bypass nace con `usuario: 'DevLocal'` y `sembrados: sembradosRanking()`, y le suma 11 puntos a la cuenta del bypass. |
| `src/dev/billeteraFalsa.js:137-143` | `simulacionRanking()`, detrás de la misma puerta doble. |
| `src/dev/bancoImitado.js:670-681` | `sumarPuntos` acepta también el nombre de la propia cuenta: sube su total sin línea de libro, igual que los sembrados. |
| `src/dev/sembradosRanking.js` (nuevo) | Los 139 jugadores del bypass, con la forma de la lámina (D-1). |
| `src/config/textos.es.js:502-524` | Las 17 claves `rnk.*` de §3 (sin `rnk.reintentar`, ver D-3). |
| `src/config/textos.test.js:93-96` | Añade el prefijo `'rnk.'`. |
| `src/config/textos.test.js:185-187`, `:196` | El par declarado `lob.nav.rankings = rnk.titulo`. |
| `src/screens/rankingsCore.test.js` (nuevo) | 15 pruebas (3 del Ajuste A). |
| `scripts/testRnk1c.test.js` (nuevo) | 13 pruebas. |

---

## §2 · Decisiones dentro del margen

**D-1 · Los sembrados.**
- **Lo que hay:** la ficha (§2.6) da por hecho que `SEMBRADOS_DEMO` trae «130 jugadores con puntos y 140 con billetera». Trae **seis**, los del espejo del guion de la 1b. Con ellos, la lista tendría 6 filas y no se podría ver ni medir lo que sella la ficha: que desplaza, la cabecera fija, el final y las filas a la vista.
- **Lo que hice:**
  - Un archivo de desarrollo nuevo, `src/dev/sembradosRanking.js`. Tiene la forma de la lámina: semilla 1976, los mismos nombres, el comprador ElCatire88 con 48.700 en el puesto 1 de Fortunas, dos quebrados en 0 y `MaracuchaBrava_` para ver el «…».
  - `SEMBRADOS_DEMO` se queda como está.
  - La cuenta del bypass es `DevLocal` (`useAuth.js:90`), y el banco nacía con `test1976`, así que el bypass ahora la crea con `usuario: 'DevLocal'`.
  - El total propio lo pone `sumarPuntos`, ampliado a la propia cuenta.
- **Resultado:** queda **en el puesto 7, sola, sin el empate de la lámina**. Con el Ajuste A el puesto es único, así que la quité del empate.
- **Fuera de producción:** comprobé que nada de este archivo llega a `dist/` (ver M-1).

**D-2 · La forma de lo que devuelve `rankingApi`.** Para distinguir «sin red» de «no hay fila» sin lanzar nunca, va en sobre:
- `top` → `{ ok: true, filas: [{ puesto, username, cifra, esTu }] }`
- `mio` → `{ ok: true, mio: {…} | null }`

`ranking_top` devuelve también `es_tu` (migración `:554`), y la API lo pasa. Una fila es la tuya si el servidor dice `es_tu` **o** si `esTu(fila, usuario)` coincide por el nombre sin mayúsculas, que es la función que pide la ficha.

**D-3 · Los textos.**
- **`rnk.titulo`:** «Rankings» repite `lob.nav.rankings`. Lo declaré como par en `textos.test.js` con el mismo motivo que `lob.cta.pvp = sal.opciones.titulo`: la pantalla se llama como el botón que la abre.
- **`rnk.reintentar`:** no se crea. «Reintentar» ya existe y la pantalla usa `ia.retar.saldo.reintentar`, el reintento de otra lectura, como dice la ficha.
- **`rnk.cargando`:** se queda. Dice «Cargando…» y `app.cargando` dice «Cargando», sin los puntos, así que no repite.

**D-4 · El rótulo de las pestañas.** `FilaChips` siempre pinta un `<h2>` con su título. Le paso «Rankings», que da nombre al grupo de pestañas (`aria-label`), y lo oculto a la vista con un recorte para lectores de pantalla. La lámina no lleva ese rótulo.

**D-5 · Un solo oro macizo.** La medalla del 1 lleva un contorno de 3 px y la del 2 y el 3, de 1,5 px. Es la única forma que cumple INV-08 tal como quedó sellado, así que la cinta también es contorno: una uve, no el triángulo macizo de la lámina. Medido: la medalla del 1 tiene fondo transparente y el «+» de la píldora es el único macizo, `rgb(232, 184, 75)`.

**D-6 · El vino sin filigrana.** La ficha pide la rampa vino «hermana de la verde de `salas.css:157-165` (misma forma: rampa + filigrana)». La verde de producción **no lleva filigrana**; la llevaba solo la lámina. La hice hermana exacta de la de producción, con tres paradas y sin filigrana, para que las dos pestañas se diferencien solo en el color. Si se quiere la filigrana en las dos, es una línea por fondo.

**D-7 · Dónde se midió.** La ficha (§5) pide medir «con `vite preview` (4173)… en bypass con los sembrados». No se puede: el bypass y el banco imitado solo existen con `import.meta.env.DEV`, y en `vite preview` esa variable es falsa. Medí en `vite` (5173) con el bypass. El CSS y el marcado son los mismos.

**D-8 · Dónde se importa `rankings.css`.** En `Rankings.jsx`, justo después de `PantallaChips`, que trae `salas.css`. Así va detrás en la cascada y Retar y Salas no dependen de ella. Al importarse `Rankings` de forma estática desde `App`, la hoja acaba en el mismo CSS principal.

**D-10 · Ajuste A del rector (2026-10-25, M-4): «Se muestran los 100 primeros.» solo con la lista llena.** `rnk.fin` se pinta solo cuando `ranking_top` trae exactamente 100 filas (`muestraFin`, `rankingsCore.js:55`). Con menos, nada; el hueco Premium invisible se queda siempre. Tres pruebas nuevas en `rankingsCore.test.js`: 100 → sí; 0, 1, 6 y 99 → no; sin lista → no. Con los sembrados del bypass sale, porque hay 130 y 140 jugadores. Contra la base real de hoy, con 1 en Maestros y 6 en Fortunas, no sale.

**D-9 · La raíz lleva `data-rnk-estado`** (cargando, listo, sinred, vacío) junto a `data-ranking`. La medición de §3 espera por él, y el modo `rnk` de la 1c-ii podrá hacer lo mismo.

---

## §3 · Medidas de la pantalla (Chromium del arnés, 5173 con bypass y los sembrados)

| Tamaño | Disposición | Lista (px) · lámina | Filas enteras · lámina | Banda (px) · lámina | Pestaña (px) | ¿Desborda la página? |
|---|---|---|---|---|---|---|
| 360×640 | 1 col | 371,0 · 365,6 | **6** · 6 | 334,8×78,9 · 334,8×78,9 | 44 | no |
| 412×915 | 1 col | 615,5 · 615,5 | **10** · 10 | 383,2×82 · 383,2×82 | 44 | no |
| 915×412 | 2 col | 300,8 · 300,8 | **4** · 4 | 329,6×82 · 329,6×82 | 44 | no |
| 744×1100 | 1 col | 696,8 · 696,8 | **11** · 11 | 660×93,5 · 660×93,5 | 57 | no |
| 1366×623 | 2 col | 461,1 · 461,1 | **7** · 7 | 480×93,5 · 480×93,5 | 61,3 (dos líneas) | no |
| 1920×1080 | 1 col | 676,8 · 676,8 | **11** · 11 | 660×93,5 · 660×93,5 | 57 | no |

En los seis tamaños se midió también:
- **Fila y círculo:** la fila mide 56 px y el círculo 34,72 px.
- **Solo desplaza la lista:** al llevar la lista al final, la lista bajó unos 5.100 px. El cuerpo y la página siguen en 0. Las pestañas y la banda no se mueven y la cabecera de la lista queda pegada arriba.
- **Vuelta al lobby:** la casa vuelve al lobby.
- **Sin escala:** no hay `data-escala`.
- **Sin errores:** no hubo errores de página.

Fortunas, en 360×640 y en 1920×1080:
- **Lista:** 6 y 11 filas.
- **Banda:** «Puesto 68» (5.000 HC de 140).
- **Podio:** ElCatire88 en el 1.

En 360×640 la lista mide 5,4 px más que en la lámina. Las filas a la vista y la banda son las mismas.

**Contraste sobre vino** (ficha §2.5; WCAG sobre la parada más clara, `#7c1d30`; entre paréntesis, la misma cifra sobre la parada más clara del verde):

| Texto | Contraste |
|---|---|
| Texto | 8,67 (8,95) |
| Secundario (α 0,72) | 5,19 (5,49) |
| **Atenuado (α 0,55)** | **3,63** (3,90) |
| Oro | 5,49 (5,67) |
| Píldora: texto | 14,80 |
| Píldora: oro | 9,37 |
| Pestaña: texto | 13,23 |
| Tu fila: texto | 7,37 |

Todo llega a 4,5 : 1 salvo el atenuado: ver M-2. El token del oro no se tocó.

**Capturas** (fuera del repo), en `C:\Users\victo\AppData\Local\Temp\claude\c--Users-victo-OneDrive-Documents-ajilei\1934b08c-d027-4e70-87e7-bd3e7e7f1296\scratchpad\rnk1c\capturas\`:
- Hay 3 o 4 por tamaño: `<tamaño>-maestros.png`, `-maestros-final.png` (la lista al final, con «Se muestran los 100 primeros.»), y `-fortunas.png` en 360×640 y 1920×1080.
- `medidas.json` tiene todas las cifras.
- La sonda es `scratchpad\rnk1c\medir.mjs`.

---

## §4 · Pruebas, arnés y protegidos

| Qué | Resultado |
|---|---|
| vitest | **76 archivos / 1.852 pruebas**, todo verde (línea base de `fb3c30c`: 74 / 1.824). Nuevas: `rankingsCore.test.js` (15, tres del Ajuste A) y `testRnk1c.test.js` (13). `textos.test.js` sigue verde con el prefijo y el par. |
| lint | **21**, los mismos tres archivos de siempre: `GameTable.jsx` 19, `CardImage.jsx` 1, `SoundContext.jsx` 1. Los archivos nuevos y los tocados, 0. |
| build | verde. El paquete principal pasa de 613,43 kB a **620,28 kB** (gzip: de 180,76 a 182,73 kB): +6,9 kB, +1,97 kB en gzip (M-5). Tras el Ajuste A, vitest, build y lint se volvieron a correr; el arnés no, porque el ajuste no toca la carcasa. |
| `node scripts/diagDSK.mjs lob` | **código 0**: lob verde, aislamiento verde · 41 s |
| `node scripts/diagDSK.mjs humo` | **código 0**: gate, lob, retar y aislamiento verdes; d1d2, d3, bug y shots informativos · 195 s |
| `node scripts/diagDSK.mjs tam` | **código 0**: tam verde, aislamiento verde · 307 s (Retar y Salas con la carcasa tocada, en toda la matriz de tamaños) |
| `node scripts/diagDSK.mjs webkit` | **código 0**: webkit verde, aislamiento verde · 15 s |

Los modos corrieron uno tras otro, para no pisarse el `dist`; las salidas están en `scratchpad
nk1crnes-<modo>.log`. Ninguno mide todavía la pantalla Rankings: eso es el modo `rnk` de la 1c-ii.

**Protegidos (lista v1.8):** las huellas son idénticas antes y después, y coinciden con las del informe 1b §5. No se abrió ninguno.

| Archivo | sha256 |
|---|---|
| `src/engine/gameEngine.js` | `317452ec5b57408a9010c727c5da4e1af039462d7aec58925bff7bf96719f6e0` |
| `src/engine/aiPlayer.js` | `3a8ea7b0386c7ddfa5e85d849ddfa1204113740da7a97b5bfce0f75714400801` |
| `src/engine/deck.js` | `69f92d6b9aac433cb99e7ec23d6052af1a6aa66c0f61eee180ba8f045911aa82` |
| `src/config/seatLayouts.js` | `0049051fd4b8b891deb86066bb1eb89669e3509f18bb995d288232636b3ee30c` |
| `src/styles/opponentPanel.css` | `4b91338a205e4a6a489466aa9d07ac7c263ca137b3ee12177812ad9a62833f5a` |
| `src/styles/gameTable.css` | `9b6b716f23ade19aaf0a6941efbc3c2bc219b4eca9cbf451dda9181c5ac47306` |

---

## §5 · Pruebas de Victor

### A · En la PC con el bypass (unos 10 minutos)

1. En la carpeta del proyecto, corre `npm run dev` y abre <http://localhost:5173/>. Entra al lobby (la cuenta es `DevLocal`) y pulsa **Rankings** en la barra de abajo.
2. Mira la pantalla en cuatro tamaños:
   - F12, modo dispositivo, en **390×844** y **360×640** (vertical);
   - el navegador maximizado a **1920×1080**;
   - un horizontal bajo, **915×412** o **1366×623**.

| Qué miras | Qué tiene que salir |
|---|---|
| Abre | En **«Los grandes maestros»**, fondo verde, con «Se gana jugando. No se compra.». |
| Banda de abajo | «Tu posición · **Puesto 7**», con tu fila: 7 · D · DevLocal · tú · 11. |
| La lista | El 1 Bachaquero_VE con 96. El 1, el 2 y el 3 llevan medalla de **contorno**: la del 1 es más gruesa y ninguna está rellena de oro. |
| Tu fila en la lista | En el puesto 7, con fondo de oro tenue, un filete a la izquierda y «· tú». |
| Desplazar | **Solo se mueve la lista.** La barra, el título, las pestañas, el subtítulo y la banda se quedan quietos, y la cabecera «Puesto · Jugador · Puntos» queda pegada arriba. |
| El final | Al bajar del todo, «Se muestran los 100 primeros.» y un hueco vacío debajo. Sale porque la lista trae 100 filas. |
| «Las grandes fortunas» | Fondo **vinotinto**. La píldora (moneda, 5.000 y «+») se lee bien. ElCatire88 primero con 48.700, la moneda en cada cifra y la banda en «Puesto 68». |
| Volver a Maestros | La lista vuelve a pedirse; un instante de «Cargando…» y vuelve el verde. |
| Horizontal bajo | **Dos columnas:** pestañas, subtítulo y banda a la izquierda y la lista a la derecha. Las pestañas pueden ir en dos líneas. |
| Flecha y casa | Las dos vuelven al lobby. |

### B · Por el túnel con el S25, contra la base real (unos 15 minutos)

1. En la PC:
   - `npm run build`;
   - después `npx vite preview --host --port 4173 --strictPort`;
   - y en otra ventana `npx cloudflared tunnel --url http://localhost:4173`.
2. En el S25, con **test1976**, abre la URL del túnel y entra a **Rankings** desde el lobby. Mira la pantalla en vertical y en horizontal.
3. Con el **Motorola**, por el mismo túnel, entra con **ticotest2022** y abre Rankings.

| Dónde | Qué tiene que salir |
|---|---|
| S25 · Maestros | Las cuentas con puntos. Hoy probablemente solo `test1976` con 3 puntos, con «· tú». La banda dice «**Puesto 1**», o el que toque. |
| S25 · final de la lista | **No** sale «Se muestran los 100 primeros.», porque hay menos de 100 (D-10). Solo queda el hueco vacío. |
| S25 · Fortunas | Las seis cuentas, ordenadas por saldo. Tu cifra es la misma de la píldora (INV-46) y la banda lleva tu puesto. |
| S25 · horizontal | Dos columnas (915×412 en el S25 acostado). |
| S25 · flecha y casa | Vuelven al lobby. |
| Motorola · Maestros | La banda dice «**Gana tu primera mano para entrar**» en un recuadro discontinuo, porque esa cuenta no tiene puntos en el libro. |
| Si sale «No se pudo cargar el ranking.» | Pulsa **Reintentar**. Si sigue, haz una foto y avísame. |

### C · Dejarlo como estaba (1 minuto)

`Ctrl + C` en el túnel, en el preview y en el `npm run dev`.

Resultado real · 2026-10-25 (Victor): A · bypass en la PC a 390×844, 360×640, 1920×1080 y horizontal: conforme (medalla del 1 en contorno, «+» único oro macizo, solo desplaza la lista, vino con la píldora legible). B · túnel con el S25 (test1976) y el Motorola (ticotest2022) contra la base real: Maestros con la única fila de test1976 (3 puntos) y banda «Puesto 1», sin la frase de los 100 (Ajuste A); Fortunas con las seis cuentas, cifra propia = píldora (12.750); Motorola con «Gana tu primera mano para entrar». Observación del rector: en el S25 acostado salió una columna (la regla de ≥ 900 no alcanza a un teléfono); resuelto en la 1c-ii con la regla de alto ≤ 520 × ancho ≥ 760. Veredicto: PASA.

---

## §M · Notas y preguntas

**M-1 · Constantes del banco imitado en `dist/` (viene de la 1b; aquí no se cambia).** Respuesta del rector (2026-10-25): va a higiene.
- **Qué pasa:** los `Object.freeze` de nivel de módulo de `bancoImitado.js` llegan al paquete de producción aunque el banco no se use. `SEMBRADOS_DEMO`, la tabla de puntos y los límites son llamadas, y el empaquetador no puede tirarlas. Se ve `Bachaquero_VE` en `index-*.js`.
- **Lo que no pasa:** la marca del banco no está, así que `testDistSinMoldes` sigue verde.
- **En esta tanda:** me pasaba lo mismo con `sembradosRanking.js`, porque el `split()` estaba en el nivel del módulo. Lo corregí: ya no llega ningún nombre de los nuevos.
- **Propuesta:** dejarlo para una tanda de higiene, igual que M-1 de la 1b.

**M-2 · El texto atenuado (α 0,55) sobre vino da 3,63 : 1** en la parada más clara; sobre verde da 3,90. No llega a 4,5 en ninguno de los dos fondos.
- **Dónde se usa:** la cabecera de la lista (en mayúsculas, 2,6u), «· tú» y «Se muestran los 100 primeros.».
- **De dónde viene:** es el mismo patrón que ya usan las pantallas de lobby sobre verde, y no lo cambié.
- **Respuesta del rector (2026-10-25):** va a una tanda de diseño; aquí no se toca.

**M-3 · Maestros vacío.** Cuando nadie tiene puntos, la lista enseña solo su cabecera y la banda dice «Gana tu primera mano para entrar». **Respuesta del rector (2026-10-25): basta con la banda, sin clave nueva.** Queda como está.

**M-4 · «Se muestran los 100 primeros.» con menos de 100.** **Respuesta del rector (2026-10-25): Ajuste A, hecho.** Solo se pinta con 100 filas exactas (D-10).

**M-5 · El paquete principal crece 6,8 kB (1,96 kB en gzip)** porque `Rankings` se importa de forma estática, como Retar y Salas. Si un día pesa, puede ir diferida como la mesa.

**M-6 · Los comentarios de cabecera de `Lobby.jsx` («Recibe tres props») y de `App.jsx` («CUATRO props») ya estaban desfasados** antes de esta tanda. Los dejé como estaban.

**M-7 · Fuera de esta tanda, como dice la ficha:**
- el mini-perfil (`onJugador` llega sin efecto) y el modo `diagDSK rnk` son de la 1c-ii;
- la victoria es de la 1d;
- SumaMente y la línea Premium son de la 1e; aquí solo está su hueco invisible.
