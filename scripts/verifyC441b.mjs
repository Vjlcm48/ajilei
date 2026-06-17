// Punto 1 (caso IA): mesa de 5, el humano sube para inducir folds de IA.
// Invariante: ninguna IA debe aparecer "está pensando…" mientras su panel
// muestra "Se retiró" (eso sería el turno fantasma del bug).
import { chromium } from 'playwright-core'
const browser = await chromium.launch({ channel: 'msedge', headless: true })
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } })
const errors = []
page.on('pageerror', e => errors.push(String(e)))
await page.goto('http://localhost:5173')
await page.click('button:has-text("Jugar vs IA")')
await page.click('button:has-text("Mesa de 5 jugadores")')
await page.click('.stake-btn')
await page.waitForSelector('.game-table')
const clickIf = async (s) => { const b = page.locator(s).first(); if (await b.count() && await b.isVisible().catch(()=>false)) { await b.click().catch(()=>{}); return true } return false }

let foldsSeen = 0, violations = 0, hands = 0
for (let i = 0; i < 700; i++) {
  await page.waitForTimeout(150)
  if (await clickIf('button:has-text("Iniciar mano")')) hands++
  if (await clickIf('button:has-text("Siguiente mano")')) hands++
  // humano sube si puede, para forzar folds; si no, iguala/pasa
  await clickIf('.action-buttons button:has-text("Subir")') ||
    await clickIf('.action-buttons button:has-text("Apostar")') ||
    await clickIf('.action-buttons button:has-text("Igualar")') ||
    await clickIf('.action-buttons button:has-text("Pasar")')
  await clickIf('button:has-text("Sin descartar")')

  // invariante: nombre en "X está pensando…" no debe tener panel con "Se retiró"
  const check = await page.evaluate(() => {
    const think = document.querySelector('.action-area.thinking')?.textContent ?? ''
    const m = think.match(/^(.*?) está pensando/)
    const folded = [...document.querySelectorAll('.opp-panel')]
      .filter(p => /Se retiró/.test(p.querySelector('.opp-status')?.textContent ?? ''))
      .map(p => p.querySelector('.opp-name')?.textContent?.trim())
    const retiradosTotal = document.querySelectorAll('.opp-status')
    let foldedCount = 0
    retiradosTotal.forEach(s => { if (/Se retiró/.test(s.textContent)) foldedCount++ })
    return { thinkingName: m ? m[1].trim() : null, foldedNames: folded, foldedCount }
  })
  if (check.foldedCount > 0) foldsSeen = Math.max(foldsSeen, check.foldedCount)
  if (check.thinkingName && check.foldedNames.includes(check.thinkingName)) {
    violations++
    console.log('VIOLACIÓN: "' + check.thinkingName + ' está pensando" pero su panel dice "Se retiró"')
  }
}
console.log('manos jugadas (aprox):', hands)
console.log('máx. IAs retiradas vistas a la vez:', foldsSeen)
console.log('violaciones (fantasma de pensar en IA retirada):', violations)
console.log('errores de consola:', errors.length ? errors : 'ninguno')
await browser.close()
