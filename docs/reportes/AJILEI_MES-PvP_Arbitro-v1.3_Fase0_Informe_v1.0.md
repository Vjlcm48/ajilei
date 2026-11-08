# AJILEI · MES-PvP · Árbitro v1.3 · Fase 0 (sonda) · Informe · v1.0

- **Ficha:** `AJILEI_MES-PvP_Arbitro-v1.3_Fase0_v1.0.md`. Sonda de solo lectura. No hay commits, ni deploy, ni migraciones, ni consultas a la nube.
- **Árbol:** `main` en `efd4c33`, `origin/main` en `ac96f51` y `respaldo-mes-pvp` en `efd4c33` (`git ls-remote`). Hay un solo worktree, el de la raíz. La CLI de Supabase va por la `2.122.1`.
- **Al empezar, `git status`:** solo estaban sin seguimiento `docs/AJILEI_APU-1_Reglas_v1.9.md` y `laminas/lm1/`, `lm2/` y `lm3/`. No había ningún archivo rastreado modificado.
- **Citas:** todas `archivo:línea` del árbol `efd4c33`. Las migraciones usan las abreviaturas del Contrato, más **`esq`** = `20261104150000_mot1_esquema.sql` y **`din`** = `20261104170000_mot1_dinero.sql`.

**En tres líneas.**
- Ningún punto obliga a abrir un protegido. El asiento **sentado fuera de la mano** se resuelve en la capa del árbitro, que ya edita el estado del motor así (`partida.js:98`, `:108`, `:453-456`).
- El push lo bloquean **tres tiempos**: el reparto del sorteo, el volteo y la reposición. La reposición uno a uno **aún no existe en el cliente**: la mesa PvP sigue reponiendo en paralelo (`GameTable.jsx:1670-1724`).
- La recarga cabe en **una migración y un deploy**. Para eso, la migración tiene que ir **antes** que el deploy, porque hoy `aplicar_efectos` lanza ante un efecto desconocido (`din:1365-1366`).

---

## A · Documentos

### A1 · El Contrato

- **Cabecera:** `docs/AJILEI_MOT-1_Contrato_v1.0.md:1` dice **v1.2** ✔. El nombre del archivo sigue siendo v1.0 y la versión va en la cabecera.
- **Lo que tocará la v1.3, por sección:**

| § | Cambio |
|---|---|
| Cabecera | Una línea «Al día con MES-PvP, árbitro v1.3» y la base nueva de las citas |
| §2 | La lista cerrada de seis acciones (`:70`) pasa a nueve: `recargar`, `pedir_recarga` y `anular_recarga`. `mensaje` se describe aparte, fuera de la lista del árbitro. Las nuevas simultáneas se validan contra `mano` y no contra la versión (`:90`) |
| §3 B | Motivos nuevos (D3 y E4) |
| §4 | Vista: la marca pública de recarga por asiento, el bloque privado de la recarga, `eliminated: false` en quien está sentado fuera, y las **posiciones elegidas** en la elección del sorteo (G) |
| §5 | La excepción del mensaje en el canal (E2) y el lugar del freno |
| §6 | El reparto del sorteo según los participantes, el volteo de 5 s, la reposición uno a uno, la clase nueva de la oferta, que la oferta no cuenta para la ausencia, la pausa de anuncio con una oferta abierta y la tabla de las esperas base |
| §7 | El movimiento `recarga_pvp`, el cuadre de la mesa con las recargas, el resultado `cobrado − (entrada + recargas)` y lo que pasa al abandonar con un pedido o una oferta abiertos |
| §8 y §9 | Las K y los heredados que nazcan aquí |

### A2 · Las Reglas v1.9 al byte

- **Resultado: 33 de 33 ✔ y ningún ✘.**
- **Método:** cada texto se buscó literal con node y, en las plantillas, se compararon los puntos de código.
  - Los dos lados están en NFC.
  - No hay espacios duros ni comillas tipográficas.
  - «…» es U+2026 en los dos lados y «·» es U+00B7.

| § | Texto | Dónde | |
|---|---|---|---|
| 8.1 | «Recargar» (burbuja y botón) | `src/config/textos.es.js:455` | ✔ |
| 8.1 | «Recargar {monto} HC para seguir en la mesa. Te quedarán {saldo} HC.» | `src/config/textos.pvp.es.js:48` | ✔ |
| 8.1 | «Recargar {monto} HC para volver a {entrada} HC. Te quedarán {saldo} HC.» | `textos.pvp.es.js:46` | ✔ |
| 8.1 | «Ahora no» | `textos.pvp.es.js:51` | ✔ |
| 8.1 | «Tu saldo no alcanza para recargar.» | `textos.pvp.es.js:52` | ✔ |
| 8.1 | «Recargando» | `textos.pvp.es.js:53` | ✔ |
| 8.1 | «Fuera de esta mano» | `textos.pvp.es.js:54` | ✔ |
| 8.1 | «Esperando a {nombre}…» | `textos.pvp.es.js:56` | ✔ |
| 8.2 | «Ausente» | `textos.pvp.es.js:11` | ✔ |
| 8.2 | «1 turno más y saldrás de la mesa» | `textos.pvp.es.js:43` | ✔ |
| 8.2 | «{nombre} abandonó la mesa.» y «… La partida termina.» | `textos.pvp.es.js:33-34` | ✔ |
| 8.3 | «Saliste de la mesa» · «Te quedaste sin fichas» · «Te quedaste solo en la mesa» | `textos.pvp.es.js:37-39` | ✔ |
| 8.3 | «¡Qué molleja! Arrasaste con la mesa.» | `src/config/frasesVictoria.js:22` | ✔ |
| 8.3 | «0 Heptacoins» | `textos.pvp.es.js:40` y `src/hooks/vozHumanos.js:152` | ✔ |
| 8.4 | Los cuatro textos | `src/lib/sorteoMesaCore.js:56-59` | ✔ |
| 8.4 | «Tú» | `GameTable.jsx:2653` y `src/hooks/cronicaCore.js:205` | ✔ |
| 8.5 | «Mano {n} · Es Mano {nombre}» · «Mano {n} · Eres Mano» · «Mano {n} · Es Mano IA {k}» | `src/lib/transicionCore.js:27-28` | ✔ |
| 8.6 | «Omitir» | `textos.es.js:612` | ✔ |
| 8.6 | «{nombre} sigue en el anuncio» · «{N} jugadores siguen en el anuncio» · la frase de la publicidad · «Quitar publicidad» · «Premium · Pronto» | `textos.pvp.es.js:58-62` | ✔ |

- **Matices que no cuentan como ✘:**
  - En el código, los placeholders se llaman `{n}` donde las Reglas dicen `{N}` (§8.4 y §8.6). El texto que se ve es el mismo.
  - En la mesa de 2 contra las IAS, el rival se llama «IA», sin número (`src/engine/entrada.js:110`). La pastilla dice entonces «Mano 7 · Es Mano IA», y las Reglas solo dan la forma con `{k}`.

### A3 · La pausa de anuncio del árbitro real ✔

- `llevaAnuncio(mano)` vale `mano % 11 ∈ {5, 0}` (`src/arbitro/reloj.js:48`) y se evalúa con la mano que acaba de cerrarse, al vencer la mano siguiente (`partida.js:218-223`).
  - Eso da las manos 5, 11, 16, 22, 27, 33, 38 y 44, es decir, **antes de las 6, 12, 17, 23, 28, 34, 39 y 45** ✔.
- El tope es `PAUSA_ANUNCIO_MS = 45000` (`src/config/esperas.js:47`) ✔.
- El árbitro añade una condición que §8.6 no dice: la pausa solo se abre si siguen más de uno y al menos uno ve el anuncio (`partida.js:221-222`). El Contrato sí la recoge (§6, «Publicidad»).

---

## B · La tabla de tiempos

- **Cómo avanza el tiempo.** El árbitro guarda un solo vencimiento, y cualquier cliente lo reclama con `reclamar_vencimiento` a la hora del servidor más un margen de `300 + 200·asiento` ms (`src/lib/partidaCliente.js:42-43`, `:286-291`).
- **Notación.**
  - P son los participantes de la ronda y V los vivos de la mano.
  - f es el factor del ritmo: 1 en Normal y 0,5 en Rápido.
  - El cliente nuevo es `efd4c33`.

| Escena | Árbitro real hoy | Cliente nuevo | Diferencia | v1.3 |
|---|---|---|---|---|
| Arranque (sala activa → primer reparto del sorteo) | `crear_partida` abre `barajado_sorteo` de **1.950 ms** desde la hora del servidor (`partida.js:647`) | «Arrancando la partida…» hasta que llegan la vista y el trozo de la mesa (`PartidaPvP.jsx:134`, `:143`). Luego el barajado, con lo que quede de esos 1.950 ms | Sin medir. Se estima que se come entre 0,5 y 1,5 s del barajado (ida y vuelta de la función, lectura y carga del trozo) | Sin cambio en el v1.3. **Se mide en la sub-tanda 5**, antes de quitar «Arrancando» |
| **Reparto del sorteo, ronda 1** | **2.008 ms fijos**: 5 oleadas (`reloj.js:52`) | `120 + 5·P·297,5 + 400` (`sorteoMesaCore.js:20-22`): **P=2 3.495 · P=3 4.983 · P=4 6.470 · P=5 7.958** | **+1.487 · +2.975 · +4.462 · +5.950 ms** | `esperaRepartoSorteo(participan.length)` |
| **Reparto del sorteo, desempate** | 2.008 ms | La misma fórmula con P = empatados: 3.495 (2), 4.983 (3), 6.470 (4) | +1.487 a +4.462 ms | La misma |
| **Volteo** | **4.000 ms** (`esperas.js:30`) | 4.000 en producción (`SorteoMesa.jsx:65` lee la misma constante). La lámina usa 5.000 (`partidaImitada.js:187`) | **+1.000** (sellado) | `VOLTEO_SORTEO_MS = 5000` en `esperas.js`. Cambia a la vez el árbitro y el cliente |
| Vuelta de las cartas al mazo entre rondas | Dentro del volteo, y luego `barajado_sorteo` de 1.950 (`partida.js:312`) | Las elegidas vuelven en el último segundo del volteo (`sorteoMesaCore.js:27`, `:120`) | 0 | Sin cambio |
| Barajado | 1.950 | 1.950 | 0 | Sin cambio |
| Reparto de cada mano | `120 + 2V·595·f + 400`. El segundo, `120 + 3V'·595·f + 2000·f` (`reloj.js:36-37`) | Lo mismo (`esperas.test.js:47-50` ancla las dos copias) | 0 | Sin cambio |
| **Reposición** | **En paralelo:** `120 + mayor·595 + 400`, o 600 si nadie descartó (`reloj.js:43-45`) | **También en paralelo**: unos 1.100 ms con una carta (`GameTable.jsx:1670-1724`). **La uno a uno no está construida** | Hoy, 0. **Con la uno a uno**, mucho más: ver abajo | `esperaReposicion(plan, ritmo)`, con la secuencia de las IAS (C) |
| Revelación y pago con vuelo de fichas | 6.000 + 2.000 (`reloj.js:38-40`) | La celebración, con tope de red de 6 s, y la lectura | 0 | Sin cambio |
| Pago sin revelación | 4.000 | 4.000 | 0 | Sin cambio |
| Pausa entre manos con la transición de §8.5 | 4.000 / 8.000 | La recogida empieza 380 ms antes de vencer. Medido entre 389 y 412 ms (informe LM-3 §2) | 0 | Sin cambio |
| Aviso de salida | 3.000 | Usa el mismo vencimiento | 0 | Sin cambio |
| Aviso de ausencia | No depende de un tiempo: cuenta vencimientos (`partida.js:117-124`) | — | 0 | Sin cambio |
| **Oferta de recarga en retención** (nueva) | No existe | La lámina espera hasta 15 s más en la mesa de 2 (`partidaImitada.js:397`, `:888`) | — | Clase nueva `oferta_recarga` (D8) |

- **La reposición uno a uno, en cifras.** Son la secuencia de las IAS (`GameTable.jsx:263-269`, `:1637-1658`) con `AI_SPEED_FACTOR` 1,25, en orden de Mano a Pie y solo con los no retirados:
  - **`R = 100 + Σ por asiento [n=0 → 750 ; n≥1 → 2.175 + 412,5·(n−1)] + 500`** ms. Los 500 finales son el margen del volteo propio (`:1656`).
  - Mesa de 2, cada uno descarta 1: **4.950** frente a 1.115 de hoy.
  - Mesa de 5, nadie descarta: **4.350** frente a 600.
  - Mesa de 5, cada uno descarta 2: **13.538** frente a 1.710.
  - El orden y la velocidad que pidió Victor cuestan entre 3 y 12 s por mano. Es una consecuencia de lo sellado, no un defecto.
  - Lo que Rápido escala de ahí no está definido (§P-4).
- **Lo que se ve hoy con el sorteo** (más preciso que el relevo):
  - El árbitro abre la elección a los 2.008 ms. La capa toma la etapa de la vista (`SorteoMesa.jsx:68`, `:116-117`): las cartas aún no repartidas **saltan a su hueco** y el reloj de 10 s arranca ya.
  - El reloj no se come segundos, pero el reparto **se corta** a mitad: en la mesa de 5 se ven unas 7 de 25 cartas.
  - Para el push el bloqueo es el mismo.

### ¿Una sola fuente para las fórmulas?

- **El árbitro no puede importar `sorteoMesaCore.js`:**
  - importa `./escala` y `../config/esperas` sin `.js` (`sorteoMesaCore.js:5-6`), y la función solo resuelve especificadores con `.js` (`src/arbitro/index.js:6-7`);
  - además toca `document` y `window`;
  - INV-84 tampoco deja que el cliente importe `src/arbitro/`.
- **Recomendación:** que la fórmula viva en **`src/config/esperas.js`**, que ya leen los dos lados y no depende de nada (`esperas.js:1-10`): `PASO_SORTEO_MS`, `CARTAS_SORTEO` y `esperaRepartoSorteo(p)`.
  - `sorteoMesaCore.js` y `reloj.js` la importan de ahí. `ESPERA_REPARTO_SORTEO_MS` desaparece.
  - Lo mismo para `esperaReposicion` según el plan de descarte: las constantes `D_*` se mudan de `GameTable.jsx:263-269` a `esperas.js`, como se hizo con `TURN_TIME`.
  - Mudar las `D_*` toca `GameTable`. Mientras no cambien las cifras, es mudanza y no regla, pero pide el control de las IAS (H3).

### ¿Llega el ritmo al árbitro? Sí

- La función lee `salas.ritmo` (`index.ts:55`).
- `crearPartida` lo guarda en `estado.ritmo` (`partida.js:625`, `:638`).
- El reparto lo usa (`partida.js:164`, `:426`).
- La vista no lo publica: el cliente lo saca de la sala (`partida.factorReparto`, `GameTable.jsx:1734`).

---

## C · La reposición uno a uno

- **Hoy:** el árbitro aplica el descarte entero de una vez y espera `esperaReposicion(mayor)` (`partida.js:250-274`).
  - La vista ya trae las cartas nuevas y `descarte.cuantas`.
  - El cliente anima todo en paralelo (`GameTable.jsx:1678-1724`).
- **¿Basta con cambiar la espera?** En el árbitro, sí. La vista no tiene que decir el orden, porque el cliente lo deriva:
  - el orden es el de las IAS, **de Mano a Pie y solo los no retirados** (`buildDiscardPlan`, `GameTable.jsx:237-249`);
  - la vista ya publica `manoIndex`, `folded` y `descarte.cuantas` (`vista.js:84`, `:24`, `:91`).
- **El orden en asientos PvP:** los índices del motor son los de la mesa y van en el orden de los turnos (`asientos.js:2-3`), así que la traducción es directa.
  - El cliente rota los índices para ponerse en el 0, y el plan se arma con la vista ya rotada, como hoy.
- **En el cliente sí hay trabajo:**
  - `startReposicionPvP` pasa a la secuencia de `startDiscardAnim` (`GameTable.jsx:1624-1659`), pero sin `applyDiscard`: las cartas ya vienen de la vista.
  - Las cartas que salen de un rival siguen siendo «sus primeras k» (`:1681`), porque el servidor no dice cuáles fueron.
  - Toca `GameTable` (control de las IAS) y la vara de `diagDSK pvp` de la reposición.

---

## D · La recarga PvP

### D1 · El estado

- **Dónde vive.** `partidas.estado` es jsonb, con la versión y el vencimiento, y no lo ve ningún cliente (`esq:61-70`, `:91-119`).
  - Lo escribe solo `guardar_jugada`, con la versión leída + 1 (`din:1418-1432`).
  - Cada asiento lee su fila de `partida_vistas` (`esq:75-101`).
  - El dinero del asiento vive en `partida_asientos`: `entrada`, `pila`, `liberado` y `cobrado` (`din:299-312`).
- **Campos nuevos en el estado:**
  - `estado.entrada`, el monto de la entrada. Hoy **no se guarda**: `crearPartida` solo lo usa para las pilas (`partida.js:632`).
  - En cada asiento:
    - `pedida` (booleano);
    - `fuera`: `null`, `'oferta'` (quebró en esta pausa) o `'mano'` (se salta esta mano);
    - `recargas`: la suma en HC;
    - `cancelada`: `null` o `'saldo'`, junto con la versión en que se canceló.
  - El plazo de la oferta es el vencimiento de la pausa o la clase nueva `oferta_recarga`. No hace falta un campo propio.
- **En la vista, lo público** (cada asiento):
  - `recarga`: `'decide'`, `'fuera'` o `null`, para las marcas «Recargando» y «Fuera de esta mano»;
  - en quien está fuera, `eliminated: false`, `folded: true` y `numCartas: 0`, como ya lo pinta la lámina (`partidaImitada.js:703-708`).
- **En la vista, lo privado** (solo el asiento propio):
  - `recarga: { monto, oferta, pedida, cancelada, recargas }`;
  - `monto = entrada − pila`.
  - El saldo **no** va en la vista (D6).
- **Compatibilidad (R-4).** Una partida guardada con la v1.2 no trae nada de esto. Todo se lee con un valor por defecto.
  - Sin `estado.entrada`, la recarga queda apagada en esa partida y se comporta como hoy.

### D2 · Sentado fuera de la mano: **se puede sin tocar protegidos**

- **Lo que hace el motor:** `startHand` elimina para siempre a quien no cubre el ante: `elim = p.eliminated || p.chips < unit` (`gameEngine.js:509-517`).
- **Lo que no impide:** el estado es solo datos, y el árbitro ya los edita (`partida.js:98`, `:108`, `:453-456`).
- **El camino en la capa del árbitro:**
  1. Durante la mano saltada, el asiento va con `eliminated: true` en el motor. Así el motor no le cobra el ante, no le reparte, no le da turno y lo salta en la rotación de Mano y Pie (`gameEngine.js:132-139`, `:542-548`, `:566`).
  2. `fuera: 'mano'` en el asiento lo distingue de un eliminado de verdad. Conserva su residuo: `startHand` no toca `chips` del eliminado.
  3. Al recargar, el árbitro pone `eliminated: false` y `chips = entrada` **antes** del siguiente `startHand`, igual que la lámina (`partidaImitada.js:664-674`).
- **Lo que el árbitro tiene que ajustar:**
  - `empezarMano` liquida a todo eliminado (`partida.js:196`): debe excluir a quien está fuera.
  - `sentados()` (`:74`) debe contarlo como sentado, por R2 v1.9 (Reglas §8.2).
  - `trasManoSiguiente` liquida a quien no cubre al abrir la pausa de anuncio (`:225-226`): con una oferta abierta, ya no.
  - `startHand` cierra la partida con un vivo o menos (`gameEngine.js:522`): con una oferta en retención no se llama todavía (D8).
- **`aplicarRecarga` del motor** (`gameEngine.js:666-681`) solo acepta `PAYOUT` o `WAITING`, y su comentario dice que «En PvP el árbitro no llama nunca a esta función».
  - **Recomendación:** que el árbitro sume la recarga por su cuenta y no use esa función. Así ese comentario no se vuelve falso dentro de un protegido.

### D3 · Las acciones

- **Las tres entran en `ACCIONES_ARBITRO`,** porque cambian el estado y suben la versión.
  - Van además en `SIMULTANEAS` (`partida.js:55`; `nucleo.js:21`), validadas contra `mano` y con reintento, porque durante la mano la versión cambia sin parar.

| Acción | Cuándo | Efecto |
|---|---|---|
| `recargar` | En la pausa entre manos, con oferta o voluntaria, o sentado fuera | La oferta o la voluntaria se aplican en el acto. Sentado fuera, queda pedida para la pausa siguiente (§P-6) |
| `pedir_recarga` | Durante la mano, con la pila por debajo de la entrada | `pedida = true` |
| `anular_recarga` | Con un pedido abierto | `pedida = false` |

- **El rechazo de la oferta** («Ahora no») no es una acción: solo cierra la tarjeta, como en la lámina (`partidaImitada.js:927`). Ver §P-2.
- **Motivos nuevos para la tabla B:**
  - `sin_recarga`: no hay nada que recargar, la pila ya llegó a la entrada o el asiento no está sentado;
  - `saldo_insuficiente`;
  - `ya_pedida`;
  - `sin_pedido`.
  - `fase` se reutiliza para la `mano` equivocada, o para un `recargar` dentro de la mano.
- **Ausencia:** las tres ponen la cuenta a 0, como acciones propias (`PROPIAS`, `partida.js:58`).
- **Idempotencia:**
  - Un doble toque de `pedir_recarga` recibe `ya_pedida`, y el cliente lo toma como éxito.
  - En `recargar`, el segundo recibe `sin_recarga`: la pila ya está en la entrada.
  - El dinero va con la clave `recarga_pvp:<sala>:<uid>:<n>`, donde `n` sale del estado. Esa clave es única en el libro (`eco1a:174`): nada se cobra dos veces.

### D4 · El dinero, en una transacción

- **Un efecto nuevo `recarga {asiento, monto}`** de la jugada, aplicado en `aplicar_efectos` dentro de `guardar_jugada`. Es la misma transacción que el estado y las vistas (`din:1397-1467`). Hace tres cosas:
  1. `aplicar_movimiento(uid, 'recarga_pvp', −monto, clave, 'sala', sala)`;
  2. `partida_asientos.entrada += monto` y `pila += monto`;
  3. `mesa_cuadra` al final, que ya se comprueba (`din:1374`).
  - El efecto va **después** de `mano_cerrada`: las pilas de ese cierre no llevan la recarga, y el efecto la suma.
- **Tipo de movimiento:** **`recarga_pvp`, nuevo** (§P-5). Hace falta:
  - ampliar el CHECK `movimientos_tipo_chk` (molde `cfg1e:48-55`). No es un enum, así que no aplica la lección del enum;
  - que `neto_jugador_mesa` y `neto_mesa` (`din:270-283`, `:327-342`) cuenten también `recarga_pvp`.
  - Reutilizar `garantia_pvp` correría la cuenta de sentadas de `cobrar_entrada` y `devolver_entrada` (`din:415-418`, `:450-453`).
- **`limite_dinero()`** (`din:62-78`): no encaja. `contar_intento_dinero` lee `auth.uid()` (`eco1a:369-377`), y la Contrato §5 dice que las RPC del árbitro no lo leen.
  - El freno contra abusos lo da el árbitro: un pedido por pausa y nunca por encima de la entrada.
  - La válvula de ECO-1 no aplica a PvP (`eco1d:232-233`).
- **La salida no cambia:** `salida` paga la pila, que ya incluye lo recargado (`din:1336-1360`). También la partida muerta, que paga `pila` (`din:1472-1519`).
- **«Lo que entra es lo que sale»:**
  - lo garantizan `mesa_cuadra`, con Σ(pila + liberado) = Σentrada, y, al terminar, `neto_mesa = 0` (`din:1378-1383`), con `recarga_pvp` contado;
  - en el árbitro, pilas + pozo + cobrado sigue siendo constante, más lo recargado (`partida.js:16-19`).
- **El saldo en la jugada:** el árbitro es puro y no lo conoce.
  - **Recomendación:** que `leer_partida` devuelva también `saldos bigint[]` por asiento, y que la función se los pase al árbitro en el reloj: `{ ahora, saldos }`.
  - Si el saldo baja entre la lectura y la escritura (otra pestaña compra en la tienda), `aplicar_movimiento` falla y toda la jugada se deshace. La función reintenta una vez con saldos frescos, y entonces la recarga se cancela con `saldo`.

### D5 · Quién aplica el pedido

- No hay una acción `ahora`: el tiempo avanza cuando cualquier cliente reclama el vencimiento (`partida.js:392-445`; `partidaCliente.js:286-291`).
- El pedido se aplica **en `cerrarMano`** (`partida.js:128-144`), la misma jugada que abre la pausa. Esa jugada puede ser la apuesta, el descarte o el reclamo de cualquiera, así que **no hace falta que el cliente de quien pidió esté despierto**.
- Dentro de `cerrarMano`:
  - si la pila ya no está por debajo de la entrada, se cancela en silencio;
  - si el saldo no alcanza, se cancela con `cancelada: 'saldo'`;
  - si `terminarSiQuedaUno` cierra la partida en esa jugada, se cancela.

### D6 · El saldo insuficiente y el saldo de la confirmación

- **Cómo se entera el cliente:** la vista privada trae `recarga.cancelada = 'saldo'` con su versión, y el cliente abre la tarjeta una vez por versión. Es la misma lógica que hoy tiene la lámina (`partidaImitada.js:849-853`).
- **«Te quedarán {saldo} HC»:** sale de la **billetera** que el cliente ya lee (`mi_billetera()`, `eco1a:690-700`; `useBilletera`), y no de la vista.
  - Una vista no se reescribe cuando la billetera cambia fuera de la mesa.
  - Tras una recarga, el cliente vuelve a leer la billetera.

### D7 · Los cruces

| Caso | Lo que manda la regla | Lo que hace falta |
|---|---|---|
| Abandono por la ✕, por ausencia o por otra mesa, con un pedido o una oferta abiertos | Abandonar es retirarse (§8.2). El pedido no movió dinero | `marcarAbandono` limpia `pedida` y `fuera`. Cobra su pila o su residuo por la ruta de siempre. No hay nada que devolver |
| La pausa de anuncio y la pausa entre manos a la vez | La anuncio va después de la de la mano (`partida.js:218-235`) | La oferta sigue viva en la de anuncio, que tiene más tiempo (45 s). Al acabar esa pausa, quien no decidió pasa a sentado fuera. Quien está en el anuncio no lo ve porque no lo tiene: `veAnuncio` exige cubrir el ante (`:207-214`) |
| Fin de partida retenido por una oferta (R2) | No termina mientras la oferta siga abierta | No se llama a `startHand` mientras haya una oferta en retención. `sentados()` cuenta a quien está fuera |
| Eliminar la cuenta con un asiento vivo | Se bloquea | Ya ocurre: quien está fuera no ha cobrado, y `partida_abierta_de` lo bloquea (`din:1068-1074`). Sin cambio |
| ¿El vencimiento de la oferta cuenta para la ausencia? | — | **Recomendación: no.** La oferta ya tiene su salida en dos pasos, sentado fuera y luego sale, igual que el sorteo y el anuncio, que tampoco cuentan |
| Frase final de quien sale por no decidir | §8.3 fila 2, «Te quedaste sin fichas» | Se le marca **eliminado y cobrado, no `abandonado`**: con `abandonado` vería la fila 1, «Saliste de la mesa» |

### D8 · El plazo de la oferta

- **Mesas que siguen sin él** (quedan 2 o más que cubren el ante): la oferta dura la pausa entre manos. Es casi siempre de 8 s, porque la quiebra llega con revelación, aunque la burbuja asoma con unos 2 s por delante.
  - Después, toda la mano sentado fuera, con la moneda del ⋮, y luego la pausa siguiente. Si sigue sin decidir, sale y cobra su residuo.
  - No hace falta una cifra nueva.
- **Retención** (sin él quedaría uno solo, R2): clase nueva **`oferta_recarga`, de 15 s** desde que vence la pausa entre manos.
  - Es la misma cifra que la pregunta de REC-1 contra las IAS (Reglas §10, «Plazo de la pregunta», 15 s) y la que usó la lámina (`partidaImitada.js:397`).
  - Si recarga, se juega la mano siguiente. Si no, sale, cobra y termina la partida.
  - **Propuesta: 15 s, provisional.**

---

## E · El mensaje (ruta B)

### E1 · Las cuatro preguntas de LM-2 §2.4, contra `efd4c33`

| Pregunta | LM-2 | Hoy |
|---|---|---|
| Por dónde viaja | Una acción en la función que reemite por el canal privado de la mesa | ✔ El canal `partida:<sala>` existe. Los clientes reciben (`esq:535-541`) y solo emite la llave de servicio (`nucleo.js:98-112`). El cliente escucha **solo** el evento `version` (`partidaCliente.js:28`, `:249`), así que un evento nuevo no le estorba |
| ¿Migración? | Pequeña | ✔ No hay nada de mensajes en la base: ninguna columna, tabla ni RPC |
| Dónde se impone el freno | En el servidor | ✔ Ver E2 |
| Quien se reconecta | Pierde los mensajes, que son efímeros | ✔ Sin cambio |

### E2 · El camino concreto

1. `nucleo.js` desvía `accion: 'mensaje'` **antes** de `jugar`, igual que `arrancar`.
   - Lee la partida con `leer_partida`, saca el asiento del uid del token y comprueba: la cuenta tiene asiento, la partida no terminó, el asiento no está abandonado ni ha cobrado, la clave está en la lista y el asiento **no está en su anuncio**.
   - El árbitro aporta una función pura nueva, `puedeMandarMensaje(estado, uid, clave)`. **No** va en `ACCIONES_ARBITRO`: no cambia el estado ni sube la versión.
2. **El freno se guarda en la partida, en SQL y no en el estado:**
   - una columna `partida_asientos.ultimo_mensaje timestamptz`;
   - una RPC `anotar_mensaje(p_sala, p_uid)`, solo para `service_role`, con un `update … where now() − ultimo_mensaje ≥ 10 s` atómico y `returning`.
   - Guardarlo en `estado` obligaría a subir la versión, porque `guardar_jugada` exige la leída + 1 (`din:1418`).
3. **La difusión:** la función emite `{ evento: 'mensaje', asiento, clave }` por el mismo canal.
   - **Esto rompe la letra de «por el canal solo versiones»**, y lo justifico así:
     - el contenido es público por diseño: todos deben verlo;
     - no es estado que el cliente tenga que reconciliar;
     - si se pierde, no pasa nada, porque es efímero;
     - la clave es un id de una lista cerrada.
   - La otra vía, subir la versión y publicar el mensaje en la vista, haría que cada mensaje obligara a releer 5 vistas. Además chocaría con las simultáneas (`nucleo.js:239-240`) y dejaría a alguien con un `version_vieja` por culpa de un mensaje ajeno.
   - **Recomendación: el evento aparte** (§P-1).

### E3 · Los identificadores fijos: **adelantarlos al v1.3**

- Si el servidor valida la clave, esa lista pasa a ser **contrato**. Hoy la clave es el código del emoji (`mensajesMesaCore.js:18-20`; `config/reacciones.js:58`): son 12 frases con 12 códigos distintos, comprobado.
  - Cambiar un emoji cambiaría el id y pediría a la vez un deploy y un push.
- **Recomendación:** un módulo puro nuevo, `src/config/mensajes.js`, con los ids literales en el orden de `REACCIONES` y una prueba que ancle la longitud.
  - Lo importan el servidor y `mensajesMesaCore.js`.
  - **No se toca `config/reacciones.js`**, así que esta pieza no pide el control de las IAS. El mapa id → frase vive en el trozo PvP.

### E4 · Lo que no puede mandar el mensaje

| Caso | Imitado hoy (`partidaImitada.js:934-940`, `mensajesMesaCore.js:46-50`) | v1.3 |
|---|---|---|
| Un asiento ajeno | Imposible: siempre publica el 0 | El asiento sale del uid. Lo que diga el cuerpo no cuenta (`nucleo.js:220-221`) |
| Una clave fuera de la lista | `clave_desconocida` | `clave_desconocida` |
| Alguien abandonado | **No lo comprueba** | `asiento_abandonado` |
| Alguien en su anuncio | **No lo comprueba** | `en_anuncio` (nuevo) |
| Dentro del freno | `freno` | `freno` |

---

## F · La ventana entre el deploy y el push

- **Durante la ventana,** ajilei.io sirve el cliente de `ac96f51`, con su `CapaSorteo` mínima (`ac96f51:src/screens/PartidaPvP.jsx:37`), frente al árbitro v1.3.
- **No hay versión de cliente:** `version` es la del estado de la partida (`partida.js:594`). El árbitro **no rechaza** a un cliente viejo.

| Cambio | Cliente de `ac96f51` |
|---|---|
| Reparto del sorteo más largo | **Raro.** Su capa repartía en 2 s, y luego espera de 1,5 a 6 s sin que pase nada |
| Volteo de 5 s | Ignora el segundo de más sin daño |
| Reposición uno a uno | **Raro.** Anima en paralelo (≈1,1 s) y espera de 3 a 12 s más con la mano quieta |
| Recarga: quien quiebra | Sin daño en el dinero. **Siempre que** la vista de quien está fuera diga `eliminated: false`: el viejo cliente salta a la pantalla final con `propio.eliminated` (`ac96f51:src/hooks/mesaPvPCore.js:53`), y eso le enseñaría su final antes de que cobre. Sin acciones para contestar, se salta una mano y sale con su residuo |
| Oferta abierta en la mesa de 2 | **Raro.** El ganador espera 8 + 15 s sin explicación, y la partida termina bien. No se rompe |
| Evento `mensaje` | Lo ignora: solo escucha `version` |
| Acciones y motivos nuevos | No los manda ni los recibe |
| Efecto `recarga` en SQL | **Se rompe si la migración no va antes:** `aplicar_efectos` lanza ante un tipo desconocido (`din:1365-1366`) |

- **Cómo acortar y blindar la ventana:**
  1. La migración primero. Es compatible con la función v1.2: la columna nueva y el efecto nuevo no los usa nadie, y `leer_partida` con una columna de más la lee igual, porque `nucleo.js:224` desestructura la fila.
  2. El deploy, y el push **en los minutos siguientes**, sin mesas PvP vivas: se comprueba con `select count(*) from partidas where terminada_en is null`, desde el SQL Editor de Victor.
  3. Las partidas que crucen el deploy se juegan con los valores por defecto de R-4 (D1): sin recarga y con lo demás nuevo.

---

## G · La paridad entre el imitado y el real

| Comportamiento | Imitado (`partidaImitada.js`) | Real hoy (v1.2) | v1.3 | ¿Distinto? |
|---|---|---|---|---|
| Reparto del sorteo | `esperaRepartoSorteo(P)`, alargando el reclamo (`:819-821`) | 2.008 fijos | `esperaRepartoSorteo(P)` | **Sí, hoy** |
| Volteo | 5.000 (`:187`, `:819`) | 4.000 | 5.000 | **Sí, hoy** |
| Posición elegida a la vista de los demás | `eligioLamina` con la posición real (`:755-759`) | La vista solo dice quién eligió (`vista.js:45`). El cliente **se inventa** la posición, `(seat·2 + ronda) % 5` (`SorteoMesa.jsx:104`) | Publicar las posiciones elegidas, sin valor (no es secreto) | **Sí**: falta en la lista del v1.3 |
| Reposición | La del árbitro, en paralelo | En paralelo | Uno a uno, árbitro y cliente | Igual hoy. Cambia en los dos |
| Recarga ofrecida, voluntaria y pedida | Encima del árbitro (`:645-712`, `:846-862`) | No existe | En el árbitro (D) | **Sí** |
| Recarga estando fuera | **Al instante**, en mitad de la mano (`:664-670`) | No existe | Pedida, se aplica en la pausa (§P-6) | **Sí** |
| Rival que decide | A los 10 s (`:398`, `:861`) | — | Humano | Solo de la lámina |
| Mesa de 2 en retención | +15 s (`:397`, `:888`) | Termina | `oferta_recarga` de 15 s | Igual si se aprueba |
| Pedido sin saldo | Abre la tarjeta (`:849-853`) | — | `cancelada: 'saldo'` en la vista | Igual en el efecto |
| Mensaje | Lista local, freno local, sin comprobar abandonados ni anuncio (`:934-940`) | No existe | Ruta B (E) | **Sí** (E4) |
| Ausencia | La del árbitro | La misma | Sin cambio | No |
| Pausa de anuncio | La del árbitro, con rivales que vuelven a los 3 s | La misma | Igual, más la oferta dentro | No |
| Pantalla final | La de la vista | La misma | El tono con `recargas` (vista privada) | Falta el dato `recargas` |

---

## H · Migraciones, deploy y pruebas mínimas

### H1 · Una migración: `…_mespvp_v13.sql`

1. CHECK `movimientos_tipo_chk` con `recarga_pvp`.
2. `neto_jugador_mesa` y `neto_mesa` contando `recarga_pvp`.
3. `aplicar_efectos` con el efecto `recarga`. Se redefine entera, y un tipo desconocido sigue lanzando.
4. `leer_partida` con `saldos bigint[]`. Cambia el tipo que devuelve, así que lleva `drop` y `create` con sus permisos.
5. `partida_asientos.ultimo_mensaje` y la RPC `anotar_mensaje`.

- **Grupo A** (estructura):
  - A1 · el CHECK incluye `recarga_pvp`;
  - A2 · existe la columna `ultimo_mensaje`;
  - A3 · `anotar_mensaje` y `leer_partida` solo para `service_role`;
  - A4 · la firma de `leer_partida`;
  - A5 · las vistas siguen sin políticas nuevas.
- **Grupo B** (comportamiento, en PGlite y en el SQL Editor):
  - B1 · la recarga mueve −m, y `entrada` y `pila` suben +m, con `mesa_cuadra`;
  - B2 · la recarga sin saldo deshace la jugada entera;
  - B3 · la misma clave no cobra dos veces;
  - B4 · la salida tras una recarga paga lo recargado, y `neto_mesa` vale 0 al terminar;
  - B5 · una partida muerta con recarga cuadra;
  - B6 · `anotar_mensaje` frena 10 s;
  - B7 · `anotar_mensaje` rechaza a un asiento cobrado o ajeno;
  - B8 · el efecto desconocido sigue lanzando;
  - B9 · una partida con estado v1.2 sigue jugando.

### H2 · Un solo deploy y una sola tanda de migraciones: **sí**

- **Orden:** `db push`, deploy de `partida` y push del cliente.

### H3 · Las pruebas justas

- **Vara del árbitro** (`arbitro.test.js`, `esperas.test.js`):
  - el reparto del sorteo con P de 2 a 5 y en el desempate;
  - el volteo de 5 s;
  - la reposición uno a uno con 0, 1 y n descartes, en Normal y en Rápido;
  - el pedido aplicado, cancelado sin necesidad y cancelado por saldo;
  - la oferta, el sentado fuera, la vuelta a la mesa y la salida a la segunda;
  - la retención en la mesa de 2;
  - una oferta dentro de la pausa de anuncio;
  - el abandono con un pedido o una oferta;
  - R2 contando a quien está fuera;
  - la conservación del dinero con recargas;
  - la idempotencia;
  - R-4 con un estado v1.2;
  - las posiciones del sorteo en la vista.
- **Función** (`scripts/testFuncionPartida.test.js`):
  - el mensaje: freno, clave, abandonado, en anuncio, y que no sube la versión;
  - los saldos que llegan al árbitro;
  - el reintento por saldo.
- **Control de las IAS: hace falta,** por la reposición uno a uno en `GameTable` y la mudanza de las `D_*` a `esperas.js`. Es el control completo, de unas 2 h, con `Start-Process` (relevo §4).
  - Los ids de los mensajes no lo piden (E3).
- **`diagDSK pvp`:** con sus varas al día (reposición, recarga desde la vista real y posiciones del sorteo). Basta para la parte PvP.
- **Prueba por túnel** (S25 = `test1976`, Motorola = `ticotest2022`, PC):

| Mesa | Qué cubre |
|---|---|
| 2 (S25 + Motorola) | Sorteo, reparto 3,5 s · reposición con 0 y 2 descartes · un mensaje y su freno (dos toques seguidos) · voluntaria en la pausa · pedida durante la mano · quiebra con oferta ofrecida y retención: primero «Ahora no» y vencer; en otra partida, recargar |
| 3 (+ PC) | Reparto de 5 s · sentado fuera una mano y vuelta con recarga · sentado fuera dos veces, sale con «Te quedaste sin fichas» |
| Saldo insuficiente | Victor deja a `ticotest2022` con un saldo justo con el SQL Editor (`ajuste_admin`), por ejemplo una entrada + 50 en una mesa de 50. Al quebrar y pedir, no alcanza |

- **El desempate no se puede provocar en el real.** Con dos jugadores sale en un 7,7 % de las rondas (3 de 39). Lo cubren la vara del árbitro y la lámina (`sorteo-desempate`). Si sale en el túnel, mejor.

---

## I · Corte y estimación

### I1 · El corte

**Dos sub-tandas de código y un solo paso a la nube**, porque la recarga es el bloque de riesgo y conviene revisarla aparte:

| Sub-tanda | Qué lleva | Termina en |
|---|---|---|
| **v1.3-a** · tiempos, sorteo y mensaje | Fórmulas en `esperas.js`, reparto del sorteo, volteo de 5 s, reposición uno a uno (árbitro y cliente), posiciones del sorteo en la vista, mensaje ruta B (función, ids y cliente por canal), con sus pruebas | STOP sin nube |
| **v1.3-b** · recarga | Estado, acciones, vista, sentado fuera, retención y efecto, en el árbitro y la función. El cliente lee la vista real en lugar de `recargaLamina`. La migración entera con su guion. El Contrato v1.3. El control de las IAS | STOP con la migración escrita y probada en PGlite |
| Paso a la nube | `db push`, el SQL Editor (A/B), el deploy, el túnel y el push | Push |

### I2 · La estimación (minutos de Claude Code)

| Pieza | Min |
|---|---|
| v1.3-a: árbitro, fórmulas, vista del sorteo y pruebas | 120 |
| v1.3-a: reposición uno a uno en el cliente y vara | 90 |
| v1.3-a: mensaje (función, RPC en la migración, ids y cliente) | 90 |
| v1.3-b: árbitro de la recarga y sentado fuera, con pruebas | 180 |
| v1.3-b: función (saldos, reintento) y cliente con la vista real | 90 |
| v1.3-b: migración y guion PGlite | 75 |
| Contrato v1.3 e informes | 60 |
| Controles (eslint, `npm test`, `diagDSK pvp`, aislados) | 60 |
| **Total de Claude Code** | **≈ 12 h 45 min** (unas 6 h por sub-tanda) |
| Control de las IAS (sin atender) | ≈ 2 h |
| **No se comprime:** `db push` y SQL Editor, unos 25 min · deploy, 5 min · túnel de Victor, de 60 a 90 min |

---

## §P · Preguntas al rector

1. **El mensaje viaja por el canal con su clave** (`{asiento, clave}`), como excepción escrita a «por el canal solo versiones». **Recomiendo que sí:** es contenido público y efímero, no estado. Por la vista, cada mensaje haría releer a todos y chocaría con las simultáneas (E2).
2. **«Ahora no» en la oferta al quebrar**, ¿solo cierra la tarjeta o rechaza la oferta? **Recomiendo que solo cierre**, como en la lámina: la oferta sigue hasta su plazo, y salir ya está en la ✕. El coste es que en la mesa de 2 el ganador espera el plazo entero.
3. **El plazo en retención: 15 s** desde que vence la pausa, como la pregunta de REC-1. **Recomiendo 15 s, provisional.**
4. **Qué acelera Rápido en la reposición.** Contra las IAS, «Partida rápida» no la escala hoy (`partidaRapida.js:10-11`; Contrato §6, «El ritmo»). **Recomiendo ×0,5 en todo**, las pausas y los vuelos de 750 ms (por `dur`, como en `GameTable.jsx:1712`). Así la fórmula es `100 + f·Σ… + 500`.
5. **El tipo de movimiento: `recarga_pvp`, nuevo.** **Recomiendo el nuevo**, por la claridad del libro y del resultado, y porque `garantia_pvp` corre la cuenta de sentadas (D4).
6. **La recarga de quien está sentado fuera:** ¿al instante, como en la lámina, o pedida para la pausa, como dice la letra de §8.1 («se aplica solo entre manos»)? **Recomiendo pedida.** Se ve igual (la marca y la ✓) y el dinero no se mueve dentro de una mano.

## §R · Riesgos

- Deploy antes de la migración: la primera recarga lanza `estado_incoherente` y la jugada no se guarda.
- Una partida que cruce el deploy sin los valores por defecto de R-4: falla al leer los campos nuevos.
- La vista de quien está fuera con `eliminated: true`: el cliente viejo le enseña la pantalla final antes de que cobre.
- El saldo baja entre la lectura y la escritura: sin el reintento, la mesa se queda en la pausa hasta el reclamo siguiente.
- La reposición uno a uno alarga las manos entre 3 y 12 s: puede que Victor la sienta lenta en el túnel, y eso reabriría §P-4.
- `recargaLamina` y `recarga` del imitado siguen vivos para la lámina: el cliente real no debe leerlos fuera de la puerta DEV.
- El control de las IAS (2 h) lanzado desde la terminal se corta si se cierra la sesión: va con `Start-Process`.
- `leer_partida` con `drop` y `create`: si la migración olvida volver a dar sus permisos a `service_role`, la función da 500 en todas las mesas.
