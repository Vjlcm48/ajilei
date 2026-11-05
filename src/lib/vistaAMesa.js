// ── MES-PvP 2 · De la vista del servidor al `game` que la mesa sabe pintar ──
// Normativo: docs/AJILEI_MOT-1_Contrato_v1.0.md §1 y §4. Diagnóstico: informe de la
// Fase 0 de MES-PvP, §B.3 y §C. Puro, sin React ni DOM. Nace en el trozo de la partida
// (`trozos.partidaPvP`), nunca en la entrada (INV-84).
//
// LA ROTACIÓN. La mesa da por hecho que el jugador es el asiento 0 (`seatLayouts.js`,
// protegido). Aquí se rota: `i' = (i − asiento + N) % N`, sobre todo lo que lleve un
// índice. El orden circular y el sentido se conservan, así que el desempate por cercanía
// a la Mano sale igual desde cualquier silla. Las acciones no llevan asiento: no hay
// rotación de vuelta.
//
// `previa` ES EL `game` ANTERIOR, no la vista anterior: `eliminatedNames` compara contra
// lo que la mesa estaba pintando, y quien cobró en el pago seguía pintado (ver abajo).
//
// LAS DOS TRAMPAS DEL PAGO (§B.3):
//   · Quien abandona y cobra en este cierre ya viene `eliminated` con `chips: 0`: su panel
//     se iría en plena revelación, el vuelo se quedaría sin destino y la pila retenida
//     saldría negativa. Sigue visible, con lo cobrado como pila, hasta la mano siguiente.
//   · Con el asiento propio `eliminated` y la mesa viva, `effectiveLayout` da una posición
//     `undefined` al último rival. El jugador sale a su pantalla final (`escena: 'fuera'`),
//     pero la mesa nunca recibe ese estado, ni durante un render.
//
// `isHuman` no se inventa: la voz entre personas no depende de él (`hooks/vozHumanos.js`).

import { t } from '../config/textos'
import { VOZ } from '../hooks/cronicaCore'

// Literales de contrato, sin importar el motor; `vistaAMesa.test.js` los ancla.
export const FASE_PAGO = 'PAYOUT'
export const FASE_FIN_MESA = 'GAME_OVER'
export const FASES_APUESTA = Object.freeze(['BET_1', 'BET_2', 'BET_3'])
// Contrato §1: las pilas de las dos entradas.
export const VECES_ENTRADA = Object.freeze({ corta: 15, llena: 50 })

const dorsos = (asiento, cuantas) => Array.from({ length: cuantas }, (_, k) => ({ id: `dorso-${asiento}-${k}`, dorso: true }))

export const mismaAccion = (a, b) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null)

// La última jugada de cada asiento, hasta la mano siguiente: la vista solo trae la de la
// mesa, así que cada asiento conserva la suya de la lectura anterior.
function ultimaDe(id, { ultimaAccion, descarte }, previa, mismaMano) {
  const antes = previa?.players[id]
  let ultima = mismaMano ? antes.ultima : null
  const cuantas = descarte.cuantas?.[id] ?? null
  if (cuantas !== null && (!mismaMano || (previa.descarte.cuantas?.[id] ?? null) === null)) ultima = { tipo: 'descarto', n: cuantas }
  if (ultimaAccion?.asiento === id && !mismaAccion(ultimaAccion, previa?.ultimaAccion)) ultima = { tipo: ultimaAccion.tipo }
  return ultima
}

/**
 * @param {object} vista la fila de `partida_vistas` (contrato §4)
 * @param {object|null} previa el `game` que devolvió la lectura anterior
 * @param {{ entrada?: string, ritmo?: string }|null} sala la fila de la mesa
 * @returns {object} el `game` de la mesa, con el jugador en el índice 0
 */
export function vistaAMesa(vista, previa, sala) {
  const N = vista.players.length
  const { asiento, phase } = vista
  const rotar = (i) => (i === null ? null : (i - asiento + N) % N)
  const rotarLista = (lista) => lista.map((_, k) => lista[(k + asiento) % N])
  const mismaMano = previa?.handCount === vista.handCount
  const enPago = phase === FASE_PAGO
  const enFin = phase === FASE_FIN_MESA

  const revelacion = vista.resultado?.revelacion ?? []
  const activo = rotar(vista.activePlayerIndex)
  const comun = {
    ultimaAccion: vista.ultimaAccion && { ...vista.ultimaAccion, asiento: rotar(vista.ultimaAccion.asiento) },
    descarte: {
      yaDescartaron: vista.descarte.yaDescartaron.map(rotar),
      cuantas: vista.descarte.cuantas && rotarLista(vista.descarte.cuantas),
    },
  }
  const entrada = VECES_ENTRADA[sala?.entrada ?? 'corta'] * vista.unit

  const players = rotarLista(vista.players).map((p, id) => {
    const real = (id + asiento) % N
    const sigueEnPago = enPago && p.cobrado !== null && p.numCartas > 0
    const revelado = revelacion.find((r) => r.asiento === real)
    return {
      ...p,
      id,
      entrada,
      cards: p.cards ?? revelado?.cards ?? dorsos(real, p.numCartas),
      score: revelado?.score ?? null,
      chips: sigueEnPago ? p.cobrado : p.chips,
      eliminated: p.eliminated && !sigueEnPago && (id !== 0 || enFin),
      turno: id === activo && FASES_APUESTA.includes(phase),
      ultima: ultimaDe(id, comun, previa, mismaMano),
    }
  })

  const vivos = players.filter((p) => !p.eliminated)
  const nuevos = previa ? players.filter((p, i) => p.eliminated && !previa.players[i].eliminated).map((p) => p.name) : []
  // En el fin, la mesa es de quien no está eliminado (`startHand`, y aquí sale igual).
  const ganadorDelFin = players.findIndex((p) => !p.eliminated)

  return {
    voz: VOZ.HUMANOS,
    version: vista.version,
    phase,
    numPlayers: N,
    aliveCount: vivos.length,
    players,
    eliminatedNames: [...(mismaMano ? previa.eliminatedNames : []), ...nuevos],
    selectedDiscards: mismaMano ? previa.selectedDiscards : [],
    currentBet: vista.currentBet,
    unit: vista.unit,
    pot: vista.pot,
    capas: vista.capas.map((c) => ({ ...c, elegibles: c.elegibles.map(rotar).sort((a, b) => a - b) })),
    activePlayerIndex: activo,
    manoIndex: rotar(vista.manoIndex),
    pieIndex: rotar(vista.pieIndex),
    handRules: vista.handRules,
    handCount: vista.handCount,
    winner: enPago ? rotar(vista.resultado.ganador) : enFin && ganadorDelFin >= 0 ? ganadorDelFin : null,
    vencimiento: vista.vencimiento,
    ...comun,
    sorteo: {
      ...vista.sorteo,
      participan: vista.sorteo.participan.map(rotar),
      yaEligieron: vista.sorteo.yaEligieron.map(rotar),
      rondas: vista.sorteo.rondas.map((r) => ({
        ...r,
        volteo: r.volteo.map((v) => ({ ...v, asiento: rotar(v.asiento) })),
        empatados: r.empatados.map(rotar),
        mano: rotar(r.mano),
      })),
    },
    resultado: vista.resultado && {
      ...vista.resultado,
      ganador: rotar(vista.resultado.ganador),
      ganadoresPorCapa: vista.resultado.ganadoresPorCapa.map((g) => (g < 0 ? g : rotar(g))),
      ...(vista.resultado.revelacion ? { revelacion: revelacion.map((r) => ({ ...r, asiento: rotar(r.asiento) })) } : {}),
    },
  }
}

// ── El rótulo de un asiento ─────────────────────────────────────────────────
// Una sola regla para las dos vías de render (`.opp-status` y `.ai-zone`), como
// `claseDelMensaje` en la mesa. El orden es lo que importa:
//   1. Abandonó: es definitivo y dice por qué ya no juega, aunque también esté retirado.
//   2. En anuncio: pasa durante el pago, cuando quien se retiró en la mano sigue `folded`;
//      lo que hace esperar a la mesa es el anuncio, no aquella retirada.
//   3. Retirado · 4. All-in: el orden que ya tiene la mesa contra las IAS. Ninguno de los
//      dos consume reloj de apuesta, así que «ausente» no explicaría nada.
//   5. Ausente: va antes del turno porque es lo que explica la espera, y el turno ya lo
//      señalan el borde y la marca del panel.
//   6. Su turno · 7. Última acción: el orden de la mesa contra las IAS.
const CLAVES_ACCION = { pasar: 'pvp.asiento.paso', apostar: 'pvp.asiento.aposto', igualar: 'pvp.asiento.igualo', subir: 'pvp.asiento.subio' }

export function estadoDeAsiento(seat) {
  if (seat.abandonado) return { tipo: 'abandono', texto: t('pvp.asiento.abandono') }
  if (seat.enAnuncio) return { tipo: 'anuncio', texto: t('pvp.asiento.anuncio') }
  if (seat.folded) return { tipo: 'retirado', texto: t('pvp.asiento.retirado') }
  if (seat.allIn) return { tipo: 'allin', texto: t('ia.mesa.marca.allin') }
  if (seat.ausente) return { tipo: 'ausente', texto: t('pvp.asiento.ausente') }
  if (seat.turno) return { tipo: 'turno', texto: t('pvp.asiento.turno') }
  if (seat.ultima?.tipo === 'descarto') return { tipo: 'accion', texto: t('pvp.asiento.descarto', { n: seat.ultima.n }) }
  const clave = CLAVES_ACCION[seat.ultima?.tipo]
  return clave ? { tipo: 'accion', texto: t(clave) } : { tipo: null, texto: '' }
}
