import { TAPETES, montoTexto } from '../config/tapetes'
import { estadoSwatch, textoCompra } from '../hooks/tapetesCore'

// ── EMB-2 · Panel de tapetes ─────────────────────────────────────────────────
// Documento rector: docs/AJILEI_Tapetes_v1.0.md §4 (UX de compra y uso).
//
// Superficie PROPIA y hermana del área, molde de ManoActualPopup (U3) y del
// selector de reacciones (U2): la entrada del ⋮ CIERRA AL EJECUTAR, así que el
// panel de utilidades ya no existe cuando esto se pinta. Se ancla al ⋮ (no al
// panel muerto) por su borde DERECHO.
//
// Overlay puro: `fixed`, fuera de flujo, Δ=0 de layout por construcción — y por
// eso NO BLOQUEA NI PAUSA EL JUEGO (v1.0 §4). El cierre por clic fuera es el
// molde H4 no bloqueante que ya usa el menú: nada de overlay que se trague el
// primer clic sobre los botones de acción.
//
// Ni un monto ni un nombre viven aquí: todo sale de config/tapetes.js (v1.0 §1).

// Godete de pintor — el ícono de "la variedad de temas" que pide el §4. SVG
// inline al molde de CardQueryIcon (U1b): monocromo, trazo en `currentColor`
// para heredar --text-primary de la entrada, sin un solo relleno de color. El
// único oro sólido del panel de utilidades sigue siendo la ficha de Saldo y el
// único acento dorado el filete del badge: single-gold intacto.
export function GodeteIcon() {
  return (
    <svg
      className="util-ico util-ico-godete"
      viewBox="0 0 26 24"
      aria-hidden="true"
      focusable="false"
    >
      {/* La silueta del godete: círculo con la muesca del pulgar abajo-derecha.
          Trazo abierto y no cerrado, para que se lea como paleta y no como
          moneda —que es el glifo que ya ocupa la ficha de Saldo. */}
      <path
        d="M13 2.2c-6 0-10.8 4.1-10.8 9.4 0 5.2 4.5 9.2 10.2 9.2 1.9 0 3-1 3-2.2 0-1.5-1.4-1.8-1.4-3.1 0-1.2 1-2.1 2.4-2.1h2.3c3.4 0 6.1-2.4 6.1-5.6 0-3.2-4.5-5.6-11.8-5.6z"
        fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"
      />
      {/* Los tres pocillos de pintura: el guiño a que aquí se elige color. */}
      <circle cx="7.6"  cy="9.4"  r="1.5" fill="currentColor" />
      <circle cx="12.4" cy="6.6"  r="1.5" fill="currentColor" />
      <circle cx="17.6" cy="8.4"  r="1.5" fill="currentColor" />
    </svg>
  )
}

export function TapetesPanel({ ancla, activo, comprados, previa, dialogo, onPresionar, onConfirmar, onRevertir }) {
  if (!ancla) return null

  const compra = dialogo ? textoCompra(dialogo) : null

  return (
    <div
      className="tapetes-panel"
      role="dialog"
      aria-label="Tapetes"
      style={{ right: `${ancla.right}px`, top: `${ancla.top}px` }}
      /* Afordancia de arnés, deliberada (molde `data-palo` de U3): el modo
         `tapetes` cruza QUÉ se está pintando contra el atributo del árbol sin
         leer prosa con expresiones regulares. Un cambio de copy jamás debe
         volver roja una puerta de estado. */
      data-activo={activo}
      data-previa={previa ?? ''}
    >
      <p className="tap-titulo">Tapetes</p>

      <div className="tap-grid">
        {TAPETES.map(t => {
          const estado = estadoSwatch(t.id, activo, comprados)
          return (
            <button
              key={t.id}
              type="button"
              className={`tap-swatch is-${estado}`}
              onClick={() => onPresionar(t.id)}
              /* El estado ya lo porta la clase; `aria-current` lo dice para
                 quien no ve el resalte. La entrada activa NO se deshabilita:
                 sigue siendo un control legítimo cuyo efecto es no-op, y un
                 `disabled` la sacaría del recorrido de teclado. */
              aria-current={estado === 'activo' ? 'true' : undefined}
              data-tap={t.id}
              data-estado={estado}
              title={t.descripcion}
            >
              {/* Disco del COLOR REAL del tapete (v1.0 §4: swatches circulares
                  del color real). VIS-1b: `t.swatch` ya no es un color sino el
                  NOMBRE del token que lo guarda (`tapetes.css` §0). Sigue
                  siendo inline porque QUÉ token toca cada disco es dato de
                  catálogo; el color en sí ya no vive en JS. */}
              <span
                className="tap-disco"
                style={{ background: `var(${t.swatch})` }}
                aria-hidden="true"
              />
              <span className="tap-nombre">{t.nombre}</span>
              {/* Tres estados visuales (v1.0 §4): el activo se resalta (molde
                  del chip "Tu último" de NivelSelect), el comprado lleva marca
                  discreta y sin precio, el no comprado enseña su etiqueta. */}
              {estado === 'activo'   && <span className="tap-chip">Puesto</span>}
              {estado === 'comprado' && <span className="tap-marca" aria-label="Comprado">✓</span>}
              {estado === 'no-comprado' && (
                <span className="tap-precio">{montoTexto(t.precio)} fichas</span>
              )}
            </button>
          )
        })}
      </div>

      {/* Diálogo de compra · se pinta ENCIMA de la vista previa ya aplicada: el
          jugador decide viendo la mesa vestida, que es el punto entero del §4. */}
      {compra && (
        <div className="tap-dialogo" role="alertdialog" aria-label="Confirmar compra">
          <p className="tap-dialogo-txt">
            ¿Comprar <strong>{compra.nombre}</strong> por {montoTexto(compra.precio)} fichas?
          </p>
          <div className="tap-dialogo-acciones">
            <button type="button" className="tap-btn tap-btn-si" onClick={onConfirmar}>Sí</button>
            <button type="button" className="tap-btn tap-btn-no" onClick={onRevertir}>No</button>
          </div>
        </div>
      )}
    </div>
  )
}
