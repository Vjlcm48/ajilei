// ── PUE-2.2 · Los textos de la puerta ───────────────────────────────────────
// Viven en su propio módulo y no junto al componente por una razón de
// herramienta, no de gusto: `react-refresh/only-export-components` avisa —con
// razón— de que un archivo que exporta un componente Y constantes rompe la
// recarga en caliente. Un archivo de datos no tiene ese problema.
//
// Son cadenas y no JSX: ninguno de los dos lemas lleva marcado, sólo el guion
// largo de la casa. Lo que cambia entre pantallas es el TIEMPO VERBAL, y está
// sellado así — la portada promete («te enviaremos») porque el jugador aún no ha
// escrito nada; la Entrada informa («te enviamos»).

export const LEMA_ENTRADA =
  'Entra con tu correo. Te enviamos un código de 6 dígitos — no hace falta contraseña.'

// El lema sellado de la portada (lámina v1.7 · §2.2 de la ficha).
export const LEMA_PORTADA =
  'Entra con tu correo. Te enviaremos un código de 6 dígitos — fácil, sin contraseñas.'
