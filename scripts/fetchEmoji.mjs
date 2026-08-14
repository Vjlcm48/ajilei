// ── fetchEmoji.mjs · DSK-U2c · descarga de los glifos de Noto ────────────────
// Documento rector: docs/AJILEI_Menu_Utilidades_v1.4.md §4 y §6.
//
// Baja a `public/emoji/` los dos formatos que la tanda necesita, uno por frase
// sellada: el SVG estático (selector, y relevo de `prefers-reduced-motion`) y el
// AVIF animado (burbuja). AUTOALOJADOS a propósito: la ruta `latest` de gstatic
// es MUTABLE —el arte puede cambiar bajo los pies sin aviso— y la PWA nace
// instalable con el service worker en agenda, así que no puede depender de un
// tercero para pintar (v1.4 §4).
//
// NO HAY LISTA PARALELA DE CODEPOINTS. La clave de cada recurso se DERIVA del
// emoji de la frase, en `src/config/reacciones.js`: si mañana cambia una frase,
// cambia su recurso sin que nadie tenga que acordarse de tocar este archivo.
//
// Licencia: CC BY 4.0 · Google *Animated Noto Emoji*
// (https://googlefonts.github.io/noto-emoji-animation/). Crédito visible en la
// pantalla de bienvenida — el comentario en código NO basta (v1.4 §6).
//
// Uso:  node scripts/fetchEmoji.mjs          → descarga y verifica 12/12 × 2
//       node scripts/fetchEmoji.mjs --check  → sólo verifica lo ya descargado
import { mkdirSync, writeFileSync, existsSync, statSync } from 'node:fs'
import { REACCIONES, codepointDe, emojiDe, EMOJI_PRESUPUESTO } from '../src/config/reacciones.js'

const BASE = 'https://fonts.gstatic.com/s/e/notoemoji/latest'
const DIR = new URL('../public/emoji/', import.meta.url)
const SOLO_CHECK = process.argv.includes('--check')

// Los dos formatos. El presupuesto NO se repite aquí: sale de la fuente única.
const FORMATOS = [
  { ext: 'svg',  remoto: 'emoji.svg', presupuesto: EMOJI_PRESUPUESTO.svg },
  { ext: 'avif', remoto: '512.avif',  presupuesto: EMOJI_PRESUPUESTO.avif },
]

mkdirSync(DIR, { recursive: true })

const filas = []
let faltan = 0

for (const frase of REACCIONES) {
  const cp = codepointDe(frase)
  const fila = { frase, emoji: emojiDe(frase), cp }
  for (const f of FORMATOS) {
    const destino = new URL(`${cp}.${f.ext}`, DIR)
    if (!SOLO_CHECK) {
      const r = await fetch(`${BASE}/${cp}/${f.remoto}`)
      if (!r.ok) { fila[f.ext] = `HTTP ${r.status}`; faltan++; continue }
      writeFileSync(destino, Buffer.from(await r.arrayBuffer()))
    }
    if (!existsSync(destino)) { fila[f.ext] = 'AUSENTE'; faltan++; continue }
    fila[f.ext] = statSync(destino).size
  }
  filas.push(fila)
  console.log(`${fila.emoji}  ${cp.padEnd(10)} svg=${String(fila.svg).padStart(6)}  avif=${String(fila.avif).padStart(6)}  "${frase}"`)
}

console.log()
for (const f of FORMATOS) {
  const total = filas.reduce((a, b) => a + (typeof b[f.ext] === 'number' ? b[f.ext] : 0), 0)
  const ok = filas.filter(x => typeof x[f.ext] === 'number').length
  const dentro = total <= f.presupuesto
  console.log(`${f.ext.toUpperCase().padEnd(4)} ${ok}/${REACCIONES.length}  total=${total} B  presupuesto=${f.presupuesto} B  ${dentro ? 'DENTRO' : 'EXCEDIDO'}`)
  if (!dentro) faltan++
}

// La regla dura de v1.4 §3: **12/12 o no hay tanda**. Un set mixto
// animado/estático se ve peor que todo estático, así que aquí se para.
if (faltan) {
  console.error(`\nSTOP · faltan ${faltan} recursos o se excede el presupuesto. La regla 12/12 no se cumple.`)
  process.exit(1)
}
console.log('\n12/12 en ambos formatos, dentro de presupuesto.')
