# AJILEI — Campaña MON-1 (Heptacoin 3D) · Fase 1 · Informe v1.0

**31-ago-2026 · HEAD `26b1fb4` · Paso 0 cerrado · Paso 1 sellado · Paso 2 ejecutado**

---

## ✅ Estado: CAMPAÑA COMPLETA

La compuerta del Paso 1 se abrió el 31-ago con el sello de Victor y tres deltas
de material. El Paso 2 corrió a continuación: 135 fotogramas, tres salidas dentro
de techo, hoja de tiempos y lámina. Y sobre el resultado llegó un **cuarto delta,
el del vuelo de la héroe**, que reescribió el tramo C entero — está aplicado, y
sólo costó re-renderizar 30 fotogramas.

**El video:** [`laminas/mon1/render/heptacoin-720.mp4`](../../laminas/mon1/render/heptacoin-720.mp4)
· [`.webm`](../../laminas/mon1/render/heptacoin-720.webm)
· [póster](../../laminas/mon1/render/heptacoin-poster.webp)
**La lámina:** [`laminas/mon1/lamina.html`](../../laminas/mon1/lamina.html)
**El retrato de la compuerta:** [`laminas/mon1/render/retrato.png`](../../laminas/mon1/render/retrato.png)
· [encuadre a 24°](../../laminas/mon1/render/encuadre-video.png)

**Cumplimiento del mandato**

| Regla | Estado |
|---|---|
| Archivos nuevos sólo bajo `laminas/mon1/` y el informe | ⚠️ **Con una desviación** — ver D1 |
| Nada existente se modifica | ✅ `git diff` sobre `src/` vacío |
| Protegidos: ni se abren | ✅ |
| Sin commits, sin push | ✅ |
| Sin dependencias de `package.json` | ✅ |
| `ffmpeg` externo no hace falta | ✅ Confirmado en 0.3 — no se instaló nada |

---

# Paso 0 — Cierres de entorno

## 0.1 Blender · ✅

```
Blender 4.5.10 LTS (hash 6dc0b208d1b5 built 2026-05-19 01:33:42)
```

Ruta: `C:\Program Files\Blender Foundation\Blender 4.5\blender.exe` — exactamente
la que la Fase 0 anticipó. `blender -b --version` responde sin ventana.

## 0.2 Python embebido · ✅

**Python 3.11.11**, la versión que la Fase 0 predijo. Escribió
`laminas/mon1/_entorno.txt` (99 B) desde `--python-expr`, así que el intérprete
corre sin ventana **y** tiene permiso de escritura donde el pipeline lo necesita.

## 0.3 Códecs del FFmpeg interno · ✅ — y no hace falta `ffmpeg` externo

| Enumeración | Valores |
|---|---|
| Formatos | `MPEG4, MKV, WEBM, AVI, DV, FLASH, MPEG1, MPEG2, OGG, QUICKTIME` |
| Códecs de video | `NONE, AV1, H264, H265, **WEBM**, DNXHD, DV, FFV1, FLASH, HUFFYUV, MPEG1, MPEG2, MPEG4, PNG, PRORES, QTRLE, THEORA` |
| Formatos de imagen | `BMP, IRIS, **PNG**, JPEG, …, **WEBP**, FFMPEG` |

**Prueba real, no lectura de enumeración.** Se fijaron las dos combinaciones y se
releyeron:

```
OK :: MPEG4 H264 -> MPEG4 H264
OK :: WEBM  WEBM -> WEBM  WEBM
```

Las cuatro salidas del Paso 2 están cubiertas por la compilación: **MP4/H.264**,
**WebM/VP9**, **PNG** para el maestro y **WebP** para el póster. **No se instaló
nada** y el mandato sobre `ffmpeg` externo queda sin activar.

## 0.4 Prueba de humo cronometrada · ✅ — motor sellado: **Cycles CPU**

Cilindro dorado con el material de §2.3, 1280×720, un fotograma por motor.
**Ambos motores confirmados releyendo `scene.render.engine` después de fijarlo**,
para que un identificador inexistente no dejara los dos cronómetros midiendo lo
mismo.

| Motor | Fotograma | Lote de 135 proyectado |
|---|---|---|
| **Cycles CPU** (128 muestras + eliminador de ruido) | **10,03 s** | **22,6 min** |
| Eevee Next | 4,46 s | 10,0 min |

> **Sellado: Cycles CPU.** El umbral de la decisión 7 era ~90 min para el lote y
> Cycles se queda en **22,6**, a un cuarto del techo. Con margen así, la pregunta
> deja de ser el reloj y pasa a ser el metal — y para una moneda de oro, la
> reflexión especular físicamente correcta y las sombras de contacto reales de
> Cycles son justo lo que el guion necesita para vender el peso.

**Un aviso sobre el número de Eevee.** En la primera corrida Eevee marcó
**14,57 s** y en la segunda **4,46 s**. La diferencia es el arranque del contexto
gráfico y la compilación de sombreadores sobre la UHD 770: el primer fotograma de
una sesión paga ese peaje y los siguientes no. Se reporta el segundo, que es el
que representa un lote. Cycles fue estable entre corridas (9,80 y 10,03 s).

**Y la proyección definitiva, con la moneda de verdad** (0.4 midió un cilindro):
el fotograma del encuadre del video costó **9,82–9,85 s** → **22,1 min** el lote.
La prueba de humo acertó.

## 0.5 Importación del SVG · ✅ ejecutada — **el diagnóstico de la Fase 0 se confirma**

Se intentó de verdad, con `io_curve_svg` habilitado. **18 curvas importadas.**
Identificadas por dimensión (el importador escala el viewBox de 100 a 0,0282
unidades por unidad SVG):

| Elemento del activo | ¿Llega? | Cómo llega |
|---|---|---|
| `<circle r="47">` filete vino | ✅ | Curva de 4 puntos, con material |
| `<circle r="45">` campo | ✅ | Curva de 4 puntos, **sin material** — el radial se perdió |
| `<circle r="42.9">` **canto estriado** | ⚠️ **A medias** | Llega la circunferencia, **no el trazo**: sin `stroke-width` de 3,4 ni el `dasharray 1.8 2.2`. Es un contorno de **área cero: nada que extruir** |
| `<circle r="40.6">` **filete interior** | ⚠️ **A medias** | Igual: circunferencia sin los 0,7 u de ancho |
| **7 estrellas** (`<use>` sobre `<defs>`) | ❌ **CERO** | **Ninguna de las siete llega** |
| 14 `<rect>` de la H (sombra + cuerpo) | ✅ | Los 14, pero **como 14 piezas sueltas** |
| Gradientes `hpcFld` y `hpcH` | ❌ | 4 materiales planos para 5 rellenos distintos |

**Corrección a la Fase 0, en su favor y en su contra.** La Fase 0 predijo que los
dos círculos con `stroke` «no llegarían»: **llegan, pero vacíos** — la
circunferencia sin el trazo que le daba cuerpo, que en la práctica es lo mismo
que no llegar. Lo que la Fase 0 clavó fue lo grave: **las siete estrellas no
aparecen**, y el conteo lo demuestra sin lugar a duda (18 = 4 círculos + 14
rects, con las estrellas ausentes).

> **La construcción por script queda ratificada por medición, no por sospecha.**

---

# Paso 1 — El retrato de la moneda · ✅ COMPUERTA SELLADA

## Lo que se construyó

**7 981 polígonos, 0,30 s de construcción.** Todos los números salen de
`src/assets/heptacoin.svg` y viven al principio de `heptacoin.py`.

| Elemento sellado | Cómo se hizo | Se lee en el retrato |
|---|---|---|
| **H serifada, ALTO relieve** | Un solo contorno cerrado de 28 vértices, extruido +0,8 u | ✅ con **sombra REAL** proyectada, no pintada |
| **7 estrellas, BAJO relieve** | Prismas del `<path id="hpcStar">` (punta r 5, valle r 1,910), restados 0,6 u | ✅ hundidas, las siete |
| **Canto acuñado estriado** | Surco de torno + **72 mesetas** añadidas | ✅ el anillo discontinuo |
| **Filete interior** | Surco de 0,7 u de ancho y 0,3 de profundidad, r 40,6 | ✅ |
| **Filete vino** | Anillo r 45→47 rebajado 0,4 u, material propio `#7c1d30` | ✅ |

**Tres decisiones de construcción que salieron de un fallo medido, no de teoría:**

1. **Torneado antes que booleanos.** Los cuatro anillos concéntricos son
   revoluciones puras: un `spin` los da exactos y con malla limpia. El único
   booleano es el de las estrellas.
2. **Las estrías se SUMAN, no se restan.** El torno ya deja el surco del canto
   dando la vuelta entera, así que se añaden las 72 mesetas que lo interrumpen —
   misma lectura del `dasharray` y un booleano de 72 piezas ahorrado.
3. **La H es un solo contorno, y hubo que aprenderlo.** El primer intento extruyó
   los siete `<rect>` por separado y los unió con `join`. **Falló, y se vio:**
   donde dos cajas se cruzan quedan caras internas enfrentadas y Cycles las
   sombrea como lo que son — **huecos negros**. La H salía rota en cada empalme.
   Unir sólidos que se solapan no es fundirlos.

## La luz, la cámara y una corrección de encuadre

Luz y cámara son las de §3.3, sin mover una lámpara: **área cálida ≈3200 K
adelantada 15°**, **contorno tenue al 10 %**, **lente 75 mm**, **azimut 20°**,
**ni un movimiento**.

> **La elevación del RETRATO no es la del video, y es a propósito.** La decisión 8
> sella la cámara del video en 22–25°, y ahí se queda —el `encuadre-video.png` lo
> demuestra—. Pero el trabajo de esta compuerta es que **se lean** los cinco
> elementos, y a 24° la caja de la H (28 × 30 u) se aplasta a ~12 u aparentes: el
> alto relieve se vuelve una mancha y no hay forma honesta de sellarlo.
>
> **Se probó a 82° —«de cara»— y salió peor.** A esa elevación la cámara queda a
> 8° del cenit y la clave está a 15°: se mira casi por el eje del reflejo, y sobre
> un metal de rugosidad 0,30 eso no es un brillo sino la imagen especular del
> área de luz ocupando media moneda, con el campo reventado a blanco y el relieve
> borrado.
>
> **El retrato va a 55°**: la cámara queda a 35° del cenit, lejos del reflejo, y
> el relieve se lee con la **misma luz definitiva**. Se entregan los dos
> fotogramas para que el sello se dé sabiendo cómo se verá el video.

## La calibración del oro · ⚠️ el punto que la compuerta tiene que resolver

**Método.** Bisección **geométrica** sobre la potencia de la clave —la luz es
multiplicativa, no lineal— con seis renders de sonda a 640×360 y 32 muestras.
El valor se lee promediando una ventana de 5×5 píxeles para que una mota de ruido
de Cycles no decida la calibración.

**Dónde se mide, y por qué no en el centro del cuadro.** El primer intento leyó el
píxel central y calibró contra un valor que no se movía con la luz: en el centro
de la moneda está **la H**, no el campo. El campo limpio vive en una corona
estrecha —por dentro la H llega a r=20,5 y por fuera las estrellas ocupan r 28..38—,
así que se muestrea en **r = 25, ángulo 64,3°**, la bisectriz del hueco entre dos
estrellas: el punto de campo más lejos de cualquier relieve.

**La convergencia:**

```
CALIB :: energia=    158.1 :: campo=#fbb23d :: dR=+19
CALIB :: energia=     28.1 :: campo=#735017 :: dR=-117
CALIB :: energia=     66.7 :: campo=#ab7826 :: dR=-61
CALIB :: energia=    102.7 :: campo=#cf9331 :: dR=-25
CALIB :: energia=    127.4 :: campo=#e4a237 :: dR=-4
CALIB :: energia=    141.9 :: campo=#efaa3a :: dR=+7
CALIB :: SELLADA energia=127.4 W
```

### La lectura del retrato

| | R | G | B | Hex |
|---|---|---|---|---|
| **Medido** (centro del campo) | 228 | 162 | 54 | **`#e4a236`** |
| **Objetivo** (`--gold-brand`) | 232 | 184 | 75 | **`#e8b84b`** |
| **Δ** | **−4** | **−22** | **−21** | — |

> **El rojo cae a 4 puntos del sellado; el verde y el azul, 22 y 21 por debajo.
> El oro del retrato es el tono de marca, un peldaño más saturado y más cálido.**

**La causa no es un error: es la decisión 8 chocando con la decisión 7.** Una luz
de 3200 K **multiplica** el color del material —G a 0,776 y B a 0,549—, así que
un oro cuya base es exactamente `#e8b84b` bajo luz neutra no puede leer `#e8b84b`
bajo luz cálida. La 8 sella la luz; la 7 sella el resultado; las dos a la vez no
son simultáneamente satisfacibles sin una tercera pieza.

**Se probó esa tercera pieza y se retiró.** El balance de blancos de Blender
(`use_white_balance` a 3200 K) es lo que haría una cámara real. **Sobrecorrigió:**
el campo pasó a **`#e4d297`** — el azul saltó de 54 a 151, **76 puntos por encima
del objetivo**, y el oro se fue a un dorado pálido. La razón es que el balance
neutraliza el cuerpo negro de 3200 K entero, mientras que la iluminación de la
escena no es sólo esa luz: el contorno y el rebote del vacío también aportan, y
corregir contra un iluminante que no es el que hay es corregir de más.

**Tres salidas, y la elección es de Victor:**

| # | Salida | Qué cuesta |
|---|---|---|
| **a** | **Aceptar `#e4a236` como «muy cerca»** *(recomendada)* | Nada. El rojo está a −4 y el oro se lee como oro de marca. La calidez es carácter, no error |
| b | Enfriar la clave hacia ~4500 K hasta que el campo dé `#e8b84b` | **Reabre la decisión 8.** El modelado del relieve pierde calidez |
| c | Bajar la saturación de la base del material hasta compensar | **Reabre la decisión 7**: la base `#e8b84b` dejaría de ser la del activo, que es justo lo que Identidad A §4 dice que «no se mueve» |

## Coste del lote, confirmado con la moneda real

| Fotograma | Tiempo | Lote de 135 |
|---|---|---|
| Encuadre del video (24°) | **9,82 s** | **22,1 min** |
| Retrato (55°) | 11,84 s | *(no se usa para proyectar: llena más cuadro de metal, que es el caso caro)* |

**El Paso 2 son ~22 minutos desatendidos.** Muy por debajo del techo.

---

## El veredicto de la compuerta · Victor, 31-ago-2026

**SELLADO.** Material y relieve aprobados, con la calibración del oro por la
**salida (a)**, el reverso liso provisional, y la elevación de 55° del retrato
como instrumento de compuerta (el video sigue en los 24° sellados). Encima del
sello vinieron **tres deltas**, que están aplicados y medidos:

| Delta | Qué cambió en `heptacoin.py` | Qué midió |
|---|---|---|
| **Costado y bisel de oro** | El vino `#7c1d30` queda confinado a la **superficie plana** del anillo r 45→47. Pared cilíndrica y bisel: oro | costado `#332505` tono 41,7° → ORO · bisel `#ffff65` tono 60,0° → ORO · anillo `#a23a3a` tono 0,0° → VINO |
| **A · el vino se comporta como vino** | `Metallic` 0,6 → **0,15** · `Roughness` 0,45 → **0,55** · rebaje del anillo 0,4 → **0,7 u** | El anillo pasó de `#a04838` (160·**72**·56, tono 9,2°) a `#a23a3a` (162·**58**·58, **tono 0,0°**). El verde cayó 14 puntos y el tono aterrizó en rojo puro: eso es esmalte, no metal rojo |
| **B · el oro se afina para 24°** | `Roughness` 0,30 → **0,24** | El campo pasó de `#e4a236` a **`#eba738`** — el rojo a Δ+3 del sellado `#e8b84b`, lo más cerca que ha estado |

**Una decisión de arquitectura que el delta A puso a prueba y aguantó.** El
reparto de material no se decide por una cota en `z` sino por la **normal de cada
cara** (anillo plano `|nz|`=1,000 · bisel `|nz|`=0,707 · pared `|nz|`=0,000, corte
en 0,9). Por eso profundizar el rebaje de 0,4 a 0,7 u **no obligó a recalibrar un
solo umbral**. Con un umbral sobre `z`, ese mismo delta habría movido la frontera
en silencio.

---

# Paso 2 — Los 135 fotogramas · ✅ EJECUTADO

## El encuadre, y por qué se abrió

La decisión 8 sella elevación, azimut, lente y **ni un movimiento de cámara**, y
nada de eso se toca. Lo que cambia es el **llenado**: el retrato encuadraba UNA
moneda al 0,62 del ancho; el video mete ocho.

| Parámetro | Retrato | Video | Qué manda |
|---|---|---|---|
| Elevación | 55° *(instrumento)* | **24°** | Decisión 8, sellada |
| Azimut · lente | 20° · 75 mm | **20° · 75 mm** | Sin tocar |
| Llenado | 0,62 | **0,2725** (3,45 u de ancho de cuadro) | Abre para ocho monedas |
| Distancia | 3,159 | **7,188** | Consecuencia del llenado |
| Diana | (0, 0, 0) | **(0, 0, 0,25)** | Baja la composición en cuadro para que quepa en la banda segura |

**La banda segura 16:7 se comprobó proyectando, no mirando.** Cada punto pasa por
la misma matriz que usa el render. Los fotogramas de entrada quedan fuera del
examen a propósito: una moneda que entra por arriba está cortada por definición,
que es lo que es entrar.

> **Corrección al primer verdicto.** La primera medición usó **cuatro puntos por
> moneda** (los extremos en x y en y) y cantó `y=[0,160..0,847] -> DENTRO`. Con la
> **silueta completa** —96 puntos del canto, en vez de la caja envolvente, cuyas
> esquinas caen a r·√2 y no existen en un disco— el número real es más apretado.
> Medido así, con el delta del vuelo ya aplicado:

```
BANDA :: pila  x=[0.240..0.493]  y=[0.413..0.847]  banda 16:7=[0.111..0.889]
BANDA :: heroe f060 entra    y=[1.129..1.711]  -> FUERA DE CUADRO (entra, correcto)
BANDA :: heroe f072 contacto y=[0.271..0.778]  -> dentro
BANDA :: heroe f076 apice    y=[0.368..0.882]  -> dentro
BANDA :: heroe f080 rebote   y=[0.271..0.778]  -> dentro
BANDA :: heroe f083 vuelco   y=[0.208..0.472]  -> dentro
BANDA :: heroe f087 reposo   y=[0.102..0.390]  -> el borde inferior, 0,009 bajo la banda
```

Todo entra salvo **el borde inferior de la héroe en reposo**, que queda en 0,102
contra el límite 0,111 — unos **6 píxeles de 720**. No lo trae el delta del
vuelo: es la postura de reposo de siempre, y sale a la luz porque la medición se
afinó. Queda declarado en D9.

## La coreografía v2, tal como quedó animada

| Tramo | Fotogramas | Qué pasa |
|---|---|---|
| **A** | 0 – 56 | Siete caen y se apilan · impactos **12 · 19 · 26 · 32 · 39 · 45 · 52** |
| **B** | 57 – 59 | Latido de pausa |
| **C** | 60 – 87 | La héroe **cae en vertical** · de canto en 60 con giro de rueda que se frena en el **70** · **contacto de canto 72** · ápice **76** · **segundo contacto 80** · **vuelco de 90° en una sola rotación** · reposo **87** |
| **D** | 90 – 134 | Barrido especular, 45 fotogramas |

- **Gravedad de escena 12 u/s²**, la misma para las ocho: es lo que hace que
  pesen igual. Cada moneda arranca a 1,75 u —fuera de cuadro por arriba— y su
  fotograma de salida se calcula hacia atrás desde su impacto, así que los siete
  impactos caen donde la ficha los puso y no donde salgan.
- **Caída libre de verdad:** claves `QUAD` con `EASE_IN`, que es una parábola
  exacta, no un bézier «que parece».
- **El giro se frena al contacto** (46° durante la caída, `EASE_OUT`) más 1,2° de
  residuo en tres fotogramas. El asentamiento se hace con la rotación y no con un
  hundimiento porque la decisión 1 prohíbe el aplastamiento.
- **Desalineación alternada de 2 u** (±0,02 en unidades de Blender), con la
  dirección repartida para que la pila no se lea como una escalera.
- **Ocho objetos, UNA malla.** Los 7 981 polígonos se comparten. No es sólo
  memoria: garantiza que ninguna moneda pueda salir con un relieve distinto del
  que pasó la compuerta.

---

# El cuarto delta — el vuelo de la héroe

**Lo vetado por el guion v2 era el BAMBOLEO, no la caída vertical.** El 3D es la
primera vez que la orientación se ve, y el delta la corrige: la héroe entra de
canto, toca de canto, rebota y **se vuelca de una sola vez** hasta quedar plana
con el anverso arriba. Sólo cambia el tramo C; A, B y D no se tocan.

| | Antes del delta | Después |
|---|---|---|
| Entrada (60) | de cara, inclinada 12° | **de canto**, estrías a cámara, giro de rueda de 40° |
| Freno del giro | — | **70**, antes del contacto |
| Primer contacto | 76, de cara | **72, de canto** |
| Ápice | 80 | **76** |
| Segundo contacto | 84 | **80, de canto** |
| 80 → 87 | micro-asiento | **vuelco de 90°, una sola rotación, ease-out** |
| Reposo (87) | (x, y, 0), Rz 8° | **idéntico** — por construcción |

## Tres decisiones de implementación, y por qué

**1. El vuelco va en cuaterniones, no en Euler.** «Girar 90° sobre un eje
horizontal cualquiera y acabar exactamente en la orientación de reposo» obliga,
con ángulos de Euler, a mover dos o tres canales a la vez: cada canal llega a su
destino por su cuenta y lo que se ve no es un vuelco sino un contoneo. Con un
cuaternión hay un solo arco. `_mismo_hemisferio()` fuerza el signo antes de cada
clave porque `q` y `−q` son la misma rotación pero **no el mismo camino**: en
hemisferios opuestos, Blender interpola por el arco largo y un vuelco de 90° se
convierte en una vuelta de 270°.

**2. El reposo se calcula hacia atrás.** La posición y la orientación del
fotograma 87 tienen que ser las de antes del delta para no re-renderizar el tramo
D. Así que se fija el reposo y se despeja la postura de canto:

```
q_canto = q_vuelco⁻¹ · q_reposo
```

**3. `BETA_CANTO = 55°` es un dial, y el delta pide sus dos extremos a la vez.**
Que las estrías se lean a cámara exige la normal de la cara **perpendicular** a
la visual; que el vuelco venga **hacia** la cámara exige la normal apuntando en
contra de ella. Son los dos topes del mismo parámetro. A 55° el vuelco conserva
un **57 %** de componente hacia cámara y la cara queda escorzada a ese mismo
57 %, con el canto recorriendo toda la silueta. De canto puro las estrías se
leerían **peor**: la moneda sería una rendija de 0,10 u de ancho.

## Dos números que la medición obligó a cambiar

**La altura de salida sube a 2,05 u.** De canto la moneda mide **0,94 u de alto**,
no 0,10, así que a la altura de la versión plana asomaba por encima del cuadro
durante los sesenta fotogramas en que está aparcada esperando su entrada —una
moneda colgada en el cielo—. Medido en el 60 con la silueta real: `y=[1,129 ..
1,711]`, **fuera de cuadro** ✅. La caída resultante corre a **20,4 u/s²** contra
los 12 de la escena, que es literalmente lo que la ficha pide de la héroe:
*«llega tarde y rápida»*.

**El rebote NO puede ser de un radio.** De canto, la cima de la moneda está un
radio por encima de su centro, y el centro ya está a un radio del suelo. Medido
sobre la silueta:

| Altura del centro | Cima en cuadro |
|---|---|
| 0,42 (posada de canto) | y = **0,778** |
| 0,89 (rebote de un radio) | y = **1,026** — **fuera del CUADRO**, no sólo de la banda |

La pendiente es **0,528 de cuadro por unidad de altura**, así que el techo es
**0,45 radios** para la banda 16:7 y **0,90 radios** para el borde del cuadro.

> **Se eligió respetar la banda: `ALTURA_REBOTE_CANTO = 0,20 u` (0,43 radios).**
> La decisión 9 existe para que la portada pueda recortar a 16:7 sin cortar una
> moneda, y **su fallo es invisible en la lámina y visible en producción**; el de
> un rebote más corto se ve al instante y se corrige cambiando un número. Con
> 0,20 el ápice mide `y=0,882` contra el límite 0,889: dentro. Subirlo a **0,42**
> recupera 0,90 radios a costa de que la cima salga de la banda cinco fotogramas.
> Es una cifra sellada que la geometría del canto no permitía cumplir entera, y
> queda declarada en D7.

## El empalme, verificado con MD5 y con píxeles

Se re-renderizaron **sólo los fotogramas 60–89** (30 de 135) en **5,6 min**.

| Comprobación | Resultado |
|---|---|
| `f0059` (no re-renderizado) | MD5 **intacto** |
| `f0088` vs `f0089`, ambos nuevos, escena estática | **idénticos, píxel a píxel** — Cycles es determinista |
| `f0089` (nuevo) vs `f0090` (viejo) | media 0,051 · 8,7 % de píxeles — del mismo orden que el control |
| `f0090` vs `f0091`, ambos viejos *(control)* | media 0,040 · 4,7 % — es el barrido arrancando |

**Y una prueba directa del «bit-idéntico».** Se volvió a rendir el fotograma 90
con la escena nueva y se comparó con el que ya estaba en disco:

```
f0090 en disco (escena vieja) vs re-render (escena nueva):
  max=2  media=0,000029  pixeles distintos=0,0084 %
```

**No es literalmente bit-idéntico, y conviene decirlo:** cambiar el canal de
rotación de la héroe de Euler a cuaternión mueve los últimos bits de su matriz, y
eso desvía un puñado de muestras. El resultado son **108 píxeles de 921 600 con
±1–2 niveles** — por debajo del escalón de cuantización de H.264 y de VP9, e
invisible. La intención del delta (no gastar 45 fotogramas de render) se cumple;
la letra («bit-idéntico»), no del todo. Cerrar el hueco costaría 8 minutos de
re-render de 90–134 y queda a un comando.

## El fondo horneado · decisión 3

El degradado del video **es** el de la portada: el mismo
`radial-gradient(ellipse at 42% 38%, --green-bright, --green-deep, --green-abyss)`
de `welcome.css`, con la geometría `farthest-corner` que CSS aplica por defecto
(rx = 0,58·√2 · ry = 0,62·√2), **interpolado en sRGB y no en lineal** —que es lo
que hace el navegador; interpolar en lineal divergiría en los medios tonos justo
donde la costura se vería—, y forzado a `--green-abyss` en los cuatro bordes por
una viñeta de 0,16 de ancho.

Va como textura en **coordenada `Window`**: el degradado es del CUADRO, así que
la viñeta muere en el borde de la imagen y no en un anillo del suelo que la
perspectiva deformaría.

**La ganancia se calibra por canal y se verifica.** La clave de 3200 K multiplica
G por 0,776 y B por 0,549; una ganancia única dejaría el verde virado a cálido y
la costura se vería en el TONO.

| Medición | Valor |
|---|---|
| Sonda con ganancia (1,1,1) | `#1f4a24` |
| Ganancia resuelta | **(1,23 · 1,56 · 2,24)** |
| Sonda verificada | **`#235c38`** · objetivo `#235c38` · **Δ (0, 0, 0)** |
| Borde izquierdo · derecho | `#08150c` · `#08140c` |
| Borde inferior | `#102216` |
| Borde superior | `#020503` |
| `--green-abyss` | `#09170e` |

Los bordes laterales caen sobre el abismo con un punto de diferencia. Los otros
dos se declaran abajo (D6).

### Dos correcciones que salieron de medir, no de mirar

**1. El especular del suelo se apagó.** El `Principled` trae 0,5 de serie, y
sobre un verde casi negro ese brillo dieléctrico se come el color: el fondo del
encuadre sellado medía **`#363529`**, un gris cálido, no un verde. Con el
especular a cero el fondo es su albedo y nada más.

**2. El contorno ya no alumbra el fondo.** El primer montaje del fondo verde sacó
una **costura recta** cruzando el suelo por la derecha del cuadro. Se aisló
apagando lámpara por lámpara —`_calib/costura-*.png` guarda las cuatro pasadas—:
es el contorno. Vive a 0,55 u sobre el suelo, y **una lámpara de área es de una
sola cara**: su iluminación se corta en seco en el plano de la propia lámpara.
Sobre un suelo negro ese corte no se veía; sobre el verde de la portada, sí.

> La corrección no toca **ni posición, ni potencia, ni color**: usa el **enlace de
> luz** para que el contorno sólo alcance a las ocho monedas. La decisión 8 lo
> puso ahí diciendo «no es un segundo oro, sólo separa la silueta del vacío» —
> restringirlo a las siluetas no es una licencia, es escribir en el motor lo que
> la decisión ya decía en palabras. El oro no cambia en un solo píxel; lo que
> desaparece es la costura.

## El barrido especular · tramo D

Un rectángulo emisivo de 2,20 × 0,10 u, **invisible para la cámara**, sin
contribución difusa y sin sombras: lo único que hace es aparecer en el especular
del oro, que es la definición de un barrido especular y no de una luz nueva.

**Va en la dirección del ESPEJO, no encima.** Un reflejo se ve donde la ley de la
reflexión dice: con la cámara a 24° y azimut 20°, la imagen especular de la cara
plana llega desde el azimut opuesto. Un rectángulo puesto justo sobre la moneda
no se vería en el metal.

**La fuerza bajó de 25 a 16, medido:** a 25 el campo de la héroe llegaba a **255**
en el rojo al paso del barrido, y un canal recortado no es un brillo — es relieve
borrado. A 16 el pico queda en 233.

Y el barrido **viaja**, medido por tercios de la cara:

| Fotograma | Tercio izq. | Tercio centro | Tercio der. |
|---|---|---|---|
| 87 *(antes del barrido)* | 161,1 | 158,7 | 114,6 |
| 112 | **203,5** | 182,2 | 119,5 |
| 124 | 158,8 | 158,4 | **145,3** |

## El lote

| | |
|---|---|
| Fotogramas | **135** (0–134), 1280×720, RGBA |
| Muestras · obturador | 192 · 0,40 de fotograma |
| Tiempo | **23,7 min** · **10,51 s/fotograma** |
| Maestro en disco | **127 MB** |

La proyección de la compuerta decía 20,9 min con el fotograma del encuadre; salió
23,7. La diferencia es el desenfoque de movimiento, que sólo cuesta donde algo se
mueve — y en el tramo A se mueven siete monedas a la vez.

## Las salidas · pesos contra techos

| Archivo | Peso | Techo | Margen | Veredicto |
|---|---|---|---|---|
| `heptacoin-720.mp4` (H.264, `yuv420p`) | **731,4 KiB** | 1 228,8 KiB | −497,4 KiB | ✅ **DENTRO** |
| `heptacoin-720.webm` (VP9) | **684,8 KiB** | 921,6 KiB | −236,8 KiB | ✅ **DENTRO** |
| `heptacoin-poster.webp` (calidad 82) | **26,0 KiB** | 60,0 KiB | −34,0 KiB | ✅ **DENTRO** |
| **Total publicable (MP4 + póster)** | **757,4 KiB** | — | — | Bajo el techo de 2,5 MB de la Fase 0 |

Codificado desde el maestro PNG con el FFmpeg **interno** de Blender, en un paso
separado del render: recodificar con otro techo, o sacar el 1080 el día que se
pida, no debe costar otra hora de Cycles. **No se instaló nada.**

### `+faststart`, resuelto en Python

La ficha pide `+faststart` y **Blender no expone esa bandera**: su muxer escribe
el índice al final, y un navegador que recibe ese archivo por HTTP no puede
empezar a reproducir hasta haberlo descargado entero. La reubicación se hace en
el propio script — mover el átomo `moov` y sumarle su tamaño a cada offset de
trozo — bajando por el árbol de contenedores de verdad y no buscando la firma
`stco` a pelo por el búfer, porque cuatro bytes cualesquiera de una tabla pueden
deletrear `stco` y parchear un número que no era un offset rompe el archivo de
una forma que sólo se ve al reproducirlo.

```
FASTSTART :: moov (1436 B) subido, 1 offsets corregidos :: orden ftyp moov free mdat
```

**Y se verificó decodificando, no leyendo cabeceras:**

```
DECOD :: heptacoin-720.mp4    135 fotogramas  1280x720  fps=30.000
DECOD :: heptacoin-720.webm   135 fotogramas  1280x720  fps=30.000
DECOD :: poster 1280x720  canales=4
```

## `tiempos.json` y `lamina.html`

**`tiempos.json`** lo escribe el propio script desde las mismas constantes que
animan, así que no puede desincronizarse de lo que se ve: **9 impactos** (los
siete de la pila, el contacto de canto en el **72** y el rebote de canto en el
**80**), un bloque `vuelco` con el arco 80→87, los cuatro tramos,
`bucle: false`, `congela_en: 134` y **`mudo: true`** — la decisión 10 sella que
las escenas son mudas, y la hoja se entrega como insumo de archivo, no como
disparador.

**`lamina.html`** pone el video sobre el fondo **real** de la portada: enlaza
`src/styles/theme.css` en vez de copiar los tokens, de modo que si el verde
cambia, la lámina cambia con él y la costura se delata sola. Lleva
`autoplay muted playsinline` + póster y **sin `loop`**, los pesos contra sus
techos impresos en pantalla, un botón que dibuja la banda segura 16:7 sobre el
cuadro, y la pasada `prefers-reduced-motion` cayendo al póster estático.

**El póster es el fotograma 134, no el 0.** El 0 es un vacío sin monedas: si el
video no arranca —datos móviles, ahorro de batería, movimiento reducido— lo que
tiene que quedar en pantalla es la escena **terminada**, no el telón.

## La estructura, completa

```
laminas/mon1/
├─ heptacoin.py           el script único: construye, anima, calibra, rinde, codifica
├─ tiempos.json           9 impactos · escrito por el script
├─ lamina.html            previsualización sobre el fondo real de la portada
├─ README.md              comando exacto y decisiones selladas
├─ render/
│  ├─ png/                maestro RGBA · 135 fotogramas · 127 MB · no se publica
│  ├─ heptacoin-720.mp4   729,4 KiB
│  ├─ heptacoin-720.webm  691,9 KiB
│  ├─ heptacoin-poster.webp  26,0 KiB
│  ├─ retrato.png         la compuerta del Paso 1 (55°)
│  └─ encuadre-video.png  el mismo instante a 24°
├─ _calib/                sondas del oro, del fondo, del barrido y de la costura
├─ _humo.py · _humo/      Paso 0.4 · el cronómetro de motores
└─ _entorno.txt           Paso 0.2
```

---

## Desviaciones declaradas

| # | Desviación | Severidad | Vía de cierre |
|---|---|---|---|
| **D1** | **Dos PNG quedaron fuera del proyecto, en `C:\laminas\mon1\_humo\`** (882 854 B y 959 604 B). La primera corrida de la prueba de humo usó una ruta relativa y Blender la resolvió **contra la raíz del disco**. El script ya usa rutas absolutas | **Media** — viola «nada más se crea» | **Sigue abierta.** El borrado automático fue denegado por permisos: hay que retirar `C:\laminas` a mano |
| **D2** | ~~El oro mide `#e4a236`~~ → **cerrada.** Victor selló la salida (a) y el delta B lo movió a `#eba738` (rojo a Δ+3 del objetivo) | — | ✅ Cerrada |
| **D4** | **El reverso no es identidad sellada.** El activo define una sola cara y las monedas giran al caer | **Media** — heredada de la Fase 0 | Campaña de identidad, si algún día se quiere un reverso propio. Etiquetado en el README |
| **D5** | `laminas/` **no estaba en `.gitignore`**, y el maestro pesa **127 MB** | — | ✅ **Cerrada por la mano de Victor durante esta sesión.** `.gitignore` aparece modificado en el árbol con las tres líneas recomendadas (`laminas/mon1/render/png/`, `_calib/`, `_humo/`). Verificado con `git check-ignore`: el maestro y las sondas ya no se rastrean. **El cambio no lo hice yo** —la ficha prohíbe tocar archivos existentes—, pero queda anotado porque deja el árbol con una modificación sin confirmar |
| **D12** | `laminas/mon1/__pycache__/heptacoin.cpython-311.pyc` — bytecode que dejaron mis scripts de sonda al hacer `import heptacoin` | **Baja** | Es regenerable y no lo referencia nada. **El borrado automático fue denegado por permisos**; se retira a mano, o se añade `__pycache__/` al `.gitignore` en la misma pasada que lo demás |
| **D6** | **El borde superior del fondo mide `#020503` y el inferior `#102216`**, contra `--green-abyss #09170e`. Los laterales sí caen en el abismo (`#08150c`) | **Baja** | Es caída de luz sobre el suelo, no error de la rampa: arriba llega menos clave, abajo más. Ambos bordes mueren en un verde casi negro y el propósito de la decisión 3 —que la costura muera en el color más oscuro— se cumple, pero **el número no es idéntico** y aquí queda dicho. Cerrarlo exigiría una componente emisiva en el suelo, que se llevaría por delante las sombras de contacto |
| **D7** | **El rebote de canto mide 0,20 u (0,43 radios), no «un radio»** | **Media** — cifra sellada no cumplida entera | Medido: con un radio la cima sale **del cuadro** (y=1,026), no sólo de la banda. El techo es 0,45 radios para la banda 16:7 y 0,90 para el borde. Se priorizó la decisión 9 porque su fallo es invisible aquí y visible en producción. **Decisión de Victor:** `ALTURA_REBOTE_CANTO = 0.42` recupera 0,90 radios a cambio de cinco fotogramas fuera de banda; volver a 0,20 no cuesta nada |
| **D9** | **La héroe en reposo asoma 0,009 por debajo de la banda 16:7** (y=0,102 contra 0,111) — unos 6 px de 720 | **Baja** | No lo trae ningún delta: es la postura de reposo de siempre, y aparece porque la medición pasó de 4 puntos por moneda a la silueta de 96. **Corrijo mi propio verdicto anterior de «DENTRO»**. Cerrarlo exige mover `HEROE_XY`, y eso cambia el reposo → re-render de los 135 |
| **D10** | **El tramo D no es literalmente bit-idéntico:** 108 píxeles de 921 600 con ±1–2 niveles | **Baja** | Cambiar el canal de rotación de la héroe de Euler a cuaternión mueve los últimos bits de su matriz y desvía un puñado de muestras. Está por debajo del escalón de cuantización de H.264 y VP9. Cerrarlo cuesta 8 min: `-- animar 90 134` |
| **D11** | **Mientras está de canto se ve el REVERSO**, el provisional sin H ni estrellas | **Media** | Es geometría, no elección: que el vuelco venga hacia cámara obliga a que la normal del anverso apunte en contra de ella, así que la cara visible durante el vuelo es la de atrás. Sale ~20 fotogramas, pequeña y con desenfoque. Enlaza con D4 — si algún día se sella un reverso propio, esto deja de ser una desviación |
| **D8** | **El campo de la héroe en el video mide `#f7b34e`** (247·179·78, tono 35,9°), no el `#eba738` del retrato | **Baja** | La héroe reposa 0,67 u más cerca del eje de la clave y el nuevo suelo verde le rebota luz. Curiosamente **acerca** el verde y el azul al objetivo `#e8b84b` (Δ −5 / +3 contra Δ −17 / −19 del retrato) y aleja el rojo (+15). La potencia de la clave **no se retocó** a propósito: se calibra en las condiciones del retrato para que el material sea bit a bit el que pasó la compuerta |

---

## Cobertura declarada

| Punto | Estado |
|---|---|
| 0.1 Blender | ✅ 4.5.10 LTS |
| 0.2 Python embebido | ✅ 3.11.11, escribe |
| 0.3 Códecs | ✅ H.264 y VP9 probados fijándolos, no leyendo la lista — y **usados** en el Paso 2 |
| 0.4 Cronómetro | ✅ Cycles CPU 10,03 s · Eevee 4,46 s · **motor sellado: Cycles CPU** |
| 0.5 Importación del SVG | ✅ Ejecutada · diagnóstico de la Fase 0 **confirmado** |
| **Paso 1 · retrato** | ✅ Entregado, medido y **SELLADO** por Victor el 31-ago, con tres deltas aplicados |
| **Paso 2 · los 135 fotogramas** | ✅ **Ejecutado.** 23,7 min · tres salidas dentro de techo · `tiempos.json` · `lamina.html` · README |
| **Delta del vuelo de la héroe** | ✅ **Aplicado.** Tramo C reescrito · **30 fotogramas re-renderizados en 5,6 min** · empalme verificado con MD5 y con píxeles |

**No se modificó ningún archivo existente. No se instaló nada. No hay commits ni
push.** Los archivos nuevos viven en `laminas/mon1/` y en `docs/reportes/`, salvo
la desviación D1.

*Un verde mide lo que dice: 135 fotogramas en 23,7 minutos y 30 más en 5,6, la
banda 16:7 proyectada sobre la silueta real —que obligó a corregir mi propio
verdicto—, un fondo verificado a Δ (0, 0, 0), una costura aislada apagando
lámpara por lámpara, un empalme comprobado píxel a píxel, y un `moov` que se
subió al principio y se comprobó decodificando los 135 fotogramas de vuelta.*
