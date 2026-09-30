// ── DIS-1 · geometria_dis.mjs · la escena 5 en CSS, desde los JSON del render ─
// Fuente de verdad: la lámina DIS-1 v1.3 (capturas-dis/lamina13/, aprobada por
// Victor) y los bloques `web` de maestras/dis1/{laptop,telefono}.json. Este
// script repite las fórmulas de la lámina y escribe el resultado en
// src/styles/portada.css, entre las marcas DIS-1:geometria, como custom
// properties en unidades de CONTENEDOR (`cqh` = 1 % del alto de `.pue-duo`,
// que es el alto del escenario). Nada se calcula en tiempo de ejecución: el
// bundle sólo lleva constantes (ficha Fase 2 §2.3, para no empeorar 1.8b).
//
// Reglas (ficha Fase 2 §0 y §2.3):
//   · Escritorio: la composición sellada de la lámina a 1920 (laptop de 234 px
//     de silueta, teléfono +30 % sobre la escala real, solape 0,22, bajada 0,06),
//     escalada por alto/300 y anclada al centro de `.pue-duo` y al pie del
//     escenario. A 1920 el pie está a 22 px de la frase y la lámina deja el
//     conjunto a 14 px de ella: el conjunto baja 8 px del pie (escalados).
//   · Móvil (≤ 900 px): la caja de hoy. Teléfono: silueta = 100 % del alto del
//     escenario. Laptop: silueta = 88 % (82 % en vertical ≤ 700 px de alto) sin
//     pasar del ancho de la base de hoy (116 % de una tapa 16:9 de alto −10 px).
//     Los dos con el pie a 6 px y centrados.
//
// Uso:  node scripts/dis1/geometria_dis.mjs             comprueba que portada.css está al día (sale 1 si no)
//       node scripts/dis1/geometria_dis.mjs --escribir  reescribe el bloque entre las marcas
import { readFileSync, writeFileSync } from 'node:fs'

const CSS = 'src/styles/portada.css'
const INICIO = '/* DIS-1:geometria:inicio'
const FIN = '/* DIS-1:geometria:fin */'

const L = JSON.parse(readFileSync('maestras/dis1/laptop.json', 'utf8')).web
const T = JSON.parse(readFileSync('maestras/dis1/telefono.json', 'utf8')).web

// ── Escritorio: la composición de la lámina, en px a 1920 (alto 300) ──────────
const ALTO_REF = 300
const LAP_ALTO = 234, TEL_EXTRA = 0.30, SOLAPE = 0.22, BAJADA = 0.06, BAJO_EL_PIE = 8
const sL = LAP_ALTO / L.silueta_opaca[3]
const sT = (1 + TEL_EXTRA) * sL * L.px_por_metro / T.px_por_metro
const lw = L.silueta_opaca[2] * sL, lh = L.silueta_opaca[3] * sL
const tw = T.silueta_opaca[2] * sT, th = T.silueta_opaca[3] * sT
const tx = lw - SOLAPE * tw, ty = lh + BAJADA * th - th
const gx0 = Math.min(0, tx), gx1 = Math.max(lw, tx + tw)
const gy1 = Math.max(lh, ty + th)
const ox = -(gx1 - gx0) / 2 - gx0          // x de la silueta de la laptop respecto al centro
const oy = BAJO_EL_PIE - gy1               // y (hacia abajo) de la silueta de la laptop respecto al pie
function cajaEscritorio(W, s, sx, sy) {    // caja de la IMAGEN respecto al (centro, pie), px a 1920
  const x = ox + sx - W.silueta_opaca[0] * s, y = oy + sy - W.silueta_opaca[1] * s
  const w = W.tamano[0] * s, h = W.tamano[1] * s
  return { x, bajo: -(y + h), w, h }       // `bajo` = distancia del pie al borde inferior, hacia arriba
}
const escLap = cajaEscritorio(L, sL, 0, 0)
const escTel = cajaEscritorio(T, sT, tx, ty)

const q = (v) => {                          // px a 1920 → cqh (100 cqh = 300 px)
  const c = v * 100 / ALTO_REF
  return `${+c.toFixed(4)}cqh`
}
const n = (v, d = 4) => `${+v.toFixed(d)}`

// ── Móvil: la caja de hoy ─────────────────────────────────────────────────────
// Teléfono: 1 px del derivado = 100/silueta_alto cqh.
const uT = 100 / T.silueta_opaca[3]
const movTel = {
  x: -(T.silueta_opaca[0] + T.silueta_opaca[2] / 2) * uT,
  bajo: (T.tamano[1] - T.silueta_opaca[1] - T.silueta_opaca[3]) * uT,
  w: T.tamano[0] * uT, h: T.tamano[1] * uT,
}
// Laptop: u = min(f·alto / silueta_alto, ancho de la base de hoy / silueta_ancho),
// con la base de hoy = 116 % · 16/9 · (f·alto − 10 px).
const BASE = 1.16 * 16 / 9
const uLap = (f) => `min(${n(f * 100 / L.silueta_opaca[3], 6)}cqh, (${f * 100}cqh - 10px) * ${n(BASE / L.silueta_opaca[2], 8)})`
const lapDx = L.silueta_opaca[0] + L.silueta_opaca[2] / 2
const lapBajo = L.tamano[1] - L.silueta_opaca[1] - L.silueta_opaca[3]

const bloque = `${INICIO} · GENERADO por scripts/dis1/geometria_dis.mjs desde
   maestras/dis1/{laptop,telefono}.json (bloques «web») · no se edita a mano.
   Laptop ${L.tamano.join('×')} (silueta ${L.silueta_opaca.join(', ')}) · teléfono
   ${T.tamano.join('×')} (silueta ${T.silueta_opaca.join(', ')}). 100cqh = alto del escenario. */
.portada-lienzo .pue-duo {
  --dis-lap-x: ${q(escLap.x)}; --dis-lap-b: ${q(escLap.bajo)}; --dis-lap-w: ${q(escLap.w)}; --dis-lap-h: ${q(escLap.h)};
  --dis-tel-x: ${q(escTel.x)}; --dis-tel-b: ${q(escTel.bajo)}; --dis-tel-w: ${q(escTel.w)}; --dis-tel-h: ${q(escTel.h)};
}
@media (max-width: 900px) {
  .portada-lienzo .pue-duo {
    --dis-tel-x: ${n(movTel.x)}cqh; --dis-tel-b: calc(6px - ${n(movTel.bajo)}cqh); --dis-tel-w: ${n(movTel.w)}cqh; --dis-tel-h: ${n(movTel.h)}cqh;
    --dis-u: ${uLap(0.88)};
    --dis-lap-x: calc(var(--dis-u) * -${n(lapDx, 3)}); --dis-lap-b: calc(6px - var(--dis-u) * ${n(lapBajo, 3)});
    --dis-lap-w: calc(var(--dis-u) * ${L.tamano[0]}); --dis-lap-h: calc(var(--dis-u) * ${L.tamano[1]});
  }
}
@media (orientation: portrait) and (max-height: 700px) {
  .portada-lienzo .pue-duo { --dis-u: ${uLap(0.82)}; }
}
${FIN}`

const css = readFileSync(CSS, 'utf8')
const eol = css.includes('\r\n') ? '\r\n' : '\n'
const bloqueEol = bloque.replace(/\n/g, eol)
const i = css.indexOf(INICIO), j = css.indexOf(FIN)
if (i < 0 || j < 0) {
  console.error(`No encuentro las marcas DIS-1:geometria en ${CSS}.`)
  process.exit(1)
}
const actual = css.slice(i, j + FIN.length)
console.log(bloque)
if (process.argv.includes('--escribir')) {
  if (actual === bloqueEol) console.log(`\n${CSS}: ya estaba al día.`)
  else { writeFileSync(CSS, css.slice(0, i) + bloqueEol + css.slice(j + FIN.length)); console.log(`\n${CSS}: bloque reescrito.`) }
} else if (actual !== bloqueEol) {
  console.error(`\n${CSS}: el bloque NO coincide con los JSON. Ejecuta con --escribir.`)
  process.exit(1)
} else console.log(`\n${CSS}: al día.`)
