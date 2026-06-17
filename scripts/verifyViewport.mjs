// Verificación Tanda C3.2: la mesa cabe sin scroll vertical a 1920x1080
// en mesas de 2, 3, 4 y 5 jugadores. Uso: node scripts/verifyViewport.mjs
import { chromium } from 'playwright-core'
import { mkdirSync } from 'node:fs'

const URL = 'http://localhost:5173'
const OUT = 'scripts/screenshots'
mkdirSync(OUT, { recursive: true })

const browser = await chromium.launch({ channel: 'msedge', headless: true })
const results = []

for (const n of [2, 3, 4, 5]) {
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } })
  await page.goto(URL)
  await page.click('button:has-text("Jugar vs IA")')
  await page.click(`button:has-text("Mesa de ${n} jugadores")`)
  await page.click('.stake-btn')
  await page.waitForSelector('.game-table')

  async function measure(label) {
    const m = await page.evaluate(() => {
      const screen = document.querySelector('.game-table-screen')
      return {
        bodyScroll: document.documentElement.scrollHeight,
        winH: window.innerHeight,
        screenScroll: screen.scrollHeight,
        screenClient: screen.clientHeight,
      }
    })
    const noScroll = m.bodyScroll <= m.winH && m.screenScroll <= m.screenClient
    results.push({ mesa: n, momento: label, ...m, sinScroll: noScroll })
    await page.screenshot({ path: `${OUT}/mesa${n}-${label}.png` })
  }

  await measure('inicial')

  // Iniciar mano y dejar correr reparto/apuestas para medir en juego real
  await page.click('button:has-text("Iniciar mano")')
  await page.waitForSelector('.timer-display', { timeout: 30000 })
  await measure('turno-apuesta')

  const errors = []
  page.on('pageerror', e => errors.push(String(e)))
  if (errors.length) results.push({ mesa: n, errores: errors })
  await page.close()
}

await browser.close()
console.table(results)
const fails = results.filter(r => r.sinScroll === false)
console.log(fails.length ? `FALLO: ${fails.length} medidas con scroll` : 'OK: sin scroll en todas las mesas')
process.exit(fails.length ? 1 : 0)
