// ── diagDSK.mjs · Arnés de diagnóstico DESKTOP (campaña DSK) ──────────────────
// Read-only: NO toca src/. Mide geometría/estilos con Edge headless (playwright-core).
// Uso:  node scripts/diagDSK.mjs <modo>
//   d1d2   → 1920×937: gates (matchMedia), estructura JSX activa, mapa DOM de los 11 frentes
//   d3     → matriz de 4 viewports: bbox de mesa/óvalo/paneles/mazos/abanico/botones + overflow
//   bug    → reproduce la revelación finalista y mide el reflow del panel ganador
//   shots  → capturas de los 4 viewports (+ la del bug si 'bug' corre antes)
//   all    → d1d2 + d3 + bug + shots
//   gate [tag] → DSK-G1: matriz matchMedia del gate + capturas WAITING (diff)
//   b1     → DSK-B1: presupuesto vertical por fila + overflow por viewport
//   tactil → verificación táctil coarse: hit-boxes REALES (::after, vía
//            elementFromPoint) validados ≥40px (estándar campaña, NO WCAG) +
//            no-solape (H mults, V mult/botón) + flujo funcional de una mano
//   r1     → DSK-R1: revelación de finalistas sin layout shift (mesas 5/4/3). Por
//            cada IA finalista revela su mano y verifica Δ=0 (óvalo, paneles,
//            área humana), solape de cartas por encima (elementFromPoint) y
//            restauración exacta al cerrar. Mesa 2 fuera de alcance.
//   r2     → DSK-R2: coreografía del curiosear (mesas 5/4/3). Verifica que el
//            canje corre las 4 fases (no instantáneo), tiempos idénticos a móvil,
//            Δ=0 en frames intermedios, estado final = R1 e interrupciones sin
//            zombis. R2c suma: Δ=0 del ÁREA TOTAL de juego (.game-table) +
//            estabilidad del scroll (documento y scroller) en todos los frames,
//            y confinamiento de la carta extrema dentro del perímetro del área
//            (≥0px de margen) POR ASIENTO. Args opcionales: [mesa] [WxH] para
//            filtrar. Mesa 2 fuera.
//   o1     → DSK-O1: óvalo central fijo. Mide el bbox de .center-zone en TODAS
//            las familias de mensaje reales del motor (inyectadas) + en los
//            estados REALES de una mano jugada, el umbral de wrap del mensaje
//            más largo y el desborde del texto respecto al perímetro del óvalo.
//            Mesa 5 es el alcance; 4/3/2 se miden como insumo. Args: [mesa] [WxH].
//   o2     → DSK-O2: óvalo congelado en mesas 4/3/2. 15 celdas (los 4 viewports de
//            campaña + CENTINELA 1440×850: la banda 801..900, root 18 con carta 76,
//            donde una constante por tier se rompe sin que la matriz de 4 lo note).
//            El peor caso se CONSTRUYE, no se juega: pozo 25000 (5×saldoInicial),
//            "A igualar" visible, las 15 familias con su CLASE real (msgPop apagada
//            —su scale(0.8) del primer frame acorta los rects un 20%—), pastilla de
//            rol en un solo lateral, pastilla de comodín inyectada en 3/2 (su
//            guardián es numPlayers>=4: una mesa reducida SÍ la lleva) y aviso de
//            eliminación con nombres de 12ch. Exige óvalo y vecinos Δ=0 entre todos
//            los estados, columnas = fórmula de token (±0.02), rivals-zone derivada
//            del panel vivo, .ai-zone = --o2-ai-h + su padding, escape de contenido
//            ≤0 (incluido el "+N" volador del pozo, que la guardia no puede
//            recortar), scroll sin overflow y cadena del óvalo SIN contexto de
//            apilamiento (el sobrevuelo de Z1 depende de eso). Args: [mesa] [WxH].
//   h1     → DSK-H1: área del jugador humano en las 4 mesas del gate. Reporta la
//            vía de render, la reserva del nombre (12ch: "Tú" vs 12 caracteres),
//            el shift-check O1 de un ciclo completo rol/TURNO/showdown (Δ=0 en el
//            área y sus vecinos) y el bloque de saldo (borde derecho inmóvil a
//            3/5/7 dígitos, "Mesa N" alineada debajo, "·" y "fichas" ausentes).
//            DSK-H2 amplía el ciclo a TRES manos para que el rol rote de verdad
//            (MANO → PIE → sin rol) —hasta H2 el techo de la mano cortaba antes y
//            las 16 celdas sólo veían MANO— y suma el frente hermano: alto del
//            header de cada IA y tapa de su fila de cartas (magnitudes verticales;
//            el ancho queda informativo por la elasticidad O1 abierta en mesa 4).
//            Args: [mesa] [WxH].
//   m1     → DSK-M1: mazo del humano a la mitad (y su gemelo IA de mesa 2) en las
//            16 celdas. Exige calibre objetivo ±0.5px, esquina superior IZQUIERDA
//            en las coordenadas PRE-tanda de la fase (a), wrapper con su ancho de
//            flujo y su alto intactos (compensación de margen), hueco mazo→cartas
//            esperado, sombras del rival, abanico de barajado atado al mazo,
//            reserva viva con .deck-hidden y Δ=0 en el área durante una rotación
//            completa de PIE (3 manos). Args: [mesa] [WxH].
//   a1     → DSK-A1: anclaje arriba-izquierda del abanico humano (preparación de
//            F1). En las 16 celdas y a lo largo de una rotación completa de PIE:
//            origen (esquina sup-izq de la 1ª carta) CONSTANTE en todas las fases
//            y con/sin cartas, huecos = tokens --dsk-fan-gap-left/-top (±0.5px),
//            slot y carta con el mismo anclaje, mazo en las coordenadas M1
//            exactas, "Tu mejor palo" reubicada (sitio, ciclo de visibility,
//            encaje sin recorte —peor caso inyectado incluido—, cero colisión
//            con el abanico y apilamiento), Δ=0 contra la baseline PRE-tanda en
//            área/barra/botones/timer/saldo y guardia de deriva de los tokens
//            primitivos contra el padding vivo. Args: [mesa] [WxH].
//   a2     → DSK-A2: abanico del humano CENTRADO (variante A) + mazo recolocado
//            al ritmo de --dsk-fan-gap-left + "Tu mejor palo" mudada debajo de
//            las cartas. 20 celdas (las 16 de campaña + el centinela 1440×850) y
//            una mano completa cada una, con 14 puertas: simetría del grupo de 5
//            contra los filos útiles, origen constante, PISO F1 con doble puerta
//            (fórmula viva Y valor pre-A2), respiro pila→carta 1 = token con y
//            sin PIE, aterrizaje del mazo dentro del filo, banda en su sitio
//            derivado / sin recorte con el marcado real / centrada / sin tocar
//            botón ni texto de la barra, fuera de flujo ESTRICTO (Δ=0 en 11
//            anclas + 5 slots + scrollHeight/clientHeight), overflow 0, ciclo de
//            visibility (viva sólo en la fase de pago) y guardia de la fase de
//            APUESTA —ambos como condición de passed, porque son lo único que
//            impide que la banda tape la fila de multiplicadores—, vuelos por
//            encima de la banda, gemelo IA de mesa 2 inmóvil y guardia de deriva
//            de las primitivas. Args: [mesa] [WxH].
//   u1     → DSK-U1: menú de utilidades en escritorio. 20 celdas (16 de campaña
//            + centinela 1440×850) con una mano completa cada una y el menú
//            abierto en reposo, apuesta, descarte con selección, pago, revelado
//            y revelado+sobrevuelo Z1. Doce puertas: caja del disparador Δ=0
//            contra la baseline PRE-tanda de HEAD 7ef28c9 (40,61×32, más
//            .header-right y la ✕), fuera de flujo estricto (Δ=0 en 11 anclas +
//            scrollHeight/clientHeight al abrir Y al cerrar), overflow 0 en los
//            tiers ≤800, z del panel por encima del techo VIVO del área
//            (revelado 7, Z1 9) y por debajo de los modales, ganando además el
//            hit-test en centro y esquinas, las tres vías de cierre —clic fuera,
//            Esc y ejecutar— más la prueba de que el clic fuera NO se traga la
//            acción (con el menú abierto, el clic sobre "Iniciar mano" arranca la
//            mano), estado y persistencia del toggle de sonido, guardia de
//            contenido (el panel jamás toca botones de acción, multiplicadores,
//            timer ni la banda "Tu mejor palo") y encaje dentro del viewport.
//            Suma una sub-pasada pointer:coarse (hits ⋮ y entradas ≥40, sin
//            robarle el hit a la ✕) y una de persistencia end-to-end
//            (apagar → recargar → volver a la mesa). Args: [mesa] [WxH].
//            OJO: el modo r2 lanza el navegador SIN --hide-scrollbars (ver el
//            launch al final): con las barras ocultas, la que aparece/desaparece
//            por overflow desplazable NUNCA encoge el cliente y el saltito de
//            15px es literalmente invisible al arnés.
// Salida: JSON a stdout y a scratchpad; PNGs a capturas-dsk/.
import { chromium } from 'playwright-core'
import { writeFileSync } from 'node:fs'

const BASE = 'http://localhost:5173'
const OUT_DIR = 'capturas-dsk'
const MODE = process.argv[2] || 'all'

const VIEWPORTS = [
  { w: 1024, h: 768 },
  { w: 1280, h: 720 },
  { w: 1366, h: 768 },
  { w: 1920, h: 937 },
]

const round = (n) => n == null ? null : Math.round(n * 100) / 100

// ── Navegación a Mesa de N (5/4/3/2) ─────────────────────────────────────────
async function gotoMesa(page, n = 5) {
  await page.goto(BASE)
  await page.click('button:has-text("Jugar vs IA")')
  await page.click(`button:has-text("Mesa de ${n} jugadores")`)
  await page.click('.stake-btn')
  await page.waitForSelector('.game-table')
  await page.mouse.move(5, 5) // neutraliza hover de cartas
}
const gotoMesa5 = (page) => gotoMesa(page, 5)

const clickIf = async (page, s) => {
  const b = page.locator(s).first()
  if (await b.count() && await b.isVisible().catch(() => false)) {
    await b.click().catch(() => {}); return true
  }
  return false
}

// Auto-juega una mano hasta el showdown (botón "Siguiente mano" visible).
async function playToShowdown(page, maxIter = 200) {
  await clickIf(page, 'button:has-text("Iniciar mano")')
  for (let i = 0; i < maxIter; i++) {
    await page.waitForTimeout(350)
    await page.mouse.move(5, 5)
    if (await page.locator('button:has-text("Siguiente mano")').isVisible().catch(() => false)) return true
    await clickIf(page, '.action-buttons button:has-text("Pasar")') ||
      await clickIf(page, '.action-buttons button:has-text("Igualar")') ||
      await clickIf(page, '.action-buttons button:has-text("Apostar")')
    await clickIf(page, 'button:has-text("Sin descartar")')
  }
  return page.locator('button:has-text("Siguiente mano")').isVisible().catch(() => false)
}

// ── Helpers de medición dentro de la página ──────────────────────────────────
// Inyecta funciones reutilizables en window para medir rects, texto y estilos.
async function installProbes(page) {
  await page.evaluate(() => {
    window.__rect = (el) => {
      if (!el) return null
      const r = el.getBoundingClientRect()
      return { x: r.x, y: r.y, w: r.width, h: r.height, top: r.top, right: r.right, bottom: r.bottom, left: r.left }
    }
    window.__textRect = (el) => {
      if (!el) return null
      const range = document.createRange()
      range.selectNodeContents(el)
      const r = range.getBoundingClientRect()
      return { x: r.x, y: r.y, w: r.width, h: r.height }
    }
    window.__css = (el, props) => {
      if (!el) return null
      const cs = getComputedStyle(el)
      const o = {}
      props.forEach(p => { o[p] = cs.getPropertyValue(p) })
      return o
    }
    window.__all = (sel) => [...document.querySelectorAll(sel)]
    // R2c · métricas de scroll: documento + scroller real de la mesa. barV/barH
    // = grosor VIVO de cada barra (offset − client): 0 sin barra, 15 con ella.
    // El scroll de la mesa vive DENTRO de .game-table-screen (nunca en el
    // documento) — se muestrean ambos porque el saltito puede nacer en cualquiera.
    window.__scrollMetrics = () => {
      const de = document.scrollingElement || document.documentElement
      const scr = document.querySelector('.game-table-screen')
      return {
        docL: de.scrollLeft, docT: de.scrollTop, docW: de.scrollWidth, docH: de.scrollHeight,
        docCW: de.clientWidth, docCH: de.clientHeight,
        bodyW: document.body.scrollWidth, bodyH: document.body.scrollHeight,
        scrL: scr ? scr.scrollLeft : 0, scrT: scr ? scr.scrollTop : 0,
        scrW: scr ? scr.scrollWidth : 0, scrH: scr ? scr.scrollHeight : 0,
        scrCW: scr ? scr.clientWidth : 0, scrCH: scr ? scr.clientHeight : 0,
        barV: scr ? scr.offsetWidth - scr.clientWidth : 0,
        barH: scr ? scr.offsetHeight - scr.clientHeight : 0,
      }
    }
  })
}

// ── D1 + D2 · 1920×937 ────────────────────────────────────────────────────────
async function runD1D2(browser) {
  const page = await browser.newPage({ viewport: { width: 1920, height: 937 } })
  await gotoMesa5(page)
  await installProbes(page)

  // Gates (matchMedia) — misma fuente que los hooks de React.
  const gates = await page.evaluate(() => ({
    landscapeTableMQ: '(orientation: landscape) and (max-height: 600px)',
    portraitTableMQ: '(max-width: 767px) and (orientation: portrait)',
    isLandscapeTable: window.matchMedia('(orientation: landscape) and (max-height: 600px)').matches,
    isPortraitTable: window.matchMedia('(max-width: 767px) and (orientation: portrait)').matches,
    mqDesktopTall: window.matchMedia('(min-width: 768px) and (min-height: 900px)').matches,
    mqDesktopMid: window.matchMedia('(min-width: 768px) and (min-height: 601px)').matches,
    cardW: getComputedStyle(document.documentElement).getPropertyValue('--card-w').trim(),
    cardH: getComputedStyle(document.documentElement).getPropertyValue('--card-h').trim(),
    innerW: window.innerWidth, innerH: window.innerHeight,
  }))

  // Estructura JSX activa: qué contenedores existen en el DOM.
  const structure = await page.evaluate(() => ({
    hasTableMid: !!document.querySelector('.table-mid'),
    hasSideColLeft: !!document.querySelector('.side-col-left'),
    hasSideColRight: !!document.querySelector('.side-col-right'),
    hasRivalsZone: !!document.querySelector('.rivals-zone'),
    hasCenterZone: !!document.querySelector('.center-zone'),
    hasTwoOvals: !!document.querySelector('.two-ovals'),
    hasAiZone: !!document.querySelector('.ai-zone'),
    hasTableBrand: !!document.querySelector('.table-brand'),           // brandInMid
    brandInHeader: !!document.querySelector('.table-header .table-title'),
    gameTableClasses: document.querySelector('.game-table')?.className,
    oppPanels: document.querySelectorAll('.opp-panel').length,
    letterBadges: [...document.querySelectorAll('.seat-badge')].map(b => b.textContent.trim()),
    cornerChips: document.querySelectorAll('.opp-corner-chip').length,
    oppChipsLines: document.querySelectorAll('.opp-chips').length,
    centerZoneDisplay: getComputedStyle(document.querySelector('.center-zone')).display,
    tableMidDisplay: document.querySelector('.table-mid') ? getComputedStyle(document.querySelector('.table-mid')).display : null,
    tableMidGridCols: document.querySelector('.table-mid') ? getComputedStyle(document.querySelector('.table-mid')).gridTemplateColumns : null,
  }))

  // WAITING snapshot (antes de iniciar)
  const snapWaiting = await snapshotFrentes(page)

  // Jugar hasta showdown para capturar estados ricos (badges, score, oval con mensajes)
  const reached = await playToShowdown(page)
  const snapShowdown = await snapshotFrentes(page)

  const page2 = page
  return { page: page2, data: { gates, structure, snapWaiting, snapShowdown, reachedShowdown: reached } }
}

// Mide los 11 frentes en el estado actual.
async function snapshotFrentes(page) {
  return page.evaluate(() => {
    const R = window.__rect, T = window.__textRect, C = window.__css
    const q = (s) => document.querySelector(s)
    const qa = (s) => [...document.querySelectorAll(s)]

    // 1. Texto "fichas" (IA + humano)
    const oppChips = qa('.opp-chips').map(el => ({ text: el.textContent.trim(), rect: R(el), css: C(el, ['font-size', 'line-height', 'color', 'display']) }))
    const pbrFichas = q('.pbr-fichas-word')
    const pbrChips = q('.pbr-chips')

    // 2. Ficha IA / mecanismo ocultar-revelar saldo
    const cornerChips = qa('.opp-corner-chip').map(el => ({ rect: R(el), display: getComputedStyle(el).display }))

    // 3. Nombre IA
    const oppNames = qa('.opp-name').map(el => ({ text: el.textContent.trim(), rect: R(el), textRect: T(el), css: C(el, ['text-align', 'color', 'font-size', 'padding', 'margin']) }))

    // 4. Badges PIE/MANO/TURNO en IA
    const badges = qa('.opp-panel .seat-badge').map(el => ({ text: el.textContent.trim(), cls: el.className, rect: R(el), css: C(el, ['font-size', 'padding', 'background-color', 'color', 'letter-spacing']) }))

    // 5. Palabra de estado
    const oppStatus = qa('.opp-status').map(el => ({ text: el.textContent.trim(), rect: R(el), css: C(el, ['position', 'font-size', 'color', 'font-style']) }))

    // 6. Panel ganador (reflow) — datos base (el modo bug mide el delta)
    const winner = q('.opp-winner')
    const winnerData = winner ? { rect: R(winner), cardsRect: R(winner.querySelector('.opp-cards')), cardSlots: qa('.opp-winner .opp-card-slot').map(R) } : null

    // 7. "Mejor palo: X (N pts)"
    const oppScore = qa('.opp-score').map(el => ({ text: el.textContent.trim(), visibility: el.style.visibility || getComputedStyle(el).visibility, rect: R(el) }))
    const playerScore = q('.score-tag-player')

    // 8. Óvalo central
    const cz = q('.center-zone')
    const gm = q('.game-message')
    const oval = cz ? {
      rect: R(cz),
      css: C(cz, ['display', 'box-sizing', 'border-radius', 'padding', 'width', 'height', 'grid-template-columns', 'overflow', 'flex']),
      messageRect: R(gm),
      messageText: gm?.textContent.trim(),
      messageCss: gm ? C(gm, ['font-size', 'height', 'line-height', 'flex']) : null,
    } : null

    // 9. Curiosear: nombres tappables + shake + choreo
    const tappable = qa('.opp-name-tappable').length
    const shaking = qa('.opp-name-shake').length
    const revealClasses = qa('[class*="opp-reveal"]').map(el => el.className)

    // 10. Bloque "Tú [MANO]"
    const pbLeft = q('.player-bar-left')
    const tuBlock = pbLeft ? {
      rect: R(pbLeft),
      css: C(pbLeft, ['display', 'justify-self', 'overflow', 'white-space', 'text-overflow']),
      name: q('.pbr-name')?.textContent.trim(),
      nameRect: R(q('.pbr-name')),
      tags: qa('.pbr-tags .seat-badge').map(el => el.textContent.trim()),
      badgesRect: R(q('.pbr-badges')),
    } : null

    // 11. Saldo humano + "· Mesa N"
    const pbRight = q('.player-bar-right')
    const saldoBlock = pbRight ? {
      rect: R(pbRight),
      html: pbRight.innerHTML.replace(/\s+/g, ' ').trim(),
      css: C(pbRight, ['display', 'justify-self', 'white-space', 'color']),
      chips: q('.pbr-chips')?.textContent.trim(),
      sep: q('.pbr-sep')?.textContent,
      sepRect: R(q('.pbr-sep')),
      mesa: q('.pbr-mesa')?.textContent.trim(),
      fichasWord: { text: document.querySelector('.pbr-fichas-word')?.textContent.trim(), display: document.querySelector('.pbr-fichas-word') ? getComputedStyle(document.querySelector('.pbr-fichas-word')).display : null },
    } : null

    return {
      phaseMsg: q('.game-message')?.textContent.trim(),
      oppChips, pbrFichas: pbrFichas ? { text: pbrFichas.textContent.trim(), display: getComputedStyle(pbrFichas).display } : null,
      pbrChipsText: pbrChips?.textContent.trim(),
      cornerChips, oppNames, badges, oppStatus, winnerData, oppScore,
      playerScore: playerScore ? { text: playerScore.textContent.trim(), visibility: playerScore.style.visibility } : null,
      oval, tappable, shaking, revealClasses, tuBlock, saldoBlock,
    }
  })
}

// ── D3 · Matriz de adaptabilidad ──────────────────────────────────────────────
async function runD3(browser) {
  const rows = []
  for (const vp of VIEWPORTS) {
    const page = await browser.newPage({ viewport: { width: vp.w, height: vp.h } })
    await gotoMesa5(page)
    await installProbes(page)
    // Iniciar mano para que el tablero tenga cartas (abanico humano, mazos visibles)
    await clickIf(page, 'button:has-text("Iniciar mano")')
    await page.waitForTimeout(1600)
    await page.mouse.move(5, 5)
    const m = await page.evaluate((vp) => {
      const R = window.__rect
      const q = (s) => document.querySelector(s)
      const qa = (s) => [...document.querySelectorAll(s)]
      const screen = q('.game-table-screen')
      const table = q('.game-table')
      return {
        viewport: vp,
        cardW: getComputedStyle(document.documentElement).getPropertyValue('--card-w').trim(),
        mqTall: window.matchMedia('(min-width: 768px) and (min-height: 900px)').matches,
        mqMid: window.matchMedia('(min-width: 768px) and (min-height: 601px)').matches,
        screenRect: R(screen),
        screenScroll: { scrollH: screen.scrollHeight, clientH: screen.clientHeight, overflow: screen.scrollHeight - screen.clientHeight },
        docScroll: document.scrollingElement.scrollHeight - document.scrollingElement.clientHeight,
        table: R(table),
        oval: R(q('.center-zone')),
        oppPanels: qa('.opp-panel').map(el => ({ pos: [...el.classList].find(c => c.startsWith('opp-') && (c.includes('top') || c.includes('side'))), rect: R(el) })),
        decks: qa('.deck-pile:not(.deck-hidden)').map(R),
        humanFan: R(q('.player-zone .cards-row')),
        brand: R(q('.table-title')),
        handBadge: R(q('.hand-badge')),
        buttons: R(q('.player-bar-center')),
        playerBar: R(q('.player-bar')),
      }
    }, vp)
    rows.push(m)
    await page.close()
  }
  return rows
}

// ── Punto 6 · Bug de revelación finalista ─────────────────────────────────────
async function runBug(browser) {
  const page = await browser.newPage({ viewport: { width: 1920, height: 937 } })
  await gotoMesa5(page)
  await installProbes(page)

  // Reintenta manos hasta obtener un showdown REAL (ganador con score → paneles revelados)
  let showdownReal = false
  for (let attempt = 0; attempt < 6 && !showdownReal; attempt++) {
    await playToShowdown(page)
    showdownReal = await page.locator('.opp-winner').count() > 0 ||
      await page.evaluate(() => !!document.querySelector('.card-slot-winner') || [...document.querySelectorAll('.opp-panel')].some(p => p.className.includes('opp-winner')))
    if (!showdownReal) {
      await clickIf(page, 'button:has-text("Siguiente mano")')
      await page.waitForTimeout(1800)
    }
  }
  await page.mouse.move(5, 5)

  // Mide ANTES de tocar (estado tras el showdown, ganadora ya revelada por defecto)
  const before = await measureReflow(page)

  // Encuentra un nombre tappable NO revelado y lo toca (curiosear otra mano)
  const tapped = await page.evaluate(() => {
    const cand = [...document.querySelectorAll('.opp-name-tappable')]
      .find(el => !el.closest('.opp-panel').className.includes('opp-winner'))
    if (cand) { cand.click(); return cand.closest('.opp-panel').className }
    return null
  })
  await page.waitForTimeout(1200)
  await page.mouse.move(5, 5)
  const after = await measureReflow(page)

  // Captura del bug
  await page.screenshot({ path: `${OUT_DIR}/dsk_m5_bug_reveal.png` })

  return { showdownReal, tapped, before, after }
}

// Mide anchos de paneles, óvalo y fila de cartas del ganador (para el delta de reflow).
async function measureReflow(page) {
  return page.evaluate(() => {
    const R = (el) => { if (!el) return null; const r = el.getBoundingClientRect(); return { x: r.x, w: r.width, h: r.height, right: r.right, left: r.left } }
    const qa = (s) => [...document.querySelectorAll(s)]
    return {
      panels: qa('.opp-panel').map(el => ({
        pos: [...el.classList].find(c => c.startsWith('opp-') && (c.includes('top') || c.includes('side'))) || 'bottom',
        winner: el.className.includes('opp-winner'),
        rect: R(el),
        cards: R(el.querySelector('.opp-cards')),
        cardSlotML: el.querySelector('.opp-card-slot:not(:first-child)') ? getComputedStyle(el.querySelector('.opp-card-slot:not(:first-child)')).marginLeft : null,
        cardSlotTransform: el.querySelector('.opp-card-slot') ? getComputedStyle(el.querySelector('.opp-card-slot')).transform : null,
      })),
      oval: R(document.querySelector('.center-zone')),
      rivalsZone: R(document.querySelector('.rivals-zone')),
      sideLeft: R(document.querySelector('.side-col-left')),
      sideRight: R(document.querySelector('.side-col-right')),
    }
  })
}

// ── Capturas ──────────────────────────────────────────────────────────────────
async function runShots(browser) {
  const shots = []
  for (const vp of VIEWPORTS) {
    const page = await browser.newPage({ viewport: { width: vp.w, height: vp.h } })
    await gotoMesa5(page)
    await clickIf(page, 'button:has-text("Iniciar mano")')
    await page.waitForTimeout(1700)
    await page.mouse.move(5, 5)
    const path = `${OUT_DIR}/dsk_m5_${vp.w}x${vp.h}.png`
    await page.screenshot({ path })
    shots.push(path)
    await page.close()
  }
  return shots
}

// ── DSK-G1 · Verificación del gate (matriz + capturas deterministas) ──────────
// tag = 'before' | 'after' (subdir de capturas para el diff). Estado WAITING
// (pantalla de bienvenida, sin reparto aleatorio) → PNG determinista.
async function runGate(browser, tag = 'after') {
  const MATRIX = [
    { w: 640, h: 360, expect: false, note: 'móvil landscape' },
    { w: 360, h: 640, expect: false, note: 'portrait' },
    { w: 844, h: 390, expect: false, note: 'móvil landscape' },
    { w: 1024, h: 768, expect: true, note: 'desktop' },
    { w: 1366, h: 768, expect: true, note: 'desktop' },
    { w: 1920, h: 937, expect: true, note: 'desktop' },
  ]
  const matrix = []
  for (const vp of MATRIX) {
    const page = await browser.newPage({ viewport: { width: vp.w, height: vp.h } })
    await page.goto(BASE)
    const matches = await page.evaluate(() => window.matchMedia('(orientation: landscape) and (min-height: 601px)').matches)
    matrix.push({ ...vp, matches, ok: matches === vp.expect })
    await page.close()
  }
  // Capturas deterministas para el diff (WAITING). 1920/1366 = fine pointer
  // (diff cero esperado tras B2); 640 = móvil fuera del gate.
  const shots = {}
  for (const vp of [{ w: 1920, h: 937 }, { w: 1366, h: 768 }, { w: 640, h: 360 }, { w: 360, h: 640 }]) {
    const page = await browser.newPage({ viewport: { width: vp.w, height: vp.h } })
    await gotoMesa5(page)                 // aterriza en WAITING (no se pulsa Iniciar)
    await page.waitForTimeout(400)
    await page.mouse.move(5, 5)
    const path = `${OUT_DIR}/gate_${tag}_${vp.w}x${vp.h}.png`
    await page.screenshot({ path })
    shots[`${vp.w}x${vp.h}`] = path
    await page.close()
  }
  return { matrix, matrixOk: matrix.every(m => m.ok), shots }
}

// ── DSK-B1 · Presupuesto vertical de la columna central (mesa 5) ──────────────
// Read-only. Desglosa alto+gaps+paddings+márgenes de cada fila del stack y el
// mecanismo de recorte. Corre en WAITING (determinista) y en un estado con cartas.
async function runB1(browser) {
  const rows = []
  for (const vp of VIEWPORTS) {
    const page = await browser.newPage({ viewport: { width: vp.w, height: vp.h } })
    await gotoMesa5(page)
    await installProbes(page)
    // medir en WAITING y también tras iniciar mano (cartas en mesa → alturas reales)
    const waiting = await measureBudget(page, vp)
    await clickIf(page, 'button:has-text("Iniciar mano")')
    await page.waitForTimeout(1700)
    await page.mouse.move(5, 5)
    const dealt = await measureBudget(page, vp)
    rows.push({ vp, waiting, dealt })
    await page.close()
  }
  return rows
}

async function measureBudget(page, vp) {
  return page.evaluate((vp) => {
    const cs = (el) => el ? getComputedStyle(el) : null
    const num = (v) => parseFloat(v) || 0
    const box = (el, label) => {
      if (!el) return { label, missing: true }
      const r = el.getBoundingClientRect()
      const s = getComputedStyle(el)
      return {
        label,
        cls: el.className || el.tagName.toLowerCase(),
        h: Math.round(r.height * 100) / 100,
        top: Math.round(r.top * 100) / 100,
        bottom: Math.round(r.bottom * 100) / 100,
        mt: num(s.marginTop), mb: num(s.marginBottom),
        pt: num(s.paddingTop), pb: num(s.paddingBottom),
        bt: num(s.borderTopWidth), bb: num(s.borderBottomWidth),
        rowGap: num(s.rowGap),
        minH: s.minHeight, height: s.height,
        flex: s.flex, display: s.display,
        alignItems: s.alignItems, justifyContent: s.justifyContent, overflowY: s.overflowY,
      }
    }
    const q = (s) => document.querySelector(s)
    const qa = (s) => [...document.querySelectorAll(s)]

    const screen = q('.game-table-screen')
    const table = q('.game-table')
    const header = q('.table-header')
    const mid = q('.table-mid')
    const rivals = q('.rivals-zone')
    const center = q('.center-zone')
    const player = q('.player-zone')
    const midCenter = q('.mid-center')

    // Filas del stack vertical del .game-table (flex column)
    const tableChildren = table ? [...table.children].map((c, i) => box(c, `game-table>child[${i}]`)) : []

    // Panel IA más alto de la fila superior (define el alto de la fila de rivales)
    const panels = qa('.opp-panel').map(el => { const r = el.getBoundingClientRect(); return { cls: [...el.classList].find(c => c.includes('top') || c.includes('side')), h: Math.round(r.height * 100) / 100, w: Math.round(r.width * 100) / 100, top: Math.round(r.top * 100) / 100 } })
    const tallestPanel = panels.reduce((a, b) => (b.h > (a?.h ?? 0) ? b : a), null)

    // Subfilas del player-zone
    const playerChildren = player ? [...player.children].map((c, i) => box(c, `player-zone>child[${i}]`)) : []

    return {
      vp,
      mqTall: window.matchMedia('(min-width: 768px) and (min-height: 900px)').matches,
      cardW: getComputedStyle(document.documentElement).getPropertyValue('--card-w').trim(),
      dvh: window.innerHeight,
      screen: box(screen, 'screen'),
      screenScroll: { scrollH: screen.scrollHeight, clientH: screen.clientHeight, overflow: screen.scrollHeight - screen.clientHeight },
      table: box(table, 'game-table'),
      tableChildren,
      header: box(header, 'header'),
      mid: box(mid, 'table-mid'),
      midCenter: box(midCenter, 'mid-center'),
      rivals: box(rivals, 'rivals-zone'),
      center: box(center, 'center-zone(oval)'),
      player: box(player, 'player-zone'),
      playerChildren,
      panels, tallestPanel,
    }
  }, vp)
}

// ── DSK · Verificación TÁCTIL (estándar de campaña ≥40px, no WCAG) ────────────
// El veredicto valida hit-boxes REALES (::after incluido, medidos con
// elementFromPoint) contra ≥40×40 — estándar BT-L/MT-1. Los readouts NO
// interactivos (timer) se miden pero NO se validan (interactive:false).
// Emula pointer:coarse (hasTouch+isMobile) para activar el sub-bloque DSK-B2.
const TACTIL_MIN = 40

// Sonda de hit-box real: desde el centro del control, avanza 1px por eje hasta
// que elementFromPoint deja de resolver al control (su ::after cuenta como el
// propio control en hit-testing). Devuelve la caja táctil efectiva.
async function installHitProbe(page) {
  await page.evaluate(() => {
    window.__hitBox = (el) => {
      const r = el.getBoundingClientRect()
      const cx = Math.round((r.left + r.right) / 2), cy = Math.round((r.top + r.bottom) / 2)
      const hits = (x, y) => { const t = document.elementFromPoint(x, y); return !!t && (t === el || el.contains(t)) }
      if (!hits(cx, cy)) return { occluded: true, visualW: r.width, visualH: r.height }
      const scan = (dx, dy) => { let x = cx, y = cy, n = 0; while (n < 120 && hits(x + dx, y + dy)) { x += dx; y += dy; n++ } return { x, y } }
      const L = scan(-1, 0).x, R = scan(1, 0).x, T = scan(0, -1).y, B = scan(0, 1).y
      return { left: L, right: R, top: T, bottom: B, w: R - L + 1, h: B - T + 1, visualW: Math.round(r.width * 10) / 10, visualH: Math.round(r.height * 10) / 10, cx, cy }
    }
  })
}

async function runTactil(browser) {
  const TOUCH_VPS = [{ w: 1024, h: 768 }, { w: 1280, h: 720 }]
  const TABLES = [5, 4, 3, 2]   // táctil coarse en CADA mesa (mesa 2 = sin nombre-tap)
  const out = []
  for (const n of TABLES) for (const vp of TOUCH_VPS) {
    // pointer:coarse: hasTouch + isMobile fuerza a Chromium a reportar coarse.
    const page = await browser.newPage({ viewport: { width: vp.w, height: vp.h }, hasTouch: true, isMobile: true })
    await gotoMesa(page, n)
    await installProbes(page)
    await installHitProbe(page)
    const coarse = await page.evaluate(() => window.matchMedia('(pointer: coarse)').matches)
    const targets = {}

    const probe = async (label, sels) => page.evaluate(({ sels, vpH, vpW, MIN }) => {
      const acc = []
      for (const { sel, name, interactive } of sels) {
        document.querySelectorAll(sel).forEach((el, i) => {
          const hb = window.__hitBox(el)
          const inView = hb.top != null && hb.top >= 0 && hb.bottom <= vpH && hb.left >= 0 && hb.right <= vpW
          const ok = interactive === false ? true : (hb.w >= MIN && hb.h >= MIN && inView && !hb.occluded)
          acc.push({ name: name + (i ? `#${i}` : ''), text: el.textContent.trim().slice(0, 14), interactive: interactive !== false, visual: `${hb.visualW}×${hb.visualH}`, hitW: hb.w, hitH: hb.h, left: hb.left, right: hb.right, top: hb.top, bottom: hb.bottom, inView, ok })
        })
      }
      return acc
    }, { sels, vpH: vp.h, vpW: vp.w, MIN: TACTIL_MIN })

    targets.waiting = await probe('waiting', [
      { sel: '.action-area .btn-primary', name: 'Iniciar' },
      { sel: '.opp-corner-chip', name: 'ficha-IA' },   // DSK-P2: hit ≥40 en coarse
      { sel: '.utilities-trigger', name: 'utilidades' }, // DSK-U1: el ⋮ hereda el estándar
    ])
    await clickIf(page, 'button:has-text("Iniciar mano")')

    let betDone = false, discardDone = false, reached = false
    for (let i = 0; i < 220 && !reached; i++) {
      await page.waitForTimeout(300)
      await page.mouse.move(5, 5)
      if (!betDone && await page.locator('.action-buttons .btn').first().isVisible().catch(() => false)) {
        targets.bet = await probe('bet', [
          { sel: '.action-buttons .btn', name: 'accion' },
          { sel: '.btn-mult', name: 'mult' },
          { sel: '.timer-display', name: 'timer', interactive: false },
        ]); betDone = true
      }
      if (!discardDone && await page.locator('.discard-area .btn').first().isVisible().catch(() => false)) {
        targets.discard = await probe('discard', [
          { sel: '.discard-area .btn', name: 'descartar' },
          { sel: '.player-zone .card-slot-wrapper', name: 'carta' },
        ]); discardDone = true
      }
      reached = await page.locator('button:has-text("Siguiente mano")').isVisible().catch(() => false)
      if (reached) break
      await clickIf(page, '.action-buttons button:has-text("Pasar")') ||
        await clickIf(page, '.action-buttons button:has-text("Igualar")') ||
        await clickIf(page, '.action-buttons button:has-text("Apostar")')
      await clickIf(page, 'button:has-text("Sin descartar")')
    }

    targets.showdown = await probe('showdown', [
      { sel: '.opp-name-tappable', name: 'nombre-tap' },
      { sel: '.action-area .btn-primary', name: 'Siguiente' },
    ])
    // Ejercer un tap de revelado sobre el nombre (funcional)
    const revealTap = await page.evaluate(() => {
      const cand = [...document.querySelectorAll('.opp-name-tappable')].find(el => !el.closest('.opp-panel').className.includes('opp-winner'))
      if (!cand) return null
      cand.click(); return { tapped: true }
    })
    await page.waitForTimeout(300)

    // No-solape entre multiplicadores adyacentes (hit-boxes horizontales)
    const mults = (targets.bet || []).filter(t => t.name.startsWith('mult')).sort((a, b) => a.left - b.left)
    const overlaps = []
    for (let k = 0; k < mults.length - 1; k++) {
      const gap = mults[k + 1].left - mults[k].right
      if (gap < 0) overlaps.push({ pair: `${mults[k].name}↔${mults[k + 1].name}`, axis: 'H', overlapPx: -gap })
    }
    // Solape VERTICAL mult↔botón de acción (la fase de apuesta apila ambos grupos)
    const actionBtns = (targets.bet || []).filter(t => t.name.startsWith('accion'))
    for (const m of mults) for (const b of actionBtns) {
      const vGap = b.top - m.bottom       // mult arriba, botón abajo
      if (m.bottom != null && b.top != null && b.top > m.top && vGap < 0) {
        overlaps.push({ pair: `${m.name}↔${b.name}`, axis: 'V', overlapPx: -vGap })
      }
    }

    const flat = Object.entries(targets).flatMap(([ph, arr]) => arr.map(t => ({ phase: ph, ...t })))
    out.push({
      table: n, vp, coarsePointer: coarse, reachedShowdown: reached, revealTap,
      hasNameTap: (targets.showdown || []).some(t => t.name.startsWith('nombre-tap')),
      targets,
      multNoOverlap: overlaps.length === 0, overlaps,
      allInteractiveOk: flat.filter(t => t.interactive).every(t => t.ok),
      failing: flat.filter(t => t.interactive && !t.ok).map(t => `${t.phase}/${t.name} ${t.hitW}×${t.hitH}`),
    })
    await page.close()
  }
  return out
}

// ── DSK-P1 · Panel IA estático — matriz mesas 5/4/3/2 × viewports ─────────────
// Valida el ALCANCE DECLARADO de la tanda en las 4 mesas (no un subconjunto):
// reserva 12ch, nombre izq, pastillas inicial ancladas der, O1 shift-check y
// mejor-palo ausente. Mesa 2 usa la vía legacy .ai-zone/.ai-name (no OpponentPanel).
const P1_TABLES = [5, 4, 3, 2]

async function runP1(browser) {
  const out = []
  for (const n of P1_TABLES) {
    for (const vp of VIEWPORTS) {
      const page = await browser.newPage({ viewport: { width: vp.w, height: vp.h } })
      await gotoMesa(page, n)
      await installProbes(page)

      // Selectores duales: 3/4/5 → .opp-panel/.opp-name/.opp-header-anchor/.opp-score;
      // mesa 2 → .ai-zone/.ai-name/.ai-header-anchor/.score-tag.
      const measure = () => page.evaluate(() => {
        const rnd = (x) => Math.round(x * 100) / 100
        return [...document.querySelectorAll('.opp-panel, .ai-zone')].map(p => {
          const name = p.querySelector('.opp-name, .ai-name')
          const anchor = p.querySelector('.opp-header-anchor, .ai-header-anchor')
          const score = p.querySelector('.opp-score, .score-tag')
          if (!name || !anchor) return null
          const pr = p.getBoundingClientRect(), nr = name.getBoundingClientRect(), ar = anchor.getBoundingClientRect()
          const badges = [...anchor.querySelectorAll('.seat-badge')].map(b => ({ t: b.textContent.trim(), vis: getComputedStyle(b).visibility, w: rnd(b.getBoundingClientRect().width) }))
          return {
            path: p.className.includes('ai-zone') ? 'ai-zone' : 'opp-panel',
            seat: name.textContent.trim(),
            isTurn: p.className.includes('turn-active'),
            nameMinW: getComputedStyle(name).minWidth,
            nameMaxW: getComputedStyle(name).maxWidth,
            nameTextAlign: getComputedStyle(name).textAlign,
            nameW: rnd(nr.width),
            nameOffL: rnd(nr.left - pr.left),
            anchorOffR: rnd(pr.right - ar.right),
            anchorDisplay: getComputedStyle(anchor).display,
            panelW: rnd(pr.width),
            badges,
            scoreDisplay: score ? getComputedStyle(score).display : 'absent',
          }
        }).filter(Boolean)
      })

      const resting = await measure()
      await clickIf(page, 'button:has-text("Iniciar mano")')
      const frames = []
      let reached = false
      for (let i = 0; i < 120 && !reached; i++) {
        await page.waitForTimeout(200)
        await page.mouse.move(5, 5)
        frames.push(await measure())
        // early-break: en cuanto cada asiento tiene un frame con turno y otro sin
        const seats = {}
        for (const fr of frames) for (const pnl of fr) (seats[pnl.seat] ??= {})[pnl.isTurn ? 'on' : 'off'] = true
        const seatKeys = Object.keys(seats)
        if (seatKeys.length && seatKeys.every(s => seats[s].on && seats[s].off)) break
        reached = await page.locator('button:has-text("Siguiente mano")').isVisible().catch(() => false)
        if (reached) break
        await clickIf(page, '.action-buttons button:has-text("Pasar")') ||
          await clickIf(page, '.action-buttons button:has-text("Igualar")') ||
          await clickIf(page, '.action-buttons button:has-text("Apostar")')
        await clickIf(page, 'button:has-text("Sin descartar")')
      }

      const bySeat = {}
      for (const fr of frames) for (const pnl of fr) {
        (bySeat[pnl.seat] ??= { on: [], off: [] })[pnl.isTurn ? 'on' : 'off'].push(pnl)
      }
      const shift = []
      for (const [seat, g] of Object.entries(bySeat)) {
        if (!g.on.length || !g.off.length) continue
        const on = g.on[0], off = g.off[0]
        shift.push({
          seat,
          dNameOffL: Math.round((on.nameOffL - off.nameOffL) * 100) / 100,
          dAnchorOffR: Math.round((on.anchorOffR - off.anchorOffR) * 100) / 100,
          dNameW: Math.round((on.nameW - off.nameW) * 100) / 100,
          dPanelW: Math.round((on.panelW - off.panelW) * 100) / 100,
        })
      }
      const noShift = shift.length > 0 && shift.every(s => Math.abs(s.dNameOffL) < 0.6 && Math.abs(s.dAnchorOffR) < 0.6 && Math.abs(s.dNameW) < 0.6 && Math.abs(s.dPanelW) < 0.6)

      const sample = resting[0] || (frames.find(f => f.length) || [])[0]
      const allBadgesLetters = frames.concat([resting]).flat().every(p => p.badges.every(b => b.t.length <= 1 || b.t === ''))
      const scoreHidden = resting.every(p => p.scoreDisplay === 'none')

      out.push({ table: n, vp, path: sample?.path, resting, sampleMinW: sample?.nameMinW, sampleMaxW: sample?.nameMaxW, sampleAnchorDisplay: sample?.anchorDisplay, sampleTextAlign: sample?.nameTextAlign, allBadgesLetters, scoreHidden, shift, noShift, capturedTurnStates: shift.length })
      await page.close()
    }
  }
  return out
}

// ── DSK-P2 · Panel IA interactivo (cornerChip) — matriz 5/4/3/2 × viewports ──
// Ficha inferior-izq, saldo oculto/revelado con autocierre 3s, palabra de estado
// en la franja (cede el renglón al saldo), O1 en todo el ciclo, peor caso 7 díg.
const P2_TABLES = [5, 4, 3, 2]

async function runP2(browser) {
  const out = []
  for (const n of P2_TABLES) for (const vp of VIEWPORTS) {
    const page = await browser.newPage({ viewport: { width: vp.w, height: vp.h } })
    await gotoMesa(page, n)
    await installProbes(page)

    // measure de todos los paneles IA (dual .opp-panel/.ai-zone)
    const measure = () => page.evaluate(() => {
      const rnd = x => Math.round(x * 100) / 100
      const R = e => { if (!e) return null; const b = e.getBoundingClientRect(); return { x: rnd(b.x), y: rnd(b.y), w: rnd(b.width), h: rnd(b.height), left: rnd(b.left), right: rnd(b.right), top: rnd(b.top), bottom: rnd(b.bottom) } }
      const screen = document.querySelector('.game-table-screen')
      return {
        overflow: screen.scrollHeight - screen.clientHeight,
        panels: [...document.querySelectorAll('.opp-panel, .ai-zone')].map(p => {
          const chip = p.querySelector('.opp-corner-chip')
          const float = p.querySelector('.chip-balance-float')
          const status = p.querySelector('.opp-status')
          const name = p.querySelector('.opp-name, .ai-name')
          const anchor = p.querySelector('.opp-header-anchor, .ai-header-anchor')
          const fichas = [...p.querySelectorAll('*')].some(e => e.children.length === 0 && /\bfichas\b/.test(e.textContent))
          return {
            seat: name?.textContent.trim(),
            chip: R(chip), chipPresent: !!chip,
            float: R(float), floatPresent: !!float, floatText: float?.textContent,
            status: R(status), statusVis: status ? getComputedStyle(status).visibility : null,
            panel: R(p), name: R(name), anchor: R(anchor),
            fichas,
          }
        }),
      }
    })

    await clickIf(page, 'button:has-text("Iniciar mano")')
    for (let i = 0; i < 6; i++) { await page.waitForTimeout(500); await page.mouse.move(5, 5); if (await page.locator('button:has-text("Siguiente mano")').isVisible().catch(() => false)) break; await clickIf(page, '.action-buttons button:has-text("Pasar")') || await clickIf(page, '.action-buttons button:has-text("Igualar")') }
    await page.mouse.move(5, 5); await page.waitForTimeout(300)

    const resting = await measure()   // ficha cerrada

    // ── Ciclo interactivo: tap → abierto → autocierre 3000ms → cerrado ──
    await page.evaluate(() => document.querySelector('.opp-panel .opp-corner-chip, .ai-zone .opp-corner-chip')?.click())
    await page.waitForTimeout(250)
    const opened = await measure()    // saldo visible, palabra oculta

    // peor caso 7 dígitos: inyectar en el float abierto y medir
    const worst = await page.evaluate(() => {
      const f = document.querySelector('.chip-balance-float'); if (!f) return null
      f.textContent = '9999999'
      const p = f.closest('.opp-panel, .ai-zone')
      const fb = f.getBoundingClientRect(), pb = p.getBoundingClientRect(), cb = p.querySelector('.opp-cards, .cards-row').getBoundingClientRect()
      return { floatRight: Math.round(fb.right), panelRight: Math.round(pb.right), fitsInPanel: fb.right <= pb.right + 1, cardsBottom: Math.round(cb.bottom) }
    })

    await page.waitForTimeout(3200)   // esperar autocierre (CHIP_TOGGLE_MS=3000)
    const closed = await measure()    // saldo oculto, palabra de vuelta

    // ── Análisis ──
    const restP = resting.panels
    const chipOk = restP.every(p => p.chipPresent && p.chip && (p.chip.left - p.panel.left) < 40 && (p.panel.bottom - p.chip.bottom) < 40) // esquina inferior izq
    const saldoHiddenResting = restP.every(p => !p.floatPresent)  // sin float en resting
    const fichasAbsent = restP.every(p => !p.fichas)
    const tapped = opened.panels.find(p => p.floatPresent)
    const tappedSeat = tapped?.seat
    const cyc = {
      openHasFloat: !!tapped,
      openStatusHidden: tapped?.statusVis === 'hidden',
      closedNoFloat: !closed.panels.find(p => p.seat === tappedSeat)?.floatPresent,
      closedStatusVisible: closed.panels.find(p => p.seat === tappedSeat)?.statusVis === 'visible',
    }
    // O1 shift a lo largo del ciclo: panel/name/anchor/status del asiento tocado + vecinos
    const key = (m, s) => m.panels.find(p => p.seat === s)
    const deltas = []
    for (const s of restP.map(p => p.seat)) {
      const a = key(resting, s), b = key(opened, s), c = key(closed, s)
      if (!a || !b || !c) continue
      const d = (f) => Math.max(Math.abs((b[f]?.x ?? 0) - (a[f]?.x ?? 0)), Math.abs((b[f]?.y ?? 0) - (a[f]?.y ?? 0)), Math.abs((c[f]?.x ?? 0) - (a[f]?.x ?? 0)), Math.abs((c[f]?.y ?? 0) - (a[f]?.y ?? 0)), Math.abs((b[f]?.w ?? 0) - (a[f]?.w ?? 0)), Math.abs((c[f]?.w ?? 0) - (a[f]?.w ?? 0)))
      deltas.push({ seat: s, dPanel: Math.round(d('panel') * 100) / 100, dName: Math.round(d('name') * 100) / 100, dAnchor: Math.round(d('anchor') * 100) / 100, dStatusBox: Math.round(d('status') * 100) / 100 })
    }
    const noShift = deltas.every(x => x.dPanel < 0.6 && x.dName < 0.6 && x.dAnchor < 0.6 && x.dStatusBox < 0.6)

    out.push({
      table: n, vp,
      chipOk, saldoHiddenResting, fichasAbsent,
      cycle: cyc, cycleOk: cyc.openHasFloat && cyc.openStatusHidden && cyc.closedNoFloat && cyc.closedStatusVisible,
      worst7: worst, worst7Ok: !!worst && worst.fitsInPanel,
      noShift, deltas,
      overflow: resting.overflow, overflowOk: resting.overflow <= 0 && opened.overflow <= 0,
      tappedSeat,
    })
    await page.close()
  }
  return out
}

// ── DSK-R1 · Revelación de finalistas sin layout shift — mesas 5/4/3 × vps ────
// Por cada IA finalista revela su mano y comprueba: (1) el ancho de FLUJO de
// .opp-cards no infla (ML negativo de reposo, scale 1.2 conservado como transform),
// (2) Δ=0 en óvalo, área humana y CADA panel a lo largo del ciclo, (3) las cartas
// reveladas resuelven POR ENCIMA (elementFromPoint sobre las zonas de solape con
// óvalo/vecinos → devuelve la carta del ganador), (4) al volver al ganador original
// la geometría es idéntica. Mesa 2 fuera de alcance (usa .ai-zone, no .opp-winner).
const R1_TABLES = [5, 4, 3]

const bboxDelta = (a, b) => {
  if (!a || !b) return 0
  return Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y), Math.abs(a.w - b.w), Math.abs(a.h - b.h))
}
// Δ máx de los anclajes fijos (óvalo, humano) + CADA panel, contra una baseline.
// R2c: el ÁREA TOTAL de juego (.game-table) y su pantalla entran como anclas —
// el saltito de la barra de scroll movía el área entera, no un panel suelto.
const anchorDelta = (m, base) => {
  const d = [bboxDelta(m.oval, base.oval), bboxDelta(m.human, base.human), bboxDelta(m.humanBar, base.humanBar),
    bboxDelta(m.area, base.area), bboxDelta(m.screen, base.screen)]
  for (const bp of base.panels) {
    const cp = m.panels.find(p => p.seat === bp.seat)
    if (cp) d.push(bboxDelta(cp.panel, bp.panel))
  }
  return Math.max(...d)
}

async function measureR1(page) {
  return page.evaluate(() => {
    const rnd = x => x == null ? null : Math.round(x * 100) / 100
    const R = e => { if (!e) return null; const b = e.getBoundingClientRect(); return { x: rnd(b.x), y: rnd(b.y), w: rnd(b.width), h: rnd(b.height), left: rnd(b.left), right: rnd(b.right), top: rnd(b.top), bottom: rnd(b.bottom) } }
    const screen = document.querySelector('.game-table-screen')
    const q = s => document.querySelector(s)
    return {
      overflow: screen ? screen.scrollHeight - screen.clientHeight : null,
      oval: R(q('.center-zone')),
      human: R(q('.player-zone')),
      humanBar: R(q('.player-bar')),
      area: R(q('.game-table')),          // R2c · contenedor TOTAL del juego
      screen: R(screen),
      scroll: window.__scrollMetrics ? window.__scrollMetrics() : null,
      panels: [...document.querySelectorAll('.opp-panel')].map(p => {
        const cards = p.querySelector('.opp-cards')
        const slot = p.querySelector('.opp-card-slot:not(:first-child)')
        const anySlot = p.querySelector('.opp-card-slot')
        return {
          seat: p.querySelector('.opp-name')?.textContent.trim(),
          pos: [...p.classList].find(c => c.startsWith('opp-') && (c.includes('top') || c.includes('side'))),
          winner: p.className.includes('opp-winner'),
          panel: R(p),
          cards: R(cards),
          cardsW: cards ? rnd(cards.getBoundingClientRect().width) : null,
          slotML: slot ? getComputedStyle(slot).marginLeft : null,
          slotTransform: anySlot ? getComputedStyle(anySlot).transform : null,
          opacity: getComputedStyle(p).opacity,
          chip: R(p.querySelector('.win-score-chip')),
          chipPos: p.querySelector('.win-score-chip') ? getComputedStyle(p.querySelector('.win-score-chip')).position : null,
          roleBadges: [...p.querySelectorAll('.opp-header-anchor .seat-badge')].filter(x => getComputedStyle(x).visibility !== 'hidden').map(x => ({ t: x.textContent.trim(), r: R(x) })),
        }
      }),
    }
  })
}

// Solape rectangular (px²>0) entre dos cajas — para verificar que la pastilla de
// puntaje flotada no pisa un badge de rol visible.
const rectOverlap = (a, b) => {
  if (!a || !b) return 0
  const ox = Math.min(a.right, b.right) - Math.max(a.left, b.left)
  const oy = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top)
  return ox > 0 && oy > 0 ? Math.round(ox * oy) : 0
}

// Sonda de apilamiento: para el panel revelado, halla las zonas donde sus cartas
// (bbox con transform) solapan al óvalo o a otros paneles y verifica que
// elementFromPoint, en puntos que caen sobre una carta revelada, resuelve DENTRO
// del panel ganador (la carta pinta por encima). Sólo cuenta puntos que además
// caen sobre el elemento de abajo → prueba real de oclusión.
async function stackR1(page) {
  return page.evaluate(() => {
    const win = document.querySelector('.opp-panel.opp-winner')
    if (!win) return []
    const slots = [...win.querySelectorAll('.opp-card-slot')]
    if (!slots.length) return []
    const union = slots.reduce((a, s) => { const r = s.getBoundingClientRect(); return { left: Math.min(a.left, r.left), top: Math.min(a.top, r.top), right: Math.max(a.right, r.right), bottom: Math.max(a.bottom, r.bottom) } }, { left: Infinity, top: Infinity, right: -Infinity, bottom: -Infinity })
    const others = [...document.querySelectorAll('.center-zone, .opp-panel')].filter(el => el !== win && !win.contains(el) && !el.contains(win))
    const overCard = (px, py) => slots.some(s => { const r = s.getBoundingClientRect(); return px >= r.left && px <= r.right && py >= r.top && py <= r.bottom })
    const tests = []
    for (const other of others) {
      const o = other.getBoundingClientRect()
      const ix = Math.max(union.left, o.left), iy = Math.max(union.top, o.top)
      const ax = Math.min(union.right, o.right), ay = Math.min(union.bottom, o.bottom)
      if (ax - ix <= 2 || ay - iy <= 2) continue     // sin solape geométrico real
      const label = [...other.classList].find(c => c.includes('opp-top') || c.includes('opp-side') || c.includes('center-zone')) || other.className
      let tested = 0, resolvedWinner = 0, firstOther = null
      for (let gx = 0.15; gx <= 0.85; gx += 0.175) for (let gy = 0.15; gy <= 0.85; gy += 0.175) {
        const px = Math.round(ix + (ax - ix) * gx), py = Math.round(iy + (ay - iy) * gy)
        if (!overCard(px, py)) continue
        const el = document.elementFromPoint(px, py)
        tested++
        if (el && win.contains(el)) resolvedWinner++
        else if (!firstOther) firstOther = el ? (el.className || el.tagName) : 'null'
      }
      if (tested > 0) tests.push({ target: label, tested, resolvedWinner, resolvesToWinner: resolvedWinner === tested, firstOther })
    }
    // Solape INTRA-panel (aceptado por doctrina R1): cada carta pisa a la anterior
    // (−0.35). En la banda de solape, elementFromPoint debe resolver a la carta de
    // ARRIBA (slot posterior en el DOM), nunca a la de abajo → apilamiento correcto.
    for (let k = 1; k < slots.length; k++) {
      const prev = slots[k - 1].getBoundingClientRect(), cur = slots[k].getBoundingClientRect()
      const bx = Math.max(cur.left, prev.left), ex = Math.min(cur.right, prev.right)
      if (ex - bx <= 2) continue
      const px = Math.round((bx + Math.min(ex, cur.left + (cur.width * 0.4))) / 2)
      const py = Math.round((Math.max(cur.top, prev.top) + Math.min(cur.bottom, prev.bottom)) / 2)
      const el = document.elementFromPoint(px, py)
      const top = slots[k].contains(el), ok = !!el && (top || slots[k] === el.closest('.opp-card-slot'))
      tests.push({ target: `intra:${k - 1}<${k}`, tested: 1, resolvedWinner: ok ? 1 : 0, resolvesToWinner: ok, firstOther: ok ? null : (el ? (el.className || el.tagName) : 'null') })
    }
    return tests
  })
}

async function tapNameBySeat(page, seat) {
  await page.evaluate((seat) => {
    const el = [...document.querySelectorAll('.opp-name-tappable')].find(e => e.textContent.trim() === seat)
    if (el) el.click()
  }, seat)
}

async function runR1(browser) {
  const out = []
  const tblFilter = process.argv[3] ? Number(process.argv[3]) : null
  const vpFilter = process.argv[4] || null
  for (const n of R1_TABLES) for (const vp of VIEWPORTS) {
    if (tblFilter && n !== tblFilter) continue
    if (vpFilter && `${vp.w}x${vp.h}` !== vpFilter) continue
    const page = await browser.newPage({ viewport: { width: vp.w, height: vp.h } })
    await gotoMesa(page, n)
    await installProbes(page)

    // Llegar a un showdown con nombres revelables (reintenta manos si hace falta)
    let ok = false
    for (let attempt = 0; attempt < 6 && !ok; attempt++) {
      await playToShowdown(page)
      ok = await page.locator('.opp-name-tappable').count() > 0
      if (!ok) { await clickIf(page, 'button:has-text("Siguiente mano")'); await page.waitForTimeout(1600) }
    }
    await page.mouse.move(5, 5); await page.waitForTimeout(250)

    const tappableSeats = await page.evaluate(() => [...document.querySelectorAll('.opp-name-tappable')].map(el => el.textContent.trim()))
    const baseline = await measureR1(page)
    const baselineWinner = baseline.panels.find(p => p.winner)?.seat

    // Ciclo de revelación por cada finalista + stacking en cada estado
    const frames = [{ seat: baselineWinner, m: baseline, stack: await stackR1(page) }]
    for (const seat of tappableSeats) {
      if (seat === baselineWinner) continue
      await tapNameBySeat(page, seat)
      await page.waitForTimeout(450); await page.mouse.move(5, 5)
      frames.push({ seat, m: await measureR1(page), stack: await stackR1(page) })
    }

    // A · Inflación eliminada: el slot del ganador conserva el ML negativo de reposo
    // y su .opp-cards mide igual que la de un panel NO revelado (mismo flujo). Se
    // evalúa contra el PRIMER frame con ganador real (la baseline puede no tener el
    // reveal por defecto asentado aún → robustez de medición, no de CSS).
    const wFrame = frames.find(f => f.m.panels.some(p => p.winner)) || { m: baseline }
    const winnerP = wFrame.m.panels.find(p => p.winner)
    const nonWinner = wFrame.m.panels.find(p => !p.winner && p.cards)
    const inflationGone = !!winnerP && parseFloat(winnerP.slotML) < 0 &&
      (!nonWinner || Math.abs(winnerP.cardsW - nonWinner.cardsW) < 1)
    const scaleKept = !!winnerP && winnerP.slotTransform && winnerP.slotTransform !== 'none'
    // Cerrar: volver al ganador original → debe restaurar la geometría exacta
    await tapNameBySeat(page, baselineWinner)
    await page.waitForTimeout(450); await page.mouse.move(5, 5)
    const restored = await measureR1(page)

    const maxAnchorShift = Math.max(...frames.map(f => anchorDelta(f.m, baseline)))
    const restoreShift = anchorDelta(restored, baseline)

    // Desglose del peor frame: qué ancla se movió y cuánto (diagnóstico).
    const worst = frames.reduce((a, f) => anchorDelta(f.m, baseline) > anchorDelta(a.m, baseline) ? f : a, frames[0])
    const ovDelta = (a, b) => a && b ? { dx: Math.round((a.x - b.x) * 100) / 100, dy: Math.round((a.y - b.y) * 100) / 100, dw: Math.round((a.w - b.w) * 100) / 100, dh: Math.round((a.h - b.h) * 100) / 100 } : null
    const wWin = worst.m.panels.find(p => p.winner)
    const breakdown = { seat: worst.seat, ovalXYWH: ovDelta(worst.m.oval, baseline.oval), human: bboxDelta(worst.m.human, baseline.human), humanBar: bboxDelta(worst.m.humanBar, baseline.humanBar), winnerCardsW: wWin?.cardsW, winnerSlotML: wWin?.slotML, winnerPanelW: wWin?.panel?.w, panels: [] }
    for (const bp of baseline.panels) {
      const cp = worst.m.panels.find(p => p.seat === bp.seat)
      if (cp) breakdown.panels.push({ seat: bp.seat, winnerBase: bp.winner, winnerNow: cp.winner, d: bboxDelta(cp.panel, bp.panel), baseW: bp.panel?.w, nowW: cp.panel?.w, baseX: bp.panel?.x, nowX: cp.panel?.x, baseCardsW: bp.cardsW, nowCardsW: cp.cardsW })
    }
    const stackTests = frames.flatMap(f => f.stack.map(s => ({ seat: f.seat, ...s })))
    const overlapsFound = stackTests.length
    const stackAllOk = stackTests.every(s => s.resolvesToWinner)
    const winnerOpacityOk = frames.every(f => { const w = f.m.panels.find(p => p.winner); return !w || parseFloat(w.opacity) === 1 })
    // La pastilla flotada no debe pisar un badge de rol visible (M/P) en ningún estado.
    const chipRoleOverlaps = []
    for (const f of frames) {
      const w = f.m.panels.find(p => p.winner)
      if (!w || !w.chip) continue
      for (const rb of (w.roleBadges || [])) {
        const ov = rectOverlap(w.chip, rb.r)
        if (ov > 4) chipRoleOverlaps.push({ seat: f.seat, badge: rb.t, ovPx2: ov })
      }
    }
    // Pastilla fuera de flujo (out-of-flow) en TODO estado revelado: requisito duro
    // (garantiza Δ=0). El solape con el badge Pie es ACEPTADO (~5px, decisión de
    // Victor) — se reporta y se acota a un mordisco menor (no una cobertura total).
    const chipOutOfFlow = frames.every(f => { const w = f.m.panels.find(p => p.winner); return !w || w.chipPos == null || w.chipPos === 'absolute' })
    const chipNickMaxPx2 = chipRoleOverlaps.reduce((a, o) => Math.max(a, o.ovPx2), 0)
    const chipFloatOk = chipOutOfFlow && chipNickMaxPx2 < 200   // <200px² = mordisco de esquina, no cobertura
    const winnersSeen = frames.map(f => f.m.panels.find(p => p.winner)?.seat).filter(Boolean)

    out.push({
      table: n, vp, tappableSeats, baselineWinner,
      inflationGone, scaleKept,
      winnerSlotML: winnerP?.slotML, winnerCardsW: winnerP?.cardsW, nonWinnerCardsW: nonWinner?.cardsW, winnerSlotTransform: winnerP?.slotTransform,
      maxAnchorShift: Math.round(maxAnchorShift * 100) / 100, noShift: maxAnchorShift < 0.6,
      restoreShift: Math.round(restoreShift * 100) / 100, restoredOk: restoreShift < 0.6,
      overlapsFound, stackAllOk, winnerOpacityOk,
      chipFloatOk, chipOutOfFlow, chipNickMaxPx2, chipRoleOverlaps, winnersSeen,
      breakdown,
      stackDetail: frames.map(f => ({ seat: f.seat, overlaps: f.stack })),
      overflow: baseline.overflow, overflowOk: (baseline.overflow ?? 0) <= 0,
      passed: inflationGone && scaleKept && maxAnchorShift < 0.6 && restoreShift < 0.6 && stackAllOk && winnerOpacityOk && chipFloatOk && (baseline.overflow ?? 0) <= 0,
    })
    await page.close()
  }
  return out
}

// ── DSK-R2 · Coreografía del curiosear — mesas 5/4/3 × vps ────────────────────
// Verifica que el canje de manos en showdown corre la secuencia de 4 fases
// (closing→collect→grow→open, NO instantáneo), con: tiempos idénticos a móvil
// (vars --reveal-* + duraciones computadas, número contra número), Δ=0 en frames
// INTERMEDIOS de la animación (transforms no refluyen), estado final = R1
// (ganador=to, pastilla flotada, sin inflar) e interrupciones sin zombis
// (tap repetido bloqueado; cierre a mitad limpia clases y timers). Mesa 2 fuera.
const R2_TABLES = [5, 4, 3]

// DSK-R2b · Mide el DESPLIEGUE de las cartas reveladas (reposo revelado): gap
// borde a borde entre cartas consecutivas (mirror del móvil), centrado del abanico
// respecto al panel, y si la pastilla flotada pisa alguna carta en el nuevo ancho
// visual. Todo sobre bboxes CON transform (getBoundingClientRect ya los incluye).
async function measureSpread(page) {
  return page.evaluate(() => {
    const rnd = x => x == null ? null : Math.round(x * 100) / 100
    const win = [...document.querySelectorAll('.opp-panel')].find(p => p.className.includes('opp-winner'))
    if (!win) return { err: 'no-winner' }
    const panel = win.getBoundingClientRect()
    const cards = [...win.querySelectorAll('.opp-card-slot .playing-card')].map(c => c.getBoundingClientRect())
    if (cards.length < 2) return { err: 'few-cards', n: cards.length }
    const gaps = []
    for (let i = 1; i < cards.length; i++) gaps.push(rnd(cards[i].left - cards[i - 1].right))
    const fanLeft = Math.min(...cards.map(c => c.left)), fanRight = Math.max(...cards.map(c => c.right))
    const chipEl = win.querySelector('.win-score-chip')
    const chip = chipEl ? chipEl.getBoundingClientRect() : null
    const chipVisible = chipEl ? getComputedStyle(chipEl).visibility !== 'hidden' : false
    const chipOverCard = chip && chipVisible
      ? cards.some(c => !(chip.right <= c.left || chip.left >= c.right || chip.bottom <= c.top || chip.top >= c.bottom))
      : false
    return {
      n: cards.length,
      gaps,
      minGap: rnd(Math.min(...gaps)),
      avgGap: rnd(gaps.reduce((a, x) => a + x, 0) / gaps.length),
      cardW: rnd(cards[0].width),
      fanCenterOffset: rnd((fanLeft + fanRight) / 2 - (panel.left + panel.right) / 2), // >0 = abanico a la derecha del centro del panel
      leftOverhang: rnd(panel.left - fanLeft),
      rightOverhang: rnd(fanRight - panel.right),
      chipVisible, chipOverCard,
    }
  })
}

// DSK-R2c · Confinamiento: margen de la carta EXTREMA respecto al perímetro del
// área total de juego (.game-table), por lado. >0 = dentro (bien); <0 = la carta
// se pinta FUERA del tapete. Se mide el bbox CON transform de todas las cartas
// del panel revelado y se compara con el border-box del área. Se reporta también
// el margen contra la pantalla (.game-table-screen): si ese se agota por la
// derecha nace la barra horizontal → el saltito de 15px.
async function measureConfine(page) {
  return page.evaluate(() => {
    const rnd = x => x == null ? null : Math.round(x * 100) / 100
    const win = [...document.querySelectorAll('.opp-panel')].find(p => p.className.includes('opp-winner'))
    if (!win) return { err: 'no-winner' }
    const areaEl = document.querySelector('.game-table')
    const scrEl = document.querySelector('.game-table-screen')
    if (!areaEl) return { err: 'no-area' }
    const a = areaEl.getBoundingClientRect(), s = scrEl.getBoundingClientRect()
    const cards = [...win.querySelectorAll('.opp-card-slot .playing-card')].map(c => c.getBoundingClientRect())
    if (!cards.length) return { err: 'no-cards' }
    const L = Math.min(...cards.map(c => c.left)), R = Math.max(...cards.map(c => c.right))
    const T = Math.min(...cards.map(c => c.top)), B = Math.max(...cards.map(c => c.bottom))
    const m = { left: rnd(L - a.left), right: rnd(a.right - R), top: rnd(T - a.top), bottom: rnd(a.bottom - B) }
    return {
      seat: win.querySelector('.opp-name')?.textContent.trim(),
      pos: [...win.classList].find(c => c.startsWith('opp-') && (c.includes('top') || c.includes('side'))),
      margins: m,
      worst: rnd(Math.min(m.left, m.right, m.top, m.bottom)),
      inside: Math.min(m.left, m.right, m.top, m.bottom) >= 0,
      screenMargins: { left: rnd(L - s.left), right: rnd(s.right - R) },
      fanW: rnd(R - L),
    }
  })
}

// R2c · ¿se movió el scroll (documento o scroller) en algún frame del ciclo?
// Devuelve la métrica que más varió respecto al primer frame. barH/barV saltando
// de 0 a 15 = barra que aparece → el área centrada da el saltito.
const scrollDelta = (samples) => {
  const first = samples.map(s => s.scroll).find(Boolean)
  if (!first) return { max: 0, key: null }
  let max = 0, key = null, from = null, to = null
  for (const s of samples) {
    if (!s.scroll) continue
    for (const k of Object.keys(first)) {
      const d = Math.abs(s.scroll[k] - first[k])
      if (d > max) { max = d; key = k; from = first[k]; to = s.scroll[k] }
    }
  }
  return { max, key, from, to }
}

// Mide las vars de tiempo + duraciones computadas de las clases de fase en el
// contexto actual (para comparar desktop↔móvil, número contra número).
async function measureChoreoTimings(page) {
  return page.evaluate(() => {
    const panel = document.querySelector('.opp-panel')
    const csv = panel ? getComputedStyle(panel) : null
    const v = k => csv ? csv.getPropertyValue(k).trim() : null
    const cc = document.querySelector('.opp-reveal-closing .opp-card-slot .playing-card')
    const cs = document.querySelector('.opp-reveal-collect .opp-card-slot')
    const oc = document.querySelector('.opp-reveal-open .opp-card-slot .playing-card')
    const g = e => e ? getComputedStyle(e) : null
    return {
      vars: { flip: v('--reveal-flip-ms'), stagger: v('--reveal-stagger-ms'), scale: v('--reveal-scale-ms'), settle: v('--reveal-settle-ms') },
      closing: cc ? { name: g(cc).animationName, dur: g(cc).animationDuration } : null,
      collect: cs ? { prop: g(cs).transitionProperty, dur: g(cs).transitionDuration } : null,
      open: oc ? { name: g(oc).animationName, dur: g(oc).animationDuration } : null,
    }
  })
}

// Snapshot ligero durante la animación: fase(s) activas + geometría de anclas +
// duraciones vivas de las clases de fase presentes en ese frame.
async function sampleChoreoFrame(page) {
  return page.evaluate(() => {
    const rnd = x => x == null ? null : Math.round(x * 100) / 100
    const R = e => { if (!e) return null; const b = e.getBoundingClientRect(); return { x: rnd(b.x), y: rnd(b.y), w: rnd(b.width), h: rnd(b.height) } }
    const q = s => document.querySelector(s)
    const phases = [...document.querySelectorAll('[class*="opp-reveal-"]')].map(p => [...p.classList].find(c => c.startsWith('opp-reveal-'))).filter(Boolean)
    const cc = q('.opp-reveal-closing .opp-card-slot .playing-card')
    const cs = q('.opp-reveal-collect .opp-card-slot')
    const oc = q('.opp-reveal-open .opp-card-slot .playing-card')
    const g = e => e ? getComputedStyle(e) : null
    return {
      phases,
      oval: R(q('.center-zone')), human: R(q('.player-zone')), humanBar: R(q('.player-bar')),
      area: R(q('.game-table')), screen: R(q('.game-table-screen')),
      scroll: window.__scrollMetrics ? window.__scrollMetrics() : null,
      panels: [...document.querySelectorAll('.opp-panel')].map(p => ({ seat: p.querySelector('.opp-name')?.textContent.trim(), winner: p.className.includes('opp-winner'), panel: R(p) })),
      closingAnim: cc ? { name: g(cc).animationName, dur: g(cc).animationDuration } : null,
      collectTrans: cs ? { prop: g(cs).transitionProperty, dur: g(cs).transitionDuration } : null,
      openAnim: oc ? { name: g(oc).animationName, dur: g(oc).animationDuration } : null,
    }
  })
}

// Un swap de curiosear EXIGE ≥2 finalistas revelables (un 'from' y un 'to'
// distintos); si una IA se retira puede quedar sólo 1 → se reintenta la mano.
async function reachShowdownTappable(page, minTap = 2, maxHands = 12) {
  let ok = false
  for (let a = 0; a < maxHands && !ok; a++) {
    await playToShowdown(page)
    ok = await page.locator('.opp-name-tappable').count() >= minTap
    if (!ok) { await clickIf(page, 'button:has-text("Siguiente mano")'); await page.waitForTimeout(1600) }
  }
  await page.mouse.move(5, 5); await page.waitForTimeout(250)
  return ok
}

async function runR2(browser) {
  const out = []
  const tblFilter = process.argv[3] ? Number(process.argv[3]) : null
  const vpFilter = process.argv[4] || null

  // Referencia MÓVIL (640×360 landscape, mesa 5): tiempos nativos de la coreografía.
  let mobileRef = null
  {
    const mp = await browser.newPage({ viewport: { width: 640, height: 360 } })
    await gotoMesa(mp, 5); await installProbes(mp)
    if (await reachShowdownTappable(mp)) {
      const wn = () => mp.evaluate(() => ({ win: [...document.querySelectorAll('.opp-panel')].find(p => p.className.includes('opp-winner'))?.querySelector('.opp-name')?.textContent.trim(), taps: [...document.querySelectorAll('.opp-name-tappable')].map(e => e.textContent.trim()) }))
      let seats = await wn()
      if (!seats.win) { await tapNameBySeat(mp, seats.taps[0]); await mp.waitForTimeout(1200); await mp.mouse.move(5, 5); seats = await wn() }   // prime si ganó el humano → from≠0 (captura closing)
      const to = seats.taps.find(s => s !== seats.win) || seats.taps[0]
      await tapNameBySeat(mp, to)
      // muestrear hasta atrapar las fases con animación viva
      for (let i = 0; i < 24 && !(mobileRef && mobileRef.closing && mobileRef.open); i++) {
        const t = await measureChoreoTimings(mp)
        mobileRef = { vars: t.vars, closing: t.closing || mobileRef?.closing, collect: t.collect || mobileRef?.collect, open: t.open || mobileRef?.open }
        await mp.waitForTimeout(40)
      }
      // Gap de despliegue de referencia: móvil ya en reposo revelado tras el swap.
      await mp.waitForTimeout(400); await mp.mouse.move(5, 5)
      if (mobileRef) mobileRef.spread = await measureSpread(mp)
    }
    await mp.close()
  }

  for (const n of R2_TABLES) for (const vp of VIEWPORTS) {
    if (tblFilter && n !== tblFilter) continue
    if (vpFilter && `${vp.w}x${vp.h}` !== vpFilter) continue
    const page = await browser.newPage({ viewport: { width: vp.w, height: vp.h } })
    await gotoMesa(page, n); await installProbes(page)
    if (!await reachShowdownTappable(page)) { out.push({ table: n, vp, err: 'no showdown tappable' }); await page.close(); continue }

    const winName = () => page.evaluate(() => ({ win: [...document.querySelectorAll('.opp-panel')].find(p => p.className.includes('opp-winner'))?.querySelector('.opp-name')?.textContent.trim(), taps: [...document.querySelectorAll('.opp-name-tappable')].map(e => e.textContent.trim()) }))
    let seats = await winName()
    // Si ganó el HUMANO (seat 0) no hay .opp-panel.opp-winner → un tap correría
    // sólo grow+open (el driver salta closing/collect con from===0). Para ejercer
    // SIEMPRE la secuencia completa, se PRIMA revelando una IA primero (deja que
    // termine su grow+open) → 'from' pasa a ser una IA y el swap medido corre las 4.
    if (!seats.win) {
      await tapNameBySeat(page, seats.taps[0])
      await page.waitForTimeout(1200); await page.mouse.move(5, 5)
      seats = await winName()
    }
    const baseline = await measureR1(page)
    const toSeat = seats.taps.find(s => s !== seats.win) || seats.taps[0]

    // ── Coreografía completa: disparar tap y muestrear rápido ──
    const samples = []
    await tapNameBySeat(page, toSeat)
    for (let i = 0; i < 30; i++) { samples.push(await sampleChoreoFrame(page)); await page.waitForTimeout(45) }
    await page.waitForTimeout(400); await page.mouse.move(5, 5)
    const end = await measureR1(page)
    // DSK-R2b · Despliegue en reposo revelado (estado final del swap): cartas sin
    // solape (gap>0), gap ≈ móvil (número contra número), abanico centrado en el
    // panel, pastilla flotada sin pisar carta. Δ=0 lo cubre endShift (más abajo).
    const spread = await measureSpread(page)
    const mobGap = mobileRef?.spread?.avgGap
    const gapPositive = !!spread && !spread.err && spread.minGap > 0
    const gapMatchMobile = mobGap == null || (spread && !spread.err && Math.abs(spread.avgGap - mobGap) <= 1.5)
    // R2c · el centrado en el panel ya NO es criterio para asientos LATERALES:
    // ahí el conjunto se ancla hacia dentro a propósito (confinamiento). Para el
    // resto (top-*) se mantiene tal cual — su abanico sigue simétrico.
    const endPos = end.panels.find(p => p.winner)?.pos || ''
    const lateralSeat = /opp-side-(left|right)/.test(endPos)
    const fanCentered = lateralSeat ? null : (!!spread && !spread.err && Math.abs(spread.fanCenterOffset) <= 4)
    const chipClear = !!spread && !spread.err && !spread.chipOverCard

    // Fases observadas (orden de 1ª aparición) → prueba que NO es instantáneo
    const phaseOrder = []
    for (const s of samples) for (const ph of s.phases) if (!phaseOrder.includes(ph)) phaseOrder.push(ph)
    const choreoRan = phaseOrder.length > 0
    const sawAllPhases = ['opp-reveal-closing', 'opp-reveal-collect', 'opp-reveal-grow', 'opp-reveal-open'].every(p => phaseOrder.includes(p))

    // Δ=0 en frames INTERMEDIOS (mientras hay alguna fase activa)
    const midFrames = samples.filter(s => s.phases.length > 0)
    const midShift = midFrames.length ? Math.max(...midFrames.map(s => anchorDelta(s, baseline))) : 0

    // Tiempos: capturar de los frames donde las clases están vivas
    const closing = samples.map(s => s.closingAnim).find(Boolean)
    const collect = samples.map(s => s.collectTrans).find(Boolean)
    const open = samples.map(s => s.openAnim).find(Boolean)
    const timings = await measureChoreoTimings(page)   // vars (siempre disponibles)
    const num = s => s == null ? null : Math.round(parseFloat(s) * 1000) / 1000   // '0.22s'|'220ms'→ms-agnóstico: parseFloat
    const durMs = s => { if (!s) return null; const f = parseFloat(s); return /ms/.test(s) ? f : f * 1000 }
    const flipOk = closing?.name === 'cardFlipClose' && durMs(closing?.dur) === 220 && open?.name === 'cardFlipReveal' && durMs(open?.dur) === 220
    const collectOk = !!collect && /transform/.test(collect.prop) && durMs(collect.dur) === 200
    const varsExpected = { flip: '220ms', stagger: '25ms', scale: '200ms', settle: '150ms' }
    const varsOk = JSON.stringify(timings.vars) === JSON.stringify(varsExpected)
    // Igualdad desktop↔móvil (número contra número): se comparan las vars de
    // tiempo (gobiernan TODAS las duraciones, incluida la escala) y las
    // duraciones de VOLTEO sobre el MISMO elemento (.playing-card). La transición
    // de ESCALA no se compara elemento a elemento porque el mecanismo difiere por
    // diseño (móvil escala la fila .opp-cards a 1.6; desktop el slot a 1.2) — su
    // duración es la misma var --reveal-scale-ms (=200ms) en ambos, ya probado por
    // la igualdad de vars + collectOk (desktop slot dur === 200).
    const matchMobile = !mobileRef ? null : (
      JSON.stringify(timings.vars) === JSON.stringify(mobileRef.vars) &&
      durMs(closing?.dur) === durMs(mobileRef.closing?.dur) &&
      durMs(open?.dur) === durMs(mobileRef.open?.dur)
    )

    // Estado final = R1: ganador=to, pastilla flotada, cartas sin inflar, Δ=0
    const endWinner = end.panels.find(p => p.winner)
    const endIsTo = endWinner?.seat === toSeat
    const endChipFloated = !endWinner?.chip || endWinner?.chipPos === 'absolute'
    const endNonWinner = end.panels.find(p => !p.winner && p.cards)
    const endNoInflate = !!endWinner && parseFloat(endWinner.slotML) < 0 && (!endNonWinner || Math.abs(endWinner.cardsW - endNonWinner.cardsW) < 1)
    const endShift = anchorDelta(end, baseline)
    // sin zombis: al terminar no quedan clases de fase ni cartas a medio voltear
    const endClean = await page.evaluate(() => document.querySelectorAll('[class*="opp-reveal-"]').length === 0 && [...document.querySelectorAll('.opp-card-slot .playing-card')].every(c => { const t = getComputedStyle(c).transform; return t === 'none' || !/matrix3d|rotateY/.test(getComputedStyle(c).animationName + t) }))

    // ── R2c · Scroll estable en TODO el ciclo ────────────────────────────────
    // Ni el documento ni el scroller de la mesa pueden cambiar de tamaño,
    // posición ni grosor de barra mientras corre la coreografía: cualquier
    // variación es el saltito (la barra que nace por el overflow desplazable que
    // inflan los transforms del abanico y encoge el cliente 15px).
    // Se enmarca con el reposo ANTERIOR al tap y el reposo final → el ciclo entero.
    const scrollShift = scrollDelta([{ scroll: baseline.scroll }, ...samples, { scroll: end.scroll }])
    const scrollStable = scrollShift.max === 0

    // ── R2c · Confinamiento por ASIENTO: se revela cada finalista y se exige que
    // su carta extrema quede DENTRO del perímetro del área (margen ≥0 por lado).
    const confine = []
    for (const seat of seats.taps) {
      await tapNameBySeat(page, seat)
      await page.waitForTimeout(700); await page.mouse.move(5, 5)
      const c = await measureConfine(page)
      if (!c.err) confine.push(c)
    }
    const confineOk = confine.length > 0 && confine.every(c => c.inside)
    const confineWorst = confine.length ? Math.min(...confine.map(c => c.worst)) : null

    // ── Interrupción A · tap repetido a mitad (debe estar BLOQUEADO) ──
    await reachShowdownTappable(page)
    const s2 = await page.evaluate(() => ({ win: [...document.querySelectorAll('.opp-panel')].find(p => p.className.includes('opp-winner'))?.querySelector('.opp-name')?.textContent.trim(), taps: [...document.querySelectorAll('.opp-name-tappable')].map(e => e.textContent.trim()) }))
    const toA = s2.taps.find(s => s !== s2.win) || s2.taps[0]
    const thirdA = s2.taps.find(s => s !== toA)   // intruso: cualquier finalista ≠ toA (incluido el 'from') → sirve también en mesa 3
    await tapNameBySeat(page, toA)
    await page.waitForTimeout(150)
    if (thirdA) await tapNameBySeat(page, thirdA)   // tap intruso a mitad de coreografía
    await page.waitForTimeout(1200); await page.mouse.move(5, 5)
    const afterA = await page.evaluate(() => ({ winner: [...document.querySelectorAll('.opp-panel')].find(p => p.className.includes('opp-winner'))?.querySelector('.opp-name')?.textContent.trim(), reveals: document.querySelectorAll('[class*="opp-reveal-"]').length }))
    const interruptRepeatOk = afterA.winner === toA && afterA.reveals === 0   // el intruso NO ganó, sin zombis

    // ── Interrupción B · cerrar (siguiente mano) a mitad de coreografía ──
    await reachShowdownTappable(page)
    const s3 = await page.evaluate(() => ({ win: [...document.querySelectorAll('.opp-panel')].find(p => p.className.includes('opp-winner'))?.querySelector('.opp-name')?.textContent.trim(), taps: [...document.querySelectorAll('.opp-name-tappable')].map(e => e.textContent.trim()) }))
    const toB = s3.taps.find(s => s !== s3.win) || s3.taps[0]
    await tapNameBySeat(page, toB)
    await page.waitForTimeout(150)
    await clickIf(page, 'button:has-text("Siguiente mano")')   // cerrar a mitad
    await page.waitForTimeout(600)
    const afterB = await page.evaluate(() => ({ reveals: document.querySelectorAll('[class*="opp-reveal-"]').length, anyFlipping: [...document.querySelectorAll('.opp-card-slot .playing-card')].some(c => /cardFlip/.test(getComputedStyle(c).animationName) && getComputedStyle(c).animationPlayState === 'running') }))
    const interruptCloseOk = afterB.reveals === 0 && !afterB.anyFlipping

    const passed = choreoRan && sawAllPhases && midShift < 0.6 && flipOk && collectOk && varsOk && (matchMobile !== false) &&
      endIsTo && endChipFloated && endNoInflate && endShift < 0.6 && endClean && interruptRepeatOk && interruptCloseOk &&
      gapPositive && gapMatchMobile && (fanCentered !== false) && chipClear &&
      scrollStable && confineOk

    out.push({
      table: n, vp, toSeat, baselineWinner: seats.win,
      choreoRan, sawAllPhases, phaseOrder,
      midShift: Math.round(midShift * 100) / 100, midFrames: midFrames.length,
      timings: { vars: timings.vars, closing, collect, open }, flipOk, collectOk, varsOk, matchMobile,
      endIsTo, endChipFloated, endNoInflate, endShift: Math.round(endShift * 100) / 100, endClean,
      spread, mobGap, gapPositive, gapMatchMobile, lateralSeat, fanCentered, chipClear,
      scrollShift, scrollStable, confine, confineOk, confineWorst,
      interruptRepeatOk, afterA, interruptCloseOk, afterB,
      passed,
    })
    await page.close()
  }
  return { mobileRef, cells: out }
}

// ── DSK-O1 · Óvalo central fijo (mesa 5) ─────────────────────────────────────
// Mide el bbox del óvalo (.center-zone) en TODOS los estados de mensaje del
// juego y comprueba que no se mueve (Δ=0). Los textos NO se inventan: son las
// plantillas reales de gameEngine.js/GameTable.jsx instanciadas con el peor caso
// (nombre 'IA 4', importes de 5 cifras, 3 descartes). Además:
//   · estados REALES muestreados jugando una mano (no sólo inyectados);
//   · umbral de wrap del mensaje más largo (a qué ancho de texto rompe línea);
//   · desborde: ninguna línea puede salirse del perímetro del óvalo.
// Mesa 5 es el alcance de la tanda; 4/3/2 se miden como INSUMO (solo datos).
const O1_TABLES = [5, 4, 3, 2]

// Catálogo por familia. `n2` = variante de mesa 2 (el motor conserva sus
// cadenas originales para N=2 y son distintas de las de N>2).
const O1_MSGS = [
  { fam: 'bienvenida', t: '¡Bienvenido a Ajilei!' },
  { fam: 'reparto', t: 'Repartiendo...' },
  { fam: 'apertura', t: 'A las 2 — IA 4 abre.', n2: 'A las 2 — IA pensando...' },
  { fam: 'apuesta', t: 'IA 4 apuesta 10000.', n2: 'La IA apuesta 10000. ¿Qué haces?' },
  { fam: 'igualar', t: 'IA 4 iguala a 10000.', n2: 'La IA iguala a 10000.' },
  { fam: 'subir', t: 'IA 4 sube a 10000.', n2: 'La IA sube a 10000. ¿Qué haces?' },
  { fam: 'pasar', t: 'IA 4 pasa.', n2: 'La IA pasa.' },
  { fam: 'retirarse', t: 'IA 4 se retira.', n2: '¡La IA se retira! Ganaste el pozo.' },
  { fam: 'descarte-sel', t: 'Selecciona hasta 3 cartas a descartar.' },
  { fam: 'descarte-narra', t: 'IA 4 descarta 3 cartas.', n2: 'Descartas 3 cartas.' },
  { fam: 'descarte-fin', t: 'Descarte completado. Al descarte.', n2: 'Descartaste 3, la IA descartó 3. Al descarte — IA pensando...' },
  { fam: 'resultado', t: 'IA 4 gana con Espadas (41 pts).', n2: 'Pierdes. La IA gana con Espadas (41 pts) vs tu Bastos (33 pts).' },
  { fam: 'resultado-ajilei', t: '¡AJILEI! IA 4 gana con mano perfecta (comodín).', n2: '¡La IA tiene AJILEI! Mano perfecta. Pierdes.' },
  { fam: 'resultado-empate', t: 'Empate. Gana IA 4 por ser el más cercano a la Mano.', n2: '¡Ganas! Tu Espadas (41 pts) supera al Bastos de la IA (33 pts).' },
  { fam: 'retiros', t: 'Los demás se retiran. ¡Ganaste el pozo!', n2: 'Te retiras. La IA gana el pozo.' },
]
const o1Text = (m, n) => (n === 2 && m.n2) ? m.n2 : m.t
// El aviso de eliminación REEMPLAZA el contenido del óvalo (.elim-notice-inline)
// y es la cadena más larga que puede vivir ahí: hasta 3 nombres.
const O1_ELIM = 'IA 1, IA 2, IA 3 se quedaron sin fichas · la mesa ahora es de 2'

// Escribe un texto en el mensaje del óvalo y mide. Es una mutación de MEDICIÓN
// (se restaura al terminar): permite recorrer todas las familias sin depender de
// que la partida las produzca. Devuelve bbox del óvalo, del texto, nº de líneas
// (rects del Range) y si algo desborda el perímetro del óvalo.
async function o1Measure(page, text) {
  return page.evaluate((txt) => {
    const rnd = x => x == null ? null : Math.round(x * 100) / 100
    const R = e => { if (!e) return null; const b = e.getBoundingClientRect(); return { x: rnd(b.x), y: rnd(b.y), w: rnd(b.width), h: rnd(b.height), left: rnd(b.left), right: rnd(b.right), top: rnd(b.top), bottom: rnd(b.bottom) } }
    const oval = document.querySelector('.center-zone')
    const msg = oval?.querySelector('.game-message')
    if (!oval || !msg) return { err: 'no-oval' }
    const prev = msg.textContent
    if (txt != null) msg.textContent = txt
    const range = document.createRange(); range.selectNodeContents(msg)
    const lines = range.getClientRects().length
    const tr = range.getBoundingClientRect()
    const ov = oval.getBoundingClientRect()
    const mr = msg.getBoundingClientRect()
    const out = {
      text: msg.textContent,
      oval: R(oval), msg: R(msg),
      textW: rnd(tr.width), textH: rnd(tr.height), lines,
      // desborde del TEXTO respecto al perímetro del óvalo (>0 = se sale)
      outLeft: rnd(ov.left - tr.left), outRight: rnd(tr.right - ov.right),
      outTop: rnd(ov.top - tr.top), outBottom: rnd(tr.bottom - ov.bottom),
      // recorte propio del párrafo (overflow:hidden del grid en 4/5)
      clipped: msg.scrollWidth > msg.clientWidth + 1 || msg.scrollHeight > msg.clientHeight + 1,
      msgColW: rnd(mr.width),
    }
    if (txt != null) msg.textContent = prev
    return out
  }, text)
}

// Umbral de wrap: alarga el texto PALABRA A PALABRA hasta que el párrafo rompe
// línea; devuelve el ancho (px) del último que cupo en UNA línea — el
// equivalente al 482px documentado en móvil. Aparte, prueba de estrés con una
// cadena CONTINUA (sin espacios, sin oportunidad de corte): no puede romper, así
// que si el óvalo no crece con ella es que su ancho no depende del texto.
async function o1WrapThreshold(page, base) {
  return page.evaluate((base) => {
    const rnd = x => Math.round(x * 100) / 100
    const oval = document.querySelector('.center-zone')
    const msg = oval?.querySelector('.game-message')
    if (!msg) return { err: 'no-msg' }
    const prev = msg.textContent
    const linesOf = () => { const r = document.createRange(); r.selectNodeContents(msg); return { n: r.getClientRects().length, w: rnd(r.getBoundingClientRect().width) } }
    let last1 = null, firstWrap = null
    for (let k = 1; k <= 120; k++) {
      msg.textContent = Array.from({ length: k }, () => 'Mmm').join(' ')   // palabras → hay dónde cortar
      const r = linesOf()
      if (r.n === 1) last1 = { words: k, w: r.w }
      else { firstWrap = { words: k, w: r.w }; break }
    }
    // Estrés: 300 caracteres sin espacios (imposible de romper)
    const ovalBefore = rnd(oval.getBoundingClientRect().width)
    msg.textContent = 'M'.repeat(300)
    const stress = { oval: rnd(oval.getBoundingClientRect().width), clipped: msg.scrollWidth > msg.clientWidth + 1 }
    stress.ovalGrew = rnd(stress.oval - ovalBefore)
    // Y con el texto real más largo: ¿en cuántas líneas cae?
    msg.textContent = base
    const real = linesOf()
    const realBox = msg.getBoundingClientRect()
    msg.textContent = prev
    return { maxOneLinePx: last1?.w ?? null, maxOneLineWords: last1?.words ?? null, firstWrap, stress, realLines: real.n, realTextW: real.w, msgColW: rnd(realBox.width) }
  }, base)
}

async function runO1(browser) {
  const out = []
  const tblFilter = process.argv[3] ? Number(process.argv[3]) : null
  const vpFilter = process.argv[4] || null
  for (const n of O1_TABLES) for (const vp of VIEWPORTS) {
    if (tblFilter && n !== tblFilter) continue
    if (vpFilter && `${vp.w}x${vp.h}` !== vpFilter) continue
    const page = await browser.newPage({ viewport: { width: vp.w, height: vp.h } })
    await gotoMesa(page, n); await installProbes(page)
    await page.waitForTimeout(300); await page.mouse.move(5, 5)

    // 1 · Reposo (bienvenida, tal cual la pinta React)
    const base = await o1Measure(page, null)
    if (base.err) { out.push({ table: n, vp, err: base.err }); await page.close(); continue }

    // 2 · Todas las familias de mensaje (inyectadas)
    const states = []
    for (const m of O1_MSGS) {
      const r = await o1Measure(page, o1Text(m, n))
      states.push({ fam: m.fam, chars: o1Text(m, n).length, ...r })
    }
    // 3 · Aviso de eliminación (sólo mesas que pueden encoger)
    if (n >= 3) states.push({ fam: 'elim-notice', chars: O1_ELIM.length, ...(await o1Measure(page, O1_ELIM)) })

    // 4 · Umbral de wrap contra el mensaje real más largo de esta mesa
    const longest = states.reduce((a, s) => (s.chars > (a?.chars ?? -1) ? s : a), null)
    const wrap = await o1WrapThreshold(page, longest.text)

    // 5 · Estados REALES: se juegan 3 manos muestreando el óvalo en cada fase.
    // Tres manos porque Mano/Pie ROTAN de asiento: los badges y el mazo cambian
    // el ancho de las columnas `auto` del grid .table-mid y con él el 1fr donde
    // vive el óvalo — la elasticidad real del escritorio no la trae el mensaje.
    // Se anota también el ancho de cada side-col para ATRIBUIR la causa.
    const real = []
    const snap = async (tag) => {
      await page.mouse.move(5, 5)
      const m = await o1Measure(page, null)
      const cols = await page.evaluate(() => {
        const rnd = x => Math.round(x * 100) / 100
        const w = s => { const e = document.querySelector(s); return e ? rnd(e.getBoundingClientRect().width) : null }
        return { L: w('.side-col-left'), R: w('.side-col-right'), mid: w('.mid-center'), riv: w('.rivals-zone') }
      })
      real.push({ tag, oval: m.oval, text: m.text, lines: m.lines, cols })
    }
    await snap('waiting')
    for (let hand = 0; hand < 3; hand++) {
      await clickIf(page, 'button:has-text("Iniciar mano")')
      for (let i = 0; i < 60; i++) {
        await page.waitForTimeout(280)
        await snap(`h${hand}t${i}`)
        if (await page.locator('button:has-text("Siguiente mano")').isVisible().catch(() => false)) break
        await clickIf(page, '.action-buttons button:has-text("Pasar")') ||
          await clickIf(page, '.action-buttons button:has-text("Igualar")') ||
          await clickIf(page, '.action-buttons button:has-text("Apostar")')
        await clickIf(page, 'button:has-text("Sin descartar")')
      }
      await snap(`h${hand}-showdown`)
      if (!await clickIf(page, 'button:has-text("Siguiente mano")')) break
      await page.waitForTimeout(1500)
      await snap(`h${hand}-reset`)
    }

    // Δ del óvalo contra el reposo — inyectados y reales por separado
    const dOf = o => bboxDelta(o, base.oval)
    const injMax = Math.max(...states.map(s => dOf(s.oval) || 0))
    const realMax = Math.max(...real.map(r => dOf(r.oval) || 0))
    const worstInj = states.reduce((a, s) => (dOf(s.oval) > dOf(a.oval) ? s : a), states[0])
    const worstReal = real.reduce((a, r) => (dOf(r.oval) > dOf(a.oval) ? r : a), real[0])
    const anyOverflow = states.filter(s => s.outLeft > 0.5 || s.outRight > 0.5 || s.outTop > 0.5 || s.outBottom > 0.5 || s.clipped)
    const ovalStable = Math.max(injMax, realMax) < 0.6
    const longestFits = !anyOverflow.some(s => s.fam === longest.fam)
    // Rango real del óvalo (mín/máx por eje) — es lo que hay que congelar.
    const vals = k => real.map(r => r.oval?.[k]).filter(v => v != null)
    const rng = k => ({ min: round(Math.min(...vals(k))), max: round(Math.max(...vals(k))) })
    const range = { w: rng('w'), h: rng('h'), x: rng('x'), y: rng('y') }
    const colRange = {
      L: { min: round(Math.min(...real.map(r => r.cols?.L ?? Infinity))), max: round(Math.max(...real.map(r => r.cols?.L ?? -Infinity))) },
      R: { min: round(Math.min(...real.map(r => r.cols?.R ?? Infinity))), max: round(Math.max(...real.map(r => r.cols?.R ?? -Infinity))) },
    }

    out.push({
      table: n, vp,
      ovalBase: base.oval,
      injMax: round(injMax), realMax: round(realMax),
      worstInj: { fam: worstInj.fam, d: round(dOf(worstInj.oval)), oval: worstInj.oval, lines: worstInj.lines },
      worstReal: { tag: worstReal.tag, d: round(dOf(worstReal.oval)), text: worstReal.text, oval: worstReal.oval },
      longest: { fam: longest.fam, chars: longest.chars, text: longest.text, lines: longest.lines, textW: longest.textW },
      wrap, range, colRange,
      overflow: anyOverflow.map(s => ({ fam: s.fam, outL: s.outLeft, outR: s.outRight, outT: s.outTop, outB: s.outBottom, clipped: s.clipped })),
      states: states.map(s => ({ fam: s.fam, chars: s.chars, lines: s.lines, textW: s.textW, ovalW: s.oval?.w, ovalH: s.oval?.h, ovalX: s.oval?.x, ovalY: s.oval?.y, clipped: s.clipped })),
      realSeq: real.map(r => ({ tag: r.tag, w: r.oval?.w, h: r.oval?.h, x: r.oval?.x, y: r.oval?.y, lines: r.lines, text: r.text, cols: r.cols })),
      // Alcance: cuando O1 corrió, sólo mesa 5 estaba congelada y 4/3/2 eran
      // INSUMO (passed = null, elasticidad registrada en `range` para el reporte).
      // DSK-O2 selló las tres restantes → las cuatro puntúan. Un dato que se
      // imprime y no gatea es cobertura sólo aparente (lección H2).
      inScope: true,
      ovalStable, longestFits,
      // La cadena continua no debe inflar el óvalo en NINGUNA mesa: en 4/5 lo
      // garantiza el `overflow:hidden` + `minmax(0,360px)` del bloque :948, y en
      // 3/2 la guardia de contención de O2 (overflow + min-width:0 del mensaje).
      stressOk: !wrap.err && Math.abs(wrap.stress?.ovalGrew ?? 0) < 0.6,
      passed: ovalStable && longestFits && !wrap.err && Math.abs(wrap.stress?.ovalGrew ?? 0) < 0.6,
    })
    await page.close()
  }
  return out
}

// ── DSK-H1 · Área del jugador humano ─────────────────────────────────────────
// Alcance GLOBAL: las 4 mesas del gate. Verifica (y REPORTA) la vía de render,
// la reserva del nombre (12ch, con "Tú" y con un nombre de 12 caracteres), el
// shift-check O1 del ciclo rol/TURNO/showdown, y el bloque de saldo (borde
// derecho inmóvil a 3/5/7 dígitos, "Mesa N" alineada, "·" y "fichas" ausentes).
const H1_TABLES = [5, 4, 3, 2]
const H1_NAME12 = 'Wenceslaoxyz'   // 12 caracteres exactos

// Anclas que NO pueden moverse en ningún estado del área humana ni en sus vecinos.
// .player-bar-center (franja de acción) queda FUERA a propósito: su contenido
// cambia por fase (Iniciar mano → botones + timer + multiplicadores → descarte),
// es comportamiento previo y explícitamente fuera del alcance de la tanda. Lo que
// sí se exige es que ese vaivén NO empuje a los bloques de identidad ni de saldo
// —van anclados a los extremos de un grid 1fr/auto/1fr—, y eso lo cubren las
// anclas de abajo. Se mide igual y se reporta su rango.
// El ÓVALO se mide aparte: en mesas 4 (y en la 5 antes de O1) arrastra la
// elasticidad de la columna lateral —el panel del rival ensancha su columna al
// aparecer su pastilla de rol y el óvalo paga la diferencia—, medida y
// documentada en DSK-O1, que sólo congeló la mesa 5 (alcance sellado por Victor).
// Verificado contra HEAD: sin H1, mesa 4 da el MISMO Δ=6.74 en las mismas celdas.
// Por eso el óvalo es gate duro donde está congelado (mesa 5) e informativo en el
// resto, en vez de acusar a esta tanda de un movimiento que no provoca.
const H1_ANCHORS = ['zone', 'bar', 'name', 'tags', 'turno', 'right', 'chips', 'num', 'mesa', 'cards']

async function h1Snap(page) {
  return page.evaluate(() => {
    const rnd = x => x == null ? null : Math.round(x * 100) / 100
    const B = s => { const e = document.querySelector(s); if (!e) return null; const b = e.getBoundingClientRect(); const cs = getComputedStyle(e); return { x: rnd(b.x), y: rnd(b.y), w: rnd(b.width), h: rnd(b.height), right: rnd(b.right), bottom: rnd(b.bottom), disp: cs.display, vis: cs.visibility, txt: e.textContent.trim().slice(0, 24) } }
    const scr = document.querySelector('.game-table-screen')
    // H2 · frente hermano: el header de cada IA aloja las MISMAS familias de
    // pastilla, así que la rotación del rol podía empujar su fila de cartas.
    // Se miden las magnitudes VERTICALES (alto del header, tapa de las cartas):
    // el ancho/x del panel arrastra en mesa 4 la elasticidad O1 abierta y se
    // reporta aparte, informativo, para no acusar a esta tanda de lo ajeno.
    const heads = [...document.querySelectorAll('.opp-panel')].map(p => {
      const h = p.querySelector('.opp-header'), c = p.querySelector('.opp-cards')
      return {
        name: (p.querySelector('.opp-name')?.textContent || '').trim(),
        hdrH: h ? rnd(h.getBoundingClientRect().height) : null,
        hdrW: h ? rnd(h.getBoundingClientRect().width) : null,
        cardsY: c ? rnd(c.getBoundingClientRect().y) : null,
        roles: [...p.querySelectorAll('.opp-header-anchor .seat-badge')].filter(e => getComputedStyle(e).visibility === 'visible').map(e => e.textContent.trim()),
      }
    })
    const az = document.querySelector('.ai-zone')
    const aiHead = az ? {
      infoH: rnd(az.querySelector('.ai-info')?.getBoundingClientRect().height),
      cardsY: rnd(az.querySelector('.cards-row')?.getBoundingClientRect().y),
      roles: [...az.querySelectorAll('.ai-header-anchor .seat-badge')].filter(e => getComputedStyle(e).visibility === 'visible').map(e => e.textContent.trim()),
    } : null
    return {
      heads, aiHead,
      zone: B('.player-zone'), bar: B('.player-bar'), left: B('.player-bar-left'),
      name: B('.pbr-name'), tags: B('.pbr-tags'), turno: B('.badge-turno'),
      chipWin: B('.player-bar-left .win-score-chip'),
      right: B('.player-bar-right'), chips: B('.pbr-chips'), num: B('.pbr-chips .bd-num'),
      mesa: B('.pbr-mesa'), sep: B('.pbr-sep'), fichas: B('.pbr-fichas-word'),
      center: B('.player-bar-center'), cards: B('.player-zone .cards-row'), oval: B('.center-zone'),
      roles: [...document.querySelectorAll('.pbr-tags .seat-badge')].map(e => e.textContent.trim()),
      turnoVisible: (() => { const e = document.querySelector('.badge-turno'); return e ? getComputedStyle(e).visibility === 'visible' : false })(),
      overflow: scr ? scr.scrollHeight - scr.clientHeight : null,
    }
  })
}
// Mutación de MEDICIÓN (se restaura): saldo de N dígitos y/o nombre de 12ch.
const h1Inject = (page, digits, name) => page.evaluate(([d, n]) => {
  const num = document.querySelector('.pbr-chips .bd-num'), nm = document.querySelector('.pbr-name')
  const prev = { num: num?.textContent, nm: nm?.textContent }
  if (d && num) num.textContent = '9'.repeat(d)
  if (n && nm) nm.textContent = n
  return prev
}, [digits, name])
const h1Restore = (page, prev) => page.evaluate((p) => {
  const num = document.querySelector('.pbr-chips .bd-num'), nm = document.querySelector('.pbr-name')
  if (num && p.num != null) num.textContent = p.num
  if (nm && p.nm != null) nm.textContent = p.nm
}, prev)
const h1Delta = (a, b, keys = H1_ANCHORS) => {
  let max = 0, who = null
  for (const k of keys) {
    const d = bboxDelta(a[k], b[k])
    if (d > max) { max = d; who = k }
  }
  return { max: Math.round(max * 100) / 100, who }
}

async function runH1(browser) {
  const out = []
  const tblFilter = process.argv[3] ? Number(process.argv[3]) : null
  const vpFilter = process.argv[4] || null
  for (const n of H1_TABLES) for (const vp of VIEWPORTS) {
    if (tblFilter && n !== tblFilter) continue
    if (vpFilter && `${vp.w}x${vp.h}` !== vpFilter) continue
    const page = await browser.newPage({ viewport: { width: vp.w, height: vp.h } })
    await gotoMesa(page, n); await installProbes(page)
    await page.waitForTimeout(300); await page.mouse.move(5, 5)

    // 1 · VÍA DE RENDER (lección P1: ¿común a las 4 mesas o partida?)
    const route = await page.evaluate(() => {
      const bar = document.querySelector('.player-bar')
      return {
        playerZone: !!document.querySelector('.player-zone'), playerBar: !!bar,
        left: [...(bar?.querySelector('.player-bar-left')?.children || [])].map(e => e.className),
        right: [...(bar?.querySelector('.player-bar-right')?.children || [])].map(e => e.className),
        aiZone: !!document.querySelector('.ai-zone'),   // mesa 2: rival por vía legacy
      }
    })
    const base = await h1Snap(page)

    // 2 · RESERVA DEL NOMBRE: "Tú" vs 12 caracteres → misma geometría
    const prevN = await h1Inject(page, null, H1_NAME12)
    const withName12 = await h1Snap(page)
    await h1Restore(page, prevN)
    const nameShift = h1Delta(withName12, base)
    const nameReserved = nameShift.max < 0.6
    const nameEllipsis = await page.evaluate(() => {
      const e = document.querySelector('.pbr-name'); const cs = getComputedStyle(e)
      return { textOverflow: cs.textOverflow, overflow: cs.overflow, width: cs.width, align: cs.textAlign }
    })

    // 3 · SALDO a 3/5/7 dígitos: el borde derecho de la cifra no se mueve
    const digits = {}
    for (const d of [3, 5, 7]) {
      const prev = await h1Inject(page, d, null)
      digits[d] = await h1Snap(page)
      await h1Restore(page, prev)
    }
    const rights = [3, 5, 7].map(d => digits[d].num?.right)
    const numRightFixed = rights.every(r => r != null && Math.abs(r - rights[0]) < 0.6)
    const growsLeft = digits[7].num.x < digits[3].num.x - 1   // la cifra crece hacia la izquierda
    const mesaAligned = [3, 5, 7].every(d => Math.abs(digits[d].mesa.right - digits[d].num.right) < 0.6)
    const mesaBelow = base.mesa && base.num && base.mesa.y > base.num.y
    const sepGone = !base.sep || base.sep.disp === 'none'
    const fichasGone = !base.fichas || base.fichas.disp === 'none'
    const saldoBlockFixed = [3, 5, 7].every(d => Math.abs(digits[d].right.w - digits[3].right.w) < 0.6)

    // 4 · SHIFT-CHECK O1: ciclo real con ROTACIÓN DE ROL COMPLETA → Δ=0 en el
    // área humana, sus vecinos y los headers de IA.
    // H2 · El Pie rota +1 por mano: el humano es MANO en la 1ª, PIE en la 2ª y
    // se queda SIN ROL en la 3ª (mesas ≥3; en la 2 alterna MANO↔PIE). Hasta H2
    // el ciclo jugaba 2 manos con un techo de 50×280ms = 14s, que NINGUNA mano
    // llegaba a agotar: las 16 celdas veían sólo el rol MANO (rolesSeen=["Mano"])
    // y el Δ de 2px de la pastilla PIE quedaba fuera del muestreo. Ahora son 3
    // manos con techo holgado y la cobertura de roles es PUERTA, no informe.
    const states = []
    for (let hand = 0; hand < 3; hand++) {
      await clickIf(page, 'button:has-text("Iniciar mano")')
      let closed = false
      // Techo por mano: una mano de mesa 5 (4 IAs + descarte + payout) tarda
      // ~40s reales; con 160 iteraciones el ciclo moría a medias y tres celdas
      // de mesa 5 no llegaban a rotar el rol. 340 da holgura de 2× sin encarecer
      // el muestreo: se CLICA cada iteración pero se MUESTREA una de cada dos.
      for (let i = 0; i < 340; i++) {
        await page.waitForTimeout(230); await page.mouse.move(5, 5)
        if (i % 2 === 0) states.push({ tag: `h${hand}t${i}`, ...(await h1Snap(page)) })
        if (await page.locator('button:has-text("Siguiente mano")').isVisible().catch(() => false)) {
          states.push({ tag: `h${hand}t${i}f`, ...(await h1Snap(page)) }); closed = true; break
        }
        await clickIf(page, '.action-buttons button:has-text("Pasar")') ||
          await clickIf(page, '.action-buttons button:has-text("Igualar")') ||
          await clickIf(page, '.action-buttons button:has-text("Apostar")')
        await clickIf(page, 'button:has-text("Sin descartar")')
      }
      states.push({ tag: `h${hand}-sd`, ...(await h1Snap(page)) })
      if (!closed || !await clickIf(page, 'button:has-text("Siguiente mano")')) break
      await page.waitForTimeout(1500); await page.mouse.move(5, 5)
      states.push({ tag: `h${hand}-post`, ...(await h1Snap(page)) })
    }
    // La baseline del ciclo es el reposo inicial; se exige Δ=0 en todos los frames.
    let worst = { max: 0, who: null, tag: null }
    for (const s of states) {
      const d = h1Delta(s, base)
      if (d.max > worst.max) worst = { ...d, tag: s.tag }
    }
    // Rango de la franja de acción (fuera de las anclas, sólo informativo).
    const centerRange = {
      w: [Math.min(...states.map(s => s.center?.w ?? 0)), Math.max(...states.map(s => s.center?.w ?? 0))].map(round),
      h: [Math.min(...states.map(s => s.center?.h ?? 0)), Math.max(...states.map(s => s.center?.h ?? 0))].map(round),
    }
    const cycleStable = worst.max < 0.6
    // Óvalo (vecino) aparte: gate duro sólo donde O1 lo congeló (mesa 5).
    let ovalWorst = { max: 0, tag: null }
    for (const s of states) {
      const d = bboxDelta(s.oval, base.oval)
      if (d > ovalWorst.max) ovalWorst = { max: Math.round(d * 100) / 100, tag: s.tag }
    }
    const ovalStable = ovalWorst.max < 0.6
    const ovalGated = n === 5   // O1 selló mesa 5; 4/3/2 siguen a decisión de Victor
    // Cobertura del ciclo: hay que haber VISTO turno on y off, y algún rol.
    const sawTurnOn = states.some(s => s.turnoVisible)
    const sawTurnOff = states.some(s => !s.turnoVisible)
    const sawRole = states.some(s => s.roles.length > 0)
    const sawNoRole = states.some(s => s.roles.length === 0)
    const sawChip = states.some(s => s.chipWin)
    const rolesSeen = [...new Set(states.flatMap(s => s.roles))]
    const overflowOk = (base.overflow ?? 0) <= 0 && states.every(s => (s.overflow ?? 0) <= 0)
    // H2 · cobertura de la rotación como PUERTA: hay que haber visto MANO y PIE
    // en el área humana; y "sin rol" donde el motor lo produce (mesas ≥3: el rol
    // salta a otra IA en la 3ª mano; en la 2 el humano alterna MANO↔PIE siempre).
    const sawMano = rolesSeen.includes('Mano')
    const sawPie = rolesSeen.includes('Pie')
    const roleCycleOk = sawMano && sawPie && (n === 2 || sawNoRole)

    // H2 · frente hermano: headers de IA (vertical) a lo largo del mismo ciclo.
    const headBase = base.heads.length ? base.heads : (states[0]?.heads ?? [])
    let headWorst = { max: 0, who: null, tag: null }
    for (const s of states) {
      for (const hb of headBase) {
        const cur = s.heads.find(h => h.name === hb.name)
        if (!cur) continue
        for (const f of ['hdrH', 'cardsY']) {
          const d = (cur[f] == null || hb[f] == null) ? 0 : Math.abs(cur[f] - hb[f])
          if (d > headWorst.max) headWorst = { max: Math.round(d * 100) / 100, who: `${hb.name}.${f}`, tag: s.tag }
        }
      }
      if (s.aiHead && base.aiHead) {
        for (const f of ['infoH', 'cardsY']) {
          const d = (s.aiHead[f] == null || base.aiHead[f] == null) ? 0 : Math.abs(s.aiHead[f] - base.aiHead[f])
          if (d > headWorst.max) headWorst = { max: Math.round(d * 100) / 100, who: `IA(m2).${f}`, tag: s.tag }
        }
      }
    }
    const headsStable = headWorst.max < 0.6
    // Cobertura del hermano: alguna IA tuvo que lucir la pastilla neutra (P).
    const headRolesSeen = [...new Set(states.flatMap(s => [...s.heads.flatMap(h => h.roles), ...(s.aiHead?.roles ?? [])]))]
    const headSawPie = headRolesSeen.includes('P')
    // Ancho/x del header: informativo (mesa 4 arrastra la elasticidad O1 abierta).
    let headWidthRange = 0
    for (const s of states) for (const hb of headBase) {
      const cur = s.heads.find(h => h.name === hb.name)
      if (cur && cur.hdrW != null && hb.hdrW != null) headWidthRange = Math.max(headWidthRange, Math.abs(cur.hdrW - hb.hdrW))
    }
    headWidthRange = Math.round(headWidthRange * 100) / 100

    const passed = nameReserved && numRightFixed && growsLeft && mesaAligned && !!mesaBelow &&
      sepGone && fichasGone && saldoBlockFixed && cycleStable && sawTurnOn && sawTurnOff && overflowOk &&
      roleCycleOk && headsStable && headSawPie &&
      (!ovalGated || ovalStable)

    out.push({
      table: n, vp, route,
      routeCommon: route.playerZone && route.playerBar &&
        JSON.stringify(route.left) === JSON.stringify(['pbr-name', 'pbr-badges']),
      base: { name: base.name, tags: base.tags, turno: base.turno, num: base.num, mesa: base.mesa, right: base.right, bar: base.bar },
      nameReserved, nameShift, nameEllipsis, name12Box: withName12.name,
      numRightFixed, rights, growsLeft, mesaAligned, mesaBelow, sepGone, fichasGone, saldoBlockFixed,
      digits: { 3: { num: digits[3].num, mesa: digits[3].mesa }, 5: { num: digits[5].num, mesa: digits[5].mesa }, 7: { num: digits[7].num, mesa: digits[7].mesa } },
      cycleStable, worst, frames: states.length, centerRange,
      ovalStable, ovalWorst, ovalGated,
      roleCycleOk, sawMano, sawPie, headsStable, headWorst, headRolesSeen, headSawPie, headWidthRange,
      sawTurnOn, sawTurnOff, sawRole, sawNoRole, sawChip, rolesSeen,
      overflow: base.overflow, overflowOk,
      passed,
    })
    await page.close()
  }
  return out
}

// ── M1 · Mazo del humano a la mitad (y gemelo IA de mesa 2) ───────────────────
// Verifica, en las 16 celdas: calibre objetivo ±0.5px, esquina superior IZQUIERDA
// en las coordenadas PRE-tanda medidas en la fase (a), ancho de flujo del wrapper
// y alto de fila conservados (compensación de margen), hueco mazo→cartas, sombras
// nuevas (pila del rival), abanico de barajado atado al mazo, reserva viva con
// .deck-hidden y Δ=0 en todo el área a lo largo de una rotación completa de PIE.
const M1_TABLES = [5, 4, 3, 2]
// DSK-A2 · el centinela 1440×850 entra en m1 (la banda 801..900 tiene root 18 con
// carta 76, y ahí el mazo lleva su propio dx). Medido sobre HEAD b79edd5.
const M1_VIEWPORTS = [...VIEWPORTS, { w: 1440, h: 850 }]
// Coordenadas PRE-tanda (fase a, mano 2 con el humano de Pie). `deck.x` era el
// ancla ABSOLUTA del mazo y dependía sólo del viewport —la fila estaba centrada y
// medía igual en las 4 mesas (reverificado sobre HEAD en los 5 viewports)—. DSK-A2
// rompe esa independencia: al centrar las 5 cartas, el mazo se recoloca con
// --dsk-deck-center-dx, que SÍ depende de la mesa (a 1920: −56,83 en 5/4 contra
// −20,00 en 3/2). Por eso `deck.x` sigue siendo el ancla histórica y la expectativa
// viva es `pre.deck.x + dx`, con el dx LEÍDO del `left` usado del wrapper — no una
// tabla nueva por (mesa, viewport) que habría que mantener a mano.
// El mazo IA de mesa 2 lleva +0.11px en Y respecto a este registro desde DSK-H2
// (la reserva de pastilla bajó su fila): la tolerancia de 0.5 lo absorbe.
const M1_PRE = {
  '1024x768': { deck: { x: 246, y: 521, w: 80, h: 122 }, wrap: { w: 112, h: 122 }, ai: { x: 698, y: 114.2 } },
  '1280x720': { deck: { x: 374, y: 473, w: 80, h: 122 }, wrap: { w: 112, h: 122 }, ai: { x: 826, y: 114.2 } },
  '1366x768': { deck: { x: 417, y: 521, w: 80, h: 122 }, wrap: { w: 112, h: 122 }, ai: { x: 869, y: 114.2 } },
  '1440x850': { deck: { x: 454, y: 562, w: 80, h: 122 }, wrap: { w: 112, h: 122 }, ai: { x: 906, y: 154.22 } },
  '1920x937': { deck: { x: 649, y: 606.5, w: 95, h: 146 }, wrap: { w: 127, h: 146 }, ai: { x: 1176, y: 172.59 } },
}

// ── DSK-A2 · tokens vivos de la tanda ────────────────────────────────────────
// Se leen por su valor USADO, no con getPropertyValue: --dsk-fan-center-dx y
// --dsk-deck-center-dx son calc() (y llevan dentro el 100% de --dsk-hand-w), así
// que como custom property NO computan a px. El `margin-left` del primer slot y
// el `left` del wrapper sí: son exactamente esos dos tokens ya resueltos.
async function a2Live(page) {
  return page.evaluate(() => {
    const num = v => parseFloat(v) || 0
    const rnd = x => Math.round(x * 100) / 100
    const scr = document.querySelector('.game-table-screen')
    const cs = getComputedStyle(scr)
    const wrap = document.querySelector('.player-zone .deck-shuffle-wrapper')
    const slot1 = document.querySelector('.player-zone .cards-row .deck-shuffle-wrapper + .card-slot-wrapper')
    const row = document.querySelector('.player-zone .cards-row')
    const bar = document.querySelector('.player-bar')
    return {
      centerDx: slot1 ? rnd(num(getComputedStyle(slot1).marginLeft)) : null,
      deckDx: wrap ? rnd(num(getComputedStyle(wrap).left)) : null,
      wrapPosition: wrap ? getComputedStyle(wrap).position : null,
      gapLeft: num(cs.getPropertyValue('--dsk-fan-gap-left')),
      airX: num(cs.getPropertyValue('--dsk-hand-air-x')),
      airY: num(cs.getPropertyValue('--dsk-hand-air-y')),
      bandW: num(cs.getPropertyValue('--dsk-fan-band-w')),
      // primitivas de la banda contra el padding/margen VIVOS que espejan
      tokRowPadBottom: num(cs.getPropertyValue('--dsk-row-pad-bottom')),
      tokBarMarginTop: num(cs.getPropertyValue('--dsk-bar-margin-top')),
      liveRowPadBottom: num(getComputedStyle(row).paddingBottom),
      liveBarMarginTop: num(getComputedStyle(bar).marginTop),
    }
  })
}
// Anclas del ciclo. .player-bar-left/-right quedan FUERA a propósito: su ancho
// cambia con el chip de puntaje del showdown (contenido legítimo) y es dominio
// de H1, que ya las gatea con sus propias reservas.
const M1_ANCHORS = ['zone', 'row', 'deck', 'wrap', 'card1', 'cardN', 'bar', 'aiDeck', 'aiRow']

async function m1Snap(page) {
  return page.evaluate(() => {
    const rnd = x => x == null ? null : Math.round(x * 100) / 100
    const B = s => { const e = document.querySelector(s); if (!e) return null; const b = e.getBoundingClientRect(); return { x: rnd(b.x), y: rnd(b.y), w: rnd(b.width), h: rnd(b.height), right: rnd(b.right) } }
    const pile = document.querySelector('.player-zone .deck-pile')
    return {
      zone: B('.player-zone'), row: B('.player-zone .cards-row'),
      deck: B('.player-zone .deck-pile'), wrap: B('.player-zone .deck-shuffle-wrapper'),
      // OJO: nada de :first-of-type — el primer <div> de la fila es el WRAPPER
      // del mazo, no una carta, y el selector devolvía null en silencio.
      card1: B('.player-zone .cards-row .card-slot-wrapper'),
      cardN: (() => { const l = [...document.querySelectorAll('.player-zone .cards-row .card-slot-wrapper')].pop(); if (!l) return null; const b = l.getBoundingClientRect(); return { x: rnd(b.x), y: rnd(b.y), w: rnd(b.width), h: rnd(b.height), right: rnd(b.right) } })(),
      bar: B('.player-bar'), left: B('.player-bar-left'), right: B('.player-bar-right'),
      aiDeck: B('.ai-zone .deck-pile'), aiRow: B('.ai-zone .cards-row'),
      aiCardN: (() => { const l = [...document.querySelectorAll('.ai-zone .cards-row .card-slot-wrapper')].pop(); if (!l) return null; const b = l.getBoundingClientRect(); return { x: rnd(b.x), y: rnd(b.y), w: rnd(b.width), h: rnd(b.height), right: rnd(b.right) } })(),
      // El showdown escala las cartas ganadoras (76 → 91.2) y, al ser filas
      // centradas, recoloca a sus vecinos — incluido el mazo. Es PREVIO a M1
      // (verificado idéntico contra HEAD con la tanda en stash: el wrapper de
      // mesa 2 pasa de 837 a 873 en las dos versiones), así que esos frames se
      // miden aparte: lo que M1 sí posee —la compensación— se exige en TODOS.
      winner: !!document.querySelector('.card-slot-winner'),
      // Métricas de LAYOUT (offset*), inmunes al scale del showdown: son las que
      // fija esta tanda —caja del mazo y caja de flujo del wrapper, que es lo que
      // la compensación de margen mantiene constante— y se exigen en todos los
      // frames, incluidos los del showdown.
      flow: (() => {
        const o = e => e ? { w: e.offsetWidth, h: e.offsetHeight } : null
        return {
          deck: o(pile), wrap: o(document.querySelector('.player-zone .deck-shuffle-wrapper')),
          aiDeck: o(document.querySelector('.ai-zone .deck-pile')), aiWrap: o(document.querySelector('.ai-zone .deck-shuffle-wrapper')),
        }
      })(),
      isPie: pile ? !pile.classList.contains('deck-hidden') : null,
      shadow: pile ? getComputedStyle(pile).boxShadow : null,
      vis: pile ? getComputedStyle(pile).visibility : null,
    }
  })
}
const hasAiFlow = (seq) => seq.length > 0 && !!seq[0].aiDeck
const m1Delta = (a, b) => {
  let max = 0, who = null
  for (const k of M1_ANCHORS) {
    if (!a[k] || !b[k]) continue
    for (const f of ['x', 'y', 'w', 'h']) {
      const d = Math.abs(a[k][f] - b[k][f])
      if (d > max) { max = d; who = `${k}.${f}` }
    }
  }
  return { max: Math.round(max * 100) / 100, who }
}

async function runM1(browser) {
  const out = []
  const tblFilter = process.argv[3] ? Number(process.argv[3]) : null
  const vpFilter = process.argv[4] || null
  for (const n of M1_TABLES) for (const vp of M1_VIEWPORTS) {
    if (tblFilter && n !== tblFilter) continue
    if (vpFilter && `${vp.w}x${vp.h}` !== vpFilter) continue
    const key = `${vp.w}x${vp.h}`
    const pre = M1_PRE[key]
    const target = { w: pre.deck.w / 2, h: pre.deck.h / 2 }   // mitad EXACTA del border-box previo
    const page = await browser.newPage({ viewport: { width: vp.w, height: vp.h } })
    await gotoMesa(page, n); await installProbes(page)
    await page.waitForTimeout(300); await page.mouse.move(5, 5)
    // Tokens vivos: gap-left de A1 y el dx de A2 con el que el mazo se recolocó.
    const live = await a2Live(page)
    const fanGapLeft = Number.isFinite(live.gapLeft) && live.gapLeft ? live.gapLeft : 8
    const deckDx = live.deckDx ?? 0

    // Ciclo de 3 manos: el humano es MANO (1ª), PIE (2ª) y sin rol (3ª) → cubre
    // el mazo visible y el oculto sin desmontar (reserva viva de .deck-hidden).
    const states = [{ tag: 'reposo', ...(await m1Snap(page)) }]
    for (let hand = 0; hand < 3; hand++) {
      await clickIf(page, 'button:has-text("Iniciar mano")')
      let closed = false
      for (let i = 0; i < 340; i++) {
        await page.waitForTimeout(230); await page.mouse.move(5, 5)
        if (i % 2 === 0) states.push({ tag: `h${hand}t${i}`, ...(await m1Snap(page)) })
        if (await page.locator('button:has-text("Siguiente mano")').isVisible().catch(() => false)) {
          states.push({ tag: `h${hand}t${i}f`, ...(await m1Snap(page)) }); closed = true; break
        }
        await clickIf(page, '.action-buttons button:has-text("Pasar")') ||
          await clickIf(page, '.action-buttons button:has-text("Igualar")') ||
          await clickIf(page, '.action-buttons button:has-text("Apostar")')
        await clickIf(page, 'button:has-text("Sin descartar")')
      }
      if (!closed || !await clickIf(page, 'button:has-text("Siguiente mano")')) break
      await page.waitForTimeout(1500); await page.mouse.move(5, 5)
      states.push({ tag: `h${hand}-post`, ...(await m1Snap(page)) })
    }

    // Estado de referencia: el primero en el que el humano ES Pie (mazo visible).
    const pieState = states.find(s => s.isPie) || states[0]
    const noPieState = states.find(s => s.isPie === false) || states[0]
    const sawPie = states.some(s => s.isPie)
    const sawNoPie = states.some(s => s.isPie === false)

    // (1) calibre objetivo
    const sizeOk = Math.abs(pieState.deck.w - target.w) <= 0.5 && Math.abs(pieState.deck.h - target.h) <= 0.5
    // (2) esquina superior izquierda EXACTA. La x es la de la fase a MÁS el dx
    //     con el que DSK-A2 recolocó el mazo (leído vivo, no cableado: depende de
    //     la mesa además del viewport). La y sigue siendo la de M1 intacta —
    //     C6 mueve sólo el eje horizontal.
    const anchorExpX = round(pre.deck.x + deckDx)
    const anchorOk = Math.abs(pieState.deck.x - anchorExpX) <= 0.5 && Math.abs(pieState.deck.y - pre.deck.y) <= 0.5
    // (3) compensación: el wrapper conserva su caja de flujo (ancho) y su alto
    const wrapOk = Math.abs(pieState.wrap.w - pre.wrap.w) <= 0.5 && Math.abs(pieState.wrap.h - pre.wrap.h) <= 0.5
    // (4) hueco pila visible → 1ª carta. Era `32 + la mitad que liberó M1 +
    //     --dsk-fan-gap-left` (88 / 95,5): una suma de tres términos históricos que
    //     describía el transitorio abierto por M1. DSK-A2 lo CIERRA convirtiéndolo
    //     en el invariante que fija la tanda — el mazo se recoloca exactamente
    //     hasta dejar el ritmo de A1 y nada más:
    //         pila visible → carta 1 == --dsk-fan-gap-left
    //     Se sigue leyendo el token vivo, así que recalibrar el abanico no deja el
    //     check en rojo permanente (lección A1).
    const gapNow = Math.round((pieState.card1.x - pieState.deck.right) * 100) / 100
    const gapExpected = fanGapLeft
    const gapOk = Math.abs(gapNow - gapExpected) <= 0.5
    // (5) sombras del rival (1/2/3 + 4) en vez de las del humano (2/4/6 + 8)
    const shadowOk = /(^|\s)1px 1px 0px 0px/.test(pieState.shadow || '') && !/8px 8px/.test(pieState.shadow || '')
    // (6) abanico de barajado atado al mazo (se inyecta uno de medición y se retira)
    const fan = await page.evaluate(() => {
      const w = document.querySelector('.player-zone .deck-shuffle-wrapper')
      const d = document.querySelector('.player-zone .deck-pile').getBoundingClientRect()
      const s = document.createElement('div'); s.className = 'shuffle-fan-card'; s.style.animation = 'none'
      w.appendChild(s); const r = s.getBoundingClientRect(); s.remove()
      const rn = x => Math.round(x * 100) / 100
      return { fanW: rn(r.width), fanH: rn(r.height), fanX: rn(r.x), fanY: rn(r.y), deckW: rn(d.width), deckH: rn(d.height), deckX: rn(d.x), deckY: rn(d.y) }
    })
    const fanOk = Math.abs(fan.fanW - fan.deckW) <= 0.5 && Math.abs(fan.fanH - fan.deckH) <= 0.5 &&
      Math.abs(fan.fanX - fan.deckX) <= 0.5 && Math.abs(fan.fanY - fan.deckY) <= 0.5
    // (7) reserva viva: sin Pie el mazo conserva caja y posición (visibility)
    const hiddenReserveOk = !sawNoPie || (Math.abs(noPieState.deck.x - pieState.deck.x) <= 0.5 &&
      Math.abs(noPieState.deck.y - pieState.deck.y) <= 0.5 && Math.abs(noPieState.deck.w - pieState.deck.w) <= 0.5 &&
      Math.abs(noPieState.deck.h - pieState.deck.h) <= 0.5 && noPieState.vis === 'hidden')
    // (8) Δ=0 en TODO el área durante el ciclo completo (incluida la rotación de
    // PIE). Los frames de showdown van aparte: el escalado de las cartas
    // ganadoras recoloca la fila entera y es previo (ver nota en m1Snap).
    let worst = { max: 0, who: null, tag: null }
    let showdownWorst = { max: 0, who: null, tag: null }
    const baseFrame = states[0]
    for (const s of states) {
      const d = m1Delta(s, baseFrame)
      if (s.winner) { if (d.max > showdownWorst.max) showdownWorst = { ...d, tag: s.tag } }
      else if (d.max > worst.max) worst = { ...d, tag: s.tag }
    }
    const cycleStable = worst.max < 0.6
    // (8b) La COMPENSACIÓN se exige en TODOS los frames, showdown incluido, sobre
    // las cajas de LAYOUT: el mazo mide su calibre y el wrapper conserva el ancho
    // de flujo previo (112/127) — eso es lo que impide que nada se recoloque.
    const flowSeq = states.map(s => s.flow).filter(f => f && f.deck && f.wrap)
    const sameFlow = (sel) => flowSeq.every(f => sel(f) && sel(f).w === sel(flowSeq[0]).w && sel(f).h === sel(flowSeq[0]).h)
    const flowConstant = sameFlow(f => f.deck) && sameFlow(f => f.wrap) &&
      (!hasAiFlow(flowSeq) || (sameFlow(f => f.aiDeck) && sameFlow(f => f.aiWrap)))
    const flowWrapOk = flowSeq.length > 0 && Math.abs(flowSeq[0].wrap.w - pre.wrap.w) <= 0.5 && Math.abs(flowSeq[0].wrap.h - pre.wrap.h) <= 0.5
    const flowDeckOk = flowSeq.length > 0 && Math.abs(flowSeq[0].deck.w - target.w) <= 0.5 && Math.abs(flowSeq[0].deck.h - target.h) <= 0.5
    // (9) gemelo de mesa 2: mismo calibre y borde izquierdo/tapa en su sitio
    const hasAi = !!pieState.aiDeck
    const aiSizeOk = !hasAi || (Math.abs(pieState.aiDeck.w - target.w) <= 0.5 && Math.abs(pieState.aiDeck.h - target.h) <= 0.5)
    const aiAnchorOk = !hasAi || (Math.abs(pieState.aiDeck.x - pre.ai.x) <= 0.5 && Math.abs(pieState.aiDeck.y - pre.ai.y) <= 0.5)

    const passed = sizeOk && anchorOk && wrapOk && gapOk && shadowOk && fanOk && hiddenReserveOk &&
      cycleStable && flowConstant && flowWrapOk && flowDeckOk && sawPie && sawNoPie && aiSizeOk && aiAnchorOk

    out.push({
      table: n, vp, target, pre, deckDx, anchorExpX,
      deck: pieState.deck, wrap: pieState.wrap, aiDeck: pieState.aiDeck, shadow: pieState.shadow,
      sizeOk, anchorOk, wrapOk, gapNow, gapExpected, fanGapLeft, gapOk, shadowOk, fan, fanOk,
      hiddenReserveOk, sawPie, sawNoPie, cycleStable, worst, showdownWorst, frames: states.length,
      flowConstant, flowWrapOk, flowDeckOk, flow: flowSeq[0] ?? null,
      hasAi, aiSizeOk, aiAnchorOk, passed,
    })
    console.log(`T${n} ${vp.w}x${vp.h} mazo ${pieState.deck.w}x${pieState.deck.h} (obj ${target.w}x${target.h}) ancla (${pieState.deck.x},${pieState.deck.y}) esp x=${anchorExpX} (dx ${deckDx}) · hueco ${gapNow}/${gapExpected} · Δciclo=${worst.max} ${passed ? 'OK' : 'FAIL'}`)
    await page.close()
  }
  return out
}

// ── A1 · Anclaje arriba-izquierda del abanico humano ─────────────────────────
// Verifica, en las 16 celdas y a lo largo de una rotación COMPLETA de PIE (3
// manos, todas las fases, con y sin cartas repartidas):
//   (1) la esquina superior IZQUIERDA de la 1ª carta es CONSTANTE (Δ=0) — el
//       check crítico de la tanda: es el origen del que colgará F1;
//   (2) los dos huecos coinciden con sus tokens (±0.5px): gap-left contra el
//       borde derecho de la caja reservada del mazo, gap-top contra el borde
//       superior del área;
//   (3) slot y carta comparten anclaje exacto;
//   (4) el mazo sigue en las coordenadas M1 (invariante duro), sea o no PIE;
//   (5) "Tu mejor palo" reubicada: sitio, ciclo de visibility intacto, encaje
//       sin recorte —también con el peor caso inyectado—, cero colisión con el
//       abanico y su lugar en el apilamiento;
//   (6) nada más se movió: alto y tope del área, barra y sus tres columnas,
//       botones y timer contra la baseline PRE-tanda;
//   (7) los tokens primitivos no han derivado del padding vivo que espejan.
// Args: [mesa] [WxH].
const A1_TABLES = [5, 4, 3, 2]
// Baseline PRE-tanda (HEAD, medida en las 16 celdas): TODAS estas magnitudes
// resultaron depender sólo del viewport —la mesa cambia el ancho del área, no
// estas anclas—, así que la tabla va por viewport igual que M1_PRE. Las
// posiciones del mazo son literalmente las de M1_PRE (invariante compartido).
const A1_PRE = {
  // timerDys · el timer NO tiene una sola y: cambia de renglón entre la fase de
  // apuesta (lleva la fila de multiplicadores encima) y la de descarte. Son
  // exactamente DOS posiciones por tier, medidas en HEAD (1366 y 1920) y previas
  // a A1 → el criterio es de PERTENENCIA al juego medido, no de valor único: así
  // se audita el timer en TODAS las fases y no sólo en el frame que toque.
  '1024x768': { zoneTop: 484, zoneH: 262, deck: { x: 246, y: 521 }, wrapW: 112, barDy: 169, leftDx: 19, leftDy: 182.73, centerDy: 169, rightDr: -19, rightDy: 184.95, timerDys: [178.89, 199.39], tagDy: 9 },
  '1280x720': { zoneTop: 436, zoneH: 262, deck: { x: 374, y: 473 }, wrapW: 112, barDy: 169, leftDx: 19, leftDy: 182.73, centerDy: 169, rightDr: -19, rightDy: 184.95, timerDys: [178.89, 199.39], tagDy: 9 },
  '1366x768': { zoneTop: 484, zoneH: 262, deck: { x: 417, y: 521 }, wrapW: 112, barDy: 169, leftDx: 19, leftDy: 182.73, centerDy: 169, rightDr: -19, rightDy: 184.95, timerDys: [178.89, 199.39], tagDy: 9 },
  '1920x937': { zoneTop: 563.5, zoneH: 300, deck: { x: 649, y: 606.5 }, wrapW: 127, barDy: 203, leftDx: 19, leftDy: 213.84, centerDy: 203, rightDr: -19, rightDy: 218.95, timerDys: [211.45, 231.95], tagDy: 13 },
}
// Peor caso de contenido de la línea: el palo más largo del motor y 3 dígitos de
// puntaje (hoy son 2) — la banda debe alojarlo sin recorte.
// DSK-A2 · va como MARCADO, no como texto plano: el JSX envuelve el palo en
// <strong> (negrita) y `textContent` lo perdía. Medido: 182,75 en plano contra
// 185,42 real — 2,67px que hacían parecer suficiente la reserva de 183 de A1.
const A1_WORST_TAG = 'Tu mejor palo: <strong>Espadas</strong> (999 pts)'

async function a1Snap(page) {
  return page.evaluate(() => {
    const rnd = x => x == null ? null : Math.round(x * 100) / 100
    const R = e => { if (!e) return null; const b = e.getBoundingClientRect(); return { x: rnd(b.x), y: rnd(b.y), w: rnd(b.width), h: rnd(b.height), top: rnd(b.top), right: rnd(b.right), bottom: rnd(b.bottom), left: rnd(b.left) } }
    const B = s => R(document.querySelector(s))
    const zone = document.querySelector('.player-zone')
    const z = zone.getBoundingClientRect()
    const rel = o => o ? { dx: rnd(o.left - z.left), dy: rnd(o.top - z.top), dr: rnd(o.right - z.right) } : null
    const pile = document.querySelector('.player-zone .deck-pile')
    const tag = document.querySelector('.player-zone .score-tag-player')
    const slot1 = document.querySelector('.player-zone .cards-row .card-slot-wrapper')
    const screen = document.querySelector('.game-table-screen')
    return {
      zone: B('.player-zone'), row: B('.player-zone .cards-row'),
      wrap: B('.player-zone .deck-shuffle-wrapper'), deck: B('.player-zone .deck-pile'),
      card1: R(slot1),
      // la CARTA dentro del primer slot: slots y cartas deben compartir anclaje
      card1Inner: R(slot1 ? slot1.querySelector('.playing-card') : null),
      cardN: (() => { const l = [...document.querySelectorAll('.player-zone .cards-row .card-slot-wrapper')].pop(); return R(l) })(),
      slots: document.querySelectorAll('.player-zone .cards-row .card-slot-wrapper').length,
      bar: B('.player-bar'),
      relBar: rel(B('.player-bar')), relLeft: rel(B('.player-bar-left')),
      relCenter: rel(B('.player-bar-center')), relRight: rel(B('.player-bar-right')),
      relTimer: rel(B('.timer-display')), relTag: rel(B('.player-zone .score-tag-player')),
      // OJO: 'tagBox', no 'tag' — el frame ya usa 'tag' como etiqueta de estado y
      // el spread del snapshot la pisaría (los deltas reportarían una caja en vez
      // del frame culpable).
      tagBox: R(tag),
      tagText: tag ? tag.textContent.trim() : null,
      tagVis: tag ? getComputedStyle(tag).visibility : null,
      // recorte real: el contenido no cabe en la caja confinada por max-width
      tagClipped: tag ? tag.scrollWidth > tag.clientWidth + 0.5 : null,
      isPie: pile ? !pile.classList.contains('deck-hidden') : null,
      overflow: screen ? screen.scrollHeight - screen.clientHeight : null,
      // flujo del wrapper (invariante M1): los márgenes de A1 no deben tocarlo
      flowWrap: (() => { const w = document.querySelector('.player-zone .deck-shuffle-wrapper'); return w ? { w: w.offsetWidth, h: w.offsetHeight } : null })(),
    }
  })
}

// Tokens vivos + los paddings que espejan (guardia de deriva) y el gap de fila.
async function a1Tokens(page) {
  return page.evaluate(() => {
    const num = v => parseFloat(v) || 0
    const zone = document.querySelector('.player-zone')
    const row = document.querySelector('.player-zone .cards-row')
    const cs = getComputedStyle(document.querySelector('.game-table-screen'))
    const zs = getComputedStyle(zone), rs = getComputedStyle(row)
    const px = n => num(cs.getPropertyValue(n))
    return {
      gapTop: px('--dsk-fan-gap-top'), gapLeft: px('--dsk-fan-gap-left'),
      band: px('--dsk-fan-band'),
      // --dsk-fan-row-w es un calc(): una custom property NO computa a px, así
      // que se lee su valor EFECTIVO por donde se consume — el padding-left que
      // reproduce el inset del centrado: rowW = anchoDeFila − 2·padding-left.
      rowWRaw: cs.getPropertyValue('--dsk-fan-row-w').trim(),
      rowWResolved: num(row.getBoundingClientRect().width) - 2 * num(rs.paddingLeft),
      zonePadTop: px('--dsk-zone-pad-top'), zonePadLeft: px('--dsk-zone-pad-left'),
      rowPadTop: px('--dsk-row-pad-top'),
      livePadTop: num(zs.paddingTop), livePadLeft: num(zs.paddingLeft),
      liveRowPadTop: num(rs.paddingTop), liveRowPadLeft: num(rs.paddingLeft), liveRowGap: num(rs.columnGap),
      justify: rs.justifyContent, zonePosition: zs.position,
      cardW: num(getComputedStyle(document.documentElement).getPropertyValue('--card-w')),
    }
  })
}

async function runA1(browser) {
  const out = []
  const tblFilter = process.argv[3] ? Number(process.argv[3]) : null
  const vpFilter = process.argv[4] || null
  for (const n of A1_TABLES) for (const vp of VIEWPORTS) {
    if (tblFilter && n !== tblFilter) continue
    if (vpFilter && `${vp.w}x${vp.h}` !== vpFilter) continue
    const key = `${vp.w}x${vp.h}`
    const pre = A1_PRE[key]
    const page = await browser.newPage({ viewport: { width: vp.w, height: vp.h } })
    await gotoMesa(page, n); await installProbes(page)
    await page.waitForTimeout(300); await page.mouse.move(5, 5)

    const tok = await a1Tokens(page)
    const live = await a2Live(page)      // dx de A2, leídos por valor usado
    // Rotación completa de PIE: 3 manos (mismo ciclo que M1) → el humano es
    // MANO, PIE y sin rol, y se recorren todas las fases con y sin cartas.
    const states = [{ tag: 'reposo', ...(await a1Snap(page)) }]
    for (let hand = 0; hand < 3; hand++) {
      await clickIf(page, 'button:has-text("Iniciar mano")')
      let closed = false
      for (let i = 0; i < 340; i++) {
        await page.waitForTimeout(230); await page.mouse.move(5, 5)
        if (i % 2 === 0) states.push({ tag: `h${hand}t${i}`, ...(await a1Snap(page)) })
        if (await page.locator('button:has-text("Siguiente mano")').isVisible().catch(() => false)) {
          states.push({ tag: `h${hand}t${i}f`, ...(await a1Snap(page)) }); closed = true; break
        }
        await clickIf(page, '.action-buttons button:has-text("Pasar")') ||
          await clickIf(page, '.action-buttons button:has-text("Igualar")') ||
          await clickIf(page, '.action-buttons button:has-text("Apostar")')
        await clickIf(page, 'button:has-text("Sin descartar")')
      }
      if (!closed || !await clickIf(page, 'button:has-text("Siguiente mano")')) break
      await page.waitForTimeout(1500); await page.mouse.move(5, 5)
      states.push({ tag: `h${hand}-post`, ...(await a1Snap(page)) })
    }

    const worstOf = (get) => {
      let max = 0, who = null
      for (const s of states) { const v = get(s); if (v == null) continue; if (Math.abs(v) > max) { max = Math.abs(v); who = s.tag } }
      return { max: round(max), tag: who }
    }
    const every = (fn) => states.every(s => fn(s) !== false)

    // (1) origen del abanico CONSTANTE en todos los frames (Δ=0)
    const base = states[0]
    const dOriginX = worstOf(s => s.card1 ? s.card1.x - base.card1.x : null)
    const dOriginY = worstOf(s => s.card1 ? s.card1.y - base.card1.y : null)
    const originConst = dOriginX.max < 0.5 && dOriginY.max < 0.5
    // (2) huecos = tokens. DSK-A2 re-expresa el horizontal contra la PILA VISIBLE:
    //     con el abanico centrado, el hueco contra el borde de la reserva del
    //     wrapper deja de ser --dsk-fan-gap-left (se le suman los dos dx), pero el
    //     que se ve —pila → carta 1— vale el token exacto por construcción de C6.
    const dGapLeft = worstOf(s => (s.card1 && s.deck) ? (s.card1.left - s.deck.right) - tok.gapLeft : null)
    const dGapTop = worstOf(s => (s.card1 && s.zone) ? (s.card1.top - s.zone.top) - tok.gapTop : null)
    const gapsOk = dGapLeft.max <= 0.5 && dGapTop.max <= 0.5
    // (3) slot y carta comparten anclaje
    const dSlotCardX = worstOf(s => s.card1Inner ? s.card1Inner.x - s.card1.x : null)
    const dSlotCardY = worstOf(s => s.card1Inner ? s.card1Inner.y - s.card1.y : null)
    const slotCardShared = dSlotCardX.max <= 0.5 && dSlotCardY.max <= 0.5
    // (4) mazo en coordenadas M1 exactas + el dx de A2 (leído vivo), con y sin PIE
    const deckExpX = round(pre.deck.x + (live.deckDx ?? 0))
    const dDeckX = worstOf(s => s.deck ? s.deck.x - deckExpX : null)
    const dDeckY = worstOf(s => s.deck ? s.deck.y - pre.deck.y : null)
    const deckOk = dDeckX.max <= 0.5 && dDeckY.max <= 0.5
    const sawPie = states.some(s => s.isPie), sawNoPie = states.some(s => s.isPie === false)
    const flowWrapOk = every(s => !s.flowWrap || (Math.abs(s.flowWrap.w - pre.wrapW) <= 0.5 && s.flowWrap.h === states[0].flowWrap.h))
    // (5) la línea: aquí quedan sólo su CICLO y su ENCAJE. DSK-A2 la mudó de la
    //     banda superior izquierda a debajo de las cartas, así que los checks de
    //     SITIO (tagNoCollision contra la carta 1, dTagDx/dTagDy contra el rincón
    //     de A1, y el apilamiento del peor caso) ya no describen nada: viven ahora
    //     en el modo a2, contra su casa nueva. Lo que no cambió —y por eso sigue
    //     aquí— es que sólo aparece en la fase de pago y que su reserva la aloja.
    const tagFrames = states.filter(s => s.tagVis === 'visible' && s.tagText)
    const tagCycleOk = tagFrames.length > 0 && states.some(s => s.tagVis === 'hidden')
    const tagFits = tagFrames.every(s => !s.tagClipped)
    // (6) nada más movido (baseline PRE-tanda)
    const dZoneTop = worstOf(s => s.zone.top - pre.zoneTop)
    const dZoneH = worstOf(s => s.zone.h - pre.zoneH)
    const dBar = worstOf(s => s.relBar ? s.relBar.dy - pre.barDy : null)
    const dLeftX = worstOf(s => s.relLeft ? s.relLeft.dx - pre.leftDx : null)
    const dLeftY = worstOf(s => s.relLeft ? s.relLeft.dy - pre.leftDy : null)
    const dCenterY = worstOf(s => s.relCenter ? s.relCenter.dy - pre.centerDy : null)
    // los botones van centrados por el grid: se exige simetría, no una x fija
    const dCenterSym = worstOf(s => s.relCenter ? s.relCenter.dx + s.relCenter.dr : null)
    const dRightR = worstOf(s => s.relRight ? s.relRight.dr - pre.rightDr : null)
    const dRightY = worstOf(s => s.relRight ? s.relRight.dy - pre.rightDy : null)
    // Timer · el criterio es de pertenencia al juego de renglones medido en HEAD
    // (ver A1_PRE.timerDys): cada frame con timer debe caer en uno de ellos. Así
    // queda auditado en TODAS las fases —apuesta y descarte— en vez de en el
    // frame que toque muestrear. Se exige además que nunca salga de su columna,
    // cuya caja A1 prueba inmóvil por separado (dCenterY / dCenterSym).
    const timerDys = [...new Set(states.filter(s => s.relTimer).map(s => s.relTimer.dy))].sort((a, b) => a - b)
    const dTimerY = { max: round(Math.max(0, ...timerDys.map(y => Math.min(...pre.timerDys.map(p => Math.abs(y - p)))))), tag: 'set' }
    const timerInsideCenter = states.every(s => !s.relTimer || !s.relCenter ||
      (s.relTimer.dy >= s.relCenter.dy - 0.5 && s.relTimer.dx >= s.relCenter.dx - 0.5))
    const sawTimer = states.some(s => s.relTimer)
    const untouched = [dZoneTop, dZoneH, dBar, dLeftX, dLeftY, dCenterY, dCenterSym, dRightR, dRightY, dTimerY].every(d => d.max <= 0.5) && timerInsideCenter && sawTimer
    const overflowOk = every(s => s.overflow === 0)

    // (5b) peor caso de contenido: la reserva debe alojarlo SIN recorte. Se inyecta
    // con innerHTML porque el marcado real lleva <strong> (ver A1_WORST_TAG); con
    // textContent se medían 2,67px de menos y la reserva parecía sobrada.
    const worstCase = await page.evaluate((html) => {
      const t = document.querySelector('.player-zone .score-tag-player')
      if (!t) return null
      const prev = t.innerHTML, prevVis = t.style.visibility
      t.innerHTML = html; t.style.visibility = 'visible'
      const b = t.getBoundingClientRect()
      const rnd = x => Math.round(x * 100) / 100
      const el = document.elementFromPoint(Math.round(b.left + b.width / 2), Math.round(b.top + b.height / 2))
      const r = {
        html, boxW: rnd(b.width), contentW: t.scrollWidth, clipped: t.scrollWidth > t.clientWidth + 0.5,
        onTop: !!el && (el === t || t.contains(el)),
      }
      t.innerHTML = prev; t.style.visibility = prevVis
      return r
    }, A1_WORST_TAG)
    const worstOk = !!worstCase && !worstCase.clipped && worstCase.onTop

    // (7) guardia de deriva de los tokens primitivos
    const tokensOk = Math.abs(tok.zonePadTop - tok.livePadTop) <= 0.01 &&
      Math.abs(tok.zonePadLeft - tok.livePadLeft) <= 0.01 &&
      Math.abs(tok.rowPadTop - tok.liveRowPadTop) <= 0.01 &&
      Math.abs(tok.liveRowGap - 8) <= 0.01 &&
      tok.justify === 'flex-start' && tok.zonePosition === 'relative' &&
      Math.abs(tok.rowWResolved - (tok.cardW * 6 + 76)) <= 0.5

    const passed = originConst && gapsOk && slotCardShared && deckOk && sawPie && sawNoPie &&
      flowWrapOk && tagCycleOk && tagFits && worstOk &&
      untouched && overflowOk && tokensOk

    out.push({
      table: n, vp, pre, tokens: tok, a2: live, frames: states.length,
      origin: { x: base.card1.x, y: base.card1.y, dX: dOriginX, dY: dOriginY, originConst },
      gaps: { left: round(base.card1.left - base.deck.right), top: round(base.card1.top - base.zone.top), dGapLeft, dGapTop, gapsOk },
      slotCard: { dSlotCardX, dSlotCardY, slotCardShared },
      deck: { x: base.deck.x, y: base.deck.y, deckExpX, dDeckX, dDeckY, deckOk, sawPie, sawNoPie, flowWrapOk },
      tag: { frames: tagFrames.length, sample: tagFrames[0]?.tagText ?? null, tagCycleOk, tagFits, worstCase, worstOk },
      untouchedDeltas: { dZoneTop, dZoneH, dBar, dLeftX, dLeftY, dCenterY, dCenterSym, dRightR, dRightY, dTimerY, timerDys, timerInsideCenter, sawTimer, untouched },
      overflowOk, tokensOk, passed,
    })
    console.log(`T${n} ${vp.w}x${vp.h} origen (${base.card1.x},${base.card1.y}) Δ=${Math.max(dOriginX.max, dOriginY.max)} · gaps pila→c1=${round(base.card1.left - base.deck.right)}/${tok.gapLeft} T=${round(base.card1.top - base.zone.top)}/${tok.gapTop} · mazo (${base.deck.x},${base.deck.y}) esp ${deckExpX} Δ=${Math.max(dDeckX.max, dDeckY.max)} · línea ${tagFrames.length}f fit=${tagFits} peor=${worstCase?.contentW}/${live.bandW} · resto Δ=${Math.max(...[dZoneTop, dZoneH, dBar, dLeftX, dLeftY, dCenterY, dCenterSym, dRightR, dRightY, dTimerY].map(d => d.max))} · ${passed ? 'OK' : 'FAIL'}`)
    await page.close()
  }
  return out
}

// ── F1 · Crecimiento adaptativo de las cartas del humano ─────────────────────
// Verifica, en las 16 celdas y a lo largo de una rotación de PIE con paso por la
// fase de DESCARTE y carta SELECCIONADA:
//   (1) el tamaño coincide con la fórmula, RECALCULADA en vivo desde lo medido
//       (pista, techo libre, piso) — nada cableado, para que recalibrar aires o
//       gaps no deje el check en rojo permanente (lección del gapOk de m1);
//   (2) la proporción 1055:1491 se conserva y el arte no letterboxea;
//   (3) slot y carta son la MISMA caja en los tres estados (cara, dorso, vacío);
//   (4) piso invariante: ninguna celda encoge respecto al tamaño PRE-F1;
//   (5) los dos aires valen lo que dicen sus tokens;
//   (6) PEOR CASO VERTICAL — carta seleccionada (translateY(-18px)): su tope
//       queda DENTRO del área (≥ 0 respecto al borde) y SIN CONTACTO con el
//       óvalo, en las 16 celdas;
//   (7) no se movió nada: origen de A1, mazo en coordenadas M1, alto y tope del
//       área, barra, y overflow del scroller en 0.
// Args: [mesa] [WxH].
const F1_TABLES = [5, 4, 3, 2]
const ART_W = 1055, ART_H = 1491
// Tamaño PRE-F1 por viewport = piso invariante de la tanda (nadie encoge).
const F1_FLOOR = {
  '1024x768': { w: 76, h: 118 }, '1280x720': { w: 76, h: 118 },
  '1366x768': { w: 76, h: 118 }, '1920x937': { w: 91, h: 142 },
}
// DSK-A2 · SEGUNDA puerta del piso. `sizeOk` recalcula el esperado desde el
// rowContentW VIVO, así que un mecanismo que cambiara ese ancho movería fórmula y
// medida a la vez y el check seguiría verde (fue el caso del candidato C1
// vetado en el diagnóstico A2: +3,75 / +5,60px de carta sin que nada se quejara).
// Por eso el piso se ancla además al valor PRE-A2, medido sobre HEAD b79edd5 por
// (mesa, viewport): centrar el abanico no puede tocarlo ni un centésimo.
const F1_A2 = {
  '1024x768': { 5: 94.09, 4: 94.09, 3: 94.09, 2: 94.09 },
  '1280x720': { 5: 94.09, 4: 94.09, 3: 94.09, 2: 94.09 },
  '1366x768': { 5: 94.09, 4: 94.09, 3: 94.09, 2: 94.09 },
  '1440x850': { 5: 98.34, 4: 98.34, 3: 94.59, 2: 94.59 },
  '1920x937': { 5: 115.33, 4: 115.33, 3: 100.59, 2: 100.59 },
}

async function f1Snap(page) {
  return page.evaluate(({ ART_W, ART_H }) => {
    const rnd = x => x == null ? null : Math.round(x * 100) / 100
    const R = e => { if (!e) return null; const b = e.getBoundingClientRect(); return { x: rnd(b.x), y: rnd(b.y), w: rnd(b.width), h: rnd(b.height), top: rnd(b.top), right: rnd(b.right), bottom: rnd(b.bottom), left: rnd(b.left) } }
    const B = s => R(document.querySelector(s))
    const num = v => parseFloat(v) || 0
    const zone = document.querySelector('.player-zone')
    const row = document.querySelector('.player-zone .cards-row')
    const wrap = document.querySelector('.player-zone .deck-shuffle-wrapper')
    const slots = [...document.querySelectorAll('.player-zone .cards-row .card-slot-wrapper')]
    const rs = getComputedStyle(row)
    const z = zone.getBoundingClientRect()
    const rel = o => o ? { dx: rnd(o.left - z.left), dy: rnd(o.top - z.top) } : null
    const screen = document.querySelector('.game-table-screen')
    const s1 = slots[0]
    const card1 = s1 ? s1.querySelector('.playing-card') : null
    const img1 = card1 ? card1.querySelector('img') : null
    const sel = document.querySelector('.player-zone .playing-card.card-selected')
    return {
      zone: B('.player-zone'), deck: B('.player-zone .deck-pile'), bar: B('.player-bar'),
      center: B('.center-zone'),
      slot1: R(s1), slotN: R(slots[slots.length - 1]), slots: slots.length,
      card1: R(card1), img1: R(img1),
      // arte realmente pintado dentro del <img> (object-fit: contain)
      art: img1 ? (() => {
        const b = img1.getBoundingClientRect()
        const k = Math.min(b.width / ART_W, b.height / ART_H)
        return { drawnW: rnd(ART_W * k), drawnH: rnd(ART_H * k), boxW: rnd(b.width), boxH: rnd(b.height) }
      })() : null,
      rowContentW: rnd(row.getBoundingClientRect().width - num(rs.paddingLeft)),
      contentRight: rnd(row.getBoundingClientRect().right),
      rowGap: num(rs.columnGap),
      reserveH: wrap ? wrap.offsetHeight : null,
      relBar: rel(B('.player-bar')),
      selected: sel ? R(sel) : null,
      overflow: screen.scrollHeight - screen.clientHeight,
    }
  }, { ART_W, ART_H })
}

async function f1Tokens(page) {
  return page.evaluate(() => {
    const num = v => parseFloat(v) || 0
    const cs = getComputedStyle(document.querySelector('.game-table-screen'))
    const root = getComputedStyle(document.documentElement)
    return {
      airX: num(cs.getPropertyValue('--dsk-hand-air-x')), airY: num(cs.getPropertyValue('--dsk-hand-air-y')),
      gapLeft: num(cs.getPropertyValue('--dsk-fan-gap-left')), gapTop: num(cs.getPropertyValue('--dsk-fan-gap-top')),
      cardW: num(root.getPropertyValue('--card-w')), cardH: num(root.getPropertyValue('--card-h')),
      cardBox: getComputedStyle(document.querySelector('.player-zone .cards-row .playing-card') || document.body).boxSizing,
      slotAlign: getComputedStyle(document.querySelector('.player-zone .cards-row .card-slot-wrapper')).alignSelf,
      slotAR: getComputedStyle(document.querySelector('.player-zone .cards-row .card-slot-wrapper')).aspectRatio,
    }
  })
}

async function runF1(browser) {
  const out = []
  const tblFilter = process.argv[3] ? Number(process.argv[3]) : null
  const vpFilter = process.argv[4] || null
  for (const n of F1_TABLES) for (const vp of VIEWPORTS) {
    if (tblFilter && n !== tblFilter) continue
    if (vpFilter && `${vp.w}x${vp.h}` !== vpFilter) continue
    const key = `${vp.w}x${vp.h}`
    const pre = A1_PRE[key], floor = F1_FLOOR[key]
    const page = await browser.newPage({ viewport: { width: vp.w, height: vp.h } })
    await gotoMesa(page, n); await installProbes(page)
    await page.waitForTimeout(300); await page.mouse.move(5, 5)
    const tok = await f1Tokens(page)
    const live = await a2Live(page)

    // Ciclo: hasta 4 manos, muestreando y parando a SELECCIONAR en cuanto se
    // abre la fase de descarte (el peor caso vertical de la tanda).
    const states = [{ tag: 'reposo', ...(await f1Snap(page)) }]
    let selFrame = null
    for (let hand = 0; hand < 4 && !selFrame; hand++) {
      await clickIf(page, 'button:has-text("Iniciar mano")')
      let closed = false
      for (let i = 0; i < 340; i++) {
        await page.waitForTimeout(230); await page.mouse.move(5, 5)
        if (i % 2 === 0) states.push({ tag: `h${hand}t${i}`, ...(await f1Snap(page)) })
        if (!selFrame && await page.locator('.discard-area .btn').first().isVisible().catch(() => false)) {
          // selecciona TODAS las clicables: el peor caso es cualquiera de ellas
          await page.evaluate(() => [...document.querySelectorAll('.player-zone .playing-card.card-clickable')].forEach(el => el.click()))
          await page.waitForTimeout(350); await page.mouse.move(5, 5)
          selFrame = { tag: `h${hand}-sel`, ...(await f1Snap(page)) }
          states.push(selFrame)
        }
        if (await page.locator('button:has-text("Siguiente mano")').isVisible().catch(() => false)) {
          states.push({ tag: `h${hand}t${i}f`, ...(await f1Snap(page)) }); closed = true; break
        }
        await clickIf(page, '.action-buttons button:has-text("Pasar")') ||
          await clickIf(page, '.action-buttons button:has-text("Igualar")') ||
          await clickIf(page, '.action-buttons button:has-text("Apostar")')
        await clickIf(page, 'button:has-text("Sin descartar")')
      }
      if (!closed || !await clickIf(page, 'button:has-text("Siguiente mano")')) break
      await page.waitForTimeout(1500); await page.mouse.move(5, 5)
    }

    const base = states[0]
    const worstOf = (get) => {
      let max = 0, who = null
      for (const s of states) { const v = get(s); if (v == null) continue; if (Math.abs(v) > max) { max = Math.abs(v); who = s.tag } }
      return { max: round(max), tag: who }
    }

    // ── (1) tamaño esperado, RECALCULADO desde lo medido (nada cableado)
    const rise = round(base.deck.y - base.slot1.y)          // subida que recupera el mazo
    const horizBound = round((base.rowContentW - (tok.cardW + 36) - tok.gapLeft - (base.slots - 1) * base.rowGap - tok.airX) / base.slots)
    const vertBound = round((rise + base.reserveH - tok.airY) * ART_W / ART_H)
    const floorW = round(tok.cardH * ART_W / ART_H)
    const expectedW = round(Math.max(floorW, Math.min(horizBound, vertBound)))
    const bound = horizBound <= vertBound ? 'pista' : 'techo'
    const sizeOk = Math.abs(base.slot1.w - expectedW) <= 0.5
    // ── (2) proporción + arte sin letterbox (dentro del borde de la carta)
    const ratioOk = Math.abs(base.slot1.h - base.slot1.w * ART_H / ART_W) <= 0.5
    const artFrames = states.filter(s => s.art)
    const artWasteH = artFrames.length ? round(Math.max(...artFrames.map(s => s.art.boxH - s.art.drawnH))) : null
    const artWasteW = artFrames.length ? round(Math.max(...artFrames.map(s => s.art.boxW - s.art.drawnW))) : null
    // el borde de 1px de la carta deja ≤1px de letterbox residual: es su marco
    const artOk = artFrames.length > 0 && artWasteH <= 1.2 && artWasteW <= 1.2
    // ── (3) slot y carta = misma caja, en los tres estados (cara/dorso/vacío)
    const dCardBox = worstOf(s => s.card1 ? Math.max(Math.abs(s.card1.w - s.slot1.w), Math.abs(s.card1.h - s.slot1.h)) : null)
    const cardIsSlot = dCardBox.max <= 0.5
    const dSizeW = worstOf(s => s.slot1 ? s.slot1.w - base.slot1.w : null)
    const dSizeH = worstOf(s => s.slot1 ? s.slot1.h - base.slot1.h : null)
    const sizeConst = dSizeW.max <= 0.5 && dSizeH.max <= 0.5
    // ── (4) piso invariante · DOBLE puerta (ver F1_A2): nunca encoge respecto a
    //     PRE-F1, y además vale EXACTAMENTE lo que valía antes de DSK-A2.
    const preW = F1_A2[key]?.[n] ?? null
    const preOk = preW == null || Math.abs(base.slot1.w - preW) <= 0.01
    const floorOk = base.slot1.w >= floor.w - 0.01 && base.slot1.h >= floor.h - 0.01 && preOk
    // ── (5) los dos aires valen lo que dicen. DSK-A2 · el derecho pasa de tener
    //     una COTA a tener un VALOR exacto, pero ese valor NO es `airX + |dx|`:
    //     --dsk-hand-air-x es el respiro que reserva la PISTA, y sólo en las
    //     celdas donde la pista gana el min() de F1 el aire sobrante valía el
    //     token. Donde manda el techo vertical la carta se queda corta y sobra
    //     mucho más (81,55 medidos en mesa 5 · 1024, contra 18 del token). La
    //     expectativa se deriva entera de lo vivo: lo que quedaba de la fila antes
    //     de centrar, más lo que el abanico se ha corrido a la izquierda.
    const airXNow = worstOf(s => s.slotN ? -(s.contentRight - s.slotN.right) : null)   // peor (mínimo) aire
    const airXMin = round(Math.min(...states.filter(s => s.slotN).map(s => s.contentRight - s.slotN.right)))
    const airXPre = round(base.rowContentW - (tok.cardW + 36 + tok.gapLeft) - (base.slots * base.slot1.w + (base.slots - 1) * base.rowGap))
    const airXExp = round(airXPre + Math.abs(live.centerDx ?? 0))
    const airYMin = round(Math.min(...states.filter(s => s.slot1).map(s => (s.deck.y + s.reserveH) - s.slot1.bottom)))
    const airOk = Math.abs(airXMin - airXExp) <= 0.5 && airYMin >= tok.airY - 0.5
    // ── (6) PEOR CASO: carta seleccionada
    const selTopVsZone = selFrame?.selected ? round(selFrame.selected.top - selFrame.zone.top) : null
    const selTopVsOval = (selFrame?.selected && selFrame.center) ? round(selFrame.selected.top - selFrame.center.bottom) : null
    const selReached = !!selFrame?.selected
    const selInsideArea = selReached && selTopVsZone >= -0.01
    const selClearsOval = selReached && selTopVsOval >= 0
    // ── (7) nada movido (el mazo, en sus coordenadas M1 + el dx vivo de A2)
    const deckExpX = round(pre.deck.x + (live.deckDx ?? 0))
    const dDeckX = worstOf(s => s.deck ? s.deck.x - deckExpX : null)
    const dDeckY = worstOf(s => s.deck ? s.deck.y - pre.deck.y : null)
    const dOriginX = worstOf(s => s.slot1 ? s.slot1.x - base.slot1.x : null)
    const dOriginY = worstOf(s => s.slot1 ? s.slot1.y - base.slot1.y : null)
    const dZoneTop = worstOf(s => s.zone.top - pre.zoneTop)
    const dZoneH = worstOf(s => s.zone.h - pre.zoneH)
    const dBar = worstOf(s => s.relBar ? s.relBar.dy - pre.barDy : null)
    const overflowOk = states.every(s => s.overflow === 0)
    const untouched = [dDeckX, dDeckY, dOriginX, dOriginY, dZoneTop, dZoneH, dBar].every(d => d.max <= 0.5)

    const passed = sizeOk && ratioOk && artOk && cardIsSlot && sizeConst && floorOk && airOk &&
      selReached && selInsideArea && selClearsOval && untouched && overflowOk &&
      tok.cardBox === 'border-box' && tok.slotAlign === 'flex-start'

    out.push({
      table: n, vp, tokens: tok, a2: live, frames: states.length,
      size: { w: base.slot1.w, h: base.slot1.h, expectedW, horizBound, vertBound, floorW, bound, rise, reserveH: base.reserveH, sizeOk, ratioOk, floorOk, floor, preW, preOk },
      art: { sample: base.art ?? artFrames[0]?.art ?? null, artWasteW, artWasteH, artOk },
      caja: { dCardBox, cardIsSlot, dSizeW, dSizeH, sizeConst },
      aire: { airXMin, airXPre, airXExp, airYMin, tokenX: tok.airX, tokenY: tok.airY, airOk },
      seleccion: { selReached, selTopVsZone, selTopVsOval, selInsideArea, selClearsOval, tag: selFrame?.tag ?? null },
      intacto: { deckExpX, dDeckX, dDeckY, dOriginX, dOriginY, dZoneTop, dZoneH, dBar, overflowOk, untouched },
      passed,
    })
    console.log(`T${n} ${vp.w}x${vp.h} carta ${base.slot1.w}x${base.slot1.h} (esp ${expectedW}, pre-A2 ${preW}, manda ${bound}) · arte waste ${artWasteW}/${artWasteH} · aire x=${airXMin}/${airXExp} y=${airYMin}/${tok.airY} · SEL tope vs área=${selTopVsZone} vs óvalo=${selTopVsOval} · mazo Δ=${Math.max(dDeckX.max, dDeckY.max)} origen Δ=${Math.max(dOriginX.max, dOriginY.max)} área Δ=${Math.max(dZoneTop.max, dZoneH.max, dBar.max)} · ${passed ? 'OK' : 'FAIL'}`)
    await page.close()
  }
  return out
}

// ── Z1 · Zoom de hover en las cartas reveladas de la IA ──────────────────────
// Con hover REAL (mouse.move) carta por carta, en las 16 celdas:
//   (1) la caja ampliada cabe en el perímetro del área y no invade la zona
//       humana (contra las cajas VIVAS de F1);
//   (2) el centro de .opp-name del panel sigue siendo hit-testable con el zoom
//       activo — es el único nodo con handler, taparlo sería una trampa;
//   (3) Δ=0 absoluto de todo lo demás durante el hover: mazo, óvalo, paneles
//       vecinos, zona humana, área total y scroll;
//   (4) la escala efectiva es la del token (±0.02) y el borde ANCLADO por
//       asiento no se mueve (es lo que detecta una desincronización futura de
//       los coeficientes de R2b, que esta tanda espeja);
//   (5) el hover queda suprimido durante la coreografía R2: se dispara sobre una
//       carta en pleno `collect` y la fase debe completar sin congelarse.
// Expectativas leídas de tokens vivos. Args: [mesa] [WxH].
const Z1_TABLES = [5, 4, 3, 2]
// Borde que ancla cada asiento (doctrina R2: crecer hacia el centro / hacia abajo)
const Z1_ANCHOR = {
  'opp-side-left': ['left'], 'opp-side-right': ['right'],
  'opp-top-left': ['top'], 'opp-top-right': ['top'], 'opp-top-center': ['top'],
  'ai-zone': ['top'],            // a 1920 se le suma 'left' (ver abajo)
}
// Los laterales anclan además el borde superior (ver el bloque DSK-Z1 del CSS:
// con el eje y centrado la carta le tapaba el centro del nombre).
Z1_ANCHOR['opp-side-left'].push('top'); Z1_ANCHOR['opp-side-right'].push('top')

async function z1Install(page) {
  await page.evaluate(() => {
    window.__z1rect = (el) => { if (!el) return null; const b = el.getBoundingClientRect(); const r = x => Math.round(x * 100) / 100; return { x: r(b.x), y: r(b.y), w: r(b.width), h: r(b.height), top: r(b.top), right: r(b.right), bottom: r(b.bottom), left: r(b.left) } }
    // anclas que NO deben moverse durante el hover
    window.__z1anchors = () => {
      const R = window.__z1rect, q = s => document.querySelector(s), qa = s => [...document.querySelectorAll(s)]
      const scr = q('.game-table-screen')
      return {
        table: R(q('.game-table')), oval: R(q('.center-zone')), zone: R(q('.player-zone')),
        deck: R(q('.player-zone .deck-pile')), bar: R(q('.player-bar')),
        humanCards: qa('.player-zone .cards-row .card-slot-wrapper').map(R),
        panels: qa('.opp-panel, .ai-zone').map(R),
        otherCards: qa('.opp-panel .opp-card-slot, .ai-zone .card-slot-wrapper').map(R),
        scroll: { l: scr.scrollLeft, t: scr.scrollTop, w: scr.scrollWidth, h: scr.scrollHeight, cw: scr.clientWidth, ch: scr.clientHeight },
      }
    }
    // censo de cartas con CARA visible (criterio estructural, igual que el CSS)
    window.__z1cards = () => {
      const out = []
      document.querySelectorAll('.opp-panel, .ai-zone').forEach((p) => {
        const seat = [...p.classList].find(c => /^opp-(side|top)/.test(c)) || (p.classList.contains('ai-zone') ? 'ai-zone' : 'opp-?')
        p.querySelectorAll('.opp-card-slot, .card-slot-wrapper').forEach((sl, i) => {
          const c = sl.querySelector('.playing-card')
          if (!c || c.classList.contains('card-back') || c.classList.contains('card-empty')) return
          out.push({ seat, idx: i })
        })
      })
      return out
    }
    window.__z1slot = (seat, idx) => {
      const p = [...document.querySelectorAll('.opp-panel, .ai-zone')]
        .find(p => ([...p.classList].find(c => /^opp-(side|top)/.test(c)) || (p.classList.contains('ai-zone') ? 'ai-zone' : '')) === seat)
      if (!p) return null
      return p.querySelectorAll('.opp-card-slot, .card-slot-wrapper')[idx] || null
    }
    window.__z1measure = (seat, idx) => {
      const sl = window.__z1slot(seat, idx); if (!sl) return null
      const p = sl.closest('.opp-panel, .ai-zone')
      const name = p.querySelector('.opp-name, .ai-name')
      const nb = name ? name.getBoundingClientRect() : null
      let hitName = null
      if (nb) {
        const el = document.elementFromPoint(Math.round((nb.left + nb.right) / 2), Math.round((nb.top + nb.bottom) / 2))
        hitName = !!el && (el === name || name.contains(el))
      }
      const t = document.querySelector('.game-table'), ts = getComputedStyle(t), tb = t.getBoundingClientRect()
      const num = v => parseFloat(v) || 0
      return {
        box: window.__z1rect(sl), hitName,
        perim: { left: tb.left + num(ts.borderLeftWidth), right: tb.right - num(ts.borderRightWidth), top: tb.top + num(ts.borderTopWidth), bottom: tb.bottom - num(ts.borderBottomWidth) },
        transform: getComputedStyle(sl).transform, zIndex: getComputedStyle(sl).zIndex,
        panelZ: getComputedStyle(p).zIndex,
      }
    }
    window.__z1tokens = () => {
      const num = v => parseFloat(v) || 0
      const cs = getComputedStyle(document.querySelector('.game-table-screen'))
      return { scale: num(cs.getPropertyValue('--dsk-z1-scale')), ms: cs.getPropertyValue('--dsk-z1-ms').trim(), base: num(cs.getPropertyValue('--dsk-z1-base')), slotZ: num(cs.getPropertyValue('--dsk-z1-slot-z')), panelZ: num(cs.getPropertyValue('--dsk-z1-panel-z')) }
    }
  })
}

const z1Delta = (a, b) => {
  let max = 0, who = null
  const cmp = (k, x, y) => { if (!x || !y) return; for (const f of ['x', 'y', 'w', 'h']) { const d = Math.abs(x[f] - y[f]); if (d > max) { max = d; who = `${k}.${f}` } } }
  for (const k of ['table', 'oval', 'zone', 'deck', 'bar']) cmp(k, a[k], b[k])
  for (const arr of ['humanCards', 'panels', 'otherCards']) {
    const A = a[arr] || [], B = b[arr] || []
    for (let i = 0; i < Math.min(A.length, B.length); i++) cmp(`${arr}[${i}]`, A[i], B[i])
  }
  for (const f of ['l', 't', 'w', 'h', 'cw', 'ch']) { const d = Math.abs(a.scroll[f] - b.scroll[f]); if (d > max) { max = d; who = `scroll.${f}` } }
  return { max: round(max), who }
}

async function runZ1(browser) {
  const out = []
  const tblFilter = process.argv[3] ? Number(process.argv[3]) : null
  const vpFilter = process.argv[4] || null
  for (const n of Z1_TABLES) for (const vp of VIEWPORTS) {
    if (tblFilter && n !== tblFilter) continue
    if (vpFilter && `${vp.w}x${vp.h}` !== vpFilter) continue
    const page = await browser.newPage({ viewport: { width: vp.w, height: vp.h } })
    await gotoMesa(page, n); await installProbes(page); await z1Install(page)
    await page.waitForTimeout(300); await page.mouse.move(5, 5)
    const tok = await page.evaluate(() => window.__z1tokens())

    // showdown con cartas de cara (reintenta manos)
    let hasFace = false
    for (let att = 0; att < 6 && !hasFace; att++) {
      await clickIf(page, 'button:has-text("Iniciar mano")')
      for (let i = 0; i < 200; i++) {
        await page.waitForTimeout(240); await page.mouse.move(5, 5)
        if (await page.locator('button:has-text("Siguiente mano")').isVisible().catch(() => false)) break
        await clickIf(page, '.action-buttons button:has-text("Pasar")') ||
          await clickIf(page, '.action-buttons button:has-text("Igualar")') ||
          await clickIf(page, '.action-buttons button:has-text("Apostar")')
        await clickIf(page, 'button:has-text("Sin descartar")')
      }
      await page.mouse.move(5, 5); await page.waitForTimeout(500)
      hasFace = (await page.evaluate(() => window.__z1cards())).length > 0
      if (!hasFace) { await clickIf(page, 'button:has-text("Siguiente mano")'); await page.waitForTimeout(1200) }
    }

    const cards = await page.evaluate(() => window.__z1cards())
    const checks = []
    for (const c of cards) {
      await page.mouse.move(5, 5); await page.waitForTimeout(200)
      const rest = await page.evaluate(([s, i]) => window.__z1measure(s, i), [c.seat, c.idx])
      const anchorsRest = await page.evaluate(() => window.__z1anchors())
      if (!rest) continue
      // hover REAL sobre el centro de la carta
      await page.mouse.move(Math.round((rest.box.left + rest.box.right) / 2), Math.round((rest.box.top + rest.box.bottom) / 2))
      await page.waitForTimeout(260)   // 130ms de transición + margen
      const hov = await page.evaluate(([s, i]) => window.__z1measure(s, i), [c.seat, c.idx])
      const anchorsHov = await page.evaluate(() => window.__z1anchors())

      const scaleW = round(hov.box.w / rest.box.w), scaleH = round(hov.box.h / rest.box.h)
      const scaleOk = Math.abs(scaleW - tok.scale) <= 0.02 && Math.abs(scaleH - tok.scale) <= 0.02
      // borde anclado: por asiento (a 1920 mesa 2 ancla también la izquierda)
      const anch = [...(Z1_ANCHOR[c.seat] || ['top'])]
      if (c.seat === 'ai-zone' && vp.h > 800) anch.push('left')
      const anchorDrift = round(Math.max(...anch.map(e => Math.abs(hov.box[e] - rest.box[e]))))
      const anchorOk = anchorDrift <= 0.5
      const insidePerim = hov.box.left >= hov.perim.left - 0.5 && hov.box.right <= hov.perim.right + 0.5 &&
        hov.box.top >= hov.perim.top - 0.5 && hov.box.bottom <= hov.perim.bottom + 0.5
      const z = anchorsHov.zone
      const noHuman = !(hov.box.left < z.right && hov.box.right > z.left && hov.box.top < z.bottom && hov.box.bottom > z.top)
      // La propia carta ampliada SÍ se mueve (es el objeto de la tanda): se
      // excluye del censo de "todo lo demás" comparando su caja aparte.
      const hoveredIdx = await page.evaluate(([s, i]) => {
        const sl = window.__z1slot(s, i)
        return [...document.querySelectorAll('.opp-panel .opp-card-slot, .ai-zone .card-slot-wrapper')].indexOf(sl)
      }, [c.seat, c.idx])
      const strip = (a) => ({ ...a, otherCards: a.otherCards.filter((_, i) => i !== hoveredIdx) })
      const delta = z1Delta(strip(anchorsRest), strip(anchorsHov))
      const nameOk = hov.hitName !== false
      const zOk = Number(hov.zIndex) === tok.slotZ
      checks.push({
        seat: c.seat, idx: c.idx, rest: rest.box, hover: hov.box, scaleW, scaleH, scaleOk,
        anchors: anch, anchorDrift, anchorOk, insidePerim, noHuman, nameHit: hov.hitName, nameOk,
        zIndex: hov.zIndex, panelZ: hov.panelZ, zOk, delta,
        ok: scaleOk && anchorOk && insidePerim && noHuman && nameOk && zOk && delta.max <= 0.5,
      })
    }
    await page.mouse.move(5, 5); await page.waitForTimeout(200)

    // ── (5) coreografía con hover encima: debe completar sin congelarse
    let choreo = null
    const tappable = await page.locator('.opp-name-tappable').count()
    if (tappable > 0 && cards.length) {
      const c0 = cards[0]
      const b = (await page.evaluate(([s, i]) => window.__z1measure(s, i), [c0.seat, c0.idx]))?.box
      const tapped = await page.evaluate(() => {
        const el = [...document.querySelectorAll('.opp-name-tappable')].find(e => !e.closest('.opp-panel').className.includes('opp-winner'))
        if (!el) return false
        el.click(); return true
      })
      if (tapped && b) {
        // el cursor entra en la carta MIENTRAS corre la coreografía
        await page.mouse.move(Math.round((b.left + b.right) / 2), Math.round((b.top + b.bottom) / 2))
        await page.waitForTimeout(120)
        const mid = await page.evaluate(() => ({
          phase: [...document.querySelectorAll('.opp-panel')].map(p => [...p.classList].find(x => x.startsWith('opp-reveal')) || null).filter(Boolean),
          anyHoverScale: [...document.querySelectorAll('.opp-panel .opp-card-slot')].some(s => /matrix\(1\.8/.test(getComputedStyle(s).transform)),
        }))
        await page.waitForTimeout(1600); await page.mouse.move(5, 5); await page.waitForTimeout(300)
        const end = await page.evaluate(() => ({
          phases: [...document.querySelectorAll('.opp-panel')].map(p => [...p.classList].find(x => x.startsWith('opp-reveal')) || null).filter(Boolean),
          revealed: window.__z1cards().length,
        }))
        choreo = { tapped, midPhases: mid.phase, hoverSuppressed: !mid.anyHoverScale, endPhases: end.phases, completed: end.phases.length === 0 && end.revealed > 0 }
      }
    }
    await page.close()

    const passed = cards.length > 0 && checks.every(c => c.ok) && (!choreo || (choreo.completed && choreo.hoverSuppressed))
    out.push({ table: n, vp, tokens: tok, cards: cards.length, checks, choreo, passed })
    const bad = checks.filter(c => !c.ok)
    console.log(`T${n} ${vp.w}x${vp.h} · cartas=${cards.length} · escala=${[...new Set(checks.map(c => c.scaleW))].join('/')} (tok ${tok.scale}) · ancla Δmáx=${round(Math.max(0, ...checks.map(c => c.anchorDrift)))} · resto Δmáx=${round(Math.max(0, ...checks.map(c => c.delta.max)))} · nombre ok=${checks.every(c => c.nameOk)} · coreo=${choreo ? (choreo.completed ? 'completa' : 'ROTA') + '/' + (choreo.hoverSuppressed ? 'suprimido' : 'NO-SUPR') : 'n/a'} · ${passed ? 'OK' : 'FAIL' + (bad.length ? ' [' + bad.slice(0, 2).map(b => `${b.seat}#${b.idx}`).join(',') + ']' : '')}`)
  }
  return out
}

// ── DSK-O2 · Óvalo congelado en mesas 4, 3 y 2 ───────────────────────────────
// Cierra la doctrina O1 en las mesas restantes. Gate duro en las 15 celdas
// (4 viewports de campaña + CENTINELA 1440×850, la banda 801..900 donde el root
// va a 18 pero la carta sigue en 76: es donde una constante por tier se rompe
// sin que la matriz de 4 lo note — pasó en el ensayo del diagnóstico).
// El peor caso NO lo produce una mano: se CONSTRUYE (pozo al tope, "A igualar"
// visible, las 15 familias con su clase real, pastilla de rol en un lateral,
// pastilla de comodín inyectada en 3/2 —su guardián es numPlayers>=4, la mesa de
// ORIGEN, así que una 3/2 reducida sí la lleva— y aviso de eliminación con
// nombres de 12ch). Todas las expectativas se DERIVAN de tokens vivos.
const O2_TABLES = [4, 3, 2]
const O2_VIEWPORTS = [...VIEWPORTS, { w: 1440, h: 850 }]
const O2_NAME12 = 'Wenceslaoxyz'
// destino → nº de nombres que pueden caer a la vez para llegar a esa mesa
const O2_ELIM_N = { 4: 1, 3: 2, 2: 3 }
const o2Elim = (n) => `${Array.from({ length: O2_ELIM_N[n] }, () => O2_NAME12).join(', ')} se ${O2_ELIM_N[n] === 1 ? 'quedó' : 'quedaron'} sin fichas · la mesa ahora es de ${n}`

// Anclas: el óvalo y todo lo que podría moverse con él.
const O2_ANCHORS = {
  oval: '.center-zone', colL: '.side-col-left', colR: '.side-col-right',
  riv: '.rivals-zone', midc: '.mid-center', mid: '.table-mid',
  aiZone: '.ai-zone', zone: '.player-zone', bar: '.player-bar',
  cards: '.player-zone .cards-row', table: '.game-table',
  pTC: '.opp-top-center', pTL: '.opp-top-left', pTR: '.opp-top-right',
  pSL: '.opp-side-left', pSR: '.opp-side-right',
}

async function o2Install(page) {
  await page.evaluate((A) => {
    const rnd = x => x == null ? null : Math.round(x * 100) / 100
    window.__o2A = A
    window.__o2snap = () => {
      const o = {}
      for (const [k, s] of Object.entries(A)) {
        const e = document.querySelector(s)
        if (!e) { o[k] = null; continue }
        const b = e.getBoundingClientRect()
        o[k] = { x: rnd(b.x), y: rnd(b.y), w: rnd(b.width), h: rnd(b.height) }
      }
      const scr = document.querySelector('.game-table-screen')
      o.__scroll = scr ? { ovX: scr.scrollWidth - scr.clientWidth, ovY: scr.scrollHeight - scr.clientHeight } : null
      return o
    }
    // Escape del contenido: >0 = algún hijo en flujo se sale. Se mide contra la
    // caja de CONTENIDO (se come el padding) y contra el PERÍMETRO (cruza el filo).
    window.__o2escape = () => {
      const oval = document.querySelector('.center-zone')
      if (!oval) return null
      const cs = getComputedStyle(oval), ov = oval.getBoundingClientRect()
      const cl = ov.left + parseFloat(cs.borderLeftWidth) + parseFloat(cs.paddingLeft)
      const cr = ov.right - parseFloat(cs.borderRightWidth) - parseFloat(cs.paddingRight)
      const ct = ov.top + parseFloat(cs.borderTopWidth) + parseFloat(cs.paddingTop)
      const cb = ov.bottom - parseFloat(cs.borderBottomWidth) - parseFloat(cs.paddingBottom)
      let cont = -Infinity, bord = -Infinity, who = null
      for (const ch of oval.children) {
        const st = getComputedStyle(ch)
        if (st.display === 'none' || st.position === 'absolute') continue
        const b = ch.getBoundingClientRect()
        if (!b.width && !b.height) continue
        const c = Math.max(cl - b.left, b.right - cr, ct - b.top, b.bottom - cb)
        if (c > cont) { cont = c; who = String(ch.className).slice(0, 30) }
        bord = Math.max(bord, ov.left - b.left, b.right - ov.right, ov.top - b.top, b.bottom - ov.bottom)
      }
      return { cont: rnd(cont), bord: rnd(bord), who }
    }
    // Pone texto + clase reales en el mensaje. msgPop arranca en scale(0.8): se
    // apaga la animación o el primer frame devuelve rects un 20% cortos.
    window.__o2msg = (txt, cls) => {
      const m = document.querySelector('.center-zone .game-message')
      if (!m) return false
      if (window.__o2prev == null) window.__o2prev = { t: m.textContent, c: m.className, a: m.style.animation }
      m.textContent = txt
      m.className = 'game-message' + (cls ? ' ' + cls : '')
      m.style.animation = 'none'
      return true
    }
    window.__o2msgRestore = () => {
      const m = document.querySelector('.center-zone .game-message')
      if (m && window.__o2prev) { m.textContent = window.__o2prev.t; m.className = window.__o2prev.c; m.style.animation = window.__o2prev.a }
      window.__o2prev = null
    }
    window.__o2pot = (v) => {
      const el = document.querySelector('.pot-value')
      const t = el && [...el.childNodes].reverse().find(x => x.nodeType === 3)
      if (t) { window.__o2potPrev = window.__o2potPrev ?? t.nodeValue; t.nodeValue = String(v) }
      const c = document.querySelector('.call-box')
      if (c) { window.__o2callPrev = window.__o2callPrev ?? (c.style.visibility || ''); c.style.visibility = 'visible' }
      const cv = document.querySelector('.call-value')
      if (cv) { window.__o2cvPrev = window.__o2cvPrev ?? cv.textContent; cv.textContent = String(v) }
      return !!t
    }
    // Inyecciones con marca [data-o2] para poder retirarlas todas de una vez.
    window.__o2inject = (what, arg) => {
      if (what === 'badge') {
        const p = document.querySelector(arg)
        const a = p && p.querySelector('.opp-header-anchor')
        if (!a) return 0
        const s = document.createElement('span')
        s.className = 'seat-badge seat-badge-neutral seat-badge-letter'
        s.dataset.o2 = '1'; s.textContent = 'P'
        a.insertBefore(s, a.firstChild)
        return 1
      }
      if (what === 'comodin') {
        const z = document.querySelector('.center-zone')
        if (!z || z.querySelector('.comodin-note')) return 0
        const s = document.createElement('span')
        s.className = 'comodin-note'; s.dataset.o2 = '1'; s.textContent = arg
        z.appendChild(s)
        return 1
      }
      if (what === 'elim') {
        const z = document.querySelector('.center-zone')
        if (!z) return 0
        window.__o2elimHidden = [...z.children].map(c => [c, c.style.display])
        window.__o2elimHidden.forEach(([c]) => { c.style.display = 'none' })
        const d = document.createElement('div')
        d.className = 'elim-notice-inline'; d.dataset.o2 = '1'; d.textContent = arg
        z.appendChild(d)
        return 1
      }
      if (what === 'potfloat') {
        const pb = document.querySelector('.pot-box')
        if (!pb) return 0
        const s = document.createElement('span')
        s.className = 'pot-float'; s.dataset.o2 = '1'; s.textContent = '+25000'
        s.style.animation = 'none'
        pb.appendChild(s)
        return 1
      }
      return 0
    }
    window.__o2clean = () => {
      document.querySelectorAll('[data-o2]').forEach(e => e.remove())
      if (window.__o2elimHidden) { window.__o2elimHidden.forEach(([c, d]) => { c.style.display = d }); window.__o2elimHidden = null }
    }
    // El "+N" del pozo es absoluto (vuela por encima del pozo): con la guardia
    // de contención puesta, no puede quedar recortado por el óvalo.
    window.__o2float = () => {
      const f = document.querySelector('.pot-float[data-o2]')
      const oval = document.querySelector('.center-zone')
      if (!f || !oval) return null
      const b = f.getBoundingClientRect(), ov = oval.getBoundingClientRect()
      return { esc: rnd(Math.max(ov.left - b.left, b.right - ov.right, ov.top - b.top, b.bottom - ov.bottom)), h: rnd(b.height) }
    }
    // Tokens y cajas vivas de las que se DERIVAN las expectativas.
    window.__o2tokens = () => {
      const root = getComputedStyle(document.documentElement)
      const scr = getComputedStyle(document.querySelector('.game-table-screen'))
      const mid = document.querySelector('.table-mid')
      const ai = document.querySelector('.ai-zone')
      const riv = document.querySelector('.rivals-zone')
      const panel = document.querySelector('.opp-panel')
      const px = v => { const n = parseFloat(v); return Number.isFinite(n) ? rnd(n) : null }
      return {
        cardW: px(root.getPropertyValue('--card-w')), cardH: px(root.getPropertyValue('--card-h')),
        rootFont: px(root.fontSize),
        aiH: px(scr.getPropertyValue('--o2-ai-h')),
        gridCols: mid ? getComputedStyle(mid).gridTemplateColumns : null,
        aiBox: ai ? (() => { const c = getComputedStyle(ai); return { padT: px(c.paddingTop), padB: px(c.paddingBottom), bT: px(c.borderTopWidth), bB: px(c.borderBottomWidth), boxSizing: c.boxSizing, h: rnd(ai.getBoundingClientRect().height) } })() : null,
        rivBox: riv ? (() => { const c = getComputedStyle(riv); return { padT: px(c.paddingTop), h: rnd(riv.getBoundingClientRect().height), boxSizing: c.boxSizing } })() : null,
        panelH: panel ? rnd(panel.getBoundingClientRect().height) : null,
        ovalOverflow: (() => { const z = document.querySelector('.center-zone'); return z ? getComputedStyle(z).overflow : null })(),
        msgMinW: (() => { const m = document.querySelector('.center-zone .game-message'); return m ? getComputedStyle(m).minWidth : null })(),
      }
    }
    // Apilamiento: ningún ancestro del óvalo puede crear contexto (si lo creara,
    // la carta ampliada de Z1 dejaría de sobrevolarlo).
    window.__o2stack = () => {
      const out = []
      let el = document.querySelector('.center-zone')
      while (el && el !== document.documentElement) {
        const cs = getComputedStyle(el)
        const creates = (cs.position !== 'static' && cs.zIndex !== 'auto') ||
          cs.transform !== 'none' || parseFloat(cs.opacity) < 1 || cs.filter !== 'none' ||
          cs.isolation === 'isolate' || cs.contain.includes('paint') || cs.contain.includes('layout') ||
          cs.perspective !== 'none' || cs.mixBlendMode !== 'normal' || cs.willChange.includes('transform')
        out.push({ cls: String(el.className).slice(0, 34) || el.tagName.toLowerCase(), creates, position: cs.position, zIndex: cs.zIndex })
        el = el.parentElement
      }
      return out
    }
  }, O2_ANCHORS)
}

// Familias reales con su CLASE real (messageActionKind + winner de GameTable.jsx).
const o2Kind = (m) => /se retira|Te retiras/.test(m) ? 'msg-action msg-action-fold'
  : /apuesta|Apuestas|sube|Subes/.test(m) ? 'msg-action msg-action-bet'
  : /pasa|Pasas|iguala|Igualas/.test(m) ? 'msg-action'
  : null

async function runO2(browser) {
  const out = []
  const tblFilter = process.argv[3] ? Number(process.argv[3]) : null
  const vpFilter = process.argv[4] || null
  for (const n of O2_TABLES) for (const vp of O2_VIEWPORTS) {
    if (tblFilter && n !== tblFilter) continue
    if (vpFilter && `${vp.w}x${vp.h}` !== vpFilter) continue
    const page = await browser.newPage({ viewport: { width: vp.w, height: vp.h } })
    await gotoMesa(page, n); await o2Install(page)
    await page.waitForTimeout(300); await page.mouse.move(5, 5)

    const tok = await page.evaluate(() => window.__o2tokens())
    const base = await page.evaluate(() => window.__o2snap())
    const stack = await page.evaluate(() => window.__o2stack())

    // ── estados del peor caso construido ──────────────────────────────────────
    const states = []
    const esc = []
    const add = async (tag) => {
      states.push({ tag, s: await page.evaluate(() => window.__o2snap()) })
      const e = await page.evaluate(() => window.__o2escape())
      if (e) esc.push({ tag, ...e })
    }
    await add('reposo')
    // pozo al tope (5 × saldoInicial) + "A igualar" visible
    await page.evaluate(() => window.__o2pot(25000))
    await add('pozo25000+igualar')
    // 15 familias con su clase real
    for (const m of O1_MSGS) {
      const txt = o1Text(m, n)
      await page.evaluate(([t, c]) => window.__o2msg(t, c), [txt, m.fam.startsWith('resultado') || m.fam === 'retiros' ? 'msg-win' : o2Kind(txt)])
      await add(`msg:${m.fam}`)
    }
    await page.evaluate(() => window.__o2msgRestore())
    // pastilla de comodín: mesa 4 ya la monta; 3 y 2 la llevan si vienen de 4/5
    if (n !== 4) {
      await page.evaluate(t => window.__o2inject('comodin', t), 'Sin comodín')
      await add('comodin:inyectada')
    }
    await page.evaluate(t => window.__o2inject('comodin', t), 'Comodín activo · vale 11')
    await add('comodin:vale11')
    // pastilla de rol en UN lateral (nunca Mano y Pie en la misma cabecera)
    let badgeSeats = 0
    for (const sel of ['.opp-side-left', '.opp-side-right', '.opp-top-left', '.opp-top-right', '.opp-top-center']) {
      const k = await page.evaluate(s => window.__o2inject('badge', s), sel)
      if (!k) continue
      badgeSeats += k
      await add(`pastilla:${sel.slice(5)}`)
      await page.evaluate(() => document.querySelectorAll('[data-o2].seat-badge').forEach(e => e.remove()))
    }
    // aviso de eliminación con nombres de 12ch
    await page.evaluate(t => window.__o2inject('elim', t), o2Elim(n))
    await add(`elim:${o2Elim(n).length}ch`)
    await page.evaluate(() => { document.querySelectorAll('.elim-notice-inline[data-o2]').forEach(e => e.remove()); if (window.__o2elimHidden) { window.__o2elimHidden.forEach(([c, d]) => { c.style.display = d }); window.__o2elimHidden = null } })
    // "+N" del pozo: la guardia de contención no puede recortarlo
    await page.evaluate(() => window.__o2inject('potfloat'))
    const flt = await page.evaluate(() => window.__o2float())
    await page.evaluate(() => window.__o2clean())

    // ── expectativas DERIVADAS de tokens vivos ────────────────────────────────
    // Columna congelada: la fórmula de la tanda, con --card-w leído en vivo.
    const sideExp = n === 4
      ? round(tok.cardW * 0.55 + 14 + Math.max(187.22, tok.cardW * 0.55 * 3.6 + 30))
      : n === 3 ? round(tok.cardW * 0.55 + 14) : null
    const cols = (tok.gridCols || '').split(' ').map(parseFloat)
    const colOk = sideExp == null ? null : (Math.abs(cols[0] - sideExp) < 0.02 && Math.abs(cols[2] - sideExp) < 0.02)
    // rivals-zone: derivada del panel vivo + su padding-top (no cableada).
    const rivExp = tok.rivBox ? round(tok.panelH + tok.rivBox.padT) : null
    const rivOk = rivExp == null ? null : Math.abs(tok.rivBox.h - rivExp) < 0.02
    // .ai-zone: token + padding + borde vivos (content-box).
    const aiExp = tok.aiBox ? round(tok.aiH + tok.aiBox.padT + tok.aiBox.padB + tok.aiBox.bT + tok.aiBox.bB) : null
    const aiOk = aiExp == null ? null : Math.abs(tok.aiBox.h - aiExp) < 0.02

    // Δ del óvalo y de los vecinos entre TODOS los estados construidos
    const frames = states.map(s => s.s)
    const rangeOf = (k) => {
      const v = frames.map(f => f[k]).filter(Boolean)
      if (!v.length) return null
      const d = a => round(Math.max(...v.map(x => x[a])) - Math.min(...v.map(x => x[a])))
      return { x: d('x'), y: d('y'), w: d('w'), h: d('h'), max: round(Math.max(d('x'), d('y'), d('w'), d('h'))) }
    }
    const ovalRange = rangeOf('oval')
    const neighbors = {}
    for (const k of Object.keys(O2_ANCHORS)) { if (k === 'oval') continue; const r = rangeOf(k); if (r) neighbors[k] = r }
    const neighMax = round(Math.max(0, ...Object.values(neighbors).map(r => r.max)))
    const worstNeigh = Object.entries(neighbors).reduce((a, [k, r]) => (r.max > (a?.[1]?.max ?? -1) ? [k, r] : a), null)
    const scrollOk = frames.every(f => (f.__scroll?.ovX ?? 0) === 0 && (f.__scroll?.ovY ?? 0) === 0)
    const escMax = round(Math.max(...esc.map(e => e.cont)))
    const escWorst = esc.reduce((a, e) => (e.cont > a.cont ? e : a), esc[0])
    const stackOk = stack.every(s => !s.creates)
    const guardOk = n === 4 ? true : (tok.ovalOverflow === 'hidden' && tok.msgMinW === '0px')

    const checks = {
      ovalFrozen: ovalRange.max < 0.02,
      colOk, rivOk, aiOk,
      neighborsFrozen: neighMax < 0.02,
      scrollOk,
      escapeOk: escMax <= 0,
      // El "+N" del pozo sólo PUNTÚA donde O2 estrena el clip (mesas 3 y 2). En
      // mesa 4 el overflow:hidden del óvalo es PREEXISTENTE (bloque :948, mesas
      // 4 y 5) y en el tier de óvalo más bajo (1280×720, 164px) el volador ya
      // asomaba 7,75px por arriba: medido idéntico contra HEAD y contra la mesa 5
      // sellada por O1, y O2 no lo mueve ni un pelo (el congelado es horizontal;
      // el alto del óvalo no cambia). Se sigue imprimiendo — un rojo permanente
      // "por diseño" entrena a ignorar rojos, y enterrarlo sería peor.
      floatOk: n === 4 ? null : (!flt || flt.esc <= 0),
      guardOk,
      stackOk,
    }
    const passed = Object.values(checks).every(v => v === true || v === null)
    out.push({
      table: n, vp, tokens: tok, sideExp, rivExp, aiExp, badgeSeats,
      states: states.length, ovalBase: base.oval, ovalRange, neighMax,
      worstNeighbor: worstNeigh && { k: worstNeigh[0], ...worstNeigh[1] },
      escape: { max: escMax, worst: escWorst }, potFloat: flt,
      stack, checks, passed,
    })
    console.log(`T${n} ${vp.w}x${vp.h} · óvalo ${base.oval?.w}x${base.oval?.h}@${base.oval?.x} Δ=${ovalRange.max} · col ${sideExp == null ? 'n/a (sin .table-mid)' : `${cols[0]}/${sideExp} ${colOk ? 'ok' : 'FAIL'}`} · riv ${tok.rivBox?.h ?? '-'}/${rivExp ?? '-'} · ai ${tok.aiBox?.h ?? '-'}/${aiExp ?? '-'} · vecinos Δ=${neighMax}${worstNeigh && worstNeigh[1].max > 0.02 ? ` [${worstNeigh[0]}]` : ''} · escape=${escMax} (${escWorst?.who ?? '-'}) · float=${flt ? flt.esc + (n === 4 && flt.esc > 0 ? ' (preexistente, = mesa 5)' : '') : 'n/a'} · guardia=${guardOk} · stack=${stackOk} · ${states.length} estados · ${passed ? 'OK' : 'FAIL [' + Object.entries(checks).filter(([, v]) => v === false).map(([k]) => k).join(',') + ']'}`)
    await page.close()
  }
  return out
}

// ── A2 · Abanico del humano centrado + mazo recolocado + banda bajo las cartas ─
// 20 celdas (4 mesas × 4 viewports + centinela 1440×850), una mano completa cada
// una, con los 12 checks del diagnóstico A2b §5. Todas las expectativas se
// DERIVAN de tokens vivos (leídos por su valor usado: los de A2 son calc()).
const A2_TABLES = [5, 4, 3, 2]
const A2_VIEWPORTS = [...VIEWPORTS, { w: 1440, h: 850 }]
const A2_WORST_TAG = A1_WORST_TAG          // misma línea, mismo marcado real

// Muestreador de vuelos por rAF: duran 595/750ms y el polling de 230ms los pierde.
async function a2InstallFlights(page) {
  await page.evaluate(() => {
    window.__paint = (el) => {
      if (!el) return null
      const rnd = x => Math.round(x * 100) / 100
      const kids = [...el.querySelectorAll('*')].filter(e => e.getBoundingClientRect().height > 0)
      if (kids.length) {
        const b = kids.map(k => k.getBoundingClientRect())
        return { top: rnd(Math.min(...b.map(x => x.top))), left: rnd(Math.min(...b.map(x => x.left))), right: rnd(Math.max(...b.map(x => x.right))), src: 'kids' }
      }
      const rg = document.createRange(); rg.selectNodeContents(el)
      const b = rg.getBoundingClientRect()
      return b.height ? { top: rnd(b.top), left: rnd(b.left), right: rnd(b.right), src: 'text' } : null
    }
    window.__flights = { samples: 0, inZone: 0, maxBottomInZone: -1e9 }
    const tick = () => {
      const fs = document.querySelectorAll('.flying-card')
      const zone = document.querySelector('.player-zone')
      if (fs.length && zone) {
        const z = zone.getBoundingClientRect(); window.__flights.samples++
        for (const f of fs) {
          const b = f.getBoundingClientRect()
          if (b.bottom > z.top && b.top < z.bottom && b.right > z.left && b.left < z.right) {
            window.__flights.inZone++
            window.__flights.maxBottomInZone = Math.max(window.__flights.maxBottomInZone, b.bottom)
          }
        }
      }
      requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  })
}

async function a2Snap(page) {
  return page.evaluate(() => {
    const rnd = x => x == null ? null : Math.round(x * 100) / 100
    const R = e => { if (!e) return null; const b = e.getBoundingClientRect(); return { x: rnd(b.x), y: rnd(b.y), w: rnd(b.width), h: rnd(b.height), top: rnd(b.top), right: rnd(b.right), bottom: rnd(b.bottom), left: rnd(b.left) } }
    const Q = s => document.querySelector(s)
    const zone = Q('.player-zone'), row = Q('.player-zone .cards-row')
    const pile = Q('.player-zone .deck-pile'), tag = Q('.player-zone .score-tag-player')
    const slots = [...document.querySelectorAll('.player-zone .cards-row .card-slot-wrapper')]
    const area = Q('.player-bar-center .action-area')
    const scr = Q('.game-table-screen')
    const rb = row.getBoundingClientRect()
    const c1 = slots[0]?.getBoundingClientRect(), cN = slots[slots.length - 1]?.getBoundingClientRect()
    const tb = tag?.getBoundingClientRect()
    const btns = area ? [...area.querySelectorAll('.btn')] : []
    const olap = (b, r) => (!b || b.right <= r.left || b.left >= r.right || b.bottom <= r.top || b.top >= r.bottom)
      ? null : { x: rnd(Math.min(b.right, r.right) - Math.max(b.left, r.left)), y: rnd(Math.min(b.bottom, r.bottom) - Math.max(b.top, r.top)) }
    return {
      kind: area ? (area.className.replace('action-area', '').trim() || 'action') : 'none',
      btn: btns.map(b => b.textContent.trim().slice(0, 16)).join('|'),
      // (1) simetría del grupo de 5 contra los filos útiles (= border-box de la fila)
      simIzq: c1 ? rnd(c1.left - rb.left) : null,
      simDer: cN ? rnd(rb.right - cN.right) : null,
      // (2)/(3)/(4)/(5)
      card1: R(slots[0]), slotW: c1 ? rnd(c1.width) : null,
      respiro: (c1 && pile) ? rnd(c1.left - pile.getBoundingClientRect().right) : null,
      pilaFilo: pile ? rnd(pile.getBoundingClientRect().left - rb.left) : null,
      isPie: pile ? !pile.classList.contains('deck-hidden') : null,
      cardsBottom: slots.length ? rnd(Math.max(...slots.map(s => s.getBoundingClientRect().bottom))) : null,
      // fondo de la reserva del mazo: es de donde cuelga el `top` de la banda, y
      // se mide APARTE para que la expectativa del sitio no se derive de la propia
      // banda (un check que se compara consigo mismo pasa siempre).
      wrapBottom: (() => { const w = document.querySelector('.player-zone .deck-shuffle-wrapper'); return w ? rnd(w.getBoundingClientRect().bottom) : null })(),
      // (6) banda
      tagVis: tag ? getComputedStyle(tag).visibility : null,
      tagBox: R(tag), tagClipped: tag ? tag.scrollWidth > tag.clientWidth + 0.5 : null,
      tagText: tag ? tag.textContent.trim() : null,
      tagCx: (tb && c1 && cN) ? rnd((tb.left + tb.right) / 2 - (c1.left + cN.right) / 2) : null,
      paint: window.__paint(area),
      olapPaint: (() => { const p = window.__paint(area); return (p && tb) ? olap(tb, { left: p.left, right: p.right, top: p.top, bottom: p.top + 1e4 }) : null })(),
      olapBtns: btns.map(b => ({ t: b.textContent.trim().slice(0, 14), o: olap(tb, b.getBoundingClientRect()) })).filter(x => x.o),
      // (8)
      ovX: scr.scrollWidth - scr.clientWidth, ovY: scr.scrollHeight - scr.clientHeight,
      // (12) gemelo IA de mesa 2
      ai: (() => {
        const az = Q('.ai-zone'); if (!az) return null
        const asl = [...az.querySelectorAll('.card-slot-wrapper')]
        return { zone: R(az), row: R(az.querySelector('.cards-row')), wrap: R(az.querySelector('.deck-shuffle-wrapper')),
          pile: R(az.querySelector('.deck-pile')), s0: R(asl[0]), sN: R(asl[asl.length - 1]) }
      })(),
    }
  })
}

// (7) fuera de flujo estricto: con la banda VISIBLE y su peor contenido montado,
// nada de alrededor se mueve ni el scroller crece.
async function a2OutOfFlow(page, html) {
  return page.evaluate((h) => {
    const rnd = x => Math.round(x * 100) / 100
    const R = s => { const e = document.querySelector(s); if (!e) return null; const b = e.getBoundingClientRect(); return [rnd(b.x), rnd(b.y), rnd(b.width), rnd(b.height)] }
    const A = ['.player-zone', '.player-zone .cards-row', '.player-zone .deck-shuffle-wrapper',
      '.player-zone .deck-pile', '.player-bar', '.player-bar-left', '.player-bar-center',
      '.player-bar-right', '.player-bar-center .action-area', '.center-zone', '.game-table']
    const S = () => [...document.querySelectorAll('.player-zone .cards-row .card-slot-wrapper')].map(e => { const b = e.getBoundingClientRect(); return [rnd(b.x), rnd(b.y), rnd(b.width), rnd(b.height)] })
    const scr = document.querySelector('.game-table-screen')
    const grab = () => ({ a: A.map(R), s: S(), sh: scr.scrollHeight, ch: scr.clientHeight })
    const t = document.querySelector('.player-zone .score-tag-player')
    const prevHTML = t.innerHTML, prevVis = t.style.visibility
    const before = grab()
    t.innerHTML = h; t.style.visibility = 'visible'
    const after = grab()
    const b = t.getBoundingClientRect()
    const res = {
      dAnchors: rnd(Math.max(0, ...A.map((_, i) => {
        const x = before.a[i], y = after.a[i]; if (!x || !y) return 0
        return Math.max(...x.map((v, j) => Math.abs(v - y[j])))
      }))),
      dSlots: rnd(Math.max(0, ...before.s.map((x, i) => after.s[i] ? Math.max(...x.map((v, j) => Math.abs(v - after.s[i][j]))) : 0))),
      dScrollH: after.sh - before.sh, dClientH: after.ch - before.ch,
      worstW: rnd(b.width), worstContentW: t.scrollWidth, worstClipped: t.scrollWidth > t.clientWidth + 0.5,
    }
    t.innerHTML = prevHTML; t.style.visibility = prevVis
    return res
  }, html)
}

async function runA2(browser) {
  const out = []
  const tblFilter = process.argv[3] ? Number(process.argv[3]) : null
  const vpFilter = process.argv[4] || null
  for (const n of A2_TABLES) for (const vp of A2_VIEWPORTS) {
    if (tblFilter && n !== tblFilter) continue
    if (vpFilter && `${vp.w}x${vp.h}` !== vpFilter) continue
    const key = `${vp.w}x${vp.h}`
    const page = await browser.newPage({ viewport: { width: vp.w, height: vp.h } })
    await gotoMesa(page, n); await installProbes(page); await a2InstallFlights(page)
    await page.waitForTimeout(300); await page.mouse.move(5, 5)
    const live = await a2Live(page)
    const preW = F1_A2[key]?.[n] ?? null

    // Manos completas: cubren reposo, barajado, reparto, apuesta (con la fila de
    // multiplicadores, que es el techo del carril), descarte con selección, y pago
    // —el único estado donde la banda está viva—. El ciclo NO se corta en la 1ª:
    // el respiro pila→carta 1 se exige CON y SIN Pie, y el Pie rota +1 por mano
    // (en mesa 5 el humano puede no serlo hasta la 3ª). Se para en cuanto la
    // cobertura está completa, para no pagar 3 manos donde bastan 2.
    const states = [{ tag: 'reposo', ...(await a2Snap(page)) }]
    const covered = () => states.some(s => s.isPie) && states.some(s => s.isPie === false) &&
      states.some(s => s.tagVis === 'visible')
    for (let hand = 0; hand < 3 && !covered(); hand++) {
      await clickIf(page, 'button:has-text("Iniciar mano")')
      let closed = false
      for (let i = 0; i < 240; i++) {
        await page.waitForTimeout(230); await page.mouse.move(5, 5)
        states.push({ tag: `h${hand}t${i}`, ...(await a2Snap(page)) })
        if (await page.locator('button:has-text("Siguiente mano")').isVisible().catch(() => false)) {
          states.push({ tag: `h${hand}-pago`, ...(await a2Snap(page)) }); closed = true; break
        }
        await clickIf(page, '.action-buttons button:has-text("Pasar")') ||
          await clickIf(page, '.action-buttons button:has-text("Igualar")') ||
          await clickIf(page, '.action-buttons button:has-text("Apostar")')
        if (states[states.length - 1].kind.includes('discard')) {
          await page.evaluate(() => { const c = document.querySelector('.player-zone .playing-card.card-clickable'); if (c) c.click() })
          await page.waitForTimeout(250)
          states.push({ tag: `h${hand}-sel`, ...(await a2Snap(page)) })
          await clickIf(page, 'button:has-text("Sin descartar")') || await clickIf(page, '.discard-area .btn')
        }
      }
      if (!closed || covered()) break
      if (!await clickIf(page, 'button:has-text("Siguiente mano")')) break
      await page.waitForTimeout(1500); await page.mouse.move(5, 5)
      states.push({ tag: `h${hand}-post`, ...(await a2Snap(page)) })
    }
    const flights = await page.evaluate(() => window.__flights)
    const oof = await a2OutOfFlow(page, A2_WORST_TAG)

    const F = states.filter(s => s.card1)
    const pago = F.filter(s => s.btn === 'Siguiente mano')
    const apuesta = F.filter(s => s.kind.includes('action-col'))
    const worstOf = (get) => {
      let max = 0, who = null
      for (const s of F) { const v = get(s); if (v == null) continue; if (Math.abs(v) > max) { max = Math.abs(v); who = s.tag } }
      return { max: round(max), tag: who }
    }
    const base = F[0]
    // (1) simetría
    const dSim = worstOf(s => (s.simIzq != null && s.simDer != null) ? s.simIzq - s.simDer : null)
    // (2) origen constante
    const dOrigX = worstOf(s => s.card1.x - base.card1.x)
    const dOrigY = worstOf(s => s.card1.y - base.card1.y)
    // (3) piso: doble puerta
    const dSizeW = worstOf(s => s.slotW - base.slotW)
    // (4) respiro, con y sin PIE
    const dResp = worstOf(s => s.respiro != null ? s.respiro - live.gapLeft : null)
    const sawPie = F.some(s => s.isPie), sawNoPie = F.some(s => s.isPie === false)
    // (5) aterrizaje
    const pilaMin = round(Math.min(...F.filter(s => s.pilaFilo != null).map(s => s.pilaFilo)))
    // (6) banda en su casa nueva (medida sobre los frames de PAGO, donde vive)
    const bandFrames = F.filter(s => s.tagVis === 'visible')
    const bandDyExp = round(live.airY + live.liveRowPadBottom + live.liveBarMarginTop)
    const bandDy = bandFrames.length ? round(bandFrames[0].tagBox.top - bandFrames[0].cardsBottom) : null
    // Sobrante de la reserva del mazo por debajo de las cartas más allá del propio
    // --dsk-hand-air-y. Medido en el WRAPPER, no en la banda: 0 en las 16 celdas
    // donde manda el techo de F1 y 5,33 / 20,84 en las 4 donde manda la pista
    // (mesas 3/2 a 1440 y 1920), donde las cartas acaban más arriba y la línea se
    // apoya en el filo de la barra. El eje vertical no admite --dsk-hand-w (lleva
    // un 100% y en `top` los porcentajes resuelven contra el ALTO), así que el
    // ancla del CSS es la reserva y la expectativa se deriva de ella.
    const reserveVsCards = bandFrames.length
      ? round(bandFrames[0].wrapBottom - bandFrames[0].cardsBottom - live.airY) : null
    const bandClearPaint = bandFrames.length ? round(Math.min(...bandFrames.filter(s => s.paint).map(s => s.paint.top - s.tagBox.bottom))) : null
    const bandNoClip = bandFrames.every(s => !s.tagClipped)
    const bandCentered = bandFrames.every(s => Math.abs(s.tagCx) <= 0.5)
    const bandNoBtn = bandFrames.every(s => s.olapBtns.length === 0)
    const bandNoPaint = bandFrames.every(s => !s.olapPaint)
    // (9) ciclo de visibility: viva SÓLO en pago
    const visOnlyPayout = bandFrames.length > 0 && bandFrames.every(s => s.btn === 'Siguiente mano') &&
      F.some(s => s.tagVis === 'hidden')
    // (10) guardia de la fase de apuesta: nunca visible sobre la fila de mults
    const betGuardOk = apuesta.length > 0 && apuesta.every(s => s.tagVis === 'hidden')
    // (11) vuelos por debajo de la banda
    const flightOk = !flights.inZone || bandDy == null ||
      flights.maxBottomInZone <= (bandFrames[0].tagBox.top + 0.5)
    // (12) gemelo IA de mesa 2 intacto. NO se mide comparando frames entre sí: el
    // showdown escala las cartas ganadoras de la IA y, al ser su fila centrada,
    // recoloca a sus vecinos —incluido su mazo— con un efecto que es PREVIO a esta
    // tanda (documentado en m1Snap). Lo que A2 tiene que demostrar es que no lo
    // TOCA, así que se contrasta el frame en reposo contra la baseline de HEAD
    // (M1_PRE.ai) y contra su propia simetría de bloque, que es el criterio que el
    // rival ya implementaba: abanico y mazo centrados como un todo.
    const aiBase = F[0].ai, aiPre = M1_PRE[key]?.ai
    const aiSim = aiBase ? {
      izq: round(aiBase.s0.left - aiBase.row.left),
      der: round(aiBase.row.right - aiBase.wrap.right),
      dPileX: round(aiBase.pile.x - (aiPre?.x ?? aiBase.pile.x)),
      dPileY: round(aiBase.pile.y - (aiPre?.y ?? aiBase.pile.y)),
    } : null
    const dAi = aiSim ? { max: round(Math.max(Math.abs(aiSim.izq - aiSim.der), Math.abs(aiSim.dPileX), Math.abs(aiSim.dPileY))), tag: 'reposo' } : { max: 0, tag: null }

    const checks = {
      simetria: dSim.max <= 0.5,
      origenConst: dOrigX.max < 0.5 && dOrigY.max < 0.5,
      pisoF1: dSizeW.max < 0.5 && (preW == null || Math.abs(base.slotW - preW) <= 0.01),
      respiro: dResp.max <= 0.5 && sawPie && sawNoPie,
      aterrizaje: pilaMin >= 0,
      bandaSitio: null,          // se calcula justo debajo (necesita el sobrante de la reserva)
      bandaEncaje: bandNoClip && bandCentered,
      bandaLibre: bandNoBtn && bandNoPaint && (bandClearPaint == null || bandClearPaint >= 0),
      fueraDeFlujo: oof.dAnchors === 0 && oof.dSlots === 0 && oof.dScrollH === 0 && oof.dClientH === 0 && !oof.worstClipped,
      overflow: F.every(s => s.ovX === 0 && s.ovY === 0),
      cicloVisibility: visOnlyPayout,
      guardiaApuesta: betGuardOk,
      vuelos: flightOk,
      gemeloIA: n !== 2 ? null : dAi.max <= 0.5,
      primitivas: Math.abs(live.tokRowPadBottom - live.liveRowPadBottom) <= 0.01 &&
        Math.abs(live.tokBarMarginTop - live.liveBarMarginTop) <= 0.01 && live.wrapPosition === 'relative',
    }
    checks.bandaSitio = bandFrames.length > 0 && Math.abs(bandDy - (bandDyExp + reserveVsCards)) <= 0.05

    const passed = Object.values(checks).every(v => v === true || v === null)
    out.push({
      table: n, vp, live, preW, frames: F.length,
      simetria: { izq: base.simIzq, der: base.simDer, dSim },
      origen: { x: base.card1.x, y: base.card1.y, dOrigX, dOrigY },
      piso: { w: base.slotW, preW, dSizeW },
      mazo: { respiro: base.respiro, dResp, pilaMin, sawPie, sawNoPie },
      banda: { frames: bandFrames.length, dy: bandDy, dyExp: bandDyExp, reserveVsCards, clearPaint: bandClearPaint,
        w: bandFrames[0]?.tagBox?.w ?? null, cx: bandFrames[0]?.tagCx ?? null, bandNoClip, bandCentered, bandNoBtn, bandNoPaint },
      fueraDeFlujo: oof, vuelos: { ...flights, bandTop: bandFrames[0]?.tagBox?.top ?? null },
      gemeloIA: { ...dAi, ...aiSim, pre: aiPre }, checks, passed,
    })
    console.log(`T${n} ${vp.w}x${vp.h} · sim ${base.simIzq}/${base.simDer} Δ=${dSim.max} · carta ${base.slotW}/${preW} · respiro ${base.respiro}/${live.gapLeft} pila@${pilaMin} · banda ${bandFrames.length}f dy=${bandDy} (exp ${bandDyExp}${reserveVsCards ? ` +${reserveVsCards} de reserva` : ''}) w=${bandFrames[0]?.tagBox?.w}/${live.bandW} aire↓=${bandClearPaint} · flujo Δ=${oof.dAnchors}/${oof.dSlots}/${oof.dScrollH} · vuelo ${round(flights.maxBottomInZone)}≤${bandFrames[0]?.tagBox?.top} · IA Δ=${dAi.max} · ${passed ? 'OK' : 'FAIL [' + Object.entries(checks).filter(([, v]) => v === false).map(([k]) => k).join(',') + ']'}`)
    await page.close()
  }
  return out
}

// ── DSK-U1 · Menú de utilidades (escritorio) ─────────────────────────────────
// Documento rector: docs/AJILEI_Menu_Utilidades_v1.1.md (+ enmienda y apéndice).
// 20 celdas = las 16 de campaña + el centinela 1440×850.
const U1_TABLES = [5, 4, 3, 2]
const U1_VIEWPORTS = [...VIEWPORTS, { w: 1440, h: 850 }]

// 11 anclas del Δ=0 (las 10 del ensayo E3 del diagnóstico + .action-area).
const U1_ANCHORS = [
  '.game-table', '.table-header', '.header-right', '.utilities-trigger', '.btn-leave',
  '.table-title', '.table-mid', '.center-zone', '.player-zone', '.cards-row', '.action-area',
]

// Guardia de contenido: lo que el panel NO puede tocar en NINGÚN estado.
const U1_GUARD = ['.action-buttons .btn', '.btn-mult', '.timer-display', '.score-tag-player']

// BASELINE PRE-TANDA · caja viva del botón de sonido a HEAD 7ef28c9, medida en
// las 20 celdas (ensayo E1/E2 del diagnóstico). Colapsa a dos perfiles por
// viewport: área ancha (mesas 5/4) y estrecha (3/2); dentro de cada uno, las dos
// mesas son idénticas al centésimo. Se guarda el filo DERECHO de .header-right
// (el ancla real: la ✕ está pegada a él y no se movió nunca) y de ahí se derivan
// las x — así el baseline es una cifra por celda y no una tabla de rects.
const U1_TRIGGER = { w: 40.61, h: 32 }   // caja que el CSS debe reservar (ley E2)
const U1_HR_W = 79.23                    // ⋮ 40.61 + gap 8 + ✕ 30.63
const U1_X_W = 30.63, U1_X_H = 29, U1_X_DY = 1.5
const U1_PRE = {
  '1024x768': { y: 22,   right: { wide: 977,  narrow: 916  } },
  '1280x720': { y: 22,   right: { wide: 1156, narrow: 1044 } },
  '1366x768': { y: 22,   right: { wide: 1199, narrow: 1087 } },
  '1920x937': { y: 71.5, right: { wide: 1476, narrow: 1364 } },
  '1440x850': { y: 53,   right: { wide: 1236, narrow: 1124 } },
}
const U1_TOL = 0.05
// U1b · el estándar de la fila del menú sube a 44 (el de campaña sigue siendo 40
// para el disparador): con solo-icono el panel encoge en ancho, no en área.
const U1_ITEM_MIN = 44

async function u1Install(page) {
  await page.evaluate(({ ANCHORS }) => {
    const rnd = x => x == null ? null : Math.round(x * 100) / 100
    window.__u1R = (s) => {
      const e = typeof s === 'string' ? document.querySelector(s) : s
      if (!e) return null
      const b = e.getBoundingClientRect()
      return { x: rnd(b.x), y: rnd(b.y), w: rnd(b.width), h: rnd(b.height), right: rnd(b.right), bottom: rnd(b.bottom) }
    }
    window.__u1Snap = () => { const o = {}; ANCHORS.forEach(s => { o[s] = window.__u1R(s) }); return o }
    window.__u1Diff = (a, b) => {
      let max = 0, worst = null
      for (const k of ANCHORS) {
        if (!a[k] || !b[k]) continue
        for (const p of ['x', 'y', 'w', 'h']) {
          const d = Math.abs(a[k][p] - b[k][p])
          if (d > max) { max = d; worst = `${k}.${p}` }
        }
      }
      return { max: rnd(max), worst }
    }
    window.__u1Scroll = () => {
      const s = document.querySelector('.game-table-screen')
      const de = document.scrollingElement || document.documentElement
      return {
        scrH: s.scrollHeight, cliH: s.clientHeight,
        ovY: s.scrollHeight - s.clientHeight, ovX: s.scrollWidth - s.clientWidth,
        docOvY: de.scrollHeight - de.clientHeight, docOvX: de.scrollWidth - de.clientWidth,
      }
    }
    // Censo del z VIVO dentro del área (el panel vive FUERA de .game-table, así
    // que no puede contaminar su propia referencia; el filtro es cinturón).
    window.__u1MaxZ = () => {
      let max = -1, who = null
      document.querySelectorAll('.game-table *').forEach(el => {
        if (el.closest('.utilities-panel')) return
        const cs = getComputedStyle(el)
        if (cs.zIndex === 'auto' || cs.visibility === 'hidden' || cs.display === 'none') return
        const z = Number(cs.zIndex)
        if (!Number.isFinite(z)) return
        if (el.getBoundingClientRect().width === 0) return
        if (z > max) { max = z; who = String(el.className || '').trim().slice(0, 40) }
      })
      return { max, who }
    }
    // El z declarado no basta: el panel tiene que GANAR el hit-test en su centro
    // y en sus cuatro esquinas interiores (elementFromPoint es el juez real).
    window.__u1Wins = () => {
      const p = document.querySelector('.utilities-panel')
      if (!p) return null
      const r = p.getBoundingClientRect()
      const pts = [
        [(r.left + r.right) / 2, (r.top + r.bottom) / 2],
        [r.left + 3, r.top + 3], [r.right - 3, r.top + 3],
        [r.left + 3, r.bottom - 3], [r.right - 3, r.bottom - 3],
      ]
      return pts.every(([x, y]) => { const t = document.elementFromPoint(x, y); return !!t && (t === p || p.contains(t)) })
    }
    window.__u1Panel = () => window.__u1R('.utilities-panel')
    window.__u1Guard = (sels) => {
      const p = document.querySelector('.utilities-panel')
      if (!p) return []
      const r = p.getBoundingClientRect()
      const hits = []
      sels.forEach(s => document.querySelectorAll(s).forEach(el => {
        const b = el.getBoundingClientRect()
        if (b.width === 0 || b.height === 0) return
        const cs = getComputedStyle(el)
        if (cs.visibility === 'hidden' || cs.display === 'none') return
        const ox = Math.min(r.right, b.right) - Math.max(r.left, b.left)
        const oy = Math.min(r.bottom, b.bottom) - Math.max(r.top, b.top)
        if (ox > 0 && oy > 0) hits.push({ sel: s, txt: el.textContent.trim().slice(0, 12), area: rnd(ox * oy) })
      }))
      return hits
    }
    window.__u1Open = () => !!document.querySelector('.utilities-panel')
    // U1b · sin palabras: el estado del sonido lo portan el glifo y la clase.
    window.__u1SoundEntry = () => {
      const e = document.querySelector('.util-item-sound')
      if (!e) return null
      return { off: e.className.includes('is-off'), glyph: e.querySelector('.util-ico').textContent.trim(), title: e.getAttribute('title') }
    }
    // U1b · las dimensiones del panel se DERIVAN del contenido vivo, nunca se
    // cablean: ancho = el token, alto = suma de filas + separación + padding +
    // bordes. Recompactar el panel no puede volver a exigir tocar el arnés.
    window.__u1PanelExpect = () => {
      const p = document.querySelector('.utilities-panel')
      if (!p) return null
      const cs = getComputedStyle(p)
      const items = [...p.querySelectorAll('.util-item')]
      const sum = items.reduce((a, e) => a + e.getBoundingClientRect().height, 0)
      const mt = items.reduce((a, e) => a + (parseFloat(getComputedStyle(e).marginTop) || 0), 0)
      return {
        n: items.length,
        expW: parseFloat(cs.getPropertyValue('--dsk-u1-panel-w')),
        expH: rnd(sum + mt + parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom) +
          parseFloat(cs.borderTopWidth) + parseFloat(cs.borderBottomWidth)),
        got: window.__u1R('.utilities-panel'),
        itemH: items.map(e => rnd(e.getBoundingClientRect().height)),
        itemW: items.map(e => rnd(e.getBoundingClientRect().width)),
        sep: rnd(parseFloat(getComputedStyle(items[items.length - 1]).marginTop) || 0),
        hairline: getComputedStyle(items[items.length - 1]).borderTopWidth,
      }
    }
    window.__u1Titles = () =>
      [...document.querySelectorAll('.utilities-panel .util-item')].map(e => e.getAttribute('title'))
    window.__u1Popup = () => {
      const p = document.querySelector('.utilities-popup')
      if (!p) return null
      return { rect: window.__u1R('.utilities-popup'), txt: p.textContent.trim(), z: Number(getComputedStyle(p).zIndex) }
    }
  }, { ANCHORS: U1_ANCHORS })
}

const u1OpenMenu = async (page) => { await page.click('.utilities-trigger'); await page.waitForTimeout(120) }

// Estado abierto: Δ contra el cerrado, overflow, rect del panel, z y guardia.
async function u1Probe(page, tag) {
  const closed = await page.evaluate(() => ({ snap: window.__u1Snap(), scr: window.__u1Scroll() }))
  await u1OpenMenu(page)
  const open = await page.evaluate((G) => ({
    snap: window.__u1Snap(), scr: window.__u1Scroll(),
    panel: window.__u1Panel(), wins: window.__u1Wins(), maxZ: window.__u1MaxZ(),
    panelZ: Number(getComputedStyle(document.querySelector('.utilities-panel')).zIndex),
    guard: window.__u1Guard(G),
  }), U1_GUARD)
  await page.keyboard.press('Escape'); await page.waitForTimeout(120)
  const back = await page.evaluate(() => ({ snap: window.__u1Snap(), scr: window.__u1Scroll(), open: window.__u1Open() }))
  const d = await page.evaluate(([a, b, c]) => ({
    open: window.__u1Diff(a, b), back: window.__u1Diff(a, c),
  }), [closed.snap, open.snap, back.snap])
  return {
    tag, dOpen: d.open, dBack: d.back,
    dScrH: open.scr.scrH - closed.scr.scrH, dCliH: open.scr.cliH - closed.scr.cliH,
    ovOpen: { x: open.scr.ovX, y: open.scr.ovY }, ovClosed: { x: closed.scr.ovX, y: closed.scr.ovY },
    docOv: { x: open.scr.docOvX, y: open.scr.docOvY },
    panel: open.panel, panelZ: open.panelZ, wins: open.wins, maxZ: open.maxZ,
    guard: open.guard, closedByEsc: back.open === false,
  }
}

async function runU1(browser) {
  const cells = []
  const tblFilter = process.argv[3] ? Number(process.argv[3]) : null
  const vpFilter = process.argv[4] || null
  for (const n of U1_TABLES) for (const vp of U1_VIEWPORTS) {
    if (tblFilter && n !== tblFilter) continue
    if (vpFilter && `${vp.w}x${vp.h}` !== vpFilter) continue
    const key = `${vp.w}x${vp.h}`
    const pre = U1_PRE[key]
    const hrRight = pre.right[n >= 4 ? 'wide' : 'narrow']
    const page = await browser.newPage({ viewport: { width: vp.w, height: vp.h } })
    // Sonda del mute REAL: Howler.mute() escribe el gain maestro con
    // setValueAtTime. Se engancha ANTES de cargar la app, sin tocar src/. Si el
    // headless no trae Web Audio el log queda vacío → el check reporta null
    // (no observable), nunca falso verde.
    await page.addInitScript(() => {
      window.__gainLog = []
      try {
        const orig = AudioParam.prototype.setValueAtTime
        AudioParam.prototype.setValueAtTime = function (v, t) { window.__gainLog.push(v); return orig.call(this, v, t) }
      } catch { /* sin Web Audio */ }
    })
    await gotoMesa(page, n)
    await u1Install(page)
    await installHitProbe(page)

    // (1) Caja del disparador contra la baseline PRE-tanda.
    const caja = await page.evaluate(() => {
      const t = window.__u1R('.utilities-trigger'), hr = window.__u1R('.header-right'), x = window.__u1R('.btn-leave')
      const el = document.querySelector('.utilities-trigger')
      const cs = el ? getComputedStyle(el) : null
      return { t, hr, x, glyph: el ? el.textContent.trim() : null,
        muteCount: document.querySelectorAll('.mute-button').length,
        css: cs ? { pos: cs.position, z: cs.zIndex, bs: cs.boxSizing, br: cs.borderRadius, bw: cs.borderTopWidth } : null }
    })
    const expT = { x: hrRight - U1_HR_W, y: pre.y, w: U1_TRIGGER.w, h: U1_TRIGGER.h }
    const expHR = { x: hrRight - U1_HR_W, y: pre.y, w: U1_HR_W, h: U1_TRIGGER.h }
    const expX = { x: hrRight - U1_X_W, y: pre.y + U1_X_DY, w: U1_X_W, h: U1_X_H }
    const dOf = (got, exp) => got ? round(Math.max(...['x', 'y', 'w', 'h'].map(p => Math.abs(got[p] - exp[p])))) : null
    const dCaja = { trigger: dOf(caja.t, expT), headerRight: dOf(caja.hr, expHR), equis: dOf(caja.x, expX) }
    const dCajaMax = round(Math.max(...Object.values(dCaja).map(v => v == null ? 999 : v)))

    // (2) Fuera de flujo + z + guardia, en reposo.
    const probes = [await u1Probe(page, 'reposo')]

    // (3) Cierre por clic fuera NEUTRO (sobre la cabecera, lejos del disparador).
    await u1OpenMenu(page)
    await page.click('.table-header', { position: { x: 4, y: 4 } })
    await page.waitForTimeout(120)
    const cerradoClicFuera = await page.evaluate(() => window.__u1Open() === false)

    // (3b) U1b · panel solo-icono: dimensiones derivadas, tooltips y el badge.
    await u1OpenMenu(page)
    const dims = await page.evaluate(() => window.__u1PanelExpect())
    const titles = await page.evaluate(() => window.__u1Titles())
    const preBadge = await page.evaluate(() => window.__u1Snap())
    await page.click('.util-badge'); await page.waitForTimeout(180)
    const press = await page.evaluate((base) => ({
      popup: window.__u1Popup(),
      menuOpen: window.__u1Open(),          // ← el invariante sellado
      ls: localStorage.getItem('ajilei.consultas'),
      badgeTxt: document.querySelector('.util-badge').textContent.trim(),
      dAnchors: window.__u1Diff(base, window.__u1Snap()),
      scr: window.__u1Scroll(),
    }), preBadge)
    // Autocierre a los 2s: vivo a ~1,4s y muerto a ~2,6s. Dos muestras, no una:
    // comprobar sólo el final no distingue "se cerró a tiempo" de "nunca abrió".
    await page.waitForTimeout(1220)
    const vivo14 = await page.evaluate(() => !!document.querySelector('.utilities-popup'))
    await page.waitForTimeout(1200)
    const muerto26 = await page.evaluate(() => !document.querySelector('.utilities-popup'))
    const menuTrasAuto = await page.evaluate(() => window.__u1Open())
    // Vía 2 · clic en otra parte. Primero DENTRO del panel (su padding, fuera del
    // badge): cierra el popup y el menú no se inmuta. El menú sigue abierto tras
    // esto, así que NO se vuelve a llamar a u1OpenMenu — volvería a cerrarlo.
    await page.click('.util-badge'); await page.waitForTimeout(150)
    await page.click('.utilities-panel', { position: { x: 5, y: 3 } }); await page.waitForTimeout(150)
    const trasClicDentro = await page.evaluate(() => ({ popup: !document.querySelector('.utilities-popup'), menu: window.__u1Open() }))
    // …y luego FUERA del panel: cierra los dos, que es lo coherente.
    await page.click('.util-badge'); await page.waitForTimeout(150)
    await page.click('.table-header', { position: { x: 4, y: 4 } }); await page.waitForTimeout(150)
    const trasClicFuera = await page.evaluate(() => ({ popup: !document.querySelector('.utilities-popup'), menu: window.__u1Open() }))

    // (4) Cierre AL EJECUTAR + toggle de sonido vivo. Cierra y deja el ajuste
    //     persistido; se devuelve a 'on' para no arrastrar estado a lo que sigue.
    await u1OpenMenu(page)
    const antes = await page.evaluate(() => window.__u1SoundEntry())
    await page.click('.util-item-sound'); await page.waitForTimeout(150)
    const trasEjecutar = await page.evaluate(() => ({
      open: window.__u1Open(), ls: localStorage.getItem('ajilei.sound'),
      gain: window.__gainLog.slice(-3),
    }))
    await u1OpenMenu(page)
    const despues = await page.evaluate(() => window.__u1SoundEntry())
    await page.click('.util-item-sound'); await page.waitForTimeout(150)

    // (5) El clic fuera NO se traga la acción: con el menú abierto, el clic sobre
    //     "Iniciar mano" cierra el panel Y arranca la mano. Es la razón entera de
    //     que el cierre use un listener no bloqueante en vez de un overlay.
    await u1OpenMenu(page)
    await page.click('.action-area .btn-primary')
    await page.waitForTimeout(400)
    const clicPasaAlBoton = await page.evaluate(() => ({
      cerrado: window.__u1Open() === false,
      arrancada: !document.querySelector('.action-area .btn-primary') ||
        !/Iniciar mano/.test(document.querySelector('.action-area .btn-primary').textContent),
    }))

    // (6) Estados calientes de la mano: apuesta (con fila de mults), descarte con
    //     selección y pago. En cada uno se abre el menú y se mide todo otra vez.
    const vistos = new Set()
    for (let i = 0; i < 240; i++) {
      await page.waitForTimeout(230); await page.mouse.move(5, 5)
      const st = await page.evaluate(() => ({
        bet: !!document.querySelector('.action-buttons .btn'),
        discard: !!document.querySelector('.discard-area .btn'),
        pago: !!document.querySelector('.action-area .btn-primary') &&
          /Siguiente mano/.test(document.querySelector('.action-area .btn-primary').textContent || ''),
      }))
      if (st.bet && !vistos.has('apuesta')) { vistos.add('apuesta'); probes.push(await u1Probe(page, 'apuesta')) }
      if (st.discard && !vistos.has('descarte')) {
        vistos.add('descarte')
        await page.evaluate(() => { const c = document.querySelector('.player-zone .playing-card.card-clickable'); if (c) c.click() })
        await page.waitForTimeout(200)
        probes.push(await u1Probe(page, 'descarte-sel'))
      }
      if (st.pago) { vistos.add('pago'); probes.push(await u1Probe(page, 'pago')); break }
      await clickIf(page, '.action-buttons button:has-text("Pasar")') ||
        await clickIf(page, '.action-buttons button:has-text("Igualar")') ||
        await clickIf(page, '.action-buttons button:has-text("Apostar")')
      await clickIf(page, 'button:has-text("Sin descartar")') || await clickIf(page, '.discard-area .btn')
    }

    // (7) z REAL contra los dos techos vivos: panel revelado (7) y sobrevuelo Z1
    //     (9). Mesa 2 no revela → queda null, no falso verde.
    let zReal = null
    const tap = page.locator('.opp-name-tappable').first()
    if (await tap.count() && await tap.isVisible().catch(() => false)) {
      await tap.click().catch(() => {}); await page.waitForTimeout(1500)
      const pRev = await u1Probe(page, 'revelado')
      probes.push(pRev)
      // Z1 VIVO CON EL MENÚ ABIERTO. El orden importa y no es intercambiable:
      // sobrevolar primero y abrir después mata el :hover (abrir mueve el puntero
      // al ⋮). Así que se abre el menú y LUEGO se sobrevuela — el hover no
      // dispara pointerdown, de modo que el panel sigue abierto y ambos coexisten,
      // que es exactamente el frame que hay que juzgar.
      await u1OpenMenu(page)
      // La carta a sobrevolar se elige CON el panel ya abierto y se descarta
      // cualquiera que caiga bajo él: si el panel la tapa, el hover se lo lleva
      // el panel y Z1 no llega a activarse (el falso rojo que esto evita).
      // Z1 exige además cara visible (ni dorso ni hueco): es su propio gate.
      const target = await page.evaluate(() => {
        const p = document.querySelector('.utilities-panel')
        const pr = p ? p.getBoundingClientRect() : null
        const libre = [...document.querySelectorAll('.opp-card-slot')].filter(el => {
          const c = el.querySelector('.playing-card')
          if (!c || /card-back|card-empty/.test(c.className)) return false
          const b = el.getBoundingClientRect()
          if (b.width === 0) return false
          if (pr && !(b.right < pr.left || b.left > pr.right || b.bottom < pr.top || b.top > pr.bottom)) return false
          return true
        })
        if (!libre.length) return null
        const b = libre[0].getBoundingClientRect()
        return { x: b.left + b.width / 2, y: b.top + b.height / 2 }
      })
      let z1Vivo = null
      if (target) {
        await page.mouse.move(target.x, target.y); await page.waitForTimeout(350)
        z1Vivo = await page.evaluate(() => ({
          abierto: window.__u1Open(),
          // Z1 sube DOS cosas al sobrevolar: el slot de 5 a --dsk-z1-slot-z (6),
          // para ganarle a sus hermanas, y el PANEL entero de 7 a
          // --dsk-z1-panel-z (9), que es el techo real contra el que compite el
          // menú. Se leen los dos: sin el 6 la lupa no se activó, sin el 9 no
          // hay techo Z1 que superar y el verde no valdría nada.
          slotZ: Math.max(-1, ...[...document.querySelectorAll('.opp-card-slot')]
            .map(el => Number(getComputedStyle(el).zIndex)).filter(Number.isFinite)),
          panelZ1: Math.max(-1, ...[...document.querySelectorAll('.opp-panel')]
            .map(el => Number(getComputedStyle(el).zIndex)).filter(Number.isFinite)),
          maxZ: window.__u1MaxZ(), wins: window.__u1Wins(),
        }))
      }
      await page.keyboard.press('Escape'); await page.waitForTimeout(120)
      await page.mouse.move(5, 5)
      zReal = { revelado: pRev.maxZ, panelZ: pRev.panelZ, wins: pRev.wins, z1Vivo }
    }

    const worst = (get) => { let m = 0, who = null; for (const p of probes) { const v = get(p); if (v == null) continue; if (Math.abs(v) > m) { m = Math.abs(v); who = p.tag } } return { max: round(m), tag: who } }
    const dFlujo = worst(p => p.dOpen.max)
    const dVuelta = worst(p => p.dBack.max)
    const guardHits = probes.flatMap(p => p.guard.map(g => ({ tag: p.tag, ...g })))
    const zTecho = Math.max(...probes.map(p => p.maxZ.max))
    const panelZ = probes[0].panelZ
    const libreAbajo = round(Math.min(...probes.map(p => vp.h - p.panel.bottom)))

    const checks = {
      caja: dCajaMax <= U1_TOL && caja.glyph === '⋮' && caja.muteCount === 1,
      fueraDeFlujo: dFlujo.max === 0 && dVuelta.max === 0 &&
        probes.every(p => p.dScrH === 0 && p.dCliH === 0),
      overflow: vp.h > 800 || probes.every(p => p.ovOpen.x === 0 && p.ovOpen.y === 0 && p.docOv.x === 0 && p.docOv.y === 0),
      z: panelZ > zTecho && panelZ < 100 && probes.every(p => p.wins === true),
      // Mesa 2 no revela → null (no hay Z1 que superar), nunca falso verde.
      zSobreZ1: zReal == null || zReal.z1Vivo == null ? null
        : (zReal.z1Vivo.abierto && zReal.z1Vivo.slotZ >= 6 && zReal.z1Vivo.panelZ1 >= 9 &&
           zReal.z1Vivo.wins === true && panelZ > zReal.z1Vivo.maxZ.max),
      cierreEsc: probes.every(p => p.closedByEsc),
      cierreClicFuera: cerradoClicFuera,
      cierreEjecutar: trasEjecutar.open === false,
      clicFueraEjecuta: clicPasaAlBoton.cerrado && clicPasaAlBoton.arrancada,
      estadoSonido: antes && despues && antes.off === false && despues.off === true &&
        trasEjecutar.ls === 'off',
      guardia: guardHits.length === 0,
      encaje: probes.every(p => p.panel.right <= vp.w && p.panel.bottom <= vp.h && p.panel.x >= 0 && p.panel.y >= 0),
      // Observable sólo si el headless trae Web Audio: Howler.mute(true) baja el
      // gain maestro a 0. Sin Web Audio → null (el corte en seco de un sonido en
      // curso queda para la validación de oído).
      muteReal: trasEjecutar.gain.length === 0 ? null : trasEjecutar.gain.includes(0),
      // ── U1b ──────────────────────────────────────────────────────────────
      // Dimensiones DERIVADAS del contenido vivo (nunca los 224×194 de U1).
      panelDims: dims != null && dims.n === 4 &&
        Math.abs(dims.got.w - dims.expW) <= 0.5 && Math.abs(dims.got.h - dims.expH) <= 0.5,
      // Solo-icono no puede encoger el área táctil: la fila conserva ≥44 de alto
      // y el interior del panel ≥44 de ancho.
      filas44: dims != null && dims.itemH.every(h => h >= U1_ITEM_MIN) && dims.itemW.every(w => w >= U1_ITEM_MIN),
      // "Mano actual" separada del grupo: aire + filete, y va la ÚLTIMA.
      manoSeparada: dims != null && dims.sep > 0 && parseFloat(dims.hairline) > 0 &&
        titles[3] === 'Mano actual',
      // Sin palabras, el tooltip nativo es la única leyenda: no puede faltar.
      tooltips: titles.length === 4 &&
        titles.every(t => t && t.trim()) &&
        titles[0] === 'Sonido' && titles[1] === 'Mensajes' && titles[2] === 'Saldo',
      // Contador: clave creada con las 20 gratis y badge que la pinta.
      contador: press.ls === '20' && press.badgeTxt === '20',
      // El popup abre por press, dice lo que debe y pinta sobre el panel.
      popupAbre: press.popup != null && press.popup.txt === 'Tienes 20 consultas gratis' &&
        press.popup.z > panelZ && press.popup.rect.x >= 0 && press.popup.rect.right <= vp.w,
      // INVARIANTE SELLADO · presionar el badge NO es ejecutar.
      badgeNoCierra: press.menuOpen === true && menuTrasAuto === true && trasClicDentro.menu === true,
      // Popup fuera de flujo, igual que el panel.
      popupFueraDeFlujo: press.dAnchors.max === 0 &&
        press.scr.ovX === probes[0].ovClosed.x && press.scr.ovY === probes[0].ovClosed.y,
      // Las dos vías de cierre, exactas: autocierre a 2s y clic en otra parte.
      popupAutocierre: vivo14 === true && muerto26 === true,
      popupClicFuera: trasClicDentro.popup === true && trasClicFuera.popup === true &&
        trasClicFuera.menu === false,
    }
    const passed = Object.values(checks).every(v => v === true || v === null)
    cells.push({
      table: n, vp, caja: { got: caja, exp: { t: expT, hr: expHR, x: expX }, d: dCaja, dMax: dCajaMax },
      probes: probes.map(p => ({ tag: p.tag, dOpen: p.dOpen, dBack: p.dBack, panel: p.panel, maxZ: p.maxZ, guard: p.guard, ov: p.ovOpen })),
      panelZ, zTecho, zReal, libreAbajo, sonido: { antes, despues, ls: trasEjecutar.ls, gain: trasEjecutar.gain },
      dims, titles,
      badge: { press, vivo14, muerto26, menuTrasAuto, trasClicDentro, trasClicFuera },
      cierre: { esc: checks.cierreEsc, clicFuera: cerradoClicFuera, ejecutar: trasEjecutar.open === false, ...clicPasaAlBoton },
      guardHits, checks, passed,
    })
    console.log(`T${n} ${key} · caja Δ=${dCajaMax} (${caja.glyph}) · flujo Δ=${dFlujo.max}/${dVuelta.max} · panel ${probes[0].panel.w}×${probes[0].panel.h} (esp ${dims?.expW}×${dims?.expH}) filas ${dims?.itemW[0]}×${dims?.itemH[0]} sep ${dims?.sep}+${dims?.hairline} · badge "${press.badgeTxt}"/ls ${press.ls} popup ${press.popup?.rect.w}×${press.popup?.rect.h} z${press.popup?.z} auto ${vivo14}→${muerto26} menú ${press.menuOpen}/${trasClicDentro.menu}/${trasClicFuera.menu} · z ${panelZ}>${zTecho} (${probes.find(p => p.maxZ.max === zTecho)?.maxZ.who})${zReal?.z1Vivo ? ` · Z1 vivo slot ${zReal.z1Vivo.slotZ}/panel ${zReal.z1Vivo.panelZ1} techo ${zReal.z1Vivo.maxZ.max} wins=${zReal.z1Vivo.wins}` : ''} wins=${probes.every(p => p.wins)} · cierre esc/fuera/exec/pasa ${checks.cierreEsc}/${cerradoClicFuera}/${trasEjecutar.open === false}/${clicPasaAlBoton.cerrado && clicPasaAlBoton.arrancada} · guardia ${guardHits.length} · ${probes.length}f · ${passed ? 'OK' : 'FAIL [' + Object.entries(checks).filter(([, v]) => v === false).map(([k]) => k).join(',') + ']'}`)
    await page.close()
  }

  // ── Sub-pasada táctil (pointer:coarse) · el gate admite portátiles táctiles.
  const hits = []
  for (const n of U1_TABLES) for (const vp of [{ w: 1024, h: 768 }, { w: 1280, h: 720 }]) {
    if (tblFilter && n !== tblFilter) continue
    const page = await browser.newPage({ viewport: { width: vp.w, height: vp.h }, hasTouch: true, isMobile: true })
    await gotoMesa(page, n); await u1Install(page); await installHitProbe(page)
    const coarse = await page.evaluate(() => window.matchMedia('(pointer: coarse)').matches)
    await u1OpenMenu(page)
    const boxes = await page.evaluate(() => {
      const acc = []
      const push = (name, el, min) => { if (!el) return; const hb = window.__hitBox(el); acc.push({ name, min, visual: `${hb.visualW}×${hb.visualH}`, w: hb.w, h: hb.h, occluded: !!hb.occluded }) }
      // El disparador conserva el estándar de campaña (40); las filas del menú
      // suben a 44, que es lo que U1b promete al quitarles la palabra.
      push('⋮', document.querySelector('.utilities-trigger'), 40)
      document.querySelectorAll('.util-item').forEach((el, i) => push(`item${i}`, el, 44))
      // El badge es visual de 18: su embaldosado lo lleva a 40×44 SIN salirse de
      // su propia fila (desbordar hacia arriba le robaría taps a Saldo).
      push('badge', document.querySelector('.util-badge'), 40)
      return acc
    })
    // La ✕ vecina no lleva embaldosado: el pseudo del ⋮ no puede robarle el hit.
    const equis = await page.evaluate(() => { const hb = window.__hitBox(document.querySelector('.btn-leave')); return { w: hb.w, h: hb.h, occluded: !!hb.occluded } })
    // El embaldosado del badge no puede desbordar su fila: se contrasta contra
    // la caja de la entrada "Mano actual", no contra un número suelto.
    const badgeConfinado = await page.evaluate(() => {
      const b = document.querySelector('.util-badge'), it = document.querySelector('.util-item-mano')
      if (!b || !it) return null
      const hb = window.__hitBox(b), r = it.getBoundingClientRect()
      return { dentro: hb.top >= Math.floor(r.top) - 1 && hb.bottom <= Math.ceil(r.bottom) + 1, itemTop: Math.round(r.top), itemBottom: Math.round(r.bottom), hitTop: hb.top, hitBottom: hb.bottom }
    })
    const ok = coarse && boxes.every(b => !b.occluded && b.w >= b.min && b.h >= b.min) &&
      !equis.occluded && badgeConfinado?.dentro === true
    hits.push({ table: n, vp, coarse, boxes, equis, badgeConfinado, ok })
    console.log(`hit T${n} ${vp.w}x${vp.h} · coarse=${coarse} · ${boxes.map(b => `${b.name} ${b.w}×${b.h}≥${b.min}`).join(' · ')} · ✕ ${equis.w}×${equis.h} · badge en fila=${badgeConfinado?.dentro} · ${ok ? 'OK' : 'FAIL'}`)
    await page.close()
  }

  // ── Persistencia end-to-end: apagar → RECARGAR → volver a la mesa y leer la
  //    entrada. Es exactamente lo que Victor comprueba a ojo.
  const sound = []
  for (const [n, vp] of [[5, { w: 1366, h: 768 }], [2, { w: 1024, h: 768 }]]) {
    if (tblFilter && n !== tblFilter) continue
    const page = await browser.newPage({ viewport: { width: vp.w, height: vp.h } })
    await gotoMesa(page, n); await u1Install(page)
    await u1OpenMenu(page); await page.click('.util-item-sound'); await page.waitForTimeout(150)
    const lsAntes = await page.evaluate(() => localStorage.getItem('ajilei.sound'))
    await page.reload({ waitUntil: 'load' }); await page.waitForTimeout(400)
    const lsTras = await page.evaluate(() => localStorage.getItem('ajilei.sound'))
    await page.click('button:has-text("Jugar vs IA")')
    await page.click(`button:has-text("Mesa de ${n} jugadores")`)
    await page.click('.stake-btn'); await page.waitForSelector('.game-table')
    await u1Install(page); await u1OpenMenu(page)
    const entry = await page.evaluate(() => window.__u1SoundEntry())
    const ok = lsAntes === 'off' && lsTras === 'off' && entry && entry.off === true && entry.glyph === '🔇'
    sound.push({ table: n, vp, lsAntes, lsTras, entry, ok })
    console.log(`sonido T${n} ${vp.w}x${vp.h} · ls ${lsAntes}→${lsTras} · entrada ${entry?.glyph} title="${entry?.title}" off=${entry?.off} · ${ok ? 'OK' : 'FAIL'}`)
    await page.close()
  }

  const passed = cells.every(c => c.passed) && hits.every(h => h.ok) && sound.every(s => s.ok)
  console.log(`\n── U1: ${cells.filter(c => c.passed).length}/${cells.length} celdas · hits ${hits.filter(h => h.ok).length}/${hits.length} · sonido ${sound.filter(s => s.ok).length}/${sound.length} · ${passed ? 'VERDE' : 'ROJO'}`)
  return { cells, hits, sound, passed }
}

// ── Main ──────────────────────────────────────────────────────────────────────
// R2c · Playwright headless pasa --hide-scrollbars POR DEFECTO. Con esa bandera
// una barra que nace por overflow desplazable no encoge el cliente y el saltito
// de 15px del área es invisible al arnés (falso verde comprobado). El modo r2 —
// el único que audita el shift durante una animación — se lanza sin ella, para
// medir lo que ve Victor. El resto de modos conserva el lanzamiento histórico
// (sus baselines se tomaron con barras ocultas; cambiarlo movería sus números).
const browser = await chromium.launch({
  channel: 'msedge', headless: true,
  ...(MODE === 'r2' ? { ignoreDefaultArgs: ['--hide-scrollbars'] } : {}),
})
const report = { mode: MODE, ts: new Date().toISOString() }
try {
  if (MODE === 'd1d2' || MODE === 'all') {
    const { page, data } = await runD1D2(browser)
    report.d1d2 = data
    await page.close()
  }
  if (MODE === 'd3' || MODE === 'all') report.d3 = await runD3(browser)
  if (MODE === 'bug' || MODE === 'all') report.bug = await runBug(browser)
  if (MODE === 'shots' || MODE === 'all') report.shots = await runShots(browser)
  if (MODE === 'gate') report.gate = await runGate(browser, process.argv[3] || 'after')
  if (MODE === 'b1') report.b1 = await runB1(browser)
  if (MODE === 'tactil') report.tactil = await runTactil(browser)
  if (MODE === 'p1') report.p1 = await runP1(browser)
  if (MODE === 'p2') report.p2 = await runP2(browser)
  if (MODE === 'r1') report.r1 = await runR1(browser)
  if (MODE === 'r2') report.r2 = await runR2(browser)
  if (MODE === 'o1') report.o1 = await runO1(browser)
  if (MODE === 'h1') report.h1 = await runH1(browser)
  if (MODE === 'm1') report.m1 = await runM1(browser)
  if (MODE === 'a1') report.a1 = await runA1(browser)
  if (MODE === 'f1') report.f1 = await runF1(browser)
  if (MODE === 'z1') report.z1 = await runZ1(browser)
  if (MODE === 'o2') report.o2 = await runO2(browser)
  if (MODE === 'a2') report.a2 = await runA2(browser)
  if (MODE === 'u1') report.u1 = await runU1(browser)
} catch (e) {
  report.error = String(e && e.stack || e)
}
await browser.close()

const json = JSON.stringify(report, (k, v) => typeof v === 'number' ? round(v) : v, 2)
console.log(json)
try { writeFileSync(`${OUT_DIR}/diag_${MODE}.json`, json) } catch {}
