// ── MES-PvP 2 · El controlador de la mesa contra personas ───────────────────
// Diagnóstico: informe de la Fase 0 de MES-PvP, §B.2, §B.7 y §B.10. Molde de la casa
// (`creaCongelador`, `coreografiaCore`): el núcleo se prueba y el hook solo ejecuta.
//
// Envuelve la `partida` (`crearClientePartida`, o su imitación con la misma forma) y deja
// una foto: `{ game, cronica, enviar, reloj, escena, mesa, ritmo }`. La foto solo cambia si
// cambia algo que se pinta: el reloj se revisa cuatro veces por segundo, y la mesa se
// repinta una, cuando cambia el segundo.
import { ELECCION_SORTEO_MS, PAUSA_ANUNCIO_MS, TURN_TIME } from '../config/esperas'
import {
  CLASE_DESCARTE, CLASE_ELECCION, CLASE_PAUSA_ANUNCIO, CLASE_TURNO, FASE_FIN, FASE_SORTEO, REVISION_MS,
} from '../lib/partidaCliente'
import { vistaAMesa } from '../lib/vistaAMesa'
import { cronicaDe } from './vozHumanos'

// Solo estas clases cuentan segundos en pantalla. Las demás son esperas de animación: no
// tienen reloj que pintar, y su `timeLeft` es `null`.
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

// Qué pantalla toca. El fin va primero: si la partida acabó, no murió. Quien ya no está
// en la mesa sale a su pantalla final, sin espectador (Fase 0, P-5): así `effectiveLayout`
// no recibe nunca el asiento propio eliminado con la mesa viva.
export function escenaDe(vista, muerta) {
  if (!vista) return 'arrancando'
  if (vista.phase === FASE_FIN) return 'final'
  if (muerta) return 'muerta'
  const propio = vista.players[vista.asiento]
  if (propio.abandonado || propio.eliminated) return 'fuera'
  if (vista.phase === FASE_SORTEO) return 'sorteo'
  if (vista.vencimiento?.clase === CLASE_PAUSA_ANUNCIO && propio.enAnuncio) return 'anuncio'
  return 'mesa'
}

/**
 * @param {{ partida: object, sala: { id: string, ritmo?: string, entrada?: string },
 *   ahora?: () => number }} partes
 */
export function creaMesaPvP({ partida, sala, ahora = Date.now }) {
  let foto = Object.freeze({
    game: null,
    cronica: '',
    enviar: partida.enviar,
    reloj: relojDe(null, 0),
    escena: 'arrancando',
    mesa: sala.id,
    ritmo: sala.ritmo ?? null,
  })
  const oyentes = new Set()
  let version = null
  let cobrado = null
  let alCobrar = () => {}
  let reloj = null
  let soltar = null

  function revisar() {
    const { vista, desfase = 0, muerta = false } = partida.foto()
    const cambios = {}
    let cobro = false
    if (vista && vista.version !== version) {
      version = vista.version
      const game = vistaAMesa(vista, foto.game, sala)
      cambios.game = game
      cambios.cronica = cronicaDe(game, foto.game, foto.cronica)
      const propio = vista.players[vista.asiento].cobrado
      cobro = propio !== cobrado
      cobrado = propio
    }
    const nuevo = relojDe(vista?.vencimiento ?? null, ahora() + desfase)
    if (nuevo.clase !== foto.reloj.clase || nuevo.timeLeft !== foto.reloj.timeLeft) cambios.reloj = nuevo
    const escena = escenaDe(vista, muerta)
    if (escena !== foto.escena) cambios.escena = escena
    if (Object.keys(cambios).length > 0) {
      foto = Object.freeze({ ...foto, ...cambios })
      oyentes.forEach((o) => o())
    }
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
