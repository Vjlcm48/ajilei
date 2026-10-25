# AJILEI · Rankings · Normativo v1.0

**Estado:** sellado por Victor el 2026-10-24 · **Decisor:** Victor · **Rector:** Claude (chat) · **Ejecutor:** Claude Code
**Destino en el repo:** `docs/AJILEI_Rankings_v1.0.md` (viaja en el commit documental de la campaña Rankings)
**Sustituye:** las notas dispersas sobre rankings de la Tienda v1.1 §10, el normativo `AJILEI_Modos_y_Asistencia` (puntos por nivel y mesa) y los chats de junio, agosto y octubre de 2026 citados en §15.

Este documento dice **qué** son los rankings y **con qué reglas** se calculan. No dice cómo se programan: eso lo decide la Fase 0 (solo lectura) y las fichas de la Fase 1, que deben respetar cada punto de aquí. Si el código y este documento se contradicen, manda el documento hasta que Victor lo cambie.

---

## §1 · Qué son

AJILEI tiene **dos rankings**, con nombre propio y sentido distinto:

| Ranking | Mide | Se gana | Se compra |
|---|---|---|---|
| **Los grandes maestros** | **Mérito:** puntos acumulados por manos ganadas | jugando | nunca |
| **Las grandes fortunas** | **Poder:** saldo total en Heptacoins, incluidas las compradas | jugando, viendo videos o comprando | sí, indirectamente |

Los puntos de ranking son **prestigio puro**: van aparte de los Heptacoins, no se gastan, no se venden y no se regalan.

«Las grandes fortunas» muestra la riqueza tal como es. Es una decisión consciente de Victor (2026-10-02): refleja la brecha real entre quien tiene y quien casi no tiene, como en la vida.

**Reglas transversales:**
1. **Ningún ranking se desbloquea con video** ni con pago. Se entra libre desde el lobby (retira la decisión de junio de 2026 del video por 24 h).
2. En pantalla debe quedar clara la diferencia entre mérito y poder: un jugador nuevo tiene que entender sin explicación que uno se gana y el otro se puede comprar.
3. Todos los textos nuevos van por `t()` desde el día uno (IDI-1 los traduce después).

---

## §2 · Los puntos de «Los grandes maestros»

### §2.1 · Qué da puntos

**Solo ganar una mano.** Perder no resta ni se registra en el ranking. El sistema no castiga perder: cada quien acumula a su ritmo.

«Ganar la mano» es **ganar la capa principal del pozo** (regla de VOZ-3, INV-63). Recuperar un sobrante o llevarse una capa lateral no es ganar la mano y no da puntos.

### §2.2 · La tabla (sellada en agosto de 2026, confirmada hoy)

**Contra las IAS**, por **nivel del reto**, plano, sin importar el tamaño de la mesa ni el monto:

| Reto | Puntos por mano ganada |
|---|---|
| Básico | 1 |
| Avanzado | 2 |
| Pro | 3 |

**Contra humanos**, por **jugadores sentados al barajar el Pie de esa mano**, sin importar el monto de la mesa:

| Jugadores sentados | Puntos por mano ganada |
|---|---|
| 2 | 5 |
| 3 | 6 |
| 4 | 7 |
| 5 | 8 |

La asimetría es deliberada: contra humanos la dificultad es **la cantidad** de rivales; contra las IAS la dificultad es **el nivel**.

### §2.3 · Reglas de la tabla

1. **Nunca depende del monto apostado.** Una mano de 100 y una de 5.000 valen lo mismo. El dinero ya tiene su propio ranking.
2. **Los puntos se congelan al reparto.** Lo que pase dentro de la mano (retiros, abandonos, quiebras a mitad) no cambia los puntos de esa mano. En la mano siguiente se vuelve a contar quién está sentado: una partida que arranca en 5 (manos de 8 puntos) y pierde tres jugadores pasa a manos de 5 puntos.
3. **Fuente única.** Contra humanos, el número de sentados es el que el motor ya congela al barajar el Pie (`handRules.ruleN`); los puntos son `ruleN + 3`. Está **prohibida una segunda calculadora en paralelo** (mismo principio que rige Mano Actual). Lo que hoy muestra la sesión («Manos ganadas y sus puntos») debe leer de esa misma fuente, nunca calcular por su cuenta.
4. **Mesas privadas y abiertas puntúan igual.** Si los torneos necesitan otra regla, se decide en los torneos; el ranking general no distingue.
5. **Mesas mixtas (humanos e IAS juntos) no existen** y no se contemplan.

### §2.4 · El adicional del AJILEI

Ganar la mano **teniendo AJILEI en la mano** suma puntos extra, encima de los de la tabla:

| Mano | Extra |
|---|---|
| AJILEI de 51 | +1 |
| AJILEI de 52 (solo posible en mesa de 5, con el comodín) | +2 |

Reglas:
1. Vale **contra las IAS y contra humanos** por igual.
2. **Basta tenerlo y ganar la mano**, aunque los demás se hayan retirado antes de mostrar cartas. El motor sabe qué tienes; un AJILEI no deja de serlo porque el rival se asustó.
3. Si dos jugadores tienen AJILEI en la misma mano (rarísimo), **cobra el extra solo quien gane la mano**. El otro, nada.
4. El extra se registra aparte en el libro (§3), para que se pueda contar «cuántos AJILEI lleva» sin recalcular.

### §2.5 · Lo que NO hay, por decisión

- **Sin tope diario** de puntos contra las IAS, por ahora. Se revisa con los datos de los testers. Gracias al libro (§3) se puede añadir después sin tocar a nadie.
- **Sin puntos por partida ganada**, por AJILEI sin ganar la mano, por racha ni por constancia. Solo manos ganadas.

---

## §3 · El libro de puntos (regla técnica sellada)

Los puntos **no son un número que sube**: son un **libro**, como el libro de movimientos de ECO-1. Una línea por mano ganada, **imborrable**.

Cada línea lleva, como mínimo:

| Campo | Qué guarda |
|---|---|
| jugador | quién ganó |
| fecha y hora | cuándo (UTC; el «día» de Chicago se deriva, como en ECO-1) |
| origen | `ias` o `humanos` |
| nivel | Básico / Avanzado / Pro (solo con origen `ias`) |
| sentados | jugadores sentados al barajar (siempre; contra IAS sirve de estadística) |
| puntos base | los de la tabla §2.2 |
| ajilei | 0, 51 o 52 |
| extra | 0, 1 o 2 |
| partida y mano | de qué partida y qué número de mano, para auditar |

**Por qué un libro y no un total:** todo lo que hoy se dejó «para después» (tope diario, temporadas, torneos, reglas distintas para privadas) se calcula con el libro **sin pedirle nada a los jugadores viejos**. Con un total a secas, cada una de esas ideas obligaría a empezar de cero.

El total por jugador se **deriva** del libro. Si por velocidad conviene guardar también el total en una columna, se mantiene por disparador desde el libro, nunca escribiendo el total a mano (decisión técnica de la Fase 1).

**Quién escribe el libro:**
- **Contra las IAS:** el servidor, en el mismo fin de mano que ya recibe ECO-1 (`finDeMano` / `p_fin_gano`). Nunca el cliente directamente.
- **Contra humanos:** el árbitro del servidor (MOT-1), cuando exista. Hasta MES-PvP **no hay puntos contra humanos**: la regla queda escrita, la cuenta duerme.

---

## §4 · Período

**Se lanza solo con el histórico** (de todos los tiempos): los puntos nunca se borran.

Como cada línea del libro lleva fecha, una pestaña **«Este mes»** (o por temporada) se añade después sin migración, cuando lleguen los torneos, que son en el fondo una temporada corta con premio. No se construye ahora.

«Las grandes fortunas» no tiene período: el saldo es el de hoy, siempre.

---

## §5 · Quién entra

| Ranking | Entra |
|---|---|
| Los grandes maestros | solo quien tiene **al menos 1 punto**. Al resto se le dice: «Gana tu primera mano para entrar». |
| Las grandes fortunas | **todos** los que tienen billetera (todos los jugadores). |

**Saldo total** para «Las grandes fortunas»: la cifra de la billetera. Si el jugador tiene una mesa abierta con fichas sentadas, la Fase 0 confirma cómo se cuenta (recomendación del rector: billetera + pila declarada en la mesa abierta, es decir, «lo que te llevarías si te paras ahora»; si resulta caro o ambiguo, solo la billetera). Victor decide con el informe.

---

## §6 · Presentación

1. **Top 100** en cada ranking, con puesto, avatar (hueco), username, corona Premium si la hay, y la cifra (puntos o HC).
2. **Tu posición, siempre visible**, dentro o fuera del top. Fuera del top 100: **puesto exacto y franja**, por ejemplo «Puesto 1.482 · dentro del 30 %».
3. **La franja** va en pasos del 5 %, **redondeando hacia arriba**: quien está en el 28 % lee «dentro del 30 %»; quien está en el 3 % lee «dentro del 5 %». Nota conocida: con pocos jugadores (los testers) las franjas salen raras («dentro del 70 %»); es normal y se arregla sola con gente.
4. **Nunca se muestra la cola de la lista.** Nadie ve «el último».
5. **Empates:** los jugadores con la misma cifra **comparten el puesto** (1, 2, 2, 4). Dentro del mismo puesto, el orden de la lista es solo visual y no significa nada.
6. **Dos pestañas** en una sola pantalla «Rankings», entrada desde el lobby (la barra de abajo ya tiene su icono). La pestaña abre por defecto en «Los grandes maestros».
7. **La tarjeta de SumaMente** aparece en ~1 de cada 5 visitas, discreta, en un sitio fijo, enmarcada como parte de la familia HEPTACREATION. No tapa la lista ni la posición propia.
8. **Hueco del avatar:** el círculo con la inicial del username (como en SAL-3). AVA-1 lo llena después.
9. **Tamaños:** la pantalla se valida en los mismos tamaños de TAB-1: celular vertical, tableta, laptop (`h`) y monitor. Es pantalla de lobby, no de mesa: no toca óvalos ni protegidos.

---

## §7 · El mini-perfil

Una **sola pieza** (la misma tarjeta) que se abre desde varios sitios.

### §7.1 · Contenido (de otro jugador)

- avatar (hueco) · username · corona Premium si la hay
- país y estado (ver §7.3)
- «Los grandes maestros: puesto N · P puntos»
- «Las grandes fortunas: puesto N · S Heptacoins»

**Nunca:** ganados/perdidos, correo, ni ningún dato de cuenta. **Sin botón de reto** (descartado en junio de 2026). El saldo total **es público** en la tarjeta y en los rankings: quien no quiera que se vea, que no lo acumule a la vista.

### §7.2 · Dónde se abre

| Sitio | Decisión |
|---|---|
| Sala de espera (tocar un asiento ocupado) | **Sí.** Es el sitio natural. Lo construye la campaña que toque la sala (MES-PvP), con esta tarjeta. |
| Dentro de la mesa, en plena mano | **No.** Estorba: reloj de turno, óvalo intocable en el teléfono, cartas encima. Si un día hace falta, solo entre manos. |
| Los dos rankings (tocar un nombre) | **Sí.** Lo construye Rankings. |
| Pantalla de victoria («Ver tu nuevo ranking») | **Sí**, abre la propia tarjeta con la posición nueva. Lo construye Rankings (hoy dice «Próximamente»). |
| Lista de amigos (AMI-1) | Después del lanzamiento. |

### §7.3 · El propio perfil

La misma tarjeta, con dos cosas más que solo ve el dueño: **su correo** y el acceso a **editar** (avatar, país y estado cuando existan). Tampoco muestra ganados/perdidos.

**País y estado:** hoy `profiles` guarda solo el username; el país no existe. **La tarjeta sale sin país** hasta que exista el perfil editable (campaña aparte; candidata: dentro del menú de configuraciones). El hueco queda dibujado, como el del avatar. Cuando exista, es opcional y lo declara el jugador; si es Venezuela, puede indicar el estado.

---

## §8 · Frecuencia

**A pedido**, como en SumaMente: al entrar a la pantalla se calcula con la información del momento. No hay cifras guardadas «de ayer».

Lo que necesita el servidor: una consulta para el top 100 y otra para «mi puesto», ambas sobre un índice por puntos (y por saldo). Con miles de jugadores es inmediato; con cientos de miles, un índice lo sigue resolviendo. Si un día pesa, se pone una copia que se refresca cada X minutos **sin cambiar la pantalla**: la pantalla pide «el ranking», no le importa de dónde sale.

---

## §9 · Privacidad

- Solo **username**, avatar y (a futuro) país/estado. **Nunca el correo** ni nada que identifique la cuenta.
- El saldo total es público por decisión (§1, §7.1).
- El servidor expone **solo las columnas del ranking** (RLS o RPC que devuelva lo justo), nunca la tabla de billeteras completa ni el libro ajeno.

---

## §10 · Confianza: un límite conocido

Hoy, contra las IAS, **es el teléfono quien le dice al servidor «gané esta mano»** (así se construyó ECO-1 1c; el servidor cobra «la última pila informada»). Los puntos contra las IAS heredan **exactamente esa confianza**: ni más ni menos que las monedas. Un cliente alterado podría inventar manos ganadas, igual que hoy podría inventar fichas; la válvula de ECO-1 (apagada hasta los testers) es la guarda de las monedas, y el libro con partida y mano permite auditar los puntos.

Contra humanos los puntos los dará **el árbitro del servidor** (MOT-1), que el cliente no puede engañar.

Este límite se cierra el día que el motor de las IAS también viva en el servidor. No bloquea el lanzamiento.

---

## §11 · «Ocultar saldo» (decisión que se traslada al menú de configuraciones)

«Ocultar saldo» **no toca la pila de la mesa** (sellado en «Arreglos finales 9» y confirmado hoy): la pila es información del juego y se ve siempre. **Tampoco toca los rankings ni el mini-perfil**, donde el saldo es público.

Lo que queda es lo que hacen los bancos: **un ojito en la píldora del lobby** que tapa la cifra **en la propia pantalla**, para que nadie que mire por encima del hombro la lea. La decisión y la construcción viven en la campaña del **menú de configuraciones**, no en Rankings. Rankings solo garantiza que su pantalla **ignora** ese interruptor.

---

## §12 · Lo que se deja para después (anotado, sin decidir)

| Tema | Cuándo |
|---|---|
| Tope diario de puntos contra las IAS | con los datos de los testers |
| Pestaña «Este mes» / temporadas | con los torneos (después del 25-12-2026) |
| Reglas distintas para privadas en torneos | con los torneos |
| País y estado en la tarjeta | perfil editable (menú de configuraciones o campaña propia) |
| Mini-perfil en la lista de amigos | AMI-1 |
| Cuenta de puntos contra humanos encendida | MES-PvP, con el árbitro de MOT-1 |

---

## §13 · Relación con otras campañas

- **ECO-1:** el libro de puntos sigue el patrón del libro de movimientos; el fin de mano contra las IAS es el punto de escritura. El récord de manos (reto × jugadores) sigue existiendo como estadística aparte.
- **VOZ-3:** «ganar la mano» = capa principal (`lecturaDeMano` en el cliente, `finDeMano` en el servidor).
- **MOT-1 / MES-PvP:** el árbitro escribe los puntos contra humanos con `ruleN + 3` y el extra del AJILEI; la sala de espera monta el mini-perfil.
- **AVA-1 / Tienda:** el avatar y la corona Premium ocupan sus huecos en la lista y en la tarjeta.
- **IDI-1:** todos los textos por `t()`; las franjas («dentro del 30 %») y las frases de posición deben medirse en los 5 idiomas.
- **Menú de configuraciones:** recibe «Ocultar saldo» (§11) y, quizá, el perfil editable (§7.3).
- **Publicidad:** la tarjeta de SumaMente (§6.7) es promoción cruzada propia, no un anuncio pagado; no cuenta en la rutina de intersticiales.

---

## §14 · Lo que la Fase 0 debe averiguar (solo lectura)

1. **Dónde nacen hoy los puntos en el cliente:** `sesionCore` («Manos ganadas y sus puntos»), qué regla usa y si lee `handRules.ruleN` o calcula aparte (si calcula aparte, se retira: §2.3.3).
2. **Qué recibe hoy el servidor en el fin de mano** (`finDeMano`, `p_fin_gano`, el récord de manos): si ya viajan el nivel, los sentados y si la mano fue AJILEI, o hay que añadirlo.
3. **Si el motor expone el AJILEI** (51/52) de forma legible sin abrir protegidos.
4. **Qué hay en `profiles` y en las billeteras** que un ranking pueda leer, y qué falta: tabla del libro, índices, RPC del top 100 y de «mi puesto», RLS.
5. **Cómo contar el saldo total** con una mesa abierta (§5).
6. **La pantalla:** dónde está el icono de Rankings en el lobby, qué hay hoy detrás («Próximamente»), y los tamaños de TAB-1 que debe cubrir.
7. **La pantalla de victoria:** el enlace «Ver tu nuevo ranking» y cómo se engancha a la tarjeta propia.
8. **Coste** estimado en Supabase de las dos consultas a pedido.

**Orden habitual después:** preguntas al rector → lámina (pantalla de rankings y tarjeta) → migración y código con STOP para `db push` de Victor → túnel → commits.

---

## §15 · Fuentes

- «Dinámica y presentación del juego AJILEI» (2026-06-18): puntos solo por victorias; mini-perfil sin ganados/perdidos; sin reto.
- «Próximos pasos del desarrollo de AJILEI» (2026-08-15): tabla 1/2/3 y 5/6/7/8, congelada al barajar, `ruleN + 3`, fuente única; normativo `AJILEI_Modos_y_Asistencia v1.0`.
- «Proyección económica del juego AJILEI» (2026-08-16): la misma tabla como ranking único; grietas de colusión y farmeo, dejadas para después.
- «Arreglos finales 7» (2026-10-02): «Las grandes fortunas» cuenta el saldo total, incluido el comprado.
- «Arreglos finales 9» (2026-10-06/07): nombres sellados; sin video; «Ocultar saldo» nunca en la pila de la mesa.
- Tienda v1.1 §10.
- Este chat (2026-10-24): todo lo sellado hoy (§2.4, §2.5, §3, §4, §5, §6, §7, §8, §11).
