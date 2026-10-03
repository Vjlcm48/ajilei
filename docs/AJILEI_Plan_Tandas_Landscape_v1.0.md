# AJILEI — Plan de Implementación: Tandas C5.x (Landscape + Fichas)

- **Archivo:** `docs/AJILEI_Plan_Tandas_Landscape_v1.0.md`
- **Versión:** 1.0
- **Estado:** Aprobado para implementación
- **Alcance:** Desglose secuenciado en Tandas de los specs `AJILEI_Diseno_Landscape_v1.0.md` (estructura) y `AJILEI_Componente_Fichas_v1.0.md` (fichas).
- **Serie de numeración:** C5.x (propuesta; renombrable).

---

## 1. Propósito y rol de este documento

- Es el **puente ejecutable** entre los specs (referencia) y Claude Code (implementación).
- Los specs describen el **qué** y el **porqué**; este plan define el **orden** y los **cortes testables**.
- Es la **única fuente de verdad sobre el orden de construcción**. Cualquier matiz de redacción entre el doc 1 y el doc 2 se resuelve aquí: manda esta secuencia.
- A Claude Code se le entrega **una Tanda a la vez**, no el documento completo ni los specs en crudo.

---

## 2. Reglas de trabajo

- **Un frente a la vez.** No se abren Tandas en paralelo; se completa y valida antes de seguir.
- **Validación visual primero.** Capturas / DevTools a 812×375 (landscape) y prueba en dispositivo antes de cualquier commit.
- **Testing manual obligatorio** como cierre de cada Tanda, seguido de Git commit.
- **Archivos protegidos:** la lista canónica de `AJILEI_Protegidos_v1.0.md` §2 (hoy seis). No se tocan sin autorización explícita de Victor. *(ARN-3e (2026-10-03): antes copiaba una lista de tres; la lista no se copia, se apunta.)* Claude Code **se detiene y reporta** al acercarse a un límite de alcance, no improvisa.
- **CSS nuevo** estrictamente dentro de `@media (orientation: landscape)` (Bloques 1–3). El Bloque 4 (fichas) toca las tres orientaciones por diseño.

---

## 3. Orden de construcción

1. **Estructura** del landscape (Bloques 1–2), usando el **número actual de saldo como placeholder** donde luego irán las fichas.
2. **Mecánica y paridad** en landscape (Bloque 3).
3. **Sistema de fichas** como **pase transversal único** (Bloque 4), posterior a la estructura, integrado en las **tres orientaciones** en un solo bloque coherente.

El caso base se construye sobre **5 jugadores** (la configuración más exigente); 4, 3 y 2 jugadores son reducciones que se validan después.

---

## 4. Tandas

### Bloque 1 — Estructura landscape (caso base: 5 jugadores)

- [ ] **C5.1 — Esqueleto responsivo + presupuesto de altura.** Activar `@media (orientation: landscape)`; tres franjas (IAs ~24% / mesa fija ~36% / humano 40%) con la franja del pozo de altura fija. Reubicar los tres bloques mayores (IAs arriba, mesa centro, humano abajo). *Test:* 812×375, proporciones correctas, sin scroll, sin saltos al cambiar de estado.
- [ ] **C5.2 — Fila de IAs (5 jug).** Grupo centrado, orden IA4 · IA3 · IA2 · IA1, paneles de nombre + cartas. *Test:* orden correcto, grupo centrado, sin solapes.
- [ ] **C5.3 — Mesa central.** Felt en forma de estadio a ancho completo + pozo con número (placeholder). *Test:* felt no aplasta el pozo; pozo legible y centrado.
- [ ] **C5.4 — Banda del humano.** Mano de 5 cartas + slot de MAZO al extremo izquierdo (sin solapar); rail izquierdo (saldo + descarte: mensaje 2 líneas **y** pila visual de descarte); rail derecho (botones; principal al alcance del pulgar). *Test:* 6 slots sin solape; rails flanquean solo la banda humana; descarte muestra ambas cosas.

### Bloque 2 — Configuraciones 4 / 3 / 2 jugadores

- [ ] **C5.5 — 4 jugadores.** 3 IAs centradas; el resto del layout responde por `aliveCount`. *Test:* ruteo por `aliveCount` correcto, 3 IAs centradas, layout coherente.
- [ ] **C5.6 — 3 jugadores.** 2 IAs centradas. *Test:* 2 IAs centradas, layout coherente.
- [ ] **C5.7 — 2 jugadores landscape (nuevo).** 1 IA centrada; layout responsive en **ambas orientaciones** (revisa la regla previa "2 jug solo vertical"). *Test:* se ve bien en horizontal y en vertical; la orientación gobierna sin modal.

### Bloque 3 — Mecánica y paridad en landscape

- [ ] **C5.8 — Halo de turno reforzado.** Anillo/temporizador alrededor del asiento activo; verificar que sonidos y efectos de turno disparan en landscape. *Test:* halo visible a lo ancho; sonidos/efectos OK.
- [ ] **C5.9 — Comodín + showdown.** Comodín (7 de Oros) y su flash en mesas de 4–5 jug; reveal de showdown en landscape (definir ubicación: junto a asiento o franja central). *Test:* comodín OK; showdown sin overflow.
- [ ] **C5.10 — Modales y avisos.** "¿Abandonar la mesa?" y modal de bancarrota en landscape; avisos de victoria/derrota. *Test:* anchos correctos (`box-sizing: border-box`), legibles.
- [ ] **C5.11 — Quiebra / eliminación + cadena a 2.** Coreografía de eliminación + reflow (recentrado del grupo de IAs); cadena landscape → 2 sin modal (orientación gobierna). *Test:* 5→4→3→2 con sobreviviente no-IA1, en ambas orientaciones; recentrado suave sin saltos.
- [ ] **C5.12 — PWA manifest.** Desbloquear de `"portrait"` para permitir rotación. *Test:* instalación / rotación correctas.

### Bloque 4 — Sistema de fichas (pase transversal, las tres orientaciones)

- [ ] **C5.13 — Componente de fichas.** Pila + número; variantes completa / compacta / ícono; clase compartida única; `--gold-brand`; número como capa conmutable (default visible/público). Sin integrar aún. *Test:* render aislado de las tres variantes; conmutación de número funciona.
- [ ] **C5.14 — Integrar fichas en landscape.** Reemplazar el placeholder en pozo + jugadores. *Test:* escalado correcto por variante (completa en pozo/humano; compacta/ícono en IAs).
- [ ] **C5.15 — Integrar fichas en vertical (retrofit).** *Test:* fichas correctas sin romper el layout vertical aprobado.
- [ ] **C5.16 — Integrar fichas en escritorio (retrofit).** *Test:* fichas correctas sin romper el layout de escritorio; paridad en las tres orientaciones.
- [ ] **C5.17 — Fichas que viajan al pozo.** Apuesta → pozo y pozo → ganador en las tres orientaciones; `prefers-reduced-motion`; solo `transform`/`opacity`. *Test:* animación fluida y no bloqueante en Android de gama media; reduced-motion sin animación.

---

## 5. Sub-tandas

Como en la serie C4.2.x, del testing manual surgirán **sub-tandas** de ajuste fino (`C5.N.x`) que no se predicen aquí. Se numeran y cierran con su propio commit, manteniendo la disciplina de un frente a la vez.

---

## 6. Protocolo de entrega a Claude Code

1. Se redacta la instrucción de **una** Tanda y se relaya a Claude Code.
2. Claude Code implementa y entrega su **checkpoint**.
3. Victor revisa el checkpoint y autoriza (o corrige) antes del commit.
4. Testing manual → Git commit cierra la Tanda.
5. Se autoriza la siguiente Tanda.

Instrucciones **targeted** (1–2 asuntos por vez) para no obligar a Claude Code a leer archivos protegidos innecesariamente.

---

## 7. Guardarraíles (recap)

- Bloques 1–3: CSS estrictamente dentro de `@media (orientation: landscape)`. No tocar el layout de escritorio ni el de vertical aprobados.
- Bloque 4: el componente de fichas es **presentacional** (lee saldo/pozo del estado existente, no cambia lógica de juego).
- `aliveCount` para ruteo; `visibility` (no remoción del DOM); franjas de altura fija; `box-sizing: border-box`.
- No tocar ningún protegido (`AJILEI_Protegidos_v1.0.md` §2) sin autorización. *(ARN-3e (2026-10-03): antes copiaba una lista de tres; la lista no se copia, se apunta.)*

---

## 8. Dependencias y notas

- C5.11 (cadena a 2) depende de C5.7 (layout de 2 jug en landscape).
- El Bloque 4 depende de que la estructura (Bloques 1–2) esté terminada y validada.
- C5.13 autora el componente **una sola vez** considerando las tres orientaciones (incluida la más apretada, vertical), antes de integrarlo en C5.14–C5.16.
- Fuera de alcance de este plan: Jugador vs Jugador (Fase D) y el modo dinero real. El componente de fichas deja el hook de compatibilidad listo (número conmutable), pero su uso es futuro.
