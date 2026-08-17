// ── _sh1probe.mjs · DSK-SH1 · fase read-only ────────────────────────────────
// Síntoma de Victor: escritorio, mesa 2, la IA como PIE — el abanico del
// barajado abre DESPLAZADO A LA IZQUIERDA del mazo. En los demás escenarios
// abre centrado.
//
// Lo que se mide, y por qué:
//   · El abanico (.shuffle-fan-card) es position:absolute con inset:0 DENTRO
//     del wrapper del mazo, y encima lleva width/height explícitos. Con la caja
//     sobre-restringida gana la dimensión y el `right` se ignora → el abanico
//     ancla ARRIBA-IZQUIERDA del WRAPPER. Si el wrapper es más ancho que el
//     mazo, o el mazo no está pegado a su borde izquierdo, abanico y mazo
//     dejan de coincidir. Esa es la sospecha; mandan las medidas.
//   · Se mide la CAJA DE MAQUETA (offsetLeft/Top/Width/Height), no el rect: el
//     rect lleva encima el rotate/translateY de fanOut y contaría la animación
//     en vez del anclaje. Ambos elementos comparten offsetParent (el wrapper es
//     relative en la vía humana y absolute en la vía panel), así que sus
//     offsets son directamente comparables.
//
// CERO escritura en src/. Uso:  node scripts/_sh1probe.mjs
import { chromium } from 'playwright-core'
import { writeFileSync } from 'node:fs'
import { NIVELES, NIVEL_POR_DEFECTO } from '../src/config/niveles.js'

const BASE = 'http://localhost:5173'
const VPS = [{ w: 1366, h: 768 }, { w: 1920, h: 937 }]
const MESAS = [5, 4, 3, 2]    // 2 = objeto del parte · 5/4/3 = control y regresión
const MANOS = 2               // el PIE rota +1 por mano → cubre IA y humano
const TAG = process.argv[2] || 'probe'

const espera = (p, ms) => p.waitForTimeout(ms)
const r2 = x => (x == null ? null : Math.round(x * 100) / 100)

// ARN-1 · ruta recableada a NIV-UI (`0a45935`): se intercaló NivelSelect y el
// botón de apuesta pasó de `.stake-btn` (TableSelect, camino muerto) a
// `.mode-stake-btn` (ModeSelect). Mismo criterio que `gotoMesa` del arnés: el
// nivel se elige por índice derivado de config/niveles.js, nunca por el rótulo
// visible, que es copy provisional. Lo que SH1 mide —las cajas de maqueta del
// mazo y su abanico— no depende ni del nivel ni del monto.
async function entra(page, n, nivel = NIVEL_POR_DEFECTO, stakeIdx = 0) {
  const iNivel = NIVELES.findIndex(x => x.id === nivel)
  await page.goto(BASE)
  await page.click('button:has-text("Jugar vs IA")')
  await page.waitForSelector('.nivel-grid button')
  await page.click(`.nivel-grid button:nth-of-type(${iNivel + 1})`)
  await page.click(`button:has-text("Mesa de ${n} jugadores")`)
  await page.waitForSelector('.mode-stake-btn')
  await page.click(`.mode-stake-grid button:nth-of-type(${stakeIdx + 1})`)
  await page.waitForSelector('.game-table')
  await page.mouse.move(4, 4)
}

// Instantánea del barajado en vuelo: quién es PIE, por qué vía se pinta, y las
// dos cajas que deberían coincidir.
const muestra = page => page.evaluate(() => {
  const rnd = x => (x == null ? null : Math.round(x * 100) / 100)
  const caja = e => (!e ? null : {
    l: rnd(e.offsetLeft), t: rnd(e.offsetTop),
    w: rnd(e.offsetWidth), h: rnd(e.offsetHeight),
  })
  const rect = e => { if (!e) return null; const b = e.getBoundingClientRect(); return { x: rnd(b.x), y: rnd(b.y), w: rnd(b.width), h: rnd(b.height), cx: rnd(b.left + b.width / 2), cy: rnd(b.top + b.height / 2) } }
  const cs = (e, props) => { if (!e) return null; const c = getComputedStyle(e); const o = {}; props.forEach(p => { o[p] = c.getPropertyValue(p) }); return o }

  // ¿Cuántas cajas de mazo hay, y en cuántas hay abanico? El barajado sólo
  // ocurre en el PIE, así que un asiento que no es PIE no tiene abanico que
  // descentrar: los "cuatro escenarios" del parte son en realidad dos.
  const wrappers = [...document.querySelectorAll('.deck-shuffle-wrapper')]
  const censo = wrappers.map(w => ({
    zona: w.closest('.player-zone') ? 'humano' : (w.closest('.opp-panel') ? 'IA(panel)' : 'IA(ai-zone)'),
    fans: w.querySelectorAll('.shuffle-fan-card').length,
    mazoVisible: !w.querySelector('.deck-pile.deck-hidden'),
  }))

  const fan = document.querySelector('.shuffle-fan-card')
  if (!fan) return { barajando: false, censo }
  const wrapper = fan.parentElement
  const deck = wrapper.querySelector('.deck-pile')
  const fans = [...wrapper.querySelectorAll('.shuffle-fan-card')]

  // Unión de los rects vivos del abanico (con la animación encima): es lo que
  // Victor ve, y sirve para contrastar con la caja de maqueta.
  const rs = fans.map(f => f.getBoundingClientRect())
  const union = {
    x: rnd(Math.min(...rs.map(b => b.left))), y: rnd(Math.min(...rs.map(b => b.top))),
    w: rnd(Math.max(...rs.map(b => b.right)) - Math.min(...rs.map(b => b.left))),
    h: rnd(Math.max(...rs.map(b => b.bottom)) - Math.min(...rs.map(b => b.top))),
  }
  union.cx = rnd(union.x + union.w / 2)

  const cFan = caja(fan), cDeck = caja(deck)
  const rDeck = rect(deck)
  return {
    barajando: true,
    censo,
    via: wrapper.classList.contains('opp-deck-wrapper') ? 'opp-panel' : 'flujo',
    zona: wrapper.closest('.player-zone') ? 'humano' : (wrapper.closest('.opp-panel') ? 'IA(panel)' : (wrapper.closest('.ai-zone') ? 'IA(ai-zone)' : '?')),
    nFans: fans.length,
    cajaFan: cFan,
    cajaDeck: cDeck,
    // El corazón del diagnóstico: ¿coinciden las dos cajas de maqueta?
    dxMaqueta: cFan && cDeck ? rnd(cFan.l - cDeck.l) : null,
    dyMaqueta: cFan && cDeck ? rnd(cFan.t - cDeck.t) : null,
    dwMaqueta: cFan && cDeck ? rnd(cFan.w - cDeck.w) : null,
    dhMaqueta: cFan && cDeck ? rnd(cFan.h - cDeck.h) : null,
    rectDeck: rDeck,
    unionFan: union,
    dxVivo: rDeck ? rnd(union.cx - rDeck.cx) : null,
    wrapper: {
      caja: { w: rnd(wrapper.offsetWidth), h: rnd(wrapper.offsetHeight) },
      rect: rect(wrapper),
      cs: cs(wrapper, ['position', 'left', 'right', 'top', 'bottom', 'width', 'height', 'min-height', 'display', 'justify-content', 'padding-left', 'padding-right']),
    },
    csDeck: cs(deck, ['width', 'height', 'margin-left', 'margin-right', 'position', 'visibility']),
    csFan: cs(fan, ['width', 'height', 'left', 'right', 'top', 'bottom', 'position', 'transform-origin']),
  }
})

const browser = await chromium.launch({ channel: 'msedge', headless: true })
const out = []
for (const vp of VPS) for (const n of MESAS) {
  const page = await browser.newPage({ viewport: { width: vp.w, height: vp.h } })
  try {
    await entra(page, n)
    for (let mano = 1; mano <= MANOS; mano++) {
      // El barajado dura 1950ms; fanOut mantiene el abanico ABIERTO entre el
      // 30% y el 70% (585-1365ms). Se muestrea en el centro de esa meseta.
      // Tras la primera mano el botón ya es "Siguiente mano" y arranca solo el
      // barajado; se prueban los dos rótulos y se sigue si alguno responde.
      const arranco = mano === 1
        ? await page.click('button:has-text("Iniciar mano")', { timeout: 3000 }).then(() => true).catch(() => false)
        : true
      if (!arranco) break
      await espera(page, 900)
      const m = await muestra(page)
      out.push({ vp: `${vp.w}x${vp.h}`, mesa: n, mano, ...m })
      console.log(
        `${String(vp.w + 'x' + vp.h).padEnd(9)} T${n} mano${mano} · ${m.barajando ? `${m.zona.padEnd(11)} via=${String(m.via).padEnd(9)} ` +
          `maqueta fan=${JSON.stringify(m.cajaFan)} mazo=${JSON.stringify(m.cajaDeck)} → dx=${m.dxMaqueta} dy=${m.dyMaqueta} dw=${m.dwMaqueta} dh=${m.dhMaqueta} · dxVivo=${m.dxVivo}` : 'NO BARAJA'} · censo=${JSON.stringify(m.censo)}`)
      // Llegar al final de la mano para que el PIE rote: se pasa siempre.
      for (let i = 0; i < 90; i++) {
        await espera(page, 250)
        const fin = await page.evaluate(() => {
          const el = document.querySelector('.game-message')
          return el && (el.classList.contains('msg-win') || el.classList.contains('msg-lose'))
        })
        if (fin) break
        await page.click('.action-buttons button:has-text("Pasar")', { timeout: 200 }).catch(() => {})
        await page.click('.action-buttons button:has-text("Igualar")', { timeout: 200 }).catch(() => {})
        await page.click('button:has-text("Sin descartar")', { timeout: 200 }).catch(() => {})
      }
      // "Siguiente mano" reparte la siguiente y arranca su barajado sin pasar
      // por "Iniciar mano" — de ahí que sólo la primera lo necesite.
      await page.click('button:has-text("Siguiente mano")', { timeout: 3000 }).catch(() => {})
    }
  } catch (e) {
    console.log(`${vp.w}x${vp.h} T${n} · ERROR ${String(e && e.message || e).slice(0, 160)}`)
  }
  await page.close()
}
await browser.close()
writeFileSync(`capturas-dsk/sh1_${TAG}.json`, JSON.stringify(out, null, 1))
console.log(`\n→ capturas-dsk/sh1_${TAG}.json`)
