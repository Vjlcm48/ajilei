# AJILEI · Identidad A · Especificación v1.1

**Estado:** SELLADO · Fecha de sellado: 2026-08-21. Sustituye a `AJILEI_Identidad_A_v1.0.md`, que queda como historial.
**Autoridad visual:** Victor (HEPTACREATION LLC)
**Documento de referencia visual:** `AJILEI_Sistema_Diseno_v1.2.md` (autoridad de color y estilo)
**Archivos maestros:** `src/assets/heptacoin.svg` · `src/assets/ajilei-isotipo.svg` · `src/assets/cards/reverso_carta.svg`
**Base de código:** implementado en la tanda **VIS-2** de la campaña VIS.
**Naturaleza:** **Delta sobre la v1.0.** Todo lo que esta revisión no modifique explícitamente sigue vigente tal como está escrito en la v1.0: la identidad del símbolo (§1), el sistema de coordenadas (§2) y **todas** las cotas selladas de la letra doble (§3). El trazo no se toca. Lo que cambia es **el cuño de la moneda** y **la composición del reverso de las cartas**, que en la v1.0 quedaba declarada como pieza pendiente.

---

## 1–3 · Símbolo, coordenadas y cotas

**Sin cambios.** Rigen íntegras las secciones 1, 2 y 3 de la v1.0: letra doble deconstruida A+J, `1 cm = 10 unidades · svg_x = 20 + 10·x · svg_y = 95 − 10·y`, las cotas `a(0,0) · b(5,0) · c(5,4.5) · d(5,6) · e(4,6)`, el gancho V-A con arco de radio 1,25 y quiebre en `f`, la Heptacoin en `j(3.25, 2.25)` a Ø 1,5, y el grosor G2 = 0,5 cm uniforme con remates redondos.

**Verificado en VIS-2:** el trazo de `ajilei-isotipo.svg` v1.1 es **byte-idéntico** al de v1.0 — las dos `<path>` de la letra doble, su `stroke-width`, su `stroke-linecap` y el `<svg>` anidado de la moneda con su `x/y/width/height`. El único cambio del archivo es el contenido del grupo `ajHeptacoin`.

---

## 4 · Heptacoin v1.1 · acuñación tricolor (sellada 2026-08-21)

La maestra evoluciona **para todo el ecosistema HEPTACREATION** (decisión de Victor: guiño a las raíces; SumaMente la adopta en su propio ciclo).

**Diseño sellado: HC-1 "Grabada"** — sin cambios en la composición: H serifada al centro en alto relieve, 7 estrellas de 5 puntas en anillo simétrico y bajo relieve, canto acuñado estriado con filete interior. Lo que cambia es el **cuño**.

**Variante elegida en láminas: B "marcada".** La A "discreta" se descartó por no registrar a 36 px, que es el tamaño de la moneda en la barra de saldo — el más grande que el producto usa hoy.

| Elemento | v1.0 | **v1.1 B** |
|---|---|---|
| Filete exterior | — | **vino `#7c1d30`**, 2 u (r 45 → 47) |
| Sombra de la H | tono sombra del oro | **marino `#1c305f`**, desplazada +1,3 / +1,8 |
| Campo (radial) | `#f4d27e` 0 % · `#e8b84b` 55 % · `#c69736` 100 % | **`#f4d27e` 0 % · `#e8b84b` 45 % · `#c69736` 82 % · `#9a7326` 100 %** |
| Estrellas | tono sombra plano | **`#9a7326`** |
| Canto | anillo discontinuo | **r 42,9 · 3,4 u** (filete interior r 40,6 · 0,7 u) |
| Cuerpo de la H | gradiente claro | **`#f7dc92` → `#d4a033`** |

**La base `#e8b84b` no se mueve.** La intensidad nace del **peso de sombra**, no de un segundo dorado: el campo gana una cuarta parada profunda y la H gana contraste por su sombra marina, pero el tono de marca sigue siendo exactamente el mismo píxel de siempre en el 45 % del radial.

**La rampa tonal y los acentos vino y marino existen únicamente dentro del activo.** Fuera de la moneda rige el dorado único `#e8b84b` del sistema de diseño, sin excepción.

---

## 5 · Doctrina de uso

Las cinco reglas de la v1.0 siguen vigentes. **Se enmienda la 2:**

> **2. No recolorear.** El isotipo es oro sobre fondo oscuro. **Los acentos vino y marino forman parte del cuño sellado de la Heptacoin y no son recoloreado; cualquier otro color queda prohibido.** Versión monocroma (una tinta) permitida solo para documentos impresos B/N.

**Se amplía la 4 (IDs de activos · contrato):** `heptacoin.svg` · `ajilei-isotipo.svg` · **`reverso_carta.svg`**.

La regla 5 —validación XML estricta antes de publicar— se aplicó a los tres activos de VIS-2 y los tres pasan.

---

## 6 · Reverso oficial de las cartas · composición sellada R-2 "Greca" (2026-08-21)

La v1.0 §6 declaraba el reverso como aplicación oficial con "el diseño de la composición del dorso pendiente como pieza propia". Esta revisión lo sella y retira el provisional.

**Lienzo.** 910 × 1420 u, **ratio 0,641 = 91:142** — el de las cajas renderizadas, no el del papel. **Opaco a sangre.**

**Zona segura.** Marco a 58 u de los lados y 72 u de arriba/abajo. Sobrevive al recorte `cover` hasta ratio 0,693 (el mazo en móvil, el más apretado del producto) y al radio de 8 px que el contenedor aplica a 54 px de ancho.

**Campo.** Vinotinto profundo `#41101c`, un escalón más hondo que el fieltro Vinotinto B (`#5a1426`), con **raya diplomática** diagonal `#4a1422` (3 u cada 36 u, a 45°) y **halo radial** `#531826` tras la marca.

**Marco.** Octógono achaflanado doble, oro `#e8b84b` (10 u) y oro al 55 % (5 u), con **cuatro broches** romboidales en los ejes.

**Marca.** Isotipo AJILEI v1.1 (letra doble + Heptacoin v1.1 B) a 440 u de ancho, centro (455, 650).

**Estrellas.** Arco de **ocho** estrellas de cinco puntas en oro bajo la marca (cuerda 600 u, flecha 50 u, radio 925 u, centro del arco en (455, 2030)) — misma línea estética que la pantalla de bienvenida. Decisión de Victor: la coherencia con la bienvenida manda sobre la simetría del hepta.

**Regla del oro único.** Fuera de la Heptacoin solo existe `#e8b84b`, plano o con opacidad. El vino y el marino del cuño quedan encerrados en la moneda, exactamente como manda §5.

**Orientación.** Marca **siempre derecha**; marco simétrico. No hay reverso reversible.

**ID de activo (contrato):** `reverso_carta.svg`.

**Descartadas:** R-1 "Rombos" (cartela oval sobre retícula) y R-3 "Sol y estrellas".

**Herencia.** Los reversos alternativos futuros —cosméticos vendibles, molde de los tapetes— heredan **lienzo, zona segura y regla del oro**. Lo que cambia en un reverso alternativo es el campo y el motivo, nunca la caja.

### 6.1 · Aplicaciones oficiales (actualizado)

Sin cambios respecto a la v1.0, salvo que el reverso deja de estar pendiente:

- Ícono de la app / favicon (derivados PNG 192/512 + maskable, **siguen pendientes** — campaña de empaquetado aparte).
- Wordmark en pantallas del juego: [letra doble] + ILEI.
- Heptacoin en toda representación de moneda del juego (campaña IDN-1, activo v1.1 desde VIS-2).
- **Reverso oficial de las cartas volteadas: R-2 "Greca", sellado.**
- Web ajilei.com: imagen principal (hero) y sello de la moneda.
- Ecosistema HEPTACREATION: la Heptacoin es activo compartido (SumaMente y futuros), con reglas de transferencia por definir (ver acuerdos ECO/legales).

---

## 7 · Historial de decisiones

**2026-08-21 (campaña VIS, tanda VIS-2):**
- **Heptacoin v1.1 B** "marcada" > A "discreta": la A no registraba a 36 px. Filete vino, sombra marina y cuarta parada del campo; base `#e8b84b` intacta.
- **Reverso R-2 "Greca"** > R-1 "Rombos" y R-3 "Sol y estrellas". El arco de ocho estrellas va **bajo** la marca por coherencia con la bienvenida (Victor).
- El PNG provisional (1060 × 1484, 2 273 KB) se retira del repositorio.
- **Tapetes v1.1** en la misma campaña, documento propio: `AJILEI_Tapetes_v1.1.md`.

**2026-08-20 (v1.0, vigente en lo no enmendado):**
- Ruta "letra doble deconstruida" adoptada tras confirmar que el diseño previo (con travesaño-onda) se leía como "4" en tamaños pequeños.
- Signo central: M-2 Moneda > punto/línea/rombo/triángulo/corazón (los palos franceses se descartaron por asociación con la baraja equivocada).
- Cuño H > motivo hepta puro (transferibilidad de casa); 7 estrellas conservan el "hepta" y la resonancia con la diáspora.
- Gancho V-A (quiebre) > V-B (tangente): carácter crisp, sellado por Victor.
- G2 (0,5) > G1/G3: equilibrio letra–moneda en todos los tamaños.
