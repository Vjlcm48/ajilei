import { chromium } from 'playwright-core'
const browser = await chromium.launch({ channel: 'msedge', headless: true })
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } })
const clickIf = async (s) => { const b = page.locator(s).first(); if (await b.count() && await b.isVisible().catch(()=>false)) { await b.click().catch(()=>{}); return true } return false }
await page.goto('http://localhost:5173')
await page.click('button:has-text("Jugar vs IA")')
await page.click('button:has-text("Mesa de 5 jugadores")')
await page.click('.stake-btn')
await page.waitForSelector('.game-table')
await clickIf('button:has-text("Iniciar mano")')
let reached = false
for (let i = 0; i < 160 && !reached; i++) {
  await page.waitForTimeout(400)
  await clickIf('.action-buttons button:has-text("Pasar")') ||
    await clickIf('.action-buttons button:has-text("Igualar")') ||
    await clickIf('.action-buttons button:has-text("Apostar")')
  await clickIf('button:has-text("Sin descartar")')
  reached = await page.locator('button:has-text("Siguiente mano")').isVisible().catch(()=>false)
}
console.log('llegó a payout:', reached)
await clickIf('button:has-text("Siguiente mano")')
let captured = null
for (let i = 0; i < 80 && !captured; i++) {
  await page.waitForTimeout(50)
  const snap = await page.evaluate(() => ({
    shuffling: !!document.querySelector('.shuffle-fan-card'),
    status: [...document.querySelectorAll('.opp-status')].map(e => e.textContent.trim()),
    scoreVis: [...document.querySelectorAll('.opp-score')].map(e => e.style.visibility),
  }))
  if (snap.shuffling) captured = snap
}
if (captured) {
  console.log('DURANTE barajado -> status:', JSON.stringify(captured.status), '| score vis:', captured.scoreVis)
  console.log('-> rótulos limpios:', captured.status.every(s => s === '') && captured.scoreVis.every(v => v === 'hidden'))
} else console.log('no se capturó barajado')
await browser.close()
