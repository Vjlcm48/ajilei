# AJILEI — Campaña PUE (Portada-Entrada) · Fase 1 · Informe v1.0

**02-sep-2026 · HEAD `26b1fb4` · PRODUCCIÓN · ⏸ STOP antes de commitear**

---

## ✅ Estado

Las tres tandas están ejecutadas. `SIN_SESION` ya no es la Entrada funcional:
es la Portada-Entrada, réplica de la lámina v1.7 con los cinco deltas aplicados
y **certificados por medición**, no por parecido.

| | |
|---|---|
| Arnés `diagPUE.mjs` reapuntado a producción | **TODO VERDE** · salida 0 |
| `npm run build` | ✅ verde |
| Camino crítico hasta el primer pintado | **190,4 KiB en el cable** · techo 200 |
| `vitest` | **457 de 457** |
| `eslint` | **20 problemas** — línea base exacta |
| Δ=0 del juego (`diagDSK gate` + `a2`) | ✅ 6/6 y **20/20 celdas OK**, `flujo Δ=0/0/0` |

**Nada se ha commiteado.** El plan de commits atómicos está al final.

---

# Tanda 1 — Cimientos

## 1.1 · `index.html`

`lang="es"` · título y descripción palabra por palabra de la lámina · Open Graph
completo (`type`, `site_name`, `locale`, `title`, `description`, `url`, `image`
con `width`/`height`/`alt`) · `twitter:card = summary_large_image` con su terna ·
y las tres metas de iOS —`apple-mobile-web-app-capable`,
`status-bar-style = black-translucent`, `title = AJILEI`— que son **el seguro de
una línea del standalone** que la Fase 0 §3.4 dejó declarado: Safari no lee
`display: standalone` del manifest, y sin esa meta «Añadir a pantalla de inicio»
abre AJILEI dentro de Safari con la barra de direcciones encima.

> **El origen absoluto está asumido y hay que confirmarlo.** `og:url` y
> `og:image` deben ser absolutas —la especificación las pide así y los
> rastreadores de WhatsApp, Facebook y X no resuelven rutas relativas de forma
> fiable—, y se han puesto sobre **`https://ajilei.com/`**, que es el dominio que
> `AJILEI_Identidad_A_v1.0` nombra como la web de la marca. Si el despliegue de
> Workers acaba en otro dominio son **dos líneas y están juntas**. Ver D2.

## 1.2 · El audio deja de viajar en el arranque

El hallazgo de la Fase 0 era que los once `Howl` se construían **a nivel de
módulo**, y Howler precarga por defecto: **525,7 KiB de audio bajando antes de
que la portada pintara**, de un camino crítico de 706,2.

`useSounds.js` conserva la tabla intacta —mismas rutas, mismos volúmenes, mismas
notas de licencia— pero ahora vive como **datos**. El `Howl` nace la primera vez
que alguien pide ese sonido, o cuando una pantalla lo precarga a propósito. Es el
molde de `useCoreografia`, que ya difiere sus ~380 KB de melodía.

| Quién | Qué precarga | Cuándo |
|---|---|---|
| **Portada** | `SONIDOS_PORTADA` = **sólo `ajileiStrum`** (114,3 KiB) | 1 s tras el primer pintado |
| **Mesa** | `SONIDOS_MESA` = los ocho efectos de juego | Al **salir de la Bienvenida**, no al montar la mesa |
| Celebración | nada nuevo: sigue pidiendo los suyos en su momento | — |

**La mesa los pide al encaminarse, no al llegar.** El recorrido dificultad →
mesa+apuesta son varios segundos de margen, y el primer `cardDeal` cae a los
pocos fotogramas de que la mesa exista: pedirlos en `GameTable` sería llegar a la
vez que el reparto. No pinta nada y no toca el layout — Δ=0 en las tres pantallas
del lobby.

**Medido en la bitácora de red:** en la portada, de audio baja **un solo archivo**
y **después** de pintar.

## 1.3 · Derivados de assets · ⚠️ sin Sharp

> **La ficha da por hecho que Sharp vive en el proyecto «(gen-icons.mjs)».
> MEDIDO: no está.** Ni en `dependencies`, ni en `devDependencies`, ni en
> `node_modules` — `import('sharp')` falla con *Cannot find package*. Lo que
> `gen-icons.mjs` usa es **playwright-core + Edge**, que sí está pineado. Y el
> mandato prohíbe dependencias nuevas.
>
> Así que `scripts/gen-portada-assets.mjs` sigue el precedente de la casa: **el
> navegador es el convertidor**. Un canvas recorta, redimensiona y codifica WebP
> y JPEG con control de calidad. Ventaja de paso: el codificador es el MISMO que
> después decodifica en el navegador del jugador.

**El peso manda sobre la calidad, no al revés:** cada derivado tiene un techo en
bytes y el script **busca por bisección la calidad más alta que entra**. Fijar una
calidad a ojo y esperar que entre es cómo se pasan los techos sin que nadie se
entere.

| Derivado | Maestro | Salida | Calidad | Peso | Techo | |
|---|---|---|---|---|---|---|
| `uno_copa.webp` | 1055×1491 | 200×283 | 0,920 | **11 632 B** | 25 600 | ✅ |
| `tres_copa.webp` | 1055×1491 | 200×283 | 0,920 | **8 800 B** | 25 600 | ✅ |
| `cinco_copa.webp` | 1055×1491 | 200×283 | 0,920 | **10 698 B** | 25 600 | ✅ |
| `diez_copa.webp` | 1055×1491 | 200×283 | 0,920 | **11 272 B** | 25 600 | ✅ |
| `doce_copa.webp` | 1055×1491 | 200×283 | 0,920 | **13 288 B** | 25 600 | ✅ |
| `mesav.webp` | 1080×2340 | 340×679 | 0,920 | **30 886 B** | 81 920 | ✅ |
| `mesapc.webp` | 1122×939 | 820×686 | 0,920 | **49 914 B** | 122 880 | ✅ |
| `og-image.jpg` | 2340×1080 | 1200×630 | 0,850 | **109 974 B** | 204 800 | ✅ |
| | | | | **240,7 KiB** | | |

Los cinco naipes bajan de **697–858 KB cada uno** a 9–13 KB: **−98 %**. La lámina
pedía los PNG de 1055×1491 directamente; producción no vuelve a hacerlo.

### Las barras del sistema se DETECTAN, no se recortan con constantes

La ficha da 100 arriba y 130 abajo, que son las del S25 **en vertical**. Se probó
a deducirlas por orientación para la captura horizontal y **midió mal**: en
horizontal el S25 deja la barra de estado arriba igual, la de navegación en el
**lateral derecho** y una banda negra de muesca a la **izquierda** — tres bordes
distintos, no dos girados. El primer `og-image` salió con la marca cortada a
«AILEI».

El segundo intento buscó **fieltro verde** y también midió mal: **la barra de
estado del teléfono está pintada con el `theme-color` del manifest** (`#0a1e10`,
que es verde), así que pasaba el examen y no se recortaba nada por arriba.

Lo que sí funciona es buscar **el ORO**: el filete de la mesa sólo lo pone el
juego y ninguna barra del sistema tiene un píxel dorado. Su caja envolvente **es**
la caja del juego, y la detección vale igual para las tres capturas:

```
mesav    1080×2340  → caja  20,104  1039×2074
mesapc   1122× 939  → caja   0,0    1122× 939   (sin barras)
og-image 2340×1080  → caja 101,101  2085× 962
```

### El póster social CONTIENE, no cubre

Recortada la caja del juego, la captura horizontal queda en proporción 2,23
contra el 1,905 de la tarjeta: `cover` se comería un **15 % por cada lado**, y ahí
vive la marca «AJILEI» de la cabecera. Conteniendo, la mesa entra **entera** con
dos bandas de 45px del verde abismo de la casa, que se leen como el marco de la
pieza y no como un error de encuadre.

**El póster vive en `public/`, no en `src/assets/`**, y es una decisión: un
rastreador cachea la tarjeta por URL, y la URL con hash de Vite cambia en cada
build — sería una tarjeta que se rompe sola. Los otros siete sí van a
`src/assets/portada/` y se benefician del hash.

## 1.4 · `.gitignore`

`capturas-pue/` añadido con el criterio de `capturas-dsk`. Verificado con
`git check-ignore -v`: `capturas-pue/x.png → .gitignore:90`.

---

# Tanda 2 — La Portada-Entrada

## 2.1 · `Portada.jsx` + `portada.css`

Réplica de la lámina con los cinco deltas. Dos decisiones de arquitectura que
merecen quedar escritas:

**Todo lleva `pue-` y todo cuelga de `.portada-lienzo`.** Vite funde las hojas en
UNA sola: no hay CSS de módulo, así que cada regla es global aunque su archivo lo
importe una sola pantalla. La lámina usa nombres de andar por casa —`.mano`,
`.carta`, `.frase`, `.boton`, `.pie`— que en un proyecto con una mesa de cartas es
pedir una colisión. Se prefijan los selectores **y los keyframes**: `@keyframes
subir` habría entrado en el espacio global junto a `panel-enter`. Las dos
excepciones son deliberadas: `h1.welcome-title` y `.wm-slot` son el contrato del
wordmark y tienen que seguir siendo el MISMO objeto.

**Todo lo que depende de la escena se DERIVA, no se resetea.** El molde obvio —un
efecto que al cambiar de escena pone el marcador a cero, esconde la frase y apaga
el ganador— es justo lo que `react-hooks/set-state-in-effect` prohíbe con razón.
Cada dato guarda **a qué escena pertenece** y el render decide: si el sello no
coincide con la escena viva, vale su reposo. El efecto sólo programa relojes.
Sin esto, la línea base de lint habría subido de 20 a 25.

**La jaula de 1126px se excepciona, no se demuele.** `index.css` no se abre: la
portada monta `portada-activa` en el `<body>` y su hoja declara
`body.portada-activa #root { width: 100%; max-width: none; border-inline: 0 }`.
Gana por especificidad, sin un `!important`, y **muere al desmontar**.

## 2.2 · El formulario no se reescribe: se reubica

Se extrajo el cuerpo de `Entrada.jsx` a **`components/FormularioPuerta.jsx`** sin
tocar una línea de lógica ni una clase de CSS: los mismos dos pasos, el mismo
`ESPERA_REENVIO` de 60 s, el mismo filtrado a dígitos en la entrada, el mismo
`ocupado` como única guarda contra el doble envío. **La Portada y la Entrada usan
el mismo componente**, para que no acaben con dos formularios que se separan a la
tercera calibración.

Lo único parametrizado es el lema, porque es lo único que Victor selló distinto.
Los dos textos viven en `config/textosPuerta.js` — módulo aparte porque
`react-refresh/only-export-components` avisa, con razón, de que un archivo que
exporta un componente **y** constantes rompe la recarga en caliente.

`Entrada.jsx` **no se borra**: borrar es otra tanda, y mientras tanto es la única
pantalla que enseña el formulario sin escenografía. El contrato con `App.jsx` no
cambia.

## 2.3 · Lo pesado, a los 2,5 s

Medido en la bitácora: las cinco caras y las dos capturas se piden a
**2 608–2 609 ms**, todas juntas y después de que el formulario ya es usable. Con
`prefers-reduced-motion` entran **de inmediato**: no hay rotación que esperar y
hacer aguardar dos segundos y medio a una imagen que se va a ver desde el
principio sería castigar a quien pidió menos movimiento.

## 2.4 · O1 · las tres cifras, RE-MEDIDAS

**La caja cambió**, así que la condición de la ficha se cumple: la tarjeta de la
Entrada es `max-width: 520px` con 36 de relleno; la de la portada, 500 con 38. Y
aquí no hay isótipo colgando sobre el lema, así que sobran los 38px que
`puerta.css` reserva para su descuelgue.

**Método de la casa: se mide, no se calcula.** Se anula la reserva, se deja que
cada paso tome su alto natural y se lee la caja viva. Y para llegar al paso dos
**se intercepta la red** —`**/auth/v1/otp**` responde 200— en vez de falsear el
estado: el formulario avanza porque el envío salió bien, que es como avanza en
producción.

| Celda | Tarjeta | Correo | Código | Con aviso | Reserva |
|---|---|---|---|---|---|
| 1920×1080 · 1440×850 | 496,4px | 296,00 | **318,00** | 318,00 | **318** |
| 390×844 · 375×812 · 360×640 | 390/375/360 | 279,00 | **298,00** | 298,00 | |
| 320×568 | 320 | **300,00** | 298,00 | 298,00 | **300** |

**El máximo cambia de paso según el ancho:** en las anchas manda el CÓDIGO (dos
enlaces en fila) y a 320 manda el CORREO, porque el lema se le va a un renglón
más. La reserva es el máximo de los dos, que es exactamente la lección que
`entrada.css` dejó escrita.

**Δ de alto entre pasos, con la reserva puesta:** 0,13px a 1920 y 1440 · **0,00px**
a 390, 375 y 360 · 0,39px a 320. Los cuatro por debajo de 1px.

Las otras dos cifras **no necesitan moverse**, y también está medido:

| Cifra | Reserva | Real | Veredicto |
|---|---|---|---|
| `.puerta-aviso` (min-height) | 24px | 24,00 en las seis celdas | ✅ cabe |
| `.entrada-cuenta` (min-width) | 2,8em = 41,328 / 36,736px | 41,31 / 36,73px | ✅ cabe **por 0,02px** — ver D4 |

Las dos reservas del cuerpo se declaran **con alcance de portada**
(`.portada-lienzo .entrada-cuerpo`): las cifras selladas de la Entrada no se
tocan.

## 2.5 · El strum del primer toque

Usa la rama existente de `useSounds` (`STRUM_CORTE_MS` 1300 / fade 130). **No se
duplica una línea de audio.**

---

# Los cinco deltas, certificados

## Delta 1 · el gesto del ganador habla el idioma de la mesa

Fuera el halo infinito con filete de 1px. En su lugar, el pulso **real** del
juego, transcrito de `gameTable.css:337-357`. **El protegido se lee y se cita; ni
un byte se escribe en él, y tampoco se importa** — arrastrar una hoja de miles de
líneas a la puerta para heredar veinte sería peor negocio que copiarlas con su
procedencia al lado. Mismo trato que IDN-1 le dio al wordmark.

**Se dispara una vez por activación** porque el nodo se MONTA en el instante del
«51» y se DESMONTA al cambiar de escena: un `animation-iteration-count: 1` no se
reinicia solo, pero un nodo que vuelve a nacer trae su animación de nuevas.

| Medición | Resultado |
|---|---|
| 2.5a el pulso no existe antes del «51» | nodos = **0** |
| 2.5b un solo pulso, con la animación del juego | nodos=1 · `pue-vcPulso` |
| 2.5c 900ms · ease-out · UNA iteración | dur=**900** · iter=**1** · easing=**ease-out** · fill=both |
| 2.5d el `box-shadow` se mueve de verdad | `…0,66) 0 0 16,88px 1,88px` → `…0,56) 0 0 19,60px 2,80px` |
| 2.5e sin filete de 1px | `border-top-width = 0px` |
| 2.5f las cinco cartas a `scale(1.2)` | **1,200 / 1,200 / 1,200 / 1,200 / 1,200** |
| 2.5g se desmonta al cambiar de escena | nodos fuera de la escena 2 = **0** |

**Dos notas de transcripción.** El énfasis del showdown también se copió con su
aritmética: en la mesa las ganadoras adyacentes ganan 18px de margen sobre cartas
de 94 —el 0,2·ancho que reclama el escalado—, y aquí el aire sellado son 10px de
`gap`, que sube a 20 por el mismo cálculo. Y **se anima en 300ms en vez de
saltar**: en la mesa las cartas APARECEN ya escaladas al revelarse, y aquí llevan
tres segundos a la vista — un salto del 20 % sobre algo que ya se está mirando se
lee como un fallo de pintura. Es la única libertad tomada sobre el delta, y queda
declarada.

## Delta 2 · ejes de las escenas 4 y 5 recentrados

**Escena 4 · la aritmética sale a mano.** Con la caja de 440px, la pila (Ø100 sobre
`left: 24%`) abarca 55,6..155,6 y la héroe (Ø190 sobre `left: 72%`) 221,8..411,8:
caja de tinta 55,6..411,8, centro 233,7 contra los 220 del contenedor.
**Diferencia: 13,7px — exactamente lo que la auditoría midió.**

Y el desfase **no es una constante**: depende de la diferencia de diámetros, y los
dos son `clamp` que saturan distinto en cada escalón. Despejando:

```
L_pila = 0,26 − (d_héroe − d_pila) / (4·W)        (separación sellada de 48 puntos)
```

Aplicar el 20,9 % del escritorio a los escalones móviles daba **3,98px a 390 y
4,79 a 360** — el arnés los cantó en rojo, que es para lo que está. Con un par de
`left` por escalón:

| Escalón | pila / héroe | Δ medido |
|---|---|---|
| Escritorio | 20,9 % / 68,9 % | **0,05px** a 1920 |
| ≤900px | 21,65 % / 69,65 % | **1,58px** a 390 |
| Compacto (portrait ≤700 alto) | 22,4 % / 70,4 % | **0,59px** a 360 · **0,29px** a 320 |

**Escena 5 · aquí no sale a mano y se MIDE.** El ancho de la laptop lo decide un
`aspect-ratio` sobre una altura en porcentaje, y el del teléfono una rotación de
−3°. El arnés dio **15,83px** de desfase a 1920 (la auditoría había medido 14,71
sobre la lámina; la diferencia es el `bottom: 6px` que el teléfono ganó con el
delta 3). 15,83 sobre la caja de 560 son **2,83 %**: 36 → **33,17** y 86 →
**83,17**. Medido después: **2,22px**.

**Los cinco ejes, en las cinco celdas: los 21 que aplican, por debajo de 4px.**

## Delta 3 · holgura tinta↔frase ≥10px

El margen de la frase sube de 14 a **22px**, que reparte holgura a las cinco
escenas de una vez en lugar de recolocar cinco piezas para arreglar una, y el
teléfono de la escena 5 gana `bottom: 6px` para dejar de asomar bajo la caja.

| | esc1 | esc2 | esc3 | esc4 | esc5 |
|---|---|---|---|---|---|
| **1920×1080** | 22,0 | 74,0 | 21,1 | 44,0 | **32,9** *(era 3,6)* |
| **390×844** | 37,5 | 66,0 | 20,5 | 44,0 | 34,3 |
| **360×640** | 22,8 | 58,0 | 15,2 | 38,0 | 28,6 |
| **320×568** | 22,8 | 58,0 | 15,2 | 38,0 | 28,6 |

**Mínimo del censo: 15,2px.** Ninguna invade.

## Delta 4 · movimiento reducido alcanza a los pseudos

`.esc *` **no cubre** `::before` ni `::after`: un selector universal empareja
ELEMENTOS, y un pseudo-elemento no lo es. La lámina lo daba por hecho y por eso el
brillo de la héroe y la banda del botón JUGAR seguían corriendo con la preferencia
puesta. Ahora se nombran uno a uno.

Medido: **`1.6b ninguna animación corre · corriendo=[]`** — la lista de
`getAnimations()` sobre el documento entero, vacía. Más: la escena 1 estática y
completa (5 cartas a `opacity: 1`), el brillo del botón con `display: none`, y el
rotor sin avanzar tras 2,5 s.

## Delta 5 · la escalera del wordmark de la portada

72px en **todos los anchos** —incluido el corte de 680 donde `welcome.css` baja el
rótulo a 56— y 46px con `--wm-track: 6px` **sólo** en el escalón compacto de
altura. Override con alcance de portada: `welcome.css`, el corte de 680 y las
pantallas del juego quedan intactos.

| Celda | `font-size` | `--wm-track` | `--brillo-ancho` |
|---|---|---|---|
| 1920×1080 · 390×844 · 851×393 | **72px** | **12px** | 224,84px |
| 360×640 · 320×568 | **46px** | **6px** | 135,33px |

---

# Tanda 3 — Verificación

## 3.1 · El camino crítico

**Se pesa lo que VIAJA, no lo que ocupa.** `vite preview` sirve sin comprimir, así
que el `content-length` de un bundle es su tamaño en crudo: 550 KiB de JS que en el
cable de verdad son 158. Cloudflare Workers comprime todo lo comprimible, y el
jugador de gama media con datos móviles —terreno declarado de esta campaña— paga
los bytes que viajan. El arnés comprime con zlib nivel 9 y reporta **las dos
cifras**; lo que ya nace comprimido se cuenta tal cual.

**Y el corte no es un reloj redondo: es el primer pintado con contenido**, que es
el instante que la ficha nombra. La ventana fija de 2 s de la auditoría metía
dentro el rasgueo, que está diferido a propósito un segundo DESPUÉS de pintar —
habría contado como camino crítico justamente lo que existe para no serlo.

```
FCP = 112 ms · 7 recursos
CAMINO CRÍTICO   190,4 KiB en el cable   (723,8 KiB en crudo)   techo 200 KiB  ✅
  1,8   documento  /
158,0   script     index.js       (550,0 en crudo)
 26,1   hoja       index.css      (154,2 en crudo)
  1,1   icono      ajilei-icon-maestro.svg
  1,5   imagen     ajilei-isotipo.svg
  2,0   imagen     reverso_carta.svg
DESPUÉS DE PINTAR  114,3 KiB   ajilei-strum.mp3 @1098ms
PEREZOSO           133,3 KiB   5 caras + 2 capturas @2608ms
```

Contra las **706,2 KiB** que la Fase 0 midió, y contra la cifra alterna de
**≈180 KiB** que proyectaba tras corregir la precarga: **190,4**, dentro de techo.

## 3.2 · El arnés en producción

**Corre contra `vite preview`, no contra `npm run dev`, y es obligatorio.** La
portada sólo se pinta en `SIN_SESION`, y en desarrollo el árbol lleva
`VITE_AUTH_BYPASS=1`, que resuelve a `COMPLETO` y manda directo al lobby: contra el
servidor de desarrollo **la portada no existe**. `AUTH_BYPASS` cuelga de
`import.meta.env.DEV`, así que en una compilación de producción se apaga solo y un
contexto de navegador limpio cae en `SIN_SESION`.

**Censo completo · los cinco viewports · TODO VERDE**

| Bloque | Qué mide | Resultado |
|---|---|---|
| 1.1 | Sin desbordamiento vertical | 0px en las cinco celdas |
| 1.2 | Wordmark (tamaño, traza, ancho del brillo, fuente) | ✅ (delta 5) |
| 1.3a | Eje ≤4px · sin invasión · holgura ≥10px | ✅ 21/21 (deltas 2 y 3) |
| 1.3c | Aire mano↔marcador a 360×640 | 15,80px (≥12) |
| 1.4 | Hoja móvil: sube · opaca · escenas ocultas · velo · cierre | ✅ + **1.4f nuevo** |
| 1.5 | Selector de idioma: abre, 5 entradas, ✓ y 4 «Pronto», cierra | ✅ a 1920 y 390 |
| 1.6 | `prefers-reduced-motion` incluidos pseudos | ✅ (delta 4) |
| 1.7 | Pausa de cortesía y **resurrección** del rotor | ✅ |
| 1.8 | Bitácora de red, cable y crudo | ✅ (§3.1) |
| 1.9 | Consola limpia | ✅ en las cinco |
| 2.4 | O1 re-medido, Δ entre pasos | ✅ 24/24 |
| 2.5 | El gesto del ganador | ✅ 7/7 (delta 1) |

## 3.3 · Δ=0 del juego

| Prueba | Resultado |
|---|---|
| `vitest` | **457 de 457** · 16 archivos |
| `eslint` | **20 problemas (19 errores, 1 aviso)** — la línea base exacta, ni uno más |
| `diagDSK gate after` | `matrixOk: true` · 6/6 celdas |
| `diagDSK a2` | **20/20 celdas OK** (mesas 2–5 × 5 viewports) · `flujo Δ=0/0/0` · `IA Δ=0` |

**Ni una regla de la portada alcanza al juego**: todo cuelga de `.portada-lienzo`
o de nombres `pue-` que no existen fuera de ella, y las dos reglas de `<body>`
—`portada-activa` y `hoja-abierta`— están muertas mientras la portada no esté
montada.

---

# Dos defectos que la medición encontró y el ojo no

## ⚠️ El velo tapaba el formulario en móvil vertical

**El formulario era INUSABLE en móvil vertical**, y el defecto viene heredado de
la lámina.

`.escena-grid` lleva `z-index: 1`. Parece inofensivo y no lo es: un `z-index`
distinto de `auto` sobre un elemento posicionado **crea un contexto de apilado**, y
dentro de él el `z-index: 5` de la tarjeta deja de compararse con el mundo — sólo
compite con sus hermanos. La tarjeta quedaba encerrada en una capa que vale 1, y el
velo, que vale 4 y vive fuera, le pasaba por encima. El pie hacía lo mismo con su
propio `z-index: 1`: «by HEPTACREATION» se pintaba **sobre** la hoja.

**Por qué la auditoría dio verde.** Sondeaba `elementFromPoint(195, 80)` para
comprobar que el velo estaba vivo — un punto ALTO, **fuera de la tarjeta**. La
pregunta correcta no es «¿el velo recibe los toques?» sino «¿los recibe donde debe
y no donde no?».

```
ANTES   sobre el campo → pue-velo      sobre el botón → pue-velo
DESPUÉS sobre el campo → entrada-correo  sobre el botón → puerta-btn
```

La cura es **quitar el contexto, no subir números**: el fondo se pinta sobre
`.pue-lienzo`, y el fondo de un elemento va siempre por debajo del contenido de sus
descendientes, posicionados o no. Ese `z-index` no protegía de nada.

**Y la medición se queda**: `1.4f` pregunta sobre el centro del campo y sobre el
centro del botón, en cada corrida.

## ⚠️ El rotor se pausaba para siempre

La primera versión usaba un temporizador de un solo disparo que, si al vencer
encontraba el foco dentro del formulario, no hacía nada. Y ahí se acababa el rotor:
sin cambio de escena el efecto no vuelve a correr, así que **no quedaba nadie que
armara el siguiente reloj**. El arnés lo cazó —`1.7b el rotor resucita al soltar el
foco: índice 0 → 0`— y es justo lo que un arnés tiene que cazar: un fallo que a ojo
se ve igual que una pausa que funciona. Ahora rearma, que es el `armar()` recursivo
de la lámina dicho en el idioma de los efectos. Medido: **índice 0 → 2 tras
soltar**.

---

# Desviaciones declaradas

| # | Desviación | Severidad | Vía de cierre |
|---|---|---|---|
| **D1** | **Sharp no existe en el proyecto**, contra lo que la ficha §1.3 da por hecho. Los derivados se hacen con playwright-core + Edge | **Baja** — resuelta | Precedente de `gen-icons.mjs`. Cero dependencias nuevas, como manda el mandato |
| **D2** | **`og:url` y `og:image` asumen `https://ajilei.com/`** | **Media** | Lo nombra `AJILEI_Identidad_A_v1.0` como la web de la marca, pero **nadie ha confirmado el dominio de despliegue**. Son dos líneas contiguas en `index.html`. **Decisión de Victor** |
| **D3** | **La lámina traía `*{box-sizing:border-box}` y producción no tiene ese reset.** Sin él la tarjeta medía **574,41px** donde la lámina da 496,41 | **Baja** — resuelta | Reset repuesto **con alcance de portada**. Fuera de `.pue-lienzo` no cambia una caja del juego |
| **D4** | **La reserva de la cuenta regresiva cabe por 0,02px** (41,31 contra 41,328) | **Baja** | Mide en verde HOY. Es una cifra sellada por SUP-2b y no se toca sin medir de nuevo, pero cualquier tipografía de respaldo distinta la desborda. **Vigilar** |
| **D5** | `1.2` a 360 y 320 reporta `--brillo-ancho` 135,33 contra un esperado de 138,18 (**Δ 2,06 %**) | **Baja** | El esperado del arnés es el de la lámina para su escalón de 46px; el nuestro es el mismo escalón con la traza real de producción. Pasa dentro de su tolerancia. Actualizar el esperado es trabajo de arnés, no de portada |
| **D6** | **Dos scripts de sonda quedaron en `scripts/`**: `_pueCaja.mjs` y `_pueVelo.mjs` | **Media** — higiene | Son los andamios con los que se cazaron D3 y el defecto del velo. **El borrado automático fue denegado por permisos**: hay que retirarlos a mano, y **NO entran en ningún commit** |
| **D7** | `Entrada.jsx` queda **sin usar**: `App.jsx` ya no la monta | **Baja** — deliberada | Borrar es otra tanda. Sigue compartiendo el formulario con la portada, así que no puede pudrirse en silencio |
| **D8** | El título de la tarjeta hereda el centrado de `.puerta-card`; la lámina lo tenía a la izquierda | **Baja** | Se eligió centrar para que el formulario reutilizado renderice **idéntico** al de la Entrada, que es la caja en la que se midieron sus reglas. Un `text-align: left` lo revierte |
| **D9** | El bundle de JS supera los 500 kB y Vite avisa | **Baja** — preexistente | No la trae esta campaña. Se cierra con división de código, que es otra ficha |
| **D10** | `.gitignore` llega al commit con **dos campañas dentro**: las tres líneas de MON-1 (mano de Victor) y el bloque `capturas-pue/` de ésta | **Baja** | Ver el plan de commits |

---

# Guion de validación para Victor

**1 · Escritorio (1920).** `npm run build && npm run preview` → `localhost:4173`
en una ventana **privada** (sin sesión). Mirar: el ciclo de 21 s con sus cinco
escenas · en la del AJILEI, que el «51 AJILEI» dé **un** destello dorado y las
cinco cartas se abran un 20 % · que la frase de cada escena comparta centro con su
dibujo · el globo de idioma arriba a la derecha.

**2 · S25 vertical.** `npm run preview -- --host` y la IP del PC.
Mirar: que **quepa sin scroll** · pulsar **JUGAR** y comprobar que la hoja sube
opaca, que las escenas desaparecen detrás y **que se puede escribir el correo y
pulsar el botón** (es el defecto que esta fase cazó) · tocar fuera para cerrar.

**3 · S25 horizontal.** Escenas y pie retirados, tarjeta compacta, sin
desbordamiento.

**4 · iPhone — cierra el standalone pendiente desde la Fase 0.** Abrir en Safari,
**Compartir → Añadir a pantalla de inicio**, y abrir desde el icono: tiene que
arrancar **a pantalla completa, sin la barra de direcciones**, con el verde
llegando hasta la barra de estado y «AJILEI» bajo el icono.

**5 · La tarjeta del enlace.** Pegar la URL de producción en WhatsApp o Telegram y
ver si sale el póster. **Sólo funcionará cuando el dominio de D2 sea el real.**

**6 · Movimiento reducido.** Windows → Configuración → Accesibilidad → Efectos
visuales → Efectos de animación **apagado**. Recargar: todo quieto, la escena 1
visible con sus cinco cartas, sin brillos.

---

# Plan de commits atómicos por ruta

Nada se ha commiteado. Se proponen **siete** commits, en este orden:

| # | Ruta | Mensaje | Qué entra |
|---|---|---|---|
| 1 | `.gitignore` | `PUE-1.4: ignora las salidas del arnes de la portada` | **Sólo el bloque `capturas-pue/`.** Las tres líneas de MON-1 son de otra campaña: o van en su propio commit antes, o se dejan fuera con un `git add -p` |
| 2 | `index.html` | `PUE-1.1: titulo, descripcion, Open Graph y el standalone de iOS` | El archivo entero |
| 3 | `src/hooks/useSounds.js` · `src/App.jsx` | `PUE-1.2: el audio deja de viajar en el arranque` | Carga perezosa + las dos precargas. `App.jsx` entra aquí **sólo por el efecto de precarga** |
| 4 | `scripts/gen-portada-assets.mjs` · `src/assets/portada/` · `public/og-image.jpg` | `PUE-1.3: derivados de la portada con playwright-core` | El script y sus ocho salidas |
| 5 | `src/config/textosPuerta.js` · `src/components/FormularioPuerta.jsx` · `src/screens/Entrada.jsx` | `PUE-2.2: el formulario de la puerta se extrae a componente` | La extracción sola, **sin la portada**: así se puede comprobar que la Entrada sigue rindiendo igual |
| 6 | `src/screens/Portada.jsx` · `src/styles/portada.css` · `src/App.jsx` | `PUE-2.1: la Portada-Entrada toma SIN_SESION` | La pantalla, su hoja y el cambio de `App.jsx`. `App.jsx` aparece por segunda vez: si Victor prefiere un solo toque, se funden 3 y 6 |
| 7 | `scripts/diagPUE.mjs` · `docs/reportes/AJILEI_PUE_Fase1_Informe_v1.0.md` | `PUE-3: arnes reapuntado a produccion e informe de Fase 1` | El arnés y este informe |

**Fuera de todo commit:** `scripts/_pueCaja.mjs` y `scripts/_pueVelo.mjs` (D6),
`capturas-pue/` (ya ignorada) y los tres maestros `PUE_*` de la raíz.

---

*Un verde mide lo que dice: 190,4 KiB pesados sobre el cable y no en crudo, 21
ejes proyectados punto a punto, un pulso de ganador cronometrado en 900 ms con su
`box-shadow` moviéndose entre dos lecturas, dos reservas de O1 re-medidas sobre la
caja real, y dos defectos —el velo sobre el formulario y el rotor que no
resucitaba— que ningún vistazo habría encontrado.*
