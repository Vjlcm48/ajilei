// Verificación C4.4 (app): los 4 tamaños renderizan tras el refactor de layout;
// chip de comodín correcto; sin errores de consola. (La reducción real por
// bancarrota y los terminales están cubiertos por los tests unitarios del motor.)
import { chromium } from 'playwright-core'
import { mkdirSync } from 'node:fs'
const OUT = 'scripts/screenshots'; mkdirSync(OUT, { recursive: true })
const browser = await chromium.launch({ channel: 'msedge', headless: true })

for (const n of [2, 3, 4, 5]) {
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } })
  const errors = []
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()) })
  page.on('pageerror', e => errors.push(String(e)))
  await page.goto('http://localhost:5173')
  await page.click('button:has-text("Jugar vs IA")')
  await page.click('button:has-text("Mesa de ' + n + ' jugadores")')
  await page.click('.stake-btn')
  await page.waitForSelector('.game-table')
  await page.click('button:has-text("Iniciar mano")')
  await page.waitForTimeout(4000)   // barajar + repartir
  const info = await page.evaluate(() => ({
    panels: document.querySelectorAll('.opp-panel').length,
    legacy: !!document.querySelector('.ai-zone'),
    comodin: document.querySelector('.comodin-note')?.textContent?.trim() ?? '(sin nota)',
    tableWide: document.querySelector('.game-table')?.className.includes('table-wide'),
  }))
  await page.screenshot({ path: OUT + '/c44-mesa' + n + '.png' })
  console.log('Mesa ' + n + ':', JSON.stringify(info), '| errores:', errors.length ? errors : 'ninguno')
  await page.close()
}
await browser.close()
