// ── DIS-1 · contrato_lamina.mjs · las cajas objetivo de la escena 5 ──────────
// El contrato visual de la Fase 2 es la lámina DIS-1 v1.3, aprobada por Victor.
// Este script la abre en Edge en sus siete casos, cada uno a su viewport, y
// guarda las cajas de imagen que la lámina ESPERA (`__disDiag().<aparato>.esperado`,
// px de página: izquierda, arriba, derecha, abajo) en maestras/dis1/contrato.json.
// El modo `dis` de diagPUE compara la Portada contra ese archivo (`dis.contrato`).
//
// La lámina no se versiona (vive en capturas-dis/, ignorada): el JSON es lo que
// queda. Si cambian los renders, se regenera la lámina con el script de Blender
// y se vuelve a correr esto.
//
// Uso:  node scripts/dis1/contrato_lamina.mjs [ruta de lamina.html]
//       (por defecto capturas-dis/lamina13/lamina.html)
import { chromium } from 'playwright-core'
import { writeFileSync, existsSync } from 'node:fs'
import { pathToFileURL } from 'node:url'
import { resolve } from 'node:path'

const LAMINA = resolve(process.argv[2] || 'capturas-dis/lamina13/lamina.html')
if (!existsSync(LAMINA)) { console.error(`No existe ${LAMINA}`); process.exit(1) }
const CASOS = [
  { id: '1920',    q: '?vp=1920',            w: 1920, h: 1080 },
  { id: 's25_tel', q: '?vp=s25&fase=tel',    w: 360,  h: 704 },
  { id: 's25_lap', q: '?vp=s25&fase=lap',    w: 360,  h: 704 },
  { id: '390_tel', q: '?vp=390&fase=tel',    w: 390,  h: 844 },
  { id: '390_lap', q: '?vp=390&fase=lap',    w: 390,  h: 844 },
  { id: '640_tel', q: '?vp=640&fase=tel',    w: 360,  h: 640 },
  { id: '640_lap', q: '?vp=640&fase=lap',    w: 360,  h: 640 },
]
const navegador = await chromium.launch({ channel: 'msedge', headless: true })
const casos = {}
for (const c of CASOS) {
  const ctx = await navegador.newContext({ viewport: { width: c.w, height: c.h } })
  const p = await ctx.newPage()
  await p.goto(pathToFileURL(LAMINA).href + c.q)
  await p.waitForFunction(() => window.__disListo === true, null, { timeout: 20000 })
  const d = await p.evaluate(() => window.__disDiag())
  casos[c.id] = { url: c.q, viewport: [c.w, c.h], aire_lema: d.aire_lema, aire_frase: d.aire_frase, silueta_px: d.silueta_px }
  for (const ap of ['laptop', 'telefono']) if (d[ap]) casos[c.id][ap] = d[ap].esperado
  console.log(c.id.padEnd(8), JSON.stringify(casos[c.id]))
  await ctx.close()
}
const salida = {
  campana: 'DIS-1', fase: 'Fase 2', generado: new Date().toISOString(), edge: navegador.version(),
  origen: 'lámina DIS-1 v1.3 (capturas-dis/lamina13/lamina.html), __disDiag().<aparato>.esperado',
  unidades: 'px de página: [izquierda, arriba, derecha, abajo] de la caja de la IMAGEN',
  casos,
}
await navegador.close()
writeFileSync('maestras/dis1/contrato.json', JSON.stringify(salida, null, 2) + '\n')
console.log('\nmaestras/dis1/contrato.json escrito')
