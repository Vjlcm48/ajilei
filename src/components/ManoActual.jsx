// ── DSK-U3 · Popup del valor de "Mano actual" ────────────────────────────────
// Documento rector: docs/AJILEI_Menu_Utilidades_v1.3.md §3.
// Superficie PROPIA y hermana del área, por la misma razón que el selector de
// reacciones: la entrada CIERRA AL EJECUTAR, así que el panel ya no existe
// cuando esto se pinta. Se ancla al ⋮ (no al panel muerto) por su borde
// DERECHO, molde del popup del contador.
//
// Overlay puro: `fixed`, fuera de flujo, Δ=0 de layout por construcción.
//
// FRONTERA CON LA BANDA GRATUITA (v1.1 §3.2, intacta): la banda "Tu mejor palo"
// sólo se pinta en fase de pago y es retrospectiva. Esto entrega el DESGLOSE
// COMPLETO de todos los palos mientras la decisión de descarte o apuesta sigue
// viva — que es exactamente la diferencia que se consume. Ni duplica ni
// contradice: no coexisten, porque la entrada queda inerte en fase de pago.

export function ManoActualPopup({ popup, saldo }) {
  if (!popup) return null

  // MOV-1b-a · `top` llega como longitud CSS (la pinza de D6 con el área
  // segura dentro); `right` sigue siendo número.
  const estilo = { right: `${popup.anchor.right}px`, top: popup.anchor.top }

  if (popup.tipo === 'agotadas') {
    return (
      <div className="u3-popup u3-popup-agotadas" role="status" style={estilo}>
        <p className="u3-titulo">Se acabaron tus consultas gratis</p>
        <p className="u3-resto">Pronto podrás pagarlas con Heptacoins.</p>
      </div>
    )
  }

  const d = popup.desglose
  if (!d) {
    return (
      <div className="u3-popup" role="status" style={estilo}>
        <p className="u3-titulo">Aún no tienes cartas que contar</p>
      </div>
    )
  }

  return (
    <div
      className="u3-popup"
      role="status"
      style={estilo}
      /* Afordancia de arnés, deliberada. El modo u3 verifica el valor CRUZANDO
         contra un recálculo independiente (cartas leídas del DOM + la misma
         fuente única corrida en Node), no leyendo prosa con expresiones
         regulares: un cambio de copy jamás debe volver roja una puerta de
         valor, ni una puerta de valor debe poder pasar por accidente porque el
         copy contenga un número. */
      data-palo={d.palo}
      data-pts={d.pts}
      data-bonif={d.bonifComodin}
      data-resto={d.resto.map(r => `${r.palo}:${r.pts}`).join(',')}
    >
      {/* Valor RELATIVO según las reglas vivas de la mano, jamás el nominal
          impreso en la carta (v1.1 §3.1). Sale entero de getBestSuitScore. */}
      <p className="u3-titulo">
        Tu mejor palo es <strong>{d.palo}</strong>, {d.pts} pts
      </p>
      {d.resto.length > 0 && (
        <p className="u3-resto">
          Además: {d.resto.map(r => `${r.palo} ${r.pts}`).join(' · ')}
        </p>
      )}
      {/* El comodín no se cuenta como carta de su palo pero suma al mejor: se
          dice, para que la cifra no parezca un error de suma. La bonificación
          se DERIVA de la salida de la fuente única — no se vuelve a decidir si
          el comodín aplica (v1.1 §3.3). */}
      {d.bonifComodin > 0 && (
        <p className="u3-nota">Incluye el comodín (+{d.bonifComodin})</p>
      )}
      <p className="u3-saldo">
        {saldo === 1 ? 'Te queda 1 consulta gratis' : `Te quedan ${saldo} consultas gratis`}
      </p>
    </div>
  )
}
