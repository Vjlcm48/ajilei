# AJILEI — Reglas de mano congeladas (`handRules`) · v1.0

> Tanda **HR-1**. Sucede a C4.4 (la mesa se encoge según jugadores vivos) y a
> TB-1 (tests de blindaje). Estado: vigente.

---

## 1. La regla oficial

Los parámetros de una mano —**valor del comodín**, **`ruleN` de puntuación** y
**tope de descarte**— se **congelan en el barajado del Pie**, según los
jugadores vivos **en la mesa** en ese momento.

- Los **retiros** (fold) durante la mano **no los alteran jamás**.
- La **eliminación por bancarrota** los altera **recién en el barajado de la
  mano siguiente**.
- Caso **todos-se-retiran-menos-uno**: gana por abandono, **sin cómputo** de
  manos.

La distinción que sostiene todo esto es la de dos estados de jugador que se
confunden con facilidad:

| Campo | Significado | Alcance | Quién lo escribe |
|---|---|---|---|
| `folded` | se retiró de **esta mano** | transitorio, se resetea cada mano | el camino de apuesta (`applyBetAction`) |
| `eliminated` | se quedó **sin fichas** | **permanente** en la sesión | solo `startHand`, al no poder pagar el ante |

`aliveCount` cuenta **no eliminados**. Nunca no-foldeados. Ese es el punto.

---

## 2. Tabla de verdad

Indexada por `ruleN` = **vivos al barajar** (no por el tamaño inicial de la mesa):

| `ruleN` | Comodín (7 de Oros) | `maxDiscard` | Ajilei reconocido |
|---|---|---|---|
| 2 | inactivo — vale sus 7 pts en Oros | 5 | natural (51) |
| 3 | inactivo — vale sus 7 pts en Oros | 5 | natural (51) |
| 4 | **activo, vale 10** | 5 | natural (51) |
| 5 | **activo, vale 11** | **3** | natural (51) **y comodín (52)** |

Cuando el comodín está activo se le excluye de su palo impreso (Oros) y su valor
se suma al **mejor palo** de la mano. Con él inactivo es una carta corriente.

Una mesa que **arranca** en 5 y baja a 3 vivos juega con `ruleN = 3`: sin
comodín y con tope de descarte 5. La reducción se aplica en el barajado
siguiente a la bancarrota, no en el instante en que alguien se queda a cero.

---

## 3. Por qué existe este documento

Un showdown real de mesa de 5 anunció `IA 2 gana con Espadas (31 pts)` cuando la
mano del humano valía 34 (Copas 23 + comodín 11). La investigación (**CM-1**,
**CM-2**, **CM-3**) descartó por medición tres causas estructurales:

- **CM-1** — ¿el comodín falla solo en el camino del humano? **No.** Humano e IAs
  pasan por la misma línea con los mismos parámetros; la contraprueba espejo da
  34 por ambos caminos.
- **CM-2** — ¿el fold decrementa `aliveCount`? **No.** 200 manos trazadas, cero
  incidencias; el camino de retiro solo escribe `folded`.
- **CM-3** — ¿un bundle obsoleto con semántica intermedia? **No.** Las cinco
  versiones históricas del motor, ejecutadas contra esa mano, dan 34. Y
  `getBestSuitScore` es byte-idéntico desde el primer commit del repositorio.

El frame quedó cerrado como estado HMR no commiteado, irreproducible. Pero la
investigación dejó al descubierto algo más incómodo que el caso original:

> La invariante «los parámetros no cambian dentro de la mano» se cumplía **por
> accidente**. Cinco puntos del código recalculaban `state.aliveCount ?? numPlayers`
> por su cuenta, y la garantía dependía de que nadie escribiera `aliveCount` a
> mitad de mano. Era una propiedad emergente de cuatro sitios de escritura, no
> una garantía. Un quinto la habría roto en silencio.

Y había una segunda grieta: la **UI derivaba la regla por su cuenta**. El chip de
comodín y el resaltado de cartas ganadoras calculaban `aliveCount >= 4`
independientemente del motor. Regla mostrada y regla aplicada podían divergir —
que es exactamente la contradicción que hizo irresoluble el caso CM.

---

## 4. Su encarnación en código

`startHand` deposita el snapshot en el estado, en el instante del barajado:

```js
export function makeHandRules(ruleN) {
  return {
    ruleN,
    comodinValue: getComodinValue(ruleN),   // null = comodín inactivo (<4 vivos)
    maxDiscard:   maxDiscard(ruleN),
  }
}
```

Está presente en **todos** los caminos que crean estado de mano: el normal, los
dos terminales (`alive <= 1` y humano en bancarrota) y la semilla de
`createInitialState` para la pantalla previa al primer barajado.

Los consumidores **solo leen**; ninguno recalcula:

| Consumidor | Lee |
|---|---|
| `doShowdown` | `ruleN`, `comodinValue !== null` |
| `advanceBettingPhase` (mensaje de descarte) | `maxDiscard` |
| `applyDiscard` | `maxDiscard` |
| `toggleDiscard` | `maxDiscard` |
| `aiPlayer.decideBetAction` | `ruleN`, `comodinValue !== null` |
| `aiPlayer.decideDiscard` | `ruleN`, `comodinValue !== null`, `maxDiscard` |
| `GameTable` — chip de comodín | `comodinValue` |
| `GameTable` — `isWinningCard` | `comodinValue !== null` |

`aliveCount` **sigue existiendo** con su semántica de siempre (conteo de la
mesa, usado por el layout responsive). Lo que ya no hace es alimentar reglas
fuera de `startHand`.

Con la UI leyendo el mismo objeto que el motor, la contradicción chip↔showdown
del caso CM es **imposible por construcción**: hay un solo origen para la regla
mostrada y la aplicada.

### Limpiezas que vinieron con la tanda

- **`compareHands` eliminada.** Código muerto, sin una sola llamada en el árbol.
  Invocaba `getBestSuitScore` **sin parámetros**, cayendo en los defaults
  (`numPlayers=2`, `comodinEnabled=false`): habría desactivado el comodín en
  silencio si alguien la hubiera cableado.
- **`isAjilei` sin default.** `numPlayers` pasa a ser obligatorio, por el mismo
  motivo: mejor un fallo ruidoso que un comodín que desaparece sin avisar.

---

## 5. Qué lo vigila

`scripts/testHandRules.test.js` — 7 tests:

| # | Fija |
|---|---|
| 1 | fold ≠ eliminación: dos IAs se retiran, `aliveCount` sigue en 5 y el comodín del humano vale 11 |
| 2 | congelación con folds en BET_1, BET_2 y BET_3 |
| 3 | tope de descarte estable (valor y ejercicio real vía `toggleDiscard`) |
| 4 | abandono sin cómputo |
| 5 | bancarrota diferida al barajado siguiente |
| 6 | `handRules` idéntico en todas las fases hasta PAYOUT |
| 7 | el barajado siguiente **sí** recalcula cuando la mesa se reduce |

Los tests 6 y 7 son complementarios a propósito: sin el 7, un `handRules` que se
congelara *para siempre* pasaría el 6 sin problema.

---

## 6. Al modificar esto

- Si añades un consumidor de reglas, **léelo de `state.handRules`**. No
  reintroduzcas `state.aliveCount ?? numPlayers`: es el patrón que esta tanda
  vino a erradicar.
- Si construyes estado de mano sintético (fixtures de test), inclúyelo con
  `makeHandRules(...)` del motor, no con un literal a mano.
- El único sitio autorizado para **escribir** `handRules` es `startHand` (más la
  semilla de `createInitialState`). Cualquier escritura fuera de ahí rompe la
  regla oficial, aunque la suite siga verde.
