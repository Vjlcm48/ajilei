// Verificación C4.4.1:
//  A) Ante visible ANTES de barajar: durante el barajado los saldos ya están
//     descontados (4 mesas).
//  B) Una Mano humana que se retira en BET_1 no estanca la mano: se salta en
//     silencio y la mano llega a payout (prueba del salto de turno folded).
import { chromium } from 'playwright-core'
import { mkdirSync } from 'node:fs'
const OUT = 'scripts/screenshots'; mkdirSync(OUT, { recursive: true })
const browser = await chromium.launch({ channel: 'msedge', headless: true })
const clickIf = async (page, s) => { const b = page.locator(s).first(); if (await b.count() && await b.isVisible().catch(()=>false)) { await b.click().catch(()=>{}); return true } return false }
// Lee el número real del saldo (.bd-num), no el "-N" flotante de la animación
const chips = (page) => page.evaluate(() => {
  const el = document.querySelector('.player-bar-right .bd-num')
  return el ? Number(el.textContent.replace(/\D/g, '')) : null
})

// ── A) Ante antes de barajar ───────────────────────────────────────────────
console.log('== A) Cobro del ante visible antes de barajar ==')
for (const n of [2, 3, 4, 5]) {
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } })
  await page.goto('http://localhost:5173')
  await page.click('button:has-text("Jugar vs IA")')
  await page.click('button:has-text("Mesa de ' + n + ' jugadores")')
  await page.click('.stake-btn')                 // primera sala (stake = ante)
  await page.waitForSelector('.game-table')
  const stakeTxt = await page.evaluate(() => document.querySelector('.player-bar-right')?.textContent?.trim())
  const before = await chips(page)
  await page.click('button:has-text("Iniciar mano")')
  // esperar a que aparezca el barajado y leer saldo EN ese momento
  let duringShuffle = null
  for (let i = 0; i < 40; i++) {
    await page.waitForTimeout(80)
    if (await page.locator('.shuffle-fan-card').count()) { duringShuffle = await chips(page); break }
  }
  if (n === 5) await page.screenshot({ path: OUT + '/c441-ante-shuffle.png' })
  const unit = Number((stakeTxt.match(/Mesa\s+(\d+)/) ?? [])[1])
  console.log(`Mesa ${n}: saldo antes=${before}, durante barajado=${duringShuffle}, ante=${unit} → descontado antes de barajar: ${before - duringShuffle === unit}`)
  await page.close()
}

// ── B) Mano humana se retira en BET_1 → la mano no se estanca ───────────────
console.log('\n== B) Mano humana folded no estanca (mesa de 4) ==')
{
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } })
  const errors = []
  page.on('pageerror', e => errors.push(String(e)))
  await page.goto('http://localhost:5173')
  await page.click('button:has-text("Jugar vs IA")')
  await page.click('button:has-text("Mesa de 4 jugadores")')
  await page.click('.stake-btn')
  await page.waitForSelector('.game-table')
  await page.click('button:has-text("Iniciar mano")')
  // esperar el turno del humano (Mano en la 1ª mano) y retirarse
  let folded = false
  for (let i = 0; i < 60 && !folded; i++) {
    await page.waitForTimeout(300)
    if (await clickIf(page, '.action-buttons button:has-text("Retirarse")')) folded = true
  }
  console.log('humano se retiró en BET_1:', folded)
  // tras retirarse, la mano debe llegar a payout ("Siguiente mano") sin estancarse
  let reachedPayout = false
  let sawPhantom = false
  for (let i = 0; i < 90 && !reachedPayout; i++) {
    await page.waitForTimeout(400)
    const msg = await page.evaluate(() => document.querySelector('.action-area.thinking')?.textContent?.trim() ?? '')
    // un "Tú está pensando" para el asiento 0 (humano retirado) sería un fantasma
    if (/Tú está pensando/i.test(msg)) sawPhantom = true
    reachedPayout = await page.locator('button:has-text("Siguiente mano")').count() > 0
  }
  console.log('llegó a payout sin estancarse:', reachedPayout)
  console.log('fantasma de "pensando" para el humano retirado:', sawPhantom)
  console.log('errores de consola:', errors.length ? errors : 'ninguno')
  await page.close()
}
await browser.close()
