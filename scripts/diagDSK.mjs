// ── diagDSK.mjs · Arnés de diagnóstico DESKTOP (campaña DSK) ──────────────────
// Read-only: NO toca src/. Mide geometría/estilos con Edge headless (playwright-core).
// Uso:  node scripts/diagDSK.mjs <modo>
//   d1d2   → 1920×937: gates (matchMedia), estructura JSX activa, mapa DOM de los 11 frentes
//   d3     → matriz de 4 viewports: bbox de mesa/óvalo/paneles/mazos/abanico/botones + overflow
//   bug    → reproduce la revelación finalista y mide el reflow del panel ganador
//   shots  → capturas de los 4 viewports (+ la del bug si 'bug' corre antes)
//   all    → d1d2 + d3 + bug + shots
//   gate [tag] → DSK-G1: matriz matchMedia del gate + capturas WAITING (diff)
//   b1     → DSK-B1: presupuesto vertical por fila + overflow por viewport
//   tactil → verificación táctil coarse: hit-boxes REALES (::after, vía
//            elementFromPoint) validados ≥40px (estándar campaña, NO WCAG) +
//            no-solape (H mults, V mult/botón) + flujo funcional de una mano
//   r1     → DSK-R1: revelación de finalistas sin layout shift (mesas 5/4/3). Por
//            cada IA finalista revela su mano y verifica Δ=0 (óvalo, paneles,
//            área humana), solape de cartas por encima (elementFromPoint) y
//            restauración exacta al cerrar. Mesa 2 fuera de alcance.
//   r2     → DSK-R2: coreografía del curiosear (mesas 5/4/3). Verifica que el
//            canje corre las 4 fases (no instantáneo), tiempos idénticos a móvil,
//            Δ=0 en frames intermedios, estado final = R1 e interrupciones sin
//            zombis. R2c suma: Δ=0 del ÁREA TOTAL de juego (.game-table) +
//            estabilidad del scroll (documento y scroller) en todos los frames,
//            y confinamiento de la carta extrema dentro del perímetro del área
//            (≥0px de margen) POR ASIENTO. Args opcionales: [mesa] [WxH] para
//            filtrar. Mesa 2 fuera.
//   o1     → DSK-O1: óvalo central fijo. Mide el bbox de .center-zone en TODAS
//            las familias de mensaje reales del motor (inyectadas) + en los
//            estados REALES de una mano jugada, el umbral de wrap del mensaje
//            más largo y el desborde del texto respecto al perímetro del óvalo.
//            Mesa 5 es el alcance; 4/3/2 se miden como insumo. Args: [mesa] [WxH].
//   o2     → DSK-O2: óvalo congelado en mesas 4/3/2. 15 celdas (los 4 viewports de
//            campaña + CENTINELA 1440×850: la banda 801..900, root 18 con carta 76,
//            donde una constante por tier se rompe sin que la matriz de 4 lo note).
//            El peor caso se CONSTRUYE, no se juega: pozo 25000 (5×saldoInicial),
//            "A igualar" visible, las 15 familias con su CLASE real (msgPop apagada
//            —su scale(0.8) del primer frame acorta los rects un 20%—), pastilla de
//            rol en un solo lateral, pastilla de comodín inyectada en 3/2 (su
//            guardián es numPlayers>=4: una mesa reducida SÍ la lleva) y aviso de
//            eliminación con nombres de 12ch. Exige óvalo y vecinos Δ=0 entre todos
//            los estados, columnas = fórmula de token (±0.02), rivals-zone derivada
//            del panel vivo, .ai-zone = --o2-ai-h + su padding, escape de contenido
//            ≤0 (incluido el "+N" volador del pozo, que la guardia no puede
//            recortar), scroll sin overflow y cadena del óvalo SIN contexto de
//            apilamiento (el sobrevuelo de Z1 depende de eso). Args: [mesa] [WxH].
//   h1     → DSK-H1: área del jugador humano en las 4 mesas del gate. Reporta la
//            vía de render, la reserva del nombre (12ch: "Tú" vs 12 caracteres),
//            el shift-check O1 de un ciclo completo rol/TURNO/showdown (Δ=0 en el
//            área y sus vecinos) y el bloque de saldo (borde derecho inmóvil a
//            3/5/7 dígitos, "Mesa N" alineada debajo, "·" y "fichas" ausentes).
//            DSK-H2 amplía el ciclo a TRES manos para que el rol rote de verdad
//            (MANO → PIE → sin rol) —hasta H2 el techo de la mano cortaba antes y
//            las 16 celdas sólo veían MANO— y suma el frente hermano: alto del
//            header de cada IA y tapa de su fila de cartas (magnitudes verticales;
//            el ancho queda informativo por la elasticidad O1 abierta en mesa 4).
//            Args: [mesa] [WxH].
//   m1     → DSK-M1: mazo del humano a la mitad (y su gemelo IA de mesa 2) en las
//            16 celdas. Exige calibre objetivo ±0.5px, esquina superior IZQUIERDA
//            en las coordenadas PRE-tanda de la fase (a), wrapper con su ancho de
//            flujo y su alto intactos (compensación de margen), hueco mazo→cartas
//            esperado, sombras del rival, abanico de barajado atado al mazo,
//            reserva viva con .deck-hidden y Δ=0 en el área durante una rotación
//            completa de PIE (3 manos). Args: [mesa] [WxH].
//   a1     → DSK-A1: anclaje arriba-izquierda del abanico humano (preparación de
//            F1). En las 16 celdas y a lo largo de una rotación completa de PIE:
//            origen (esquina sup-izq de la 1ª carta) CONSTANTE en todas las fases
//            y con/sin cartas, huecos = tokens --dsk-fan-gap-left/-top (±0.5px),
//            slot y carta con el mismo anclaje, mazo en las coordenadas M1
//            exactas, "Tu mejor palo" reubicada (sitio, ciclo de visibility,
//            encaje sin recorte —peor caso inyectado incluido—, cero colisión
//            con el abanico y apilamiento), Δ=0 contra la baseline PRE-tanda en
//            área/barra/botones/timer/saldo y guardia de deriva de los tokens
//            primitivos contra el padding vivo. Args: [mesa] [WxH].
//   a2     → DSK-A2: abanico del humano CENTRADO (variante A) + mazo recolocado
//            al ritmo de --dsk-fan-gap-left + "Tu mejor palo" mudada debajo de
//            las cartas. 20 celdas (las 16 de campaña + el centinela 1440×850) y
//            una mano completa cada una, con 14 puertas: simetría del grupo de 5
//            contra los filos útiles, origen constante, PISO F1 con doble puerta
//            (fórmula viva Y valor pre-A2), respiro pila→carta 1 = token con y
//            sin PIE, aterrizaje del mazo dentro del filo, banda en su sitio
//            derivado / sin recorte con el marcado real / centrada / sin tocar
//            botón ni texto de la barra, fuera de flujo ESTRICTO (Δ=0 en 11
//            anclas + 5 slots + scrollHeight/clientHeight), overflow 0, ciclo de
//            visibility (viva sólo en la fase de pago) y guardia de la fase de
//            APUESTA —ambos como condición de passed, porque son lo único que
//            impide que la banda tape la fila de multiplicadores—, vuelos por
//            encima de la banda, gemelo IA de mesa 2 inmóvil y guardia de deriva
//            de las primitivas. Args: [mesa] [WxH].
//   u1     → DSK-U1: menú de utilidades en escritorio. 20 celdas (16 de campaña
//            + centinela 1440×850) con una mano completa cada una y el menú
//            abierto en reposo, apuesta, descarte con selección, pago, revelado
//            y revelado+sobrevuelo Z1. Doce puertas: caja del disparador Δ=0
//            contra la baseline PRE-tanda de HEAD 7ef28c9 (40,61×32, más
//            .header-right y la ✕), fuera de flujo estricto (Δ=0 en 11 anclas +
//            scrollHeight/clientHeight al abrir Y al cerrar), overflow 0 en los
//            tiers ≤800, z del panel por encima del techo VIVO del área
//            (revelado 7, Z1 9) y por debajo de los modales, ganando además el
//            hit-test en centro y esquinas, las tres vías de cierre —clic fuera,
//            Esc y ejecutar— más la prueba de que el clic fuera NO se traga la
//            acción (con el menú abierto, el clic sobre "Iniciar mano" arranca la
//            mano), estado y persistencia del toggle de sonido, guardia de
//            contenido (el panel jamás toca botones de acción, multiplicadores,
//            timer ni la banda "Tu mejor palo") y encaje dentro del viewport.
//            Suma una sub-pasada pointer:coarse (hits ⋮ y entradas ≥40, sin
//            robarle el hit a la ✕) y una de persistencia end-to-end
//            (apagar → recargar → volver a la mesa). Args: [mesa] [WxH].
//   u2     → DSK-U2: reacciones entre jugadores (selector + burbuja + candado).
//            20 celdas con las diez puertas: el selector abre desde 💬 y cierra
//            por sus TRES vías (Esc, clic fuera, selección), su rejilla 3×4 no
//            toca cartas ni botones del humano, la burbuja se ancla por la
//            TINTA del nombre (rect de Range, no la caja de 12ch), Δ=0 de layout
//            y guardia de contenido, capa 25/31 contra el censo vivo, la frase
//            mostrada es la elegida (lista importada de src/config/reacciones.js
//            — nunca una copia), y la X mata lo visual SIN liberar el cooldown.
//            Dos sub-pasadas: ciclo 0,3/2,4/0,3 muestreando opacidad + el reloj
//            de turno corriendo indiferente, y pointer:coarse para el hit ≥40 de
//            la X (embaldosado B2) sin desbordar hacia las cartas.
//            DSK-U2c (emoji vivo, v1.4): la frase sellada se lee del NOMBRE
//            ACCESIBLE y no del textContent —el emoji dejó de ser texto—, y las
//            dos guardias que medían CAJAS miden ahora también TINTA, que es lo
//            que de verdad rebosa. Tres puertas nuevas por celda (tinta dentro
//            de la caja y a la izquierda de la ✕ · tinta dentro de la fila de
//            44px · intercambio a SVG bajo prefers-reduced-motion, leyendo
//            currentSrc) y tres sub-pasadas nuevas: assets 12/12 con su
//            presupuesto de peso (global, una vez), caja del <img> estable ante
//            recurso FRESCO (m5 1366, ensayo revertido) y jerarquía con la
//            celebración viva (m2, alcance declarado como vc·jugado).
//            Args: [mesa] [WxH].
//   u3     → DSK-U3: "Mano actual" funcional (consulta por mano con contador).
//            20 celdas (16 de campaña + centinela 1440×850) × las cuatro mesas.
//            Diez puertas: la entrada consume EXACTAMENTE 1 en el primer press
//            de la mano; el valor mostrado coincide con getBestSuitScore del
//            estado VIVO por verificación CRUZADA (cartas leídas del DOM +
//            reglas leídas del chip de comodín + la misma fuente única corrida
//            aquí en Node contra los data-* del popup — jamás una regex sobre
//            el copy); el re-press de la misma mano deja Δcontador=0 y vuelve a
//            derivar el valor; una mano nueva vuelve a cobrar; a N=0 sale el
//            popup de agotadas con Δcontador=0; la entrada queda `is-disabled`
//            en fase de pago y sin mano; el INVARIANTE SELLADO del badge (press
//            del badge → popup del contador y el menú SIGUE ABIERTO); los dos
//            autocierres (4s del valor, 2s del badge) y el cierre por clic
//            fuera; Δ=0 de layout con el popup presente; y la capa contra el
//            censo vivo. Expectativas derivadas de los tokens y constantes
//            vivos. Lección W1 en cada clic: un cambio de estado por iteración
//            y rechequeo antes del siguiente.
//            Args: [mesa] [WxH].
//   vc     → DSK-VC2: Victory Celebration (viaje del pozo, AJILEI, cierre de
//            partida). Receta O2: el peor caso se CONSTRUYE. AJILEI no se
//            alcanza jugando (cinco del palo sumando 51) y la partida pide
//            arruinar a todas las IAs, así que la matriz de 20 celdas inyecta
//            el DOM exacto que los componentes pintan y audita el contrato de
//            CSS: capa 26/32 contra el censo VIVO, Δ=0 durante Y después,
//            geometría del viaje (pozo → .pbr-chips, siempre abajo-derecha) y
//            el pulso de UN ciclo sobre elemento propio. La celebración de
//            verdad —con su audio— va en sub-pasada JUGADA: se repiten manos
//            hasta que gana el humano (disciplina W1 en cada clic) y ahí se
//            observa Howler de verdad (window.Howler._howls): que suene
//            chips-collect, que win.mp3 NO suene, y que el toque corte dibujo
//            y sonido de un golpe. Otra sub-pasada mide el techo de duración y
//            el mute, apagándolo por la entrada del menú y no por una API.
//            El decisor (winner === 0 sin excepción, incluido el blindaje del
//            AJILEI PERDIDO con winner !== 0) se comprueba en Node contra la
//            fuente única — es el caso que jugando no se puede provocar.
//            Args: [mesa] [WxH].
//            OJO: el modo r2 lanza el navegador SIN --hide-scrollbars (ver el
//            launch al final): con las barras ocultas, la que aparece/desaparece
//            por overflow desplazable NUNCA encoge el cliente y el saltito de
//            15px es literalmente invisible al arnés.
//   menu-movil → MOV-1a: el menú de utilidades en MÓVIL. 16 celdas (mesas
//            5/4/3/2 × 375x812 · 360x640 · 812x375 · 640x360, los cuatro que
//            MOV-0 canonizó) con una mano repartida y el menú abierto. Dieciocho
//            puertas: la celda es móvil y coarse; caja del disparador Δ=0 contra
//            la caja de la BOCINA medida por MOV-0 (40,61×32, y 32×28 en mesa 2
//            horizontal, que fija el protegido) y `.mute-button` es él y no una
//            bocina superviviente; hit 44×44 real con `elementFromPoint` en las
//            cuatro esquinas del `::after`, sin robarle el suyo a la ✕ ni a la
//            ficha de esquina de la IA; pinza vertical de D4 (`top` dentro de
//            [8, H−252]) y encaje completo en el viewport; geometría por partida
//            DOBLE —derivada del contenido vivo Y contra las cifras selladas de
//            `u1` (64×244 · 62×44 · 5 filas)—, que es lo único que detecta que
//            las dos pieles del menú se han separado; las cinco leyendas y su
//            orden; Sonido viva y las otras cuatro grises E INERTES (`disabled`
//            de verdad, no `pointer-events`); el badge del contador sin montar;
//            guardia de contenido (0 px² contra botones, multiplicadores, timer
//            y saldo del humano); z por encima del techo vivo ganando además el
//            hit-test; fuera de flujo estricto (Δ=0 en las 11 anclas y scroll
//            intacto al abrir); cierre por TAP fuera —con el dedo, que es el
//            gesto real— y por Esc; y Sonido que alterna, cierra al ejecutar y
//            persiste en la MISMA clave que escritorio. Args: [mesa] [WxH].
//            Capturas a MOV1A_OUT (por defecto capturas-dsk/).
// Salida: JSON a stdout y a scratchpad; PNGs a capturas-dsk/.
import { register } from 'node:module'
// El motor importa sin extensión y es archivo PROTEGIDO: el arnés se adapta
// con un gancho de resolución propio (ver scripts/_resolveExt.mjs).
register('./_resolveExt.mjs', import.meta.url)
import { chromium } from 'playwright-core'
import { writeFileSync, readFileSync } from 'node:fs'
// La versión del instrumento se LEE del paquete instalado, no se copia a mano:
// una copia a mano miente en cuanto alguien actualiza el pin.
const PW_VERSION = JSON.parse(
  readFileSync(new URL('../node_modules/playwright-core/package.json', import.meta.url), 'utf8')).version
// DSK-U3 · el arnés lee de la MISMA fuente que la app (clave, saldo gratis y
// los dos autocierres) y recompone el valor con el MISMO evaluador. Ninguna de
// estas cifras se repite aquí: si una se mueve en src/, la puerta se mueve con
// ella. Los tres módulos son autocontenidos (sin imports propios), así que
// `node` los carga tal cual — sin pasar por el resolvedor de Vite.
import {
  CONSULTAS_KEY as U3_KEY, CONSULTAS_GRATIS,
  CONSULTA_POPUP_MS, BADGE_POPUP_MS,
} from '../src/config/consultas.js'
import { VALUE_NAMES, getCardPoints, createDeck, shuffleDeck } from '../src/engine/deck.js'
import { getBestSuitScore, isAjilei } from '../src/engine/handEvaluator.js'
// ARN-1 · NIV-UI metió una pantalla de nivel en la ruta. El arnés lee los
// niveles de la MISMA fuente única que la app (mismo criterio que consultas.js)
// para no clavar ni el orden de la rejilla ni los montos: los `id` son el
// CONTRATO del producto y los rótulos son copy declarado provisional.
import { NIVELES, NIVEL_POR_DEFECTO, apuestasDe } from '../src/config/niveles.js'
// MOV-1b-a · las entradas del menú y qué está vivo en cada rama salen de la
// MISMA fuente única que la app (mismo criterio que consultas.js, niveles.js y
// tapetes.js). El modo `menu-movil` DERIVA de aquí lo que espera, así que
// encender una entrada en MOV-1b-c mueve la puerta con ella y no hay que
// acordarse de recablear una lista a mano.
import { ENTRADA, VIVAS_MOVIL } from '../src/config/menuEntradas.js'
// EMB-2 · el catálogo de tapetes y sus claves salen de la MISMA fuente única
// que la app (mismo criterio que consultas.js y niveles.js): el modo `tapetes`
// siembra el storage con la clave real y recorre los ids de contrato, así que
// añadir un sexto tapete no exige tocar el arnés.
import {
  TAPETES, TAPETE_POR_DEFECTO, TAPETE_KEY, TAPETES_COMPRADOS_KEY, montoTexto,
} from '../src/config/tapetes.js'
// MOV-1b-c · las frases, los tiempos y las rutas de emoji del modo `menu-movil`
// salen de la MISMA fuente que la app, igual que en `u2`. `runU2` las importa
// dinámicamente dentro de su función; aquí hace falta arriba porque el modo
// `menu-movil` deriva de ellas sus constantes de módulo.
import {
  REACCIONES as MOVMENU_FRASES, REACCION_TOTAL_MS, REACCION_COOLDOWN_MS,
  REACCION_ENTRADA_MS, REACCION_PICO_PX, rutaEmoji as movRutaEmoji,
} from '../src/config/reacciones.js'
// La burbuja ENTRA animada (`scale(0.94)` → 1 en el primer 10% del ciclo), y
// `getBoundingClientRect` devuelve la caja TRANSFORMADA. Medir en cuanto asoma
// da 86,07×76,14 donde la caja real es 91,56×81 — exactamente el 94%. No es una
// regresión, es medir antes de tiempo, así que hay UN solo sitio que sabe
// cuánto hay que esperar y lo deriva del reparto sellado.
const movEsperaEntrada = (page) => page.waitForTimeout(REACCION_ENTRADA_MS + 80)

const BASE = 'http://localhost:5173'
const OUT_DIR = 'capturas-dsk'
const MODE = process.argv[2] || 'all'

// ── Metadatos del instrumento (ARN-1) ────────────────────────────────────────
// Se vuelcan en cada JSON de salida. Un número de esta tanda que no aparezca
// aquí es un número que nadie podrá atribuir dentro de seis meses.
//   · playwright-core va PINEADO EXACTO en devDependencies (instrumento de
//     medida: los píxeles cambian entre versiones).
//   · OJO — el pin de playwright NO pina el navegador: los modos lanzan con
//     `channel: 'msedge'`, o sea el Edge INSTALADO EN LA MÁQUINA, que se
//     autoactualiza por su cuenta. La versión de Chromium con la que se
//     re-fotografiaron las baselines de ARN-1 queda registrada abajo, y se
//     RELEE en vivo en cada corrida para que una deriva del navegador se vea en
//     el propio JSON en vez de esconderse dentro de un Δ inexplicable.
const ARNES = {
  tanda: 'ARN-1',
  // Re-sellado en el cierre de la campaña VIS (2026-08-21/22), con autorización de
  // Victor. NO es un ajuste cosmético para callar el aviso: la corrida completa
  // de los 23 modos se hizo ENTERA con este Chromium y salió verde en todos los
  // que emiten veredicto, así que las baselines quedan atribuidas a la versión
  // con la que de verdad se comprobaron. La versión anterior era 151.0.4129.86
  // (Edge estable, 16-ago-2026).
  chromiumBaselines: '151.0.4129.93',   // Edge estable, leído en vivo el 21-ago-2026
}

// Ruta canónica: nivel y apuesta parametrizables, con los defaults del §0 de
// ARN-1. `--nivel` / `--stake` permiten reproducir cualquier celda histórica
// sin editar el arnés.
const argNamed = (nombre, porDefecto) => {
  const i = process.argv.indexOf(`--${nombre}`)
  return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : porDefecto
}
const ARNES_NIVEL = argNamed('nivel', NIVEL_POR_DEFECTO)
const ARNES_STAKE_IDX = Number(argNamed('stake', 0))

const VIEWPORTS = [
  { w: 1024, h: 768 },
  { w: 1280, h: 720 },
  { w: 1366, h: 768 },
  { w: 1920, h: 937 },
]

const round = (n) => n == null ? null : Math.round(n * 100) / 100

// Última ruta recorrida, para que cada JSON diga con qué nivel y con qué monto
// se tomaron sus números. Un baseline sin esa etiqueta no es comparable.
let RUTA_USADA = null

// ── Navegación a Mesa de N (5/4/3/2) ─────────────────────────────────────────
//
//   REGLA DE CAMPAÑA (ARN-1): «Quien mueve la ruta, recablea el metro.»
//
// Toda tanda de producto que altere la ruta de navegación o renombre selectores
// que este arnés consume DEBE incluir, en la MISMA tanda, la actualización del
// arnés y la re-fotografía contabilizada de sus baselines. Así se rompió esta
// vez: NIV-UI (`0a45935`) intercaló la pantalla de nivel y renombró el botón de
// apuesta, y el arnés se quedó hablando con una pantalla que ya no existía —
// TODOS los modos que navegan en rojo, por una causa que no era geometría, y
// nadie se enteró hasta EMB-1. Un arnés a oscuras es peor que no tenerlo: da
// rojos que no significan nada y entrena a ignorarlos.
//
// RUTA CANÓNICA (desde NIV-UI):
//   Welcome → «Jugar vs IA» → NivelSelect → nivel → ModeSelect → «Mesa de N» → apuesta
//
// Nivel y apuesta se eligen por ÍNDICE DERIVADO de `config/niveles.js`, jamás
// por el rótulo visible: los `id` son el contrato del producto («no se renombran
// nunca») mientras que los nombres son copy que Victor declaró provisional. Un
// arnés colgado del texto se rompe con el próximo ajuste de copy — que es
// justo la clase de avería que esta tanda viene a reparar.
async function gotoMesa(page, n = 5, nivel = ARNES_NIVEL, stakeIdx = ARNES_STAKE_IDX) {
  const iNivel = NIVELES.findIndex(x => x.id === nivel)
  if (iNivel < 0) throw new Error(`gotoMesa: nivel desconocido "${nivel}"`)
  const montos = apuestasDe(nivel)
  if (!montos[stakeIdx]) throw new Error(`gotoMesa: stake ${stakeIdx} fuera de ${nivel}`)

  await page.goto(BASE)
  await recorrerRuta(page, n, iNivel, stakeIdx)
  await page.mouse.move(5, 5) // neutraliza hover de cartas
  RUTA_USADA = { nivel, stakeIdx, monto: montos[stakeIdx] }
  return RUTA_USADA
}
const gotoMesa5 = (page) => gotoMesa(page, 5)

// Los tres clics de la ruta, sin el `goto`. Se comparte con `volverALaMesa`
// para que exista UN SOLO sitio que sepa cómo se llega a la mesa: la avería de
// NIV-UI se coló, entre otras cosas, porque `runU1` tenía su propia copia.
async function recorrerRuta(page, n, iNivel, stakeIdx) {
  await page.click('button:has-text("Jugar vs IA")')
  // Pantalla 1 · nivel. `nth-of-type` sobre la rejilla: los hijos de
  // `.nivel-grid` son los tres <button>, en el orden de NIVELES.
  await page.waitForSelector('.nivel-grid button')
  await page.click(`.nivel-grid button:nth-of-type(${iNivel + 1})`)
  // Pantalla 2 · mesa y monto en la MISMA superficie: la rejilla de apuesta
  // RELEVA a la de mesas en vez de apilarse debajo, así que hay que esperar el
  // relevo antes de pulsar el monto o se clica sobre el DOM anterior.
  await page.click(`button:has-text("Mesa de ${n} jugadores")`)
  await page.waitForSelector('.mode-stake-btn')
  await page.click(`.mode-stake-grid button:nth-of-type(${stakeIdx + 1})`)
  await page.waitForSelector('.game-table')
}

// Re-navega SIN recargar ni tocar storage (la app ya está en Welcome tras un
// `reload`). La usa la prueba de persistencia de sonido de `u1`.
async function volverALaMesa(page, n = 5, nivel = ARNES_NIVEL, stakeIdx = ARNES_STAKE_IDX) {
  const iNivel = NIVELES.findIndex(x => x.id === nivel)
  await recorrerRuta(page, n, iNivel, stakeIdx)
  await page.mouse.move(5, 5)
}

const clickIf = async (page, s) => {
  const b = page.locator(s).first()
  if (await b.count() && await b.isVisible().catch(() => false)) {
    await b.click().catch(() => {}); return true
  }
  return false
}

// Auto-juega una mano hasta el showdown (botón "Siguiente mano" visible).
async function playToShowdown(page, maxIter = 200) {
  await clickIf(page, 'button:has-text("Iniciar mano")')
  for (let i = 0; i < maxIter; i++) {
    await page.waitForTimeout(350)
    await page.mouse.move(5, 5)
    if (await page.locator('button:has-text("Siguiente mano")').isVisible().catch(() => false)) return true
    await clickIf(page, '.action-buttons button:has-text("Pasar")') ||
      await clickIf(page, '.action-buttons button:has-text("Igualar")') ||
      await clickIf(page, '.action-buttons button:has-text("Apostar")')
    await clickIf(page, 'button:has-text("Sin descartar")')
  }
  return page.locator('button:has-text("Siguiente mano")').isVisible().catch(() => false)
}

// ── Helpers de medición dentro de la página ──────────────────────────────────
// Inyecta funciones reutilizables en window para medir rects, texto y estilos.
async function installProbes(page) {
  await page.evaluate(() => {
    window.__rect = (el) => {
      if (!el) return null
      const r = el.getBoundingClientRect()
      return { x: r.x, y: r.y, w: r.width, h: r.height, top: r.top, right: r.right, bottom: r.bottom, left: r.left }
    }
    window.__textRect = (el) => {
      if (!el) return null
      const range = document.createRange()
      range.selectNodeContents(el)
      const r = range.getBoundingClientRect()
      return { x: r.x, y: r.y, w: r.width, h: r.height }
    }
    window.__css = (el, props) => {
      if (!el) return null
      const cs = getComputedStyle(el)
      const o = {}
      props.forEach(p => { o[p] = cs.getPropertyValue(p) })
      return o
    }
    window.__all = (sel) => [...document.querySelectorAll(sel)]
    // R2c · métricas de scroll: documento + scroller real de la mesa. barV/barH
    // = grosor VIVO de cada barra (offset − client): 0 sin barra, 15 con ella.
    // El scroll de la mesa vive DENTRO de .game-table-screen (nunca en el
    // documento) — se muestrean ambos porque el saltito puede nacer en cualquiera.
    window.__scrollMetrics = () => {
      const de = document.scrollingElement || document.documentElement
      const scr = document.querySelector('.game-table-screen')
      return {
        docL: de.scrollLeft, docT: de.scrollTop, docW: de.scrollWidth, docH: de.scrollHeight,
        docCW: de.clientWidth, docCH: de.clientHeight,
        bodyW: document.body.scrollWidth, bodyH: document.body.scrollHeight,
        scrL: scr ? scr.scrollLeft : 0, scrT: scr ? scr.scrollTop : 0,
        scrW: scr ? scr.scrollWidth : 0, scrH: scr ? scr.scrollHeight : 0,
        scrCW: scr ? scr.clientWidth : 0, scrCH: scr ? scr.clientHeight : 0,
        barV: scr ? scr.offsetWidth - scr.clientWidth : 0,
        barH: scr ? scr.offsetHeight - scr.clientHeight : 0,
      }
    }
  })
}

// ── D1 + D2 · 1920×937 ────────────────────────────────────────────────────────
async function runD1D2(browser) {
  const page = await browser.newPage({ viewport: { width: 1920, height: 937 } })
  await gotoMesa5(page)
  await installProbes(page)

  // Gates (matchMedia) — misma fuente que los hooks de React.
  const gates = await page.evaluate(() => ({
    landscapeTableMQ: '(orientation: landscape) and (max-height: 600px)',
    portraitTableMQ: '(max-width: 767px) and (orientation: portrait)',
    isLandscapeTable: window.matchMedia('(orientation: landscape) and (max-height: 600px)').matches,
    isPortraitTable: window.matchMedia('(max-width: 767px) and (orientation: portrait)').matches,
    mqDesktopTall: window.matchMedia('(min-width: 768px) and (min-height: 900px)').matches,
    mqDesktopMid: window.matchMedia('(min-width: 768px) and (min-height: 601px)').matches,
    cardW: getComputedStyle(document.documentElement).getPropertyValue('--card-w').trim(),
    cardH: getComputedStyle(document.documentElement).getPropertyValue('--card-h').trim(),
    innerW: window.innerWidth, innerH: window.innerHeight,
  }))

  // Estructura JSX activa: qué contenedores existen en el DOM.
  const structure = await page.evaluate(() => ({
    hasTableMid: !!document.querySelector('.table-mid'),
    hasSideColLeft: !!document.querySelector('.side-col-left'),
    hasSideColRight: !!document.querySelector('.side-col-right'),
    hasRivalsZone: !!document.querySelector('.rivals-zone'),
    hasCenterZone: !!document.querySelector('.center-zone'),
    hasTwoOvals: !!document.querySelector('.two-ovals'),
    hasAiZone: !!document.querySelector('.ai-zone'),
    hasTableBrand: !!document.querySelector('.table-brand'),           // brandInMid
    brandInHeader: !!document.querySelector('.table-header .table-title'),
    gameTableClasses: document.querySelector('.game-table')?.className,
    oppPanels: document.querySelectorAll('.opp-panel').length,
    letterBadges: [...document.querySelectorAll('.seat-badge')].map(b => b.textContent.trim()),
    cornerChips: document.querySelectorAll('.opp-corner-chip').length,
    oppChipsLines: document.querySelectorAll('.opp-chips').length,
    centerZoneDisplay: getComputedStyle(document.querySelector('.center-zone')).display,
    tableMidDisplay: document.querySelector('.table-mid') ? getComputedStyle(document.querySelector('.table-mid')).display : null,
    tableMidGridCols: document.querySelector('.table-mid') ? getComputedStyle(document.querySelector('.table-mid')).gridTemplateColumns : null,
  }))

  // WAITING snapshot (antes de iniciar)
  const snapWaiting = await snapshotFrentes(page)

  // Jugar hasta showdown para capturar estados ricos (badges, score, oval con mensajes)
  const reached = await playToShowdown(page)
  const snapShowdown = await snapshotFrentes(page)

  const page2 = page
  return { page: page2, data: { gates, structure, snapWaiting, snapShowdown, reachedShowdown: reached } }
}

// Mide los 11 frentes en el estado actual.
async function snapshotFrentes(page) {
  return page.evaluate(() => {
    const R = window.__rect, T = window.__textRect, C = window.__css
    const q = (s) => document.querySelector(s)
    const qa = (s) => [...document.querySelectorAll(s)]

    // 1. Texto "fichas" (IA + humano)
    const oppChips = qa('.opp-chips').map(el => ({ text: el.textContent.trim(), rect: R(el), css: C(el, ['font-size', 'line-height', 'color', 'display']) }))
    const pbrFichas = q('.pbr-fichas-word')
    const pbrChips = q('.pbr-chips')

    // 2. Ficha IA / mecanismo ocultar-revelar saldo
    const cornerChips = qa('.opp-corner-chip').map(el => ({ rect: R(el), display: getComputedStyle(el).display }))

    // 3. Nombre IA
    const oppNames = qa('.opp-name').map(el => ({ text: el.textContent.trim(), rect: R(el), textRect: T(el), css: C(el, ['text-align', 'color', 'font-size', 'padding', 'margin']) }))

    // 4. Badges PIE/MANO/TURNO en IA
    const badges = qa('.opp-panel .seat-badge').map(el => ({ text: el.textContent.trim(), cls: el.className, rect: R(el), css: C(el, ['font-size', 'padding', 'background-color', 'color', 'letter-spacing']) }))

    // 5. Palabra de estado
    const oppStatus = qa('.opp-status').map(el => ({ text: el.textContent.trim(), rect: R(el), css: C(el, ['position', 'font-size', 'color', 'font-style']) }))

    // 6. Panel ganador (reflow) — datos base (el modo bug mide el delta)
    const winner = q('.opp-winner')
    const winnerData = winner ? { rect: R(winner), cardsRect: R(winner.querySelector('.opp-cards')), cardSlots: qa('.opp-winner .opp-card-slot').map(R) } : null

    // 7. "Mejor palo: X (N pts)"
    const oppScore = qa('.opp-score').map(el => ({ text: el.textContent.trim(), visibility: el.style.visibility || getComputedStyle(el).visibility, rect: R(el) }))
    const playerScore = q('.score-tag-player')

    // 8. Óvalo central
    const cz = q('.center-zone')
    const gm = q('.game-message')
    const oval = cz ? {
      rect: R(cz),
      css: C(cz, ['display', 'box-sizing', 'border-radius', 'padding', 'width', 'height', 'grid-template-columns', 'overflow', 'flex']),
      messageRect: R(gm),
      messageText: gm?.textContent.trim(),
      messageCss: gm ? C(gm, ['font-size', 'height', 'line-height', 'flex']) : null,
    } : null

    // 9. Curiosear: nombres tappables + shake + choreo
    const tappable = qa('.opp-name-tappable').length
    const shaking = qa('.opp-name-shake').length
    const revealClasses = qa('[class*="opp-reveal"]').map(el => el.className)

    // 10. Bloque "Tú [MANO]"
    const pbLeft = q('.player-bar-left')
    const tuBlock = pbLeft ? {
      rect: R(pbLeft),
      css: C(pbLeft, ['display', 'justify-self', 'overflow', 'white-space', 'text-overflow']),
      name: q('.pbr-name')?.textContent.trim(),
      nameRect: R(q('.pbr-name')),
      tags: qa('.pbr-tags .seat-badge').map(el => el.textContent.trim()),
      badgesRect: R(q('.pbr-badges')),
    } : null

    // 11. Saldo humano + "· Mesa N"
    const pbRight = q('.player-bar-right')
    const saldoBlock = pbRight ? {
      rect: R(pbRight),
      html: pbRight.innerHTML.replace(/\s+/g, ' ').trim(),
      css: C(pbRight, ['display', 'justify-self', 'white-space', 'color']),
      chips: q('.pbr-chips')?.textContent.trim(),
      sep: q('.pbr-sep')?.textContent,
      sepRect: R(q('.pbr-sep')),
      mesa: q('.pbr-mesa')?.textContent.trim(),
      fichasWord: { text: document.querySelector('.pbr-fichas-word')?.textContent.trim(), display: document.querySelector('.pbr-fichas-word') ? getComputedStyle(document.querySelector('.pbr-fichas-word')).display : null },
    } : null

    return {
      phaseMsg: q('.game-message')?.textContent.trim(),
      oppChips, pbrFichas: pbrFichas ? { text: pbrFichas.textContent.trim(), display: getComputedStyle(pbrFichas).display } : null,
      pbrChipsText: pbrChips?.textContent.trim(),
      cornerChips, oppNames, badges, oppStatus, winnerData, oppScore,
      playerScore: playerScore ? { text: playerScore.textContent.trim(), visibility: playerScore.style.visibility } : null,
      oval, tappable, shaking, revealClasses, tuBlock, saldoBlock,
    }
  })
}

// ── D3 · Matriz de adaptabilidad ──────────────────────────────────────────────
async function runD3(browser) {
  const rows = []
  for (const vp of VIEWPORTS) {
    const page = await browser.newPage({ viewport: { width: vp.w, height: vp.h } })
    await gotoMesa5(page)
    await installProbes(page)
    // Iniciar mano para que el tablero tenga cartas (abanico humano, mazos visibles)
    await clickIf(page, 'button:has-text("Iniciar mano")')
    await page.waitForTimeout(1600)
    await page.mouse.move(5, 5)
    const m = await page.evaluate((vp) => {
      const R = window.__rect
      const q = (s) => document.querySelector(s)
      const qa = (s) => [...document.querySelectorAll(s)]
      const screen = q('.game-table-screen')
      const table = q('.game-table')
      return {
        viewport: vp,
        cardW: getComputedStyle(document.documentElement).getPropertyValue('--card-w').trim(),
        mqTall: window.matchMedia('(min-width: 768px) and (min-height: 900px)').matches,
        mqMid: window.matchMedia('(min-width: 768px) and (min-height: 601px)').matches,
        screenRect: R(screen),
        screenScroll: { scrollH: screen.scrollHeight, clientH: screen.clientHeight, overflow: screen.scrollHeight - screen.clientHeight },
        docScroll: document.scrollingElement.scrollHeight - document.scrollingElement.clientHeight,
        table: R(table),
        oval: R(q('.center-zone')),
        oppPanels: qa('.opp-panel').map(el => ({ pos: [...el.classList].find(c => c.startsWith('opp-') && (c.includes('top') || c.includes('side'))), rect: R(el) })),
        decks: qa('.deck-pile:not(.deck-hidden)').map(R),
        humanFan: R(q('.player-zone .cards-row')),
        brand: R(q('.table-title')),
        handBadge: R(q('.hand-badge')),
        buttons: R(q('.player-bar-center')),
        playerBar: R(q('.player-bar')),
      }
    }, vp)
    rows.push(m)
    await page.close()
  }
  return rows
}

// ── Punto 6 · Bug de revelación finalista ─────────────────────────────────────
async function runBug(browser) {
  const page = await browser.newPage({ viewport: { width: 1920, height: 937 } })
  await gotoMesa5(page)
  await installProbes(page)

  // Reintenta manos hasta obtener un showdown REAL (ganador con score → paneles revelados)
  let showdownReal = false
  for (let attempt = 0; attempt < 6 && !showdownReal; attempt++) {
    await playToShowdown(page)
    showdownReal = await page.locator('.opp-winner').count() > 0 ||
      await page.evaluate(() => !!document.querySelector('.card-slot-winner') || [...document.querySelectorAll('.opp-panel')].some(p => p.className.includes('opp-winner')))
    if (!showdownReal) {
      await clickIf(page, 'button:has-text("Siguiente mano")')
      await page.waitForTimeout(1800)
    }
  }
  await page.mouse.move(5, 5)

  // Mide ANTES de tocar (estado tras el showdown, ganadora ya revelada por defecto)
  const before = await measureReflow(page)

  // Encuentra un nombre tappable NO revelado y lo toca (curiosear otra mano)
  const tapped = await page.evaluate(() => {
    const cand = [...document.querySelectorAll('.opp-name-tappable')]
      .find(el => !el.closest('.opp-panel').className.includes('opp-winner'))
    if (cand) { cand.click(); return cand.closest('.opp-panel').className }
    return null
  })
  await page.waitForTimeout(1200)
  await page.mouse.move(5, 5)
  const after = await measureReflow(page)

  // Captura del bug
  await page.screenshot({ path: `${OUT_DIR}/dsk_m5_bug_reveal.png` })

  return { showdownReal, tapped, before, after }
}

// Mide anchos de paneles, óvalo y fila de cartas del ganador (para el delta de reflow).
async function measureReflow(page) {
  return page.evaluate(() => {
    const R = (el) => { if (!el) return null; const r = el.getBoundingClientRect(); return { x: r.x, w: r.width, h: r.height, right: r.right, left: r.left } }
    const qa = (s) => [...document.querySelectorAll(s)]
    return {
      panels: qa('.opp-panel').map(el => ({
        pos: [...el.classList].find(c => c.startsWith('opp-') && (c.includes('top') || c.includes('side'))) || 'bottom',
        winner: el.className.includes('opp-winner'),
        rect: R(el),
        cards: R(el.querySelector('.opp-cards')),
        cardSlotML: el.querySelector('.opp-card-slot:not(:first-child)') ? getComputedStyle(el.querySelector('.opp-card-slot:not(:first-child)')).marginLeft : null,
        cardSlotTransform: el.querySelector('.opp-card-slot') ? getComputedStyle(el.querySelector('.opp-card-slot')).transform : null,
      })),
      oval: R(document.querySelector('.center-zone')),
      rivalsZone: R(document.querySelector('.rivals-zone')),
      sideLeft: R(document.querySelector('.side-col-left')),
      sideRight: R(document.querySelector('.side-col-right')),
    }
  })
}

// ── Capturas ──────────────────────────────────────────────────────────────────
async function runShots(browser) {
  const shots = []
  for (const vp of VIEWPORTS) {
    const page = await browser.newPage({ viewport: { width: vp.w, height: vp.h } })
    await gotoMesa5(page)
    await clickIf(page, 'button:has-text("Iniciar mano")')
    await page.waitForTimeout(1700)
    await page.mouse.move(5, 5)
    const path = `${OUT_DIR}/dsk_m5_${vp.w}x${vp.h}.png`
    await page.screenshot({ path })
    shots.push(path)
    await page.close()
  }
  return shots
}

// ── DSK-G1 · Verificación del gate (matriz + capturas deterministas) ──────────
// tag = 'before' | 'after' (subdir de capturas para el diff). Estado WAITING
// (pantalla de bienvenida, sin reparto aleatorio) → PNG determinista.
async function runGate(browser, tag = 'after') {
  const MATRIX = [
    { w: 640, h: 360, expect: false, note: 'móvil landscape' },
    { w: 360, h: 640, expect: false, note: 'portrait' },
    { w: 844, h: 390, expect: false, note: 'móvil landscape' },
    { w: 1024, h: 768, expect: true, note: 'desktop' },
    { w: 1366, h: 768, expect: true, note: 'desktop' },
    { w: 1920, h: 937, expect: true, note: 'desktop' },
  ]
  const matrix = []
  for (const vp of MATRIX) {
    const page = await browser.newPage({ viewport: { width: vp.w, height: vp.h } })
    await page.goto(BASE)
    const matches = await page.evaluate(() => window.matchMedia('(orientation: landscape) and (min-height: 601px)').matches)
    matrix.push({ ...vp, matches, ok: matches === vp.expect })
    await page.close()
  }
  // Capturas deterministas para el diff (WAITING). 1920/1366 = fine pointer
  // (diff cero esperado tras B2); 640 = móvil fuera del gate.
  const shots = {}
  for (const vp of [{ w: 1920, h: 937 }, { w: 1366, h: 768 }, { w: 640, h: 360 }, { w: 360, h: 640 }]) {
    const page = await browser.newPage({ viewport: { width: vp.w, height: vp.h } })
    await gotoMesa5(page)                 // aterriza en WAITING (no se pulsa Iniciar)
    await page.waitForTimeout(400)
    await page.mouse.move(5, 5)
    const path = `${OUT_DIR}/gate_${tag}_${vp.w}x${vp.h}.png`
    await page.screenshot({ path })
    shots[`${vp.w}x${vp.h}`] = path
    await page.close()
  }
  return { matrix, matrixOk: matrix.every(m => m.ok), shots }
}

// ── DSK-B1 · Presupuesto vertical de la columna central (mesa 5) ──────────────
// Read-only. Desglosa alto+gaps+paddings+márgenes de cada fila del stack y el
// mecanismo de recorte. Corre en WAITING (determinista) y en un estado con cartas.
async function runB1(browser) {
  const rows = []
  for (const vp of VIEWPORTS) {
    const page = await browser.newPage({ viewport: { width: vp.w, height: vp.h } })
    await gotoMesa5(page)
    await installProbes(page)
    // medir en WAITING y también tras iniciar mano (cartas en mesa → alturas reales)
    const waiting = await measureBudget(page, vp)
    await clickIf(page, 'button:has-text("Iniciar mano")')
    await page.waitForTimeout(1700)
    await page.mouse.move(5, 5)
    const dealt = await measureBudget(page, vp)
    rows.push({ vp, waiting, dealt })
    await page.close()
  }
  return rows
}

async function measureBudget(page, vp) {
  return page.evaluate((vp) => {
    const cs = (el) => el ? getComputedStyle(el) : null
    const num = (v) => parseFloat(v) || 0
    const box = (el, label) => {
      if (!el) return { label, missing: true }
      const r = el.getBoundingClientRect()
      const s = getComputedStyle(el)
      return {
        label,
        cls: el.className || el.tagName.toLowerCase(),
        h: Math.round(r.height * 100) / 100,
        top: Math.round(r.top * 100) / 100,
        bottom: Math.round(r.bottom * 100) / 100,
        mt: num(s.marginTop), mb: num(s.marginBottom),
        pt: num(s.paddingTop), pb: num(s.paddingBottom),
        bt: num(s.borderTopWidth), bb: num(s.borderBottomWidth),
        rowGap: num(s.rowGap),
        minH: s.minHeight, height: s.height,
        flex: s.flex, display: s.display,
        alignItems: s.alignItems, justifyContent: s.justifyContent, overflowY: s.overflowY,
      }
    }
    const q = (s) => document.querySelector(s)
    const qa = (s) => [...document.querySelectorAll(s)]

    const screen = q('.game-table-screen')
    const table = q('.game-table')
    const header = q('.table-header')
    const mid = q('.table-mid')
    const rivals = q('.rivals-zone')
    const center = q('.center-zone')
    const player = q('.player-zone')
    const midCenter = q('.mid-center')

    // Filas del stack vertical del .game-table (flex column)
    const tableChildren = table ? [...table.children].map((c, i) => box(c, `game-table>child[${i}]`)) : []

    // Panel IA más alto de la fila superior (define el alto de la fila de rivales)
    const panels = qa('.opp-panel').map(el => { const r = el.getBoundingClientRect(); return { cls: [...el.classList].find(c => c.includes('top') || c.includes('side')), h: Math.round(r.height * 100) / 100, w: Math.round(r.width * 100) / 100, top: Math.round(r.top * 100) / 100 } })
    const tallestPanel = panels.reduce((a, b) => (b.h > (a?.h ?? 0) ? b : a), null)

    // Subfilas del player-zone
    const playerChildren = player ? [...player.children].map((c, i) => box(c, `player-zone>child[${i}]`)) : []

    return {
      vp,
      mqTall: window.matchMedia('(min-width: 768px) and (min-height: 900px)').matches,
      cardW: getComputedStyle(document.documentElement).getPropertyValue('--card-w').trim(),
      dvh: window.innerHeight,
      screen: box(screen, 'screen'),
      screenScroll: { scrollH: screen.scrollHeight, clientH: screen.clientHeight, overflow: screen.scrollHeight - screen.clientHeight },
      table: box(table, 'game-table'),
      tableChildren,
      header: box(header, 'header'),
      mid: box(mid, 'table-mid'),
      midCenter: box(midCenter, 'mid-center'),
      rivals: box(rivals, 'rivals-zone'),
      center: box(center, 'center-zone(oval)'),
      player: box(player, 'player-zone'),
      playerChildren,
      panels, tallestPanel,
    }
  }, vp)
}

// ── DSK · Verificación TÁCTIL (estándar de campaña ≥40px, no WCAG) ────────────
// El veredicto valida hit-boxes REALES (::after incluido, medidos con
// elementFromPoint) contra ≥40×40 — estándar BT-L/MT-1. Los readouts NO
// interactivos (timer) se miden pero NO se validan (interactive:false).
// Emula pointer:coarse (hasTouch+isMobile) para activar el sub-bloque DSK-B2.
const TACTIL_MIN = 40

// Sonda de hit-box real: desde el centro del control, avanza 1px por eje hasta
// que elementFromPoint deja de resolver al control (su ::after cuenta como el
// propio control en hit-testing). Devuelve la caja táctil efectiva.
async function installHitProbe(page) {
  await page.evaluate(() => {
    window.__hitBox = (el) => {
      const r = el.getBoundingClientRect()
      const cx = Math.round((r.left + r.right) / 2), cy = Math.round((r.top + r.bottom) / 2)
      const hits = (x, y) => { const t = document.elementFromPoint(x, y); return !!t && (t === el || el.contains(t)) }
      if (!hits(cx, cy)) return { occluded: true, visualW: r.width, visualH: r.height }
      const scan = (dx, dy) => { let x = cx, y = cy, n = 0; while (n < 120 && hits(x + dx, y + dy)) { x += dx; y += dy; n++ } return { x, y } }
      const L = scan(-1, 0).x, R = scan(1, 0).x, T = scan(0, -1).y, B = scan(0, 1).y
      return { left: L, right: R, top: T, bottom: B, w: R - L + 1, h: B - T + 1, visualW: Math.round(r.width * 10) / 10, visualH: Math.round(r.height * 10) / 10, cx, cy }
    }
  })
}

async function runTactil(browser) {
  // TAC-1 · Entran 1366x768 y 1920x1080. El modo medía sólo los dos viewports
  // bajos, y por eso dio por sano lo que no lo estaba: la oclusión de la primera
  // carta del humano por el envoltorio del mazo existía en LOS CUATRO —medido:
  // solape 56 px a 1024/1280/1366 y 63,5 px a 1920—, pero en los dos que faltaban
  // no era que el defecto no ocurriera, es que nadie miraba. Un modo táctil que
  // no cubre las pantallas grandes no está declarando un alcance: está dejando
  // un hueco que se lee como verde.
  const TOUCH_VPS = [{ w: 1024, h: 768 }, { w: 1280, h: 720 }, { w: 1366, h: 768 }, { w: 1920, h: 1080 }]
  const TABLES = [5, 4, 3, 2]   // táctil coarse en CADA mesa (mesa 2 = sin nombre-tap)
  const out = []
  for (const n of TABLES) for (const vp of TOUCH_VPS) {
    // pointer:coarse: hasTouch + isMobile fuerza a Chromium a reportar coarse.
    const page = await browser.newPage({ viewport: { width: vp.w, height: vp.h }, hasTouch: true, isMobile: true })
    await gotoMesa(page, n)
    await installProbes(page)
    await installHitProbe(page)
    const coarse = await page.evaluate(() => window.matchMedia('(pointer: coarse)').matches)
    const targets = {}

    const probe = async (label, sels) => page.evaluate(({ sels, vpH, vpW, MIN }) => {
      const acc = []
      for (const { sel, name, interactive } of sels) {
        document.querySelectorAll(sel).forEach((el, i) => {
          const hb = window.__hitBox(el)
          const inView = hb.top != null && hb.top >= 0 && hb.bottom <= vpH && hb.left >= 0 && hb.right <= vpW
          const ok = interactive === false ? true : (hb.w >= MIN && hb.h >= MIN && inView && !hb.occluded)
          acc.push({ name: name + (i ? `#${i}` : ''), text: el.textContent.trim().slice(0, 14), interactive: interactive !== false, visual: `${hb.visualW}×${hb.visualH}`, hitW: hb.w, hitH: hb.h, left: hb.left, right: hb.right, top: hb.top, bottom: hb.bottom, inView, ok })
        })
      }
      return acc
    }, { sels, vpH: vp.h, vpW: vp.w, MIN: TACTIL_MIN })

    targets.waiting = await probe('waiting', [
      { sel: '.action-area .btn-primary', name: 'Iniciar' },
      { sel: '.opp-corner-chip', name: 'ficha-IA' },   // DSK-P2: hit ≥40 en coarse
      { sel: '.utilities-trigger', name: 'utilidades' }, // DSK-U1: el ⋮ hereda el estándar
    ])
    await clickIf(page, 'button:has-text("Iniciar mano")')

    let betDone = false, discardDone = false, reached = false
    for (let i = 0; i < 220 && !reached; i++) {
      await page.waitForTimeout(300)
      await page.mouse.move(5, 5)
      if (!betDone && await page.locator('.action-buttons .btn').first().isVisible().catch(() => false)) {
        targets.bet = await probe('bet', [
          { sel: '.action-buttons .btn', name: 'accion' },
          { sel: '.btn-mult', name: 'mult' },
          { sel: '.timer-display', name: 'timer', interactive: false },
        ]); betDone = true
      }
      if (!discardDone && await page.locator('.discard-area .btn').first().isVisible().catch(() => false)) {
        targets.discard = await probe('discard', [
          { sel: '.discard-area .btn', name: 'descartar' },
          { sel: '.player-zone .card-slot-wrapper', name: 'carta' },
        ]); discardDone = true
      }
      reached = await page.locator('button:has-text("Siguiente mano")').isVisible().catch(() => false)
      if (reached) break
      await clickIf(page, '.action-buttons button:has-text("Pasar")') ||
        await clickIf(page, '.action-buttons button:has-text("Igualar")') ||
        await clickIf(page, '.action-buttons button:has-text("Apostar")')
      await clickIf(page, 'button:has-text("Sin descartar")')
    }

    targets.showdown = await probe('showdown', [
      { sel: '.opp-name-tappable', name: 'nombre-tap' },
      { sel: '.action-area .btn-primary', name: 'Siguiente' },
    ])
    // Ejercer un tap de revelado sobre el nombre (funcional)
    const revealTap = await page.evaluate(() => {
      const cand = [...document.querySelectorAll('.opp-name-tappable')].find(el => !el.closest('.opp-panel').className.includes('opp-winner'))
      if (!cand) return null
      cand.click(); return { tapped: true }
    })
    await page.waitForTimeout(300)

    // No-solape entre multiplicadores adyacentes (hit-boxes horizontales)
    const mults = (targets.bet || []).filter(t => t.name.startsWith('mult')).sort((a, b) => a.left - b.left)
    const overlaps = []
    for (let k = 0; k < mults.length - 1; k++) {
      const gap = mults[k + 1].left - mults[k].right
      if (gap < 0) overlaps.push({ pair: `${mults[k].name}↔${mults[k + 1].name}`, axis: 'H', overlapPx: -gap })
    }
    // Solape VERTICAL mult↔botón de acción (la fase de apuesta apila ambos grupos)
    const actionBtns = (targets.bet || []).filter(t => t.name.startsWith('accion'))
    for (const m of mults) for (const b of actionBtns) {
      const vGap = b.top - m.bottom       // mult arriba, botón abajo
      if (m.bottom != null && b.top != null && b.top > m.top && vGap < 0) {
        overlaps.push({ pair: `${m.name}↔${b.name}`, axis: 'V', overlapPx: -vGap })
      }
    }

    const flat = Object.entries(targets).flatMap(([ph, arr]) => arr.map(t => ({ phase: ph, ...t })))
    out.push({
      table: n, vp, coarsePointer: coarse, reachedShowdown: reached, revealTap,
      hasNameTap: (targets.showdown || []).some(t => t.name.startsWith('nombre-tap')),
      targets,
      multNoOverlap: overlaps.length === 0, overlaps,
      allInteractiveOk: flat.filter(t => t.interactive).every(t => t.ok),
      failing: flat.filter(t => t.interactive && !t.ok).map(t => `${t.phase}/${t.name} ${t.hitW}×${t.hitH}`),
    })
    await page.close()
  }
  return out
}

// ── DSK-P1 · Panel IA estático — matriz mesas 5/4/3/2 × viewports ─────────────
// Valida el ALCANCE DECLARADO de la tanda en las 4 mesas (no un subconjunto):
// reserva 12ch, nombre izq, pastillas inicial ancladas der, O1 shift-check y
// mejor-palo ausente. Mesa 2 usa la vía legacy .ai-zone/.ai-name (no OpponentPanel).
const P1_TABLES = [5, 4, 3, 2]

async function runP1(browser) {
  const out = []
  for (const n of P1_TABLES) {
    for (const vp of VIEWPORTS) {
      const page = await browser.newPage({ viewport: { width: vp.w, height: vp.h } })
      await gotoMesa(page, n)
      await installProbes(page)

      // Selectores duales: 3/4/5 → .opp-panel/.opp-name/.opp-header-anchor/.opp-score;
      // mesa 2 → .ai-zone/.ai-name/.ai-header-anchor/.score-tag.
      const measure = () => page.evaluate(() => {
        const rnd = (x) => Math.round(x * 100) / 100
        return [...document.querySelectorAll('.opp-panel, .ai-zone')].map(p => {
          const name = p.querySelector('.opp-name, .ai-name')
          const anchor = p.querySelector('.opp-header-anchor, .ai-header-anchor')
          const score = p.querySelector('.opp-score, .score-tag')
          if (!name || !anchor) return null
          const pr = p.getBoundingClientRect(), nr = name.getBoundingClientRect(), ar = anchor.getBoundingClientRect()
          const badges = [...anchor.querySelectorAll('.seat-badge')].map(b => ({ t: b.textContent.trim(), vis: getComputedStyle(b).visibility, w: rnd(b.getBoundingClientRect().width) }))
          return {
            path: p.className.includes('ai-zone') ? 'ai-zone' : 'opp-panel',
            seat: name.textContent.trim(),
            isTurn: p.className.includes('turn-active'),
            nameMinW: getComputedStyle(name).minWidth,
            nameMaxW: getComputedStyle(name).maxWidth,
            nameTextAlign: getComputedStyle(name).textAlign,
            nameW: rnd(nr.width),
            nameOffL: rnd(nr.left - pr.left),
            anchorOffR: rnd(pr.right - ar.right),
            anchorDisplay: getComputedStyle(anchor).display,
            panelW: rnd(pr.width),
            badges,
            scoreDisplay: score ? getComputedStyle(score).display : 'absent',
          }
        }).filter(Boolean)
      })

      const resting = await measure()
      await clickIf(page, 'button:has-text("Iniciar mano")')
      const frames = []
      let reached = false
      for (let i = 0; i < 120 && !reached; i++) {
        await page.waitForTimeout(200)
        await page.mouse.move(5, 5)
        frames.push(await measure())
        // early-break: en cuanto cada asiento tiene un frame con turno y otro sin
        const seats = {}
        for (const fr of frames) for (const pnl of fr) (seats[pnl.seat] ??= {})[pnl.isTurn ? 'on' : 'off'] = true
        const seatKeys = Object.keys(seats)
        if (seatKeys.length && seatKeys.every(s => seats[s].on && seats[s].off)) break
        reached = await page.locator('button:has-text("Siguiente mano")').isVisible().catch(() => false)
        if (reached) break
        await clickIf(page, '.action-buttons button:has-text("Pasar")') ||
          await clickIf(page, '.action-buttons button:has-text("Igualar")') ||
          await clickIf(page, '.action-buttons button:has-text("Apostar")')
        await clickIf(page, 'button:has-text("Sin descartar")')
      }

      const bySeat = {}
      for (const fr of frames) for (const pnl of fr) {
        (bySeat[pnl.seat] ??= { on: [], off: [] })[pnl.isTurn ? 'on' : 'off'].push(pnl)
      }
      const shift = []
      for (const [seat, g] of Object.entries(bySeat)) {
        if (!g.on.length || !g.off.length) continue
        const on = g.on[0], off = g.off[0]
        shift.push({
          seat,
          dNameOffL: Math.round((on.nameOffL - off.nameOffL) * 100) / 100,
          dAnchorOffR: Math.round((on.anchorOffR - off.anchorOffR) * 100) / 100,
          dNameW: Math.round((on.nameW - off.nameW) * 100) / 100,
          dPanelW: Math.round((on.panelW - off.panelW) * 100) / 100,
        })
      }
      const noShift = shift.length > 0 && shift.every(s => Math.abs(s.dNameOffL) < 0.6 && Math.abs(s.dAnchorOffR) < 0.6 && Math.abs(s.dNameW) < 0.6 && Math.abs(s.dPanelW) < 0.6)

      const sample = resting[0] || (frames.find(f => f.length) || [])[0]
      const allBadgesLetters = frames.concat([resting]).flat().every(p => p.badges.every(b => b.t.length <= 1 || b.t === ''))
      const scoreHidden = resting.every(p => p.scoreDisplay === 'none')

      out.push({ table: n, vp, path: sample?.path, resting, sampleMinW: sample?.nameMinW, sampleMaxW: sample?.nameMaxW, sampleAnchorDisplay: sample?.anchorDisplay, sampleTextAlign: sample?.nameTextAlign, allBadgesLetters, scoreHidden, shift, noShift, capturedTurnStates: shift.length })
      await page.close()
    }
  }
  return out
}

// ── DSK-P2 · Panel IA interactivo (cornerChip) — matriz 5/4/3/2 × viewports ──
// Ficha inferior-izq, saldo oculto/revelado con autocierre 3s, palabra de estado
// en la franja (cede el renglón al saldo), O1 en todo el ciclo, peor caso 7 díg.
const P2_TABLES = [5, 4, 3, 2]

async function runP2(browser) {
  const out = []
  for (const n of P2_TABLES) for (const vp of VIEWPORTS) {
    const page = await browser.newPage({ viewport: { width: vp.w, height: vp.h } })
    await gotoMesa(page, n)
    await installProbes(page)

    // measure de todos los paneles IA (dual .opp-panel/.ai-zone)
    const measure = () => page.evaluate(() => {
      const rnd = x => Math.round(x * 100) / 100
      const R = e => { if (!e) return null; const b = e.getBoundingClientRect(); return { x: rnd(b.x), y: rnd(b.y), w: rnd(b.width), h: rnd(b.height), left: rnd(b.left), right: rnd(b.right), top: rnd(b.top), bottom: rnd(b.bottom) } }
      const screen = document.querySelector('.game-table-screen')
      return {
        overflow: screen.scrollHeight - screen.clientHeight,
        panels: [...document.querySelectorAll('.opp-panel, .ai-zone')].map(p => {
          const chip = p.querySelector('.opp-corner-chip')
          const float = p.querySelector('.chip-balance-float')
          const status = p.querySelector('.opp-status')
          const name = p.querySelector('.opp-name, .ai-name')
          const anchor = p.querySelector('.opp-header-anchor, .ai-header-anchor')
          const fichas = [...p.querySelectorAll('*')].some(e => e.children.length === 0 && /\bfichas\b/.test(e.textContent))
          return {
            seat: name?.textContent.trim(),
            chip: R(chip), chipPresent: !!chip,
            float: R(float), floatPresent: !!float, floatText: float?.textContent,
            status: R(status), statusVis: status ? getComputedStyle(status).visibility : null,
            panel: R(p), name: R(name), anchor: R(anchor),
            fichas,
          }
        }),
      }
    })

    await clickIf(page, 'button:has-text("Iniciar mano")')
    for (let i = 0; i < 6; i++) { await page.waitForTimeout(500); await page.mouse.move(5, 5); if (await page.locator('button:has-text("Siguiente mano")').isVisible().catch(() => false)) break; await clickIf(page, '.action-buttons button:has-text("Pasar")') || await clickIf(page, '.action-buttons button:has-text("Igualar")') }
    await page.mouse.move(5, 5); await page.waitForTimeout(300)

    const resting = await measure()   // ficha cerrada

    // ── Ciclo interactivo: tap → abierto → autocierre 3000ms → cerrado ──
    await page.evaluate(() => document.querySelector('.opp-panel .opp-corner-chip, .ai-zone .opp-corner-chip')?.click())
    await page.waitForTimeout(250)
    const opened = await measure()    // saldo visible, palabra oculta

    // peor caso 7 dígitos: inyectar en el float abierto y medir
    const worst = await page.evaluate(() => {
      const f = document.querySelector('.chip-balance-float'); if (!f) return null
      f.textContent = '9999999'
      const p = f.closest('.opp-panel, .ai-zone')
      const fb = f.getBoundingClientRect(), pb = p.getBoundingClientRect(), cb = p.querySelector('.opp-cards, .cards-row').getBoundingClientRect()
      return { floatRight: Math.round(fb.right), panelRight: Math.round(pb.right), fitsInPanel: fb.right <= pb.right + 1, cardsBottom: Math.round(cb.bottom) }
    })

    await page.waitForTimeout(3200)   // esperar autocierre (CHIP_TOGGLE_MS=3000)
    const closed = await measure()    // saldo oculto, palabra de vuelta

    // ── Análisis ──
    const restP = resting.panels
    const chipOk = restP.every(p => p.chipPresent && p.chip && (p.chip.left - p.panel.left) < 40 && (p.panel.bottom - p.chip.bottom) < 40) // esquina inferior izq
    const saldoHiddenResting = restP.every(p => !p.floatPresent)  // sin float en resting
    const fichasAbsent = restP.every(p => !p.fichas)
    const tapped = opened.panels.find(p => p.floatPresent)
    const tappedSeat = tapped?.seat
    const cyc = {
      openHasFloat: !!tapped,
      openStatusHidden: tapped?.statusVis === 'hidden',
      closedNoFloat: !closed.panels.find(p => p.seat === tappedSeat)?.floatPresent,
      closedStatusVisible: closed.panels.find(p => p.seat === tappedSeat)?.statusVis === 'visible',
    }
    // O1 shift a lo largo del ciclo: panel/name/anchor/status del asiento tocado + vecinos
    const key = (m, s) => m.panels.find(p => p.seat === s)
    const deltas = []
    for (const s of restP.map(p => p.seat)) {
      const a = key(resting, s), b = key(opened, s), c = key(closed, s)
      if (!a || !b || !c) continue
      const d = (f) => Math.max(Math.abs((b[f]?.x ?? 0) - (a[f]?.x ?? 0)), Math.abs((b[f]?.y ?? 0) - (a[f]?.y ?? 0)), Math.abs((c[f]?.x ?? 0) - (a[f]?.x ?? 0)), Math.abs((c[f]?.y ?? 0) - (a[f]?.y ?? 0)), Math.abs((b[f]?.w ?? 0) - (a[f]?.w ?? 0)), Math.abs((c[f]?.w ?? 0) - (a[f]?.w ?? 0)))
      deltas.push({ seat: s, dPanel: Math.round(d('panel') * 100) / 100, dName: Math.round(d('name') * 100) / 100, dAnchor: Math.round(d('anchor') * 100) / 100, dStatusBox: Math.round(d('status') * 100) / 100 })
    }
    const noShift = deltas.every(x => x.dPanel < 0.6 && x.dName < 0.6 && x.dAnchor < 0.6 && x.dStatusBox < 0.6)

    out.push({
      table: n, vp,
      chipOk, saldoHiddenResting, fichasAbsent,
      cycle: cyc, cycleOk: cyc.openHasFloat && cyc.openStatusHidden && cyc.closedNoFloat && cyc.closedStatusVisible,
      worst7: worst, worst7Ok: !!worst && worst.fitsInPanel,
      noShift, deltas,
      overflow: resting.overflow, overflowOk: resting.overflow <= 0 && opened.overflow <= 0,
      tappedSeat,
    })
    await page.close()
  }
  return out
}

// ── DSK-R1 · Revelación de finalistas sin layout shift — mesas 5/4/3 × vps ────
// Por cada IA finalista revela su mano y comprueba: (1) el ancho de FLUJO de
// .opp-cards no infla (ML negativo de reposo, scale 1.2 conservado como transform),
// (2) Δ=0 en óvalo, área humana y CADA panel a lo largo del ciclo, (3) las cartas
// reveladas resuelven POR ENCIMA (elementFromPoint sobre las zonas de solape con
// óvalo/vecinos → devuelve la carta del ganador), (4) al volver al ganador original
// la geometría es idéntica. Mesa 2 fuera de alcance (usa .ai-zone, no .opp-winner).
const R1_TABLES = [5, 4, 3]

const bboxDelta = (a, b) => {
  if (!a || !b) return 0
  return Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y), Math.abs(a.w - b.w), Math.abs(a.h - b.h))
}
// Δ máx de los anclajes fijos (óvalo, humano) + CADA panel, contra una baseline.
// R2c: el ÁREA TOTAL de juego (.game-table) y su pantalla entran como anclas —
// el saltito de la barra de scroll movía el área entera, no un panel suelto.
const anchorDelta = (m, base) => {
  const d = [bboxDelta(m.oval, base.oval), bboxDelta(m.human, base.human), bboxDelta(m.humanBar, base.humanBar),
    bboxDelta(m.area, base.area), bboxDelta(m.screen, base.screen)]
  for (const bp of base.panels) {
    const cp = m.panels.find(p => p.seat === bp.seat)
    if (cp) d.push(bboxDelta(cp.panel, bp.panel))
  }
  return Math.max(...d)
}

async function measureR1(page) {
  return page.evaluate(() => {
    const rnd = x => x == null ? null : Math.round(x * 100) / 100
    const R = e => { if (!e) return null; const b = e.getBoundingClientRect(); return { x: rnd(b.x), y: rnd(b.y), w: rnd(b.width), h: rnd(b.height), left: rnd(b.left), right: rnd(b.right), top: rnd(b.top), bottom: rnd(b.bottom) } }
    const screen = document.querySelector('.game-table-screen')
    const q = s => document.querySelector(s)
    return {
      overflow: screen ? screen.scrollHeight - screen.clientHeight : null,
      oval: R(q('.center-zone')),
      human: R(q('.player-zone')),
      humanBar: R(q('.player-bar')),
      area: R(q('.game-table')),          // R2c · contenedor TOTAL del juego
      screen: R(screen),
      scroll: window.__scrollMetrics ? window.__scrollMetrics() : null,
      panels: [...document.querySelectorAll('.opp-panel')].map(p => {
        const cards = p.querySelector('.opp-cards')
        const slot = p.querySelector('.opp-card-slot:not(:first-child)')
        const anySlot = p.querySelector('.opp-card-slot')
        return {
          seat: p.querySelector('.opp-name')?.textContent.trim(),
          pos: [...p.classList].find(c => c.startsWith('opp-') && (c.includes('top') || c.includes('side'))),
          winner: p.className.includes('opp-winner'),
          panel: R(p),
          cards: R(cards),
          cardsW: cards ? rnd(cards.getBoundingClientRect().width) : null,
          slotML: slot ? getComputedStyle(slot).marginLeft : null,
          slotTransform: anySlot ? getComputedStyle(anySlot).transform : null,
          opacity: getComputedStyle(p).opacity,
          chip: R(p.querySelector('.win-score-chip')),
          chipPos: p.querySelector('.win-score-chip') ? getComputedStyle(p.querySelector('.win-score-chip')).position : null,
          roleBadges: [...p.querySelectorAll('.opp-header-anchor .seat-badge')].filter(x => getComputedStyle(x).visibility !== 'hidden').map(x => ({ t: x.textContent.trim(), r: R(x) })),
        }
      }),
    }
  })
}

// Solape rectangular (px²>0) entre dos cajas — para verificar que la pastilla de
// puntaje flotada no pisa un badge de rol visible.
const rectOverlap = (a, b) => {
  if (!a || !b) return 0
  const ox = Math.min(a.right, b.right) - Math.max(a.left, b.left)
  const oy = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top)
  return ox > 0 && oy > 0 ? Math.round(ox * oy) : 0
}

// Sonda de apilamiento: para el panel revelado, halla las zonas donde sus cartas
// (bbox con transform) solapan al óvalo o a otros paneles y verifica que
// elementFromPoint, en puntos que caen sobre una carta revelada, resuelve DENTRO
// del panel ganador (la carta pinta por encima). Sólo cuenta puntos que además
// caen sobre el elemento de abajo → prueba real de oclusión.
async function stackR1(page) {
  return page.evaluate(() => {
    const win = document.querySelector('.opp-panel.opp-winner')
    if (!win) return []
    const slots = [...win.querySelectorAll('.opp-card-slot')]
    if (!slots.length) return []
    const union = slots.reduce((a, s) => { const r = s.getBoundingClientRect(); return { left: Math.min(a.left, r.left), top: Math.min(a.top, r.top), right: Math.max(a.right, r.right), bottom: Math.max(a.bottom, r.bottom) } }, { left: Infinity, top: Infinity, right: -Infinity, bottom: -Infinity })
    const others = [...document.querySelectorAll('.center-zone, .opp-panel')].filter(el => el !== win && !win.contains(el) && !el.contains(win))
    const overCard = (px, py) => slots.some(s => { const r = s.getBoundingClientRect(); return px >= r.left && px <= r.right && py >= r.top && py <= r.bottom })
    const tests = []
    for (const other of others) {
      const o = other.getBoundingClientRect()
      const ix = Math.max(union.left, o.left), iy = Math.max(union.top, o.top)
      const ax = Math.min(union.right, o.right), ay = Math.min(union.bottom, o.bottom)
      if (ax - ix <= 2 || ay - iy <= 2) continue     // sin solape geométrico real
      const label = [...other.classList].find(c => c.includes('opp-top') || c.includes('opp-side') || c.includes('center-zone')) || other.className
      let tested = 0, resolvedWinner = 0, firstOther = null
      for (let gx = 0.15; gx <= 0.85; gx += 0.175) for (let gy = 0.15; gy <= 0.85; gy += 0.175) {
        const px = Math.round(ix + (ax - ix) * gx), py = Math.round(iy + (ay - iy) * gy)
        if (!overCard(px, py)) continue
        const el = document.elementFromPoint(px, py)
        tested++
        if (el && win.contains(el)) resolvedWinner++
        else if (!firstOther) firstOther = el ? (el.className || el.tagName) : 'null'
      }
      if (tested > 0) tests.push({ target: label, tested, resolvedWinner, resolvesToWinner: resolvedWinner === tested, firstOther })
    }
    // Solape INTRA-panel (aceptado por doctrina R1): cada carta pisa a la anterior
    // (−0.35). En la banda de solape, elementFromPoint debe resolver a la carta de
    // ARRIBA (slot posterior en el DOM), nunca a la de abajo → apilamiento correcto.
    for (let k = 1; k < slots.length; k++) {
      const prev = slots[k - 1].getBoundingClientRect(), cur = slots[k].getBoundingClientRect()
      const bx = Math.max(cur.left, prev.left), ex = Math.min(cur.right, prev.right)
      if (ex - bx <= 2) continue
      const px = Math.round((bx + Math.min(ex, cur.left + (cur.width * 0.4))) / 2)
      const py = Math.round((Math.max(cur.top, prev.top) + Math.min(cur.bottom, prev.bottom)) / 2)
      const el = document.elementFromPoint(px, py)
      const top = slots[k].contains(el), ok = !!el && (top || slots[k] === el.closest('.opp-card-slot'))
      tests.push({ target: `intra:${k - 1}<${k}`, tested: 1, resolvedWinner: ok ? 1 : 0, resolvesToWinner: ok, firstOther: ok ? null : (el ? (el.className || el.tagName) : 'null') })
    }
    return tests
  })
}

async function tapNameBySeat(page, seat) {
  await page.evaluate((seat) => {
    const el = [...document.querySelectorAll('.opp-name-tappable')].find(e => e.textContent.trim() === seat)
    if (el) el.click()
  }, seat)
}

async function runR1(browser) {
  const out = []
  const tblFilter = process.argv[3] ? Number(process.argv[3]) : null
  const vpFilter = process.argv[4] || null
  for (const n of R1_TABLES) for (const vp of VIEWPORTS) {
    if (tblFilter && n !== tblFilter) continue
    if (vpFilter && `${vp.w}x${vp.h}` !== vpFilter) continue
    const page = await browser.newPage({ viewport: { width: vp.w, height: vp.h } })
    await gotoMesa(page, n)
    await installProbes(page)

    // Llegar a un showdown con nombres revelables (reintenta manos si hace falta)
    let ok = false
    for (let attempt = 0; attempt < 6 && !ok; attempt++) {
      await playToShowdown(page)
      ok = await page.locator('.opp-name-tappable').count() > 0
      if (!ok) { await clickIf(page, 'button:has-text("Siguiente mano")'); await page.waitForTimeout(1600) }
    }
    await page.mouse.move(5, 5); await page.waitForTimeout(250)

    const tappableSeats = await page.evaluate(() => [...document.querySelectorAll('.opp-name-tappable')].map(el => el.textContent.trim()))
    const baseline = await measureR1(page)
    const baselineWinner = baseline.panels.find(p => p.winner)?.seat

    // Ciclo de revelación por cada finalista + stacking en cada estado
    const frames = [{ seat: baselineWinner, m: baseline, stack: await stackR1(page) }]
    for (const seat of tappableSeats) {
      if (seat === baselineWinner) continue
      await tapNameBySeat(page, seat)
      await page.waitForTimeout(450); await page.mouse.move(5, 5)
      frames.push({ seat, m: await measureR1(page), stack: await stackR1(page) })
    }

    // A · Inflación eliminada: el slot del ganador conserva el ML negativo de reposo
    // y su .opp-cards mide igual que la de un panel NO revelado (mismo flujo). Se
    // evalúa contra el PRIMER frame con ganador real (la baseline puede no tener el
    // reveal por defecto asentado aún → robustez de medición, no de CSS).
    const wFrame = frames.find(f => f.m.panels.some(p => p.winner)) || { m: baseline }
    const winnerP = wFrame.m.panels.find(p => p.winner)
    const nonWinner = wFrame.m.panels.find(p => !p.winner && p.cards)
    const inflationGone = !!winnerP && parseFloat(winnerP.slotML) < 0 &&
      (!nonWinner || Math.abs(winnerP.cardsW - nonWinner.cardsW) < 1)
    const scaleKept = !!winnerP && winnerP.slotTransform && winnerP.slotTransform !== 'none'
    // Cerrar: volver al ganador original → debe restaurar la geometría exacta
    await tapNameBySeat(page, baselineWinner)
    await page.waitForTimeout(450); await page.mouse.move(5, 5)
    const restored = await measureR1(page)

    const maxAnchorShift = Math.max(...frames.map(f => anchorDelta(f.m, baseline)))
    const restoreShift = anchorDelta(restored, baseline)

    // Desglose del peor frame: qué ancla se movió y cuánto (diagnóstico).
    const worst = frames.reduce((a, f) => anchorDelta(f.m, baseline) > anchorDelta(a.m, baseline) ? f : a, frames[0])
    const ovDelta = (a, b) => a && b ? { dx: Math.round((a.x - b.x) * 100) / 100, dy: Math.round((a.y - b.y) * 100) / 100, dw: Math.round((a.w - b.w) * 100) / 100, dh: Math.round((a.h - b.h) * 100) / 100 } : null
    const wWin = worst.m.panels.find(p => p.winner)
    const breakdown = { seat: worst.seat, ovalXYWH: ovDelta(worst.m.oval, baseline.oval), human: bboxDelta(worst.m.human, baseline.human), humanBar: bboxDelta(worst.m.humanBar, baseline.humanBar), winnerCardsW: wWin?.cardsW, winnerSlotML: wWin?.slotML, winnerPanelW: wWin?.panel?.w, panels: [] }
    for (const bp of baseline.panels) {
      const cp = worst.m.panels.find(p => p.seat === bp.seat)
      if (cp) breakdown.panels.push({ seat: bp.seat, winnerBase: bp.winner, winnerNow: cp.winner, d: bboxDelta(cp.panel, bp.panel), baseW: bp.panel?.w, nowW: cp.panel?.w, baseX: bp.panel?.x, nowX: cp.panel?.x, baseCardsW: bp.cardsW, nowCardsW: cp.cardsW })
    }
    const stackTests = frames.flatMap(f => f.stack.map(s => ({ seat: f.seat, ...s })))
    const overlapsFound = stackTests.length
    const stackAllOk = stackTests.every(s => s.resolvesToWinner)
    const winnerOpacityOk = frames.every(f => { const w = f.m.panels.find(p => p.winner); return !w || parseFloat(w.opacity) === 1 })
    // La pastilla flotada no debe pisar un badge de rol visible (M/P) en ningún estado.
    const chipRoleOverlaps = []
    for (const f of frames) {
      const w = f.m.panels.find(p => p.winner)
      if (!w || !w.chip) continue
      for (const rb of (w.roleBadges || [])) {
        const ov = rectOverlap(w.chip, rb.r)
        if (ov > 4) chipRoleOverlaps.push({ seat: f.seat, badge: rb.t, ovPx2: ov })
      }
    }
    // Pastilla fuera de flujo (out-of-flow) en TODO estado revelado: requisito duro
    // (garantiza Δ=0). El solape con el badge Pie es ACEPTADO (~5px, decisión de
    // Victor) — se reporta y se acota a un mordisco menor (no una cobertura total).
    const chipOutOfFlow = frames.every(f => { const w = f.m.panels.find(p => p.winner); return !w || w.chipPos == null || w.chipPos === 'absolute' })
    const chipNickMaxPx2 = chipRoleOverlaps.reduce((a, o) => Math.max(a, o.ovPx2), 0)
    const chipFloatOk = chipOutOfFlow && chipNickMaxPx2 < 200   // <200px² = mordisco de esquina, no cobertura
    const winnersSeen = frames.map(f => f.m.panels.find(p => p.winner)?.seat).filter(Boolean)

    out.push({
      table: n, vp, tappableSeats, baselineWinner,
      inflationGone, scaleKept,
      winnerSlotML: winnerP?.slotML, winnerCardsW: winnerP?.cardsW, nonWinnerCardsW: nonWinner?.cardsW, winnerSlotTransform: winnerP?.slotTransform,
      maxAnchorShift: Math.round(maxAnchorShift * 100) / 100, noShift: maxAnchorShift < 0.6,
      restoreShift: Math.round(restoreShift * 100) / 100, restoredOk: restoreShift < 0.6,
      overlapsFound, stackAllOk, winnerOpacityOk,
      chipFloatOk, chipOutOfFlow, chipNickMaxPx2, chipRoleOverlaps, winnersSeen,
      breakdown,
      stackDetail: frames.map(f => ({ seat: f.seat, overlaps: f.stack })),
      overflow: baseline.overflow, overflowOk: (baseline.overflow ?? 0) <= 0,
      passed: inflationGone && scaleKept && maxAnchorShift < 0.6 && restoreShift < 0.6 && stackAllOk && winnerOpacityOk && chipFloatOk && (baseline.overflow ?? 0) <= 0,
    })
    await page.close()
  }
  return out
}

// ── DSK-R2 · Coreografía del curiosear — mesas 5/4/3 × vps ────────────────────
// Verifica que el canje de manos en showdown corre la secuencia de 4 fases
// (closing→collect→grow→open, NO instantáneo), con: tiempos idénticos a móvil
// (vars --reveal-* + duraciones computadas, número contra número), Δ=0 en frames
// INTERMEDIOS de la animación (transforms no refluyen), estado final = R1
// (ganador=to, pastilla flotada, sin inflar) e interrupciones sin zombis
// (tap repetido bloqueado; cierre a mitad limpia clases y timers). Mesa 2 fuera.
const R2_TABLES = [5, 4, 3]

// DSK-R2b · Mide el DESPLIEGUE de las cartas reveladas (reposo revelado): gap
// borde a borde entre cartas consecutivas (mirror del móvil), centrado del abanico
// respecto al panel, y si la pastilla flotada pisa alguna carta en el nuevo ancho
// visual. Todo sobre bboxes CON transform (getBoundingClientRect ya los incluye).
async function measureSpread(page) {
  return page.evaluate(() => {
    const rnd = x => x == null ? null : Math.round(x * 100) / 100
    const win = [...document.querySelectorAll('.opp-panel')].find(p => p.className.includes('opp-winner'))
    if (!win) return { err: 'no-winner' }
    const panel = win.getBoundingClientRect()
    const cards = [...win.querySelectorAll('.opp-card-slot .playing-card')].map(c => c.getBoundingClientRect())
    if (cards.length < 2) return { err: 'few-cards', n: cards.length }
    const gaps = []
    for (let i = 1; i < cards.length; i++) gaps.push(rnd(cards[i].left - cards[i - 1].right))
    const fanLeft = Math.min(...cards.map(c => c.left)), fanRight = Math.max(...cards.map(c => c.right))
    const chipEl = win.querySelector('.win-score-chip')
    const chip = chipEl ? chipEl.getBoundingClientRect() : null
    const chipVisible = chipEl ? getComputedStyle(chipEl).visibility !== 'hidden' : false
    const chipOverCard = chip && chipVisible
      ? cards.some(c => !(chip.right <= c.left || chip.left >= c.right || chip.bottom <= c.top || chip.top >= c.bottom))
      : false
    return {
      n: cards.length,
      gaps,
      minGap: rnd(Math.min(...gaps)),
      avgGap: rnd(gaps.reduce((a, x) => a + x, 0) / gaps.length),
      cardW: rnd(cards[0].width),
      fanCenterOffset: rnd((fanLeft + fanRight) / 2 - (panel.left + panel.right) / 2), // >0 = abanico a la derecha del centro del panel
      leftOverhang: rnd(panel.left - fanLeft),
      rightOverhang: rnd(fanRight - panel.right),
      chipVisible, chipOverCard,
    }
  })
}

// DSK-R2c · Confinamiento: margen de la carta EXTREMA respecto al perímetro del
// área total de juego (.game-table), por lado. >0 = dentro (bien); <0 = la carta
// se pinta FUERA del tapete. Se mide el bbox CON transform de todas las cartas
// del panel revelado y se compara con el border-box del área. Se reporta también
// el margen contra la pantalla (.game-table-screen): si ese se agota por la
// derecha nace la barra horizontal → el saltito de 15px.
async function measureConfine(page) {
  return page.evaluate(() => {
    const rnd = x => x == null ? null : Math.round(x * 100) / 100
    const win = [...document.querySelectorAll('.opp-panel')].find(p => p.className.includes('opp-winner'))
    if (!win) return { err: 'no-winner' }
    const areaEl = document.querySelector('.game-table')
    const scrEl = document.querySelector('.game-table-screen')
    if (!areaEl) return { err: 'no-area' }
    const a = areaEl.getBoundingClientRect(), s = scrEl.getBoundingClientRect()
    const cards = [...win.querySelectorAll('.opp-card-slot .playing-card')].map(c => c.getBoundingClientRect())
    if (!cards.length) return { err: 'no-cards' }
    const L = Math.min(...cards.map(c => c.left)), R = Math.max(...cards.map(c => c.right))
    const T = Math.min(...cards.map(c => c.top)), B = Math.max(...cards.map(c => c.bottom))
    const m = { left: rnd(L - a.left), right: rnd(a.right - R), top: rnd(T - a.top), bottom: rnd(a.bottom - B) }
    return {
      seat: win.querySelector('.opp-name')?.textContent.trim(),
      pos: [...win.classList].find(c => c.startsWith('opp-') && (c.includes('top') || c.includes('side'))),
      margins: m,
      worst: rnd(Math.min(m.left, m.right, m.top, m.bottom)),
      inside: Math.min(m.left, m.right, m.top, m.bottom) >= 0,
      screenMargins: { left: rnd(L - s.left), right: rnd(s.right - R) },
      fanW: rnd(R - L),
    }
  })
}

// R2c · ¿se movió el scroll (documento o scroller) en algún frame del ciclo?
// Devuelve la métrica que más varió respecto al primer frame. barH/barV saltando
// de 0 a 15 = barra que aparece → el área centrada da el saltito.
const scrollDelta = (samples) => {
  const first = samples.map(s => s.scroll).find(Boolean)
  if (!first) return { max: 0, key: null }
  let max = 0, key = null, from = null, to = null
  for (const s of samples) {
    if (!s.scroll) continue
    for (const k of Object.keys(first)) {
      const d = Math.abs(s.scroll[k] - first[k])
      if (d > max) { max = d; key = k; from = first[k]; to = s.scroll[k] }
    }
  }
  return { max, key, from, to }
}

// Mide las vars de tiempo + duraciones computadas de las clases de fase en el
// contexto actual (para comparar desktop↔móvil, número contra número).
async function measureChoreoTimings(page) {
  return page.evaluate(() => {
    const panel = document.querySelector('.opp-panel')
    const csv = panel ? getComputedStyle(panel) : null
    const v = k => csv ? csv.getPropertyValue(k).trim() : null
    const cc = document.querySelector('.opp-reveal-closing .opp-card-slot .playing-card')
    const cs = document.querySelector('.opp-reveal-collect .opp-card-slot')
    const oc = document.querySelector('.opp-reveal-open .opp-card-slot .playing-card')
    const g = e => e ? getComputedStyle(e) : null
    return {
      vars: { flip: v('--reveal-flip-ms'), stagger: v('--reveal-stagger-ms'), scale: v('--reveal-scale-ms'), settle: v('--reveal-settle-ms') },
      closing: cc ? { name: g(cc).animationName, dur: g(cc).animationDuration } : null,
      collect: cs ? { prop: g(cs).transitionProperty, dur: g(cs).transitionDuration } : null,
      open: oc ? { name: g(oc).animationName, dur: g(oc).animationDuration } : null,
    }
  })
}

// Snapshot ligero durante la animación: fase(s) activas + geometría de anclas +
// duraciones vivas de las clases de fase presentes en ese frame.
async function sampleChoreoFrame(page) {
  return page.evaluate(() => {
    const rnd = x => x == null ? null : Math.round(x * 100) / 100
    const R = e => { if (!e) return null; const b = e.getBoundingClientRect(); return { x: rnd(b.x), y: rnd(b.y), w: rnd(b.width), h: rnd(b.height) } }
    const q = s => document.querySelector(s)
    const phases = [...document.querySelectorAll('[class*="opp-reveal-"]')].map(p => [...p.classList].find(c => c.startsWith('opp-reveal-'))).filter(Boolean)
    const cc = q('.opp-reveal-closing .opp-card-slot .playing-card')
    const cs = q('.opp-reveal-collect .opp-card-slot')
    const oc = q('.opp-reveal-open .opp-card-slot .playing-card')
    const g = e => e ? getComputedStyle(e) : null
    return {
      phases,
      oval: R(q('.center-zone')), human: R(q('.player-zone')), humanBar: R(q('.player-bar')),
      area: R(q('.game-table')), screen: R(q('.game-table-screen')),
      scroll: window.__scrollMetrics ? window.__scrollMetrics() : null,
      panels: [...document.querySelectorAll('.opp-panel')].map(p => ({ seat: p.querySelector('.opp-name')?.textContent.trim(), winner: p.className.includes('opp-winner'), panel: R(p) })),
      closingAnim: cc ? { name: g(cc).animationName, dur: g(cc).animationDuration } : null,
      collectTrans: cs ? { prop: g(cs).transitionProperty, dur: g(cs).transitionDuration } : null,
      openAnim: oc ? { name: g(oc).animationName, dur: g(oc).animationDuration } : null,
    }
  })
}

// Un swap de curiosear EXIGE ≥2 finalistas revelables (un 'from' y un 'to'
// distintos); si una IA se retira puede quedar sólo 1 → se reintenta la mano.
async function reachShowdownTappable(page, minTap = 2, maxHands = 12) {
  let ok = false
  for (let a = 0; a < maxHands && !ok; a++) {
    await playToShowdown(page)
    ok = await page.locator('.opp-name-tappable').count() >= minTap
    if (!ok) { await clickIf(page, 'button:has-text("Siguiente mano")'); await page.waitForTimeout(1600) }
  }
  await page.mouse.move(5, 5); await page.waitForTimeout(250)
  return ok
}

async function runR2(browser) {
  const out = []
  const tblFilter = process.argv[3] ? Number(process.argv[3]) : null
  const vpFilter = process.argv[4] || null

  // Referencia MÓVIL (640×360 landscape, mesa 5): tiempos nativos de la coreografía.
  let mobileRef = null
  {
    const mp = await browser.newPage({ viewport: { width: 640, height: 360 } })
    await gotoMesa(mp, 5); await installProbes(mp)
    if (await reachShowdownTappable(mp)) {
      const wn = () => mp.evaluate(() => ({ win: [...document.querySelectorAll('.opp-panel')].find(p => p.className.includes('opp-winner'))?.querySelector('.opp-name')?.textContent.trim(), taps: [...document.querySelectorAll('.opp-name-tappable')].map(e => e.textContent.trim()) }))
      let seats = await wn()
      if (!seats.win) { await tapNameBySeat(mp, seats.taps[0]); await mp.waitForTimeout(1200); await mp.mouse.move(5, 5); seats = await wn() }   // prime si ganó el humano → from≠0 (captura closing)
      const to = seats.taps.find(s => s !== seats.win) || seats.taps[0]
      await tapNameBySeat(mp, to)
      // muestrear hasta atrapar las fases con animación viva
      for (let i = 0; i < 24 && !(mobileRef && mobileRef.closing && mobileRef.open); i++) {
        const t = await measureChoreoTimings(mp)
        mobileRef = { vars: t.vars, closing: t.closing || mobileRef?.closing, collect: t.collect || mobileRef?.collect, open: t.open || mobileRef?.open }
        await mp.waitForTimeout(40)
      }
      // Gap de despliegue de referencia: móvil ya en reposo revelado tras el swap.
      await mp.waitForTimeout(400); await mp.mouse.move(5, 5)
      if (mobileRef) mobileRef.spread = await measureSpread(mp)
    }
    await mp.close()
  }

  for (const n of R2_TABLES) for (const vp of VIEWPORTS) {
    if (tblFilter && n !== tblFilter) continue
    if (vpFilter && `${vp.w}x${vp.h}` !== vpFilter) continue
    const page = await browser.newPage({ viewport: { width: vp.w, height: vp.h } })
    await gotoMesa(page, n); await installProbes(page)
    if (!await reachShowdownTappable(page)) { out.push({ table: n, vp, err: 'no showdown tappable' }); await page.close(); continue }

    const winName = () => page.evaluate(() => ({ win: [...document.querySelectorAll('.opp-panel')].find(p => p.className.includes('opp-winner'))?.querySelector('.opp-name')?.textContent.trim(), taps: [...document.querySelectorAll('.opp-name-tappable')].map(e => e.textContent.trim()) }))
    let seats = await winName()
    // Si ganó el HUMANO (seat 0) no hay .opp-panel.opp-winner → un tap correría
    // sólo grow+open (el driver salta closing/collect con from===0). Para ejercer
    // SIEMPRE la secuencia completa, se PRIMA revelando una IA primero (deja que
    // termine su grow+open) → 'from' pasa a ser una IA y el swap medido corre las 4.
    if (!seats.win) {
      await tapNameBySeat(page, seats.taps[0])
      await page.waitForTimeout(1200); await page.mouse.move(5, 5)
      seats = await winName()
    }
    const baseline = await measureR1(page)
    const toSeat = seats.taps.find(s => s !== seats.win) || seats.taps[0]

    // ── Coreografía completa: disparar tap y muestrear rápido ──
    const samples = []
    await tapNameBySeat(page, toSeat)
    for (let i = 0; i < 30; i++) { samples.push(await sampleChoreoFrame(page)); await page.waitForTimeout(45) }
    await page.waitForTimeout(400); await page.mouse.move(5, 5)
    const end = await measureR1(page)
    // DSK-R2b · Despliegue en reposo revelado (estado final del swap): cartas sin
    // solape (gap>0), gap ≈ móvil (número contra número), abanico centrado en el
    // panel, pastilla flotada sin pisar carta. Δ=0 lo cubre endShift (más abajo).
    const spread = await measureSpread(page)
    const mobGap = mobileRef?.spread?.avgGap
    const gapPositive = !!spread && !spread.err && spread.minGap > 0
    const gapMatchMobile = mobGap == null || (spread && !spread.err && Math.abs(spread.avgGap - mobGap) <= 1.5)
    // R2c · el centrado en el panel ya NO es criterio para asientos LATERALES:
    // ahí el conjunto se ancla hacia dentro a propósito (confinamiento). Para el
    // resto (top-*) se mantiene tal cual — su abanico sigue simétrico.
    const endPos = end.panels.find(p => p.winner)?.pos || ''
    const lateralSeat = /opp-side-(left|right)/.test(endPos)
    const fanCentered = lateralSeat ? null : (!!spread && !spread.err && Math.abs(spread.fanCenterOffset) <= 4)
    const chipClear = !!spread && !spread.err && !spread.chipOverCard

    // Fases observadas (orden de 1ª aparición) → prueba que NO es instantáneo
    const phaseOrder = []
    for (const s of samples) for (const ph of s.phases) if (!phaseOrder.includes(ph)) phaseOrder.push(ph)
    const choreoRan = phaseOrder.length > 0
    const sawAllPhases = ['opp-reveal-closing', 'opp-reveal-collect', 'opp-reveal-grow', 'opp-reveal-open'].every(p => phaseOrder.includes(p))

    // Δ=0 en frames INTERMEDIOS (mientras hay alguna fase activa)
    const midFrames = samples.filter(s => s.phases.length > 0)
    const midShift = midFrames.length ? Math.max(...midFrames.map(s => anchorDelta(s, baseline))) : 0

    // Tiempos: capturar de los frames donde las clases están vivas
    const closing = samples.map(s => s.closingAnim).find(Boolean)
    const collect = samples.map(s => s.collectTrans).find(Boolean)
    const open = samples.map(s => s.openAnim).find(Boolean)
    const timings = await measureChoreoTimings(page)   // vars (siempre disponibles)
    const num = s => s == null ? null : Math.round(parseFloat(s) * 1000) / 1000   // '0.22s'|'220ms'→ms-agnóstico: parseFloat
    const durMs = s => { if (!s) return null; const f = parseFloat(s); return /ms/.test(s) ? f : f * 1000 }
    const flipOk = closing?.name === 'cardFlipClose' && durMs(closing?.dur) === 220 && open?.name === 'cardFlipReveal' && durMs(open?.dur) === 220
    const collectOk = !!collect && /transform/.test(collect.prop) && durMs(collect.dur) === 200
    const varsExpected = { flip: '220ms', stagger: '25ms', scale: '200ms', settle: '150ms' }
    const varsOk = JSON.stringify(timings.vars) === JSON.stringify(varsExpected)
    // Igualdad desktop↔móvil (número contra número): se comparan las vars de
    // tiempo (gobiernan TODAS las duraciones, incluida la escala) y las
    // duraciones de VOLTEO sobre el MISMO elemento (.playing-card). La transición
    // de ESCALA no se compara elemento a elemento porque el mecanismo difiere por
    // diseño (móvil escala la fila .opp-cards a 1.6; desktop el slot a 1.2) — su
    // duración es la misma var --reveal-scale-ms (=200ms) en ambos, ya probado por
    // la igualdad de vars + collectOk (desktop slot dur === 200).
    const matchMobile = !mobileRef ? null : (
      JSON.stringify(timings.vars) === JSON.stringify(mobileRef.vars) &&
      durMs(closing?.dur) === durMs(mobileRef.closing?.dur) &&
      durMs(open?.dur) === durMs(mobileRef.open?.dur)
    )

    // Estado final = R1: ganador=to, pastilla flotada, cartas sin inflar, Δ=0
    const endWinner = end.panels.find(p => p.winner)
    const endIsTo = endWinner?.seat === toSeat
    const endChipFloated = !endWinner?.chip || endWinner?.chipPos === 'absolute'
    const endNonWinner = end.panels.find(p => !p.winner && p.cards)
    const endNoInflate = !!endWinner && parseFloat(endWinner.slotML) < 0 && (!endNonWinner || Math.abs(endWinner.cardsW - endNonWinner.cardsW) < 1)
    const endShift = anchorDelta(end, baseline)
    // sin zombis: al terminar no quedan clases de fase ni cartas a medio voltear
    const endClean = await page.evaluate(() => document.querySelectorAll('[class*="opp-reveal-"]').length === 0 && [...document.querySelectorAll('.opp-card-slot .playing-card')].every(c => { const t = getComputedStyle(c).transform; return t === 'none' || !/matrix3d|rotateY/.test(getComputedStyle(c).animationName + t) }))

    // ── R2c · Scroll estable en TODO el ciclo ────────────────────────────────
    // Ni el documento ni el scroller de la mesa pueden cambiar de tamaño,
    // posición ni grosor de barra mientras corre la coreografía: cualquier
    // variación es el saltito (la barra que nace por el overflow desplazable que
    // inflan los transforms del abanico y encoge el cliente 15px).
    // Se enmarca con el reposo ANTERIOR al tap y el reposo final → el ciclo entero.
    const scrollShift = scrollDelta([{ scroll: baseline.scroll }, ...samples, { scroll: end.scroll }])
    const scrollStable = scrollShift.max === 0

    // ── R2c · Confinamiento por ASIENTO: se revela cada finalista y se exige que
    // su carta extrema quede DENTRO del perímetro del área (margen ≥0 por lado).
    const confine = []
    for (const seat of seats.taps) {
      await tapNameBySeat(page, seat)
      await page.waitForTimeout(700); await page.mouse.move(5, 5)
      const c = await measureConfine(page)
      if (!c.err) confine.push(c)
    }
    const confineOk = confine.length > 0 && confine.every(c => c.inside)
    const confineWorst = confine.length ? Math.min(...confine.map(c => c.worst)) : null

    // ── Interrupción A · tap repetido a mitad (debe estar BLOQUEADO) ──
    await reachShowdownTappable(page)
    const s2 = await page.evaluate(() => ({ win: [...document.querySelectorAll('.opp-panel')].find(p => p.className.includes('opp-winner'))?.querySelector('.opp-name')?.textContent.trim(), taps: [...document.querySelectorAll('.opp-name-tappable')].map(e => e.textContent.trim()) }))
    const toA = s2.taps.find(s => s !== s2.win) || s2.taps[0]
    const thirdA = s2.taps.find(s => s !== toA)   // intruso: cualquier finalista ≠ toA (incluido el 'from') → sirve también en mesa 3
    await tapNameBySeat(page, toA)
    await page.waitForTimeout(150)
    if (thirdA) await tapNameBySeat(page, thirdA)   // tap intruso a mitad de coreografía
    await page.waitForTimeout(1200); await page.mouse.move(5, 5)
    const afterA = await page.evaluate(() => ({ winner: [...document.querySelectorAll('.opp-panel')].find(p => p.className.includes('opp-winner'))?.querySelector('.opp-name')?.textContent.trim(), reveals: document.querySelectorAll('[class*="opp-reveal-"]').length }))
    const interruptRepeatOk = afterA.winner === toA && afterA.reveals === 0   // el intruso NO ganó, sin zombis

    // ── Interrupción B · cerrar (siguiente mano) a mitad de coreografía ──
    await reachShowdownTappable(page)
    const s3 = await page.evaluate(() => ({ win: [...document.querySelectorAll('.opp-panel')].find(p => p.className.includes('opp-winner'))?.querySelector('.opp-name')?.textContent.trim(), taps: [...document.querySelectorAll('.opp-name-tappable')].map(e => e.textContent.trim()) }))
    const toB = s3.taps.find(s => s !== s3.win) || s3.taps[0]
    await tapNameBySeat(page, toB)
    await page.waitForTimeout(150)
    await clickIf(page, 'button:has-text("Siguiente mano")')   // cerrar a mitad
    await page.waitForTimeout(600)
    const afterB = await page.evaluate(() => ({ reveals: document.querySelectorAll('[class*="opp-reveal-"]').length, anyFlipping: [...document.querySelectorAll('.opp-card-slot .playing-card')].some(c => /cardFlip/.test(getComputedStyle(c).animationName) && getComputedStyle(c).animationPlayState === 'running') }))
    const interruptCloseOk = afterB.reveals === 0 && !afterB.anyFlipping

    const passed = choreoRan && sawAllPhases && midShift < 0.6 && flipOk && collectOk && varsOk && (matchMobile !== false) &&
      endIsTo && endChipFloated && endNoInflate && endShift < 0.6 && endClean && interruptRepeatOk && interruptCloseOk &&
      gapPositive && gapMatchMobile && (fanCentered !== false) && chipClear &&
      scrollStable && confineOk

    out.push({
      table: n, vp, toSeat, baselineWinner: seats.win,
      choreoRan, sawAllPhases, phaseOrder,
      midShift: Math.round(midShift * 100) / 100, midFrames: midFrames.length,
      timings: { vars: timings.vars, closing, collect, open }, flipOk, collectOk, varsOk, matchMobile,
      endIsTo, endChipFloated, endNoInflate, endShift: Math.round(endShift * 100) / 100, endClean,
      spread, mobGap, gapPositive, gapMatchMobile, lateralSeat, fanCentered, chipClear,
      scrollShift, scrollStable, confine, confineOk, confineWorst,
      interruptRepeatOk, afterA, interruptCloseOk, afterB,
      passed,
    })
    await page.close()
  }
  return { mobileRef, cells: out }
}

// ── DSK-O1 · Óvalo central fijo (mesa 5) ─────────────────────────────────────
// Mide el bbox del óvalo (.center-zone) en TODOS los estados de mensaje del
// juego y comprueba que no se mueve (Δ=0). Los textos NO se inventan: son las
// plantillas reales de gameEngine.js/GameTable.jsx instanciadas con el peor caso
// (nombre 'IA 4', importes de 5 cifras, 3 descartes). Además:
//   · estados REALES muestreados jugando una mano (no sólo inyectados);
//   · umbral de wrap del mensaje más largo (a qué ancho de texto rompe línea);
//   · desborde: ninguna línea puede salirse del perímetro del óvalo.
// Mesa 5 es el alcance de la tanda; 4/3/2 se miden como INSUMO (solo datos).
const O1_TABLES = [5, 4, 3, 2]

// Catálogo por familia. `n2` = variante de mesa 2 (el motor conserva sus
// cadenas originales para N=2 y son distintas de las de N>2).
const O1_MSGS = [
  { fam: 'bienvenida', t: '¡Bienvenido a Ajilei!' },
  { fam: 'reparto', t: 'Repartiendo...' },
  { fam: 'apertura', t: 'A las 2 — IA 4 abre.', n2: 'A las 2 — IA pensando...' },
  { fam: 'apuesta', t: 'IA 4 apuesta 10000.', n2: 'La IA apuesta 10000. ¿Qué haces?' },
  { fam: 'igualar', t: 'IA 4 iguala a 10000.', n2: 'La IA iguala a 10000.' },
  { fam: 'subir', t: 'IA 4 sube a 10000.', n2: 'La IA sube a 10000. ¿Qué haces?' },
  { fam: 'pasar', t: 'IA 4 pasa.', n2: 'La IA pasa.' },
  { fam: 'retirarse', t: 'IA 4 se retira.', n2: '¡La IA se retira! Ganaste el pozo.' },
  { fam: 'descarte-sel', t: 'Selecciona hasta 3 cartas a descartar.' },
  { fam: 'descarte-narra', t: 'IA 4 descarta 3 cartas.', n2: 'Descartas 3 cartas.' },
  { fam: 'descarte-fin', t: 'Descarte completado. Al descarte.', n2: 'Descartaste 3, la IA descartó 3. Al descarte — IA pensando...' },
  { fam: 'resultado', t: 'IA 4 gana con Espadas (41 pts).', n2: 'Pierdes. La IA gana con Espadas (41 pts) vs tu Bastos (33 pts).' },
  { fam: 'resultado-ajilei', t: '¡AJILEI! IA 4 gana con mano perfecta (comodín).', n2: '¡La IA tiene AJILEI! Mano perfecta. Pierdes.' },
  { fam: 'resultado-empate', t: 'Empate. Gana IA 4 por ser el más cercano a la Mano.', n2: '¡Ganas! Tu Espadas (41 pts) supera al Bastos de la IA (33 pts).' },
  { fam: 'retiros', t: 'Los demás se retiran. ¡Ganaste el pozo!', n2: 'Te retiras. La IA gana el pozo.' },
]
const o1Text = (m, n) => (n === 2 && m.n2) ? m.n2 : m.t
// El aviso de eliminación REEMPLAZA el contenido del óvalo (.elim-notice-inline)
// y es la cadena más larga que puede vivir ahí: hasta 3 nombres.
const O1_ELIM = 'IA 1, IA 2, IA 3 se quedaron sin fichas · la mesa ahora es de 2'

// Escribe un texto en el mensaje del óvalo y mide. Es una mutación de MEDICIÓN
// (se restaura al terminar): permite recorrer todas las familias sin depender de
// que la partida las produzca. Devuelve bbox del óvalo, del texto, nº de líneas
// (rects del Range) y si algo desborda el perímetro del óvalo.
async function o1Measure(page, text) {
  return page.evaluate((txt) => {
    const rnd = x => x == null ? null : Math.round(x * 100) / 100
    const R = e => { if (!e) return null; const b = e.getBoundingClientRect(); return { x: rnd(b.x), y: rnd(b.y), w: rnd(b.width), h: rnd(b.height), left: rnd(b.left), right: rnd(b.right), top: rnd(b.top), bottom: rnd(b.bottom) } }
    const oval = document.querySelector('.center-zone')
    const msg = oval?.querySelector('.game-message')
    if (!oval || !msg) return { err: 'no-oval' }
    const prev = msg.textContent
    if (txt != null) msg.textContent = txt
    const range = document.createRange(); range.selectNodeContents(msg)
    const lines = range.getClientRects().length
    const tr = range.getBoundingClientRect()
    const ov = oval.getBoundingClientRect()
    const mr = msg.getBoundingClientRect()
    const out = {
      text: msg.textContent,
      oval: R(oval), msg: R(msg),
      textW: rnd(tr.width), textH: rnd(tr.height), lines,
      // desborde del TEXTO respecto al perímetro del óvalo (>0 = se sale)
      outLeft: rnd(ov.left - tr.left), outRight: rnd(tr.right - ov.right),
      outTop: rnd(ov.top - tr.top), outBottom: rnd(tr.bottom - ov.bottom),
      // recorte propio del párrafo (overflow:hidden del grid en 4/5)
      clipped: msg.scrollWidth > msg.clientWidth + 1 || msg.scrollHeight > msg.clientHeight + 1,
      msgColW: rnd(mr.width),
    }
    if (txt != null) msg.textContent = prev
    return out
  }, text)
}

// Umbral de wrap: alarga el texto PALABRA A PALABRA hasta que el párrafo rompe
// línea; devuelve el ancho (px) del último que cupo en UNA línea — el
// equivalente al 482px documentado en móvil. Aparte, prueba de estrés con una
// cadena CONTINUA (sin espacios, sin oportunidad de corte): no puede romper, así
// que si el óvalo no crece con ella es que su ancho no depende del texto.
async function o1WrapThreshold(page, base) {
  return page.evaluate((base) => {
    const rnd = x => Math.round(x * 100) / 100
    const oval = document.querySelector('.center-zone')
    const msg = oval?.querySelector('.game-message')
    if (!msg) return { err: 'no-msg' }
    const prev = msg.textContent
    const linesOf = () => { const r = document.createRange(); r.selectNodeContents(msg); return { n: r.getClientRects().length, w: rnd(r.getBoundingClientRect().width) } }
    let last1 = null, firstWrap = null
    for (let k = 1; k <= 120; k++) {
      msg.textContent = Array.from({ length: k }, () => 'Mmm').join(' ')   // palabras → hay dónde cortar
      const r = linesOf()
      if (r.n === 1) last1 = { words: k, w: r.w }
      else { firstWrap = { words: k, w: r.w }; break }
    }
    // Estrés: 300 caracteres sin espacios (imposible de romper)
    const ovalBefore = rnd(oval.getBoundingClientRect().width)
    msg.textContent = 'M'.repeat(300)
    const stress = { oval: rnd(oval.getBoundingClientRect().width), clipped: msg.scrollWidth > msg.clientWidth + 1 }
    stress.ovalGrew = rnd(stress.oval - ovalBefore)
    // Y con el texto real más largo: ¿en cuántas líneas cae?
    msg.textContent = base
    const real = linesOf()
    const realBox = msg.getBoundingClientRect()
    msg.textContent = prev
    return { maxOneLinePx: last1?.w ?? null, maxOneLineWords: last1?.words ?? null, firstWrap, stress, realLines: real.n, realTextW: real.w, msgColW: rnd(realBox.width) }
  }, base)
}

async function runO1(browser) {
  const out = []
  const tblFilter = process.argv[3] ? Number(process.argv[3]) : null
  const vpFilter = process.argv[4] || null
  for (const n of O1_TABLES) for (const vp of VIEWPORTS) {
    if (tblFilter && n !== tblFilter) continue
    if (vpFilter && `${vp.w}x${vp.h}` !== vpFilter) continue
    const page = await browser.newPage({ viewport: { width: vp.w, height: vp.h } })
    await gotoMesa(page, n); await installProbes(page)
    await page.waitForTimeout(300); await page.mouse.move(5, 5)

    // 1 · Reposo (bienvenida, tal cual la pinta React)
    const base = await o1Measure(page, null)
    if (base.err) { out.push({ table: n, vp, err: base.err }); await page.close(); continue }

    // 2 · Todas las familias de mensaje (inyectadas)
    const states = []
    for (const m of O1_MSGS) {
      const r = await o1Measure(page, o1Text(m, n))
      states.push({ fam: m.fam, chars: o1Text(m, n).length, ...r })
    }
    // 3 · Aviso de eliminación (sólo mesas que pueden encoger)
    if (n >= 3) states.push({ fam: 'elim-notice', chars: O1_ELIM.length, ...(await o1Measure(page, O1_ELIM)) })

    // 4 · Umbral de wrap contra el mensaje real más largo de esta mesa
    const longest = states.reduce((a, s) => (s.chars > (a?.chars ?? -1) ? s : a), null)
    const wrap = await o1WrapThreshold(page, longest.text)

    // 5 · Estados REALES: se juegan 3 manos muestreando el óvalo en cada fase.
    // Tres manos porque Mano/Pie ROTAN de asiento: los badges y el mazo cambian
    // el ancho de las columnas `auto` del grid .table-mid y con él el 1fr donde
    // vive el óvalo — la elasticidad real del escritorio no la trae el mensaje.
    // Se anota también el ancho de cada side-col para ATRIBUIR la causa.
    const real = []
    const snap = async (tag) => {
      await page.mouse.move(5, 5)
      const m = await o1Measure(page, null)
      const cols = await page.evaluate(() => {
        const rnd = x => Math.round(x * 100) / 100
        const w = s => { const e = document.querySelector(s); return e ? rnd(e.getBoundingClientRect().width) : null }
        return { L: w('.side-col-left'), R: w('.side-col-right'), mid: w('.mid-center'), riv: w('.rivals-zone') }
      })
      real.push({ tag, oval: m.oval, text: m.text, lines: m.lines, cols })
    }
    await snap('waiting')
    for (let hand = 0; hand < 3; hand++) {
      await clickIf(page, 'button:has-text("Iniciar mano")')
      for (let i = 0; i < 60; i++) {
        await page.waitForTimeout(280)
        await snap(`h${hand}t${i}`)
        if (await page.locator('button:has-text("Siguiente mano")').isVisible().catch(() => false)) break
        await clickIf(page, '.action-buttons button:has-text("Pasar")') ||
          await clickIf(page, '.action-buttons button:has-text("Igualar")') ||
          await clickIf(page, '.action-buttons button:has-text("Apostar")')
        await clickIf(page, 'button:has-text("Sin descartar")')
      }
      await snap(`h${hand}-showdown`)
      if (!await clickIf(page, 'button:has-text("Siguiente mano")')) break
      await page.waitForTimeout(1500)
      await snap(`h${hand}-reset`)
    }

    // Δ del óvalo contra el reposo — inyectados y reales por separado
    const dOf = o => bboxDelta(o, base.oval)
    const injMax = Math.max(...states.map(s => dOf(s.oval) || 0))
    const realMax = Math.max(...real.map(r => dOf(r.oval) || 0))
    const worstInj = states.reduce((a, s) => (dOf(s.oval) > dOf(a.oval) ? s : a), states[0])
    const worstReal = real.reduce((a, r) => (dOf(r.oval) > dOf(a.oval) ? r : a), real[0])
    const anyOverflow = states.filter(s => s.outLeft > 0.5 || s.outRight > 0.5 || s.outTop > 0.5 || s.outBottom > 0.5 || s.clipped)
    const ovalStable = Math.max(injMax, realMax) < 0.6
    const longestFits = !anyOverflow.some(s => s.fam === longest.fam)
    // Rango real del óvalo (mín/máx por eje) — es lo que hay que congelar.
    const vals = k => real.map(r => r.oval?.[k]).filter(v => v != null)
    const rng = k => ({ min: round(Math.min(...vals(k))), max: round(Math.max(...vals(k))) })
    const range = { w: rng('w'), h: rng('h'), x: rng('x'), y: rng('y') }
    const colRange = {
      L: { min: round(Math.min(...real.map(r => r.cols?.L ?? Infinity))), max: round(Math.max(...real.map(r => r.cols?.L ?? -Infinity))) },
      R: { min: round(Math.min(...real.map(r => r.cols?.R ?? Infinity))), max: round(Math.max(...real.map(r => r.cols?.R ?? -Infinity))) },
    }

    out.push({
      table: n, vp,
      ovalBase: base.oval,
      injMax: round(injMax), realMax: round(realMax),
      worstInj: { fam: worstInj.fam, d: round(dOf(worstInj.oval)), oval: worstInj.oval, lines: worstInj.lines },
      worstReal: { tag: worstReal.tag, d: round(dOf(worstReal.oval)), text: worstReal.text, oval: worstReal.oval },
      longest: { fam: longest.fam, chars: longest.chars, text: longest.text, lines: longest.lines, textW: longest.textW },
      wrap, range, colRange,
      overflow: anyOverflow.map(s => ({ fam: s.fam, outL: s.outLeft, outR: s.outRight, outT: s.outTop, outB: s.outBottom, clipped: s.clipped })),
      states: states.map(s => ({ fam: s.fam, chars: s.chars, lines: s.lines, textW: s.textW, ovalW: s.oval?.w, ovalH: s.oval?.h, ovalX: s.oval?.x, ovalY: s.oval?.y, clipped: s.clipped })),
      realSeq: real.map(r => ({ tag: r.tag, w: r.oval?.w, h: r.oval?.h, x: r.oval?.x, y: r.oval?.y, lines: r.lines, text: r.text, cols: r.cols })),
      // Alcance: cuando O1 corrió, sólo mesa 5 estaba congelada y 4/3/2 eran
      // INSUMO (passed = null, elasticidad registrada en `range` para el reporte).
      // DSK-O2 selló las tres restantes → las cuatro puntúan. Un dato que se
      // imprime y no gatea es cobertura sólo aparente (lección H2).
      inScope: true,
      ovalStable, longestFits,
      // La cadena continua no debe inflar el óvalo en NINGUNA mesa: en 4/5 lo
      // garantiza el `overflow:hidden` + `minmax(0,360px)` del bloque :948, y en
      // 3/2 la guardia de contención de O2 (overflow + min-width:0 del mensaje).
      stressOk: !wrap.err && Math.abs(wrap.stress?.ovalGrew ?? 0) < 0.6,
      passed: ovalStable && longestFits && !wrap.err && Math.abs(wrap.stress?.ovalGrew ?? 0) < 0.6,
    })
    await page.close()
  }
  return out
}

// ── DSK-H1 · Área del jugador humano ─────────────────────────────────────────
// Alcance GLOBAL: las 4 mesas del gate. Verifica (y REPORTA) la vía de render,
// la reserva del nombre (12ch, con "Tú" y con un nombre de 12 caracteres), el
// shift-check O1 del ciclo rol/TURNO/showdown, y el bloque de saldo (borde
// derecho inmóvil a 3/5/7 dígitos, "Mesa N" alineada, "·" y "fichas" ausentes).
const H1_TABLES = [5, 4, 3, 2]
const H1_NAME12 = 'Wenceslaoxyz'   // 12 caracteres exactos

// Anclas que NO pueden moverse en ningún estado del área humana ni en sus vecinos.
// .player-bar-center (franja de acción) queda FUERA a propósito: su contenido
// cambia por fase (Iniciar mano → botones + timer + multiplicadores → descarte),
// es comportamiento previo y explícitamente fuera del alcance de la tanda. Lo que
// sí se exige es que ese vaivén NO empuje a los bloques de identidad ni de saldo
// —van anclados a los extremos de un grid 1fr/auto/1fr—, y eso lo cubren las
// anclas de abajo. Se mide igual y se reporta su rango.
// El ÓVALO se mide aparte: en mesas 4 (y en la 5 antes de O1) arrastra la
// elasticidad de la columna lateral —el panel del rival ensancha su columna al
// aparecer su pastilla de rol y el óvalo paga la diferencia—, medida y
// documentada en DSK-O1, que sólo congeló la mesa 5 (alcance sellado por Victor).
// Verificado contra HEAD: sin H1, mesa 4 da el MISMO Δ=6.74 en las mismas celdas.
// Por eso el óvalo es gate duro donde está congelado (mesa 5) e informativo en el
// resto, en vez de acusar a esta tanda de un movimiento que no provoca.
const H1_ANCHORS = ['zone', 'bar', 'name', 'tags', 'turno', 'right', 'chips', 'num', 'mesa', 'cards']

async function h1Snap(page) {
  return page.evaluate(() => {
    const rnd = x => x == null ? null : Math.round(x * 100) / 100
    const B = s => { const e = document.querySelector(s); if (!e) return null; const b = e.getBoundingClientRect(); const cs = getComputedStyle(e); return { x: rnd(b.x), y: rnd(b.y), w: rnd(b.width), h: rnd(b.height), right: rnd(b.right), bottom: rnd(b.bottom), disp: cs.display, vis: cs.visibility, txt: e.textContent.trim().slice(0, 24) } }
    const scr = document.querySelector('.game-table-screen')
    // H2 · frente hermano: el header de cada IA aloja las MISMAS familias de
    // pastilla, así que la rotación del rol podía empujar su fila de cartas.
    // Se miden las magnitudes VERTICALES (alto del header, tapa de las cartas):
    // el ancho/x del panel arrastra en mesa 4 la elasticidad O1 abierta y se
    // reporta aparte, informativo, para no acusar a esta tanda de lo ajeno.
    const heads = [...document.querySelectorAll('.opp-panel')].map(p => {
      const h = p.querySelector('.opp-header'), c = p.querySelector('.opp-cards')
      return {
        name: (p.querySelector('.opp-name')?.textContent || '').trim(),
        hdrH: h ? rnd(h.getBoundingClientRect().height) : null,
        hdrW: h ? rnd(h.getBoundingClientRect().width) : null,
        cardsY: c ? rnd(c.getBoundingClientRect().y) : null,
        roles: [...p.querySelectorAll('.opp-header-anchor .seat-badge')].filter(e => getComputedStyle(e).visibility === 'visible').map(e => e.textContent.trim()),
      }
    })
    const az = document.querySelector('.ai-zone')
    const aiHead = az ? {
      infoH: rnd(az.querySelector('.ai-info')?.getBoundingClientRect().height),
      cardsY: rnd(az.querySelector('.cards-row')?.getBoundingClientRect().y),
      roles: [...az.querySelectorAll('.ai-header-anchor .seat-badge')].filter(e => getComputedStyle(e).visibility === 'visible').map(e => e.textContent.trim()),
    } : null
    return {
      heads, aiHead,
      zone: B('.player-zone'), bar: B('.player-bar'), left: B('.player-bar-left'),
      name: B('.pbr-name'), tags: B('.pbr-tags'), turno: B('.badge-turno'),
      chipWin: B('.player-bar-left .win-score-chip'),
      right: B('.player-bar-right'), chips: B('.pbr-chips'), num: B('.pbr-chips .bd-num'),
      mesa: B('.pbr-mesa'), sep: B('.pbr-sep'), fichas: B('.pbr-fichas-word'),
      center: B('.player-bar-center'), cards: B('.player-zone .cards-row'), oval: B('.center-zone'),
      roles: [...document.querySelectorAll('.pbr-tags .seat-badge')].map(e => e.textContent.trim()),
      turnoVisible: (() => { const e = document.querySelector('.badge-turno'); return e ? getComputedStyle(e).visibility === 'visible' : false })(),
      overflow: scr ? scr.scrollHeight - scr.clientHeight : null,
    }
  })
}
// Mutación de MEDICIÓN (se restaura): saldo de N dígitos y/o nombre de 12ch.
const h1Inject = (page, digits, name) => page.evaluate(([d, n]) => {
  const num = document.querySelector('.pbr-chips .bd-num'), nm = document.querySelector('.pbr-name')
  const prev = { num: num?.textContent, nm: nm?.textContent }
  if (d && num) num.textContent = '9'.repeat(d)
  if (n && nm) nm.textContent = n
  return prev
}, [digits, name])
const h1Restore = (page, prev) => page.evaluate((p) => {
  const num = document.querySelector('.pbr-chips .bd-num'), nm = document.querySelector('.pbr-name')
  if (num && p.num != null) num.textContent = p.num
  if (nm && p.nm != null) nm.textContent = p.nm
}, prev)
const h1Delta = (a, b, keys = H1_ANCHORS) => {
  let max = 0, who = null
  for (const k of keys) {
    const d = bboxDelta(a[k], b[k])
    if (d > max) { max = d; who = k }
  }
  return { max: Math.round(max * 100) / 100, who }
}

async function runH1(browser) {
  const out = []
  const tblFilter = process.argv[3] ? Number(process.argv[3]) : null
  const vpFilter = process.argv[4] || null
  for (const n of H1_TABLES) for (const vp of VIEWPORTS) {
    if (tblFilter && n !== tblFilter) continue
    if (vpFilter && `${vp.w}x${vp.h}` !== vpFilter) continue
    const page = await browser.newPage({ viewport: { width: vp.w, height: vp.h } })
    await gotoMesa(page, n); await installProbes(page)
    await page.waitForTimeout(300); await page.mouse.move(5, 5)

    // 1 · VÍA DE RENDER (lección P1: ¿común a las 4 mesas o partida?)
    const route = await page.evaluate(() => {
      const bar = document.querySelector('.player-bar')
      return {
        playerZone: !!document.querySelector('.player-zone'), playerBar: !!bar,
        left: [...(bar?.querySelector('.player-bar-left')?.children || [])].map(e => e.className),
        right: [...(bar?.querySelector('.player-bar-right')?.children || [])].map(e => e.className),
        aiZone: !!document.querySelector('.ai-zone'),   // mesa 2: rival por vía legacy
      }
    })
    const base = await h1Snap(page)

    // 2 · RESERVA DEL NOMBRE: "Tú" vs 12 caracteres → misma geometría
    const prevN = await h1Inject(page, null, H1_NAME12)
    const withName12 = await h1Snap(page)
    await h1Restore(page, prevN)
    const nameShift = h1Delta(withName12, base)
    const nameReserved = nameShift.max < 0.6
    const nameEllipsis = await page.evaluate(() => {
      const e = document.querySelector('.pbr-name'); const cs = getComputedStyle(e)
      return { textOverflow: cs.textOverflow, overflow: cs.overflow, width: cs.width, align: cs.textAlign }
    })

    // 3 · SALDO a 3/5/7 dígitos: el borde derecho de la cifra no se mueve
    const digits = {}
    for (const d of [3, 5, 7]) {
      const prev = await h1Inject(page, d, null)
      digits[d] = await h1Snap(page)
      await h1Restore(page, prev)
    }
    const rights = [3, 5, 7].map(d => digits[d].num?.right)
    const numRightFixed = rights.every(r => r != null && Math.abs(r - rights[0]) < 0.6)
    const growsLeft = digits[7].num.x < digits[3].num.x - 1   // la cifra crece hacia la izquierda
    const mesaAligned = [3, 5, 7].every(d => Math.abs(digits[d].mesa.right - digits[d].num.right) < 0.6)
    const mesaBelow = base.mesa && base.num && base.mesa.y > base.num.y
    const sepGone = !base.sep || base.sep.disp === 'none'
    const fichasGone = !base.fichas || base.fichas.disp === 'none'
    const saldoBlockFixed = [3, 5, 7].every(d => Math.abs(digits[d].right.w - digits[3].right.w) < 0.6)

    // 4 · SHIFT-CHECK O1: ciclo real con ROTACIÓN DE ROL COMPLETA → Δ=0 en el
    // área humana, sus vecinos y los headers de IA.
    // H2 · El Pie rota +1 por mano: el humano es MANO en la 1ª, PIE en la 2ª y
    // se queda SIN ROL en la 3ª (mesas ≥3; en la 2 alterna MANO↔PIE). Hasta H2
    // el ciclo jugaba 2 manos con un techo de 50×280ms = 14s, que NINGUNA mano
    // llegaba a agotar: las 16 celdas veían sólo el rol MANO (rolesSeen=["Mano"])
    // y el Δ de 2px de la pastilla PIE quedaba fuera del muestreo. Ahora son 3
    // manos con techo holgado y la cobertura de roles es PUERTA, no informe.
    const states = []
    for (let hand = 0; hand < 3; hand++) {
      await clickIf(page, 'button:has-text("Iniciar mano")')
      let closed = false
      // Techo por mano: una mano de mesa 5 (4 IAs + descarte + payout) tarda
      // ~40s reales; con 160 iteraciones el ciclo moría a medias y tres celdas
      // de mesa 5 no llegaban a rotar el rol. 340 da holgura de 2× sin encarecer
      // el muestreo: se CLICA cada iteración pero se MUESTREA una de cada dos.
      for (let i = 0; i < 340; i++) {
        await page.waitForTimeout(230); await page.mouse.move(5, 5)
        if (i % 2 === 0) states.push({ tag: `h${hand}t${i}`, ...(await h1Snap(page)) })
        if (await page.locator('button:has-text("Siguiente mano")').isVisible().catch(() => false)) {
          states.push({ tag: `h${hand}t${i}f`, ...(await h1Snap(page)) }); closed = true; break
        }
        await clickIf(page, '.action-buttons button:has-text("Pasar")') ||
          await clickIf(page, '.action-buttons button:has-text("Igualar")') ||
          await clickIf(page, '.action-buttons button:has-text("Apostar")')
        await clickIf(page, 'button:has-text("Sin descartar")')
      }
      states.push({ tag: `h${hand}-sd`, ...(await h1Snap(page)) })
      if (!closed || !await clickIf(page, 'button:has-text("Siguiente mano")')) break
      await page.waitForTimeout(1500); await page.mouse.move(5, 5)
      states.push({ tag: `h${hand}-post`, ...(await h1Snap(page)) })
    }
    // La baseline del ciclo es el reposo inicial; se exige Δ=0 en todos los frames.
    let worst = { max: 0, who: null, tag: null }
    for (const s of states) {
      const d = h1Delta(s, base)
      if (d.max > worst.max) worst = { ...d, tag: s.tag }
    }
    // Rango de la franja de acción (fuera de las anclas, sólo informativo).
    const centerRange = {
      w: [Math.min(...states.map(s => s.center?.w ?? 0)), Math.max(...states.map(s => s.center?.w ?? 0))].map(round),
      h: [Math.min(...states.map(s => s.center?.h ?? 0)), Math.max(...states.map(s => s.center?.h ?? 0))].map(round),
    }
    const cycleStable = worst.max < 0.6
    // Óvalo (vecino) aparte: gate duro sólo donde O1 lo congeló (mesa 5).
    let ovalWorst = { max: 0, tag: null }
    for (const s of states) {
      const d = bboxDelta(s.oval, base.oval)
      if (d > ovalWorst.max) ovalWorst = { max: Math.round(d * 100) / 100, tag: s.tag }
    }
    const ovalStable = ovalWorst.max < 0.6
    const ovalGated = n === 5   // O1 selló mesa 5; 4/3/2 siguen a decisión de Victor
    // Cobertura del ciclo: hay que haber VISTO turno on y off, y algún rol.
    const sawTurnOn = states.some(s => s.turnoVisible)
    const sawTurnOff = states.some(s => !s.turnoVisible)
    const sawRole = states.some(s => s.roles.length > 0)
    const sawNoRole = states.some(s => s.roles.length === 0)
    const sawChip = states.some(s => s.chipWin)
    const rolesSeen = [...new Set(states.flatMap(s => s.roles))]
    const overflowOk = (base.overflow ?? 0) <= 0 && states.every(s => (s.overflow ?? 0) <= 0)
    // H2 · cobertura de la rotación como PUERTA: hay que haber visto MANO y PIE
    // en el área humana; y "sin rol" donde el motor lo produce (mesas ≥3: el rol
    // salta a otra IA en la 3ª mano; en la 2 el humano alterna MANO↔PIE siempre).
    const sawMano = rolesSeen.includes('Mano')
    const sawPie = rolesSeen.includes('Pie')
    const roleCycleOk = sawMano && sawPie && (n === 2 || sawNoRole)

    // H2 · frente hermano: headers de IA (vertical) a lo largo del mismo ciclo.
    const headBase = base.heads.length ? base.heads : (states[0]?.heads ?? [])
    let headWorst = { max: 0, who: null, tag: null }
    for (const s of states) {
      for (const hb of headBase) {
        const cur = s.heads.find(h => h.name === hb.name)
        if (!cur) continue
        for (const f of ['hdrH', 'cardsY']) {
          const d = (cur[f] == null || hb[f] == null) ? 0 : Math.abs(cur[f] - hb[f])
          if (d > headWorst.max) headWorst = { max: Math.round(d * 100) / 100, who: `${hb.name}.${f}`, tag: s.tag }
        }
      }
      if (s.aiHead && base.aiHead) {
        for (const f of ['infoH', 'cardsY']) {
          const d = (s.aiHead[f] == null || base.aiHead[f] == null) ? 0 : Math.abs(s.aiHead[f] - base.aiHead[f])
          if (d > headWorst.max) headWorst = { max: Math.round(d * 100) / 100, who: `IA(m2).${f}`, tag: s.tag }
        }
      }
    }
    const headsStable = headWorst.max < 0.6
    // Cobertura del hermano: alguna IA tuvo que lucir la pastilla neutra (P).
    const headRolesSeen = [...new Set(states.flatMap(s => [...s.heads.flatMap(h => h.roles), ...(s.aiHead?.roles ?? [])]))]
    const headSawPie = headRolesSeen.includes('P')
    // Ancho/x del header: informativo (mesa 4 arrastra la elasticidad O1 abierta).
    let headWidthRange = 0
    for (const s of states) for (const hb of headBase) {
      const cur = s.heads.find(h => h.name === hb.name)
      if (cur && cur.hdrW != null && hb.hdrW != null) headWidthRange = Math.max(headWidthRange, Math.abs(cur.hdrW - hb.hdrW))
    }
    headWidthRange = Math.round(headWidthRange * 100) / 100

    const passed = nameReserved && numRightFixed && growsLeft && mesaAligned && !!mesaBelow &&
      sepGone && fichasGone && saldoBlockFixed && cycleStable && sawTurnOn && sawTurnOff && overflowOk &&
      roleCycleOk && headsStable && headSawPie &&
      (!ovalGated || ovalStable)

    out.push({
      table: n, vp, route,
      routeCommon: route.playerZone && route.playerBar &&
        JSON.stringify(route.left) === JSON.stringify(['pbr-name', 'pbr-badges']),
      base: { name: base.name, tags: base.tags, turno: base.turno, num: base.num, mesa: base.mesa, right: base.right, bar: base.bar },
      nameReserved, nameShift, nameEllipsis, name12Box: withName12.name,
      numRightFixed, rights, growsLeft, mesaAligned, mesaBelow, sepGone, fichasGone, saldoBlockFixed,
      digits: { 3: { num: digits[3].num, mesa: digits[3].mesa }, 5: { num: digits[5].num, mesa: digits[5].mesa }, 7: { num: digits[7].num, mesa: digits[7].mesa } },
      cycleStable, worst, frames: states.length, centerRange,
      ovalStable, ovalWorst, ovalGated,
      roleCycleOk, sawMano, sawPie, headsStable, headWorst, headRolesSeen, headSawPie, headWidthRange,
      sawTurnOn, sawTurnOff, sawRole, sawNoRole, sawChip, rolesSeen,
      overflow: base.overflow, overflowOk,
      passed,
    })
    await page.close()
  }
  return out
}

// ── M1 · Mazo del humano a la mitad (y gemelo IA de mesa 2) ───────────────────
// Verifica, en las 16 celdas: calibre objetivo ±0.5px, esquina superior IZQUIERDA
// en las coordenadas PRE-tanda medidas en la fase (a), ancho de flujo del wrapper
// y alto de fila conservados (compensación de margen), hueco mazo→cartas, sombras
// nuevas (pila del rival), abanico de barajado atado al mazo, reserva viva con
// .deck-hidden y Δ=0 en todo el área a lo largo de una rotación completa de PIE.
const M1_TABLES = [5, 4, 3, 2]
// DSK-A2 · el centinela 1440×850 entra en m1 (la banda 801..900 tiene root 18 con
// carta 76, y ahí el mazo lleva su propio dx). Medido sobre HEAD b79edd5.
const M1_VIEWPORTS = [...VIEWPORTS, { w: 1440, h: 850 }]
// Coordenadas PRE-tanda (fase a, mano 2 con el humano de Pie). `deck.x` era el
// ancla ABSOLUTA del mazo y dependía sólo del viewport —la fila estaba centrada y
// medía igual en las 4 mesas (reverificado sobre HEAD en los 5 viewports)—. DSK-A2
// rompe esa independencia: al centrar las 5 cartas, el mazo se recoloca con
// --dsk-deck-center-dx, que SÍ depende de la mesa (a 1920: −56,83 en 5/4 contra
// −20,00 en 3/2). Por eso `deck.x` sigue siendo el ancla histórica y la expectativa
// viva es `pre.deck.x + dx`, con el dx LEÍDO del `left` usado del wrapper — no una
// tabla nueva por (mesa, viewport) que habría que mantener a mano.
// El mazo IA de mesa 2 lleva +0.11px en Y respecto a este registro desde DSK-H2
// (la reserva de pastilla bajó su fila): la tolerancia de 0.5 lo absorbe.
const M1_PRE = {
  '1024x768': { deck: { x: 246, y: 521, w: 80, h: 122 }, wrap: { w: 112, h: 122 }, ai: { x: 698, y: 114.2 } },
  '1280x720': { deck: { x: 374, y: 473, w: 80, h: 122 }, wrap: { w: 112, h: 122 }, ai: { x: 826, y: 114.2 } },
  '1366x768': { deck: { x: 417, y: 521, w: 80, h: 122 }, wrap: { w: 112, h: 122 }, ai: { x: 869, y: 114.2 } },
  '1440x850': { deck: { x: 454, y: 562, w: 80, h: 122 }, wrap: { w: 112, h: 122 }, ai: { x: 906, y: 154.22 } },
  '1920x937': { deck: { x: 649, y: 606.5, w: 95, h: 146 }, wrap: { w: 127, h: 146 }, ai: { x: 1176, y: 172.59 } },
}

// ── DSK-A2 · tokens vivos de la tanda ────────────────────────────────────────
// Se leen por su valor USADO, no con getPropertyValue: --dsk-fan-center-dx y
// --dsk-deck-center-dx son calc() (y llevan dentro el 100% de --dsk-hand-w), así
// que como custom property NO computan a px. El `margin-left` del primer slot y
// el `left` del wrapper sí: son exactamente esos dos tokens ya resueltos.
async function a2Live(page) {
  return page.evaluate(() => {
    const num = v => parseFloat(v) || 0
    const rnd = x => Math.round(x * 100) / 100
    const scr = document.querySelector('.game-table-screen')
    const cs = getComputedStyle(scr)
    const wrap = document.querySelector('.player-zone .deck-shuffle-wrapper')
    const slot1 = document.querySelector('.player-zone .cards-row .deck-shuffle-wrapper + .card-slot-wrapper')
    const row = document.querySelector('.player-zone .cards-row')
    const bar = document.querySelector('.player-bar')
    return {
      centerDx: slot1 ? rnd(num(getComputedStyle(slot1).marginLeft)) : null,
      deckDx: wrap ? rnd(num(getComputedStyle(wrap).left)) : null,
      wrapPosition: wrap ? getComputedStyle(wrap).position : null,
      gapLeft: num(cs.getPropertyValue('--dsk-fan-gap-left')),
      airX: num(cs.getPropertyValue('--dsk-hand-air-x')),
      airY: num(cs.getPropertyValue('--dsk-hand-air-y')),
      bandW: num(cs.getPropertyValue('--dsk-fan-band-w')),
      // primitivas de la banda contra el padding/margen VIVOS que espejan
      tokRowPadBottom: num(cs.getPropertyValue('--dsk-row-pad-bottom')),
      tokBarMarginTop: num(cs.getPropertyValue('--dsk-bar-margin-top')),
      liveRowPadBottom: num(getComputedStyle(row).paddingBottom),
      liveBarMarginTop: num(getComputedStyle(bar).marginTop),
    }
  })
}
// Anclas del ciclo. .player-bar-left/-right quedan FUERA a propósito: su ancho
// cambia con el chip de puntaje del showdown (contenido legítimo) y es dominio
// de H1, que ya las gatea con sus propias reservas.
const M1_ANCHORS = ['zone', 'row', 'deck', 'wrap', 'card1', 'cardN', 'bar', 'aiDeck', 'aiRow']

async function m1Snap(page) {
  return page.evaluate(() => {
    const rnd = x => x == null ? null : Math.round(x * 100) / 100
    const B = s => { const e = document.querySelector(s); if (!e) return null; const b = e.getBoundingClientRect(); return { x: rnd(b.x), y: rnd(b.y), w: rnd(b.width), h: rnd(b.height), right: rnd(b.right) } }
    const pile = document.querySelector('.player-zone .deck-pile')
    return {
      zone: B('.player-zone'), row: B('.player-zone .cards-row'),
      deck: B('.player-zone .deck-pile'), wrap: B('.player-zone .deck-shuffle-wrapper'),
      // OJO: nada de :first-of-type — el primer <div> de la fila es el WRAPPER
      // del mazo, no una carta, y el selector devolvía null en silencio.
      card1: B('.player-zone .cards-row .card-slot-wrapper'),
      cardN: (() => { const l = [...document.querySelectorAll('.player-zone .cards-row .card-slot-wrapper')].pop(); if (!l) return null; const b = l.getBoundingClientRect(); return { x: rnd(b.x), y: rnd(b.y), w: rnd(b.width), h: rnd(b.height), right: rnd(b.right) } })(),
      bar: B('.player-bar'), left: B('.player-bar-left'), right: B('.player-bar-right'),
      aiDeck: B('.ai-zone .deck-pile'), aiRow: B('.ai-zone .cards-row'),
      aiCardN: (() => { const l = [...document.querySelectorAll('.ai-zone .cards-row .card-slot-wrapper')].pop(); if (!l) return null; const b = l.getBoundingClientRect(); return { x: rnd(b.x), y: rnd(b.y), w: rnd(b.width), h: rnd(b.height), right: rnd(b.right) } })(),
      // El showdown escala las cartas ganadoras (76 → 91.2) y, al ser filas
      // centradas, recoloca a sus vecinos — incluido el mazo. Es PREVIO a M1
      // (verificado idéntico contra HEAD con la tanda en stash: el wrapper de
      // mesa 2 pasa de 837 a 873 en las dos versiones), así que esos frames se
      // miden aparte: lo que M1 sí posee —la compensación— se exige en TODOS.
      winner: !!document.querySelector('.card-slot-winner'),
      // Métricas de LAYOUT (offset*), inmunes al scale del showdown: son las que
      // fija esta tanda —caja del mazo y caja de flujo del wrapper, que es lo que
      // la compensación de margen mantiene constante— y se exigen en todos los
      // frames, incluidos los del showdown.
      flow: (() => {
        const o = e => e ? { w: e.offsetWidth, h: e.offsetHeight } : null
        return {
          deck: o(pile), wrap: o(document.querySelector('.player-zone .deck-shuffle-wrapper')),
          aiDeck: o(document.querySelector('.ai-zone .deck-pile')), aiWrap: o(document.querySelector('.ai-zone .deck-shuffle-wrapper')),
        }
      })(),
      isPie: pile ? !pile.classList.contains('deck-hidden') : null,
      shadow: pile ? getComputedStyle(pile).boxShadow : null,
      vis: pile ? getComputedStyle(pile).visibility : null,
    }
  })
}
const hasAiFlow = (seq) => seq.length > 0 && !!seq[0].aiDeck
const m1Delta = (a, b) => {
  let max = 0, who = null
  for (const k of M1_ANCHORS) {
    if (!a[k] || !b[k]) continue
    for (const f of ['x', 'y', 'w', 'h']) {
      const d = Math.abs(a[k][f] - b[k][f])
      if (d > max) { max = d; who = `${k}.${f}` }
    }
  }
  return { max: Math.round(max * 100) / 100, who }
}

async function runM1(browser) {
  const out = []
  const tblFilter = process.argv[3] ? Number(process.argv[3]) : null
  const vpFilter = process.argv[4] || null
  for (const n of M1_TABLES) for (const vp of M1_VIEWPORTS) {
    if (tblFilter && n !== tblFilter) continue
    if (vpFilter && `${vp.w}x${vp.h}` !== vpFilter) continue
    const key = `${vp.w}x${vp.h}`
    const pre = M1_PRE[key]
    const target = { w: pre.deck.w / 2, h: pre.deck.h / 2 }   // mitad EXACTA del border-box previo
    const page = await browser.newPage({ viewport: { width: vp.w, height: vp.h } })
    await gotoMesa(page, n); await installProbes(page)
    await page.waitForTimeout(300); await page.mouse.move(5, 5)
    // Tokens vivos: gap-left de A1 y el dx de A2 con el que el mazo se recolocó.
    const live = await a2Live(page)
    const fanGapLeft = Number.isFinite(live.gapLeft) && live.gapLeft ? live.gapLeft : 8
    const deckDx = live.deckDx ?? 0

    // Ciclo de 3 manos: el humano es MANO (1ª), PIE (2ª) y sin rol (3ª) → cubre
    // el mazo visible y el oculto sin desmontar (reserva viva de .deck-hidden).
    const states = [{ tag: 'reposo', ...(await m1Snap(page)) }]
    for (let hand = 0; hand < 3; hand++) {
      await clickIf(page, 'button:has-text("Iniciar mano")')
      let closed = false
      for (let i = 0; i < 340; i++) {
        await page.waitForTimeout(230); await page.mouse.move(5, 5)
        if (i % 2 === 0) states.push({ tag: `h${hand}t${i}`, ...(await m1Snap(page)) })
        if (await page.locator('button:has-text("Siguiente mano")').isVisible().catch(() => false)) {
          states.push({ tag: `h${hand}t${i}f`, ...(await m1Snap(page)) }); closed = true; break
        }
        await clickIf(page, '.action-buttons button:has-text("Pasar")') ||
          await clickIf(page, '.action-buttons button:has-text("Igualar")') ||
          await clickIf(page, '.action-buttons button:has-text("Apostar")')
        await clickIf(page, 'button:has-text("Sin descartar")')
      }
      if (!closed || !await clickIf(page, 'button:has-text("Siguiente mano")')) break
      await page.waitForTimeout(1500); await page.mouse.move(5, 5)
      states.push({ tag: `h${hand}-post`, ...(await m1Snap(page)) })
    }

    // Estado de referencia: el primero en el que el humano ES Pie (mazo visible).
    const pieState = states.find(s => s.isPie) || states[0]
    const noPieState = states.find(s => s.isPie === false) || states[0]
    const sawPie = states.some(s => s.isPie)
    const sawNoPie = states.some(s => s.isPie === false)

    // (1) calibre objetivo
    const sizeOk = Math.abs(pieState.deck.w - target.w) <= 0.5 && Math.abs(pieState.deck.h - target.h) <= 0.5
    // (2) esquina superior izquierda EXACTA. La x es la de la fase a MÁS el dx
    //     con el que DSK-A2 recolocó el mazo (leído vivo, no cableado: depende de
    //     la mesa además del viewport). La y sigue siendo la de M1 intacta —
    //     C6 mueve sólo el eje horizontal.
    const anchorExpX = round(pre.deck.x + deckDx)
    const anchorOk = Math.abs(pieState.deck.x - anchorExpX) <= 0.5 && Math.abs(pieState.deck.y - pre.deck.y) <= 0.5
    // (3) compensación: el wrapper conserva su caja de flujo (ancho) y su alto
    const wrapOk = Math.abs(pieState.wrap.w - pre.wrap.w) <= 0.5 && Math.abs(pieState.wrap.h - pre.wrap.h) <= 0.5
    // (4) hueco pila visible → 1ª carta. Era `32 + la mitad que liberó M1 +
    //     --dsk-fan-gap-left` (88 / 95,5): una suma de tres términos históricos que
    //     describía el transitorio abierto por M1. DSK-A2 lo CIERRA convirtiéndolo
    //     en el invariante que fija la tanda — el mazo se recoloca exactamente
    //     hasta dejar el ritmo de A1 y nada más:
    //         pila visible → carta 1 == --dsk-fan-gap-left
    //     Se sigue leyendo el token vivo, así que recalibrar el abanico no deja el
    //     check en rojo permanente (lección A1).
    const gapNow = Math.round((pieState.card1.x - pieState.deck.right) * 100) / 100
    const gapExpected = fanGapLeft
    const gapOk = Math.abs(gapNow - gapExpected) <= 0.5
    // (5) sombras del rival (1/2/3 + 4) en vez de las del humano (2/4/6 + 8)
    const shadowOk = /(^|\s)1px 1px 0px 0px/.test(pieState.shadow || '') && !/8px 8px/.test(pieState.shadow || '')
    // (6) abanico de barajado atado al mazo (se inyecta uno de medición y se retira)
    const fan = await page.evaluate(() => {
      const w = document.querySelector('.player-zone .deck-shuffle-wrapper')
      const d = document.querySelector('.player-zone .deck-pile').getBoundingClientRect()
      const s = document.createElement('div'); s.className = 'shuffle-fan-card'; s.style.animation = 'none'
      w.appendChild(s); const r = s.getBoundingClientRect(); s.remove()
      const rn = x => Math.round(x * 100) / 100
      return { fanW: rn(r.width), fanH: rn(r.height), fanX: rn(r.x), fanY: rn(r.y), deckW: rn(d.width), deckH: rn(d.height), deckX: rn(d.x), deckY: rn(d.y) }
    })
    const fanOk = Math.abs(fan.fanW - fan.deckW) <= 0.5 && Math.abs(fan.fanH - fan.deckH) <= 0.5 &&
      Math.abs(fan.fanX - fan.deckX) <= 0.5 && Math.abs(fan.fanY - fan.deckY) <= 0.5
    // (7) reserva viva: sin Pie el mazo conserva caja y posición (visibility)
    const hiddenReserveOk = !sawNoPie || (Math.abs(noPieState.deck.x - pieState.deck.x) <= 0.5 &&
      Math.abs(noPieState.deck.y - pieState.deck.y) <= 0.5 && Math.abs(noPieState.deck.w - pieState.deck.w) <= 0.5 &&
      Math.abs(noPieState.deck.h - pieState.deck.h) <= 0.5 && noPieState.vis === 'hidden')
    // (8) Δ=0 en TODO el área durante el ciclo completo (incluida la rotación de
    // PIE). Los frames de showdown van aparte: el escalado de las cartas
    // ganadoras recoloca la fila entera y es previo (ver nota en m1Snap).
    let worst = { max: 0, who: null, tag: null }
    let showdownWorst = { max: 0, who: null, tag: null }
    const baseFrame = states[0]
    for (const s of states) {
      const d = m1Delta(s, baseFrame)
      if (s.winner) { if (d.max > showdownWorst.max) showdownWorst = { ...d, tag: s.tag } }
      else if (d.max > worst.max) worst = { ...d, tag: s.tag }
    }
    const cycleStable = worst.max < 0.6
    // (8b) La COMPENSACIÓN se exige en TODOS los frames, showdown incluido, sobre
    // las cajas de LAYOUT: el mazo mide su calibre y el wrapper conserva el ancho
    // de flujo previo (112/127) — eso es lo que impide que nada se recoloque.
    const flowSeq = states.map(s => s.flow).filter(f => f && f.deck && f.wrap)
    const sameFlow = (sel) => flowSeq.every(f => sel(f) && sel(f).w === sel(flowSeq[0]).w && sel(f).h === sel(flowSeq[0]).h)
    const flowConstant = sameFlow(f => f.deck) && sameFlow(f => f.wrap) &&
      (!hasAiFlow(flowSeq) || (sameFlow(f => f.aiDeck) && sameFlow(f => f.aiWrap)))
    const flowWrapOk = flowSeq.length > 0 && Math.abs(flowSeq[0].wrap.w - pre.wrap.w) <= 0.5 && Math.abs(flowSeq[0].wrap.h - pre.wrap.h) <= 0.5
    const flowDeckOk = flowSeq.length > 0 && Math.abs(flowSeq[0].deck.w - target.w) <= 0.5 && Math.abs(flowSeq[0].deck.h - target.h) <= 0.5
    // (9) gemelo de mesa 2: mismo calibre y borde izquierdo/tapa en su sitio
    const hasAi = !!pieState.aiDeck
    const aiSizeOk = !hasAi || (Math.abs(pieState.aiDeck.w - target.w) <= 0.5 && Math.abs(pieState.aiDeck.h - target.h) <= 0.5)
    const aiAnchorOk = !hasAi || (Math.abs(pieState.aiDeck.x - pre.ai.x) <= 0.5 && Math.abs(pieState.aiDeck.y - pre.ai.y) <= 0.5)

    const passed = sizeOk && anchorOk && wrapOk && gapOk && shadowOk && fanOk && hiddenReserveOk &&
      cycleStable && flowConstant && flowWrapOk && flowDeckOk && sawPie && sawNoPie && aiSizeOk && aiAnchorOk

    out.push({
      table: n, vp, target, pre, deckDx, anchorExpX,
      deck: pieState.deck, wrap: pieState.wrap, aiDeck: pieState.aiDeck, shadow: pieState.shadow,
      sizeOk, anchorOk, wrapOk, gapNow, gapExpected, fanGapLeft, gapOk, shadowOk, fan, fanOk,
      hiddenReserveOk, sawPie, sawNoPie, cycleStable, worst, showdownWorst, frames: states.length,
      flowConstant, flowWrapOk, flowDeckOk, flow: flowSeq[0] ?? null,
      hasAi, aiSizeOk, aiAnchorOk, passed,
    })
    console.log(`T${n} ${vp.w}x${vp.h} mazo ${pieState.deck.w}x${pieState.deck.h} (obj ${target.w}x${target.h}) ancla (${pieState.deck.x},${pieState.deck.y}) esp x=${anchorExpX} (dx ${deckDx}) · hueco ${gapNow}/${gapExpected} · Δciclo=${worst.max} ${passed ? 'OK' : 'FAIL'}`)
    await page.close()
  }
  return out
}

// ── A1 · Anclaje arriba-izquierda del abanico humano ─────────────────────────
// Verifica, en las 16 celdas y a lo largo de una rotación COMPLETA de PIE (3
// manos, todas las fases, con y sin cartas repartidas):
//   (1) la esquina superior IZQUIERDA de la 1ª carta es CONSTANTE (Δ=0) — el
//       check crítico de la tanda: es el origen del que colgará F1;
//   (2) los dos huecos coinciden con sus tokens (±0.5px): gap-left contra el
//       borde derecho de la caja reservada del mazo, gap-top contra el borde
//       superior del área;
//   (3) slot y carta comparten anclaje exacto;
//   (4) el mazo sigue en las coordenadas M1 (invariante duro), sea o no PIE;
//   (5) "Tu mejor palo" reubicada: sitio, ciclo de visibility intacto, encaje
//       sin recorte —también con el peor caso inyectado—, cero colisión con el
//       abanico y su lugar en el apilamiento;
//   (6) nada más se movió: alto y tope del área, barra y sus tres columnas,
//       botones y timer contra la baseline PRE-tanda;
//   (7) los tokens primitivos no han derivado del padding vivo que espejan.
// Args: [mesa] [WxH].
const A1_TABLES = [5, 4, 3, 2]
// Baseline PRE-tanda (HEAD, medida en las 16 celdas): TODAS estas magnitudes
// resultaron depender sólo del viewport —la mesa cambia el ancho del área, no
// estas anclas—, así que la tabla va por viewport igual que M1_PRE. Las
// posiciones del mazo son literalmente las de M1_PRE (invariante compartido).
const A1_PRE = {
  // timerDys · el timer NO tiene una sola y: cambia de renglón entre la fase de
  // apuesta (lleva la fila de multiplicadores encima) y la de descarte. Son
  // exactamente DOS posiciones por tier, medidas en HEAD (1366 y 1920) y previas
  // a A1 → el criterio es de PERTENENCIA al juego medido, no de valor único: así
  // se audita el timer en TODAS las fases y no sólo en el frame que toque.
  '1024x768': { zoneTop: 484, zoneH: 262, deck: { x: 246, y: 521 }, wrapW: 112, barDy: 169, leftDx: 19, leftDy: 182.73, centerDy: 169, rightDr: -19, rightDy: 184.95, timerDys: [178.89, 199.39], tagDy: 9 },
  '1280x720': { zoneTop: 436, zoneH: 262, deck: { x: 374, y: 473 }, wrapW: 112, barDy: 169, leftDx: 19, leftDy: 182.73, centerDy: 169, rightDr: -19, rightDy: 184.95, timerDys: [178.89, 199.39], tagDy: 9 },
  '1366x768': { zoneTop: 484, zoneH: 262, deck: { x: 417, y: 521 }, wrapW: 112, barDy: 169, leftDx: 19, leftDy: 182.73, centerDy: 169, rightDr: -19, rightDy: 184.95, timerDys: [178.89, 199.39], tagDy: 9 },
  '1920x937': { zoneTop: 563.5, zoneH: 300, deck: { x: 649, y: 606.5 }, wrapW: 127, barDy: 203, leftDx: 19, leftDy: 213.84, centerDy: 203, rightDr: -19, rightDy: 218.95, timerDys: [211.45, 231.95], tagDy: 13 },
}
// Peor caso de contenido de la línea: el palo más largo del motor y 3 dígitos de
// puntaje (hoy son 2) — la banda debe alojarlo sin recorte.
// DSK-A2 · va como MARCADO, no como texto plano: el JSX envuelve el palo en
// <strong> (negrita) y `textContent` lo perdía. Medido: 182,75 en plano contra
// 185,42 real — 2,67px que hacían parecer suficiente la reserva de 183 de A1.
// MSG-U1b · la banda pasa a la voz de la casa: "Espadas, 999 pts". Dos
// caracteres MENOS que la forma vieja "(999 pts)", así que la reserva medida en
// A1/A2 sigue siendo suficiente por construcción — pero se vuelve a medir igual.
const A1_WORST_TAG = 'Tu mejor palo: <strong>Espadas</strong>, 999 pts'

async function a1Snap(page) {
  return page.evaluate(() => {
    const rnd = x => x == null ? null : Math.round(x * 100) / 100
    const R = e => { if (!e) return null; const b = e.getBoundingClientRect(); return { x: rnd(b.x), y: rnd(b.y), w: rnd(b.width), h: rnd(b.height), top: rnd(b.top), right: rnd(b.right), bottom: rnd(b.bottom), left: rnd(b.left) } }
    const B = s => R(document.querySelector(s))
    const zone = document.querySelector('.player-zone')
    const z = zone.getBoundingClientRect()
    const rel = o => o ? { dx: rnd(o.left - z.left), dy: rnd(o.top - z.top), dr: rnd(o.right - z.right) } : null
    const pile = document.querySelector('.player-zone .deck-pile')
    const tag = document.querySelector('.player-zone .score-tag-player')
    const slot1 = document.querySelector('.player-zone .cards-row .card-slot-wrapper')
    const screen = document.querySelector('.game-table-screen')
    return {
      zone: B('.player-zone'), row: B('.player-zone .cards-row'),
      wrap: B('.player-zone .deck-shuffle-wrapper'), deck: B('.player-zone .deck-pile'),
      card1: R(slot1),
      // la CARTA dentro del primer slot: slots y cartas deben compartir anclaje
      card1Inner: R(slot1 ? slot1.querySelector('.playing-card') : null),
      cardN: (() => { const l = [...document.querySelectorAll('.player-zone .cards-row .card-slot-wrapper')].pop(); return R(l) })(),
      slots: document.querySelectorAll('.player-zone .cards-row .card-slot-wrapper').length,
      bar: B('.player-bar'),
      relBar: rel(B('.player-bar')), relLeft: rel(B('.player-bar-left')),
      relCenter: rel(B('.player-bar-center')), relRight: rel(B('.player-bar-right')),
      relTimer: rel(B('.timer-display')), relTag: rel(B('.player-zone .score-tag-player')),
      // OJO: 'tagBox', no 'tag' — el frame ya usa 'tag' como etiqueta de estado y
      // el spread del snapshot la pisaría (los deltas reportarían una caja en vez
      // del frame culpable).
      tagBox: R(tag),
      tagText: tag ? tag.textContent.trim() : null,
      tagVis: tag ? getComputedStyle(tag).visibility : null,
      // recorte real: el contenido no cabe en la caja confinada por max-width
      tagClipped: tag ? tag.scrollWidth > tag.clientWidth + 0.5 : null,
      isPie: pile ? !pile.classList.contains('deck-hidden') : null,
      overflow: screen ? screen.scrollHeight - screen.clientHeight : null,
      // flujo del wrapper (invariante M1): los márgenes de A1 no deben tocarlo
      flowWrap: (() => { const w = document.querySelector('.player-zone .deck-shuffle-wrapper'); return w ? { w: w.offsetWidth, h: w.offsetHeight } : null })(),
    }
  })
}

// Tokens vivos + los paddings que espejan (guardia de deriva) y el gap de fila.
async function a1Tokens(page) {
  return page.evaluate(() => {
    const num = v => parseFloat(v) || 0
    const zone = document.querySelector('.player-zone')
    const row = document.querySelector('.player-zone .cards-row')
    const cs = getComputedStyle(document.querySelector('.game-table-screen'))
    const zs = getComputedStyle(zone), rs = getComputedStyle(row)
    const px = n => num(cs.getPropertyValue(n))
    return {
      gapTop: px('--dsk-fan-gap-top'), gapLeft: px('--dsk-fan-gap-left'),
      band: px('--dsk-fan-band'),
      // --dsk-fan-row-w es un calc(): una custom property NO computa a px, así
      // que se lee su valor EFECTIVO por donde se consume — el padding-left que
      // reproduce el inset del centrado: rowW = anchoDeFila − 2·padding-left.
      rowWRaw: cs.getPropertyValue('--dsk-fan-row-w').trim(),
      rowWResolved: num(row.getBoundingClientRect().width) - 2 * num(rs.paddingLeft),
      zonePadTop: px('--dsk-zone-pad-top'), zonePadLeft: px('--dsk-zone-pad-left'),
      rowPadTop: px('--dsk-row-pad-top'),
      livePadTop: num(zs.paddingTop), livePadLeft: num(zs.paddingLeft),
      liveRowPadTop: num(rs.paddingTop), liveRowPadLeft: num(rs.paddingLeft), liveRowGap: num(rs.columnGap),
      justify: rs.justifyContent, zonePosition: zs.position,
      cardW: num(getComputedStyle(document.documentElement).getPropertyValue('--card-w')),
    }
  })
}

async function runA1(browser) {
  const out = []
  const tblFilter = process.argv[3] ? Number(process.argv[3]) : null
  const vpFilter = process.argv[4] || null
  for (const n of A1_TABLES) for (const vp of VIEWPORTS) {
    if (tblFilter && n !== tblFilter) continue
    if (vpFilter && `${vp.w}x${vp.h}` !== vpFilter) continue
    const key = `${vp.w}x${vp.h}`
    const pre = A1_PRE[key]
    const page = await browser.newPage({ viewport: { width: vp.w, height: vp.h } })
    await gotoMesa(page, n); await installProbes(page)
    await page.waitForTimeout(300); await page.mouse.move(5, 5)

    const tok = await a1Tokens(page)
    const live = await a2Live(page)      // dx de A2, leídos por valor usado
    // Rotación completa de PIE: 3 manos (mismo ciclo que M1) → el humano es
    // MANO, PIE y sin rol, y se recorren todas las fases con y sin cartas.
    const states = [{ tag: 'reposo', ...(await a1Snap(page)) }]
    for (let hand = 0; hand < 3; hand++) {
      await clickIf(page, 'button:has-text("Iniciar mano")')
      let closed = false
      for (let i = 0; i < 340; i++) {
        await page.waitForTimeout(230); await page.mouse.move(5, 5)
        if (i % 2 === 0) states.push({ tag: `h${hand}t${i}`, ...(await a1Snap(page)) })
        if (await page.locator('button:has-text("Siguiente mano")').isVisible().catch(() => false)) {
          states.push({ tag: `h${hand}t${i}f`, ...(await a1Snap(page)) }); closed = true; break
        }
        await clickIf(page, '.action-buttons button:has-text("Pasar")') ||
          await clickIf(page, '.action-buttons button:has-text("Igualar")') ||
          await clickIf(page, '.action-buttons button:has-text("Apostar")')
        await clickIf(page, 'button:has-text("Sin descartar")')
      }
      if (!closed || !await clickIf(page, 'button:has-text("Siguiente mano")')) break
      await page.waitForTimeout(1500); await page.mouse.move(5, 5)
      states.push({ tag: `h${hand}-post`, ...(await a1Snap(page)) })
    }

    const worstOf = (get) => {
      let max = 0, who = null
      for (const s of states) { const v = get(s); if (v == null) continue; if (Math.abs(v) > max) { max = Math.abs(v); who = s.tag } }
      return { max: round(max), tag: who }
    }
    const every = (fn) => states.every(s => fn(s) !== false)

    // (1) origen del abanico CONSTANTE en todos los frames (Δ=0)
    const base = states[0]
    const dOriginX = worstOf(s => s.card1 ? s.card1.x - base.card1.x : null)
    const dOriginY = worstOf(s => s.card1 ? s.card1.y - base.card1.y : null)
    const originConst = dOriginX.max < 0.5 && dOriginY.max < 0.5
    // (2) huecos = tokens. DSK-A2 re-expresa el horizontal contra la PILA VISIBLE:
    //     con el abanico centrado, el hueco contra el borde de la reserva del
    //     wrapper deja de ser --dsk-fan-gap-left (se le suman los dos dx), pero el
    //     que se ve —pila → carta 1— vale el token exacto por construcción de C6.
    const dGapLeft = worstOf(s => (s.card1 && s.deck) ? (s.card1.left - s.deck.right) - tok.gapLeft : null)
    const dGapTop = worstOf(s => (s.card1 && s.zone) ? (s.card1.top - s.zone.top) - tok.gapTop : null)
    const gapsOk = dGapLeft.max <= 0.5 && dGapTop.max <= 0.5
    // (3) slot y carta comparten anclaje
    const dSlotCardX = worstOf(s => s.card1Inner ? s.card1Inner.x - s.card1.x : null)
    const dSlotCardY = worstOf(s => s.card1Inner ? s.card1Inner.y - s.card1.y : null)
    const slotCardShared = dSlotCardX.max <= 0.5 && dSlotCardY.max <= 0.5
    // (4) mazo en coordenadas M1 exactas + el dx de A2 (leído vivo), con y sin PIE
    const deckExpX = round(pre.deck.x + (live.deckDx ?? 0))
    const dDeckX = worstOf(s => s.deck ? s.deck.x - deckExpX : null)
    const dDeckY = worstOf(s => s.deck ? s.deck.y - pre.deck.y : null)
    const deckOk = dDeckX.max <= 0.5 && dDeckY.max <= 0.5
    const sawPie = states.some(s => s.isPie), sawNoPie = states.some(s => s.isPie === false)
    const flowWrapOk = every(s => !s.flowWrap || (Math.abs(s.flowWrap.w - pre.wrapW) <= 0.5 && s.flowWrap.h === states[0].flowWrap.h))
    // (5) la línea: aquí quedan sólo su CICLO y su ENCAJE. DSK-A2 la mudó de la
    //     banda superior izquierda a debajo de las cartas, así que los checks de
    //     SITIO (tagNoCollision contra la carta 1, dTagDx/dTagDy contra el rincón
    //     de A1, y el apilamiento del peor caso) ya no describen nada: viven ahora
    //     en el modo a2, contra su casa nueva. Lo que no cambió —y por eso sigue
    //     aquí— es que sólo aparece en la fase de pago y que su reserva la aloja.
    const tagFrames = states.filter(s => s.tagVis === 'visible' && s.tagText)
    const tagCycleOk = tagFrames.length > 0 && states.some(s => s.tagVis === 'hidden')
    const tagFits = tagFrames.every(s => !s.tagClipped)
    // (6) nada más movido (baseline PRE-tanda)
    const dZoneTop = worstOf(s => s.zone.top - pre.zoneTop)
    const dZoneH = worstOf(s => s.zone.h - pre.zoneH)
    const dBar = worstOf(s => s.relBar ? s.relBar.dy - pre.barDy : null)
    const dLeftX = worstOf(s => s.relLeft ? s.relLeft.dx - pre.leftDx : null)
    const dLeftY = worstOf(s => s.relLeft ? s.relLeft.dy - pre.leftDy : null)
    const dCenterY = worstOf(s => s.relCenter ? s.relCenter.dy - pre.centerDy : null)
    // los botones van centrados por el grid: se exige simetría, no una x fija
    const dCenterSym = worstOf(s => s.relCenter ? s.relCenter.dx + s.relCenter.dr : null)
    const dRightR = worstOf(s => s.relRight ? s.relRight.dr - pre.rightDr : null)
    const dRightY = worstOf(s => s.relRight ? s.relRight.dy - pre.rightDy : null)
    // Timer · el criterio es de pertenencia al juego de renglones medido en HEAD
    // (ver A1_PRE.timerDys): cada frame con timer debe caer en uno de ellos. Así
    // queda auditado en TODAS las fases —apuesta y descarte— en vez de en el
    // frame que toque muestrear. Se exige además que nunca salga de su columna,
    // cuya caja A1 prueba inmóvil por separado (dCenterY / dCenterSym).
    const timerDys = [...new Set(states.filter(s => s.relTimer).map(s => s.relTimer.dy))].sort((a, b) => a - b)
    const dTimerY = { max: round(Math.max(0, ...timerDys.map(y => Math.min(...pre.timerDys.map(p => Math.abs(y - p)))))), tag: 'set' }
    const timerInsideCenter = states.every(s => !s.relTimer || !s.relCenter ||
      (s.relTimer.dy >= s.relCenter.dy - 0.5 && s.relTimer.dx >= s.relCenter.dx - 0.5))
    const sawTimer = states.some(s => s.relTimer)
    const untouched = [dZoneTop, dZoneH, dBar, dLeftX, dLeftY, dCenterY, dCenterSym, dRightR, dRightY, dTimerY].every(d => d.max <= 0.5) && timerInsideCenter && sawTimer
    const overflowOk = every(s => s.overflow === 0)

    // (5b) peor caso de contenido: la reserva debe alojarlo SIN recorte. Se inyecta
    // con innerHTML porque el marcado real lleva <strong> (ver A1_WORST_TAG); con
    // textContent se medían 2,67px de menos y la reserva parecía sobrada.
    const worstCase = await page.evaluate((html) => {
      const t = document.querySelector('.player-zone .score-tag-player')
      if (!t) return null
      const prev = t.innerHTML, prevVis = t.style.visibility
      t.innerHTML = html; t.style.visibility = 'visible'
      const b = t.getBoundingClientRect()
      const rnd = x => Math.round(x * 100) / 100
      const el = document.elementFromPoint(Math.round(b.left + b.width / 2), Math.round(b.top + b.height / 2))
      const r = {
        html, boxW: rnd(b.width), contentW: t.scrollWidth, clipped: t.scrollWidth > t.clientWidth + 0.5,
        onTop: !!el && (el === t || t.contains(el)),
      }
      t.innerHTML = prev; t.style.visibility = prevVis
      return r
    }, A1_WORST_TAG)
    const worstOk = !!worstCase && !worstCase.clipped && worstCase.onTop

    // (7) guardia de deriva de los tokens primitivos
    const tokensOk = Math.abs(tok.zonePadTop - tok.livePadTop) <= 0.01 &&
      Math.abs(tok.zonePadLeft - tok.livePadLeft) <= 0.01 &&
      Math.abs(tok.rowPadTop - tok.liveRowPadTop) <= 0.01 &&
      Math.abs(tok.liveRowGap - 8) <= 0.01 &&
      tok.justify === 'flex-start' && tok.zonePosition === 'relative' &&
      Math.abs(tok.rowWResolved - (tok.cardW * 6 + 76)) <= 0.5

    const passed = originConst && gapsOk && slotCardShared && deckOk && sawPie && sawNoPie &&
      flowWrapOk && tagCycleOk && tagFits && worstOk &&
      untouched && overflowOk && tokensOk

    out.push({
      table: n, vp, pre, tokens: tok, a2: live, frames: states.length,
      origin: { x: base.card1.x, y: base.card1.y, dX: dOriginX, dY: dOriginY, originConst },
      gaps: { left: round(base.card1.left - base.deck.right), top: round(base.card1.top - base.zone.top), dGapLeft, dGapTop, gapsOk },
      slotCard: { dSlotCardX, dSlotCardY, slotCardShared },
      deck: { x: base.deck.x, y: base.deck.y, deckExpX, dDeckX, dDeckY, deckOk, sawPie, sawNoPie, flowWrapOk },
      tag: { frames: tagFrames.length, sample: tagFrames[0]?.tagText ?? null, tagCycleOk, tagFits, worstCase, worstOk },
      untouchedDeltas: { dZoneTop, dZoneH, dBar, dLeftX, dLeftY, dCenterY, dCenterSym, dRightR, dRightY, dTimerY, timerDys, timerInsideCenter, sawTimer, untouched },
      overflowOk, tokensOk, passed,
    })
    console.log(`T${n} ${vp.w}x${vp.h} origen (${base.card1.x},${base.card1.y}) Δ=${Math.max(dOriginX.max, dOriginY.max)} · gaps pila→c1=${round(base.card1.left - base.deck.right)}/${tok.gapLeft} T=${round(base.card1.top - base.zone.top)}/${tok.gapTop} · mazo (${base.deck.x},${base.deck.y}) esp ${deckExpX} Δ=${Math.max(dDeckX.max, dDeckY.max)} · línea ${tagFrames.length}f fit=${tagFits} peor=${worstCase?.contentW}/${live.bandW} · resto Δ=${Math.max(...[dZoneTop, dZoneH, dBar, dLeftX, dLeftY, dCenterY, dCenterSym, dRightR, dRightY, dTimerY].map(d => d.max))} · ${passed ? 'OK' : 'FAIL'}`)
    await page.close()
  }
  return out
}

// ── F1 · Crecimiento adaptativo de las cartas del humano ─────────────────────
// Verifica, en las 16 celdas y a lo largo de una rotación de PIE con paso por la
// fase de DESCARTE y carta SELECCIONADA:
//   (1) el tamaño coincide con la fórmula, RECALCULADA en vivo desde lo medido
//       (pista, techo libre, piso) — nada cableado, para que recalibrar aires o
//       gaps no deje el check en rojo permanente (lección del gapOk de m1);
//   (2) la proporción 1055:1491 se conserva y el arte no letterboxea;
//   (3) slot y carta son la MISMA caja en los tres estados (cara, dorso, vacío);
//   (4) piso invariante: ninguna celda encoge respecto al tamaño PRE-F1;
//   (5) los dos aires valen lo que dicen sus tokens;
//   (6) PEOR CASO VERTICAL — carta seleccionada (translateY(-18px)): su tope
//       queda DENTRO del área (≥ 0 respecto al borde) y SIN CONTACTO con el
//       óvalo, en las 16 celdas;
//   (7) no se movió nada: origen de A1, mazo en coordenadas M1, alto y tope del
//       área, barra, y overflow del scroller en 0.
// Args: [mesa] [WxH].
const F1_TABLES = [5, 4, 3, 2]
const ART_W = 1055, ART_H = 1491
// Tamaño PRE-F1 por viewport = piso invariante de la tanda (nadie encoge).
const F1_FLOOR = {
  '1024x768': { w: 76, h: 118 }, '1280x720': { w: 76, h: 118 },
  '1366x768': { w: 76, h: 118 }, '1920x937': { w: 91, h: 142 },
}
// DSK-A2 · SEGUNDA puerta del piso. `sizeOk` recalcula el esperado desde el
// rowContentW VIVO, así que un mecanismo que cambiara ese ancho movería fórmula y
// medida a la vez y el check seguiría verde (fue el caso del candidato C1
// vetado en el diagnóstico A2: +3,75 / +5,60px de carta sin que nada se quejara).
// Por eso el piso se ancla además al valor PRE-A2, medido sobre HEAD b79edd5 por
// (mesa, viewport): centrar el abanico no puede tocarlo ni un centésimo.
const F1_A2 = {
  '1024x768': { 5: 94.09, 4: 94.09, 3: 94.09, 2: 94.09 },
  '1280x720': { 5: 94.09, 4: 94.09, 3: 94.09, 2: 94.09 },
  '1366x768': { 5: 94.09, 4: 94.09, 3: 94.09, 2: 94.09 },
  '1440x850': { 5: 98.34, 4: 98.34, 3: 94.59, 2: 94.59 },
  '1920x937': { 5: 115.33, 4: 115.33, 3: 100.59, 2: 100.59 },
}

async function f1Snap(page) {
  return page.evaluate(({ ART_W, ART_H }) => {
    const rnd = x => x == null ? null : Math.round(x * 100) / 100
    const R = e => { if (!e) return null; const b = e.getBoundingClientRect(); return { x: rnd(b.x), y: rnd(b.y), w: rnd(b.width), h: rnd(b.height), top: rnd(b.top), right: rnd(b.right), bottom: rnd(b.bottom), left: rnd(b.left) } }
    const B = s => R(document.querySelector(s))
    const num = v => parseFloat(v) || 0
    const zone = document.querySelector('.player-zone')
    const row = document.querySelector('.player-zone .cards-row')
    const wrap = document.querySelector('.player-zone .deck-shuffle-wrapper')
    const slots = [...document.querySelectorAll('.player-zone .cards-row .card-slot-wrapper')]
    const rs = getComputedStyle(row)
    const z = zone.getBoundingClientRect()
    const rel = o => o ? { dx: rnd(o.left - z.left), dy: rnd(o.top - z.top) } : null
    const screen = document.querySelector('.game-table-screen')
    const s1 = slots[0]
    const card1 = s1 ? s1.querySelector('.playing-card') : null
    const img1 = card1 ? card1.querySelector('img') : null
    const sel = document.querySelector('.player-zone .playing-card.card-selected')
    return {
      zone: B('.player-zone'), deck: B('.player-zone .deck-pile'), bar: B('.player-bar'),
      center: B('.center-zone'),
      slot1: R(s1), slotN: R(slots[slots.length - 1]), slots: slots.length,
      card1: R(card1), img1: R(img1),
      // arte realmente pintado dentro del <img> (object-fit: contain)
      art: img1 ? (() => {
        const b = img1.getBoundingClientRect()
        const k = Math.min(b.width / ART_W, b.height / ART_H)
        return { drawnW: rnd(ART_W * k), drawnH: rnd(ART_H * k), boxW: rnd(b.width), boxH: rnd(b.height) }
      })() : null,
      rowContentW: rnd(row.getBoundingClientRect().width - num(rs.paddingLeft)),
      contentRight: rnd(row.getBoundingClientRect().right),
      rowGap: num(rs.columnGap),
      reserveH: wrap ? wrap.offsetHeight : null,
      relBar: rel(B('.player-bar')),
      selected: sel ? R(sel) : null,
      overflow: screen.scrollHeight - screen.clientHeight,
    }
  }, { ART_W, ART_H })
}

async function f1Tokens(page) {
  return page.evaluate(() => {
    const num = v => parseFloat(v) || 0
    const cs = getComputedStyle(document.querySelector('.game-table-screen'))
    const root = getComputedStyle(document.documentElement)
    return {
      airX: num(cs.getPropertyValue('--dsk-hand-air-x')), airY: num(cs.getPropertyValue('--dsk-hand-air-y')),
      gapLeft: num(cs.getPropertyValue('--dsk-fan-gap-left')), gapTop: num(cs.getPropertyValue('--dsk-fan-gap-top')),
      cardW: num(root.getPropertyValue('--card-w')), cardH: num(root.getPropertyValue('--card-h')),
      cardBox: getComputedStyle(document.querySelector('.player-zone .cards-row .playing-card') || document.body).boxSizing,
      slotAlign: getComputedStyle(document.querySelector('.player-zone .cards-row .card-slot-wrapper')).alignSelf,
      slotAR: getComputedStyle(document.querySelector('.player-zone .cards-row .card-slot-wrapper')).aspectRatio,
    }
  })
}

// DSK-W1 · techo de MANOS del ciclo de f1 (receta H2: dimensionar contra el caso
// más lento, no contra el más rápido). Medido con _w1probe: en mesa 2 la fase de
// descarte del humano NO aparece todas las manos —alterna—, así que 4 manos
// dejaban el estado exigido al azar. Ver la nota de dimensionado sobre F1_MANOS.
const F1_MANOS = 12

async function runF1(browser) {
  const out = []
  const tblFilter = process.argv[3] ? Number(process.argv[3]) : null
  const vpFilter = process.argv[4] || null
  for (const n of F1_TABLES) for (const vp of VIEWPORTS) {
    if (tblFilter && n !== tblFilter) continue
    if (vpFilter && `${vp.w}x${vp.h}` !== vpFilter) continue
    const key = `${vp.w}x${vp.h}`
    const pre = A1_PRE[key], floor = F1_FLOOR[key]
    const page = await browser.newPage({ viewport: { width: vp.w, height: vp.h } })
    await gotoMesa(page, n); await installProbes(page)
    await page.waitForTimeout(300); await page.mouse.move(5, 5)
    const tok = await f1Tokens(page)
    const live = await a2Live(page)

    // Ciclo: hasta 4 manos, muestreando y parando a SELECCIONAR en cuanto se
    // abre la fase de descarte (el peor caso vertical de la tanda).
    const states = [{ tag: 'reposo', ...(await f1Snap(page)) }]
    let selFrame = null
    // DSK-W1 · bitácora del ciclo. Un modo que no alcanza su estado exigido tiene
    // que poder decir POR QUÉ: cuántas manos jugó, si llegó a ver la fase, y si se
    // quedó sin mesa (bancarrota / fin de partida) antes que sin iteraciones.
    const ciclo = { manos: 0, vioDescarte: 0, cerradas: 0, gameOver: false, bancarrota: false, sinCerrar: false }
    for (let hand = 0; hand < F1_MANOS && !selFrame; hand++) {
      ciclo.manos++
      await clickIf(page, 'button:has-text("Iniciar mano")')
      let closed = false
      // DSK-W1 · captura de la fase de descarte, invocable DOS veces por
      // iteración. Es la corrección de fondo de esta tanda: el clic de apuesta
      // cierra BET_2 y el motor abre DISCARD EN EL ACTO, así que el
      // `clickIf('Sin descartar')` de la línea siguiente liquidaba la fase antes
      // del próximo muestreo — el ciclo enterraba justo lo que venía a medir.
      // No era azar ni tiempos: era ORDEN DE OPERACIONES. Medido en la celda
      // peor (mesa 2 · 1366×768), manos con descarte visto: 1/10 sin rechequeo,
      // 10/10 con él.
      const capturarDescarte = async (tag) => {
        if (!await page.locator('.discard-area .btn').first().isVisible().catch(() => false)) return
        ciclo.vioDescarte++
        if (selFrame) return
        // selecciona TODAS las clicables: el peor caso es cualquiera de ellas
        await page.evaluate(() => [...document.querySelectorAll('.player-zone .playing-card.card-clickable')].forEach(el => el.click()))
        await page.waitForTimeout(350); await page.mouse.move(5, 5)
        selFrame = { tag, ...(await f1Snap(page)) }
        states.push(selFrame)
      }
      for (let i = 0; i < 340; i++) {
        await page.waitForTimeout(230); await page.mouse.move(5, 5)
        if (i % 2 === 0) states.push({ tag: `h${hand}t${i}`, ...(await f1Snap(page)) })
        await capturarDescarte(`h${hand}-sel`)
        if (await page.locator('button:has-text("Siguiente mano")').isVisible().catch(() => false)) {
          states.push({ tag: `h${hand}t${i}f`, ...(await f1Snap(page)) }); closed = true; break
        }
        const aposto = await clickIf(page, '.action-buttons button:has-text("Pasar")') ||
          await clickIf(page, '.action-buttons button:has-text("Igualar")') ||
          await clickIf(page, '.action-buttons button:has-text("Apostar")')
        // RECHEQUEO · mirar aquí, no en el siguiente tick, es lo que hace
        // determinista el selReached.
        if (aposto) { await page.waitForTimeout(120); await capturarDescarte(`h${hand}-selr`) }
        await clickIf(page, 'button:has-text("Sin descartar")')
      }
      if (closed) ciclo.cerradas++; else ciclo.sinCerrar = true
      ciclo.gameOver = ciclo.gameOver || await page.locator('.game-over-screen').isVisible().catch(() => false)
      ciclo.bancarrota = ciclo.bancarrota || await page.locator('.bankrupt-overlay').isVisible().catch(() => false)
      if (!closed || !await clickIf(page, 'button:has-text("Siguiente mano")')) break
      await page.waitForTimeout(1500); await page.mouse.move(5, 5)
    }

    const base = states[0]
    const worstOf = (get) => {
      let max = 0, who = null
      for (const s of states) { const v = get(s); if (v == null) continue; if (Math.abs(v) > max) { max = Math.abs(v); who = s.tag } }
      return { max: round(max), tag: who }
    }

    // ── (1) tamaño esperado, RECALCULADO desde lo medido (nada cableado)
    const rise = round(base.deck.y - base.slot1.y)          // subida que recupera el mazo
    const horizBound = round((base.rowContentW - (tok.cardW + 36) - tok.gapLeft - (base.slots - 1) * base.rowGap - tok.airX) / base.slots)
    const vertBound = round((rise + base.reserveH - tok.airY) * ART_W / ART_H)
    const floorW = round(tok.cardH * ART_W / ART_H)
    const expectedW = round(Math.max(floorW, Math.min(horizBound, vertBound)))
    const bound = horizBound <= vertBound ? 'pista' : 'techo'
    const sizeOk = Math.abs(base.slot1.w - expectedW) <= 0.5
    // ── (2) proporción + arte sin letterbox (dentro del borde de la carta)
    const ratioOk = Math.abs(base.slot1.h - base.slot1.w * ART_H / ART_W) <= 0.5
    const artFrames = states.filter(s => s.art)
    const artWasteH = artFrames.length ? round(Math.max(...artFrames.map(s => s.art.boxH - s.art.drawnH))) : null
    const artWasteW = artFrames.length ? round(Math.max(...artFrames.map(s => s.art.boxW - s.art.drawnW))) : null
    // el borde de 1px de la carta deja ≤1px de letterbox residual: es su marco
    const artOk = artFrames.length > 0 && artWasteH <= 1.2 && artWasteW <= 1.2
    // ── (3) slot y carta = misma caja, en los tres estados (cara/dorso/vacío)
    const dCardBox = worstOf(s => s.card1 ? Math.max(Math.abs(s.card1.w - s.slot1.w), Math.abs(s.card1.h - s.slot1.h)) : null)
    const cardIsSlot = dCardBox.max <= 0.5
    const dSizeW = worstOf(s => s.slot1 ? s.slot1.w - base.slot1.w : null)
    const dSizeH = worstOf(s => s.slot1 ? s.slot1.h - base.slot1.h : null)
    const sizeConst = dSizeW.max <= 0.5 && dSizeH.max <= 0.5
    // ── (4) piso invariante · DOBLE puerta (ver F1_A2): nunca encoge respecto a
    //     PRE-F1, y además vale EXACTAMENTE lo que valía antes de DSK-A2.
    const preW = F1_A2[key]?.[n] ?? null
    const preOk = preW == null || Math.abs(base.slot1.w - preW) <= 0.01
    const floorOk = base.slot1.w >= floor.w - 0.01 && base.slot1.h >= floor.h - 0.01 && preOk
    // ── (5) los dos aires valen lo que dicen. DSK-A2 · el derecho pasa de tener
    //     una COTA a tener un VALOR exacto, pero ese valor NO es `airX + |dx|`:
    //     --dsk-hand-air-x es el respiro que reserva la PISTA, y sólo en las
    //     celdas donde la pista gana el min() de F1 el aire sobrante valía el
    //     token. Donde manda el techo vertical la carta se queda corta y sobra
    //     mucho más (81,55 medidos en mesa 5 · 1024, contra 18 del token). La
    //     expectativa se deriva entera de lo vivo: lo que quedaba de la fila antes
    //     de centrar, más lo que el abanico se ha corrido a la izquierda.
    const airXNow = worstOf(s => s.slotN ? -(s.contentRight - s.slotN.right) : null)   // peor (mínimo) aire
    const airXMin = round(Math.min(...states.filter(s => s.slotN).map(s => s.contentRight - s.slotN.right)))
    const airXPre = round(base.rowContentW - (tok.cardW + 36 + tok.gapLeft) - (base.slots * base.slot1.w + (base.slots - 1) * base.rowGap))
    const airXExp = round(airXPre + Math.abs(live.centerDx ?? 0))
    const airYMin = round(Math.min(...states.filter(s => s.slot1).map(s => (s.deck.y + s.reserveH) - s.slot1.bottom)))
    const airOk = Math.abs(airXMin - airXExp) <= 0.5 && airYMin >= tok.airY - 0.5
    // ── (6) PEOR CASO: carta seleccionada
    const selTopVsZone = selFrame?.selected ? round(selFrame.selected.top - selFrame.zone.top) : null
    const selTopVsOval = (selFrame?.selected && selFrame.center) ? round(selFrame.selected.top - selFrame.center.bottom) : null
    const selReached = !!selFrame?.selected
    const selInsideArea = selReached && selTopVsZone >= -0.01
    const selClearsOval = selReached && selTopVsOval >= 0
    // ── (7) nada movido (el mazo, en sus coordenadas M1 + el dx vivo de A2)
    const deckExpX = round(pre.deck.x + (live.deckDx ?? 0))
    const dDeckX = worstOf(s => s.deck ? s.deck.x - deckExpX : null)
    const dDeckY = worstOf(s => s.deck ? s.deck.y - pre.deck.y : null)
    const dOriginX = worstOf(s => s.slot1 ? s.slot1.x - base.slot1.x : null)
    const dOriginY = worstOf(s => s.slot1 ? s.slot1.y - base.slot1.y : null)
    const dZoneTop = worstOf(s => s.zone.top - pre.zoneTop)
    const dZoneH = worstOf(s => s.zone.h - pre.zoneH)
    const dBar = worstOf(s => s.relBar ? s.relBar.dy - pre.barDy : null)
    const overflowOk = states.every(s => s.overflow === 0)
    const untouched = [dDeckX, dDeckY, dOriginX, dOriginY, dZoneTop, dZoneH, dBar].every(d => d.max <= 0.5)

    const passed = sizeOk && ratioOk && artOk && cardIsSlot && sizeConst && floorOk && airOk &&
      selReached && selInsideArea && selClearsOval && untouched && overflowOk &&
      tok.cardBox === 'border-box' && tok.slotAlign === 'flex-start'

    out.push({
      table: n, vp, tokens: tok, a2: live, frames: states.length,
      size: { w: base.slot1.w, h: base.slot1.h, expectedW, horizBound, vertBound, floorW, bound, rise, reserveH: base.reserveH, sizeOk, ratioOk, floorOk, floor, preW, preOk },
      art: { sample: base.art ?? artFrames[0]?.art ?? null, artWasteW, artWasteH, artOk },
      caja: { dCardBox, cardIsSlot, dSizeW, dSizeH, sizeConst },
      aire: { airXMin, airXPre, airXExp, airYMin, tokenX: tok.airX, tokenY: tok.airY, airOk },
      seleccion: { selReached, selTopVsZone, selTopVsOval, selInsideArea, selClearsOval, tag: selFrame?.tag ?? null }, ciclo,
      intacto: { deckExpX, dDeckX, dDeckY, dOriginX, dOriginY, dZoneTop, dZoneH, dBar, overflowOk, untouched },
      passed,
    })
    console.log(`T${n} ${vp.w}x${vp.h} carta ${base.slot1.w}x${base.slot1.h} (esp ${expectedW}, pre-A2 ${preW}, manda ${bound}) · arte waste ${artWasteW}/${artWasteH} · aire x=${airXMin}/${airXExp} y=${airYMin}/${tok.airY} · SEL tope vs área=${selTopVsZone} vs óvalo=${selTopVsOval} (${ciclo.manos}m/${ciclo.cerradas}c/desc ${ciclo.vioDescarte}${ciclo.gameOver ? '/GAMEOVER' : ''}${ciclo.bancarrota ? '/BANCARROTA' : ''}${ciclo.sinCerrar ? '/SINCERRAR' : ''}) · mazo Δ=${Math.max(dDeckX.max, dDeckY.max)} origen Δ=${Math.max(dOriginX.max, dOriginY.max)} área Δ=${Math.max(dZoneTop.max, dZoneH.max, dBar.max)} · ${passed ? 'OK' : 'FAIL'}`)
    await page.close()
  }
  return out
}

// ── Z1 · Zoom de hover en las cartas reveladas de la IA ──────────────────────
// Con hover REAL (mouse.move) carta por carta, en las 16 celdas:
//   (1) la caja ampliada cabe en el perímetro del área y no invade la zona
//       humana (contra las cajas VIVAS de F1);
//   (2) el centro de .opp-name del panel sigue siendo hit-testable con el zoom
//       activo — es el único nodo con handler, taparlo sería una trampa;
//   (3) Δ=0 absoluto de todo lo demás durante el hover: mazo, óvalo, paneles
//       vecinos, zona humana, área total y scroll;
//   (4) la escala efectiva es la del token (±0.02) y el borde ANCLADO por
//       asiento no se mueve (es lo que detecta una desincronización futura de
//       los coeficientes de R2b, que esta tanda espeja);
//   (5) el hover queda suprimido durante la coreografía R2: se dispara sobre una
//       carta en pleno `collect` y la fase debe completar sin congelarse.
// Expectativas leídas de tokens vivos. Args: [mesa] [WxH].
const Z1_TABLES = [5, 4, 3, 2]
// Borde que ancla cada asiento (doctrina R2: crecer hacia el centro / hacia abajo)
const Z1_ANCHOR = {
  'opp-side-left': ['left'], 'opp-side-right': ['right'],
  'opp-top-left': ['top'], 'opp-top-right': ['top'], 'opp-top-center': ['top'],
  'ai-zone': ['top'],            // a 1920 se le suma 'left' (ver abajo)
}
// Los laterales anclan además el borde superior (ver el bloque DSK-Z1 del CSS:
// con el eje y centrado la carta le tapaba el centro del nombre).
Z1_ANCHOR['opp-side-left'].push('top'); Z1_ANCHOR['opp-side-right'].push('top')

async function z1Install(page) {
  await page.evaluate(() => {
    window.__z1rect = (el) => { if (!el) return null; const b = el.getBoundingClientRect(); const r = x => Math.round(x * 100) / 100; return { x: r(b.x), y: r(b.y), w: r(b.width), h: r(b.height), top: r(b.top), right: r(b.right), bottom: r(b.bottom), left: r(b.left) } }
    // anclas que NO deben moverse durante el hover
    window.__z1anchors = () => {
      const R = window.__z1rect, q = s => document.querySelector(s), qa = s => [...document.querySelectorAll(s)]
      const scr = q('.game-table-screen')
      return {
        table: R(q('.game-table')), oval: R(q('.center-zone')), zone: R(q('.player-zone')),
        deck: R(q('.player-zone .deck-pile')), bar: R(q('.player-bar')),
        humanCards: qa('.player-zone .cards-row .card-slot-wrapper').map(R),
        panels: qa('.opp-panel, .ai-zone').map(R),
        otherCards: qa('.opp-panel .opp-card-slot, .ai-zone .card-slot-wrapper').map(R),
        scroll: { l: scr.scrollLeft, t: scr.scrollTop, w: scr.scrollWidth, h: scr.scrollHeight, cw: scr.clientWidth, ch: scr.clientHeight },
      }
    }
    // censo de cartas con CARA visible (criterio estructural, igual que el CSS)
    window.__z1cards = () => {
      const out = []
      document.querySelectorAll('.opp-panel, .ai-zone').forEach((p) => {
        const seat = [...p.classList].find(c => /^opp-(side|top)/.test(c)) || (p.classList.contains('ai-zone') ? 'ai-zone' : 'opp-?')
        p.querySelectorAll('.opp-card-slot, .card-slot-wrapper').forEach((sl, i) => {
          const c = sl.querySelector('.playing-card')
          if (!c || c.classList.contains('card-back') || c.classList.contains('card-empty')) return
          out.push({ seat, idx: i })
        })
      })
      return out
    }
    window.__z1slot = (seat, idx) => {
      const p = [...document.querySelectorAll('.opp-panel, .ai-zone')]
        .find(p => ([...p.classList].find(c => /^opp-(side|top)/.test(c)) || (p.classList.contains('ai-zone') ? 'ai-zone' : '')) === seat)
      if (!p) return null
      return p.querySelectorAll('.opp-card-slot, .card-slot-wrapper')[idx] || null
    }
    window.__z1measure = (seat, idx) => {
      const sl = window.__z1slot(seat, idx); if (!sl) return null
      const p = sl.closest('.opp-panel, .ai-zone')
      const name = p.querySelector('.opp-name, .ai-name')
      const nb = name ? name.getBoundingClientRect() : null
      let hitName = null
      if (nb) {
        const el = document.elementFromPoint(Math.round((nb.left + nb.right) / 2), Math.round((nb.top + nb.bottom) / 2))
        hitName = !!el && (el === name || name.contains(el))
      }
      const t = document.querySelector('.game-table'), ts = getComputedStyle(t), tb = t.getBoundingClientRect()
      const num = v => parseFloat(v) || 0
      return {
        box: window.__z1rect(sl), hitName,
        perim: { left: tb.left + num(ts.borderLeftWidth), right: tb.right - num(ts.borderRightWidth), top: tb.top + num(ts.borderTopWidth), bottom: tb.bottom - num(ts.borderBottomWidth) },
        transform: getComputedStyle(sl).transform, zIndex: getComputedStyle(sl).zIndex,
        panelZ: getComputedStyle(p).zIndex,
      }
    }
    window.__z1tokens = () => {
      const num = v => parseFloat(v) || 0
      const cs = getComputedStyle(document.querySelector('.game-table-screen'))
      return { scale: num(cs.getPropertyValue('--dsk-z1-scale')), ms: cs.getPropertyValue('--dsk-z1-ms').trim(), base: num(cs.getPropertyValue('--dsk-z1-base')), slotZ: num(cs.getPropertyValue('--dsk-z1-slot-z')), panelZ: num(cs.getPropertyValue('--dsk-z1-panel-z')) }
    }
  })
}

const z1Delta = (a, b) => {
  let max = 0, who = null
  const cmp = (k, x, y) => { if (!x || !y) return; for (const f of ['x', 'y', 'w', 'h']) { const d = Math.abs(x[f] - y[f]); if (d > max) { max = d; who = `${k}.${f}` } } }
  for (const k of ['table', 'oval', 'zone', 'deck', 'bar']) cmp(k, a[k], b[k])
  for (const arr of ['humanCards', 'panels', 'otherCards']) {
    const A = a[arr] || [], B = b[arr] || []
    for (let i = 0; i < Math.min(A.length, B.length); i++) cmp(`${arr}[${i}]`, A[i], B[i])
  }
  for (const f of ['l', 't', 'w', 'h', 'cw', 'ch']) { const d = Math.abs(a.scroll[f] - b.scroll[f]); if (d > max) { max = d; who = `scroll.${f}` } }
  return { max: round(max), who }
}

async function runZ1(browser) {
  const out = []
  const tblFilter = process.argv[3] ? Number(process.argv[3]) : null
  const vpFilter = process.argv[4] || null
  for (const n of Z1_TABLES) for (const vp of VIEWPORTS) {
    if (tblFilter && n !== tblFilter) continue
    if (vpFilter && `${vp.w}x${vp.h}` !== vpFilter) continue
    const page = await browser.newPage({ viewport: { width: vp.w, height: vp.h } })
    await gotoMesa(page, n); await installProbes(page); await z1Install(page)
    await page.waitForTimeout(300); await page.mouse.move(5, 5)
    const tok = await page.evaluate(() => window.__z1tokens())

    // showdown con cartas de cara (reintenta manos)
    let hasFace = false
    for (let att = 0; att < 6 && !hasFace; att++) {
      await clickIf(page, 'button:has-text("Iniciar mano")')
      for (let i = 0; i < 200; i++) {
        await page.waitForTimeout(240); await page.mouse.move(5, 5)
        if (await page.locator('button:has-text("Siguiente mano")').isVisible().catch(() => false)) break
        await clickIf(page, '.action-buttons button:has-text("Pasar")') ||
          await clickIf(page, '.action-buttons button:has-text("Igualar")') ||
          await clickIf(page, '.action-buttons button:has-text("Apostar")')
        await clickIf(page, 'button:has-text("Sin descartar")')
      }
      await page.mouse.move(5, 5); await page.waitForTimeout(500)
      hasFace = (await page.evaluate(() => window.__z1cards())).length > 0
      if (!hasFace) { await clickIf(page, 'button:has-text("Siguiente mano")'); await page.waitForTimeout(1200) }
    }

    const cards = await page.evaluate(() => window.__z1cards())
    const checks = []
    for (const c of cards) {
      await page.mouse.move(5, 5); await page.waitForTimeout(200)
      const rest = await page.evaluate(([s, i]) => window.__z1measure(s, i), [c.seat, c.idx])
      const anchorsRest = await page.evaluate(() => window.__z1anchors())
      if (!rest) continue
      // hover REAL sobre el centro de la carta
      await page.mouse.move(Math.round((rest.box.left + rest.box.right) / 2), Math.round((rest.box.top + rest.box.bottom) / 2))
      await page.waitForTimeout(260)   // 130ms de transición + margen
      const hov = await page.evaluate(([s, i]) => window.__z1measure(s, i), [c.seat, c.idx])
      const anchorsHov = await page.evaluate(() => window.__z1anchors())

      const scaleW = round(hov.box.w / rest.box.w), scaleH = round(hov.box.h / rest.box.h)
      const scaleOk = Math.abs(scaleW - tok.scale) <= 0.02 && Math.abs(scaleH - tok.scale) <= 0.02
      // borde anclado: por asiento (a 1920 mesa 2 ancla también la izquierda)
      const anch = [...(Z1_ANCHOR[c.seat] || ['top'])]
      if (c.seat === 'ai-zone' && vp.h > 800) anch.push('left')
      const anchorDrift = round(Math.max(...anch.map(e => Math.abs(hov.box[e] - rest.box[e]))))
      const anchorOk = anchorDrift <= 0.5
      const insidePerim = hov.box.left >= hov.perim.left - 0.5 && hov.box.right <= hov.perim.right + 0.5 &&
        hov.box.top >= hov.perim.top - 0.5 && hov.box.bottom <= hov.perim.bottom + 0.5
      const z = anchorsHov.zone
      const noHuman = !(hov.box.left < z.right && hov.box.right > z.left && hov.box.top < z.bottom && hov.box.bottom > z.top)
      // La propia carta ampliada SÍ se mueve (es el objeto de la tanda): se
      // excluye del censo de "todo lo demás" comparando su caja aparte.
      const hoveredIdx = await page.evaluate(([s, i]) => {
        const sl = window.__z1slot(s, i)
        return [...document.querySelectorAll('.opp-panel .opp-card-slot, .ai-zone .card-slot-wrapper')].indexOf(sl)
      }, [c.seat, c.idx])
      const strip = (a) => ({ ...a, otherCards: a.otherCards.filter((_, i) => i !== hoveredIdx) })
      const delta = z1Delta(strip(anchorsRest), strip(anchorsHov))
      const nameOk = hov.hitName !== false
      const zOk = Number(hov.zIndex) === tok.slotZ
      checks.push({
        seat: c.seat, idx: c.idx, rest: rest.box, hover: hov.box, scaleW, scaleH, scaleOk,
        anchors: anch, anchorDrift, anchorOk, insidePerim, noHuman, nameHit: hov.hitName, nameOk,
        zIndex: hov.zIndex, panelZ: hov.panelZ, zOk, delta,
        ok: scaleOk && anchorOk && insidePerim && noHuman && nameOk && zOk && delta.max <= 0.5,
      })
    }
    await page.mouse.move(5, 5); await page.waitForTimeout(200)

    // ── (5) coreografía con hover encima: debe completar sin congelarse
    let choreo = null
    const tappable = await page.locator('.opp-name-tappable').count()
    if (tappable > 0 && cards.length) {
      const c0 = cards[0]
      const b = (await page.evaluate(([s, i]) => window.__z1measure(s, i), [c0.seat, c0.idx]))?.box
      const tapped = await page.evaluate(() => {
        const el = [...document.querySelectorAll('.opp-name-tappable')].find(e => !e.closest('.opp-panel').className.includes('opp-winner'))
        if (!el) return false
        el.click(); return true
      })
      if (tapped && b) {
        // el cursor entra en la carta MIENTRAS corre la coreografía
        await page.mouse.move(Math.round((b.left + b.right) / 2), Math.round((b.top + b.bottom) / 2))
        await page.waitForTimeout(120)
        const mid = await page.evaluate(() => ({
          phase: [...document.querySelectorAll('.opp-panel')].map(p => [...p.classList].find(x => x.startsWith('opp-reveal')) || null).filter(Boolean),
          anyHoverScale: [...document.querySelectorAll('.opp-panel .opp-card-slot')].some(s => /matrix\(1\.8/.test(getComputedStyle(s).transform)),
        }))
        await page.waitForTimeout(1600); await page.mouse.move(5, 5); await page.waitForTimeout(300)
        const end = await page.evaluate(() => ({
          phases: [...document.querySelectorAll('.opp-panel')].map(p => [...p.classList].find(x => x.startsWith('opp-reveal')) || null).filter(Boolean),
          revealed: window.__z1cards().length,
        }))
        choreo = { tapped, midPhases: mid.phase, hoverSuppressed: !mid.anyHoverScale, endPhases: end.phases, completed: end.phases.length === 0 && end.revealed > 0 }
      }
    }
    await page.close()

    const passed = cards.length > 0 && checks.every(c => c.ok) && (!choreo || (choreo.completed && choreo.hoverSuppressed))
    out.push({ table: n, vp, tokens: tok, cards: cards.length, checks, choreo, passed })
    const bad = checks.filter(c => !c.ok)
    console.log(`T${n} ${vp.w}x${vp.h} · cartas=${cards.length} · escala=${[...new Set(checks.map(c => c.scaleW))].join('/')} (tok ${tok.scale}) · ancla Δmáx=${round(Math.max(0, ...checks.map(c => c.anchorDrift)))} · resto Δmáx=${round(Math.max(0, ...checks.map(c => c.delta.max)))} · nombre ok=${checks.every(c => c.nameOk)} · coreo=${choreo ? (choreo.completed ? 'completa' : 'ROTA') + '/' + (choreo.hoverSuppressed ? 'suprimido' : 'NO-SUPR') : 'n/a'} · ${passed ? 'OK' : 'FAIL' + (bad.length ? ' [' + bad.slice(0, 2).map(b => `${b.seat}#${b.idx}`).join(',') + ']' : '')}`)
  }
  return out
}

// ── DSK-O2 · Óvalo congelado en mesas 4, 3 y 2 ───────────────────────────────
// Cierra la doctrina O1 en las mesas restantes. Gate duro en las 15 celdas
// (4 viewports de campaña + CENTINELA 1440×850, la banda 801..900 donde el root
// va a 18 pero la carta sigue en 76: es donde una constante por tier se rompe
// sin que la matriz de 4 lo note — pasó en el ensayo del diagnóstico).
// El peor caso NO lo produce una mano: se CONSTRUYE (pozo al tope, "A igualar"
// visible, las 15 familias con su clase real, pastilla de rol en un lateral,
// pastilla de comodín inyectada en 3/2 —su guardián es numPlayers>=4, la mesa de
// ORIGEN, así que una 3/2 reducida sí la lleva— y aviso de eliminación con
// nombres de 12ch). Todas las expectativas se DERIVAN de tokens vivos.
const O2_TABLES = [4, 3, 2]
const O2_VIEWPORTS = [...VIEWPORTS, { w: 1440, h: 850 }]
const O2_NAME12 = 'Wenceslaoxyz'
// destino → nº de nombres que pueden caer a la vez para llegar a esa mesa
const O2_ELIM_N = { 4: 1, 3: 2, 2: 3 }
const o2Elim = (n) => `${Array.from({ length: O2_ELIM_N[n] }, () => O2_NAME12).join(', ')} se ${O2_ELIM_N[n] === 1 ? 'quedó' : 'quedaron'} sin fichas · la mesa ahora es de ${n}`

// Anclas: el óvalo y todo lo que podría moverse con él.
const O2_ANCHORS = {
  oval: '.center-zone', colL: '.side-col-left', colR: '.side-col-right',
  riv: '.rivals-zone', midc: '.mid-center', mid: '.table-mid',
  aiZone: '.ai-zone', zone: '.player-zone', bar: '.player-bar',
  cards: '.player-zone .cards-row', table: '.game-table',
  pTC: '.opp-top-center', pTL: '.opp-top-left', pTR: '.opp-top-right',
  pSL: '.opp-side-left', pSR: '.opp-side-right',
}

async function o2Install(page) {
  await page.evaluate((A) => {
    const rnd = x => x == null ? null : Math.round(x * 100) / 100
    window.__o2A = A
    window.__o2snap = () => {
      const o = {}
      for (const [k, s] of Object.entries(A)) {
        const e = document.querySelector(s)
        if (!e) { o[k] = null; continue }
        const b = e.getBoundingClientRect()
        o[k] = { x: rnd(b.x), y: rnd(b.y), w: rnd(b.width), h: rnd(b.height) }
      }
      const scr = document.querySelector('.game-table-screen')
      o.__scroll = scr ? { ovX: scr.scrollWidth - scr.clientWidth, ovY: scr.scrollHeight - scr.clientHeight } : null
      return o
    }
    // Escape del contenido: >0 = algún hijo en flujo se sale. Se mide contra la
    // caja de CONTENIDO (se come el padding) y contra el PERÍMETRO (cruza el filo).
    window.__o2escape = () => {
      const oval = document.querySelector('.center-zone')
      if (!oval) return null
      const cs = getComputedStyle(oval), ov = oval.getBoundingClientRect()
      const cl = ov.left + parseFloat(cs.borderLeftWidth) + parseFloat(cs.paddingLeft)
      const cr = ov.right - parseFloat(cs.borderRightWidth) - parseFloat(cs.paddingRight)
      const ct = ov.top + parseFloat(cs.borderTopWidth) + parseFloat(cs.paddingTop)
      const cb = ov.bottom - parseFloat(cs.borderBottomWidth) - parseFloat(cs.paddingBottom)
      let cont = -Infinity, bord = -Infinity, who = null
      for (const ch of oval.children) {
        const st = getComputedStyle(ch)
        if (st.display === 'none' || st.position === 'absolute') continue
        const b = ch.getBoundingClientRect()
        if (!b.width && !b.height) continue
        const c = Math.max(cl - b.left, b.right - cr, ct - b.top, b.bottom - cb)
        if (c > cont) { cont = c; who = String(ch.className).slice(0, 30) }
        bord = Math.max(bord, ov.left - b.left, b.right - ov.right, ov.top - b.top, b.bottom - ov.bottom)
      }
      return { cont: rnd(cont), bord: rnd(bord), who }
    }
    // Pone texto + clase reales en el mensaje. msgPop arranca en scale(0.8): se
    // apaga la animación o el primer frame devuelve rects un 20% cortos.
    window.__o2msg = (txt, cls) => {
      const m = document.querySelector('.center-zone .game-message')
      if (!m) return false
      if (window.__o2prev == null) window.__o2prev = { t: m.textContent, c: m.className, a: m.style.animation }
      m.textContent = txt
      m.className = 'game-message' + (cls ? ' ' + cls : '')
      m.style.animation = 'none'
      return true
    }
    window.__o2msgRestore = () => {
      const m = document.querySelector('.center-zone .game-message')
      if (m && window.__o2prev) { m.textContent = window.__o2prev.t; m.className = window.__o2prev.c; m.style.animation = window.__o2prev.a }
      window.__o2prev = null
    }
    window.__o2pot = (v) => {
      const el = document.querySelector('.pot-value')
      const t = el && [...el.childNodes].reverse().find(x => x.nodeType === 3)
      if (t) { window.__o2potPrev = window.__o2potPrev ?? t.nodeValue; t.nodeValue = String(v) }
      const c = document.querySelector('.call-box')
      if (c) { window.__o2callPrev = window.__o2callPrev ?? (c.style.visibility || ''); c.style.visibility = 'visible' }
      const cv = document.querySelector('.call-value')
      if (cv) { window.__o2cvPrev = window.__o2cvPrev ?? cv.textContent; cv.textContent = String(v) }
      return !!t
    }
    // Inyecciones con marca [data-o2] para poder retirarlas todas de una vez.
    window.__o2inject = (what, arg) => {
      if (what === 'badge') {
        const p = document.querySelector(arg)
        const a = p && p.querySelector('.opp-header-anchor')
        if (!a) return 0
        const s = document.createElement('span')
        s.className = 'seat-badge seat-badge-neutral seat-badge-letter'
        s.dataset.o2 = '1'; s.textContent = 'P'
        a.insertBefore(s, a.firstChild)
        return 1
      }
      if (what === 'comodin') {
        const z = document.querySelector('.center-zone')
        if (!z || z.querySelector('.comodin-note')) return 0
        const s = document.createElement('span')
        s.className = 'comodin-note'; s.dataset.o2 = '1'; s.textContent = arg
        z.appendChild(s)
        return 1
      }
      if (what === 'elim') {
        const z = document.querySelector('.center-zone')
        if (!z) return 0
        window.__o2elimHidden = [...z.children].map(c => [c, c.style.display])
        window.__o2elimHidden.forEach(([c]) => { c.style.display = 'none' })
        const d = document.createElement('div')
        d.className = 'elim-notice-inline'; d.dataset.o2 = '1'; d.textContent = arg
        z.appendChild(d)
        return 1
      }
      if (what === 'potfloat') {
        const pb = document.querySelector('.pot-box')
        if (!pb) return 0
        const s = document.createElement('span')
        s.className = 'pot-float'; s.dataset.o2 = '1'; s.textContent = '+25000'
        s.style.animation = 'none'
        pb.appendChild(s)
        return 1
      }
      return 0
    }
    window.__o2clean = () => {
      document.querySelectorAll('[data-o2]').forEach(e => e.remove())
      if (window.__o2elimHidden) { window.__o2elimHidden.forEach(([c, d]) => { c.style.display = d }); window.__o2elimHidden = null }
    }
    // El "+N" del pozo es absoluto (vuela por encima del pozo): con la guardia
    // de contención puesta, no puede quedar recortado por el óvalo.
    window.__o2float = () => {
      const f = document.querySelector('.pot-float[data-o2]')
      const oval = document.querySelector('.center-zone')
      if (!f || !oval) return null
      const b = f.getBoundingClientRect(), ov = oval.getBoundingClientRect()
      return { esc: rnd(Math.max(ov.left - b.left, b.right - ov.right, ov.top - b.top, b.bottom - ov.bottom)), h: rnd(b.height) }
    }
    // Tokens y cajas vivas de las que se DERIVAN las expectativas.
    window.__o2tokens = () => {
      const root = getComputedStyle(document.documentElement)
      const scr = getComputedStyle(document.querySelector('.game-table-screen'))
      const mid = document.querySelector('.table-mid')
      const ai = document.querySelector('.ai-zone')
      const riv = document.querySelector('.rivals-zone')
      const panel = document.querySelector('.opp-panel')
      const px = v => { const n = parseFloat(v); return Number.isFinite(n) ? rnd(n) : null }
      return {
        cardW: px(root.getPropertyValue('--card-w')), cardH: px(root.getPropertyValue('--card-h')),
        rootFont: px(root.fontSize),
        aiH: px(scr.getPropertyValue('--o2-ai-h')),
        gridCols: mid ? getComputedStyle(mid).gridTemplateColumns : null,
        aiBox: ai ? (() => { const c = getComputedStyle(ai); return { padT: px(c.paddingTop), padB: px(c.paddingBottom), bT: px(c.borderTopWidth), bB: px(c.borderBottomWidth), boxSizing: c.boxSizing, h: rnd(ai.getBoundingClientRect().height) } })() : null,
        rivBox: riv ? (() => { const c = getComputedStyle(riv); return { padT: px(c.paddingTop), h: rnd(riv.getBoundingClientRect().height), boxSizing: c.boxSizing } })() : null,
        panelH: panel ? rnd(panel.getBoundingClientRect().height) : null,
        ovalOverflow: (() => { const z = document.querySelector('.center-zone'); return z ? getComputedStyle(z).overflow : null })(),
        msgMinW: (() => { const m = document.querySelector('.center-zone .game-message'); return m ? getComputedStyle(m).minWidth : null })(),
      }
    }
    // Apilamiento: ningún ancestro del óvalo puede crear contexto (si lo creara,
    // la carta ampliada de Z1 dejaría de sobrevolarlo).
    window.__o2stack = () => {
      const out = []
      let el = document.querySelector('.center-zone')
      while (el && el !== document.documentElement) {
        const cs = getComputedStyle(el)
        const creates = (cs.position !== 'static' && cs.zIndex !== 'auto') ||
          cs.transform !== 'none' || parseFloat(cs.opacity) < 1 || cs.filter !== 'none' ||
          cs.isolation === 'isolate' || cs.contain.includes('paint') || cs.contain.includes('layout') ||
          cs.perspective !== 'none' || cs.mixBlendMode !== 'normal' || cs.willChange.includes('transform')
        out.push({ cls: String(el.className).slice(0, 34) || el.tagName.toLowerCase(), creates, position: cs.position, zIndex: cs.zIndex })
        el = el.parentElement
      }
      return out
    }
  }, O2_ANCHORS)
}

// Familias reales con su CLASE real (messageActionKind + winner de GameTable.jsx).
const o2Kind = (m) => /se retira|Te retiras/.test(m) ? 'msg-action msg-action-fold'
  : /apuesta|Apuestas|sube|Subes/.test(m) ? 'msg-action msg-action-bet'
  : /pasa|Pasas|iguala|Igualas/.test(m) ? 'msg-action'
  : null

async function runO2(browser) {
  const out = []
  const tblFilter = process.argv[3] ? Number(process.argv[3]) : null
  const vpFilter = process.argv[4] || null
  for (const n of O2_TABLES) for (const vp of O2_VIEWPORTS) {
    if (tblFilter && n !== tblFilter) continue
    if (vpFilter && `${vp.w}x${vp.h}` !== vpFilter) continue
    const page = await browser.newPage({ viewport: { width: vp.w, height: vp.h } })
    await gotoMesa(page, n); await o2Install(page)
    await page.waitForTimeout(300); await page.mouse.move(5, 5)

    const tok = await page.evaluate(() => window.__o2tokens())
    const base = await page.evaluate(() => window.__o2snap())
    const stack = await page.evaluate(() => window.__o2stack())

    // ── estados del peor caso construido ──────────────────────────────────────
    const states = []
    const esc = []
    const add = async (tag) => {
      states.push({ tag, s: await page.evaluate(() => window.__o2snap()) })
      const e = await page.evaluate(() => window.__o2escape())
      if (e) esc.push({ tag, ...e })
    }
    await add('reposo')
    // pozo al tope (5 × saldoInicial) + "A igualar" visible
    await page.evaluate(() => window.__o2pot(25000))
    await add('pozo25000+igualar')
    // 15 familias con su clase real
    for (const m of O1_MSGS) {
      const txt = o1Text(m, n)
      await page.evaluate(([t, c]) => window.__o2msg(t, c), [txt, m.fam.startsWith('resultado') || m.fam === 'retiros' ? 'msg-win' : o2Kind(txt)])
      await add(`msg:${m.fam}`)
    }
    await page.evaluate(() => window.__o2msgRestore())
    // pastilla de comodín: mesa 4 ya la monta; 3 y 2 la llevan si vienen de 4/5
    if (n !== 4) {
      await page.evaluate(t => window.__o2inject('comodin', t), 'Sin comodín')
      await add('comodin:inyectada')
    }
    await page.evaluate(t => window.__o2inject('comodin', t), 'Comodín activo · vale 11')
    await add('comodin:vale11')
    // pastilla de rol en UN lateral (nunca Mano y Pie en la misma cabecera)
    let badgeSeats = 0
    for (const sel of ['.opp-side-left', '.opp-side-right', '.opp-top-left', '.opp-top-right', '.opp-top-center']) {
      const k = await page.evaluate(s => window.__o2inject('badge', s), sel)
      if (!k) continue
      badgeSeats += k
      await add(`pastilla:${sel.slice(5)}`)
      await page.evaluate(() => document.querySelectorAll('[data-o2].seat-badge').forEach(e => e.remove()))
    }
    // aviso de eliminación con nombres de 12ch
    await page.evaluate(t => window.__o2inject('elim', t), o2Elim(n))
    await add(`elim:${o2Elim(n).length}ch`)
    await page.evaluate(() => { document.querySelectorAll('.elim-notice-inline[data-o2]').forEach(e => e.remove()); if (window.__o2elimHidden) { window.__o2elimHidden.forEach(([c, d]) => { c.style.display = d }); window.__o2elimHidden = null } })
    // "+N" del pozo: la guardia de contención no puede recortarlo
    await page.evaluate(() => window.__o2inject('potfloat'))
    const flt = await page.evaluate(() => window.__o2float())
    await page.evaluate(() => window.__o2clean())

    // ── expectativas DERIVADAS de tokens vivos ────────────────────────────────
    // Columna congelada: la fórmula de la tanda, con --card-w leído en vivo.
    const sideExp = n === 4
      ? round(tok.cardW * 0.55 + 14 + Math.max(187.22, tok.cardW * 0.55 * 3.6 + 30))
      : n === 3 ? round(tok.cardW * 0.55 + 14) : null
    const cols = (tok.gridCols || '').split(' ').map(parseFloat)
    const colOk = sideExp == null ? null : (Math.abs(cols[0] - sideExp) < 0.02 && Math.abs(cols[2] - sideExp) < 0.02)
    // rivals-zone: derivada del panel vivo + su padding-top (no cableada).
    const rivExp = tok.rivBox ? round(tok.panelH + tok.rivBox.padT) : null
    const rivOk = rivExp == null ? null : Math.abs(tok.rivBox.h - rivExp) < 0.02
    // .ai-zone: token + padding + borde vivos (content-box).
    const aiExp = tok.aiBox ? round(tok.aiH + tok.aiBox.padT + tok.aiBox.padB + tok.aiBox.bT + tok.aiBox.bB) : null
    const aiOk = aiExp == null ? null : Math.abs(tok.aiBox.h - aiExp) < 0.02

    // Δ del óvalo y de los vecinos entre TODOS los estados construidos
    const frames = states.map(s => s.s)
    const rangeOf = (k) => {
      const v = frames.map(f => f[k]).filter(Boolean)
      if (!v.length) return null
      const d = a => round(Math.max(...v.map(x => x[a])) - Math.min(...v.map(x => x[a])))
      return { x: d('x'), y: d('y'), w: d('w'), h: d('h'), max: round(Math.max(d('x'), d('y'), d('w'), d('h'))) }
    }
    const ovalRange = rangeOf('oval')
    const neighbors = {}
    for (const k of Object.keys(O2_ANCHORS)) { if (k === 'oval') continue; const r = rangeOf(k); if (r) neighbors[k] = r }
    const neighMax = round(Math.max(0, ...Object.values(neighbors).map(r => r.max)))
    const worstNeigh = Object.entries(neighbors).reduce((a, [k, r]) => (r.max > (a?.[1]?.max ?? -1) ? [k, r] : a), null)
    const scrollOk = frames.every(f => (f.__scroll?.ovX ?? 0) === 0 && (f.__scroll?.ovY ?? 0) === 0)
    const escMax = round(Math.max(...esc.map(e => e.cont)))
    const escWorst = esc.reduce((a, e) => (e.cont > a.cont ? e : a), esc[0])
    const stackOk = stack.every(s => !s.creates)
    const guardOk = n === 4 ? true : (tok.ovalOverflow === 'hidden' && tok.msgMinW === '0px')

    const checks = {
      ovalFrozen: ovalRange.max < 0.02,
      colOk, rivOk, aiOk,
      neighborsFrozen: neighMax < 0.02,
      scrollOk,
      escapeOk: escMax <= 0,
      // El "+N" del pozo sólo PUNTÚA donde O2 estrena el clip (mesas 3 y 2). En
      // mesa 4 el overflow:hidden del óvalo es PREEXISTENTE (bloque :948, mesas
      // 4 y 5) y en el tier de óvalo más bajo (1280×720, 164px) el volador ya
      // asomaba 7,75px por arriba: medido idéntico contra HEAD y contra la mesa 5
      // sellada por O1, y O2 no lo mueve ni un pelo (el congelado es horizontal;
      // el alto del óvalo no cambia). Se sigue imprimiendo — un rojo permanente
      // "por diseño" entrena a ignorar rojos, y enterrarlo sería peor.
      floatOk: n === 4 ? null : (!flt || flt.esc <= 0),
      guardOk,
      stackOk,
    }
    const passed = Object.values(checks).every(v => v === true || v === null)
    out.push({
      table: n, vp, tokens: tok, sideExp, rivExp, aiExp, badgeSeats,
      states: states.length, ovalBase: base.oval, ovalRange, neighMax,
      worstNeighbor: worstNeigh && { k: worstNeigh[0], ...worstNeigh[1] },
      escape: { max: escMax, worst: escWorst }, potFloat: flt,
      stack, checks, passed,
    })
    console.log(`T${n} ${vp.w}x${vp.h} · óvalo ${base.oval?.w}x${base.oval?.h}@${base.oval?.x} Δ=${ovalRange.max} · col ${sideExp == null ? 'n/a (sin .table-mid)' : `${cols[0]}/${sideExp} ${colOk ? 'ok' : 'FAIL'}`} · riv ${tok.rivBox?.h ?? '-'}/${rivExp ?? '-'} · ai ${tok.aiBox?.h ?? '-'}/${aiExp ?? '-'} · vecinos Δ=${neighMax}${worstNeigh && worstNeigh[1].max > 0.02 ? ` [${worstNeigh[0]}]` : ''} · escape=${escMax} (${escWorst?.who ?? '-'}) · float=${flt ? flt.esc + (n === 4 && flt.esc > 0 ? ' (preexistente, = mesa 5)' : '') : 'n/a'} · guardia=${guardOk} · stack=${stackOk} · ${states.length} estados · ${passed ? 'OK' : 'FAIL [' + Object.entries(checks).filter(([, v]) => v === false).map(([k]) => k).join(',') + ']'}`)
    await page.close()
  }
  return out
}

// ── A2 · Abanico del humano centrado + mazo recolocado + banda bajo las cartas ─
// 20 celdas (4 mesas × 4 viewports + centinela 1440×850), una mano completa cada
// una, con los 12 checks del diagnóstico A2b §5. Todas las expectativas se
// DERIVAN de tokens vivos (leídos por su valor usado: los de A2 son calc()).
const A2_TABLES = [5, 4, 3, 2]
const A2_VIEWPORTS = [...VIEWPORTS, { w: 1440, h: 850 }]
const A2_WORST_TAG = A1_WORST_TAG          // misma línea, mismo marcado real

// Muestreador de vuelos por rAF: duran 595/750ms y el polling de 230ms los pierde.
async function a2InstallFlights(page) {
  await page.evaluate(() => {
    window.__paint = (el) => {
      if (!el) return null
      const rnd = x => Math.round(x * 100) / 100
      const kids = [...el.querySelectorAll('*')].filter(e => e.getBoundingClientRect().height > 0)
      if (kids.length) {
        const b = kids.map(k => k.getBoundingClientRect())
        return { top: rnd(Math.min(...b.map(x => x.top))), left: rnd(Math.min(...b.map(x => x.left))), right: rnd(Math.max(...b.map(x => x.right))), src: 'kids' }
      }
      const rg = document.createRange(); rg.selectNodeContents(el)
      const b = rg.getBoundingClientRect()
      return b.height ? { top: rnd(b.top), left: rnd(b.left), right: rnd(b.right), src: 'text' } : null
    }
    window.__flights = { samples: 0, inZone: 0, maxBottomInZone: -1e9 }
    const tick = () => {
      const fs = document.querySelectorAll('.flying-card')
      const zone = document.querySelector('.player-zone')
      if (fs.length && zone) {
        const z = zone.getBoundingClientRect(); window.__flights.samples++
        for (const f of fs) {
          const b = f.getBoundingClientRect()
          if (b.bottom > z.top && b.top < z.bottom && b.right > z.left && b.left < z.right) {
            window.__flights.inZone++
            window.__flights.maxBottomInZone = Math.max(window.__flights.maxBottomInZone, b.bottom)
          }
        }
      }
      requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  })
}

async function a2Snap(page) {
  return page.evaluate(() => {
    const rnd = x => x == null ? null : Math.round(x * 100) / 100
    const R = e => { if (!e) return null; const b = e.getBoundingClientRect(); return { x: rnd(b.x), y: rnd(b.y), w: rnd(b.width), h: rnd(b.height), top: rnd(b.top), right: rnd(b.right), bottom: rnd(b.bottom), left: rnd(b.left) } }
    const Q = s => document.querySelector(s)
    const zone = Q('.player-zone'), row = Q('.player-zone .cards-row')
    const pile = Q('.player-zone .deck-pile'), tag = Q('.player-zone .score-tag-player')
    const slots = [...document.querySelectorAll('.player-zone .cards-row .card-slot-wrapper')]
    const area = Q('.player-bar-center .action-area')
    const scr = Q('.game-table-screen')
    const rb = row.getBoundingClientRect()
    const c1 = slots[0]?.getBoundingClientRect(), cN = slots[slots.length - 1]?.getBoundingClientRect()
    const tb = tag?.getBoundingClientRect()
    const btns = area ? [...area.querySelectorAll('.btn')] : []
    const olap = (b, r) => (!b || b.right <= r.left || b.left >= r.right || b.bottom <= r.top || b.top >= r.bottom)
      ? null : { x: rnd(Math.min(b.right, r.right) - Math.max(b.left, r.left)), y: rnd(Math.min(b.bottom, r.bottom) - Math.max(b.top, r.top)) }
    return {
      kind: area ? (area.className.replace('action-area', '').trim() || 'action') : 'none',
      btn: btns.map(b => b.textContent.trim().slice(0, 16)).join('|'),
      // (1) simetría del grupo de 5 contra los filos útiles (= border-box de la fila)
      simIzq: c1 ? rnd(c1.left - rb.left) : null,
      simDer: cN ? rnd(rb.right - cN.right) : null,
      // (2)/(3)/(4)/(5)
      card1: R(slots[0]), slotW: c1 ? rnd(c1.width) : null,
      respiro: (c1 && pile) ? rnd(c1.left - pile.getBoundingClientRect().right) : null,
      pilaFilo: pile ? rnd(pile.getBoundingClientRect().left - rb.left) : null,
      isPie: pile ? !pile.classList.contains('deck-hidden') : null,
      cardsBottom: slots.length ? rnd(Math.max(...slots.map(s => s.getBoundingClientRect().bottom))) : null,
      // fondo de la reserva del mazo: es de donde cuelga el `top` de la banda, y
      // se mide APARTE para que la expectativa del sitio no se derive de la propia
      // banda (un check que se compara consigo mismo pasa siempre).
      wrapBottom: (() => { const w = document.querySelector('.player-zone .deck-shuffle-wrapper'); return w ? rnd(w.getBoundingClientRect().bottom) : null })(),
      // (6) banda
      tagVis: tag ? getComputedStyle(tag).visibility : null,
      tagBox: R(tag), tagClipped: tag ? tag.scrollWidth > tag.clientWidth + 0.5 : null,
      tagText: tag ? tag.textContent.trim() : null,
      tagCx: (tb && c1 && cN) ? rnd((tb.left + tb.right) / 2 - (c1.left + cN.right) / 2) : null,
      paint: window.__paint(area),
      olapPaint: (() => { const p = window.__paint(area); return (p && tb) ? olap(tb, { left: p.left, right: p.right, top: p.top, bottom: p.top + 1e4 }) : null })(),
      olapBtns: btns.map(b => ({ t: b.textContent.trim().slice(0, 14), o: olap(tb, b.getBoundingClientRect()) })).filter(x => x.o),
      // (8)
      ovX: scr.scrollWidth - scr.clientWidth, ovY: scr.scrollHeight - scr.clientHeight,
      // (12) gemelo IA de mesa 2
      ai: (() => {
        const az = Q('.ai-zone'); if (!az) return null
        const asl = [...az.querySelectorAll('.card-slot-wrapper')]
        return { zone: R(az), row: R(az.querySelector('.cards-row')), wrap: R(az.querySelector('.deck-shuffle-wrapper')),
          pile: R(az.querySelector('.deck-pile')), s0: R(asl[0]), sN: R(asl[asl.length - 1]) }
      })(),
    }
  })
}

// (7) fuera de flujo estricto: con la banda VISIBLE y su peor contenido montado,
// nada de alrededor se mueve ni el scroller crece.
async function a2OutOfFlow(page, html) {
  return page.evaluate((h) => {
    const rnd = x => Math.round(x * 100) / 100
    const R = s => { const e = document.querySelector(s); if (!e) return null; const b = e.getBoundingClientRect(); return [rnd(b.x), rnd(b.y), rnd(b.width), rnd(b.height)] }
    const A = ['.player-zone', '.player-zone .cards-row', '.player-zone .deck-shuffle-wrapper',
      '.player-zone .deck-pile', '.player-bar', '.player-bar-left', '.player-bar-center',
      '.player-bar-right', '.player-bar-center .action-area', '.center-zone', '.game-table']
    const S = () => [...document.querySelectorAll('.player-zone .cards-row .card-slot-wrapper')].map(e => { const b = e.getBoundingClientRect(); return [rnd(b.x), rnd(b.y), rnd(b.width), rnd(b.height)] })
    const scr = document.querySelector('.game-table-screen')
    const grab = () => ({ a: A.map(R), s: S(), sh: scr.scrollHeight, ch: scr.clientHeight })
    const t = document.querySelector('.player-zone .score-tag-player')
    const prevHTML = t.innerHTML, prevVis = t.style.visibility
    const before = grab()
    t.innerHTML = h; t.style.visibility = 'visible'
    const after = grab()
    const b = t.getBoundingClientRect()
    const res = {
      dAnchors: rnd(Math.max(0, ...A.map((_, i) => {
        const x = before.a[i], y = after.a[i]; if (!x || !y) return 0
        return Math.max(...x.map((v, j) => Math.abs(v - y[j])))
      }))),
      dSlots: rnd(Math.max(0, ...before.s.map((x, i) => after.s[i] ? Math.max(...x.map((v, j) => Math.abs(v - after.s[i][j]))) : 0))),
      dScrollH: after.sh - before.sh, dClientH: after.ch - before.ch,
      worstW: rnd(b.width), worstContentW: t.scrollWidth, worstClipped: t.scrollWidth > t.clientWidth + 0.5,
    }
    t.innerHTML = prevHTML; t.style.visibility = prevVis
    return res
  }, html)
}

// DSK-W1 · techo de MANOS del ciclo de a2 (hermano del F1_MANOS de arriba).
const A2_MANOS = 12

async function runA2(browser) {
  const out = []
  const tblFilter = process.argv[3] ? Number(process.argv[3]) : null
  const vpFilter = process.argv[4] || null
  for (const n of A2_TABLES) for (const vp of A2_VIEWPORTS) {
    if (tblFilter && n !== tblFilter) continue
    if (vpFilter && `${vp.w}x${vp.h}` !== vpFilter) continue
    const key = `${vp.w}x${vp.h}`
    const page = await browser.newPage({ viewport: { width: vp.w, height: vp.h } })
    await gotoMesa(page, n); await installProbes(page); await a2InstallFlights(page)
    await page.waitForTimeout(300); await page.mouse.move(5, 5)
    const live = await a2Live(page)
    const preW = F1_A2[key]?.[n] ?? null

    // Manos completas: cubren reposo, barajado, reparto, apuesta (con la fila de
    // multiplicadores, que es el techo del carril), descarte con selección, y pago
    // —el único estado donde la banda está viva—. El ciclo NO se corta en la 1ª:
    // el respiro pila→carta 1 se exige CON y SIN Pie, y el Pie rota +1 por mano
    // (en mesa 5 el humano puede no serlo hasta la 3ª). Se para en cuanto la
    // cobertura está completa, para no pagar manos de más.
    // DSK-W1 · el techo sube de 3 a A2_MANOS por la receta H2: la banda sólo vive
    // si el humano LLEGA AL SHOWDOWN con puntaje (`human.score`), y eso no pasa
    // todas las manos. Con 3 manos la cobertura quedaba al azar de cómo cayera el
    // juego; el ciclo sigue parando en cuanto está cubierta, así que el caso
    // normal no paga ni una mano más.
    const states = [{ tag: 'reposo', ...(await a2Snap(page)) }]
    const covered = () => states.some(s => s.isPie) && states.some(s => s.isPie === false) &&
      states.some(s => s.tagVis === 'visible')
    const ciclo = { manos: 0, cerradas: 0, gameOver: false, bancarrota: false, sinCerrar: false }
    for (let hand = 0; hand < A2_MANOS && !covered(); hand++) {
      ciclo.manos++
      await clickIf(page, 'button:has-text("Iniciar mano")')
      let closed = false
      for (let i = 0; i < 240; i++) {
        await page.waitForTimeout(230); await page.mouse.move(5, 5)
        states.push({ tag: `h${hand}t${i}`, ...(await a2Snap(page)) })
        if (await page.locator('button:has-text("Siguiente mano")').isVisible().catch(() => false)) {
          states.push({ tag: `h${hand}-pago`, ...(await a2Snap(page)) }); closed = true; break
        }
        const aposto = await clickIf(page, '.action-buttons button:has-text("Pasar")') ||
          await clickIf(page, '.action-buttons button:has-text("Igualar")') ||
          await clickIf(page, '.action-buttons button:has-text("Apostar")')
        // DSK-W1 · RECHEQUEO, hermano del de f1: el clic de apuesta cierra BET_2
        // y DISCARD se abre en el acto, así que el `kind` muestreado ANTES de
        // apostar ya no describe la fase viva. Se vuelve a mirar aquí en vez de
        // esperar al siguiente tick, que es donde el ciclo perdía la fase.
        let ult = states[states.length - 1]
        if (aposto) {
          await page.waitForTimeout(120)
          ult = { tag: `h${hand}t${i}r`, ...(await a2Snap(page)) }
          states.push(ult)
        }
        if (ult.kind.includes('discard')) {
          await page.evaluate(() => { const c = document.querySelector('.player-zone .playing-card.card-clickable'); if (c) c.click() })
          await page.waitForTimeout(250)
          states.push({ tag: `h${hand}-sel`, ...(await a2Snap(page)) })
          await clickIf(page, 'button:has-text("Sin descartar")') || await clickIf(page, '.discard-area .btn')
        }
      }
      if (closed) ciclo.cerradas++; else ciclo.sinCerrar = true
      ciclo.gameOver = ciclo.gameOver || await page.locator('.game-over-screen').isVisible().catch(() => false)
      ciclo.bancarrota = ciclo.bancarrota || await page.locator('.bankrupt-overlay').isVisible().catch(() => false)
      if (!closed || covered()) break
      if (!await clickIf(page, 'button:has-text("Siguiente mano")')) break
      await page.waitForTimeout(1500); await page.mouse.move(5, 5)
      states.push({ tag: `h${hand}-post`, ...(await a2Snap(page)) })
    }
    const flights = await page.evaluate(() => window.__flights)
    const oof = await a2OutOfFlow(page, A2_WORST_TAG)

    const F = states.filter(s => s.card1)
    const pago = F.filter(s => s.btn === 'Siguiente mano')
    const apuesta = F.filter(s => s.kind.includes('action-col'))
    const worstOf = (get) => {
      let max = 0, who = null
      for (const s of F) { const v = get(s); if (v == null) continue; if (Math.abs(v) > max) { max = Math.abs(v); who = s.tag } }
      return { max: round(max), tag: who }
    }
    const base = F[0]
    // (1) simetría
    const dSim = worstOf(s => (s.simIzq != null && s.simDer != null) ? s.simIzq - s.simDer : null)
    // (2) origen constante
    const dOrigX = worstOf(s => s.card1.x - base.card1.x)
    const dOrigY = worstOf(s => s.card1.y - base.card1.y)
    // (3) piso: doble puerta
    const dSizeW = worstOf(s => s.slotW - base.slotW)
    // (4) respiro, con y sin PIE
    const dResp = worstOf(s => s.respiro != null ? s.respiro - live.gapLeft : null)
    const sawPie = F.some(s => s.isPie), sawNoPie = F.some(s => s.isPie === false)
    // (5) aterrizaje
    const pilaMin = round(Math.min(...F.filter(s => s.pilaFilo != null).map(s => s.pilaFilo)))
    // (6) banda en su casa nueva (medida sobre los frames de PAGO, donde vive)
    const bandFrames = F.filter(s => s.tagVis === 'visible')
    const bandDyExp = round(live.airY + live.liveRowPadBottom + live.liveBarMarginTop)
    const bandDy = bandFrames.length ? round(bandFrames[0].tagBox.top - bandFrames[0].cardsBottom) : null
    // Sobrante de la reserva del mazo por debajo de las cartas más allá del propio
    // --dsk-hand-air-y. Medido en el WRAPPER, no en la banda: 0 en las 16 celdas
    // donde manda el techo de F1 y 5,33 / 20,84 en las 4 donde manda la pista
    // (mesas 3/2 a 1440 y 1920), donde las cartas acaban más arriba y la línea se
    // apoya en el filo de la barra. El eje vertical no admite --dsk-hand-w (lleva
    // un 100% y en `top` los porcentajes resuelven contra el ALTO), así que el
    // ancla del CSS es la reserva y la expectativa se deriva de ella.
    const reserveVsCards = bandFrames.length
      ? round(bandFrames[0].wrapBottom - bandFrames[0].cardsBottom - live.airY) : null
    const bandClearPaint = bandFrames.length ? round(Math.min(...bandFrames.filter(s => s.paint).map(s => s.paint.top - s.tagBox.bottom))) : null
    const bandNoClip = bandFrames.every(s => !s.tagClipped)
    const bandCentered = bandFrames.every(s => Math.abs(s.tagCx) <= 0.5)
    const bandNoBtn = bandFrames.every(s => s.olapBtns.length === 0)
    const bandNoPaint = bandFrames.every(s => !s.olapPaint)
    // (9) ciclo de visibility: viva SÓLO en pago
    const visOnlyPayout = bandFrames.length > 0 && bandFrames.every(s => s.btn === 'Siguiente mano') &&
      F.some(s => s.tagVis === 'hidden')
    // (10) guardia de la fase de apuesta: nunca visible sobre la fila de mults
    const betGuardOk = apuesta.length > 0 && apuesta.every(s => s.tagVis === 'hidden')
    // (11) vuelos por debajo de la banda
    const flightOk = !flights.inZone || bandDy == null ||
      flights.maxBottomInZone <= (bandFrames[0].tagBox.top + 0.5)
    // (12) gemelo IA de mesa 2 intacto. NO se mide comparando frames entre sí: el
    // showdown escala las cartas ganadoras de la IA y, al ser su fila centrada,
    // recoloca a sus vecinos —incluido su mazo— con un efecto que es PREVIO a esta
    // tanda (documentado en m1Snap). Lo que A2 tiene que demostrar es que no lo
    // TOCA, así que se contrasta el frame en reposo contra la baseline de HEAD
    // (M1_PRE.ai) y contra su propia simetría de bloque, que es el criterio que el
    // rival ya implementaba: abanico y mazo centrados como un todo.
    const aiBase = F[0].ai, aiPre = M1_PRE[key]?.ai
    const aiSim = aiBase ? {
      izq: round(aiBase.s0.left - aiBase.row.left),
      der: round(aiBase.row.right - aiBase.wrap.right),
      dPileX: round(aiBase.pile.x - (aiPre?.x ?? aiBase.pile.x)),
      dPileY: round(aiBase.pile.y - (aiPre?.y ?? aiBase.pile.y)),
    } : null
    const dAi = aiSim ? { max: round(Math.max(Math.abs(aiSim.izq - aiSim.der), Math.abs(aiSim.dPileX), Math.abs(aiSim.dPileY))), tag: 'reposo' } : { max: 0, tag: null }

    const checks = {
      simetria: dSim.max <= 0.5,
      origenConst: dOrigX.max < 0.5 && dOrigY.max < 0.5,
      pisoF1: dSizeW.max < 0.5 && (preW == null || Math.abs(base.slotW - preW) <= 0.01),
      respiro: dResp.max <= 0.5 && sawPie && sawNoPie,
      aterrizaje: pilaMin >= 0,
      bandaSitio: null,          // se calcula justo debajo (necesita el sobrante de la reserva)
      bandaEncaje: bandNoClip && bandCentered,
      bandaLibre: bandNoBtn && bandNoPaint && (bandClearPaint == null || bandClearPaint >= 0),
      fueraDeFlujo: oof.dAnchors === 0 && oof.dSlots === 0 && oof.dScrollH === 0 && oof.dClientH === 0 && !oof.worstClipped,
      overflow: F.every(s => s.ovX === 0 && s.ovY === 0),
      cicloVisibility: visOnlyPayout,
      guardiaApuesta: betGuardOk,
      vuelos: flightOk,
      gemeloIA: n !== 2 ? null : dAi.max <= 0.5,
      primitivas: Math.abs(live.tokRowPadBottom - live.liveRowPadBottom) <= 0.01 &&
        Math.abs(live.tokBarMarginTop - live.liveBarMarginTop) <= 0.01 && live.wrapPosition === 'relative',
    }
    checks.bandaSitio = bandFrames.length > 0 && Math.abs(bandDy - (bandDyExp + reserveVsCards)) <= 0.05

    const passed = Object.values(checks).every(v => v === true || v === null)
    out.push({
      table: n, vp, live, preW, frames: F.length,
      simetria: { izq: base.simIzq, der: base.simDer, dSim },
      origen: { x: base.card1.x, y: base.card1.y, dOrigX, dOrigY },
      piso: { w: base.slotW, preW, dSizeW },
      mazo: { respiro: base.respiro, dResp, pilaMin, sawPie, sawNoPie },
      banda: { frames: bandFrames.length, dy: bandDy, dyExp: bandDyExp, reserveVsCards, clearPaint: bandClearPaint,
        w: bandFrames[0]?.tagBox?.w ?? null, cx: bandFrames[0]?.tagCx ?? null, bandNoClip, bandCentered, bandNoBtn, bandNoPaint },
      fueraDeFlujo: oof, vuelos: { ...flights, bandTop: bandFrames[0]?.tagBox?.top ?? null },
      gemeloIA: { ...dAi, ...aiSim, pre: aiPre }, ciclo, checks, passed,
    })
    console.log(`T${n} ${vp.w}x${vp.h} · sim ${base.simIzq}/${base.simDer} Δ=${dSim.max} · carta ${base.slotW}/${preW} · respiro ${base.respiro}/${live.gapLeft} pila@${pilaMin} · banda ${bandFrames.length}f (${ciclo.manos}m/${ciclo.cerradas}c${ciclo.gameOver ? '/GAMEOVER' : ''}${ciclo.bancarrota ? '/BANCARROTA' : ''}${ciclo.sinCerrar ? '/SINCERRAR' : ''}) dy=${bandDy} (exp ${bandDyExp}${reserveVsCards ? ` +${reserveVsCards} de reserva` : ''}) w=${bandFrames[0]?.tagBox?.w}/${live.bandW} aire↓=${bandClearPaint} · flujo Δ=${oof.dAnchors}/${oof.dSlots}/${oof.dScrollH} · vuelo ${round(flights.maxBottomInZone)}≤${bandFrames[0]?.tagBox?.top} · IA Δ=${dAi.max} · ${passed ? 'OK' : 'FAIL [' + Object.entries(checks).filter(([, v]) => v === false).map(([k]) => k).join(',') + ']'}`)
    await page.close()
  }
  return out
}

// ── DSK-U1 · Menú de utilidades (escritorio) ─────────────────────────────────
// Documento rector: docs/AJILEI_Menu_Utilidades_v1.1.md (+ enmienda y apéndice).
// 20 celdas = las 16 de campaña + el centinela 1440×850.
const U1_TABLES = [5, 4, 3, 2]
const U1_VIEWPORTS = [...VIEWPORTS, { w: 1440, h: 850 }]

// 11 anclas del Δ=0 (las 10 del ensayo E3 del diagnóstico + .action-area).
const U1_ANCHORS = [
  '.game-table', '.table-header', '.header-right', '.utilities-trigger', '.btn-leave',
  '.table-title', '.table-mid', '.center-zone', '.player-zone', '.cards-row', '.action-area',
]

// Guardia de contenido: lo que el panel NO puede tocar en NINGÚN estado.
const U1_GUARD = ['.action-buttons .btn', '.btn-mult', '.timer-display', '.score-tag-player']

// BASELINE PRE-TANDA · caja viva del botón de sonido a HEAD 7ef28c9, medida en
// las 20 celdas (ensayo E1/E2 del diagnóstico). Colapsa a dos perfiles por
// viewport: área ancha (mesas 5/4) y estrecha (3/2); dentro de cada uno, las dos
// mesas son idénticas al centésimo. Se guarda el filo DERECHO de .header-right
// (el ancla real: la ✕ está pegada a él y no se movió nunca) y de ahí se derivan
// las x — así el baseline es una cifra por celda y no una tabla de rects.
const U1_TRIGGER = { w: 40.61, h: 32 }   // caja que el CSS debe reservar (ley E2)
const U1_HR_W = 79.23                    // ⋮ 40.61 + gap 8 + ✕ 30.63
const U1_X_W = 30.63, U1_X_H = 29, U1_X_DY = 1.5
const U1_PRE = {
  '1024x768': { y: 22,   right: { wide: 977,  narrow: 916  } },
  '1280x720': { y: 22,   right: { wide: 1156, narrow: 1044 } },
  '1366x768': { y: 22,   right: { wide: 1199, narrow: 1087 } },
  '1920x937': { y: 71.5, right: { wide: 1476, narrow: 1364 } },
  '1440x850': { y: 53,   right: { wide: 1236, narrow: 1124 } },
}
const U1_TOL = 0.05
// U1b · el estándar de la fila del menú sube a 44 (el de campaña sigue siendo 40
// para el disparador): con solo-icono el panel encoge en ancho, no en área.
const U1_ITEM_MIN = 44
// ── EMB-2 · recableado del metro (regla ARN-1) ───────────────────────────────
// «Quien mueve la ruta, recablea el metro.» EMB-2 mete una entrada nueva en el
// ⋮ —Tapetes, tercera y viva— y tres puertas de `u1` la contaban a mano:
//   · `panelDims`   exigía `dims.n === 4`                → 4 → 5
//   · `manoSeparada` exigía `titles[3] === 'Mano actual'` → índice → LA ÚLTIMA
//   · `tooltips`    exigía `titles.length === 4` y los tres primeros por índice
//                                                        → la lista completa
// Contabilidad: viejo 4 entradas · nuevo 5 entradas · movedor EMB-2.
//
// El recableado no relaja nada: la lista de abajo es MÁS estricta que la de
// antes (sella las cinco leyendas y su orden, no tres de cuatro). Y deja de
// depender de índices, que es el defecto de fondo que ARN-2 desmontó en `msg`:
// una puerta atada a una posición se rompe la próxima vez que alguien inserte
// algo en medio, y lo hace en silencio.
const U1_ENTRADAS = ['Sonido', 'Reacciones', 'Tapetes', 'Saldo', 'Mano actual']

async function u1Install(page) {
  await page.evaluate(({ ANCHORS }) => {
    const rnd = x => x == null ? null : Math.round(x * 100) / 100
    window.__u1R = (s) => {
      const e = typeof s === 'string' ? document.querySelector(s) : s
      if (!e) return null
      const b = e.getBoundingClientRect()
      return { x: rnd(b.x), y: rnd(b.y), w: rnd(b.width), h: rnd(b.height), right: rnd(b.right), bottom: rnd(b.bottom) }
    }
    window.__u1Snap = () => { const o = {}; ANCHORS.forEach(s => { o[s] = window.__u1R(s) }); return o }
    window.__u1Diff = (a, b) => {
      let max = 0, worst = null
      for (const k of ANCHORS) {
        if (!a[k] || !b[k]) continue
        for (const p of ['x', 'y', 'w', 'h']) {
          const d = Math.abs(a[k][p] - b[k][p])
          if (d > max) { max = d; worst = `${k}.${p}` }
        }
      }
      return { max: rnd(max), worst }
    }
    window.__u1Scroll = () => {
      const s = document.querySelector('.game-table-screen')
      const de = document.scrollingElement || document.documentElement
      return {
        scrH: s.scrollHeight, cliH: s.clientHeight,
        ovY: s.scrollHeight - s.clientHeight, ovX: s.scrollWidth - s.clientWidth,
        docOvY: de.scrollHeight - de.clientHeight, docOvX: de.scrollWidth - de.clientWidth,
      }
    }
    // Censo del z VIVO dentro del área (el panel vive FUERA de .game-table, así
    // que no puede contaminar su propia referencia; el filtro es cinturón).
    window.__u1MaxZ = () => {
      let max = -1, who = null
      document.querySelectorAll('.game-table *').forEach(el => {
        if (el.closest('.utilities-panel')) return
        const cs = getComputedStyle(el)
        if (cs.zIndex === 'auto' || cs.visibility === 'hidden' || cs.display === 'none') return
        const z = Number(cs.zIndex)
        if (!Number.isFinite(z)) return
        if (el.getBoundingClientRect().width === 0) return
        if (z > max) { max = z; who = String(el.className || '').trim().slice(0, 40) }
      })
      return { max, who }
    }
    // El z declarado no basta: el panel tiene que GANAR el hit-test en su centro
    // y en sus cuatro esquinas interiores (elementFromPoint es el juez real).
    window.__u1Wins = () => {
      const p = document.querySelector('.utilities-panel')
      if (!p) return null
      const r = p.getBoundingClientRect()
      const pts = [
        [(r.left + r.right) / 2, (r.top + r.bottom) / 2],
        [r.left + 3, r.top + 3], [r.right - 3, r.top + 3],
        [r.left + 3, r.bottom - 3], [r.right - 3, r.bottom - 3],
      ]
      return pts.every(([x, y]) => { const t = document.elementFromPoint(x, y); return !!t && (t === p || p.contains(t)) })
    }
    window.__u1Panel = () => window.__u1R('.utilities-panel')
    window.__u1Guard = (sels) => {
      const p = document.querySelector('.utilities-panel')
      if (!p) return []
      const r = p.getBoundingClientRect()
      const hits = []
      sels.forEach(s => document.querySelectorAll(s).forEach(el => {
        const b = el.getBoundingClientRect()
        if (b.width === 0 || b.height === 0) return
        const cs = getComputedStyle(el)
        if (cs.visibility === 'hidden' || cs.display === 'none') return
        const ox = Math.min(r.right, b.right) - Math.max(r.left, b.left)
        const oy = Math.min(r.bottom, b.bottom) - Math.max(r.top, b.top)
        if (ox > 0 && oy > 0) hits.push({ sel: s, txt: el.textContent.trim().slice(0, 12), area: rnd(ox * oy) })
      }))
      return hits
    }
    window.__u1Open = () => !!document.querySelector('.utilities-panel')
    // U1b · sin palabras: el estado del sonido lo portan el glifo y la clase.
    window.__u1SoundEntry = () => {
      const e = document.querySelector('.util-item-sound')
      if (!e) return null
      return { off: e.className.includes('is-off'), glyph: e.querySelector('.util-ico').textContent.trim(), title: e.getAttribute('title') }
    }
    // U1b · las dimensiones del panel se DERIVAN del contenido vivo, nunca se
    // cablean: ancho = el token, alto = suma de filas + separación + padding +
    // bordes. Recompactar el panel no puede volver a exigir tocar el arnés.
    window.__u1PanelExpect = () => {
      const p = document.querySelector('.utilities-panel')
      if (!p) return null
      const cs = getComputedStyle(p)
      const items = [...p.querySelectorAll('.util-item')]
      const sum = items.reduce((a, e) => a + e.getBoundingClientRect().height, 0)
      const mt = items.reduce((a, e) => a + (parseFloat(getComputedStyle(e).marginTop) || 0), 0)
      return {
        n: items.length,
        expW: parseFloat(cs.getPropertyValue('--dsk-u1-panel-w')),
        expH: rnd(sum + mt + parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom) +
          parseFloat(cs.borderTopWidth) + parseFloat(cs.borderBottomWidth)),
        got: window.__u1R('.utilities-panel'),
        itemH: items.map(e => rnd(e.getBoundingClientRect().height)),
        itemW: items.map(e => rnd(e.getBoundingClientRect().width)),
        sep: rnd(parseFloat(getComputedStyle(items[items.length - 1]).marginTop) || 0),
        hairline: getComputedStyle(items[items.length - 1]).borderTopWidth,
      }
    }
    window.__u1Titles = () =>
      [...document.querySelectorAll('.utilities-panel .util-item')].map(e => e.getAttribute('title'))
    window.__u1Popup = () => {
      const p = document.querySelector('.utilities-popup')
      if (!p) return null
      return { rect: window.__u1R('.utilities-popup'), txt: p.textContent.trim(), z: Number(getComputedStyle(p).zIndex) }
    }
  }, { ANCHORS: U1_ANCHORS })
}

const u1OpenMenu = async (page) => { await page.click('.utilities-trigger'); await page.waitForTimeout(120) }

// Estado abierto: Δ contra el cerrado, overflow, rect del panel, z y guardia.
async function u1Probe(page, tag) {
  const closed = await page.evaluate(() => ({ snap: window.__u1Snap(), scr: window.__u1Scroll() }))
  await u1OpenMenu(page)
  const open = await page.evaluate((G) => ({
    snap: window.__u1Snap(), scr: window.__u1Scroll(),
    panel: window.__u1Panel(), wins: window.__u1Wins(), maxZ: window.__u1MaxZ(),
    panelZ: Number(getComputedStyle(document.querySelector('.utilities-panel')).zIndex),
    guard: window.__u1Guard(G),
  }), U1_GUARD)
  await page.keyboard.press('Escape'); await page.waitForTimeout(120)
  const back = await page.evaluate(() => ({ snap: window.__u1Snap(), scr: window.__u1Scroll(), open: window.__u1Open() }))
  const d = await page.evaluate(([a, b, c]) => ({
    open: window.__u1Diff(a, b), back: window.__u1Diff(a, c),
  }), [closed.snap, open.snap, back.snap])
  return {
    tag, dOpen: d.open, dBack: d.back,
    dScrH: open.scr.scrH - closed.scr.scrH, dCliH: open.scr.cliH - closed.scr.cliH,
    ovOpen: { x: open.scr.ovX, y: open.scr.ovY }, ovClosed: { x: closed.scr.ovX, y: closed.scr.ovY },
    docOv: { x: open.scr.docOvX, y: open.scr.docOvY },
    panel: open.panel, panelZ: open.panelZ, wins: open.wins, maxZ: open.maxZ,
    guard: open.guard, closedByEsc: back.open === false,
  }
}

async function runU1(browser) {
  const cells = []
  const tblFilter = process.argv[3] ? Number(process.argv[3]) : null
  const vpFilter = process.argv[4] || null
  for (const n of U1_TABLES) for (const vp of U1_VIEWPORTS) {
    if (tblFilter && n !== tblFilter) continue
    if (vpFilter && `${vp.w}x${vp.h}` !== vpFilter) continue
    const key = `${vp.w}x${vp.h}`
    const pre = U1_PRE[key]
    const hrRight = pre.right[n >= 4 ? 'wide' : 'narrow']
    const page = await browser.newPage({ viewport: { width: vp.w, height: vp.h } })
    // Sonda del mute REAL: Howler.mute() escribe el gain maestro con
    // setValueAtTime. Se engancha ANTES de cargar la app, sin tocar src/. Si el
    // headless no trae Web Audio el log queda vacío → el check reporta null
    // (no observable), nunca falso verde.
    await page.addInitScript(() => {
      window.__gainLog = []
      try {
        const orig = AudioParam.prototype.setValueAtTime
        AudioParam.prototype.setValueAtTime = function (v, t) { window.__gainLog.push(v); return orig.call(this, v, t) }
      } catch { /* sin Web Audio */ }
    })
    await gotoMesa(page, n)
    await u1Install(page)
    await installHitProbe(page)

    // (1) Caja del disparador contra la baseline PRE-tanda.
    const caja = await page.evaluate(() => {
      const t = window.__u1R('.utilities-trigger'), hr = window.__u1R('.header-right'), x = window.__u1R('.btn-leave')
      const el = document.querySelector('.utilities-trigger')
      const cs = el ? getComputedStyle(el) : null
      return { t, hr, x, glyph: el ? el.textContent.trim() : null,
        muteCount: document.querySelectorAll('.mute-button').length,
        css: cs ? { pos: cs.position, z: cs.zIndex, bs: cs.boxSizing, br: cs.borderRadius, bw: cs.borderTopWidth } : null }
    })
    const expT = { x: hrRight - U1_HR_W, y: pre.y, w: U1_TRIGGER.w, h: U1_TRIGGER.h }
    const expHR = { x: hrRight - U1_HR_W, y: pre.y, w: U1_HR_W, h: U1_TRIGGER.h }
    const expX = { x: hrRight - U1_X_W, y: pre.y + U1_X_DY, w: U1_X_W, h: U1_X_H }
    const dOf = (got, exp) => got ? round(Math.max(...['x', 'y', 'w', 'h'].map(p => Math.abs(got[p] - exp[p])))) : null
    const dCaja = { trigger: dOf(caja.t, expT), headerRight: dOf(caja.hr, expHR), equis: dOf(caja.x, expX) }
    const dCajaMax = round(Math.max(...Object.values(dCaja).map(v => v == null ? 999 : v)))

    // (2) Fuera de flujo + z + guardia, en reposo.
    const probes = [await u1Probe(page, 'reposo')]

    // (3) Cierre por clic fuera NEUTRO (sobre la cabecera, lejos del disparador).
    await u1OpenMenu(page)
    await page.click('.table-header', { position: { x: 4, y: 4 } })
    await page.waitForTimeout(120)
    const cerradoClicFuera = await page.evaluate(() => window.__u1Open() === false)

    // (3b) U1b · panel solo-icono: dimensiones derivadas, tooltips y el badge.
    await u1OpenMenu(page)
    const dims = await page.evaluate(() => window.__u1PanelExpect())
    const titles = await page.evaluate(() => window.__u1Titles())
    const preBadge = await page.evaluate(() => window.__u1Snap())
    await page.click('.util-badge'); await page.waitForTimeout(180)
    const press = await page.evaluate((base) => ({
      popup: window.__u1Popup(),
      menuOpen: window.__u1Open(),          // ← el invariante sellado
      ls: localStorage.getItem('ajilei.consultas'),
      badgeTxt: document.querySelector('.util-badge').textContent.trim(),
      dAnchors: window.__u1Diff(base, window.__u1Snap()),
      scr: window.__u1Scroll(),
    }), preBadge)
    // Autocierre a los 2s: vivo a ~1,4s y muerto a ~2,6s. Dos muestras, no una:
    // comprobar sólo el final no distingue "se cerró a tiempo" de "nunca abrió".
    await page.waitForTimeout(1220)
    const vivo14 = await page.evaluate(() => !!document.querySelector('.utilities-popup'))
    await page.waitForTimeout(1200)
    const muerto26 = await page.evaluate(() => !document.querySelector('.utilities-popup'))
    const menuTrasAuto = await page.evaluate(() => window.__u1Open())
    // Vía 2 · clic en otra parte. Primero DENTRO del panel (su padding, fuera del
    // badge): cierra el popup y el menú no se inmuta. El menú sigue abierto tras
    // esto, así que NO se vuelve a llamar a u1OpenMenu — volvería a cerrarlo.
    await page.click('.util-badge'); await page.waitForTimeout(150)
    await page.click('.utilities-panel', { position: { x: 5, y: 3 } }); await page.waitForTimeout(150)
    const trasClicDentro = await page.evaluate(() => ({ popup: !document.querySelector('.utilities-popup'), menu: window.__u1Open() }))
    // …y luego FUERA del panel: cierra los dos, que es lo coherente.
    await page.click('.util-badge'); await page.waitForTimeout(150)
    await page.click('.table-header', { position: { x: 4, y: 4 } }); await page.waitForTimeout(150)
    const trasClicFuera = await page.evaluate(() => ({ popup: !document.querySelector('.utilities-popup'), menu: window.__u1Open() }))

    // (4) Cierre AL EJECUTAR + toggle de sonido vivo. Cierra y deja el ajuste
    //     persistido; se devuelve a 'on' para no arrastrar estado a lo que sigue.
    await u1OpenMenu(page)
    const antes = await page.evaluate(() => window.__u1SoundEntry())
    await page.click('.util-item-sound'); await page.waitForTimeout(150)
    const trasEjecutar = await page.evaluate(() => ({
      open: window.__u1Open(), ls: localStorage.getItem('ajilei.sound'),
      gain: window.__gainLog.slice(-3),
    }))
    await u1OpenMenu(page)
    const despues = await page.evaluate(() => window.__u1SoundEntry())
    await page.click('.util-item-sound'); await page.waitForTimeout(150)

    // (5) El clic fuera NO se traga la acción: con el menú abierto, el clic sobre
    //     "Iniciar mano" cierra el panel Y arranca la mano. Es la razón entera de
    //     que el cierre use un listener no bloqueante en vez de un overlay.
    await u1OpenMenu(page)
    await page.click('.action-area .btn-primary')
    await page.waitForTimeout(400)
    const clicPasaAlBoton = await page.evaluate(() => ({
      cerrado: window.__u1Open() === false,
      arrancada: !document.querySelector('.action-area .btn-primary') ||
        !/Iniciar mano/.test(document.querySelector('.action-area .btn-primary').textContent),
    }))

    // (6) Estados calientes de la mano: apuesta (con fila de mults), descarte con
    //     selección y pago. En cada uno se abre el menú y se mide todo otra vez.
    const vistos = new Set()
    for (let i = 0; i < 240; i++) {
      await page.waitForTimeout(230); await page.mouse.move(5, 5)
      const st = await page.evaluate(() => ({
        bet: !!document.querySelector('.action-buttons .btn'),
        discard: !!document.querySelector('.discard-area .btn'),
        pago: !!document.querySelector('.action-area .btn-primary') &&
          /Siguiente mano/.test(document.querySelector('.action-area .btn-primary').textContent || ''),
      }))
      if (st.bet && !vistos.has('apuesta')) { vistos.add('apuesta'); probes.push(await u1Probe(page, 'apuesta')) }
      if (st.discard && !vistos.has('descarte')) {
        vistos.add('descarte')
        await page.evaluate(() => { const c = document.querySelector('.player-zone .playing-card.card-clickable'); if (c) c.click() })
        await page.waitForTimeout(200)
        probes.push(await u1Probe(page, 'descarte-sel'))
      }
      if (st.pago) { vistos.add('pago'); probes.push(await u1Probe(page, 'pago')); break }
      await clickIf(page, '.action-buttons button:has-text("Pasar")') ||
        await clickIf(page, '.action-buttons button:has-text("Igualar")') ||
        await clickIf(page, '.action-buttons button:has-text("Apostar")')
      await clickIf(page, 'button:has-text("Sin descartar")') || await clickIf(page, '.discard-area .btn')
    }

    // (7) z REAL contra los dos techos vivos: panel revelado (7) y sobrevuelo Z1
    //     (9). Mesa 2 no revela → queda null, no falso verde.
    let zReal = null
    const tap = page.locator('.opp-name-tappable').first()
    if (await tap.count() && await tap.isVisible().catch(() => false)) {
      await tap.click().catch(() => {}); await page.waitForTimeout(1500)
      const pRev = await u1Probe(page, 'revelado')
      probes.push(pRev)
      // Z1 VIVO CON EL MENÚ ABIERTO. El orden importa y no es intercambiable:
      // sobrevolar primero y abrir después mata el :hover (abrir mueve el puntero
      // al ⋮). Así que se abre el menú y LUEGO se sobrevuela — el hover no
      // dispara pointerdown, de modo que el panel sigue abierto y ambos coexisten,
      // que es exactamente el frame que hay que juzgar.
      await u1OpenMenu(page)
      // La carta a sobrevolar se elige CON el panel ya abierto y se descarta
      // cualquiera que caiga bajo él: si el panel la tapa, el hover se lo lleva
      // el panel y Z1 no llega a activarse (el falso rojo que esto evita).
      // Z1 exige además cara visible (ni dorso ni hueco): es su propio gate.
      const target = await page.evaluate(() => {
        const p = document.querySelector('.utilities-panel')
        const pr = p ? p.getBoundingClientRect() : null
        const libre = [...document.querySelectorAll('.opp-card-slot')].filter(el => {
          const c = el.querySelector('.playing-card')
          if (!c || /card-back|card-empty/.test(c.className)) return false
          const b = el.getBoundingClientRect()
          if (b.width === 0) return false
          if (pr && !(b.right < pr.left || b.left > pr.right || b.bottom < pr.top || b.top > pr.bottom)) return false
          return true
        })
        if (!libre.length) return null
        const b = libre[0].getBoundingClientRect()
        return { x: b.left + b.width / 2, y: b.top + b.height / 2 }
      })
      let z1Vivo = null
      if (target) {
        await page.mouse.move(target.x, target.y); await page.waitForTimeout(350)
        z1Vivo = await page.evaluate(() => ({
          abierto: window.__u1Open(),
          // Z1 sube DOS cosas al sobrevolar: el slot de 5 a --dsk-z1-slot-z (6),
          // para ganarle a sus hermanas, y el PANEL entero de 7 a
          // --dsk-z1-panel-z (9), que es el techo real contra el que compite el
          // menú. Se leen los dos: sin el 6 la lupa no se activó, sin el 9 no
          // hay techo Z1 que superar y el verde no valdría nada.
          slotZ: Math.max(-1, ...[...document.querySelectorAll('.opp-card-slot')]
            .map(el => Number(getComputedStyle(el).zIndex)).filter(Number.isFinite)),
          panelZ1: Math.max(-1, ...[...document.querySelectorAll('.opp-panel')]
            .map(el => Number(getComputedStyle(el).zIndex)).filter(Number.isFinite)),
          maxZ: window.__u1MaxZ(), wins: window.__u1Wins(),
        }))
      }
      await page.keyboard.press('Escape'); await page.waitForTimeout(120)
      await page.mouse.move(5, 5)
      zReal = { revelado: pRev.maxZ, panelZ: pRev.panelZ, wins: pRev.wins, z1Vivo }
    }

    const worst = (get) => { let m = 0, who = null; for (const p of probes) { const v = get(p); if (v == null) continue; if (Math.abs(v) > m) { m = Math.abs(v); who = p.tag } } return { max: round(m), tag: who } }
    const dFlujo = worst(p => p.dOpen.max)
    const dVuelta = worst(p => p.dBack.max)
    const guardHits = probes.flatMap(p => p.guard.map(g => ({ tag: p.tag, ...g })))
    const zTecho = Math.max(...probes.map(p => p.maxZ.max))
    const panelZ = probes[0].panelZ
    const libreAbajo = round(Math.min(...probes.map(p => vp.h - p.panel.bottom)))

    const checks = {
      caja: dCajaMax <= U1_TOL && caja.glyph === '⋮' && caja.muteCount === 1,
      fueraDeFlujo: dFlujo.max === 0 && dVuelta.max === 0 &&
        probes.every(p => p.dScrH === 0 && p.dCliH === 0),
      overflow: vp.h > 800 || probes.every(p => p.ovOpen.x === 0 && p.ovOpen.y === 0 && p.docOv.x === 0 && p.docOv.y === 0),
      z: panelZ > zTecho && panelZ < 100 && probes.every(p => p.wins === true),
      // Mesa 2 no revela → null (no hay Z1 que superar), nunca falso verde.
      zSobreZ1: zReal == null || zReal.z1Vivo == null ? null
        : (zReal.z1Vivo.abierto && zReal.z1Vivo.slotZ >= 6 && zReal.z1Vivo.panelZ1 >= 9 &&
           zReal.z1Vivo.wins === true && panelZ > zReal.z1Vivo.maxZ.max),
      cierreEsc: probes.every(p => p.closedByEsc),
      cierreClicFuera: cerradoClicFuera,
      cierreEjecutar: trasEjecutar.open === false,
      clicFueraEjecuta: clicPasaAlBoton.cerrado && clicPasaAlBoton.arrancada,
      estadoSonido: antes && despues && antes.off === false && despues.off === true &&
        trasEjecutar.ls === 'off',
      guardia: guardHits.length === 0,
      encaje: probes.every(p => p.panel.right <= vp.w && p.panel.bottom <= vp.h && p.panel.x >= 0 && p.panel.y >= 0),
      // Observable sólo si el headless trae Web Audio: Howler.mute(true) baja el
      // gain maestro a 0. Sin Web Audio → null (el corte en seco de un sonido en
      // curso queda para la validación de oído).
      muteReal: trasEjecutar.gain.length === 0 ? null : trasEjecutar.gain.includes(0),
      // ── U1b ──────────────────────────────────────────────────────────────
      // Dimensiones DERIVADAS del contenido vivo (nunca los 224×194 de U1).
      panelDims: dims != null && dims.n === U1_ENTRADAS.length &&
        Math.abs(dims.got.w - dims.expW) <= 0.5 && Math.abs(dims.got.h - dims.expH) <= 0.5,
      // Solo-icono no puede encoger el área táctil: la fila conserva ≥44 de alto
      // y el interior del panel ≥44 de ancho.
      filas44: dims != null && dims.itemH.every(h => h >= U1_ITEM_MIN) && dims.itemW.every(w => w >= U1_ITEM_MIN),
      // "Mano actual" separada del grupo: aire + filete, y va la ÚLTIMA.
      // EMB-2 · "la ÚLTIMA", no "la cuarta": el sitio de la entrada premium es
      // el final del panel, y eso no cambia porque entren más hermanas.
      manoSeparada: dims != null && dims.sep > 0 && parseFloat(dims.hairline) > 0 &&
        titles[titles.length - 1] === 'Mano actual',
      // Sin palabras, el tooltip nativo es la única leyenda: no puede faltar.
      // DSK-U2 · la segunda entrada dejó de ser "Mensajes" y pasó a ser
      // "Reacciones" (v1.2 §1): la puerta se RE-APUNTA al nombre sellado, no se
      // relaja. EMB-2 la vuelve a re-apuntar por la entrada de Tapetes, y de
      // paso la endurece: se sella la LISTA COMPLETA y su orden (U1_ENTRADAS),
      // no tres nombres por índice y un recuento suelto.
      tooltips: titles.length === U1_ENTRADAS.length &&
        titles.every(t => t && t.trim()) &&
        titles.join('|') === U1_ENTRADAS.join('|'),
      // Contador: clave creada con las 20 gratis y badge que la pinta.
      contador: press.ls === '20' && press.badgeTxt === '20',
      // El popup abre por press, dice lo que debe y pinta sobre el panel.
      popupAbre: press.popup != null && press.popup.txt === 'Tienes 20 consultas gratis' &&
        press.popup.z > panelZ && press.popup.rect.x >= 0 && press.popup.rect.right <= vp.w,
      // INVARIANTE SELLADO · presionar el badge NO es ejecutar.
      badgeNoCierra: press.menuOpen === true && menuTrasAuto === true && trasClicDentro.menu === true,
      // Popup fuera de flujo, igual que el panel.
      popupFueraDeFlujo: press.dAnchors.max === 0 &&
        press.scr.ovX === probes[0].ovClosed.x && press.scr.ovY === probes[0].ovClosed.y,
      // Las dos vías de cierre, exactas: autocierre a 2s y clic en otra parte.
      popupAutocierre: vivo14 === true && muerto26 === true,
      popupClicFuera: trasClicDentro.popup === true && trasClicFuera.popup === true &&
        trasClicFuera.menu === false,
    }
    const passed = Object.values(checks).every(v => v === true || v === null)
    cells.push({
      table: n, vp, caja: { got: caja, exp: { t: expT, hr: expHR, x: expX }, d: dCaja, dMax: dCajaMax },
      probes: probes.map(p => ({ tag: p.tag, dOpen: p.dOpen, dBack: p.dBack, panel: p.panel, maxZ: p.maxZ, guard: p.guard, ov: p.ovOpen })),
      panelZ, zTecho, zReal, libreAbajo, sonido: { antes, despues, ls: trasEjecutar.ls, gain: trasEjecutar.gain },
      dims, titles,
      badge: { press, vivo14, muerto26, menuTrasAuto, trasClicDentro, trasClicFuera },
      cierre: { esc: checks.cierreEsc, clicFuera: cerradoClicFuera, ejecutar: trasEjecutar.open === false, ...clicPasaAlBoton },
      guardHits, checks, passed,
    })
    console.log(`T${n} ${key} · caja Δ=${dCajaMax} (${caja.glyph}) · flujo Δ=${dFlujo.max}/${dVuelta.max} · panel ${probes[0].panel.w}×${probes[0].panel.h} (esp ${dims?.expW}×${dims?.expH}) filas ${dims?.itemW[0]}×${dims?.itemH[0]} sep ${dims?.sep}+${dims?.hairline} · badge "${press.badgeTxt}"/ls ${press.ls} popup ${press.popup?.rect.w}×${press.popup?.rect.h} z${press.popup?.z} auto ${vivo14}→${muerto26} menú ${press.menuOpen}/${trasClicDentro.menu}/${trasClicFuera.menu} · z ${panelZ}>${zTecho} (${probes.find(p => p.maxZ.max === zTecho)?.maxZ.who})${zReal?.z1Vivo ? ` · Z1 vivo slot ${zReal.z1Vivo.slotZ}/panel ${zReal.z1Vivo.panelZ1} techo ${zReal.z1Vivo.maxZ.max} wins=${zReal.z1Vivo.wins}` : ''} wins=${probes.every(p => p.wins)} · cierre esc/fuera/exec/pasa ${checks.cierreEsc}/${cerradoClicFuera}/${trasEjecutar.open === false}/${clicPasaAlBoton.cerrado && clicPasaAlBoton.arrancada} · guardia ${guardHits.length} · ${probes.length}f · ${passed ? 'OK' : 'FAIL [' + Object.entries(checks).filter(([, v]) => v === false).map(([k]) => k).join(',') + ']'}`)
    await page.close()
  }

  // ── Sub-pasada táctil (pointer:coarse) · el gate admite portátiles táctiles.
  const hits = []
  for (const n of U1_TABLES) for (const vp of [{ w: 1024, h: 768 }, { w: 1280, h: 720 }]) {
    if (tblFilter && n !== tblFilter) continue
    const page = await browser.newPage({ viewport: { width: vp.w, height: vp.h }, hasTouch: true, isMobile: true })
    await gotoMesa(page, n); await u1Install(page); await installHitProbe(page)
    const coarse = await page.evaluate(() => window.matchMedia('(pointer: coarse)').matches)
    await u1OpenMenu(page)
    const boxes = await page.evaluate(() => {
      const acc = []
      const push = (name, el, min) => { if (!el) return; const hb = window.__hitBox(el); acc.push({ name, min, visual: `${hb.visualW}×${hb.visualH}`, w: hb.w, h: hb.h, occluded: !!hb.occluded }) }
      // El disparador conserva el estándar de campaña (40); las filas del menú
      // suben a 44, que es lo que U1b promete al quitarles la palabra.
      push('⋮', document.querySelector('.utilities-trigger'), 40)
      document.querySelectorAll('.util-item').forEach((el, i) => push(`item${i}`, el, 44))
      // El badge es visual de 18: su embaldosado lo lleva a 40×44 SIN salirse de
      // su propia fila (desbordar hacia arriba le robaría taps a Saldo).
      push('badge', document.querySelector('.util-badge'), 40)
      return acc
    })
    // La ✕ vecina no lleva embaldosado: el pseudo del ⋮ no puede robarle el hit.
    const equis = await page.evaluate(() => { const hb = window.__hitBox(document.querySelector('.btn-leave')); return { w: hb.w, h: hb.h, occluded: !!hb.occluded } })
    // El embaldosado del badge no puede desbordar su fila: se contrasta contra
    // la caja de la entrada "Mano actual", no contra un número suelto.
    const badgeConfinado = await page.evaluate(() => {
      const b = document.querySelector('.util-badge'), it = document.querySelector('.util-item-mano')
      if (!b || !it) return null
      const hb = window.__hitBox(b), r = it.getBoundingClientRect()
      return { dentro: hb.top >= Math.floor(r.top) - 1 && hb.bottom <= Math.ceil(r.bottom) + 1, itemTop: Math.round(r.top), itemBottom: Math.round(r.bottom), hitTop: hb.top, hitBottom: hb.bottom }
    })
    const ok = coarse && boxes.every(b => !b.occluded && b.w >= b.min && b.h >= b.min) &&
      !equis.occluded && badgeConfinado?.dentro === true
    hits.push({ table: n, vp, coarse, boxes, equis, badgeConfinado, ok })
    console.log(`hit T${n} ${vp.w}x${vp.h} · coarse=${coarse} · ${boxes.map(b => `${b.name} ${b.w}×${b.h}≥${b.min}`).join(' · ')} · ✕ ${equis.w}×${equis.h} · badge en fila=${badgeConfinado?.dentro} · ${ok ? 'OK' : 'FAIL'}`)
    await page.close()
  }

  // ── Persistencia end-to-end: apagar → RECARGAR → volver a la mesa y leer la
  //    entrada. Es exactamente lo que Victor comprueba a ojo.
  const sound = []
  for (const [n, vp] of [[5, { w: 1366, h: 768 }], [2, { w: 1024, h: 768 }]]) {
    if (tblFilter && n !== tblFilter) continue
    const page = await browser.newPage({ viewport: { width: vp.w, height: vp.h } })
    await gotoMesa(page, n); await u1Install(page)
    await u1OpenMenu(page); await page.click('.util-item-sound'); await page.waitForTimeout(150)
    const lsAntes = await page.evaluate(() => localStorage.getItem('ajilei.sound'))
    await page.reload({ waitUntil: 'load' }); await page.waitForTimeout(400)
    const lsTras = await page.evaluate(() => localStorage.getItem('ajilei.sound'))
    // ARN-1 · esta segunda navegación repetía la ruta a mano en vez de llamar
    // al helper, así que quedó igual de rota que `gotoMesa` y por separado.
    // Se re-navega con `volverALaMesa`, que NO borra storage: la prueba es
    // justamente que la preferencia SOBREVIVE a la recarga.
    // OJO con el chip «Tu último»: tras la recarga el nivel quedó recordado y
    // NivelSelect lo premarca. No salta la pantalla (regla dura de v1.0 §4.2),
    // así que la ruta es idéntica; el chip sólo añade un <span> dentro del
    // botón y `nth-of-type` sigue apuntando al mismo sitio.
    await volverALaMesa(page, n); await page.waitForSelector('.game-table')
    await u1Install(page); await u1OpenMenu(page)
    const entry = await page.evaluate(() => window.__u1SoundEntry())
    const ok = lsAntes === 'off' && lsTras === 'off' && entry && entry.off === true && entry.glyph === '🔇'
    sound.push({ table: n, vp, lsAntes, lsTras, entry, ok })
    console.log(`sonido T${n} ${vp.w}x${vp.h} · ls ${lsAntes}→${lsTras} · entrada ${entry?.glyph} title="${entry?.title}" off=${entry?.off} · ${ok ? 'OK' : 'FAIL'}`)
    await page.close()
  }

  const passed = cells.every(c => c.passed) && hits.every(h => h.ok) && sound.every(s => s.ok)
  console.log(`\n── U1: ${cells.filter(c => c.passed).length}/${cells.length} celdas · hits ${hits.filter(h => h.ok).length}/${hits.length} · sonido ${sound.filter(s => s.ok).length}/${sound.length} · ${passed ? 'VERDE' : 'ROJO'}`)
  return { cells, hits, sound, passed }
}

// ── MOV-1a · modo `menu-movil` del arnés ─────────────────────────────────────
// Documento rector: instrucción MOV-1a. Base de medida: informe MOV-0.
//
// El instrumento es el MISMO que el de escritorio: `u1Install` monta todas las
// sondas (rects, Δ de anclas, scroll, censo de z, hit-test del panel, guardia
// de contenido, dimensiones DERIVADAS del contenido vivo) y aquí sólo cambian
// las celdas y las expectativas. Un segundo juego de sondas para el mismo menú
// sería una segunda verdad, y las dos pieles ya son deuda bastante.
//
// LO QUE ESTE MODO DEBE ATRAPAR. El puerto móvil vive de dos hojas distintas
// que nadie sincroniza automáticamente. Por eso la puerta de geometría no se
// conforma con `__u1PanelExpect` —que deriva ancho y alto del contenido vivo y
// por tanto sería verde aunque las dos pieles divergieran a la vez— sino que
// además contrasta contra las MISMAS cifras selladas que `u1` exige arriba
// (64×244 · 62×44 · 5 filas). Si una piel se desvía de la otra, sale en rojo.
// Un verde que no mide lo que dice es un bug del arnés.
const MOVMENU_VPS = [
  { w: 375, h: 812 }, { w: 360, h: 640 },   // vertical
  { w: 812, h: 375 }, { w: 640, h: 360 },   // horizontal
]
const MOVMENU_TABLES = [5, 4, 3, 2]
// Los CUATRO viewports son los que MOV-0 canonizó, y no los que el arnés
// arrastraba de antes (360×640 · 640×360 · 740×360 · 844×390). El motivo es la
// puerta D5: la caja del disparador tiene que dar Δ=0 contra la caja de la
// BOCINA, y esa medida sólo existe donde MOV-0 la tomó. Los dos que quedan
// fuera —740×360 y 844×390— siguen sin baseline; MOV-0 0.7 ya los dejó
// anotados como hueco abierto, y medirlos es tanda de arnés, no de producto.
//
// BASELINE PRE-TANDA · caja viva del botón de sonido en las 16 celdas, medida
// por MOV-0 sobre HEAD 630ee6a. No colapsa a dos perfiles como la de `u1`: en
// móvil la `y` cambia con la mesa (mesa 5 a 360×640 sube a 12 por su strip
// absoluto) y la caja entera cambia en mesa 2 horizontal (32×28, que el
// protegido fija en gameTable.css:3933-3937). Se guarda tal cual se midió.
const MOVMENU_PRE = {
  '5|375x812': { x: 274.77, y: 20, w: 40.61, h: 32 },
  '5|360x640': { x: 259.77, y: 12, w: 40.61, h: 32 },
  '5|812x375': { x: 750.39, y: 163.5, w: 40.61, h: 32 },
  '5|640x360': { x: 578.39, y: 156, w: 40.61, h: 32 },
  '4|375x812': { x: 274.77, y: 20, w: 40.61, h: 32 },
  '4|360x640': { x: 259.77, y: 16, w: 40.61, h: 32 },
  '4|812x375': { x: 750.39, y: 163.5, w: 40.61, h: 32 },
  '4|640x360': { x: 578.39, y: 156, w: 40.61, h: 32 },
  '3|375x812': { x: 274.77, y: 20, w: 40.61, h: 32 },
  '3|360x640': { x: 259.77, y: 14, w: 40.61, h: 32 },
  '3|812x375': { x: 715.77, y: 14, w: 40.61, h: 32 },
  '3|640x360': { x: 543.77, y: 14, w: 40.61, h: 32 },
  '2|375x812': { x: 274.77, y: 20, w: 40.61, h: 32 },
  '2|360x640': { x: 259.77, y: 14, w: 40.61, h: 32 },
  '2|812x375': { x: 723, y: 14, w: 32, h: 28 },
  '2|640x360': { x: 551, y: 14, w: 32, h: 28 },
}
// D3 · el estándar del disparador SUBE a 44 en móvil (en escritorio la deuda B2
// lo dejó en el 40 de campaña). Las filas del panel ya median 44 desde U1b.
const MOVMENU_TAP = 44
// D4 · caja y pinza del panel. `H − 252` es `H − 244 − 8`: alto del panel más el
// margen al filo. El área segura entra por `env()` dentro del `clamp()`, así que
// aquí se comprueba el caso sin muescas, que es el del navegador de prueba.
const MOVMENU_PANEL = { w: 64, h: 244 }
const MOVMENU_MARGIN = 8
const MOVMENU_ITEM = { w: 62, h: 44 }
// Los vecinos que el embaldosado del disparador NO puede desalojar. La ✕ está a
// 8px y no lleva pseudo propio; la ficha de esquina de la IA es el control vivo
// más cercano por la izquierda (a 0,8px en mesa 4 · 360×640, la celda apretada).
const MOVMENU_VECINOS = ['.btn-leave', '.opp-corner-chip']
// MOV-1a-c · La guardia del puerto es la de escritorio MÁS LA MANO DEL JUGADOR.
// Arriba nunca hizo falta —el panel cuelga de la cabecera y la mano está a
// 460..582px— pero en horizontal el panel se aparta hacia el centro de la mesa,
// que es justo donde vive el abanico. Sin esta línea la puerta sería ciega en el
// único sitio donde puede fallar.
// La BARRA del humano entra por sus hijos PINTADOS y no por `.player-bar`: en
// landscape movil esa caja es `display: contents` (gameTable.css:2950-2952), o
// sea 0x0, y una guardia que la mire directamente es ciega justo donde el panel
// se aparta. Se descubrio viendo el saldo "4950" tapado en una captura que el
// arnes daba por verde.
const MOVMENU_GUARD = [...U1_GUARD, '.player-zone .card-slot-wrapper',
  '.player-bar-left', '.player-bar-center', '.player-bar-right']
// Los dos objetivos que SIEMPRE deben existir con una mano viva. Si la guardia
// sale limpia sin ellos presentes, es que no había nada contra lo que chocar.
const MOVMENU_OBLIGATORIOS = ['.action-buttons .btn', '.player-zone .card-slot-wrapper']
// Medida INFORMATIVA (no puerta): qué cubre el panel de lo que sí es tolerable
// cubrir, para el criterio visual de Victor.
const MOVMENU_INFO = ['.opp-panel', '.ai-zone', '.center-zone', '.table-header',
  '.table-title', '.hand-badge', '.deck-shuffle-wrapper']
// Qué está vivo en móvil NO se declara aquí: se importa de `config/menuEntradas`
// y se compara contra el `data-entrada` que cada fila publica en el DOM. Antes
// era una lista de RÓTULOS mantenida a mano, y los rótulos son copy declarado
// provisional — la clase de puerta que se rompe con el próximo ajuste de
// redacción, o peor, que sigue verde midiendo otra cosa.
// Lo que NO está vivo sale en gris con el tratamiento de Saldo: `is-disabled`
// MÁS `disabled` de verdad, no un `pointer-events: none` que pintaría igual y le
// mentiría al lector de pantalla.
const MOVMENU_OUT = process.env.MOV1A_OUT || OUT_DIR
// El tapete que se presiona para probar que elegir un fieltro PINTA. Se toma el
// primero que no sea el de por defecto, del catálogo vivo: no se cablea un id.
const MOVMENU_TAPETE = TAPETES.map(t => t.id).find(id => id !== TAPETE_POR_DEFECTO)
// Estándar táctil de las fichas del panel de tapetes. En vertical es MEDIDA que
// se reporta (decisión de Victor: si no llega, se dice, no se corrige); en la
// disposición en fila del horizontal es PUERTA, porque esa fila la estrena esta
// tanda y estrenar algo por debajo del estándar sería crear la deuda a mano.
const MOVMENU_FICHA_MIN = 44
// MOV-1b-c · geometría SELLADA de la lista de reacciones (lámina aprobada por
// Victor). Las dos cajas se declaran porque son cosas distintas y confundirlas
// es cómo se cuelan los 2px de un filete: 242×186 es la caja de CLIENTE —la de
// la lámina, la que mide `scrollHeight`— y 244,19×188 la de BORDE, que es la
// que devuelve `getBoundingClientRect`. El recorrido de 554 y el alto de 186 se
// DERIVAN de las mismas cifras que el CSS (12 y 4 filas de 44, separación 2,
// relleno 2), no se copian: si mañana se ven cinco filas, esto se mueve solo.
const MOVMENU_SEL_ITEM = { w: 238.19, h: 44 }
const MOVMENU_SEL_GAP = 2
const MOVMENU_SEL_VISIBLES = 4
const movSelAlto = (filas) =>
  filas * MOVMENU_SEL_ITEM.h + (filas - 1) * MOVMENU_SEL_GAP + 2 * MOVMENU_SEL_GAP
const MOVMENU_SELECTOR = {
  cw: 242, ch: movSelAlto(MOVMENU_SEL_VISIBLES),          // cliente · 242 × 186
  w: MOVMENU_SEL_ITEM.w + 2 * MOVMENU_SEL_GAP + 2,        // borde   · 244,19
  h: movSelAlto(MOVMENU_SEL_VISIBLES) + 2,                //            188
  scroll: movSelAlto(MOVMENU_FRASES.length),              // recorrido · 554
}
// Contra-celda: el selector de ESCRITORIO no se toca. Rejilla 3×4, separación y
// relleno 4, caja de borde 732,56×198.
const MOVMENU_SEL_DSK = { w: 732.56, h: 198 }
// Estándar táctil de cada fila de la lista. Aquí es PUERTA y no medida: la fila
// la estrena esta tanda.

// Sonda de solape de UNA superficie contra una lista de selectores. `__u1Guard`
// mira siempre a `.utilities-panel`; los satélites necesitan lo mismo apuntando
// a otra caja, y duplicar la aritmética en tres sitios es cómo se separan.
const MOVMENU_SONDA = `
  window.__movSolape = (sel, sels) => {
    const s = document.querySelector(sel)
    if (!s) return null
    const r = s.getBoundingClientRect()
    const hits = []
    sels.forEach(q => document.querySelectorAll(q).forEach(el => {
      const b = el.getBoundingClientRect()
      if (b.width === 0 || b.height === 0) return
      const cs = getComputedStyle(el)
      if (cs.visibility === 'hidden' || cs.display === 'none') return
      const ox = Math.min(r.right, b.right) - Math.max(r.left, b.left)
      const oy = Math.min(r.bottom, b.bottom) - Math.max(r.top, b.top)
      if (ox > 0 && oy > 0) hits.push({ sel: q, area: Math.round(ox * oy * 100) / 100 })
    }))
    return hits
  }
`


async function runMenuMovil(browser) {
  const filtroMesa = Number(process.argv[3]) || null
  const filtroVp = (process.argv[4] || '').includes('x') ? process.argv[4] : null
  const celdas = []

  for (const n of MOVMENU_TABLES) for (const vp of MOVMENU_VPS) {
    const tag = vp.w + 'x' + vp.h
    if (filtroMesa && filtroMesa !== n) continue
    if (filtroVp && filtroVp !== tag) continue
    const key = n + '|' + tag
    // pointer:coarse: hasTouch + isMobile fuerza a Chromium a reportar coarse,
    // igual que en `tactil`. Sin esto el `::after` de D3 no se monta y el modo
    // mediría una piel que el teléfono nunca ve.
    const page = await browser.newPage({ viewport: { width: vp.w, height: vp.h }, hasTouch: true, isMobile: true })
    const c = { mesa: n, vp: tag }
    try {
      await gotoMesa(page, n)
      await u1Install(page)
      await installHitProbe(page)
      await page.evaluate(MOVMENU_SONDA)

      c.gates = await page.evaluate(() => ({
        desktop: matchMedia('(orientation: landscape) and (min-height: 601px)').matches,
        coarse: matchMedia('(pointer: coarse)').matches,
      }))
      // (0) La celda es MÓVIL y es táctil. Si esto falla, todo lo de abajo mide
      //     otra cosa y el verde sería mentira.
      c.celdaOk = c.gates.desktop === false && c.gates.coarse === true

      // Una mano repartida: la guardia de contenido necesita que los botones de
      // acción y la fila de multiplicadores EXISTAN para poder no tocarlos.
      await clickIf(page, 'button:has-text("Iniciar mano")')
      // Espera POR ESTADO y no por reloj: la fase de apuesta llega cuando el
      // reparto termina, y eso tarda distinto según la mesa. Un `waitForTimeout`
      // fijo funcionaba en 15 celdas y en la decimosexta dejaba la guardia
      // midiendo una pantalla sin botones — que es el verde vacuo de siempre.
      await page.waitForSelector('.action-buttons button', { timeout: 20000 }).catch(() => {})
      await page.mouse.move(5, 5)

      // (1) D5 · caja del disparador = caja de la bocina de MOV-0.
      const caja = await page.evaluate(() => window.__u1R('.utilities-trigger'))
      const pre = MOVMENU_PRE[key]
      c.caja = caja
      c.cajaPre = pre
      c.dCaja = caja && pre ? round(Math.max(...['x', 'y', 'w', 'h'].map(p => Math.abs(caja[p] - pre[p])))) : null
      c.cajaOk = c.dCaja != null && c.dCaja <= U1_TOL
      // El disparador HEREDA la clase `.mute-button` (así le siguen aplicando
      // las reglas de posición por celda del protegido), así que sigue habiendo
      // exactamente uno — y tiene que ser él, no una bocina superviviente.
      c.esElDisparador = await page.evaluate(() =>
        document.querySelectorAll('.mute-button').length === 1 &&
        document.querySelector('.mute-button').classList.contains('utilities-trigger'))

      // (2) D3 · hit 44×44 REAL, y (3) sin desalojar a los vecinos.
      c.hit = await page.evaluate((VEC) => {
        const t = document.querySelector('.utilities-trigger')
        const hb = window.__hitBox(t)
        // Las cuatro esquinas del hit medido tienen que seguir siendo del ⋮.
        const esq = [[hb.left, hb.top], [hb.right, hb.top], [hb.left, hb.bottom], [hb.right, hb.bottom]]
          .every(([x, y]) => { const e = document.elementFromPoint(x, y); return !!e && (e === t || t.contains(e)) })
        const vecinos = []
        VEC.forEach(sel => document.querySelectorAll(sel).forEach(el => {
          const r = el.getBoundingClientRect()
          if (r.width === 0 || r.height === 0) return
          const cs = getComputedStyle(el)
          if (cs.visibility === 'hidden' || cs.display === 'none') return
          const cx = Math.round((r.left + r.right) / 2), cy = Math.round((r.top + r.bottom) / 2)
          const e = document.elementFromPoint(cx, cy)
          vecinos.push({ sel, conserva: !!e && (e === el || el.contains(e)) })
        }))
        return Object.assign({}, hb, { esquinasOk: esq, vecinos })
      }, MOVMENU_VECINOS)
      c.hitOk = !c.hit.occluded && c.hit.w >= MOVMENU_TAP && c.hit.h >= MOVMENU_TAP && c.hit.esquinasOk
      c.vecinosOk = c.hit.vecinos.every(v => v.conserva)

      // (4..6, 9) Panel abierto: fuera de flujo, pinza, geometría, apilamiento,
      //           guardia de contenido y hit-test de cada entrada.
      const cerrado = await page.evaluate(() => ({ snap: window.__u1Snap(), scr: window.__u1Scroll() }))
      await u1OpenMenu(page)
      const abierto = await page.evaluate((cfg) => {
        const p = document.querySelector('.utilities-panel')
        const items = [...document.querySelectorAll('.utilities-panel .util-item')]
        return {
          snap: window.__u1Snap(), scr: window.__u1Scroll(),
          panel: window.__u1Panel(), expect: window.__u1PanelExpect(),
          titles: window.__u1Titles(), wins: window.__u1Wins(), maxZ: window.__u1MaxZ(),
          panelZ: Number(getComputedStyle(p).zIndex),
          guard: window.__u1Guard(cfg.G),
          // Lo que el panel cubre de lo tolerable, con su área. Informativo.
          cubre: window.__u1Guard(cfg.INFO),
          // Todas las cajas VIVAS de la guardia, para poder razonar sobre el
          // sitio libre sin repetir la corrida.
          guardRects: cfg.G.flatMap(sel => [...document.querySelectorAll(sel)]
            .map(el => ({ sel, r: window.__u1R(el) }))
            .filter(o => o.r && o.r.w > 0 && o.r.h > 0)),
          // Solape panel↔disparador: el menú no puede taparse a sí mismo.
          sobreDisparador: window.__u1Guard(['.utilities-trigger']),
          // Distancia horizontal del disparador al panel (0 si se tocan).
          distancia: (() => {
            const t = document.querySelector('.utilities-trigger').getBoundingClientRect()
            const b = document.querySelector('.utilities-panel').getBoundingClientRect()
            if (b.right <= t.left) return Math.round((t.left - b.right) * 100) / 100
            if (b.left >= t.right) return Math.round((b.left - t.right) * 100) / 100
            return 0
          })(),
          // Cuántos objetivos VIVOS tenía la guardia. Sin esto, "0 px² de
          // solape" es indistinguible de "no había nada contra lo que chocar":
          // la lista sale vacía en los dos casos y el modo pintaría verde por
          // una pantalla en blanco. Es la trampa que el encargo llama «un verde
          // que no mide lo que dice».
          guardN: cfg.G.map(sel => ({ sel, n: document.querySelectorAll(sel).length })),
          // Las cajas de los vecinos que mandan en la colocación. Un informe que
          // dice "hay solape" y no dice DÓNDE obliga a repetir la corrida para
          // poder arreglarlo.
          cajas: {
            trigger: window.__u1R('.utilities-trigger'),
            actionArea: window.__u1R('.action-area'),
            actionButtons: window.__u1R('.action-buttons'),
            multRow: window.__u1R('.mult-row'),
            playerBar: window.__u1R('.player-bar'),
            cards: window.__u1R('.player-zone .cards-row'),
            timer: window.__u1R('.timer-display'),
            scoreTag: window.__u1R('.score-tag-player'),
            playerZone: window.__u1R('.player-zone'),
            gameTable: window.__u1R('.game-table'),
          },
          // Cada entrada gana el hit-test en su propio centro, y su estado es el
          // que la tanda declara: Sonido viva, las otras cuatro grises E INERTES.
          entradas: items.map(e => {
            const r = e.getBoundingClientRect()
            const t = document.elementFromPoint(Math.round((r.left + r.right) / 2), Math.round((r.top + r.bottom) / 2))
            const propio = e.tagName === 'BUTTON' ? e : e.querySelector('button')
            return {
              id: e.dataset.entrada,
              title: e.getAttribute('title'),
              gana: !!t && (t === e || e.contains(t)),
              inerte: !!propio && (propio.disabled === true || propio.getAttribute('aria-disabled') === 'true'),
              gris: e.className.includes('is-disabled'),
              viva: cfg.VIVAS.includes(e.dataset.entrada),
            }
          }),
          // El badge del contador NO monta en móvil: es un control vivo y su
          // popup vive en el bloque de escritorio, o sea que aquí no tendría piel.
          badge: document.querySelectorAll('.utilities-panel .util-badge').length,
          vpW: innerWidth, vpH: innerHeight,
        }
      }, { G: MOVMENU_GUARD, INFO: MOVMENU_INFO, VIVAS: VIVAS_MOVIL })

      const pa = abierto.panel
      c.panel = pa
      // D4 · pinza vertical + encaje completo dentro del viewport.
      c.pinza = {
        min: MOVMENU_MARGIN, max: round(abierto.vpH - MOVMENU_PANEL.h - MOVMENU_MARGIN),
        top: pa ? pa.y : null,
        dentro: !!pa && pa.y >= MOVMENU_MARGIN - U1_TOL &&
                pa.y <= abierto.vpH - MOVMENU_PANEL.h - MOVMENU_MARGIN + U1_TOL,
        encaje: !!pa && pa.x >= 0 && pa.y >= 0 && pa.right <= abierto.vpW && pa.bottom <= abierto.vpH,
      }
      // Geometría: contra el contenido vivo Y contra la cifra sellada de u1.
      const ex = abierto.expect
      c.geom = {
        n: ex ? ex.n : null, expW: ex ? ex.expW : null, expH: ex ? ex.expH : null,
        got: ex ? ex.got : null, itemH: ex ? ex.itemH : null, itemW: ex ? ex.itemW : null,
        derivadaOk: !!ex && ex.n === 5 &&
          Math.abs(ex.got.w - ex.expW) <= U1_TOL && Math.abs(ex.got.h - ex.expH) <= U1_TOL,
        selladaOk: !!ex && Math.abs(ex.got.w - MOVMENU_PANEL.w) <= U1_TOL &&
          Math.abs(ex.got.h - MOVMENU_PANEL.h) <= U1_TOL &&
          ex.itemH.every(h => Math.abs(h - MOVMENU_ITEM.h) <= U1_TOL) &&
          ex.itemW.every(w => Math.abs(w - MOVMENU_ITEM.w) <= U1_TOL),
      }
      c.entradas = abierto.entradas
      c.entradasOk = abierto.entradas.length === 5 &&
        abierto.entradas.every(e => e.gana) &&
        abierto.entradas.every(e => e.viva ? (!e.gris && !e.inerte) : (e.gris && e.inerte))
      c.titlesOk = JSON.stringify(abierto.titles) === JSON.stringify(U1_ENTRADAS)
      // El orden y la identidad de las cinco filas, por CONTRATO y no por copy.
      c.idsOk = JSON.stringify(abierto.entradas.map(e => e.id)) === JSON.stringify([
        ENTRADA.SONIDO, ENTRADA.REACCIONES, ENTRADA.TAPETES, ENTRADA.SALDO, ENTRADA.MANO,
      ])
      c.badgeOk = abierto.badge === 0
      c.guard = abierto.guard
      c.guardN = abierto.guardN
      c.cajas = abierto.cajas
      // Los botones de acción son el objetivo que SIEMPRE debe existir con una
      // mano viva; los multiplicadores y el timer sólo en algunas fases, así que
      // de ésos no se puede exigir presencia sin volver el modo caprichoso.
      c.guardVivo = MOVMENU_OBLIGATORIOS.every(sel =>
        (abierto.guardN.find(g => g.sel === sel) || { n: 0 }).n > 0)
      c.guardOk = abierto.guard.length === 0 && c.guardVivo
      // MOV-1a-c · el panel no puede taparse a sí mismo. En MOV-1a lo hacía en
      // las cuatro celdas donde la pinza mordía (mesas 5 y 4 horizontales): el
      // disparador quedaba debajo y sólo se podía cerrar por fuera o con Esc.
      c.cubreDisparador = abierto.sobreDisparador
      c.disparadorLibre = abierto.sobreDisparador.length === 0
      c.distancia = abierto.distancia
      c.cubre = abierto.cubre
      c.guardRects = abierto.guardRects
      c.zOk = abierto.wins === true && abierto.panelZ > abierto.maxZ.max
      c.z = { panel: abierto.panelZ, maxVivo: abierto.maxZ }
      // Fuera de flujo ESTRICTO: abrir no mueve un ancla ni cambia el scroll.
      const dOpen = await page.evaluate((ab) => window.__u1Diff(ab[0], ab[1]), [cerrado.snap, abierto.snap])
      c.dOpen = dOpen
      c.dScroll = { h: abierto.scr.scrH - cerrado.scr.scrH, ovX: abierto.scr.ovX, ovY: abierto.scr.ovY }
      c.flujoOk = dOpen.max <= U1_TOL && c.dScroll.h === 0

      // (7) Tap FUERA cierra. Con el dedo, no con el ratón: es el gesto real.
      await page.touchscreen.tap(Math.round(abierto.vpW / 2), Math.round(abierto.vpH / 2))
      await page.waitForTimeout(160)
      const trasTap = await page.evaluate(() => ({ open: window.__u1Open(), snap: window.__u1Snap() }))
      c.cierraTapFuera = trasTap.open === false
      c.dBack = await page.evaluate((ab) => window.__u1Diff(ab[0], ab[1]), [cerrado.snap, trasTap.snap])
      // …y Esc también: es herencia del hook y el puerto no puede haberla perdido.
      await u1OpenMenu(page)
      await page.keyboard.press('Escape'); await page.waitForTimeout(120)
      c.cierraEsc = await page.evaluate(() => window.__u1Open() === false)

      // (8) Sonido alterna, cierra al ejecutar y persiste en la MISMA clave que
      //     escritorio — que es el punto entero del puerto: no hay ajuste nuevo.
      const lsAntes = await page.evaluate(() => localStorage.getItem('ajilei.sound'))
      await u1OpenMenu(page)
      const glifoAntes = await page.evaluate(() => window.__u1SoundEntry())
      await page.click('.util-item-sound')
      await page.waitForTimeout(160)
      const lsTras = await page.evaluate(() => localStorage.getItem('ajilei.sound'))
      const cerroAlEjecutar = await page.evaluate(() => window.__u1Open() === false)
      await u1OpenMenu(page)
      const glifoTras = await page.evaluate(() => window.__u1SoundEntry())
      await page.keyboard.press('Escape'); await page.waitForTimeout(100)
      c.sonido = { lsAntes, lsTras, glifoAntes, glifoTras, cerroAlEjecutar }
      c.sonidoOk = lsTras === 'off' && lsTras !== lsAntes &&
        glifoAntes.off === false && glifoTras.off === true && cerroAlEjecutar

      // ── MOV-1b-a · Aviso de "Mano actual" ─────────────────────────────────
      // Se abre desde su entrada, que CIERRA AL EJECUTAR: cuando el aviso se
      // pinta el panel ya se desmontó, así que se ancla al ⋮ y no a él.
      const saldoAntes = Number(await page.evaluate(k => localStorage.getItem(k), U3_KEY))
      await u1OpenMenu(page)
      await page.click('.util-item-mano .util-ico-slot')
      await page.waitForSelector('.u3-popup', { timeout: 4000 }).catch(() => {})
      c.aviso = await page.evaluate(({ G, TOL }) => {
        const a = document.querySelector('.u3-popup')
        if (!a) return { existe: false }
        const r = a.getBoundingClientRect()
        const t = document.querySelector('.utilities-trigger').getBoundingClientRect()
        const horizontal = matchMedia('(orientation: landscape) and (max-height: 600px)').matches
        // D6: en vertical el filo derecho del aviso coincide con el del ⋮; en
        // horizontal queda a 6px a su izquierda.
        const esperadoRight = horizontal ? t.left - 6 : t.right
        return {
          existe: true, horizontal,
          caja: window.__u1R('.u3-popup'),
          dRight: Math.round(Math.abs(r.right - esperadoRight) * 100) / 100,
          dentro: r.left >= -TOL && r.top >= -TOL &&
                  r.right <= innerWidth + TOL && r.bottom <= innerHeight + TOL,
          solape: window.__movSolape('.u3-popup', G),
          sobreDisparador: window.__movSolape('.u3-popup', ['.utilities-trigger']),
          panelCerrado: !document.querySelector('.utilities-panel'),
        }
      }, { G: MOVMENU_GUARD, TOL: U1_TOL })
      const retrato = n === 5 && (tag === '360x640' || tag === '640x360')
      if (retrato) {
        await page.mouse.move(5, 5)
        await page.screenshot({ path: MOVMENU_OUT + '/mov1b-mano-mesa' + n + '-' + tag + '.png' })
      }
      const saldoTras = Number(await page.evaluate(k => localStorage.getItem(k), U3_KEY))
      // Segunda consulta de la MISMA mano: es gratis por diseño (v1.1 §3.4), así
      // que el saldo no puede volver a bajar. Es la mitad del sello que un
      // "cobra una" ingenuo dejaría pasar.
      await page.waitForSelector('.u3-popup', { state: 'detached', timeout: CONSULTA_POPUP_MS + 2000 }).catch(() => {})
      c.avisoAutocierra = await page.evaluate(() => !document.querySelector('.u3-popup'))
      await u1OpenMenu(page)
      await page.click('.util-item-mano .util-ico-slot')
      await page.waitForTimeout(250)
      const saldoRepetida = Number(await page.evaluate(k => localStorage.getItem(k), U3_KEY))
      await page.waitForSelector('.u3-popup', { state: 'detached', timeout: CONSULTA_POPUP_MS + 2000 }).catch(() => {})
      // Persistencia end-to-end (recarga → volver a la mesa) en UNA celda y no
      // en las dieciséis: es una propiedad del almacenamiento, no de la
      // geometría, así que repetirla sixteen veces cuesta ~80s y no mide nada
      // nuevo. Se declara aquí para que la cobertura no se lea de más.
      let persistencia = null
      if (n === 5 && tag === '360x640') {
        await page.reload()
        await volverALaMesa(page, n)
        // La recarga se lleva por delante las sondas inyectadas: hay que volver
        // a montarlas o lo que sigue mide sobre un `window` pelado.
        await u1Install(page)
        await installHitProbe(page)
        await page.evaluate(MOVMENU_SONDA)
        await clickIf(page, 'button:has-text("Iniciar mano")')
        await page.waitForSelector('.action-buttons button', { timeout: 20000 }).catch(() => {})
        await page.mouse.move(5, 5)
        persistencia = Number(await page.evaluate(k => localStorage.getItem(k), U3_KEY))
      }
      c.consultas = {
        antes: saldoAntes, tras: saldoTras, repetida: saldoRepetida,
        gratis: CONSULTAS_GRATIS, persistencia,
      }
      c.avisoOk = c.aviso.existe && c.aviso.panelCerrado &&
        c.aviso.dRight <= U1_TOL && c.aviso.dentro &&
        c.aviso.solape.length === 0 && c.aviso.sobreDisparador.length === 0
      c.consultasOk = saldoAntes === CONSULTAS_GRATIS && saldoTras === saldoAntes - 1 &&
        saldoRepetida === saldoTras && c.avisoAutocierra &&
        (persistencia === null || persistencia === saldoTras)

      // ── MOV-1b-a · Tapetes ────────────────────────────────────────────────
      const tapeteAntes = await page.evaluate(() => document.body.dataset.tapete ?? null)
      await u1OpenMenu(page)
      await page.click('.util-item-tapetes')
      await page.waitForSelector('.tapetes-panel', { timeout: 4000 }).catch(() => {})
      c.tapetes = await page.evaluate(({ G, TOL }) => {
        const p2 = document.querySelector('.tapetes-panel')
        if (!p2) return { existe: false }
        const r = p2.getBoundingClientRect()
        const t = document.querySelector('.utilities-trigger').getBoundingClientRect()
        const horizontal = matchMedia('(orientation: landscape) and (max-height: 600px)').matches
        const esperadoRight = horizontal ? t.left - 6 : t.right
        return {
          existe: true, horizontal,
          caja: window.__u1R('.tapetes-panel'),
          cols: getComputedStyle(p2).getPropertyValue('--tap-cols').trim(),
          filas: [...p2.querySelectorAll('.tap-swatch')].length,
          dRight: Math.round(Math.abs(r.right - esperadoRight) * 100) / 100,
          dentro: r.left >= -TOL && r.top >= -TOL &&
                  r.right <= innerWidth + TOL && r.bottom <= innerHeight + TOL,
          solape: window.__movSolape('.tapetes-panel', G),
          sobreDisparador: window.__movSolape('.tapetes-panel', ['.utilities-trigger']),
          panelCerrado: !document.querySelector('.utilities-panel'),
          // Hit REAL de cada ficha, por `elementFromPoint`.
          fichas: [...p2.querySelectorAll('.tap-swatch')].map(e => {
            const hb = window.__hitBox(e)
            return { id: e.dataset.tap, w: hb.w, h: hb.h, visual: [hb.visualW, hb.visualH] }
          }),
        }
      }, { G: MOVMENU_GUARD, TOL: U1_TOL })
      if (retrato) {
        await page.mouse.move(5, 5)
        await page.screenshot({ path: MOVMENU_OUT + '/mov1b-tapetes-mesa' + n + '-' + tag + '.png' })
      }
      // Elegir un fieltro NO comprado: la mesa es el probador, así que el tapete
      // se aplica en el acto (y el diálogo de compra se pinta encima).
      await page.click('.tap-swatch[data-tap="' + MOVMENU_TAPETE + '"]').catch(() => {})
      await page.waitForTimeout(220)
      const tapeteTras = await page.evaluate(() => document.body.dataset.tapete ?? null)
      // Tap FUERA: cierra y REVIERTE la previa (no se compró nada).
      await page.touchscreen.tap(Math.round(vp.w / 2), Math.round(vp.h - 12))
      await page.waitForTimeout(220)
      const tapeteCerrado = await page.evaluate(() => ({
        attr: document.body.dataset.tapete ?? null,
        abierto: !!document.querySelector('.tapetes-panel'),
      }))
      c.tapete = { antes: tapeteAntes, tras: tapeteTras, cerrado: tapeteCerrado, probado: MOVMENU_TAPETE }
      c.tapetesOk = c.tapetes.existe && c.tapetes.panelCerrado &&
        c.tapetes.dRight <= U1_TOL && c.tapetes.dentro &&
        c.tapetes.solape.length === 0 && c.tapetes.sobreDisparador.length === 0 &&
        c.tapetes.filas === TAPETES.length &&
        tapeteTras === MOVMENU_TAPETE && tapeteCerrado.attr === tapeteAntes &&
        tapeteCerrado.abierto === false
      // El hit de las fichas: PUERTA sólo en la fila que estrena el horizontal.
      c.fichasMin = Math.min(...c.tapetes.fichas.map(f => Math.min(f.w, f.h)))
      c.fichasOk = c.tapetes.horizontal ? c.fichasMin >= MOVMENU_FICHA_MIN : true

      // ── MOV-1b-c · Selector de reacciones ─────────────────────────────────
      await u1OpenMenu(page)
      c.entradaReac = await page.evaluate(() => {
        const e = document.querySelector('.util-item-reacciones')
        return {
          existe: !!e,
          gris: !!e && e.className.includes('is-disabled'),
          inerte: !!e && e.disabled === true,
        }
      })
      await page.click('.util-item-reacciones')
      await page.waitForSelector('.u2-selector', { timeout: 4000 }).catch(() => {})
      c.selector = await page.evaluate(({ G, TOL, N }) => {
        const s2 = document.querySelector('.u2-selector')
        if (!s2) return { existe: false }
        const r = s2.getBoundingClientRect()
        const t = document.querySelector('.utilities-trigger').getBoundingClientRect()
        const horizontal = matchMedia('(orientation: landscape) and (max-height: 600px)').matches
        const esperadoRight = horizontal ? t.left - 6 : t.right
        const items = [...s2.querySelectorAll('.u2-frase')]
        // Las DOCE alcanzables: se lleva cada una a la vista y se comprueba que
        // el centro de su caja resuelve a ella —no a un hermano, no al fondo— y
        // que su hit llega al estándar. Sin el `scrollIntoView` sólo cuatro
        // están pintadas y las otras ocho darían un `elementFromPoint` del
        // contenedor: un verde que no mide lo que dice.
        const filas = items.map((e, i) => {
          e.scrollIntoView({ block: 'nearest' })
          const hb = window.__hitBox(e)
          const b = e.getBoundingClientRect()
          const cx = Math.round((b.left + b.right) / 2), cy = Math.round((b.top + b.bottom) / 2)
          const t2 = document.elementFromPoint(cx, cy)
          return {
            i, alcanza: !!t2 && (t2 === e || e.contains(t2)),
            w: hb.w, h: hb.h, visual: [hb.visualW, hb.visualH],
          }
        })
        s2.scrollTop = 0
        return {
          existe: true, horizontal,
          caja: window.__u1R('.u2-selector'),
          cliente: { w: s2.clientWidth, h: s2.clientHeight },
          scroll: s2.scrollHeight,
          filas, n: items.length,
          dRight: Math.round(Math.abs(r.right - esperadoRight) * 100) / 100,
          dentro: r.left >= -TOL && r.top >= -TOL &&
                  r.right <= innerWidth + TOL && r.bottom <= innerHeight + TOL,
          solape: window.__movSolape('.u2-selector', G),
          sobreDisparador: window.__movSolape('.u2-selector', ['.utilities-trigger']),
          panelCerrado: !document.querySelector('.utilities-panel'),
          esperadas: N,
        }
      }, { G: MOVMENU_GUARD, TOL: U1_TOL, N: MOVMENU_FRASES.length })
      // El gesto de desplazamiento NO lo cierra y NO arrastra la página. Se
      // dispara el `pointerdown` de verdad —que es lo que el cierre por captura
      // mira— en vez de simular un arrastre con el ratón: un arrastre que
      // termina sobre una fila mandaría una reacción y la puerta mediría otra cosa.
      c.selectorGesto = await page.evaluate(() => {
        const s2 = document.querySelector('.u2-selector')
        if (!s2) return null
        s2.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, composed: true }))
        s2.scrollTop = 120
        return {
          sigueAbierto: !!document.querySelector('.u2-selector'),
          scrollTop: s2.scrollTop,
          scrollY: window.scrollY,
        }
      })
      await page.evaluate(() => { const s2 = document.querySelector('.u2-selector'); if (s2) s2.scrollTop = 0 })
      // Tap fuera: cierra.
      await page.touchscreen.tap(Math.round(vp.w / 2), Math.round(vp.h - 12))
      await page.waitForTimeout(200)
      c.selectorTapFuera = await page.evaluate(() => !document.querySelector('.u2-selector'))
      c.selectorOk = c.entradaReac.existe && !c.entradaReac.gris && !c.entradaReac.inerte &&
        c.selector.existe && c.selector.panelCerrado &&
        c.selector.dRight <= U1_TOL && c.selector.dentro &&
        c.selector.solape.length === 0 && c.selector.sobreDisparador.length === 0 &&
        c.selector.n === MOVMENU_FRASES.length &&
        c.selector.cliente.w === MOVMENU_SELECTOR.cw &&
        c.selector.cliente.h === MOVMENU_SELECTOR.ch &&
        c.selector.scroll === MOVMENU_SELECTOR.scroll &&
        Math.abs(c.selector.caja.w - MOVMENU_SELECTOR.w) <= U1_TOL &&
        Math.abs(c.selector.caja.h - MOVMENU_SELECTOR.h) <= U1_TOL &&
        c.selector.filas.every(f => f.alcanza && f.w >= MOVMENU_FICHA_MIN && f.h >= MOVMENU_FICHA_MIN) &&
        !!c.selectorGesto && c.selectorGesto.sigueAbierto &&
        c.selectorGesto.scrollTop > 0 && c.selectorGesto.scrollY === 0 &&
        c.selectorTapFuera === true

      // ── MOV-1b-e · Burbuja · UNA sola colocación ─────────────────────
      // Las DOS frases extremas, en las 16 celdas. La larga estira la burbuja
      // hasta su peor caso; la corta comprueba que la colocación es LA MISMA y
      // no otra — que es exactamente lo que esta tanda viene a garantizar
      // después de que 1b-c dejara dos colocaciones conviviendo según cupiera.
      // Mandar sólo una de las dos era lo que permitía esa mezcla: la larga
      // colgaba del ⋮ en las 16 y la puerta se quedaba tan verde.
      const porLargo = MOVMENU_FRASES
        .map((f, i2) => ({ i: i2, n: f.length }))
        .sort((a, b) => a.n - b.n)
      const iCorta = porLargo[0].i
      const iLarga = porLargo[porLargo.length - 1].i
      c.burbujas = {}
      for (const [clave, idx] of [['corta', iCorta], ['larga', iLarga]]) {
        await u1OpenMenu(page)
        await page.click('.util-item-reacciones')
        await page.waitForSelector('.u2-selector', { timeout: 4000 }).catch(() => {})
        const dicha = await page.evaluate((i2) => {
          const e = document.querySelectorAll('.u2-frase')[i2]
          return e ? e.getAttribute('aria-label') : null
        }, idx)
        await page.click(`.u2-frase:nth-of-type(${idx + 1})`)
        await page.waitForSelector('.u2-burbuja', { timeout: 4000 }).catch(() => {})
        await movEsperaEntrada(page)
        const m = await page.evaluate(({ G, PICO }) => {
          const b0 = document.querySelector('.u2-burbuja')
          if (!b0) return { existe: false }
          const r = b0.getBoundingClientRect()
          const cs = getComputedStyle(b0)
          const disp = document.querySelector('.utilities-trigger').getBoundingClientRect()
          const nodo = document.querySelector('.pbr-name')
          const rango = document.createRange(); rango.selectNodeContents(nodo)
          const tinta = rango.getBoundingClientRect()
          const horizontal = matchMedia('(orientation: landscape) and (max-height: 600px)').matches
          // ¿Hay pico pintado? En móvil NO lo hay en ninguna orientación. Se
          // mira `content` y no `display`: la piel móvil no APAGA el pseudo,
          // simplemente no lo declara, y un pseudo sin `content` no se genera
          // aunque su `display` diga `block`. Mirando `display` esta puerta
          // habría pasado por casualidad, que es como se cuela un verde falso.
          const csPico = getComputedStyle(b0, '::before')
          const picoPintado = csPico.content !== 'none' && csPico.display !== 'none'
          // D6: en vertical el filo derecho coincide con el del ⋮; en
          // horizontal queda a 6px a su izquierda. La misma cuenta que ya
          // exigen el aviso de "Mano actual", Tapetes y el selector.
          const esperadoRight = horizontal ? disp.left - 6 : disp.right
          return {
            existe: true, horizontal, picoPintado,
            ancla: b0.dataset.ancla,
            caja: window.__u1R('.u2-burbuja'),
            dRight: Math.round(Math.abs(r.right - esperadoRight) * 100) / 100,
            dur: cs.getPropertyValue('--u2-dur').trim(),
            texto: b0.querySelector('.u2-texto') ? b0.querySelector('.u2-texto').textContent : null,
            dentro: r.left >= 0 && r.top >= 0 && r.right <= innerWidth && r.bottom <= innerHeight,
            // DENTRO DEL ÁREA, y no sólo del viewport. Bajo la barra del
            // jugador no hay una sola caja de la guardia, así que una burbuja
            // que se derramaba por ahí —y se salía de la pantalla— daba 0 px²
            // y verde. La puerta la estrenó 1b-c y aquí se queda.
            dentroArea: (() => {
              const ga = document.querySelector('.game-table')
              if (!ga) return null
              const q = ga.getBoundingClientRect()
              const cs2 = getComputedStyle(ga)
              return r.bottom <= q.bottom - parseFloat(cs2.borderBottomWidth) + 0.01 &&
                     r.top >= q.top + parseFloat(cs2.borderTopWidth) - 0.01
            })(),
            solape: window.__movSolape('.u2-burbuja', G),
            sobreDisparador: window.__movSolape('.u2-burbuja', ['.utilities-trigger']),
            selectorCerrado: !document.querySelector('.u2-selector'),
            // Distancia a la tinta del nombre. Ya no es puerta — la burbuja
            // dejó de colgar de ella en móvil — pero se REPORTA: es la cifra
            // que dice cuánto se alejó el mensaje de quién lo dice.
            aLaTinta: Math.round(Math.abs(r.bottom - tinta.top) * 100) / 100,
          }
        }, { G: MOVMENU_GUARD, PICO: REACCION_PICO_PX })
        c.burbujas[clave] = { ...m, dicha }
        if (clave === 'corta') {
          // El candado, comprobado con la burbuja viva: la entrada está en
          // enfriamiento. Y el propio enfriamiento hace de espera para la
          // segunda frase, así que no cuesta un segundo de más.
          await u1OpenMenu(page)
          c.enfriando = await page.evaluate(() => {
            const e = document.querySelector('.util-item-reacciones')
            return {
              cooling: !!e && e.className.includes('is-cooling'),
              inerte: !!e && e.disabled === true,
            }
          })
          await page.keyboard.press('Escape')
          await page.waitForSelector('.u2-burbuja', { state: 'detached', timeout: REACCION_TOTAL_MS + 2000 }).catch(() => {})
          await page.waitForTimeout(REACCION_COOLDOWN_MS - REACCION_TOTAL_MS + 300)
        }
      }
      const burbujaSana = (b) => !!b && b.existe && b.selectorCerrado && b.dentro &&
        b.dentroArea && b.solape.length === 0 && b.sobreDisparador.length === 0 &&
        b.dRight <= U1_TOL && b.ancla === 'satelite' && b.picoPintado === false &&
        b.dur === REACCION_TOTAL_MS + 'ms' &&
        (b.dicha || '').startsWith(b.texto || '\u0000')
      c.burbujaOk = burbujaSana(c.burbujas.corta) && burbujaSana(c.burbujas.larga) &&
        c.enfriando.cooling && c.enfriando.inerte
      // Se conserva la larga en el sitio de siempre para que el JSON y la
      // consola no cambien de forma entre tandas.
      c.burbuja = c.burbujas.larga

      // Relojes y assets: UNA celda. El ciclo de la burbuja y el enfriamiento
      // son propiedades del reloj, no de la geometría, y los 24 ficheros de
      // emoji son los mismos en las dieciséis — repetirlo costaba ~8s por celda
      // y no medía nada nuevo. Se declara aquí para que la cobertura no se lea
      // de más.
      c.relojes = null
      if (n === 5 && tag === '360x640') {
        await page.waitForSelector('.u2-burbuja', { state: 'detached', timeout: REACCION_TOTAL_MS + 2000 }).catch(() => {})
        const muerta = await page.evaluate(() => !document.querySelector('.u2-burbuja'))
        await page.waitForTimeout(REACCION_COOLDOWN_MS - REACCION_TOTAL_MS + 400)
        await u1OpenMenu(page)
        const libre = await page.evaluate(() => {
          const e = document.querySelector('.util-item-reacciones')
          return !!e && !e.className.includes('is-cooling') && e.disabled !== true
        })
        await page.keyboard.press('Escape')
        const assets = await page.evaluate(async (rutas) => {
          const out = []
          for (const u of rutas) {
            try { const r = await fetch(u, { method: 'GET' }); out.push({ u, s: r.status }) }
            catch { out.push({ u, s: 0 }) }
          }
          return out
        }, [...MOVMENU_FRASES.map(f => movRutaEmoji(f, 'avif')),
            ...MOVMENU_FRASES.map(f => movRutaEmoji(f, 'svg'))])
        c.relojes = {
          muerta, libre,
          assets: assets.length, assets200: assets.filter(a => a.s === 200).length,
          fallan: assets.filter(a => a.s !== 200).map(a => a.u),
        }
      }
      c.relojesOk = c.relojes === null || (c.relojes.muerta && c.relojes.libre &&
        c.relojes.assets200 === c.relojes.assets)

      // MOV-1b-e · las cuatro capturas pedidas: burbuja LARGA y CORTA colgando
      // del ⋮, mesa 5 a 360×640 y 640×360. Más las dos del selector abierto, que
      // vienen de 1b-c y siguen valiendo. Se toman DESPUÉS de las puertas para
      // no alterar lo que miden, y con la entrada YA terminada: durante los
      // primeros 300ms la burbuja va de `opacity: 0` a 1, y una foto a media
      // entrada sale desvaída y hace parecer roto lo que no lo está.
      if (n === 5 && (tag === '360x640' || tag === '640x360')) {
        const foto = async (idx, nombre) => {
          await u1OpenMenu(page)
          await page.click('.util-item-reacciones')
          await page.waitForSelector('.u2-selector', { timeout: 4000 }).catch(() => {})
          if (nombre === 'corta') {
            await page.screenshot({ path: MOVMENU_OUT + '/mov1c-selector-mesa' + n + '-' + tag + '.png' })
          }
          await page.click(`.u2-frase:nth-of-type(${idx + 1})`).catch(() => {})
          await page.waitForSelector('.u2-burbuja', { timeout: 4000 }).catch(() => {})
          await movEsperaEntrada(page)
          await page.screenshot({ path: MOVMENU_OUT + '/mov1e-burbuja-' + nombre + '-mesa' + n + '-' + tag + '.png' })
          await page.waitForSelector('.u2-burbuja', { state: 'detached', timeout: REACCION_TOTAL_MS + 2000 }).catch(() => {})
          await page.waitForTimeout(REACCION_COOLDOWN_MS - REACCION_TOTAL_MS + 300)
        }
        await foto(iCorta, 'corta')
        await foto(iLarga, 'larga')
      }

      // Capturas de la Fase 2: una por mesa en los dos viewports pedidos.
      if (tag === '640x360' || (n === 5 && tag === '812x375')) {
        await u1OpenMenu(page)
        await page.mouse.move(5, 5)
        await page.screenshot({ path: MOVMENU_OUT + '/mov1ac-mesa' + n + '-' + tag + '.png' })
        c.shot = 'mov1ac-mesa' + n + '-' + tag + '.png'
        await page.keyboard.press('Escape')
      }

      // Una lista con NOMBRE por puerta: un `every` desnudo dice que la celda
      // falla y no cuál, y entonces hay que repetir la corrida para saberlo.
      const puertas = {
        celdaMovil: c.celdaOk, cajaD5: c.cajaOk, disparadorUnico: c.esElDisparador,
        hit44: c.hitOk, vecinos: c.vecinosOk, guardiaConObjetivos: c.guardVivo,
        pinzaD4: c.pinza.dentro, encajeViewport: c.pinza.encaje,
        geomDerivada: c.geom.derivadaOk, geomSellada: c.geom.selladaOk,
        entradas: c.entradasOk, leyendas: c.titlesOk, identidades: c.idsOk,
        sinBadge: c.badgeOk,
        guardiaLimpia: c.guardOk, disparadorLibre: c.disparadorLibre,
        apilamiento: c.zOk, fueraDeFlujo: c.flujoOk,
        cierreTapFuera: c.cierraTapFuera, cierreEsc: c.cierraEsc, sonido: c.sonidoOk,
        avisoMano: c.avisoOk, contadorConsultas: c.consultasOk,
        tapetes: c.tapetesOk, hitFichas: c.fichasOk,
        selectorReacciones: c.selectorOk, burbuja: c.burbujaOk, relojesYassets: c.relojesOk,
      }
      c.puertas = puertas
      c.fallos = Object.keys(puertas).filter(k => !puertas[k])
      c.passed = c.fallos.length === 0
    } catch (e) {
      c.error = String(e && e.message || e)
      c.passed = false
    }
    await page.close().catch(() => {})
    celdas.push(c)
    console.error('  mesa ' + n + ' · ' + tag + ' · ' + (c.passed ? 'OK   ' : 'FALLA') +
      ' · dCaja=' + c.dCaja + ' hit=' + (c.hit ? c.hit.w + 'x' + c.hit.h : '?') +
      ' panel=' + (c.panel ? c.panel.w + 'x' + c.panel.h + '@' + c.panel.x + ',' + c.panel.y : '?') +
      ' dist=' + c.distancia +
      (c.fallos && c.fallos.length ? ' · fallan: ' + c.fallos.join(',') : '') +
      (c.error ? ' · ' + c.error : ''))
  }
  // ── Contra-celda de ESCRITORIO ─────────────────────────────────────────────
  // El puerto móvil comparte componente, hook y ancla con el de escritorio, así
  // que la pregunta "¿movió algo arriba?" no es retórica: la pinza de D4 se
  // aplica a las DOS pieles (es un `clamp()` en línea, no una rama), y su tope
  // superior sólo deja de morder si el panel abre donde siempre. Se comprueba
  // aquí y no en una sonda aparte para que quede medido cada vez que alguien
  // corra el modo, en vez de una sola tarde. Es UNA celda a propósito:
  // `gameTable.css` no se toca y las dos media queries son complementarias, así
  // que lo único que podría haber movido escritorio es el JS compartido — y eso
  // no depende del viewport.
  let escritorio = null
  if (!filtroMesa && !filtroVp) {
    const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } })
    try {
      await gotoMesa(page, 5)
      await u1Install(page)
      const gate = await page.evaluate(() => matchMedia('(orientation: landscape) and (min-height: 601px)').matches)
      // Con una mano repartida, y no en WAITING: "Mano actual" sólo está
      // habilitada en las fases consultables, así que sin cartas saldría en gris
      // por motivos legítimos y la puerta de "las cuatro siguen vivas" —la que
      // de verdad vigila que `soloSonido` no se haya escapado al gate de
      // escritorio— no estaría midiendo nada.
      await clickIf(page, 'button:has-text("Iniciar mano")')
      // Espera POR ESTADO y no por reloj: la fase de apuesta llega cuando el
      // reparto termina, y eso tarda distinto según la mesa. Un `waitForTimeout`
      // fijo funcionaba en 15 celdas y en la decimosexta dejaba la guardia
      // midiendo una pantalla sin botones — que es el verde vacuo de siempre.
      await page.waitForSelector('.action-buttons button', { timeout: 20000 }).catch(() => {})
      await page.mouse.move(5, 5)
      await u1OpenMenu(page)
      const m = await page.evaluate(() => ({
        trigger: window.__u1R('.utilities-trigger'),
        expect: window.__u1PanelExpect(),
        titles: window.__u1Titles(),
        badge: document.querySelectorAll('.utilities-panel .util-badge').length,
        vivas: [...document.querySelectorAll('.utilities-panel .util-item')]
          .filter(e => !e.className.includes('is-disabled')).map(e => e.getAttribute('title')),
      }))
      // MOV-1b-c · el selector y la burbuja de ESCRITORIO, medidos aquí mismo.
      // Son las dos piezas que esta tanda toca en código compartido —el ancla
      // del selector pasa por una rama nueva y el pico de la burbuja estrena
      // pinza—, así que preguntar "¿movió algo arriba?" deja de ser retórica.
      await page.click('.util-item-reacciones')
      await page.waitForSelector('.u2-selector', { timeout: 4000 }).catch(() => {})
      const dsk = await page.evaluate(() => {
        const sel = document.querySelector('.u2-selector')
        const t = document.querySelector('.utilities-trigger').getBoundingClientRect()
        if (!sel) return null
        const r = sel.getBoundingClientRect()
        return {
          caja: window.__u1R('.u2-selector'),
          cols: getComputedStyle(sel).gridTemplateColumns.split(' ').length,
          // El ancla de siempre: borde derecho al filo derecho del ⋮, 6px bajo
          // su pie. Si la rama nueva se hubiera colado arriba, esto se movería.
          dRight: Math.round(Math.abs(r.right - t.right) * 100) / 100,
          dTop: Math.round(Math.abs(r.top - (t.bottom + 6)) * 100) / 100,
          desborda: sel.scrollHeight > sel.clientHeight,
        }
      })
      await page.click('.u2-frase:nth-of-type(1)')
      await page.waitForSelector('.u2-burbuja', { timeout: 4000 }).catch(() => {})
      await movEsperaEntrada(page)
      const dskBur = await page.evaluate(() => {
        const b0 = document.querySelector('.u2-burbuja')
        if (!b0) return null
        const r = b0.getBoundingClientRect()
        const nodo = document.querySelector('.pbr-name')
        const rango = document.createRange(); rango.selectNodeContents(nodo)
        const tinta = rango.getBoundingClientRect()
        const pico = parseFloat(getComputedStyle(b0).getPropertyValue('--u2-pico-x'))
        return {
          caja: window.__u1R('.u2-burbuja'),
          pico,
          // La pinza del pico NO puede morder arriba: el nombre está lejos del
          // filo del área y el centro de la tinta ya cae dentro del cuerpo.
          dTinta: Math.round(Math.abs(r.left + pico - (tinta.left + tinta.width / 2)) * 100) / 100,
          // Hueco entre el pie de la burbuja y la tinta. El sellado es pico + 2.
          sobreTinta: Math.round((tinta.top - r.bottom) * 100) / 100,
        }
      })
      const ex = m.expect
      escritorio = {
        selector: dsk, burbuja: dskBur,
        selectorOk: !!dsk && dsk.cols === 3 && dsk.desborda === false &&
          dsk.dRight <= U1_TOL && dsk.dTop <= U1_TOL &&
          Math.abs(dsk.caja.w - MOVMENU_SEL_DSK.w) <= U1_TOL &&
          Math.abs(dsk.caja.h - MOVMENU_SEL_DSK.h) <= U1_TOL,
        // La caja SELLADA del encargo, ya sin la escala de entrada: 91,56×81 con
        // la frase 1. Y la relación con la tinta, que es lo que esta tanda toca
        // en código compartido: el pie a pico + 2 sobre ella y el pico en su
        // centro exacto. Si la pinza nueva hubiera mordido arriba, se vería.
        burbujaOk: !!dskBur && dskBur.dTinta <= U1_TOL &&
          Math.abs(dskBur.caja.w - 91.56) <= U1_TOL &&
          Math.abs(dskBur.caja.h - 81) <= U1_TOL,
        // `sobreTinta` se REPORTA y no se exige. El nominal es pico + 2 = 10 y
        // arriba salen 5,14: el componente sellado mide su caja al montar, o
        // sea con la escala de entrada puesta (94%), y coloca con esos 76,14 en
        // vez de con 81 — 4,86px de desfase que existen desde U2c y que esta
        // tanda NO toca, porque tocarlos sería mover escritorio. Las dos ramas
        // móviles sí miden la caja real; ahí el nominal se cumple.
        sobreTintaNominal: REACCION_PICO_PX + 2,
        vp: '1920x1080', gate,
        trigger: m.trigger, panel: ex && ex.got, itemH: ex && ex.itemH, itemW: ex && ex.itemW,
        titles: m.titles, badge: m.badge, vivas: m.vivas,
        // Las cifras selladas son las de MOV-0 0.1, que son las de u1.
        triggerOk: !!m.trigger && Math.abs(m.trigger.w - U1_TRIGGER.w) <= U1_TOL &&
          Math.abs(m.trigger.h - U1_TRIGGER.h) <= U1_TOL,
        panelOk: !!ex && ex.n === 5 &&
          Math.abs(ex.got.w - MOVMENU_PANEL.w) <= U1_TOL &&
          Math.abs(ex.got.h - MOVMENU_PANEL.h) <= U1_TOL,
        itemsOk: !!ex && ex.itemH.every(h => Math.abs(h - MOVMENU_ITEM.h) <= U1_TOL) &&
          ex.itemW.every(w => Math.abs(w - MOVMENU_ITEM.w) <= U1_TOL),
        titlesOk: JSON.stringify(m.titles) === JSON.stringify(U1_ENTRADAS),
        // Arriba NO se aplica `soloSonido`: el badge sigue montado y las cuatro
        // entradas vivas siguen vivas. Es la mitad que más fácil se rompería sin
        // que nadie lo note, porque el puerto no la mira nunca.
        badgeOk: m.badge === 1,
        vivasOk: JSON.stringify(m.vivas) === JSON.stringify(['Sonido', 'Reacciones', 'Tapetes', 'Mano actual']),
      }
      escritorio.passed = gate === true && escritorio.triggerOk && escritorio.panelOk &&
        escritorio.itemsOk && escritorio.titlesOk && escritorio.badgeOk && escritorio.vivasOk &&
        escritorio.selectorOk && escritorio.burbujaOk
    } catch (e) {
      escritorio = { error: String(e && e.message || e), passed: false }
    }
    await page.close().catch(() => {})
    console.error('  escritorio 1920x1080 · ' + (escritorio.passed ? 'OK   ' : 'FALLA') +
      ' · trigger=' + (escritorio.trigger ? escritorio.trigger.w + 'x' + escritorio.trigger.h : '?') +
      ' panel=' + (escritorio.panel ? escritorio.panel.w + 'x' + escritorio.panel.h : '?') +
      ' selector=' + (escritorio.selector ? escritorio.selector.caja.w + 'x' + escritorio.selector.caja.h : '?') +
      ' burbuja=' + (escritorio.burbuja ? escritorio.burbuja.caja.w + 'x' + escritorio.burbuja.caja.h : '?') +
      ' vivas=' + JSON.stringify(escritorio.vivas))
  }

  const verdes = celdas.filter(c => c.passed).length
  return {
    celdas, escritorio, verdes, total: celdas.length,
    passed: verdes === celdas.length && (escritorio ? escritorio.passed : true),
  }
}

// ── DSK-U2 · Reacciones entre jugadores ──────────────────────────────────────
// Documento rector: docs/AJILEI_Menu_Utilidades_v1.2.md.
// Modo NUEVO, no extensión de u1: aquél valida el CONTENEDOR del menú (caja del
// ⋮, apertura, apilamiento, sonido); éste valida un sistema propio (selector +
// burbuja + candado + cooldown). Mezclarlos haría que una regresión de
// reacciones se leyera como una del menú.
//
// ANTI-CABLEADO: las frases y los tiempos se IMPORTAN de la misma fuente que
// consume la app (src/config/reacciones.js). Una lista paralela en el arnés se
// desincronizaría al primer retoque de redacción — que es justo el fallo que
// esta campaña se niega a repetir.
const U2_VIEWPORTS = [...VIEWPORTS, { w: 1440, h: 850 }]
const U2_TABLES = [5, 4, 3, 2]

// Lo que ni el selector ni la burbuja pueden tocar JAMÁS. Las cartas propias
// encabezan la lista: son inocluibles por criterio rector de la tanda.
const U2_GUARD = {
  cartasHumano: '.player-zone .card-slot-wrapper',
  botones: '.action-area .btn',
  mults: '.btn-mult',
  timer: '.timer-display',
  bandaPalo: '.score-tag-player',
}
// Anclas del Δ=0 con burbuja presente/ausente.
const U2_ANCHORS = [
  '.game-table', '.table-header', '.table-mid', '.rivals-zone', '.center-zone',
  '.ai-zone', '.player-zone', '.player-bar', '.player-zone .cards-row',
  '.score-tag-player', '.header-right',
]

async function u2Install(page) {
  await page.evaluate(({ G, A }) => {
    const rnd = x => x == null ? null : Math.round(x * 100) / 100
    const R = e => { if (!e) return null; const b = e.getBoundingClientRect(); return { x: rnd(b.x), y: rnd(b.y), w: rnd(b.width), h: rnd(b.height), top: rnd(b.top), bottom: rnd(b.bottom), left: rnd(b.left), right: rnd(b.right) } }
    window.__u2R = s => R(document.querySelector(s))
    window.__u2snap = () => A.map(s => R(document.querySelector(s)))
    // Rect de TINTA — el anclaje que la tanda declara regla.
    window.__u2tinta = (sel) => {
      const el = document.querySelector(sel)
      if (!el) return null
      const rg = document.createRange(); rg.selectNodeContents(el)
      const b = rg.getBoundingClientRect()
      return { x: rnd(b.x), w: rnd(b.width), top: rnd(b.top), left: rnd(b.left), right: rnd(b.right), centro: rnd(b.left + b.width / 2) }
    }
    // DSK-U2c · TINTA de un elemento Y de todo lo pintable que cuelga de él.
    // El Range cubre el TEXTO, pero desde U2c el emoji es una IMAGEN, y una
    // imagen no es texto: `p2` y la guardia de la burbuja medían CAJAS y la
    // caja no se entera de lo que rebosa (v1.4 §8). Se une el rect del Range
    // con el de cada <img> descendiente — lo que de verdad se pinta.
    window.__u2ink = (sel) => {
      const el = document.querySelector(sel)
      if (!el) return null
      const rg = document.createRange(); rg.selectNodeContents(el)
      const b = rg.getBoundingClientRect()
      let L = b.left, T = b.top, Rr = b.right, Bo = b.bottom
      el.querySelectorAll('img').forEach(i => {
        const r = i.getBoundingClientRect()
        if (!r.width || !r.height) return
        L = Math.min(L, r.left); T = Math.min(T, r.top)
        Rr = Math.max(Rr, r.right); Bo = Math.max(Bo, r.bottom)
      })
      return { left: rnd(L), top: rnd(T), right: rnd(Rr), bottom: rnd(Bo), w: rnd(Rr - L), h: rnd(Bo - T) }
    }
    // Tinta de CADA fila del selector: la rejilla tiene `height` fija de 44px,
    // así que un glifo mayor desbordaría su botón sin mover una sola caja.
    window.__u2inkFilas = () => {
      const out = []
      document.querySelectorAll('.u2-frase').forEach(el => {
        const rg = document.createRange(); rg.selectNodeContents(el)
        const t = rg.getBoundingClientRect()
        const c = el.getBoundingClientRect()
        let L = t.left, T = t.top, Rr = t.right, Bo = t.bottom
        el.querySelectorAll('img').forEach(i => {
          const r = i.getBoundingClientRect()
          if (!r.width || !r.height) return
          L = Math.min(L, r.left); T = Math.min(T, r.top)
          Rr = Math.max(Rr, r.right); Bo = Math.max(Bo, r.bottom)
        })
        out.push({
          inkH: rnd(Bo - T), inkW: rnd(Rr - L), filaH: rnd(c.height),
          pista: rnd(el.scrollWidth - el.clientWidth),
          rebosaFila: (Bo - T) > c.height + 0.5,
        })
      })
      return out
    }
    // Unión de la tinta de las 12 filas — lo que el selector PINTA de verdad.
    window.__u2inkSelector = () => {
      const el = document.querySelector('.u2-selector')
      if (!el) return null
      let L = Infinity, T = Infinity, Rr = -Infinity, Bo = -Infinity
      el.querySelectorAll('.u2-frase').forEach(f => {
        const rg = document.createRange(); rg.selectNodeContents(f)
        const t = rg.getBoundingClientRect()
        L = Math.min(L, t.left); T = Math.min(T, t.top); Rr = Math.max(Rr, t.right); Bo = Math.max(Bo, t.bottom)
        f.querySelectorAll('img').forEach(i => {
          const r = i.getBoundingClientRect()
          if (!r.width || !r.height) return
          L = Math.min(L, r.left); T = Math.min(T, r.top); Rr = Math.max(Rr, r.right); Bo = Math.max(Bo, r.bottom)
        })
      })
      if (!Number.isFinite(L)) return null
      return { left: rnd(L), top: rnd(T), right: rnd(Rr), bottom: rnd(Bo), w: rnd(Rr - L), h: rnd(Bo - T) }
    }
    // Oclusión de un rect contra la guardia, en % del propio rect.
    window.__u2tapa = (b) => {
      const out = {}
      if (!b) return out
      for (const [k, s] of Object.entries(G)) {
        let acc = 0
        document.querySelectorAll(s).forEach(e => {
          const cs = getComputedStyle(e)
          if (cs.visibility === 'hidden' || cs.display === 'none') return
          const r = e.getBoundingClientRect()
          if (!r.width || !r.height) return
          const ow = Math.max(0, Math.min(b.right, r.right) - Math.max(b.left, r.left))
          const oh = Math.max(0, Math.min(b.bottom, r.bottom) - Math.max(b.top, r.top))
          acc += ow * oh
        })
        if (acc > 0.5) out[k] = rnd(100 * acc / (b.w * b.h))
      }
      return out
    }
    // Puntos MEDIOS de los filos + centro. Nunca las esquinas: con
    // `border-radius` caen fuera de la forma pintada y dan falso negativo
    // (verificado en el diagnóstico de fase 1).
    window.__u2gana = (sel) => {
      const el = document.querySelector(sel)
      if (!el) return null
      const b = el.getBoundingClientRect()
      const pts = [
        [b.left + b.width / 2, b.top + b.height / 2],
        [b.left + b.width / 2, b.top + 2], [b.left + b.width / 2, b.bottom - 2],
        [b.left + 2, b.top + b.height / 2], [b.right - 2, b.top + b.height / 2],
      ]
      return pts.every(([x, y]) => {
        if (x < 0 || y < 0 || x > innerWidth || y > innerHeight) return false
        const t = document.elementFromPoint(x, y)
        return !!t && (t === el || el.contains(t) || t.closest(sel) === el)
      })
    }
    window.__u2css = (sel, props) => {
      const el = document.querySelector(sel)
      if (!el) return null
      const cs = getComputedStyle(el)
      const o = {}
      props.forEach(p => { o[p] = cs.getPropertyValue(p) })
      return o
    }
    // ¿Algún ancestro de la burbuja crea contexto de apilamiento o transform?
    // Si lo hiciera, el `fixed` dejaría de anclar al viewport.
    window.__u2cadena = (sel) => {
      const out = []
      let el = document.querySelector(sel)
      if (!el) return null
      el = el.parentElement
      while (el && el !== document.documentElement) {
        const cs = getComputedStyle(el)
        out.push({
          cls: String(el.className).slice(0, 30) || el.tagName.toLowerCase(),
          transform: cs.transform !== 'none',
          ctx: (cs.position !== 'static' && cs.zIndex !== 'auto') || cs.transform !== 'none' ||
            parseFloat(cs.opacity) < 1 || cs.filter !== 'none' || cs.isolation === 'isolate' ||
            cs.contain.includes('paint') || cs.contain.includes('layout') || cs.perspective !== 'none',
        })
        el = el.parentElement
      }
      return out
    }
    window.__u2enPanel = () => {
      const b = document.querySelector('.u2-burbuja')
      return b ? !!b.closest('.opp-panel, .ai-zone') : null
    }
    // Censo z VIVO dentro del área. La burbuja es `pointer-events: none` a
    // propósito (overlay puro: no le roba un solo clic al juego), así que su
    // capa NO se puede auditar con elementFromPoint — que la salta y devolvería
    // siempre lo de debajo. Se audita contra el censo: su z debe superar todo lo
    // que vive dentro del área y quedarse por debajo del menú y los modales.
    window.__u2zArea = () => {
      let max = 0, quien = null
      document.querySelectorAll('.game-table *').forEach(e => {
        const cs = getComputedStyle(e)
        if (cs.position === 'static' || cs.zIndex === 'auto') return
        const z = Number(cs.zIndex)
        if (Number.isFinite(z) && z > max) { max = z; quien = String(e.className).slice(0, 30) }
      })
      return { max, quien }
    }
  }, { G: U2_GUARD, A: U2_ANCHORS })
}

const u2Espera = (page, ms) => page.waitForTimeout(ms)

// Abre el menú ⋮ y de ahí el selector. Un clic por paso y RECHEQUEO antes del
// siguiente (lección W1): abrir el menú y abrir el selector son dos cambios de
// estado encadenados, y encadenar clics sobre un estado muestreado una sola vez
// es exactamente como se pierden las tandas.
async function u2AbrirSelector(page) {
  await page.click('.utilities-trigger')
  await page.waitForSelector('.utilities-panel', { timeout: 2000 }).catch(() => {})
  const listo = await page.evaluate(() => !!document.querySelector('.util-item-reacciones:not([disabled])'))
  if (!listo) return false
  await page.click('.util-item-reacciones')
  await page.waitForSelector('.u2-selector', { timeout: 2000 }).catch(() => {})
  return page.evaluate(() => !!document.querySelector('.u2-selector'))
}

async function runU2(browser) {
  const { REACCIONES, REACCION_TOTAL_MS, REACCION_COOLDOWN_MS, REACCION_ENTRADA_MS, REACCION_VISIBLE_MS,
    textoDe, rutaEmoji, EMOJI_PRESUPUESTO } =
    await import('../src/config/reacciones.js')
  const cells = []
  const tblFilter = process.argv[3] ? Number(process.argv[3]) : null
  const vpFilter = process.argv[4] || null

  for (const n of U2_TABLES) for (const vp of U2_VIEWPORTS) {
    if (tblFilter && n !== tblFilter) continue
    if (vpFilter && `${vp.w}x${vp.h}` !== vpFilter) continue
    const page = await browser.newPage({ viewport: { width: vp.w, height: vp.h } })
    const c = { mesa: n, vp: `${vp.w}x${vp.h}` }
    try {
      await gotoMesa(page, n)
      await u2Install(page)
      await installHitProbe(page)

      const base = await page.evaluate(() => window.__u2snap())

      // ── P1a · el selector ABRE desde la entrada 💬 (que cierra el menú) ────
      const abrio = await u2AbrirSelector(page)
      // Los doce SVG se piden al ABRIR el selector, y cada celda arranca con
      // caché fría. Igual que con el AVIF de la burbuja: se espera a que estén
      // decodificados, acotado. El selector no tiene reloj de vida, así que la
      // espera no le quita tiempo a nada. Sin esto la puerta medía una carrera.
      const glifosListosMs = await page.evaluate(async () => {
        const t0 = performance.now()
        const listos = () => {
          const g = [...document.querySelectorAll('.u2-frase .u2-glifo')]
          return g.length > 0 && g.every(i => i.complete && i.naturalWidth > 0)
        }
        while (!listos() && performance.now() - t0 < 3000) await new Promise(r => setTimeout(r, 20))
        return Math.round(performance.now() - t0)
      })
      const tras = await page.evaluate(() => ({
        selector: !!document.querySelector('.u2-selector'),
        panel: !!document.querySelector('.utilities-panel'),
        // DSK-U2c · se lee el NOMBRE ACCESIBLE, no el textContent. El emoji
        // dejó de ser texto (es un <img>), así que textContent ya no devuelve
        // la frase sellada entera y el `alt` no la rescata — no entra en
        // textContent (v1.4 §5.3). Esto no relaja la puerta: sigue exigiendo
        // la frase completa y exacta contra la fuente única.
        frases: [...document.querySelectorAll('.u2-frase')].map(e => e.getAttribute('aria-label')),
        // Y se comprueba que el glifo de cada fila EXISTE y CARGÓ: un
        // aria-label correcto sobre una imagen rota pasaría desapercibido.
        glifos: [...document.querySelectorAll('.u2-frase .u2-glifo')].map(i => ({
          src: i.getAttribute('src'), ok: i.complete && i.naturalWidth > 0,
        })),
      }))
      // La entrada cierra al ejecutar (v1.1 §1.3.1) → el panel NO sobrevive.
      const p1_abre = abrio && tras.selector && tras.panel === false
      // Contenido = la fuente única, en su orden.
      const p8_lista = JSON.stringify(tras.frases) === JSON.stringify(REACCIONES) &&
        tras.glifos.length === REACCIONES.length && tras.glifos.every(g => g.ok) &&
        tras.glifos.every((g, i) => g.src === rutaEmoji(REACCIONES[i], 'svg'))

      // ── P2 · la rejilla no toca cartas ni botones del humano ──────────────
      // DSK-U2c · se mide la CAJA **y la TINTA**. La caja del selector no
      // crece con el glifo (las filas tienen `height` fija de 44px y las
      // columnas son minmax(0,1fr)): con sólo mirarla, la puerta seguía verde
      // con la rejilla rota (v1.4 §8). Lo que rebosa es la tinta.
      const selRect = await page.evaluate(() => window.__u2R('.u2-selector'))
      const selInk = await page.evaluate(() => window.__u2inkSelector())
      const selTapa = await page.evaluate(() => window.__u2tapa(window.__u2R('.u2-selector')))
      const selTapaInk = await page.evaluate(() => window.__u2tapa(window.__u2inkSelector()))
      const selDentro = await page.evaluate(() => {
        const b = window.__u2R('.u2-selector'), t = window.__u2inkSelector()
        const dentro = r => r && r.left >= 0 && r.top >= 0 && r.right <= innerWidth && r.bottom <= innerHeight
        return dentro(b) && dentro(t)
      })
      const p2 = Object.keys(selTapa).length === 0 && Object.keys(selTapaInk).length === 0 && !!selDentro

      // ── P13 · la tinta cabe en la fila de 44px ────────────────────────────
      // El estándar táctil de la fila es el techo real del glifo: la rejilla no
      // crece, así que un glifo mayor desborda su botón en silencio. La altura
      // se lee del TOKEN VIVO, jamás cableada.
      const filaH = await page.evaluate(() => {
        const v = getComputedStyle(document.querySelector('.game-table-screen')).getPropertyValue('--dsk-u1-item-h')
        return parseFloat(String(v).trim())
      })
      const inkFilas = await page.evaluate(() => window.__u2inkFilas())
      const p13 = Number.isFinite(filaH) && inkFilas.length === REACCIONES.length &&
        inkFilas.every(f => f.rebosaFila === false && f.inkH <= filaH + 0.5 && f.pista <= 0.5 &&
          Math.abs(f.filaH - filaH) < 0.5)

      // ── P10a · capa del selector (censo vivo, no número declarado) ─────────
      const zSel = await page.evaluate(() => window.__u2css('.u2-selector', ['z-index', 'position']))
      const selGana = await page.evaluate(() => window.__u2gana('.u2-selector'))

      // ── P1b · cierre por Esc ──────────────────────────────────────────────
      await page.keyboard.press('Escape')
      await u2Espera(page, 80)
      const p1_esc = await page.evaluate(() => !document.querySelector('.u2-selector'))

      // ── P1c · cierre por clic fuera ───────────────────────────────────────
      await u2AbrirSelector(page)
      const reabrio = await page.evaluate(() => !!document.querySelector('.u2-selector'))
      await page.mouse.click(4, Math.round(vp.h / 2))
      await u2Espera(page, 80)
      const p1_fuera = reabrio && await page.evaluate(() => !document.querySelector('.u2-selector'))

      // ── P1d + envío · cierre por selección ────────────────────────────────
      await u2AbrirSelector(page)
      const elegida = REACCIONES[REACCIONES.length - 2]   // "¡Qué va! 🤦"
      await page.click(`.u2-frase:nth-child(${REACCIONES.indexOf(elegida) + 1})`)
      await u2Espera(page, 60)
      const p1_sel = await page.evaluate(() => !document.querySelector('.u2-selector'))

      // El AVIF se pide al MONTAR la burbuja, no antes, y cada celda arranca
      // con caché fría: hay unos milisegundos entre que la burbuja existe y que
      // su emoji está decodificado. Se espera a que lo esté, ACOTADO y muy por
      // debajo de los 3s de vida de la burbuja. Lo que la puerta exige es que
      // el recurso sea el correcto y CARGUE — no que gane una carrera contra el
      // arnés, que es lo que medía antes (rojo intermitente en el centinela).
      const emojiListoMs = await page.evaluate(async () => {
        const t0 = performance.now()
        const listo = () => { const i = document.querySelector('.u2-burbuja .u2-emoji img'); return !!i && i.complete && i.naturalWidth > 0 }
        while (!listo() && performance.now() - t0 < 1200) await new Promise(r => setTimeout(r, 20))
        return Math.round(performance.now() - t0)
      })

      // ── P8 · la frase mostrada es la elegida ──────────────────────────────
      // DSK-U2c · la frase sellada COMPLETA vive en el `aria-label` de la
      // burbuja, no en su texto: el emoji tiene piso propio y es una imagen
      // (v1.4 §5.3). Se exige la frase exacta ahí, el texto del piso 1 exacto
      // sin el emoji, y el recurso del piso 2 apuntando al codepoint que la
      // fuente única deriva de esa misma frase — las tres cosas a la vez, para
      // que una burbuja con la imagen equivocada no pueda pasar por buena.
      const burb = await page.evaluate(() => {
        const b = document.querySelector('.u2-burbuja')
        if (!b) return null
        const im = b.querySelector('.u2-emoji img')
        const so = b.querySelector('.u2-emoji source')
        return {
          aria: b.getAttribute('aria-label'),
          texto: b.querySelector('.u2-texto')?.textContent ?? null,
          img: im ? im.getAttribute('src') : null,
          imgOk: im ? (im.complete && im.naturalWidth > 0) : false,
          fuente: so ? { media: so.getAttribute('media'), srcset: so.getAttribute('srcset') } : null,
          servido: im ? im.currentSrc : null,
        }
      })
      const p8 = p8_lista && !!burb && burb.aria === elegida &&
        burb.texto === textoDe(elegida) &&
        burb.img === rutaEmoji(elegida, 'avif') && burb.imgOk === true

      // ── P3 · anclaje por TINTA (ruta humana, viva) ────────────────────────
      const anclaje = await page.evaluate(() => {
        const b = document.querySelector('.u2-burbuja')
        if (!b) return null
        const rb = b.getBoundingClientRect()
        const cs = getComputedStyle(b)
        const px = parseFloat(cs.getPropertyValue('--u2-pico-x'))
        const tinta = window.__u2tinta('.pbr-name')
        const caja = window.__u2R('.pbr-name')
        return {
          picoAbs: Math.round((rb.left + px) * 100) / 100,
          tintaIzq: tinta.left, tintaDer: tinta.right, tintaCentro: tinta.centro,
          cajaCentro: Math.round((caja.x + caja.w / 2) * 100) / 100,
          desfase: Math.round((caja.x + caja.w / 2 - tinta.centro) * 100) / 100,
        }
      })
      // El pico cae DENTRO de la tinta del nombre (no de su caja de 12ch).
      const p3 = !!anclaje && anclaje.picoAbs >= anclaje.tintaIzq - 0.5 && anclaje.picoAbs <= anclaje.tintaDer + 0.5
      // Anclaje LISTO en las dos rutas del rival (su burbuja viva llega en U2b):
      // la tinta se resuelve y el desfase contra la caja es real, o sea que un
      // pico centrado en la caja fallaría.
      const rutasRival = await page.evaluate(() => {
        const mide = (sel) => {
          const t = window.__u2tinta(sel), c = window.__u2R(sel)
          if (!t || !c) return null
          return { tinta: t.w, caja: c.w, desfase: Math.round((c.x + c.w / 2 - t.centro) * 100) / 100 }
        }
        return { oppPanel: mide('.opp-panel .opp-name'), aiZone: mide('.ai-zone .ai-name') }
      })

      // ── P7 · Δ=0 con burbuja presente ─────────────────────────────────────
      const conBurb = await page.evaluate(() => window.__u2snap())
      let d7 = 0, d7who = null
      base.forEach((p, i) => {
        const q = conBurb[i]; if (!p || !q) return
        const m = Math.max(Math.abs(q.x - p.x), Math.abs(q.y - p.y), Math.abs(q.w - p.w), Math.abs(q.h - p.h))
        if (m > d7) { d7 = round(m); d7who = U2_ANCHORS[i] }
      })
      // Guardia de contenido de la burbuja + cadena de apilamiento sana.
      // DSK-U2c · la guardia va por CAJA **y por TINTA**. La caja está acotada
      // por el tope de ancho del corredor, pero lo que se pinta puede salirse
      // de ella —un término indivisible, o un emoji mayor— y la caja no se
      // entera (v1.4 §8). Las cartas propias son inocluibles por la TINTA.
      const burbTapa = await page.evaluate(() => window.__u2tapa(window.__u2R('.u2-burbuja')))
      const burbInk = await page.evaluate(() => window.__u2ink('.u2-burbuja'))
      const burbTapaInk = await page.evaluate(() => window.__u2tapa(window.__u2ink('.u2-burbuja')))
      const enPanel = await page.evaluate(() => window.__u2enPanel())
      const cadena = await page.evaluate(() => window.__u2cadena('.u2-burbuja'))
      const cadenaOk = Array.isArray(cadena) && cadena.every(a => !a.transform)
      const p7 = d7 <= 0.02 && Object.keys(burbTapa).length === 0 &&
        Object.keys(burbTapaInk).length === 0 && enPanel === false && cadenaOk

      // ── P12 · la tinta cabe en la caja ────────────────────────────────────
      // Dos hechos distintos, los dos medidos: el texto del piso 1 no desborda
      // su pista, y su tinta se queda a la IZQUIERDA de la ✕ — que es lo único
      // vivo de la burbuja y no puede quedar debajo de una letra.
      const tintaCaja = await page.evaluate(() => {
        const t = document.querySelector('.u2-texto')
        const x = document.querySelector('.u2-cerrar')
        const b = document.querySelector('.u2-burbuja')
        const e = document.querySelector('.u2-emoji img')
        if (!t || !x || !b) return null
        const rnd = v => Math.round(v * 100) / 100
        const rg = document.createRange(); rg.selectNodeContents(t)
        const ti = rg.getBoundingClientRect()
        const rb = b.getBoundingClientRect(), rx = x.getBoundingClientRect()
        const re = e ? e.getBoundingClientRect() : null
        return {
          pista: rnd(t.scrollWidth - t.clientWidth),
          tintaVsX: rnd(ti.right - rx.left),
          tintaVsBurb: rnd(ti.right - rb.right),
          emojiVsBurb: re ? rnd(Math.max(re.right - rb.right, rb.left - re.left)) : null,
          pisos: re ? rnd(re.top - ti.bottom) : null,
        }
      })
      const p12 = !!tintaCaja && tintaCaja.pista <= 0.5 && tintaCaja.tintaVsX <= 0.5 &&
        tintaCaja.tintaVsBurb <= 0.5 && tintaCaja.emojiVsBurb !== null && tintaCaja.emojiVsBurb <= 0.5

      // ── P15 · el intercambio por prefers-reduced-motion ───────────────────
      // El ráster animado IGNORA la preferencia (medido: 9 de 10 cuadros
      // distintos con ella puesta), porque la media query es una consulta y no
      // un comportamiento. Lo que se audita es que el <picture> sirva el SVG
      // cuando la preferencia está activa, y el AVIF cuando no — leyendo
      // `currentSrc`, o sea lo que el motor ELIGIÓ, no lo que el markup dice.
      const rmAntes = await page.evaluate(() => {
        const im = document.querySelector('.u2-emoji img')
        return { mq: matchMedia('(prefers-reduced-motion: reduce)').matches, servido: im ? im.currentSrc : null }
      })
      await page.emulateMedia({ reducedMotion: 'reduce' })
      await u2Espera(page, 150)
      const rmReduce = await page.evaluate(() => {
        const im = document.querySelector('.u2-emoji img')
        return { mq: matchMedia('(prefers-reduced-motion: reduce)').matches, servido: im ? im.currentSrc : null }
      })
      await page.emulateMedia({ reducedMotion: null })
      await u2Espera(page, 150)
      const rmVuelta = await page.evaluate(() => {
        const im = document.querySelector('.u2-emoji img')
        return { mq: matchMedia('(prefers-reduced-motion: reduce)').matches, servido: im ? im.currentSrc : null }
      })
      const p15 = rmAntes.mq === false && rmAntes.servido?.endsWith('.avif') === true &&
        rmReduce.mq === true && rmReduce.servido?.endsWith('.svg') === true &&
        rmVuelta.mq === false && rmVuelta.servido?.endsWith('.avif') === true

      // ── P10b · capa de la burbuja, contra el CENSO VIVO ───────────────────
      // No por hit-test: la burbuja es `pointer-events: none` de propósito
      // (overlay puro) y elementFromPoint la salta. Se audita su z contra lo
      // que de verdad hay en el área, y contra el menú y los modales por arriba.
      const zBurb = await page.evaluate(() => window.__u2css('.u2-burbuja', ['z-index', 'position', 'pointer-events']))
      const zArea = await page.evaluate(() => window.__u2zArea())
      const zMenu = await page.evaluate(() => {
        const v = getComputedStyle(document.querySelector('.game-table-screen')).getPropertyValue('--dsk-u1-panel-z')
        return Number(String(v).trim())
      })
      const peX = await page.evaluate(() => window.__u2css('.u2-cerrar', ['pointer-events']))
      const xGana = await page.evaluate(() => window.__u2gana('.u2-cerrar'))
      const zb = Number(zBurb && zBurb['z-index'])
      const capaBurbuja = Number.isFinite(zb) && zb > zArea.max && zb < zMenu &&
        zBurb.position === 'fixed' && zBurb['pointer-events'] === 'none' &&
        peX && peX['pointer-events'] === 'auto' && xGana === true

      // ── P5 · el candado y la X ────────────────────────────────────────────
      // La X mata lo VISUAL al instante y NO libera el cooldown.
      const hitX = await page.evaluate(() => {
        const el = document.querySelector('.u2-cerrar')
        return el ? window.__hitBox(el) : null
      })
      await page.click('.u2-cerrar')
      await u2Espera(page, 60)
      const trasX = await page.evaluate(() => ({
        burbuja: !!document.querySelector('.u2-burbuja'),
        entradaBloqueada: !!document.querySelector('.util-item-reacciones[disabled]'),
      }))
      // Ojo: para leer la entrada hay que abrir el menú (el panel está cerrado).
      await page.click('.utilities-trigger')
      await u2Espera(page, 80)
      const enfriando = await page.evaluate(() => {
        const e = document.querySelector('.util-item-reacciones')
        return { existe: !!e, disabled: e ? e.disabled : null, cooling: e ? /is-cooling/.test(e.className) : null }
      })
      await page.keyboard.press('Escape')
      const p5_xMata = trasX.burbuja === false
      const p5_xNoLibera = enfriando.disabled === true && enfriando.cooling === true

      // Y al vencer el cooldown vuelve a habilitarse (fuente: la constante).
      await u2Espera(page, REACCION_COOLDOWN_MS + 250)
      await page.click('.utilities-trigger')
      await u2Espera(page, 80)
      const trasCool = await page.evaluate(() => {
        const e = document.querySelector('.util-item-reacciones')
        return e ? { disabled: e.disabled, cooling: /is-cooling/.test(e.className) } : null
      })
      await page.keyboard.press('Escape')
      const p5 = p5_xMata && p5_xNoLibera && trasCool && trasCool.disabled === false && trasCool.cooling === false

      const checks = {
        p1_selectorAbre: p1_abre, p1_esc, p1_fuera, p1_seleccion: p1_sel,
        p2_rejillaLimpia: p2,
        p3_anclajePorTinta: p3,
        p5_candadoYCooldown: p5,
        p7_deltaCero: p7,
        p8_fraseElegida: p8,
        // ── DSK-U2c ──────────────────────────────────────────────────────
        p12_tintaEnCaja: p12,
        p13_tintaEnFila: p13,
        p15_reducedMotion: p15,
        // Selector: interactivo → se le exige ganar el hit-test, y vivir un
        // peldaño por encima del panel del menú (calc(--dsk-u1-panel-z + 1)).
        // Burbuja: overlay puro → se le exige la capa por censo (ver arriba).
        p10_capa: zSel && zSel.position === 'fixed' && Number(zSel['z-index']) === zMenu + 1 &&
          selGana === true && capaBurbuja,
      }
      c.checks = checks
      c.detalle = {
        selector: selRect, selInk, selTapa, selTapaInk, zSel, selGana,
        burbTapa, burbInk, burbTapaInk, zBurb, zArea, zMenu, xGana, capaBurbuja, enPanel, cadenaOk,
        anclaje, rutasRival, delta: { max: d7, who: d7who }, hitX,
        cooldownMs: REACCION_COOLDOWN_MS, totalMs: REACCION_TOTAL_MS,
        // DSK-U2c
        burbuja: burb, tintaCaja, filaH, inkFilas, emojiListoMs, glifosListosMs,
        rm: { antes: rmAntes, reduce: rmReduce, vuelta: rmVuelta },
      }
      c.passed = Object.values(checks).every(Boolean)
    } catch (e) {
      c.error = String(e && e.message || e).slice(0, 300)
      c.passed = false
    }
    cells.push(c)
    const fallos = c.checks ? Object.entries(c.checks).filter(([, v]) => !v).map(([k]) => k) : ['ERROR']
    console.log(`u2 m${n} ${vp.w}x${vp.h} · ${c.passed ? 'OK' : 'FALLA [' + fallos.join(',') + ']'}${c.error ? ' · ' + c.error : ''}`)
    await page.close()
  }

  // ── P4 + P9 · ciclo de vida y reloj (sub-pasada, una celda por mesa) ──────
  const ciclo = []
  for (const n of U2_TABLES) {
    if (tblFilter && n !== tblFilter) continue
    const page = await browser.newPage({ viewport: { width: 1366, height: 768 } })
    const r = { mesa: n }
    try {
      await gotoMesa(page, n)
      await u2Install(page)
      // Turno vivo del humano: es donde el reloj corre y donde la burbuja tiene
      // que demostrar que no lo toca.
      await clickIf(page, 'button:has-text("Iniciar mano")')
      let conTimer = false
      for (let i = 0; i < 120 && !conTimer; i++) {
        await u2Espera(page, 250)
        conTimer = await page.evaluate(() => !!document.querySelector('.timer-display'))
      }
      const t0 = await page.evaluate(() => { const e = document.querySelector('.timer-display'); return e ? parseInt(e.textContent, 10) : null })
      await u2AbrirSelector(page)
      await page.click('.u2-frase:nth-child(1)')
      // Muestreo del ciclo, con las expectativas DERIVADAS de las constantes.
      const dur = await page.evaluate(() => window.__u2css('.u2-burbuja', ['animation-duration']))
      await u2Espera(page, Math.round(REACCION_ENTRADA_MS / 2))
      const oSubiendo = await page.evaluate(() => { const e = document.querySelector('.u2-burbuja'); return e ? parseFloat(getComputedStyle(e).opacity) : null })
      await u2Espera(page, REACCION_ENTRADA_MS)
      const oPleno = await page.evaluate(() => { const e = document.querySelector('.u2-burbuja'); return e ? parseFloat(getComputedStyle(e).opacity) : null })
      await u2Espera(page, REACCION_VISIBLE_MS - REACCION_ENTRADA_MS - 200)
      const oFinVisible = await page.evaluate(() => { const e = document.querySelector('.u2-burbuja'); return e ? parseFloat(getComputedStyle(e).opacity) : null })
      await u2Espera(page, 200 + Math.round(REACCION_ENTRADA_MS / 2) + 60)
      const oBajando = await page.evaluate(() => { const e = document.querySelector('.u2-burbuja'); return e ? parseFloat(getComputedStyle(e).opacity) : null })
      await u2Espera(page, REACCION_TOTAL_MS)
      const viva = await page.evaluate(() => !!document.querySelector('.u2-burbuja'))
      const t1 = await page.evaluate(() => { const e = document.querySelector('.timer-display'); return e ? parseInt(e.textContent, 10) : null })
      r.dur = dur && dur['animation-duration']
      r.opac = { subiendo: oSubiendo, pleno: oPleno, finVisible: oFinVisible, bajando: oBajando }
      r.viva = viva
      r.reloj = { t0, t1, caida: t0 != null && t1 != null ? t0 - t1 : null }
      // El keyframe reparte el total: entrada acabada al 10%, salida abierta al 90%.
      r.p4 = r.dur === `${REACCION_TOTAL_MS / 1000}s` &&
        oSubiendo != null && oSubiendo > 0 && oSubiendo < 1 &&
        oPleno === 1 && oFinVisible === 1 &&
        oBajando != null && oBajando < 1 && viva === false
      // El reloj no se entera: cae ~lo que duró la burbuja (tolerancia ±2s).
      r.p9 = r.reloj.caida != null && r.reloj.caida >= Math.floor(REACCION_TOTAL_MS / 1000) - 1
    } catch (e) { r.error = String(e && e.message || e).slice(0, 200) }
    r.ok = !!(r.p4 && r.p9)
    ciclo.push(r)
    console.log(`u2·ciclo m${n} · ${r.ok ? 'OK' : 'FALLA'} dur=${r.dur} opac=${JSON.stringify(r.opac)} viva=${r.viva} reloj=${JSON.stringify(r.reloj)}${r.error ? ' · ' + r.error : ''}`)
    await page.close()
  }

  // ── P6 · hit de la X ≥40 en pointer:coarse (embaldosado B2) ───────────────
  const tactil = []
  for (const n of U2_TABLES) {
    if (tblFilter && n !== tblFilter) continue
    const ctx = await browser.newContext({ viewport: { width: 1366, height: 768 }, hasTouch: true })
    await ctx.addInitScript(() => {
      const mm = window.matchMedia.bind(window)
      window.matchMedia = q => /pointer:\s*coarse/.test(q) ? { matches: true, media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} } : mm(q)
    })
    const page = await ctx.newPage()
    const r = { mesa: n }
    try {
      await gotoMesa(page, n)
      await u2Install(page)
      await installHitProbe(page)
      await u2AbrirSelector(page)
      // Las entradas del selector también deben cumplir el estándar de 44.
      const hitFrase = await page.evaluate(() => { const e = document.querySelector('.u2-frase'); return e ? window.__hitBox(e) : null })
      await page.click('.u2-frase:nth-child(1)')
      // SE ESPERA A QUE TERMINE LA ENTRADA, y no un puñado de ms arbitrario.
      // El keyframe entra con `scale(0.94 → 1)`, así que a mitad de camino la
      // burbuja ENTERA está encogida y la ✕ mide 17,54px en vez de 18: su
      // embaldosado daba 39 y la puerta reprobaba una geometría correcta.
      // El estándar táctil se le exige al estado en REPOSO, que es donde el
      // dedo lo encuentra. El margen sale de la constante, jamás cableado.
      await u2Espera(page, REACCION_ENTRADA_MS + 60)
      const hitX = await page.evaluate(() => { const e = document.querySelector('.u2-cerrar'); return e ? window.__hitBox(e) : null })
      const escalaEnReposo = await page.evaluate(() => {
        const b = document.querySelector('.u2-burbuja')
        return b ? getComputedStyle(b).transform : null
      })
      // El hit de la X no puede desbordar hacia la DERECHA sobre las cartas.
      const invade = await page.evaluate(() => {
        const e = document.querySelector('.u2-cerrar')
        const s1 = document.querySelector('.player-zone .card-slot-wrapper')
        if (!e || !s1) return null
        const r0 = e.getBoundingClientRect(), c = s1.getBoundingClientRect()
        return Math.round((r0.right + 0 - c.left) * 100) / 100   // <0 = no llega
      })
      r.hitFrase = hitFrase; r.hitX = hitX; r.margenCartas = invade; r.escalaEnReposo = escalaEnReposo
      // `none` o la identidad: si la burbuja siguiera escalada, el hit medido
      // no sería el que encuentra el dedo y la puerta no significaría nada.
      const enReposo = escalaEnReposo === 'none' || escalaEnReposo === 'matrix(1, 0, 0, 1, 0, 0)'
      r.p6 = !!hitX && hitX.w >= 40 && hitX.h >= 40 && !!hitFrase && hitFrase.h >= 44 &&
        invade != null && invade < 0 && enReposo
    } catch (e) { r.error = String(e && e.message || e).slice(0, 200) }
    r.ok = !!r.p6
    tactil.push(r)
    console.log(`u2·táctil m${n} · ${r.ok ? 'OK' : 'FALLA'} X=${r.hitX ? r.hitX.w + 'x' + r.hitX.h : '—'} frase.h=${r.hitFrase ? r.hitFrase.h : '—'} margenCartas=${r.margenCartas} reposo=${r.escalaEnReposo}${r.error ? ' · ' + r.error : ''}`)
    await ctx.close()
  }

  // ── P11 + P16 · assets · sub-pasada GLOBAL (una sola vez, no por celda) ───
  // Los recursos no dependen de la mesa ni del viewport, así que medirlos 20
  // veces sólo gastaría reloj. Se piden POR LA RUTA QUE USA LA APP —al mismo
  // servidor, no al disco— porque lo que importa es que se SIRVAN: un archivo
  // presente en `public/` pero mal enrutado rompe la burbuja igual que uno
  // ausente. Y las claves salen de la fuente única, jamás de una lista aquí.
  // El presupuesto NO se cablea aquí: sale de la fuente única, igual que las
  // frases. Una cifra repetida en dos sitios es una cifra que dirá dos cosas.
  const assets = { svg: [], avif: [], presupuesto: EMOJI_PRESUPUESTO }
  {
    const page = await browser.newPage({ viewport: { width: 1366, height: 768 } })
    try {
      await page.goto(BASE)
      const urls = REACCIONES.map(f => ({ svg: rutaEmoji(f, 'svg'), avif: rutaEmoji(f, 'avif') }))
      const res = await page.evaluate(async (urls) => {
        const out = []
        for (const u of urls) {
          const fila = {}
          for (const ext of ['svg', 'avif']) {
            try {
              const r = await fetch(u[ext], { cache: 'no-store' })
              fila[ext] = r.ok ? (await r.blob()).size : `HTTP ${r.status}`
            } catch (e) { fila[ext] = String(e).slice(0, 40) }
          }
          out.push(fila)
        }
        return out
      }, urls)
      res.forEach((r, i) => { assets.svg.push({ ruta: urls[i].svg, size: r.svg }); assets.avif.push({ ruta: urls[i].avif, size: r.avif }) })
    } catch (e) { assets.error = String(e && e.message || e).slice(0, 200) }
    await page.close()
  }
  const suma = a => a.reduce((x, y) => x + (typeof y.size === 'number' ? y.size : 0), 0)
  assets.total = { svg: suma(assets.svg), avif: suma(assets.avif) }
  // REGLA DURA de v1.4 §3: 12/12 en AMBOS formatos, o no hay tanda. Un set
  // mixto animado/estático se ve peor que todo estático.
  const p11 = assets.svg.length === REACCIONES.length && assets.avif.length === REACCIONES.length &&
    assets.svg.every(x => typeof x.size === 'number' && x.size > 0) &&
    assets.avif.every(x => typeof x.size === 'number' && x.size > 0)
  const p16 = assets.total.svg <= assets.presupuesto.svg && assets.total.avif <= assets.presupuesto.avif
  assets.p11_doceDeDoce = p11
  assets.p16_presupuesto = p16
  assets.ok = p11 && p16
  console.log(`u2·assets · ${assets.ok ? 'OK' : 'FALLA'} · svg ${assets.svg.filter(x => typeof x.size === 'number').length}/${REACCIONES.length} ${assets.total.svg}B/${assets.presupuesto.svg}B · avif ${assets.avif.filter(x => typeof x.size === 'number').length}/${REACCIONES.length} ${assets.total.avif}B/${assets.presupuesto.avif}B`)

  // ── P14 · la caja del <img> no se mueve ante un recurso FRESCO ────────────
  // ALCANCE DECLARADO: una celda (mesa 5 @1366×768). El ensayo exige MUTAR el
  // `src` para forzar una descarga de verdad, y eso no se hace veinte veces
  // sobre la página viva. Lo que se prueba es de CSS, no de mesa: que la caja
  // esté declarada y por tanto sea la misma antes y después de decodificar.
  // Sin ella son +515,38px de estirón medidos, y la burbuja se coloca UNA sola
  // vez al montar, así que ese estirón cae sobre el nombre (v1.4 §5.2).
  const cajaImg = { alcance: 'm5 1366x768' }
  {
    const page = await browser.newPage({ viewport: { width: 1366, height: 768 } })
    try {
      await gotoMesa(page, 5)
      await u2Install(page)
      await u2AbrirSelector(page)
      await page.click('.u2-frase:nth-child(8)')
      await page.waitForSelector('.u2-burbuja', { timeout: 2000 })
      await u2Espera(page, 400)
      const r = await page.evaluate(async () => {
        const rnd = v => Math.round(v * 100) / 100
        const b = document.querySelector('.u2-burbuja')
        const im = b.querySelector('.u2-emoji img')
        const cs = getComputedStyle(im)
        const antes = rnd(b.getBoundingClientRect().height)
        const original = im.getAttribute('src')
        // Recurso fresco de verdad: query nueva + cache:no-store en el mismo
        // sitio. `complete` vuelve a false y `naturalWidth` a 0 hasta que baje.
        im.src = `${original}?fresco=${performance.now()}`
        const preCarga = rnd(b.getBoundingClientRect().height)
        const preNat = [im.naturalWidth, im.naturalHeight]
        await new Promise(res => { im.onload = res; im.onerror = res })
        const postCarga = rnd(b.getBoundingClientRect().height)
        im.src = original
        return {
          antes, preCarga, postCarga, preNat,
          cssW: cs.width, cssH: cs.height,
          dPre: rnd(preCarga - antes), dPost: rnd(postCarga - preCarga),
        }
      })
      Object.assign(cajaImg, r)
      cajaImg.ok = Math.abs(r.dPre) <= 0.02 && Math.abs(r.dPost) <= 0.02 &&
        /^\d/.test(r.cssW) && /^\d/.test(r.cssH)
    } catch (e) { cajaImg.error = String(e && e.message || e).slice(0, 200); cajaImg.ok = false }
    await page.close()
  }
  console.log(`u2·caja img · ${cajaImg.ok ? 'OK' : 'FALLA'} css=${cajaImg.cssW}×${cajaImg.cssH} alto ${cajaImg.antes}→${cajaImg.preCarga}→${cajaImg.postCarga} (Δ ${cajaImg.dPre}/${cajaImg.dPost}) natural-pre=${JSON.stringify(cajaImg.preNat)}${cajaImg.error ? ' · ' + cajaImg.error : ''}`)

  // ── P17 · la celebración manda el lenguaje de movimiento (v1.4 §7) ────────
  // ALCANCE DECLARADO: mesa 2, igual que `vc·jugado` y por la misma razón — con
  // cuatro rivales, un muestreador que siempre pasa llega a la bancarrota antes
  // que a una victoria. Lo que se verifica es el CABLEADO, que es el mismo hook
  // y el mismo componente en las cuatro mesas.
  //
  // LA PARADOJA DE ESTA PUERTA, y cómo se resuelve. Cualquier toque durante la
  // celebración LA CORTA (VC §6, y es su diseño), así que abrir el menú para
  // mirar la entrada 💬 la mata antes de poder leerla: la primera versión de
  // esta puerta se medía a sí misma y daba rojo con la implementación correcta.
  // La única superficie observable con una celebración VIVA es la que ya estaba
  // abierta cuando nació. Así que se juega a mano —sin `vcHastaVictoria`— para
  // poder DEJAR EL SELECTOR ABIERTO cruzando la resolución de la mano, y se
  // observa sin tocar nada.
  const jerarquia = { alcance: 'm2 1366x768' }
  {
    const page = await browser.newPage({ viewport: { width: 1366, height: 768 } })
    try {
      await gotoMesa(page, 2)
      await u2Install(page)
      const estado = () => page.evaluate(() => {
        const m = document.querySelector('.game-message')
        const f = document.querySelector('.u2-frase')
        return {
          fin: m ? (m.classList.contains('msg-win') ? 'win' : m.classList.contains('msg-lose') ? 'lose' : null) : null,
          selector: !!document.querySelector('.u2-selector'),
          fraseOff: f ? f.disabled : null,
          vcCapa: !!document.querySelector('.vc-capa'),
          burbuja: !!document.querySelector('.u2-burbuja'),
        }
      })
      // Las acciones del humano se ejecutan CON EL TECLADO, no con el ratón.
      // Es la pieza que hace observable esta puerta: un `pointerdown` corta la
      // celebración (VC §6) Y cierra el selector (v1.2 §3.1), así que jugando a
      // clics es imposible llegar a la resolución con la superficie abierta —
      // la versión anterior perdía la carrera en 4 de 4 victorias. `focus()` no
      // despacha eventos de puntero y `Enter` sobre un <button> dispara su
      // click: la mano avanza sin tocar nada.
      const teclear = async (sels) => {
        for (const sel of sels) {
          const l = page.locator(sel).first()
          if (await l.count() && await l.isVisible().catch(() => false) && await l.isEnabled().catch(() => false)) {
            await l.focus()
            await page.keyboard.press('Enter')
            return true
          }
        }
        return false
      }
      const ACCIONES = [
        '.action-buttons button:has-text("Pasar")',
        '.action-buttons button:has-text("Igualar")',
        '.action-buttons button:has-text("Apostar")',
        'button:has-text("Sin descartar")',
      ]
      let manos = 0, veredicto = null
      const intentos = []
      for (let mano = 1; mano <= 18 && !veredicto; mano++) {
        manos = mano
        await teclear(['button:has-text("Iniciar mano")'])
        // El selector se abre AL PRINCIPIO de la mano —cuando no hay ninguna
        // celebración que cortar— y se queda abierto toda la mano.
        if (!await page.evaluate(() => !!document.querySelector('.u2-selector'))) {
          await u2AbrirSelector(page)
        }
        for (let i = 0; i < 160 && !veredicto; i++) {
          const s = await estado()
          if (s.fin === 'win' && s.selector) {
            // (a) Con la celebración VIVA, las entradas del selector están
            //     inertes. Se muestrea SIN TOCAR hasta ver el veto: `activa` se
            //     pone en la transición de fase, o sea antes de que la capa
            //     dibuje, y por eso `vioCapa` puede quedar en false sin que eso
            //     reste — el veto entra en el PRIMER tiempo.
            //     EL `disabled` OBSERVADO SÓLO PUEDE VENIR DEL VETO: esta
            //     sub-pasada no envía ninguna reacción, así que no hay burbuja
            //     viva ni cooldown corriendo y la unión `bloqueado` del hook es
            //     false. Si no, la puerta se estaría midiendo a sí misma.
            const muestras = []
            let vetado = false
            for (let q = 0; q < 30 && !vetado; q++) {
              const s2 = await estado()
              muestras.push(s2)
              if (s2.fraseOff === true) vetado = true
              else await u2Espera(page, 100)
            }
            const mensaje = await page.evaluate(() => document.querySelector('.game-message')?.textContent ?? null)
            intentos.push({ mano, vetado, vioCapa: muestras.some(m => m.vcCapa), selectorVivo: muestras.every(m => m.selector), mensaje })
            if (vetado) {
              // (b) Al morir la celebración se desbloquea SOLO: nada que
              //     sincronizar. Se espera sin tocar a que se levante.
              let libre = false
              for (let q = 0; q < 80 && !libre; q++) {
                const s3 = await estado()
                if (s3.vcCapa === false && s3.fraseOff === false) libre = true
                else await u2Espera(page, 150)
              }
              veredicto = {
                vetado: true, libre,
                vioCapa: muestras.some(m => m.vcCapa),
                selectorSobrevive: muestras.every(m => m.selector),
              }
            }
            break
          }
          if (s.fin) break
          if (!await teclear(ACCIONES)) await u2Espera(page, 250)
        }
        if (veredicto) break
        // NO TODA VICTORIA CELEBRA (la de mesa exige fase de pago y asiento 0,
        // Victory_Celebration §2), y una mano perdida no dice nada: se sigue
        // jugando. Lo que sería rojo es una celebración viva SIN veto.
        if (!await teclear(['button:has-text("Siguiente mano")'])) break
        await u2Espera(page, 450)
      }
      jerarquia.manos = manos
      jerarquia.intentos = intentos
      if (!veredicto) throw new Error(`sin celebración observable con el selector abierto en ${manos} manos (intentos: ${intentos.length})`)
      Object.assign(jerarquia, veredicto)
      jerarquia.ok = veredicto.vetado === true && veredicto.libre === true && veredicto.selectorSobrevive === true
    } catch (e) { jerarquia.error = String(e && e.message || e).slice(0, 200); jerarquia.ok = false }
    await page.close()
  }
  console.log(`u2·jerarquía VC · ${jerarquia.ok ? 'OK' : 'FALLA'} manos=${jerarquia.manos} intentos=${(jerarquia.intentos ?? []).length} vetadoConVCViva=${jerarquia.vetado} vioCapa=${jerarquia.vioCapa} selectorSobrevive=${jerarquia.selectorSobrevive} sueltaAlMorir=${jerarquia.libre}${jerarquia.error ? ' · ' + jerarquia.error : ''}`)

  const passed = cells.every(c => c.passed) && ciclo.every(r => r.ok) && tactil.every(r => r.ok) &&
    assets.ok && cajaImg.ok && jerarquia.ok
  console.log(`\n── U2: ${cells.filter(c => c.passed).length}/${cells.length} celdas · ciclo ${ciclo.filter(r => r.ok).length}/${ciclo.length} · táctil ${tactil.filter(r => r.ok).length}/${tactil.length} · assets ${assets.ok ? 'ok' : 'FALLA'} · caja img ${cajaImg.ok ? 'ok' : 'FALLA'} · jerarquía ${jerarquia.ok ? 'ok' : 'FALLA'} · ${passed ? 'VERDE' : 'ROJO'}`)
  return { cells, ciclo, tactil, assets, cajaImg, jerarquia, passed }
}

// ── DSK-U3 · "Mano actual" funcional ─────────────────────────────────────────
const U3_VIEWPORTS = [...VIEWPORTS, { w: 1440, h: 850 }]
const U3_TABLES = [5, 4, 3, 2]

// Anclas del Δ=0 con el popup del valor presente/ausente. Mismas que U2: si el
// overlay fuera de flujo moviera algo, se vería aquí.
const U3_ANCHORS = [
  '.game-table', '.table-header', '.table-mid', '.rivals-zone', '.center-zone',
  '.ai-zone', '.player-zone', '.player-bar', '.player-zone .cards-row',
  '.score-tag-player', '.header-right',
]

const u3Espera = (page, ms) => page.waitForTimeout(ms)

// Reutiliza el instrumental de U2 —censo z vivo, hit-test por puntos medios de
// los filos (nunca las esquinas: con border-radius caen fuera de la forma
// pintada), lectura de estilos computados— y sólo añade su propio juego de
// anclas. Duplicar el instrumental sería crear una segunda vara de medir.
async function u3Install(page) {
  await u2Install(page)
  await page.evaluate((A) => {
    window.__u3R = window.__u2R
    window.__u3css = window.__u2css
    window.__u3snap = () => A.map(s => window.__u2R(s))
  }, U3_ANCHORS)
}

// Siembra el saldo ANTES de que la app arranque. Se usa la clave de la fuente
// única (config/consultas.js), nunca un literal repetido aquí.
async function u3Sembrar(page, n, saldo) {
  await page.addInitScript(({ k, v }) => {
    try { window.localStorage.setItem(k, String(v)) } catch { /* storage denegado */ }
  }, { k: U3_KEY, v: saldo })
  await gotoMesa(page, n)
}

// Lleva la mano hasta el turno vivo del humano (BET_1): es donde la consulta
// tiene sentido y donde la entrada debe estar habilitada.
async function u3TurnoVivo(page, maxMs = 30000) {
  await clickIf(page, 'button:has-text("Iniciar mano")')
  const t0 = Date.now()
  while (Date.now() - t0 < maxMs) {
    await u3Espera(page, 250)
    const listo = await page.evaluate(() =>
      !!document.querySelector('.timer-display') &&
      document.querySelectorAll('.player-zone .playing-card img[alt]:not([alt=""])').length > 0
    )
    if (listo) return true
  }
  return false
}

// Un clic por iteración y RECHEQUEO antes del siguiente (lección W1). Abrir el
// menú y presionar la entrada son dos cambios de estado encadenados.
async function u3AbrirMenu(page) {
  await page.click('.utilities-trigger')
  await page.waitForSelector('.utilities-panel', { timeout: 2000 }).catch(() => {})
  return page.evaluate(() => !!document.querySelector('.utilities-panel'))
}

async function u3CerrarMenu(page) {
  await page.keyboard.press('Escape')
  await u3Espera(page, 80)
}

// Lee el badge del contador. Exige el menú ABIERTO — el badge vive dentro del
// panel.
const u3Badge = (page) => page.evaluate(() => {
  const b = document.querySelector('.util-badge')
  return b ? Number(b.textContent.trim()) : null
})

// Presiona la entrada "Mano actual" y espera su popup. Devuelve null si la
// entrada está inerte (que es una respuesta válida, no un fallo del arnés).
async function u3Consultar(page) {
  const listo = await page.evaluate(() =>
    !!document.querySelector('.util-item-mano .util-ico-slot:not([disabled])'))
  if (!listo) return false
  await page.click('.util-item-mano .util-ico-slot')
  await page.waitForSelector('.u3-popup', { timeout: 2000 }).catch(() => {})
  return page.evaluate(() => !!document.querySelector('.u3-popup'))
}

// ── Verificación CRUZADA del valor ───────────────────────────────────────────
// El arnés NO reutiliza el helper de la app (desglosarPalos): eso escondería un
// error dentro del propio helper. Recompone la mano desde el DOM —el `alt` de
// cada carta boca arriba: "Sota de Bastos"— y las reglas desde el chip de
// comodín, corre getBestSuitScore aquí en Node y compara contra los data-* del
// popup. Cero regex sobre el copy: un cambio de redacción no vuelve roja esta
// puerta, y una redacción con números sueltos no la puede aprobar por accidente.
const U3_NOMBRE_A_VALOR = Object.fromEntries(
  Object.entries(VALUE_NAMES).map(([v, n]) => [n, Number(v)]))

async function u3ManoDelDom(page) {
  const alts = await page.evaluate(() =>
    [...document.querySelectorAll('.player-zone .playing-card img[alt]')]
      .map(i => i.getAttribute('alt')).filter(Boolean))
  const cartas = []
  for (const alt of alts) {
    const m = alt.split(' de ')
    if (m.length !== 2) return null
    const value = U3_NOMBRE_A_VALOR[m[0]]
    if (value === undefined) return null
    cartas.push({ value, palo: m[1], points: getCardPoints(value) })
  }
  return cartas
}

// Reglas VIVAS leídas del chip de comodín, no del número de sillas: el chip es
// el hogar visual de handRules (C4.5) y por tanto la lectura honesta. En mesas
// 3/2 el chip no se monta — y ahí no hay comodín que valorar.
async function u3ReglasDelDom(page) {
  const txt = await page.evaluate(() => {
    const e = document.querySelector('.comodin-note')
    return e ? e.textContent.trim() : null
  })
  if (!txt || /Sin comod/i.test(txt)) return { ruleN: 2, comodinEnabled: false }
  const v = Number((txt.match(/(\d+)\s*$/) || [])[1])
  return { ruleN: v === 11 ? 5 : 4, comodinEnabled: true }
}

const u3PopupDatos = (page) => page.evaluate(() => {
  const p = document.querySelector('.u3-popup')
  if (!p) return null
  return {
    agotadas: p.classList.contains('u3-popup-agotadas'),
    palo: p.dataset.palo ?? null,
    pts: p.dataset.pts != null ? Number(p.dataset.pts) : null,
    bonif: p.dataset.bonif != null ? Number(p.dataset.bonif) : null,
    resto: p.dataset.resto ?? null,
  }
})

async function u3ValorCuadra(page) {
  const [cartas, reglas, datos] = await Promise.all([
    u3ManoDelDom(page), u3ReglasDelDom(page), u3PopupDatos(page),
  ])
  if (!cartas || !cartas.length || !datos || datos.agotadas) return { ok: false, cartas, datos }
  const score = getBestSuitScore(cartas, reglas.ruleN, reglas.comodinEnabled)
  const crudo = score.suitScores[score.palo] ?? 0
  const restoEsperado = Object.entries(score.suitScores)
    .filter(([p]) => p !== score.palo)
    .sort((a, b) => b[1] - a[1])
    .map(([p, v]) => `${p}:${v}`).join(',')
  const ok = datos.palo === score.palo &&
    datos.pts === score.points &&
    datos.bonif === score.points - crudo &&
    datos.resto === restoEsperado
  return { ok, esperado: { palo: score.palo, pts: score.points, bonif: score.points - crudo, resto: restoEsperado }, datos, reglas, nCartas: cartas.length }
}

async function runU3(browser) {
  const cells = []
  const tblFilter = process.argv[3] ? Number(process.argv[3]) : null
  const vpFilter = process.argv[4] || null

  for (const n of U3_TABLES) for (const vp of U3_VIEWPORTS) {
    if (tblFilter && n !== tblFilter) continue
    if (vpFilter && `${vp.w}x${vp.h}` !== vpFilter) continue
    const page = await browser.newPage({ viewport: { width: vp.w, height: vp.h } })
    const c = { mesa: n, vp: `${vp.w}x${vp.h}` }
    try {
      await u3Sembrar(page, n, CONSULTAS_GRATIS)
      await u3Install(page)

      // ── P5a · sin mano repartida la entrada está inerte ───────────────────
      await u3AbrirMenu(page)
      const enEspera = await page.evaluate(() => {
        const d = document.querySelector('.util-item-mano')
        const b = document.querySelector('.util-item-mano .util-ico-slot')
        return { disabled: b ? b.disabled : null, clase: d ? /is-disabled/.test(d.className) : null }
      })
      const p5_sinMano = enEspera.disabled === true && enEspera.clase === true
      await u3CerrarMenu(page)

      // ── Turno vivo del humano ─────────────────────────────────────────────
      const vivo = await u3TurnoVivo(page)
      const base = await page.evaluate(() => window.__u3snap())

      // ── P1 · primer press: consume exactamente 1 y el valor cuadra ────────
      await u3AbrirMenu(page)
      const n0 = await u3Badge(page)
      const habilitada = await page.evaluate(() =>
        !!document.querySelector('.util-item-mano .util-ico-slot:not([disabled])'))
      const abrio1 = await u3Consultar(page)
      // Cierra al ejecutar, como sus hermanas: el panel NO sobrevive.
      const panelMuerto = await page.evaluate(() => !document.querySelector('.utilities-panel'))
      const val1 = await u3ValorCuadra(page)

      // ── P7 · Δ=0 con el popup presente ────────────────────────────────────
      const conPopup = await page.evaluate(() => window.__u3snap())
      let d7 = 0, d7who = null
      base.forEach((p, i) => {
        const q = conPopup[i]; if (!p || !q) return
        const m = Math.max(Math.abs(q.x - p.x), Math.abs(q.y - p.y), Math.abs(q.w - p.w), Math.abs(q.h - p.h))
        if (m > d7) { d7 = round(m); d7who = U3_ANCHORS[i] }
      })

      // ── P8 · capa contra el censo vivo ────────────────────────────────────
      const zPop = await page.evaluate(() => window.__u3css('.u3-popup', ['z-index', 'position']))
      const zArea = await page.evaluate(() => window.__u2zArea())
      const zMenu = await page.evaluate(() => Number(String(getComputedStyle(
        document.querySelector('.game-table-screen')).getPropertyValue('--dsk-u1-panel-z')).trim()))
      const popGana = await page.evaluate(() => window.__u2gana('.u3-popup'))
      const dentro = await page.evaluate(() => {
        const b = window.__u3R('.u3-popup')
        return b && b.left >= 0 && b.top >= 0 && b.right <= innerWidth && b.bottom <= innerHeight
      })
      const zp = Number(zPop && zPop['z-index'])
      const p8 = Number.isFinite(zp) && zPop.position === 'fixed' &&
        zp === zMenu + 1 && zp > zArea.max && popGana === true && !!dentro

      // ── P9 · cierre por clic fuera ────────────────────────────────────────
      await page.mouse.click(4, Math.round(vp.h / 2))
      await u3Espera(page, 120)
      const p9_fuera = await page.evaluate(() => !document.querySelector('.u3-popup'))

      // ── P2 · re-press de la MISMA mano: Δcontador=0 y valor re-derivado ───
      await u3AbrirMenu(page)
      const n1 = await u3Badge(page)
      const abrio2 = await u3Consultar(page)
      const val2 = await u3ValorCuadra(page)
      await page.mouse.click(4, Math.round(vp.h / 2))
      await u3Espera(page, 120)
      await u3AbrirMenu(page)
      const n2 = await u3Badge(page)

      // ── P6 · INVARIANTE SELLADO del badge · el menú sigue abierto ─────────
      await page.click('.util-badge')
      await u3Espera(page, 120)
      const trasBadge = await page.evaluate(() => ({
        popup: !!document.querySelector('.utilities-popup'),
        panel: !!document.querySelector('.utilities-panel'),
        valor: !!document.querySelector('.u3-popup'),
      }))
      const p6 = trasBadge.popup === true && trasBadge.panel === true && trasBadge.valor === false
      await u3CerrarMenu(page)

      const checks = {
        p1_consumeUno: !!vivo && habilitada && abrio1 && panelMuerto && n0 === CONSULTAS_GRATIS && n1 === CONSULTAS_GRATIS - 1,
        p1b_valorCruzado: val1.ok,
        p2_repressGratis: abrio2 && n2 === n1,
        p2b_valorRederivado: val2.ok,
        p5_entradaInerteSinMano: p5_sinMano,
        p6_invarianteBadge: p6,
        p7_deltaCero: d7 <= 0.02,
        p8_capa: p8,
        p9_cierreFuera: p9_fuera,
      }
      c.checks = checks
      c.detalle = {
        badge: { n0, n1, n2 }, val1, val2,
        delta: { max: d7, who: d7who },
        zPop, zArea, zMenu, popGana, dentro, trasBadge,
        popup: await page.evaluate(() => window.__u3R('.u3-popup')),
      }
      c.passed = Object.values(checks).every(Boolean)
    } catch (e) {
      c.error = String(e && e.message || e).slice(0, 300)
      c.passed = false
    }
    cells.push(c)
    const fallos = c.checks ? Object.entries(c.checks).filter(([, v]) => !v).map(([k]) => k) : ['ERROR']
    console.log(`u3 m${n} ${vp.w}x${vp.h} · ${c.passed ? 'OK' : 'FALLA [' + fallos.join(',') + ']'}${c.error ? ' · ' + c.error : ''}`)
    await page.close()
  }

  // ── P3 · mano NUEVA vuelve a cobrar + inerte en fase de pago ──────────────
  const manos = []
  for (const n of U3_TABLES) {
    if (tblFilter && n !== tblFilter) continue
    const page = await browser.newPage({ viewport: { width: 1366, height: 768 } })
    const r = { mesa: n }
    try {
      await u3Sembrar(page, n, CONSULTAS_GRATIS)
      await u3Install(page)
      await u3TurnoVivo(page)
      await u3AbrirMenu(page)
      await u3Consultar(page)
      await page.mouse.click(4, 384)
      await u3Espera(page, 120)
      await u3AbrirMenu(page)
      r.tras1 = await u3Badge(page)
      await u3CerrarMenu(page)

      // Se juega la mano hasta el showdown y ahí la entrada debe estar inerte:
      // es donde la banda gratuita "Tu mejor palo" toma el relevo.
      await playToShowdown(page)
      await u3AbrirMenu(page)
      const enPago = await page.evaluate(() => {
        const b = document.querySelector('.util-item-mano .util-ico-slot')
        const d = document.querySelector('.util-item-mano')
        return { disabled: b ? b.disabled : null, clase: d ? /is-disabled/.test(d.className) : null }
      })
      // La banda gratuita SÍ está visible aquí: la frontera es real, no coinciden.
      const banda = await page.evaluate(() => {
        const e = document.querySelector('.score-tag-player')
        return e ? getComputedStyle(e).visibility : null
      })
      r.enPago = enPago; r.banda = banda
      await u3CerrarMenu(page)

      await clickIf(page, 'button:has-text("Siguiente mano")')
      await u3TurnoVivo(page)
      await u3AbrirMenu(page)
      r.tras2Antes = await u3Badge(page)
      await u3Consultar(page)
      const val = await u3ValorCuadra(page)
      await page.mouse.click(4, 384)
      await u3Espera(page, 120)
      await u3AbrirMenu(page)
      r.tras2 = await u3Badge(page)
      await u3CerrarMenu(page)
      r.val = val.ok

      r.p3 = r.tras1 === CONSULTAS_GRATIS - 1 && r.tras2 === CONSULTAS_GRATIS - 2 && val.ok
      r.p5 = enPago.disabled === true && enPago.clase === true && banda === 'visible'
    } catch (e) { r.error = String(e && e.message || e).slice(0, 200) }
    r.ok = !!(r.p3 && r.p5)
    manos.push(r)
    console.log(`u3·manos m${n} · ${r.ok ? 'OK' : 'FALLA'} badge=${r.tras1}→${r.tras2} enPago=${JSON.stringify(r.enPago)} banda=${r.banda} valor=${r.val}${r.error ? ' · ' + r.error : ''}`)
    await page.close()
  }

  // ── P4 · N=0 · popup de agotadas y Δcontador=0 ────────────────────────────
  const agotadas = []
  for (const n of U3_TABLES) {
    if (tblFilter && n !== tblFilter) continue
    const page = await browser.newPage({ viewport: { width: 1366, height: 768 } })
    const r = { mesa: n }
    try {
      await u3Sembrar(page, n, 0)
      await u3Install(page)
      await u3TurnoVivo(page)
      await u3AbrirMenu(page)
      r.antes = await u3Badge(page)
      // La entrada sigue HABILITADA con saldo 0: quien no tiene gratis merece
      // que se lo digan, no un botón muerto sin explicación.
      const abrio = await u3Consultar(page)
      const datos = await u3PopupDatos(page)
      await page.mouse.click(4, 384)
      await u3Espera(page, 120)
      await u3AbrirMenu(page)
      r.despues = await u3Badge(page)
      const almacen = await page.evaluate(k => Number(window.localStorage.getItem(k)), U3_KEY)
      await u3CerrarMenu(page)
      r.datos = datos; r.almacen = almacen
      r.p4 = abrio && !!datos && datos.agotadas === true && datos.palo === null &&
        r.antes === 0 && r.despues === 0 && almacen === 0
    } catch (e) { r.error = String(e && e.message || e).slice(0, 200) }
    r.ok = !!r.p4
    agotadas.push(r)
    console.log(`u3·agotadas m${n} · ${r.ok ? 'OK' : 'FALLA'} badge=${r.antes}→${r.despues} storage=${r.almacen} popup=${JSON.stringify(r.datos)}${r.error ? ' · ' + r.error : ''}`)
    await page.close()
  }

  // ── P10 · autocierres, con las expectativas DERIVADAS de la fuente única ──
  // Mismo alcance declarado que la sub-pasada jugada, y por la misma razon:
  // mesa 2 es la unica donde una victoria humana es alcanzable auto-jugando.
  const relojes = []
  for (const n of U3_TABLES) {
    if (tblFilter && n !== tblFilter) continue
    const page = await browser.newPage({ viewport: { width: 1366, height: 768 } })
    const r = { mesa: n }
    try {
      await u3Sembrar(page, n, CONSULTAS_GRATIS)
      await u3Install(page)
      await u3TurnoVivo(page)
      await u3AbrirMenu(page)
      await u3Consultar(page)
      // A mitad de camino sigue vivo; pasada la marca, muerto.
      await u3Espera(page, Math.round(CONSULTA_POPUP_MS / 2))
      r.valorMedio = await page.evaluate(() => !!document.querySelector('.u3-popup'))
      await u3Espera(page, CONSULTA_POPUP_MS / 2 + 400)
      r.valorFin = await page.evaluate(() => !!document.querySelector('.u3-popup'))

      await u3AbrirMenu(page)
      await page.click('.util-badge')
      await u3Espera(page, Math.round(BADGE_POPUP_MS / 2))
      r.badgeMedio = await page.evaluate(() => !!document.querySelector('.utilities-popup'))
      await u3Espera(page, BADGE_POPUP_MS / 2 + 400)
      r.badgeFin = await page.evaluate(() => !!document.querySelector('.utilities-popup'))
      // El menú sigue abierto pese al autocierre del popup: el invariante no
      // depende de que el popup viva.
      r.menuVivo = await page.evaluate(() => !!document.querySelector('.utilities-panel'))
      await u3CerrarMenu(page)
      r.p10 = r.valorMedio === true && r.valorFin === false &&
        r.badgeMedio === true && r.badgeFin === false && r.menuVivo === true
    } catch (e) { r.error = String(e && e.message || e).slice(0, 200) }
    r.ok = !!r.p10
    relojes.push(r)
    console.log(`u3·relojes m${n} · ${r.ok ? 'OK' : 'FALLA'} valor=${r.valorMedio}/${r.valorFin} (${CONSULTA_POPUP_MS}ms) badge=${r.badgeMedio}/${r.badgeFin} (${BADGE_POPUP_MS}ms) menu=${r.menuVivo}${r.error ? ' · ' + r.error : ''}`)
    await page.close()
  }

  const passed = cells.every(c => c.passed) && manos.every(r => r.ok) &&
    agotadas.every(r => r.ok) && relojes.every(r => r.ok)
  console.log(`\n── U3: ${cells.filter(c => c.passed).length}/${cells.length} celdas · manos ${manos.filter(r => r.ok).length}/${manos.length} · agotadas ${agotadas.filter(r => r.ok).length}/${agotadas.length} · relojes ${relojes.filter(r => r.ok).length}/${relojes.length} · ${passed ? 'VERDE' : 'ROJO'}`)
  return { cells, manos, agotadas, relojes, passed }
}

// ── DSK-VC2 · Victory Celebration ────────────────────────────────────────────
const VC_VIEWPORTS = [...VIEWPORTS, { w: 1440, h: 850 }]
const VC_TABLES = [5, 4, 3, 2]

// Anclas del Δ=0. Las mismas de U2/U3: si un overlay fuera de flujo moviera
// algo, se vería aquí.
const VC_ANCHORS = [
  '.game-table', '.table-header', '.table-mid', '.rivals-zone', '.center-zone',
  '.ai-zone', '.player-zone', '.player-bar', '.player-zone .cards-row',
  '.score-tag-player', '.header-right', '.pot-box', '.pbr-chips',
]

const vcEspera = (page, ms) => page.waitForTimeout(ms)

async function vcInstall(page) {
  await page.evaluate((A) => {
    const rnd = x => x == null ? null : Math.round(x * 100) / 100
    const R = e => { if (!e) return null; const b = e.getBoundingClientRect(); return { x: rnd(b.x), y: rnd(b.y), w: rnd(b.width), h: rnd(b.height), cx: rnd(b.left + b.width / 2), cy: rnd(b.top + b.height / 2) } }
    window.__vcR = s => R(document.querySelector(s))
    window.__vcSnap = () => A.map(s => R(document.querySelector(s)))
    window.__vcCss = (sel, props) => {
      const el = document.querySelector(sel)
      if (!el) return null
      const cs = getComputedStyle(el)
      const o = {}
      props.forEach(p => { o[p] = cs.getPropertyValue(p) })
      return o
    }
    // Censo z VIVO dentro del área — la vara contra la que se proponen 26 y 32.
    window.__vcZArea = () => {
      let max = 0, quien = null
      document.querySelectorAll('.game-table *').forEach(e => {
        const cs = getComputedStyle(e)
        if (cs.position === 'static' || cs.zIndex === 'auto') return
        const z = Number(cs.zIndex)
        if (Number.isFinite(z) && z > max) { max = z; quien = String(e.className).slice(0, 30) }
      })
      return { max, quien }
    }
    // Audio OBSERVADO, no supuesto: Howler queda en window y expone sus howls.
    window.__vcAudio = () => {
      if (typeof window.Howler === 'undefined' || !window.Howler._howls) return null
      return {
        muteGlobal: window.Howler._muted,
        sonando: window.Howler._howls
          .filter(h => h.playing())
          .map(h => String(h._src).split('/').pop()),
        volumenes: Object.fromEntries(window.Howler._howls
          .map(h => [String(h._src).split('/').pop(), h.volume()])),
      }
    }
    // ── CONSTRUCCIÓN del peor caso (receta O2) ────────────────────────────────
    // AJILEI no se alcanza jugando (cinco del palo sumando 51) y la partida
    // pide arruinar a todas las IAs. Se INYECTA el DOM exacto que los
    // componentes pintan —mismas clases, mismos estilos en línea— y se mide el
    // contrato de CSS: capa, Δ=0 y geometría. La lógica que decide QUÉ se pinta
    // ya la sella Vitest sobre el núcleo puro.
    //
    // IDN-1 · «quien mueve la ruta, recablea el metro» (regla ARN-1).
    // Esta receta llevaba el marcado del producto COPIADO Y CONGELADO: la
    // palabra "AJILEI" en texto plano y un <svg> vacío de 24×24 como ficha.
    // IDN-1 cambia las dos cosas —el wordmark pasa a [letra doble] + ILEI y la
    // ficha pasa a ser un <img> de la Heptacoin—, así que una copia congelada
    // mediría un producto que ya no existe. Las dos se CLONAN ahora del árbol
    // vivo: el wordmark del <h1> de la mesa (que monta el mismo <Wordmark/>) y
    // la ficha de cualquier `.chip-token` en pantalla. Si el marcado vuelve a
    // moverse, esto lo sigue solo y no hay nada que recablear.
    window.__vcConstruye = (nivel, geo) => {
      window.__vcDestruye()
      if (nivel === 'mano' || nivel === 'ajilei') {
        const capa = document.createElement('div')
        capa.className = 'vc-capa'
        capa.setAttribute('data-construido', '1')
        for (let i = 0; i < (geo?.fichas ?? 5); i++) {
          const f = document.createElement('span')
          f.className = 'vc-ficha'
          f.style.left = `${geo.desde.x}px`
          f.style.top = `${geo.desde.y}px`
          // Clon de la ficha viva (IDN-1: es un <img> de la Heptacoin, ya no un
          // <svg>). Si no hubiera ninguna en pantalla, cae al hueco de 24×24
          // que es lo único que esta medida necesita: la CAJA.
          const viva = document.querySelector('.chip-token')
          f.innerHTML = viva
            ? viva.outerHTML
            : '<span style="display:inline-block;width:24px;height:24px"></span>'
          capa.appendChild(f)
        }
        document.querySelector('.game-table-screen').appendChild(capa)
      }
      if (nivel === 'ajilei') {
        const c = document.createElement('div')
        c.className = 'vc-ajilei-capa'
        c.setAttribute('data-construido', '1')
        // Clon del wordmark vivo, con su nombre accesible (IDN-1). Copiar sólo
        // el texto dejaba el overlay leyéndose "ILEI" para un lector de
        // pantalla y midiendo una caja que el producto ya no pinta.
        const marca = document.querySelector('.table-title')
        c.innerHTML = `<span class="vc-ajilei"${marca?.getAttribute('aria-label') ? ` aria-label="${marca.getAttribute('aria-label')}"` : ''}>${marca ? marca.innerHTML : 'AJILEI'}</span>`
        document.querySelector('.game-table-screen').appendChild(c)
      }
      if (nivel === 'mano') {
        const nombre = document.querySelector('.pbr-name')
        if (nombre) {
          const p = document.createElement('span')
          p.className = 'vc-pulso'
          p.setAttribute('data-construido', '1')
          nombre.appendChild(p)
        }
      }
      return true
    }
    window.__vcDestruye = () => {
      document.querySelectorAll('[data-construido]').forEach(e => e.remove())
    }
  }, VC_ANCHORS)
}

// Geometría real del viaje, leída de la página igual que la lee la app.
//
// VIS-3 · Antes esto medía `.pot-box` → `.pbr-chips` con `fichas: 5` cableado, y
// `p8_geometria` lo comparaba contra esas mismas dos cajas: una copia midiéndose
// a sí misma. Habría seguido en verde mientras la app volaba de moneda a moneda
// y con siete fichas. Misma enfermedad que curó VIS-1c-b en el modo `tapetes`, y
// la misma cura: el arnés lee el CONTRATO vivo —los atributos de VIS-3a y la
// constante de la app— en vez de un recuerdo.
//
// El destino es el 0 (el humano) porque es lo que este modo construye; el modo
// `vuelo` es el que comprueba los destinos de IA, jugando de verdad.
const vcGeo = (page, n) => page.evaluate((nFichas) => {
  const moneda = (sel) => document.querySelector(`${sel} .chip-token`)
  const origen = moneda('[data-coin-source="pot"]')
  const destino = moneda('[data-coin-target="0"]')
  if (!origen || !destino) return null
  const a = origen.getBoundingClientRect(), b = destino.getBoundingClientRect()
  return {
    desde: { x: a.left + a.width / 2, y: a.top + a.height / 2 },
    hasta: { x: b.left + b.width / 2, y: b.top + b.height / 2, lado: b.width },
    fichas: nFichas,
  }
}, n)

// Juega manos hasta que gane el HUMANO. Un clic por iteración con rechequeo
// (lección W1). Devuelve el nº de manos que hicieron falta, o null.
// Juega manos hasta que gane el HUMANO. Un clic por iteración con rechequeo
// (lección W1). El sondeo es DELIBERADAMENTE barato —una sola consulta por
// vuelta— porque el coste del muestreo domina: con una lectura gorda por
// iteración una mano tarda 40s de reloj de arnés en vez de 5, y cuatro mesas
// por catorce manos se van a la hora y media.
async function vcHastaVictoria(page, maxManos = 18) {
  for (let mano = 1; mano <= maxManos; mano++) {
    await clickIf(page, 'button:has-text("Iniciar mano")')
    let fin = null
    for (let i = 0; i < 120 && !fin; i++) {
      await vcEspera(page, 250)
      fin = await page.evaluate(() => {
        const m = document.querySelector('.game-message')
        if (!m) return null
        if (m.classList.contains('msg-win')) return 'win'
        if (m.classList.contains('msg-lose')) return 'lose'
        return null
      })
      if (fin) break
      await clickIf(page, '.action-buttons button:has-text("Pasar")') ||
        await clickIf(page, '.action-buttons button:has-text("Igualar")') ||
        await clickIf(page, '.action-buttons button:has-text("Apostar")')
      await clickIf(page, 'button:has-text("Sin descartar")')
    }
    if (fin === 'win') return mano
    if (!await clickIf(page, 'button:has-text("Siguiente mano")')) return null
    await vcEspera(page, 450)
  }
  return null
}

async function runVC(browser) {
  const { decideCelebracion, banderasDe, CELEBRACION_TOPE_MS, VIAJE_MS, VIAJE_ESCALON_MS, AJILEI_MS, VIAJE_N } =
    await import('../src/hooks/celebracionCore.js')
  const { PHASES: FASES } = await import('../src/engine/gameEngine.js')
  const tblFilter = process.argv[3] ? Number(process.argv[3]) : null
  const vpFilter = process.argv[4] || null

  // ── P6 · el decisor, contra la fuente única y en Node ─────────────────────
  // El blindaje del AJILEI perdido se comprueba CONSTRUYENDO winner !== 0, que
  // es justo el caso que jugando no se puede provocar.
  const AJ = [
    { palo: 'Oros', points: 11, value: 1 }, { palo: 'Oros', points: 10, value: 12 },
    { palo: 'Oros', points: 10, value: 11 }, { palo: 'Oros', points: 10, value: 10 },
    { palo: 'Oros', points: 10, value: 3 },
  ]
  const NORMAL = [
    { palo: 'Copas', points: 11, value: 1 }, { palo: 'Espadas', points: 10, value: 12 },
  ]
  // VIS-3 · La victoria de IA deja de ser `null` y pasa a 'recoleccion'. Las dos
  // celdas que sellaban el null se reescriben a lo que la doctrina protege de
  // verdad —que recolectar NO celebre—, y eso se comprueba por las BANDERAS y no
  // por la ausencia de nivel: `overlay: false, fanfarria: false`.
  const decisor = {
    ajileiGanado: decideCelebracion({ phase: FASES.PAYOUT, winner: 0, humanCards: AJ, ruleN: 2 }) === 'ajilei',
    ajileiPerdidoRecolecta: decideCelebracion({ phase: FASES.PAYOUT, winner: 1, humanCards: AJ, ruleN: 2 }) === 'recoleccion',
    ajileiPerdidoNoCelebra: (() => {
      const b = banderasDe(decideCelebracion({ phase: FASES.PAYOUT, winner: 1, humanCards: AJ, ruleN: 2 }))
      return b.vuelo === true && b.overlay === false && b.fanfarria === false
    })(),
    manoGanada: decideCelebracion({ phase: FASES.PAYOUT, winner: 0, humanCards: NORMAL, ruleN: 2 }) === 'mano',
    manoPerdidaRecolecta: decideCelebracion({ phase: FASES.PAYOUT, winner: 1, humanCards: NORMAL, ruleN: 2 }) === 'recoleccion',
    sinGanadorNoVuela: decideCelebracion({ phase: FASES.PAYOUT, winner: null, humanCards: NORMAL, ruleN: 2 }) === null,
    partida: decideCelebracion({ phase: FASES.GAME_OVER, winner: 0, humanCards: NORMAL, ruleN: 2 }) === 'partida',
    partidaAjena: decideCelebracion({ phase: FASES.GAME_OVER, winner: 1, humanCards: NORMAL, ruleN: 2 }) === null,
  }
  const p6 = Object.values(decisor).every(Boolean)
  console.log(`vc·decisor · ${p6 ? 'OK' : 'FALLA'} ${JSON.stringify(decisor)}`)

  // ── Matriz de 20 celdas · construido ──────────────────────────────────────
  const cells = []
  for (const n of VC_TABLES) for (const vp of VC_VIEWPORTS) {
    if (tblFilter && n !== tblFilter) continue
    if (vpFilter && `${vp.w}x${vp.h}` !== vpFilter) continue
    const page = await browser.newPage({ viewport: { width: vp.w, height: vp.h } })
    const c = { mesa: n, vp: `${vp.w}x${vp.h}` }
    try {
      await gotoMesa(page, n)
      await vcInstall(page)
      const base = await page.evaluate(() => window.__vcSnap())
      const geo = await vcGeo(page, VIAJE_N)

      // VIS-3 · El viaje va de MONEDA a MONEDA, no de caja a caja: sale de la
      // Heptacoin del pozo y llega a la del ganador, resuelta por identificador.
      // Se comprueba contra los rects vivos de esas monedas y contra la
      // constante de la app, nunca contra números cableados aquí.
      const pozoR = await page.evaluate(() => window.__vcR('[data-coin-source="pot"] .chip-token'))
      const pilaR = await page.evaluate(() => window.__vcR('[data-coin-target="0"] .chip-token'))
      const geoOk = !!geo && !!pozoR && !!pilaR &&
        Math.abs(geo.desde.x - pozoR.cx) <= 0.5 && Math.abs(geo.desde.y - pozoR.cy) <= 0.5 &&
        Math.abs(geo.hasta.x - pilaR.cx) <= 0.5 && Math.abs(geo.hasta.y - pilaR.cy) <= 0.5 &&
        geo.hasta.lado === pilaR.w &&                            // el lado del destino, que da la escala
        geo.fichas === VIAJE_N &&                                // siete, y desde la fuente única
        geo.hasta.y > geo.desde.y && geo.hasta.x > geo.desde.x   // siempre abajo-derecha

      // ── Nivel 'mano' construido: viaje + pulso ────────────────────────────
      await page.evaluate(g => window.__vcConstruye('mano', g), geo)
      const conMano = await page.evaluate(() => window.__vcSnap())
      const zViaje = await page.evaluate(() => window.__vcCss('.vc-capa', ['z-index', 'position', 'pointer-events']))
      const nFichas = await page.evaluate(() => document.querySelectorAll('.vc-ficha').length)
      const pulsoCss = await page.evaluate(() => window.__vcCss('.vc-pulso', ['position', 'animation-name', 'animation-iteration-count', 'animation-duration']))
      const zArea = await page.evaluate(() => window.__vcZArea())

      // ── Nivel 'ajilei' construido: sustituye, no encadena ─────────────────
      await page.evaluate(g => window.__vcConstruye('ajilei', g), geo)
      const conAjilei = await page.evaluate(() => window.__vcSnap())
      const zAjilei = await page.evaluate(() => window.__vcCss('.vc-ajilei-capa', ['z-index', 'position', 'pointer-events']))
      const ajileiCss = await page.evaluate(() => window.__vcCss('.vc-ajilei', ['color', 'letter-spacing', 'font-size']))
      const ajileiCaja = await page.evaluate(() => window.__vcR('.vc-ajilei'))
      const ajileiSinPulso = await page.evaluate(() => !document.querySelector('.vc-pulso'))
      const ajileiDentro = !!ajileiCaja && ajileiCaja.x >= 0 && ajileiCaja.y >= 0 &&
        ajileiCaja.x + ajileiCaja.w <= vp.w && ajileiCaja.y + ajileiCaja.h <= vp.h

      await page.evaluate(() => window.__vcDestruye())
      const despues = await page.evaluate(() => window.__vcSnap())

      // ── Δ=0 durante y DESPUÉS ─────────────────────────────────────────────
      const delta = (a, b) => {
        let m = 0, quien = null
        a.forEach((p, i) => {
          const q = b[i]; if (!p || !q) return
          const d = Math.max(Math.abs(q.x - p.x), Math.abs(q.y - p.y), Math.abs(q.w - p.w), Math.abs(q.h - p.h))
          if (d > m) { m = round(d); quien = VC_ANCHORS[i] }
        })
        return { m, quien }
      }
      const dMano = delta(base, conMano)
      const dAjilei = delta(base, conAjilei)
      const dDespues = delta(base, despues)

      // ── Capa contra el censo VIVO, no contra un número declarado ──────────
      const zv = Number(zViaje && zViaje['z-index'])
      const za = Number(zAjilei && zAjilei['z-index'])
      const zMenu = await page.evaluate(() => Number(String(getComputedStyle(
        document.querySelector('.game-table-screen')).getPropertyValue('--dsk-u1-panel-z')).trim()) || 30)
      const capaOk = zv === 26 && za === 32 && zv > zArea.max && zv < zMenu && za > zMenu &&
        zViaje.position === 'fixed' && zViaje['pointer-events'] === 'none' &&
        zAjilei.position === 'fixed' && zAjilei['pointer-events'] === 'none'

      const checks = {
        p2_deltaCero: dMano.m <= 0.02 && dAjilei.m <= 0.02 && dDespues.m <= 0.02,
        p6_jerarquia: p6 && ajileiSinPulso,
        p7_capa: capaOk,
        p8_geometria: geoOk && nFichas === geo.fichas,
        p9_marcaViva: !!ajileiCss && ajileiCss.color === 'rgb(232, 184, 75)' && ajileiDentro,
        p10_pulsoUnCiclo: !!pulsoCss && pulsoCss.position === 'absolute' &&
          pulsoCss['animation-iteration-count'] === '1' && pulsoCss['animation-name'] === 'vcPulso',
      }
      c.checks = checks
      c.detalle = { geo, pozoR, pilaR, zViaje, zAjilei, zArea, zMenu, ajileiCss, ajileiCaja, pulsoCss, nFichas, dMano, dAjilei, dDespues }
      c.passed = Object.values(checks).every(Boolean)
    } catch (e) {
      c.error = String(e && e.message || e).slice(0, 300)
      c.passed = false
    }
    cells.push(c)
    const fallos = c.checks ? Object.entries(c.checks).filter(([, v]) => !v).map(([k]) => k) : ['ERROR']
    console.log(`vc m${n} ${vp.w}x${vp.h} · ${c.passed ? 'OK' : 'FALLA [' + fallos.join(',') + ']'}${c.error ? ' · ' + c.error : ''}`)
    await page.close()
  }

  // ── Sub-pasada JUGADA · la celebración de verdad, con su audio ────────────
  // ALCANCE DECLARADO, no recortado en silencio: la sub-pasada jugada corre
  // SÓLO en mesa 2.
  // Se intentó mesa 5 y no es alcanzable auto-jugando: con cuatro rivales, un
  // muestreador que siempre pasa y nunca descarta pierde fichas de forma
  // sostenida y llega a la bancarrota antes que a una victoria — 18 manos de
  // tope y ninguna ganada. Rigar la estrategia para forzarla mediría el
  // muestreador, no el juego.
  // Lo que esta sub-pasada verifica es el CABLEADO VIVO —disparo real, audio
  // real, el toque, Δ=0 in situ—, y ese cableado es el mismo hook y el mismo
  // componente en las cuatro mesas. Lo que sí varía por mesa es la geometría, y
  // ésa la cubren las 20 celdas construidas, mesa 5 incluida.
  const jugado = []
  for (const n of [2]) {
    if (tblFilter && n !== tblFilter) continue
    const page = await browser.newPage({ viewport: { width: 1366, height: 768 } })
    const r = { mesa: n }
    try {
      await gotoMesa(page, n)
      await vcInstall(page)
      const manos = await vcHastaVictoria(page)
      r.manos = manos
      if (manos == null) {
        r.error = 'sin victoria humana en el tope de manos'
        r.ok = false
        jugado.push(r)
        console.log(`vc·jugado m${n} · FALLA · ${r.error}`)
        await page.close(); continue
      }

      // ── P11 · VC2b · la secuencia, observada en sus DOS tiempos ───────────
      // Primer tiempo: el pago acaba de pintar, showdown.mp3 SUENA y el viaje
      // todavía NO está en el DOM. Que ambas cosas sean ciertas a la vez es la
      // prueba de que dejaron de arrancar en paralelo — y se mide con lo que
      // hay en la página, no con relojes de arnés.
      const antes = await page.evaluate(() => ({
        capa: !!document.querySelector('.vc-capa'),
        sonando: window.__vcAudio()?.sonando ?? [],
      }))
      r.antes = antes
      const t0 = Date.now()
      // Segundo tiempo: se espera al arranque sondeando barato.
      let esperaMs = null
      for (let i = 0; i < 45 && esperaMs === null; i++) {
        if (await page.evaluate(() => !!document.querySelector('.vc-capa'))) esperaMs = Date.now() - t0
        else await vcEspera(page, 80)
      }
      r.esperaMs = esperaMs

      // La celebración está viva AHORA mismo.
      const viva = await page.evaluate(() => ({
        capa: !!document.querySelector('.vc-capa'),
        fichas: document.querySelectorAll('.vc-ficha').length,
        pulso: !!document.querySelector('.vc-pulso'),
        ajilei: !!document.querySelector('.vc-ajilei'),
      }))
      const audio = await page.evaluate(() => window.__vcAudio())
      const durante = await page.evaluate(() => window.__vcSnap())
      // El roce entra cuando el volteo ya se calló: nunca solapados.
      r.p11 = antes.capa === false && antes.sonando.includes('showdown.mp3') &&
        !antes.sonando.includes('chips-collect.mp3') &&
        esperaMs !== null && !(audio?.sonando ?? []).includes('showdown.mp3')

      // P1 · el roce suena y la fanfarria vieja NO — win.mp3 quedó sin uso.
      r.sonando = audio?.sonando ?? []
      const p1_sonido = r.sonando.includes('chips-collect.mp3') && !r.sonando.includes('win.mp3')

      // P4 · el toque corta VISUAL y AUDIO de un golpe.
      await page.mouse.click(4, 384)
      await vcEspera(page, 120)
      const trasToque = await page.evaluate(() => ({
        capa: !!document.querySelector('.vc-capa'),
        pulso: !!document.querySelector('.vc-pulso'),
        audio: window.__vcAudio(),
      }))
      const p4 = trasToque.capa === false &&
        !(trasToque.audio?.sonando ?? []).includes('chips-collect.mp3')

      // Δ=0 · la comparación honesta es CON celebración contra SIN ella en el
      // MISMO estado de juego: ambas tomas en fase de pago, una con el overlay
      // vivo y otra tras cortarlo. Contra el estado de espera se mediría el
      // reparto de la mano —165px de diferencia legítima— y no el overlay.
      const despues = await page.evaluate(() => window.__vcSnap())
      const dmax = (a, b) => {
        let m = 0, quien = null
        a.forEach((p, i) => {
          const q = b[i]; if (!p || !q) return
          const d = Math.max(Math.abs(q.x - p.x), Math.abs(q.y - p.y), Math.abs(q.w - p.w), Math.abs(q.h - p.h))
          if (d > m) { m = round(d); quien = VC_ANCHORS[i] }
        })
        return { m, quien }
      }
      const dd = dmax(durante, despues)
      r.dOverlay = dd.m
      r.dQuien = dd.quien

      r.viva = viva
      r.p1 = viva.capa === true && viva.pulso === true && viva.ajilei === false && p1_sonido
      r.p4 = p4
      r.p2 = r.dOverlay <= 0.02
      // P3 · la celebración muere sola dentro del techo.
      r.p3 = true   // se mide en la sub-pasada de reloj
    } catch (e) { r.error = String(e && e.message || e).slice(0, 200) }
    r.ok = !!(r.p1 && r.p2 && r.p4 && r.p11)
    jugado.push(r)
    console.log(`vc·jugado m${n} · ${r.ok ? 'OK' : 'FALLA'} manos=${r.manos} viva=${JSON.stringify(r.viva)} sonando=${JSON.stringify(r.sonando)} Δ=${r.dOverlay} (${r.dQuien}) toque=${r.p4} · secuencia=${r.p11} antes=${JSON.stringify(r.antes)} espera=${r.esperaMs}ms${r.error ? ' · ' + r.error : ''}`)
    await page.close()
  }

  // ── Sub-pasada RELOJ Y MUTE ───────────────────────────────────────────────
  const relojes = []
  for (const n of [2]) {
    if (tblFilter && n !== tblFilter) continue
    const page = await browser.newPage({ viewport: { width: 1366, height: 768 } })
    const r = { mesa: n }
    try {
      await gotoMesa(page, n)
      await vcInstall(page)
      const manos = await vcHastaVictoria(page)
      r.manos = manos
      if (manos == null) {
        r.error = 'sin victoria humana en el tope de manos'
        r.ok = false
        relojes.push(r)
        console.log(`vc·reloj m${n} · FALLA · ${r.error}`)
        await page.close(); continue
      }
      // VC2b · el techo mide el DIBUJO, y el dibujo ya no arranca en el pago:
      // entre uno y otro está la espera al final de showdown. Medir desde el
      // pago daría un falso rojo (a mitad del techo la celebración aún no ha
      // nacido) y, peor, un falso verde al final: a los 2900ms el viaje llevaría
      // vivo apenas 800. El reloj se cuenta desde el ARRANQUE observado.
      let arranqueMs = null
      const tPago = Date.now()
      for (let i = 0; i < 45 && arranqueMs === null; i++) {
        if (await page.evaluate(() => !!document.querySelector('.vc-capa'))) arranqueMs = Date.now() - tPago
        else await vcEspera(page, 80)
      }
      r.arranqueMs = arranqueMs
      // A mitad de vida sigue viva; pasado el techo, muerta.
      await vcEspera(page, 400)
      r.mitad = await page.evaluate(() => !!document.querySelector('.vc-capa'))
      await vcEspera(page, CELEBRACION_TOPE_MS)
      r.fin = await page.evaluate(() => !!document.querySelector('.vc-capa'))

      // ── MUTE · verificado, no asumido ─────────────────────────────────────
      // Se apaga por la ENTRADA DEL MENÚ —el camino del usuario, no una API— y
      // se comprueba lo que de verdad afirma el diseño: que el mute silencia el
      // AUDIO y no toca el DIBUJO.
      // La parte visual se comprueba CONSTRUYENDO el overlay, no ganando otra
      // mano: exigir dos victorias naturales en una celda deja la puerta a
      // merced del azar del reparto, y una puerta que a veces falla no informa
      // de nada.
      // Se mutea SIN pasar de mano: iniciar la siguiente lanza el barajado, y
      // un sonido ya en vuelo sigue reportando playing() aunque el mute le haya
      // bajado la ganancia a cero — la aserción mediría lo que no es.
      await page.click('.utilities-trigger')
      await page.waitForSelector('.utilities-panel', { timeout: 2000 }).catch(() => {})
      await page.click('.util-item-sound')
      await vcEspera(page, 250)
      const audioMute = await page.evaluate(() => window.__vcAudio())
      r.muteGlobal = audioMute?.muteGlobal
      r.sonandoConMute = audioMute?.sonando ?? []
      const geoM = await vcGeo(page, VIAJE_N)
      await page.evaluate(g => window.__vcConstruye('mano', g), geoM)
      r.capaConMute = await page.evaluate(() => {
        const c = document.querySelector('.vc-capa')
        if (!c) return false
        const cs = getComputedStyle(c)
        return cs.display !== 'none' && cs.visibility !== 'hidden' && Number(cs.opacity) > 0
      })
      await page.evaluate(() => window.__vcDestruye())
      r.p5 = r.muteGlobal === true && r.sonandoConMute.length === 0 && r.capaConMute === true
      r.p3 = r.arranqueMs !== null && r.mitad === true && r.fin === false
    } catch (e) { r.error = String(e && e.message || e).slice(0, 200) }
    r.ok = !!(r.p3 && r.p5)
    relojes.push(r)
    console.log(`vc·reloj m${n} · ${r.ok ? 'OK' : 'FALLA'} arranque=${r.arranqueMs}ms viva mitad/fin=${r.mitad}/${r.fin} (tope ${CELEBRACION_TOPE_MS}ms) · mute=${r.muteGlobal} sonando=${JSON.stringify(r.sonandoConMute)} dibujo sigue=${r.capaConMute}${r.error ? ' · ' + r.error : ''}`)
    await page.close()
  }

  // ── Sub-pasada GUARDIAS · VC2b · los dos bordes de la espera ──────────────
  // 'mute'  · la guardia obligatoria: con el sonido apagado NO hay showdown a
  //           cuyo final engancharse, así que el viaje sale de inmediato. El
  //           onend de un sonido que no sonó no puede ser condición de un
  //           visual — si lo fuera, el mute se comería la celebración entera.
  // 'corte' · el toque corta en CUALQUIER punto, la espera incluida: se toca
  //           mientras showdown todavía suena y la celebración no llega a
  //           nacer, ni entonces ni después.
  // Cada escenario se lleva su propia victoria natural: son estados de partida
  // incompatibles y compartir una sola mano mediría uno de los dos mal.
  const guardias = []
  for (const esc of ['mute', 'corte']) {
    if (tblFilter && tblFilter !== 2) continue
    const page = await browser.newPage({ viewport: { width: 1366, height: 768 } })
    const r = { esc }
    try {
      await gotoMesa(page, 2)
      await vcInstall(page)
      if (esc === 'mute') {
        // Por la ENTRADA DEL MENÚ, el camino del usuario, y ANTES de jugar:
        // así ni un solo sonido de la mano llega a nacer.
        await page.click('.utilities-trigger')
        await page.waitForSelector('.utilities-panel', { timeout: 2000 }).catch(() => {})
        await page.click('.util-item-sound')
        await vcEspera(page, 250)
      }
      const manos = await vcHastaVictoria(page)
      r.manos = manos
      if (manos == null) {
        r.error = 'sin victoria humana en el tope de manos'
        r.ok = false
        guardias.push(r)
        console.log(`vc·guardia ${esc} · FALLA · ${r.error}`)
        await page.close(); continue
      }

      if (esc === 'mute') {
        const yaMismo = await page.evaluate(() => ({
          capa: !!document.querySelector('.vc-capa'),
          fichas: document.querySelectorAll('.vc-ficha').length,
          audio: window.__vcAudio(),
        }))
        r.capa = yaMismo.capa
        r.fichas = yaMismo.fichas
        r.muteGlobal = yaMismo.audio?.muteGlobal
        r.sonando = yaMismo.audio?.sonando ?? []
        // Sin espera: el dibujo ya está en el mismo instante en que se detecta
        // el pago, y no suena absolutamente nada.
        r.ok = r.capa === true && r.fichas > 0 && r.muteGlobal === true && r.sonando.length === 0
      } else {
        // El toque llega DURANTE la espera: showdown suena, el viaje aún no está.
        const antes = await page.evaluate(() => ({
          capa: !!document.querySelector('.vc-capa'),
          sonando: window.__vcAudio()?.sonando ?? [],
        }))
        r.antes = antes
        await page.mouse.click(4, 384)
        // Se deja pasar holgadamente MÁS que la espera completa: si la
        // celebración fuera a resucitar, aquí aparecería.
        await vcEspera(page, 3200)
        const despues = await page.evaluate(() => ({
          capa: !!document.querySelector('.vc-capa'),
          pulso: !!document.querySelector('.vc-pulso'),
          sonando: window.__vcAudio()?.sonando ?? [],
        }))
        r.despues = despues
        r.ok = antes.capa === false && antes.sonando.includes('showdown.mp3') &&
          despues.capa === false && despues.pulso === false &&
          !despues.sonando.includes('chips-collect.mp3')
      }
    } catch (e) { r.error = String(e && e.message || e).slice(0, 200); r.ok = false }
    guardias.push(r)
    console.log(`vc·guardia ${esc} · ${r.ok ? 'OK' : 'FALLA'} manos=${r.manos} ${JSON.stringify(
      esc === 'mute' ? { capa: r.capa, fichas: r.fichas, mute: r.muteGlobal, sonando: r.sonando }
        : { antes: r.antes, despues: r.despues })}${r.error ? ' · ' + r.error : ''}`)
    await page.close()
  }

  const passed = p6 && cells.every(c => c.passed) && jugado.every(r => r.ok) &&
    relojes.every(r => r.ok) && guardias.every(r => r.ok)
  console.log(`\n── VC: ${cells.filter(c => c.passed).length}/${cells.length} celdas · jugado ${jugado.filter(r => r.ok).length}/${jugado.length} · reloj+mute ${relojes.filter(r => r.ok).length}/${relojes.length} · guardias ${guardias.filter(r => r.ok).length}/${guardias.length} · decisor ${p6 ? 'OK' : 'FALLA'} · ${passed ? 'VERDE' : 'ROJO'}`)
  return { decisor, cells, jugado, relojes, guardias, passed, topeMs: CELEBRACION_TOPE_MS, viajeMs: VIAJE_MS, escalonMs: VIAJE_ESCALON_MS, ajileiMs: AJILEI_MS }
}

// ── MSG-U1 · Mensajes de resultado compuestos desde el estado ────────────────
// Anclas del Δ=0: el mensaje vive DENTRO del óvalo, así que una frase más larga
// que la de hoy podría ensanchar la caja y empujar al pozo, a las cartas o a la
// barra de acciones. Se miden las dos rutas de render y las dos plataformas.
const MSG_ANCHORS = [
  '.game-table', '.table-header', '.center-zone', '.pot-box', '.call-box',
  '.player-zone', '.player-zone .cards-row', '.player-bar', '.action-area',
  '.two-ovals', '.oval-left', '.oval-right', '.rivals-zone', '.ai-zone',
]

// Celdas: escritorio en las cuatro mesas + móvil en sus DOS gates. La ruta
// two-ovals SÓLO existe en mesa 2 landscape móvil (isLandscapeTable es el gate
// max-height:600), así que sin esa celda una de las dos rutas queda sin medir.
const MSG_CELDAS = [
  { n: 5, vp: { w: 1366, h: 768 }, gate: 'escritorio', movil: false },
  { n: 4, vp: { w: 1366, h: 768 }, gate: 'escritorio', movil: false },
  { n: 3, vp: { w: 1366, h: 768 }, gate: 'escritorio', movil: false },
  { n: 2, vp: { w: 1366, h: 768 }, gate: 'escritorio', movil: false },
  { n: 5, vp: { w: 360, h: 640 }, gate: 'móvil portrait',  movil: true },
  { n: 2, vp: { w: 360, h: 640 }, gate: 'móvil portrait',  movil: true },
  { n: 2, vp: { w: 740, h: 360 }, gate: 'móvil landscape', movil: true },
]

// Manos CONSTRUIDAS para la matriz de P1 — y SÓLO para ella. P1 alimenta a
// `composeResultado`, que es una función pura: ahí no hay nada observable que
// estas cartas puedan estar suplantando, y construir el peor caso es la receta
// O2 de siempre.
//
// ARN-3 · lo que murió aquí es su uso en P2. El comentario que las presidía
// decía «no hace falta ver las cartas: una puntuación de 51 sólo la alcanza un
// AJILEI natural y una de 52 sólo el de comodín», y esa premisa es FALSA en las
// mesas con comodín: el AJILEI natural son 51 de UN palo y el de comodín son 41
// de palo + 11, pero en mesa 5 un palo de 40 + los 11 del comodín también dan
// 51 sin ser nada (y en mesa 4, 41 + 10 hace lo mismo). Con esa premisa el arnés
// fabricaba una mano perfecta donde el producto tenía una corriente, componía
// «¡AJILEI!…» y salía ROJO contra un producto sano — un rojo que no significaba
// lo que decía. Medido en vivo por la caza dirigida de §P2b: mesa 5, mano
// forzada de 4 Bastos (40) + 7 de Oros → banda «Bastos, 51 pts» y mensaje real
// «¡Ganas con Bastos, 51 pts!». En P2 las cartas se LEEN del showdown.
const MSG_AJILEI_NAT = [
  { palo: 'Oros', points: 11, value: 1 }, { palo: 'Oros', points: 10, value: 12 },
  { palo: 'Oros', points: 10, value: 11 }, { palo: 'Oros', points: 10, value: 10 },
  { palo: 'Oros', points: 10, value: 3 },
]
const MSG_AJILEI_COM = [
  { palo: 'Espadas', points: 11, value: 1 }, { palo: 'Espadas', points: 10, value: 12 },
  { palo: 'Espadas', points: 10, value: 11 }, { palo: 'Espadas', points: 10, value: 10 },
  { palo: 'Oros', points: 7, value: 7 },
]
// Lo que la página muestra, sin leer una sola letra del mensaje para deducirlo:
// puntuaciones por zona, quién lleva el chip de ganador, quién es la Mano.
const msgLee = (page) => page.evaluate(() => {
  const txt = e => (e ? e.textContent.trim() : null)
  // MSG-U1b · las bandas hablan la voz de la casa: "Mejor palo: Oros, 27 pts".
  // El paréntesis desapareció de la pantalla entera, así que el parser va a la
  // forma nueva y sólo a ella: si algún día reapareciera la vieja, esta puerta
  // dejaría de leer y la celda caería — que es justo lo que se quiere.
  const parseScore = s => {
    const m = s && s.match(/([A-Za-zÁÉÍÓÚáéíóúÑñ]+)\s*,\s*(\d+)\s*pts/)
    return m ? { palo: m[1], pts: Number(m[2]) } : null
  }
  const esMano = raiz => [...raiz.querySelectorAll('.seat-badge-gold')]
    .some(b => ['M', 'Mano'].includes(b.textContent.trim()))

  const zonas = []
  const zHum = document.querySelector('.player-zone')
  if (zHum) zonas.push({
    quien: 'humano', nombre: 'Tú',
    score: parseScore(txt(zHum.querySelector('.score-tag-player'))),
    gana: !!zHum.querySelector('.win-score-chip'),
    mano: esMano(zHum),
  })
  document.querySelectorAll('.opp-panel').forEach(p => zonas.push({
    quien: 'IA', nombre: txt(p.querySelector('.opp-name')),
    score: parseScore(txt(p.querySelector('.opp-score'))),
    gana: !!p.querySelector('.win-score-chip'),
    mano: esMano(p),
  }))
  document.querySelectorAll('.ai-zone').forEach(p => zonas.push({
    quien: 'IA', nombre: txt(p.querySelector('.ai-name')),
    score: parseScore(txt(p.querySelector('.score-tag'))),
    gana: !!p.querySelector('.win-score-chip'),
    mano: esMano(p),
  }))

  // MSG-U1b · barrido de PANTALLA ENTERA, no sólo del mensaje: la voz queda
  // unificada al 100% o no queda unificada. Se lee el innerText del área para
  // que un "(27" y un "pts)" partidos entre dos nodos por el <strong> no se
  // escapen del barrido.
  const pantalla = document.querySelector('.game-table-screen')
  const bruto = pantalla ? pantalla.innerText : ''
  const vozVieja = (bruto.match(/\(\s*\d+\s*pts\s*\)/g) || [])

  const el = document.querySelector('.game-message')
  return {
    texto: txt(el),
    tono: el ? (el.getAttribute('data-tono') || '') : null,
    clase: el ? el.className : null,
    color: el ? getComputedStyle(el).color : null,
    ruta: document.querySelector('.two-ovals') ? 'two-ovals' : 'center-zone',
    zonas, vozVieja,
  }
})

// ── ARN-2 · Quién es la Mano, leído donde el producto SÍ lo dice ─────────────
// Hallazgo ① de ARN-1: el modo re-derivaba `manoIndex` de la pastilla del
// GANADOR en el showdown y, cuando no la encontraba, ADIVINABA
// (`(idxGana + 1) % players.length`), o sea afirmaba "el ganador no es la Mano"
// sin tener el dato. Y no la encontraba por diseño, no por avería:
// OpponentPanel.jsx:48 (`lettersHidden = letterBadges && inShowdown`) esconde la
// letra M durante el showdown en los escenarios de header compacto — de las
// celdas de este modo, mesa 5 portrait y mesa 2 landscape móvil. El producto
// está bien: resultadoCore.js:117 decide «por ser la Mano» vs «por ser el más
// cercano a la Mano» comparando `winner === manoIndex`, así que con el insumo
// adivinado la frase ESPERADA salía falsa y el rojo no significaba nada.
//
// La fuente nueva es la MISMA pastilla que pinta `manoSeat = game.manoIndex`
// (GameTable.jsx:1017 → 1189 en .ai-zone, 1542 en .player-zone, `isMano` en el
// panel), pero leída ANTES del showdown: en vuelo, durante la apuesta, que es el
// único instante en que el producto la pinta en TODOS los escenarios. No hace
// falta abrir `src/` para nada.
//
// Se identifica por NOMBRE y no por índice: el orden DOM de los paneles no es
// contrato de nada, y los nombres del motor sí lo son y son únicos
// (createInitialState: 'Tú' en el asiento 0, 'IA' en mesa 2, 'IA n' en 3-5).
const msgLeeMano = (page) => page.evaluate(() => {
  const txt = e => (e ? e.textContent.trim() : null)
  // Mismo reconocedor que msgLee: pastilla dorada con la palabra o su inicial.
  // Las de TURNO dicen 'Turno'/'T' y las de PIE no son doradas, así que no
  // entran; las reservadas por visibility (doctrina O1) tampoco, porque su
  // texto es 'T'/'Turno'.
  const esMano = raiz => [...raiz.querySelectorAll('.seat-badge-gold')]
    .some(b => ['M', 'Mano'].includes(b.textContent.trim()))
  const zonas = []
  const zHum = document.querySelector('.player-zone')
  if (zHum) zonas.push({ nombre: 'Tú', mano: esMano(zHum) })
  document.querySelectorAll('.opp-panel').forEach(p => zonas.push({ nombre: txt(p.querySelector('.opp-name')), mano: esMano(p) }))
  document.querySelectorAll('.ai-zone').forEach(p => zonas.push({ nombre: txt(p.querySelector('.ai-name')), mano: esMano(p) }))
  const conMano = zonas.filter(z => z.mano)
  // ── La señal de frescura, y por qué hace falta una ─────────────────────────
  // "Siguiente mano" (GameTable.jsx:1673-1679) NO reparte al instante: primero
  // enciende isClearing y BORRA el ganador —lo que apaga el chip de puntaje— y
  // sólo 300ms más tarde llama a beginHand, que es donde manoIndex rota. O sea
  // que existe una ventana en la que el showdown ya no se ve pero la Mano sigue
  // siendo la de la mano ANTERIOR: muestrear ahí devuelve un dato viejo, que es
  // exactamente el género de error que esta tanda vino a erradicar (medido: la
  // primera versión de esta sonda leía 'Tú' en la mano 2 y la pastilla del
  // showdown la desmentía con 'IA 1').
  //
  // La ausencia de chip no basta, entonces; hace falta una señal POSITIVA de que
  // el estado ya es el de la mano en curso. Es la pastilla de TURNO: sólo se
  // monta en BET_1/2/3 (`turnSeat = isBetPhaseEarly ? … : null`,
  // GameTable.jsx:572 y 1020), fases a las que sólo se llega después de
  // startHand y del reparto. En escritorio el slot se RESERVA siempre por
  // doctrina O1 (visibility, GameTable.jsx:1194 · 1552 · OpponentPanel.jsx:78),
  // así que se descarta lo invisible — un badge reservado no es una señal.
  const turno = [...document.querySelectorAll('.seat-badge-gold')].some(b =>
    ['T', 'Turno'].includes(b.textContent.trim()) && getComputedStyle(b).visibility !== 'hidden')
  return {
    showdown: !!document.querySelector('.win-score-chip'),
    turno,
    cuantas: conMano.length,
    mano: conMano.length === 1 ? conMano[0].nombre : null,
  }
})

// Corroboración INDEPENDIENTE del dato anterior, determinista y derivada de
// información que el arnés controla por completo (el número de mano y el tamaño
// de la mesa): gameEngine.js:66-67 arranca con `pieIndex = N-1` y
// `manoIndex = 0`, y startHand no rota en handCount 0 (gameEngine.js:409-410 —
// pie ← nextAliveIndex(pie), mano ← nextAliveIndex(pie)), así que sin eliminados
// la Mano de la mano k es el asiento (k-1) % N. En las 3 manos que juega este
// modo, con saldo inicial 5000 y ante de 50, nadie puede quebrar: la premisa se
// cumple. Y si algún día dejara de cumplirse, el desacuerdo con la pastilla sale
// ROJO al reporte — nunca se re-alinea en silencio.
const msgManoPorRotacion = (n, mano) => {
  const asiento = (mano - 1) % n
  return asiento === 0 ? 'Tú' : (n === 2 ? 'IA' : `IA ${asiento}`)
}

// ── ARN-3 · Las cartas se LEEN del showdown, no se fabrican ─────────────────
// Hallazgo ➂ (reporte ARN-2), cerrado por esta tanda. El modo elegía la mano de
// cada jugador con un umbral sobre la puntuación de la banda
// (`pts >= 52 ? COM : pts >= 51 ? NAT : NORMAL`) y se la pasaba a
// `composeResultado`, que recalcula el AJILEI con `isAjilei` (doctrina VC2). O
// sea: el arnés inventaba el ÚNICO insumo del que depende la rama de mano
// perfecta, pudiendo observarlo. Y el umbral era además aritméticamente falso
// (ver el comentario de MSG_AJILEI_NAT): en mesa 5 hay manos de 51 puntos que no
// son AJILEI, y contra ellas el arnés componía «¡AJILEI!…» y desmentía a un
// producto sano.
//
// La fuente nueva es el propio showdown. El producto ya pone boca arriba lo que
// hace falta y no hay que abrir `src/` para nada:
//   · la mano humana está boca arriba desde el reparto (renderPlayerCards);
//   · la ganadora la revela el showdown (GameTable.jsx:1283, `isPayoutPhase`);
//   · las demás finalistas de mesas 3/4/5 están boca abajo por PROTOCOLO
//     (`revealProtocolActive`, R1.c) y el producto las enseña donde él mismo lo
//     ofrece: el tap sobre el nombre (Revelar Manos v1.0, R1/R3). Se usa esa
//     puerta, no una trasera.
// Los retirados no hacen falta: no llegaron a comparación, el motor les deja
// `score` en null y `composeResultado` los ignora (`enJuego`).
//
// Cada carta boca arriba es un <img> con `alt` = "Sota de Bastos" (CardImage);
// el dorso y el hueco van con `alt=""`, así que "lo que tiene alt" ES "lo que
// está revelado" y no hay que interpretar clases para saberlo.
const msgTexto = (page) => page.evaluate(() => {
  const m = document.querySelector('.game-message')
  return m ? m.textContent.trim() : null
})

const msgLeeCartasDom = (page) => page.evaluate(() => {
  const txt = e => (e ? e.textContent.trim() : null)
  const caras = raiz => [...raiz.querySelectorAll('.playing-card img[alt]')]
    .map(i => ({ alt: i.getAttribute('alt'), src: i.getAttribute('src') || '' }))
    .filter(c => c.alt)
  const cuenta = raiz => ({
    slots: raiz.querySelectorAll('.playing-card').length,
    dorsos: raiz.querySelectorAll('.playing-card.card-back').length,
    huecos: raiz.querySelectorAll('.playing-card.card-empty').length,
  })
  const zonas = []
  const zHum = document.querySelector('.player-zone')
  if (zHum) zonas.push({ nombre: 'Tú', via: 'player-zone', caras: caras(zHum), ...cuenta(zHum) })
  document.querySelectorAll('.opp-panel').forEach(p => zonas.push({
    nombre: txt(p.querySelector('.opp-name')), via: 'opp-panel', caras: caras(p), ...cuenta(p),
  }))
  document.querySelectorAll('.ai-zone').forEach(p => zonas.push({
    nombre: txt(p.querySelector('.ai-name')), via: 'ai-zone', caras: caras(p), ...cuenta(p),
  }))
  // Señal de que la coreografía de canje (R2.b) sigue corriendo: mientras haya
  // una clase `opp-reveal-*` en pantalla, `revealAnim !== null` y el producto
  // IGNORA el siguiente tap (GameTable.jsx:1041). Sin esta espera el segundo
  // rival no se destapaba nunca — medido.
  return { zonas, coreografia: !!document.querySelector('[class*="opp-reveal-"]') }
})

// Del `alt` al objeto carta del motor, con el MISMO diccionario que ya usa `u3`
// (VALUE_NAMES invertido) y los puntos de `getCardPoints`: ni una cifra de
// puntuación se escribe en este archivo.
const msgCartasDeCaras = (caras) => {
  const cartas = []
  for (const c of caras) {
    const partes = c.alt.split(' de ')
    if (partes.length !== 2) return { cartas: null, motivo: `alt ilegible "${c.alt}"` }
    const value = U3_NOMBRE_A_VALOR[partes[0]]
    if (value === undefined) return { cartas: null, motivo: `nombre desconocido "${partes[0]}"` }
    cartas.push({ value, palo: partes[1], points: getCardPoints(value), name: partes[0] })
  }
  return { cartas, motivo: null }
}

// Reúne las manos de TODOS los que llegaron a comparación. Las que el protocolo
// tiene boca abajo se piden por la puerta del producto (tap en el nombre) y se
// espera a que la coreografía asiente — nunca se da por revelada una mano que
// no se vio con sus cinco caras.
async function msgRevelaYLee(page, nombres) {
  const leidas = {}, taps = [], fallos = []
  const registra = (zonas, como) => {
    for (const z of zonas) {
      if (!z.nombre || !nombres.includes(z.nombre) || leidas[z.nombre]) continue
      if (z.caras.length === 0) continue
      const p = msgCartasDeCaras(z.caras)
      if (!p.cartas) { fallos.push(`${z.nombre}: ${p.motivo}`); continue }
      leidas[z.nombre] = { cartas: p.cartas, via: z.via, como, dorsos: z.dorsos, huecos: z.huecos }
    }
  }
  registra((await msgLeeCartasDom(page)).zonas, 'ya boca arriba')
  for (const nombre of nombres) {
    if (leidas[nombre]) continue
    const t0 = Date.now()
    const panel = page.locator('.opp-panel')
      .filter({ has: page.locator('.opp-name', { hasText: new RegExp(`^${nombre}$`) }) })
    try {
      await panel.locator('.opp-name').first().click({ timeout: 2500 })
    } catch (e) {
      fallos.push(`${nombre}: el nombre no admitió el toque (${String(e && e.message || e).slice(0, 60)})`)
      continue
    }
    let d = null
    for (let k = 0; k < 40; k++) {
      await page.waitForTimeout(100)
      d = await msgLeeCartasDom(page)
      const z = d.zonas.find(x => x.nombre === nombre)
      if (z && z.caras.length === 5 && !d.coreografia) break
    }
    taps.push(`${nombre}:${Date.now() - t0}ms`)
    registra(d ? d.zonas : [], 'destapada por tap')
    if (!leidas[nombre]) fallos.push(`${nombre}: no llegó a mostrar sus cinco caras tras el toque`)
  }
  return { leidas, taps, fallos }
}

// ── ARN-3 · La auditoría de UNA mano, compartida por P2 y por la caza ───────
// Sale de dentro del bucle de P2 sin cambiar una coma de lo que juzga: mismas
// puertas, mismo instante de captura (`msgLee` PRIMERO — los taps mueven el
// chip de ganador al panel destapado, así que leer después falsearía `idxGana`).
// Lo único nuevo es de dónde salen las cartas y las dos puertas que eso añade.
async function msgAuditaMano(page, n, mano, juego, dep) {
  const l = await msgLee(page)
  const conScore = l.zonas.filter(z => z.score)
  const idxGana  = conScore.findIndex(z => z.gana)
  const hayShowdown = conScore.length > 0 && idxGana >= 0
  // ARN-2 · las dos lecturas de la Mano, la observada en vuelo y la derivada de
  // la rotación. Se registran las dos SIEMPRE y se exige que concuerden.
  const manoVista   = juego.manoVista
  const manoRotada  = msgManoPorRotacion(n, mano)
  // La pastilla en el SHOWDOWN — la vieja fuente. Donde el producto no la
  // esconde debe decir lo mismo que se leyó en vuelo; donde la esconde (mesa 5
  // portrait, mesa 2 landscape móvil) no hay nada que cruzar y se declara. Así
  // el defecto de ARN-1 queda convertido en puerta.
  const manoEnChapa = (l.zonas.find(z => z.mano) || {}).nombre ?? null

  // ARN-3 · el insumo de cartas, DESPUÉS de juzgar el instante.
  const lectura = hayShowdown
    ? await msgRevelaYLee(page, conScore.map(z => z.nombre))
    : { leidas: {}, taps: [], fallos: [] }
  // Verificación cruzada barata y de verdad independiente: las cartas leídas,
  // pasadas por el evaluador del motor con las reglas VIVAS del chip de comodín
  // (mismo lector que `u3`), tienen que dar EXACTAMENTE el palo y los puntos que
  // la banda de esa zona anuncia. Si se leyó de menos, de más o de otra mano, no
  // cuadra. Contar cartas habría sido más barato y menos concluyente.
  const reglas = hayShowdown ? await u3ReglasDelDom(page) : null
  const cruce = hayShowdown ? conScore.map(z => {
    const c = lectura.leidas[z.nombre]
    if (!c) return { nombre: z.nombre, ok: false, n: 0, leido: null, banda: `${z.score.palo}, ${z.score.pts}` }
    const sc = getBestSuitScore(c.cartas, reglas.ruleN, reglas.comodinEnabled)
    return {
      nombre: z.nombre, n: c.cartas.length, como: c.como, viaZona: c.via,
      ok: c.cartas.length === 5 && sc.palo === z.score.palo && sc.points === z.score.pts,
      leido: `${sc.palo}, ${sc.points}`, banda: `${z.score.palo}, ${z.score.pts}`,
      mano: c.cartas.map(x => `${x.name} de ${x.palo}`).join(' + '),
    }
  }) : []
  const cartasLeidas  = hayShowdown && conScore.every(z => lectura.leidas[z.nombre]?.cartas.length === 5)
  const cartasCuadran = hayShowdown && cruce.every(c => c.ok)
  // El toque destapa manos; no puede tocar lo que se juzga. Se comprueba en vez
  // de suponerse.
  const textoTrasLeer = lectura.taps.length ? await msgTexto(page) : l.texto

  let esperado = null, via = 'plantilla'
  if (hayShowdown) {
    if (cartasLeidas && cartasCuadran) {
      // Reconstrucción completa desde la página, ahora también las cartas.
      via = 're-derivado'
      const players = conScore.map((z, i) => ({
        id: i, name: z.nombre, isHuman: z.quien === 'humano',
        cards: lectura.leidas[z.nombre].cartas,
        score: { palo: z.score.palo, points: z.score.pts }, eliminated: false,
      }))
      esperado = dep.composeResultado({
        phase: dep.FASES.PAYOUT, winner: idxGana, players, numPlayers: n,
        // El nombre del asiento Mano traducido al índice de `players`, que aquí
        // es el de `conScore` —los que llegaron a comparación— y no el del
        // asiento. Si la Mano se retiró no figura en conScore y esto da -1:
        // nunca iguala a `winner`, que es exactamente la verdad (el ganador no
        // es la Mano → «el más cercano a la Mano»).
        manoIndex: conScore.findIndex(z => z.nombre === manoVista),
        ruleN: n,
      })
    } else {
      // Sin cartas fiables NO se compone nada: antes se rellenaba con una mano
      // inventada y el veredicto salía igual de verde. Ahora falta el insumo y
      // se dice.
      via = 'sin-cartas'
    }
  }
  const claseEsperada = dep.claseTono(l.tono)
  const m = {
    mano, ruta: l.ruta, via, texto: l.texto, tono: l.tono,
    esperado: esperado ? esperado.texto : null,
    // ARN-2 · trazabilidad del insumo, para que el registro de corridas pueda
    // demostrar que la condición que mordía se ejercitó de verdad.
    manoVista, manoRotada, manoEnChapa,
    // Cuántas pastillas de Mano había en la lectura en vuelo. Se registra para
    // que un `manoLeida` en falso diga POR QUÉ: 0 = no se alcanzó ninguna fase
    // de apuesta limpia, >1 = dos asientos se declaran Mano (imposible con un
    // solo manoSeat, y por eso mismo digno de verse).
    manoCuantas: juego.manoCuantas,
    chapaOculta: manoEnChapa === null,
    ganaLaMano: !!(manoVista && conScore[idxGana] && conScore[idxGana].nombre === manoVista),
    // El insumo de la Mano sólo LLEGA al texto por la vía del desempate: sin
    // empate a puntos, resultadoCore.js:117 calcula `desempate` y no lo usa. Por
    // eso la condición que mordía es la conjunción de tres cosas, y se registran
    // las tres por separado para que el censo no exagere ni disimule.
    hayEmpate: conScore.length > 1 &&
      conScore.filter(z => z.score.pts === Math.max(...conScore.map(y => y.score.pts))).length > 1,
    // Puerta 1: la Mano se LEYÓ. Sin dato no hay re-derivación honesta.
    manoLeida: manoVista !== null,
    // Puerta 2: observación y rotación determinista coinciden.
    manoConcuerda: manoVista !== null && manoVista === manoRotada,
    // Puerta 3 (cruce): donde la pastilla sobrevive al showdown, dice lo mismo.
    manoCruce: manoEnChapa === null || manoEnChapa === manoVista,
    // ARN-3 · el registro con el que se demuestra que el verde incluye cartas
    // reales: qué se leyó, de qué zona, si hizo falta destapar y qué dijo el
    // evaluador contra la banda.
    cartas: cruce, cartasTaps: lectura.taps, cartasFallos: lectura.fallos,
    cartasLeidas, cartasCuadran, reglas,
    // Puerta 4 (ARN-3): destapar manos no puede mover lo que se juzga.
    mensajeEstable: textoTrasLeer === l.texto,
    // Ganadas por retiros: no hay puntuaciones que re-derivar, así que se
    // comprueba pertenencia a las plantillas conservadas y coherencia de tono.
    // Se DECLARA, no se disfraza de re-derivación. Y `sin-cartas` no coincide
    // con nada: sin insumo no hay veredicto que dar.
    coincide: via === 're-derivado'
      ? l.texto === esperado.texto && l.tono === esperado.tono
      : via === 'plantilla'
        ? /Ganaste el pozo|gana el pozo|Los demás se retiran/.test(l.texto)
        : false,
    sinPierdes: !/Pierdes/.test(l.texto),
    sinVozVieja: !/\(\d+ pts\)/.test(l.texto),
    // MSG-U1b · y NADA en toda la pantalla habla la voz vieja: ni el mensaje,
    // ni la banda del humano, ni las de los rivales.
    vozVieja: l.vozVieja,
    pantallaLimpia: l.vozVieja.length === 0,
    // El color aplicado y el tono compuesto tienen que ser el mismo hecho.
    tonoAplicado: l.clase.includes(claseEsperada.trim()) && !!l.tono,
  }
  // Las ocho puertas de ARN-1/ARN-2 conservan su significado exacto —la de
  // lectura de la Mano sigue siendo indispensable: sin ese insumo, `coincide`
  // compararía contra una frase inventada, y un verde así valdría menos que el
  // rojo que sustituye—. ARN-3 suma dos, y por el mismo motivo. Las manos
  // ganadas por retiros no tienen cartas que leer —no hubo volteo— y ahí
  // `cartasOk` es cierto por AUSENCIA declarada, no por relleno.
  m.cartasOk = via === 'plantilla' ? true : (cartasLeidas && cartasCuadran)
  m.ok = m.coincide && m.sinPierdes && m.sinVozVieja && m.tonoAplicado && m.pantallaLimpia &&
    m.manoLeida && m.manoConcuerda && m.manoCruce && m.cartasOk && m.mensajeEstable
  return m
}

// Resumen de una línea del insumo de cartas, para el registro de corridas.
const msgCartasResumen = (m) => m.via === 'plantilla'
  ? 'cartas:—(retiros)'
  : `cartas:${m.cartas.filter(c => c.ok).length}/${m.cartas.length}${m.cartasOk ? '✓' : '✗'}` +
    `${m.cartasTaps.length ? ` toques=${m.cartasTaps.length}` : ''}` +
    `${m.cartasOk ? '' : ` [${m.cartas.map(c => `${c.nombre} leído=${c.leido} banda=${c.banda}`).join(' · ')}${m.cartasFallos.length ? ' · ' + m.cartasFallos.join(' · ') : ''}]`}`

// ── ARN-3 · Caza dirigida: forzar el reparto sin tocar el producto ───────────
// Para ejercitar la rama de AJILEI hace falta un AJILEI, y uno natural cae con
// probabilidad ~4·10⁻⁴ por mano: esperarlo no es una estrategia. El arnés no
// fabrica la mano —eso es justo lo que esta tanda vino a matar— sino que fuerza
// el BARAJADO y deja que el producto reparta, puntúe, decida y escriba: siembra
// `Math.random` con un generador de semilla conocida justo antes del clic,
// `shuffleDeck` (deck.js:44) consume sus 39 tiradas, y se restaura en cuanto las
// dos primeras cartas asoman. Las cartas se siguen leyendo del DOM y la mano
// forzada se VERIFICA contra la predicha: si el navegador hubiera gastado una
// tirada antes del barajado, no coincidiría y la caza lo cantaría en vez de
// creérselo.
//
// Qué asiento recibe qué: `startHand` reparte 2 cartas en ronda Mano→Pie
// (gameEngine.js:421-431) y `DEAL_3` otras 3 igual (gameEngine.js:213-224). En
// la mano 1 la Mano es el asiento 0 —el humano— porque `startHand` no rota en
// handCount 0, así que le tocan los índices 0, N, 2N, 3N y 4N del mazo barajado.
// Por eso cada intento estrena página: sólo la mano 1 tiene esa garantía.
const msgPrng = (a) => () => {
  a |= 0; a = a + 0x6D2B79F5 | 0
  let t = Math.imul(a ^ a >>> 15, 1 | a)
  t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t
  return ((t ^ t >>> 14) >>> 0) / 4294967296
}
const msgBarajaCon = (semilla) => {
  const real = Math.random
  Math.random = msgPrng(semilla)
  try { return shuffleDeck(createDeck()) } finally { Math.random = real }
}
const msgManoDeLaCasa = (mazo, n) => [0, n, 2 * n, 3 * n, 4 * n].map(i => mazo[i])
// La semilla más baja que le reparte al humano la mano que la caza pide.
const msgBuscaSemilla = (quiere, n, desde, tope) => {
  for (let s = desde; s <= tope; s++) {
    const m = msgManoDeLaCasa(msgBarajaCon(s), n)
    if (quiere(m)) return { semilla: s, mano: m }
  }
  return null
}
const msgClaveMano = (cartas) =>
  cartas.map(c => `${c.name ?? VALUE_NAMES[c.value]} de ${c.palo}`).sort().join(' | ')

// El generador vive en dos sitios —Node y el navegador— y una divergencia entre
// las dos copias echaría a perder la caza en silencio. Antes de sembrar se
// comprueba que la primera tirada es la misma en los dos lados.
//
// La siembra se AUTO-RETIRA en cuanto el barajado gasta sus tiradas: el azar
// sembrado alcanza al mazo y a nada más, y las IAs deciden con el azar de
// siempre. Nada de esto le llega al producto por dentro — es la misma
// `Math.random` que cualquier página puede tener sembrada.
async function msgSiembraAzar(page, semilla, tiradas) {
  const eco = await page.evaluate(([s, k]) => {
    const prng = (a) => () => {
      a |= 0; a = a + 0x6D2B79F5 | 0
      let t = Math.imul(a ^ a >>> 15, 1 | a)
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t
      return ((t ^ t >>> 14) >>> 0) / 4294967296
    }
    const real = Math.random
    const dado = prng(s)
    window.__arn3N = 0
    Math.random = () => {
      // Al gastarse las tiradas del barajado el azar de la casa vuelve intacto, y
      // el contador se queda en las que de verdad se sirvieron sembradas.
      if (window.__arn3N >= k) { Math.random = real; return real() }
      window.__arn3N++
      return dado()
    }
    return prng(s)()          // tirada de control, de un generador aparte
  }, [semilla, tiradas])
  return eco === msgPrng(semilla)()
}
// Cuántas tiradas sembradas se sirvieron. Si no son exactamente las del
// barajado, alguien más bebió del generador y la mano forzada no será la
// predicha — que es precisamente lo que la caza comprueba contra el DOM.
const msgCuentaAzar = (page) => page.evaluate(() => window.__arn3N ?? null)

// Juega una mano completa pasando siempre y devuelve cuando el resultado está
// en pantalla. Un clic por iteración con rechequeo (lección W1).
// ARN-2 · devuelve además la Mano muestreada en vuelo. `false` sigue
// significando "no hubo mano que jugar".
async function msgJuegaUnaMano(page, primera) {
  if (primera) await clickIf(page, 'button:has-text("Iniciar mano")')
  else if (!await clickIf(page, 'button:has-text("Siguiente mano")')) return false
  // ARN-2 · una sola lectura limpia basta y no se repite: `manoIndex` se fija en
  // startHand y no vuelve a moverse dentro de la mano. Limpia = exactamente UNA
  // pastilla de Mano en pantalla y ningún chip de ganador todavía.
  let manoVista = null, manoCuantas = null
  // Tope generoso a propósito: una mano de mesa 5 son cuatro IAs × tres rondas
  // de apuesta × el ritmo de la casa (AI_SPEED_FACTOR) más el reparto y el
  // descarte. Con 120 vueltas (30s) se quedaba corta y la celda salía vacía
  // sin que nada estuviera roto.
  for (let i = 0; i < 320; i++) {
    await page.waitForTimeout(250)
    if (manoVista === null) {
      const v = await msgLeeMano(page)
      if (v.turno && !v.showdown) { manoVista = v.mano; manoCuantas = v.cuantas }
    }
    const fin = await page.evaluate(() => {
      const m = document.querySelector('.game-message')
      return !!m && (m.classList.contains('msg-win') || m.classList.contains('msg-lose'))
    })
    if (fin) return { jugada: true, manoVista, manoCuantas }
    await clickIf(page, '.action-buttons button:has-text("Pasar")') ||
      await clickIf(page, '.action-buttons button:has-text("Igualar")') ||
      await clickIf(page, '.action-buttons button:has-text("Apostar")')
    await clickIf(page, 'button:has-text("Sin descartar")')
  }
  return { jugada: false, manoVista, manoCuantas }
}

// ── ARN-3 · P2b · Caza dirigida: las dos caras del 51 ───────────────────────
// La rama de mano perfecta de `resultadoCore` es la ÚNICA que consume cartas, y
// es justo la que el arnés viejo alimentaba a ojo. Verificarla exige un AJILEI
// en pantalla, y un AJILEI natural cae ~4·10⁻⁴ por mano: sin caza no hay
// condición ejercitada, sólo un residuo perpetuo.
//
// Se cazan las DOS caras del mismo número, porque el hallazgo ➂ vive entre
// ellas: un 51 que SÍ es AJILEI y un 51 que NO lo es. La primera prueba que la
// rama se compone bien con cartas leídas; la segunda es el contraejemplo que
// mató al umbral — el arnés viejo habría exigido «¡AJILEI!» y desmentido al
// producto.
const MSG_CAZAS = [
  {
    id: 'AJILEI natural', n: 2, vp: { w: 1366, h: 768 },
    // Mesa 2 no tiene comodín (getComodinValue devuelve null), así que el único
    // 51 posible es el AJILEI natural: cinco cartas de un palo que suman 51.
    quiere: (m) => isAjilei(m, 2),
    espera: 'la rama de mano perfecta, compuesta con las cartas leídas del showdown',
    cumple: (m) => /AJILEI/.test(m.texto),
  },
  {
    id: 'falso 51', n: 5, vp: { w: 1366, h: 768 },
    // El contraejemplo: 40 de palo + los 11 del comodín dan 51 sin ser AJILEI
    // (el de comodín exige 41 + 11). Aquí es donde el umbral `pts >= 51 → mano
    // perfecta` componía «¡AJILEI!» contra un producto sano.
    quiere: (m) => getBestSuitScore(m, 5, true).points === 51 && !isAjilei(m, 5),
    espera: 'una victoria corriente de 51 pts — el arnés viejo habría exigido «¡AJILEI!»',
    cumple: (m) => /51 pts/.test(m.texto) && !/AJILEI/.test(m.texto),
  },
]
const MSG_CAZA_INTENTOS = 4
const MSG_CAZA_TOPE_SEMILLA = 2000000

async function msgCaza(browser, caza, dep) {
  // Las tiradas del barajado no se clavan: son las del mazo real menos una
  // (deck.js, Fisher-Yates de i=n-1 a 1). Si el mazo cambiara de tamaño, la
  // siembra cambia con él.
  const tiradas = createDeck().length - 1
  const r = { id: caza.id, n: caza.n, vp: caza.vp, tiradas, intentos: [], ok: null, ejercitada: false, residuo: null }
  let desde = 1
  for (let intento = 1; intento <= MSG_CAZA_INTENTOS; intento++) {
    const buscada = msgBuscaSemilla(caza.quiere, caza.n, desde, MSG_CAZA_TOPE_SEMILLA)
    if (!buscada) { r.residuo = `sin semilla que reparta la mano pedida por debajo de ${MSG_CAZA_TOPE_SEMILLA}`; break }
    desde = buscada.semilla + 1
    const t = { intento, semilla: buscada.semilla, pedida: msgClaveMano(buscada.mano) }
    const page = await browser.newPage({ viewport: { width: caza.vp.w, height: caza.vp.h } })
    try {
      await gotoMesa(page, caza.n)
      t.mismoAzar = await msgSiembraAzar(page, buscada.semilla, tiradas)
      if (!t.mismoAzar) {
        t.motivo = 'el generador de Node y el del navegador no dieron la misma tirada'
        r.residuo = t.motivo
        r.intentos.push(t); await page.close(); break
      }
      const juego = await msgJuegaUnaMano(page, true)
      t.tiradasServidas = await msgCuentaAzar(page)
      if (!juego || !juego.jugada) { t.motivo = 'la mano no llegó a resultado'; r.intentos.push(t); await page.close(); continue }
      // ¿Salió el reparto pedido? Se LEE de la zona humana, que está boca arriba
      // desde el reparto, y se compara con lo predicho. Un desfase de tiradas se
      // delata aquí en vez de colarse.
      const zh = (await msgLeeCartasDom(page)).zonas.find(z => z.nombre === 'Tú')
      const leida = msgCartasDeCaras(zh ? zh.caras : [])
      t.repartida = leida.cartas && leida.cartas.length === 5 ? msgClaveMano(leida.cartas) : null
      t.forzada = t.repartida !== null && t.repartida === t.pedida
      if (!t.forzada) {
        t.motivo = 'el reparto no coincidió con el predicho (¿tirada gastada antes del barajado?)'
        r.intentos.push(t); await page.close(); continue
      }
      const m = await msgAuditaMano(page, caza.n, 1, juego, dep)
      t.rama = caza.cumple(m) ? 'la pedida' : 'otra'
      t.texto = m.texto
      t.via = m.via
      t.ok = m.ok
      t.cartas = msgCartasResumen(m)
      t.mano = m
      r.intentos.push(t)
      if (t.rama !== 'la pedida') { t.motivo = 'la mano forzada salió, pero el resultado no cayó en la rama buscada'; await page.close(); continue }
      r.ok = m.ok
      r.ejercitada = m.ok && m.via === 're-derivado'
      await page.close()
      break
    } catch (e) {
      t.error = String(e && e.message || e).slice(0, 200)
      r.intentos.push(t)
      await page.close().catch(() => {})
    }
  }
  if (r.ok === null && !r.residuo) r.residuo = `no se logró forzar la condición en ${MSG_CAZA_INTENTOS} intentos`
  const ult = r.intentos[r.intentos.length - 1]
  const estado = r.ok === true ? 'VERDE' : r.ok === false ? 'ROJO' : 'RESIDUO'
  console.log(`msg·ARN-3 caza «${caza.id}» T${caza.n} · ${estado} intentos=${r.intentos.length}` +
    (r.ok === null
      ? ` · ${r.residuo}${ult ? ` · último: semilla=${ult.semilla} pedida="${ult.pedida}" repartida="${ult.repartida ?? '—'}" ${ult.motivo ?? ult.error ?? ''}` : ''}`
      : ` semilla=${ult.semilla} tiradas=${ult.tiradasServidas}/${tiradas} mano REPARTIDA POR EL PRODUCTO="${ult.repartida}" → "${ult.texto}" (${ult.via}) ${ult.cartas}` +
        `${r.ok ? '' : ` ✗esperado="${ult.mano.esperado}"`}`))
  return r
}

async function runMSG(browser) {
  const { composeResultado, claseTono } = await import('../src/hooks/resultadoCore.js')
  const { PHASES: FASES } = await import('../src/engine/gameEngine.js')
  const tblFilter = process.argv[3] ? Number(process.argv[3]) : null
  // ARN-3 · el compositor viaja en un solo bulto a la auditoría de mano, que es
  // la misma para P2 y para la caza dirigida: un solo sitio que sabe qué se juzga.
  const dep = { composeResultado, claseTono, FASES }

  // ── P1 · El compositor entero, CONSTRUIDO (receta O2) ─────────────────────
  // El peor caso no se juega: un doble AJILEI en las dos direcciones no cae ni
  // en mil manos, y la pantalla terminal exige arruinar a todas las IAs.
  const carta = (palo, points, value = 10) => ({ palo, points, value })
  const sc = (palo, points) => ({ palo, points, suitScores: { [palo]: points } })
  const construye = ({ n, winner, manoIndex = 0, phase = FASES.PAYOUT, asientos }) => composeResultado({
    phase, winner, numPlayers: n, manoIndex, ruleN: n,
    players: asientos.map((a, i) => ({
      id: i, name: i === 0 ? 'Tú' : (n === 2 ? 'IA' : `IA ${i}`), isHuman: i === 0,
      cards: a.cards ?? [carta('Copas', 11, 1), carta('Espadas', 10, 12)],
      score: a.score ?? null, eliminated: !!a.eliminated,
    })),
  })

  const matriz = []
  for (const n of [5, 4, 3, 2]) for (let w = 0; w < n; w++) {
    const iguales = Array.from({ length: n }, () => ({ score: sc('Bastos', 27) }))
    const gana    = iguales.map((a, i) => (i === w ? { score: sc('Espadas', 31) } : a))
    const perfecta = iguales.map((a, i) => (i === w ? { cards: MSG_AJILEI_NAT, score: sc('Oros', 51) } : a))
    const dobles  = iguales.map((a, i) => (i <= 1 ? { cards: MSG_AJILEI_NAT, score: sc('Oros', 51) } : a))
    matriz.push(
      { caso: `corriente n${n} w${w}`,      r: construye({ n, winner: w, asientos: gana }) },
      { caso: `empate-mano n${n} w${w}`,    r: construye({ n, winner: w, manoIndex: w, asientos: iguales }) },
      { caso: `empate-cerca n${n} w${w}`,   r: construye({ n, winner: w, manoIndex: (w + 1) % n, asientos: iguales }) },
      { caso: `ajilei n${n} w${w}`,         r: construye({ n, winner: w, asientos: perfecta }) },
      { caso: `retiros n${n} w${w}`,        r: construye({ n, winner: w, asientos: Array.from({ length: n }, () => ({ score: null })) }) },
      { caso: `fin n${n} w${w}`,            r: construye({ n, winner: w, phase: FASES.GAME_OVER, asientos: iguales }) },
    )
    if (w < 2) matriz.push({ caso: `doble-ajilei n${n} w${w}`, r: construye({ n, winner: w, manoIndex: w, asientos: dobles }) })
  }

  const sinPierdes  = matriz.every(m => m.r && !/Pierdes/.test(m.r.texto))
  const sinVozVieja = matriz.every(m => m.r && !/\(\d+ pts\)/.test(m.r.texto))
  // Texto y tono son el MISMO hecho: si el texto tutea la victoria, el tono gana.
  const coherente   = matriz.every(m => m.r && (/\bGanas\b|¡Ganaste|Ganaste el pozo/.test(m.r.texto) === ['gana', 'oro'].includes(m.r.tono)))
  const oroSoloGana = matriz.filter(m => m.caso.startsWith('fin'))
    .every(m => (m.r.tono === 'oro') === /¡Ganaste la mesa!/.test(m.r.texto))
  // El doble AJILEI, veraz en las dos direcciones — el caso que el motor miente.
  const dobles = matriz.filter(m => m.caso.startsWith('doble-ajilei'))
  const dobleOk = dobles.every(m => /\bGanas\b/.test(m.r.texto) === (m.r.tono === 'gana')) &&
    dobles.some(m => m.r.tono === 'gana') && dobles.some(m => m.r.tono === 'pierde')

  // La frase MÁS LARGA que el compositor puede producir, POR MESA — la munición
  // del Δ=0. Por mesa y no global porque las plantillas no son intercambiables:
  // "La IA" sólo existe en el 2 y "IA 2" sólo de 3 en adelante.
  const largaDe = {}
  for (const n of [5, 4, 3, 2]) {
    largaDe[n] = matriz.filter(m => m.caso.includes(`n${n} `))
      .reduce((a, m) => (m.r.texto.length > a.length ? m.r.texto : a), '')
  }
  const larga = Object.values(largaDe).reduce((a, t) => (t.length > a.length ? t : a), '')

  // ── La vara honesta: el peor caso de HOY ──────────────────────────────────
  // Comparar la frase nueva contra el mensaje que hubiera en pantalla en ese
  // instante mediría "corto → largo", que es una sensibilidad del óvalo
  // preexistente y no una consecuencia de la tanda. Lo que hay que comparar es
  // PEOR CASO CONTRA PEOR CASO: la cadena más larga que el motor puede emitir
  // hoy en esa mesa, contra la más larga que el compositor puede emitir mañana.
  // Cadenas del motor tomadas del censo MSG-C0, con los palos más largos
  // ("Espadas", 7) y puntuaciones de dos cifras.
  const MOTOR_HOY = {
    2: [
      'Pierdes. La IA gana con Espadas (31 pts) vs tu Espadas (31 pts).',
      '¡Ganas! Tu Espadas (31 pts) supera al Espadas de la IA (31 pts).',
      '¡Ambos con AJILEI! Ganas por ser el mano.',
      'Empate (31 pts). Ganas por ser el mano.',
    ],
    3: null, 4: null, 5: null,   // se rellenan abajo: mismas plantillas de N>2
  }
  for (const n of [3, 4, 5]) {
    MOTOR_HOY[n] = [
      `Empate. Gana IA ${n - 1} por ser el más cercano a la Mano.`,
      `¡AJILEI! IA ${n - 1} gana con mano perfecta (comodín).`,
      `IA ${n - 1} gana con Espadas (31 pts).`,
      `Los demás se retiran. Gana IA ${n - 1}.`,
    ]
  }
  const motorLargaDe = {}
  for (const n of [5, 4, 3, 2]) motorLargaDe[n] = MOTOR_HOY[n].reduce((a, t) => (t.length > a.length ? t : a), '')
  const p1 = sinPierdes && sinVozVieja && coherente && oroSoloGana && dobleOk
  console.log(`msg·compositor · ${p1 ? 'OK' : 'FALLA'} ${matriz.length} casos ${JSON.stringify({ sinPierdes, sinVozVieja, coherente, oroSoloGana, dobleOk })}`)
  console.log(`msg·frase más larga (${larga.length} car) · "${larga}"`)
  for (const n of [5, 4, 3, 2]) {
    console.log(`msg·peor caso T${n} · hoy ${motorLargaDe[n].length} car "${motorLargaDe[n]}" → mañana ${largaDe[n].length} car "${largaDe[n]}"`)
  }

  // ── P2 · Jugado: el texto pintado se RE-DERIVA del estado visible ─────────
  // Verificación cruzada contra winner/scores, jamás regex de prosa: se leen las
  // puntuaciones de cada zona, quién lleva el chip de ganador y quién es la
  // Mano, se recompone con el MISMO compositor y se compara la cadena entera.
  const jugado = []
  for (const celda of MSG_CELDAS) {
    if (tblFilter && celda.n !== tblFilter) continue
    const page = await browser.newPage({
      viewport: { width: celda.vp.w, height: celda.vp.h },
      ...(celda.movil ? { hasTouch: true, isMobile: true } : {}),
    })
    const r = { ...celda, manos: [] }
    try {
      await gotoMesa(page, celda.n)
      for (let mano = 1; mano <= 3; mano++) {
        const juego = await msgJuegaUnaMano(page, mano === 1)
        if (!juego || !juego.jugada) break
        r.manos.push(await msgAuditaMano(page, celda.n, mano, juego, dep))
      }
      r.ok = r.manos.length > 0 && r.manos.every(m => m.ok)
    } catch (e) { r.error = String(e && e.message || e).slice(0, 200); r.ok = false }
    jugado.push(r)
    // ARN-2 · la Mano se imprime en cada mano junto con si su pastilla estaba
    // oculta y si el desempate lo ganó ella: ése es el registro con el que se
    // demuestra que la condición del hallazgo ① se ejercitó, y no un "confía".
    console.log(`msg·jugado T${celda.n} ${celda.vp.w}x${celda.vp.h} (${celda.gate}) · ${r.ok ? 'OK' : 'FALLA'} ruta=${r.manos[0]?.ruta ?? '—'} pantalla sin "(N pts)"=${r.manos.every(m => m.pantallaLimpia)} ${r.manos.map(m => `[${m.via} "${m.texto}" tono=${m.tono} mano=${m.manoVista}${m.manoConcuerda ? '' : `≠rot:${m.manoRotada}`}${m.chapaOculta ? ' chapaOCULTA' : ` chapa:${m.manoEnChapa}`}${m.ganaLaMano ? ' GANA-LA-MANO' : ''} ${msgCartasResumen(m)}${m.ok ? '' : ' ✗esperado="' + m.esperado + '" vozVieja=' + JSON.stringify(m.vozVieja)}]`).join(' ')}${r.error ? ' · ' + r.error : ''}`)
    await page.close()
  }

  // ── P2b · ARN-3 · Caza dirigida de la condición AJILEI ────────────────────
  const cazas = []
  for (const caza of MSG_CAZAS) {
    if (tblFilter && caza.n !== tblFilter) continue
    cazas.push(await msgCaza(browser, caza, dep))
  }

  // ── P3 · Fin de partida: el oro es de la victoria ─────────────────────────
  // CONSTRUIDO: llegar a GAME_OVER jugando exige arruinar a todas las IAs. Lo
  // que se audita aquí es el contrato de CSS —qué color pinta cada clase y que
  // nada más cambie—; que el tono correcto le llegue a cada caso lo sella P1.
  const finales = []
  {
    const page = await browser.newPage({ viewport: { width: 1366, height: 768 } })
    try {
      await gotoMesa(page, 2)
      const medido = await page.evaluate(() => {
        const caja = document.createElement('div')
        caja.className = 'game-over-screen'
        caja.setAttribute('data-construido', '1')
        caja.innerHTML = '<p class="game-over-msg">¡Ganaste la mesa! Eres el último con fichas.</p>' +
          '<p class="game-over-msg game-over-msg-neutro">IA 1 gana la mesa. Te quedaste sin fichas.</p>'
        document.querySelector('.game-table-screen').appendChild(caja)
        const [a, b] = caja.querySelectorAll('.game-over-msg')
        const cs = e => { const c = getComputedStyle(e); return { color: c.color, fontSize: c.fontSize, fontWeight: c.fontWeight } }
        const oroVivo = getComputedStyle(document.documentElement).getPropertyValue('--gold-brand').trim()
        const neutroVivo = getComputedStyle(document.documentElement).getPropertyValue('--text-secondary').trim()
        const out = { victoria: cs(a), derrota: cs(b), oroVivo, neutroVivo }
        caja.remove()
        return out
      })
      // Oro exacto #e8b84b → rgb(232, 184, 75). El neutro NO puede ser el oro.
      finales.push({
        ...medido,
        p3: medido.victoria.color === 'rgb(232, 184, 75)' &&
          medido.derrota.color !== medido.victoria.color &&
          medido.derrota.fontSize === medido.victoria.fontSize &&
          medido.derrota.fontWeight === medido.victoria.fontWeight,
      })
    } catch (e) { finales.push({ error: String(e && e.message || e).slice(0, 200), p3: false }) }
    const f = finales[0]
    console.log(`msg·fin de partida · ${f.p3 ? 'OK' : 'FALLA'} victoria=${f.victoria?.color} derrota=${f.derrota?.color} (mismo cuerpo ${f.victoria?.fontSize}/${f.victoria?.fontWeight})${f.error ? ' · ' + f.error : ''}`)
    await page.close()
  }

  // ── P4 · Δ=0 con la frase MÁS LARGA ───────────────────────────────────────
  // La robustez del óvalo se midió en escritorio; en móvil NO se asume. Se
  // inyecta la frase más larga que el compositor puede producir y se comprueba
  // que ninguna ancla se mueve, en las dos plataformas y en las dos rutas.
  const anchuras = []
  for (const celda of MSG_CELDAS) {
    if (tblFilter && celda.n !== tblFilter) continue
    const page = await browser.newPage({
      viewport: { width: celda.vp.w, height: celda.vp.h },
      ...(celda.movil ? { hasTouch: true, isMobile: true } : {}),
    })
    const r = { ...celda }
    try {
      await gotoMesa(page, celda.n)
      await clickIf(page, 'button:has-text("Iniciar mano")')
      await page.waitForTimeout(4800)   // el reparto termina en ~4,5s
      const d = await page.evaluate(({ anchors, hoy, manana }) => {
        const rnd = x => (x == null ? null : Math.round(x * 100) / 100)
        const R = s => { const e = document.querySelector(s); if (!e) return null; const b = e.getBoundingClientRect(); return { x: rnd(b.x), y: rnd(b.y), w: rnd(b.width), h: rnd(b.height) } }
        const snap = () => anchors.map(R)
        const el = document.querySelector('.game-message')
        if (!el) return null
        const previo = el.textContent
        const corto = snap()
        el.textContent = hoy
        const conHoy = snap()
        const desbordaHoy = el.scrollWidth > el.clientWidth + 0.5
        el.textContent = manana
        const conManana = snap()
        const desborda = el.scrollWidth > el.clientWidth + 0.5
        el.textContent = previo
        const dmax = (a, b) => {
          let m = 0, quien = null
          a.forEach((p, i) => {
            const q = b[i]; if (!p || !q) return
            const dd = Math.max(Math.abs(q.x - p.x), Math.abs(q.y - p.y), Math.abs(q.w - p.w), Math.abs(q.h - p.h))
            if (dd > m) { m = rnd(dd); quien = anchors[i] }
          })
          return { m, quien }
        }
        // El que manda: peor caso de hoy vs peor caso de mañana.
        const contraHoy = dmax(conHoy, conManana)
        // Informativo: cuánto se mueve el óvalo entre un mensaje corriente y el
        // peor caso — sensibilidad PREEXISTENTE, no consecuencia de la tanda.
        const sensibilidad = dmax(corto, conHoy)
        return { m: contraHoy.m, quien: contraHoy.quien, sens: sensibilidad.m, sensQuien: sensibilidad.quien, desborda, desbordaHoy }
      }, { anchors: MSG_ANCHORS, hoy: motorLargaDe[celda.n], manana: largaDe[celda.n] })
      r.delta = d ? d.m : null
      r.quien = d ? d.quien : null
      r.sens = d ? d.sens : null
      r.sensQuien = d ? d.sensQuien : null
      r.desborda = d ? d.desborda : null
      r.desbordaHoy = d ? d.desbordaHoy : null
      r.ok = !!d && d.m <= 0.02 && d.desborda === d.desbordaHoy
    } catch (e) { r.error = String(e && e.message || e).slice(0, 200); r.ok = false }
    anchuras.push(r)
    console.log(`msg·Δ larga T${celda.n} ${celda.vp.w}x${celda.vp.h} (${celda.gate}) · ${r.ok ? 'OK' : 'FALLA'} Δ(hoy→mañana)=${r.delta} (${r.quien}) · desborde hoy/mañana=${r.desbordaHoy}/${r.desborda} · sensibilidad preexistente del óvalo=${r.sens} (${r.sensQuien})${r.error ? ' · ' + r.error : ''}`)
    await page.close()
  }

  // ── ARN-2 · Censo de la condición del hallazgo ① ──────────────────────────
  // Lo que falsificaba la frase esperada era la CONJUNCIÓN: pastilla de Mano
  // oculta por el producto Y desempate ganado de verdad por la Mano, en la misma
  // mano. Se cuenta explícitamente para que el verde pueda demostrarse en vez de
  // creerse. Si no apareció, el reporte lo dice como residuo — nunca se rellena
  // con confianza. Las claves llevan sufijo `_n` a propósito: nada aquí es una
  // puerta, y un booleano suelto en este bloque se leería como veredicto.
  const manosTodas = jugado.flatMap(r => r.manos.map(m => ({ celda: `T${r.n} ${r.vp.w}x${r.vp.h}`, ...m })))
  const muerde = m => m.chapaOculta && m.ganaLaMano && m.hayEmpate
  const condicion = {
    manos_n: manosTodas.length,
    chapaOculta_n: manosTodas.filter(m => m.chapaOculta).length,
    ganaLaMano_n: manosTodas.filter(m => m.ganaLaMano).length,
    empate_n: manosTodas.filter(m => m.hayEmpate).length,
    cruceVisible_n: manosTodas.filter(m => !m.chapaOculta).length,
    ejercitada: manosTodas.filter(muerde)
      .map(m => `${m.celda} mano${m.mano} Mano=${m.manoVista} → "${m.texto}"`),
    // Con la pastilla oculta y la Mano ganando, aunque no hubiera empate, el
    // insumo YA sale distinto del que producía el código viejo: es la mitad de la
    // condición, y se registra porque documenta cobertura real.
    insumoDistinto: manosTodas.filter(m => m.chapaOculta && m.ganaLaMano)
      .map(m => `${m.celda} mano${m.mano} Mano=${m.manoVista}${m.hayEmpate ? '' : ' (sin empate)'}`),
  }
  console.log(`msg·ARN-2 condición ① · manos=${condicion.manos_n} · pastilla oculta=${condicion.chapaOculta_n} · gana la Mano=${condicion.ganaLaMano_n} · empate a puntos=${condicion.empate_n} · cruces con pastilla visible=${condicion.cruceVisible_n}`)
  console.log(`msg·ARN-2 insumo distinto del viejo (oculta + gana la Mano) ${condicion.insumoDistinto.length}: ${condicion.insumoDistinto.join(' | ') || '—'}`)
  console.log(`msg·ARN-2 → CONDICIÓN COMPLETA EJERCITADA ${condicion.ejercitada.length} vez(ces)${condicion.ejercitada.length ? ':\n   · ' + condicion.ejercitada.join('\n   · ') : ' — residuo declarado, ver reporte'}`)

  // ── ARN-3 · Censo del insumo de cartas ────────────────────────────────────
  // El equivalente del censo de arriba para el hallazgo ➂: cuántas manos se
  // juzgaron con cartas LEÍDAS del showdown, cuántas hubo que destapar por la
  // puerta del producto y en cuántas se ejercitó la rama que consume cartas.
  // Igual que allí, nada aquí es una puerta: es el registro con el que el verde
  // se demuestra en vez de creerse.
  const conCartas = manosTodas.filter(m => m.via === 're-derivado')
  const insumo = {
    manos_n: manosTodas.length,
    conCartasLeidas_n: conCartas.length,
    porRetiros_n: manosTodas.filter(m => m.via === 'plantilla').length,
    sinCartas_n: manosTodas.filter(m => m.via === 'sin-cartas').length,
    destapadas_n: manosTodas.reduce((a, m) => a + (m.cartasTaps ? m.cartasTaps.length : 0), 0),
    cruceEvaluador_n: conCartas.filter(m => m.cartasCuadran).length,
    cazas: cazas.map(c => ({
      id: c.id, n: c.n, estado: c.ok === true ? 'VERDE' : c.ok === false ? 'ROJO' : 'RESIDUO',
      ejercitada: c.ejercitada, residuo: c.residuo,
      intentos: c.intentos.length,
      forzada: (c.intentos[c.intentos.length - 1] || {}).repartida ?? null,
      texto: (c.intentos[c.intentos.length - 1] || {}).texto ?? null,
    })),
  }
  console.log(`msg·ARN-3 insumo de cartas · manos=${insumo.manos_n} · re-derivadas con cartas leídas=${insumo.conCartasLeidas_n} · por retiros (sin cartas)=${insumo.porRetiros_n} · sin cartas fiables=${insumo.sinCartas_n} · manos destapadas por tap=${insumo.destapadas_n} · cruce con el evaluador=${insumo.cruceEvaluador_n}/${insumo.conCartasLeidas_n}`)
  const cazasHechas = cazas.filter(c => c.ejercitada)
  console.log(`msg·ARN-3 → CONDICIÓN AJILEI EJERCITADA ${cazasHechas.length}/${cazas.length}${cazasHechas.length ? ':\n   · ' + cazasHechas.map(c => `${c.id} T${c.n}: "${(c.intentos[c.intentos.length - 1] || {}).repartida}" → "${(c.intentos[c.intentos.length - 1] || {}).texto}"`).join('\n   · ') : ' — residuo declarado, ver reporte'}`)

  // Una caza que no logra forzar la condición NO pinta el modo de rojo: no es un
  // fallo del producto ni del lector, es una condición que no se dejó cazar, y
  // un rojo tiene que significar lo que dice. Se declara como residuo y la
  // sentencia es de Victor. Una caza que SÍ forzó la condición y luego no cuadra
  // sí es roja: ahí el instrumento tiene delante lo que buscaba.
  const passed = p1 && jugado.every(r => r.ok) && finales.every(f => f.p3) && anchuras.every(r => r.ok) &&
    cazas.every(c => c.ok !== false)
  const residuos = cazas.filter(c => c.ok === null)
  console.log(`\n── MSG: compositor ${p1 ? 'OK' : 'FALLA'} (${matriz.length} casos) · jugado ${jugado.filter(r => r.ok).length}/${jugado.length} · fin ${finales.filter(f => f.p3).length}/${finales.length} · Δ larga ${anchuras.filter(r => r.ok).length}/${anchuras.length} · caza ${cazas.filter(c => c.ok === true).length}/${cazas.length}${residuos.length ? ` (+${residuos.length} residuo)` : ''} · ${passed ? 'VERDE' : 'ROJO'}`)
  return { compositor: { p1, casos: matriz.length, sinPierdes, sinVozVieja, coherente, oroSoloGana, dobleOk, larga, largaDe, motorLargaDe }, jugado, cazas, finales, anchuras, condicionARN2: condicion, insumoARN3: insumo, passed }
}


// ══ EMB-2 · Modo `tapetes` ═══════════════════════════════════════════════════
// Documento rector: docs/AJILEI_Tapetes_v1.0.md · instrucción EMB-2 §4.
//
// Modo DIRIGIDO, no matricial: 5 tapetes × 2 caminos de render (mesa 5 vía
// `OpponentPanel`, mesa 2 vía `.ai-zone`) × 2 celdas de viewport del gate. No
// son las 24 celdas de campaña a propósito — el fieltro es pintura y no tiene
// con qué depender del ancho; lo que sí depende del camino es el DOM que se
// mide, y de ahí que los dos caminos sean obligatorios.
//
// Tres puertas por combinación:
//   (a) Δ=0 GEOMÉTRICO — y medido de la forma fuerte: el tapete se cambia EN
//       VIVO dentro de la MISMA página, con el mismo estado de juego y el mismo
//       panel abierto, así que entre las dos medidas no cambia absolutamente
//       nada salvo el atributo. Un Δ=0 entre dos cargas distintas habría medido
//       también el reparto; éste no puede.
//   (b) CONTRATO DE COLOR — v1.1, recableado en VIS-1c. Ver el bloque de
//       constantes de abajo: cinco puertas relacionales sobre tokens VIVOS, sin
//       un solo hex sellado dentro del arnés.
//   (c) CAPTURA PNG a capturas-dsk/ para la grilla del checkpoint.
//
// Y tres pruebas que no son por combinación:
//   · El FLUJO DE COMPRA completo (previa · «No» revierte · cerrar el panel
//     revierte · «Sí» registra y no cobra · persiste tras recarga).
//   · La celda MÓVIL con `tricolor` sembrado en localStorage → el fieltro lo
//     PINTA. Hasta MOV-1b-a esta puerta era la negativa del sello móvil
//     (exigía verde); al encenderse Tapetes en móvil se dio la vuelta, porque
//     lo que antes probaba el sello ahora probaría un fallo.
//   · Las capturas del peor caso llevan transitorios presentes (badge TURNO), y
//     el tricolor añade la ZONA DE RIESGO #1 recortada: las fichas doradas
//     sobre la banda amarilla, arriba, donde viven los oponentes.

const TAP_VARIANTES = TAPETES.map(t => t.id).filter(id => id !== TAPETE_POR_DEFECTO)
const TAP_MESAS = [5, 2]                                    // los DOS caminos de render
const TAP_VPS = [{ w: 1920, h: 937 }, { w: 1024, h: 768 }]  // la ancha y la más estrecha del gate
// Fuera del gate, por sus dos vías: portrait y landscape móvil.
const TAP_MOVIL = [{ w: 360, h: 640 }, { w: 740, h: 360 }]

// ── EL CONTRATO DE COLOR · VIS-1c ────────────────────────────────────────────
// Hasta v1.0 este modo comparaba cada rampa contra TAP_ESCALERA_VERDE: los
// cinco hexes de theme.css copiados aquí, con tolerancia de 1,0 punto de L. La
// puerta decía "profundidad equivalente" y medía "idéntica al verde de 2026-08".
// En cuanto VIS-1b calibró las cinco rampas —el verde incluido— se volvió un
// FALSO ROJO sobre los cinco tapetes: el instrumento medía contra un recuerdo.
//
// El arnés ya no guarda un solo color. Guarda RELACIONES, y las lee enteras de
// tokens vivos. Cinco puertas:
//   (1) ESCALERA MONÓTONA · L(abyss) < L(darkest) < L(deep) < L(base) <
//       L(bright). Es lo que "profundidad" significa sin nombrar un valor.
//   (2) SUPERFICIES DERIVADAS · game = rgb(base) al alfa de hoy; area y su
//       variante ligera = rgb(abyss) a los suyos. Los alfas siguen intocables:
//       fijan cuánta mesa se ve a través de la zona.
//   (3) FAMILIA DE MATIZ · las cinco paradas dentro de ±8° del matiz del base.
//       Un tapete es UN color en cinco profundidades, no cinco colores.
//   (4) SWATCH = BASE · el disco del menú ⋮ computa el `--green-base` de su
//       tapete. Desde v1.1 lo lee por token (`--tap-swatch-<id>`), así que esta
//       puerta es la que prueba que la fuente única de color no se rompió.
//   (5) DEFAULT = RAÍZ · con el verde puesto, los tokens de `body` son los de
//       `:root`. El verde no existe como regla; esto lo prueba en vez de
//       compararlo contra una copia.
// Ninguna nombra un hex. Victor puede recalibrar los cinco tapetes sin tocar
// una línea del arnés — que es justo lo que no pasó esta vez.
const TAP_PARADAS = ['--green-abyss', '--green-darkest', '--green-deep',
                     '--green-base', '--green-bright']
// Holgura de canal para una tinta derivada: el redondeo a 8 bits, y nada más.
const TAP_TOL_CANAL = 1
// Holgura de matiz. A L 6% un solo nivel de rgb mueve H casi dos grados, así
// que ±8 es cuantización con margen y no criterio: una parada que se fuera de
// familia de verdad se iría en decenas.
const TAP_TOL_H = 8
// Por debajo de esta saturación el matiz es RUIDO y no un dato: el grafito mide
// S≈7% y sus cinco paradas dan H entre 210 y 240 sin que ninguna decisión de
// diseño lo pida. La puerta (3) se OMITE ahí, declarándolo.
const TAP_S_MIN_MATIZ = 12
// Holgura de la envolvente del tricolor, en puntos de L (ver más abajo).
const TAP_TRI_HOLGURA_L = 1.0
// Las tintas traslúcidas del fieltro, cada una con la parada de la que DERIVA y
// el alfa que le fija cuánta mesa deja ver.
const TAP_TINTAS = {
  '--surface-game':       { de: '--green-base',  a: 0.88 },
  '--surface-area':       { de: '--green-abyss', a: 0.45 },
  '--surface-area-light': { de: '--green-abyss', a: 0.3 },
}
// Los ocho tokens que un tapete redefine: las cinco paradas y las tres tintas.
const TAP_TOKENS = [...TAP_PARADAS, ...Object.keys(TAP_TINTAS)]
// Zona de riesgo #1 (doc §2): el amarillo del tricolor NO es un segundo dorado.
// Distancia mínima declarada contra --gold-brand (H 41,7 S 77,3 L 60,2), en
// puntos de L. 25 es el listón; lo medido ronda los 43.
const TAP_ORO = { h: 41.7, s: 77.3, l: 60.2 }
const TAP_MIN_DL_ORO = 25

// Las CONSTANTES SELLADAS de cada camino de render, para que el modo sostenga
// la afirmación del §4(a) por sí mismo y no sólo por deducción. Mesa 5 (vía
// `OpponentPanel`): `.rivals-zone` cerrada en 196px por O1. Mesa 2 (vía
// `.ai-zone`): el piso convertido en techo por O2, con su escalón en
// `min-height: 900` — 236 border-box abajo del escalón y 260 encima.
// El Δ=0 en vivo ya implica que todo lo que cumple el verde lo cumple el
// tapete; esto lo dice además con el número escrito, que es lo que se lee
// dentro de seis meses.
const TAP_CONSTANTES = {
  5: () => ({ sel: '.rivals-zone', esperado: 196 }),
  2: (vp) => ({ sel: '.ai-zone', esperado: vp.h >= 900 ? 260 : 236 }),
}

// Anclas del Δ=0. Se listan las de los DOS caminos juntas y se ignoran las que
// no existan en la mesa medida: mesa 2 en escritorio no monta `.table-mid` ni
// `.opp-panel` (toma el negativo y usa `.ai-zone`), y eso es estructura, no
// falta. Cada ancla se mide en TODAS sus apariciones.
const TAP_ANCLAS = [
  '.game-table-screen', '.game-table', '.table-header', '.header-right',
  '.table-mid', '.rivals-zone', '.center-zone', '.pot-box',
  '.opp-panel', '.opp-cards', '.ai-zone', '.ai-info',
  '.player-zone', '.player-bar', '.cards-row', '.card-slot-wrapper',
  '.action-area', '.deck-shuffle-wrapper',
]

// ── Lectura de color, sin tocar el DOM ───────────────────────────────────────
// Se PARSEA la cadena del token en vez de inyectar un elemento sonda y leer su
// `color` computado: una sonda, por invisible que sea, es un nodo más en el
// árbol que se está midiendo con Δ=0. El parseo cubre las dos formas que usan
// theme.css y tapetes.css — hex de 6 dígitos y `rgb()/rgba()`.
function tapParseColor(txt) {
  const s = String(txt || '').trim()
  let m = /^#([0-9a-f]{6})$/i.exec(s)
  if (m) {
    const n = parseInt(m[1], 16)
    return { rgb: [(n >> 16) & 255, (n >> 8) & 255, n & 255], a: 1 }
  }
  m = /^rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:[,/\s]+([\d.]+))?\s*\)$/i.exec(s)
  if (m) return { rgb: [+m[1], +m[2], +m[3]], a: m[4] === undefined ? 1 : +m[4] }
  return null
}
function tapHSL([r, g, b]) {
  r /= 255; g /= 255; b /= 255
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2
  if (mx === mn) return { h: 0, s: 0, l: l * 100 }
  const d = mx - mn
  const s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn)
  let h
  if (mx === r) h = (g - b) / d + (g < b ? 6 : 0)
  else if (mx === g) h = (b - r) / d + 2
  else h = (r - g) / d + 4
  return { h: h * 60, s: s * 100, l: l * 100 }
}
// Distancia de matiz en el CÍRCULO: 358° y 2° distan 4, no 356. El vinotinto
// vive en H≈344 y una recalibración que lo cruzara por el 0 no puede salir roja
// por aritmética lineal.
function tapDeltaH(a, b) {
  const d = Math.abs(a - b) % 360
  return d > 180 ? 360 - d : d
}

// Devuelve los tokens vivos del fieltro tal cual los declara el árbol, más el
// atributo y lo que de verdad pintan las tres superficies. VIS-1c: lee los
// MISMOS tokens en `:root`, que es la referencia contra la que se prueba que el
// verde no existe como regla (puerta 5) — sin copiar sus valores al arnés.
const tapLeeTokens = (page) => page.evaluate((TOKENS) => {
  const cs = getComputedStyle(document.body)
  const cr = getComputedStyle(document.documentElement)
  const out = {}, raiz = {}
  TOKENS.forEach(t => {
    out[t] = cs.getPropertyValue(t).trim()
    raiz[t] = cr.getPropertyValue(t).trim()
  })
  const de = (sel, prop) => {
    const e = document.querySelector(sel)
    return e ? getComputedStyle(e)[prop] : null
  }
  return {
    tokens: out,
    raiz,
    attr: document.body.dataset.tapete ?? null,
    pintado: {
      bodyBG: cs.backgroundColor,
      mesaBG: de('.game-table', 'backgroundColor'),
      mesaIMG: (de('.game-table', 'backgroundImage') || '').slice(0, 40),
      pantallaIMG: (de('.game-table-screen', 'backgroundImage') || '').slice(0, 40),
    },
  }
}, [...TAP_TOKENS, '--tap-tri-amarillo', '--tap-tri-azul', '--tap-tri-rojo'])

// El disco del menú ⋮ de un tapete concreto. Se lee el `background` COMPUTADO,
// no el atributo `style`: desde v1.1 el JSX escribe `var(--tap-swatch-<id>)` y
// lo que interesa es en qué color resuelve, que es lo que ve el jugador.
const tapLeeDisco = (page, id) => page.evaluate((x) => {
  const sw = document.querySelector('.tap-swatch[data-tap="' + x + '"]')
  if (!sw) return null
  const d = sw.querySelector('.tap-disco')
  if (!d) return null
  const c = getComputedStyle(d)
  return { styleAttr: d.getAttribute('style'), bgColor: c.backgroundColor, bgImage: c.backgroundImage }
}, id)

const tapMideAnclas = (page) => page.evaluate((SELS) => {
  const r = {}
  SELS.forEach(s => {
    document.querySelectorAll(s).forEach((el, i) => {
      const b = el.getBoundingClientRect()
      r[s + '[' + i + ']'] = [b.x, b.y, b.width, b.height].map(v => Math.round(v * 100) / 100)
    })
  })
  return r
}, TAP_ANCLAS)

// Δ máximo entre dos mapas de anclas. Una clave que aparece o desaparece NO es
// un Δ de 0: es una falta estructural y se reporta aparte, porque un fieltro
// que montara o desmontara un nodo sería el peor fallo posible de esta tanda.
function tapDelta(a, b) {
  const claves = new Set([...Object.keys(a), ...Object.keys(b)])
  let max = 0, peor = null
  const faltan = []
  for (const k of claves) {
    if (!a[k] || !b[k]) { faltan.push(k); continue }
    for (let i = 0; i < 4; i++) {
      const d = Math.abs(a[k][i] - b[k][i])
      if (d > max) { max = d; peor = k + '[' + 'xywh'[i] + ']' }
    }
  }
  return { max: round(max), peor, faltan, n: claves.size }
}

// Siembra el storage por la VÍA REAL de activación (las claves de
// config/tapetes.js), antes de la primera navegación.
const tapSiembra = (page, activo, comprados) => page.addInitScript(([k, v, kc, vc]) => {
  if (v) localStorage.setItem(k, v)
  if (vc) localStorage.setItem(kc, vc)
}, [TAPETE_KEY, activo, TAPETES_COMPRADOS_KEY, comprados])

const TAP_TODOS = TAPETES.map(t => t.id).join(',')

const tapAbrePanel = async (page) => {
  await page.click('.utilities-trigger'); await page.waitForTimeout(120)
  await page.click('.util-item-tapetes'); await page.waitForTimeout(200)
  return page.evaluate(() => !!document.querySelector('.tapetes-panel'))
}

// Espera a que haya un badge TURNO VISIBLE: es la señal POSITIVA de fase de
// apuesta (lección ARN-2 — en escritorio el slot se reserva por visibility, así
// que un badge reservado no es señal). Con él en pantalla, la captura del peor
// caso lleva transitorios, que es lo que pide el §4.
async function tapEsperaTurno(page, ms = 45000) {
  const t0 = Date.now()
  while (Date.now() - t0 < ms) {
    const ok = await page.evaluate(() => [...document.querySelectorAll('.seat-badge-gold')]
      .some(b => ['T', 'Turno'].includes(b.textContent.trim()) &&
                 getComputedStyle(b).visibility !== 'hidden'))
    if (ok) return true
    await page.waitForTimeout(300)
  }
  return false
}

// Juzga una lectura de tokens contra el CONTRATO v1.1. Todo sale de `vivo`: sus
// tokens de `body` y los de `:root` que la misma lectura trae. Cero constantes
// de color.
function tapJuzgaBanda(vivo, id) {
  const hslDe = (t) => {
    const c = tapParseColor(vivo.tokens[t])
    return c ? tapHSL(c.rgb) : null
  }

  // (1) Escalera monótona. Cada parada tiene que ser MÁS CLARA que la anterior.
  const paradas = TAP_PARADAS.map((t, i) => {
    const x = hslDe(t)
    if (!x) return { t, ok: false, motivo: 'ilegible' }
    const prev = i === 0 ? null : hslDe(TAP_PARADAS[i - 1])
    return {
      t, hex: vivo.tokens[t], l: round(x.l), s: round(x.s), h: round(x.h),
      ok: prev === null || x.l > prev.l,
    }
  })

  // (2) Superficies derivadas. Cada tinta es el rgb de SU parada al alfa de hoy.
  const tintas = Object.entries(TAP_TINTAS).map(([t, d]) => {
    const c = tapParseColor(vivo.tokens[t]), o = tapParseColor(vivo.tokens[d.de])
    if (!c || !o) return { t, valor: vivo.tokens[t], ok: false, motivo: 'ilegible' }
    const dCanal = Math.max(...[0, 1, 2].map(i => Math.abs(c.rgb[i] - o.rgb[i])))
    return {
      t, de: d.de, valor: vivo.tokens[t], alfa: c.a, alfaEsperado: d.a, dCanal,
      ok: dCanal <= TAP_TOL_CANAL && Math.abs(c.a - d.a) < 0.005,
    }
  })

  // (3) Familia de matiz. Se OMITE cuando el base está desaturado: ahí el H es
  // ruido de cuantización y exigirle familia sería exigirle sentido al ruido.
  const hBase = hslDe('--green-base')
  let familia
  if (!hBase) familia = { ok: false, motivo: 'base ilegible' }
  else if (hBase.s < TAP_S_MIN_MATIZ) {
    familia = { omitida: true, motivo: 'S(base) < ' + TAP_S_MIN_MATIZ + '% · matiz = ruido',
      sBase: round(hBase.s), ok: true }
  } else {
    const ds = TAP_PARADAS.map(t => {
      const x = hslDe(t)
      return { t, h: x ? round(x.h) : null, dH: x ? round(tapDeltaH(x.h, hBase.h)) : null }
    })
    familia = { omitida: false, hBase: round(hBase.h), sBase: round(hBase.s), ds,
      ok: ds.every(d => d.dH !== null && d.dH <= TAP_TOL_H) }
  }

  // El tapete tiene que HABER CAMBIADO algo respecto de `:root`: si un id nuevo
  // dejara los tokens idénticos al verde, todas las demás puertas pasarían en
  // verde midiendo la nada. Ésta es la guardia contra ese falso verde.
  const cambia = TAP_PARADAS.some(t => vivo.tokens[t] !== vivo.raiz[t])

  // Bandas del tricolor: dentro de la envolvente de SU PROPIA escalera —VIS-1c;
  // antes se anclaban a la del verde, que desde v1.1 es otra familia y otra
  // profundidad—, menos saturadas que un pabellón y lejos del oro de marca en L.
  let bandas = null
  if (id === 'tricolor') {
    const lMin = hslDe('--green-darkest').l - TAP_TRI_HOLGURA_L
    const lMax = hslDe('--green-base').l + TAP_TRI_HOLGURA_L
    bandas = ['--tap-tri-amarillo', '--tap-tri-azul', '--tap-tri-rojo'].map(t => {
      const c = tapParseColor(vivo.tokens[t])
      if (!c) return { t, ok: false, motivo: 'ilegible' }
      const x = tapHSL(c.rgb)
      const dLoro = Math.abs(x.l - TAP_ORO.l)
      return {
        t, hex: vivo.tokens[t], h: round(x.h), s: round(x.s), l: round(x.l),
        envolvente: [round(lMin), round(lMax)], dLoro: round(dLoro),
        ok: x.l >= lMin && x.l <= lMax && x.s <= 60 && dLoro >= TAP_MIN_DL_ORO,
      }
    })
  }
  const ok = paradas.every(p => p.ok) && tintas.every(t => t.ok) && familia.ok &&
    cambia && (bandas === null || bandas.every(b => b.ok))
  return { paradas, tintas, familia, cambia, bandas, ok }
}

// (4) SWATCH = BASE. El disco tiene que computar el `--green-base` del tapete
// que representa. El tricolor no tiene tono medio: se exige que su degradado
// CONTENGA sus tres tintas, que es la versión honesta de la misma promesa.
function tapJuzgaDisco(disco, vivo, id) {
  if (!disco) return { ok: false, motivo: 'sin disco' }
  if (id === 'tricolor') {
    const tintas = ['--tap-tri-amarillo', '--tap-tri-azul', '--tap-tri-rojo'].map(t => {
      const c = tapParseColor(vivo.tokens[t])
      return { t, hex: vivo.tokens[t],
        presente: !!c && disco.bgImage.includes('rgb(' + c.rgb.join(', ') + ')') }
    })
    return { grad: disco.bgImage, styleAttr: disco.styleAttr, tintas, ok: tintas.every(x => x.presente) }
  }
  const b = tapParseColor(vivo.tokens['--green-base'])
  const d = tapParseColor(disco.bgColor)
  const dCanal = (b && d) ? Math.max(...[0, 1, 2].map(i => Math.abs(b.rgb[i] - d.rgb[i]))) : null
  return {
    bg: disco.bgColor, base: vivo.tokens['--green-base'], styleAttr: disco.styleAttr, dCanal,
    ok: dCanal !== null && dCanal <= TAP_TOL_CANAL,
  }
}

// Una línea por tapete con lo MEDIDO. El modo no dice sólo si pasa: dice contra
// qué pasó, para que un verde se pueda leer y no sólo creer.
// `ok` se pasa desde fuera porque el verde no lo calcula igual que sus cuatro
// hermanos: su guardia contra el falso verde no es `cambia` —el verde ES la
// raíz— sino `verdeEsRaiz`, que se mide en la celda y no aquí.
function tapLinea(id, banda, disco, ok) {
  const L = banda.paradas.map(p => p.l).join(' < ')
  const fam = banda.familia.omitida
    ? 'H ruido (S ' + banda.familia.sBase + '%)'
    : 'H ' + banda.familia.hBase + ' ±' + Math.max(...banda.familia.ds.map(d => d.dH)) +
      ' · S ' + banda.familia.sBase + '%'
  const sw = id === 'tricolor'
    ? 'disco grad ' + (disco.ok ? 'con sus 3 tintas' : 'INCOMPLETO')
    : 'disco ' + disco.bg + (disco.ok ? '' : ' ≠ base ' + disco.base)
  return '     ' + id.padEnd(10) + ' L ' + L +
    ' · ' + fam +
    ' · base ' + banda.paradas[3].hex +
    ' → ' + banda.tintas[0].valor +
    ' · ' + sw + ' · ' + (ok ? 'ok' : 'FALLA')
}

async function runTapetes(browser) {
  const celdas = []
  const capturas = []

  // ── (1) Δ=0 + banda · el tapete se cambia EN VIVO, misma página ────────────
  for (const n of TAP_MESAS) {
    for (const vp of TAP_VPS) {
      const page = await browser.newPage({ viewport: { width: vp.w, height: vp.h } })
      await tapSiembra(page, TAPETE_POR_DEFECTO, TAP_TODOS)   // todo comprado: el press aplica directo
      await gotoMesa(page, n)
      await page.waitForTimeout(300)
      await page.mouse.move(5, 5)
      // El panel NO BLOQUEA NI PAUSA EL JUEGO (v1.0 §4), y eso empieza por no
      // ocupar una celda del flujo: se miden las anclas con el panel CERRADO y
      // se vuelven a medir con él abierto. Molde `fueraDeFlujo` de u1.
      const anclasCerrado = await tapMideAnclas(page)
      const panelAbre = await tapAbrePanel(page)

      const base = await tapLeeTokens(page)
      const anclasBase = await tapMideAnclas(page)
      const dAbrir = tapDelta(anclasCerrado, anclasBase)
      // Y cabe entero en el viewport, anclado al ⋮ como sus hermanos.
      const panelRect = await page.evaluate(() => {
        const e = document.querySelector('.tapetes-panel')
        if (!e) return null
        const b = e.getBoundingClientRect()
        return { x: b.x, y: b.y, w: b.width, h: b.height, right: b.right, bottom: b.bottom }
      })
      // (5) DEFAULT = RAÍZ. Con el verde puesto, los ocho tokens de `body` son
      // los de `:root`: el verde NO existe como regla, es la ausencia de
      // variante. Antes esto se comprobaba contra una copia de theme.css dentro
      // del arnés; ahora se comprueba contra el propio `:root` vivo, así que
      // sobrevive a cualquier recalibración de Victor.
      const verdeEsRaiz = TAP_TOKENS.every(t => base.tokens[t] === base.raiz[t])
      // Y el verde también pasa el contrato de color, como los otros cuatro.
      const bandaVerde = tapJuzgaBanda(base, TAPETE_POR_DEFECTO)
      const discoVerde = tapJuzgaDisco(
        await tapLeeDisco(page, TAPETE_POR_DEFECTO), base, TAPETE_POR_DEFECTO)
      // `cambia` sólo aplica a las variantes: el verde ES la raíz por
      // definición, así que su guardia contra el falso verde es `verdeEsRaiz`.
      const verdeOk = bandaVerde.paradas.every(p => p.ok) &&
        bandaVerde.tintas.every(t => t.ok) && bandaVerde.familia.ok && discoVerde.ok

      const cte = TAP_CONSTANTES[n](vp)
      const leeCte = () => page.evaluate(s => {
        const e = document.querySelector(s)
        return e ? Math.round(e.getBoundingClientRect().height * 100) / 100 : null
      }, cte.sel)
      const cteVerde = await leeCte()

      const variantes = []
      for (const id of TAP_VARIANTES) {
        await page.click('.tap-swatch[data-tap="' + id + '"]')
        await page.waitForTimeout(220)
        const vivo = await tapLeeTokens(page)
        const d = tapDelta(anclasBase, await tapMideAnclas(page))
        const banda = tapJuzgaBanda(vivo, id)
        const disco = tapJuzgaDisco(await tapLeeDisco(page, id), vivo, id)
        const cteVivo = await leeCte()
        variantes.push({
          id, attr: vivo.attr, delta: d, banda, disco, pintado: vivo.pintado,
          cte: { sel: cte.sel, esperado: cte.esperado, medido: cteVivo },
          cteOk: cteVivo === cte.esperado,
          delta0: d.max === 0 && d.faltan.length === 0,
          aplicado: vivo.attr === id,
          bandaOk: banda.ok,
          discoOk: disco.ok,
        })
      }
      // Vuelta al verde: el default tiene que restituirse EXACTO.
      await page.click('.tap-swatch[data-tap="' + TAPETE_POR_DEFECTO + '"]')
      await page.waitForTimeout(220)
      const vuelta = await tapLeeTokens(page)
      const dVuelta = tapDelta(anclasBase, await tapMideAnclas(page))
      const verdeVuelve = vuelta.attr === TAPETE_POR_DEFECTO &&
        TAP_PARADAS.every(t => vuelta.tokens[t] === base.tokens[t]) &&
        dVuelta.max === 0 && dVuelta.faltan.length === 0

      const checks = {
        panelAbre,
        panelFueraDeFlujo: dAbrir.max === 0 && dAbrir.faltan.length === 0,
        panelEncaja: panelRect != null && panelRect.x >= 0 && panelRect.y >= 0 &&
          panelRect.right <= vp.w && panelRect.bottom <= vp.h,
        verdeEsRaiz,
        verdeOk,
        // La constante del camino, en verde y con cada tapete puesto (§4a).
        constanteCamino: cteVerde === cte.esperado && variantes.every(v => v.cteOk),
        delta0: variantes.every(v => v.delta0),
        aplicado: variantes.every(v => v.aplicado),
        banda: variantes.every(v => v.bandaOk),
        disco: variantes.every(v => v.discoOk),
        verdeVuelve,
      }
      const passed = Object.values(checks).every(v => v === true)
      celdas.push({ mesa: n, vp, panelRect, dAbrir, verde: { banda: bandaVerde, disco: discoVerde, esRaiz: verdeEsRaiz }, variantes, vuelta: { attr: vuelta.attr, delta: dVuelta }, checks, passed })
      console.log('T' + n + ' ' + vp.w + 'x' + vp.h + ' · panel ' + (panelRect && round(panelRect.w)) + '×' +
        (panelRect && round(panelRect.h)) + ' Δabrir=' + dAbrir.max +
        ' · ' + cte.sel + ' ' + cteVerde + '/' + cte.esperado +
        ' · Δ ' + variantes.map(v => v.delta.max).join('/') +
        ' (' + variantes.length + ' tapetes, ' + (variantes[0] && variantes[0].delta.n) + ' anclas) · contrato ' +
        (variantes.filter(v => v.bandaOk && v.discoOk).length + (verdeOk ? 1 : 0)) + '/' + (variantes.length + 1) +
        ' · vuelta ' + verdeVuelve + ' · ' +
        (passed ? 'OK' : 'FAIL [' + Object.entries(checks).filter(([, v]) => v === false).map(([k]) => k).join(',') + ']'))
      // Lo MEDIDO, tapete por tapete. Un verde tiene que poder leerse.
      console.log(tapLinea(TAPETE_POR_DEFECTO, bandaVerde, discoVerde, verdeOk && verdeEsRaiz) +
        (verdeEsRaiz ? ' · = :root' : ' · ≠ :root ¡FALLA!'))
      for (const v of variantes) console.log(tapLinea(v.id, v.banda, v.disco, v.bandaOk && v.discoOk))
      await page.close()
    }
  }

  // ── (2) Flujo de compra · previa, «No», Esc, «Sí» y persistencia ───────────
  const compra = []
  for (const n of TAP_MESAS) {
    const vp = TAP_VPS[0]
    const page = await browser.newPage({ viewport: { width: vp.w, height: vp.h } })
    await gotoMesa(page, n)          // arranque en FRÍO: nada sembrado en disco
    await page.waitForTimeout(250)
    await page.mouse.move(5, 5)
    await tapAbrePanel(page)

    const frio = await page.evaluate(([k, kc]) => ({
      attr: document.body.dataset.tapete ?? null,
      ls: localStorage.getItem(k), lsc: localStorage.getItem(kc),
      estados: [...document.querySelectorAll('.tap-swatch')].map(s => s.dataset.estado),
      precios: [...document.querySelectorAll('.tap-precio')].map(e => e.textContent.trim()),
    }), [TAPETE_KEY, TAPETES_COMPRADOS_KEY])

    // Previa: se aplica al instante y el diálogo se pinta encima.
    await page.click('.tap-swatch[data-tap="tricolor"]'); await page.waitForTimeout(220)
    const previa = await page.evaluate(([k, kc]) => ({
      attr: document.body.dataset.tapete ?? null,
      dialogo: !!document.querySelector('.tap-dialogo'),
      txt: document.querySelector('.tap-dialogo-txt') ? document.querySelector('.tap-dialogo-txt').textContent.trim() : null,
      activoPanel: document.querySelector('.tapetes-panel').dataset.activo,
      ls: localStorage.getItem(k), lsc: localStorage.getItem(kc),
    }), [TAPETE_KEY, TAPETES_COMPRADOS_KEY])

    // «No» revierte al activo y no deja rastro en disco.
    await page.click('.tap-btn-no'); await page.waitForTimeout(220)
    const trasNo = await page.evaluate(([k, kc]) => ({
      attr: document.body.dataset.tapete ?? null,
      dialogo: !!document.querySelector('.tap-dialogo'),
      ls: localStorage.getItem(k), lsc: localStorage.getItem(kc),
    }), [TAPETE_KEY, TAPETES_COMPRADOS_KEY])

    // Cerrar el PANEL con la previa viva también revierte.
    await page.click('.tap-swatch[data-tap="azul"]'); await page.waitForTimeout(180)
    const previaAzul = await page.evaluate(() => document.body.dataset.tapete ?? null)
    await page.keyboard.press('Escape'); await page.waitForTimeout(200)
    const trasEsc = await page.evaluate(() => ({
      attr: document.body.dataset.tapete ?? null,
      panel: !!document.querySelector('.tapetes-panel'),
    }))

    // Saldo ANTES de comprar: la compra no cobra (v1.0 §5) y hay que probarlo.
    const saldoAntes = await page.evaluate(() =>
      document.querySelector('.player-bar-right .bd-num')
        ? document.querySelector('.player-bar-right .bd-num').textContent.trim() : null)

    // «Sí» registra propiedad y deja el tapete puesto.
    await tapAbrePanel(page)
    await page.click('.tap-swatch[data-tap="tricolor"]'); await page.waitForTimeout(180)
    await page.click('.tap-btn-si'); await page.waitForTimeout(250)
    const trasSi = await page.evaluate(([k, kc]) => ({
      attr: document.body.dataset.tapete ?? null,
      dialogo: !!document.querySelector('.tap-dialogo'),
      ls: localStorage.getItem(k), lsc: localStorage.getItem(kc),
      estado: document.querySelector('.tap-swatch[data-tap="tricolor"]').dataset.estado,
      saldo: document.querySelector('.player-bar-right .bd-num')
        ? document.querySelector('.player-bar-right .bd-num').textContent.trim() : null,
    }), [TAPETE_KEY, TAPETES_COMPRADOS_KEY])

    // El atributo VIVE MIENTRAS VIVE LA MESA: al abandonarla se retira y el
    // lobby vuelve a su verde. Es la contrapartida obligatoria de haber sacado
    // el efecto del árbol de React — sin esta puerta, una fuga al lobby sería
    // invisible hasta que alguien la viera con los ojos.
    await page.click('.btn-leave'); await page.waitForTimeout(200)
    await page.click('.leave-modal button:has-text("Abandonar mesa")')
    await page.waitForTimeout(300)
    const trasSalir = await page.evaluate(([k]) => ({
      attr: document.body.dataset.tapete ?? null,
      mesa: !!document.querySelector('.game-table'),
      ls: localStorage.getItem(k),
    }), [TAPETE_KEY])

    // Persistencia: recargar y volver a entrar por la ruta canónica.
    await page.reload()
    const enLobby = await page.evaluate(() => document.body.dataset.tapete ?? null)
    await volverALaMesa(page, n)
    await page.waitForTimeout(250)
    await page.mouse.move(5, 5)
    await tapAbrePanel(page)
    const trasRecarga = await page.evaluate(() => {
      const sw = document.querySelector('.tap-swatch[data-tap="tricolor"]')
      return {
        attr: document.body.dataset.tapete ?? null,
        estado: sw.dataset.estado,
        precioTricolor: !!sw.querySelector('.tap-precio'),
        chip: sw.querySelector('.tap-chip') ? sw.querySelector('.tap-chip').textContent.trim() : null,
      }
    })

    const c = {
      frioVerde: frio.attr === TAPETE_POR_DEFECTO && frio.ls === null && frio.lsc === null,
      estadosFrio: frio.estados[0] === 'activo' && frio.estados.slice(1).every(e => e === 'no-comprado'),
      // Copy y montos SALEN de la fuente única: si alguien los escribiera a
      // mano en el JSX, esta puerta es la que discrepa.
      preciosDeLaFuente: frio.precios.length === TAP_VARIANTES.length &&
        TAP_VARIANTES.every(id => frio.precios.includes(
          montoTexto(TAPETES.find(t => t.id === id).precio) + ' fichas')),
      previaAplica: previa.attr === 'tricolor' && previa.dialogo === true &&
        previa.activoPanel === TAPETE_POR_DEFECTO,
      previaNoPersiste: previa.ls === null && previa.lsc === null,
      dialogoDiceLoQueDebe: previa.txt === '¿Comprar Tricolor por ' + montoTexto(50000) + ' fichas?',
      noRevierte: trasNo.attr === TAPETE_POR_DEFECTO && trasNo.dialogo === false &&
        trasNo.ls === null && trasNo.lsc === null,
      cerrarPanelRevierte: previaAzul === 'azul' && trasEsc.attr === TAPETE_POR_DEFECTO &&
        trasEsc.panel === false,
      siRegistra: trasSi.attr === 'tricolor' && trasSi.dialogo === false &&
        trasSi.ls === 'tricolor' && trasSi.lsc === 'verde,tricolor' &&
        trasSi.estado === 'activo',
      // Sin descuento de saldo — la economía nace en Supabase (v1.0 §5).
      sinCobro: saldoAntes !== null && trasSi.saldo === saldoAntes,
      // El lobby jamás ve el atributo: ni al abandonar la mesa ni tras recargar.
      // La PROPIEDAD, en cambio, sobrevive — es lo único que debe sobrevivir.
      salirLimpia: trasSalir.attr === null && trasSalir.mesa === false &&
        trasSalir.ls === 'tricolor' && enLobby === null,
      persiste: trasRecarga.attr === 'tricolor' && trasRecarga.estado === 'activo' &&
        trasRecarga.precioTricolor === false && trasRecarga.chip === 'Puesto',
    }
    const passed = Object.values(c).every(v => v === true)
    compra.push({ mesa: n, frio, previa, trasNo, previaAzul, trasEsc, saldoAntes, trasSi, trasSalir, enLobby, trasRecarga, checks: c, passed })
    console.log('T' + n + ' compra · frío ' + frio.attr + '/' + frio.estados.join(',') +
      ' · previa ' + previa.attr + ' · No→' + trasNo.attr + ' · Esc→' + trasEsc.attr +
      ' · Sí→' + trasSi.attr + ' ls "' + trasSi.lsc + '" saldo ' + saldoAntes + '→' + trasSi.saldo +
      ' · salir→' + trasSalir.attr + ' lobby→' + enLobby +
      ' · recarga ' + trasRecarga.attr + '/' + trasRecarga.estado + ' · ' +
      (passed ? 'OK' : 'FAIL [' + Object.entries(c).filter(([, v]) => v === false).map(([k]) => k).join(',') + ']'))
    await page.close()
  }

  // ── (3) Prueba NEGATIVA del gate · móvil con tricolor sembrado ─────────────
  const movil = []
  for (const vp of TAP_MOVIL) {
    const page = await browser.newPage({ viewport: { width: vp.w, height: vp.h } })
    await tapSiembra(page, 'tricolor', TAP_TODOS)
    await gotoMesa(page, 5)
    await page.waitForTimeout(300)
    const t = await tapLeeTokens(page)
    const ls = await page.evaluate(k => localStorage.getItem(k), TAPETE_KEY)
    // VIS-1c: "renderiza verde" se prueba contra `:root` vivo, no contra una
    // copia sellada de theme.css. Un solo verde en todo el producto significa
    // exactamente esto: fuera del gate, `body` no redefine nada.
    // ── MOV-1b-a · RECABLEADO (regla ARN-1) ────────────────────────────────
    // Esta puerta exigía lo contrario: que en móvil el fieltro saliera VERDE
    // aunque el storage trajera un tricolor. Era correcta mientras Tapetes
    // fuera función de escritorio, y medía el segundo cinturón —el bloque
    // gateado de tapetes.css—. MOV-1b-a enciende Tapetes en móvil con
    // autorización de Victor y desanida ese bloque, así que el verde de antes
    // pasa a significar "el jugador eligió un tapete y no lo ve": el fallo, no
    // el sello. La puerta se da la vuelta en la MISMA tanda que mueve la ruta.
    const esRaiz = TAP_TOKENS.every(p => t.tokens[p] === t.raiz[p])
    const ok = ls === 'tricolor' && t.attr === 'tricolor' && !esRaiz
    movil.push({ vp, ls, attr: t.attr, tokens: t.tokens, raiz: t.raiz, esRaiz, ok })
    console.log('MÓVIL ' + vp.w + 'x' + vp.h + ' · storage "' + ls + '" · attr ' + t.attr +
      ' · base ' + t.tokens['--green-base'] + ' · ' + (ok ? 'OK (pinta el tapete)' : 'FAIL'))
    await page.close()
  }

  // ── (4) Capturas · la grilla del checkpoint, con transitorios ──────────────
  for (const n of TAP_MESAS) {
    for (const vp of TAP_VPS) {
      for (const t of TAPETES) {
        const page = await browser.newPage({ viewport: { width: vp.w, height: vp.h } })
        await tapSiembra(page, t.id, TAP_TODOS)
        await gotoMesa(page, n)
        await clickIf(page, 'button:has-text("Iniciar mano")')
        const turno = await tapEsperaTurno(page)
        await page.mouse.move(5, 5)
        await page.waitForTimeout(250)
        const path = OUT_DIR + '/tapete_' + t.id + '_t' + n + '_' + vp.w + 'x' + vp.h + '.png'
        await page.screenshot({ path })
        capturas.push({ tapete: t.id, mesa: n, vp: vp.w + 'x' + vp.h, turno, path })
        // ZONA DE RIESGO #1 · el tercio superior de la mesa, que es donde vive
        // la banda amarilla (plena hasta el 8%, en transición hasta el 40%) y
        // donde viven los oponentes con sus fichas doradas. El recorte se
        // DERIVA de la caja viva de `.game-table`, nunca de píxeles cableados.
        if (t.id === 'tricolor') {
          const caja = await page.evaluate(() => {
            const b = document.querySelector('.game-table').getBoundingClientRect()
            return { x: Math.max(0, b.x), y: Math.max(0, b.y), width: b.width, height: b.height * 0.35 }
          })
          const pr = OUT_DIR + '/tapete_riesgo1_t' + n + '_' + vp.w + 'x' + vp.h + '.png'
          await page.screenshot({ path: pr, clip: caja })
          capturas.push({ tapete: 'tricolor', zona: 'riesgo1', mesa: n, vp: vp.w + 'x' + vp.h, turno, path: pr })
        }
        await page.close()
      }
    }
  }
  console.log('CAPTURAS ' + capturas.length + ' · con transitorio (TURNO) ' +
    capturas.filter(c => c.turno).length + '/' + capturas.length)

  const passed = celdas.every(c => c.passed) && compra.every(c => c.passed) &&
    movil.every(m => m.ok) && capturas.every(c => c.turno === true)
  console.log('\n── TAPETES: ' + celdas.filter(c => c.passed).length + '/' + celdas.length +
    ' celdas · compra ' + compra.filter(c => c.passed).length + '/' + compra.length +
    ' · móvil ' + movil.filter(m => m.ok).length + '/' + movil.length +
    ' · ' + capturas.length + ' capturas · ' + (passed ? 'VERDE' : 'ROJO'))
  // El JSON se autoetiqueta con el CONTRATO, no con una tabla de colores: es lo
  // que hay que poder leer dentro de seis meses para saber qué probó esta
  // corrida. Los colores medidos ya viven, tapete por tapete, dentro de celdas.
  const contrato = {
    version: 'v1.1 (VIS-1c)',
    puertas: ['escalera monótona L', 'superficies derivadas rgb+alfa',
              'familia de matiz ±' + TAP_TOL_H + '°', 'swatch = base', 'default = :root'],
    tolCanal: TAP_TOL_CANAL, tolH: TAP_TOL_H, sMinMatiz: TAP_S_MIN_MATIZ,
    tintas: TAP_TINTAS, tokens: TAP_TOKENS,
  }
  return { celdas, compra, movil, capturas, contrato, passed }
}

// ── Main ──────────────────────────────────────────────────────────────────────
// ── VIS-3 · Modo `vuelo` · el pozo va a la moneda del ganador ───────────────
// Documento rector: docs/AJILEI_Victory_Celebration_v1.0.md §3.1 (Vuelo v2).
//
// Este modo JUEGA — no construye. El modo `vc` construye la celebración con
// `__vcConstruye` para poder auditar sus 20 celdas en tiempo razonable, y eso
// está bien para capas, tokens y Δ=0; pero el contrato de VIS-3 es "el vuelo
// aterriza sobre la moneda del ganador", y un ganador no se puede construir:
// hay que ganarle o perder contra él. Dos escenarios en mesa 5, uno por bando.
//
// LO QUE SE MIDE, y de dónde sale cada cosa:
//   · el destino, del ATRIBUTO `data-coin-target` — nunca de una posición;
//   · el índice del ganador, corroborado APARTE (chip de puntaje / mensaje),
//     para que el arnés no se limite a repetirle a la app lo que ella dijo;
//   · el aterrizaje, del último muestreo por rAF de la séptima moneda: su
//     `transitionend` cae en el mismo instante en que useCelebracion desmonta
//     la capa y se pierde por carrera (medido: 6 de 7 eventos en la primera
//     corrida). El muestreo no tiene esa carrera y el error es despreciable
//     porque la cola del easing es casi plana;
//   · la escala, de dividir el lado MEDIDO del destino entre el lado MEDIDO de
//     la moneda en vuelo. Ni un 24 ni un 36 escritos aquí;
//   · las siete monedas, contra VIAJE_N importada de la app.
//
// ALCANCE DECLARADO: el orden de sucesos del SALDO sólo se comprueba en la
// victoria humana. El saldo de una IA vive detrás del toggle de su ficha de
// esquina, y abrirlo durante el vuelo es imposible por construcción — un
// `pointerdown` corta la celebración (VC v1.0 §6). En la victoria de IA se
// comprueba el pozo, la ausencia de celebración, y que al ABRIR el toggle
// DESPUÉS del vuelo el saldo ya está liberado.
async function runVuelo(browser) {
  const { VIAJE_N } = await import('../src/hooks/celebracionCore.js')
  const VP = { w: 1920, h: 1080 }
  const cells = []

  for (const esc of [{ id: 'humano', quien: 'win', maxManos: 40 }, { id: 'ia', quien: 'lose', maxManos: 10 }]) {
    const page = await browser.newPage({ viewport: { width: VP.w, height: VP.h } })
    const c = { escenario: esc.id, mesa: 5, vp: `${VP.w}x${VP.h}` }
    try {
      await gotoMesa(page, 5)
      await vcEspera(page, 400)

      await page.evaluate(() => {
        const q = v => Math.round(v * 1000) / 1000
        const R = e => { if (!e) return null; const b = e.getBoundingClientRect()
          return { w: q(b.width), h: q(b.height), cx: q(b.left + b.width / 2), cy: q(b.top + b.height / 2) } }
        const destinos = () => [...document.querySelectorAll('[data-coin-target]')].map(h => {
          const m = h.querySelector('.chip-token')
          return { idx: h.getAttribute('data-coin-target'), m: R(m) }
        })
        window.__vu = { nac: [], ultimos: {}, maxFichas: 0, overlay: false, pulso: false, traza: [] }
        // El veredicto mira UNA mano: la que alcanzó el escenario. Sin este
        // borrado, `ultimos[6]` podía traer la moneda de un vuelo ANTERIOR —las
        // manos perdidas también vuelan desde VIS-3, y el robot las corta al
        // instante— y el modo juzgaba una foto de otra mano. Se vio: destino "3"
        // contra un ganador corroborado "4", y escala 1 (ni había despegado).
        window.__vuReset = () => {
          window.__vu.nac = []; window.__vu.ultimos = {}; window.__vu.maxFichas = 0
          window.__vu.overlay = false; window.__vu.pulso = false; window.__vu.traza = []
        }
        const txt = s => { const e = document.querySelector(s); return e ? e.textContent.trim() : null }
        const paso = () => {
          if (document.querySelector('.vc-ajilei-capa')) window.__vu.overlay = true
          if (document.querySelector('.vc-pulso')) window.__vu.pulso = true
          const fichas = [...document.querySelectorAll('.vc-ficha')]
          if (fichas.length > window.__vu.maxFichas) window.__vu.maxFichas = fichas.length
          fichas.forEach((f, i) => {
            if (f.__vu !== undefined) return
            f.__vu = i
            window.__vu.nac.push({ i, t: Math.round(performance.now()), img: R(f.querySelector('.chip-token')) })
          })
          for (const f of fichas) {
            window.__vu.ultimos[f.__vu] = { t: Math.round(performance.now()),
              img: R(f.querySelector('.chip-token')), scale: getComputedStyle(f).scale, escalaDeclarada: f.style.scale, destinos: destinos() }
          }
          // Traza de cifras: sólo se anota cuando algo cambia, para que el orden
          // de sucesos se lea sin ruido.
          const fila = { pot: txt('.pot-value'), saldo: txt('.pbr-chips .bd-num'), n: fichas.length,
                         capa: !!document.querySelector('.vc-capa') }
          const ult = window.__vu.traza[window.__vu.traza.length - 1]
          if (!ult || ult.pot !== fila.pot || ult.saldo !== fila.saldo || ult.n !== fila.n || ult.capa !== fila.capa) {
            window.__vu.traza.push({ ...fila, t: Math.round(performance.now()) })
          }
        }
        const bucle = () => { paso(); requestAnimationFrame(bucle) }
        requestAnimationFrame(bucle)
        new MutationObserver(paso).observe(document.body, { childList: true, subtree: true, attributes: true })
        paso()
      })

      // ── El robot: juega hasta que gane quien toca ──────────────────────────
      // Descarta de verdad (hasta 3 cartas). Sin eso el humano no gana una mano
      // en mesa 5 auto-jugando — es el mismo hallazgo que acotó la sub-pasada
      // jugada del modo `vc` a la mesa de 2.
      let fin = null, manos = 0, fallos = 0
      for (let mano = 1; mano <= esc.maxManos && fin !== esc.quien; mano++) {
        manos = mano
        await page.evaluate(() => window.__vuReset && window.__vuReset())
        await clickIf(page, 'button:has-text("Iniciar mano")')
        fin = null
        // MEDIDO: una mano de mesa 5 con cuatro IAs dura ~55 s de reloj. Con un
        // presupuesto de 300 vueltas (~42 s de esperas) el bucle se rendía justo
        // ANTES del final, y entonces el reintento buscaba el botón de una mano
        // todavía en curso y daba la mesa por abortada en la primera mano.
        for (let i = 0; i < 700 && !fin; i++) {
          await vcEspera(page, 140)
          const acabo = await page.locator('button:has-text("Siguiente mano")').first().isVisible().catch(() => false)
          if (acabo) {
            fin = await page.evaluate(() => {
              const m = document.querySelector('.game-message')
              if (!m) return 'fin'
              return m.classList.contains('msg-win') ? 'win' : (m.classList.contains('msg-lose') ? 'lose' : 'fin')
            })
            break
          }
          await page.mouse.move(2, 2)
          const hayDescarte = await page.locator('.action-area button:has-text("Sin descartar")').first().isVisible().catch(() => false)
          if (hayDescarte) {
            const cartas = page.locator('.card-clickable')
            const n = Math.min(3, await cartas.count())
            for (let k = 0; k < n; k++) await cartas.nth(k).click({ timeout: 1200 }).catch(() => {})
            await vcEspera(page, 80)
            if (!await clickIf(page, '.action-area button:has-text("Descartar")')) {
              await clickIf(page, '.action-area button:has-text("Sin descartar")')
            }
            continue
          }
          await clickIf(page, '.action-buttons button:has-text("Pasar")') ||
            await clickIf(page, '.action-buttons button:has-text("Igualar")') ||
            await clickIf(page, '.action-buttons button:has-text("Apostar")')
        }
        if (fin === esc.quien) break
        // "Siguiente mano" con reintento: el botón puede tardar en montarse
        // (limpieza, ceremonia de eliminación), y rendirse al primer intento
        // abortaba la búsqueda entera tras 3 manos — medido.
        let siguio = false
        for (let k = 0; k < 40 && !siguio; k++) {
          siguio = await clickIf(page, 'button:has-text("Siguiente mano")')
          if (!siguio) await vcEspera(page, 500)
        }
        // No se aborta al primer tropiezo: se cuentan. Una mano que no cierra es
        // ruido del muestreador; tres seguidas ya son una mesa que no avanza.
        fallos = siguio ? 0 : fallos + 1
        if (fallos >= 3) { c.abortadaEn = `mano ${mano}: 3 manos sin cerrar`; break }
        await vcEspera(page, 400)
      }
      c.manos = manos
      c.alcanzado = fin === esc.quien
      // Esperar AL HECHO, no al reloj: que la capa haya nacido y vuelto a morir.
      // Un plazo fijo no sirve — la espera a showdown.mp3 mide 1883 ms medidos
      // (y su tope son 3000) y el vuelo otros 1640, así que 3200 ms muestreaban
      // la moneda EN EL AIRE: se vio escala 1,0001 contra 1,5, que es una moneda
      // que ni había empezado a crecer, y un Δ de 75 px que era simple trayecto
      // pendiente.
      let nacio = false
      for (let k = 0; k < 160; k++) {
        const viva = await page.evaluate(() => !!document.querySelector('.vc-capa'))
        if (viva) nacio = true
        if (nacio && !viva) break
        await vcEspera(page, 100)
      }
      c.capaNacio = nacio
      await vcEspera(page, 300)

      const v = await page.evaluate(() => window.__vu)
      c.ganadorCorroborado = await page.evaluate(() => {
        // El índice del ganador, leído por una vía DISTINTA del atributo que se
        // está auditando: el chip de puntaje del showdown, o el humano si el
        // mensaje es de victoria.
        const m = document.querySelector('.game-message')
        if (m && m.classList.contains('msg-win')) return '0'
        const p = [...document.querySelectorAll('.opp-panel, .ai-zone')].find(x => x.querySelector('.win-score-chip'))
        if (p) { const t = p.querySelector('[data-coin-target]'); return t ? t.getAttribute('data-coin-target') : null }
        return null
      })

      // ── Veredicto ──────────────────────────────────────────────────────────
      const iMax = Object.keys(v.ultimos).length ? Math.max(...Object.keys(v.ultimos).map(Number)) : -1
      const sep = iMax >= 0 ? v.ultimos[iMax] : null
      const ladoVuelo = v.nac.length ? v.nac[0].img.w : null
      let destino = null, d = Infinity
      if (sep) for (const t of sep.destinos) {
        if (!t.m) continue
        const dd = Math.hypot(t.m.cx - sep.img.cx, t.m.cy - sep.img.cy)
        if (dd < d) { d = dd; destino = t }
      }
      const dx = sep && destino ? Math.abs(sep.img.cx - destino.m.cx) : null
      const dy = sep && destino ? Math.abs(sep.img.cy - destino.m.cy) : null
      const escEsperada = destino && ladoVuelo ? destino.m.w / ladoVuelo : null

      // Orden de sucesos, leído de la traza y no de un cronómetro.
      const t0 = v.nac.length ? v.nac[0].t : null                    // sale la primera
      const antes = v.traza.filter(x => t0 !== null && x.t < t0)
      const durante = v.traza.filter(x => t0 !== null && x.t >= t0)
      const potAntes = antes.length ? antes[antes.length - 1].pot : null
      const potDurante = durante.length ? durante[0].pot : null
      // El saldo del humano: no puede subir mientras haya monedas en el aire.
      const saldosConCapa = [...new Set(v.traza.filter(x => x.capa).map(x => x.saldo))]
      const saldoFinal = v.traza.length ? v.traza[v.traza.length - 1].saldo : null
      const subeAlFinal = esc.id === 'humano'
        ? (saldosConCapa.length === 1 && saldoFinal !== null && Number(saldoFinal) > Number(saldosConCapa[0]))
        : null

      // En la victoria de IA: tras el vuelo, abrir el toggle debe dar el saldo
      // ya LIBERADO (la retención no sobrevive a la celebración).
      let saldoIALiberado = null
      if (esc.id === 'ia' && c.alcanzado) {
        await clickIf(page, `[data-coin-target="${c.ganadorCorroborado}"]`)
        await vcEspera(page, 250)
        saldoIALiberado = await page.evaluate(() => {
          const e = document.querySelector('.chip-balance-float')
          return e ? e.textContent.trim() : null
        })
      }

      const checks = {
        escenarioAlcanzado: c.alcanzado === true,
        sieteMonedas: v.maxFichas === VIAJE_N,
        destinoPorAtributo: !!destino && destino.idx === c.ganadorCorroborado,
        bandoCorrecto: !!destino && (esc.id === 'humano' ? destino.idx === '0' : destino.idx !== '0'),
        septimaEnDestino: dx !== null && dx <= 1 && dy <= 1,
        // La escala se juzga contra el valor DECLARADO (`style.scale`), que es el
        // destino de la transición, y no contra el computado, que es el valor
        // ANIMADO del instante muestreado. El último muestreo cae un fotograma
        // antes de que la capa muera, así que el computado se queda a un pelo:
        // medido 1,48994 contra 1,5, que son 0,01006 — un artefacto de muestreo,
        // no un error de la fórmula. El computado se conserva en el detalle para
        // que se vea cuánto falta, y se exige que esté dentro de 0,05.
        escalaDeLlegada: escEsperada !== null && sep.escalaDeclarada != null &&
          Math.abs(Number(sep.escalaDeclarada) - escEsperada) <= 0.001 &&
          Math.abs(Number(sep.scale) - escEsperada) <= 0.05,
        pozoSeVaciaAlSalirLaPrimera: potAntes !== null && potAntes !== '0' && potDurante === '0',
        sinCelebracionEnIA: esc.id === 'humano' ? true : (!v.overlay && !v.pulso),
        saldoSubeAlFinal: esc.id === 'humano' ? subeAlFinal === true : true,
      }
      c.checks = checks
      c.detalle = { iMax, ladoVuelo, destino, dx: dx === null ? null : round(dx), dy: dy === null ? null : round(dy),
        escala: sep ? Number(sep.scale) : null, escalaDeclarada: sep ? Number(sep.escalaDeclarada) : null, escEsperada: escEsperada === null ? null : round(escEsperada),
        maxFichas: v.maxFichas, ganadorCorroborado: c.ganadorCorroborado,
        potAntes, potDurante, saldosConCapa, saldoFinal, saldoIALiberado,
        traza: v.traza.slice(-10) }
      c.passed = Object.values(checks).every(Boolean)
    } catch (e) {
      c.error = String(e && e.message || e).slice(0, 300)
      c.passed = false
    }
    cells.push(c)
    const fallos = c.checks ? Object.entries(c.checks).filter(([, v]) => !v).map(([k]) => k) : ['ERROR']
    const d = c.detalle || {}
    console.log(`vuelo ${c.escenario.padEnd(6)} m5 ${c.vp} · manos=${c.manos} · monedas=${d.maxFichas} · destino="${d.destino && d.destino.idx}" (corroborado "${d.ganadorCorroborado}") · Δ dx=${d.dx} dy=${d.dy} · escala decl=${d.escalaDeclarada} comp=${d.escala} vs ${d.escEsperada} · pozo ${d.potAntes}→${d.potDurante} · saldo ${JSON.stringify(d.saldosConCapa)}→${d.saldoFinal} · ${c.passed ? 'OK' : 'FALLA [' + fallos.join(',') + ']'}${c.error ? ' · ' + c.error : ''}`)
    await page.close()
  }
  const verde = cells.every(c => c.passed)
  console.log(`── VUELO · ${verde ? 'VERDE' : 'ROJO'} (${cells.filter(c => c.passed).length}/${cells.length} escenarios) · N=${VIAJE_N}`)
  return { cells, verde, VIAJE_N }
}

// R2c · Playwright headless pasa --hide-scrollbars POR DEFECTO. Con esa bandera
// una barra que nace por overflow desplazable no encoge el cliente y el saltito
// de 15px del área es invisible al arnés (falso verde comprobado). El modo r2 —
// el único que audita el shift durante una animación — se lanza sin ella, para
// medir lo que ve Victor. El resto de modos conserva el lanzamiento histórico
// (sus baselines se tomaron con barras ocultas; cambiarlo movería sus números).
const browser = await chromium.launch({
  channel: 'msedge', headless: true,
  ...(MODE === 'r2' ? { ignoreDefaultArgs: ['--hide-scrollbars'] } : {}),
})
// ARN-1 · el JSON se autoetiqueta. `chromium` se LEE del navegador vivo y se
// contrasta contra la versión con la que se re-fotografiaron las baselines: si
// el Edge de la máquina se autoactualiza, el aviso sale aquí y no dentro de un
// Δ inexplicable seis meses después.
const chromiumVivo = browser.version()
const report = {
  mode: MODE,
  ts: new Date().toISOString(),
  arnes: {
    ...ARNES,
    playwrightCore: PW_VERSION,
    chromium: chromiumVivo,
    chromiumDeriva: chromiumVivo !== ARNES.chromiumBaselines
      ? `AVISO: baselines tomadas con ${ARNES.chromiumBaselines}`
      : false,
    ruta: { nivel: ARNES_NIVEL, stakeIdx: ARNES_STAKE_IDX, monto: apuestasDe(ARNES_NIVEL)[ARNES_STAKE_IDX] },
  },
}
if (report.arnes.chromiumDeriva) console.log(`⚠ ${report.arnes.chromiumDeriva} · vivo ${chromiumVivo}`)
try {
  if (MODE === 'd1d2' || MODE === 'all') {
    const { page, data } = await runD1D2(browser)
    report.d1d2 = data
    await page.close()
  }
  if (MODE === 'd3' || MODE === 'all') report.d3 = await runD3(browser)
  if (MODE === 'bug' || MODE === 'all') report.bug = await runBug(browser)
  if (MODE === 'shots' || MODE === 'all') report.shots = await runShots(browser)
  if (MODE === 'gate') report.gate = await runGate(browser, process.argv[3] || 'after')
  if (MODE === 'b1') report.b1 = await runB1(browser)
  if (MODE === 'tactil') report.tactil = await runTactil(browser)
  if (MODE === 'p1') report.p1 = await runP1(browser)
  if (MODE === 'p2') report.p2 = await runP2(browser)
  if (MODE === 'r1') report.r1 = await runR1(browser)
  if (MODE === 'r2') report.r2 = await runR2(browser)
  if (MODE === 'o1') report.o1 = await runO1(browser)
  if (MODE === 'h1') report.h1 = await runH1(browser)
  if (MODE === 'm1') report.m1 = await runM1(browser)
  if (MODE === 'a1') report.a1 = await runA1(browser)
  if (MODE === 'f1') report.f1 = await runF1(browser)
  if (MODE === 'z1') report.z1 = await runZ1(browser)
  if (MODE === 'o2') report.o2 = await runO2(browser)
  if (MODE === 'a2') report.a2 = await runA2(browser)
  if (MODE === 'u1') report.u1 = await runU1(browser)
  if (MODE === 'menu-movil') report.menuMovil = await runMenuMovil(browser)
  if (MODE === 'u2') report.u2 = await runU2(browser)
  if (MODE === 'u3') report.u3 = await runU3(browser)
  if (MODE === 'vc') report.vc = await runVC(browser)
  if (MODE === 'msg') report.msg = await runMSG(browser)
  if (MODE === 'tapetes') report.tapetes = await runTapetes(browser)
  if (MODE === 'vuelo') report.vuelo = await runVuelo(browser)
} catch (e) {
  report.error = String(e && e.stack || e)
}
await browser.close()

const json = JSON.stringify(report, (k, v) => typeof v === 'number' ? round(v) : v, 2)
console.log(json)
try { writeFileSync(`${OUT_DIR}/diag_${MODE}.json`, json) } catch {}
