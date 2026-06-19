// Verificación C4.5 en vivo: mesa de 5 a stake máximo (ante alto) → fuerza
// bancarrotas de IA y observa la coreografía del encogimiento:
//   - salida digna del panel (.opp-eliminating + "Sin fichas")
//   - aviso central no bloqueante (.elim-notice)
//   - asentado suave (.reflow-settle)
//   - destello del chip de comodín (.comodin-note-flash)
// y, si el humano cae en bancarrota con ≥2 vivos, el modal bloqueante
// (.bankrupt-overlay). Reporta pageerrors. El motor no se toca.
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
await page.click('.stake-btn:last-child')   // sala más cara (ante = stake)
await page.waitForSelector('.game-table')

const clickIf = async (s) => { const b = page.locator(s).first(); if (await b.count() && await b.isVisible().catch(()=>false)) { await b.click().catch(()=>{}); return true } return false }
const probe = () => page.evaluate(() => ({
  eliminating: !!document.querySelector('.opp-eliminating'),
  notice:      document.querySelector('.elim-notice')?.textContent?.trim() ?? null,
  settle:      !!document.querySelector('.reflow-settle'),
  flash:       !!document.querySelector('.comodin-note-flash'),
  bankrupt:    !!document.querySelector('.bankrupt-overlay'),
  comodin:     document.querySelector('.comodin-note')?.textContent?.trim() ?? null,
  panels:      document.querySelectorAll('.opp-panel').length,
  gameover:    !!document.querySelector('.game-over-screen'),
  phase:       document.querySelector('.table-badge')?.textContent?.trim() ?? null,
}))

const saw = { eliminating:false, notice:null, settle:false, flash:false, bankrupt:false }
const sizes = new Set(), comodines = new Set()
let done = false
for (let i = 0; i < 4000 && !done; i++) {
  await page.waitForTimeout(120)
  await clickIf('button:has-text("Iniciar mano")')
  await clickIf('button:has-text("Siguiente mano")')
  await clickIf('.action-buttons button:has-text("Pasar")') ||
    await clickIf('.action-buttons button:has-text("Igualar")')
  await clickIf('button:has-text("Sin descartar")')
  const s = await probe()
  if (s.comodin) comodines.add(s.comodin)
  sizes.add(s.panels + 1)
  if (s.eliminating && !saw.eliminating) { saw.eliminating = true; await page.screenshot({ path: OUT + '/c45-eliminating.png' }); console.log('SALIDA DIGNA · paneles:', s.panels) }
  if (s.notice && !saw.notice)           { saw.notice = s.notice; await page.screenshot({ path: OUT + '/c45-notice.png' }); console.log('AVISO CENTRAL ·', s.notice) }
  if (s.settle && !saw.settle)           { saw.settle = true; console.log('ASENTADO SUAVE') }
  if (s.flash && !saw.flash)             { saw.flash = true; await page.screenshot({ path: OUT + '/c45-flash.png' }); console.log('DESTELLO COMODÍN · comodín:', s.comodin) }
  if (s.bankrupt && !saw.bankrupt)       { saw.bankrupt = true; await page.screenshot({ path: OUT + '/c45-bankrupt.png' }); console.log('MODAL BANCARROTA (humano)') ; done = true }
  if (s.gameover) { await page.screenshot({ path: OUT + '/c45-gameover.png' }); console.log('GAME_OVER terminal (regresión)'); done = true }
}

console.log('—')
console.log('tamaños vistos (aliveN):', [...sizes].sort())
console.log('notas de comodín vistas:', [...comodines])
console.log('vistos:', saw)
console.log('errores de página:', errors.length ? errors : 'ninguno')
await browser.close()
