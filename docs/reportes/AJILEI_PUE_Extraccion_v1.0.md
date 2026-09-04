# AJILEI — Campaña PUE · Extracción v1.0

**Solo lectura · 30-ago-2026 · HEAD `26b1fb4` · insumo para la lámina v1.1**

Dos extracciones. Ningún archivo de `src/`, `public/`, raíz o configuración fue
modificado; los protegidos se leyeron y no se tocaron. Sin commits, sin push, sin
dependencias. Entregable único: este informe.

**Aviso de cabecera — leer antes que nada.** Los dos bloques traen una sorpresa
que cambia la lámina:

1. **El wordmark NO se pinta en Arial.** Se pinta en `system-ui` → Segoe UI, y con
   `font-weight: 500`, porque el `<h1>` hereda esas dos cosas de `index.css` —la
   hoja del andamio de Vite que la Fase 0 ya señaló—. Un clon que use
   `--font-base` sale mal, y además rompe la geometría del isotipo, que está
   calibrada sobre la altura de mayúscula de Segoe UI. Ver 1.2.
2. **La mano de la escena 2 vale 51 en mesa de 4, pero el motor NO la declara
   AJILEI.** El número es correcto; la etiqueta no. Ver 2.2.

---

# 1 · El wordmark exacto, como vive adentro

## 1.1 El marcado que emite `Wordmark.jsx`

**Archivo:** `src/components/Wordmark.jsx` (127 líneas). El componente devuelve un
**fragmento sin caja propia** — no hay envoltorio: los dos `<span>` cuelgan
directamente del anfitrión.

```jsx
import isotipoUrl from '../assets/ajilei-isotipo.svg?no-inline';

export function Wordmark() {
  const slotRef = useRef(null);
  const ileiRef = useRef(null);
  useMedidaDelConjunto(slotRef, ileiRef);
  return (
    <>
      <span className="wm-slot" ref={slotRef}>
        <img
          className="wm-iso"
          src={isotipoUrl}
          alt=""
          aria-hidden="true"
          draggable="false"
        />
      </span>
      <span className="wm-ilei" ref={ileiRef}>ILEI</span>
    </>
  );
}
```

**El HTML resultante, tal cual llega al DOM** (con su anfitrión, que es quien
lleva el `aria-label`):

```html
<h1 class="welcome-title" aria-label="AJILEI"
    style="--brillo-ancho: 224.84px; --brillo-slot-dx: 167.58px;">
  <span class="wm-slot"><img class="wm-iso" src="/assets/ajilei-isotipo-1xvsJHgr.svg"
        alt="" aria-hidden="true" draggable="false"></span><span class="wm-ilei">ILEI</span>
</h1>
```

Las dos custom properties del `style` **no están en el JSX**: las escribe el
efecto de layout en el elemento padre, en tiempo de ejecución (ver más abajo).

**El `aria-label` es del ANFITRIÓN, no del componente.** Al convertir «AJ» en
símbolo, el texto del elemento pasa a leerse «ILEI». Por eso el `<h1>` lleva
`aria-label="AJILEI"` y el `<img>` va `alt=""` + `aria-hidden="true"`: la marca se
anuncia **una vez y entera**. Los tres anfitriones vivos hoy lo cumplen —
`WelcomeScreen.jsx:41`, `Entrada.jsx:97`, `Bautizo.jsx:74`.

**El isotipo se importa con `?no-inline`** (`Wordmark.jsx:5`). El activo pesa
4 054 B, justo por debajo del umbral de 4 096 con que Vite convierte a data URI;
sin el sufijo, el nombre del archivo —que `Identidad A §5.4` declara **ID de
contrato**— desaparecería del build. Por eso viaja como archivo con hash y no
incrustado. La máscara de `embellecimiento.css:329` repite el mismo `?no-inline`
por idéntica razón.

**Lo que el componente hace además de pintar: mide.** `useMedidaDelConjunto`
(líneas 66-107) escribe **dos longitudes que el CSS no puede conocer**, como
custom properties **sobre el elemento padre**:

| Propiedad | Qué es | Medido |
|---|---|---|
| `--brillo-ancho` | Del borde izquierdo de `.wm-slot` al derecho de `.wm-ilei` | 224,84px a 1920 · 168,22px a 375 |
| `--brillo-slot-dx` | Del borde izquierdo del *padding-box* del `<h1>` al de `.wm-slot` | 167,58px a 1920 · 53,39px a 375 |

**No es slot + ilei.** Entre los dos está el hueco de `--wm-track` (12px en la
Bienvenida, 8 a ≤680). Sumar los anchos daba **212,85** donde la medida da
**224,84** — 11,99px de diferencia, que es exactamente la traza.

Detalles del efecto que el clon debe respetar:
- Es `useLayoutEffect`, no `useEffect`: corre **antes de pintar**, así que el
  primer fotograma ya sale con la luz dimensionada en vez de con la banda a cero.
- Un `ResizeObserver` sobre el **anfitrión**, no sobre los spans: `.wm-slot` y
  `.wm-ilei` son inlines no reemplazados y el observador los ignora por
  especificación.
- `document.fonts.ready` vuelve a medir cuando la fuente del sistema se resuelve,
  bajo guarda (`document.fonts` no existe en todos los terrenos).
- El origen X descuenta el borde: `h.left + parseFloat(cs.borderLeftWidth)`,
  porque el origen del fondo es el *padding-box*.
- Degradación declarada: si el JS no llega a fijarlas, valen `0px`, la banda mide
  cero y **no se pinta** — el título se queda con su degradado tonal. Nunca un
  título roto.

## 1.2 Todas las reglas CSS que lo visten

### 1.2.0 — La herencia que nadie declara, y sin la cual el clon sale mal

Antes de las tres hojas propias, el `<h1>` recibe cuatro propiedades de
**`src/index.css`**, la hoja del starter de Vite que sigue viva:

| Propiedad | Valor | Origen | ¿La sobrescribe alguien? |
|---|---|---|---|
| `font-family` | `system-ui, 'Segoe UI', Roboto, sans-serif` | `index.css:69-71` (`h1, h2`) | **No** |
| `font-weight` | **`500`** | `index.css:72` | **No** |
| `color` | `var(--text-h)` | `index.css:73` | Sí — `welcome.css:46` |
| `line-height` | **`26,1px`** | `index.css:19` (`:root { font: 18px/145% }` → 18 × 1,45) | **No** |

> **Esto es lo más importante de todo el bloque 1.** El wordmark **no** se pinta en
> `--font-base: Arial`: se pinta en **`system-ui`**, que en Windows resuelve a
> **Segoe UI**. Y no es un detalle cosmético: `--wm-cap: 0.7002em` es
> **1434/2048 em, la altura de mayúscula sellada de Segoe UI**, medida con
> `actualBoundingBoxAscent` en los cinco tamaños del censo
> (`embellecimiento.css:415-421`). Todo el calibre del isotipo cuelga de esa
> constante. Un clon en Arial descoloca el símbolo respecto de la altura de «ILEI»,
> que es justo lo que el encargo de Identidad A pidió que coincidiera.

La interlínea de **26,1px** es la otra pieza crítica: con `font-size: 72px` y
`line-height: 26,1px` el medio interlineado es **negativo**, y de ahí sale la
técnica FL-1 entera (§1.2.3). El código la cita como «26,09px»; la aritmética da
26,10 — la diferencia es redondeo de subpíxel y no cambia nada.

`index.css` también aporta `h1 { font-size: 56px; letter-spacing: -1.68px;
margin: 32px 0 }`, pero los tres los gana `.welcome-title` (0,1,0 contra 0,0,1).

### 1.2.1 — `welcome.css` · el rótulo

```css
/* src/styles/welcome.css:45-50 */
.welcome-title {
  color: var(--gold-brand);
  font-size: 72px;
  letter-spacing: 12px;
  margin: 0 0 14px;
}

/* src/styles/welcome.css:238-241 — dentro de @media (max-width: 680px) */
.welcome-title {
  font-size: 56px;
  letter-spacing: 8px;
}
```

También del mismo archivo, el contexto del documento:

```css
/* src/styles/welcome.css:1-7 */
body {
  margin: 0;
  min-height: 100vh;
  background: var(--green-abyss);
  color: var(--text-primary);
  font-family: var(--font-base);
}
```

El `font-family: Arial` del `body` **no llega al `<h1>`**: la regla `h1, h2` de
`index.css` gana a la herencia.

### 1.2.2 — `embellecimiento.css` · el resplandor EMB-1 / VIS-4b

Todo dentro de `@supports ((background-clip: text) or (-webkit-background-clip:
text))` (línea 151). **El `@supports` es la red**: `color: transparent` sin recorte
por texto dejaría el título invisible; donde el recorte no exista no entra nada y
manda el dorado plano de `welcome.css`.

Registro de la propiedad animada (líneas 41-46). **Sin él no interpola** — una
custom property sin `@property` no se anima:

```css
@property --brillo-x {
  syntax: '<length>';
  inherits: true;      /* dos consumidores: el fondo del <h1> y el pseudo del isotipo */
  initial-value: 0px;
}
```

Bloque principal (líneas 157-277), `h1.welcome-title, h1.cel-ajilei`:

| Token | Valor | Papel |
|---|---|---|
| `--brillo-recorrido` | `1.5s` | Viaje de la luz |
| `--brillo-pausa` | `2.5s` | Reposo |
| `--brillo-banda-frac` | `.35` | La banda es 35 % del conjunto |
| `--brillo-banda` | `calc(--brillo-ancho * .35)` | Derivado |
| `--brillo-ancho` | `0px` (lo fija el JS) | Ancho del conjunto |
| `--brillo-slot-dx` | `0px` (lo fija el JS) | Desplazamiento del slot |
| `--emb-titulo-banda` | `#fff6e0` | Blanco cálido, **no un segundo dorado** |
| `--emb-titulo-aire` | `0.55em` | Crecimiento de la caja de pintura |
| `--emb-titulo-margen-base` | `14px` | Espeja `welcome.css:49` |

```css
padding-top:    var(--emb-titulo-aire);
padding-bottom: var(--emb-titulo-aire);
margin-top:     calc(-1 * var(--emb-titulo-aire));
margin-bottom:  calc(var(--emb-titulo-margen-base) - var(--emb-titulo-aire));

background-image:
  /* (b) LA LUZ — capa de arriba, la única que se mueve */
  linear-gradient(100deg,
    rgba(255, 246, 224, 0)   0%,
    var(--emb-titulo-banda) 50%,
    rgba(255, 246, 224, 0) 100%),
  /* (a) ORO DE MÚLTIPLES TONOS — capa base, siempre presente */
  linear-gradient(180deg,
    var(--gold-brand-hi)    0%,
    var(--gold-brand)      52%,
    var(--gold-brand-deep) 100%);

background-size: var(--brillo-banda) 3em, 100% 1em;
background-repeat: no-repeat;
background-position-x: calc(var(--brillo-x) + var(--brillo-slot-dx)), 0px;
background-position-y: center, center;

-webkit-background-clip: text;
background-clip: text;
color: transparent;
-webkit-text-fill-color: transparent;

animation: emb-brillo calc(var(--brillo-recorrido) + var(--brillo-pausa)) linear infinite;
```

**Tres decisiones que el clon no debe simplificar:**
- **Los ejes van separados.** La X de la capa de luz se anima y la de la capa tonal
  es `0`; ambas comparten `center` en Y. Con la abreviatura `background-position`
  no se puede animar sólo una capa en un solo eje.
- **Las alturas van en `em`, jamás en `%`.** El porcentaje se mide contra la caja
  de relleno, que acaba de crecer con `--emb-titulo-aire`: el degradado tonal se
  estiraría sobre el aire en vez de sobre las letras.
- **La suma `--brillo-x + --brillo-slot-dx`.** `--brillo-x` vive en coordenadas
  del *conjunto* (0 = borde izquierdo de `.wm-slot`); el origen de fondo del `<h1>`
  es su padding-box, que empieza `--brillo-slot-dx` más a la izquierda porque el
  rótulo va centrado. Sin la suma, el viaje recorre el cajón vacío de la izquierda
  y se para 57px después de empezar el wordmark, sin llegar nunca a la última «I».

**La misma luz sobre el isotipo** (líneas 311-337). Una `<img>` no hereda `color`,
así que el fondo recortado a texto nunca la alcanza. Se pinta por segunda vez en
un **pseudo hermano** —el `<img>` no se toca— con la misma geometría, recortado a
la silueta del activo:

```css
h1.welcome-title .wm-slot::after,
h1.cel-ajilei .wm-slot::after {
  content: '';
  position: absolute;
  left: 0;
  bottom: calc(var(--wm-desc) - 0.4167 * var(--wm-cap));
  width:  var(--wm-cap);
  height: calc(1.5 * var(--wm-cap));
  pointer-events: none;

  background-image: linear-gradient(100deg,
    rgba(255, 246, 224, 0)   0%,
    var(--emb-titulo-banda) 50%,
    rgba(255, 246, 224, 0) 100%);
  background-size: var(--brillo-banda) 100%;
  background-repeat: no-repeat;
  background-position-x: var(--brillo-x);   /* SIN sumar dx: ya está en coordenadas del slot */
  background-position-y: center;

  -webkit-mask-image: url('../assets/ajilei-isotipo.svg?no-inline');
          mask-image: url('../assets/ajilei-isotipo.svg?no-inline');
  -webkit-mask-size: 100% 100%;  mask-size: 100% 100%;
  -webkit-mask-repeat: no-repeat; mask-repeat: no-repeat;
}
```

La caja del pseudo **copia la del `<img>` con las mismas expresiones, no con
números**, para que una recalibración de Identidad A mueva las dos juntas. Y el
centro de la banda cae en el mismo sitio en ambas capas pese a tener alturas
distintas (3em contra ~1,05em): la línea de un degradado lineal pasa siempre por
el centro de su caja, así que la parada del 50 % está en el centro horizontal sea
cual sea el ángulo.

**El recorrido** (líneas 378-382):

```css
@keyframes emb-brillo {
  0%    { --brillo-x: calc(-1 * var(--brillo-banda)); }
  37.5% { --brillo-x: var(--brillo-ancho); }
  100%  { --brillo-x: var(--brillo-ancho); }
}
```

El **37,5 %** es el único número que CSS no deja tokenizar —una parada de keyframe
no admite `calc()` con variables— y sale de `recorrido / (recorrido + pausa) =
1,5 / 4 = 0,375`. **Si se mueven los tokens hay que mover esta parada con ellos.**
El resto del ciclo la luz está aparcada fuera, a la derecha: el salto de vuelta
ocurre con la banda ya invisible, así que **no hay destello de retorno**.

**Movimiento reducido** (líneas 345-353). No basta `animation: none`: sin
animación `--brillo-x` se queda en `0px` y la banda quedaría **aparcada sobre el
arranque del rótulo, encendida y quieta** —peor que no tenerla—. Se apaga de
verdad:

```css
@media (prefers-reduced-motion: reduce) {
  h1.welcome-title, h1.cel-ajilei { animation: none; --brillo-banda: 0px; }
  h1.welcome-title .wm-slot::after,
  h1.cel-ajilei .wm-slot::after { display: none; }
}
```

### 1.2.3 — `embellecimiento.css` · la técnica FL-1 del isotipo colgante

**El calibre, y de dónde sale** (líneas 396-421). Identidad A §3 sella la caja del
símbolo en 60×90 unidades (ratio 2:3), con la línea base en `svg_y 95` sobre un
viewBox que va de 30 a 120:

```
altura sobre la base = (95−35)/90 = 66,67 % de la caja
cuelgue bajo la base = (120−95)/90 = 27,78 % de la caja
ancho                = 2/3 de la altura
```

Con el requisito del encargo —que la altura sobre la base iguale la altura de
mayúscula de «ILEI», llamada **C**—:

```
alto    = C × 90/60 = 1,5·C
ancho   = 1,5·C × 60/90 = 1,0·C
cuelgue = 1,5·C × 25/90 = 0,4167·C
```

```css
:root {
  --wm-cap:  0.7002em;   /* altura de mayúscula: 1434/2048 em de Segoe UI */
  --wm-desc: 0.25em;     /* descenso de la caja en línea, 0,25 em exacto */
}

.wm-slot {
  position: relative;
  display: inline;                    /* NO inline-block — ver abajo */
  padding-left: var(--wm-cap);        /* la reserva horizontal del símbolo */
  margin-right: var(--wm-track, 0px); /* la traza que repone el letter-spacing */
}

.wm-iso {
  position: absolute;
  left: 0;
  bottom: calc(var(--wm-desc) - 0.4167 * var(--wm-cap));
  width:  var(--wm-cap);
  height: calc(1.5 * var(--wm-cap));
  pointer-events: none;
}
```

**Por qué la ranura es `inline` y no `inline-block`.** El primer intento fue un
`inline-block` de alto cero y **midió mal: +16,91px de alto a 1920 y +10,8 a 360**.
Con `font-size: 72px` y `line-height: 26,1px` el medio interlineado es negativo,
así que el *strut* de la línea termina **16,88px por encima de la línea base**. Una
caja de alto cero apoyada en la base no «no ocupa nada»: ocupa el punto de la
base, que está más abajo que el fondo del strut, y estira la caja de línea hasta
ahí. En la mesa no pasaba —22px de letra con 26,1 de interlínea dejan el strut por
debajo de la base—, lo que explica que **sólo la Bienvenida se moviera**. Y el
crecimiento **no es compensable**: vale `0,414·fs − interlínea/2`, que depende de
dos cosas que cambian por sitio y por breakpoint.

Un `display: inline` no es elemento reemplazado: aporta `line-height` y nada más,
exactamente como una letra. **Crecimiento cero por construcción, en los cinco
tamaños.**

**El oro del isotipo es el SUYO** (Identidad A §5.2, «no recolorear»). Al ser una
imagen no hereda `color`, así que el barrido dorado del `background-clip: text` no
lo alcanza: recorre sólo «ILEI». No hace falta ni una regla para cumplirlo — sale
de cómo pinta cada cosa. *(Es el fallo de Victor del 2026-08-20.)*

**«ILEI» no lleva nada propio.** Es el texto del anfitrión, con su color, su
tamaño, su traza y su barrido. El `<span>` existe sólo para poder medirlo.

**La traza, por anfitrión** (líneas 506-521):

```css
h1.welcome-title  { --wm-track: 12px; }
h1.table-title    { --wm-track:  5px; }
span.vc-ajilei    { --wm-track: 0.23em; }

@media (max-width: 680px)                              { h1.welcome-title { --wm-track: 8px; } }
@media (max-width: 767px) and (orientation: portrait)  { h1.table-title   { --wm-track: 3px; } }
@media (orientation: landscape) and (max-height: 600px){ h1.table-title   { --wm-track: 2px; } }
```

### 1.2.4 — Valores resueltos, los dos escalones

**Escritorio (>680px) · `font-size: 72px` · `--wm-track: 12px`**

| Propiedad | Expresión | Valor resuelto |
|---|---|---|
| `--wm-cap` | `0.7002em` | **50,4144px** |
| `--wm-desc` | `0.25em` | **18px** |
| `.wm-slot` `padding-left` | `var(--wm-cap)` | 50,4144px |
| `.wm-slot` `margin-right` | `var(--wm-track)` | 12px |
| `.wm-iso` `width` | `var(--wm-cap)` | 50,4144px |
| `.wm-iso` `height` | `calc(1.5 * --wm-cap)` | 75,6216px |
| `.wm-iso` `bottom` | `calc(18 − 0.4167×50,4144)` | **−3,0077px** |
| `--emb-titulo-aire` | `0.55em` | 39,60px |
| `padding-top/bottom` | | 39,60px |
| `margin-top` | | −39,60px |
| `margin-bottom` | `14 − 39,60` | −25,60px |
| `background-size` capa luz | `banda × 3em` | banda × 216px |
| `background-size` capa tonal | `100% × 1em` | 100 % × 72px |
| `--brillo-ancho` (medido a 1920) | | 224,84px |
| `--brillo-banda` | `224,84 × 0.35` | **78,69px** |
| `--brillo-slot-dx` (medido a 1920) | | 167,58px |

**Angosto (≤680px) · `font-size: 56px` · `--wm-track: 8px`**

| Propiedad | Expresión | Valor resuelto |
|---|---|---|
| `--wm-cap` | `0.7002em` | **39,2112px** |
| `--wm-desc` | `0.25em` | **14px** |
| `.wm-slot` `padding-left` | | 39,2112px |
| `.wm-slot` `margin-right` | | 8px |
| `.wm-iso` `width` | | 39,2112px |
| `.wm-iso` `height` | | 58,8168px |
| `.wm-iso` `bottom` | `calc(14 − 0.4167×39,2112)` | **−2,3393px** |
| `--emb-titulo-aire` | `0.55em` | 30,80px |
| `margin-bottom` | `14 − 30,80` | −16,80px |
| `background-size` capa luz | `banda × 3em` | banda × 168px |
| `background-size` capa tonal | `100% × 1em` | 100 % × 56px |
| `--brillo-ancho` (medido a 375) | | 168,22px |
| `--brillo-banda` | `168,22 × 0.35` | **58,88px** |
| `--brillo-slot-dx` (medido a 375) | | 53,39px |

**Colores resueltos, iguales en los dos escalones**

| Token | Valor | Dónde |
|---|---|---|
| `--gold-brand-hi` | `#f5dfae` | Parada 0 % del degradado tonal |
| `--gold-brand` | `#e8b84b` | Parada 52 % · y el `color` plano sin `@supports` |
| `--gold-brand-deep` | `#ac7e16` | Parada 100 % |
| `--emb-titulo-banda` | `#fff6e0` | El centro de la banda de luz |
| `--green-abyss` | `#09170e` | Fondo del `body` |
| `--text-primary` | `#f5edd8` | Color del `body` |

**Tiempos:** ciclo `1.5s + 2.5s = 4s`, `linear`, `infinite`; parada del keyframe en
**37,5 %**.

> **Aviso de fidelidad.** `--brillo-ancho` y `--brillo-slot-dx` son **medidas de
> ejecución**, no constantes: dependen del ancho real de «ILEI» con la fuente que
> el navegador resuelva y de dónde queda el rótulo centrado dentro de su
> contenedor. Las cifras de las tablas son las que el código deja anotadas para
> 1920 y 375. **En otro ancho de ventana o con otra familia tipográfica valen
> otra cosa** — por eso el clon lleva el mismo script de medición y no números
> cableados. **[NO VERIFICADO]** con navegador en esta extracción: se transcriben
> las medidas que `embellecimiento.css:181-190` declara.

## 1.3 Bloque de referencia autónomo

Reproduce el wordmark **fuera de React**, con los mismos tokens de `theme.css`.
Se entrega aquí dentro, no como archivo suelto.

**Requisito de montaje:** una copia de `src/assets/ajilei-isotipo.svg` junto al
HTML, con ese nombre. La máscara y el `<img>` la piden por ruta relativa.

### `wordmark.css`

```css
/* ═══ AJILEI · wordmark de referencia · clon 1:1 de h1.welcome-title ═══
   Fuentes: theme.css (tokens) · index.css (herencia) · welcome.css (rótulo)
            embellecimiento.css (EMB-1/VIS-4b + IDN-1/FL-1)
   Los valores NO se cablean: se reproducen las mismas expresiones.          */

/* ── Tokens · calcados de src/styles/theme.css ───────────────────────────── */
:root {
  --gold-brand:       #e8b84b;
  --gold-brand-hi:    #f5dfae;
  --gold-brand-deep:  #ac7e16;
  --green-abyss:      #09170e;
  --green-deep:       #153922;
  --green-bright:     #235c38;
  --gold-dim-rgb:     201, 151, 58;
  --text-primary:     #f5edd8;
  --font-base:        Arial, sans-serif;

  --filigrana:
    repeating-linear-gradient(45deg,
      transparent 0px, transparent 28px,
      rgba(var(--gold-dim-rgb), .05) 28px, rgba(var(--gold-dim-rgb), .05) 29px),
    repeating-linear-gradient(-45deg,
      transparent 0px, transparent 28px,
      rgba(var(--gold-dim-rgb), .05) 28px, rgba(var(--gold-dim-rgb), .05) 29px);

  /* IDN-1 · las dos métricas de la familia, MEDIDAS sobre Segoe UI */
  --wm-cap:  0.7002em;
  --wm-desc: 0.25em;
}

/* ── LA HERENCIA QUE index.css APORTA, y sin la cual esto sale mal ────────
   No es decoración: --wm-cap está calibrada sobre la altura de mayúscula de
   Segoe UI, y la interlínea de 26,1px es de donde sale FL-1 entera.        */
:root { font: 18px/145% system-ui, 'Segoe UI', Roboto, sans-serif; }
h1 { font-family: system-ui, 'Segoe UI', Roboto, sans-serif; font-weight: 500; }

/* ── Contexto · body de welcome.css ──────────────────────────────────────── */
body {
  margin: 0;
  min-height: 100vh;
  background: var(--green-abyss);
  color: var(--text-primary);
  font-family: var(--font-base);
}

/* Lienzo opcional, para verlo en su sitio (copiado de .puerta-screen) */
.lienzo {
  box-sizing: border-box;
  min-height: 100vh;
  display: flex; align-items: center; justify-content: center;
  padding: 24px;
  background:
    var(--filigrana),
    radial-gradient(ellipse at 42% 38%,
      var(--green-bright) 0%, var(--green-deep) 50%, var(--green-abyss) 100%);
}

/* ── El rótulo · welcome.css:45-50 ───────────────────────────────────────── */
.welcome-title {
  color: var(--gold-brand);
  font-size: 72px;
  letter-spacing: 12px;
  margin: 0 0 14px;
}

/* ── IDN-1 · FL-1 · la ranura y el símbolo colgante ──────────────────────── */
.wm-slot {
  position: relative;
  display: inline;                     /* NO inline-block: ver §1.2.3 */
  padding-left: var(--wm-cap);
  margin-right: var(--wm-track, 0px);
}
.wm-iso {
  position: absolute;
  left: 0;
  bottom: calc(var(--wm-desc) - 0.4167 * var(--wm-cap));
  width:  var(--wm-cap);
  height: calc(1.5 * var(--wm-cap));
  pointer-events: none;
}
h1.welcome-title { --wm-track: 12px; }

/* ── VIS-4b · la posición de la luz, tipada y heredable ──────────────────── */
@property --brillo-x {
  syntax: '<length>';
  inherits: true;
  initial-value: 0px;
}

/* ── EMB-1 / VIS-4b · el resplandor ──────────────────────────────────────── */
@supports ((background-clip: text) or (-webkit-background-clip: text)) {
  h1.welcome-title {
    --brillo-recorrido: 1.5s;
    --brillo-pausa: 2.5s;
    --brillo-banda-frac: .35;
    --brillo-banda: calc(var(--brillo-ancho) * var(--brillo-banda-frac));
    --brillo-ancho: 0px;      /* los fija el script; 0 = sin luz, nunca roto */
    --brillo-slot-dx: 0px;
    --emb-titulo-banda: #fff6e0;
    --emb-titulo-aire: 0.55em;
    --emb-titulo-margen-base: 14px;

    padding-top:    var(--emb-titulo-aire);
    padding-bottom: var(--emb-titulo-aire);
    margin-top:     calc(-1 * var(--emb-titulo-aire));
    margin-bottom:  calc(var(--emb-titulo-margen-base) - var(--emb-titulo-aire));

    background-image:
      linear-gradient(100deg,
        rgba(255, 246, 224, 0)   0%,
        var(--emb-titulo-banda) 50%,
        rgba(255, 246, 224, 0) 100%),
      linear-gradient(180deg,
        var(--gold-brand-hi)    0%,
        var(--gold-brand)      52%,
        var(--gold-brand-deep) 100%);
    background-size: var(--brillo-banda) 3em, 100% 1em;
    background-repeat: no-repeat;
    background-position-x: calc(var(--brillo-x) + var(--brillo-slot-dx)), 0px;
    background-position-y: center, center;

    -webkit-background-clip: text;
            background-clip: text;
    color: transparent;
    -webkit-text-fill-color: transparent;

    animation: emb-brillo
      calc(var(--brillo-recorrido) + var(--brillo-pausa)) linear infinite;
  }

  h1.welcome-title .wm-slot::after {
    content: '';
    position: absolute;
    left: 0;
    bottom: calc(var(--wm-desc) - 0.4167 * var(--wm-cap));
    width:  var(--wm-cap);
    height: calc(1.5 * var(--wm-cap));
    pointer-events: none;

    background-image: linear-gradient(100deg,
      rgba(255, 246, 224, 0)   0%,
      var(--emb-titulo-banda) 50%,
      rgba(255, 246, 224, 0) 100%);
    background-size: var(--brillo-banda) 100%;
    background-repeat: no-repeat;
    background-position-x: var(--brillo-x);   /* sin sumar dx */
    background-position-y: center;

    -webkit-mask-image: url('ajilei-isotipo.svg');
            mask-image: url('ajilei-isotipo.svg');
    -webkit-mask-size: 100% 100%;   mask-size: 100% 100%;
    -webkit-mask-repeat: no-repeat; mask-repeat: no-repeat;
  }

  @media (prefers-reduced-motion: reduce) {
    h1.welcome-title { animation: none; --brillo-banda: 0px; }
    h1.welcome-title .wm-slot::after { display: none; }
  }
}

/* 37,5 % = recorrido / (recorrido + pausa) = 1,5 / 4.
   Si se mueven los tokens de tiempo, hay que mover esta parada con ellos. */
@keyframes emb-brillo {
  0%    { --brillo-x: calc(-1 * var(--brillo-banda)); }
  37.5% { --brillo-x: var(--brillo-ancho); }
  100%  { --brillo-x: var(--brillo-ancho); }
}

/* ── Angosto · welcome.css:238 + embellecimiento.css:515 ─────────────────── */
@media (max-width: 680px) {
  .welcome-title   { font-size: 56px; letter-spacing: 8px; }
  h1.welcome-title { --wm-track: 8px; }
}
```

### `wordmark.html`

```html
<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AJILEI · wordmark de referencia</title>
  <link rel="stylesheet" href="wordmark.css">
</head>
<body>
  <div class="lienzo">
    <!-- El aria-label es del ANFITRIÓN: sin él la marca se lee "ILEI". -->
    <h1 class="welcome-title" aria-label="AJILEI"><span class="wm-slot"><img
      class="wm-iso" src="ajilei-isotipo.svg" alt="" aria-hidden="true"
      draggable="false"></span><span class="wm-ilei">ILEI</span></h1>
  </div>

  <script>
  // Clon de useMedidaDelConjunto (Wordmark.jsx:66-107).
  // Las dos longitudes NO son expresables en CSS: el ancho depende de cuánto
  // mide "ILEI" con la fuente que el navegador resuelva de verdad, y el
  // desplazamiento de que el rótulo va centrado.
  (function () {
    var host = document.querySelector('h1.welcome-title');
    var slot = host && host.querySelector('.wm-slot');
    var ilei = host && host.querySelector('.wm-ilei');
    if (!host || !slot || !ilei) return;

    function medir() {
      var s = slot.getBoundingClientRect();
      var i = ilei.getBoundingClientRect();
      var h = host.getBoundingClientRect();
      var cs = getComputedStyle(host);
      // El origen del fondo es el padding-box: borde + ancho del borde.
      var origenX = h.left + parseFloat(cs.borderLeftWidth || 0);
      host.style.setProperty('--brillo-ancho',   (i.right - s.left) + 'px');
      host.style.setProperty('--brillo-slot-dx', (s.left - origenX) + 'px');
    }

    medir();                              // antes del primer pintado posible
    new ResizeObserver(medir).observe(host);   // el <h1>, no los spans inline
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(medir);    // la fuente puede llegar después
    }
  })();
  </script>
</body>
</html>
```

**Comprobación rápida de que el clon salió bien**, en la consola del navegador a
1920 de ancho: `--brillo-ancho` ≈ **224,84px** y `--brillo-slot-dx` ≈ **167,58px**
(este segundo depende de dónde quede centrado el `<h1>`, así que varía con el
ancho del contenedor). Si `--brillo-ancho` sale **≈212,85**, la traza
`--wm-track` no está aplicando. Si sale muy distinto de 224, la tipografía no es
Segoe UI.

**[NO VERIFICADO]**: el bloque se compuso por lectura y transcripción; no se abrió
un navegador en esta extracción para confirmar el render.

---

# 2 · Certificar la mano AJILEI de 51 contra el motor

**Método.** Los valores no se transcribieron: se **ejecutaron** las funciones
reales del motor con Node, importando `src/engine/deck.js` y
`src/engine/handEvaluator.js` sin modificarlos. Los protegidos se leyeron y no se
tocaron.

**Corrección de premisa.** La ficha pide extraer la tabla y la regla «de
`gameEngine.js`». **No viven ahí.** La tabla de puntos está en
**`src/engine/deck.js:9-14`** y la regla del 7 de oro en
**`src/engine/handEvaluator.js:2-6`**. `gameEngine.js` sólo las **consume**
(línea 2, importa las tres; línea 43, congela el snapshot; líneas 144-151, evalúa
el showdown). Dato favorable: **ni `deck.js` ni `handEvaluator.js` están entre los
cinco protegidos** — el único protegido de esta cadena es `gameEngine.js`, y no
hacía falta abrirlo para nada más que leer cómo llama.

## 2.1 La tabla de valores y la regla del 7 de oro

**Puntos por rango — `src/engine/deck.js:9-14`**

```js
export function getCardPoints(value) {
  if (value === 1) return 11
  if (value === 7) return 7
  if (value === 6) return 6
  return 10
}
```

Ejecutado sobre los diez rangos de `VALORES` (`deck.js:2`), con los nombres de
`VALUE_NAMES` (`deck.js:4-7`):

| Carta | `value` | Puntos |
|---|---|---|
| **As** | 1 | **11** |
| 2 | 2 | 10 |
| 3 | 3 | 10 |
| 4 | 4 | 10 |
| 5 | 5 | 10 |
| **6** | 6 | **6** |
| **7** | 7 | **7** |
| Sota | 10 | 10 |
| Caballo | 11 | 10 |
| Rey | 12 | 10 |

> **Ojo con «2–7» como si fuera un tramo.** No lo es: **2, 3, 4 y 5 valen 10**
> —caen en el `return 10` final—, y sólo el 6 y el 7 valen su número. La baraja no
> tiene 8 ni 9 (`VALORES = [1,2,3,4,5,6,7,10,11,12]`).

**La regla del 7 de oro — `src/engine/handEvaluator.js:1-6`**

```js
// numPlayers 2-3: no comodín | 4: comodín=10 | 5: comodín=11
export function getComodinValue(numPlayers) {
  if (numPlayers === 4) return 10
  if (numPlayers === 5) return 11
  return null
}
```

| Jugadores | 7 de Oros vale |
|---|---|
| 2 | **inactivo** (`null`) — cuenta como 7 de Oros normal |
| 3 | **inactivo** (`null`) |
| **4** | **10** |
| **5** | **11** |

**Cómo se aplica** (`handEvaluator.js:8-31`): el comodín se **excluye del recuento
por palo** (línea 14) y su valor se **suma al mejor palo** al final (línea 28). No
pertenece a ningún palo: es un añadido.

**Cuándo se enciende** (`gameEngine.js:40-45` y `:144`): `makeHandRules(ruleN)`
congela `comodinValue: getComodinValue(ruleN)` en el barajado —«null = comodín
inactivo (<4 vivos)»— y el showdown lee `comodinEnabled = comodinValue !== null`.
`ruleN` es el número de **vivos en ese instante**, y no vuelve a moverse durante
la mano: los retiros no lo alteran y la bancarrota recién en el barajado
siguiente.

## 2.2 Certificación de la mano

**La mano:** As de copas + 3 de copas + 5 de copas + Sota de copas + 7 de oro.
**Mesa de 4 jugadores.**

Ejecución real contra el motor:

```
comodinEnabled       : true  (comodinValue=10)
suitScores (sin 7oro): {"Copas":41}
mejor palo           : Copas
PUNTOS TOTALES       : 51
isAjilei(mano, 4)    : false
```

**Aritmética, paso a paso:**

| Carta | Palo | Puntos | Entra al recuento |
|---|---|---|---|
| As de Copas | Copas | 11 | ✅ |
| 3 de Copas | Copas | 10 | ✅ |
| 5 de Copas | Copas | 10 | ✅ |
| Sota de Copas | Copas | 10 | ✅ |
| 7 de Oros | — | (7) | ❌ **excluido**: es el comodín |
| | **Copas** | **41** | |
| | **+ comodín (N=4)** | **+10** | |
| | **TOTAL** | **51** | ✅ |

> ### ✅ El número se certifica: **51**, exactamente lo esperado.
> ### ⚠️ Pero el motor **NO** declara esta mano un AJILEI en mesa de 4.

**Por qué.** `isAjilei(cards, numPlayers)` (`handEvaluator.js:38-61`) reconoce dos
formas, y la mano no encaja en ninguna a N=4:

1. **AJILEI natural** — las cinco del mismo palo y suma 51 (líneas 42-45). Aquí el
   7 de Oros rompe el palo único: hay cuatro Copas y un Oros. **No aplica.**
2. **AJILEI de comodín** — cuatro del mismo palo + 7 de Oros, con `suma4 + 11 = 52`
   (líneas 48-58). La rama está **estrictamente cerrada a `numPlayers === 5`**
   (línea 48). A cuatro jugadores ni se evalúa. **No aplica.**

**La misma mano en las cuatro mesas** (ejecutado):

| Jugadores | Comodín | Puntos | `isAjilei` |
|---|---|---|---|
| 2 | inactivo | 41 | `false` |
| 3 | inactivo | 41 | `false` |
| **4** | **10** | **51** | **`false`** |
| 5 | 11 | **52** | **`true`** |

La mano **sí** es un AJILEI… **a cinco jugadores, y valiendo 52, no 51.** A cuatro
vale 51 y es una mano fuerte y perfectamente legal, pero corriente.

**Lo que eso significa para la escena 2.** La cadena está cableada: `isAjilei`
falso → `celebracionCore.js:66` no devuelve el nivel `'ajilei'` →
`celebracionCore.js:101` no devuelve `'ajileiStrum'` → **el rasgueo no suena** y no
hay tratamiento de AJILEI. Presentar esta mano como «la mano AJILEI de 51» en una
mesa de 4 sería mostrar algo que el propio juego no celebraría.

**Tres salidas, en orden de menor daño al guion:**

**(a) Cambiar el 7 de oro por cualquier copa de 10 puntos.** Certificado con el
motor:

```
As de Copas · 3 de Copas · 5 de Copas · Sota de Copas · Rey de Copas
suma 51
N=2 -> 51  isAjilei true       N=4 -> 51  isAjilei true
N=3 -> 51  isAjilei true       N=5 -> 51  isAjilei true
```

Un **AJILEI natural de 51** que es válido en **las cuatro mesas**, sin depender del
comodín. Es la mano de la ficha con una sola carta cambiada, conserva el 51 y el
palo único de Copas, y hace la escena robusta ante cualquier número de jugadores.
La quinta carta puede ser el 2, 3, 4, 5, Sota, Caballo o Rey de Copas —cualquiera
de 10 puntos—, así que hay margen estético.

**(b) Mantener la mano y mover la mesa a 5 jugadores.** Entonces sí es AJILEI,
pero el rótulo pasa a ser **52**, no 51.

**(c) Mantener mano y mesa de 4, y no llamarlo AJILEI.** Sigue siendo una mano
legal de 51 puntos, sólo que la portada no puede prometer la celebración.

*(La ficha pide reportar si el motor da otro número y explicar por qué. El número
coincide; lo que no coincide es la **clasificación**, y por eso se reporta con el
mismo peso.)*

## 2.3 Las cinco cartas en `src/assets/cards/`

Convención `{numero}_{palo}.png` confirmada contra `NUM_MAP` y `PALO_MAP` de
`src/components/CardImage.jsx:3-11`.

| Carta | `value` | Archivo | Dimensiones | Peso |
|---|---|---|---|---|
| As de Copas | 1 | **`uno_copa.png`** | 1055×1491 | 697 099 B = **680,8 KiB** |
| 3 de Copas | 3 | `tres_copa.png` | 1055×1491 | 495 549 B = 483,9 KiB |
| 5 de Copas | 5 | `cinco_copa.png` | 1055×1491 | 498 615 B = 486,9 KiB |
| Sota de Copas | 10 | **`diez_copa.png`** | 1055×1491 | 571 159 B = 557,8 KiB |
| 7 de Oros | 7 | `siete_oro.png` | 1055×1491 | 925 381 B = **903,7 KiB** |
| | | | **TOTAL** | **3 187 803 B = 3,04 MiB** |

**Dos trampas de nombre.** El As es **`uno_`**, no `as_`; la Sota es **`diez_`**,
no `sota_`. El nombre del archivo sigue el **valor impreso**, no el rótulo:
`NUM_MAP` traduce `1 → 'uno'` y `10 → 'diez'`, mientras `VALUE_NAMES` los muestra
como «As» y «Sota».

Si se adopta la alternativa (a), el Rey de Copas es **`doce_copa.png`** —858 823 B
= 838,7 KiB—, lo que deja la escena en **3 121 245 B = 2,98 MiB**.

> **Peso, contra el presupuesto de la Fase 0.** El camino crítico de la puerta son
> **180,5 KiB** sin la precarga de audio. **La escena 2 pesa 3,04 MiB: diecisiete
> veces la portada entera.** Ninguna de las cinco es evitable si se muestran las
> cartas reales a resolución nativa. Tres caminos, que la lámina debería decidir
> antes de dibujar: versiones comprimidas sólo para la portada; cartas a tamaño
> pequeño con `srcset`; o revelar la mano con el reverso `reverso_carta.svg`
> (6 994 B, vectorial) y mostrar las caras sólo tras un gesto del visitante.

---

## Cobertura declarada

**Cubierto y ejecutado:** 2.1, 2.2 y 2.3 salen de correr el motor real, no de leer.
1.1, 1.2 y 1.3 salen de transcribir el código con archivo y línea.

**Marcado [NO VERIFICADO], y por qué:**

| Punto | Qué falta | Cómo se cierra |
|---|---|---|
| 1.2.4 | `--brillo-ancho` y `--brillo-slot-dx` se transcriben de los comentarios del código (medidas a 1920 y 375), no se remidieron | Una corrida del arnés leyendo las dos custom properties del `<h1>` |
| 1.3 | El bloque autónomo se compuso por lectura; no se abrió navegador | Abrir `wordmark.html` con el SVG al lado y comparar contra la Bienvenida |

**No se modificó ningún archivo. No se instaló ninguna dependencia. No hay commits
ni push.** Un verde de este informe mide lo que dice.
