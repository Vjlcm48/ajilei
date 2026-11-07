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

  // ── L-M 2 · El aviso de ausencia (texto de Victor; se sella en las Reglas de APU-1 v1.9) ──
  'pvp.ausente.aviso':           '1 turno más y saldrás de la mesa',
}
