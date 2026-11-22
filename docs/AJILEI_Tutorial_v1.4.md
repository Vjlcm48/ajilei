# AJILEI · Tutorial · Normativo v1.4 · El guion

**Fecha:** 2026-11-21. **Estado:** SELLADO por Victor. La v1.1 rehizo las tres manos con **la escalera de la apuesta** (§1.3) tras jugar la primera guiada en el S25; la v1.2 ajustó tres rótulos al construirla; **la v1.3** (Victor, 2026-11-21, tras la segunda prueba en el S25 y la de su novia) enseña **Igualar** en la última ronda de la mano 1, cambia «Saltar» por **«Salir»** arriba a la derecha, y trae **la recompensa** (§1.5: 2.000 HC antes de la primera mano, 1.000 después, decididos por el servidor, una vez por correo), que deja de estar aplazada a GEN-1. **La v1.4** (Victor, 2026-11-21, tarde) añade la pantalla de «Cómo se juega» con tres tarjetas (§2.1), el tope de 2.000 HC de los premios de entrada y el premio del invitado de GEN-1 (§1.5), la cifra del premio preguntada al servidor, y la tarjeta ofrecida también a las cuentas que ya existían. Vive en `docs/AJILEI_Tutorial_v1.4.md` y sustituye a las anteriores. Donde el código y este documento difieran, el código está equivocado, salvo en la regla D-29 (§4).
**Fuentes:** las Reglas de APU-1 v1.12 (dinero, apuestas, IAS) y las reglas del juego validadas por Victor con el experto (2026-06-05) y selladas en `AJILEI_Modos_y_Asistencia`.
**Qué es:** el texto maestro del onboarding: la partida guiada (GUI-1), las señales de primera vez y los diez capítulos de la serie (TUT-1). Todo lo que aquí es rótulo sale de `t()`; no hay voz en la v1.
**Lo que decide la forma** (Victor, 2026-11-20): la partida guiada es la puerta de entrada, saltable; la serie es la biblioteca, en pasos tocables; sin voz; las señales de primera vez entran en GUI-1; la recompensa al completar es de 2.000 HC antes de la primera mano y 1.000 después (§1.5), construida en la tanda 3 de TUT-1. **La guiada es cerrada:** en cada paso un solo control responde y el rótulo dice cuál; el jugador no elige, para que el resultado de cada mano esté garantizado. La libertad llega en la primera partida real, con las señales.
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
| Solo suma el mismo palo | Tu suma es la del mejor palo que tengas. Cinco cartas de 10 del mismo palo suman 50 y **no** son AJILEI; solo 51 lo es (confirmado por el motor, tanda 2). El «techo 41» de APU-1 D-29 habla de cuatro cartas del palo | APU-1 v1.12; motor |
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

Una mesa de 3 (tú, «IA 1» e «IA 2» como rivales de guion; sin comodín, que solo existe en las de 4 y 5), apuesta de mesa 100 y pilas holgadas (nadie se acerca a una recarga), ritmo Rápido, **sin servidor**: no cobra entrada, no mueve el saldo, no da puntos, no avisa pila (excepción escrita a INV-47). Tres manos con mazo preparado. En cada paso hay **un solo control activo**; el resto se ve atenuado y no responde. El reloj de turno está apagado; la pregunta de recarga no existe. Se puede salir en cualquier momento con **«Salir»**, un botón **arriba a la derecha**, separado de «Siguiente», con **relleno vinotinto (`#7c1d30`) y borde dorado**, sin pregunta de confirmación (decisión de Victor tras la prueba de su novia, 2026-11-21: «Saltar» se leía como saltar el paso). En los capítulos de la serie el mismo botón, en el mismo sitio, dice «Cerrar». Al salir el generador de la baraja se restaura (`resetRng`, R-2).

Dura unos dos minutos. Termina en una victoria con AJILEI.

### 1.2 Dónde se ofrece

- **Al primer login**, al aterrizar en el lobby justo después del Bautizo: una tarjeta pequeña, no una pantalla entera.
  - Título: **«Aprende en dos minutos»**
  - Texto, **antes de la primera mano**: «Completa la partida guiada antes de jugar tu primera mano y recibe **2.000 HC**.»
  - Texto, **después de la primera mano** (contra las IAS o contra personas): «Completa la partida guiada y recibe **1.000 HC**.»
  - Botones: **«Jugar la guiada»** (principal) · «Ahora no» (secundario, cierra; la tarjeta no vuelve a salir sola).
  - **No sale** si el jugador llega con una sala pendiente (`?sala=`, invitado por enlace): va directo a su mesa; la tarjeta espera a su siguiente visita al lobby.
  - **Sale una sola vez** en la primera visita al lobby sin la marca `ofrecida`: tanto al recién bautizado como a **las cuentas que ya existían** antes de TUT-1 (la gente de la ola 0 la verá). «Ahora no» pone la marca; «Jugar la guiada» va directo a la mesa guiada, sin pasar por la pantalla de tres tarjetas.
  - **La cifra la dice el servidor** (RPC de solo lectura, §1.5): el texto nunca promete lo que no se va a pagar.
  - **Después de completarla** la tarjeta no vuelve a salir.
- **Siempre**, desde el botón «Cómo se juega» del lobby, que abre la pantalla de tres tarjetas (§2.1): la primera es «Partida guiada · 3 manos · 2 min», con la cifra del premio o la marca de hecha.
- Marcas: `hecha` **vive en el servidor** (es el registro del pago, §1.5); `ofrecida` y lo demás, locales en `ajilei.guia` (patrón `partidaRapida`, censo INV-12).

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

Las **condiciones** de cada mano son el contrato que la tanda 2 cumple buscando el orden de baraja con el motor real (la IA descarta lo que decide, vía (i) del informe de la Fase 0). Los rivales juegan por **guion por mano y ronda**: pasan si no hay apuesta viva, igualan lo que apuestes (también el ×10), nunca suben, **nunca se retiran**; la única apuesta propia de un rival es la de IA 1 en la última ronda de la mano 1 (si quedara un solo pendiente, el motor saltaría la fase, APU-1 §4.4, y el paso desaparecería). Lo que manda es la condición; las cartas concretas las fija el buscador, nunca una mano humana. Cada «×k y Apostar» son **dos toques y dos pasos**: primero el multiplicador, después el botón. Pilas de 10.000 para los tres: el pozo de la mano 3 ronda los 6.300.

#### Mano 1 · «Mirar y arriesgar»

**Condición:** a dos cartas tienes **dos palos distintos**; a cinco cartas, tres de un palo (30) y dos sueltas; cambias las dos sueltas y **las dos que llegan no son de ese palo** (sigues en 30); en la última ronda tú pasas, **IA 1 apuesta ×1 e IA 2 iguala**, tú igualas y la ronda se cierra; al mostrar, un rival te gana (37 o más, sin AJILEI, sin empate). Tú eres Mano en esta mano (lo es el humano en la primera, informe de la lámina §1).

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

**Condición:** a dos cartas tienes **As y una de 10 del mismo palo**; a cinco, **AJILEI de 51** (As y cuatro de 10 de ese palo; la combinación concreta la elige el buscador entre sota, caballo, rey, 2, 3, 4 y 5); «Sin descartar»; los rivales igualan los dos ×10; la revelación dispara la celebración de AJILEI.

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
| 11 | Pantalla de cierre de la guiada | **«¡Ya sabes jugar!»** · «Palos distintos: pasa. Te apuestan: iguala. Mismo palo: apuesta. Cuantas más del palo, más fuerte. AJILEI: a lo grande.» · **la celebración del premio** (§1.5): «+2.000 HC» (o «+1.000 HC») grande, con la moneda y el sonido de victoria, breve y a la vista, nunca escondida | **«Jugar de verdad»** → Retar a las IAS · «Volver al lobby» |

La pantalla de cierre pide el pago al servidor (§1.5) y, cuando lo confirma, celebra la cifra que el servidor devolvió. Si no hay red, muestra «Te lo acreditamos en cuanto vuelva la conexión» y lo reintenta en la siguiente visita al lobby.

### 1.5 La recompensa (decidida por Victor, 2026-11-21)

| Regla | Valor |
|---|---|
| Cuánto | **2.000 HC** a quien llega limpio: **sin ninguna mano jugada** (contra las IAS o contra personas) **y sin premio de invitación cobrado**. A todos los demás, **1.000 HC** |
| El tope | Los premios de entrada, fuera del bono universal de 2.500, **suman como máximo 2.000 por persona**. El invitado de GEN-1 cobra 1.000 al registrarse por el enlace y 1.000 al hacer la guiada: los mismos 2.000 que el que entra directo y aprende antes de jugar |
| Quién decide el tramo | **El servidor**, en la RPC que paga: mira si hay alguna mano jugada y si existe el premio de invitación. El cliente solo pide. Una **RPC de solo lectura** devuelve la cifra (2.000, 1.000 o «cobrado») para la tarjeta y la pantalla de «Cómo se juega» |
| Cuántas veces | **Una por persona**, con la huella del correo como el bono de bienvenida: borrar la cuenta y crearla de nuevo no vuelve a cobrar |
| Dónde queda | Un movimiento del libro (`tipo` nuevo, molde del bono), que es a la vez la marca «guiada hecha» |
| Cuándo se paga | Al llegar a la pantalla de cierre de la mano 3. «Salir» antes no paga nada |
| Cómo se celebra | En la pantalla de cierre: la cifra grande con la moneda y el sonido de victoria, breve, a la vista; después, la píldora del lobby ya la lleva |
| Qué cambia después | La tarjeta del primer login no vuelve a salir; «Cómo se juega» lista la guiada sin cifra; se puede volver a jugar sin premio |
| Lo que lo justifica | Premia aprender antes de jugar; 2.000 queda por debajo del pack más chico de la tienda (5.000 HC por $1,99) y por encima del premio por amigo de GEN-1 (1.000) |

Se construye en la **tanda 3**: migración (el `tipo` nuevo en `movimientos`, la huella), la RPC con límite por minuto (INV-51), el espejo en el banco imitado, el guion SQL de verificación, y el cliente. Paso a la nube de Victor antes del push de la campaña.

**El invitado por WhatsApp** (decisión de Victor, 2026-11-21). Quien llega por enlace a una mesa no ve la tarjeta: va a su sala, que es a lo que vino. **Cobra 1.000 HC al registrarse por el enlace** (`origen = 'invitacion'`; una vez por correo; se construye en GEN-1 1c, que sube de 500 a 1.000 el premio al invitado) y 1.000 más cuando haga la guiada. Hasta que GEN-1 exista, el único tramo que el servidor ve es «mano jugada sí o no»; la regla ya está escrita para cuando aparezca el segundo.

### 1.6 Las señales de primera vez (en la mesa real contra las IAS)

Tres pistas, una sola vez cada una, en las tres primeras manos reales. Aparecen cuando toca, se van al hacer la acción, y no vuelven (marca local `ajilei.guia.senales`, por pista).

| Cuándo (`GameTable`) | Rótulo | Se apaga con |
|---|---|---|
| Primer «Iniciar mano» | «Toca **Iniciar mano** cuando estés listo.» | `beginHand` |
| Primer turno de apuesta (`isPlayerTurnEarly`) | «Tu turno. Palos distintos: **Pasar**. Mismo palo: **Apostar**. Te apuestan: **Igualar**.» | `act` |
| Primer descarte (`isDiscardTimerActive`) | «Toca las cartas que no suman y luego **Descartar**. Tienes {s} segundos.» | `handleDiscard` |

Sin velo: aro y rótulo, para no tapar el reloj de turno. Quien hizo la guiada también las ve (son otra cosa: la mesa real tiene reloj y dinero).

---

## 2 · TUT-1 · La serie «Cómo se juega»

### 2.1 La forma

- **La pantalla de «Cómo se juega»** (decisión de Victor, 2026-11-21): el botón del lobby abre una pantalla con **tres tarjetas grandes**: **«Partida guiada»** (3 manos · 2 min · la cifra del premio o ✓ hecha), **«Aprender por tema»** (los diez capítulos en tres pistas, cada uno con un icono pequeño y su ✓ de visto, local en `ajilei.guia.vistos`) y **«Pregúntale a Mia»** (ASI-1). Cada tarjeta que aún no existe dice «Pronto». Se construye en la tanda 3 con la guiada activa; la tanda 4 enciende los temas; ASI-1, a Mia.
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
5. Cinco cartas con la suma al lado → «Tu suma es la del mejor palo que tengas. Cuantas más cartas del palo, más sumas.»
6. El 7 de Oro con el aro → «En las mesas de 4 y 5, el 7 de Oro es **comodín**: se junta con cualquier palo. Vale 10 con 4 y 11 con 5.»

**3 · Cómo va una mano**
1. Dos cartas → «Primero recibes dos.»
2. La fila de acciones → «Se apuesta.»
3. Cinco cartas → «Llegan tres más. Se apuesta otra vez.»
4. Cinco cartas, las del mejor palo con el aro y las otras tachadas → «**Quédate con tu mejor palo** y cambia el resto. Puedes cambiar hasta {tope}.» ({tope}: 5 en las mesas de 2 a 4, 3 en la de 5; confirmado por el motor)
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

**10 · Consejos** (la escalera de la guiada, más dos)
1. La escalera entera en una pantalla → «Palos distintos: pasa. Te apuestan y tienes algo: iguala. Mismo palo: ×1. Cuatro del palo: ×2. Cinco: ×5. AJILEI: ×10.»
2. «El pez grande se come al chico: si tienes mucha pila, aprieta.»
3. «Retirarse a tiempo también es ganar.»
4. «Mira el pozo antes de igualar: ¿vale lo que te piden?»
5. «Un AJILEI se apuesta a lo grande. Siempre.»

### 2.3 Lo que se mide (sin servidor)

Nada en `eventos` en la v1. Las marcas locales (`hecha`, `vistos`, `senales`) bastan para que la app no insista. Si la ola grande necesita saber cuántos terminan la guiada, es un `tipo` de `eventos` escrito por el cliente, y se decide entonces.

---

## 3 · Claves de `t()` (orden de magnitud)

GUI-1 ≈ 45 (oferta 6 · mano 1 ×12 · mano 2 ×12 · mano 3 ×10 · cierre y premio 5) · señales 3 · TUT-1 ≈ 60 (10 títulos + ≈ 48 pasos + índice) · común ≈ 8 (Siguiente, Volver, Cerrar, Salir, paso n de m, Partida guiada, Cómo se juega, visto). **Total ≈ 105**, en `textos.tut.es.js` diferido, salvo las 4 de la oferta y la fila del ⋮.

---

## 4 · Lo que el motor confirmó (tanda 2, 2026-11-20, ejecutándolo sin abrirlo)

1. **Solo 51 es AJILEI.** Cinco cartas del mismo palo que no suman 51 no lo son (43 de Copas pierde contra 50 de Oros). El capítulo 4 lo dice así.
2. **El tope del descarte** es 5 cartas en las mesas de 2, 3 y 4, y 3 en la de 5. El capítulo 3, paso 4, lo dice así.
3. Los tres órdenes de baraja de la guiada los fija el buscador y los vigila `guiaManos.test.js`; con la v1.1 se vuelven a buscar.
4. Los rótulos se miden en 360 × 640 con la letra de LEC-1: ninguno pasa de dos líneas (`tut.lineas`).

Lo que la ola 0 no entendió (pregunta 2 del guion de la ola) entra como paso nuevo o como cambio de rótulo, nunca como capítulo nuevo, en una v1.1.
