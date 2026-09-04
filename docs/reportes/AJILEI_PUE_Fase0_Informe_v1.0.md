# AJILEI — Campaña PUE (Portada-Entrada) · Fase 0 · Informe v1.0

**Diagnóstico de solo lectura · 30-ago-2026 · HEAD `26b1fb4`**

Levantamiento del terreno previo al diseño de la lámina HTML 1:1. Nada se
construyó: se midió, se leyó y se reporta. El único archivo nuevo de esta fase es
este informe.

**Cumplimiento del mandato**

| Regla | Estado |
|---|---|
| Solo lectura absoluta | ✅ Ningún archivo de `src/`, `public/`, raíz o configuración tocado |
| Protegidos no se abren | ✅ Los cinco de `docs/AJILEI_Protegidos_v1.0.md` §2 ni se leyeron para escritura |
| `npm run build` permitido | ✅ Ejecutado, verde; regeneró `dist/` (ignorado por git) |
| Sin dependencias nuevas | ✅ `package.json` intacto |
| Sin commits, sin push | ✅ El árbol queda como estaba salvo este informe |

**Nota de método.** Todo número de peso y dimensión sale de leer los bytes del
archivo (cabeceras PNG, `zlib.gzipSync`, `du -sb`), no de estimar. Lo que no se
pudo verificar sin navegador real está marcado **[NO VERIFICADO]** y dice por qué.

---

## Bloque 1 — Anatomía de la puerta actual

### 1.1 `src/screens/Entrada.jsx` (200 líneas)

**Estados internos** — seis `useState` y una `ref`:

| Estado | Tipo | Papel |
|---|---|---|
| `paso` | `'correo' \| 'codigo'` | Cuál de los dos momentos se pinta |
| `correo` | string | El correo tecleado; se conserva al pasar al código |
| `codigo` | string | Seis dígitos, filtrados en la entrada con `replace(/\D/g,'')` |
| `ocupado` | bool | Única guarda contra el doble envío |
| `aviso` | `null \| {texto, tipo:'error'\|'info'}` | Ranura de mensajes |
| `restante` | number | Cuenta regresiva del reenvío |
| `campoCodigo` | ref | Foco automático al llegar al paso 2 |

Constante única: `ESPERA_REENVIO = 60` (línea 22) — el límite de reenvío del
propio Supabase, no un número elegido.

**No hay dos pantallas: hay una con dos pasos.** El `<h1>`, la tarjeta y el
lienzo son los mismos objetos en ambos; sólo cambia el contenido de
`.entrada-cuerpo`.

**Textos exactos que pinta hoy**

*Paso 1 (correo):*
- Lema: «Entra con tu correo. Te enviamos un código de 6 dígitos — no hace falta contraseña.»
- Etiqueta: «Correo» · Marcador: «tucorreo@ejemplo.com»
- Botón: «Enviar código» / «Enviando…» (ocupado)
- Pie: «Entrar con Google, próximamente» (hueco declarado de SUP-3, sin botón muerto)
- Error de campo vacío: «Escribe tu correo»

*Paso 2 (código):*
- Lema: «Te enviamos un código a» + `<br>` + el correo en eco
- Etiqueta: «Código» · Marcador: «······»
- Botón: «Entrar» / «Entrando…»
- Enlaces: «Reenviar código (N s)» y «Cambiar correo»
- Error de longitud: «El código tiene 6 dígitos»

*Mensajes que llegan del hook (no los redacta la pantalla):*
- «Demasiados intentos — espera un momento antes de pedir otro código» (429)
- «No se pudo enviar el código — revisa el correo e inténtalo de nuevo»
- «Código incorrecto o vencido — pide uno nuevo»

**Hook que consume: ninguno directamente.** Y es el dato más importante de este
punto. `Entrada` recibe dos props —`onEnviarCodigo` y `onVerificar`— que
devuelven `{ok, mensaje}`. **El componente no importa `useAuth`, no conoce
Supabase, ni un código de error ni un nombre de tabla** (comentario de cabecera,
líneas 14-17). `App.jsx:57` es quien cablea `auth.enviarCodigo` y
`auth.verificarCodigo`.

> Esto es la mejor noticia de toda la Fase 0 para PUE: **la Portada-Entrada se
> puede diseñar, montar y medir en un arnés sin red**, exactamente como está hoy.

**Hojas que la gobiernan** (dos, importadas en las líneas 2-3):

| Hoja | Líneas | Qué aporta |
|---|---|---|
| `src/styles/puerta.css` | 282 | Lo COMPARTIDO con Bautizo: lienzo, tarjeta, campo, botón dorado, ranura de aviso, enlaces, overlay |
| `src/styles/entrada.css` | 87 | Sólo lo suyo: cuerpo de alto reservado, etiqueta, eco del correo, ancho de la cuenta regresiva, pie de «próximamente» |

Además la alcanzan sin importarla (el CSS se empaqueta en una hoja única):
`theme.css` (tokens), `welcome.css` (`body`, y `.welcome-title` que el `<h1>`
reutiliza), `embellecimiento.css` (resplandor EMB-1 y `--wm-track: 12px`) e
`index.css` (ver 1.4 — es donde está la trampa).

### 1.2 `src/screens/Bautizo.jsx` (145 líneas)

**Un solo propósito, dos vestidos.** `modo="bautizo"` es pantalla entera;
`modo="edicion"` es modal sobre la mesa dentro de `.puerta-overlay`. Comparten
campo, regla, intento contra la base y traducción de errores.

**Estados:** `nombre`, `ocupado`, `error`, `campo` (ref). Derivados: `valido`
(`REGLA_USERNAME.test`), `sinCambio` (sólo en edición), `edicion`.

**Textos:**
- Título: wordmark en bautizo · «Cambiar nombre» en edición
- Lema (sólo bautizo): «Ya casi. Elige el nombre con el que te van a ver en la mesa.»
- Etiqueta: «Nombre de jugador» · Marcador: «tunombre» · `maxLength={15}`
- Regla permanente: «6 a 15 caracteres: letras, números y guion bajo»
- Botón: «Confirmar» / «Guardando…»
- Enlaces: «Cancelar» (edición) · **«Cerrar sesión»** (bautizo)

**El «Cerrar sesión» de SUP-2b** (líneas 117-126). No lo pide el rector; lo pide
la pantalla. Un jugador con sesión y sin perfil no tiene ninguna otra pantalla a
la que ir: sin esta salida, entrar con el correo equivocado sólo se arregla
borrando el almacenamiento del navegador. Va condicionado a que llegue la prop
(`onCerrarSesion && (...)`), y `App.jsx:61` se la pasa siempre.

**Regla del username:** `/^[A-Za-z0-9_]{6,15}$/`, exportada desde `useAuth.js:62`
y **duplicada a propósito** — la autoridad es la base (CHECK, índice único sobre
`lower(username)`, disparador de vedados); esta copia sólo enciende o apaga el
botón mientras se teclea.

**Hojas:** `puerta.css` (282) + `src/styles/bautizo.css` (52).

### 1.3 El montaje: la puerta en `App.jsx`

`useAuth` no expone tres estados sino **cuatro**. El cuarto no está en el rector
y lo exige la realidad: `getSession()` es asíncrono.

```
useAuth.js:163-169 — estado DERIVADO en cada render, jamás sincronizado con efecto
  AUTH_BYPASS            → COMPLETO
  sesion === undefined   → CARGANDO
  sesion === null        → SIN_SESION
  perfil === undefined   → CARGANDO
  perfil === null        → SESION_SIN_PERFIL
  resto                  → COMPLETO
```

La puerta son **tres retornos tempranos** delante del primer `if` del lobby:

| Línea | Condición | Devuelve |
|---|---|---|
| `App.jsx:54` | `auth.estado === CARGANDO` | `null` — **pinta NADA**, no un spinner |
| `App.jsx:56-58` | `auth.estado === SIN_SESION` | `<Entrada onEnviarCodigo onVerificar />` |
| `App.jsx:60-62` | `auth.estado === SESION_SIN_PERFIL` | `<Bautizo onConfirmar onCerrarSesion />` |
| (cae) | `COMPLETO` | El recorrido del lobby de siempre, byte a byte |

`CARGANDO` devuelve `null` porque el fondo del documento ya es el verde abismo
(`welcome.css:1-6`): el hueco de uno o dos fotogramas se lee como la app
arrancando. Un spinner parpadearía en el 99 % de los arranques.

**Todos los hooks van arriba** (líneas 41-48), incluidos los `useState` del lobby
que en `SIN_SESION` no se usan: el orden de llamada tiene que ser el mismo en los
cuatro estados.

**Consecuencia para PUE:** la Portada-Entrada entra **exactamente aquí**, en el
retorno de `App.jsx:57`. Es un cambio de un componente por otro, sin router y sin
tocar el lobby.

### 1.4 Comportamiento responsive actual

**Las media queries que alcanzan hoy a Entrada y Bautizo son cuatro, y una sola
de anchura:**

| Hoja | Query | Qué mueve |
|---|---|---|
| `puerta.css:267` | `max-width: 680px` | Tarjeta 44/36/38 → 34/22/30, radio 32 → 26, `--puerta-lema` margen 38 → 28, campo de código 1.7rem → 1.45rem |
| `entrada.css:82` | `max-width: 680px` | `.entrada-cuerpo` min-height 357 → 329 |
| `bautizo.css:49` | `max-width: 680px` | Título 1.35 → 1.2rem, tarjeta en edición 30/26 → 24/20 |
| `puerta.css:258` | `prefers-reduced-motion: reduce` | Apaga `panel-enter` y el velo |

Heredadas sin ser suyas: `welcome.css:226` (`max-width:680px` — el `<h1>` baja de
72px/12px de traza a 56px/8px) y `embellecimiento.css:514` (`--wm-track` 12 → 8).

**Distribución en angosto vs. ancho, leída del CSS.** El lienzo es un flex
centrado (`min-height:100vh`, `align-items/justify-content: center`,
`padding:24px`, `box-sizing:border-box`). La tarjeta es `max-width:520px;
width:100%` (Entrada) o 460px (Bautizo). En ancho la tarjeta se planta en 520 y
el resto es lienzo; en angosto se estira al ancho disponible menos los 48 de
relleno. La composición es **una sola columna centrada en las dos**: no hay
reflujo de dos columnas a una, porque nunca hubo dos.

**Dos hallazgos que la lámina debe conocer:**

**(a) El corte es sólo de ANCHURA, y no hay ni una query de orientación ni de
altura.** Un teléfono en horizontal (740×360, 851×393, 915×412 son medidas
comunes) cae en la rama ANCHA: conserva el relleno de escritorio (44+38), el
`<h1>` de 72px y el cuerpo reservado de **357px**. Suma aritmética del CSS: la
tarjeta pide del orden de **540-560px de alto en un viewport de 360-412**. La
página se desplaza —`.puerta-screen` usa `min-height`, así que crece y el
desplazamiento lo toma el documento; el `overflow:hidden` sólo recorta el fondo,
no la tarjeta—, pero la puerta **no cabe sin scroll** en teléfono horizontal.
**[NO VERIFICADO en navegador]** — es aritmética sobre el CSS, no una medición
del arnés; la campaña DSK tiene arnés (`scripts/diagDSK.mjs`) capaz de
confirmarlo en una corrida.

**(b) `#root` está acotado a 1126px.** Ver 1.6 y la lista de restricciones: es la
trampa mayor para un hero de portada a sangre.

**Sobre `100vh`:** el lienzo usa `min-height:100vh`, no `svh`/`dvh`. En móvil con
barra de navegador retráctil, `100vh` es el viewport GRANDE, así que la puerta
nace más alta que la ventana visible.

### 1.5 Audio disponible

| Dato | Valor |
|---|---|
| Ruta servida | `/sounds/ajilei-strum.mp3` |
| Ruta en repo | `public/sounds/ajilei-strum.mp3` |
| Peso | **117 028 bytes = 114,3 KiB** |
| Duración | 3,657 s de archivo · 2,8 s útiles · **dos** rasgueos (0,21 s y racimo en 1,59/1,72/1,84) |
| Volumen | `0.8` en el Howl — elegido contra el pico MEDIDO (0,188, el más flojo de los tres de VC2) |
| Licencia | Pixabay Content License (ver `AJILEI_Victory_Celebration_v1.0.md` §7) |

**Cómo se dispara hoy.** Se declara en `src/hooks/useSounds.js:20` como uno de los
once `Howl` del objeto `sounds`, y se reproduce por `play('ajileiStrum')`, que
tiene **rama propia** (líneas 47-56): corta en `STRUM_CORTE_MS = 1300` con
`STRUM_FADE_MS = 130` de cortina, para dejar **un solo rasgueo ≤2 s** —el segundo
racimo sobra para el diseño sellado—. El recorte es **en reproducción, no en el
archivo**: así el mp3 queda tal como Pixabay lo distribuye.

**Quién lo pide:** `src/hooks/celebracionCore.js:101` — `if (nivel === 'ajilei')
return 'ajileiStrum'`. Es decir, hoy el rasgueo es el sonido del **AJILEI**, el
momento héroe de la celebración. Usarlo como primer toque de la portada le da a
la puerta el mismo timbre que la victoria máxima: es una decisión de diseño con
consecuencia narrativa, no una elección de archivo.

**Advertencia que cambia el presupuesto (ver 4.4).** Los once `Howl` se
construyen **a nivel de módulo**, no dentro del hook. Confirmado en el bundle
compilado: `var x={cardDeal:new m.Howl({src:[\`/sounds/card-deal.mp3\`]...`.
Howler trae `preload: true` por defecto (`howler.core.js:588` y `:645`), así que
**los once mp3 se descargan al evaluar el bundle, antes de que React pinte un
solo píxel** — incluidos los diez que la puerta no usa.

### 1.6 Sistema de diseño

**Documento vigente confirmado:** `docs/AJILEI_Sistema_Diseno_v1.2.md` (8 522
bytes, 26-ago-2026). Existe y es el que la cabecera de `puerta.css` cita como
autoridad visual.

**Implementación:** `src/styles/theme.css` (120 líneas), primer import de
`main.jsx`. Regla §7: nada se cablea; variable existente o se agrega a
`theme.css` **y** a la tabla §8 del rector.

**Tokens que gobernarán la portada:**

*Oro — ÚNICO, con variaciones de luminosidad (EMB-1), mismo tono:*

| Token | Valor |
|---|---|
| `--gold-brand` | `#e8b84b` |
| `--gold-brand-rgb` | `232, 184, 75` |
| `--gold-hover` | `#f5cc6a` |
| `--gold-dim` | `#c9973a` |
| `--gold-dim-rgb` | `201, 151, 58` |
| `--gold-brand-hi` | `#f5dfae` |
| `--gold-brand-hi-rgb` | `245, 223, 174` |
| `--gold-brand-deep` | `#ac7e16` |
| `--gold-brand-deep-rgb` | `172, 126, 22` |

*Verdes — rampa de VIS-1b, mismo H≈141-143 y S≈44-46 %, sólo cambia L:*

| Token | Valor | L |
|---|---|---|
| `--green-abyss` | `#09170e` | 6,3 % |
| `--green-darkest` | `#0b1c11` | 7,6 % |
| `--green-deep` | `#153922` | 15,3 % |
| `--green-base` | `#1b482c` | 19,4 % |
| `--green-bright` | `#235c38` | 24,9 % |

*Superficies:* `--surface-panel` `rgba(9,21,13,.75)` · `--surface-game`
`rgba(27,72,44,.88)` · `--surface-card` `rgba(9,23,14,.55)` · `--surface-area`
`rgba(9,23,14,.45)` · `--surface-area-light` `rgba(9,23,14,.30)` ·
`--surface-modal` `#0c1d13`

*Texto:* `--text-primary` `#f5edd8` (rgb `245,237,216`) · `--text-secondary`
alfa .72 · `--text-muted` .55 · `--text-faint` .25 · `--text-dark` `#1a1a0e`

*Bandera:* `--flag-yellow` `#ffcc00` · `--flag-blue` `#003893` · `--flag-red` `#cf142b`

*Semánticos:* `--loss-red` `#b71c1c` · `--lose-red` `#ef5350` · `--win-green`
`#66bb6a` · `--bet-orange` `#ff8a65` · `--raise-orange` `#e65100`

*Tipografía:* **`--font-base: Arial, sans-serif`**. Es la única familia del
proyecto. **No hay una sola `@font-face` ni un `fonts.googleapis` en todo `src/`
— cero bytes de fuente en el camino crítico.** El rector §9 la lista como deuda
4: «candidata a sustitución por una fuente con más carácter en una tanda futura».

*Composición:* `--filigrana` — reticulado dorado de dos `repeating-linear-gradient`
a ±45°, 1px cada 29, alfa 0,05 sobre `--gold-dim-rgb`. **Es CSS puro: no cuesta
una petición.** El rector §2 lo declara motivo de identidad presente en TODOS los
fondos, compuesto como `var(--filigrana), radial-gradient(...)`.

*Cartas:* `--card-w: 76px` / `--card-h: 118px`, con `+20 %` (91/142) en
`@media (min-width:768px) and (min-height:900px)`.

**Lo que la Entrada ya consume:** los nueve tokens de oro (filete, foco, botón,
hover de enlace), la rampa verde completa en el radial del lienzo, `--filigrana`,
`--surface-panel` y `--surface-area`, los cuatro de texto, `--loss-red` /
`--lose-red` y `--font-base`. **Ni un hex suelto en las tres hojas de la puerta.**

**Los seis motivos de identidad (§2)** y su disponibilidad para el hero:

1. **Arco de 8 estrellas** — LA firma. Está como **SVG en línea dentro de
   `WelcomeScreen.jsx:43`** (`viewBox="0 0 200 65"`), no como archivo. Coste de
   red: cero. Reutilizable copiando el marcado.
2. **Filigrana** — token CSS. Coste cero. Ya en la puerta.
3. **Cartas propias decorativas** — Rey de Oros y Caballo de Oros al 0,22 de
   opacidad, ocultas <680px. **Aquí está la trampa de peso: ver 2.5 y las
   restricciones.**
4. **Separador dorado fino** — 60×1px a `rgba(--gold-brand-rgb,.3)`.
5. **Acento tricolor** — sólo abstracto y sólo si no hay otro guiño.
6. **Icono de app** — vive fuera de las pantallas; no cuenta como guiño.

**Regla de distribución:** un guiño por pantalla máximo. La puerta de hoy no gasta
ninguno (sólo la filigrana de fondo, que es firma suficiente). **La portada tiene
su guiño entero disponible.**

---

## Bloque 2 — Inventario de assets para el hero

### 2.1 Inventario tabulado

**Marca e iconos**

| Archivo | Formato | Dimensiones | Peso | Consumidores |
|---|---|---|---|---|
| `src/assets/ajilei-isotipo.svg` | SVG | `viewBox 15 30 60 90` (w=12 h=3.5) | 4 054 B | `Wordmark.jsx`, `embellecimiento.css` |
| `src/assets/heptacoin.svg` | SVG | `viewBox 0 0 100 100` | 3 503 B | `ChipToken.jsx` |
| `src/assets/cards/reverso_carta.svg` | SVG | `0 0 910 1420` (ratio 0,641) | 6 994 B | `PlayingCard.jsx`, `gameTable.css` |
| `public/icons/ajilei-icon-maestro.svg` | SVG | `0 0 1024 1024` | 4 217 B | `index.html` (favicon) |
| `public/icons/apple-touch-icon.png` | PNG **RGB, sin alfa** | 180×180 | 30 596 B | `index.html` |
| `public/icons/icon-192.png` | PNG **RGB, sin alfa** | 192×192 | 34 531 B | manifest |
| `public/icons/icon-512.png` | PNG **RGB, sin alfa** | 512×512 | 228 518 B | manifest |

**Huérfanos — cero importadores en `src/`**

| Archivo | Formato | Dimensiones | Peso |
|---|---|---|---|
| `src/assets/baraja.svg` | SVG | w=2496 h=1595 | **1 267 756 B (1,21 MiB)** |
| `src/assets/baraja2.svg` | SVG | w=2496 h=1595, `viewBox 0 0 10 10` | **4 098 052 B (3,91 MiB)** |
| `src/assets/hero.png` | PNG paleta **con tRNS (transparencia)** | 343×361 | 13 057 B |
| `src/assets/react.svg` | SVG | `0 0 256 228` | 4 126 B |
| `src/assets/vite.svg` | SVG | `0 0 77 47` | 8 709 B |
| `public/icons.svg` | SVG | `0 0 16 17` | 5 031 B |

Ninguno llega a `dist/`: Vite sólo emite lo que se importa. Pesan en el repo
(5,2 MiB entre los dos `baraja`), **no en el producto**.

**Emoji autoalojados** (`public/emoji/`, consumidos por `config/reacciones.js:64`
con ruta construida en ejecución `` `/emoji/${codepoint}.${ext}` ``):

| Grupo | Archivos | Peso |
|---|---|---|
| `.avif` | 12 | 584 179 B (570,5 KiB) |
| `.svg` | 12 | 62 226 B (60,8 KiB) |

Como la ruta se arma en ejecución, **no hay una sola URL de emoji en el bundle**:
no entran al camino crítico y sólo bajan cuando se abre el panel de reacciones.

**Audio** (`public/sounds/`, 25 archivos, 4 899 447 B = 4,67 MiB): once mp3 de
juego (538 351 B — ver 4.4) y catorce de celebración (7 melodías × mp3+ogg,
4 361 096 B). Las melodías se construyen **dentro de una función**
(`useCoreografia.js:179`), no a nivel de módulo: bajan al ganar, no al llegar.

**Cartas:** ver 2.3.

### 2.2 Piezas de marca con lupa

**Isotipo — `src/assets/ajilei-isotipo.svg` (4 054 B).** Variante única en el
árbol: «Isotipo maestro v1.1 · "Letra doble" A+J con Heptacoin v1.1 (acuñación
tricolor, 2026-08-21)». No hay variantes alternativas en archivo. En el wordmark
**sustituye** a la secuencia «AJ», no la acompaña — de ahí que el `<h1>` sólo
lleve cuatro letras y que el `aria-label="AJILEI"` sea obligatorio (sin él la
marca se lee «ILEI»). Se importa con **`?no-inline`** (`Wordmark.jsx:5`) para que
el nombre del activo sobreviva a `vite build` en vez de disolverse en un data URI:
por eso viaja como archivo separado y no incrustado, pese a estar 42 bytes por
debajo del umbral de 4 096 de Vite.

**Heptacoin v1.1 B «marcada» — `src/assets/heptacoin.svg` (3 503 B).** Confirmado
contra `AJILEI_Identidad_A_v1.1.md:26` y `:97`: la composición sellada es HC-1
«Grabada» (H serifada en alto relieve, 7 estrellas en bajo relieve, canto
acuñado estriado); lo que la v1.1 cambia es el **cuño**, y la variante elegida es
**B «marcada»** —filete vino, sombra marina, cuarta parada del campo, base
`#e8b84b` intacta—. La A «discreta» se descartó por no registrar a 36 px.
`viewBox 0 0 100 100`.

**Reverso oficial R-2 «Greca» — `src/assets/cards/reverso_carta.svg` (6 994 B).**
Sellado 2026-08-21. Lienzo 910×1420, ratio 0,641 = 91:142 — **el mismo de
`--card-w`/`--card-h` en el escalón grande**, así que encaja sin deformar.
Sustituye al `reverso_carta.png` provisional, que ya no está en el árbol.

**Transparencia — cuáles sirven como capa del hero:**

| Pieza | ¿Fondo transparente? | Veredicto |
|---|---|---|
| `ajilei-isotipo.svg` | **Sí** | Capa directa. Ningún `<rect>` cubre el lienzo |
| `heptacoin.svg` | **Sí** | Capa directa. Escala sin pérdida a cualquier tamaño de hero |
| `reverso_carta.svg` | **Sí** | Capa directa. Vectorial: un abanico de reversos a pantalla completa cuesta 6,9 KB |
| `hero.png` | **Sí** (paleta + `tRNS`) | Sirve, pero es huérfano de origen desconocido y sólo 343×361 |
| `icon-192/512`, `apple-touch-icon` | **No** — PNG tipo 2 (RGB), sin canal alfa | Opacos. Son iconos de lanzador, no capas |
| Las 40 cartas | **No** — PNG tipo 2 (RGB) | Opacas. Rectángulo con esquinas cuadradas; el redondeo lo pone el CSS |

**Los tres vectores sellados (isotipo, Heptacoin, reverso) son el material de hero
más barato del repo: 14 551 bytes en total, transparentes, y escalan a cualquier
tamaño sin pedir un render nuevo.**

### 2.3 Las 40 cartas

| Dato | Valor |
|---|---|
| Convención | **`{numero}_{palo}.png` confirmada** |
| Números | `uno dos tres cuatro cinco seis siete diez once doce` (`CardImage.jsx` `NUM_MAP`) |
| Palos | `oro copa espada basto` (`PALO_MAP`: Oros/Copas/Espadas/Bastos) |
| Cantidad | **40** (10 × 4), sin excepciones |
| Dimensiones | **1055×1491 las 40, sin una sola desviación** — ratio 0,7076 |
| Color | PNG tipo 2 (RGB), **sin canal alfa**, las 40 |
| Peso total | **25 463 075 B = 24,28 MiB** |
| Peso medio | 636 577 B = **621,7 KiB** |
| Más liviana | `cinco_espada.png` — 210 040 B (205,1 KiB) |
| **Más pesada** | **`uno_oro.png` — 1 109 232 B (1 083,2 KiB)** |

**El contexto que la cifra pide.** Las cartas se pintan a `--card-w: 76px` (91px
en escritorio alto). Una carta de **1055px de ancho para una caja de 76-91px** es
un factor de 11,6× a 13,9× lineal. Ahí vive la campaña de compresión futura; esta
fase sólo traza la línea.

### 2.4 `public/baraja.svg` — veredicto definitivo

**Corrección primero: el archivo no está en `public/`.** `public/baraja.svg` no
existe y nunca existió en este árbol. Los dos archivos reales son
**`src/assets/baraja.svg` (1 267 756 B)** y **`src/assets/baraja2.svg`
(4 098 052 B)**. *(Esto corrige lo que dije al cerrar DES-2, donde los ubiqué en
`public/`.)*

Es además el desenlace de la ficha vieja: el `test-svg.html` retirado en DES-2
pedía `/baraja.svg` —ruta servida desde `public/`—, y **ese archivo no estaba
ahí**. El andamiaje ya estaba roto cuando se borró.

**Grep exhaustivo de consumidores** (todo el repo menos `node_modules/`, `dist/`,
`.git/` y las carpetas de capturas):

| Referencia | Naturaleza |
|---|---|
| `scripts/analyze_baraja2.py:7` | Script de análisis en Python, ruta absoluta de Victor. Herramienta de desarrollo; no se empaqueta |
| `.claude/settings.local.json:34` | Una entrada de permiso de un `grep` pasado. No es un consumidor |
| ~20 aciertos más | La palabra «baraja» en castellano (barajado, la baraja) en `bancoNiveles.mjs`, `diagDSK.mjs`, `diagCEL0.mjs`. Nada que ver con el archivo |

**Importadores en `src/`: CERO.** Verificado también por el lado del producto:
`dist/assets/` no contiene ningún `baraja-*.svg` tras `npm run build`.

> **VEREDICTO DEFINITIVO.** `src/assets/baraja.svg` y `src/assets/baraja2.svg`
> están **muertos**: ningún archivo de `src/` los importa, no entran al bundle y
> no cuestan un solo byte al jugador. Pesan **5,12 MiB en el repositorio** y cero
> en el producto. **NO SE BORRAN** — la eliminación es decisión y mano de Victor.
> Con ellos caería `scripts/analyze_baraja2.py`, que es su única herramienta viva.

### 2.5 Lista de vacíos — lo que el hero necesitaría y hoy no existe

Se listan huecos. **No se creó ningún asset.**

1. **Un render de carta apto para hero.** Las 40 son opacas y de 1055×1491 a
   ~622 KiB. Para un hero animado con cartas grandes hacen falta o versiones
   comprimidas (WebP/AVIF) o el vectorial. **No existe una sola carta en formato
   vectorial**: sólo el *reverso* es SVG.
2. **Cartas con transparencia.** Ninguna de las 40 tiene alfa. Un abanico
   inclinado sobre el hero mostrará esquinas cuadradas salvo que el CSS las
   recorte (`border-radius` + `overflow`), que es lo que hace hoy `.deco-card`.
3. **Una imagen social (`og:image` / `twitter:card`).** No existe, y `index.html`
   no tiene una sola meta social. Para la fachada de marketing de `ajilei.io`,
   compartir un enlace hoy no produce tarjeta.
4. **Un `<title>` y una `<meta name="description">` de portada.** El título actual
   es **`ajilei`** en minúsculas, sin descripción. Es lo que verá un buscador.
5. **Iconos con `purpose` separado.** Los dos del manifest declaran
   `"any maskable"` en la misma entrada — ver 3.1.
6. **Un asset de «instalar la app»** para la invitación diferida tras la primera
   mano: no hay ilustración, ni icono de compartir iOS, ni marca de Android.
7. **Fuente de marca.** `--font-base: Arial` es la deuda 4 del rector. Si la
   portada quiere carácter tipográfico, hoy no hay con qué — y meter una fuente
   web cambiaría el camino crítico, que hoy es de cero bytes de fuente.
8. **Vídeo o secuencia del hero.** No hay ni un frame. Cualquier movimiento tiene
   que salir de CSS (`transform`/`opacity`, ley §5) o de SVG en línea.

---

## Bloque 3 — El traje PWA

### 3.1 El manifest

**Ubicación:** `public/manifest.webmanifest` (482 bytes). **Quién lo genera:
nadie.** Es un **archivo estático** que Vite copia tal cual. No hay
`vite-plugin-pwa` ni ningún plugin en `vite.config.js`, que tiene cuatro líneas y
sólo carga `@vitejs/plugin-react`.

**Volcado completo:**

| Campo | Valor |
|---|---|
| `name` | `AJILEI` |
| `short_name` | `AJILEI` |
| `start_url` | `/` |
| `scope` | `/` |
| `display` | `standalone` |
| `orientation` | `any` |
| `theme_color` | `#0a1e10` |
| `background_color` | `#0a1e10` |

| `icons[]` | `src` | `sizes` | `type` | `purpose` |
|---|---|---|---|---|
| 0 | `/icons/icon-192.png` | `192x192` | `image/png` | `any maskable` |
| 1 | `/icons/icon-512.png` | `192x192`→**`512x512`** | `image/png` | `any maskable` |

Campos **ausentes**: `id`, `description`, `categories`, `lang`, `dir`,
`screenshots`, `shortcuts`, `display_override`.

**Dos observaciones de fidelidad:**

- **`purpose: "any maskable"` en la misma entrada.** Declara el mismo bitmap para
  las dos funciones. Android aplicará la máscara adaptativa recortando el icono a
  un círculo/squircle: si el arte no tiene la zona segura del 80 % central,
  **se le comen el borde**. Lo correcto son dos entradas, una `any` y otra
  `maskable` con su propio margen. **[NO VERIFICADO]** si el arte respeta la zona
  segura: exige inspeccionar el dibujo, no la cabecera.
- **`theme_color: #0a1e10` no es `--green-abyss`.** El comentario de `index.html`
  dice «mismo token `--green-abyss`», pero el token vale **`#09170e`**
  (`theme.css:42`). Son colores distintos —el del manifest es más azulado y un
  punto más claro—. Diferencia mínima e invisible en la práctica; se anota porque
  el comentario afirma una igualdad que no se cumple.

### 3.2 `index.html`

| Etiqueta | Presente | Valor |
|---|---|---|
| `<link rel="icon" type="image/svg+xml">` | ✅ | `/icons/ajilei-icon-maestro.svg` |
| `<link rel="manifest">` | ✅ | `/manifest.webmanifest` |
| `<meta name="theme-color">` | ✅ | `#0a1e10` |
| `<link rel="apple-touch-icon" sizes="180x180">` | ✅ | `/icons/apple-touch-icon.png` |
| `<meta name="viewport">` | ✅ | `width=device-width, initial-scale=1.0` |
| `<title>` | ✅ | **`ajilei`** (minúscula) |
| `<meta name="apple-mobile-web-app-capable">` | ❌ | **AUSENTE** |
| `<meta name="apple-mobile-web-app-status-bar-style">` | ❌ | **AUSENTE** |
| `<meta name="apple-mobile-web-app-title">` | ❌ | **AUSENTE** |
| `favicon.ico` | ❌ | No existe |
| `<meta name="description">` / Open Graph / Twitter | ❌ | **AUSENTES** |
| `<html lang>` | ⚠️ | **`en`** — la app está entera en castellano |

### 3.3 Service worker

**No existe.** Cero coincidencias de `serviceWorker`, `sw.js`, `workbox` o
`vite-plugin-pwa` en `src/`, `index.html`, `vite.config.js` y `package.json`.
Nadie lo registra, nada se cachea, y no hay funcionamiento sin conexión de
ninguna clase.

### 3.4 Veredicto predictivo iOS

**Icono: mostrará el isotipo, NO la miniatura gris.** `apple-touch-icon.png`
existe, mide 180×180 reales (verificado en la cabecera PNG), es opaco —que es lo
que iOS prefiere, porque rellena la transparencia con negro— y está declarado con
`sizes="180x180"`. Es exactamente lo que Safari busca al «Añadir a pantalla de
inicio». **La miniatura gris de la página sólo aparece cuando no hay
`apple-touch-icon` ni icono de manifest utilizable, y aquí hay los dos.**

**Nombre bajo el icono:** dirá **`ajilei`**, en minúscula — sale del `<title>`,
porque `apple-mobile-web-app-title` está ausente y `short_name` del manifest tiene
menos prioridad en iOS. Es el arreglo más barato de esta fase.

**Standalone a pantalla completa: RIESGO DECLARADO. [NO VERIFICADO]** El manifest
pide `display: standalone`, y las versiones recientes de iOS leen ese campo. Pero
`apple-mobile-web-app-capable` sigue siendo el interruptor histórico y el que no
depende de la versión; **su ausencia es el único motivo plausible por el que un
iPhone abriría la app con la barra de Safari encima en vez de a pantalla
completa.** No es verificable sin el aparato — es justo el reporte del iPhone
real que la campaña tiene pendiente. Añadir la meta cuesta una línea y no puede
empeorar nada: es un seguro, no un arreglo especulativo.

### 3.5 Veredicto Android — por qué el S25 ofreció «añadir acceso directo»

**Condiciones de instalabilidad de Chrome, una a una:**

| Criterio | Estado |
|---|---|
| Servido por HTTPS | ✅ (Cloudflare Workers lo da; en local, `localhost` cuenta) |
| Manifest enlazado y válido | ✅ |
| `name` o `short_name` | ✅ Los dos |
| `start_url` presente y en `scope` | ✅ |
| `display` instalable (`standalone`) | ✅ |
| Icono de 192 px | ✅ |
| Icono de 512 px | ✅ |
| Icono con `purpose` que incluya `any` | ✅ (`"any maskable"` incluye `any`) |
| **Service worker registrado con manejador `fetch`** | ❌ **NO EXISTE** |

> **VEREDICTO: el material alcanza y el diagnóstico es concluyente. La causa es
> el service worker ausente, y es la única casilla que falla.**

Chrome sólo emite `beforeinstallprompt` —y con él la opción **«Instalar
aplicación»**— cuando el sitio demuestra un mínimo de funcionamiento sin conexión,
lo que exige un service worker registrado que responda a `fetch`. Sin él, Chrome
degrada la oferta a **«Añadir a pantalla de inicio»**, que crea un **acceso
directo**: abre en pestaña de navegador, sin ventana propia y sin icono de app
verdadero. **Es exactamente el síntoma que reportó el S25**, y todas las demás
casillas están en verde, así que no hay una segunda causa compitiendo.

El arreglo es un service worker mínimo —registro + un `fetch` que responda algo
cuando no hay red—. **Queda fuera de esta fase**, que no construye; se anota como
la pieza que convierte el sitio en instalable de verdad, en Android y de paso en
iOS.

---

## Bloque 4 — Línea base de peso en frío

### 4.1 El build y el camino crítico de la puerta

**`npm run build`: verde.** Salida 0, `✓ built in 262ms`. Advertencia conocida y
no bloqueante del reporter de Vite: el bundle supera el umbral de 500 kB.

**Peso total de `dist/`: 32 016 819 bytes = 30,53 MiB**, en 101 archivos.

| Carpeta | Bytes | Parte |
|---|---|---|
| `dist/assets` | 26 166 346 | 81,7 % — las 40 cartas + JS + CSS + 3 SVG |
| `dist/sounds` | 4 899 447 | 15,3 % |
| `dist/emoji` | 646 405 | 2,0 % |
| `dist/icons` | 297 862 | 0,9 % |
| raíz (html, manifest, icons.svg) | 6 759 | 0,02 % |

**El camino crítico de la puerta** — lo que descarga exactamente un visitante frío
que llega a `/` hasta ver la Entrada pintada. Gzip calculado con `zlib` nivel 9,
que es lo que sirve Cloudflare (Brotli daría algo menos):

| # | Recurso | Crudo | Gzip | Por qué baja |
|---|---|---|---|---|
| 1 | `index.html` | 1 246 | **715** | El documento |
| 2 | `assets/index-CY_DqYvR.js` | 551 527 | **158 158** | Bundle ÚNICO: React + toda la app, incluidos mesa, IA, celebración y lobby |
| 3 | `assets/index-QFPAiIoo.css` | 137 193 | **23 034** | Hoja ÚNICA: las 18 hojas de `src/styles/` concatenadas |
| 4 | `icons/ajilei-icon-maestro.svg` | 4 217 | **1 080** | Favicon de la pestaña |
| 5 | `manifest.webmanifest` | 482 | **234** | Lo pide Chrome por el `<link rel="manifest">` |
| 6 | `assets/ajilei-isotipo-*.svg` | 4 054 | **1 560** | El `<Wordmark>` del `<h1>`, al pintar |
| | **Subtotal** | **698 719** | **184 781** | **180,5 KiB** |
| 7 | **11 × mp3 de `useSounds`** | **538 351** | **538 351** | **Howler los precarga al evaluar el bundle. mp3 ya está comprimido: gzip no lo baja** |
| | **TOTAL CAMINO FRÍO** | **1 237 070** | **723 132** | **706,2 KiB** |

**Fuentes: 0 bytes.** `--font-base: Arial, sans-serif` es pila del sistema y no
hay una sola `@font-face`.

**Imágenes en la puerta: 4 054 bytes.** Sólo el isotipo. El fondo entero —
filigrana + radial de la rampa verde — es CSS puro.

**Desglose de los once mp3 precargados**, ninguno de los cuales suena en la
puerta:

| Archivo | Bytes | | Archivo | Bytes |
|---|---|---|---|---|
| `ajilei-strum.mp3` | 117 028 | | `card-fold.mp3` | 39 288 |
| `card-shuffle.mp3` | 104 160 | | `table-knock.mp3` | 37 920 |
| `showdown.mp3` | 66 816 | | `card-deal.mp3` | 30 929 |
| `comodin.mp3` | 65 201 | | `chips-collect.mp3` | 30 929 |
| `timer-warning.mp3` | 21 504 | | `button-click.mp3` | 16 896 |
| `coin-bet.mp3` | 7 680 | | **Total** | **538 351** |

### 4.2 Top 10 de archivos más pesados del build

**Los diez son cartas.** Ninguna entra al camino crítico de la puerta (ver 4.3).

| # | Archivo | Bytes | Papel |
|---|---|---|---|
| 1 | `uno_oro-*.png` | 1 109 232 | As de Oros. La carta más pesada del juego |
| 2 | `doce_espada-*.png` | 1 011 712 | Rey de Espadas |
| 3 | `doce_oro-*.png` | 970 968 | Rey de Oros — **además decorativo de la Bienvenida** |
| 4 | `once_espada-*.png` | 934 103 | Caballo de Espadas |
| 5 | `diez_oro-*.png` | 925 983 | Sota de Oros |
| 6 | `siete_oro-*.png` | 925 381 | Siete de Oros |
| 7 | `siete_basto-*.png` | 889 183 | Siete de Bastos |
| 8 | `once_oro-*.png` | 859 327 | Caballo de Oros — **además decorativo de la Bienvenida** |
| 9 | `doce_basto-*.png` | 859 313 | Rey de Bastos |
| 10 | `doce_copa-*.png` | 858 823 | Rey de Copas |

Fuera del top 10, los pesos que sí importan al arranque: **`index.js` 551 527 B**
(el 11.º del build) y los siete `celebracion-*.mp3` de 386 238 B cada uno.

### 4.3 ¿Las 40 cartas entran a la carga inicial?

**No. Se descargan bajo demanda, y el mecanismo está bien elegido.**

`CardImage.jsx:1` usa `import.meta.glob('../assets/cards/*.png', { eager: true,
query: '?url', import: 'default' })`. El `eager: true` asusta, pero lo que se
importa con avidez son las **URL** (`query: '?url'`), no los binarios: el bundle
lleva 40 cadenas de texto de ~45 caracteres —unos 2 KB— y cada PNG sólo viaja
cuando un `<img src>` se monta en la mesa.

**Frontera con la futura campaña de compresión, trazada:**

| Momento | Cartas descargadas |
|---|---|
| Puerta (Entrada / Bautizo) | **0** |
| Bienvenida | **2** — `doce_oro` + `once_oro` como decorativos: **1 830 295 B = 1,75 MiB** |
| Selección de nivel / mesa | 0 adicionales |
| Mesa | Las que se reparten, a demanda |

> **El dato incómodo de la Bienvenida.** Los dos decorativos se pintan a
> `width: 150px` con opacidad ~0,22, y se ocultan con `display: none` bajo 680px
> (`welcome.css:227`). Pero **`display:none` no cancela la descarga**: el `<img>`
> está en el DOM y el navegador lo pide igual. Un teléfono descarga **1,75 MiB de
> adorno que jamás verá.** No es la puerta y por tanto no entra en la cifra de
> 4.4, pero es la pantalla inmediatamente siguiente y PUE la toca de lleno.

### 4.4 Foto «antes» declarada

> ## 706,2 KiB
> ### Camino crítico de la Portada-Entrada · línea base del presupuesto de rendimiento de PUE
> **HEAD `26b1fb4` · medido 30-ago-2026 · gzip nivel 9 · 723 132 bytes**

**Su composición, y por qué la cifra es una acusación:**

| Tramo | KiB | % |
|---|---|---|
| JavaScript (bundle único) | 154,5 | 21,9 % |
| **Audio que nadie oye en la puerta** | **525,7** | **74,5 %** |
| CSS (hoja única) | 22,5 | 3,2 % |
| Isotipo + favicon + manifest + html | 3,5 | 0,5 % |

**Tres cuartas partes del arranque son once efectos de sonido de una mesa de juego
que el visitante todavía no ha visto.** Ninguno suena en la Entrada. La causa está
en 1.5: los `Howl` se construyen a nivel de módulo y Howler precarga por defecto.

**La cifra alterna, para el presupuesto de PUE:**

> **180,5 KiB** — el mismo camino crítico si el audio no se precargara.

La diferencia son **525,7 KiB**, un 74,5 % del arranque. En la gama media con
datos móviles que la campaña nombra —3G rápido, ~400 KB/s reales— eso es **algo
más de un segundo de espera** que la puerta se cobra antes de dejar entrar, y que
compite por ancho de banda con el JS que sí hace falta para pintarla.

**Dos matices honestos:**
1. La descarga del audio es asíncrona (XHR de Howler) y **no bloquea el primer
   pintado**. El daño es contención de ancho de banda y datos gastados, no un
   bloqueo del render.
2. La cifra **[NO VERIFICADA en navegador]**: sale de sumar los recursos que el
   análisis estático demuestra que se piden, no de un panel de red real. La
   cadena está confirmada en el bundle compilado (`var x={cardDeal:new
   m.Howl(...)` a nivel de módulo) y en el código de Howler (`_preload` por
   defecto `true`, carga en `howler.core.js:645`). Una corrida del arnés de
   Playwright con `page.on('request')` la cerraría en una tanda.

---

## Restricciones que la lámina debe respetar

1. **`#root` está acotado a 1126px y lleva filetes laterales.** `index.css:57`
   —**la hoja del andamio de Vite, nunca retirada**— declara `#root { width:
   1126px; max-width: 100%; margin: 0 auto; border-inline: 1px solid var(--border) }`.
   Nadie la sobrescribe. A 1440 o 1920 la portada quedaría **embuchada en una
   columna de 1126px con dos rayas de 1px**, y el resto lo pinta `body {
   background: var(--green-abyss) }`. No es teoría: `tapetes.css:29` documenta
   que la campaña de tapetes ya chocó con esto y tuvo que mover el atributo a
   `body` porque «a 1920 la pantalla de mesa deja ~400px de VACÍO a cada lado».
   **Un hero a sangre exige tratar esa regla primero.**
2. **`src/index.css` es andamiaje del starter de Vite, entero y vivo.** Acento
   morado `#aa3bff`, `--bg: #fff`, `color-scheme: light dark`, `font: 18px/145%
   system-ui` en `:root`, `h1 { font-size: 56px }`. Cohabita con `theme.css` desde
   el primer día. Además de la caja de 1126px, `color-scheme: light dark` afecta
   a cómo el navegador pinta los controles nativos — y la portada es, mitad, un
   formulario.
3. **El corte responsive es sólo de anchura (680px) y no hay ni una query de
   orientación ni de altura en la puerta.** Teléfono en horizontal cae en la rama
   ancha y la tarjeta no cabe sin desplazamiento (1.4a). El requisito «sin scroll»
   de la portada obliga a cubrir ese caso, que hoy no está cubierto.
4. **`min-height: 100vh`, no `svh`/`dvh`.** Con barra de navegador retráctil,
   `100vh` es el viewport grande: la puerta nace más alta que la ventana visible.
   La memoria de la campaña de medición ya registró este mismo asunto.
5. **Presupuesto de peso: 180,5 KiB es lo que la portada debería costar; 706,2 KiB
   es lo que cuesta hoy.** Cualquier asset nuevo del hero se suma a la peor de las
   dos cifras mientras el audio siga precargándose.
6. **Un bundle único, sin división de código.** No hay `manualChunks` ni un solo
   `import()` dinámico: el visitante que sólo quiere ver la portada descarga la
   mesa, la IA, la celebración y el lobby enteros (154,5 KiB gzip).
7. **Ley de animación §5 del rector:** sólo `transform` y `opacity` (más
   `box-shadow` para halos). Nada que dispare reflow. Entradas de <1 s, una vez.
   Y `prefers-reduced-motion` ya está atendido en `puerta.css:258` — el hero tiene
   que respetarlo igual.
8. **Un guiño de identidad por pantalla (§2).** La portada elige UNO: arco de
   estrellas, cartas decorativas, separador dorado o acento tricolor. No dos.
   La filigrana de fondo no cuenta: es firma de la casa y ya está.
9. **Ni un hex suelto.** Todo valor sale de `theme.css`, o se agrega allí **y** a
   la tabla §8 del rector (§7). Las tres hojas de la puerta cumplen hoy al 100 %.
10. **El oro es ÚNICO y significa marca, nunca alarma.** El error se dice en
    `--lose-red`. Un solo oro sólido por pantalla —hoy es el botón—, y todo fondo
    `--gold-brand` lleva `color: var(--text-dark)`, sin excepciones (§3).
11. **O1 rige la portada entera.** La puerta de hoy reserva alto y ancho en tres
    sitios con cifras **medidas, no calculadas** (`.entrada-cuerpo` 357/329,
    `.puerta-aviso` 24px, `.entrada-cuenta` 2,8em). El comentario de
    `entrada.css` deja escrito que el cálculo a mano se quedó 52,13px corto. **Si
    la portada rehace la caja, esas tres cifras hay que volver a MEDIRLAS.**
12. **Los cinco protegidos siguen sellados** (`AJILEI_Protegidos_v1.0.md` §2,
    v1.3): `gameEngine.js`, `aiPlayer.js`, `seatLayouts.js`, `opponentPanel.css`,
    `gameTable.css`. **Buena noticia: ninguna hoja ni pantalla de la puerta está
    en la lista.** PUE tiene el terreno libre. *(La instrucción de fase cita el
    commit `25290bb`; el último que tocó el documento es `390a6b4`, que lo llevó a
    v1.3 — el contenido es el mismo, sólo cambió la prosa de §2.)*
13. **El isotipo cuelga por debajo de su caja de línea** (técnica FL-1). Su pie
    invade lo que venga después: 24,8px a 1000 de ancho, 13,13 a 375. `puerta.css`
    lo compensa con 38px de margen en `.puerta-lema`. **Cualquier composición
    nueva bajo el wordmark hereda esa invasión.**
14. **La marca se lee «ILEI» sin `aria-label`.** El anfitrión del `<Wordmark>`
    debe llevar `aria-label="AJILEI"`; es la trampa que IDN-1 documentó con nombre
    y fecha.
15. **La regla del username es de la base, no del cliente.** Si la portada toca el
    bautizo, la copia de `REGLA_USERNAME` sigue siendo sólo para encender el
    botón: los tres códigos (`23514`, `P0001`, `23505`) se traducen, no se
    adivinan.

---

## Oportunidades detectadas — lo que el terreno ya regala

1. **La puerta ya está desacoplada de la red.** `Entrada` recibe dos funciones y
   devuelve `{ok, mensaje}`; no importa Supabase. **La Portada-Entrada se puede
   montar y medir en un arnés sin red desde el primer día**, y la lámina HTML 1:1
   puede ser prácticamente el componente final.
2. **525,7 KiB de arranque están a un cambio de una línea.** Pasar los `Howl` a
   `preload: false` (o construirlos perezosamente, como ya hace
   `useCoreografia.js:179` con las melodías) **corta el camino crítico de 706,2 a
   180,5 KiB: un 74,5 % menos.** Es, de lejos, la mejora de rendimiento más
   barata del proyecto, y `melodiasCelebracion` ya demuestra el patrón correcto
   dentro de la casa.
3. **Cero bytes de fuente.** Arial de sistema: el primer texto pinta sin esperar a
   nadie y no hay parpadeo de fuente. Un lujo que se pierde en cuanto se adopte la
   fuente de marca de la deuda 4 — conviene decidirlo **con** la portada, no
   después.
4. **El fondo entero es CSS.** Filigrana + radial de la rampa verde: cero
   peticiones, escala a cualquier viewport, ya está tokenizado. El hero puede
   apoyarse en él sin gastar un byte.
5. **El arco de 8 estrellas es SVG en línea**, no un archivo. Coste de red cero,
   se colorea con tokens y se copia de `WelcomeScreen.jsx:43`. **LA firma de la
   marca está disponible gratis.**
6. **Tres vectores sellados y transparentes por 14 551 bytes**: isotipo (4 054),
   Heptacoin v1.1 B «marcada» (3 503) y reverso R-2 «Greca» (6 994). Escalan a
   cualquier tamaño de hero sin pedir un render nuevo. **El reverso es la pieza
   infrautilizada**: un abanico de reversos a pantalla completa cuesta 6,9 KB y
   dice «baraja española» sin gastar una carta de 622 KiB.
7. **La composición ya es una sola columna centrada en todos los tamaños.** No hay
   reflujo de dos columnas a una que rehacer: el hero se apila encima y ya.
8. **`puerta.css` es una hoja compartida bien cortada** (282 líneas, cero hex
   sueltos, O1 aplicado y documentado con cifras medidas). La portada hereda
   lienzo, tarjeta, campo, botón, ranura de aviso y enlaces **sin escribir una
   línea de CSS de base**.
9. **La puerta no gasta guiño de identidad.** Hoy sólo usa la filigrana de fondo.
   **La portada tiene su guiño entero disponible** — el sitio natural del arco de
   estrellas.
10. **Las cartas ya son perezosas** (`?url`). La portada puede referenciar cartas
    sabiendo exactamente lo que cuesta cada una, y el mecanismo no hay que
    construirlo.
11. **`display: standalone` y los dos iconos ya están.** Ocho de las nueve
    casillas de instalabilidad de Chrome están en verde: **falta una sola pieza**,
    el service worker. La invitación diferida a instalar que PUE quiere ofrecer
    tiene el traje casi entero puesto.
12. **iOS mostrará el isotipo, no la miniatura gris.** El `apple-touch-icon` de
    180×180 existe y es correcto. La invitación diferida puede prometer un icono
    bonito sin mentir.
13. **`AUTH_BYPASS` deja probar la portada sin correo.** `import.meta.env.DEV &&
    VITE_AUTH_BYPASS`, con puerta doble: en producción la rama se cae del bundle
    en tiempo de compilación. Iterar el hero no cuesta un OTP por recarga.
14. **La retirada de `index.css` limpia varios problemas de una vez**: la caja de
    1126px, el `color-scheme` y ~2,5 KB de CSS muerto. Es una tanda pequeña,
    aislada y de beneficio inmediato para el hero a sangre. **[NO VERIFICADO]** si
    alguna pantalla depende hoy de sus reglas de `h1`/`h2`/`code` — hay que
    comprobarlo antes de tocarla, y ése es trabajo de otra fase.
15. **Vacíos baratos ya identificados**: `<title>` de portada,
    `<meta description>`, `og:image`, `html lang="es"` y
    `apple-mobile-web-app-title`. Todos son metadatos, ninguno pesa, y todos
    afectan directamente a cómo se ve `ajilei.io` compartido en un chat — que es
    justo el trabajo que la portada viene a hacer.

---

## Cobertura declarada

**Cubierto y verificado con bytes:** los 21 puntos de los cuatro bloques.

**Lo que quedó marcado [NO VERIFICADO], y por qué:**

| Punto | Qué falta | Cómo se cierra |
|---|---|---|
| 1.4a | La puerta en teléfono horizontal: es aritmética sobre el CSS, no medición | Una corrida del arnés a 740×360 y 851×393 |
| 3.1 | Si el arte del icono respeta la zona segura del 80 % para `maskable` | Inspección visual del dibujo con máscara circular |
| 3.4 | Standalone en iOS real | El reporte del iPhone que la campaña ya tiene pendiente |
| 4.4 | La cifra sale de análisis estático, no de un panel de red | `page.on('request')` en el arnés de Playwright |
| Oport. 14 | Si algo depende de las reglas de `index.css` antes de retirarla | Grep de `h1`/`h2`/`code` + una pasada visual por las seis pantallas |

**No se instaló ninguna dependencia. No se creó ningún asset. No se borró ningún
archivo. No hay commits ni push.** Un verde de este informe mide lo que dice.
