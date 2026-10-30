import { useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react'
import '../styles/salas.css'

import BarraSuperior from './BarraSuperior'
import HojaConfiguracion from './HojaConfiguracion'
import CajaAccion from './CajaAccion'
import { useDesborde } from '../hooks/useDesborde'
import { IconoVolver, IconoCasa } from './IconosSalas'
import { useIdioma } from '../hooks/useIdioma'

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
// Dos accesos de la barra superior —perfil y ⚙— no llevan a ninguna parte
// todavía y responden «Pronto». Eso es comportamiento de la CARCASA, no
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
// ── ECO-1g · EL «+» Y EL BOTÓN DE RETAR YA NO SON «PRONTO» ─────────────────
// RET-A bajaba el «Pronto» a los hijos por contexto (`hooks/usePronto.js`) para
// que el botón «Conseguir más monedas» de Retar dijera lo mismo que el `+`
// dorado. Con el video de recompensa los dos llevan a alguna parte: el `+` abre
// la hoja «Conseguir monedas» desde `BarraSuperior` y el botón de Retar pide el
// video, los dos por el contexto del video (`hooks/useVideo.js`). `usePronto`
// se queda sin consumidores y su `Provider` sale de aquí. El perfil y el ⚙
// siguen diciendo «Pronto» con el aviso de esta carcasa.
// CFG-1 1a · el ⚙ ya no: abre la hoja de configuración (`HojaConfiguracion`),
// la misma del lobby. Sólo el perfil sigue en «Pronto» (lo abre la 1b).
//
// ── IOS-1 1e · LA ZONA ANCLADA ──────────────────────────────────────────────
// Rector: AJILEI_IOS-1_Fase1e_v1.0.md (lámina `laminas/ios1d`, decisiones de
// Victor del 2026-10-16). La acción deja de viajar al final de la columna: es
// una ZONA fija al pie (`.sal-accion`, `sticky` dentro del cuerpo), con el
// bloque que la pantalla mande (`pie`: el video de Retar), la caja de nota o
// resumen (`cta.caja`, ver `CajaAccion`) y el botón dorado, siempre del mismo
// tamaño y siempre entero a la vista. Si las filas no caben, desplaza el CUERPO
// por debajo de la zona; la pantalla ya no desplaza nunca (`es-anclada`).
// La casa sube a la cabecera, a la derecha de la flecha (el pie es del botón),
// y el «Pronto» vive dentro de la zona, apoyado justo encima de ella.
//
// `SalaOpciones` repite este marcado a mano (no usa esta carcasa): un cambio
// aquí se hace también allí.
//
// ── RNK-1c · UNA PANTALLA SIN BOTÓN DORADO Y CON LA LISTA POR DENTRO ────────
// Rector: AJILEI_RNK-1_Fase1c-i_v1.0.md §2.2 (camino (a) de la lámina 1-L).
// Rankings no tiene acción principal: con `cta={null}` no se pintan ni la caja
// ni el botón, y la zona anclada se queda con lo que la pantalla mande en `pie`
// (allí, «Tu posición»). Con `listaInterna` el cuerpo deja de desplazar y lo
// hace sólo el bloque de la pantalla marcado `.sal-desplaza` (salas.css §17).
// `raiz` son atributos para la raíz (`data-ranking`, que elige el fondo). Sin
// estas tres props, Retar, Salas y Armar mesa salen idénticos a como estaban.
//
// ── RNK-1c-ii · LA PANTALLA TAMBIÉN PUEDE PEDIR EL TOAST ────────────────────
// Rector: AJILEI_RNK-1_Fase1c-ii_v1.0.md §2.2. «Jugador no encontrado» sale por
// este mismo toast (un aviso, un reloj), no por uno de la pantalla: con
// `avisoRef`, la carcasa deja en `avisoRef.current.avisar(clave)` la misma
// función que usa el avatar (y hasta CFG-1 1a, el ⚙). Sin la prop, nada cambia.
//
// ── CFG-1 1b · EL AVATAR ABRE EL PERFIL ─────────────────────────────────────
// Rector: AJILEI_CFG-1_Fase1b_v1.0.md §2.7 (R-10). Con `cuenta.abrirPerfil`
// (lo pone `App`) el avatar de la barra lleva al perfil; sin él, «Pronto».
// `avisar(clave, vars)` acepta las variables del texto («Listo: ahora eres
// {nombre}», de la pantalla de perfil).

export default function PantallaChips({
  titulo,
  clase = '',
  cuenta,
  saldo,
  // ECO-1b · cargando, listo o error: viaja a `data-saldo` de la píldora.
  estadoSaldo,
  // IOS-1c · la cifra recordada y el cobro de una salida, sólo para la píldora.
  recordado = null,
  cobrando = false,
  // ECO-1c · el aviso de saldo (lámina `laminas/eco1c`), para la píldora.
  aviso = null,
  onAvisoFin,
  onVolver,
  onLobby,
  cta,
  // IOS-1 1e · lo que la pantalla pone en la zona anclada, encima de la caja.
  pie = null,
  // RNK-1c · sólo desplaza el bloque `.sal-desplaza` de la pantalla.
  listaInterna = false,
  raiz = null,
  // RNK-1c-ii · `{ avisar(claveTexto) }` para la pantalla.
  avisoRef = null,
  children,
}) {
  const { t } = useIdioma()
  // CFG-1 1a · el ⚙ abre la hoja de configuración (antes, «Pronto»).
  const [hojaAbierta, setHojaAbierta] = useState(false)
  const ajustesRef = useRef(null)
  const cuerpo = useRef(null)
  useDesborde(cuerpo)

  const [toast, setToast] = useState(null)
  const relojToast = useRef(null)

  useEffect(() => {
    document.body.classList.add('sal-activa')
    return () => { document.body.classList.remove('sal-activa') }
  }, [])

  useEffect(() => () => clearTimeout(relojToast.current), [])

  // Los dos accesos que quedaban —el avatar y el ⚙— decían lo mismo, así que
  // hay UN aviso y no dos relojes; desde CFG-1 1a el ⚙ abre la hoja. (El `+` dorado y el botón de Retar salieron de
  // aquí con ECO-1g: ver la cabecera.)
  const avisar = useCallback((claveTexto, vars) => {
    setToast({ clave: claveTexto, vars })
    clearTimeout(relojToast.current)
    relojToast.current = setTimeout(() => setToast(null), 2600)
  }, [])
  const pronto = useCallback(() => avisar('lob.toast.pronto'), [avisar])
  useImperativeHandle(avisoRef, () => ({ avisar }), [avisar])

  return (
    <main className={`sal es-anclada${listaInterna ? ' sal--lista-interna' : ''}`} {...raiz}>
      <div className="sal-fondo" aria-hidden="true" />

      <BarraSuperior
        usuario={cuenta?.username ?? ''}
        saldo={saldo}
        estadoSaldo={estadoSaldo}
        recordado={recordado}
        cobrando={cobrando}
        aviso={aviso}
        onAvisoFin={onAvisoFin}
        onPerfil={cuenta?.abrirPerfil ?? pronto}
        onAjustes={() => setHojaAbierta(true)}
        ajustesRef={ajustesRef}
        ajustesExpandido={hojaAbierta}
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
        <button
          type="button"
          className="sal-casa"
          data-accion="casa"
          aria-label={t('sal.casa.aria')}
          onClick={() => onLobby?.()}
        >
          <IconoCasa />
        </button>
      </div>

      <div ref={cuerpo} className={`sal-cuerpo${clase ? ` ${clase}` : ''}`}>
        {children}

        <section className="sal-accion">
          {pie}
          {/* La caja va ENCIMA del botón y crece hacia arriba: la zona está
              anclada al pie, así que nada de lo que diga mueve el botón. */}
          {cta !== null && <CajaAccion caja={cta?.caja} />}
          {cta !== null && (
            <button
              type="button"
              className={`sal-cta${cta?.clase ? ` ${cta.clase}` : ''}`}
              data-accion="cta"
              disabled={Boolean(cta?.disabled)}
              onClick={cta?.onClick}
            >
              {cta?.etiqueta}
            </button>
          )}
          <div className={`sal-toast${toast !== null ? ' is-on' : ''}`} role="status" aria-live="polite">
            {toast !== null ? t(toast.clave, toast.vars) : ' '}
          </div>
        </section>
      </div>
      {/* CFG-1 1a · la hoja del ⚙, la misma del lobby (`HojaConfiguracion`),
          hija directa de `main.sal` y anclada a su relleno. */}
      <HojaConfiguracion
        abierta={hojaAbierta}
        onCerrar={() => setHojaAbierta(false)}
        ajustesRef={ajustesRef}
        cuenta={cuenta}
      />
    </main>
  )
}
