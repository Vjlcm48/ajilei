# AJILEI — Icono de aplicación · Ficha canónica v1.0

- **Archivo:** `docs/AJILEI_Icono_v1.0.md`
- **Versión:** 1.0
- **Estado:** **ACTIVO SELLADO.** Aprobado por Victor (HEPTACREATION LLC) el
  2026-08-26, al cierre de la campaña ICO-1.
- **Alcance:** qué es el icono oficial, qué decisiones suyas están selladas
  (y por tanto no se "corrigen"), de dónde salen sus derivados y cómo se
  regeneran.

> **Por qué existe esta ficha.** Un icono es el activo más copiado de un
> producto: acaba en la pestaña, en el lanzador del teléfono, en una tienda y
> en cada captura que alguien comparta. Si sus decisiones no están escritas,
> el primero que lo abra en un editor "arreglará" lo que estaba puesto a
> propósito — y lo hará de buena fe. Esta ficha existe para que ese arreglo no
> ocurra.

---

## 1. El maestro

| | |
|---|---|
| **Ruta** | `public/icons/ajilei-icon-maestro.svg` |
| **Lienzo** | 1024 × 1024 (`viewBox="0 0 1024 1024"`), a sangre |
| **Formato** | SVG sin texto — ni una letra, así que no depende de fuentes |
| **Origen** | exploración ICO-L1 / ICO-L2 + Claude Design; aprobado por Victor el 2026-08-26 |

Es **fuente única**. La pestaña del navegador consume el SVG directamente
(`index.html`), y los PNG del manifest y de iOS se **derivan** de él con
`scripts/gen-icons.mjs`. Nadie dibuja un derivado a mano.

## 2. Anclaje óptico — SELLADO

El isotipo NO está centrado geométricamente, y es deliberado:

| Elemento | Posición | Escala |
|---|---|---|
| Marco del isotipo | `x=195`, `y=161.75` | `490 × 735` |
| Heptacoin (centro) | `501.25`, `508.83` | `15 × 15` en el sistema del isotipo |

**Por qué no va al centro geométrico (512, 512):** el trazo abre a la
izquierda y el gancho de la J cae bajo el arranque de la A. Centrar la caja
descentraría la *figura*, que es lo único que el ojo mide. La compensación
está calibrada a ojo por Victor sobre el render, no calculada.

> **PROHIBIDO "corregir" al centro geométrico.** Si una tanda futura lo
> propone, la respuesta es esta línea. Cambiar el anclaje exige autorización
> explícita de Victor **en este documento**.

## 3. Luz direccional — SELLADA

La luz entra por **arriba a la izquierda**, y las tres capas que la producen
son un solo hecho: moverlas por separado rompe el volumen.

| Capa | Definición |
|---|---|
| Fondo (`bgF`) | radial `cx 20%` · `cy 15%` · `r 115%` |
| Realce (`luzF`) | radial `cx 14%` · `cy 10%` · `r 36%`, blanco a 0.06 |
| Viñeta (`vigF`) | radial perimetral, `#280811` a **0.38** en el borde |

## 4. Rampa vinotinto — excepción documentada

```
#90253a  →  #7c1d30  →  #380d17
            (base sellada: la de la Heptacoin)
```

El vinotinto **existe sólo dentro de este activo**. No entra a `theme.css`, no
tiene token y ninguna pantalla lo consume: la app es verde, y el vino vive en
el icono y en el canto de la moneda. Es la **misma clase de excepción** que ya
tiene documentada la Heptacoin frente a la regla del dorado único — registrada,
acotada a un activo, y por eso no contradice el sistema.

## 5. Filigrana

Reticulado dorado (`#e8b84b`, 1px, paso 14) a opacidad **0.045** — la firma de
la casa, en su versión más callada.

**Muere limpia a tamaño pequeño (verificado en ICO-1):** rasterizado el maestro
a 48 px y a 32 px, la filigrana queda como una textura diagonal apenas
perceptible, sin muaré ni suciedad, y el monograma sigue leyéndose. A esos
tamaños el icono es el monograma dorado sobre vino, que es exactamente lo que
tiene que ser.

## 6. Derivados y regeneración

```sh
node scripts/gen-icons.mjs
```

| Salida | Medida | Para qué | Verificado en ICO-1 |
|---|---|---|---|
| `public/icons/icon-512.png` | 512 × 512 | manifest PWA · `purpose "any maskable"` | 512×512, opaco |
| `public/icons/icon-192.png` | 192 × 192 | manifest PWA · `purpose "any maskable"` | 192×192, opaco |
| `public/icons/apple-touch-icon.png` | 180 × 180 | iOS · pantalla de inicio | 180×180, opaco |

El generador rasteriza con el **playwright-core + Edge que el repo ya tiene**
(el mismo instrumento de `scripts/diagDSK.mjs`): cero dependencias nuevas. Trae
su propia puerta de **opacidad** — relee cada PNG escrito en un lienzo y exige
alfa 255 en las cuatro esquinas y en el centro, porque una esquina translúcida
se ve como un mordisco en el lanzador de Android. Si falla, sale con código 1.

**Determinista y re-ejecutable:** mismo maestro → mismos PNG. El día que el
maestro cambie, un solo comando reescribe los tres; no hay que acordarse de
cuál faltaba. Fórmula sobre constante, aplicada a los activos.

## 7. Zona segura maskable

Android recorta el icono maskable a una forma cualquiera dentro del **80% del
lienzo** — un círculo de radio `0.4 × 1024 = 409,6` alrededor del centro. Toda
la tinta del maestro cabe dentro:

| | |
|---|---|
| Radio máximo de tinta (medido) | **368,91 px** |
| Radio permitido | 409,6 px |
| Holgura | **40,7 px** |

Medido en ICO-1 rasterizando el maestro a 1024 y buscando el píxel dorado más
lejano del centro; la cifra incluye el borde antialiaseado del trazo, así que
es la lectura pesimista. Por eso los mismos PNG sirven con `purpose "any
maskable"` y **no se genera arte aparte**: no hay nada que reencuadrar.

## 8. Dónde está cableado

| Sitio | Referencia |
|---|---|
| `index.html` | `<link rel="icon" type="image/svg+xml" href="/icons/ajilei-icon-maestro.svg">` |
| `index.html` | `<link rel="apple-touch-icon" sizes="180x180" href="/icons/apple-touch-icon.png">` |
| `public/manifest.webmanifest` | bloque `icons`: 192 y 512, `purpose "any maskable"` |

El `<title>` de `index.html` está sellado aparte y esta campaña no lo tocó. Los
colores del manifest (`background_color` y `theme_color`, ambos `#0a1e10`) son
los de PWA-M1 y siguen siendo verdes a propósito: el *splash* abre hacia la
app, no hacia el icono.

## 9. Cómo se mantiene

- El maestro se cambia **aquí primero**: se sube la versión de esta ficha, se
  reemplaza el SVG y se corre el generador. Un derivado que no salga del
  generador no entra al repo.
- Anclaje óptico (§2), luz (§3) y rampa (§4) son **decisiones de Victor**. Una
  instrucción de campaña puede recordarlas; no puede cambiarlas.
- Los provisionales que este icono jubiló (`favicon.svg`, `icon-192.png`,
  `icon-512.png`, `icon-maskable-512.png`, `apple-touch-icon-180.png`, todos en
  la raíz de `public/` desde PWA-M1) salieron del árbol en ICO-1. Viven en el
  historial de git si alguien los necesita; no vuelven.
