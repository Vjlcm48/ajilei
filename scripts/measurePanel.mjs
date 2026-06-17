// Mide el recuadro de IA y sus rótulos para planificar el doblado sin cambiar altura.
import { chromium } from 'playwright-core'
const browser = await chromium.launch({ channel: 'msedge', headless: true })
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } })
await page.goto('http://localhost:5173')
await page.click('button:has-text("Jugar vs IA")')
await page.click('button:has-text("Mesa de 4 jugadores")')
await page.click('.stake-btn')
await page.waitForSelector('.opp-panel')

function measure() {
  return page.evaluate(() => {
    const p = document.querySelector('.opp-panel')
    const q = s => { const el = p.querySelector(s); if (!el) return null
      const cs = getComputedStyle(el); return { h: el.offsetHeight, font: cs.fontSize, lineH: cs.lineHeight } }
    return {
      panelH: p.offsetHeight,
      panelMinH: getComputedStyle(p).minHeight,
      status: q('.opp-status'),
      score: q('.opp-score'),
      cards: q('.opp-cards'),
      header: q('.opp-header'),
      chips: q('.opp-chips'),
    }
  })
}
console.log('ANTES (WAITING):', JSON.stringify(await measure(), null, 1))
// jugar hasta payout para ver el score visible
const clickIf = async (s) => { const b = page.locator(s).first(); if (await b.count() && await b.isVisible().catch(()=>false)) { await b.click().catch(()=>{}); return true } return false }
await clickIf('button:has-text("Iniciar mano")')
for (let i = 0; i < 30; i++) {
  await page.waitForTimeout(700)
  await clickIf('.action-buttons button:has-text("Igualar")') || await clickIf('.action-buttons button:has-text("Pasar")')
  await clickIf('button:has-text("Sin descartar")')
  if (await page.locator('button:has-text("Siguiente mano")').isVisible().catch(()=>false)) break
}
console.log('EN PAYOUT (score visible):', JSON.stringify(await measure(), null, 1))
await browser.close()
