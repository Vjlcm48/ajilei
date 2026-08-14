# AJILEI — Mensajes de resultado v1.0

Documento rector de la voz del juego cuando una mano se cierra.
Implementación: **MSG-U1**, sobre el censo read-only **MSG-C0**.
Núcleo: `src/hooks/resultadoCore.js` · Pruebas: `scripts/testResultado.test.js` · Arnés: modo `msg`.

---

## 1. La decisión

**Los mensajes de resultado dejan de pintarse desde `game.message` y se componen en la capa de
presentación, desde el estado.**

El motor **no se toca** y sigue emitiendo sus cadenas exactamente como siempre. Simplemente **nadie
las pinta** cuando hay un resultado. La crónica de apuestas, el reparto, las fases y el descarte
siguen saliendo de `game.message` sin un solo cambio.

El censo MSG-C0 demostró que la unificación **nunca necesitó que se abrieran los protegidos**: la UI
ya tiene en el pago todo lo que hace falta para escribir la frase por su cuenta.

| Lo que hace falta | De dónde sale |
|---|---|
| Quién ganó | `game.winner` |
| Con qué mano | `players[].score` → `{ palo, points }` |
| Si es AJILEI | recálculo con `isAjilei(cards, handRules.ruleN)` — molde VC2, jamás leído del estado ni del mensaje |
| Si hubo empate | los `score.points` iguales al máximo |
| Si ganó por retiros | `players[winner].score === null` — no hubo comparación, luego no hubo volteo |
| Quién es la Mano | `game.manoIndex` |
| Cómo nombrar a la IA | `game.numPlayers` (tamaño físico) y `players[].name` |

## 2. El interruptor: fase y emisor, jamás regex

`composeResultado(estado)` devuelve `null` fuera de `PAYOUT` y `GAME_OVER`. **Ése es todo el
criterio.** No se inspecciona el texto para decidir si es un resultado — la lección de la doctrina
"fase + emisor" que VC2 ya había pagado.

```
PAYOUT + winner != null + ganador SIN score  →  ganada por retiros
PAYOUT + winner != null + ganador CON score  →  showdown
GAME_OVER                                    →  pantalla terminal
cualquier otra cosa                          →  null  (manda game.message)
```

`messageActionKind` —el regex que estiliza la crónica de apuestas por verbo— **sobrevive intacto**,
pero sólo se consulta cuando el compositor ha dicho `null`. Ya no puede tocar un resultado.

## 3. Las plantillas selladas

Voz de la casa: **"Oros, 27 pts"**, la misma de Mano actual (U3) y de la tarjeta de sesión (VC2). El
motor decía `"Oros (27 pts)"` y las dos convivían en pantalla durante el pago.

Segunda persona para el humano, tercera para las IAs. El castellano distingue el sujeto al inicio de
frase (`La IA gana…`) del sujeto en medio (`Gana la IA…`); en mesas de 3+ el nombre propio vale para
las dos posiciones.

| Escenario | Gana el humano | Gana una IA |
|---|---|---|
| **Corriente** | `¡Ganas con Espadas, 31 pts!` | `La IA gana con Espadas, 31 pts.` · `IA 2 gana con Espadas, 31 pts.` |
| **Empate** | `Empate, 27 pts. Ganas por ser la Mano.` | `Empate, 27 pts. Gana IA 2 por ser el más cercano a la Mano.` |
| **AJILEI** | `¡AJILEI! Ganas con mano perfecta.` | `¡AJILEI! IA 2 gana con mano perfecta.` |
| **AJILEI de comodín** (≥52) | `¡AJILEI! Ganas con mano perfecta (comodín).` | `¡AJILEI! La IA gana con mano perfecta (comodín).` |
| **Doble AJILEI** | `¡Ambos con AJILEI! Ganas por ser la Mano.` | `¡Ambos con AJILEI! La IA gana por ser la Mano.` |
| **Por retiros** (mesa 2) | `¡La IA se retira! Ganaste el pozo.` | `Te retiras. La IA gana el pozo.` |
| **Por retiros** (3/4/5) | `Los demás se retiran. ¡Ganaste el pozo!` | `Los demás se retiran. Gana IA 2.` |
| **Fin de partida** | `¡Ganaste la mesa! Eres el último con fichas.` | `IA 1 gana la mesa. Te quedaste sin fichas.` |

**Mismo criterio en las cuatro mesas.** Se anuncia al ganador y su mano; **nunca** la del perdedor.

- **Sin `"Pierdes."`** — la palabra no existe en ninguna plantilla. Antes vivía literal en dos
  cadenas de mesa 2.
- **Sin contraste** — mesa 2 nombraba las dos manos (`vs tu Bastos (27 pts)`), que es justo lo que el
  criterio prohíbe; 3/4/5 ya no lo hacían.
- **Sin la concordancia rota** — `Tú gana con Oros (45 pts).` era lo que salía en 3/4/5, porque el
  nombre del humano es `Tú` y la plantilla iba en tercera persona.

### 3.1 El desempate se deriva, no se supone

`winner === manoIndex` → **"por ser la Mano"**; si no, **"por ser el más cercano a la Mano"**. Un
humano que gana un empate en mesa 5 sin ser Mano recibe la segunda forma, que es la verdad.

### 3.2 "Ambos" no sobrevive a una mesa de cinco

Hay **un AJILEI natural por palo** (as + tres + las tres figuras = 51) más la variante de comodín de
mesa 5, así que **hasta cinco manos perfectas caben en un reparto**. La cabecera cuenta de verdad:
`Ambos` · `Tres` · `Cuatro` · `Cinco`. Improbable no es imposible, y una plantilla que sólo sabe
contar hasta dos es una plantilla que un día miente.

### 3.3 Dos AJILEI **sin** empate no son un doble AJILEI

En mesa 5 un AJILEI de comodín vale 52 y uno natural 51: hay dos manos perfectas y **no hay empate**.
Ese caso se compone como AJILEI corriente (`¡AJILEI! Ganas con mano perfecta (comodín).`), porque se
ganó por puntos y no por cercanía a la Mano. La cabecera de doble AJILEI exige **las dos
condiciones**: varias manos perfectas **y** empate.

## 4. Los tonos

`composeResultado` devuelve `{ texto, tono }`. El tono sale de `winner`, igual que el texto, así que
**los dos son el mismo hecho y no pueden contradecirse**.

| Tono | Superficie | Tratamiento |
|---|---|---|
| `gana` | óvalo | `.msg-win` — `--win-green`, existente, ahora unificado en las cuatro mesas |
| `pierde` | óvalo | `.msg-lose` — `--lose-red`, ídem |
| `oro` | pantalla terminal | `.game-over-msg` — `--gold-brand`, **intacto** |
| `neutro` | pantalla terminal | `.game-over-msg-neutro` — `--text-secondary`, **nuevo** |

**El oro de marca queda reservado a la victoria.** Hasta aquí la pantalla terminal pintaba en el
mismo oro `"¡Ganaste la mesa!"` y `"IA 1 gana la mesa. Te quedaste sin fichas."`, sin consultar
`winner` para nada: la derrota se celebraba con el color de la casa. La clase nueva **sólo cambia el
color** — mismo cuerpo, mismo peso, misma caja —, así que la pantalla no se mueve.

**Los textos de fin de partida no cambian.** Se reproducen literales en el compositor para que
tampoco ahí nadie tenga que pintar `game.message`.

### 4.1 La clase del óvalo, en un solo sitio

La lógica de color estaba **duplicada literal** en las dos rutas de render (`center-zone` y
`two-ovals`). El censo lo dejó anotado como aviso de mantenimiento y **se saldó antes de tocar nada
más**: hoy hay una sola `claseDelMensaje(resultado, msg)` que consumen las dos.

## 5. La regla

> **El texto de un resultado se compone desde el ESTADO. Jamás desde el mensaje.**

Ni para decidir si algo es un resultado (eso es la fase), ni para saber quién ganó (eso es `winner`),
ni para saber si hubo mano perfecta (eso se recalcula). El mensaje del motor es una **salida**, no
una fuente.

## 6. Alcance multiplataforma — deliberado

`GameTable` es compartido: **los textos nuevos aparecen también en móvil, y eso es diseño** — una
sola voz en todo el juego —, no una regresión.

Consecuencias asumidas y verificadas:

1. **CSS móvil**: el diff en hoja compartida es **exactamente una regla**, `.game-over-msg-neutro`,
   fuera de todo `@media`. Ninguna otra.
2. **Sellado móvil**: las celdas que capturan fase de pago **cambian por diseño**. La línea base se
   vuelve a sellar documentando el Δ intencional.
3. **Robustez del óvalo**: se midió en escritorio; en móvil **no se asume**. El arnés inyecta la
   frase más larga que el compositor puede producir y comprueba Δ=0 en las dos plataformas.

### 6.1 La vara honesta del Δ: peor caso contra peor caso

Medir la frase nueva contra el mensaje que hubiera en pantalla en ese instante mediría **corto →
largo**, que es una sensibilidad del óvalo **preexistente** y no una consecuencia de la tanda. Lo que
se compara es la cadena **más larga que el motor puede emitir hoy en esa mesa** contra la **más larga
que el compositor puede emitir mañana**:

| Mesa | Peor caso de hoy (motor) | Peor caso de mañana (compositor) |
|---|---|---|
| 5 / 4 / 3 | `Empate. Gana IA 4 por ser el más cercano a la Mano.` — 51 car | `Empate, 27 pts. Gana IA 1 por ser el más cercano a la Mano.` — 59 car |
| 2 | `Pierdes. La IA gana con Espadas (31 pts) vs tu Espadas (31 pts).` — 64 car | `Empate, 27 pts. Gana la IA por ser el más cercano a la Mano.` — 60 car |

**Mesa 2 sale ganando**: el peor caso se acorta 4 caracteres, porque desaparece el contraste.
En 3/4/5 se alarga 8, y aun así **Δ = 0 en las siete celdas** — ninguna ancla se mueve y el desborde
no cambia en ninguna.

> **Hallazgo preexistente, medido de paso:** en **mesa 5, móvil portrait**, el óvalo **sí** es
> sensible a la longitud del mensaje — `.call-box` se desplaza **3,11 px** entre un mensaje corriente
> y el peor caso. Ocurre **igual hoy**, con la cadena del motor, y por eso el Δ contra la vara honesta
> es 0. Queda anotado: no es de esta tanda y no se toca aquí, pero es la celda a vigilar si algún día
> se alarga la voz.
4. **Las dos rutas de render**: `two-ovals` sólo existe en **mesa 2 landscape móvil** (el gate
   `isLandscapeTable` es `max-height: 600`), así que sin una celda móvil landscape una de las dos
   rutas quedaría sin medir.

## 7. Arnés — modo `msg`

| Puerta | Qué comprueba |
|---|---|
| **compositor** | La matriz entera construida (receta O2): sin `"Pierdes."`, sin la voz vieja `(N pts)`, texto y tono coherentes, oro sólo en victoria, doble AJILEI veraz **en las dos direcciones** |
| **jugado** | El texto pintado se **re-deriva del estado visible** —puntuaciones por zona, chip de ganador, badge de Mano— y se compara la cadena entera. Verificación cruzada contra `winner`/scores, **nunca regex de prosa** |
| **fin de partida** | Contrato de CSS construido: oro exacto en victoria, color distinto y **mismo cuerpo** en derrota |
| **Δ larga** | La frase más larga inyectada en el óvalo no mueve ninguna ancla, en las dos plataformas y las dos rutas |

**Lo que se construye y por qué:** un doble AJILEI en las dos direcciones no cae ni en mil manos, y
la pantalla terminal exige arruinar a todas las IAs. La sub-pasada jugada cubre lo que sí ocurre
—victorias, derrotas y empates corrientes— con re-derivación completa; las **ganadas por retiros** no
tienen puntuaciones que re-derivar, así que ahí se comprueba pertenencia a las plantillas
conservadas y coherencia de tono. **Se declara, no se disfraza de re-derivación.**

## 8. El bug del motor, neutralizado en pantalla

En **mesa 2**, con **ambos jugadores en AJILEI**, `gameEngine.js` emite
`'¡Ambos con AJILEI! Ganas por ser el mano.'` **sin consultar quién ganó**. El desempate ya se
resolvió arriba por orden de asiento desde la Mano: si la IA es Mano, gana la IA y el texto miente.

Y como el **color sí** consultaba `winner`, la misma línea salía **en rojo diciendo que ganabas**.

**Desde MSG-U1 el bug no llega a la pantalla**: el texto se compone desde `winner` y es veraz en las
dos direcciones. La corrección interna del motor sigue pendiente de fase 4, **ya sin urgencia** — es
higiene de código, no un defecto visible. Tiene blindaje explícito en Vitest y puerta propia en el
arnés, construida en ambos sentidos.

## 9. Deuda declarada

- **La banda `Tu mejor palo:`** (`.score-tag-player`) y la de los rivales (`.opp-score` /
  `.score-tag`) siguen con la voz vieja: `Mejor palo: Oros (27 pts)`. Es texto de UI puro y
  ejecutable hoy, pero **queda fuera del alcance de esta tanda**: MSG-U1 unifica los mensajes de
  resultado, no todas las superficies de puntuación. Es el último `(N pts)` que queda en pantalla.
- **Las cadenas del motor** quedan vivas y sin consumidor para los resultados. Borrarlas exige tocar
  un protegido; queda para fase 4.

## 10. Historial de versiones

- **v1.0** — 2026-08-13. Nace la especificación con su implementación (**MSG-U1**), sobre el censo
  **MSG-C0**. Composición en presentación, plantillas selladas para las cuatro mesas, voz de la casa,
  desaparición de `"Pierdes."` y del contraste, concordancia arreglada, oro reservado a la victoria,
  clase de color unificada en las dos rutas, y el bug de mesa 2 neutralizado en pantalla. Modo `msg`
  permanente del arnés y 29 pruebas nuevas de Vitest sobre el compositor puro.
