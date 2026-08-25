import { useState, useEffect, useRef, useCallback } from 'react'
import ChipToken from './ChipToken'
import { EMISION_MS, GOTAS_MAX, perfilGota } from '../hooks/coreografiaCore'

// ── CEL-2 · La lluvia de Heptacoins ─────────────────────────────────────────
// Documento rector: lámina CEL-2. La moneda es la HC-1 de siempre —el activo
// maestro, vía `ChipToken`—, no un dibujo nuevo: lo que llueve es la moneda de
// la casa, y por eso hereda su relieve y su canto sin una línea de más.
//
// NODOS Y NO CANVAS, decidido por cuentas y confirmado por medida en el arnés:
// el techo son 18 monedas vivas, cada una es un <span> con un <img> cacheado
// dentro, y lo único que se anima son `translate`, `rotate` y `opacity` — las
// tres propiedades que el compositor mueve sin tocar el layout. Un canvas
// costaría un bucle de pintura por cuadro para 18 sprites, que es más trabajo,
// no menos. La medida de cuadros del modo `celebracion` es la que manda: si
// algún día baja de 50 fps en el móvil de referencia, esto se replantea.
//
// LA EMISIÓN SE CORTA, LA CAÍDA NO. En la calma deja de nacer gente nueva y las
// que están en el aire terminan su viaje: una moneda que se desvanece a media
// caída delata el truco. Por eso el componente sigue montado mientras quede
// una viva, aunque ya no emita.

export function LluviaHeptacoins({ emitiendo, pausada }) {
  const [gotas, setGotas] = useState([])
  const idRef = useRef(0)

  useEffect(() => {
    if (!emitiendo || pausada) return undefined
    const t = setInterval(() => {
      setGotas(gs => {
        // EL TECHO, y es un techo de verdad: se mira cuántas hay VIVAS, no
        // cuántas se han emitido. Con la pestaña oculta, con un cuadro largo o
        // con el móvil pensando, la cadencia se estira sola y aquí no nace
        // ninguna de más.
        if (gs.length >= GOTAS_MAX) return gs
        return [...gs, { id: ++idRef.current, ...perfilGota(Math.random) }]
      })
    }, EMISION_MS)
    return () => clearInterval(t)
  }, [emitiendo, pausada])

  // La retirada la manda la ANIMACIÓN, no un temporizador paralelo: el nodo se
  // va exactamente cuando termina de caer, y con la animación pausada tampoco
  // se va. Dos relojes para una sola cosa siempre acaban discrepando.
  const retira = useCallback((id, nombre) => {
    if (nombre !== 'cel-caida') return   // el giro es infinito y no termina nunca
    setGotas(gs => gs.filter(g => g.id !== id))
  }, [])

  if (!gotas.length) return null

  return (
    <div className={`cel-lluvia${pausada ? ' cel-lluvia-pausa' : ''}`} aria-hidden="true">
      {gotas.map(g => (
        <span
          key={g.id}
          className="cel-gota"
          onAnimationEnd={(e) => retira(g.id, e.animationName)}
          style={{
            left: `${g.izq}%`,
            '--gota-lado': `${g.lado}px`,
            '--gota-caida': `${g.caida}ms`,
            '--gota-deriva': `${g.deriva}px`,
            '--gota-opacidad': g.opacidad,
            '--gota-giro': `${Math.abs(g.giro)}ms`,
            '--gota-sentido': g.giro < 0 ? 'reverse' : 'normal',
          }}
        >
          <ChipToken size="compact" />
        </span>
      ))}
    </div>
  )
}
