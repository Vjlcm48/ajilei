// ── idxNavegador.mjs · Abrir la página IDX-1 en Edge (lado Node) ─────────────
// Rector: AJILEI_IDX-1_Fase1b_v1.0 B-4 y B-6. Los tres generadores que pasan
// cartas por el índice nuevo —`gen-cards.mjs` (el juego),
// `gen-portada-assets.mjs` (la Portada) y `gen-idx.mjs` (la hoja de contacto)—
// abren la MISMA página con el MISMO núcleo, así que una carta sale igual por
// las tres vías.
//
// La página es un origen ficticio (`http://idx.local/`) servido por
// `page.route` desde disco: los maestros PNG, la fuente de `scripts/fonts/` y
// los módulos de `scripts/idx/`. Todo lo demás se aborta, así que el resultado
// sólo depende del repo y de la versión de Edge.
import { chromium } from 'playwright-core'
import { readFileSync } from 'node:fs'
import { resolve, dirname, extname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { comprobarHolgura } from './idxCore.mjs'

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..')
const ORIGEN = 'http://idx.local'

const TIPOS = { '.html': 'text/html', '.mjs': 'text/javascript', '.png': 'image/png', '.ttf': 'font/ttf' }
const RUTAS = [
  [/^\/$/, () => resolve(RAIZ, 'scripts/idx/pagina.html')],
  [/^\/idx\/([\w.]+\.mjs)$/, (m) => resolve(RAIZ, 'scripts/idx', m[1])],
  [/^\/fonts\/([\w.-]+\.ttf)$/, (m) => resolve(RAIZ, 'scripts/fonts', m[1])],
  [/^\/cards\/([a-z]+_[a-z]+\.png)$/, (m) => resolve(RAIZ, 'src/assets/cards', m[1])],
]

// Devuelve { navegador, pagina, versionEdge }. Lanza si la fuente no carga:
// sin Roboto Condensed el canvas pintaría el número con otra letra, en silencio.
export async function abrirIdx() {
  const navegador = await chromium.launch({ channel: 'msedge', headless: true })
  const versionEdge = navegador.version()
  const pagina = await navegador.newPage()
  await pagina.route(`${ORIGEN}/**`, (ruta) => {
    const camino = new URL(ruta.request().url()).pathname
    for (const [re, aArchivo] of RUTAS) {
      const m = camino.match(re)
      if (m) return ruta.fulfill({ status: 200, contentType: TIPOS[extname(aArchivo(m))] ?? 'application/octet-stream', body: readFileSync(aArchivo(m)) })
    }
    return ruta.fulfill({ status: 404, body: '' })
  })
  await pagina.route((url) => !url.href.startsWith(ORIGEN), (ruta) => ruta.abort())
  await pagina.goto(`${ORIGEN}/`)
  const fuenteOk = await pagina.evaluate(async () => {
    window.idx = await import('/idx/idxPagina.mjs')
    return window.idx.cargarFuente()
  })
  if (!fuenteOk) {
    await navegador.close()
    throw new Error('Roboto Condensed no cargó desde scripts/fonts/')
  }
  return { navegador, pagina, versionEdge }
}

// Una carta por el índice nuevo (ver `procesarCarta` en idxPagina.mjs).
export function procesarCarta(pagina, { rango, palo }, opciones = {}) {
  return pagina.evaluate(({ rango, palo, opciones }) => window.idx.procesarCarta({ rango, palo, ...opciones }), { rango, palo, opciones })
}

// La misma carta sin IDX: el maestro reducido (ver `derivarClasica`).
export function derivarClasica(pagina, { rango, palo }, opciones = {}) {
  return pagina.evaluate(({ rango, palo, opciones }) => window.idx.derivarClasica({ rango, palo, ...opciones }), { rango, palo, opciones })
}

// B-2 y el borrado: lo que obliga a un generador a detenerse SIN escribir.
// Una holgura por debajo de 17,0 con el factor sellado, o un resto del número
// viejo en la carta final (el juego no puede servir una carta a medio borrar).
export function motivosDeParada(resultados) {
  const out = []
  for (const r of resultados) {
    try { comprobarHolgura(r.nombre, r.holguraExacta) } catch (e) { out.push(e.message) }
    if (!r.borradoOk) out.push(`${r.nombre}: restos del número viejo (arriba ${r.anillo.sup.restos}, abajo ${r.anillo.inf.restos})`)
  }
  return out
}

// Qué factor habría dado la regla en esta corrida, sólo como dato (B-2).
export function avisosDeRegla(resultados) {
  return resultados.filter((r) => r.reglaDifiere).map((r) =>
    `${r.nombre}: sellado ${r.factor}, la regla habría dado ${r.factorRegla ?? 'ninguno ≥ 0,85'} (holgura sin encoger ${r.holguraAntes.px} px)`)
}
