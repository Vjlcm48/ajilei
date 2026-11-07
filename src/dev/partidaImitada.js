// ── MES-PvP 2 · El árbitro imitado y el mando `?pvp=` ───────────────────────
// Diagnóstico: informe de la Fase 0 de MES-PvP, §I.2. La misma forma que
// `crearClientePartida`, con el ÁRBITRO REAL en memoria: no son vistas escritas a mano,
// porque las coreografías nacen de transiciones y una vista suelta no las produce. Y no
// se puede desviar del contrato, porque es el contrato.
//
// LA PUERTA ES DOBLE, como la de `simulacionSalas` (`salasFixtures.js`): DEV y bypass. Se
// pide con `import()` detrás de la puerta (sub-tanda 3), y `testDistSinMoldes` comprueba
// que no llega a `dist/`.
//
// EL RELOJ ES VIRTUAL. Para llegar a una escena no se esperan los vencimientos: la hora
// salta a la del vencimiento. Al llegar se queda ahí, y `desfase` hace que el cliente vea
// la hora del árbitro, igual que con un servidor de verdad.
//
// LO QUE NO ES: el camino hasta la escena toca pilas a mano en dos casos (`pila`), como un
// asiento que se hubiera sentado con menos, para no tener que jugar decenas de manos hasta
// una quiebra. Todo lo demás lo decide el árbitro.

import { drawRank, resetRng, setRng } from '../engine/deck.js'
import { PHASES } from '../engine/gameEngine.js'
import { esLegal } from '../engine/pozos.js'
import { AUSENTE_DESDE, ELECCION_SORTEO_MS, VOLTEO_SORTEO_MS } from '../config/esperas.js'
import {
  CLASES, ETAPAS, MOTIVOS, aplicarAccion, crearPartida, huboRevelacion, partidaTerminada, vistaDe,
} from '../arbitro/index.js'
import { ESPERA_REPARTO_SORTEO_MS } from '../arbitro/reloj.js'
import { esperaRepartoSorteo } from '../lib/sorteoMesaCore.js'
import { REACCIONES, codepointDe } from '../config/reacciones.js'
import { rechazoDeMensaje } from '../lib/mensajesMesaCore.js'
import { lecturaDeMano } from '../hooks/manoCore.js'

export const MARCA_PARTIDA_IMITADA = 'ajilei:partida-imitada'
export const PARAM_PVP = 'pvp'

const NOMBRES = ['Ana', 'Beto', 'Caro', 'Dani', 'Eli']
const NOMBRE_LARGO = 'W'.repeat(15)
const APUESTA = 100
const TOPE_PASOS = 3000
const TOPE_SEMILLAS = 400

// Esta semilla no llega a la escena con este guion: se prueba la siguiente.
class NoLlega extends Error {}
const exige = (condicion) => { if (!condicion) throw new NoLlega() }

function mulberry32(s) {
  let a = s >>> 0
  return () => {
    a = (a + 0x6D2B79F5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// ── La mesa de guion ────────────────────────────────────────────────────────

function nuevaMesa({ n, asiento, nombres, ahora }) {
  const sillas = Array.from({ length: n }, (_, i) => ({
    asiento: i, uid: `imitado-${i}`, nombre: nombres === 'largo' ? NOMBRE_LARGO : NOMBRES[i],
  }))
  return {
    n,
    yo: asiento,
    otro: (asiento + 1) % n,
    t: ahora,
    muerta: false,
    e: crearPartida({ apuesta: APUESTA, entrada: 'corta', ritmo: 'normal' }, sillas, ahora),
  }
}

function pide(m, i, accion, campos = {}) {
  const peticion = { uid: `imitado-${i}`, version: m.e.version, accion, ...campos }
  const r = aplicarAccion(m.e, peticion, { ahora: m.t })
  if (!r.respuesta.ok) throw new Error(`MES-PvP 2 · el guion pide lo ilegal: ${accion} del asiento ${i} → ${r.respuesta.motivo}`)
  m.e = r.estado
}

function reclama(m) {
  m.t = Math.max(m.t, m.e.vencimiento.hora)
  pide(m, m.e.asientos.findIndex((a) => !a.abandonado), 'reclamar_vencimiento')
}

const pila = (m, i, chips) => {
  const players = m.e.motor.players.map((p, j) => (j === i ? { ...p, chips } : p))
  m.e = { ...m.e, motor: { ...m.e.motor, players } }
}

// El guion por defecto: pasar si se puede; si no, igualar; si no, all-in; si no, retirarse.
function apuestaPrudente({ e: { motor } }, i) {
  const tipo = ['pasar', 'igualar', 'allIn'].find((x) => esLegal(motor, i, x).ok) ?? 'retirarse'
  return { tipo }
}

const RELOJ = 'reloj'

// Un paso de la mesa. `guion` puede cambiar qué apuesta cada uno, qué carta elige y qué
// descarta; lo que devuelva `RELOJ` se deja vencer. El propio siempre actúa primero.
function paso(m, guion = {}) {
  const { motor, vencimiento: v, sorteo, asientos, descarte } = m.e
  const primero = (cumple) => [m.yo, ...asientos.keys()].find((i) => cumple(i))
  switch (v.clase) {
    case CLASES.ELECCION_SORTEO: {
      const i = primero((a) => sorteo.participan.includes(a) && sorteo.elecciones[a] === null)
      return pide(m, i, 'elegir_carta_sorteo', { ronda: sorteo.ronda, carta: guion.carta?.(m, i) ?? 0 })
    }
    case CLASES.TURNO: {
      const i = motor.activePlayerIndex
      const jugada = (guion.apuesta ?? apuestaPrudente)(m, i)
      return jugada === RELOJ ? reclama(m) : pide(m, i, 'apostar', jugada)
    }
    case CLASES.DESCARTE: {
      const pendiente = (a) => !motor.players[a].folded && descarte[a] === null
      const i = primero((a) => pendiente(a) && guion.descarte?.(m, a) !== RELOJ)
      return i === undefined ? reclama(m) : pide(m, i, 'descartar', { mano: motor.handCount, indices: guion.descarte?.(m, i) ?? [] })
    }
    case CLASES.PAUSA_ANUNCIO:
      return pide(m, primero((a) => asientos[a].enAnuncio), 'volver_anuncio', { mano: motor.handCount })
    default:
      return reclama(m)
  }
}

function hasta(m, cumple, guion) {
  for (let k = 0; k < TOPE_PASOS; k++) {
    if (cumple(m.e)) return
    exige(!partidaTerminada(m.e))
    paso(m, guion)
  }
  throw new NoLlega()
}

// ── El empate forzado ───────────────────────────────────────────────────────
// Los rivales de guion ven sus cartas: en cada ronda, `cuantos` eligen la carta más alta en
// la que coinciden y los demás, la más baja. Si esa baraja no da para empatar, otra semilla.
function cartaParaEmpatar(cuantos, { yo = null, conYo = null } = {}) {
  const planes = new Map()
  const plan = ({ sorteo }) => {
    const { participan, cartas } = sorteo
    const rangos = (a) => cartas[a].map((c) => drawRank(c.value))
    const quieren = Math.min(cuantos, participan.length)
    // L-M 1 · el propio dentro (`conYo`) o fuera del empate; sin la opción, como antes.
    const orden = conYo === null ? participan
      : conYo ? [yo, ...participan.filter((a) => a !== yo)] : participan.filter((a) => a !== yo)
    for (let r = 50; r >= 0; r--) {
      const tienen = orden.filter((a) => rangos(a).includes(r)).slice(0, quieren)
      if (conYo && participan.includes(yo) && !tienen.includes(yo)) continue
      if (tienen.length < quieren) continue
      const resto = participan.filter((a) => !tienen.includes(a))
      if (!resto.every((a) => Math.min(...rangos(a)) < r)) continue
      const eleccion = new Map(tienen.map((a) => [a, rangos(a).indexOf(r)]))
      resto.forEach((a) => eleccion.set(a, rangos(a).indexOf(Math.min(...rangos(a)))))
      return eleccion
    }
    throw new NoLlega()
  }
  return (m, i) => {
    const clave = `${m.e.sorteo.ronda}`
    if (!planes.has(clave)) planes.set(clave, plan(m.e))
    return planes.get(clave).get(i)
  }
}

// ── Las escenas ─────────────────────────────────────────────────────────────

const turnoDe = (e) => e.vencimiento?.clase === CLASES.TURNO
const enPago = (e) => e.motor.phase === PHASES.PAYOUT
const enPausa = (e) => e.vencimiento?.clase === CLASES.PAUSA_ANUNCIO
const hastaPrimeraApuesta = (m) => hasta(m, (e) => turnoDe(e) && e.motor.phase === PHASES.BET_1)
const hastaTurnoPropio = (m) => hasta(m, (e) => turnoDe(e) && e.motor.phase === PHASES.BET_1 && e.motor.activePlayerIndex === m.yo)
const hastaTurnoAjeno = (m) => hasta(m, (e) => turnoDe(e) && e.motor.phase === PHASES.BET_1 && e.motor.activePlayerIndex !== m.yo)
const empate = (m, cuantos, llego) => hasta(m, llego, { carta: cartaParaEmpatar(cuantos) })

const ultimaRonda = (e) => e.sorteo.rondas.at(-1)
const enVolteo = (e) => e.sorteo.etapa === ETAPAS.VOLTEO

// ── L-M 1 · El sorteo sobre la mesa ─────────────────────────────────────────
// Ficha AJILEI_MES-PvP_LM-1_v1.0.md §2. Cada escena dice su guion (qué carta elige cada uno),
// dónde se congela (`llega`) y en qué momento de la etapa (`momento`, ms): la capa del sorteo
// pinta ese instante, sin animar. Con `&ver=vivo` la misma semilla y el mismo guion se juegan
// desde el barajado de la ronda 1, a la hora real, hasta el primer turno.
export const VOLTEO_LAMINA_MS = 5000   // lo sellado (§2.5); el árbitro real sigue en 4 s hasta la v1.3

// Gana `quien(m)`: elige su carta más alta y los demás la más baja; si no basta, otra semilla.
function cartaParaGanar(quien) {
  const planes = new Map()
  return (m, i) => {
    const clave = `${m.e.sorteo.ronda}`
    if (!planes.has(clave)) {
      const { participan, cartas } = m.e.sorteo
      const rangos = (a) => cartas[a].map((c) => drawRank(c.value))
      const g = quien(m)
      const alta = Math.max(...rangos(g))
      exige(participan.every((a) => a === g || Math.min(...rangos(a)) < alta))
      planes.set(clave, new Map(participan.map((a) => [a, a === g ? rangos(a).indexOf(alta) : rangos(a).indexOf(Math.min(...rangos(a)))])))
    }
    return planes.get(clave).get(i)
  }
}
const cuantosEmpatan = (m) => (m.n >= 5 ? 3 : 2)
const volteoDeRonda = (ronda, cumple) => (e, m) => enVolteo(e) && e.sorteo.ronda === ronda && cumple(ultimaRonda(e), m)
const SORTEO_LAMINA = {
  'sorteo-reparto': { llega: (e) => e.sorteo.etapa === ETAPAS.REPARTO, momento: 1000 },
  'sorteo-elige': { llega: (e) => e.sorteo.etapa === ETAPAS.ELECCION, momento: 600 },
  // El propio ya eligió y el siguiente también; los demás faltan (en la de 2, falta el otro).
  'sorteo-elige-algunos': {
    llega: (e) => e.sorteo.etapa === ETAPAS.ELECCION,
    luego: (m) => {
      pide(m, m.yo, 'elegir_carta_sorteo', { ronda: m.e.sorteo.ronda, carta: 1 })
      if (m.n > 2) pide(m, m.otro, 'elegir_carta_sorteo', { ronda: m.e.sorteo.ronda, carta: 3 })
    },
    momento: 1500,
  },
  'sorteo-volteo-propio': { guion: () => ({ carta: cartaParaGanar((m) => m.yo) }), llega: volteoDeRonda(1, (r, m) => r.mano === m.yo), momento: 1500 },
  'sorteo-volteo-ajeno': { guion: () => ({ carta: cartaParaGanar((m) => m.otro) }), llega: volteoDeRonda(1, (r, m) => r.mano === m.otro), momento: 1500 },
  'sorteo-empate': {
    guion: (m) => ({ carta: cartaParaEmpatar(cuantosEmpatan(m), { yo: m.yo, conYo: true }) }),
    llega: volteoDeRonda(1, (r, m) => r.mano === null && r.empatados.length === cuantosEmpatan(m) && r.empatados.includes(m.yo)),
    momento: 1500,
  },
  // El desempate, mirado por un empatado (elige) y por quien no empató (ve el reparto ajeno).
  'sorteo-desempate': {
    guion: (m) => ({ carta: cartaParaEmpatar(cuantosEmpatan(m), { yo: m.yo, conYo: true }) }),
    llega: (e, m) => e.sorteo.ronda === 2 && e.sorteo.etapa === ETAPAS.ELECCION && e.sorteo.participan.includes(m.yo),
    momento: 600,
  },
  'sorteo-desempate-fuera': {
    minimo: 3,
    guion: (m) => ({ carta: cartaParaEmpatar(cuantosEmpatan(m), { yo: m.yo, conYo: false }) }),
    llega: (e, m) => e.sorteo.ronda === 2 && e.sorteo.etapa === ETAPAS.REPARTO && !e.sorteo.participan.includes(m.yo),
    momento: 1000,
  },
  'sorteo-azar-propio': {
    guion: (m) => ({ carta: cartaParaEmpatar(2, { yo: m.yo, conYo: true }) }),
    llega: (e, m) => enVolteo(e) && ultimaRonda(e).azar && ultimaRonda(e).mano === m.yo,
    momento: 1500,
  },
  'sorteo-azar-ajeno': {
    guion: (m) => ({ carta: cartaParaEmpatar(2, { yo: m.yo, conYo: true }) }),
    llega: (e, m) => enVolteo(e) && ultimaRonda(e).azar && ultimaRonda(e).mano !== m.yo,
    momento: 1500,
  },
  // Las cartas volviendo al mazo, con «… es Mano» en el óvalo.
  'sorteo-vuelta': { guion: () => ({ carta: cartaParaGanar((m) => m.otro) }), llega: volteoDeRonda(1, (r, m) => r.mano === m.otro), momento: VOLTEO_LAMINA_MS - 600 },
}
const escenaDeLamina = ({ guion, llega, luego, minimo, momento }) => ({
  minimo,
  momento,
  guion,
  jugar: (m) => {
    const g = guion?.(m) ?? {}
    hasta(m, (e) => llega(e, m), g)
    luego?.(m)
    return g
  },
})

// ── L-M 2 · La mesa de 5 de punta a punta y la ausencia ─────────────────────
// Ficha AJILEI_MES-PvP_LM-2_v1.0.md §3 y §4. Mismo molde: el árbitro real decide; el guion
// solo dice qué hace cada uno. `golpe` es el último paso: congelada, la escena llega con él
// dado; con `&ver=vivo`, llega antes y el golpe cae a los `GOLPE_VIVO_MS` (el reloj que vence).
const GOLPE_VIVO_MS = 2500
const enTurnoDe = (e, i) => turnoDe(e) && e.motor.activePlayerIndex === i
const vencidosDe = (e, i) => e.asientos[i].vencidos ?? 0

// Las cuatro últimas acciones distintas antes del turno propio: el primero que habla pasa, el
// siguiente apuesta, el siguiente sube y los demás igualan (en la de 5, los cuatro rivales).
function apuestaVariada(m, i) {
  const { motor } = m.e
  m.pasaron ??= new Set()
  if (motor.currentBet === 0) {
    if (m.pasaron.size === 0 && esLegal(motor, i, 'pasar').ok) { m.pasaron.add(i); return { tipo: 'pasar' } }
    return { tipo: 'apostar', k: 1 }
  }
  if (!m.subio && motor.players[i].contrib === 0 && esLegal(motor, i, 'subir', 1).ok) { m.subio = true; return { tipo: 'subir', k: 1 } }
  return apuestaPrudente(m, i)
}

// Pilas escalonadas (300, 650, 1.000, …), que no se igualan justo con ninguna apuesta: con
// los all-in salen capas, y la pila mayor no queda cubierta, así que hay devolución. La mayor es
// la del rival siguiente (`otro`): la devolución lleva su nombre.
function pilasEscalonadas(m) {
  m.e.asientos.forEach((_a, i) => pila(m, (m.otro + 1 + i) % m.n, 350 * (i + 1) - 50))
}
const todoAllIn = (m, i) => {
  const { motor } = m.e
  if (esLegal(motor, i, 'allIn').ok) return { tipo: 'allIn' }
  const k = Math.floor(motor.players[i].chips / motor.unit)
  if (motor.currentBet === 0 && k > 0 && esLegal(motor, i, 'apostar', k).ok) return { tipo: 'apostar', k }
  return apuestaPrudente(m, i)
}

// El guion en el que `quien(m)` deja vencer todo lo suyo.
const relojDe = (quien) => ({
  apuesta: (x, i) => (i === quien(x) ? RELOJ : apuestaPrudente(x, i)),
  descarte: (x, i) => (i === quien(x) ? RELOJ : []),
})

// Abre la pila mayor con lo más alto que le dejan (×10, ×5, …); los demás igualan si pueden y,
// si no, van all-in: sale el pozo por capas, y lo que nadie cubre vuelve a quien abrió.
const MULTIPLOS = [10, 5, 2, 1]
function apuestaGrande(m, i) {
  const { motor } = m.e
  if (motor.currentBet === 0) {
    const vivos = motor.players.map((p, j) => ({ p, j })).filter(({ p }) => !p.folded && !p.allIn && !p.eliminated)
    const mayor = vivos.reduce((a, b) => (b.p.chips > a.p.chips ? b : a), vivos[0])
    if (mayor?.j === i) {
      const k = MULTIPLOS.find((x) => esLegal(motor, i, 'apostar', x).ok)
      if (k) return { tipo: 'apostar', k }
    }
    return esLegal(motor, i, 'pasar').ok ? { tipo: 'pasar' } : apuestaPrudente(m, i)
  }
  if (esLegal(motor, i, 'igualar').ok) return { tipo: 'igualar' }
  if (esLegal(motor, i, 'allIn').ok) return { tipo: 'allIn' }
  return apuestaPrudente(m, i)
}

const ESCENAS_LM2 = {
  // El reparto de la primera mano, recién decidido el Mano.
  'mano-reparto': { jugar: (m) => hasta(m, (e) => e.vencimiento?.clase === CLASES.REPARTO) },
  // Tu turno con la última acción de cada rival a la vista (pasó, apostó, subió, igualó). La
  // mesa las aprende jugada a jugada (`ultimaDe` compara con la lectura anterior): la escena
  // llega al primer turno y los rivales juegan uno a uno, también congelada (`enPasos`).
  'ultima-accion': {
    minimo: 3,
    antes: (m) => hasta(m, (e) => turnoDe(e) && e.motor.phase === PHASES.BET_1, { apuesta: apuestaVariada }),
    enPasos: {
      guion: { apuesta: apuestaVariada },
      llega: (e, m) => enTurnoDe(e, m.yo) && e.motor.phase === PHASES.BET_1 && !!m.subio
        && e.motor.players.every((p, i) => i === m.yo || p.contrib > 0 || m.pasaron?.has(i)),
    },
  },
  // Un rival va all-in con su pila corta; llega tu turno.
  'allin-rival': {
    jugar: (m) => {
      pila(m, m.otro, 300)
      hasta(m, (e) => enTurnoDe(e, m.yo) && e.motor.players[m.otro].allIn, {
        apuesta: (x, i) => (i === m.otro ? todoAllIn(x, i) : x.e.motor.currentBet === 0 && i !== m.yo ? { tipo: 'apostar', k: 2 } : apuestaPrudente(x, i)),
      })
    },
  },
  // El pago con el pozo partido en capas y una devolución.
  // Afinado tras el STOP-L: un rival gana una capa que no es la principal («El pozo se partió:
  // … se lleva …», en las mesas de 3 o más) y a otro se le devuelve lo que nadie cubrió.
  'pago-capas': {
    jugar: (m) => {
      pilasEscalonadas(m)
      hasta(m, (e) => {
        if (!enPago(e)) return false
        const l = lecturaDeMano(e.motor)
        if (!l || !l.devoluciones.some((d) => d.asiento !== l.principal && d.asiento !== m.yo)) return false
        return m.n === 2 || l.otras.some((o) => o.asiento !== m.yo)
      }, { apuesta: apuestaGrande })
    },
  },
  // §4 · tú, ausente: el reloj resolvió tus dos últimos turnos y vuelve a tocarte.
  'ausente-yo': {
    jugar: (m) => hasta(m, (e) => enTurnoDe(e, m.yo) && vencidosDe(e, m.yo) >= AUSENTE_DESDE, {
      apuesta: (x, i) => (i === m.yo && vencidosDe(x.e, m.yo) < AUSENTE_DESDE ? RELOJ : apuestaPrudente(x, i)),
      descarte: (x, i) => (i === m.yo && vencidosDe(x.e, m.yo) < AUSENTE_DESDE ? RELOJ : []),
    }),
  },
  // §4 · el 3.er vencimiento de un rival: abandona y la mano sigue sin él (mesa de 3 o más).
  'ausencia-tercero': {
    minimo: 3,
    antes: (m) => hasta(m, (e) => vencidosDe(e, m.otro) >= AUSENTE_DESDE && turnoDe(e), relojDe((x) => x.otro)),
    golpe: (m) => hasta(m, (e) => e.asientos[m.otro].abandonado, relojDe((x) => x.otro)),
  },
  // §4 · tu 3.er vencimiento: sales de la mesa y ves tu pantalla final. Solo en vivo: quien llega
  // ya abandonado va al lobby (MES-PvP 3-A, §3.3).
  'ausencia-fuera': {
    antes: (m) => ESCENAS_LM2['ausente-yo'].jugar(m),
    golpe: (m) => hasta(m, (e) => e.asientos[m.yo].abandonado, relojDe((x) => x.yo)),
  },
}
// Con `golpe`, `jugar` llega con él dado (congelada); con `enPasos`, jugando hasta `llega`.
for (const e of Object.values(ESCENAS_LM2)) {
  if (e.golpe) e.jugar = (m) => { e.antes(m); e.golpe(m) }
  if (e.enPasos) e.jugar = (m) => { e.antes(m); hasta(m, (x) => e.enPasos.llega(x, m), e.enPasos.guion) }
}

// Una por escena: `jugar(m)` llega o lanza `NoLlega`; `minimo` es la mesa más chica posible.
const ESCENAS = {
  'sorteo-baraja': { jugar: () => {} },
  'sorteo-oleadas': { jugar: (m) => hasta(m, (e) => e.sorteo.etapa === ETAPAS.REPARTO) },
  'sorteo-eleccion': { jugar: (m) => hasta(m, (e) => e.sorteo.etapa === ETAPAS.ELECCION) },
  'sorteo-empate-2': { jugar: (m) => empate(m, 2, (e) => enVolteo(e) && ultimaRonda(e).empatados.length === 2) },
  'sorteo-empate-3': { minimo: 3, jugar: (m) => empate(m, 3, (e) => enVolteo(e) && ultimaRonda(e).empatados.length === 3) },
  'sorteo-azar': { jugar: (m) => empate(m, 2, (e) => enVolteo(e) && ultimaRonda(e).azar) },
  ...Object.fromEntries(Object.entries(SORTEO_LAMINA).map(([k, v]) => [k, escenaDeLamina(v)])),
  'turno-propio': { jugar: hastaTurnoPropio },
  'turno-ajeno': { jugar: hastaTurnoAjeno },
  // El propio ya descartó y espera a los demás.
  'descarte-espera': {
    jugar: (m) => hasta(m, (e) => e.motor.phase === PHASES.DISCARD && e.descarte[m.yo] !== null, { descarte: () => [0] }),
  },
  // MES-PvP 3 · el descarte abierto y el propio sin mandar: lo hace la mesa, tocando cartas
  // (la reposición con la selección de verdad; `reposicion` llega con el descarte de guion).
  'descarte-propio': {
    jugar: (m) => hasta(m, (e) => e.motor.phase === PHASES.DISCARD && e.vencimiento?.clase === CLASES.DESCARTE
      && e.descarte[m.yo] === null && !e.motor.players[m.yo].folded),
  },
  reposicion: { jugar: (m) => hasta(m, (e) => e.vencimiento?.clase === CLASES.REPOSICION, { descarte: () => [0] }) },
  revelacion: { jugar: (m) => hasta(m, (e) => enPago(e) && huboRevelacion(e.motor)) },
  // Apuesta el primero que hable y los demás se retiran.
  retirada: {
    jugar: (m) => hasta(m, enPago, { apuesta: ({ e }) => (e.motor.currentBet === 0 ? { tipo: 'apostar', k: 1 } : { tipo: 'retirarse' }) }),
  },
  'anuncio-yo': { jugar: (m) => hasta(m, (e) => enPausa(e) && e.asientos[m.yo].enAnuncio) },
  'anuncio-vuelta': { jugar: (m) => hasta(m, (e) => enPausa(e) && !e.asientos[m.yo].enAnuncio && e.asientos.some((a) => a.enAnuncio)) },
  // Un rival al que el reloj le resuelve dos veces seguidas, sin llegar al abandono.
  ausente: {
    jugar: (m) => hasta(m, (e) => (e.asientos[m.otro].vencidos ?? 0) >= AUSENTE_DESDE, {
      apuesta: (x, i) => (i === m.otro ? RELOJ : apuestaPrudente(x, i)),
      descarte: (_x, i) => (i === m.otro ? RELOJ : []),
    }),
  },
  // Un rival abandona con la mano en curso, en el turno del propio, y la mano sigue. Con dos
  // no cabe: desde MES-PvP 3-A la partida terminaría (R2).
  abandono: {
    minimo: 3,
    jugar: (m) => {
      hastaTurnoPropio(m)
      pide(m, m.otro, 'abandonar')
    },
  },
  // MES-PvP 3-A · el caso de Victor: el propio va perdiendo (1.000 menos, que tiene el otro) y
  // los rivales abandonan en el descarte. Fin con resultado negativo, y con el pago de la mano.
  'final-negativo': {
    jugar: (m) => {
      pila(m, m.yo, m.e.motor.players[m.yo].chips - 1000)
      pila(m, m.otro, m.e.motor.players[m.otro].chips + 1000)
      hasta(m, (e) => e.motor.phase === PHASES.DISCARD && e.vencimiento?.clase === CLASES.DESCARTE)
      m.e.asientos.forEach((_a, i) => { if (i !== m.yo) pide(m, i, 'abandonar') })
      exige(partidaTerminada(m.e))
    },
  },
  // MES-PvP 3-A · los rivales abandonan en el sorteo: nadie puso nada, resultado cero.
  'final-cero': {
    jugar: (m) => {
      m.e.asientos.forEach((_a, i) => { if (i !== m.yo) pide(m, i, 'abandonar') })
      exige(partidaTerminada(m.e))
    },
  },
  // MES-PvP 3-A · todos los rivales entran con una sola apuesta, van all-in con el ante y
  // pierden contra el propio: «todas las fichas», el único fin con las frases de victoria.
  'final-todas': {
    jugar: (m) => {
      m.e.asientos.forEach((_a, i) => { if (i !== m.yo) pila(m, i, APUESTA) })
      hasta(m, enPago)
      exige(m.e.motor.players.every((p, i) => i === m.yo || p.chips === 0))
      hasta(m, partidaTerminada)
    },
  },
  'final-gana': {
    jugar: (m) => {
      hastaPrimeraApuesta(m)
      m.e.asientos.forEach((_a, i) => { if (i !== m.yo) pide(m, i, 'abandonar') })
      hasta(m, partidaTerminada)
    },
  },
  // El propio entra con una sola apuesta, va all-in con el ante y pierde contra un rival.
  'final-pierde': {
    jugar: (m) => {
      pila(m, m.yo, APUESTA)
      m.e.asientos.forEach((_a, i) => { if (i !== m.yo && i !== m.otro) pide(m, i, 'abandonar') })
      hasta(m, enPago)
      exige(m.e.motor.players[m.yo].chips === 0)
      hasta(m, partidaTerminada)
    },
  },
  // El propio abandona con la mano en curso. En la mesa de 2 la partida termina; en las
  // demás sigue sin él (MES-PvP 3-A). Llega ya abandonado: es quien vuelve, y va al lobby.
  'final-fuera': {
    jugar: (m) => {
      hastaPrimeraApuesta(m)
      pide(m, m.yo, 'abandonar')
    },
  },
  muerta: {
    jugar: (m) => {
      hastaTurnoAjeno(m)
      m.muerta = true
    },
  },
  ...ESCENAS_LM2,
  // Un rival entra con una sola apuesta, la pierde y sale; la mesa sigue. Con dos no cabe:
  // quedaría un solo vivo y la partida terminaría.
  'aviso-salida': {
    minimo: 3,
    jugar: (m) => {
      pila(m, m.otro, APUESTA)
      hasta(m, enPago)
      exige(m.e.motor.players[m.otro].chips === 0)
      hasta(m, (e) => e.vencimiento?.clase === CLASES.AVISO_SALIDA)
    },
  },
}

export const ESCENAS_PVP = Object.freeze(Object.keys(ESCENAS))
export const escenaCabeEn = (escena, n) => n >= (ESCENAS[escena].minimo ?? 2)

// ── El cliente imitado ──────────────────────────────────────────────────────

/**
 * @param {{ escena: string, n?: number, asiento?: number, nombres?: 'largo'|null, semilla?: number,
 *   ahora?: () => number }} pedido
 * @returns la forma de `crearClientePartida`, con `marca`, `sala` y `avanzar` (un paso de guion).
 */
export function crearPartidaImitada({
  escena, n = 2, asiento = 0, nombres = null, semilla = 1, ahora = Date.now, vivo = false, corte = null, momento = null,
  msj = null, msjMs = 1200,
}) {
  if (!ESCENAS[escena]) throw new Error(`MES-PvP 2 · escena desconocida: ${escena}`)
  if (!escenaCabeEn(escena, n)) throw new Error(`MES-PvP 2 · «${escena}» no cabe en una mesa de ${n}`)

  // El azar del árbitro es global (`setRng`): se fija para llegar y al arrancar, y se suelta al parar.
  let m = null
  let rng = null
  let semillaBuena = null
  for (let s = semilla; s < semilla + TOPE_SEMILLAS && !m; s++) {
    rng = mulberry32(s)
    setRng(rng)
    const intento = nuevaMesa({ n, asiento, nombres, ahora: ahora() })
    try {
      ESCENAS[escena].jugar(intento)
      m = intento
      semillaBuena = s
    } catch (e) {
      if (!(e instanceof NoLlega)) throw e
    }
  }
  resetRng()
  if (!m) throw new Error(`MES-PvP 2 · «${escena}» no llega en ${TOPE_SEMILLAS} semillas`)

  // L-M 1 · `vivo`: la misma semilla y el mismo guion, desde el barajado de la ronda 1 y a la
  // hora real (el conductor de abajo). Se juega hasta el primer turno de la primera mano.
  const deLamina = escena.startsWith('sorteo-')
  let guionVivo = null
  if (vivo && deLamina) {
    rng = mulberry32(semillaBuena)
    setRng(rng)
    m = nuevaMesa({ n, asiento, nombres, ahora: ahora() })
    guionVivo = ESCENAS[escena].guion?.(m) ?? {}
    resetRng()
  }
  // L-M 2 · `vivo` en una escena con golpe: llega antes, y el golpe (el reloj que vence) cae a
  // los 2,5 s de arrancar.
  const golpe = vivo && ESCENAS[escena].golpe ? ESCENAS[escena].golpe : null
  const enPasos = ESCENAS[escena].enPasos ?? null
  if (golpe || enPasos) {
    rng = mulberry32(semillaBuena)
    setRng(rng)
    m = nuevaMesa({ n, asiento, nombres, ahora: ahora() })
    ESCENAS[escena].antes(m)
    resetRng()
  }
  let golpeId = null

  // ── L-M 2 · Los mensajes de la mesa ──────────────────────────────────────
  // Viajan aparte de la vista (la sub-tanda 5 dirá por dónde): [{ id, asiento, clave, hora }],
  // con el asiento ya rotado (0 = el propio) y la hora del reloj de quien mira. `msj`:
  //   uno    · el rival siguiente manda una;
  //   todos  · los rivales y tú, a la vez (el peor caso: las frases más largas);
  //   propio · tú mandaste una (el freno corre).
  // Congelada: cada burbuja se pinta en su ms `msjMs` (lo hace la capa). Con `ver=vivo`, los
  // rivales hablan solos: a los 1,5 s y luego cada 11 s, escalonados.
  const mensajes = []
  let idMsj = 0
  const LARGAS = [...REACCIONES].sort((a, b) => b.length - a.length)
  const publica = (k, frase, hora) => mensajes.push({ id: ++idMsj, asiento: k, clave: codepointDe(frase), hora })
  if (msj && !vivo) {
    const t0 = ahora() - msjMs
    if (msj === 'uno') publica(1, REACCIONES[4], t0)
    if (msj === 'todos') for (let k = 0; k < n; k++) publica(k, LARGAS[k], t0)
    if (msj === 'propio') publica(0, REACCIONES[1], t0)
  }
  let charla = null
  const arrancarCharla = () => {
    if (!msj || !vivo || charla) return
    const t0 = ahora()
    const rivales = msj === 'propio' ? [] : msj === 'uno' ? [1] : Array.from({ length: n - 1 }, (_x, k) => k + 1)
    let ronda = 0
    charla = setInterval(() => {
      const t = ahora() - t0
      rivales.forEach((k, j) => {
        const cuando = 1500 + 400 * j + 11000 * ronda
        if (t >= cuando && !mensajes.some((x) => x.asiento === k && x.hora >= t0 + cuando - 1)) {
          publica(k, msj === 'todos' ? LARGAS[(k + ronda) % LARGAS.length] : REACCIONES[(4 + ronda + j) % REACCIONES.length], ahora())
          poner()
        }
      })
      if (rivales.length && t >= 1500 + 400 * (rivales.length - 1) + 11000 * ronda) ronda++
    }, 100)
  }

  const oyentes = new Set()
  const desfaseDeAhora = () => m.t - ahora()
  // L-M 1 · qué carta eligió cada uno, ya rotado (índice 0 = el propio). La vista del contrato
  // solo dice quién eligió; la lámina lo enseña con la carta de verdad (pide el Contrato v1.3).
  const conEleccion = (vista) => {
    const elecciones = m.e.sorteo?.elecciones
    if (!elecciones || vista.phase !== 'SORTEO') return vista
    return { ...vista, sorteo: { ...vista.sorteo, eligioLamina: elecciones.map((_x, k) => elecciones[(k + asiento) % n]) } }
  }
  const fotoDe = (cambios = {}) => Object.freeze({
    vista: conEleccion(JSON.parse(JSON.stringify(vistaDe(m.e, asiento)))),
    version: m.e.version,
    canal: 'SUBSCRIBED',
    avisos: 0,
    msAccion: null,
    msAviso: null,
    msEco: null,
    rechazo: null,
    desfase: desfaseDeAhora(),
    muerta: m.muerta,
    ...cambios,
  })
  let foto = fotoDe()
  const poner = (cambios) => {
    foto = fotoDe(cambios)
    oyentes.forEach((o) => o())
  }

  // L-M 1 · el conductor de `vivo`: el reloj virtual sigue al real; los rivales eligen a su
  // ritmo (el propio, si no toca, a los 6 s, con la carta del guion), el volteo dura lo sellado
  // de la lámina y todo lo demás vence a su hora. Para en el primer turno.
  let conductor = null
  let etapaVista = null
  // La carta del guion; pasado lo que la escena pide (p. ej. la ronda 2 de
  // `sorteo-desempate-fuera`, que la búsqueda no jugó), cada uno elige su carta más alta.
  const cartaEnVivo = (a) => {
    try {
      return guionVivo.carta?.(m, a) ?? 0
    } catch (e) {
      if (!(e instanceof NoLlega)) throw e
      const rangos = m.e.sorteo.cartas[a].map((c) => drawRank(c.value))
      return rangos.indexOf(Math.max(...rangos))
    }
  }
  const conducir = () => {
    setRng(rng)
    m.t = ahora()
    const { vencimiento: v, sorteo } = m.e
    if (!v || v.clase === CLASES.TURNO || partidaTerminada(m.e)) { clearInterval(conductor); conductor = null; return }
    const clave = `${v.clase}:${v.hora}`
    if (clave !== etapaVista) etapaVista = clave
    const inicio = v.hora - (v.clase === CLASES.ELECCION_SORTEO ? ELECCION_SORTEO_MS : 0)
    let cambio = false
    if (v.clase === CLASES.ELECCION_SORTEO) {
      const rivales = sorteo.participan.filter((a) => a !== m.yo)
      sorteo.participan.forEach((a) => {
        if (sorteo.elecciones[a] !== null) return
        // 3.ª vuelta · el propio, si no toca, a los 9,5 s: antes ve el aviso de los 3 s.
        const espera = a === m.yo ? 9500 : 1500 + 1700 * rivales.indexOf(a)
        if (m.t >= inicio + espera && m.e.sorteo.elecciones[a] === null && m.e.vencimiento?.clase === CLASES.ELECCION_SORTEO) {
          pide(m, a, 'elegir_carta_sorteo', { ronda: m.e.sorteo.ronda, carta: cartaEnVivo(a) })
          cambio = true
        }
      })
    }
    // El volteo dura lo sellado de la lámina; el reparto del sorteo, lo de repartir de una en
    // una a quienes participan (3.ª vuelta; el árbitro real reparte por oleadas hasta la v1.3).
    const extra = v.clase === CLASES.VOLTEO_SORTEO ? VOLTEO_LAMINA_MS - VOLTEO_SORTEO_MS
      : v.clase === CLASES.REPARTO_SORTEO ? esperaRepartoSorteo(sorteo.participan.length) - ESPERA_REPARTO_SORTEO_MS : 0
    if (!cambio && m.e.vencimiento === v && m.t >= v.hora + extra) {
      m.t = Math.max(m.t, v.hora)
      pide(m, m.e.asientos.findIndex((a) => !a.abandonado), 'reclamar_vencimiento')
      cambio = true
    }
    if (cambio) poner()
  }

  return {
    marca: MARCA_PARTIDA_IMITADA,
    sala: { id: `imitada-${escena}`, apuesta: APUESTA, jugadores: n, entrada: 'corta', ritmo: 'normal', corteVoz: corte },
    // L-M 1 · lo que la capa del sorteo lee de la lámina.
    lamina: Object.freeze({
      corte, volteoMs: VOLTEO_LAMINA_MS,
      momento: vivo || !deLamina ? null : (momento ?? ESCENAS[escena].momento ?? null),
      // L-M 2 · las burbujas congeladas en su ms `msjMs`.
      msjMs: msj && !vivo ? msjMs : null,
    }),
    mensajes: {
      lista: () => mensajes,
      enviar: (clave) => {
        const motivo = rechazoDeMensaje(mensajes, 0, clave, ahora())
        if (motivo) return { ok: false, motivo }
        publica(0, REACCIONES.find((f) => codepointDe(f) === clave), ahora())
        poner()
        return { ok: true }
      },
    },
    iniciar: async () => {
      setRng(rng)
      if (guionVivo && !conductor) conductor = setInterval(conducir, 100)
      arrancarCharla()
      if (enPasos && golpeId === null) {
        golpeId = setInterval(() => {
          setRng(rng)
          if (enPasos.llega(m.e, m)) { clearInterval(golpeId); return }
          m.t = Math.max(m.t, ahora() + foto.desfase)
          paso(m, enPasos.guion)
          poner()
        }, vivo ? 1200 : 150)
      }
      if (golpe && golpeId === null) {
        golpeId = setTimeout(() => {
          setRng(rng)
          m.t = Math.max(m.t, ahora() + foto.desfase)
          golpe(m)
          poner()
        }, GOLPE_VIVO_MS)
      }
    },
    parar: () => {
      clearInterval(conductor); conductor = null
      clearInterval(charla); charla = null
      clearTimeout(golpeId); clearInterval(golpeId); golpeId = null
      resetRng()
    },
    revisar: () => {},
    releer: async () => {},
    suscribir: (avisar) => {
      oyentes.add(avisar)
      return () => oyentes.delete(avisar)
    },
    foto: () => foto,
    async enviar(accion, campos = {}) {
      if (m.muerta) {
        poner({ rechazo: { accion, motivo: MOTIVOS.PARTIDA_TERMINADA } })
        return { ok: false, motivo: MOTIVOS.PARTIDA_TERMINADA, version: m.e.version, ahora: m.t }
      }
      m.t = Math.max(m.t, ahora() + foto.desfase)
      const r = aplicarAccion(m.e, { uid: `imitado-${asiento}`, version: foto.version, accion, ...campos }, { ahora: m.t })
      m.e = r.estado
      poner(r.respuesta.ok ? {} : { rechazo: { accion, motivo: r.respuesta.motivo } })
      return { ...r.respuesta, ahora: m.t }
    },
    avanzar() {
      if (!partidaTerminada(m.e)) paso(m)
      poner()
    },
  }
}

// ── El mando ────────────────────────────────────────────────────────────────

/** `?pvp=<escena>&n=2..5&asiento=k&nombres=largo&ver=vivo&corte=0&momento=ms&msj=…&msjms=ms`. Detrás de la puerta doble. */
export function leerMandoPvP(search = globalThis.location?.search ?? '') {
  if (!import.meta.env.DEV) return null
  if (!import.meta.env.VITE_AUTH_BYPASS) return null
  const q = new URLSearchParams(search)
  const escena = q.get(PARAM_PVP)
  if (!ESCENAS_PVP.includes(escena)) return null
  const pedido = Number(q.get('n'))
  const n = pedido >= 2 && pedido <= 5 && Number.isInteger(pedido) ? pedido : 2
  const elegido = Number(q.get('asiento'))
  const asiento = Number.isInteger(elegido) && elegido >= 0 && elegido < n ? elegido : 0
  // L-M 1 · `ver=vivo` · `corte=0` (sin el corte de 10, para comparar) · `momento=<ms>` (congela
  // otro instante). La variante del mazo es la c (STOP-L2) y el corte, el de 10 (STOP-L3).
  const corte = q.get('corte') === '0' ? 0 : null
  const momento = q.has('momento') && Number.isFinite(Number(q.get('momento'))) ? Number(q.get('momento')) : null
  // L-M 2 · `msj=uno|todos|propio` (los mensajes) y `msjms=<ms>` (el instante de la burbuja
  // congelada).
  const msj = ['uno', 'todos', 'propio'].includes(q.get('msj')) ? q.get('msj') : null
  const msjMs = Number.isFinite(Number(q.get('msjms'))) && q.has('msjms') ? Number(q.get('msjms')) : 1200
  return {
    escena, n, asiento, nombres: q.get('nombres') === 'largo' ? 'largo' : null,
    vivo: q.get('ver') === 'vivo', corte, momento, msj, msjMs,
  }
}
