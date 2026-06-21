# AJILEI — Especificación de Componente: Sistema de Fichas (Pila + Número)

- **Archivo:** `docs/AJILEI_Componente_Fichas_v1.0.md`
- **Versión:** 1.0
- **Estado:** Aprobado para implementación
- **Alcance:** Componente transversal de fichas (visual + número) para **todos los jugadores y el pozo**, en las **tres orientaciones**: escritorio, móvil vertical y horizontal (landscape). Incluye la animación de fichas que viajan al pozo y la compatibilidad futura con dinero real.
- **Documentos relacionados:** `AJILEI_Diseno_Landscape_v1.0.md`, `AJILEI_Plan_Tandas_Landscape_v1.0.md`, `AJILEI_Sistema_Diseno_v1.2.md` (autoridad visual).

---

## 1. Principio

- Las fichas se muestran como **pila visual + número**, nunca pila *en vez* del número.
- El **número es la fuente de verdad** (precisión necesaria para decidir cuánto apostar). La pila aporta la sensación de mesa y, sobre todo, le da **origen y destino creíbles** a las fichas que viajan al pozo.
- Congruencia: si las fichas se ven en un sitio, se ven en **todos**. Por eso es un sistema único aplicado de forma uniforme, no un adorno suelto por pantalla.

---

## 2. Anatomía del componente

El componente de fichas tiene dos capas:

- **Pila** — representación de fichas (un pequeño stack de discos). Es **representacional, no literal**: no se dibuja una ficha por unidad. Siempre visible.
- **Número** — el valor exacto del saldo o del pozo. Obligatorio en modo fichas virtuales; conmutable en modo dinero real (ver §8).

El componente es **presentacional**: lee el saldo / pozo del estado existente (lógica de monedas en Supabase) y **no modifica la lógica de juego**.

---

## 3. Variantes de tamaño (escalado al espacio)

La ficha se escala al hueco disponible. El layout que la consume elige la variante según el contexto:

| Variante | Dónde | Aspecto |
|---|---|---|
| **Completa** | Pozo y área del humano | Pila prominente + número claro |
| **Compacta** | Asientos de IA con espacio moderado | Mini-pila + número |
| **Ícono** | Asientos de IA muy apretados (fila landscape de 5, paneles ~110px) | Un solo disco/ícono de ficha + número |

Mismo componente, misma identidad visual; solo cambia el tamaño.

---

## 4. Aplicación

- **Pozo:** variante completa. Es el foco dramático central de la mesa.
- **Jugador humano:** variante completa, su propia pila.
- **Asientos de IA:** variante compacta o ícono según el espacio de cada orientación.
- Presente en las **tres orientaciones** (escritorio, vertical, landscape) de forma consistente.

---

## 5. Color y tokens

- Las fichas usan `--gold-brand` (`#e8b84b`) como color base, en línea con la identidad de marca.
- Todo color, contraste y token se rige por `AJILEI_Sistema_Diseno_v1.2.md` (autoridad visual). No se inventan colores nuevos.
- El componente se implementa como **clase / componente compartido único**, no estilos duplicados por layout. Esto previene el problema de divergencia de contraste ya vivido: un cambio de fondo obliga a verificar el contraste de todo texto/ícono encima, y las clases compartidas lo evitan de raíz.

---

## 6. Animación — fichas que viajan al pozo

- **Apuesta / ante:** un número fijo y pequeño de sprites de ficha (p. ej. 3–5, **no uno por unidad**) animan desde la pila del jugador hacia la pila del pozo (vía `transform: translate`); al llegar se fusionan visualmente y el **número del pozo se incrementa**.
- **Victoria:** animación inversa — del pozo a la pila del ganador.
- La animación se dispara a partir de los **cambios de estado ya existentes** (saldo / pozo). No requiere modificar el motor.
- **Timing** corto y ágil (orientativo ~0.4–0.6 s), **no bloqueante**: el flujo del juego no se detiene.
- `prefers-reduced-motion`: sin animación; actualización directa de pila y número.
- **Performance:** solo `transform` y `opacity`, sin reflow; sprites reutilizables. Pensado para Android de gama media (audiencia diáspora venezolana), por lo que la animación debe ser barata.

---

## 7. Estados

- **Normal:** pila + número del saldo / pozo.
- **Apostando:** fichas salen de la pila del jugador hacia el pozo; el pozo crece.
- **Ganando:** el pozo viaja a la pila del ganador.
- **Saldo 0 / quiebra:** la pila refleja el saldo vacío; se integra con la coreografía de eliminación ya existente.

---

## 8. Compatibilidad con dinero real

- El componente expone la **visibilidad del número por instancia** (capa conmutable).
- **Modo fichas virtuales (actual):** todos los números visibles — el saldo es público (decisión previa del proyecto).
- **Modo dinero real (futuro):** el número del **rival** se puede ocultar (solo pila); el número **propio** del jugador permanece visible. La **pila siempre visible**.
- Se diseña la API con el número como capa conmutable **desde ahora**, aunque el toggle no se use todavía. Esto evita un rediseño cuando llegue el dinero real.

---

## 9. Secuencia de adopción

- El sistema de fichas se implementa como un **pase transversal único**, **posterior a la estructura del landscape** (que mientras tanto usa el número actual de saldo como placeholder).
- Ese pase integra el componente en las **tres orientaciones** (landscape, vertical, escritorio) en un solo bloque coherente de Tandas.
- El componente se **autora una sola vez**, contra las restricciones de las tres orientaciones a la vez — incluida la más apretada (vertical) — para que quede consistente en todos lados.
- Las fichas que viajan al pozo son un concepto **nuevo en las tres** (hoy no existen en ninguna); se introducen en este mismo pase, no antes en una y después en otras.
- El desglose en Tandas numeradas vive en `AJILEI_Plan_Tandas_Landscape_v1.0.md`. Validación visual + testing manual + commit por Tanda.

---

## 10. Guardarraíles

- Componente / clase **compartido único** (sin duplicación por layout).
- Colores y tokens según `AJILEI_Sistema_Diseno_v1.2.md`; fichas en `--gold-brand`.
- Componente **presentacional**: lee saldo / pozo del estado existente, no cambia lógica de juego.
- No tocar `gameEngine.js` / `aiPlayer.js` / `seatLayouts.js` sin autorización.
- Animaciones solo con `transform` / `opacity`; respetar `prefers-reduced-motion`.
- Validación visual y testing manual por Tanda; commit como cierre.

---

## 11. Ítems abiertos *(a resolver en implementación)*

- Tamaños px definitivos de cada variante (en dispositivo).
- **Tiers de la pila por magnitud** (que la altura/composición insinúe el orden de magnitud del saldo) — opcional, a decidir tras ver la versión base.
- **Denominaciones / colores múltiples de ficha** — diferido; no es scope inicial.
