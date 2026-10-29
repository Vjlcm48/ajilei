# AJILEI — Configuración (el ⚙) · v1.0

- **Archivo:** `docs/AJILEI_Configuracion_v1.0.md`
- **Versión:** 1.0 · **Fecha:** 2026-10-29 · **Nace en:** CFG-1, Fase 1a
- **Base:** `docs/reportes/AJILEI_CFG-1_Fase0_Informe_v1.0.md`, la lámina `laminas/cfg1a` (informe `docs/reportes/AJILEI_CFG-1_Fase1aL_Informe_v1.0.md`) y las decisiones de Victor de la ficha de la 1a (§0).
- **Lo vigilan:** `diagDSK cfg` (diez puertas, §7 y §8), `src/lib/saldoOculto.test.js`, `scripts/testClavesAlmacen.test.js` y `src/config/textos.test.js`.

En la casa se le llama «menú de configuraciones». Este documento dice qué hay en él, cómo se comporta y qué viene después.

---

## 1. El ⚙ y el ⋮

- **El ⚙** es el botón de la barra superior. Abre la hoja de configuración (`src/components/HojaConfiguracion.jsx`). Está en el lobby y en las seis pantallas de `.sal`: Retar, Armar mesa, Rankings, Salas, Sala de espera y PvP.
- **El ⋮** es «el menú de la mesa» (`src/components/UtilitiesMenu.jsx`). Solo existe dentro de la mesa. Se rige por `AJILEI_Menu_Utilidades_v1.5.md`.
- Son dos menús distintos y no se confunden (contradicción e, §10). Lo único que comparten es el estado del sonido (§3).

## 2. Lo que hay en la hoja tras la 1a

| Fila | Estado tras la 1a | Llega en |
|---|---|---|
| Cabecera: «Configuración», avatar, nombre y correo enmascarado | Fija; el correo con `enmascararCorreo` (`c•••@gmail.com`) | — |
| Sonido | **Vivo.** Pastilla «Sí» / «No» | 1a |
| Idioma | «Español» + «Pronto» | IDI-1 |
| Enviar sugerencia | **Vivo.** Se despliega (§5) | 1a |
| Cerrar sesión | Vivo, como desde LOB-1 | — |
| Acerca de | **Vivo.** Primera línea: la versión (§4), luego los créditos | 1a |
| Eliminar cuenta | «Pronto» | 1c |

Las filas miden 44 px de alto como mínimo (§7). «Pronto» sale con el aviso de la hoja, por encima del velo.

## 3. Sonido: un solo estado

- Hay un solo estado de sonido, `SoundContext` (`src/context/SoundContext.jsx`), guardado en `ajilei.sound` (INV-68).
- La fila «Sonido» de la hoja y la entrada de sonido del ⋮ leen y cambian ese mismo estado.
- Si se apaga en la hoja, el ⋮ de la mesa sale con `is-off` y el icono atenuado. La regla vive en `src/styles/menuMovil.css` para la piel móvil y en `src/styles/hojaConfiguracion.css` §6 para la de escritorio.
- Si se enciende en el ⋮, la hoja dice «Sí».
- **El clic de la fila.** Es un `SoundButton`, que suena antes de su `onClick`.
  - Al apagar: el clic arranca y `Howler.mute` lo corta en el render siguiente.
  - Al encender: no suena, porque cuando se pidió todavía estaba apagado.
- Detalle anotado y no cambiado: `SoundContext.jsx:32` escribe `'on'` al montar si no había nada guardado.

## 4. La versión

- «Acerca de» empieza por `AJILEI {versión} · {commit}`, por ejemplo `AJILEI 0.9.0 · c0bc2c1`. El commit va en `<code>`, sin el vestido que `index.css` pone a todo `<code>`.
- **Dónde nace.** `vite.config.js` escribe dos globales con `define`:
  - `__APP_VERSION__`: la versión de `package.json` (0.9.0 desde la 1a);
  - `__APP_COMMIT__`: el commit.
- `src/config/version.js` las lee y cae a `'0.0.0'` y `'local'` si no existen.
- **La cadena del commit.** Se toma el primero que exista, cortado a 7 caracteres hexadecimales:
  1. `WORKERS_CI_COMMIT_SHA` (Workers Builds, que es como se compila ajilei.io);
  2. `CF_PAGES_COMMIT_SHA`;
  3. `git rev-parse --short=7 HEAD`;
  4. `local`.
- **El respaldo nunca rompe la compilación.** Compilar sin git da `local`. Lo que no parece un hash corto se descarta.

## 5. Enviar sugerencia

- Es contacto con soporte, no ayuda sobre una jugada (contradicción g, §10).
- La fila se despliega como «Acerca de» y enseña:
  - la dirección de soporte a la vista, seleccionable entera de un toque;
  - «Escribir correo»: un `mailto:` con el asunto `Sugerencia · AJILEI {versión}`. El cuerpo lleva jugador, versión y commit, aparato (`navigator.userAgent`), idioma y dos líneas en blanco;
  - «Copiar correo»: `src/lib/copiarTexto.js`, que usa `navigator.clipboard` y, si falla, `execCommand`. Al copiar sale el aviso «Copiado» por encima del velo. Si no pudo copiar, no lo dice.
- **El uuid no viaja nunca.**
- La dirección es una constante única, `CORREO_SOPORTE` en `src/config/soporte.js`. No está en el diccionario: una dirección no se traduce.
- Los dos botones miden 44 de alto y llevan `data-sin-pantalla-completa` (INV-45).

## 6. El ojito

- Vive **solo en la píldora del lobby** (INV-69). `BarraSuperior` lo pinta únicamente si recibe `onOjito`, y solo `Lobby` se la pasa.
- No se pinta en Rankings, Retar, Salas, Armar mesa, la Sala de espera, PvP, la mesa ni el mini-perfil.
- Está entre la moneda y la cifra (lámina V1-C). Es un glifo de línea de 1,5 em, en el tono tenue de la cifra: **no es oro**. El único oro macizo de la barra es el «+».
- **Tapa la cifra siempre**, también mientras cuenta: con el aviso de saldo y con la celebración del video. La cifra sigue en su caja, invisible y con `aria-hidden`, y los puntos «••••» se pintan encima, centrados. Mientras la cifra de debajo cuenta, los puntos no se mueven.
- **La caja de la cifra mide 4,6 ch como mínimo**, abierta y tapada, en el lobby: el ancho de «2.500» en cifras tabulares. Así el ancho no delata los dígitos y la caja mide lo mismo abierta que tapada (O1).
  - Con 9 HC mide lo mismo que con 5.000.
  - Por encima de cuatro dígitos crece con la cifra, igual abierta que tapada.
- **Se recuerda en el aparato.** La clave es `ajilei.saldoOculto`, con `'si'` o `'no'`, por el accesor `src/lib/saldoOculto.js`. No viaja al servidor ni se borra al cerrar sesión.
- Para el arnés, la píldora lleva `data-saldo-oculto` mientras está tapada.

## 7. El piso táctil de 44 y el camino Z

- **Dónde rige.** En el lobby y en la carcasa anclada (`.sal.es-anclada`: Retar, Salas, Armar mesa y Rankings).
  - La regla de los 44 viene de INV-07 y de la contradicción h (§10).
  - Las filas de la hoja y los botones de la sugerencia miden 44 visibles.
- **El camino Z.** Los tocables de la barra y de la cabecera ganan una zona invisible de 44 sin que cambie lo que se ve. Es un `::after` transparente con `inset: min(0px, calc(50% − 22px))`, en `src/styles/tactilLobby.css`.
  - Lo llevan el ⚙, el avatar, el «+», el ojito, la casa, la flecha, los chips, los ± y «Unirme».
  - Vale también con ratón: en escritorio los botones ya miden 44 y el pseudo vale 0.
- **Lo que hizo falta para que la zona fuera real, y no solo geométrica** (los cuatro arreglos de la lámina):
  1. **Capas.** `lob-top`, `lob-centro`, `sal-cab` y `sal-cuerpo` compartían `z-index: 1` y la fila siguiente se comía la zona. Ahora la barra va en 2 (lobby) o en 3 (carcasa) y la cabecera en 2.
  2. **La casa de la carcasa.** Era `static` y su zona se colgaba de un ancestro: 216×38 sobre la flecha. Ahora es `relative` con `inset: auto`.
  3. **La cifra tapada** no atrapa el toque (`pointer-events: none`).
  4. **El aviso de la hoja** va por encima del velo (§8).
- **El «+» del lobby va en `z-index: 1`.** Si no, la primera pepita de la ficha de la constancia le comía 1,4 px.
- **R-9.** Por debajo de 390 px de ancho, la zona de la casa y la de la flecha crece como mucho 2 px hacia arriba y el resto hacia abajo. En 360 se pisaban 3,7 px con las del ⚙ y el avatar.
- **La Sala de espera y PvP quedan fuera.** Es un hueco declarado (INV-07). Su velo y su diálogo de «Cancelar» viven dentro de `.sal-cuerpo`, y subir la barra los taparía. Se resuelve en MES-PvP.

**Las medidas** (`diagDSK cfg`, bundle real, 2026-10-29; caja → zona geométrica, barrido en cruz):

| Celda | ⚙ | avatar | «+» | ojito | casa / flecha | chips | ± | «Unirme» | solapes |
|---|---|---|---|---|---|---|---|---|---|
| 360×640 | 31,31 → 44 | 38,5 de alto → 44 | 18,36 → 43,98 | 18,36 → 43,98 | 31,31 → 44 (R-9) | 40 → 44 | 40 → 44 | 35,19 → 44 | 0 |
| 412×915 | 35,84 → 44 | 44,06 | 21 → 44 | 21 → 44 | 35,84 → 44 | 40 → 44 | 40 → 44 | 36,25 → 44 | 0 |
| 915×412 | 35,84 → 44 | 44,06 | 21 → 44 | 21 → 44 | 35,84 → 44 | 44 | 40 → 44 | 44 | 0 |
| 1366×768 | 52,19 | 64,19 | 30,59 → 44 | 30,59 → 44 | 52,19 | 44,39 | 42 → 44 | 44 | 0 |
| 1920×1080 | 52,19 | 64,19 | 30,59 → 44 | 30,59 → 44 | 52,19 | 57 | 42 → 44 | 52,8 | 0 |

- El 43,98 del «+» y del ojito en 360 es redondeo del subpíxel: su barrido efectivo da 45.
- **Zona sobre algo no tocable:** la del ojito pisa 8,5 px de la cifra en 360 (6,56 en 412) y la del «+», 5,63. Tocar el borde de la cifra tapa o destapa, o abre la hoja de monedas. La lámina lo midió y se aceptó.

## 8. La hoja en todas las pantallas

- **Una sola hoja.** El ⚙ de cada pantalla monta `HojaConfiguracion` como hija directa de su `main` (`.lobby` o `.sal`). Su estilo, `src/styles/hojaConfiguracion.css`, vale bajo `:is(.lobby, .sal)`.
- **Anclaje.**
  - Arriba: el ⚙ más 1,5 u.
  - Derecha: el relleno de la pantalla. `--cfg-pad` es `--lob-pad` en el lobby y `--pad` en `.sal`, incluido el «traje apretado» de 2,4 u.
  - Medido: borde derecho de la hoja − ⚙ = 0 y el mismo hueco ⚙→hoja que el lobby, en el lobby, Retar y Rankings, en las cinco celdas de `cfg`. Por ejemplo, 3,00 / 3,02 px en 1366×768 y 2,08 en 915×412.
  - La lámina V6 medía −6,61 y −4,53 px de desvío; ahora es 0.
- **Cabecera fija, cuerpo desplazable.** El título y la cuenta quedan quietos y se desplaza `.cfg-hoja-cuerpo`.
  - **Excepción, el apaisado bajo** (`orientation: landscape` y alto ≤ 520): se desplaza la hoja entera, cabecera incluida, como antes de la 1a.
  - El techo es el de siempre: `100dvh − 20 u`.
  - Al desplegar «Acerca de» o la sugerencia, el panel entra en la vista (`scrollIntoView`, `nearest`).
- **Alto medido.**
  - 360×640: 383,52 plegada y 526,03 con «Acerca de» abierto; termina en 575,34, dentro del tope de 584, y no se desplaza.
  - 1366×768 con «Acerca de» abierto: se desplaza el cuerpo, como hoy.
- **Foco.**
  - Al abrir, el foco entra en el título; al cerrar, vuelve al ⚙.
  - `Escape` cierra.
  - Cerrada, la hoja lleva `inert` y `aria-hidden`.
  - Mientras está abierta, `body.lobby-hoja-abierta`; se quita también si la pantalla se desmonta con la hoja abierta.
- **El aviso es de la hoja** (`.cfg-toast`, z 8 sobre el velo 6 y la hoja 7). El de las pantallas de `.sal` vive dentro de `.sal-cuerpo`, un contexto de apilamiento que queda por debajo del velo.
- **La Sala de espera.** La hoja va después de `.sal-cuerpo`: su velo y ella quedan por encima del cuerpo, y con él del velo y del diálogo de «Cancelar» de la sala. Al cerrar, la sala queda como estaba.
- **Cerrar sesión desde cualquier pantalla** sale a la Portada, igual que desde el lobby.
  - La pantalla no se reinicia. Al volver a entrar se aterriza donde se salió, porque `App` no toca `screen` al cerrar sesión.
  - Si se sale desde la Sala de espera, la mesa en espera queda a cargo del barrido del servidor (MES-PvP).
- **El stub de PvP en el apaisado bajo.** Su fila de barra se estira (`grid-template-rows: auto auto auto` con contenido corto, `salas.css:1270`), el ⚙ baja y la hoja lo pisa 28,89 px en 915×412. Es del stub y se va con MES-PvP. No se tocó (regla 6 de la ficha).

## 9. Lo que viene

- **1b**: el perfil editable, con el avatar de la barra (hoy «Pronto») y el nombre.
- **1c**: «Eliminar cuenta», con su Edge Function.
- **1d**: el correo de la cuenta.
- **1e**: el ⋮ adelgaza; salen «Saldo» y, cuando el ⚙ los tenga, «Tapetes».
- **1f**: los tapetes en el ⚙.

## 10. Las contradicciones de la Fase 0 y qué gana

| | Contradicción | Gana |
|---|---|---|
| a | Dónde vive el ojito | Rankings §11 / Tienda §10: solo en la píldora del lobby. La entrada «Saldo» del ⋮ sale en la 1e |
| b | Los tapetes, en el ⋮ o en el ⚙ | Tienda §7: Tapetes sale del ⋮ en la 1e, cuando el ⚙ los tenga (1f) |
| c | Con qué se compran los cosméticos | La Tienda: con HC |
| d | Lo «comprado» guardado en el aparato | Tienda §7: no se reconoce |
| e | Qué es el «menú de configuraciones» | El ⚙ del lobby; el ⋮ es «el menú de la mesa» |
| f | Cómo se escribe la moneda | **HC** en texto corto y «Heptacoins» en frases |
| g | Qué es «Enviar sugerencia» | Contacto con soporte, no ayuda de jugada |
| h | 40 o 44 | Manda INV-07: 44 en todo. El disparador ⋮ ya cumple en táctil (45×44) y se deja |
