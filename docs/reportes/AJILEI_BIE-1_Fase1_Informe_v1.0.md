# AJILEI · BIE-1 · Bienvenida · Fase 1 · Informe v1.0

**Fecha:** 2026-10-01
**Ficha:** `AJILEI_BIE-1_Fase1_v1.0.md` (sub-tandas 1a y 1b)
**Punto de partida:** `main` en `aabaeed` (AJF-1c). Fase 0 aceptada (`docs/reportes/AJILEI_BIE-1_Fase0_Informe_v1.0.md`, sin commitear).
**Instrumento:** Edge 154.0.4258.37 · playwright-core del repo · `vite preview` 4173 tras `npm run build`.
**Lámina elegida por Victor:** **P (puntos) con isotipo**.
**Estado:** STOP-2 cerrado. Validación física de Victor en verde (túnel; S25 y PC; cuatro de cuatro). Mapa aprobado con un cambio: `capturar.mjs` entra en (d). Commits hechos según §F.

## Resumen

- **La guitarra ya no suena en la puerta.** El escuchador global de la Portada se retiró (D2). `play` tiene ahora identidad estable (D3). Los botones de la puerta suenan con el clic de la casa, y los huecos no suenan (D1). La puerta `bie.s1` cuenta **0 rasgueos** en 12 gestos a ritmo de persona. El control sobre `aabaeed` (`bie.s5`) contó **10**.
- **La pantalla verde tiene ahora «Cargando».** La rama `CARGANDO` de `App.jsx` pinta el indicador elegido, gobernado por la regla D5: no aparece antes de 300 ms y, si aparece, se queda al menos 500 ms. Medido: con `profiles` a 0 ms no aparece. A 1 000 ms aparece a los 309–313 ms del vacío y sigue hasta el lobby. A 350 ms se queda 501–515 ms.
- **Todas las varas en su sitio.** Vitest 1073/1073 (1056 + 17). Eslint 21. `diagPUE` 194 verdes, con `bie` entero, y `1.8b` rojo conocido a 220,4 KiB. `dis` 68/68. `diagSAL` 102/102. `diagDSK lob` 6/6.
- **Cada commit del mapa compila solo.** Se comprobó en una copia de `HEAD` fuera del repo, sin tocar el área de preparación (§F).

---

## §A · Sonido (sub-tanda 1a-i)

| # | Cambio | Dónde |
|---|---|---|
| 1 | `play` estable. La decisión pasa a la pieza pura `reproducir(nombre, activo, sonido)`. `play` es `useCallback(..., [])` y lee el ajuste por una ref que sincroniza un efecto: siempre dentro de `play`, nunca en el render | `src/hooks/useSounds.js:200` (pieza), `:245-247` (hook) |
| 2 | Prueba de la pieza pura, 7 casos. El caso que permite dejar las dependencias vacías: la MISMA función obedece cuando se apaga y se enciende el sonido | `src/hooks/useSounds.test.js` |
| 3 | Escuchador global `pointerdown` de la Portada **retirado**, con su `useSounds` | `src/screens/Portada.jsx` (antiguo `:256-262`; el comentario queda en `:252-257`) |
| 4 | Clic por `SoundButton` en el globo de idioma, sus entradas y JUGAR | `Portada.jsx:389`, `:398`, `:526` |
| 5 | Clic por `SoundButton` en Enviar código, Entrar, Reenviar código y Cambiar correo | `src/components/FormularioPuerta.jsx:131`, `:168`, `:172`, `:193` |
| 6 | Clic por `SoundButton` en Confirmar, Cancelar y Cerrar sesión del Bautizo | `src/screens/Bautizo.jsx:111`, `:117`, `:127` |
| 7 | Precarga: `SONIDOS_PORTADA = ['buttonClick']`. El desbloqueo de Howler sigue armándose al construir el primer `Howl` | `useSounds.js:65` |
| 8 | `1.8c`: el rótulo pasa a «(clic de la puerta incluido)» | `scripts/diagPUE.mjs:1144` |

**Por qué la prueba no monta el hook.** El proyecto no tiene jsdom ni `@testing-library`, y la ficha prohíbe dependencias nuevas. Se prueba la pieza pura con la receta de la casa. La identidad estable de `play` entre renders no se puede probar sin renderizador; la cubre `bie.s1`, que con el defecto viejo sale roja.

**Una trampa de lint.** El primer intento guardaba el reproductor en un `useState(() => fabrica(() => ref.current))`. La regla `react-hooks/refs` del repo lo rechaza: una ref solo se lee dentro de un manejador o de un callback. Por eso se hizo con la pieza pura y `useCallback`.

**`SoundButton`** conserva `type`, `disabled` y la clase, porque reparte las props sobre el mismo `<button>`. La caja del formulario no se movió: `diagPUE 2.4` sale verde. Enter dentro del campo dispara el envío implícito, que el navegador hace como un clic en el botón de enviar: **un** clic (`bie.s3`).

## §B · Indicador «Cargando» (sub-tanda 1b)

| # | Cambio | Dónde |
|---|---|---|
| 1 | **Controlador puro de la regla D5**, `creaEsperaVisible`. Entra `cargando` y salen `mostrar` y `liberar`, con `liberar = !cargando && !mostrar`. Los relojes llegan por parámetro y se limpian en `suelta()` | `src/hooks/useEsperaVisible.js:29` |
| 2 | Hook delgado `useEsperaVisible(cargando)` | `useEsperaVisible.js:97-112` |
| 3 | Prueba con temporizadores falsos, 10 casos (molde `useCongelado`) | `src/hooks/useEsperaVisible.test.js` |
| 4 | **Componente** `Cargando`: forma P con isotipo, `role="status"` y `aria-live="polite"`, texto por `t('app.cargando')`, isotipo y puntos con `aria-hidden` | `src/components/Cargando.jsx` |
| 5 | **Hoja nueva** con las medidas de la lámina, `--green-abyss` a pantalla completa y movimiento reducido | `src/styles/cargando.css` |
| 6 | **`App.jsx`:** import (`:31-32`), el hook junto a los demás y antes de cualquier retorno (`:101`), y la rama: `if (!espera.liberar) return espera.mostrar ? <Cargando /> : null` | `src/App.jsx:343-355` |
| 7 | Clave `app.cargando` = «Cargando» | `src/config/textos.es.js:31` |
| 8 | `app.` entra en los prefijos declarados del diccionario | `src/config/textos.test.js:84` |

### B1 · La regla, punto por punto

- **Antes de 300 ms no se muestra nada.** La rama devuelve `null` como hasta ahora: el vacío verde de uno o dos fotogramas no cambia.
- **Si se mostró, `liberar` no llega antes de 500 ms.** El controlador guarda la hora en que apareció. Al terminar la carga, programa la liberación para lo que falte hasta los 500 ms. Mientras tanto, el lobby espera (coste aceptado en D5).
- **Si la carga vuelve a empezar durante el mínimo,** el indicador sigue visible y no se rearma el retardo. Es el caso 5 de la prueba.
- **No espera a `mi_sala()` (D6).** El controlador solo mira `auth.estado === CARGANDO`.

### B2 · Dos decisiones del hook que importan

1. **`liberar` se calcula con el `cargando` del render en curso**, no con el que el controlador vio en el efecto anterior. Si la carga termina antes del retardo, el lobby se pinta en el mismo render en que `useAuth` sale de CARGANDO, sin un fotograma de vacío añadido. Medido: vacío→lobby **3–6 ms** con `profiles` a 0 (`bie.c2`), igual que en la Fase 0.
2. **`useLayoutEffect` y no `useEffect`.** Con un efecto pasivo, el reloj de 300 ms podía saltar entre el commit del lobby y el efecto que le avisa de que la carga terminó. El indicador habría tapado el lobby ya pintado. Con el efecto de layout, el controlador se entera en la misma tarea del commit.

El doble montaje de StrictMode en desarrollo está cubierto: `suelta()` devuelve el controlador al estado de partida, y el segundo montaje arranca limpio (caso 8).

### B3 · El componente, contra la lámina

- **Mismas medidas que la lámina.** La pantalla es el contenedor (`container-type: size`) y todo mide en `cqmin`: alto del isotipo `clamp(48px, 9cqmin, 84px)`, texto `clamp(15px, 2.4cqmin, 20px)`, separación `clamp(14px, 3.2cqmin, 26px)`, puntos de `.32em` y el latido de 1,2 s escalonado 0,2 s.
- **El interlineado.** La lámina heredaba `line-height: 1.45` de su propio `body`. Sin ese valor, la fila medía 26 px de alto en vez de 29 a 1920, y el conjunto 136 en vez de 139. Se declaró en `.cargando`.
- **El isotipo solo se escala.** Lleva su `alt` vacío y `aria-hidden`, y se importa con `?no-inline`, como en el lobby: es el mismo archivo, y el lobby lo encuentra después en la caché. El anclaje óptico lo trae el maestro (`viewBox`): no se recorta, no se desplaza y no se recentra.
- **No se mueve nada al aparecer.** La caja del isotipo tiene alto y proporción declarados. Medido (§C2): en el arranque, el isotipo todavía no ha cargado en el commit y la caja es idéntica unos 170 ms después, ya cargado.
- **Movimiento reducido.** Con `prefers-reduced-motion: reduce`, los tres puntos quedan quietos a opacidad .7, como en la lámina. Sin animaciones en marcha (`bie.c7`).

---

## §C · Modo `bie` del arnés

`scripts/diagPUE.mjs:1407-1661`, con el apoyo en `scripts/bie/bieRed.mjs`. Corre dentro de `todo`.

- **Red de Supabase simulada.** `otp` → `{}`; `verify` → una sesión con el molde de CAP-1; `profiles` con retardo parametrizable; `rpc` → `null`; `user` → el usuario.
- **Lo demás se corta y se anota.** La puerta no tiene que hablar con nadie más.
- **Instrumentos que corren antes que la app:**
  - Un contador sobre `AudioBufferSourceNode.prototype.start`, que clasifica cada sonido por la duración del búfer: rasgueo 3,657 s, clic 0,528 s y desbloqueo de Howler, 1 muestra.
  - Un MutationObserver sobre `#root`. Cuando llega `.cargando`, lee su caja en el mismo commit, antes de pintar.
- **Opciones de 1b en `contextoBie`:**
  - `conSesion` siembra la sesión de CAP-1 en el almacén del SDK (`bie.c5`).
  - `reducido` emula `prefers-reduced-motion` (`bie.c7`).

### C1 · Sonido, en 1920×1080 y 390×844, a 2,2 s entre gestos

| Puerta | Resultado | Detalle |
|---|---|---|
| `bie.s0` | VERDE | Lobby alcanzado en las dos vistas. 4 peticiones simuladas a Supabase, 0 fuera, 0 errores. El hueco se tocó en `pue-lienzo` (77,540 y 16,422). Enter llega al paso del código |
| `bie.s1` | VERDE | **0 rasgueos** en 12 gestos |
| `bie.s2` | VERDE | Enviar código 1 · Entrar 1 · JUGAR 1. Hueco 0, correo y teclear 0, código y teclear 0 |
| `bie.s3` | VERDE | Enter en el correo: **1 clic** |
| `bie.s4` | VERDE | Desbloqueo en el primer gesto: 1 en escritorio y 3 en el teléfono (touchstart, touchend y click; Howler los arma los tres) |
| `bie.s5` | control (no automatizado) | Misma secuencia con el `src/` de `aabaeed` (apartado con `git stash`, compilado, medido, devuelto y recompilado): **10 rasgueos en 12 gestos**. En 1920 cada gesto dio clic 0 y RASGUEO 1. En 390 sonó en hueco, JUGAR, correo, Enviar y código; en Entrar no. Enter: 0 clics. **La puerta ve el defecto** |

### C2 · Indicador (`bie.c1`–`c7`)

Tiempos en ms de la página, a la hora del commit de React (MutationObserver), medidos desde que `#root` se vacía tras «Entrar».

| Puerta | Resultado | Medido |
|---|---|---|
| `bie.c1` anónimo sin sesión: nunca aparece | VERDE | 1920 y 390: Portada; «Cargando» 0 veces en 3 s |
| `bie.c2` `profiles` a 0 ms: no aparece, lobby directo | VERDE | Vacío→lobby: 6 ms (1920) y 3 ms (390) |
| `bie.c3` `profiles` a 1 000 ms: aparece entre 300 y 400 ms y sigue hasta el lobby | VERDE | 1920: aparece a 309, lobby a 1 010, visible 701. 390: aparece a 313, lobby a 1 019, visible 706. Tras él viene el lobby, sin vacío intermedio |
| `bie.c4` `profiles` a 350 ms: si aparece, se queda ≥ 500 ms | VERDE | 4/4 pasadas lo enseñaron (aparece a 301–310 ms). Visible 501 · 507 ms (1920) y 506 · 515 ms (390) |
| `bie.c5` arranque con la sesión de CAP-1 y `profiles` a 1 000 ms: aparece | VERDE | Del arranque al indicador: 314 ms (1920) y 313 ms (390). Visible 722 y 723 ms |
| `bie.c6` `role="status"` con «Cargando» | VERDE | `aria-live=polite`, texto «Cargando», `aria-hidden` en el isotipo y en los puntos, 3 animaciones en marcha, fondo `rgb(9, 23, 14)` (`--green-abyss`) |
| `bie.c7` movimiento reducido: sin animación activa | VERDE | **0** animaciones en marcha, texto «Cargando». Control sin reducir: 3 en cada vista |

Cifras de la pasada de `todo` sobre el árbol final (§E). Una pasada anterior de `bie` sola, sin `line-height`, dio lo mismo con diferencias de pocos ms.

**La caja no se mueve** (no es puerta; se imprime debajo de las puertas):

| Caso | Caja en el commit | Caja después | Isotipo |
|---|---|---|---|
| 1920 · paso del código | 893,39 · 470,5 · 133,2 × 139 | idéntica a +265 ms | ya en caché: la Portada usa el mismo archivo |
| 390 · paso del código | 145,03 · 380,13 · 99,92 × 83,75 | idéntica a +501 ms | en caché |
| 1920 · arranque con sesión | 893,39 · 470,5 · 133,2 × 139 | idéntica a +170 ms | **sin cargar en el commit**, cargado después |
| 390 · arranque con sesión | 145,03 · 380,13 · 99,92 × 83,75 | idéntica a +171 ms | **sin cargar en el commit**, cargado después |
| 1920 · movimiento reducido | 893,39 · 470,5 · 133,2 × 139 | idéntica a +766 ms | en caché |

**Son las medidas de la lámina:** 133,2 × 139 a 1920 y 99,92 × 83,75 en el teléfono (`laminas/bie1/capturas/medidas.json`, P con isotipo). Antes de declarar `line-height: 1.45` daban 136,09 y 85,2.

El centro del indicador cae en el centro de la pantalla: (959,99 ; 540,00) a 1920×1080 y (194,99 ; 422,00) a 390×844.

---

## §D · Lámina (sub-tanda 1a-iii)

`laminas/bie1/lamina.html` se abre con doble clic: lee `theme.css` y el isotipo maestro por ruta relativa. Tiene estos interruptores:

- Forma P o B.
- Isotipo con o sin.
- Movimiento reducido.
- Simular espera de 0,2, 1, 2 y 4 s, con la regla D5 de verdad: con 0,2 s no aparece; con 1 s sale a los 306 ms y el lobby llega a los 1 010.
- Las cuatro vistas.

`laminas/bie1/capturar.mjs` genera:

- 16 capturas (P/B × con/sin isotipo × 4 vistas), 175 KB en total;
- `capturas/medidas.json`, 8 KB;
- `capturas/hoja.png`, la hoja de contacto, 307 KB.

**Elegida por Victor: P con isotipo.** Medidas de la lámina para esa forma: 1920 → indicador 133,2 × 139, isotipo 56 × 84, texto 20 px. Teléfonos y 844×390 → isotipo 32 × 48, texto 15 px. Sin desbordes.

---

## §E · Varas finales

Sobre el árbol final, tras `npm run build`.

| Vara | Línea base (ficha) | Final | Veredicto |
|---|---|---|---|
| `npm run build` | limpio | limpio (solo el aviso de siempre de chunk > 500 kB) | ✔ |
| `npm test` (vitest) | 1056/1056 | **1073/1073** (39 archivos; +7 `useSounds`, +10 `useEsperaVisible`) | ✔ |
| `npx eslint .` | 21 | **21** (20 errores, 1 aviso). Los 13 archivos tocados salen con código 0 | ✔ |
| `diagPUE` completo (4173) | 182 verdes + `1.8b` | **194 verdes + `1.8b`** (182 + `bie.s0`–`s4` + `bie.c1`–`c7`) | ✔ |
| · `1.8b` | 219,6 KiB | 219,7 tras 1a (`SoundButton` en tres pantallas) → **220,4 KiB** tras 1b (+0,7 KiB: componente, hoja, controlador y clave) | rojo conocido; sube del orden de cientos de bytes, como admite la ficha |
| · `dis` (dentro de `todo`) | 68/68 | **68/68** | ✔ |
| · `2.4` (caja del formulario) | verde | verde | ✔ |
| `diagSAL sal` | 102/102 | **102/102** | ✔ |
| `diagDSK lob` | 6/6 | **6/6** celdas (`lob.1`–`lob.7` en los 6 viewports de `gate`) | ✔ |

**Desviación declarada** (la misma de AJF-1): `diagSAL` y `diagDSK lob` corren contra el servidor de desarrollo con bypass, en `http://localhost:5174`, levantado para esta tanda y cerrado al terminar. Sin bypass no llegan al lobby. Con bypass, `useAuth` está clavado en COMPLETO y el indicador nunca entra en juego: estas dos varas prueban que el lobby y las salas no se movieron.

`diagDSK` repite el aviso conocido de deriva (líneas base con Edge 151.0.4129.93, vivo 154.0.4258.37), que no afecta a `lob`.

**Sondas:** las comprobaciones de aislamiento (§F) vivieron en el scratchpad de la sesión, fuera del repo. No hay `_*.mjs` nuevos en `scripts/`.

---

## §F · Mapa archivo → commit propuesto

| Commit | Rutas (explícitas) |
|---|---|
| **(a)** `BIE-1a: núcleo — play estable y regla D5 del «Cargando»` | `src/hooks/useSounds.js` · `src/hooks/useSounds.test.js` · `src/hooks/useEsperaVisible.js` · `src/hooks/useEsperaVisible.test.js` |
| **(b)** `BIE-1b: pantallas — clic en los botones de la puerta e indicador «Cargando»` | `src/screens/Portada.jsx` · `src/components/FormularioPuerta.jsx` · `src/screens/Bautizo.jsx` · `src/App.jsx` · `src/components/Cargando.jsx` · `src/styles/cargando.css` · `src/config/textos.es.js` · `src/config/textos.test.js` |
| **(c)** `BIE-1c: arnés — modo bie de diagPUE` | `scripts/diagPUE.mjs` · `scripts/bie/bieRed.mjs` |
| **(d)** `BIE-1d: informes de las Fases 0 y 1 y lámina` | `docs/reportes/AJILEI_BIE-1_Fase0_Informe_v1.0.md` · `docs/reportes/AJILEI_BIE-1_Fase1_Informe_v1.0.md` · `laminas/bie1/lamina.html` · `laminas/bie1/capturar.mjs` · `laminas/bie1/capturas/hoja.png` · `laminas/bie1/capturas/medidas.json` |

**Decisiones de Victor sobre este mapa (2026-10-01):**
- Mapa aprobado con un cambio: `laminas/bie1/capturar.mjs` entra en **(d)**. Las 16 capturas no entran.
- `testBancoBandas` (§G.1) queda anotado para la tanda de higiene del arnés.
- Validación física (§4 de la ficha) en verde: túnel, S25 y PC, cuatro de cuatro.

Notas:

- **(a) compila sin (b).** La Portada vieja todavía llama a `play('ajileiStrum')` desde su escuchador, y el `play` nuevo lo sigue sirviendo. `useEsperaVisible` aún no lo importa nadie.
- **`textos.test.js` va en (b) y no en (a).** Amplía los prefijos por la clave `app.cargando`, que entra en (b). En (a) la prueba pasa porque esa clave todavía no existe.
- **(c)** lleva `bieRed.mjs` con `diagPUE.mjs`, que lo importa.
- **(d)** según la instrucción de Victor: la lámina, la hoja de contacto y las medidas. **Las 16 capturas no entran.**
  - **`laminas/bie1/capturar.mjs` entra por decisión de Victor.** Es lo que regenera `hoja.png`, `medidas.json` y las 16 capturas, como el script equivalente que entró en AJF-1c.
- **Los seis residuos conocidos no entran en ningún commit:** `docs/reportes/AJILEI_MOT-1_Fase0_Informe_v1.0.md`, `docs/reportes/AJILEI_MOT-1_Fase1-0_Sonda_Informe_v1.0.md`, `laminas/mon1/*` y `scripts/_cel1bFila.mjs`.

**Comprobado que cada commit compila solo, sin tocar el área de preparación:**

- **Montaje.** Se sacó `HEAD` con `git archive` a un directorio del scratchpad, con `node_modules` enlazado por una unión.
- **Pasadas.** Se aplicaron las capas una a una: (a), luego (a)+(b), luego (a)+(b)+(c). En cada una, `vite build` limpio, vitest **1073/1073** y eslint **21**. En (c), además, `node --check scripts/diagPUE.mjs` y la importación de `bieRed.mjs`.
- **Árbol final.** La copia coincide byte a byte con el árbol de trabajo en los 15 archivos de código.
- **Un aviso.** `scripts/testBancoBandas.test.js` lee volcados que git ignora (`capturas-dsk/*`, los `origen` de `scripts/apu1_bandas.json`), así que en una copia limpia de `HEAD` falla aunque no se toque nada. Se copiaron esos volcados para que la comprobación fuera equivalente. Se anota en §G.

---

## §G · Hallazgos fuera de alcance (solo se anotan)

1. **`testBancoBandas` depende de archivos ignorados.** En una copia limpia del repo, o en una máquina nueva, el caso «la procedencia coincide con el volcado» falla con `expected 0 to be greater than 0`. Toma de la tanda de higiene del arnés.
2. **Desbloqueo ×3 en el teléfono** (`bie.s4`). Howler 2.2.4 reproduce su búfer de desbloqueo en `touchstart`, en `touchend` y en `click`. Es inaudible (1 muestra) y propio de la librería; no se toca.
3. **El indicador también cubre el arranque con sesión y el Bautizo.** La rama CARGANDO es la misma, así que la PWA abierta con sesión y red lenta enseña «Cargando» (`bie.c5`), y lo mismo el paso de crear el perfil. Es lo que recomendaba la Fase 0 (camino 1).
4. **El crédito de `ajilei-strum`** (Fase 0, posible cruce del ID 85867) sigue sin revisar. No era de esta fase.

---

**STOP-2.** Informe escrito. Los commits se hicieron después, con la autorización de Victor y según §F.
