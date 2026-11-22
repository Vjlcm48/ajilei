import { useCallback, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import CapaSenal, { BotonSalir } from './CapaSenal'
import { Wordmark } from './Wordmark'
import { PASOS, pasosDeMano } from '../lib/guiaManos'
import { RED_REVELACION_MS } from '../hooks/mesaCore'
import '../styles/guiada.css'

// ── GUI-1 · El controlador de la partida guiada ─────────────────────────────
// Rector: AJILEI_TUT-1_T2_v1.0.md §1.3; normativo AJILEI_Tutorial_v1.3.md §1.1 y §1.4.
// Lo monta `GameTable` cuando lleva `guion` (y sólo entonces). LEE la mesa —la
// fase, de quién es el turno, si reparte, si repone, si celebra— y decide qué
// paso de `lib/guiaManos.PASOS` toca; NO la toca: lo que hace cada paso lo hace
// el toque del jugador sobre el control de verdad, que la capa deja pasar.
//
// LA GUIADA ES CERRADA. En cada paso un solo control responde (`unico` de la
// capa: el resto en gris y bajo el velo). Mientras ningún paso se ve —reparte,
// piensa una IA, vuelan las monedas—, una capa transparente no deja tocar nada
// y sólo queda «Salir». «Salir» está siempre, en el mismo sitio: arriba a la
// derecha, aparte de «Siguiente» (v1.3 §1.1), en la capa o, entre pasos, en la espera.
//
// CÓMO AVANZA. Un paso de `toque` avanza con el toque real sobre su ancla
// (`alTocar` de la capa, en captura: antes de que la mesa lo procese); uno de
// `seleccion`, cuando la selección de descarte de la mesa es justo la que pide
// (las cartas se tocan de verdad; la mano 1 pide dos); uno de `lectura`, con
// «Siguiente». El paso siguiente sale cuando la mesa llega a su
// momento (`cuando`). El último, la celebración de AJILEI, no lleva rótulo: al
// terminar la celebración Y su sonido, la palabra AJILEI se queda quieta un
// segundo y `guion.alTerminar` lleva al cierre.
//
// LA PALABRA QUIETA. En la guiada la palabra de la celebración no se desvanece:
// `guiada.css` le corta la animación justo antes de su salida (`html[data-guiada]`,
// que pone `Guiada.jsx`), y al acabar la celebración esta capa monta una copia de
// la misma palabra —mismas clases, misma caja— ya en su fotograma final. El relevo
// cae en el mismo render en que la celebración se va, así que no parpadea.
const PAUSA_CIERRE_MS = 1000

/** La mano a la que pertenece lo que se ve: antes de «Iniciar mano», la que viene. */
const manoDe = (game) => (game.phase === 'WAITING' ? game.handCount + 1 : game.handCount)

export default function GuiaControl({ game, vista, guion }) {
  const [i, setI] = useState(0)
  // Lo que un paso guarda para otro: el sitio de las cartas que llegan (manos 1 y 2).
  const [ctx, setCtx] = useState({ repuestas: null })
  // La revelación de ESTA mano: si la celebración llegó a armarse o venció la red
  // (molde de `revelacion` en la mesa). Sin esto, el primer cuadro del pago —antes
  // de que la celebración se arme— parecería «ya terminó».
  const [celebro, setCelebro] = useState(-1)
  const [red, setRed] = useState(-1)
  if (vista.celebrando && celebro !== game.handCount) setCelebro(game.handCount)
  const enPago = game.phase === 'PAYOUT'
  useEffect(() => {
    if (!enPago) return undefined
    const mano = game.handCount
    const tm = setTimeout(() => setRed(mano), RED_REVELACION_MS)
    return () => clearTimeout(tm)
  }, [enPago, game.handCount])

  const paso = PASOS[i] ?? null
  const visible = !!paso && paso.mano === manoDe(game) && cumple(paso, game, vista, { celebro, red })

  const avanzar = useCallback(() => setI((x) => x + 1), [])

  // `seleccion`: avanza cuando lo seleccionado en la mesa es justo el objetivo
  // (estado derivado, en el render, como `celebro`; la condición deja de
  // cumplirse en cuanto el paso cambia).
  if (visible && paso.avanza === 'seleccion' && mismos(game.selectedDiscards, paso.objetivo(game))) {
    if (paso.guarda) setCtx((c) => ({ ...c, [paso.guarda]: paso.objetivo(game) }))
    setI(i + 1)
  }

  const salir = useCallback(() => guion.alSalir(), [guion])

  // El paso final: sin rótulo. La celebración ya terminó (`cobro`); si su sonido aún
  // suena, se le espera (`end`, o `stop` si lo recorta o lo corta un toque); después,
  // la pausa con la palabra quieta, y el cierre.
  const esFin = visible && paso.avanza === 'fin'
  const sonidoCelebracion = vista.sonidoCelebracion
  useEffect(() => {
    if (!esFin) return undefined
    let tm = null
    const pausa = () => { if (tm === null) tm = setTimeout(() => guion.alTerminar(), PAUSA_CIERRE_MS) }
    const a = sonidoCelebracion?.()
    const suena = !!a?.sound && a.id != null && a.sound.playing(a.id)
    if (suena) { a.sound.once('end', pausa, a.id); a.sound.once('stop', pausa, a.id) } else pausa()
    return () => {
      clearTimeout(tm)
      tm = -1
      if (suena) { a.sound.off('end', pausa, a.id); a.sound.off('stop', pausa, a.id) }
    }
  }, [esFin, guion, sonidoCelebracion])

  if (esFin) return <><PalabraQuieta /><Espera onSalir={salir} /></>
  if (!visible) return <Espera onSalir={salir} />

  const anclas = paso.ancla(game, ctx)
  const lectura = paso.avanza === 'lectura'
  const toque = paso.avanza === 'toque'
  const primero = PASOS.findIndex((p) => p.mano === paso.mano)
  return (
    <CapaSenal
      key={i}
      ancla={anclas}
      rotulo={paso.rotulo}
      vars={paso.vars?.(game, ctx)}
      velo
      unico
      pasa={!lectura}
      colocacion="burbuja"
      aria="tut.guiada.nombre"
      controles={{ siguiente: lectura, salir: true, paso: { n: i - primero + 1, m: pasosDeMano(paso.mano) } }}
      alTocar={toque ? (paso.toque ?? anclas) : null}
      onAncla={avanzar}
      onSiguiente={avanzar}
      onSalir={salir}
    />
  )
}

/** ¿Dos listas de índices tienen los mismos, sin importar el orden? */
function mismos(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length || a.length === 0) return false
  const x = [...a].sort((p, q) => p - q)
  const y = [...b].sort((p, q) => p - q)
  return x.every((v, k) => v === y[k])
}

// ¿La mesa está en el momento de este paso?
function cumple(paso, game, vista, { celebro, red }) {
  const quieta = !vista.barajando && !vista.repartiendo && !vista.reponiendo && !vista.recogiendo
  if (!quieta) return false
  switch (paso.cuando) {
    case 'inicio': return game.phase === 'WAITING'
    case 'turno': return game.phase === paso.fase && vista.turno
    case 'descarte': return game.phase === 'DISCARD' && vista.descarte
    case 'cobro': return game.phase === 'PAYOUT' && !vista.celebrando && (celebro === game.handCount || red === game.handCount)
    default: return false
  }
}

// La palabra de la celebración, quieta en su último fotograma (`guiada.css`). Las clases
// son las de `AjileiOverlay` (`Celebracion.jsx`): misma caja, mismo velo; hermana de
// aquélla en la mesa, en el mismo contexto de apilado.
function PalabraQuieta() {
  return (
    <div className="vc-ajilei-capa guia-ajilei-quieta" aria-hidden="true">
      <span className="vc-ajilei"><Wordmark /></span>
    </div>
  )
}

// Entre pasos: nada responde salvo «Salir», en su sitio de siempre (arriba a la derecha).
function Espera({ onSalir }) {
  return createPortal(
    <div className="guia-espera" data-guia-espera="">
      <BotonSalir onClick={onSalir} />
    </div>,
    document.body,
  )
}
