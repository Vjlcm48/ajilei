// ── diagPUE.mjs · Arnés de la Portada-Entrada ───────────────────────────────
// Instrucción rectora: docs/AJILEI_PUE_Auditoria_v1.0.md, reapuntado a
// PRODUCCIÓN por AJILEI_PUE_Fase1_v1.0 §3.2.
//
// Mide, no opina. Todo veredicto de este arnés sale de una caja de contorno, de
// una propiedad computada o de la bitácora de red — nunca de mirar una captura.
// Mismo molde que diagCEL0/diagDSK: playwright-core sobre el Edge del sistema,
// sin dependencias nuevas y sin tocar un byte de la app.
//
// ── POR QUÉ `vite preview` Y NO `npm run dev` ───────────────────────────────
// La portada sólo se pinta en el estado SIN_SESION, y en desarrollo el árbol
// lleva `VITE_AUTH_BYPASS=1`, que resuelve a COMPLETO y manda directo al lobby:
// contra el servidor de desarrollo la portada NO EXISTE. `AUTH_BYPASS` cuelga de
// `import.meta.env.DEV`, así que en una compilación de producción se apaga solo
// y un contexto de navegador limpio —sin sesión guardada— cae en SIN_SESION.
// De paso es lo que §3.1 pide para pesar el camino crítico: se mide el bundle
// real, no los módulos sueltos del servidor de desarrollo.
//
// Uso:  npm run build && npm run preview
//       node scripts/diagPUE.mjs            (todo)
//       node scripts/diagPUE.mjs 1.8        (un punto suelto)
//       node scripts/diagPUE.mjs puerta     (la puerta: el visitante anónimo llega a la portada)
import { chromium } from 'playwright-core'
import { mkdirSync, writeFileSync } from 'node:fs'
import { gzipSync } from 'node:zlib'

const BASE = process.env.PUE_BASE || 'http://localhost:4173'
const URL_LAMINA = `${BASE}/`
const SALIDA = 'capturas-pue'
mkdirSync(SALIDA, { recursive: true })

// El censo de la instrucción. `etiqueta` es el nombre del archivo de captura.
const VIEWPORTS = [
  { etiqueta: '1920x1080', width: 1920, height: 1080, clase: 'escritorio' },
  { etiqueta: '390x844',   width: 390,  height: 844,  clase: 'movil-vertical' },
  { etiqueta: '360x640',   width: 360,  height: 640,  clase: 'movil-vertical' },
  { etiqueta: '320x568',   width: 320,  height: 568,  clase: 'movil-vertical' },
  { etiqueta: '851x393',   width: 851,  height: 393,  clase: 'movil-horizontal' },
]

// Duraciones del rotor, copiadas de la lámina (DURACIONES en su <script>).
const DURACIONES = [4000, 4000, 4500, 4500, 4000]

// ── Los dos topes que los deltas 2 y 3 endurecen ───────────────────────────
// La auditoría de la lámina midió con 8px de tolerancia en el eje y sin mínimo
// de holgura. La ficha de producción sella otra cosa: |centro de la tinta −
// centro de la frase| ≤ 4px, y holgura tinta↔frase ≥ 10px en TODO el censo.
const EJE_TOPE = 4
const HOLGURA_MINIMA = 10

// §3.1 de la ficha: el camino crítico hasta la portada pintada. Se mide sobre
// lo que VIAJA (ver el bloque 1.8), que es lo que paga el jugador.
const TECHO_CRITICO_KIB = 200
const NOMBRES_ESC = ['baraja', 'AJILEI', 'enseñanza', 'Heptacoins', 'mesa']

const resultados = { generado: new Date().toISOString(), url: URL_LAMINA, bloques: {} }
const fallos = []
function anota(id, ok, detalle) {
  if (!ok) fallos.push(`${id} — ${detalle}`)
  console.log(`  ${ok ? 'VERDE' : 'ROJO '} · ${id} · ${detalle}`)
  return ok
}

// ── Sondas que corren DENTRO de la página ──────────────────────────────────

// Caja de contorno de un selector, o null si no existe/no se pinta.
const CAJA = (sel) => `(() => {
  const e = document.querySelector(${JSON.stringify(sel)});
  if (!e) return null;
  const r = e.getBoundingClientRect();
  const cs = getComputedStyle(e);
  return { x:r.x, y:r.y, w:r.width, h:r.height, top:r.top, bottom:r.bottom,
           left:r.left, right:r.right,
           visibility: cs.visibility, display: cs.display, opacity: cs.opacity };
})()`

// La TINTA de la escena activa: unión de las cajas de sus elementos con dibujo
// real (imágenes y texto), no la del contenedor. `.abanico` es `inset:0` y su
// caja es el escenario entero — medir eso daría un centrado trivial y falso.
//
// LA VISIBILIDAD SE PREGUNTA CON `checkVisibility`, Y HACE FALTA. El primer
// intento filtraba por `getComputedStyle(pieza).opacity`, y MIDIÓ DE MÁS: en
// esta lámina el `opacity: 0` vive en el PADRE (`.moneda`, `.carta`), y la
// opacidad heredada no baja al estilo computado del hijo — un <img> dentro de
// un padre invisible sigue declarando `opacity: 1`. Así entraba en la unión la
// moneda héroe de la escena 4, que a los 1,4 s todavía no ha caído.
// `checkVisibility({opacityProperty:true})` sí mira la cadena de ancestros.
const TINTA_ESCENA = `(() => {
  const esc = document.querySelector('.pue-esc.pue-activa');
  if (!esc) return null;
  const piezas = [...esc.querySelectorAll('img, .pregunta span, .marcador')];
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity, n = 0;
  const dentro = [];
  for (const p of piezas) {
    if (!p.checkVisibility({ opacityProperty: true, visibilityProperty: true,
                             contentVisibilityAuto: true })) continue;
    const r = p.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) continue;
    x0 = Math.min(x0, r.left); y0 = Math.min(y0, r.top);
    x1 = Math.max(x1, r.right); y1 = Math.max(y1, r.bottom); n++;
    dentro.push((p.parentElement && p.parentElement.className) || p.className);
  }
  if (!n) return null;
  return { left:x0, top:y0, right:x1, bottom:y1, w:x1-x0, h:y1-y0,
           cx:(x0+x1)/2, cy:(y0+y1)/2, piezas:n, dentro,
           indice: [...document.querySelectorAll('.pue-esc')].indexOf(esc) };
})()`

const INDICE_ACTIVA = `[...document.querySelectorAll('.pue-esc')].findIndex(e => e.classList.contains('pue-activa'))`

async function esperarEscena(page, i, msExtra) {
  // El rotor es de la lámina: se espera a su clase, no se fuerza el índice.
  await page.waitForFunction(`${INDICE_ACTIVA} === ${i}`, null, { timeout: 30000 })
  if (msExtra) await page.waitForTimeout(msExtra)
}

// ── Arranque ────────────────────────────────────────────────────────────────
const modo = process.argv[2] || 'todo'
const hacer = (id) => modo === 'todo' || modo === id

const browser = await chromium.launch({ channel: 'msedge', headless: true })

// Guarda de servidor: sin dev server no hay nada que auditar y el error de
// Playwright no lo dice con esas palabras.
{
  const p = await browser.newPage()
  try {
    const r = await p.goto(URL_LAMINA, { waitUntil: 'domcontentloaded', timeout: 8000 })
    if (!r || !r.ok()) throw new Error(`HTTP ${r ? r.status() : '—'}`)
  } catch (e) {
    console.error(`\nNo se pudo abrir ${URL_LAMINA}: ${e.message}`)
    console.error('Levanta el terreno correcto primero:  npm run build && npx vite preview --port 4173')
    console.error('(no npm run dev: el 5173 compila VITE_AUTH_BYPASS=1, el estado nace COMPLETO y la portada nunca se evalúa)\n')
    await browser.close(); process.exit(1)
  }
  await p.close()
}

// ════════════════════════════════════════════════════════════════════════════
// puerta · El visitante anónimo LLEGA a la portada
// ════════════════════════════════════════════════════════════════════════════
// Micro-delta PTA (AJILEI_PUE_Fase1_Delta_PTA_v1.0, Bloque 3). Hasta aquí todos
// los bloques de este arnés abrían `/` y daban por hecho que lo pintado era la
// portada: ninguno lo AFIRMABA. Este modo mide la puerta como tal: contexto
// limpio (sin almacén, sin sesión), raíz `/`, y un veredicto con anclas reales
// —la raíz de Portada y su rotor PRESENTES; la Bienvenida vieja, la Entrada y
// el Bautizo AUSENTES. Corre contra `vite preview` por la razón de la cabecera:
// en el servidor de desarrollo el bypass resuelve a COMPLETO y este modo, con
// toda razón, saldría ROJO — que es exactamente lo que el hallazgo del 03-sep
// vio a ojo en localhost:5173. Un rojo aquí contra 5173 no es un fallo del
// arnés: es el bypass haciendo su trabajo.
if (hacer('puerta')) {
  console.log('\n── puerta · visitante anónimo en / ──')
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } })
  const page = await ctx.newPage()
  const consola = []
  page.on('console', m => { if (m.type() === 'error') consola.push(m.text()) })
  page.on('pageerror', e => consola.push(`pageerror: ${e.message}`))
  await page.goto(URL_LAMINA, { waitUntil: 'networkidle' })
  await page.waitForTimeout(900)   // que asiente la entrada `.sube`

  const R = await page.evaluate(`(() => {
    const q = (s) => document.querySelector(s);
    return {
      ruta: location.pathname,
      // La prueba de anonimato: el SDK de Supabase persiste la sesión bajo
      // sb-<ref>-auth-token. Si hay una, el contexto NO era limpio.
      sesionGuardada: Object.keys(localStorage).filter(k => /^sb-.*-auth-token/.test(k)),
      portada: !!q('main.portada-lienzo'),
      escenas: document.querySelectorAll('.pue-escenario .pue-esc').length,
      activa: document.querySelectorAll('.pue-esc.pue-activa').length,
      cta: !!q('.pue-btn-jugar'),
      bienvenida: !!q('main.welcome-screen'),
      entrada: !!q('.entrada-screen'),
      bautizo: !!q('.bautizo-card'),
      textoViejo: /cl\u00e1sico juego de cartas venezolano/.test(document.body.innerText),
    };
  })()`)

  anota('puerta.0 el contexto es anónimo de verdad', R.sesionGuardada.length === 0,
    R.sesionGuardada.length ? `almacén con ${R.sesionGuardada.join(', ')}` : 'sin token de sesión en localStorage')
  anota('puerta.1 la raíz pinta la Portada', R.portada && R.cta,
    `main.portada-lienzo=${R.portada} · .pue-btn-jugar=${R.cta} · ruta ${R.ruta}`)
  anota('puerta.2 el rotor de escenas está vivo', R.escenas === NOMBRES_ESC.length && R.activa === 1,
    `${R.escenas}/${NOMBRES_ESC.length} escenas · ${R.activa} activa`)
  anota('puerta.3 la Bienvenida vieja NO captura al visitante', !R.bienvenida && !R.textoViejo,
    `main.welcome-screen=${R.bienvenida} · texto «El clásico juego…»=${R.textoViejo}`)
  anota('puerta.4 ni la Entrada ni el Bautizo se cuelan', !R.entrada && !R.bautizo,
    `.entrada-screen=${R.entrada} · .bautizo-card=${R.bautizo}`)
  anota('puerta.5 consola limpia al cruzar la puerta', consola.length === 0,
    consola.length ? consola.slice(0, 3).join(' | ') : 'sin errores')

  resultados.bloques.puerta = { ...R, consola }
  await page.screenshot({ path: `${SALIDA}/puerta-1280x800.png` })
  await ctx.close()
}


// ════════════════════════════════════════════════════════════════════════════
// 1.1 · La promesa «sin scroll»  ·  1.2 · El wordmark  ·  1.3 · Geometría
// 1.9 · Consola limpia
// ════════════════════════════════════════════════════════════════════════════
if (hacer('1.1') || hacer('1.2') || hacer('1.3') || hacer('1.9')) {
  resultados.bloques.porViewport = {}
  for (const vp of VIEWPORTS) {
    console.log(`\n── ${vp.etiqueta} (${vp.clase}) ──`)
    const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height } })
    const page = await ctx.newPage()
    const consola = []
    page.on('console', m => { if (m.type() === 'error') consola.push(m.text()) })
    page.on('pageerror', e => consola.push(`pageerror: ${e.message}`))
    await page.goto(URL_LAMINA, { waitUntil: 'networkidle' })
    await page.waitForTimeout(900)   // que asiente la entrada `.sube`

    const R = { viewport: vp.etiqueta, clase: vp.clase }

    // ── 1.1 · sin scroll ────────────────────────────────────────────────────
    const alto = await page.evaluate('window.innerHeight')
    const scrollY = await page.evaluate('document.documentElement.scrollHeight - window.innerHeight')
    if (vp.clase === 'movil-vertical') {
      const btn = await page.evaluate(CAJA('.pue-btn-jugar'))
      const vac = await page.evaluate(CAJA('.pue-cta-vacuna'))
      R['1.1'] = { innerHeight: alto, desbordeDocumento: scrollY, btnJugar: btn, ctaVacuna: vac }
      const okBtn = btn && btn.display !== 'none' && btn.top >= 0 && btn.bottom <= alto
      const okVac = vac && vac.top >= 0 && vac.bottom <= alto
      R['1.1'].veredicto = okBtn && okVac
      anota(`1.1 ${vp.etiqueta}`, R['1.1'].veredicto,
        `JUGAR bottom=${btn ? btn.bottom.toFixed(1) : '—'} · vacuna bottom=${vac ? vac.bottom.toFixed(1) : '—'} · innerHeight=${alto} · desborde=${scrollY}px`)
    } else {
      const tar = await page.evaluate(CAJA('.pue-tarjeta'))
      R['1.1'] = { innerHeight: alto, desbordeDocumento: scrollY, tarjeta: tar }
      R['1.1'].veredicto = !!tar && tar.top >= 0 && tar.bottom <= alto
      anota(`1.1 ${vp.etiqueta}`, R['1.1'].veredicto,
        `tarjeta top=${tar ? tar.top.toFixed(1) : '—'} bottom=${tar ? tar.bottom.toFixed(1) : '—'} · innerHeight=${alto} · desborde=${scrollY}px`)
    }

    // ── 1.2 · el wordmark se auto-verifica ──────────────────────────────────
    const wm = await page.evaluate(`(() => {
      const h = document.querySelector('h1.welcome-title');
      const cs = getComputedStyle(h);
      return {
        ancho: parseFloat(h.style.getPropertyValue('--brillo-ancho')) || null,
        slotDx: parseFloat(h.style.getPropertyValue('--brillo-slot-dx')) || null,
        fontSize: parseFloat(cs.fontSize),
        letterSpacing: cs.letterSpacing,
        fontFamily: cs.fontFamily,
        fontWeight: cs.fontWeight,
        lineHeight: cs.lineHeight,
        wmTrack: cs.getPropertyValue('--wm-track').trim(),
      };
    })()`)
    // Esperado ≈224,84 a 72px y ≈168,22 a 56px → la razón medida/fuente ronda
    // 3,12 y 3,00. Para el escalón compacto de 46px se extrapola proporcional.
    const ESPERADO = { 72: 224.84, 56: 168.22 }
    const esperado = ESPERADO[Math.round(wm.fontSize)] ?? (wm.fontSize * (168.22 / 56))
    const deltaPct = wm.ancho ? Math.abs(wm.ancho - esperado) / esperado * 100 : null
    R['1.2'] = { ...wm, esperado: +esperado.toFixed(2), deltaPct: deltaPct === null ? null : +deltaPct.toFixed(2) }
    R['1.2'].veredicto = deltaPct !== null && deltaPct <= 6
    anota(`1.2 ${vp.etiqueta}`, R['1.2'].veredicto,
      `fs=${wm.fontSize}px track=${wm.wmTrack} · --brillo-ancho=${wm.ancho ? wm.ancho.toFixed(2) : '—'}px (esperado ≈${esperado.toFixed(2)}, Δ=${deltaPct === null ? '—' : deltaPct.toFixed(2) + '%'}) · slot-dx=${wm.slotDx ? wm.slotDx.toFixed(2) : '—'}px · ${wm.fontFamily.split(',')[0]} ${wm.fontWeight}`)

    // ── 1.3 · geometría de las cinco escenas ────────────────────────────────
    const hayEscenario = await page.evaluate(`(() => {
      const e = document.querySelector('.pue-escenario');
      return e && getComputedStyle(e).display !== 'none';
    })()`)
    R['1.3'] = { escenarioVisible: hayEscenario, escenas: [] }
    if (!hayEscenario) {
      anota(`1.3 ${vp.etiqueta}`, true, 'escenario oculto por diseño en este viewport — no aplica')
    } else {
      for (let i = 0; i < 5; i++) {
        // Se espera a la clase `.activa` de la lámina y DESPUÉS a que la escena
        // termine de entrar. Cada una tarda lo suyo y la cifra sale del CSS, no
        // de un número redondo: la 2 revela cinco cartas (300+4×280+500 ms), la
        // 3 remata su trío a 2,6+0,4 s y la 4 posa su héroe a 2,0+0,9 s.
        // Medir antes es medir una escena a medio entrar.
        const ASENTADO = [1600, 2600, 3200, 3200, 1400]
        await esperarEscena(page, i, ASENTADO[i])
        const tinta = await page.evaluate(TINTA_ESCENA)
        const frase = await page.evaluate(CAJA('.pue-frase'))
        const e = { i, nombre: NOMBRES_ESC[i], tinta, frase }
        if (tinta && frase) {
          e.ejeDelta = Math.abs(tinta.cx - (frase.left + frase.right) / 2)
          // Invasión: solape real de las dos cajas (no basta con tocarse).
          const solapaX = tinta.right > frase.left && tinta.left < frase.right
          const solapaY = tinta.bottom > frase.top && tinta.top < frase.bottom
          e.invade = solapaX && solapaY
          e.holguraVertical = frase.top - tinta.bottom
          e.okEje = e.ejeDelta <= EJE_TOPE
          e.okHolgura = e.holguraVertical >= HOLGURA_MINIMA
          e.okInvasion = !e.invade
          e.veredicto = e.okEje && e.okInvasion && e.okHolgura
          anota(`1.3${String.fromCharCode(97)} esc${i + 1} ${NOMBRES_ESC[i]} ${vp.etiqueta}`, e.veredicto,
            `eje Δ=${e.ejeDelta.toFixed(2)}px (≤${EJE_TOPE}) · invade=${e.invade} · holgura frase=${e.holguraVertical.toFixed(1)}px (≥${HOLGURA_MINIMA})`)
        } else {
          e.veredicto = false
          anota(`1.3 esc${i + 1} ${vp.etiqueta}`, false, 'sin tinta medible o sin frase')
        }
        // (c) el aire entre la mano del AJILEI y el marcador, sólo en 360×640
        if (i === 1 && vp.etiqueta === '360x640') {
          const aire = await page.evaluate(`(() => {
            const m = document.querySelector('.pue-mano'), c = document.querySelector('.pue-marcador');
            if (!m || !c) return null;
            const a = m.getBoundingClientRect(), b = c.getBoundingClientRect();
            return { manoBottom:a.bottom, marcadorTop:b.top, aire: b.top - a.bottom };
          })()`)
          e.aireManoMarcador = aire
          e.okAire = !!aire && aire.aire >= 12
          anota('1.3c aire mano↔marcador 360x640', e.okAire,
            `aire=${aire ? aire.aire.toFixed(2) : '—'}px (≥12)`)
        }
        await page.screenshot({ path: `${SALIDA}/esc${i + 1}-${NOMBRES_ESC[i]}-${vp.etiqueta}.png` })
        R['1.3'].escenas.push(e)
      }
    }

    // ── 1.9 · consola ───────────────────────────────────────────────────────
    R['1.9'] = { errores: consola }
    anota(`1.9 ${vp.etiqueta}`, consola.length === 0,
      consola.length ? `${consola.length} error(es): ${consola.slice(0, 3).join(' | ')}` : 'consola limpia')

    await page.screenshot({ path: `${SALIDA}/vista-${vp.etiqueta}.png` })
    resultados.bloques.porViewport[vp.etiqueta] = R
    await ctx.close()
  }
}

// ════════════════════════════════════════════════════════════════════════════
// 1.4 · La hoja móvil (390×844)
// ════════════════════════════════════════════════════════════════════════════
if (hacer('1.4')) {
  console.log('\n── 1.4 · hoja móvil (390×844) ──')
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } })
  const page = await ctx.newPage()
  await page.goto(URL_LAMINA, { waitUntil: 'networkidle' })
  await page.waitForTimeout(800)

  const antes = await page.evaluate(CAJA('.pue-tarjeta'))
  await page.click('.pue-btn-jugar')
  await page.waitForTimeout(700)          // la transición es .35s
  const despues = await page.evaluate(`(() => {
    const t = document.querySelector('.pue-tarjeta'), v = document.querySelector('.pue-velo');
    const e = document.querySelector('.pue-escenario'), f = document.querySelector('.pue-frase');
    const ct = getComputedStyle(t), cv = getComputedStyle(v);
    const r = t.getBoundingClientRect();
    return {
      tarjetaTop: r.top, tarjetaBottom: r.bottom, innerHeight: window.innerHeight,
      bg: ct.backgroundColor,
      veloOpacity: cv.opacity, veloPointerEvents: cv.pointerEvents,
      escenarioVisibility: getComputedStyle(e).visibility,
      fraseVisibility: getComputedStyle(f).visibility,
      cuerpoTieneClase: document.body.classList.contains('hoja-abierta'),
      // ¿quién recibe el toque en el centro del área que el velo cubre?
      enPuntoAlto: (document.elementFromPoint(195, 80) || {}).id || (document.elementFromPoint(195, 80) || {}).className,
    };
  })()`)
  await page.screenshot({ path: `${SALIDA}/hoja-abierta-390x844.png` })

  const subio = despues.tarjetaTop < antes.top
  // Opaco de verdad: rgb(...) sin alfa, y el valor de --surface-modal (#0c1d13).
  const opaco = /^rgb\(\s*12,\s*29,\s*19\s*\)$/.test(despues.bg.replace(/\s+/g, ' '))
  const ocultos = despues.escenarioVisibility === 'hidden' && despues.fraseVisibility === 'hidden'
  const veloVivo = despues.veloOpacity === '1' && despues.veloPointerEvents === 'auto'

  anota('1.4a la tarjeta sube', subio, `top ${antes.top.toFixed(1)} → ${despues.tarjetaTop.toFixed(1)}`)
  anota('1.4b fondo opaco', opaco, `background-color computado = ${despues.bg} (esperado rgb(12, 29, 19) = #0c1d13)`)
  anota('1.4c escenario y frase ocultos', ocultos, `escenario=${despues.escenarioVisibility} · frase=${despues.fraseVisibility}`)
  anota('1.4d el velo recibe los toques', veloVivo, `opacity=${despues.veloOpacity} pointer-events=${despues.veloPointerEvents} · elementFromPoint(195,80)=${despues.enPuntoAlto}`)

  // ── 1.4f · ¿QUIÉN RECIBE EL TOQUE SOBRE LA TARJETA? ─────────────────────
  // Esta medición nació de un defecto real y por eso se queda. La auditoría
  // sondeaba `elementFromPoint(195, 80)` —un punto ALTO, fuera de la tarjeta—
  // para comprobar que el velo estaba vivo, y con eso daba verde… mientras el
  // velo tapaba también el formulario. El `z-index: 1` de `.escena-grid` creaba
  // un contexto de apilado que encerraba el `z-index: 5` de la tarjeta.
  // La pregunta correcta no es «¿el velo recibe los toques?» sino «¿los recibe
  // DONDE debe y no donde no?», así que ahora se pregunta sobre el centro del
  // campo y sobre el centro del botón.
  const alcanzable = await page.evaluate(`(() => {
    const q = (sel) => {
      const el = document.querySelector(sel);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      const e = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
      return e ? (e.id || e.className || e.tagName) : null;
    };
    return { campo: q('#entrada-correo'), boton: q('.pue-tarjeta .puerta-btn') };
  })()`)
  anota('1.4f el formulario recibe los toques, no el velo',
    alcanzable.campo === 'entrada-correo' && /puerta-btn/.test(alcanzable.boton || ''),
    `sobre el campo → ${alcanzable.campo} · sobre el botón → ${alcanzable.boton}`)

  await page.click('.pue-velo', { position: { x: 195, y: 60 }, force: true })
  await page.waitForTimeout(700)
  const cerrada = await page.evaluate(`(() => {
    const t = document.querySelector('.pue-tarjeta').getBoundingClientRect();
    return { top: t.top, innerHeight: window.innerHeight,
             clase: document.body.classList.contains('hoja-abierta') };
  })()`)
  anota('1.4e clic fuera cierra', !cerrada.clase && cerrada.top >= cerrada.innerHeight - 2,
    `hoja-abierta=${cerrada.clase} · tarjeta top=${cerrada.top.toFixed(1)} vs innerHeight=${cerrada.innerHeight}`)

  resultados.bloques['1.4'] = { antes, despues, cerrada, subio, opaco, ocultos, veloVivo }
  await ctx.close()
}

// ════════════════════════════════════════════════════════════════════════════
// 1.5 · El selector de idioma
// ════════════════════════════════════════════════════════════════════════════
if (hacer('1.5')) {
  console.log('\n── 1.5 · selector de idioma ──')
  resultados.bloques['1.5'] = {}
  for (const vp of [VIEWPORTS[0], VIEWPORTS[1]]) {
    const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height } })
    const page = await ctx.newPage()
    await page.goto(URL_LAMINA, { waitUntil: 'networkidle' })
    await page.waitForTimeout(700)

    const visibleGlobo = await page.evaluate(CAJA('.pue-idioma-globo'))
    await page.click('.pue-idioma-globo')
    await page.waitForTimeout(300)
    const abierta = await page.evaluate(`(() => {
      const c = document.querySelector('.pue-idioma');
      const l = c.querySelector('.pue-idioma-lista');
      const items = [...c.querySelectorAll('.pue-idioma-item')].map(b => ({
        texto: b.textContent.trim(),
        check: !!b.querySelector('.pue-idioma-check'),
        pronto: !!b.querySelector('.pue-idioma-pronto'),
      }));
      const r = l.getBoundingClientRect();
      return { clase: c.classList.contains('pue-abierta'), display: getComputedStyle(l).display,
               items, dentroDelViewport: r.right <= window.innerWidth + 1 && r.top >= -1 };
    })()`)
    await page.screenshot({ path: `${SALIDA}/idioma-abierto-${vp.etiqueta}.png` })

    const cinco = abierta.items.length === 5
    const espanolActivo = abierta.items[0] && abierta.items[0].check && /Español/.test(abierta.items[0].texto)
    const cuatroPronto = abierta.items.filter(i => i.pronto).length === 4
    anota(`1.5 abre ${vp.etiqueta}`, abierta.clase && abierta.display === 'block',
      `clase=${abierta.clase} display=${abierta.display} · dentro del viewport=${abierta.dentroDelViewport}`)
    anota(`1.5 contenido ${vp.etiqueta}`, cinco && espanolActivo && cuatroPronto,
      `${abierta.items.length} entradas · Español con ✓=${espanolActivo} · «Pronto»=${abierta.items.filter(i => i.pronto).length}`)

    await page.mouse.click(Math.floor(vp.width / 2), Math.floor(vp.height * 0.75))
    await page.waitForTimeout(300)
    const cerrada = await page.evaluate(`document.querySelector('.pue-idioma').classList.contains('pue-abierta')`)
    anota(`1.5 clic fuera cierra ${vp.etiqueta}`, cerrada === false, `abierta=${cerrada}`)

    resultados.bloques['1.5'][vp.etiqueta] = { visibleGlobo, abierta, cerrada }
    await ctx.close()
  }
}

// ════════════════════════════════════════════════════════════════════════════
// 1.6 · Movimiento reducido
// ════════════════════════════════════════════════════════════════════════════
if (hacer('1.6')) {
  console.log('\n── 1.6 · prefers-reduced-motion: reduce ──')
  const ctx = await browser.newContext({
    viewport: { width: 1920, height: 1080 }, reducedMotion: 'reduce',
  })
  const page = await ctx.newPage()
  await page.goto(URL_LAMINA, { waitUntil: 'networkidle' })
  await page.waitForTimeout(2500)

  const rm = await page.evaluate(`(() => {
    const corriendo = document.getAnimations()
      .filter(a => a.playState === 'running')
      .map(a => (a.animationName || (a.effect && a.effect.getKeyframes && 'css') || 'anim'));
    const esc1 = document.querySelector('.pue-esc');
    const imgs = [...esc1.querySelectorAll('.pue-abanico img')].map(i => ({
      opacity: getComputedStyle(i).opacity, transform: getComputedStyle(i).transform,
    }));
    const btn = document.querySelector('.pue-btn-jugar');
    const brillo = btn ? getComputedStyle(btn, '::after').display : 'sin boton';
    return {
      mediaCoincide: matchMedia('(prefers-reduced-motion: reduce)').matches,
      animacionesCorriendo: corriendo,
      esc1Activa: esc1.classList.contains('pue-activa'),
      esc1Opacity: getComputedStyle(esc1).opacity,
      imgs, brilloBoton: brillo,
      indiceActiva: ${INDICE_ACTIVA},
      perezosasCargadas: document.querySelectorAll('img[data-src]').length === 0,
    };
  })()`)
  await page.screenshot({ path: `${SALIDA}/reducido-1920x1080.png` })

  const estatica = rm.animacionesCorriendo.length === 0
  const completa = rm.esc1Activa && rm.esc1Opacity === '1' && rm.imgs.every(i => parseFloat(i.opacity) > 0.98)
  const sinBrillo = rm.brilloBoton === 'none'
  anota('1.6a media query aplicada', rm.mediaCoincide, `matchMedia=${rm.mediaCoincide}`)
  anota('1.6b ninguna animación corre', estatica, `corriendo=[${rm.animacionesCorriendo.join(', ')}]`)
  anota('1.6c escena 1 estática y completa', completa,
    `activa=${rm.esc1Activa} opacity=${rm.esc1Opacity} · 5 cartas con opacity=${rm.imgs.map(i => i.opacity).join('/')}`)
  anota('1.6d el brillo del botón no se pinta', sinBrillo, `.btn-jugar::after display=${rm.brilloBoton}`)
  anota('1.6e el rotor no avanza', rm.indiceActiva === 0, `índice tras 2,5s = ${rm.indiceActiva}`)

  resultados.bloques['1.6'] = rm
  await ctx.close()
}

// ════════════════════════════════════════════════════════════════════════════
// 1.7 · La pausa de cortesía
// ════════════════════════════════════════════════════════════════════════════
if (hacer('1.7')) {
  console.log('\n── 1.7 · pausa de cortesía (foco en el correo) ──')
  const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 } })
  const page = await ctx.newPage()
  await page.goto(URL_LAMINA, { waitUntil: 'networkidle' })
  await page.waitForTimeout(500)

  await page.focus('#entrada-correo')
  const iAlFocar = await page.evaluate(INDICE_ACTIVA)
  // Más que la escena más larga (4,5 s) por margen: si el rotor siguiera vivo,
  // en 6 s habría cambiado sí o sí.
  await page.waitForTimeout(6000)
  const iTrasEspera = await page.evaluate(INDICE_ACTIVA)
  const enfocado = await page.evaluate(`document.activeElement && document.activeElement.id`)
  anota('1.7a el índice no avanza con el foco dentro', iAlFocar === iTrasEspera,
    `índice ${iAlFocar} → ${iTrasEspera} tras 6 s · activeElement=#${enfocado}`)

  // Y al salir el foco, el rotor tiene que resucitar.
  await page.evaluate(`document.getElementById('entrada-correo').blur()`)
  await page.waitForTimeout(5200)
  const iTrasSoltar = await page.evaluate(INDICE_ACTIVA)
  anota('1.7b el rotor resucita al soltar el foco', iTrasSoltar !== iTrasEspera,
    `índice ${iTrasEspera} → ${iTrasSoltar} tras soltar`)

  resultados.bloques['1.7'] = { iAlFocar, iTrasEspera, iTrasSoltar, enfocado }
  await ctx.close()
}

// ════════════════════════════════════════════════════════════════════════════
// 2.4 · O1 · las tres cifras reservadas, RE-MEDIDAS sobre la caja de la portada
// ════════════════════════════════════════════════════════════════════════════
// La ficha (§2.4) lo condiciona: «si la caja del formulario cambió un píxel».
// Cambió. La tarjeta de la Entrada es `max-width: 520px` con 36px de relleno
// lateral (448 de contenido); la de la portada, 500 con 38 (424). Veinticuatro
// píxeles menos de ancho son un renglón más en el lema y en el aviso, así que
// las reservas de la Entrada no valen aquí.
//
// SE MIDEN, NO SE CALCULAN. Es el método de la casa y la lección que
// `entrada.css` dejó escrita: el cálculo a mano daba 266 y se quedaba 52,13
// corto. Aquí se neutraliza la reserva (`min-height: 0`), se deja que cada paso
// tome su alto natural y se lee la caja viva.
//
// Y PARA LLEGAR AL PASO DOS SE INTERCEPTA LA RED, no se falsea el estado: el
// formulario avanza porque `signInWithOtp` respondió que sí, que es exactamente
// como avanza en producción. Una medición sobre un componente forzado a mano
// mide un árbol que nadie va a ver.
if (hacer('2.4')) {
  console.log('\n── 2.4 · O1 · reservas del formulario en la caja de la portada ──')
  resultados.bloques['2.4'] = {}
  const CELDAS = [
    { etiqueta: '1920x1080', width: 1920, height: 1080 },
    { etiqueta: '1440x850',  width: 1440, height: 850 },
    { etiqueta: '390x844',   width: 390,  height: 844 },
    { etiqueta: '375x812',   width: 375,  height: 812 },
    { etiqueta: '360x640',   width: 360,  height: 640 },
    { etiqueta: '320x568',   width: 320,  height: 568 },
  ]
  const SIN_RESERVA = `(() => {
    const st = document.createElement('style');
    st.id = 'o1-sin-reserva';
    st.textContent = '.entrada-cuerpo{min-height:0 !important}';
    document.head.appendChild(st);
  })()`
  // Alto natural del cuerpo: `scrollHeight` y no la caja de contorno, porque con
  // la reserva a cero la caja mide lo que mide el contenido y son lo mismo — pero
  // scrollHeight sobrevive a que alguien le ponga un `overflow` mañana.
  const ALTO_CUERPO = `(() => {
    const c = document.querySelector('.entrada-cuerpo');
    if (!c) return null;
    const r = c.getBoundingClientRect();
    const lema = document.querySelector('.pue-tarjeta .puerta-lema');
    const aviso = document.querySelector('.pue-tarjeta .puerta-aviso');
    const cuenta = document.querySelector('.pue-tarjeta .entrada-cuenta');
    const alto = (e) => e ? e.getBoundingClientRect().height : null;
    return {
      cuerpo: c.scrollHeight, caja: r.height,
      lema: alto(lema), aviso: alto(aviso),
      avisoMin: aviso ? parseFloat(getComputedStyle(aviso).minHeight) : null,
      cuenta: cuenta ? cuenta.getBoundingClientRect().width : null,
      cuentaMin: cuenta ? parseFloat(getComputedStyle(cuenta).minWidth) : null,
      cuentaTexto: cuenta ? cuenta.textContent : null,
      tarjetaAncho: document.querySelector('.pue-tarjeta').getBoundingClientRect().width,
    };
  })()`

  for (const c of CELDAS) {
    const ctx = await browser.newContext({ viewport: { width: c.width, height: c.height } })
    const page = await ctx.newPage()
    // La red de Supabase se contesta aquí: 200 y cuerpo vacío es lo que
    // `signInWithOtp` necesita para resolver con `error: null`. Se intercepta en
    // vez de falsear el estado del componente porque lo que se quiere medir es el
    // árbol que el jugador va a ver, y ése sólo aparece si el envío salió bien.
    await page.route('**/auth/v1/otp**', route =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '{}' }))
    await page.goto(URL_LAMINA, { waitUntil: 'networkidle' })
    // En vertical la tarjeta es una hoja que vive fuera de pantalla hasta que
    // alguien pulsa JUGAR: sin abrirla no hay caja que medir.
    const esHoja = await page.evaluate(`getComputedStyle(document.querySelector('.pue-tarjeta')).position === 'fixed'`)
    if (esHoja) { await page.click('.pue-btn-jugar'); await page.waitForTimeout(600) }
    await page.waitForTimeout(150)

    // ── Pasada 1 · CON la reserva puesta: lo que O1 promete es Δ=0 ──────────
    const alturaTarjeta = `document.querySelector('.pue-tarjeta').getBoundingClientRect().height`
    await page.fill('#entrada-correo', 'victor@ejemplo.com')
    const cajaCorreo = await page.evaluate(alturaTarjeta)
    // Se envía el FORMULARIO, no se pulsa el botón: en vertical el velo cubre el
    // cuadro entero y Playwright ve —con razón— que el clic no llegaría.
    // `requestSubmit` dispara el mismo `onSubmit` que el botón.
    await page.evaluate(`document.querySelector('.pue-tarjeta form').requestSubmit()`)
    await page.waitForSelector('#entrada-codigo', { timeout: 8000 })
    await page.waitForTimeout(250)
    const cajaCodigo = await page.evaluate(alturaTarjeta)
    const salto = Math.abs(cajaCodigo - cajaCorreo)
    anota(`2.4a ${c.etiqueta} Δ de alto entre pasos`, salto <= 1,
      `tarjeta correo ${cajaCorreo.toFixed(2)} → código ${cajaCodigo.toFixed(2)} · Δ=${salto.toFixed(2)}px (≤1)`)

    // ── Pasada 2 · SIN reserva: el alto natural de cada paso ────────────────
    // Se vuelve al paso del correo por la puerta de siempre —«Cambiar correo»—
    // para no inventar una transición que el jugador no tiene.
    await page.evaluate(`[...document.querySelectorAll('.pue-tarjeta .puerta-link')].pop().click()`)
    await page.waitForSelector('#entrada-correo', { timeout: 8000 })
    await page.evaluate(SIN_RESERVA)
    await page.waitForTimeout(150)
    const paso1 = await page.evaluate(ALTO_CUERPO)

    await page.fill('#entrada-correo', 'victor@ejemplo.com')
    await page.evaluate(`document.querySelector('.pue-tarjeta form').requestSubmit()`)
    await page.waitForSelector('#entrada-codigo', { timeout: 8000 })
    await page.waitForTimeout(250)
    const paso2 = await page.evaluate(ALTO_CUERPO)

    // El aviso en su peor caso: el mensaje más largo que el formulario emite.
    await page.fill('#entrada-codigo', '123')
    await page.evaluate(`document.querySelector('.pue-tarjeta form').requestSubmit()`)
    await page.waitForTimeout(150)
    const conAviso = await page.evaluate(ALTO_CUERPO)

    const maximo = Math.max(paso1.cuerpo, paso2.cuerpo, conAviso.cuerpo)
    const reserva = Math.ceil(maximo)
    const declarada = await page.evaluate(`(() => {
      const st = document.getElementById('o1-sin-reserva'); if (st) st.remove();
      const v = parseFloat(getComputedStyle(document.querySelector('.entrada-cuerpo')).minHeight);
      return v;
    })()`)
    anota(`2.4b ${c.etiqueta} reserva del cuerpo`, declarada >= reserva,
      `tarjeta ${paso1.tarjetaAncho.toFixed(1)}px · correo ${paso1.cuerpo.toFixed(2)} · ` +
      `código ${paso2.cuerpo.toFixed(2)} · con aviso ${conAviso.cuerpo.toFixed(2)} → ` +
      `hace falta ${reserva} · declarada ${declarada}`)
    anota(`2.4c ${c.etiqueta} ranura de aviso`, conAviso.aviso <= conAviso.avisoMin + 0.5,
      `alto real ${conAviso.aviso.toFixed(2)} · reserva ${conAviso.avisoMin} ` +
      `(${conAviso.aviso > conAviso.avisoMin + 0.5 ? 'DESBORDA' : 'cabe'})`)
    anota(`2.4d ${c.etiqueta} cuenta regresiva`, paso2.cuenta <= paso2.cuentaMin + 0.01,
      `«${paso2.cuentaTexto}» ocupa ${paso2.cuenta === null ? '—' : paso2.cuenta.toFixed(2)}px · ` +
      `reserva ${paso2.cuentaMin}px · holgura ${(paso2.cuentaMin - paso2.cuenta).toFixed(2)}px`)

    resultados.bloques['2.4'][c.etiqueta] = { cajaCorreo, cajaCodigo, salto, paso1, paso2, conAviso, maximo, reserva, declarada }
    await ctx.close()
  }
}

// ════════════════════════════════════════════════════════════════════════════
// 2.5 · DELTA 1 · el gesto del ganador, medido
// ════════════════════════════════════════════════════════════════════════════
// La ficha lo sella con cinco condiciones y las cinco se comprueban con números:
// 900ms · ease-out · UNA iteración · box-shadow que de verdad se mueve · sin
// filete de 1px · y las cinco cartas a scale(1.2) al completarse.
if (hacer('2.5')) {
  console.log('\n── 2.5 · el gesto del ganador (delta 1) ──')
  const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 } })
  const page = await ctx.newPage()
  await page.goto(URL_LAMINA, { waitUntil: 'networkidle' })

  // Antes del «51» el pulso NO existe en el árbol: ésa es la mecánica que hace
  // que suene una vez y no en bucle.
  await esperarEscena(page, 1, 200)
  const antes = await page.evaluate(`document.querySelectorAll('.pue-vc-pulso').length`)
  // POR-FID · el halo de la lámina, ANTES del «51»: apagado, y la caja de la mano.
  const HALO = `(() => {
    const m = document.querySelector('.pue-mano');
    if (!m) return null;
    const cs = getComputedStyle(m, '::before');
    const r = m.getBoundingClientRect();
    return { opacity: cs.opacity, borde: cs.borderTopWidth, colorBorde: cs.borderTopColor,
             sombra: cs.boxShadow, anim: cs.animationName, iter: cs.animationIterationCount,
             caja: [r.left, r.top, r.width, r.height].map(n => Math.round(n * 100) / 100) };
  })()`
  const haloAntes = await page.evaluate(HALO)

  // El «51» cae en 0,3 + 4×0,28 + 0,5 = 1,92 s desde que la escena se activa.
  await page.waitForTimeout(1900)
  const pulso = await page.evaluate(`(() => {
    const e = document.querySelector('.pue-vc-pulso');
    if (!e) return { existe: false };
    const cs = getComputedStyle(e);
    // El easing se lee del ESTILO COMPUTADO y no de getTiming().easing: esa
    // propiedad describe el temporizado del EFECTO —que por omision es
    // lineal— mientras que animation-timing-function se aplica por fotograma
    // clave. Preguntando a la API se leia «linear» sobre una regla que dice
    // ease-out, y la sonda cantaba un rojo que no existia.
    // (Sin acentos graves aqui dentro: esto vive en una plantilla de JS y un
    //  acento grave la cierra a media frase.)
    const anims = e.getAnimations().map(a => ({
      nombre: a.animationName,
      dur: a.effect.getTiming().duration,
      iter: a.effect.getTiming().iterations,
      easing: cs.animationTimingFunction,
      relleno: cs.animationFillMode,
    }));
    return {
      existe: true, cuantos: document.querySelectorAll('.pue-vc-pulso').length,
      borde: cs.borderTopWidth, sombra: cs.boxShadow, anims,
      // Las cinco cartas, y su transform computada: el énfasis del showdown.
      cartas: [...document.querySelectorAll('.pue-carta')].map(c => getComputedStyle(c).transform),
      gana: !!document.querySelector('.pue-mano.pue-gana'),
    };
  })()`)
  await page.waitForTimeout(120)
  const sombra2 = await page.evaluate(`(() => {
    const e = document.querySelector('.pue-vc-pulso');
    return e ? getComputedStyle(e).boxShadow : null;
  })()`)
  // Las cartas se miden CON LA TRANSICIÓN TERMINADA. La primera pasada las leyó
  // a los 1900ms —justo cuando el escalado arrancaba— y devolvió matrices a
  // medio camino: un rojo que sólo decía que la sonda llegó pronto.
  await page.waitForTimeout(400)
  // Sin expresion regular a proposito: dentro de una plantilla de JS un
  // \( se come su barra y el navegador recibe un grupo sin cerrar. Con
  // indexOf y parseFloat no hay nada que escapar.
  const cartasFin = await page.evaluate(`(() => [...document.querySelectorAll('.pue-carta')].map(c => { const t = getComputedStyle(c).transform; return t.indexOf('matrix') === 0 ? parseFloat(t.slice(t.indexOf('(') + 1)) : null; }))()`)
  await page.screenshot({ path: `${SALIDA}/ganador-1920x1080.png` })

  const a = (pulso.anims || [])[0] || {}
  anota('2.5a el pulso no existe antes del «51»', antes === 0, `nodos antes = ${antes}`)
  anota('2.5b un solo pulso, con la animación del juego', pulso.existe && pulso.cuantos === 1 && a.nombre === 'pue-vcPulso',
    `nodos=${pulso.cuantos} · animación=${a.nombre}`)
  anota('2.5c 900ms · ease-out · UNA iteración', a.dur === 900 && a.iter === 1 && a.easing === 'ease-out',
    `dur=${a.dur} · iteraciones=${a.iter} · easing=${a.easing} · fill=${a.relleno}`)
  anota('2.5d el box-shadow se mueve de verdad', pulso.sombra !== sombra2 && pulso.sombra !== 'none',
    `t0 ${pulso.sombra} → t0+120ms ${sombra2}`)
  anota('2.5e sin filete de 1px', pulso.borde === '0px', `border-top-width = ${pulso.borde}`)
  const escaladas = cartasFin.filter(v => v !== null && Math.abs(v - 1.2) < 0.01).length
  anota('2.5f las cinco cartas a scale(1.2)', escaladas === 5 && pulso.gana,
    `escalas ${cartasFin.map(v => v === null ? '—' : v.toFixed(3)).join('/')} · .pue-gana=${pulso.gana}`)

  // ── POR-FID · el halo de la lámina (PUE_lamina_v1.7.html:360-370), medido ──
  // Apagado antes del «51»; al ganar, opacidad 1 (o respirando hacia 0,65),
  // filete de 1px al 55 % del oro de marca y dos sombras doradas; respira en
  // bucle (`pue-halo-pulso`, infinite). O1: la caja de `.pue-mano` no cambia
  // ni un píxel entre antes y después. Oro único: el filete NO es oro sólido
  // — su alfa se lee del color computado y tiene que ser menor que 1.
  const haloDespues = await page.evaluate(HALO)
  // O1 se mide CON Y SIN el pseudo en el MISMO estado (ganando): la caja de la
  // mano cambia legítimamente al ganar por el `gap` 10→20 del DELTA 1, así que
  // comparar antes/después del «51» mediría el delta, no el halo. Se apaga el
  // pseudo con una regla inyectada, se mide, y se retira la regla.
  const haloApagado = await page.evaluate(`(() => {
    const st = document.createElement('style'); st.id = 'sin-halo';
    st.textContent = '.portada-lienzo .pue-mano::before { display: none; }';
    document.head.appendChild(st);
    const m = document.querySelector('.pue-mano'); const r = m.getBoundingClientRect();
    const cs = getComputedStyle(m, '::before'); const display = cs.display;
    st.remove();
    return { display, caja: [r.left, r.top, r.width, r.height].map(n => Math.round(n * 100) / 100) };
  })()`)
  const alfaBorde = haloDespues ? parseFloat((haloDespues.colorBorde.match(/,\s*([\d.]+)\)$/) || [, '1'])[1]) : null
  const haloOk = !!haloAntes && !!haloDespues
    && parseFloat(haloAntes.opacity) === 0
    && parseFloat(haloDespues.opacity) >= 0.65
    && haloDespues.borde === '1px' && haloDespues.sombra !== 'none'
    && haloDespues.anim === 'pue-halo-pulso' && haloDespues.iter === 'infinite'
  anota('2.5h el halo de la lámina envuelve la mano al ganar (1:1, respirando)', haloOk,
    haloDespues ? `opacity ${haloAntes && haloAntes.opacity}→${haloDespues.opacity} · filete ${haloDespues.borde} · anim ${haloDespues.anim}×${haloDespues.iter} · sombra ${haloDespues.sombra.slice(0, 60)}…` : 'sin .pue-mano')
  anota('2.5i O1 · la caja de la mano es la misma con el halo y sin él', !!haloDespues && haloApagado.display === 'none' && JSON.stringify(haloApagado.caja) === JSON.stringify(haloDespues.caja),
    haloDespues ? `con halo ${JSON.stringify(haloDespues.caja)} · sin halo ${JSON.stringify(haloApagado.caja)}` : '—')
  anota('2.5j oro único · el filete del halo no es oro sólido', alfaBorde !== null && alfaBorde < 1,
    `border-top-color = ${haloDespues ? haloDespues.colorBorde : '—'} (alfa ${alfaBorde})`)

  // Y no se repite: al volver a la escena 2 tiene que nacer OTRA vez, no seguir.
  await esperarEscena(page, 0, 100)
  const entreMedias = await page.evaluate(`document.querySelectorAll('.pue-vc-pulso').length`)
  anota('2.5g se desmonta al cambiar de escena', entreMedias === 0, `nodos fuera de la escena 2 = ${entreMedias}`)

  resultados.bloques['2.5'] = { antes, pulso, sombra2, entreMedias }
  await ctx.close()
}

// ════════════════════════════════════════════════════════════════════════════
// 1.8 · Bitácora de red · arranque en frío
// ════════════════════════════════════════════════════════════════════════════
if (hacer('1.8')) {
  console.log('\n── 1.8 · bitácora de red (arranque en frío, 1920×1080) ──')
  const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 } })
  const page = await ctx.newPage()
  const bitacora = []
  let t0 = 0
  page.on('request', r => {
    bitacora.push({ url: r.url(), tipo: r.resourceType(), tPeticion: Date.now() - t0, bytes: null })
  })
  // ── SE PESA LO QUE VIAJA, NO LO QUE OCUPA ─────────────────────────────────
  // `vite preview` sirve sin comprimir, así que el `content-length` de un
  // bundle es su tamaño EN CRUDO: 550 KiB de JS que en el cable de verdad son
  // 164. Cloudflare Workers comprime todo lo comprimible, y el jugador de gama
  // media con datos móviles —terreno declarado de esta campaña— paga los bytes
  // que viajan, no los que ocupan. Así que se comprime aquí con zlib y se
  // reportan LAS DOS cifras: nadie tiene que fiarse de una conversión de cabeza.
  // Lo que ya nace comprimido (webp, mp3, fuentes) se cuenta tal cual — volver a
  // gziparlo no ahorra nada y en la práctica engorda.
  const YA_COMPRIMIDO = /\.(webp|jpe?g|png|gif|mp3|mp4|woff2?|avif)(\?|$)/i
  page.on('response', async r => {
    const e = bitacora.find(b => b.url === r.url() && b.bytes === null)
    if (!e) return
    e.estado = r.status()
    e.tRespuesta = Date.now() - t0
    try {
      const cuerpo = await r.body()
      e.bytes = cuerpo.length
      e.cable = YA_COMPRIMIDO.test(r.url()) ? cuerpo.length : gzipSync(cuerpo, { level: 9 }).length
    } catch {
      const h = r.headers()
      e.bytes = h['content-length'] ? parseInt(h['content-length'], 10) : -1
      e.cable = e.bytes
    }
  })
  t0 = Date.now()
  await page.goto(URL_LAMINA, { waitUntil: 'load' })
  await page.waitForTimeout(5000)      // pasa holgadamente el umbral de 2,5 s

  const corto = (u) => u.replace(BASE, '').replace(/\?.*$/, '')

  // EL CORTE NO ES UN RELOJ REDONDO: es el PRIMER PINTADO CON CONTENIDO, que es
  // el instante que la ficha nombra («hasta la portada pintada»). La ventana fija
  // de 2 s que usaba la auditoría metía dentro el rasgueo, que está diferido a
  // propósito UN SEGUNDO DESPUÉS de pintar — habría contado como camino crítico
  // justamente lo que existe para no serlo.
  const fcp = await page.evaluate(`(() => {
    const e = performance.getEntriesByName('first-contentful-paint')[0];
    return e ? Math.round(e.startTime) : null;
  })()`)
  const corte = fcp === null ? 2000 : fcp

  const perezosas = bitacora.filter(b => /uno_copa|tres_copa|cinco_copa|diez_copa|doce_copa|mesapc|mesav/.test(b.url))
  const criticas = bitacora.filter(b => b.tPeticion <= corte)
  const despues = bitacora.filter(b => b.tPeticion > corte && !perezosas.includes(b))

  const todasPerezosas = perezosas.length > 0 && perezosas.every(b => b.tPeticion >= 2400)
  anota('1.8a las caras y las capturas llegan perezosas', todasPerezosas,
    perezosas.map(b => `${corto(b.url).split('/').pop()}@${b.tPeticion}ms`).join(' · ') || 'ninguna pedida')

  const suma = (lista, campo) => lista.reduce((acc, b) => acc + (b[campo] > 0 ? b[campo] : 0), 0)
  const criticoCable = suma(criticas, 'cable')
  const criticoCrudo = suma(criticas, 'bytes')
  anota('1.8b camino crítico hasta el primer pintado', criticoCable <= TECHO_CRITICO_KIB * 1024,
    `FCP=${fcp}ms · ${criticas.length} recursos · ${(criticoCable / 1024).toFixed(1)} KiB en el cable ` +
    `(${(criticoCrudo / 1024).toFixed(1)} KiB en crudo) · techo ${TECHO_CRITICO_KIB} KiB`)
  anota('1.8c lo que llega DESPUÉS de pintar', true,
    `diferido ${(suma(despues, 'cable') / 1024).toFixed(1)} KiB (rasgueo incluido) · ` +
    `perezoso ${(suma(perezosas, 'cable') / 1024).toFixed(1)} KiB`)

  console.log('\n  bitácora completa · cable = gzip nivel 9, salvo lo que ya nace comprimido:')
  for (const b of bitacora.sort((a, z) => a.tPeticion - z.tPeticion)) {
    const marca = b.tPeticion <= corte ? 'CRÍTICO' : (perezosas.includes(b) ? 'perezoso' : 'diferido')
    console.log(`    ${String(b.tPeticion).padStart(5)}ms  ` +
      `${String(b.cable > 0 ? (b.cable / 1024).toFixed(1) : '—').padStart(7)} cable  ` +
      `${String(b.bytes > 0 ? (b.bytes / 1024).toFixed(1) : '—').padStart(7)} crudo  ` +
      `${marca.padEnd(8)} ${b.tipo.padEnd(10)} ${corto(b.url)}`)
  }

  resultados.bloques['1.8'] = { fcp, bitacora, perezosas, criticoCable, criticoCrudo, todasPerezosas }
  await ctx.close()
}

// ── Cierre ──────────────────────────────────────────────────────────────────
await browser.close()
resultados.fallos = fallos
writeFileSync(`${SALIDA}/diagPUE.json`, JSON.stringify(resultados, null, 2))

console.log(`\n${'═'.repeat(72)}`)
if (fallos.length === 0) {
  console.log('TODO VERDE — ninguna medición falló')
} else {
  console.log(`${fallos.length} MEDICIÓN(ES) EN ROJO:`)
  for (const f of fallos) console.log(`  · ${f}`)
}
console.log(`\nJSON: ${SALIDA}/diagPUE.json`)
