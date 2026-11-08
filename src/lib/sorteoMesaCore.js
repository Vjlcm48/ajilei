// ── MES-PvP L-M 1 · El sorteo sobre la mesa: lo que no es React ───────────────
// Ficha AJILEI_MES-PvP_LM-1_v1.0.md §2 y las decisiones de los STOP-L2 y L3; informe en
// docs/reportes/AJILEI_MES-PvP_LM-1_Informe_v1.0.md. La línea de tiempo, el mensaje y la geometría medida de la mesa; la capa
// (`screens/SorteoMesa.jsx`) solo pinta.
import { ANTES_DEL_REPARTO_MS, CARTAS_SORTEO, PASO_SORTEO_MS, esperaRepartoSorteo } from '../config/esperas'
import { aPropios, escalaActual } from './escala'

export const ETAPA = Object.freeze({ BARAJADO: 'barajado', REPARTO: 'reparto', ELECCION: 'eleccion', VOLTEO: 'volteo' })

// 3.ª vuelta · el sorteo va SIEMPRE a la velocidad del reparto rápido del juego, elija lo que
// elija el anfitrión para la partida: un vuelo de 0,595 s × 0,5, de uno en uno, como
// `GameTable.launchFlyingCard` (cada carta sale cuando aterriza la anterior). Árbitro v1.3 · la
// fórmula de cuánto dura vive en `config/esperas.js`: el árbitro espera exactamente lo mismo.
export { CARTAS_SORTEO, esperaRepartoSorteo }
export const PASO_MS = PASO_SORTEO_MS                     // 297,5
const PRIMERA_MS = ANTES_DEL_REPARTO_MS                    // 120 · el respiro antes de la primera

const GIRO_MS = 350            // las elegidas se voltean tras salir las no elegidas
const CARA_MS = GIRO_MS + 300  // ya están boca arriba (el giro dura 300 ms en `pvp.css`)
const AZAR_MS = 2200           // el tercer empate: «el azar decide» hasta aquí, luego el veredicto
const VUELTA_MS = 1000         // las elegidas empiezan a volver al mazo a `volteoMs − VUELTA_MS`
const VUELTA_PASO_MS = 40      // escalón entre cartas que vuelven a la vez
const MARCA_DESLIZA_MS = 150   // la marca de Mano aparece en el centro y a los 150 ms sale
export const AVISO_RELOJ_S = 3 // 3.ª vuelta · el aviso de poco tiempo del cronómetro propio
// variante c (la elegida por Victor) · la elegida sube 18 px, como «seleccionada», dentro de su
// recuadro.
const SUBE = 18
const SEPARACION = 6           // sin anclaje de mazo: junto al recuadro del anfitrión
// La franja del mensaje: un poco por encima del centro de la mesa (fracción del alto del óvalo),
// tan ancha como el óvalo deje sin tapar recuadros.
const FRANJA_SOBRE_CENTRO = 0.12
const FRANJA_ANCHO = 0.86
const FRANJA_MEDIO_ALTO = 22
const FRANJA_AIRE = 8
// El cronómetro del turno no se monta en el sorteo (`.action-area`, sub-tanda 5): su sitio
// natural, medido en `?pvp=turno-propio` (STOP-L3): el borde izquierdo de `.timer-display`
// respecto al centro de `.cards-row` propia, y su borde de arriba respecto al pie de la fila.
// En apaisado de teléfono (`.player-bar` en `display: contents`) es el `.ls-timer` del carril
// izquierdo de `.player-zone`.
const RELOJ_TELEFONO = Object.freeze({ dx: -103, dy: 7 })
const RELOJ_ESCRITORIO = Object.freeze({ dx: -153.5, dy: 22 })
const RELOJ_CARRIL = Object.freeze({ dx: 3, dy: 1 })
const MQ_ESCRITORIO = '(orientation: landscape) and (min-height: 601px)'   // GameTable.DESKTOP_TABLE_MQ
const HUECO_MARCA = 5          // escritorio: la «M» va delante de la «T» reservada

// ── Los textos (3.ª vuelta) ─────────────────────────────────────────────────
// Neutrales y sin nombres; los mismos para toda la mesa. Sellados en las Reglas de APU-1 v1.8
// §8.4 (comprobados al byte en la tanda 2 de L-M, que retiró los viejos `pvp.sorteo.*`).
export const TEXTOS_SORTEO = Object.freeze({
  elige: 'Elige una carta para saber quién es Mano',
  empate: 'Hay empate entre {n} jugadores, vamos a desempatar',
  azar: 'Tercer empate: el azar decide',
  mano: '¡Ya tenemos Mano!',
})

const rondaDe = (sorteo, n) => sorteo.rondas.find((r) => r.ronda === n) ?? null
const empate = (r) => TEXTOS_SORTEO.empate.replace('{n}', String(r.empatados.length))

// El mensaje en el instante `t` de la etapa. Ronda 1: nada en el barajado, la invitación desde
// el reparto. Desempates: el empate sigue a la vista hasta la elección. Volteo: la invitación
// hasta que las cartas están boca arriba; luego el empate, o el veredicto (en el tercer empate,
// antes «el azar decide»). Quien no está en el desempate no elige: se queda con el empate
// hasta el volteo (decisión de Victor en el STOP-L3, sin texto nuevo).
export function mensajeDelSorteo(sorteo, t) {
  if (!sorteo) return ''
  const actual = sorteo.etapa === ETAPA.VOLTEO ? rondaDe(sorteo, sorteo.ronda) : null
  if (actual && t >= CARA_MS) {
    if (actual.mano === null) return empate(actual)
    if (actual.azar && t < AZAR_MS) return TEXTOS_SORTEO.azar
    return TEXTOS_SORTEO.mano
  }
  const previa = rondaDe(sorteo, sorteo.ronda - 1)
  const empatePrevio = previa && previa.mano === null ? empate(previa) : ''
  const juego = actual ? actual.volteo.some((v) => v.asiento === 0) : sorteo.participan.includes(0)
  if (empatePrevio && !juego) return empatePrevio
  if (sorteo.etapa === ETAPA.ELECCION || sorteo.etapa === ETAPA.VOLTEO) return TEXTOS_SORTEO.elige
  if (empatePrevio) return empatePrevio
  return sorteo.etapa === ETAPA.REPARTO ? TEXTOS_SORTEO.elige : ''
}

// Quién es Mano ya a la vista (la carta brilla, la marca se desliza), y desde cuándo.
export function manoALaVista(sorteo, t) {
  if (sorteo?.etapa !== ETAPA.VOLTEO) return null
  const r = rondaDe(sorteo, sorteo.ronda)
  if (!r || r.mano === null) return null
  const desde = r.azar ? AZAR_MS : CARA_MS
  return t >= desde ? { seat: r.mano, desliza: t >= desde + MARCA_DESLIZA_MS } : null
}

// ── El reparto, de uno en uno ───────────────────────────────────────────────
// Reparte el anfitrión desde su mazo en sentido antihorario: la primera carta al jugador a su
// derecha (el siguiente asiento, como Mano tras el Pie en `GameTable.buildDealSeq`), la última
// a él. En el desempate, solo a los empatados y en el mismo orden. `anfitrion` es su índice en
// la mesa rotada; devuelve los asientos que participan, en orden de reparto.
export function ordenDeReparto(anfitrion, participan, numPlayers) {
  const orden = []
  for (let o = 1; o <= numPlayers; o++) {
    const seat = (anfitrion + o) % numPlayers
    if (participan.includes(seat)) orden.push(seat)
  }
  return orden
}

// ── Dónde está cada carta en el instante `t` ─────────────────────────────────
// `p` es la posición elegida de ese asiento (null si aún no eligió); `vuelo`, el puesto de la
// carta en el reparto (0 = la primera que sale); `orden`, su puesto al volver al mazo.
export function estadoCarta({ etapa, t, k, p, volteoMs, vuelo, orden }) {
  switch (etapa) {
    case ETAPA.BARAJADO: return { lugar: 'mazo', cara: false, oculta: true }
    case ETAPA.REPARTO: return { lugar: t >= PRIMERA_MS + vuelo * PASO_MS ? 'hueco' : 'mazo', cara: false }
    case ETAPA.ELECCION: return { lugar: p === k ? 'adelante' : 'hueco', cara: false }
    case ETAPA.VOLTEO: {
      if (p !== k) return { lugar: t >= orden * VUELTA_PASO_MS ? 'mazo' : 'hueco', cara: false }
      const vuelve = volteoMs - VUELTA_MS + orden * VUELTA_PASO_MS
      if (t < vuelve) return { lugar: 'adelante', cara: t >= GIRO_MS }
      return { lugar: t < vuelve + 300 ? 'adelante' : 'mazo', cara: false }
    }
    default: return { lugar: 'mazo', cara: false, oculta: true }
  }
}

// ── La geometría de la mesa, medida ─────────────────────────────────────────
const plano = (r) => (r ? { x: r.left, y: r.top, w: r.width, h: r.height } : null)
const centro = (r) => ({ x: r.x + r.w / 2, y: r.y + r.h / 2 })
const entre = (v, lo, hi) => Math.min(Math.max(v, lo), Math.max(lo, hi))
function union(cajas) {
  const x = Math.min(...cajas.map((c) => c.x))
  const y = Math.min(...cajas.map((c) => c.y))
  return { x, y, w: Math.max(...cajas.map((c) => c.x + c.w)) - x, h: Math.max(...cajas.map((c) => c.y + c.h)) - y }
}

// Tu asiento es `.player-zone`; el de un rival, el recuadro que lleva su `data-coin-target`
// (las dos rutas de pintado: `OpponentPanel` y `.ai-zone`).
function recuadroDe(seat) {
  if (seat === 0) return document.querySelector('.player-zone')
  return document.querySelector(`[data-coin-target="${seat}"]`)?.closest('.opp-panel, .ai-zone') ?? null
}

export function medirMesa(numPlayers) {
  const f = escalaActual()
  const caja = (el) => (el ? plano(aPropios(el.getBoundingClientRect(), f)) : null)
  const asientos = Array.from({ length: numPlayers }, (_, seat) => {
    const el = recuadroDe(seat)
    if (!el) return null
    const slots = [...el.querySelectorAll('.card-slot-wrapper, .opp-card-slot')].slice(0, 5).map(caja)
    if (slots.length < 5) return null
    // El hueco de la marca de Mano: el grupo de pastillas del asiento, que la mesa monta vacío.
    const marca = caja(el.querySelector(seat === 0 ? '.pbr-tags' : '.opp-header-anchor, .ai-header-anchor'))
    return { caja: caja(el), slots, mazo: caja(el.querySelector('.deck-pile')), marca }
  })
  // El óvalo; en la mesa de 2 apaisada son dos (`.two-ovals`), y el centro es el de los dos juntos.
  const unico = document.querySelector('.center-zone')
  const dos = [...document.querySelectorAll('.two-ovals .felt-oval')].map(caja)
  const oval = unico ? caja(unico) : dos.length ? union(dos) : null
  const barra = document.querySelector('.player-zone .player-bar')
  const msg = document.querySelector('.game-message')
  const ovalCronica = msg?.closest('.felt-oval, .center-zone') ?? null
  return {
    cronica: msg && ovalCronica ? { texto: caja(msg), oval: caja(ovalCronica) } : null,
    asientos,
    oval,
    cartas: caja(document.querySelector('.player-zone .cards-row')),
    zona: caja(document.querySelector('.player-zone')),
    carril: !!barra && getComputedStyle(barra).display === 'contents',
    escritorio: window.matchMedia(MQ_ESCRITORIO).matches,
  }
}

// El mazo del anfitrión: el anclaje de mazo que la mesa ya tiene en su asiento (el del Pie en
// una mano). Si ese asiento no lo tiene, junto a su recuadro, por el lado que mira al centro.
export function lugarDelMazo(anfitrion, oval) {
  if (anfitrion.mazo && anfitrion.mazo.w > 0) return anfitrion.mazo
  const { w, h } = anfitrion.slots[0]
  const C = centro(oval)
  const B = anfitrion.caja
  const bc = centro(B)
  const nx = (C.x - bc.x) / B.w
  const ny = (C.y - bc.y) / B.h
  if (Math.abs(ny) >= Math.abs(nx)) {
    return { x: entre(C.x - w / 2, B.x, B.x + B.w - w), y: ny < 0 ? B.y - SEPARACION - h : B.y + B.h + SEPARACION, w, h }
  }
  return { x: nx < 0 ? B.x - SEPARACION - w : B.x + B.w + SEPARACION, y: entre(C.y - h / 2, B.y, B.y + B.h - h), w, h }
}

// La elegida sube 18 px hacia el centro de la mesa, sin salir de su recuadro.
export function adelantada(hueco, recuadro, oval) {
  const C = centro(oval)
  const R = centro(recuadro)
  const dx = C.x - R.x
  const dy = C.y - R.y
  const d = Math.hypot(dx, dy) || 1
  const x = hueco.x + (dx / d) * SUBE
  const y = hueco.y + (dy / d) * SUBE
  return { ...hueco, x: entre(x, recuadro.x, recuadro.x + recuadro.w - hueco.w), y: entre(y, recuadro.y, recuadro.y + recuadro.h - hueco.h) }
}

// La franja: centrada sobre la mesa y un poco por encima del centro. El ancho, el del óvalo
// menos los recuadros que cruzan su banda (a izquierda y derecha del centro).
// 3.ª vuelta · si un recuadro tapa el propio centro (la mesa de 2 acostada: el de Beto baja
// hasta los óvalos), la franja no cabe sobre la mesa: el mensaje va DENTRO del óvalo de la
// crónica (`cronica`, la caja de `.game-message`), encima y sin cambiar su tamaño.
export function lugarDeLaFranja(oval, recuadros, cronica = null) {
  const C = centro(oval)
  const y = C.y - oval.h * FRANJA_SOBRE_CENTRO
  let izq = C.x - (oval.w * FRANJA_ANCHO) / 2
  let der = C.x + (oval.w * FRANJA_ANCHO) / 2
  let choca = false
  for (const r of recuadros) {
    if (!r || r.y > y + FRANJA_MEDIO_ALTO || r.y + r.h < y - FRANJA_MEDIO_ALTO) continue
    if (r.x + r.w <= C.x) izq = Math.max(izq, r.x + r.w + FRANJA_AIRE)
    else if (r.x >= C.x) der = Math.min(der, r.x - FRANJA_AIRE)
    else choca = true
  }
  if (choca && cronica) return { x: cronica.texto.x, y: cronica.oval.y + cronica.oval.h / 2, w: cronica.texto.w, enCronica: true }
  const medio = Math.min(C.x - izq, der - C.x)
  return { x: C.x - medio, y, w: medio * 2, enCronica: false }
}

// El cronómetro propio, en el sitio natural del del turno (esquina de arriba a la izquierda).
export function lugarDelReloj(geo) {
  if (!geo.cartas || !geo.zona) return null
  if (geo.carril) return { x: geo.zona.x + RELOJ_CARRIL.dx, y: geo.cartas.y + RELOJ_CARRIL.dy, carril: true }
  const d = geo.escritorio ? RELOJ_ESCRITORIO : RELOJ_TELEFONO
  return { x: geo.cartas.x + geo.cartas.w / 2 + d.dx, y: geo.cartas.y + geo.cartas.h + d.dy, carril: false }
}

// La marca de Mano: donde la pinta la mesa en una mano. En un rival, pegada al final del grupo
// de pastillas (alineado a la derecha; en escritorio, delante de la «T» que la mesa reserva);
// en tu asiento, al principio de `.pbr-tags`. Devuelve el punto de anclaje y hacia qué lado.
export function lugarDeLaMarca(asiento, seat) {
  const a = asiento?.marca
  if (!a) return null
  if (seat === 0) return { x: a.x, y: a.y + a.h / 2, alDerecha: false }
  return { x: a.w > 0 ? a.x - HUECO_MARCA : a.x, y: a.y + a.h / 2, alDerecha: true }
}
