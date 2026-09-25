# AJILEI · LUZ-1 · Cierre · Informe v1.0

**Ficha:** `AJILEI_LUZ-1_Commits_v1.0.md` · **Fecha:** 2026-09-25 · **Base:** `main` en `90f9539`
**Ejecutó:** Claude Code · **Rector:** Claude (chat) · **Decide:** Victor

---

## 1 · Resumen

**Qué se entregó.** Todo vive en una hoja aditiva, `src/styles/luz.css`, importada como último import de `GameTable.jsx`. Ningún archivo protegido cambia.
- **A · Luz cenital:** viñeta, luz central cálida y cuatro focos, como capas de `background` en `.game-table`.
- **B1 · Cuerpo del óvalo:** riel oscuro y cuatro reflejos, incluido el óvalo partido de la mesa 2 en horizontal.
- **C · Sombras de contacto:** en cartas, mazo, POZO y fichas.
- **Ajustes de legibilidad:** «Mano #N» a alfa 0,62 y «Pasó» a alfa 0,64.
- **Borde de `#root` en escritorio:** transparente en la mesa, sin las líneas claras a los lados.

**Qué quedó fuera, aparcado:** B2 (el cuerpo del marco), D (la textura de fieltro) y E (la marca de agua). Se pueden retomar sin rehacer nada: son capas de `background` y `box-shadow` que se suman a la misma hoja, medibles con el mismo modo `luz`.

**Enlaces:**
- Lámina v1.0: https://claude.ai/artifact/J27hUARTqQJeT7Kw4z8Ktg
- Hoja de contacto de la Fase 1: https://claude.ai/artifact/KJiwxgvqyzn5xaCrxDWRj1

Victor lo validó en el S25 y en el Motorola por túnel: «la sombra se ve muy bien, comparando antes y después es un sublime detalle».

## 2 · Decisiones tomadas en la campaña

- **La selección y el 100 % de intensidad** (`--luz-k: 1`, la lámina): los decidió Victor.
- **La carta seleccionada no lleva sombra de contacto.** Conserva su halo dorado `!important`.
- **Los paneles quedan fuera de C y `turnBreath` sigue intacto.** La animación de turno sustituye el `box-shadow` de los paneles, así que una sombra en ellos parpadearía con el turno.
- **El tricolor entra.**
- **Las tabletas en vertical (bloque B) usan los valores de P**, los compactos. No hubo lámina para esa vista y esos valores no pisan a ningún vecino.
- **Las fichas llevan sombra**, con un filtro horneado que se puede retirar por separado.
- **Las siete desviaciones de la Fase 1 se aceptan** (§5 del informe de la Fase 1).

## 3 · Cifras finales

| Qué | Antes | Con LUZ-1 |
|---|---|---|
| Contraste de «Mano #N» | 3,27–3,43 | **4,86–5,61** |
| Contraste de «Pasó» | 4,45–5,13 | **5,08–5,61** |
| Cajas (Δ) | — | **0** en las 24 celdas (20 celdas y 4 tapetes) |
| WebKit 26.5 frente a Edge 153 | — | **idéntico carácter por carácter**, con la hoja encendida y apagada, a 390×844 y a 1920×1080 |

## 4 · Lecciones para la doctrina

- **Textos claros translúcidos sobre fondo oscuro:** la viñeta **sube** su contraste y la luz lo **baja**. Toda capa de luz se mide encendida y apagada, texto por texto. La Fase 0 de LUZ-1 lo tenía al revés (§J-4) y la lámina lo corrigió.
- **«Más específico» se comprueba, no se supone.** `.card-winner` y `.card-empty` empataban a 0,1,0 y cargaban antes: sin la exclusión, el orden les habría quitado su halo.
- **Una `transition` falsea `getComputedStyle`** justo después de un cambio, porque devuelve el valor de arranque. Al medir estados, se inyecta `transition: none`.
- **Para instalar navegadores en este repo:** `npx playwright-core install webkit`, que es el CLI de la versión fijada. Nunca `npx playwright`.
- **Para apagar el bypass en desarrollo,** `VITE_AUTH_BYPASS` va **vacía**. `'0'` cuenta como verdadero.

## 5 · Pendientes con dueño

- **H-1** (`mkdirSync` sin importar en `diagDSK.mjs`) y **H-2** (el bypass que lee `'0'` como verdadero): se dejan para la tanda de higiene del arnés. No se corrigen en LUZ-1.
- **Vistazo visual en el iPhone de la familia** cuando esté disponible. Su Safari puede ir por detrás de WebKit 26.5.

## 6 · Serie de commits

Sobre `90f9539`, por ruta explícita y con build limpio tras cada commit:

| Commit | SHA | Rutas |
|---|---|---|
| LUZ-1a | `579cd2c` | `src/styles/luz.css` · `src/components/GameTable.jsx` |
| LUZ-1b | `66d613d` | `scripts/diagDSK.mjs` · `.gitignore` |
| LUZ-1c | `212e8b5` | los informes de las fases 0 y 1 · `docs/AJILEI_Sistema_Diseno_v1.2.md` |
| LUZ-1d | este commit | este informe |

## 7 · Verificación de protegidos

Contra la instantánea de la §3 de `docs/AJILEI_Protegidos_v1.0.md` (lista canónica v1.5), como pide su §5. El blob actual es `git hash-object` sobre el árbol de trabajo antes de LUZ-1a.

| Archivo | Blob actual | Blob de la instantánea §3 | ¿Igual? |
|---|---|---|---|
| `src/engine/gameEngine.js` | `21c4d3f56318` | `21c4d3f56318` | sí |
| `src/engine/aiPlayer.js` | `8cfc3736cba2` | `8cfc3736cba2` | sí |
| `src/engine/deck.js` | `eb61426083ca` | `eb61426083ca` | sí |
| `src/config/seatLayouts.js` | `0d1bb8ea66a8` | `0d1bb8ea66a8` | sí |
| `src/styles/opponentPanel.css` | `3ce6383eec0d` | `3ce6383eec0d` | sí |
| `src/styles/gameTable.css` | `1e21371c8543` | `1e21371c8543` | sí |

La ficha de commits decía "los cinco protegidos"; la lista canónica tiene seis desde la v1.4 (deck.js). Se verificaron los seis.
