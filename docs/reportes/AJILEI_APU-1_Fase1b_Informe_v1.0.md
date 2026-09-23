# AJILEI · APU-1 · Fase 1b — Informe de ejecución · v1.0

**Campaña:** APU-1 — Apuestas, pilas y agresividad de las IAS
**Fase:** 1b — Motor puro: `pozos.js`, entrada por asiento, all-in y capas
**Ficha:** `AJILEI_APU-1_Fase1b_v1.0.md` · **Normativo:** `docs/AJILEI_APU-1_Reglas_v1.0.md`
**Tabla de ediciones:** `docs/reportes/AJILEI_APU-1_Fase1a_Informe_v1.0.md §C`
**Base:** `main` en `f9ee503` + las cuatro escrituras documentales de 1a, sin commitear
**Fecha:** 2026-09-17

> **Estado: STOP-2 alcanzado.** Las dos tandas cerradas, sin commits. El
> informe cubre 1b-i (§2 de la ficha) y 1b-ii (§3), y marca cada bloque con la
> tanda a la que pertenece.

---

## §A · Línea base

Medida antes de escribir nada, sobre `f9ee503` + las cuatro escrituras de 1a.

| Vara | Antes de 1b | Tras 1b-i | Tras 1b-ii | Δ total |
|---|---|---|---|---|
| `npm run lint` | 21 (20 errores, 1 aviso) | 21 | **21** | 0 |
| `npx vitest run` | 685 en 26 archivos | 721 en 28 | **745 en 29** | +60 pruebas, +3 archivos |
| Protegidos intactos al blob | 6 / 6 | 6 / 6 | **4 / 4 no autorizados** | 0 |

Blobs de los seis protegidos **al arrancar** (`git hash-object`, 12 primeros).
Los cuatro que esta ficha no autoriza siguen en esta misma cifra al cerrar; los
dos autorizados están abiertos y su diff va en §B:

| Protegido | Blob al arrancar | Blob al cerrar | |
|---|---|---|---|
| `src/engine/gameEngine.js` | `6ddadd536eb8` | `8b29b6443be6` | abierto (autorizado) |
| `src/engine/deck.js` | `ad6769a761d5` | `bfb44c03786c` | abierto (autorizado) |
| `src/engine/aiPlayer.js` | `0860812af936` | `0860812af936` | **INTACTO** |
| `src/config/seatLayouts.js` | `0d1bb8ea66a8` | `0d1bb8ea66a8` | **INTACTO** |
| `src/styles/opponentPanel.css` | `3ce6383eec0d` | `3ce6383eec0d` | **INTACTO** |
| `src/styles/gameTable.css` | `1e21371c8543` | `1e21371c8543` | **INTACTO** |

Los blobs de arranque coinciden con la columna **blob git** de
`AJILEI_Protegidos_v1.0.md §3` (v1.4). La columna `sha256` de esa tabla sigue sin
reproducir en tres filas; es el hallazgo **D-2** de la Fase 1a y no se toca aquí.

Los dos blobs nuevos —`gameEngine.js` `8b29b6443be6` y `deck.js`
`bfb44c03786c`— son los que la ficha de commits tendrá que sellar en
`Protegidos §3` cuando esto se commitee. **No los escribo yo en ese documento:**
esta ficha no lo abre.

---

## §B · Lo escrito, por archivo

### Tanda 1b-i — módulos puros

Cinco escrituras. Ninguna en un archivo protegido; ninguna en `src/components/`,
`src/screens/`, `src/hooks/`, `src/lib/`, `supabase/` ni en la sonda.

| Archivo | Estado | Líneas | Qué es |
|---|---|---|---|
| `src/engine/pozos.js` | nuevo | 271 | Legalidad, costo, acciones y capas del pozo (ficha §2.1) |
| `src/engine/entrada.js` | nuevo | 83 | Entrada a la mesa y pila de las IAS (ficha §2.2) |
| `src/config/ajileiConfig.js` | modificado | +22 −4 | Parámetros de §10; retiro de las cuatro claves muertas (ficha §2.3) |
| `scripts/testPozos.test.js` | nuevo | 360 | 26 pruebas, 82 aserciones |
| `scripts/testEntrada.test.js` | nuevo | 88 | 11 pruebas, 26 aserciones |

### `src/engine/pozos.js`

Seis funciones exportadas con las **firmas fijadas por la ficha**, más dos
constantes de contrato (`MOTIVOS`, `ACCIONES`). Sin estado de módulo, sin
React/DOM/Howler/Node, sin importar `gameEngine.js`.

```js
export function costoDe(state, seat, accion, k = 1)
export function esLegal(state, seat, accion, k = 1)
export function accionesDe(state, seat)
export function capasDe(state)
export function ganadoresPorCapa(state, puntajeDe)
export function repartirCapas(state, ganadores)
```

Tres decisiones de escritura que conviene que el rector vea:

1. **`accionesDe` se DERIVA de `esLegal`**, no repite sus condiciones:
   `ACCIONES.filter(a => esLegal(state, seat, a, 1).ok)`. Por construcción no
   pueden divergir, que es exactamente el defecto que describe R-5. Efecto
   lateral querido: fuera de turno, fuera de las fases con apuesta, o para un
   retirado / all-in / eliminado, devuelve `[]`.
2. **La «apuesta viva» se evalúa POR ASIENTO**, como `currentBet − contrib > 0`,
   no como `currentBet > 0`. Así el asiento que ya igualó puede pasar y el que
   no, no; y el ante (que no toca `contrib`) no bloquea la primera ronda.
3. **El desempate por cercanía a la Mano se replica**, no se importa
   (`gameEngine.js:157-163`), para que `pozos.js` no dependa de un protegido.
   Son ocho líneas duplicadas a propósito; van anotadas en el archivo.

### `src/engine/entrada.js`

Las seis firmas de la ficha §2.2 **más `medioDe(unit, cfg)`** (ver D-3). `cfg`
es `AJILEI_CONFIG` por defecto e inyectable. No lo consume nadie todavía: es de
la Fase 1e.

### `src/config/ajileiConfig.js`

**Entran** (normativo §10, SELLADO): `betting.multiplicadores = [1,2,5,10]` ·
`betting.entradaMesa = { piso: 5, medio: 15, techo: 50 }` ·
`betting.recarga = { umbral: 5, plazoMs: 10000 }` · `ia.margenPila = 1000`.

**Se retiran:** `betting.subidaMinima`, `betting.subidaMaximaPorAccion`,
`betting.maximoPorRonda`, `betting.allInEnabled`. Verificado por `grep` antes de
borrar: **cero lectores** en `src/`, `scripts/` y `supabase/` (el único eco está
en la copia del motor de la sonda, `supabase/functions/sonda_mot1/motor/config/`,
que esta ficha no toca).

**Se conservan:** `economy.saldoInicial` (D-5 de 1a, se retira en 1e) y
`betting.apuestaMinima` (lo lee `gameEngine.js:19`).

**Renombrado en 1b-ii (§3.1):** el viejo `betting.entrada = 10` pasa a
`betting.unidadPorDefecto` —no tenía nada que ver con la entrada a la mesa— y el
nombre `entrada` queda para el objeto `{ piso, medio, techo }`, que es lo que el
normativo §10 pide. `entrada.js` no necesitó edición: lee los dos nombres (D-4).

### Tanda 1b-ii — el motor

Tres escrituras de código y tres de pruebas. Se abren **solo** los dos
protegidos que la ficha autoriza, y solo en los rangos de §C.

| Archivo | Δ | Rangos tocados |
|---|---|---|
| `src/engine/gameEngine.js` | **+220 −73** | E-1 `:1-5` · E-0 `:20` · E-2 `makePlayer` · E-3 `createInitialState` · E-5/E-6 + `primerTurno` · E-7 `resolveWinner` · E-8 `doShowdown` · E-9 `advanceBettingPhase` y el reset de `applyDiscard` · E-10 `applyBetAction` · E-11 `startHand` + `aplicarRecarga` · E-12 `applyPlayerBetAction` y `applyAIBetAction` |
| `src/engine/deck.js` | **+13 −1** | D-1: `rng`, `setRng`, `resetRng`, y `shuffleDeck` llamando a `rng()` donde llamaba a `Math.random()` |
| `src/config/ajileiConfig.js` | (incluido arriba) | §3.1: renombre de `entrada` → `unidadPorDefecto` y de `entradaMesa` → `entrada` |
| `scripts/testMotorAPU1.test.js` | **nuevo, 351 líneas** | 23 pruebas, 72 aserciones |
| `scripts/testEngine.test.js` | +25 −10 | dos cambios de veredicto (§C) |
| `scripts/testEliminations.test.js` | +6 −2 | un cambio de veredicto (§C) |
| `scripts/testNivel1.test.js` | +6 −1 | conductor adaptado, veredicto intacto |
| `scripts/testNivel2.test.js` | +14 −2 | conductor adaptado (dos sitios), veredicto intacto |
| `scripts/bancoNiveles.mjs` | +20 −10 | conductor del asiento 0 adaptado (D-15) |

**Lo que NO se tocó:** `aiPlayer.js`, `seatLayouts.js`, `opponentPanel.css` y
`gameTable.css` (intactos al blob); nada de `src/components/`, `src/screens/`,
`src/hooks/`, `src/lib/`, `src/config/textos*`, `supabase/` ni la sonda;
`applyDiscard` salvo su línea de reset de ronda, `toggleDiscard`,
`advanceFromDeal`, `PHASES`, `handRules`, el comodín y la rotación Mano/Pie.

**Las dos formas transitorias**, marcadas con `// TRANSITORIO` para que
`grep TRANSITORIO src/` las encuentre:

1. `createInitialState(unit, n)` con `n` numérico construye la mesa de hoy
   (E-3). La usa `GameTable.jsx:306` y ~180 pruebas.
2. `applyPlayerBetAction(state, action, betAmount)` traduce el monto de la
   pantalla a multiplicador (E-12). Un solo sitio.

Hay una tercera, marcada `// TRANSITORIO hasta 1c`: el puente de
`applyAIBetAction` (D-11).

---

## §C · Pruebas nuevas

**60 pruebas nuevas, 0 fallos** — 37 en 1b-i (36 + la de D-7) y 23 en 1b-ii.
180 aserciones escritas, 186 ejecutadas (las cuatro del invariante
`Σ capas === pot` comparten cuerpo). Reparto contra los mínimos de la ficha:

| Bloque | Ficha | Mínimo | Escrito | Pruebas |
|---|---|---|---|---|
| `capasDe` | §2.4 | 8–10 | **24 aserciones (30 ejecutadas) / 10 pruebas** | 1–10 |
| `ganadoresPorCapa` + `repartirCapas` | §2.4 | 5–6 | **23 / 7** | 11–17 |
| `esLegal` / `costoDe` / `accionesDe` | §2.4 | 8–10 | **35 / 9** | 18–26 |
| `entrada.js` | §2.4 | 5–6 | **26 / 11** | 27–37 |
| `applyBetAction` | §3.3 | 6–8 | **22 / 7** | 38–44 |
| `isRoundOver` / `nextActiveIndex` | §3.3 | 4–5 | **8 / 3** | 45–47 |
| `resolveWinner` / `doShowdown` | §3.3 | 4–5 | **13 / 4** | 48–51 |
| `createInitialState` / `startHand` / `aplicarRecarga` | §3.3 | 5–6 | **21 / 5** | 52–56 |
| `deck.js` | §3.3 | 2 | **5 / 2** | 57–58 |
| traducción transitoria (extra) | — | — | **3 / 2** | 59–60 |

### `scripts/testPozos.test.js` (26)

**`pozos.capasDe` — capas del pozo (§4.2)**

1. sin all-in hay una sola capa con todo el pozo y todos los vivos elegibles
2. un all-in parte el pozo en dos: la capa que él disputa y la superior sin él
3. dos all-in a niveles distintos dan tres capas, cada una con menos elegibles
4. un all-in POR DEBAJO del ante también hace capa (§2.4: el corte es «menos de un ante»)
5. el retirado deja su dinero en la capa pero no es elegible en ninguna
6. la capa de monto 0 se omite (todos al mismo nivel: no hay capa superior)
7. `Σ capas === pot` en mesa de 2 con contribuciones arbitrarias
8. `Σ capas === pot` en mesa de 3 con contribuciones arbitrarias
9. `Σ capas === pot` en mesa de 4 con contribuciones arbitrarias
10. `Σ capas === pot` en mesa de 5 con contribuciones arbitrarias

**`pozos.ganadoresPorCapa` y `repartirCapas` (§4.2)**

11. sin all-in gana una sola capa el de mayor puntaje
12. cada capa puede tener un ganador distinto
13. el empate DENTRO de una capa lo rompe la cercanía a la Mano
14. la capa superior con un solo elegible vuelve entera a quien la puso
15. el reparto conserva el pozo exacto, en enteros y sin sobrante
16. **una capa sin elegibles vuelve entera a quien la puso, y el pozo cuadra igual** ← D-7
17. `repartirCapas` no muta el estado que recibe

**`pozos.costoDe` (§3.2)**

18. las cinco acciones con costo dan la cifra exacta, y las gratis dan 0

**`pozos.esLegal` — los diez motivos de rechazo (§3.2)**

19. cada motivo sale en su caso y no en otro *(16 aserciones: los diez motivos)*
20. retirarse es legal siempre que sea tu turno, haya apuesta o no

**`pozos.accionesDe` — la fila de acciones (§4.1)**

21. sin apuesta viva se puede pasar, apostar o retirarse
22. con apuesta viva que la pila cubre: igualar, subir o retirarse
23. subir exige cubrir al menos el ×1; si no, desaparece
24. si la pila no cubre la apuesta viva, «igualar» se sustituye por «allIn»
25. un retirado, un all-in, un eliminado o quien no tiene el turno no tienen acciones
26. toda acción ofrecida es legal: `accionesDe` y `esLegal` no pueden divergir

### `scripts/testEntrada.test.js` (11)

27. reproduce la tabla sellada de las cuatro mesas
28. acepta múltiplos enteros de la apuesta de mesa entre piso y techo
29. rechaza lo que no es múltiplo entero y positivo de la apuesta
30. rechaza por debajo del piso y por encima del techo, con motivo propio
31. sigue el ejemplo del normativo: mesa 100, entra 2.500 → cada IA 3.500
32. el techo de la mesa topa la fórmula: entra 4.000 o más → todas a 5.000
33. el margen es fijo en HC y no escala con la apuesta de mesa
34. completa hacia arriba tras la recarga
35. nunca baja: a la IA que ya va por encima no se le quita nada
36. da la lista que la Fase 1e le pasará al motor: humano con su entrada, IAS con su pila
37. quien entra al techo se sienta exactamente igual que las IAS

Las fixtures de estas dos son estados sintéticos escritos a mano. **No se llama
a `createInitialState` ni se importa `gameEngine.js`**, como manda la ficha
§2.4: la puerta STOP-1 no podía depender de un motor todavía sin tocar.

### `scripts/testMotorAPU1.test.js` (23) — tanda 1b-ii

Archivo nuevo, como permite la ficha §3.3. Aquí las fixtures **sí** son mesas
reales: `createInitialState → startHand → advanceFromDeal`, con las fichas de un
asiento forzadas para provocar el all-in. Lo único sintético son las cartas del
showdown, para poder fijar quién gana cada capa.

**`applyBetAction` · la acción ilegal no se aplica (§3.2)**

38. devuelve EL MISMO objeto de estado, no una copia
39. ya NO reescribe en `retirarse` lo que no se puede pagar

**`applyBetAction` · all-in defensivo (§4.1)**

40. no reabre la ronda: el `acted` de los demás queda intacto
41. no termina la mano antes de tiempo
42. el asiento en all-in cuenta para el pozo y NO para el turno
43. `contribMano` acumula el ante y todo lo puesto en las rondas
44. quedarse sin fichas pagando justo también deja el asiento en all-in

**`isRoundOver` y `nextActiveIndex` con all-in (§4.3)**

45. la ronda cierra cuando queda un solo jugador con fichas
46. la ronda siguiente no se queda esperando al asiento en all-in
47. el asiento en all-in descarta con normalidad: el descarte no toca dinero

**`doShowdown` reparte por capas (§4.2)**

48. dos capas con ganadores distintos: cada una va a su mejor elegible
49. la capa superior vuelve a quien la puso aunque pierda la mano
50. el pozo queda en 0 y las fichas de la mesa se conservan exactamente
51. el último en pie cobra el pozo entero (ruta de retiro, sin capas)

**`createInitialState`, `startHand` y `aplicarRecarga`**

52. acepta la lista de jugadores con las fichas de cada asiento
53. la forma numérica transitoria da exactamente la mesa de hoy
54. el ante de cada mano entra en `contribMano`
55. el asiento 0 quebrado con ≥2 vivos ya NO termina la mesa (§5.4)
56. la recarga solo vale entre manos, y suma a la pila y a la entrada

**`deck.setRng` / `resetRng` (§6.11)**

57. con un generador fijo el barajado es determinista y repetible
58. `resetRng` devuelve el barajado a `Math.random`

**Traducción transitoria** (no la pedía la ficha; la escribo porque la forma
desaparece en 1e y conviene que su retirada rompa una prueba con nombre)

59. el monto que manda la pantalla llega al motor como `k`
60. sin monto apuesta el ×1, como hasta hoy

### Cambios de veredicto: tres, no los tres que la ficha nombraba

Ninguna prueba se borró. Las que cambian de veredicto lo hacen porque **la regla
cambió**, y cada una lleva el porqué escrito encima.

| Prueba | Antes | Ahora | Manda |
|---|---|---|---|
| `testEngine §6` · «N=2: player con 0 fichas intenta igualar» | retiro automático → PAYOUT, gana la IA | `igualar` es ilegal y devuelve el mismo objeto; `allIn` lo sostiene sin retirarlo | E-10(b) |
| `testEngine §7` · «AI se retira → player gana» | la IA sin fichas se retiraba → PAYOUT | la IA va all-in, la ronda cierra y la mano sigue (DEAL_3) | E-10(b) |
| `testEliminations` · «humano eliminado con ≥2 vivos → GAME_OVER» | GAME_OVER | la mesa sigue: DEAL_2, el humano eliminado, `aliveCount` 2 | E-11(c) |

La ficha §3.3 preveía que cambiaran «las tres del bloque 6». Solo **una** de ese
bloque era del retiro forzoso; las otras dos son de la eliminación por no cubrir
el ante, que §2.4 conserva y que siguen pasando sin tocarse. Las otras dos
verdaderas están en sitios que la ficha no había mirado, y las dos las manda una
edición suya (ver D-14).

**Conductores adaptados, veredicto intacto** (`testNivel1`, `testNivel2` ×2 y
`bancoNiveles.mjs`): pedían `igualar` sin comprobar si la pila cubría, contando
con que el motor lo reescribiera en `retirarse`. Ahora preguntan y caen al
all-in. Lo que la prueba afirma no cambió en ninguna.

---

## §D · Hallazgos y desviaciones

D-1 a D-8 son de la tanda 1b-i y quedaron resueltos por el rector en el STOP-1;
se conservan tal cual con su resolución anotada. D-9 en adelante son de 1b-ii.

### D-1 · `pozos.js` importa `ajileiConfig.js`, que la ficha no listaba

La ficha §2.1 dice «importa solo `./handEvaluator.js` si lo necesita y **nada**
de React/DOM/Howler/Node». `pozos.js` no importa `handEvaluator` (no lo
necesita: el puntaje se inyecta), pero **sí importa `AJILEI_CONFIG`** para leer
`betting.multiplicadores`.

La alternativa era escribir `[1, 2, 5, 10]` dentro de `pozos.js`, y eso choca con
el normativo §0: «todo parámetro se implementa como **parámetro**, nunca como
constante suelta, para que la simulación pueda barrerlo». Como la firma de
`esLegal` está **fijada** por la ficha, no hay por dónde inyectar un `cfg`. Se
resolvió por el import, que no es React/DOM/Howler/Node sino un módulo de datos
plano. **Si el rector prefiere la firma con `cfg`**, es un parámetro opcional al
final de `esLegal`, `costoDe` y `accionesDe`, y una edición de una línea en cada
una.

### D-2 · Un décimo motivo que la ficha no nombra: `accion_desconocida`

La ficha lista nueve motivos. El `switch` de `esLegal` necesita un `default`
—igual que el de `applyBetAction` lo necesitará en E-10(g)— y ese caso no tiene
nombre en la lista. Se escribió **`'accion_desconocida'`**. Es contrato del
árbitro de MOT-1, así que el rector debería confirmarlo o renombrarlo antes de
que MOT-1 lo lea.

### D-3 · `entrada.js` lleva una séptima función, `medioDe`

La ficha lista seis. El selector de §2.2 tiene **cuatro** botones —`Mínimo 5×`,
`Medio 15×`, `Techo 50×`, `Otra…`— y `betting.entradaMesa.medio = 15` está en la
tabla §10, pero ninguna de las seis firmas devolvía el medio. Se añadió
`medioDe(unit, cfg)`, de una línea, con el mismo molde que `pisoDe`/`techoDe`.
Sin ella, la Fase 1e tendría que multiplicar por su cuenta y volveríamos a tener
aritmética de dinero fuera de estos módulos.

### D-4 · La clave `betting.entradaMesa` es provisional y ya está resuelta

La ficha §2.3 avisa de la colisión: hoy `betting.entrada` es el número 10 que
`gameEngine.js:20` usa como unidad por defecto. La clave nueva se llama
`betting.entradaMesa` hasta que la §3.1 renombre la vieja a
`betting.unidadPorDefecto`.

`entrada.js` **no necesitará edición** cuando eso pase: lee
`betting.entradaMesa ?? betting.entrada` y se queda con la que sea un objeto. Un
solo lector, tolerante a los dos nombres, anotado en el archivo.

### D-5 · Los motivos de `entradaValida` no estaban fijados

La ficha fija los nueve motivos de `esLegal` pero no los de `entradaValida`. Se
escribieron tres: **`monto_invalido`** (no entero, ≤ 0, o no múltiplo de la
apuesta de mesa), **`bajo_piso`** y **`sobre_techo`**. Se separan piso y techo
porque la pantalla de §2.2 tiene que decir cosas distintas —«no llegas al
mínimo» frente a «te pasas del techo»— y con un solo motivo tendría que volver a
comparar por su cuenta.

### D-6 · `entradaValida` no mira el saldo real, a propósito

El normativo §2.2 dice que la entrada se descuenta del saldo real y que las
mesas cuyo 5× no se cubre no se pueden escoger. **Eso no está aquí.** `entrada.js`
es puro y no conoce el saldo; hasta ECO-1 el saldo real es una constante
(`saldo_de`) y el lector vive en `saldo.js`, que esta ficha no abre. La regla
«¿alcanza el saldo?» es de la pantalla de 1e. Queda escrito en el archivo para
que 1e no lo busque aquí.

### D-7 · Una capa sin elegibles es aritméticamente posible y no es alcanzable jugando

Si el nivel de all-in más alto lo marca un asiento vivo, pero un **retirado**
contribuyó por encima de ese nivel y **todos** los no retirados están en all-in,
la capa superior tiene monto > 0 y elegibles `[]`. `ganadoresPorCapa` devuelve
`-1` para esa capa y `repartirCapas` la deja sin repartir: sería el único caso en
que `Σ repartido < pot`.

**No es alcanzable en juego**: para que un asiento se retire habiendo puesto más
que el mayor all-in vivo, alguien tiene que haberle subido por encima, y ese
alguien —si no está en all-in— es elegible de la capa superior; y si está en
all-in, su propia contribución pasa a ser el nivel más alto y la capa superior
queda en 0. Se deja documentado en `pozos.js` y **no se inventa una regla de
reparto**: si el rector quiere una (lo natural sería devolver el sobrante a quien
lo puso, como hace el póker con la apuesta no igualada), es una línea en
`repartirCapas` y una prueba más.

> **Resuelto por el rector (STOP-1): la regla se añade.** «El árbitro de MOT-1
> no puede tener un caso donde `Σ repartido < pot`: el invariante debe ser
> total, no *salvo un caso que demostramos imposible*». Implementado en
> `repartirCapas`: la capa sin elegibles vuelve a quien la puso, cada uno
> `C_i − min(C_i, a_n)`, reparto exacto en enteros y sin división. Prueba 16.
>
> Al escribirlo apareció una precisión que la demostración de arriba no tenía:
> **solo la capa superior puede quedarse sin elegibles**, porque toda capa
> intermedia tiene al menos al all-in que la define (su `C_i` es exactamente el
> nivel, y no está retirado). Eso es lo que permite devolver el tramo sin
> arrastrar los límites de cada capa por el código.

### D-8 · El conteo de la ficha §2.4 es de aserciones, no de pruebas

La columna dice «Aserciones» y los casos obligatorios de `esLegal` son «los
nueve motivos, **uno por prueba**»: nueve pruebas no caben en «8–10
aserciones». Se leyó la columna como aserciones (que es lo que dice) y los diez
motivos se afirman en una sola prueba con una aserción cada uno. Los dos números
—pruebas y aserciones— están en la tabla de §C para que el rector los vea por
separado.

---

### D-9 ⚠ · El rango de E-9 se extendió a la línea que abre cada ronda

**Es la única salida de rango de toda la tanda.** La ficha §1.2 manda STOP ante
cualquier necesidad de salirse; la anoto aquí en vez de parar porque la línea
está dentro del mismo `return` que E-9 sí autoriza, y porque sin ella la app no
funciona, que es lo que §1.3 exige al cierre.

E-9 autoriza el reset por ronda en `advanceBettingPhase` (`:210`) y en
`applyDiscard` (`:529`). Las dos funciones fijan, en la línea siguiente del
mismo objeto, **quién abre la ronda**: `activePlayerIndex: state.manoIndex`. Con
all-in en la mesa eso deja el turno en un asiento que no puede actuar, y la mesa
se queda clavada: el humano no tiene botones y la IA propondría su acción una y
otra vez contra un motor que devuelve el mismo estado.

No es un caso raro. Es **el camino más común del all-in en mesa de 2**: el
asiento 1 no cubre, va all-in en `BET_1`, y `BET_2` abre en la Mano —que puede
ser él—. Se resolvió con `primerTurno(players, desde)`, que devuelve el primer
asiento desde `desde` **incluido** que no está retirado, ni en all-in, ni sin
fichas. Leo «fijar quién abre la ronda» como parte del reset de ronda que E-9
nombra; si el rector lo lee de otro modo, es una edición E-9b en la ficha de
commits y no cambia una línea del código.

### D-10 ⚠ · §4.3 «las rondas de apuesta restantes no existen» NO está implementado

El normativo dice que si queda un solo jugador con fichas, las rondas que faltan
no existen y la mano sigue por reparto y descarte directo al showdown. **Eso
exige enrutar fases**, y las dos puertas que enrutan son `advanceFromDeal`
(`DEAL_3 → BET_2`) y `applyDiscard` (`→ BET_3`), que la ficha §3.1 prohíbe
expresamente tocar. No hay tercera vía dentro de los rangos autorizados.

Lo que hace 1b en su lugar: `isRoundOver` cierra la ronda en cuanto los
pendientes son ≤ 1 (E-5, literal), y `primerTurno` la abre en el único que puede
actuar. **La ronda existe pero se agota con un `pasar`.** Consecuencias medidas:

- No se pierde ni se gana dinero. Si ese jugador apostara en una ronda seca,
  nadie puede igualarle y su apuesta le vuelve entera por la capa superior, de
  la que es el único elegible. El pozo cuadra en todos los casos.
- La pantalla enseña una ronda de apuesta que el normativo dice que no debería
  estar, y ofrece «Apostar». `pozos.accionesDe` la sigue considerando legal
  porque la legalidad de §3.2 no habla de rivales.

**Es trabajo de otra ficha.** Cuando se escriba, el sitio limpio es
`accionesDe`: negar `apostar` y `subir` cuando no queda rival con fichas deja la
ronda inofensiva sin tocar el enrutado; y el enrutado propiamente dicho necesita
autorización sobre `advanceFromDeal` y `applyDiscard`.

### D-11 · `applyAIBetAction` necesitó un puente que la ficha daba por innecesario

La ficha dice de E-12 «no se toca en 1b (es 1c)», y a la vez pide asegurarse de
que pase `k = 1`. Hizo falta algo más: al retirar las tres guardas de reescritura
(E-10b), **una acción ilegal de la IA ya no se convierte en `retirarse` sino que
no hace nada**, y como el estado vuelve idéntico, el temporizador de la pantalla
la vuelve a pedir en bucle. La IA todavía no consulta `pozos.js` —eso es 1c—, así
que propone `igualar` cuando no cubre en cuanto hay una apuesta que le supera.

Puente, marcado `// TRANSITORIO hasta 1c`: si la propuesta no es legal, se toma
la primera de `accionesDe` en el orden `allIn → igualar → pasar → retirarse`. Es
determinista y defensivo, y en cuanto 1c haga que la IA pregunte, deja de
dispararse. Lo desmonta 1c.

### D-12 · Quedarse sin fichas pagando justo también marca `allIn`

E-10(e) describe la rama `allIn`. Pero un asiento puede quedarse en cero
**igualando**, cuando lo que falta es exactamente lo que tiene. Si eso no marcara
`allIn`, su nivel no haría capa y un rival podría después apostar dinero que
nadie puede disputarle, con el reparto mintiendo. Regla escrita: *cualquier
acción que deje la pila en cero deja el asiento en all-in*. Es lo que dice §4.1
—«no puede seguir apostando»— y lo mide la prueba 44.

### D-13 · El all-in con la pila ya en cero es legal, a propósito

Primero lo escribí rechazado (`no_alcanza`). Lo cambié: un asiento con la pila
en cero que aún no está marcado **ya puso dinero en el pozo esta mano**, y
forzarlo a retirarse se lo quitaría — que es exactamente el defecto que APU-1
corrige. Poner 0 no mueve dinero, pero lo deja marcado y en pie para disputar
las capas que sí pagó. Solo es alcanzable desde un estado sintético (en juego,
D-12 lo marca antes), y es lo que hace pasar las dos pruebas que cambian de
veredicto sin inventarles una regla.

### D-14 · Dos cambios de veredicto más de los que la ficha había visto

La ficha §3.3 nombra «las tres del bloque 6» de `testEngine`. De ese bloque solo
**una** era del retiro forzoso. Las otras dos que cambian están en sitios que la
ficha no miró, y las dos las manda una edición suya:
`testEngine §7` «AI se retira → player gana» (E-10b) y `testEliminations`
«humano eliminado con ≥2 vivos → GAME_OVER» (E-11c). Las tres están en la tabla
de §C con su antes y su después. Ninguna se borró.

### D-15 · `bancoNiveles.mjs` tenía el mismo defecto que el motor

`j0Pasivo` devuelve `igualar` sin mirar si la pila cubre —su comentario lo dice:
«el motor puede forzarle el retiro por saldo, y eso es regla del motor»—. Con la
reescritura retirada, la ronda no converge y el banco muere con
`ronda BET_3 sin converger`. Es la misma lección que R-5: el «no cubre» vivía en
cuatro sitios y el banco era un quinto.

Adaptado igual que los conductores de prueba: pregunta `accionesDe(s, 0)` y cae
al all-in antes que al retiro. `bancoNiveles.mjs` no es protegido y no mide
geometría; el veredicto del banco no cambia por esto, pero **sí cambia por las
reglas nuevas**, que es de lo que habla §E.

### D-16 ⚠ · `--bandas` sin `--nivel` no compara NADA

La vara 3 de la ficha §3.4 es `node scripts/bancoNiveles.mjs --bandas`. Corrida
así, el banco usa su nivel por defecto (`basico`) y **las 12 celdas salen «SIN
BANDA SELLADA (celda nueva)»**: las 36 bandas de `nivCAL_bandas.json` son todas
de `avanzado` y de `pro`. El resumen final dice **VERDE** habiendo comparado
cero celdas.

No lo causa esta fase —es así desde que se selló la vara— pero invalida la
puerta tal como la ficha la escribe. La puerta real son dos corridas:
`--bandas --nivel avanzado --duelo basico` (16 celdas) y
`--bandas --nivel pro --duelo avanzado,basico` (20 celdas). Son las que están
en §E. **Propuesta:** que la ficha de commits cambie la vara 3 por esas dos, o
que el banco avise en vez de decir VERDE cuando no ha comparado ninguna celda.

### D-17 · El arnés de mesa corre contra el servidor de desarrollo, no contra `preview`

La vara 4 pide `npm run build` y `npx vite preview`. `diagDSK.mjs` apunta por
defecto a `http://localhost:5173`, que es el servidor de desarrollo, y ahí es
donde funciona: en `preview` la Portada existe y el arnés no llega al lobby
(`waiting for locator('main.lobby [data-accion="jugar-ia"]')`, 30 s y fuera),
porque el bypass de autenticación vive en `.env.local`. Se corrió `npm run build`
(verde) **y** los dos modos contra 5173. Es cómo se ha corrido siempre este
arnés; lo anoto porque la ficha pide otra cosa.

## §E · `bancoNiveles.mjs --bandas`

La ficha avisa: «si sale fuera de banda con `aiPlayer.js` intacto, es hallazgo
del motor, no de la IA — se consigna y STOP». **Salió fuera de banda.** Va aquí
con todo lo que hace falta para decidir si es un fallo o la banda vieja.

`aiPlayer.js` está intacto al blob en las dos corridas.

### La corrida que pide la ficha no compara nada

`node scripts/bancoNiveles.mjs --bandas` → **VERDE**, y las 12 celdas dicen
`SIN BANDA SELLADA (celda nueva)`. Es D-16: corre `basico` y las bandas selladas
son de `avanzado` y `pro`. Un verde sobre cero comparaciones.

### La puerta real — `avanzado`

`--bandas --nivel avanzado --duelo basico` · 16 celdas · ~100.000 manos por celda.

**BANDAS DE REGRESIÓN: ROJA** (umbral 4,03σ, familia 48). **15 de 16 verdes.**
La única roja:

| Celda | Métrica | Sellado | Nuevo | σ |
|---|---|---|---|---|
| `mesa2\|avanzado\|aleatorio\|j0=avanzado` | `fichasPorMano` | −1,6169 | **−1,5560** | **4,22** |

El asiento 0 **pierde menos** que antes: +0,061 fichas por mano sobre una unidad
de 50. La desviación está a un pelo del umbral (4,22 contra 4,03), y es la única
de 48 métricas comparadas.

**Por qué era de esperar, y por qué eso no la absuelve del todo.** La banda se
selló con el retiro forzoso vigente: quien no cubría perdía en el acto todo lo
que ya había puesto. Con APU-1 ese asiento va all-in y **compite por la capa que
sí pagó**, así que recupera parte de lo que antes regalaba. El signo es el
correcto (pierde menos) y la mesa donde más pesa es la de 2, que es donde el
all-in ocurre más a menudo porque no hay terceros que diluyan. El conductor
`aleatorio` es además el que más veces se queda sin cubrir, porque escoge sin
mirar la pila.

Lo que **no** demuestra esta corrida es que el tamaño del efecto sea el debido y
no haya además un error de reparto: 0,061 fichas/mano es pequeño y la evidencia
es de una sola celda. Lo que sí está medido con independencia es el reparto en
sí — el invariante `Σ capas === pot` en las cuatro mesas, la conservación de
fichas en el showdown y la devolución de la apuesta no igualada (pruebas 7–10,
16 y 50).

### La puerta real — `pro`

`--bandas --nivel pro --duelo avanzado,basico` · 20 celdas · ~100.000 manos por celda.

**BANDAS DE REGRESIÓN: VERDE** (umbral 4,10σ, familia 64). **20 de 20.** La peor
desviación de las 64 métricas es `fichasPorMano` en
`mesa2|pro|aleatorio|j0=pro`, **2,64σ** — la misma celda y la misma métrica que
en `avanzado`, con el mismo signo, pero a la mitad de tamaño.

### Las dos corridas juntas

| Corrida | Celdas | Métricas | Veredicto | Peor |
|---|---|---|---|---|
| `avanzado` | 16 | 48 | **ROJA** | 4,22σ · `mesa2\|avanzado\|aleatorio` |
| `pro` | 20 | 64 | **VERDE** | 2,64σ · `mesa2\|pro\|aleatorio` |

**112 métricas comparadas, una fuera.** El umbral que el propio banco aplica
crece con el tamaño de la familia: 4,03σ para 48, 4,10σ para 64. Si las dos
corridas se trataran como una sola familia de 112, ese umbral quedaría por
encima de 4,10 —extrapolando su propia escala, alrededor de 4,2σ— y la
desviación quedaría al filo. **No lo afirmo como veredicto**: el banco no hace
esa corrección y no la voy a inventar yo. Lo anoto porque es lo que hay que
mirar antes de tratar una sola roja marginal como un fallo de reparto.

El resto de puertas de `avanzado`, para que quede el contexto: **(4) sin
regresión contra basura, VERDE** en las cuatro mesas, con el asiento 0 ganando
bastante menos contra el conductor aleatorio que en la base (−4,16pp en mesa 2,
−1,24pp en mesa 5). Eso apunta en la misma dirección: el all-in defensivo
sostiene a quien antes se caía de la mano, y la basura aleatoria ya no cobra
tan fácil.

### Recomendación

**No re-sellar las bandas en esta tanda.** Re-sellar es declarar que la conducta
nueva es la correcta, y eso solo se puede afirmar después de 1c —cuando la IA
consulte `pozos.js` y deje de necesitar el puente de D-11— y de 1d, que es la
fase que fija las cifras de TRABAJO con simulación. Hasta entonces la vara vieja
sigue siendo útil justo como acaba de serlo: enseñando dónde se movió el juego.

---

## §F · Cierre

| Vara | Antes | Después | Veredicto |
|---|---|---|---|
| `npm run lint` | 21 | **21** | Δ = 0 |
| `npx vitest run` | 685 / 26 archivos | **745 / 29 archivos** | +60, 0 fallos |
| `npm run build` | verde | **verde** | 446 ms |
| `diagDSK.mjs o1` | 16/16 | **16/16** | Δ = 0 |
| `diagDSK.mjs msg` | passed | **passed** | Δ = 0 |
| `diagSAL.mjs sal` | 102/102 | **102/102** | Δ = 0 |
| `bancoNiveles --bandas` | — | **`avanzado` ROJA 1/16 · `pro` VERDE 20/20** | §E |
| Protegidos no autorizados | 4/4 INTACTO | **4/4 INTACTO** | Δ = 0 |

**Sin commits.** Sin `console.log`, sin sondas, sin archivos `_*.mjs` nuevos, sin
`npm install`. No se tocó `.gitignore` ni `supabase/functions/sonda_mot1/`.

Lo que 1c hereda y tiene que desmontar: el puente de `applyAIBetAction` (D-11).
Lo que necesita ficha propia: el enrutado de §4.3 (D-10) y la vara 3 (D-16).
