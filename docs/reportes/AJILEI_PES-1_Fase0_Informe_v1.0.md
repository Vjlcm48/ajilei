# AJILEI · PES-1 · Fase 0 · Informe · v1.0

**Para:** Victor y el rector · **Fecha:** 2026-11-03 · **Ficha:** `AJILEI_PES-1_Fase0_v1.0.md`
**Estado:** STOP-0. Sonda de solo lectura: sin commits y sin tocar nada con seguimiento. Este informe no propone recortes.

**En tres líneas.** El peso pasó de 169,15 a 235,57 KiB (+66,42): +52,13 de JS y +14,28 de CSS; el HTML y las imágenes no cambiaron. Quince commits explican 62,25 KiB (94 %), y los seis mayores son pantallas, datos o el motor que entran por `import` estático desde `App.jsx` o sus hooks. El techo de 200 se cruzó en `7650ba5` (IOS-1c, 2026-10-16).

---

## 1 · Estado de partida

| Comprobación | Resultado |
|---|---|
| `git log -1` | `4a7acbf` |
| `git status` | solo los cinco conocidos sin seguimiento: dos informes de MOT-1 y `laminas/mon1/` ×3 |
| `git worktree list` | una línea al empezar |
| Nombre `PES-1` | libre: nada en `docs/` ni en `docs/reportes/`, ningún commit |

Ningún caso del §2 de la ficha se dio.

---

## 2 · El instrumento

### Qué mide `1.8b`

`scripts/arnes/peso.mjs` llama a `pesarDist()` de `scripts/arnes/pesoCore.mjs`, sin navegador.

- **Cuenta:** el `index.html`; lo que este pide con `<script src>` y con `<link>` de `rel` `stylesheet`, `modulepreload`, `preload` o `icon`; los `import` estáticos de esos JS, recursivamente; y dos imágenes fijadas por nombre, `ajilei-isotipo` y `reverso_carta`.
- **Hoy son 6 recursos:**

| Recurso | KiB | Crudo |
|---|---:|---:|
| `assets/index-*.js` | 198,48 | 681,3 |
| `assets/index-*.css` | 30,38 | 159,6 |
| `/` (HTML) | 2,13 | 5,2 |
| `reverso_carta-*.svg` | 2,00 | 6,8 |
| `ajilei-isotipo-*.svg` | 1,52 | 4,0 |
| `icons/ajilei-icon-maestro.svg` | 1,05 | 4,1 |

- **Deja fuera:** `import()` dinámicos (el trozo de la mesa), `manifest`, `apple-touch-icon` y todo lo que se pide después de pintar. No hay fuentes en el camino crítico: la bitácora del navegador no pide ninguna.
- **Unidad:** KiB (1024 bytes) comprimidos con gzip de nivel 9, salvo lo que ya nace comprimido (webp, jpeg, png, gif, mp3, mp4, woff, avif), que cuenta tal cual. **Todas las cifras de este informe van en esa unidad, salvo las marcadas como «crudo».** Es una estimación del cable: no mide lo que Cloudflare sirve de verdad.
- **Primera pantalla:** la vara no tiene ruta. El JS y el CSS son los mismos en cualquier ruta, porque hay un solo paquete de entrada. Las dos imágenes son las de la **Portada sin sesión**, que es lo que pinta `diagPUE 1.8`: `/` en un contexto limpio de 1920×1080. Con sesión, el lobby descarga el mismo JS y CSS.

En este informe, «resto» es HTML más imágenes: 6,71 KiB en toda la serie.

### Qué es `1.8f`

Es una línea informativa de `diagPUE 1.8` (`scripts/diagPUE.mjs:1282`) y siempre sale verde. Imprime la cifra de `pesarDist()` y su diferencia con la de `1.8b` medida en navegador.

| | `1.8b` en `diagPUE` | `1.8f` / `peso.mjs` |
|---|---|---|
| Criterio | peticiones anteriores al primer pintado con contenido (FCP) | lista deducida del `dist/` |
| Imagen nueva en el primer pintado | la cuenta | no la ve |
| Decide el código de salida | sí | en `diagPUE`, no; en `peso.mjs`, sí |

### Calibración

| Commit | `peso.mjs` | Referencia | Resultado |
|---|---:|---|---|
| `4a7acbf` | 235,57 | 235,6 | cuadra |
| `866c75a` | 235,57 | 235,6 | cuadra |
| `3d1b19e` (cierre de ARN-3) | 169,15 | 169,2 | cuadra, Δ 0,05 |
| `7db208c` (cierre de ARN-3d) | 169,15 | 169,2 | cuadra, Δ 0,05 |

**De dónde sale el 169,2:** `docs/reportes/AJILEI_ARN-3d_Informe_v1.0.md:769`, medido con `diagPUE 1.8` en navegador, en la revisión del STOP-2 del 2026-10-02, sobre el árbol de trabajo antes de sus commits. `AJILEI_ARN-3_Cierre_v1.0.md:131` lo repite y lo atribuye a la 3d: el cierre no lo volvió a medir. El supuesto del rector era `3d1b19e`; la medida es anterior, pero `7db208c` y `3d1b19e` pesan lo mismo. No hay diferencia atribuible al instrumento.

Para toda la serie se usó el `pesoCore.mjs` de `4a7acbf`, importado desde el repo principal y apuntado al `dist/` del worktree.

---

## 3 · La serie por campañas

Los commits en cursiva son los de dependencias o empaquetado. Ninguno pesa por sí mismo más de 0,17 KiB.

| Campaña | Commit | Total | JS | CSS | Resto | Δ |
|---|---|---:|---:|---:|---:|---:|
| **ARN-3** (cierre) | `3d1b19e` | 169,15 | 146,35 | 16,10 | 6,71 | — |
| PAN-1 | `eb378b0` | 169,56 | 146,76 | 16,10 | 6,71 | +0,41 |
| ECO-1 1b–1d | `b8c356d` | 188,15 | 163,31 | 18,13 | 6,71 | +18,59 |
| *`package.json`: pglite en dev (ECO-1e)* | `04b387b` | 188,15 | 163,31 | 18,13 | 6,71 | 0,00 |
| ECO-1 1e | `4a36564` | 188,15 | 163,31 | 18,13 | 6,71 | 0,00 |
| CAP-2 | `c95f05c` | 188,15 | 163,31 | 18,13 | 6,71 | 0,00 |
| ECO-1 1g (cierre) | `92e2eeb` | 198,14 | 171,48 | 19,95 | 6,71 | +9,99 |
| IOS-1 | `9fef917` | 201,60 | 174,11 | 20,78 | 6,71 | +3,46 |
| TAB-1 | `abc2ebc` | 201,59 | 174,11 | 20,78 | 6,71 | −0,01 |
| TAB-2 | `5fad6d9` | 201,59 | 174,11 | 20,78 | 6,71 | 0,00 |
| VOZ-3 | `260ab9f` | 201,59 | 174,11 | 20,78 | 6,71 | 0,00 |
| TAB-3 | `0234763` | 201,60 | 174,11 | 20,78 | 6,71 | +0,01 |
| RNK-1 | `c0bc2c1` | 210,21 | 179,70 | 23,81 | 6,71 | +8,61 |
| *`package.json` y `vite.config.js`: versión y commit (CFG-1 1a-a)* | `abb269d` | 210,38 | 179,87 | 23,81 | 6,71 | +0,17 |
| CFG-1 1a | `fff91e3` | 212,58 | 181,34 | 24,54 | 6,71 | +2,20 |
| CFG-1 1c | `8bf8904` | 215,01 | 183,11 | 25,20 | 6,71 | +2,43 |
| CFG-1 1b | `c69fc8d` | 225,43 | 191,56 | 27,16 | 6,71 | +10,42 |
| CFG-1 1e | `2a9857e` | 225,93 | 192,05 | 27,17 | 6,71 | +0,50 |
| TIE-1 | `859b27f` | 232,98 | 196,12 | 30,16 | 6,71 | +7,05 |
| CFG-1 1d (cierre) | `3e6f606` | 236,43 | 199,32 | 30,41 | 6,71 | +3,45 |
| VIS-1 | `a32ec2f` | 236,47 | 199,33 | 30,43 | 6,71 | +0,04 |
| *`package.json`: CLI de Supabase (ARN-4 4-0a)* | `33bb87b` | 236,47 | 199,33 | 30,43 | 6,71 | 0,00 |
| *`package.json` y `vite.config.js` (ARN-4 4a-a)* | `df511d8` | 236,46 | 199,32 | 30,43 | 6,71 | −0,01 |
| *`package.json` (ARN-4 4a-b)* | `db69307` | 236,46 | 199,32 | 30,43 | 6,71 | 0,00 |
| *`package.json` (ARN-4 4a-c)* | `a80d379` | 236,46 | 199,32 | 30,43 | 6,71 | 0,00 |
| **ARN-4** (cierre) | `866c75a` | 235,57 | 198,48 | 30,38 | 6,71 | −0,89 |

- **`b8c356d` se añadió** como último commit con `src/` de ECO-1 1d, para que el Δ de `04b387b` no se le atribuya a él: `04b387b` añade 0,00.
- **`abb269d`:** sus +0,17 KiB son `src/`, la versión, el soporte y el ojito. `vite.config.js` añade dos `define`.
- **`node_modules` es el de hoy y no falsea la serie.** Las dependencias de ejecución no cambian entre `3d1b19e` y `866c75a`. `package-lock.json` solo cambia `pglite` (nuevo), `supabase` con sus `@supabase/cli-*` y la versión del propio paquete. Las versiones de hoy de `react`, `react-dom`, `@supabase/supabase-js` y `vite` son las del lockfile de `3d1b19e`.
- **Ningún commit quedó sin medir.**
- **Por debajo de 2 KiB, sin bajar al detalle:** PAN-1, CAP-2, TAB-1, TAB-2, VOZ-3, TAB-3, CFG-1 1e, VIS-1 y ARN-4.
- **Orden:** el de la historia. CFG-1 entró como 1a, 1c, 1b, 1e, y 1d después de TIE-1.

---

## 4 · Los saltos

Todos los commits de `src/`, `package.json` o `index.html` de las campañas con Δ mayor de 2 KiB se midieron: 41 commits. También los 12 de ARN-4, para ver su bajada. Esta tabla lista los de 1 KiB o más. Ninguno cambia el resto.

| Commit | Campaña | Δ | JS | CSS | Causa |
|---|---|---:|---:|---:|---|
| `3cf229b` | ECO-1c | +13,69 | +13,34 | +0,35 | `App.jsx` importa `lib/controlMesaIA`, que importa `hooks/mesaIACore`, y este `engine/gameEngine` y `engine/pozos`. El motor (`gameEngine`, `aiPlayer`, `pozos`, `handEvaluator`, `deck`) baja del trozo de la mesa a la entrada: `GameTable.js` pierde 21,3 KiB en crudo. |
| `07b0203` | ECO-1g | +9,45 | +7,62 | +1,82 | `App.jsx` importa `components/MarcoVideo`, con `CapaVideo`, `CelebracionVideo`, `GuardandoVideo`, `SinVideo` y `styles/video.css`, y `lib/controlVideo`. `useCongelado`, `coreografiaCore` y `celebracionCore` bajan de la mesa (`GameTable.js`, −4,1 en crudo). |
| `2dae80a` | TIE-1 1a-c | +6,72 | +3,73 | +2,99 | `App.jsx` importa `screens/Tienda` con `tienda.css`. `HojaConfiguracion` importa `components/Vitrina` con `vitrina.css` y `luz.css`, que baja de la mesa (`GameTable.css`, −5,5 en crudo). Sale `HojaMonedas`. |
| `b80db3d` | CFG-1 1b-b | +5,39 | +5,39 | 0,00 | `config/paises.js`, generado con 243 países (10,9 KiB en crudo), y `config/estados.js` entran por `lib/lugarCore`, que importan `lib/perfilApi` (desde `useAuth.js`) y `lib/rankingApi` (desde `App.jsx`). |
| `57c3c15` | CFG-1 1b-c | +5,02 | +3,05 | +1,96 | `App.jsx` importa `screens/Perfil` con `perfil.css`, y `Bautizo.jsx` crece 1,9 KiB en crudo. |
| `5c7d26a` | RNK-1 1c | +4,75 | +2,87 | +1,89 | `App.jsx` importa `screens/Rankings`, con `components/MiniPerfil`, `rankings.css` y `miniPerfil.css`, y `lib/rankingApi`. |
| `b8c356d` | ECO-1d | +3,28 | +1,62 | +1,65 | `BarraSuperior` importa `FichaConstancia`, y `App.jsx`, `lib/constanciaApi`. En `constancia.css`, `url("../assets/heptacoin.svg")` queda incrustado por Vite como `data:`: 4,2 KiB en crudo. |
| `fbcb03e` | RNK-1 1e | +2,51 | +1,52 | +1,00 | `App.jsx` importa `screens/IntersticialSumaMente` con `sumamente.css`. |
| `3a5106f` | CFG-1 1c-c | +2,06 | +1,39 | +0,66 | `HojaConfiguracion` importa `components/EliminarCuenta` con `eliminarCuenta.css`. |
| `617dba4` | CFG-1 1a-c | +2,04 | +1,31 | +0,73 | La hoja del ⚙ sale de `Lobby.jsx` a `components/HojaConfiguracion.jsx` y crece; `main.jsx` importa `tactilLobby.css`. |
| `f095c5d` | CFG-1 1d-c | +1,81 | +1,55 | +0,25 | `screens/Perfil` importa `components/CambiarCorreo` y `hooks/useCambioCorreo`, con `correo.css`. |
| `a8b0183` | IOS-1e | +1,57 | +1,05 | +0,52 | `components/CajaAccion` y `zonaAccionCore` en tres pantallas; `salas.css` crece 3,2 KiB en crudo. |
| `8d676c1` | ECO-1b | +1,39 | +1,37 | +0,03 | `App.jsx` importa `hooks/useBilletera` con `billeteraCore` y `lib/billeteraApi`. |
| `7650ba5` | IOS-1c | +1,35 | +1,13 | +0,23 | `useAuth.js` crece 1,4 KiB en crudo; entran `CuentaSinRed`, `bautizoCore` y `pildora.css`. **Aquí se cruza el techo:** 198,67 → 200,02. |
| `2cf7bdc` | CFG-1 1d-b | +1,22 | +1,22 | 0,00 | `App.jsx` importa `lib/correoApi` con `lib/correoCore`. |

**Suma de la tabla:** +62,25 KiB de los +66,42. El resto son commits menores.

**Bajadas de ARN-4:** `e109d78` −0,19; `e4af55d` −0,63 (`dev/bancoImitado.js` y `PERFIL_DEV` salen del paquete); `cac8b57` −0,09.

---

## 5 · La primera descarga de hoy

### Cómo se repartió

- **JS:** por los sourcemaps de `vite build --sourcemap`, atribuyendo cada tramo del paquete a su módulo. Queda sin mapear el 0,2 %.
- **CSS:** Vite no emite sourcemap de CSS. Cada archivo se minificó aparte con `lightningcss` y se sumó el SVG incrustado en `constancia.css`. La suma cubre 163 146 de los 163 396 bytes reales (99,8 %).
- **El reparto es proporcional.** El peso comprimido de cada módulo es su parte en crudo por el factor de su paquete: **0,291** en JS (198,48 / 681,3) y **0,191** en CSS. No es un gzip de cada módulo. Las cifras por módulo son aproximadas; los Δ medidos de los §3 y §4 son exactos.
- **Por paquete:**

| Paquete | KiB |
|---|---:|
| `src/` JS | 74,5 |
| `@supabase/*` | 57,7 |
| `react-dom` | 50,8 |
| `src/` CSS | 30,4 |
| `howler` | 10,2 |
| `react` | 2,2 |
| `iceberg-js` | 1,5 |
| `scheduler` | 1,0 |
| `tslib` | 0,2 |

### Módulos de más de 1 KiB

**(P)** = archivo protegido (`docs/AJILEI_Protegidos_v1.0.md`). En «Desde ARN-3», «bajó a la entrada» significa que el archivo ya existía y estaba fuera de lo que se descarga primero.

| KiB | Crudo | Tipo | Módulo | Origen | Desde ARN-3 |
|---:|---:|---|---|---|---|
| 49,72 | 170,6 | JS | `~/react-dom/cjs/react-dom-client.production.js` | dependencia | ya estaba |
| 16,95 | 58,2 | JS | `~/@supabase/auth-js/dist/module/GoTrueClient.js` | dependencia | ya estaba |
| 10,21 | 35,0 | JS | `~/howler/dist/howler.js` | dependencia | ya estaba |
| 7,32 | 25,1 | JS | `~/@supabase/phoenix/priv/static/phoenix.mjs` | dependencia | ya estaba |
| 6,16 | 21,1 | JS | `~/@supabase/storage-js/dist/index.mjs` | dependencia | ya estaba |
| 5,87 | 30,8 | CSS | `src/styles/salas.css` | SAL-B1 | ya estaba |
| 5,22 | 17,9 | JS | `src/config/textos.es.js` | LOB-1a | ya estaba |
| 4,34 | 14,9 | JS | `~/@supabase/postgrest-js/dist/index.mjs` | dependencia | ya estaba |
| 3,97 | 20,8 | CSS | `src/styles/portada.css` | PUE-2 | ya estaba |
| 3,32 | 11,4 | JS | `src/screens/SalaEspera.jsx` | SAL-B1 | ya estaba |
| 3,17 | 10,9 | JS | `src/config/paises.js` | CFG-1 1b-b | nuevo |
| 3,15 | 10,8 | JS | `src/engine/aiPlayer.js` **(P)** | motor v1.2 | bajó a la entrada |
| 2,90 | 10,0 | JS | `~/@supabase/supabase-js/dist/index.mjs` | dependencia | ya estaba |
| 2,56 | 8,8 | JS | `src/App.jsx` | motor v1.2 | ya estaba |
| 2,54 | 8,7 | JS | `src/screens/Tienda.jsx` | TIE-1 1a-c | nuevo |
| 2,47 | 8,5 | JS | `~/@supabase/realtime-js/dist/module/RealtimeChannel.js` | dependencia | ya estaba |
| 2,43 | 8,3 | JS | `src/engine/gameEngine.js` **(P)** | motor v1.2 | bajó a la entrada |
| 2,41 | 8,3 | JS | `~/@supabase/realtime-js/dist/module/RealtimeClient.js` | dependencia | ya estaba |
| 2,38 | 8,2 | JS | `src/screens/Perfil.jsx` | CFG-1 1b-c | nuevo |
| 2,22 | 7,6 | JS | `~/@supabase/auth-js/dist/module/lib/webauthn.js` | dependencia | ya estaba |
| 2,18 | 7,5 | JS | `src/screens/Portada.jsx` | PUE-2 | ya estaba |
| 2,13 | 7,3 | JS | `src/components/HojaConfiguracion.jsx` | CFG-1 1a-c | nuevo |
| 2,12 | 7,3 | JS | `~/react/cjs/react.production.js` | dependencia | ya estaba |
| 2,08 | 7,1 | JS | `~/@supabase/auth-js/dist/module/GoTrueAdminApi.js` | dependencia | ya estaba |
| 2,02 | 6,9 | JS | `~/@supabase/auth-js/dist/module/lib/helpers.js` | dependencia | ya estaba |
| 1,89 | 9,9 | CSS | `src/styles/video.css` | ECO-1g | nuevo |
| 1,73 | 9,1 | CSS | `src/styles/lobby.css` | LOB-1c | ya estaba |
| 1,73 | 9,1 | CSS | `src/styles/rankings.css` | RNK-1 1c | nuevo |
| 1,68 | 5,8 | JS | `src/screens/Rankings.jsx` | RNK-1 1c | nuevo |
| 1,53 | 5,2 | JS | `~/iceberg-js/dist/index.mjs` | dependencia | ya estaba |
| 1,44 | 4,9 | JS | `src/screens/SalaOpciones.jsx` | SAL-B1 | ya estaba |
| 1,43 | 4,9 | JS | `src/components/CambiarCorreo.jsx` | CFG-1 1d-c | nuevo |
| 1,38 | 4,8 | JS | `src/hooks/useAuth.js` | anterior a ARN-3 | ya estaba |
| 1,31 | 4,5 | JS | `src/screens/RetarIAS.jsx` | APU-1c | ya estaba |
| 1,25 | 6,6 | CSS | `src/styles/hojaConfiguracion.css` | CFG-1 1a-c | nuevo |
| 1,24 | 6,5 | CSS | `src/styles/tienda.css` | TIE-1 1a-c | nuevo |
| 1,23 | 4,2 | JS | `src/screens/Bautizo.jsx` | anterior a ARN-3 | ya estaba |
| 1,21 | 6,3 | CSS | `src/styles/perfil.css` | CFG-1 1b-c | nuevo |
| 1,16 | 4,0 | JS | `~/@supabase/auth-js/dist/module/lib/webauthn.errors.js` | dependencia | ya estaba |
| 1,11 | 5,8 | CSS | `src/styles/luz.css` | LUZ-1a | bajó a la entrada |
| 1,11 | 3,8 | JS | `src/screens/IntersticialSumaMente.jsx` | RNK-1 1e | nuevo |
| 1,09 | 5,7 | CSS | `src/styles/menuMovil.css` | anterior a ARN-3 | ya estaba |
| 1,09 | 3,7 | JS | `src/components/MiniPerfil.jsx` | RNK-1 1c | nuevo |
| 1,03 | 5,4 | CSS | `src/styles/constancia.css` | ECO-1d | nuevo |

Menores de 1 KiB: 188 módulos, 53,1 KiB.

**Protegidos en la entrada:** `engine/aiPlayer.js` (3,15), `engine/gameEngine.js` (2,43) y `engine/deck.js` (0,14). Los tres bajaron con ECO-1c. `config/seatLayouts.js`, `opponentPanel.css` y `gameTable.css` siguen fuera.

### Cómo cuadran los +66,42

| Partida | KiB |
|---|---:|
| Módulos ausentes en ARN-3 (102) | +56,39 |
| Módulos que ya estaban y crecieron o encogieron, en crudo por el factor de hoy | +7,2 |
| Módulos que salieron (`CardImage` y dos menores) | −0,96 |
| Subida del factor de compresión de los paquetes (JS 0,284 → 0,291; CSS 0,189 → 0,191), aplicada a lo que ya estaba | +3,8 |
| **Total** | **+66,4** |

Los crecimientos mayores entre lo que ya estaba, en crudo: `config/textos.es.js` +10,3 KiB, `App.jsx` +6,3, `salas.css` +4,1, `useAuth.js` +2,2, `Bautizo.jsx` +2,1.

El origen `motor v1.2` es el commit `819e276`, el más antiguo que añade el archivo.

### Las cadenas y el uso al pintarse, para el 80 % de lo que entró

Son 40 módulos y 45,5 KiB de los 56,39.

- **La cadena** es la más corta por `import` estático desde `main.jsx`. Omito `main.jsx → App.jsx →` al principio, común a todas salvo `tactilLobby.css`.
- **«Portada» y «Lobby»** dicen si la pantalla lo usa al pintarse sin tocar nada. **«no»** significa que solo se evalúa al cargar el paquete.

| KiB | Módulo | Cadena | Portada | Lobby | Se necesita al… |
|---:|---|---|---|---|---|
| 3,17 | `config/paises.js` | screens/Perfil.jsx → config/paises.js | no | sí: `lugarValido` al leer el perfil y `Bandera` en la hoja cerrada | buscador de país en Perfil |
| 3,15 | `engine/aiPlayer.js` **(P)** | hooks/mesaIACore.js → engine/gameEngine.js → engine/aiPlayer.js | no | no | jugar: decisiones de la IA, en la mesa |
| 2,54 | `screens/Tienda.jsx` | screens/Tienda.jsx | no | no | abrir la Tienda (`App.jsx:1119`) |
| 2,43 | `engine/gameEngine.js` **(P)** | hooks/mesaIACore.js → engine/gameEngine.js | no | no | jugar; `PHASES` en mesa y celebración |
| 2,38 | `screens/Perfil.jsx` | screens/Perfil.jsx | no | no | abrir el perfil (`App.jsx:1085`) |
| 2,13 | `components/HojaConfiguracion.jsx` | screens/Lobby.jsx → components/HojaConfiguracion.jsx | no | sí: montada cerrada en el DOM | su contenido, al tocar el ⚙ |
| 1,89 | `styles/video.css` | components/MarcoVideo.jsx → styles/video.css | no | solo `.vid-raiz`, vacía | pedir un video; filas de Monedas; `.sal-saldo` |
| 1,73 | `styles/rankings.css` | screens/Rankings.jsx → styles/rankings.css | no | no | abrir Rankings |
| 1,68 | `screens/Rankings.jsx` | screens/Rankings.jsx | no | no | abrir Rankings (`App.jsx:1102`) |
| 1,43 | `components/CambiarCorreo.jsx` | screens/Perfil.jsx → components/CambiarCorreo.jsx | no | no | abrir el perfil |
| 1,25 | `styles/hojaConfiguracion.css` | screens/Lobby.jsx → components/HojaConfiguracion.jsx → styles/hojaConfiguracion.css | no | sí: hoja cerrada | al tocar el ⚙ |
| 1,24 | `styles/tienda.css` | screens/Tienda.jsx → styles/tienda.css | no | no | abrir la Tienda |
| 1,21 | `styles/perfil.css` | screens/Perfil.jsx → styles/perfil.css | no | no | abrir el perfil |
| 1,11 | `styles/luz.css` | screens/Tienda.jsx → components/Vitrina.jsx → styles/luz.css | no | sí: `.vit`, el disco de la hoja cerrada | Tienda y mesa |
| 1,11 | `screens/IntersticialSumaMente.jsx` | screens/IntersticialSumaMente.jsx | no | no | entrar en Rankings, cada 8 entradas (`App.jsx:811`) |
| 1,09 | `components/MiniPerfil.jsx` | screens/Rankings.jsx → components/MiniPerfil.jsx | no | no | tocar una fila de Rankings; «Ver tu nuevo ranking» |
| 1,03 | `styles/constancia.css` | screens/Lobby.jsx → components/BarraSuperior.jsx → components/FichaConstancia.jsx → styles/constancia.css | no | sí: la ficha de la barra | — |
| 0,99 | `components/CapaVideo.jsx` | components/MarcoVideo.jsx → components/CapaVideo.jsx | no | no | pedir un video |
| 0,96 | `styles/sumamente.css` | screens/IntersticialSumaMente.jsx → styles/sumamente.css | no | no | el intersticial |
| 0,95 | `components/EliminarCuenta.jsx` | screens/Lobby.jsx → components/HojaConfiguracion.jsx → components/EliminarCuenta.jsx | no | no | Eliminar cuenta, en la hoja |
| 0,93 | `engine/pozos.js` | hooks/mesaIACore.js → engine/pozos.js | no | no | jugar; `finDeMano` |
| 0,85 | `lib/carasBaraja.js` | lib/precargaBaraja.js → lib/carasBaraja.js | no | no (`SIN_PRECARGA`) | precarga al salir del lobby; cartas |
| 0,81 | `lib/controlVideo.js` | lib/controlVideo.js | sí: se crea en `App`, sin pintar | sí | el video |
| 0,79 | `styles/miniPerfil.css` | screens/Rankings.jsx → components/MiniPerfil.jsx → styles/miniPerfil.css | no | no | el mini-perfil |
| 0,73 | `lib/correoApi.js` | lib/correoApi.js | solo la referencia | solo la referencia | cambiar el correo |
| 0,70 | `components/CelebracionVideo.jsx` | components/MarcoVideo.jsx → components/CelebracionVideo.jsx | no | no | tras cobrar un video |
| 0,68 | `styles/eliminarCuenta.css` | screens/Bautizo.jsx → styles/eliminarCuenta.css | no | no | Bautizo; Eliminar cuenta; consulta en mesa |
| 0,67 | `hooks/videoCore.js` | lib/controlVideo.js → hooks/videoCore.js | sí: con `controlVideo` | sí: `MarcoVideo` | el video |
| 0,60 | `hooks/mesaIACore.js` | hooks/mesaIACore.js | no | no | sentarse (`App.jsx:749`) y jugar |
| 0,56 | `components/GuardandoVideo.jsx` | components/MarcoVideo.jsx → components/GuardandoVideo.jsx | no | no | cobrar un video |
| 0,54 | `lib/controlMesaIA.js` | lib/controlMesaIA.js | solo `ESPERAS_RED_MS` | solo `ESPERAS_RED_MS` | sentarse (`App.jsx:767`) |
| 0,54 | `styles/vitrina.css` | screens/Tienda.jsx → components/Vitrina.jsx → styles/vitrina.css | no | sí: el disco de la hoja cerrada | Tienda |
| 0,51 | `lib/rankingApi.js` | lib/rankingApi.js | solo la referencia | solo la referencia | abrir Rankings |
| 0,50 | `hooks/useBilletera.js` | hooks/useBilletera.js | sí: hook de `App`, sin uid | sí: lee el saldo | — |
| 0,47 | `lib/correoCore.js` | lib/correoApi.js → lib/correoCore.js | no | no | cambiar el correo |
| 0,44 | `lib/mesaIAApi.js` | lib/mesaIAApi.js | solo la referencia | sí: `recoger` (`App.jsx:559`) | sentarse |
| 0,43 | `hooks/useAvisoSaldo.js` | screens/Lobby.jsx → components/BarraSuperior.jsx → hooks/useAvisoSaldo.js | no | sí: `BarraSuperior` | — |
| 0,43 | `lib/videoApi.js` | lib/videoApi.js | solo la referencia | solo la referencia | pedir un video |
| 0,43 | `styles/avisoSaldo.css` | screens/Lobby.jsx → components/BarraSuperior.jsx → components/AvisoSaldo.jsx → styles/avisoSaldo.css | no | no | un aviso de saldo |
| 0,43 | `styles/tactilLobby.css` | styles/tactilLobby.css | no | sí: `.lobby` | pantallas `.sal.es-anclada` |

**Dos hechos que la tabla no enseña:**

- **Otros caminos al motor.** `hooks/useAuth.js` y `hooks/billeteraCore.js` importan de `lib/controlMesaIA` solo la constante `ESPERAS_RED_MS` (desde `eab88b3` y `7650ba5`). `controlMesaIA` importa `mesaIACore`, y este el motor. También llega `MarcoVideo → CelebracionVideo → coreografiaCore → celebracionCore → gameEngine`. Dentro del grafo de entrada, de `gameEngine` solo se importa `PHASES`. El resto del módulo lo usa el trozo de la mesa.
- **Otros caminos a `lugarCore`.** Lo importan `perfilApi`, `rankingApi`, `Bandera`, `MiniPerfil`, `Rankings` y `Perfil`. `lugarCore` construye `POR_CODIGO` con `PAISES` al evaluarse el módulo, también en la Portada.

### Todo lo que entró desde ARN-3

| KiB | Tipo | Módulo | Nació en | Estado |
|---:|---|---|---|---|
| 3,17 | JS | `config/paises.js` | CFG-1 1b-b | nuevo |
| 3,15 | JS | `engine/aiPlayer.js` **(P)** | motor v1.2 | ya existía; bajó a la entrada |
| 2,54 | JS | `screens/Tienda.jsx` | TIE-1 1a-c | nuevo |
| 2,43 | JS | `engine/gameEngine.js` **(P)** | motor v1.2 | ya existía; bajó a la entrada |
| 2,38 | JS | `screens/Perfil.jsx` | CFG-1 1b-c | nuevo |
| 2,13 | JS | `components/HojaConfiguracion.jsx` | CFG-1 1a-c | nuevo |
| 1,89 | CSS | `styles/video.css` | ECO-1g | nuevo |
| 1,73 | CSS | `styles/rankings.css` | RNK-1 1c | nuevo |
| 1,68 | JS | `screens/Rankings.jsx` | RNK-1 1c | nuevo |
| 1,43 | JS | `components/CambiarCorreo.jsx` | CFG-1 1d-c | nuevo |
| 1,25 | CSS | `styles/hojaConfiguracion.css` | CFG-1 1a-c | nuevo |
| 1,24 | CSS | `styles/tienda.css` | TIE-1 1a-c | nuevo |
| 1,21 | CSS | `styles/perfil.css` | CFG-1 1b-c | nuevo |
| 1,11 | CSS | `styles/luz.css` | LUZ-1a | ya existía; bajó a la entrada |
| 1,11 | JS | `screens/IntersticialSumaMente.jsx` | RNK-1 1e | nuevo |
| 1,09 | JS | `components/MiniPerfil.jsx` | RNK-1 1c | nuevo |
| 1,03 | CSS | `styles/constancia.css` | ECO-1d | nuevo |
| 0,99 | JS | `components/CapaVideo.jsx` | ECO-1g | nuevo |
| 0,96 | CSS | `styles/sumamente.css` | RNK-1 1e | nuevo |
| 0,95 | JS | `components/EliminarCuenta.jsx` | CFG-1 1c-c | nuevo |
| 0,93 | JS | `engine/pozos.js` | APU-1a | ya existía; bajó a la entrada |
| 0,85 | JS | `lib/carasBaraja.js` | ARN-4 4c-a | nuevo |
| 0,81 | JS | `lib/controlVideo.js` | ECO-1g | nuevo |
| 0,79 | CSS | `styles/miniPerfil.css` | RNK-1 1c | nuevo |
| 0,73 | JS | `lib/correoApi.js` | CFG-1 1d-a | nuevo |
| 0,70 | JS | `components/CelebracionVideo.jsx` | ECO-1g | nuevo |
| 0,68 | CSS | `styles/eliminarCuenta.css` | CFG-1 1c-c | nuevo |
| 0,67 | JS | `hooks/videoCore.js` | ECO-1g | nuevo |
| 0,60 | JS | `hooks/mesaIACore.js` | ECO-1c | nuevo |
| 0,56 | JS | `components/GuardandoVideo.jsx` | ECO-1g | nuevo |
| 0,54 | JS | `lib/controlMesaIA.js` | ECO-1c | nuevo |
| 0,54 | CSS | `styles/vitrina.css` | TIE-1 1a-c | nuevo |
| 0,51 | JS | `lib/rankingApi.js` | RNK-1 1c | nuevo |
| 0,50 | JS | `hooks/useBilletera.js` | ECO-1b | nuevo |
| 0,47 | JS | `lib/correoCore.js` | CFG-1 1d-a | nuevo |
| 0,44 | JS | `lib/mesaIAApi.js` | ECO-1c | nuevo |
| 0,43 | JS | `hooks/useAvisoSaldo.js` | ECO-1c | nuevo |
| 0,43 | JS | `lib/videoApi.js` | ECO-1g | nuevo |
| 0,43 | CSS | `styles/avisoSaldo.css` | ECO-1c | nuevo |
| 0,43 | CSS | `styles/tactilLobby.css` | CFG-1 1a-c | nuevo |
| 0,40 | JS | `components/MarcoVideo.jsx` | ECO-1g | nuevo |
| 0,39 | JS | `components/AvisoSaldo.jsx` | ECO-1c | nuevo |
| 0,38 | JS | `hooks/billeteraCore.js` | ECO-1b | nuevo |
| 0,37 | JS | `components/CajaAccion.jsx` | IOS-1e | nuevo |
| 0,35 | JS | `components/Vitrina.jsx` | TIE-1 1a-c | nuevo |
| 0,34 | JS | `lib/pantallaCompletaCore.js` | PAN-1c | nuevo |
| 0,31 | JS | `hooks/useCongelado.js` | FRZ-1a | ya existía; bajó a la entrada |
| 0,31 | JS | `config/estados.js` | CFG-1 1b-b | nuevo |
| 0,30 | JS | `hooks/coreografiaCore.js` | anterior a ARN-3 | ya existía; bajó a la entrada |
| 0,29 | JS | `hooks/avisoSaldoCore.js` | ECO-1c | nuevo |
| 0,26 | JS | `lib/red.js` | IOS-1c | nuevo |
| 0,25 | JS | `hooks/tiendaCore.js` | TIE-1 1a-c | nuevo |
| 0,25 | JS | `lib/controlTapetes.js` | TIE-1 1a-c | nuevo |
| 0,25 | JS | `lib/lugarCore.js` | CFG-1 1b-b | nuevo |
| 0,24 | JS | `lib/constanciaApi.js` | ECO-1d | nuevo |
| 0,24 | JS | `components/SinVideo.jsx` | ECO-1g | nuevo |
| 0,24 | JS | `lib/cuentaApi.js` | CFG-1 1c-b | nuevo |
| 0,23 | CSS | `styles/correo.css` | CFG-1 1d-c | nuevo |
| 0,23 | JS | `components/zonaAccionCore.js` | IOS-1e | nuevo |
| 0,23 | JS | `lib/consultaApi.js` | CFG-1 1e-b | nuevo |
| 0,22 | JS | `components/IconosVideo.jsx` | ECO-1g | nuevo |
| 0,22 | JS | `lib/perfilApi.js` | CFG-1 1b-b | nuevo |
| 0,21 | JS | `hooks/celebracionCore.js` | anterior a ARN-3 | ya existía; bajó a la entrada |
| 0,21 | JS | `components/CuentaSinRed.jsx` | IOS-1c | nuevo |
| 0,21 | JS | `screens/rankingsCore.js` | RNK-1 1c | nuevo |
| 0,21 | JS | `components/FichaConstancia.jsx` | ECO-1d | nuevo |
| 0,20 | JS | `hooks/sesionCore.js` | anterior a ARN-3 | ya existía; bajó a la entrada |
| 0,19 | JS | `engine/handEvaluator.js` | motor v1.2 | ya existía; bajó a la entrada |
| 0,19 | JS | `lib/tiendaApi.js` | TIE-1 1a-b | nuevo |
| 0,19 | JS | `lib/reproductor.js` | ECO-1g | nuevo |
| 0,18 | JS | `hooks/constanciaCore.js` | ECO-1d | nuevo |
| 0,17 | JS | `lib/billeteraApi.js` | ECO-1b | nuevo |
| 0,17 | JS | `hooks/tapetesCore.js` | anterior a ARN-3 | ya existía; bajó a la entrada |
| 0,17 | JS | `hooks/useTapetes.js` | anterior a ARN-3 | ya existía; bajó a la entrada |
| 0,16 | JS | `config/melodiasCelebracion.js` | anterior a ARN-3 | ya existía; bajó a la entrada |
| 0,16 | JS | `lib/copiarTexto.js` | CFG-1 1a-a | nuevo |
| 0,16 | JS | `lib/sumaCore.js` | RNK-1 1e | nuevo |
| 0,15 | JS | `hooks/useCambioCorreo.js` | CFG-1 1d-c | nuevo |
| 0,15 | CSS | `styles/pildora.css` | IOS-1c | nuevo |
| 0,15 | JS | `components/miniPerfilCore.js` | RNK-1 1c | nuevo |
| 0,14 | JS | `lib/saldoRecordado.js` | IOS-1c | nuevo |
| 0,14 | JS | `engine/deck.js` **(P)** | motor v1.2 | ya existía; bajó a la entrada |
| 0,13 | JS | `lib/sumaContador.js` | RNK-1 1e | nuevo |
| 0,12 | JS | `config/sinRepetir.js` | anterior a ARN-3 | ya existía; bajó a la entrada |
| 0,12 | JS | `lib/puntos.js` | RNK-1 1b | nuevo |
| 0,10 | JS | `lib/limpiarAparato.js` | CFG-1 1c-b | nuevo |
| 0,10 | JS | `lib/dispositivo.js` | ECO-1c | nuevo |
| 0,09 | JS | `hooks/useDesborde.js` | IOS-1e | nuevo |
| 0,09 | JS | `components/Bandera.jsx` | CFG-1 1b-b | nuevo |
| 0,08 | JS | `dev/billeteraFalsa.js` | ECO-1b | nuevo |
| 0,07 | JS | `lib/saldoOculto.js` | CFG-1 1a-a | nuevo |
| 0,06 | JS | `screens/bautizoCore.js` | IOS-1c | nuevo |
| 0,05 | CSS | `styles/bandera.css` | CFG-1 1b-b | nuevo |
| 0,02 | JS | `hooks/useVideo.js` | ECO-1g | nuevo |
| 0,02 | JS | `context/useSoundContext.js` | ARN-4 4c-a | nuevo |
| 0,01 | JS | `assets/sumamente_64.webp?no-inline` | RNK-1 1e | nuevo |
| 0,01 | JS | `assets/cards/webp/uno_espada.webp` | CAR-1a | ya existía; bajó a la entrada |
| 0,01 | JS | `assets/sumamente_512.png` | RNK-1 1e | nuevo |
| 0,01 | JS | `assets/cards/webp/siete_oro.webp` | CAR-1a | ya existía; bajó a la entrada |
| 0,01 | JS | `assets/cards/webp/tres_copa.webp` | CAR-1a | ya existía; bajó a la entrada |
| 0,01 | JS | `config/version.js` | CFG-1 1a-a | nuevo |
| 0,01 | JS | `config/soporte.js` | CFG-1 1a-a | nuevo |

- **`lib/carasBaraja.js`** es nuevo como archivo, pero su contenido salió de `CardImage.jsx` en `e109d78`, que estaba en la entrada en ARN-3. No añade peso neto.
- **Los `.webp` y `.png` de 0,01** son solo su URL dentro del JS.
- **Los que ya existían y bajaron a la entrada** suman 9,62 KiB.

### Lo que ya es diferido hoy

| Trozo | Cuándo se pide | Hoy | En ARN-3 (— = sin medir) |
|---|---|---:|---:|
| `GameTable-*.js` | `precargarMesa()` al montar el Lobby (`Lobby.jsx:110`), `App.jsx:667`, y al entrar en la mesa | 29,58 | 36,22 |
| `GameTable-*.css` | con el JS anterior | 18,92 | 18,54 |
| Caras y aparatos de la Portada | a los 2,5 s (`1.8c`, «perezoso») | 144,7 | — |
| Clic de la puerta, `button-click.mp3` | un segundo después de pintar | 16,5 | — |
| `heptacoin-*.webp` animado | a los 2,5 s | 1 040,0 | — |

El único `import()` de código en `src/` es `lib/cargarMesa.js → components/GameTable`, con `lazy(fabricaMesa)` en `App.jsx:86` y el guardián `scripts/testMesaDiferida.test.js`. Las pantallas Tienda, Perfil, Rankings, SalaEspera, SalaOpciones, ArmarMesa, RetarIAS, PartidaPvP, Bautizo e `IntersticialSumaMente` se importan de forma estática desde `App.jsx`.

Sumando la entrada y la mesa, el JS y CSS pasó de 217,21 a 277,36 KiB (+60,15): la entrada creció 6,26 KiB más que el total porque la mesa adelgazó ese tanto.

---

## 6 · El ruido de `1.8f`

Cada corrida de `node scripts/diagPUE.mjs 1.8` en el worktree, en `4a7acbf`, compila incluido y tarda 6–7 s. Se corrió cinco veces.

| Corrida | `1.8f` | Δ contra el navegador | `1.8b` | FCP | Última petición crítica | Código |
|---|---:|---:|---:|---:|---:|---:|
| 1 | 235,6 | 0,0 | 235,6 | 268 ms | 176 ms | 1 |
| 2 | 235,6 | 0,0 | 235,6 | 252 ms | 164 ms | 1 |
| 3 | 235,6 | 0,0 | 235,6 | 252 ms | 163 ms | 1 |
| 4 | 235,6 | 0,0 | 235,6 | 264 ms | 169 ms | 1 |
| 5 | 235,6 | 0,0 | 235,6 | 260 ms | 166 ms | 1 |

- **Media 235,6; dispersión 0,0**, con la precisión de 0,1 KiB que imprime la línea.
- **En bytes, corrida 5:** navegador 241 220, `peso` sobre el mismo `dist/` 241 220: Δ 0 bytes. Las otras cuatro no se conservan en bytes, porque `diagPUE.json` guarda solo la última corrida.
- **El margen de tiempo:** la cifra del navegador depende de que las imágenes se pidan antes del FCP. En esta máquina, entre 88 y 95 ms de margen en estas cinco corridas. Si una imagen se pidiese después, `1.8b` bajaría unos KiB y `1.8f` enseñaría ese Δ; no pasó aquí.
- **Código 1** en las cinco por `1.8b`, como se esperaba.

---

## 7 · Observaciones

1. **El rojo lleva 18 días.** `1.8b` cruzó 200 el 2026-10-16 (`7650ba5`) y no se vio hasta la corrida de `completo` del 2026-11-03.
2. **Ruido de la serie:** hay Δ de ±0,01 sin que cambie lo que entra (`abc2ebc`, `df511d8`). Son los hash dentro del paquete: el de `__APP_COMMIT__` y el del nombre del trozo de la mesa. El segundo decimal no es señal.
3. **`--sourcemap` añade bytes:** el comentario `sourceMappingURL` da 169,19 y 235,60 en vez de 169,15 y 235,57. Los totales de este informe salen de compilaciones sin él.
4. **Navegador y `peso` cuentan 7 y 6 recursos** con el mismo peso: el isotipo aparece dos veces en la bitácora, y la segunda no trae cuerpo.
5. **`src/dev/` sigue en la entrada** con muy poco: `billeteraFalsa`, `salasFixtures` y `siembraAPU` suman 0,15 KiB.
6. **Comentario desfasado:** `scripts/diagPUE.mjs` dice «~168,8 KiB» al bajar de 222; la medida final de la 3d fue 169,2. No afecta a nada.
7. **Una ampliación de la ficha.** El §3-F pedía `--sourcemap` en dos commits; lo usé en 35, siempre en el worktree, para escribir la causa de los saltos del §4 con el módulo y su peso. No hizo falta ningún paquete nuevo.
8. **Andamio.** Un heredoc de Bash se comió barras invertidas de un script del scratchpad; lo reescribí como archivo. El SVG incrustado de `constancia.css` no aparecía en mi primer reparto de CSS y lo corregí antes de escribir estas tablas.

---

## 8 · Tiempo real y compilaciones

- **Tiempo:** unos 19 minutos de reloj, de las 23:18 a las 23:37 de la máquina (tope de la ficha: 3 h).
- **Compilaciones:** 120 (75 de la serie y el detalle, 35 con `--sourcemap`, 5 de `diagPUE 1.8`, 5 sueltas).
- **Sin fallos de compilación.**

---

## 9 · Limpieza para Victor

Este es el orden. Los scripts de análisis y sus resultados están dentro de `scratchpad\analisis`.

```
cmd /c rmdir "C:\Users\victo\AppData\Local\Temp\claude\c--Users-victo-OneDrive-Documents-ajilei\e2065153-ea81-4d5e-9d54-b872f5856b86\scratchpad\wt-pes1\node_modules"
```

Comprueba que el `node_modules` del repo sigue entero (hoy el primer comando da 155 y el segundo debe dar `True`):

```
(Get-ChildItem "C:\Users\victo\OneDrive\Documents\ajilei\node_modules").Count
Test-Path "C:\Users\victo\OneDrive\Documents\ajilei\node_modules\vite\package.json"
```

```
git worktree remove --force "C:\Users\victo\AppData\Local\Temp\claude\c--Users-victo-OneDrive-Documents-ajilei\e2065153-ea81-4d5e-9d54-b872f5856b86\scratchpad\wt-pes1"
git worktree prune
git worktree list
```

`git worktree list` debe dar una sola línea. Y, si quieres borrar los scripts de análisis:

```
Remove-Item -Recurse -Force "C:\Users\victo\AppData\Local\Temp\claude\c--Users-victo-OneDrive-Documents-ajilei\e2065153-ea81-4d5e-9d54-b872f5856b86\scratchpad\analisis"
```
