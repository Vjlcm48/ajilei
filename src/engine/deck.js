export const PALOS = ['Oros', 'Copas', 'Espadas', 'Bastos']
export const VALORES = [1, 2, 3, 4, 5, 6, 7, 10, 11, 12]

export const VALUE_NAMES = {
  1: 'As', 2: '2', 3: '3', 4: '4', 5: '5',
  6: '6', 7: '7', 10: 'Sota', 11: 'Caballo', 12: 'Rey',
}

export function getCardPoints(value) {
  if (value === 1) return 11
  if (value === 7) return 7
  if (value === 6) return 6
  return 10
}

export function createDeck() {
  const deck = []
  PALOS.forEach((palo) => {
    VALORES.forEach((value) => {
      deck.push({
        id: `${value}-${palo}`,
        value,
        palo,
        points: getCardPoints(value),
        name: VALUE_NAMES[value],
      })
    })
  })
  return deck
}

// Maps printed card value to its rank in the initial draw (As is the LOWEST)
// 1→1, 2→2, ..., 7→7, Sota(10)→8, Caballo(11)→9, Rey(12)→10
export function drawRank(rank) {
  if (rank <= 7) return rank
  if (rank === 10) return 8
  if (rank === 11) return 9
  if (rank === 12) return 10
  return rank
}

// APU-1 §6.11 · REPRODUCIBILIDAD. El generador es inyectable para que la
// simulación de la Fase 1d pueda repetir una corrida al byte. Cubierto por la
// excepción pre-autorizada de `AJILEI_Protegidos_v1.0.md §6`.
//
// Límite de la excepción: con `rng` por defecto NADA cambia — mismo algoritmo,
// mismo número de llamadas, mismo orden. Lo mide el test de oro de
// `scripts/testNivel1.test.js §1`.
//
// LIGADO TARDE (APU-1 1d §2.1). `let rng = Math.random` capturaba la funcion
// ORIGINAL en el momento de cargar el modulo, asi que un `vi.spyOn(Math,'random')`
// posterior no se veia desde aqui: el barajado seguia corriendo contra el azar
// real mientras la prueba creia haberlo fijado. El envoltorio resuelve
// `Math.random` en cada llamada. Mismo algoritmo, mismo numero de llamadas,
// mismo orden: el consumo del azar no cambia.
const AZAR_POR_DEFECTO = () => Math.random()
let rng = AZAR_POR_DEFECTO

export function setRng(fn) { rng = typeof fn === 'function' ? fn : AZAR_POR_DEFECTO }
export function resetRng() { rng = AZAR_POR_DEFECTO }

export function shuffleDeck(deck) {
  const shuffled = [...deck]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}
