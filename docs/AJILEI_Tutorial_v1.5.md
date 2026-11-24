# AJILEI · Tutorial · Normativo v1.5 · El guion

**Fecha:** 2026-11-23. **Estado:** SELLADO por Victor. La v1.1 rehizo las tres manos con **la escalera de la apuesta** (§1.3) tras jugar la primera guiada en el S25; la v1.2 ajustó tres rótulos al construirla; **la v1.3** (Victor, 2026-11-21) enseña **Igualar** en la última ronda de la mano 1, cambia «Saltar» por **«Salir»** arriba a la derecha, y trae **la recompensa** (§1.5); **la v1.4** (Victor, 2026-11-21, tarde) añade la pantalla de «Cómo se juega» con tres tarjetas (§2.1), el tope de 2.000 HC y el premio del invitado de GEN-1 (§1.5), la cifra preguntada al servidor y la tarjeta ofrecida también a las cuentas que ya existían. **La v1.5** (Victor, 2026-11-22 y 23, tras los STOP-T de las tandas 4 y 5 y el debate de la ruta) recoge: **la ruta de la primera vez** (§1.2.1: qué es el juego → cuánto vale cada carta → a jugar → la guiada), la forma de los capítulos tal como se construyó (§2.1: la barra fija, la muestra de cartas y sus tamaños, el ancla de una revelación, el hueco que no deja pasar toques, la fila del ⋮ antes de «Mano actual»), los rótulos acortados y los pasos partidos de las tandas 4 y 5 (§2.2: capítulos 2, 4, 5, 6, 8, 9 y 10), y la Pista C sin sala de espera (§2.2, capítulo 8). Vive en `docs/AJILEI_Tutorial_v1.5.md` y sustituye a las anteriores. Donde el código y este documento difieran, el código está equivocado, salvo en la regla D-29 (§4).
**Fuentes:** las Reglas de APU-1 v1.12 (dinero, apuestas, IAS) y las reglas del juego validadas por Victor con el experto (2026-06-05) y selladas en `AJILEI_Modos_y_Asistencia`.
**Qué es:** el texto maestro del onboarding: la ruta de la primera vez, la partida guiada (GUI-1), las señales de primera vez y los diez capítulos de la serie (TUT-1). Todo lo que aquí es rótulo sale de `t()`; no hay voz en la v1.
**Lo que decide la forma** (Victor, 2026-11-20): la partida guiada es la puerta de entrada, saltable; la serie es la biblioteca, en pasos tocables; sin voz; las señales de primera vez entran en GUI-1; la recompensa al completar es de 2.000 HC antes de la primera mano y 1.000 después (§1.5). **La guiada es cerrada:** en cada paso un solo control responde y el rótulo dice cuál; el jugador no elige, para que el resultado de cada mano esté garantizado. La libertad llega en la primera partida real, con las señales. **Nada del tutorial se mueve solo** (Victor, 2026-11-23): ninguna pantalla avanza por tiempo; todo avanza con un toque.
**La forma elegida en la lámina** (Victor, 2026-11-20, PC y S25): la oferta del primer login **centrada sobre el lobby atenuado** (variante a); la señal de primera vez **con fondo**, colocada donde no tape nada; los capítulos con **velo suave y el rótulo pegado al botón en burbuja** (variante b), con «paso n de m» dentro de la burbuja y la tarjeta fija como respaldo cuando la burbuja no tiene sitio.
**Regla de escritura, «a prueba de dummies»:** en cada paso, una sola cosa en pantalla señalada, una sola acción posible, y una razón de pocas palabras. **Techo del rótulo: dos líneas en 360 × 640 con la letra de LEC-1**; lo que no cabe se parte en dos pasos o se dibuja (una muestra), nunca se sube el techo (las traducciones de IDI-1 crecen un 20–30 %). Nunca se explica lo que el jugador va a ver en el paso siguiente. Se habla de «tú», en presente, sin tecnicismos («la suma», no «el puntaje»).

---

## Las reglas del juego que el tutorial enseña (la fuente, para que nadie las reescriba)

| Regla | Valor | Fuente |
|---|---|---|
| La baraja | Española, 40 cartas, cuatro palos (oros, copas, espadas, bastos); de 2 a 5 jugadores | Modos y Asistencia |
| El As | **11** | Victor con el experto, 2026-06-05 |
| El 6 y el 7 | **6 y 7** | Ídem |
| 2, 3, 4, 5, sota, caballo y rey | **10** | Ídem |
| Solo suma el mismo palo | Tu suma es la del mejor palo que tengas. Cinco cartas de 10 del mismo palo suman 50 y **no** son AJILEI; solo 51 lo es (confirmado por el motor, tanda 2). El «techo 41» de APU-1 D-29 habla de cuatro cartas del palo | APU-1 v1.12; motor |
| **AJILEI** | **51**: As y cuatro cartas de 10 del mismo palo. La jugada que gana | Ídem |
| El 7 de Oro | Mesas de 2 y 3: una carta más (vale 7, palo oros). **Mesa de 4: comodín, vale 10.** **Mesa de 5: comodín, vale 11**, y hace posible el **52**, único e imbatible | Victor con el experto; APU-1 §2.1 |
| Empate | Gana **la Mano**; si la Mano no está en el empate, el más cercano a la Mano | Ídem; APU-1 §4.3 |
| Una mano | Dos cartas → apuesta → cinco cartas → apuesta → descarte y reposición → apuesta → se muestran (`BET_1`, `BET_2`, `BET_3`) | APU-1 §1 |
| Apostar | Pasar · Apostar · Igualar · Subir · Retirarse; multiplicadores **×1 · ×2 · ×5 · ×10** sobre la apuesta de mesa; All-in solo cuando no alcanza para pagar | APU-1 §3.1, §4.1 |
| El ante | Cada mano, cada jugador vivo paga un ante = la apuesta de mesa | APU-1 §2.4 |
| La recarga | Contra las IAS: cuando la pila baja, 10× · 20× · al techo, y las IAS se nivelan contigo. Entre personas: solo hasta la entrada | APU-1 §5, §8.1 |
| Los rivales de las IAS | Se llaman «IA 1», «IA 2»… en las mesas de 3 a 5; «la IA» en la de 2 | APU-1 §4.5 |
| El descarte | Hasta 5 cartas en las mesas de 2, 3 y 4; hasta 3 en la de 5 (confirmado por el motor, tanda 2) | motor |

---

## 0 · El vocabulario que usa todo el tutorial

Se fija aquí para que los rótulos, los botones y Mia digan lo mismo.

| Decimos | No decimos |
|---|---|
| tus cartas · el palo · la suma · los puntos · el mejor palo | la mano (para las cartas), la combinación |
| las figuras (sota, caballo y rey) | las figuras para decir «el palo» |
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

Una mesa de 3 (tú, «IA 1» e «IA 2» como rivales de guion; sin comodín, que solo existe en las de 4 y 5), apuesta de mesa 100 y pilas holgadas (nadie se acerca a una recarga), ritmo Rápido, **sin servidor**: no cobra entrada, no mueve el saldo, no da puntos, no avisa pila (excepción escrita a INV-47). Tres manos con mazo preparado. En cada paso hay **un solo control activo**; el resto se ve atenuado y no responde. El reloj de turno está apagado; la pregunta de recarga no existe. Se puede salir en cualquier momento con **«Salir»**, un botón **arriba a la derecha**, separado de «Siguiente», con **relleno vinotinto (`#7c1d30`) y borde dorado**, sin pregunta de confirmación (decisión de Victor tras la prueba de su novia, 2026-11-21: «Saltar» se leía como saltar el paso). En los capítulos de la serie y en las dos pantallas de la ruta el mismo botón, en el mismo sitio, dice «Cerrar» (capítulos) o «Salir» (ruta). Al salir el generador de la baraja se restaura (`resetRng`, R-2).

Dura unos dos minutos; con la ruta de la primera vez (§1.2.1), unos tres. Termina en una victoria con AJILEI.

### 1.2 Dónde se ofrece

- **Al primer login**, al aterrizar en el lobby justo después del Bautizo: una tarjeta pequeña, no una pantalla entera.
  - Título: **«Aprende en dos minutos»** (la cifra se revisa con lo que mida la ola 0).
  - Texto, **antes de la primera mano**: «Completa la partida guiada antes de jugar tu primera mano y recibe **2.000 HC**.»
  - Texto, **después de la primera mano** (contra las IAS o contra personas): «Completa la partida guiada y recibe **1.000 HC**.»
  - Botones: **«Jugar la guiada»** (principal) · «Ahora no» (secundario, cierra; la tarjeta no vuelve a salir sola).
  - **No sale** si el jugador llega con una sala pendiente (`?sala=`, invitado por enlace): va directo a su mesa; la tarjeta espera a su siguiente visita al lobby.
  - **Sale una sola vez** en la primera visita al lobby sin la marca `ofrecida`: tanto al recién bautizado como a **las cuentas que ya existían** antes de TUT-1. **Los dos botones ponen la marca** («Jugar la guiada» también, tanda 3: si no, quien sale con «Salir» la volvería a ver); la marca no se pone al pintar la tarjeta.
  - **La cifra la dice el servidor** (RPC de solo lectura, §1.5): el texto nunca promete lo que no se va a pagar. Si el servidor no responde, la tarjeta no sale.
  - **Después de completarla** la tarjeta no vuelve a salir.
- **Siempre**, desde el botón «Cómo se juega» del lobby, que abre la pantalla de tres tarjetas (§2.1): la primera es «Partida guiada · 3 manos · 2 min», con la cifra del premio o la marca de hecha.
- **«Jugar la guiada»**, desde la tarjeta o desde «Cómo se juega», abre **la ruta de la primera vez** (§1.2.1) si el aparato no tiene el ✓ del capítulo 2; si lo tiene, va directo a la mesa guiada.
- Marcas: `hecha` **vive en el servidor** (es el registro del pago, §1.5); `ofrecida`, `vistos` y `senales`, locales en `ajilei.guia` (patrón `partidaRapida`, censo INV-12).

#### 1.2.1 La ruta de la primera vez (Victor, 2026-11-23)

**Por qué.** Quien llega por un mensaje de WhatsApp puede no haber visto nunca una baraja española. La guiada enseña con el dedo, pero sus rótulos dan las sumas por sabidas («tres del mismo palo suman 30»). Sin saber cuánto vale cada carta, se pasa la guiada como quien repite una receta. La ruta pone **el valor de las cartas antes de la mesa**, con un mapa de dos paradas delante.

**Qué es.** Cuatro tramos, todos tocables, ninguno por tiempo, todos con «Salir» arriba a la derecha (sale al lobby; nada se paga ni se marca):

1. **«¿En qué consiste el juego?»** (pantalla propia, sin mesa). Las frases se revelan una a una, rápido (≈ 0,4 s entre ellas; con `prefers-reduced-motion`, todas a la vez):
   - Título: **«¿En qué consiste el juego?»**
   - «**Reúne cartas del mismo palo** —oros, copas, espadas o bastos— **para sumar más que los demás.**» Debajo, cinco cartas de un mismo palo (la muestra de cartas, §2.1), que se iluminan: se enseña, no solo se dice.
   - «Te vamos a enseñar dos cosas:»
   - ① con el icono del capítulo 2: «**Cuánto vale cada carta.**»
   - ② con el icono del capítulo 3: «**Cómo se juega**, en una partida de 3 manos.»
   - Botón: **«Empecemos»**.
2. **El capítulo 2 entero** («Cuánto vale cada carta», §2.2), tal como está en la serie; su último paso dice **«Siguiente»** en lugar de «Terminar», y al pasar pone el ✓ del capítulo 2 en `vistos`.
3. **«Ahora, a jugar»** (pantalla propia): «**Tres manos para que aprendas haciendo.** Tú solo tocas lo que se ilumina.» · Botón: **«Jugar»**. Un solo icono (el de la mesa, capítulo 3); sin emojis.
4. **La guiada** (§1.4) y su cierre con el premio (§1.5), sin cambios.

**Cuándo.** La ruta corre cuando el aparato no tiene el ✓ del capítulo 2; con el ✓, «Jugar la guiada» va directo a la mesa. Es la ruta de la primera vez, no un peaje: quien ya aprendió no la repite. Volver a jugar la guiada no paga (§1.5).

**Lo que no cambia.** El premio, sus tramos y su celebración; la guiada cerrada; «Salir» que no paga. El invitado por WhatsApp con sala pendiente sigue yendo a su mesa, y ve la ruta en su siguiente «Jugar la guiada».

### 1.3 La escalera (lo que la guiada enseña con el dedo)

Decidido por Victor el 2026-11-21, tras jugar la primera versión en el S25: **la lección está en lo que hace el dedo, no en lo que dice el rótulo.** Mucha gente no lee; si el dedo pasa cinco veces, aprende a pasar, y la emoción del juego está en apostar. La guiada recorre entera esta escalera, que es también el capítulo 10 y la pista de primera vez de la apuesta:

| Lo que tienes | Lo que haces |
|---|---|
| Dos palos distintos | **Pasar** |
| Te apuestan y tienes algo | **Igualar** |
| Dos del mismo palo | **Apostar ×1** |
| Cuatro del mismo palo | **×2** |
| Cinco del mismo palo | **×5** |
| AJILEI | **×10** |

Tres pases en toda la guiada, cada uno con razón; una igualada; seis apuestas. La mano 1 enseña además que **igualar con poco también se pierde**, y la mano 2 que la forma de bajar ese riesgo es mejorar las cartas antes de apostar fuerte.

### 1.4 Las tres manos

Las **condiciones** de cada mano son el contrato que la tanda 2 cumple buscando el orden de baraja con el motor real (la IA descarta lo que decide). Los rivales juegan por **guion por mano y ronda**: pasan si no hay apuesta viva, igualan lo que apuestes (también el ×10), nunca suben, **nunca se retiran**; la única apuesta propia de un rival es la de IA 1 en la última ronda de la mano 1. Lo que manda es la condición; las cartas concretas las fija el buscador, nunca una mano humana. Cada «×k y Apostar» son **dos toques y dos pasos**. Pilas de 10.000 para los tres: el pozo de la mano 3 ronda los 6.300.

#### Mano 1 · «Mirar y arriesgar»

**Condición:** a dos cartas tienes **dos palos distintos**; a cinco cartas, tres de un palo (30) y dos sueltas; cambias las dos sueltas y **las dos que llegan no son de ese palo** (sigues en 30); en la última ronda tú pasas, **IA 1 apuesta ×1 e IA 2 iguala**, tú igualas y la ronda se cierra; al mostrar, un rival te gana (37 o más, sin AJILEI, sin empate). Tú eres Mano.

| Paso | Qué se ve | Rótulo (`t()`) | Único control |
|---|---|---|---|
| 1 | La mesa, tu asiento; «Iniciar mano» con el aro | «Esta es tu mesa. Tú estás abajo. Toca **Iniciar mano**.» | Iniciar mano |
| 2 | Tus dos cartas, de palos distintos | «Tus cartas. Solo suman las del **mismo palo**. Estas no lo son.» | Siguiente |
| 3 | «Pasar» con el aro | «Todavía no tienes buena mano: **pasa**.» | Pasar |
| 4 | Cinco cartas; aro sobre las tres del palo | «Tres del mismo palo suman 30. Es poco.» | Siguiente |
| 5 | «Pasar» | «Pasa.» | Pasar |
| 6 | Las dos sueltas con el aro | «Toca las dos que no suman.» | Esas dos cartas |
| 7 | «Descartar 2» con el aro | «Toca **Descartar**.» | Descartar |
| 8 | Llegan dos cartas; no son del palo | «No mejoró. Sigues en 30. Pasa a veces.» | Siguiente |
| 9 | Eres Mano, hablas primero; «Pasar» con el aro | «Sigues en 30. Pasa y mira qué hacen.» | Pasar |
| 10 | IA 1 apuesta 100, IA 2 iguala; aparecen Igualar, Subir y Retirarse (Subir y Retirarse en gris); «Igualar» con el aro | «IA 1 apostó 100 e IA 2 pagó. Con 30 puedes probar suerte: **iguala**.» | Igualar |
| 11 | Tu igualada cierra la ronda y se muestran las cartas; aro sobre el palo ganador del rival | «{rival} tenía {m}. Tú 30. **Gana la suma más alta.**» | Siguiente |

Cierre: «Igualaste con poco y perdiste. Ahora: mejorar antes de apostar.» → **Siguiente mano**.

#### Mano 2 · «Mejorar y apostar»

**Condición:** a dos cartas tienes **dos del mismo palo**; a cinco, cuatro de ese palo (36 o cerca) y una suelta, con un rival por delante; cambias la suelta y **la que llega es del palo**: cinco del palo, 46 o cerca, y la suma más alta de la mesa; nadie con AJILEI; sin empate.

| Paso | Qué se ve | Rótulo | Único control |
|---|---|---|---|
| 1 | Tus dos cartas, del mismo palo | «Dos del mismo palo. Buen comienzo: **apuesta**.» | Apostar |
| 2 | Los rivales igualan | «Igualaron.» | Siguiente |
| 3 | Cinco cartas; aro sobre las cuatro del palo | «Cuatro del mismo palo: {n}. Sube la apuesta.» | Siguiente |
| 4 | El multiplicador ×2 con el aro | «Toca **×2**.» | ×2 |
| 5 | «Apostar» con el aro | «Ahora **Apostar**.» | Apostar |
| 6 | La carta suelta con el aro | «Toca la que no suma.» | Esa carta |
| 7 | «Descartar 1» | «Toca **Descartar**.» | Descartar |
| 8 | Llega la carta nueva, con el aro | «¡Llegó del palo! Cinco del mismo palo: {n}.» | Siguiente |
| 9 | El multiplicador ×5 con el aro | «Apuesta fuerte. Toca **×5**.» | ×5 |
| 10 | «Apostar» | «Y **Apostar**.» | Apostar |
| 11 | Se muestran las cartas | «{n} contra {m}. **Ganaste** {pozo}.» | Siguiente |

Cierre: «Mejoraste y apostaste. Así se gana.» → **Siguiente mano**.

#### Mano 3 · «AJILEI»

**Condición:** a dos cartas tienes **As y una de 10 del mismo palo**; a cinco, **AJILEI de 51**; «Sin descartar»; los rivales igualan los dos ×10; la revelación dispara la celebración de AJILEI.

| Paso | Qué se ve | Rótulo | Único control |
|---|---|---|---|
| 1 | Tus dos cartas | «As y una de diez del mismo palo. **Apuesta**.» | Apostar |
| 2 | Los rivales igualan | «Igualaron.» | Siguiente |
| 3 | Cinco cartas, las cinco con el aro | «**¡AJILEI!** As y cuatro de diez del mismo palo: 51. La jugada más alta.» | Siguiente |
| 4 | El multiplicador ×10 con el aro | «Apuesta a lo grande. Toca **×10**.» | ×10 |
| 5 | «Apostar» | «Y **Apostar**.» | Apostar |
| 6 | Los rivales igualan; el pozo crece | «Igualaron. El pozo es de {pozo}.» | Siguiente |
| 7 | «Sin descartar» con el aro | «Ya tienes AJILEI. No cambies nada.» | Sin descartar |
| 8 | ×10 con el aro | «Otra vez a lo grande: **×10**.» | ×10 |
| 9 | «Apostar» | «**Apostar**.» | Apostar |
| 10 | Revelación y celebración | (la celebración real de AJILEI, sin rótulo) | — |
| 11 | Pantalla de cierre de la guiada | **«¡Ya sabes jugar!»** · «Palos distintos: pasa. Te apuestan: iguala. Mismo palo: apuesta. Cuantas más del palo, más fuerte. AJILEI: a lo grande.» · **la celebración del premio** (§1.5): «+2.000 HC» (o «+1.000 HC») grande, con la moneda y el sonido de las monedas, breve y a la vista | **«Jugar de verdad»** → Retar a las IAS · «Volver al lobby» |

La pantalla de cierre pide el pago al servidor (§1.5) **una sola vez** y, cuando lo confirma, celebra la cifra que el servidor devolvió. Si no hay red, muestra «Te lo acreditamos en cuanto vuelva la conexión» y lo reintenta en la siguiente visita al lobby (`pendientePago`).

### 1.5 La recompensa (decidida por Victor, 2026-11-21; construida en la tanda 3)

| Regla | Valor |
|---|---|
| Cuánto | **2.000 HC** a quien llega limpio: **sin ninguna mano jugada** (contra las IAS o contra personas) **y sin premio de invitación cobrado**. A todos los demás, **1.000 HC** |
| El tope | Los premios de entrada, fuera del bono universal de 2.500, **suman como máximo 2.000 por persona**. El invitado de GEN-1 cobra 1.000 al registrarse por el enlace y 1.000 al hacer la guiada |
| Quién decide el tramo | **El servidor**, en la RPC que paga (`cobrar_guiada`): mira si hay alguna mano cerrada (`mesas_ia.mano_informada ≥ 1` o `partida_asientos.manos ≥ 1`, la misma señal que MED 02) y si existe el premio de invitación (tipo reservado `premio_invitacion`, que estrena GEN-1). El cliente solo pide. `premio_guiada_estado()`, de solo lectura, devuelve la cifra para la tarjeta y «Cómo se juega» |
| Cuántas veces | **Una por persona**, con la huella del correo como el bono de bienvenida: borrar la cuenta y crearla de nuevo no vuelve a cobrar. La huella normaliza los alias de Gmail (`+` y puntos); en otros dominios cada dirección es una huella |
| Dónde queda | Un movimiento del libro (`premio_guiada`, clave `guiada:<huella>`) y una fila de `premios_guiada`, que es a la vez la marca «guiada hecha» |
| Cuándo se paga | Al llegar a la pantalla de cierre de la mano 3. «Salir» antes no paga nada |
| Cómo se celebra | En la pantalla de cierre: la cifra grande con la moneda y el sonido, breve, a la vista; después, la píldora del lobby ya la lleva |
| Qué cambia después | La tarjeta del primer login no vuelve a salir; «Cómo se juega» lista la guiada con «✓ Hecha»; se puede volver a jugar sin premio |
| Lo que lo justifica | Premia aprender antes de jugar; 2.000 queda por debajo del pack más chico de la tienda (5.000 HC por $1,99) y por encima del premio por amigo de GEN-1 (1.000) |

**El invitado por WhatsApp** (decisión de Victor, 2026-11-21). Quien llega por enlace a una mesa no ve la tarjeta: va a su sala. **Cobra 1.000 HC al registrarse por el enlace** (`origen = 'invitacion'`; se construye en GEN-1 1c) y 1.000 más cuando haga la guiada. Hasta que GEN-1 exista, el único tramo que el servidor ve es «mano jugada sí o no».

**Riesgo aceptado (el del bono):** el servidor no puede saber si la guiada se jugó entera, porque no hay servidor en la guiada; quien llame a `cobrar_guiada()` a mano cobra lo mismo, una vez por correo.

### 1.6 Las señales de primera vez (en la mesa real contra las IAS)

Tres pistas, una sola vez cada una, en las tres primeras manos reales. Aparecen cuando toca, se van al hacer la acción, y no vuelven (marca local `ajilei.guia.senales`, por pista).

| Cuándo (`GameTable`) | Rótulo | Se apaga con |
|---|---|---|
| Primer «Iniciar mano» | «Toca **Iniciar mano** cuando estés listo.» | `beginHand` |
| Primer turno de apuesta (`isPlayerTurnEarly`) | «Tu turno. Palos distintos: **Pasar**. Mismo palo: **Apostar**. Te apuestan: **Igualar**.» | `act` |
| Primer descarte (`isDiscardTimerActive`) | «Toca las cartas que no suman y luego **Descartar**. Tienes {s} segundos.» | `handleDiscard` |

Sin velo: aro y rótulo, para no tapar el reloj de turno. Solo en la mesa contra las IAS (con `control`, sin `guion` ni `partida`). Se esconden mientras hay un capítulo abierto desde el ⋮. Quien hizo la guiada también las ve (son otra cosa: la mesa real tiene reloj y dinero).

---

## 2 · TUT-1 · La serie «Cómo se juega»

### 2.1 La forma

- **La pantalla de «Cómo se juega»** (Victor, 2026-11-21): tres tarjetas grandes: **«Partida guiada»** (3 manos · 2 min · la cifra del premio o ✓ hecha), **«Aprender por tema»** (abre el índice: tres pistas, diez capítulos, cada uno con un icono de trazo y su ✓ de visto, local en `ajilei.guia.vistos`) y **«Pregúntale a Mia»** (ASI-1; «Pronto» hasta que exista). Solo la tarjeta de la guiada lleva el oro sólido.
- **Cada capítulo son cuatro a siete pasos**; se avanza tocando «Siguiente» o el velo; «Volver» siempre a mano; «paso n de m» dentro de la burbuja; el último paso dice **«Terminar»**, que pone el ✓ y vuelve al índice; **«Cerrar»**, arriba a la derecha (el botón de «Salir»), no pone el ✓. Sin reproducción automática.
- **La barra «Volver · Siguiente» es fija** (tanda 4): su sitio depende solo de la ventana (en el acostado bajo, en columna arriba a la izquierda; si no, en fila abajo a la izquierda) y no se mueve de paso en paso. **Una excepción escrita (tanda 5):** en la Pista C, si la barra tapara el ancla del paso, va a la esquina opuesta durante ese paso; dentro de un paso nunca se mueve. Lo mismo con **«Cerrar»**: si el ancla vive arriba a la derecha (el ⚙ del lobby, el ⋮ de la mesa), «Cerrar» se corre a la izquierda del ancla, en su misma fila, solo en ese paso. La barra es **obstáculo de la burbuja**, como el reloj lo es de las señales: la burbuja prueba los dos lados del ancla y, si no cabe, cae a la tarjeta fija (texto y «paso n de m» en una fila). Ni la barra, ni «Cerrar», ni el rótulo, ni la muestra se pisan (`tut.solape`). **La colocación de un paso se calcula una sola vez por paso**, en orden barra → «Cerrar» → burbuja, a partir del ancla y la ventana, nunca leyendo lo que la propia capa acaba de pintar (tanda 5: un bucle de medidas se llevó la pantalla en el S25; `tut.app` cuenta las pintadas por paso).
- **El hueco no deja pasar ningún toque en ningún capítulo** (Victor, 2026-11-23; sustituye «el hueco deja pasar toques que no escriben» de la v1.4): la capa señala, el jugador mira. Los botones de la mesa congelada se ven con su **disponibilidad real**, no con el cierre de la guiada.
- **La muestra de cartas:** lo que la mesa no puede enseñar en ese momento (el valor de cada carta, un empate, un multiplicador en gris, el all-in, los pozos, la escalera) se pinta en el centro con **componentes reales** (`PlayingCard`, la fila de acciones, el pozo), nunca con imágenes. **Tres tamaños según cuántas cartas enseña:** una → grande (110 px en el teléfono, 160 en escritorio); dos → media (94 px); tres o más → chica, lo más grande que quepa; en vertical, más de cinco cartas van en dos filas (4 y 3). Las cartas tachadas llevan un aspa fina y clara que no tapa la carta.
- **Capítulos de mesa (1–6):** sobre el modo guion, con la mesa de la guiada **jugada con el motor real hasta el momento del paso** y congelada (IA y reloj en pausa, `useCongelado`); el momento se reproduce con los órdenes de baraja de la guiada, nunca con estados escritos a mano, y al cerrar el generador de la baraja queda restaurado (INV-90). **En una revelación el ancla es la mano revelada entera**, nunca el panel; la mesa solo abre la mano del ganador (las demás, tocando su nombre), y el capítulo enseña lo que la mesa hace: IA 1 se queda boca abajo en el 3.7.
- **Capítulos de la app (7–10):** sobre la pantalla real viva (Retar, Salas, Armar mesa, el lobby) o sobre un momento de la guiada, con el velo; **nada escribe en el servidor**: el capítulo navega con la ruta de la app, espera a que la pantalla monte su ancla (los trozos de Retar y Salas tardan unos milisegundos; si el ancla no aparece, el paso cae a la tarjeta sin flecha y el capítulo sigue: nunca una pantalla vacía), señala el botón que escribe («Sentarme a la mesa», «Armar la mesa») **sin tocarlo**, y termina ahí. Mientras un capítulo está abierto, el lobby no saca la oferta ni reintenta el premio. Al cerrar o terminar, la app vuelve al índice, y la casa del índice lleva al lobby sin sala ni mesa. **Desde el ⋮ de una mesa**, los capítulos 7, 8 y 9 se listan como «En el lobby» y no se abren (sacarían al jugador de la mesa); el 10 sí se abre sobre la mesa viva.
- **El «?» del ⋮ de la mesa** es la fila **«Cómo se juega»**, en las dos mesas, antes de «Mano actual» (que `u1` sella como la última; orden: Sonido · Reacciones · Partida rápida · Cómo se juega · Mano actual). Abre el capítulo de la fase actual **sobre la mesa viva**: reparto → 3 · apuesta → 5 · descarte → 3, en su paso del descarte · revelación → 4 (también con «Siguiente mano» a la vista); antes de la primera mano, el índice. Contra las IAS la mesa se congela mientras el capítulo está abierto; entre personas el reloj del servidor sigue, y el primer paso lo dice: «Tu reloj sigue corriendo.» En la guiada la fila no sale.

### 2.2 Los diez capítulos

**Pista A · El juego**

**1 · ¿Qué es AJILEI?** (sobre la mano 3, paso 3)
1. Las cinco cartas del AJILEI con el aro → «Esto es un AJILEI: 51 puntos. La jugada que gana en seco.»
2. El mazo → «Baraja española: 40 cartas. Oros, copas, espadas y bastos.»
3. Los asientos → «Se juega de 2 a 5. Contra las IAS o con otras personas.»
4. La pila → «Se apuesta con Heptacoins. Nunca con dinero real.»

**2 · Cuánto vale cada carta** (la que la abuela va a releer; también el segundo tramo de la ruta de la primera vez, §1.2.1) — **7 pasos**
1. El As, grande → «El As, de cualquier palo, vale **11**.»
2. Un 6 y un 7, medianos → «El 6 vale **6** y el 7 vale **7**, de cualquier palo.»
3. Sota, caballo y rey, y un 2, un 3, un 4 y un 5, con «10» bajo cada una → «Todo lo demás vale **10**: las figuras y también el 2, el 3, el 4 y el 5.»
4. Dos cartas de palos distintos, medianas, tachadas → «**Solo suman las del mismo palo.**»
5. Las tres del palo de la mano 1 con el aro y la suma como nota bajo el rótulo («Suma: 30») → «Tu suma es la del mejor palo que tengas. Cuantas más cartas del palo, más sumas.»
6. El 7 de Oro, grande → «**En mesas de 4 y 5 jugadores**, el 7 de Oro es comodín de cualquier palo.»
7. El 7 de Oro, grande → «Vale **10 puntos** con 4 jugadores y **11 puntos** con 5.»

**3 · Cómo va una mano** (sobre la mano 1)
1. Dos cartas → «Primero recibes dos.»
2. La fila de acciones → «Se apuesta.»
3. Cinco cartas → «Llegan tres más. Se apuesta otra vez.»
4. Las del mejor palo con el aro (las otras quedan bajo el velo, sin aspas) → «**Quédate con tu mejor palo** y cambia el resto. Puedes cambiar hasta {tope}.»
5. El descarte → «Tocas las que cambias y luego **Descartar**. Te reponen una a una.»
6. Última apuesta → «Se apuesta por última vez.»
7. Revelación (las manos boca arriba como anclas; IA 1 sigue boca abajo) → «Se muestran las cartas. Gana la suma más alta.»

**4 · Cómo se gana y cómo se pierde**
1. 51 con el aro (mano 3) → «**AJILEI**: As y cuatro de diez del mismo palo, 51 puntos.»
2. Muestra: As, tres de diez y el 7 de Oro → «En la mesa de 5, As, tres de diez y el 7 de Oro suman **52**. Nadie lo iguala.»
3. La revelación de la mano 1, la mano del ganador como ancla → «Sin AJILEI, gana la suma más alta del mejor palo.»
4. Muestra: dos sumas iguales con la marca de Mano → «Si empatan, gana **la Mano**; si la Mano no empató, el que está más cerca de ella.»
5. La pila con el aro → «Sin pila, pierdes. Recargas contra las IAS; entre personas, hasta la entrada.»

**Pista B · Apostar**

**5 · Apostar, pasar, retirarse** — **7 pasos**
1. «Pasar» (mano 1, paso 3) → «**Pasar** no cuesta: dejas que sigan los demás.»
2. «Apostar» (mano 2, paso 4) → «**Apostar** mete monedas al pozo.»
3. Los multiplicadores → «**×1, ×2, ×5 y ×10** son cuántas apuestas pones.»
4. «Igualar» (mano 1, paso 10, con apuesta viva) → «Si alguien apostó, **Igualar** es pagar lo mismo para seguir.»
5. «Subir» → «**Subir** es pagar más y obligar a los demás a decidir.»
6. «Retirarse» → «**Retirarse** es salir de la mano. Pierdes lo que ya pusiste, no más.»
7. Muestra: un multiplicador en gris → «Lo que está en gris no te alcanza o no se puede ahora.»

**6 · All-in y pozos** (sobre la mano 1, paso 10, con muestras)
1. «All-in» en el sitio de «Igualar» → «Si no te alcanza, puedes ir **all-in**: pones toda tu pila y tus cartas siguen jugando.»
2. El pozo en capas → «Con all-in solo ganas lo que igualaste. El resto es otro pozo para los demás.»
3. La devolución del sobrante → «Lo que nadie iguala, se devuelve.»
4. La pila con el aro → «Con poca pila, **recarga**: las IAS se nivelan contigo; entre personas, hasta la entrada.»

**Pista C · La app**

**7 · Jugar contra las IAS** (pantalla viva: Retar)
1. Los niveles → «Elige el nivel. Básico para empezar.»
2. La apuesta → «Elige la apuesta. Lo que se juega en cada mano.»
3. La entrada → «La entrada es lo que llevas a la mesa. Se cobra al sentarte.»
4. «Sentarme a la mesa», señalado, sin toque → «Cuando quieras jugar de verdad, toca aquí.» · Terminar

**8 · Jugar con otras personas** (pantallas vivas: lobby → Salas → Armar mesa → Salas; **sin entrar a la sala de espera**, Victor, 2026-11-23: mostrarla obliga a armar una mesa de verdad) — **6 pasos**
1. «Jugar contra jugadores» del lobby → «Aquí se juega con gente de verdad.»
2. «Armar mesa» en Salas → «Armas una mesa y eliges cuántos, la apuesta y el ritmo.»
3. Los dos primeros mandos de Armar mesa (cuántos, apuesta) → «Cuántos juegan y cuánto se apuesta.»
4. El ritmo → «Y el ritmo: Normal o Rápido.» (en el acostado los tres mandos no caben a la vez; por eso dos pasos)
5. «Armar la mesa», señalado, sin toque → «Al armarla recibes un código y un enlace para WhatsApp.»
6. «Entrar por código» en Salas → «Si te invitaron, pega aquí el código.» · Terminar

**9 · El menú y los ajustes** (pantalla viva: lobby; el último paso, sobre la mesa guiada)
1. La píldora de saldo → «Tu saldo. Toca para ver tus monedas.»
2. El ⚙ → «Ajustes: sonido, idioma, perfil, eliminar cuenta.»
3. Rankings → «Los grandes maestros, por puntos. Las grandes fortunas, por saldo.»
4. La tienda → «Tapetes, avatares y monedas.»
5. El ⋮ de la mesa congelada (mano 3, paso 3), cerrado → «Dentro de la mesa, el ⋮ tiene el sonido, las reacciones y este tutorial.» · Terminar

**10 · Consejos** (sobre la mano 3, paso 3)
1. Muestra: la escalera de §1.3, dibujada con el molde del cierre de la guiada (seis filas en el marco de oro; en 360 de ancho la letra baja a 14 px para que cada fila quepa en una línea) → «**La escalera de la apuesta.**»
2. Tarjeta sin ancla → «El pez grande se come al chico: si tienes mucha pila, aprieta.»
3. → «Retirarse a tiempo también es ganar.»
4. → «Mira el pozo antes de igualar: ¿vale lo que te piden?»
5. → «Un AJILEI se apuesta a lo grande. Siempre.» · Terminar

### 2.3 Lo que se mide (sin servidor)

Nada en `eventos` en la v1. Las marcas locales (`vistos`, `senales`, `ofrecida`) y la del servidor (`premios_guiada`) bastan para que la app no insista. Si la ola grande necesita saber cuántos terminan la guiada o la ruta, es un `tipo` de `eventos` escrito por el cliente, y se decide entonces.

---

## 3 · Claves de `t()` (orden de magnitud)

GUI-1 ≈ 45 (oferta 6 · mano 1 ×12 · mano 2 ×12 · mano 3 ×10 · cierre y premio 5) · señales 3 · TUT-1 ≈ 70 (10 títulos + ≈ 56 pasos + el índice y sus pistas) · la ruta ≈ 8 · común ≈ 10 (Siguiente, Volver, Cerrar, Salir, Terminar, Empecemos, Jugar, paso n de m, Partida guiada, Cómo se juega). **Total ≈ 135**, en `textos.tut.es.js` diferido, salvo las de la oferta y la fila del ⋮.

---

## 4 · Lo que el motor y las tandas confirmaron

1. **Solo 51 es AJILEI** (tanda 2). Cinco cartas del mismo palo que no suman 51 no lo son. El capítulo 4 lo dice así; D-29 («techo 41») habla de cuatro cartas.
2. **El tope del descarte** es 5 en las mesas de 2, 3 y 4, y 3 en la de 5 (tanda 2). El capítulo 3, paso 4, lo dice así.
3. Los tres órdenes de baraja de la guiada los fija el buscador y los vigila `guiaManos.test.js`; los momentos de los capítulos se reproducen con ellos (`momento.test.js`).
4. Los rótulos se miden en 360 × 640 con la letra de LEC-1: ninguno pasa de dos líneas (`tut.lineas`); lo que no cabía se partió (2.6, 5.2) o se acortó (4.2, 4.5, 6.1, 6.2, 6.4), tanda 4.
5. **La huella del alias** (tanda 3): un alias `+xx` de un Gmail que ya cobró comparte su huella; las pruebas del tramo limpio se hacen con correos de otro dominio.

Lo que la ola 0 no entienda (pregunta 2 del guion de la ola) entra como paso nuevo o como cambio de rótulo, nunca como capítulo nuevo, en una v1.6.
