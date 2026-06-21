# AJILEI — Especificación de Diseño: Mesa Horizontal (Landscape)

- **Archivo:** `docs/AJILEI_Diseno_Landscape_v1.0.md`
- **Versión:** 1.0
- **Estado:** Aprobado para implementación
- **Alcance:** Layouts horizontales (landscape) para mesas de **2, 3, 4 y 5 jugadores** — modo Jugador vs IA. Sienta la base visual para Jugador vs Jugador (Fase D).
- **Documentos relacionados:** `AJILEI_Componente_Fichas_v1.0.md`, `AJILEI_Plan_Tandas_Landscape_v1.0.md`, `AJILEI_Sistema_Diseno_v1.2.md` (autoridad visual).

---

## 1. Principio y enfoque

- Enhancement responsivo vía `@media (orientation: landscape)`. **No** se fuerza la orientación por código.
- Todo el CSS nuevo va estrictamente dentro del media query de landscape. No se toca el layout de escritorio (ya aprobado) ni el de móvil vertical (`≤767px`, ya aprobado).
- Archivos protegidos (`gameEngine.js`, `aiPlayer.js`, `seatLayouts.js`) **no** se modifican sin autorización explícita.
- Reglas heredadas que se mantienen: ruteo por `aliveCount` (nunca `numPlayers`); `visibility` en vez de remoción del DOM; franjas de altura fija para evitar saltos; `box-sizing: border-box` verificado antes de diagnosticar problemas de ancho.

---

## 2. Modelo mental de la mesa

- Las IAs se sientan en una **fila arriba**, de izquierda a derecha: **IA4 · IA3 · IA2 · IA1**.
- El orden equivale a la progresión de turno: en la 1ª partida **IA4 es PIE**; en la 2ª, **IA1 es MANO**. La rotación "se lee" en línea recta.
- El **jugador humano** va centrado en la banda inferior.
- Las plantillas son agnósticas a quién ocupa el asiento: en PvP, humanos o IAs llenan las mismas posiciones en su orden de asiento.

---

## 3. Presupuesto de altura *(objetivo, a validar en dispositivo)*

| Zona | Altura objetivo | Nota |
|---|---|---|
| Fila de IAs (arriba) | ~24% | |
| Mesa / pozo (centro) | ~36% | **Franja de altura fija mínima** para que el pozo no se aplaste al rotar el turno |
| Área del jugador (abajo) | 40% | |

Validación en 812×375 (y tablets) antes de fijar valores definitivos.

---

## 4. Fila de IAs (centrada como grupo)

- El grupo de IAs se centra horizontalmente, **manteniendo el orden de asiento**.
- 5 jug → 4 IAs · 4 jug → 3 IAs · 3 jug → 2 IAs · 2 jug → 1 IA. Siempre centrado.
- Ante quiebra, el grupo se **recentra suavemente** (sin saltos), reutilizando la lógica de reflow ya implementada.
- Cada asiento de IA contiene: panel de nombre + cartas + indicador de fichas (mini-pila/ícono, ver §7) + apuesta que viaja al pozo (§8).

---

## 5. Banda del jugador — rails laterales

Los rails **flanquean solo la banda del humano**; el pozo y las IAs van a ancho completo.

- **Rail izquierdo — solo lectura.** SALDO del humano + DESCARTE. El descarte muestra **ambas cosas**: el mensaje de 2 líneas y la pila visual de descarte. **Ninguna** acción con tiempo crítico vive a la izquierda.
- **Rail derecho — acciones.** Botones de juego; el botón principal (apostar/confirmar) **al alcance del pulgar derecho**.

---

## 6. Mano del humano — 6 slots sin solaparse

- 5 slots de carta + 1 slot de **MAZO** (visible solo cuando el humano es PIE) = 6 elementos en fila, sin solapamiento.
- El MAZO va en el **extremo izquierdo** de la mano, pegado al rail de info (solo lectura, sin riesgo de choque con los botones de la derecha).
- El mazo anclado a la posición refuerza la regla de juego (señal visual de quién es PIE). Cuando una IA es PIE, el mazo se muestra junto a esa IA.

---

## 7. Mesa, pozo y fichas

- Mesa con felt en forma de **estadio / racetrack** a ancho completo: mayor sensación de "mesa" sin abandonar el modelo lineal.
- Pozo central = **pila de fichas + número**.
- Fichas (pila + número) presentes en **todos los jugadores y en el pozo**, escaladas al espacio: pila completa en pozo y área humana; mini-pila o ícono en los paneles chicos de las IAs.
- Detalle completo del componente en `AJILEI_Componente_Fichas_v1.0.md`.

---

## 8. Mecánica de turno y animaciones

- Misma mecánica de turnos, sonidos y efectos visuales que escritorio/vertical.
- **Halo de turno reforzado** con anillo/temporizador alrededor del asiento activo: a lo ancho el ojo recorre más distancia, hay que señalar con más fuerza quién juega.
- **Fichas que viajan al pozo:** al apostar, las fichas animan desde la pila del jugador hacia el pozo central. Es nuevo en landscape y se retro-encaja en vertical y escritorio según el doc de fichas.
- **Showdown en landscape:** con el ancho extra, el overflow corregido en vertical no debería repetirse. Definir ubicación del reveal (junto a cada asiento o franja central) durante la Tanda correspondiente.

---

## 9. Quiebra de 3 a 2 jugadores — sin modal

- **No** se usa modal de "¿horizontal o vertical?": ese modal sería justo la interrupción que queremos evitar.
- La mesa de 2 jugadores tiene layout en **ambas orientaciones**. La orientación del teléfono es la elección, continua y sin interrumpir.
- La mesa simplemente se **encoge a 2** con la lógica de reflow/eliminación ya existente y sigue respondiendo a la orientación. Sin coreografía especial de transición.
- Esto **revisa la regla previa** "2 jugadores solo vertical": ahora 2 jugadores es responsive (vertical + horizontal). El alcance de landscape pasa a ser **2/3/4/5**.

---

## 10. PWA manifest

- El manifest está bloqueado en `"portrait"`. Debe **desbloquearse** para permitir rotación cuando landscape entre en producción.

---

## 11. Paridad de elementos

Todos los elementos de escritorio/vertical deben estar presentes en landscape:

- Título de mesa
- Comodín (7 de Oros) y su flash en mesas de 4–5 jugadores
- Halo + sonidos de turno
- Modal "¿Abandonar la mesa?"
- Coreografía de quiebra/eliminación + modal de bancarrota
- Showdown
- Avisos de victoria / derrota
- Contexto de instalación PWA (prompt condicional)

---

## 12. Guardarraíles (resumen)

- CSS nuevo estrictamente dentro de `@media (orientation: landscape)`.
- No tocar `gameEngine.js` / `aiPlayer.js` / `seatLayouts.js` sin autorización.
- `aliveCount` para ruteo de layout; `visibility` (no remoción del DOM); franjas de altura fija; `box-sizing: border-box`.
- Validación visual (capturas / DevTools) antes de cada commit. Testing manual obligatorio por Tanda.

---

## 13. Ítems abiertos *(a resolver en implementación)*

- Valores px definitivos del presupuesto de altura (en dispositivo).
- Ubicación exacta del reveal de showdown en landscape.
- Estética final de la pila de fichas (número de discos, tiers por magnitud) — se cierra en `AJILEI_Componente_Fichas_v1.0.md`.
