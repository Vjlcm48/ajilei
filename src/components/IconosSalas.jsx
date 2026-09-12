// ── SAL-B1 · Los cinco iconos que las salas añaden ──────────────────────────
// Rector: AJILEI_SAL-B1_Fase1_v1.0.md. Geometría VERBATIM de los `<symbol>` de
// las láminas SAL-1 v1.2 y SAL-2 v1.2 (trazados Lucide, licencia ISC).
//
// ── POR QUÉ UN ARCHIVO NUEVO Y NO CUATRO LÍNEAS EN `IconosLobby.jsx` ────────
// Porque aquel archivo se llama a sí mismo «los siete iconos del lobby» y su
// cabecera explica, con la enumeración de la ficha de LOB-1 delante, POR QUÉ son
// siete y no cinco. Meterle cuatro más lo convertiría en un cajón cuyo nombre
// miente, y la primera víctima sería quien busque los del lobby dentro de once.
// Los del lobby siguen donde estaban y no se toca una línea suya.
//
// ── EL CONTRATO DE DIBUJO ES EL MISMO ──────────────────────────────────────
// Caja `0 0 24 24`, `fill="none"`, trazo en `currentColor` a 1.75, remates y
// uniones redondos, `aria-hidden` + `focusable="false"`. Se copia el objeto
// `COMUN` en vez de importarlo, y ES DELIBERADO: importarlo ataría cualquier
// cambio de los iconos de salas a un archivo que esta tanda decidió no tocar, y
// crearía una dependencia de `screens/` hacia el lobby que hoy no existe. Si un
// día el trazo de la casa pasa a 1.6, se cambian los dos objetos —y el test de
// la casa, si llega a haberlo, es quien lo recuerda—.
//
// La clase sigue siendo `lob-ico`, no `util-ico` ni `sal-ico`:
//   · `util-ico` tiene reglas vivas en `gameTable.css` (protegido) y
//     `menuMovil.css` que imponen `display:flex` y un `font-size` de la mesa a
//     cualquier `.util-ico` del documento — usarla importaría geometría de la
//     mesa a una pantalla que no lo es;
//   · `lob-ico` es la clase que `salas.css` ya dimensiona con `--ico`, y que el
//     componente de barra compartida trae puesta. Un tercer nombre obligaría a
//     duplicar en la hoja todas las reglas de tamaño por el gusto del prefijo.

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

// Chevron a la izquierda: «vuelve un paso». Distinto de la casa a propósito —
// aquélla salta al lobby de un tirón y ésta deshace UN paso—, y las dos conviven
// en la misma pantalla porque significan cosas distintas.
export function IconoVolver({ className }) {
  return (
    <svg {...COMUN} className={clase('volver', className)}>
      <path d="m15 18-6-6 6-6" />
    </svg>
  )
}

// La casa: vía rápida al lobby desde cualquier pantalla previa a la mesa.
export function IconoCasa({ className }) {
  return (
    <svg {...COMUN} className={clase('casa', className)}>
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 9.5V21h5v-6h4v6h5V9.5" />
    </svg>
  )
}

// El globo de «Abierta»: visible para todos. Hace pareja con el candado de
// «Privada», que es el `IconoCandado` del lobby — el mismo glifo que hasta esta
// tanda decía «PvP todavía no» pasa a decir «esta mesa lleva código», que es la
// misma idea de cerradura aplicada a la mesa en vez de al modo.
export function IconoGlobo({ className }) {
  return (
    <svg {...COMUN} className={clase('globo', className)}>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
    </svg>
  )
}

// Copiar el código de la sala. Dos hojas superpuestas: el gesto universal, y el
// que un jugador reconoce sin leer nada.
export function IconoCopiar({ className }) {
  return (
    <svg {...COMUN} className={clase('copiar', className)}>
      <rect x="9" y="9" width="12" height="12" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  )
}

// El check de «copiado». Vive dos segundos y vuelve al de copiar: es acuse de
// recibo, no un estado. Sin él, tocar el botón no produce ninguna señal y el
// jugador toca tres veces por si acaso.
export function IconoCheck({ className }) {
  return (
    <svg {...COMUN} className={clase('check', className)}>
      <path d="M20 6 9 17l-5-5" />
    </svg>
  )
}
