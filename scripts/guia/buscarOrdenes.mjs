// ── GUI-1 · El buscador de los órdenes de baraja de la partida guiada ────────
// Rector: AJILEI_TUT-1_T2_v1.0.md §1.2; normativo AJILEI_Tutorial_v1.4.md §1.3 y §1.4.
//
//   node scripts/guia/buscarOrdenes.mjs            → busca y PEGA en src/lib/guiaManos.js
//   node scripts/guia/buscarOrdenes.mjs --seco     → busca y sólo lo cuenta
//   node scripts/guia/buscarOrdenes.mjs --solo 1   → busca sólo esa mano (o «1,2»); las
//        demás conservan su orden de `guiaManos.js`, que se vuelve a jugar y a comprobar
//
// LOS ÓRDENES SE BUSCAN, NO SE ESCRIBEN. Para cada mano, en orden (la pila y la
// Mano de una salen de la anterior), se arma un orden candidato con las cartas
// del humano en SUS posiciones —las da la Mano: el reparto va en ronda desde
// ella, dos y luego tres—, las que le reponen en el sitio del mazo que le toca
// (`ajustarReposicion`) y el resto al azar (un generador con semilla fija: la
// misma corrida da los mismos órdenes). Se juega la mano ENTERA con el motor
// real (`guiaManos.jugarMano`: el guion de los rivales, la escalera del humano y
// el descarte que decide la IA) y se comprueba la condición del normativo. El
// primero que cumple, se queda. Después se juega cinco veces más con otro
// `Math.random` debajo: si el resultado cambia, el orden no vale (el descarte de
// la IA tiene que ser el mismo siempre).
//
// Las condiciones, tal cual el normativo v1.3 (§1.4):
//   1 · a 2 cartas, dos palos distintos; a 5, tres de un palo (30) y dos
//       sueltas; descartas las dos sueltas y las que llegan NO son del palo
//       (sigues en 30); en la última ronda pasas, IA 1 apuesta ×1, IA 2 iguala
//       y tú igualas; al mostrar, un rival te gana con 37 o más, sin AJILEI y
//       sin empate arriba. Tú eres Mano.
//   2 · a 2, dos del mismo palo; a 5, cuatro de ese palo y una suelta, y ANTES
//       del descarte un rival va por delante; descartas la suelta y la que llega
//       ES del palo; al mostrar, tu suma es la más alta, sola; nadie con AJILEI.
//   3 · a 2, el As y una de diez del mismo palo; a 5, AJILEI de 51; «Sin
//       descartar»; ganas el pozo.
// Y en las tres: en BET_1, BET_2 y BET_3 el humano hace justo lo que dice la
// escalera (`guiaManos.ESCALERA`: ninguna fase saltada, APU-1 §4.4, y ninguna
// palabra de más) y pone lo que dice; todos ponen lo mismo en la mano; nadie se
// queda sin pila.
import { register } from 'node:module'
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { dirname, join } from 'node:path'

// El motor importa sin extensión y es archivo PROTEGIDO: el gancho del arnés.
register('../_resolveExt.mjs', import.meta.url)

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
const src = (p) => pathToFileURL(join(RAIZ, 'src', p)).href
const { createDeck } = await import(src('engine/deck.js'))
const { isAjilei } = await import(src('engine/handEvaluator.js'))
const { armarOrden, soltarMazo } = await import(src('lib/mazoDado.js'))
const G = await import(src('lib/guiaManos.js'))

const SECO = process.argv.includes('--seco')
const iSolo = process.argv.indexOf('--solo')
const SOLO = iSolo > 0 ? new Set(process.argv[iSolo + 1].split(',').map(Number)) : null
const TOPE = 200000
const CARTAS = createDeck()
const POR_ID = Object.fromEntries(CARTAS.map((c) => [c.id, c]))
const PALOS = ['Oros', 'Copas', 'Espadas', 'Bastos']
const DIEZ = (c) => c.points === 10

// Un generador con semilla (mulberry32): el candidato es reproducible.
function generador(semilla) {
  let a = semilla >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const azar = generador(0x6a11e1)
const elegir = (lista) => lista[Math.floor(azar() * lista.length)]
const barajar = (lista) => {
  const l = [...lista]
  for (let i = l.length - 1; i > 0; i--) { const j = Math.floor(azar() * (i + 1)); [l[i], l[j]] = [l[j], l[i]] }
  return l
}
const tomar = (pool, pred, n) => barajar(pool.filter(pred)).slice(0, n)

// Las posiciones del humano en la baraja con la Mano en `mano` (mesa de 3).
function posicionesHumano(mano) {
  const rel = (0 - mano + G.ASIENTOS) % G.ASIENTOS
  return [rel, G.ASIENTOS + rel, 2 * G.ASIENTOS + rel, 3 * G.ASIENTOS + rel, 4 * G.ASIENTOS + rel]
}

// Un orden con las cinco del humano en sus posiciones (las dos primeras, las de
// la primera vuelta) y el resto al azar.
function ordenCon(mano, cincoHumano) {
  const T = new Array(40).fill(null)
  posicionesHumano(mano).forEach((p, i) => { T[p] = cincoHumano[i].id })
  const resto = barajar(CARTAS.filter((c) => !cincoHumano.includes(c)).map((c) => c.id))
  for (let i = 0; i < 40; i++) if (T[i] === null) T[i] = resto.shift()
  return T
}

const suma = (cartas) => G.sumaDe(cartas).points
const palosDe = (cartas) => {
  const n = {}
  for (const c of cartas) n[c.palo] = (n[c.palo] ?? 0) + 1
  return Object.values(n).sort((a, b) => b - a)
}
const ids = (cartas) => cartas.map((c) => c.id).join()
const nadieAjilei = (g) => g.players.every((p) => !isAjilei(p.cards, G.ASIENTOS))
const sumasFinales = (g) => g.players.map((p) => suma(p.cards))
const sinFaseSaltada = (r) => r.turnos.BET_1 >= 1 && r.turnos.BET_2 >= 1 && r.turnos.BET_3 >= 1
const conPilas = (g) => g.players.every((p) => p.chips > 0 && !p.eliminated && !p.folded)
const maxUnico = (s) => s.filter((x) => x === Math.max(...s)).length === 1
// La escalera, tal cual: en cada fase el humano habla las veces que dice, con la
// acción que dice, y lo que pone es k × la apuesta de mesa (nada si pasa).
function escaleraCumplida(r) {
  const esc = G.ESCALERA[r.mano]
  for (const f of ['BET_1', 'BET_2', 'BET_3']) {
    const js = r.jugadas.filter((j) => j.fase === f)
    if (js.length !== esc[f].length) return `${f}: el humano habló ${js.length} veces`
    for (const [i, e] of esc[f].entries()) {
      if (js[i].action !== e.action) return `${f}: ${js[i].action}, no ${e.action}`
      if (js[i].puso !== e.k * G.APUESTA) return `${f}: puso ${js[i].puso}, no ${e.k * G.APUESTA}`
    }
  }
  return null
}
// Que los rivales igualaron todo: cada uno puso en la mano lo mismo que el humano.
const todosIgualan = (g) => g.players.every((p) => p.contribMano === g.players[0].contribMano)

// ── Los candidatos y las condiciones, mano por mano ─────────────────────────
// `llega(S)`: lo que tiene que ser cada carta que te reponen (ver `ajustarReposicion`).
const MANOS = {
  1: {
    llega: (S) => (c) => c.palo !== S,
    candidato(mano) {
      const S = elegir(PALOS)
      const tres = tomar(CARTAS, (c) => c.palo === S && DIEZ(c), 3)
      const otros = barajar(PALOS.filter((p) => p !== S)).slice(0, 2)
      const sueltas = otros.map((p) => tomar(CARTAS, (c) => c.palo === p && c.points < 10, 1)[0])
      // A dos cartas, palos distintos: una del palo y una suelta, en cualquier orden.
      const dos = barajar([tres[0], sueltas[0]])
      return { T: ordenCon(mano, [...dos, ...barajar([tres[1], tres[2], sueltas[1]])]), S }
    },
    cumple(r) {
      const h2 = r.dos, h5 = r.cinco[0], g = r.pago
      if (h2[0].palo === h2[1].palo) return 'a 2 cartas, mismo palo'
      if (palosDe(h5).join() !== '3,1,1' || suma(h5) !== 30) return 'a 5 cartas, no es 3 + 1 + 1 con 30'
      const sueltas = G.indicesSueltas(h5)
      const S = G.sumaDe(h5).palo
      const nuevas = sueltas.map((i) => r.despues[0][i])
      if (nuevas.some((c, k) => c.id === h5[sueltas[k]].id)) return 'no repuso las dos'
      if (nuevas.some((c) => c.palo === S)) return 'llegó una del palo'
      if (suma(r.despues[0]) !== 30) return 'después del descarte no sigues en 30'
      const s = sumasFinales(g)
      if (!maxUnico(s)) return 'empate arriba'
      if (g.winner === 0 || s[g.winner] !== Math.max(...s) || s[g.winner] < 37) return 'no gana un rival con 37 o más'
      if (!nadieAjilei(g)) return 'hay AJILEI'
      if (!todosIgualan(g)) return 'un rival no igualó'
      return null
    },
  },
  2: {
    llega: (S) => (c) => c.palo === S && c.value !== 1,
    candidato(mano) {
      const S = elegir(PALOS)
      const cuatro = tomar(CARTAS, (c) => c.palo === S && c.value !== 1, 4)
      const suelta = tomar(CARTAS, (c) => c.palo !== S && c.points < 10, 1)[0]
      // La suelta va en un sitio de la segunda vuelta: a 2 cartas, las dos del palo.
      const cinco = [cuatro[0], cuatro[1], ...barajar([cuatro[2], cuatro[3], suelta])]
      return { T: ordenCon(mano, cinco), S }
    },
    cumple(r) {
      const h2 = r.dos, h5 = r.cinco[0], g = r.pago
      if (h2[0].palo !== h2[1].palo) return 'a 2 cartas, dos palos'
      if (palosDe(h5).join() !== '4,1') return 'a 5 cartas, no es 4 + 1'
      const iS = G.indiceSuelta(h5)
      const antes = r.antes.map(suma)
      if (!(antes[0] < Math.max(antes[1], antes[2]))) return 'antes del descarte nadie te supera'
      const nueva = r.despues[0][iS]
      if (!nueva || nueva.id === h5[iS].id || palosDe(r.despues[0]).join() !== '5') return 'la que llega no es del palo'
      const s = sumasFinales(g)
      if (!maxUnico(s) || s[0] !== Math.max(...s) || g.winner !== 0) return 'no ganas en solitario'
      if (!nadieAjilei(g)) return 'hay AJILEI'
      if (!todosIgualan(g)) return 'un rival no igualó'
      return null
    },
  },
  3: {
    llega: null,
    candidato(mano) {
      const S = elegir(PALOS)
      const as = POR_ID[`1-${S}`]
      const diez = tomar(CARTAS, (c) => c.palo === S && DIEZ(c), 4)
      return { T: ordenCon(mano, [as, ...diez]), S }
    },
    cumple(r) {
      const h2 = r.dos, h5 = r.cinco[0], g = r.pago
      if (h2[0].palo !== h2[1].palo || ![h2[0].value, h2[1].value].includes(1)) return 'a 2 cartas, no son As y diez del palo'
      if (!isAjilei(h5, G.ASIENTOS)) return 'a 5 cartas, no es AJILEI'
      if (ids(r.despues[0]) !== ids(h5)) return 'el humano descartó'
      if (g.winner !== 0) return 'no ganas'
      if (g.players.slice(1).some((p) => isAjilei(p.cards, G.ASIENTOS))) return 'un rival con AJILEI'
      if (!todosIgualan(g)) return 'un rival no igualó'
      return null
    },
  },
}

// Las cartas que te reponen son las del mazo en tu turno de descarte, tras las
// que se llevaron los que van delante (el descarte va de la Mano al Pie): se
// juega una vez, se cuenta cuántas salieron antes que las tuyas y se ponen ahí,
// una por cada carta que descartas, cartas que cumplan `llega` (en la mano 1, de
// otro palo; en la mano 2, del palo, sin el As).
function ajustarReposicion(previo, mano, { T, S }, llega) {
  if (!llega) return T
  const r = G.jugarMano(previo, mano, T, armarOrden)
  const orden = []
  for (let k = 0; k < G.ASIENTOS; k++) orden.push((r.manoIndex + k) % G.ASIENTOS)
  let antes = 0
  for (const seat of orden) {
    if (seat === 0) break
    antes += r.antes[seat].filter((c, i) => c.id !== r.despues[seat][i].id).length
  }
  const q = 5 * G.ASIENTOS + antes
  const cuantas = G.jugadaHumana(mano, { phase: 'DISCARD', players: [{ cards: r.antes[0] }] }).length
  const ok = llega(S)
  const U = [...T]
  for (let k = 0; k < cuantas; k++) {
    if (ok(POR_ID[U[q + k]])) continue
    const j = U.findIndex((id, i) => i > q + k && ok(POR_ID[id]))
    if (j < 0) return U
    ;[U[q + k], U[j]] = [U[j], U[q + k]]
  }
  return U
}

// El mismo orden, jugado con otros `Math.random` debajo: el resultado no puede cambiar.
function estable(previo, mano, T) {
  const huella = (r) => JSON.stringify([r.despues, r.pago.winner, r.pago.players.map((p) => p.chips)])
  const base = huella(G.jugarMano(previo, mano, T, armarOrden))
  const real = Math.random
  try {
    for (let s = 1; s <= 5; s++) {
      const otro = generador(s * 7919)
      Math.random = otro
      if (huella(G.jugarMano(previo, mano, T, armarOrden)) !== base) return false
    }
  } finally { Math.random = real }
  return true
}

const ordenes = []
const notas = []
let previo = G.estadoInicial()
for (let mano = 1; mano <= G.MANOS; mano++) {
  const def = MANOS[mano]
  const manoIndex = (mano - 1) % G.ASIENTOS
  let hallado = null
  let intentos = 0
  const motivos = {}
  const conservar = SOLO && !SOLO.has(mano)
  while (!hallado && intentos < (conservar ? 1 : TOPE)) {
    intentos++
    const T = conservar ? [...G.ORDENES[mano - 1]] : ajustarReposicion(previo, mano, def.candidato(manoIndex), def.llega)
    const r = G.jugarMano(previo, mano, T, armarOrden)
    const fallo = r.manoIndex !== manoIndex ? 'otra Mano'
      : !sinFaseSaltada(r) ? 'fase saltada'
        : !conPilas(r.pago) ? 'alguien sin pila'
          : escaleraCumplida(r) ?? def.cumple(r)
    if (fallo) { motivos[fallo] = (motivos[fallo] ?? 0) + 1; continue }
    if (!estable(previo, mano, T)) { motivos['no estable'] = (motivos['no estable'] ?? 0) + 1; continue }
    hallado = { T, r }
  }
  soltarMazo()
  if (!hallado) {
    console.error(conservar ? `mano ${mano}: su orden de guiaManos.js ya no cumple` : `mano ${mano}: sin orden en ${intentos} intentos`, motivos)
    process.exit(1)
  }
  const { T, r } = hallado
  const g = r.pago
  const s = sumasFinales(g)
  const de = (cs) => cs.map((c) => c.id).join(', ')
  const sueltas = G.indicesSueltas(r.cinco[0])
  const cambio = mano === 3 ? 'sin descartar'
    : `descartas ${de(sueltas.map((i) => r.cinco[0][i]))} y llega ${de(sueltas.map((i) => r.despues[0][i]))}`
  const nota = [
    `a 2: ${de(r.dos)}`,
    `a 5: ${de(r.cinco[0])} (${suma(r.cinco[0])}${mano === 2 ? `; antes del descarte un rival lleva ${Math.max(...r.antes.slice(1).map(suma))}` : ''})`,
    `${cambio} (${suma(r.despues[0])})`,
    `pozo ${r.pozo}`,
    `al mostrar: tú ${s[0]}, IA 1 ${s[1]}, IA 2 ${s[2]}; gana ${g.players[g.winner].name}`,
  ].join(' · ')
  console.log(`mano ${mano} · Mano ${r.manoIndex} · ${conservar ? 'conservado y comprobado' : `${intentos} intentos`} · ${nota}`)
  ordenes.push(T)
  notas.push(nota)
  previo = g
}

if (SECO) process.exit(0)

const ARCHIVO = join(RAIZ, 'src', 'lib', 'guiaManos.js')
const texto = readFileSync(ARCHIVO, 'utf8')
const eol = texto.includes('\r\n') ? '\r\n' : '\n'
const bloque = [
  '// BEGIN ORDENES',
  '// Escrito por `node scripts/guia/buscarOrdenes.mjs` (no a mano). Cada orden es la',
  '// baraja de arriba abajo; lo que cumple, contado por el propio buscador:',
  ...notas.map((n, i) => `//   · mano ${i + 1}: ${n}.`),
  'export const ORDENES = Object.freeze([',
  ...ordenes.map((T) => `  Object.freeze([${T.map((id) => `'${id}'`).join(', ')}]),`),
  '])',
  '// END ORDENES',
].join(eol)
const nuevo = texto.replace(/\/\/ BEGIN ORDENES[\s\S]*?\/\/ END ORDENES/, bloque)
if (nuevo === texto) { console.log('guiaManos.js ya tenía estos órdenes'); process.exit(0) }
writeFileSync(ARCHIVO, nuevo)
console.log('pegados en src/lib/guiaManos.js')
