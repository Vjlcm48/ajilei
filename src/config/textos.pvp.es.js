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
  'pvp.fin.solo':                'Te quedaste solo en la mesa',
  'pvp.fin.resultado':           '{cifra} Heptacoins',

  // ── L-M 2 · El aviso de ausencia (texto de Victor; se sella en las Reglas de APU-1 v1.9) ──
  'pvp.ausente.aviso':           '1 turno más y saldrás de la mesa',

  // ── L-M 3 · Entre una mano y otra (sellados por Victor en la lámina; van a las Reglas de APU-1 v1.9) ──
  'pvp.recarga.tarjeta':         'Recargar {monto} HC para volver a {entrada} HC. Te quedarán {saldo} HC.',
  // Victor (STOP-L): con la pila en 0, la tarjeta dice «para seguir en la mesa».
  'pvp.recarga.tarjeta.cero':    'Recargar {monto} HC para seguir en la mesa. Te quedarán {saldo} HC.',
  // La voluntaria pedida durante la mano (se aplica en la pausa siguiente): el ⋮ la muestra y la anula.
  'pvp.recarga.anular':          'Anular la recarga pedida',
  'pvp.recarga.no':              'Ahora no',
  'pvp.recarga.sinsaldo':        'Tu saldo no alcanza para recargar.',
  'pvp.asiento.recarga':         'Recargando',
  'pvp.asiento.fuera':           'Fuera de esta mano',
  // La mesa de 2 mientras el rival decide: en la caja de las acciones (propuesta de la lámina).
  'pvp.recarga.espera':          'Esperando a {nombre}…',
  'pvp.anuncio.publicidad':      'Publicidad',
  'pvp.anuncio.frase':           'La publicidad ayuda a mantener el juego, gracias por tu comprensión',
  'pvp.anuncio.quitar':          'Quitar publicidad',
  'pvp.anuncio.premium':         'Premium · Pronto',
  'pvp.anuncio.uno':             '{nombre} sigue en el anuncio',
  'pvp.anuncio.varios':          '{n} jugadores siguen en el anuncio',
}
