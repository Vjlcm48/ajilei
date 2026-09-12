# AJILEI · SAL-B2 · Ajustes · Informe · v1.0
## Las seis correcciones de la validación con dos teléfonos — STOP antes de la ficha de commits

**Ficha:** `AJILEI_SAL-B2_Ajustes_v1.0.md`. **Rectores leídos enteros antes de empezar:** `docs/reportes/AJILEI_SAL-B2_Fase1a_Informe_v1.0.md` y `…Fase1b_Informe_v1.0.md`.
**Autoridad visual:** `AJILEI_SAL3_lamina_v1.6.html` (sellada el 12-sep-2026), que sustituye a la v1.5.
**Punto de partida:** el árbol de F1a + F1b sin commitear, sobre `main` en `e037db0`.
**Fecha:** 2026-09-12. **Estado al cerrar:** sin commits, sin push, cero SQL. Protegidos intactos.

---

## 1 · Archivos

| Archivo | Qué cambió |
|---|---|
| `src/screens/salaEsperaCore.js` | `finDe` con tercer parámetro `esAnfitrion` (:105-125) |
| `src/screens/salaEsperaCore.test.js` | +3 pruebas (:150-157, :179-184); la de la carrera se duplica con la otra vista |
| `src/screens/SalaEspera.jsx` | el resumen antes del final (:127-128), sonidos intercambiados (:194, :339), el mazo con guarda de pestaña y duración medida (:261-300), la variable del abanico (:519), el botón de salir (:585-600) |
| `src/hooks/useSounds.js` | **sólo el comentario** de los tres sonidos de salas (:91-106) |
| `src/config/textos.es.js` | `vacia` → «Libre» (:152); fuera `salio` y `lobby`; el motivo en la cabecera del bloque (:123-133) |
| `src/config/textos.test.js` | el par declarado pasa a `sal.casa.aria = sal.partida.volver` (:108-112, :136) |
| `src/styles/salas.css` | §12: quinta fila del grid (:737), abanico por variable (:1022-1028), `.sal-esp-salir` (:1058-1078), apagado en los finales (:1138), traje 661–800 rehecho (:1191-1210) |
| `src/dev/salasFixtures.js` | `espera-fin-vencida` nace con la fila YA en `'cancelada'` (:267-272 el motivo, :285-286 la fila) |
| `scripts/diagSAL.mjs` | «Libre» sin truncar (:650-659, :749-750), punto nuevo `esp.salir` (:771-781), el bloque de acción con el botón dentro (:684-699, :765), el tercer acto del realtime cambia de final (:830-847) |
| `docs/reportes/AJILEI_SAL-B2_Ajustes_Informe_v1.0.md` | este informe |

**Intocables, sin tocar:** `useReloj.js`, `relojCore.js`, `useCronometroSala.js`, `supabase/migrations/*`, `salas.css` §0–§11 y §13, y los cinco protegidos (`git diff e037db0` sobre ellos: vacío, al principio y al final). De `useSounds.js` cambia un comentario y ni una línea de código.

---

## 2 · Las seis, una por una

### 2.1 · El anfitrión nunca lee «El anfitrión cerró la mesa» (E5)

**Lo que pasó en el teléfono.** El S25, anfitrión y solo, dejó correr los 3:00 y leyó «El anfitrión cerró la mesa». La fila no guarda quién la cerró: `resolver_sala` escribe `'cancelada'` con las mismas letras que `salir_sala`.

**Lo que se cambió.** `finDe(sala, resuelta, esAnfitrion = false)` (`salaEsperaCore.js:118`). La tabla de F1b §3.3 se mantiene entera; la única línea que cambia es la primera: donde daba `'cancelada'` ahora da `'vencida'` si quien mira es el anfitrión. El porqué queda escrito sobre la función (:105-117): para el anfitrión que sigue en la pantalla, una mesa cerrada es siempre «no llegó gente», porque si la hubiera cerrado él ya no estaría ahí; para un invitado sentado es siempre «el anfitrión cerró», porque con dos o más sentados el barrido arranca la mesa en vez de cancelarla. El valor por defecto `false` deja intacta a cualquier llamada vieja.

`SalaEspera` pasa `resumen.esAnfitrion`, y para eso el resumen se calcula **antes** que el final (:127-128) — el único reordenamiento de la tanda, con su comentario.

**Cinco pruebas.** Las dos nuevas directas (`salaEsperaCore.test.js:150-157`): anfitrión + fila `cancelada` → `'vencida'`, invitado + fila `cancelada` → `'cancelada'`. Y las tres de la carrera repetidas con la vista del anfitrión (:179-184), que sellan que lo que cambia es cómo se LEE una cancelada, no quién gana la carrera.

### 2.2 · El mazo, con la pantalla apagada (E8)

**Lo que pasó.** Con el Motorola sentado y la pantalla apagada, se seguía oyendo barajar.

**Lo que se cambió** (`SalaEspera.jsx:261-300`). Guarda doble, como pide el rector: un escuchador de `visibilitychange` con handle **para** el intervalo al ocultarse la pestaña y lo vuelve a arrancar al volver —así se reanuda el ciclo normal y no se descarga de golpe ningún barajado acumulado—, y el propio pulso comprueba `document.hidden` por si la pestaña nació oculta y el evento nunca llegó. Al parar se limpia también el reloj de la clase y el mazo queda quieto. `useCongelado` no se importa: es del audio de la partida y montarlo aquí abre un frente que esta tanda no tiene. La marca de agua no necesita guarda: su animación es CSS y el navegador ya la para.

### 2.3 · El barajado sincronizado (E1) — y la cifra que lo deja a medias

**Lo que se cambió.** El sonido y la clase salen del **mismo pulso** y del **mismo handle** (`SalaEspera.jsx:274-288`): `play('cardShuffle')` devuelve `{ sound, id }`, de ahí se lee `sound.duration() * 1000 * 0,49` —el recorte de la receta— y ese número gobierna las dos cosas a la vez: el `setTimeout` que quita la clase y, por la variable `--sal-esp-baraja` que el nodo del mazo escribe en línea (:519), la duración de las tres animaciones del abanico (`salas.css:1026-1028`, con el `0.9s` de la lámina como respaldo). Ya no hay dos cifras que puedan separarse. El estado `barajando` pasa de booleano a milisegundos (:106). `useSounds.js` no se toca; el volumen sigue en 0,15.

**Y aquí la cifra que la ficha no podía saber.** Medido: `card-shuffle.mp3` dura **5,208 s**, así que el 49 % de la receta son **2 552 ms** de sonido real. El techo que la ficha fija es de 1 400. Con el techo aplicado —que es lo que está en el árbol— el abanico dura 1 400 ms contra 2 552 de sonido: mejor que los 900 fijos de antes, pero **la corrección 3 no cierra del todo**. Estirar el dibujo a dos segundos y medio se lee como cámara lenta, así que subir el techo no es gratis; la otra salida es cortar el sonido desde este mismo handle a la medida del abanico. Las dos son decisión de Victor (§5-1). La cifra queda escrita también sobre las constantes (:62-79) para que el código no mienta.

### 2.4 · Intercambio de sonidos

Dos llamadas y un comentario, nada más:

| Momento | Antes | Ahora | Línea |
|---|---|---|---|
| Alguien se sienta | `chipsCollect` | **`tableKnock`** | `SalaEspera.jsx:194` |
| «Jugar ya» | `tableKnock` | **`chipsCollect`** | `SalaEspera.jsx:339` |

`SONIDOS_SALAS` y la precarga no cambian: son los mismos tres. El comentario de `useSounds.js:91-106`, que documenta el motivo de cada sonido, se actualiza para que no quede mintiendo, con la nota de que lo que cambió es quién llama a cuál y no la receta. Es la única línea que esta tanda toca en ese archivo.

### 2.5 · «Libre» y el botón «Salir de la mesa» (lámina v1.6)

**La silla vacía** dice «Libre» (`textos.es.js:152`). El motivo está en la cabecera del bloque (:123-133): a 360 px de ancho el bloque de la silla mide `1.6·silla` y «Esperando…» se leía «Esperand…» (informe de F1b §9-7).

**El botón** (`SalaEspera.jsx:585-600`, `salas.css:1058-1078`): contorno, nunca oro —el oro de esta pantalla es el código y el CTA—, alto `max(40px, 9u)`, borde `--linea`, color `--text-secondary`, oro al pasar por encima o al enfocar. Vive **fuera** del nodo que la acción repinta, como quinta fila de la columna (`salas.css:737`), con su `margin-top: .4u`. Visible en las dos vistas y también con la mesa llena; en los tres finales `visibility: hidden` (:1138), que le conserva la caja: el CTA del final ya es la salida y la columna no debe moverse al terminar la mesa.

**Conducta:** llama a `salir`, exactamente lo mismo que la flecha «Volver» — anfitrión al diálogo, invitado a `salirSala` y fuera. La casita sigue sin cancelar.

**El alto de la columna sí se resintió**, como la ficha anticipaba. Medido a 1024×768 y 1366×768: la quinta fila trae 54 px de botón + 2,4 de margen + 7,2 de un hueco más, y la columna pasó de caber justa a desbordar por 46 px; con la columna desbordada `align-content: space-evenly` se comporta como `start` y el anillo de sillas además pisaba el consejo por dos píxeles (el arnés lo cazó: 14 celdas en rojo, `sal.1` y `sal.6`). El retoque es aditivo dentro de §12, en el traje de 661–800 que F1b había añadido (`salas.css:1191-1210`), y el reparto que elige **no** es el evidente:

> la **silla** SUBE (7,6u → 8,5u) y el **óvalo** BAJA (27u → 16u).

El motivo, medido: los rótulos de la silla van en `2.7u` y `2.2u`, cifras que no cuelgan de `--silla`, así que apretar la silla deja el bloque de texto sin sitio y las sillas se salen de su caja (probado: con 6,4u de silla el anillo pisaba el código y el consejo por 6,8 px). El óvalo, en cambio, sólo tiene dentro el reloj y una línea, y cede sin perder nada. Resultado: la mesa pasa de 312,5 px a 264,3, la columna cabe en los 588,3 disponibles, y las sillas quedan 2,6 px por dentro del código y del consejo. El relleno baja a `.4u / .8u` para comprar ese margen.

**En apaisado bajo** el botón cae bajo el pliegue y la pantalla desplaza, como sella la lámina. No se añadió ninguna regla para hacerlo caber.

### 2.6 · Dos claves retiradas

`grep` pegado, corrido antes de retirarlas:

```
$ grep -rn "sal\.espera\.salio" src scripts
src/config/textos.es.js:151:  'sal.espera.salio':           'Saliste de la mesa',

$ grep -rn "sal\.espera\.lobby" src scripts
src/config/textos.es.js:167:  'sal.espera.lobby':           'Volver al inicio',
src/config/textos.test.js:108:    //   sal.casa.aria = sal.espera.lobby
src/config/textos.test.js:123:    //   sal.espera.lobby = sal.partida.volver  (SAL-B2 F1b)
src/config/textos.test.js:138:      'sal.casa.aria = sal.espera.lobby',
src/config/textos.test.js:141:      'sal.espera.lobby = sal.partida.volver',
```

Cero consumidores de verdad: los cinco aciertos de `lobby` son su propia declaración y la prueba de textos repetidos que la nombra. Las dos fuera.

**Efecto lateral, atendido:** «Volver al inicio» lo dicen tres claves, y `lobby` era la primera de las tres, así que cerraba los dos pares declarados. Retirada, el par lo cierra el stub: la lista de `textos.test.js` pierde `sal.casa.aria = sal.espera.lobby` y `sal.espera.lobby = sal.partida.volver`, y gana `sal.casa.aria = sal.partida.volver` (:136), con el cambio explicado en su comentario (:108-112).

**`sal.espera.fin.cerraste` NO se añade.** La lámina v1.6 la lleva en su diccionario, pero con la regla de §2.1 no hay ningún camino en el que el anfitrión que cerró siga en la pantalla para leerla: `salir` lo saca en el mismo gesto. Queda anotado aquí y en la cabecera del bloque de textos.

---

## 3 · Arnés

| Punto | Qué mide ahora |
|---|---|
| `esp.sillas` | además de lo de F1b: la silla vacía dice **«Libre»** y **no se trunca** (`scrollWidth <= clientWidth`) en los seis viewports (`diagSAL.mjs:650-659`, :749-750). Se mide que la palabra QUEPA, porque el truncamiento fue el motivo del cambio |
| **`esp.salir`** (nuevo) | el botón existe, es tocable (≥ 40 px), su texto no desborda, y su `visibility` es `visible` fuera de los finales y `hidden` en los tres —conservando la caja— (:771-781) |
| `esp.accion` | la caja de acción sigue midiendo `--cta-h + 1.6u + 1.4·2.9u`, y **además** el BLOQUE entero, de la cima de la caja al pie del botón (:684-699, :765). El aire entre filas lo reparte `space-evenly`, así que no se supone: se lee del hueco consejo → acción, que es el mismo, y se le suman el `margin-top: .4u` del botón y su alto. Medido a 360×640: 126,39 contra 126,37 esperados |
| `esp.fin` | `espera-fin-vencida` es fixture de **anfitrión** y su fila nace **ya en `'cancelada'`** (`salasFixtures.js:285-286`), que es lo que E5 vivió; lee «La mesa se cerró: no llegó gente a tiempo». `espera-fin-cancelada` es fixture de invitado con la misma fila y lee «El anfitrión cerró la mesa». Dos estados, la misma fila, dos textos: es la corrección 1 medida |
| `esp.realtime` | el tercer acto cambia de veredicto y por eso vale más: el `UPDATE` a `'cancelada'` llega mientras **quien mira es el anfitrión**, así que ahora se exige `is-fin-vencida` y «no llegó gente a tiempo» (antes `is-fin-cancelada`), más que el botón de salir quede apagado (:830-847). Es el defecto E5 reproducido en vivo, sin backend |

17 estados y 102 celdas, como manda la ficha. **Resultado: 102 / 102** (playwright-core 1.62.1, Chromium 152.0.4191.66), contra `vite` en 5173 con `VITE_AUTH_BYPASS=1`, levantado y apagado por esta tanda. Capturas en `capturas-sal/`.

---

## 4 · Cifras

| Qué | Resultado | Línea base |
|---|---|---|
| `npx eslint .` | **21** (20 errores, 1 aviso), los mismos 21 | 21 |
| `npm test` | **685 / 685** en 26 archivos | 682 |
| Pruebas nuevas | +3, todas de `finDe` | — |
| `npm run build` | limpio (el aviso de tamaño de chunk, preexistente); `dist/` sin `__salEmitir`, `simulacionSalas`, `ESTADOS_SAL` ni nombres de estado | — |
| `node scripts/diagSAL.mjs sal` | **102 / 102** | 102 / 102 |
| Protegidos | `git diff e037db0` sobre los cinco: vacío, al inicio y al final | — |

---

## 5 · Dudas y «requiere autorización»

1. **El barajado sigue sin cuadrar del todo, y la cifra es la de §2.3.** El sonido real dura 2 552 ms y el techo del rector es 1 400. Lo que está en el árbol respeta el rector. Las dos salidas son subir el techo (un abanico de 2,5 s se lee como cámara lenta) o cortar el sonido desde el handle a la medida del abanico (no toca `useSounds.js`: lo hace el consumidor con el `{ sound, id }` que ya tiene). **Es la única de las seis que queda a medias.**
2. **El traje de 661–800 redistribuye óvalo y silla** (§2.5), no sólo aprieta: el óvalo baja de 27u a 16u, que es un cambio visible en escritorio. Las cifras salen de medir a 1024×768 y 1366×768 con el arnés; conviene una mirada en pantalla real.
3. **`esp.accion` mide el bloque leyendo el hueco de otra fila.** Es honesto —`space-evenly` reparte el aire y no hay forma de escribirlo como constante— pero el punto depende ahora de que todas las filas compartan hueco, que es lo que el grid promete.
4. **`sal.espera.fin.cerraste` queda sin escribir** (§2.6). Si algún día el anfitrión pudiera quedarse en la pantalla tras cerrar, hará falta.
5. **El cronómetro sigue latiendo oculto en `fin`** (F1b §9-1): aceptado por la ficha §5-3, no se abrió el hook.
6. **La guarda del mazo es por pestaña, no por audio.** Si en el futuro la sala gana más sonidos de fondo, el sitio correcto es `useCongelado`, y entonces esta guarda sobra.
7. **El botón de salir no confirma nada por sí mismo**: reusa `salir`, así que el anfitrión ve el mismo diálogo que con la flecha. Es lo que la ficha pide, y significa que hay dos caminos visibles a la misma confirmación.

Ninguna bloquea la ficha de commits.

---

## 6 · Tiempo real

≈ 55 min (lectura de los dos informes, las seis correcciones, la medición del traje con cuatro barridos de combinaciones, tres corridas del arnés, lint, test, build e informe). Lo único que no salió a la primera fue el traje de 768: la primera hipótesis —apretar la silla— empeoró el anillo, y la medida enseñó por qué (los rótulos no cuelgan de `--silla`).

**STOP.** Sin commits, sin push. Después: ficha de commits de SAL-B2 (F1a + F1b + ajustes) con el mapa archivo → commit pegado **antes** del primer `git add`.
