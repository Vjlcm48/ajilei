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
  CLASES, ETAPAS, MOTIVOS, aplicarAccion, crearPartida, huboRevelacion, partidaTerminada, puedeMandarMensaje, vistaDe,
} from '../arbitro/index.js'
import { REACCIONES } from '../config/reacciones.js'
import { CLAVES_MENSAJE, claveDeFrase, rechazoDeMensaje } from '../lib/mensajesMesaCore.js'
import { lecturaDeMano } from '../hooks/manoCore.js'

export const MARCA_PARTIDA_IMITADA = 'ajilei:partida-imitada'
export const PARAM_PVP = 'pvp'

const NOMBRES = ['Ana', 'Beto', 'Caro', 'Dani', 'Eli']
const NOMBRE_LARGO = 'W'.repeat(15)
const APUESTA = 100
// L-M 3 · la entrada corta de la mesa (`vistaAMesa.VECES_ENTRADA`) y el saldo de la lámina. Los
// rivales siempre pueden recargar.
const ENTRADA = 15 * APUESTA
const SALDO_LAMINA = 2400
const SALDO_RIVAL = 99999
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

function nuevaMesa({ n, asiento, nombres, ahora, saldo = SALDO_LAMINA }) {
  const sillas = Array.from({ length: n }, (_, i) => ({
    asiento: i, uid: `imitado-${i}`, nombre: nombres === 'largo' ? NOMBRE_LARGO : NOMBRES[i],
  }))
  return {
    n,
    yo: asiento,
    otro: (asiento + 1) % n,
    t: ahora,
    muerta: false,
    // v1.3-b · el saldo de cada asiento, el que la función leería con `leer_partida`.
    saldos: Array.from({ length: n }, (_, i) => (i === asiento ? saldo : SALDO_RIVAL)),
    e: crearPartida({ apuesta: APUESTA, entrada: 'corta', ritmo: 'normal' }, sillas, ahora),
  }
}

// v1.3-b · lo que la base haría con el efecto `recarga`: el saldo baja en lo recargado.
function cobrarRecargas(m, efectos) {
  for (const x of efectos) if (x.tipo === 'recarga') m.saldos[x.asiento] -= x.monto
}

function intenta(m, i, accion, campos = {}) {
  const peticion = { uid: `imitado-${i}`, version: m.e.version, accion, ...campos }
  const r = aplicarAccion(m.e, peticion, { ahora: m.t, saldos: m.saldos })
  if (r.respuesta.ok) {
    m.e = r.estado
    cobrarRecargas(m, r.efectos)
  }
  return r.respuesta
}

function pide(m, i, accion, campos = {}) {
  const r = intenta(m, i, accion, campos)
  if (!r.ok) throw new Error(`MES-PvP 2 · el guion pide lo ilegal: ${accion} del asiento ${i} → ${r.motivo}`)
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
// Árbitro v1.3 · el volteo de 5 s y el reparto según los participantes ya los lleva el árbitro
// (`config/esperas.js`): la lámina no alarga nada.

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
  'sorteo-vuelta': { guion: () => ({ carta: cartaParaGanar((m) => m.otro) }), llega: volteoDeRonda(1, (r, m) => r.mano === m.otro), momento: VOLTEO_SORTEO_MS - 600 },
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

// ── L-M 3 · Entre una mano y otra ───────────────────────────────────────────
// Ficha AJILEI_MES-PvP_LM-3_v1.0.md. Árbitro v1.3-b: la recarga PvP ya es del árbitro real (la
// oferta, sentado fuera, el pedido, la retención de 15 s): el imitado solo le pasa los saldos y
// los rivales que deciden recargan a los `RIVAL_DECIDE_MS`. Así la lámina y `diagDSK pvp` miden
// la vista que se publica.
const RIVAL_DECIDE_MS = 10000
const ESPERA_TURNO_LAMINA = 20000   // `TURN_TIME` (contrato §6): el turno y el descarte
// Entra con una sola apuesta: el ante se la lleva entera (all-in) y pierde en la revelación.
const quiebra = (quien) => (m) => {
  pila(m, quien(m), APUESTA)
  hasta(m, enPago)
  exige(m.e.motor.players[quien(m)].chips === 0)
}
// El que quebró no decide a tiempo y se salta la mano: llega al primer turno de la mano siguiente.
const sentadoFuera = (quien) => (m) => {
  quiebra(quien)(m)
  reclama(m)
  hasta(m, turnoDe)
}
// La apuesta del primero que habla y los demás se retiran: sin revelación, pausa de 4 s.
const retiradaRapida = { apuesta: ({ e }) => (e.motor.currentBet === 0 ? { tipo: 'apostar', k: 1 } : { tipo: 'retirarse' }) }

const ESCENAS_LM3 = {
  // §2 · la pausa tras la mano 1, a 2,5 s de vencer: la recogida, la mano 2 y la pastilla caen
  // solas (`deUnaVez`), y la escena se queda en el primer turno de la mano 2.
  'entre-manos': { jugar: (m) => hasta(m, enPago, retiradaRapida), deUnaVez: true },
  // §1 · quiebras y se te ofrece sola: la burbuja (con `&abierta=1`, la tarjeta).
  'recarga-ofrecida': { jugar: quiebra((m) => m.yo) },
  // §1 · tu pila está por debajo de la entrada: la moneda del ⋮ en la pausa (variante b).
  'recarga-voluntaria': {
    jugar: (m) => {
      pila(m, m.yo, 1000)
      hasta(m, enPago, retiradaRapida)
      const c = m.e.motor.players[m.yo].chips
      exige(c < ENTRADA && c >= APUESTA)
    },
  },
  // §1 · la voluntaria pedida durante la mano (b): el ⋮ la muestra y la puede anular; en vivo se
  // aplica al cerrarse la mano.
  'recarga-pedida': {
    jugar: (m) => {
      pila(m, m.yo, 1000)
      hastaTurnoAjeno(m)
      exige(m.e.motor.players[m.yo].chips < ENTRADA && !m.e.motor.players[m.yo].folded)
      pide(m, m.yo, 'pedir_recarga', { mano: m.e.motor.handCount })
    },
  },
  // §1 · el saldo no alcanza (900 HC para 1.500): la tarjeta lo dice, sin tienda.
  'recarga-sinsaldo': { jugar: quiebra((m) => m.yo), saldo: 900, abierta: true },
  // §1 · no decidiste a tiempo: la mano siguiente sin ti, y la oferta sigue.
  'recarga-fuera': { minimo: 3, jugar: sentadoFuera((m) => m.yo) },
  // §1 · lo que ven los demás: un rival decide en la pausa («Recargando»)…
  'recarga-ajena': { minimo: 3, jugar: quiebra((m) => m.otro) },
  // … y se salta la mano siguiente («Fuera de esta mano»).
  'recarga-ajena-fuera': { minimo: 3, jugar: sentadoFuera((m) => m.otro) },
  // §1 · la mesa de 2: el rival quebró, venció la pausa y la partida le retiene (`oferta_recarga`).
  // Solo en la de 2: con más, la mesa sigue sin él y se sienta fuera (`recarga-ajena-fuera`).
  'recarga-rival': { maximo: 2, jugar: (m) => { quiebra((x) => x.otro)(m); reclama(m) } },
  // §3 · la pausa de anuncio: «Premium · Pronto» abierta sobre la tarjeta de quien volvió antes.
  'anuncio-premium': { jugar: (m) => hasta(m, (e) => enPausa(e) && !e.asientos[m.yo].enAnuncio && e.asientos.some((a) => a.enAnuncio)), premium: true },
  // §3 · el cierre: en vivo, los demás vuelven del anuncio a los 3 s y la mano sigue…
  'anuncio-cierre': { jugar: (m) => hasta(m, (e) => enPausa(e) && !e.asientos[m.yo].enAnuncio && e.asientos.some((a) => a.enAnuncio)) },
  // 5a · H.2 · quiebras en una mano de anuncio (la 5): la oferta sigue viva en la pausa de
  // anuncio, con la burbuja sin anillo (su final no se sabe).
  'recarga-anuncio': {
    minimo: 3,
    jugar: (m) => {
      hasta(m, (e) => e.motor.handCount === 4 && enPago(e), retiradaRapida)
      pila(m, m.yo, APUESTA)
      hasta(m, (e) => e.motor.handCount === 5 && enPago(e))
      exige(m.e.motor.players[m.yo].chips === 0)
      hasta(m, enPausa)
    },
  },
  // … o nadie vuelve y vencen los 45 s (la escena llega con 6 s por delante).
  'anuncio-vence': {
    jugar: (m) => {
      hasta(m, (e) => enPausa(e) && !e.asientos[m.yo].enAnuncio && e.asientos.some((a) => a.enAnuncio))
      m.t = m.e.vencimiento.hora - 6000
    },
    nadieVuelve: true,
  },
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
  ...ESCENAS_LM3,
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
export const escenaCabeEn = (escena, n) => n >= (ESCENAS[escena].minimo ?? 2) && n <= (ESCENAS[escena].maximo ?? 5)

// ── El cliente imitado ──────────────────────────────────────────────────────

/**
 * @param {{ escena: string, n?: number, asiento?: number, nombres?: 'largo'|null, semilla?: number,
 *   ahora?: () => number }} pedido
 * @returns la forma de `crearClientePartida`, con `marca`, `sala` y `avanzar` (un paso de guion).
 */
export function crearPartidaImitada({
  escena, n = 2, asiento = 0, nombres = null, semilla = 1, ahora = Date.now, vivo = false, corte = null, momento = null,
  msj = null, msjMs = 1200, abierta = null, premium = null, saldo = null, lento = null,
}) {
  if (!ESCENAS[escena]) throw new Error(`MES-PvP 2 · escena desconocida: ${escena}`)
  if (!escenaCabeEn(escena, n)) throw new Error(`MES-PvP 2 · «${escena}» no cabe en una mesa de ${n}`)

  // v1.3-b · el saldo propio de la escena (el de los rivales siempre alcanza).
  const saldoPropio = saldo ?? ESCENAS[escena].saldo ?? SALDO_LAMINA
  // El azar del árbitro es global (`setRng`): se fija para llegar y al arrancar, y se suelta al parar.
  let m = null
  let rng = null
  let semillaBuena = null
  for (let s = semilla; s < semilla + TOPE_SEMILLAS && !m; s++) {
    rng = mulberry32(s)
    setRng(rng)
    const intento = nuevaMesa({ n, asiento, nombres, ahora: ahora(), saldo: saldoPropio })
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
    m = nuevaMesa({ n, asiento, nombres, ahora: ahora(), saldo: saldoPropio })
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
    m = nuevaMesa({ n, asiento, nombres, ahora: ahora(), saldo: saldoPropio })
    ESCENAS[escena].antes(m)
    resetRng()
  }
  let golpeId = null

  // ── L-M 3 · La recarga PvP, el anuncio y la transición ───────────────────
  const def = ESCENAS[escena]
  const esLM3 = !!ESCENAS_LM3[escena]
  // v1.3-b · de la recarga solo quedan los mandos de la lámina: la tarjeta abierta al llegar
  // (`abierta`), el anillo congelado y el saldo de la escena. Todo lo demás es del árbitro.
  const tarjetaAbierta = abierta ?? def.abierta ?? false
  const premiumAbierta = premium ?? def.premium ?? false
  if (def.deUnaVez) m.t = m.e.vencimiento.hora - GOLPE_VIVO_MS
  const handLlegada = m.e.motor.handCount

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
  const publica = (k, frase, hora) => mensajes.push({ id: ++idMsj, asiento: k, clave: claveDeFrase(frase), hora })
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
  // 5a · L2 · `lento=<ms>`: la primera vista llega tarde (la función en frío, la red lenta); el
  // árbitro corre igual desde que nace. Mientras, la mesa provisional, con las sillas de la sala.
  const nace = ahora()
  const oculta = () => lento !== null && ahora() < nace + lento
  let lentoId = null
  const fotoDe = (cambios = {}) => Object.freeze({
    vista: oculta() ? null : JSON.parse(JSON.stringify(vistaDe(m.e, asiento))),
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
    // Árbitro v1.3 · el volteo (5 s) y el reparto del sorteo (según los participantes) ya vencen
    // a su hora en el árbitro: nada que alargar.
    if (!cambio && m.e.vencimiento === v && m.t >= v.hora) {
      m.t = Math.max(m.t, v.hora)
      pide(m, m.e.asientos.findIndex((a) => !a.abandonado), 'reclamar_vencimiento')
      cambio = true
    }
    if (cambio) poner()
  }

  // L-M 3 · el conductor en vivo: manos seguidas a la hora real. Los rivales juegan a los 1,2 s
  // (con prudencia), tú a los 6 s si no has tocado nada; las esperas vencen a su hora. Con
  // `deUnaVez` (congelada), solo hasta el primer turno de la mano siguiente.
  let lm3 = null
  let base = 0
  const ofertaDesde = new Map()
  let llegada = null
  const pararLM3 = () => { clearInterval(lm3); lm3 = null }
  const conducirLM3 = () => {
    setRng(rng)
    m.t = ahora() + base
    llegada ??= m.t
    const e = m.e
    const v = e.vencimiento
    if (!v || partidaTerminada(e)) { pararLM3(); return }
    if (!vivo && turnoDe(e) && e.motor.handCount > handLlegada) { pararLM3(); return }
    let cambio = false
    // Los rivales que deciden (quebraron, o están sentados fuera) recargan a los `RIVAL_DECIDE_MS`:
    // si antes vence la pausa, el árbitro los sienta fuera (o los retiene, en la mesa de 2).
    e.asientos.forEach((a, i) => {
      if (i === m.yo || (a.fuera ?? null) === null || a.pedida) { ofertaDesde.delete(i); return }
      if (!ofertaDesde.has(i)) ofertaDesde.set(i, m.t)
      else if (m.t - ofertaDesde.get(i) >= RIVAL_DECIDE_MS && intenta(m, i, 'recargar', { mano: e.motor.handCount }).ok) {
        ofertaDesde.delete(i)
        cambio = true
      }
    })
    const desde = (ms) => m.t >= v.hora - ESPERA_TURNO_LAMINA + ms
    if (!cambio) {
      if (v.clase === CLASES.TURNO) {
        const i = e.motor.activePlayerIndex
        if (desde(i === m.yo ? 6000 : 1200)) { pide(m, i, 'apostar', apuestaPrudente(m, i)); cambio = true }
      } else if (v.clase === CLASES.DESCARTE) {
        const i = e.asientos.findIndex((_a, k) => !e.motor.players[k].folded && e.descarte[k] === null && desde(k === m.yo ? 6000 : 900 + 300 * k))
        if (i >= 0) { pide(m, i, 'descartar', { mano: e.motor.handCount, indices: [] }); cambio = true }
      } else if (v.clase === CLASES.PAUSA_ANUNCIO && !def.nadieVuelve) {
        // Los rivales vuelven del anuncio de uno en uno: a los 3 s de llegar y luego cada 1,5 s.
        const rivales = e.asientos.map((_a, k) => k).filter((k) => k !== m.yo && e.asientos[k].enAnuncio)
        if (rivales.length && m.t >= llegada + 3000) {
          pide(m, rivales[0], 'volver_anuncio', { mano: e.motor.handCount })
          llegada = m.t - 1500
          cambio = true
        }
      }
    }
    if (!cambio && m.t >= v.hora) {
      reclama(m)
      if (m.e.vencimiento?.clase === CLASES.PAUSA_ANUNCIO) llegada = m.t
      cambio = true
    }
    if (cambio) poner()
  }

  return {
    marca: MARCA_PARTIDA_IMITADA,
    sala: {
      id: `imitada-${escena}`, apuesta: APUESTA, jugadores: n, entrada: 'corta', ritmo: 'normal', corteVoz: corte,
      // 5a · L2 · lo que `SalaEspera` le pasa a la partida (`salaParaPartida`): la mesa provisional.
      ...(lento !== null ? { sillas: m.e.asientos.map((a, i) => ({ asiento: a.silla, nombre: a.nombre, tu: i === asiento })) } : {}),
    },
    // L-M 1 · lo que la capa del sorteo lee de la lámina.
    lamina: Object.freeze({
      corte,
      momento: vivo || !deLamina ? null : (momento ?? ESCENAS[escena].momento ?? null),
      // L-M 2 · las burbujas congeladas en su ms `msjMs`.
      msjMs: msj && !vivo ? msjMs : null,
      // L-M 3 · la tarjeta «Premium · Pronto» abierta.
      premium: premiumAbierta,
      // v1.3-b · la recarga: la tarjeta abierta al llegar, el anillo congelado en 3 s (en vivo
      // cuenta la pausa de verdad) y el saldo propio de la escena, que baja con cada recarga.
      abierta: tarjetaAbierta,
      fija: vivo ? null : 3,
      saldo: () => m.saldos[asiento],
      entreManos: esLM3,
    }),
    mensajes: {
      lista: () => mensajes,
      // v1.3 · las comprobaciones del árbitro real (`puedeMandarMensaje`: asiento, abandonado,
      // clave, en su anuncio) y el freno de la lámina, en vez del de `anotar_mensaje`.
      enviar: (clave) => {
        const puede = puedeMandarMensaje(m.e, m.e.asientos[asiento].uid, clave)
        if (!puede.ok) return { ok: false, motivo: puede.motivo }
        const motivo = rechazoDeMensaje(mensajes, 0, clave, ahora())
        if (motivo) return { ok: false, motivo }
        publica(0, REACCIONES[CLAVES_MENSAJE.indexOf(clave)], ahora())
        poner()
        return { ok: true }
      },
    },
    iniciar: async () => {
      setRng(rng)
      if (oculta() && lentoId === null) lentoId = setTimeout(() => poner(), nace + lento - ahora())
      if (guionVivo && !conductor) conductor = setInterval(conducir, 100)
      arrancarCharla()
      if (esLM3 && (vivo || def.deUnaVez) && !lm3) {
        base = m.t - ahora()
        lm3 = setInterval(conducirLM3, 100)
      }
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
      clearTimeout(lentoId); lentoId = null
      clearInterval(conductor); conductor = null
      clearInterval(charla); charla = null
      pararLM3()
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
      const r = aplicarAccion(m.e, { uid: `imitado-${asiento}`, version: foto.version, accion, ...campos }, { ahora: m.t, saldos: m.saldos })
      m.e = r.estado
      cobrarRecargas(m, r.efectos)
      poner(r.respuesta.ok ? {} : { rechazo: { accion, motivo: r.respuesta.motivo } })
      return { ...r.respuesta, ahora: m.t }
    },
    // v1.3-b · para el arnés: vuelve a publicar la foto (la lámina congelada no tiene reloj que lo
    // haga). Antes lo hacía, de rebote, `recarga.cerrar()`.
    repintar: () => poner(),
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
  // v1.3-b · y dentro de las mesas donde cabe la escena (`recarga-rival`, solo en la de 2).
  const valido = pedido >= 2 && pedido <= 5 && Number.isInteger(pedido) ? pedido : 2
  const n = Math.min(Math.max(valido, ESCENAS[escena].minimo ?? 2), ESCENAS[escena].maximo ?? 5)
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
  // L-M 3 · `abierta=1` (la tarjeta de la recarga), `premium=1` y `saldo=<HC>` (el saldo de la
  // lámina). Las variantes (`var`) se retiraron con las decisiones de Victor (STOP-L).
  const uno = (k) => (q.has(k) ? q.get(k) === '1' : null)
  const saldo = q.has('saldo') && Number.isFinite(Number(q.get('saldo'))) ? Number(q.get('saldo')) : null
  // 5a · `lento=<ms>`: la primera vista llega tarde y, mientras, se ve la mesa provisional (la
  // vara del arranque de `pvp.mesa` y la medida de quien llega tarde).
  const lento = q.has('lento') && Number(q.get('lento')) >= 0 ? Number(q.get('lento')) : null
  return {
    escena, n, asiento, nombres: q.get('nombres') === 'largo' ? 'largo' : null,
    vivo: q.get('ver') === 'vivo', corte, momento, msj, msjMs,
    abierta: uno('abierta'), premium: uno('premium'), saldo, lento,
  }
}
