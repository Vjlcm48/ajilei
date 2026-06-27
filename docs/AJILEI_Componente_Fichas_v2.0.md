# AJILEI — Especificación de Componente: Sistema de Fichas (Pila + Número)

- **Archivo:** `docs/AJILEI_Componente_Fichas_v2.0.md`
- **Versión:** 2.0 (consolida v1.0 + adenda de forma v1.1)
- **Estado:** Aprobado para implementación — **Ajuste Global #3**
- **Alcance:** Componente transversal de fichas (visual + número) para **todos los jugadores y el pozo**, en las **tres orientaciones**: escritorio, móvil vertical y horizontal (landscape). Incluye la animación de fichas que viajan al pozo y la compatibilidad futura con dinero real.
- **Documentos relacionados:** `AJILEI_Diseno_Landscape_v1.0.md`, `AJILEI_Plan_Tandas_Landscape_v1.0.md`, `AJILEI_Estrategia_Experiencia_v1.0.md`, `AJILEI_Sistema_Diseno_v1.2.md` (autoridad visual).

> **Changelog v2.0:** Fusiona la arquitectura del v1.0 con la decisión de forma visual que quedaba abierta. **Forma fijada:** moneda/token 2D plano, color dorado único (`--gold-brand`), construido en SVG. Se cierran los ítems abiertos de *denominaciones / colores múltiples* y *estética final de la pila*. Este documento **reemplaza** al v1.0 y a su adenda v1.1 como autoridad única de fichas.

---

## 1. Principio

- Las fichas se muestran como **pila visual + número**, nunca pila *en vez* del número.
- El **número es la fuente de verdad** (precisión necesaria para decidir cuánto apostar). La pila aporta la sensación de mesa y, sobre todo, le da **origen y destino creíbles** a las fichas que viajan al pozo.
- Congruencia: si las fichas se ven en un sitio, se ven en **todos**. Por eso es un sistema único aplicado de forma uniforme, no un adorno suelto por pantalla.

---

## 2. Forma visual

La ficha es una **moneda / token 2D plano** — no una ficha de póker estriada, no biseles, no 3D.

- **Geometría:** disco / medallón limpio, color sólido.
- **Color:** un solo dorado, `--gold-brand` (#e8b84b). Sin denominaciones multicolor.
- **Tecnología:** **SVG** — nítido a cualquier escala, liviano, animable y tematizable por variable de color.

### Por qué
- El **3D, biseles y brillos** leen como "casino agresivo" — el tono que descartamos — y pesan más en móvil. El 2D plano se anima barato y escala sin pixelarse.
- Las **fichas multicolor** son el sello del casino y romperían la regla *single-gold*, una ventaja competitiva real de AJILEI. Un token dorado único se lee como "valor/moneda" y conecta con la economía de monedas.
- AJILEI **no es póker** y el saldo son "coins": un disco / medallón limpio encaja mejor que la ficha rayada clásica.

### Lo que NO se hace

| Anti-patrón | Por qué |
|---|---|
| Fichas multicolor por denominación | Rompe single-gold; estética de casino |
| 3D, biseles, gradientes, brillos | Tono "casino agresivo"; peso innecesario en móvil |
| Estrías de ficha de póker | AJILEI no es póker; el saldo son coins |
| Dibujar una moneda por cada unidad de saldo | La pila es ícono, el número es la verdad (ver §4) |
| `--gold-dim` en el token | Reservado a halos de Saldo Vivo y filigrana (ver §7) |

---

## 3. Construcción del token (SVG)

Disco plano, dentro del sistema:

| Capa | Especificación |
|---|---|
| Cuerpo del disco | `--gold-brand` (#e8b84b) sólido |
| Aro interno fino | `--green-deep` (#1a4a2e), trazo delgado, concéntrico |
| Sombra | **Una sola** sombra suave, vía `filter: drop-shadow(...)` (CSS) o `feDropShadow` (SVG) — nunca un círculo gris debajo |
| Forma | Círculo perfecto |

SVG de referencia (las dimensiones exactas se ajustan en implementación, §5):

```svg
<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
  <!-- cuerpo de la moneda -->
  <circle cx="20" cy="20" r="16" fill="var(--gold-brand)"/>
  <!-- aro interno -->
  <circle cx="20" cy="20" r="12" fill="none"
          stroke="var(--green-deep)" stroke-width="1.5" opacity="0.9"/>
</svg>
```

- La **sombra** se aplica con `filter: drop-shadow()` sobre el elemento, no dentro del path. Una sola sombra, parámetros consistentes con el sistema (regla de "una sola sombra, un solo radio").
- El token **no lleva número impreso**: el número es la capa de texto separada del componente (§4).

---

## 4. Anatomía del componente (pila + número)

El componente tiene dos capas:

- **Pila** — el token de §3 repetido pocas veces (un pequeño stack de discos solapados). Es **representacional, no literal**: no se dibuja una ficha por unidad. Siempre visible.
- **Número** — el valor exacto del saldo o del pozo. Obligatorio en modo fichas virtuales; conmutable en modo dinero real (ver §10).

El componente es **presentacional**: lee el saldo / pozo del estado existente (lógica de monedas en Supabase) y **no modifica la lógica de juego**.

> **Regla dura:** la pila es ícono; el número es la contabilidad. La altura de la pila no representa la cantidad exacta.

---

## 5. Variantes de tamaño (escalado al espacio)

La ficha se escala al hueco disponible. El layout que la consume elige la variante según el contexto:

| Variante | Dónde | Aspecto |
|---|---|---|
| **Completa** | Pozo y área del humano | Pila prominente + número claro |
| **Compacta** | Asientos de IA con espacio moderado | Mini-pila + número |
| **Ícono** | Asientos de IA muy apretados (fila landscape de 5, paneles ~110px) | Un solo disco/ícono de ficha + número |

Mismo componente, misma identidad visual; solo cambia el tamaño.

---

## 6. Aplicación

- **Pozo:** variante completa. Es el foco dramático central de la mesa.
- **Jugador humano:** variante completa, su propia pila.
- **Asientos de IA:** variante compacta o ícono según el espacio de cada orientación.
- Presente en las **tres orientaciones** (escritorio, vertical, landscape) de forma consistente.

---

## 7. Color, tokens y clase compartida

- Las fichas usan `--gold-brand` (#e8b84b) como color base; el aro interno usa `--green-deep` (#1a4a2e).
- **`--gold-dim` (#c9973a) está prohibido en el token:** el sistema lo restringe a los halos de Saldo Vivo y a la filigrana. No debe aparecer en la moneda.
- Todo color, contraste y token se rige por `AJILEI_Sistema_Diseno_v1.2.md` (autoridad visual). No se inventan colores nuevos.
- El componente se implementa como **clase / componente compartido único**, no estilos duplicados por layout. Esto previene la divergencia de contraste ya vivida: un cambio de fondo obliga a verificar el contraste de todo texto/ícono encima, y las clases compartidas lo evitan de raíz.

---

## 8. Animación — fichas que viajan al pozo (y al ganador)

- **Apuesta / ante:** un número fijo y pequeño de sprites de ficha (p. ej. 3–5, **no uno por unidad**) animan desde la pila del jugador hacia la pila del pozo (vía `transform: translate`); al llegar se fusionan visualmente y el **número del pozo se incrementa**.
- **Victoria:** animación inversa — del pozo a la pila del ganador. Vuelan **pocas monedas simbólicas (3–5)** en arco, y el **contador ascendente** del saldo del ganador hace el trabajo real del número (sube gradualmente hasta el total, nunca salta). Coordinado con la *celebración escalonada de victoria* (`AJILEI_Estrategia_Experiencia_v1.0.md`).
- La animación se dispara a partir de los **cambios de estado ya existentes** (saldo / pozo). No requiere modificar el motor.
- **Timing** corto y ágil (orientativo ~0.4–0.6 s), **no bloqueante**: el flujo del juego no se detiene.
- `prefers-reduced-motion`: sin animación; actualización directa de pila y número.
- **Performance:** solo `transform` y `opacity`, sin reflow; sprites reutilizables. Pensado para Android de gama media (audiencia diáspora venezolana), por lo que la animación debe ser barata.

---

## 9. Estados

- **Normal:** pila + número del saldo / pozo.
- **Apostando:** fichas salen de la pila del jugador hacia el pozo; el pozo crece.
- **Ganando:** el pozo viaja a la pila del ganador.
- **Saldo 0 / quiebra:** la pila refleja el saldo vacío; se integra con la coreografía de eliminación ya existente.

---

## 10. Compatibilidad con dinero real

- El componente expone la **visibilidad del número por instancia** (capa conmutable).
- **Modo fichas virtuales (actual):** todos los números visibles — el saldo es público (decisión previa del proyecto).
- **Modo dinero real (futuro):** el número del **rival** se puede ocultar (solo pila); el número **propio** del jugador permanece visible. La **pila siempre visible**.
- Se diseña la API con el número como capa conmutable **desde ahora**, aunque el toggle no se use todavía. Esto evita un rediseño cuando llegue el dinero real.

---

## 11. Secuencia de adopción

- El sistema de fichas se implementa como un **pase transversal único**, **posterior a la estructura del landscape** (que mientras tanto usa el número actual de saldo como placeholder).
- Ese pase integra el componente en las **tres orientaciones** (landscape, vertical, escritorio) en un solo bloque coherente de Tandas.
- El componente se **autora una sola vez**, contra las restricciones de las tres orientaciones a la vez — incluida la más apretada (vertical) — para que quede consistente en todos lados.
- Las fichas que viajan al pozo son un concepto **nuevo en las tres** (hoy no existen en ninguna); se introducen en este mismo pase, no antes en una y después en otras.
- El desglose en Tandas numeradas vive en `AJILEI_Plan_Tandas_Landscape_v1.0.md`. Validación visual + testing manual + commit por Tanda.

---

## 12. Guardarraíles

- Forma **2D plana, dorado único, SVG** según §2; sombra única vía `drop-shadow`.
- Componente / clase **compartido único** (sin duplicación por layout).
- Colores y tokens según `AJILEI_Sistema_Diseno_v1.2.md`; fichas en `--gold-brand`, aro en `--green-deep`; `--gold-dim` prohibido.
- Componente **presentacional**: lee saldo / pozo del estado existente, no cambia lógica de juego.
- No tocar `gameEngine.js` / `aiPlayer.js` / `seatLayouts.js` sin autorización.
- Animaciones solo con `transform` / `opacity`; respetar `prefers-reduced-motion`.
- Validación visual y testing manual por Tanda; commit como cierre.

---

## 13. Ítems abiertos *(a resolver en implementación)*

- Tamaños px definitivos de cada variante (en dispositivo).
- **Tiers de la pila por magnitud** (que la altura/composición insinúe el orden de magnitud del saldo) — opcional, a decidir tras ver la versión base.

**Cerrados en v2.0:**
- ~~Denominaciones / colores múltiples de ficha~~ → **decidido:** dorado único, sin denominaciones (§2).
- ~~Estética final de la pila~~ → **decidido:** moneda 2D plana en SVG (§2–§3).
