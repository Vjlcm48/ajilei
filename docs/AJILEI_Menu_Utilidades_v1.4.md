# AJILEI — Menú de Utilidades v1.4

**Estado:** Revisión de especificación. Sustituye a `AJILEI_Menu_Utilidades_v1.3.md`.
**Fecha:** 2026-08-14
**Base de código:** HEAD `96a7ba6` (MSG-U1b). Documento sin implementación asociada — **doc-only**;
lo implementa la tanda **DSK-U2c**.
**Naturaleza:** **Delta sobre la v1.3.** Todo lo que esta revisión no modifique explícitamente
sigue vigente tal como está escrito en la v1.3 y, a través de ella, en la v1.2, v1.1 y v1.0:
disparador ⋮, panel flotante `fixed` z:30, panel a solo-iconos, badge contador y su popup, "Mano
actual" funcional, y el circuito completo de Reacciones — selector 3×4 con sus tres cierres,
burbuja anclada **por tinta**, ciclo de 3,0 s, candado de una a la vez, X de cierre anticipado y
cooldown de 5 s. Lo que cambia es **qué es el emoji dentro de una reacción**.
**Autoridad visual:** `AJILEI_Sistema_Diseno_v1.2.md`.
**Base de medición:** campaña **U2-N** (fase 0, read-only) — 20 celdas del arnés (4 mesas × 5
viewports, centinela 1440×850 incluido), ensayos aplicados y revertidos en página. Toda cifra de
este documento sale de ahí; las que no se midieron se declaran como tales.

---

## 1. Qué cambia — el emoji deja de ser texto en línea

La v1.2 §2 selló el contenido con una frase que decidía dos cosas a la vez: *«el **emoji es parte
de la frase**: se sella junto al texto, viaja con él y es **estático** — ni animación ni sprite»*.
La implementación la llevó hasta su consecuencia lógica y soldó el emoji al último término con un
espacio duro (`sinHuerfano`, `Reacciones.jsx:81`) para que no quedara huérfano al envolver.

| | v1.2 / v1.3 | **v1.4** |
|---|---|---|
| Sitio del emoji | En línea, al final de la frase | **Piso propio**, debajo del texto |
| Unión con el texto | Espacio duro al último término | **Ninguna** — no comparte línea |
| Naturaleza | Glifo del sistema, estático | **Recurso propio**: SVG estático · AVIF animado en la burbuja |
| Tamaño | Heredado, 14px | **`--dsk-u2-emoji`, explícito** |
| Contenido | 12 frases selladas | **12 frases, dos emojis sustituidos** |

### 1.1 La doctrina del emoji no huérfano — ARCHIVADA, con contabilidad

Se retira con el molde de **A2 reabriendo M1/A1**: *se archiva, no se borra*. La v1.2 permanece
íntegra en el repositorio como registro de la decisión original y de su reversión.

**Alcance de la retirada:** de la v1.2 §2, la cláusula «viaja con él» (unión en línea) y la
cláusula «es **estático** — ni animación ni sprite». **Sobrevive intacto** lo demás de ese
párrafo: el emoji **sigue siendo parte de la frase** —se sella con ella, se elige con ella y viaja
con ella al arnés desde la fuente única—, sólo que ya no comparte renglón.

> **Motivo, medido.** Soldar el emoji al último término hace del par `término + emoji` un **bloque
> indivisible**, y ese bloque fija el techo de tamaño. Bisección por frase, resolución 0,25px: el
> peor caso no es la frase más larga sino la que deja el término indivisible más ancho —
> **«Camarita, te estoy mirando 👀»**, cuyo `mirando 👀` supera a `esto 🤨` y a `¡Ajilei! 🎴`.
>
> | Corredor vivo | Celdas | Techo del emoji |
> |---|---|---|
> | 136,5px | mesas 3 y 2 @1920×937 | **17,03px · 1,22×** |
> | 145,5–146,73px | mesas 3 y 2 en el resto, centinela incluido | 28,69px · 2,05× |
> | 205,67–207,73px | mesa 4 @1920, mesa 5 @1024 | ~71,7–73,1px |
> | ≥248px | mesa 5 @1366 y @1440 | >80px |
>
> **17px es el techo global**, y a **22,1px** la tinta ya pisa la ✕ de cierre. Ninguna animación
> se lee a ese tamaño: la doctrina nació para que el emoji no quedara solo en un salto de línea y
> murió porque el remedio le puso techo a la voz.

**Lo que la retirada NO reabre:** las cartas propias siguen siendo inocluibles (v1.2 §5.3) y el
tope de ancho por corredor vivo sigue vigente palabra por palabra. La medición lo confirmó desde
el otro lado: con el `clamp` izquierdo, la burbuja queda pegada al filo útil del área en **20/20
celdas** y su filo derecho cae **exactamente a 6,00px** del primer slot — la oclusión de cartas
es **estructuralmente imposible**, no una coincidencia afortunada. El primer contacto con una
carta sólo aparecía a **50px** de emoji (25,71px² en la celda más estrecha), muy por encima de
los dos límites que sí mandaban.

---

## 2. La burbuja de dos pisos

**Anatomía nueva.** Un solo cambio de forma, sin tocar la caja ni el anclaje:

```
┌─────────────────────────────┐
│ Camarita, te estoy mirando ✕│   ← piso 1 · la frase, texto puro, sin emoji
│            👀               │   ← piso 2 · el emoji, centrado, --dsk-u2-emoji
└──────────────▼──────────────┘   ← pico apuntando a la TINTA del nombre
```

- **Piso 1 — la frase.** Texto puro. Envuelve como hoy contra el tope de ancho derivado del
  corredor (v1.2 §5.3), y **envuelve mejor**: sin el emoji soldado, el bloque indivisible más
  ancho pasa a ser una palabra normal.
- **Piso 2 — el emoji.** Centrado en su propia línea. **`--dsk-u2-emoji`: tamaño explícito en px,
  jamás un factor.** Un factor esconde de qué depende; el arnés tiene que poder leer el número.
  **Banda admisible 36–40px; esta versión sella 40px.**
- **La ✕ no se mueve**: sigue en el piso 1, arriba a la derecha, con su hitbox embaldosada B2 y su
  escrúpulo de no crecer hacia la primera carta (v1.2 §4.2).

**Por qué 40px cabe.** El segundo piso hace crecer la burbuja **hacia arriba** (el `top` se deriva
de la tinta del nombre menos la altura de la caja). En la celda más estrecha —mesa 2 @1920×937—
la fila de cartas está **106,09px por encima** del borde superior de la burbuja actual; un piso de
40px cuesta ~46px con su interlínea y deja **60px de holgura**. Y a lo ancho no hay nada que
discutir: 40px contra un tope de 130,5px, el más estrecho de las 20 celdas.

**Lo que NO cambia, y se declara para que nadie lo reabra por inercia:**

- **El ciclo de vida**: 0,3 s entrada · 2,4 s visible · 0,3 s salida = **3,0 s**. Intacto, con su
  duración viviendo una sola vez en `src/config/reacciones.js` y viajando al CSS como `--u2-dur`.
- **El candado** (una a la vez) y el **cooldown de 5 s indiferente a la X**.
- **El anclaje por tinta.** Comprobado, no supuesto: el `Range` mide **el nombre del emisor**
  (`.pbr-name`), nunca el contenido de la burbuja. Con el contenido de la burbuja mutado a 6× su
  tamaño, el rect de la tinta del ancla salió **byte a byte idéntico en 20/20 celdas**. **El
  anclaje es inmune a cualquier cambio de contenido** — es la puerta de entrada de esta tanda y
  está abierta.
- **La capa 25**, `pointer-events: none` salvo la ✕, y el Δ=0 de layout por construcción.

**El emoji anima mientras la burbuja vive y muere con ella.** No hay reproductor, ni estado, ni
temporizador nuevo: el recurso es un `<img>` que empieza a animar al montarse y desaparece con el
desmontaje que ya existe. La X y el corte lo matan gratis.

> **Límite conocido y aceptado.** Once de las doce animaciones duran **0,81–1,96 s** y completan
> su ciclo dentro de los 2,4 s visibles. **🙄 dura 2,94 s** y no lo completa: se ve un fragmento.
> Se acepta —el gesto se lee en el primer tercio— y se registra para no descubrirlo dos veces.

---

## 3. Las 12 reacciones — dos sustituciones selladas

**El catálogo animado de Google no cubre los doce.** Censo HTTP contra
`fonts.gstatic.com/s/e/notoemoji/latest/<cp>/512.*`: **10 de 12**. Los dos ausentes devuelven 404
en todas sus claves —probadas `1f3b4_fe0f`, `1f926_1f3fb`, `1f926_200d_2642(_fe0f)`,
`1f926_200d_2640` y el hermano `1f937`—, y la propia FAQ del proyecto lo asume: *«con casi 4.000
emoji… vamos de a poco»*.

**La regla dura es 12/12 o no hay animación**: un set mixto animado/estático se ve peor que todo
estático. Se satisface por sustitución, no por rebaja.

| # | Frase | | # | Frase |
|---|---|---|---|---|
| 1 | **¡Ajilei! ♠️** | | 7 | Aquí no se regala nada 😏 |
| 2 | ¡Eso, chamo! 🙌 | | 8 | Camarita, te estoy mirando 👀 |
| 3 | Eso estuvo fino, chamo 👌 | | 9 | Pana, qué mano te salió 😳 |
| 4 | Suerte la próxima 🤝 | | 10 | Tú y yo sabemos cómo es esto 🤨 |
| 5 | ¡Me lleva el diablo! 😤 | | 11 | **¡Qué va! 🙄** |
| 6 | ¡Eso fue trampa! 😂 | | 12 | No me hagas eso, pana 😅 |

- **🎴 → ♠️** (`2660_fe0f`). No es un emoji cualquiera de repuesto: **♠️ es el palo Espadas**, que
  ya vive en la voz de la casa —los mensajes de resultado lo nombran y el desglose de "Mano
  actual" lo lista—. «¡Ajilei! ♠️» sigue siendo una carta, y sigue siendo de aquí. *(🃏 `1f0cf`,
  🀄 `1f004`, ♣️ y ♦️ también son 404: de los cuatro palos sólo animan ♠️ y ♥️.)*
- **🤦 → 🙄** (`1f644`). Conserva la incredulidad de «¡Qué va!». Si algún día molesta su ciclo
  largo (§2), están presentes y verificados 😩 `1f629`, 😫 `1f62b`, 😒 `1f612` y 🤯 `1f92f`.

**La fuente única no se toca:** `src/config/reacciones.js` sigue siendo el único sitio donde viven
las frases, en este orden. El selector las pinta, la burbuja muestra la elegida y **el arnés las
importa de ahí**.

---

## 4. Fuente unificada de glifos

Hasta hoy el emoji lo pintaba **la fuente del sistema** (`Arial, sans-serif` → Segoe UI Emoji en
Windows, otra cosa en cada plataforma): doce dibujos distintos según el aparato del jugador. Se
unifica.

| Superficie | Recurso | Tamaño |
|---|---|---|
| **Selector 3×4** y todo emoji estático | **SVG de Noto — 12/12** | nominal actual **× 1,11 em** |
| **Burbuja** | **AVIF animado de Noto** | `--dsk-u2-emoji` = 40px |

**El SVG cubre los doce, incluidos los dos que no animan** (`1f3b4` 985 B, `1f926` 13.277 B):
**70,1 KB los doce juntos**, medidos y rasterizados uno por uno. El hueco del catálogo es sólo de
animación.

**El factor 1,11 em no es decorativo.** Medido por **conteo de píxeles rasterizados**, no por caja
de `Range` — la doctrina de `Diseno_Landscape` §10.3 aplica igual aquí: *la caja de un texto no es
su tinta*. A tamaño nominal idéntico, la tinta del SVG de Noto queda **11% por debajo** de la del
glifo del sistema (media W 1,075 · H 1,111 sobre los doce). Sin corregir, el cambio de fuente se
leería como un encogimiento. **Dispersión registrada: 0,94–1,31 según emoji** (🤝 es el extremo
alto, 🙌 el bajo); un solo token deja ±20% por pieza, y se acepta antes que doce excepciones.

**El selector no crece.** Su fila mide **44px** de estándar táctil y la tinta a 1,11 em queda muy
por debajo. Medido: la rejilla tolera hasta **2,75× (38,5px)** antes de que la tinta rebose los
44 —y no por oclusión, que es cero en todo el rango, sino por la propia fila—. No se gasta ese
margen: el selector se lee de un vistazo, no es donde vive el gesto.

**Todo autoalojado.** La ruta `latest` de `fonts.gstatic.com` es **mutable** —el arte puede cambiar
bajo los pies sin aviso— y la PWA nace instalable con el service worker en agenda
(`Diseno_Landscape` §10.4): un recurso de tercero rompe el offline el día que llegue.

**Peso a presupuestar** (medido, los doce del §3):

| Formato | Los 12 | Nota |
|---|---|---|
| **SVG estático** | **70,1 KB** | 12/12 · la vía barata |
| **AVIF animado 512** | **571 KB** | la elegida para la burbuja |
| WebP animado 512 | 4,12 MB | descartado — 7× el AVIF |
| WebP animado 128 | ~2,02 MB | descartado — **cuatro veces el AVIF a 512**: el peso lo mandan los cuadros y el alfa, no el área |
| Lottie `.json` | 670 KB | descartado — exige runtime propio |

---

## 5. Accesibilidad y movimiento

### 5.1 El ráster animado ignora `prefers-reduced-motion` — el intercambio se escribe

Medido por captura de pantalla (no por `drawImage`, que devuelve siempre el mismo cuadro y no
prueba nada): bajo `prefers-reduced-motion: reduce` emulado, el **WebP animado sigue animando
(9/10 cuadros distintos)**, el **AVIF también (9/10)** y el GIF también. El control CSS explica por
qué: **también siguió animando**, porque la media query es una *consulta*, no un comportamiento.
Y hoy la app declara **cero reglas `prefers-reduced-motion`** en todas sus hojas (censo vivo: 0).

**Se escribe explícitamente:**

```html
<picture>
  <source media="(prefers-reduced-motion: reduce)" srcset="/emoji/1f440.svg">
  <img src="/emoji/1f440.avif" alt="" style="width:…em;height:…em">
</picture>
```

### 5.2 El `<img>` siempre con caja explícita en `em`

**Sin caja, la burbuja crece +515,38px al decodificar** (medido con recurso fresco: 35 → 550,38).
Con `width`/`height` en `em`, el Δ de altura antes y después de la carga es **0,00px en 20/20
celdas**. La razón es de arquitectura, no de gusto: el `top` de la burbuja se calcula **una sola
vez**, en el `useLayoutEffect` con deps `[id, anchorSel]`. Todo lo que crezca después del montaje
queda fuera de esa cuenta y se estira sobre el nombre.

> **Regla de alcance general.** Toda superficie que se coloque midiendo su propia caja al montar
> —la burbuja hoy, cualquier flotante mañana— **sólo admite contenido de dimensión conocida antes
> de la carga**. Una imagen sin caja es contenido de dimensión desconocida.

### 5.3 La frase sellada, completa, en `aria-label`

El emoji deja de ser texto, y eso rompe dos cosas a la vez: el lector de pantalla y el arnés.
Medido: con un `<img>` en la frase, `textContent` devuelve `"Camarita, te estoy mirando "` — **el
emoji desaparece**, y `alt="👀"` **no lo rescata**, porque el texto alternativo no entra en
`textContent`.

- La burbuja lleva **`aria-label` con la frase sellada completa**, emoji incluido.
- El `<img>` va con **`alt=""`** — decorativo, para no anunciar dos veces lo mismo.
- **La puerta `p8` del arnés lee `aria-label`, no `textContent`.** Sigue exigiendo la frase
  completa y exacta contra la fuente única.

---

## 6. Licencia y crédito

Verificada en la fuente, no de memoria. FAQ oficial de `googlefonts.github.io/noto-emoji-animation`,
textual: *«Can I use these animated assets commercially: for a video, for broadcast, apps, etc.? —
**Animated Noto Emoji is licensed under CC BY 4.0**»*, enlazando
`creativecommons.org/licenses/by/4.0/legalcode`.

Al molde de `Victory_Celebration` §7:

| Recurso | Licencia | Medido |
|---|---|---|
| `public/emoji/*.svg` (12 glifos estáticos) | **CC BY 4.0** · Google *Animated Noto Emoji* | 70,1 KB los doce · **12/12** |
| `public/emoji/*.avif` (12 animados) | **CC BY 4.0** · Google *Animated Noto Emoji* | 571 KB los doce · 27–33 fps · 0,81–2,94 s |

**El comentario en código no basta.** CC BY exige **crédito visible**, y la lección de la lámina
GNU (`Diseno_Landscape` §10.3) fue exactamente ésta: arte de terceros que entra sin su licencia
anotada acaba siendo una bomba de relojería. El crédito va **en el pie de la pantalla de
bienvenida, junto a `by HEPTACREATION`**, en la misma familia tipográfica y con el mismo peso
visual atenuado.

> **Corrección respecto al encargo.** El encargo situó ese pie en `ModeSelect`. El crédito
> `by HEPTACREATION` vive en realidad en **`WelcomeScreen.jsx:51`** (`ModeSelect.jsx` no lo
> contiene). Manda la ubicación real; se registra aquí para que la orden de implementación no
> busque donde no hay.

**Regla que esto sella**, hermana de `Victory_Celebration` §7.3: *ningún **arte** entra al
repositorio sin licencia verificada, anotada y —cuando la licencia lo exija— acreditada a la
vista.* Antes se dijo del audio; ahora vale para todo lo que se dibuja.

---

## 7. Regla nueva de jerarquía — la celebración manda el lenguaje de movimiento

**Durante una celebración de mesa (`Victory_Celebration` §1: mano ganada y AJILEI), las reacciones
se apartan.** No es cortesía visual: son dos gramáticas de movimiento sobre la misma superficie y
a la misma altura, y la celebración tiene techo de 2,5 s mientras la burbuja tiene 3,0 s. Si
compiten, ninguna de las dos se lee.

| Situación | Qué pasa |
|---|---|
| Celebración viva, el humano intenta enviar | **El envío se bloquea.** La entrada 💬 queda inerte con clase **temporal** (`is-cooling`), nunca `is-disabled` — v1.2 §4.3 |
| Burbuja viva, nace una celebración | **La burbuja se retira** por el camino de la ✕: `cerrarBurbuja(id)`, con su guardia de id. Mata lo visual, el cooldown sigue corriendo |
| La celebración se corta por toque (VC §6) | Al vaciarse `activa`, el envío se desbloquea solo. Nada que sincronizar |

**Cero maquinaria nueva:** el bloqueo reutiliza la unión `bloqueado` que ya existe en
`useReacciones`, y la retirada reutiliza el camino de la ✕ con su guardia de id (molde `potFloat`).

**El aplazamiento con cola queda descartado, y se registra por qué:** una reacción encolada se
dispararía cuando el momento ya pasó — «¡Eso fue trampa! 😂» tres segundos después de que la mesa
cambió de tema es peor que no decir nada. Mismo criterio que VC §6 aplica al corte: *no se resucita
lo cortado*.

**Alcance:** cubre los dos niveles **de mesa**. La tarjeta de fin de partida es pantalla terminal
y ahí no hay reacciones que apartar.

---

## 8. Alcance de esta fase y lo que queda

**Esta fase (U2c fase 0) es doc-only.** No toca `src/`. Sella la anatomía, el contenido, la fuente
de glifos, la accesibilidad, la licencia y la jerarquía; la tanda **DSK-U2c** las implementa.

**Lo que el arnés tendrá que ver** (modo `u2`, sobre las 20 celdas):

*Puertas que la tanda rompe y hay que reparar:*

- **`p8_fraseElegida`** y **`p8_lista`** — pasan a leer **`aria-label`**, por §5.3.

*Puertas que sobreviven pero quedan ciegas y hay que afilar:*

- **`p2_rejillaLimpia`** y la guardia `burbTapa` de **`p7_deltaCero`** miden **cajas**. Lo que
  rebosa con un emoji mayor es la **tinta**, y la caja no se entera: en el barrido, `p2` seguía
  verde con la rejilla rota. Ambas necesitan medir tinta.

*Puertas nuevas:*

1. **12/12 de existencia** del recurso — si un codepoint cae del catálogo, la tanda no entra.
2. **Tinta dentro de la caja**: `scrollWidth ≤ clientWidth` en el piso 1 y tinta a la izquierda de
   la ✕.
3. **Tinta ≤ 44px** en la fila del selector.
4. **Caja explícita**: altura de la burbuja idéntica antes y después de decodificar, **con recurso
   fresco** (§5.2).
5. **Intercambio por `prefers-reduced-motion`**: bajo `emulateMedia({reducedMotion:'reduce'})`, el
   recurso servido debe ser el **SVG** — el formato no obedece solo (§5.1).
6. **Presupuesto de peso** contra el total sellado del §4.
7. **`u2·jerarquía VC`**: envío bloqueado con celebración viva, burbuja retirada al nacer una, y
   desbloqueo al vaciarse `activa` (§7).

*Puertas intactas:* `p3_anclajePorTinta` (20/20 inmune), `p1*`, `p5`, `p10`.

**Tokens vivos esperados:** los de hoy —`--dsk-u2-fs: 14px`, `--dsk-u1-item-h: 44px`,
`--dsk-u2-cols: 3`, `--dsk-u2-gap: 4px`, `--dsk-u2-bub-z: 25`, `--dsk-u1-panel-z: 30`, más
`--u2-dur` / `--u2-pico` / `--u2-pico-x` en línea— y **dos nuevos**: **`--dsk-u2-emoji`** (40px,
tamaño explícito) y **`--dsk-u2-emoji-gap`** (aire entre los dos pisos). El `vertical-align` que
el emoji en línea necesitaba **desaparece con el segundo piso**: centrado en su propia línea, no
hay línea base que negociar.

**Fuera de alcance, sin cambios:**

- **Respuesta de las IAs a las reacciones** — sigue en **U2b** (v1.2 §6). Cuando llegue, su emoji
  hereda esta anatomía y su anclaje sale de v1.2 §5.1 en las dos rutas (`.opp-name`, `.ai-name`).
- **"Saldo: visible/oculto"** sigue inerte, y con ella la **deuda `is-off`** (v1.2 §1.2).
- **Cobro en fichas** y **ledger de Supabase** (v1.3 §5).
- **Móvil**: sellado. Esta revisión vive entera dentro del gate de escritorio (v1.1 §1.1).

---

## 9. Historial de versiones

- **v1.4** — 2026-08-14. **El emoji se vuelve pieza propia.** La **burbuja pasa a dos pisos**
  (frase arriba, emoji centrado abajo a **40px**, token `--dsk-u2-emoji` explícito), el emoji
  **anima mientras la burbuja vive y muere con ella**, y la **doctrina del emoji no huérfano queda
  archivada** con contabilidad (molde A2/*Sugerencias*): soldarlo al último término fijaba un
  techo medido de **17,03px**, ilegible para cualquier animación. **Dos sustituciones selladas** —
  🎴→♠️ (`2660_fe0f`, el palo Espadas ya vive en la voz de la casa) y 🤦→🙄 (`1f644`) — que
  satisfacen la regla dura **12/12** frente a un catálogo animado que sólo cubría 10. **Fuente de
  glifos unificada**: SVG de Noto 12/12 (70,1 KB) para el selector con **factor 1,11 em** medido
  por conteo de píxeles, AVIF animado (571 KB) para la burbuja, **todo autoalojado**. Accesibilidad
  con tres reglas medidas: **`<picture>` con `prefers-reduced-motion`** porque el ráster la ignora,
  **`<img>` siempre con caja en `em`** (sin ella, +515,38px), y **frase sellada en `aria-label`**
  porque `textContent` pierde el emoji. **CC BY 4.0** con crédito visible obligatorio en el pie de
  bienvenida. Regla nueva de alcance general: **la celebración manda el lenguaje de movimiento** —
  con VC viva las reacciones se bloquean y la burbuja se retira, sin cola. Anclaje por tinta
  **verificado inmune en 20/20 celdas**; cartas propias inocluibles y tope por corredor, intactos.
  Doc-only; la implementa **DSK-U2c**.
- **v1.3** — 2026-08-07. **"Mano actual" funcional.** Cuatro semánticas selladas:
  **consulta por mano** (primer press cobra 1, re-press gratis con valor re-derivado, mano nueva
  vuelve a cobrar, identidad = `handCount`), **disponibilidad** (sólo `BET_1/BET_2/DISCARD/BET_3`;
  `is-disabled` en reparto, showdown y pago, donde la banda gratuita toma el relevo), **N=0**
  (entrada viva, popup de agotadas, contador quieto, con el derecho adquirido sobre la mano ya
  pagada) y **persistencia** (leer siempre, escribir al consumir). Popup del valor con el
  desglose completo desde la fuente única y el comodín declarado, dos cierres (4 s / clic fuera,
  molde H4), capa 31, Δ=0. Badge **intacto**, incluido su invariante. Reglas nuevas de alcance
  general: **estado compartido al hook**, **núcleo puro sellado por Vitest** y **el arnés no
  reutiliza el helper de la app**. Implementado en la tanda **DSK-U3**, con modo `u3` permanente
  del arnés (10 puertas × 20 celdas + sub-pasadas de manos, agotadas y relojes) y 16 pruebas
  nuevas de Vitest sobre el núcleo puro.
- **v1.2** — 2026-08-07. La entrada 💬 se redefine como **Reacciones**: selector en grilla 3×4
  con las **12 frases selladas**, burbuja de 3,0 s (0,3/2,4/0,3) anclada **por tinta** al nombre,
  capa 25 (área) / 31 (selector), X de cierre anticipado **solo visual** con hit ≥40 por
  embaldosado B2, y **cooldown de 5 s indiferente a la X**. La clasificación
  imprescindible/narrativa queda **archivada como descartada** (molde *Sugerencias*): los
  mensajes del juego son siempre visibles. Reglas nuevas de alcance general: **anclaje por
  tinta**, **molde de capa hermano-del-área** y **cartas propias inocluibles**. Respuesta de las
  IAs diferida a **U2b**, con factibilidad verificada y cautelas registradas. Implementado en la
  tanda **DSK-U2**, con modo `u2` permanente del arnés (10 puertas × 20 celdas + sub-pasadas de
  ciclo/reloj y `pointer: coarse`). *(§2: la unión en línea del emoji y su cláusula "estático"
  quedan archivadas en v1.4 §1.1.)*
- **v1.1 · apéndice U1b** — 2026-08-06. Panel a solo-iconos con tooltips, ficha `ChipToken` para
  Saldo y SVG propio de carta con "?" para Mano actual, badge contador con `ajilei.consultas` y
  popup informativo con sus dos cierres.
- **v1.1 · apéndice de implementación** — 2026-08-05. Apertura abajo-derecha uniforme y panel
  `fixed` z:30 sin portal, timer heredado con su razón de diseño, clasificación de mensajes por
  fase+emisor *(descartada en v1.2 §1.1)*, sonido persistente con mute real, estado inerte de las
  otras tres entradas e insumo verificado de "Mano actual".
- **v1.1 · enmienda** — 2026-08-04. Semántica del toggle de Mensajes *(descartada en v1.2 §1.1)*
  y cierre por tipo de entrada.
- **v1.1** — 2026-08-04. Alcance acotado al gate de escritorio; disparador ⋮; panel flotante;
  cuatro entradas; "Mano actual" monetizada; Sugerencias descartada.
- **v1.0** — Preliminar.
