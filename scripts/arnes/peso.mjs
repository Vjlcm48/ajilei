// ── arnes/peso.mjs · ARN-4d · la vara `1.8b` de `commit` ─────────────────────
// Pesa el camino crítico de `dist/` contra INV-30, sin navegador (`pesoCore.mjs`). No
// compila: en `npm run varas` el único build va delante. `--sin-build` se acepta porque
// el contrato de las varas lo pide a toda la que mida `dist/`.
//
// Códigos: 0 = dentro del techo · 1 = por encima · 2 = error de instrumento.
import process from 'node:process'
import { commitDelArbol } from './fuente.mjs'
import { CODIGO } from './nucleo.mjs'
import { dentroDelTecho, pesarDist, TECHO_CRITICO_KIB } from './pesoCore.mjs'

const kib = (b) => (b / 1024).toFixed(1)

try {
  const { recursos, cable, crudo, porTipo } = pesarDist()
  for (const r of recursos) console.log(`  ${kib(r.cable).padStart(7)} cable  ${kib(r.crudo).padStart(7)} crudo  ${r.tipo.padEnd(5)} ${r.ruta}`)
  const dentro = dentroDelTecho(cable)
  console.log(`\n${dentro ? 'VERDE' : 'ROJO '} · 1.8b · ${kib(cable)} KiB en el cable (${kib(crudo)} en crudo) · techo ${TECHO_CRITICO_KIB} KiB`
    + ` · JS ${kib(porTipo.js)} · CSS ${kib(porTipo.css)} · HTML ${kib(porTipo.html)} · resto ${kib(porTipo.resto)} · ${recursos.length} recursos · ${commitDelArbol()}`)
  process.exitCode = dentro ? CODIGO.VERDE : CODIGO.ROJO
} catch (e) {
  console.error(`✖ ERROR DE INSTRUMENTO (código 2): ${e.message}`)
  process.exitCode = CODIGO.INSTRUMENTO
}
