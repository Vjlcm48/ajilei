# AJILEI · REC-1 · Recarga sin tapar la mesa
## Informe de cierre · v1.0

**Fecha:** 2026-09-26
**Ficha:** `AJILEI_REC-1_Commits_v1.0.md`
**Base:** `main` en `736eb63`
**Informes de la campaña:**
- `AJILEI_REC-1_Fase0_Informe_v1.0.md` (diagnóstico);
- `AJILEI_REC-1_Fase1_Informe_v1.0.md` (tarjetas con aire y burbuja).

**Normativo:** `docs/AJILEI_APU-1_Reglas_v1.2.md`, con la corrección de cierre aplicada en C-0.

---

## 1 · Resumen

**La recarga ya no tapa el resultado de la mano.** La automática y la forzosa se presentan primero como una **burbuja** en la ranura reservada de la barra del jugador (doctrina O1), y solo se abren como tarjeta cuando el jugador la toca o cuando quedan 5 s.

- **La burbuja (variante C):**
  - oscura, con filo dorado y el reloj en un **anillo** que se vacía, con los segundos dentro;
  - a la derecha, el icono y «Recargar»: **triángulo de alerta** en la forzosa y **Heptacoin** en la automática;
  - **sin velo**: mientras es burbuja, la mesa se puede tocar y los nombres de las IAS se destapan.
- **Un solo reloj.** El plazo de 15 s arranca **al terminar la revelación** (el aterrizaje del vuelo de fichas), no al montarse la pregunta. Abrir y plegar no lo reinician.
- **Plegable.** La tarjeta abierta desde la burbuja se vuelve a plegar con «Ver la mesa» mientras queden más de 5 s.
- **Apertura sola a los 5 s.** En los últimos 5 s la tarjeta se abre sola y queda fija. Al vencer, la forzosa saca de la mesa y la automática devuelve «Siguiente mano».
- **La voluntaria no cambia:** tarjeta sin burbuja ni plazo.

**Las tarjetas tienen el aire de A5 en todas las pantallas.** Escritorio y teléfono apaisado se suman al vertical. El cronómetro va a la izquierda en las dos tarjetas, con «Ver la mesa» a su derecha. En el teléfono apaisado la forzosa es compacta, con las dos acciones en fila.

**El normativo pasa a la v1.2** (enmienda REC-1 más la corrección de cierre): §5.1, §5.4, §5.5 nuevo (la burbuja), §10 y §13. La v1.1 se conserva como historia.

**Qué cambió en el código:**

| Pieza | Cambio |
|---|---|
| Lógica pura | `src/hooks/mesaCore.js`: `APERTURA_SOLA_S`, `RED_REVELACION_MS`, `recargaLista`, `formaRecarga`, `abrirRecarga` y `plegarRecarga`, con 13 pruebas en `scripts/testRecargaREC1.test.js` |
| Componente nuevo | `src/components/BurbujaRecarga.jsx` |
| Hoja nueva | `src/styles/rec.css`, último import de `GameTable.jsx` (tras `rev.css`) |
| Tarjetas | `src/styles/apu.css`, bloques §9–§12 al final |
| Integración | `src/components/GameTable.jsx`: `abierta`, fin de la revelación, la forma, la ranura, «Ver la mesa» y el gate de «Iniciar mano» |
| Textos | `ia.recarga.vermesa`, `ia.recarga.aria.forzosa` e `ia.recarga.aria.automatica` |
| Arnés | Modo `rec` (siete puertas y anillo) y el modo `apu` ajustado, en `scripts/diagDSK.mjs` |
| Documentos | Normativo APU-1 v1.2 y nota 9 del Sistema de Diseño |

---

## 2 · Decisiones

### De la Fase 0

| # | Decisión | Dónde |
|---|---|---|
| K-1 | **Fin de la revelación:** el aterrizaje del vuelo de fichas hacia el ganador (+3,72 s medidos). En una mano sin vuelo, en el acto. Red de 6 s | Fase 0 §K → ficha de la Fase 1 §0 |
| K-2 | **La automática también pasa a burbuja:** la burbuja y el reloj son iguales, cambia el icono | Ídem |
| K-3 | **Plegar, sí:** con «Ver la mesa», mientras queden más de 5 s. En los últimos 5 s la tarjeta se abre sola y queda fija | Ídem |
| K-4 | **La forzosa en el teléfono apaisado entra en la Fase 1** («Salir» a 28 px, §J-3) | Ídem |

### De la lámina (Victor)

| # | Decisión |
|---|---|
| L-1 | **Variante C:** burbuja oscura con filo dorado y el reloj en un anillo con los segundos dentro. El rector avisó de que en el teléfono el número queda pequeño; se garantiza por vara (anillo ≥ 32 px, número ≥ 12 px a 700, contraste ≥ 4,5) |
| L-2 | **La moneda en la automática** es la Heptacoin del juego (`heptacoin.svg?no-inline`, como `ChipToken`), no una dibujada. Triángulo de alerta en la forzosa |
| L-3 | **«Ver la mesa» junto al reloj:** cronómetro a la izquierda y el botón a su derecha, en la misma fila |

### De la Fase 1 (ficha de commits)

| # | Decisión |
|---|---|
| K-1 | **La blanda abierta en escritorio se acepta.** Durante la revelación ya no tapa nada (antes, el 24–27 % de la mano en el instante del resultado). Abierta tapa el 73,6 %, pero solo cuando el jugador la abre o en los últimos 5 s. El §5.4 lo dice |
| K-2 | **La automática sin título en el teléfono vertical se sella:** es lo que dibuja la lámina y la burbuja ya hizo de encabezado |
| K-3 | **La cifra del §5.4 se corrige en la propia v1.2**, que aún no estaba commiteada: «≤ 163 px y 0 px² sobre las cartas» |
| H-1 | **El bloqueo de «Iniciar mano» con la forzosa pendiente se acepta** |
| D-1…D-5 | **Aceptadas:** automática sin título en vertical estrecho (D-1); `recargaSeg` a 15 al montar y el tic retrasado (D-2); la clave `ia.recarga.vermesa` en minúsculas (D-3); `position: relative` solo en `.action-area.rec-ranura` (D-4); los ajustes del modo `apu` (D-5) |
| — | **La fragilidad de `tel.linea` en `apu`** va a la tanda de higiene del arnés, junto con sembrar la IA en ese punto |

---

## 3 · Cifras

### La burbuja

| Medida | Valor |
|---|---|
| Primer «15» visible | **+3,73 s** (+3 726 a +3 740 ms en los cuatro casos), en el fotograma del aterrizaje |
| Red de 6 s | **nunca** saltó |
| Lo protegido que pisa la burbuja | **0 px²** en las **13 celdas** |
| Cuánto mueve la maqueta | **0 px** en las 13 celdas |
| Anillo | **34 px** de diámetro (vara ≥ 32) |
| Número | **14 px** a 700 (vara ≥ 12) |
| Contraste del número y del trazo | **9,66 : 1** (vara ≥ 4,5), el peor de los dos compuestos: sobre negro y sobre `#235c38` |

### Las tarjetas

Separaciones en px: entre montos · entre acciones · montos → acciones · acciones → cronómetro.

| Celda | Tarjeta | Antes | Después |
|---|---|---|---|
| Escritorio (1920, 1366, 1280, 1024) | forzosa | 8 · 10 · **0** · **0** | **14 · 14 · 18 · 16** |
| Escritorio (1920, 1366, 1280, 1024) | automática | 8 · 10 · **0** · **0** | **12 · 12 · 14 · 10** |
| Teléfono apaisado (915×412, 844×390, 640×360) | forzosa | 6 · 10 · **0** · **0** | **12 · 14 · 14 · 10**, compacta en fila |
| Teléfono apaisado (844×390, 640×360) | automática | 8 · 10 · 10 · **0** | 8 · 10 · 10 · **10** |
| 360×640 | forzosa y automática | A5 | A5, siguen verdes |

| Botón | Antes | Después |
|---|---|---|
| «Salir con mis fichas», escritorio | **33 px** | **42 px** |
| «Salir con mis fichas», teléfono apaisado | **28 px** | **42 px** |

- **La forzosa compacta cabe entera** en el apaisado: 222,48 px de alto y ≥ 68 px de aire arriba y abajo.
- **La automática en 360×640** mide 163 px, sin título, y pisa 0 px² de las cartas.
- **La blanda abierta en escritorio** crece +45,11 px y tapa el 73,6 % de la mano en 1024, 1280 y 1366 (aceptado, K-1 de la Fase 1).

**Comprobaciones de la campaña:** modo `rec` VERDE (siete puertas y anillo), `apu` 7/7, `gate` 6/6, `luz` y `rev` VERDES, pruebas 1 006/1 006.

---

## 4 · Lecciones para la doctrina

1. **Una pregunta con plazo no se monta en el mismo render que un resultado.** Espera a que termine la lectura de la mesa, y el reloj también. La tarjeta de recarga se montaba en t = 0 de `PAYOUT` y tapaba el resultado durante los 3,72 s en que el jugador lo estaba leyendo; el plazo, además, corría durante esa lectura.
2. **Desmontar, no esconder.** Un `visibility` en línea en un hijo gana a la herencia (§J-8 de la Fase 0): el cronómetro seguía visible dentro de una tarjeta «escondida». La tarjeta plegada se desmonta.
3. **No se edita `src` con corridas del arnés en marcha.** El HMR de Vite recarga las páginas que el arnés tiene abiertas (H-5 de la Fase 1).
4. **Un punto del arnés que depende del azar de las IAS necesita la IA sembrada, no más intentos.** `tel.linea` pasó con 400 iteraciones en el tercero de tres intentos: subir el presupuesto solo esconde la fragilidad.

---

## 5 · Pendientes con dueño

| Pendiente | Dueño |
|---|---|
| `tel.linea` en el modo `apu` y sembrar la IA en ese punto | La tanda de higiene del arnés |
| El molde `allinHumano`, que descuenta mal el saldo (§J-5 de la Fase 0) | La tanda de higiene del arnés |
| H-2 de LUZ-1: el bypass con `'0'` | La tanda de higiene del arnés |
| H-1 de LUZ-1 (`mkdirSync` sin importar): **quedó resuelto aquí** (D-5) | — |
| La sonda del modal de bancarrota, que parece inalcanzable (§J-6 de la Fase 0) | Una sonda propia |
| H-1 de la Fase 1 (la forzosa entre manos): arreglado, pero sin reproducción en el arnés | Un molde que siente al humano ya en forzosa |
| Vistazo en el iPhone de la familia (WebKit) | Victor |

---

## 6 · Serie de commits

Sobre `736eb63`, cinco commits atómicos por ruta explícita, con build limpio tras cada uno:

| Commit | SHA | Rutas |
|---|---|---|
| REC-1a: lógica pura de la recarga en burbuja (recargaLista, formaRecarga, un solo reloj) y sus pruebas | `5c9d81d` | `src/hooks/mesaCore.js` · `scripts/testRecargaREC1.test.js` |
| REC-1b: burbuja de recarga sin velo tras la revelación y tarjetas con el aire de A5 en todas las pantallas | `553eb5a` | `src/components/BurbujaRecarga.jsx` · `src/styles/rec.css` · `src/styles/apu.css` · `src/components/GameTable.jsx` · `src/config/textos.es.js` |
| REC-1c: modo rec del arnés (siete puertas), varas de apu en escritorio y apaisado, e ignorar capturas-rec/ | `9ff0897` | `scripts/diagDSK.mjs` · `.gitignore` |
| REC-1d: informes de las fases 0 y 1, normativo APU-1 v1.2 y nota 9 del Sistema de Diseño | `52a9e35` | `docs/reportes/AJILEI_REC-1_Fase0_Informe_v1.0.md` · `docs/reportes/AJILEI_REC-1_Fase1_Informe_v1.0.md` · `docs/AJILEI_APU-1_Reglas_v1.2.md` · `docs/AJILEI_Sistema_Diseno_v1.2.md` |
| REC-1e: informe de cierre de REC-1 | este commit | `docs/reportes/AJILEI_REC-1_Informe_Cierre_v1.0.md` |

No se commitean `capturas-rec/` (ignorada) ni los residuos conocidos: los dos informes de MOT-1, los tres archivos de `laminas/mon1/` y `scripts/_cel1bFila.mjs`.

---

## 7 · Verificación de protegidos

Los seis archivos de la lista canónica, medidos en el árbol de trabajo al cerrar REC-1, frente a la instantánea del §3 de `AJILEI_Protegidos_v1.0.md`:

| Archivo | blob git (instantánea) | blob git (medido) | sha256 (16) medido | líneas | ¿Coincide? |
|---|---|---|---|---|---|
| `src/engine/gameEngine.js` | `21c4d3f56318` | `21c4d3f56318` | `317452ec5b57408a` | 748 | Sí |
| `src/engine/aiPlayer.js` | `8cfc3736cba2` | `8cfc3736cba2` | `3a8ea7b0386c7ddf` | 1445 | Sí |
| `src/engine/deck.js` | `eb61426083ca` | `eb61426083ca` | `69f92d6b9aac433c` | 69 | Sí |
| `src/config/seatLayouts.js` | `0d1bb8ea66a8` | `0d1bb8ea66a8` | `0049051fd4b8b891` | 59 | Sí |
| `src/styles/opponentPanel.css` | `3ce6383eec0d` | `3ce6383eec0d` | `50c98d51a91c3994` | 1084 | Sí |
| `src/styles/gameTable.css` | `1e21371c8543` | `1e21371c8543` | `269120a496910995` | 6289 | Sí |

**Los seis coinciden** en blob, sha256 y líneas con la instantánea, y son también el blob de `736eb63`. `git diff --stat 736eb63` sobre los seis sale vacío.

REC-1 **no tocó el motor**: `gameEngine.js`, `aiPlayer.js` y `deck.js` no se abrieron en ninguna fase. `gameTable.css` y `opponentPanel.css` solo se leyeron para citarlos; `rec.css` y `apu.css` ganan por orden de import y especificidad.
