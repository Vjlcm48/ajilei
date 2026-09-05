// ── IDI-0 · Diccionario ESPAÑOL · FUENTE ÚNICA de textos del lobby ───────────
// Documento rector: AJILEI_LOB1_Fase1_v1.1.md §2.1. Los valores son los de la
// lámina `AJILEI_LOB1_lamina_v1.3.html`, VERBATIM: la lámina es la autoridad
// visual sellada por Victor y el copy forma parte de lo que selló.
//
// LOS DEMÁS IDIOMAS SON MÓDULOS HERMANOS CON LAS MISMAS CLAVES. `textos.en.js`,
// `textos.pt.js`, `textos.fr.js` y `textos.it.js` nacerán en IDI-1 como copias
// de este archivo con los valores traducidos y NI UNA clave de más ni de menos.
// El test (`textos.test.js`) existe para que esa promesa sea verificable el día
// que haya un segundo diccionario, no sólo el día que se escriba.
//
// Módulo SIN React ni DOM, molde de `config/niveles.js` y `config/tapetes.js`:
// así lo importan igual la app, Vitest y —el día que haga falta— el arnés desde
// `node`, en vez de mantener una copia paralela de los rótulos. La lección es de
// ARN-1 y de `menuEntradas.js`: un arnés colgado de un texto se rompe con el
// próximo ajuste de copy.
//
// ── LAS CLAVES SON EL CONTRATO; LOS VALORES SON COPY ────────────────────────
// Misma doctrina que los `id` de `niveles.js` y `tapetes.js`: la clave no se
// renombra nunca, el valor lo ajusta Victor cuando quiera. Por eso el arnés se
// cuelga de `data-accion`, jamás del rótulo visible.
//
// ALCANCE: sólo el lobby. Esta fase NO externaliza el texto de ninguna otra
// pantalla — ni la mesa, ni la Portada, ni el Bautizo. Meterlas aquí sería
// convertir una plomería de 18 claves en una migración de toda la app.
export const TEXTOS_ES = {
  // Los dos accesos al juego
  'lob.cta.ia':          'Jugar contra la IA',
  'lob.cta.pvp':         'Jugar contra jugador',
  'lob.cta.pronto':      'Próximamente',

  // Barra inferior
  'lob.nav.rankings':    'Rankings',
  'lob.nav.tienda':      'Tienda',
  'lob.nav.reglas':      'Cómo se juega',

  // El aviso de lo que todavía no existe
  'lob.toast.pronto':    'Pronto',

  // Hoja de configuración (⚙)
  'lob.cfg.titulo':      'Configuración',
  'lob.cfg.sonido':      'Sonido',
  'lob.cfg.idioma':      'Idioma',
  'lob.cfg.sugerencias': 'Enviar sugerencia',
  'lob.cfg.salir':       'Cerrar sesión',
  'lob.cfg.acerca':      'Acerca de',
  'lob.cfg.eliminar':    'Eliminar cuenta',
  'lob.acerca.sonidos':  'Sonidos y música:',

  // Nombres accesibles. Van en el diccionario y no en el JSX por la misma razón
  // que los visibles: un `aria-label` es texto que un lector de pantalla LEE en
  // voz alta, así que traducirlo no es opcional. Los tres valores salen de los
  // atributos de la lámina v1.3, verbatim.
  'lob.perfil.aria':     'Perfil',
  'lob.saldo.aria':      'Saldo de Heptacoins',
  'lob.ajustes.aria':    'Configuración',
}

export default TEXTOS_ES
