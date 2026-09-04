# AJILEI — Campaña PUE · Auditoría de la lámina sellada · v1.0

**Instrucción para Claude Code · 31-ago-2026 · Última aduana antes de la Fase 1**

---

## Contexto

Victor selló la lámina **`PUE_lamina_v1.7.html`** (vive en la raíz del repo, junto
a `index.html`, con `PUE_mesav_demo.jpg` y `PUE_mesapc_demo.png`). Es el contrato
visual de la Portada-Entrada: cinco escenas rotativas (baraja 4s · AJILEI 4s ·
enseñanza 4,5s · Heptacoins 4,5s · mesa 4s), patrón adaptativo (escritorio con
tarjeta visible; móvil vertical con botón JUGAR y tarjeta-hoja), traje compacto
para pantallas cortas, y selector de idioma **visible desde el día uno**
(decisión sellada de Victor).

Esta ronda hace dos cosas: **medir** que la lámina cumple sus promesas en
viewports reales, y **extraer** la regla exacta del halo del ganador para que la
Fase 1 la clone (la lámina lleva una aproximación declarada en `.mano::before`).

## Mandato

1. **Ningún archivo existente se modifica.** `src/`, `public/`, `docs/`, raíz y
   configuración: solo lectura. Los protegidos se leen si hace falta, no se tocan.
2. **Archivos nuevos permitidos, únicamente tres:** el arnés
   `scripts/diagPUE.mjs`, la carpeta de capturas `capturas-pue/` (sin rastrear) y
   el informe final.
3. La lámina se sirve con `npm run dev` y el arnés navega a
   `http://localhost:5173/PUE_lamina_v1.7.html`. Playwright ya vive en el
   proyecto; **sin dependencias nuevas**.
4. Sin commits, sin push. **Presupuesto:** 60–90 minutos; techo 2 horas. Lo que no
   quepa se declara como no-cubierto.

---

## Bloque 1 — Auditoría de arnés sobre la lámina

**Viewports del censo:** `1920×1080` · `390×844` · `360×640` · `320×568` ·
`851×393` (teléfono horizontal). En cada uno, capturas y mediciones:

- **1.1 La promesa "sin scroll".** En los tres verticales de teléfono: el botón
  JUGAR y su línea de vacuna caben COMPLETOS en el viewport inicial, sin
  desplazamiento. En 1920 y en 851×393: la tarjeta de entrada completa a la
  vista. Medir con bounding boxes contra `innerHeight`, no a ojo.
- **1.2 El wordmark se auto-verifica.** Leer del `<h1>` las custom properties
  `--brillo-ancho` y `--brillo-slot-dx` y compararlas con lo esperado:
  ≈224,84px en el escalón de 72px, ≈168,22px en el de 56px, y proporcional en el
  compacto (46px). **Esto cierra el [NO VERIFICADO] 1.2.4/1.3 de la Extracción.**
- **1.3 Geometría de escenas.** Por cada una de las cinco escenas activas:
  (a) el eje — |centro del contenido − centro de la frase| ≤ 8px;
  (b) sin invasiones — la tinta de la escena no intersecta la caja de la frase;
  (c) en `360×640`, el aire entre la mano del AJILEI y el marcador «51 AJILEI»
  es ≥ 12px. Esperar la clase `.activa` de cada escena para capturarla en su
  momento (el rotor va a 4/4/4,5/4,5/4 segundos).
- **1.4 La hoja móvil.** En `390×844`: clic en JUGAR → la tarjeta sube; su
  `background-color` computado es **opaco** (`#0c1d13`, sin alfa); `.escenario` y
  `.frase` quedan con `visibility: hidden`; el velo recibe los toques y un clic
  fuera cierra la hoja. Captura de la hoja abierta.
- **1.5 El selector de idioma.** El globo abre la lista (cinco entradas, Español
  activo con ✓, cuatro «Pronto»), y el clic fuera la cierra. Captura abierta en
  escritorio y en móvil.
- **1.6 Movimiento reducido.** Emular `prefers-reduced-motion: reduce`: la
  escena 1 se ve estática y completa, ninguna animación corre, el brillo del
  botón no se pinta.
- **1.7 La pausa de cortesía.** Foco en el campo de correo (escritorio): el
  índice de escena deja de avanzar mientras el foco viva en la tarjeta.
- **1.8 Bitácora de red.** Con `page.on('request')`, el arranque en frío de la
  lámina: lista de recursos con peso y momento. Verificar que las caras de las
  cartas y las dos capturas de mesa llegan **perezosas** (~2,5s), no en el
  primer pintado. Esto sella además el MÉTODO que el 4.4 de la Fase 0 dejó
  pendiente.
- **1.9 Consola limpia.** Cero errores de consola en todos los viewports.

## Bloque 2 — Extracción del halo del ganador

- **2.1** Localizar en el juego la regla real del halo/resplandor del jugador
  ganador (buscar en `src/styles/` y componentes de celebración; si vive en un
  protegido, se lee y se cita, no se toca). Entregar el CSS exacto con archivo y
  línea: colores, difuminado, extensión, animación y disparador.
- **2.2** Compararla con la aproximación de la lámina (`.mano::before` +
  `halo-pulso`) y listar las diferencias que la Fase 1 debe corregir para que la
  portada celebre EXACTAMENTE como celebra la mesa.

---

## Entregable único

**`docs/reportes/AJILEI_PUE_Auditoria_Informe_v1.0.md`**, numerado 1.1 → 2.2,
con la tabla veredicto por viewport (verde/rojo por medición, capturas
referenciadas de `capturas-pue/`) y un cierre de dos líneas:

- **Desviaciones halladas** (si las hay, con severidad — insumo de una v1.7.x).
- **Veredicto: ¿lista para Fase 1?** Sí o no, sin diplomacia.

*Un verde de este informe mide lo que dice: bounding boxes, propiedades
computadas y bitácora de red — no impresiones.*
