# AJILEI · Tapetes — v1.0

**Fecha:** 2026-08-15
**Estado:** Decisiones selladas por Victor. Documento de referencia de producto y diseño; no autoriza implementación por sí mismo (la implementación es la tanda EMB-2).
**Destino:** `docs/AJILEI_Tapetes_v1.0.md`
**Relación:** Complementa `AJILEI_Sistema_Diseno_v1.2.md` (regla del dorado único), `AJILEI_Economia_Fichas_v1.0.md` (doctrina de sumideros) y `AJILEI_Modos_y_Asistencia_v1.1.md` (fichas = moneda, puntos = prestigio). **Enmienda** el catálogo de tienda del 5-ago-2026 (§6 de este documento).

---

## 1 · Catálogo sellado

Cinco tapetes en total: el clásico gratuito + cuatro vendibles por fichas.

| # | Tapete | Precio (fichas) | Estado |
|---|---|---|---|
| 0 | Verde clásico | — (gratuito) | Default de todo usuario; **byte-idéntico al actual, sin atributo aplicado** |
| 1 | Negro grafito | 10.000 | Vendible |
| 2 | Azul profundo | 15.000 | Vendible |
| 3 | Vinotinto | 25.000 | Vendible |
| 4 | Tricolor | 50.000 | Vendible — pieza insignia |

**Racional de la escalera (Victor):** precios "cotizables" para estimular el juego. La economía entrega fichas con generosidad — dos victorias seguidas en Básico mesa 5 a tope ya rinden 2.500 — así que el lujo debe costar para significar. La escalera de precios sigue la escalera identitaria: a mayor carga venezolana, mayor precio — del grafito sobrio al Tricolor insignia. Cada tapete es un hito de juego.

**Los precios son constantes deliberadas, no fórmula** — la escalera ES el diseño (a diferencia de los valores derivables como las fichas de las IAs). **Fuente única obligatoria:** `src/config/tapetes.js` (molde de `niveles.js`) con `id`, `nombre`, `precio`, descripción corta y token de color. Prohibido hardcodear montos o nombres en JSX. Ajustables post-lanzamiento con métricas (durmientes hasta Supabase, ver §5).

**Nombres de copy provisionales** (Victor ajusta en su checkpoint; es texto, barato): Verde clásico · Negro grafito · Azul profundo · Vinotinto · Tricolor.

## 2 · Dirección de diseño sellada

- **Regla del dorado único intacta** (decisión del 11-ago ratificada): `--gold-brand` queda fijo en fichas, botones y acentos; **solo el fieltro cambia de color**. Personalización periférica, identidad de marca intacta.
- **Tricolor = "la mesa vestida de tricolor", no la bandera sobre la mesa** (sellado 15-ago): base oscura con el tricolor como tratamiento profundo — bandas desaturadas, orla o viñeta, a calibrar en EMB-2 — jamás tres campos brillantes de bandera. La mesa sigue siendo superficie de juego.
- **El amarillo del tricolor NO es un segundo dorado.** Línea para el Sistema de Diseño en su próximo salto natural de versión: las fichas doradas y los acentos `--gold-brand` deben distinguirse del amarillo del tapete en todo punto donde convivan.
- **Profundidad equivalente:** los cuatro tapetes nuevos parten de la misma profundidad tonal del verde abisal actual, para heredar la legibilidad ya lograda. Los valores exactos de color se calibran en EMB-2 con checkpoint visual de Victor (autoridad final).

## 3 · Arquitectura (contrato para EMB-2)

- **Aditiva por construcción:** el tapete actual es el default **byte-idéntico sin atributo aplicado**. Las cuatro variantes entran por atributo `data-tapete` (`grafito` / `azul` / `vinotinto` / `tricolor`) en **hoja propia** (`tapetes.css` o equivalente). **Ninguna línea de `gameTable.css` se toca.** Aditivo-only, sin `!important`, como manda la doctrina.
- **Puertas de legibilidad (viajan a la instrucción de EMB-2):** cartas, fichas doradas, textos y TURNO badge legibles sobre **los cinco fondos**, en los **dos caminos de render** (mesas 5/4/3 vía `OpponentPanel` y mesa 2 vía `.ai-zone`) y en **ambas orientaciones**. Peor caso con elementos transitorios presentes (badge TURNO, timers), no solo estado de reposo.

## 4 · UX de compra y uso sellada

- **Acceso:** entrada nueva en el menú ⋮ con ícono de godete/paleta que indica la variedad de temas. Los tapetes se muestran como **swatches circulares del color real** con el nombre debajo. El panel sigue el patrón existente del menú: **no bloquea ni pausa el juego**.
- **Vista previa en vivo:** presionar cualquier tapete lo **aplica al instante como previsualización** con el diálogo de compra encima. La mesa es el probador.
- **Confirmación:** «¿Comprar [nombre] por [precio] fichas? **Sí / No**». «No» (o cerrar) revierte al tapete activo. «Sí» registra la propiedad y deja el tapete aplicado.
- **Tres estados visuales:** **activo** (resaltado — molde del chip "Tu último" de NivelSelect) · **comprado** (sin precio, marca discreta) · **no comprado** (etiqueta de precio visible).
- **Cambio libre:** entre tapetes comprados, sin costo, sin límite, cuando el usuario quiera. Los no comprados repiten el flujo de compra completo.
- **Terreno:** solo-escritorio hoy (el ⋮ móvil no existe); el panel de tapetes **hereda la cola del puerto móvil** junto al resto del menú de utilidades.

## 5 · Economía y persistencia

- **Moneda: fichas exclusivamente.** Los puntos de ranking son prestigio intocable (doctrina v1.1). Los tapetes son el sumidero #2; Mano Actual es el #1.
- **Fase actual — flujo completo SIN descuento de saldo:** misma doctrina sellada para el cobro de Mano Actual — la economía nace autoritativa en Supabase (una billetera `localStorage` es falsificable con F12 y enseñaría que la economía es de mentira). Pre-lanzamiento no hay usuarios reales; las "compras" registran propiedad sin cobrar.
- **Persistencia de propiedad:** lista de tapetes comprados + tapete activo en `localStorage` (convención de claves del proyecto, molde de U3 y del nivel recordado) — migra a Supabase con el login, junto a ECO-1. Al activarse la economía real, propiedad y descuento nacen juntos y autoritativos.

## 6 · Enmienda al catálogo de tienda (5-ago-2026)

- **La tienda virtual pasa a ser vitrina exclusiva de dinero real:** packs de monedas + planes Premium (+ entradas de torneo a futuro).
- **Los cosméticos — tapetes hoy; avatares y dorsos de cartas a futuro — son productos de fichas que viven dentro del juego**, no en la tienda. El ciclo cierra solo: quien quiere el Tricolor necesita 50.000 fichas → juega más, ve videos recompensados o compra packs. **El tapete vende packs sin estar en la tienda.**
- **Palanca de reserva (11-ago), anotada sin alcance:** ediciones limitadas de cosméticos por compra directa en dinero real — decisión futura con su propia ceremonia si algún día se abre. No aplica a estos cuatro.
- **Registro para la redefinición pendiente de los 3 packs:** la escalera de tapetes (10.000 / 15.000 / 25.000 / 50.000) provee anclas de valor — considerarla al fijar los tamaños y precios de pack antes de que Supabase materialice la economía.

## 7 · Cola acordada

**EMB-1** (recorrido dorado de Mano Actual + resplandor del título) → **EMB-2** (implementación de tapetes contra este documento, con sus puertas de legibilidad y checkpoint visual largo de Victor: cinco fondos × dos caminos de render × dos orientaciones) → el panel de tapetes viaja después en el **puerto móvil del ⋮**. Los tapetes se prueban visualmente en esta fase y entran ya aprobados a la tienda de fichas cuando la economía despierte.

## 8 · Historial

- **v1.0 (15-ago-2026):** documento fundacional. Decisiones selladas por Victor en sesión: catálogo de 5, escalera de precios, tricolor como "mesa vestida", vista previa en vivo con confirmación Sí/No, tres estados visuales, cambio libre entre comprados, sin descuento hasta Supabase, cosméticos fuera de la tienda de dinero real. Procedencia: lienzos concebidos el 5-ago (catálogo de tienda) y 11-ago (proyección económica: doctrina del sumidero + resolución del dorado único); direcciones de color propuestas el 15-ago y decididas por Victor en esta fecha.
