# AJILEI · MES-PvP · Árbitro v1.3-a · Informe · v1.0

**Ficha:** `AJILEI_MES-PvP_Arbitro-v1.3a_v1.0.md` · **Base:** `efd4c33` · **Diseño de referencia:** el informe de la Fase 0 (`AJILEI_MES-PvP_Arbitro-v1.3_Fase0_Informe_v1.0.md`), con las seis decisiones de Victor sobre su §P.
**Estado:** STOP-C, cinco commits sin push. Sin nube: ni `db push`, ni deploy, ni consultas a la base real.

## Resumen

- **El sorteo sobre la mesa ya tiene sus tiempos en el árbitro.** El reparto dura según quién participa en la ronda (5 cartas cada uno, siempre en Rápido) y el volteo, 5 s. La fórmula vive en un solo sitio, que leen el árbitro y la capa.
- **Las posiciones del sorteo son reales.** La vista publica qué posición eligió cada asiento, sin el valor de la carta. La capa ya no se la inventa.
- **El mensaje de la mesa va por la ruta B,** con un id fijo, el freno de 10 s en SQL y el evento `mensaje` por el canal de la mesa. No es una acción del árbitro: no toca el estado ni sube la versión (P-1, excepción escrita a «solo versiones»).
- **No se tocaron** `GameTable.jsx`, `config/reacciones.js` ni ningún protegido. Contra las IAS no cambia nada: los tres módulos nuevos o tocados del mensaje solo los carga el trozo `partidaPvP` (`src/lib/trozos.js:28`) y `src/dev/`.
- **La reposición uno a uno salió de esta sub-tanda.** Va a la sub-tanda 5, con su deploy propio (ver §5).

---

## 1 · Lo hecho

### El sorteo

| Qué | Dónde |
|---|---|
| El volteo de cada ronda, 5 s | `src/config/esperas.js:33` |
| `CARTAS_SORTEO`, `PASO_SORTEO_MS` (595 × 0,5 = 297,5) y `esperaRepartoSorteo(p)`: 3.495 · 4.983 · 6.470 · 7.958 ms con 2…5 participantes | `src/config/esperas.js:40-44` |
| El reloj del árbitro reexporta la fórmula; desaparece `ESPERA_REPARTO_SORTEO_MS` (2.008 ms fijos) | `src/arbitro/reloj.js:9`, `:14` |
| El reparto espera según los participantes de la ronda (también en el desempate) | `src/arbitro/partida.js:404` |
| La vista publica `sorteo.elegidas`: la posición elegida por asiento, `null` si aún no eligió; nunca el valor (R-4) | `src/arbitro/vista.js:49` |
| El cliente rota `elegidas` con los demás índices | `src/lib/vistaAMesa.js:141` |
| La capa pinta la posición de la vista (se quita `(asiento·2 + ronda) % 5`) y voltea con la constante compartida | `src/screens/SorteoMesa.jsx:3`, `:66` |
| La capa lee la fórmula de `esperas.js` | `src/lib/sorteoMesaCore.js` |

### El mensaje

| Qué | Dónde |
|---|---|
| Los 12 ids fijos, en el orden de `REACCIONES`, sin dependencias | `src/config/mensajes.js:12`, `:27` |
| `puedeMandarMensaje(estado, uid, clave)`, pura, fuera de `ACCIONES_ARBITRO`. Rechaza, en este orden: sin uid, ajeno, partida terminada, abandonado, cobrado, clave desconocida y durante el propio anuncio | `src/arbitro/mensaje.js:25-38` |
| Motivos nuevos: `clave_desconocida`, `en_anuncio`, `freno` (15 en total) | `src/arbitro/motivos.js:24-26` |
| La función desvía `{accion:'mensaje'}` antes de `jugar`: `leer_partida` → `puedeMandarMensaje` → `anotar_mensaje` → evento `mensaje` `{asiento, clave}` | `supabase/functions/partida/nucleo.js:241-259` |
| `crearDifusor`, que comparten el evento `version` y el `mensaje` | `supabase/functions/partida/nucleo.js:102-128`, `index.ts:49-74` |
| Migración: `partida_asientos.ultimo_mensaje` y la RPC `anotar_mensaje`, atómica y solo para `service_role` | `supabase/migrations/20261107200000_mespvp_v13_mensaje.sql:22`, `:34-72` |
| La clave del cliente es el id, no el código del emoji (`claveDeFrase` / `fraseDeClave`) | `src/lib/mensajesMesaCore.js:21-22` |
| El cliente escucha `mensaje`, rota el asiento, descarta el propio y todo lo que llega durante tu anuncio; `enviar` anota el tuyo solo con el `ok` | `src/lib/partidaCliente.js:255-290` |
| La foto lleva los mensajes y `PartidaPvP` se los pasa a `MensajesMesa` | `src/hooks/mesaPvPCore.js:87`, `src/screens/PartidaPvP.jsx:162` |
| El imitado usa los ids y rechaza igual que la función | `src/dev/partidaImitada.js:724`, `:927` |

### La migración en PGlite

- **Grupo A (3 filas):** A2 la columna, A3 los permisos (`search_path` vacío y solo `service_role`), A5 sin políticas ni privilegios del cliente.
- **Grupo B (7 filas):** B6a–d el freno, incluido 9,999 s frente a 10 s; B7a–c ajeno, cobrado (tras una `guardar_jugada` con efecto `salida`) y partida terminada.
- Resultado: **10/10 PASA y sin rastro.** Los dos grupos van comentados dentro del archivo, para el SQL Editor después del push, como en MOT-1.

---

## 2 · Las varas y sus controles rojos

Cada vara nueva se probó con su control: mutar, correr, ver ROJO y restaurar.

| Vara | Resultado | Control rojo |
|---|---|---|
| Reparto del sorteo (3.495 · 4.983 · 6.470 · 7.958 y desempate) | ✔ | Con 2.008 ms fijos, 3 fallan |
| Volteo de 5 s | ✔ | Con 4 s, 2 fallan |
| Posiciones en la vista, sin valor | ✔ | Sin `elegidas`, 6 fallan |
| `puedeMandarMensaje` | ✔ | Sin mirar el anuncio, 3 fallan |
| La función: mensaje, freno, uid del token, versión quieta | ✔ | Sin `puedeMandarMensaje`, 1 falla |
| El cliente: rotación y nada durante tu anuncio | ✔ | Sin rotar, 1 falla; pintando durante el anuncio, 1 falla |
| Ids fijos | ✔ | Con el código del emoji, 1 falla |
| Migración en PGlite | 10/10 | Con el freno a 0 s caen B6b y B6d (8/10) |
| `diagDSK pvp` · `v13·sorteo-posiciones` (mesas 2 y 5, 412×915 y 1920×1080) | ✔ 4/4 filas | La posición inventada de antes de la v1.3 falla en las 4 |
| `diagDSK pvp` · `v13·mensaje-id` (mesas 2 y 5) | ✔ | Las claves reescritas al código del emoji no pintan ninguna burbuja |

**Controles generales:**
- eslint: 0.
- `npm test`: 108 archivos y 2.877 pruebas (antes 2.857).
- `npm run guiones`: verde, con 18 migraciones.
- `diagDSK pvp`: 20/20 celdas, 62/62 escenas y 90/90 varas (88 + 2), código 0.
- `1.8b`: 176,9 KiB antes y después (639,15 → 639,2 en crudo; techo 200).

**Dos fallos del andamio, arreglados y contados (regla andamio/commit):**
- **`v13·sorteo-posiciones` salió roja en su primera corrida.** La escena congelada `sorteo-elige-algunos` no podía discriminar: en la mesa de 2 solo había elegido el propio, y en la de 5 el guion elegía justo las posiciones que se inventaba la capa vieja, así que el control nunca fallaba. La vara pasó a vivo (`ver=vivo`, esperando a que todos los rivales hayan elegido y tú no). Así discrimina en las 4 filas.
- **Una corrida de `diagDSK` dio error de instrumento (código 2):** su servidor de 5173 no respondía, justo después de matar el vite de otro puerto. Se relanzó y salió con código 0.

---

## 3 · Commits

El orden de la ficha no construía tal cual: el commit 1 quita `ESPERA_REPARTO_SORTEO_MS` de `reloj.js`, que importaban `partida.js` y el imitado. Por eso `partida.js` entra en el 1, y tres archivos van en versión intermedia: `src/arbitro/index.js` (solo la fórmula), `src/arbitro/arbitro.test.js` (solo el sorteo) y `src/dev/partidaImitada.js` (solo los tiempos). Se completan en el 2 y el 3.

| # | SHA | Título | `npm run aislado -- --perfil=commit` |
|---|---|---|---|
| 1 | `d0d9e47` | MES-PvP v1.3a-a · reglas y núcleo del sorteo | Verde · 2.861 pruebas · eslint 0 · 1.8b y humo en 0 |
| 2 | `a601e1f` | MES-PvP v1.3a-b · el mensaje en el árbitro, la función y la base | Verde · 2.869 pruebas · eslint 0 · 1.8b y humo en 0 |
| 3 | `62d6ff9` | MES-PvP v1.3a-c · el cliente: mensajes y posiciones del sorteo | Verde · 2.877 pruebas · eslint 0 · 1.8b y humo en 0 |
| 4 | `0e7867c` | MES-PvP v1.3a-d · varas | Verde · 2.877 pruebas · eslint 0 · 1.8b y humo en 0 |
| 5 | este | MES-PvP v1.3a-e · informes | Solo documentos; su aislado va en el STOP-C |

`laminas/` queda fuera. Tras el commit 5, el árbol es idéntico al que se probó en el STOP-A: los 30 archivos coinciden con la copia guardada antes del primer `git add`.

---

## 4 · Lo que hereda el v1.3-b

- **La segunda migración**, con lo que queda del §H1 de la Fase 0:
  1. el CHECK `movimientos_tipo_chk` con `recarga_pvp` (P-5);
  2. `neto_jugador_mesa` y `neto_mesa` contando `recarga_pvp`;
  3. `aplicar_efectos` con el efecto `recarga`, redefinida entera; un tipo desconocido sigue lanzando.
  - Sus grupos: A1 y A4; B1–B5, B8 y B9.
- **`leer_partida` con `saldos bigint[]`.** Cambia el tipo que devuelve, así que lleva `drop` y `create`. **Tiene que volver a dar sus permisos a `service_role`**: si se olvida, la función da 500 en todas las mesas (riesgo §R de la Fase 0).
- **El Contrato v1.3.** Debe recoger:
  - **el evento `mensaje` `{asiento, clave}` como excepción escrita a «solo versiones»**: no es una acción, no sube la versión, lo frena `anotar_mensaje` (10 s) y lo descarta el cliente propio y quien está en su anuncio;
  - **las posiciones del sorteo en la vista** (`sorteo.elegidas`: posición o `null`, nunca el valor);
  - los tiempos del sorteo (`esperaRepartoSorteo(p)` y el volteo de 5 s) y los tres motivos nuevos;
  - **los dos matices de A2, sin corregirlos:** el código dice `{n}` donde las Reglas dicen `{N}` (§8.4 y §8.6), con el mismo texto visible; y en la mesa de 2 contra las IAS la pastilla dice «Es Mano IA», sin número (`src/engine/entrada.js:110`), cuando las Reglas solo dan la forma con `{k}`.
- **La recarga PvP entera,** según P-2, P-3, P-5 y P-6: «Ahora no» solo cierra la tarjeta; la clase `oferta_recarga` de 15 s; el movimiento `recarga_pvp`; y quien está sentado fuera y recarga queda con la recarga pedida para la pausa siguiente.
- **El deploy de esta sub-tanda va con el del v1.3-b:** la migración `20261107200000` y la función con el mensaje siguen sin subir. Orden de la ventana de la Fase 0 (§F): migraciones primero, luego el deploy, luego el push, sin mesas vivas.

## 5 · Lo que hereda la sub-tanda 5

- **La reposición uno a uno, en el árbitro y en el cliente.**
  - La fórmula de la Fase 0: **`R = 100 + f · Σ por asiento [n=0 → 750 ; n≥1 → 2.175 + 412,5·(n−1)] + 500`** ms, en orden de Mano a Pie y solo con los no retirados.
  - **Rápido escala ×0,5 en todo (P-4):** las pausas y los vuelos de 750 ms.
  - En el cliente, `startReposicionPvP` pasa a la secuencia de `startDiscardAnim`, sin `applyDiscard`. **Toca `GameTable.jsx`, así que pide el control de las IAS.**
- **La mudanza de las `D_*` a `esperas.js`:** `D_OUT`, `D_OUT_STAG`, `D_PAUSE`, `D_IN`, `D_IN_STAG`, `D_SEAT_GAP` y `D_SKIP` (`GameTable.jsx:263-269`).
- **Va con un deploy propio,** porque el árbitro y el cliente tienen que cambiar a la vez.
- **Se mide allí también el arranque** («Arrancando la partida…» frente al barajado de 1.950 ms), antes de quitar «Arrancando».
