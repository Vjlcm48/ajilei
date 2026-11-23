// ── TUT-1 T4 · Los iconos de los diez temas (P-6) ───────────────────────────
// SVG en línea de un trazo, en el color del texto (`currentColor`), 24 de caja, cada
// uno de pocos cientos de bytes. Viajan en el trozo del tutorial. Sin arte nuevo pesado.
const P = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' }

const TRAZOS = {
  // 1 · ¿Qué es AJILEI? — un abanico de cartas con su estrella.
  ajilei: <><rect x="4" y="6" width="9" height="13" rx="1.5" transform="rotate(-10 8.5 12.5)" {...P} /><rect x="11" y="5" width="9" height="13" rx="1.5" {...P} /><path d="m15.5 9 .9 1.8 2 .3-1.4 1.4.3 2-1.8-.9-1.8.9.3-2-1.4-1.4 2-.3z" {...P} strokeWidth="1.2" /></>,
  // 2 · Cuánto vale cada carta — una carta con su valor.
  valor: <><rect x="6" y="3.5" width="12" height="17" rx="2" {...P} /><path d="M9.5 9.5 11 8v8M13.5 9.5 15 8v8" {...P} /></>,
  // 3 · Cómo va una mano — tres cartas en abanico.
  mano: <><path d="M4 9.5 9 5l5 4.5" {...P} /><rect x="5" y="9.5" width="6" height="9" rx="1.2" {...P} /><rect x="13" y="9.5" width="6" height="9" rx="1.2" {...P} /></>,
  // 4 · Cómo se gana y cómo se pierde — la corona.
  gana: <path d="M4 17.5h16M5 15 4 7.5l4.5 3.5L12 5l3.5 6L20 7.5 19 15z" {...P} />,
  // 5 · Apostar, pasar, retirarse — la pila de monedas.
  apuesta: <><ellipse cx="12" cy="7" rx="6.5" ry="2.5" {...P} /><path d="M5.5 7v4c0 1.4 2.9 2.5 6.5 2.5s6.5-1.1 6.5-2.5V7M5.5 11v4c0 1.4 2.9 2.5 6.5 2.5s6.5-1.1 6.5-2.5v-4" {...P} /></>,
  // 6 · All-in y pozos — dos pozos.
  pozo: <><ellipse cx="8" cy="15" rx="4.5" ry="2" {...P} /><ellipse cx="16" cy="15" rx="4.5" ry="2" {...P} /><path d="M8 13V7m-3 3 3-3 3 3M16 13V9" {...P} /></>,
  // 7 · Jugar contra las IAS — la cabeza de la IA.
  ias: <><rect x="5" y="7" width="14" height="11" rx="3" {...P} /><path d="M12 4v3M9.5 12h.01M14.5 12h.01M9.5 15h5" {...P} /></>,
  // 8 · Jugar con otras personas — dos siluetas.
  personas: <><circle cx="9" cy="9" r="3" {...P} /><circle cx="16.5" cy="10" r="2.5" {...P} /><path d="M3.5 19c.6-3 2.8-4.5 5.5-4.5s4.9 1.5 5.5 4.5M15 14.7c2.4-.3 4.6.9 5.5 3.8" {...P} /></>,
  // 9 · El menú y los ajustes — el engranaje.
  ajustes: <><circle cx="12" cy="12" r="3" {...P} /><path d="M12 3.5v3M12 17.5v3M3.5 12h3M17.5 12h3M6 6l2.1 2.1M15.9 15.9 18 18M6 18l2.1-2.1M15.9 8.1 18 6" {...P} /></>,
  // 10 · Consejos — la bombilla.
  consejos: <><path d="M9 17.5h6M10 20.5h4M8.5 14.5a5.5 5.5 0 1 1 7 0c-.8.7-1 1.6-1 3h-5c0-1.4-.2-2.3-1-3z" {...P} /></>,
}

/** El icono de un tema (`icono` de `capitulos.js`). Sin icono, el número en un círculo. */
export default function IconoTema({ icono, n }) {
  const trazo = TRAZOS[icono]
  return (
    <svg className="tem-ico" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      {trazo ?? <><circle cx="12" cy="12" r="9" {...P} /><text x="12" y="16" textAnchor="middle" fontSize="11" fill="currentColor">{n}</text></>}
    </svg>
  )
}
