# AJILEI · MOT-1 · Fase 1b · Informe · v1.0

- **Ficha:** `AJILEI_MOT-1_Fase1b_v1.0.md`. **Normativo:** `docs/AJILEI_MOT-1_Contrato_v1.0.md`.
- **Base:** `1d73838`. Visto bueno del rector con cinco ajustes y tres retoques (§7). Prueba de Victor: tres sí.
- **Duración:** 47 min de reloj hasta el STOP-1b (07:21:50 → 08:09), de los que 8 son el banco y 14 las varas, y 8 min de los ajustes (12:49 → 12:56). Los retoques y los commits del §9 van aparte, y su duración, en el chat. Tope: 3 h 30.

**En tres líneas.** El árbitro está escrito, sin red y sin base, y carga en ESM estricto, con los cinco ajustes y los tres retoques aplicados. El motor se abrió solo en los dos rangos autorizados. La vara del banco y su guardián siguen al motor sin re-sellar ninguna cifra (§3), y el contrato queda al día (§7).

---

## 1 · El árbitro

**Carpeta:** `src/arbitro/`. Va en `src/` porque importa el motor por ruta relativa, como hizo la sonda, y fuera de `src/engine/` porque no es un protegido ni parte del motor. Ningún archivo del cliente lo importa; lo comprueba una prueba y `testEntradaLigera`.

| Archivo | Exporta |
|---|---|
| `index.js` | La entrada: reexporta todo lo de abajo |
| `partida.js` | `crearPartida({ apuesta, entrada, ritmo }, sillas, ahora) → estado` |
| | `aplicarAccion(estado, { uid, version, accion, ...campos }, { ahora }) → { estado, respuesta, efectos }` |
| | `abandonarPorServidor(estado, uid, { ahora }) → { estado, respuesta, efectos }` |
| | `partidaTerminada(estado) → boolean` · `sorteoAbierto(estado) → boolean` |
| | `ENTRADAS` · `APUESTAS` · `ACCIONES_ARBITRO` |
| `vista.js` | `vistaDe(estado, asiento) → vista` · `FASE_SORTEO` |
| `sorteo.js` | `abrirRonda(numAsientos, ronda, participan, rondas?)` · `voltear(sorteo)` · `siguienteRonda(sorteo)` · `eligieronTodos(sorteo)` · `cerrar(sorteo)` · `CARTAS_POR_ASIENTO` · `TOPE_RONDAS` · `ETAPAS` |
| `reloj.js` | `factorDe(ritmo)` · `esperaPrimerReparto(cartas, ritmo)` · `esperaSegundoReparto(cartas, ritmo)` · `esperaManoSiguiente(conRevelacion)` · `CLASES` · `RITMOS` · `ESPERA_*_MS`, con `ESPERA_REPARTO_SORTEO_MS` |
| `ganador.js` | `ganadorDeMano(motor)` · `ganadoresDeCapas(motor)` · `huboRevelacion(motor)` · `ajileiDe(cartas, reglas)` |
| `motivos.js` | `MOTIVOS` · `MOTIVOS_APUESTA` (la A, de `pozos.js`) · `MOTIVOS_ARBITRO` (la B) |
| `asientos.js` | `compactarAsientos(sillas) → [{ silla, uid, nombre }]` |
| `azar.js` | `azarSeguro() → número en [0, 1)`, para `setRng` |

**Esperas:** `src/config/esperas.js`. `TURN_TIME` se mudó y la mesa lo importa de ahí. Las demás cifras siguen también en `GameTable.jsx`, y `esperas.test.js` confronta las dos copias.

**`efectos`,** lo que la 1e escribe en la transacción del §5:
- `{ tipo: 'mano_cerrada', mano, ganador, sentados, ajilei, pilas }`: en `pilas`, 0 para todo asiento cobrado, también el que cobra en este mismo cierre
- `{ tipo: 'salida', asiento, monto }`
- `{ tipo: 'partida_terminada', ganador }`

---

## 2 · El motor

Dos rangos, los autorizados. Blob `98014fd85a99`, sha256 `b7f4d147a777082c`, 751 líneas, con su fila en Protegidos §3.

1. **Comentario de `:193-197`.** Decía «siempre UNA capa» y «esta ruta no se toma». Las mismas cinco líneas dicen ahora lo que hace el código.
2. **Edición 3, `applyDiscard`** (`:681-683` y `:699`). El segundo parámetro acepta la lista de siempre o un objeto `{ asiento: índices }`. Las IAS siguen con `decideDiscard`, y el orden y el azar no cambian.

---

## 3 · Las cifras

| Comprobación | Resultado |
|---|---|
| `vitest` | 99/99 archivos, 2240 pruebas, 0 fallidas. Nuevas: 46 pruebas en 2 archivos |
| `eslint` | 0 errores, 0 avisos |
| `node --input-type=module -e "await import('./src/arbitro/index.js')"` | Código 0, sin error |
| Rotura a propósito | Las pruebas del árbitro cazan los 11 fallos introducidos: 2 del ajuste A, 3 del B, 1 del C, 1 del D, 1 del retoque de `cobrado` y 3 del de la elección |
| `banco:verificar` | **VERDE 87/87, 75 formas, ROJA 0, peor 2,65 s**, medido antes de los ajustes con esta misma vara, byte a byte. No se repitió: el motor no cambió, sigue en el blob `98014fd85a99` |
| Prueba de propiedad del motor de APU-1 | Verde: `testMotorAPU1` sin tocar |
| `1.8b` | **176,8 KiB**, igual que en PES-1, medido antes de los ajustes. El cliente no importa el árbitro |
| Paquete | Ninguno contenía `elegir_carta_sorteo` ni `no_es_de_esta_mesa`, medido antes de los ajustes |
| `npm run varas -- commit` | **Código 0**, medido antes de los ajustes. 7 varas: eslint, vitest, build, guiones, `1.8b`, `pue.espera` y humo (13 min 14 s). Se repite por commit en el §9 |

**Cobertura real del recorrido al azar** (12 partidas de la prueba de propiedad, medidas aparte, con los ajustes): 10.914 pasos · 344 manos, 119 con volteo y 225 por retirada · 29 con all-in · 17 abandonos · las 12 terminan. Salieron 21 de los 22 motivos; falta `partida_terminada`, que tiene su prueba propia.

### La vara del banco (ajuste E)

La vara guardaba el blob de `gameEngine.js` en 28 sitios (E-25, `bancoNiveles.mjs:1933`): con cualquier byte nuevo, ninguna celda se comparaba y `banco:verificar` daba `INCOMPARABLE · OTRO MOTOR`, código 2. El rector aprobó cambiarlas sin re-sellar ningún número.

- **Hecho:** `scripts/apu1_bandas.json` tiene el blob nuevo en las 28 y nada más. El diff son 28 líneas, y fuera del blob el contenido es idéntico.
- **Comprobado:** es byte a byte la copia con la que el banco dio **VERDE 87/87**.

### El sello de la vara

De las 28 apariciones, 27 están en `blobs` de las celdas re-selladas y **1 en `motor`, la cabecera del archivo**. Esa cabecera hace falta, porque las otras 60 celdas tienen `blobs: null` y se comparan por ella (`bancoNiveles.mjs:1933`). Pero también entraba en el sello que vigila `scripts/testBancoBandas.test.js` («quitando lo añadido vuelve el archivo sellado, byte a byte»), y el ajuste E lo puso en rojo.

**Comprobado aparte:** la vara de `HEAD` da el sello, la de disco no, y la de disco con esa cabecera restaurada lo da otra vez. Ninguna cifra medida se movió.

**Decisión del rector:** la prueba restaura la cabecera sellada antes de calcular el hash. El sello `02c3e5c598b3` no cambia, y la próxima apertura del motor no tropieza aquí. Que la cabecera sea la vigente lo vigila `banco:verificar`.

---

## 4 · El sentido de las sillas

| Dónde | Qué hace | ¿Cuadra con C-1? |
|---|---|---|
| Mesa, `seatLayouts.js:5-10` | `bottom → derecha → arriba → izquierda`: antihorario desde el asiento 0 | **Sí** |
| Mesa, `seatLayouts.js:47-48` | El asiento 0 va siempre abajo y no se rota por cliente | **No para PvP:** cada cliente tiene que verse abajo |
| Sala de espera, `SalaEspera.jsx:588` | No rota: pasa el índice tal cual (`salaEsperaCore.js:47-48`) | **No:** el anfitrión se pinta arriba y cada cliente no se ve abajo |
| Sala de espera, `salaEsperaCore.js:138-141` | `-π/2 + 2πi/n` con la y hacia abajo: silla 0 arriba, 1 a la derecha, 2 abajo. **Sentido horario** en pantalla. Lo fija su prueba, `salaEsperaCore.test.js:200` | **No** |

Solo leído. Va a MES-PvP, sin arreglar nada. `seatLayouts.js` es protegido, así que la rotación por cliente tendrá que hacerse fuera de él.

---

## 5 · Decisiones que el contrato no cubría

- **Reclamar:** no es una pieza aparte, es una acción más de `aplicarAccion`.
- **Crear la partida:** `crearPartida` devuelve versión 0, como pide la ficha. El «primer `reclamar_vencimiento`» del §2 es la 1e llamándola cuando no hay partida; esa respuesta no sube la versión.
- **Forma del resultado:** `{ estado, respuesta, efectos }`. `respuesta` es la del §2 y `efectos` es lo nuevo para la 1e.
- **`entrada`:** llega como `'corta'` o `'llena'`, y la 1d-i tiene que guardarla igual o traducirla.
- **Elegir durante el reparto del sorteo:** responde `fase`, porque la elección se abre al reclamar el fin del reparto.
- **Abandono en el sorteo:** sale y cobra en el acto, y no se le quita de la ronda. Elige al instante la posición 0 (retoque 2); si gana, la Mano pasa al siguiente vivo. Con un solo vivo, la partida termina.
- **Abandono en `PAYOUT`:** cobra en el acto, con el premio ya en la pila.
- **Todos abandonados:** nadie puede reclamar, porque la comprobación 4 lo impide. Queda para la partida muerta de 15 min (1d-i).
- **Eliminado por no cubrir el ante:** su `salida` con el residuo va al eliminarse, no al final de la partida.
- **`k` en `apostar` y `subir`:** se pasa `null` si falta, porque `esLegal` tiene `k = 1` por defecto y un `apostar` sin `k` habría sido legal.
- **`ajileiDe`:** es una segunda copia de `lib/puntos.ajileiDe`, que no carga en el servidor porque sus especificadores no llevan extensión. Una prueba las confronta. El árbitro no calcula `puntos_base` ni `extra`: los deriva el SQL.
- **Duración de los repartos:** el contrato da 300 · 600 · 900 ms, pero la espera real de la mesa acaba en 2000 × factor (`GameTable.jsx:855`), y uso esa. También 120 y 400 ms, que no escalan.
- **Revelación:** 960 ms, una coreografía completa de `REVEAL_CHOREO`. La mesa real además celebra, con tope de red de 6 s, así que los 4,96 s pueden quedarse cortos; MES-PvP.
- **`FACTOR_RAPIDA`:** `esperas.js` lo reexporta de `partidaRapida.js`, de modo que tiene una dependencia. Es un módulo sin imports y la ficha lo permite.
- **Vista, de más:** `handCount` y los campos del sorteo `participan`, `etapa`, `empatados`, `azar` y `mano`, que hacen falta para mandar `ronda`, `mano` y saber quién es la Mano.
- **Vista, de menos:** el ganador de la partida en `GAME_OVER` no sale: el cliente lo deduce de quién sigue sin eliminar.
- **`manoCore`:** sin el respaldo, una capa 0 sin ganador devuelve `null` en vez de inventar. El caso no ocurre: la capa 0 siempre tiene el all-in que la define o a quien se queda.

**Semillas `apu` y `u3`:** no se tocan, porque el azar no cambió. `aislado` las pondrá a prueba en los commits del §9.

---

## 6 · Mapa archivo → commit

Orden núcleo → cliente → árbitro → arnés → informe. Cada commit se prueba con `aislado` en el §9.

| # | Commit | Rutas |
|---|---|---|
| 1 | `MOT-1b-a: edición 3 y el comentario del motor, con su fila de Protegidos` | `src/engine/gameEngine.js` · `docs/AJILEI_Protegidos_v1.0.md` · `scripts/apu1_bandas.json` · `scripts/testBancoBandas.test.js` |
| 2 | `MOT-1b-b: las esperas y la capa 0 en el cliente` | `src/config/esperas.js` · `src/components/GameTable.jsx` · `src/hooks/mesaIACore.js` · `src/hooks/manoCore.js` |
| 3 | `MOT-1b-c: el árbitro, sin red y sin base` | `src/arbitro/` (11 archivos, con sus pruebas) |
| 4 | `MOT-1b-d: el árbitro en el guardián de la entrada` | `scripts/testEntradaLigera.test.js` |
| 5 | `MOT-1b-e: informe de la Fase 1b y el contrato al día` | `docs/reportes/AJILEI_MOT-1_Fase1b_Informe_v1.0.md` · `docs/AJILEI_MOT-1_Contrato_v1.0.md` |

El orden es obligado: las pruebas del árbitro confrontan el `import` de `TURN_TIME` de la mesa (2 antes que 3), y el guardián comprueba que sus rutas existan (3 antes que 4).

---

## 7 · Los ajustes y los retoques del rector

| | Ajuste | Cómo quedó |
|---|---|---|
| **A** | Sin doble pago | Al emitir `salida`, la pila queda en 0 y el monto pasa a `asientos[i].cobrado`. La conservación es pilas + pozo + cobrado = constante, comprobada en cada paso del recorrido al azar |
| **B** | El abandonado actúa al instante | En su turno se retira, y en el descarte descarta vacío, sin reloj. Si eso destapa otro abandonado, sigue en la misma acción y sube una sola versión |
| **C** | `abandonado` en la vista | Por asiento, junto a `folded`, `allIn` y `eliminated`, para todos |
| **D** | Reparto del sorteo por oleadas | `ESPERA_REPARTO_SORTEO_MS` = 120 + 5 × 297,5 + 400 = **2008 ms**, con 2 o con 5 asientos, en todas las rondas |
| **E** | La vara, sin re-sellar | Hecho, con la consecuencia del §3 |
| **1** | `cobrado` en la vista | Por asiento: `null` hasta que sale, y luego lo que se llevó. Es de donde lee la pantalla final de MES-PvP |
| **2** | En el sorteo, el abandonado elige al instante | La posición 0, al abandonar o al abrirse la elección, también en los desempates. Si era el último que faltaba, voltea en el acto |
| **3** | El contrato, al día | §4, §6 y §7, con A–D y los retoques 1 y 2. Va en el commit 5 |

**Lo que decidí al aplicarlos:**

- **Asiento que cobra en el mismo cierre:** `mano_cerrada` lo lleva con pila 0, y su dinero va solo en `salida`. Esas pilas son las que paga la partida muerta (contrato §7), así que con la pila anterior habría cobrado dos veces.
- **Quien abandona tras descartar:** conserva su descarte.

**Aviso para la ficha de la 1e:** una `salida` fuera de un cierre (en el sorteo, en `PAYOUT` o por no cubrir el ante) no reescribe las pilas de SQL. La 1e tiene que poner a 0 la de ese asiento en la misma transacción; si no, la partida muerta la paga otra vez.

---

## 8 · Los commits

`npm run aislado -- <sha> --perfil=commit`, cada uno por separado:

| Commit | Resultado | `vitest` | `eslint` | `1.8b` y humo |
|---|---|---|---|---|
| `d55a5e6` MOT-1b-a | **Verde**, 870 s | 97/97 archivos, 2194 pruebas | 0 y 0, igual a la base | Código 0 los dos |
| `16f7045` MOT-1b-b | **Verde**, 815 s | 97/97 archivos, 2194 pruebas | 0 y 0, igual a la base | Código 0 los dos |
| `459e057` MOT-1b-c | **Verde**, 807 s | 99/99 archivos, 2240 pruebas | 0 y 0, igual a la base | Código 0 los dos |
| `1357d83` MOT-1b-d | **Verde**, 805 s | 99/99 archivos, 2240 pruebas | 0 y 0, igual a la base | Código 0 los dos |

MOT-1b-e, el commit de este informe, se prueba igual; su resultado va en el chat.

**Andamio arreglado.** El humo necesita el 5173 y lo ocupaba el Vite de la prueba de Victor, y `aislado` no deja elegir puerto. Una precarga fuera del repo añadió `--puerto=5175` solo a `diagDSK`, y el log confirma que el humo corrió allí. Ni el repo ni ese servidor se tocaron.
