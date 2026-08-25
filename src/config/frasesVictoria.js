// ── CEL-1 · Banco de frases de victoria de mesa ─────────────────────────────
// Documento rector: lámina CEL-1, validada por Victor.
//
// La frase es DEL GANADOR. Sólo aparece cuando el humano gana la mesa; la
// pantalla de derrota no la monta y no cambia ni un byte por esta tanda.
//
// Módulo sin React ni DOM —igual que `config/niveles.js` y `config/consultas.js`—
// para que `node` lo importe tal cual y Vitest selle la elección. La memoria y
// el aleatorio viven FUERA: aquí sólo el banco y la regla.
//
// PROHIBIDO hardcodear una frase en el JSX. Si el banco crece o se corrige, se
// corrige aquí y en ningún otro sitio.

export const FRASES_VICTORIA = [
  '¡Barriste la mesa, mi pana!',
  '¡Te la comiste! La mesa quedó limpia.',
  '¡Épale! Aquí no quedó nadie parado.',
  '¡Sobrado! Todas las Heptacoins son tuyas.',
  '¡Se acabó lo que se daba… y te lo llevaste todo!',
  '¡Qué molleja! Arrasaste con la mesa.',
  '¡Campeón de la mesa! No les dejaste ni una.',
  '¡Ganaste la mesa! Eres el último con Heptacoins.',
]

// Convención del proyecto: `ajilei.<cosa>`, igual que `ajilei.nivel`,
// `ajilei.consultas` y `ajilei.sound`.
export const FRASE_KEY = 'ajilei.fraseVictoria'

// ── La regla ────────────────────────────────────────────────────────────────
// Aleatoria, PERO no la última mostrada. Sin esa condición el jugador que gana
// dos mesas seguidas ve la misma frase con probabilidad 1/8 y la pantalla se
// siente escrita por una máquina.
//
// Implementación: se sortea sobre las SIETE restantes y se corrige el índice,
// en vez de sortear sobre ocho y repetir hasta que no coincida. Un bucle de
// reintento no tiene cota superior; esto es una operación y siempre acierta.
//
// `ultima` fuera de rango (null, basura de un localStorage manipulado, un índice
// de un banco más corto) se trata como "no hay última": se sortea sobre las
// ocho. Nunca se devuelve un índice inválido.
export function eligeIndice(ultima, aleatorio) {
  const n = FRASES_VICTORIA.length
  const a = Math.min(Math.max(aleatorio, 0), 0.999999999)
  const hayUltima = Number.isInteger(ultima) && ultima >= 0 && ultima < n
  if (!hayUltima) return Math.floor(a * n)
  const i = Math.floor(a * (n - 1))
  return i >= ultima ? i + 1 : i
}

// Índice → frase, con el mismo criterio defensivo: un índice imposible cae a la
// primera en vez de pintar `undefined` en la pantalla de victoria.
export function fraseDe(indice) {
  return FRASES_VICTORIA[indice] ?? FRASES_VICTORIA[0]
}

// ── Memoria ─────────────────────────────────────────────────────────────────
// Lectura y escritura tolerantes: modo privado, storage denegado o valor
// corrupto se resuelven como "no hay memoria". Una frase de más no es un error
// que justifique romper la pantalla.
export function leeUltima() {
  try {
    const n = Number.parseInt(window.localStorage.getItem(FRASE_KEY), 10)
    return Number.isInteger(n) ? n : null
  } catch { return null }
}

export function guardaUltima(indice) {
  try { window.localStorage.setItem(FRASE_KEY, String(indice)) }
  catch { /* sin storage: la memoria dura lo que la sesión, y basta */ }
}

// La frase de esta pantalla. `forzada` (1-based, del molde de desarrollo) manda
// sobre todo lo demás y NO toca la memoria: forzar una frase para medirla no
// debe alterar qué ve el jugador en su próxima victoria real.
export function frasePara(forzada) {
  if (Number.isInteger(forzada) && forzada >= 1 && forzada <= FRASES_VICTORIA.length) {
    return fraseDe(forzada - 1)
  }
  const i = eligeIndice(leeUltima(), Math.random())
  guardaUltima(i)
  return fraseDe(i)
}
