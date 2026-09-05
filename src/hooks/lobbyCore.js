// ── LOB-1 · Semánticas puras del lobby ──────────────────────────────────────
// Sin React, sin DOM, sin localStorage: sólo las reglas —qué se enseña de un
// correo y qué no—. Molde de `nivelCore.js`, `tapetesCore.js` y `consultasCore.js`.
//
// ── POR QUÉ ESTE ARCHIVO EXISTE Y NO ES UNA FUNCIÓN DENTRO DE `Lobby.jsx` ────
// Porque un `.jsx` que exporta un componente Y una función rompe la recarga en
// caliente: `react-refresh/only-export-components`. Es la misma regla que
// `useAuth.js` cita para no ser `.jsx` y la que ya muerde en `SoundContext.jsx`.
// Dejarla sin exportar habría evitado el aviso a costa de una función que toca
// datos personales y no se puede probar; esto la deja probada y fuera del
// camino de la herramienta.

// ── El correo, enmascarado ──────────────────────────────────────────────────
// `carlos@gmail.com` → `c•••@gmail.com`.
//
// LO QUE SE CONSERVA Y LO QUE NO no es capricho. Se enseña la PRIMERA letra y el
// dominio ENTERO, porque la pregunta que la hoja ⚙ responde es «¿con cuál de mis
// cuentas entré?», y esa la contesta el dominio casi siempre. Se tapa el resto
// del nombre local, que es la parte que identifica a la persona ante quien mire
// la pantalla por encima del hombro.
//
// TRES PUNTOS FIJOS, NO UNO POR CARÁCTER. Un relleno proporcional filtraría la
// longitud del correo —dato que no hace falta para nada— y además haría que la
// caja de la hoja midiese distinto según el jugador, que es justo lo que O1 no
// quiere. Tres siempre.
//
// Cualquier entrada que no sea un correo con nombre local no vacío devuelve
// cadena vacía, y el consumidor la trata como ausencia reservando su caja. El
// caso real es el bypass de desarrollo, donde no hay sesión y por tanto no hay
// correo: inventar un `•••@•••` ahí sería enseñar una máscara de una cuenta que
// no existe.
export function enmascararCorreo(correo) {
  if (typeof correo !== 'string') return ''
  const at = correo.indexOf('@')
  // `at < 1` cubre las dos ausencias de golpe: sin arroba (-1) y con el correo
  // empezando por arroba (0), que no tiene nombre local que tapar.
  if (at < 1) return ''
  // Y un dominio vacío ("carlos@") tampoco es un correo que se pueda enseñar.
  if (at === correo.length - 1) return ''
  return `${correo[0]}•••${correo.slice(at)}`
}
