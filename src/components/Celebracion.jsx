import { useState, useEffect, useRef } from 'react'
import ChipToken from './ChipToken'
import { Wordmark } from './Wordmark'
import { VIAJE_MS, VIAJE_ESCALON_MS, VIAJE_DESVANECIDO_MS, llevaViaje, llevaPulso } from '../hooks/celebracionCore'
import { CONTEO_MS, valorConteo } from '../hooks/sesionCore'

// ── DSK-VC2 · Superficies de la celebración ─────────────────────────────────
// Documento rector: docs/AJILEI_Victory_Celebration_v1.0.md §3.
// Overlays PUROS: `fixed`, fuera de flujo, hermanos del área — jamás dentro de
// un panel (contexto de apilamiento + transform de R2). Δ=0 por construcción.

// ── El pozo que viaja ───────────────────────────────────────────────────────
// Molde FlyingCard entero: se pinta en el origen, un rAF después se aplica el
// translate y la transición hace el resto; onTransitionEnd retira la ficha.
// Reguero escalonado para que se lea como fichas deslizándose y no como un
// bloque. Origen y destino llegan MEDIDOS en vivo, y desde VIS-3 son MONEDAS y
// no cajas: la Heptacoin del pozo → la Heptacoin del ganador, sea el humano o
// una IA. Con ellos llega `hasta.lado`, el lado medido de la moneda destino.
function FichaViajera({ desde, hasta, retraso }) {
  const ref = useRef(null)
  const [movida, setMovida] = useState(false)
  const [escala, setEscala] = useState(1)
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      // VIS-3 · La escala de llegada se MIDE, no se escribe: se divide el lado
      // de la moneda destino (medido al disparar) entre el lado propio de ESTA
      // moneda, leído en vivo. Ni el 24 del ChipToken compact ni el atributo
      // `width` sirven de referencia — el CSS puede pisarlos, y de hecho lo hace
      // con la del pozo en landscape móvil.
      const propio = ref.current ? ref.current.getBoundingClientRect().width : 0
      setEscala(propio > 0 && hasta.lado > 0 ? hasta.lado / propio : 1)
      setMovida(true)
    })
    return () => cancelAnimationFrame(id)
  }, [hasta.lado])
  // `translate` y `scale` van como PROPIEDADES INDEPENDIENTES y no dentro de un
  // `transform`, porque necesitan relojes distintos: la moneda vuela a su tamaño
  // durante la primera mitad del trayecto y sólo se ajusta en la segunda, al
  // llegar. Con un solo `transform` la escala se interpolaría desde el primer
  // fotograma y la moneda cambiaría de tamaño durante todo el vuelo.
  // El centrado sobrevive: `.vc-ficha` lleva margin -12px y `scale` opera sobre
  // el centro de la caja, así que el centro sigue cayendo en el punto medido.
  const ajuste = VIAJE_MS / 2
  return (
    <span
      ref={ref}
      className="vc-ficha"
      style={{
        left: desde.x, top: desde.y,
        // VIS-3 · La caja del envoltorio tiene que ser la caja de la MONEDA.
        // `.vc-ficha` es un bloque con un <img> EN LÍNEA dentro, así que su caja
        // medía 24x31,09: los 7,09 px de más son el hueco del descendente de la
        // línea. Con `margin: -12px` la moneda quedaba centrada igual y nadie lo
        // notó nunca —hasta que hubo escala—, porque `scale` pivota sobre el
        // centro del ENVOLTORIO, que está 3,55 px por debajo del de la moneda.
        // Medido antes de esto: la última moneda aterrizaba a dy=3,55 del centro
        // del destino con la caja en 16x20,73 en vez de 16x16.
        // `line-height: 0` deja el bloque a la altura exacta de la imagen, y con
        // eso los dos centros vuelven a ser el mismo punto.
        lineHeight: 0,
        translate: movida ? `${hasta.x - desde.x}px ${hasta.y - desde.y}px` : '0 0',
        scale: movida ? String(escala) : '1',
        transition: movida
          ? `translate ${VIAJE_MS}ms cubic-bezier(0.22,0.61,0.36,1) ${retraso}ms`
            + `, scale ${ajuste}ms ease-out ${retraso + ajuste}ms`
            + `, opacity ${VIAJE_DESVANECIDO_MS}ms ease-out ${VIAJE_MS + retraso - VIAJE_DESVANECIDO_MS}ms`
          : 'none',
        opacity: movida ? 0 : 1,
      }}
    >
      <ChipToken size="compact" />
    </span>
  )
}

// VC2b · `esperando` es el primer tiempo de la celebración: ya decidida y ya
// medida, pero todavía callada porque showdown.mp3 no ha terminado. Nada se
// dibuja hasta entonces — el guardia es el mismo en las tres superficies.
export function CelebracionMesa({ activa }) {
  if (!activa || activa.esperando || !llevaViaje(activa.nivel)) return null
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
  if (!activa || activa.esperando || !llevaPulso(activa.nivel)) return null
  return <span key={activa.id} className="vc-pulso" aria-hidden="true" />
}

// ── AJILEI ──────────────────────────────────────────────────────────────────
// La palabra en grande con el tratamiento de marca: --gold-brand y la traza de
// .table-title, ambos tokens vivos (el CSS los hereda, aquí no se cablea nada).
// Aparición molde msgPop. Una sola vez, breve.
// IDN-1 · pasa a [letra doble] + ILEI, como los otros dos sitios del wordmark.
// El `aria-label` va en el <span> y no en la capa: la capa es `role="status"`
// —lo que se ANUNCIA— y el nombre tiene que ser el de la marca entera, no
// "ILEI". Nótese que el overlay es `fixed` y no tiene vecinos en flujo: aquí
// la ranura de FL-1 no está evitando un reflow de la página, está evitando que
// el símbolo empuje a sus propias letras.
export function AjileiOverlay({ activa }) {
  if (!activa || activa.esperando || activa.nivel !== 'ajilei') return null
  return (
    <div className="vc-ajilei-capa" role="status">
      <span key={activa.id} className="vc-ajilei" aria-label="AJILEI"><Wordmark /></span>
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
        <span className="vc-netas-word">Heptacoins</span>
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
