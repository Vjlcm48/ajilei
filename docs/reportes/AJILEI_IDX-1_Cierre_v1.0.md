# AJILEI · IDX-1 · Cierre · Informe v1.0

**Ficha:** `AJILEI_IDX-1_Cierre_v1.0.md` (2026-09-25) · **Fecha:** 2026-09-25 · **Base:** `5311a32` (main = origin/main) · Edge 153.0.4234.48

---

## Resumen

IDX-1 queda commiteada en seis commits atómicos sobre `5311a32`, **sin push**. El juego y la Portada sirven la baraja con el índice digital, que Victor validó por túnel en el S25, el Motorola y el escritorio. La baraja commiteada es, al byte, la que aprobó.

## 1 · Comprobaciones previas (§1)

| Comprobación | Resultado |
|---|---|
| `main` y `origin/main` | los dos en `5311a32` tras `git fetch` |
| Derivados | los 40 WebP y las cinco copas, idénticos al byte a los de la Fase 1b (sin regenerar) |
| Protegidos | los seis blobs de la Fase 1b |

## 2 · Ajuste final (§2)

1. **C-3, la franja «Hoy» de la hoja.**
   - **Qué cambió:** ahora sale de los PNG maestros **sin IDX**, reducidos con el mismo método que usaba `gen-cards.mjs` antes de IDX-1, directamente desde la imagen. La función nueva es `derivarClasica`, en `idxPagina.mjs` e `idxNavegador.mjs`.
   - **Comprobado:** las 40 de «Hoy» son **idénticas al byte** a la baraja clásica que servía el juego en `5311a32`. Así la hoja seguirá enseñando el antes y el después.
   - **Qué se regeneró:** solo `capturas-idx/`, y los derivados del juego no se tocaron.
   - **La variación de C-1 volvió a salir:** en esta corrida, una «Nueva» de la hoja no coincidió al byte con lo servido. Fue la variación ya conocida: ±1 en 19 píxeles de `cinco_basto` y en 1 de `cuatro_espada`. No afecta a nada commiteado.
2. **Sistema de Diseño.**
   - **Qué se añadió:** la adenda del 2026-09-25, sin cambio de versión, en `docs/AJILEI_Sistema_Diseno_v1.2.md`. Recoge el papel de los maestros como baraja clásica y matiza la nota 4, que decía que todo derivado era una reducción del maestro. Incluye la regla del índice, los colores por palo, la holgura con los factores sellados y el suelo, y cómo se regenera.
   - **Desviación de la ficha:** la ficha la pedía como **§12.5**, pero la nota 5 del §12 ya existía (MON-2.1, «La moneda de la Portada no se descarga…»). La adenda entra como **nota 6**, para no renumerar una nota ya commiteada y citada. Es el camino conservador.
3. **La lámina.**
   - **Precedente:** hay láminas selladas rastreadas: `PUE_lamina_v1.7.html` entró en `3ea2e27` (DOC-1b) como «contrato sellado de la portada», bajo un tope de 2 MB por archivo. `laminas/mon1/lamina.html` sigue sin rastrear, pero es salida de taller y no un contrato.
   - **Decisión:** `laminas/idx1/AJILEI_IDX1_lamina_v1.2.html`, de 1,88 MB, **entra en IDX-1e**.
   - **Qué rige:** la adenda del Sistema de Diseño, no la lámina. La lámina anclaba el número por la caja de avance y el Ajuste A-1 lo ancla por la tinta.
4. **`.gitignore`.** La línea `capturas-idx/` había quedado pegada al bloque de MOT-1, cuyo comentario dice que «Victor la borra al cerrar la fase, y con ella esta línea». Si se borrara ese bloque, se iría también la nuestra. Le puse una línea en blanco y un comentario propio.

## 3 · Línea base (§2.4)

| Qué | Resultado |
|---|---|
| `npm test` | **35 archivos · 993 pruebas · 993 aprobadas** |
| `npx eslint .` | **21 problemas (20 errores, 1 aviso)**, la línea base; ninguno nuevo |
| `npm run build` | limpio. Solo sale el aviso de chunk > 500 kB, que ya existía y es del JS, no de esta campaña. Las 45 caras de `dist/assets/` son idénticas al byte a las de `src/`, y en el build no sale ningún PNG maestro |
| `diagDSK gate` (5173) | **6/6** |
| Protegidos | `21c4d3f56318` · `8cfc3736cba2` · `eb61426083ca` · `0d1bb8ea66a8` · `3ce6383eec0d` · `1e21371c8543`, sin cambios |

## 4 · Commits

| Letra | SHA | Contenido |
|---|---|---|
| IDX-1a | `84fd626` | `scripts/idx/idxCore.mjs`, `scripts/testIdxCore.test.js` |
| IDX-1b | `03cd060` | `scripts/fonts/RobotoCondensed-wght.ttf`, `scripts/fonts/OFL.txt` |
| IDX-1c | `0e44393` | `scripts/idx/idxPagina.mjs`, `scripts/idx/idxNavegador.mjs`, `scripts/idx/pagina.html`, `scripts/gen-idx.mjs`, `scripts/gen-cards.mjs`, `scripts/gen-portada-assets.mjs`, `.gitignore` |
| IDX-1d | `014c655` | los 40 de `src/assets/cards/webp/` y las 5 copas de `src/assets/portada/` |
| IDX-1e | `0b6ae1e` | los cuatro informes de IDX-1, `docs/AJILEI_Sistema_Diseno_v1.2.md` y `laminas/idx1/AJILEI_IDX1_lamina_v1.2.html` |
| IDX-1f | *este commit* | este informe |

**Se quedan fuera, como siempre:**

- Los dos informes de MOT-1.
- `laminas/mon1/_entorno.txt`, `lamina.html` y `tiempos.json`.
- `scripts/_cel1bFila.mjs`.

No entra ningún protegido, ni nada de `dist/`, `capturas-idx/`, `capturas-dsk/` o `.env.local`.

## 5 · Lo que queda (no es de esta ficha)

1. **Push.** Lo autoriza Victor. Después, la ceremonia de los tres SHA iguales (local, `origin/main` y el remoto), y Cloudflare despliega solo.
2. **Comprobación en ajilei.io** en la PWA instalada, cerrándola del todo y volviéndola a abrir.
3. **Fase 1c (D-14):** Victor rehace `mesav`, `mesapc` y `og-image` con la baraja nueva, y se procesan con `gen-portada-assets.mjs`.
4. **Abierto con dueño (C-1):** las 9 cartas encogidas pueden variar ±1 en el antialias del número si se regeneran. Solo hace falta regenerar si cambian los maestros, y ese día conviene revisar el diff de esas 9 cartas.
