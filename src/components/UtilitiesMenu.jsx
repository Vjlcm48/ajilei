import { useState, useEffect, useRef } from 'react'
import '../styles/utilidadesMesa.css'
import { useSoundContext } from '../context/SoundContext'
import { BADGE_POPUP_MS } from '../config/consultas'
import { ENTRADA, VIVAS_ESCRITORIO } from '../config/menuEntradas'
import { aPropios, escalaActual } from '../lib/escala'
import { useIdioma } from '../hooks/useIdioma'

// ── DSK-U1 / U1b · Menú de utilidades (SOLO gate de escritorio) ─────────────
// Documento rector: docs/AJILEI_Menu_Utilidades_v1.1.md (+ enmienda y apéndices).
// El estado del menú vive en useUtilitiesMenu.
//
// El disparador ⋮ ocupa la caja EXACTA del botón de sonido de hoy; la reserva la
// pone el CSS (ley E2 del diagnóstico U1: sin ancho y alto explícitos el glifo
// encoge el botón 15,61px y arrastra .header-right en las 20 celdas).
//
// El panel es fuera de flujo y se monta como HERMANO del área, junto a las
// cartas voladoras: `fixed` sin ancestro con transform → ancla al viewport, así
// que no necesita portal (ensayo E3b: Δ=0 en 11 anclas y overflow +0 en 20/20).
//
// U1b · las entradas pierden la palabra y se quedan en ICONO + tooltip nativo.
// El panel encoge en ANCHO, nunca en área táctil: cada fila conserva sus 44px.

// Silueta de carta con "?" — icono propio de "Mano actual". Proporción del
// sistema: los assets son 1055×1491 (ratio 0,7076); 22×31 es su simplificación
// entera más cercana (0,7097), la misma familia de proporción que --card-w/h.
// Trazo en currentColor → hereda --text-primary de la entrada: el único acento
// dorado del panel es el filete del badge (y, desde CFG-1 1e, el de su hermana,
// la pastilla de Partida rápida). La ficha de Saldo, que era su único oro
// sólido, salió en CFG-1 1e. Single-gold intacto.
function CardQueryIcon() {
  return (
    <svg
      className="util-ico util-ico-card"
      viewBox="0 0 22 31"
      aria-hidden="true"
      focusable="false"
    >
      <rect
        x="1" y="1" width="20" height="29" rx="3"
        fill="none" stroke="currentColor" strokeWidth="1.75"
      />
      <text
        x="11" y="22" textAnchor="middle"
        fontSize="16" fontWeight="700" fill="currentColor"
      >?</text>
    </svg>
  )
}

// CFG-1 1e · Doble punta de avance — icono propio de "Partida rápida". Mismo
// molde que CardQueryIcon y GodeteIcon: SVG en línea, monocromo, trazo en
// `currentColor`. Apagada lleva `is-off`, como el sonido (INV-68): el icono se
// atenúa y la pastilla dice «No».
function RapidaIcon() {
  return (
    <svg
      className="util-ico util-ico-rapida"
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M3.5 6.5 11 12l-7.5 5.5zM12.5 6.5 20 12l-7.5 5.5z"
        fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round"
      />
    </svg>
  )
}

// CFG-1 1e · Lo que la entrada "Mano actual" dice de sí misma
// (`etiquetaConsulta`, consultasCore): el texto largo para el nombre accesible y
// el popup del badge, y la parte corta para la pastilla —la cifra de gratis, el
// precio de la mano o ✓ si ya está pagada—.
function textoMano(etiqueta, t) {
  if (!etiqueta) return { largo: t('ia.mesa.menu.mano'), corto: null, precio: false }
  if (etiqueta.tipo === 'pagada') return { largo: t('ia.mesa.menu.mano.pagada'), corto: '✓', precio: false }
  if (etiqueta.tipo === 'precio') return { largo: t('ia.mesa.menu.mano.precio', { hc: etiqueta.precio }), corto: String(etiqueta.precio), precio: true }
  return { largo: t('ia.mesa.menu.mano.gratis', { n: etiqueta.n }), corto: String(etiqueta.n), precio: false }
}

// Disparador — hereda la clase .mute-button para conservar borde, radio, color y
// transición EXACTOS del botón de hoy; .utilities-trigger sólo añade la reserva
// de caja y el glifo. La reserva de badge de notificación (v1.0 §5) sigue sin
// implementar, pero la caja fija es justo lo que la hará posible sin mover nada.
export function UtilitiesTrigger({ open, onToggle, registerTrigger }) {
  return (
    <button
      ref={registerTrigger}
      className={`mute-button utilities-trigger${open ? ' is-open' : ''}`}
      onClick={onToggle}
      aria-haspopup="menu"
      aria-expanded={open}
      title="Utilidades"
    >
      ⋮
    </button>
  )
}

// El gris de una entrada NO se puede resolver desde la hoja: en esta casa
// significa el atributo `disabled` de verdad —más `aria-disabled`—, y eso no se
// declara en CSS. Un `pointer-events: none` pintaría igual y le mentiría al
// lector de pantalla, que anunciaría entradas accionables que no hacen nada.
export function UtilitiesPanel({
  anchor, onClose, onReacciones, reaccionesBloqueadas,
  etiquetaMano = null, manoDisponible, onManoActual,
  rapida = false, onRapida,
  vivas = VIVAS_ESCRITORIO, presentes = null,
}) {
  const { t } = useIdioma()
  const viva = (id) => vivas.includes(id)
  // SUP-2b · el segundo eje del panel: quién MONTA, distinto de quién está viva.
  // `null` = todas, que es el caso de siempre y el valor por defecto —así
  // escritorio y móvil vertical no cambian ni una línea de render.
  const presente = (id) => !presentes || presentes.includes(id)
  const { soundEnabled, toggle: toggleSound } = useSoundContext()
  // DSK-U3 · el saldo de consultas SUBE a useConsultas. Ya no puede vivir en un
  // useState local: el consumo lo mueve desde fuera y el popup del valor se
  // pinta cuando este panel ya se ha desmontado (cierra al ejecutar). Un solo
  // estado, dos consumidores — molde U1. CFG-1 1e · llega ya como etiqueta.
  const mano = textoMano(etiquetaMano, t)
  const [popup, setPopup] = useState(null)   // null = cerrado; {top,right} = abierto
  const badgeRef = useRef(null)
  const popupTimer = useRef(null)

  // Cierre del popup por sus DOS vías exactas: clic en cualquier otra parte o
  // autocierre a los 2s, lo que llegue primero. Molde H4 (setTimeout en ref +
  // pointerdown en captura, sin overlay).
  // INVARIANTE SELLADO: presionar el badge NO es "ejecutar" — el menú sigue
  // abierto. Se cumple sin código extra: el badge vive DENTRO de .utilities-panel
  // y el listener del menú ignora todo lo que caiga ahí. Un clic fuera del panel
  // cierra ambos, que es lo coherente.
  useEffect(() => {
    if (!popup) return
    popupTimer.current = setTimeout(() => setPopup(null), BADGE_POPUP_MS)
    const onDown = (e) => {
      if (e.target.closest && e.target.closest('.util-badge, .utilities-popup')) return
      setPopup(null)
    }
    document.addEventListener('pointerdown', onDown, true)
    return () => {
      clearTimeout(popupTimer.current)
      document.removeEventListener('pointerdown', onDown, true)
    }
  }, [popup])

  if (!anchor) return null

  // El popup se ancla al badge y se mide al abrir, igual que el panel al ⋮. Se
  // posiciona por su borde DERECHO (a la izquierda del badge) para no depender
  // de un ancho que cambia con la cifra; el centrado vertical lo hace el CSS.
  const pressBadge = () => {
    setPopup(prev => {
      if (prev) return null
      const el = badgeRef.current
      if (!el) return null
      // TAB-1 · el popup es `fixed` dentro de #root ampliado: px propios.
      const f = escalaActual()
      const r = aPropios(el.getBoundingClientRect(), f)
      return { right: window.innerWidth / f - r.left + 8, top: r.top + r.height / 2 }
    })
  }

  return (
    <>
      <div
        className="utilities-panel"
        role="menu"
        // `anchor.top` llega como longitud CSS (clamp con área segura, D4 de
        // MOV-1a); `anchor.left` sigue siendo número.
        style={{ left: `${anchor.left}px`, top: anchor.top }}
      >
        {/* Sonido · único toggle vivo. Cierra al ejecutar (v1.1 §1.3.1): el
            efecto es inmediato y audible, el panel no tiene nada más que decir.
            Sin palabra, el estado lo porta el propio glifo (más la clase). */}
        <button
          type="button"
          role="menuitem"
          className={`util-item util-item-sound${soundEnabled ? '' : ' is-off'}`}
          data-entrada={ENTRADA.SONIDO}
          onClick={() => { toggleSound(); onClose() }}
          title="Sonido"
        >
          <span className="util-ico" aria-hidden="true">{soundEnabled ? '🔊' : '🔇'}</span>
        </button>

        {/* DSK-U2 · Reacciones · segunda entrada VIVA. Cierra al ejecutar, como
            su hermana Sonido (v1.1 §1.3.1): el panel no tiene nada más que
            decir, el selector toma el relevo. Durante el cooldown queda inerte
            con clase PROPIA (`is-cooling`), nunca con `is-disabled`: aquélla es
            la lengua de "no habilitado" —permanente— y esto es un estado
            temporal de una entrada que sí está habilitada. */}
        <button
          type="button"
          role="menuitem"
          className={`util-item util-item-reacciones${!viva(ENTRADA.REACCIONES) ? ' is-disabled' : reaccionesBloqueadas ? ' is-cooling' : ''}`}
          data-entrada={ENTRADA.REACCIONES}
          onClick={() => { onClose(); onReacciones() }}
          disabled={!viva(ENTRADA.REACCIONES) || reaccionesBloqueadas}
          aria-disabled={viva(ENTRADA.REACCIONES) ? undefined : 'true'}
          title={viva(ENTRADA.REACCIONES) && reaccionesBloqueadas ? 'Reacciones (espera un momento)' : 'Reacciones'}
        >
          <span className="util-ico" aria-hidden="true">💬</span>
        </button>

        {/* CFG-1 1e · Partida rápida · ocupa el sitio de la Saldo inerte, que
            sale con "Cuenta" (§0-1: el perfil tiene sus tres puertas desde la
            1b; el ojito del lobby relevó al interruptor de saldo, INV-69). Es
            un interruptor como el sonido —cierra al ejecutar, `is-off`
            apagada— y SOLO MONTA contra las IAS (`presentes`, INV-70): contra
            humanos el ritmo lo decide el anfitrión. La pastilla dice Sí/No en
            las dos pieles; el `title` sigue diciendo sólo el nombre (U1b). */}
        {presente(ENTRADA.RAPIDA) && (
          <button
            type="button"
            role="menuitemcheckbox"
            aria-checked={rapida}
            aria-label={t('ia.mesa.menu.rapida.estado', { estado: t(rapida ? 'lob.cfg.si' : 'lob.cfg.no') })}
            className={`util-item util-item-rapida${rapida ? '' : ' is-off'}${viva(ENTRADA.RAPIDA) ? '' : ' is-disabled'}`}
            data-entrada={ENTRADA.RAPIDA}
            data-rapida={rapida ? 'si' : 'no'}
            onClick={() => { onRapida?.(); onClose() }}
            disabled={!viva(ENTRADA.RAPIDA)}
            title={t('ia.mesa.menu.rapida')}
          >
            <RapidaIcon />
            <span className={`util-estado${rapida ? ' es-si' : ''}`} aria-hidden="true">
              {t(rapida ? 'lob.cfg.si' : 'lob.cfg.no')}
            </span>
          </button>
        )}

        {/* "Mano actual" · última y separada por el filete del sistema: es la
            entrada premium y no pertenece al grupo de las tres.
            Va en <div>, no en <button>: un botón deshabilitado bloquea los
            eventos de sus hijos y el badge —que sí está vivo siempre— quedaría
            muerto. El contenedor sólo agrupa; quien recibe el press es el
            icono. */}
        {/* El tooltip es la ÚNICA leyenda de un panel sin palabras, así que no
            se le cuelga el estado: dice el nombre de la entrada y nada más. La
            no-disponibilidad la porta el lenguaje visual del sistema
            (`is-disabled`: atenuado y sin respuesta) más `aria-disabled` para
            quien no ve la atenuación. */}
        {/* MOV-1b-a · la entrada se ENCIENDE en móvil; el badge sigue sin
            montarse. No es olvido: el popup del contador (`.utilities-popup`)
            se ancla al propio badge y en horizontal el panel vive en el filo
            izquierdo, así que se saldría de la pantalla. El saldo de consultas
            es el MISMO —una sola clave, un solo contador— y la cifra se dice al
            consultar, en la última línea del aviso. No cuesta geometría:
            `.util-badge` es `position: absolute` (gameTable.css:5940-5942),
            luego el panel mide lo mismo con badge y sin él.
            SUP-2b · esa medida pasa a ser 64×288: la entrada "Cuenta" añade una
            sexta fila de 44 y el panel crece con ella. El alto no está declarado
            en ninguna de las dos hojas —sólo el ancho lo está—, así que la fila
            se pinta sola y `gameTable.css` no se abre; lo que sí se actualiza es
            el espejo `PANEL_H` de useUtilitiesMenu.js, que es de donde sale la
            pinza vertical del móvil horizontal.
            CFG-1 1e · salen "Cuenta" y "Saldo" y entra "Partida rápida": cinco
            filas contra las IAS (64×244) y cuatro sin ella (200), en las dos
            pieles. En móvil la cifra ya no espera al aviso: va en la pastilla. */}
        <div
          className={`util-item util-item-mano${manoDisponible && viva(ENTRADA.MANO) ? '' : ' is-disabled'}`}
          data-entrada={ENTRADA.MANO}
          title={t('ia.mesa.menu.mano')}
        >
          {/* El rol de menú vive en el ICONO, no en el contenedor: un control
              vivo —el badge— no puede colgar de un subárbol `aria-disabled`.
              Las herramientas de accesibilidad lo tratarían como muerto, y con
              razón (Playwright se niega a pulsarlo, que fue justo como salió
              esto).
              DSK-U3 · el icono pasa de <span> inerte a <button> vivo. Cierra al
              ejecutar como sus hermanas (v1.1 §1.3.1): el valor se pinta en su
              propia superficie, que el panel ya no puede sostener. Fuera de las
              fases consultables queda `is-disabled` —la lengua de "no
              habilitado" del sistema, distinta del `is-off` de apagado-por-ti. */}
          <button
            type="button"
            className="util-ico-slot"
            role="menuitem"
            aria-label={mano.largo}
            aria-disabled={manoDisponible && viva(ENTRADA.MANO) ? undefined : 'true'}
            disabled={!manoDisponible || !viva(ENTRADA.MANO)}
            onClick={() => { onClose(); onManoActual() }}
          >
            <CardQueryIcon />
          </button>
          {/* CFG-1 1e · el badge dice la cifra de gratis, el precio de la mano
              (más menudo: tres cifras en el mismo disco de 18) o ✓ con la mano
              pagada. En escritorio sigue siendo el control de U1b con su
              popup; en móvil, donde ese popup se saldría (v1.5 §7.1), la misma
              cifra va en una pastilla que no se toca. Sin cifra todavía (el
              servidor no contestó), no hay pastilla. */}
          {mano.corto !== null && viva(ENTRADA.CONTADOR) && (
            <button
              ref={badgeRef}
              type="button"
              className={`util-badge${mano.precio ? ' es-precio' : ''}`}
              data-estado={etiquetaMano?.tipo}
              onClick={pressBadge}
              aria-label={mano.largo}
            >
              {mano.corto}
            </button>
          )}
          {mano.corto !== null && !viva(ENTRADA.CONTADOR) && (
            <span className={`util-estado util-estado-mano${mano.precio ? ' es-precio' : ''}`} data-estado={etiquetaMano?.tipo} aria-hidden="true">
              {mano.corto}
            </span>
          )}
        </div>
      </div>

      {popup && (
        <div
          className="utilities-popup"
          role="status"
          style={{ right: `${popup.right}px`, top: `${popup.top}px` }}
        >
          {mano.largo}
        </div>
      )}
    </>
  )
}
