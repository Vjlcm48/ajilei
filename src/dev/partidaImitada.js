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
import { AUSENTE_DESDE } from '../config/esperas.js'
import {
  CLASES, ETAPAS, MOTIVOS, aplicarAccion, crearPartida, huboRevelacion, partidaTerminada, vistaDe,
} from '../arbitro/index.js'

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
function cartaParaEmpatar(cuantos) {
  const planes = new Map()
  const plan = ({ sorteo }) => {
    const { participan, cartas } = sorteo
    const rangos = (a) => cartas[a].map((c) => drawRank(c.value))
    const quieren = Math.min(cuantos, participan.length)
    for (let r = 50; r >= 0; r--) {
      const tienen = participan.filter((a) => rangos(a).includes(r)).slice(0, quieren)
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

// Una por escena: `jugar(m)` llega o lanza `NoLlega`; `minimo` es la mesa más chica posible.
const ESCENAS = {
  'sorteo-baraja': { jugar: () => {} },
  'sorteo-oleadas': { jugar: (m) => hasta(m, (e) => e.sorteo.etapa === ETAPAS.REPARTO) },
  'sorteo-eleccion': { jugar: (m) => hasta(m, (e) => e.sorteo.etapa === ETAPAS.ELECCION) },
  'sorteo-empate-2': { jugar: (m) => empate(m, 2, (e) => enVolteo(e) && ultimaRonda(e).empatados.length === 2) },
  'sorteo-empate-3': { minimo: 3, jugar: (m) => empate(m, 3, (e) => enVolteo(e) && ultimaRonda(e).empatados.length === 3) },
  'sorteo-azar': { jugar: (m) => empate(m, 2, (e) => enVolteo(e) && ultimaRonda(e).azar) },
  'turno-propio': { jugar: hastaTurnoPropio },
  'turno-ajeno': { jugar: hastaTurnoAjeno },
  // El propio ya descartó y espera a los demás.
  'descarte-espera': {
    jugar: (m) => hasta(m, (e) => e.motor.phase === PHASES.DISCARD && e.descarte[m.yo] !== null, { descarte: () => [0] }),
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
  // Un rival abandona con la mano en curso, en el turno del propio.
  abandono: {
    jugar: (m) => {
      hastaTurnoPropio(m)
      pide(m, m.otro, 'abandonar')
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
  // El propio abandona y cobra, con la partida sin terminar.
  'final-fuera': {
    jugar: (m) => {
      hastaPrimeraApuesta(m)
      pide(m, m.yo, 'abandonar')
      hasta(m, (e) => e.asientos[m.yo].cobrado !== null)
      exige(!partidaTerminada(m.e))
    },
  },
  muerta: {
    jugar: (m) => {
      hastaTurnoAjeno(m)
      m.muerta = true
    },
  },
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
export function crearPartidaImitada({ escena, n = 2, asiento = 0, nombres = null, semilla = 1, ahora = Date.now }) {
  if (!ESCENAS[escena]) throw new Error(`MES-PvP 2 · escena desconocida: ${escena}`)
  if (!escenaCabeEn(escena, n)) throw new Error(`MES-PvP 2 · «${escena}» no cabe en una mesa de ${n}`)

  // El azar del árbitro es global (`setRng`): se fija para llegar y al arrancar, y se suelta al parar.
  let m = null
  let rng = null
  for (let s = semilla; s < semilla + TOPE_SEMILLAS && !m; s++) {
    rng = mulberry32(s)
    setRng(rng)
    const intento = nuevaMesa({ n, asiento, nombres, ahora: ahora() })
    try {
      ESCENAS[escena].jugar(intento)
      m = intento
    } catch (e) {
      if (!(e instanceof NoLlega)) throw e
    }
  }
  resetRng()
  if (!m) throw new Error(`MES-PvP 2 · «${escena}» no llega en ${TOPE_SEMILLAS} semillas`)

  const oyentes = new Set()
  const desfaseDeAhora = () => m.t - ahora()
  const fotoDe = (cambios = {}) => Object.freeze({
    vista: JSON.parse(JSON.stringify(vistaDe(m.e, asiento))),
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

  return {
    marca: MARCA_PARTIDA_IMITADA,
    sala: { id: `imitada-${escena}`, apuesta: APUESTA, jugadores: n, entrada: 'corta', ritmo: 'normal' },
    iniciar: async () => { setRng(rng) },
    parar: () => { resetRng() },
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

/** `?pvp=<escena>&n=2..5&asiento=k&nombres=largo`. Detrás de la puerta doble. */
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
  return { escena, n, asiento, nombres: q.get('nombres') === 'largo' ? 'largo' : null }
}
