import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { sumarTextos, t } from '../config/textos'
import { TEXTOS_TUT_COMUNES, TEXTOS_TUT_HUB, TEXTOS_TUT_TEMAS } from '../config/textos.tut.es'
import { guia } from '../lib/guia'
import { BotonSalir } from '../components/CapaSenal'
import IconoTema from './IconosTemas'
import { CAPITULOS, CONSTRUIDOS, DE_LA_APP, PISTAS } from './capitulos'
import '../styles/temas.css'

sumarTextos('es', { ...TEXTOS_TUT_COMUNES, ...TEXTOS_TUT_HUB, ...TEXTOS_TUT_TEMAS })

// ── TUT-1 T4 · Las diez filas de «Aprender por tema» ────────────────────────
// Rector: AJILEI_TUT-1_T4_v1.0.md §1.4; normativo AJILEI_Tutorial_v1.5.md §2.1 y §2.2.
// Tres pistas con su título y diez filas: icono, número, título y el ✓ de `vistos`. Las
// que aún no existían dijeron «Pronto» hasta la tanda 5. Piso táctil 44, letra con los pisos
// de LEC-1. La usan la pantalla del índice y la capa del ⋮ (entre manos).
// T5 · en la capa del ⋮ los capítulos que navegan por la app (7, 8 y 9, `DE_LA_APP`) no se
// abren: saldrían de la mesa. Dicen «En el lobby» en el sitio del ✓ y no responden.

/**
 * @param {object} p
 * @param {number[]} p.vistos       los capítulos con ✓
 * @param {(n:number) => void} p.onElegir
 * @param {() => void} [p.onPronto] tocar una fila que aún no existe
 * @param {boolean} [p.enMesa]      (T5) la capa del ⋮: los capítulos de la app no se abren
 */
export default function ListaTemas({ vistos, onElegir, onPronto, enMesa = false }) {
  return (
    <div className="tem-lista">
      {PISTAS.map((pista) => (
        <section key={pista.id} className="tem-pista" data-pista={pista.id}>
          <h2 className="tem-pista-titulo">{t(pista.clave)}</h2>
          <ul className="tem-filas">
            {pista.capitulos.map((n) => {
              const fuera = enMesa && DE_LA_APP.includes(n)
              const listo = CONSTRUIDOS.includes(n) && !fuera
              const visto = vistos.includes(n)
              return (
                <li key={n}>
                  <button
                    type="button"
                    className={`tem-fila${listo ? '' : ' es-pronto'}`}
                    data-accion="tem-capitulo"
                    data-capitulo={n}
                    data-visto={visto ? '' : undefined}
                    onClick={() => (listo ? onElegir(n) : onPronto?.())}
                    aria-label={`${t('tut.temas.cap', { n })}: ${t(CAPITULOS[n].titulo)}${visto ? ` · ${t('tut.indice.visto')}` : ''}`}
                  >
                    <IconoTema icono={CAPITULOS[n].icono} n={n} />
                    <span className="tem-num">{n}</span>
                    <span className="tem-titulo">{t(CAPITULOS[n].titulo)}</span>
                    {listo
                      ? <span className="tem-visto" aria-hidden="true" style={visto ? undefined : { visibility: 'hidden' }}>✓</span>
                      : <span className="tem-pronto">{t(fuera ? 'tut.temas.enlobby' : 'tut.hub.pronto')}</span>}
                  </button>
                </li>
              )
            })}
          </ul>
        </section>
      ))}
    </div>
  )
}

/**
 * El índice en una capa sobre la mesa (la fila del ⋮ entre manos): «Cerrar» arriba a la
 * derecha, como en los capítulos. Elegir un capítulo lo abre sobre la mesa viva.
 */
export function IndiceCapa({ onElegir, onCerrar }) {
  const [vistos] = useState(() => guia.leer().vistos)
  useEffect(() => {
    const tecla = (ev) => { if (ev.key === 'Escape') { ev.preventDefault(); onCerrar?.() } }
    document.addEventListener('keydown', tecla, true)
    return () => document.removeEventListener('keydown', tecla, true)
  }, [onCerrar])
  return createPortal(
    <div className="tem-capa" role="dialog" aria-modal="true" aria-label={t('tut.hub.temas.titulo')} data-tem-capa="">
      <div className="tem-capa-caja">
        <h1 className="tem-capa-titulo">{t('tut.hub.temas.titulo')}</h1>
        <ListaTemas vistos={vistos} onElegir={onElegir} enMesa />
      </div>
      <BotonSalir cerrar onClick={onCerrar} />
    </div>,
    document.body,
  )
}
