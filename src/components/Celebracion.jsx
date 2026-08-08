import { useState, useEffect, useRef } from 'react'
import ChipToken from './ChipToken'
import { VIAJE_MS, VIAJE_ESCALON_MS, llevaViaje, llevaPulso } from '../hooks/celebracionCore'
import { CONTEO_MS, valorConteo } from '../hooks/sesionCore'

// ── DSK-VC2 · Superficies de la celebración ─────────────────────────────────
// Documento rector: docs/AJILEI_Victory_Celebration_v1.0.md §3.
// Overlays PUROS: `fixed`, fuera de flujo, hermanos del área — jamás dentro de
// un panel (contexto de apilamiento + transform de R2). Δ=0 por construcción.

// ── El pozo que viaja ───────────────────────────────────────────────────────
// Molde FlyingCard entero: se pinta en el origen, un rAF después se aplica el
// translate y la transición hace el resto; onTransitionEnd retira la ficha.
// Reguero escalonado para que se lea como fichas deslizándose y no como un
// bloque. Origen y destino llegan MEDIDOS en vivo (pozo → .pbr-chips).
function FichaViajera({ desde, hasta, retraso }) {
  const [movida, setMovida] = useState(false)
  useEffect(() => {
    const id = requestAnimationFrame(() => setMovida(true))
    return () => cancelAnimationFrame(id)
  }, [])
  return (
    <span
      className="vc-ficha"
      style={{
        left: desde.x, top: desde.y,
        transform: movida ? `translate(${hasta.x - desde.x}px, ${hasta.y - desde.y}px)` : 'translate(0,0)',
        transition: movida ? `transform ${VIAJE_MS}ms cubic-bezier(0.22,0.61,0.36,1) ${retraso}ms, opacity 240ms ease-out ${VIAJE_MS + retraso - 240}ms` : 'none',
        opacity: movida ? 0 : 1,
      }}
    >
      <ChipToken size="compact" />
    </span>
  )
}

export function CelebracionMesa({ activa }) {
  if (!activa || !llevaViaje(activa.nivel)) return null
  return (
    <div className="vc-capa" aria-hidden="true">
      {Array.from({ length: activa.fichas }, (_, i) => (
        <FichaViajera
          key={`${activa.id}-${i}`}
          desde={activa.desde}
          hasta={activa.hasta}
          retraso={i * VIAJE_ESCALON_MS}
        />
      ))}
    </div>
  )
}

// ── El pulso dorado ─────────────────────────────────────────────────────────
// Un ciclo, uno solo, sobre ELEMENTO PROPIO. No se toca la abreviatura
// `animation` de .player-zone: ahí vive turnBreath, y aunque en fase de pago el
// halo de turno está apagado (turnSeat es null y se midió `animation: none`),
// compartir la propiedad es pedir que algún día se pisen.
export function PulsoNombre({ activa }) {
  if (!activa || !llevaPulso(activa.nivel)) return null
  return <span key={activa.id} className="vc-pulso" aria-hidden="true" />
}

// ── AJILEI ──────────────────────────────────────────────────────────────────
// La palabra en grande con el tratamiento de marca: --gold-brand y la traza de
// .table-title, ambos tokens vivos (el CSS los hereda, aquí no se cablea nada).
// Aparición molde msgPop. Una sola vez, breve.
export function AjileiOverlay({ activa }) {
  if (!activa || activa.nivel !== 'ajilei') return null
  return (
    <div className="vc-ajilei-capa" role="status">
      <span key={activa.id} className="vc-ajilei">AJILEI</span>
    </div>
  )
}

// ── Tarjeta-resumen de fin de partida ───────────────────────────────────────
// No es overlay: es LA PANTALLA. Cuando el humano gana la mesa el tablero ya no
// existe —isGameOver lo sustituye por .game-over-screen—, así que la tarjeta
// vive dentro de esa pantalla terminal, bajo el "¡Ganaste la mesa!" en oro que
// se conserva intacto. Exenta del techo de duración: no interrumpe nada.
// El corte NO se escribe en el estado del conteo: se DERIVA en el retorno. Así
// no hay un setState síncrono dentro del efecto (que dispararía renders en
// cascada), y el valor final aparece en el mismo frame del toque.
function useConteo(destino, cortado) {
  const [animado, setAnimado] = useState(0)
  const rafRef = useRef(0)
  useEffect(() => {
    if (cortado) return
    let inicio = null
    const paso = (t) => {
      if (inicio === null) inicio = t
      const p = Math.min(1, (t - inicio) / CONTEO_MS)
      setAnimado(valorConteo(destino, p))
      if (p < 1) rafRef.current = requestAnimationFrame(paso)
    }
    rafRef.current = requestAnimationFrame(paso)
    return () => cancelAnimationFrame(rafRef.current)
  }, [destino, cortado])
  return cortado ? destino : animado
}

export function TarjetaResumen({ sesion, netas }) {
  const [cortado, setCortado] = useState(false)
  const valor = useConteo(netas, cortado)

  // El toque corta el conteo al valor final — mismo gesto que corta una
  // celebración de mesa, misma vía: pointerdown en captura, sin overlay.
  useEffect(() => {
    if (cortado) return
    const corta = () => setCortado(true)
    document.addEventListener('pointerdown', corta, true)
    return () => document.removeEventListener('pointerdown', corta, true)
  }, [cortado])

  const signo = valor > 0 ? '+' : ''
  return (
    <div className="vc-tarjeta">
      <p className={`vc-netas${netas >= 0 ? '' : ' vc-netas-neg'}`}>
        <span className="vc-netas-ico"><ChipToken size="full" /></span>
        <span className="vc-netas-num">{signo}{valor}</span>
        <span className="vc-netas-word">fichas</span>
      </p>
      <dl className="vc-detalle">
        <div><dt>Manos jugadas</dt><dd>{sesion.manosJugadas}</dd></div>
        <div><dt>Manos ganadas</dt><dd>{sesion.manosGanadas}</dd></div>
        <div>
          <dt>Tu mejor mano</dt>
          <dd>{sesion.mejorMano ? `${sesion.mejorMano.palo}, ${sesion.mejorMano.pts} pts` : '—'}</dd>
        </div>
      </dl>
    </div>
  )
}
