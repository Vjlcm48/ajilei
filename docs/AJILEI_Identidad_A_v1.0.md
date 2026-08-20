# AJILEI · Identidad A · Especificación v1.0

**Estado:** SELLADO · Fecha de sellado: 2026-08-20
**Autoridad visual:** Victor (HEPTACREATION LLC)
**Documento de referencia visual:** `AJILEI_Sistema_Diseno_v1.2.md` (autoridad de color y estilo)
**Archivos maestros:** `assets/ajilei-isotipo.svg` · `assets/heptacoin.svg`

---

## 1. Identidad del símbolo

El isotipo de AJILEI es una **"letra doble"**: fusión deconstruida de la A y la J
(las dos primeras letras del nombre), con la **Heptacoin** — la moneda oficial del
ecosistema HEPTACREATION — en el corazón del vano.

Lecturas del símbolo (por capas):
1. **A** — la moneda ocupa la posición del travesaño, por lo que el ojo completa
   la letra sin necesidad de barra (y sin riesgo de lectura "4").
2. **J** — el asta derecha desciende bajo la línea base y remata en gancho.
3. **Moneda** — la Heptacoin es a la vez la tilde de la j y el oro del juego.
4. **Casa** — la H del cuño y las 7 estrellas firman a HEPTACREATION.

En el wordmark, la letra doble sustituye a la secuencia "AJ":
**[letra doble] + ILEI**.

---

## 2. Sistema de coordenadas

- Escala de construcción: **1 cm = 10 unidades SVG**.
- Conversión: `svg_x = 20 + 10·x` · `svg_y = 95 − 10·y` (origen en el punto a).
- Línea base: y = 0. El descendente de la J baja hasta y = −2.

## 3. Cotas selladas (en cm)

### Pieza A (trazo continuo a → e → d)
| Punto | Coordenada | Tramo | Medida |
|---|---|---|---|
| a | (0, 0) | e–a diagonal | 7,2 (= √52) |
| e | (4, 6) | d–e techo | 1,0 |
| d | (5, 6) | | |

Inclinación de la diagonal: arctan(4/6) ≈ 33,7° respecto a la vertical.

### Pieza J (trazo continuo c → b → f + gancho)
| Punto | Coordenada | Tramo | Medida |
|---|---|---|---|
| c | (5, 4.5) | b–c asta | 4,5 |
| b | (5, 0) | b–f descendente | 1,5 |
| f | (5, −1.5) | | |

**Gancho V-A (sellado):** arco circular por f(5·−1,5) → g(4·−2) → h(3·−1,5).
Centro del arco: (4, −0,75) · radio: 1,25 · barrido ≈ 106°.
En f existe un **quiebre deliberado** (≈37°, sin tangencia): decisión sellada;
da carácter crisp y mantiene el gancho abierto y tenso.

### Alineaciones estructurales
- d, c, b y f comparten x = 5 (el techo termina exactamente sobre el eje del asta).
- Aire vertical c–d = 1,5 (el asta arranca desnuda bajo el nivel del techo; las
  piezas **no se tocan**: la deconstrucción es parte de la identidad).

### Heptacoin en el isotipo
- Centro: **j = (3,25 · 2,25)** · Diámetro: **1,5**.
- El centro queda deliberadamente 0,16 a la izquierda del punto de aires iguales
  (x = 3,41): **desfase sellado** — acerca la moneda a la posición óptica del
  travesaño de la A y compensa la masa del gancho.

### Grosor
- **G2 = 0,5 cm (5 unidades)**, uniforme en todo el trazo, **techo incluido**
  (sin regla de 1,5× en el isotipo).
- Remates: redondos (`stroke-linecap="round"`).

Caja total del símbolo: 5 de ancho × 8 de alto (6 sobre base + 2 de descendente),
sin contar el medio grosor de los remates.

---

## 4. Heptacoin (moneda oficial del ecosistema)

**Diseño sellado: HC-1 "Grabada".**
- H serifada de HEPTACREATION al centro, **alto relieve** (cuerpo con gradiente
  claro + sombra desplazada +0,1/+0,14 de su radio).
- **7 estrellas de 5 puntas** en anillo simétrico (radio 33/100 del lienzo,
  puntas hacia afuera), **bajo relieve** (tono sombra plano).
- Canto acuñado estriado (anillo discontinuo) + filete interior.
- Nombre oficial: **Heptacoin** (verificación de colisiones de marca pendiente
  antes de uso público).

### Rampa tonal sancionada (excepción documentada al dorado único)
| Rol | Hex |
|---|---|
| brillo | #f4d27e / #f7dc92 |
| base (gold-brand) | #e8b84b |
| sombra | #c69736 / #a97f2a |
| profundo | #8a6520 / #b8892f (canto) |

La rampa existe **solo dentro del activo Heptacoin**. Fuera de la moneda, rige
el dorado único #e8b84b del sistema de diseño.

---

## 5. Doctrina de uso

1. **Diseño único en todos los tamaños.** No existen variantes simplificadas:
   la misma Heptacoin (con H y estrellas) se usa desde el favicon hasta la valla.
   A tamaños mínimos el cuño se funde en textura — efecto "casi se ve", sellado.
2. **No recolorear.** El isotipo es oro sobre fondo oscuro. Versión monocroma
   (una tinta) permitida solo para documentos impresos B/N.
3. **No deformar, no rotar, no separar** las piezas ni reposicionar la moneda.
4. **IDs de activos (contrato):** `heptacoin.svg` · `ajilei-isotipo.svg`.
   Las etiquetas de interfaz ("fichas"/"Heptacoins") son decisión de copy aparte.
5. Todo SVG entregable pasa **validación XML estricta** antes de publicarse
   (los comentarios XML no admiten `--`).

## 6. Aplicaciones oficiales
- Ícono de la app / favicon (derivados PNG 192/512 + maskable, pendientes).
- Wordmark en pantallas del juego: [letra doble] + ILEI.
- Heptacoin en toda representación de moneda del juego (campaña IDN-1).
- **Reverso oficial de las cartas volteadas** (sellado 2026-08-20; diseño de la
  composición del dorso pendiente como pieza propia).
- Web ajilei.com: imagen principal (hero) y sello de la moneda.
- Ecosistema HEPTACREATION: la Heptacoin es activo compartido (SumaMente y
  futuros), con reglas de transferencia por definir (ver acuerdos ECO/legales).

## 7. Historial de decisiones (resumen)
- Ruta "letra doble deconstruida" adoptada tras confirmar que el diseño previo
  (con travesaño-onda) se leía como "4" en tamaños pequeños.
- Signo central: M-2 Moneda > punto/línea/rombo/triángulo/corazón (los palos
  franceses se descartaron por asociación con la baraja equivocada).
- Cuño H > motivo hepta puro (transferibilidad de casa); 7 estrellas conservan
  el "hepta" y la resonancia con la diáspora.
- Gancho V-A (quiebre) > V-B (tangente): carácter crisp, sellado por Victor.
- G2 (0,5) > G1/G3: equilibrio letra–moneda en todos los tamaños.
