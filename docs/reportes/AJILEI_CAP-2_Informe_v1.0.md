# AJILEI · CAP-2 · La maestra vertical, re-sellada · Informe v1.0

**Ficha:** las tres notas del rector de 2026-10-11 y 2026-10-12 (diagnóstico de H-1, tanda corta CAP-2 y aprobación del sello) · **Base:** `main` en `b4b6ffa` · **Fecha:** 2026-10-12
**Ejecutor:** Claude Code · **Rector:** Claude (chat) · **Decisor:** Victor
**Instrumento:** Chromium 151.0.7922.34 (playwright-core 1.62.1), `vite preview` en 4173.
**Estado:** STOP antes de la ceremonia de commit. Sin `git add` y sin commits.

---

## 0. Resumen

- **`diagPUE cap` vuelve a estar verde: 31 de 31.** Tenía un rojo, `cap.regresion v`, desde PAN-1b (H-1 del informe de la 1e).
- **El rojo era un cambio querido.** El piso táctil de PAN-1b ensanchó los multiplicadores del vertical. La foto de la mesa cambió y nadie re-selló la maestra, porque `cap` solo corre por su nombre y ninguna fila del registro lo citaba.
- **Se re-selló solo la vertical** (`maestras/portada/mesav.png`), por copia directa más la huella. La horizontal y la de escritorio no cambiaron ni un byte.
- **El registro gana la fila de `diagPUE cap`** en su §6, con la regla del re-sello en el mismo commit, una nota fechada sobre PAN-1b y un pendiente para DIS-1.
- **No se tocó `src/` ni `scripts/`.** Nada cambia en el juego: no hay validación en el teléfono.
- **iOS: nada que validar** (INV-41): no cambia nada que llegue a un navegador.

---

## 1. El diagnóstico de H-1, resumido

Se hizo el 2026-10-11, de solo lectura, en copias de `git archive` fuera del repo.

**Qué commit la movió.** De los 70 commits de `59ad115..b4b6ffa`, 39 tocan algo que llega a la foto. Se midieron ocho, cada uno con su propio arnés:

| Commit | Qué es | `cap.regresion v` | Huella de la foto |
|---|---|---|---|
| `59ad115` | CAP-1b, el sello | verde, 0 px distintos | `198289a8…` (la sellada) |
| `c7ff937` | VOZ-2c, el último con el arnés viejo (Edge) | verde, 0 px | `198289a8…` |
| `5792782` | ARN-3e-2 | verde, 0 px | `198289a8…` |
| `3d1b19e` | cierre de ARN-3, padre del culpable | verde, 0 px | `198289a8…` |
| **`8009d4f`** | **PAN-1b: piso táctil Z** | **rojo:** 99,309 % · Δmáx 212 · 15.867 px | `b2ef85c5…` |
| `77e880b` | PAN-1c | rojo, las mismas cifras | `b2ef85c5…` |
| `3cf229b` | ECO-1c | rojo, las mismas cifras | `b2ef85c5…` |
| `b4b6ffa` | HEAD | rojo, las mismas cifras | `b2ef85c5…` |

- **El instrumento no cambió.** `59ad115` sale verde y al byte con el Edge de hoy (155; se selló con 154), y tras el paso a Chromium 151 en ARN-3a la foto sigue saliendo al byte.
- **La foto cambió una sola vez.** De `8009d4f` a HEAD es la misma al byte: PAN-1c y ECO-1b, 1c y 1d no añadieron nada.
- La horizontal y la de escritorio salen verdes en los ocho.

**Qué cambió en la foto.** Solo la fila del cronómetro y los multiplicadores, encima de Pasar, Apostar y Retirarse: una banda de 26 px de alto (y 541–567, x 77–283, en px CSS). Fuera de ella no cambia ni un píxel. Es geometría, no color.

| Pieza | Antes | Ahora |
|---|---|---|
| ×1, ×2 y ×5 | 31,70 px de ancho | 35,50 (+3,80 cada uno) |
| ×10 | 38,38 | 38,38 |
| La fila entera | 194,50 de ancho | 205,89 (+11,39); sigue centrada |
| ×1 · ×2 · ×5 · ×10 (posición) | | −5,70 · −1,91 · +1,89 · +5,69 |
| Cronómetro «20s» | | 5,70 px a la izquierda, con el mismo tamaño |

Nada se mueve en vertical. La sonda vio además cinco zonas táctiles nuevas (la ✕ y las cuatro fichas de las IAS): son transparentes y no pintan.

**La causa.** `src/styles/tactil.css:29`, `.btn-mult { position: relative; min-width: 35.5px; }`, dentro del bloque de `:26` (vertical, teléfono y `pointer: coarse`). El cronómetro es el primer hijo de esa misma fila centrada, y se va con ella. La horizontal y la de escritorio no cumplen la condición.

**Por qué nadie lo vio.**
- `cap` no entra en `todo` de `diagPUE` ni en `humo`: solo corre por su nombre.
- Ninguna fila del registro citaba `diagPUE cap`. PAN-1b sacó sus varas de INV-04 e INV-07, y por ahí no se llega.
- PAN-1b sí midió el cambio con su sonda y lo declaró (`AJILEI_PAN-1_1b_Informe_v1.0.md:187-188`: 31,7 → 35,5, ×1 Δx −5,71, ×10 Δx +5,68). Nadie lo relacionó con una foto sellada.

Las imágenes del diagnóstico (la maestra, la foto nueva y el mapa de diferencias) se entregaron a Victor en el chat. No están en el repo.

---

## 2. La decisión

- **El cambio es querido.** Es el camino Z, que Victor eligió en la lámina de la 1a de PAN-1 (`AJILEI_PAN-1_Cierre_v1.0.md:11`).
- **El cronómetro.** El informe de la 1b no lo nombraba. Victor revisó la zona ampliada y aprobó también su corrimiento de 5,7 px a la izquierda.
- **La frase «sin cambiar nada de lo que se ve»** del cierre de PAN-1 y de la cabecera de `tactil.css` no es exacta en vertical. Queda anotado en el registro (§3.2). Los documentos de PAN-1 no se reescriben.
- **Cómo se selló.** `--sellar` copia siempre las tres maestras y reescribe `cap.json` entero (`scripts/diagPUE.mjs:1989-2007`). El rector aprobó la copia directa más la huella, sin tocar `scripts/`.

---

## 3. Lo hecho

### 3.1 El sello

- **La foto.** La primera pasada de `diagPUE cap` sobre `b4b6ffa`, tomada el 2026-10-11 a las 18:44 (hora local). Sus dos pasadas salieron iguales al byte, con sus nueve puertas en verde (escena, mano, pozo, IAS, saldo, cronómetro, red, errores y estable).
- **La copia.** `capturas-cap/maestras/mesav.png` → `maestras/portada/mesav.png`, comprobada con `cmp` y con sha256.
- **`maestras/portada/cap.json`.** Cambia solo la entrada `"mesav.png"`: `bytes`, `sha256` y un bloque `resello` nuevo. El bloque existe porque los campos de arriba del archivo (`campana`, `edge` y `generado`) describen el sello de CAP-1 y serían falsos para la vertical.

| | Antes | Ahora |
|---|---|---|
| `mesav.png` · sha256 | `198289a8f290fca3…` | `b2ef85c5638e86bc…` |
| `mesav.png` · bytes | 1.169.975 | 1.169.655 |
| `mesah.png` · sha256 | `1e13575a3f10a1f1…` | el mismo |
| `mesapc.png` · sha256 | `6bca77f6bb092d3c…` | el mismo |
| `cap.json`, sin la entrada `"mesav.png"` | | idéntico (comparado clave a clave) |

El bloque nuevo:

```json
"resello": {
  "campana": "CAP-2",
  "generado": "2026-10-12T05:32:06.487Z",
  "navegador": "Chromium 151.0.7922.34",
  "motivo": "PAN-1b (8009d4f): src/styles/tactil.css:29",
  "anterior": "198289a8f290fca3bc603e5e2b4b941fd3b34bc21c3323101a0573e431ad43bc"
}
```

`generado` es el momento del sello. `cap.json` sigue siendo traza y no puerta: ningún script lo lee.

### 3.2 El registro (`docs/AJILEI_Invariantes_v1.0.md`)

- **§6, fila nueva de `diagPUE cap`:** puerto 4173, 2 min 36 s. Es condicional: corre si lo tocado cambia lo que se pinta en la mesa (`src/styles/`, `GameTable.jsx` y sus componentes, las cartas, el tapete o las fuentes). Si el cambio es querido, la maestra se re-sella en el mismo commit.
- **La columna «En humo» de esa fila dice «—», no «no».** La leyenda de la §6 reserva «sí» y «no» para los modos de `diagDSK`, y `testInvariantes` sale rojo con un «no» en un modo de `diagPUE`. Que no entra en `humo` ni en `todo` está escrito en la celda «Qué vigila». Aprobado por el rector.
- **Bloque «Sobre `diagPUE cap`»,** bajo la tabla:
  - qué compara, y que `cap.json` es traza;
  - por qué estuvo en rojo sin que nadie lo viera;
  - la regla del re-sello;
  - la nota fechada sobre PAN-1b, con la aprobación de Victor;
  - el pendiente de DIS-1.
- **Cabecera «Actualizado»:** la línea de CAP-2.

**Filas del registro tocadas:** ninguna de la tabla de invariantes (§2). Solo la §6 y la cabecera.

---

## 4. Varas

Corridas en serie sobre el árbol final, con un solo build (INV-35).

| Vara | Resultado | Duración |
|---|---|---|
| `npm run build` | correcto (el aviso de chunks de más de 500 kB es el de siempre) | 5 min 8 s |
| `diagPUE cap`, con `--sin-build` | **31 de 31 en verde**, código 0; aislamiento verde, 0 escapadas | 2 min 37 s |
| vitest entero | **1.499 de 1.499**, en 62 archivos. `testInvariantes`, 70 de 70 con la fila nueva | 7 s |
| lint | **21**, los mismos (20 errores y 1 aviso) | 11 s |

Dos notas:
- **La primera pasada de la vertical cayó en el otro estado de raster** (`567dbcdb…`; la segunda, en el sellado, `b2ef85c5…`). Por eso `cap.regresion v` sale verde por tolerancia y no al byte: 99,979 % de los píxeles con Δ ≤ 2 y Δ máximo 30, contra una vara de 99,9 % y 40. Es lo que CAP-1 dejó descrito: cada vista tiene dos estados que solo difieren en los degradados, y la vara es por tolerancia por eso. La horizontal y la de escritorio salieron al byte.
- **El build tardó 5 min 8 s.** En las copias del diagnóstico, el build y las seis pasadas juntos tardaban 2 min 38 s. No investigué la causa: el resultado es correcto y el bundle no cambia.

Antes del sello, la misma corrida daba 30 de 31, con `cap.regresion v` en rojo y las cifras de H-1.

---

## 5. La guardia de diff

`git diff --stat` contra `b4b6ffa`:

```
 docs/AJILEI_Invariantes_v1.0.md |  10 +++++++++-
 maestras/portada/cap.json       |  11 +++++++++--
 maestras/portada/mesav.png      | Bin 1169975 -> 1169655 bytes
```

Más este informe, nuevo. `git diff --stat -- src scripts supabase` está vacío. Los tres archivos de texto están en LF.

---

## 6. Pendientes

- **Candidata para ARN-4: `--sellar=v`.** Sellar una sola maestra desde el capturador, con su prueba y su control (rojo con el defecto puesto y verde al quitarlo). La regla nueva de la §6 hará que esto se repita, y hoy un re-sello de una sola vista es una operación a mano. Con ella, la entrada de `cap.json` debería llevar la traza por maestra, como el bloque `resello` de hoy.
- **Para DIS-1: el teléfono de la escena 5.** `src/assets/portada/dis_telefono.webp` se horneó desde la `mesav.png` anterior (`maestras/dis1/telefono.json:13`), así que enseña los multiplicadores viejos. Se regenera la próxima vez que DIS-1 rehaga sus recursos. Está anotado en el registro.
- **La og-image no se toca:** sale de `mesah.png`, que no cambió.

---

## 7. Cierre de terreno

- **Repo:** sin `git add` y sin commits. Los seis archivos sin rastrear de antes de la tanda siguen sin tocar (tres informes de MOT-1 e iOS y tres de `laminas/mon1/`).
- **Puertos y procesos:** ninguno abierto entre 4170 y 5200, y ningún `node` ni navegador del arnés vivo.
- **Copias del diagnóstico:** en el scratchpad de la sesión, sin uniones (las 151 se quitaron con `rmdir`, 0 fallos). Las borra Victor.
