// ── LEC-1 1-c · `diagDSK lec` · la vara `lec.mapa`: los pisos de la letra ────────────────
// Ficha: AJILEI_LEC-1_T1_v1.0.md §3. Contra 5173 con bypass (`?sal=`, `?pvp=`), con la escala
// REAL (como `tab`): en 1920×1080 la mesa va con zoom 1,3 y eso también es letra.
//
// Abre las pantallas del mapa de la Fase 0 en T1 (360×640), T2 (390×844), T3 (640×360) y,
// solo la mesa, T6 (1920×1080). En cada una lee la letra visible (`font-size` × el zoom de
// `#root`; los `transform` de animación no cuentan) y comprueba:
//   · LEC_PISOS: cada clase que LEC-1 subió no baja de su cifra aprobada (−0,25 px). Una
//     clase del mapa que no aparezca en ninguna pantalla de su tamaño es roja: no medir no
//     es verde;
//   · LEC_EXCEPCIONES: lo que no subió, escrito con su cifra de hoy, tampoco baja de ella;
//   · nada por debajo de 9 px fuera de LEC_EXCEPCIONES.
// Lo que no es de esta vara: el óvalo a Δ = 0 (varas de TAB) y la frase ≥ 10 en `hb` (INV-61).
// `--lec-css=<archivo>` inyecta esa hoja encima de la real en cada pantalla: es el control
// rojo (una copia de `letra.css` con una regla bajada).
import { readFileSync } from 'node:fs'
import { escalaReal } from '../arnes/comun.mjs'

export const TOLERANCIA_LEC = 0.25
export const PISO_GLOBAL_LEC = 9

const T = {
  T1: { w: 360, h: 640, movil: true },
  T2: { w: 390, h: 844, movil: true },
  T3: { w: 640, h: 360, movil: true },
  T6: { w: 1920, h: 1080, movil: false },
}

// Clase → px visibles mínimos por tamaño. Son los valores aprobados por Victor en la lámina
// (STOP-L, 2026-11-19). Un tamaño que no aparece no se sella: allí esa clase no cambió.
export const LEC_PISOS = Object.freeze({
  'main.lobby .lob-nav-btn': { T1: 12.9, T2: 14, T3: 12.9 },
  '.lob-top .cst-ficha': { T3: 13 },
  '.lob-fila .tie-cfg-txt small': { T1: 10.7, T2: 11.5, T3: 10.7 },
  '.sal-bloque h2': { T1: 11.2, T2: 12.1, T3: 11.2 },
  '.sal-caja': { T3: 11.5 },
  '.sal-modo .sal-modo-d': { T1: 11.5, T2: 12.4, T3: 12.8 },
  '.sal-mesa-l2': { T1: 10.7, T2: 11.9, T3: 11 },
  '.sal-vacio': { T1: 12.9, T2: 14, T3: 12.9 },
  '.sal-unir': { T1: 12.9, T2: 14, T3: 12.9 },
  '.sal-esp-espera': { T1: 12.9, T2: 14, T3: 12.9 },
  '.sal-esp-tag': { T1: 9.2, T2: 10, T3: 9.2 },
  '.sal-esp-compartir': { T1: 12.9, T2: 14, T3: 12.9 },
  '.sal-esp-salir': { T1: 12.9, T2: 14, T3: 12.9 },
  '.rnk-cab-lista': { T1: 14, T2: 15.1, T3: 14 },
  '.rnk-fin': { T1: 11, T2: 11.9, T3: 11 },
  '.rnk-lugar': { T1: 11, T2: 11.9, T3: 11 },
  '.rnk-medalla': { T1: 12.9, T2: 14, T3: 12.9 },
  '.rnk-pos': { T1: 12.9, T2: 14, T3: 12.9 },
  '.rnk-sub': { T1: 12.2, T2: 13.2, T3: 12.2 },
  '.rnk-tu-l': { T1: 11.4, T2: 12.3, T3: 11.4 },
  // la mesa
  '.game-table-screen .hand-badge': { T1: 10.9, T2: 10.9, T3: 10.9, T6: 13 },
  '.game-table-screen .player-bar .seat-badge': { T1: 11, T2: 11, T6: 13 },
  '.game-table-screen .player-bar .pbr-mesa': { T1: 12, T2: 12, T3: 12, T6: 18.2 },
  '.game-table-screen .action-area .btn:not(.btn-mult)': { T3: 12.5, T6: 16.9 },
  '.game-table-screen .btn-mult': { T3: 12.5, T6: 15.6 },
  '.game-table-screen .discard-hint': { T3: 12.5, T6: 16.9 },
  '.game-table-screen .game-message:not(.msg-action):not(:has(> .voz2-texto))': { T3: 10, T6: 18.2 },
  '.game-table-screen .game-message:not(.msg-action):has(> .voz2-texto)': { T3: 11, T6: 19.5 },
  '.game-table-screen .comodin-note': { T1: 9, T6: 14.3 },
})

// Lo que no subió (ficha §0), con su cifra de hoy: bajar de ella también es rojo, y es lo
// único que puede quedar por debajo de 9 px.
export const LEC_EXCEPCIONES = Object.freeze({
  '.game-table-screen .pot-label': { T1: 10, T2: 10, T3: 8 },
  '.game-table-screen .comodin-note': { T3: 8 },
  ':is(.lobby, .sal) .lob-pastilla:not(.tie-pronto)': { T1: 9.6, T2: 10.3, T3: 9.6 },
  '.tie-estante .tie-pronto': { T1: 9.3, T2: 10.1, T3: 9.3 },
  '.vid-pastilla': { T1: 9.5, T2: 10.3, T3: 9.5 },
  '.vid-quedan': { T1: 9.7, T2: 10.5, T3: 9.7 },
  '.sal-esp-n': { T1: 9.7, T2: 10.5, T3: 9.7 },
  '.sal-aviso': { T1: 10.4, T2: 11.3, T3: 10.4 },
  '.sal-accion small': { T1: 10.4, T2: 11.3, T3: 10.4 },
  '.sal-esp-consejo': { T1: 10.8, T2: 11.7, T3: 10.8 },
  '.sal-esp-estado': { T1: 10.4, T2: 11.3, T3: 10.4 },
  '.sal-esp-eti': { T1: 10.4, T2: 11.3, T3: 10.4 },
  '.sal-esp-sub': { T1: 10.4, T2: 11.3, T3: 10.4 },
  '.rnk-premium > .rnk-familia': { T1: 11.2, T2: 12.1, T3: 11.2 },
  '.game-table-screen .player-bar .pbr-name': { T1: 11, T2: 11, T3: 11 },
  '.game-table-screen .opp-header .seat-badge': { T1: 10, T2: 10, T3: 10 },
  '.game-table-screen .btn:not(.action-area .btn):not(.btn-leave)': { T1: 12, T2: 12, T3: 12 },
  '.sal-chip:not(.tie-estante)': { T1: 13, T2: 14, T3: 13 },
  ':is(.lobby, .sal) .lob-fila': { T1: 12.2, T2: 13.3, T3: 12.2 },
})

// Las pantallas del mapa. `previas` solo en el teléfono; la mesa también en T6.
const SAL = ['opciones-3', 'opciones-llena', 'opciones-vacio', 'armar', 'espera-anfitrion', 'espera-nombres', 'espera-llena']
const MESA = [['turno-propio', 2], ['turno-propio', 3], ['turno-propio', 5], ['turno-ajeno', 5], ['descarte-propio', 3], ['descarte-propio', 5], ['revelacion', 3], ['revelacion', 5]]

// ── En la página ────────────────────────────────────────────────────────────
const LEE = ({ pisos, excepciones, global }) => {
  const st = document.createElement('style')
  st.textContent = '*,*::before,*::after{animation-play-state:paused!important;transition:none!important}'
  document.head.appendChild(st)
  const visible = (e) => {
    const r = e.getBoundingClientRect()
    if (r.width <= 2 || r.height <= 2) return false
    const c = getComputedStyle(e)
    if (c.visibility !== 'visible' || c.display === 'none') return false
    for (let x = e; x; x = x.parentElement) if (parseFloat(getComputedStyle(x).opacity) < 0.02) return false
    return true
  }
  const letra = (e) => parseFloat(getComputedStyle(e).fontSize) * (e.currentCSSZoom ?? 1)
  const minimo = (q) => {
    const v = [...document.querySelectorAll(q)].filter((e) => e.textContent.trim() && visible(e)).map(letra)
    return v.length ? +Math.min(...v).toFixed(2) : null
  }
  const out = { pisos: {}, excepciones: {}, bajo: [] }
  for (const q of pisos) out.pisos[q] = minimo(q)
  for (const q of excepciones) out.excepciones[q] = minimo(q)
  const tw = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
  const rng = document.createRange()
  for (let n; (n = tw.nextNode());) {
    const t = n.nodeValue.trim(); const e = n.parentElement
    if (!t || !e || e.closest('script,style,noscript')) continue
    rng.selectNodeContents(n); const b = rng.getBoundingClientRect()
    if (b.width <= 1 || b.height <= 1 || !visible(e)) continue
    const f = letra(e)
    if (f < global - 0.01 && !excepciones.some((q) => e.closest(q))) out.bajo.push({ t: t.slice(0, 30), clase: String(e.className || e.tagName).slice(0, 40), px: +f.toFixed(2) })
  }
  st.remove()
  return out
}

async function pantallas(page, base, tam, inyecta, alPaso) {
  const quieto = (ms) => page.waitForTimeout(ms)
  const ir = async (url, espera) => { await page.goto(url, { waitUntil: 'networkidle' }); if (espera) await page.waitForSelector(espera, { timeout: 15000 }); if (inyecta) await page.addStyleTag({ content: inyecta }); await page.mouse.move(2, 2) }
  const toca = (q) => page.evaluate((s) => { const b = document.querySelector(s); if (b && !b.disabled) { b.click(); return true } return false }, q)
  if (tam !== 'T6') {
    await ir(`${base}/`, 'main.lobby [data-accion="jugar-ia"]'); await quieto(700); await alPaso('lobby')
    if (await toca('[data-accion="ajustes"]')) { await quieto(700); await alPaso('⚙') }
    for (const [acc, nom] of [['tienda', 'tienda'], ['rankings', 'rankings'], ['jugar-ia', 'retar']]) {
      await ir(`${base}/`, 'main.lobby'); await toca(`[data-accion="${acc}"]`); await quieto(1500)
      if (inyecta) await page.addStyleTag({ content: inyecta })
      await alPaso(nom)
      const pest = nom === 'retar' ? 0 : await page.evaluate(() => document.querySelectorAll('[role=tab]').length)
      for (let i = 1; i < Math.min(pest, 4); i++) { await page.evaluate((k) => document.querySelectorAll('[role=tab]')[k]?.click(), i); await quieto(400); await alPaso(`${nom} ${i}`) }
    }
    for (const e of SAL) { await ir(`${base}/?sal=${e}`, '.sal'); await quieto(900); await alPaso(`sal ${e}`) }
  }
  for (const [e, n] of MESA) { await ir(`${base}/?pvp=${e}&n=${n}`, '[data-clavada]'); await quieto(800); await alPaso(`mesa ${n} ${e}`) }
}

export async function runLec(browser, { base }) {
  const t0 = Date.now()
  const arg = process.argv.find((a) => a.startsWith('--lec-css='))
  const inyecta = arg ? readFileSync(arg.slice('--lec-css='.length), 'utf8') : null
  const pisos = Object.keys(LEC_PISOS), excepciones = Object.keys(LEC_EXCEPCIONES)
  const fallos = [], sinMedir = [], bajo = [], medidas = {}
  escalaReal(true)
  try {
    await Promise.all(Object.entries(T).map(async ([tam, vp]) => {
      const ctx = await browser.newContext({ viewport: { width: vp.w, height: vp.h }, ...(vp.movil ? { hasTouch: true, isMobile: true } : {}), deviceScaleFactor: 1 })
      const page = await ctx.newPage()
      const vistos = (medidas[tam] = { pisos: {}, excepciones: {} })
      try {
        await pantallas(page, base, tam, inyecta, async (nom) => {
          const r = await page.evaluate(LEE, { pisos, excepciones, global: PISO_GLOBAL_LEC })
          for (const [tipo, tabla] of [['pisos', LEC_PISOS], ['excepciones', LEC_EXCEPCIONES]]) {
            for (const [q, v] of Object.entries(r[tipo])) {
              if (v == null || tabla[q][tam] == null) continue
              const m = vistos[tipo][q]
              if (!m || v < m.px) vistos[tipo][q] = { px: v, en: nom }
            }
          }
          for (const b of r.bajo) bajo.push({ tam, en: nom, ...b })
        })
      } catch (e) {
        fallos.push(`${tam}: el recorrido se cortó: ${String(e?.message || e).split('\n')[0].slice(0, 140)}`)
      } finally { await ctx.close() }
    }))
  } finally { escalaReal(false) }
  for (const [tipo, tabla] of [['pisos', LEC_PISOS], ['excepciones', LEC_EXCEPCIONES]]) {
    for (const [q, porTam] of Object.entries(tabla)) {
      for (const [tam, piso] of Object.entries(porTam)) {
        const m = medidas[tam]?.[tipo][q]
        if (!m) { if (tipo === 'pisos') sinMedir.push(`${tam} ${q}`); continue }
        if (m.px < piso - TOLERANCIA_LEC) fallos.push(`${tam} ${q}: ${m.px} px en «${m.en}», ${tipo === 'pisos' ? 'piso' : 'excepción'} ${piso}`)
      }
    }
  }
  const verde = !fallos.length && !sinMedir.length && !bajo.length
  const ms = Date.now() - t0
  console.log(`  lec.mapa · ${verde ? 'VERDE' : 'ROJO'} · ${pisos.length} pisos, ${excepciones.length} excepciones, 4 tamaños · ${(ms / 1000).toFixed(0)} s${inyecta ? ' · con hoja inyectada' : ''}`)
  for (const f of fallos) console.log(`    ✗ ${f}`)
  for (const s of sinMedir) console.log(`    ✗ sin medir: ${s}`)
  for (const b of bajo.slice(0, 12)) console.log(`    ✗ bajo ${PISO_GLOBAL_LEC} px: ${b.tam} «${b.t}» (${b.clase}) ${b.px} en «${b.en}»`)
  return { verde, ms, fallos, sinMedir, bajo, medidas }
}
