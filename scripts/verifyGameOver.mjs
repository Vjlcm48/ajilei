// Verifica la vista terminal (GAME_OVER) en vivo: mesa de 2 a stake máximo →
// alguien quiebra → "queda 1 vivo" → .game-over-screen con mensaje + salir.
import { chromium } from 'playwright-core'
import { mkdirSync } from 'node:fs'
const OUT = 'scripts/screenshots'; mkdirSync(OUT, { recursive: true })
const browser = await chromium.launch({ channel: 'msedge', headless: true })
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } })
const errors = []
page.on('pageerror', e => errors.push(String(e)))
await page.goto('http://localhost:5173')
await page.click('button:has-text("Jugar vs IA")')
await page.click('button:has-text("Mesa de 2 jugadores")')
await page.click('.stake-btn:last-child')   // sala más cara (ante alto)
await page.waitForSelector('.game-table')
const clickIf = async (s) => { const b = page.locator(s).first(); if (await b.count() && await b.isVisible().catch(()=>false)) { await b.click().catch(()=>{}); return true } return false }

let over = false
for (let i = 0; i < 1500 && !over; i++) {
  await page.waitForTimeout(200)
  await clickIf('button:has-text("Iniciar mano")')
  await clickIf('button:has-text("Siguiente mano")')
  await clickIf('.action-buttons button:has-text("Pasar")') ||
    await clickIf('.action-buttons button:has-text("Igualar")')
  await clickIf('button:has-text("Sin descartar")')
  over = await page.locator('.game-over-screen').count() > 0
}
if (over) {
  const msg = await page.evaluate(() => document.querySelector('.game-over-msg')?.textContent?.trim())
  const hasLeave = await page.locator('.game-over-screen button:has-text("Salir de la mesa")').count() > 0
  await page.screenshot({ path: OUT + '/c44-gameover.png' })
  console.log('GAME_OVER terminal · msg:', msg, '· botón salir:', hasLeave)
} else {
  console.log('no se alcanzó GAME_OVER en el presupuesto')
}
console.log('errores:', errors.length ? errors : 'ninguno')
await browser.close()
