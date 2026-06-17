import { chromium } from 'playwright-core'
const browser = await chromium.launch({ channel: 'msedge', headless: true })
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } })
const clickIf = async (s) => { const b = page.locator(s).first(); if (await b.count() && await b.isVisible().catch(()=>false)) { await b.click().catch(()=>{}); return true } return false }
await page.goto('http://localhost:5173')
await page.click('button:has-text("Jugar vs IA")')
await page.click('button:has-text("Mesa de 4 jugadores")')
await page.click('.stake-btn')
await page.waitForSelector('.game-table')
await clickIf('button:has-text("Iniciar mano")')
let done = false
for (let i = 0; i < 30 && !done; i++) {
  await page.waitForTimeout(500)
  const hasAction = await page.evaluate(() => [...document.querySelectorAll('.opp-status')].some(e => /Apost|Igual|Pas|Sub|retir/.test(e.textContent)))
  if (hasAction) { await page.locator('.rivals-zone').screenshot({ path: 'scripts/screenshots/c431-status.png' }); done = true; break }
  await clickIf('.action-buttons button:has-text("Pasar")') || await clickIf('.action-buttons button:has-text("Igualar")')
}
console.log('capturado:', done)
await browser.close()
