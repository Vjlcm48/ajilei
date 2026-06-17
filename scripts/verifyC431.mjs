// Verificación Tanda C4.3.1: rótulo IA al doble + reseteo fiable en mano nueva.
import { chromium } from 'playwright-core'
const browser = await chromium.launch({ channel: 'msedge', headless: true })

const clickIf = async (page, s) => {
  const b = page.locator(s).first()
  if (await b.count() && await b.isVisible().catch(() => false)) { await b.click().catch(() => {}); return true }
  return false
}

async function run(n) {
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } })
  await page.goto('http://localhost:5173')
  await page.click('button:has-text("Jugar vs IA")')
  await page.click('button:has-text("Mesa de ' + n + ' jugadores")')
  await page.click('.stake-btn')
  await page.waitForSelector('.game-table')

  const statusFont = n >= 3
    ? await page.evaluate(() => { const e = document.querySelector('.opp-status'); return e ? getComputedStyle(e).fontSize : null })
    : null

  // Jugar hasta que aparezca "Siguiente mano" (tiempo amplio para 4-5 jugadores)
  await clickIf(page, 'button:has-text("Iniciar mano")')
  let reached = false
  for (let i = 0; i < 80 && !reached; i++) {
    await page.waitForTimeout(500)
    await clickIf(page, '.action-buttons button:has-text("Igualar")') || await clickIf(page, '.action-buttons button:has-text("Pasar")')
    await clickIf(page, 'button:has-text("Sin descartar")')
    reached = await page.locator('button:has-text("Siguiente mano")').isVisible().catch(() => false)
  }

  // Texto en payout
  const atPayout = await page.evaluate(() => ({
    status: [...document.querySelectorAll('.opp-status')].map(e => e.textContent.trim()).filter(Boolean),
    aiScore: [...document.querySelectorAll('.ai-zone .score-tag')].map(e => e.style.visibility),
  }))

  // Siguiente mano → esperar al barajado (shuffle-fan-card) y muestrear ahí
  await clickIf(page, 'button:has-text("Siguiente mano")')
  let sawShuffle = false
  let duringShuffle = null
  for (let i = 0; i < 60 && !sawShuffle; i++) {
    await page.waitForTimeout(50)
    const snap = await page.evaluate(() => ({
      shuffling: !!document.querySelector('.shuffle-fan-card'),
      status: [...document.querySelectorAll('.opp-status')].map(e => e.textContent.trim()),
      scoreVis: [...document.querySelectorAll('.opp-score')].map(e => e.style.visibility),
      aiScoreVis: [...document.querySelectorAll('.ai-zone .score-tag')].map(e => e.style.visibility),
    }))
    if (snap.shuffling) { sawShuffle = true; duringShuffle = snap }
  }

  await page.close()
  return { n, statusFont, reached, atPayout, sawShuffle, duringShuffle }
}

for (const n of [2, 3, 4, 5]) {
  const r = await run(n)
  console.log('\n=== Mesa ' + r.n + ' ===  (llegó a payout: ' + r.reached + ')')
  if (r.n >= 3) console.log('  .opp-status font-size:', r.statusFont, '(esperado 22px)')
  console.log('  payout status:', r.atPayout.status, '| ai score-tag vis:', r.atPayout.aiScore)
  if (r.sawShuffle) {
    const d = r.duringShuffle
    const statusLimpio = d.status.every(s => s === '')
    const scoreLimpio = d.scoreVis.every(v => v === 'hidden') && d.aiScoreVis.every(v => v === 'hidden')
    console.log('  DURANTE barajado -> status:', JSON.stringify(d.status), '| score vis:', d.scoreVis, d.aiScoreVis)
    console.log('  -> rótulos limpios:', statusLimpio && scoreLimpio)
  } else {
    console.log('  (no se capturó el frame de barajado)')
  }
}
await browser.close()
