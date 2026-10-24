// ── cronicaCore.js · La CRÓNICA del óvalo, compuesta en presentación ────────
// Módulo hermano de `resultadoCore.js` y con su mismo patrón: el motor es la
// referencia de QUÉ se dice, pero el texto que se pinta se compone aquí.
//
// POR QUÉ EXISTE (REN-2). `resultadoCore` se llevó el RESULTADO (showdown,
// retiros, fin de partida) y dejó dicho que nadie debía pintar `game.message`.
// Quedaba media promesa: fuera del resultado, el óvalo seguía pintando el
// mensaje del motor crudo. Eso ató una cadena VISIBLE —"Apuestas N fichas."—
// dentro de `gameEngine.js`, que es archivo protegido, y REN-1 no la pudo
// renombrar. Este módulo cierra la promesa: compone también la crónica, y con
// ella la palabra de la moneda pasa a vivir en presentación, donde se cambia
// sin abrir el motor.
//
// LA REGLA, en una línea: **si la fase cambió manda la fase; si no cambió y
// alguien actuó, manda la acción.** No es un criterio estético — es lo que hace
// el motor. `applyBetAction` escribe el mensaje de la acción y acto seguido, si
// la ronda terminó, llama a `advanceBettingPhase`, que lo PISA con el de la
// fase nueva. Reproducir ese orden es lo que hace que la crónica salga
// byte-idéntica sin copiar una tabla de casos.
//
// LO QUE NO SE HACE AQUÍ: leer `game.message`. Ni para decidir, ni para
// clasificar, ni "sólo para el caso raro". El día que se lea, el motor vuelve a
// ser la voz y esto es un adorno. Todo sale del ESTADO y de la TRANSICIÓN.
import { PHASES } from '../engine/gameEngine'

// La marca. Vive aquí y no en el motor: ése es el punto entero de REN-2.
export const MONEDA = 'Heptacoins'
// El singular, por regla (VOZ-3 D5): los montos son múltiplos de la apuesta de
// mesa y hoy nunca llega a volver una sola, pero la frase no depende de eso.
export const MONEDA_UNA = 'Heptacoin'

// ── Verbo de la acción, deducido de la transición ───────────────────────────
// Mismo método que `inferAction` en GameTable (que rotula el panel del rival):
// el motor es de sólo lectura, así que la acción se lee de lo que CAMBIÓ, no de
// un campo que el estado no guarda. Las tres guardas de retiro forzado del
// motor (call impagable, apertura impagable, subida impagable) ya convirtieron
// la acción en 'retirarse' ANTES de escribir su mensaje, así que mirar `folded`
// las cubre las tres sin repetir aritmética.
//
// SEIS VERBOS, NO CINCO (L-7, decisión 6 del rector al cerrar 1c-2). El motor
// escribe una línea propia para el all-in —«Vas all-in con N fichas.»— desde
// APU-1 §4.1, y esta crónica no la sabía decir: un all-in defensivo salía
// rotulado como «sube» o «iguala», que es exactamente lo contrario de lo que
// pasó. Lo consignó D-20 del informe 1c-2 y vivía en silencio porque las
// pilas del banco eran iguales y hondísimas; con `--entrada` y con la mesa que
// Victor juega, el all-in defensivo es corriente.
//
// CÓMO SE RECONOCE, sin leer `game.message` ni un campo de acción que el
// estado no guarda: el all-in de §4.1 es el único camino que deja al asiento
// con la pila en CERO y la contribución POR DEBAJO de la apuesta viva. Es
// exacto, no heurístico —`pozos.esLegal` sólo lo permite cuando la pila no
// cubre lo que falta, así que por construcción queda corto— y distingue el
// all-in del `igualar` que gasta hasta la última ficha, que llega a
// `contrib === currentBet` clavado.
function verboDe(prev, next, seat) {
  const p = prev.players[seat]
  const n = next.players[seat]
  if (!p.folded && n.folded) return 'retirarse'
  const puesto = p.chips - n.chips
  if (puesto > 0) {
    if (prev.currentBet === 0) return 'apostar'
    if (n.chips === 0 && n.contrib < prev.currentBet) return 'allIn'
    return puesto > prev.currentBet - p.contrib ? 'subir' : 'igualar'
  }
  // Sin dinero puesto no hay forma de distinguir "pasar" de un "igualar" con
  // nada que igualar. El motor los escribe distinto ("Pasas." vs "Igualas a
  // 0."), así que el desempate lo da `contrib`: igualar lo LLEVA a currentBet
  // aunque no cueste nada; pasar no lo toca.
  if (prev.currentBet > 0 && n.contrib === prev.currentBet && p.contrib !== prev.currentBet) return 'igualar'
  return 'pasar'
}

// ¿Actuó alguien en esta transición? El asiento que actuó es el que estaba
// activo en `prev` (el motor mueve `activePlayerIndex` DESPUÉS de resolver).
function actuo(prev, next) {
  const seat = prev.activePlayerIndex
  const p = prev.players[seat], n = next.players[seat]
  if (!p || !n) return null
  return (p.chips !== n.chips || p.folded !== n.folded || p.acted !== n.acted) ? seat : null
}

// ── La línea de una acción ──────────────────────────────────────────────────
// Las cadenas de N=2 y de N>2 son las del motor al pie de la letra; lo único
// que cambia es la palabra de la moneda. Los montos NO se recalculan: salen de
// la transición (`prev.currentBet` para igualar, `next.currentBet` para apostar
// y subir, que es exactamente de donde los saca el motor).
export function componeAccion(prev, next, seat) {
  const jugador = prev.players[seat]
  if (!jugador) return null
  const verbo   = verboDe(prev, next, seat)
  const apuesta = prev.currentBet
  const nueva   = next.currentBet
  // Lo que el all-in cuesta es la pila entera de antes, que es lo que el motor
  // llama `costo` en esa rama. Sale de la transición, como todos los demás
  // montos de este módulo: no se recalcula nada.
  const costo   = jugador.chips - next.players[seat].chips

  if (prev.numPlayers === 2) {
    const h = jugador.isHuman
    switch (verbo) {
      case 'pasar':     return h ? 'Pasas.'                          : 'La IA pasa.'
      case 'apostar':   return h ? `Apuestas ${nueva} ${MONEDA}.`    : `La IA apuesta ${nueva}. ¿Qué haces?`
      case 'igualar':   return h ? `Igualas a ${apuesta}.`           : `La IA iguala a ${apuesta}.`
      case 'subir':     return h ? `Subes a ${nueva}.`               : `La IA sube a ${nueva}. ¿Qué haces?`
      case 'allIn':     return h ? `Vas all-in con ${costo} ${MONEDA}.` : `La IA va all-in con ${costo}.`
      case 'retirarse': return h ? 'Te retiras. La IA gana el pozo.' : '¡La IA se retira! Ganaste el pozo.'
    }
  }
  const n = jugador.name
  switch (verbo) {
    case 'pasar':     return `${n} pasa.`
    case 'apostar':   return `${n} apuesta ${nueva}.`
    case 'igualar':   return `${n} iguala a ${apuesta}.`
    case 'subir':     return `${n} sube a ${nueva}.`
    case 'allIn':     return `${n} va all-in con ${costo}.`
    case 'retirarse': return `${n} se retira.`
  }
  return null
}

// ── Cuántas cartas cambió cada asiento ──────────────────────────────────────
// El motor cuenta el descarte con una variable local que no sobrevive al
// estado, así que la cuenta se recupera diffeando las manos. Funciona por
// IDENTIDAD y no por valor porque el motor conserva la referencia de la carta
// que no se cambia (`indices.includes(i) ? deckCopy.shift() : card`), que es
// justo lo que distingue "no la tocó" de "le tocó una igual".
function conteosDescarte(prev, next) {
  const conteos = {}
  prev.players.forEach((p, seat) => {
    if (p.folded) return
    const nuevas = next.players[seat].cards
    conteos[seat] = p.cards.reduce((acc, carta, i) => acc + (carta === nuevas[i] ? 0 : 1), 0)
  })
  return conteos
}

// ── La línea de una fase ────────────────────────────────────────────────────
// `prev` sólo hace falta para la entrada a BET_3 (el resumen del descarte
// necesita la mano de antes). El resto sale del estado nuevo y ya.
export function componeFase(estado, prev = null) {
  const { phase, numPlayers, manoIndex, players } = estado
  const manoEsHumano = manoIndex === 0
  const abre = (cuantas) => numPlayers === 2
    ? `A las ${cuantas} — ${manoEsHumano ? 'Tu turno.' : 'IA pensando...'}`
    : `A las ${cuantas} — ${players[manoIndex].name} abre.`

  switch (phase) {
    case PHASES.WAITING: return '¡Bienvenido a Ajilei!'
    case PHASES.DEAL_2:
    case PHASES.DEAL_3:  return 'Repartiendo...'
    case PHASES.BET_1:   return abre(2)
    case PHASES.BET_2:   return abre(3)
    case PHASES.DISCARD: return `Selecciona hasta ${estado.handRules.maxDiscard} cartas a descartar.`
    case PHASES.BET_3: {
      if (numPlayers !== 2) return 'Descarte completado. Al descarte.'
      const c = prev ? conteosDescarte(prev, estado) : {}
      const pista = manoEsHumano ? 'Tu turno.' : 'IA pensando...'
      return `Descartaste ${c[0] ?? 0}, la IA descartó ${c[1] ?? 0}. Al descarte — ${pista}`
    }
    // PAYOUT y GAME_OVER son del compositor de RESULTADO. Si se llega aquí es
    // porque el resultado devolvió null —el óvalo en blanco entre manos, que
    // GameTable produce anulando `winner`— y en blanco tiene que quedarse.
    default: return ''
  }
}

// ── APU-1 §4.2 · CUANDO EL POZO SE PARTE, SE DICE ───────────────────
//
// Un all-in que no cubre la apuesta viva parte el pozo en capas: cada una tiene
// sus elegibles y su ganador, y pueden ser personas distintas. Sin esta línea
// el óvalo diría «¡Ganas con Copas, 41 pts!» mientras las fichas se reparten
// entre dos asientos —y el jugador vería su saldo subir menos de lo que el
// mensaje promete, sin ninguna forma de saber por qué—.
//
// SE CUENTA LO QUE NO SE VE. Lo que gana el principal ya lo dice el resultado,
// así que aquí sólo sale lo de los DEMÁS: lo que se lleva otro asiento y lo que
// le vuelve a quien lo puso. Lo que vuelve no se pierde —es la apuesta que nadie
// pudo igualar— y decirlo importa: es dinero que el jugador vio salir de su pila
// y le vuelve.
//
// VOZ-3 · Recibe la LECTURA de la mano (`manoCore.lecturaDeMano`), no las capas
// con un «ganador principal» al lado: quién es el principal, qué parte de cada
// capa es vuelto y qué parte se ganó ya están contados allí, y aquí sólo se
// ponen en palabras. Antes el principal era `game.winner` —el dueño de la capa
// de arriba—, y con un all-in corto eso hacía titular a quien sólo recuperaba
// su vuelto (informe de la Fase 0 de VOZ-3, §A.3).
//
// `players` da los nombres. La mesa de dos dice «la IA»; las de 3 a 5, el
// nombre del asiento, igual que `resultadoCore.sujetoInicial`.
export function componeCapas(lectura, players) {
  if (!lectura) return null
  const nombre = (seat) => (seat === 0 ? 'Tú' : (players?.[seat]?.name ?? 'la mesa'))

  // APU-1 1e-iv · E-23. SE AGRUPA POR GANADOR Y SE SUMA. Un asiento puede
  // llevarse más de una capa, y recorrer la lista sin agrupar lo nombraba una
  // vez por capa: «IA 2 se lleva 200. IA 2 se lleva 300.» La información era
  // correcta y se leía como un tartamudeo. Cuántas capas fueron es mecánica
  // del reparto; lo que esta frase existe para explicar es por qué el saldo
  // sube menos de lo que promete el resultado, y para eso lo que importa es
  // CUÁNTO y A QUIÉN. `lectura.otras` ya viene agrupada y en orden de primera
  // aparición, para que la frase siga leyendo el pozo de abajo arriba.
  const otras = lectura.otras.map(({ asiento, monto }) => (asiento === 0
    ? `Te llevas otros ${monto} ${MONEDA}.`
    : `${nombre(asiento)} se lleva ${monto}.`))

  // VOZ-3 · D5 · lo que vuelve, al final y en orden de asiento, con UNA sola
  // forma en todo el juego. D6: la devolución al propio principal no se
  // anuncia —ya ganó la mano, y decirlo no cambia la lectura—, así que las
  // frases que hoy acertaban (C2, C4, C6b) quedan al byte.
  const devoluciones = lectura.devoluciones
    .filter(({ asiento }) => asiento !== lectura.principal)
    .map(({ asiento, monto }) => {
      const verbo = monto === 1 ? 'devuelve' : 'devuelven'
      const moneda = monto === 1 ? MONEDA_UNA : MONEDA
      if (asiento === 0) return `Se te ${verbo} ${monto} ${moneda}.`
      const quien = lectura.numPlayers === 2 ? 'A la IA' : `A ${nombre(asiento)}`
      return `${quien} se le ${verbo} ${monto} ${moneda}.`
    })

  // Sin «El pozo se partió:» cuando lo único que hay es una devolución (D5).
  const frases = [otras.length ? `El pozo se partió: ${otras.join(' ')}` : null, ...devoluciones].filter(Boolean)
  return frases.length ? frases.join(' ') : null
}

// ── La crónica de una transición ────────────────────────────────────────────
// `prev === null` es el primer render (no hubo transición): manda la fase.
export function componeCronica(prev, next) {
  if (!prev) return componeFase(next)
  if (next.phase !== prev.phase) return componeFase(next, prev)
  const seat = actuo(prev, next)
  if (seat === null) return componeFase(next, prev)
  return componeAccion(prev, next, seat) ?? componeFase(next, prev)
}
