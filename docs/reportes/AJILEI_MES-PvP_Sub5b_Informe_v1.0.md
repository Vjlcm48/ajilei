# AJILEI · MES-PvP · Sub-tanda 5b (la reposición uno a uno) · Informe · v1.0

- **Ficha:** `AJILEI_MES-PvP_Sub5b_v1.0.md` (rector, 2026-11-12).
- **Base:** `main` en `e1d7a98` (la 5a, sin push). `origin/main` en `7a8c7c1`.
- **Recorrido:** tramo L (lámina, STOP-L aprobado) → tramo B (construcción, STOP-B aprobado) → tramo C (commits). Siguen el tramo V (el control de las IAS) y el paso a la nube de Victor.
- **Normas:** Reglas de APU-1 v1.11 §8.7 (la copió Victor y entra en el commit de documentos) · Contrato del árbitro v1.4 · informe de la Fase 0 de la sub-tanda 5, §B.

---

## Resumen

Entre personas, las cartas nuevas tras el descarte ya no llegan a todos a la vez: llegan **asiento a asiento, de la Mano al Pie**, cada una con su voz, con el orden y la velocidad de la mesa contra las IAS. En Rápido van a la mitad de tiempo, salvo el arranque de 100 ms y el cierre de 500.

- **El árbitro** espera lo que dura la reposición en el cliente, según el ritmo.
- **El cliente** la pinta con el mismo calendario que la mesa contra las IAS, anclado a la hora del árbitro: el teléfono que recibe la vista tarde alcanza a los demás sin ninguna ranura vacía.
- **Sin migración.** Solo hace falta el deploy de la función `partida`.
- **Contra las IAS no cambia nada.** El calendario con `f = 1` da los mismos instantes que `7a8c7c1`, y lo ata una prueba permanente.

---

## 1 · Lo hecho

### 1.1 · Las constantes y el calendario (B1)

- Las siete `D_*` del descarte pasan de `GameTable.jsx` a `src/config/esperas.js`, con su valor efectivo: 750 · 187,5 · 375 · 750 · 225 · 300 · 750. Se suman `REPOSICION_ARRANQUE_MS` (100), `REPOSICION_CIERRE_MS` (500) y `REPOSICION_CIERRE_SIN_VOLTEO_MS` (200). `AI_SPEED_FACTOR` no se muda.
- Sale `REPOSICION_SIN_CARTAS_MS`, y con ella la rama de «nadie descartó» del árbitro.
- **`src/lib/reposicionCore.js`**, puro y fuera del componente:
  - `calendarioReposicion(plan, f)` devuelve los pasos (`narra`, `sale`, `entra`), el `fin` del cliente y la `espera` del árbitro;
  - `planReposicionPvP(game, propias)` arma el plan desde la vista, de la Mano al Pie, solo con los asientos de `cuantas` no nulo;
  - `anclarReposicion(pasos, ancla)` ancla la secuencia y es la única que lee la hora;
  - `vueloDescarte(f)`, la duración del vuelo: 0,75 · f.
- `GameTable.jsx` ya no declara las `D_*`: las usa solo a través del calendario (diferencia con la ficha, aceptada en el STOP-B).

### 1.2 · El árbitro (B2)

- `esperaReposicion(descartaron, ritmo)` (`src/arbitro/reloj.js`) hace la cuenta `100 + f · Σ [n = 0 → 750 ; n ≥ 1 → 2.175 + 412,5 · (n − 1)] + 500`, redondeada al ms.
  - Los retirados, abandonados y sentados fuera (`null`) no cuentan; el ausente, con 0.
  - El cierre es siempre el de 500 ms, el peor caso.
- `aplicarDescartes` la llama con `estado.ritmo` (`src/arbitro/partida.js:403`).
- Si alguien abandona durante la reposición, la espera no se recalcula.

### 1.3 · El cliente (B3)

- **`startReposicionPvP`** (`GameTable.jsx`):
  - pinta uno a uno con el calendario y el factor de la sala;
  - empieza en `vencimiento.hora − espera − desfase`, o al llegar la vista si eso es antes;
  - los pasos ya vencidos se aplican sin vuelo: las ranuras quedan repuestas en el acto.
- **El corte** (`cortarReposicionPvP`): cuando la vista sale de `reponiendo`, se limpian los temporizadores y los vuelos y se pinta la vista tal cual. La secuencia y su voz siguen hasta el corte, sin un temporizador de fin propio.
- **La voz:** `fraseDeReposicion` (`vozHumanos.js`) da «{nombre} descarta 2 cartas.», «descarta 1 carta.» y «{nombre} no descarta.», y para el propio «Descartas 2 cartas.» o «No descartas.».
  - Llega a la mesa por la foto de la partida (`mesaPvPCore.js`, `fraseReposicion`), para no cargar la voz entre personas en el trozo de la mesa.
  - Durante la reposición ya no se ve «Descarte completado.», que asomaba 100 ms antes de la primera voz (cambio 2 del STOP-L, aprobado).
- **El rótulo de cada rival** cambia a «Descartó n» cuando habla su voz, no antes (`estadoVisto`, cambio 1 del STOP-L, aprobado). Vale para los dos caminos de pintura: `OpponentPanel` y `.ai-zone`.
- **Los vuelos entre personas se crean dentro de `startReposicionPvP`** (cambio 3 del STOP-L, aprobado). Si llamara a `launchDiscardOut` o `launchDiscardIn`, el compilador de `react-hooks` dejaría de ver el acceso adelantado del reloj de turno, como en el STOP-V de la sub-tanda 2. Una prueba ata su duración a `vueloDescarte`, la misma que la del vuelo contra las IAS.
- **`startDiscardAnim`** (contra las IAS) recorre el mismo calendario con `f = 1`. Los dos vuelos del descarte usan `dur: vueloDescarte()` en lugar de `fast: true`: siguen en 0,75 s.
- **Para el arnés:** `FlyingCard` lleva `data-vuelo` solo entre personas. Contra las IAS no se le pasa y el DOM no cambia.

### 1.4 · Probar Rápido (B4)

- **En el imitado:**
  - escena nueva `reponer`, el descarte de la primera mano recién abierto; con `&ver=vivo` encadena manos;
  - mandos fijos `&ritmo=rapido`, `&desc=<k>`, `&descyo=<k>` (cuántas descarta cada uno) y `&tarde=<ms>` (la vista `reponiendo` llega tarde a ese teléfono).
  - La pieza que alargaba la espera solo para la lámina se retiró en el tramo B.
- **En el servidor real:** la puerta solo de desarrollo `?ritmo=rapido` en `salasApi.crearSala` manda `p_ritmo: 'rapido'`. Funciona por el túnel con el servidor de desarrollo sin bypass. En `dist/` no existe: `testDistSinMoldes` vigila la huella `p_ritmo`.

### 1.5 · Las pruebas permanentes

| Prueba | Qué fija |
|---|---|
| `reposicionCore.test.js` · contra las IAS | El calendario con `f = 1` coincide **instante a instante** con una copia literal de `startDiscardAnim` de `7a8c7c1`. Las 12 combinaciones de B.3, con la Mano en cada asiento y con el propio descarte y sin él. Más las cifras de B.3 en Normal y en Rápido |
| `reposicionCore.test.js` · árbitro = cliente | `esperaReposicion` es igual a la `espera` del plan del cliente en más de 30.000 casos por ritmo: mesas de 2 a 5, cada asiento con `null`, 0, 1, 2, 3 o 5, cada Mano y cada asiento que mira |
| `reposicionCore.test.js` · los vuelos | Los tres vuelos del descarte toman su duración de `vueloDescarte` (0,75 · f), el mismo número que usa el calendario (condición 3 del STOP-L) |
| `arbitro.test.js` · la reposición | Normal y Rápido, nadie descarta, y de punta a punta con un retirado: desde cada asiento, el plan sobre su vista dura lo que espera el árbitro |
| `esperas.test.js` | Los siete valores y los tres del arranque y el cierre; `GameTable` no declara las `D_*` |
| `vozHumanos.test.js` | Las cinco frases de §8.7 al byte, y el nombre cortado («ticotest20… descarta 3 cartas.») |
| `salasApi.test.js` · `testDistSinMoldes` | La puerta de Rápido en desarrollo, y su ausencia en `dist/` |

---

## 2 · Las varas y sus controles rojos

Las dos varas nuevas están en `scripts/pvp/sub5bMesa.mjs`, dentro de `pvp.mesa`. Cada una lleva su control: la misma medida sobre `reposicionCore.js` servido cambiado con `page.route`.

| Vara | Qué mide | Control rojo |
|---|---|---|
| `5b·uno-a-uno` | Mesas de 5, 3 y 2; Normal y Rápido; 412×915 y 1366×768. En cada cuadro, las cartas en el aire son de un solo asiento, y los asientos salen de la Mano al Pie (p. ej. `2>3>4>0>1`) | El calendario sin avanzar de un asiento al siguiente, que es la reposición en paralelo de antes: hasta 5 asientos a la vez |
| `5b·tardio` | Mesa de 3 en Normal y mesa de 5 en Rápido, con `&tarde=1500`. Cuando arranca el reloj de `BET_3` hay 0 ranuras vacías, y en el último cuadro de la reposición la secuencia ya había acabado: sin cartas en el aire, sin ranuras vacías y con la voz del último asiento | Sin el anclaje: el turno la corta con una carta en vuelo y una ranura vacía |

Sin el anclaje, el corte ya deja 0 ranuras vacías al arrancar el turno. Por eso el control del tardío mide además que la secuencia hubiera acabado antes del corte.

**Las corridas sobre el árbol del STOP-B:**

| Corrida | Resultado |
|---|---|
| eslint | 0 errores y 0 avisos, igual a la firma de ARN-4a |
| vitest | 109 archivos, 2.954 pruebas, 0 fallidas |
| `pvp.mesa` | verde, 6 min 00 s (tope 10): 20/20 celdas, 62/62 escenas, 6/6 varas. **No hizo falta repartir escenas** |
| `pvp.lm` | verde, 8 min 01 s (tope 15): 91/91 varas |
| `congelado` y `rev` (humo de las IAS) | verdes, 1 min 48 s y 3 min 54 s. El control completo va en el tramo V |
| `1.8b` | **177,1 KiB antes y después** (meta 185, techo 200) |

**La lámina** (STOP-L): 18 casos medidos en 412×915 y en 1366×768, en las mesas de 2, 3 y 5, Normal y Rápido, 1, 3 y 5 cartas, y con el propio descarte y sin él. Las 36 duraciones quedan entre +13 y +124 ms sobre la tabla B.3; la diferencia es el tic de 100 ms con que el imitado reclama el vencimiento. Con `&tarde=1500` hubo 0 ranuras vacías en 7 casos. Victor vio los siete casos clave en la PC y en el S25: «todo se ve perfecto».

---

## 3 · El Contrato v1.4

| Sección | Cambio |
|---|---|
| Título y cabecera | «v1.4»; línea «Al día con MES-PvP, sub-tanda 5b (2026-11-12)»: solo se despliega la función, sin migración |
| §4 · Fila «Descarte» | `descarte.cuantas` (con `null` para quien no sigue en la mano) y `manoIndex` bastan para la reposición. Sin campo nuevo; de un rival se mueven sus primeras cartas |
| §6 · Fila «Reposición» | La fórmula uno a uno con `f`, redondeada al ms. Sale «600 ms si nadie descartó» |
| §6 · «La reposición uno a uno» | Pasa de pendiente a normativa: la fórmula, el ritmo, el cierre fijo de 500 ms, las constantes, el orden, las cartas de los rivales, el anclaje del teléfono tardío, el corte y la ausencia de colchón |
| §6 · «Durante la reposición…» | Si alguien abandona, la espera no se recalcula ni cambia el plan que ya se pinta; si la mano se cierra, el cliente corta |
| §6 · «El ritmo» | «Qué escala» suma la reposición, solo entre personas y salvo el arranque y el cierre. «Qué no escala» deja de nombrarla |
| §6 · «Las esperas base» | La fila «Reposición» lleva la fórmula con las `D_*`, de 2.100 a 15.600 ms en Normal. «¿La escala el ritmo?»: **sí, ×0,5**, salvo el arranque y el cierre; contra las IAS, no |
| Lista de pendientes | «La reposición uno a uno» queda como hecha en la 5b |

---

## 4 · La ventana

El cliente de `7a8c7c1`, el de ajilei.io hasta el push, frente al árbitro nuevo:
- La vista no cambia de forma: llegan los mismos `cuantas`, `manoIndex` y `vencimiento`.
- Hace su reposición en paralelo, de unos 3,5 s como mucho, y se queda quieto con las cartas ya repuestas.
- Mientras tanto se ve «Esperando a la mesa…» y la crónica `resumenDescarte`, hasta que la vista sale de `reposicion`.
- La reposición no tiene anillo (`TOPE_RELOJ_MS`), así que no hay reloj que se descuadre. El reclamo es el genérico: la hora más 300 ms.

**Solo ve una espera más larga. No se rompe nada.** En la misma mesa pueden convivir un teléfono viejo y uno nuevo. El orden es el del v1.3: commits, deploy, túnel y push.

---

## 5 · Commits

Cada commit pasó su `npm run aislado -- <sha> --perfil=commit` antes del siguiente. Tres archivos entran en versiones intermedias, para que cada commit construya y pase solo:
- `esperas.js` conserva `REPOSICION_SIN_CARTAS_MS` en (a) hasta que el árbitro deja de leerla en (b);
- `reposicionCore.test.js` suma en (b) la sección árbitro = cliente y en (c) la que lee `GameTable.jsx`;
- `esperas.test.js` lleva en (b) las cifras nuevas del árbitro y en (c) la de que la mesa ya no declara las `D_*`.

| | SHA | Título | Aislado |
|---|---|---|---|
| a | `6993fe2` | MES-PvP 5b-a · el núcleo: las D_* en esperas.js y el calendario compartido | verde, 803 s (vitest 2.941) |
| b | `50ab660` | MES-PvP 5b-b · el árbitro: la espera uno a uno según el ritmo | verde, 806 s (vitest 2.944) |
| c | `6cfdbf2` | MES-PvP 5b-c · el cliente: la reposición uno a uno anclada, la voz, el rótulo y Rápido | verde, 832 s (vitest 2.954) |
| d | `7b4e08e` | MES-PvP 5b-d · el arnés: las varas 5b·uno-a-uno y 5b·tardio | verde, 814 s (vitest 2.954) |
| e | (este) | MES-PvP 5b-e · documentos: el Contrato v1.4, las Reglas v1.11 y el informe | en el STOP-C |

Las sondas `laminas/lm1/`, `lm2/` y `lm3/` se quedan sin seguimiento.

---

## 6 · Lo que queda

**Para la sub-tanda 7 (armar la mesa):**
- El control de ritmo del anfitrión en `ArmarMesa.jsx` (Contrato, lista de pendientes). Cuando exista, la puerta solo de desarrollo `?ritmo=rapido` de `salasApi.crearSala` sobra y se retira, junto con su huella en `testDistSinMoldes`.
- Las demás filas de MES-PvP 7 del Contrato siguen igual: la fila Entrada, el chip de 50, el reloj de la sala, `salas_abiertas` con `entrada` y la sala de espera.

**Para el tramo V y la nube:**
- El control completo de las IAS (16 varas más `rev`) sobre el último commit, y `pvp.mesa` y `pvp.lm` en verde.
- El deploy de `partida` sin partidas en curso, el túnel 2 (servidor de desarrollo sin bypass, por la puerta de Rápido) y el push con la ceremonia de los tres SHA.

**Sin colchón en `barajado_sorteo`** (herencia de la 5a): la 5b no lo lleva.
