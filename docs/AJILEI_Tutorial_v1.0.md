# AJILEI · Tutorial · Normativo v1.0 · El guion

**Fecha:** 2026-11-20. **Estado:** SELLADO por Victor (v0.2 aprobada sin cambios el 2026-11-20; la v1.0 añade el paso del descarte en el capítulo 3 y la forma elegida en la lámina). Vive en `docs/AJILEI_Tutorial_v1.0.md` desde la tanda 1 de TUT-1. Donde el código y este documento difieran, el código está equivocado, salvo en la regla D-29 (§4).
**Fuentes:** las Reglas de APU-1 v1.12 (dinero, apuestas, IAS) y las reglas del juego validadas por Victor con el experto (2026-06-05) y selladas en `AJILEI_Modos_y_Asistencia`.
**Qué es:** el texto maestro del onboarding: la partida guiada (GUI-1), las señales de primera vez y los diez capítulos de la serie (TUT-1). Todo lo que aquí es rótulo sale de `t()`; no hay voz en la v1.
**Lo que decide la forma** (Victor, 2026-11-20): la partida guiada es la puerta de entrada, saltable; la serie es la biblioteca, en pasos tocables; sin voz; las señales de primera vez entran en GUI-1; la recompensa al completar queda diseñada con el hueco y se enciende en GEN-1. **La guiada es cerrada:** en cada paso un solo control responde y el rótulo dice cuál; el jugador no elige, para que el resultado de cada mano esté garantizado. La libertad llega en la primera partida real, con las señales.
**La forma elegida en la lámina** (Victor, 2026-11-20, PC y S25): la oferta del primer login **centrada sobre el lobby atenuado** (variante a); la señal de primera vez **con fondo**, colocada donde no tape nada (en vertical arriba, sobre los rivales; en el acostado arriba a la derecha; en la PC bajo la fila); los capítulos con **velo suave y el rótulo pegado al botón en burbuja** (variante b), con «paso n de m» dentro de la burbuja y la tarjeta fija como respaldo cuando la burbuja no tiene sitio.
**Regla de escritura, «a prueba de dummies»:** en cada paso, una sola cosa en pantalla señalada, una sola acción posible, y una razón de pocas palabras. Techo del rótulo: dos líneas en 360 × 640 con la letra de LEC-1. Nunca se explica lo que el jugador va a ver en el paso siguiente. Se habla de «tú», en presente, sin tecnicismos («la suma», no «el puntaje»).

---

## Las reglas del juego que el tutorial enseña (la fuente, para que nadie las reescriba)

| Regla | Valor | Fuente |
|---|---|---|
| La baraja | Española, 40 cartas, cuatro palos (oros, copas, espadas, bastos); de 2 a 5 jugadores | Modos y Asistencia |
| El As | **11** | Victor con el experto, 2026-06-05 |
| El 6 y el 7 | **6 y 7** | Ídem |
| 2, 3, 4, 5, sota, caballo y rey | **10** | Ídem |
| Solo suma el mismo palo | Tu suma es la del mejor palo que tengas; techo sin AJILEI, 41 (APU-1 §1, D-29) | APU-1 v1.12 |
| **AJILEI** | **51**: As y cuatro cartas de 10 del mismo palo. La jugada que gana | Ídem |
| El 7 de Oro | Mesas de 2 y 3: una carta más (vale 7, palo oros). **Mesa de 4: comodín, vale 10.** **Mesa de 5: comodín, vale 11**, y hace posible el **52**, único e imbatible | Victor con el experto; APU-1 §2.1 («la nota del comodín en 4 y 5») |
| Empate | Gana **la Mano**; si la Mano no está en el empate, el más cercano a la Mano | Ídem; APU-1 §4.3 («la Mano gana») |
| Una mano | Dos cartas → apuesta → cinco cartas → apuesta → descarte y reposición → apuesta → se muestran (`BET_1`, `BET_2`, `BET_3`) | APU-1 §1 |
| Apostar | Pasar · Apostar · Igualar · Subir · Retirarse; multiplicadores **×1 · ×2 · ×5 · ×10** sobre la apuesta de mesa; All-in solo cuando no alcanza para pagar | APU-1 §3.1, §4.1 |
| El ante | Cada mano, cada jugador vivo paga un ante = la apuesta de mesa | APU-1 §2.4 |
| La recarga | Contra las IAS: cuando la pila baja, 10× · 20× · al techo, y las IAS se nivelan contigo. Entre personas: solo hasta la entrada | APU-1 §5, §8.1 |
| Los rivales de las IAS | Se llaman «IA 1», «IA 2»… en las mesas de 3 a 5; «la IA» en la de 2 | APU-1 §4.5 |

Un ⚠ que queda: el motor trata «cinco cartas del mismo palo» como AJILEI por su propia rama (D-29). Si una mano de cinco del palo que no suma 51 cuenta o no como AJILEI lo dice el motor, y la tanda 2 lo comprueba antes de sellar el capítulo 4.

---

## 0 · El vocabulario que usa todo el tutorial

Se fija aquí para que los rótulos, los botones y Mia digan lo mismo.

| Decimos | No decimos |
|---|---|
| tus cartas · el palo · la suma · los puntos · el mejor palo | la mano (para las cartas), la combinación |
| Mano (la ronda de juego, con mayúscula cuando es «quién es Mano») | ronda, turno de reparto |
| apostar · pasar · igualar · subir · retirarse · all-in | call, check, fold, raise |
| el pozo | el bote |
| descartar · reponer | cambiar cartas |
| AJILEI (la jugada que gana en seco) | la escalera, el bingo |
| las IAS · otras personas | bots, oponentes, usuarios |
| Heptacoins / HC · tu saldo · tu pila (lo que tienes en la mesa) | créditos, fichas, dinero |

---

## 1 · GUI-1 · La partida guiada

### 1.1 Lo que es

Una mesa de 3 (tú, «IA 1» e «IA 2» como rivales de guion; sin comodín, que solo existe en las de 4 y 5), apuesta de mesa 100 y pilas holgadas (nadie se acerca a una recarga), ritmo Rápido, **sin servidor**: no cobra entrada, no mueve el saldo, no da puntos, no avisa pila (excepción escrita a INV-47). Tres manos con mazo preparado. En cada paso hay **un solo control activo**; el resto se ve atenuado y no responde. El reloj de turno está apagado; la pregunta de recarga no existe. Se puede salir en cualquier momento con «Saltar», y al salir el generador de la baraja se restaura (`resetRng`, R-2).

Dura unos dos minutos. Termina en una victoria con AJILEI.

### 1.2 Dónde se ofrece

- **Al primer login**, al aterrizar en el lobby justo después del Bautizo: una tarjeta pequeña, no una pantalla entera.
  - Título: **«¿Aprendemos en dos minutos?»**
  - Texto: «Una partida guiada. No gastas monedas.»
  - Botones: **«Jugar la guiada»** (principal) · «Ahora no» (secundario, cierra y no vuelve a salir sola).
- **Siempre**, desde «Cómo se juega» del lobby, como primera fila: «Partida guiada · 2 min».
- Marca local `ajilei.guia` (patrón `partidaRapida`, censo INV-12): `ofrecida`, `hecha`.

### 1.3 Las tres manos

Las **condiciones** de cada mano son el contrato que la tanda 2 cumple buscando el orden de baraja (la IA descarta lo que decide, vía (i) del informe de la Fase 0; el orden se elige de modo que ese descarte no estorbe la lección). Los rivales apuestan por guion y **nunca se retiran** (si quedara un solo pendiente, el motor saltaría la fase, APU-1 §4.4, y el paso desaparecería). Lo que manda es la condición; las cartas concretas las fija la tanda 2.

#### Mano 1 · «Tus cartas y el palo» (aprender a mirar)

**Condición:** tú recibes dos cartas del mismo palo; a cinco cartas tienes tres de ese palo y dos sueltas; tu mejor suma queda **por debajo** de la de un rival; nadie tiene AJILEI; el descarte no se toca (la lección es mirar, no decidir).

| Paso | Qué se ve | Rótulo (`t()`) | Único control |
|---|---|---|---|
| 1 | La mesa, tu asiento, el mazo; «Iniciar mano» con el aro | «Esta es tu mesa. Tú estás abajo. Toca **Iniciar mano**.» | Iniciar mano |
| 2 | Tus dos cartas, con el aro | «Tus cartas. Solo suman las del **mismo palo**.» | Siguiente |
| 3 | La fila de acciones, «Pasar» con el aro | «Todavía no apuestes. Toca **Pasar**.» | Pasar |
| 4 | Llegan tres cartas más; aro sobre las tres del palo | «Ya tienes cinco. Estas tres son del mismo palo: suman {n}.» | Siguiente |
| 5 | «Pasar» con el aro | «Pasa otra vez.» | Pasar |
| 6 | El descarte; «Sin descartar» con el aro | «Hoy no cambias nada. Toca **Sin descartar**.» | Sin descartar |
| 7 | «Pasar» con el aro | «Última apuesta. Pasa.» | Pasar |
| 8 | Se muestran las cartas; aro sobre el palo ganador del rival | «{rival} tenía {m} de {palo}. Tú {n}. **Gana la suma más alta.**» | Siguiente |

Cierre de la mano: «Perdiste esta. Ahora vamos a mejorar tus cartas.» → el único control es **Siguiente mano**.

#### Mano 2 · «Descartar» (aprender a decidir)

**Condición:** a cinco cartas tienes cuatro de un palo y una suelta; **antes** del descarte tu mejor suma está por debajo de un rival; la carta que repones es del palo bueno y **después** del descarte tu suma es la más alta; nadie tiene AJILEI.

| Paso | Qué se ve | Rótulo | Único control |
|---|---|---|---|
| 1 | Tus dos cartas | «Dos cartas del mismo palo. Buen comienzo.» | Siguiente |
| 2 | «Pasar» | «Pasa.» | Pasar |
| 3 | Cinco cartas; aro sobre la suelta | «Cuatro del mismo palo y **una que no suma**.» | Siguiente |
| 4 | «Pasar» | «Pasa.» | Pasar |
| 5 | La carta suelta con el aro | «Toca la carta que no suma.» | Esa carta |
| 6 | «Descartar 1» con el aro | «Ahora toca **Descartar**.» | Descartar |
| 7 | Llega la carta nueva, con el aro | «Te llegó una del palo. Ahora sumas {n}.» | Siguiente |
| 8 | «Pasar» | «Pasa.» | Pasar |
| 9 | Se muestran las cartas | «{n} contra {m}. **Ganaste.** Cambiar la carta sobrante valió.» | Siguiente |

Cierre: «Ya sabes mirar y cambiar. Falta apostar.» → **Siguiente mano**.

#### Mano 3 · «Apostar y ganar» (aprender a cobrar)

**Condición:** a cinco cartas tienes **AJILEI de 51** (As y cuatro cartas de 10 del mismo palo: la combinación concreta la elige la tanda 2 entre sota, caballo, rey, 2, 3, 4 y 5); los rivales igualan tu apuesta ×1 por guion y no se retiran; el descarte es «Sin descartar»; la revelación dispara la celebración de AJILEI.

| Paso | Qué se ve | Rótulo | Único control |
|---|---|---|---|
| 1 | Tus dos cartas | «As y una de diez, del mismo palo. Esto promete.» | Siguiente |
| 2 | «Pasar» | «Aún faltan cartas. Pasa.» | Pasar |
| 3 | Cinco cartas, las cinco con el aro | «**AJILEI.** As y cuatro de diez del mismo palo: 51. La jugada más alta.» | Siguiente |
| 4 | «Apostar» con el aro (×1 marcado; los otros multiplicadores en gris); el pozo | «Cuando tus cartas son buenas, **apuestas**. Toca Apostar.» | Apostar |
| 5 | Los rivales igualan; el pozo crece | «Igualaron. El pozo es de {pozo}.» | Siguiente |
| 6 | «Sin descartar» | «No cambies nada.» | Sin descartar |
| 7 | «Apostar» | «Apuesta otra vez.» | Apostar |
| 8 | Revelación y celebración | (la celebración real de AJILEI, sin rótulo) | — |
| 9 | Pantalla de cierre de la guiada | **«¡Ya sabes jugar!»** · «Mirar el palo, cambiar la que no suma, apostar cuando las cartas son buenas.» · [hueco de la recompensa, GEN-1] | **«Jugar de verdad»** → Retar a las IAS · «Volver al lobby» |

Marca `ajilei.guia = hecha`.

### 1.4 Las señales de primera vez (en la mesa real contra las IAS)

Tres pistas, una sola vez cada una, en las tres primeras manos reales. Aparecen cuando toca, se van al hacer la acción, y no vuelven (marca local `ajilei.guia.senales`, por pista).

| Cuándo (`GameTable`) | Rótulo | Se apaga con |
|---|---|---|
| Primer «Iniciar mano» | «Toca **Iniciar mano** cuando estés listo.» | `beginHand` |
| Primer turno de apuesta (`isPlayerTurnEarly`) | «Tu turno. **Pasar** no cuesta; **Apostar** mete monedas al pozo.» | `act` |
| Primer descarte (`isDiscardTimerActive`) | «Toca las cartas que no suman y luego **Descartar**. Tienes {s} segundos.» | `handleDiscard` |

Sin velo: aro y rótulo, para no tapar el reloj de turno. Quien hizo la guiada también las ve (son otra cosa: la mesa real tiene reloj y dinero).

---

## 2 · TUT-1 · La serie «Cómo se juega»

### 2.1 La forma

- Índice en «Cómo se juega» del lobby (hoy «Pronto»): la partida guiada arriba y los diez capítulos en tres pistas, con una marca ✓ de visto (local, `ajilei.guia.vistos`).
- Cada capítulo son **cuatro a seis pasos**; se avanza tocando «Siguiente» o la pantalla; «Volver» y «Cerrar» siempre a mano; «paso n de m» pequeño. Sin reproducción automática.
- **Capítulos de mesa (1–6):** sobre el modo guion, con la mesa de la guiada congelada en el momento del paso (IA y reloj en pausa, `useCongelado`).
- **Capítulos de la app (7–10):** sobre la pantalla real viva, con el velo y el hueco; el hueco solo deja pasar toques que no escriben nada; el capítulo termina **antes** del toque que escribe, señalándolo.
- El «?» del ⋮ de la mesa («Cómo se juega») abre el capítulo de la fase actual: reparto → 3 · apuesta → 5 · descarte → 3 (paso del descarte) · revelación → 4.

### 2.2 Los diez capítulos

**Pista A · El juego**

**1 · ¿Qué es AJILEI?**
1. Una mano de cinco cartas del mismo palo cae sobre la mesa, se ilumina → «Esto es un AJILEI: 51 puntos. La jugada que gana en seco.»
2. La baraja en abanico → «Baraja española: 40 cartas. Oros, copas, espadas y bastos.»
3. Las sillas → «Se juega de 2 a 5. Contra las IAS o con otras personas.»
4. Las monedas → «Se apuesta con Heptacoins. Nunca con dinero real.»

**2 · Cuánto vale cada carta** (la que la abuela va a releer)
1. El As con el aro → «El As vale **11**.»
2. Un 6 y un 7 → «El 6 vale 6 y el 7 vale 7.»
3. Sota, caballo y rey, y un 2, un 3, un 4 y un 5 → «Todo lo demás vale **10**: las figuras y también el 2, el 3, el 4 y el 5.»
4. Dos cartas de palos distintos, tachadas → «**Solo suman las del mismo palo.**»
5. Cinco cartas con la suma al lado → «Tu suma es la del mejor palo que tengas. Lo más que suma un palo sin AJILEI es 41.»
6. El 7 de Oro con el aro → «En las mesas de 4 y 5, el 7 de Oro es **comodín**: se junta con cualquier palo. Vale 10 con 4 y 11 con 5.»

**3 · Cómo va una mano**
1. Dos cartas → «Primero recibes dos.»
2. La fila de acciones → «Se apuesta.»
3. Cinco cartas → «Llegan tres más. Se apuesta otra vez.»
4. Cinco cartas, las del mejor palo con el aro y las otras tachadas → «**Quédate con tu mejor palo** y cambia el resto. Puedes cambiar hasta {tope}.» ({tope}: 5 en las mesas de 2 a 4, 3 en la de 5; la tanda 2 lo confirma contra el motor)
5. El descarte → «Tocas las que cambias y luego **Descartar**. Te reponen una a una.»
6. Última apuesta → «Se apuesta por última vez.»
7. Revelación → «Se muestran las cartas. Gana la suma más alta.»

**4 · Cómo se gana y cómo se pierde**
1. 51 iluminado → «**AJILEI**: As y cuatro de diez del mismo palo, 51 puntos.»
2. 52 con el 7 de Oro → «En la mesa de 5, As, tres de diez y el 7 de Oro suman **52**. Solo hay uno. Nadie lo iguala.»
3. Dos sumas frente a frente → «Sin AJILEI, gana la suma más alta del mejor palo.»
4. Empate, con la marca de Mano → «Si empatan, gana **la Mano**; si la Mano no empató, el que está más cerca de ella.»
5. La pila en cero → «Pierdes cuando tu pila se queda en cero. Contra las IAS puedes recargar; entre personas, hasta la entrada.»

**Pista B · Apostar**

**5 · Apostar, pasar, retirarse**
1. «Pasar» → «**Pasar** no cuesta: dejas que sigan los demás.»
2. «Apostar» y los multiplicadores → «**Apostar** mete monedas al pozo. ×1, ×2, ×5 y ×10 son cuántas apuestas pones.»
3. «Igualar» → «Si alguien apostó, **Igualar** es pagar lo mismo para seguir.»
4. «Subir» → «**Subir** es pagar más y obligar a los demás a decidir.»
5. «Retirarse» → «**Retirarse** es salir de la mano. Pierdes lo que ya pusiste, no más.»
6. Un multiplicador en gris → «Lo que está en gris no te alcanza o no se puede ahora.»

**6 · All-in y pozos**
1. «All-in» en lugar de «Igualar» → «Si te piden más de lo que tienes, puedes ir **all-in**: pones toda tu pila y tus cartas siguen jugando.»
2. El pozo partido en capas → «Con all-in solo puedes ganar lo que igualaste. El resto es otro pozo para los demás.»
3. La devolución del sobrante → «Lo que nadie iguala, se devuelve.»
4. La recarga → «Con la pila baja, puedes **recargar**. Contra las IAS, ellas se nivelan contigo; entre personas, hasta la entrada.»

**Pista C · La app**

**7 · Jugar contra las IAS** (pantalla viva: Retar)
1. Los niveles → «Elige el nivel. Básico para empezar.»
2. La apuesta → «Elige la apuesta. Lo que se juega en cada mano.»
3. La entrada → «La entrada es lo que llevas a la mesa. Se cobra al sentarte.»
4. «Sentarme a la mesa», señalado, no tocado → «Cuando quieras jugar de verdad, toca aquí.» · Cerrar

**8 · Jugar con otras personas** (pantallas vivas: Salas → Armar mesa)
1. «Jugar contra jugadores» del lobby → «Aquí se juega con gente de verdad.»
2. «Armar mesa» → «Armas una mesa y eliges cuántos, la apuesta y el ritmo.»
3. El código AJ-XXXX y «Compartir» → «Mandas el código o el enlace por WhatsApp.»
4. La sala de espera → «Cuando se sienten todos, la mesa arranca sola.»
5. «Entrar por código» → «Si te invitaron, pega aquí el código.» · Cerrar

**9 · El menú y los ajustes** (pantallas vivas: lobby + ⚙)
1. La píldora de saldo → «Tu saldo. Toca para ver tus monedas.»
2. El ⚙ → «Ajustes: sonido, idioma, perfil, eliminar cuenta.»
3. Rankings → «Los grandes maestros, por puntos. Las grandes fortunas, por saldo.»
4. La tienda → «Tapetes, avatares y monedas.»
5. El ⋮ en la mesa (captura congelada del guion) → «Dentro de la mesa, el ⋮ tiene el sonido, las reacciones y este tutorial.»

**10 · Consejos**
1. «Con dos cartas de palos distintos, no apuestes fuerte.»
2. «El pez grande se come al chico: si tienes mucha pila, aprieta.»
3. «Retirarse a tiempo también es ganar.»
4. «Mira el pozo antes de igualar: ¿vale lo que te piden?»
5. «Un AJILEI se apuesta. Siempre.»

### 2.3 Lo que se mide (sin servidor)

Nada en `eventos` en la v1. Las marcas locales (`hecha`, `vistos`, `senales`) bastan para que la app no insista. Si la ola grande necesita saber cuántos terminan la guiada, es un `tipo` de `eventos` escrito por el cliente, y se decide entonces.

---

## 3 · Claves de `t()` (orden de magnitud)

GUI-1 ≈ 35 (oferta 4 · mano 1 ×9 · mano 2 ×10 · mano 3 ×9 · cierre 3) · señales 3 · TUT-1 ≈ 60 (10 títulos + ≈ 48 pasos + índice) · común ≈ 8 (Siguiente, Volver, Cerrar, Saltar, paso n de m, Partida guiada, Cómo se juega, visto). **Total ≈ 105**, en `textos.tut.es.js` diferido, salvo las 4 de la oferta y la fila del ⋮.

---

## 4 · Lo que el motor tiene que confirmar (tanda 2)

1. El único ⚠ que queda: si el motor cuenta como AJILEI cinco cartas del mismo palo que no suman 51 (D-29). El capítulo 4 dice lo que el motor hace; si difieren, aquí se corrige el rótulo, no el motor.
2. El tope de cartas del descarte por tamaño de mesa (capítulo 3, paso 4).
3. Los tres órdenes de baraja de la guiada, fijados con una prueba por mano.
4. Los rótulos medidos en 360 × 640 con la letra de LEC-1: ninguno pasa de dos líneas (los de la lámina ya cumplen; los demás se miden al construirlos).

Lo que la ola 0 no entendió (pregunta 2 del guion de la ola) entra como paso nuevo o como cambio de rótulo, nunca como capítulo nuevo, en una v1.1.
