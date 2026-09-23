# AJILEI · APU-1 · Fase 1e — La pantalla: «Retar a las IAS», all-in, recarga, ritmo · Informe v1.0

**Campaña:** APU-1 — Apuestas, pilas y agresividad de las IAS
**Fase:** 1e — Todo lo que se ve. Tres STOP: selección → mesa → limpieza.
**Ficha rectora:** `AJILEI_APU-1_Fase1e_v1.0.md` (2026-09-18)
**Ejecutor:** Claude Code · **Rector:** Claude (chat) · **Decisor:** Victor
**Estado:** **STOP-1** — «Retar a las IAS» escrita, montada y medida (§B.1, §C, §D).
Diez hallazgos en §E, cuatro de ellos defectos reales corregidos en esta tanda.
**Nada commiteado.**

---

## §A · Línea base

### A.1 · De dónde arranca

`main` en `f9ee503` más 1a…1c-2 sin commitear. Lo que 1c-2 dejó, verificado al
entrar en esta fase:

| Vara | Al cerrar 1c-2 | Al abrir 1e |
|---|---|---|
| `vitest` | 818 pruebas, 0 fallos | 818, 0 fallos |
| `npm run lint` | 21 problemas (20 errores, 1 aviso) | 21 |
| `npm run build` | ✓ | ✓ |
| `diagSAL` | 102/102 | 102/102 |
| `git log --oneline -1` | `f9ee503` | `f9ee503` |

### A.2 · Los seis protegidos, al entrar y al cerrar cada STOP

| Archivo | blob al entrar | al cerrar STOP-1 | al cerrar STOP-2 | al cerrar STOP-3 | |
|---|---|---|---|---|---|
| `src/engine/gameEngine.js` | `e4fa160a0acf` | `e4fa160a0acf` | `e4fa160a0acf` | **`21c4d3f56318`** | ABIERTO (4 rangos) |
| `src/engine/aiPlayer.js` | `8cfc3736cba2` | `8cfc3736cba2` | `8cfc3736cba2` | `8cfc3736cba2` | INTACTO |
| `src/engine/deck.js` | `eb61426083ca` | `eb61426083ca` | `eb61426083ca` | `eb61426083ca` | INTACTO |
| `src/config/seatLayouts.js` | `0d1bb8ea66a8` | `0d1bb8ea66a8` | `0d1bb8ea66a8` | `0d1bb8ea66a8` | INTACTO |
| `src/styles/opponentPanel.css` | `3ce6383eec0d` | `3ce6383eec0d` | `3ce6383eec0d` | `3ce6383eec0d` | INTACTO |
| `src/styles/gameTable.css` | `1e21371c8543` | `1e21371c8543` | `1e21371c8543` | `1e21371c8543` | INTACTO |

**Cinco intactos en los tres STOP; el sexto abierto una sola vez, en el último.** La ficha reserva `gameEngine.js` para
1e-iii (E-12 y E-3) y prohíbe abrir las dos hojas en toda la fase. STOP-1 no
necesitó ninguno: el `createInitialState` con lista, que es la pieza de 1e que
toca al motor, **ya existía** — 1b la dejó escrita con su forma numérica marcada
`TRANSITORIO`, y aquella tanda se limitó a dejar de usar la numérica desde la app.

**STOP-2 tampoco**, y tenía tres ocasiones para necesitarlos:

- El **botón All-in** y la **marca del asiento** habrían pedido reglas en
  `gameTable.css` y `opponentPanel.css`. En vez de eso: la marca vive en un hueco
  que la hoja protegida YA reservaba y que ya está fuera de flujo, y todo lo
  demás va en `src/styles/apu.css`, hoja NUEVA que `GameTable.jsx` importa
  DESPUÉS de la suya — el patrón que ya usan `celebracion.css`, `cuenta.css` y
  `tapetes.css`, y que además hace que sus reglas ganen a igualdad de
  especificidad sin un solo `!important`.
- El **enrutado de §4.3** habría pedido exportar `isRoundOver`. En vez de eso,
  `pozos.rondaCerrada` lo REPLICA —igual que `ganadoresPorCapa` replica el
  desempate— y una prueba confronta las dos copias.
- **E-13** sí pide abrir el motor, y por eso NO se tocó en STOP-2: quedó descrito
  con su reproducción para que lo decidiera el rector.

**STOP-3 abre `gameEngine.js`, y sólo él.** El rector autorizó cuatro rangos y la
edición no salió de ellos:

| # | Rango | Por qué |
|---|---|---|
| 1 | `isRoundOver` | **E-13**: se borra el corte `pendientes.length <= 1`, que cerraba la ronda antes de que el último con fichas pudiera responder a un all-in. |
| 2 | La entrada a fase de apuesta | **§4.3 se muda al motor**: nace `abrirApuesta` y las tres puertas que abren `BET_1`, `BET_2` y `BET_3` pasan por ella. Cierra además la ruta 2 de D-12, que desde fuera no tenía salida. |
| 3 | `applyPlayerBetAction` | **E-12**: se retira la traducción `betAmount → k`. |
| 4 | La constante de `createInitialState` | **E-3**: `economy.saldoInicial` → `economy.pilaPruebas`. |

Las dos hojas de estilo cierran la fase entera sin abrirse, que era la otra
prohibición de la ficha.

### A.3 · El estado del que parte la pantalla

Hasta hoy, ir a jugar contra la IA eran **tres decisiones repartidas en dos
pantallas** (`NivelSelect` → `ModeSelect`) y **todos los asientos nacían con
5.000 fichas iguales** (`gameEngine.js:82`, `economy.saldoInicial`). Las piezas
que APU-1 escribió entre 1a y 1c-2 —`entrada.js`, `pozos.js`, la lista de
`createInitialState`, el factor 1,5 de la pila de las IAS— **no tenían un solo
consumidor en la app**. 1e es la tanda que las enchufa.

---

## §B · Lo hecho, por STOP

### B.1 · STOP-1 (1e-i) — «Retar a las IAS» y el flujo de entrada

#### B.1.1 · Los archivos

**Nuevos**

| Archivo | Líneas | Qué es |
|---|---|---|
| `src/screens/RetarIAS.jsx` | 259 | La pantalla. Cáscara: pinta lo que decide `retarCore`. |
| `src/screens/retarCore.js` | 222 | Núcleo PURO: cascada, alcance, entradas, validación. |
| `src/components/PantallaChips.jsx` | 126 | K-3a · la carcasa compartida con `ArmarMesa`. |
| `src/components/FilaChips.jsx` | 84 | K-3a · la fila de chips con su aviso reservado. |
| `src/config/memoriaChips.js` | 105 | **La política de memoria**, parametrizada. |
| `src/dev/siembraAPU.js` | 45 | `?apu=saldo:<n>`, molde de `siembraCEL`. |
| `scripts/rutaMesa.mjs` | 84 | La ruta a la mesa, en UN sitio para todos los arneses. |
| `scripts/testRetarIAS.test.js` | 344 | 43 pruebas. |

**Tocados**

| Archivo | Qué cambió |
|---|---|
| `src/App.jsx` | `screen` `'retar-ias'`; `mesa` y `saldoSesion`; `GameTable` con la mesa entera; `onLeave(fichas)`. |
| `src/components/GameTable.jsx` | `entrada` por prop; la mesa se crea con la LISTA; las cuatro salidas pasan por `salir()`. |
| `src/screens/ArmarMesa.jsx` | Monta `PantallaChips` + dos `FilaChips`. 362 → 299 líneas. |
| `src/config/salaRecordada.js` | Deja de tener código propio: declara la política del PvP. 84 → 66 líneas. |
| `src/screens/Lobby.jsx` | El saldo entra por prop y se mueve dentro de la sesión. |
| `src/config/textos.es.js` | 23 claves `ia.*`. |
| `src/config/textos.test.js` | El prefijo `ia.` y dos pares declarados. |
| `src/config/ajileiConfig.js` | `STAKE_OPTIONS` retirada. |
| `src/styles/salas.css` | §15 · `.es-retar`, el contador y el CTA que dice tres cifras. |
| `scripts/diagDSK.mjs` | Ruta nueva, `--entrada`, modo `retar`, `lob.7` recableado. |
| `scripts/diagCEL0.mjs` | Ruta nueva en sus dos caminos y en la salida de la victoria. |
| `src/engine/entrada.js` | `jugadoresVsIA` bautiza los asientos (§E-7). |
| `scripts/testEntrada.test.js` | Dos pruebas del bautizo; 13 → 15. |
| `.gitignore` | `capturas-retar/`. |

**Retirados** (§2.3): `NivelSelect.jsx`, `ModeSelect.jsx`, `TableSelect.jsx`,
`useNivel.js` y las tres hojas `nivelSelect.css`, `modeSelect.css`,
`tableSelect.css`. Ninguno tenía pruebas propias. `STAKE_OPTIONS` se va con
`TableSelect`, que era su último lector; su única mención viva es el comentario
de `salas.js:33`, que la nombra para decir que las del PvP **no** son ésas.

#### B.1.2 · La política de memoria, y por qué salió de la carcasa

§2.1 describe `memoria` como un campo del contrato de `PantallaChips`. **No puede
vivir ahí**, y la razón es mecánica: quien decide CUÁNDO se guarda es la pantalla
—en `ArmarMesa`, con la respuesta del servidor ya en la mano, que es una espera
asíncrona— y la carcasa sólo renderiza. Un `memoria` colgado de ella habría sido
un parámetro que nadie llega a leer.

Lo que L-6 quiere compartido —la política— se comparte **entero**, en
`config/memoriaChips.js`: los dos `try/catch`, el `JSON.parse` defensivo, la
proyección de campos y la migración de la clave vieja. Las dos pantallas declaran
la suya en una línea, y ahí es donde se ve la única diferencia real entre ellas:

```
PvP    → ['jugadores', 'apuesta', 'tipo']     las tres decisiones
vs IA  → ['reto', 'jugadores', 'apuesta']     y JAMÁS la entrada
```

`ajilei.nivel` se absorbe en `ajilei.retoConfig` la primera vez que se lee y se
borra en el mismo gesto: dos claves para el mismo dato dejan una que no se
actualiza nunca.

El almacén entra **por parámetro** (molde de `leerConfig(saldo)`), y eso es lo que
permite que Vitest lo selle sin jsdom, que este proyecto no tiene (FRZ-1).

#### B.1.3 · La cuarta decisión

`Mínimo 5×` · `Medio 15×` · `Techo 50×` · `Otra…`, sin preselección, con los
montos derivados de `entrada.js` y nunca escritos a mano. Lo que la pantalla añade
sobre `entradaValida` es el **bolsillo**, que el motor no puede juzgar porque no
lo conoce: `MOTIVO_SIN_SALDO` nace en `retarCore`, no en `entrada.js`.

El aviso reservado promete **con cuánto se sienta cada IA**, y esa cifra sale de
`entrada.pilaIA` —el factor 1,5 que 1c-2 selló— en vez de una copia de la fórmula.
Es la primera vez que una decisión de APU-1 se le enseña al jugador antes de
pulsar.

#### B.1.4 · El saldo de la sesión

`saldoSesion` vive en `App` porque tiene que sobrevivir a que la pantalla se
desmonte: el viaje es lobby → retar → mesa → resultado → lobby y es lo único que
cruza los cuatro. Baja al sentarse (`onRetar`) y sube con lo que el humano se
levanta (`onLeave(human.chips)`). Al recargar la página vuelve a la constante,
que es lo honesto hasta que exista el ledger (ECO-1).

---

### B.2 · STOP-2 (1e-ii) — la mesa: all-in, ritmo, recarga y capas

1e-i puso al jugador delante de la decisión de con cuánto se sienta. 1e-ii es lo
que pasa **después**: la mesa donde esa entrada se gasta, se defiende y —si él
quiere— se recarga. Es la tanda que convierte a APU-1 de una pantalla en un
juego de economía.

Los dos sellos de STOP-1 van primero, porque el rector pidió aplicarlos antes de
empezar la mesa.

#### Los dos sellos, aplicados

**E-6.** `retarCore.elegir` dejó de barrer hacia abajo sin excepciones. Lo que
se limpia al tocar una fila ya no es «todo lo de debajo» sino lo que **depende**
de ella, escrito como dato en un mapa `DEPENDEN` para que la excepción se vea en
vez de esconderse dentro de un `if`. Cambiar de reto limpia apuesta y entrada
—la apuesta sale de `apuestasDe(reto)` y la entrada de la apuesta— y conserva el
tamaño de mesa. Curiosear los tres retos ya no cuesta volver a elegir mesa.
Sellado con dos pruebas (una de ellas, ir y volver entre dos retos) y medido en
vivo: `retar.2` registra ahora `jug: 1, jugEtiqueta: "4"` tras el cambio de reto,
con la fila de apuesta viva pero sin elegir.

**E-8.** La columna se aprieta y no se ensancha. No hacía falta código —la
lámina ya era `width: var(--col)`, la misma de «Armar una mesa»— así que lo que
cambió fue el comentario de `salas.css §15`, que dejaba la pregunta abierta y
ahora deja escrita la decisión y su motivo: una columna que se parte en dos
según el viewport son dos pantallas que el jugador tiene que reconocer como una.

#### §3.1 · Los botones dejan de ser una copia de la legalidad

Aquí vivían `canPass`, `canBet`, `canCall` y `canRaise`: cuatro condiciones
escritas a mano con la aritmética del motor copiada dentro (`playerChips >=
toCall`, `playerChips >= (raiseTo - human.contrib)`). Es literalmente el riesgo
R-5 del diagnóstico, y lo que lo cierra no es escribirlas mejor sino **dejar de
escribirlas**: `mesaCore.filaAcciones` pregunta a `pozos.esLegal`, que es el
mismo árbitro que el motor consulta antes de aplicar y que la IA consulta antes
de decidir. La fila de botones y lo que la mesa acepta no pueden divergir.

**El botón All-in sale de ahí sin una condición nueva, y ésa es la parte que
importa.** §4.1 hace el all-in defensivo —existe sólo cuando hay apuesta viva y
la pila no la cubre— y en ese mismo estado `igualar` se rechaza con
`no_alcanza`. Los dos son EXCLUYENTES por construcción: la pantalla no decide
cuál enseña, enseña el que existe. Una prueba lo barre sobre ocho pilas
distintas para que la propiedad no dependa de que nadie la rompa.

Donde antes no había botón de pago y al jugador sólo le quedaba retirarse
—perdiendo lo que ya había puesto, que es el defecto que APU-1 vino a corregir—
ahora hay **All-in (N)**, con N la pila entera. El monto va escrito porque es la
única acción de la mesa que no se puede deshacer ni dosificar.

De paso, el gris de los multiplicadores dejó de mentir: `val > playerChips`
preguntaba si la pila cubre el MONTO, y el monto no es lo que cuesta —subir
cuesta la diferencia con lo ya puesto—, así que un ×10 perfectamente pagable
salía apagado. Ahora se le pregunta a la acción que ese multiplicador va a
servir.

#### §3.2 · La marca ALL-IN, medida antes de escribirse

El rector pidió medir primero, y eso se hizo: **«ALL-IN» ocupa 69,56 px y el
hueco más estrecho de `.opp-status` son 151** (mesas 4 y 5 a 1024, 1280 y 1366;
726 px por la vía `.ai-zone` de la mesa de 2). Una línea, sin recorte, en las
cuatro mesas y los cuatro viewports — y **más corta que «Descartó 4»** (108 px),
que ya vivía en esa ranura. No hicieron falta ni «ALL IN» ni «A-I», y
`opponentPanel.css` no se abrió.

La marca va en el hueco que C4.3.1 ya reservaba y que §H5 saca de flujo con
`position: absolute`: diga lo que diga, no mueve un píxel — y `diagDSK o1` lo
confirma en sus dieciséis celdas. El orden dentro de la ranura es retirado →
all-in → turno → última acción: un all-in no recibe turno nunca más en esa mano,
así que la ranura es suya hasta que la mano acabe, y tiene que serlo, porque es
la única señal de que ese asiento sigue disputando su capa aunque no vuelva a
hablar.

**El humano también va marcado, y su marca no es un badge: es una línea.** Un
rival en all-in se reconoce por su ranura de estado; el humano no tiene ranura,
tiene la fila de botones — y en all-in la fila está vacía. Sin esto veía «La IA
está pensando…» y ninguna explicación de por qué a él no le toca. Ahora lee
«Estás all-in — tus cartas siguen jugando», en el mismo hueco del «pensando» al
que releva: ni una caja más.

#### §3.3 · El ritmo, por peso de la decisión

`decidirIA` devuelve `{action, k, peso}` desde 1c y el `peso` no había tenido
nunca un consumidor. Hasta hoy toda acción de IA esperaba 1.125 ms pasara lo que
pasara: una IA que pasa y una IA que empuja su pila entera tardaban igual, y eso
le quitaba a la mesa la única señal de tensión que no cuesta un píxel.

Ahora son 700 · 1.125 · 1.700 ms por peso, en `ui.ritmoIA` — en `ui` y no en
`ia` porque es puesta en escena y no regla de juego: no entra al motor, no
cambia una decisión y el banco no lo lee. El valor de en medio es el de siempre,
para que la mesa corriente suene igual que en las tandas que la calibraron.

**Se decide antes y se aplica después, y el orden no es un detalle.** Para saber
cuánto esperar hay que saber qué va a hacer, y la decisión de la IA consume
azar: llamar a `decidirIA` para medir el peso y luego a `applyAIBetAction` —que
vuelve a decidir por dentro— gastaría dos tiradas y podría aplicar una acción
distinta de la que se cronometró. Así se consume exactamente una, la misma que
antes.

#### §3.4 · Las rondas que no hay que abrir

Dos estados que hasta 1e nadie podía observar, porque todos los asientos nacían
con 5.000 fichas y el ante era 50. Con las entradas de APU-1 la profundidad es
un múltiplo de la apuesta y los dos dejan de ser curiosidades:

**§4.3 · queda un solo asiento con fichas.** El normativo dice que las rondas
restantes «no existen». Sin esto, ese asiento recibe turno y tiene que pulsar
«Pasar» para decir que no puede hacer nada, con los veinte segundos del reloj
corriendo y el resto de la mesa en all-in mirándolo. Ahora la pantalla pasa por
él, sin retardo y sin ruido —el mismo trato que el salto del asiento retirado— y
el motor, al ver la ronda cerrada, avanza de fase solo.

**D-12 · no queda ninguno.** El hueco que 1d dejó abierto y no pudo cerrar.
Resultó tener **dos rutas, y sólo una existe**: está medido en E-12 y E-13. La
que existe —el ante que deja a todos en cero a la vez— se cierra desde la
pantalla mirando ANTES de repartir (`anteDejaAMudos`) y convirtiendo la recarga
en forzosa. La otra no es alcanzable, y averiguarlo destapó un defecto del motor
que sí lo es.

La pregunta vive en `pozos.rondaCerrada`, que REPLICA a propósito el
`isRoundOver` privado del motor —mismo trato que el desempate de
`ganadoresPorCapa`— para no atar un módulo puro a un protegido. Que sean dos
copias de la misma regla es deuda real y se paga con la prueba que las confronta
sobre los mismos estados.

#### §3.5 · La recarga entre manos

El otro lado de la moneda de APU-1: si la entrada es lo que arriesgas, la
recarga es el segundo round. Releva al modal de bancarrota con sus dos
«Próximamente», que es la superficie que §5.4 señala.

Las tres formas salen de UNA función pura, `pideRecarga`, que mira la fase, la
pila, el techo de la mesa y el bolsillo. La pantalla no vuelve a decidir nada:

- **voluntaria** — un botón discreto al lado de «Siguiente mano». Discreto a
  propósito: es una salida que está ahí cuando se la busca, no una invitación a
  gastar.
- **automática** — bajo el listón de §5.1 (`pila < 5 × apuesta`), diez segundos
  y «No» por defecto.
- **forzosa** — o el humano no cubre el ante (§5.4), o el ante dejaría a todos
  mudos (D-12). Son el mismo hecho contado dos veces: la mesa no puede continuar
  como un juego de decisiones. Rechazarla termina la mesa, y las fichas vuelven
  al bolsillo por §2.5, así que no cuesta más que la mano que no se jugó.

Sin bolsillo no hay pregunta: una pregunta cuya única respuesta posible es «No»
no es una pregunta, es un reproche.

**Un límite declarado:** la voluntaria se ofrece al cerrar cada mano, no antes de
la primera. §5.1 dice «entre manos, cuando quiera» y `WAITING` técnicamente lo
es, pero ahí el jugador acaba de elegir su entrada dos pantallas atrás: reabrirle
esa decisión antes de repartir una sola carta sería pedirle que se corrija sin
haber visto nada. La única que SÍ sale en `WAITING` es la forzosa, que no es una
oferta sino un hecho —con esas fichas no se puede repartir—.

Los tres montos tienen la misma forma que los de la entrada —§5.2 dice que la
recarga «se elige como una entrada»— y son literalmente las mismas cifras de
`entrada.js`. Se apagan en vez de esconderse, que es E-2 otra vez. «Al techo» es
el único que no es una cifra fija: es lo que falta para llenar la mesa.

**§5.3 se dice antes de pulsar, no después.** Recargar sube también a las IAS
vivas, y descubrirlo al volver a la mesa sería una trampa: es parte de lo que se
está decidiendo. El nivelado va asiento por asiento por `aplicarRecarga`, que
sube la pila y la `entrada` a la vez — y eso es lo que hace que la cuenta final
siga siendo honesta: lo recargado es dinero PUESTO, no ganado.

La quinta condición del gate está puesta: mientras la pregunta esté abierta,
«Siguiente mano» no existe — y la caja de ese botón se RESERVA mientras tanto,
porque quitarla movía la barra del jugador entera justo cuando el dedo va hacia
los botones del panel. Es O1 aplicado a un caso nuevo de una regla que ya
cubría el barajado y la ceremonia de eliminación. Y la pregunta **no tapa la mano** salvo cuando es
forzosa; ese arreglo lo pidió el arnés y está en E-14.

#### §3.6 · Las capas, y la cuenta contra la entrada

`fichasNetas` se mide contra la **entrada** y ya no contra los 5.000 de
`economy.saldoInicial`. Esa resta había pasado a mentir en las dos direcciones:
quien entra con 750 y se levanta con 900 había «perdido 4.100». El segundo
argumento es opcional y cae a la constante vieja a propósito, porque las mesas
del banco y las pruebas del motor siguen naciendo por la forma numérica de
`createInitialState`, donde todos se sientan con `saldoInicial` y las dos varas
dan lo mismo.

Cuando el pozo se parte en capas de distinto dueño, el óvalo lo dice: «El pozo
se partió: IA 1 se lleva 300.» Se cuenta sólo lo que el resultado NO dice ya —la
capa del ganador principal la nombra él— y la capa que no gana nadie se anuncia
por lo que es: dinero que vuelve sin igualar (D-7). Sin esa frase, el jugador
vería su saldo subir menos de lo que el mensaje promete y sin forma de saber por
qué.

La salida de la mesa (§2.5) ya devolvía las fichas al saldo de sesión desde
1e-i, por las cuatro vías: la ✕, el fin de mesa, el modal de bancarrota y la
pantalla de victoria.

#### §3.7 · El molde `?apu` y el modo `apu`

Seis moldes, con la misma doble puerta que `siembraCEL` —`import.meta.env.DEV` y
la presencia del parámetro—, verificados ausentes de `dist/`.

**Los moldes no inventan estados, siembran pilas.** Ésa es la disciplina que los
hace fiables: aquí no se fabrica un estado a mitad de mano con `allIn` puesto a
mano. Lo único que se cambia son las fichas con que un asiento se sienta, y el
resto lo hace el motor por su propia regla — quien se sienta con la apuesta
justa la pone entera en el ante y `startHand` lo marca `allIn` él solo. Lo que
se fotografía es la mesa de verdad, montada por el camino de verdad.

---

### B.3 · STOP-3 (1e-iii) — el motor, la re-medición y la limpieza

Los dos STOP anteriores no abrieron un solo protegido. Éste abre uno, y sólo
uno: `gameEngine.js`, en cuatro rangos que la ficha nombró de antemano. Todo lo
demás de la tanda es medir con el motor final y recoger lo que 1e fue dejando
marcado por el camino.

#### A-1 · E-13: el all-in vuelve a ser una pregunta

`isRoundOver` cortaba así:

```js
const pend = pendientes(players)
if (pend.length <= 1) return true
```

La línea llevaba encima la etiqueta de §4.3, y era una mala lectura del
normativo: §4.3 habla de las rondas **restantes**, no de la que se está jugando.
Lo que el corte hacía de verdad era **cerrar la ronda en cuanto el penúltimo
asiento con fichas se marcaba all-in** — y el último se quedaba con su pila
entera sin haber dicho si pagaba. Nadie perdía dinero (lo no igualado vuelve por
D-7), pero un all-in es exactamente la jugada que existe para forzar esa
decisión, y el motor la estaba deshaciendo.

Se borra. La línea de abajo cubre el caso legítimo —un único pendiente que YA
actuó e igualó— y también la lista vacía, porque `every` sobre `[]` es `true`.
Lo único que el corte añadía era saltarse al pendiente que todavía no había
hablado.

**Las tres salidas del rival están medidas una por una** contra el motor de
verdad: paga (la ronda cierra y queda UNA capa, los dos elegibles), no cubre
(all-in defensivo de §4.1, dos capas, y lo no igualado vuelve por D-7), se
retira (el pozo entero para quien empujó). Y la reproducción original de E-13
sigue en su sitio con el veredicto cambiado: `phase` sigue en `BET_1`, el turno
pasa al rival, `acted` es `false` y su fila trae `igualar`.

#### A-2 · §4.3 se muda al motor, y de paso cierra la ruta 2 de D-12

1e-ii cumplía §4.3 desde la pantalla: un efecto pulsaba «pasar» por el único
asiento con fichas para que el motor viera la ronda cerrada. Funcionaba, y aun
así estaba en el sitio equivocado — **el normativo no dice que esas rondas se
pasen: dice que NO EXISTEN, y existir o no existir es cosa del motor.**

Y había un caso que desde fuera no se podía tocar: si no queda NADIE con fichas
(todos all-in en `BET_1`, la ruta 2 de D-12), no hay quien pulse nada, no hay
acción legal que aplicar y `advanceBettingPhase` es privada. La pantalla podía
mirar el abismo y no evitarlo.

Nace `abrirApuesta`, y las tres puertas que abren una fase de apuesta
—`advanceFromDeal` hacia `BET_1` y hacia `BET_2`, `applyDiscard` hacia `BET_3`—
pasan por ella. Si al entrar no queda más de un asiento que pueda poner una
ficha, la fase **no se abre**: se salta exactamente como si todos hubieran
pasado, que es la misma transición de siempre con su reset de ronda y su
reparto. **El descarte y el showdown no se saltan nunca**: el asiento en all-in
descarta igual (§4.4) y sus cartas siguen jugando por sus capas.

Con eso, las dos rutas de D-12 quedan cerradas por dos puertas distintas: la
ruta 1 —el ante que deja a todos en cero— la sigue evitando la pantalla ANTES de
repartir (`anteDejaAMudos` → recarga forzosa), y el motor es su red por si
alguna vez se llegara ahí por otro camino.

En la pantalla se **retira** el auto-«pasar» y su guarda en el efecto de la IA.
Queda el vigía: `data-clavada`, que tiene que valer `0` siempre y que el arnés
mira en cada mano que juega.

`pozos.rondaCerrada` se reescribe a la vez, porque es la copia pública del
`isRoundOver` privado. Que sean dos copias de la misma regla es deuda real, y en
esta tanda esa deuda se cobró el sueldo: **la prueba que las confronta es lo
único que demuestra que las dos ediciones dicen lo mismo.** Son siete escenas
—incluidas las dos formas de E-13— donde se compara el veredicto del motor,
leído por donde se puede leer (si la ronda cerró, avanza de fase), con el de la
copia sobre el estado que le queda; y para que la comparación no sea vacía, ese
estado se ancla campo por campo contra el que el motor devuelve cuando no
avanza.

#### A-3 · El ritmo deja de ser un metrónomo

`ui.ritmoIA` pasa de tres cifras a tres **bandas**: `leve [700, 1000]`, `media
[1000, 1500]`, `grande [1500, 2200]`, y `ritmoDe` devuelve un uniforme dentro de
la suya. La razón se oye antes de explicarse: tres valores exactos son un
metrónomo, y la misma espera al milisegundo mano tras mano delata que detrás hay
una tabla y no alguien pensando. La banda de en medio sigue conteniendo los
1.125 ms de siempre, y el azar es de pantalla —`Math.random`, que el motor no
ve—, así que ni una decisión ni una siembra del banco cambian por esto.

#### La propiedad, sobre manos sembradas

Las pruebas de arriba fijan casos. Lo que dice que no hay un caso sin fijar son
**8.000 manos jugadas con el motor** —2.000 por tamaño de mesa— en Pro y con la
entrada al piso, que es la profundidad más corta que §2.2 permite y donde más
all-ins hay. Con el mazo y la IA sembrados, se vigila en cada mano que ninguna
fase de apuesta se ABRA con uno o ningún asiento capaz de hablar, que la mesa no
se clave en ningún instante, que ninguna mano se cuelgue ni llegue al pago sin
ganador, y que el dinero se conserve entero entre manos. Cuatro celdas, cero
incidencias, y con all-ins en más del 5 % de las manos para que la vigilancia no
esté mirando un caso que nunca ocurre.

**Las IAS deciden solas; el asiento 0 no puede.** `decideBetAction` reparte
temperamentos a los asientos de IA y el 0 no tiene ninguno —el banco lo resuelve
con un estado espejo—, así que aquí el humano lo lleva un conductor propio que
elige al azar entre sus acciones legales y no se retira mientras le quede otra
cosa que hacer. No es una estrategia y no pretende serlo: para lo que se está
midiendo es mejor que una, porque recorre estados que ninguna IA sensata
visitaría.

#### C · La limpieza

- **E-12 · `applyPlayerBetAction` deja de traducir.** La firma pasa de
  `(state, action, betAmount)` a `(state, action, k)`. La traducción existía
  porque la pantalla hablaba en fichas y el motor en multiplicadores; desde 1e la
  pantalla ya elige un `k` para preguntarle a `mesaCore.filaAcciones` si la
  acción es legal, y multiplicarlo por la apuesta sólo para que el motor volviera
  a dividirlo no compraba nada y era una ocasión de redondear mal. **Lo que se
  aplica es ahora, literalmente, el mismo `k` con el que se consultó la
  legalidad.** El monto sigue donde tiene sentido: en el botón, que dice cuánto
  cuesta. Las dos pruebas que sellaban la traducción cambian de veredicto.
- **E-3 · `economy.saldoInicial` se parte en dos, que es lo que D-5 de 1a pedía.**
  La constante era a la vez las fichas con que nacía todo asiento y el saldo del
  jugador, y ésa es justo la confusión que APU-1 vino a deshacer — por eso
  «retirarla» dejaba al saldo real sin fuente. Ahora son dos cosas con dos
  nombres: `economy.pilaPruebas`, la pila igual para todos que usan el banco y
  las pruebas del motor (donde se mide el cerebro y no el bolsillo, y unas pilas
  iguales son lo que hace honesta la comparación), y `SALDO_PROVISIONAL` dentro
  de `lib/saldo.js`, que es el bolsillo y **el único sitio que ECO-1 tendrá que
  tocar**. `grep saldoInicial src/ scripts/` no devuelve un solo lector vivo.
- **`TRANSITORIO` a cero en `src/`.** Las dos que quedaban eran de este motor: la
  forma numérica de `createInitialState` deja de anunciarse como provisional
  —porque no lo es, no espera a que nadie la retire— y el puente ya retirado de
  1c se nombra por lo que fue.
- **`Modos_y_Asistencia_v1.1 §9`**, las dos líneas que D-3 de 1a dejó apuntando a
  cosas que ya no eran ciertas: la errata e1 de §3.3 y la lista de protegidos,
  que son **seis** y no cinco desde `Protegidos` v1.4.
- **`Protegidos §3` re-medido entero**, blob, `sha256` y líneas, contra el árbol
  final. Con ello se resuelve y se retira el aviso ⚠ que 1a había levantado: el
  `sha256` de `gameTable.css` —el único de los tres marcados cuyo contenido no ha
  cambiado desde el sellado— mide hoy exactamente lo que 1a midió en vivo y
  distinto de lo transcrito. Era un error de transcripción, como 1a concluyó, y
  ahora está corregido midiendo en vez de copiando.

---

## §C · Pruebas

`npx vitest run` → **31 archivos · 863 pruebas · 0 fallos**, contra las 818 con
que 1c-2 cerró: 43 de `testRetarIAS` y 2 de `testEntrada` (el bautizo de los
asientos, §E-7).

`scripts/testRetarIAS.test.js`, seis bloques:

| Bloque | Qué sella |
|---|---|
| 1 · La política de memoria | `proyectar`; PvP recuerda tres, vs IA recuerda tres y **nunca** `entrada`; la migración de `ajilei.nivel`; basura y almacén denegado. |
| 2 · Lo guardado, por sus guardas | El reto cae a Básico; una apuesta de Pro no sobrevive a un reto que cayó; una apuesta fuera del bolsillo no se preselecciona. |
| 3 · La cascada | Los cuatro sentidos del relevo, en los dos sentidos. **Reescrito en STOP-2 por el sello de E-6:** cambiar el reto limpia apuesta y entrada y CONSERVA los jugadores, e ir y volver entre dos retos deja la mesa donde estaba. |
| 4 · Las filas como datos | Comodín en 4 y 5; el gris se decide por el **piso**, no por la apuesta; el techo de sesión cuantizado; el contador acotado. |
| 5 · La entrada validada | Los tres motivos de `entrada.js` más `sin_saldo`, y el orden entre ellos. |
| 6 · La promesa del aviso | `pilaDeCadaIA` = `pilaIA`; el ejemplo del normativo §2.3. |

**STOP-2** suma `scripts/testMesaAPU1.test.js` —**50 pruebas**— y una más en
`testRetarIAS` (la cascada de E-6 pasa a dos pruebas: el cambio de reto y la ida
y vuelta entre dos retos), para un total de **32 archivos · 914 pruebas · 0
fallos**. Siete bloques:

| Bloque | Qué sella |
|---|---|
| 1 · La fila de acciones | Que sale de `pozos.esLegal` y no de una copia suya; que **igualar y all-in son excluyentes en ocho pilas distintas**; que el all-in cuesta la pila entera; que fuera de turno, fuera de fase, retirado o ya en all-in la fila está vacía; que el gris del multiplicador mira el COSTO y no el monto. |
| 2 · El ritmo | Tres pesos, tres compases; «media» conserva los 1.125 ms de antes de 1e; un peso desconocido cae a «media» y nunca a `undefined`. |
| 3 · Rondas mudas | §4.3 con un solo asiento con fichas, y que el motor acepta su «pasar» y avanza; **las dos rutas de D-12, contra el motor de verdad** (E-12); `anteDejaAMudos` y su frontera. |
| 4 · La marca de all-in | A quién marca y a quién no: ni al retirado ni al eliminado. |
| 5 · La recarga | El listón de §5.1; el tope por techo Y por bolsillo; las cuatro validaciones de §5.2; los tres montos que se apagan y no desaparecen; **cuál de las tres preguntas toca en once estados**; el nivelado hacia arriba de §5.3, el techo, las eliminadas; y que `aplicarRecarga` sube pila y entrada a la vez, así que las netas no mienten. |
| 6 · Las capas | Que la suma cuadra con el pote; que cada capa tiene su ganador y no tienen por qué ser el mismo; que con una sola capa no se dice nada; **que la capa sin elegibles se anuncia como dinero que vuelve** (D-7). |
| 7 · El molde `?apu` | Por su PROMESA y no por su URL —`siembraMesaAPU` lee `window.location`, que sin jsdom no existe—: que las pilas que siembra producen los estados que promete, con el motor haciendo el resto. |

**STOP-3** no añade un archivo de pruebas: reescribe dos bloques de
`testMesaAPU1` y toca los tres sitios del motor que compraban el comportamiento
viejo, para un total de **32 archivos · 933 pruebas · 0 fallos** (19 más que
STOP-2; `testMesaAPU1` pasa de 50 a 69).

| Bloque | Qué sella |
|---|---|
| 2 · El ritmo, **reescrito** | Que cada peso cae dentro de su BANDA en doscientas muestras; que las bandas no se solapan; que la de en medio sigue conteniendo los 1.125 ms de antes de 1e; **que doscientas muestras no dan un solo valor** —o sea que no es un metrónomo—; y que un peso desconocido cae a «media» y nunca a `undefined`. |
| 3 · **E-13**, nuevo | Que tras el all-in la ronda SIGUE ABIERTA, el turno pasa al rival y su fila trae `igualar`; y las **tres salidas** del rival medidas una por una: paga (una capa, los dos elegibles), no cubre (all-in defensivo, dos capas, D-7), se retira (el pozo entero para quien empujó). |
| 3b · §4.3 desde el motor, **nuevo** | Todos all-in por el ante en mesa 3, y la mano corre sola hasta el showdown con cada asiento descartando; todos all-in apostando en `BET_1` en mesas 2 y 4, y `BET_2` y `BET_3` no nacen; un solo asiento con fichas tras `BET_1`, y las fases siguientes se saltan sin que él diga nada ni ponga una ficha. Más `anteDejaAMudos`, que sigue cerrando la ruta 1 de D-12 desde la pantalla. |
| 3c · La confrontación, **ampliada** | Siete escenas donde el veredicto de `pozos.rondaCerrada` se compara con el del motor, **incluidas las dos formas de E-13**, y con el estado juzgado anclado campo por campo contra el que el motor devuelve cuando no avanza. Es lo único que demuestra que las dos copias de la regla siguen diciendo lo mismo después de editarse a la vez. |
| 3d · La propiedad, **nuevo** | **8.000 manos** con el motor —2.000 por tamaño de mesa— en Pro y entrada al piso, con mazo e IA sembrados: ninguna fase de apuesta se abre sin con quién jugarla, ninguna mesa se clava, ninguna mano se cuelga ni llega al pago sin ganador, y el dinero se conserva entero. Con all-ins en más del 5 % de las manos, para que la vigilancia no esté mirando un caso que nunca ocurre. |

Y tres pruebas del motor **cambian de veredicto**, que es la señal de que la
edición se nota: las dos que sellaban la traducción `betAmount → k` (E-12) y las
tres de `testMotorAPU1 §4.3` que compraban que la ronda siguiente se ABRÍA para
un solo asiento. Ahora sellan que no se abre.

`npm run lint` → **21 problemas (20 errores, 1 aviso)**, Δ = 0 en los tres STOP —
y el camino hasta ese 21 es §E-11, que es el hallazgo más barato de esta tanda y
el que más cerca estuvo de pasar desapercibido.
`npm run build` → ✓, `index.js` 629,87 kB / gzip 183,88, con **cero residuo** del
molde `?apu` en `dist/`.

---

## §D · Arnés

### D.1 · `diagSAL` — la prueba de que la extracción fue neutra

**102/102 celdas, salida 0.** Es la vara que §2.1 pide y la única que puede
darla: `ArmarMesa` pasó de marcado propio a montar `PantallaChips` + dos
`FilaChips`, y sus tres estados (`armar`, `armar-aviso`, `armar-unirme`) siguen
midiendo lo mismo en los seis viewports **sin cambiar una línea del arnés**.
Cuentas de chips, apagados por la regla 5×, el CTA que cambia de nombre, los dos
avisos con su caja reservada: todo idéntico.

### D.2 · `diagDSK retar` — el modo nuevo

**6/6 celdas** en los seis viewports de la familia (los de `lob` y los de
`diagSAL`; son seis y no cuatro porque comparar «Retar a las IAS» contra otra
lista haría incomparables las capturas de las tres pantallas hermanas).

| Punto | Qué mide |
|---|---|
| `retar.1` | Las cuatro filas con 3 · 4 · 4 · 4 chips, y las dos de abajo **apagadas** al nacer. |
| `retar.2` | La cascada en los dos sentidos: elegir habilita hacia abajo, cambiar arriba limpia lo que depende. **Ajustado en STOP-2 (E-6):** tras cambiar el reto comprueba que el chip de jugadores sigue marcado Y que dice «4», que la fila de apuesta sigue viva pero sin elegir, y que la de entrada vuelve a apagarse. |
| `retar.3` | El CTA apagado hasta las cuatro; encendido nombra 4 IAS · 200 · 3.000, y el aviso promete 4.500 por IA. |
| `retar.4` | El gris por saldo con `?apu=saldo:2400`: dos mesas de Pro apagadas y el aviso nombrando 3.000. |
| `retar.5` | El contador: abre en el piso (1.000), sube de apuesta en apuesta (1.400), no baja del piso — y la columna sigue cabiendo con él abierto (§E-8). |
| `retar.6` | Nada desborda a lo ancho; el CTA cabe o se alcanza; chips ≥ 40 px; cero `⟦`. |

La geometría se toma **dos veces** por celda —en reposo y con el contador
abierto— porque tomarla una sola vez fue lo que dejó pasar §E-8.

El modo es el primero de `diagDSK` que escucha `console` y no sólo `pageerror`.
Las dos voces ajenas que aparecieron al encenderlo se filtran **por nombre** y se
cuentan aparte en `consolaConocida` (§E-4), nunca en bloque.

18 capturas en `capturas-retar/` (base · gris · contador, × seis viewports),
ignoradas por git con el mismo criterio que `capturas-lob` y `capturas-sal`.

### D.3 · `diagDSK msg` — la voz de la mesa, con el paso de entrada

**VERDE.** `compositor OK (92 casos) · jugado 7/7 · fin 1/1 · Δ larga 7/7 · caza 2/2`.

21 manos jugadas de verdad, 20 re-derivadas desde las cartas leídas del showdown
y 1 ganada por retiros; cruce con el evaluador **20/20**; la condición AJILEI
ejercitada 2/2 (el natural en T2 y el falso 51 en T5).

Llegar a este verde costó **tres corridas** y dos arreglos del arnés, ninguno del
producto: §E-9 cuenta por qué.

### D.4 · Lo demás

| Modo | Resultado |
|---|---|
| `diagDSK lob` | 6/6 celdas, 54 puntos, cero `false`. `lob.7` recableado a la fila de retos. |
| `diagDSK o1` | **16/16** `passed`, cero `false`. En STOP-2 es además la prueba de que la marca ALL-IN no mueve un píxel: vive en un hueco que ya estaba reservado y fuera de flujo. |
| `diagCEL0 celebracion` | Reparado en STOP-2: comparaba el saldo de la tarjeta contra la constante de 5.000, que dejó de ser la vara cuando `fichasNetas` pasó a medirse contra la entrada. Ahora la DERIVA de la ruta que el propio arnés recorre (`5 × apuestasDe('basico')[0]` = 250), así que sobrevive al próximo cambio de mesa. Queda un rojo suyo que **no es de APU-1**: un desajuste de 133 ms entre el plazo del conteo del saldo y el doble de la constante de CEL-2c. |
| `bancoNiveles --bandas` | Ver **E-17**: verde en los tres conductores deterministas y en los tres retos; el conductor `aleatorio` da rojo al azar contra su propia vara. Los tres archivos que el banco lee y que deciden están intactos al blob. |

### D.5 · `diagDSK apu` — la mesa con dinero de verdad (STOP-2)

Modo nuevo, cuatro viewports de escritorio (1024×768 · 1280×720 · 1366×768 ·
1920×937), **4/4 celdas en DOS corridas consecutivas** y **20 capturas** en
`capturas-apu/`. Las dos corridas no son adorno: `apu.5` salía verde el 75 % de
las veces antes de la corrección de E-16, y un punto de arnés con esa tasa no
distingue un verde de una casualidad. Seis puntos:

| Punto | Qué mide | Molde |
|---|---|---|
| `apu.1` | La marca **ALL-IN** en el asiento: que existe, que cabe en una línea, que no se recorta y que el ancho del texto es menor que el hueco. | `?apu=allinIA`, mesa 4 (vía `opp-panel`, la del hueco estrecho) |
| `apu.2` | El **botón All-in EN EL SITIO de «Igualar»**: que aparece, que `igualar` NO aparece con él, que su texto es `All-in (N)`, que cabe en la ventana y que **no es el raro de su fila**. | `?apu=allinHumano`, mesa 2 |
| `apu.3` | El **panel de recarga**: tres montos, al menos uno vivo, la nota de §5.3, el plazo, el paso táctil, la caja dentro de la ventana, **la quinta condición del gate** (sin «Siguiente mano» mientras está abierto) y, al confirmar, que se cierra, que cuenta y que el gate vuelve. | `?apu=recarga`, mesa 3 |
| `apu.4` | **§4.3 y D-12**: que la mano AVANZA sin que nadie pulse un botón de apuesta, y que `data-clavada` no vale `1` en ningún instante del camino. | `?apu=sinRival`, mesa 4 |
| `apu.5` | Que el pozo **se parte de verdad** (`data-capas > 1`) y que, cuando la frase de capas sale, sale bien formada. | `?apu=capas`, mesa 4 |
| `apu.6` | Geometría: nada desborda el documento, ningún botón se sale de la ventana, ninguno baja de 36 px. | el estado en que quedó `apu.5` |
| **`apu.7`** *(STOP-3)* | **El all-in RESPONDIDO (E-13)**: se pulsa el botón de `apu.2` y se mira lo que antes no pasaba — el humano queda marcado (`data-allin` ≥ 1), la mesa no se clava en ningún instante y la mano **llega al pago**, o sea que el rival contestó y el reparto ocurrió. | `?apu=allinHumano`, mesa 2 |

Las capturas, **seis por viewport** desde STOP-3 —veinticuatro en total—: la
marca en el asiento, el botón, **el all-in ya respondido**, el panel de recarga,
la ronda sin rival y el pozo partido. La tercera es la única cosa de 1e-iii que
se puede VER, y por eso existe: el humano con la pila en cero, el pozo con lo
que los dos pusieron, y **la mano siguiendo** — que es justo lo que antes no
ocurría.

**Tres afidávits nuevos**, del mismo molde que `data-tono` (U3): un atributo no
mueve un píxel y permite verificar un hecho sin leer prosa ni deducirlo de la
pantalla.

- `data-clavada` en `.game-table` — el más importante de los tres, y ojalá valga
  siempre `0`: dice que la fase de apuesta abierta no tiene un solo asiento que
  pueda hablar. Es D-12, vigilado en cada mano que el arnés juega, porque es la
  única forma de que —si alguna vez ocurre— salga en un informe y no en un
  jugador mirando una mesa que no avanza.
- `data-allin` en `.game-table` — cuántos asientos van marcados.
- `data-capas` en `.game-message` — en cuántas capas se partió el pozo. Existe
  por E-16: sin él, `msg` acusaría al producto de un texto correcto.

Y una nota de método que la primera corrida obligó a escribir: **el bucle que
juega manos mira la condición también justo DESPUÉS de cada pulsación**, no sólo
al principio de cada vuelta. Los estados que este modo caza viven en el PAGO, y
el pago dura lo que tarde el bucle en pulsar «Siguiente mano»: mirando una sola
vez por vuelta se pasaba de largo la mitad de las veces.


---

### D.6 · El banco de niveles, con el motor final (STOP-3)

La ficha pedía correr la re-medición **una sola vez y después de A**, para que la
foto fuera del motor final y no de una mezcla. Se hizo así, y lo que devolvió no
es lo que se esperaba: obligó a una medición que la ficha no pedía —el **A/B
contra el motor de 1e-ii**— y a cerrar el paso B con un hallazgo en vez de con un
sello. Es exactamente la salida que la propia ficha reserva para este caso: «un Δ
que no cuadre con *más all-ins respondidos / rondas saltadas* se trae como
hallazgo, no se sella por encima».

#### B-1 · El oro de Básico: intacto

`testNivel1 §1` y su contabilidad, **verdes sin tocar nada**. Tiene una
explicación de una línea y conviene escribirla: el oro sella lo que
`decideBetAction` DECIDE sobre estados dados, y `isRoundOver` no participa en esa
decisión. E-13 cambia cuándo se cierra una ronda, no qué elige la IA cuando le
toca hablar. No hubo que re-derivar nada y no hay contabilidad que dar.

#### B-2 · Las bandas: rojas, y no por esta tanda

La corrida de `--bandas` se hace por reto y por volumen, porque la clave de una
banda incluye las dos cosas. Cinco combinaciones cubren 68 de las 84 celdas
selladas. **Con el motor de 1e-iii:**

| conductor | n=5.000 (los tres retos) | n=100.000 (avanzado y pro) |
|---|---|---|
| `espejo` | VERDE en las 12 | **VERDE en las 8** |
| `manoso` | VERDE en las 12 | verde salvo mesa 5 (−5,48σ y −7,37σ) |
| `pasivo` | *no hay celda sellada* | **ROJA en mesas 3, 4 y 5** (hasta −26,17σ) |
| `aleatorio` | ROJA en 6 de 12 | **ROJA en las 8** (hasta −27,62σ) |

Lo primero que salta es el renglón de `pasivo`: **a n=5.000 no existe esa celda
en la vara.** STOP-2 comparó a ese volumen y escribió «verde en los tres
conductores deterministas»; `pasivo` no salió verde, salió **sin comparar**. Es
E-20.

Y lo segundo, que obligó al A/B: unas σ de veinte y de veintisiete no son ruido
de muestreo. O 1e-iii había roto algo grande, o las bandas ya estaban rojas.

#### El A/B contra el motor de 1e-ii

Se revirtieron **sólo** A-1 y A-2 —el corte de `isRoundOver` de vuelta y
`abrirApuesta` hecha identidad—, se corrieron las mismas cinco combinaciones, y
se restauró el motor. Todo lo demás del árbol, idéntico.

| celda (n=100.000) | motor de 1e-ii | motor de 1e-iii |
|---|---|---|
| `pasivo` avanzado m3 · m4 · m5 | −7,30 · −21,55 · −25,58 | −7,88 · −20,86 · −26,17 |
| `pasivo` pro m3 · m4 · m5 | −10,40 · −20,63 · −20,23 | −9,90 · −22,55 · −20,84 |
| `aleatorio` avanzado m3 · m4 · m5 | −14,70 · −22,10 · −21,85 | −15,72 · −23,83 · −22,42 |
| `aleatorio` **avanzado m2** | **−14,91** | **−25,99** |
| `aleatorio` **pro m2** | **−15,83** | **−27,62** |
| `espejo`, las 8 | VERDE | VERDE |

**Los rojos ya estaban.** Ninguna celda cambia de veredicto por 1e-iii salvo una
que mejora (`manoso` pro m4, de −4,84 a −3,09). Y **la huella propia de esta
tanda es una sola familia de celdas: la mesa de DOS con el conductor al azar**,
que se hunde otros once sigmas.

Esa excepción no es un misterio, es la firma de E-13. En una mesa de dos, cuando
uno empuja su pila, el otro es SIEMPRE el último pendiente — que es exactamente
el caso que la línea borrada dejaba escapar sin pagar. En mesas de tres o más
suele quedar más de un pendiente y la línea disparaba mucho menos. Un conductor
que empuja al azar cobra esa diferencia entera.

#### B-3 · E-17, medido hasta el fondo: no era ruido

STOP-2 consignó que la banda de `aleatorio` «da rojo al azar en torno al 40 % de
las corridas» y lo atribuyó a una banda infrapotenciada. La ficha mandó subir `n`
hasta que cuatro corridas consecutivas dieran el mismo veredicto. Con `n=20.000`,
conductor `aleatorio`, reto avanzado:

| mesa | sellado (n=5.000) | corrida 1 | 2 | 3 | 4 |
|---|---|---|---|---|---|
| 2 | −1,818 ± 0,059 | −2,413 (−8,38σ) | −2,427 (−8,75σ) | −2,380 (−7,79σ) | −2,438 (−8,60σ) |
| 3 | −3,047 ± 0,079 | −3,566 (−5,55σ) | −3,521 (−5,01σ) | −3,473 (−4,60σ) | −3,484 (−4,68σ) |
| 4 | −5,208 ± 0,119 | −6,125 (−6,35σ) | −6,165 (−6,73σ) | −6,158 (−6,69σ) | −6,184 (−6,85σ) |
| 5 | −6,016 ± 0,127 | −6,860 (−5,55σ) | −6,859 (−5,52σ) | −6,857 (−5,60σ) | −6,879 (−5,74σ) |

**El veredicto se estabiliza con n=20.000: las cuatro corridas coinciden en las
cuatro mesas.** Lo que la ficha pedía, cumplido. Lo que no se esperaba es hacia
dónde se estabiliza: **ROJO en las dieciséis.** Las cuatro estimaciones caen una
encima de otra (mesa 5: −6,860, −6,859, −6,857, −6,879) y todas lejos del
sellado.

Con eso, el diagnóstico de E-17 queda corregido y es E-19: la banda no oscilaba
porque fuera débil alrededor de un cero; oscilaba porque **hay una deriva real y
grande** y n=5.000 la dejaba justo sobre el listón. Subir el volumen no la vuelve
verde: la fija en rojo.

Y la contabilidad, con el A/B repetido a n=20.000, reparte la deriva:

| mesa | sellado 1c-2 | motor de 1e-ii | motor de 1e-iii | sellado → 1e-ii | 1e-ii → 1e-iii |
|---|---|---|---|---|---|
| 2 | −1,818 | −2,171 | −2,415 | **−5,40σ** | **−6,97σ** |
| 3 | −3,047 | −3,514 | −3,511 | **−5,36σ** | +0,07σ |
| 4 | −5,208 | −6,187 | −6,158 | **−7,45σ** | +0,43σ |
| 5 | −6,016 | −6,854 | −6,864 | **−5,98σ** | −0,13σ |

Las cuatro mesas llevaban entre cinco y siete sigmas de deriva **antes** de esta
tanda. 1e-iii sólo mueve la mesa de dos, y la mueve por E-13.

#### Por qué NO se re-sella

La ficha autoriza re-sellar «con el motor final» cuando una celda determinista
sale roja, y prohíbe sellar por encima de un Δ que no cuadre con esta tanda. **El
Δ no cuadra con esta tanda**: está medido que es anterior. Sellarlo ahora
convertiría en vara la deriva de otro, y le quitaría a quien la busque el único
rastro que tiene.

La vara `APU1-1c2` se queda donde está, roja y diciendo la verdad. Lo que este
informe aporta es la medida: cuánto, dónde, desde cuándo no, y qué conductor se
salva.

**El conductor que se salva es la pista.** `espejo` está verde en las ocho celdas
de n=100.000, con las dos versiones del motor. `espejo` es el único cuyo asiento
0 juega con el mismo cerebro que sus rivales y cuyo resultado neto es cero por
construcción; los otros tres son manos cortas que se quedan sin fichas a menudo.
Si la deriva fuera del cerebro de la IA, `espejo` la vería. Que no la vea apunta
a lo que le pasa a un asiento corto **cuando llega al reparto** — y lo que cambió
ahí entre 1c-2 y hoy fue el reparto por capas del §4.2, que APU-1 1d estrenó.
**Es una hipótesis, no una medida**, y tiene una comprobación barata que esta
tanda no tiene mandato para hacer: correr `--bandas` contra el árbol del commit
en que se selló y ver si ya entonces estaba verde.

---

## §E · Hallazgos

### E-1 · Veintidós arneses con su propia copia de la ruta

Al cambiar la ruta a la mesa se contaron **22 scripts** con los tres clics viejos
escritos a mano. Es la avería de NIV-UI otra vez —«el arnés medía una pantalla que
la app había dejado de mostrar y nadie se enteró hasta EMB-1»— y el remedio que
`diagDSK` escribió entonces, `recorrerRuta`, **se quedó dentro de `diagDSK`**, así
que no protegió a nadie más.

`scripts/rutaMesa.mjs` saca ese sitio fuera. Lo consumen `diagDSK` y `diagCEL0`,
que son los dos arneses VIVOS que entraban por ahí.

**Los otros veinte quedan rotos contra la ruta nueva, y se consigna a propósito:**
son verificadores de un solo uso de campañas cerradas (`verifyC43`…`verifyC45c`,
`verifyEMB1`, `verifyGameOver`, `verifyIDN1`, `verifyMesa5`, `verifyREN1`,
`verifyShrink`, `verifyViewport`, `shotFloat`, `shotStatus`, `measurePanel`,
`_sh1probe`, `_cel1bFila`). Ninguno entra en las varas de cierre de ninguna fase.
Reescribir veinte scripts históricos para que la corrida de hoy no los tocara
habría sido trabajo sin lector; el que quiera revivir uno tiene el módulo
compartido esperando, y son dos líneas. **Decisión del rector si prefiere lo
contrario.**

### E-2 · La cuarta fila nacía sin chips y empujaba el CTA

Encontrado escribiendo `retar.1`. `opcionesEntrada` devolvía una lista **vacía**
mientras no hubiera mesa elegida, así que la fila de la entrada no tenía un solo
botón hasta que la cascada llegaba a ella — y entonces aparecían cuatro de golpe
que empujaban el CTA hacia abajo, justo bajo el dedo que iba a pulsarlo.

Es la regla O1 de la casa aplicada a un control en vez de a un aviso: **la caja se
reserva con los chips puestos**. Ahora la fila devuelve siempre sus cuatro ids,
apagados y con el nombre solo («Mínimo», «Medio», «Techo», «Otra…»); el monto
aparece cuando hay mesa. Sellado con una prueba.

### E-3 · El CTA se cortaba en «entra…»

«Retar a 4 IAS · mesa 200 · entras con 3.000» son 43 caracteres contra los 18 de
«Crear mesa privada», para el que se dimensionó `.sal-cta`. Con el ancho fijo de
`--cta-w` y `white-space: nowrap`, en un 360 de ancho la frase se cortaba — y el
CTA es justo la pieza que no puede mentir sobre lo que pasa al pulsarlo.

Se resolvió dejando que la caja mida lo que mide su texto, con el ancho de la
lámina como MÍNIMO, y **envolviendo en dos líneas en vez de encoger la letra**:
IDI-1 trae cuatro idiomas más y en alguno esta frase será más larga todavía.

### E-4 · Un aviso de React en cada carga, que ningún arnés gateaba

El modo `retar` es el primero de `diagDSK` que escucha `console` y no sólo
`pageerror`, y al encenderlo aparecieron dos voces que no son de 1e:

1. **`Received an empty string for a boolean attribute 'inert'`**, de React, en el
   primer render de la app. Se reproduce en una carga pelada de `/` **antes de
   tocar nada**, y el nodo culpable ya no está en el DOM cuando el lobby asienta
   (`document.querySelectorAll('[inert]')` sale vacío). No es de esta campaña y no
   se persiguió más allá de acotarlo. **Queda para quien sea dueño de la cáscara.**
2. **401 + `permission denied for function mi_sala`.** Es la consecuencia
   DOCUMENTADA de correr con `VITE_AUTH_BYPASS`: el uuid de `PERFIL_DEV` no existe
   en la base (cabecera de `diagSAL`).

Las dos se filtran **por nombre**, nunca en bloque, y se cuentan aparte en el JSON
(`consolaConocida`): el día que una se arregle, la cifra baja a cero sola.

### E-5 · Tres de las cuatro salidas de la mesa pasaban el evento de clic

`onClick={onLeave}` entrega el `MouseEvent` como primer argumento. Mientras nadie
leyera ese argumento daba igual; desde esta tanda `onLeave` recibe **las fichas
con las que el humano se levanta**, así que las cuatro salidas pasan ahora por un
único `salir()`. Sin esto, tres de cada cuatro salidas habrían devuelto un evento
al saldo de la sesión.

### E-6 · La cascada literal tiene un precio que el rector debería ver

§2.2 dice «cambiar una superior limpia las inferiores» y así está implementado.
La consecuencia: **cambiar de reto borra también el tamaño de mesa**, que no
depende del reto. Es una decisión de más por cada cambio de reto, y hace que la
memoria de tres campos se vea menos de lo que podría.

Se implementó literal porque es lo que la ficha sella y porque una regla sin
excepciones es una regla que el jugador no tiene que aprender. **Si Victor
prefiere que `jugadores` sobreviva al cambio de reto, es una línea en
`retarCore.elegir` y una prueba.**

> **SELLADO por Victor al abrir 1e-ii, y en contra de como estaba escrito.** El
> número de jugadores se CONSERVA: limpiar no es una costumbre de la cascada, es
> la consecuencia de una dependencia, y el tamaño de mesa no depende del reto en
> nada. Aplicado en B.2 —`DEPENDEN`, un mapa en vez de un barrido— con dos
> pruebas y el punto `retar.2` del arnés ajustado.

### E-7 · El rival de la mesa de 2 se llamó «IA 1» durante hora y media

Lo cazó `diagDSK msg` en su punto **T2**, y es el hallazgo que justifica la vara.

`createInitialState` tiene dos formas. La NUMÉRICA —la que usó la app hasta hoy—
bautiza los asientos con una excepción para la mesa de dos: ahí el rival se llama
**«IA»**, a secas, porque no hay ningún otro del que distinguirlo. La forma de
LISTA cae a `IA ${i}` para todo el que no traiga nombre. Al estrenar la lista, el
rival de la mesa de 2 pasó a llamarse **«IA 1»** en el óvalo, en la crónica y en
el resultado — en las tres mesas de 2 de los tres viewports que `msg` mide.

Ni `vitest`, ni `lint`, ni `build`, ni `diagSAL`, ni el modo `retar` lo vieron: es
un cambio de TEXTO en una pantalla que ninguno de ellos visita. Lo vio el arnés
que re-deriva la voz de la mesa y la confronta con lo que el producto pinta.

Arreglado en `entrada.jugadoresVsIA` —que es quien arma la lista, y por tanto
quien tiene que decir cómo se llaman los asientos que arma— y **no** en el motor,
que está protegido y cuya rama numérica es correcta. Sellado con dos pruebas: una
fija la convención y otra **confronta las dos formas pasadas por el motor**, así
que sobrevive a que el motor cambie de criterio.

### E-8 · Abrir «Otra…» sacaba el CTA de la ventana

El contador se montaba sólo al abrirlo, y en `.sal-chips` —que envuelve— eso
añadía una línea de flex entera. En un 1024×768 esa línea empujaba el CTA **33 px
por debajo del borde**, y como `.sal` sólo desplaza en el traje apaisado bajo, el
botón quedaba inalcanzable. No lo vio la primera corrida de `retar` porque la
geometría se medía una sola vez, y justo en el estado que no rompía.

Dos arreglos y una lección:

1. **El contador se reserva** (O1), como los avisos: está siempre y lo que cambia
   es su visibilidad. `visibility: hidden` lo saca también del orden de
   tabulación, así que oculto no se alcanza ni con teclado.
2. **`.es-retar` gana un traje corto** en `max-height: 800px`, que es la doctrina
   de §13 de `salas.css` («lo que no cabe NO se scrollea, se aprieta») aplicada a
   una columna que tiene una fila más que la de SAL-2. Medido: el CTA pasa de
   801 px a 753 en un viewport de 768.
3. La lección, que es la que vale: **una vara de geometría que se toma una sola
   vez mide el estado que el autor eligió, no el que rompe.** `retar.6` se toma
   ahora dos veces —en reposo y con el contador abierto— y las dos entran en el
   veredicto.

**Para el rector:** en un 1024×768 sobran 364 px a los lados de la columna
(`--col` son 660). Repartir las cuatro filas en dos columnas cuando hay sitio
cabría de sobra, pero sería una lámina distinta de la que Victor selló para la
pantalla hermana. Apretar es lo conservador; **ensanchar lo decide él.**

> **SELLADO por Victor al abrir 1e-ii: se APRIETA.** Una columna que se parte en
> dos según el viewport son dos pantallas que el jugador tiene que reconocer
> como una, y la lámina de «Retar a las IAS» es la MISMA que la de «Armar una
> mesa». No hizo falta código —`.sal-cuerpo.es-retar` ya heredaba
> `width: var(--col)`—: lo que cambió fue el comentario de §15, que dejaba la
> pregunta abierta y ahora deja escrita la decisión y su motivo.

### E-9 · `msg` daba por hecho que el humano siempre llega al final

El arnés de la voz de la mesa nació cuando **todos los asientos empezaban con
5.000 fichas en una mesa de 50**. Con esa profundidad, en las tres manos que mide
no se quebraba nadie **y el humano siempre podía igualar**, así que dos
simplificaciones suyas eran ciertas por accidente y nunca se ejercitaron.

Con las entradas de 1e esa misma mesa se juega con **750 fichas** —quince antes de
fondo—, hay apuestas que el humano no alcanza y un all-in desploma a alguien en
una mano. Las dos simplificaciones se rompieron a la vez:

**(1) El tamaño de la mesa.** `numPlayers` y `ruleN` se pasaban con el tamaño de
ARRANQUE. Con alguien eliminado, eso decide mal entre la voz de la mesa de dos y
la de tres o más, y usa una tabla de reglas que ya no es la vigente (la del
producto sigue a los vivos desde C4.4). Arreglado leyendo el tamaño del producto
en cada mano —el layout sigue a los vivos, así que las zonas pintadas SON los
vivos— y tomando `ruleN` del DOM, de donde ya salía para cruzar las cartas.

**(2) La lista de jugadores, comprimida.** Ésta es la de verdad, y es un fallo de
modelo con nombre y apellido: el arnés componía el mensaje esperado pasándole a
`composeResultado` **sólo a los que llegaron a comparación**. Pero
`resultadoCore.deShowdown` decide «ganaste tú» con `winner === 0`, porque en el
producto `players` es la mesa ENTERA y el asiento 0 es el humano.

> En cuanto el humano se retiraba, desaparecía de esa lista comprimida, el
> índice 0 pasaba a ser una IA, y el arnés componía **«¡Ganas con Copas, 41 pts!»**
> contra un producto que decía, correctamente, **«IA 3 gana con Copas, 41 pts.»**
> — y lo cantaba como fallo del producto.

Arreglado reconstruyendo la mesa entera, retirados incluidos con `score: null`
(que es como el motor los deja) y con el asiento 0 **garantizado humano**: si su
zona no está, se pone un hueco. `enJuego` lo ignora por no tener score,
exactamente igual que en el producto.

**En ninguna de las FALLA estaba equivocado el producto.** Lo estaba el modelo, y
las tres corridas que hicieron falta para llegar aquí son la prueba de por qué un
rojo se investiga antes de creerlo: el primero acusó a la crónica, el segundo a
la rotación, y la causa estaba en una línea del arnés que llevaba años siendo
cierta por casualidad.

La puerta de rotación de la Mano no se podía arreglar igual —reconstruirla sobre
los vivos pediría llevar la historia de quién murió en qué mano, y eso dejaría de
ser un modelo independiente para ser una copia del producto—, así que donde la
mesa encogió se **DECLARA no aplicable**, que es el trato que el propio arnés le
da a la pastilla escondida.

### E-10 · Lo que 1e le hace al RITMO del juego, y nadie lo ha decidido aún

No es un defecto: es la consecuencia de enchufar `entrada.js`, y merece mirarse
antes de 1f.

Hasta hoy, toda mesa se jugaba con **5.000 fichas por asiento**, fuera la apuesta
50 o 1.000. Desde 1e la profundidad la elige el jugador y es un múltiplo de la
apuesta: en la mesa de 50 al medio son **750**, y las IAS se sientan con 1.125.
De cien antes de fondo se pasa a quince.

Se ve en la primera corrida: las sesiones de `msg` —que antes terminaban siempre
con los cinco asientos vivos— ahora llegan a mesas de dos. **Eso es exactamente
lo que APU-1 perseguía** —una mesa donde las fichas se acaben y la recarga tenga
sentido—, pero cambia el ritmo de la partida lo suficiente como para que Victor lo
mire en el teléfono con las tres entradas antes de que 1f lo dé por bueno. La
recarga de §3.5 (STOP-2) es la otra mitad de esta decisión.

> **STOP-2 entrega esa otra mitad**, y con ella el cuadro para juzgar E-10 está
> completo: la mesa donde las fichas se acaban tiene ahora la puerta para volver
> a entrar. Lo que no se ha tocado es ninguna cifra —ni el piso, ni el medio, ni
> el techo, ni el factor 1,5 de la pila de las IAS— porque eso es lo que Victor
> tiene que juzgar jugando. Tres cosas que mirar en el teléfono, y las tres
> nuevas desde su última partida: **si quince antes de fondo dan una mesa o una
> carrera**, **cada cuánto salta la recarga automática** —el listón de cinco
> apuestas es cifra de §5.1, no medida— y **si el compás nuevo de las IAS se
> siente como tensión o como espera**.

### E-11 · Un `ReferenceError` en cada render, y lo cazó el linter BAJANDO

La caja que calcula las capas del pozo nació donde temáticamente pertenece: al
lado de `pozoMostrado`, junto al pozo que se pinta. Y leía `isPayoutPhase`
**387 líneas antes de que esa constante se declarara**. Eso no es un detalle de
estilo: es la zona muerta temporal de un `const`, o sea un `ReferenceError` en
cada render de la mesa.

**No lo vio nada de lo que suele verlo.** `vitest` no monta componentes —este
proyecto no tiene jsdom—, `npm run build` no lo mira, y Playwright no había
llegado todavía. Lo cazó `npm run lint`, y de la forma más callada posible:
**bajando de 21 problemas a 3**. El compilador de `react-hooks` dejó de poder
compilar `GameTable.jsx` y sus dieciocho diagnósticos desaparecieron de golpe.

La lección va escrita en el propio archivo, porque es la clase de cosa que se
olvida: **una vara que BAJA sin que nadie haya arreglado nada es una vara que
hay que ir a mirar.** Un delta negativo en un contador de defectos se lee como
una buena noticia por reflejo, y aquí significaba que el analizador se había
quedado ciego sobre el archivo más grande del proyecto.

Encontrarlo costó ocho bisecciones porque el síntoma no señala a la causa: el
plugin no dice «no puedo compilar esto», simplemente calla. La confirmación vino
de un componente de tres líneas con una violación conocida —ahí la regla sí
disparaba—, lo que separó «la regla está apagada» de «la regla se rindió con
este archivo».

Y tenía un hermano, encontrado en la misma sesión de bisección: los dos
manejadores de la recarga estaban declarados DETRÁS de los efectos que los
llaman. Hoisting válido en JavaScript, pero el compilador se rendía igual, y con
él los doce diagnósticos de la familia `refs`. Movidos delante.

Arreglado, `lint` vuelve a **21 problemas (20 errores, 1 aviso)**, Δ = 0, y no
«cuadra la cifra» sino que son los MISMOS uno por uno: dos errores de
`react-refresh` fuera de la mesa —`CardImage.jsx` y `SoundContext.jsx`— y
diecinueve dentro de `GameTable.jsx`, dieciocho errores y el aviso de la
directiva sin usar, en las mismas líneas relativas que la línea base.

### E-12 · D-12 tenía dos rutas y sólo una existe

1d dejó D-12 consignado como «no observado en ~80 millones de manos», y con
razón: hasta 1e todos los asientos nacían con 5.000 fichas. Con las entradas de
APU-1 había que volver a mirarlo, y al mirarlo aparecieron dos rutas posibles:

1. **El ante deja a todos en cero a la vez.** Reproducida: tres asientos con la
   apuesta justa, `startHand`, y `BET_1` nace con `puedenHablar` vacío y
   `accionesDe` vacío para el asiento activo. La mesa se clava.
2. **Todos van all-in apostando en `BET_1`**, y `BET_2` nace muda. Es la ruta
   corriente del póquer —todos empujan, las cartas corren solas— y era la que
   daba miedo, porque ninguna pantalla puede salir de ahí: no hay acción legal
   que aplicar y `advanceBettingPhase` es privada del motor protegido.

**La segunda NO existe**, y comprobarlo fue lo que destapó E-13. `isRoundOver`
corta con `pendientes.length <= 1`, así que en cuanto el penúltimo asiento con
fichas se marca all-in la ronda se declara cerrada — y el último conserva su
pila. Siempre sobrevive alguien con fichas a cada ronda de apuestas, luego una
ronda posterior no puede nacer muda.

Queda la primera, y ésa **sí se cierra desde la pantalla**: se mira ANTES de
repartir (`anteDejaAMudos`) y la recarga pasa a forzosa. Un asiento vivo es el
que puede pagar el ante (`chips >= unit`) y queda con algo sólo si
`chips > unit`; si ninguno pasa de ahí, la mano que se va a repartir no tiene una
sola decisión posible y no se reparte.

Las dos rutas están selladas con pruebas que corren contra el motor de verdad,
no contra un modelo: una demuestra el estado mudo, la otra demuestra que la
segunda ruta no llega.

### E-13 · El motor cierra la ronda antes de que el último pueda pagar un all-in — **CERRADO en 1e-iii**

Salió de medir E-12, y es más gordo que E-12.

`isRoundOver` (`gameEngine.js:146-153`) corta así:

```js
const pend = pendientes(players)
if (pend.length <= 1) return true
```

Esa línea aplica §4.3 —«si queda un solo jugador con fichas, las rondas de
apuesta **restantes** no existen»— a la ronda EN CURSO. Y §4.3 habla de las
restantes, no de la que se está jugando. La consecuencia, reproducida en una
prueba:

> Dos asientos con tres apuestas cada uno. El que abre empuja su pila entera con
> un ×2 que cuesta justo lo que tiene. En cuanto se marca `allIn`, `pendientes`
> se queda en uno y la ronda **se cierra sin que el otro hable**: conserva su
> pila entera, `acted` sigue en `false`, y la apuesta vuelve entera por la capa
> no igualada (D-7).

Nadie pierde dinero — pero **el rival escapa de un all-in sin decidir si lo
paga**, que es exactamente lo que un all-in existe para forzar. Y hay una
segunda cara: esa misma línea es lo único que impide la ruta 2 de E-12, así que
el defecto está tapando un hueco.

Es redundante, además: el caso legítimo —un solo pendiente que YA actuó e
igualó— lo cubre la línea siguiente (`pend.every(p => p.acted && p.contrib ===
currentBet)`), y con la lista vacía ese `every` también vale `true`. Lo único
que el corte añade es saltarse al pendiente que todavía no ha hablado.

**El arreglo es borrar esa línea, y está en `gameEngine.js`, que es protegido.**
STOP-2 no lo tocó: quedó descrito con su reproducción y su prueba para que el
rector decidiera, porque borrarlo hace el all-in efectivo de verdad y a la vez
ABRE la ruta 2 de D-12, que entonces necesita su propia rama — las dos cosas son
la misma edición.

**El rector lo autorizó y 1e-iii lo hizo, con las dos mitades juntas** (§B.3, A-1
y A-2). Las tres salidas del rival están medidas una por una, la ruta 2 de D-12
queda cerrada por el motor, y la huella del cambio en el banco está aislada en
**E-21**: una sola familia de celdas, la mesa de dos, que es exactamente donde la
teoría decía que tenía que aparecer.

### E-14 · La recarga automática tapaba el showdown

`diagDSK msg` dio rojo en mesa 5 en su primera corrida con la mesa nueva, y no
por el texto: **el arnés no podía tocar los nombres de las IAS para destapar sus
manos** (`locator.click: Timeout 2500ms`). Las bandas de puntaje se veían —o sea
que esos asientos SÍ llegaron al showdown— pero el nombre no admitía el toque.

La causa era la tanda misma. Con las pilas cortas de APU-1 la pila del humano
baja del listón de §5.1 a menudo, la pregunta automática sale al cerrar la mano,
y heredaba de `bankrupt-overlay` un velo a pantalla completa. **El showdown es
justo lo que el jugador está mirando en ese instante** —las cartas reveladas,
quién ganó y con qué— y taparlo con una oferta de recargar es pedirle que decida
sin ver el resultado que motiva la decisión.

La pregunta se parte en dos láminas, y la frontera es la que el normativo ya
traza: la **forzosa** bloquea, como el modal al que releva, porque detrás no hay
nada que valga la pena mirar; la **automática** y la **voluntaria** se apoyan
abajo, sin velo y sin capturar el ratón fuera de su caja. Lo único que bloquean
es «Siguiente mano», que es lo que §5.1 pide y ni un píxel más.

Es el segundo hallazgo que `msg` aporta en esta campaña —el primero fue E-7, el
rival que se llamó «IA 1»— y los dos tienen la misma forma: un defecto que
ninguna prueba unitaria podía ver porque vive en la pantalla montada.

### E-15 · El piso táctil de 40 px no existe en escritorio

La primera corrida de `apu` dio rojo en el botón All-in por medir 37 px de alto
contra un mínimo de 40. El rojo era del arnés: el `min-height: 40px` de
`gameTable.css` vive dentro de la media query táctil, y en un 1024×768 TODOS los
botones de la fila miden 37, «Retirarse» incluido. Exigirle 40 al botón nuevo
era pedirle algo que ninguno de sus hermanos cumple.

La vara correcta no es una cifra absoluta sino una relación: **el botón nuevo no
puede ser el raro de su fila**. `apu.2` compara ahora su altura con la de sus
hermanos y tolera un píxel.

### E-16 · Dos capas no obligan a decir nada

Otro rojo de arnés en la primera corrida: `apu.5` exigía que un pozo partido
llevara siempre la frase de capas, y cayó con dos capas, un solo ganador y un
texto perfectamente correcto. Si las dos capas se las lleva el mismo, el
resultado ya lo cuenta entero y añadir una frase sería ruido.

El arnés mide ahora lo que PUEDE ver desde fuera —que el molde parte el pozo de
verdad y que, cuando la frase sale, sale bien formada— y quién gana cada capa lo
sella Vitest, que es donde el reparto se puede fijar a mano.

**Y una segunda pasada, que es la que lo dejó firme.** Con el gate corregido el
punto salía verde en las cuatro celdas de una corrida y rojo en una de la
siguiente, sin que nada cambiara: el pozo sólo se parte cuando alguien pone por
ENCIMA del nivel del asiento en all-in, y el ante no sirve porque todos pagan el
mismo. Dejarlo al criterio de las IAS era dejarlo a la suerte. Ahora el bucle
hace que el humano APUESTE en ese molde, con lo que la segunda capa es segura en
cuanto pone una ficha de más. Un punto de arnés que sale verde el 75 % de las
veces no es un punto: es ruido con opinión.

Hay una tercera pieza del mismo problema y vale la pena nombrarla: **`msg` no
puede re-derivar la frase de capas**, porque la fórmula de §4.2 se calcula sobre
`contribMano` y eso no está en la pantalla ni puede estarlo. Exigir la igualdad
exacta ahí acusaría al producto de un texto correcto — que es exactamente el
defecto que E-9 costó tres corridas descubrir en 1e-i. Así que el producto
publica un afidávit (`data-capas`, del mismo molde que `data-tono`), y donde hay
capas el arnés comprueba que el resultado re-derivado sea el PRINCIPIO del texto
y que la cola hable de capas. La cola la sella Vitest.

### E-17 · La banda `aleatorio` del banco da rojo al azar — **diagnóstico corregido por E-19**

`bancoNiveles --bandas` contra la vara `APU1-1c2` sale ROJA, y no es de esta
tanda. Cuatro corridas **idénticas y consecutivas, sin tocar una línea entre
ellas**, dan veredictos distintos:

| corrida | mesa 2 | mesa 3 | mesa 4 | mesa 5 |
|---|---|---|---|---|
| 1 | VERDE | VERDE | ROJA | ROJA |
| 2 | ROJA | VERDE | VERDE | VERDE |
| 3 | ROJA | VERDE | VERDE | VERDE |
| 4 | VERDE | VERDE | VERDE | ROJA |

Sólo el conductor **`aleatorio`** se mueve, y sólo en `fichasPorMano`; `espejo`,
`pasivo` y `manoso` salen verdes en las cuatro corridas y en los tres retos. La
misma celda pasa de −3,84σ a −4,92σ entre dos corridas sin causa.

Que esta tanda no puede haberlo movido está demostrado por otra vía: los tres
archivos que el banco lee y que deciden —`aiPlayer.js`, `gameEngine.js` y
`deck.js`— están **intactos al blob**, y lo único que 1e-ii tocó de lo que el
banco alcanza a ver son dos funciones nuevas añadidas a `pozos.js` (ninguna
línea existente modificada) y una clave `ui` en la config que la IA no lee.

Se consignó sin arreglar, con esta lectura: **la banda de `aleatorio` a n=5000
está infrapotenciada para `fichasPorMano` y produce un rojo falso en torno al
40 % de las corridas.**

**Esa lectura era incorrecta y 1e-iii la corrige.** Se subió el volumen como la
ficha mandaba, el veredicto se estabilizó —cuatro corridas idénticas en las
cuatro mesas— y se estabilizó en ROJO. No era una banda débil alrededor de un
cero: es una deriva real de cinco a siete sigmas que n=5.000 dejaba justo sobre
el listón de decisión. Ver **E-19** y §D.6.

### E-18 · `allinHumano` dura una mano, y es aritmética

El molde que enseña el botón All-in sienta al humano con 1,5 apuestas. No es un
capricho de cifra: **para que una apuesta no se pueda cubrir hay que tener menos
de una apuesta, y con menos de una apuesta no se paga el ante siguiente.** El
estado existe durante una mano y depende además de que alguna IA abra.

El arnés lo trata como lo que es: reintenta la mesa entera hasta cuatro veces en
vez de esperar dentro de una partida que ya no puede darle el estado. Se deja
escrito porque es la clase de cosa que parece un arnés flojo y es una propiedad
del juego.

---

### E-19 · E-17 estaba mal diagnosticado: no es una banda débil, es una deriva real

STOP-2 vio la banda de `aleatorio` dar veredictos distintos en cuatro corridas
idénticas y concluyó que estaba **infrapotenciada**: que el efecto verdadero era
cero y n=5.000 producía «un rojo falso en torno al 40 % de las corridas». La
receta que salía de ahí era subir el volumen para que dejara de oscilar.

Se subió, como la ficha mandó, y el diagnóstico se cae. A **n=20.000** el
veredicto se estabiliza —cuatro corridas consecutivas, las cuatro mesas, el mismo
resultado, con las estimaciones cayendo una encima de otra— y se estabiliza en
**ROJO**. La tabla está en §D.6.

La diferencia entre las dos lecturas no es de matiz. Una banda infrapotenciada
alrededor de un cero es un problema del INSTRUMENTO y se arregla midiendo más.
Una deriva de cinco a siete sigmas es un problema del PRODUCTO, y medir más sólo
sirve para verla mejor. n=5.000 dejaba el efecto justo sobre el listón de
decisión: por eso a veces cruzaba y a veces no, y por eso parecía azar.

Es la misma lección de E-11 con el signo cambiado. Allí una vara que BAJABA sin
que nadie arreglara nada significaba que el analizador se había quedado ciego.
Aquí una vara que OSCILA sin que nadie toque nada no significa «ruido»: significa
que la medida está apoyada en el listón, y lo primero que hay que hacer es
apartarla de ahí antes de explicar por qué se mueve.

**Se consigna y no se sella.** Ver §D.6: la deriva está medida como anterior a
esta tanda, y sellarla ahora la convertiría en vara.

### E-20 · «Verde en los tres conductores deterministas» era verde en dos

STOP-2 escribió que `--bandas` salía verde para `espejo`, `pasivo` y `manoso` en
los tres retos. La corrida que respalda esa frase es la de n=5.000, y **en la
vara no hay una sola celda de `pasivo` a n=5.000**: sus ocho celdas selladas son
todas de n=100.000. Lo que el arnés escribió junto a `pasivo` no fue VERDE, fue
`SIN BANDA SELLADA (celda nueva)`, y esa etiqueta se leyó como una fila más de
una tabla verde.

Al compararla donde sí tiene vara, `pasivo` es **la celda más lejos de la suya de
todo el banco**: roja en las mesas 3, 4 y 5 de los dos retos, hasta −26,17σ. Y es
un conductor **determinista** — no tiene azar propio que explique nada.

El defecto no es del banco: `compararConBandas` dice exactamente lo que hace, y
además lleva desde D-16 de 1b una cuenta explícita de cuántas celdas llegó a
comparar, que existe precisamente para que nadie confunda «verde» con «no
medido». El defecto es de lectura, y la lección se deja escrita porque es fácil
de repetir: **en una tabla de veredictos, la fila que no dice ni verde ni rojo es
la que hay que leer primero.**

### E-21 · La huella de 1e-iii en el banco es una sola celda, y tiene nombre

De las 68 celdas comparadas, el motor nuevo cambia el veredicto de UNA, y a
mejor. Lo único que se mueve de verdad es `aleatorio` en la **mesa de dos**:
−14,91σ → −25,99σ en avanzado y −15,83σ → −27,62σ en pro, medido con el A/B
descrito en §D.6. Las mesas 3, 4 y 5 no se mueven (+0,07, +0,43, −0,13σ).

Es la firma de E-13, y se lee sin ambigüedad. En una mesa de dos, cuando uno
empuja su pila el otro es **siempre** el último pendiente: el caso exacto que la
línea borrada dejaba escapar sin pagar. En mesas de tres o más casi siempre queda
más de un pendiente y la línea disparaba mucho menos. Un conductor que empuja al
azar y ahora sí recibe respuesta paga esa diferencia entera — que es justo lo que
E-13 pretendía: **que un all-in cueste lo que un all-in debe costar.**

Que el efecto aparezca donde la teoría dice que tiene que aparecer, y en ninguna
otra parte, es la mejor prueba de que la edición hizo lo que decía que hacía.

### E-22 · Un toque que no entra, en el showdown de mesa 5

`diagDSK msg` dio rojo en su primera corrida con el motor nuevo y verde en la
segunda, sin tocar nada entre ellas. El fallo es siempre el mismo y siempre en la
misma celda: mesa 5 a 1366×768, `IA 4: el nombre no admitió el toque
(locator.click: Timeout 2500ms)`. La banda de puntaje de ese asiento **sí** se
leía —o sea que llegó al showdown— pero su nombre no aceptó el clic dentro del
plazo.

Tiene la misma forma que E-14, que fue real y se arregló: allí la recarga
automática heredaba un velo a pantalla completa y tapaba el showdown. Aquí no se
ha identificado qué lo tapa, y hay una hipótesis barata que esta tanda no ha
podido descartar: con las pilas cortas de APU-1 y con E-13, en mesa 5 acaban más
asientos en cero, y un asiento que se queda sin fichas entra en la coreografía de
eliminación —que anima— justo cuando el arnés quiere tocarlo. Playwright espera a
que el objetivo esté quieto antes de pulsar.

Se consigna sin arreglar y **sin subir el plazo**, que sería taparlo: si lo que
pasa es que el nombre de un rival no admite el toque durante un segundo largo
después de una mano, eso le pasa también a un jugador con el dedo encima.

### E-23 · Cuando un mismo asiento gana dos capas, la frase lo nombra dos veces

Visto en una captura de `apu.5`:

> «Empate, 30 pts. Gana IA 3 por ser el más cercano a la Mano. El pozo se partió:
> IA 2 se lleva 200. IA 2 se lleva 300.»

`componeCapas` recorre las capas y nombra las que no se lleva el ganador
principal. Cuando dos de ellas caen en el mismo asiento, lo nombra dos veces. La
información es correcta —son dos capas distintas de dos montos distintos— pero se
lee como un tartamudeo.

No es de esta tanda: la frase es de 1e-ii. Lo que sí es de esta tanda es que **se
ve mucho más**, porque con E-13 los all-ins se responden y los pozos se parten
más a menudo. Se deja consignado con la forma que tendría el arreglo —agrupar por
ganador antes de componer, «IA 2 se lleva 200 y 300», o sumar— porque elegir
entre esas dos es una decisión de voz y la voz la sella el rector.

---

## §F · Cierre

### Lo que la fase 1e entrega

Tres STOP. El primero puso al jugador delante de la decisión de **con cuánto se
sienta**; el segundo, la mesa donde esa entrada se gasta, se defiende y se
recarga; el tercero hizo que **un all-in cueste lo que un all-in debe costar** y
recogió lo que los dos anteriores dejaron marcado.

Lo que cambia para quien juega, dicho sin código:

- Puede elegir su entrada entre cinco y cincuenta apuestas, y el resultado de la
  mesa se cuenta contra lo que puso, no contra una constante.
- Cuando no cubre una apuesta viva ya no tiene que soltar lo que había puesto:
  tiene un botón que dice cuánto le queda y lo pone entero.
- Cuando él empuja su pila, **el rival tiene que contestar**. Hasta 1e-iii podía
  no llegar a hacerlo.
- Entre manos puede recargar, y si la pila baja del listón se lo preguntan sin
  taparle el resultado que está mirando.
- Las IAS ya no responden todas con el mismo compás: lo que se tarda en empujar
  una pila no es lo que se tarda en pasar.

### Las varas, al cerrar

`vitest` **933/933** en 32 archivos · `lint` **21**, Δ = 0 en los tres STOP ·
`build` ✓ con **cero residuo** del molde en `dist/` · `diagSAL` **102/102** ·
`diagDSK` **o1 16/16** (0 px de desplazamiento en las dieciséis celdas), **lob
6/6**, **retar 6/6**, **msg VERDE**, **apu 4/4 en dos corridas consecutivas** con
el punto nuevo dentro · el **oro de Básico intacto** · `bancoNiveles --bandas`
**rojo y consignado, no sellado** (§D.6, E-19 a E-21) · **cinco protegidos
intactos al blob** y el sexto con el diff limitado a los cuatro rangos
autorizados.

### Lo que 1e deja sobre la mesa del rector

**1 · Las bandas del banco llevan rojas desde antes de esta tanda, y hay que
decidir qué se hace con ellas.** Es lo más gordo que sale de STOP-3 y no es de
STOP-3: está medido, con el A/B del motor, que la deriva es anterior (§D.6). Tres
cosas que el rector necesita saber juntas:

- `pasivo`, que es **determinista**, está a −26σ de su vara en las mesas 3, 4 y 5.
  Nunca se había comparado ahí porque STOP-2 corrió a un volumen en el que esa
  celda no existe (**E-20**).
- El rojo de `aleatorio` no era ruido: a n=20.000 el veredicto se estabiliza y se
  estabiliza en rojo (**E-19**, que corrige el diagnóstico de E-17).
- `espejo` —el único conductor cuyo neto es cero por construcción— está **verde en
  las ocho celdas**, con las dos versiones del motor. Eso apunta a que la deriva
  no está en el cerebro de la IA sino en lo que le pasa a una mano corta al llegar
  al reparto, y el sospechoso con fecha es el reparto por capas del §4.2, que 1d
  estrenó después del sellado. **Es una hipótesis**, y la comprobación es barata:
  correr `--bandas` contra el árbol del commit en que se selló.

No se ha re-sellado nada. La ficha prohíbe sellar por encima de un Δ que no
cuadre con la tanda, y éste no cuadra: sellarlo ahora convertiría en vara la
deriva de otro y borraría el único rastro que hay para encontrarla.

**2 · E-10, la profundidad en el teléfono.** Sigue siendo lo que era al cerrar
STOP-2, y ahora con una razón más para hacerlo: 1e-iii cambió el ritmo a bandas y
puso a responder los all-ins, así que lo que Victor va a sentir en tres partidas
no es lo mismo que habría sentido hace una tanda. Tres entradas —piso, medio,
techo— mirando si quince antes de fondo dan una mesa o una carrera, cada cuánto
salta la recarga automática, y si el compás nuevo se lee como tensión o como
espera.

**3 · Dos que sólo hay que saber.** **E-22**: un toque que no entra en el
showdown de mesa 5, una vez de cuatro, consignado sin taparlo con un plazo más
largo porque si a un arnés no le admite el toque, a un dedo tampoco. **E-23**: la
frase de capas nombra dos veces al asiento que gana dos capas; es de 1e-ii, se ve
más desde 1e-iii, y elegir entre agrupar o sumar es una decisión de voz.

Y las dos de siempre: **E-4** (el aviso `inert` de React, deuda de la cáscara) y
el rojo de 133 ms de `diagCEL0`, que es de CEL-2c.

### Lo que 1e NO hizo, a propósito

No movió una sola cifra de economía: piso, medio, techo, el factor 1,5 de la pila
de las IAS y el listón de cinco apuestas son los que 1c-2 y el normativo
sellaron. No abrió PvP, ni `salas.js`, ni SQL, ni persistió el saldo (ECO-1). No
abrió las dos hojas de estilo protegidas en ninguno de los tres STOP. Y no
commiteó: el árbol queda sobre `f9ee503`, entero y sin sellar, esperando la ficha
de commits.

### Lo que viene

**1f** —el guion de lo que Victor mira en el teléfono— y el **normativo v1.1**,
que sobre los nueve puntos de 1c-2 tiene ahora que sumar cuatro más, todos
medidos en esta fase:

1. **Un all-in debe ser respondido por todo pendiente** (E-13). Es regla, no
   detalle de implementación, y el normativo no la dice hoy.
2. **§4.3 es regla del motor**: una ronda de apuesta que no se puede jugar no se
   salta, **no existe** — y quien decide si una fase existe es el motor.
3. **Las dos rutas de D-12**, una real y cerrada por dos puertas, la otra
   demostrada inalcanzable antes de 1e-iii y cerrada por el motor después.
4. **La nota de D-29** y la corrección de la tabla de entrada de
   `Modos_y_Asistencia` §3.3, que D-3 de 1a dejó apuntando a cifras viejas.
