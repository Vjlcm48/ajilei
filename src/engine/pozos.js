// ── APU-1 · Pozos, legalidad y costo de las acciones ──────────────────────────
//
// Módulo PURO. Sin React, sin DOM, sin Howler, sin Node, sin estado de módulo.
// No importa `gameEngine.js` (protegido) ni lo importa él a medias: el motor lo
// consulta, nunca al revés.
//
// Es la corrección del riesgo R-5 del diagnóstico: hoy «cuánto cuesta» y «no
// cubre» viven en cuatro sitios (motor, IA, pantalla, y la aritmética suelta de
// cada uno). Desde APU-1 viven aquí, y el motor, la IA y la pantalla preguntan.
//
// Normativo: `docs/AJILEI_APU-1_Reglas_v1.1.md` §3.2 (legalidad), §4.1 (all-in
// defensivo) y §4.2 (capas). Donde el código y ese documento difieran, el
// código está equivocado.

import { AJILEI_CONFIG } from '../config/ajileiConfig.js'

// Las tres fases con apuesta, por su nombre de contrato (normativo §1). Se
// escriben aquí y no se importan de `gameEngine.PHASES` para no atar un módulo
// puro a un protegido; son cadenas de contrato, no una copia de lógica.
const FASES_CON_APUESTA = ['BET_1', 'BET_2', 'BET_3']

// Los multiplicadores son PARÁMETRO, no constante suelta (normativo §0), para
// que la simulación de la Fase 1d pueda barrerlos.
const MULTS = () => AJILEI_CONFIG.betting.multiplicadores

// Motivos de rechazo. Son CONTRATO: el árbitro de MOT-1 y la pantalla los leen
// como cadenas, así que no se renombran sin cambiar el normativo.
export const MOTIVOS = Object.freeze({
  FUERA_DE_TURNO:    'fuera_de_turno',
  RETIRADO:          'retirado',
  EN_ALL_IN:         'en_all_in',
  MONTO_INVALIDO:    'monto_invalido',
  NO_ALCANZA:        'no_alcanza',
  HAY_APUESTA:       'hay_apuesta',
  SIN_APUESTA:       'sin_apuesta',
  ALL_IN_NO_PROCEDE: 'all_in_no_procede',
  FASE:              'fase',
  DESCONOCIDA:       'accion_desconocida',
  SIN_RIVAL:         'sin_rival',
})

// Orden fijo de la fila de acciones. `accionesDe` lo respeta.
export const ACCIONES = Object.freeze([
  'pasar', 'apostar', 'igualar', 'subir', 'allIn', 'retirarse',
])

const OK = Object.freeze({ ok: true, motivo: null })
const no = motivo => ({ ok: false, motivo })

const entero = n => Number.isInteger(n)

// Lo que le falta a ese asiento para igualar la apuesta viva de la ronda.
// Nunca negativo: es un costo, no una diferencia.
function faltaPorIgualar(state, p) {
  return Math.max(0, (state.currentBet ?? 0) - (p.contrib ?? 0))
}

// ¿Queda alguien que pueda CONTESTAR? (ficha 1c §2.1, undécimo motivo)
//
// Una apuesta que nadie puede igualar ni subir no es una apuesta: es dinero
// echado a un pozo que ya está cerrado, y vuelve entero por la capa superior
// (§4.2, D-7). Con el all-in de APU-1 el caso deja de ser teórico —en mesa de
// dos, en cuanto el rival empuja su pila, el otro asiento tiene enfrente una
// ronda donde solo cabe pagar o soltar—, así que `apostar` y `subir` se
// retiran de la fila en vez de ofrecerse y no hacer nada.
//
// Rival es OTRO asiento no retirado, no eliminado, no en all-in y con fichas.
// Un all-in con fichas 0 no cuenta: ya no puede poner una sola más.
function hayRival(state, seat) {
  const players = state?.players ?? []
  return players.some((p, i) => (
    i !== seat && !p.folded && !p.eliminated && !p.allIn && (p.chips ?? 0) > 0
  ))
}

// ── Costo ─────────────────────────────────────────────────────────────────────
//
// Cuántas fichas cuesta esa acción a ese asiento AHORA MISMO. Siempre entero
// ≥ 0. Un `k` inválido no es una pregunta de costo sino de legalidad: aquí
// devuelve 0 y `esLegal` lo rechaza con `monto_invalido`. El motor pregunta
// SIEMPRE a `esLegal` antes de aplicar (ficha 1b, E-10c), así que un costo 0
// por `k` inválido no llega nunca al pozo.
export function costoDe(state, seat, accion, k = 1) {
  const p = state?.players?.[seat]
  if (!p) return 0
  const unit = state.unit ?? 0

  switch (accion) {
    case 'pasar':
    case 'retirarse':
      return 0
    case 'apostar':
      return entero(k) ? Math.max(0, k * unit) : 0
    case 'subir':
      return entero(k)
        ? Math.max(0, (state.currentBet ?? 0) + k * unit - (p.contrib ?? 0))
        : 0
    case 'igualar':
      return faltaPorIgualar(state, p)
    case 'allIn':
      return Math.max(0, p.chips ?? 0)
    default:
      return 0
  }
}

// ── Legalidad ─────────────────────────────────────────────────────────────────
//
// El orden de las comprobaciones es contrato de las pruebas: primero lo que no
// depende de la acción (fase, estado del asiento, turno) y después lo propio de
// cada acción. `retirado` y `en_all_in` van ANTES que `fuera_de_turno` a
// propósito: un asiento retirado nunca es el activo, y si `fuera_de_turno`
// fuera primero jamás se podría observar el motivo verdadero.
export function esLegal(state, seat, accion, k = 1) {
  const p = state?.players?.[seat]
  if (!p) return no(MOTIVOS.RETIRADO)

  if (!FASES_CON_APUESTA.includes(state.phase)) return no(MOTIVOS.FASE)
  if (p.folded || p.eliminated)                  return no(MOTIVOS.RETIRADO)
  if (p.allIn)                                   return no(MOTIVOS.EN_ALL_IN)
  if (state.activePlayerIndex !== seat)           return no(MOTIVOS.FUERA_DE_TURNO)

  const falta  = faltaPorIgualar(state, p)
  const viva   = falta > 0          // hay apuesta viva PARA ESTE ASIENTO
  const chips  = p.chips ?? 0
  const unit   = state.unit ?? 0

  switch (accion) {
    case 'retirarse':
      return OK

    case 'pasar':
      return viva ? no(MOTIVOS.HAY_APUESTA) : OK

    case 'apostar': {
      if (viva) return no(MOTIVOS.HAY_APUESTA)
      if (!hayRival(state, seat)) return no(MOTIVOS.SIN_RIVAL)
      if (!entero(k) || k <= 0 || !MULTS().includes(k) || !entero(unit) || unit <= 0) {
        return no(MOTIVOS.MONTO_INVALIDO)
      }
      return costoDe(state, seat, 'apostar', k) <= chips ? OK : no(MOTIVOS.NO_ALCANZA)
    }

    case 'igualar': {
      if (!viva) return no(MOTIVOS.SIN_APUESTA)
      return falta <= chips ? OK : no(MOTIVOS.NO_ALCANZA)
    }

    case 'subir': {
      if (!viva) return no(MOTIVOS.SIN_APUESTA)
      if (!hayRival(state, seat)) return no(MOTIVOS.SIN_RIVAL)
      if (!entero(k) || k <= 0 || !MULTS().includes(k) || !entero(unit) || unit <= 0) {
        return no(MOTIVOS.MONTO_INVALIDO)
      }
      return costoDe(state, seat, 'subir', k) <= chips ? OK : no(MOTIVOS.NO_ALCANZA)
    }

    // §4.1: el all-in es SOLO defensivo. Existe únicamente cuando hay apuesta
    // viva y la pila no alcanza para igualarla. Nadie empuja su pila entera por
    // voluntad propia.
    // Con la pila en cero también procede: poner 0 no mueve dinero, pero deja
    // al asiento marcado y en pie para disputar las capas que ya pagó. Lo
    // contrario —forzarlo a retirarse— le quitaría lo que ya puso, que es justo
    // el defecto que APU-1 corrige.
    case 'allIn':
      return falta <= chips ? no(MOTIVOS.ALL_IN_NO_PROCEDE) : OK

    default:
      return no(MOTIVOS.DESCONOCIDA)
  }
}

// ── Acciones disponibles ──────────────────────────────────────────────────────
//
// Sustituye a `canPass/canBet/canCall/canRaise` (`GameTable.jsx:972-976`) y a
// las guardas de saldo de la IA. Se DERIVA de `esLegal` en vez de repetir sus
// condiciones: así no pueden divergir nunca, que es justo el defecto que R-5
// describe. Un asiento retirado, en all-in, eliminado o fuera de turno devuelve
// `[]`; fuera de las fases con apuesta, también.
export function accionesDe(state, seat) {
  return ACCIONES.filter(a => esLegal(state, seat, a, 1).ok)
}

// ── ¿Queda ronda que jugar? (§4.3 y D-12) ───────────────────────────
//
// El motor tiene su `isRoundOver`, pero es PRIVADA: no se exporta, y
// `gameEngine.js` está protegido. Quien necesita la misma pregunta sin poder
// llamarla —la pantalla para sus afidávits, las pruebas para confrontarla— la
// encuentra aquí, mismo trato que el desempate de `ganadoresPorCapa`, que
// también se REPLICA a propósito para no atar este módulo puro al protegido.
//
// Que sean dos copias de la misma regla es una deuda REAL, no un descuido, y se
// paga con la prueba que las confronta sobre los mismos estados: si alguna vez
// divergen, falla ahí y no en una mesa clavada. En 1e-iii esa prueba se cobró
// el sueldo: las dos copias se editaron a la vez y la confrontación es lo que
// demuestra que siguen diciendo lo mismo.

// Los asientos que TODAVÍA pueden poner una ficha. Es `pendientes` del motor,
// con `eliminated` escrito aparte por claridad —un eliminado tiene la pila en
// cero, así que `chips > 0` ya lo dejaba fuera—.
export function puedenHablar(state) {
  const players = state?.players ?? []
  return players.reduce(
    (ids, p, i) => (!p.folded && !p.eliminated && !p.allIn && (p.chips ?? 0) > 0 ? [...ids, i] : ids),
    []
  )
}

// ¿Está esta ronda cerrada? Es la copia pública del `isRoundOver` privado del
// motor, palabra por palabra, y su único oficio es poder confrontarse con él
// desde una prueba: si alguna vez divergen, falla ahí y no en una mesa clavada.
//
// APU-1 1e-iii · aquí también estuvo el corte de E-13 (`pend.length <= 1`), y
// aquí también se fue. La ronda se cierra cuando no queda con quién jugarla
// (un solo asiento en pie) o cuando TODO pendiente ha hablado y ha igualado la
// apuesta viva — un pendiente que todavía no ha hablado la mantiene abierta,
// aunque sea el último, que es justo el caso del all-in por responder.
// La lista vacía cierra sola: `every` sobre `[]` es `true`.
//
// §4.3 ya no se contesta desde aquí. Una ronda de apuesta sin juego no se
// cierra: NO SE ABRE, y eso lo decide el motor al entrar en la fase.
export function rondaCerrada(state) {
  const players = state?.players ?? []
  const enPie = players.filter(p => !p.folded)
  if (enPie.length <= 1) return true
  const pend = puedenHablar(state)
  return pend.every(i => players[i].acted && (players[i].contrib ?? 0) === (state.currentBet ?? 0))
}

// ── Capas del pozo ────────────────────────────────────────────────────────────
//
// Fórmula del normativo §4.2, con `C_i = contribMano` (contribución total a la
// mano, ante incluido):
//
//   capa_k             = Σ_i [ min(C_i, a_k) − min(C_i, a_(k−1)) ]   con a_0 = 0
//   elegibles_k        = no retirados con C_i ≥ a_k
//   capa_superior      = Σ_i [ C_i − min(C_i, a_n) ]
//   elegibles_superior = no retirados y no all-in
//
// Los niveles `a_k` son las contribuciones totales de quienes fueron all-in y
// NO se retiraron, ordenadas y sin repetir. Las capas de monto 0 se omiten.
//
// Es PURA y no guarda nada: el estado no lleva capas (decisión §E-1 del rector).
// Se puede llamar a mitad de ronda para ENSEÑAR el pozo dividido y al cierre de
// mano para REPARTIRLO, y las dos llamadas dan lo mismo sobre el mismo estado.
//
// Invariante: `Σ monto === state.pot`.

// Contribución total de un asiento a la mano (ante incluido).
const C = p => Math.max(0, p.contribMano ?? 0)

// Los niveles `a_1 < a_2 < … < a_n` de la fórmula: las contribuciones totales
// de quienes fueron all-in y no se retiraron, ordenadas y sin repetir.
function nivelesDe(players) {
  return [...new Set(
    players.filter(p => p.allIn && !p.folded).map(C).filter(a => a > 0)
  )].sort((x, y) => x - y)
}

export function capasDe(state) {
  const players = state?.players ?? []
  const niveles = nivelesDe(players)

  const capas = []
  let previo = 0

  for (const a of niveles) {
    const monto = players.reduce(
      (s, p) => s + (Math.min(C(p), a) - Math.min(C(p), previo)), 0
    )
    if (monto > 0) {
      capas.push({
        monto,
        elegibles: players.reduce(
          (ids, p, i) => (!p.folded && C(p) >= a ? [...ids, i] : ids), []
        ),
      })
    }
    previo = a
  }

  const tope = niveles.length ? niveles[niveles.length - 1] : 0
  const montoSuperior = players.reduce(
    (s, p) => s + (C(p) - Math.min(C(p), tope)), 0
  )
  if (montoSuperior > 0) {
    capas.push({
      monto: montoSuperior,
      elegibles: players.reduce(
        (ids, p, i) => (!p.folded && !p.allIn ? [...ids, i] : ids), []
      ),
    })
  }

  return capas
}

// ── Ganador de cada capa ──────────────────────────────────────────────────────
//
// `puntajeDe(player)` se inyecta para que las pruebas usen puntajes fijos y
// para que este módulo no dependa de `handEvaluator`.
//
// El desempate es el vigente del motor (`gameEngine.js:157-163`): gana el más
// cercano a la Mano recorriendo asientos desde `manoIndex`. Se REPLICA aquí a
// propósito —no se importa— para que `pozos.js` no dependa del protegido.
//
// Devuelve un asiento por capa, en el mismo orden que `capasDe`. Una capa sin
// elegibles devuelve **`-1`**, que no significa «se pierde» sino «vuelve a
// quien la puso»: es la apuesta no igualada, y la reparte `repartirCapas`
// (decisión D-7 de esta fase).
export function ganadoresPorCapa(state, puntajeDe) {
  const players   = state?.players ?? []
  const N         = players.length
  const manoIndex = state?.manoIndex ?? 0

  return capasDe(state).map(capa => {
    if (!capa.elegibles.length) return -1

    const puntajes = capa.elegibles.map(i => puntajeDe(players[i], i) ?? 0)
    const mejor    = Math.max(...puntajes)
    const empatan  = capa.elegibles.filter((_, j) => puntajes[j] === mejor)

    for (let offset = 0; offset < N; offset++) {
      const seat = (manoIndex + offset) % N
      if (empatan.includes(seat)) return seat
    }
    return empatan[0]
  })
}

// ── Reparto ───────────────────────────────────────────────────────────────────
//
// Suma cada capa a su ganador y devuelve un `players` NUEVO (no muta la
// entrada). Aritmética entera, sin sobrantes: `Σ de lo sumado === state.pot`,
// **siempre**, sin excepciones.
//
// D-7: una capa sin elegibles es la APUESTA NO IGUALADA. No se pierde: vuelve a
// quien la puso, cada uno lo suyo (`C_i − min(C_i, a_n)`), que es reparto exacto
// en enteros y no necesita división. Solo la capa superior puede quedarse sin
// elegibles —toda capa intermedia tiene al menos al all-in que la define—, así
// que el tramo devuelto es siempre el que va por encima del último nivel.
//
// El invariante tiene que ser TOTAL y no «salvo un caso que demostramos
// imposible»: el árbitro de MOT-1 no puede tener un estado en el que
// `Σ repartido < pot`.
export function repartirCapas(state, ganadores) {
  const capas   = capasDe(state)
  const players = state?.players ?? []
  const tope    = nivelesDe(players).slice(-1)[0] ?? 0

  const premio = new Array(players.length).fill(0)
  capas.forEach((capa, k) => {
    if (!capa.elegibles.length) {
      players.forEach((p, i) => { premio[i] += C(p) - Math.min(C(p), tope) })
      return
    }
    const g = ganadores[k]
    if (g >= 0 && g < players.length) premio[g] += capa.monto
  })

  return players.map((p, i) =>
    premio[i] > 0 ? { ...p, chips: (p.chips ?? 0) + premio[i] } : p
  )
}
