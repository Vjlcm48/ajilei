// ── siembraAPU.js · El molde de APU-1: estados que cuestan una partida ──────
// Rector: AJILEI_APU-1_Fase1e_v1.0.md §3.7 (K-2c). Molde exacto de
// `siembraCEL.js`, y por las mismas razones que aquél dejó escritas: llegar a
// mano a un estado tarda minutos, no es determinista y produce una regresión
// visual imposible de repetir dos veces igual.
//
// ── QUÉ SIEMBRA ────────────────────────────────────────────────────────────
//   ?apu=saldo:<n>     El saldo arranca en n (1e-i). Desde ECO-1b lo que se
//                      siembra es la billetera FALSA del bypass
//                      (`dev/billeteraFalsa.js`); sin bypass no siembra nada.
//   ?apu=bolsillo:<n>  ECO-1c · tras SENTARSE, la billetera queda en n (un
//                      ajuste del banco imitado, como `ajuste_admin`). Desde
//                      P-6 un molde de humano cobra lo que sienta (media
//                      apuesta en `quiebra`), y el bolsillo de los estados de
//                      REC-2 ya no se puede sembrar por el saldo inicial sin
//                      que Retar (con razón) impida sentarse.
//   ?apu=allinIA       Una IA se sienta con la apuesta de mesa justa.
//   ?apu=allinHumano   El humano se sienta con 1,5 apuestas.
//   ?apu=recarga       El humano se sienta con 3 apuestas.
//   ?apu=quiebra       El humano se sienta con media apuesta (REC-2).
//   ?apu=capas         Dos IAS a distinta profundidad corta, el resto hondas.
//   ?apu=sinRival      Todas las IAS con la apuesta justa.
//   ?apu=sinRival:d12  Todas, el humano incluido.
//   ?apu=gana          ARN-3d · el humano gana la PRIMERA mano: prepara el
//                      reparto, no las pilas (`repartoGanador.js`).
// Se pueden encadenar con comas: `?apu=saldo:900,allinIA`.
//
// ── EL MOLDE NO INVENTA ESTADOS, SIEMBRA PILAS ─────────────────────────────
// Es la misma disciplina de CEL y la razón por la que estos seis moldes son
// fiables: aquí NO se fabrica un estado a mitad de mano con `allIn` puesto a
// mano. Lo único que se cambia son las fichas con que un asiento se sienta, y
// el resto lo hace el motor por su propia regla. Quien se sienta con la apuesta
// justa la pone entera en el ante, se queda en cero y `startHand` lo marca
// `allIn` él solo (D-7 de 1c): el molde no toca esa línea, la ALIMENTA. Por eso
// lo que sale en pantalla es el estado de verdad y no una imitación — que es
// justo lo que hace falta para medir un hueco o fotografiar una marca.
//
// LAS PILAS QUE NO SON MÚLTIPLO DE LA APUESTA NO SON UN TRUCO. `allinHumano`
// sienta al humano con 1,5 apuestas, y eso parece imposible: las entradas son
// múltiplos (§2.2) y los antes y las apuestas también. Pero la pila de una IA
// es `round(entrada × 1,5)`, que con una entrada de piso impar da media apuesta
// partida; esas fichas llegan al pozo, se reparten por capas y acaban en la
// pila de cualquiera. Un jugador con 1,5 apuestas es un jugador corriente de
// APU-1, y es exactamente el que no puede cubrir NINGUNA apuesta viva: el caso
// que el botón All-in existe para atender.
//
// ── LA PUERTA ES DOBLE, COMO EN CEL Y EN SAL ───────────────────────────────
// `import.meta.env.DEV` la apaga en cualquier build de producción, y el
// parámetro tiene que estar presente. Ni un despiste de configuración puede
// sembrar una sesión real: en producción estas funciones devuelven `null` (o la
// identidad) en su primera línea y el minificador se lleva el archivo entero.

import { armarRepartoGanador } from './repartoGanador'

export const APU_PARAM = 'apu'

function pedido() {
  if (!import.meta.env.DEV) return null
  if (typeof window === 'undefined') return null
  let crudo
  try { crudo = new URLSearchParams(window.location.search).get(APU_PARAM) }
  catch { return null }
  if (crudo == null) return null
  return crudo.split(',').map((t) => t.trim()).filter(Boolean)
}

/**
 * Lo que `?apu=` pide para el saldo (la billetera falsa, ECO-1b), o `null`.
 * ECO-1c · y el bolsillo tras sentarse (`bolsillo:<n>`), o `null`.
 * @returns {{saldo:number|null, bolsillo:number|null}|null}
 */
export function siembraAPU() {
  // La puerta del build, EXPLÍCITA y en la primera línea. Delegarla en `pedido()`
  // era correcto y sin embargo dejaba residuo: el minificador plegaba `pedido` a
  // `return null` pero no podía demostrar que el resto del archivo fuera
  // inalcanzable, y la tabla de moldes viajaba entera a `dist/`. Inofensiva
  // —ciento cincuenta bytes muertos— pero la cabecera de este archivo promete
  // otra cosa, y una promesa que no se cumple en el bundle es peor que no
  // hacerla. Es el mismo molde de `siembraCEL`, que SÍ desaparece.
  if (!import.meta.env.DEV) return null
  const partes = pedido()
  if (partes === null) return null
  // `saldo:2400` → 2400. Cualquier otra cosa no siembra saldo, en vez de
  // sembrar un `NaN` que acabaría pintando «⟦saldo⟧» en la píldora de la barra.
  let saldo = null
  let bolsillo = null
  for (const p of partes) {
    const m = /^saldo:(\d+)$/.exec(p)
    if (m && saldo === null) saldo = Number(m[1])
    const b = /^bolsillo:(\d+)$/.exec(p)
    if (b && bolsillo === null) bolsillo = Number(b[1])
  }
  return { saldo, bolsillo }
}

/**
 * ECO-1c · P-6 · la entrada con la que un molde de HUMANO sienta al asiento 0,
 * o `null` si no se pide ninguno. `App` se sienta en el servidor con ESTA
 * cifra y no con la que se eligió en Retar: la mesa cobra lo que de verdad
 * sentó, y al salir el saldo cuadra (el descuadre de la Fase 0 §I.2: entrada
 * de 1.000, molde de 75, saldo 4.000 en vez de 4.925).
 */
export function entradaSembradaAPU(unit) {
  if (!import.meta.env.DEV) return null
  const partes = pedido()
  if (partes === null || !(unit > 0)) return null
  let factor = null
  for (const parte of partes) {
    const [nombre, arg] = parte.split(':')
    const molde = MOLDES[nombre]
    if (molde?.humano !== undefined) factor = molde.humano
    if (nombre === 'sinRival' && arg === 'd12') factor = 1
  }
  return factor === null ? null : Math.round(unit * factor)
}

/**
 * Lo que `?apu=` pide para la MESA. Devuelve el estado tal cual (identidad)
 * salvo que se pida uno de los cinco moldes.
 */
export function siembraMesaAPU(estado) {
  if (!import.meta.env.DEV) return estado
  const partes = pedido()
  if (partes === null || !estado?.players) return estado

  const unit = estado.unit || 1
  // Se sientan a la vez la pila y la `entrada`: el resultado de la mesa se
  // calcula contra la entrada (§2.5), y un molde que sembrara sólo las fichas
  // haría que la tarjeta final dijera que el jugador perdió lo que nunca puso.
  const sentar = (players, seat, factor) => players.map((p, i) => (
    i === seat ? { ...p, chips: Math.round(unit * factor), entrada: Math.round(unit * factor) } : p
  ))

  let players = estado.players
  for (const parte of partes) {
    const [nombre, arg] = parte.split(':')
    // ARN-3d §2.5 (D14) · el único molde que NO siembra pilas: arma el orden
    // de la baraja de la primera mano (el motor baraja en el primer «Iniciar
    // mano»). Cuenta los vivos con que nace la mesa, que son los que fijan las
    // reglas de esa mano (HR-1). El estado sale tal cual.
    if (nombre === 'gana') {
      armarRepartoGanador(players.filter((p) => !p.eliminated).length)
      continue
    }
    const molde = MOLDES[nombre]
    if (!molde) continue

    if (molde.humano !== undefined) players = sentar(players, 0, molde.humano)
    for (const seat of molde.ias ?? []) {
      if (players[seat]) players = sentar(players, seat, molde.factor)
    }
    for (const seat of molde.iasMedias ?? []) {
      if (players[seat]) players = sentar(players, seat, molde.factorMedio)
    }
    if (molde.todasIAS !== undefined) {
      players = players.map((p, i) => (
        i === 0 ? p : { ...p, chips: unit * molde.todasIAS, entrada: unit * molde.todasIAS }
      ))
      // D-12 · el hueco que 1d dejó abierto: si TODOS los vivos se quedan a
      // cero con el mismo ante, no queda nadie que pueda hablar. Se siembra
      // aparte porque no es el caso de §4.3 (ahí queda uno), sino el escalón
      // siguiente, y la pantalla los enruta distinto.
      if (arg === 'd12') players = sentar(players, 0, 1)
    }
  }

  return players === estado.players ? estado : { ...estado, players }
}

// Los cinco moldes de mesa de §3.7, con lo que cada uno siembra. `factor` es
// sobre la apuesta de mesa: 1 es «la apuesta justa», que tras el ante deja el
// asiento en cero y en all-in. Fuera de las funciones desde ECO-1c, porque
// `entradaSembradaAPU` lee los de humano.
const MOLDES = {
  // Una sola IA corta: se queda en all-in en el ante de la primera mano y sigue
  // en la mano, disputando su capa. Los demás apuestan por encima de ella.
  allinIA:      { ias: [1], factor: 1 },
  // El humano con 1,5 apuestas: tras el ante le queda media, y media apuesta no
  // cubre ni el ×1 de nadie. En cuanto alguien abre, su fila de acciones trae
  // All-in en el sitio de Igualar.
  allinHumano:  { humano: 1.5 },
  // Bajo el listón de §5.1 (`pila < 5 × unit`) desde antes de la primera mano,
  // así que la pregunta automática sale al cerrarla, gane o pierda.
  recarga:      { humano: 3 },
  // REC-2 · Media apuesta: no cubre el ante, así que la FORZOSA sale ya en
  // `WAITING`, antes de la primera mano, sin jugar diez manos para perderlo
  // todo. Con `saldo:` se elige el caso: `saldo:1600,quiebra` en la mesa de
  // 100 con entrada al piso deja 600 en el bolsillo (caso 2) y
  // `saldo:1000,quiebra` lo deja en 0 (caso 3).
  quiebra:      { humano: 0.5 },
  // Dos niveles de all-in por debajo del resto: el ante hace la primera capa y
  // la IA de tres apuestas hace la segunda en cuanto la ronda pase de ahí.
  capas:        { ias: [1], factor: 1, iasMedias: [2], factorMedio: 3 },
  // §4.3: nadie con quien apostar. El humano se queda solo con fichas y las
  // rondas de apuesta dejan de existir.
  sinRival:     { todasIAS: 1 },
}
