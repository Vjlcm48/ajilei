// Verificación Tanda C4.3: efecto del mensaje de acción IA + pulso/"+N" del pozo.
// Comprueba que los efectos disparan y que NO hay layout shift ni cambio de bordes.
import { chromium } from 'playwright-core'
import { mkdirSync } from 'node:fs'
const OUT = 'scripts/screenshots'; mkdirSync(OUT, { recursive: true })
const browser = await chromium.launch({ channel: 'msedge', headless: true })

const INIT = `
  window.__obs = { msgAction:new Set(), msgFont:new Set(), potFloat:0, potFloatText:new Set(),
                   msgH:new Set(), potBoxH:new Set(), border:new Set() };
  const tick = () => {
    const gm = document.querySelector('.game-message');
    if (gm) {
      const cs = getComputedStyle(gm);
      window.__obs.msgH.add(gm.offsetHeight);                 // caja del mensaje: debe ser fija
      if (gm.className.includes('msg-action')) {
        window.__obs.msgAction.add(gm.className.replace('game-message','').trim());
        window.__obs.msgFont.add(cs.fontSize);
      }
    }
    const pf = document.querySelector('.pot-float');
    if (pf) { window.__obs.potFloat++; window.__obs.potFloatText.add(pf.textContent); }
    const pb = document.querySelector('.pot-box');
    if (pb) { window.__obs.potBoxH.add(pb.offsetHeight); window.__obs.border.add(getComputedStyle(pb).borderTopWidth); }
    const t = document.querySelector('.game-table');
    if (t) window.__obs.border.add(getComputedStyle(t).borderTopWidth);
  };
  setInterval(tick, 60);
`

async function runTable(n) {
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } })
  await page.addInitScript(INIT)
  await page.goto('http://localhost:5173')
  await page.click('button:has-text("Jugar vs IA")')
  await page.click('button:has-text("Mesa de ' + n + ' jugadores")')
  await page.click('.stake-btn')
  await page.waitForSelector('.game-table')

  const clickIf = async (sel) => {
    const b = page.locator(sel).first()
    if (await b.count() && await b.isVisible().catch(() => false)) { await b.click().catch(() => {}); return true }
    return false
  }

  let shot = false
  for (let hand = 0; hand < 3; hand++) {
    if (!(await clickIf('button:has-text("Iniciar mano")'))) await clickIf('button:has-text("Siguiente mano")')
    for (let i = 0; i < 22; i++) {
      await page.waitForTimeout(500)
      if (!shot && await page.locator('.game-message.msg-action').count()) {
        await page.screenshot({ path: OUT + '/c43-mesa' + n + '-accion.png' }); shot = true
      }
      await clickIf('.action-buttons button:has-text("Igualar")') || await clickIf('.action-buttons button:has-text("Pasar")')
      await clickIf('button:has-text("Sin descartar")')
      if (await page.locator('button:has-text("Siguiente mano")').isVisible().catch(() => false)) break
    }
  }
  const o = await page.evaluate(() => ({
    msgAction: [...window.__obs.msgAction], msgFont: [...window.__obs.msgFont],
    potFloat: window.__obs.potFloat, potFloatText: [...window.__obs.potFloatText].slice(0, 5),
    msgH: [...window.__obs.msgH], potBoxH: [...window.__obs.potBoxH], border: [...window.__obs.border],
  }))
  await page.close()
  return o
}

for (const n of [2, 3, 4, 5]) {
  const o = await runTable(n)
  console.log('\n=== Mesa ' + n + ' ===')
  console.log('  msg-action clases:', o.msgAction)
  console.log('  msg-action font-size:', o.msgFont, '(esperado 28px)')
  console.log('  pot-float apariciones:', o.potFloat, '| ejemplos:', o.potFloatText)
  console.log('  altura .game-message (caja del mensaje):', o.msgH, '-> fija:', o.msgH.length === 1)
  console.log('  altura .pot-box:', o.potBoxH, '-> fija:', o.potBoxH.length === 1)
  console.log('  border-width (pot-box + game-table):', o.border, '-> intacto:', o.border.length === 1)
}
await browser.close()
