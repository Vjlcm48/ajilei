import { chromium } from 'playwright-core'
const browser = await chromium.launch({ channel: 'msedge', headless: true })
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } })
await page.goto('http://localhost:5173')
await page.click('button:has-text("Jugar vs IA")')
await page.click('button:has-text("Mesa de 4 jugadores")')
await page.click('.stake-btn')
await page.waitForSelector('.game-table')
const clickIf = async (s) => { const b = page.locator(s).first(); if (await b.count() && await b.isVisible().catch(()=>false)) { await b.click().catch(()=>{}); return true } return false }
let done = false
for (let h = 0; h < 4 && !done; h++) {
  if (!(await clickIf('button:has-text("Iniciar mano")'))) await clickIf('button:has-text("Siguiente mano")')
  for (let i = 0; i < 30 && !done; i++) {
    // captura en cuanto exista el +N flotante
    if (await page.locator('.pot-float').count()) {
      await page.locator('.center-zone').screenshot({ path: 'scripts/screenshots/c43-float.png' })
      done = true; break
    }
    await page.waitForTimeout(120)
    await clickIf('.action-buttons button:has-text("Igualar")') || await clickIf('.action-buttons button:has-text("Pasar")')
    await clickIf('button:has-text("Sin descartar")')
    if (await page.locator('button:has-text("Siguiente mano")').isVisible().catch(()=>false)) break
  }
}
console.log('capturado:', done)
await browser.close()
