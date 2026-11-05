# AJILEI · Tienda virtual y economía de Heptacoins — v1.4

**Estado:** SELLADO por Victor. v1.0 el 2026-10-02; v1.1 el 2026-10-10; v1.2 el 2026-10-31 (TIE-1 1a); v1.3 el 2026-11-03 (VIS-1); v1.4 el 2026-11-05 (MES-PvP).
**Alcance:** catálogo de productos, precios, formas de pago, vías gratuitas de obtener Heptacoins (HC) y reglas de calibración de la economía.
**Lo consumen:** tienda virtual, pasarela de pago, ECO-1 (saldo persistente), AVA-1 (avatar en perfil, lobby, rankings y sala de espera), MES-PvP, rankings.
**Sustituye:** a la v1.3, que queda como historia. No cambia ningún precio: la v1.4 solo cambia la publicidad en PvP (§10.1). La v1.3 anotó el contraste del texto (§13.4). La v1.2 recoge la tienda que construyó TIE-1 1a —la pantalla, sus cinco estantes, el estante Tapetes con tonos, la vitrina, la ventana de compra, el inventario en el servidor y la regla del ojito— en la §13 nueva, y pone al día §7, §11 y §12.
**Fuentes cruzadas:** el diseño de los tapetes sigue en `AJILEI_Tapetes_v1.2.md` (los tonos, en la §13 de este) y el reverso oficial en `AJILEI_Identidad_A_v1.1.md` §6. Las reglas del dinero en el servidor viven en `AJILEI_ECO-1_Reglas_v1.2.md`: si este documento y las Reglas dicen distinto sobre cómo funciona algo en el servidor, mandan las Reglas; sobre precios y productos, manda este.
**Lo edita:** solo el rector. Cualquier cambio de cifra abre una versión nueva con su entrada en §12.

---

## §1 · Principios de la economía

1. **Ancla:** 1 dólar ≈ 2.500 HC (tasa del pack más pequeño). Todo precio en HC se puede leer en dólares con esa equivalencia.
2. **Ningún regalo gratis supera al pack más barato.** Hoy: ningún premio gratuito individual pasa de 5.000 HC.
3. **El bono mensual de Premium vale menos que el pack de su mismo precio.**
4. **La ventaja crece con el tamaño del pack.** Cada pack da más HC por dólar que el anterior.
5. **Nada se compra para ganar.** Las cartas, las reglas, las IAS y el ranking de puntos son iguales para todos. Lo que se vende es tiempo (packs), comodidad y estatus (Premium) y cosmética (avatares, tapetes, reversos).
6. **Los cosméticos se pagan solo con HC.** El dinero real compra HC y Premium, nunca un cosmético directamente. Así la economía habla un solo idioma.
7. **El bono de bienvenida es para jugar.** Ningún cosmético de pago se puede comprar solo con el bono.
8. **Precio único por categoría y nivel.** Ningún personaje, color ni variante cuesta distinto por lo que representa.
9. **(nuevo) El servidor lleva todas las cuentas del dinero.** Bono, constancia, videos, entradas, recargas y salidas los cuenta y los paga el servidor, con un libro de movimientos que no se puede borrar. El teléfono nunca decide cuánto dinero tiene nadie (ECO-1).

## §2 · Bono de bienvenida y alcance del jugador nuevo

- **2.500 HC, único por persona.** Es la única cifra de este documento que no está sujeta a revisión.
- **(nuevo) Una vez por correo real.** Las variantes de Gmail (con «+» o con puntos, y `googlemail.com`) cuentan como el mismo correo. El servidor guarda solo una huella del correo; esa huella no caduca y sobrevive al borrado de la cuenta, para que borrar y volver a registrarse no dé otro bono. La política de privacidad debe mencionarlo (pasarela de pago).
- **(nuevo) Cuentas múltiples:** no hay más medida que la regla del correo. Victor lo cerró así (2026-10-06): el riesgo es bajo y la fricción no compensa.
- **Alcance sellado:** Básico cómodo y una probada de Avanzado y Pro en la entrada mínima, como funciona hoy. Con 2.500 HC el jugador nuevo puede entrar a las cuatro mesas de Básico, a Avanzado en las mesas de 100 y 200 y a Pro en la mesa de 200, siempre dentro del piso de entrada (10× la apuesta). La pantalla «Retar a las IAS» solo pone en gris lo que el saldo no cubre; no hay bloqueo por nivel.
- En PvP, el bono alcanza para las mesas de 50 (corta 750 · llena 2.500) y de 100 en entrada corta (1.500).

## §3 · Vías gratuitas de obtener HC

| Vía | Cantidad | Límite | Notas |
|---|---|---|---|
| Bono de bienvenida | 2.500 HC | Una vez por correo real | §2 |
| Video recompensado | 500 HC por video | **8 videos al día** (4.000 HC) | Disponible también para Premium |
| Bono de constancia | 500 HC | Cada 3 días seguidos de ingreso | Igual para todos, Premium o no |
| Jugar y ganar contra las IAS o en PvP | Variable | Sin techo, salvo la válvula (§3.3) | La vía principal del jugador hábil |

**El día es el de Chicago para todos** (`America/Chicago`), con su cambio de horario. Lo usan el tope de videos, la constancia y la válvula. Lo decide siempre el reloj del servidor, nunca el del teléfono. *(Cambia la v1.0, que hablaba de la zona horaria de cada jugador.)*

### §3.1 · Bono de constancia (construido en ECO-1 1d)

- **Ingreso** = abrir la app con su cuenta. Cuenta una vez por día; no hace falta jugar.
- **La racha:** el primer ingreso es el día 1 y el día siguiente suma uno. **Si el jugador falta un día, la racha vuelve a 1** (el día en que vuelve cuenta como el primero).
- **El cobro:** 500 HC cuando la racha llega a 3, 6, 9…; la cuenta sigue después de cobrar. Un solo cobro por jugador y día, aunque abra en dos aparatos a la vez.
- **El contador:** una ficha fija en la barra del lobby, entre la píldora del saldo y el engranaje: tres monedas pequeñas y «n/3». La moneda del día se posa con un salto corto.
- **El cobro se anuncia con el aviso de saldo** (la cápsula dorada junto a la píldora, la cifra que sube y el sonido suave de fichas): «+500 HC por tu constancia.». Ese aviso es el lenguaje propio del dinero que llega fuera de la mesa y solo sale el día del cobro.
- Máximo teórico: unos 10 bonos al mes (≈ 5.000 HC), alrededor del 4 % de lo que pueden dar los videos.

### §3.2 · Video recompensado

- **Hasta que llegue la publicidad real, el video es simulado** (ECO-1 1f y 1g): dura unos 40 s, se rellena con contenido propio y lleva una marca discreta de «video de prueba». Así los testers ya pueden ganar HC por esta vía.
- **Tres finales, como un anuncio real:**
  - *no hay video disponible:* no cobra;
  - *cerrado antes de tiempo:* **no cobra y no cuenta como uno de los 8**;
  - *completado:* cobra 500 HC.
- **El servidor paga contra un boleto** que emite al empezar, cobrable una sola vez y solo si pasaron los segundos mínimos (unos 35). Un doble toque o un reintento de red nunca pagan dos veces.
- **Tiene su propia celebración;** no usa el aviso de saldo.
- **El día que llegue el anuncio real,** solo se cambia la pieza que muestra el video; el boleto, el tope y la celebración se quedan.
- Dónde se pide el video, qué rellena los 40 s y si se ve «quedan N de 8» se deciden en la lámina de la 1f.

### §3.3 · La válvula (decidida en ECO-1)

- **Es un tope diario de ganancia neta contra las IAS.** Se descartó el rake: en la simulación apenas frenaba la acuñación.
- **Está construida y APAGADA.** Victor la enciende, ajusta o apaga solo desde el SQL Editor. Se decide con los datos de los testers.
- **Encendida y alcanzada:** la mesa en curso se juega y se paga completa, pero ya no se puede recargar en ella ni abrir otra mesa contra las IAS hasta el día siguiente. PvP y los videos siguen abiertos.

**Red de seguridad:** un solo video (500 HC) alcanza para volver a la mesa más barata (Básico, mesa 50, entrada mínima). Ningún jugador queda fuera del juego para siempre.

**Lo que cuesta cada meta en videos** (referencia para la vitrina y el tutorial):

| Meta | HC | Videos | Días con el tope de 8 |
|---|---|---|---|
| Volver a la mesa tras quebrar | 500 | 1 | — |
| Retar a la familia (PvP, mesa 100, corta) | 1.500 | 3 | — |
| Avatar estático | 7.500 | 15 | ~2 |
| Avatar animado | 20.000 | 40 | ~5 |
| Tapete Tricolor | 50.000 | 100 | ~13 |

## §4 · Packs de monedas

| Pack | Precio | HC | HC por dólar | Ventaja sobre el Starter | Neto con Paddle (aprox.) |
|---|---|---|---|---|---|
| Starter | $1,99 | 5.000 | 2.513 | — | $1,39 |
| Popular | $3,99 | 12.000 | 3.008 | +20 % | $3,29 |
| Pro | $5,99 | 20.000 | 3.339 | +33 % | $5,19 |
| Grande | $9,99 | 50.000 | 5.005 | +99 % | $8,99 |

- El Grande lleva en la vitrina la etiqueta **«Mejor valor · el doble por dólar»**.
- El Pro funciona como ancla del Grande. Se espera que se venda poco; si los datos reales lo piden, subirlo a ~25.000 HC (decisión pendiente de datos, no de diseño).
- Se descartó el pack de $0,99: la comisión fija se comía más de la mitad del precio.
- El neto se calculó con la tarifa de Paddle vista en agosto de 2026 (5 % + $0,50); se verifica en la pasarela de pago.

## §5 · Premium

| Plan | Precio | Precio por mes | Bono mensual | Total del plan | Pago |
|---|---|---|---|---|---|
| 1 mes | $2,99 | $2,99 | 2.000 HC | 2.000 HC | Solo Paddle (renovación automática) |
| 6 meses | $11,99 | $2,00 | 2.500 HC | 15.000 HC | Paddle o cripto (prepagado) |
| 1 año | $19,99 | $1,67 | 5.000 HC | 60.000 HC | Paddle o cripto (prepagado) |

**Beneficios:**
1. **Sin anuncios:** ni banner ni intersticiales. El video recompensado sigue disponible para ganar HC.
2. **Bono mensual** según el plan, abonado mes a mes (nunca de golpe), también en los planes prepagados.
3. **Corona de tres picos** en `#e8b84b` plano, junto al nombre del jugador en perfil, lobby, sala de espera, rankings y mesa.
   - La corona queda reservada para Premium: no se usa para el primer lugar del ranking ni para ningún otro significado.
   - Aparece desde el primer día de la prueba y se retira al cancelar.
   - En la mesa, la campaña que la implemente mide primero el espacio del nombre a 360 px en mesa de 5 antes de dar por hecho que cabe; los paneles viven en archivos protegidos.
4. **Pausa exclusiva en PvP:** mientras los demás jugadores ven su intersticial (§10.1), el Premium ve un mensaje de miembro con cuenta atrás (y, opcionalmente, los consejos rotativos de la sala de espera). Contra las IAS no hay pausa: la partida sigue sin interrupción.

**Prueba gratis:** 3 días automáticos, sin tarjeta. Quita los anuncios y muestra la corona, pero **no da HC**. Las monedas llegan con el primer pago.

**Descartados:** el marco dorado en el avatar (chocaba con el anillo de llegada de la sala de espera) y el cosmético exclusivo que se pierde al cancelar.

## §6 · Avatares

| Producto | Precio | Pago |
|---|---|---|
| Avatar gratis | El círculo con la inicial del usuario | — |
| Avatar estático | 7.500 HC | Solo HC |
| Avatar animado (incluye el estático) | 20.000 HC | Solo HC |
| Mejora de estático a animado | 12.500 HC | Solo HC |

**Modelo de compra:**
- **Se compra el personaje, no el tono.** Al comprar se elige el tono de piel, y se puede cambiar gratis en cualquier momento. La vitrina muestra 12 personajes en dos versiones, no 48 archivos.
- **Precio único** para los 12 personajes y para los 6 animados de muestra.
- **El animado incluye el estático,** y quien ya tiene el estático paga solo la diferencia.
- **Animados bajo pedido:** la compra entrega el estático al instante y el animado queda «en producción», con plazo publicado de 72 h y aviso al entregar. Cada animado se produce una sola vez y queda catalogado para todos.
- **Cambio de tono en un animado que aún no existe:** se muestra el estático de ese tono con la etiqueta «en producción» y el animado se produce en 72 h. El techo de producción sigue siendo de 48 animados.
- **Si un animado falla al tercer intento de producción,** se reembolsa la diferencia (12.500 HC).
- **Inventario:** la PWA necesita el estado «pendiente» antes de abrir la tienda.

## §7 · Tapetes (fieltros)

| Tapete | Precio | Pago |
|---|---|---|
| Verde clásico | Gratis | — |
| Negro grafito | 10.000 HC | Solo HC |
| Azul profundo | 15.000 HC | Solo HC |
| Vinotinto | 25.000 HC | Solo HC |
| Tricolor | 50.000 HC | Solo HC |

- Precios de agosto de 2026, ratificados contra el ancla de §1 (≈ $4 · $6 · $10 · $20).
- **El tapete es siempre personal.** Contra las IAS, cada jugador ve el suyo.
- **(nuevo) En PvP, cada jugador ve su propio tapete;** lo que ven los demás de él es su reverso (§8). No hay «tapete del anfitrión» para toda la mesa. *(Corrige la v1.0, que lo dejaba pendiente; decisión de Victor del 2026-10-06.)*
- **No se compran tapetes en mitad de una partida:** la entrada de tapetes salió del menú ⋮ de la mesa, y desde la mesa no hay puerta a la tienda (construido en TIE-1 1a, §13.1).
- **Los tapetes «comprados» antes de la tienda no cuentan.** La propiedad vive en el servidor desde TIE-1 1a; las marcas del teléfono se borran sin leerlas (§13.6).
- **(nuevo) Grafito, azul y vinotinto tienen tres tonos** (claro, medio y oscuro); el tono se elige al comprar y se cambia gratis después. El verde y el tricolor no tienen tonos (§13.3).

## §8 · Reversos de carta

| Reverso | Precio | Pago |
|---|---|---|
| Vinotinto «Greca» (oficial, `reverso_carta.svg`) | Gratis | — |
| Verde (el de la mesa, en su tono más oscuro) | 3.000 HC | Solo HC |
| Negro intenso | 5.000 HC | Solo HC |
| Azul (el del tapete Azul profundo) | 7.500 HC | Solo HC |
| Tricolor | 25.000 HC | Solo HC |

**Precio:** 50 % del tapete del mismo color. El verde no tiene tapete de referencia (el tapete verde es gratis), así que lleva precio propio, por encima del bono de bienvenida.

**Visibilidad (social):**
- Cada mano lleva el reverso de su dueño, y lo ven todos los jugadores de la mesa en todas las pantallas.
- El mazo y el descarte llevan siempre el vinotinto oficial («la baraja de la casa»). Una carta toma el reverso de su dueño al entrar en su mano.
- Contra las IAS, ellas usan el vinotinto oficial y el jugador ve su reverso en sus propias cartas boca abajo.
- No revela información: el reverso solo dice de quién es una carta, y eso ya lo dice el asiento.
- No contradice REV-1, que corrigió una diferencia involuntaria; lo que exige es que cada reverso se vea igual en todas las pantallas.

**Condiciones de diseño (obligatorias):**
- Todos los reversos heredan el lienzo, la zona segura y el **marco octogonal dorado** del oficial. El marco es lo que separa la carta de un tapete del mismo color y lo que unifica una mesa con reversos distintos.
- Regla del oro único: fuera de la Heptacoin, solo `#e8b84b` plano o con opacidad.
- Tricolor «vestido», nunca la bandera literal; el amarillo no es un segundo dorado.

**Nota técnica:** el reverso elegido viaja con el jugador a la mesa, como el avatar en AVA-1, y el componente de carta recibe el reverso como parámetro.

## §9 · Formas de pago por producto

| Producto | HC | Paddle (tarjetas) | Cripto (USDT) |
|---|---|---|---|
| Packs (los 4) | — | Sí | Sí |
| Premium 1 mes | — | Sí (renovación automática) | No |
| Premium 6 meses / 1 año | — | Sí | Sí (prepagado, sin renovación) |
| Avatares | Sí | No | No |
| Tapetes | Sí | No | No |
| Reversos | Sí | No | No |
| Entradas a torneos (después del lanzamiento) | Sí | No | No |

## §10 · Rankings

- **«Los grandes maestros» = ranking de puntos = mérito.** Los puntos dependen del nivel y del tamaño de la mesa, nunca del monto apostado. No se puede comprar.
- **«Las grandes fortunas» = ranking por saldo total en HC,** incluidas las compradas. Es una decisión consciente de Victor: refleja cómo funciona la riqueza. Reglas de presentación:
  - Se muestran solo los primeros puestos y la posición del propio jugador; nunca la cola de la lista.
  - En pantalla debe quedar clara su diferencia con el ranking de mérito.
- **(nuevo) Ningún ranking se desbloquea con video.** Se retira la decisión de junio de 2026 (un video daba acceso por 24 h).
- **(nuevo)** «Ocultar saldo» (menú de configuraciones) se debate a fondo antes de activarse, porque «Las grandes fortunas» muestra el saldo total. Va en la billetera, nunca en la pila de la mesa.

### §10.1 · La publicidad en PvP (decidida, la construye MES-PvP)

- **Intersticial al terminar la mano cuando `mano % 11` es 5 o 0:** manos 5, 11, 16, 22, 27, 33, 38, 44… Es una rutina propia, distinta de la de las IAS.
- Mientras no haya red de anuncios, el anuncio es simulado, con «Omitir» a los 5 s.
- Bajo cada asiento que lo ve aparece «En anuncio», con el área opaca.
- **Tope de 45 s:** luego la mano arranca.
- Quien vuelve antes ve una tarjeta sobre la mesa: «Tus compañeros aún están viendo un anuncio», la cuenta atrás del tope, la frase de gratitud y la pastilla «Quitar publicidad», con contorno dorado y corona.
- **La frase de gratitud** es la de Victor: «La publicidad ayuda a mantener el juego, gracias por tu comprensión». La del rector queda como variante, y decide la lámina: «La publicidad mantiene AJILEI gratis para todos. Gracias por tu comprensión.»
- **«Quitar publicidad»** abre en el sitio «Premium · Pronto», sin salir de la mesa. También es una entrada junto a Premium en la tienda. Desde la mesa sigue sin haber puerta a la tienda (§7, INV-76); cuando exista Premium (TIE-1b), se decide la navegación.
- El Premium no ve el intersticial: ve un mensaje de exclusividad (§5). Hoy solo existe el gancho.
- La pausa la manda el servidor: `AJILEI_MOT-1_Contrato_v1.0.md` §6, «Publicidad».

## §11 · Pendientes entregados a otras campañas

Ninguno bloquea la tienda.

| Pendiente | Dueño |
|---|---|
| Construir la rutina de publicidad de PvP (§10.1) | MES-PvP |
| Dónde se pide el video simulado, qué rellena sus 40 s y si se ve «quedan N de 8» | ECO-1 1f (lámina) |
| Encender la válvula, y con qué tope (§3.3) | Revisión post-testers |
| «Ocultar saldo» frente a «Las grandes fortunas» (§10) | Menú de configuraciones |
| USDT en la red Tron (TRC-20): comprobar si Coinbase Commerce lo acepta | Pasarela de pago |
| Si Paddle acepta persona natural o depende de la LLC; tarifa vigente | Pasarela de pago |
| La política de privacidad menciona la huella del correo del bono (§2) | Pasarela de pago |
| Bono mensual del plan de 1 mes (2.000 HC) frente al bono de constancia (~5.000 HC al mes): revisar con datos de los testers | Revisión post-testers |
| Tope de videos, bono de constancia y pack Pro: afinar con el pago real por video y la pérdida media por hora | Revisión post-testers |

**Cerrados desde la v1.0:**

| Pendiente de la v1.0 | Cómo se cerró |
|---|---|
| Ventana fija de publicidad en PvP | Decidida (§10.1): tope de 45 s, y quien vuelve antes espera con la tarjeta |
| Manos en que aparecen los intersticiales | Decididas (§10.1): 5, 11, 16, 22, 27… |
| Tapete del anfitrión visible para todos en PvP | Descartado: cada jugador ve su propio tapete (§7) |
| Cuentas múltiples y paso de monedas en mesas privadas | Cerrado: solo la regla del correo real (§2) |
| Válvula contra la acuñación | Decidida y construida apagada (§3.3) |
| Cómo conviven el video y los packs en «Conseguir más monedas» y en el «+» dorado | Cerrado en TIE-1 1a: el «+» abre la tienda en el estante Monedas, con «Ver un video» y «Paquetes de monedas» (§13.1, §13.2) |
| El ranking que se desbloqueaba con un video | Retirado: ningún ranking se desbloquea con video (§10) |
| Zona horaria de cada jugador para el «día» | Sustituida por el día de Chicago para todos (§3) |

## §12 · Historial

- **2026-06:** primeros packs (2.500/$0,99 · 7.500/$2,99 · 20.000/$5,99), luego 1.500/$0,99 · 5.000/$2,99 · 12.000/$5,99. Premium $2,99 / $11,99 / $19,99 con prueba de 3 días. Video 500 HC. Bono 1.000 HC.
- **2026-08-05:** bono mensual de Premium 2.000 / 2.500 / 3.000 HC. Categorías de tienda: Premium, packs, avatares, lienzos (tapetes), dorsos (reversos) y, más adelante, torneos.
- **2026-08-17:** precios de los tapetes (10.000 / 15.000 / 25.000 / 50.000 HC).
- **2026-09:** bono de 1.200 HC, luego 2.500 HC (APU-1). Entradas contra las IAS a 10× / 20× / 50× de la apuesta.
- **2026-10-02 (v1.0):** packs recalibrados ($1,99 / $3,99 / $5,99 / $9,99 → 5.000 / 12.000 / 20.000 / 50.000 HC); Premium anual a 5.000 HC al mes; prueba sin monedas; corona de tres picos; pausa exclusiva en PvP; avatares (7.500 / 20.000 / mejora 12.500 HC, tono como ajuste); reversos (3.000 / 5.000 / 7.500 / 25.000 HC, visibilidad social); tope de 8 videos al día; bono de constancia de 500 HC cada 3 días; ranking de poder por saldo total.
- **2026-10-10 (v1.1):** ningún precio cambia. Entran las decisiones de «Arreglos finales 9» a «11» y lo construido en ECO-1 (1a a 1d):
  - el servidor lleva todas las cuentas del dinero (nuevo principio 9);
  - el bono, una vez por correo real, con las variantes de Gmail como el mismo correo; cuentas múltiples cerrado;
  - el día de Chicago para todos (sustituye la zona horaria de cada jugador);
  - la constancia tal como quedó: racha que vuelve a 1 al faltar un día, cobro en los días 3, 6, 9…, ficha «n/3» en la barra del lobby y aviso de saldo;
  - el video: simulado hasta la publicidad real, tres finales, el cerrado antes de tiempo no cuenta para el tope, boleto del servidor y celebración propia;
  - la válvula: tope diario de ganancia contra las IAS, construido y apagado;
  - en PvP cada jugador ve su propio tapete; no se compran tapetes en mitad de una partida; los tapetes «comprados» antes de la tienda no cuentan;
  - los rankings se llaman «Los grandes maestros» y «Las grandes fortunas», y ninguno se desbloquea con video;
  - la rutina de publicidad de PvP (manos 4, 8, 13…, tope de 45 s);
  - §11 actualizada, con los pendientes cerrados.
- **2026-10-31 (v1.2, TIE-1 1a):** ningún precio cambia. Entra la tienda construida (§13):
  - la tienda es una pantalla con tres puertas (el botón «Tienda» del lobby, el «+» y la fila «Tapetes» del ⚙) y ninguna desde la mesa; la hoja «Conseguir monedas» se retira;
  - cinco estantes: Monedas, Tapetes, y Reversos, Avatares y Premium en «Pronto»;
  - los tapetes con tonos (claro, medio y oscuro: 9 valores, L × 1,24 y × 0,80) y la vitrina que lee los mismos valores que la mesa;
  - la ventana de compra con «Te quedarán» y «No te alcanza» con «Conseguir monedas»;
  - el inventario genérico en el servidor, las cuatro RPC y sus motivos cerrados;
  - el ojito tapa la cifra también en la tienda; la ventana enseña el saldo siempre;
  - §7 y §11 al día.
- **2026-11-03 (v1.3, VIS-1):** ningún precio cambia. El texto atenuado de la tienda sube a α 0,65, y la vitrina sigue a 0,55 (§13.4).
- **2026-11-05 (v1.4, MES-PvP):** ningún precio cambia. La publicidad en PvP (§10.1): manos 5, 11, 16, 22… en vez de 4, 8, 13…; anuncio simulado con «Omitir» a los 5 s; tarjeta para quien vuelve antes, con la frase de gratitud; «Quitar publicidad» abre «Premium · Pronto» en el sitio, y es también una entrada junto a Premium en la tienda.


## §13 · La tienda, construida (TIE-1 1a)

Primer estante de verdad: **Tapetes**. Lámina `laminas/tie1a` (1a-L, sellada por Victor el 2026-10-31); ficha `AJILEI_TIE-1_Fase1a_v1.0`; informe `docs/reportes/AJILEI_TIE-1_Fase1a_Informe_v1.0.md`.

### §13.1 · La tienda es una pantalla

- Pantalla propia con la barra de las pantallas de salas (`PantallaChips`): flecha, que vuelve a la pantalla que la abrió, y casa, que va al lobby. Va envuelta en el marco del video (`MarcoVideo`), así que «Ver un video» funciona desde el estante Monedas.
- **Tres puertas, ninguna desde la mesa** (por eso no se compra en mitad de una partida; el servidor no lo comprueba: limitación declarada, sin consecuencia económica, porque la billetera y la pila son cosas distintas):
  - el botón **«Tienda»** de la barra inferior del lobby (V1-A, el toldo de siempre; el lobby no se mueve: Δ = 0), que abre **Tapetes**;
  - el **«+»** dorado de la píldora, en todas las pantallas que lo pintan, que abre **Monedas**; desde la propia tienda cambia a ese estante;
  - la fila **«Tapetes»** de la hoja ⚙ (`AJILEI_Configuracion_v1.3.md` §13), que abre **Tapetes**.
- La hoja «Conseguir monedas» del «+» se retiró: su sitio es el estante Monedas. Un solo camino al video.

### §13.2 · Los cinco estantes (V2-B)

**Monedas · Tapetes · Reversos · Avatares · Premium**, en ese orden. Los tres últimos van en gris con «Pronto». En el teléfono la fila de estantes se desplaza con máscara y `scroll-snap`.

- **Monedas:** «Ver un video» con su contador (el estante pregunta a `mi_video` al abrirse) y «Paquetes de monedas» en «Pronto» hasta la pasarela de pago (§4).
- **Tapetes:** una fila por tapete, en orden de precio (V3-A): verde · grafito · azul · vinotinto · tricolor. Cada fila dice «✓ En uso», «Usar» o el precio. El verde fuera de uso dice «Usar» (D-14 del informe).

### §13.3 · El estante Tapetes, con tonos

- Los nombres y descripciones son los de `src/config/tapetes.js` (copy provisional; el id de grafito es `grafito`, su nombre «Negro grafito»).
- **Tienen tonos** grafito, azul y vinotinto: **claro · medio · oscuro** (ids de contrato `claro`, `actual`, `oscuro`; el rótulo de `actual` es «Medio»). El verde y el tricolor no tienen tonos.
- **Un tono son 9 valores:** los 8 tokens del fieltro (las cinco paradas y las tres tintas) y `--luz-k`. Cada parada conserva H y S del tono medio, con la L de HSL × 1,24 en el claro y × 0,80 en el oscuro; las tintas guardan sus alfas (0,88 / 0,45 / 0,30); `--luz-k` vale 0,85 en el claro, 1 en el medio y 1,15 en el oscuro; el oro no cambia. Los valores viven en `src/styles/tapetes.css` §1b, copiados tal cual de la lámina (`laminas/tie1a/tonos.css`). Se midieron contra el verde de hoy, no contra 4,5 : 1 en el centro desnudo del óvalo (el 3,80 del verde va a VIS-1).
- El tono de un tapete comprado se cambia gratis y cuantas veces se quiera (`elegir_tono`). En uno no comprado, tocar una muestra es solo vista previa: el tono elegido viaja en la compra; sin elegir, se compra en «medio».

### §13.4 · La vitrina y su contrato (V4-A)

- La vista de un tapete es la **mesa entera en miniatura**, apaisada siempre (`src/components/Vitrina.jsx`), con las muestras redondas de tono debajo.
- **Δ = 0 con la mesa (INV-77):** la vitrina no imita la mesa, lee lo mismo. Su raíz `.vit` lleva los mismos atributos que la mesa pone en `<body>` (`data-tapete`, `data-tapete-tono`), calculados por la misma función (`atributosTapete`), y `tapetes.css` y `luz.css` declaran cada bloque para los dos (`:is(body, .vit)`). Los nueve valores salen iguales en los once casos; lo miden `diagDSK tienda` y `diagDSK tapetes`.
- **El texto de la tienda y el de la vitrina (VIS-1):** `--text-muted` vale α 0,65 en `.sal`, y `.vit` lo devuelve a 0,55 para seguir igual que la mesa. El texto de la tienda da ≥ 4,5 : 1 bajo su tinta (INV-79), y `tie.contraste` lo mide junto con ese rótulo.
- Tres tamaños de la misma pieza: `grande` (la vitrina), `muestra` (las franjas de la lista) y `disco` (las muestras de tono y la fila del ⚙).

### §13.5 · La ventana de compra (V5-A)

- Centrada, con el nombre, el precio, «Tu saldo» y **«Te quedarán»**. Cuatro estados: confirmar · comprando (el botón ocupado; tope de 20 s) · listo («¡Listo! {nombre} es tu tapete», y el tapete queda puesto) · error («No se pudo comprar. Tu saldo no cambió.», y se puede volver a intentar).
- **Sin saldo** no hay ventana: el botón sale atenuado con «No te alcanza: faltan N HC» y el enlace **«Conseguir monedas»**, que lleva al estante Monedas.
- La ventana enseña el saldo **siempre**, también con el ojito cerrado (§13.8).

### §13.6 · El inventario vive en el servidor (INV-76)

- Tabla **`inventario`**, genérica para todo lo que se compra con HC y se tiene: `(jugador_id, tipo, articulo, tono, en_uso, adquirido_en)`, clave `(jugador_id, tipo, articulo)`, a lo sumo **un artículo en uso por tipo** (índice único parcial) y borrado en cascada con la cuenta. El jugador solo **lee** sus filas (RLS de lectura, sin políticas de escritura): escriben solo las funciones.
- El catálogo del servidor (`precio_articulo`, `articulo_con_tonos`, `articulo_gratis`) es interno y no se concede al cliente. Los precios que pinta la tienda son los de `src/config/tapetes.js`; una prueba compara los dos (`scripts/testTapetes.test.js`, «cliente = migración = banco»).
- Lo gratis no tiene fila: el verde está en uso cuando ningún tapete lo está.
- **Lo «comprado» en el aparato no se reconoce:** la clave `ajilei.tapetes.comprados` se borra al arrancar y nunca se lee. El aparato guarda solo una **copia** del tapete y el tono en uso (`ajilei.tapete`, `ajilei.tapete.tono`) para pintar la mesa antes de que conteste el servidor; la primera respuesta la pisa.

**Las cuatro RPC** (migración `supabase/migrations/20261031150000_tie1a_inventario.sql`, guion `supabase/pruebas/tie1a_verificacion.sql`, 23 filas):

| RPC | Qué hace | Devuelve |
|---|---|---|
| `comprar_articulo(tipo, articulo, tono)` | Cobra el precio de la billetera con una línea `compra` del libro (clave `compra:<jugador>:<tipo>:<articulo>`), crea la fila y la deja **en uso** | `text` |
| `usar_articulo(tipo, articulo)` | Pone en uso uno comprado; el gratis apaga todos los del tipo | `text` |
| `elegir_tono(tipo, articulo, tono)` | Cambia el tono de uno comprado, gratis | `text` |
| `mi_inventario(tipo)` | Las filas del jugador (de un tipo, o todas) | filas |

### §13.7 · Motivos cerrados

Las tres que escriben devuelven `text` y **nunca lanzan** en el camino normal:

| Motivo | Cuándo |
|---|---|
| `ok` | Hecho |
| `sin_sesion` | Sin jugador |
| `limite` | Más de 30 compras por minuto (`contar_intento_dinero`) |
| `tipo_invalido` · `no_existe` | Tipo o artículo que el catálogo no tiene (comprar el verde es `no_existe`) |
| `tono_invalido` · `sin_tono` | Un tono que no es de los tres, o un tono para un artículo sin tonos |
| `ya_comprado` | Ya lo tiene. Si el libro dice que pagó y la fila no está, **el doble cerrojo se repara solo**: se crea la fila en uso, `ok` y sin cobrar |
| `sin_saldo` | La billetera no alcanza |
| `no_comprado` | Usar o elegir tono de uno que no tiene |

El cliente solo pinta lo que dice el servidor: comprado, en uso y tono cambian **solo con su `ok`**.

### §13.8 · La regla del ojito (INV-69, redactado de nuevo)

El ojito tapa la cifra de la píldora **en el lobby y en la tienda** (y en la tienda se destapa ahí mismo, como en el lobby). En la ventana de compra, «Tu saldo» y «Te quedarán» se ven **siempre**. La pila de la mesa, los rankings y el mini-perfil no lo obedecen.

### §13.9 · Para TIE-1b

Los packs de monedas (estante Monedas, con la pasarela) y los reversos (§8) entran con los mismos moldes: una fila más de `tipo` en `inventario` y en el catálogo interno, las mismas cuatro RPC y sus motivos, un estante que deja de decir «Pronto» y una vitrina propia.
