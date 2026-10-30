# AJILEI · CFG-1 · Fase 1b-L · Lámina del perfil editable · Informe · v1.0

- **Ficha:** `AJILEI_CFG-1_Fase1bL_Lamina_v1.0.md` (rector). **Base:** `main` en `e98aef8`.
- **Fecha:** 2026-10-30. **Ejecutor:** Claude Code. **Tiempo:** ~2 h 30 min (más que lo orientativo: la lámina de la 1a se había borrado y hubo que rehacer el medidor).
- **Escrito para:** el rector y Victor.
- **Escrituras:** solo `laminas/cfg1b/` (sin seguimiento de git) y este informe. **Nada de `src/` ni de `supabase/` tocado.** Nada instalado en `package.json`. Sin commits.

---

## Resumen

| | |
|---|---|
| **Cómo está hecha** | Sobre las **piezas reales**. La lámina monta `Lobby`, `Rankings`, `MiniPerfil`, `PantallaChips`, `HojaConfiguracion` y el **`Bautizo` en modo edición** de `src/`, con datos de mentira y el ranking del banco imitado. Lo nuevo vive en tres archivos: `perfil.jsx` (la pantalla), `lugar.jsx` (país, búsqueda y bandera) y `cfg1b.css` (la hoja que copiaría la 1b). 202 capturas en las seis celdas, más `medidas.json`. |
| **V1** | **A cabe en las seis celdas sin desplazarse**: filas de 44 en el teléfono y de 61,6 en escritorio. **B se desplaza en 360×640 (105 px), 915×412 (129) y 1920×1080 (20)**, y en 1366×768 «Guardar» se monta sobre la línea del correo. Con el teclado abierto en 360, B deja el campo del nombre debajo del teclado. |
| **V2** | Con el teclado de la ficha (la vista encoge), **el campo y «Confirmar» se ven en 360×640** (botón en y = 226–272 de 380). Con el teclado de Chrome por defecto (tapa y no encoge), **«Confirmar» queda tapado en 360** (356–402 de 380). La ventana de los 30 días cabe siempre y sus botones miden 44. |
| **V3** | El buscador queda fijo arriba y la lista desplaza debajo. Filas de 44. «peru», «EEUU», «usa» y «curazao» encuentran lo suyo. Con el teclado, el buscador se ve en las dos celdas y en los dos modelos. Al abrir el selector se piden **41 banderas de 243** (36 en 360). |
| **V5** | El peor caso (15 «M» + «Venezuela · Distrito Capital») **no desborda en ningún sitio**. **En la barra del lobby la bandera no cabe**: el nombre baja de 3 a 1 letra con 15 «M» y de 8 a 2 con «DevLocal». La hoja ⚙ con «Acerca de» abierto sigue sin desplazarse en 360×640: termina en y = 573,61 (antes 575,34) con su tope en 584. |
| **Banderas** | **country-flag-icons 1.6.20**, licencia **MIT**. 243 banderas en 3:2 suman **158.833 B** (654 B de media). La de Venezuela, **8 estrellas, 797 B**. Trae también recortes 1:1 (redondas por CSS). Como muestra redonda «de verdad» se probó circle-flags (MIT). |
| **Países** | **243**: los 249 de ISO 3166-1 menos 6 sin población. Nombres de **CLDR 47 en español**, congelados en un archivo, con 5 arreglos a mano y 20 países con alias. |
| **Hallazgos** | (1) El «Cancelar» del Bautizo mide **56,5×23**, bajo los 44. Es de hoy. (2) La tarjeta del Bautizo es **translúcida**: sobre el perfil se lee lo que hay detrás. (3) Sumar 30×24 h da el **27** de noviembre, no el 28: el cambio de hora cae en medio. (4) Tres roces de zonas **que ya existen hoy en Rankings**, y que el perfil hereda de la carcasa (§6). |
| **Recomiendo** | **V1 A · V2 ventana · V3 A · V7 A**, igual que el rector. La fila del correo con «Pronto», sí. En Rankings, la **fila de dos líneas**. **Sin bandera en la barra.** |

---

## §1 · Cómo se sirve y cómo se usa

```
npx vite --port 5174 --strictPort --host 0.0.0.0      (en la raíz del repo; ya hay uno levantado)
node laminas/cfg1b/capturar.mjs [filtro]              (capturas y medidas; unos 2 min y medio)
node laminas/cfg1b/gen-paises.mjs                     (rehace datos/paises.js)
```

- **PC:** <http://localhost:5174/laminas/cfg1b/lamina.html>
- **S25 (misma red):** `http://192.168.12.171:5174/laminas/cfg1b/pantalla.html?panel=1`. Abre la pantalla a tamaño real, con un botón morado **«1b ▾»** abajo al centro. El botón despliega un panel con la escena y todas las variantes. Para ir directo a lo que pide la prueba con teclado:
  - V2: `…/pantalla.html?panel=1&sub=nombre`
  - V3: `…/pantalla.html?panel=1&sub=pais`
  - V1-B (campo en línea): `…/pantalla.html?panel=1&v1=B`

  Ahí el teclado es el de verdad. «Confirmar» del Bautizo no guarda nada: contesta según el estado de V2 que esté elegido en el panel.

### 1.1 · El visor (`lamina.html`)

- **Arriba van los controles**, fuera del área medida.
  - **Escena:** V1 perfil, V2 nombre, V3 país, V3 estado, V4 avatar, lobby, hoja ⚙, Rankings, mini-perfil propio y ajeno, victoria y V7.
  - **Variantes:** V1, V3, V7, caso de V5, estado de V2, freno, texto del buscador, fila de Rankings (1 o 2), bandera en la barra, pestaña y «Editar».
  - **Celda:** una de las seis, o «las seis».
  - **Teclado:** no / A / B, con el alto editable.
  - **Capa de zonas** y **medir**.
- **Cambiar de escena o de variante no recarga** (`postMessage`). Cambiar de celda o de teclado sí rehace los marcos.
- Debajo de cada marco salen sus medidas: tocables de menos de 44, solapes, textos cortados con «…», tamaño de las banderas y, con teclado, si el campo y el botón se ven.
- **Capa de zonas.** En rojo, la zona táctil real (la caja unida a su `::after`). En naranja con su cifra, lo que mide menos de 44. Rayado magenta, un solape entre dos tocables. Solo cuenta lo que se puede tocar: lo que queda bajo un velo no se pinta.

### 1.2 · Archivos

| Archivo | Qué es |
|---|---|
| `perfil.jsx` | **La pantalla nueva:** V1-A, V1-B, el avatar (V4), el selector de país y estado (V3), la ventana de los 30 días y el estado bloqueado. Monta la carcasa real `PantallaChips` y el `Bautizo` real. |
| `lugar.jsx` | `normalizar`, `buscarPaises`, `textoLugar` y `<Bandera>`. Lo que la 1b partiría en `lugarCore.js` y `Bandera.jsx`. |
| `cfg1b.css` | **La hoja que la 1b copiaría** (§1–§7). Va sin `!important` y sin hex, y no toca ningún protegido. La §Z es solo de la lámina. La cabecera de la hoja dice a qué archivo va cada sección. |
| `datos/paises.js`, `datos/estados.js` | La lista de países (generada) y la de estados, con el atajo de la diáspora. |
| `banderas/` | `3x2/` y `1x1/` (country-flag-icons, las 249 de ISO), `circulo/` (las 17 de muestra de circle-flags) y las dos licencias. |
| `app.jsx` | La raíz. Monta las pantallas reales, recibe el estado y **mete en el DOM lo que la 1b haría en JSX**: las banderas en las piezas que ya existen, la cabecera de la hoja tocable y «Editar» encendido. |
| `medir.js` | Las medidas: zona geométrica, barrido por `elementFromPoint` (paso de 1 px, tope 600 y bisección a 1/64), solapes, cortes con «…», banderas, hoja ⚙ y teclado. |
| `capturar.mjs`, `controles.js`, `pre.js`, `pantalla.html`, `gen-paises.mjs` | El capturador, las escenas compartidas, el arranque (sonido apagado, pantalla completa anulada, azar con semilla), la página y el generador de países. |

### 1.3 · El teclado: de dónde salen las cifras y los dos modelos

**Altos usados** (editables en el visor; Victor los comprueba en el S25):

| Celda | Alto | De dónde sale |
|---|---|---|
| 412×915 (S25) | **336** | Teclado Samsung en vertical: cuatro filas de letras más la barra de herramientas. Es ≈ 37 % del alto, la proporción habitual de la medida en dp. |
| 360×640 | **260** | Gboard sin fila de números: cuatro filas de ~52 dp más la tira de sugerencias. |
| 390×844 | **336** | Teclado de iPhone con la barra predictiva (291 + 45 pt). |

Son estimaciones de tamaños típicos, **no medidas en un aparato**.

**Los dos modelos:**
- **A, lo que pide la ficha:** la vista encoge el alto del teclado, y con ella `100dvh` (`interactive-widget=resizes-content`).
- **B, lo que hace Chrome en Android por defecto:** el `index.html` de la app no declara `interactive-widget`. Chrome no encoge la vista: el teclado **tapa**, y el navegador sube la página lo justo para que se vea el campo con el foco. Así funciona Chrome desde la versión 108; Safari en iOS hace lo mismo. En el capturador, B es una franja recortada de la vista entera, subida lo justo.

**Lo que dirá el S25 de verdad está en B**, salvo que la 1b cambie el `meta viewport` (no lo recomiendo: afectaría a la mesa).

---

## §2 · Capturas

Están en `laminas/cfg1b/capturas/`: **202 PNG, 83 MB** (los teléfonos van a DPR 2). El nombre es `<CASO>_<celda>[_teclado|_tecladoB].png`.

| Vista | Casos |
|---|---|
| V1 | `V1A`, `V1B`, `V1A-peor`, `V1B-peor` (las seis celdas) · `V1A-zonas`, `V1B-zonas` (360, 412, 915, 1920) · `V1A-sinpais` · `V1A-correo-toast` (el «Pronto» de la fila del correo) · `V1B_*_teclado` |
| V2 | `V2-1` normal · `V2-2` inválido («Dev Local») · `V2-3` ocupado · `V2-4` vedado · `V2-5` aviso de 30 días · `V2-6` bloqueado · `V2-7` guardado. Cada uno en 412, 360 y 1920, y con `_teclado` en 412 y 360. Además: `V2-1`, `V2-2` y `V2-5` con `_tecladoB`, `V2-1-zonas`, `V2-5-zonas` y `V2-1-peor` |
| V3 | `V3-lista` (seis celdas, con `_teclado` y `_tecladoB`) · `V3-peru`, `V3-eeuu`, `V3-usa`, `V3-curazao`, `V3-republica` y `V3-vacio` (412 y 360; `V3-peru` y `V3-vacio` también con teclado) · `V3A-estados` (seis celdas), `V3A-estados-largos`, `V3A-estados-zonas` · `V3B-fila` (Venezuela sin estado: aparece la fila «Estado») y `V3B-fila-zulia` |
| V4 | `V4` (seis celdas) y `V4-zonas` |
| V5 | `V5-mp-propio-<caso>` y `V5-mp-ajeno-<caso>` · `V5-hoja-<caso>` · `V5-hoja-acerca` y `V5-hoja-acerca-peor` · `V5-rnk1-*` (bandera sola) y `V5-rnk2-*` (dos líneas), en Maestros y Fortunas · `V5-barra-peor` y `V5-barra-vez` frente a `V5-barra-hoy-*` |
| V6 | `V6-hoja-zonas` (360, 412, 1920) · `V6-mp-propio-zonas` · `V6-victoria` · `V6-lobby-zonas` · `V6-salas-perfil-zonas` |
| V7 | `V7` (tira completa, 412 y 1920) · `V7B-rnk`, `V7C-rnk`, `V7B-mp` y `V7B-perfil` (la redonda puesta en su sitio) |

`<caso>` es `nada`, `ve`, `vez` (Venezuela · Zulia), `es` o `peor`.

---

## §3 · Medidas

Formato: **caja → zona** (ancho × alto, en px aplicados); entre paréntesis, el barrido. El 43,98 es la cuantización de 1/64 px de Chromium y cuenta como 44, como en la 1a.

### 3.1 · V1 · la pantalla de perfil

| Celda | V1-A: fila | Fila «Avatar» | V1-B: campo / «País» | V1-B: «Guardar» | ¿Se desplaza? |
|---|---|---|---|---|---|
| 360×640 | 334,81×44 (43,98) | ×44,25 | 334,81×44 / ×44 | 230,39×44 | A **no** · B **sí, 105 px** |
| 390×844 | 362,72×44 | ×45,72 | — | — | A no · B no |
| 412×915 | 383,19×44 | ×47,11 | 383,19×44 / ×44 | 263,67×45,31 | A no · B no |
| 915×412 | 464,75×44 (dos columnas) | ×47,11 | 464,75×44 | 263,67×48 | A **no** · B **sí, 129 px** |
| 1366×768 | 676,81×61,59 (dos columnas) | ×68,17 | — | — | A no · B no, pero **«Guardar» pisa la línea del correo** |
| 1920×1080 | 660×61,59 | ×68,17 | 660×57 / ×57 | 384×66 | A no · B **sí, 20 px** |

**Reglas:**
- **Filas:** `.lob-fila` de `hojaConfiguracion.css` (`min-height: 44px`, relleno de 2,4 u, letra de 3,4 u) más `cfg1b.css §2`, `.sal .lob-fila.pf-fila` (filete y 1 u a los lados).
- **Campo y botones de elegir:** `min-height: max(44px, 9.5u)`; letra `max(16px, 3.4u)`, porque Safari del iPhone acerca la página con menos.
- **«Guardar»:** el `--cta-h` de `salas.css` con `.sal-cta.pf-guardar` en contorno crema. **No es oro** (INV-08).
- **Las dos columnas** (≥ 900 × ≤ 830, la banda B de `salas.css`): `cfg1b.css §3`. Las reglas de `salas.css` colocan por `:nth-child` con especificidad (0,5,0); las mías tienen la misma y van después.
- **Cabecera:** círculo de `max(72px, 17u)` (72 en teléfono, 102 en 1920), nombre a `max(19px, 4.6u)` y lugar a `max(14px, 3.3u)`.

**Cortes:**
- Con 15 «M» y «Venezuela · Distrito Capital», **nada se corta** en la cabecera ni en las filas de V1-A, ni siquiera en 360.
- El único «…» es el del nombre en la barra (11 de 15), que es de hoy.
- Si un valor no cupiera, el que cede es el valor (`.pf-trunca`), nunca la etiqueta.

### 3.2 · V2 · el nombre

| | 360×640 | 412×915 | 1920×1080 | Regla |
|---|---|---|---|---|
| Campo del Bautizo | 229×46 | 229×46 | 253×49 | `puerta.css` (de hoy) |
| «Confirmar» | 229×46 | 229×46 | 253×49 | `puerta.css` |
| **«Cancelar» del Bautizo** | **56,52×23** | **56,52×23** | **63,08×24** | `.puerta-link` (`puerta.css:214`) · **bajo 44** |
| «Cerrar» en bloqueado | 41,19×23 | 41,19×23 | 45,83×24 | ídem |
| Ventana 30 días: «Cancelar» / «Cambiar» | 142,31×44 | 165,31×44 | 228,5×48 | `.elc-btn`, `max(44px, 8u)` |

**Con el teclado:**

| | Modelo A (la vista encoge) | Modelo B (el teclado tapa; Chrome) |
|---|---|---|
| 412×915 (336) | Vista 579. Campo 229–275 y «Confirmar» 325–371: **a la vista** | La página no sube. Campo 397–443 y «Confirmar» 493–539 de 579: **a la vista** |
| 360×640 (260) | Vista 380. Campo 130–176 y «Confirmar» 226–272: **a la vista** | Campo 260–306: a la vista. «Confirmar» 356–402 de 380: **TAPADO** |
| Ventana de 30 días, 360 | «Cambiar» 205–249: a la vista | «Cambiar» 335–379: a la vista, por 1 px |

**Lo que propongo para 360 en el modelo B:**
- La tecla Intro del teclado ya envía, porque el Bautizo es un `<form>`. Basta con ponerle `enterKeyHint="go"`.
- En teléfono, la tarjeta de edición puede ir arriba en vez de centrada: `.puerta-overlay` con `align-items: start`. Con eso el botón cae donde lo deja el modelo A (≈ 226–272).

Las dos cosas van en la 1b, sin tocar la puerta de entrada.

**Lo que ya existe y la 1b reutiliza:**
- **El Bautizo no tiene contador de letras.** El campo lleva `maxLength={15}`: pasarse de 15 no se puede ni escribir, así que el estado «más de 15» no existe.
- **Mensajes de error**, los de `traducirErrorUsername`:
  - inválido: «De 6 a 15 letras, números o _, sin espacios»;
  - ocupado: «Ese nombre ya está tomado»;
  - vedado: «Ese nombre no está permitido — prueba otro».
- **Bloqueado** (V2-6): el campo apagado y, en la ranura de avisos en gris, «Podrás cambiarlo de nuevo el 28 de noviembre.».
- **Guardado** (V2-7): el editor se cierra, sale el aviso «Listo: ahora eres MaracuchaBrava» y la fila del nombre añade debajo «Próximo cambio: 28 de noviembre».

### 3.3 · V3 · país y estado

| Celda | Buscador | Fila de país o estado | Bandera de la lista |
|---|---|---|---|
| 360×640 | 334,81×44 | 334,81×44 (43,98) | 24×16 |
| 412×915 | 383,19×44 | 383,19×44 | 24×16 |
| 915×412 | 453,19×44 | 453,19×44 | 24×16 |
| 1366×768 · 1920×1080 | 660×57 | 660×44 | 32,39×21,59 |

**Reglas** (`cfg1b.css §2`):
- `.pf-op { min-height: 44px }`.
- La lista desplaza por dentro con la §17 de `salas.css` (`sal--lista-interna` + `.sal-desplaza`); el buscador se queda quieto.
- Ancho: `min(--col, 110u)`.
- La fila elegida lleva el contorno de oro de los chips y un ✓ crema: sin oro macizo.

**Teclado:** el buscador está arriba, así que se ve en las dos celdas y en los dos modelos (y = 102–146 en 360). Debajo quedan unas 5 filas en 360 con el teclado.

**Búsqueda:**
- «peru» → Perú.
- «EEUU» y «usa» → Estados Unidos, y nada más.
- «curazao» → Curazao.
- «republica» → Centroafricana, Democrática del Congo, Dominicana y Chequia (por el alias «República Checa»).
- «zzz» → «No encontramos ese país».

**Nombres largos:** «República Democrática del Congo», «Distrito Capital», «Delta Amacuro» y «Nueva Esparta» caben enteros en 360.

**Aire con la cabecera:** el buscador pisaba 1,89 px las zonas de la flecha y la casa en 360 (por R-9 de la 1a, esas zonas crecen hacia abajo). Con `padding-top: 4u` queda a 0. La regla está en `cfg1b.css §2`.

### 3.4 · V4 · el avatar

- **Celdas:** 77,23 en 360 y 98 en 1920 (`--celda: max(64px, 16u)`, `repeat(auto-fill, minmax(--celda, 1fr))`). Salen 4 por fila en 360 y 6 en 1920.
- La primera celda es la de hoy, marcada con el contorno de oro y un ✓. Las demás son huecos rayados, sin zona táctil. Debajo: «Avatares en la tienda» con la pastilla «Pronto».
- **AVA-1 solo tiene que cambiar los huecos por avatares.** La rejilla, su celda y su marca ya son las definitivas.

### 3.5 · V5 · lo elegido, en cada sitio

| Sitio | Bandera (teléfono → escritorio) | Qué se ve | Peor caso en 360 |
|---|---|---|---|
| Cabecera del perfil | 27×18 → 37,78×25,19 | bandera + «Venezuela · Zulia» | Cabe entero |
| Fila del perfil | 21×14 → 26,73×17,83 | bandera + texto | Cabe entero |
| Mini-perfil (propio y ajeno) | 21×14 | La pastilla de 28 de RNK-1 (pasa de rayada a lisa) con bandera + texto. Sin país: solo el isotipo tenue, sin filete | El lugar cabe; el nombre ya cortaba antes («…», 13 de 15, por el hueco de la corona) |
| Rankings, fila 1 (bandera sola) | 18×12 · 19,03×12,69 · 27,7×18,47 | bandera detrás del nombre | El nombre propio baja a **~8 de 15** con «· tú» |
| Rankings, fila 2 (dos líneas) | 18×12 · 20,16×13,44 | 1.ª línea nombre · «tú»; 2.ª línea bandera + lugar, en tenue | El nombre conserva **~12 de 15**; el lugar cabe |
| Cabecera de la hoja ⚙ | 18×12 → 28,19×18,8 | **solo la bandera** detrás del nombre | Cabe |
| Barra del lobby | 18×12 → 27×18 | — | **No cabe** (§4-1) |

Las letras de Rankings se leyeron en las capturas `V5-rnk*-fortunas-peor_360x640`: la fila propia solo sale en Fortunas, porque esa cuenta no tiene puntos en Maestros.

**Dónde corta y por qué:**
- Siempre corta **el nombre** antes que el lugar en la fila 1, porque la bandera es `flex: none`.
- En la fila 2 corta el nombre en su línea, y el lugar en la suya, con «…» (`.cfg-lugar-t`).
- **El hueco del mini-perfil ya existía**; en las filas de Rankings **no había hueco** (contra lo que dice la ficha): la 1b lo añade en `Fila` (`Rankings.jsx:75`).

**La hoja ⚙ con «Acerca de» abierto:**

| Celda | Alto | Termina en | Tope | ¿Se desplaza? |
|---|---|---|---|---|
| 360×640 | 524,30 | 573,61 | 584 | **No** (Configuración v1.1 §8: 526,03 / 575,34) |
| 412×915 | 560,97 | — | — | No |
| 1366×768 | 648 (tope) | — | — | Se desplaza, como hoy |
| 915×412 | tope | — | — | Se desplaza, como hoy |

Por eso la bandera de la hoja va **sin texto**: con una línea más (≈ 15 px) terminaría en ≈ 589 y pasaría el tope.

### 3.6 · V6 · las tres puertas

| Puerta | 412×915 | 1920×1080 | Regla |
|---|---|---|---|
| Cabecera de la hoja ⚙ (botón con «›») | 278,17×58,7 | 406×69,19 (360: 242,81×57,41) | `cfg1b.css §5`, `min-height: 44px`; ya medía más de 44 |
| «Editar» del mini-perfil propio, sin «Pronto» | 337,03×44 | 358×44 | `miniPerfil.css` (`min-height: 44px`), de hoy |
| Figurita + nombre del lobby | 116,11×44,06 | 169,38×64,19 | de hoy, sin cambio |

- **Cero solapes** entre la cabecera de la hoja y «Sonido» en 360, 412 y 1920. El filete inferior y el margen de 1,5 u las separan.
- El solape 406×9 de `V5-hoja-acerca_1366x768` es un artefacto: «Sonido» queda medio desplazada bajo la cabecera fija y el medidor cuenta su caja recortada.
- **Desde la victoria** (`V6-victoria`), la tarjeta sale sin «Editar» y queda unos 58 px más corta.
- **Al volver:** la flecha devuelve a la pantalla desde la que se entró (lobby, Rankings o la pantalla `.sal` de la hoja). La casa va al lobby.

### 3.7 · V7 · las banderas a tamaño de uso

- Tira en `V7_412x915.png` y `V7_1920x1080.png`. Tiene las 17 de muestra en los cuatro tamaños de uso y en las tres variantes, sobre verde y sobre vino.
- **A**, rectangular: 24×16 en la lista y 18×12 en la fila de Rankings.
- **B y C**, redondas: 16 de diámetro en la lista y 12,69 en Rankings. **A esos tamaños la redonda tiene menos de la mitad de superficie que la rectangular.**
- Chad y Rumanía, e Indonesia y Mónaco, salen iguales en las tres: también lo son en la realidad.
- El recorte 1:1 de Venezuela conserva las 8 estrellas. Las de España y México se encogen hasta ser una mancha.

---

## §4 · Lo que no cabe o rompe, con la prueba

1. **La bandera no cabe en la barra del lobby.**
   - 360: «DevLocal» pasa de 8/8 a **2/8**, y 15 «M» de 3 a **1**.
   - 412: 15 «M» pasa de 3 a **1**.
   - En 915 y 1920 cabe todo.
   - Pruebas: `V5-barra-*` frente a `V5-barra-hoy-*`.
   - La barra no se toca (regla de la ficha).
2. **V1-B no cabe sin desplazarse en 360×640, 915×412 ni 1920×1080, y en 1366×768 «Guardar» pisa la línea del correo** (`V1B_1366x768.png`).
   - «Guardar» queda anclado y tapa el final del formulario (el correo, o el estado).
   - En 360 con teclado, el campo del nombre (y = 387–431) cae **bajo** el teclado (vista de 380), con «Guardar» encima.
   - Pruebas: `V1B_*`, `V1B_360x640_teclado`.
3. **«Confirmar» del Bautizo, tapado en 360 con el teclado de Chrome** (modelo B). Arreglo propuesto en §3.2. Prueba: `V2-1_360x640_tecladoB`.
4. **«Cancelar» y «Cerrar» del Bautizo miden 23–24 de alto.** Es de hoy (`puerta.css:214`, enlace de texto), pero en el perfil pasa a ser un tocable de uso diario. Arreglo: el camino Z de `tactilLobby.css` (un `::after` de 44). Prueba: `V2-1-zonas_*`.
5. **La tarjeta del Bautizo es translúcida** (`--surface-panel`). Sobre la mesa no se notaba. Sobre el perfil se leen el avatar y las filas a través de la tarjeta (`V2-1_412x915`). Arreglo: `--surface-modal` en el modo edición.
6. **La fecha del freno.** `fecha + 30 × 86.400.000 ms` da el **27 de noviembre a las 23:00**, porque el 1 de noviembre cambia la hora. La 1b tiene que sumar días de calendario (`new Date(a, m, d + 30)`) o, mejor, recibir la fecha calculada por el servidor.
7. **El botón nativo de borrar del buscador sale azul** (el «×» de Chromium en `type="search"`; `V3-vacio_360x640_teclado`). La 1b lo esconde y pone uno propio de 44.
8. **Artefactos del medidor, no defectos:**
   - Una fila de lista recortada por el borde de su contenedor da barrido < 44 o «solape» con la cabecera (la caja sigue debajo).
   - Lo mismo pasa con las filas de Rankings que pasan bajo «Tu posición».

---

## §5 · Banderas y países

### 5.1 · La colección

| | country-flag-icons (elegida) | circle-flags (muestra redonda) | flag-icons (descartada) |
|---|---|---|---|
| Versión | 1.6.20 | 2.8.3 | 7.6.0 |
| Licencia | **MIT** · <https://gitlab.com/catamphetamine/country-flag-icons> | **MIT** · <https://github.com/HatScripts/circle-flags> | MIT |
| Uso comercial | Sí | Sí | Sí |
| Atribución | Ninguna visible. El aviso MIT (copyright y licencia) **viaja con los archivos**: un `LICENSE` junto a las banderas, y si se quiere, una línea en «Acerca de» | Igual | Igual |
| Forma | **3:2** y recortes **1:1** | Solo círculo | 4:3 y 1:1 |
| Venezuela | **8 estrellas**, sin escudo · 797 B | 8 estrellas · 1.040 B | 8 estrellas · 1.206 B |
| Peso | **243 países: 158.833 B**, 654 B de media; la mayor, IO, 5.321 B. Juntas en gzip, ≈ 43 KB | 432 archivos · 308 KB | 271 archivos · 1,93 MB (España 81 KB y México 85 KB, con escudo) |

**Carga a demanda:**
- `<img loading="lazy">`, una petición por bandera, y el SVG no ejecuta nada.
- Ninguno de los archivos copiados trae `<script>`, `foreignObject` ni enlaces externos (comprobado con `grep`).
- Abrir el perfil pide **1**; Rankings, **13**; el selector, **41** (36 en 360). Bajar hasta el final de la lista suma **85**, no las 243.

### 5.2 · La lista

- **Fuente:** CLDR 47 en español, el del ICU de Node 22. Sale de `Intl.DisplayNames('es')` y se **congela** en `datos/paises.js` (14 KB) con `gen-paises.mjs`. Licencia Unicode v3, permisiva.
- **Por qué congelar:** cada navegador trae su CLDR, y la lista no puede decir cosas distintas en cada aparato.
- **Cuántas entran: 243.** Las 249 de ISO 3166-1, territorios incluidos (Aruba, Curazao, Puerto Rico, Bonaire, Sint Maarten…).
- **Fuera, 6 sin población permanente:** Antártida, Bouvet, Heard y McDonald, las menores alejadas de EE. UU., los Australes Franceses y Georgia del Sur. Motivo: nadie «es de» allí, y aparecen al buscar «isla». Si Victor prefiere las 249, es borrar una línea.
- **Arreglados a mano (5):**
  - Hong Kong (CLDR: «RAE de Hong Kong (China)»)
  - Macao
  - Costa de Marfil (CLDR: «Côte d’Ivoire»)
  - Palestina (CLDR: «Territorios Palestinos»)
  - Timor Oriental (CLDR: «Timor-Leste»)
- **Nombres que Victor quizá quiera mirar:**
  - **Malvinas:** CLDR ya dice «Islas Malvinas».
  - Taiwán.
  - Sáhara Occidental.
  - **Kosovo:** no es de ISO; tiene bandera en la colección, pero queda fuera.
  - **Estados de Venezuela:** la lista es la de la ficha, 23 + Distrito Capital. «La Guaira» es el nombre oficial desde 2019 («Vargas» es alias). Las Dependencias Federales quedan fuera. La ley venezolana de 2024 crea además un estado «Guayana Esequiba» sobre el territorio en disputa. No está en la lista; **lo decide Victor**.

### 5.3 · Los alias del buscador

**Cómo busca:**
- Sin tildes, sin mayúsculas y sin puntuación: «Perú» → «peru», «EE. UU.» → «ee uu», «Curaçao» → «curacao».
- Se busca **por comienzo de palabra**, no por «contiene». Así «us» no encuentra Rusia.
- Además del nombre, se busca el nombre en inglés de los 243 («germany», «spain», «brazil»…) y estos alias:

| País | Alias |
|---|---|
| Estados Unidos | EEUU, EE. UU., USA, US, Norteamérica |
| Reino Unido | UK, Inglaterra, Gran Bretaña, Escocia, Gales, Irlanda del Norte |
| Países Bajos | Holanda |
| República Dominicana | RD, Dominicana |
| Chequia | República Checa |
| Emiratos Árabes Unidos | EAU, Emiratos, Dubái, Abu Dabi |
| Arabia Saudí | Arabia Saudita |
| Curazao | Curaçao, Curacao |
| Caribe neerlandés | Bonaire, San Eustaquio, Saba |
| Sint Maarten | San Martín |
| Puerto Rico | Borinquen, Boricua |
| Ciudad del Vaticano | Vaticano |
| Esuatini | Suazilandia |
| Macedonia del Norte | Macedonia |
| Bielorrusia | Belarús |
| San Cristóbal y Nieves | Saint Kitts |
| Islas Malvinas | Falkland |
| Costa de Marfil | Côte d’Ivoire |
| Timor Oriental | Timor-Leste |
| Myanmar (Birmania) | Birmania |

**Estados con alias:** Distrito Capital (Caracas), La Guaira (Vargas), Nueva Esparta (Margarita). Hoy la lista de estados no tiene buscador: son 24 filas.

---

## §6 · Lo que encontré y no es de la 1b

Tres roces de zonas **que ya existen en Rankings**. Se midieron con la hoja de la lámina apagada. El perfil los hereda porque usa la misma carcasa:

| | Dónde | Medida |
|---|---|---|
| a | ⚙ y casa, 915×412 | 20,86×1,11 px |
| b | «+» y ⚙ con un nombre de 15 «M», en 360, 390 y 412, en toda `.sal` | **8,73 px** en 360 (en el lobby, 0) |
| c | Flecha y casa con las pestañas de Rankings, 360 | 2,89 px |

`diagDSK cfg` no los ve porque no mide Rankings ni prueba nombres anchos en `.sal`. Propongo una tanda pequeña aparte, o meterlos en la 1b si el rector lo prefiere.

---

## §7 · Recomendación de Claude Code por vista

| Vista | Rector | **Claude Code** | Por qué |
|---|---|---|---|
| **V1** | A | **A** | Cabe en las seis celdas sin desplazarse. Es el gesto del ⚙ y el teclado solo sale al editar el nombre. La B se desplaza en tres celdas y en la cuarta «Guardar» pisa el correo; en 360 deja el campo bajo el teclado, y obliga a resolver el freno dentro de un «Guardar» general. |
| Fila del correo | con «Pronto» | **Sí** | Mide 44, como las otras filas. La 1d solo quita la pastilla y le pone el `onClick`. |
| **V2** | ventana | **ventana**, más dos arreglos | La ventana cabe en todo y no se confunde con un error. Hacen falta además los arreglos de §3.2 (`enterKeyHint`, tarjeta arriba en teléfono) y los de §4-4 (Cancelar a 44) y §4-5 (tarjeta opaca). |
| **V3** | A | **A** | Ahorra un toque y no deja nada a medias. «Sin estado» está arriba y marcada por defecto. La B añade una fila que casi todos tocarían igual. |
| **V4** | — | como está | La rejilla ya es la de AVA-1. |
| **V5, Rankings** | — | **fila 2** (dos líneas) | En 360 conserva ~12 de 15 letras del nombre, frente a ~8 de la fila 1, y enseña el estado. Su precio: una segunda línea tenue en cada fila. Si Victor la ve recargada, la fila 1 también es correcta. |
| **V5, barra** | — | **sin bandera** | No cabe (§4-1). |
| **V5, hoja ⚙** | — | **bandera sin texto** | Con texto pasaría el tope en 360×640 con «Acerca de» abierto. |
| **V7** | A | **A** | A 12–16 px la rectangular tiene más del doble de superficie, y escudos y estrellas se leen mejor. La redonda (B o C) no acompaña mejor al avatar redondo en la fila: se ve como una segunda inicial pequeña (`V7B-rnk_412x915`). |

---

## §8 · Lo que la 1b necesitará además de lo visto

| # | Qué | Dónde |
|---|---|---|
| R-1 | **Columnas:** `pais text` (`^[A-Z]{2}$`, o nulo) · `estado text` (nulo, o un código de la lista **solo si** `pais = 'VE'`) · `nombre_cambiado_en timestamptz` (nulo hasta el primer cambio). Para el avatar no hace falta nada hasta AVA-1. | migración nueva |
| R-2 | **Freno en un trigger** `BEFORE UPDATE`. Si `lower(new.username) <> lower(old.username)` y `old.nombre_cambiado_en > now() − 30 días`, rechaza con un código propio y la fecha en el mensaje o en el `hint`; si pasa, escribe `nombre_cambiado_en := now()`. **Además impide escribir `nombre_cambiado_en` a mano**: la RLS de UPDATE no limita columnas (Fase 0 G-1). El Bautizo (insert) no cuenta. | ídem |
| R-3 | **`mini_perfil`:** `drop` + `create` con `pais` y `estado`, y repetir el `grant`. **`ranking_top` también** (las filas de Rankings necesitan la bandera; con la fila 2, también el estado). **La prueba A10 pasa de 13 columnas a 17** (15 si solo `ranking_top` lleva `pais`). Los nombres no casan con `(correo\|email\|mail\|_id$\|^id$)`. | `rnk1a` y migración nueva · `supabase/pruebas/rnk1a_verificacion.sql:185-198` |
| R-4 | `traducirPerfil` y `traducirFilaTop` copian `pais` y `estado`, validados contra la lista. | `src/lib/rankingApi.js` |
| R-5 | El banco imitado contesta con país y estado en `mini_perfil` y en `ranking_top`, y lleva el freno. `sembradosRanking` gana un lugar por jugador (el reparto de `app.jsx` sirve de molde). | `src/dev/bancoImitado.js`, `src/dev/sembradosRanking.js` |
| R-6 | **`useAuth`:** `cargaPerfil` trae `pais`, `estado` y `nombre_cambiado_en`. Nace `cambiarLugar(pais, estado)`. `cambiarNombre` traduce el código del freno con la fecha. | `src/hooks/useAuth.js` |
| R-7 | **El Bautizo:** <ul><li>prop `bloqueadoHasta`;</li><li>la ventana de 30 días antes de enviar;</li><li>`enterKeyHint="go"`;</li><li>tarjeta arriba en teléfono;</li><li>«Cancelar» a 44 (camino Z);</li><li>tarjeta opaca en edición;</li><li>alinear «Nombre de jugador» y «Cambiar nombre» con «Nombre de usuario».</li></ul> | `src/screens/Bautizo.jsx`, `bautizo.css` |
| R-8 | **Orden de la ventana y el servidor.** El aviso de 30 días sale **antes** del viaje: si el servidor luego dice «ocupado» o «vedado», el jugador vio el aviso en balde (el freno no se gasta, porque el UPDATE falló). Si molesta, una RPC `nombre_libre(p)` antes del aviso. | decisión |
| R-9 | **Pantalla y rutas:** `screen === 'perfil'` en `App`, con `desde`. | `App.jsx` |
| R-10 | **Las tres puertas:** <ul><li>`onPerfil` en `BarraSuperior` desde el lobby, `PantallaChips`, `SalaOpciones`, `SalaEspera` y `PartidaPvP` (cinco sitios dicen hoy «Pronto»);</li><li>la cabecera de `HojaConfiguracion` pasa a ser `<button>` con `onPerfil`;</li><li>`MiniPerfil` gana `onEditar`, que pasa Rankings y no pasa la victoria.</li></ul> | varios |
| R-11 | **Banderas** en el repo, con `<img loading="lazy">`: `public/banderas/3x2/*.svg` (243, 159 KB) más `LICENSE`. | `public/` |
| R-12 | **Datos:** `src/config/paises.js` (generado), `src/config/estados.js` y `scripts/gen-paises.mjs`. `src/lib/lugarCore.js` (`normalizar`, `buscarPaises`, `textoLugar`), con pruebas de vitest: «peru», «EEUU», «us» sin Rusia, «republica», «zzz». | `src/config/`, `src/lib/`, `scripts/` |
| R-13 | **Hojas:** `perfil.css` (= `cfg1b.css §1–§4`) y los añadidos a `hojaConfiguracion.css` (§5), `miniPerfil.css` (§6) y `rankings.css` (§7). Las filas de Rankings pasan a llevar el lugar en su JSX (no hay hueco hoy). | `src/styles/` |
| R-14 | **Textos nuevos** para el diccionario (`perfil.*`): <ul><li>«Perfil», «Avatar», «Nombre de usuario», «De dónde eres», «Correo», «Estado», «Elegir», «Sin elegir», «Sin estado», «Prefiero no decirlo»;</li><li>«Busca tu país», «Donde más estamos», «Todos los países», «No encontramos ese país», «Venezuela · ¿de qué estado?»;</li><li>«Avatares en la tienda», «Guardado», «Listo: ahora eres {nombre}», «Próximo cambio: {fecha}»;</li><li>«¿Cambiar tu nombre a {nombre}?», «Después de este cambio no podrás cambiar tu nombre durante 30 días.», «Cambiar», «Podrás cambiarlo de nuevo el {fecha}.», «Tu perfil» (`aria`);</li><li>con V1-B, además, «Guardar» y «Solo puedes cambiarlo una vez cada 30 días.».</li></ul> **Los nombres de país no van al diccionario:** vienen de CLDR. | `src/config/textos.es.js` |
| R-15 | **Fecha:** días de calendario, o la fecha del servidor. Se enseña en la zona del aparato con `Intl.DateTimeFormat('es', { day: 'numeric', month: 'long' })`. | §4-6 |
| R-16 | **Invariantes propuestas** (INV-70 sigue reservado): <ul><li>**INV-72** · el nombre se cambia como mucho una vez cada 30 días, y la regla vive en el servidor;</li><li>**INV-73** · las banderas son dibujos propios, nunca emoji, y solo se pide la que se pinta;</li><li>**INV-74** · un solo país por jugador; estado solo con Venezuela; sin país, el isotipo.</li></ul> | `docs/AJILEI_Invariantes_v1.0.md` |
| R-17 | **Arnés:** <ul><li>`diagDSK cfg` gana la pantalla de perfil en `cfg.zona` y `cfg.solape`: filas, buscador, opciones, ventana y «Cancelar» del Bautizo;</li><li>una puerta `cfg.perfil` para las tres entradas y la vuelta a su origen;</li><li>`cfg.freno` con el banco imitado;</li><li>`rnk` comprueba la bandera en la fila y en la tarjeta (`rnk.perfil`);</li><li>`guiones`, con un guion nuevo `cfg1b_verificacion.sql` (freno, columnas, A10).</li></ul> `medir.js` de la lámina sirve de base. | `scripts/`, `supabase/pruebas/` |
| R-18 | **El buscador:** esconder el «×» nativo (`::-webkit-search-cancel-button`) y poner uno propio de 44. | `perfil.css` |

**Preguntas para Victor:**
1. V1, V3 y V7. Y en Rankings, ¿fila 1 o fila 2?
2. La fila del correo con «Pronto»: ¿sí?
3. **Mayúsculas:** cambiar «devlocal» por «DevLocal», ¿gasta los 30 días? La propuesta R-2 dice que **no**: solo cuenta un cambio de nombre de verdad.
4. **La lista:** ¿243 o las 249? ¿Algún nombre de §5.2 que cambiar? ¿«Guayana Esequiba» como estado?

---

## §9 · `git status`

```
?? docs/reportes/AJILEI_CFG-1_Fase1bL_Informe_v1.0.md
?? docs/reportes/AJILEI_MOT-1_Fase0_Informe_v1.0.md
?? docs/reportes/AJILEI_MOT-1_Fase1-0_Sonda_Informe_v1.0.md
?? laminas/cfg1b/
?? laminas/mon1/_entorno.txt
?? laminas/mon1/lamina.html
?? laminas/mon1/tiempos.json
```

Solo el informe nuevo, `laminas/cfg1b/` y lo de MOT-1 que ya estaba. Nada de `src/`, `scripts/`, `supabase/`, `public/` ni `package.json`. Sin commits. Vite sigue levantado en el 5174 para la revisión de Victor. **STOP-L.**
