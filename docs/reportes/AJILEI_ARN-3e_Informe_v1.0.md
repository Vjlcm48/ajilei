# AJILEI · ARN-3e · El registro de invariantes y el cierre de ARN-3 · Informe v1.0

**Ficha:** `AJILEI_ARN-3e_v1.0.md` (Fase 1). **Base técnica:** `AJILEI_ARN-3e_Fase0_Informe_v1.0.md`, citada por sección (§A2, §B1, §D2…); sus medidas no se repiten.
**Punto de partida:** `main` en `7db208c`, con los 5 residuos conocidos y el informe de la Fase 0 sin commitear.
**Navegador:** Chromium 151.0.7922.34 de `playwright-core` 1.62.1 (`navegadorArnes`).

---

# Parte 3e-i · Pruebas y arnés

**Fecha:** 2026-10-03, de 05:51 a 07:28 (97 min; tope 120).
**Sin commits y sin `git add`.**
**`src/`:** solo el comentario de `src/styles/playingCard.css` (D10), con la prueba del `dist/` idéntico. Ningún protegido abierto: las pruebas nuevas los leen como bytes, desde fuera (D2).

**Dónde se midió:**
- **El repo**, con un solo build: el de la primera corrida de `humo` (05:57). Todo lo demás corrió con `--sin-build` o en servidores de desarrollo. Puertos propios: 4301–4316 y 5301–5333. El 4173 y el 5173 no se tocaron.
- **Una copia de controles**, `scratchpad/arn3e-i/ctl`:
  - hecha con `git ls-files -co --exclude-standard` sobre el árbol de trabajo, más su `.env.local` y una unión a `node_modules`;
  - lleva el parche `parche_apu5.py`, cuyos controles se encienden con variables `CTL_APU5_*` que solo existen en esa copia;
  - compiló sus propios `dist/` dentro de su carpeta (D10 y el control de `humo`).
- **Paralelismo:** como mucho 6 arneses a la vez, con una cola (`scratchpad/arn3e-i/cola.sh`).

## Resumen

| Pieza | Vara | Control | Estado |
|---|---|---|---|
| **1.1** `testProtegidos.test.js` | **8/8 verde** | un byte cambiado · un 7.º protegido sin fila en §3 · §3 ilegible → **rojo los tres**; restaurado → verde | Hecho |
| **1.2** `testImportant.test.js` | **4/4 verde** (2 de la regla + 2 del quitacomentarios) | uno nuevo en CSS · uno por `setProperty` · una excepción retirada → **rojo los tres**; restaurado → verde | Hecho |
| **1.3** `testClavesAlmacen.test.js` | **5/5 verde**. Censo: **12 claves**, ninguna sin fuente | una clave nueva · un archivo nuevo que toca `localStorage` · una entrada del censo que ya no existe → **rojo los tres**; restaurado → verde | Hecho |
| **1.4** `testAvisosPruebas.test.js` | **2/2 verde** (52 archivos de prueba mirados) | un `console.warn` en una prueba → **rojo**; el mismo en un comentario → verde | Hecho |
| **1.5** `playingCard.css` (D10) | **`dist/` idéntico byte a byte** con y sin el comentario: 116 archivos, el mismo manifiesto `sha256`. `.card-selected` está en el CSS compilado | — | Hecho |
| **1.6** `humo` | **verde, código 0** en el repo: 2 min 44 s con `--sin-build` sobre el único build. Con su build, en la copia: **verde, código 0, 2 min 44 s** | `all` → **código 2** con su mensaje, sin levantar nada · **`humo` con su build abortaba** (H3e-i-1): arreglado y demostrado con el orden viejo en rojo y el nuevo en verde, en la copia | Hecho, con un arreglo de arnés que la ficha no preveía |
| **1.7** `apu.5` | `apu 360x640` **×3 verde, código 0** · matriz entera **verde, código 0**: REC-2 **18/18**, mesa **7/7**, sin huecos de cobertura. Las 10 lecturas de `apu.5` traen frase y tono | `CTL_APU5_TARDE`: **rojo con el código de hoy, verde con el arreglo**. El hueco real (`CTL_APU5_CLIC`): **rojo con `capas > 1` sola**; con `capas > 1 && tono`, **no se deja engañar 2 de 2**, pero esas celdas salen rojas por cobertura (§1.7.3) | Hecho. **Un matiz para el rector** (pregunta 1) |
| **1.8** E-22 | **6/6 verdes, código 0.** Ningún rojo en T5 1366×768 ni en ninguna celda | — | **Se cierra por D15**, con las 15 bases anotadas (§1.8) |
| **Varas** | vitest **52 archivos · 1 252 verdes** (1 232 + 20 nuevas) · eslint **21** · **un solo build** | — | Una pasada de vitest **falló al cargar** los 52 archivos (H3e-i-3); repetida dos veces, verde |

---

## §1.1 · `scripts/testProtegidos.test.js`

El borrador del Anexo A de la Fase 0, tal cual, más `import { Buffer } from 'node:buffer'`, que eslint pide por `no-undef` (el molde de ARN-3c §6.1). Lee la lista de `Protegidos` §2 y las huellas de §3 del propio documento, y compara blob, `sha256` (16) y líneas de cada protegido con sus bytes.

**Vara:** 8/8 verde (2 de lectura + 6 huellas).

**Controles** (en la copia `ctl`; corredor `controles_fuente.sh`):

| Control | Resultado |
|---|---|
| `seatLayouts.js`: byte 100 + 1, por `Buffer` | **rojo** · `src/config/seatLayouts.js ya no es el de docs/AJILEI_Protegidos_v1.0.md §3. Si la campaña está AUTORIZADA a abrirlo, re-mide su fila en el MISMO commit; si no, es una apertura sin permiso.: expected { blob: 'adc8662821d3', … } to deeply equal { blob: '0d1bb8ea66a8', … }` |
| un 7.º protegido en §2 (`handEvaluator.js`) sin fila en §3 | **rojo** · «§3 tiene exactamente una fila por cada protegido de §2» |
| la cabecera de §3 renombrada (§3 ilegible) | **rojo** · `expected [] to deeply equal [ 'src/config/seatLayouts.js', …(5) ]` |
| restaurados desde el repo (`cmp` idéntico) | **8/8 verde** |

## §1.2 · `scripts/testImportant.test.js`

El borrador del Anexo B, con dos cambios:
- **El recorrido y el quitacomentarios pasan a `scripts/arnes/fuente.mjs`** (nuevo, 45 líneas), porque los usan las tres pruebas de fuente (1.2, 1.3 y 1.4). Lleva 2 pruebas propias, dentro de `testImportant`: un comentario no cuenta y conserva las líneas; una URL no es un comentario.
- **El motivo de la lista blanca** cita las tres fuentes de la excepción: `Sistema_Diseno_v1.2.md:432-433`, `luz.css:195` y el comentario nuevo de `playingCard.css` (D10).

**Vara:** 4/4 verde.

**Controles:**

| Control | Resultado |
|---|---|
| `.apu-control { color: red !important }` al final de `apu.css` | **rojo** · `{ archivo: "src/styles/apu.css", linea: 528, selector: ".apu-control", propiedad: "color" }` |
| `el.style.setProperty("top", "0", "important")` en `cargarMesa.js` | **rojo** · `{ archivo: "src/lib/cargarMesa.js", linea: 124, selector: "(js)" }` |
| se quita `!important` de `border-color` en `.card-selected` | **rojo** · `src/styles/playingCard.css .card-selected { border-color }: expected +0 to be 1` |
| restaurados (`cmp` idéntico) | **4/4 verde** |

## §1.3 · `scripts/testClavesAlmacen.test.js` (D9)

**El censo, antes de escribir la prueba.** Todas las lecturas y escrituras de `localStorage`/`sessionStorage` de `src/` (sin las pruebas), resueltas hasta su constante:

| Clave | Almacén | Constante (definida en) | Accesor | Fuente documental |
|---|---|---|---|---|
| `ajilei.sound` | local | `SOUND_KEY` (`SoundContext.jsx:15`) | `SoundContext.jsx` | `Menu_Utilidades_v1.1` · censo `LOB1_Fase0:302` |
| `ajilei.idioma` | local | `CLAVE_IDIOMA_STORAGE` (`textos.js:40`) | `useIdioma.js` | IDI-0 (`LOB1_Fase0`/`LOB1_Fase1`) |
| `ajilei.nivel` | local | `NIVEL_KEY` (`niveles.js:51`) · `CLAVE_RETO_LEGADO` (`retarCore.js:21`) | `memoriaChips.js` (**solo como legado**: se absorbe y se borra en la primera lectura) | `APU-1_Reglas_v1.0` · `LOB1_Fase0:302` |
| `ajilei.retoConfig` | local | `CLAVE_RETO` (`retarCore.js:20`) | `memoriaChips.js` | `APU-1_Fase1e` |
| `ajilei.consultas` | local | `CONSULTAS_KEY` (`consultas.js:11`) | `useUtilitiesMenu.js` | `Menu_Utilidades_v1.1`–`v1.4` · `LOB1_Fase0:302` |
| `ajilei.tapete` | local | `TAPETE_KEY` (`tapetes.js:87`) | `useTapetes.js` | `Tapetes_v1.0:52-53` (sin nombrar la clave) · `LOB1_Fase0:302` |
| `ajilei.tapetes.comprados` | local | `TAPETES_COMPRADOS_KEY` (`tapetes.js:88`) | `useTapetes.js` | ídem |
| `ajilei.fraseVictoria` | local | `FRASE_KEY` (`frasesVictoria.js:29`) | `sinRepetir.js` | `LOB1_Fase0:302` |
| `ajilei.melodiaCelebracion` | local | `MELODIA_KEY` (`melodiasCelebracion.js:33`) | `sinRepetir.js` | `LOB1_Fase0:302` |
| `ajilei.salaPendiente` | local | `CLAVE_SALA_PENDIENTE` (`salaPendiente.js:37`) | `salaPendiente.js` | `SALA_Fase1` · `SAL-B1_AjusteA3_Fase0` · `SAL-B2_Fase0` |
| `ajilei.salaConfig` | local | `CLAVE_CONFIG_SALA` (`salas.js:170`) | `memoriaChips.js` (vía `salaRecordada.js`) | `APU-1_Fase0` |
| `ajilei.recargaPorChunk` | **session** | `GUARDA_RECARGA` (`main.jsx:40`) | `main.jsx` | `ARN-3d` (D11) |

- **Ninguna clave sin fuente:** las 12 tienen al menos un informe que las nombra. Ninguna lleva el motivo «sin fuente: ARN-3e la censa».
- **Una precisión sobre las fuentes que dio la ficha:** de las tres, solo `LOB1_Fase0:302` nombra claves (siete de las doce). `Tapetes_v1.0:52-53` dice que el tapete vive en `localStorage` sin nombrar la clave. `Victory_Celebration_v1.0:309-311` es la regla contraria («Sin persistencia, deliberado»).
- Las cinco claves posteriores a LOB-1 (`idioma`, `retoConfig`, `salaPendiente`, `salaConfig` y `recargaPorChunk`) solo están en informes de campaña: **ningún documento de doctrina las censa**. El registro de la 3e-ii las recogerá por puntero.
- **Fuera de alcance, dicho en la cabecera de la prueba:** la sesión de Supabase (`sb-…-auth-token`), que escribe la biblioteca y no el código de `src/`.

**La prueba** tiene dos listas: `CLAVES` (las 12, con almacén y fuente) y `ACCESORES` (los 8 módulos que tocan el almacenamiento). Las dos claves que se pasan por parámetro (`memoriaChips`, `sinRepetir`) se cubren porque toda clave `ajilei.*` del código tiene que estar en el censo. Rojo en cinco casos:
- una clave `ajilei.*` fuera del censo;
- un archivo que toca `localStorage`/`sessionStorage` y no es accesor;
- una clave del censo que ya no aparece en el código;
- un accesor que ya no toca el almacenamiento;
- `sessionStorage` fuera de `main.jsx`.

**Vara:** 5/5 verde.

**Controles:**

| Control | Resultado |
|---|---|
| `export const CONTROL_KEY = 'ajilei.control'` en `tapetes.js` | **rojo** · `{ archivo: "src/config/tapetes.js", clave: "ajilei.control", linea: 111 }` |
| `window.localStorage.getItem(NIVEL_KEY)` en `niveles.js` (un archivo que no es accesor) | **rojo** · `{ archivo: "src/config/niveles.js", linea: 79 }` |
| `CLAVE_CONFIG_SALA = ['ajilei', 'salaConfig'].join('.')`: la entrada del censo deja de existir como literal | **rojo** · `ajilei.salaConfig: expected false to be true` |
| restaurados (`cmp` idéntico) | **5/5 verde** |

## §1.4 · `scripts/testAvisosPruebas.test.js` (D9, INV-38)

Recorre los `*.test.js(x)` de `scripts/` y `src/` (las dos carpetas de `npm test`; hoy son 52), quita los comentarios y busca el `warn` de la consola. El patrón se escribe en dos piezas, para que la prueba no se encuentre a sí misma.

**Vara:** 2/2 verde. Hoy el único archivo que nombra ese `warn` es `testBancoBandas.test.js:169`, y lo hace en un comentario («`process.stderr` y no `console.warn`»).

**Controles:**

| Control | Resultado |
|---|---|
| `console.warn('aviso de control')` al final de `testPrecargas.test.js` | **rojo** · `{ archivo: "scripts/testPrecargas.test.js", linea: 45 }` |
| lo mismo, pero en un comentario | **verde** (no cuenta) |
| restaurado | **2/2 verde** |

## §1.5 · El comentario de `playingCard.css` (D10)

**El comentario** (6 líneas, encima de `.card-selected`; la regla no cambia):

```css
/* Los tres `!important` de la carta seleccionada son las ÚNICAS excepciones del
   CSS aditivo del proyecto (`AJILEI_Sistema_Diseno_v1.2.md:432-433`). La
   seleccionada tiene que ganar a TODO estado de la carta —el hover de arriba, la
   luz de LUZ-1 (`luz.css:195`), las hojas de campaña—: sube, se ribetea de oro y
   lleva su halo, sin sombra de contacto. Los vigila la lista blanca de
   `scripts/testImportant.test.js`; un cuarto `!important` sale rojo. */
```

**La prueba del `dist/` idéntico, en la copia:**

| Build | `playingCard.css` | Resultado |
|---|---|---|
| `dist-sin` | el de HEAD (blob `8edf5e28a73e`, 103 líneas) | — |
| `dist-con` | el del árbol de trabajo (blob `c9dfc5511e01`, 109 líneas) | **`diff -rq dist-sin dist-con`: sin diferencias.** 116 archivos y el mismo manifiesto `sha256` |

- **Que la regla de verdad está en el CSS medido:** `dist-con/assets/GameTable-kEFbh333.css` lleva `.card-selected{border-color:var(--gold-brand)!important;box-shadow:0 14px 26px rgba(var(--gold-brand-rgb), .6)!important;transform:translateY(-18px)!important}`, y el texto del comentario aparece 0 veces.
- **Una corroboración que salió sola:** el `dist/` del **repo**, compilado a las 05:57 con el comentario ya puesto, tiene el mismo nombre con hash: `GameTable-kEFbh333.css`.
- **No hizo falta parar.**

## §1.6 · `humo` (D12)

**Los cambios** (`scripts/diagDSK.mjs`, `scripts/arnes/nucleo.mjs` y `scripts/arnes/nucleo.test.js`). Son los 9 sitios de la Fase 0 §D1, más uno que la ficha no preveía (H3e-i-1):

| Sitio | Cambio |
|---|---|
| cabecera de uso (`diagDSK.mjs:14-16`) | `humo → d1d2 + d3 + bug + shots + gate + lob + retar (~4 min)`, es el modo por defecto, y por qué se retiró `all` |
| comentario de D7 (`:373`) | `humo` corre `lob` y levanta el preview |
| `MODE` (`:407`) | por defecto `'humo'` |
| `all` (`:408-411`) | **código 2** con el mensaje de D12, **antes** de la comprobación de modos y antes de levantar nada |
| arranque de servidores (`:14076-14090`) | **H3e-i-1:** con `humo`, el preview (y su build) se levanta **antes** que el dev |
| etiqueta del servidor en el JSON (`:14112`) | `humo` |
| el despacho (`:14117-14133`) | `d1d2`, `d3`, `bug`, `shots`, `gate`, `lob` y `retar` con `humo`. **`gate` entra**, y con `humo` su etiqueta de capturas es `after`. **`apu` solo por su nombre** |
| comentario de LOB-1 (`:14127`) | «entra en `humo` (antes `all`)» |
| `MODOS_DSK` (`nucleo.mjs:196`) | `'humo'` en lugar de `'all'` |
| `nucleo.test.js:119-125` | «todos los modos válidos (menos `humo`, que es un paquete) tienen lector», y una prueba nueva: `humo` está y `all` no |

**H3e-i-1 · `humo` con su build abortaba: hallazgo y arreglo.** La primera corrida (05:57, la del único build) salió con **código 2**: `page.waitForSelector … main.lobby [data-accion="jugar-ia"]`, timeout de 30 s en `runD1D2`, con `0 a Supabase contestadas`. La app no llegó ni a su llamada de arranque.
- **Aislado en tres pasos:**
  1. `d1d2` solo (dev, sin preview) → **verde**, código 0.
  2. `humo --sin-build` (dev + preview, sin compilar) → **verde**, código 0, 4 min 15 s.
  3. El fallo es **el build dentro del mismo proceso, después de crear el servidor de desarrollo**.
- **Desde 3c-i, `all` hacía exactamente eso** (dev, y después preview con build) y **nunca se corrió**: en ninguna tabla de ARN-3c ni de ARN-3d aparece una corrida de `all`. El fallo era latente.
- **Mecanismo probable, no demostrado:** el dev recién creado prepara sus dependencias en segundo plano mientras el build pone `NODE_ENV=production` en el proceso.
- **El arreglo es de orden, no de mecanismo.** `humo` levanta primero el preview con su build y después el dev. Es el orden de `diagPUE voz2` (preview y luego dev), que ARN-3a dejó sano con `conNodeEnvPropio` (A-6).
- **Control, en la copia y con build en las dos:**

| Orden | Resultado |
|---|---|
| **viejo** (dev → build → preview) | **código 2**, el mismo `waitForSelector` a los 30 s, `0 a Supabase contestadas`: **reproducido** |
| **nuevo** (build → preview → dev) | **verde, código 0**, 2 min 44 s con el build: `gate`, `lob` (6/6) y `retar` (6/6) verdes; `d1d2`, `d3`, `bug` y `shots` informativos; 32 contextos, 0 escapadas |

**Vara en el repo** (`humo --sin-build`, sobre el único build, con el orden nuevo): **verde, código 0**, de 06:37:15 a 06:39:59 (**2 min 44 s**).

**Control de `all`** (en el repo, sin servidor):

```
✖ ERROR DE INSTRUMENTO (código 2): `all` se retiró en ARN-3e: usa `humo`, y `apu` por su nombre
codigo real 2
```

1 s, y nada escuchando en los puertos pedidos.

## §1.7 · `apu.5` (Fase 0 §D2)

### 1.7.1 · El cambio

- **`jugarHasta`** (`diagDSK.mjs:1688`) devuelve **el valor** de la condición, no `true`, en sus tres puntos de lectura. Los demás llamadores (`:1719`, `:2176`, `:2480` y `:2777`) solo miran si es verdadero, y sus condiciones devuelven booleanos.
- **`apu.5`** (`:2904-2917`): la condición lee capas, frase y tono **en la misma evaluación** y solo se cumple con `capas > 1 && tono`; devuelve la foto. `huboCapas` y los campos del JSON no cambian de forma. El juicio de `apu.5` no se tocó.

### 1.7.2 · La vara

| Corrida | Resultado | `apu.5` leído |
|---|---|---|
| `apu360_1` | **verde, código 0** | capas 3 · `pierde` · «IA 3 gana con Espadas, 41 pts.» |
| `apu360_2` | **verde, código 0** | capas 3 · `gana` · «¡Ganas con Copas, 40 pts! El pozo se partió: IA 1 se lleva 200.» |
| `apu360_3` | **verde, código 0** | capas 3 · `gana` · «Empate, 30 pts. Ganas por ser la Mano.» |
| **matriz entera** (06:09–06:47, con otros 5 arneses) | **verde, código 0** · REC-2 **18/18** · mesa **7/7** · **sin un solo punto sin cobertura** · 25 contextos, 0 escapadas | las 7 vistas con capas 3, tono y frase. Por ejemplo, 1366×768: «¡Ganas con Bastos, 27 pts! El pozo se partió: IA 1 se lleva 200. IA 2 se lleva 300.» |

Es la primera matriz de `apu` de la serie que sale con **código 0**. ARN-3c dio mesa 6/7 y código 1; ARN-3d, código 1 por cobertura.

### 1.7.3 · Los controles

Seis variantes en la copia. Todas en `apu 360x640`, con la línea de tiempo del mensaje (`data-capas | data-tono | texto`) leída en la página.

| # | Camino | Qué se le hace | Esperado | Resultado |
|---|---|---|---|---|
| **c1** | **el de hoy** (`capas > 1` y la frase en una evaluación posterior) | `CTL_APU5_TARDE`: tras cumplirse la condición, pulsar «Siguiente mano» y esperar 50 ms | rojo | **rojo:** `{ capas: 3, texto: "", tono: "" }` · `FALLA … apu.5` |
| **c2** | **el arreglo** | `CTL_APU5_TARDE` | verde | **verde, código 0:** `{ capas: 3, texto: "¡Ganas con Copas, 31 pts! El pozo se partió: IA 2 se lleva 500.", tono: "gana" }` |
| **c6** | una evaluación, pero `capas > 1` **sin tono** | `CTL_APU5_CLIC`: **el hueco real**; la página pulsa «Siguiente mano» en cuanto sale el pozo partido | rojo | **rojo:** `{ capas: 3, texto: "", tono: "" }`. Línea de tiempo: `t+0 · 3\|gana\|¡Ganas con Bastos…` → `t+17 · 3\|\|` |
| **c7** ×2 | **el arreglo** | `CTL_APU5_CLIC` | verde | **no se dejó engañar en las dos:** nunca tomó el hueco por un pago. Pero **las dos celdas salen rojas por cobertura**: el molde no volvió a partir el pozo en las 12 manos (`huboCapas: false`), y `apu.5` no tiene estado «sin cobertura» (ver abajo) |
| c5 ×2 | **el arreglo**, sin tocar nada | `CTL_APU5_LINEA`: solo la línea de tiempo | verde | **verde, código 0, las dos.** La condición se cumple en `t+0`, con frase y tono |

**Lo que el hueco real enseña** (c6 y c7, la línea de tiempo leída por atributos):
- el resultado con capas sale en `t+0`;
- al pulsar «Siguiente mano», la mesa deja el `<p>` en **`capas 3`, sin tono y sin frase** a los ~17 ms;
- el `<p>` se desmonta hacia los +1,33 s, y «Repartiendo…» llega a los +5,1 s.

Es el hueco de ARN-3c §14.2, medido. Dura ~1,3 s, no 300 ms como se suponía, y es justo lo que una condición `capas > 1` sola acepta como si fuera un pago.

**Por qué c7 no da su verde.** El control gasta en el hueco el **único** pozo partido que el molde dio en esas manos, así que la condición correcta no tiene otro que leer y sale `huboCapas: false`. Con ese hueco, el código de hoy (c1) o la condición a medias (c6) leen «capas 3 sin frase» y salen rojos. El arreglo no lee nada falso. Su mitad «sí lee el pago de verdad» la demuestran c2, c5 y las 10 lecturas de la vara. La mitad «no se traga el hueco», c7.

**Los controles que se descartaron, por instrumento** (se dejan escritos para que nadie los repita):
1. **Vaciar los nodos de texto del `<p>` y quitar `data-tono` durante 1 500 ms:** cubría la vida entera del mensaje. React lleva esos nodos, y al devolverlos la frase no volvía (c4 `h3`/`h4`: tono restaurado y texto vacío).
2. **Tapar `textContent` y `dataset` con propiedades propias del elemento, 600 ms:** primero sin escritor (React escribe `textContent` en ese `<p>`: `pageerror: Cannot set property textContent … which has only a getter`) y después con él. Con la tapa puesta, el bucle no veía el pago, **pulsaba «Siguiente mano» él mismo y provocaba el hueco real**. Eso llevó a c6/c7: provocar el hueco de verdad en vez de imitarlo.

**El matiz que queda (pregunta 1).** Un `apu.5` sin pozo partido sale **rojo**, no «sin cobertura». Era así antes de esta tanda: el juicio exige `huboCapas` desde APU-1 1e. ARN-3b D4 dio `cobertura` a `apu.2`, `apu.7`, `tel.boton4` y `tel.linea`, pero no a `apu.5`. En la vara de hoy no pasó (10/10 con capas). En c7 pasó por culpa del control.

## §1.8 · E-22 (D15)

**6 corridas** de `diagDSK msg --semilla=azar --sin-build`, sobre el único build, de 06:09 a 06:48. En el mismo hueco que la matriz de `apu`, y como mucho 6 arneses a la vez.

| # | Base | Resultado | T5 1366×768 (las manos de P2) |
|---|---|---|---|
| 1 | 531546261 | **VERDE**, código 0: compositor 92 · jugado 7/7 · fin 1/1 · Δ larga 7/7 · caza 2/2 · barrido OK (10 cajas) | «Empate, 31 pts. Gana IA 1 por ser el más cercano a la Mano.» · «IA 3 gana con Bastos, 41 pts.» |
| 2 | 1064097484 | **VERDE**, código 0 (12 cajas) | «IA 1 gana con Espadas, 31 pts.» · «IA 4 gana con Espadas, 41 pts.» |
| 3 | 906666771 | **VERDE**, código 0 (8 cajas) | «IA 1 gana con Espadas, 31 pts.» · «IA 4 gana con Espadas, 37 pts.» |
| 4 | 372832977 | **VERDE**, código 0 (12 cajas) | «IA 3 gana con Copas, 31 pts.» · «IA 2 gana con Bastos, 51 pts.» · «IA 1 gana con Oros, 37 pts.» |
| 5 | 125239192 | **VERDE**, código 0 (11 cajas) | «IA 4 gana con Espadas, 40 pts.» · «IA 3 gana con Espadas, 42 pts.» · «IA 1 gana con Bastos, 37 pts.» |
| 6 | 488996419 | **VERDE**, código 0 (12 cajas) | «IA 3 gana con Copas, 48 pts.» · «IA 2 gana con Bastos, 49 pts.» · «IA 4 gana con Bastos, 41 pts.» |

**Veredicto: E-22 se cierra por D15,** como «no reproducible en el terreno de hoy (bundle real, sesión simulada, sin red)». A la frecuencia histórica de 1 de cada 4, no verlo en 15 corridas tiene una probabilidad de 0,75¹⁵ ≈ 1,3 %.

**Las 15 corridas**, para repetirlas con `--semilla=N`:

| Tanda | Corridas | Bases |
|---|---|---|
| ARN-3c-i §4 | 2 · la vara | 1 (semillas 1–15), dos veces |
| ARN-3c-i §4 | 1 · exploración | 284683227 |
| ARN-3c-ii §16 | 6 | 257096588 · 280902192 · 52792308 · 621437613 · 293213138 · 46787976 |
| **ARN-3e-i** | 6 | **531546261 · 1064097484 · 906666771 · 372832977 · 125239192 · 488996419** |

Si vuelve, se clasifica con su base. Su dueño de origen es «quien toque la coreografía de eliminación» (`APU-1_Informe_Cierre:96`).

---

## STOP-1 · Comprobaciones

**vitest:** **52 archivos, 1 252 pruebas, verdes** (07:26, dos pasadas seguidas). Antes eran 48 y 1 232.

| Archivo | Pruebas |
|---|---|
| `testProtegidos` | 8 |
| `testImportant` | 4 |
| `testClavesAlmacen` | 5 |
| `testAvisosPruebas` | 2 |
| `nucleo.test.js` | +1 |

**H3e-i-3: una pasada anterior falló al cargar los 52 archivos** («no tests»). Fue a las 07:25:49, con **ningún arnés vivo** (`Get-CimInstance`: 0 `node`), 16 s después de que se cerraran los servidores de desarrollo de la copia, que comparten `node_modules` por la unión. No se guardó el texto del error. Repetida dos veces: verde. Es H3b-ii-3 otra vez, ahora sin arneses en paralelo ni build.

**eslint:** **21 problemas** (20 errores y 1 aviso), la línea base. Una pasada intermedia dio 23 por `Buffer` sin declarar en `testProtegidos`; se importa de `node:buffer`.

**build:** **uno solo en el repo**, el de la primera corrida de `humo` (05:57). Todo lo demás corrió con `--sin-build` o en dev. La copia compiló cuatro veces, siempre dentro de su carpeta: `dist-sin` y `dist-con` (D10), y el `dist/` de los dos `humo` de control.

**Archivos tocados** (`git diff --stat`: 4 modificados, +64 / −29; 5 nuevos):

```
 M scripts/arnes/nucleo.mjs
 M scripts/arnes/nucleo.test.js
 M scripts/diagDSK.mjs
 M src/styles/playingCard.css
?? scripts/arnes/fuente.mjs
?? scripts/testAvisosPruebas.test.js
?? scripts/testClavesAlmacen.test.js
?? scripts/testImportant.test.js
?? scripts/testProtegidos.test.js
```

**Fin de línea:**

```
i/lf    w/lf    attr/text=auto eol=lf 	scripts/arnes/nucleo.mjs
i/lf    w/lf    attr/text=auto eol=lf 	scripts/arnes/nucleo.test.js
i/lf    w/lf    attr/text=auto eol=lf 	scripts/diagDSK.mjs
i/lf    w/lf    attr/text=auto eol=lf 	src/styles/playingCard.css
```

Los 5 nuevos y este informe: **0 bytes CR** (comprobado byte a byte con Python). Un `grep -c $'\r'` dentro de una sustitución de órdenes había dado cifras falsas; la vara buena es Python.

**Protegidos:** ninguno abierto. `testProtegidos` e `testImportant` leen sus bytes desde fuera (D2). El único control que cambió un protegido fue sobre el `seatLayouts.js` **de la copia**, por `Buffer`, y se restauró (`cmp` idéntico).

**Terreno al parar (07:26):**
- **`netstat`** en 4170–5599: solo `0.0.0.0:5040`, pid 7724 (el `svchost` de siempre). Ningún puerto de la tanda escuchando.
- **`node` vivos: ninguno.**
- **La copia `ctl`:** su unión a `node_modules` **se quitó con `rmdir`** (`cmd /c rmdir`; ya no existe). La carpeta sigue en el scratchpad, sin enlace al repo: el borrado recursivo está denegado en esta sesión (ya lo estaba en la Fase 0) y no se reintentó. Allí quedan los logs (`logs/`), los corredores (`cola.sh`, `controles_fuente.sh` y `controles_apu5.sh`) y el parche (`parche_apu5.py`).
- **`node_modules` del repo, intacto:** 150 entradas, vite 8.0.14, playwright-core 1.62.1.
- **Ningún `_*.mjs` en el repo.**

**`git status --porcelain`:**

```
 M scripts/arnes/nucleo.mjs
 M scripts/arnes/nucleo.test.js
 M scripts/diagDSK.mjs
 M src/styles/playingCard.css
?? docs/reportes/AJILEI_ARN-3e_Fase0_Informe_v1.0.md
?? docs/reportes/AJILEI_ARN-3e_Informe_v1.0.md
?? docs/reportes/AJILEI_MOT-1_Fase0_Informe_v1.0.md
?? docs/reportes/AJILEI_MOT-1_Fase1-0_Sonda_Informe_v1.0.md
?? laminas/mon1/_entorno.txt
?? laminas/mon1/lamina.html
?? laminas/mon1/tiempos.json
?? scripts/arnes/fuente.mjs
?? scripts/testAvisosPruebas.test.js
?? scripts/testClavesAlmacen.test.js
?? scripts/testImportant.test.js
?? scripts/testProtegidos.test.js
```

## Mapa provisional archivo → commit (lo de 3e-i)

| # | Commit | Archivos |
|---|---|---|
| 1 | `ARN-3e-1: pruebas — huellas de los protegidos, !important, claves de almacenamiento y avisos de las pruebas` | `scripts/arnes/fuente.mjs` · `scripts/testProtegidos.test.js` · `scripts/testImportant.test.js` · `scripts/testClavesAlmacen.test.js` · `scripts/testAvisosPruebas.test.js` · `src/styles/playingCard.css` (el comentario de D10, que la lista blanca cita) |
| 2 | `ARN-3e-2: arnés — humo en lugar de all (preview antes que dev), apu.5 en una sola lectura` | `scripts/diagDSK.mjs` · `scripts/arnes/nucleo.mjs` · `scripts/arnes/nucleo.test.js` |
| 3–4 | los de la 3e-ii (doctrina; informes y cierre de ARN-3) | — |

El commit 1 queda verde por sí solo: las cuatro pruebas leen lo que ya existe en `main`.

## Hallazgos nuevos (se reportan; el 1 se arregló porque es del terreno de esta tanda)

| # | Hallazgo |
|---|---|
| **H3e-i-1** | **El build dentro del proceso, después del servidor de desarrollo, deja el dev inservible.** `all` lo hacía desde 3c-i y nunca se corrió. **Arreglado** en `humo` por orden (preview y build primero), con control en copia: el orden viejo da 2 y el nuevo da 0. **La regla general** (ningún arnés debe compilar después de crear un dev en el mismo proceso) es para el registro y para `servidorArnes`: hoy solo `humo` mezcla dev con preview en `diagDSK`, y `diagPUE voz2` ya va en el orden bueno |
| **H3e-i-2** | **El hueco de `apu.5`, medido:** al pulsar «Siguiente mano», el `<p>` queda en `capas 3`, sin tono y sin frase, desde los ~17 ms hasta su desmontaje a ~1,3 s. ARN-3c lo suponía de 300 ms. Y **sin pulsar nada**, el pago con frase vive mientras el bucle no pulse: la «ventana corta» de las primeras sondas era el propio bucle reaccionando a la tapa |
| **H3e-i-3** | **vitest volvió a fallar al cargar los 52 archivos** sin arneses vivos (H3b-ii-3). Se repitió verde dos veces. Causa sin investigar. Candidata: la caché de Vite en `node_modules/.vite`, compartida por la unión con los servidores de la copia que acababan de cerrarse |
| **H3e-i-4** | **Un control que imita un estado del producto puede crear otro.** Las dos imitaciones del hueco fallaron por instrumento: React lleva sus nodos de texto y escribe `textContent`; y una tapa que oculta el pago hace que el bucle avance. El control bueno **provoca** el estado real. Es una lección para el registro (reglas de trabajo del arnés) |

## Preguntas al rector

1. **`apu.5` sin pozo partido:** ¿pasa a `cobertura` (ARN-3b D4, con hasta 3 intentos como `apu.2`), o se queda rojo, como desde APU-1 1e? Hoy la vara no lo ha tocado (10/10 con capas), pero c7 enseña que es posible.
2. **H3e-i-1 en general:** ¿se escribe en el registro solo como regla de trabajo («nunca compilar después de crear un dev en el mismo proceso»), o se blinda además en `servidorArnes` (error de instrumento si se pide un build con un dev ya vivo)? Lo segundo es pequeño y tiene su control en esta misma tanda.
3. **El censo de claves** queda en la prueba, con su fuente por clave. ¿El registro de la 3e-ii las lleva también como tabla, o apunta a la prueba (D3)?

**Parada en el STOP-1. Espera la revisión del rector.**

---

# Parte 3e-ii · Documentos y cierre de ARN-3

**Ficha:** `AJILEI_ARN-3e-ii_v1.0.md` (D16–D20, más D1–D15 de la ficha madre).
**Fecha:** 2026-10-03, de 07:49 a 08:32 (43 min; tope 120).
**Sin commits y sin `git add`.** Se trabajó **encima del árbol de la 3e-i**, sin descartar nada.
**`src/`:** no se tocó. Ningún protegido se abrió.

**Dónde se midió:**
- **El repo:** `apu 360x640` ×2, `humo --sin-build` y `diagPUE voz2`, en puertos propios (4196–4199, 5196–5199).
  - **El único build de la tanda** lo hizo `diagPUE voz2`, a las 07:54, con ningún otro arnés sirviendo `dist/`.
  - El 4173 y el 5173 no se tocaron.
- **Una copia de controles nueva**, `scratchpad/arn3e-ii/ctl`:
  - `git archive HEAD`, más los archivos tocados del árbol de trabajo (`cmp` idénticos), su `.env.local` y una unión a `node_modules`;
  - lleva `parche_3eii.py`, con los controles encendidos por variables que solo existen allí (`CTL_*`, `VITE_CTL_APU5`);
  - **cada corrida usó su propia caché de Vite** (`CTL_CACHE`, un `cacheDir` que solo existe en la copia), para no escribir la del repo a través de la unión (la sospecha de H3e-i-3).
- **Paralelismo:** como mucho 6 arneses a la vez, con una cola (`scratchpad/arn3e-ii/cola.sh`).

## Resumen 3e-ii

| Pieza | Vara | Control | Estado |
|---|---|---|---|
| **§1.1** `apu.5` con `cobertura` (D16) | `apu 360x640` **×2 en el repo, verde, código 0**: las dos con pozo partido en la 1.ª mesa, frase y tono | sin pozo partido → **`cobertura`** (×4) · pozo partido **sin tono → rojo** · **sin frase → rojo** | Hecho. **Un hallazgo:** H3e-ii-1 (`apu.6`) |
| **§1.2** El blindaje de H3e-i-1 (D17) | `nucleo.test.js` **+4** · `humo --sin-build` en el repo **verde, código 0** · `diagPUE voz2` (preview y dev, con build) **222/222, código 0** | `humo` con el orden viejo → **código 2 en 1 s, con el motivo** · el orden nuevo con build → **verde, código 0** | Hecho |
| **§2** El registro | `docs/AJILEI_Invariantes_v1.0.md`: **44 filas** (37 vigiladas, 7 solo doctrina) y 8 punteros a normativos | — | Hecho |
| **§3** `testInvariantes.test.js` (D7) | **56/56 verde** | vigilante a una prueba inexistente · modo inexistente · cabecera renombrada → **rojo los tres**; restaurado → verde | Hecho |
| **§4** La doctrina (D11, D19) | `testProtegidos` **8/8** tras editar Protegidos | — | Hecho: Protegidos v1.6, `Sistema_Diseno` (`:13`, `:433` y §13 de los óvalos) y los cinco punteros |
| **§5** El cierre de ARN-3 | `docs/reportes/AJILEI_ARN-3_Cierre_v1.0.md` | — | Hecho |
| **Varas** | vitest **53 archivos · 1 312 verdes** · eslint **21** · `humo` verde · `testProtegidos` 8/8 · **un solo build** | — | Una pasada de vitest **volvió a fallar al cargar** (H3e-i-3, otra vez); repetida, verde |

**iOS: nada que validar (ARN-3e no toca lo que se ve).** (D20, INV-41.)

---

## §3e-ii.1 · `apu.5` con `cobertura` (D16)

### 1.1.1 · El cambio (`scripts/diagDSK.mjs`, el bloque de `apu.5`)

- **Hasta 3 mesas.** Cada intento abre `?apu=capas`, recorre la ruta y juega hasta 12 manos, como `apu.2`. Si en las 3 el pozo no se parte:
  - `apu.5` queda con `estado: 'sinCobertura'` y `ok: null`;
  - la celda anota «apu.5 (el pozo no se partió en 3 mesas)»;
  - el modo sale `cobertura` (código 1), no rojo.
- **La condición de lectura** se toma en una sola evaluación, como en la 3e-i, pero ahora es `capas > 1 && (tono || «Siguiente mano» a la vista)`.
  - Con `capas > 1 && tono`, la de la 3e-i, un pago **sin tono** no se leía nunca: habría salido `cobertura` en lugar de rojo. D16 pide que siga rojo.
  - El botón «Siguiente mano» solo existe en el pago, y **se desmonta en el mismo render que vacía la frase y el tono** (`GameTable.jsx:2447-2448`: `setIsClearing(true)` y `message: ''` en el mismo manejador). Así el hueco de H3e-i-2 no cumple ninguna de las dos señales.
- **El juicio exige ahora también el tono** (`capas.tono.length > 0`). El resto no cambia.

### 1.1.2 · Los controles (copia, `apu 360x640`)

**Todos provocan el estado real** (H3e-i-4). Los dos rojos cambian el producto **de la copia** tras `VITE_CTL_APU5`, que Vite pasa a `import.meta.env`.

| Control | Qué hace | Esperado | Resultado |
|---|---|---|---|
| **gasta** (`CTL_APU5_GASTA`) | un observador en la página pulsa «Siguiente mano» en cada pago con pozo partido, antes de que el arnés pueda leerlo | `cobertura`, no rojo | **`apu.5` sin cobertura en las 4 corridas:** «el pozo no se partió en 3 mesas», con 4, 5, 5 y 4 pozos partidos gastados (1–3 por mesa) y `leído: false` en cada mesa. Tres corridas salen con la celda OK y código 1 por cobertura. **La primera sale con la celda roja por `apu.6`:** es H3e-ii-1 (abajo) |
| **tono** (`VITE_CTL_APU5=tono`) | la copia pinta el pozo partido **sin `data-tono`** | rojo | **rojo**, código 1: `{ capas: 3, texto: "IA 3 gana con Espadas, 27 pts. El pozo se partió: IA 1 se lleva 200.", tono: "" }`. El pago se leyó por el botón |
| **frase** (`VITE_CTL_APU5=frase`) | la copia pinta el pozo partido **sin frase** | rojo | **rojo**, código 1: `{ capas: 3, texto: "", tono: "pierde" }` |

**Lo que dicen juntos:**
- La señal del botón lee el pago de verdad. En el control del tono, la frase llega entera y solo falta el tono; en el de la frase, al revés.
- `gasta` demuestra que el hueco no se cuela por esa señal. Tras cada pulsación, el `<p>` sigue en `capas 3`, sin tono y sin botón, durante ~1,3 s. El arnés no leyó nada en 12 mesas.

### 1.1.3 · La vara (repo)

| Corrida | Resultado | `apu.5` |
|---|---|---|
| `apu 360x640` #1 (07:54–07:59) | **verde, código 0** | 1.ª mesa: «¡Ganas con Oros, 20 pts! El pozo se partió: IA 2 se lleva 500.» · `gana` |
| `apu 360x640` #2 (07:57–08:01) | **verde, código 0** | 1.ª mesa: «Empate, 30 pts. Gana IA 3 por ser el más cercano a la Mano. El pozo se partió: IA 1 se lleva 200. IA 2 se lleva 300.» · `pierde` |

### 1.1.4 · H3e-ii-1 · `apu.6` nunca había medido un botón

- **Qué pasó.** En la primera corrida de `gasta`, `apu.6` salió rojo: `botonMin: 28`, con un piso de 36. Dos repeticiones salieron con `apu.6` verde. Su lectura: 0 botones (la mesa estaba repartiendo o descartando).
- **Por qué.** `apu.6` mide `.action-buttons .btn` justo después de `apu.5`. Hasta hoy, eso era siempre **el pago**, donde la fila de acciones no existe.
  - Las 10 lecturas de la 3e-i (la matriz y 360×640 ×3) y las 2 de hoy dan `botonMin: null`: su piso de 36 px **no ha medido un botón** en ninguna corrida reciente.
  - Con D16, cuando el pozo no se parte, la mesa queda donde la dejaron las 12 manos. Si es el turno del humano, `apu.6` mide la fila de apuestas.
- **La sonda** (`CTL_APU6_TURNO`, en la copia: espera a la fila de acciones antes de anotarla):

  ```
  {"msg":"A las 3 — Tú abre.","botones":[{"t":"Pasar","alto":28,"tr":"none"},{"t":"Apostar 50","alto":28,"tr":"none"},{"t":"Retirarse","alto":28,"tr":"none"}]}
  ```

  En 360×640 vertical, **la fila de apuestas mide 28 px**, los tres botones, sin animación ni transform.
- **No es nuevo en el producto.** `apu.2` lo anota en cada corrida («All-in (25)», `alto: 28`). Pero solo exige que el botón sea igual que sus hermanos, no un piso.
- **No se arregla aquí:** D1 cierra `src/`, y cambiar el juicio de `apu.6` es decisión del rector (pregunta 1).

---

## §3e-ii.2 · El blindaje de H3e-i-1 (D17)

**El cambio:**
- **`scripts/arnes/nucleo.mjs`:** `decidirBuild(devsVivos)`, pura. Sin servidores de desarrollo, `{ ok: true }`. Con alguno, `{ ok: false, motivo }`, con los puertos, la causa y el orden sano.
- **`scripts/arnes/comun.mjs`:** `servidorArnes` anota en `DEVS_VIVOS` el puerto de cada dev que crea. Antes de compilar, consulta `decidirBuild`, y si no puede, lanza `ErrorInstrumento` (código 2).
  - **Ningún orden sano cambia:** `humo` y `diagPUE voz2` ya levantan el preview antes; `luz`/`rev`, `diagCEL0` y `diagSAL` no compilan.
- **`scripts/arnes/nucleo.test.js`, +4 pruebas:**
  - sin dev se puede compilar;
  - con uno, no, y el motivo nombra el puerto, la causa, el orden y `--sin-build`;
  - con dos, nombra los dos;
  - `servidorArnes` consulta la decisión antes de `vite.build` y el dev se anota (lectura de la fuente).

**Los controles (copia):**

| Control | Resultado |
|---|---|
| `humo` con el orden viejo (`CTL_HUMO_VIEJO`: dev en 5194 y después preview con build) | **código 2 en 1 s** (07:54:29 → 07:54:30), sin compilar: `✖ ERROR DE INSTRUMENTO (código 2): H3e-i-1 · se pidió un build con un servidor de desarrollo ya vivo en este proceso (:5194). Compilar después de crear el dev lo deja inservible: la app no llega al lobby. Levanta el preview (y su build) ANTES que el dev, o usa --sin-build.` En la 3e-i, ese mismo orden moría por un timeout de 30 s en el lobby |
| `humo` con el orden nuevo, con build | **verde, código 0** en 2 min 40 s (`gate`, `lob` y `retar` verdes) |

**La regresión (repo):**

| Corrida | Resultado |
|---|---|
| `humo --sin-build` (08:03–08:06) | **verde, código 0**, 2 min 41 s: `lob` 6/6, `retar` 6/6 y `gate` verdes, el resto informativos, 0 escapadas |
| `diagPUE voz2`, con su build (07:54–08:03) | **222 mediciones, 0 en rojo, código 0.** Es el orden sano (preview con build y después dev) con el blindaje puesto: el build se pidió antes que el dev y pasó. 40 contextos, 0 escapadas |

---

## §3e-ii.3 · El registro: `docs/AJILEI_Invariantes_v1.0.md`

**Estructura (ficha §2):**
1. Para qué es y cómo se lee. La forma de las columnas es la que exige `testInvariantes`: lo que va entre comillas de código se comprueba.
2. La tabla: **44 filas**. Por etiqueta, 37 vigiladas (5 parciales y 1 con límite declarado) y 7 solo doctrina.
3. «Cómo se trabaja con el arnés»: las cinco líneas de ARN-3a §3, las reglas de trabajo de la Fase 0 §A4 y las lecciones nuevas (la lista de la ficha §2.3).
4. Los normativos y sus vigilantes: **8 punteros**. Son los seis de la ficha (APU-1 Reglas, Menú, Tapetes, Celebración, Modos y Mensajes de resultado) más Protegidos y Reglas de la mano congeladas, que ya tenían su fila.
5. Cómo se mantiene.

**Qué cambió respecto a la Fase 0 §A2:**
- **INV-01, INV-03, INV-12 e INV-38 pasan a vigiladas**, por `testProtegidos`, `testImportant`, `testClavesAlmacen` y `testAvisosPruebas`.
- **INV-12 apunta al censo** de `testClavesAlmacen`, y no lo copia (D18).
- **INV-04** lleva el alcance de D19 y apunta a `Sistema_Diseno` §13. El hueco móvil queda escrito como aceptado (D8).
- **INV-17** suma `apu.5` (D16). Es la fila de la regla «el caso no se dio no es rojo».
- **Dos filas nuevas:**
  - **INV-43:** nunca compilar después de crear un dev en el mismo proceso. La vigilan `decidirBuild` y `servidorArnes`.
  - **INV-44:** `humo` por defecto, `all` retirado y `apu` por su nombre. La vigila `nucleo.test.js`.
- **INV-20** deja de ser «doctrina por escribir»: la regla escrita en `docs/` es su propia fila. Quedan por escribir **06 y 07**.
- **INV-37** anota que el árbol de trabajo puede quedar en CRLF (H3e-ii-3).
- **Las fuentes de INV-05, 08 y 09 citan una línea o un documento**, no listas de líneas: `testInvariantes` comprueba el documento, no la línea.

## §3e-ii.4 · `scripts/testInvariantes.test.js` (D7)

**Qué lee:** las dos tablas del registro, **desde el Markdown**. Encuentra cada una por su cabecera exacta y las filas que le siguen.

**Qué comprueba:**
- **Los modos, en la lista de su arnés:**
  - `MODOS_DSK`, importado del núcleo puro;
  - `MODOS_PUE`, leído de `diagPUE.mjs`;
  - las guardas de «modo desconocido» de `diagCEL0.mjs` y `diagSAL.mjs`;
  - las cuatro listas deben leerse no vacías.
- **Los archivos de prueba y las rutas** existen, con `:línea` opcional.
- **Los documentos `AJILEI_*.md`** existen en `docs/` o en `docs/reportes/`.
- **Una forma no reconocida entre comillas de código** es roja: obliga a escribir las puertas sin comillas.
- **Los ids** son `INV-nn` y no se repiten.
- **Una fila «vigilado»** cita al menos un vigilante. **Una sin vigilante** dice «nadie».
- **Una tabla sin filas** es roja.

**56 pruebas:** 4 de lectura, 44 filas y 8 documentos.

**Los controles (copia; `cmp` contra el repo al restaurar):**

| Paso | Resultado |
|---|---|
| Copia tal cual | **56/56 verde** |
| INV-42 apunta a `scripts/testHandRulesX.test.js` | **rojo:** INV-42 y el puntero de `Reglas_Mano_Congeladas`, «2 failed \| 54 passed» |
| INV-24 cita `diagDSK msgX` | **rojo:** `INV-24 · vigilante: expected [ 'diagDSK no tiene el modo «msgX»' ] to deeply equal []` |
| La cabecera de §2 renombrada (`Vigilantes`) | **rojo:** `no hay filas bajo «\| id \| Regla \| Fuente \| Vigilante \| Etiqueta \|»: expected 0 to be greater than 0`. Las 44 de fila no llegan a generarse |
| Restaurado | **56/56 verde** |

**Un control más, para el mapa de commits:** con el registro y la prueba, pero **sin los dos informes de ARN-3e**, salen 4 rojas (INV-17, 41, 43 y 44, que los citan como fuente). Ver §3e-ii.7.

## §3e-ii.5 · La doctrina (D11, D19)

Todas son **ediciones en sitio, con su nota «ARN-3e (2026-10-03)»**. Los informes no se tocaron.

| Documento | Qué cambió |
|---|---|
| `docs/AJILEI_Protegidos_v1.0.md` → **v1.6** | El título y la versión pasan a 1.6, y la cabecera suma la entrada «Actualización v1.6» (su historial). **§5:** la regla «la huella se re-mide en el mismo commit», con el texto de la Fase 0 §B1. **§4 (`:186` en la v1.5, `:192` hoy):** la nota «*(v1.1; desde la v1.4 son seis…)*». **§2 y §3 no se tocaron.** `testProtegidos`: **8/8 verde** |
| `docs/AJILEI_Sistema_Diseno_v1.2.md` | **`:13`:** el texto de la Fase 0 §C2, fila 2, en una sola línea. **§13 nueva, al final: «LOS ÓVALOS DE LA MESA SON INTOCABLES»**, con el alcance de D19 en su primera línea, el texto de la Fase 0 §C1 tal cual y dónde lo dice el código. **`:433`:** la cita `playingCard.css:23-27` pasa a `:29-33` (H3e-ii-2) |
| `docs/AJILEI_Diseno_Landscape_v1.0.md` | `:15` y `:202`: el puntero a Protegidos §2 (filas 1 y 1b) |
| `docs/AJILEI_Plan_Tandas_Landscape_v1.0.md` | `:25` y `:96`: ídem (fila 1c) |
| `docs/AJILEI_Componente_Fichas_v2.0.md` | `:169`: ídem (fila 1d) |

**Por qué los óvalos van al final de `Sistema_Diseno` y no junto a la adenda de O1 (`:517`):**
- el comentario de `playingCard.css` (3e-i, D10) cita `Sistema_Diseno_v1.2.md:432-433`;
- cualquier línea añadida antes lo habría dejado mal, y arreglarlo pediría otra prueba del `dist/` idéntico.

Por eso ninguna edición añade líneas antes de la `:433`: la `:13` sigue siendo una línea, y la §13 va detrás de todo. **El documento no sube de versión:** D11 dice «en sitio», y la nota fechada va en cada edición.

## §3e-ii.6 · El cierre de ARN-3

`docs/reportes/AJILEI_ARN-3_Cierre_v1.0.md`:
- **la serie** en una tabla, con los SHA y si tocó el producto;
- **la tabla única de aplazados** al día: 20 vigentes, y 23 resueltos (los 19 de la Fase 0 más E-22, `apu.5`, `all` → `humo` y H3e-i-1);
- **las 38 marcas de iOS**;
- **la foto de partida**: lo medido en 3d y 3e, y la lista de lo que no se corrió desde 3c.

## Varas 3e-ii

| Vara | Resultado |
|---|---|
| vitest | **53 archivos, 1 312 pruebas, verdes.** Son 1 252 de la 3e-i, más 4 de `nucleo.test.js` y 56 de `testInvariantes` |
| eslint | **21** (la línea base). Los archivos tocados salen limpios |
| `humo` (repo, `--sin-build`) | **verde, código 0** |
| `testProtegidos` tras editar Protegidos | **8/8** |
| build | **uno** (`diagPUE voz2`, 07:54). Los `humo` de la copia compilaron en la copia |

**H3e-i-3, otra vez.**
- **El fallo:** la primera pasada completa de vitest (08:13) **falló al cargar todos los archivos**, con un solo arnés vivo, en la copia.
- **Las repeticiones:** un archivo suelto y dos pasadas completas salieron verdes. Una de ellas intentaba reproducirlo, con un dev arrancando en la copia a la vez.
- **Lo que cambia en la sospecha:** las copias ya tenían caché propia, así que `node_modules/.vite` pierde fuerza. La nueva candidata es `node_modules/.vite-temp`, donde Vite empaqueta `vite.config.js` al arrancar. La comparten copia y repo por la unión, y `CTL_CACHE` no la cubre.
- **El error exacto no quedó guardado:** filtré la salida antes de verla. Queda en vigilancia, con esa nota en el cierre.

---

## §3e-ii.7 · Mapa archivo → commit definitivo (toda la 3e)

| # | Commit | Archivos |
|---|---|---|
| 1 | `ARN-3e-1: pruebas — huellas de los protegidos, !important, claves de almacenamiento y avisos de las pruebas` | `scripts/arnes/fuente.mjs` · `scripts/testProtegidos.test.js` · `scripts/testImportant.test.js` · `scripts/testClavesAlmacen.test.js` · `scripts/testAvisosPruebas.test.js` · `src/styles/playingCard.css` (el comentario de D10) |
| 2 | `ARN-3e-2: arnés — humo en lugar de all, apu.5 en una lectura con cobertura, y ningún build con un dev vivo` | `scripts/diagDSK.mjs` · `scripts/arnes/nucleo.mjs` · `scripts/arnes/nucleo.test.js` · `scripts/arnes/comun.mjs` |
| 3 | `ARN-3e-3: doctrina — el registro de invariantes y su prueba, los óvalos, la huella en el mismo commit y las listas de protegidos` | `docs/AJILEI_Invariantes_v1.0.md` · `scripts/testInvariantes.test.js` · `docs/AJILEI_Protegidos_v1.0.md` · `docs/AJILEI_Sistema_Diseno_v1.2.md` · `docs/AJILEI_Diseno_Landscape_v1.0.md` · `docs/AJILEI_Plan_Tandas_Landscape_v1.0.md` · `docs/AJILEI_Componente_Fichas_v2.0.md` · **`docs/reportes/AJILEI_ARN-3e_Fase0_Informe_v1.0.md` · `docs/reportes/AJILEI_ARN-3e_Informe_v1.0.md`** |
| 4 | `ARN-3e-4: cierre de ARN-3` | `docs/reportes/AJILEI_ARN-3_Cierre_v1.0.md` |

**Un cambio frente a la ficha** (pregunta 2):
- **Los dos informes de ARN-3e suben al commit 3.** El registro los cita como fuente de D12, D16, D17 y D20, y sin ellos `testInvariantes` sale rojo en 4 filas (§3e-ii.4).
- Con el mapa de la ficha, el commit 3 no quedaría verde por sí solo.
- El commit 4 queda con el cierre, que nada cita.

**Cada commit queda verde por sí solo:**
- 1, porque lee lo que ya está en `main` (3e-i);
- 2, porque las pruebas de `nucleo` leen `comun.mjs`, que va con él;
- 3, porque lleva lo que su prueba cita.

Los 5 residuos conocidos (`MOT-1` ×2 y `laminas/mon1` ×3) no van en ningún commit.

---

## Hallazgos nuevos de la 3e-ii (se reportan, no se arreglan)

| # | Hallazgo |
|---|---|
| **H3e-ii-1** | **El piso de 36 px de `apu.6` no ha medido un botón en ninguna corrida reciente** (mide en el pago, donde no hay fila de acciones). Con D16, una celda sin pozo partido puede llegar a `apu.6` en el turno del humano. Ahí la fila de apuestas de 360×640 vertical mide **28 px** («Pasar», «Apostar 50», «Retirarse»), y la celda sale roja (1 de 4 corridas de `gasta`). Los 28 px no son nuevos: `apu.2` los anota en cada corrida y solo exige igualdad con sus hermanos (§3e-ii.1.4) |
| **H3e-ii-2** | **`Sistema_Diseno_v1.2.md:433` citaba `playingCard.css:23-27`**, y el comentario de la 3e-i movió esas líneas a `:29-33`. Corregido en sitio, sin mover ninguna línea (D11) |
| **H3e-ii-3** | **`docs/AJILEI_Protegidos_v1.0.md` estaba en `w/crlf`** en el árbol de trabajo (`i/lf`), el único de `docs/`. git lo normalizaba al añadir, así que el diff no lo mostraba. Al editarlo se dejó en LF, y el diff de la v1.6 solo enseña lo editado (17 líneas más y 3 cambiadas). La causa probable es un editor; INV-37 lo anota |
| **H3e-ii-4** | **H3e-i-3 volvió**, ahora con las copias en caché propia. La sospecha pasa de `node_modules/.vite` a `node_modules/.vite-temp` (§Varas 3e-ii) |

## Preguntas al rector (STOP-2)

1. **H3e-ii-1, `apu.6`.** Hay tres caminos:
   - (a) que mida en un estado fijo (el pago de `apu.5` cuando lo hay, y si no, nada: `sinCobertura`);
   - (b) que mida aposta la fila de apuestas y su piso se discuta contra INV-07, porque 28 px en vertical es una pregunta de producto;
   - (c) dejarlo así, como rojo raro en el camino de `cobertura`.

   Hoy la vara no lo toca: las corridas con pozo partido miden el pago.
2. **El mapa de commits:** ¿suben los dos informes de ARN-3e al commit 3, para que quede verde por sí solo (§3e-ii.7)?

## STOP-2 · Comprobaciones

Comprobado a las 08:28:
- **Puertos 4000–5999:** solo `0.0.0.0:5040`, pid 7724 (el `svchost` de siempre).
- **`node` vivos:** ninguno (`tasklist` y `Get-CimInstance`).
- **Las copias:**
  - **la unión de `scratchpad/arn3e-ii/ctl` se quitó con `rmdir`** (`cmd /c rmdir`), y se comprobó que ya no existe;
  - **ninguna copia de ARN-3e conserva su unión** (`arn3e/copia`, `arn3e-i/ctl` y `arn3e-ii/ctl`);
  - **el borrado recursivo sigue denegado en esta sesión** y no se reintentó por otra vía. Las carpetas siguen en el scratchpad, ya sin enlace al repo.
- **`node_modules` del repo, intacto:** 150 entradas (154 con las ocultas), vite 8.0.14, playwright-core 1.62.1. En el repo no queda ningún `.vite-*` de las copias, y no hay ningún `_*.mjs` nuevo (`scripts/_resolveExt.mjs` está rastreado desde `ed62d08`).
- **Fines de línea:** los 10 modificados están en `i/lf w/lf`, y los 10 nuevos tienen 0 bytes CR.

```
i/lf    w/lf    docs/AJILEI_Componente_Fichas_v2.0.md
i/lf    w/lf    docs/AJILEI_Diseno_Landscape_v1.0.md
i/lf    w/lf    docs/AJILEI_Plan_Tandas_Landscape_v1.0.md
i/lf    w/lf    docs/AJILEI_Protegidos_v1.0.md          (era w/crlf: H3e-ii-3)
i/lf    w/lf    docs/AJILEI_Sistema_Diseno_v1.2.md
i/lf    w/lf    scripts/arnes/comun.mjs
i/lf    w/lf    scripts/arnes/nucleo.mjs
i/lf    w/lf    scripts/arnes/nucleo.test.js
i/lf    w/lf    scripts/diagDSK.mjs
i/lf    w/lf    src/styles/playingCard.css
```

- **`git status --porcelain`:** 10 modificados y 11 nuevos de ARN-3e, más los 5 residuos conocidos. Sin `git add`.

```
 M docs/AJILEI_Componente_Fichas_v2.0.md
 M docs/AJILEI_Diseno_Landscape_v1.0.md
 M docs/AJILEI_Plan_Tandas_Landscape_v1.0.md
 M docs/AJILEI_Protegidos_v1.0.md
 M docs/AJILEI_Sistema_Diseno_v1.2.md
 M scripts/arnes/comun.mjs
 M scripts/arnes/nucleo.mjs
 M scripts/arnes/nucleo.test.js
 M scripts/diagDSK.mjs
 M src/styles/playingCard.css
?? docs/AJILEI_Invariantes_v1.0.md
?? docs/reportes/AJILEI_ARN-3_Cierre_v1.0.md
?? docs/reportes/AJILEI_ARN-3e_Fase0_Informe_v1.0.md
?? docs/reportes/AJILEI_ARN-3e_Informe_v1.0.md
?? docs/reportes/AJILEI_MOT-1_Fase0_Informe_v1.0.md
?? docs/reportes/AJILEI_MOT-1_Fase1-0_Sonda_Informe_v1.0.md
?? laminas/mon1/_entorno.txt
?? laminas/mon1/lamina.html
?? laminas/mon1/tiempos.json
?? scripts/arnes/fuente.mjs
?? scripts/testAvisosPruebas.test.js
?? scripts/testClavesAlmacen.test.js
?? scripts/testImportant.test.js
?? scripts/testInvariantes.test.js
?? scripts/testProtegidos.test.js
```

**Parada en el STOP-2. Espera la revisión del rector.**

---

# Decisiones del rector en la revisión del STOP-2

| # | Pregunta | Decisión |
|---|---|---|
| 1 | `apu.6` (H3e-ii-1) | **No se toca en ARN-3e.** `apu.6` nunca midió la fila de apuestas: medía en el pago, donde esa fila no existe, y daba un verde vacío. Su arreglo es medirla **a propósito** en el turno del humano (la opción b). Saldrá roja, porque la fila de apuestas mide 28 px en 360×640 vertical, por debajo del piso táctil de 40 px (INV-07). Ese rojo es de producto. Va junto a la decisión de producto sobre la altura de esos botones y a la pregunta de por qué el modo `tactil` no lo detecta. **Dueño:** la próxima campaña de producto de la mesa que toque la fila de acciones. Queda en el cierre como aplazado 21, y en el registro, en la fila INV-07 |
| 2 | Mapa de commits | **Los dos informes de ARN-3e suben al commit 3**, junto al registro que los cita: así el commit 3 queda verde por sí solo |

iOS: nada que validar (ARN-3e no toca lo que se ve).
