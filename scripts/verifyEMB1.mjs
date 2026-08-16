// ── verifyEMB1.mjs · Δ=0 de layout de la capa de embellecimiento (EMB-1) ─────
// Read-only: NO toca src/. Uso: `npm run dev` en otra consola, luego
//   node scripts/verifyEMB1.mjs
//
// NO es un modo nuevo del arnés (diagDSK.mjs): la superficie es chica y de bajo
// churn, y la puerta visual es el checkpoint de Victor. Esto sólo produce las
// CIFRAS del Δ=0 que la instrucción exige, con el molde de los verify*.mjs.
//
// MÉTODO · variante del stash de U2c, sin stash. La capa entera vive en una
// hoja propia, y en dev Vite la inyecta en su propio <style data-vite-dev-id>.
// Apagar y encender esa hoja EN LA MISMA PÁGINA da el A/B exacto —código base
// contra código base + efecto— sin recompilar y sin dos corridas que podrían
// diferir en el reparto. El popup vive 4 s (CONSULTA_POPUP_MS): las tres
// lecturas se toman dentro de un solo page.evaluate, así que caben de sobra.
//
// Se mide con y sin efecto, y se RESTAURA — la tercera lectura tiene que volver
// a la primera al último decimal, o la medida no probaría nada.

import { chromium } from 'playwright-core'
import { CONSULTAS_KEY, CONSULTAS_GRATIS } from '../src/config/consultas.js'

const BASE = 'http://localhost:5173'
const VP = { width: 1920, height: 937 }
const round = (n) => Math.round(n * 100) / 100

// El sondeo corre DENTRO de la página (Playwright la serializa): no puede
// cerrar sobre nada de Node. Devuelve los rects de un juego de selectores en
// tres estados: con efecto, sin efecto (hoja apagada) y otra vez con efecto.
function sonda([sels, marca]) {
  const hoja = [...document.styleSheets].find(h => {
    const el = h.ownerNode
    return el && el.getAttribute && String(el.getAttribute('data-vite-dev-id') || '').includes(marca)
  })
  if (!hoja) return { error: 'hoja ' + marca + ' no encontrada' }

  const leer = () => {
    // Se fuerza el reflow antes de leer para que el toggle esté aplicado.
    void document.body.offsetWidth
    return sels.map(s => [...document.querySelectorAll(s)].map(n => {
      const r = n.getBoundingClientRect()
      return { x: r.x, y: r.y, w: r.width, h: r.height }
    }))
  }

  const con1 = leer()
  hoja.disabled = true
  const sin = leer()
  hoja.disabled = false
  const con2 = leer()
  return { con1, sin, con2 }
}

// Δ máximo entre dos lecturas, con el selector culpable.
function delta(a, b, sels) {
  let max = 0, quien = null, nodo = null
  a.forEach((lista, i) => {
    lista.forEach((p, j) => {
      const q = b[i] && b[i][j]
      if (!q) { if (max < Infinity) { max = Infinity; quien = sels[i]; nodo = j } return }
      const m = Math.max(Math.abs(q.x - p.x), Math.abs(q.y - p.y),
                         Math.abs(q.w - p.w), Math.abs(q.h - p.h))
      if (m > max) { max = m; quien = sels[i]; nodo = j }
    })
  })
  return { max: round(max), quien, nodo }
}

const browser = await chromium.launch({ channel: 'msedge', headless: true })
const out = { vp: `${VP.width}x${VP.height}` }

// ── A · Título de WelcomeScreen ──────────────────────────────────────────────
// Los VECINOS son la puerta dura: si el tratamiento moviera una métrica, el
// arco de estrellas y el subtítulo de abajo lo delatarían antes que el propio
// h1. El h1 se mide aparte y con otra vara — ver más abajo.
const SELS_TITULO = ['.star-arc', '.subtitle', '.welcome-card', '.mode-buttons',
                     '.btn-mode-ai', '.deco-left', '.deco-right']
{
  const page = await browser.newPage({ viewport: VP })
  await page.goto(BASE)
  await page.waitForSelector('.welcome-title')
  await page.waitForTimeout(900)              // deja acabar panel-enter

  const s = await page.evaluate(sonda, [SELS_TITULO, 'embellecimiento.css'])
  if (s.error) out.titulo = s
  else {
    out.titulo = {
      deltaEfecto: delta(s.con1, s.sin, SELS_TITULO),
      deltaRestauracion: delta(s.con1, s.con2, SELS_TITULO),
    }

    // El h1 con su propia vara. Su CAJA DE BORDE crece a propósito (relleno
    // compensado con margen negativo: Chromium recorta el fondo a esa caja y
    // sin ella el rótulo sale decapitado). Lo que NO puede moverse es el TEXTO,
    // y el texto se mide con un rango DOM sobre el nodo, no con el rect de la
    // caja — es la única lectura que distingue "la caja creció" de "las letras
    // se movieron". La caja de MARGEN también tiene que quedar igual: eso es lo
    // que garantiza que nada de abajo se entere.
    out.titulo.h1 = await page.evaluate((marca) => {
      const el = document.querySelector('.welcome-title')
      const hoja = [...document.styleSheets].find(h =>
        String(h.ownerNode?.getAttribute?.('data-vite-dev-id') || '').includes(marca))
      if (!hoja) return { error: 'hoja no encontrada' }
      const leer = () => {
        void document.body.offsetWidth
        const cs = getComputedStyle(el)
        const b = el.getBoundingClientRect()
        const r = document.createRange(); r.selectNodeContents(el)
        const t = r.getBoundingClientRect()
        const px = (p) => parseFloat(cs.getPropertyValue(p))
        return {
          texto: { x: t.x, y: t.y, w: t.width, h: t.height },
          caja:  { x: b.x, y: b.y, w: b.width, h: b.height },
          // Caja de margen: la huella real en el flujo.
          margen: { top: b.y - px('margin-top'), bottom: b.bottom + px('margin-bottom') },
        }
      }
      const con = leer(); hoja.disabled = true
      const sin = leer(); hoja.disabled = false
      const dif = (a, b2) => Math.max(...['x', 'y', 'w', 'h'].map(k => Math.abs(a[k] - b2[k])))
      return {
        con, sin,
        deltaTexto: Math.round(dif(con.texto, sin.texto) * 100) / 100,
        deltaMargen: Math.round(Math.max(Math.abs(con.margen.top - sin.margen.top),
                                         Math.abs(con.margen.bottom - sin.margen.bottom)) * 100) / 100,
        crecimientoCaja: Math.round((con.caja.h - sin.caja.h) * 100) / 100,
      }
    }, 'embellecimiento.css')
    // FL-1: fuente, tamaño y métricas TIPOGRÁFICAS intactas — se comparan los
    // computados con y sin la hoja, no contra literales (un literal envejece).
    // Relleno y margen NO entran aquí: son la compensación, y su neutralidad se
    // prueba con `deltaMargen` y con el Δ=0 de los vecinos, que es más fuerte
    // que comparar declaraciones.
    out.titulo.fl1 = await page.evaluate((marca) => {
      const el = document.querySelector('.welcome-title')
      const hoja = [...document.styleSheets].find(h =>
        String(h.ownerNode?.getAttribute?.('data-vite-dev-id') || '').includes(marca))
      if (!hoja) return { error: 'hoja no encontrada' }
      const PROPS = ['font-family', 'font-size', 'font-weight', 'letter-spacing',
                     'line-height', 'text-transform', 'text-align', 'width']
      const leer = () => Object.fromEntries(PROPS.map(p => [p, getComputedStyle(el).getPropertyValue(p)]))
      const con = leer(); hoja.disabled = true
      const sin = leer(); hoja.disabled = false
      return { con, sin, iguales: PROPS.every(p => con[p] === sin[p]) }
    }, 'embellecimiento.css')

    out.titulo.pintura = await page.evaluate(() => {
      const cs = getComputedStyle(document.querySelector('.welcome-title'))
      return {
        backgroundClip: cs.getPropertyValue('-webkit-background-clip') || cs.backgroundClip,
        color: cs.color,
        animationName: cs.animationName,
        animationDuration: cs.animationDuration,
      }
    })
  }
  await page.close()
}

// ── A' · Título bajo reduced-motion ──────────────────────────────────────────
{
  const ctx = await browser.newContext({ viewport: VP, reducedMotion: 'reduce' })
  const page = await ctx.newPage()
  await page.goto(BASE)
  await page.waitForSelector('.welcome-title')
  out.tituloReducido = await page.evaluate(() => {
    const cs = getComputedStyle(document.querySelector('.welcome-title'))
    return {
      animationName: cs.animationName,
      backgroundImage: cs.backgroundImage.slice(0, 60) + '…',
      sinBarrido: cs.animationName === 'none',
    }
  })
  await ctx.close()
}

// ── B · Ventana de Mano Actual ───────────────────────────────────────────────
// La ventana y TODO su contenido: si el anillo empujara aunque fuera el filete,
// los párrafos de dentro se moverían.
const SELS_POPUP = ['.u3-popup', '.u3-popup p', '.u3-titulo', '.u3-resto',
                    '.u3-nota', '.u3-saldo', '.utilities-trigger', '.game-table']

async function abrirPopup(page) {
  await page.addInitScript(({ k, v }) => {
    try { window.localStorage.setItem(k, String(v)) } catch { /* storage denegado */ }
  }, { k: CONSULTAS_KEY, v: CONSULTAS_GRATIS })
  await page.goto(BASE)
  await page.click('button:has-text("Jugar vs IA")')
  // NIV-UI · la selección de nivel se interpone entre la bienvenida y la mesa.
  await page.click('.nivel-grid button')
  await page.click('button:has-text("Mesa de 5 jugadores")')
  await page.click('.mode-stake-btn')
  await page.waitForSelector('.game-table')
  await page.mouse.move(5, 5)
  const iniciar = page.locator('button:has-text("Iniciar mano")').first()
  if (await iniciar.count()) await iniciar.click().catch(() => {})
  // Turno vivo del humano: es donde la entrada está habilitada.
  for (let i = 0; i < 120; i++) {
    await page.waitForTimeout(250)
    const listo = await page.evaluate(() =>
      !!document.querySelector('.timer-display') &&
      document.querySelectorAll('.player-zone .playing-card img[alt]:not([alt=""])').length > 0)
    if (listo) break
  }
  await page.click('.utilities-trigger')
  await page.waitForSelector('.utilities-panel', { timeout: 2000 }).catch(() => {})
  await page.click('.util-item-mano .util-ico-slot')
  await page.waitForSelector('.u3-popup', { timeout: 2000 })
}

{
  const page = await browser.newPage({ viewport: VP })
  await abrirPopup(page)
  const s = await page.evaluate(sonda, [SELS_POPUP, 'embellecimiento.css'])
  if (s.error) out.popup = s
  else {
    out.popup = {
      deltaEfecto: delta(s.con1, s.sin, SELS_POPUP),
      deltaRestauracion: delta(s.con1, s.con2, SELS_POPUP),
      rect: s.con1[0][0] && { ...s.con1[0][0] },
      nodosMedidos: s.con1.reduce((n, l) => n + l.length, 0),
    }
    // El anillo tiene que existir, estar fuera de flujo y estar animado.
    out.popup.anillo = await page.evaluate(() => {
      const cs = getComputedStyle(document.querySelector('.u3-popup'), '::before')
      return {
        content: cs.content,
        position: cs.position,
        animationName: cs.animationName,
        animationDuration: cs.animationDuration,
        pointerEvents: cs.pointerEvents,
        fueraDeFlujo: cs.position === 'absolute',
      }
    })
  }
  await page.close()
}

// ── B' · Ventana bajo reduced-motion ─────────────────────────────────────────
{
  const ctx = await browser.newContext({ viewport: VP, reducedMotion: 'reduce' })
  const page = await ctx.newPage()
  await abrirPopup(page)
  out.popupReducido = await page.evaluate(() => {
    const cs = getComputedStyle(document.querySelector('.u3-popup'), '::before')
    return {
      animationName: cs.animationName,
      backgroundImage: cs.backgroundImage,
      backgroundColor: cs.backgroundColor,
      // Estático de verdad: sin animación Y sin el cónico — el anillo pasa a
      // ser color plano, que es lo que "borde dorado estático" significa.
      estatico: cs.animationName === 'none' && cs.backgroundImage === 'none' &&
                cs.backgroundColor !== 'rgba(0, 0, 0, 0)',
    }
  })
  await ctx.close()
}

await browser.close()

// ── Veredicto ────────────────────────────────────────────────────────────────
const t = out.titulo, p = out.popup
const checks = {
  titulo_vecinosDelta0: !!t && !t.error && t.deltaEfecto.max <= 0.02,
  titulo_restaura:      !!t && !t.error && t.deltaRestauracion.max <= 0.02,
  titulo_textoQuieto:   t?.h1?.deltaTexto <= 0.02,
  titulo_margenQuieto:  t?.h1?.deltaMargen <= 0.02,
  titulo_fl1:           !!t?.fl1?.iguales,
  // Dos capas de fondo → el computado trae dos valores ("text, text").
  titulo_pintado:       !!t?.pintura &&
                        t.pintura.backgroundClip.split(',').every(v => v.trim() === 'text'),
  titulo_reducido:      !!out.tituloReducido?.sinBarrido,
  popup_delta0:         !!p && !p.error && p.deltaEfecto.max <= 0.02,
  popup_restaura:       !!p && !p.error && p.deltaRestauracion.max <= 0.02,
  popup_anilloFuera:    !!p?.anillo?.fueraDeFlujo,
  popup_anilloAnimado:  !!p?.anillo && p.anillo.animationName === 'emb-u3-recorrido',
  popup_reducido:       !!out.popupReducido?.estatico,
}
out.checks = checks
out.passed = Object.values(checks).every(Boolean)

console.log(JSON.stringify(out, null, 2))
console.log(out.passed ? 'EMB-1 · OK'
  : 'EMB-1 · FALLA [' + Object.entries(checks).filter(([, v]) => !v).map(([k]) => k).join(',') + ']')
