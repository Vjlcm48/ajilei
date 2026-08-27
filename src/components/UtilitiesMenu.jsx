import { useState, useEffect, useRef } from 'react'
import { useSoundContext } from '../context/SoundContext'
import ChipToken from './ChipToken'
import { GodeteIcon } from './TapetesPanel'
import { BADGE_POPUP_MS } from '../config/consultas'
import { ENTRADA, VIVAS_ESCRITORIO } from '../config/menuEntradas'

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
// Trazo en currentColor → hereda --text-primary de la entrada: el ÚNICO oro
// sólido del panel es la ficha de Saldo (glifo de moneda ya establecido en la
// app) y el único acento dorado nuevo es el filete del badge. Single-gold intacto.
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

// SUP-2b · Silueta de jugador — icono propio de "Cuenta". Mismo molde que
// CardQueryIcon (U1b) y GodeteIcon (EMB-2): SVG en línea, monocromo, trazo en
// `currentColor` para heredar --text-primary de la entrada, sin un solo relleno
// de color. Se descartó el emoji 👤: los dos emoji que quedan en el panel (🔊 y
// 💬) son de las entradas que ya los tenían, y la costumbre desde U1b es que
// todo icono NUEVO sea SVG de la casa. Single-gold intacto — el único oro sólido
// del panel sigue siendo la ficha de Saldo.
function CuentaIcon() {
  return (
    <svg
      className="util-ico util-ico-cuenta"
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="12" cy="8" r="3.9" fill="none" stroke="currentColor" strokeWidth="1.75" />
      {/* Hombros abiertos y no un óvalo cerrado: cerrado se lee como ficha, que
          es justo el glifo que ya ocupa Saldo dos filas más abajo. */}
      <path
        d="M4.6 20.4c0-3.9 3.3-6.4 7.4-6.4s7.4 2.5 7.4 6.4"
        fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"
      />
    </svg>
  )
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

// Entradas inertes: presentes, visibles y sin respuesta al clic — el estado de
// no habilitados que la v1.1 §6 hereda de la v1.0 §3.
// DSK-U2 · "Mensajes" SALE de aquí: pasa a ser Reacciones, entrada viva. Queda
// sola "Saldo", que reutiliza el ChipToken del cornerChip (el glifo de moneda
// de la app ya existe y es SVG dorado plano — inventar otro rompería el
// lenguaje).
const INERTES = [
  { key: ENTRADA.SALDO, title: 'Saldo', ico: <span className="util-ico util-ico-chip" aria-hidden="true"><ChipToken size="compact" /></span> },
]

// El gris de una entrada NO se puede resolver desde la hoja: en esta casa
// significa el atributo `disabled` de verdad —más `aria-disabled`—, y eso no se
// declara en CSS. Un `pointer-events: none` pintaría igual y le mentiría al
// lector de pantalla, que anunciaría entradas accionables que no hacen nada.
export function UtilitiesPanel({
  anchor, onClose, onReacciones, reaccionesBloqueadas,
  consultas, manoDisponible, onManoActual, onTapetes, onCuenta,
  vivas = VIVAS_ESCRITORIO, presentes = null,
}) {
  const viva = (id) => vivas.includes(id)
  // SUP-2b · el segundo eje del panel: quién MONTA, distinto de quién está viva.
  // `null` = todas, que es el caso de siempre y el valor por defecto —así
  // escritorio y móvil vertical no cambian ni una línea de render.
  const presente = (id) => !presentes || presentes.includes(id)
  const { soundEnabled, toggle: toggleSound } = useSoundContext()
  // DSK-U3 · el saldo de consultas SUBE a useConsultas. Ya no puede vivir en un
  // useState local: el consumo lo mueve desde fuera y el popup del valor se
  // pinta cuando este panel ya se ha desmontado (cierra al ejecutar). Un solo
  // estado, dos consumidores — molde U1.
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
      const r = el.getBoundingClientRect()
      return { right: window.innerWidth - r.left + 8, top: r.top + r.height / 2 }
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

        {/* EMB-2 · Tapetes · tercera entrada VIVA. Va AQUÍ, cerrando el grupo
            de las vivas y por delante de la inerte, porque el orden del panel
            agrupa por estado (vivas → inertes → premium) y no por antigüedad.
            Cierra al ejecutar, como sus hermanas (v1.1 §1.3.1): el panel de
            tapetes toma el relevo y no tiene sentido sostener dos superficies
            del mismo menú a la vez. */}
        <button
          type="button"
          role="menuitem"
          className={`util-item util-item-tapetes${viva(ENTRADA.TAPETES) ? '' : ' is-disabled'}`}
          data-entrada={ENTRADA.TAPETES}
          onClick={() => { onClose(); onTapetes() }}
          disabled={!viva(ENTRADA.TAPETES)}
          aria-disabled={viva(ENTRADA.TAPETES) ? undefined : 'true'}
          title="Tapetes"
        >
          <GodeteIcon />
        </button>

        {/* SUP-2b · Cuenta · CUARTA entrada viva. Va aquí, cerrando el grupo de
            las vivas y por delante de la inerte, porque el orden del panel
            agrupa por estado (vivas → inertes → premium) y no por antigüedad —
            la misma razón por la que Tapetes se puso delante de Saldo en EMB-2.
            Cierra al ejecutar, como sus tres hermanas (v1.1 §1.3.1): el panel de
            cuenta toma el relevo y no tiene sentido sostener dos superficies del
            mismo menú a la vez. */}
        {/* NO MONTA en móvil horizontal, y es la primera entrada del panel que
            deja de montar en una piel. Se QUITA del árbol en vez de ocultarse
            con CSS —misma doctrina que el ⋮ en la pantalla de victoria (CEL-2e):
            es la única forma de que tampoco sea enfocable con el teclado, y
            además es lo único que le devuelve al panel sus 244 de alto—. El
            porqué medido vive en la lista, en config/menuEntradas.js. */}
        {presente(ENTRADA.CUENTA) && (
          <button
            type="button"
            role="menuitem"
            className={`util-item util-item-cuenta${viva(ENTRADA.CUENTA) ? '' : ' is-disabled'}`}
            data-entrada={ENTRADA.CUENTA}
            onClick={() => { onClose(); onCuenta() }}
            disabled={!viva(ENTRADA.CUENTA)}
            aria-disabled={viva(ENTRADA.CUENTA) ? undefined : 'true'}
            title="Cuenta"
          >
            <CuentaIcon />
          </button>
        )}

        {INERTES.map(e => (
          <button
            key={e.key}
            type="button"
            role="menuitem"
            className="util-item is-disabled"
            data-entrada={e.key}
            title={e.title}
            disabled
            aria-disabled="true"
          >
            {e.ico}
          </button>
        ))}

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
            pinza vertical del móvil horizontal. */}
        <div
          className={`util-item util-item-mano${manoDisponible && viva(ENTRADA.MANO) ? '' : ' is-disabled'}`}
          data-entrada={ENTRADA.MANO}
          title="Mano actual"
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
            aria-label="Mano actual"
            aria-disabled={manoDisponible && viva(ENTRADA.MANO) ? undefined : 'true'}
            disabled={!manoDisponible || !viva(ENTRADA.MANO)}
            onClick={() => { onClose(); onManoActual() }}
          >
            <CardQueryIcon />
          </button>
          {viva(ENTRADA.CONTADOR) && (
            <button
              ref={badgeRef}
              type="button"
              className="util-badge"
              onClick={pressBadge}
              aria-label={`${consultas} consultas gratis`}
            >
              {consultas}
            </button>
          )}
        </div>
      </div>

      {popup && (
        <div
          className="utilities-popup"
          role="status"
          style={{ right: `${popup.right}px`, top: `${popup.top}px` }}
        >
          Tienes {consultas} consultas gratis
        </div>
      )}
    </>
  )
}
