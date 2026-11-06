// ── MES-PvP 3 · Los textos de la partida entre personas ───────────────────────
// Viajan con su trozo (`trozos.partidaPvP`, INV-84), no en la entrada: `lib/vistaAMesa` los
// suma al diccionario al cargarse (`textos.sumarTextos`). Mismas reglas que `textos.es.js`:
// prefijo `pvp.`, claves en minúscula, ninguna vacía y ningún texto repetido con el otro
// diccionario (`textos.test.js`).
export const TEXTOS_PVP_ES = {
  // ── MES-PvP 2 · El rótulo de cada asiento (`lib/vistaAMesa.estadoDeAsiento`) ──
  'pvp.asiento.abandono':   'Abandonó',
  'pvp.asiento.anuncio':    'En anuncio',
  'pvp.asiento.retirado':   'Se retiró',
  'pvp.asiento.ausente':    'Ausente',
  'pvp.asiento.turno':      'Su turno',
  'pvp.asiento.paso':       'Pasó',
  'pvp.asiento.aposto':     'Apostó',
  'pvp.asiento.igualo':     'Igualó',
  'pvp.asiento.subio':      'Subió',
  'pvp.asiento.descarto':   'Descartó {n}',

  // ── MES-PvP 3 · La mesa contra personas (`GameTable` con `partida`) y sus capas ──
  'pvp.mesa.pensando':      '{nombre} está pensando…',
  'pvp.mesa.retirado':      'Te retiraste — la mesa sigue jugando…',
  'pvp.mesa.descartan':     'La mesa descarta…',
  'pvp.mesa.espera':        'Esperando a la mesa…',
  'pvp.salir.titulo':       '¿Dejar la mesa?',
  'pvp.salir.texto':        'Si sales, tu asiento queda abandonado y cobras tu pila al cerrar la mano.',
  'pvp.salir.si':           'Dejar la mesa',
  'pvp.arrancando':         'Arrancando la partida…',
  // El sorteo: textos sellados por Victor (2026-11-06). `{nombre}` de `elige` es el de quien
  // mira; `{lista}` lleva a todos los empatados, el propio incluido («Juan, Ana y María»).
  'pvp.sorteo.elige':       '{nombre}, vamos a elegir el jugador Mano. Elige una carta.',
  'pvp.sorteo.mano':        '{nombre} es Mano por tener la carta más alta',
  'pvp.sorteo.mano.tu':     'Eres Mano por tener la carta más alta',
  'pvp.sorteo.empate':      'Hay empate entre {lista}: vamos al desempate',
  'pvp.sorteo.azar':        'Siguen empatados: el azar elige a {nombre} como Mano',
  'pvp.sorteo.azar.tu':     'Siguen empatados: el azar te elige como Mano',
  'pvp.anuncio.titulo':     'Anuncio',
  'pvp.anuncio.volver':     'Volver a la mesa',
  'pvp.muerta':             'La mesa se cerró por inactividad. Tu pila volvió a tu saldo',

  // ── MES-PvP 3-A · El abandono y la pantalla final (Reglas v1.7 §8.2 y §8.3) ──
  // Sellados por Victor: el aviso del óvalo en singular y las cuatro frases del fin. Las dos
  // formas plurales (varios abandonos en la misma jugada) no están selladas.
  'pvp.abandono.aviso':          '{nombre} abandonó la mesa.',
  'pvp.abandono.termina':        '{nombre} abandonó la mesa. La partida termina.',
  'pvp.abandono.aviso.varios':   '{lista} abandonaron la mesa.',
  'pvp.abandono.termina.varios': '{lista} abandonaron la mesa. La partida termina.',
  'pvp.fin.saliste':             'Saliste de la mesa',
  'pvp.fin.sinfichas':           'Te quedaste sin fichas',
  'pvp.fin.solo.uno':            'Te quedaste solo: {nombre} abandonó la mesa',
  'pvp.fin.solo':                'Te quedaste solo en la mesa',
  'pvp.fin.resultado':           '{cifra} Heptacoins',
}
