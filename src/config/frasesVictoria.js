import { eligeSinRepetir, leeMemoria, guardaMemoria } from './sinRepetir'

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
// CEL-2 · La regla dejó de vivir aquí y vive en `config/sinRepetir.js`, porque
// la bolsa de melodías necesita EXACTAMENTE la misma y dos copias de una regla
// son dos reglas. Esta función se conserva —sus pruebas la sellan por nombre y
// es la que lee quien venga a entender las frases— y delega. El comportamiento
// no cambia ni en un caso: `eligeSinRepetir` es el cuerpo que estaba aquí, con
// el tamaño del banco como parámetro.
export function eligeIndice(ultima, aleatorio) {
  return eligeSinRepetir(FRASES_VICTORIA.length, ultima, aleatorio)
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
  return leeMemoria(FRASE_KEY)
}

export function guardaUltima(indice) {
  guardaMemoria(FRASE_KEY, indice)
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
