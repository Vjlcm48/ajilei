// ── LOB-1 · Los siete iconos del lobby ──────────────────────────────────────
// Documento rector: AJILEI_LOB1_Fase1_v1.1.md §3.1.
//
// SIETE, no cinco. La ficha escribe «cinco iconos» y a continuación enumera
// siete (`IconoUsuario`, `IconoMas`, `IconoCandado`, `IconoAjustes`,
// `IconoTrofeo`, `IconoTienda`, `IconoLibro`); la lámina v1.3 monta siete
// `<symbol>` y el lobby usa los siete. Manda la enumeración, que es la que
// cuadra con el dibujo sellado.
//
// GEOMETRÍA de los `<symbol>` de la lámina v1.3 (trazados Lucide, licencia ISC),
// verbatim. La casa no tiene —ni estrena aquí— dependencia de iconos: el
// `package.json` no declara ninguna (Fase 0 §4.1) y la costumbre desde U1b es
// que todo icono nuevo sea SVG en línea de la casa (`UtilitiesMenu.jsx:49-55`).
//
// ── EL CONTRATO DE DIBUJO ES EL DE `util-ico`; LA CLASE, NO ─────────────────
// Se hereda entero lo que hace que un icono de AJILEI se vea como tal —caja
// `0 0 24 24`, `fill="none"`, trazo en `currentColor` a 1.75, remates y uniones
// redondos, `aria-hidden` + `focusable="false"`— y se hereda como ATRIBUTOS, que
// es como lo declaran `CardQueryIcon`, `CuentaIcon` y `GodeteIcon`.
//
// Lo que NO se hereda es el nombre de clase `util-ico`, y está MEDIDO por qué:
// esa clase tiene reglas vivas fuera del panel de utilidades —`gameTable.css`
// (protegido) l. 5896-5902 y `menuMovil.css` l. 218-224— que imponen
// `display:flex`, `align-items`, `justify-content`, `line-height:1` y un
// `font-size: var(--dsk-u1-ico-w)` que en el lobby no resuelve a nada. Son
// selectores de clase pelada dentro de sus media queries, así que alcanzarían a
// cualquier `.util-ico` del documento, lobby incluido. Usarla sería importar
// geometría de la mesa a una pantalla que no es la mesa, y para desactivarla
// haría falta o pisar con especificidad o abrir un protegido. La clase propia
// —`lob-ico lob-ico-<nombre>`— cuesta una palabra y cierra el problema.
//
// `strokeWidth` va a 1.75 como el resto de la casa. La lámina lo dejaba en CSS
// (`.ico { stroke-width: 1.75 }`); aquí sube a atributo para que el icono se
// dibuje igual aunque alguien lo monte fuera de `lobby.css`.

// Props comunes. Un solo objeto para que los siete no puedan divergir por
// descuido: si mañana el trazo de la casa pasa a 1.6, se cambia aquí una vez.
const COMUN = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: '1.75',
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': 'true',
  focusable: 'false',
}

const clase = (nombre, extra) => `lob-ico lob-ico-${nombre}${extra ? ` ${extra}` : ''}`

// Silueta de jugador. Es el mismo gesto que `CuentaIcon` (SUP-2b) resuelto con
// la geometría de la lámina: círculo de cabeza y hombros abiertos, nunca un
// óvalo cerrado —cerrado se lee como ficha, que es el glifo de Saldo—.
export function IconoUsuario({ className }) {
  return (
    <svg {...COMUN} className={clase('usuario', className)}>
      <circle cx="12" cy="8" r="5" />
      <path d="M20 21a8 8 0 0 0-16 0" />
    </svg>
  )
}

// El «+» de la píldora de saldo: atajo a la Tienda desde donde se ve el número.
export function IconoMas({ className }) {
  return (
    <svg {...COMUN} className={clase('mas', className)}>
      <path d="M5 12h14M12 5v14" />
    </svg>
  )
}

// Candado del acceso a jugador contra jugador. Dice «existe pero todavía no»,
// que es distinto de un botón apagado sin explicación.
export function IconoCandado({ className }) {
  return (
    <svg {...COMUN} className={clase('candado', className)}>
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  )
}

// Engranaje de la hoja de configuración. Releva al `⋮` de la mesa: son dos
// superficies distintas —aquélla es el panel de utilidades de la partida, ésta
// la configuración de la cuenta— y compartir glifo las confundiría.
export function IconoAjustes({ className }) {
  return (
    <svg {...COMUN} className={clase('ajustes', className)}>
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

// Copa de Rankings, primera de la barra inferior.
export function IconoTrofeo({ className }) {
  return (
    <svg {...COMUN} className={clase('trofeo', className)}>
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6M18 9h1.5a2.5 2.5 0 0 0 0-5H18M4 22h16M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22M18 2H6v7a6 6 0 0 0 12 0V2Z" />
    </svg>
  )
}

// Toldo de Tienda, al centro de la barra. Es el ÚNICO oro sólido de la barra
// inferior; el color lo pone `lobby.css`, no este archivo — aquí todo es
// `currentColor` para que el icono no decida su propio acento.
export function IconoTienda({ className }) {
  return (
    <svg {...COMUN} className={clase('tienda', className)}>
      <path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4M2 7h20M22 7v3a2 2 0 0 1-2 2a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 16 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 12 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 8 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 4 12a2 2 0 0 1-2-2V7" />
    </svg>
  )
}

// Libro abierto de «Cómo se juega», tercera de la barra.
export function IconoLibro({ className }) {
  return (
    <svg {...COMUN} className={clase('libro', className)}>
      <path d="M12 7v14M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z" />
    </svg>
  )
}
