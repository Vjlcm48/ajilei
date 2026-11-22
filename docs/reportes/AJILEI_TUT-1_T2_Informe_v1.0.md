# AJILEI · TUT-1 / GUI-1 · Tanda 2 · La partida guiada · Informe · v1.0

- **Fecha:** 2026-11-21. **Base:** `45e61d6` (tanda 1, sin push de `main`; respaldo `respaldo-tut-1`).
- **Ficha:** `AJILEI_TUT-1_T2_v1.0.md`. **Normativo:** `AJILEI_Tutorial_v1.3.md` (entra con esta tanda; la v1.0 sale con `git rm`, la v1.1 nunca llegó a git).
- **Protegidos:** no se abrió ninguno. El motor, la IA y la baraja se conocieron ejecutándolos (`setRng`/`resetRng`, `startHand` y las fases, `decideDiscard`), nunca leyéndolos.
- **Lo visible para el jugador:** «Cómo se juega» del lobby abre la partida guiada (entrada provisional, ficha §1.4). Fuera de ella, dos cambios de producto en la celebración de AJILEI de **todas** las mesas, decididos por Victor en el STOP-T: el **velo** al 55 % y la **cola** del rasgueo de 1 s (§5, commit 2-d).

---

## 1 · Lo que se construyó

### 1.1 El mazo dado (`src/lib/mazoDado.js`)

`tiradasPara` y `armarOrden` salen de `src/dev/repartoGanador.js`, puros, y aquél los importa sin copia. Nuevo: **`soltarMazo()`**, que llama a `resetRng()` se haya consumido el orden o no. `screens/Guiada.jsx` lo llama al salir por cualquier puerta: «Salir», el cierre o desmontar la pantalla. `mazoDado.test.js` (5 casos) fija lo que pide la ficha: un orden armado sale tal cual, soltar antes de consumir deja dos barajados seguidos distintos del guion, el orden se consume una sola vez y soltar sin nada armado no rompe nada.

### 1.2 Las tres manos (`src/lib/guiaManos.js`)

**Los órdenes se buscan, no se escriben.** `scripts/guia/buscarOrdenes.mjs` juega cada mano con el motor real (registro `_resolveExt.mjs` + importación dinámica; el descarte de las IAS es el de `decideDiscard`) sobre órdenes candidatos, y pega los tres entre `BEGIN ORDENES` y `END ORDENES`, con lo que cumple cada uno contado por él mismo. Con `--solo N` vuelve a buscar una mano y **juega y comprueba** las demás sin cambiarlas.

| Mano (v1.3) | Tus cartas | Lo que haces | Resultado |
|---|---|---|---|
| 1 · tú eres Mano | 10 y 6; a cinco, tres de Oros (30) | Pasas, pasas, cambias las dos sueltas y llegan otras dos que no son del palo (sigues en 30). Última ronda: pasas, IA 1 apuesta ×1, IA 2 iguala, igualas | Pozo 600; gana IA 2 con 37 |
| 2 · Mano IA 1 | 4 y Caballo de Espadas; a cinco, 36 mientras un rival lleva 40 | ×1, ×2, cambias el 7 de Copas y llega el 5 de Espadas (46), ×5 | Ganas 2.700 |
| 3 · Mano IA 2 | As y 5 de Bastos; a cinco, AJILEI de 51 | ×1, ×10, «Sin descartar», ×10 | Ganas 6.600, con la celebración |

**Rivales de guion** (`decidirRival`, con la forma de `decidirIA` y el peso `leve` del ritmo Rápido): igualan toda apuesta viva y, sin ella, pasan. La única apuesta propia es la de IA 1 en la última ronda de la mano 1 (`GUION_RIVALES`, v1.3). Nunca suben ni se retiran. **El humano** sigue la `ESCALERA` del normativo: cada «×k y Apostar» son dos pasos.

`guiaManos.test.js` reproduce las tres manos con el motor, por la misma vía que el buscador, y afirma cada condición del normativo por separado (a 2 cartas, a 5, el descarte y lo que llega, el pozo, al mostrar, sin empate y nadie con AJILEI salvo tú en la 3). También comprueba que ningún rival se queda sin pila, que la Mano rota (tú, IA 1, IA 2), que hay tres pases y una igualada, que cada rótulo existe y que las cartas que señalan los pasos son las que el orden hace ciertas. Si un día el motor cambia y una condición deja de cumplirse, esta prueba lo dice.

### 1.3 La mesa guiada

**`App`** tiene la rama `screen === 'guiada'`, con su trozo propio (`lib/trozos.guiada`, INV-84). **`screens/Guiada.jsx`** monta `GameTable` por `lazy(fabricaMesa)` + `PantallaDiferida trozo={trozoMesa}` (INV-29) con `guion` y sin `control`, `apiRanking` ni `apiConsulta`: no pasa por `retar` ni por `sentarse_ia`.

**En `GameTable`, con `guion`** (sin él, nada cambia: cada guarda está en su sitio, como las de `partida`):

| Guarda | Cómo |
|---|---|
| La lista | `guion.estadoInicial()`: tres de 10.000, sin comodín, apuesta 100, sin moldes de desarrollo |
| El mazo | `guion.armar(prev)` justo antes del barajado de cada mano |
| Los rivales | `guion.decidir` donde decide `decidirIA`, con la misma espera de `ritmoDe` |
| El reloj | No corre. Su caja se reserva con `visibility: hidden` (la mesa no se mueve) |
| El ritmo | Siempre Rápido (`FACTOR_RAPIDA`), sin leer ni escribir `ajilei.partidaRapida` |
| Recarga y puntos | No existen (`RECARGA.NINGUNA`; `puntosMano` 0) |
| El final | Tras el pago de la mano 3 no hay «Siguiente mano» (`finGuion`): va al cierre |
| La capa | `<guion.Control>` con lo que la mesa sabe (`vista`): baraja, reparte, repone, recoge, celebra, turno, descarte y el sonido de la celebración |

**`GuiaControl`** lee la mesa y decide el paso. No la toca: lo que hace un paso lo hace el toque del jugador sobre el control de verdad. Hay tres formas de avanzar:

- `toque`: el toque real sobre el ancla (`alTocar`, en captura);
- `seleccion`: cuando la selección de descarte de la mesa es justo la que pide el paso (la mano 1 pide dos cartas);
- `lectura`: con «Siguiente».

Mientras ningún paso se ve, una capa transparente a z 40 no deja tocar nada y solo queda «Salir». La mano 1 tiene 12 pasos, la 2 otros 12 y la 3 diez; el último es la celebración, sin rótulo.

**`CierreGuiada`** muestra «¡Ya sabes jugar!» con el texto de la v1.3. Lleva el hueco de la recompensa (vacío, para GEN-1), «Jugar de verdad» (lleva a Retar a las IAS) y «Volver al lobby». Al montarse marca `hecha`.

### 1.4 La entrada provisional

«Cómo se juega» (`Lobby.jsx`) abre la guiada con un `onClick`. `lob.toast.pronto` se queda.

### 1.5 Textos

`textos.tut.es.js` va **por grupos** (`TEXTOS_TUT_COMUNES`, `_OFERTA`, `_SENALES`, `_CAP5`, `_GUIADA`). `TEXTOS_TUT_ES` es su suma bajo `/* @__PURE__ */ Object.assign(...)`: un `{...a, ...b}` exportado no lo quita el árbol de rolldown. Así la guiada lleva a `dist/` solo lo suyo, y la oferta y el capítulo 5 siguen fuera (`testDistSinMoldes`). Son 31 claves de la guiada (`tut.g*`) más 4 del cierre. Los textos repetidos del normativo comparten una clave, porque `textos.test` no admite dos claves con el mismo texto.

### 1.6 La vara `tut guiada`

`diagDSK tut guiada` (`scripts/tut/guiada.mjs`) es una puerta aparte, `tut.guiada`. Juega la guiada entera desde el lobby real, en 360×640, 640×360 y 1920×1080: en cada paso toca el control único (con el dedo en el teléfono, con el ratón en la PC) por el hueco de la capa.

| Puerta | Qué comprueba |
|---|---|
| tut.guiada | Llega al cierre habiendo visto la celebración de AJILEI y deja `hecha`; en cada paso, el toque del control único avanza |
| tut.red | Ninguna llamada a `sentarse_ia`, `informar_pila`, `recargar_ia`, `salir_ia`, `mi_consulta`, `consultar_mano` ni `mini_perfil`, ni al banco imitado ni a la red. **Control:** el mismo espía sí ve `sentarse_ia` en la mesa real. La píldora dice 5.000 antes y después (INV-47) |
| tut.salir | «Salir» está en cada paso y entre pasos: arriba a la derecha, vinotinto, no apagado y sin pisar ni el rótulo ni la barra |
| tut.delta | Δ 0 de las cajas de `#root` con la capa y sin ella, en cada paso de lectura (INV-89) |
| tut.lineas | Ningún rótulo de la guiada pasa de dos líneas |
| tut.mazo | Solo en 360×640: «Salir» en el paso 1 y después una mesa real de 3: tus cartas no son las del guion (R-2) |
| tut.consola | Sin errores de página |

Tarda unos 96 s, así que va en **`completo`**, y `tut` (3 s) sigue en `commit`, como prevé la ficha.

---

## 2 · El STOP-T: lo que cambió de oído

Victor jugó la guiada en el S25 por túnel (preview en 4174; el 4173 es suyo). Cada ronda cambió el normativo o la mesa antes de los commits:

1. **v1.0 → v1.1.** Llegó la escalera (pasar, ×1, ×2, ×5, ×10; los rivales lo igualan todo) y el paso de **selección** (las cartas se tocan de verdad). Los tres órdenes se volvieron a buscar.
2. **v1.1 → v1.3.**
   - **La mano 1 termina igualando:** IA 1 apuesta ×1 en la última ronda. El primer orden que cumple resultó ser el mismo de antes.
   - **El cierre de la mano 1** pasa a «Igualaste con poco y perdiste…», que cabe en dos líneas; el de la v1.1 daba tres.
   - **«Saltar» pasa a «Salir»:** arriba a la derecha, aparte de «Siguiente», vinotinto con borde de oro y sin pregunta. La burbuja, la tarjeta y la barra se colocan por debajo (`techo`). «Salir» queda fuera del gris de `unico`.
3. **Tres ajustes de la celebración (2026-11-21):**
   - el velo (§5.1);
   - la pausa: el cierre espera a la celebración **y** a su sonido, y después deja 1 s con la palabra AJILEI quieta (§5.3);
   - el sonido (§5.2), que necesitó dos decisiones: primero una cola de 500 ms y, sin volver a probar, 500 ms más.

## 3 · Las dos dudas del normativo §4

Respondidas ejecutando el motor, sin abrirlo:

- **D-29:** cinco cartas del mismo palo que **no** suman 51 **no** son AJILEI. 43 de Copas pierde contra 50 de Oros; solo 51 dispara «¡AJILEI!».
- **El tope de descarte:** 5 cartas en las mesas de 2, 3 y 4; 3 en la de 5.
- **De paso, una contradicción para el capítulo 2:** la tabla de reglas y el capítulo 2 dicen que lo más que suma un palo sin AJILEI es 41, pero el motor da 46 a cinco cartas de un palo sin As (la mano 2 llega a 46). Esta tanda no lo toca.

## 4 · Lo que salió al construirla

1. **`1.8b` sube 141 B** (179,6 → 179,8 KiB), por encima de los 0,1 KiB que esperaba la ficha. No es solo el `onClick` del lobby: la rama de `App` y la línea del trozo nuevo viven por fuerza en la entrada. La precarga ya estaba en su mínimo.
2. **`testMesaDiferida`:** la guiada no puede importar `GameTable` de forma estática. La monta como `Retar`, con `lazy(fabricaMesa)` y `PantallaDiferida`.
3. **El pozo en el pago ya es 0.** Cuando un paso enseña el pozo y la ronda la cerró tu palabra, las monedas ya volaron. Por eso la cifra es la suma de `contribMano` (`pozoDeMano`) y las cantidades van con `montoTexto`.
4. **La vara no oculta con `display:none`.** Ocultar la capa así para medir Δ la hacía recolocarse y fallaban los toques; se usa `visibility:hidden`. El ratón sobre «Pasar» daba Δ 2 por el *hover*: antes de medir, `mouse.move(1, 1)`.
5. **En el bypass el dinero va al banco imitado.** La vara espía `window.__ajileiBancoImitado`, y además la red. Lleva su control: si en la mesa real no ve `sentarse_ia`, el espía está ciego y la puerta sale roja.
6. **Retar es una cascada:** para la mesa real de `tut.mazo` hay que elegir fila a fila (reto, jugadores, apuesta y entrada), esperando a que cada una se encienda.
7. **El rasgueo trae un solo rasgueo, no dos** (§5.2). La medida sellada en Victory_Celebration v1.0 §7.1 era el rizado de la cola; queda corregida en la enmienda v1.1b. En el informe del STOP-T del 2026-11-21 yo había repetido el «segundo rasgueo» sin medirlo.
8. **Dos búsquedas de texto sobre `src` entero** enseñaron sin querer líneas sueltas de protegidos (`aiPlayer.js`, `gameEngine.js`, `pozos.js`, `gameTable.css`). No se usaron para nada, y desde entonces las búsquedas los excluyen.
9. **Retirar sin borrar:** `rm` está denegado en el repo. La v1.0 del normativo sale con `git rm` en el 2-c, y la v1.1, que nunca estuvo en git, se movió al scratchpad.

## 5 · La celebración de AJILEI (commit 2-d, todas las mesas)

### 5.1 El velo

- **Antes:** la capa de la palabra era transparente. Lo único que la separaba del tapete era su sombra, negra al 55 %.
- **Ahora:** un velo negro al **55 %** (la misma cifra) sobre todo lo que hay detrás.
  - Entra, se sostiene y sale con la palabra: `vcAjileiVelo`, 2 s, con mesetas del 10 al 80 %.
  - Solo cambia el fondo de `.vc-ajilei-capa` (`celebracion.css`); ni caja, ni capa de apilado, ni toques.
  - Vale en las dos mesas, IAS y personas, porque comparten `AjileiOverlay`. Los estilos de la capa están en `gameTable.css`, que es protegido: se midieron en el navegador.
- **Medido:** fondo de 0,376 a los 130 ms y de 0,55 en la meseta. «Salir» de la guiada (z 40) queda encima.
- Fotos de antes y después en el scratchpad de la sesión (`fotosCel/`).

### 5.2 La cola del rasgueo

- **El recorte:** sigue empezando a los 1300 ms (`STRUM_CORTE_MS`). El desvanecido (`STRUM_FADE_MS`) pasa de **130 a 1000 ms**, así que termina a los **2,3 s**, bajo el techo de 2,5 s de la Celebración §1. Antes se oía cortado en seco.
- **El documento:** §7.1 de `AJILEI_Victory_Celebration_v1.0.md` dice ahora **≤ 2,5 s**, con fecha y «decisión de Victor» (enmienda v1.1b). Se etiqueta v1.1b porque «v1.2» ya es otro archivo, el de la campaña CEL.
- **Dónde empieza el segundo rasgueo:** Victor pidió comprobarlo y, si caía antes del final del desvanecido, terminar justo antes.
  - **No hay segundo rasgueo.** Se decodificó el mp3 en el navegador (`decodeAudioData`).
  - El flujo espectral (STFT de 2048 con salto de 5 ms) solo marca los ataques del primero: 174, 229 y 349 ms.
  - Entre 1,2 y 2,0 s el flujo es plano (9–14 % del máximo) y la energía solo baja.
  - El «segundo racimo en 1,59/1,72/1,84» de §7.1 era el rizado de esa caída leído por un detector de subidas de energía: el mismo detector ingenuo marcó aquí 1590, 1715 y 1835 ms.
  - Por eso el desvanecido no tapa ningún ataque y va entero.

### 5.3 La pausa de la guiada (2-b)

- **El sonido:** `useCelebracion` expone el último sonido de la celebración (`sonido()`, solo lectura; la mesa no cambia) y `GameTable` lo pasa en `vista`.
- **La espera:** en el paso final, `GuiaControl` espera al `end` o al `stop` de ese sonido. Después deja **1 s** y entonces llama a `guion.alTerminar`.
- **La palabra no se desvanece en la guiada** (`html[data-guiada]`, que pone `Guiada.jsx`):
  - su animación y la del velo corren solo hasta el 75 % (`animation-iteration-count: 0.75`, con `both`);
  - al acabar la celebración, `GuiaControl` monta una copia con las mismas clases ya en su último fotograma (retraso de −1,5 s), en el mismo render.
- **Medido con la cola de 500 ms** (silencio a 1,78 s, parada a 1,80–1,81 por el desfase de los relojes): la palabra quieta y la celebración se relevan a 2,01 s, con la misma caja, y el cierre entra a 3,02 s.
- **Con la cola de 1000 ms (medido en los tres tamaños):** la palabra quieta releva a la celebración a 2,01–2,02 s; el volumen llega a cero a 2,27 s y la parada cae a 2,31–2,32 s (bajo los 2,5 s); el cierre entra a **3,32 s**, un segundo después de la parada. Ahora es el sonido, no la celebración, quien marca la espera.

## 6 · Las varas

Todas sobre el árbol final, con `dist/` compilado por el orquestador. El 4173 no se tocó.

| Vara | Resultado | Nota |
|---|---|---|
| eslint (`.`) | 0 | — |
| vitest | 117 archivos, 3 147 pruebas, verde | Incluye `mazoDado`, `guiaManos`, `testDistSinMoldes` (salen `tut-capa` y `data-tut-unico` de «hasta montar» y pasan a obligatorias), `testInvariantes`, `testClavesAlmacen`, `orquesta.test` y `useSounds.test` (la cola: parada a 2300 ms, ≤ 2500) |
| `1.8b` | 179,8 KiB, verde | +141 B sobre 179,6 (§4.1) |
| `diagDSK tut` | verde, 3 s | — |
| `diagDSK tut guiada` | 0, 1 min 39 s | Las siete puertas en los tres tamaños |
| `diagCEL0 celebracion` | **1, después 0** | Primera pasada: `escritorio-1920x1080: entraron 3 rubros, deben ser 4`, en 2 de 3 repeticiones (§6.1). Repetida sola sobre el mismo árbol: 0 fallos. Sin resellar |
| `diagDSK vuelo` | 0, 7 min 16 s | Sin resellar |
| `diagDSK lec` (lec.mapa) | 0, 43 s | — |
| `diagDSK apu` | 9 de 9 con código 0 | 7 celdas, rec2 y voz3 |
| `diagDSK h1` | mesas 5, 4, 3 y 2 con código 0 | — |
| `diagDSK z1` | 0 | — |
| `diagDSK rec` | 0 | — |
| `diagDSK msg` | 0 | — |
| `diagPUE cap` | 0 | Con el velo; sin resellar |
| `diagDSK pvp` (pvp.mesa) | 0 | La mesa de personas no nota `guion`; con el velo, sin resellar |
| `diagDSK vc` | 0 | Con el velo |

`cap`, `pvp.mesa` y `vc` se corrieron con el velo y la cola de 130 ms; la cola solo cambia el audio, que esas varas no miden. `celebracion`, `vuelo` y `tut.guiada` se corrieron con el velo, con la cola de 500 ms y con la de 1000; todas verdes salvo la primera `celebracion` con 1000 (§6.1).

### 6.1 El rojo de `celebracion`, intermitente

La primera pasada de la tanda final (con la cola de 1000 ms) dio un fallo nuevo en la pantalla de victoria de escritorio: de los cuatro rubros de la cascada, el instrumento solo vio entrar tres (`cel-rubro-entra` de «Tu mejor mano» no llegó), en las repeticiones 1 y 3 de 3. **No lo causa el cambio de la tanda:**

- en esa pantalla no suena el rasgueo, solo el golpe en la mesa y la melodía (sonda de audio sobre `?cel`); la espera medida es la del golpe, 1893 ms, la misma que en las dos pasadas verdes anteriores;
- los tiempos del arco (premio, traspaso, saldo y cascada de 1145 ms) coinciden con los de las pasadas verdes: la cascada entró entera según las marcas de la app; lo que faltó es el evento en el espía;
- la celda captura pantalla (`capturas: true`) y su peor cuadro fue de 671 ms: el `page.screenshot` congela el render, el molde que la vara ya documenta para esta cascada;
- repetida sola sobre el mismo árbol, sale verde con 0 fallos.

Queda como intermitente del instrumento, sin dueño todavía; no se reselló nada.


## 7 · Lo que no se hizo

- **La tanda 3:** la recompensa (§1.5, el hueco queda en el cierre), los textos nuevos de la oferta (§1.2) y la señal del primer turno con «Te apuestan: **Igualar**» (§1.6).
- **El «Cerrar» de abajo en los capítulos:** si queda junto al de arriba o desaparece se decide al construir los capítulos.
- **El control de las IAS:** al cerrar la tanda 5 (ficha §4).
- **Lo que el arnés no puede medir:** cómo suena la cola en el S25 y el giro del teléfono con la capa. Lo mira Victor.
- **Nada en la nube** y ninguna migración.

## 8 · Mapa archivo → commit

| Commit | Archivos |
|---|---|
| **2-a** el mazo dado y las manos | `src/lib/mazoDado.js` · `src/lib/mazoDado.test.js` · `src/dev/repartoGanador.js` · `src/lib/guiaManos.js` · `src/lib/guiaManos.test.js` · `scripts/guia/buscarOrdenes.mjs` · `src/config/textos.tut.es.js` · `docs/AJILEI_Tutorial_v1.3.md` |
| **2-b** la mesa guiada | `src/App.jsx` · `src/components/GameTable.jsx` · `src/components/GuiaControl.jsx` · `src/screens/Guiada.jsx` · `src/screens/CierreGuiada.jsx` · `src/styles/guiada.css` · `src/screens/Lobby.jsx` · `src/lib/trozos.js` · `src/hooks/useCelebracion.js` · `src/components/CapaSenal.jsx` · `src/components/capaSenalCore.js` · `src/components/capaSenalCore.test.js` · `src/styles/senal.css` · `scripts/testDistSinMoldes.test.js` |
| **2-c** vara, invariantes e informe | `scripts/tut/guiada.mjs` · `scripts/tut/montaCapa.mjs` · `scripts/diagDSK.mjs` · `scripts/arnes/orquestaCore.mjs` · `scripts/arnes/orquesta.test.js` · `docs/AJILEI_Invariantes_v1.0.md` · `docs/reportes/AJILEI_TUT-1_T2_Informe_v1.0.md` · `git rm docs/AJILEI_Tutorial_v1.0.md` · los punteros a la v1.3: `src/components/OfertaGuiada.jsx` · `src/styles/ofertaGuiada.css` · `src/lib/guia.js` · `scripts/testClavesAlmacen.test.js` |
| **2-d** la celebración de AJILEI | `src/styles/celebracion.css` · `src/hooks/useSounds.js` · `src/hooks/useSounds.test.js` · `docs/AJILEI_Victory_Celebration_v1.0.md` |

**Tres movimientos respecto de la ficha §5**, para que cada commit construya y pase sus pruebas solo:

- **`textos.tut.es.js` va en 2-a:** `guiaManos.test.js` comprueba que cada rótulo de los pasos existe.
- **`testDistSinMoldes` va en 2-b:** ahí entra la capa en `dist/`, y con ella `tut-capa` y `data-tut-unico`. Es la regla de la T1: «la tanda que monte cada pieza saca su marca de la lista en el mismo commit».
- **El normativo v1.3 entra en 2-a:** es el primer commit que lo cita (`guiaManos.js`). La v1.0 sale en 2-c, junto con las Invariantes que dejan de citarla.

Los cambios de puntero en archivos de la tanda 1 que además cambian de comportamiento (`CapaSenal.jsx`, `capaSenalCore.js` y `senal.css`, por «Salir») van en 2-b.
