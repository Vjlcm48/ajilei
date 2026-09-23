# AJILEI · APU-1 · Fase 1f — Informe · v1.0

**Campaña:** APU-1 — Apuestas, pilas y agresividad de las IAS
**Fase:** 1f · **Parte A** — humo del arnés en viewports de teléfono · **§A2** — E-29 arreglado · **§A3** — la promesa de §5.3 vuelve al teléfono · **§A4** — lo que las partidas sellaron · **§A5** — aire en la tarjeta de recarga
**Ejecutor:** Claude Code · **Decisor:** Victor · **Rector:** Claude (chat)
**Base:** `main` en `f9ee503` + 1a…1e-iv, sin commitear
**Fecha:** 2026-09-18 (§A, §A2) · 2026-09-19 (§A3, §A4) · 2026-09-21 (§A5)
**Fichas:** `AJILEI_APU-1_Fase1f_v1.0.md` §A (A.1 … A.5) · `AJILEI_APU-1_Fase1f_v1.1.md` Parte A2 · `AJILEI_APU-1_Fase1f-A3_v1.0.md` Parte A3 · `AJILEI_APU-1_Fase1f-A4_v1.0.md` Parte A4 · `AJILEI_APU-1_Fase1f-A5_v1.0.md` Parte A5

---

## Veredicto de la Parte A, en una línea

**La marca ALL-IN cabe en las cuatro mesas del teléfono y no hay que abrir el CSS
protegido** — el STOP de A.2 no se dispara —, `msg` y `retar` siguen verdes donde
ya corrían y la build que Victor va a usar sale limpia de moldes. El humo
destapó **una cosa que no se sabía: en 360×640 la pregunta de recarga automática
tapaba las cinco cartas del jugador enteras** (E-29), que es justo la promesa que
§3b de `apu.css` hace y que en escritorio cumplía.

**§A2 lo arregla**, con el mandato de la v1.1 de la ficha y sólo en `apu.css`:
la tarjeta pasa de 274,02 a 142,78 px y de tapar el 100 % de las cartas a **0 px²
de solape, también con el óvalo y también con el peor texto que el producto puede
emitir**. `apu` cierra **7/7 en los siete viewports**.

**§A3 devuelve al teléfono la promesa de §5.3**, que el arreglo de A2 había
dejado sin decir. No por CSS —A2.5 midió que ahí no hay sitio— sino por texto:
la nivelación de las IAS se muda al subtítulo de las dos recargas blandas, y lo
que sale para hacerle hueco es una pregunta que los botones ya hacían. `apu`
sigue **7/7** y la tarjeta no se mueve un píxel.

**§A4 aplica lo que Victor decidió jugando.** Seis cifras estaban sobre la
mesa; se movieron dos —**el piso de entrada, de 5× a 10×, y el plazo de la
recarga, de 10 a 15 s**— y el resto se quedan porque alguien las jugó y no le
chirriaron. Con ellas entran las dos decisiones de voz que A3 dejó abiertas: la
promesa de §5.3 se dice **entera y una sola vez**, en el subtítulo de las dos
recargas blandas, y la nota de escritorio se retira (**E-31**, cerrado). Y los
cinco botones de la tarjeta en teléfono apaisado se pueden tocar: la queja de
Victor tenía un número, y era **cero píxeles entre la fila de montos y la de
acciones**.

Con A4 no queda nada de 1f en la mesa del rector. Lo que sigue son las
campañas y hallazgos de siempre (§A4.8) y la ficha de commits.

---

## §A.1 · Lo que se añadió al arnés, y por qué

`apu` medía en CUATRO viewports, todos de escritorio. Las veinte capturas de 1e
y el número que decidió que la marca ALL-IN no necesitaba CSS propio —«ocupa
69,56 px y el hueco más estrecho son 151»— salieron de ahí. En un teléfono ese
hueco no existe: `.opp-status` en 360 de ancho es otra caja, con otra tipografía
y otro reparto.

Se añaden los **tres viewports de móvil** de la familia de `lob` / `retar` /
`diagSAL` —360×640 portrait, 640×360 y 844×390 apaisados— a los cuatro de
escritorio. Son **siete y no diez** porque tres de los seis de aquella familia
ya son de escritorio y `apu` ya los cubría; comparar contra otra lista haría
incomparables las capturas de las cuatro pantallas de la campaña.

`movil` no es una etiqueta en el JSON: enciende `hasTouch` e `isMobile`, que es
lo que hace existir la media query táctil de `gameTable.css` y con ella el piso
de 40 px. Sin eso se habría medido un escritorio estrecho y no un teléfono.

Los **siete puntos** de `apu` corren en los siete viewports sin cambiar una
condición. En **portrait** se añaden cuatro medidas más, que son las que la ficha
nombra y las cuatro dependen de un ancho que el escritorio nunca tiene:

1. la marca ALL-IN contra el hueco de **cada mesa** (5/4/3 por `.opp-panel`, la
   de 2 por `.ai-zone`, que es la vía legacy que el hook de orientación monta en
   vertical);
2. el botón All-in con el monto de **cuatro cifras**, y de cinco;
3. la pregunta de recarga **automática** contra las cartas y el óvalo, en píxeles
   cuadrados;
4. la **línea del humano en all-in** contra el alto del «pensando» al que releva.

Los cuatro **entran en el veredicto de la celda**, como los siete. Es E-26 de
1e-iv aplicado antes de que vuelva a hacer falta: una cuenta que se imprime al
lado del veredicto y no dentro de él no sirve para nada.

---

## §A.2 · La marca ALL-IN, por viewport

El rótulo se mide con un `Range` —el ancho del TEXTO, no el de su caja— contra el
ancho útil de la ranura que lo aloja. **El STOP de A.2 no se dispara: cabe en una
línea en los siete viewports, sin recortarse en ninguno.**

| viewport | qué es | marca ALL-IN | hueco `.opp-status` | líneas | ¿cabe? | los 7 puntos |
|---|---|---|---|---|---|---|
| 360×640 | móvil portrait | 43,69 px | 100 px | 1 | sí | **tel.recarga** |
| 640×360 | móvil landscape | 50,23 px | 97 px | 1 | sí | 7/7 |
| 844×390 | móvil landscape | 50,23 px | 127 px | 1 | sí | 7/7 |
| 1024×768 | escritorio | 73,17 px | 151 px | 1 | sí | 7/7 |
| 1280×720 | escritorio | 73,17 px | 151 px | 1 | sí | 7/7 |
| 1366×768 | escritorio | 73,17 px | 151 px | 1 | sí | 7/7 |
| 1920×937 | escritorio | 73,17 px | 174 px | 1 | sí | 7/7 |

La celda más apretada de todas es **640×360**, donde el hueco baja a 97 px y el
rótulo sube a 50,23: aun así sobran 46,77 px, casi la mitad. Y el hueco está
fuera de flujo desde C4.3.1 (`position: absolute` en §H5 de `opponentPanel.css`),
así que diga lo que diga no mueve un píxel de la fila.

### Portrait · la marca contra el hueco de CADA mesa

Las cuatro mesas, una por una, en 360×640. Importa porque **no es la misma caja**:
5/4/3 pintan el rival por `OpponentPanel` y la de 2 EN VERTICAL lo pinta por la
vía legacy `.ai-zone`, que es la que monta el hook de orientación.

| mesa | vía de render | marca | hueco del rótulo | hueco de la caja | líneas | ¿cabe? |
|---|---|---|---|---|---|---|
| 5 | `.opp-panel` | 43,69 px | 100 px | 156 px | 1 | sí |
| 4 | `.opp-panel` | 43,69 px | 100 px | 156 px | 1 | sí |
| 3 | `.opp-panel` | 43,69 px | **99 px** | 155 px | 1 | sí |
| 2 | `.ai-zone` | 43,69 px | 260 px | 316 px | 1 | sí |

El hueco más estrecho del teléfono en vertical es el de la **mesa de 3** (99 px) y
la holgura sigue siendo de **2,3×**. La mesa de 2 no es comparable con las otras
—su ranura es más de dos veces y media más ancha— y por eso se dice por qué vía
salió cada medida: una cifra sin la vía al lado no se puede comparar con la
siguiente.

---

## §A.3 · Las otras tres medidas de portrait

### El botón All-in con el monto largo

El botón dice la pila entera, y la que el molde deja en la mesa más barata son
dos cifras (`All-in (25)`). Las cuatro cifras existen de sobra en el producto
—Pro a 1.000 con entrada de techo sienta al jugador con 50.000— pero llegar a
ellas jugando no es determinista, así que se aplica la **receta O2: el peor caso
se construye.** Se le cambia el rótulo al botón VIVO, en su fila viva, con sus
hermanos y su tipografía, se mide, y se le devuelve el suyo.

| rótulo | ancho del botón | ancho del texto | líneas | dentro | recorta | mismo alto que sus hermanos | la fila desborda |
|---|---|---|---|---|---|---|---|
| `All-in (25)` (real) | — | — | 1 | sí | no | **sí** (32 px, hermanos 32) | no |
| `All-in (2250)` | 101,14 px | 71,14 px | 1 | sí | no | sí | no |
| `All-in (50000)` | 108,06 px | 78,06 px | 1 | sí | no | sí | no |

**Cabe con cuatro cifras y también con cinco**, que es el techo real que el
producto puede emitir. La fila no desborda en ninguno de los tres casos y el
botón no es el raro de su fila — que es la regla de 1e, y la correcta: el piso de
40 px vive dentro de la media query táctil y exigirlo donde no aplica sería
pedirle al botón nuevo algo que ninguno de sus hermanos cumple.

### La línea del humano en all-in

> «Estás all-in — tus cartas siguen jugando.»

**256,08 px en un hueco de 296. Una línea. Caja de 68,16 px, exactamente la misma
que la del «pensando» al que releva.** La promesa del JSX —«ocupa el mismo hueco
que el pensando: ni una caja más»— se cumple también en 360 de ancho, con 39,92 px
de margen. No se recorta y no se sale de la ventana.

Un detalle que costó encontrar y que conviene dejar escrito: **en la mesa de DOS
esta línea no existe nunca**, y no es un fallo. Cuando el humano empuja su pila,
el único rival responde y a partir de ahí queda UN solo asiento capaz de poner
una ficha: `abrirApuesta` no abre esa fase (§4.3), así que no hay ninguna ronda
de apuesta en la que el humano esté en all-in. Hace falta una mesa donde queden
DOS rivales con fichas, y por eso la medida se toma en la de cuatro.

### La pregunta de recarga — **la única roja de la tanda**

Ver **E-29** abajo. En resumen, con la automática abierta en 360×640:

| qué | medida | veredicto |
|---|---|---|
| tarjeta | 360 × 274,02 px, borde superior en y=353,98 | — |
| solape con las cartas del jugador | **24.591,9 px² de 24.591,88 — el 100 %** | **ROJO** |
| solape con el óvalo | 5.728,97 px² | **ROJO** |
| solape con el pozo | 0 px² | verde |
| contador de 10 s | «Se cierra en 10 s», visible y dentro | verde |
| ranura de «Siguiente mano» | reservada, 68,16 px, y el botón no existe | verde |
| Δ de la zona del jugador al abrir y cerrar | top 0 · alto 0 | verde |
| nota de §5.3 | visible (la ventana no baja de 620 px de alto) | verde |

---

## §A.4 · Los tres veredictos

| modo | celdas | veredicto |
|---|---|---|
| **`apu`** | 7 viewports × 7 puntos, + 4 medidas en portrait | **6/7 en 1f-A** (la única roja, `tel.recarga` en 360×640 — E-29) → **7/7 tras §A2** |
| **`msg`** | compositor 92 casos · jugado 7/7 · Δ larga 7/7 · caza 2/2 · fin 1/1 | **VERDE** |
| **`retar`** | 6/6 celdas, los seis viewports de la familia | **VERDE** |

Sobre `msg`, dos cosas que la ficha pedía saber:

- **Ya cubría teléfono**, y por eso A.3 mandaba no ampliarlo: tres de sus siete
  celdas jugadas son de móvil (mesa 5 y mesa 2 a 360×640, mesa 2 a 740×360). Las
  tres salieron verdes, con el texto re-derivado del estado visible mano a mano.
- **El rojo intermitente de E-22 no se reprodujo.** Aquel fallo —mesa 5 a
  1366×768, el nombre de IA 4 que no admite el toque en 2.500 ms— era «una vez de
  cuatro» en 1e; esta corrida destapó las 18 manos por toque, 18 de 18, sin un
  timeout. Se deja como estaba: consignado y sin tapar con un plazo más largo.
  Que no salga una vez no lo cierra.

El único aviso de las tres corridas es de ARN-1 y no es de APU-1: **E-30**, la
deriva del navegador.

En `apu`, las **dos celdas apaisadas de teléfono salieron 7/7 a la primera** —los
siete puntos, incluidos la recarga y las capas—, así que lo que falla en vertical
no es «el teléfono»: es esa ventana.
## §A.5 · La build que Victor va a usar

`npm run build` ✓ en **234 ms**. Sobre `dist/`, medido y no supuesto:

- **cero `?apu`** y **cero `siembra*`** — ni `siembraAPU`, ni `siembraMesaAPU`,
  ni `APU_PARAM`, ni el nombre de uno solo de los seis moldes. La puerta doble de
  `siembraAPU.js` (`import.meta.env.DEV` en la primera línea de las dos
  funciones) hace lo que promete: el minificador se lleva el archivo entero.
- **cero `VITE_AUTH_BYPASS`**, así que `AUTH_BYPASS` es `false` y **la Portada
  existe**. Comprobado sirviendo la build en `vite preview` y abriéndola en
  360×640: sale la Portada, con la consola LIMPIA, y `?apu=saldo:99999` no tiene
  el menor efecto. Captura en `capturas-apu/tel/build_portada_360x640.png`.
- `SALDO_PROVISIONAL` viaja al bundle (`5e3`).

**El saldo con que arranca la sesión son 5.000 HC** — `src/lib/saldo.js`, la
constante que 1e-iii bajó ahí para que ECO-1 tenga un solo sitio que tocar.

La vía de servicio es la de SAL-B2 (`vite preview` + túnel de Cloudflare;
`vite.config.js` ya lleva `preview.allowedHosts: ['.trycloudflare.com']` para
eso). El túnel lo levanta Victor, como en E1–E8: `cloudflared` no está instalado
en esta máquina y montarlo no es de esta tanda.

---

## §A.6 · Dos de las cuatro partidas del guion no se pueden jugar

Esto no es un defecto del producto: es aritmética entre el guion de la Parte B y
los 5.000 HC de `SALDO_PROVISIONAL`. Sale aquí porque **A.4 manda anotar el saldo
«porque el guion de abajo depende de él»**, y de él depende más de lo que la
ficha suponía.

| partida | pedida | lo que hay | veredicto |
|---|---|---|---|
| **B.1** «la carrera» | Básico · 5 · **50** · Mínimo 5× = **250** | Básico ofrece 50 · 100 · 150 · 250; tope de sesión 2.500 | **jugable** |
| **B.2** «la mesa» | Avanzado · 3 · **100** · Medio 15× = **1.500** | Avanzado ofrece 100 · 200 · 300 · 500; tope de sesión 5.000 | **jugable** |
| **B.3** «el duelo» | Pro · 2 · **200** · Techo 50× = **10.000** | el techo de esa mesa son 10.000 y el bolsillo son 5.000 → `topeEntrada` = **5.000** | **el chip «Techo» sale APAGADO** |
| **B.4** «el corto» | Básico · 2 · **500** · Otra… = 3.000 | **Básico no tiene una mesa de 500**: son 50 · 100 · 150 · 250. La de 500 es de Avanzado | **la mesa no existe** |

Las dos sustituciones más cercanas, que conservan lo que cada partida existe para
forzar:

- **B.3 · el duelo.** Pro · 2 jugadores · apuesta **200** · **«Otra…» = 5.000
  (25×)**. Es el techo REAL de la sesión, el que `topeEntrada` calcula, y sigue
  siendo la mesa más honda que el bolsillo permite — que es lo que la partida
  quiere. Las preguntas 11 a 14 no cambian. Si el rector quiere el techo de
  verdad (50×), la única salida es subir `SALDO_PROVISIONAL`, y eso es tocar
  `src/` sin mandato: no se ha hecho.
- **B.4 · el corto.** Básico · 2 jugadores · apuesta **250** · **«Otra…» = 1.500
  (6×)**. Mismo reto, misma profundidad de seis apuestas, y es la mesa más cara
  que Básico tiene. Si lo que importaba era «la mesa más cara que el saldo
  permita» sin atarse a Básico, la alternativa es **Pro · 2 · 1.000 · Mínimo 5×
  = 5.000**: ahí la entrada se come el bolsillo entero y la pila arranca a cinco
  apuestas, que es el piso absoluto de §2.2 y el caso más duro que el producto
  admite.

**No se ha cambiado nada por cuenta propia.** Las dos sustituciones son
propuestas; el guion lo sella el rector.

---

## Hallazgos de 1f-A

### E-28 · El número de 1e no era transferible; la relación sí

`apu.css` lleva escrito en su cabecera por qué la marca ALL-IN no necesita una
regla propia: «se midió antes de escribirla — "ALL-IN" ocupa 69,56 px y el hueco
más estrecho —mesas 4 y 5 a 1024, 1280 y 1366— son 151».

De las dos cifras, **una no vale fuera de escritorio y la otra ya no vale ni
dentro**:

- en 360×640 el rótulo mide **43,69 px** y el hueco más estrecho son **99 px**;
- en 640×360 mide **50,23** contra **97**;
- y en los mismos 1024 · 1280 · 1366 de entonces mide hoy **73,17 px**, no 69,56.
  Los 151 del hueco siguen exactos. El rótulo creció 3,61 px (+5,2 %) sin que
  nadie tocara una línea: es la deriva del navegador (**E-30**).

La conclusión de 1e aguanta entera —cabe en una línea, no se recorta, y no hay
que abrir `opponentPanel.css`— pero aguanta **por la relación, no por el número**.
La lección conviene dejarla dicha porque es fácil de repetir: **una medida
absoluta sin el viewport y el navegador al lado no es una medida.** El comentario
de `apu.css` no mentía; se leía como si valiera para toda la app, y durante una
tanda entera lo fue.

### E-29 · En 360×640 la pregunta de recarga tapa las cartas del jugador — **resuelto en §A2**

§3b de `apu.css` parte la pregunta en dos láminas a propósito, y lo argumenta
bien: la forzosa bloquea porque detrás no hay nada que mirar; la automática y la
voluntaria se apoyan abajo «sin velo», con «la mesa viva y consultable detrás»,
porque taparle el showdown a quien está decidiendo es «pedirle que decida sin ver
el resultado que motiva la decisión».

En escritorio lo cumple. En **360×640** la tarjeta mide **360 × 274,02 px** —el
ancho entero de la ventana y el 43 % de su alto— y se apoya justo encima de la
zona del jugador: **solapa 24.591,9 px² de los 24.591,88 px² que miden sus cinco
cartas. El 100 %.** También se lleva 5.728,97 px² del óvalo.

La captura (`capturas-apu/tel/apu_recarga_360x640.png`) matiza el hallazgo y lo
hace más preciso, no menos: **la frase del resultado y el showdown de los rivales
SÍ se ven** —«IA 2 gana con Oros, 48 pts.», sus cinco cartas destapadas y el pozo
quedan por encima de la tarjeta—. Lo que desaparece son **las cartas del propio
jugador**, enteras. Así que §3b no falla del todo: falla en la mitad de abajo, que
es donde el jugador tiene lo suyo.

**En apaisado no pasa**: 640×360 y 844×390 dieron los siete puntos verdes. Ahí
manda el `@media (orientation: landscape) and (max-height: 520px)` de §4 de la
hoja —el traje corto, que aprieta gaps, montos y tipografías— y además el
`@media (max-height: 620px)` retira la nota de §5.3. Los 640 px de alto del
portrait quedan **veinte píxeles por encima** de ese umbral, así que la tarjeta se
pinta con su traje entero en la ventana más estrecha que hay. Es el caso que
ninguna de las dos reglas atiende.

Lo que **sí** cumple, medido en la misma corrida: el contador se ve entero, la
ranura de «Siguiente mano» sigue reservada (68,16 px) y la zona del jugador **no
se mueve un píxel** al abrirse ni al cerrarse la pregunta (Δ top = 0, Δ alto = 0).
O1 está cumplido; lo que falla es la promesa de §3b, y sólo en vertical.

**No se arregló en 1f-A**, y no por falta de sitio donde hacerlo —`apu.css` es
hoja nueva, no protegida—, sino porque 1f-A es humo: mide y consigna. La lámina
la selló el rector en la v1.1 de la ficha («la tarjeta vive entre el óvalo y las
cartas del jugador, nunca encima de ellas») y **§A2 la ejecuta**: 0 px² de solape.
De las dos formas que este informe proponía, la primera —extender el traje corto
por ancho— resultó insuficiente por sí sola, y la segunda —anclar a la banda
libre— resultó imposible tal cual: **esa banda mide dos píxeles**. Lo que lo
resolvió fue una tercera cosa que no se había visto: `width: 90%` en caja de
contenido. Ver §A2.

**La consecuencia para la Parte B se invierte:** la pregunta 3 de B.1 —«¿viste tu
mano y el resultado detrás, sin que la tarjeta los tapara?»— tenía respuesta
medida, y era *no*. Tras §A2 la respuesta medida es *sí*, y lo que Victor
responda ahí mide el arreglo, no el defecto.

### E-30 · El Edge de la máquina se ha adelantado dos versiones, y ya movió una cifra

ARN-1 lo avisa solo, que para eso se escribió: las baselines de píxel de la
campaña DSK se tomaron con **151.0.4129.93** y esta máquina corre hoy
**153.0.4234.32**.

Y esta vez no es un aviso teórico: **el rótulo «ALL-IN» mide 73,17 px donde 1e
midió 69,56**, en las mismas celdas, con el mismo texto y sin que nadie tocara
una regla. +3,61 px de puro navegador.

Ninguna medida de 1f-A depende de una baseline sellada —todas son relacionales,
texto contra su hueco— así que esta corrida vale entera. Pero los modos que SÍ
comparan contra píxeles guardados (`o1`, `o2`, `a1`, `a2`, `u1`) tienen ahora una
deriva sin auditar debajo, y la primera vez que uno de ellos dé rojo, **ésta es la
primera hipótesis que hay que descartar, no la última**. Es la misma disciplina de
E-24: antes de buscar la avería, comprobar que los dos lados se midieron con la
misma vara.

---

## §A.7 · Las capturas

**Veinticinco en `capturas-apu/tel/`**: seis por cada viewport apaisado —los seis
puntos que fotografían— y **doce en portrait**, porque las cuatro medidas añadidas
traen las suyas. La ficha pedía cinco por viewport; hay más porque hay más que
enseñar, no porque se hayan repetido:

| captura | qué enseña |
|---|---|
| `apu_allin_<vp>.png` | la marca ALL-IN en el asiento (mesa 4) |
| `apu_allin_m5/m4/m3/m2_360x640.png` | la marca en las cuatro mesas, portrait |
| `apu_boton_<vp>.png` | el botón All-in en el sitio de «Igualar» |
| `apu_boton4_360x640.png` | el mismo botón con el monto de cuatro cifras |
| `apu_respondido_<vp>.png` | el all-in ya pulsado, con el rival por contestar |
| `apu_lineahumano_360x640.png` | «Estás all-in — tus cartas siguen jugando.» |
| `apu_recarga_<vp>.png` | la pregunta de recarga — **la foto de E-29** |
| `apu_sinrival_<vp>.png` | la ronda sin juego de §4.3 |
| `apu_capas_<vp>.png` | el pozo partido |
| `build_portada_360x640.png` | la build de producción servida: la Portada existe |

Las de escritorio siguen en `capturas-apu/`, donde 1e las dejó, y se han
refrescado con esta corrida. `capturas-retar/` trae las seis de `retar`.

---

## §A.8 · Las varas

- `apu` **6/7 celdas** · `msg` **VERDE** · `retar` **6/6**
- `lint` **21 problemas (20 errores, 1 aviso)**, **Δ = 0**
- `build` ✓ en **234 ms**, `dist/` sin un solo residuo de molde
- **Los seis protegidos, al mismo blob con que cerró 1e-iv:**
  `21c4d3f56318` · `8cfc3736cba2` · `eb61426083ca` · `0d1bb8ea66a8` ·
  `3ce6383eec0d` · `1e21371c8543`
- `git log --oneline -1` → **f9ee503**. **Sin commits.**

`vitest` no se corrió: 1f-A no toca una sola línea de `src/`, y las 942 pruebas
de 1e-iv miden `src/`. Se dice en vez de dejarlo suponer.

---

## §A.9 · Lo que 1f-A NO tocó

Ni una línea de `src/`. `apu.css` —que no es protegida y donde viviría el arreglo
de E-29— sin abrir. Ninguna cifra de economía se ha movido: eso es §C y es del
rector. Sin commits.

El único archivo del repo que se MODIFICA es **`scripts/diagDSK.mjs`**: tres
viewports más en `apu`, las cuatro medidas de portrait, un filtro de celda
(`apu 360x640`, que antes no existía y que hace barata la próxima corrida
dirigida) y la entrada del modo en la cabecera del archivo, que tampoco existía.
El único archivo NUEVO es este informe. Nada más del árbol se ha tocado
(`capturas-apu/` y `dist/` están en `.gitignore`).

---

## §A.10 · Lo que sigue

Victor recibe la URL del túnel y empieza la **Parte B**, con las dos
sustituciones de §A.6 decididas antes de sentarse — si no, la tercera y la cuarta
partida se le caen en la pantalla de «Retar a las IAS» y perderá el rato
averiguando por qué.

Sobre la mesa del rector queda **una sola cosa**, y es del guion:

- **§A.6 y §A2.3 · el cuestionario.** Las dos sustituciones de las partidas 3 y 4
  —que la v1.1 de la ficha ya recoge—, la pregunta 5 de B.1 que se queda sin
  sujeto en el teléfono, y el rótulo de la 18.

**E-29 ya no está en esa lista: §A2 lo cierra.**

---

# §A2 · E-29 arreglado: la pregunta ya no tapa la mano

**Ficha:** `AJILEI_APU-1_Fase1f_v1.1.md`, Parte A2 · **Sólo `src/styles/apu.css`.**

## A2.1 · La banda que la ficha nombra no existe

Antes de tocar nada, la geometría de 360×640 con la recarga automática abierta:

| pieza | arriba | abajo | alto |
|---|---|---|---|
| zona de rivales | 52 | 233,50 | 181,50 |
| **óvalo** (`.center-zone`) | 237,50 | **372,00** | 134,50 |
| **zona del jugador** | **374,00** | 624,36 | 250,36 |
| las cinco cartas | 383,00 | **470,83** | 87,83 |
| barra del jugador | 477,83 | 616,36 | 138,53 |
| la tarjeta, como estaba | 353,98 | 628,00 | **274,02** |

**Entre el borde inferior del óvalo y el superior de la zona del jugador hay DOS
PÍXELES.** El paso 2 de la ficha —«anclar la tarjeta a esa banda, con `max-height`
a esa banda»— no se puede ejecutar como está escrito: no hay banda, y un
`max-height: 2px` sería recortar la pregunta, no acomodarla.

Lo que sí hay es el hueco que queda **debajo de las cartas**, que acaban en
470,83. Contando los 12 px de aire que el apoyo ya reserva contra el borde de la
pantalla, son **157,17 px**. Ésa es la vara real, y es contra ésa que se aprieta:
la decisión de lámina se cumple igual —la tarjeta no se pone encima de las
cartas— por el otro lado.

## A2.2 · Los dos pasos, medidos

### Paso 1 · el traje corto, también por ancho

El umbral del traje corto era sólo de alto (`max-height: 620px` para la nota,
`max-height: 520px` en apaisado para gaps y montos). El teléfono en vertical mide
**640** —veinte píxeles por encima—, así que la tarjeta se pintaba con su traje
entero justo en la única ventana donde no cabe. Se extienden los dos umbrales a
`(max-width: 480px)`.

**274,02 → 191,17 px.** Los tres montos pasan a UNA fila (88 → 36) y la nota de
§5.3 se retira. **Insuficiente:** la tarjeta arranca en 436,83 y las cartas acaban
en 470,83 — siguen tapadas 34,17 px.

### Paso 2 · el anclaje, y la causa de verdad

Aquí apareció lo que ninguna cuenta de gaps iba a arreglar: **`.bankrupt-modal`
hereda `width: 90%` en caja de CONTENIDO.** En 360 de ancho eso da 324 px de
texto dentro de una caja que ya ocupa los 360 enteros: **treinta y seis píxeles de
ancho tirados**, y son justo los que hacían al subtítulo partirse en dos
renglones. Con `width: 100%` y `box-sizing: border-box` el subtítulo cabe en uno.

Y una trampa de la misma familia: **bajarle la letra al título no le bajaba el
alto**, porque su `line-height` viene heredado EN PÍXELES. Hay que decírselo en la
misma regla.

Con eso, y apretando padding, márgenes y el renglón del plazo:

| | antes (1f-A) | después (1f-A2) |
|---|---|---|
| tarjeta | 360 × **274,02** px, arriba en 353,98 | 360 × **142,78** px, arriba en **485,22** |
| solape con las cinco cartas | **24.591,9 px² de 24.591,88 — el 100 %** | **0 px²** |
| solape con el óvalo | 5.728,97 px² | **0 px²** |
| solape con el pozo | 0 px² | 0 px² |
| holgura sobre las cartas | −34,17 px | **+14,39 px** |
| contador de 10 s | visible | visible |
| ranura de «Siguiente mano» | reservada, 68,16 px | reservada, 68,16 px |
| Δ de la zona del jugador al abrir y cerrar | 0 · 0 | 0 · 0 |

**No hizo falta el paso 3.** No se tocó CSS protegido, no se recortó el contador,
y **los botones no bajan de los 36 px** que el apaisado ya fija: por debajo de eso
la pregunta deja de ser tocable, y una pregunta que no se puede contestar es peor
que una que tapa.

### El peor caso, construido

La tarjeta medida lleva un subtítulo de dos cifras («Te quedan 50 HC…») y un
techo de cuatro («Al techo 2450»). El producto puede emitir más: la automática
salta bajo cinco apuestas, así que en Pro a 1.000 el subtítulo lleva cuatro
cifras, y el techo de la sesión puede llevar cinco. Receta O2 — se le inyectan al
DOM vivo los rótulos más largos que el producto puede producir y se vuelve a
medir:

| | rótulos reales | peor caso construido |
|---|---|---|
| subtítulo | «Te quedan 50 HC…» · 16,19 px, 1 renglón | «Te quedan 4950 HC…» · **16,19 px, 1 renglón** |
| montos | 88,80 · 80,86 · 101,83 px | «Mínimo 5000» · «Medio 15000» · «Al techo 50000» → 96,03 · 95,33 · **109,05** |
| la fila de montos, ¿desborda? | no | **no** (300,41 px + 10 de gaps en 332 de hueco) |
| alto de la tarjeta | 142,78 px | **142,78 px** |
| solape con las cartas | 0 px² | **0 px²** |

La tarjeta **no crece con el peor texto**, que es la propiedad que hace que este
arreglo no sea una casualidad de la mesa que se midió.

## A2.3 · Lo que el arreglo se llevó por delante, y hay que decirlo

La nota de §5.3 —**«Las IAS vivas se nivelan contigo.»**— ya no se pinta en
ningún teléfono: en apaisado no se pintaba desde 1e-ii (el umbral de
`max-height: 620px`), y ahora tampoco en vertical. La ficha lo autoriza
expresamente, y es el renglón correcto que sacrificar. Pero tiene dos
consecuencias que no se pueden dejar sin decir:

1. **El comentario que justificaba esa retirada era falso.** Decía: «la promesa
   de §5.3 cabe en el subtítulo cuando no hay sitio para las dos». No cabe: los
   tres subtítulos son «Puedes añadir hasta {hc} HC a tu pila.», «Te quedan {hc}
   HC. ¿Recargas antes de la próxima mano?» y «Con estas fichas la mesa no puede
   continuar.» — **ninguno menciona a las IAS.** Retirar la nota no mueve la
   promesa a otro sitio: la calla. Queda corregido en la hoja.
2. **La pregunta 5 de B.1 se queda sin sujeto en el teléfono** — **resuelto en
   §A3**. Pregunta si «el aviso "las IAS se completan" te dijo claro qué iba a
   pasar con sus pilas antes de pulsar», y en un teléfono ese aviso ya no existe.
   Victor no va a poder responderla; responderá «no lo vi», y eso significará una
   cosa distinta de la que la pregunta busca. El rector eligió la tercera salida
   de las tres que se le planteaban —que la promesa vuelva a decirse—, y §A3 la
   pone donde sí hay sitio: **dentro del subtítulo**.

Y una errata del guion, del mismo párrafo: **B.4 · pregunta 18** dice que la
recarga forzosa ofrece «Salir de la mesa». El botón dice **«Salir con mis
fichas»** (`ia.recarga.no.forzosa`). El comportamiento es el que la pregunta
describe; sólo el rótulo es otro.

## A2.4 · Que las apaisadas no se movieran

Era vara explícita. Los dos umbrales nuevos son `(max-width: 480px)` y el bloque
propio es `(max-width: 480px) and (orientation: portrait)`: **640×360 y 844×390
miden más de 480 de ancho, así que ninguna de las tres reglas los alcanza.** Lo
que ya les aplicaba —el traje corto por `max-height: 520px` y la retirada de la
nota por `max-height: 620px`— les sigue aplicando igual que antes. Comprobado en
la corrida, no deducido: las dos celdas apaisadas salen con los mismos siete
puntos verdes que en 1f-A.

El modal de bancarrota y la recarga **forzosa** tampoco se tocan: las tres reglas
nuevas cuelgan de `.bankrupt-overlay.apu-suave`, y la forzosa no lleva esa clase
— sigue bloqueando a pantalla completa, que es lo que §5.4 pide y lo que la ficha
confirma.

## A2.5 · Lo que daría de sí la holgura si la nota volviera

Medido, no estimado: se le devuelve el `display` a la nota sobre la tarjeta viva
y se le prueban cuatro tamaños. Las cartas del jugador acaban en 470,83.

| nota a | alto de la nota | alto de la tarjeta | arriba en | holgura sobre las cartas |
|---|---|---|---|---|
| 13 px | 15,59 px | 158,38 px | 469,63 | **−1,20 px** (tapa) |
| 12 px | 14,39 px | 157,17 px | 470,83 | **0,00 px** (justo en el borde) |
| 11 px | 13,19 px | 155,97 px | 472,03 | +1,20 px |
| 10 px | 12,00 px | 154,78 px | 473,22 | +2,39 px |

La nota **cabría a 11 px, con 1,20 px de holgura**. Un píxel y medio de margen en
una tarjeta cuyo contenido depende de cifras que cambian de mesa en mesa no es un
margen: es una avería esperando la mesa donde el subtítulo crezca un renglón.

**Por eso la decisión de la ficha era la correcta**, y por eso la retirada se
queda. Lo que hay que resolver no es de CSS: es que la promesa de §5.3 no está
dicha en ningún otro sitio (ver A2.3).

**Esta tabla es la que decidió A3.** Con ella delante, el rector descartó volver
a meter la nota y mandó mudar la promesa al subtítulo, que es sitio que ya
estaba pagado. Sigue siendo la referencia si alguna vez se plantea devolverla.

## A2.6 · Las varas de A2

- `diagDSK apu` **7/7 celdas en los siete viewports** — la de 360×640 entra en
  verde por primera vez, y las otras seis no se mueven.
- `vitest` **942/942 en 33 archivos**. No cambia, como la ficha preveía: el
  arreglo es CSS y las 942 miden lógica. Se corre igual porque `src/` se toca.
- `lint` **21 problemas (20 errores, 1 aviso)**, **Δ = 0**.
- `build` ✓, `dist/` sin un solo residuo de molde (cero `?apu`, cero `siembra*`).
- **Los seis protegidos, al mismo blob.** `apu.css` no es protegida y es el único
  archivo de `src/` que se abre.
- Sin commits: el árbol sigue sobre `f9ee503`.

Archivos tocados en A2: **`src/styles/apu.css`** y este informe. Nada más.

Quedan en `scripts/` dos sondas de un solo uso con el prefijo `_` de la casa —
`_1fA2probe.mjs`, que produjo la tabla de la banda de A2.1 y las medidas de la
nota de A2.5, y `_probeLinea.mjs`, de 1f-A—. Son re-corribles y por eso se dejan;
la ficha de commits decide si se borran o se quedan, como con `_probeA1.mjs` y
`_shotA1.mjs`, que llevan ahí desde DSK. La captura de la sonda está en
`capturas-apu/tel/apu_recarga_a2_sonda_360x640.png`; la oficial, la que el arnés
rehace en cada corrida, es `apu_recarga_360x640.png`.

## A2.7 · Lo que queda para el rector

Una sola cosa, y es del guion, no del producto: **§A.6 y A2.3.** Las dos
sustituciones de las partidas 3 y 4 —que la v1.1 de la ficha ya recoge—, la
pregunta 5 de B.1 que se queda sin sujeto en el teléfono, y el rótulo de la 18.

*(De estas tres, la del medio la resolvió el rector con la ficha de A3: ver
§A3 y, para lo que sigue abierto, §A3.7.)*

`vite preview` queda levantado en 4173 con la build nueva. El túnel lo levanta
Victor.

---

# §A3 · La promesa de §5.3 vuelve al teléfono

Ficha: `AJILEI_APU-1_Fase1f-A3_v1.0.md`. A2.3 dejó dicho que la nota de §5.3 ya
no se pinta en ningún teléfono y que **ningún subtítulo la sustituía**: la
promesa se callaba justo donde va a jugar casi todo el mundo. El rector no lo
acepta, y tiene razón: recargar sube también a las IAS vivas, y eso hay que
poder leerlo **antes de pulsar**.

El sitio del arreglo no es CSS —A2.5 midió que la nota sólo vuelve a caber a
11 px y con 1,20 px de holgura— sino el **texto**. Se abre **un solo archivo**,
`src/config/textos.es.js`, y se cambian **dos claves**.

## A3.1 · Las dos frases, y por qué son las que son

| clave | antes | ahora |
|---|---|---|
| `ia.recarga.sub.automatica` | «Te quedan {hc} HC. ¿Recargas antes de la próxima mano?» | **«Quedan {hc} HC. Si recargas, las IAS se nivelan.»** |
| `ia.recarga.sub.voluntaria` | «Puedes añadir hasta {hc} HC a tu pila.» | **«Puedes añadir hasta {hc} HC. Las IAS se nivelan.»** |
| `ia.recarga.sub.forzosa` | «Con estas fichas la mesa no puede continuar.» | **sin cambio** |

Lo que sale para hacer sitio es **la pregunta**, «¿Recargas antes de la próxima
mano?». No se pierde nada: la hacen los dos botones que están justo debajo
—«Recargar 150» y «No recargar»—, y un renglón que ya iba justo no puede
gastarse en repetir lo que el jugador está mirando. La forzosa no lleva la
promesa porque ahí no hay nivelación que prometer: o se recarga o se sale de la
mesa.

Ninguna de las dos empuja a gastar, que era la condición de voz de 1e-ii. «Si
recargas, las IAS se nivelan» es una consecuencia, no un reclamo; y la
voluntaria sigue empezando por «Puedes».

## A3.2 · Por qué la automática dice «Quedan» y no «Te quedan»

La ficha daba la forma larga como punto de partida y autorizaba acortar, en un
orden, si el peor caso partía el renglón. **El peor caso lo parte.** Medido con
la receta O2 sobre la tarjeta viva en 360×640, con el hueco útil del subtítulo
en **332 px** y el texto a 12 px:

| candidata | ancho suelto | margen sobre 332 | renglones | alto de la tarjeta | holgura sobre las cartas |
|---|---|---|---|---|---|
| «Te quedan 49500 HC. Si recargas, las IAS se nivelan contigo.» | **339,00** | **−7,00** | **2** | **158,97** | **−1,80** |
| «Quedan 49500 HC. Si recargas, las IAS se nivelan contigo.» | 325,11 | +6,89 | 1 | 142,78 | +14,39 |
| **«Quedan 49500 HC. Si recargas, las IAS se nivelan.»** | **281,64** | **+50,36** | **1** | **142,78** | **+14,39** |
| «Quedan 49500 HC. Las IAS se nivelan contigo.» | 259,42 | +72,58 | 1 | 142,78 | +14,39 |

La forma larga **se sale por siete píxeles**, cae a dos renglones, la tarjeta
crece de 142,78 a 158,97 px y vuelve a comerse las cartas del jugador: **holgura
−1,80 px**, que es E-29 otra vez y por una frase. Con tres cifras de pila cabría
—la fila de arriba mide 339,00 con cinco cifras y 325,11 sin «Te»—, y ése es
justo el modo de fallar que no se puede aceptar: una frase que cabe en las
partidas de prueba y revienta en la mesa del jugador que va sobrado.

Se baja por el orden que la ficha fijó y **se para en el primero que cumple**:
«Quedan {hc} HC. Si recargas, las IAS se nivelan.», con **50,36 px de margen** y
sin mover la tarjeta un píxel.

**Nota de voz para el rector.** El orden de la ficha prefiere conservar «Si
recargas,» antes que «contigo». La otra forma —«Quedan {hc} HC. Las IAS se
nivelan contigo.»— también cabe, y con más sitio todavía (**72,58 px**). Las dos
están medidas; elegir entre ellas es decisión de voz, y la voz la sella el
rector. Lo único que hay que saber para elegir es esto: sin «contigo», «las IAS
se nivelan» podría leerse como que se nivelan entre ellas; lo que lo desambigua
en la forma adoptada es la condición «Si recargas».

## A3.3 · La voluntaria: cabía, y aun así se acortó

La frase que la ficha proponía para la voluntaria —«Puedes añadir hasta {hc} HC.
Las IAS se nivelan contigo.»— **cabe en un renglón con cinco cifras**. Por
**2,86 px de 332**.

Eso no es una holgura, y la casa ya lo tiene dicho: A2.5 rechazó devolver la
nota de §5.3 porque el margen era de 1,20 px, y éste es de la misma familia. Hay
además un precedente con fecha: **E-30**, la actualización de Edge que movió el
rótulo ALL-IN de 69,56 a 73,17 px sin que nadie tocara una regla. Un 5 % sobre
329,14 px son dieciséis píxeles: se comería seis veces este margen.

Y el tope de la voluntaria **puede llegar a cinco cifras por construcción**:
`topeRecarga` está acotado por `techoDe(unit)`, que en Pro son 50 × 1.000 =
**50.000**. Hoy `SALDO_PROVISIONAL` lo recorta a 5.000, pero ECO-1 existe
precisamente para quitar ese tope, y una frase no puede depender de que el saldo
siga siendo provisional.

Con la misma segunda mitad que la automática —«Las IAS se nivelan.»— el margen
pasa de **2,86 a 46,33 px**. Las dos frases dicen ahora exactamente lo mismo, y
eso no es sólo economía: es lo que hace que el jugador reconozca las dos formas
de la recarga como **la misma promesa** y no como dos avisos distintos.

| candidata de la voluntaria | ancho suelto | margen sobre 332 |
|---|---|---|
| «Puedes añadir hasta 50000 HC. Las IAS se nivelan contigo.» | 329,14 | **+2,86** |
| **«Puedes añadir hasta 50000 HC. Las IAS se nivelan.»** | **285,67** | **+46,33** |
| «Tu tope son 50000 HC. Las IAS se nivelan contigo.» | 280,55 | +51,45 |

## A3.4 · E-31 · En escritorio la promesa se dice dos veces — **resuelto en §A4**

**Consecuencia directa de A3, y no se arregla aquí porque la ficha no lo
autoriza.** La nota de §5.3 se retira por `(max-height: 620px), (max-width:
480px)`; los cuatro viewports de escritorio de la casa —1024×768, 1280×720,
1366×768 y 1920×937— están por encima de los dos umbrales, así que **la nota se
sigue pintando**. Y ahora el subtítulo, dos renglones más arriba, dice lo mismo:

> Quedan 950 HC. Si recargas, las IAS se nivelan.
> …
> Las IAS vivas se nivelan contigo.

La regla 3 de la ficha dice que la nota en escritorio «se queda como está: ahí
cabe y no molesta». Cabía y no molestaba **cuando era el único sitio donde se
decía**. Desde A3 no lo es, y repetirla tiene la misma forma que E-23: la
información es correcta y se lee como un tartamudeo.

El arreglo es barato y tiene tres versiones, y elegir entre ellas es de voz:
retirar el `<p className="apu-nota">` y la clave `ia.recarga.nivelado` enteros
(la promesa ya vive en el subtítulo, y las reglas de `.apu-nota` en `apu.css` se
irían con él); dejar la nota sólo para la forzosa, que es la única cuyo subtítulo
no la lleva —aunque ahí no hay nada que nivelar—; o dejarlo como está y aceptar
la repetición en escritorio. **Se consigna sin tocar nada.**

*(El rector eligió la primera al cerrar la Parte B: la clave y el `<p>` se
retiran en §A4.3. La promesa se dice una vez, en el subtítulo, en todas las
pantallas.)*

## A3.5 · E-28, comprobado

La regla 4 de la ficha pedía verificar que el comentario de cabecera de
`apu.css` ya dice la **relación** y no la cifra vieja. **Lo dice**, desde A2:

> «…lo que se garantiza, y lo que `diagDSK apu` mide en cada corrida, es que el
> rótulo CABE EN UNA LÍNEA en todas las mesas y viewports de la casa: portrait
> 43,69 en huecos de ≥99; apaisado 50,23 en ≥97; escritorio 73,17 en ≥151
> (Edge 153).»

El informe de A2 no lo mencionaba —de ahí la duda de la ficha—, pero la edición
estaba hecha. **No hay nada que corregir**, y queda consignado aquí para que no
se vuelva a preguntar.

## A3.6 · Las varas de A3

La corrida oficial, con las frases nuevas puestas:

| vara | pedido | medido |
|---|---|---|
| el subtítulo, en un renglón con cuatro cifras | 1 renglón | **1** (y con cinco también) |
| la tarjeta no crece | ≤ 142,78 px | **142,78 px**, arriba en 485,22 |
| solape con las cinco cartas | 0 px² | **0** de 24.591,88 |
| solape con el óvalo | 0 px² | **0** |
| holgura sobre las cartas | ≥ 10 px | **14,39 px** |
| contador de 10 s visible | sí | **sí** — «Se cierra en 10 s» |
| ranura de «Siguiente mano» reservada | sí | **sí**, 68,16 px |
| Δ de la zona del jugador al abrir y cerrar | 0 · 0 | **0 · 0** |
| `diagDSK apu` | 7/7 | **7/7** — `360x640:OK 640x360:OK 844x390:OK 1024x768:OK 1280x720:OK 1366x768:OK 1920x937:OK`, `ok global: true` |

Y el resto:

- `vitest` **942/942 en 33 archivos**, `textos.test.js` incluido. Sus reglas miran
  las claves que comparten texto con `ia.retar.*` (las tres opciones de monto),
  y los subtítulos no están entre ellas.
- `lint` **21 problemas (20 errores, 1 aviso)**, **Δ = 0**.
- `build` ✓ en **233 ms**. `dist/` limpio: **cero `?apu`, cero `siembra*`, cero
  bypass**, y las frases nuevas dentro —la vieja pregunta «¿Recargas antes de la
  próxima mano?» sale **cero veces** del bundle—.
- **Los seis protegidos, al mismo blob** de 1e-iv: `21c4d3f56318`
  `8cfc3736cba2` `eb61426083ca` `0d1bb8ea66a8` `3ce6383eec0d` `1e21371c8543`.
- **Sin commits**: el árbol sigue sobre `f9ee503`.

Archivos tocados en A3: **`src/config/textos.es.js`** y este informe —
comprobado por fecha de modificación, no de memoria—. `apu.css` no se abre: la
regla 4 de la ficha era una verificación, y salió conforme (A3.5). Queda una
sonda más en `scripts/`, `_1fA3probe.mjs`, que es la que produjo las dos tablas
de arriba; se suma a `_1fA2probe.mjs` y `_probeLinea.mjs` para la ficha de
commits.

La captura oficial `capturas-apu/tel/apu_recarga_360x640.png` está rehecha por
la corrida, con la frase nueva dentro.

## A3.7 · Lo que queda para el rector

*(Las dos decisiones de abajo las tomó el rector con la Parte B jugada, y §A4
las aplica: la automática dice «contigo» y la nota se retira. Se dejan escritas
tal como se plantearon, porque las medidas que las sostienen son las que
decidieron.)*

De A3 salen **dos decisiones de voz**, ninguna de sitio —el sitio ya está
medido y sobra en las dos—:

1. **«contigo», en la automática.** Se adoptó «Quedan {hc} HC. Si recargas, las
   IAS se nivelan.» porque es la primera de tu orden que cumple. La otra,
   «Quedan {hc} HC. Las IAS se nivelan contigo.», también cabe y con **72,58 px**
   en vez de 50,36. La diferencia es qué mitad de la promesa se conserva: la
   condición o el destinatario.
2. **E-31 · la repetición en escritorio.** El subtítulo y la nota dicen ahora lo
   mismo, dos renglones seguidos, en los cuatro viewports de escritorio. La
   regla 3 de la ficha mandaba dejar la nota «como está», y así se ha dejado;
   pero la razón que la sostenía —«ahí cabe y no molesta»— dejó de ser cierta en
   el momento en que el subtítulo empezó a decirlo. Tres salidas en A3.4.

Y una tercera que no es de A3 pero que A3 cambia: **la pregunta 5 de B.1 vuelve
a tener sujeto.** La v1.0 de la ficha A3 ya la reescribe («Antes de pulsar
Recargar, ¿leíste que las IAS se nivelan contigo?…»), y conviene ajustarle una
palabra al copy vivo: en el teléfono lo que Victor va a leer es «**las IAS se
nivelan**», sin «contigo». Si se adopta la forma de la decisión 1, la pregunta
queda literal — y se adoptó, así que lo está.

Lo demás de A2.7 sigue igual: las dos sustituciones de partida de §A.6, y el
rótulo de la 18 (**«Salir con mis fichas»**).

`vite preview` queda levantado en **4173** con la build nueva —`saldo.js` en
`SALDO_PROVISIONAL = 5000`, que es el saldo con el que arranca la sesión y del
que depende la aritmética del guion—. El túnel lo levanta Victor.

---

# §A4 · Lo que las partidas sellaron

Ficha: `AJILEI_APU-1_Fase1f-A4_v1.0.md`. Es la primera tanda de APU-1 cuyas
cifras no salen de una simulación ni de una medida de pantalla, sino de **Victor
jugando cuatro partidas en el S25 el 19 de septiembre**. Seis cifras estaban
sobre la mesa; se movieron dos, y las cuatro que se quedaron se quedan porque
alguien las jugó y no le chirriaron.

## A4.1 · El piso de entrada: de 5× a 10×

La queja de Victor fue «fue una carrera», y tiene una causa aritmética exacta:
**el piso de entrada y el listón de la recarga automática eran el mismo
número**. `betting.entrada.piso` valía 5 y `betting.recarga.umbral` vale 5, así
que quien elegía «Mínimo» se sentaba **exactamente en el listón**: la primera
mano perdida lo metía debajo y la pregunta de recarga salía antes de que la mesa
hubiera empezado a ser una mesa. Eso no es una entrada barata, es una recarga
anticipada.

Con el piso en 10× hay una mesa entre la entrada y la pregunta. El listón **no
se toca** —lo que sobraba era el piso, no él— y el techo tampoco. El medio sube
a 20× para que las tres opciones sigan repartidas (10 · 20 · 50) en vez de
amontonarse las dos de abajo.

| mesa | Mínimo 10× | Medio 20× | Techo 50× |
|---|---|---|---|
| 50 | 500 | 1.000 | 2.500 |
| 100 | 1.000 | 2.000 | 5.000 |
| 200 | 2.000 | 4.000 | 10.000 |
| 500 | 5.000 | 10.000 | 25.000 |
| 1.000 | 10.000 | 20.000 | 50.000 |

Las dos cifras viven en **un solo sitio**, `betting.entrada` de
`ajileiConfig.js`, y de ahí sale todo lo demás sin una línea más: los chips de
«Retar a las IAS», el contador de «Otra…», `entradaValida`, el gris por saldo,
los montos de la recarga —que son las mismas cifras por §5.2— y el aviso de con
cuánto se sienta cada IA. El único otro literal era el respaldo de `cfgEntrada`
en `entrada.js`, que existe para que el módulo no dependa de que la config
llegue: se mueve con él.

## A4.2 · El plazo de la recarga: de 10 a 15 segundos

`betting.recarga.plazoMs` 10.000 → 15.000. Una sola cifra, y el contador dice
«Se cierra en 15 s» solo. El arnés lo exige ahora **a la automática** y no a las
otras dos: la voluntaria reserva el renglón pero esconde el contador con
`visibility` —no hay plazo que contar cuando la pregunta la hizo el jugador—, y
su texto se lee «Se cierra en 0 s». Pedírselo habría sido fabricar un rojo.

## A4.3 · La voz de la recarga, cerrada

| clave | ahora |
|---|---|
| `ia.recarga.sub.automatica` | **«Quedan {hc} HC. Las IAS se nivelan contigo.»** |
| `ia.recarga.sub.voluntaria` | **«Hasta {hc} HC más. Las IAS se nivelan contigo.»** |
| `ia.recarga.sub.forzosa` | sin cambio |
| `ia.recarga.nivelado` | **retirada** |

Vuelve «contigo», que es la decisión del rector y la correcta: sin él, «las IAS
se nivelan» puede leerse como que se nivelan **entre ellas**, que es justo lo
contrario de lo que §5.3 promete. El sitio da para las dos mitades; lo que se
acorta es la primera —«Quedan», «Hasta … más»—, que es la que no lleva promesa.

Y con la clave `ia.recarga.nivelado` se va **E-31**: el `<p className="apu-nota">`
de `GameTable.jsx` y las reglas `.apu-nota` de `apu.css`, incluidas las dos
`@media` que la escondían en las ventanas cortas. La promesa se dice **una vez,
en el subtítulo, en todas las pantallas**.

Eso deja una pieza sellada con una prueba, y no por ceremonia: la decisión tiene
dos mitades —la clave se va, el subtítulo la recoge— y si alguien devuelve una
sin la otra la promesa se duplica o se calla, que son los dos fallos que 1f ya
ha tenido. `textos.test.js` comprueba ahora que la clave no existe, que las dos
blandas dicen la frase entera, que la forzosa **no** la dice (ahí no hay
nivelación que prometer) y que **no la dice nadie más**.

## A4.4 · Los botones del apaisado: la queja tenía un número, y era cero

Observación 2 de Victor: en teléfono apaisado los botones de la tarjeta se le
hacían pequeños. Medido en **640×360** antes de tocar nada:

| | antes | después | pedido |
|---|---|---|---|
| alto de los cinco botones | 36,00 px | **36,00 px** | 36–40 |
| separación dentro de la fila de montos | 6,00 px | **8,00 px** | ≥ 8 |
| separación entre la fila de montos y la de acciones | **0,00 px** | **10,00 px** | ≥ 8 |
| separación dentro de la fila de acciones | 10,00 px | 10,00 px | ≥ 8 |
| solape entre pares de botones | 0 px² | **0 px²** | 0 |
| alto de la tarjeta | 172,98 px | **168,38 px** | no crecer |
| arriba en | 175,02 | **179,63** | más abajo, mejor |

*(Diez y no ocho entre filas: la primera versión pedía los 8 px justos de la
vara y se midieron 7,95 y 7,88. Es E-32, aquí abajo.)*

**El número que explica la queja es el cero.** Los botones no se solapaban —ni
antes ni ahora—, pero la fila de montos y la de acciones estaban **pegadas, sin
un píxel entre ellas**: dos filas así se leen como un bloque y el dedo no
distingue dónde acaba una. No era un problema de tamaño, y por eso bajarles el
tamaño no lo habría arreglado; de hecho no se les bajó, porque ya estaban en los
36 px que son el piso táctil de la casa.

**Y hay una regla que no hacía nada, que conviene dejar escrita.** `apu.css`
llevaba desde 1e-ii un `gap: 6px` sobre `.bankrupt-modal.apu-recarga` pensado
para separar las filas. No separaba nada: **esa caja no es flex** —
`gameTable.css:737` no le da `display`— y un `gap` sin contexto flex o grid no
tiene sobre qué actuar. La separación entre bloques hay que pedirla con un
margen, y eso es lo que hace la regla nueva. Es la misma familia de error que
E-29: una propiedad escrita con la intención correcta sobre una caja que no la
escucha.

El alto que cuesta el respiro **se paga arriba**, en el título (18 → 16 px, con
su `line-height` dicho explícitamente, que es la lección de A2.2) y en el
subtítulo (13 → 12 px, margen inferior 12 → 6). Resultado: la tarjeta no sólo no
crece, **encoge 4,60 px y baja otros 4,61**.

Lo que **no** mejora, y hay que decirlo: en 640×360 la tarjeta sigue tapando
**el 100 % de las cinco cartas** (26.370,64 px² de 26.370,64), igual que antes.
En 360 px de alto la mano del jugador cae entera dentro de la banda que la
tarjeta ocupa, y los 4,6 px que se han ganado no alcanzan a destapar una sola
carta. Victor aceptó que ahí tape; queda consignado que **menos no se ha
conseguido, sólo un poco menos de tarjeta**. En **844×390** hay más sitio y el
solape es del 91,2 % (48.936,94 de 53.669,59).

El bloque nuevo es §6 de `apu.css` y es **sólo apaisado**
—`@media (orientation: landscape) and (max-height: 520px)`—, deliberadamente
separado del §4: aquél lleva una coma y su segunda mitad `(max-width: 480px)`
alcanza también al teléfono vertical, que tiene su propia vara en §5. Y cuelga
de `.apu-suave`, así que la **forzosa** no se entera: bloquea a propósito, va
centrada y tiene sitio de sobra.

### E-32 · Un margen de 8 px se lee 7,88

**Salió en la primera corrida oficial y merece quedar escrito, porque es una
trampa que se repite.** La vara de A4.4 pide «separación ≥ 8 px», así que la
regla se escribió con `margin-top: 8px` — y las dos celdas apaisadas dieron
**rojo**: 7,95 px en 640×360 y 7,88 px en 844×390. La regla estaba bien; lo que
falla es pedir en CSS exactamente el mínimo de la vara.

Los bloques de la tarjeta caen en posiciones fraccionarias —los renglones de
arriba miden 16,19, 15,6, alturas que no son enteras— y `getBoundingClientRect`
devuelve el borde ya cuantizado. Restar dos bordes cuantizados de un margen de
8 px da 7,88 o 8,00 según lo que midan los renglones de encima, es decir **según
el texto**: la misma regla pasa con una cifra de tres dígitos y falla con una de
cuatro. Un rojo intermitente, que es la peor clase.

Con `margin-top: 10px` se mide entre 9,88 y 10,00 y el mínimo se cumple siempre.
**Cuesta 2 px de tarjeta** —168,38 en vez de 166,38, todavía 4,60 px por debajo
de los 172,98 de antes de A4— y compra un veredicto que no depende del texto que
haya en pantalla. La lección, en una línea: **cuando la vara dice «≥ N», la regla
se escribe con N + holgura, no con N.** Es la misma familia que la cuantización
de 1/64 px que la campaña DSK ya tenía anotada.

## A4.5 · Las pruebas que cambiaron de veredicto

Doce fallaron al cambiar las cifras. Once son aritmética; **una no lo es** y es
la que merece leerse.

| archivo | prueba | qué cambió |
|---|---|---|
| `testEntrada` | la tabla sellada de las cuatro mesas | pisos 250/500/1.000/5.000 → **500/1.000/2.000/10.000**; medio de la mesa 100, 1.500 → **2.000** |
| `testEntrada` | `entradaValida` acepta entre piso y techo | el caso del piso, 500 → **1.000** |
| `testEntrada` | la ventaja de la IA a toda profundidad | `pilaIA(piso)` 750 → **1.500**; `pilaIA(medio)` 2.250 → **3.000** (el ×1,5 no se mueve) |
| `testRetarIAS` | el gris mira el PISO, no la apuesta | el saldo de la foto, 700 → **1.200** |
| `testRetarIAS` | el alcance es el piso | 250 · 1.250 → **250 · 2.500** |
| `testRetarIAS` | con el bolsillo justo para el piso | 500 → **1.000** |
| `testRetarIAS` | «Otra…» se apaga sin múltiplo libre | 500/600 → **1.000/1.100** |
| `testRetarIAS` | el chip lo decide el MONTO | piso 500 → **1.000**, medio 1.500 → **2.000** |
| `testRetarIAS` | el contador nunca sale del rango | arranca en 600 → **1.100**; suelo 500 → **1.000** |
| `testMesaAPU1` | «Mínimo» y «Medio» son las de la entrada | medio `15 × UNIT` → **`20 × UNIT`** |
| `testMesaAPU1` | propiedad, mesas 4 y 5 | **ver abajo** |

**La que no es aritmética.** El bloque de propiedad juega 2.000 manos por tamaño
de mesa con la entrada **al piso** —la más corta que §2.2 permite— y, al final,
exige que los all-ins hayan salido en más del 5 % de las manos. No es un
adorno: es lo que impide que la propiedad pase por no visitar nunca el caso que
vigila. Con el piso al doble de profundo, esa densidad cae:

| mesa | all-ins en 2.000 manos, piso 10× | veredicto con el listón viejo (>100) |
|---|---|---|
| 2 | 617 | pasa |
| 3 | 107 | pasa |
| 4 | **98** | **falla** |
| 5 | **77** | **falla** |

**El motor no ha cambiado.** Lo que ha cambiado es que una pila del doble de
profunda tarda el doble en agotarse. El listón baja a 1/40 de las manos, y se
deja escrito por qué y con qué cifras medidas: setenta y siete all-ins siguen
siendo muestra de sobra para lo que ese bloque vigila, y si alguna vez vuelve a
bajar lo primero que hay que mirar es si la profundidad se movió otra vez, no si
el motor dejó de pagar all-ins.

Y una prueba **nueva**, la de A4.3, que sella la retirada de la clave y la
promesa dentro de los subtítulos. Total: **943**, una más que las 942 de A3.

## A4.6 · Lo que el arnés tuvo que aprender

Tres cambios en `diagDSK.mjs`, y dos de ellos son varas nuevas, no cifras.

1. **`apu.3` deja de mirar la nota.** Su veredicto exigía `panel.nota.length >
   0`: la promesa de §5.3, en su renglón. Retirado el renglón, esa condición
   habría dado rojo para siempre. La vara se muda a donde se mudó la promesa:
   el **subtítulo** tiene que decir «se nivelan contigo» **y caber en una
   línea** —el segundo renglón es lo que hacía crecer la tarjeta hasta comerse
   las cartas (E-29)—, y no se le pide a la forzosa, que no la lleva.
2. **El plazo entra en el veredicto**, con la distinción que ya tenía el
   contador de portrait: sólo a la automática.
3. **Cinco medidas nuevas para el apaisado de teléfono** (A4.4), y entran en el
   `ok` de la celda por E-26 — una cuenta que no entra en el veredicto no sirve
   de nada. Se imprimen además en el resumen de consola, junto a la tabla de la
   marca ALL-IN, porque una medida que sale de una queja de Victor tiene que
   verse sin abrir el JSON.

Y las cifras de `retar`: la entrada del CTA (3.000 → **4.000**), la pila que
anuncia por IA (4.500 → **6.000**), y el contador de «Otra…» (abre en 1.000 →
**2.000**, sube de 200 en 200).

**Una consecuencia del piso nuevo que el arnés destapó y conviene saber.** La
celda del gris, `retar.4`, siembra `?apu=saldo:2400` y estaba elegida para que
Pro quedara con **dos mesas encendidas y dos apagadas** — la foto que enseña la
regla y su frontera a la vez. Con el piso al doble, los pisos de Pro pasan de
1.000 · 2.000 · 3.000 · 5.000 a **2.000 · 4.000 · 6.000 · 10.000**, y con los
mismos 2.400 la foto es de **una encendida y tres apagadas**. Se mantiene el
sembrado —la ficha lo fija y sigue cayendo justo por encima del piso de la mesa
más barata, que es la frontera que la celda existe para enseñar; y 2.400 es casi
el bono de bienvenida, o sea el bolsillo con el que de verdad llega alguien
nuevo—, pero la ficha decía «las dos de arriba en gris» y son **tres**: Pro
tiene cuatro mesas. Es una errata de conteo, no de criterio.

## A4.7 · Las varas de A4

La corrida oficial, con todo puesto:

| vara | pedido | medido |
|---|---|---|
| `vitest` | 0 fallos | **943/943 en 33 archivos** (942 + la de A4.3) |
| `lint` | 21, los mismos | **21 (20 errores, 1 aviso), Δ = 0** |
| `build` | ✓ y limpio | **✓ en 250 ms** |
| `dist/` · moldes | 0 | `?apu` **0** · `siembra*` **0** · bypass **0** |
| `dist/` · la pregunta retirada | 0 | «¿Recargas antes de la próxima mano?» **0** |
| `dist/` · «se nivelan.» sin «contigo» | 0 | **0** |
| `dist/` · la promesa entera | las dos blandas | «se nivelan contigo.» **2** |
| `dist/` · la nota retirada | 0 | «IAS vivas se nivelan» **0** |
| `diagDSK apu` | 7/7 con las cinco medidas nuevas | **7/7**, `ok global: true` |
| `diagDSK retar` | 6/6 con las cifras nuevas | **6/6** |
| `diagDSK msg` | VERDE | **VERDE** — compositor 92 casos · jugado 7/7 · anchuras 7/7 · cazas 2/2 · `passed: true` |
| `diagSAL` | 102/102 | **102/102 celdas**, cero fallas |
| seis protegidos | al mismo blob | `21c4d3f56318` `8cfc3736cba2` `eb61426083ca` `0d1bb8ea66a8` `3ce6383eec0d` `1e21371c8543` |
| `apu1_bandas.json` | sin tocar | **sin tocar** |
| commits | ninguno | **ninguno** — el árbol sigue sobre `f9ee503` |

En portrait, la tarjeta de recarga **no se movió**: 360×142,78 px arriba en
485,22, **0 px² sobre las cartas y 0 sobre el óvalo**, contador visible, ranura
de 68,16 reservada, Δ de la zona del jugador 0 · 0 y el subtítulo en **un
renglón**. Era vara explícita de la ficha y se cumple: A4 no ha tocado nada de
lo que A2 dejó medido.

**El subtítulo, con el peor texto que el producto puede emitir** (cinco cifras,
que es hasta donde llega `topeRecarga` por `techoDe(1.000)` = 50.000), sobre un
hueco útil de 332 px:

| | ancho suelto | margen | renglones |
|---|---|---|---|
| automática · «Quedan 49500 HC. Las IAS se nivelan contigo.» | 259,42 | **+72,58** | 1 |
| voluntaria · «Hasta 50000 HC más. Las IAS se nivelan contigo.» | 274,61 | **+57,39** | 1 |

La ficha pedía ≥ 40 px para la voluntaria y ofrecía acortarla si no llegaba.
**Llega con diecisiete de sobra**, así que se queda la frase entera.

Archivos tocados en A4 — comprobado por fecha de modificación, no de memoria:

| archivo | qué |
|---|---|
| `src/config/ajileiConfig.js` | piso 10, medio 20, plazo 15.000 |
| `src/engine/entrada.js` | el respaldo de `cfgEntrada` y su comentario |
| `src/config/textos.es.js` | los dos subtítulos; retirada `ia.recarga.nivelado` |
| `src/config/textos.test.js` | la prueba que sella la retirada y la promesa |
| `src/components/GameTable.jsx` | retirado el `<p className="apu-nota">` |
| `src/styles/apu.css` | retiradas las reglas de `.apu-nota`; §6 nuevo, sólo apaisado |
| `src/screens/retarCore.js` | un comentario que citaba el 5× viejo |
| `scripts/testEntrada.test.js` · `testRetarIAS` · `testMesaAPU1` | las cifras y el listón de all-ins |
| `scripts/diagDSK.mjs` | la vara de `apu.3`, las cinco medidas del apaisado, las cifras de `retar` |

Ni el motor, ni la IA, ni el banco, ni PvP, ni SQL, ni el saldo. Y la sonda
`_1fA3probe.mjs` sigue en `scripts/` con las otras dos, para la ficha de commits.

## A4.8 · Lo que queda

Nada de A4 para el rector: las seis cifras de la Parte B están puestas, la voz
de la recarga está cerrada y E-31 resuelto. Lo que sigue abierto es lo de antes
—**E-10**, **E-22**, **E-4**, el rojo de 133 ms de CEL-2c, **E-30** (correr
`o1`, `o2`, `a1`, `a2`, `u1` una vez con Edge 153) y las bandas del banco de
§D.6 de 1e-iv— más lo que A4 añade a la ficha de commits: **re-evaluar V2 a 20×**
(§11 del normativo lo deja apuntado) y decidir sobre las tres sondas `_*probe`.

Y el **vistazo de cinco minutos** que la ficha pide: una partida en el S25
apaisado, Básico · 5 jugadores · apuesta 50 · **Mínimo (500)**, mirando tres
cosas — que los chips digan Mínimo 500 · Medio 1.000 · Techo 2.500, que los
botones de la recarga ya no se peguen y el contador diga **15 s**, y que el
subtítulo diga «Las IAS se nivelan contigo».

---

# §A5 · Aire en la tarjeta de recarga

Ficha: `AJILEI_APU-1_Fase1f-A5_v1.0.md`. Sale del vistazo de Victor en el S25
vertical (21-sep): los botones ya no se pisan, pero se ven amontonados. Sólo
`src/styles/apu.css` (§7 y §8 nuevos) y el arnés. Protegidos intactos.

## A5.1 · Lo que se midió antes de tocar nada

Medido en **360×640** retirando §7 y §8 de la hoja, con el mismo arnés:

- **Blanda (automática):** las tres cajas —fila de montos, fila de acciones,
  cronómetro— **seguidas, sin un píxel entre ellas**: 0,00 entre filas y 0,00
  hasta el cronómetro. Montos a 5 px uno de otro. Cronómetro centrado.
- **Forzosa:** hereda el relleno del modal de bancarrota (`38px 42px 34px`), lo
  que deja una caja de contenido de 272 px: **«Al techo» cae solo a una segunda
  fila**, las dos acciones van pegadas a los montos y al cronómetro (0,00 y
  0,00), y hay un defecto que la ficha no nombraba: **«Salir con mis fichas»
  mide 28 px de alto**, por debajo del piso táctil de 36. Es el botón con el que
  el jugador se levanta de la mesa.
- **Y un rojo latente en `apu.3`:** en esa misma caja de 272 px el subtítulo de
  la forzosa («Con estas fichas la mesa no puede continuar.») se parte en **dos
  renglones**, y `apu.3` exige uno. Sólo salta cuando la primera mano del punto
  se pierde entera y la recarga sale forzosa, que es cuestión de suerte. La
  corrida de «antes» cayó ahí. Con A5 cabe en uno (332 px de caja), y la corrida
  oficial lo confirma: 1280×720 y 1920×937 cayeron en la forzosa y pasaron.

## A5.2 · Antes y después (360×640, la vara)

| | blanda antes | blanda después | vara | forzosa antes | forzosa después | vara |
|---|---|---|---|---|---|---|
| fuente de los montos | 13 px | **13 px** | igual | 14 px | **14 px** | igual |
| fuente de «Recargar N» | 12 px | **12 px** | igual | 12 px | **12 px** | igual |
| fuente de «No recargar» / «Salir con mis fichas» | 12 px | **12 px** | igual | 12 px | **12 px** | igual |
| alto de los botones | 36–36 | **36–36** | 36–40 | 28–36 | **42–42** | 40–44 |
| separación entre botones de una fila | 5 (montos) · 10 (acciones) | **12** · **12** | ≥ 10 | 6 (montos, y 6 hasta el segundo renglón) · 10 (entre acciones) | **14** · **14** | ≥ 12 |
| montos → acciones | **0,00** | **14** | ≥ 12 | **0,00** | **18** | ≥ 16 |
| acciones → cronómetro | **0,00** | **10** | ≥ 8 | **0,00** | **16** | ≥ 14 |
| cronómetro | centrado | **a la izquierda**, borde en 14 = el del subtítulo | izquierda | centrado | **centrado** | centrado |
| montos en una fila | sí | **sí** | sí | **no (2)** | **sí** | si caben |
| tarjeta | 360×142,78 en 485,22 | **360×156,89 en 477,11** | — | 360×341,98 en 149 | **360×314,39 en 162,8** | — |
| solape con las cinco cartas | 0 px² | **0 px²** | 0 | 100 % | 100 % | n/a |

En CSS los mínimos van con 2 px de holgura (E-32): 12 dentro de la fila, 14
entre filas y 10 hasta el cronómetro en la blanda; 14, 18 y 16 en la forzosa.
Las medidas salen exactamente en los valores escritos.

**La blanda superó los 142,78 px**, como la ficha preveía, y se midió que sigue
sin tocar las cartas: acaban en 470,83 y la tarjeta empieza en 477,11, **6,28 px
de aire**. El alto que cuestan los 24 px nuevos entre filas se paga con el
relleno vertical de la tarjeta (6 → 4), el apoyo inferior (12 → 6), los
márgenes de la cabecera y el interlineado del título y el subtítulo, y con el
relleno lateral de los montos (8 → 6 por lado). Los botones no bajan de 36, que
es el piso táctil.

**El título conserva sus 14 px.** La primera versión de §7 lo bajaba a 13 para
ganar alto. La ficha sólo protege la letra de los botones, pero la regla es
«se achica el área, no la letra», y devolverle el píxel cuesta 1,15 px de alto,
que caben en el aire que queda sobre las cartas. Así, en la blanda **ninguna
letra ha bajado**.

La forzosa va al revés: aquí se sube, no se achica. No hay problema de sitio
(bloquea a propósito y va centrada), así que los cinco botones pasan a 42 px, el
centro del 40–44, y el relleno lateral de la tarjeta baja de 42 a 14 para que
los tres montos quepan en una fila. Las reglas cuelgan de
`.bankrupt-overlay:not(.apu-suave)`, que es la frontera que §3b ya traza entre
las dos láminas: sin tocar `gameTable.css` ni añadir una clase al JSX.

## A5.3 · S25 vertical, 412×915 (sólo foto)

Tomada redimensionando la misma página con la tarjeta abierta. Las cifras salen
iguales que en 360×640, porque ninguna regla depende del ancho dentro del
bloque `max-width: 480px`:

| | blanda | forzosa |
|---|---|---|
| alto de los botones | 36 | 42 |
| entre botones / entre filas / hasta el cronómetro | 12 / 14 / 10 | 14 / 18 / 16 |
| montos en una fila | sí | sí |
| solape con las cartas | 0 px² | n/a |

## A5.4 · Apaisado y escritorio

A5 no alcanza al apaisado: §7 es `max-width: 480px and portrait`, y §8 sólo mira
la forzosa. Las cifras de A4 se repiten al píxel, y ninguna mejora:

| | 640×360 | 844×390 |
|---|---|---|
| alto de los botones | 36–36 | 36–36 |
| montos / entre filas / acciones | 8·8 / 10 / 10 | 8·8 / 10 / 10 |
| solape entre botones | 0 px² | 0 px² |
| tarjeta | 416×168,38 en 179,63 | 416×168,38 en 209,63 |
| solape con la mano | 100 % (aceptado) | 91,2 % (aceptado) |

Escritorio: las cuatro celdas en verde, no se ha movido nada.

## A5.5 · Lo que el arnés tuvo que aprender

**Medir la tarjeta quieta.** `.bankrupt-modal` entra con `bankruptRise` (0,32 s,
de `scale(0.96)` a 1) y `getBoundingClientRect` devuelve la caja transformada.
`recargaForzosa` sale en cuanto la lámina aparece, así que la primera medida de
la forzosa cayó en el fotograma cero: **todo ×0,96**, con «Recargar» a 34,56 en
vez de 36 y la tarjeta a 345,6 de ancho en una ventana de 360. Eran rojos del
reloj, no de la lámina. `esperarTarjetaQuieta` espera a que no quede ninguna
animación viva en la tarjeta antes de medir la blanda y la forzosa. La blanda
no estaba afectada, porque `recargaSuave` ya esperaba 400 ms.

**Fotos dedicadas.** `apu_blanda_360x640.png`, `apu_blanda_412x915.png`,
`apu_forzosa_360x640.png` y `apu_forzosa_412x915.png` en `capturas-apu/tel/`.
La de 412×915 sale de `fotoS25`: redimensiona, fotografía, mide (se imprime, no
entra en el veredicto) y devuelve la ventana a 360×640 antes de seguir. El punto
`tel.recarga` que viene detrás mide Δ 0 · 0 en la zona del jugador, así que la
vuelta no deja rastro.

## A5.6 · Las varas de A5

| vara | pedido | medido |
|---|---|---|
| `diagDSK apu` | 7/7, con las varas de A5 en el veredicto | **7/7**, `ok global: true` · `tel.blanda` y `tel.forzosa` verdes |
| fuentes de los botones | igual antes y después | **iguales** en las cinco (13·13·13·12·12 y 14·14·14·12·12) |
| `vitest` | 943 | **943/943 en 33 archivos** |
| `lint` | 21 | **21 (20 errores, 1 aviso), Δ = 0** |
| `build` | ✓ limpio | **✓**, sin moldes: `?apu` 0 · `siembra` 0 (el aviso de chunk > 500 kB es del JS y ya estaba; A5 sólo toca CSS) |
| seis protegidos | al mismo blob | `21c4d3f56318` `8cfc3736cba2` `eb61426083ca` `0d1bb8ea66a8` `3ce6383eec0d` `1e21371c8543` |
| commits | ninguno | **ninguno**, el árbol sigue sobre `f9ee503` |

Tocado en A5: `src/styles/apu.css` (§7 blanda en vertical, §8 forzosa en
teléfono) y `scripts/diagDSK.mjs` (vara por lámina, agrupado por renglón,
`esperarTarjetaQuieta`, `fotoS25`, las líneas de consola).

## A5.7 · Lo que queda

El **vistazo de Victor**, en el S25 vertical: Básico · 2 · 250 · Otra 1.500
para forzar pronto la forzosa, y una automática. La pregunta es una sola: ¿se
ven con aire? Si la respuesta es sí, la ficha de commits sale sin cambios.
`vite preview` queda levantado en **4173**.
