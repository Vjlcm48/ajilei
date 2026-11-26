import { Suspense, lazy, useEffect, useState } from 'react'
import { t } from '../config/textos'
import { trozosRotulo } from '../components/capaSenalCore'
import { BotonSalir } from '../components/CapaSenal'
import { SoundButton } from '../components/SoundButton'
import IconoTema from './IconosTemas'
import { CAPITULOS } from './capitulos'
import { fabricaMesa } from '../lib/cargarMesa'
import '../styles/ruta.css'

// ── TUT-1 T6 · «¿En qué consiste el juego?» (la ruta de la primera vez, 1 de 4) ──
// Rector: AJILEI_TUT-1_T6_v1.0.md §1.1; normativo AJILEI_Tutorial_v1.5.md §1.2.1.
// Pantalla propia, sin mesa, antes del capítulo 2. Las piezas se revelan UNA A UNA, en orden,
// cada ≈ 0,4 s (con `prefers-reduced-motion`, todas a la vez); el botón, al final. Un toque en
// la pantalla durante la revelación la completa de golpe: nadie espera. Nada avanza solo:
// «Empecemos» espera su toque (v1.5: «Nada del tutorial se mueve solo»).
//
// O1 · todas las cajas existen desde el primer cuadro: revelar es `visibility` y `opacity`,
// nunca montar ni cambiar de tamaño (Δ 0, `tut.ruta`). Las cinco cartas son la muestra de los
// capítulos (`PlayingCard`, de la mesa: viaja con su trozo, como en `Capitulo`, para que la
// entrada no lleve su nombre) EN LÍNEA; su caja la reserva `.ruta-cartas` aunque la mesa tarde.
// Al revelarse, se iluminan (el aro de la capa).

const MuestraCartas = lazy(() => Promise.resolve(fabricaMesa()).then((m) => ({ default: m.MuestraCartas })))

/** Las cinco cartas de un mismo palo (v1.5 §1.2.1): cualquiera; no es un AJILEI. */
const CARTAS_DEL_PALO = Object.freeze(['1-Copas', '12-Copas', '7-Copas', '5-Copas', '11-Copas'])
/** El orden de la revelación: título, frase, cartas, «dos cosas», ①, ②, botón. */
const PIEZAS = 7
/** Lo que separa una pieza de la siguiente. */
const PASO_MS = 400

const quieto = () => {
  try { return !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches } catch { return false }
}

/** Un texto de `t()` con sus `**negritas**`. */
export function Rico({ clave }) {
  return trozosRotulo(t(clave)).map((p, i) => (p.fuerte ? <strong key={i}>{p.texto}</strong> : <span key={i}>{p.texto}</span>))
}

/**
 * @param {object} p
 * @param {Function} p.onEmpezar «Empecemos»: el capítulo 2
 * @param {Function} p.onSalir   «Salir»: el lobby, sin marca
 */
export default function RutaIntro({ onEmpezar, onSalir }) {
  const [k, setK] = useState(() => (quieto() ? PIEZAS : 1))
  useEffect(() => {
    if (k >= PIEZAS) return undefined
    const id = setTimeout(() => setK((x) => Math.min(PIEZAS, x + 1)), PASO_MS)
    return () => clearTimeout(id)
  }, [k])
  const pieza = (i) => `ruta-pieza${i < k ? ' es-vista' : ''}`
  const completar = () => setK(PIEZAS)

  return (
    <main className="ruta ruta--intro" data-ruta="intro" data-ruta-k={k} onClick={completar}>
      <div className="ruta-tarjeta">
        <div className="ruta-lado">
          <h1 className={`ruta-titulo ${pieza(0)}`} data-pieza="0">{t('tut.ruta.intro.titulo')}</h1>
          <div className={`ruta-texto ${pieza(1)}`} data-pieza="1">
            <p className="ruta-frase"><Rico clave="tut.ruta.intro.frase" /></p>
            <p className="ruta-nota">{t('tut.ruta.intro.palos')}</p>
          </div>
          <div className={`ruta-cartas ${pieza(2)}`} data-pieza="2">
            <Suspense fallback={null}><MuestraCartas tipo="cartas" cartas={CARTAS_DEL_PALO} enLinea /></Suspense>
          </div>
        </div>
        <div className="ruta-lado">
          <p className={`ruta-dos ${pieza(3)}`} data-pieza="3">{t('tut.ruta.intro.dos')}</p>
          <ol className="ruta-lista">
            <li className={pieza(4)} data-pieza="4">
              <span className="ruta-num" aria-hidden="true">1</span>
              <IconoTema icono={CAPITULOS[2].icono} n={2} />
              <span className="ruta-item"><Rico clave="tut.ruta.intro.uno" /></span>
            </li>
            <li className={pieza(5)} data-pieza="5">
              <span className="ruta-num" aria-hidden="true">2</span>
              <IconoTema icono={CAPITULOS[3].icono} n={3} />
              <span className="ruta-item"><Rico clave="tut.ruta.intro.otro" /></span>
            </li>
          </ol>
          <SoundButton type="button" className={`ruta-btn ${pieza(6)}`} data-pieza="6" data-accion="ruta-empecemos"
            onClick={(ev) => { ev.stopPropagation(); onEmpezar?.() }}>
            {t('tut.ctl.empecemos')}
          </SoundButton>
        </div>
      </div>
      <BotonSalir onClick={(ev) => { ev?.stopPropagation?.(); onSalir?.() }} />
    </main>
  )
}
