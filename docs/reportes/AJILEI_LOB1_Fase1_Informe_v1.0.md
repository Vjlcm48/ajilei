# AJILEI · LOB-1 · Fase 1 · Informe

**Fecha:** 2026-09-04
**SHA de partida:** `e75adf1327c150a89f10967b709b39e130522abd` · rama `main`
`git merge-base --is-ancestor e75adf1 HEAD` → **verdadero**.
**Fuentes que mandaron, por orden:** ficha **`AJILEI_LOB1_Fase1_v1.2.md`** · lámina **`AJILEI_LOB1_lamina_v1.4.html`** (autoridad visual sellada) · `AJILEI_LOB1_Fase0_informe.md` · `docs/AJILEI_Sistema_Diseno_v1.2.md`.

> **Nota de versión.** Esta fase se construyó primero contra la ficha v1.1 / lámina v1.3 y se **rehízo** contra la v1.2 / v1.4. Todo lo que sigue describe el árbol final. Los cinco puntos donde la v1.4 cambió el encargo están marcados con **[v1.4]**.

**Estado: construido y verde. Sin commits.**

**Protegidos:** los cinco de `docs/AJILEI_Protegidos_v1.0.md` §2, **INTACTOS** — verificado con `git diff --quiet e75adf1` sobre cada uno. Ninguno se abrió.

---

## 0. Resumen en cinco líneas

`Lobby` ocupa la casilla de `WelcomeScreen`, con la cara de la lámina v1.4 y sus 18 textos externalizados. El CTA va solo y centrado; un único token `--ico` gobierna los seis iconos de acción; la hoja ⚙ nace del engranaje con una sola conducta en los seis viewports. IDI-0 nace con diccionario, fallback visible y test. El arnés estrena el modo `lob` con **ocho** puntos (6/6) y sus tres archivos vivos quedan recableados; `puerta` (7/7), `mon` (12/12), `gate` (6/6) y `celebracion` (sin fallos) siguen verdes.

**El arnés encontró TRES defectos reales y los tres están corregidos** (§5.2) — el tercero, en la propia lámina v1.4. **Cuatro decisiones se apartan de la letra de la ficha, todas por medición, y están declaradas en §9.**

---

## 1. Archivos creados (11)

| Ruta | Bytes | Qué es |
|---|---:|---|
| [src/config/textos.es.js](src/config/textos.es.js) | 2 908 | Diccionario español · **18 claves** `lob.*`, valores verbatim de la lámina |
| [src/config/textos.js](src/config/textos.js) | 4 458 | Plomería: `t()`, `IDIOMA_POR_DEFECTO`, `IDIOMAS_DISPONIBLES`, `CLAVE_IDIOMA_STORAGE` |
| [src/config/textos.test.js](src/config/textos.test.js) | 4 703 | 10 pruebas del contrato del diccionario |
| [src/config/creditos.js](src/config/creditos.js) | 6 480 | CC BY de los emoji + las 19 entradas del Anexo A |
| [src/hooks/useIdioma.js](src/hooks/useIdioma.js) | 3 121 | Único sitio de IDI-0 que toca el DOM |
| [src/hooks/lobbyCore.js](src/hooks/lobbyCore.js) | 2 563 | `enmascararCorreo` — semántica pura (ver §9.3) |
| [src/hooks/lobbyCore.test.js](src/hooks/lobbyCore.test.js) | 2 092 | 6 pruebas del enmascarado |
| [src/components/ArcoEstrellas.jsx](src/components/ArcoEstrellas.jsx) | 3 228 | El arco de 8 estrellas, geometría verbatim de `WelcomeScreen.jsx:46-56` |
| [src/components/IconosLobby.jsx](src/components/IconosLobby.jsx) | 6 416 | Los **siete** iconos, bajo el token `--ico` (ver §9.4) |
| [src/screens/Lobby.jsx](src/screens/Lobby.jsx) | 19 954 | La pantalla |
| [src/styles/lobby.css](src/styles/lobby.css) | 36 757 | Su hoja, aditiva y sin un solo hex |

**NO se creó `scripts/gen-heptacoin-reposo.mjs` ni `src/assets/heptacoin-reposo.webp`.** El motivo está medido en §3.

---

## 2. Archivos editados (6)

### 2.1 `src/App.jsx` — el recableado (§4 de la ficha)

| Línea (nueva) | Antes | Después |
|---|---|---|
| 2-6 | `import WelcomeScreen from './components/WelcomeScreen'` | `import Lobby from './screens/Lobby'` + nota de código muerto |
| 13-16 | `import { useAuth, AUTH_BYPASS, CARGANDO, … }` | `import { useAuth, CARGANDO, … }` — `AUTH_BYPASS` se quedó sin consumidor |
| 48 | `useState('welcome') // 'welcome' \| …` | `useState('lobby') // 'lobby' \| …` |
| 52-53 | comentario «arranca en 'welcome'» | «arranca en 'lobby'» |
| 90, 94 | `if (screen !== 'welcome') …` ×2 | `if (screen !== 'lobby') …` ×2 |
| 119 | — | `correo: auth.correo ?? ''` **añadido** al paquete `cuenta` |
| 122-131 | `const cuentaLobby = AUTH_BYPASS ? null : cuenta` | **retirado** con su comentario |
| 166 | `onBack={() => setScreen('welcome')}` | `onBack={() => setScreen('lobby')}` |
| 171-178 | `return <WelcomeScreen onSelectMode={…} cuenta={cuentaLobby} />` | `return <Lobby cuenta={cuenta} onJugarIA={…} onCerrarSesion={auth.cerrarSesion} />` |

`auth.cerrarSesion` **es** el nombre real (verificado contra `useAuth.js:246`, que ya lo pasa a `Bautizo`).

**§1.7 · el metro.** `grep -rn "'welcome'" src/` → **tres coincidencias, todas prosa en comentarios de `App.jsx` que describen el propio renombrado**. Ningún valor vivo. En `scripts/` queda en `verifyIDN1.mjs` (l. 47, 48, 231), que es histórico y no se toca (§5.4 de la ficha).

### 2.2 `src/hooks/useSounds.js`

Añadido `export const SONIDOS_LOBBY = ['tableKnock']` junto a sus dos hermanas, con la nota de por qué es **uno y no nueve**: adelantar `SONIDOS_MESA` al lobby habría deshecho PUE-1.2 por la puerta de atrás. Nada más cambia en ese archivo.

### 2.3 `.gitignore`

`capturas-lob/` añadida con el criterio de `capturas-pue/`: regenerable, carpeta que no se borra.

### 2.4 · 2.5 · 2.6 Los tres arneses vivos — detallado en §5.

---

## 3. La moneda del saldo — **[v1.4]**

La v1.4 retira la moneda grande que iba junto al CTA y deja **una sola moneda en el lobby: la de la píldora de saldo**. Con ella se cae también la extracción del WebP de MON-2, que la ficha v1.2 §3.5 declara fuera de campaña.

**Asset elegido: `src/assets/heptacoin.svg` (3 503 B), servido por `ChipToken` dentro de `BalanceDisplay`.** Es el maestro oficial v1.1 de la Heptacoin, sellado, vectorial, el mismo que la app ya sirve en sus otras trece apariciones de moneda.

**No se añade una segunda moneda al lado de la suya:** `BalanceDisplay` YA monta su `ChipToken`, así que se envuelve la que hay en `.lob-moneda` —el contenedor `position: relative` que la ficha §3.3.1 pide— y ese envoltorio recibe el brillo. Un solo dibujo de moneda en el producto.

**¿Es apta a ese tamaño?** La ficha manda comprobarlo visualmente. **Sí:** se renderiza a `--ico`, que va de **21,6 px** (móvil, `--u` en su suelo) a **36 px** (escritorio) — por encima de los 24 px que la ficha ponía como listón, y de los 16 px fijos a los que `ChipToken size="icon"` la sirve hoy en el panel de utilidades. En las capturas de §7 se leen el canto acuñado y la H. No hizo falta el plan B.

**El brillo va en DOS capas separadas, y no es un detalle:**
- el **halo** (`drop-shadow`, radio `--ico × .5`, `--gold-brand-hi-rgb` al 85 %) sobre el `<img>`, para que ilumine el canto de la moneda **y no la cifra que tiene al lado**;
- el **destello corto** sobre un pseudo-elemento colocado exactamente encima de su caja (gradiente radial en el cuadrante superior izquierdo, 52 % → 58 % → 70 % del ciclo).

**Sin barrido**, como la v1.4 manda: a 36 px una banda que cruza se lee como parpadeo.

**Una trampa que hubo que sortear:** animar `filter` **reemplaza la propiedad entera**. `ChipToken.css:5` le da a la moneda su sombra de apoyo `drop-shadow(0 1px 2px rgba(0,0,0,.45))`, y sin repetirla en las tres paradas del keyframe la moneda la habría perdido durante los ocho segundos del ciclo —o sea, siempre— y habría quedado flotando. Está repetida.

### 3.1 Lo que se descartó, y por qué queda escrito
La ficha v1.1 pedía derivar un fotograma del WebP con Sharp. Antes de que la v1.2 lo retirara, esa búsqueda ya se había hecho y su resultado sigue siendo útil para quien retome MON-x:

| Hecho | Medida |
|---|---|
| `src/assets/heptacoin.webp` | 1 064 956 B · 616×346 · **87 cuadros** · RGBA |
| **No es una moneda girando** | Es la escena 4 de MON-2: **una PILA de Heptacoins con una tumbada al lado** |
| Su cuadro de reposo **ya está extraído** | `src/assets/heptacoin-poster.webp` · 18 272 B · RGBA con alfa real (α min 0, máx 255) |
| …y es **exactamente el f134** | `laminas/mon2/empaquetar.py:46` lo declara «el último cuadro (reposo, de cara) con alfa»; la l. 310 guarda `limpios[-1]` con `N_CUADROS = 135` → índice **134** |

**Es decir: el activo que la v1.1 mandaba fabricar ya existía en el árbol, y aun así no servía para una moneda de UI.** La v1.4 llegó a la misma conclusión por el camino del diseño. Queda anotado para que nadie vuelva a fabricarlo.

---

## 4. IDI-0 · la plomería

**Claves: 18**, todas bajo `lob.`. Valores verbatim de la lámina (los tres `*.aria` salen de los atributos `aria-label` de la lámina).

**`t(clave, idioma)`** devuelve `⟦clave⟧` ante una clave ausente —nunca cadena vacía— y avisa **una vez por clave** (guardia `AVISADAS`; sin él, una clave rota dentro de un render ahoga la consola, que es donde `puerta.6` de diagPUE exige silencio).

**`useIdioma`** lee `ajilei.idioma` con `try/catch` (molde de `readNivel`), cae a `'es'` si falta o no está en `IDIOMAS_DISPONIBLES`, y escribe `document.documentElement.lang`. **No expone `setIdioma`:** con un solo diccionario sería un botón que no puede cambiar nada. El selector de la Portada **no se tocó**.

**Test — 10 pruebas, todas verdes.** Además de lo que pedía §2.4:
- ninguna clave lleva espacios ni mayúsculas, y todas casan `^[a-z0-9]+(\.[a-z0-9]+)+$`;
- todas viven bajo el prefijo `lob.`;
- **no hay dos claves con el mismo texto** salvo la excepción declarada `lob.cfg.titulo` = `lob.ajustes.aria` («Configuración» es el rótulo de la hoja y el nombre accesible del engranaje que la abre) — es el detector de copia-pega al escribir el diccionario;
- `IDIOMAS_DISPONIBLES` es exactamente `['es']`. **Este test saldrá rojo el día que IDI-1 añada `textos.en.js`, y es a propósito:** obliga a actualizar la lista a mano en vez de dejar un idioma medio conectado que el selector ofrece y `t` no sabe pintar.

**Verificación en vivo:** `lob.4` del arnés mide `document.body.innerText` en los seis viewports buscando `⟦…⟧` → **cero**, y `<html lang>` = `es`.

---

## 5. Arnés

### 5.1 `scripts/diagDSK.mjs`

**El punto de estrangulamiento, recableado.** `recorrerRuta` (l. 355-359) pasa de `page.click('button:has-text("Jugar vs IA"))` a:

```js
  await page.waitForSelector('main.lobby [data-accion="jugar-ia"]')
  await page.click('[data-accion="jugar-ia"]')
```

`data-accion` es contrato de marcado y **no cambia con el idioma** — lo cual importa ya, porque IDI-0 nace en esta misma campaña y el rótulo del CTA sale de un diccionario. Un arnés colgado del texto se habría roto otra vez, por la misma causa que en NIV-UI. La ruta canónica de la cabecera (l. 328-329) queda `Lobby → CTA → NivelSelect → …`.

**Modo nuevo `lob`**, en la cabecera de uso, en el despacho y **dentro de `all`** (razón anotada en el código: si el lobby se rompe, los otros 27 modos salen rojos sin decir por qué; que este punto caiga primero convierte esa cascada en un diagnóstico). Siete puntos por celda, seis celdas (los viewports de `gate`):

| Punto | Qué mide |
|---|---|
| `lob.1` | `main.lobby` está · `main.welcome-screen` no · el lema viejo no |
| `lob.2` | CTA dentro del viewport, visible y **≥44 px** de alto |
| `lob.3` | píldora, ⚙ y los tres de la barra inferior: visibles y dentro |
| **`lob.3b`** **[v1.4]** | **simetría de iconos** (§9.5) y CTA centrado ≤2 px con ancho ≤ 64 u |
| `lob.4` | IDI-0 sin `⟦…⟧` en `innerText` · `<html lang>` puesto |
| `lob.5` | sin `h1.welcome-title` · isotipo con la **proporción 2:3 del maestro** · `src` a `ajilei-isotipo` · `alt="AJILEI"` · imagen decodificada |
| `lob.6` **[v1.4]** | la hoja ⚙ abre **anclada bajo el engranaje** (borde superior por debajo, borde derecho a plomo ±2 px) · «Acerca de» despliega y su texto contiene `CC BY` **y** `Pixabay` con ≥1 enlace · `Escape` cierra |
| `lob.7` | el CTA lleva a `.nivel-grid` |

Consola limpia entra en el veredicto. Deja capturas en `capturas-lob/`. Los ocho nombres viven en **una sola lista** (`LOB_PUNTOS`), de la que se derivan el veredicto de celda y el listado de fallos: añadir un punto no puede olvidarse en el otro sitio.

**Medidas de `lob.3b`, las seis celdas:**

| Viewport | Δ ancho | Δ alto | `--ico` | CTA | techo 64 u | desvío del centro |
|---|---:|---:|---:|---:|---:|---:|
| 640×360 | 0 | 0 | 21,6 | 230,39 | 230,29 | 0,01 *(columna)* |
| 360×640 | 0 | 0 | 21,6 | 230,39 | 230,29 | 0,01 |
| 844×390 | 0 | 0 | 23,4 | 249,59 | 249,49 | 0,01 *(columna)* |
| 1024×768 | 0 | 0 | 36 | 384 | 384 | 0 |
| 1366×768 | 0 | 0 | 36 | 384 | 384 | 0 |
| 1920×937 | 0 | 0 | 36 | 384 | 384 | 0 |

**Δ = 0 en los seis.** Los seis iconos de acción miden exactamente lo mismo, y no por disciplina sino porque los seis leen `--ico`.

### 5.2 **Lo que el arnés encontró · TRES defectos reales**

Ninguno fue ruido. Los dos primeros salieron en la corrida inicial (**0/6**); el tercero, al estrenar los puntos de la v1.4 (**3/6**).

**(a) `lob.3` — la barra inferior fuera del viewport en las tres celdas de escritorio.** Medido: `nav.bottom = 1088,83` dentro de un viewport de **768**. Causa: `.lobby` llevaba `min-height: 100dvh` y no `height`. Sin altura definida, las dos filas `1fr` del centro no reparten espacio libre sino que resuelven al contenido de la mayor — **una fila VACÍA estaba clonando los 387 px de la marca**.
*Corregido:* `height: 100vh; height: 100dvh` en `.lobby`, y el centro pasa de `grid-template-rows: 1fr auto 1fr` a una columna flexible centrada, que da el mismo reparto sin depender de una fila fantasma. La relación que la lámina quiere —la marca abrazando al CTA— la sigue sosteniendo el `padding-bottom` de la marca.

**(b) `lob.2` — el CTA por debajo del objetivo táctil en los tres móviles.** Medido: **36 px** a 360×640, **36** a 640×360, **39** a 844×390. La fórmula de la lámina es `11·u` a secas, y en un teléfono `--u` toca su suelo de 3,2-3,6 px: once unidades no llegan ni al piso de 40 px de la campaña DSK.
*Corregido:* `--lob-cta-h: max(44px, calc(var(--u) * 11))` — la misma medicina que `--u` se aplica a sí misma con su `clamp`. La fórmula manda en cuanto hay sitio; por debajo manda el dedo. En escritorio no cambia nada (11 × 6 = 66 px).

**(c) [v1.4] `lob.6` — la hoja ⚙ no salía del engranaje: salía de la esquina de la ventana.** Éste es un defecto **de la propia lámina v1.4**, y lo destapa una aserción que la propia ficha v1.2 pidió añadir.

La lámina escribe `position: fixed` con `right: calc(env(...) + var(--pad))`. Eso ancla la hoja al **viewport**, mientras que el ⚙ vive dentro del lienzo, que lleva `max-width` y `margin: 0 auto`. En cuanto la ventana es más ancha que el lienzo, los dos bordes dejan de coincidir. Medido:

| Viewport | desvío del borde derecho |
|---|---:|
| 640×360 | 0 px |
| 360×640 | 0 px |
| 844×390 | **6,66 px** |
| 1024×768 | 0 px |
| 1366×768 | **44 px** |
| 1920×937 | **321 px** |

A 1920, la hoja nacía a **un palmo** del engranaje que la abre — que es justo lo contrario de lo que la v1.4 vino a conseguir («nace del engranaje»). En un teléfono no se nota, y por eso la lámina no lo vio: ahí el lienzo ocupa la ventana entera.

*Corregido con una palabra:* `position: absolute` en vez de `fixed`. El bloque contenedor pasa a ser `.lobby` —que ya es `position: relative`— y **las dos fórmulas de la lámina se vuelven exactas sin cambiar un número**: el borde derecho de un absoluto con `right: X` cae en `padding-box.right − X`, y el ⚙ cae en ese mismo punto por ser el último elemento de una barra que ocupa la caja de contenido. **Δ medido tras la corrección: 0 px en los seis viewports.** El velo se queda `fixed`: tiene que oscurecer la ventana entera, no el lienzo.

**Tras las tres correcciones: 6/6.**

### 5.3 `scripts/diagCEL0.mjs`

Sus **dos** copias del clic (l. 140 y l. 1741) pasan al mismo selector. Corrido el modo `celebracion` entero: **`FALLOS: ninguno`**, control negativo verde.

### 5.4 `scripts/diagPUE.mjs`

- **`puerta.4` nueva:** `el lobby NO captura al visitante anónimo` → `!q('main.lobby')`. `puerta.3` se conserva sin cambio y sigue midiendo lo que dice: el lobby **no** reutiliza `main.welcome-screen` ni el lema (verificado). Los dos puntos siguientes se renumeran a `puerta.5` y `puerta.6`. **El bloque pasa de 6 a 7 puntos.**
- **Guarda de nulo en el punto 1.2** (l. 249+): antes hacía `getComputedStyle()` sobre el resultado crudo del `querySelector` y habría muerto con `TypeError` en vez de dar un veredicto. Ahora, si `h1.welcome-title` no existe, sale **rojo con mensaje**. Es la única edición fuera de lo estrictamente LOB-1 y se justifica porque esta campaña toca ese contrato.

### 5.5 Modos corridos, y los que no

| Modo | Resultado |
|---|---|
| `diagDSK lob` | **6/6 celdas** |
| `diagDSK gate` | **matrixOk = true**, 6/6 de la matriz + 4 capturas (las cuatro pasan por `recorrerRuta` → camino de **mesa 5**) |
| `diagDSK h1 2 1920x937` | **`passed: true`** — ciclo de tres manos completo en **mesa 2** (el otro camino de render) |
| `diagCEL0 celebracion` | **FALLOS: ninguno** · control negativo verde |
| `diagPUE puerta` (4173) | **7/7 VERDE**, incluida `puerta.4` |
| `diagPUE mon` (4173) | **12/12 VERDE** |

**No corridos, y por qué:** los otros 24 modos de `diagDSK`. `all` son ~237 min y la ficha §5.1 no los pide; los dos caminos de render que sí pide están cubiertos por `gate` (mesa 5) y `h1 2` (mesa 2). **Nada de lo que esta campaña tocó vive dentro de esos 24 modos**: ninguno mide el lobby y todos entran a la mesa por el mismo `recorrerRuta` que las dos corridas ya ejercitaron.

**Aviso del instrumento, sin cambio de baselines:** el arnés canta `baselines tomadas con 151.0.4129.93 · vivo 152.0.4191.62`. El Edge de la máquina se autoactualizó desde el re-sellado de VIS. **No se re-fotografió ninguna baseline** — esta tanda no las mueve y hacerlo sería atribuir a LOB-1 una deriva del navegador. Queda anotado para quien corra `all`.

### 5.6 Arnés histórico

`grep -rln "Jugar vs IA" scripts/` → **22 archivos**. Uno es `diagDSK.mjs` y sólo en **prosa** (l. 338, el comentario que explica el cambio). Los **21 restantes conservan el clic literal y quedan en ROJO ESPERADO a partir de LOB-1**:

`_cel1bFila.mjs` *(residuo sin rastrear)* · `_sh1probe.mjs` · `measurePanel.mjs` · `shotFloat.mjs` · `shotStatus.mjs` · `verifyC43` · `verifyC431` · `verifyC44` · `verifyC441` · `verifyC441b` · `verifyC45` · `verifyC45a` · `verifyC45b` · `verifyC45c` · `verifyEMB1` · `verifyGameOver` · `verifyIDN1` · `verifyMesa5` · `verifyREN1` · `verifyShrink` · `verifyViewport`

**Reparación: una línea cada uno** — el mismo cambio de selector. No se tocan porque §5.4 lo prohíbe y porque ninguno se corre hoy.

---

## 6. Verificación

| Paso (§6 de la ficha) | Resultado |
|---|---|
| 1 · `npm test` | **19 archivos, 483 pruebas, verde.** (Antes de la tanda: 18 / 477. Suman `textos.test.js` +10 y `lobbyCore.test.js` +6 … 483 = 477+16 ✔) |
| 2 · `npm run build` | **Limpio, 599 ms.** CSS **170,18 kB** (gzip 29,30) · JS **572,04 kB** (gzip 166,47). El aviso de chunk >500 kB es **preexistente** y no lo mueve esta tanda. No hay activo nuevo que pesar: la única moneda es `heptacoin.svg`, que ya viajaba (§3) |
| 3 · `vite preview` con **sesión real** | **NO REALIZADO — ver §8** |
| 4 · Arnés | §5.5 |
| 5 · `grep "'welcome'"` | §2.1 |
| 6 · Capturas | §7 |
| — · `npm run lint` | **20 errores + 1 aviso**, que es **exactamente la línea base**. **Cero** en archivos de LOB-1 (verificado por filtro). Hubo una regresión de 1 y se corrigió (§9.3) |
| — · Protegidos | Los cinco **INTACTOS** contra `e75adf1` |
| — · `welcome.css` en el bundle (§3.4) | **Sí.** `grep` sobre `dist/assets/*.css` devuelve `.welcome-title{color:var(--gold-brand);letter-spacing:12px;margin:0 0 14px;font-size:72px}` y `body{background:var(--green-abyss);…}` |
| — · `lobby.css` en el bundle | **Sí** (`lob-cta-ia`, `lobby-activa`) |

**Viaje de ida y vuelta, ejercitado en 5173:**

```
  OK  arranque            -> main.lobby
  OK  CTA                 -> NivelSelect
  OK  Volver              -> main.lobby          (onBack recableado)
  OK  nivel               -> ModeSelect
  OK  apuesta             -> .game-table          (mesa 5 y mesa 2)
  OK  ModeSelect --Volver-> NivelSelect
  OK  NivelSelect --Volver-> main.lobby
```

**Corrección a §6.3 de la ficha:** dice «mesa → `onLeave` → **Lobby**». No es así, y no lo era antes de esta tanda: `App.jsx` pasa `onLeave={() => setScreen('mode-select')}` y **eso no se tocó**. De la mesa se sale a `ModeSelect`, y de ahí al lobby con dos «Volver». El comportamiento es el de siempre.

---

## 7. Viewports · capturas

En `capturas-lob/` (ignorada por git). **Sin desborde en ninguno.**

| Viewport | CTA | `--ico` = moneda | `nav.bottom` / alto | Desborde |
|---|---:|---:|---|---:|
| escritorio 1920×1080 | 384 × 66 | 36 px | 1059 / 1080 | 0 px |
| S25 vertical 360×780 | 230,4 × 44 | 21,6 px | 767,4 / 780 | 0 px |
| S25 horizontal 780×360 | 230,4 × 44 | 21,6 px | 347,4 / 360 | 0 px |
| móvil 390×844 | 249,6 × 44 | 23,4 px | 830,4 / 844 | 0 px |
| móvil 360×640 | 230,4 × 44 | 21,6 px | 627,4 / 640 | 0 px |

La columna `--ico` es la del icono del ⚙ **y** la de la moneda del saldo: son la misma cifra en los cinco, que es lo que §1.9 pide y `lob.3b` mide.

Archivos:
- `lamina_*.png` — los cinco viewports de la lámina;
- `hoja_*.png` — los mismos cinco con la hoja ⚙ abierta y «Acerca de» desplegado, para validar el anclaje bajo el engranaje y el bloque de licencias;
- `lob_*.png` — los seis viewports del arnés.

---

## 8. Lo que NO se pudo verificar

**§6.3 · `vite preview` (4173) con sesión REAL.** El paso pide: OTP → nombre → Lobby → … → Cerrar sesión → Portada. **No se hizo, y no por olvido:** requiere recibir un código de seis dígitos en el correo de Victor, y este agente no tiene ni debe tener acceso a esa bandeja.

**Lo que sí se verificó en 4173 (sesión anónima, bypass apagado, build de producción):**
- `puerta` 7/7 — el visitante anónimo ve la Portada, y **`puerta.4` prueba que NO ve el lobby**;
- `mon` 12/12;
- que `lobby.css` y `welcome.css` viajan en el bundle de producción.

**Lo que queda pendiente de la mano de Victor, y es lo único:**
1. OTP → Bautizo → **Lobby** (que `COMPLETO` con sesión real aterrice en el lobby; con bypass ya se comprobó 6/6);
2. **«Cerrar sesión» desde la hoja ⚙ → Portada** (`onCerrarSesion` está cableado a `auth.cerrarSesion`, el mismo que ya usa `Bautizo`, pero con bypass el hook corta antes de tocar la red por diseño y no se puede ejercitar);
3. **la línea del correo enmascarado con un correo de verdad** — con bypass `auth.correo` es `null` y la línea se apaga reservando su caja (O1), que es justo lo que se ve en `lob_hoja_desktop.png`. El enmascarado sí está probado en `lobbyCore.test.js` con seis casos.

---

## 9. Decisiones que se apartan de la letra de la ficha

Cuatro, con su medida. *(La v1.2 resolvió por su cuenta la quinta que traía la v1.1 — la moneda grande — retirándola.)*

### 9.1 · El isotipo: `<img>`, y **no es cuadrado**
La ficha §3.2 previó la bifurcación («si el SVG lleva colores propios, se monta como `<img>` y se anota»). **Lleva:** su cabecera declara «rampa tonal y acentos vino/marino solo dentro de la Heptacoin», y el archivo trae dos degradados (`ajFld`, `ajH`), filete vino `#7c1d30` y sombra marino `#1c305f`. Enmascararlo con `background: var(--gold-brand)` habría aplanado la Heptacoin del vano a un solo oro — recolorear un activo sellado, que es lo que Identidad A §5.2 prohíbe.

**Y su caja no es cuadrada:** `viewBox="15 30 60 90"` → proporción **2:3**, la misma que `.wm-iso` respeta con `height: calc(1.5 * var(--wm-cap))`. **La ficha §5.1 punto 5 sigue pidiendo al arnés exigir «ancho = alto ±1 px», también en la v1.2.** Eso exigiría que la letra doble estuviera deformada. `lob.5` mide contra la proporción del maestro (0,6667 ±0,01), que es la autoridad. **Este punto sigue abierto en la ficha y conviene corregirlo allí.**

### 9.2 · La hoja ⚙ es `absolute`, no `fixed`
Detallado en §5.2(c). La lámina describía bien la intención y su `fixed` no la cumplía fuera de un móvil: 321 px de desvío a 1920. Se cambia la palabra, no las fórmulas.

### 9.3 · `enmascararCorreo` vive en `hooks/lobbyCore.js`, no en `Lobby.jsx`
Exportarla desde el `.jsx` metió **una** regresión de lint (`react-refresh/only-export-components`, 21 errores contra la línea base de 20). Es la misma regla que `useAuth.js` cita para no ser `.jsx` y la que ya muerde en `SoundContext.jsx`. Dejarla sin exportar habría callado el aviso a costa de una función que toca datos personales y no se puede probar. **Archivo nuevo no previsto en el plan de commits** (`lobbyCore.js` + su test), molde exacto de `nivelCore.js` / `tapetesCore.js`. Lint de vuelta en 20.

### 9.4 · Los iconos: el **contrato** de `util-ico`, pero **no su clase**
La ficha §3.1 dice «con el contrato `util-ico` de la casa». Se hereda entero lo que hace que un icono de AJILEI se vea como tal —caja 24, `fill="none"`, trazo `currentColor` a 1.75, remates redondos, `aria-hidden`, `focusable="false"`— y **como atributos**, igual que `CardQueryIcon`, `CuentaIcon` y `GodeteIcon`.

**Lo que no se hereda es el nombre de clase, y está medido:** `.util-ico` tiene reglas vivas en `gameTable.css` (**protegido**) l. 5896-5902 y `menuMovil.css` l. 218-224, que imponen `display:flex`, `align-items`, `justify-content`, `line-height:1` y `font-size: var(--dsk-u1-ico-w)` —que en el lobby no resuelve a nada—. Son selectores de clase pelada dentro de sus media queries: alcanzarían a cualquier `.util-ico` del documento. Usarla habría importado geometría de la mesa a una pantalla que no es la mesa, y desactivarla habría exigido pisar con especificidad o **abrir un protegido**. La clase propia (`lob-ico lob-ico-<nombre>`) cuesta una palabra.

**Y son siete, no cinco.** La ficha escribe «cinco iconos» y a continuación enumera siete; la lámina monta siete `<symbol>` y el lobby usa los siete. Manda la enumeración.

### 9.5 · El CTA es un `<button>` pelado, no un `SoundButton`
`SoundButton` dispara `buttonClick` **antes** de llamar al `onClick`. Con el golpe de mesa dentro del manejador, las dos muestras habrían sonado encimadas en el mismo fotograma. El golpe **releva** al clic, no se suma. Los otros diez controles del lobby sí son `SoundButton` y suenan como toda la casa. El `⚙` también es pelado, por otra razón: necesita `ref` para devolver el foco al cerrar la hoja, y `SoundButton` no expone el nodo.

### 9.6 · `lob.3b` mide el centrado contra **la columna** en el traje apaisado
La ficha §5.1 punto 3b pide «CTA centrado (|centro CTA − centro viewport| ≤ 2 px)». **En los dos viewports apaisados eso es incompatible con la propia lámina**, que en `max-height: 520px` parte el centro en dos columnas —marca a la izquierda, acción a la derecha— y por tanto sitúa el CTA en la mitad derecha a propósito.

`lob.3b` detecta el traje con `matchMedia` y mide contra el viewport donde el traje no está y contra `.lob-accion` donde sí. Medido: **0,01 px** en los dos casos. La aserción sigue diciendo lo que quiere decir —el CTA está centrado en su sitio— sin exigir que la lámina se contradiga. **Se anota porque los dos textos de la ficha no encajan y la decisión es de Victor.**

---

## 10. Hallazgos laterales

1. **`index.html` NO lleva `viewport-fit=cover`** (l. 9: `width=device-width, initial-scale=1.0`). Verificado, **no añadido** — es FS-1, como la ficha §3.10 manda. Las reservas `env(safe-area-inset-*)` de `lobby.css` están escritas y hoy valen 0, listas para el día que aquello entre.
2. **La familia del lobby es `var(--sans)`, que vive en `src/index.css`** —el andamiaje de Vite—, no en `theme.css`. Es la misma pila que resuelve hoy el wordmark en sus cuatro apariciones (hallazgo de Fase 0 §5.4) y la que la lámina selló. Se usa con fallback literal para que el lobby sobreviva al día en que alguien limpie esa hoja. **`--font-base` (Arial) no se usa**: la marca ya no se lee en Arial en ninguna parte.
3. **El velo de la hoja queda un punto más claro que la lámina.** Ésta pide `rgba(9,23,14,.6)` y `theme.css` no publica `--green-abyss-rgb`: sólo lo expone dentro de `--surface-area` (.45) y `--surface-area-light` (.30). Se usa `--surface-area` antes que cablear tres cifras. Ver §11.
4. **El saldo se pinta con `montoTexto()`** —el formateador de la casa, «5.000»— y no con la cifra cruda que `BalanceDisplay` imprime. La lámina lo muestra así («1.500»). `BalanceDisplay` ya monta su propio `ChipToken`, así que **no se añadió una segunda moneda** a la píldora.

4b. **[v1.4] El contrato de iconos hizo crecer tres cajas y encoger dos.** Antes cada icono traía su cifra: avatar 8,5 u, ⚙ 8,5 u, barra inferior 6 u, moneda 16 px fijos, `+` 5,2 u, candado 3,6 u. Ahora los cuatro primeros leen `--ico` (6 u) o `--ico-caja` (8,7 u) y los dos últimos pasan a `em`. **El cambio se ve:** la moneda del saldo va de 16 px a 21,6-36 px y el avatar crece un 2 %. Es lo que §1.9 pide y lo que `lob.3b` congela.

4c. **[v1.4] Desapareció el `@media (min-width: 900px)` de la hoja.** Tenía dos colocaciones —inferior en móvil, flotante en escritorio— y la v1.4 las funde en una. No se sustituye por otro media query: el anclaje es fórmula sobre `--ico-caja` y `--lob-pad`, así que vale igual a 360 que a 1920. La hoja gana además `max-height: calc(100dvh - 20u)` con desplazamiento interno, porque en un teléfono acostado de 360 px sus siete filas no caben — y ahí recortar como hace el lienzo dejaría «Eliminar cuenta» fuera de alcance.
5. **El saldo sigue siendo una constante.** `AJILEI_CONFIG.economy.saldoInicial = 5000`, con el comentario `PROVISIONAL: sin billetera; ECO-x lo conecta a Supabase`. No hay ledger en el producto; una cifra que no se mueve es lo único honesto hasta que exista.
6. **`WelcomeScreen.jsx` y `welcome.css` quedan como código muerto declarado**, junto a `TableSelect` y `Entrada`. Con un matiz que importa: **`welcome.css` NO es prescindible**. Sostiene las reglas base de `h1.welcome-title` para la Portada, la mesa y la celebración —y `Bautizo.jsx:74` y `Entrada.jsx:37` también la usan— más el `body { background }` que `tapetes.css:31` y `useTapetes.js:115` dan por hecho. Por eso `Lobby.jsx` la importa antes que la suya, con la nota de por qué. Verificado en el bundle.
7. **El arco de 8 estrellas sigue duplicado en `ModeSelect.jsx:53-61`.** `ArcoEstrellas` extrae la copia de `WelcomeScreen`; unificar la de `ModeSelect` habría exigido abrir la pantalla intocable del encargo. Deuda conocida.
8. **`h1` del lobby.** El `<h1>` contiene el isotipo y ningún texto; su nombre accesible lo pone `alt="AJILEI"`. Se le neutralizan las reglas genéricas del andamiaje (`index.css:76-84` le pondría 56 px, tracking negativo y 32 px de margen). **En el lobby no existe `h1.welcome-title`** — ese selector es contrato de otras cuatro pantallas y duplicarlo habría metido al lobby dentro del mecanismo del wordmark sin necesidad.
9. **La hoja ⚙ se retira del árbol de accesibilidad cuando está cerrada** (`inert` + `aria-hidden`). Existe siempre en el DOM porque se mueve con `transform`; sin esto, un jugador de teclado tabularía por siete controles invisibles.
10. **El reloj del toast lleva handle y se cancela en el desmontaje** (`useRef` + `clearTimeout`), doctrina GT-HIG. Ninguno nuevo se suma al censo de FRZ-1 §1.3.
11. **Deriva del navegador del arnés**, sin acción: §5.5.

---

## 11. Requiere autorización — **CERRADO en A1**

**Era uno solo, y era un token. Victor lo autorizó en el ajuste A1 §2b; está montado y medido en el anexo A1.**

**`--green-abyss-rgb` en `theme.css`.** La lámina pide el velo de la hoja en `rgba(9,23,14,.6)` — el verde abisal al 60 %. `theme.css` publica ese verde como hex (`--green-abyss: #09170e`) y sólo lo expone en rgb *dentro* de dos tokens ya compuestos: `--surface-area` (.45) y `--surface-area-light` (.30). Con lo que hay, ese alfa no se puede escribir sin cablear las tres cifras, que §1.4 prohíbe.

- **Lo que se montó el 4-sep, a la espera:** `background: var(--surface-area)`. El velo quedaba un punto más claro que la lámina. Funcionaba y no rompía nada.
- **Lo que lo cierra, y ya está puesto (A1, 5-sep):** una línea aditiva en `theme.css` — `--green-abyss-rgb: 9, 23, 14;` — hermana de las cinco `*-rgb` que esa hoja ya publica (`--gold-brand-rgb`, `--gold-dim-rgb`, `--gold-brand-hi-rgb`, `--gold-brand-deep-rgb`, `--text-primary-rgb`, `--loss-red-rgb`, `--raise-orange-rgb`). No es archivo protegido, pero **es la fuente única del sistema de diseño y no se toca sin decisión de Victor**.

**Ningún archivo protegido fue rozado.** El motor, la IA, la geometría de asientos, `opponentPanel.css` y `gameTable.css` quedan fuera del alcance de esta campaña por construcción: LOB-1 vive delante de la selección de mesa.

---

## 12. Plan de commits — propuesta

Atómicos por ruta explícita; nunca `git add -A`. **Victor autoriza cada uno.** Difiere del §8 de la ficha en lo que §9.1 y §9.3 explican.

**LOB-1a · IDI-0 y créditos**
```
src/config/textos.es.js  src/config/textos.js  src/config/textos.test.js  src/config/creditos.js
src/hooks/useIdioma.js
```

**LOB-1b · Activos**
```
src/components/ArcoEstrellas.jsx  src/components/IconosLobby.jsx
```
*Coincide con el §8 de la ficha v1.2: sin script ni activo de moneda, porque la v1.4 los retiró (§3).*

**LOB-1c · Pantalla**
```
src/screens/Lobby.jsx  src/styles/lobby.css
src/hooks/lobbyCore.js  src/hooks/lobbyCore.test.js
src/hooks/useSounds.js  src/App.jsx  .gitignore
src/styles/theme.css
```
*`theme.css` entra aquí por el ajuste A1 §2b: una sola línea aditiva (`--green-abyss-rgb`), autorizada por Victor, sin la cual el velo de la hoja no se puede escribir sin hex. Es fuente única del sistema de diseño; va en el mismo commit que la pantalla que la estrena y en ningún otro.*

**LOB-1d · Arnés**
```
scripts/diagDSK.mjs  scripts/diagCEL0.mjs  scripts/diagPUE.mjs
```

**LOB-1e · Informes**
```
docs/reportes/AJILEI_LOB1_Fase1_Informe_v1.0.md
AJILEI_LOB1_Fase0_informe.md   (si Victor decide moverlo a docs/reportes/ en el mismo acto)
```

Cada commit: build verde sobre el árbol commiteado. Push sólo tras los cinco, con ceremonia de tres SHA.

---

## 13. `git status --short` final

```
 M .gitignore
 M scripts/diagCEL0.mjs
 M scripts/diagDSK.mjs
 M scripts/diagPUE.mjs
 M src/App.jsx
 M src/hooks/useSounds.js
?? AJILEI_LOB1_Fase0_informe.md
?? laminas/mon1/_entorno.txt
?? laminas/mon1/lamina.html
?? laminas/mon1/tiempos.json
?? scripts/_cel1bFila.mjs
?? src/components/ArcoEstrellas.jsx
?? src/components/IconosLobby.jsx
?? src/config/creditos.js
?? src/config/textos.es.js
?? src/config/textos.js
?? src/config/textos.test.js
?? src/hooks/lobbyCore.js
?? src/hooks/lobbyCore.test.js
?? src/hooks/useIdioma.js
?? src/screens/Lobby.jsx
?? src/styles/lobby.css
```

Los cuatro residuos de DOC-1 siguen ahí, sin tocar. `AJILEI_LOB1_Fase0_informe.md` es de la fase anterior. Todo lo demás es LOB-1.

```
 6 archivos modificados · 451 inserciones · 25 supresiones
```

**Sin commits. Sin `add`. Sin `push`. Sin `stash`.**

STOP

---

# Anexo A1 · el signo `+` y el token del velo

**Documento rector:** `AJILEI_LOB1_Ajuste_A1_v1.1.md`. **5-sep-2026.** Sobre el árbol de Fase 1, **sin commits**.

## A1.1 La causa, medida antes de tocar

Sonda de Playwright sobre `npm run dev` (5173, bypass), en **1920×1080** y **360×640**, leyendo `getBoundingClientRect()` y `getComputedStyle()` del `<button>` del `+` y de su `<svg>`:

| | 1920×1080 | 360×640 |
|---|---|---|
| disco (`.lob-mas`) | **20 × 20 px** | **20 × 20 px** |
| `font-size` del disco | 13,333 px | 13,333 px |
| `font-size` de la píldora | 20,4 px | 12,24 px |
| `<svg>` del `+` | **4,95 × 11,16 px** | **4,95 × 11,16 px** |
| razón svg/botón (la lámina pide 0,62) | **0,248** | **0,248** |
| `stroke` computado | `rgb(26, 26, 14)` | `rgb(26, 26, 14)` |
| `background` del disco | `rgb(232, 184, 75)` | `rgb(232, 184, 75)` |

Un palito vertical de **cinco píxeles de ancho** sobre un disco dorado: exactamente la «marca mínima en el centro» que Victor describió.

**Ninguna de las tres causas que la ficha ponía por delante era la buena.** (a) El trazo *no* heredaba dorado: computaba `#1a1a0e` sobre `#e8b84b`, con el contraste que la lámina pide. (c) `.lob-ico` *no* alcanzaba al glifo: `.lobby .lob-mas .lob-ico` (0,3,0) gana a `.lobby .lob-ico` (0,2,0) por especificidad, y siempre lo hizo. La causa era una variante de (b), y eran **dos cosas de fábrica del `<button>` que nadie había apagado**:

1. **`font: 400 13.333px Arial`.** Un `<button>` **no hereda** la tipografía de su padre — es la hoja del navegador, no una regla nuestra. El `1.5em` de la lámina se medía contra 13,33 px en vez de contra los 20,4 px de la píldora, así que el disco valía **20 px fijos en escritorio y en móvil**: la fórmula estaba escrita, pero colgada del `em` equivocado. Que el disco midiera **lo mismo en los dos viewports** era la firma del defecto, y estaba a la vista en la tabla de arriba.
2. **`padding: 1px 6px`.** El `62 %` es porcentaje de la **caja de contenido**, y esa caja medía **8 × 18 px**, no 20 × 20. De ahí el 4,95 (62 % de 8) y el 11,16 (62 % de 18) — y de ahí que el glifo saliera **alto y flaco** en lugar de cuadrado.

Las dos se compensaban hacia el mismo sitio, y por eso el disco sobrevivía mientras el signo desaparecía: el disco depende sólo de (1); el glifo, de (1) **y** de (2).

## A1.2 La regla añadida

`src/styles/lobby.css:252-277` — un bloque nuevo con alcance `.lobby .lob-pildora .lob-mas` (la píldora es el único sitio del `+`), sin `!important`, resuelto por especificidad y orden:

```css
.lobby .lob-pildora .lob-mas {
  font: inherit;
  padding: 0;
  line-height: 1;
}
```

**No se cambia una sola cifra de la lámina.** El `1.5em` del disco y el `62 %` del glifo siguen escritos como estaban; lo único que cambia es **contra qué miden**. `font: inherit` —y no `font-size`— porque el atajo apaga de una vez la familia Arial que el navegador también inyecta, y el disco no lleva texto que pudiera notar la diferencia.

## A1.3 Después

| | 1920×1080 | 844×390 | 360×640 |
|---|---|---|---|
| disco | 30,59 × 30,59 | 19,88 × 19,88 | 18,36 × 18,36 |
| `<svg>` del `+` | 18,95 × 18,95 | 12,31 × 12,31 | 11,38 × 11,38 |
| razón, los dos ejes | **0,620** | **0,620** | **0,620** |
| desborde horizontal | 0 | 0 | 0 |

El disco **vuelve a escalar** con la píldora, y el glifo cae en el 62 % exacto de la lámina en los dos ejes y en los seis viewports del arnés. Capturas: `capturas-lob/mas_desktop.png` y `capturas-lob/mas_360.png`.

## A1.4 El token del velo (§2b)

`src/styles/theme.css:47` — una línea aditiva pegada al hex del que sale, con el comentario que dice de dónde viene:

```css
--green-abyss-rgb: 9, 23, 14;
```

`src/styles/lobby.css:532` — el velo pasa de `var(--surface-area)` (.45) a **`rgba(var(--green-abyss-rgb), 0.6)`**, que es lo que la lámina pide. Medido en vivo: `rgba(9, 23, 14, 0.6)` en los dos viewports. **Ni un hex fuera de `theme.css`**, y ninguna otra regla de la hoja de tokens tocada. Captura: `capturas-lob/hoja_velo_desktop.png`.

Con esto, **§11 de este informe queda cerrado**: LOB-1 no tiene ningún punto pendiente de autorización. `src/styles/theme.css` se suma al commit **LOB-1c** (§12).

## A1.5 Arnés

Punto nuevo **`lob.3c`** en `scripts/diagDSK.mjs:912-948`, sumado a `LOB_PUNTOS` (l. 781). Mide tres cosas del `+`: que el glifo ocupe **≥ 50 %** de su disco en los dos ejes, que su `stroke` computado **≠** el `backgroundColor` del disco —el otro modo de perder un icono es pintarlo del color de su fondo— y que botón y svg estén visibles con caja no nula.

Se añade porque `lob.3b` deja fuera a propósito los **glifos de línea**, y esa exclusión —correcta— era justo el agujero por el que el `+` se perdió sin que nada se pusiera rojo.

```
diagDSK lob   → 6/6 celdas, NUEVE puntos, consola limpia   (0,62/0,62 en las seis)
diagDSK gate  → matrixOk: true, 6/6
npm test      → 19 archivos · 483 pruebas · verde
npm run lint  → 20 errores + 1 aviso — línea base exacta, cero de LOB-1
npm run build → limpio · CSS 170,29 kB (gzip 29,32) · JS 572,02 kB (gzip 166,46)
```

## A1.6 Lo que queda dicho, no hecho

**El `+` mide 18,36 px de lado en móvil**, y antes medía 20. La corrección lo hace *proporcional*, no más grande: la lámina lo fija en `1.5em` de una píldora que en 360 px de ancho mide 12,24 px de texto, y no hay forma de meter un objetivo táctil de 40 px dentro de una píldora de 31,67 px de alto sin romper el dibujo sellado. No es una regresión del ajuste —el objetivo ya era pequeño—, pero ahora está **medido**, y la doctrina táctil de la casa son 40 px. Se puede resolver sin mover un píxel visible ampliando el área de toque con un pseudo-elemento; **no se hace aquí** porque cae fuera del alcance de A1 y porque un área invisible que se solapa con la moneda del saldo puede robarle el clic. Queda para decisión de Victor.

## A1.7 `git status --short`

```
 M .gitignore
 M scripts/diagCEL0.mjs
 M scripts/diagDSK.mjs
 M scripts/diagPUE.mjs
 M src/App.jsx
 M src/hooks/useSounds.js
 M src/styles/theme.css          ← nuevo en A1
?? AJILEI_LOB1_Fase0_informe.md
?? _probeA1.mjs                  ← andamio de la sonda, a borrar
?? _shotA1.mjs                   ← andamio de las capturas, a borrar
?? docs/reportes/AJILEI_LOB1_Fase1_Informe_v1.0.md
?? laminas/mon1/_entorno.txt
?? laminas/mon1/lamina.html
?? laminas/mon1/tiempos.json
?? scripts/_cel1bFila.mjs
?? src/components/ArcoEstrellas.jsx
?? src/components/IconosLobby.jsx
?? src/config/creditos.js
?? src/config/textos.es.js
?? src/config/textos.js
?? src/config/textos.test.js
?? src/hooks/lobbyCore.js
?? src/hooks/lobbyCore.test.js
?? src/hooks/useIdioma.js
?? src/screens/Lobby.jsx
?? src/styles/lobby.css
```

Los dos `_*A1.mjs` son andamios de esta sesión —la sonda de medida y la de capturas—; el intento de borrarlos fue denegado por el permiso del entorno, así que quedan a la vista y **no entran en ningún commit**. Los cuatro residuos de DOC-1 siguen intactos.

**Sin commits. Sin `add`. Sin `push`. Sin `stash`.**

STOP
