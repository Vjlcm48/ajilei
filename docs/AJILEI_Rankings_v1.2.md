# AJILEI · Rankings · Normativo v1.2

**Estado:** v1.2 sellada por Victor el 2026-10-28 (v1.1: 2026-10-26; v1.0: 2026-10-24) · **Decisor:** Victor · **Rector:** Claude (chat) · **Ejecutor:** Claude Code
**Destino en el repo:** `docs/AJILEI_Rankings_v1.2.md`. Sustituye a `AJILEI_Rankings_v1.1.md` (y esta a la v1.0); las dos se conservan como historia.
**Sustituye también:** las notas dispersas sobre rankings de la Tienda v1.1 §10, el normativo `AJILEI_Modos_y_Asistencia` (puntos por nivel y mesa) y los chats de junio, agosto y octubre de 2026 citados en §15.

Este documento dice **qué** son los rankings y **con qué reglas** se calculan. No dice cómo se programan: eso lo decide la Fase 0 (solo lectura) y las fichas de la Fase 1, que deben respetar cada punto de aquí. Si el código y este documento se contradicen, manda el documento hasta que Victor lo cambie.

**Qué cambia respecto de la v1.1** (RNK-1, Fase 1e; decisiones de Victor del 2026-10-25 al 2026-10-28, lámina 1e-L sellada). Cada punto lleva su marca «v1.2:» en el texto:
1. §6.7: la **línea de la familia** al final del top 100 la ven **todos**, siempre, en las dos pestañas. Premium (cuando exista) ve solo la línea y nunca el video. Sustituye «la ven **solo** los Premium».
2. §6.7.1 (nuevo): el intersticial de SumaMente. Las cuatro reglas del contador, la clave en el aparato, el día de Chicago calculado en el cliente, `CADA_ENTRADAS = 8` revisable con los testers, y la ficha de la pantalla (V1 B, V2 A, V3 A, «Continuar» en fila, botón de sonido, botón «atrás» de Android).

Lo demás queda como en la v1.1.

**Qué cambió respecto de la v1.0** (v1.1; RNK-1, Fases 0 a 1d; decisiones de Victor y del rector del 2026-10-24 al 2026-10-26). Cada punto lleva su marca «v1.1:» en el texto:
1. §3: el punto de escritura del servidor se llama por su nombre, `informar_pila`; `finDeMano` es del cliente (H-2 de la Fase 0).
2. §2.4: el AJILEI de 52 exige **cinco sentados al barajar** (H-5).
3. §2.4: en mesa de 4, cuatro del palo más el 7 de Oros suma 51 pero **no es AJILEI** (H-6).
4. §2.4: si todos se retiran «a las dos», no hay AJILEI (H-7).
5. §6.5: los empates dejan de compartir puesto: **puesto único** y corte en 100 filas exactas (Ajuste A de la 1c-i).
6. §3: «imborrable» admite el borrado en cascada de la cuenta (K-12).
7. §1 y §6.7: ningún ranking se desbloquea con video, y la tarjeta de SumaMente pasa a ser un **intersticial propio** cada 8 entradas. Sustituye «1 de cada 5 visitas».
8. §6.10 (nuevo): los fondos de cada pestaña y el oro.
9. §10: las guardas del servidor de la 1a.
10. §7: el mini-perfil, tal como se construyó en la 1c-ii y la 1d.
11. §8.2 (nuevo): la frescura de la pantalla.
12. §7.2 y §7.4 (nuevo): la victoria.
13. §12: la nota de lanzamiento sobre los puntos de los testers.
14. §5: el saldo total de «Las grandes fortunas» es **solo la billetera**, también con una mesa abierta (K-1 de la Fase 0). §14 queda cumplido.

Lo que no cambia se deja como estaba en la v1.0.

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
1. **Ningún ranking se desbloquea con video** ni con pago. Se entra libre desde el lobby (retira la decisión de junio de 2026 del video por 24 h). **v1.1:** lo que sí hay es un intersticial propio de SumaMente cada 8 entradas a Rankings (§6.7). No es una llave: la pantalla se abre igual, con o sin él.
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
| AJILEI de 52 (**v1.1:** solo con **cinco sentados al barajar**, `handRules.ruleN = 5`, con el comodín) | +2 |

Reglas:
1. Vale **contra las IAS y contra humanos** por igual.
2. **Basta tenerlo y ganar la mano**, aunque los demás se hayan retirado antes de mostrar cartas. El motor sabe qué tienes; un AJILEI no deja de serlo porque el rival se asustó.
3. Si dos jugadores tienen AJILEI en la misma mano (rarísimo), **cobra el extra solo quien gane la mano**. El otro, nada.
4. El extra se registra aparte en el libro (§3), para que se pueda contar «cuántos AJILEI lleva» sin recalcular.
5. **v1.1 · El 52 es de cinco sentados (H-5).** «Mesa de 5» quiere decir cinco sentados al barajar, no el tamaño de la mesa: una mesa de 5 con un eliminado juega con `ruleN = 4` y no puede dar 52. El servidor lo exige (`ajilei = 52 ⇒ sentados = 5`, §10).
6. **v1.1 · El 51 de la mesa de 4 que no es AJILEI (H-6).** En mesa de 4, cuatro cartas del palo que suman 41 más el 7 de Oros suman 51, pero esa mano **no es AJILEI**: no lleva extra.
7. **v1.1 · Sin cinco cartas no hay AJILEI (H-7).** Si todos se retiran «a las dos», el ganador tiene dos cartas y no puede tener AJILEI: gana la mano con sus puntos de tabla y sin extra.

### §2.5 · Lo que NO hay, por decisión

- **Sin tope diario** de puntos contra las IAS, por ahora. Se revisa con los datos de los testers. Gracias al libro (§3) se puede añadir después sin tocar a nadie.
- **Sin puntos por partida ganada**, por AJILEI sin ganar la mano, por racha ni por constancia. Solo manos ganadas.

---

## §3 · El libro de puntos (regla técnica sellada)

Los puntos **no son un número que sube**: son un **libro**, como el libro de movimientos de ECO-1. Una línea por mano ganada, **imborrable**.

**v1.1 · «Imborrable» y la cuenta borrada (K-12).** Nadie corrige ni borra una línea. La única excepción es el borrado de la cuenta entera: si se borra el perfil, su libro y su total se van en cascada, igual que sus movimientos de ECO-1.

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
- **Contra las IAS:** el servidor, en el mismo fin de mano que ya recibe ECO-1. Nunca el cliente directamente. **v1.1 (H-2):** el punto de escritura es la RPC `informar_pila(p_mesa, p_seq, p_pila, p_fin_vivos, p_fin_gano, p_fin_mano, p_fin_ajilei)`. `finDeMano` es la función del cliente que arma ese fin de mano; no existe en el servidor.
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

**Saldo total** para «Las grandes fortunas»: la cifra de la billetera. **v1.1:** solo la billetera (K-1, Fase 0); quien está sentado aparece con lo que tiene en la billetera mientras juega.

---

## §6 · Presentación

1. **Top 100** en cada ranking, con puesto, avatar (hueco), username, corona Premium si la hay, y la cifra (puntos o HC).
2. **Tu posición, siempre visible**, dentro o fuera del top. Fuera del top 100: **puesto exacto y franja**, por ejemplo «Puesto 1.482 · dentro del 30 %».
3. **La franja** va en pasos del 5 %, **redondeando hacia arriba**: quien está en el 28 % lee «dentro del 30 %»; quien está en el 3 % lee «dentro del 5 %». Nota conocida: con pocos jugadores (los testers) las franjas salen raras («dentro del 70 %»); es normal y se arregla sola con gente.
4. **Nunca se muestra la cola de la lista.** Nadie ve «el último».
5. **v1.1 · Empates: puesto único** (Ajuste A de la 1c-i; sustituye «comparten el puesto, 1, 2, 2, 4»). Cada jugador tiene su propio puesto. Desempata, por este orden: la cifra, de mayor a menor; quien llegó antes a esa cifra; y el username sin mayúsculas (`lower(username)`). El top se corta en **100 filas exactas**, y quien queda fuera del corte ve su puesto en «Tu posición». Dentro del top, la banda dice solo el puesto, sin franja. Fuera del top dice «Puesto n · dentro del p %», con la franja `((puesto·20 + total − 1) / total) · 5` en división entera: el paso del 5 % hacia arriba del punto 3.
6. **Dos pestañas** en una sola pantalla «Rankings», entrada desde el lobby (la barra de abajo ya tiene su icono). La pestaña abre por defecto en «Los grandes maestros».
7. **v1.1 · SumaMente** (sustituye «~1 de cada 5 visitas»). Rankings no se desbloquea con video (§1). Lo que hay es un **intersticial propio de SumaMente** cada 8 entradas a Rankings, como mucho 1 al día (día de Chicago), con «Omitir» a los 5 s y nunca para los Premium (§6.7.1). **v1.2:** la **línea de la familia** al final del top 100 la ven **todos**, siempre, en las dos pestañas: icono de SumaMente · «SumaMente» · «Ver en Google Play», que abre la ficha de Google Play en pestaña nueva. Ocupa el hueco reservado en la 1c-i al final de la lista, sin cambiarle el alto. Premium (cuando exista) ve **solo** la línea y nunca el video. Va enmarcado como parte de la familia HEPTACREATION y no tapa la lista ni la posición propia.
8. **Hueco del avatar:** el círculo con la inicial del username (como en SAL-3). AVA-1 lo llena después.
9. **Tamaños:** la pantalla se valida en los mismos tamaños de TAB-1: celular vertical, tableta, laptop (`h`) y monitor. Es pantalla de lobby, no de mesa: no toca óvalos ni protegidos.
10. **v1.1 · Fondos y oro.** «Los grandes maestros» va sobre fondo verde y «Las grandes fortunas» sobre vinotinto. La medalla del 1 va en contorno, sin relleno. El único oro macizo de la pantalla es el «+» de la píldora.

### §6.7.1 · El intersticial de SumaMente (v1.2, nuevo)

**El contador (cuatro reglas):**
1. **Una entrada = tocar «Rankings» en el lobby.** Da igual qué pestaña se mire, cuántas veces se cambie, si se abren tarjetas o si la lista se refresca. **No cuentan:** «Ver tu nuevo ranking» desde la victoria ni volver a Rankings al cerrar una tarjeta.
2. **El video sale en la entrada n.º 8 y luego cada 8**, si ese **día de Chicago** aún no salió. Al salir, el contador vuelve a 0 y el día queda gastado.
3. **Si el turno cae en un día gastado, no sale y el contador vuelve a 0 igual.** El turno se pierde; no se guarda deuda.
4. **«Omitir» cuenta como visto.** El día se gasta cuando el intersticial **aparece**.

El contador y el último día visto **viven en el aparato**: una sola clave de almacenamiento del navegador, censada en INV-12. Dos teléfonos cuentan aparte, y borrar los datos del sitio reinicia. El **día de Chicago** se calcula en el cliente con la zona `America/Chicago`. **Nunca para Premium:** hoy la condición no existe y vive en un solo sitio del código, como hueco. El 8 es una constante (`CADA_ENTRADAS`), revisable con los datos de los testers.

**La pantalla** (lámina 1e-L, sellada con V1 B · V2 A · V3 A · «Continuar» en fila):

| Qué | Regla |
|---|---|
| Qué es | Una pantalla propia entre el lobby y Rankings, a pantalla entera; no una capa sobre Rankings. Al terminar va a Rankings y no queda nada montado detrás |
| Caja del video | La proporción real del video (580:1280). Nunca se recorta. Fondo de la pantalla: el abisal liso; la caja, negra |
| Disposiciones | Apilada (vertical, y apaisado de más de 830 de alto) y **lateral** en apaisado de 830 o menos de alto: familia arriba a la izquierda, «Omitir» arriba a la derecha, acciones abajo a la derecha |
| Antes de los 5 s | Nada en el sitio de «Omitir» (V1 B) |
| «Omitir» | Píldora de contorno arriba a la derecha; aparece a los **5 s** de video con un fundido de 200 ms; zona táctil ≥ 44 |
| Google Play | Debajo del video (V2 A), desde el primer segundo, de contorno, con dos líneas dentro: «Ver en Google Play» / «App para Android». Abre la ficha de SumaMente en Google Play en pestaña nueva |
| «Continuar a Rankings» | El botón dorado, con su sitio reservado desde el primer segundo; se enciende al terminar el video. Es el único oro macizo |
| Al terminar | El video se queda en el último fotograma; «Omitir» sigue; «Continuar» se enciende |
| Mientras carga | Una capa propia con el icono de SumaMente al 34 % del ancho, centrado sobre el abisal |
| Sonido | Arranca con sonido tras el toque de entrada. Si el navegador no lo deja, arranca en silencio y aparece el **botón de sonido** (la forma de la ✕ del video de recompensa), arriba a la izquierda dentro del video; un toque activa el sonido y lo quita |
| Idioma | El de los textos: español → el video en español; cualquier otro → el video en inglés |
| Botón «atrás» de Android | Durante los 5 primeros segundos no hace nada; después cuenta como «Omitir» |
| Movimiento reducido | Solo se quitan los fundidos; el video arranca igual |
| Escritorio (V3 A) | El video a toda la altura que queda |

---

## §7 · El mini-perfil

Una **sola pieza** (la misma tarjeta) que se abre desde varios sitios. **v1.1:** es una sola tarjeta, puesta por portal en la página (fuera de la escala de la mesa), que se abre desde los dos rankings (una fila o la banda «Tu posición»), desde la victoria (la tuya) y, en el futuro, desde la sala de espera. Nunca dentro de la mesa.

### §7.1 · Contenido (de otro jugador)

- avatar (hueco) · username · corona Premium si la hay
- país y estado (ver §7.3)
- «Los grandes maestros: puesto N · P puntos»
- «Las grandes fortunas: puesto N · S Heptacoins»

**v1.1 · Sin puntos.** Si el jugador no tiene puesto en «Los grandes maestros», su línea dice «Aún no está en este ranking» en la tarjeta de otro, y «Gana tu primera mano para entrar» en la tuya.

**Nunca:** ganados/perdidos, correo, ni ningún dato de cuenta. **Sin botón de reto** (descartado en junio de 2026). El saldo total **es público** en la tarjeta y en los rankings: quien no quiera que se vea, que no lo acumule a la vista.

### §7.2 · Dónde se abre

| Sitio | Decisión |
|---|---|
| Sala de espera (tocar un asiento ocupado) | **Sí.** Es el sitio natural. Lo construye la campaña que toque la sala (MES-PvP), con esta tarjeta. |
| Dentro de la mesa, en plena mano | **No.** Estorba: reloj de turno, óvalo intocable en el teléfono, cartas encima. Si un día hace falta, solo entre manos. |
| Los dos rankings (tocar un nombre) | **Sí.** Lo construye Rankings. **v1.1:** una fila abre la tarjeta de ese jugador (la tuya, si es la tuya); la banda «Tu posición» abre la tuya. |
| Pantalla de victoria («Ver tu nuevo ranking») | **Sí**, abre la propia tarjeta con la posición nueva. **v1.1:** construido en la 1d (§7.4). |
| Lista de amigos (AMI-1) | Después del lanzamiento. |

### §7.3 · El propio perfil

La misma tarjeta, con dos cosas más que solo ve el dueño: **su correo** y el acceso a **editar** (avatar, país y estado cuando existan). Tampoco muestra ganados/perdidos.

**País y estado:** hoy `profiles` guarda solo el username; el país no existe. **La tarjeta sale sin país** hasta que exista el perfil editable (campaña aparte; candidata: dentro del menú de configuraciones). El hueco queda dibujado, como el del avatar. Cuando exista, es opcional y lo declara el jugador; si es Venezuela, puede indicar el estado.

**v1.1 · Cómo se verá «País y estado».** Hasta el perfil editable (menú de configuraciones) es un hueco con ese rótulo. Cuando exista: la bandera del país de origen; el estado, solo para Venezuela; el isotipo de AJILEI por defecto, mientras el jugador no elija país; y «Venezuela», sin rayita, si falta el estado.

### §7.4 · La victoria (v1.1, nuevo)

- **«Ver tu nuevo ranking»** abre tu mini-perfil, la tarjeta propia de §7.3. No navega: al cerrarla vuelves a la pantalla de victoria, y sales con «Salir de la mesa», como siempre.
- **Se enciende al llegar `saldoFinal`**, la respuesta del servidor al cobrar la mesa: para entonces el libro ya tiene la última mano y la tarjeta trae los puntos nuevos. Antes está en su sitio y con su tamaño, pero apagado. No hay aviso «Próximamente».
- **«Puntos obtenidos»** es una sola cifra: la suma de los puntos de las manos ganadas en la mesa, cada una con su extra del AJILEI ya dentro (la misma función que espeja al servidor, INV-65). Sin desglose.

---

## §8 · Frecuencia y frescura

### §8.1 · Frecuencia

**A pedido**, como en SumaMente: al entrar a la pantalla se calcula con la información del momento. No hay cifras guardadas «de ayer».

Lo que necesita el servidor: una consulta para el top 100 y otra para «mi puesto», ambas sobre un índice por puntos (y por saldo). Con miles de jugadores es inmediato; con cientos de miles, un índice lo sigue resolviendo. Si un día pesa, se pone una copia que se refresca cada X minutos **sin cambiar la pantalla**: la pantalla pide «el ranking», no le importa de dónde sale.

### §8.2 · La frescura de la pantalla (v1.1, nuevo)

- La pantalla pide la lista **al entrar**, **al cambiar de pestaña** y **al volver al primer plano** (tras bloquear el teléfono o cambiar de ventana) si la última consulta de esa pestaña tiene **un minuto o más**.
- Al volver, conserva la pestaña y el desplazamiento: la lista se actualiza donde está, sin saltar.
- **Sin reloj mientras está a la vista:** la lista nunca se mueve sola.
- El día que exista la copia refrescada del servidor (§8.1), la frescura la marca el servidor.

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

**v1.1 · Las guardas del servidor (RNK-1 1a).** Mientras tanto, `informar_pila` pone cuatro límites a lo que el teléfono puede anotar:
1. El número de mano es **estrictamente creciente por mesa**: una mano repetida o anterior no anota.
2. **`ajilei = 52` exige `sentados = 5`** (§2.4.5).
3. Como mucho **12 fines de mano por minuto** por jugador.
4. **Las anomalías no anotan:** la pila se sigue informando, pero el libro no recibe la línea.

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
| **v1.1 ·** Si los puntos de los testers se ponen en cero | al lanzamiento |

---

## §13 · Relación con otras campañas

- **ECO-1:** el libro de puntos sigue el patrón del libro de movimientos; el fin de mano contra las IAS es el punto de escritura. El récord de manos (reto × jugadores) sigue existiendo como estadística aparte.
- **VOZ-3:** «ganar la mano» = capa principal (`lecturaDeMano` y `finDeMano` en el cliente; **v1.1:** en el servidor, `informar_pila` con `p_fin_gano`, §3).
- **MOT-1 / MES-PvP:** el árbitro escribe los puntos contra humanos con `ruleN + 3` y el extra del AJILEI; la sala de espera monta el mini-perfil.
- **AVA-1 / Tienda:** el avatar y la corona Premium ocupan sus huecos en la lista y en la tarjeta.
- **IDI-1:** todos los textos por `t()`; las franjas («dentro del 30 %») y las frases de posición deben medirse en los 5 idiomas.
- **Menú de configuraciones:** recibe «Ocultar saldo» (§11) y, quizá, el perfil editable (§7.3).
- **Publicidad:** el intersticial y la línea de SumaMente (§6.7 y §6.7.1) son promoción cruzada propia, no un anuncio pagado; no cuentan en la rutina de intersticiales.

---

## §14 · Lo que la Fase 0 debe averiguar (solo lectura)

**v1.1:** cumplido; respuestas en `docs/reportes/AJILEI_RNK-1_Fase0_Informe_v1.0.md` §K.

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
- El chat del 2026-10-24: todo lo sellado en la v1.0 (§2.4, §2.5, §3, §4, §5, §6, §7, §8, §11).
- **v1.1:** los informes de RNK-1 en `docs/reportes/`: la Fase 0 (H-2, H-5, H-6, H-7 y K-12), la 1a (las guardas de §10), la 1c-i (Ajuste A, §6.5), la 1c-ii (el mini-perfil y el Ajuste B) y la 1d (la victoria y la frescura). Las decisiones de Victor del 2026-10-24 al 2026-10-26, incluidas las de SumaMente (§6.7) y los fondos (§6.10).
- **v1.2:** las decisiones de Victor del 2026-10-25 al 2026-10-28 sobre el contador, la línea de la familia y la lámina 1e-L (`docs/reportes/AJILEI_RNK-1_Fase1eL_Informe_v1.0.md`), y el informe de la 1e (`docs/reportes/AJILEI_RNK-1_Fase1e_Informe_v1.0.md`).
