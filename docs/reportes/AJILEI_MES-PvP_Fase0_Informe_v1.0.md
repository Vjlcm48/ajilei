# AJILEI · MES-PvP · Fase 0 · Informe · v1.0

- **Ficha:** `AJILEI_MES-PvP_Fase0_v1.0.md`. **Base:** `main` en `de468b3`. **Fecha:** 2026-11-05.
- **Comprobaciones del §1:** `git log -1` = `de468b3`. Sin cambios en rastreados. Sin seguimiento: `docs/AJILEI_APU-1_Reglas_v1.5.md` y `laminas/mon1/`. Un solo worktree (`main`).
- **No se midió en pantalla, no se corrió el arnés y no se tocó la nube.** Toda cifra de tiempo que no cite una constante es una estimación, y lo dice.
- **Tamaños:** S < 30 min · M 30–90 · L > 90 de Claude Code.

**En cuatro líneas.** La mesa contra las IAS puede ser la mesa de humanos con un solo prop y un adaptador. Lo sellado se puede cumplir. El árbitro necesita más de lo que preveía la ficha: además de la pausa de anuncio, le faltan una espera tras el descarte (hoy el turno corre durante la animación), un barajado antes de cada ronda del sorteo y tres datos en la vista. Sin `contribMano` no funciona `lecturaDeMano`, y sin `ultimaAccion` la crónica no puede decir «pasa».

---

## §A · Los 18 puntos del cierre de MOT-1

| # | Punto | Estado de hoy | Archivos | Tam. | Lámina | Bloque |
|---|---|---|---|---|---|---|
| 1 | Armar mesa: Entrada, chip de 50, ritmo; `APUESTAS_PVP` | El servidor ya acepta todo (`mot1_dinero:591-597`). El cliente manda 3 parámetros y seis apuestas | `salas.js:41,57` · `salasApi.js:143-144` · `ArmarMesa.jsx:279-305` | M | Corta | E |
| 2 | Flujos «MOT-1 reescribe» | 7 marcas, y solo 3 mueven algo. Los puntos de verdad son 14 sin marca | `GameTable.jsx` (§B.1) | L | Sí | B |
| 3 | Gracia y lo que ve el que vuelve | Sin regla. El cliente ya relee al volver | `partidaCliente.js:207-211` | M | Sí | G |
| 4 | «Mano actual · Humanos 500» | Precio durmiente. `consultar_mano` solo acepta `mesas_ia` | `cfg1e:110` · `mot1_dinero:117-123` | M | No | H |
| 5 | Mini-perfil en la sala | Componente listo; la sala no lo monta | `MiniPerfil.jsx` · `SalaEspera.jsx` · Rankings v1.2 `:231` | S | No | E |
| 6 | Encender los puntos | Interruptor y llamada listos | `mot1_dinero:1086-1092,:1325` | S | No | H |
| 7 | Quitar el panel | Trivial al llegar la mesa | §B.8 | S | No | B |
| 8 | Mesa `activa` sin partida | La mesa real lo cierra, **si además se entra sola** | `partidaCliente.js:244-251` · `SalaEspera.jsx:432` | S | No | B |
| 9 | Cada cliente abajo | Sale gratis del adaptador | §C | S | No | C |
| 10 | Sala de espera: no rota y va en horario | Cambio de una fórmula y su prueba | `salaEsperaCore.js:141` · `salaEsperaCore.test.js:199` | S | Corta | C |
| 11 | Los 4 s de mano siguiente | Constante provisional | `esperas.js:36-38` | S | No | O |
| 12 | Revelación: 4,96 s frente a 6 s | Se corta: el cambio de fase apaga la celebración | `reloj.js:33` · `mesaCore.js:395` | S | No | O |
| 13 | Ganador en `GAME_OVER` | Se deduce en el adaptador (`!eliminated`) | `vista.js:43-44` | S | Sí (final) | B |
| 14 | `salas_abiertas` sin `entrada` | Falta la columna y el filtro del cliente | `sal_b2:228-250` · `salasCore.js:132-135` | S | No | E |
| 15 | Píldora al día | El panel ya lo resuelve al cobrar; falta sentarse y salir | `PartidaPvP.jsx:242-243` | S | No | B |
| 16 | Texto del tope de 10 por minuto | Clave compartida con los códigos | `textos.es.js:251` · `salasApi.js:50` | S | No | E |
| 17 | Quien abandona sigue en `mi_sala` | Filtra por `cobrado` y `abandono_pedido`, no por `abandonado` | `mot1_dinero:1019-1023` | S | No | G |
| 18 | Partida muerta en el cliente | Sin pantalla. El cliente se detiene y calla | `partidaCliente.js:168-171` · `mot1_dinero:1486` | S | Sí (final) | B |

---

## §B · La mesa alimentada por el árbitro

### B.1 · Lo que mueve el motor dentro de `GameTable.jsx`

Las siete marcas (`:793, :834, :871, :889, :916, :1676, :1731`) son avisos del linter, no un inventario. `:793`, `:871`, `:1676` y `:1731` son estado de pantalla y pueden quedarse como están.

| Línea | Qué hace hoy | En PvP |
|---|---|---|
| `:353-380` | `useState` del motor y `setGame` con crónica | `game` y `cronica` llegan del prop |
| `:550` | `control.pila` | Inerte: `control` es `null` |
| `:834-866` | Reparto; `advanceFromDeal` al acabar (`:854, :860`) | Anima igual; al acabar **no avanza**: espera la vista |
| `:889-890, :903-922` | Reloj y auto-acción (`:914, :917`) | `timeLeft` derivado de `vencimiento.hora`; sin auto-acción ni `congelado` |
| `:1140-1175` | La IA piensa | Fuera: guarda de entrada, ninguna tirada |
| `:1193-1207` | Salto del retirado | Fuera |
| `:1230-1237` | Retirado en el descarte | Fuera |
| `:1267-1277` | `act` → motor | `partida.enviar('apostar', { tipo, k })` |
| `:1288-1293, :1407-1422` | Recarga | Fuera: es «solo vs IAS» (Reglas v1.5 §5) |
| `:1592-1632` | Descarte: `applyDiscard` y animación | Envía índices; anima desde `descarte.cuantas` |
| `:1869-1936` | `beginHand`, ceremonia y barajado | Se derivan de la vista |
| `:2006` | `toggleDiscard` | Sirve tal cual sobre la selección local |
| `:2565, :2714-2729` | «Iniciar mano» y «Siguiente mano» | No se montan: la mano arranca sola |
| `:2926-2932` | ✕ → `salir` | `enviar('abandonar')`, con texto propio |

### B.2 · El corte propuesto

**Un prop, `partida`, en `GameTable`; `null` contra las IAS.**

| Pieza | Dónde | Qué hace |
|---|---|---|
| `vistaAMesa(vista, previa, sala)` | Nuevo, puro, en `lib/` (trozo PvP) | Vista → `game`: rota, rellena dorsos, añade lo que el motor tendría y conserva a quien sale en el pago |
| `useMesaPvP` | Nuevo, trozo PvP | Envuelve `crearClientePartida`; da `{ game, cronica, enviar, reloj, escena, mesa, ritmo }` |
| `PartidaPvP.jsx` | Se reescribe | Monta la mesa y las capas propias: sorteo, anuncio y final |
| `GameTable.jsx` | Unas 15 guardas | `const game = partida ? partida.game : motor.game`, y los puntos de B.1 |

`GameTable` **no importa nada de PvP**: todo le llega por el prop. Así el motor y el cliente no se cruzan, y el corte no toca el peso de la mesa contra las IAS.

**Alternativas descartadas:**

| Alternativa | Por qué no |
|---|---|
| Sacar un `useMotorLocal` y un `useMotorServidor` | El orden de los hooks de este archivo es portante (`:712-716, :942-949`), y mover 500 líneas es justo el riesgo que hay que evitar. Además el compilador de `react-hooks` se rinde sin avisar con un cambio de orden (`:1401-1404, :1642-1650`) |
| Un `MesaPvP.jsx` aparte | Contradice lo sellado («la misma mesa») y duplica 800 líneas de JSX |

**Riesgo para la mesa contra las IAS: bajo y comprobable.** Con `partida === null` toda guarda es falsa, ningún hook cambia de sitio y no se añade ninguna tirada: las tiradas siguen en `:369`, `:1159` y `:1593`. Lo vigilan las semillas de `apu` y `u3`, `msg`, `congelado`, `rec`, `tab` y el lint contra cero (§I).

**Hereda sin trabajo:** `useTapeteEnMesa` (`:627`), `useEscalaMesa` (`:430`), `lecturaDeMano` (`:505`) y «Partida rápida» oculta (`contraIAS` ya es `false` por defecto: `:332`).

### B.3 · Lo que el adaptador debe añadir

| Campo que la mesa lee | ¿En la vista? | Solución |
|---|---|---|
| `players[i].cards` de los rivales | Solo `numCartas` (`vista.js:24-25`). Sin cartas, `:1953` pinta el hueco vacío | Dorsos de relleno con `id` estable |
| `contribMano` | **No.** `capasDe` (`pozos.js:250`), `tramosDe` (`manoCore.js:36`) y `finDeMano` lo necesitan | **Campo nuevo (§O).** No es secreto: suma de lo apostado a la vista |
| `score` | Solo en `resultado.revelacion` | Se funde en `players` |
| `winner` | `resultado.ganador`; en `GAME_OVER`, `!eliminated` | Adaptador |
| `aliveCount`, `numPlayers`, `eliminatedNames` | No | Se derivan (`eliminatedNames` comparando con la previa) |
| `selectedDiscards` | No | Local |
| `acted` | No, y `actuo` lo usa (`cronicaCore.js:79`): sin él, **«pasa» no se detecta** | `ultimaAccion` (§O) |
| `isHuman` | No sale (contrato §4) | Se deja de usar en la voz (B.5) |

**Dos trampas del pago:**
- **Quien abandona y cobra en este cierre** ya viene `eliminated` con `chips: 0` en `PAYOUT` (`partida.js:84-93, :97-113`). Su panel se iría en plena revelación, el vuelo se quedaría sin destino (`:680`) y la pila retenida saldría negativa (`:1095`). El adaptador lo mantiene visible con su `cobrado` hasta la mano siguiente.
- **Si el propio asiento queda eliminado con la mesa viva**, `effectiveLayout` falla: cuenta vivos sin el asiento 0 y le da una posición `undefined` al último rival (`seatLayouts.js:43-51`). Es protegido y no se toca. Por eso el jugador debe salir a una pantalla final personal antes (§P-5).

### B.4 · Las dos vías de render

| | Mesas 3–5 y mesa de 2 apaisada: `OpponentPanel` (`:2122-2162`) | Mesa de 2 vertical y escritorio: `.ai-zone` (`:2018-2120`) |
|---|---|---|
| Rotación y dorsos | Del adaptador | Del adaptador |
| Marca «En anuncio», «Ausente», «Abandonó» | Prop nuevo; `OpponentPanel.jsx` no es protegido | Ranura `.opp-status` (`:2090-2100`) |
| Nombre largo | `.opp-name`; hoja protegida. **A medir con 15 «W»** | `.ai-name`, con *ellipsis* en vertical (`:2029-2033`) |
| Área opaca | Hoja nueva `pvp.css`, aditiva. `.opp-status` hereda la opacidad del panel (VIS-1): la lámina lo mide | Igual |

Una sola función `estadoDeAsiento(seat)` sirve a las dos, como `claseDelMensaje` (`:227`).

### B.5 · La voz

| Pieza | ¿Sirve tal cual? | Qué hace falta |
|---|---|---|
| `lecturaDeMano` · `resultadoDeMano` | Sí, con `contribMano`, `score` y `winner` | Nada |
| `componeCapas` | Casi: `numPlayers === 2` dice «A la IA» (`cronicaCore.js:216`) | Parámetro de voz |
| `composeResultado` | No en mesa de 2: «La IA gana…» (`resultadoCore.js:38-39, :91-93`). «Los demás se retiran» suena raro con un solo rival | Parámetro de voz, con su texto para dos |
| `componeCronica` | **No.** Con N=2 dice «La IA…» y con N>2 dice «Tú pasa.» si el asiento se llama «Tú» (`cronicaCore.js:98-117`). Además detecta por `acted` y por identidad de cartas (`:127-133`) | `vozHumanos.js` nuevo, desde `ultimaAccion`, con segunda persona propia. Reutiliza `MONEDA` y las formas de frase |
| `messageActionKind` (`:211`) | Sí, si las frases mantienen los verbos | Prueba |
| Textos fijos `:2599, :2644, :2692` | No: «La IA está pensando…», «los rivales» | `t()` o rama PvP |

**El parámetro de voz no cambia las frases contra las IAS.** Se prueba al byte con `testVoz3`. Nombres largos: la crónica va a pelo en el `<p>` y `.voz2-texto` solo envuelve el resultado (`:2211-2212`). **Hay que medir** «WWWWWWWWWWWWWWW va all-in con 2500.» en el óvalo. Si no cabe, se recorta en la voz, porque los óvalos no se tocan.

**Sonido de las jugadas ajenas:** `coinBet` y `cardFold` salen de `ultimaAccion`.

### B.6 · Las coreografías frente a los relojes del servidor

| Coreografía | Dura | Espera del servidor | Veredicto |
|---|---|---|---|
| Barajado | 1.950 ms | `BARAJADO` igual (`reloj.js:39`) | Bien |
| Reparto | Fórmula común | Fórmula común (`reloj.js:27-32`) | Bien. La vista llega con latencia: medir el corte de la última carta |
| **Descarte** | Secuencial: hasta 8,3 s con N=2 y **15,9 s con N=4** (`:260-266, :1604-1626`, calculado) | **Ninguna:** `aplicarDescartes` abre `BET_3` con el reloj de 20 s en el acto (`partida.js:155-166, :120-127`) | **Falla: el turno se consume durante la animación. Necesita vencimiento nuevo (§O)** |
| Ceremonia de eliminación | 4.750 ms (`:100-101`) | Ninguna: `empezarMano` va directo a barajado (`partida.js:141-153`) | **Falla: se pisa con el barajado (§O)** |
| Revelación y vuelo | Red de 6 s (`mesaCore.js:395`) | 960 + 4.000 ms | Se corta a los 4,96 s (§O) |

### B.7 · Pantalla final, partida muerta, píldora y saldo

| Tema | Qué se hace | Tam. |
|---|---|---|
| **Final** | `PantallaVictoria` ya recibe lo necesario (`:2419-2428`). `netas` = `cobrado` − entrada. Derrota: `.game-over-screen`, con la cifra de `cobrado` | S |
| **Partida muerta** | Sin vista nueva (cierre, punto 18). `reclamar_vencimiento` recibe `partida_terminada`; el cliente pasa a `detenido` y no dice nada (`partidaCliente.js:168-171`). `useMesaPvP` lo detecta con la vista aún viva y pinta «La mesa se cerró por inactividad. Tu pila volvió a tu saldo», y relee la billetera. Con todos ausentes solo se entera quien vuelve | S |
| **Píldora** | `refrescar` al cambiar `cobrado` (molde `PartidaPvP.jsx:242-243`). También tras crear, unirse y salir de sala (`App`, `ArmarMesa`, `SalaOpciones`, `SalaEspera`) | S |
| **Saldo en la partida (INV-46)** | **El hueco se cierra quitándolo:** la mesa no monta `BarraSuperior`, igual que contra las IAS. La cifra aparece al final. Se reescribe la fila de INV-46 | S |
| **Video abierto al arrancar (P-4 de ECO-1g)** | La mesa no va en `conVideo`, como `sumamente` (`App.jsx:1096-1099`). Al entrar sola, el marco se desmonta y el video se cierra. **A comprobar:** que no se cobre el boleto | S |
| **Pantalla completa** | R4 solo vuelve en «Iniciar mano» y «Siguiente mano» (`:2566, :2715`), que aquí no existen. Propongo el toque de elegir carta y el cierre del anuncio | S |

### B.8 · Quitar el panel

| Se borra | Se queda |
|---|---|
| `PartidaPvP.jsx:30-279` y su cabecera · `panelMot1.css` · `leerMarcaMot1` y `CLAVE_MARCA` (`partidaCliente.js:44-60`) · sus pruebas (`partidaCliente.test.js:473` en adelante, `PartidaPvP.test.jsx`) · su fila en `testClavesAlmacen.test.js:42, :60` · su línea en `testEntradaLigera.test.js:47` · `sal.partida.pronto` y `sal.espera.fin.entrar.nota` (`textos.es.js:218, :222`) y lo que las cita en `textos.test.js:149` | Todo lo demás de `partidaCliente.js`. `msAccion`, `msEco` y `msAviso` también, porque sirven para medir con teléfonos |

### B.9 · El aviso de producción

**La mesa real lo cierra, con una condición.** `revisar` reclama el arranque al llegar a la pantalla (`partidaCliente.js:244-251`), pero hoy cada jugador debe tocar «Entrar a la mesa» (`SalaEspera.jsx:432-440`). Quien no toque no monta el cliente, y su sorteo vence con la posición 0. **Hace falta entrar solo** cuando `fin === 'activa'`. Lo mismo para quien vuelve: `mi_sala` → `entrarSala` → sala de espera (`App.jsx:462-465, :607-614`) debería saltar a la partida. Hoy la casa de `PartidaPvP` lleva al lobby sin avisar, con la mesa viva (`App.jsx:1027`); en la mesa real esa salida es la ✕ con confirmación.

### B.10 · El reloj

| Tema | Hoy | Propuesta |
|---|---|---|
| Pintar | `vencimiento.hora − Date.now()` (`PartidaPvP.jsx:187`) | `timeLeft` derivado, con tope entre 0 y `TURN_TIME`, y los avisos de ≤5 s al cruzar. `useCongelado` sigue montado, pero solo para silenciar el audio |
| Desfase del teléfono | **Sin corregir.** Un reloj adelantado pinta de menos y reclama antes; atrasado, reclama tarde o no reclama. `TOLERADOS` lo disimula (`partidaCliente.js:37`) | La respuesta de `partida` lleva `ahora` (§O). `desfase = ahora + rtt/2 − local`, con una muestra por respuesta. S |
| Volumen de avisos | Con 5 asientos, **cada vencimiento son 5 llamadas** a la función, y 4 acaban en `version_vieja` | Escalonar: `MARGEN + asiento × 200 ms`. S. **A medir:** es la mirada al bus que pide el cierre §2 |
| Canal caído | Entre vencimientos no se relee | Releer cada `RELECTURA_MS` mientras `canal !== 'SUBSCRIBED'`. S. Sesión de más de 1 h: **sin medir** |

---

## §C · Asientos y rotación

| Tema | Hoy | MES-PvP | Tam. |
|---|---|---|---|
| Humano abajo contra las IAS | Es el índice 0 por todas partes: `seatLayouts.js:5-10`, `ASIENTO_HUMANO` (`mesaCore.js:28`), `slotRefs[0]`, `data-coin-target="0"` | Sin cambio | — |
| **Rotación en PvP** | No existe | **En el adaptador:** `i' = (i − asiento + N) % N` sobre `players`, `activePlayerIndex`, `manoIndex`, `pieIndex`, `resultado`, `capas`, `descarte` y `sorteo`. Conserva el orden circular y el sentido: el siguiente turno queda a la derecha, antihorario. `seatLayouts.js` no se abre. **Las acciones no llevan asiento: no hay rotación de vuelta** | S |
| Sala de espera | Silla 0 arriba, en horario (`salaEsperaCore.js:141`, prueba `:199`). No rota | `ang = π/2 − 2π·((i − propio + n) % n)/n`: tú abajo y los demás en antihorario. Atención: `arriba` depende de esa posición, y `diagSAL` cambia sus fotos | S |
| Huecos (K-11) | Se compactan al arrancar (`asientos.js`). Los índices quedan fijos toda la partida | Nada: el cliente solo ve índices compactos | — |
| Alguien abandona a mitad | Sigue en la mano. Retirado en su turno, y `eliminated` al cerrar | Panel con «Abandonó» hasta la mano siguiente (B.3). Después `effectiveLayout` recoloca, con el aviso en el óvalo y su texto propio: «Pepito dejó la mesa · la mesa ahora es de 3», no «sin Heptacoins» (`:1895`). El comodín cambia con `ruleN`, como hoy | S |

---

## §D · El sorteo en pantalla

**Hoy:** el panel pinta botones 1–5, la lista `yaEligieron` y las rondas en texto (`PartidaPvP.jsx:117-149`).

**La vista da:** `ronda`, `etapa` (`reparto`, `eleccion`, `volteo`), `participan`, `posiciones`, `yaEligieron`, `rondas[]` con `{ volteo, empatados, azar, mano }`, y `vencimiento` (`vista.js:29-41`, `sorteo.js:38-53`). Con eso se escriben los cuatro mensajes del §3, incluidos «entre Juan, María y Pedro» y «el azar elige a…».

| Falta | Dónde | Tam. |
|---|---|---|
| **Barajado antes de cada ronda.** El árbitro pasa directo a `reparto_sorteo` (`partida.js:203, :405`) | Árbitro, §O | S |
| **Qué posición eligió cada uno.** `volteo` no lleva `posicion`, y el volteo ajeno no sabe qué carta girar. No es secreto (solo lo es el valor de las no elegidas) | Árbitro, §O | S |
| **El mazo sin Pie.** `pieIndex` es `null` en el sorteo (`vista.js:70`) y `launchFlyingCard` lee `deckRefs[pieSeat]` | Rama PvP; dónde va el mazo lo dice la lámina | S |
| Reparto por oleadas (5 × todos a la vez), elección con reloj de 10 s, «ya eligió» por asiento, volteo simultáneo, vuelta rápida | `vuelosSorteo` + `renderPlayerCards` y `renderOpponentCard`, en una rama cada uno. Los 5 huecos ya existen por asiento (`:433-437`) | M |
| Textos | `textos.es.js`, con `t()` y prefijo `pvp.sorteo.*`. Los panel eran locales por INV-84; estos los ve un jugador | S |
| `VOLTEO_SORTEO_MS = 3000` (`esperas.js:34`) debe alcanzar para el volteo, el mensaje y la vuelta | Cifra a medir; empezaría en 4 s | S |

**La lámina debe enseñar:** barajado · oleadas · elección (ninguno, algunos, tú ya elegiste) · volteo con ganador propio y ajeno · empate de 2 y de 3 con 5 nombres largos · ronda de desempate donde no participas · azar en la tercera · abandonado que elige solo · 412×915, 915×412 y una tableta.

---

## §E · Armar mesa y sala

### Armar mesa

| Tema | Qué | Tam. |
|---|---|---|
| Chip de 50 | `APUESTAS_PVP` (`salas.js:41`) y `salas.test.js:29, :36`. `ArmarMesa.jsx:282` lo pinta solo | S |
| Fila Entrada y saldo | `REGLA_ASIENTO` fija en 15 (`salas.js:57`). `saldoMinimo`, `alcanza` y `apuestasAlAlcance` pasan a recibir `entrada`. **Una Llena de 100 pide 5.000 y el bono es 2.500:** el aviso a invitados nuevos debe mirar la entrada elegida | M |
| Ritmo | `FilaChips` con Normal y Rápido. No sale fuera de Armar mesa | S |
| CTA y «unirme» | `crearSala` manda 5 parámetros. `buscarCombinacion` (`salasCore.js:132`) añade `entrada`, con la columna de `salas_abiertas` (punto 14). El resumen dice la entrada; el ritmo, no | S |
| Altura | Una fila más en 360×640 y en apaisado: la carcasa anclada ya desplaza las filas | Lámina |

**`memoriaChips.js`: recomiendo recordar el ritmo y NO la entrada.** Es la doctrina escrita en `memoriaChips.js:9-14`: la entrada es lo único de la pantalla que elige cuánto se arriesga. Siempre abre en Corta, que es lo sellado. El ritmo no gasta dinero. `CONFIG_POR_DEFECTO` y `normalizarConfig` (`salasCore.js:180-195`) añaden el campo.

### `SalaOpciones` → `PantallaChips` y el parche

**Hallazgo: pasar `SalaOpciones` a `PantallaChips` no basta para quitar el parche.** `SalaOpciones` ya es `.sal.es-anclada` (`SalaOpciones.jsx:246`). El parche (`salas.css:1247-1290`) ya solo vale para `.sal:not(.es-anclada)`, y eso hoy es **la Sala de espera y el stub** (B4b en ARN-4 Fase 0 `:319`). El stub se va, pero **lo sellado («se quita del todo») obliga a anclar también la Sala de espera**.

| Pieza | Tam. | Nota |
|---|---|---|
| `SalaOpciones` → `PantallaChips` | M | Repite la carcasa a mano (`SalaOpciones.jsx:238-246`). Neutro, lo prueba `diagSAL` |
| Sala de espera anclada y velo fuera de `.sal-cuerpo` | M | Es **la misma obra** que la pasada de 44: el velo y el diálogo viven en el cuerpo y subir la barra los taparía (`tactilLobby.css:18-19` · Configuración v1.5 `:123`). `diagDSK tam` lo vigila |
| Quitar el parche | S | Con las dos anteriores |

### Sala de espera

| Tema | Qué | Tam. |
|---|---|---|
| Mini-perfil | Tocar una silla ocupada abre `MiniPerfil` con `apiRanking`, por portal. La silla ya es cuerpo táctil | S |
| Pasada de 44 | Ver arriba. Se añade `.sal` a `cfg` y sale el hueco de INV-07 | Con la anterior |
| Quien cierra sesión con la mesa en espera | Hoy queda hasta el barrido (`SalaEspera.jsx:682`). `cerrarSesion` (`App.jsx:299`) llama antes a `salir_sala` si hay espera. Devuelve la entrada | S |
| O-1 de CFG-1 1a | Se va con el stub (`salas.css:1270`) | — |
| Textos | `sal.espera.fin.entrar` y su nota, propios de la entrada automática | S |

### El reloj de 3:00 (sin decidir: §P-6)

| Opción | Cómo | Costo | Pro | Contra |
|---|---|---|---|---|
| a · Sigue igual | — | 0 | Nada se toca | El invitado nuevo no llega |
| b · 5:00 en privadas | `expira_en` según el tipo y `DURACION_SALA_SEG`. Atención a `mot1_dinero:533` | S + migración | Lo justo para quien invita por enlace | Más espera si nadie viene (se puede salir) |
| c · «+2 min» del anfitrión | RPC con tope y lámina | M + migración | Lo decide quien sabe | Un botón más |
| d · El enlace avisa al abrirse | RPC sin sesión con límite; alarga la mesa | L | El mejor resultado | Puerta anónima, abuso |

### `data-sin-pantalla-completa`

**Hoy no falta ninguno:** están copiar y compartir (`SalaEspera.jsx:537, :547`), `HojaContenido`, Rankings y SumaMente. Nacen con esta campaña: cualquier enlace del relleno del anuncio. El botón «Te reto» de GEN-1 lo llevará en su campaña.

---

## §F · Publicidad en PvP

### F.1 · Qué existe

| Pieza | Dónde | ¿Sirve? |
|---|---|---|
| Video simulado | `CapaVideo.jsx`, `videoCore.js`, `controlVideo.js`, `video.css` | Los consejos, el isotipo y la barra sí. **El componente, no:** va atado a boleto, premio y pausa (`CapaVideo.jsx:30-73`) |
| «Omitir» a los 5 s | `sumaCore.js:26` · `IntersticialSumaMente.jsx` | La cifra y la forma. Es una pantalla con video real de SumaMente, no una capa sobre la mesa |
| Intersticial contra las IAS | **No existe.** Solo el de Rankings (`App.jsx:826`) | Nada que heredar |
| Normativo viejo | Tienda v1.3 §10.1 (manos 4, 8, 13…, aviso en el óvalo) | **Hay que subir Tienda a v1.4** con lo de hoy |
| Premium | `tiendaCore.js:9-15`, estante `premium` con `pronto` | Gancho |

**Propongo `CapaAnuncio.jsx`** en `trozos.partidaPvP`: consejos e isotipo reutilizados, «Omitir» a los 5 s, cierre al arrancar la mano. M.

### F.2 · La pausa la manda el servidor

| Pieza | Propuesta |
|---|---|
| Quién decide | `llevaAnuncio(mano) = mano % 11 === 5 \|\| mano % 11 === 0`, en `reloj.js`. Da 5, 11, 16, 22, 27, 33, 38, 44 |
| **Cuándo** | Al vencer `mano_siguiente`, **antes de `startHand`**. La fase sigue en `PAYOUT` y la mesa queda en la mano cerrada |
| Sin anuncio si | Quedarían ≤1 asientos con pila ≥ ante: la partida termina sin anuncio |
| Quién lo ve | Vivos, no abandonados, con pila ≥ ante. Premium, no (gancho: `asientos[i].sinAnuncio`, siempre `false`) |
| Quien no llega al ante | Cobra al abrirse la pausa (`liquidar`), no a los 45 s. No cambia dinero: `startHand` ya lo iba a eliminar |
| Vencimiento | `pausa_anuncio`, `ahora + 45 s`. Al vencer o con todos de vuelta: `empezarMano` |
| Vista | `players[i].enAnuncio` |
| Acción | `volver_anuncio` (sexta) |

**Por qué antes de `startHand`:** `manoEnCurso` es falso en `PAYOUT` (`partida.js:303`), así que quien abandona durante la pausa cobra en el acto y no pierde el ante. No se reparte nada que esconder. Y el código de la mano no cambia. Si fuera después del `startHand`, un abandono perdería el ante y la vista ya llevaría sus cartas nuevas (§P-4).

Abandono durante la pausa: sale de `enAnuncio`; si era el último que faltaba, la mano arranca.

Cambio exacto: §O.

### F.3 · Si sigue en el anuncio cuando la mano arranca

**Recomiendo: nada especial.** Es lo que ya dice Tienda v1.3 §10.1 y lo que hace cualquier ausente. Su ante se cobra, y su turno y su descarte corren con el reloj normal: pasa si puede, si no se retira; descarte vacío.

- **Con el anuncio simulado no ocurre:** el cliente cierra la capa en cuanto la vista avanza. Hay unos 5 s o más de barajado y reparto antes del primer turno.
- **Con la red real** el SDK puede no dejarse cerrar. Es el caso del ausente, y entra en la regla del §G.

### F.4 · Dónde viven las piezas

| Pieza | Dónde | Tam. |
|---|---|---|
| «En anuncio» y área opaca | `estadoDeAsiento` + `pvp.css`, las dos vías | S |
| Tarjeta de quien vuelve | Capa en `PartidaPvP`, sobre la mesa. Cuenta atrás de `vencimiento.hora`, frase de gratitud | S |
| Pastilla «Quitar publicidad» | En la tarjeta: contorno dorado y corona. **La corona está reservada a Premium (Tienda v1.3 §5):** encaja | S |
| Estante en la tienda | `tiendaCore.js:9-15`: entrada con `pronto`, junto a Premium | S |
| Mensaje de exclusividad Premium | Solo el gancho | S |

---

## §G · Ausencia y reconexión

### G.1 · Qué pasa hoy

**Confirmado: el reloj resuelve cada turno y nadie queda abandonado por ausencia.**

| Hecho | Cita |
|---|---|
| Turno vencido: `pasar` si es legal; si no, `retirarse` | `partida.js:257-262` |
| Descarte vencido: vacío para quien falte | `partida.js:155-166, :294-295` |
| Elección vencida: posición 0 | `sorteo.js:41` |
| Solo marcan abandono `abandonar` y `abandonarPorServidor` | `partida.js:336, :367-373` |
| Lo reclama cualquier cliente de la mesa | `partidaCliente.js:258-263` |
| Sin nadie conectado no pasa nada. A los 15 min la partida muere y cobra las pilas | `mot1_dinero:1486, :1584` |

**Cuánto cuesta un ausente a los demás (calculado):** sin apuestas, 3 rondas + descarte = **80 s por mano**. Con una apuesta se retira en su turno, unos 20 s. Con Corta tiene 15 antes: **en una mesa de 2, una partida puede tardar muchos minutos** para que el otro gane contra nadie. El presente no tiene otra salida que abandonar.

### G.2 · Opciones para la gracia (sin decidir)

| | A · Sigue en automático | B · Abandono tras N vencimientos | C · Reloj corto para el ausente |
|---|---|---|---|
| Regla | La de hoy, hasta el final | N vencimientos seguidos **que no reclamó él** → abandonado | Tras 2 vencidos, su reloj baja a 8 s hasta que actúe |
| Vuelve a jugar | Siempre | Solo antes de N | Siempre |
| Tiempo de los demás | El peor | Acotado: con N=6, unas 2 manos (cerca de 160 s) | Mejor; hasta 40 s por mano |
| Dinero del ausente | Se desangra por antes | **Cobra su pila y sale:** lo más protegido | Se desangra, más rápido |
| Injusticia posible | Ninguna | Una llamada larga le cuesta el asiento, no el dinero | Volver con poco tiempo para decidir |
| Costo | 0 | S: contador + separar el margen propio del ajeno | S: el vencimiento pasa a depender del asiento |
| Contrato | §6 solo dice la regla | §6 y §4 (`ausente`) | §6 y §4 |

**Cómo distingue B a un ausente de uno que mira y no toca:** el cliente propio reclama en `hora + 300 ms` y los demás más tarde (`hora + 1,5 s`). Si reclama él, está presente, y el contador vuelve a cero. No hace falta latido.

**Recomiendo B con N=6, cifra provisional.** Es la única que protege a la vez el dinero del ausente y el tiempo de los demás. La pérdida es el asiento: nunca fichas. Se ajusta con teléfonos. Encaja con «sin IA que sustituya a nadie».

**Rótulo «Ausente»** desde el 2.º vencimiento seguido: lo ve la mesa y explica la espera.

### G.3 · Qué ve quien vuelve

| Tema | Propuesta |
|---|---|
| Relectura | Ya está: `visibilitychange` → `leer` y `revisar`; `SUBSCRIBED` → `leer`; versión mayor gana (`partidaCliente.js:103, :207-211, :230`) |
| Animaciones | Si la versión salta más de 1, o llevaba oculto más de 2 s, **no se anima:** se pinta el final. Reparto a mitad: `dealStep` al total. Sin vuelo ni celebración si `PAYOUT` ya lleva más de 2 s |
| Cómo se entera | Una línea en el óvalo con `ultimaAccion.porReloj` si fue suyo: «Pasaste por tiempo» o «Te retiraste por tiempo». Nada de historial |
| Abandonado por B, partida terminada, muerta | Pantalla final personal: qué pasó y cuánto cobró |
| Quien tocó ✕ (punto 17) | Se cierra sola: si la vista dice `abandonado`, **no entra** y va al lobby. Solo cliente: `mi_sala` no cambia |
| Sesión caducada | `no_autenticado` hoy deja `detenido` (`partidaCliente.js:169`). Con `getSession` renovando al volver, se relanza una vez. **Sin medir** (cierre §4) |
| Abrir otra mesa | `abandono_pedido`: ya funciona (`mot1_dinero:413`). Falta el aviso «Tienes una partida viva» antes de sentarse |

---

## §H · Ganchos y heredados

| Punto | Dónde va | Tam. |
|---|---|---|
| **AMI-1** | **Ya está:** `partida_asientos (sala_id, asiento, uid)` guarda quiénes se sentaron, sin privilegios de cliente (`mot1_dinero:299-322`). Se conserva tras el fin: solo se borra en cascada si se borra la sala. No se añade tabla; se deja la nota. **Comprobar** que ninguna limpieza borre salas viejas (no encontré ninguna) | S |
| **GEN-1 «Te reto»** | `?sala=` ya sienta solo: `consumirSalaPendiente` + un intento en `SalaOpciones` (`App.jsx:606-617`). Faltan: el reloj de 3:00 (§P-6), y que un bono de 2.500 solo alcance la Corta de 50 y 100 y la Llena de 50. Nada que construir aquí | S |
| **«Mano actual · Humanos 500»** | `consultar_mano` con rama PvP: mesa en `partida_asientos` sin cobrar, `p_mano` = `handCount` del estado (cierra el hueco de INV-75), precio `'humanos'`. `ultima_mesa` no tiene FK (`cfg1e:66`). Cliente: `mesaServidor = partida?.mesa`, `nivel='humanos'`. Guion nuevo | M + migración |
| **Encender los puntos** | `select public.interruptor_puntos_humanos(true)` en el SQL Editor (`mot1_dinero:1090`). En el cliente, `puntosDeMano` con `origen: 'humanos'` (`GameTable.jsx:522`, `puntos.js:57`). **Prueba:** una mano con dos teléfonos, una fila en `libro_puntos` y el ranking al día. Nada más | S |
| **Tapete propio y reverso** | El tapete sale gratis (`:627`). `tapetes` se pasa como contra las IAS (`App.jsx:1062`). Reverso: prop `reversoDe(seat)` con el gratis por defecto; ni columna ni pantalla | S |
| **INV-76** | **Sí se abre una puerta** si «Quitar publicidad» navega a la tienda en plena partida: desde ahí se compra. Recomiendo la guarda en `comprar_articulo` con partida PvP viva, más la vuelta a la mesa (§P-7) | S + migración |
| **Frases hechas y Reacciones** | **Hoy las Reacciones son solo locales** (`useReacciones.js:81`): en PvP serían una burbuja que nadie más ve. Exigen viajar: política `insert` en `realtime.messages` limitada a miembros con evento `reaccion` e id de frase, o evento por la función. Son 12 frases en español (`reacciones.js`), y los cinco idiomas son otra obra. **Costo: M (unos 60 min) + migración + cambio del §5 del contrato.** Decide la lámina. **Si no van, se oculta la entrada del ⋮:** S | M o S |
| **Comentario sin dueño** | `eliminar_cuenta/index.ts:25`, en el primer commit | S |
| **Sesión de victoria** | «Manos ganadas» y los puntos viven en `useSesion`, en memoria: se pierden al recargar. Propongo aceptarlo y anotarlo | — |

---

## §I · Pruebas y varas

### I.1 · Lo que vigila hoy la mesa y lo que debe pasar la PvP

| Modo | Vigila | Control IAS | PvP |
|---|---|---|---|
| `humo` (`d1d2, d3, bug, shots, gate`) | Pantallas y entrada | Sí | Cada sub-tanda |
| Semillas de `apu`, `u3` y `msg` | Consumo de azar, voz | **Sí: es la prueba de «ni una tirada»** | No aplica |
| `congelado` · `rec` · `revive` · `mesaia` · `vc` · `vuelo` · `luz` · `rev` | Conducta contra las IAS | Sí, tras tocar `GameTable` | `vc` y `vuelo` en subconjunto |
| `tab` · `webkit` | Escala, tableta, Apple | Sí | Sí, en subconjunto |
| `o1 · a1 · h1 · m1 · f1 · z1 · tactil · p1 · p2` | Geometría | Sí, al cierre | Su **medida**, dentro de `pvp`: no se duplican |
| `cfg · tam · tienda · rnk` | Pantallas | Las que se toquen | `diagSAL` + `tam` para la sala anclada |
| `testVoz3 · testNivel1 · testProtegidos · testEntradaLigera · testInvariantes` | Voz, IA, huellas, peso, registro | Siempre | — |

### I.2 · El mínimo para probar sin servidor

**Un árbitro imitado, no vistas escritas a mano.** `src/dev/partidaImitada.js`: la misma forma que `crearClientePartida`, con el **árbitro real** en memoria, semilla por `setRng` y rivales de guion. Puerta doble DEV + bypass, como `?sal=` (`salasFixtures.js:13-22`), y `testDistSinMoldes` lo saca de `dist/`.

- **`?pvp=<escena>`:** juega hasta el punto pedido y se queda. Escenas: `sorteo-baraja`, `sorteo-oleadas`, `sorteo-eleccion`, `sorteo-empate-2/3`, `sorteo-azar`, `turno-propio`, `turno-ajeno`, `descarte-espera`, `reposicion`, `revelacion`, `retirada`, `anuncio-yo`, `anuncio-vuelta`, `ausente`, `abandono`, `final-gana`, `final-pierde`, `final-fuera`, `muerta`. Con `&n=2..5&asiento=k&nombres=largo`.
- **Por qué no JSON fijo:** las coreografías nacen de transiciones, y una vista suelta no las produce. Unas 150 líneas, y no puede desviarse del contrato porque es el contrato.
- **Modo nuevo `diagDSK pvp`:** rotación por asiento, O1, piso de 40, tinta, 15 «W», ⟦ sin clave, `data-clavada`, y `mesas 2..5` × 412×915, 915×412, 1366×768, 1920×1080, iPad. Tope 25 min, partido por mesas si no cabe.
- **Vitest (sin DOM, como todo aquí):** `vistaAMesa` con partidas completas al azar del árbitro real. Propiedades: la rotación se deshace, `lecturaDeMano(adaptada).principal === resultado.ganador`, las capas suman el pozo, ningún secreto.

### I.3 · Dinero y guiones

| Vara | Estado | ¿Nueva? |
|---|---|---|
| `arbitro.test.js`, `esperas.test.js`, `testFuncionPartida`, Grupos de `mot1_*` por `npm run guiones` | Vivas | Se amplían con la pausa, la reposición y la ausencia |
| Guion `salas_abiertas` + entrada | — | Sí, corto |
| Guion `consultar_mano` PvP | Extiende `cfg1e_verificacion.sql` | Sí |
| Guion `comprar_articulo` con partida viva | Extiende `tie1a_verificacion.sql` | Sí, si se aprueba §P-7 |
| Interruptor de puntos | Grupo ya en `mot1_dinero:1760-1769` | No |

**El cambio del árbitro no lleva SQL:** `guardar_jugada` guarda JSON (`nucleo.js:204-216`) y la clase vive en el estado. Basta `functions deploy`. **La concurrencia real** sigue sin medir por PGlite: con 4 y 5 teléfonos es la primera vez (cierre §4).

### I.4 · Aparatos

| Sub-tanda | Qué prueba Victor | Aparatos y cuentas |
|---|---|---|
| 1 | Nada: el panel `?mot1` sigue vivo; una partida de 2 tras el `deploy` | 2 |
| 3 | Mesa real 2 y 3: mano entera, voz, reloj, final, una por quiebra | 3 aparatos, 3 cuentas |
| 5 | Sorteo con empates; manos 5 y 11 con anuncio (mandar 6 manos); volver antes y tope de 45 s | 3 |
| 6 | Apagar pantalla >30 s, cerrar la app, sin red, ausencia de N; partida muerta (espera real de 15 min) | 2 |
| 7 | Armar: Llena, Rápido, chip de 50; sala rotada; mini-perfil | 3 |
| 8 | Mano actual pagada, puntos encendidos, cifras finales | 2–3 |
| 9 | **4 y 5 en una sesión:** PC con segunda sesión, cuentas `+borrar` con `ajuste_admin`; concurrencia, volumen de avisos. **iPhone y Safari** si hay aparato | 5 sesiones |

---

## §J · CLI de Supabase v3

| | |
|---|---|
| Instalada | **2.122.1**, fija en `package.json:35` |
| Última 2.x | `v2.stable` = **2.122.1**: ya estamos en ella |
| Última v3 | `latest` = **3.0.0**, publicada el 2026-11-02 (`next` 3.1.0-next.1) |

| Comando | En v3 |
|---|---|
| `db push --linked` | Sigue funcionando, con aviso; `--linked` se retira en v4. **`db push` a secas ahora va a la base local y «nunca toca tu proyecto».** Pide confirmación y Enter es No; sin terminal exige `--yes` |
| `functions deploy <nombre> --use-api` | Sigue yendo al proyecto enlazado, y pide confirmación. **La guía no menciona `--use-api` en `deploy`** (solo en `functions download`): sin comprobar con `--help`, y la ficha no permite instalar v3 |
| `migration list` | Por defecto local; usar `--remote`. `--linked` avisa |
| `config.toml` | Sin `[inbucket]` ni `orioledb`: se carga |

**Veredicto: no hace falta actualizar en MES-PvP. Se actualiza después del cierre, en una tanda aparte.**

| Opción | Riesgo |
|---|---|
| Antes de la primera migración | Una versión mayor con 3 días; cambia el destino por defecto en plena campaña y toda ficha o memoria dice `--linked`. Una orden sin bandera parecería funcionar y no aplicaría nada |
| Durante | El peor: cambia a mitad de los `db push` |
| **Después del cierre (recomendado)** | Casi ninguno: v2 sigue recibiendo arreglos de seguridad, sin fecha de fin. Solo seguir sin `@latest`: `npm install supabase` a secas instalaría v3 |

Fuentes: [notas de la v3.0.0](https://github.com/supabase/cli/releases/tag/v3.0.0) · [guía de migración a v3](https://supabase.com/docs/guides/local-development/cli/migrating-to-v3).

---

## §K · Peso

**Hoy:** 176,8 KiB; tope 200 (INV-30). Margen: 23,2.

| Qué podría arrastrar | Vigila | Cómo evitarlo |
|---|---|---|
| Un `import` estático en `App.jsx` de `useMesaPvP`, `vistaAMesa`, `CapaAnuncio` o `partidaCliente` | `testEntradaLigera` + `1.8b` | Añadir los módulos nuevos y `pvp.css` a la lista del guardián, en el commit que los crea |
| `GameTable` importado sin pasar por `trozoMesa` | `testEntradaLigera.test.js:41` | `PartidaPvP` lo pide por `cargarMesa`. **El orden del CSS** también lo pide: PES-1 ya lo sufrió, y `PartidaPvP.jsx:2` carga `salas.css` |
| `App.jsx` con lógica de arrancar PvP | `1.8b` | Va al trozo |
| **Textos en `textos.es.js`** (viaja en la entrada) | `1.8b` | Unas 40 claves: **hasta 3 KiB (estimado)**. Cabe. Reacciones añadiría poco |
| `salas.js` con la tabla de entradas | `1.8b` | Mínimo |
| El árbitro imitado | `testDistSinMoldes` | Puerta doble e `import()` dentro de ella |
| **A favor:** se va el panel (`esLegal` y `costoDe` en el trozo; `panelMot1.css`) | | |

---

## §L · Dos comprobaciones documentales

**Motivos:** **coincide.** Las once filas de Reglas v1.5 §3.2 (`:159-169`) tienen el mismo literal, constante y orden que `pozos.js:28-40`.

**Fila E-4.** Está en `docs/AJILEI_Protegidos_v1.0.md:317`, no en `:306`, porque el documento creció. Hoy dice:

```
| 1b-ii | estado base / `pot` | **E-4** · §4.2 — el pozo deja de ser escalar | forma decidida por el rector antes de 1b |
```

Texto propuesto:

```
| 1b-ii | estado base / `pot` | **E-4** · §4.2 — el pozo sigue siendo un entero (`state.pot`) y las capas no se guardan: las deriva `pozos.capasDe` (Reglas v1.5 §4.3) | forma decidida por el rector antes de 1b |
```

---

## §M · Riesgos

| # | Riesgo | Afecta | Mitigación |
|---|---|---|---|
| R-1 | Una guarda mal puesta cambia una tirada contra las IAS | Mesa IAS | Sin hooks nuevos en medio; semillas `apu`, `u3` y `msg` en el mismo commit. Rojo = STOP |
| R-2 | `react-hooks` se rinde con `GameTable` sin avisar (`:1401-1404, :1642-1650`) | Mesa IAS | Lint contra cero. Una vara que baja sola se va a mirar |
| R-3 | El descarte y la ceremonia se comen el reloj | Partida | Vencimientos nuevos (§O) |
| R-4 | Un `deploy` de la función con partidas vivas: estados sin campos nuevos | Dinero | Campos con valor por defecto al leer; desplegar antes del cliente |
| R-5 | Cliente publicado y función desacompasados: Victor hace push, y `deploy` es otro paso | Partida | Orden fijo: función, luego cliente. Las acciones viejas siguen valiendo |
| R-6 | Concurrencia real con 4 y 5: `INTENTOS_SIMULTANEAS = 5`, y los anuncios se suman a las fases simultáneas | Dinero | `clave_idem` protege; sesión de 5 al cierre. Un `version_vieja` no mueve dinero |
| R-7 | Volumen de llamadas y avisos con 5 | Bus y costo | Escalonar y medir (B.10). Gatillo de Ably: sin dispararse hoy, se mira con datos |
| R-8 | Reloj del teléfono desfasado | Partida | `ahora` en la respuesta |
| R-9 | Nombres de 15 «W» en la crónica y en las sillas; las hojas son protegidas | Pantalla | Se mide en lámina y `pvp`; se recorta en la voz |
| R-10 | Peso de entrada y orden del CSS | Peso | §K |
| R-11 | iPhone sigue sin prueba de punta a punta | Partida | Aparato al cierre. Si no hay, se dice |
| R-12 | Quien se queda solo en mesa de 2 con un ausente | Partida | §G |

---

## §N · Propuesta de sub-tandas

Minutos de Claude Code: estimación. **Una lámina de la mesa, sobre la mesa real, y una corta de Armar mesa y la sala.**

| # | Sub-tanda | Contenido | Min. | Lámina | Victor |
|---|---|---|---:|---|---|
| 0 | **Documental** | Reglas v1.5 entra · E-4 · Contrato v1.1 · Tienda v1.4 · Protegidos si cambia · comentario sin dueño | 20–30 | — | Visto bueno y push |
| 1 | **Árbitro v1.1** | §O entero: acción sexta, 4 vencimientos, campos, `ahora` y pruebas. El panel sigue para probar | 120–180 | — | `functions deploy`, 2 teléfonos |
| 2 | **Puente sin pantalla** | `vistaAMesa`, `useMesaPvP`, `vozHumanos`, árbitro imitado, propiedades | 90–120 | — | — |
| 3 | **La mesa viva** | Guardas de `GameTable`, reparto, descarte, revelación, reloj, final básico, entrar solo, fuera el panel y el stub, `diagDSK pvp`. Sorteo en forma mínima | 180–240 | — | Mesas de 2 y 3. **Desde aquí se juega de verdad** |
| 4 | **Lámina de la mesa** | Sobre la mesa real: sorteo (§D), pausa, ausencia, finales, «Tú» frente a nombre, nombres largos, mesa de 5, Reacciones sí o no | 90–120 | **L-M** | Mira y decide |
| 5 | **Ceremonia y pausa** | Sorteo completo, `CapaAnuncio`, tarjeta, «En anuncio», estante, guarda de compra | 120–180 | De L-M | `db push` y guion, 3 aparatos |
| 6 | **Ausencia y vuelta** | Regla de §P-1, lo que ve quien vuelve, muerta, punto 17, canal caído | 60–90 | De L-M | Apagar, cerrar, sin red |
| 7 | **Armar y sala** | Entrada, 50, ritmo, `salas_abiertas`, `PantallaChips`, sala anclada, fuera el parche, antihorario, mini-perfil, 44, 3:00, cerrar sesión | 150–210 | **L-A, corta** | Mira, `db push` y guion, 3 aparatos |
| 8 | **Ganchos y encendido** | Mano actual, Reacciones o su entrada, reverso, cifras de los teléfonos, **puntos encendidos** | 90–120 | — | `db push`, guion, interruptor, 2–3 aparatos |
| 9 | **Cierre** | Invariantes, varas, informe; sesión de 5 | 45–60 | — | 5 sesiones; `completo` |

**El orden tiene dos razones.** La campaña sigue la dependencia: árbitro, puente, mesa. Y la mesa real sale en la sub-tanda 3, no al final: el problema de producción del punto 8 se cierra pronto y las láminas se hacen sobre lo verdadero. Armar mesa va después porque la mesa funciona con lo que crea el cliente de hoy (Corta y Normal).

**Dos commits sensibles:** la sub-tanda 3 toca `GameTable` y lleva el control completo de IAS (`commit` + `apu`, `msg`, `congelado`, `rec`, `tab`) antes de publicar.

---

## §O · Contrato v1.1: los cambios exactos

### Acciones (§2 y §3)

| Sección | Cambio |
|---|---|
| §2, cabecera | «Lista cerrada de **seis** acciones. Una séptima exige cambiar este contrato» |
| §2, comprobación 5 | «No se aplica a `elegir_carta_sorteo`, `descartar` **ni `volver_anuncio`**» |
| §2, versión en fases simultáneas | Añadir: «`volver_anuncio` lleva `mano`; si no es la de la pausa abierta, `fase`» |
| §2, sección nueva | Abajo |
| §2, respuesta | `{ ok: true, version, ahora }` o `{ ok: false, motivo, version, ahora }`. `ahora`: hora del servidor en ms, solo para el desfase |
| §3, tabla B | `ya_volvio`: el asiento ya volvió del anuncio (`volver_anuncio`). `no_participa` se amplía a `volver_anuncio`. `version_vieja` no aplica |

```
### `volver_anuncio`
| Campos        | `mano`: el `handCount` de la mano que acaba de cerrar |
| Precondiciones| Pausa de anuncio abierta · `mano` es la de la pausa · el asiento está en `enAnuncio` |
| Efecto        | Saca el asiento de `enAnuncio`. Si no queda nadie, cierra la pausa y arranca la mano (§6) |
| Motivos       | `fase` · `no_participa` · `ya_volvio` |
```

### Vista (§4)

| Campo nuevo | Qué ve | Para qué |
|---|---|---|
| `players[i].contribMano` | Todos | `lecturaDeMano`, `capasDe`, `finDeMano` |
| `players[i].enAnuncio` | Todos | Rótulo y si te toca el anuncio |
| `players[i].ausente` | Todos | Según §P-1 |
| `ultimaAccion` | `{ asiento, tipo, puesto, apuestaAntes, apuestaDespues, porReloj }`, o `null`. Solo acciones de apuesta | Voz y sonido: K-12 se mantiene, sale un dato y no una frase |
| `sorteo.rondas[].volteo[].posicion` | Todos, tras el volteo | Qué carta girar |

Tabla de secretos: sin cambios. Lo nuevo es público o sale del volteo.

### Vencimientos (§6)

| Clase | Empieza | Dura | Al vencer |
|---|---|---|---|
| **`barajado_sorteo`** (nueva) | Abre cada ronda, también la primera | `BARAJADO_MS` | `reparto_sorteo` |
| **`volteo_sorteo`** (en el código, `reloj.js:15`, falta en la tabla) | Voltean | 3 s provisional; **propongo 4 s** | Mano fijada o ronda nueva |
| **`reposicion`** (nueva) | Se aplica el descarte | `esperaReposicion(cuantas)`, según §P-3; con nadie descartando, 600 ms | Abre `BET_3` y su turno |
| **`aviso_salida`** (nueva) | `startHand` deja eliminados nuevos | 4.750 ms; **propongo 3 s** | `barajado` |
| **`pausa_anuncio`** (nueva) | Vence `mano_siguiente` con `llevaAnuncio` y más de un asiento que siga | 45 s, o todos de vuelta | `empezarMano` |

| Sección | Otro cambio |
|---|---|
| §6, el sorteo | Fila «Antes de cada ronda: barajado, una sola velocidad» |
| §6, ritmo | «Qué no escala»: añadir la reposición y el aviso de salida |
| §6, esperas base | `MANO_SIGUIENTE`: **candidato con revelación 6.000 + 2.000 ms** (la red de la celebración más la lectura; hoy 960 + 4.000), y sin revelación 4.000. Se cierran con teléfonos. **Partida muerta, 15 min:** se confirma o cambia con la sesión 6 |
| §6, sección nueva «Publicidad» | `llevaAnuncio(mano) = mano % 11 ∈ {5, 0}`; quién lo ve, cuándo y qué pasa a los 45 s (§F) |
| §6, reloj | Reemplaza «Gracia: MES-PvP» por la regla de §P-1 |
| §7 | «Quien no cubre el ante al abrirse la pausa cobra en ese momento». Abandono en pausa: «sin mano en curso». Puntos: encendidos |
| §5 | Solo si van las Reacciones: evento `reaccion` con id de frase. «El payload es solo la versión» se refiere al aviso |
| §1 | Nota: la rotación por cliente vive en el adaptador (ya es «fuera de `seatLayouts.js`») |
| §9, §11 | Cada fila de MES-PvP pasa a su sub-tanda |

---

## §P · Preguntas al rector

| # | Pregunta | Recomendación y porqué |
|---|---|---|
| P-1 | Gracia: ¿A, B o C (§G.2)? | **B, N=6 provisional.** Protege a la vez el dinero del ausente y el tiempo de los demás. Solo se pierde el asiento |
| P-2 | ¿Se sella el corte de un prop `partida`, con unas 15 guardas? | **Sí.** Es lo único que mantiene «la misma mesa» sin mover hooks portantes |
| P-3 | El descarte necesita una espera. ¿La animación sigue en secuencia (hasta 15,9 s) o va en paralelo en PvP (unos 4 s)? | **En paralelo.** Quince segundos es demasiado entre personas que ya descartaron. Cambia cómo se ve frente a las IAS: la lámina lo enseña |
| P-4 | ¿La pausa de anuncio va antes de `startHand`? | **Sí.** Abandonar no cuesta el ante, no hay cartas nuevas en la vista y el código de la mano no cambia |
| P-5 | Sin fichas y con la mesa viva: ¿espectador o pantalla final? | **Pantalla final, sin espectador.** El layout no admite el asiento propio eliminado y `seatLayouts.js` es protegido. Mirar es un añadido, no lo justo |
| P-6 | El reloj de 3:00 (§E) | **b, 5:00 en privadas.** Es una cifra y una migración, y resuelve el caso del enlace. Lo demás, con datos |
| P-7 | Lo sellado lleva «Quitar publicidad» a la tienda desde la mesa. ¿Se navega de verdad? | **Sí, con guarda en `comprar_articulo` y vuelta a la mesa.** Cumple lo sellado e INV-76, en S. El jugador deja la mesa y su reloj sigue. Si se prefiere, un «Pronto» en el sitio evita la migración |

---

## §Q · Estimación total

| Concepto | Cifra |
|---|---|
| **Claude Code** (sub-tandas 0–9) | **965–1.350 min: unas 16–22 h** |
| Láminas que mira Victor | 2, con sus vueltas: no se comprime |
| Pruebas con teléfonos | 6 sesiones, de unos 30–45 min; la de ausencia incluye 15 min de partida muerta |
| Sesión de cierre | 5 sesiones en casa, con cuentas `+borrar` |
| Migraciones con `db push` y guion | 3–4: sub-tanda 5 (si se aprueba P-7), 7, 8 y, si van Reacciones, otra |
| `functions deploy` | 2–3: sub-tandas 1, 6 y quizá 8 |
| `varas completo` | Una al cierre, **unas 6 h 25 min** (línea base de ARN-4) |

**La estimación es más alta que la de MOT-1 (7–10 h) por la mesa y las dos pantallas.** Lo más incierto es la sub-tanda 3. Si se aprueban P-1 a P-5, no veo otra decisión de producto que pueda moverla.

---

## Lo que no se vio

- **La medida en pantalla** de nombres largos, cortes de reparto y `.opp-status`: va a la sub-tanda 3 y a la lámina.
- **`--use-api` en v3:** requiere instalarla; solo importa al actualizar.
- **Tiempo de la sonda:** unos 15 min de reloj, frente al tope de 75.
