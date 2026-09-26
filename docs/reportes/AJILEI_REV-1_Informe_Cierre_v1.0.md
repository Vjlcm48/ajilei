# AJILEI · REV-1 · Reverso único
## Informe de cierre · v1.0

**Fecha:** 2026-09-25
**Ficha:** `AJILEI_REV-1_Commits_v1.0.md`
**Base:** `main` en `808b580`
**Informes de la campaña:**
- `AJILEI_REV-1_Fase0_Informe_v1.0.md` (diagnóstico);
- `AJILEI_REV-1_Fase1_Informe_v1.0.md` (copia e integración).

---

## 1 · Resumen

La baraja tiene **un solo reverso**, `reverso_carta.svg`, y dentro de la mesa se usa **una copia de mesa**, `reverso_carta_mesa.svg`. La copia tiene la proporción de las caras (1005×1420 = 0,708) y **sólo ensancha la tela**: el campo vinotinto y su raya llegan hasta el filo, y el marco, los broches, el isotipo y las estrellas son los mismos, en las mismas coordenadas. El original sigue en la Portada y en la sala de espera.

La copia se genera desde el original con `node scripts/gen-reverso-mesa.mjs`; con `--comprobar` verifica sin escribir.

**Qué se ve distinto:**

- **El dibujo completo en las cajas anchas.** La carta del humano en escritorio y en teléfono apaisado, la voladora hacia él y la IA de mesa 2 en S25 horizontal perdían arriba y abajo el 4,2 % del alto: los broches se cortaban y el marco tocaba el filo. Ahora se ven enteros.
- **El dibujo completo en las cajas intermedias** (0,642–0,656: mazos de móvil y el humano en vertical). Antes perdían el 0,1–1,2 % por lado; ahora se ven enteros y un poco más pequeños.
- **El anillo del mazo, el abanico y la voladora sobre vinotinto.** Antes el borde dorado al 45 % dejaba ver el fieltro debajo.

**Qué cambió en el código:**

| Pieza | Cambio |
|---|---|
| Recurso | `src/assets/cards/reverso_carta_mesa.svg` y su generador, `scripts/gen-reverso-mesa.mjs` |
| Integración | Una línea de `PlayingCard.jsx` (el import) y una de `GameTable.jsx` (importar `rev.css` al final) |
| Hoja nueva | `src/styles/rev.css`: una regla con la copia y el fondo `#41101c` en mazo, voladora y abanico |
| Arnés | El modo `rev` en `scripts/diagDSK.mjs` |
| Documentos | Nota 8 del Sistema de Diseño |

---

## 2 · Decisiones

| # | Decisión | Dónde |
|---|---|---|
| K-1 | Para las cajas anchas, **la copia «con más tela»**: ni `contain` (dejaba tiras lisas) ni otro diseño | Fase 0 §K-1 → Fase 1 §0 |
| K-2 | **La escala del mazo se acepta:** a menos de 50 px las estrellas se leen como puntos. Sólo se corrige la (d), el fondo vinotinto. No se crea ningún reverso «pequeño» | Fase 0 §K-2 → Fase 1 §0 |
| STOP 1 | **Vara 3 de la 1a aceptada:** el exceso como `background` en dos cajas estrechas es fase de subpíxel del raster; en vectorial, las 10 cajas dan ≤ 0,17 | Rector, sobre el STOP 1 |
| STOP 1 | **Cajas intermedias aceptadas:** el dibujo entero y ligeramente más pequeño. En la puerta 2 cuentan según su lugar y se reportan aparte | Rector, sobre el STOP 1 |
| STOP 2 · 1 | **Las tres correcciones del laboratorio de la puerta 4 se aceptan** (borde, fase de subpíxel y capa compuesta). El umbral de 12 no cambia | Esta ficha |
| STOP 2 · 2 | **La subida del Δ informativo en los mazos de móvil de mesa 2 se acepta:** es fase de píxel y no es puerta | Esta ficha |
| STOP 2 · 3 | **Excluir `.flying-card` de `transition: none` se acepta** | Esta ficha |
| STOP 2 · 4 | **`genMesa.mjs` se muda a `scripts/gen-reverso-mesa.mjs`**, con `--comprobar`: el recurso viaja con su generador, como `gen-cards.mjs` | Esta ficha |
| STOP 2 · 5 | **`capturas-rev/` va a `.gitignore`.** Las sondas y la hoja se quedan fuera; el instrumento permanente es el modo `rev` | Esta ficha |

---

## 3 · Cifras

| Medida | Antes | Después |
|---|---|---|
| Marco y broches visibles en las cajas anchas | 96,3–97,5 % | **100 %** |
| Marco en todas las instancias de la mesa (237, en 10 celdas × 4 estados) | — | **100 %** |
| Δ contra el canónico en los nueve lugares con causa (b) | 15,6–17,2 | **5,7–9,4** (control: 3,0–13,2) |
| Voladora en tiempo real: fotogramas sin pintar | sin medir (§J-3 de la Fase 0) | **0** de 255 |
| Cajas que cambian (puerta 1) | — | **0**: Δ máximo 0 |
| Fuera de la mesa (Portada y sala de espera) | original | **original**, 0 valores distintos |
| Peso del recurso | 6 994 B | + 7 498 B de la copia, emitida con hash |

Tras C-0 cambió el comentario de cabecera de la copia para nombrar su generador; md5 nuevo `ba2def976f34982396d6f8bc535de7cd`, dibujo idéntico (raster Δ 0 a DPR 1 y 3).

**Modo `rev`: VERDE**, con las cinco puertas en las 10 celdas y la oclusión probada. **Modo `luz` completo: VERDE.** Además, `gate` 6/6 y las pruebas 993/993.

---

## 4 · Lecciones para la doctrina

1. **Un recurso que alimenta cajas de varias proporciones necesita tela de sobra, o una copia por proporción.** El comentario del SVG («aguanta `cover` hasta 0,693») se escribió para la caja de 91:142 y no contempló la de las caras (0,699–0,708), que la carta humana usa desde CH-L2. Quien añada una caja nueva tiene que comprobar su proporción contra el recurso.
2. **Un laboratorio de comparación reproduce la caja real, o su rojo no significa lo que dice.** Hay que reproducir el borde, la fracción de píxel y la capa compuesta. Sin eso, el mismo dibujo daba Δ 11–15 a 27×42; con eso, 0,05–0,15.
3. **El screencast va un fotograma por detrás del `requestAnimationFrame`.** Un fotograma con hora de pantalla justo después de un rAF es el anterior. Los fotogramas se casan por una marca impresa en ellos (una sonda con el número del rAF), no por la hora.
4. **`elementFromPoint` ignora `pointer-events: none`.** Voladora, abanico y mazo no cuentan como oclusores por esa vía, así que la oclusión se mide por intersección de cajas y se demuestra con un caso sabido.
5. **`transition: none` global congela los elementos que se retiran en `transitionend`.** La voladora (`GameTable.jsx:292`) nunca terminaba su vuelo. La hoja del arnés tiene que excluirlos.

---

## 5 · Pendientes con dueño

| Pendiente | Dueño |
|---|---|
| La Portada: `.pue-carta` sufre el mismo recorte (b) que tenía el humano | Una futura tanda de Portada |
| `og-image.jpg` y `portada/mesapc.webp` y `mesav.webp`: llevan el reverso de antes rasterizado | La campaña de capturas nuevas, ya en la ruta |
| Vistazo en el iPhone de la familia (WebKit) | Victor |
| H-1 y H-2 de LUZ-1 | La tanda de higiene del arnés |

---

## 6 · Serie de commits

Sobre `808b580`, cinco commits atómicos por ruta explícita, con build limpio tras cada uno:

| Commit | SHA | Rutas |
|---|---|---|
| REV-1a: copia de mesa del reverso (solo se ensancha la tela) y su generador | `c286a25` | `src/assets/cards/reverso_carta_mesa.svg` · `scripts/gen-reverso-mesa.mjs` |
| REV-1b: la mesa usa la copia del reverso y el fondo vinotinto en mazo, voladora y abanico | `256d26f` | `src/components/PlayingCard.jsx` · `src/styles/rev.css` · `src/components/GameTable.jsx` |
| REV-1c: modo rev del arnés (cinco puertas) e ignorar capturas-rev/ | `cfdebb5` | `scripts/diagDSK.mjs` · `.gitignore` |
| REV-1d: informes de las fases 0 y 1 y nota 8 del Sistema de Diseño | `cab7041` | `docs/reportes/AJILEI_REV-1_Fase0_Informe_v1.0.md` · `docs/reportes/AJILEI_REV-1_Fase1_Informe_v1.0.md` · `docs/AJILEI_Sistema_Diseno_v1.2.md` |
| REV-1e: informe de cierre de REV-1 | este commit | `docs/reportes/AJILEI_REV-1_Informe_Cierre_v1.0.md` |

No se commitean `capturas-rev/` (ignorada) ni los residuos conocidos: los dos informes de MOT-1, los tres archivos de `laminas/mon1/` y `scripts/_cel1bFila.mjs`.

---

## 7 · Verificación de protegidos

Los seis archivos de la lista canónica, medidos en el árbol de trabajo al cerrar REV-1, frente a la instantánea del §3 de `AJILEI_Protegidos_v1.0.md`:

| Archivo | blob git (instantánea) | blob git (medido) | sha256 (16) medido | líneas | ¿Coincide? |
|---|---|---|---|---|---|
| `src/engine/gameEngine.js` | `21c4d3f56318` | `21c4d3f56318` | `317452ec5b57408a` | 748 | Sí |
| `src/engine/aiPlayer.js` | `8cfc3736cba2` | `8cfc3736cba2` | `3a8ea7b0386c7ddf` | 1445 | Sí |
| `src/engine/deck.js` | `eb61426083ca` | `eb61426083ca` | `69f92d6b9aac433c` | 69 | Sí |
| `src/config/seatLayouts.js` | `0d1bb8ea66a8` | `0d1bb8ea66a8` | `0049051fd4b8b891` | 59 | Sí |
| `src/styles/opponentPanel.css` | `3ce6383eec0d` | `3ce6383eec0d` | `50c98d51a91c3994` | 1084 | Sí |
| `src/styles/gameTable.css` | `1e21371c8543` | `1e21371c8543` | `269120a496910995` | 6289 | Sí |

**Los seis coinciden** en blob, sha256 y líneas con la instantánea, y son también el blob de `808b580`. `git diff --stat 808b580` sobre los seis sale vacío.

REV-1 cita `gameTable.css` y `opponentPanel.css`, pero **gana por especificidad desde `rev.css`** sin tocarlos. `gameEngine.js`, `aiPlayer.js` y `deck.js` no se abrieron en ninguna fase.
