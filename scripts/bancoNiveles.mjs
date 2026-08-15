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
//   --j0-nivel <nivel>          nivel del cerebro del asiento 0 bajo `espejo`
//                               (default: el de la mesa). Distinto = DUELO.
//   --duelo <nivel>             añade una celda espejo EXTRA por mesa con el
//                               asiento 0 a ese nivel, sin quitar la simétrica
//   --repuertas <ruta>          recalcula los veredictos de un JSON ya escrito
//                               (umbral por familia en b3) SIN volver a jugar
//   --curvas [--muestras n]     mide las curvas de fuerza de la capacidad ④ y
//                               sale; no juega la matriz
//   --base                      además del volcado, reescribe el resumen rastreado
//   --evid <archivo>            nombre del resumen rastreado (default nivB0_base.json)
//   --tanda <nombre>            etiqueta de la corrida (default NIV-B0)
//   --volcado <archivo>         nombre del volcado completo
//
// Salidas (§6): volcado completo a capturas-dsk/ (ignorada, regenerable) y
// —sólo con --base— el resumen a capturas-dsk/evidencia/<--evid>, que SÍ se
// rastrea: es la vara contra un commit exacto, misma doctrina que
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
const { decideBetAction, decideDiscard, getPersonalityName, initPersonalities, _resetForTesting, _DIAG_PRO } =
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
// NIV-1 §7 · nivel del CEREBRO que conduce el asiento 0 bajo `espejo`. Por
// defecto es el mismo de la mesa (espejo simétrico, que es lo que valida el
// banco). Distinto = DUELO: misma cabeza, mismo temperamento prestado por el
// adaptador, sólo cambia el nivel. Es puro porque `decideBetAction` es función
// pura del estado, y el estado espejo es nuestro.
const J0_NIVEL    = arg('j0-nivel', NIVEL)
// `--duelo <nivel>` añade, a lo pedido, una celda espejo EXTRA por mesa con el
// asiento 0 a ese nivel. Así una sola corrida produce a la vez el espejo
// simétrico (que valida el banco) y el duelo entre niveles (puertas 2 y 3),
// contra la misma baraja y en el mismo archivo de evidencia.
// Acepta LISTA separada por comas (`--duelo avanzado,basico`): NIV-2 necesita
// los dos peldaños de la escalera contra la MISMA mesa Pro y en la misma corrida.
const DUELO       = (arg('duelo') ?? '').split(',').map(s => s.trim()).filter(Boolean)
// Nivel VIGENTE del cerebro del asiento 0. Lo fija `correrCelda` al empezar cada
// celda: es la única pieza mutable del banco y no cruza celdas.
let J0_ACTUAL = J0_NIVEL
const ESCRIBE_BASE = flag('base')
const ARCHIVO_EVID = arg('evid', 'nivB0_base.json')
const TANDA        = arg('tanda', 'NIV-B0')
// NIV-2 §7 · archivo de REFERENCIA con la cifra de Básico contra mesa Avanzada
// en la métrica de fichas. No existe en ninguna vara —la métrica nace en esta
// tanda—, así que se mide aparte, en cuatro celdas de referencia, y se lee aquí.
// No es re-lanzar la matriz de Avanzado (§8): es medir una magnitud nueva.
const ARCHIVO_REF  = arg('ref', 'niv2_ref_avanzado.json')
// El volcado lleva el nombre de su tanda: dos tandas distintas no se pisan el
// archivo. `capturas-dsk/` está ignorada y es regenerable; lo que se rastrea es
// el resumen de `evidencia/`.
const ARCHIVO_VOLCADO = arg('volcado',
  TANDA === 'NIV-B0' ? 'nivB0_matriz.json' : `${TANDA.replace(/[^A-Za-z0-9]/g, '')}_matriz.json`)

// ── Por qué el banco re-reparte los perfiles en cada partida ─────────────────
// MEDIDO, no supuesto: hasta NIV-1, el re-sorteo por "sesión nueva" de
// `aiPlayer.js` EXIGÍA `state.handCount === 0` en el momento de una decisión, y
// eso no ocurre jamás jugando — `startHand` deja el contador en 1 antes de la
// primera apuesta, así que la rama sólo se alcanzaba con un estado sintético.
// Consecuencia: sin intervención, TODAS las manos de una celda —y de la app
// entera, mesa tras mesa— corrían sobre un ÚNICO reparto de perfiles. La celda
// medía entonces "el asiento 0 contra este reparto concreto", no la línea base:
// dos corridas de 3000 manos dieron 25,17% y 17,20% por ese solo motivo.
//
// El banco lo corrigió por la API pública —`initPersonalities`, exportada y
// declarada "also called directly by tests"— re-repartiendo al empezar cada
// partida. Esa medición fue el insumo del rider de NIV-1 §4: la rama YA ESTÁ
// REPARADA en `aiPlayer.js`, que ahora detecta el límite de partida por el
// retroceso de `handCount` y la subida de `aliveCount`.
//
// El `initPersonalities` explícito de abajo se conserva a propósito: mantiene el
// muestreo IDÉNTICO al de la vara NIV-B0, que se midió contra el motor sin
// reparar. Hoy es redundante (el rider dispararía igual) y por eso es inocuo.
// AVISO sobre `--sorteo celda`: ya NO reproduce el comportamiento de la app —la
// app re-reparte por partida desde NIV-1—; sólo desactiva el sorteo del banco.

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
  // El nivel del asiento 0 viaja en SU estado espejo, no en el de la mesa: así
  // el duelo enfrenta dos niveles sin que ninguno contamine al otro.
  return decideBetAction({ ...estadoEspejo(s), nivelIA: J0_ACTUAL }, 1).action
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
  // Bajo `espejo` el descarte del asiento 0 también corre con SU nivel: en el
  // duelo, la estrategia de comodín es parte de lo que se está midiendo.
  if (modo === 'espejo') return decideDiscard({ ...s, nivelIA: J0_ACTUAL }, 0)
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
// `cond` (opcional) acumula la CONDUCTA observada desde fuera: retiros y subidas
// por asiento. No mira dentro de `aiPlayer` —compara el estado antes y después
// de cada acción—, así que sirve igual para los tres conductores y para los tres
// niveles. Es el insumo que NIV-2 §7 pide para explicar POR QUÉ un nivel gana
// más manos: en este juego casi todo se decide en el showdown, luego quien menos
// se retira (con razón) es quien más manos gana.
function jugarRonda(s, fase, modo, cond) {
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
    const apuestaAntes = s.currentBet
    s = asiento === 0
      ? applyPlayerBetAction(s, APUESTA[modo](s), s.unit)
      : applyAIBetAction(s)
    if (cond) {
      cond.acciones[asiento]++
      if (s.players[asiento].folded) cond.retiros[asiento]++
      else if (s.currentBet > apuestaAntes) cond.subidas[asiento]++
    }
  }
  return s
}

function jugarMano(s, modo, cond) {
  s = advanceFromDeal(s)                            // DEAL_2 → BET_1
  s = jugarRonda(s, PHASES.BET_1, modo, cond)
  if (s.phase === PHASES.PAYOUT) return s
  s = advanceFromDeal(s)                            // DEAL_3 → BET_2
  s = jugarRonda(s, PHASES.BET_2, modo, cond)
  if (s.phase === PHASES.PAYOUT) return s
  s = applyDiscard(s, s.players[0].folded ? [] : descarte(modo, s))
  return jugarRonda(s, PHASES.BET_3, modo, cond)    // → SHOWDOWN → PAYOUT
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
function correrCelda(N, modo, j0nivel = J0_NIVEL) {
  _resetForTesting()   // reparto de perfiles fresco por celda: aislamiento (borra
                       // también los contadores de Pro: cada celda cuenta lo suyo)
  J0_ACTUAL = j0nivel

  const acc = {
    manos: 0,          // simuladas (todas)
    manosLlenas: 0,    // contadas (mesa completa) ← denominador primario
    partidas: 0, partidasCompletas: 0, sorteos: 0,
    ganadasPorAsiento: new Array(N).fill(0),   // sólo manos de mesa llena
    // ── FICHAS NETAS · la métrica de fuerza (NIV-2) ─────────────────────────
    // Suma del saldo de fichas de cada asiento sobre las manos CONTADAS. Ver el
    // bloque de doctrina en `evaluarPuertas`: manos-ganadas y partidas-ganadas
    // premian los dos extremos opuestos del eje pagar/retirar, y ninguna de las
    // dos mide fuerza. Las fichas sí: el ante es forzado (`gameEngine.js:409`),
    // así que retirarse cuesta y pagar de más también.
    fichasPorAsiento:  new Array(N).fill(0),
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
    // Conducta observada desde fuera (NIV-2 §7, diagnóstico).
    conducta: {
      acciones: new Array(N).fill(0),
      retiros:  new Array(N).fill(0),
      subidas:  new Array(N).fill(0),
    },
    // Diagnóstico de Pro. `porAbandono` cuenta las manos que se cobraron sin
    // showdown; `farolCobra` las que además las ganó un asiento que había
    // faroleado en esa mano — el dato que la calibración necesitará.
    pro: { porAbandono: 0, farolCobra: 0, farolAlShowdown: 0 },
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

    // `perfil01` sella qué temperamento compartieron los asientos 0 y 1 en esta
    // partida: es lo que permite abrir el duelo por perfil sin re-simular.
    const racimo = { n: 0, g: new Array(N).fill(0), f: new Array(N).fill(0), perfil01: null }
    acc.racimos.push(racimo)

    if (SORTEO === 'partida') { initPersonalities(N); acc.sorteos++ }
    // Reparto vigente en ESTA partida. Bajo `espejo` el asiento 0 juega con el
    // perfil del 1 (adaptador), así que se etiqueta con él.
    const perfilDe = Array.from({ length: N }, (_, i) => getPersonalityName(i === 0 ? 1 : i))
    racimo.perfil01 = perfilDe[0]

    for (;;) {
      // El corte se toma ANTES de `startHand` a propósito: ahí es donde el motor
      // cobra el ante (`gameEngine.js:409`), y el ante es justamente lo que hace
      // que retirarse cueste. Medido después, cada asiento salía con un +1u
      // fantasma por mano y la métrica dejaba de sumar cero.
      const fichasAntes = s.players.map(p => p.chips)
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

      // El sello de faroles es POR MANO: se borra antes de jugarla y se lee
      // después, así que ningún farol de la mano anterior se cuela.
      for (const k of Object.keys(_DIAG_PRO.farolPorAsiento)) delete _DIAG_PRO.farolPorAsiento[k]

      s = jugarMano(s, modo, acc.conducta)
      acc.manos++; manosPartida++

      const enPie = s.players.filter(p => !p.folded).length
      if (enPie === 1) acc.pro.porAbandono++
      if (s.winner !== null && s.winner >= 0 && _DIAG_PRO.farolPorAsiento[s.winner] === true) {
        if (enPie === 1) acc.pro.farolCobra++
        else acc.pro.farolAlShowdown++
      }

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
        for (let i = 0; i < N; i++) {
          const d = s.players[i].chips - fichasAntes[i]
          acc.fichasPorAsiento[i] += d
          racimo.f[i] += d
        }
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

  // ── Duelo pareado asiento0 vs asiento1 (NIV-1 §7, puertas 2 y 3) ───────────
  // Los dos asientos comparten temperamento POR CONSTRUCCIÓN del adaptador
  // espejo; con `--j0-nivel` distinto de `--nivel`, lo ÚNICO que los separa es
  // el nivel. La σ de la diferencia se estima por racimos sobre la propia
  // diferencia (no sumando dos σ independientes: las dos tasas salen de las
  // MISMAS manos y están negativamente correlacionadas, así que sumarlas
  // inflaría la barra y regalaría verdes).
  // `campo` selecciona la magnitud pareada: 'g' = manos ganadas, 'f' = fichas
  // netas. La aritmética es la misma; lo que cambia es qué se está midiendo.
  const seDifPorRacimo = (racimos, campo = 'g') => {
    const rac = racimos.filter(r => r.n > 0)
    const P = rac.length
    if (P < 2) return null
    const total = rac.reduce((a, r) => a + r.n, 0)
    if (total === 0) return null
    const d = rac.reduce((a, r) => a + r[campo][0] - r[campo][1], 0) / total
    const s2 = rac.reduce((a, r) => a + ((r[campo][0] - r[campo][1]) - d * r.n) ** 2, 0)
    return { delta: d, se: Math.sqrt((P / (P - 1)) * s2) / total, manos: total, partidas: P }
  }
  const perfilesVistos = [...new Set(acc.racimos.map(r => r.perfil01).filter(Boolean))]
  const duelo       = { global: seDifPorRacimo(acc.racimos, 'g'), porPerfil: {} }
  const dueloFichas = { global: seDifPorRacimo(acc.racimos, 'f'), porPerfil: {} }
  for (const perfil of perfilesVistos) {
    const suyos = acc.racimos.filter(r => r.perfil01 === perfil)
    duelo.porPerfil[perfil]       = seDifPorRacimo(suyos, 'g')
    dueloFichas.porPerfil[perfil] = seDifPorRacimo(suyos, 'f')
  }
  for (const d of [duelo.global, ...Object.values(duelo.porPerfil),
                   dueloFichas.global, ...Object.values(dueloFichas.porPerfil)]) {
    if (d) d.sigmas = d.se > 0 ? d.delta / d.se : 0
  }

  // Fichas netas por mano de cada asiento, con la misma barra por racimos.
  const fichasCluster = (asiento) => {
    const rac = acc.racimos.filter(r => r.n > 0)
    const P = rac.length
    if (P < 2) return null
    const total = rac.reduce((a, r) => a + r.n, 0)
    const media = rac.reduce((a, r) => a + r.f[asiento], 0) / total
    const s2 = rac.reduce((a, r) => a + (r.f[asiento] - media * r.n) ** 2, 0)
    return { porMano: media, se: Math.sqrt((P / (P - 1)) * s2) / total }
  }
  const tabla = (o) => Object.fromEntries(Object.entries(o).map(([k, v]) => {
    const p = tasa(v.g, v.j)
    return [k, { jugadas: v.j, ganadas: v.g, tasa: p, se: se(p, v.j) }]
  }))

  return {
    mesa: N, conductor: modo,
    manosContadas: acc.manosLlenas, manosSimuladas: acc.manos,
    unit: UNIT, nivel: NIVEL, nivelAsiento0: j0nivel,
    sorteo: SORTEO, sorteosDePerfiles: acc.sorteos,
    duelo: modo === 'espejo' ? duelo : null,
    dueloFichas: modo === 'espejo' ? dueloFichas : null,
    fichas: acc.fichasPorAsiento.map((total, i) => ({
      asiento: i, total, ...(fichasCluster(i) ?? { porMano: 0, se: null }),
    })),
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
    // ── Diagnóstico de conducta (NIV-2 §7) — se reporta, no es puerta ────────
    conducta: acc.conducta.acciones.map((n, i) => ({
      asiento: i, acciones: n,
      tasaRetiro: n > 0 ? acc.conducta.retiros[i] / n : 0,
      tasaSubida: n > 0 ? acc.conducta.subidas[i] / n : 0,
    })),
    diagPro: {
      // Frecuencias efectivas de las ramas de Pro, leídas del contador del
      // módulo. Cuenta TODAS las decisiones de asientos con cerebro Pro de esta
      // celda — mesa y, bajo espejo, también el asiento 0 si su nivel es Pro.
      decisiones: _DIAG_PRO.decisiones,
      conLectura: _DIAG_PRO.conLectura,
      tasaLectura: _DIAG_PRO.decisiones > 0 ? _DIAG_PRO.conLectura / _DIAG_PRO.decisiones : 0,
      farolRespaldado: _DIAG_PRO.farolRespaldado,
      faroles: _DIAG_PRO.faroles,
      farolAbre: _DIAG_PRO.farolAbre,
      farolSube: _DIAG_PRO.farolSube,
      farolesPorMano: acc.manos > 0 ? _DIAG_PRO.faroles / acc.manos : 0,
      farolCobraSinShowdown: acc.pro.farolCobra,
      farolLlegaAShowdown: acc.pro.farolAlShowdown,
      ajileis: _DIAG_PRO.ajileis,
      disimulos: _DIAG_PRO.disimulos,
      tasaDisimulo: _DIAG_PRO.ajileis > 0 ? _DIAG_PRO.disimulos / _DIAG_PRO.ajileis : 0,
      manosPorAbandono: acc.pro.porAbandono,
      tasaAbandono: acc.manos > 0 ? acc.pro.porAbandono / acc.manos : 0,
    },
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

  // ── RIDER NIV-2 §5 · b2 pasa a umbral por familia ───────────────────────
  // Deuda declarada de B0.c: b2 también es una FAMILIA —una prueba por mesa, m=4
  // en la matriz completa—, y hasta ahora se leía contra 3σ pelados mientras b3 y
  // las cuatro puertas de nivel ya usaban Bonferroni. Se corrige por DOCTRINA, no
  // para rescatar un veredicto: con los datos vigentes el máximo de b2 es 1,54σ,
  // así que pasa con o sin corrección. Un banco que aplicara el umbral por
  // familia sólo donde le conviene no sería un banco.
  const m2          = detalles.length
  const alfaB2      = m2 > 0 ? alfaFamilia / m2 : alfaFamilia
  const umbralB2    = m2 > 0 ? umbralDeAlfa(alfaB2) : 3
  for (const d of detalles) {
    if (!d.b2_pareadoGemelos) continue
    d.b2_umbralSigmas = umbralB2
    d.b2_pasa = d.b2_pareadoGemelos.sigmas <= umbralB2
  }
  const b2 = detalles.map(d => d.b2_pareadoGemelos?.sigmas ?? 0)

  return {
    b2_metodo: {
      correccion: 'Bonferroni',
      familia: 'la comparación pareada gemelo-vs-gemelo (asientos 0 y 1) del conductor espejo simétrico, una por mesa',
      tamanoFamilia: m2,
      alfaFamilia,
      alfaPorPrueba: alfaB2,
      umbralSigmas: umbralB2,
      umbralSinCorregir: 3,
      maxSigmasObservado: b2.length ? Math.max(...b2) : null,
      porQue: 'rider NIV-2 §5 (deuda declarada en B0.c): b2 es una familia de una prueba por mesa y se leía contra 3σ pelados mientras b3 y las puertas de nivel ya usaban Bonferroni. Es doctrina, no rescate — con los datos vigentes b2 pasa con o sin corrección.',
      degeneracion: 'con m=1 el umbral vuelve a ser exactamente 3σ',
    },
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
    b2_nota: `b2 (gemelo vs gemelo) es otra familia de ${b2.length} pruebas, máx ${(b2.length ? Math.max(...b2) : 0).toFixed(2)}σ. Desde el rider NIV-2 §5 lleva su propio umbral por familia (${umbralB2.toFixed(3)}σ) en vez de 3σ pelados.`,
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
  // Sólo el espejo SIMÉTRICO valida el banco. Una celda de duelo tiene los
  // gemelos a niveles distintos a propósito, así que b2 ahí no mide simetría:
  // mide el efecto que la tanda quiere. Mezclarlas pintaría de rojo el
  // instrumento por hacer justo lo que se le pidió.
  const espejo = celdas.filter(c => c.conductor === 'espejo' && c.nivelAsiento0 === c.nivel)
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
      // b2_pasa lo fija `aplicarUmbralFamiliaB3` con el umbral por familia del
      // rider NIV-2 §5. Aquí queda el valor sin corregir por si el archivo se
      // lee antes de esa pasada.
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

// ── Modo --curvas · instrumento de medida de las curvas de fuerza (NIV-1) ────
//
// Produce las tablas de equidad que la capacidad ④ (disciplina de bote) usa en
// `aiPlayer.js`. Se añade AQUÍ y no en un script aparte porque es exactamente lo
// que este archivo es: el instrumento de medida de la fase.
//
// Qué mide: P(mi mano gane el showdown contra k rivales | puntaje en la fase),
// con la dinámica real —reparto 2+3, descarte de todo lo que no sea del mejor
// palo hasta el tope, reposición del taco—.
//
// POR QUÉ SE MIDE POR k Y NO SE ELEVA UNA CURVA A LA k. La tentación es medir
// P(batir a UN rival) y elevarla a k por independencia. Es falso en las fases
// intermedias, y no por poco: con la mano aún abierta, esa probabilidad es un
// PROMEDIO sobre los desenlaces posibles de mi propia mano, y E[q]^k ≠ E[q^k]
// (Jensen). Medido: a 2 cartas, puntaje 21 contra 4 rivales da 0,339 real
// frente a 0,186 por la vía del promedio elevado — un 45% de subestimación, que
// haría a la IA retirarse de manos que pagan. En BET_3 la mano ya es definitiva:
// ahí q está condicionada al desenlace, la independencia entre rivales SÍ vale, y
// `aiPlayer` usa la curva exacta enumerada con q^k en vez de tabla.
//
// El tope de descarte se toma de la mesa que corresponde a cada k (5 para mesas
// 2-4, 3 para mesa 5), así que cada columna se mide en su propio terreno.
//
// Uso: node scripts/bancoNiveles.mjs --curvas [--muestras 4000000]
if (flag('curvas')) {
  const { PALOS, VALORES, getCardPoints } = await import('../src/engine/deck.js')
  const MUESTRAS = Number(arg('muestras', 4000000))
  const baraja = []
  for (const p of PALOS) for (const v of VALORES) baraja.push({ palo: p, points: getCardPoints(v) })

  const mejorPalo = (cartas) => {
    const s = {}
    for (const c of cartas) s[c.palo] = (s[c.palo] ?? 0) + c.points
    let pts = 0, palo = ''
    for (const k in s) if (s[k] > pts) { pts = s[k]; palo = k }
    return { pts, palo }
  }

  // Una pasada por cada k: el tope de descarte es el de SU mesa.
  const columnas = { BET_1: {}, BET_2: {} }
  for (let k = 1; k <= 4; k++) {
    const tope = maxDiscardDeMesa(k + 1)
    const acc = { BET_1: new Map(), BET_2: new Map() }
    const bolsa = baraja.slice()
    const reparto = (k + 1) * 5 + tope * (k + 1)
    for (let m = 0; m < MUESTRAS; m++) {
      for (let i = 0; i < reparto; i++) {
        const j = i + Math.floor(Math.random() * (bolsa.length - i))
        const t = bolsa[i]; bolsa[i] = bolsa[j]; bolsa[j] = t
      }
      let ptr = 0
      const manos = []
      for (let p = 0; p <= k; p++) manos.push([bolsa[ptr++], bolsa[ptr++]])
      const s2 = mejorPalo(manos[0]).pts
      for (let r = 0; r < 3; r++) for (let p = 0; p <= k; p++) manos[p].push(bolsa[ptr++])
      const s5 = mejorPalo(manos[0]).pts
      const finales = manos.map((mano) => {
        const bp = mejorPalo(mano).palo
        const fuera = []
        mano.forEach((c, i) => { if (c.palo !== bp) fuera.push(i) })
        const idx = fuera.slice(0, tope)
        return mejorPalo(mano.map((c, i) => (idx.includes(i) ? bolsa[ptr++] : c))).pts
      })
      const mio = finales[0]
      let mayores = 0, iguales = 0
      for (let i = 1; i <= k; i++) { if (finales[i] > mio) mayores++; else if (finales[i] === mio) iguales++ }
      const g = mayores > 0 ? 0 : 1 / (1 + iguales)
      for (const [fase, s] of [['BET_1', s2], ['BET_2', s5]]) {
        const e = acc[fase].get(s) ?? (acc[fase].set(s, { n: 0, g: 0 }), acc[fase].get(s))
        e.n++; e.g += g
      }
    }
    for (const fase of ['BET_1', 'BET_2']) columnas[fase][k] = acc[fase]
  }

  // Serialización: array por k, indexado por puntaje desde `desde`, con
  // arrastre del último valor con muestra suficiente para tapar los huecos del
  // soporte (no todo entero es un puntaje posible).
  const serializa = (fase, desde, hasta) => {
    const filas = []
    for (let k = 1; k <= 4; k++) {
      const acc = columnas[fase][k]
      const fila = []
      let ultimo = 0
      for (let s = desde; s <= hasta; s++) {
        const e = acc.get(s)
        if (e && e.n >= 500) ultimo = e.g / e.n
        fila.push(Math.round(ultimo * 1000) / 1000)
      }
      filas.push(fila)
    }
    return filas
  }
  const tablas = {
    generado: new Date().toISOString(),
    muestrasPorK: MUESTRAS,
    nota: 'baraja SIN comodín: la asimetría del comodín la cobra la capacidad ③ sobre el puntaje, no estas curvas',
    BET_1: { desde: 6,  hasta: 21, k: serializa('BET_1', 6, 21) },
    BET_2: { desde: 13, hasta: 41, k: serializa('BET_2', 13, 41) },
  }
  mkdirSync(DIR_OUT, { recursive: true })
  writeFileSync(join(DIR_OUT, 'niv1_curvas.json'), JSON.stringify(tablas, null, 2) + '\n')
  for (const fase of ['BET_1', 'BET_2']) {
    console.log(`\n${fase} · desde ${tablas[fase].desde}`)
    tablas[fase].k.forEach((fila, i) => console.log(`  k=${i + 1}: [${fila.join(', ')}]`))
  }
  console.log('\nVolcado → capturas-dsk/niv1_curvas.json')
  process.exit(0)
}

// ── Modo --curvas-descarte · el instrumento de ② (NIV-2) ─────────────────────
//
// Mide la MISMA magnitud que CURVA_FINAL —P(una mano rival quede por debajo de
// mi puntaje, contando medio empate)— pero CONDICIONADA a cuántas cartas cambió
// esa mano. Es la traducción del dato público «cambió cuatro» a la única moneda
// con la que `aiPlayer` sabe decidir: equidad.
//
// POR QUÉ NO SE PUEDE ENUMERAR. La curva de NIV-1 se enumeró exacta porque la
// mano definitiva de un rival ciego es una combinación de C(40,5). Aquí la mano
// pasa por una POLÍTICA (quedarse con el mejor palo, cambiar el resto hasta el
// tope) y por una reposición desde las 35 restantes: el espacio es
// C(40,5)·C(35,d) y d llega a 5. Monte Carlo con volumen es la vía honesta.
//
// LO QUE LA CURVA ENSEÑA, y que es la razón de ser de la capacidad: d=0 no es
// «no quiso cambiar», es «no TENÍA qué cambiar» — las cinco cartas del mismo
// palo—, y d alto es una mano que se quedó con uno o dos aciertos. El rango que
// separa un d de otro es de decenas de puntos, muchísimo más ancho que la
// amenaza del comodín que ③ ya cobra.
//
// DOS REGÍMENES, no cuatro mesas: lo único que cambia la política entre mesas es
// el TOPE de descarte (5 en mesas 2-4, 3 en mesa 5, `gameEngine.js:23`). El
// comodín NO entra aquí, exactamente por la misma razón declarada en --curvas:
// su asimetría la cobra ③ sobre el puntaje, y mezclarla aquí haría inauditable
// cuál de las dos capacidades movió una decisión.
//
// Se emite además la fila `marginal` (la mezcla sobre d) para el camino de
// respaldo: un rival del que no hay lectura. Ojo con el contraste, que es un
// hallazgo de esta medición: la marginal NO es CURVA_FINAL. CURVA_FINAL describe
// una mano al azar; la marginal describe una mano YA DESCARTADA, que es más
// fuerte. Avanzado usa la primera y ese es su límite declarado; Pro, que sabe
// que la ronda de descarte ocurrió, usa la segunda.
//
// Uso: node scripts/bancoNiveles.mjs --curvas-descarte [--muestras 20000000]
if (flag('curvas-descarte')) {
  const { PALOS, VALORES, getCardPoints } = await import('../src/engine/deck.js')
  const MUESTRAS = Number(arg('muestras', 20000000))
  const DESDE = 13, HASTA = 51            // mismo soporte que CURVA_FINAL
  const ANCHO = HASTA - DESDE + 1

  const baraja = []
  for (const p of PALOS) for (const v of VALORES) baraja.push({ palo: p, points: getCardPoints(v) })

  const mejorPalo = (cartas) => {
    const s = {}
    for (const c of cartas) s[c.palo] = (s[c.palo] ?? 0) + c.points
    let pts = 0, palo = ''
    for (const k in s) if (s[k] > pts) { pts = s[k]; palo = k }
    return { pts, palo }
  }

  const regimenes = {}
  for (const tope of [5, 3]) {
    // Histograma de puntaje final por número de cartas cambiadas.
    const hist = Array.from({ length: tope + 1 }, () => new Float64Array(ANCHO))
    const bolsa = baraja.slice()
    const reparto = 5 + tope
    for (let m = 0; m < MUESTRAS; m++) {
      for (let i = 0; i < reparto; i++) {
        const j = i + Math.floor(Math.random() * (bolsa.length - i))
        const t = bolsa[i]; bolsa[i] = bolsa[j]; bolsa[j] = t
      }
      const mano = [bolsa[0], bolsa[1], bolsa[2], bolsa[3], bolsa[4]]
      const bp = mejorPalo(mano).palo
      const fuera = []
      for (let i = 0; i < 5; i++) if (mano[i].palo !== bp) fuera.push(i)
      const d = Math.min(fuera.length, tope)
      let ptr = 5
      for (let i = 0; i < d; i++) mano[fuera[i]] = bolsa[ptr++]
      hist[d][mejorPalo(mano).pts - DESDE]++
    }
    const total = hist.map(h => h.reduce((a, x) => a + x, 0))
    const granTotal = total.reduce((a, x) => a + x, 0)

    // q[s] = P(X < s) + ½·P(X = s) — misma convención que CURVA_FINAL: el
    // desempate real es por orden de asiento desde la Mano, que desde un asiento
    // cualquiera vale ½.
    const cdf = (h, n) => {
      const fila = []
      let acum = 0
      for (let i = 0; i < ANCHO; i++) {
        fila.push(n > 0 ? Math.round(((acum + 0.5 * h[i]) / n) * 1000) / 1000 : 0)
        acum += h[i]
      }
      return fila
    }
    const marginal = new Float64Array(ANCHO)
    for (const h of hist) for (let i = 0; i < ANCHO; i++) marginal[i] += h[i]

    regimenes[`tope${tope}`] = {
      tope,
      frecuenciaDeD: total.map(n => Math.round((n / granTotal) * 100000) / 100000),
      muestrasPorD: total,
      d: hist.map((h, i) => cdf(h, total[i])),
      marginal: cdf(marginal, granTotal),
    }
  }

  const salida = {
    generado: new Date().toISOString(),
    muestrasPorRegimen: MUESTRAS,
    desde: DESDE, hasta: HASTA,
    nota: 'baraja SIN comodín (la asimetría la cobra ③) · q[s] = P(X<s) + ½P(X=s) · política de descarte = la de aiPlayer (todo lo que no sea del mejor palo, hasta el tope)',
    regimenes,
  }
  mkdirSync(DIR_OUT, { recursive: true })
  writeFileSync(join(DIR_OUT, 'niv2_curvas_descarte.json'), JSON.stringify(salida, null, 2) + '\n')
  for (const [nombre, r] of Object.entries(regimenes)) {
    console.log(`\n${nombre} · desde ${DESDE}`)
    r.d.forEach((fila, d) => console.log(
      `  d=${d} (${(100 * r.frecuenciaDeD[d]).toFixed(2)}% de las manos, n=${r.muestrasPorD[d]}): [${fila.join(', ')}]`))
    console.log(`  marginal: [${r.marginal.join(', ')}]`)
  }
  console.log('\nVolcado → capturas-dsk/niv2_curvas_descarte.json')
  process.exit(0)
}

// Tope de descarte por tamaño de mesa — copia local declarada: `maxDiscard` vive
// en gameEngine.js, que es archivo protegido y no se importa por una constante.
function maxDiscardDeMesa(n) { return n <= 4 ? 5 : 3 }

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

console.log(`Banco ${TANDA} · mesas=[${MESAS}] conductores=[${CONDUCTORES}] manos/celda=${MANOS} unit=${UNIT} nivel=${NIVEL}` +
  (J0_NIVEL !== NIVEL ? ` j0-nivel=${J0_NIVEL}` : '') + (DUELO.length ? ` +duelo=${DUELO.join(',')}` : ''))
console.log('(sin siembra: Math.random sin semilla en baraja y en IA — límite conocido, se compensa con volumen)\n')

const celdas = []
const planCeldas = []
for (const N of MESAS) {
  for (const modo of CONDUCTORES) planCeldas.push([N, modo, J0_NIVEL])
  for (const d of DUELO) if (d !== NIVEL) planCeldas.push([N, 'espejo', d])
}
{
  for (const [N, modo, j0n] of planCeldas) {
    const r = correrCelda(N, modo, j0n)
    celdas.push(r)
    const pct = (x) => (x * 100).toFixed(2).padStart(5)
    const etiqueta = j0n === NIVEL ? modo : `${modo}:${j0n}`
    console.log(
      `mesa ${N} · ${etiqueta.padEnd(16)} → asiento0 ${pct(r.tasaAsiento0)}% ±${((r.seClusterAsiento0 ?? r.seAsiento0) * 100).toFixed(2)}` +
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

// -- Puertas direccionales de NIV-1 (§7 de la instrucción) --------------------
// Cuatro puertas, todas con UMBRAL POR FAMILIA (lección B0.c): cada puerta es un
// conjunto de comparaciones, y a 3σ por comparación una familia de m falla por
// azar con probabilidad ~m·0,0027. El alfa de familia se reparte entre sus
// pruebas por Bonferroni, igual que en b3, de modo que con m=1 el umbral
// degenere exactamente en 3σ.
//
// Sólo se evalúan las puertas para las que ESTA corrida trae datos; lo que no se
// midió se marca `null` y no se pinta de ningún color. La línea base NO se
// re-lanza: se lee de la vara rastreada (§8 de la instrucción).
function puertasNiveluno() {
  let base = null
  try { base = JSON.parse(readFileSync(join(DIR_EVID, 'nivB0_base.json'), 'utf8')) } catch { base = null }
  const deBase = (mesa, conductor) =>
    base?.lineaBase?.find(c => c.mesa === mesa && c.conductor === conductor) ?? null
  const umbralFamilia = (m) => (m > 0 ? umbralDeAlfa(P_3SIGMA / m) : 3)

  // P1 - PASIVO castigado: en N>=3 su ventaja desaparece o se invierte.
  const p1detalle = senalPasivo.filter(s => s.mesa >= 3).map(s => ({
    mesa: s.mesa, tasa: s.tasa, esperado: s.esperado, deltaPp: s.deltaPp,
    sigmas: s.sigmas, manos: s.manos,
    baseDeltaPp: base?.senalPasivo?.find(x => x.mesa === s.mesa)?.deltaPp ?? null,
  }))
  const u1 = umbralFamilia(p1detalle.length)
  for (const d of p1detalle) d.pasa = d.deltaPp <= 0 || d.sigmas < u1
  const p1 = p1detalle.length
    ? { pasa: p1detalle.every(d => d.pasa), umbralSigmas: u1, familia: p1detalle.length, detalle: p1detalle }
    : null

  // P2 - la hermana mayor domina: asiento 0 con nivel distinto al de la mesa.
  // Se publican DOS lecturas: la del enunciado (contra 1/N) y la PAREADA
  // (asiento 0 contra su gemelo de temperamento, el asiento 1), que es la que
  // de verdad aísla el nivel — el sesgo de gemelaje del adaptador (±0,5-1,0pp
  // en N>=3, medido en la vara) cae dentro de la diferencia y se cancela.
  const duelos = celdas.filter(c => c.conductor === 'espejo' && c.nivelAsiento0 !== c.nivel)
  const u2 = umbralFamilia(duelos.length)
  const p2detalle = duelos.map(c => {
    const se = c.seClusterAsiento0 ?? c.seAsiento0
    const d = c.tasaAsiento0 - c.esperado
    return {
      mesa: c.mesa, nivelMesa: c.nivel, nivelAsiento0: c.nivelAsiento0,
      tasaAsiento0: c.tasaAsiento0, esperado: c.esperado,
      deltaPp: d * 100, sigmas: se > 0 ? d / se : 0,
      pareado: c.duelo?.global ?? null,
      pasa: d < 0 && (se > 0 ? Math.abs(d / se) : 0) >= u2,
      pasaPareado: (c.duelo?.global?.delta ?? 0) < 0 && Math.abs(c.duelo?.global?.sigmas ?? 0) >= u2,
    }
  })
  const p2 = duelos.length
    ? { pasa: p2detalle.every(d => d.pasa), pasaPareado: p2detalle.every(d => d.pasaPareado),
        umbralSigmas: u2, familia: duelos.length, detalle: p2detalle }
    : null

  // P3 - por temperamento: los CUATRO perfiles con el signo correcto. La
  // comparación es pareada DENTRO de la misma partida (los asientos 0 y 1
  // comparten temperamento por construcción del adaptador), así que lo único
  // que los separa es el nivel. Prohibido que el nivel "suba" porque un solo
  // perfil cargue el promedio: se exige el signo en los cuatro.
  const p3detalle = []
  for (const c of duelos) {
    for (const [perfil, d] of Object.entries(c.duelo?.porPerfil ?? {})) {
      if (!d) continue
      p3detalle.push({ mesa: c.mesa, perfil, deltaPp: d.delta * 100, se: d.se,
                       sigmas: d.sigmas, manos: d.manos, partidas: d.partidas })
    }
  }
  const u3 = umbralFamilia(p3detalle.length)
  for (const d of p3detalle) d.pasa = d.deltaPp <= 0 || Math.abs(d.sigmas) < u3
  const p3 = p3detalle.length
    ? { pasa: p3detalle.every(d => d.pasa), umbralSigmas: u3, familia: p3detalle.length,
        perfilesCubiertos: [...new Set(p3detalle.map(d => d.perfil))].sort(), detalle: p3detalle }
    : null

  // P4 - sin regresión contra basura: el ALEATORIO sigue triturado.
  const p4detalle = celdas.filter(c => c.conductor === 'aleatorio').map(c => {
    const b = deBase(c.mesa, 'aleatorio')
    const seA = c.seClusterAsiento0 ?? c.seAsiento0
    const seB = b?.seAsiento0 ?? null
    const dif = b ? c.tasaAsiento0 - b.tasaAsiento0 : null
    const seDif = b && seB !== null ? Math.sqrt(seA ** 2 + seB ** 2) : null
    return {
      mesa: c.mesa, tasaNivel: c.tasaAsiento0, tasaBase: b?.tasaAsiento0 ?? null,
      esperado: c.esperado, difPp: dif === null ? null : dif * 100,
      sigmas: seDif ? dif / seDif : null,
    }
  })
  const u4 = umbralFamilia(p4detalle.filter(d => d.sigmas !== null).length)
  for (const d of p4detalle) d.pasa = d.sigmas === null ? null : (d.difPp <= 0 || Math.abs(d.sigmas) < u4)
  const p4 = p4detalle.some(d => d.pasa !== null)
    ? { pasa: p4detalle.every(d => d.pasa !== false), umbralSigmas: u4,
        familia: p4detalle.filter(d => d.sigmas !== null).length, detalle: p4detalle }
    : null

  return {
    metodoUmbral: {
      correccion: 'Bonferroni por puerta',
      alfaFamilia: P_3SIGMA,
      porQue: 'cada puerta es una FAMILIA de comparaciones (una por mesa, o una por mesa x perfil). A 3 sigmas por comparación un rojo suelto es esperable por diseño; el alfa se reparte para devolver a la PUERTA la tasa de error de una sola prueba a 3 sigmas.',
      degeneracion: 'con m=1 el umbral vuelve a ser exactamente 3 sigmas',
    },
    lineaBaseLeidaDe: base ? 'capturas-dsk/evidencia/nivB0_base.json' : null,
    p1_pasivoCastigado: p1,
    p2_hermanaMayorDomina: p2,
    p3_porTemperamento: p3,
    p4_sinRegresionContraBasura: p4,
  }
}
const puertasNiv1 = puertasNiveluno()

// ── Puertas direccionales de NIV-2 (§7 de la instrucción) ────────────────────
//
// LA DECISIÓN DE INSTRUMENTO DE ESTA TANDA, dicha sin adorno, porque cambia cómo
// se leen todas las cifras de abajo.
//
// Hasta NIV-1 la métrica primaria fue MANOS GANADAS. Midiendo NIV-2 se vio que
// esa métrica no mide fuerza: premia, casi en exclusiva, NO RETIRARSE. En este
// juego el 99% de las manos llega al showdown, así que cada retiro es una mano
// que ya no se puede ganar y quien menos se retira gana más manos, juegue bien o
// mal. La prueba estaba en la propia vara desde NIV-B0 y ahora se puede cerrar
// con un número: el conductor PASIVO —iguala o pasa, jamás se retira— saca
// EXACTAMENTE 25,00% de las manos en mesa 4 contra una mesa Pro, clavado en 1/N,
// mientras pierde 0,60 unidades por mano. Perfecto en la métrica, arruinado en
// la mesa.
//
// La métrica opuesta —PARTIDAS ganadas— tiene el defecto simétrico: premia
// retirarse, porque conservar fichas alarga la supervivencia. Leída así, Básico
// (que se retira el 20% de las veces) «bate» a Avanzado, lo cual es falso.
//
// Ninguna de las dos mide fuerza. La que sí: FICHAS NETAS POR MANO. El ante es
// forzado y se cobra a todos en cada barajado (`gameEngine.js:409`), así que
// retirarse cuesta de verdad y pagar de más también; la métrica no tiene un lado
// barato. Sus credenciales, medidas antes de usarla para nada:
//
//   · En el espejo SIMÉTRICO la diferencia pareada 0-1 es nula (mesa 4:
//     −0,044u a 1,27σ con mesa Pro, +0,026u a 0,65σ con mesa Avanzada). Una
//     métrica que no da cero cuando los dos lados son idénticos no sirve.
//   · Ordena los tres niveles con el mismo signo y pasos comparables:
//     Básico contra mesa Avanzada −0,247u, Avanzado contra mesa Pro −0,178u,
//     Básico contra mesa Pro −0,455u ≈ la suma de los dos peldaños.
//   · Tritura a los conductores basura: PASIVO −0,60u, ALEATORIO −1,54u.
//
// Se publican LAS DOS lecturas en cada puerta. La de fichas manda; la de manos
// se conserva porque es la que la instrucción enuncia y porque su ceguera es,
// ella misma, un resultado de esta tanda. Ninguna cifra se esconde.
function puertasNivelDos() {
  const duelos = celdas.filter(c => c.conductor === 'espejo' && c.nivelAsiento0 !== c.nivel)
  if (!duelos.length) return null

  let base = null, ref = null
  try { base = JSON.parse(readFileSync(join(DIR_EVID, 'niv1_avanzado.json'), 'utf8')) } catch { base = null }
  try { ref  = JSON.parse(readFileSync(join(DIR_EVID, ARCHIVO_REF), 'utf8')) } catch { ref = null }
  const varaManos = (mesa, j0) => base?.lineaBase?.find(
    c => c.mesa === mesa && c.conductor === 'espejo' && c.nivelAsiento0 === j0)?.duelo?.global ?? null
  const refFichas = (mesa) => ref?.lineaBase?.find(
    c => c.mesa === mesa && c.conductor === 'espejo' && c.nivelAsiento0 === 'basico')?.dueloFichas?.global ?? null
  const umbralFamilia = (m) => (m > 0 ? umbralDeAlfa(P_3SIGMA / m) : 3)
  const enUnidades = (d) => (d ? { u: d.delta / UNIT, se: d.se / UNIT, sigmas: d.sigmas, manos: d.manos, partidas: d.partidas } : null)

  const de = (mesa, j0) => duelos.find(c => c.mesa === mesa && c.nivelAsiento0 === j0) ?? null

  // ── N1 · La escalera completa ordena ──────────────────────────────────────
  // (a) Avanzado contra mesa Pro pierde, con significancia.
  // (b) Básico contra mesa Pro pierde MÁS que Avanzado contra la misma mesa Pro
  //     — el peldaño Básico < Avanzado medido contra un rival común, que es una
  //     comparación más limpia que enfrentarlos a dos mesas distintas.
  // (c) Lectura literal del enunciado en MANOS, contra la vara rastreada de
  //     NIV-1: la cifra de Básico contra mesa Pro por debajo de la que ese mismo
  //     Básico sacó contra mesa Avanzada. No se re-lanza nada (§8).
  const n1detalle = []
  for (const N of MESAS) {
    const av = de(N, 'avanzado'), ba = de(N, 'basico')
    const fila = { mesa: N }
    if (av) {
      fila.avanzadoVsPro = { fichas: enUnidades(av.dueloFichas?.global), manos: enUnidades(av.duelo?.global) }
      fila.avanzadoVsPro.manos = av.duelo?.global
        ? { pp: av.duelo.global.delta * 100, se: av.duelo.global.se * 100, sigmas: av.duelo.global.sigmas }
        : null
    }
    if (ba) {
      fila.basicoVsPro = { fichas: enUnidades(ba.dueloFichas?.global) }
      fila.basicoVsPro.manos = ba.duelo?.global
        ? { pp: ba.duelo.global.delta * 100, se: ba.duelo.global.se * 100, sigmas: ba.duelo.global.sigmas }
        : null
      const v = varaManos(N, 'basico')
      fila.basicoVsAvanzado_varaManos = v ? { pp: v.delta * 100, sigmas: v.sigmas } : null
      fila.basicoVsAvanzado_refFichas = enUnidades(refFichas(N))
    }
    n1detalle.push(fila)
  }
  const conAv = n1detalle.filter(f => f.avanzadoVsPro?.fichas)
  const conBa = n1detalle.filter(f => f.basicoVsPro?.fichas && f.basicoVsAvanzado_refFichas)
  const u1 = umbralFamilia(conAv.length + conBa.length)
  for (const f of n1detalle) {
    // (a) Avanzado contra mesa Pro pierde, con significancia.
    if (f.avanzadoVsPro?.fichas) {
      const d = f.avanzadoVsPro.fichas
      f.a_avanzadoPierde = d.u < 0 && Math.abs(d.sigmas) >= u1
      f.a_literalEnManos = f.avanzadoVsPro.manos ? f.avanzadoVsPro.manos.pp < 0 : null
    }
    // (b) Básico contra mesa Pro por debajo de su cifra contra mesa Avanzada.
    //     Las dos cifras salen de celdas independientes: σ en cuadratura.
    if (f.basicoVsPro?.fichas && f.basicoVsAvanzado_refFichas) {
      const b = f.basicoVsPro.fichas, r = f.basicoVsAvanzado_refFichas
      const dif = b.u - r.u
      const se  = Math.sqrt(b.se ** 2 + r.se ** 2)
      f.b_caida = { u: dif, se, sigmas: se > 0 ? dif / se : 0 }
      f.b_basicoCaeMas = dif < 0 && Math.abs(f.b_caida.sigmas) >= u1
    }
    if (f.basicoVsPro?.manos && f.basicoVsAvanzado_varaManos) {
      f.b_literalEnManos = f.basicoVsPro.manos.pp <= f.basicoVsAvanzado_varaManos.pp
    }
    // Diagnóstico (no puerta): el peldaño medido contra un RIVAL COMÚN — las dos
    // cifras contra la misma mesa Pro. Es una comparación más limpia que las dos
    // del enunciado, que enfrentan a Básico con dos mesas distintas, y por eso se
    // publica aunque no se gatee con ella.
    if (f.basicoVsPro?.fichas && f.avanzadoVsPro?.fichas) {
      const b = f.basicoVsPro.fichas, a = f.avanzadoVsPro.fichas
      const dif = b.u - a.u
      const se  = Math.sqrt(b.se ** 2 + a.se ** 2)
      f.diag_peldanoContraRivalComun = { u: dif, se, sigmas: se > 0 ? dif / se : 0 }
    }
  }
  const n1 = {
    metrica: 'fichas netas por mano (unidades de entrada), pareada asiento0 vs su gemelo de temperamento',
    umbralSigmas: u1, familia: conAv.length + conBa.length,
    referenciaFichas: ref ? `capturas-dsk/evidencia/${ARCHIVO_REF}` : null,
    pasa: n1detalle.every(f => (f.a_avanzadoPierde ?? true) && (f.b_basicoCaeMas ?? true)),
    pasaLiteralEnManos: n1detalle.every(f => (f.a_literalEnManos ?? true) && (f.b_literalEnManos ?? true)),
    detalle: n1detalle,
  }

  // ── N3 · Por temperamento ─────────────────────────────────────────────────
  // Los cuatro perfiles con el signo correcto. Prohibido que el nivel «suba»
  // porque un solo temperamento cargue el promedio.
  const n3detalle = []
  for (const c of duelos) {
    for (const [perfil, d] of Object.entries(c.dueloFichas?.porPerfil ?? {})) {
      if (!d) continue
      n3detalle.push({ mesa: c.mesa, nivelAsiento0: c.nivelAsiento0, perfil, ...enUnidades(d) })
    }
  }
  const u3 = umbralFamilia(n3detalle.length)
  for (const d of n3detalle) d.pasa = d.u <= 0 || Math.abs(d.sigmas) < u3
  const n3 = n3detalle.length
    ? { pasa: n3detalle.every(d => d.pasa), umbralSigmas: u3, familia: n3detalle.length,
        perfilesCubiertos: [...new Set(n3detalle.map(d => d.perfil))].sort(), detalle: n3detalle }
    : null

  // ── N4 · «Difícil, no imposible» · sin puerta numérica (§7.4) ─────────────
  const n4 = n1detalle.map(f => ({
    mesa: f.mesa,
    avanzadoVsPro_u: f.avanzadoVsPro?.fichas?.u ?? null,
    basicoVsPro_u:   f.basicoVsPro?.fichas?.u ?? null,
    avanzadoVsPro_manosPp: f.avanzadoVsPro?.manos?.pp ?? null,
    basicoVsPro_manosPp:   f.basicoVsPro?.manos?.pp ?? null,
  }))

  // ── Diagnóstico de las ramas de Pro, por mesa (§7, no es puerta) ─────────
  const diag = celdas.filter(c => c.diagPro?.decisiones > 0).map(c => ({
    mesa: c.mesa, conductor: c.conductor, nivelAsiento0: c.nivelAsiento0,
    tasaLectura: c.diagPro.tasaLectura,
    farolesPorMano: c.diagPro.farolesPorMano,
    farolAbre: c.diagPro.farolAbre, farolSube: c.diagPro.farolSube,
    farolCobraSinShowdown: c.diagPro.farolCobraSinShowdown,
    farolLlegaAShowdown: c.diagPro.farolLlegaAShowdown,
    ajileis: c.diagPro.ajileis, disimulos: c.diagPro.disimulos, tasaDisimulo: c.diagPro.tasaDisimulo,
    tasaAbandono: c.diagPro.tasaAbandono,
    tasaRetiroPorAsiento: c.conducta.map(x => x.tasaRetiro),
    tasaSubidaPorAsiento: c.conducta.map(x => x.tasaSubida),
  }))

  return {
    metodoUmbral: {
      correccion: 'Bonferroni por puerta',
      alfaFamilia: P_3SIGMA,
      porQue: 'misma doctrina que b3 y que las puertas de NIV-1: cada puerta es una FAMILIA de comparaciones y el alfa se reparte entre ellas.',
    },
    porQueFichas: 'manos-ganadas premia no retirarse (el PASIVO saca 1/N clavado mientras pierde 0,60u por mano) y partidas-ganadas premia lo contrario. Las fichas netas por mano no tienen lado barato: el ante es forzado. Credencial: en el espejo simétrico la diferencia pareada es nula.',
    varaLeidaDe: base ? 'capturas-dsk/evidencia/niv1_avanzado.json' : null,
    n1_escaleraOrdena: n1,
    n2_sinRegresion: 'ver puertasNiv1.p1_pasivoCastigado y p4_sinRegresionContraBasura, evaluadas sobre esta misma corrida contra la vara rastreada',
    n3_porTemperamento: n3,
    n4_dificilNoImposible: n4,
    diagnosticoPro: diag,
  }
}
const puertasNiv2 = puertasNivelDos()

const informe = {
  tanda: TANDA,
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
  puertasNiv1,
  puertasNiv2,
  celdas,
}

if (senalPasivo.length) {
  console.log('\nSeñal del PASIVO (iguala y pasa, nunca sube):')
  for (const s of senalPasivo) {
    console.log(`   mesa ${s.mesa}: ${(100 * s.tasa).toFixed(2)}% vs ${(100 * s.esperado).toFixed(2)}%` +
      ` → ${s.deltaPp >= 0 ? '+' : ''}${s.deltaPp.toFixed(2)}pp (${s.sigmas.toFixed(2)}σ) · ${s.veredicto}`)
  }
}

const pinta = (v) => (v === null ? 'n/d' : v ? 'VERDE' : 'ROJA')
if (Object.values(puertasNiv1).some(v => v && v.detalle)) {
  const P = puertasNiv1
  console.log('\nPuertas NIV-1 (§7):')
  if (P.p1_pasivoCastigado) {
    console.log(`  (1) PASIVO castigado: ${pinta(P.p1_pasivoCastigado.pasa)}  [umbral ${P.p1_pasivoCastigado.umbralSigmas.toFixed(2)}s, familia ${P.p1_pasivoCastigado.familia}]`)
    for (const d of P.p1_pasivoCastigado.detalle)
      console.log(`      mesa ${d.mesa}: ${d.deltaPp >= 0 ? '+' : ''}${d.deltaPp.toFixed(2)}pp (${d.sigmas.toFixed(2)}s)` +
        (d.baseDeltaPp === null ? '' : `   base Basico ${d.baseDeltaPp >= 0 ? '+' : ''}${d.baseDeltaPp.toFixed(2)}pp`) + `  -> ${pinta(d.pasa)}`)
  }
  if (P.p2_hermanaMayorDomina) {
    console.log(`  (2) La hermana mayor domina: vs 1/N ${pinta(P.p2_hermanaMayorDomina.pasa)} - pareado ${pinta(P.p2_hermanaMayorDomina.pasaPareado)}  [umbral ${P.p2_hermanaMayorDomina.umbralSigmas.toFixed(2)}s]`)
    for (const d of P.p2_hermanaMayorDomina.detalle)
      console.log(`      mesa ${d.mesa} (asiento0 ${d.nivelAsiento0} vs mesa ${d.nivelMesa}): vs 1/N ${d.deltaPp.toFixed(2)}pp (${d.sigmas.toFixed(2)}s)` +
        (d.pareado ? ` - pareado 0vs1 ${(100 * d.pareado.delta).toFixed(2)}pp (${d.pareado.sigmas.toFixed(2)}s)` : ''))
  }
  if (P.p3_porTemperamento) {
    console.log(`  (3) Por temperamento: ${pinta(P.p3_porTemperamento.pasa)}  [umbral ${P.p3_porTemperamento.umbralSigmas.toFixed(2)}s, familia ${P.p3_porTemperamento.familia}, perfiles ${P.p3_porTemperamento.perfilesCubiertos.join('/')}]`)
    for (const d of P.p3_porTemperamento.detalle)
      console.log(`      mesa ${d.mesa} ${d.perfil.padEnd(13)} ${d.deltaPp >= 0 ? '+' : ''}${d.deltaPp.toFixed(2)}pp (${d.sigmas.toFixed(2)}s, ${d.manos} manos) -> ${pinta(d.pasa)}`)
  }
  if (P.p4_sinRegresionContraBasura) {
    console.log(`  (4) Sin regresion contra basura: ${pinta(P.p4_sinRegresionContraBasura.pasa)}  [umbral ${P.p4_sinRegresionContraBasura.umbralSigmas.toFixed(2)}s]`)
    for (const d of P.p4_sinRegresionContraBasura.detalle)
      console.log(`      mesa ${d.mesa}: ${(100 * d.tasaNivel).toFixed(2)}% vs base ${d.tasaBase === null ? 'n/d' : (100 * d.tasaBase).toFixed(2) + '%'}` +
        (d.difPp === null ? '' : `  ${d.difPp >= 0 ? '+' : ''}${d.difPp.toFixed(2)}pp (${d.sigmas.toFixed(2)}s)`) + ` -> ${pinta(d.pasa)}`)
  }
}

if (puertasNiv2) {
  const P = puertasNiv2
  const u = (x) => (x === null || x === undefined ? '   n/d' : (x >= 0 ? '+' : '') + x.toFixed(3) + 'u')
  console.log('\nPuertas NIV-2 (§7) · métrica primaria: FICHAS NETAS POR MANO')
  console.log(`  (1) La escalera ordena: ${pinta(P.n1_escaleraOrdena.pasa)}  [umbral ${P.n1_escaleraOrdena.umbralSigmas.toFixed(2)}s, familia ${P.n1_escaleraOrdena.familia}]` +
    `   · lectura literal en manos: ${pinta(P.n1_escaleraOrdena.pasaLiteralEnManos)}`)
  for (const f of P.n1_escaleraOrdena.detalle) {
    const a = f.avanzadoVsPro?.fichas, b = f.basicoVsPro?.fichas, r = f.basicoVsAvanzado_refFichas
    console.log(`      mesa ${f.mesa} (a) avanzado-vs-Pro ${u(a?.u)} (${a ? a.sigmas.toFixed(2) : '—'}s) -> ${pinta(f.a_avanzadoPierde ?? null)}` +
      `   manos ${f.avanzadoVsPro?.manos ? f.avanzadoVsPro.manos.pp.toFixed(2) + 'pp' : 'n/d'} -> ${pinta(f.a_literalEnManos ?? null)}`)
    console.log(`             (b) basico-vs-Pro ${u(b?.u)} vs ref basico-vs-Avanzado ${u(r?.u)}` +
      (f.b_caida ? `  caida ${u(f.b_caida.u)} (${f.b_caida.sigmas.toFixed(2)}s) -> ${pinta(f.b_basicoCaeMas)}` : '  -> n/d') +
      (f.basicoVsPro?.manos && f.basicoVsAvanzado_varaManos
        ? `   manos ${f.basicoVsPro.manos.pp.toFixed(2)}pp vs vara ${f.basicoVsAvanzado_varaManos.pp.toFixed(2)}pp -> ${pinta(f.b_literalEnManos)}` : ''))
    if (f.diag_peldanoContraRivalComun) {
      console.log(`             [diag] peldano contra rival comun ${u(f.diag_peldanoContraRivalComun.u)} (${f.diag_peldanoContraRivalComun.sigmas.toFixed(2)}s)`)
    }
  }
  if (P.n3_porTemperamento) {
    console.log(`  (3) Por temperamento: ${pinta(P.n3_porTemperamento.pasa)}  [umbral ${P.n3_porTemperamento.umbralSigmas.toFixed(2)}s, familia ${P.n3_porTemperamento.familia}, perfiles ${P.n3_porTemperamento.perfilesCubiertos.join('/')}]`)
    for (const d of P.n3_porTemperamento.detalle) {
      console.log(`      mesa ${d.mesa} j0=${d.nivelAsiento0.padEnd(9)} ${d.perfil.padEnd(13)} ${u(d.u)} (${d.sigmas.toFixed(2)}s, ${d.manos} manos) -> ${pinta(d.pasa)}`)
    }
  }
  console.log('  (4) Dificil, no imposible (sin puerta numerica — la banda la fija calibracion):')
  for (const f of P.n4_dificilNoImposible) {
    console.log(`      mesa ${f.mesa}: avanzado ${u(f.avanzadoVsPro_u)} / ${f.avanzadoVsPro_manosPp === null ? 'n/d' : f.avanzadoVsPro_manosPp.toFixed(2) + 'pp'}` +
      `   basico ${u(f.basicoVsPro_u)} / ${f.basicoVsPro_manosPp === null ? 'n/d' : f.basicoVsPro_manosPp.toFixed(2) + 'pp'}`)
  }
  console.log('  Diagnostico de las ramas de Pro (frecuencias efectivas):')
  for (const d of P.diagnosticoPro) {
    console.log(`      mesa ${d.mesa} ${(d.conductor + (d.nivelAsiento0 !== NIVEL ? ':' + d.nivelAsiento0 : '')).padEnd(17)}` +
      ` lectura ${(100 * d.tasaLectura).toFixed(1)}%  farol/mano ${d.farolesPorMano.toFixed(4)} (abre ${d.farolAbre}/sube ${d.farolSube})` +
      `  cobra sin showdown ${d.farolCobraSinShowdown}  ajilei ${d.ajileis} disimulo ${d.disimulos} (${(100 * d.tasaDisimulo).toFixed(1)}%)` +
      `  abandono ${(100 * d.tasaAbandono).toFixed(1)}%  retiros ${d.tasaRetiroPorAsiento.map(x => (100 * x).toFixed(1)).join('/')}`)
  }
}

writeFileSync(join(DIR_OUT, ARCHIVO_VOLCADO), JSON.stringify(informe, null, 2))
console.log(`\nVolcado completo → capturas-dsk/${ARCHIVO_VOLCADO}`)

if (ESCRIBE_BASE) {
  const resumen = {
    tanda: TANDA,
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
    puertasNiv1,
    puertasNiv2,
    puertas: {
      a_conservacionFichas: puertas.a_conservacionFichas,
      b_espejoSimetrico: puertas.b_espejoSimetrico,
      c_escriturasFueraDeCapturas: puertas.c_escriturasFueraDeCapturas,
      extra_pasajeroSobrevive: puertas.extra_pasajeroSobrevive,
      // Los métodos de umbral viajan CON la evidencia: sin ellos, las σ del
      // detalle no se pueden leer contra nada. b2_metodo es el rider NIV-2 §5.
      b3_metodo: puertas.b3_metodo,
      b2_metodo: puertas.b3_metodo?.b2_metodo ?? null,
      b_detalle: puertas.b_detalle,
    },
    lineaBase: celdas.map(c => ({
      mesa: c.mesa, conductor: c.conductor,
      nivel: c.nivel, nivelAsiento0: c.nivelAsiento0,
      duelo: c.duelo, dueloFichas: c.dueloFichas,
      fichas: c.fichas, conducta: c.conducta, diagPro: c.diagPro,
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
  writeFileSync(join(DIR_EVID, ARCHIVO_EVID), JSON.stringify(resumen, null, 2))
  console.log(`Resumen rastreado → capturas-dsk/evidencia/${ARCHIVO_EVID}`)
}
