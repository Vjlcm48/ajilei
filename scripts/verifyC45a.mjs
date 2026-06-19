// Verificación C4.5 · Caso A (ceremonia del encogimiento por bancarrota de IA).
// Para que una IA quiebre ANTES que el humano hace falta un humano COMPETITIVO
// (si no descarta, juega manos peores y quiebra él primero). Aquí el humano:
// sala cara (quiebra rápida, ~pocas manos), pasa/iguala y DESCARTA 3 cada mano,
// quedando a la par de las IAs → ~80% de las veces quiebra una IA primero.
// Captura: salida digna (.opp-eliminating), aviso central (.elim-notice),
// asentado (.reflow-settle) y destello del chip (.comodin-note-flash).
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
await page.click('.stake-btn:last-child')   // sala más cara → quiebra en pocas manos
await page.waitForSelector('.game-table')

const clickIf = async (s) => { const b = page.locator(s).first(); if (await b.count() && await b.isVisible().catch(()=>false)) { await b.click().catch(()=>{}); return true } return false }
const probe = () => page.evaluate(() => ({
  eliminating: !!document.querySelector('.opp-eliminating'),
  notice:      document.querySelector('.elim-notice')?.textContent?.trim() ?? null,
  settle:      !!document.querySelector('.reflow-settle'),
  flash:       !!document.querySelector('.comodin-note-flash'),
  bankrupt:    !!document.querySelector('.bankrupt-overlay'),
  comodin:     document.querySelector('.comodin-note')?.textContent?.trim() ?? null,
  panels:      document.querySelectorAll('.opp-panel').length,
  gameover:    !!document.querySelector('.game-over-screen'),
  discardOpen: !!document.querySelector('.discard-area'),
}))

const saw = { eliminating:false, notice:null, settle:false, flash:false, bankrupt:false }
const sizes = new Set(), comodines = new Set()
let done = false
for (let i = 0; i < 6000 && !done; i++) {
  await page.waitForTimeout(80)
  await clickIf('button:has-text("Iniciar mano")')
  await clickIf('button:has-text("Siguiente mano")')
  await clickIf('.action-buttons button:has-text("Pasar")') ||
    await clickIf('.action-buttons button:has-text("Igualar")')
  // Descarte competitivo: selecciona 3 cartas del humano y descarta.
  const s0 = await probe()
  if (s0.discardOpen) {
    for (let k = 0; k < 3; k++) await clickIf(`.player-zone .cards-row .card-slot-wrapper:nth-of-type(${k + 1}) .playing-card`)
    await clickIf('.discard-area button')   // "Descartar N" / "Sin descartar"
  }
  const s = await probe()
  if (s.comodin) comodines.add(s.comodin)
  sizes.add(s.panels + 1)
  if (s.eliminating && !saw.eliminating) { saw.eliminating = true; await page.screenshot({ path: OUT + '/c45-eliminating.png' }); console.log('SALIDA DIGNA · paneles restantes:', s.panels) }
  if (s.notice && !saw.notice)           { saw.notice = s.notice; await page.screenshot({ path: OUT + '/c45-notice.png' }); console.log('AVISO CENTRAL ·', s.notice) }
  if (s.settle && !saw.settle)           { saw.settle = true; console.log('ASENTADO SUAVE') }
  if (s.flash && !saw.flash)             { saw.flash = true; await page.screenshot({ path: OUT + '/c45-flash.png' }); console.log('DESTELLO COMODÍN · comodín:', s.comodin) }
  if (s.bankrupt && !saw.bankrupt)       { saw.bankrupt = true; console.log('(modal humano — fin de sesión)'); done = true }
  if (s.gameover) { console.log('GAME_OVER terminal'); done = true }
  if (saw.eliminating && saw.notice && saw.flash) { console.log('CEREMONIA observada (salida + aviso + destello)'); done = true }
}

console.log('—')
console.log('tamaños vistos (aliveN):', [...sizes].sort())
console.log('notas de comodín vistas:', [...comodines])
console.log('vistos:', saw)
console.log('errores de página:', errors.length ? errors : 'ninguno')
await browser.close()
