// Verificación C4.5.2 · aviso de eliminación horizontal en banda inferior.
// Humano que se retira siempre (pista fija de manos) a stake 500 → varias IAs
// quiebran (5→4, 4→3, 3→2). En cada reducción mide el bounding-box del aviso y
// comprueba: (a) horizontal en una sola línea; (b) CERO solapamiento con pozo,
// chip de comodín, paneles y sub-área/cartas del jugador.
import { chromium } from 'playwright-core'
import { mkdirSync } from 'node:fs'
const OUT = 'scripts/screenshots'; mkdirSync(OUT, { recursive: true })
const browser = await chromium.launch({ channel: 'msedge', headless: true })
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } })
const errors = []
page.on('pageerror', e => errors.push(String(e)))
await page.goto('http://localhost:5173')
await page.click('button:has-text("Jugar vs IA")')
await page.click('button:has-text("Mesa de 5 jugadores")')
await page.click('.stake-grid .stake-btn:last-child')   // 500 (quiebra rápida)
await page.waitForSelector('.game-table')

const clickIf = async (s) => { const b = page.locator(s).first(); if (await b.count() && await b.isVisible().catch(()=>false)) { await b.click().catch(()=>{}); return true } return false }
const probe = () => page.evaluate(() => {
  const n = document.querySelector('.elim-notice')
  const base = {
    panels:   document.querySelectorAll('.opp-panel').length,
    bankrupt: !!document.querySelector('.bankrupt-overlay'),
    gameover: !!document.querySelector('.game-over-screen'),
    notice:   null,
  }
  if (!n) return base
  const r = n.getBoundingClientRect()
  const rectOf = sel => { const e = document.querySelector(sel); return e ? e.getBoundingClientRect() : null }
  const ov = (a, b) => !!a && !!b && !(a.right <= b.left || a.left >= b.right || a.bottom <= b.top || a.top >= b.bottom)
  const panelRects = [...document.querySelectorAll('.opp-panel')].map(e => e.getBoundingClientRect())
  return {
    ...base,
    notice: n.textContent.trim(),
    horizontal: r.width > r.height,
    singleLine: r.height < 50,
    w: Math.round(r.width), h: Math.round(r.height),
    overlap: {
      pozo:    ov(r, rectOf('.pot-box')),
      comodin: ov(r, rectOf('.comodin-note')),
      jugador: ov(r, rectOf('.player-zone')),
      paneles: panelRects.some(pr => ov(r, pr)),
    },
  }
})

const checked = new Map()   // texto del aviso → resultado (una vez por reducción)
let done = false, lastText = null
for (let i = 0; i < 4500 && !done; i++) {
  await page.waitForTimeout(80)
  await clickIf('button:has-text("Iniciar mano")')
  await clickIf('button:has-text("Siguiente mano")')
  await clickIf('.action-buttons button:has-text("Retirarse")')
  await clickIf('.action-buttons button:has-text("Pasar")')
  await clickIf('button:has-text("Sin descartar")')
  const s = await probe()
  if (s.notice && s.notice !== lastText && !checked.has(s.notice)) {
    lastText = s.notice
    const aliveN = s.panels + 1
    checked.set(s.notice, s)
    await page.screenshot({ path: `${OUT}/c45-band-${aliveN}.png` })
    const anyOverlap = Object.values(s.overlap).some(Boolean)
    console.log(`REDUCCIÓN → mesa ${aliveN} · "${s.notice}"`)
    console.log(`   horizontal:${s.horizontal} unaLinea:${s.singleLine} (${s.w}×${s.h}px) · solapamiento:`, JSON.stringify(s.overlap), anyOverlap ? '❌' : '✓ limpio')
  }
  if (s.bankrupt) { console.log('(modal humano — fin de sesión)'); done = true }
  if (s.gameover) { console.log('GAME_OVER terminal'); done = true }
}

console.log('—')
console.log('reducciones verificadas:', checked.size)
console.log('errores de página:', errors.length ? errors : 'ninguno')
await browser.close()
