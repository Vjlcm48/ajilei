// ── MES-PvP 2 · El controlador de la mesa contra personas ───────────────────
// Diagnóstico: informe de la Fase 0 de MES-PvP, §B.2, §B.7 y §B.10. Molde de la casa
// (`creaCongelador`, `coreografiaCore`): el núcleo se prueba y el hook solo ejecuta.
//
// Envuelve la `partida` (`crearClientePartida`, o su imitación con la misma forma) y deja
// una foto: `{ game, cronica, enviar, reloj, escena, mesa, ritmo, alternarDescarte, fin }`. La foto solo cambia si
// cambia algo que se pinta: el reloj se revisa cuatro veces por segundo, y la mesa se
// repinta una, cuando cambia el segundo.
import { PHASES, makeHandRules, toggleDiscard } from '../engine/gameEngine'
import {
  ELECCION_SORTEO_MS, LECTURA_TRAS_REVELACION_MS, MANO_SIGUIENTE_MS, PAUSA_ANUNCIO_MS, RED_REVELACION_MS, TURN_TIME,
} from '../config/esperas'
import {
  CLASE_DESCARTE, CLASE_ELECCION, CLASE_MANO_SIGUIENTE, CLASE_PAUSA_ANUNCIO, CLASE_TURNO, FASE_FIN, FASE_SORTEO, REVISION_MS,
} from '../lib/partidaCliente'
import { FACTOR_RAPIDA } from '../lib/partidaRapida'
import { FASE_PAGO, VECES_ENTRADA, vistaAMesa } from '../lib/vistaAMesa'
import { avisoDeAbandono, cronicaDe, finDePartida, nuevosAbandonos } from './vozHumanos'
import { CORTE_VOZ, conNombresDeVoz } from '../lib/corteVoz'

// MES-PvP 3-A · sin pozo que pagar, la pantalla final llega tras el aviso del óvalo (Reglas
// v1.7 §8.2: «unos 2-3 s»).
export const AVISO_FIN_MS = 2500

// Solo estas clases cuentan segundos en pantalla. Las demás son esperas de animación: no
// tienen reloj que pintar, y su `timeLeft` es `null`.
// El ritmo rápido de la mesa (`RITMOS.RAPIDO` del árbitro; la prueba lo ancla) escala el
// reparto como «Partida rápida» contra las IAS (contrato §6, «El ritmo»).
export const RITMO_RAPIDO = 'rapido'

export const TOPE_RELOJ_MS = Object.freeze({
  [CLASE_TURNO]: TURN_TIME * 1000,
  [CLASE_DESCARTE]: TURN_TIME * 1000,
  [CLASE_ELECCION]: ELECCION_SORTEO_MS,
  [CLASE_PAUSA_ANUNCIO]: PAUSA_ANUNCIO_MS,
})

/** El reloj de la mesa: `timeLeft` en segundos, entre 0 y el máximo de su clase. */
export function relojDe(vencimiento, horaServidor) {
  if (!vencimiento) return { clase: null, timeLeft: null }
  const tope = TOPE_RELOJ_MS[vencimiento.clase]
  if (!tope) return { clase: vencimiento.clase, timeLeft: null }
  const ms = Math.min(tope, Math.max(0, vencimiento.hora - horaServidor))
  return { clase: vencimiento.clase, timeLeft: Math.ceil(ms / 1000) }
}

// Qué pantalla toca. Quien ya no está en la mesa (abandonó o quebró) ve su pantalla final en
// el acto, sin espectador (Fase 0, P-5; Reglas v1.7 §8.2): manda sobre el fin de la partida y
// sobre la partida muerta, y así `effectiveLayout` no recibe nunca el asiento propio eliminado
// con la mesa viva. Después, el fin: si la partida acabó, no murió.
export function escenaDe(vista, muerta) {
  if (!vista) return 'arrancando'
  const propio = vista.players[vista.asiento]
  if (propio.abandonado || propio.eliminated) return 'final'
  if (vista.phase === FASE_FIN) return 'final'
  if (muerta) return 'muerta'
  if (vista.phase === FASE_SORTEO) return 'sorteo'
  if (vista.vencimiento?.clase === CLASE_PAUSA_ANUNCIO && propio.enAnuncio) return 'anuncio'
  return 'mesa'
}

// ── Sub-tanda 5a · La mesa provisional (Fase 0, §C.3 a) ─────────────────────
// Lo que se pinta desde el primer cuadro, antes de la primera vista: la vista que el árbitro
// publicará al crear la partida (`crearPartida` + `vistaDe`, en el barajado del sorteo), sacada
// de las sillas de la sala. Sin vencimiento, porque aún no hay hora del árbitro: el barajado es
// local hasta que llega la vista. `mesaPvPCore.test.js` la confronta con la del árbitro.
// `sala.sillas`: [{ asiento, nombre, tu }], las sentadas; sin ellas (quien vuelve por
// `mi_sala` a una partida que ya corre), no hay provisional.
export function vistaProvisional({ sillas, apuesta, entrada = 'corta' }) {
  const orden = [...(sillas ?? [])].sort((a, b) => a.asiento - b.asiento)
  const n = orden.length
  const asiento = orden.findIndex((s) => s.tu)
  if (n < 2 || n > 5 || asiento < 0) return null
  const chips = VECES_ENTRADA[entrada] * apuesta
  const todos = orden.map((_, i) => i)
  return {
    version: -1,
    asiento,
    phase: FASE_SORTEO,
    players: orden.map((s, i) => ({
      name: s.nombre ?? `Asiento ${i + 1}`, chips, contrib: 0, contribMano: 0, folded: false, allIn: false,
      eliminated: false, abandonado: false, cobrado: null, enAnuncio: false, ausente: false, numCartas: 0, recarga: null,
      ...(i === asiento ? { cards: [] } : {}),
    })),
    currentBet: 0,
    unit: apuesta,
    pot: 0,
    capas: [],
    activePlayerIndex: null,
    manoIndex: null,
    pieIndex: null,
    handRules: makeHandRules(n),
    handCount: 0,
    vencimiento: null,
    descarte: { yaDescartaron: [], cuantas: null },
    sorteo: { ronda: 1, etapa: 'barajado', participan: todos, posiciones: [], yaEligieron: [], elegidas: todos.map(() => null), rondas: [] },
    resultado: null,
    ultimaAccion: null,
    recarga: { monto: 0, oferta: false, pedida: false, cancelada: null, recargas: 0 },
  }
}

/**
 * @param {{ partida: object, sala: { id: string, ritmo?: string, entrada?: string },
 *   ahora?: () => number }} partes
 */
export function creaMesaPvP({ partida, sala, ahora = Date.now }) {
  // L-M 1 · el corte de los nombres en la voz (`lib/corteVoz`): 10, salvo que la sala diga otro
  // (la lámina, `&corte=0`, sin corte).
  const corte = sala.corteVoz ?? CORTE_VOZ
  const voz = (g) => conNombresDeVoz(g, corte)
  // 5a · la mesa provisional: escena `sorteo` desde el primer cuadro, sin «Arrancando».
  const provisional = sala.sillas ? vistaProvisional(sala) : null
  const nProvisional = provisional?.players.length ?? 1
  let foto = Object.freeze({
    game: provisional ? vistaAMesa(provisional, null, sala) : null,
    cronica: '',
    enviar: partida.enviar,
    reloj: relojDe(null, 0),
    escena: provisional ? 'sorteo' : 'arrancando',
    mesa: sala.id,
    ritmo: sala.ritmo ?? null,
    alternarDescarte: (i) => alternarDescarte(i),
    factorReparto: sala.ritmo === RITMO_RAPIDO ? FACTOR_RAPIDA : 1,
    // MES-PvP 3-A · el tono y la frase de la pantalla final (`vozHumanos.finDePartida`).
    fin: null,
    corteVoz: corte,
    // L-M 1 · el anfitrión (asiento real 0) en la mesa rotada: junto a él va el mazo del sorteo.
    anfitrion: provisional ? (nProvisional - provisional.asiento) % nProvisional : 0,
    // Árbitro v1.3 · los mensajes de la mesa (`partidaCliente.mensajes`, o los del imitado).
    mensajes: partida.mensajes ?? null,
    // Árbitro v1.3-b · la vista del árbitro tal cual, sin rotar: la capa de la recarga lee de ella
    // lo privado (`vista.recarga`) con `entreManosCore.recargaDeVista`.
    vista: null,
    // …y el desfase con la hora del árbitro, para que su anillo cuente con ella.
    desfase: 0,
  })
  const oyentes = new Set()
  const publicar = (cambios) => {
    foto = Object.freeze({ ...foto, ...cambios })
    oyentes.forEach((o) => o())
  }

  // MES-PvP 3 · la selección del descarte es local, con la regla del motor (`toggleDiscard`).
  // La conserva `vistaAMesa` entre lecturas de la misma mano. Solo en el descarte, en pie y
  // antes de mandarlo: una vez mandado no hay nada que cambiar.
  function alternarDescarte(i) {
    const g = foto.game
    if (!g || g.phase !== PHASES.DISCARD || g.players[0].folded || g.descarte.yaDescartaron.includes(0)) return
    publicar({ game: toggleDiscard(g, i) })
  }
  let version = null
  let cobrado = null
  let recargas = 0
  let alCobrar = () => {}
  let reloj = null
  let soltar = null
  // MES-PvP 3-A · lo que espera a que se vea el pago: `{ hasta, final }`, en la hora local.
  let espera = null

  // La pantalla final: la mesa en el fin, con su tono y su frase. Quien se va la ve en el
  // acto, aunque la partida siga: por eso el fin se fuerza en la vista.
  const finalDe = (vista, previa) => {
    const game = vistaAMesa({ ...vista, phase: FASE_FIN }, previa, sala)
    return { game, fin: finDePartida(game), cronica: '', escena: 'final' }
  }

  // MES-PvP 3-A · el fin que llega con un abandono no tapa el pago (Reglas v1.7 §8.2). Solo
  // para quien se queda y estaba mirando la mesa; sin lectura anterior, el fin va directo.
  //   A · la mano se cerró en esta misma jugada: la vista del fin trae su resultado
  //       (`arbitro/vista.js`, `finConPago`), y se pinta como el pago de siempre, con su duración;
  //   B · el pago ya estaba en la mesa (abandono entre manos): se deja terminar;
  //   C · sin pozo (la pausa de anuncio): el aviso, y la pantalla final tras él.
  function pagoAntesDelFin(vista, previa, horaServidor) {
    if (!previa || vista.phase !== FASE_FIN || !['mesa', 'anuncio'].includes(foto.escena)) return null
    const aviso = avisoDeAbandono(nuevosAbandonos(voz(vistaAMesa(vista, previa, sala)), voz(previa)), true)
    if (!aviso) return null
    const yaEnElPago = previa.phase === FASE_PAGO && previa.vencimiento?.clase === CLASE_MANO_SIGUIENTE
    if (vista.resultado && !yaEnElPago) {
      const game = vistaAMesa({ ...vista, phase: FASE_PAGO, vencimiento: null }, previa, sala)
      const ms = vista.resultado.revelacion ? RED_REVELACION_MS + LECTURA_TRAS_REVELACION_MS : MANO_SIGUIENTE_MS
      return { game: { ...game, aviso }, cronica: aviso, ms }
    }
    const ms = yaEnElPago ? Math.min(MANO_SIGUIENTE_MS, Math.max(0, previa.vencimiento.hora - horaServidor)) : AVISO_FIN_MS
    return { game: { ...previa, aviso }, cronica: aviso, ms }
  }

  function revisar() {
    const { vista, desfase = 0, muerta = false } = partida.foto()
    const cambios = {}
    let cobro = false
    if (vista && vista.version !== version) {
      version = vista.version
      const anfitrion = (vista.players.length - vista.asiento) % vista.players.length
      if (anfitrion !== foto.anfitrion) cambios.anfitrion = anfitrion
      cambios.vista = vista
      const propio = vista.players[vista.asiento].cobrado
      // v1.3-b · la billetera también cambia con cada recarga, aunque la aplique el árbitro al
      // cerrarse la mano (el pedido): se relee igual que al cobrar.
      const recargado = vista.recarga?.recargas ?? 0
      cobro = propio !== cobrado || recargado !== recargas
      cobrado = propio
      recargas = recargado
      // La pantalla final no cambia una vez puesta (Reglas v1.7 §8.2); el cobro sí se avisa.
      if (foto.escena !== 'final' && !espera) {
        const previa = foto.game
        if (escenaDe(vista, muerta) === 'final') {
          const pago = pagoAntesDelFin(vista, previa, ahora() + desfase)
          const final = finalDe(vista, previa)
          if (pago) {
            Object.assign(cambios, { game: pago.game, cronica: pago.cronica })
            espera = { hasta: ahora() + pago.ms, final }
          } else {
            Object.assign(cambios, final)
          }
        } else {
          const game = vistaAMesa(vista, previa, sala)
          // Quien abandona con la partida viva: el aviso en el óvalo, en la línea de la crónica, y
          // en el titular del pago si su retirada cerró la mano (`manoCore.resultadoDeMano`).
          const aviso = avisoDeAbandono(nuevosAbandonos(voz(game), voz(previa)), false)
          cambios.game = aviso ? { ...game, aviso } : game
          cambios.cronica = aviso ?? cronicaDe(voz(game), voz(previa), foto.cronica)
        }
      }
    }
    if (espera && ahora() >= espera.hasta) {
      Object.assign(cambios, espera.final)
      espera = null
    }
    if (desfase !== foto.desfase) cambios.desfase = desfase
    const nuevo = relojDe(vista?.vencimiento ?? null, ahora() + desfase)
    if (nuevo.clase !== foto.reloj.clase || nuevo.timeLeft !== foto.reloj.timeLeft) cambios.reloj = nuevo
    // La escena final solo la pone `finalDe`; mientras se ve el pago, la mesa se queda.
    const escena = escenaDe(vista ?? provisional, muerta)
    if (foto.escena !== 'final' && !espera && !cambios.escena && escena !== 'final' && escena !== foto.escena) cambios.escena = escena
    if (Object.keys(cambios).length > 0) publicar(cambios)
    // La píldora no relee sola: quien monta la mesa refresca el saldo cuando se cobra.
    if (cobro) alCobrar(cobrado)
  }

  return {
    iniciar() {
      soltar = partida.suscribir(revisar)
      reloj = setInterval(revisar, REVISION_MS)
      partida.iniciar()
      revisar()
    },
    parar() {
      clearInterval(reloj)
      soltar?.()
      partida.parar()
    },
    alCobrar: (fn) => { alCobrar = fn ?? (() => {}) },
    suscribir: (avisar) => {
      oyentes.add(avisar)
      return () => oyentes.delete(avisar)
    },
    foto: () => foto,
  }
}
