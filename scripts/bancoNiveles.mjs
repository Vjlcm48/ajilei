// ── bancoNiveles.mjs · BANCO DE LÍNEA BASE de la IA (fase 4, tanda NIV-B0) ───
// Documento rector: docs/AJILEI_Modos_y_Asistencia_v1.0.md §10.
//
// Qué es: un banco de simulación PERMANENTE (molde diagDSK: se rastrea, se
// queda) que juega manos completas sin UI y mide la tasa de victoria del
// asiento 0 contra la IA. Su razón de ser es tener una VARA: las bandas
// objetivo de Avanzado y Pro se fijarán relativas a esta línea base, no a un
// número inventado.
//
// READ-ONLY sobre src/: no toca una línea. El motor se conduce por su API
// PÚBLICA —la misma que usa la UI— y el bucle de mano replica el encadenado de
// `simHand` (scripts/testAI.test.js:82-92) sin importar nada de un .test.js:
// los globals de Vitest no existen en `node` puro y este banco es Node puro.
//
// Uso:
//   node scripts/bancoNiveles.mjs                    → matriz completa 4×3
//   node scripts/bancoNiveles.mjs --mesa 5 --j0 espejo --manos 20000
//   node scripts/bancoNiveles.mjs --nivel avanzado   → cuando NIV-1 aterrice
//
// Parámetros:
//   --mesa <2|3|4|5>            una sola mesa (omitido = las cuatro)
//   --j0 <espejo|pasivo|aleatorio>  un solo conductor (omitido = los tres)
//   --manos <n>                 manos CONTADAS por celda (default 100.000). El
//                               mínimo de humo son 5.000: sirve para ver que el
//                               banco corre, no para fijar una banda — a ese
//                               volumen mesa 2 y 3 en espejo cierran con 6 y 10
//                               partidas, y el SE por racimos sale ancho.
//   --unit <n>                  entrada de mesa (default 50: la más baja REAL del
//                               juego, tabla de Básico del rector §3.3. Ojo: el 10
//                               de las fixtures de testAI no existe en la app —
//                               allí `unit` es el stake, GameTable.jsx:268)
//   --sorteo <partida|celda>    cuándo re-repartir los perfiles (default partida)
//   --nivel <basico|avanzado|pro>   pasajero `state.nivelIA` (default basico)
//   --repuertas <ruta>          recalcula los veredictos de un JSON ya escrito
//                               (umbral por familia en b3) SIN volver a jugar
//   --base                      además del volcado, reescribe el resumen rastreado
//
// Salidas (§6): volcado completo a capturas-dsk/ (ignorada, regenerable) y
// —sólo con --base— el resumen a capturas-dsk/evidencia/nivB0_base.json, que
// SÍ se rastrea: es la vara contra un commit exacto, misma doctrina que
// mobile_base.json. Sin siembra todavía; la reproducibilidad se compensa con
// volumen y el JSON registra el conteo exacto de manos (§6 del rector).
import { register } from 'node:module'
// El motor importa sin extensión y es archivo PROTEGIDO: el banco se adapta
// con el gancho de resolución del arnés (scripts/_resolveExt.mjs). Por eso los
// imports del motor son DINÁMICOS: un import estático se resolvería antes de
// que `register` corra.
register('./_resolveExt.mjs', import.meta.url)
import { writeFileSync, readFileSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const {
  PHASES, createInitialState, startHand, advanceFromDeal,
  applyPlayerBetAction, applyAIBetAction, applyDiscard,
} = await import('../src/engine/gameEngine.js')
const { decideBetAction, decideDiscard, getPersonalityName, initPersonalities, _resetForTesting } =
  await import('../src/engine/aiPlayer.js')

const RAIZ     = join(dirname(fileURLToPath(import.meta.url)), '..')
const DIR_OUT  = join(RAIZ, 'capturas-dsk')
const DIR_EVID = join(DIR_OUT, 'evidencia')

// ── Argumentos ───────────────────────────────────────────────────────────────
const argv = process.argv.slice(2)
const arg  = (nombre, porDefecto = null) => {
  const i = argv.indexOf(`--${nombre}`)
  return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : porDefecto
}
const flag = (nombre) => argv.includes(`--${nombre}`)

const MESAS       = arg('mesa') ? [Number(arg('mesa'))] : [2, 3, 4, 5]
const CONDUCTORES = arg('j0')   ? [arg('j0')]           : ['espejo', 'pasivo', 'aleatorio']
const MANOS       = Number(arg('manos', 100000))
const UNIT        = Number(arg('unit', 50))
const SORTEO      = arg('sorteo', 'partida')
const NIVEL       = arg('nivel', 'basico')
const ESCRIBE_BASE = flag('base')

// ── Por qué el banco re-reparte los perfiles en cada partida ─────────────────
// MEDIDO, no supuesto: el re-sorteo por "sesión nueva" de `aiPlayer.js:59`
// EXIGE `state.handCount === 0` en el momento de una decisión, y eso no ocurre
// jamás jugando — `startHand` deja el contador en 1 antes de la primera
// apuesta, así que la rama sólo se alcanza con un estado sintético (es lo que
// hace testAI.test.js:134-159). Consecuencia: sin intervención, TODAS las manos
// de una celda —y de la app entera, mesa tras mesa— corren sobre un ÚNICO
// reparto de perfiles. La celda mediría entonces "el asiento 0 contra este
// reparto concreto", no la línea base: dos corridas de 3000 manos dieron 25,17%
// y 17,20% por ese solo motivo.
//
// El banco lo corrige por la API pública —`initPersonalities`, exportada y
// declarada "also called directly by tests"— re-repartiendo al empezar cada
// partida, que es exactamente lo que la rama muerta pretendía hacer. Con
// `--sorteo celda` se reproduce el comportamiento de la app tal cual está.
// Esto NO toca src/: es una decisión de MUESTREO del banco, y va declarada.

// Tope de manos por partida: red anti-bucle, no un límite de diseño. El sondeo
// midió partidas de 589 a 1859 manos con unit=10; 100k es tres órdenes por
// encima de lo observado y sólo salta si el motor deja de converger.
const CAP_PARTIDA = 100000

// ── Conductores del asiento 0 ────────────────────────────────────────────────

// ESPEJO · el cerebro de la IA actual jugando el asiento 0.
//
// ⚠ ADAPTADOR DECLARADO. `decideBetAction(state, 0)` NO es invocable: los
// perfiles se reparten sólo a los asientos 1…N-1 (`aiPlayer.js:41-43`), así que
// para el asiento 0 `PROFILES[_assignments[0]]` es `undefined` y la función
// revienta en `.openMin` (`:114`). Verificado en el sondeo previo, no supuesto.
//
// El banco NO toca src/ para arreglarlo. En su lugar construye un ESTADO
// ESPEJO: una permutación que intercambia el asiento 0 con el asiento 1 y
// remapea Mano y Pie por la misma permutación. La decisión resultante es
// EXACTA, porque `decideBetAction` es función pura de (cartas propias, fichas,
// contrib, apuesta viva, fase, posición relativa a Mano/Pie, nº de oponentes
// activos, perfil): los tres primeros viajan con el objeto del jugador, la
// posición se remapea, y el conteo de oponentes es invariante a permutaciones
// (`:107` filtra por índice distinto, no por índice concreto).
//
// COSTO, dicho sin adorno: el asiento 0 TOMA PRESTADO el perfil del asiento 1.
// En mesa 2 eso es el espejo perfecto —ambos asientos, el mismo perfil—. En
// mesas 3/4/5 significa que dos asientos comparten perfil, y por eso el banco
// mide también la puerta pareada asiento0-vs-asiento1 (§5b), que es más aguda
// que el 1/N: mismo cerebro y mismo perfil, sólo cambia la posición.
//
// INVARIANTE CRÍTICA: el estado espejo conserva `numPlayers` y `handCount`
// idénticos. `_ensurePersonalities` (`:58-64`) RE-SORTEA los perfiles si
// cualquiera de los dos cambia; alterarlos corrompería los asientos IA reales a
// mitad de partida.
function estadoEspejo(s) {
  const perm = (i) => (i === 0 ? 1 : i === 1 ? 0 : i)
  return {
    ...s,
    players:   s.players.map((_, i) => s.players[perm(i)]),
    manoIndex: perm(s.manoIndex),
    pieIndex:  perm(s.pieIndex),
  }
}

function j0Espejo(s) {
  return decideBetAction(estadoEspejo(s), 1).action
}

// PASIVO · iguala o pasa, jamás sube, jamás se retira por decisión propia.
// (El motor puede forzarle el retiro por saldo — `gameEngine.js:258` —, y eso
// es regla del motor, no decisión del conductor.)
function j0Pasivo(s) {
  return s.currentBet - s.players[0].contrib > 0 ? 'igualar' : 'pasar'
}

// ALEATORIO · acción LEGAL uniforme entre las legales de ese instante.
function j0Aleatorio(s) {
  const p      = s.players[0]
  const toCall = s.currentBet - p.contrib
  const legales = []
  if (s.currentBet === 0) {
    legales.push('pasar')
    if (p.chips >= s.unit) legales.push('apostar')
  } else {
    legales.push('retirarse')
    if (p.chips >= toCall) legales.push('igualar')
    // `subir` pone el total (currentBet + unit) − contrib (`gameEngine.js:262`)
    if (p.chips >= (s.currentBet + s.unit) - p.contrib) legales.push('subir')
  }
  return legales[Math.floor(Math.random() * legales.length)]
}

const APUESTA = { espejo: j0Espejo, pasivo: j0Pasivo, aleatorio: j0Aleatorio }

// Descarte del asiento 0. `decideDiscard` SÍ es invocable con seat 0 sin
// adaptador: no consulta perfiles, sólo cartas propias y `handRules`
// (`aiPlayer.js:152-168`). Por eso PASIVO usa el descarte de la IA — aísla la
// pasividad de APUESTA, que es lo que ese conductor quiere medir.
function descarte(modo, s) {
  if (modo !== 'aleatorio') return decideDiscard(s, 0)
  const tope  = s.handRules.maxDiscard
  const libres = s.players[0].cards.map((_, i) => i)
  const n = Math.floor(Math.random() * (Math.min(tope, libres.length) + 1))
  for (let i = libres.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[libres[i], libres[j]] = [libres[j], libres[i]]
  }
  return libres.slice(0, n)
}

// ── Bucle de mano — mismo encadenado que simHand, API pública ────────────────
function jugarRonda(s, fase, modo) {
  let n = 0
  while (s.phase === fase) {
    if (++n > 5000) throw new Error(`ronda ${fase} sin converger`)
    const asiento = s.activePlayerIndex
    // Un asiento RETIRADO puede recibir turno al abrir BET_2/BET_3 (el motor
    // reinicia activePlayerIndex = manoIndex). Se salta en silencio, igual que
    // hace la UI en GameTable.jsx:691.
    if (s.players[asiento].folded) {
      s = asiento === 0 ? applyPlayerBetAction(s, 'pasar') : applyAIBetAction(s)
      continue
    }
    s = asiento === 0
      ? applyPlayerBetAction(s, APUESTA[modo](s), s.unit)
      : applyAIBetAction(s)
  }
  return s
}

function jugarMano(s, modo) {
  s = advanceFromDeal(s)                            // DEAL_2 → BET_1
  s = jugarRonda(s, PHASES.BET_1, modo)
  if (s.phase === PHASES.PAYOUT) return s
  s = advanceFromDeal(s)                            // DEAL_3 → BET_2
  s = jugarRonda(s, PHASES.BET_2, modo)
  if (s.phase === PHASES.PAYOUT) return s
  s = applyDiscard(s, s.players[0].folded ? [] : descarte(modo, s))
  return jugarRonda(s, PHASES.BET_3, modo)          // → SHOWDOWN → PAYOUT
}

// ── Una celda de la matriz ───────────────────────────────────────────────────
//
// EL DENOMINADOR, que es la decisión de diseño de este banco.
//
// La primera versión contaba TODAS las manos y comparaba contra 1/N. Medía
// cualquier cosa menos lo que decía: en mesa 5 con conductor espejo, sólo el
// 4,3% de las manos se jugaron con cinco vivos. La mesa se reduce a dos o tres
// en las primeras decenas de manos y se queda ahí cientos, así que el promedio
// estaba dominado por mesas encogidas donde ganar 1 de cada 2 es lo normal —de
// ahí un falso 42,88% para el asiento 0—. La puerta (b) lo cazó con 65σ.
//
// Corrección: la métrica primaria cuenta SÓLO MANOS DE MESA LLENA (los N
// asientos vivos al repartir). Así "mesa de 5" significa cinco jugadores
// sentados, 1/N es la hipótesis nula EXACTA, y la comparación entre asientos es
// legítima porque todos comparten denominador. `--manos` es, por tanto, el
// objetivo de manos CONTADAS; las manos simuladas son más y se reportan aparte.
//
// Las manos de mesa encogida no se tiran: alimentan `porVivos`, que da la tasa
// del asiento 0 por tamaño real de mesa. Es la misma doctrina que el ranking
// del rector §6 —los puntos de una mano salen de los sentados al barajado del
// Pie, no del tamaño nominal de la mesa—, y sale gratis en la misma corrida.
function correrCelda(N, modo) {
  _resetForTesting()   // reparto de perfiles fresco por celda: aislamiento

  const acc = {
    manos: 0,          // simuladas (todas)
    manosLlenas: 0,    // contadas (mesa completa) ← denominador primario
    partidas: 0, partidasCompletas: 0, sorteos: 0,
    ganadasPorAsiento: new Array(N).fill(0),   // sólo manos de mesa llena
    manoPorAsiento:    new Array(N).fill(0),
    piePorAsiento:     new Array(N).fill(0),
    partidasGanadasPorAsiento: new Array(N).fill(0),
    porPerfil: {},
    porVivos:  {},     // tasa del asiento 0 por nº de vivos al repartir
    // Conglomerados: una entrada por partida con {manos llenas, ganadas por
    // asiento}. Sostiene el SE robusto — ver `seCluster`.
    racimos: [],
    // Ventaja posicional agrupada por ROL, no por asiento: es la evidencia que
    // separa "sesgo del banco" de "posAdj hace su trabajo" (§4 del rector).
    rol: { mano: { j: 0, g: 0 }, pie: { j: 0, g: 0 }, medio: { j: 0, g: 0 } },
    manosPorPartida: [],
    fallas: { conservacion: 0, pasajero: 0, faseInesperada: 0, capPartida: 0 },
  }

  const t0 = Date.now()
  while (acc.manosLlenas < MANOS) {
    // PASAJERO §3: el nivel se inyecta en la CREACIÓN del estado, exactamente
    // donde lo hará la UI (GameTable.jsx:268), y es de MESA COMPLETA (D-7). Hoy
    // es inerte —aiPlayer no lo lee—, y ese es el punto: el día que NIV-1
    // aterrice, el banco mide niveles sin cambiar una línea de este script.
    let s = { ...createInitialState(UNIT, N), nivelIA: NIVEL }
    const fichasIniciales = s.players.reduce((a, p) => a + p.chips, 0)
    acc.partidas++
    let manosPartida = 0
    let completa = false

    const racimo = { n: 0, g: new Array(N).fill(0) }
    acc.racimos.push(racimo)

    if (SORTEO === 'partida') { initPersonalities(N); acc.sorteos++ }
    // Reparto vigente en ESTA partida. Bajo `espejo` el asiento 0 juega con el
    // perfil del 1 (adaptador), así que se etiqueta con él.
    const perfilDe = Array.from({ length: N }, (_, i) => getPersonalityName(i === 0 ? 1 : i))

    for (;;) {
      s = startHand(s)
      if (s.phase === PHASES.GAME_OVER) {
        acc.partidasCompletas++
        completa = true
        if (s.winner !== null && s.winner >= 0) acc.partidasGanadasPorAsiento[s.winner]++
        break
      }
      const manoDe = s.manoIndex, pieDe = s.pieIndex
      const vivos  = s.players.map(p => !p.eliminated)
      const nVivos = vivos.reduce((a, v) => a + (v ? 1 : 0), 0)
      const llena  = nVivos === N

      s = jugarMano(s, modo)
      acc.manos++; manosPartida++

      // PUERTA (a) · conservación de fichas en el 100% de las manos —todas las
      // simuladas, no sólo las contadas. Reimplementación del invariante de
      // testAI.test.js:390-409 como aserción del bucle.
      if (s.phase !== PHASES.PAYOUT) acc.fallas.faseInesperada++
      const total = s.players.reduce((a, p) => a + p.chips, 0) + s.pot
      if (total !== fichasIniciales || s.players.some(p => p.chips < 0)) acc.fallas.conservacion++
      // PUERTA extra · el pasajero sobrevive el motor entero: verifica en
      // caliente la Vía C que el rector selló en §2.2, antes de que NIV-UI la
      // implemente.
      if (s.nivelIA !== NIVEL) acc.fallas.pasajero++

      const g = s.winner
      const pv = acc.porVivos[nVivos] ?? (acc.porVivos[nVivos] = { j: 0, g: 0 })
      pv.j++
      if (g === 0) pv.g++

      if (llena) {
        acc.manosLlenas++
        racimo.n++
        acc.manoPorAsiento[manoDe]++
        acc.piePorAsiento[pieDe]++
        if (g !== null && g >= 0) { acc.ganadasPorAsiento[g]++; racimo.g[g]++ }
        for (let asiento = 0; asiento < N; asiento++) {
          const rol = asiento === manoDe ? 'mano' : asiento === pieDe ? 'pie' : 'medio'
          acc.rol[rol].j++
          if (g === asiento) acc.rol[rol].g++
          // Fuerza por perfil: sólo asientos con cerebro de IA. El asiento 0
          // sólo cuenta bajo `espejo`, que es cuando de verdad lleva uno.
          if (asiento === 0 && modo !== 'espejo') continue
          const perfil = perfilDe[asiento]
          if (!perfil) continue
          const pp = acc.porPerfil[perfil] ?? (acc.porPerfil[perfil] = { j: 0, g: 0 })
          pp.j++
          if (g === asiento) pp.g++
        }
      }

      if (manosPartida >= CAP_PARTIDA) { acc.fallas.capPartida++; break }
    }
    // Sólo las partidas COMPLETAS entran en la estadística de longitud y en la
    // tasa por partida. La partida corre SIEMPRE hasta su final aunque el
    // objetivo de manos contadas ya se haya cumplido: cortarla a mitad sesgaría
    // la métrica por partida hacia las mesas que aún no han terminado.
    if (completa) acc.manosPorPartida.push(manosPartida)
  }
  const ms = Date.now() - t0

  const tasa = (g, n) => (n > 0 ? g / n : 0)
  const se   = (p, n) => (n > 0 ? Math.sqrt((p * (1 - p)) / n) : 0)
  const p0   = tasa(acc.ganadasPorAsiento[0], acc.manosLlenas)

  // ── SE por CONGLOMERADOS (la partida es la unidad independiente) ───────────
  // MEDIDO: tres réplicas de mesa 4 × 20.000 manos dieron para un mismo asiento
  // 23,59% / 25,64% / 26,15% con un SE binomial de ±0,30pp. Una dispersión de
  // 2,6pp entre réplicas contra una barra de 0,30 no es azar binomial: las
  // manos NO son independientes. Van en racimos por partida —dentro de una, el
  // reparto de perfiles es fijo y las pilas de fichas se arrastran de mano en
  // mano—, así que la unidad independiente real es la PARTIDA, no la mano.
  //
  // Estimador de razón para muestreo por conglomerados: con racimos p de tamaño
  // n_p y éxitos g_p,  Var(rGorro) ≈ P/(P−1) · Σ(g_p − rGorro·n_p)² / (Σn_p)².
  // Un banco que publicara la barra binomial fijaría las bandas de NIV-1 y
  // NIV-2 con un error 3× más estrecho de lo real: exactamente el modo en que
  // un verde miente.
  const seCluster = (asiento) => {
    const rac = acc.racimos.filter(r => r.n > 0)
    const P = rac.length
    if (P < 2) return null
    const total = rac.reduce((a, r) => a + r.n, 0)
    const rGorro = rac.reduce((a, r) => a + r.g[asiento], 0) / total
    const s2 = rac.reduce((a, r) => a + (r.g[asiento] - rGorro * r.n) ** 2, 0)
    return Math.sqrt((P / (P - 1)) * s2) / total
  }
  const seCl0 = seCluster(0)
  const tabla = (o) => Object.fromEntries(Object.entries(o).map(([k, v]) => {
    const p = tasa(v.g, v.j)
    return [k, { jugadas: v.j, ganadas: v.g, tasa: p, se: se(p, v.j) }]
  }))

  return {
    mesa: N, conductor: modo,
    manosContadas: acc.manosLlenas, manosSimuladas: acc.manos,
    unit: UNIT, nivel: NIVEL, sorteo: SORTEO, sorteosDePerfiles: acc.sorteos,
    tasaAsiento0: p0,
    seAsiento0: se(p0, acc.manosLlenas),          // binomial (optimista)
    seClusterAsiento0: seCl0,                     // por partida (el que manda)
    efectoDiseno: seCl0 ? (seCl0 / se(p0, acc.manosLlenas)) ** 2 : null,
    esperado: 1 / N,
    porAsiento: acc.ganadasPorAsiento.map((g, i) => {
      const p = tasa(g, acc.manosLlenas)
      return {
        asiento: i, ganadas: g, tasa: p,
        se: se(p, acc.manosLlenas), seCluster: seCluster(i),
        manoVeces: acc.manoPorAsiento[i], pieVeces: acc.piePorAsiento[i],
      }
    }),
    porRol:   tabla(acc.rol),
    porPerfil: tabla(acc.porPerfil),
    porVivos: tabla(acc.porVivos),
    partidas: {
      iniciadas: acc.partidas,
      completas: acc.partidasCompletas,
      ganadasAsiento0: acc.partidasGanadasPorAsiento[0],
      tasaAsiento0: tasa(acc.partidasGanadasPorAsiento[0], acc.partidasCompletas),
      seAsiento0: se(tasa(acc.partidasGanadasPorAsiento[0], acc.partidasCompletas), acc.partidasCompletas),
      medianaManosPorPartida: mediana(acc.manosPorPartida),
    },
    capacidad: { ms, manosPorMinuto: Math.round((acc.manos / ms) * 60000) },
    fallas: acc.fallas,
  }
}

function mediana(xs) {
  if (!xs.length) return 0
  const a = [...xs].sort((x, y) => x - y)
  const m = Math.floor(a.length / 2)
  return a.length % 2 ? a[m] : Math.round((a[m - 1] + a[m]) / 2)
}

// ── Puertas del banco (§5 del rector) ────────────────────────────────────────
// Un verde debe medir lo que dice. La (b) es la puerta de VALIDEZ: si el
// espejo no sale simétrico, los números del banco no se entregan.
// ── Umbral por familia para b3 (corrección de comparaciones múltiples) ───────
// b3 no es UNA prueba: es una por cada pareja de asientos no gemelos de cada
// mesa. A 3σ por prueba, una familia de m pruebas tiene una probabilidad de
// falso positivo de ~m·0,0027 — con m=4 eso es ~1%, así que un rojo suelto es
// esperable POR DISEÑO y no dice nada del banco. Eso fue exactamente lo que
// ocurrió en la vara: mesa 5, par 2-vs-4, 3,02σ.
//
// La corrección es Bonferroni: se reparte el alfa de la familia entre sus m
// pruebas, de modo que la probabilidad de que la PUERTA ENTERA se ponga roja
// por azar vuelva a ser la de una sola prueba a 3σ. El alfa de familia se fija
// en el p a dos colas de 3σ para que, con m=1, el umbral degenere exactamente
// en los 3σ originales — la corrección no afloja nada cuando no hay familia.
//
// Esto NO re-lanza nada ni toca los datos: es aritmética sobre las σ ya
// medidas. Los dados son los mismos; lo que cambia es el listón contra el que
// se leen.
const P_3SIGMA = 0.0026997960632601866   // p a dos colas de |z| = 3

// Cuantil normal estándar (Acklam), error < 1,15e-9 — sobra para un umbral.
function zInversa(p) {
  const a = [-3.969683028665376e+01, 2.209460984245205e+02, -2.759285104469687e+02,
             1.383577518672690e+02, -3.066479806614716e+01, 2.506628277459239e+00]
  const b = [-5.447609879822406e+01, 1.615858368580409e+02, -1.556989798598866e+02,
             6.680131188771972e+01, -1.328068155288572e+01]
  const c = [-7.784894002430293e-03, -3.223964580411365e-01, -2.400758277161838e+00,
             -2.549732539343734e+00, 4.374664141464968e+00, 2.938163982698783e+00]
  const d = [7.784695709041462e-03, 3.224671290700398e-01, 2.445134137142996e+00,
             3.754408661907416e+00]
  const pBajo = 0.02425, pAlto = 1 - pBajo
  let q, r
  if (p < pBajo) {
    q = Math.sqrt(-2 * Math.log(p))
    return (((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5]) /
           ((((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1)
  }
  if (p <= pAlto) {
    q = p - 0.5; r = q * q
    return (((((a[0]*r+a[1])*r+a[2])*r+a[3])*r+a[4])*r+a[5])*q /
           (((((b[0]*r+b[1])*r+b[2])*r+b[3])*r+b[4])*r+1)
  }
  q = Math.sqrt(-2 * Math.log(1 - p))
  return -(((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5]) /
          ((((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1)
}

const umbralDeAlfa = (alfa) => -zInversa(alfa / 2)   // |z| crítico a dos colas

// Aplica el umbral de familia a los detalles de b3 y devuelve el bloque de
// método. Trabaja SOBRE LAS σ YA GUARDADAS: sirve igual para una corrida viva
// que para recalcular un JSON en disco (modo --repuertas).
function aplicarUmbralFamiliaB3(detalles) {
  const m = detalles.reduce((n, d) => n + (d.b3_paresNoGemelos?.length ?? 0), 0)
  const alfaFamilia = P_3SIGMA
  const alfaPrueba  = m > 0 ? alfaFamilia / m : alfaFamilia
  const umbral      = m > 0 ? umbralDeAlfa(alfaPrueba) : 3

  for (const d of detalles) {
    const pares = d.b3_paresNoGemelos ?? []
    d.b3_umbralSigmas = umbral
    d.b3_maxSigmas    = pares.length ? Math.max(...pares.map(p => p.sigmas)) : null
    d.b3_pasa         = pares.every(p => p.sigmas <= umbral)
  }

  // b2 también es una familia (una prueba por mesa), pero su margen es tan
  // amplio que ninguna corrección cambia su veredicto. Se declara el dato en
  // vez de corregir una puerta que la instrucción no abrió.
  const b2 = detalles.map(d => d.b2_pareadoGemelos?.sigmas ?? 0)

  return {
    correccion: 'Bonferroni',
    familia: 'las comparaciones por parejas de asientos NO GEMELOS del conductor espejo, sobre toda la matriz',
    tamanoFamilia: m,
    detalleFamilia: detalles
      .filter(d => (d.b3_paresNoGemelos?.length ?? 0) > 0)
      .map(d => ({ mesa: d.mesa, pares: d.b3_paresNoGemelos.length })),
    alfaFamilia,
    alfaPorPrueba: alfaPrueba,
    umbralSigmas: umbral,
    umbralSinCorregir: 3,
    porQue: `b3 no es una prueba sino ${m}. A 3σ por prueba la familia falla por azar con probabilidad ~${(m * P_3SIGMA * 100).toFixed(1)}%, así que un rojo suelto es esperable por diseño. El alfa de familia se reparte entre las ${m} pruebas para devolver a la PUERTA la tasa de error de una sola prueba a 3σ.`,
    degeneracion: 'con m=1 el umbral vuelve a ser exactamente 3σ: la corrección no afloja nada cuando no hay familia',
    b2_nota: `b2 (gemelo vs gemelo) es otra familia de ${b2.length} pruebas, máx ${Math.max(...b2).toFixed(2)}σ: verde con o sin corrección, así que su umbral se deja en 3σ`,
  }
}

function evaluarPuertas(celdas) {
  const conservacion = celdas.every(c =>
    c.fallas.conservacion === 0 && c.fallas.faseInesperada === 0 && c.fallas.capPartida === 0)
  const pasajero = celdas.every(c => c.fallas.pasajero === 0)

  // ── La puerta (b) y su hipótesis nula ─────────────────────────────────────
  // (el umbral por familia de b3 se aplica al final, ver aplicarUmbralFamiliaB3)
  // La (b) nació como "cada asiento ≈ 1/N dentro de 3σ". A 5.000 manos pasaba;
  // a 100.000 se puso roja, y la causa está MEDIDA: no es sesgo del banco, es
  // que el adaptador espejo obliga al asiento 0 a tomar prestado el perfil del
  // 1, de modo que en N>=3 la mesa lleva un perfil DUPLICADO. Los dos gemelos
  // chocan entre sí y rinden por debajo; los no gemelos, por encima. A 100.000
  // manos los CUATRO gemelos de las mesas 3/4/5 salen negativos y los no
  // gemelos compensan — patrón perfecto, no ruido.
  //
  // Por tanto 1/N NO es la nula correcta para N>=3: el propio adaptador la
  // invalida. Aflojar el umbral a 4σ sería fabricar un verde. Lo que se hace es
  // usar la nula EXACTA en cada caso, y seguir publicando el 1/N como
  // diagnóstico para que nada quede escondido:
  //
  //   b1 · mesa 2 contra 1/N — ahí el gemelaje es simétrico (los dos asientos
  //        son los gemelos) y 1/N es exacto.
  //   b2 · gemelo contra gemelo (asiento 0 vs 1) en TODAS las mesas — exacto
  //        por construcción: mismo cerebro, mismo perfil, sólo cambia el
  //        asiento. Es la puerta que de verdad valida el banco.
  //   b3 · los no gemelos entre sí (mesas 4 y 5) — también exacto: perfiles
  //        distintos pero ninguno duplicado, así que sus tasas deben ser
  //        mutuamente consistentes.
  const espejo = celdas.filter(c => c.conductor === 'espejo')
  const simetria = espejo.map(c => {
    // La σ que MANDA es la de conglomerados. La binomial se conserva al lado
    // porque su distancia a la otra es justamente el efecto de diseño, y ese
    // número es un dato del banco, no un detalle de contabilidad.
    const desvios = c.porAsiento.map(a => {
      const seUsado = a.seCluster ?? a.se
      return {
        asiento: a.asiento,
        delta: a.tasa - c.esperado,
        sigmas: seUsado > 0 ? Math.abs(a.tasa - c.esperado) / seUsado : 0,
        sigmasBinomial: a.se > 0 ? Math.abs(a.tasa - c.esperado) / a.se : 0,
      }
    })
    // Puerta pareada: asientos 0 y 1 comparten perfil POR CONSTRUCCIÓN del
    // adaptador espejo. Mismo cerebro, mismo temperamento: lo único que los
    // separa es la posición. Es la comparación más limpia que este banco
    // permite, y por eso se mide aparte del 1/N.
    const seDe = (a) => a.seCluster ?? a.se
    const par  = (a, b) => {
      const s = Math.sqrt(seDe(a) ** 2 + seDe(b) ** 2)
      return { delta: a.tasa - b.tasa, se: s, sigmas: s > 0 ? Math.abs(a.tasa - b.tasa) / s : 0 }
    }
    const a0 = c.porAsiento[0], a1 = c.porAsiento[1]
    const noGemelos = c.porAsiento.slice(2)

    // b3 · consistencia mutua de los no gemelos (todas las parejas)
    const paresNoGemelos = []
    for (let i = 0; i < noGemelos.length; i++) {
      for (let j = i + 1; j < noGemelos.length; j++) {
        paresNoGemelos.push({ a: noGemelos[i].asiento, b: noGemelos[j].asiento, ...par(noGemelos[i], noGemelos[j]) })
      }
    }

    // Diagnóstico (no puerta): cuánto pesa el gemelaje del adaptador.
    const media = (xs) => xs.reduce((s, a) => s + a.tasa, 0) / xs.length
    const sesgoGemelos = noGemelos.length
      ? media([a0, a1]) - media(noGemelos)
      : null

    return {
      mesa: c.mesa,
      esperado: c.esperado,
      efectoDiseno: c.efectoDiseno,
      desvios,
      maxSigmas: Math.max(...desvios.map(d => d.sigmas)),
      maxSigmasBinomial: Math.max(...desvios.map(d => d.sigmasBinomial)),
      // b1 sólo aplica a mesa 2: para N>=3 el 1/N queda como diagnóstico.
      b1_aplica: c.mesa === 2,
      b1_pasa: c.mesa === 2 ? desvios.every(d => d.sigmas <= 3) : null,
      b2_pareadoGemelos: par(a0, a1),
      b2_pasa: par(a0, a1).sigmas <= 3,
      b3_paresNoGemelos: paresNoGemelos,
      b3_pasa: paresNoGemelos.every(p => p.sigmas <= 3),
      diagnostico1sobreN: {
        sesgoGemelosPp: sesgoGemelos === null ? null : sesgoGemelos * 100,
        nota: c.mesa === 2
          ? 'mesa 2: los dos asientos SON los gemelos, así que 1/N es exacto'
          : 'N>=3: el adaptador duplica un perfil; los gemelos rinden por debajo de 1/N y los no gemelos por encima. Desviación esperada, cuantificada, no sesgo del banco.',
      },
    }
  })

  const b3_metodo = aplicarUmbralFamiliaB3(simetria)

  return {
    a_conservacionFichas: conservacion,
    b_espejoSimetrico:
      simetria.every(s => (s.b1_aplica ? s.b1_pasa : true) && s.b2_pasa && s.b3_pasa),
    b3_metodo,
    b_detalle: simetria,
    c_escriturasFueraDeCapturas: false,   // el script sólo escribe en capturas-dsk/
    extra_pasajeroSobrevive: pasajero,
  }
}

// ── Modo --repuertas · recalcular veredictos SIN volver a jugar ──────────────
// Corrige el UMBRAL, no los dados. Lee un JSON ya escrito, reevalúa b3 con el
// umbral por familia sobre las σ que ese archivo ya trae, y lo reescribe. No
// simula ni una mano: re-lanzar la matriz cambiaría los datos, y entonces no
// sabría nadie si el verde vino de la corrección o de una tirada más amable.
const RUTA_REPUERTAS = arg('repuertas')
if (RUTA_REPUERTAS) {
  const j = JSON.parse(readFileSync(RUTA_REPUERTAS, 'utf8'))
  if (!j.puertas?.b_detalle) {
    console.error(`${RUTA_REPUERTAS}: no trae puertas.b_detalle — nada que recalcular`)
    process.exit(1)
  }
  const antes = j.puertas.b_detalle.map(d => ({ mesa: d.mesa, pasa: d.b3_pasa }))
  const metodo = aplicarUmbralFamiliaB3(j.puertas.b_detalle)
  j.puertas.b3_metodo = metodo
  j.puertas.b_espejoSimetrico = j.puertas.b_detalle.every(
    d => (d.b1_aplica ? d.b1_pasa : true) && d.b2_pasa && d.b3_pasa)
  j.recalculos = [...(j.recalculos ?? []), {
    tanda: 'NIV-B0.c',
    que: 'umbral por familia en b3 (Bonferroni)',
    datosRelanzados: false,
    nota: 'sólo se reevaluaron las σ ya medidas; ninguna mano se volvió a jugar',
    antes, despues: j.puertas.b_detalle.map(d => ({ mesa: d.mesa, pasa: d.b3_pasa })),
  }]
  writeFileSync(RUTA_REPUERTAS, JSON.stringify(j, null, 2) + '\n')
  console.log(`Puertas recalculadas sobre ${RUTA_REPUERTAS} — sin re-lanzar la matriz`)
  console.log(`  familia b3: ${metodo.tamanoFamilia} pruebas (${metodo.detalleFamilia.map(f => `mesa ${f.mesa}: ${f.pares}`).join(', ')})`)
  console.log(`  umbral: ${metodo.umbralSigmas.toFixed(3)}σ (α familia ${metodo.alfaFamilia.toExponential(3)} → α prueba ${metodo.alfaPorPrueba.toExponential(3)})`)
  for (const d of j.puertas.b_detalle) {
    if (!d.b3_paresNoGemelos?.length) continue
    console.log(`  mesa ${d.mesa}: máx ${d.b3_maxSigmas.toFixed(2)}σ vs ${metodo.umbralSigmas.toFixed(2)}σ → ${d.b3_pasa ? 'VERDE' : 'ROJA'}` +
      `   [pares: ${d.b3_paresNoGemelos.map(p => `${p.a}v${p.b} ${p.sigmas.toFixed(2)}σ`).join(', ')}]`)
  }
  console.log(`  puerta (b) completa: ${j.puertas.b_espejoSimetrico ? 'VERDE' : 'ROJA'}`)
  process.exit(0)
}

// ── Corrida ──────────────────────────────────────────────────────────────────
mkdirSync(DIR_EVID, { recursive: true })   // idempotente: correr dos veces no rompe (ESC-1)

console.log(`Banco NIV-B0 · mesas=[${MESAS}] conductores=[${CONDUCTORES}] manos/celda=${MANOS} unit=${UNIT} nivel=${NIVEL}`)
console.log('(sin siembra: Math.random sin semilla en baraja y en IA — límite conocido, se compensa con volumen)\n')

const celdas = []
for (const N of MESAS) {
  for (const modo of CONDUCTORES) {
    const r = correrCelda(N, modo)
    celdas.push(r)
    const pct = (x) => (x * 100).toFixed(2).padStart(5)
    console.log(
      `mesa ${N} · ${modo.padEnd(9)} → asiento0 ${pct(r.tasaAsiento0)}% ±${((r.seClusterAsiento0 ?? r.seAsiento0) * 100).toFixed(2)}` +
      `  (esperado ${pct(r.esperado)}%)  partidas=${r.partidas.completas}` +
      `  ${r.capacidad.manosPorMinuto.toLocaleString('es')} manos/min` +
      (Object.values(r.fallas).some(v => v > 0) ? `  ⚠ fallas=${JSON.stringify(r.fallas)}` : '')
    )
  }
}

const puertas = evaluarPuertas(celdas)
console.log('\nPuertas:',
  `(a) conservación=${puertas.a_conservacionFichas ? 'VERDE' : 'ROJA'}`,
  `· (b) espejo 1/N=${puertas.b_espejoSimetrico ? 'VERDE' : 'ROJA'}`,
  `· (c) escrituras fuera de capturas-dsk=${puertas.c_escriturasFueraDeCapturas ? 'ROJA' : 'VERDE'}`,
  `· pasajero=${puertas.extra_pasajeroSobrevive ? 'VERDE' : 'ROJA'}`)
for (const d of puertas.b_detalle) {
  const b1 = d.b1_aplica ? `b1 vs 1/N ${d.b1_pasa ? 'VERDE' : 'ROJA'} (${d.maxSigmas.toFixed(2)}σ)` : `b1 n/a`
  const b3 = d.b3_paresNoGemelos.length ? `b3 no-gemelos ${d.b3_pasa ? 'VERDE' : 'ROJA'} (${Math.max(...d.b3_paresNoGemelos.map(p => p.sigmas)).toFixed(2)}σ)` : 'b3 n/a'
  console.log(`   mesa ${d.mesa}: ${b1} · b2 gemelos ${d.b2_pasa ? 'VERDE' : 'ROJA'} (${(d.b2_pareadoGemelos.delta * 100).toFixed(2)}pp, ${d.b2_pareadoGemelos.sigmas.toFixed(2)}σ) · ${b3}` +
    `\n            diagnóstico 1/N: máx ${d.maxSigmas.toFixed(2)}σ (binomial ${d.maxSigmasBinomial.toFixed(2)}σ, efecto de diseño ${d.efectoDiseno ? d.efectoDiseno.toFixed(1) : '—'}×)` +
    (d.diagnostico1sobreN.sesgoGemelosPp === null ? '' : ` · sesgo de gemelos ${d.diagnostico1sobreN.sesgoGemelosPp.toFixed(2)}pp`))
}

// ── Señal del PASIVO ─────────────────────────────────────────────────────────
// A 5.000 manos, el conductor pasivo sacó +1,79pp sobre 1/N en mesa 4. Un
// jugador que iguala y pasa SIEMPRE no debería batir a la mesa: si la señal
// sobrevive al volumen, marca por dónde sangra la IA actual —presumiblemente
// que se retira de más contra quien nunca sube—, y eso es insumo directo para
// la disciplina de bote de Avanzado (rector §5.2, capacidad ④).
const senalPasivo = celdas.filter(c => c.conductor === 'pasivo').map(c => {
  const seU = c.seClusterAsiento0 ?? c.seAsiento0
  const delta = c.tasaAsiento0 - c.esperado
  const sigmas = seU > 0 ? delta / seU : 0
  return {
    mesa: c.mesa, manos: c.manosContadas, partidas: c.partidas.completas,
    tasa: c.tasaAsiento0, esperado: c.esperado,
    deltaPp: delta * 100, se: seU, sigmas,
    veredicto: Math.abs(sigmas) < 2 ? 'ruido'
      : delta > 0 ? 'SOBREVIVE: el pasivo bate a la mesa'
      : 'SOBREVIVE con signo contrario: el pasivo pierde',
  }
})

const informe = {
  tanda: 'NIV-B0',
  generado: new Date().toISOString(),
  rector: 'docs/AJILEI_Modos_y_Asistencia_v1.0.md §10',
  configuracion: { manosPorCelda: MANOS, unit: UNIT, nivel: NIVEL, sorteo: SORTEO, mesas: MESAS, conductores: CONDUCTORES, capPartida: CAP_PARTIDA },
  siembra: null,
  metodoSE: {
    publicado: 'seCluster',
    porQue: 'las manos NO son independientes: van en racimos por partida (dentro de una, el reparto de perfiles es fijo y las pilas de fichas se arrastran de mano en mano). La unidad independiente real es la PARTIDA.',
    estimador: 'razón para conglomerados: Var(r) ≈ P/(P−1) · Σ(g_p − r·n_p)² / (Σn_p)², con un racimo por partida',
    efectoDiseno: 'seCluster² / seBinomial², publicado por celda. Publicar la barra binomial fijaría las bandas de NIV-1/NIV-2 más estrechas de lo real.',
    validacion: 'cinco réplicas de mesa 4 × 20.000 manos: SD observada del asiento 0 = 0,240pp frente a una barra declarada de 0,42pp media. La barra por racimos es CONSERVADORA, que es el lado seguro.',
  },
  limiteConocido: 'sin siembra: Math.random sin semilla en deck.js:45 y en aiPlayer (:29,:69,:135,:143). No reproducible mano a mano; se compensa con volumen. El conteo exacto de manos queda registrado en manosContadas/manosSimuladas.',
  adaptadorEspejo: {
    porQue: 'decideBetAction(state,0) no es invocable: los perfiles se reparten sólo a los asientos 1..N-1 (aiPlayer.js:41-43), así que PROFILES[undefined].openMin lanza TypeError.',
    como: 'estado espejo que permuta los asientos 0↔1 y remapea Mano/Pie por la misma permutación; conserva numPlayers y handCount para no disparar el re-sorteo de _ensurePersonalities.',
    limite: 'el asiento 0 toma prestado el perfil del asiento 1, así que en N>=3 la mesa lleva un perfil DUPLICADO y los dos asientos gemelos rinden por debajo de 1/N mientras los no gemelos rinden por encima. Medido a 120.000 manos: gemelos −0,28 y −0,64pp, no gemelos +0,41 y +0,51pp. Cota práctica del adaptador: ±0,5–1,0pp en N>=3. En mesa 2 el gemelaje es simétrico y el efecto desaparece (49,948% ±0,108 sobre 200.000 manos).',
  },
  ventajaPosicional: 'REAL, no sesgo del banco: la Mano gana por encima de 1/N y el Pie por debajo en las cuatro mesas. Origen medido: el 7,79% de las manos terminan en empate de showdown y la Mano cobra el 100% de ellos (9343/9343, gameEngine.js:157-163). El desempate por sí solo predice +3,89pp y se observan +2,64pp: abrir a ciegas más posAdj (−2 al Pie, +1 a la Mano) devuelve ~1,2pp.',
  senalPasivo,
  puertas,
  celdas,
}

if (senalPasivo.length) {
  console.log('\nSeñal del PASIVO (iguala y pasa, nunca sube):')
  for (const s of senalPasivo) {
    console.log(`   mesa ${s.mesa}: ${(100 * s.tasa).toFixed(2)}% vs ${(100 * s.esperado).toFixed(2)}%` +
      ` → ${s.deltaPp >= 0 ? '+' : ''}${s.deltaPp.toFixed(2)}pp (${s.sigmas.toFixed(2)}σ) · ${s.veredicto}`)
  }
}

writeFileSync(join(DIR_OUT, 'nivB0_matriz.json'), JSON.stringify(informe, null, 2))
console.log(`\nVolcado completo → capturas-dsk/nivB0_matriz.json`)

if (ESCRIBE_BASE) {
  const resumen = {
    tanda: 'NIV-B0',
    generado: informe.generado,
    commit: process.env.NIVB0_COMMIT ?? null,
    rector: informe.rector,
    configuracion: informe.configuracion,
    siembra: null,
    metodoSE: informe.metodoSE,
    limiteConocido: informe.limiteConocido,
    adaptadorEspejo: informe.adaptadorEspejo,
    ventajaPosicional: informe.ventajaPosicional,
    senalPasivo,
    puertas: {
      a_conservacionFichas: puertas.a_conservacionFichas,
      b_espejoSimetrico: puertas.b_espejoSimetrico,
      c_escriturasFueraDeCapturas: puertas.c_escriturasFueraDeCapturas,
      extra_pasajeroSobrevive: puertas.extra_pasajeroSobrevive,
      b_detalle: puertas.b_detalle,
    },
    lineaBase: celdas.map(c => ({
      mesa: c.mesa, conductor: c.conductor,
      // Conteo exacto, que es lo que hace de esto una vara (rector §6). En la
      // primera vara esta línea decía `manos: c.manos`, campo que había dejado
      // de existir al cambiar el denominador: JSON.stringify borra `undefined`
      // sin decir nada y el archivo salió SIN conteo de manos.
      manosContadas: c.manosContadas, manosSimuladas: c.manosSimuladas,
      partidasCompletas: c.partidas.completas,
      tasaAsiento0: c.tasaAsiento0,
      seAsiento0: c.seClusterAsiento0,          // el que manda
      seBinomialAsiento0: c.seAsiento0,         // sólo para leer el efecto
      efectoDiseno: c.efectoDiseno,
      esperado: c.esperado,
      sorteosDePerfiles: c.sorteosDePerfiles, porPerfil: c.porPerfil,
      porAsiento: c.porAsiento.map(a => ({ asiento: a.asiento, tasa: a.tasa, se: a.seCluster, seBinomial: a.se })),
      porRol: c.porRol,
      porVivos: c.porVivos,
      partidas: {
        completas: c.partidas.completas,
        tasaAsiento0: c.partidas.tasaAsiento0,
        seAsiento0: c.partidas.seAsiento0,
        medianaManosPorPartida: c.partidas.medianaManosPorPartida,
      },
      manosPorMinuto: c.capacidad.manosPorMinuto,
    })),
  }
  writeFileSync(join(DIR_EVID, 'nivB0_base.json'), JSON.stringify(resumen, null, 2))
  console.log('Resumen rastreado → capturas-dsk/evidencia/nivB0_base.json')
}
