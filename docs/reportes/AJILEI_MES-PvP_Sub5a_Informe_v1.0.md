# AJILEI · MES-PvP · Sub-tanda 5a (cliente) · Informe · v1.0

**Base:** `7a8c7c1` (v1.3-c) · **Ficha:** `AJILEI_MES-PvP_Sub5a_v1.0.md`, con las decisiones del STOP-L, el STOP-L2, el STOP-A y el STOP-A2.
**Estado:** STOP-C, cinco commits sin push. Solo cliente: nada de `src/arbitro/`, `supabase/functions/`, los `D_*`, `esperas.js`, `&ritmo` ni el Contrato. Sin nube.

## Resumen

- **Mesa provisional.** Quien vio la sala esperando y luego activa entra a la mesa ya pintada, con las sillas de la sala, sin «Arrancando la partida…». Quien vuelve con la partida en curso ve la mesa sin texto hasta la primera vista.
- **La ceremonia del sorteo, entera.** El barajado dura al menos 1.000 ms y el reparto va desde la primera carta, con un suelo de 150 ms por carta. Si no cabe, el reparto se come segundos de la elección y el mazo espera quieto. El sonido del barajado se corta con su desvanecido al acabar el abanico.
- **O1 en el sorteo y en el pago.** La caja de acciones se reserva oculta en `SORTEO`, y la ranura de la zona de «Tú» se reserva en todo el pago entre personas. El óvalo y la zona de «Tú» ya no saltan.
- **La voz entre personas corta a 10.** `nombreEnVoz` corta todas las frases de la mesa, «{nombre} está pensando…» incluida.
- **«Entras en la próxima mano» desde la mesa.** Sale en la caja de acciones. La capa que tapaba la frase se retira.
- **La precarga** de la mesa empieza en la Sala de espera.
- **El arnés.** `diagDSK pvp` se parte en `pvp.mesa` y `pvp.lm`, con cuatro varas nuevas, todas con su control rojo. Se añade la escena `recarga-anuncio`.
- **`?medir=arranque`.** Las marcas y el panel del arranque son solo de desarrollo y no llegan a `dist/`.
- **Túnel 1 aprobado.** No hace falta colchón en `barajado_sorteo`.
- **No se tocaron** ningún protegido ni los óvalos del teléfono. El CSS solo quita las reglas de la capa retirada, sin `!important`. Contra las IAS no cambia nada: cada línea nueva de `GameTable.jsx` va tras `partida`, que con las IAS es nula.

---

## 1 · Lo hecho

### 1.1 · La mesa provisional (C)

- `src/hooks/mesaPvPCore.js:69`: `vistaProvisional({ sillas, apuesta, entrada })` calca la primera vista del árbitro, con `version: -1` y sin vencimiento. La prueba la compara con `vistaDe(crearPartida)`.
- `src/hooks/mesaPvPCore.js:113`: la provisional solo existe si la sala trae `sillas`. El mazo va en el asiento real 0, contado desde el propio: `:129` en la provisional y `:194` en la vista real (la misma fórmula que en `7a8c7c1`).
- `src/screens/salaEsperaCore.js:68`: `salaParaPartida(sala, asientos, uid, enVivo)` solo añade las sillas si el teléfono vio la sala esperando. Lo añadió el rector en el tramo A.
- `src/screens/SalaEspera.jsx:133` y `:155`: la referencia `enVivo` se pone a verdadero cuando la sala está esperando y aún no hay fin. `:139` le pasa la sala a la partida.
- `src/screens/PartidaPvP.jsx:151`: sin provisional, la mesa sale sin texto hasta la primera vista. Se retira la clave `pvp.arrancando` de `src/config/textos.pvp.es.js`.
- `src/screens/PartidaPvP.jsx:210`: el imitado espera a `cargarMesa()` y publica `__pvpImitada` en un efecto, después del commit de React.

### 1.2 · La ceremonia del sorteo y su sonido (L2, F)

- `src/lib/sorteoMesaCore.js:123-127`: `BARAJADO_MIN_MS` 1000, `PASO_MIN_MS` 150 y `avanzaSorteo`. La etapa y su `t` viajan juntos (`useSorteoMostrado`, `src/screens/SorteoMesa.jsx:54`). El reparto se comprime para acabar cuando el árbitro termina el suyo. Si llega en el volteo, se pinta la vista tal cual.
- `src/lib/sorteoMesaCore.js:46`: `RELOJ_ESCRITORIO` pasa a −118,7 / 17,9.
- `src/hooks/useSounds.js:264`: `cortarSonido(nombre, 130)`. Corta con desvanecido y también anula la petición que aún esperaba al motor (`cortes`, `:213`). La capa lo llama al acabar el abanico (`src/screens/SorteoMesa.jsx:133`). En la PC el barajado sonaba entero (5,2 s): la primera vez, el archivo no había llegado y sin `duration()` no había recorte.
- **Decisiones de Victor:** L1 (b), sin sonido en «¡Ya tenemos Mano!». L3 sin salto. Se retiran el golpe `tableKnock` del sorteo y el mando `&sonsorteo`. `&lento` queda como mando fijo del imitado.

### 1.3 · O1 en el sorteo y en el pago (D.1, D.2)

- `src/components/GameTable.jsx:2703`: con `partida` y en la fase `SORTEO`, se reserva oculta la caja «Barajando…». El óvalo pasa a Δ 0.
- `src/components/GameTable.jsx:2894`: la ranura de la zona de «Tú» se reserva en todo el pago entre personas (`isClearing || !!partida`). Allí «Siguiente mano» no se monta.

### 1.4 · La voz entre personas (E)

- `src/hooks/cronicaCore.js:42`: `nombreEnVoz` corta a `CORTE_VOZ` con `recortaNombre`. `src/lib/corteVoz.js` solo cambia su comentario: `&corte=0` ya solo afecta a la crónica.
- `src/components/GameTable.jsx:2732`: «{nombre} está pensando…» pasa por `nombreEnVoz`. La línea `:1757` le pasa `game.voz` a `componeCapas`.
- `src/hooks/vozHumanos.test.js`: cuatro casos al byte de la voz del pago por el camino de la mesa (p. ej. «¡Ganas con Copas, 41 pts!»), y uno de las IAS con `voz` indefinida.

### 1.5 · «Entras en la próxima mano» y la precarga (I)

- `src/components/GameTable.jsx:2779`: si el sentado fuera ya pidió la recarga, la caja dice `pvp.asiento.entra`. `src/screens/RecargaPvP.jsx` deja de pintar su capa `entra`, y `src/styles/pvp.css` pierde sus dos reglas.
- `src/App.jsx:152`: la Sala de espera y la partida salen de `SIN_PRECARGA`, así que la mesa se baja mientras corre la cuenta atrás. `1.8b` pasa de 176,9 a 177,1 KiB (meta 185, techo 200).

### 1.6 · `?medir=arranque`, solo de desarrollo

- `src/dev/medirArranque.js`: las marcas `sala-cero`, `resuelta`, `pantalla`, `mesa-1`, `reclamo-enviado`, `reclamo-respuesta` y `vista-1`. El mando se recuerda en `sessionStorage` (`ajilei.medir`).
- `src/dev/PanelArranque.jsx`: ms desde la primera marca, el nacimiento del barajado en la hora local, lo perdido en `mesa-1` y `vista-1`, y dos líneas del STOP-A2 («silla anfitrión·tuya» y «asiento real·mazo»).
- Todas las llamadas van dentro de `import.meta.env.DEV`: `src/lib/partidaCliente.js:137`, `:215`, `:217`, `src/screens/SalaEspera.jsx:252` y `src/screens/PartidaPvP.jsx:41`, `:91`, `:185`.
- **Trampa de Rolldown:** sin `import.meta.env.DEV &&` en el propio JSX o en el propio `if`, el módulo se queda en `dist/`. Lo mismo pasa con un `new Set()` sin `/* @__PURE__ */`.
- Lo vigilan `scripts/testDistSinMoldes.test.js` (`ajilei.medir`, `arranque:`, `reclamo-enviado`) y el censo de `scripts/testClavesAlmacen.test.js`.

### 1.7 · El arnés (H.1, H.2)

- `scripts/arnes/orquestaCore.mjs:76-77`: `pvp.mesa`, con tope de 10 min: las celdas, las escenas, los 15 «W» y las varas de la 5a. `pvp.lm`, con tope de 15 min: las varas de L-M 1 a 3 y del v1.3. `pvp` entero queda fuera del orquestador (`:98`).
- `scripts/pvp/pvp.mjs:33`: `PARTES_PVP`. `scripts/diagDSK.mjs` acepta `pvp mesa|lm|<n>`.
- `src/dev/partidaImitada.js:465`: la escena `recarga-anuncio`, en la que quiebras en una mano de anuncio y la burbuja va sin anillo. La vara está en `scripts/pvp/arbitro13LM.mjs`. Hay 56 escenas.
- `scripts/pvp/varasLM.mjs`: el control de `lm·cronica-15W` pasa a ser la frase con el nombre entero puesta a mano, porque `&corte=0` ya no quita el corte.

### 1.8 · INV-22 y Reglas v1.10

- `docs/AJILEI_Invariantes_v1.0.md`: INV-22 pasa a «vigilado (parcial)», con su excepción declarada. El barrido de `msg` solo mide lo que está en pantalla en cada sondeo.
- `docs/AJILEI_APU-1_Reglas_v1.10.md` es la copia de Victor, sin tocar. Los textos marcados «v1.10» y el anillo de §8.1 se comprobaron al byte contra el código en el STOP-A: todos ✔, ningún ✘. §8 y §8.7 (la reposición) son de la 5b.

---

## 2 · Las varas y sus controles rojos

Las cuatro varas nuevas están en `scripts/pvp/sub5aMesa.mjs` y corren en `pvp.mesa`.

| Vara | Qué mide | Control rojo |
|---|---|---|
| `5a·ovalo-sorteo-mano` (`:88`) | El óvalo no se mueve del sorteo a la primera mano. | Sin la caja reservada del sorteo. |
| `5a·zona-tu-pago` (`:132`) | La zona de «Tú» no se mueve al entrar en el pago. | Sin la ranura del pago. |
| `5a·arranque` (`:195`) | Con `lento=4000`, ningún cuadro sin mesa desde que se monta la partida. | Sin la mesa provisional (`page.route` reescribe `const provisional`). |
| `5a·mazo-anfitrion` (`:257`) | El mazo, junto al recuadro del anfitrión, en las mesas de 2 a 5 y desde cada asiento. También en la provisional, desde el anfitrión y desde un invitado. 17/17. | El mazo siempre en el asiento propio. Rojo en 3/3. |
| `lm·cronica-15W` (`varasLM.mjs`) | Con 15 «W» y el corte a 10, la tinta no sale del óvalo. | La frase con el nombre entero, puesta a mano. |
| `v13·recarga-vista` + `recarga-anuncio` (`arbitro13LM.mjs`) | Lo pintado es lo que dice la vista, y en la pausa de anuncio la burbuja va sin anillo. | El de la vara del v1.3. |

**Árbol final, antes del primer `git add`:**

| Vara | Resultado |
|---|---|
| eslint | 0 |
| vitest | 108 archivos, 2.925 pruebas |
| `pvp.mesa` | Verde en 5 min 16 s: 20/20 celdas, 62/62 escenas, 4/4 varas, aislamiento verde. |
| `pvp.lm` | Verde en 7 min 26 s: 91/91. |
| `congelado` (IAS) | Verde, 110 s. |
| `apu.voz3` (IAS) | Verde, 4/4, 71 s. |
| `msg` | Código 0, 8 medidas, con la excepción de INV-22. |
| `1.8b` | 177,1 KiB, medido sobre un `vite build` propio: `--servidor=externo` no recompila `dist/`. |
| `dist/` | Ninguna marca de `?medir`. |

---

## 3 · El túnel 1 (2026-11-11)

**Montaje:** S25 (`test1976`, anfitrión), Motorola (`ticotest2022`) y la PC como tercera silla, contra el servidor de desarrollo sin bypass.

**Bien:**
- las cartas a la primera;
- el óvalo sin salto;
- «ticotest20…»;
- la zona de «Tú» en el pago;
- el que vuelve (bloquear, recargar, cerrar y abrir);
- el sonido del sorteo;
- «Entras en la próxima mano».

### 3.1 · El arranque

Son dos medidas por arranque:
- de la cuenta atrás en 0 a `mesa-1`;
- el barajado perdido al llegar `vista-1`.

**Columnas corregidas por el rector:** la primera cifra de cada par era del Motorola y la segunda del S25.

| Arranque | Cuenta atrás → `mesa-1` (Motorola / S25) | Barajado perdido en `vista-1` (Motorola / S25) |
|---|---|---|
| 1.º, en frío (primera carga del servidor de desarrollo) | 4.293 / 4.107 ms | 647 / 508 ms |
| 2.º | 993 / 1.287 ms | 570 / 473 ms |
| 3.º | 390 / 683 ms | 734 / 627 ms |

`reclamo-enviado` → `reclamo-respuesta`: entre 0,8 y 1,5 s.

**Veredicto del rector:** no hace falta colchón en `barajado_sorteo`. La 5b no lo lleva.

### 3.2 · El mazo del sorteo (STOP-A2): sin defecto

El rector leyó al revés las capturas del túnel 1: la primera de cada par era del Motorola. Dos pruebas lo confirmaron:
- **La consulta de la base:** `test1976` es el anfitrión, en la silla 0 y el asiento real 0, en las tres mesas de 2.
- **La prueba corta del 2026-11-12:** el mazo sale abajo en el S25 (el anfitrión) y arriba en el Motorola.

Se quedan la vara `5a·mazo-anfitrion` y las dos líneas del panel.

---

## 4 · Commits

Cada commit pasó su `npm run aislado -- --perfil=commit` antes del siguiente. El perfil `commit` del aislado corre build, vitest, eslint, `1.8b` y `humo`. No corre `diagDSK pvp`, así que el tope de 10 min del arnés viejo no llegó a jugar.

| | SHA | Título | Aislado |
|---|---|---|---|
| a | `36d07ff` | MES-PvP 5a-a · el núcleo: la mesa provisional, la ceremonia del sorteo y el corte en la voz | verde, 813 s (vitest 2.916) |
| b | `55b53dd` | MES-PvP 5a-b · el cliente: el corte del barajado, `&lento` y las marcas del arranque | verde, 806 s (vitest 2.924) |
| c | `8d650ea` | MES-PvP 5a-c · pantallas y CSS: el arranque sin «Arrancando», la caja O1 del sorteo y la zona de «Tú» en el pago | verde, 809 s (vitest 2.924) |
| d | `6d890a7` | MES-PvP 5a-d · el arnés: `pvp.mesa` y `pvp.lm`, y las varas de la 5a | verde, 832 s (vitest 2.925) |
| e | (este) | MES-PvP 5a-e · documentos e informe | en el STOP-C |

Tres archivos van fuera de su capa, para que cada commit quede coherente:
- `scripts/pvp/varasLM.mjs` va en (a). Desde que `nombreEnVoz` corta, el control viejo `&corte=0` deja de salir rojo, y en (a) la vara se habría quedado sin control.
- `scripts/testClavesAlmacen.test.js` y `scripts/testDistSinMoldes.test.js` van en (b), con `medirArranque`.

Las sondas `laminas/lm1/`, `lm2/` y `lm3/` se quedan sin seguimiento.

---

## 5 · Lo que hereda la 5b

- **Sin colchón en `barajado_sorteo`** (§3.1).
- Los `D_*` a `esperas.js`, el calendario compartido, el árbitro uno a uno con `f`, `startReposicionPvP` anclado y con corte, el imitado con `&ritmo=`, la puerta `?ritmo=rapido` y el Contrato v1.4. Con deploy, solo de la función.
- Reglas v1.10 §8 y §8.7 (la reposición) se comprueban contra el código de la 5b.
- **Un solo control de las IAS** sobre el árbol final de 5a + 5b, antes del push. La reposición uno a uno toca `GameTable`.
- `pvp.lm` va por 7 min 26 s con su tope de 15 min. La reposición alarga `pvp.mesa`: hay que vigilar su tope de 10 min.
- `?medir=arranque` sigue disponible para medir el arranque con la reposición.
