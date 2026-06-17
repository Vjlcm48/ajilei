// Verificación C4.4 en vivo: mesa de 5 a stake alto (ante=500) → fuerza
// bancarrotas; observa el encogimiento del tablero (paneles), el chip de
// comodín y, eventualmente, el GAME_OVER.
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
// elegir la sala más cara (stake = ante)
await page.click('.stake-btn:last-child')
await page.waitForSelector('.game-table')

const clickIf = async (s) => { const b = page.locator(s).first(); if (await b.count() && await b.isVisible().catch(()=>false)) { await b.click().catch(()=>{}); return true } return false }
const snap = () => page.evaluate(() => ({
  panels: document.querySelectorAll('.opp-panel').length,
  legacy: !!document.querySelector('.ai-zone'),
  comodin: document.querySelector('.comodin-note')?.textContent?.trim() ?? null,
  phase: document.querySelector('.table-badge')?.textContent?.trim() ?? null,
  msg: document.querySelector('.game-message')?.textContent?.trim() ?? null,
}))

const seen = { sizes: new Set(), comodin: new Set() }
let shotShrink = false, gameOver = false
for (let i = 0; i < 2000 && !gameOver; i++) {
  await page.waitForTimeout(200)
  await clickIf('button:has-text("Iniciar mano")')
  await clickIf('button:has-text("Siguiente mano")')
  await clickIf('.action-buttons button:has-text("Pasar")') ||
    await clickIf('.action-buttons button:has-text("Igualar")')
  await clickIf('button:has-text("Sin descartar")')
  const s = await snap()
  const aliveN = s.legacy ? 2 : s.panels + 1
  seen.sizes.add(aliveN)
  if (s.comodin) seen.comodin.add(s.comodin)
  // captura el primer encogimiento (de 5 a <5)
  if (!shotShrink && aliveN < 5 && aliveN >= 2) {
    await page.screenshot({ path: OUT + '/c44-shrunk-' + aliveN + '.png' })
    console.log('ENCOGIÓ a', aliveN, '· comodín:', s.comodin, '· msg:', s.msg)
    shotShrink = true
  }
  if (s.phase === 'Fin de mesa' || /Ganaste la mesa|gana la mesa|sin fichas/.test(s.msg ?? '')) {
    gameOver = true
    await page.screenshot({ path: OUT + '/c44-gameover.png' })
    console.log('GAME_OVER ·', s.msg)
  }
}
console.log('tamaños vistos (aliveN):', [...seen.sizes].sort())
console.log('notas de comodín vistas:', [...seen.comodin])
console.log('errores:', errors.length ? errors : 'ninguno')
await browser.close()
