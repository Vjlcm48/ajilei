import { useEffect, useRef, useState } from 'react'
import CardImage from '../components/CardImage'
import { VOLTEO_SORTEO_MS } from '../config/esperas'
import {
  AVISO_RELOJ_S, CARTAS_SORTEO, ETAPA, adelantada, estadoCarta, lugarDeLaFranja, lugarDeLaMarca,
  lugarDelMazo, lugarDelReloj, manoALaVista, medirMesa, mensajeDelSorteo, ordenDeReparto,
} from '../lib/sorteoMesaCore'
import { reentrar as reentrarPantallaCompleta } from '../lib/pantallaCompletaCore'
import reversoUrl from '../assets/cards/reverso_carta_mesa.svg?no-inline'

// ── MES-PvP L-M 1 · El sorteo de la Mano, sobre la mesa ─────────────────────
// Ficha: AJILEI_MES-PvP_LM-1_v1.0.md §2 y las decisiones de los STOP-L2 y L3. La
// mesa ya está montada (los recuadros, los huecos de cada asiento y el óvalo) y esta capa pinta
// encima, `fixed`, el mazo del anfitrión, las cartas, el mensaje, el cronómetro propio y la
// marca de Mano. Mide las cajas de la propia mesa y no toca su árbol: ni `GameTable.jsx` ni una
// hoja protegida.
//
// LA LÍNEA DE TIEMPO es una función pura de la etapa y de los ms desde que empezó (`t`): con
// `lamina.momento` la capa se congela en ese instante (capturas); sin él, corre con el reloj
// y las transiciones CSS hacen los vuelos.
//   barajado · el mazo baraja en el anclaje de mazo del anfitrión;
//   reparto  · el anfitrión reparte de una en una, en sentido antihorario, a quienes participan;
//   eleccion · las propias se tocan; la elegida sube, también en los asientos ajenos;
//   volteo   · las no elegidas vuelven sin mostrarse, las elegidas se voltean a la vez; con
//              Mano, su carta brilla y la marca se desliza a su asiento; al final, al mazo.

function useGeometria(numPlayers) {
  const [geo, setGeo] = useState(null)
  useEffect(() => {
    let previa = ''
    const medir = () => {
      const g = medirMesa(numPlayers)
      const firma = JSON.stringify(g)
      if (firma !== previa) { previa = firma; setGeo(g) }
    }
    const raf = requestAnimationFrame(medir)
    const id = setInterval(medir, 250)
    window.addEventListener('resize', medir)
    return () => { cancelAnimationFrame(raf); clearInterval(id); window.removeEventListener('resize', medir) }
  }, [numPlayers])
  return geo
}

// Los ms desde que empezó la etapa (o el momento congelado de la lámina).
// 3.ª vuelta · EL SALTO RARO: el `t` se guardaba suelto, así que el primer render de una etapa
// nueva llevaba el `t` de la anterior (≈ 1950 ms al salir del barajado): con él, las diez cartas
// del reparto «ya habían llegado» y se pintaban en los huecos, y un fotograma después, con
// `t = 0`, volaban de vuelta al mazo. Ahora el `t` va con su etapa: si la clave no es la de
// este render, la etapa acaba de empezar y `t` es 0.
function useTiempoDeEtapa(clave, momento) {
  const [medido, setMedido] = useState({ clave: null, t: 0 })
  const desde = useRef({ clave: null, hora: 0 })
  useEffect(() => {
    if (momento !== null) return undefined
    desde.current = { clave, hora: performance.now() }
    const id = setInterval(() => setMedido({ clave, t: performance.now() - desde.current.hora }), 50)
    return () => { clearInterval(id) }
  }, [clave, momento])
  if (momento !== null) return momento
  return medido.clave === clave ? medido.t : 0
}

export default function SorteoMesa({ game, reloj, enviar, anfitrion = 0, lamina = null }) {
  const { sorteo, numPlayers } = game
  // Árbitro v1.3 · el volteo dura lo mismo aquí que en el árbitro (`config/esperas.js`).
  const volteoMs = VOLTEO_SORTEO_MS
  const momento = lamina?.momento ?? null
  const geo = useGeometria(numPlayers)
  const t = useTiempoDeEtapa(`${sorteo.ronda}:${sorteo.etapa}`, momento)
  const [elegida, setElegida] = useState(null)

  // Durante el sorteo no se ven «Pozo 0» ni «Comodín activo»: una marca en `body` que `pvp.css`
  // lee para ocultarlos sin quitar su caja (el óvalo no cambia de geometría).
  useEffect(() => {
    document.body.classList.add('pvp-en-sorteo')
    return () => { document.body.classList.remove('pvp-en-sorteo') }
  }, [])

  const participo = sorteo.participan.includes(0)
  const yaElegi = sorteo.yaEligieron.includes(0) || elegida?.ronda === sorteo.ronda
  const eligiendo = sorteo.etapa === ETAPA.ELECCION && participo && !yaElegi

  const elegir = (p) => {
    if (!eligiendo) return
    reentrarPantallaCompleta(document, window)
    setElegida({ ronda: sorteo.ronda, p })
    enviar('elegir_carta_sorteo', { ronda: sorteo.ronda, carta: p })
  }

  const etapa = sorteo.etapa
  const mensaje = mensajeDelSorteo(sorteo, t)
  const raiz = { 'data-pvp': 'sorteo', 'data-etapa': etapa, 'data-ronda': sorteo.ronda }
  // El anfitrión es el asiento real 0 (§2.1); `anfitrion` es su índice en la mesa rotada.
  if (!geo || !geo.oval || !geo.asientos[anfitrion]) return <div className="pvp-sc-capa" aria-hidden="true" {...raiz} />

  const mazo = lugarDelMazo(geo.asientos[anfitrion], geo.oval)
  const ronda = etapa === ETAPA.VOLTEO ? sorteo.rondas.find((r) => r.ronda === sorteo.ronda) ?? null : null
  const posicionDe = (seat) => {
    if (seat === 0 && elegida?.ronda === sorteo.ronda) return elegida.p
    if (ronda) return ronda.volteo.find((v) => v.asiento === seat)?.posicion ?? null
    if (!sorteo.yaEligieron.includes(seat)) return null
    // Árbitro v1.3 · la posición de verdad, que publica la vista (`sorteo.elegidas`).
    return sorteo.elegidas?.[seat] ?? null
  }
  const cartaVolteada = (seat) => ronda?.volteo.find((v) => v.asiento === seat)?.carta ?? null
  const mano = manoALaVista(sorteo, t)

  // En el volteo, los que voltearon: con empate, `participan` ya es la ronda siguiente (solo los
  // empatados) y las cartas de los demás desaparecían justo cuando había que enseñarlas.
  const quienes = ronda ? ronda.volteo.map((v) => v.asiento) : sorteo.participan
  const orden = ordenDeReparto(anfitrion, quienes, numPlayers)
  const cartas = []
  orden.forEach((seat, puesto) => {
    const asiento = geo.asientos[seat]
    if (!asiento) return
    const p = posicionDe(seat)
    let noElegida = 0
    for (let k = 0; k < CARTAS_SORTEO; k++) {
      const e = estadoCarta({
        etapa, t, k, p, volteoMs, vuelo: k * orden.length + puesto, orden: k === p ? puesto : noElegida++,
      })
      if (e.oculta) continue
      const hueco = asiento.slots[k]
      const caja = e.lugar === 'mazo' ? mazo : e.lugar === 'adelante' ? adelantada(hueco, asiento.caja, geo.oval) : hueco
      const cara = e.cara ? cartaVolteada(seat) : null
      const ganadora = cara && mano?.seat === seat
      const propiaTocable = seat === 0 && eligiendo
      const clase = `pvp-sc${e.lugar === 'adelante' ? ' es-adelantada' : ''}${cara ? ' es-cara' : ''}${ganadora ? ' es-ganadora' : ''}${propiaTocable ? ' es-tocable' : ''}`
      const estilo = { left: caja.x, top: caja.y, width: caja.w, height: caja.h }
      const dentro = (
        <span className="pvp-sc-giro">
          <img className="pvp-sc-dorso" src={reversoUrl} alt="" draggable="false" />
          <span className="pvp-sc-frente">{cara ? <CardImage card={cara} /> : null}</span>
        </span>
      )
      const datos = { 'data-sorteo-asiento': seat, 'data-sorteo-carta': k, 'data-sorteo-lugar': e.lugar }
      cartas.push(propiaTocable
        ? <button key={`${seat}-${k}`} type="button" className={clase} style={estilo} data-pvp={`sorteo-carta-${k}`} onClick={() => elegir(k)} {...datos}>{dentro}</button>
        : <span key={`${seat}-${k}`} className={clase} style={estilo} {...datos}>{dentro}</span>)
    }
  })

  const franja = lugarDeLaFranja(geo.oval, geo.asientos.map((a) => a?.caja), geo.cronica)
  // El cronómetro: solo el propio, mientras eliges; a los 3 s, el aviso de poco tiempo del turno.
  const conReloj = eligiendo && reloj?.timeLeft != null
  const lugarReloj = conReloj ? lugarDelReloj(geo) : null
  const aviso = conReloj && reloj.timeLeft <= AVISO_RELOJ_S
  // La marca de Mano: nace en el centro de la franja y se desliza a la pastilla del asiento.
  const destinoMarca = mano ? lugarDeLaMarca(geo.asientos[mano.seat], mano.seat) : null
  const origenMarca = { x: franja.x + franja.w / 2, y: franja.y }
  const marca = destinoMarca && (mano.desliza ? destinoMarca : { ...origenMarca, alDerecha: destinoMarca.alDerecha })
  return (
    <div className={`pvp-sc-capa${momento !== null ? ' es-quieta' : ''}`} {...raiz}>
      <div className="pvp-sc-mazo deck-shuffle-wrapper" style={{ left: mazo.x, top: mazo.y, width: mazo.w, height: mazo.h }} data-pvp="sorteo-mazo">
        <div className="deck-pile pvp-sc-mazo-pila" />
        {etapa === ETAPA.BARAJADO && [-22, -11, 0, 11, 22].map((angle, i) => (
          <div key={i} className="shuffle-fan-card" style={{ animationDelay: `${i * 25}ms`, '--fan-angle': `${angle}deg` }} />
        ))}
      </div>
      {cartas}
      {mensaje && (
        <p className={`pvp-sc-franja${franja.enCronica ? ' es-en-cronica' : ''}`} role="status" data-pvp="sorteo-franja" style={{ left: franja.x, top: franja.y, width: franja.w }}>
          {mensaje}
        </p>
      )}
      {lugarReloj && (
        <span
          className={`pvp-sc-reloj timer-display${lugarReloj.carril ? ' es-carril' : ''}${aviso ? ' timer-warning' : ''}`}
          style={{ left: lugarReloj.x, top: lugarReloj.y }}
          role="timer"
          data-pvp="sorteo-reloj"
        >
          {reloj.timeLeft}s
        </span>
      )}
      {marca && (
        <span
          className={`pvp-sc-marca seat-badge seat-badge-gold${mano.seat === 0 ? '' : ' seat-badge-letter'}${marca.alDerecha ? ' es-derecha' : ''}`}
          style={{ left: marca.x, top: marca.y }}
          data-pvp="sorteo-marca"
          data-sorteo-asiento={mano.seat}
        >
          {mano.seat === 0 ? 'Mano' : 'M'}
        </span>
      )}
    </div>
  )
}
