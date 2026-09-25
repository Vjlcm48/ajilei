# AJILEI · RET-A · El aviso de saldo de «Retar a las IAS»

**Tanda corta post-APU-1 · base `8408d3f` · 24-sep-2026**
Rector: tanda corta sobre «Retar a las IAS», decisiones de Victor.
Estado: **hecho y medido. Sin `git add`.** El mapa archivo → commit está en la §7.

> **El nombre «RET-A» es mío.** La ficha no bautizó la tanda y el código necesitaba
> una etiqueta para los comentarios y el nombre de este archivo. Si el rector
> prefiere otra, se cambia en siete comentarios y un nombre de fichero.

---

## 1 · Qué se pidió y qué hay

Se retiró el aviso rojo «Te faltan fichas: sentarte a esa mesa pide N HC» y en su
lugar hay una regla nueva, que depende **sólo del saldo y del reto elegido**, con
tres casos y una única salida: el botón «Conseguir más monedas».

| | pedido | estado |
|---|---|---|
| Retirar el aviso viejo | la clave y su caja | **hecho** · `ia.retar.aviso.saldo` borrada; la fila de mesas ya no declara `accionAviso`, así que tampoco reserva caja |
| Tocar un chip gris no hace nada | sin pista ni toast | **hecho** · el chip es `disabled`; no se le añadió nada |
| Caso 0 · alguna mesa del reto a tiro | sin aviso | **hecho** |
| Caso 1 · ninguna del reto, sí de uno inferior | «Tu saldo no alcanza para este reto. Puedes jugar en {reto} o conseguir más monedas.» | **hecho** · `{reto}` es el alcanzable **más alto** por debajo del elegido |
| El aviso NO es botón | se cambia de reto con los chips de arriba | **hecho** · es un `<p>` |
| Caso 2 · saldo < 500 | «Te faltan fichas para sentarte en una mesa.» | **hecho** |
| Botón «Conseguir más monedas» | el mismo «Pronto» del `+` dorado, sin duplicar el mensaje | **hecho** · comparte el manejador de la carcasa |
| Comentario ECO-1 en el punto compartido | uno solo | **hecho** · en `PantallaChips`, sobre `pronto` |
| Altura táctil de la casa | único botón nuevo | **hecho** · `min-height: var(--chip-h)`, que ya es `max(40px, …)` |
| Lógica pura en `retarCore.js` | `{ caso, retoSugerido }` | **hecho** · `avisoDeSaldo(saldo, reto)` |
| Pruebas de los bordes | 1.999/2.000 · 999/1.000 · 499/500 · 800 en Pro | **hecho** · 10 pruebas nuevas |
| Textos por `t()` con prefijo `ia.` | y retirar la clave muerta | **hecho** · tres claves nuevas, una borrada |
| Sin rojo | secundario o dorado | **hecho** · frase en `--text-secondary`, botón en `--gold-brand`; el arnés lo mide por color computado |
| **Ocultar la nota del CTA en casos 1 y 2** | ajuste del rector al revisar RET-A; sin reescribirla ni sustituirla | **hecho** · §3.4 |

---

## 2 · La regla, y por qué está escrita así

`retarCore.avisoDeSaldo(saldo, reto)` devuelve `{ caso, retoSugerido }`.

- **Sin reto no hay aviso.** El reto de esta pantalla nunca es nulo —`preseleccion`
  lo cae a Básico— pero la función no lo da por hecho: un id desconocido pasaría
  por `apuestasDe`, que cae a Básico por su cuenta, y entonces estaría
  respondiendo sobre un reto que el jugador no eligió. Con 0 HC y sin reto
  devuelve caso 0, que es la instrucción literal del rector.
- **«Alcanzable» se pregunta por las cuatro mesas**, no por la más barata. Hoy es
  lo mismo; el día que una tabla de `niveles.js` deje de estar ordenada, sigue
  siendo la respuesta correcta sin que nadie se acuerde de este archivo.
- **El «más alto por debajo» se busca en el orden de `NIVELES`**, que es el orden
  de contrato de NIV-UI y el orden en que el jugador ve los chips. No se ordena
  por piso: si las tablas dejaran de ser monótonas, «un reto más fácil» seguiría
  siendo el que está antes en la fila.
- **El caso 2 se llega por búsqueda, no por un 500 escrito a mano.** Hoy equivale
  exactamente a «saldo < 500», y en Básico es el único caso posible —lo dice el
  rector y lo sella una prueba—, pero la constante no aparece en el código.
- **`retoSugerido` es el `id`, no el rótulo.** Los tres nombres viven en
  `niveles.js` desde NIV-UI; la pantalla traduce con `nivelPorId`. Duplicarlos
  abriría la puerta a que el chip diga una cosa y el aviso otra.

---

## 3 · Lo que no estaba en la ficha y hubo que resolver

### 3.1 · El botón se pintaba perfecto y no hacía nada (D-34)

El manejador del «Pronto» vive en `PantallaChips`, que es donde vive el toast. El
bloque nuevo se escribió primero dentro de `RetarIAS`, que es quien **monta** esa
carcasa — o sea, quien está **por encima** de ella en el árbol. Un contexto sólo
baja: allí `usePronto()` devolvía `null` y el `onClick` no hacía nada.

El botón tenía su rótulo, su alto táctil, su color y su sitio. **Ninguna vara lo
cazó.** Lo cazó una captura, mirándola.

Remedio: el bloque es su propio componente (`AvisoSaldo`, en `RetarIAS.jsx`), que
se renderiza **como hijo** de la carcasa y lee el contexto desde dentro. La
decisión —qué caso y qué frase— se queda arriba; el componente sólo pinta.

Y el arnés aprendió: `retar.4` **pulsa el botón** y exige que salga el toast con
la palabra «Pronto». Un botón que se mide sólo por su aspecto es un botón a medio
medir.

> Se descartaron dos caminos antes del contexto. `children({ pronto })` —un
> parámetro de render— lo prohíbe `react-hooks/refs`: `pronto` cierra sobre el
> `ref` del reloj del toast y llamar a esa función durante el render es
> exactamente lo que la regla veta (lo dijo el linter, no la intuición). Y el
> contexto no cabía dentro de `PantallaChips.jsx`, porque
> `react-refresh/only-export-components` no deja que un archivo de componente
> exporte además un hook. Por eso hay un `src/hooks/usePronto.js` nuevo: la línea
> base de lint son 21 y no se sube por una comodidad de colocación.

### 3.2 · El bloque dejaba el CTA fuera de la ventana (D-35)

Con el aviso puesto, en **1024×768 y 1366×768 el CTA se salía 100 px**. Medido con
sonda, no supuesto: el bloque mide 135 px y la columna ya iba justa.

La respuesta **no** fue apretar la pantalla entera. En ese estado hay dos cajas
reservadas para cosas que **ya no pueden ocurrir**, y O1 reserva para lo que
*puede* aparecer, no para lo imposible:

| caja | por qué no puede aparecer en caso 1/2 | recupera |
|---|---|---|
| el aviso de la cuarta fila (`aviso-pila`) | promete con cuánto se sienta cada IA, y no hay entrada que elegir | 27 px |
| el contador de «Otra…» | se reserva para que abrirlo no añada una línea de flex, y no se puede abrir con la fila apagada | 69 px |

Los 69 px son la línea entera: con el contador dentro, la cuarta fila medía 126 px
de chips en vez de 57. Se apagan con `:has(.sal-saldo)` —sólo mientras el aviso
esté— y **en todos los tamaños**, no sólo en el traje corto de ≤800: la razón es
la misma en un 1920 que en un 1024, y hacer que la columna cambie de forma al
cruzar los 800 px sería dos pantallas otra vez.

Resultado medido: el CTA entra con **21 px de margen** en los dos escritorios de
768 y con **54 px** en el 360×640.

### 3.4 · La nota del CTA se oculta, pero no suelta su caja (ajuste del rector)

En los casos 1 y 2 la nota bajo el CTA decía «Elige reto, jugadores, apuesta y
entrada» mientras el párrafo de encima explicaba que no hay nada que elegir. El
rector ordenó ocultarla —sin reescribirla ni sustituirla por otra frase— y exigió
que el margen del CTA **sólo pudiera crecer**.

El primer intento fue `display: none`, y la medición lo tumbó: esta caja está
**debajo** del CTA, así que devolverla no regala margen, **lo cobra**. La columna
se acortaba 15 px y el CTA bajaba con ella — de 54 px de margen a 39 en un
360×640, justo al revés de lo pedido.

Se oculta con `visibility: hidden`, que deja la caja puesta. La geometría queda
**idéntica al píxel**, la frase sale igual del árbol de accesibilidad —un lector
de pantalla no debe leer una instrucción imposible— y es el mismo idioma que
`.sal-aviso` usa desde SAL-2 para su hueco reservado. En el caso 0 la nota sigue
exactamente como estaba.

| ventana | margen del CTA antes del ajuste | después |
|---|---|---|
| 1024×768 | 21 px | **21 px** |
| 1366×768 | 21 px | **21 px** |
| 360×640 | 54 px | **54 px** |

El arnés lo pregunta por `visibility` y no por rectángulos: la caja sigue ahí a
propósito, así que contar cajas diría «visible» siempre.

### 3.5 · Y por qué el bloque no reserva caja él mismo

O1 existe para que nada se mueva bajo el dedo que va a pulsar. Aquí no puede
pasar, y es mecánico: lo único que enciende o apaga el bloque es **cambiar de
reto**, y cambiar de reto **limpia apuesta y entrada** (la cascada de §2.2), o sea
que el CTA queda apagado sí o sí en ese mismo gesto. Nada que el jugador estuviera
a punto de pulsar cambia de sitio, y las tres filas de arriba no se mueven porque
el bloque crece hacia abajo. Reservarle caja costaría ~135 px permanentes, cobrados
al 100 % de las partidas por un estado que casi nadie ve.

---

## 4 · Las varas

| vara | resultado |
|---|---|
| `npm run build` | **0** |
| `npx vitest run` | **963/963** en 34 archivos (eran 953; +10 de los bordes) |
| `npx eslint src/ scripts/` | **21** (20 errores, 1 aviso) — la línea base, intacta |
| `node scripts/diagSAL.mjs` | **102/102** |
| `node scripts/diagDSK.mjs retar` | **6/6 celdas** |
| seis protegidos | **blob idéntico a HEAD**, los seis. `gameTable.css` sigue en `1e21371c8543` |
| `supabase/`, `salas.js`, `salasCore` | **sin tocar** (`git diff --name-only` vacío) |
| `console.log`, `_*.mjs` commiteables, `npm install` | ninguno |

### Las cinco capturas S25 (412×915), en `capturas-retar/` (carpeta ignorada por git)

| archivo | qué enseña | verificado en la corrida |
|---|---|---|
| `ret-a_caso0_4500_pro_5jug_412x915.png` | 4.500 en Pro con 5 jugadores | **2/4 mesas en gris** (200 y 400 a tiro), **sin bloque** |
| `ret-a_caso1_1500_pro_412x915.png` | caso 1 | 4/4 en gris · «…Puedes jugar en **Avanzado**…» |
| `ret-a_caso1_800_pro_412x915.png` | caso 1 saltando un peldaño | 4/4 en gris · «…Puedes jugar en **Básico**…» |
| `ret-a_caso2_300_pro_412x915.png` | caso 2 | 4/4 en gris · «Te faltan fichas para sentarte en una mesa.» |
| `ret-a_pronto_412x915.png` | el «Pronto» desde el botón nuevo | toast «Pronto» |

### Lo que `retar.4` mide ahora

La celda existía para comprobar que «el gris se explique con su cifra». Esa cifra
ya no existe, así que la celda **cambió de objeto, no se aflojó**. Con 2.400 en Pro
exige tres chips apagados, **ningún** aviso (es el caso 0) y que el nodo del aviso
viejo **no exista**; con 1.500 exige los cuatro apagados, el bloque puesto
nombrando Avanzado, el botón con su rótulo exacto y ≥40 px de alto, **sin rojo ni
naranja** en ninguna de las dos piezas —se lee el color computado—, el toast al
pulsarlo, **la nota del CTA oculta** (y visible en el caso 0, que es la otra
mitad de la misma vara), y la geometría completa en ese estado, que es el que de
verdad puede empujar el CTA.

---

## 5 · Abiertos, con dueño

| qué | detalle | dueño |
|---|---|---|
| ~~**La nota del CTA se contradice con el aviso**~~ | **CERRADA** por decisión del rector al revisar RET-A: en los casos 1 y 2 la nota se oculta mientras el aviso esté puesto, sin reescribirla ni sustituirla. Con la caja quieta, para no cobrarle margen al CTA (§3.4) | — |
| **El toast cae encima del CTA** | El «Pronto» es el de la carcasa y aterriza sobre el botón dorado (`ret-a_pronto_412x915.png`). Es comportamiento de siempre —el `+` de la cabecera hace lo mismo— pero ahora el botón que lo dispara está a dos dedos, así que se ve más | **quien abra `PantallaChips`** |
| **`opcionesApuesta().minimo`** | Sobrevive sin lector en el JSX: era lo que pintaba el aviso retirado. Se conserva porque es el dato del que sale el gris y porque una prueba lo sella contra confundir el piso con la apuesta | **quien abra `retarCore`** |
| **`f1` · el punto ciego gemelo** | Sigue abierto de APU-1: es el único modo con manos auto-jugadas sin `contestarRecarga(page)`. El remedio es una línea | próxima tanda de arnés |
| **La fila de acciones en teléfono** | Sigue abierto de APU-1 §5: 28 px en las dos orientaciones; requiere abrir `gameTable.css` | **PAN-1** |
| **`u1` · `hits 0/8`** | Sigue abierto de APU-1 §5 | **quien abra `UtilitiesMenu`** |

**La lección de D-34, en una línea: un botón se mide pulsándolo.**

---

## 6 · Lo que se tocó, y lo que no

**Ocho rutas de código, una nueva.** `src/styles/gameTable.css` y los otros cinco
protegidos no se abrieron ni para leer. `.sal-aviso.es-anfitrion` —el naranja del
aviso retirado— **sigue en la hoja** porque `ArmarMesa` lo usa: retirarlo habría
sido tocar la otra pantalla.

---

## 7 · Mapa archivo → commit

Dos commits. Mensajes en español, prefijo `RET-A`.

### (a) `RET-A: el aviso de saldo de «Retar a las IAS» — regla, pantalla, estilos, pruebas y arnés`

| ruta | qué lleva |
|---|---|
| `src/screens/retarCore.js` | `avisoDeSaldo`, `alcanzaAlgunReto`, las tres constantes de caso |
| `src/screens/RetarIAS.jsx` | el componente `AvisoSaldo`, el cálculo del caso, la fila de mesas sin su aviso |
| `src/components/PantallaChips.jsx` | el Provider y el comentario único de ECO-1 |
| `src/hooks/usePronto.js` | **nuevo** · el contexto y su hook |
| `src/config/textos.es.js` | tres claves nuevas, `ia.retar.aviso.saldo` borrada |
| `src/styles/salas.css` | `.sal-saldo*`, las dos cajas que dejan de reservarse y la nota del CTA oculta en casos 1 y 2 |
| `scripts/testRetarIAS.test.js` | las 10 pruebas de bordes |
| `scripts/diagDSK.mjs` | `retar.4` recableado + las varas del toast y de la nota |

> **Por qué el arnés viaja aquí y no aparte:** sin el recableado, `retar.4` busca
> un aviso que ya no existe y la celda queda roja. Separarlo dejaría un commit
> intermedio con una vara en rojo — el mismo criterio con el que en C-2 los siete
> `git rm` viajaron dentro de (c). *Quien mueve la ruta, recablea el metro, y en
> el mismo commit.*

### (b) `RET-A: informe de la tanda del aviso de saldo`

| ruta | qué lleva |
|---|---|
| `docs/reportes/AJILEI_RET-A_Informe_v1.0.md` | este documento |

### Fuera del índice, a propósito

Las **tres sondas de esta tanda** —`_retaAlto.mjs` (el presupuesto de la columna),
`_retaFotos.mjs` (las cinco capturas) y `_retaPronto.mjs` (la que cazó D-34)— más
las 13 sondas y las 5 rutas ajenas que ya estaban en el árbol. **No borro nada:**
las borra Victor a mano.

Las capturas de `capturas-retar/` tampoco entran: la carpeta está en `.gitignore`
desde APU-1 1e por regenerables.

---

**PARADA.** No hay `git add`. A la espera de que Victor revise el mapa.
