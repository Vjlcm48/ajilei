import { useCallback, useEffect, useRef, useState } from 'react'
import '../styles/salas.css'

import BarraSuperior from './BarraSuperior'
import { IconoVolver, IconoCasa } from './IconosSalas'
import { useIdioma } from '../hooks/useIdioma'
import { ProntoContext } from '../hooks/usePronto'

// ── APU-1 1e · K-3a · La carcasa de las pantallas de chips ──────────────────
// Rector: AJILEI_APU-1_Fase1e_v1.0.md §2.1.
//
// Barra superior · cabecera con flecha · cuerpo · CTA con su nota · casa ·
// toast. Es lo que `ArmarMesa` montaba a mano y lo que «Retar a las IAS»
// montaría igual, línea por línea, si no se extrajera.
//
// ── LA FLECHA Y LA CASA NO SON LO MISMO ─────────────────────────────────────
// La flecha deshace UN paso; la casa salta al lobby de un tirón (§5.1 de
// SAL-B1). En `SalaOpciones` coinciden y en las otras dos no, y tener las dos es
// lo que permite que quien entró a mirar salga sin desandar. Se conservan las
// dos aquí, con sus dos `data-accion` de contrato.
//
// ── EL TOAST VIVE EN LA CARCASA, Y NO ES DETALLE ────────────────────────────
// Los tres accesos de la barra superior —perfil, tienda, ⚙— no llevan a ninguna
// parte todavía y responden «Pronto». Eso es comportamiento de la CARCASA, no
// de la pantalla: `ArmarMesa` y `RetarIAS` no tienen nada que decir al respecto
// y duplicar el `setTimeout` en cada una sería dejar dos relojes que limpiar.
// Es el único aviso de estas dos pantallas, así que es uno y no tres.
//
// ── LO QUE ESTA CARCASA NO HACE: RECORDAR ───────────────────────────────────
// §2.1 describe `memoria` como un campo de este contrato. No puede vivir aquí, y
// la razón es mecánica: quien decide CUÁNDO se guarda es la pantalla —en
// `ArmarMesa`, con la respuesta del servidor ya en la mano, que es una espera
// asíncrona— y la carcasa sólo renderiza. Un `memoria` colgado de aquí sería un
// parámetro que nadie llega a leer. La política —que es lo que L-6 quiere
// compartido— vive entera en `config/memoriaChips.js` y las dos pantallas
// declaran la suya con dos listas de campos distintas. Consignado en §E.
// ── RET-A · EL «PRONTO» BAJA A LOS HIJOS, EL MARCADO NO SUBE ───────────────
// «Retar a las IAS» necesita dentro del cuerpo un botón que diga lo mismo que el
// `+` dorado de la cabecera. Lo que se comparte es el MANEJADOR, por contexto
// (`hooks/usePronto.js`, que explica por qué no es un parámetro de render); el
// bloque se queda en la pantalla que lo pinta, porque es UI de una sola de las
// dos y subirlo aquí le daría a `ArmarMesa` un trozo de marcado que no usa.

export default function PantallaChips({
  titulo,
  clase = '',
  cuenta,
  saldo,
  // ECO-1b · cargando, listo o error: viaja a `data-saldo` de la píldora.
  estadoSaldo,
  // ECO-1c · el aviso de saldo (lámina `laminas/eco1c`), para la píldora.
  aviso = null,
  onAvisoFin,
  onVolver,
  onLobby,
  cta,
  children,
}) {
  const { t } = useIdioma()

  const [toast, setToast] = useState(null)
  const relojToast = useRef(null)

  useEffect(() => {
    document.body.classList.add('sal-activa')
    return () => { document.body.classList.remove('sal-activa') }
  }, [])

  useEffect(() => () => clearTimeout(relojToast.current), [])

  // Los tres accesos dicen lo mismo, así que hay UN aviso y no tres relojes.
  //
  // ── ECO-1: conectar a la tienda / videos ──────────────────────────────────
  // Éste es EL punto: el `+` dorado de la píldora, el avatar, el ⚙ y —desde
  // RET-A— el botón «Conseguir más monedas» de «Retar a las IAS» entran todos
  // por aquí. El día que haya tienda, lo que hoy es un toast se convierte en una
  // ruta y las cuatro entradas la heredan sin tocarse. Por eso el botón nuevo
  // recibe este manejador en vez de montar el suyo: dos «Pronto» serían dos
  // sitios que alguien tendría que acordarse de conectar.
  const pronto = useCallback(() => {
    setToast('lob.toast.pronto')
    clearTimeout(relojToast.current)
    relojToast.current = setTimeout(() => setToast(null), 2600)
  }, [])

  return (
    <main className="sal">
      <div className="sal-fondo" aria-hidden="true" />

      <BarraSuperior
        usuario={cuenta?.username ?? ''}
        saldo={saldo}
        estadoSaldo={estadoSaldo}
        aviso={aviso}
        onAvisoFin={onAvisoFin}
        onPerfil={pronto}
        onTienda={pronto}
        onAjustes={pronto}
      />

      <div className="sal-cab">
        <button
          type="button"
          className="sal-volver"
          data-accion="volver"
          aria-label={t('sal.volver.aria')}
          onClick={() => onVolver?.()}
        >
          <IconoVolver />
        </button>
        <h1>{titulo}</h1>
      </div>

      <div className={`sal-cuerpo${clase ? ` ${clase}` : ''}`}>
        <ProntoContext.Provider value={pronto}>{children}</ProntoContext.Provider>

        <section className="sal-accion">
          <button
            type="button"
            className={`sal-cta${cta?.clase ? ` ${cta.clase}` : ''}`}
            data-accion="cta"
            disabled={Boolean(cta?.disabled)}
            onClick={cta?.onClick}
          >
            {cta?.etiqueta}
          </button>
          {/* O1 · la nota reserva su caja: aparece y desaparece según el estado
              de la pantalla, y sin reserva movería el CTA bajo el dedo. */}
          <small data-accion="cta-nota" role={cta?.alerta ? 'alert' : undefined}>
            {cta?.nota ?? ' '}
          </small>
        </section>
      </div>

      <button
        type="button"
        className="sal-casa"
        data-accion="casa"
        aria-label={t('sal.casa.aria')}
        onClick={() => onLobby?.()}
      >
        <IconoCasa />
      </button>

      <div className={`sal-toast${toast !== null ? ' is-on' : ''}`} role="status" aria-live="polite">
        {toast !== null ? t(toast) : ' '}
      </div>
    </main>
  )
}
