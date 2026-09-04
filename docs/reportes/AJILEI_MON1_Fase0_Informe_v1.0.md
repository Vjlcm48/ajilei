# AJILEI — Campaña MON-1 (Heptacoin 3D) · Fase 0 · Informe v1.0

**Diagnóstico + prueba de humo · 30-ago-2026 · HEAD `26b1fb4`**

---

## ⛔ Estado de la fase: BLOQUEADA en 1.1 — Blender no está instalado

**La prueba de humo no se ejecutó. No pudo ejecutarse.** No hay Blender en esta
máquina: ni en el PATH, ni en las rutas convencionales de instalación, ni en el
registro de programas, ni por Steam, ni como paquete de winget instalado.

La ficha manda, en el punto 1.1: *«Si no está instalado, detenerse aquí y reportar
el paso exacto de instalación»*. Eso se cumple: **1.2, 1.3 y 1.4 quedan sin
verificar** y así se declaran, uno por uno, con lo que cada uno necesitaría.

**Lo que sí se entregó, completo:** el bloque 2 íntegro (material sellado,
inventario del SVG con veredicto de importación, oro PBR, fondo) y el bloque 3
íntegro (geometría, coreografía fotograma a fotograma, luz y cámara, salida,
estructura de trabajo). Ninguno de los dos depende de tener Blender delante: uno
es lectura del repo y el otro es plan.

**La carpeta `laminas/mon1/_humo/` NO se creó.** Sin render que escribir dentro,
crearla sería dejar basura que Victor tendría que barrer para nada.

**Cumplimiento del mandato**

| Regla | Estado |
|---|---|
| Solo lectura en el repo | ✅ Nada de `src/`, `public/`, `docs/`, raíz o configuración modificado |
| Protegidos | ✅ Ni se abrieron: esta fase no los necesitó |
| Prueba de humo en `laminas/mon1/_humo/` | ⛔ **Imposible** — sin Blender. Carpeta no creada |
| Sin commits, sin push | ✅ |
| Sin dependencias en `package.json` | ✅ |
| `ffmpeg` sólo con autorización | ✅ No se instaló nada. Ver 1.3 |

---

# Bloque 1 — Entorno

## 1.1 Blender · ⛔ NO INSTALADO

**Búsqueda realizada, con lo que devolvió cada vía:**

| Vía | Resultado |
|---|---|
| `Get-Command blender` (PATH) | No encontrado |
| `%ProgramFiles%\Blender Foundation` (recursivo) | No existe |
| `%ProgramFiles(x86)%\Blender Foundation` | No existe |
| `%LOCALAPPDATA%\Programs\Blender Foundation` | No existe |
| `WindowsApps` (recursivo) | Sin `blender.exe` |
| Registro `Uninstall` (HKLM, WOW6432Node, HKCU) | Ninguna entrada que contenga «lender» |
| Steam (`steamapps\common\Blender`) | No presente |
| `winget list --name Blender` | «No se encontró ningún paquete» |

**Veredicto: no hay Blender de ninguna clase en esta máquina.** Por tanto
`blender -b --version` no se pudo ejecutar.

### El paso exacto de instalación

La ficha pide reportarlo, no ejecutarlo. **No se instaló nada.** El repositorio de
winget ya tiene las tres versiones publicadas, consultado en esta corrida:

```
Nombre  Id                                Versión
blender BlenderFoundation.Blender         5.2.1
blender BlenderFoundation.Blender.LTS.4.2 4.2.16
blender BlenderFoundation.Blender.LTS.4.5 4.5.10
```

**Recomendación: la LTS 4.5.** El comando exacto, en una consola cualquiera:

```powershell
winget install --id BlenderFoundation.Blender.LTS.4.5 --source winget --accept-package-agreements --accept-source-agreements
```

**Por qué la 4.5 LTS y no la 5.2.1:**

- **Es LTS** — soporte largo y correcciones sin cambios de comportamiento. Un
  pipeline por script que se va a reejecutar durante meses quiere una base que no
  se mueva bajo los pies.
- **La ficha pide «Blender 4.x»**, en esas palabras. La 5.2.1 no lo es.
- **Eevee Next ya está maduro en 4.2+**, que es el motor que la escena
  probablemente use (ver 3.3). La 4.5 lo trae asentado.
- **La API de Python de la serie 4.x está documentada y estabilizada.** Un salto a
  la 5.x puede traer renombres en `bpy` que romperían el script sin avisar.

**Aviso sobre winget en esta máquina.** El primer intento de `winget list` se topó
con el acuerdo pendiente del origen `msstore` y abrió un prompt interactivo que en
una sesión no interactiva **falla** (`0x8a150042`). Se resolvió acotando a
`--source winget` con `--disable-interactivity --accept-source-agreements`. Si
Victor instala a mano desde una consola normal no lo verá; si se automatiza, esos
tres modificadores hacen falta.

**Alternativa sin winget:** el instalador MSI de `blender.org/download/` (rama
4.5 LTS). Mismo resultado; winget es sólo más corto.

**Ruta esperada tras instalar** — la que el script de la Fase 1 tendrá que usar:

```
C:\Program Files\Blender Foundation\Blender 4.5\blender.exe
```

**Comprobación que cierra este punto** (es la que la Fase 0 no pudo correr):

```powershell
& "C:\Program Files\Blender Foundation\Blender 4.5\blender.exe" -b --version
```

## 1.2 Python embebido · ⚠️ NO VERIFICADO

Depende por completo de 1.1: el intérprete es el que viene **dentro** de Blender,
no un Python del sistema. Sin Blender no hay nada que interrogar.

**Lo esperado** (a confirmar en cuanto se instale): Blender 4.5 LTS embebe
**Python 3.11.x**. Se verifica y se demuestra la escritura de archivo con:

```powershell
& "C:\Program Files\Blender Foundation\Blender 4.5\blender.exe" -b --python-expr `
  "import sys,pathlib; p=pathlib.Path('laminas/mon1/_humo/py.txt'); p.parent.mkdir(parents=True,exist_ok=True); p.write_text(sys.version); print(sys.version)"
```

Si eso imprime la versión **y** deja el `.txt` escrito, 1.2 queda cerrado: el
intérprete corre sin ventana y tiene permiso de escritura donde el pipeline lo
necesita.

## 1.3 Salida de video · ⚠️ PARCIAL

**Lo que sí se pudo verificar: `ffmpeg` NO está en el PATH del sistema.**
`Get-Command ffmpeg` no devuelve nada.

**Lo que no se pudo:** qué codecs ofrece el FFmpeg **interno** de Blender en esta
máquina, y en particular si escribe **WebM VP9 con canal alfa**. Es una propiedad
de la compilación de Blender, no del sistema: sin Blender instalado no hay
compilación que interrogar.

**Lo esperado, y por qué importa poco:** las compilaciones oficiales de Blender
para Windows traen FFmpeg con VP9 y WebM. Pero el punto crítico —**alfa**— es
más fino: Blender expone `WEBM` con códec `VP9` y una casilla de **RGBA** en la
salida, y funciona cuando el FFmpeg embebido lleva `libvpx-vp9` con
`yuva420p`. **[NO VERIFICADO]**

**La necesidad de `ffmpeg` externo, reportada como pide el mandato 3.** Hay dos
escenarios:

- **Si la escena sale opaca** (que es lo que este informe recomienda, ver 2.4):
  **`ffmpeg` externo NO hace falta.** Blender escribe el MP4/H.264 y el WebM/VP9
  opacos por sí solo. Cero instalaciones.
- **Si Victor sella la variante con alfa:** entonces sí conviene, porque da control
  fino sobre el `-pix_fmt yuva420p`, el `-crf` y el paso de dos pasadas que
  Blender no expone. El comando sería:

  ```powershell
  winget install --id Gyan.FFmpeg --source winget --accept-package-agreements --accept-source-agreements
  ```

  **No se ejecutó.** Queda reportado como el mandato exige, a la espera de
  autorización explícita — y sólo será necesario si la decisión de 2.4 va por
  alfa.

**Camino de escape que no necesita nada:** renderizar **secuencia PNG RGBA** desde
Blender (que siempre puede) y codificar después. Ese material sirve para
cualquier formato posterior sin volver a renderizar, y es lo que este informe
recomienda producir en la Fase 1 pase lo que pase (ver 3.4).

## 1.4 Motor de render · ⚠️ PARCIAL

**El hardware sí se midió.** Es la parte de este punto que no dependía de Blender:

| Componente | Valor |
|---|---|
| CPU | **Intel Core i9-14900K** — 24 núcleos, **32 hilos** |
| RAM | **63,7 GB** |
| GPU | **Intel UHD Graphics 770** (integrada) — driver 32.0.101.7084 |
| GPU dedicada | **Ninguna detectada** |

**No se pudo medir:** que Eevee esté disponible, y el **tiempo real de un fotograma
a 1280×720** — que era justo lo que la prueba de humo iba a dar. Sin ese número no
hay extrapolación honesta a 150 fotogramas, y **no se estima**: un tiempo inventado
es exactamente lo que la ficha prohíbe al pedir «un fotograma real, con tiempo
real, en la máquina real».

**Lo que el hardware sí permite decir, y cambia el plan de render:**

> **No hay GPU dedicada.** Eso descarta de entrada Cycles por GPU en sus vías
> rápidas: OptiX y CUDA piden NVIDIA, HIP pide AMD, y el back-end oneAPI de Cycles
> apunta a las Arc discretas, no a una UHD 770 integrada. **[NO VERIFICADO]** —
> es lo documentado de Cycles, no una prueba en esta máquina.

Quedan dos caminos, y el hardware inclina la balanza de forma poco habitual:

**(a) Cycles por CPU.** Un **14900K con 32 hilos** es una máquina de render por CPU
seria — muy por encima de lo que suele haber detrás de un proyecto web. Para
**una moneda de oro**, Cycles es el motor que da el metal de verdad: reflexión
especular físicamente correcta, sombras de contacto reales bajo la pila, y el
barrido especular del tramo D saliendo solo del comportamiento del material en vez
de fingirse.

**(b) Eevee (Next).** Rasterizado, órdenes de magnitud más rápido, pero se apoya en
la GPU — y aquí la GPU es una integrada. Eevee necesita además contexto gráfico
incluso en `-b`; en Windows suele resolverlo, pero sobre una UHD 770 el margen es
estrecho y el metal pide reflexiones de pantalla que Eevee aproxima.

**Recomendación provisional: Cycles CPU**, con muestreo moderado y el eliminador de
ruido activado. Son 150 fotogramas **una sola vez**, no una sesión interactiva: si
cada fotograma costara 20 s, el lote entero son 50 minutos desatendidos, que para
un activo que se produce una vez y se sirve pre-renderizado es intrascendente. La
calidad del oro vale ese rato.

**Esta recomendación es provisional a propósito.** El número que la confirma o la
tumba es justo el que la prueba de humo iba a dar. **Vía de cierre:** instalar
Blender y renderizar un fotograma de un cilindro dorado a 1280×720 en los dos
motores, cronometrando ambos.

---

# Bloque 2 — El material sellado

## 2.1 HC-1 «Grabada» y el cuño v1.1 B «marcada»

**Fuente:** `docs/AJILEI_Identidad_A_v1.1.md` §4, líneas 20-41. Sellado 2026-08-21.
Es un **delta sobre la v1.0**: lo que la revisión no cambia sigue vigente.

**La composición (línea 24), que el 3D debe reproducir sin desviarse:**

> «**Diseño sellado: HC-1 "Grabada"** — sin cambios en la composición: H serifada
> al centro en **alto relieve**, 7 estrellas de 5 puntas en **anillo simétrico y
> bajo relieve**, **canto acuñado estriado con filete interior**. Lo que cambia es
> el **cuño**.»

**La variante (línea 26):**

> «**Variante elegida en láminas: B "marcada".** La A "discreta" se descartó por no
> registrar a 36 px, que es el tamaño de la moneda en la barra de saldo — el más
> grande que el producto usa hoy.»

**La tabla del cuño v1.1 B (líneas 28-35), transcrita:**

| Elemento | v1.0 | **v1.1 B** |
|---|---|---|
| Filete exterior | — | **vino `#7c1d30`**, 2 u (r 45 → 47) |
| Sombra de la H | tono sombra del oro | **marino `#1c305f`**, desplazada +1,3 / +1,8 |
| Campo (radial) | `#f4d27e` 0 % · `#e8b84b` 55 % · `#c69736` 100 % | **`#f4d27e` 0 % · `#e8b84b` 45 % · `#c69736` 82 % · `#9a7326` 100 %** |
| Estrellas | tono sombra plano | **`#9a7326`** |
| Canto | anillo discontinuo | **r 42,9 · 3,4 u** (filete interior r 40,6 · 0,7 u) |
| Cuerpo de la H | gradiente claro | **`#f7dc92` → `#d4a033`** |

**Las dos reglas que gobiernan el color (líneas 37 y 39):**

> «**La base `#e8b84b` no se mueve.** La intensidad nace del **peso de sombra**, no
> de un segundo dorado: el campo gana una cuarta parada profunda y la H gana
> contraste por su sombra marina, pero el tono de marca sigue siendo exactamente
> el mismo píxel de siempre en el 45 % del radial.»

> «**La rampa tonal y los acentos vino y marino existen únicamente dentro del
> activo.** Fuera de la moneda rige el dorado único `#e8b84b` del sistema de
> diseño, sin excepción.»

**La doctrina de uso (§5, línea 47):**

> «**2. No recolorear.** El isotipo es oro sobre fondo oscuro. **Los acentos vino y
> marino forman parte del cuño sellado de la Heptacoin y no son recoloreado;
> cualquier otro color queda prohibido.**»

**Y del propio SVG**, una línea que el 3D no puede ignorar:

> «Doctrina: **diseño único en todos los tamaños** (sin variante simplificada).»

**Lectura para MON-1.** El 3D es una **aplicación nueva** del activo sellado, no una
reinterpretación. Cinco cosas quedan fijas y no admiten criterio del modelador:

1. **H serifada al centro, en ALTO relieve** — sobresale del campo.
2. **7 estrellas de 5 puntas, en BAJO relieve** — hundidas, no sobresalientes.
3. **Canto estriado con filete interior** — dos anillos concéntricos distintos.
4. **Filete exterior vino** de 2 u entre r 45 y r 47.
5. **La sombra marina de la H**, que en 3D **deja de ser un desplazamiento pintado y
   pasa a ser sombra real** del relieve — ver el aviso de 2.3.

## 2.2 Inventario de `src/assets/heptacoin.svg` y veredicto de importación

**El archivo:** 3 503 bytes, `viewBox="0 0 100 100"`, `role="img"`,
`aria-label="Heptacoin"`. Centro en (50, 50).

**Inventario completo de sus trazados:**

| # | Elemento | Geometría | Pintura | Papel |
|---|---|---|---|---|
| 1 | `<circle>` | `cx 50 cy 50 r 47` | `fill="#7c1d30"` | **Filete exterior vino** |
| 2 | `<circle>` | `cx 50 cy 50 r 45` | `fill="url(#hpcFld)"` | **Campo** (radial de 4 paradas) |
| 3 | `<circle>` | `cx 50 cy 50 r 42.9` | `fill="none"` · `stroke="#b8892f"` · `stroke-width="3.4"` · **`stroke-dasharray="1.8 2.2"`** | **Canto estriado** |
| 4 | `<circle>` | `cx 50 cy 50 r 40.6` | `fill="none"` · `stroke="#a97f2a"` · `stroke-width="0.7"` | **Filete interior** |
| 5 | `<path id="hpcStar">` en `<defs>` + **7 × `<use>`** | Estrella de 5 puntas · translate + rotate | `fill="#9a7326"` (en el `<g>`) | **Anillo de 7 estrellas** |
| 6 | `<g transform="translate(1.3 1.8)">` con **7 `<rect>`** | H serifada | `fill="#1c305f"` | **Sombra marina de la H** |
| 7 | `<g>` con **7 `<rect>`** | La misma H | `fill="url(#hpcH)"` (lineal vertical) | **Cuerpo de la H** |

**La estrella, medida desde su `d`:**

```
d="M0 -5 L1.123 -1.545 L4.755 -1.545 L1.817 0.59 L2.939 4.045 L0 1.91
   L-2.939 4.045 L-1.817 0.59 L-4.755 -1.545 L-1.123 -1.545 Z"
```

- Radio de punta: **5,000 u**
- Radio de valle: **1,910 u** — ratio **0,3820**, que es 1/φ² exacto (el pentagrama
  canónico)
- Sólo segmentos rectos (`L`): **ni una curva**. Diez vértices y cierre.
- Anillo: 7 posiciones a **radio 33**, cada **51,4286°** (360/7), cada una rotada
  para apuntar hacia afuera.

**La H, medida desde sus 7 `<rect>`:**

| Rect | x | y | w | h | Papel |
|---|---|---|---|---|---|
| 1 | 36 | 35 | 12 | 3,5 | Serif superior izquierdo |
| 2 | 36 | 61,5 | 12 | 3,5 | Serif inferior izquierdo |
| 3 | 52 | 35 | 12 | 3,5 | Serif superior derecho |
| 4 | 52 | 61,5 | 12 | 3,5 | Serif inferior derecho |
| 5 | 39,5 | 35 | 5 | 30 | Asta izquierda |
| 6 | 55,5 | 35 | 5 | 30 | Asta derecha |
| 7 | 43 | 48 | 14 | 4,5 | Travesaño |

Caja total **x 36→64 · y 35→65** = 28 × 30 u, centrada en (50, 50). Astas centradas
en x 42 y x 58; los serifs, en los mismos centros. **Todo ortogonal: ni un ángulo
que no sea recto.**

### ⛔ Veredicto: el SVG NO se importa y se extruye limpio. Hay que reconstruirlo.

**[NO VERIFICADO en esta máquina]** — sin Blender no se pudo intentar la
importación. Lo que sigue sale de lo documentado del importador `io_curve_svg` y
de la estructura del archivo, que sí se leyó entera. **Cuatro obstáculos, y tres
son duros:**

**1. El importador de SVG de Blender ignora los `stroke`.** Convierte **rellenos**
en curvas; los trazos no. Los elementos **3 y 4 — el canto estriado y el filete
interior — tienen `fill="none"`**: entrarían como curvas de área cero, sin una
sola cara que extruir. **Es decir: el canto acuñado, que el §4 sella como parte de
la composición, no llega.**

**2. `stroke-dasharray` no existe para el importador.** Las estrías del canto son
precisamente un patrón de guiones (`1.8 2.2` sobre un trazo de 3,4 u). Aunque el
trazo se importara, el patrón no.

**3. `<use>` y `<defs>`.** Las siete estrellas no son siete trazados: son **una
definición y siete instancias por referencia**. El soporte de `<use>` en el
importador es, en el mejor caso, poco fiable. Riesgo alto de que lleguen cero
estrellas, o una sola en el origen.

**4. Los degradados no llegan.** `hpcFld` (radial de 4 paradas) y `hpcH` (lineal)
se pierden: la importación trae geometría, no materiales. **Y esto no es un
problema, es lo correcto** — en 3D esos degradados **no deben reproducirse como
textura**: son la simulación 2D de un relieve que aquí va a existir de verdad. Ver
el aviso de 2.3.

### Reconstrucción geométrica equivalente — y por qué sale mejor

**Propuesta: no importar el SVG. Construir la moneda por script en Python.** El
activo es analíticamente simple —cuatro círculos concéntricos de radio conocido,
siete rectángulos ortogonales y una estrella de diez vértices— y todos sus números
están arriba, medidos del archivo. Reconstruirlo es más corto que pelear con el
importador, y da control exacto sobre el relieve, que es lo que el 3D aporta.

| Elemento sellado | Cómo se reconstruye | Fuente del número |
|---|---|---|
| Cuerpo de la moneda | Cilindro, r 47 u | `<circle r="47">` |
| Filete exterior vino | Anillo r 45→47, ligeramente rebajado o biselado | §4 «2 u (r 45 → 47)» |
| Campo | Cara plana hasta r 45, muy leve abombamiento | `<circle r="45">` |
| **Canto estriado** | **72 estrías radiales** en el anillo r 40,6→42,9, por matriz circular. Paso deducido del `dasharray`: perímetro a r 42,9 = 269,6 u ÷ (1,8 + 2,2) = **67,4 → 72 estrías** (divisor entero cómodo, error de paso 6,4 %) | `stroke-dasharray="1.8 2.2"`, `r 42.9`, `width 3.4` |
| Filete interior | Surco fino en r 40,6, profundidad ≈ 0,7 u de ancho | `<circle r="40.6" stroke-width="0.7">` |
| **7 estrellas, BAJO relieve** | Prisma de la estrella (r punta 5, r valle 1,910) **restado** al campo — booleano de diferencia, o desplazamiento negativo | `d` de `hpcStar`, `<use>` × 7 a r 33 |
| **H serifada, ALTO relieve** | 7 cajas extruidas **hacia fuera** desde el campo, unidas | Los 7 `<rect>` de la tabla |
| Sombra marina de la H | **NO se modela.** Es sombra real del relieve bajo la luz cenital | §4 + aviso de 2.3 |
| Reverso de la moneda | No está sellado. Ver «Vacíos y riesgos» | — |

**La única pieza que conviene traer del SVG es el perfil de la estrella**, y ni
siquiera hace falta importarlo: sus diez vértices están en el `d` transcrito
arriba y se escriben directos en el script.

**Ventaja lateral:** un script que construye la moneda desde los números del
activo es **auditable contra el activo**. Si Identidad A se recalibra, se cambian
las constantes del script y no hay que reimportar nada.

## 2.3 El oro · material PBR

**La regla de la casa rige también en 3D: un solo oro, con variaciones de luz,
nunca de tono.** El sistema de diseño §5 lo dice para 2D; en 3D se cumple de forma
todavía más natural, porque el motor genera las variaciones por iluminación en vez
de por pintura.

### ⚠️ El aviso que decide el material

> **Los degradados del SVG NO se convierten en texturas.** `hpcFld` (radial de 4
> paradas) y `hpcH` (lineal en la H) son **la simulación 2D de un relieve y una
> luz** que en 3D van a existir de verdad. Reproducirlos como textura pintaría la
> sombra dos veces: una la falsa del degradado y otra la real del render, y la
> moneda se leería sucia y plana a la vez.
>
> **La misma lógica retira la sombra marina de la H.** En el SVG, `#1c305f`
> desplazado +1,3/+1,8 **es** el truco que finge el alto relieve. En 3D la H
> sobresale de verdad y proyecta su propia sombra. Modelar además una mancha azul
> sería dibujar la sombra de la sombra.

**Lo que sí se conserva del cuño, porque es color y no simulación:** el **filete
vino `#7c1d30`** —es un anillo realmente distinto, no un sombreado— y **el tono de
las estrellas**, que al ir en bajo relieve quedarán naturalmente más oscuras; si
el render no las hunde bastante, `#9a7326` es la referencia de a dónde tienen que
llegar.

### El material propuesto

**Un solo material metálico para todo el cuerpo de la moneda**, más un segundo
material sólo para el filete vino.

| Parámetro | Valor propuesto | Por qué |
|---|---|---|
| **Base Color** | `#e8b84b` — lineal **`(0.8070, 0.4793, 0.0704)`** | La base sellada, que «no se mueve» |
| **Metallic** | **1.0** | Es metal. Sin esto el oro se lee como plástico amarillo |
| **Roughness** | **0.25–0.35** (empezar en 0.30) | Oro acuñado, no pulido a espejo. Un espejo puro reflejaría un vacío negro y la moneda desaparecería |
| **Anisotropy** | **0.0** en el campo · **0.3–0.4** en el canto | El campo es liso; el canto estriado sí tiene dirección. Es donde la anisotropía cuenta |
| **IOR / Specular** | Por defecto del metal | En un `Principled BSDF` con `Metallic 1`, el color especular lo da el Base Color |
| **Normal** | Sin mapa | El relieve es **geometría real**. Un mapa de normales aquí sería fingir lo que ya existe |

**Material del filete vino:** Base Color `#7c1d30` → lineal **`(0.2016, 0.0123,
0.0296)`**, `Metallic 0.6`, `Roughness 0.45` — algo menos metálico y más mate que
el campo, para que lea como esmalte de acuñación y no como un segundo metal.

**Tabla de conversión sRGB → lineal.** Blender trabaja en lineal; pegar un hex de
`theme.css` directo en un campo de color da un oro apagado. **Estos son los valores
a usar:**

| Token / elemento | Hex | Lineal (R, G, B) |
|---|---|---|
| `--gold-brand` · base del metal | `#e8b84b` | `0.8070, 0.4793, 0.0704` |
| `--gold-brand-hi` · brillo | `#f5dfae` | `0.9131, 0.7379, 0.4233` |
| `--gold-brand-deep` · sombra | `#ac7e16` | `0.4125, 0.2086, 0.0080` |
| Campo 0 % (brillo) | `#f4d27e` | `0.9047, 0.6445, 0.2086` |
| Campo 82 % (sombra) | `#c69736` | `0.5647, 0.3095, 0.0369` |
| Campo 100 % · estrellas | `#9a7326` | `0.3231, 0.1714, 0.0194` |
| H arriba | `#f7dc92` | `0.9301, 0.7157, 0.2874` |
| H abajo | `#d4a033` | `0.6584, 0.3515, 0.0331` |
| Filete vino | `#7c1d30` | `0.2016, 0.0123, 0.0296` |
| Sombra marino | `#1c305f` | `0.0116, 0.0296, 0.1144` |
| Canto | `#b8892f` | `0.4793, 0.2502, 0.0284` |
| Filete interior | `#a97f2a` | `0.3968, 0.2122, 0.0232` |
| `--green-abyss` · vacío | `#09170e` | `0.0027, 0.0086, 0.0044` |

**El criterio de validación del oro**, que evita discusiones de gusto: renderizar
la moneda **de cara, plana, bajo la luz cenital**, y comprobar que el píxel del
centro del campo —donde el SVG pone su parada del 45 %— cae en **`#e8b84b` o muy
cerca**. Si sale más claro, sobra luz; más oscuro, falta. La base sellada es el
patrón de calibración, no una sugerencia.

## 2.4 El fondo · alfa contra opaco

**El color del vacío:** `--green-abyss` = **`#09170e`** (`theme.css:42`), lineal
`(0.0027, 0.0086, 0.0044)`. Es un verde de luminosidad **6,3 %** — casi negro.

**La pregunta real de composición.** El fondo de la portada **no es plano**: es
`var(--filigrana), radial-gradient(ellipse at 42% 38%, --green-bright 0%,
--green-deep 50%, --green-abyss 100%)`. Un rectángulo de vídeo en verde abismo
plano **no se funde** con eso: se vería como una mancha oscura sobre el centro
claro del radial, justo donde el radial es más brillante.

**Las tres vías, evaluadas:**

### (a) Alfa — WebM VP9 con `yuva420p`

| | |
|---|---|
| **A favor** | Compositación perfecta sobre cualquier fondo. Las sombras de contacto viajan en el alfa y se conservan |
| **En contra** | **Safari/iOS no reproduce VP9 con alfa en WebM.** La vía con alfa que Apple sí admite es HEVC con canal alfa en MP4, que en la práctica exige herramientas de Apple para producirse. **[NO VERIFICADO]** en el iPhone de Victor |
| **Peso** | El canal extra sube el archivo ~15-25 % sobre el mismo VP9 opaco |
| **Riesgo** | **Alto para iOS**, que es terreno declarado de la campaña PUE |

### (b) Opaco con el fondo de la portada horneado dentro — ✅ **RECOMENDADA**

Se renderiza el vídeo **con el mismo fondo que la portada muestra detrás de esa
región**: el radial de la rampa verde y, si el encuadre lo pide, la filigrana. El
vídeo deja de ser una capa flotante y pasa a ser **el trozo de portada donde vive
la escena**.

| | |
|---|---|
| **A favor** | Un solo formato, **compatible con todo** —Chrome, Firefox, Edge, Android, Safari, iOS— sin casos especiales. Las sombras y el contacto se conservan enteros: no hay alfa que las recorte. Archivo más pequeño. **Cero riesgo de códec** |
| **En contra** | El vídeo queda **atado al diseño del fondo**: si la portada recalibra su radial, hay que rerenderizar. Y los bordes del vídeo deben casar exactamente con la página |
| **Mitigación** | Que la escena ocupe una **banda a sangre o el hero entero**. Si no hay costura lateral, no hay nada que casar |

### (c) Opaco sobre negro + `mix-blend-mode: screen`

El truco clásico: sobre fondo casi negro, `screen` deja pasar el fondo de la
página y suma sólo lo brillante.

| | |
|---|---|
| **A favor** | Universal, sin alfa, sin atar el vídeo al diseño |
| **En contra** | **`screen` mata las sombras.** Lo oscuro se vuelve transparente — y las sombras de contacto bajo la pila son justamente lo que vende el «peso real» que el guion pide. Además aclara las caras en penumbra de las monedas y el metal pierde cuerpo |
| **Veredicto** | Escape de emergencia, no primera opción. **Contradice el guion** |

### Recomendación

> **Opaco, con el fondo de la portada horneado (vía b), y la escena a sangre.**
>
> El guion se apoya en **peso real**: tres monedas que caen y se apilan, una cuarta
> que rebota y se asienta. Ese peso lo cuentan las **sombras de contacto**. La vía
> (c) las borra y la vía (a) las conserva pero deja fuera a iOS — el mismo iOS
> cuyo comportamiento la campaña PUE todavía tiene pendiente de verificar. La (b)
> las conserva **y** funciona en todo, a cambio de un acoplamiento con el diseño
> del fondo que, si la escena va a sangre, no cuesta nada.

**Cláusula de seguridad para la Fase 1:** renderizar además la **secuencia PNG con
alfa**. Guardar el maestro con canal alfa cuesta espacio en disco y nada más, y
deja la vía (a) abierta sin volver a renderizar si Victor sella lo contrario o si
el iPhone resulta más capaz de lo previsto.

---

# Bloque 3 — El plan de render

## 3.1 Geometría

**Unidades.** Se trabaja en las del activo: **1 unidad SVG = 1 unidad Blender**,
moneda de radio 47. Así cada número del §4 se lee directo en el script y es
auditable contra el activo, sin factores de conversión que esconder.

**Proporción diámetro/grosor.** El diámetro sellado es **94 u** (r 47).

| Opción | Grosor | Ratio | Lectura |
|---|---|---|---|
| Moneda real (25 mm × 2 mm) | 7,5 u | 12,5:1 | Fina. Se pierde de canto — y el guion **necesita** el canto en el tramo C |
| **Propuesta** | **10 u** | **9,4:1** | Sustancial sin ser ficha de casino. El canto estriado se lee cuando cae de canto |
| Ficha de casino | 15 u | 6,3:1 | Demasiado gorda; deja de ser moneda |

**Recomendación: grosor 10 u (ratio 9,4:1).** El motivo no es estético sino del
guion: el tramo C pide que la cuarta moneda **caiga de canto y bambolee**. Con 7,5
u el canto es una línea; con 10 u es una superficie donde las estrías se ven girar,
que es el detalle que hace creíble el asentamiento.

**Perfil del cuerpo, de fuera adentro:**

| Radio | Elemento | Relieve en Z |
|---|---|---|
| 47 → 45 | Filete vino | Rebajado ~0,4 u, con bisel de canto |
| 45 → 42,9 | Campo exterior | Cara base (Z = 0) |
| 42,9 ± 1,7 | **Canto estriado** — 72 estrías radiales | Surco de ~0,5 u |
| 40,6 | **Filete interior** — surco fino | ~0,3 u de profundidad, 0,7 u de ancho |
| 40,6 → 0 | Campo interior | Cara base, con abombamiento ≤0,2 u |
| Anillo r 33 | **7 estrellas · BAJO relieve** | **−0,6 u** (hundidas) |
| Centro, 28×30 u | **H serifada · ALTO relieve** | **+0,8 u** (sobresale) |

**Las estrías, deducidas del `dasharray`.** El SVG las dibuja como `1.8 2.2` sobre
un trazo en r 42,9. Perímetro = 2π × 42,9 = **269,6 u**; dividido entre el paso de
4,0 u da **67,4 estrías**. Se propone **72** —divisor entero cómodo, error de paso
6,4 %— porque un número que divide bien evita la costura visible donde el patrón
se cierra.

**Cuatro instancias.** Las cuatro monedas son **la misma malla**, instanciada. Una
sola geometría en memoria, cuatro objetos con su propia animación. Y las cuatro
comparten material: es literalmente la misma moneda cuatro veces, que es lo que el
guion dice.

**Aviso — el reverso no está sellado.** El activo define **una cara**. En una
escena donde las monedas caen y giran, **el reverso se va a ver**. Ver «Vacíos y
riesgos».

## 3.2 Coreografía · keyframes, no simulación

**Recomendación: keyframes a mano, sin física.** La ficha lo propone y el informe
lo confirma, por cuatro razones:

1. **El guion está sellado al décimo de segundo.** Una simulación produce el
   resultado que produce; ajustarla para que la cuarta moneda impacte exactamente
   en 2,3 s es pelearse con un solucionador. Con keyframes, 2,3 s **es** un
   keyframe.
2. **El bamboleo de asentamiento es el momento héroe**, y es justamente lo que peor
   sale de una simulación genérica: el efecto de disco de Euler necesita paso de
   tiempo fino y parámetros de fricción muy afinados, y suele acabar en jitter o en
   una moneda que se duerme antes de tiempo.
3. **Reproducibilidad.** Un render que se repite tiene que dar el mismo fotograma.
   Un solucionador con caché es una fuente de deriva entre corridas.
4. **La hoja de tiempos es un entregable.** Si los impactos son keyframes, la hoja
   se **escribe desde el script**; si son simulación, hay que ir a buscarlos.

**El bamboleo, modelado a mano.** Una moneda que se asienta **acelera**: los
contactos se juntan según la amplitud decae. Se propone una progresión geométrica
con razón **0,72** desde un intervalo inicial de 0,1667 s, que converge a reposo en
**3,395 s**.

### Tabla fotograma a fotograma · 30 fps · 150 fotogramas (0–149) = 5,000 s exactos

| Tramo | Tiempo | Fotogramas | Nº | Acción |
|---|---|---|---|---|
| **A** | 0,0 – 1,5 s | **0 – 44** | 45 | Tres Heptacoins caen y se apilan |
| **B** | 1,5 – 2,0 s | **45 – 59** | 15 | Pausa de un latido |
| **C** | 2,0 – 3,5 s | **60 – 104** | 45 | La cuarta: rebote alto, canto, bamboleo |
| **D** | 3,5 – 4,5 s | **105 – 134** | 30 | Barrido especular sobre la H y las estrellas |
| **E** | 4,5 – 5,0 s | **135 – 149** | 15 | Reposo |

**Tramo A — los tres impactos**

| Moneda | Tiempo | Fotograma | Easing |
|---|---|---|---|
| 1 | **0,400 s** | **12** | Caída: `Ease In` cuadrático (gravedad). Asentamiento: `Ease Out` corto, 3 fotogramas |
| 2 | **0,867 s** | **26** | Igual, con ~2 u de desalineación lateral |
| 3 | **1,333 s** | **40** | Igual, desalineada al otro lado |

Cada moneda entra desde fuera de cuadro por arriba. La **rotación** también va
animada: un giro lento sobre su eje durante la caída que se frena en el impacto —
es lo que impide que se lean como fichas cayendo en un tubo.

**Tramo C — la cuarta**

| Evento | Tiempo | Fotograma | Easing |
|---|---|---|---|
| Entra en cuadro | 2,000 s | 60 | `Ease In` fuerte: llega **tarde y rápida** |
| **Choque alto contra la pila** | **2,300 s** | **69** | Impacto duro, cambio de dirección en 1 fotograma |
| Ápice del rebote | 2,600 s | 78 | `Ease Out` → `Ease In` (parábola) |
| **Cae de canto** | **2,800 s** | **84** | Aterriza sobre el borde, no sobre la cara |
| Bamboleo | 2,800 → 3,395 s | 84 → 102 | Ver abajo |
| Plana, de cara, en primer plano | **3,395 s** | **102** | Reposo |

**El bamboleo, contacto a contacto**

| Tap | Tiempo | Fotograma | Intervalo | Nota |
|---|---|---|---|---|
| 1 | 2,967 s | **89,00** | 0,1667 s | Visible y separado |
| 2 | 3,087 s | 92,60 | 0,1200 s | Visible |
| 3 | 3,173 s | 95,19 | 0,0864 s | Visible |
| 4 | 3,235 s | 97,06 | 0,0622 s | Visible, ya apretado |
| 5 | 3,280 s | 98,40 | 0,0448 s | Límite de lo resoluble |
| 6 | 3,312 s | 99,37 | 0,0322 s | ⚠️ **más rápido que un fotograma** |
| 7 | 3,336 s | 100,07 | 0,0232 s | ⚠️ |
| 8 | 3,352 s | 100,57 | 0,0167 s | ⚠️ |
| 9 | 3,364 s | 100,93 | 0,0120 s | ⚠️ |
| 10 | 3,373 s | 101,19 | 0,0087 s | ⚠️ |
| — | **3,395 s** | **102** | — | **Reposo** |

> **Hallazgo que el plan tiene que absorber.** A partir del **tap 6** el intervalo
> baja de 1/30 s: **el bamboleo va más rápido que la cadencia de fotogramas**. A 30
> fps se resuelven **cinco taps** y el resto es un borrón que lee como «se
> asienta». Tres salidas: (i) aceptarlo —es lo que hace una moneda real y el ojo
> lo da por bueno—; (ii) subir el tramo C a 60 fps y remuestrear; (iii) alargar el
> bamboleo subiendo la razón de 0,72 a ~0,80, que estira el asentamiento y separa
> los taps a costa de que la moneda parezca más ligera. **Recomendación: (i)**, con
> desenfoque de movimiento activado para que el borrón sea intencional.

**Hoja de tiempos para la portada — qué sonar y qué no**

El guion pide «un clink por cada una». Sonar los diez taps sería una traca.
Propuesta:

| Evento | Fotograma | Tiempo | Sonido sugerido |
|---|---|---|---|
| Moneda 1 | 12 | 0,400 s | `coin-bet.mp3` |
| Moneda 2 | 26 | 0,867 s | `coin-bet.mp3` |
| Moneda 3 | 40 | 1,333 s | `coin-bet.mp3` |
| Choque alto de la cuarta | 69 | 2,300 s | `chips-collect.mp3` — más cuerpo, es el golpe grande |
| Cae de canto | 84 | 2,800 s | `coin-bet.mp3` a volumen reducido |
| Taps 1–3 del bamboleo | 89 / 92,6 / 95,2 | 2,967 / 3,087 / 3,173 s | `coin-bet.mp3` a volumen decreciente, **o nada** |
| Taps 4–10 | 97+ | 3,235 s+ | **Silencio** — irresolubles |

**Nota de la casa:** los dos sonidos existen y pesan `coin-bet.mp3` **7 680 B** y
`chips-collect.mp3` **30 929 B**. **Ya están en el camino crítico** de la portada:
la Fase 0 de PUE documentó que los once `Howl` de `useSounds.js` se precargan al
evaluar el bundle. Es decir, **la escena 3 no añade un solo byte de audio** — usa
lo que ya bajó.

## 3.3 Luz y cámara

**Luz cenital cálida — una sola, como manda el guion.**

| Parámetro | Propuesta | Por qué |
|---|---|---|
| Tipo | **Área**, 60 × 60 u | Un punto daría un especular duro y puntual; un área da el reflejo alargado que dice «metal» |
| Posición | Encima y adelantada ~15° hacia cámara | Cenital pura dejaría el canto sin luz en el tramo C |
| **Temperatura** | **3200 K** | Cálida sin ser naranja. Empuja el oro hacia su lado brillante sin virarle el tono — que es lo que la doctrina prohíbe |
| Potencia | A calibrar contra el criterio de 2.3 | El patrón es que el centro del campo dé `#e8b84b` |
| Sombras | Suaves, penumbra ~4 u | Las sombras de contacto son lo que cuenta el peso |

**Luz de contorno: sí, mínima.** El metal lo pide. Sobre un vacío casi negro y con
una sola luz, el borde de la moneda se funde con el fondo y la silueta se pierde.
Se propone una **segunda área tenue, detrás y baja, al 8-12 % de la principal**,
con el mismo 3200 K. **No es un segundo oro** —no toca el tono, sólo separa la
silueta del vacío—, así que no contradice la doctrina.

**El barrido especular del tramo D no es una luz nueva.** Se hace **moviendo el
reflejo**: un rectángulo emisivo estrecho, invisible para la cámara, que cruza por
encima entre los fotogramas 105 y 134. Así el barrido **es** una reflexión real
sobre el metal —recorre la H en alto relieve y entra en las estrellas hundidas con
el retardo que da el relieve— en vez de un degradado superpuesto. Es el mismo
gesto que EMB-1 hace en CSS sobre el título, ahora en tres dimensiones.

**Cámara — fija, tres cuartos apenas elevada, sin un solo movimiento.**

| Parámetro | Propuesta | Por qué |
|---|---|---|
| Elevación | **22-25°** sobre la horizontal | «Apenas elevada». Suficiente para leer la pila como pila y para que la moneda final se vea de cara |
| Azimut | ~20° fuera del eje | El «tres cuartos» |
| Lente | **65-85 mm** equivalente | Un gran angular deformaría el círculo en óvalo en los bordes. Teleobjetivo suave: la moneda se lee redonda |
| Movimiento | **Ninguno.** Ni un keyframe | El guion lo dice y es lo correcto: las monedas son los únicos actores |
| Encuadre | Pila descentrada; la cuarta cae al primer plano | Deja aire para la frase que la portada pone en el tramo E |

**Reserva de composición:** el tramo E es donde entra la frase, **que pone la
portada, no el vídeo**. El encuadre tiene que dejarle sitio limpio. Conviene fijar
esa zona muerta **antes** de renderizar 150 fotogramas.

## 3.4 Salida

**Resolución: 1280×720 como base. ✅ Recomendada, y no 1920×1080.**

| | 1280×720 | 1920×1080 |
|---|---|---|
| Píxeles | 921 600 | 2 073 600 (**2,25×**) |
| Tiempo de render | base | ~2,25× |
| Peso a calidad pareja | base | ~1,8× |
| ¿Cabe en 2,5 MB? | Cómodo | Ajustado |

El argumento a favor de 1080 sería la pantalla 2×. **No lo vale aquí**, por tres
motivos: el sujeto es **una moneda dorada sobre un vacío casi negro**, la clase de
imagen con menos detalle fino que existe; el destino es **gama media con datos
móviles**, terreno declarado de PUE; y la portada ya arrastra **706,2 KiB de camino
crítico** (180,5 si se corrige la precarga de audio) — sumarle un vídeo de 4 MB
sería doblar la portada por una nitidez que nadie va a mirar de cerca.

**Si Victor quiere el 2×**, la salida barata es renderizar a 1920×1080 y publicar
**las dos**, sirviendo la grande por `media` en el `<source>`. Sale de la misma
secuencia PNG si se renderiza a la mayor y se reduce.

**Parámetros sellados:** 30 fps · **150 fotogramas (0–149)** · **5,000 s exactos**.

**Formatos, según la recomendación opaca de 2.4:**

| Formato | Códec | Papel | Objetivo |
|---|---|---|---|
| **MP4** | H.264 High, `yuv420p`, `+faststart` | **Universal.** Safari, iOS, todo | ≤ 1,2 MB |
| **WebM** | VP9, `yuv420p` | Mejor compresión donde se admite | ≤ 0,9 MB |
| **Póster** | WebP, calidad 82 | Primer fotograma útil; se muestra mientras carga y si el vídeo no arranca | ≤ 60 KB |
| **Maestro** | Secuencia PNG **RGBA** | No se publica. Permite recodificar sin rerenderizar | — |

**Ambos formatos entran cómodos en el techo de 2,5 MB.** Un plano oscuro con un
sujeto pequeño y cámara fija comprime muy bien: sin paneo, la mayoría de los
macrobloques del fondo no cambian entre fotogramas.

**El póster va en WebP y no en JPEG:** el fondo es un degradado oscuro, y el JPEG
introduce bandas justo ahí. WebP las evita a menos peso.

**⚠️ El bucle no cierra solo.** El fotograma 0 es un vacío sin monedas; el 149 es
la pila en reposo. **Son estados distintos**, así que `loop` a secas daría un corte
visible. Tres opciones:

1. **Fundido corto horneado** (lo que el guion insinúa): los últimos ~7 fotogramas
   (0,23 s) funden a vacío, y el bucle reinicia limpio. **Recomendada** — un solo
   archivo, `loop` nativo, sin JavaScript.
2. **Dos `<video>` con fundido cruzado por CSS.** Más control, más piezas.
3. **Aceptar el corte.** En un bucle de 5 s se nota, y se nota mal.

**La hoja de tiempos en JSON**, generada por el propio script de render para que no
pueda desincronizarse de la animación:

```json
{
  "version": "1.0",
  "fps": 30,
  "frames": 150,
  "duracion_s": 5.0,
  "impactos": [
    { "id": "moneda-1",    "frame": 12,  "t": 0.4000, "sonido": "coinBet",      "volumen": 1.0 },
    { "id": "moneda-2",    "frame": 26,  "t": 0.8667, "sonido": "coinBet",      "volumen": 1.0 },
    { "id": "moneda-3",    "frame": 40,  "t": 1.3333, "sonido": "coinBet",      "volumen": 1.0 },
    { "id": "choque-alto", "frame": 69,  "t": 2.3000, "sonido": "chipsCollect", "volumen": 1.0 },
    { "id": "cae-canto",   "frame": 84,  "t": 2.8000, "sonido": "coinBet",      "volumen": 0.6 },
    { "id": "tap-1",       "frame": 89,  "t": 2.9667, "sonido": "coinBet",      "volumen": 0.4 },
    { "id": "tap-2",       "frame": 93,  "t": 3.0867, "sonido": "coinBet",      "volumen": 0.25 },
    { "id": "tap-3",       "frame": 95,  "t": 3.1731, "sonido": "coinBet",      "volumen": 0.15 }
  ],
  "tramos": [
    { "id": "A", "frame_ini": 0,   "frame_fin": 44,  "nombre": "caida y apilado" },
    { "id": "B", "frame_ini": 45,  "frame_fin": 59,  "nombre": "pausa" },
    { "id": "C", "frame_ini": 60,  "frame_fin": 104, "nombre": "la cuarta" },
    { "id": "D", "frame_ini": 105, "frame_fin": 134, "nombre": "barrido especular" },
    { "id": "E", "frame_ini": 135, "frame_fin": 149, "nombre": "reposo" }
  ],
  "reposo_s": 3.3952
}
```

## 3.5 Estructura de trabajo para la Fase 1

```
laminas/mon1/
├─ heptacoin.py              Script único: construye, anima, ilumina, renderiza
│                            y escribe tiempos.json. Sin .blend a mano: el
│                            archivo binario no se revisa en un diff
├─ tiempos.json              Hoja de impactos — la escribe heptacoin.py
├─ render/
│  ├─ png/                   Maestro RGBA, 150 fotogramas (no se publica)
│  ├─ heptacoin-720.mp4
│  ├─ heptacoin-720.webm
│  └─ heptacoin-poster.webp
├─ lamina.html               Previsualización sobre el fondo REAL de la portada
└─ README.md                 Comando exacto de render y decisiones selladas
```

**Por qué un script y no un `.blend`.** Un `.blend` es binario: no se revisa, no se
diferencia y no se audita contra el activo. Un `.py` que construye la moneda desde
los números del §4 **sí** — y si Identidad A se recalibra, se cambia una constante.

**Comando de render de la Fase 1:**

```powershell
& "C:\Program Files\Blender Foundation\Blender 4.5\blender.exe" -b -P laminas/mon1/heptacoin.py
```

**La lámina de previsualización** (`lamina.html`) es la pieza que cierra el ciclo,
y debe reproducir el bucle **sobre el fondo real de la portada** — no sobre blanco
ni sobre gris:

- Fondo `var(--filigrana), radial-gradient(...)` con los tokens de `theme.css`.
- El `<video>` con `autoplay muted loop playsinline` y el póster puesto —
  **`muted` y `playsinline` no son opcionales**: sin ellos iOS no reproduce sola.
- Un conmutador para ver el bucle **con y sin** los clinks, disparando
  `coin-bet.mp3` y `chips-collect.mp3` desde `tiempos.json`. Es la única forma de
  validar la sincronía antes de integrar.
- El peso real de cada archivo impreso en pantalla, contra el techo de 2,5 MB.
- Una pasada con `prefers-reduced-motion`: con movimiento reducido, la escena
  **debe** caer al póster estático. Es ley del proyecto (§5 del sistema de diseño)
  y un bucle de monedas cayendo es exactamente lo que esa preferencia existe para
  apagar.

**Nota:** `laminas/` no existe hoy en el árbol y **no se creó** en esta fase.

---

## Decisiones que Victor debe sellar antes de la Fase 1

1. **¿Se instala Blender?** Sin esto no hay Fase 1. Recomendado:
   `winget install --id BlenderFoundation.Blender.LTS.4.5`. **Bloquea todo lo
   demás.**
2. **Alfa u opaco.** Recomendado: **opaco con el fondo horneado y la escena a
   sangre** — conserva las sombras de contacto que cuentan el peso y funciona en
   iOS. Alternativa: alfa (WebM VP9), mejor compositación pero **sin Safari/iOS**.
3. **Resolución.** Recomendado: **1280×720**. Decidir si además se publica 1920×1080
   para pantallas 2× (sale de la misma secuencia).
4. **Duración exacta del bucle.** El guion da 5,0 s = 150 fotogramas a 30 fps.
   Confirmar que **5,0 s exactos** es lo sellado y no un redondeo.
5. **Keyframes o física.** Recomendado: **keyframes**, por reproducibilidad,
   control al décimo y porque el bamboleo sale mejor a mano.
6. **Formatos a publicar.** Recomendado: **MP4 (H.264) + WebM (VP9) + póster WebP**.
7. **El cierre del bucle.** Recomendado: **fundido corto horneado** en los últimos
   ~7 fotogramas, para que `loop` nativo baste.
8. **El bamboleo por debajo del fotograma.** Recomendado: **aceptarlo** con
   desenfoque de movimiento. Alternativas: 60 fps en el tramo C, o alargar el
   asentamiento.
9. **Grosor de la moneda.** Recomendado: **10 u sobre 94 de diámetro** (9,4:1).
10. **El reverso.** Ver vacío 1: hay que decidir qué lleva la cara que hoy no está
    sellada.
11. **Motor.** Recomendado provisional: **Cycles CPU** (hay 32 hilos y no hay GPU
    dedicada). **A confirmar con el fotograma de humo.**

---

## Vacíos y riesgos

| # | Vacío / riesgo | Gravedad | Vía de cierre |
|---|---|---|---|
| 1 | **El reverso de la moneda no está sellado.** El activo define una sola cara, y en una escena donde las monedas caen y giran el reverso **se verá** | **Alta** | Decisión de Victor. Tres salidas: (a) coreografiar para que ningún reverso quede a cámara —frágil—; (b) reverso liso, sólo campo con canto y filete —barato y creíble—; (c) sellar un reverso propio, que es campaña de identidad, no de render. **Recomendada: (b)** |
| 2 | **Blender no está instalado.** Bloquea 1.2, 1.3, 1.4 y la prueba de humo | **Bloqueante** | El comando de 1.1 |
| 3 | **Sin tiempo real de fotograma.** No hay extrapolación honesta a 150 fotogramas ni elección firme de motor | Alta | La prueba de humo: un cilindro dorado a 1280×720, cronometrado en Cycles CPU y en Eevee |
| 4 | **El SVG no se importa limpio.** Los `stroke` (canto y filete interior) se pierden, el `dasharray` no existe, los `<use>` son poco fiables | Media | Resuelto por diseño: **reconstrucción por script** con los números de 2.2. **[NO VERIFICADO]** — conviene intentar la importación una vez para confirmar el diagnóstico |
| 5 | **VP9 con alfa en Safari/iOS.** Si se sella la vía alfa, iOS probablemente no lo reproduzca | Alta *(sólo si se sella alfa)* | Evitado por la recomendación opaca. Si se sella alfa: probar en el iPhone real — el mismo aparato del reporte pendiente de PUE |
| 6 | **Códecs del FFmpeg interno sin verificar** | Media | `blender -b --python-expr` listando los formatos, tras instalar |
| 7 | **`ffmpeg` externo ausente.** Sólo hace falta si se sella alfa | Baja | `winget install --id Gyan.FFmpeg` — **no ejecutado**, pendiente de autorización |
| 8 | **Eevee sobre GPU integrada.** UHD 770 sin GPU dedicada; Eevee necesita contexto gráfico incluso en `-b` | Media | La prueba de humo lo resuelve en una corrida |
| 9 | **El bamboleo supera la cadencia de fotogramas** a partir del tap 6 | Baja | Decisión 8 |
| 10 | **El bucle no cierra solo:** fotograma 0 (vacío) y 149 (reposo) son estados distintos | Media | Decisión 7 |
| 11 | **El vídeo opaco queda atado al fondo de la portada.** Si el radial se recalibra, hay que rerenderizar | Baja | Escena a sangre (sin costura lateral) + conservar la secuencia PNG maestra |
| 12 | **La zona de la frase no está definida.** El tramo E le reserva sitio, pero el encuadre no lo sabe | Media | Fijar la zona muerta **antes** de renderizar los 150 fotogramas |
| 13 | **`prefers-reduced-motion`.** Un bucle de monedas cayendo es justo lo que esa preferencia apaga | Media | Caída al póster estático, verificada en `lamina.html` |

---

## Cobertura declarada

| Punto | Estado |
|---|---|
| 1.1 | ✅ Verificado — **Blender ausente**, con el comando exacto de instalación |
| 1.2 | ⛔ **No verificable** sin Blender. Comando de cierre entregado |
| 1.3 | ⚠️ **Parcial** — `ffmpeg` externo ausente (verificado); códecs internos no verificables |
| 1.4 | ⚠️ **Parcial** — hardware medido; **tiempo de fotograma no medido** |
| Prueba de humo | ⛔ **No ejecutada.** Carpeta `laminas/mon1/_humo/` **no creada** |
| 2.1 – 2.4 | ✅ Completos |
| 3.1 – 3.5 | ✅ Completos |

**No se modificó ningún archivo del repo. No se instaló nada. No se creó ninguna
carpeta. No hay commits ni push.** El único archivo nuevo es este informe.

*La prueba de humo mide lo que dice — y por eso este informe dice que no la pudo
medir, en vez de estimar un número.*
