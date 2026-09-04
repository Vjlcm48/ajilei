# MON-1 · Heptacoin 3D · taller de render

**Estado: Paso 2 ejecutado.** Compuerta del Paso 1 sellada por Victor el 31-ago
(material y relieve aprobados, más tres deltas que ya están aplicados). El video
de 135 fotogramas, sus tres salidas y la hoja de tiempos están abajo.

## Cómo se corre

```powershell
$B = "C:\Program Files\Blender Foundation\Blender 4.5\blender.exe"

& $B -b -P laminas/mon1/heptacoin.py -- retrato      # Paso 1 · los dos fotogramas de compuerta
& $B -b -P laminas/mon1/heptacoin.py -- sonda        # mide sin comprometer el lote (~1 min)
& $B -b -P laminas/mon1/heptacoin.py -- animar       # Paso 2 · los 135 PNG + tiempos.json
& $B -b -P laminas/mon1/heptacoin.py -- codificar    # MP4 + WebM + póster desde el maestro
```

`animar` acepta un rango —`-- animar 60 89`— para los deltas que sólo tocan un
tramo: re-renderizar los 135 sería tirar 24 minutos y, peor, arriesgarse a que un
fotograma que nadie tocó salga distinto. Cycles es determinista con la semilla
fija, así que los nuevos empalman con los viejos sin costura, y se comprueba
comparando el MD5 de los fotogramas frontera antes y después.

`animar` y `codificar` están **separados a propósito**: recodificar con otro
techo de peso, o sacar el 1080 el día que se pida, no debe costar otra hora de
Cycles. El maestro PNG queda para eso.

## Qué hay aquí

| Archivo | Qué es |
|---|---|
| `heptacoin.py` | **El script único.** Construye, anima, ilumina, encuadra, calibra, renderiza, codifica y escribe la hoja de tiempos. No hay `.blend`: un binario no se revisa ni se audita contra el activo |
| `tiempos.json` | Los 9 impactos, escritos **por el script** desde las mismas constantes que animan — no se pueden desincronizar de lo que se ve |
| `lamina.html` | Previsualización sobre el fondo **real** de la portada (`theme.css` enlazado, no copiado), con los pesos contra sus techos y la pasada de movimiento reducido |
| `render/retrato.png` | El retrato de la compuerta — moneda de cara a 55°, luz definitiva |
| `render/encuadre-video.png` | El mismo instante desde la cámara sellada del video (24°) |
| `render/png/` | **El maestro RGBA**, 135 fotogramas. No se publica |
| `render/heptacoin-720.mp4` · `.webm` · `heptacoin-poster.webp` | Las tres salidas publicables |
| `_calib/` | Sondas de calibración y vistas de trabajo. Regenerables |
| `_humo.py` · `_humo/` | Paso 0.4 · el cronómetro de motores (cilindro dorado) |
| `_entorno.txt` | Paso 0.2 · la prueba de que el Python embebido escribe |

## Decisiones que este código materializa

- **La moneda se RECONSTRUYE, no se importa.** Todos los números salen de
  `src/assets/heptacoin.svg` y están al principio de `heptacoin.py`, auditables
  línea por línea contra el activo. El Paso 0.5 confirmó por qué: el importador
  de SVG **no trae las siete estrellas** (son `<use>` sobre `<defs>`), y los dos
  círculos con `stroke` llegan como contornos de área cero, sin ancho ni patrón
  de guiones.
- **Torneado antes que booleanos.** Los cuatro anillos concéntricos —campo,
  filete interior, canto y filete vino— son revoluciones puras y salen exactos de
  un `spin`. El único booleano es el de las siete estrellas.
- **Las estrías se SUMAN.** El torno ya deja el surco del canto dando la vuelta
  entera; las 72 mesetas que lo interrumpen se añaden. Sale del mismo
  `dasharray 1.8 2.2` y ahorra un booleano de 72 piezas.
- **La H es un solo contorno.** Extruir los siete `<rect>` por separado dejaba
  caras internas enfrentadas en cada empalme, y Cycles las sombreaba como huecos
  negros. Se recorre el contorno una vez.
- **Transformación de vista `Standard`, no AgX.** El criterio del oro
  (`#e8b84b` en el centro del campo) sólo significa algo si el paso de lineal a
  sRGB es el directo. Vale igual para la codificación: los PNG ya son sRGB.
- **Ocho monedas, UNA malla.** Los ocho objetos comparten los mismos 7 981
  polígonos. No es sólo memoria: garantiza que ninguna moneda pueda salir con un
  relieve distinto del que pasó la compuerta.
- **Claves, no física.** La ficha lo sella y la coreografía lo agradece: el
  contacto de canto de la héroe **es** el fotograma 72 porque está escrito que lo
  sea. Un solucionador habría dado el que hubiera dado.

## Los tres deltas de material que Victor selló sobre el retrato

| Delta | Qué cambió | Por qué |
|---|---|---|
| **Costado y bisel de oro** | El vino `#7c1d30` queda confinado a la **superficie plana** del anillo r 45→47. Pared cilíndrica y bisel: oro | El cuño define el vino como un anillo plano de la cara; toda geometría que el 3D inventa rige por el oro único. **La frontera es la NORMAL de la cara, no una cota en `z`** — así el reparto sobrevive a que se recalibre el rebaje o el ángulo del bisel |
| **A · el vino se comporta como vino** | `Metallic` 0,6 → **0,15**, `Roughness` 0,45 → **0,55**, rebaje 0,4 → **0,7 u** | A 0,6 el anillo devolvía especular metálico y se encendía como una banda. Medido: el tono pasó de 9,2° a **0,0°** y el verde cayó 14 puntos. Es la diferencia entre un anillo de metal rojo y un cuño esmaltado |
| **B · el oro se afina** | `Roughness` 0,30 → **0,24** | El video vive a 24° y el metal tiene que tener vida en ese ángulo. El campo pasó de `#e4a236` a `#eba738` |

## La coreografía v2, fotograma a fotograma

| Tramo | Fotogramas | Qué pasa |
|---|---|---|
| **A** | 0 – 56 | Siete monedas caen y se apilan. Impactos en **12 · 19 · 26 · 32 · 39 · 45 · 52**, cada una con giro que se frena al contacto y ~2 u de desalineación alternada |
| **B** | 57 – 59 | Latido de pausa |
| **C** | 60 – 87 | La héroe **cae en vertical**: entra en 60 de canto con las estrías a cámara y un giro leve de rueda que se frena en el 70 · **contacto de canto 72** · rebote corto (ápice **76**) · **segundo contacto 80** · **vuelco de 90° en una sola rotación** hasta quedar plana con el anverso arriba en el **87**. Sin bamboleo |
| **D** | 90 – 134 | El barrido especular cruza la cara en 45 fotogramas |

### El vuelco de la héroe · lo que hay que saber para tocarlo

- **Va en cuaterniones, no en Euler.** «Girar 90° sobre un eje horizontal
  cualquiera y acabar exactamente en la orientación de reposo» obliga, con
  ángulos de Euler, a mover dos o tres canales a la vez: cada uno llega a su
  destino por su cuenta y lo que se ve es un contoneo, no un vuelco. Con un
  cuaternión hay un solo arco. `_mismo_hemisferio()` fuerza el signo porque
  `q` y `−q` son la misma rotación pero no el mismo camino: en hemisferios
  opuestos, un vuelco de 90° se convierte en una vuelta de 270°.
- **El reposo se calcula hacia atrás.** La posición y la orientación del
  fotograma 87 son las de antes del delta, para que el tramo D siga siendo
  bit-idéntico. Se fija el reposo y se despeja la postura de canto:
  `q_canto = q_vuelco⁻¹ · q_reposo`.
- **`BETA_CANTO = 55°` es un dial, no una constante caprichosa.** El delta pide
  dos cosas que la geometría no concede a la vez: estrías legibles (la normal de
  la cara **perpendicular** a la visual) y vuelco hacia cámara (la normal **en
  contra** de la cámara). A 55° el vuelco conserva un 57 % de componente hacia
  cámara y la cara queda escorzada a ese mismo 57 %, con el canto recorriendo
  toda la silueta. **De canto puro las estrías se leerían peor, no mejor**: la
  moneda sería una rendija de 0,10 u.
- **`ALTURA_REBOTE_CANTO = 0,20 u`, no un radio.** De canto la cima de la moneda
  está un radio por encima de su centro, que ya está a un radio del suelo. Con
  un radio de rebote la cima sale **del cuadro** (y = 1,026). El máximo que
  respeta la banda 16:7 es 0,45 radios. La constante lleva la aritmética al lado.
- **`Z_HEROE_SALIDA = 2,05`**, y no la que dictaría la gravedad de la escena: de
  canto la moneda mide 0,94 u de alto, así que a la altura de la versión plana
  asomaba por arriba del cuadro durante los sesenta fotogramas que está aparcada.
  La caída sale a 20,4 u/s², que es lo que la ficha pide de la héroe con
  «llega tarde y rápida».

**Sin bucle.** El fotograma 0 es un vacío y el 134 es la escena en reposo: son
estados distintos y un `loop` daría un corte. El video se reproduce una vez y se
congela en el 134. **El póster es el 134, no el 0** — si el video no arranca, lo
que queda en pantalla tiene que ser la escena terminada.

## El fondo, horneado y medido

El degradado del video **es** el de la portada: el mismo
`radial-gradient(ellipse at 42% 38%, --green-bright, --green-deep, --green-abyss)`
de `welcome.css`, calculado con la geometría `farthest-corner` de CSS,
interpolado en sRGB (como hace el navegador, no en lineal) y forzado a
`--green-abyss` en los **cuatro bordes** por una viñeta. Va como textura en
coordenada `Window`, así que la viñeta muere en el borde del CUADRO y no en un
anillo del suelo que la perspectiva deformaría.

Dos correcciones que salieron de medir, no de mirar:

1. **El especular del suelo se apagó.** El `Principled` trae 0,5 de serie, y
   sobre un verde casi negro ese brillo dieléctrico se comía el color: el fondo
   del encuadre sellado medía `#363529`, un gris cálido, no un verde.
2. **El contorno ya no alumbra el fondo.** Dejaba una **costura recta** cruzando
   el suelo. Se aisló apagando lámpara por lámpara: una lámpara de área es de una
   sola cara y su luz se corta en seco en su propio plano — invisible sobre negro,
   evidente sobre verde. Se corrigió con **enlace de luz**, sin tocar posición,
   potencia ni color: el contorno alcanza sólo a las ocho monedas, que es
   exactamente para lo que la decisión 8 lo puso.

## ⚠️ El reverso NO es identidad sellada

La cara de atrás lleva **campo + filete interior + canto estriado + filete vino,
sin H ni estrellas**. Es un **reverso de render, provisional**, decidido para
esta campaña porque las monedas giran al caer y el reverso se ve. **El activo
`heptacoin.svg` define una sola cara**; sellar un reverso propio es campaña de
identidad, no de render.

## ⚠️ Dos cosas para la mano de Victor

1. **`C:\laminas\mon1\_humo\` hay que borrarlo a mano.** La primera corrida de
   `_humo.py` usó una ruta relativa y Blender la resolvió contra la raíz del
   disco: quedaron dos PNG fuera del proyecto. El script ya usa rutas absolutas y
   no vuelve a pasar, pero **el borrado automático fue denegado por permisos**.
2. **`laminas/` no está en `.gitignore`**, y `render/png/` es el maestro completo.
   No se toca desde aquí —la ficha prohíbe modificar archivos existentes—, pero
   conviene añadir `laminas/mon1/render/png/`, `laminas/mon1/_calib/` y
   `laminas/mon1/_humo/`, con el mismo criterio que `capturas-dsk`.
