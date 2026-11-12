# AJILEI · APU-1 · Reglas del dinero y de las IAS · v1.10

**Campaña:** APU-1 — Apuestas, pilas y agresividad de las IAS
**Alcance:** macro 1, Jugar vs IAS. §8 dice lo que rige en el macro 2 (PvP) y §9 su relación con el contrato del árbitro de MOT-1.
**Autoridad:** este documento es la única fuente normativa de las reglas de apuesta. Sustituye a la v1.9 (2026-11-07), que se conserva como historia, y a `AJILEI_Modos_y_Asistencia_v1.0.md §3.3` en todo lo que toque dinero. Donde el código y este documento difieran, el código está equivocado. En PvP, lo que no sea regla de apuesta (acciones, vista, reloj, dinero de la partida) lo dice `docs/AJILEI_MOT-1_Contrato_v1.0.md`.
**Base:** v1.0 más lo sellado en las fases 1b…1f (informes en `docs/reportes/`), en VOZ-3 (v1.4), en MOT-1 (v1.5) y en MES-PvP (v1.6 a v1.10). Las versiones anteriores se conservan como historia.
**Fecha:** 2026-11-10

---

## Registro de cambios v1.9 → v1.10 (MES-PvP: el túnel del árbitro v1.3 y la lámina de la sub-tanda 5a, 2026-11-10)

Esta versión es la v1.9 íntegra con **lo que Victor decidió en el túnel del árbitro v1.3 (2026-11-08) y en la lámina de la sub-tanda 5a (2026-11-09 y 2026-11-10)**. Ninguna cifra de dinero cambia. Los textos nuevos están **tal como se pintan** en `7a8c7c1` (informe de la Fase 0 de la sub-tanda 5, §A.2); la sub-tanda 5a los comprueba al byte contra el código.

| § | v1.9 | v1.10 |
|---|---|---|
| 8 | El ritmo acelera solo el reparto | Acelera también **la reposición del descarte** (×0,5), salvo su arranque y su cierre |
| 8.1 | Saldo insuficiente: «Ahora no» | **«Entendido»**; «Ahora no» queda solo en la recarga normal y solo cierra la tarjeta |
| 8.1 | — | Sentado fuera con la recarga pedida: **«Entras en la próxima mano»**; la oferta vencida no cuenta para la ausencia; **un solo anillo** en la oferta |
| 8.4 | «Arrancando la partida…» hasta la sub-tanda 5 | **La mesa provisional**: sin pantalla intermedia ni texto de espera; el teléfono que llega tarde ve la ceremonia entera; **el sonido del sorteo**; `{N}` pasa a `{n}`; el corte de nombres alcanza toda la mesa y la voz del pago |
| 8.5 | Tres formas de la pastilla | Cuatro: la mesa de 2 contra las IAS dice «Mano {n} · Es Mano IA» |
| 8.6 | «{N} jugadores…» | «{n} jugadores…» |
| 8.7 | — | **Nueva: la reposición uno a uno en PvP** |
| 9 | — | La reposición, en el Contrato v1.4 |
| 10 | — | Filas del anillo, del que llega tarde y de la reposición; la retención de 15 s, provisional |

**Por qué:**
- **«Entendido» en el saldo insuficiente** (Victor, 2026-11-08): ahí no hay nada que decidir, así que «Ahora no» sobraba.
- **Un solo anillo:** en la mesa de 2, quien quebraba veía dos relojes seguidos (unos 3 s y luego 15 s). La regla «un solo reloj» vale también cuando dos plazos del servidor se encadenan.
- **La mesa provisional** sustituye a «Arrancando la partida…», que Victor pidió quitar dos veces: ya hay una cuenta atrás de 10 s en la sala. **Quien llega tarde nunca ve cartas ya repartidas** (Victor, 2026-11-10, tras verlo con 4 s de retraso): ve la ceremonia entera, acelerada.
- **El sorteo deja de ser mudo** (Victor, 2026-11-08). Con sonidos que ya existen y sin sonido extra en «¡Ya tenemos Mano!» (Victor, 2026-11-10, elección (b)).
- **La reposición uno a uno** la decidió Victor el 2026-11-05 («mismo orden y velocidad que contra las IAS») y Rápido ×0,5 el 2026-11-07 (P-4). Hasta ahora no estaba escrita aquí.

---

## Registro de cambios v1.8 → v1.9 (MES-PvP: lámina L-M tandas 2 y 3, 2026-11-07)

Esta versión es la v1.8 íntegra con **los textos y el aspecto que Victor aprobó en las tandas 2 y 3 de la lámina L-M**. Ninguna cifra de dinero cambia. Los textos están **tal como se pintan** (informes `AJILEI_MES-PvP_LM-2_Informe_v1.0.md` y `…LM-3…`, §6); la primera ficha que traiga esta versión a `docs/` los comprueba al byte contra el código.

| § | v1.8 | v1.9 |
|---|---|---|
| 8.1 | Recarga voluntaria «solo entre manos» | Se **pide** en cualquier momento desde el ⋮ y se **aplica** al abrirse la pausa; textos de la recarga |
| 8.2 | — | El aviso al ausente: «1 turno más y saldrás de la mesa» |
| 8.3 | Filas 3 y 4 con frases distintas | **Fundidas** en «Te quedaste solo en la mesa», sin nombre; aspecto de los tonos neutro y sobrio |
| 8.5 | — | **Nueva: la transición entre manos** (también contra las IAS) |
| 8.6 | — | **Nueva: la pausa de anuncio en PvP** |
| 10 | — | Filas de la transición y la pausa |

**Por qué:**
- **La recarga voluntaria se pide durante la mano** porque la pausa entre manos deja unos 3,5 s para dos toques, y eso es poco. Sigue aplicándose solo entre manos: nadie recarga en mitad de una apuesta.
- **«Te quedaste solo en la mesa» sin nombre** (Victor, 2026-11-07): el nombre ya lo dijo el óvalo («{nombre} abandonó la mesa.»), la frase sin nombre nunca se desborda y los casos 3 y 4 quedan en uno.
- **La transición entre manos** suaviza un paso que Victor veía tosco, en las dos mesas, como excepción consciente a «contra las IAS no cambia nada», medida con su control completo (+80 ms del clic al barajado).

---

## Registro de cambios v1.7 → v1.8 (MES-PvP: el sorteo de la Mano sobre la mesa, 2026-11-06)

Esta versión es la v1.7 íntegra con **cómo se ve y cómo se dice el sorteo de la Mano en PvP** (§8.4 nueva), tal como Victor lo aprobó en la tanda 1 de la lámina L-M («impecables todas las pruebas», en la PC y en el S25). La mecánica del sorteo no cambia: sigue siendo la de §8 y el Contrato §6. Contra las IAS no cambia nada, y ninguna cifra existente de §10 se mueve.

| § | v1.7 | v1.8 |
|---|---|---|
| 1 | — | Vocabulario: **sorteo de la Mano** |
| 8 | Ritmo de reparto del anfitrión para toda la partida | Igual, **salvo el sorteo**, que va siempre en Rápido |
| 8 | Dinero: la entrada sale al sentarse | Sin cambio de regla; queda escrito que **no** se cobra al decidirse la Mano |
| 8 | Sorteo: «reparto rápido de 5 cartas» | Reparto de una en una, intercalado y antihorario desde el mazo del anfitrión; volteo de 5 s |
| 8.4 | — | **Nueva: el sorteo sobre la mesa.** Mazo, reparto, cronómetro, los cuatro textos neutrales, lo que se oculta y los nombres en la crónica |
| 9 | — | La duración del reparto del sorteo, según los participantes, en el Contrato v1.3 |
| 10 | — | Cuatro filas nuevas: tres del sorteo y el corte de nombres en la crónica |

**Por qué:**
- **El sorteo deja la capa del centro y se juega en la mesa** (idea de Victor, 2026-11-06). Los jugadores caen directo en su asiento, como en una partida de verdad, y el sorteo se lee donde se leerá todo lo demás: en el óvalo.
- **Los textos van sin nombres.** Una frase con el nombre de cada uno se desborda con nombres largos y obliga a frases distintas por asiento. La neutral se lee igual para todos y cabe en cualquier pantalla.
- **El cobro se queda al sentarse** (Victor, 2026-11-06, tras la sonda de solo lectura sobre `ac96f51`). El sorteo arranca con el dinero ya asegurado, las devoluciones al cancelar ya están probadas y el jugador no nota el momento del cobro. Ningún arranque de la sala mueve dinero: solo la ponen en activa.

---

## Registro de cambios v1.6 → v1.7 (MES-PvP: el abandono y la pantalla final, 2026-11-06)

Esta versión es la v1.6 íntegra con **dos reglas nuevas del macro 2**: qué pasa cuando alguien abandona una partida entre personas (§8.2) y cómo se decide su pantalla final (§8.3). Decisiones de Victor (2026-11-06). Contra las IAS no cambia nada, y ninguna cifra de §10 se mueve.

| § | v1.6 | v1.7 |
|---|---|---|
| 1 | — | Vocabulario: **abandono** |
| 8 | Una partida por cuenta: el asiento abandonado «sigue disputando lo que ya puso y cobra su pila al cerrar la mano» | El asiento abandonado sigue la regla del abandono (§8.2): **se retira en el acto** |
| 8.1 | El plazo de la oferta, en el Contrato v1.2 | En el Contrato **v1.3** (renumeración, abajo) |
| 8.2 | — | **Nueva: el abandono en PvP.** Abandonar es retirarse; la partida termina con menos de 2 sentados; quien se va cobra su pila |
| 8.3 | — | **Nueva: la pantalla final en PvP.** El tono lo pone el resultado; la frase, cómo terminó |
| 9 | La recarga PvP, en el Contrato v1.2 | La recarga, en el Contrato v1.3; el abandono, en la regla C-8 del Contrato v1.2 |
| 10 | Dos filas de la recarga apuntan al Contrato v1.2 | Apuntan al Contrato v1.3 |

**Por qué** (prueba de Victor en ajilei.io, 2026-11-06, y sonda de solo lectura sobre `db0313b`):
- **La regla vieja dejaba una trampa.** Quien abandonaba a mitad de mano seguía disputando lo que había puesto hasta que le llegaba el turno, o hasta el showdown si estaba all-in. El que se quedaba tenía que jugar contra un ausente, con su reloj corriendo. La sonda lo reprodujo: el que se fue cobró 1.600 sobre una entrada de 1.500.
- **La contabilidad nunca falló.** El libro de la nube cuadra (sala `e6cacb94…`: +1.300 y −1.300, suma de la mesa 0). Lo que estaba mal era **a quién** iba el pozo, no cuánto.
- **La pantalla final** heredaba de la mesa contra las IAS la idea de que «el último en pie gana». Allí es cierto, porque solo se queda solo quien quebró a todas las IAS. Entre personas no lo es: test1976 se quedó solo con −1.300 y le salió «¡Qué molleja! Arrasaste con la mesa.», con lluvia de monedas.

**Renumeración del Contrato del árbitro.** El arreglo del abandono es un despliegue propio (sub-tanda 3-A de MES-PvP) y se lleva el número **v1.2** del Contrato y del árbitro. Lo que la v1.6 anunciaba para el Contrato v1.2 (la recarga PvP, la reposición uno a uno y el volteo de 5 s del sorteo) pasa al **Contrato v1.3**, sin cambiar de lugar en la campaña. El registro v1.5 → v1.6 de abajo se conserva como se escribió: donde dice «Contrato v1.2» para la recarga, léase v1.3.

---

## Registro de cambios v1.5 → v1.6 (MES-PvP: la recarga entre personas, 2026-11-05)

Esta versión es la v1.5 íntegra con **una sola regla nueva**: en PvP se puede recargar, **solo hasta la entrada**. Decisión de Victor (2026-11-05). Contra las IAS no cambia nada, y ninguna cifra existente de §10 se mueve.

| § | v1.5 | v1.6 |
|---|---|---|
| 1 | — | Vocabulario: **recarga PvP** |
| 2.4 | Quien no cubre el ante: la IA se va; el humano pasa por la recarga forzosa | Igual contra las IAS. **En PvP**, a quien no cubre el ante se le ofrece la recarga PvP (§8.1) antes de quedar fuera |
| 5.5 | «En PvP no hay recarga (§8)» | En PvP la recarga tiene regla propia (§8.1); la burbuja es su molde |
| 8 | «**Sin recarga.**» | **§8.1 nueva: recarga PvP hasta la entrada**, entre manos, sin tope de veces, con confirmación que muestra el saldo |
| 9 | «la recarga, que en PvP **no existe**» | La recarga PvP es una acción del árbitro y un movimiento de billetera; el detalle, en el Contrato v1.2 |
| 10 | — | Tres filas nuevas de la recarga PvP |

**Por qué es justa** (razonamiento aceptado por Victor): el dinero de la billetera no compra ventaja dentro de la mesa, porque nadie se sienta con más que la entrada; solo compra **seguir jugando**. La pila grande se sigue ganando con cartas, y quien gana a un jugador que recarga se lleva fichas nuevas. Nadie queda atrapado: cualquiera se levanta cuando quiere y cobra su pila.

---

## Registro de cambios v1.4 → v1.5 (cierre de MOT-1, 2026-11-04)

Esta versión es la v1.4 íntegra con los cambios que dejó MOT-1 y las referencias a ECO-1 puestas al día. **Ninguna cifra de §10 se mueve y ninguna regla de las IAS cambia.**

| § | v1.4 | v1.5 |
|---|---|---|
| 3.2 | Once motivos citados con otros nombres (`all_in`, `apuesta_viva`, `sin_apuesta_viva`, `nada_que_igualar`, `fase_sin_apuesta`); `pozos.js` «no protegido» | Los once motivos con su **literal de `pozos.js:28-40`**, que es contrato; `pozos.js` **protegido** desde Protegidos v1.9 (MOT-1 1a) |
| 1 · 2.2 · 2.5 · 10 · 12 | Saldo provisional de 5.000 y saldo de sesión «hasta ECO-1» | La billetera vive en el servidor desde ECO-1; la mesa contra las IAS se abre y se cobra allí |
| 6.11 | «El servidor (MOT-1) inyecta CSPRNG» | Hecho: el árbitro PvP inyecta CSPRNG. La IA no juega en el servidor |
| 8 | Macro 2 descrito como plan, con la nota de alinear la Corta y el sorteo de una carta | Al día con MOT-1: siete apuestas, Corta 15× por defecto (se queda en 15×), ritmo del anfitrión, dinero en garantía, una partida por cuenta, sorteo de la Mano de cinco cartas |
| 9 | Lo que «necesitará» el árbitro | El árbitro existe: lo que este normativo le da y dónde vive lo demás |

Fuera de este documento, el mismo cierre corrige la fila **E-4 de Protegidos §7.1** (decía que el pozo deja de ser escalar; el pozo sigue siendo un entero y las capas se derivan, §4.3). Va en el primer commit de MES-PvP.

---

## Registro de cambios v1.3 → v1.4 (VOZ-3, 2026-10-23)

La v1.4 fue la v1.3 íntegra con los cambios de VOZ-3 («La voz del All-in»): quién gana una mano con el pozo partido y cómo se dice. Decisiones D1–D11 de `AJILEI_VOZ-3_Fase1_v1.0.md`; diagnóstico en `docs/reportes/AJILEI_VOZ-3_Fase0_Informe_v1.0.md`. Ninguna cifra de §10 se movió y el reparto de las fichas no cambió: cambió quién se nombra como ganador y cómo se dice lo que cobra cada uno.

| § | v1.3 | v1.4 |
|---|---|---|
| 4.3 | «`winner` es el ganador de la capa superior; la celebración y el resultado reciben ganadores por capa» | **La mano la gana quien gana la capa principal** (la capa 0), «el principal». `winner` del motor sigue siendo el de la capa superior y **no se lee en pantalla** en el pago. Una capa de un solo elegible se parte en **vuelto** y **ganado sin disputa** |
| 4.5 | «La capa sin elegibles se anuncia como dinero que vuelve» («N vuelven sin igualar.») | Las devoluciones se dicen **por asiento** al final de la frase («Se te devuelven N Heptacoins.», «A la IA se le devuelven…», «A IA k se le devuelven…»), sin la del principal y sin «El pozo se partió:» si es lo único que hay. Tono **`neutro`** cuando el humano gana fichas sin la principal |
| 5.5 | el vuelo de fichas «hacia el ganador» | el vuelo va **al principal** |

---

## Registro de cambios v1.2 → v1.3 (REC-2, 2026-09-27)

La v1.3 fue la v1.2 íntegra con tres cambios, todos en §5 y todos de la regla híbrida de REC-2 (recarga con saldo insuficiente). Ninguna cifra de §10 se movió.

- **§5.1:** «Sin saldo no hay pregunta» pasa a «Sin saldo usable no hay pregunta automática ni voluntaria», con la definición de saldo usable y la forzosa de solo salida cuando el saldo usable no llega a una apuesta.
- **§5.2:** «Los inalcanzables se apagan, no se esconden» se conserva mientras al menos un monto quepa en el saldo usable. Si ninguno cabe, la fila se sustituye por un único monto (todo el saldo usable, o lo que falte hasta el techo si es menor). Nunca se ofrece un monto de cero.
- **§5 (final):** línea de trazabilidad hacia el informe de cierre de REC-2.

---

## 0. Cómo leer las cifras

- **SELLADO** — decidido por Victor, o fijado por simulación y aceptado por él; no se cambia sin una decisión nueva suya.
- **VIGENTE** — cifra que ninguna vara pidió mover; se implementa como parámetro y puede volver a barrerse.
- Ya no quedan cifras de **TRABAJO** en este documento: las de la v1.0 se fijaron con datos en 1d y 1c-2 (§11), y las de pantalla se validaron en teléfono en 1f.

Todo parámetro se implementa como **parámetro** en `ajileiConfig.js`, nunca como constante suelta, para que el banco pueda barrerlo. La tabla completa está en §10; el cambio respecto a la v1.0, en §13.

---

## 1. Vocabulario

| Término | Significado |
|---|---|
| **Apuesta de mesa** (`unit`) | El monto que el jugador elige en «Retar a las IAS» o el anfitrión al armar una mesa PvP. Es la unidad de todo lo demás. |
| **Ante** | Lo que cada jugador vivo paga al pozo al arrancar cada mano. **Ante = apuesta de mesa.** |
| **Entrada** | Fichas con las que un asiento se sienta. Sale del saldo. Por jugador (`player.entrada`). |
| **Pila** | Fichas de un asiento en un momento dado (`player.chips`). |
| **Piso / Medio / Techo** | Las tres entradas propuestas contra las IAS, como múltiplos de la apuesta de mesa. |
| **Corta / Llena** | Las dos entradas fijas de una mesa PvP (§8). |
| **Recarga PvP** | Completar la pila hasta la entrada de la mesa, entre manos, con dinero de la billetera (§8.1). No es la recarga contra las IAS de §5. |
| **Sorteo de la Mano** | Cómo se decide quién es Mano en la primera mano de una partida PvP: cartas boca abajo, cada uno elige una y gana la más alta (§8, §8.4). Solo decide la primera Mano. |
| **Abandono** | Dejar el asiento de una mesa PvP con la partida viva, por la ✕, por el 3.er vencimiento propio seguido o al sentarse en otra mesa. Equivale a retirarse (§8.2). Contra las IAS, salir de la mesa es §2.5. |
| **Profundidad** | Pila ÷ apuesta de mesa: cuántos antes de fondo. Es el mando que gobierna la duración de una partida (1d, D-14). |
| **Saldo** | Heptacoins de la cuenta, fuera de la mesa: la billetera del servidor, con su libro de movimientos (ECO-1). El cliente solo la lee. |
| **Pozo** | Lo apostado en la mano (`state.pot`, entero). Sus **capas** se derivan, no se guardan (`pozos.capasDe`). |
| **Capa** | Porción del pozo que solo pueden ganar quienes contribuyeron hasta ese nivel. |
| **All-in** | Poner toda la pila porque no alcanza para pagar. **Solo defensivo.** Marca `allIn` por jugador. |
| **Pendiente** | Asiento vivo, no retirado, no all-in: el único que puede poner una ficha. |
| **Subida fuerte** | Subir con el mayor multiplicador que la pila permita. |
| **Farol** | Subida fuerte programada por bloque, con o sin cartas. «Farolear es subir; all-in es responder.» |
| **Bloque** | Tramo fijo de manos dentro del cual se sortea la mano del farol. |
| **Puntaje** | Puntos de la mejor suma del mismo palo. Techo **41** para una mano que no es Ajilei (D-29). |

Fases con apuesta: **`BET_1`** (a las 2 cartas), **`BET_2`** (a las 5), **`BET_3`** (tras el descarte).

---

## 2. Entrada y pilas

### 2.1 Ruta de selección — SELLADO

Una sola pantalla, «Retar a las IAS» (§7), con cuatro decisiones:

1. **Reto**: Básico · Avanzado · Pro (`basico` / `avanzado` / `pro`).
2. **Jugadores**: 2 · 3 · 4 · 5 (con la nota del comodín en 4 y 5).
3. **Apuesta de mesa**, según el reto: Básico `50 · 100 · 150 · 250` · Avanzado `100 · 200 · 300 · 500` · Pro `200 · 400 · 600 · 1.000`.
4. **Entrada** (§2.2).

La pantalla **recuerda** reto, jugadores y apuesta; **nunca la entrada**. Cambiar de reto limpia apuesta y entrada (dependen de él) y **conserva el número de jugadores** (E-6, 1e).

### 2.2 Entrada — SELLADO (1f)

- **Piso 10× · Medio 20× · Techo 50×** la apuesta de mesa. La v1.0 decía 5× / 15× / 50×; se subió en 1f porque el piso coincidía con el listón de la recarga automática (§5.1) y «Mínimo» pedía recarga en cuanto se perdía una mano: era una recarga anticipada, no una entrada.

| Mesa | Mínimo 10× | Medio 20× | Techo 50× |
|---|---|---|---|
| 50 | 500 | 1.000 | 2.500 |
| 100 | 1.000 | 2.000 | 5.000 |
| 150 | 1.500 | 3.000 | 7.500 |
| 200 | 2.000 | 4.000 | 10.000 |
| 250 | 2.500 | 5.000 | 12.500 |
| 300 | 3.000 | 6.000 | 15.000 |
| 400 | 4.000 | 8.000 | 20.000 |
| 500 | 5.000 | 10.000 | 25.000 |
| 600 | 6.000 | 12.000 | 30.000 |
| 1.000 | 10.000 | 20.000 | 50.000 |

- La entrada es siempre un **múltiplo entero de la apuesta de mesa**.
- Selector de cuatro chips **sin preselección**: `Mínimo 10×` · `Medio 20×` · `Techo 50×` · `Otra…` (contador de apuesta en apuesta, entre el piso y lo que el saldo permita). Los inalcanzables según el saldo van en gris; **la fila existe siempre con sus cuatro chips** aunque no haya mesa elegida (O1).
- Si el saldo no cubre ni el piso de una mesa, **esa mesa se ofrece en gris** y no se puede escoger.
- El aviso de la pantalla dice **con cuánto se sienta cada IA** antes de pulsar (§2.3).
- La entrada **sale del saldo al sentarse, en el servidor** (ECO-1): la mesa contra las IAS se abre allí y queda registrada como la partida abierta de la cuenta.
- **Bono de bienvenida: 2.500 HC**, una vez por correo real (ECO-1). Con él, un recién llegado entra en mesa 50 con cualquiera de las tres y en mesa 100 con las dos primeras.

### 2.3 Pila de las IAS — SELLADO (1c-2)

```
pila_IA = min( round( entrada_humano × FACTOR_IA ) , techo_de_la_mesa )
FACTOR_IA = 1,5
```

Ejemplo: mesa 100, entra 2.500 → cada IA **3.750**; entra 4.000 o más → 5.000 topada. Quien entra al techo se sienta exactamente igual que las IAS.

Sustituye al «entrada + 1.000» de la v1.0, que sentaba a la IA con ×3 la pila del humano a 5× en mesa 100 y ×5 en mesa 50, y hacía que la ventaja de la IA cambiara con la profundidad sin que nadie la eligiera (D-27). Con el factor la ventaja es constante y **se siente justa** (1f, respuesta 8).

La pila de una IA **nunca se reduce** por regla. Si va por encima de la fórmula tras una recarga (§5.3), no se le quita nada.

### 2.4 Ante por mano — SELLADO

Cada mano cobra **un ante = apuesta de mesa** a cada jugador vivo. La entrada compra la pila; el ante la erosiona; la recarga (§5) existe para eso.

- **Quien no cubre el ante queda fuera**: una IA se va (§6.10); el humano pasa por la recarga forzosa (§5.4). El corte es «menos de un ante», y el residuo (< `unit`) regresa al saldo (§2.5). **En PvP**, antes de quedar fuera se le ofrece la recarga PvP (§8.1).
- **El ante que deja la pila en cero marca all-in** (1d, D-7): quien paga el ante con su última ficha sigue disputando la mano por sus capas. Y quien abre la ronda salta al all-in (`primerTurno`).

### 2.5 Salida de la mesa — SELLADO

Al abandonar la mesa por cualquiera de las cuatro vías (✕ de cabecera, fin de mesa, recarga forzosa rechazada, pantalla de victoria) **las fichas restantes regresan al saldo**, por el servidor. Una partida cortada a mitad de mesa cobra **la última pila informada** (ECO-1). Salir estando arriba es legítimo. El resultado se cuenta contra la **entrada**: `fichas − entrada`, con lo recargado contado como dinero **puesto**, no ganado (§5.3).

---

## 3. Apuestas

### 3.1 Multiplicadores — SELLADO

Los cuatro botones son **×1 · ×2 · ×5 · ×10** sobre la apuesta de mesa. El valor es el **incremento** sobre la apuesta viva. La pantalla atenúa el multiplicador cuyo **costo** (no monto) la pila no cubre. Las subidas dentro de una ronda siguen sin límite de número.

### 3.2 Legalidad — SELLADO (L-5; nombres al día en v1.5)

**El motor valida; la pantalla, la IA y el árbitro consultan.** La única fuente es `pozos.esLegal` / `pozos.accionesDe` (puro, importado por el motor, **protegido desde Protegidos v1.9**). Devuelve uno de estos once motivos de rechazo. Los literales son los de `pozos.js:28-40` y son **contrato**: el comentario de `pozos.js:26-27` prohíbe renombrarlos.

| Motivo | Constante | Cuándo |
|---|---|---|
| `fuera_de_turno` | `FUERA_DE_TURNO` | No es el asiento activo |
| `retirado` | `RETIRADO` | Retirado o eliminado |
| `en_all_in` | `EN_ALL_IN` | Ya está en all-in |
| `monto_invalido` | `MONTO_INVALIDO` | `k` no es de la tabla de multiplicadores |
| `no_alcanza` | `NO_ALCANZA` | La pila no cubre el costo |
| `hay_apuesta` | `HAY_APUESTA` | `pasar` o `apostar` con apuesta viva |
| `sin_apuesta` | `SIN_APUESTA` | `igualar` o `subir` sin apuesta viva |
| `all_in_no_procede` | `ALL_IN_NO_PROCEDE` | All-in cuando la pila cubre lo que falta (§4.1) |
| `fase` | `FASE` | Fase sin apuesta |
| `accion_desconocida` | `DESCONOCIDA` | Tipo fuera de la lista |
| `sin_rival` | `SIN_RIVAL` | Nadie puede contestar |

Una acción ilegal **no se aplica**: el motor devuelve el mismo objeto de estado (`===`) sin decir por qué; el motivo se le pide a `esLegal`. El motor **nunca reescribe una acción en otra**. En PvP el árbitro añade sus propios motivos (identidad, versión, sorteo, descarte): Contrato §3, tabla B.

La IA elige `k` (§6.2) y la pantalla aplica **el mismo `k` con el que consultó la legalidad**; la traducción de montos a multiplicadores no existe (E-12, 1e). En PvP el cliente manda `k`, nunca fichas (Contrato §2).

---

## 4. All-in defensivo y pozos por capas — SELLADO

### 4.1 Cuándo existe

Solo cuando a un jugador **le toca pagar más de lo que tiene**: hay apuesta viva y `pila < lo que falta por igualar`. Sus únicas acciones son **retirarse** o **all-in**. Nadie empuja su pila por voluntad propia cuando alcanza para igualar (motivo `all_in_no_procede`). El botón **All-in (N)**, con N la pila entera, aparece **solo** en ese caso y **sustituye** a «Igualar»: los dos son excluyentes por construcción.

Un all-in **nunca reabre la ronda** y **nunca termina la mano antes de tiempo**.

### 4.2 Un all-in debe ser respondido — SELLADO (E-13, 1e-iii)

Cuando un asiento se marca all-in, **todo pendiente que aún no haya hablado en la ronda tiene que hablar**: pagar, all-in defensivo si no cubre, o retirarse. La ronda no se cierra por quedar un solo pendiente; se cierra cuando todos los pendientes han actuado e igualado. Hasta 1e-iii el motor cerraba la ronda al marcarse el penúltimo, y el rival escapaba de un all-in sin decidir si lo pagaba. Medido: en la mesa de dos el rival es siempre el último pendiente, y es donde la regla más muerde (E-21).

### 4.3 Pozos por capas

Cada asiento acumula su **contribución total a la mano** (`contribMano`, ante incluido). Las capas se derivan de los niveles de all-in `a_1 < … < a_n`:

```
capa_k            = Σ_i [ min(C_i, a_k) − min(C_i, a_(k−1)) ]      a_0 = 0
elegibles_k       = no retirados con C_i ≥ a_k
capa_superior     = Σ_i [ C_i − min(C_i, a_n) ]
elegibles_superior = no retirados y no all-in
```

El pozo **sigue siendo un entero** (`state.pot`); las capas **no se guardan**, las deriva `pozos.capasDe`. Invariantes: la suma de las capas es exactamente el pozo, aritmética entera; nadie gana de otro más de lo que él mismo puso; **una capa sin elegibles devuelve su monto a quien lo puso** (D-7); cada capa se resuelve por separado con el desempate vigente (**la Mano gana**) restringido a sus elegibles; un retirado no es elegible en ninguna capa.

**Quién gana la mano — SELLADO (VOZ-3, D1).** La mano la gana **quien gana la capa principal** (la capa 0, la de abajo): en el volteo, la mejor mano entre los no retirados, con el desempate vigente; en la ruta de los retiros, el último en pie. Se le llama **el principal**. Su neto en la mano es siempre positivo: gana todas las capas en las que es elegible, y en cada una los demás pusieron al menos el ante. `winner` del motor sigue siendo el ganador de la capa **superior** y **no se lee en pantalla** en el pago: el titular, el tono, la mano en grande, la celebración, el destino de las monedas, lo que la pila del ganador retiene durante el vuelo y «Manos ganadas» se deciden por el principal, en una sola cuenta (`src/hooks/manoCore.js`, `lecturaDeMano`). Es la misma regla del récord de manos del servidor (`mesaIACore.finDeMano`, ECO-1) y la del árbitro PvP para los puntos contra humanos (Contrato §7).

**Lo que cobra cada asiento — SELLADO (VOZ-3, D7).** Por asiento y capa, lo puesto en el tramo es `min(C_i, a_k) − min(C_i, a_(k−1))`. Lo que cobra un asiento se reparte en tres cuentas:
- **disputado:** las capas de dos o más elegibles que ganó;
- **vuelto:** lo suyo en una capa sin elegibles (D-7) o en una capa de un solo elegible (él);
- **ganado sin disputa:** en una capa de un solo elegible, lo que pusieron en ese tramo quienes se retiraron. Nunca se suma al vuelto.

En la ruta de los retiros la capa 0 se gana entera: nada de ella es vuelto. La suma de las tres cuentas de todos los asientos es el pozo.

### 4.4 Las rondas que no existen — SELLADO (§4.3 al motor, 1e-iii)

**Una ronda de apuesta que no se puede jugar no se abre.** Al entrar en `BET_1`, `BET_2` o `BET_3`, si queda **un pendiente o ninguno**, el motor salta la fase (`abrirApuesta`) exactamente como si todos hubieran pasado. **El descarte y el showdown no se saltan nunca**: el asiento en all-in descarta con normalidad y sus cartas juegan por sus capas. Las cartas se muestran **al final**, nunca antes del descarte, aunque todos estén all-in en `BET_2`. Quien decide si una fase existe es el motor, no la pantalla; la pantalla publica `data-clavada`, que debe valer 0 siempre.

**D-12 · nadie puede hablar.** Dos rutas, cerradas por dos puertas: (1) el ante deja a todos en cero a la vez → se mira **antes de repartir** (`anteDejaAMudos`) y la recarga pasa a forzosa (§5.4); (2) todos all-in apostando en `BET_1` → las fases siguientes no se abren (arriba). Verificado sobre 8.000 manos sembradas con entrada al piso: ninguna fase se abre muda, ninguna mesa se clava, el dinero se conserva.

### 4.5 Voz y marca — SELLADO (L-7, E-23, 1e)

- La crónica tiene **sexto verbo `allIn`**: «Vas all-in con N Heptacoins.» / «La IA va all-in con N.» en mesa de dos; «IA k va all-in con N.» en mesas mayores. Se reconoce por la transición (pila a cero con contribución por debajo de la apuesta viva), no por el mensaje.
- El asiento en all-in va **marcado «ALL-IN»** en su ranura de estado, fuera de flujo, hasta que la mano acaba (orden: retirado → all-in → turno → última acción). Cabe en una línea en todas las mesas y viewports de la casa (relación medida por `diagDSK apu`, no cifra absoluta: E-28).
- El humano en all-in lee **«Estás all-in — tus cartas siguen jugando.»** en el hueco del «pensando». En mesa de dos esa línea no existe nunca: tras responder el rival no queda ronda que abrir.
- El titular del óvalo es el del **principal** (§4.3), con la mano en grande, el chip de puntos y la celebración del principal.
- Cuando el pozo se parte en capas de otro dueño, el óvalo lo dice **agrupando por asiento y sumando**: «El pozo se partió: Te llevas otros 900 Heptacoins. IA 2 se lleva 400.» Se nombra todo lo que cobra un asiento que no es el principal, disputado o ganado sin disputa: nada de lo que cobra un asiento queda sin nombrar (E-23; VOZ-3, D8).
- **Lo que vuelve** se dice al final de la frase, en orden de asiento, una oración por asiento (VOZ-3, D5): «Se te devuelven N Heptacoins.» · «A la IA se le devuelven N Heptacoins.» en la mesa de dos · «A IA k se le devuelven N Heptacoins.» en las de tres a cinco. En singular por regla: «se le devuelve 1 Heptacoin» (hoy no se alcanza: el menor vuelto es una apuesta). Si lo único que hay es una devolución, va sin «El pozo se partió:» delante. **No se anuncia la devolución al propio principal** (D6). La forma «N vuelven sin igualar.» ya no existe.
- **El tono** (VOZ-3, D4): `gana` si el principal es el humano; `pierde` si no, salvo que el humano gane fichas en la mano sin ganar la principal (una capa intermedia): entonces **`neutro`**, sin color propio, sin pulso dorado y sin fanfarria, con las monedas hacia el principal. El arnés reconoce el pago por `data-tono` (gana, pierde o neutro), nunca por la clase.
- **Una mano con una sola capa** se dice, suena y vuela exactamente como antes de VOZ-3 (D11).

### 4.6 All-in en PvP

Se escribe una sola vez en el motor puro y `pozos.js`; el macro 2 lo hereda (§8). El servidor no envía la voz (`message`, K-12): en PvP la voz la arma el cliente desde la vista. Va al tutorial con sesión propia.

---

## 5. Recarga entre manos — SELLADO (solo vs IAS)

### 5.1 Las tres formas

Una sola función pura (`pideRecarga`) decide cuál toca:

- **Voluntaria**: botón discreto junto a «Siguiente mano», al cierre de **cada mano a partir de la primera** (no antes de repartir la primera: el jugador acaba de elegir su entrada). La pide el jugador: se abre la tarjeta directamente, **sin burbuja y sin plazo**.
- **Automática**: al cerrar una mano, si `pila_humano < 5 × unit` y el saldo alcanza. Se presenta con la **burbuja** (§5.5). **15 segundos contados desde que termina la revelación** (REC-1), «No recargar» por defecto. Bloquea «Siguiente mano», y la burbuja ocupa su caja (O1).
- **Forzosa**: se evalúa **al cerrar la mano** y, si la mesa está entre manos, también ahí, cuando el humano no cubre el ante **o** cuando el ante dejaría a todos mudos (D-12, ruta 1). Se presenta con la **burbuja** (§5.5), con **el mismo plazo de 15 segundos contado desde que termina la revelación**. Rechazarla o dejar vencer el plazo («Salir con mis fichas») termina la mesa y devuelve las fichas al saldo (§2.5).
- **Nunca dentro de una mano.** **Sin saldo usable no hay pregunta automática ni voluntaria.** Saldo usable es el saldo redondeado hacia abajo a la apuesta de la mesa; el resto se queda en el saldo. Si el saldo usable es menor que una apuesta, la forzosa sí se muestra, como tarjeta de solo salida («Salir con mis fichas»), porque la mesa no puede continuar.

*Nota REC-1: la v1.1 situaba la forzosa «al arrancar una mano» y daba los 15 s solo a la automática. El código siempre la evaluó al cerrar la mano y le dio el mismo plazo; la v1.2 alineó el texto con el comportamiento.*

### 5.2 Cuánto

La recarga se elige como una entrada: **Mínimo 10× · Medio 20× · Al techo** (lo que falta para llenar la mesa), múltiplos de la apuesta, pila resultante ≤ techo, saldo suficiente. **Los inalcanzables se apagan, no se esconden, mientras al menos uno quepa en el saldo usable.** Si ninguno cabe pero el saldo usable alcanza al menos una apuesta, la fila de montos se sustituye por un único monto: todo el saldo usable, o lo que falte hasta el techo si es menor. Nunca se ofrece un monto de cero. Cuatro validaciones: múltiplo, techo, saldo, entre manos.

### 5.3 Efecto en las IAS

Tras la recarga cada IA viva se **completa hacia arriba** con la misma fórmula de §2.3:

```
pila_IA = max( pila_IA_actual , min( round( pila_humano_tras_recarga × FACTOR_IA ) , techo ) )
```

A la IA que va por encima no se le quita nada; las eliminadas **no vuelven**. `aplicarRecarga` sube pila y `entrada` a la vez, por eso el resultado sigue siendo honesto (§2.5). **La promesa se dice antes de pulsar**, en el subtítulo de la tarjeta, en todas las pantallas: «Quedan {hc} HC. Las IAS se nivelan contigo.» (automática) · «Hasta {hc} HC más. Las IAS se nivelan contigo.» (voluntaria). No hay una nota aparte en escritorio (E-31). El tutorial explica la nivelación una vez (TUT-1).

### 5.4 Lámina — SELLADO (E-14, E-29, REC-1)

- **Forzosa abierta:** bloquea la mesa con velo, porque mientras está abierta la decisión es lo único que importa. **Solo lleva velo cuando está abierta**: mientras es burbuja, la mesa está a la vista (§5.5).
- **Automática y voluntaria:** se apoyan abajo, **sin velo**.
  - **En el teléfono vertical no tocan las cartas del jugador** (0 px²). En 360×640 la automática mide ≤ 163 px y va **sin título**, porque la burbuja ya hizo de encabezado; la voluntaria conserva el suyo.
  - **En escritorio y en el teléfono apaisado pueden cubrir la mano mientras están abiertas.** La automática se pliega con «Ver la mesa», y la voluntaria la abre el jugador cuando ya leyó la mano.
  - Lo único que bloquean es «Siguiente mano».
- **En las dos tarjetas, en todas las pantallas:**
  - el **cronómetro va a la izquierda**;
  - a su derecha, en la misma fila, **«Ver la mesa»** cuando la tarjeta se puede plegar (§5.5).
- **Separaciones:** las de A5 rigen en **todas las pantallas**, es decir, teléfono vertical, teléfono apaisado y escritorio. En el teléfono apaisado la forzosa es compacta, con las dos acciones en fila.
- **El piso táctil de la tarjeta (PAN-1, INV-07): zona táctil de 40 px por eje en cada botón.** La caja visible de la blanda y de «Ver la mesa» sigue en **36 px**; en la forzosa, las acciones miden **42**. La zona la da un `::after` transparente que solo crece lo que falta (`src/styles/tactil.css`) y se mide por barrido, no por la caja (`diagDSK apu`, `diagDSK rec`).

### 5.5 La burbuja — SELLADO (REC-1)

La pregunta automática y la forzosa **no se presentan en el instante del resultado**, porque taparían la revelación, que es el momento más importante de la mano.

1. **Cuándo aparece:** al **terminar la revelación**, es decir, cuando aterriza el vuelo de fichas hacia el ganador (el principal de §4.3). En una mano sin vuelo, en el acto. El reloj de 15 s empieza ahí.
2. **Dónde y cómo:** aparece la **burbuja «Recargar»** en la caja de «Siguiente mano», sin mover nada (O1).
   - Lleva el **reloj en un anillo** que se vacía, con los segundos dentro.
   - Lleva un **triángulo de alerta en la forzosa** y la **moneda en la automática**.
3. **Sin velo:** mientras es burbuja no hay velo. La mesa entera queda a la vista y tocable: el jugador puede tocar los nombres para destapar las otras manos (R1/R2).
4. **Un solo reloj:** tocar la burbuja abre la tarjeta **con el tiempo que quede**. Burbuja y tarjeta leen el mismo reloj; abrir o plegar no lo reinicia.
5. **Plegar:** «Ver la mesa» vuelve a convertir la tarjeta en burbuja **mientras queden más de 5 s**.
6. **Los últimos 5 s:** la tarjeta **se abre sola** y queda fija, sin «Ver la mesa». La decisión nunca se toma sin que el jugador la vea.
7. **Al vencer:** lo de §5.1. La forzosa sale con las fichas; la automática se cierra y vuelve «Siguiente mano».
8. **La voluntaria no pasa por burbuja.**

*Lo que el macro 2 hereda: en PvP la recarga tiene su propia regla (§8.1), más simple que esta: un solo monto, sin nivelar a nadie. La burbuja es su molde, porque no detiene la mesa.*

Regla híbrida de REC-2 (2026-09-27). Ver `docs/reportes/AJILEI_REC-2_Cierre_v1.0.md`.

---

## 6. Las IAS

### 6.1 Qué ve una IA — SELLADO

Sus cartas y la información pública: retirados, all-in, contribuciones, pilas, pozo y capas, tamaño del mazo. **Nunca** cartas ajenas ni el mazo. Vigilado por la trampa Proxy de `testNivel2 §8`, extendida a las ramas de APU-1 en los tres retos.

### 6.2 La IA elige monto — SELLADO

`decideBetAction` devuelve `{ action, k, peso }`, `k ∈ {1, 2, 5, 10}`. El motor aplica `k × unit`; la legalidad la consulta en `pozos.js`. `decidirIA` está exportada del motor para que la pantalla mida el `peso` sin gastar azar dos veces (§6.9). **Orden de evaluación**: farol → all-in → trampa armada → subida fuerte → pasar con mano grande → fracción del pozo → lógica de NIV-2.

### 6.3 Subida fuerte por puntaje — SELLADO (1d, 1c-2)

En `BET_2` y `BET_3`, si el puntaje alcanza el umbral de su mesa **y su reto**, sube con el **mayor k que su pila cubra**. Forma anidada por reto (R-B), con la plana como respaldo:

| Mesa | Básico | Avanzado | Pro |
|---|---|---|---|
| 2 | 43 | 41 | 41 |
| 3 | 42 | 40 | 40 |
| 4 | 40 | 38 | 38 |
| 5 | 41 | 39 | 39 |

En `BET_1` la IA sigue reactiva. **D-29:** el puntaje tiene techo **41** (as 11, ninguna otra carta pasa de 10; con cinco del palo es Ajilei y va por su rama). En mesas 2 y 3 el umbral de Básico no se alcanza por puntaje: solo entra con el descuento del temperamento (§6.7), y sus ×10 contra el humano son Ajilei o farol de bloque. Es la forma que toma «empuja menos»: por encima de 43 no hay recorrido. Contra la intuición, un umbral **más alto** hace a Básico **más fácil** (D-23).

### 6.4 Farol por bloques — SELLADO

- Bloques fijos de `B` manos: Básico **15** · Avanzado **12** · Pro **8**. Al inicio de cada bloque se sortea en qué mano ocurre el farol.
- **Quién**: la IA viva de mayor pila (empate: azar), tenga o no cartas.
- **Cómo**: «pone dinero delante» — `apostar` si no hay apuesta viva, `subir` si la hay — con el mayor k que cubra en `BET_2`; en `BET_3` vuelve a subir con lo que cubra; si no cubre ninguna, pasa. Si alguien sube y no puede cubrir, el plan muere y entra §6.6.
- **Piso de puntaje del farol por mesa** (R-A): `{2: 26, 3: 28, 4: 28, 5: 28}`, comparado contra `scoreEf`. Si la elegida no llega al piso, el plan **se traslada** a otra mano del bloque; si era la última, el bloque se queda sin farol. Efecto medido: el puntaje medio del farol duro sube de 23–24 a 25–26 y se recortan un tercio de los faroles. Validado en teléfono: «un farol muy bien jugado» (1f).
- Lectura residual aceptada: la subida fuerte de una IA que no es la de mayor pila es siempre honesta.
- **R-F (parqueada):** el piso podría comparar el puntaje crudo en vez de `scoreEf` para tener recorrido; no se escribe hasta que una prueba en mano lo pida.

### 6.5 Regla de la fracción del pozo — SELLADO

Para **todo pago**, en los tres retos: si lo que la IA debe poner es `≤ 0,33 × pozo actual`, **paga siempre**. Si es mayor, decide por puntaje con su temperamento. `fraccionPozo = 0,33` es el menor de {0,25 · 0,33 · 0,40} que mantiene V4 en rango sin subir las quiebras un tercio (D-26).

### 6.6 All-in de la IA — SELLADO en mecánica; cifras VIGENTES

Cuando la IA no puede cubrir un pago: si `pila ≤ 0,33 × pozo` → **all-in siempre**; si no, all-in solo con `puntaje ≥ 31` (`allIn.puntajeMin`), si no se retira. Ninguna vara pidió mover el 31.

### 6.7 Temperamentos — VIGENTE

`CONSERVADORA / EQUILIBRADA / AGRESIVA / IMPREDECIBLE`, reparto por partida, desplazan **±2** los umbrales de §6.3 y §6.6. La IMPREDECIBLE conserva su ruido.

### 6.8 Pasar con mano grande — SELLADO

Con probabilidad **0 / 0,15 / 0,25** (Básico / Avanzado / Pro) una IA con puntaje sobre el umbral pasa o iguala en `BET_2` y sube fuerte en `BET_3`. Básico nunca arma la trampa.

### 6.9 Ritmo — SELLADO (1e, 1f)

El tiempo de decisión sale de `ui.ritmoIA` por el `peso` que la IA declara: **leve 700–1.000 · media 1.000–1.500 · grande 1.500–2.200 ms**, uniforme dentro de la banda. Es puesta en escena: azar de pantalla, no entra al motor ni al banco. Validado: «las esperas se vieron justificadas» (1f).

### 6.10 IA quebrada — SELLADO

Se va con la ceremonia actual y la mesa sigue con menos. Sus fichas restantes (< un ante) se descartan. Una IA en all-in defensivo **puede resucitar**: en 1f salvó a la última IA de la mesa dos veces; es la regla funcionando.

### 6.11 Reproducibilidad — SELLADO (L-3)

`aiPlayer.js` y `deck.js` tiran de un generador inyectable (`setRng`/`resetRng`, ligado tarde), `Math.random` por defecto. En PvP el árbitro inyecta un CSPRNG (MOT-1 1b). La IA no juega en el servidor (K-8(a)): `aiPlayer.js` viaja inerte con el motor.

### 6.12 Básico empuja solo contra el humano — SELLADO (R-D, 1c-2)

`ia.soloContraHumano = { basico: true }`. Con el reto encendido, el farol de bloque, la subida fuerte, el pasar con mano grande **y el multiplicador del Ajilei** (§6.2) solo se evalúan con un humano vivo y sin retirar en la mano; entre IAS, Básico juega la lógica de NIV-2 a ×1 (con Ajilei sube ×1 y no se retira jamás). El all-in y la fracción del pozo se evalúan siempre: son pagos, no empujes. Efecto: cinco Básicos duran 266 manos bajo espejo en vez de 3; contra el humano Básico pone la mitad del dinero que Avanzado, no cero (D-13). Validado en teléfono: Básico en mesa de cinco «es otra cosa» y se ganó (1f); **R-G no se escribe**.

---

## 7. Pantalla «Retar a las IAS» — SELLADO (1e)

Cuatro filas de chips (reto · jugadores con nota de comodín · apuesta según el reto · entrada `10× / 20× / 50× / Otra…`), un aviso reservado que promete con cuánto se sienta cada IA, y un botón que resume las tres cifras («Retar a 4 IAS · mesa 200 · entras con 4.000»), envolviendo en dos líneas si no cabe. **Mismo componente** que «Armar una mesa» de PvP (`PantallaChips` + `FilaChips`), con la **política de memoria** en `config/memoriaChips.js` como parámetro: PvP recuerda `jugadores · apuesta · tipo`; vs IA recuerda `reto · jugadores · apuesta` y **nunca la entrada**. Lámina: una columna que se aprieta en pantallas anchas, nunca dos. Textos por `t()` con prefijo `ia.`. Sustituyó a `NivelSelect`, `ModeSelect`, `TableSelect` y `STAKE_OPTIONS`.

---

## 8. El macro 2 (Jugar vs jugador) — SELLADO (al día con MOT-1)

Motor y `pozos.js` idénticos. Lo que no sea regla de apuesta lo dice el Contrato del árbitro; aquí, lo que toca dinero y apuestas:

- **Sin niveles. Siete apuestas:** `50 · 100 · 200 · 500 · 1.000 · 2.000 · 5.000`.
- **Entrada fija, dos opciones:** **Corta 15×** (la de por defecto) · **Llena 50×**, mostradas en HC (tabla de las 7 × 2 en Contrato §1). Sin cifra libre. La Corta **se queda en 15×** aunque el Medio contra las IAS sea 20× (decisión de Victor, 2026-10-01); se revisa solo si las pruebas con testers lo piden.
- **Identidad de una mesa pública abierta:** jugadores × apuesta × entrada; como máximo una en espera por identidad. **Para sentarse:** saldo ≥ entrada (sustituye a la regla del 5×).
- **Ritmo de reparto:** Normal o Rápido, lo elige el anfitrión al armar la mesa y queda para toda la partida. No forma parte de la identidad y no se anuncia a quien se une. Acelera el reparto (el mismo factor que «Partida rápida» contra las IAS) y la reposición del descarte (§8.7); el barajado tiene una sola velocidad. **El sorteo de la Mano no sigue esta elección:** va siempre en Rápido (§8.4).
- **Dinero:** la billetera se mueve dos veces: la entrada sale al **sentarse** (garantía) y la pila vuelve al **salir** (liberación, con el residuo menor que la unidad). Al cerrar cada mano las pilas de todos se guardan en el servidor, sin movimiento de billetera. Toda salida de la sala de espera devuelve la entrada. En una mesa, lo que entra es lo que sale. **La entrada se cobra al sentarse, no cuando se decide la Mano** (Victor, 2026-11-06): ninguno de los tres arranques de la sala (se sientan todos, vence el tiempo o el anfitrión arranca con los sentados) mueve dinero. Detalle en Contrato §7.
- **Recarga solo hasta la entrada** (§8.1). La pila en la mesa siempre visible. El saldo total no se muestra en la mesa, salvo en la confirmación de una recarga; el ojito de «Ocultar saldo» vive en la píldora del lobby (CFG-1) y nunca tapa la pila de la mesa.
- **Una partida abierta por cuenta** (regla de ECO-1 en todos los modos): quien abre otra mesa con un asiento PvP vivo deja ese asiento **abandonado**, con la regla del abandono (§8.2): se retira en el acto y cobra su pila (Contrato §7).
- **Todo §4 aplica idéntico; nada de §5 ni §6.**
- **Primera Mano: el sorteo** (Contrato §6). Cada ronda: barajado del mazo completo, reparto de 5 cartas boca abajo a cada participante, de una en una y siempre en Rápido (§8.4), elección en 10 s (si no elige, la de más a la izquierda), las no elegidas vuelven sin mostrarse y las elegidas se voltean a la vez y quedan a la vista 5 s (cifra del Contrato v1.3). Gana la más alta; **el As es la más baja**. Los empates los resuelven solo los empatados, con la misma ceremonia: 3 rondas en total, y si la tercera empata el servidor elige al azar entre ellos. Solo decide la primera Mano; después la rotación es la de siempre. El Pie se deriva: el asiento anterior a la Mano. Cómo se ve y cómo se dice: §8.4.
- **«Mano actual» contra humanos:** 500 HC por mano tras las 20 consultas gratis (CFG-1 1e), cobrada por el servidor.

### 8.1 Recarga PvP — SELLADO (Victor, 2026-11-05)

| Punto | Regla |
|---|---|
| **Cuánto** | **Lo que falta para volver a la entrada de la mesa**, nunca más. Un solo monto: `entrada − pila`. Nadie puede sentarse ni recargar por encima de la entrada |
| **Quién** | Un asiento sentado, no abandonado y que no ha cobrado. Quien se levantó no vuelve a esa mesa |
| **Cuándo** | **Se aplica solo entre manos**, nunca dentro de una mano, antes de cobrar el ante de la mano siguiente. Voluntaria si la pila está por debajo de la entrada |
| **Pedirla** (v1.9) | Desde la **moneda del ⋮** de la mesa. En la pausa entre manos, recarga en el acto (con su confirmación). **Durante la mano queda pedida**: la moneda lleva una ✓ y el ⋮ cerrado un punto dorado; otro toque la anula. Se aplica al abrirse la pausa, con el monto de ese momento. Si al abrirse la pila ya no está por debajo de la entrada, **se cancela en silencio**; si el saldo no alcanza, se cancela y **se abre la tarjeta de saldo insuficiente**. Quien está **sentado fuera** de la mano y recarga queda también con la recarga **pedida** para la pausa siguiente (v1.10) |
| **Ofrecida sola** | Cuando su pila no cubre el ante de la mano siguiente (quebró), se le ofrece sin que la pida |
| **La mesa no espera** | La oferta vive en la pausa entre manos. Si quien quebró no decide a tiempo, **se salta esa mano** (se queda sentado, fuera de la mano) y la oferta sigue abierta para la siguiente. Si tampoco decide entonces, sale de la mesa y cobra su residuo. **«Ahora no» solo cierra la tarjeta:** la oferta sigue abierta hasta su plazo. El vencimiento de una oferta **no cuenta** como turno perdido para la ausencia (§8.2). En la mesa de 2, la mesa retiene **15 s** a quien quebró (`oferta_recarga`, cifra provisional del Contrato v1.3) (v1.10) |
| **Fin de partida** | Si la quiebra dejaría la mesa con un solo jugador con fichas, **la partida no termina** hasta que la oferta se cierre: sin recargar, termina; recargando, sigue |
| **Sin tope de veces** | Se puede recargar cuantas veces se quiera mientras el saldo alcance |
| **Confirmación** | Cada recarga pide confirmar mostrando **el monto y el saldo que queda después**. No frena: evita recargar sin darse cuenta. Tarjeta suave (abajo, sin velo y sin título), como la de las IAS |
| **Saldo insuficiente** | Si el saldo no cubre el monto completo, no se recarga; la tarjeta lo dice. Desde la mesa no se abre la tienda (INV-76) |
| **Dinero** | Un movimiento de billetera propio: **−monto**, como garantía adicional del asiento. Al salir, la liberación paga la pila, que ya incluye lo recargado. En una mesa, lo que entra (entradas + recargas) es lo que sale |
| **Resultado** | Se cuenta contra lo puesto: `cobrado − (entrada + recargas)` |
| **Sin efecto en** | La identidad de la mesa, el sorteo, los puntos contra humanos y nadie más de la mesa: en PvP no hay IAS que nivelar |

**Textos de la recarga PvP** (v1.9; al día con la v1.10):

| Momento | Texto |
|---|---|
| Burbuja ofrecida al quebrar | «Recargar» |
| Tarjeta, con la pila en 0 | «Recargar {monto} HC para seguir en la mesa. Te quedarán {saldo} HC.» · «Recargar» · «Ahora no» |
| Tarjeta, con pila | «Recargar {monto} HC para volver a {entrada} HC. Te quedarán {saldo} HC.» · «Recargar» · «Ahora no» |
| Saldo insuficiente | «Tu saldo no alcanza para recargar.» · «Entendido» (v1.10) |
| Marca en el asiento de quien decide | «Recargando» |
| Marca de quien se salta la mano | «Fuera de esta mano» (también en su caja de acciones) |
| Sentado fuera, con la recarga pedida | «Entras en la próxima mano», en su caja de acciones, en lugar de «Fuera de esta mano». La burbuja desaparece y la moneda del ⋮ lleva su ✓ (v1.10) |
| Mesa de 2, mientras el rival decide | «Esperando a {nombre}…», en la caja de acciones (el óvalo dice el resultado) |

- Sentado fuera de la mano, la burbuja va sobre su fila de cartas, vacía.
- **Un solo anillo** (v1.10). La burbuja de la oferta lleva un único reloj continuo, desde que aparece hasta el final real del plazo. En la mesa de 2 con retención, ese final es lo que queda de la pausa más 300 ms de margen más los 15 s: **18 s con revelación y 20 s sin ella**. En la pausa de anuncio (mesas de 3 o más) la burbuja va **sin anillo**.
- Las marcas van en la ranura de estado, detrás de «En anuncio» y antes de «retirado».

### 8.2 Abandono en PvP — SELLADO (Victor, 2026-11-06)

Se abandona por tres vías: la **✕** de la mesa, el **3.er vencimiento propio seguido** (la ausencia; los vencimientos del sorteo no cuentan, Contrato) o **sentarse en otra mesa** (una partida por cuenta, §8). Las tres siguen la misma regla y se dicen igual.

| Punto | Regla |
|---|---|
| **R1 · Abandonar es retirarse** | Con mano en curso, quien abandona queda **retirado en el acto**, en cualquier fase: apuesta (le toque o no), descarte o reposición. «Mano en curso» incluye el barajado y el reparto de una mano cuyo ante ya se cobró. Pierde lo que puso en el pozo, como cualquiera que se retira, y no es elegible en ninguna capa (§4.3). Si con eso queda **uno solo en la mano**, ese cobra el pozo por la ruta de los retiros (§4.3). Si quedan dos o más, la mano sigue sin él |
| **Showdown ya calculado** | Si abandona durante una reposición cuyo showdown ya estaba calculado (por all-ins), el showdown **se recalcula sin él** |
| **R2 · Menos de 2 sentados** | La partida **termina cuando quedan menos de 2 jugadores sentados**, sin empezar otra mano: en la mesa de 2, en cuanto uno abandona; en las de 3 a 5, cuando se va el penúltimo. Quien está sentado fuera de una mano con una oferta de recarga abierta (§8.1) cuenta como sentado |
| **R3 · Cobra su pila** | Quien abandona cobra **la pila que tiene al abandonar**; lo que ya puso en el pozo no es suyo. Sin mano en curso, cobra en el acto; con mano en curso, al cerrarse esa mano. **Nunca cobra más que su pila al irse.** Solo pierde el asiento: no vuelve a esa mesa |
| **Lo que ve quien se queda** | Un mensaje en el óvalo: «{nombre} abandonó la mesa.» y, si la partida termina, «{nombre} abandonó la mesa. La partida termina.». Si la mano se cierra con pozo, **el pago se ve completo**, con su duración de siempre, antes de la pantalla final; sin pozo, la pantalla final llega tras el mensaje. Nada más se juega |
| **Lo que ve quien se va** | **Su pantalla final personal en el acto** (§8.3). No cambia después, siga o termine la partida |
| **Sin trampa** | Abandonar nunca mejora el resultado de quien se va: renuncia al pozo, y ningún reloj ajeno puede ganar por él |
| **La ausencia** (v1.9) | Desde el **2.º** vencimiento propio seguido: los demás ven **«Ausente»** en su asiento (en la ranura de estado, en lugar de «última acción»; bajo «retirado» o «all-in» no se ve), y él ve en la crónica **«1 turno más y saldrás de la mesa»**. Sin botón «Sigo aquí»: cualquier jugada propia pone el contador a cero. Al **3.º**, abandona por R1 |

### 8.3 Pantalla final en PvP — SELLADO (Victor, 2026-11-06)

Cada jugador ve **su propia** pantalla final, sin espectador (P-5). Decide dos cosas por separado.

**El tono lo pone el resultado**, `cobrado − (entrada + recargas)` (§8.1):

| Resultado | Tono |
|---|---|
| Positivo | **Celebración**: lluvia de monedas y cifra dorada |
| Cero | **Neutro**: sin lluvia |
| Negativo | **Sobrio**: sin lluvia, cifra en rojo y **nunca** una frase de victoria |

**La frase la pone cómo terminó**, evaluada en este orden (la primera que se cumple):

| # | Cómo terminó | Frase |
|---|---|---|
| 1 | Se fue él (✕, ausencia u otra mesa) | «Saliste de la mesa» |
| 2 | Quebró y no recargó | «Te quedaste sin fichas» |
| 3 | Quedó solo y **al menos un** rival abandonó (los demás, si los hubo, quebraron) | «Te quedaste solo en la mesa» (v1.9: sin nombre) |
| 4 | Quedó solo y **todos** los rivales quebraron | Las frases de victoria de siempre, al azar («¡Qué molleja! Arrasaste con la mesa.» entre ellas). Es el único caso en que son verdad, y su resultado es siempre positivo |

- La frase no depende del orden de las salidas, que la vista no guarda: la fila 3 es cierta en cualquier orden.
- «Saliste de la mesa» sustituye al borrador «Abandonaste la mesa»: quien se ausentó o perdió la conexión no eligió irse, y la frase no debe sonar a reproche.
- Ganar la mesa **ya no se decide por quién queda en pie**: la celebración la decide el signo del resultado.
- **Aspecto de los tonos** (lámina L-M 3, v1.9): la **celebración** es la de siempre; el **neutro**, la frase en blanco sin oro y «0 Heptacoins» en gris bajo un filo fino; el **sobrio**, la frase en blanco y la cifra en rojo dentro de una pastilla con borde rojo. Contra las IAS la pantalla final no cambia.

### 8.4 El sorteo de la Mano sobre la mesa — SELLADO (Victor, 2026-11-06, lámina L-M tanda 1)

Al arrancar la partida, de la sala de espera se pasa **directo a la mesa**, en los tres casos (se sientan todos, vence el tiempo o el anfitrión arranca con los sentados), y el sorteo se juega ahí. No hay pantalla intermedia, capa aparte ni texto de espera. La mecánica es la de §8 y el Contrato §6; aquí, lo que se ve y lo que se dice.

**El arranque** (v1.10)

| Punto | Regla |
|---|---|
| **La mesa provisional** | Si el teléfono **vio la cuenta atrás de la sala llegar a 0**, la mesa aparece al instante, con los asientos en el orden de llegada, «Tú» en el propio y el mazo **barajando** en el asiento del anfitrión, sin «Pozo 0» ni texto de espera, mientras llega la partida del servidor |
| **Quien vuelve con la partida ya en curso** | Si el teléfono vuelve a la sala o a la app con la partida ya corriendo, ve la mesa **sin texto** hasta que llega la real: nunca un barajado que ya no está pasando |
| **Quien llega tarde** | **Nunca ve cartas ya repartidas.** Ve la ceremonia entera desde el barajado, acelerada para terminar cuando el árbitro abre la elección: el barajado dura **al menos 1 s** y el reparto se acelera **hasta 150 ms por carta**. Mientras espera la partida, tras el barajado, el mazo espera quieto |
| **Si ni así hay tiempo** | El reparto termina dentro de la elección. El reloj de 10 s es el del árbitro y sigue corriendo: el tiempo que se coma el reparto son segundos menos para elegir. Sus cartas se pueden tocar en cuanto aterriza la última. Si llega ya en el volteo, ve la mesa tal como está |

**Las cartas**

| Punto | Regla |
|---|---|
| **El mazo** | En el asiento del **anfitrión**. De ahí salen las cartas y ahí vuelven |
| **El reparto** | **De una en una, intercalado**, como en una mano de verdad, en **sentido antihorario**: la primera carta al jugador a la derecha del anfitrión y la última al anfitrión. En un desempate solo reciben los empatados |
| **La velocidad** | **Siempre Rápido**, aunque la partida sea Normal. Las cartas vuelven al mazo también en Rápido |
| **Lo que ve cada uno** | Sus 5 cartas boca abajo, y los dorsos de los demás en sus asientos. La carta que elige cada jugador **se adelanta**, también en los asientos ajenos |
| **El volteo** | Las elegidas se voltean a la vez; la ganadora **brilla** y la marca de Mano **se desliza** a su asiento |
| **Entre rondas** | Todas las cartas vuelven al mazo y se baraja el mazo completo. Nada de una ronda se queda a la vista en la siguiente |

**El cronómetro**

- Va en su sitio natural del turno. **Cada jugador ve solo el suyo**, y desaparece al elegir.
- **Aviso de poco tiempo** a los **3, 2 y 1 s** (el rojo y el sonido del turno), solo para quien aún no ha elegido.
- Un sorteo vencido no cuenta como turno perdido para la ausencia (§8.2).

**El sonido** (v1.10)

| Momento | Sonido |
|---|---|
| Barajado | El de barajar de la mesa, **cortado con su desvanecido al terminar el barajado** |
| Reparto | Un golpe de carta por cada carta |
| Volteo | El de la revelación, una sola vez |
| Aviso de 3, 2 y 1 s | El aviso del turno (§8.4, el cronómetro) |
| «¡Ya tenemos Mano!» | **Ningún sonido extra**: el volteo ya sonó |

- Todos respetan el interruptor de Sonido del ⚙ y el silencio con la pantalla bloqueada.
- Se precargan en la sala de espera, junto con las caras de las cartas, para que el primero no llegue tarde.

**Los textos** — en el óvalo de la crónica, **sin nombres**, iguales para todos:

| Momento | Texto |
|---|---|
| Hay que elegir | «Elige una carta para saber quién es Mano» |
| Empate | «Hay empate entre {n} jugadores, vamos a desempatar» |
| Tercer empate | «Tercer empate: el azar decide» |
| Ya hay Mano | «¡Ya tenemos Mano!» |

- Quien **no está en un desempate** ve el mensaje de empate hasta el volteo, en lugar de «Elige una carta…»: no tiene nada que elegir.
- {n} es el número de empatados, en cifra.
- Los textos van dentro del óvalo **sin cambiar su tamaño** en ninguna pantalla, también en la mesa de 2 en el teléfono apaisado.

**Lo que se oculta durante el sorteo**

- «Comodín activo» y el pozo, **sin quitar su caja**: la mesa no se mueve cuando reaparecen (regla de los transitorios).

**Los nombres en la mesa** (toda la mesa PvP, no solo el sorteo)

- Tu propio asiento dice **«Tú»**, sin tu nombre. La voz te habla en segunda persona («Pasas»); los demás te ven por tu nombre.
- Los nombres se cortan a **10 caracteres** con «…» en la crónica, en «{nombre} está pensando…» y en los titulares y las capas del pago (v1.10). Así un nombre largo no desborda el óvalo ni lo hace crecer.
- **La voz del pago entre personas** es la de humanos: nunca dice «la IA», y sus cifras llevan punto de millar («A {nombre} se le devuelven 1.800 Heptacoins.») (v1.10).

### 8.5 La transición entre manos — SELLADO (Victor, 2026-11-07, lámina L-M tanda 3)

En **las dos mesas** (personas e IAS), desde la **mano 2** (la mano 1 de PvP la anuncia el sorteo):
- **Las cartas se desvanecen en su sitio** (380 ms) y **solo se desliza la marca de Mano** (y la del Pie) a su asiento nuevo (480 ms).
- **Una pastilla breve** (1,9 s), en el cuarto alto del óvalo (en la mesa de 2 apaisada, en el centro de la franja del pozo y la crónica), sin tapar cartas propias ni botones:

| Quién es Mano | Texto |
|---|---|
| Otro jugador | «Mano {n} · Es Mano {nombre}» |
| Tú | «Mano {n} · Eres Mano» |
| Una IA, en las mesas de 3 a 5 | «Mano {n} · Es Mano IA {k}» |
| La IA, en la mesa de 2 | «Mano {n} · Es Mano IA» (v1.10) |

- {nombre}, cortado a 10 caracteres (§8.4).
- **En PvP no añade tiempo:** cabe en la pausa entre manos. **Contra las IAS** arranca al pulsar «Siguiente mano» y añade **80 ms** (del clic al barajado: 310 → 390 ms).
- Es la **única** cosa de la mesa contra las IAS que cambia en MES-PvP, y lo hace con su control completo.

### 8.6 La pausa de anuncio en PvP — SELLADO (Victor, 2026-11-04 a 2026-11-07)

- Cae **antes de las manos 6, 12, 17, 23, 28, 34, 39, 45…** (después de las manos 5, 11, 16, 22…: saltos alternos de 6 y 5). Dura hasta que vuelven todos o vencen **45 s**.
- **Anuncio simulado con «Omitir»** hasta que exista la red de anuncios.
- **Quien vuelve antes** ve una tarjeta **centrada con velo** que dice «{nombre} sigue en el anuncio» o «{n} jugadores siguen en el anuncio» ({n}, en cifra) y, debajo, **«La publicidad ayuda a mantener el juego, gracias por tu comprensión»**.
- **«Quitar publicidad»** (llamativo pero discreto, zona táctil de 40 px) abre en el sitio **«Premium · Pronto»**, sin salir de la mesa ni navegar a la tienda, hasta que exista Premium.
- Durante el anuncio propio no se pinta ningún mensaje de la mesa, y al volver no hay cola.

### 8.7 La reposición del descarte en PvP — SELLADO en mecánica (Victor, 2026-11-05 y 2026-11-07)

La construye la sub-tanda 5b de MES-PvP, con el Contrato v1.4 y su deploy; Victor la mira antes en su lámina. Hasta entonces el código va por detrás de esta regla: repone a todos a la vez.

| Punto | Regla |
|---|---|
| **Uno a uno** | Con **el mismo orden y la misma velocidad que contra las IAS**: de la Mano al Pie, asiento a asiento, con su voz («{nombre} descarta 2.» o «{nombre} no descarta.») |
| **Quién entra** | Solo los que siguen en la mano. Fuera quedan los retirados, los abandonados y quien está sentado fuera por una recarga. El ausente entra, sin descartar |
| **Rápido** | ×0,5 en **toda** la reposición, pausas y vuelos, **salvo** el arranque de 100 ms y el cierre de 500 ms (el volteo de la propia carta no escala). Normal va igual que contra las IAS |
| **Las cartas de los rivales** | Salen como dorsos: se mueven **las primeras** de su mano, tantas como descartó |
| **El teléfono que llega tarde** | Se ajusta al reloj del árbitro: los pasos ya vencidos se aplican sin vuelo, y termina a la vez que los demás. Ninguna ranura queda vacía con el reloj del turno siguiente corriendo |
| **Contra las IAS** | No cambia nada |

---

## 9. El contrato del árbitro de MOT-1

El árbitro existe (MOT-1, cerrada en `de468b3`) y su normativo es `docs/AJILEI_MOT-1_Contrato_v1.0.md`. De este documento hereda:

- `pozos.js` (protegido, v1.9) con sus once motivos (§3.2), que el árbitro reexporta sin copiarlos;
- la forma del estado: `contribMano`, `allIn`, `entrada` por jugador; `pot` entero con capas derivadas (§4.3);
- **`abrirApuesta`**: una fase con ≤ 1 pendiente no se abre (§4.4);
- quién gana la mano: el principal, la capa 0 (§4.3), también para el libro de puntos contra humanos;
- la recarga PvP (§8.1): una acción del árbitro y un movimiento de billetera, con su plazo; el detalle, en el Contrato v1.3;
- el abandono (§8.2): abandonar es retirarse y la partida termina con menos de 2 sentados; es la regla **C-8 del Contrato v1.2**, que sustituye a la de «sigue disputando lo que puso»;
- el sorteo de la Mano en pantalla (§8.4): el reparto del sorteo dura según cuántos participan, y el árbitro debe esperar a que termine antes de arrancar el reloj de elección; la cifra, en el Contrato v1.3;
- la reposición uno a uno (§8.7): el árbitro espera lo que dura la reposición en el cliente, según el ritmo; la fórmula, en el Contrato v1.4;
- el generador inyectable de `deck.js` y `aiPlayer.js` (§6.11).

Lo demás (acciones, motivos propios del árbitro, vista de cada asiento, bus, reloj, sorteo, dinero y puntos) vive solo en el Contrato.

---

## 10. Tabla de parámetros

| Parámetro | Valor | Clase | Dónde vive |
|---|---|---|---|
| Multiplicadores | `[1, 2, 5, 10]` | SELLADO | `betting.multiplicadores` |
| Piso · Medio · Techo de entrada (vs IAS) | 10× · 20× · 50× | SELLADO (1f) | `entrada.js` / `betting.entrada` |
| Corta · Llena (PvP) | 15× · 50× | SELLADO (APU-1 macro 2, MOT-1) | `salas.js` y SQL de salas (Contrato §1) |
| Factor de la pila de las IAS | 1,5 | SELLADO (1c-2) | `ia.factorPila` |
| Bono de bienvenida | 2.500 HC, una vez por correo real | SELLADO | servidor (ECO-1) |
| Listón de recarga automática | pila < 5× unit | SELLADO | `betting.recarga.umbral` |
| Plazo de la pregunta | 15 s **desde el fin de la revelación**; al vencer, «No recargar» (automática) o «Salir con mis fichas» (forzosa) | SELLADO (1f, REC-1) | `betting.recarga.plazoMs` |
| Apertura sola de la tarjeta | en los últimos 5 s del plazo; desde ahí, sin plegar | SELLADO (REC-1) | constante de REC-1 en `mesaCore.js` |
| Montos de recarga | 10× · 20× · al techo | SELLADO | derivados de `entrada.js` |
| Umbral de subida fuerte por mesa y reto | Básico {43,42,40,41} · Av/Pro {41,40,38,39} | SELLADO | `ia.subidaFuerte.porMesa.<reto>` |
| `porReto` | los tres encendidos | SELLADO | `ia.subidaFuerte.porReto` |
| Tamaño de bloque de farol | 15 / 12 / 8 | SELLADO | `ia.farol.bloquePorReto` |
| Piso de puntaje del farol por mesa | {26, 28, 28, 28} | SELLADO | `ia.farol.pisoPuntajePorMesa` |
| Fracción del pozo (pago y all-in) | 0,33 | SELLADO | `ia.fraccionPozo.<reto>` |
| Solo contra el humano | `{basico: true}` | SELLADO | `ia.soloContraHumano` |
| Puntaje mínimo de all-in | 31 | VIGENTE | `ia.allIn.puntajeMin` |
| Desplazamiento por temperamento | ±2 | VIGENTE | perfiles de `aiPlayer.js` |
| Pasar con mano grande | 0 / 0,15 / 0,25 | SELLADO | `ia.pasarConManoGrande` |
| Ritmo por peso | 700–1.000 · 1.000–1.500 · 1.500–2.200 ms | SELLADO | `ui.ritmoIA` |
| Recarga PvP: monto | `entrada − pila` (hasta la entrada, nunca más) | SELLADO (MES-PvP) | árbitro (Contrato v1.3) |
| Recarga PvP: veces por partida | Sin tope | SELLADO (MES-PvP) | — |
| Recarga PvP: plazo de la oferta al quebrar | La pausa entre manos y, si no decide, una mano sentado fuera; en la mesa de 2, retención de 15 s (`oferta_recarga`) | Mecánica SELLADA; los 15 s, provisionales hasta los testers | Contrato v1.3 §6 · `config/esperas.js` (`OFERTA_RECARGA_MS`) |
| Recarga PvP: anillo de la oferta | Uno solo: resto de la pausa + 300 ms + 15.000 ms (18 s con revelación, 20 s sin ella); sin anillo en la pausa de anuncio | SELLADO (MES-PvP v1.3-c) | cliente (`entreManosCore`) |
| Sorteo PvP: velocidad del reparto | Siempre Rápido: 297,5 ms por carta | SELLADO (MES-PvP) | cliente (`sorteoMesaCore`) |
| Transición entre manos | Desvanecido 380 ms, deslizamiento 480 ms, pastilla 1,9 s; +80 ms contra las IAS | SELLADO (MES-PvP) | cliente (`transicionCore`) |
| Pausa de anuncio PvP | Antes de las manos 6, 12, 17, 23…; hasta 45 s | SELLADO (MES-PvP) | árbitro |
| Sorteo PvP: duración del reparto | `120 + 5 · P · 297,5 + 400` ms (P = participantes de la ronda): unos 3,5 s con 2 y 8 s con 5 | SELLADO (MES-PvP) | `config/esperas.js` (`esperaRepartoSorteo`) · Contrato v1.3 |
| Sorteo PvP: quien llega tarde | Barajado de al menos 1.000 ms; reparto acelerado hasta 150 ms por carta | SELLADO (MES-PvP 5a) | cliente (`sorteoMesaCore`) |
| Sorteo PvP: aviso de poco tiempo | A los 3, 2 y 1 s de los 10, solo a quien no ha elegido | SELLADO (MES-PvP) | cliente |
| Corte de nombres en la mesa PvP | 10 caracteres con «…», en la crónica, «está pensando…» y el pago | SELLADO (MES-PvP) | `lib/corteVoz.js` (`CORTE_VOZ`), aplicado por `cronicaCore.nombreEnVoz` |
| Reposición PvP | Uno a uno: `R = 100 + f · Σ por asiento [n = 0 → 750 ; n ≥ 1 → 2.175 + 412,5 · (n − 1)] + 500` ms; f = 1 en Normal y 0,5 en Rápido | SELLADO en mecánica (MES-PvP 5b) | `config/esperas.js` · Contrato v1.4 |
| Pila de pruebas y banco | 5.000 | — | `economy.pilaPruebas` (no es economía del juego) |

---

## 11. Varas y método — SELLADO (1d, 1c-2, 1e-iv)

Las cifras de §6 se fijaron con el banco (`bancoNiveles.mjs`, ~100.000 manos/s, sembrado, cuatro conductores: `espejo`, `pasivo`, `aleatorio`, `mañoso` con la maña de Victor transcrita) contra estas varas:

| Vara | Rango | Dónde se evalúa | Al sellar |
|---|---|---|---|
| **V1** · mañoso vs 1 Básica, mesa 2 | victorias 60–80 % | **50×** | 75,2 % |
| **V2** · mañoso vs 4 IAS, mesa 5 | mediana 10–35 · p10 ≥ 3 | **15×** (re-evaluar a 20× en commits) | 29 / 31 / 31 |
| **V3** · caída Básico→Pro | ≥ 10 pp | 15× | 16,3 · 12,2 · 4,9 · 5,4 (hueco en mesas 4/5 aceptado y validado en mano) |
| **V4** · faroles pagados que pierden | 40–60 % | **bajo `espejo`** (D-30: la vara nombra su conductor) | 12/12 |
| **V6** · franja del ×1 | > 0 | aritmética | en rango |
| **V7** · espejo mesa 5 | mediana ≥ 12 | 50× | 266 / 22 / 25 |

**Oro de Básico** (`scripts/oro/`): fotografía decisión a decisión, con el multiplicador dentro de la identidad, más la contabilidad que demuestra que las divergencias salen de las cifras y no del código. **Bandas** (`scripts/apu1_bandas.json`, rastreado): 84 celdas; desde 1e-iv la clave lleva la **apuesta de mesa**, la siembra y los blobs de los tres archivos que el banco mide, y el lector imprime `VARA DE OTRA ENTRADA` / `VARA DE OTRO MOTOR` / `SIN VARA` con un veredicto de una línea que empieza por `INCOMPARABLE` cuando algo no se pudo comparar (E-24…E-26). Lecciones de método: una tanda que selle varias cifras re-mide todo con la configuración final antes de proponer (D-31); una vara que baja u oscila sin que nadie toque nada se investiga antes de creerla (E-11, E-19); una medida absoluta sin viewport y navegador al lado no es una medida (E-28).

---

## 12. Economía — resuelta en ECO-1

Ganarle a la IA acuña Heptacoins. ECO-1 dejó el saldo persistente en el servidor y construyó la válvula (un tope diario de ganancia contra las IAS) **apagada**; se decide tras los testers. Las reglas de la billetera, el bono, la constancia y el video de recompensa viven en el normativo de ECO-1, no aquí.

---

## 13. Qué cambia respecto a la v1.0

| § | v1.0 | v1.1 | Fase |
|---|---|---|---|
| 2.2 | piso 5× · medio 15× | **10× · 20×** | 1f |
| 2.3 / 5.3 / 10 | `entrada + 1.000` | **`× 1,5`, topado** | 1c-2 |
| 2.4 | — | el ante que deja la pila en cero marca all-in | 1d |
| 3.2 | forma de rechazo por fijar | mismo objeto + once motivos; la pantalla aplica el mismo `k` | 1b, 1e |
| 4.2 | — | **un all-in debe ser respondido por todo pendiente** | 1e-iii |
| 4.4 | «rondas restantes no existen», desde pantalla | **regla del motor** (`abrirApuesta`); D-12 en dos rutas | 1e-iii |
| 4.5 | frase propia del all-in | sexto verbo; marca ALL-IN; línea del humano; **capas agrupadas por ganador** | 1c-2, 1e |
| 5.1 | 10 s | **15 s**; voluntaria desde la primera mano; forzosa también por D-12 | 1e, 1f |
| 5.2 | selector por definir | Mínimo 10× · Medio 20× · Al techo | 1e, 1f |
| 5.3 | — | la promesa en el subtítulo, sin nota aparte | 1f |
| 5.4 | — | forzosa bloquea; automática y voluntaria sin velo | 1e |
| 6.3 | ⟨41/40/36/33⟩ | por reto; Básico {43,42,40,41}; D-29 | 1d, 1c-2 |
| 6.4 | ⟨15/12/8⟩ | sellados; piso R-A; traslado; «pone dinero delante» | 1c, 1c-2 |
| 6.5 / 6.6 | ⟨¼⟩ | **0,33** | 1c-2 |
| 6.9 | ⟨700–2.200⟩ | tres bandas por `peso` | 1e-iii, 1f |
| 6.12 | — | **R-D**, Básico solo contra el humano | 1c-2 |
| 7 | lámina por definir | conserva jugadores al cambiar reto; columna apretada; chips 10/20/50 | 1e, 1f |
| 11 | predicciones | varas selladas; V4 bajo espejo; bandas con entrada, siembra y blobs | 1d, 1c-2, 1e-iv |

### v1.1 → v1.2 (REC-1, 2026-09-26)

- **§5.1:** la forzosa se evalúa al cerrar la mano (y entre manos) y comparte el plazo de 15 s con la automática. El texto se alinea con el código.
- **§5.1 y §5.5:** la automática y la forzosa se presentan con la burbuja y el plazo cuenta desde el fin de la revelación. La voluntaria sigue sin burbuja ni plazo.
- **§5.4:** la forzosa solo lleva velo abierta; cronómetro a la izquierda y «Ver la mesa» en las dos tarjetas; separaciones de A5 en todas las pantallas; piso táctil de 36 px (acciones de la forzosa ≥ 40).
- **§5.5 nuevo:** la burbuja.
- **§10:** plazo desde el fin de la revelación; fila nueva de apertura sola a los 5 s.
- **§5.4 (cierre de la Fase 1):**
  - la cifra «≤ 142,78 px» de A2, que A5 ya había dejado atrás, pasa a «≤ 163 px y 0 px² sobre las cartas» en 360×640;
  - la automática va sin título en el teléfono vertical;
  - en escritorio y en el apaisado, la tarjeta blanda abierta puede cubrir la mano, que se recupera con «Ver la mesa».

### Adenda PAN-1 (2026-10-05, sin cambio de versión)

- **§5.4, el piso táctil de la tarjeta:** la regla pasa de «ningún botón baja de 36 px» a **zona táctil de 40 px por eje** en cada botón (INV-07). La caja visible no cambia: 36 en la blanda y en «Ver la mesa», 42 en las acciones de la forzosa. Subir la caja a 40 tapaba la mano en 360×640 (A2), y por eso la zona la da un `::after` transparente con `min(0px, calc(50% - 20px))` por lado, que solo crece lo que falta. Decisión del rector en la 1b de PAN-1 (opción b); lo vigilan `diagDSK apu` (`zonaMin`, `bajoZona`) y `diagDSK rec` («Ver la mesa»).

### v1.3 → v1.4 (VOZ-3, 2026-10-23)

- **§4.3:** la mano la gana el principal (la capa 0) y `winner` del motor no se lee en pantalla en el pago; las tres cuentas de lo que cobra un asiento (disputado, vuelto y ganado sin disputa). Lo vigilan `scripts/testVoz3.test.js` (C1–C10, el control al byte y el barrido de 1.500 mesas por tamaño), `src/hooks/mesaIACore.test.js` (el récord), `diagDSK msg` (el ganador derivado de las cartas, D12) y `diagDSK apu` (apu.8 y apu.9, C1 y C3 pintados con `?apu=allin` y `?apu=allin-espejo`).
- **§4.5:** el titular del principal; la cola agrupada por asiento con lo ganado sin disputa; las devoluciones por asiento; el tono `neutro`; la mano de una capa, al byte. Lo vigilan `scripts/testVoz3.test.js` y `scripts/testMesaAPU1.test.js` §6.
- **§5.5:** el vuelo va al principal y lo retenido es lo que él cobra (VOZ-3, D9). Las devoluciones y los cobros ajenos no vuelan: aparecen en su pila en el acto.
- Informe: `docs/reportes/AJILEI_VOZ-3_Fase1_Informe_v1.0.md`. La regla es INV-63 del registro de invariantes.

### v1.4 → v1.5 (cierre de MOT-1, 2026-11-04)

- **§3.2:** los once motivos con su literal de `pozos.js:28-40` (antes, cinco con otro nombre: `all_in` → `en_all_in`, `apuesta_viva` → `hay_apuesta`, `sin_apuesta_viva` → `sin_apuesta`, `nada_que_igualar` → `all_in_no_procede`, `fase_sin_apuesta` → `fase`); `pozos.js` protegido (Protegidos v1.9). Señalado por el Contrato del árbitro §3.
- **§1, §2.2, §2.5, §10, §12:** el saldo provisional y el saldo de sesión, retirados; la billetera vive en el servidor desde ECO-1. Ninguna regla de mesa cambia.
- **§4.3:** se dice por escrito que el pozo sigue siendo un entero (lo mismo corrige la fila E-4 de Protegidos §7.1).
- **§6.11, §8, §9:** al día con MOT-1 (CSPRNG del árbitro; macro 2 con siete apuestas, Corta por defecto, ritmo del anfitrión, garantía, una partida por cuenta y sorteo de cinco cartas; el contrato existe).
- Ninguna cifra de §10 se mueve. La única fila nueva de §10 (Corta · Llena) ya estaba sellada en §8.

### v1.5 → v1.6 (MES-PvP, 2026-11-05)

- **§8.1 nueva:** la recarga PvP, solo hasta la entrada, entre manos, sin tope de veces y con confirmación que muestra el saldo. Ofrecida sola al quebrar; la mesa no espera (quien no decide se salta una mano); la partida no termina mientras la oferta de quien quebró siga abierta.
- **§1, §2.4, §5.5, §8, §9, §10:** al día con la regla nueva. Contra las IAS no cambia nada.
- Decisión de Victor (2026-11-05), que sustituye a «Sin recarga» (APU-1 macro 2, 2026-09-17). La construye MES-PvP en su sub-tanda propia, con el Contrato v1.2 (desde la v1.7, **v1.3**).

### v1.6 → v1.7 (MES-PvP, 2026-11-06)

- **§8.2 nueva:** el abandono en PvP. Abandonar es retirarse en el acto, en cualquier fase; si queda uno solo en la mano, cobra el pozo; con menos de 2 sentados la partida termina sin empezar otra mano; quien se va cobra su pila y nunca más. Las tres vías (✕, ausencia, otra mesa) se dicen igual.
- **§8.3 nueva:** la pantalla final en PvP. El tono por el signo del resultado (celebración, neutro, sobrio); la frase por cómo terminó, con cinco casos sellados; las frases de victoria solo cuando el jugador se quedó con todas las fichas.
- **§1, §8, §8.1, §9, §10:** al día con las reglas nuevas y con la renumeración del Contrato (la recarga pasa al Contrato v1.3; el abandono es la C-8 del v1.2). Contra las IAS no cambia nada.
- Decisión de Victor (2026-11-06), tras su prueba en ajilei.io y la sonda sobre `db0313b`. La construye MES-PvP en la sub-tanda 3-A, con el árbitro y el Contrato v1.2.

### v1.7 → v1.8 (MES-PvP, 2026-11-06)

- **§8.4 nueva:** el sorteo de la Mano sobre la mesa. De la sala de espera directo a la mesa; mazo en el asiento del anfitrión; reparto de una en una, intercalado y antihorario, siempre en Rápido; cronómetro propio con aviso a los 3, 2 y 1 s; los cuatro textos neutrales en el óvalo; «Comodín activo» y el pozo ocultos sin quitar su caja; «Tú» en el asiento propio y el corte de nombres en 10.
- **§8:** el sorteo no sigue el ritmo del anfitrión; el volteo dura 5 s (Contrato v1.3); la entrada se sigue cobrando al sentarse y no al decidirse la Mano.
- **§1, §9, §10:** al día con lo anterior. Contra las IAS no cambia nada.
- Decisión de Victor (2026-11-06), tras la tanda 1 de la lámina L-M y la sonda de solo lectura sobre `ac96f51`. Los textos vivían en `TEXTOS_SORTEO` (`lib/sorteoMesaCore.js`); desde esta versión son contrato, y las claves viejas `pvp.sorteo.*` pueden retirarse. Lo construye MES-PvP; el árbitro aprende la duración del reparto con el Contrato v1.3.

### v1.8 → v1.9 (MES-PvP, 2026-11-07)

- **§8.1:** la recarga voluntaria se pide desde la moneda del ⋮ en cualquier momento y se aplica al abrirse la pausa; textos de la recarga PvP sellados.
- **§8.2:** el aviso de ausencia, «1 turno más y saldrás de la mesa».
- **§8.3:** las filas 3 y 4 se funden en «Te quedaste solo en la mesa», sin nombre; aspecto de los tonos neutro y sobrio.
- **§8.5 nueva:** la transición entre manos, en las dos mesas.
- **§8.6 nueva:** la pausa de anuncio en PvP.
- **§10:** dos filas nuevas. Ninguna cifra de dinero cambia; contra las IAS solo cambia la transición.
- Decisiones de Victor (2026-11-06 y 2026-11-07), tras las tandas 2 y 3 de la lámina L-M (`main` en `efd4c33`, sin push).

### v1.9 → v1.10 (MES-PvP, 2026-11-10)

- **§8:** el ritmo del anfitrión acelera también la reposición.
- **§8.1:** «Entendido» en el saldo insuficiente; «Ahora no» solo cierra la tarjeta; «Entras en la próxima mano» para quien recarga sentado fuera; la oferta vencida no cuenta para la ausencia; un solo anillo en la oferta, sin anillo en la pausa de anuncio.
- **§8.4:** la mesa provisional en lugar de «Arrancando la partida…»; quien llega tarde ve la ceremonia entera; el sonido del sorteo; el corte de nombres en toda la mesa y la voz del pago entre personas.
- **§8.5 y §8.6:** la pastilla de la mesa de 2 contra las IAS; `{N}` pasa a `{n}`, como en el código.
- **§8.7 nueva:** la reposición uno a uno en PvP.
- **§9 y §10:** al día. Ninguna cifra de dinero cambia; contra las IAS no cambia nada.
- Decisiones de Victor en el túnel del árbitro v1.3 (2026-11-08, publicado en `7a8c7c1`) y en la lámina de la sub-tanda 5a (2026-11-09 y 2026-11-10).
