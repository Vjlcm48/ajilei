// Verificación C4.5 · Caso A (variante humano AGRESIVO). El humano sube al tope
// cada ronda: presiona a las IAs a pagar o retirarse. Cuando se retiran, el
// humano gana el bote (sobrevive); las IAs que pagan y pierden quiebran rápido
// → sesgo fuerte hacia "una IA quiebra primero", disparando la ceremonia.
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
await page.click('.stake-btn:last-child')
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
  betOpen:     !!document.querySelector('.action-buttons'),
  discardOpen: !!document.querySelector('.discard-area'),
}))

const saw = { eliminating:false, notice:null, settle:false, flash:false, bankrupt:false }
const sizes = new Set(), comodines = new Set()
let done = false
for (let i = 0; i < 6000 && !done; i++) {
  await page.waitForTimeout(80)
  await clickIf('button:has-text("Iniciar mano")')
  await clickIf('button:has-text("Siguiente mano")')
  const s0 = await probe()
  if (s0.betOpen) {
    await clickIf('.mult-row .btn-mult:last-child')              // ×10 (tope de ronda)
    const raised = await clickIf('.action-buttons button:has-text("Subir")')
    if (!raised) {
      const bet = await clickIf('.action-buttons button:has-text("Apostar")')
      if (!bet) await clickIf('.action-buttons button:has-text("Igualar")') ||
                await clickIf('.action-buttons button:has-text("Pasar")')
    }
  }
  if (s0.discardOpen) {
    for (let k = 2; k <= 4; k++) await clickIf(`.player-zone .cards-row .card-slot-wrapper:nth-of-type(${k}) .playing-card`)
    await clickIf('.discard-area button')
  }
  const s = await probe()
  if (s.comodin) comodines.add(s.comodin)
  sizes.add(s.panels + 1)
  if (s.eliminating && !saw.eliminating) { saw.eliminating = true; await page.screenshot({ path: OUT + '/c45-eliminating.png' }); console.log('SALIDA DIGNA · paneles restantes:', s.panels) }
  if (s.notice && !saw.notice)           { saw.notice = s.notice; await page.screenshot({ path: OUT + '/c45-notice.png' }); console.log('AVISO CENTRAL ·', s.notice) }
  if (s.settle && !saw.settle)           { saw.settle = true; console.log('ASENTADO SUAVE') }
  if (s.flash && !saw.flash)             { saw.flash = true; await page.screenshot({ path: OUT + '/c45-flash.png' }); console.log('DESTELLO COMODÍN · comodín:', s.comodin) }
  if (s.bankrupt && !saw.bankrupt)       { saw.bankrupt = true; console.log('(modal humano — fin de sesión)'); done = true }
  if (s.gameover) { console.log('GAME_OVER terminal'); done = true }
  if (saw.eliminating && saw.notice && saw.flash) { console.log('CEREMONIA observada (salida + aviso + destello)'); done = true }
}

console.log('—')
console.log('tamaños vistos (aliveN):', [...sizes].sort())
console.log('notas de comodín vistas:', [...comodines])
console.log('vistos:', saw)
console.log('errores de página:', errors.length ? errors : 'ninguno')
await browser.close()
