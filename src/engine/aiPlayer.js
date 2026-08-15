import { getBestSuitScore, isAjilei } from './handEvaluator.js'
import { PALOS, VALORES } from './deck.js'

// Local copy to avoid circular import with gameEngine.js (which also exports maxDiscard)
// ── Personality profiles ──────────────────────────────────────────────────────
// openMin: minimum score to open betting (no bet yet)
// callMin: minimum score to call/stay in
// raiseMin: minimum score to raise
// noise: fraction of threshold randomised per decision (IMPREDECIBLE only)

const PROFILE_NAMES = ['CONSERVADORA', 'EQUILIBRADA', 'AGRESIVA', 'IMPREDECIBLE']

const PROFILES = {
  CONSERVADORA: { openMin: 32, callMin: 22, raiseMin: 40, noise: 0 },
  EQUILIBRADA:  { openMin: 28, callMin: 18, raiseMin: 34, noise: 0 },
  AGRESIVA:     { openMin: 22, callMin: 13, raiseMin: 28, noise: 0 },
  IMPREDECIBLE: { openMin: 28, callMin: 18, raiseMin: 34, noise: 0.15 },
}

// ══ NIVELES DE IA (fase 4) ════════════════════════════════════════════════════
// Rector: docs/AJILEI_Modos_y_Asistencia_v1.0.md §5.
//
// El nivel entra como PASAJERO `state.nivelIA` (Vía C, rector §2.2): lo cuelga
// la UI en la creación del estado, el motor lo transporta a ciegas y este
// archivo es su ÚNICO lector, siempre con el `??`. Ausencia = Básico.
//
// ARQUITECTURA DE HERMANAS MAYORES (rector §5.5): las capacidades se APILAN
// sobre los cuatro perfiles de arriba, no los sustituyen. Temperamento ⊥
// inteligencia: el perfil dice CÓMO se comporta, el nivel dice CUÁNTO entiende.
// Por eso el nivel es un RANGO y las capacidades se abren con `>=`: Pro hereda
// todo lo de Avanzado sin repetir una línea.
//
// IDENTIDAD DE BÁSICO — regla dura: con `nivelIA: 'basico'` o ausente, la
// decisión es IDÉNTICA a la de antes de NIV-1 para el mismo estado. Cada
// capacidad nueva está detrás de `avanzado`, y las magnitudes que introduce
// valen exactamente 0 cuando el rango es 0. Lo sella el test de oro de
// `scripts/testNivel1.test.js` §1, que lleva transcrita la lógica anterior y
// compara decisión contra decisión sobre una batería de fixtures.
const RANGO_NIVEL = { basico: 0, avanzado: 1, pro: 2 }
const RANGO_AVANZADO = 1
const RANGO_PRO      = 2

function rangoDe(state) {
  return RANGO_NIVEL[state.nivelIA ?? 'basico'] ?? 0
}

// ── ③ Estrategia completa de comodín · Avanzado+ (rector §5.2) ────────────────
//
// El comodín (7 de Oros) es ÚNICO y, cuando la mesa lo activa, aporta
// `comodinValue` al mejor palo de QUIEN LO TENGA, sea cual sea su palo
// (`handEvaluator.js:28`). De ahí la asimetría que Básico no ve: un 47 CON
// comodín y un 47 SIN comodín valen lo mismo en el showdown, pero no describen
// el mismo mundo. Si el comodín es mío, nadie más puede sumarlo. Si no es mío y
// la mesa lo activa, hay una probabilidad concreta de que un rival vivo lleve
// esos 10 u 11 puntos gratis encima de lo que ya enseñará.
//
// La amenaza se cobra donde de verdad vive —en la EQUIDAD—, y con la aritmética
// exacta. La versión intuitiva (restar los puntos esperados del comodín a mi
// puntaje) se probó y se descartó por FALSA, no por gusto: restar del puntaje
// propio equivale a subir a los k rivales a la vez, y el comodín es UNA carta
// que como mucho tiene UNO. Medido en mesa 5 con la mano en el filo de la
// decisión (puntaje 21, cuatro rivales): la corrección exacta da equidad 0,045
// y el desplazamiento plano da 0,0001 — 400 veces más pesimista, suficiente
// para retirar manos perfectamente pagables. Coincidían por casualidad en la
// zona alta de la curva, que fue donde se comprobó primero.
//
// La fórmula, con k rivales, p = P(uno de ellos lleva el comodín) y g = la
// probabilidad efectiva de batir a UN rival medio (g = equidad^(1/k)):
//
//     equidad = g^(k−1) · [ (1−p)·g + p·g_c ]
//
// es decir: contra k−1 rivales normales, más un rival que con probabilidad p es
// el portador —contra el cual mi mano rinde lo que rendiría contra una mano
// `comodinValue` puntos mejor, que es lo que g_c mide—. En BET_3 esto es
// EXACTO. No lleva ni una constante de ajuste: p sale de contar cartas
// desconocidas y se puede auditar carta por carta (D-4).
const CARTAS_BARAJA = PALOS.length * VALORES.length   // 40, derivado de deck.js

function llevaComodin(cards) {
  return cards.some(c => c.palo === 'Oros' && c.value === 7)
}

// P(un rival VIVO lleve el comodín). Cero si la mesa no lo activa (N≤3) y cero
// si es mío — la misma fórmula cubre los dos casos sin ramas especiales. Un
// retirado que lo llevara ya no compite, y el taco no juega: por eso el numerador
// cuenta sólo cartas en manos vivas.
function probComodinEnRival(state, ai, activeOpponents) {
  const { comodinValue } = state.handRules
  if (comodinValue === null) return 0
  if (llevaComodin(ai.cards)) return 0
  const propias      = ai.cards.length
  const desconocidas = CARTAS_BARAJA - propias
  if (desconocidas <= 0 || activeOpponents <= 0) return 0
  return Math.min(1, (activeOpponents * propias) / desconocidas)
}

// ── ④ Disciplina de bote · Avanzado+ (rector §5.2) ────────────────────────────
//
// Básico decide igualar o retirarse con un listón crudo sobre su propio puntaje
// más un tope absoluto (`toCall <= unit*2`, `:129 :137 :145` del archivo previo)
// que IGNORA EL BOTE por completo. La vara NIV-B0 midió el precio de esa ceguera:
// un conductor PASIVO —iguala o pasa, jamás sube, jamás se retira— bate a la
// mesa en N≥3 por +0,50 / +1,55 / +1,03 pp (hasta 11σ). Gana pozos por abandono.
//
// Avanzado sustituye ese tramo por matemática de bote: se iguala cuando la
// equidad estimada de la mano cubre el PRECIO que la mesa está cobrando.
//
//   precio  = toCall / bote al cierre de la ronda
//   equidad = P(mi mano gane el showdown)
//
// EL BOTE DE REFERENCIA es el del CIERRE DE LA RONDA, no el del instante: lo que
// ya hay en la mesa, más mi igualada, más lo que los asientos vivos todavía
// deben para quedarse. Ese último sumando es la lectura de los `contrib` ajenos
// que ④ pide: `currentBet − contrib` de cada rival vivo, topado por sus fichas.
// Todo público, nada oculto.
//
// Se cuenta y no se descarta porque el error va en la dirección segura: si un
// rival acaba retirándose en vez de igualar, el bote sale menor que lo estimado
// —pero también sale un rival menos, y mi equidad sube por el mismo suceso—. Las
// dos desviaciones se compensan. Medido: contarlo baja la tasa de retiro de la
// mesa del 20,4% al 12,4% en mesa 4, y es la mitad de la reparación de la fuga
// que la vara NIV-B0 midió.
//
// Lo que NO entra (rector §5.2, techo de ④): el TAMAÑO de la apuesta.
// `applyAIBetAction` pasa `state.unit` fijo e ignora cualquier monto que esta
// función devolviera (`gameEngine.js:482`). Elegir tamaño es abrir el motor.

// CURVAS DE FUERZA — MEDIDAS, no estimadas. Todas salen del banco de la fase
// (`node scripts/bancoNiveles.mjs --curvas`, volcado en capturas-dsk/), y el
// test §3 de `scripts/testNivel1.test.js` las vuelve a derivar y las compara:
// si alguien mueve una cifra a mano, el test discrepa.
//
// MANO AL AZAR · enumeración EXACTA de las C(40,5) = 658.008 manos. Para cada
// puntaje s, la probabilidad de que una mano tomada al azar quede por debajo,
// contando medio empate (el desempate real es por orden de asiento desde la
// Mano, `gameEngine.js:157-163`, que desde un asiento cualquiera vale ½):
//
//     q[s] = P(X < s) + ½·P(X = s)
//
// ⚠ ESTA CURVA YA NO GOBIERNA NINGUNA DECISIÓN. Hasta NIV-2 fue la curva de
// BET_3 de Avanzado, y era el sitio equivocado: en BET_3 el rival YA DESCARTÓ,
// así que su mano no es una mano al azar sino una reconstruida, bastante más
// fuerte. Contra un puntaje de 30 esta curva dice 0,858 y la realidad medida es
// 0,581 — Avanzado sobreestimaba su equidad en cada mano definitiva y pagaba de
// más. La fuga se midió en NIV-2 y se repara en NIV-CAL §1 (decisión A de
// Victor): la curva de BET_3 pasa a ser `CURVA_DESCARTE.marginal`, medida sobre
// la dinámica real. El coste de la fuga, para que quede en el acta: en FICHAS,
// Básico batía a Avanzado en tres de las cuatro mesas.
//
// Se conserva por dos razones, ninguna decorativa: es el DOMINIO de puntajes de
// la fase (`rangoDeFase`), y su enumeración exacta es la referencia contra la
// que se valida por invariante la marginal medida —una mano descartada nunca
// puede ser más floja que una al azar, y el test lo exige punto por punto—.
const CURVA_FINAL = {
  desde: 13,
  q: [0.003, 0.006, 0.006, 0.033, 0.102, 0.150, 0.156, 0.325, 0.569, 0.643,
      0.652, 0.663, 0.664, 0.692, 0.757, 0.803, 0.812, 0.858, 0.932, 0.960,
      0.962, 0.965, 0.965, 0.968, 0.977, 0.984, 0.986, 0.989, 0.995, 0.998,
      0.999, 0.999, 0.999, 0.999, 0.999, 1, 1, 1, 1],
}

// FASES INTERMEDIAS (BET_1, BET_2) · tablas por número de rivales, medidas con
// la dinámica real (reparto 2+3, descarte al mejor palo, reposición del taco),
// 4.000.000 de muestras por columna y con el tope de descarte de la mesa que
// corresponde a cada k (5 en mesas 2-4, 3 en mesa 5).
//
// POR QUÉ UNA TABLA POR k Y NO UNA CURVA ELEVADA A LA k. Con la mano todavía
// abierta, «probabilidad de batir a un rival» es un PROMEDIO sobre los
// desenlaces posibles de mi propia mano, y E[q]^k ≠ E[q^k] (Jensen). No es un
// matiz: a 2 cartas, puntaje 21 contra 4 rivales da 0,340 medido frente a 0,186
// por la vía del promedio elevado — 45% de subestimación, suficiente para
// retirar manos que pagan. La tabla mide el número que hace falta y se acabó el
// modelo.
//
// Lo que la tabla enseña de paso: a 2 cartas la fuerza casi no separa (0,38 a
// 0,66 contra un rival). En BET_1 lo que decide es el PRECIO, no la mano — y eso
// es un hallazgo de la medición, no una postura de diseño.
//
// Límite declarado: medidas sobre baraja SIN comodín. La asimetría del comodín
// no se mete aquí: la cobra ③ sobre el puntaje, para que cada capacidad se pueda
// auditar por separado.
const TABLA_BET_1 = {
  desde: 6,
  k: [
    [0.379, 0.408, 0.408, 0.408, 0.476, 0.519, 0.519, 0.455, 0.455, 0.455, 0.478, 0.516, 0.541, 0.541, 0.587, 0.657],
    [0.220, 0.241, 0.241, 0.241, 0.309, 0.349, 0.349, 0.288, 0.288, 0.288, 0.310, 0.345, 0.374, 0.374, 0.422, 0.497],
    [0.150, 0.171, 0.171, 0.171, 0.228, 0.265, 0.265, 0.208, 0.208, 0.208, 0.231, 0.260, 0.286, 0.286, 0.331, 0.401],
    [0.115, 0.128, 0.128, 0.128, 0.179, 0.211, 0.211, 0.164, 0.164, 0.164, 0.183, 0.208, 0.233, 0.233, 0.274, 0.340],
  ],
}
const TABLA_BET_2 = {
  desde: 13,
  k: [
    [0.260, 0.260, 0.260, 0.285, 0.328, 0.349, 0.349, 0.414, 0.509, 0.509, 0.459, 0.472, 0.472, 0.497, 0.573,
     0.625, 0.625, 0.703, 0.797, 0.797, 0.797, 0.801, 0.801, 0.820, 0.862, 0.900, 0.900, 0.924, 0.957],
    [0.129, 0.129, 0.129, 0.143, 0.175, 0.201, 0.201, 0.252, 0.329, 0.329, 0.276, 0.286, 0.286, 0.307, 0.373,
     0.430, 0.430, 0.516, 0.648, 0.648, 0.633, 0.656, 0.656, 0.679, 0.745, 0.806, 0.806, 0.860, 0.914],
    [0.079, 0.079, 0.079, 0.091, 0.113, 0.133, 0.133, 0.178, 0.243, 0.243, 0.196, 0.214, 0.214, 0.221, 0.272,
     0.320, 0.320, 0.401, 0.539, 0.539, 0.522, 0.536, 0.536, 0.570, 0.646, 0.731, 0.731, 0.790, 0.881],
    [0.058, 0.058, 0.058, 0.067, 0.082, 0.098, 0.098, 0.135, 0.191, 0.191, 0.151, 0.157, 0.157, 0.173, 0.215,
     0.253, 0.253, 0.324, 0.455, 0.455, 0.434, 0.438, 0.438, 0.484, 0.573, 0.651, 0.651, 0.739, 0.845],
  ],
}

function enTabla(tabla, score, k) {
  const fila = tabla.k[Math.min(Math.max(k, 1), tabla.k.length) - 1]
  const i = Math.round(score) - tabla.desde
  if (i < 0) return fila[0]
  if (i >= fila.length) return fila[fila.length - 1]
  return fila[i]
}

function equidad(score, phase, activeOpponents) {
  const k = Math.max(1, activeOpponents)
  if (phase === 'BET_1') return enTabla(TABLA_BET_1, score, k)
  if (phase === 'BET_2') return enTabla(TABLA_BET_2, score, k)
  // MANO DEFINITIVA · la marginal POST-DESCARTE, elevada a los rivales.
  //
  // NIV-CAL §1 (decisión A). Aquí estaba `CURVA_FINAL`, que describe una mano al
  // azar; en BET_3 no queda ninguna mano al azar sobre la mesa. Elevar a k sigue
  // siendo EXACTO: con la mano cerrada, las manos de los rivales son
  // independientes entre sí dada la mía. Lo que cambia es de qué población salen.
  //
  // FRONTERA INTACTA, y es la mitad del encargo: Avanzado NO recibe ②. No lee un
  // solo conteo de descarte ni toca la memoria — sigue sin mirar `state.deck`,
  // como exige su trampa Proxy—; simplemente deja de suponer un rival imposible.
  // La distinción con Pro se conserva entera: Avanzado usa la MARGINAL, la misma
  // para todos los rivales; Pro CONDICIONA rival por rival con lo que leyó.
  return Math.pow(qDescarte(null, score), k)
}

// ③ aplicada a ④: la equidad con la amenaza del comodín dentro.
//
// NIV-2 la generalizó a recibir la FUENTE de equidad en vez de llamar a
// `equidad` a pelo, porque Pro entra con una fuente distinta (② corrige la suya
// con la lectura de descartes). La aritmética es la misma línea por línea: lo
// único que cambió es de dónde salen `base` y su desplazada — y el envoltorio
// `equidadConComodin(score, phase, k, cv, p)` de NIV-1 desapareció por quedarse
// sin llamantes, no por cambiar de idea: era exactamente
// `corrigePorComodin(s => equidad(s, phase, k), …)`. La transcripción del test
// de oro (`scripts/testNivel2.test.js` §1) lo conserva palabra por palabra, que
// es donde debe vivir la versión vieja.
function corrigePorComodin(eqDe, score, k, comodinValue, p) {
  const base = eqDe(score)
  if (p <= 0 || comodinValue === null || base <= 0) return base
  const g  = Math.pow(base, 1 / k)
  const gc = Math.pow(eqDe(score - comodinValue), 1 / k)
  return Math.pow(g, k - 1) * ((1 - p) * g + p * gc)
}

// ══ ② LECTURA DE DESCARTES · Pro (rector §5.3) ═══════════════════════════════
//
// Dos fuentes, las dos PÚBLICAS, ninguna nueva para el motor:
//
//   · Los descartes de las OTRAS IAs — `aiPlayer` decide todos los descartes de
//     asientos IA (`gameEngine.js:500-502`), así que se acuerda de lo que él
//     mismo decidió. Es su propia memoria, no información ajena.
//   · El descarte del HUMANO — nunca pasa por `decideDiscard`, pero la longitud
//     del taco cae EXACTAMENTE en el total de la ronda (`gameEngine.js:511`).
//     Restando lo propio queda lo suyo. Se lee `state.deck.length` y NADA MÁS:
//     ni un índice, ni una iteración. Es la frontera fina de D-5 que esta tanda
//     introduce, y la trampa Proxy de `scripts/testNivel2.test.js` §8 demuestra
//     los dos lados —que la longitud se lee y que el contenido jamás—.
//
// POR QUÉ ES SIMETRÍA Y NO PRIVILEGIO (rector §5.3): el número de cartas que
// cambió cada quien lo anuncia el propio juego en voz alta —«Descartaste 3, la
// IA descartó 2», `gameEngine.js:517-520`— y el taco menguante está a la vista.
// El humano tiene el dato gratis; que Pro lo use lo pone a la par.
//
// ── LA CURVA · medida, no estimada ───────────────────────────────────────────
// `node scripts/bancoNiveles.mjs --curvas-descarte --muestras 20000000`, volcado
// en capturas-dsk/niv2_curvas_descarte.json. Mide la misma magnitud que
// CURVA_FINAL —q[s] = P(X < s) + ½·P(X = s) para la mano de UN rival— pero
// condicionada a cuántas cartas cambió ese rival.
//
// TRES HALLAZGOS DE LA MEDICIÓN, ninguno supuesto:
//
// 1. d NUNCA PASA DE 3, y por eso hay una sola tabla y no una por mesa. Con 5
//    cartas en 4 palos algún palo tiene al menos dos, y la suma mínima de dos
//    cartas de un palo es 6+7=13, por encima del As (11): ningún palo de una
//    sola carta puede ser el mejor. Luego el mejor palo tiene ≥2 cartas y sobran
//    ≤3. El tope de descarte (5 en mesas 2-4, 3 en mesa 5) NO LIGA JAMÁS para
//    esta política. Medido de los dos lados: los regímenes tope-5 y tope-3
//    salieron idénticos dentro del ruido y las filas d=4 y d=5 con cero muestras
//    en 20 millones.
// 2. LA SEÑAL ES ENORME, mucho mayor que la del comodín que ③ ya cobra. Contra
//    un puntaje de 30, un rival que cambió 3 queda por debajo el 69% de las
//    veces; uno que cambió 1, el 17,9%; uno que no cambió nada, el 0%. Un d=0 no
//    es «no quiso»: es «no TENÍA qué cambiar» — cinco cartas del mismo palo.
// 3. LA MARGINAL NO ES `CURVA_FINAL`. CURVA_FINAL describe una mano al azar de
//    C(40,5); la marginal describe una mano YA DESCARTADA, que es bastante más
//    fuerte (contra 30: 0,581 frente a 0,858). Es un límite declarado de
//    Avanzado, no un defecto que esta tanda arregle: NIV-2 no toca Avanzado. Lo
//    que Pro hace con ello está abajo, y es deliberadamente lo MENOS invasivo
//    que se puede hacer.
const CURVA_DESCARTE = {
  desde: 13,
  // Filas d = 0 … 3 · cuántas cartas cambió el rival.
  d: [
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
     0.068, 0.177, 0.217, 0.287, 0.496, 0.705, 0.774, 0.817, 0.930],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0.041, 0.097, 0.110, 0.179,
     0.358, 0.510, 0.551, 0.621, 0.758, 0.827, 0.839, 0.859, 0.866, 0.878, 0.914, 0.950, 0.962,
     0.969, 0.988],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0.019, 0.040, 0.042, 0.098, 0.228, 0.320, 0.339, 0.432, 0.580,
     0.636, 0.652, 0.674, 0.680, 0.707, 0.778, 0.839, 0.855, 0.882, 0.937, 0.965, 0.967, 0.971,
     0.973, 0.975, 0.982, 0.990, 0.992, 0.994, 0.998],
    [0.001, 0.001, 0.001, 0.008, 0.031, 0.050, 0.053, 0.165, 0.342, 0.408, 0.416, 0.425, 0.427,
     0.458, 0.537, 0.600, 0.614, 0.690, 0.821, 0.876, 0.880, 0.885, 0.887, 0.895, 0.918, 0.938,
     0.945, 0.955, 0.979, 0.991, 0.992, 0.993, 0.993, 0.994, 0.995, 0.997, 0.998, 0.998, 0.999],
  ],
  // La mezcla sobre d: el rival del que NO hay lectura, y el denominador de la
  // razón de abajo. Frecuencias medidas de d: 0,15% / 3,83% / 31,74% / 64,28%.
  marginal:
    [0, 0.001, 0.001, 0.005, 0.020, 0.032, 0.034, 0.106, 0.220, 0.262, 0.273, 0.286, 0.288, 0.325,
     0.418, 0.487, 0.502, 0.581, 0.712, 0.765, 0.774, 0.787, 0.790, 0.807, 0.851, 0.889, 0.900,
     0.918, 0.956, 0.975, 0.977, 0.979, 0.980, 0.982, 0.987, 0.992, 0.994, 0.995, 0.998],
}

// PISO Y TECHO declarados. La tabla está redondeada a tres decimales, así que
// donde la medición dio menos de 0,0005 quedó escrito un 0 y donde dio más de
// 0,9995 quedó un 1. Esos extremos son de REDONDEO, no de probabilidad: sin
// acotarlos, los momios de abajo se irían a 0 o a infinito por un artefacto de
// formato y la decisión se volvería categórica —«imposible» / «seguro»— donde la
// medición sólo dijo «muy improbable» o «casi seguro».
const PISO_Q = 0.0005

function qDescarte(d, score) {
  const fila = d === null ? CURVA_DESCARTE.marginal : CURVA_DESCARTE.d[Math.min(Math.max(d, 0), 3)]
  const i = Math.round(score) - CURVA_DESCARTE.desde
  const v = i < 0 ? 0 : i >= fila.length ? 1 : fila[i]
  return Math.min(Math.max(v, PISO_Q), 1 - PISO_Q)
}

// ── CÓMO SE GASTA LA LECTURA ──────────────────────────────────────────────────
//
// Avanzado supone que TODOS sus rivales son del montón y usa la marginal para
// los k. Pro sabe cuántas cambió cada uno, así que sustituye la marginal por la
// fila que a cada rival le corresponde y multiplica:
//
//     equidad = Π q_{d_i}(s)          contra    equidad = q_marginal(s)^k
//
// Con toda la mesa en el montón las dos expresiones coinciden término a término,
// y Pro decide EXACTAMENTE como Avanzado. El nivel sólo se separa cuando la
// lectura dice algo, y todo lo que Pro hace de más se puede explicar señalando
// qué leyó: el listón que el rector §5.5 pone.
//
// ACTA DE UNA SIMPLIFICACIÓN, porque aquí vivían quince líneas de maquinaria y
// conviene decir por qué murieron. En NIV-2 la base de Avanzado era `CURVA_FINAL`
// —mano al azar— y la evidencia de ② vivía en otra escala, la post-descarte. Para
// cruzarlas hacía falta una actualización en ESPACIO DE MOMIOS,
//
//     momio_i = momio(g) · momio(q_{d_i}) / momio(q_marginal),
//
// que era la única forma de mover una probabilidad de una escala a otra sin
// salirse de [0,1] ni sesgar la corrección hacia un lado (un factor
// multiplicativo topado con `min(1, …)` sí lo hace, y estaba medido: empujaba a
// Pro al 6% de retiros contra el 2,5% de Avanzado). Reparada la base en NIV-CAL
// §1, las dos escalas son LA MISMA: con g = q_marginal, la razón de momios se
// cancela y toda la expresión colapsa a `q_{d_i}` exacto. La maquinaria no se
// borró por gusto — dejó de tener trabajo que hacer, y lo que queda es el objeto
// que ② siempre estuvo aproximando.
function equidadConLectura(score, conteos) {
  let equidadTotal = 1
  for (const d of conteos) equidadTotal *= qDescarte(d, score)
  return equidadTotal
}

// El listón por debajo del cual se supone que un rival suelta la mano. NO es un
// número inventado: sale de la tabla de personalidades de este mismo archivo. Un
// rival se retira en BET_3 cuando su puntaje no llega a `callMin + 4`
// (`:445`), y su `callMin` lleva encima el `opponentAdj` de la mesa. Se usa la
// media de los cuatro temperamentos porque desde fuera no se sabe cuál toca —y
// mirar `_assignments` de otro asiento sería usar memoria propia para adivinar
// conducta ajena, que no es lo que la capacidad declara—.
const CALLMIN_MEDIO = PROFILE_NAMES.reduce((a, n) => a + PROFILES[n].callMin, 0) / PROFILE_NAMES.length

function umbralDeRetiroRival(k) {
  return CALLMIN_MEDIO + 4 + (Math.max(1, k) - 1) * 2
}

// P(TODOS los rivales suelten) según la lectura: el respaldo del farol.
function respaldoDelFarol(conteos, k) {
  const linea = umbralDeRetiroRival(k)
  let p = 1
  for (const d of conteos) p *= qDescarte(d, linea)
  return p
}

// ── Los dos dados de Pro · declarados, no mágicos (rector §5.3, D-4) ──────────
// Mismo molde que los 0,6 y 0,7 que ya gobiernan las subidas de BET_2 y BET_3:
// una constante con nombre, a la vista, que las pruebas fijan por mock y el
// banco mide en vivo. Ninguna de las dos es un multiplicador de agresión: no
// mueven ningún umbral ni abren ninguna rama por su cuenta — sólo deciden CADA
// CUÁNTO se ejerce una rama que la lectura ya autorizó.
//
// Por qué no valen 1. Un farol que se disparara SIEMPRE que la lectura lo
// respalda es tan legible como el tell del Ajilei que Pro acaba de aprender a
// esconder: bastaría con no creerle nunca. Un Ajilei que se jugara SIEMPRE lento
// sería el mismo tell con el signo cambiado. La mitad es el punto donde la rama
// no informa nada por sí sola.
//
// ── CALIBRADAS POR EVIDENCIA · NIV-CAL §4 (decisión C de Victor) · CERRADO ────
// Las dos SE QUEDAN EN 0,5, y no por inercia: se midieron y no hay nada que
// afinar. Queda escrito para que nadie las mueva sin traer evidencia nueva.
//
//   · FREC_FAROL. La frecuencia efectiva NO la gobierna esta constante sino el
//     producto de respaldo, que se autorregula con el tamaño de la mesa: 0,19
//     faroles por mano en mesa 2 y 0,035 en mesa 5 (medido, NIV-2 §7). Subirla
//     no haría a Pro más audaz donde importa —contra cuatro rivales el producto
//     ya cierra la rama solo—; sólo la haría más legible en el duelo.
//   · FREC_DISIMULO. El techo del disimulo es ESTRUCTURAL, no de la constante:
//     el Ajilei se fabrica casi siempre EN el descarte, así que la inmensa
//     mayoría de las decisiones con Ajilei ya son de BET_3, donde Pro cobra por
//     diseño. Medido: sólo el 1,4-3,5% de las decisiones con Ajilei son
//     disimulables. Con la constante a 1 el techo apenas se movería.
const FREC_FAROL    = 0.5
const FREC_DISIMULO = 0.5

// Sólo para las pruebas: `scripts/testNivel1.test.js` §3 y `testNivel2.test.js`
// §3 re-derivan estas tablas —la final por enumeración exacta, las demás por sus
// invariantes de forma— y las comparan con lo que está escrito aquí. Mismo molde
// que `_resetForTesting`.
export const _CURVAS_PARA_TEST = { CURVA_FINAL, TABLA_BET_1, TABLA_BET_2, CURVA_DESCARTE }

// Rango de puntajes posibles por fase — el dominio de las curvas.
function rangoDeFase(phase) {
  if (phase === 'BET_1') return [TABLA_BET_1.desde, TABLA_BET_1.desde + TABLA_BET_1.k[0].length - 1]
  if (phase === 'BET_2') return [TABLA_BET_2.desde, TABLA_BET_2.desde + TABLA_BET_2.k[0].length - 1]
  return [CURVA_FINAL.desde, CURVA_FINAL.desde + CURVA_FINAL.q.length - 1]
}

// ③ aplicada al LISTÓN clásico. Los umbrales de personalidad (openMin, callMin,
// raiseMin) están en puntos, no en equidad, así que la amenaza se les traduce:
// el puntaje equivalente es el puntaje SIN comodín en mesa que valdría lo mismo
// que mi mano vale CON la amenaza encima. Una sola fuente —la equidad corregida
// de arriba—, dos monedas. Sin esto, ③ sólo se notaría al igualar y no al abrir
// ni al subir, que es justo donde el rector §5.2 pide que se note.
//
// NIV-2 le añadió el `tope`. Con el default —el propio puntaje— la función es
// LITERALMENTE la de NIV-1: la amenaza del comodín sólo puede restar, así que el
// barrido nunca necesitaba mirar por encima. La lectura de descartes de ② sí
// puede SUMAR (una mesa de rivales que reconstruyeron palo vale más que la que
// las tablas suponen), y para eso Pro abre el barrido hasta el final del rango.
// El tope se conserva en vez de abrirse para todos porque las tablas
// intermedias NO son monótonas —TABLA_BET_1 baja de 0,519 a 0,455 en el tramo
// medio— y ampliar el dominio movería decisiones de Avanzado que esta tanda no
// tiene permiso de tocar. Pro sólo lo abre en BET_3, cuya curva sí es monótona.
function puntajeEquivalente(eqCorregida, score, phase, k, tope = Math.round(score)) {
  const [lo, hi] = rangoDeFase(phase)
  const alto = Math.min(hi, tope)
  for (let s = lo; s <= alto; s++) {
    if (equidad(s, phase, k) >= eqCorregida) return s
  }
  return alto
}

// ── Personality module state ──────────────────────────────────────────────────
// Keyed by seat index → profile name.  Re-initialised on new game detection.

let _assignments     = null   // { [seatIndex]: profileName }
let _lastNumPlayers  = 0
let _lastHandCount   = -1     // -1 = never seen; tracks partida boundary
let _lastAliveCount  = -1     // -1 = never seen; segunda señal del límite

// ── ② Memoria de descartes · NACE Y MUERE CON LA MANO (rector §5.3) ───────────
// `{ handCount, mazoAntes, porAsiento: { [seat]: cuántas cambió } }`. Sólo la
// escribe `decideDiscard`, sólo cuando el nivel es Pro, y se tira entera en
// cuanto cambia el número de mano o el rider detecta partida nueva. Prohibido
// que sobreviva entre partidas: sería memoria de una mesa aplicada a otra.
let _descartes = null

function _olvidarDescartes() { _descartes = null }

// ── Diagnóstico de Pro · NO participa en ninguna decisión ────────────────────
// Contadores de frecuencia efectiva para el banco (`--nivel pro`) y las pruebas.
// El motor no lo lee, la UI no lo lee y ninguna rama de decisión lo consulta:
// sólo se escribe. `_resetForTesting` lo pone a cero como todo lo demás.
export const _DIAG_PRO = {
  decisiones: 0,      // llamadas a decideBetAction con nivel Pro
  conLectura: 0,      // ...de ellas, las que tuvieron lectura de descartes viva
  faroles: 0,         // faroles disparados (abren + suben)
  farolAbre: 0,
  farolSube: 0,
  farolRespaldado: 0, // veces que la lectura y el precio respaldaron un farol
  ajileis: 0,         // decisiones con Ajilei en mano
  disimulos: 0,       // ...de ellas, las jugadas lentas
  farolPorAsiento: {},// seat → true si ese asiento faroleó desde el último borrado
}

function _shuffled(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// Public — also called directly by tests
export function initPersonalities(numPlayers) {
  const numAIs   = numPlayers - 1       // seat 0 is the human
  const shuffled = _shuffled(PROFILE_NAMES)
  _assignments    = {}
  _lastNumPlayers = numPlayers
  for (let i = 0; i < numAIs; i++) {
    _assignments[i + 1] = shuffled[i]  // AI seats: 1 … N-1
  }
}

// Returns the profile name for a given AI seat (null if not yet initialised)
export function getPersonalityName(aiIndex) {
  return _assignments ? (_assignments[aiIndex] ?? null) : null
}

// Resets all module state — for test isolation only
export function _resetForTesting() {
  _assignments    = null
  _lastNumPlayers = 0
  _lastHandCount  = -1
  _lastAliveCount = -1
  _olvidarDescartes()
  for (const k of Object.keys(_DIAG_PRO)) {
    _DIAG_PRO[k] = k === 'farolPorAsiento' ? {} : 0
  }
}

// ── RIDER NIV-1 §4 · re-sorteo de perfiles por PARTIDA ────────────────────────
//
// CONTABILIDAD DEL ARREGLO (qué murió, qué lo reemplaza, por qué):
//
// QUÉ MURIÓ. La condición anterior era `state.handCount === 0 && _lastHandCount > 0`.
// Era una rama MUERTA, medida en NIV-B0, no supuesta: `startHand` deja el
// contador en 1 ANTES de la primera decisión de apuesta (`gameEngine.js:451`),
// así que ninguna llamada real llega jamás con `handCount === 0`. Sólo la
// alcanzaba un estado sintético fabricado por el test. Consecuencia en vivo: los
// perfiles se repartían UNA vez y se quedaban puestos mesa tras mesa, durante
// toda la vida del módulo. El banco lo cuantificó: dos corridas de 3000 manos
// dieron 25,17% y 17,20% de tasa para el mismo asiento, sólo por el reparto.
//
// QUÉ LO REEMPLAZA. Dos señales del propio estado, ambas públicas, que juntas
// marcan el límite de partida sin inventar maquinaria ni tocar el motor:
//   · `handCount` RETROCEDE — dentro de una partida sólo crece de 1 en 1, así
//     que verlo bajar sólo puede significar un estado recién creado.
//   · `aliveCount` SUBE — dentro de una partida sólo baja (las bancarrotas son
//     permanentes, `gameEngine.js:49-50`), así que verlo subir es mesa nueva.
// Se conserva el disparo por cambio de `numPlayers` y el de arranque en frío.
//
// POR QUÉ SE REPARA Y NO SE RETIRA (decisión de Victor, NIV-1 §4): la intención
// original era correcta —una mesa nueva merece rivales nuevos—; lo que estaba
// roto era el detector. Retirarla habría sellado como diseño un accidente.
// Aplica IGUAL a los tres niveles: el temperamento es ortogonal al nivel
// (rector §5.5), así que el reparto no es una capacidad que se gane subiendo.
//
// PUNTO CIEGO RESIDUAL, declarado: dos partidas consecutivas que terminaran
// AMBAS en su primera mano serían indistinguibles desde aquí (handCount 1 → 1,
// aliveCount N → N, sin llamada intermedia). El motor no puede producirlo con
// las tablas del rector §3.3 —haría falta dejar a N−1 jugadores por debajo de la
// entrada en una sola mano partiendo de 5000 fichas iguales—, y si ocurriera el
// efecto sería que una partida hereda los perfiles de la anterior: exactamente
// lo que pasaba SIEMPRE hasta esta tanda. Degrada al comportamiento viejo, no
// por debajo.
function _ensurePersonalities(state) {
  const vivos = state.aliveCount ?? state.numPlayers
  const partidaNueva = state.handCount < _lastHandCount || vivos > _lastAliveCount
  if (_assignments === null || state.numPlayers !== _lastNumPlayers || partidaNueva) {
    initPersonalities(state.numPlayers)
    // NIV-2 §1: la memoria de descartes es de MESA, no sólo de mano. Las mismas
    // dos señales que reparten rivales nuevos tiran la lectura vieja.
    _olvidarDescartes()
  }
  _lastHandCount  = state.handCount
  _lastAliveCount = vivos
}

// ── ② Registro y lectura de la ronda de descarte ─────────────────────────────

// Lo escribe `decideDiscard` por cada asiento IA que decide, y de paso deja
// anotada la longitud del taco ANTES de que la ronda lo toque —`applyDiscard`
// llama a todos los asientos con el MISMO estado previo (`gameEngine.js:495`),
// así que ese número es el mismo para todos y sirve de origen de coordenadas.
//
// SE INDEXA POR `player.id`, NO POR LA CASILLA DEL ARRAY, y no es un detalle de
// estilo: la memoria es de un JUGADOR, no de una posición. La distinción salió a
// la luz midiendo. El banco conduce el asiento 0 con un ESTADO ESPEJO que
// permuta los asientos 0↔1 (`bancoNiveles.mjs:165`), apoyado en que
// `decideBetAction` es función pura de la mano, la posición relativa y el número
// de rivales. ② añadía la primera dependencia de la IDENTIDAD del asiento, y con
// ella el espejo empezaba a leer los descartes cruzados: en el espejo simétrico
// de mesa 2 —donde los dos asientos deben ganar la mitad de las partidas por
// construcción— el asiento 0 caía al 6,85%. Con `id`, que viaja dentro del
// objeto del jugador y que el espejo NO toca, la permutación vuelve a ser
// inofensiva y la pureza del adaptador se restituye.
const _idDe = (state, i) => state.players[i].id ?? i

function _anotarDescarte(state, aiIndex, cuantas) {
  if (_descartes === null || _descartes.handCount !== state.handCount) {
    // `state.deck.length` y nada más. Si el estado no trae taco (fixtures
    // sintéticas), se anota `null` y la lectura no llegará a formarse: sin
    // origen no hay resta, y sin resta Pro se queda ciego a propósito.
    const mazo = state.deck
    _descartes = {
      handCount: state.handCount,
      mazoAntes: Array.isArray(mazo) || mazo ? (typeof mazo.length === 'number' ? mazo.length : null) : null,
      porJugador: {},
    }
  }
  _descartes.porJugador[_idDe(state, aiIndex)] = cuantas
}

// Devuelve los conteos de los rivales VIVOS del asiento que decide, o `null` si
// la lectura no está completa. «Ciego» y «leo mal» no se confunden: cualquier
// incoherencia devuelve null y Pro cae al comportamiento de Avanzado.
function lecturaDeDescartes(state, aiIndex) {
  const mem = _descartes
  if (mem === null || mem.handCount !== state.handCount || mem.mazoAntes === null) return null
  const mazo = state.deck
  const ahora = mazo && typeof mazo.length === 'number' ? mazo.length : null
  if (ahora === null) return null

  const total = mem.mazoAntes - ahora
  if (total < 0) return null
  const propios = Object.values(mem.porJugador).reduce((a, n) => a + n, 0)
  const delHumano = total - propios
  const tope = state.handRules.maxDiscard
  if (delHumano < 0 || delHumano > tope) return null   // la cuenta no cuadra: ciego

  const conteos = []
  for (let i = 0; i < state.players.length; i++) {
    if (i === aiIndex || state.players[i].folded) continue
    const propio = mem.porJugador[_idDe(state, i)]
    // Un asiento que no pasó por `decideDiscard` y no es el humano (o un humano
    // que ya estaba retirado) no deja rastro utilizable: la lectura no se
    // completa y se devuelve null antes que adivinar.
    if (propio === undefined && !state.players[i].isHuman) return null
    conteos.push(propio === undefined ? delHumano : propio)
  }
  return conteos.length ? conteos : null
}

// Apply ±noise% variance to a threshold — called once per decision, not at assignment
function _jitter(value, noise) {
  if (noise === 0) return value
  const factor = 1 + (Math.random() * 2 - 1) * noise
  return value * factor
}

// ── Core decision functions ───────────────────────────────────────────────────

export function decideBetAction(state, aiIndex) {
  const { players, currentBet, phase, manoIndex, pieIndex, unit } = state
  const ai = players[aiIndex]

  if (ai.folded) return { action: 'pasar' }

  // HR-1: las reglas vienen del snapshot congelado en el barajado. Solo cambia
  // de dónde se leen; la estrategia (umbrales, perfiles) no se toca.
  const { ruleN } = state.handRules
  const comodinEnabled = state.handRules.comodinValue !== null
  const { points: score } = getBestSuitScore(ai.cards, ruleN, comodinEnabled)
  const toCall = currentBet - ai.contrib

  // Engine will force-fold if chips < toCall, but we mirror it here for safety
  if (toCall > 0 && ai.chips < toCall) return { action: 'retirarse' }

  // Saldo (defensa en profundidad): solo intentar 'subir' si alcanza para el
  // monto TOTAL de la subida (toCall + unit). Si no, se degrada a 'igualar'
  // (la igualada ya está garantizada por la guarda de arriba). No se intenta
  // ninguna acción impagable; el motor es la garantía dura de saldo ≥ 0.
  const canAffordRaise = ai.chips >= toCall + unit

  // Nivel de esta mesa. `avanzado` abre ③ y ④; `pro` abre ②, ⑥ y el Ajilei
  // disimulado. Pro hereda lo de Avanzado por RANGO —el `>=`—, sin repetir una
  // línea: es literalmente la arquitectura de hermanas mayores del rector §5.5.
  const rango    = rangoDe(state)
  const avanzado = rango >= RANGO_AVANZADO
  const pro      = rango >= RANGO_PRO
  if (pro) _DIAG_PRO.decisiones++

  // ── Ajilei · agresión total, y en Pro también disimulo ────────────────────
  // El tell honesto se conserva en Básico Y en Avanzado A PROPÓSITO (rector
  // §5.3): quien sube sin pestañear tiene la mano perfecta, y esa legibilidad es
  // parte de lo que hace que la escalera se SIENTA distinta.
  //
  // Pro lo esconde (instrucción NIV-2 §3, decisión sellada de Victor): con la
  // frecuencia declarada arriba juega LENTO en las fases tempranas —iguala o
  // pasa— para engordar el pote, y cobra en BET_3, que es la última ronda y por
  // tanto la que ya no puede dejar dinero sin recoger. El Ajilei sigue siendo
  // invencible; el disimulo sólo administra CUÁNDO se revela la agresión.
  //
  // INVARIANTE ABSOLUTA, compartida con los tres niveles: con Ajilei en la mano
  // no se retira jamás. Las dos ramas de abajo devuelven acciones que se quedan.
  if (isAjilei(ai.cards, ruleN)) {
    if (pro) {
      _DIAG_PRO.ajileis++
      if (phase !== 'BET_3' && Math.random() < FREC_DISIMULO) {
        _DIAG_PRO.disimulos++
        return { action: currentBet > 0 ? 'igualar' : 'pasar' }
      }
    }
    return { action: currentBet > 0 ? 'subir' : 'apostar' }
  }

  _ensurePersonalities(state)
  const profile = PROFILES[_assignments[aiIndex]]

  // ── Threshold adjustments ─────────────────────────────────────────────────
  // More active opponents → raise the bar (each extra opponent adds 2 pts)
  const activeOpponents = players.filter((p, i) => i !== aiIndex && !p.folded).length
  const opponentAdj     = (activeOpponents - 1) * 2  // 0 at N=2

  // Position: Pie (acts last, most info) → slightly lower bar; Mano (opens blind) → slightly higher
  const posAdj = pieIndex === aiIndex ? -2 : (manoIndex === aiIndex ? 1 : 0)

  // Noise applied per decision (IMPREDECIBLE: ±15% per call)
  const openMin  = _jitter(profile.openMin  + opponentAdj + posAdj, profile.noise)
  const callMin  = _jitter(profile.callMin  + opponentAdj + posAdj, profile.noise)
  const raiseMin = _jitter(profile.raiseMin + opponentAdj + posAdj, profile.noise)

  // ③ · la amenaza del comodín, calculada UNA vez y gastada en sus dos monedas:
  // `eqMano` para la matemática de bote, `scoreEf` para el listón de personalidad.
  // En Básico —y en Avanzado en mesas sin comodín, y en Avanzado cuando el
  // comodín es MÍO— `pComodin` vale 0 y `scoreEf === score` exactamente, así que
  // ninguna comparación de abajo cambia de lado.
  const kRivales = Math.max(1, activeOpponents)
  const pComodin = avanzado ? probComodinEnRival(state, ai, activeOpponents) : 0

  // ② · la lectura de descartes. Sólo Pro, sólo en BET_3 —antes de la ronda de
  // descarte no hay nada que leer y la capacidad está inerte por construcción—,
  // y sólo si la ronda dejó rastro COMPLETO: `lecturaDeDescartes` devuelve null
  // ante la menor incoherencia y Pro cae a la decisión de Avanzado. Ciego y
  // «leo mal» no se confunden.
  const lectura = pro && phase === 'BET_3' ? lecturaDeDescartes(state, aiIndex) : null
  if (lectura) _DIAG_PRO.conLectura++
  // La fuente de equidad. Sin lectura —Básico, Avanzado, y Pro fuera de BET_3 o
  // con la cuenta incompleta— es EXACTAMENTE la lambda de NIV-1.
  const eqDe = lectura === null
    ? (s => equidad(s, phase, kRivales))
    : (s => equidadConLectura(s, lectura))
  const eqMano = avanzado
    ? corrigePorComodin(eqDe, score, kRivales, state.handRules.comodinValue, pComodin)
    : 0
  // El puntaje equivalente. La amenaza del comodín sólo RESTA, así que ahí el
  // barrido se topa en el propio puntaje. La lectura de ② puede sumar —una mesa
  // que reconstruyó palo vale más de lo que las tablas suponen—, y por eso con
  // lectura viva el barrido se abre hasta el final del rango. Es seguro
  // precisamente ahí y sólo ahí: la curva de BET_3 es monótona, y ② nunca actúa
  // en otra fase.
  const scoreEf = (pComodin > 0 || lectura !== null)
    ? puntajeEquivalente(eqMano, score, phase, kRivales, lectura ? Infinity : Math.round(score))
    : score

  // ④ · el veredicto del bote. Sólo Avanzado+, y sólo cuando hay bote que medir:
  // sin bote no hay matemática de bote y se cae al listón de Básico (estado
  // sintético, no situación de juego real — el motor cobra antes en cada mano).
  // Con `toCall <= 0` igualar es GRATIS y retirarse no puede ser correcto nunca:
  // Básico sí se retira ahí (`score < callMin` en el tramo final), y eso es
  // regalar la mano sin que nadie la cobre.
  const bote = state.pot ?? 0
  const boteDecide = avanzado && bote > 0
  // Lectura de `contrib` ajenos: lo que los vivos aún deben para quedarse.
  const porIgualar = !boteDecide ? 0 : players.reduce((suma, p, i) => (
    i === aiIndex || p.folded ? suma : suma + Math.min(Math.max(currentBet - p.contrib, 0), p.chips)
  ), 0)
  const pagaElBote = boteDecide && (
    toCall <= 0 || eqMano >= toCall / (bote + toCall + porIgualar)
  )

  // ── ⑥ FAROL ESTRATÉGICO · Pro (rector §5.3) ───────────────────────────────
  //
  // POR FRECUENCIA, JAMÁS POR MONTO. `applyAIBetAction` pasa `state.unit` fijo e
  // ignora cualquier cantidad que esta función devolviera (`gameEngine.js:482`),
  // así que la única variable expresiva de un farol aquí es CUÁNDO y CUÁNTAS
  // VECES. El techo se declara en vez de olvidarse.
  //
  // NUNCA CIEGO (D-4). Se exigen las tres cosas a la vez:
  //
  //   1. LECTURA VIVA. Sin ② no hay farol, ni uno. Un farol sin lectura sería
  //      justamente el «multiplicador ciego de agresión» que D-4 prohíbe, y la
  //      diferencia entre las dos cosas es esta línea.
  //   2. QUE EL RESPALDO CUBRA EL PRECIO. Es la aritmética de bote de ④ puesta
  //      del otro lado: farolear cuesta lo que pongo y paga el bote que se
  //      queda sin dueño si todos sueltan, luego conviene cuando
  //
  //          P(todos sueltan) >= costo / (costo + bote)
  //
  //      Ni un umbral inventado: la probabilidad sale de la curva medida de ② y
  //      el precio, del bote real de la mesa. Contra cuatro rivales el producto
  //      se desploma solo —cada factor está entre 0 y 1— y el farol se apaga sin
  //      que nadie tenga que prohibirlo por tamaño de mesa. El premio se cuenta
  //      SIN `porIgualar` a propósito: quien se va no paga, así que sumar lo que
  //      los vivos aún deben inflaría el bote que un farol exitoso cobra.
  //   3. EL DADO. Con respaldo y precio, se farolea `FREC_FAROL` de las veces.
  //
  // Y sólo transforma un RETIRO en subida, o un paso en apertura: nunca cambia
  // una mano que ya iba a pagar, porque eso no sería farol sino apuesta de valor
  // mal contada.
  const costoFarol    = currentBet === 0 ? unit : toCall + unit
  const respaldoFarol = lectura ? respaldoDelFarol(lectura, kRivales) : 0
  const farolRespaldado = lectura !== null && bote > 0 &&
    respaldoFarol >= costoFarol / (costoFarol + bote)
  if (farolRespaldado) _DIAG_PRO.farolRespaldado++
  const farolar = farolRespaldado && Math.random() < FREC_FAROL

  // Convierte un retiro en subida cuando el farol está autorizado y hay saldo.
  const conFarol = (decision) => {
    if (!farolar || decision.action !== 'retirarse' || !canAffordRaise) return decision
    _DIAG_PRO.faroles++
    _DIAG_PRO.farolSube++
    _DIAG_PRO.farolPorAsiento[aiIndex] = true
    return { action: 'subir' }
  }

  // ── No bet yet: open or pass ──────────────────────────────────────────────
  //
  // LÍMITE CONOCIDO, DECLARADO Y SIN REMEDIO EN ESTA FASE — «el tell del pase»
  // (NIV-CAL §5, decisión D de Victor; confirmado por Victor jugando de verdad,
  // no sólo medido). Abrir o pasar se decide por un UMBRAL DE PUNTAJE, así que
  // el pase revela debilidad: en los TRES niveles, una IA que pasa casi nunca
  // lleva una mano fuerte. El farol de Pro tapa una parte del agujero —a veces
  // abre con nada— pero sólo en BET_3 y sólo con lectura, así que el tell
  // sobrevive entero en BET_1 y BET_2.
  //
  // Por qué no se arregla aquí: taparlo de verdad exige un pase-trampa con mano
  // fuerte —jugar lento a propósito—, y eso es un modelo de rival, no un umbral.
  // El remedio tiene nombre: capacidad ⑤ (modelado adaptativo), DIFERIDA por el
  // rector §5.4 hasta que exista gancho de showdown (deuda de motor, v1.0 §8).
  // Se declara para que ninguna tanda futura crea que es un descuido.
  if (currentBet === 0) {
    // Saldo: no abrir si no se puede cubrir la apuesta de apertura (unit) → pasar.
    if (scoreEf >= openMin && ai.chips >= unit) return { action: 'apostar' }
    if (farolar && ai.chips >= unit) {
      _DIAG_PRO.faroles++
      _DIAG_PRO.farolAbre++
      _DIAG_PRO.farolPorAsiento[aiIndex] = true
      return { action: 'apostar' }
    }
    return { action: 'pasar' }
  }

  // ── BET_1: only 2 cards — call liberally; fold only on big raise + weak hand
  if (phase === 'BET_1') {
    if (scoreEf >= raiseMin)             return canAffordRaise ? { action: 'subir' } : { action: 'igualar' }
    if (boteDecide)                      return pagaElBote ? { action: 'igualar' } : { action: 'retirarse' }
    if (scoreEf >= callMin)              return { action: 'igualar' }
    if (toCall <= unit * 2)              return { action: 'igualar' }  // cheap-call safety
    return { action: 'retirarse' }
  }

  // ── BET_2: 5 cards — real hand evaluation ────────────────────────────────
  if (phase === 'BET_2') {
    if (scoreEf >= raiseMin) return (canAffordRaise && Math.random() < 0.6) ? { action: 'subir' } : { action: 'igualar' }
    if (boteDecide)                      return pagaElBote ? { action: 'igualar' } : { action: 'retirarse' }
    if (scoreEf >= callMin + 4)          return { action: 'igualar' }
    if (scoreEf >= callMin) return toCall <= unit * 2 ? { action: 'igualar' } : { action: 'retirarse' }
    return { action: 'retirarse' }
  }

  // ── BET_3: post-discard — highest bar ────────────────────────────────────
  // La única fase con `conFarol`, y no por comodidad: es la única donde ②
  // tiene algo que leer, y sin lectura no hay farol (`farolar` sale falso).
  // Envolver las otras fases sería escribir una rama muerta.
  if (phase === 'BET_3') {
    if (scoreEf >= raiseMin) return (canAffordRaise && Math.random() < 0.7) ? { action: 'subir' } : { action: 'igualar' }
    if (boteDecide)                      return conFarol(pagaElBote ? { action: 'igualar' } : { action: 'retirarse' })
    if (scoreEf >= callMin + 4)          return { action: 'igualar' }
    if (scoreEf >= callMin) return conFarol(toCall <= unit ? { action: 'igualar' } : { action: 'retirarse' })
    return conFarol({ action: 'retirarse' })
  }

  if (boteDecide) return pagaElBote ? { action: 'igualar' } : { action: 'retirarse' }
  return scoreEf >= callMin ? { action: 'igualar' } : { action: 'retirarse' }
}

export function decideDiscard(state, aiIndex) {
  const { players } = state
  const ai = players[aiIndex]
  // HR-1: comodín y tope de descarte salen del snapshot congelado en el barajado
  const { ruleN, maxDiscard: topeDescarte, comodinValue } = state.handRules
  const comodinEnabled = comodinValue !== null

  const { palo: bestSuit } = getBestSuitScore(ai.cards, ruleN, comodinEnabled)
  const avanzado = rangoDe(state) >= RANGO_AVANZADO

  const indices = []
  ai.cards.forEach((card, i) => {
    const esComodin = card.palo === 'Oros' && card.value === 7
    // ③ · Básico protege el comodín SÓLO en N=5 (`ruleN === 5` a pelo). Es un
    // punto ciego declarado del nivel, no un descuido: en N=4 el 7 de Oros
    // también es comodín y también vale 10 sobre CUALQUIER palo
    // (`handEvaluator.js:2-6`), así que tirarlo regala 10 puntos.
    // Avanzado lee la regla congelada de la mano en vez del número: protege
    // siempre que la mesa haga valer el comodín, que es lo que `comodinValue`
    // dice. Es la corrección del punto ciego, no una capacidad nueva.
    if (esComodin && (avanzado ? comodinEnabled : ruleN === 5)) return
    if (card.palo !== bestSuit) indices.push(i)
  })

  const elegidos = indices.slice(0, topeDescarte)

  // ② · aquí nace la memoria. `aiPlayer` decide TODOS los descartes de asientos
  // IA, así que esto es acordarse de lo propio, no espiar lo ajeno. Sólo Pro
  // anota: Básico y Avanzado no tocan `state.deck` ni una vez, y la trampa Proxy
  // de la red de pruebas lo exige de los tres niveles por separado.
  if (rangoDe(state) >= RANGO_PRO) _anotarDescarte(state, aiIndex, elegidos.length)

  return elegidos
}
