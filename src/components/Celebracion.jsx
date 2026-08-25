import { useState, useEffect, useRef } from 'react'
import ChipToken from './ChipToken'
import { Wordmark } from './Wordmark'
import { VIAJE_MS, VIAJE_ESCALON_MS, VIAJE_DESVANECIDO_MS, llevaViaje, llevaPulso } from '../hooks/celebracionCore'
import { valorConteo } from '../hooks/sesionCore'
import { useCoreografia } from '../hooks/useCoreografia'
import { LluviaHeptacoins } from './LluviaHeptacoins'
import { SoundButton } from './SoundButton'
import { frasePara } from '../config/frasesVictoria'
import { fraseForzadaCEL } from '../dev/siembraCEL'
import '../styles/celebracion.css'

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
//
// ── CEL-2 · El conteo dejó de ser suyo ──────────────────────────────────────
// Hasta CEL-1 la tarjeta llevaba su propio rAF y su propio `pointerdown`. Ahora
// hay UN arco con UN reloj —`useCoreografia`— y la tarjeta recibe `progreso`,
// que es lo único que necesita: la curva sigue siendo `valorConteo`, la de VC2,
// ni tocada ni copiada. Dos relojes para dos cifras que tienen que aterrizar
// juntas es exactamente cómo se desincronizan.
//
// `progreso = 1` por defecto: quien monte esta tarjeta sin arco —una prueba, un
// resumen futuro en otro sitio— ve las cifras finales, jamás ceros.
export function TarjetaResumen({ sesion, netas, saldo, puntos, progreso = 1 }) {
  const valor = valorConteo(netas, progreso)
  // "Saldo actual" ACOMPAÑA a las netas: mismo reloj, misma curva, misma
  // llegada. Lo que sube no son dos números sueltos, es una sola cuenta.
  const saldoVivo = valorConteo(saldo, progreso)

  const signo = valor > 0 ? '+' : ''
  return (
    <div className="cel-tarjeta">
      <p className={`cel-netas${netas >= 0 ? '' : ' cel-netas-neg'}`}>
        <span className="cel-netas-ico"><ChipToken size="hero" /></span>
        <span className="cel-netas-num">{signo}{valor}</span>
        <span className="cel-netas-word">Heptacoins</span>
      </p>
      <dl className="cel-detalle">
        {/* CEL-1 · Las dos cifras nuevas van PRIMERO y destacadas: son las que
            la lámina quiere que se lean antes que la estadística.
            "Saldo actual" pinta `human.chips`, el dato VERDADERO del estado —
            jamás la fórmula 5000 + 5000×rivales. Coinciden hoy porque el humano
            se lo llevó todo, pero el día que la economía cambie (recompra,
            bono, premio escalado) la fórmula mentiría y el estado no. */}
        <div className="cel-linea-alta"><dt>Saldo actual</dt><dd>{saldoVivo}</dd></div>
        <div className="cel-linea-alta"><dt>Puntos obtenidos</dt><dd>{puntos}</dd></div>
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

// ── CEL-1 · La pantalla de victoria de mesa ─────────────────────────────────
// Rector: lámina CEL-1, validada por Victor. Cinco piezas en columna sobre el
// fieltro: AJILEI, la frase del ganador, la tarjeta, un botón primario ÚNICO y
// el enlace de ranking, inerte.
//
// ES UN COMPONENTE Y NO UNA RAMA MÁS DEL JSX DE GameTable, por una razón que no
// es de orden: la frase se elige AL MONTAR LA PANTALLA. Con la elección dentro
// de GameTable, el `useState` inicializador correría al montar la MESA —minutos
// antes, y una sola vez para toda la sesión—, así que dos victorias seguidas
// enseñarían la misma frase. Montando aquí, el inicializador corre exactamente
// cuando la pantalla aparece, que es lo que la lámina pide.
//
// La pantalla de DERROTA no pasa por aquí y no cambia ni un byte: sigue siendo
// `.game-over-screen` con su mensaje. La frase es del ganador.
export function PantallaVictoria({ sesion, netas, saldo, puntos, precedente, onLeave }) {
  const [frase] = useState(() => frasePara(fraseForzadaCEL()))
  // CEL-2 · El arco. `precedente` es el toc-toc que GameTable ya disparaba al
  // entrar en GAME_OVER: aquí no se dispara nada, se ESPERA a que termine.
  const { fase, progreso, melodia, oculta, quietud } = useCoreografia({ precedente, netas, saldo })

  return (
    // `data-fase` es el único mando de la coreografía visual: la hoja apaga el
    // resplandor y esconde la frase mientras dice `sobria`, y los enciende sin
    // una línea de JS en cuanto dice `fiesta`. Que el estado del arco viaje por
    // un atributo y no por seis clases sueltas es lo que hace que el arnés
    // pueda medir la secuencia — y que no exista un estado visual que el DOM no
    // declare.
    <div className="cel-screen" data-fase={fase} data-melodia={melodia ?? ''}>
      {/* La lluvia va DENTRO de la columna y detrás de ella (`z-index`), y
          nace en `fiesta`. Sigue montada en `calma` porque ahí ya no emite pero
          las monedas del aire tienen que terminar de caer.
          Con movimiento reducido no se monta jamás: no hay lluvia atenuada, hay
          lluvia o no la hay. */}
      {!quietud && fase !== 'sobria'
        ? <LluviaHeptacoins emitiendo={fase === 'fiesta'} pausada={oculta} />
        : null}
      {/* El resplandor de portada, REUTILIZADO: este anfitrión está en la lista
          de selectores de embellecimiento.css §2, no en una copia del efecto.
          `aria-label` porque el wordmark es un símbolo más "ILEI": sin él, la
          marca se vuelve invisible para quien no ve (IDN-1). */}
      <h1 className="cel-ajilei" aria-label="AJILEI"><Wordmark /></h1>

      <p className="cel-frase">{frase}</p>

      <TarjetaResumen sesion={sesion} netas={netas} saldo={saldo} puntos={puntos} progreso={progreso} />

      <SoundButton className="btn btn-primary" onClick={onLeave}>Salir de la mesa</SoundButton>

      {/* `disabled` REAL y no un `pointer-events: none`: así no recibe foco, no
          se pulsa con teclado y el lector de pantalla lo anuncia. Mismo
          tratamiento que las entradas inertes del menú de utilidades. Es
          <button> y no <a> a propósito — `disabled` no existe en un enlace, y un
          <a> sin href tampoco es un control. No navega a ningún sitio. */}
      <button type="button" className="cel-ranking" disabled aria-disabled="true">
        Ver tu nuevo ranking
        <span className="soon-tag">Próximamente</span>
      </button>
    </div>
  )
}
