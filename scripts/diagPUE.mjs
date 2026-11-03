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
//       node scripts/diagPUE.mjs mon        (MON-2: el render 3D con alfa de la escena 4 obedece al rotor)
//       node scripts/diagPUE.mjs cap [--sellar]  (CAP-1: las tres maestras de la mesa; NO entra en `todo`)
//       node scripts/diagPUE.mjs dis             (DIS-1: los aparatos renderizados de la escena 5, Edge y WebKit; SÍ entra en `todo`)
//       node scripts/diagPUE.mjs bie             (BIE-1: qué suena en la puerta y el «Cargando», con la red de Supabase simulada; SÍ entra en `todo`)
//       node scripts/diagPUE.mjs voz2 [--control=contain|nowrap|capa] [--celdas=…] [--sin-burbuja]  (VOZ-2: la frase del óvalo recortada y desplegada; NO entra en `todo`; voz2.burbuja usa además el 5173, VOZ2_DEV)
//       node scripts/diagPUE.mjs mesa            (ARN-3d: del toque de «Jugar» a la mesa pintada, con 4G lento; vara de tiempo: corre SOLA; NO entra en `todo`)
//
// ARN-3a · el arnés COMPILA (vite build) y levanta su propio `vite preview` en
// 4173 —o `--puerto=N`— dentro de su proceso; `voz2` levanta además un
// servidor de desarrollo con bypass en 5173 —o `--puerto-aux=N`— para la
// burbuja. `--sin-build` mide el dist/ que haya; `--servidor=externo` usa los
// servidores levantados a mano (`PUE_BASE`, `VOZ2_DEV`). Puerto ocupado: se
// niega y dice quién lo ocupa. Navegador: Chromium de playwright-core
// (`ARNES_CANAL=msedge` = contraste); la WebKit de `dis` no cambia. Sale con
// 0 (todo verde), 1 (alguna medición en rojo) o 2 (error de instrumento).
import { webkit } from 'playwright-core'
import {
  instalarSalidas, opcionesDelArnes, navegadorArnes, servidorArnes, terminar, fallarInstrumento,
  ErrorInstrumento, codigoDeSalida, aislarNavegador,
} from './arnes/comun.mjs'
// ARN-3c-ii · D9 · la mediana de 3 de `dis` (lo puro).
import { mayoriaDePuertas } from './arnes/varas.mjs'
// ARN-4 A5 · repetir ante un rojo de foto.
import { conRepeticion } from './arnes/repetir.mjs'
import { mkdirSync, writeFileSync, copyFileSync, existsSync, readFileSync } from 'node:fs'
import {
  VISTAS_CAP, SEMILLA_CAP, MANO_CAP, POZO_CAP, SALDO_CAP, MESA_CAP, CRONO_CAP, RECETA_CAP, FASE_RESPIRACION_MS,
  TOLERANCIA_CAP, pasadaCap, compararPng, equivalentes, derivarComoGenerador, contextoCap,
} from './cap/capMesa.mjs'
import { recorrerRuta } from './rutaMesa.mjs'
import { contextoBie, marca, porGesto, HUECO, vidaIndicador, SONDA_INDICADOR } from './bie/bieRed.mjs'

// CAP-1 Addendum 1 §2.3 · lo más que la og-image (caja dorada de mesah
// CUBIERTA a 1200×630) puede recortar por lado, en px CSS. En 1a se midieron 4,6.
const OG_RECORTE_MAX_CSS = 6
import { gzipSync, inflateSync } from 'node:zlib'

instalarSalidas()
const OPC = opcionesDelArnes()
const EXTERNO = OPC.servidor === 'externo'
const BASE = EXTERNO ? (process.env.PUE_BASE || 'http://localhost:4173') : `http://localhost:${OPC.puerto || 4173}`
const URL_LAMINA = `${BASE}/`
const SALIDA = 'capturas-pue'

// ── MON-2.1 · los dos assets de la moneda ya no viven en `public/` ──────────
// Pasaron a `src/assets/`, así que Vite les pone hash de contenido y ninguna
// ruta literal vale: `/heptacoin-poster.webp` es ahora
// `/assets/heptacoin-poster-XXXXXXXX.webp`. Se reconocen por su nombre base,
// que es lo estable. Un arnés que compara contra una ruta que ya no existe no
// falla: da VERDE en falso, que es peor.
const ES_POSTER  = (u) => /heptacoin-poster(-[A-Za-z0-9_-]+)?\.webp/.test(u || '')
const ES_ANIMADO = (u) => /heptacoin(-[A-Za-z0-9_-]+)?\.webp/.test(u || '') && !ES_POSTER(u)
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
let anotadas = 0   // ARN-3a · una corrida que no anotó nada no puede salir verde
function anota(id, ok, detalle) {
  anotadas++
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
//
// DIS-1 · En la escena 5 la tinta es la SILUETA de cada render, no su <img>:
// la imagen lleva margen transparente y la sombra de contacto, y medir la caja
// entera daría una holgura con la frase que no es la que se ve. La silueta sale
// del JSON del render (`web.silueta_opaca`, px del derivado) escalada a la caja
// REAL de la imagen. Quien movió la ruta recablea el metro (ficha Fase 2 §2.6).
const WEB_DIS = Object.fromEntries(['laptop', 'telefono'].map((ap) => {
  const w = JSON.parse(readFileSync(`maestras/dis1/${ap}.json`, 'utf8')).web
  return [ap, { clase: `pue-dis-${ap}`, tamano: w.tamano, silueta: w.silueta_opaca, tinta: w.tinta_con_sombra }]
}))
const TINTA_ESCENA = `(() => {
  const esc = document.querySelector('.pue-esc.pue-activa');
  if (!esc) return null;
  const DIS = ${JSON.stringify(Object.values(WEB_DIS))};
  const piezas = [...esc.querySelectorAll('img, .pregunta span, .marcador')];
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity, n = 0;
  const dentro = [];
  for (const p of piezas) {
    if (!p.checkVisibility({ opacityProperty: true, visibilityProperty: true,
                             contentVisibilityAuto: true })) continue;
    let r = p.getBoundingClientRect();
    // MON-2 · el <img> de la escena 4 es el cuadro 16:9 exacto: su caja de
    // elemento ES el cuadro pintado, no hace falta descontar letterbox.
    if (r.width < 1 || r.height < 1) continue;
    const d = DIS.find((x) => p.classList.contains(x.clase));
    if (d) {
      const fx = r.width / d.tamano[0], fy = r.height / d.tamano[1], s = d.silueta;
      r = { left: r.left + s[0] * fx, top: r.top + s[1] * fy,
            right: r.left + (s[0] + s[2]) * fx, bottom: r.top + (s[1] + s[3]) * fy };
    }
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
// `cap` escribe maestras y tarda seis pasadas de mesa: sólo corre si se pide por
// su nombre, nunca dentro de `todo`.
const hacerSolo = (id) => modo === id

// ARN-3a · D5 · un modo que no existe no medía nada y salía «TODO VERDE».
const MODOS_PUE = ['todo', 'puerta', '1.1', '1.2', '1.3', '1.4', '1.5', '1.6', '1.7', '1.8', '1.9', '2.4', '2.5', 'mon', 'dis', 'bie', 'cap', 'voz2', 'mesa']
if (!MODOS_PUE.includes(modo)) {
  await fallarInstrumento(new ErrorInstrumento(`modo desconocido: «${modo}». Los modos son: ${MODOS_PUE.join(', ')}`))
}

// ── ARN-3a · el terreno: servidor(es) y navegador ───────────────────────────
// Antes había aquí una guarda que pedía «npm run build && npx vite preview»:
// ahora lo hace el arnés (D6/D7), contra el bundle de ESTE árbol, y cualquier
// fallo del terreno es de instrumento (código 2). La guarda de «responde» la
// hace `servidorArnes` también con `--servidor=externo`.
// La pasada de la burbuja de voz2 necesita `?apu=`, que solo existe en DEV.
const VOZ2_BURBUJA = modo === 'voz2' && !process.argv.some((a) => a.startsWith('--control=')) && !process.argv.includes('--sin-burbuja')
let NAV
try {
  await servidorArnes({ tipo: 'preview', puerto: OPC.puerto || 4173, build: OPC.build, externo: EXTERNO, base: EXTERNO ? BASE : null })
  if (VOZ2_BURBUJA && !EXTERNO) {
    const dev = await servidorArnes({ tipo: 'dev', puerto: OPC.puertoAux || 5173, bypass: true })
    process.env.VOZ2_DEV = dev.base
  }
  NAV = await navegadorArnes()
} catch (e) {
  await fallarInstrumento(e)
}
const browser = NAV.browser

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
      // LOB-1 · el lobby es la pantalla NUEVA del otro lado de la puerta. Se
      // mira aquí por la misma razón que la Bienvenida vieja: lo que este bloque
      // demuestra es que un visitante ANÓNIMO no ve nada de lo que hay dentro.
      lobby: !!q('main.lobby'),
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
  // ── LOB-1 · el punto que la campaña añade ────────────────────────────────
  // `puerta.3` sigue midiendo lo que decía y no cambia: el lobby NO reutiliza
  // `main.welcome-screen` ni el lema «El clásico juego de cartas venezolano»
  // (verificado en Fase 1). Pero desde LOB-1 hay una pantalla MÁS al otro lado
  // de la puerta, y una aserción que sólo vigila la que ya no se usa vigila el
  // pasado. Éste mira la que sí existe.
  anota('puerta.4 el lobby NO captura al visitante anónimo', !R.lobby,
    `main.lobby=${R.lobby}`)
  anota('puerta.5 ni la Entrada ni el Bautizo se cuelan', !R.entrada && !R.bautizo,
    `.entrada-screen=${R.entrada} · .bautizo-card=${R.bautizo}`)
  anota('puerta.6 consola limpia al cruzar la puerta', consola.length === 0,
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
    // GUARDA DE NULO (LOB-1). Hasta esta tanda la línea siguiente hacía
    // `getComputedStyle(h)` sobre el resultado crudo del `querySelector`: si el
    // wordmark desaparecía de la Portada, el modo entero moría con un
    // `TypeError` y no con un veredicto rojo — o sea, la campaña que rompiera el
    // contrato del wordmark se enteraría por una traza, no por una medida.
    // Es la única edición de esta fase fuera de lo estrictamente LOB-1, y se
    // justifica porque LOB-1 toca ese contrato: `h1.welcome-title` deja de estar
    // en la primera pantalla post-login y la hoja que lo define (`welcome.css`)
    // pasa a colgar de un import que ya no es el de su dueño original.
    const wm = await page.evaluate(`(() => {
      const h = document.querySelector('h1.welcome-title');
      if (!h) return { ausente: true };
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
    if (wm.ausente) {
      // Rojo con mensaje, que es lo que un arnés debe dar: la Portada SIN
      // wordmark es un defecto medible, no una excepción de JavaScript.
      R['1.2'] = { ausente: true, veredicto: false }
      anota(`1.2 ${vp.etiqueta}`, false,
        'h1.welcome-title NO existe en la Portada — el contrato del wordmark se rompió')
    } else {
    const ESPERADO = { 72: 224.84, 56: 168.22 }
    const esperado = ESPERADO[Math.round(wm.fontSize)] ?? (wm.fontSize * (168.22 / 56))
    const deltaPct = wm.ancho ? Math.abs(wm.ancho - esperado) / esperado * 100 : null
    R['1.2'] = { ...wm, esperado: +esperado.toFixed(2), deltaPct: deltaPct === null ? null : +deltaPct.toFixed(2) }
    R['1.2'].veredicto = deltaPct !== null && deltaPct <= 6
    anota(`1.2 ${vp.etiqueta}`, R['1.2'].veredicto,
      `fs=${wm.fontSize}px track=${wm.wmTrack} · --brillo-ancho=${wm.ancho ? wm.ancho.toFixed(2) : '—'}px (esperado ≈${esperado.toFixed(2)}, Δ=${deltaPct === null ? '—' : deltaPct.toFixed(2) + '%'}) · slot-dx=${wm.slotDx ? wm.slotDx.toFixed(2) : '—'}px · ${wm.fontFamily.split(',')[0]} ${wm.fontWeight}`)
    }

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
  const pedidosAnimado = []
  page.on('request', r => { if (ES_ANIMADO(r.url())) pedidosAnimado.push(r.url()) })
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
      // MON-2 · el render de la escena 4 con quietud: el póster puesto (con
      // quietud lo pesado entra YA) y pintado; el animado ni se pide.
      render: (() => {
        const i = document.querySelector('img.pue-heptacoin');
        if (!i) return null;
        return { src: (i.getAttribute('src') || '').replace(location.origin, ''), display: getComputedStyle(i).display,
                 complete: i.complete, nw: i.naturalWidth, nh: i.naturalHeight };
      })(),
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
  // MON-2 · con quietud sólo el póster: puesto, decodificado y pintado; el
  // animado no viaja (ni un byte: la precarga se salta con quietud).
  const v = rm.render
  const renderQuieto = !!v && ES_POSTER(v.src) && v.complete && v.nw > 0 && v.display !== 'none' && pedidosAnimado.length === 0
  anota('1.6f el render de la escena 4 no anima: póster quieto, animado sin pedir', renderQuieto,
    v ? `src=${v.src} · complete=${v.complete} · ${v.nw}×${v.nh} · display=${v.display} · peticiones del animado=${pedidosAnimado.length}` : 'sin <img>')

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

  // ── 2.4e · ARN-4 B7 · el código pegado entra entero (INV-80) ──────────────
  // Se pega de verdad, portapapeles y Ctrl+V: `fill` se salta el `maxLength`, que
  // es justo lo que cortaba «123 456» antes de que llegara al filtro de dígitos.
  const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 } })
  await ctx.grantPermissions(['clipboard-read', 'clipboard-write'])
  const page = await ctx.newPage()
  await page.route('**/auth/v1/otp**', route =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '{}' }))
  await page.goto(URL_LAMINA, { waitUntil: 'networkidle' })
  await page.fill('#entrada-correo', 'victor@ejemplo.com')
  await page.evaluate(`document.querySelector('.pue-tarjeta form').requestSubmit()`)
  await page.waitForSelector('#entrada-codigo', { timeout: 8000 })
  for (const pegado of ['123 456', '123-456']) {
    await page.fill('#entrada-codigo', '')
    await page.evaluate(`navigator.clipboard.writeText(${JSON.stringify(pegado)})`)
    await page.focus('#entrada-codigo')
    await page.keyboard.press('Control+V')
    await page.waitForTimeout(100)
    const valor = await page.inputValue('#entrada-codigo')
    anota(`2.4e pegar «${pegado}»`, valor === '123456', `el campo queda en «${valor}» (debe ser «123456»)`)
  }
  await ctx.close()
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
// mon · MON-2 · el render 3D con alfa de la escena 4 obedece al rotor
// ════════════════════════════════════════════════════════════════════════════
// El asset es un <img> con un WebP animado (alfa real), no un <video>: no hay
// play(), ni currentTime, ni `ended`. Lo que hay es lo que el compositor pinta,
// y eso se mide con PÍXELES: un punto del cuadro donde la héroe reposa (oro
// sólo desde el cuadro ~87) y otro en la base de la pila (oro desde el ~12).
// Con ellos se distingue «cuadro 0» (verde de la portada en los dos), «corre»
// (pila en oro, héroe en verde), «reposo» (los dos en oro) y «póster» (los dos
// en oro con la escena fuera). Las cifras de la geometría vienen de BANDA ::
// (heptacoin_alfa.py): pila x 0,24–0,49 · y 0,41–0,85 desde abajo; héroe en
// reposo x 0,475–0,765 · y 0,10–0,39 desde abajo.
// Y la sonda de fondo único, que es el criterio de Victor: en la escena 4
// activa, un píxel pegado al límite del cuadro POR DENTRO, en zona sin moneda,
// y el pegado POR FUERA deben ser idénticos — y, para que la filigrana de la
// portada (que hace distintos dos píxeles vecinos aunque no haya asset) no
// falsee el veredicto, se mide además que el asset no cambie NINGUNO de los
// dos: mismo píxel con el <img> puesto y con el <img> oculto.
const pixel1x1 = (buf) => {
  const idat = []; let o = 8
  while (o < buf.length) {
    const len = buf.readUInt32BE(o); const t = buf.toString('latin1', o + 4, o + 8)
    if (t === 'IDAT') idat.push(buf.subarray(o + 8, o + 8 + len)); o += 12 + len
  }
  const raw = inflateSync(Buffer.concat(idat)); return [raw[1], raw[2], raw[3]]
}
// Oro o su brillo bajo el barrido (213,213,129): rojo alto y azul muy por debajo.
// El verde de la portada (25,68,41) y el póster vacío nunca cumplen las dos.
const esOro = ([r, g, b]) => r >= 150 && r - b >= 50
const esVerde = ([r, g, b]) => g > r && g > b
if (hacer('mon')) {
  console.log('\n── mon · el render con alfa de la escena 4 y el rotor (1920×1080) ──')
  const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 } })
  const page = await ctx.newPage()
  const red = []
  let t0 = Date.now()
  page.on('request', r => { if (/heptacoin/.test(r.url())) red.push({ url: r.url().replace(BASE, ''), t: Date.now() - t0 }) })
  await page.goto(URL_LAMINA, { waitUntil: 'networkidle' })
  await page.waitForTimeout(900)

  const CAJAS = `(() => {
    const c = (s) => { const e = document.querySelector(s); if (!e) return null;
      const r = e.getBoundingClientRect(); return [r.left, r.top, r.width, r.height].map(n => Math.round(n * 100) / 100); };
    return { escenario: c('.pue-escenario'), frase: c('.pue-frase'), hero: c('.pue-hero'),
             tarjeta: c('.pue-tarjeta') || c('.pue-btn-jugar'), render: c('.pue-render-monedas'), cuadro: c('img.pue-heptacoin') };
  })()`
  const IMG = `(() => {
    const i = document.querySelector('img.pue-heptacoin');
    if (!i) return null;
    const r = i.getBoundingClientRect();
    return { tag: i.tagName, src: (i.getAttribute('src') || '').replace(location.origin, ''), alt: i.getAttribute('alt'),
             oculta: i.getAttribute('aria-hidden'), decoding: i.getAttribute('decoding'), complete: i.complete,
             nw: i.naturalWidth, nh: i.naturalHeight, caja: [r.left, r.top, r.width, r.height].map(n => Math.round(n * 100) / 100) };
  })()`
  const animados = () => red.filter(r => ES_ANIMADO(r.url))
  const px = async (x, y) => pixel1x1(await page.screenshot({ clip: { x: Math.round(x), y: Math.round(y), width: 1, height: 1 } }))
  const puntos = (caja) => {
    const [x, y, w, h] = caja
    return { pila: [x + 0.365 * w, y + (1 - 0.45) * h], heroe: [x + 0.62 * w, y + (1 - 0.246) * h] }
  }

  const antes = await page.evaluate(CAJAS)
  const enReposo = await page.evaluate(IMG)
  anota('mon.0 el <img> existe: alt vacío, aria-hidden, decoding async, y sin fuente antes de la política de lo pesado',
    !!enReposo && enReposo.tag === 'IMG' && enReposo.alt === '' && enReposo.oculta === 'true' && enReposo.decoding === 'async' && enReposo.src === '',
    enReposo ? `alt="${enReposo.alt}" aria-hidden=${enReposo.oculta} decoding=${enReposo.decoding} src="${enReposo.src}" a 0,9 s` : 'sin <img>')

  // ── La precarga de los 2,5 s ──────────────────────────────────────────────
  await page.waitForTimeout(3000)   // 0,9 + 3,0 ≈ 3,9 s: la precarga ya salió
  const precarga = animados()
  const conPoster = await page.evaluate(IMG)
  anota('mon.1 el animado se pide en la banda de los 2,5 s, una sola vez, y el póster ya está puesto',
    precarga.length === 1 && precarga[0].t >= 2400 && !!conPoster && ES_POSTER(conPoster.src),
    `${precarga.map(r => `${r.url}@${r.t}ms`).join(' · ') || 'ninguna petición del animado'} · src=${conPoster && conPoster.src} · ${conPoster && conPoster.nw}×${conPoster && conPoster.nh}`)

  // ── Primera activación ────────────────────────────────────────────────────
  await esperarEscena(page, 3, 0)
  const tActiva = Date.now() - t0
  const alActivar = await page.evaluate(IMG)
  anota('mon.3 al activarse la escena el <img> ya lleva el animado precargado (blob), sin nueva petición',
    !!alActivar && /^blob:/.test(alActivar.src) && animados().length === 1,
    alActivar ? `src=${alActivar.src.slice(0, 40)} · peticiones del animado hasta la activación (${tActiva}ms): ${animados().length}` : 'sin <img>')
  const P = puntos(alActivar.caja)
  await page.waitForTimeout(150)
  const c0 = { pila: await px(...P.pila), heroe: await px(...P.heroe) }
  anota('mon.2a arranca desde el cuadro 0: a +0,15 s el cuadro está vacío (ni pila ni héroe)',
    esVerde(c0.pila) && esVerde(c0.heroe) && !esOro(c0.pila) && !esOro(c0.heroe),
    `pila=${c0.pila} · héroe=${c0.heroe}`)
  await page.waitForTimeout(1050)
  const c1 = { pila: await px(...P.pila), heroe: await px(...P.heroe) }
  anota('mon.2b corre: a +1,2 s la pila ya está y la héroe aún no', esOro(c1.pila) && !esOro(c1.heroe),
    `pila=${c1.pila} · héroe=${c1.heroe}`)
  const durante = await page.evaluate(CAJAS)
  const alCorrer = await page.evaluate(IMG)
  // El asset nace a 616×346: el peldaño de escala de la escalera de peso (Bloque
  // 0.4 de MON-2), 1,4× el ancho CSS del cuadro en escritorio y 2,7× en móvil.
  // Se exige 16:9 exacto en la caja y en el asset, y que el asset nunca se
  // AMPLÍE: al menos el ancho CSS de la caja más grande (440 px).
  anota('mon.4 la caja del <img> es el cuadro 16:9 exacto y el asset (16:9) no se amplía (≥ el ancho de la caja)',
    !!alCorrer && Math.abs(alCorrer.caja[2] / alCorrer.caja[3] - 16 / 9) < 0.01 && Math.abs(alCorrer.nw / alCorrer.nh - 16 / 9) < 0.01 && alCorrer.nw >= alCorrer.caja[2],
    alCorrer ? `caja=${JSON.stringify(alCorrer.caja)} · natural ${alCorrer.nw}×${alCorrer.nh} (${(alCorrer.nw / alCorrer.caja[2]).toFixed(2)}×)` : '—')

  // ── Reposo y fin de la ventana ────────────────────────────────────────────
  // tiempos.json (MON-1): reposo en el cuadro 87 = 2,9 s; el tramo D es el
  // barrido sobre la moneda quieta. A +3,1 s la héroe tiene que estar de cara.
  await page.waitForTimeout(1900)   // 0,15 + 1,05 + 1,9 = 3,1 s
  const c2 = { pila: await px(...P.pila), heroe: await px(...P.heroe) }
  anota('mon.5 a +3,1 s la moneda está en reposo, de cara (≥ 2,9 s)', esOro(c2.pila) && esOro(c2.heroe),
    `pila=${c2.pila} · héroe=${c2.heroe}`)

  // ── Sonda de fondo único ──────────────────────────────────────────────────
  // Seis puntos pegados al límite del cuadro por DENTRO (2px) en zonas sin
  // moneda, y sus vecinos por FUERA (2px). Con el <img> puesto y oculto.
  const [cx, cy, cw, ch] = alCorrer.caja
  const pares = {
    'sup-izq': [[cx + cw * 0.10, cy + 2], [cx + cw * 0.10, cy - 2]],
    'sup-der': [[cx + cw * 0.90, cy + 2], [cx + cw * 0.90, cy - 2]],
    'der-medio': [[cx + cw - 2, cy + ch * 0.5], [cx + cw + 2, cy + ch * 0.5]],
    'inf-der': [[cx + cw * 0.90, cy + ch - 2], [cx + cw * 0.90, cy + ch + 2]],
    'inf-izq': [[cx + cw * 0.10, cy + ch - 2], [cx + cw * 0.10, cy + ch + 2]],
    'izq-medio': [[cx + 2, cy + ch * 0.5], [cx - 2, cy + ch * 0.5]],
  }
  const conAsset = {}
  for (const [k, [d, f]] of Object.entries(pares)) conAsset[k] = [await px(...d), await px(...f)]
  await page.evaluate(`document.querySelector('img.pue-heptacoin').style.visibility = 'hidden'`)
  const sinAsset = {}
  for (const [k, [d, f]] of Object.entries(pares)) sinAsset[k] = [await px(...d), await px(...f)]
  await page.evaluate(`document.querySelector('img.pue-heptacoin').style.visibility = ''`)
  const dmax = (a, b) => Math.max(...a.map((v, i) => Math.abs(v - b[i])))
  const fondoUnico = Object.keys(pares).every(k => dmax(conAsset[k][0], sinAsset[k][0]) === 0 && dmax(conAsset[k][1], sinAsset[k][1]) === 0)
  const paresIguales = Object.keys(pares).filter(k => dmax(conAsset[k][0], conAsset[k][1]) === 0).length
  anota('mon.10 fondo único: el asset no cambia ni un píxel pegado a su límite, por dentro ni por fuera (6 puntos)', fondoUnico,
    Object.keys(pares).map(k => `${k}: dentro ${conAsset[k][0]} / fuera ${conAsset[k][1]} (Δ asset ${dmax(conAsset[k][0], sinAsset[k][0])}/${dmax(conAsset[k][1], sinAsset[k][1])})`).join(' · ')
    + ` · pares dentro=fuera idénticos: ${paresIguales}/6 (los demás difieren por la filigrana, medido sin asset)`)

  const indiceTras = await page.evaluate(INDICE_ACTIVA)
  await esperarEscena(page, 4, 200)
  const fuera = await page.evaluate(IMG)
  anota('mon.6 fuera de la escena vuelve al póster', !!fuera && ES_POSTER(fuera.src),
    fuera ? `src=${fuera.src} · escena activa tras la sonda: ${indiceTras}` : '—')
  const despues = await page.evaluate(CAJAS)

  // ── O1: nada se movió ─────────────────────────────────────────────────────
  const igual = (a, b) => JSON.stringify(a) === JSON.stringify(b)
  const quietas = ['escenario', 'frase', 'hero', 'tarjeta', 'render'].every(k => igual(antes[k], durante[k]) && igual(antes[k], despues[k]))
  anota('mon.7 O1 · escenario, frase, héroe, tarjeta y caja del render no se mueven antes/durante/después', quietas,
    ['escenario', 'frase', 'hero', 'tarjeta', 'render'].map(k => `${k}=${JSON.stringify(antes[k])}${igual(antes[k], durante[k]) && igual(antes[k], despues[k]) ? '' : ' ≠ ' + JSON.stringify(durante[k]) + '/' + JSON.stringify(despues[k])}`).join(' · '))

  // ── Segunda activación: rebobina ──────────────────────────────────────────
  await esperarEscena(page, 0, 0)
  await esperarEscena(page, 3, 0)
  const t2 = Date.now() - t0
  const segunda = await page.evaluate(IMG)
  await page.waitForTimeout(150)
  const c3 = { pila: await px(...P.pila), heroe: await px(...P.heroe) }
  await page.waitForTimeout(1050)
  const c4 = { pila: await px(...P.pila), heroe: await px(...P.heroe) }
  anota('mon.8 en la segunda activación rebobina al cuadro 0 con una URL de objeto nueva y vuelve a correr',
    !!segunda && /^blob:/.test(segunda.src) && segunda.src !== alActivar.src && esVerde(c3.pila) && !esOro(c3.pila) && !esOro(c3.heroe) && esOro(c4.pila) && !esOro(c4.heroe),
    `src=${segunda && segunda.src.slice(0, 40)} (≠ primera: ${!!segunda && segunda.src !== alActivar.src}) · +0,15 s pila=${c3.pila} héroe=${c3.heroe} · +1,2 s pila=${c4.pila} héroe=${c4.heroe} (activación 2 a ${t2}ms)`)
  const pedidosTotal = animados()
  anota('mon.9 una sola petición del animado en dos ciclos: ni al activar ni al rebobinar', pedidosTotal.length === 1,
    pedidosTotal.map(r => `${r.url}@${r.t}ms`).join(' · ') || 'ninguna')

  await page.screenshot({ path: `${SALIDA}/mon-esc4-1920x1080.png` })
  resultados.bloques.mon = { antes, durante, despues, enReposo, conPoster, alActivar, c0, c1, c2, c3, c4, conAsset, sinAsset, fuera, segunda, red, tActiva, t2 }
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
  // justamente lo que existe para no serlo. (BIE-1: el sonido diferido de la
  // puerta es ahora el clic de los botones, con el mismo segundo de espera.)
  const fcp = await page.evaluate(`(() => {
    const e = performance.getEntriesByName('first-contentful-paint')[0];
    return e ? Math.round(e.startTime) : null;
  })()`)
  const corte = fcp === null ? 2000 : fcp

  // MON-INT · el póster del render entra en la lista de lo perezoso: viaja con
  // la política de los 2,5 s, igual que las caras y las capturas de mesa.
  // DIS-1 · las capturas planas de la escena 5 (`mesapc`/`mesav`) dejaron paso a
  // los dos renders con la captura horneada: son ELLOS los que tienen que viajar
  // perezosos. Una expresión con los nombres viejos ya no casaría con nada y
  // daría verde en falso.
  const perezosas = bitacora.filter(b => /uno_copa|tres_copa|cinco_copa|diez_copa|doce_copa|dis_laptop|dis_telefono|heptacoin-poster/.test(b.url))
  const criticas = bitacora.filter(b => b.tPeticion <= corte)
  const despues = bitacora.filter(b => b.tPeticion > corte && !perezosas.includes(b))

  const todasPerezosas = perezosas.length > 0 && perezosas.every(b => b.tPeticion >= 2400)
  anota('1.8a las caras, los aparatos y el póster llegan perezosos', todasPerezosas,
    perezosas.map(b => `${corto(b.url).split('/').pop()}@${b.tPeticion}ms`).join(' · ') || 'ninguna pedida')

  // MON-2 · ni un byte del animado antes del primer pintado: no está en ningún
  // `src` del marcado; sólo lo pide la precarga de los 2,5 s. Se listan las
  // peticiones que hubiera, con su instante, para que el rojo diga cuándo.
  const videos = bitacora.filter(b => ES_ANIMADO(b.url))
  const videosCriticos = videos.filter(b => b.tPeticion <= corte)
  anota('1.8d el WebP animado no viaja antes del primer pintado', videosCriticos.length === 0,
    videos.length ? videos.map(b => `${corto(b.url).split('/').pop()}@${b.tPeticion}ms`).join(' · ')
                  : `ninguna petición del animado en ${5000}ms (FCP=${fcp}ms)`)
  // La precarga sellada (POR-FID, heredada por MON-2): UNA petición del
  // animado, en la banda de los 2,5 s (≥2400 ms, como las caras y el póster).
  anota('1.8e el animado se precarga en la banda de los 2,5 s, una sola vez',
    videos.length === 1 && videos[0].tPeticion >= 2400,
    videos.length ? videos.map(b => `${corto(b.url).split('/').pop()}@${b.tPeticion}ms · ${(b.cable / 1024).toFixed(1)} KiB`).join(' · ')
                  : 'ninguna petición del animado en 5000ms')

  const suma = (lista, campo) => lista.reduce((acc, b) => acc + (b[campo] > 0 ? b[campo] : 0), 0)
  const criticoCable = suma(criticas, 'cable')
  const criticoCrudo = suma(criticas, 'bytes')
  // El techo NO se re-selló nunca (decisión del rector en CAP-1): el rojo se vio
  // desde CAP-1 hasta que ARN-3d sacó la mesa a su propio chunk (B11) y el
  // camino crítico bajó de 222,0 a ~168,8 KiB. Ya no hay rojo conocido: un rojo
  // aquí desde hoy es un hallazgo (¿alguien volvió a importar `GameTable` de
  // forma estática? Lo vigila `scripts/testMesaDiferida.test.js`).
  const dentroCritico = criticoCable <= TECHO_CRITICO_KIB * 1024
  anota('1.8b camino crítico hasta el primer pintado', dentroCritico,
    `FCP=${fcp}ms · ${criticas.length} recursos · ${(criticoCable / 1024).toFixed(1)} KiB en el cable ` +
    `(${(criticoCrudo / 1024).toFixed(1)} KiB en crudo) · techo ${TECHO_CRITICO_KIB} KiB`)
  anota('1.8c lo que llega DESPUÉS de pintar', true,
    `diferido ${(suma(despues, 'cable') / 1024).toFixed(1)} KiB (clic de la puerta incluido) · ` +
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

// ════════════════════════════════════════════════════════════════════════════
// mesa · ARN-3d · del toque de «Jugar» a la mesa pintada
// ════════════════════════════════════════════════════════════════════════════
// Rector: AJILEI_ARN-3d_v1.0.md §1.2 (Fase 0 §B4, la sonda `_sondaEntrada`).
// Cuando la mesa viaja en su propio chunk, la entrada a la mesa puede costar
// una descarga y, mal hecha, un parpadeo: con un `Suspense` local React deja
// ~330 ms la raíz VACÍA aunque el chunk ya esté en memoria (H3d-2). Este modo
// lo mide como lo vería el jugador, con red de móvil.
//
// LA RED, ANOTADA (Fase 0 §B4): «4G lento» de DevTools por CDP,
// `Network.emulateNetworkConditions` con latencia 562,5 ms, bajada 180 000 B/s
// y subida 84 375 B/s, en cada página. Sesión simulada (`contextoCap`) a
// 1366×768, un contexto nuevo por repetición (caché vacía). Mesa 5, básico.
//
// QUÉ SE MIDE, DENTRO DE LA PÁGINA (un MutationObserver desde antes del HTML):
//   · del `pointerdown` en el CTA de Retar a dos rAF después de que
//     `.game-table` entra en el DOM («mesa pintada»);
//   · los intervalos con `#root` VACÍO tras el toque;
//   · los intervalos de HUECO tras el toque: ni Retar (`main.sal`) ni la mesa.
//     Es lo que el jugador llamaría «pantalla vacía» aunque la raíz tuviera un
//     `fallback` dentro.
// Escenario A: la precarga ya terminó (red en reposo y 500 ms más). Escenario
// B: entrada inmediata, la ruta del arnés (~150 ms del lobby al CTA).
//
// LAS PUERTAS (D16: no se aflojan; vara de tiempo: corre SOLA, y un rojo con
// otros arneses vivos no cuenta):
//   mesa.a       A: toque → mesa pintada ≤ 60 ms y 0 ms en blanco (ni vacío ni hueco)
//   mesa.b       B: 0 ms en blanco; el tiempo se informa, sin techo
//   mesa.portada el chunk de la mesa no se pide antes del FCP de la Portada
// Cada escenario son 3 repeticiones y el veredicto es la mayoría (D9).
//
// «SIN CHUNK» SE DICE, NO SE SUPONE. El chunk de la mesa es el que Vite nombra
// por su módulo (`GameTable-*.js|css`). Si en toda la corrida no se pide
// ninguno y aun así la mesa se pinta, la mesa vino en el paquete principal: las
// puertas lo dicen con la lista de scripts que se cargaron, y salen verdes por
// eso y no por no haber medido nada.
const MESA_RED = Object.freeze({ offline: false, latency: 562.5, downloadThroughput: 180000, uploadThroughput: 84375 })
const MESA_REPS = 3
const MESA_TECHO_A_MS = 60
const ES_CHUNK_MESA = (u) => /\/GameTable-[A-Za-z0-9_-]+\.(js|css)(\?|$)/.test(u || '')
const VIGIA_MESA = () => {
  window.__mesaT = { vacios: [], huecos: [] }
  const T = window.__mesaT
  document.addEventListener('pointerdown', (e) => {
    if (T.toque == null && e.target.closest?.('main.sal [data-accion="cta"]')) T.toque = performance.now()
  }, true)
  const mira = () => {
    const root = document.getElementById('root')
    if (!root || T.toque == null) return
    const t = performance.now()
    const vacio = root.children.length === 0
    const hueco = !document.querySelector('main.sal') && !document.querySelector('.game-table')
    if (vacio && T.vacioDesde == null) T.vacioDesde = t
    if (!vacio && T.vacioDesde != null) { T.vacios.push(t - T.vacioDesde); T.vacioDesde = null }
    if (hueco && T.huecoDesde == null) T.huecoDesde = t
    if (!hueco && T.huecoDesde != null) { T.huecos.push(t - T.huecoDesde); T.huecoDesde = null }
    if (T.mesa == null && document.querySelector('.game-table')) {
      T.mesa = t
      requestAnimationFrame(() => requestAnimationFrame(() => { T.pintada = performance.now() }))
    }
  }
  new MutationObserver(mira).observe(document, { subtree: true, childList: true })
}

async function redLenta(ctx, page) {
  const cdp = await ctx.newCDPSession(page)
  await cdp.send('Network.enable')
  await cdp.send('Network.emulateNetworkConditions', MESA_RED)
}

// Una entrada a la mesa, en un contexto nuevo. No juzga: devuelve la medida.
async function entradaMesa(esc) {
  const { ctx, page, errores } = await contextoCap(browser, { w: 1366, h: 768, dpr: 1 }, BASE)
  try {
    await ctx.addInitScript(VIGIA_MESA)
    await redLenta(ctx, page)
    const t0 = Date.now()
    await page.goto(URL_LAMINA, { waitUntil: 'load', timeout: 120000 })
    await page.waitForSelector('main.lobby [data-accion="jugar-ia"]', { timeout: 120000 })
    const lobbyMs = Date.now() - t0
    if (esc === 'A') {
      // La precarga terminada: la red en reposo (con 4G lento, nada puede seguir
      // bajando) y medio segundo para que el módulo se evalúe.
      await page.waitForLoadState('networkidle', { timeout: 120000 })
      await page.waitForTimeout(500)
    }
    await recorrerRuta(page, 5, 'basico', 0)
    await page.waitForFunction(() => window.__mesaT.pintada != null, null, { timeout: 60000 })
    const T = await page.evaluate(() => window.__mesaT)
    const res = await page.evaluate(() => performance.getEntriesByType('resource')
      .filter((e) => /\.(js|css)(\?|$)/.test(e.name))
      .map((e) => ({ n: e.name.replace(location.origin, ''), ini: Math.round(e.startTime), fin: Math.round(e.responseEnd) })))
    const chunk = res.filter((r) => ES_CHUNK_MESA(r.n))
    const vacio = T.vacios.reduce((a, x) => a + x, 0) + (T.vacioDesde != null ? Infinity : 0)
    const hueco = T.huecos.reduce((a, x) => a + x, 0) + (T.huecoDesde != null ? Infinity : 0)
    return {
      esc, lobbyMs,
      toqueAPintada: Math.round(T.pintada - T.toque),
      vacioMs: Math.round(vacio), huecoMs: Math.round(hueco),
      chunk, chunkListoAlToque: chunk.length ? chunk.every((c) => c.fin > 0 && c.fin < T.toque) : null,
      scripts: res.filter((r) => /\.js(\?|$)/.test(r.n)).map((r) => r.n.split('/').pop()),
      errores: errores.slice(0, 3),
    }
  } finally {
    await ctx.close()
  }
}

// La Portada, como la ve un visitante anónimo: ¿se pide la mesa antes del FCP?
async function portadaMesa() {
  const ctx = await browser.newContext({ viewport: { width: 1366, height: 768 } })
  try {
    const page = await ctx.newPage()
    await redLenta(ctx, page)
    await page.goto(URL_LAMINA, { waitUntil: 'load', timeout: 120000 })
    await page.waitForSelector('main.portada-lienzo', { timeout: 120000 })
    // Tres segundos más de Portada: una precarga mal colgada (en `App`, que tiene
    // `screen` en 'lobby' también aquí, H3d-1) tiene tiempo de delatarse.
    await page.waitForTimeout(3000)
    return await page.evaluate(() => {
      const fcp = performance.getEntriesByName('first-contentful-paint')[0]
      const res = performance.getEntriesByType('resource').map((e) => ({ n: e.name.replace(location.origin, ''), ini: Math.round(e.startTime) }))
      return { fcp: fcp ? Math.round(fcp.startTime) : null, res, portada: !!document.querySelector('main.portada-lienzo') }
    })
  } finally {
    await ctx.close()
  }
}

if (hacerSolo('mesa')) {
  console.log(`\n── mesa · ARN-3d · toque → mesa pintada · 4G lento (latencia ${MESA_RED.latency} ms, ${MESA_RED.downloadThroughput} B/s ↓, ${MESA_RED.uploadThroughput} B/s ↑) · ${MESA_REPS} repeticiones por escenario ──`)
  const filas = { A: [], B: [] }
  for (const esc of ['A', 'B']) {
    for (let r = 0; r < MESA_REPS; r++) {
      const f = await entradaMesa(esc)
      filas[esc].push(f)
      console.log(`  ${esc}${r + 1} · toque→pintada ${f.toqueAPintada} ms · vacío ${f.vacioMs} ms · hueco ${f.huecoMs} ms · lobby ${f.lobbyMs} ms · ` +
        (f.chunk.length ? `chunk ${f.chunk.map((c) => `${c.n.split('/').pop()}@${c.ini}–${c.fin}`).join(' + ')} · listo al toque: ${f.chunkListoAlToque ? 'sí' : 'NO'}` : `sin chunk · scripts: ${f.scripts.join(', ')}`) +
        (f.errores.length ? ` · errores: ${f.errores.join(' | ')}` : ''))
    }
  }
  const portadas = []
  for (let r = 0; r < MESA_REPS; r++) {
    const p = await portadaMesa()
    portadas.push(p)
    const pedidas = p.res.filter((x) => ES_CHUNK_MESA(x.n))
    console.log(`  portada${r + 1} · FCP ${p.fcp} ms · chunk de la mesa: ${pedidas.length ? pedidas.map((x) => `${x.n.split('/').pop()}@${x.ini}`).join(' + ') : 'no se pide'}`)
  }

  // ¿Hay chunk? Lo dice la corrida: si alguna entrada lo pidió, existe.
  const hayChunk = [...filas.A, ...filas.B].some((f) => f.chunk.length > 0)
  const sinChunk = (f) => `sin chunk: mesa en el paquete principal (${f.scripts.join(', ')})`
  const blanco = (f) => f.vacioMs === 0 && f.huecoMs === 0
  const repsA = filas.A.map((f) => [{
    clave: 'mesa.a', ok: f.toqueAPintada <= MESA_TECHO_A_MS && blanco(f),
    det: `${f.toqueAPintada} ms (≤ ${MESA_TECHO_A_MS}) · vacío ${f.vacioMs} · hueco ${f.huecoMs} · ` +
      (f.chunk.length ? `chunk listo al toque: ${f.chunkListoAlToque ? 'sí' : 'NO'}` : sinChunk(f)),
  }])
  const repsB = filas.B.map((f) => [{
    clave: 'mesa.b', ok: blanco(f),
    det: `vacío ${f.vacioMs} · hueco ${f.huecoMs} · ${f.toqueAPintada} ms (se informa) · ` +
      (f.chunk.length ? `chunk listo al toque: ${f.chunkListoAlToque ? 'sí' : 'no'}` : sinChunk(f)),
  }])
  const repsP = portadas.map((p) => {
    const antes = p.res.filter((x) => ES_CHUNK_MESA(x.n) && p.fcp != null && x.ini <= p.fcp)
    const luego = p.res.filter((x) => ES_CHUNK_MESA(x.n) && !(p.fcp != null && x.ini <= p.fcp))
    return [{
      clave: 'mesa.portada', ok: p.portada && p.fcp != null && antes.length === 0,
      det: `FCP ${p.fcp} ms · ` + (antes.length ? `chunk pedido ANTES del FCP: ${antes.map((x) => `${x.n.split('/').pop()}@${x.ini}`).join(' + ')}`
        : luego.length ? `chunk pedido después del FCP: ${luego.map((x) => `${x.n.split('/').pop()}@${x.ini}`).join(' + ')}`
        : hayChunk ? 'el chunk no se pide en la Portada' : 'sin chunk: mesa en el paquete principal'),
    }]
  })
  for (const reps of [repsA, repsB, repsP]) {
    for (const p of mayoriaDePuertas(reps)) {
      anota(`${p.clave} (${p.verdes}/${p.de})`, p.ok, p.dets.join(' ‖ '))
    }
  }
  resultados.bloques.mesa = { red: MESA_RED, reps: MESA_REPS, hayChunk, filas, portadas: portadas.map((p) => ({ fcp: p.fcp, chunk: p.res.filter((x) => ES_CHUNK_MESA(x.n)) })) }
}

// ════════════════════════════════════════════════════════════════════════════
// dis · DIS-1 · los aparatos renderizados de la escena 5
// ════════════════════════════════════════════════════════════════════════════
// Rector: AJILEI_DIS-1_Fase2_Integracion_v1.0.md §2.6. Sustituye a `capvis`
// (CAP-1), que medía la fracción visible de las capturas sueltas dentro de los
// marcos CSS: esas capturas ya no existen como tales, van horneadas en el render.
//
// El contrato es la lámina DIS-1 v1.3: sus cajas de imagen están en
// maestras/dis1/contrato.json (scripts/dis1/contrato_lamina.mjs), y la silueta y
// la tinta de cada render, en maestras/dis1/{laptop,telefono}.json. Ningún
// número a mano.
//
// Llegada: el rotor real (`esperarEscena` no basta: se necesita el INSTANTE de
// la activación). Una sonda dentro de la página vigila la clase de la quinta
// `.pue-esc` y, desde que se activa, muestrea por cuadro la opacidad del
// contenedor y de cada aparato, y fotografía las cajas a +1,3 s (escritorio y
// teléfono) y +3,3 s (laptop del relevo). En WebKit el `load` llega antes que
// React (Fase 0 §F2): se espera a `.pue-escenario` antes de armar la sonda.
if (hacer('dis')) {
  console.log('\n── dis · la escena 5 con los renders de DIS-1 (Edge y WebKit) ──')
  const CONTRATO = JSON.parse(readFileSync('maestras/dis1/contrato.json', 'utf8')).casos
  const ES_DIS = (u) => /dis_(laptop|telefono)(-[A-Za-z0-9_-]+)?\.webp/.test(u || '')
  const TOL_CONTRATO = 1, TOL_WEBKIT = 1
  // `relevo` es el corte de portada.css (≤ 900 px de ancho), no el tipo de aparato.
  const CASOS_DIS = [
    { id: '1920x1080',    w: 1920, h: 1080, dpr: 1, contrato: '1920', perezoso: true },
    { id: 'S25 360x704',  w: 360,  h: 704,  dpr: 3, movil: true, contrato: 's25', perezoso: true },
    { id: '390x844',      w: 390,  h: 844,  dpr: 3, movil: true, contrato: '390' },
    { id: '360x640',      w: 360,  h: 640,  dpr: 3, movil: true, contrato: '640' },
    { id: '901x1000',     w: 901,  h: 1000, dpr: 1 },
    { id: '1366x768',     w: 1366, h: 768,  dpr: 1 },
    { id: '1440x850',     w: 1440, h: 850,  dpr: 1 },
    { id: '768x1024',     w: 768,  h: 1024, dpr: 2, movil: true },
  ]
  // Qué fases se comparan en WebKit (ficha §2.6): 1920, S25 en las dos y 360×640 el teléfono.
  const CASOS_WEBKIT = { '1920x1080': [null], 'S25 360x704': ['tel', 'lap'], '360x640': ['tel'] }
  const CASOS_OCULTOS = [
    { id: 'S25 h 780x360',       w: 780,  h: 360,  dpr: 3, movil: true },
    { id: '1920x1080 quietud',   w: 1920, h: 1080, dpr: 1, reducedMotion: 'reduce' },
  ]

  // La sonda. Corre en la página, así que los tiempos son los del documento y
  // no los de Playwright: nada de latencias de ida y vuelta en la vara.
  const SONDA_DIS = `(() => {
    const esc = document.querySelectorAll('.pue-esc')[4];
    const lap = esc.querySelector('.pue-dis-laptop'), tel = esc.querySelector('.pue-dis-telefono');
    const caja = (e) => { const r = e.getBoundingClientRect(); return [r.left, r.top, r.right, r.bottom]; };
    const foto = (t) => ({ t, laptop: caja(lap), telefono: caja(tel),
      op: [+getComputedStyle(lap).opacity, +getComputedStyle(tel).opacity],
      lema: caja(document.querySelector('.pue-lema-categoria')), frase: caja(document.querySelector('.pue-frase')),
      listas: [lap, tel].map((i) => i.complete && i.naturalWidth > 0) });
    const S = window.__dis = { t0: null, muestras: [], fotos: {}, fin: false };
    const arrancar = () => {
      S.t0 = performance.now();
      const paso = () => {
        const t = performance.now() - S.t0;
        S.muestras.push([t, +getComputedStyle(esc).opacity, +getComputedStyle(lap).opacity, +getComputedStyle(tel).opacity]);
        if (t >= 1300 && !S.fotos.t13) S.fotos.t13 = foto(t);
        if (t >= 3300 && !S.fotos.t33) S.fotos.t33 = foto(t);
        if (t < 4700) requestAnimationFrame(paso); else S.fin = true;
      };
      paso();
    };
    if (esc.classList.contains('pue-activa')) return 'ya activa';
    new MutationObserver((_, o) => {
      if (esc.classList.contains('pue-activa') && S.t0 === null) { o.disconnect(); arrancar(); }
    }).observe(esc, { attributes: true, attributeFilter: ['class'] });
    return 'armada';
  })()`

  async function contexto(nav, caso) {
    const opciones = { viewport: { width: caso.w, height: caso.h }, deviceScaleFactor: caso.dpr }
    // `isMobile` sólo existe en Chromium; en WebKit se mide el mismo viewport.
    if (caso.movil && nav === 'edge') Object.assign(opciones, { isMobile: true, hasTouch: true })
    if (caso.reducedMotion) opciones.reducedMotion = caso.reducedMotion
    const ctx = await (nav === 'edge' ? browser : navWebkit).newContext(opciones)
    const page = await ctx.newPage()
    const errores = [], peticiones = []
    page.on('console', (m) => { if (m.type() === 'error') errores.push(m.text()) })
    page.on('pageerror', (e) => errores.push(`pageerror: ${e.message}`))
    const t0 = Date.now()
    page.on('request', (r) => { if (ES_DIS(r.url())) peticiones.push({ url: r.url().split('/').pop(), t: Date.now() - t0 }) })
    await page.goto(URL_LAMINA, { waitUntil: 'load' })
    await page.waitForSelector('.pue-escenario', { state: 'attached', timeout: 15000 })
    return { ctx, page, errores, peticiones }
  }

  async function medir(nav, caso) {
    const { ctx, page, errores, peticiones } = await contexto(nav, caso)
    const armada = await page.evaluate(SONDA_DIS)
    await page.waitForFunction(() => window.__dis && window.__dis.fin === true, null, { timeout: 45000 })
    const S = await page.evaluate(() => window.__dis)
    await ctx.close()
    return { nav, caso, armada, S, errores, peticiones, relevo: caso.w <= 900 }
  }

  async function oculto(caso) {
    const { ctx, page, errores, peticiones } = await contexto('edge', caso)
    await page.waitForTimeout(6000)   // la política de lo pesado se dispara a los 2,5 s
    const escenario = await page.evaluate(() => getComputedStyle(document.querySelector('.pue-escenario')).display)
    const indice = await page.evaluate(INDICE_ACTIVA)
    await ctx.close()
    return { caso, errores, peticiones, escenario, indice }
  }

  // ARN-3c-ii · D9 · `dis` es vara de tiempo (reloj de pared, topes de 600,
  // 2 500 y 2 700 ms con ~3 % de margen: H-6). Sus topes NO se aflojan: se mide
  // TRES veces en la misma corrida y cada puerta vale lo que su mediana, que en
  // una puerta de umbral es «verde en al menos dos de tres»
  // (`mayoriaDePuertas`, scripts/arnes/varas.mjs). Dentro del bucle, `anota`
  // es local y solo apunta; la de verdad se llama al final, una vez por puerta,
  // con las tres cifras en el detalle. (El cuerpo no se reindentó a propósito:
  // el diff enseña que las puertas no cambiaron.)
  const anotaUna = anota
  const REPS_DIS = 3
  const repsDis = [], bloquesDis = []
  // `contexto()` (arriba, fuera del bucle) abre las páginas de WebKit con él:
  // vive fuera del bucle y se reasigna en cada repetición.
  let navWebkit = null
  for (let repDis = 0; repDis < REPS_DIS; repDis++) {
  const puertasRep = []
  const anota = (id, ok, detalle) => { puertasRep.push({ clave: id, ok: !!ok, det: detalle }); return ok }
  // ARN-3c · D6 · el WebKit no sale de `navegadorArnes()`: se aísla a mano.
  navWebkit = aislarNavegador(await webkit.launch({ headless: true }))
  const [edge, ocultos, wk] = await Promise.all([
    Promise.all(CASOS_DIS.map((c) => medir('edge', c))),
    Promise.all(CASOS_OCULTOS.map(oculto)),
    Promise.all(CASOS_DIS.filter((c) => c.id in CASOS_WEBKIT).map((c) => medir('webkit', c))),
  ])
  await navWebkit.close()

  const r2 = (v) => Math.round(v * 100) / 100
  const delta = (a, b) => Math.max(...a.map((v, i) => Math.abs(v - b[i])))
  // Qué aparato se ve en cada foto: escritorio los dos a +1,3 s; relevo el
  // teléfono a +1,3 s y la laptop a +3,3 s.
  const vistas = (m) => m.relevo
    ? [{ foto: m.S.fotos.t13, aps: ['telefono'], fase: 'tel' }, { foto: m.S.fotos.t33, aps: ['laptop'], fase: 'lap' }]
    : [{ foto: m.S.fotos.t13, aps: ['laptop', 'telefono'], fase: null }]
  const escalar = (caja, ap, clave) => {       // caja de imagen → silueta o tinta en px de página
    const W = WEB_DIS[ap], fx = (caja[2] - caja[0]) / W.tamano[0], fy = (caja[3] - caja[1]) / W.tamano[1], s = W[clave]
    return [caja[0] + s[0] * fx, caja[1] + s[1] * fy, caja[0] + (s[0] + s[2]) * fx, caja[1] + (s[1] + s[3]) * fy]
  }
  const bloque = { edge: [], webkit: [], ocultos: [] }

  for (const m of [...edge, ...wk]) {
    const et = `${m.caso.id}${m.nav === 'webkit' ? ' · WebKit' : ''}`
    const fila = { nav: m.nav, caso: m.caso.id, armada: m.armada, fotos: m.S.fotos, peticiones: m.peticiones, errores: m.errores }
    if (m.armada !== 'armada' || !m.S.fotos.t13 || !m.S.fotos.t33) {
      anota(`dis.llegada ${et}`, false, `la sonda no vio la activación de la escena 5 (${m.armada})`)
      bloque[m.nav].push(fila); continue
    }
    // ── dis.contrato ──
    if (m.caso.contrato && m.nav === 'edge') {
      const partes = []
      let ok = true
      for (const v of vistas(m)) for (const ap of v.aps) {
        const id = v.fase ? `${m.caso.contrato}_${v.fase}` : m.caso.contrato
        const d = delta(v.foto[ap], CONTRATO[id][ap])
        ok = ok && d <= TOL_CONTRATO
        partes.push(`${ap} ${id} Δ ${r2(d)}`)
      }
      fila.contrato = partes
      anota(`dis.contrato ${et}`, ok, `${partes.join(' · ')} px (≤ ${TOL_CONTRATO})`)
    }
    // ── dis.cabe y dis.holgura ──
    {
      const cabe = [], holg = []
      let okCabe = true, okHolg = true
      for (const v of vistas(m)) {
        const tintas = v.aps.map((ap) => escalar(v.foto[ap], ap, 'tinta'))
        const x0 = Math.min(...tintas.map((t) => t[0])), x1 = Math.max(...tintas.map((t) => t[2]))
        const y0 = Math.min(...tintas.map((t) => t[1])), y1 = Math.max(...tintas.map((t) => t[3]))
        const dentro = x0 >= 0 && x1 <= m.caso.w && y0 >= 0 && y1 <= m.caso.h
        okCabe = okCabe && dentro
        cabe.push(`${v.fase || 'duo'} x ${r2(x0)}…${r2(x1)} y ${r2(y0)}…${r2(y1)}`)
        const sil = v.aps.map((ap) => escalar(v.foto[ap], ap, 'silueta'))
        const arriba = Math.min(...sil.map((s) => s[1])) - v.foto.lema[3]
        const abajo = v.foto.frase[1] - Math.max(...sil.map((s) => s[3]))
        okHolg = okHolg && arriba >= HOLGURA_MINIMA && abajo >= HOLGURA_MINIMA
        holg.push(`${v.fase || 'duo'} lema ${r2(arriba)} · frase ${r2(abajo)}`)
      }
      fila.cabe = cabe; fila.holgura = holg
      anota(`dis.cabe ${et}`, okCabe, `tinta con sombra ${cabe.join(' | ')} en ${m.caso.w}×${m.caso.h}`)
      anota(`dis.holgura ${et}`, okHolg, `${holg.join(' | ')} px (≥ ${HOLGURA_MINIMA})`)
    }
    // ── dis.relevo ── (índices de muestra: [t, contenedor, laptop, teléfono])
    {
      const M = m.S.muestras
      const primero = (f, desde = 0) => { const x = M.find((s) => s[0] >= desde && f(s)); return x ? x[0] : null }
      let ok, det
      if (!m.relevo) {
        const tLap = primero((s) => s[2] >= 0.999), tTel = primero((s) => s[3] >= 0.999)
        ok = tLap !== null && tTel !== null && Math.max(tLap, tTel) < 1000
        det = `escritorio: laptop a 1 en ${tLap === null ? '—' : Math.round(tLap)} ms · teléfono a 1 en ${tTel === null ? '—' : Math.round(tTel)} ms (los dos < 1000)`
        fila.relevo = { tLap, tTel }
      } else {
        const telArriba = primero((s) => s[3] >= 0.999)
        const telAbajo = telArriba === null ? null : primero((s) => s[3] <= 0.001, telArriba)
        const lapArriba = primero((s) => s[2] >= 0.999)
        let solape = 0
        for (let k = 1; k < M.length; k++) if (M[k][2] > 0.001 && M[k][3] > 0.001) solape += M[k][0] - M[k - 1][0]
        ok = telArriba !== null && telArriba <= 600 && telAbajo !== null && telAbajo <= 2500 &&
             lapArriba !== null && lapArriba <= 2700 && solape < 300
        det = `relevo: teléfono a 1 en ${telArriba === null ? '—' : Math.round(telArriba)} ms (≤ 600) y a 0 en ${telAbajo === null ? '—' : Math.round(telAbajo)} ms (≤ 2500) · ` +
              `laptop a 1 en ${lapArriba === null ? '—' : Math.round(lapArriba)} ms (≤ 2700) · solape ${Math.round(solape)} ms (< 300)`
        fila.relevo = { telArriba, telAbajo, lapArriba, solape }
      }
      anota(`dis.relevo ${et}`, ok, det)
    }
    // ── dis.salida ── a 4 000 + 150 ms: cada aparato que se veía conserva su opacidad
    {
      const M = m.S.muestras
      const antes = M.filter((s) => s[0] <= 3950).pop(), luego = M.find((s) => s[0] >= 4150)
      let ok = !!antes && !!luego, det = 'sin muestras en 3950/4150 ms'
      if (ok) {
        const partes = []
        for (const [k, ap] of [[2, 'laptop'], [3, 'telefono']]) {
          if (antes[k] < 0.5) { partes.push(`${ap} ya no se veía`); continue }
          const bien = luego[k] >= 0.85
          ok = ok && bien
          partes.push(`${ap} ${r2(luego[k])} × contenedor ${r2(luego[1])} = ${r2(luego[k] * luego[1])} (≥ 0,85 × ${r2(luego[1])})`)
        }
        det = `a ${Math.round(luego[0])} ms: ${partes.join(' · ')}`
        fila.salida = { t: luego[0], contenedor: luego[1], laptop: luego[2], telefono: luego[3] }
      }
      anota(`dis.salida ${et}`, ok, det)
    }
    // ── dis.perezoso ──
    if (m.caso.perezoso && m.nav === 'edge') {
      const ok = m.peticiones.length === 2 && m.peticiones.every((p) => p.t >= 2400)
      anota(`dis.perezoso ${et}`, ok, m.peticiones.map((p) => `${p.url}@${p.t}ms`).join(' · ') || 'ninguna petición de dis_*')
    }
    // ── dis.errores ──
    anota(`dis.errores ${et}`, m.errores.length === 0, m.errores.length ? m.errores.slice(0, 3).join(' | ') : '0 errores de página y de consola')
    bloque[m.nav].push(fila)
  }

  // ── dis.webkit ── las cajas de WebKit contra las de Edge, caso por caso
  for (const w of wk) {
    const e = edge.find((x) => x.caso.id === w.caso.id)
    if (!e || !e.S.fotos.t13 || !w.S.fotos.t13) { anota(`dis.webkit ${w.caso.id}`, false, 'falta la medida de un navegador'); continue }
    const partes = []
    let ok = true
    for (const v of vistas(w).filter((x) => CASOS_WEBKIT[w.caso.id].includes(x.fase))) {
      const ve = vistas(e).find((x) => x.fase === v.fase)
      for (const ap of v.aps) {
        const d = delta(v.foto[ap], ve.foto[ap])
        ok = ok && d <= TOL_WEBKIT
        partes.push(`${ap}${v.fase ? ` (${v.fase})` : ''} Δ ${r2(d)}`)
      }
    }
    anota(`dis.webkit ${w.caso.id}`, ok, `${partes.join(' · ')} px (≤ ${TOL_WEBKIT})`)
  }

  // ── dis.oculto ── donde la escena no existe, ni un byte de los aparatos
  for (const o of ocultos) {
    anota(`dis.oculto ${o.caso.id}`, o.peticiones.length === 0,
      `${o.peticiones.length ? o.peticiones.map((p) => `${p.url}@${p.t}ms`).join(' · ') : 'ninguna petición de dis_*'} en 6 s · escenario display=${o.escenario} · escena activa ${o.indice}`)
    anota(`dis.errores ${o.caso.id}`, o.errores.length === 0, o.errores.length ? o.errores.slice(0, 3).join(' | ') : '0 errores de página y de consola')
    bloque.ocultos.push({ caso: o.caso.id, peticiones: o.peticiones, escenario: o.escenario, indice: o.indice, errores: o.errores })
  }
  repsDis.push(puertasRep); bloquesDis.push(bloque)
  }
  for (const p of mayoriaDePuertas(repsDis)) {
    anotaUna(p.clave, p.ok, `[${p.verdes}/${p.de} verdes, mediana de ${REPS_DIS}] ${p.dets.map((d, i) => `r${i + 1}: ${d}`).join(' ‖ ')}`)
  }
  resultados.bloques.dis = { ...bloquesDis[0], repeticiones: bloquesDis }
}

// ════════════════════════════════════════════════════════════════════════════
// bie · BIE-1 · qué suena en la puerta, y el «Cargando»
// ════════════════════════════════════════════════════════════════════════════
// Rector: AJILEI_BIE-1_Fase1_v1.0.md §2 (1a-ii), sobre la sonda de la Fase 0.
// La puerta entera —Portada, correo, código, lobby— con la red de Supabase
// simulada (`scripts/bie/bieRed.mjs`): sin cuenta real y sin un byte fuera.
//
// EL DEFECTO QUE ESTO VIGILA NO SE VE CON PRISA. El rasgueo viejo sonaba en el
// primer toque DESPUÉS DE CADA REPINTADO de la Portada; con los gestos pegados
// —como los de la sonda de la Fase 0— a veces no había repintado entre dos y
// el defecto se escondía. Por eso aquí se va a ritmo de persona: `PAUSA_BIE`
// entre gesto y gesto, para que el rotor, la frase y la pausa de cortesía
// repinten de sobra. Contra el árbol de `aabaeed` esta misma secuencia da
// rasgueos (control de la Fase 1, informe §bie.s5).
//
// Lo que suena se clasifica por la duración del búfer de Web Audio (rasgueo
// 3,657 s · clic 0,528 s · desbloqueo de Howler, 1 muestra) y se reparte por
// la ventana de cada gesto. El veredicto, por gesto:
//   · botón (JUGAR, Enviar código, Entrar)  → exactamente UN clic;
//   · hueco o campo (tocar y teclear)       → CERO clics;
//   · en todo el recorrido                  → CERO rasgueos.
const PAUSA_BIE = 2200
if (hacer('bie')) {
  console.log('\n── bie · BIE-1 · los sonidos de la puerta (red de Supabase simulada) ──')
  const VISTAS_BIE = [
    { id: '1920x1080', w: 1920, h: 1080, dpr: 1, movil: false },
    { id: '390x844', w: 390, h: 844, dpr: 2, movil: true },
  ]
  const toca = (page, vista, sel) => (vista.movil ? page.tap(sel) : page.click(sel))
  const tocaPunto = (page, vista, p) => (vista.movil ? page.touchscreen.tap(p.x, p.y) : page.mouse.click(p.x, p.y))
  const ENVIO = 'form .puerta-btn[type="submit"]'
  const bie = { recorridos: {}, enter: null }

  for (const vista of VISTAS_BIE) {
    const { ctx, page, red, errores } = await contextoBie(browser, vista, BASE)
    const r = { vista: vista.id, gestos: [], hueco: null, lobby: false, red, errores }
    try {
      await page.goto(URL_LAMINA, { waitUntil: 'load' })
      await page.waitForSelector('.pue-escenario', { timeout: 20000 })
      await page.waitForTimeout(PAUSA_BIE)          // la precarga del clic sale al segundo
      r.hueco = await page.evaluate(HUECO)
      const tipos = []
      const gesto = async (nombre, tipo, fn) => {
        await marca(page, nombre)
        tipos.push(tipo)
        await fn()
        await page.waitForTimeout(PAUSA_BIE)
      }
      await gesto('toque en un hueco', 'hueco', () => tocaPunto(page, vista, r.hueco))
      if (vista.movil) await gesto('JUGAR', 'boton', () => toca(page, vista, '.pue-btn-jugar'))
      await gesto('toque en el correo + teclear', 'campo', async () => {
        await toca(page, vista, '#entrada-correo')
        await page.keyboard.type('bie@example.invalid', { delay: 40 })
      })
      await gesto('Enviar código', 'boton', () => toca(page, vista, ENVIO))
      await page.waitForSelector('#entrada-codigo', { timeout: 10000 })
      await gesto('toque en el código + teclear', 'campo', async () => {
        await toca(page, vista, '#entrada-codigo')
        await page.keyboard.type('123456', { delay: 60 })
      })
      await gesto('Entrar', 'boton', async () => {
        await toca(page, vista, ENVIO)
        await page.waitForSelector('main.lobby', { timeout: 10000 })
        r.lobby = true
      })
      await marca(page, 'fin')
      const ventanas = porGesto(await page.evaluate(() => window.__bie)).filter((v) => v.gesto !== 'fin')
      r.gestos = ventanas.map((v, i) => ({ ...v, tipo: tipos[i] }))
    } catch (e) {
      r.error = e.message
    }
    bie.recorridos[vista.id] = r
    await ctx.close()
  }

  // Enter dentro del campo del correo: el envío implícito tiene que sonar UNA vez.
  {
    const vista = VISTAS_BIE[0]
    const { ctx, page, red, errores } = await contextoBie(browser, vista, BASE)
    const r = { red, errores, codigo: false }
    try {
      await page.goto(URL_LAMINA, { waitUntil: 'load' })
      await page.waitForSelector('.pue-escenario', { timeout: 20000 })
      await page.waitForTimeout(PAUSA_BIE)
      await page.click('#entrada-correo')
      await page.keyboard.type('bie@example.invalid', { delay: 40 })
      await page.waitForTimeout(PAUSA_BIE)
      await marca(page, 'Enter en el correo')
      await page.keyboard.press('Enter')
      await page.waitForSelector('#entrada-codigo', { timeout: 10000 })
      r.codigo = true
      await page.waitForTimeout(PAUSA_BIE)
      await marca(page, 'fin')
      r.ventana = porGesto(await page.evaluate(() => window.__bie)).find((v) => v.gesto === 'Enter en el correo')
    } catch (e) {
      r.error = e.message
    }
    bie.enter = r
    await ctx.close()
  }

  const recorridos = Object.values(bie.recorridos)
  const todas = recorridos.flatMap((r) => r.gestos.map((g) => ({ ...g, vista: r.vista })))
  const resume = (g) => `${g.vista} «${g.gesto}» clic ${g.audio.clic}${g.audio.rasgueo ? ` · RASGUEO ${g.audio.rasgueo}` : ''}`

  anota('bie.s0 la puerta llega al lobby con la red simulada, sin red de fuera ni errores',
    recorridos.every((r) => r.lobby && !r.error && r.red.fuera.length === 0 && r.errores.length === 0) && bie.enter.codigo && !bie.enter.error,
    recorridos.map((r) => `${r.vista}: lobby=${r.lobby} · supabase ${r.red.supabase.length} · fuera ${r.red.fuera.length} · errores ${r.errores.length}${r.error ? ` · ${r.error}` : ''} · hueco en ${r.hueco ? `${r.hueco.x},${r.hueco.y} (${r.hueco.debajo})` : '—'}`).join(' │ ') +
    ` │ Enter: código=${bie.enter.codigo}${bie.enter.error ? ` · ${bie.enter.error}` : ''}`)

  const rasgueos = todas.reduce((a, g) => a + g.audio.rasgueo, 0) + (bie.enter.ventana?.audio.rasgueo ?? 0)
  anota('bie.s1 ningún rasgueo en toda la puerta', todas.length > 0 && rasgueos === 0,
    `${rasgueos} rasgueo(s) en ${todas.length + 1} gestos, a ${PAUSA_BIE} ms entre gesto y gesto`)

  const malos = todas.filter((g) => (g.tipo === 'boton' ? g.audio.clic !== 1 : g.audio.clic !== 0))
  anota('bie.s2 un clic por botón, ninguno al tocar un hueco o un campo', todas.length > 0 && malos.length === 0,
    todas.map(resume).join(' · '))

  const enter = bie.enter.ventana
  anota('bie.s3 Enter en el correo suena UNA vez', !!enter && enter.audio.clic === 1,
    enter ? `clic ${enter.audio.clic} · el paso del código ${bie.enter.codigo ? 'llegó' : 'NO llegó'}` : 'sin ventana medida')

  const primeros = recorridos.map((r) => ({ vista: r.vista, g: r.gestos[0] }))
  anota('bie.s4 el desbloqueo de Howler suena en el primer gesto', primeros.every((p) => p.g && p.g.audio.desbloqueo >= 1),
    primeros.map((p) => `${p.vista} «${p.g?.gesto ?? '—'}»: desbloqueo ${p.g?.audio.desbloqueo ?? '—'}`).join(' · '))

  // ── bie.c* · el indicador «Cargando» (Fase 1 §3.5) ──────────────────────────
  // La regla D5 vista desde fuera: con `profiles` a distintos retardos, cuándo
  // se vacía `#root`, cuándo llega `.cargando` y cuándo el lobby. Las horas son
  // las del MutationObserver (commit de React), en ms de la página. Aquí no hay
  // que ir a ritmo de persona —lo que se mide es la red, no el sonido—, así que
  // los campos se rellenan con `fill`.
  console.log('   · bie.c* · el indicador «Cargando»')
  const sano = (r) => !r.error && r.red.fuera.length === 0 && r.errores.length === 0
  const nota = (r) => `${r.vista}${r.error ? ` · ERROR ${r.error}` : ''}${r.red.fuera.length ? ` · fuera ${r.red.fuera.length}` : ''}${r.errores.length ? ` · errores ${r.errores.slice(0, 2).join(' | ')}` : ''}`
  const vida = (r) => {
    const v = r.vida
    if (!v) return '—'
    const rel = (t) => (t === null || v.vacio === null ? '—' : `${t - v.vacio}`)
    return `vacío→cargando ${rel(v.cargando)} ms · vacío→lobby ${rel(v.lobby)} ms${v.cargando !== null && v.lobby !== null ? ` · visible ${v.lobby - v.cargando} ms` : ''}${v.tras ? ` · tras él «${v.tras}»` : ''}`
  }
  const esLobby = (que) => /(^|\s)lobby(\s|$)/.test(que ?? '')
  const pasoCodigo = async (vista, opts = {}) => {
    const { sondear = false, ...red } = opts
    const { ctx, page, red: trafico, errores } = await contextoBie(browser, vista, BASE, red)
    const r = { vista: vista.id, ...red, red: trafico, errores, lobby: false }
    try {
      await page.goto(URL_LAMINA, { waitUntil: 'load' })
      await page.waitForSelector('.pue-escenario', { timeout: 20000 })
      if (vista.movil) await page.tap('.pue-btn-jugar')
      await page.fill('#entrada-correo', 'bie@example.invalid')
      await toca(page, vista, ENVIO)
      await page.waitForSelector('#entrada-codigo', { timeout: 10000 })
      await page.fill('#entrada-codigo', '123456')
      await marca(page, 'Entrar')
      await toca(page, vista, ENVIO)
      if (sondear) {
        const h = await page.waitForSelector('.cargando', { timeout: 3000 }).catch(() => null)
        if (h) {
          r.sonda = await page.evaluate(SONDA_INDICADOR)
          await page.waitForTimeout(250)
          r.sonda2 = await page.evaluate(SONDA_INDICADOR)
        }
      }
      await page.waitForSelector('main.lobby', { timeout: 15000 })
      r.lobby = true
      await page.waitForTimeout(300)
      const serie = await page.evaluate(() => window.__bie)
      r.vida = vidaIndicador(serie, serie.find((e) => e.marca === 'Entrar').t)
    } catch (e) {
      r.error = e.message
    }
    await ctx.close()
    return r
  }
  const arranque = async (vista, opts = {}) => {
    const { ctx, page, red: trafico, errores } = await contextoBie(browser, vista, BASE, opts)
    const r = { vista: vista.id, ...opts, red: trafico, errores, destino: null }
    try {
      await page.goto(URL_LAMINA, { waitUntil: 'load' })
      if (opts.conSesion && await page.waitForSelector('.cargando', { timeout: 3000 }).catch(() => null)) {
        await page.waitForTimeout(150)
        r.sonda = await page.evaluate(SONDA_INDICADOR)
      }
      await page.waitForSelector(opts.conSesion ? 'main.lobby' : '.pue-escenario', { timeout: 20000 })
      r.destino = opts.conSesion ? 'lobby' : 'portada'
      await page.waitForTimeout(3000)
      r.vida = vidaIndicador(await page.evaluate(() => window.__bie), 0)
    } catch (e) {
      r.error = e.message
    }
    await ctx.close()
    return r
  }

  const c = { c1: [], c2: [], c3: [], c4: [], c5: [], c7: null }
  for (const vista of VISTAS_BIE) {
    c.c1.push(await arranque(vista))
    c.c2.push(await pasoCodigo(vista, { perfilMs: 0 }))
    c.c3.push(await pasoCodigo(vista, { perfilMs: 1000, sondear: true }))
    for (let i = 0; i < 2; i++) c.c4.push(await pasoCodigo(vista, { perfilMs: 350 }))
    c.c5.push(await arranque(vista, { conSesion: true, perfilMs: 1000 }))
  }
  c.c7 = await pasoCodigo(VISTAS_BIE[0], { perfilMs: 1500, sondear: true, reducido: true })
  bie.indicador = c

  anota('bie.c1 anónimo sin sesión: el indicador nunca aparece',
    c.c1.every((r) => sano(r) && r.destino === 'portada' && r.vida.cargando === null),
    c.c1.map((r) => `${nota(r)}: ${r.destino ?? '—'} · «Cargando» ${r.vida?.veces ?? '—'} vez/veces en 3 s`).join(' │ '))

  anota('bie.c2 código con profiles a 0 ms: no aparece, lobby directo',
    c.c2.every((r) => sano(r) && r.lobby && r.vida.cargando === null && r.vida.lobby !== null),
    c.c2.map((r) => `${nota(r)}: ${vida(r)}`).join(' │ '))

  anota('bie.c3 código con profiles a 1 000 ms: aparece entre 300 y 400 ms tras el vacío y sigue hasta el lobby',
    c.c3.every((r) => {
      const v = r.vida
      return sano(r) && r.lobby && v.cargando !== null && v.vacio !== null &&
        v.cargando - v.vacio >= 300 && v.cargando - v.vacio <= 400 && v.veces === 1 && esLobby(v.tras)
    }),
    c.c3.map((r) => `${nota(r)}: ${vida(r)}`).join(' │ '))

  const c4vistos = c.c4.filter((r) => r.vida?.cargando != null)
  anota('bie.c4 código con profiles a 350 ms: si aparece, se queda ≥ 500 ms',
    c.c4.every((r) => sano(r) && r.lobby) && c4vistos.every((r) => r.vida.lobby - r.vida.cargando >= 500),
    `${c4vistos.length}/${c.c4.length} pasadas lo enseñaron · ` + c.c4.map((r) => `${nota(r)}: ${vida(r)}`).join(' │ '))

  anota('bie.c5 arranque con la sesión de CAP-1 y profiles a 1 000 ms: aparece',
    c.c5.every((r) => sano(r) && r.destino === 'lobby' && r.vida.cargando !== null),
    c.c5.map((r) => `${nota(r)}: ${r.destino ?? '—'} · arranque→cargando ${r.vida?.cargando != null && r.vida.vacio != null ? r.vida.cargando - r.vida.vacio : '—'} ms · visible ${r.vida?.cargando != null && r.vida.lobby != null ? r.vida.lobby - r.vida.cargando : '—'} ms`).join(' │ '))

  const s6 = c.c3.map((r) => ({ vista: r.vista, s: r.sonda }))
  anota('bie.c6 el indicador expone role="status" con el texto «Cargando»',
    s6.every(({ s }) => s && s.status && s.vivo === 'polite' && s.texto === 'Cargando' &&
      s.ocultos.some((k) => /cargando-iso/.test(k)) && s.ocultos.some((k) => /cargando-puntos/.test(k))),
    s6.map(({ vista, s }) => (s ? `${vista}: status=${s.status} · aria-live=${s.vivo} · «${s.texto}» · aria-hidden ${s.ocultos.join('+')} · ${s.animaciones} animaciones · fondo ${s.fondo}` : `${vista}: sin sonda`)).join(' │ '))

  const s7 = c.c7.sonda
  anota('bie.c7 movimiento reducido: sin animación activa',
    sano(c.c7) && !!s7 && s7.animaciones === 0 && s7.texto === 'Cargando' && s6.every(({ s }) => s && s.animaciones > 0),
    s7 ? `reducido: ${s7.animaciones} animaciones en marcha · «${s7.texto}» │ control sin reducir: ${s6.map(({ vista, s }) => `${vista} ${s?.animaciones ?? '—'}`).join(' · ')}` : `${nota(c.c7)}: sin sonda`)

  // No es puerta: «sin mover nada al aparecer». La caja del indicador en el
  // commit en que llega (leída por el MutationObserver, antes de pintar) contra
  // la de la sonda, más tarde y con el isotipo ya cargado.
  for (const r of [...c.c3, ...c.c5, c.c7]) {
    const despues = r.sonda2 ?? r.sonda
    if (r.vida?.caja && despues) {
      console.log(`     caja ${r.vista}${r.reducido ? ' reducido' : ''}${r.conSesion ? ' arranque' : ''}: ${r.vida.caja} (isotipo ${r.vida.isoCargado ? 'ya cargado' : 'sin cargar'}) → ${despues.caja} a +${despues.t - r.vida.cargando} ms (isotipo ${despues.iso?.cargado ? 'cargado' : 'SIN CARGAR'}) ${r.vida.caja === despues.caja ? '· quieta' : '· SE MOVIÓ'}`)
    } else if (r.vida?.caja) {
      console.log(`     caja ${r.vista}${r.conSesion ? ' arranque' : ''}: ${r.vida.caja} (isotipo ${r.vida.isoCargado ? 'ya cargado' : 'sin cargar'}) · sin sonda posterior`)
    }
  }

  resultados.bloques.bie = bie
}

// ════════════════════════════════════════════════════════════════════════════
// cap · CAP-1 · las tres maestras de la mesa (Portada y og-image)
// ════════════════════════════════════════════════════════════════════════════
// Rector: AJILEI_CAP-1_Fase1_v1.0.md §1a.1 + Addendum 1. El único modo de este
// arnés que NO mira la Portada: entra a la MESA con una sesión simulada (ver la
// cabecera de `scripts/cap/capMesa.mjs`) y la fotografía en el momento de las
// capturas viejas —mesa 5, «A las 3 — Tú abre.», las cuatro IAS «Igualó», pozo
// 2000— con la semilla sellada. Por cada vista hace DOS pasadas en contextos
// nuevos; las puertas de contenido tienen que salir verdes en las dos, y las
// dos fotos tienen que ser EQUIVALENTES por tolerancia (Addendum 1, D-1: el
// raster de los degradados tiene más de un estado y la huella no sirve).
//
// Salida: `capturas-cap/maestras/{mesav,mesah,mesapc}.png` siempre. Con
// `--sellar`, y SÓLO con todas las puertas en verde, se copia la PRIMERA pasada
// a `maestras/portada/` (versionada: DIS-1 las reutiliza a resolución nativa)
// junto a `cap.json`, que es TRAZABILIDAD y no puerta. Sin `--sellar`, si ya
// hay maestras selladas, cada pasada se compara con la suya por la misma vara
// (`cap.regresion`): la mesa de hoy tiene que seguir siendo la sellada.
if (hacerSolo('cap')) {
  const sellar = process.argv.includes('--sellar')
  const DIR_CAP = 'capturas-cap/maestras'
  const DIR_SELLO = 'maestras/portada'
  mkdirSync(DIR_CAP, { recursive: true })
  console.log(`\n── cap · semilla ${SEMILLA_CAP} · ${Object.entries(VISTAS_CAP).map(([k, v]) => `${k} ${v.w}×${v.h}@${v.dpr}`).join(' / ')}${sellar ? ' · --sellar' : ''} ──`)
  const fallosAntes = fallos.length
  const lienzo = await browser.newPage()     // para comparar y derivar, sin red
  const cap = {}
  const pct = (x) => `${(x * 100).toFixed(3)} %`
  for (const [vista, v] of Object.entries(VISTAS_CAP)) {
    const et = `${vista} ${v.w}×${v.h}@${v.dpr}`
    // ARN-4 A5 · va la primera: una pareja repetida es la que pasa por las puertas
    // de contenido, y la que se guarda.
    let ps
    const est = await conRepeticion(`cap.estable ${et}`, async () => {
      ps = [await pasadaCap(browser, vista, URL_LAMINA), await pasadaCap(browser, vista, URL_LAMINA)]
      return compararPng(lienzo, ps[0].png, ps[1].png)
    }, equivalentes)
    const cmp = est.valor
    const estable = est.dentro
    const ambas = (f) => ps.every(f)
    const igualo = (p) => p.lectura.rivales.filter((r) => /Igualó/.test(r)).length
    anota(`cap.escena ${et}`, ambas((p) => p.etapa === 2 && /A las 3 — Tú abre\./.test(p.lectura.mensaje)),
      ps.map((p) => `«${p.lectura.mensaje}» quieta ${p.quieta} ms`).join(' · '))
    anota(`cap.mano ${et}`, ambas((p) => JSON.stringify(p.lectura.mano) === JSON.stringify(MANO_CAP)),
      ps[0].lectura.mano.join(' · ') || '(sin cartas)')
    anota(`cap.pozo ${et}`, ambas((p) => p.lectura.pozo === POZO_CAP), `pozo ${ps.map((p) => p.lectura.pozo).join(' / ')}`)
    anota(`cap.ias ${et}`, ambas((p) => p.lectura.rivales.length === 4 && igualo(p) === 4),
      ps.map((p) => `${igualo(p)} de ${p.lectura.rivales.length}`).join(' / ') + ' con «Igualó»')
    anota(`cap.saldo ${et}`, ambas((p) => p.lectura.texto.includes(SALDO_CAP) && p.lectura.texto.includes(MESA_CAP)),
      ps.map((p) => `«${SALDO_CAP}» ${p.lectura.texto.includes(SALDO_CAP) ? 'sí' : 'NO'} · «${MESA_CAP}» ${p.lectura.texto.includes(MESA_CAP) ? 'sí' : 'NO'}`).join(' / '))
    const notas = ps.flatMap((p) => p.notas)
    anota(`cap.crono ${et}`, ambas((p) => p.lectura.cronos.length > 0 && p.lectura.cronos.every((c) => c === CRONO_CAP)),
      `${ps.map((p) => p.lectura.cronos.join('/')).join(' · ')} · intentos ${ps.map((p) => p.intento).join('/')}${notas.length ? ' · ' + notas.join(' | ') : ''}`)
    const fuera = ps.flatMap((p) => [...p.red.fuera, ...p.red.sockets])
    anota(`cap.red ${et}`, fuera.length === 0,
      fuera.length ? `FUERA: ${fuera.slice(0, 3).join(' · ')}`
        : `0 fuera · ${ps.reduce((a, p) => a + p.red.supabase.length, 0)} a Supabase, todas contestadas por la ruta (${[...new Set(ps[0].red.supabase)].join(', ')})`)
    const errores = ps.flatMap((p) => p.errores)
    anota(`cap.errores ${et}`, errores.length === 0, errores.length ? errores.slice(0, 3).join(' · ') : '0 errores de página y de consola')
    anota(`cap.estable ${et}`, estable,
      (cmp.mismasDim
        ? `Δ≤${TOLERANCIA_CAP.deltaFino}: ${pct(cmp.fraccionFina)} (≥ ${pct(TOLERANCIA_CAP.fraccionFina)}) · Δmáx ${cmp.deltaMax} (≤ ${TOLERANCIA_CAP.deltaMax}) · ${cmp.distintos} px distintos de ${cmp.pixeles} · ${ps[0].sha.slice(0, 16)} / ${ps[1].sha.slice(0, 16)}`
        : `dimensiones distintas ${cmp.dimA} / ${cmp.dimB}`) + (est.nota ? ` · ${est.nota}` : ''))
    writeFileSync(`${DIR_CAP}/${v.maestra}`, ps[0].png)
    // La segunda pasada sólo se guarda si la vara sale ROJA: es para diagnóstico.
    if (!estable) writeFileSync(`${DIR_CAP}/${v.maestra.replace('.png', '')}_pasada2.png`, ps[1].png)
    cap[vista] = {
      maestra: v.maestra, viewport: { w: v.w, h: v.h, dpr: v.dpr }, dim: cmp.dim, bytes: ps[0].png.length,
      sha256: ps[0].sha, sha256Pasada2: ps[1].sha, tiradas: ps[0].lectura.tiradas, fijadas: ps[0].fijadas,
      estable: { fraccionDeltaFino: cmp.fraccionFina, deltaMax: cmp.deltaMax, distintos: cmp.distintos, verde: estable },
    }
    // og-image (Addendum 1 §2.3): la caja dorada de mesah, CUBIERTA a 1200×630
    // con el cuerpo literal del generador, no puede perder más de 6 px CSS por
    // lado. Se mide en los dos ejes: el corte cae donde la caja sobra.
    if (vista === 'h') {
      const d = await derivarComoGenerador(lienzo, ps[0].png, { id: 'og-image', ancho: 1200, alto: 630, techo: 200 * 1024, tipo: 'image/jpeg', calidadTope: 0.85, recorte: 'juego', encaje: 'cubrir' })
      const usaW = Math.min(d.recorteW, d.recorteH * 1200 / 630), usaH = Math.min(d.recorteH, d.recorteW * 630 / 1200)
      const porLado = { x: (d.recorteW - usaW) / 2 / v.dpr, y: (d.recorteH - usaH) / 2 / v.dpr }
      const peor = Math.max(porLado.x, porLado.y)
      anota(`cap.ogRecorte ${et}`, peor <= OG_RECORTE_MAX_CSS,
        `caja dorada ${d.recorteW}×${d.recorteH} (${(d.recorteW / d.recorteH).toFixed(3)} frente a 1,905) · cubrir corta ${porLado.x.toFixed(1)} px CSS por lado en x y ${porLado.y.toFixed(1)} en y (≤ ${OG_RECORTE_MAX_CSS})`)
      cap[vista].ogRecorte = { caja: [d.cajaX, d.cajaY, d.recorteW, d.recorteH], cssPorLado: { x: +porLado.x.toFixed(2), y: +porLado.y.toFixed(2) } }
    }
    // Regresión (1b.5): sin --sellar, contra la maestra sellada, misma vara.
    if (!sellar && existsSync(`${DIR_SELLO}/${v.maestra}`)) {
      const maestra = readFileSync(`${DIR_SELLO}/${v.maestra}`)
      const reg = await conRepeticion(`cap.regresion ${et}`, async (i) =>
        compararPng(lienzo, maestra, (i ? await pasadaCap(browser, vista, URL_LAMINA) : ps[0]).png), equivalentes)
      const r = reg.valor
      anota(`cap.regresion ${et}`, reg.dentro,
        (r.mismasDim ? `contra ${DIR_SELLO}/${v.maestra}: Δ≤${TOLERANCIA_CAP.deltaFino} ${pct(r.fraccionFina)} · Δmáx ${r.deltaMax} · ${r.distintos} px distintos`
          : `dimensiones distintas ${r.dimA} / ${r.dimB}`) + (reg.nota ? ` · ${reg.nota}` : ''))
      cap[vista].regresion = r
    }
  }
  await lienzo.close()
  const verde = fallos.length === fallosAntes
  if (sellar) {
    if (verde) {
      mkdirSync(DIR_SELLO, { recursive: true })
      for (const v of Object.values(VISTAS_CAP)) copyFileSync(`${DIR_CAP}/${v.maestra}`, `${DIR_SELLO}/${v.maestra}`)
      // cap.json · trazabilidad del sello (Addendum 1 §2.2). NINGÚN modo compara
      // huellas contra este archivo: el sha256 dice QUÉ se selló, no qué debe salir.
      const traza = {
        campana: 'CAP-1', generado: new Date().toISOString(), edge: browser.version(),
        semilla: SEMILLA_CAP, prng: 'mulberry32 sobre Math.random (addInitScript); crypto sin tocar',
        receta: `mesa ${RECETA_CAP.jugadores} · reto ${RECETA_CAP.nivel} · apuesta índice ${RECETA_CAP.stakeIdx} (200) · entrada ${RECETA_CAP.entrada}; «A las 2» Apostar ×1; las cuatro IAS igualan; foto en «A las 3 — Tú abre.» con la mesa quieta (getAnimations y vuelos a cero), «20s» comprobado y turnBreath fijada a ${FASE_RESPIRACION_MS} ms. Sesión simulada: red a Supabase interceptada entera.`,
        vara: { ...TOLERANCIA_CAP, nota: 'cap.estable por tolerancia (Addendum 1, D-1); se sella la primera pasada' },
        maestras: Object.fromEntries(Object.entries(cap).map(([k, c]) => [c.maestra, {
          vista: k, viewport: c.viewport, dimensiones: c.dim, bytes: c.bytes, sha256: c.sha256,
          estable: { fraccionDeltaFino: c.estable.fraccionDeltaFino, deltaMax: c.estable.deltaMax, distintos: c.estable.distintos },
          ...(c.ogRecorte ? { ogRecorte: c.ogRecorte } : {}),
        }])),
      }
      writeFileSync(`${DIR_SELLO}/cap.json`, JSON.stringify(traza, null, 2) + '\n')
      console.log(`  SELLADO · ${Object.values(VISTAS_CAP).map((v) => v.maestra).join(', ')} + cap.json → ${DIR_SELLO}/`)
    } else {
      console.log(`  --sellar SIN EFECTO · ${fallos.length - fallosAntes} puerta(s) en rojo: no se escribe nada en ${DIR_SELLO}/`)
    }
  }
  resultados.bloques.cap = { semilla: SEMILLA_CAP, sellado: sellar && verde, vistas: cap }
  writeFileSync(`${DIR_CAP}/cap.json`, JSON.stringify(resultados.bloques.cap, null, 2))
}

// ════════════════════════════════════════════════════════════════════════════
// voz2 · VOZ-2 · La frase del óvalo, recogida (1a) y desplegada (1b)
// ════════════════════════════════════════════════════════════════════════════
// Rector: AJILEI_VOZ-2_Fase1_v1.0.md §2 1a-ii y §3 1b-iii. Llegar y medir viven en
// `scripts/voz2/voz2Mesa.mjs` (lo comparte la lámina); aquí sólo los veredictos.
// Juega UNA mano por celda hasta el pago —20 celdas, ~5 min con cuatro a la
// vez—, así que corre sólo por su nombre, nunca dentro de `todo`.
//
//   node scripts/diagPUE.mjs voz2                       (las cuatro puertas)
//   node scripts/diagPUE.mjs voz2 --control=contain     (control: sin contención)
//   node scripts/diagPUE.mjs voz2 --control=nowrap      (control: el recorte ingenuo)
//   node scripts/diagPUE.mjs voz2 --control=capa        (control: una capa que lo tapa todo)
//   node scripts/diagPUE.mjs voz2 --sin-burbuja         (salta la pasada del 5173)
//   node scripts/diagPUE.mjs voz2 --celdas=360x640      (filtra por subcadena)
//
// · voz2.c1          el óvalo del pago es el de la tabla C1 de la Fase 0 (D1).
// · voz2.ovalo       con las formas de `formasVoz2` (9, y 11 desde VOZ-3 con
//                    C1 y C3), Δ = 0 del óvalo y de su interior (pozo,
//                    «A igualar», comodín). El `<p>` NO puntúa aquí: C-3
//                    (two-ovals, alto automático) y C-4 (escritorio 4/5, ahora
//                    estirado) se imprimen aparte, ni escondidos ni tomados por
//                    regresión.
// · voz2.recorte     hay marca `data-voz2-recortada` ⇔ hay glifos que no se
//                    ven (contados con `Range` contra el recorte, nunca con
//                    `textContent`). También para la frase real del pago.
// · voz2.contencion  centinelas 360×640 m5/m4 con «… Te llevas otros 1500
//                    Heptacoins.» y el peor caso: además `<p>` Δ0 (C-2, D7).
// 1b (en la misma página, tras la parte 1; el peor caso se inyecta para que
// haya recorte en las 20 celdas):
// · voz2.capa        tocar el texto abre la capa (fixed, z 20) con la frase
//                    ENTERA —cada glifo dentro del viewport y sin tapar—, tocarla
//                    la cierra, dos alternancias, y Δ0 de las anclas abierta y
//                    después. También con la frase real, donde viene recortada.
// · voz2.capa(a)     con la capa abierta, «Siguiente mano» recibe los nueve
//                    toques de su rejilla y no se corta con la capa (exigencia
//                    de Victor). Lo que tapa la capa (b) se imprime, sin veredicto.
// · voz2.indicio     la flechita se ve recogida, no se ve desplegada ni sin
//                    recorte, y ningún ancestro la recorta.
// · voz2.toque       rejilla 5×3 del óvalo + el texto: cada punto del óvalo abre
//                    con UNA alternancia y Esc cierra; tocar el óvalo con la capa
//                    abierta la cierra; los nombres de rival en la frontera ganan;
//                    sin recorte y fuera del resultado el óvalo no responde.
// · voz2.a11y        con recorte, UN botón cuyo nombre es la frase entera;
//                    Enter/Espacio alternan, Esc cierra, aria-controls = la capa;
//                    sin recorte, ni rol ni tabindex ni aria-*.
// · voz2.siguiente   con la capa abierta, el toque a «Siguiente mano» la quita en
//                    ≤ 1 fotograma, no vuelve, y la mano nueva se ve (TURNO).
// · voz2.burbuja     (5173, `?apu=`) la burbuja no cierra la capa, se ve y se
//                    toca con ella abierta; su tarjeta la recoge y queda encima.
// Con `--control`, la hoja de control entra por la página (no por el repo) y lo
// que se exige es lo contrario: que la puerta VEA el movimiento donde la Fase 0
// lo midió (o, con `capa`, el bloqueo). Sin ese rojo, el verde no vale.
if (hacerSolo('voz2')) {
  const V = await import('./voz2/voz2Mesa.mjs')
  const control = (process.argv.find((a) => a.startsWith('--control=')) || '').split('=')[1] || null
  const filtro = (process.argv.find((a) => a.startsWith('--celdas=')) || '').split('=')[1] || ''
  if (control && !V.HOJAS_CONTROL[control]) await fallarInstrumento(new ErrorInstrumento(`--control desconocido: ${control}`))
  const etq = control ? `voz2.control[${control}]` : 'voz2'
  console.log(`\n── ${etq} · ${V.VISTAS_VOZ2.map((v) => v.id).join(' / ')} × mesas ${V.MESAS_VOZ2.join('/')}${filtro ? ` · filtro «${filtro}»` : ''} ──`)
  const tareas = []
  for (const v of V.VISTAS_VOZ2) for (const n of V.MESAS_VOZ2) if (V.etiquetaCelda(v, n).includes(filtro)) tareas.push([v, n])
  const EPS = 0.011
  const INTERIOR = ['ovalo', 'pozo', 'igualar', 'comodin']
  // ── 1b · Parte 2: la capa, el toque, el teclado y la mano siguiente ───────
  // Corre en la MISMA página que la parte 1, que deja el texto real restaurado.
  // Orden: capa con la frase real (el camino entero del producto) → capa con el
  // peor caso inyectado (exigencias a y b) → rejilla del toque → nombres en la
  // frontera → sin recorte → teclado → y AL FINAL «Siguiente mano», que cambia
  // de mano. El peor caso se inyecta en el texto Y en la capa: React no vuelve a
  // escribir un texto que no ha cambiado, así que la capa enseña lo inyectado.
  const ANC_D1 = ['ovalo', 'pozo', 'igualar', 'comodin', 'msg', 'texto', 'cartasJugador', 'barra']
  const dAnclas = (a, b) => Math.max(...ANC_D1.map((k) => V.deltaCaja(a[k], b[k])))
  const raf2 = (page) => page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))))
  const centro = (c) => [c.x + c.w / 2, c.y + c.h / 2]
  // (a) «visible y tocable» con la capa abierta = lo MISMO que sin capa: el
  // centro y la misma cuenta de la rejilla 3×3, ningún toque para la capa y
  // ningún solape con ella. Se compara contra la medida SIN capa porque la
  // burbuja es una píldora: las esquinas de su caja caen fuera de su forma y
  // el navegador respeta el redondeo, así que con capa o sin ella recibe 6 de 9
  // (medido en la primera corrida: los otros tres se los lleva la ranura de
  // detrás, nunca la capa).
  const tocableOk = (t, sola) => !!t && t.visible && t.dentroVp && t.centro && t.solapeCapa === 0 && !t.robados.includes('capa') &&
    !!sola && sola.visible && t.toques === sola.toques
  const fmtToc = (t, sola) => (!t || !t.visible ? 'no está' : `${t.toques}/${t.de} toques (sin capa ${sola?.visible ? sola.toques : '—'}/${t.de}) · centro ${t.centro} · solape con la capa ${t.solapeCapa} px² · dentro del viewport ${t.dentroVp}${t.robados.length ? ` · los demás van a: ${t.robados.join(', ')}` : ''}`)
  const fmtTapa = (tapa) => Object.entries(tapa).map(([g, t]) => `${g} ${t.pc}%${t.n > 1 ? ` (${t.n})` : ''}`).join(' · ') || 'nada'
  const centroTexto = (page) => page.evaluate(() => { const b = document.querySelector('.voz2-texto').getBoundingClientRect(); return [b.x + b.width / 2, b.y + b.height / 2] })

  // Abre la capa tocando el texto, la mide, la cierra tocándola y vuelve a medir.
  async function cicloCapa(page, movil, capaTexto = null) {
    if (capaTexto) await page.evaluate((t) => { const c = document.querySelector('.voz2-capa'); if (c) c.textContent = t }, capaTexto)
    await page.evaluate(V.ARMAR_CONTADOR)
    const a0 = await page.evaluate(V.ANCLAS_VOZ2)
    const sinCapa = (await page.evaluate(V.ESTADO_VOZ2)).siguiente
    await V.tocar(page, movil, ...(await centroTexto(page)))
    await raf2(page)
    const e1 = await page.evaluate(V.ESTADO_VOZ2)
    const a1 = await page.evaluate(V.ANCLAS_VOZ2)
    if (e1.capa.visible) await V.tocar(page, movil, ...centro(e1.capa.caja))
    const e2 = await page.evaluate(V.ESTADO_VOZ2)
    const a2 = await page.evaluate(V.ANCLAS_VOZ2)
    return {
      abre: e1.expanded === 'true' && e1.capa.visible, cierra: e2.expanded === 'false' && !e2.capa.visible, alt: e2.alt,
      textoEntero: e1.capa.texto === e1.texto, glifos: e1.glifos, z: e1.capa.z, pos: e1.capa.pos, caja: e1.capa.caja,
      dAbierta: +dAnclas(a0, a1).toFixed(2), dDespues: +dAnclas(a0, a2).toFixed(2),
      siguiente: e1.siguiente, siguienteSola: sinCapa, tapa: e1.tapa, indicioAbierta: e1.indicio?.visible ?? null,
    }
  }
  const capaOk = (c) => c.abre && c.cierra && c.alt === 2 && c.textoEntero && c.glifos && c.glifos.ok === c.glifos.total && c.glifos.total > 0 &&
    c.dAbierta <= EPS && c.dDespues <= EPS && c.z === '20' && c.pos === 'fixed'
  const fmtCapa = (c) => `abre ${c.abre} · cierra ${c.cierra} · alternancias ${c.alt} · glifos ${c.glifos ? `${c.glifos.ok}/${c.glifos.total} (fuera ${c.glifos.fuera}, tapados ${c.glifos.tapados})` : '—'} · texto entero ${c.textoEntero} · Δ abierta ${c.dAbierta} · Δ después ${c.dDespues} · z ${c.z} ${c.pos}` +
    (c.caja ? ` · capa ${c.caja.w}×${c.caja.h} en (${c.caja.x}, ${c.caja.y})` : '')

  // La forma de prueba: el peor caso; donde el peor caso CABE (1920×1080 m2: 0
  // de 9 recortadas en la 1a), el peor caso dos veces, declarado como «peor ×2».
  // Sin recorte no hay capa que abrir, y una puerta que no abre nada no prueba nada.
  async function formaDePrueba(page, formas) {
    const peor = formas.find((f) => f.id === 'peor').texto
    if (await V.ponerTexto(page, peor) === '1') return { texto: peor, nombre: 'peor caso' }
    const doble = `${peor} ${peor}`
    await V.ponerTexto(page, doble)
    return { texto: doble, nombre: 'peor ×2 (el peor caso cabe)' }
  }

  async function voz2Parte2(page, v, n, formas) {
    const movil = v.movil
    const R = {}
    const e0 = await page.evaluate(V.ESTADO_VOZ2)
    R.real = { texto: e0.texto, marca: e0.marca }
    // 1 · La frase REAL, si está recortada: abrir y cerrar sin inyectar nada.
    if (e0.marca === '1') R.real.capa = await cicloCapa(page, movil)
    // 2 · El peor caso (b) y las exigencias (a).
    const fp = await formaDePrueba(page, formas)
    const peor = fp.texto
    R.forma = fp.nombre
    R.marcaPeor = await V.ponerTexto(page, peor)
    const ePeor = await page.evaluate(V.ESTADO_VOZ2)
    R.indicio = { cerrada: ePeor.indicio }
    R.peor = await cicloCapa(page, movil, peor)
    R.indicio.abierta = R.peor.indicioAbierta
    if (control === 'capa') return R
    // 3 · La rejilla del toque, con el peor caso puesto y la capa cerrada. Sólo
    //     se tocan los puntos que recibe el óvalo (los demás son de otros: el ⋮
    //     del flanco en horizontal, por ejemplo, abriría su menú). Cada toque
    //     abre UNA vez y se cierra con Esc, que así queda probado.
    const pts = await page.evaluate(V.REJILLA_OVALO)
    R.toque = []
    for (const q of pts) {
      const t = { de: q.de, el: q.el, texto: !!q.texto, x: Math.round(q.x), y: Math.round(q.y) }
      if (q.de === 'ovalo') {
        await page.evaluate(V.ARMAR_CONTADOR)
        await V.tocar(page, movil, q.x, q.y)
        const e = await page.evaluate(V.ESTADO_VOZ2)
        t.alt = e.alt; t.abre = e.capa.visible
        await page.keyboard.press('Escape'); await raf2(page)
        const e2 = await page.evaluate(V.ESTADO_VOZ2)
        t.escCierra = !e2.capa.visible && e2.expanded === 'false'
      }
      R.toque.push(t)
    }
    // Cerrar tocando el ÓVALO (no la capa), donde la capa abierta lo deje ver.
    await page.evaluate(V.ARMAR_CONTADOR)
    await V.tocar(page, movil, ...(await centroTexto(page)))
    const libres = (await page.evaluate(V.REJILLA_OVALO)).filter((q) => q.de === 'ovalo')
    if (libres.length) {
      await V.tocar(page, movil, libres[0].x, libres[0].y)
      const e = await page.evaluate(V.ESTADO_VOZ2)
      R.cierraOvalo = { alt: e.alt, cerrada: !e.capa.visible }
    } else {
      R.cierraOvalo = null
      await page.keyboard.press('Escape'); await raf2(page)
    }
    // 4 · Los nombres de rival (los de la frontera, marcados): su toque es suyo.
    R.nombres = []
    for (const nm of await page.evaluate(V.NOMBRES_FRONTERA)) {
      await page.evaluate(V.ARMAR_CONTADOR)
      await V.tocar(page, movil, nm.x, nm.y)
      const e = await page.evaluate(V.ESTADO_VOZ2)
      R.nombres.push({ ...nm, alt: e.alt, abre: e.capa.visible })
      if (e.capa.visible) { await page.keyboard.press('Escape'); await raf2(page) }
    }
    // 5 · El teclado (D13), con locators por rol.
    await V.ponerTexto(page, peor)
    const k = { }
    const boton = page.getByRole('button', { name: peor, exact: true })
    k.botones = await boton.count()
    const leeK = async () => { const e = await page.evaluate(V.ESTADO_VOZ2); return `${e.expanded}/${e.capa.visible ? 'capa' : '—'}` }
    if (k.botones === 1) {
      k.inicial = await leeK()
      await boton.focus()
      await page.keyboard.press('Enter'); await raf2(page); k.enter = await leeK()
      await page.keyboard.press('Space'); await raf2(page); k.espacio = await leeK()
      await page.keyboard.press('Enter'); await raf2(page); k.enter2 = await leeK()
      await page.keyboard.press('Escape'); await raf2(page); k.esc = await leeK()
      const e = await page.evaluate(V.ESTADO_VOZ2)
      k.controls = e.controls; k.capaId = e.capa.id; k.tabindex = e.tabindex; k.apagados = e.apagados
    }
    // 6 · Sin recorte: ni botón, ni capa, ni flechita, y el óvalo no responde.
    const corto = 'Ganas.'
    k.marcaCorta = await V.ponerTexto(page, corto)
    k.botonesCorto = await page.getByRole('button', { name: corto, exact: true }).count()
    await page.evaluate(V.ARMAR_CONTADOR)
    const o = (await page.evaluate(V.ANCLAS_VOZ2)).ovalo
    await V.tocar(page, movil, o.x + o.w / 2, o.y + o.h / 2)
    const eC = await page.evaluate(V.ESTADO_VOZ2)
    k.corto = { role: eC.role, tabindex: eC.tabindex, expanded: eC.expanded, controls: eC.controls, capa: eC.capa.existe, indicio: eC.indicio?.visible ?? null }
    R.a11y = k
    await V.ponerTexto(page, R.real.texto)
    // 7 · «Siguiente mano» con la capa abierta (peor caso, para que haya
    //     recorte en las 20 celdas). Es también la exigencia (a) EN EL ACTO: el
    //     toque llega al botón por su punto, con la capa encima.
    await V.ponerTexto(page, peor)
    await page.evaluate((t) => { const c = document.querySelector('.voz2-capa'); if (c) c.textContent = t }, peor)
    const sigSola = (await page.evaluate(V.ESTADO_VOZ2)).siguiente
    await V.tocar(page, movil, ...(await centroTexto(page)))
    const eS = await page.evaluate(V.ESTADO_VOZ2)
    R.sig = { abierta: eS.capa.visible, boton: eS.siguiente, sola: sigSola }
    if (eS.capa.visible && eS.siguiente.visible) {
      await page.evaluate(V.ARMAR_GRABADORA)
      await V.tocar(page, movil, ...centro(eS.siguiente.caja))
      const t0 = Date.now()
      while (Date.now() - t0 < 45000) {
        if (await page.evaluate(() => window.__voz2Rec.f.some((f) => f.turno && f.t > window.__voz2Rec.toque))) break
        await page.waitForTimeout(250)
      }
      const rec = await page.evaluate(() => window.__voz2Rec)
      const tras = rec.toque == null ? [] : rec.f.filter((f) => f.t > rec.toque)
      const iT = tras.findIndex((f) => f.turno)
      R.sig.fotogramas = tras.length
      R.sig.capaTrasToque = tras.slice(0, 3).map((f) => (f.capa ? 1 : 0)).join('')
      R.sig.cierraEn = tras.findIndex((f) => !f.capa)
      R.sig.reaparece = tras.slice(Math.max(1, R.sig.cierraEn + 1)).some((f) => f.capa)
      R.sig.turno = iT >= 0
      R.sig.turnoMs = iT >= 0 ? Math.round(tras[iT].t - rec.toque) : null
      // 8 · Fuera del resultado el óvalo no responde.
      const o2 = (await page.evaluate(V.ANCLAS_VOZ2)).ovalo
      if (o2) await V.tocar(page, movil, o2.x + o2.w / 2, o2.y + o2.h / 2)
      const eF = await page.evaluate(V.ESTADO_VOZ2)
      R.fuera = { span: eF.hay, capa: eF.capa.existe }
    }
    return R
  }

  // Los veredictos de la parte 2 de una celda.
  function anotaParte2(c) {
    const P = c.parte2
    if (!P) { anota(`voz2.capa ${c.celda}`, false, `sin parte 2${c.error2 ? ': ' + c.error2 : ''}`); return }
    if (control === 'capa') {
      const vio = !capaOk(P.peor) || !tocableOk(P.peor.siguiente, P.peor.siguienteSola)
      anota(`voz2.control[capa] ve el bloqueo ${c.celda}`, vio, `${fmtCapa(P.peor)} · «Siguiente mano»: ${fmtToc(P.peor.siguiente, P.peor.siguienteSola)}`)
      return
    }
    const realTxt = P.real.capa ? `real: ${capaOk(P.real.capa) ? 'ok' : 'FALLA'} (${fmtCapa(P.real.capa)})` : `real «${P.real.texto}» cabe: sin capa`
    anota(`voz2.capa ${c.celda}`, capaOk(P.peor) && (!P.real.capa || capaOk(P.real.capa)), `${P.forma}: ${fmtCapa(P.peor)} · ${realTxt}`)
    anota(`voz2.capa(a) «Siguiente mano» ${c.celda}`, P.peor.abre && tocableOk(P.peor.siguiente, P.peor.siguienteSola) && (!P.real.capa || tocableOk(P.real.capa.siguiente, P.real.capa.siguienteSola)), `con la capa abierta (${P.forma}): ${fmtToc(P.peor.siguiente, P.peor.siguienteSola)}`)
    console.log(`  ·     · voz2.capa(b) ${c.celda} · tapa (${P.forma}): ${fmtTapa(P.peor.tapa)}${P.real.capa ? ` · con la real: ${fmtTapa(P.real.capa.tapa)}` : ''}`)
    const ind = P.indicio
    anota(`voz2.indicio ${c.celda}`, P.marcaPeor === '1' && !!ind.cerrada && ind.cerrada.visible && !ind.cerrada.recortado && ind.cerrada.dentroVp && ind.abierta === false && P.a11y.corto.indicio === false,
      `recogida: visible ${ind.cerrada?.visible} en (${ind.cerrada?.caja.x}, ${ind.cerrada?.caja.y}) recortada por un ancestro ${ind.cerrada?.recortado} · desplegada: visible ${ind.abierta} · sin recorte: visible ${P.a11y.corto.indicio}`)
    const ov = P.toque.filter((t) => t.de === 'ovalo')
    const toqueOk = ov.length > 0 && ov.every((t) => t.alt === 1 && t.abre && t.escCierra) && P.toque.some((t) => t.texto && t.de === 'ovalo') &&
      (P.cierraOvalo === null || (P.cierraOvalo.alt === 2 && P.cierraOvalo.cerrada)) &&
      P.nombres.every((nm) => (!nm.frontera || nm.gana) && nm.alt === 0 && !nm.abre) && P.a11y.corto.capa === false && P.a11y.corto.expanded === null &&
      (!P.fuera || (!P.fuera.span && !P.fuera.capa))
    const otros = P.toque.filter((t) => t.de !== 'ovalo')
    anota(`voz2.toque ${c.celda}`, toqueOk,
      `${ov.filter((t) => t.alt === 1 && t.abre).length}/${ov.length} puntos del óvalo abren con UNA alternancia (Esc cierra ${ov.filter((t) => t.escCierra).length})` +
      `${otros.length ? ` · ${otros.length} puntos de otros: ${[...new Set(otros.map((t) => `${t.de}:${t.el}`))].join(', ')}` : ''}` +
      ` · cerrar tocando el óvalo: ${P.cierraOvalo ? `alternancias ${P.cierraOvalo.alt}, cerrada ${P.cierraOvalo.cerrada}` : 'n/a (la capa lo cubre)'}` +
      ` · nombres tocados ${P.nombres.length} (en la frontera ${P.nombres.filter((nm) => nm.frontera).length})${P.nombres.length ? ` [${P.nombres.map((nm) => `${nm.nombre} a ${nm.dist}px: gana ${nm.gana}, alternancias ${nm.alt}`).join('; ')}]` : ''}` +
      ` · sin recorte: capa ${P.a11y.corto.capa}, aria-expanded ${P.a11y.corto.expanded} · fuera del resultado: ${P.fuera ? `span ${P.fuera.span}, capa ${P.fuera.capa}` : '—'}`)
    const k = P.a11y
    const a11yOk = k.botones === 1 && k.inicial === 'false/—' && k.enter === 'true/capa' && k.espacio === 'false/—' && k.enter2 === 'true/capa' && k.esc === 'false/—' &&
      k.controls === k.capaId && k.tabindex === '0' && k.apagados.length === 0 &&
      k.botonesCorto === 0 && k.corto.role === null && k.corto.tabindex === null && k.corto.controls === null && k.marcaCorta === null
    anota(`voz2.a11y ${c.celda}`, a11yOk,
      `botón con el texto ENTERO ${k.botones} · ${k.inicial} → Enter ${k.enter} → Espacio ${k.espacio} → Enter ${k.enter2} → Esc ${k.esc} · aria-controls=capa ${k.controls === k.capaId} · ancestros apagados ${k.apagados?.length ?? '—'}` +
      ` · sin recorte: botones ${k.botonesCorto}, role ${k.corto.role}, tabindex ${k.corto.tabindex}, aria-controls ${k.corto.controls}`)
    const s = P.sig
    anota(`voz2.siguiente ${c.celda}`, s.abierta && tocableOk(s.boton, s.sola) && s.cierraEn >= 0 && s.cierraEn <= 1 && !s.reaparece && s.turno,
      `capa abierta ${s.abierta} · el toque llega al botón ${fmtToc(s.boton, s.sola)} · capa en los 3 fotogramas tras el toque «${s.capaTrasToque}» (se va en el ${s.cierraEn >= 0 ? s.cierraEn + 1 : '—'}.º) · reaparece ${s.reaparece} · TURNO a los ${s.turnoMs} ms (${s.fotogramas} fotogramas grabados)`)
  }
  const celdas = await V.enPool(tareas, 4, async ([v, n]) => {
    const formas = V.formasVoz2(n)
    const celda = V.etiquetaCelda(v, n)
    let abierta
    try { abierta = await V.abrirCeldaEnPago(browser, v, n, URL_LAMINA, { control }) } catch (e) { return { celda, error: String(e.message || e) } }
    const { ctx, page } = abierta
    try {
      const m = await page.evaluate(V.MEDIR_VOZ2, { formas })
      if (m.error) return { celda, error: m.error }
      const marcas = await V.leerMarcas(page, formas)
      const c1 = V.C1_OVALO[celda]
      const dC1 = V.deltaCaja(m.base.ovalo, { x: c1[0], y: c1[1], w: c1[2], h: c1[3] })
      const porForma = m.formas.map((f) => {
        const d = {}
        for (const k of [...INTERIOR, 'msg']) d[k] = +V.deltaCaja(m.base[k], f.anclas[k]).toFixed(2)
        const noSeVe = f.visibles < f.total
        return { id: f.id, car: f.car, d, visibles: f.visibles, leidos: f.leidos, total: f.total, lineas: f.lineasLayout, marca: marcas?.[f.id] ?? null,
          recorteOk: noSeVe === (marcas?.[f.id] === '1'), interiorOk: INTERIOR.every((k) => d[k] <= EPS) }
      })
      const realNoSeVe = m.glifosReal.visibles < m.glifosReal.total
      const R = {
        celda, quieta: abierta.quieta, original: m.original, glifosReal: m.glifosReal, marcaReal: marcas?.__real ?? null,
        estilo: m.estilo, base: m.base, restaurado: m.restaurado, dC1: +dC1.toFixed(2), porForma,
        c1Ok: dC1 <= EPS,
        ovaloOk: porForma.every((f) => f.interiorOk),
        recorteOk: porForma.every((f) => f.recorteOk) && realNoSeVe === (marcas?.__real === '1'),
        centinela: V.CENTINELAS_C2.includes(celda),
      }
      if (R.centinela) {
        const fs = porForma.filter((f) => V.FORMAS_C2.includes(f.id))
        R.contencionOk = fs.length === V.FORMAS_C2.length && fs.every((f) => f.interiorOk && f.d.msg <= EPS)
        R.contencionDetalle = fs.map((f) => `${f.id}: <p> Δ${f.d.msg} óvalo Δ${f.d.ovalo} pozo Δ${f.d.pozo} comodín Δ${f.d.comodin}`).join(' · ')
      }
      if (!control || control === 'capa') {
        try { R.parte2 = await voz2Parte2(page, v, n, formas) } catch (e) { R.error2 = String(e.message || e) }
      }
      return R
    } finally { await ctx.close() }
  })
  const orden = (c) => tareas.findIndex(([v, n]) => V.etiquetaCelda(v, n) === c.celda)
  celdas.sort((a, b) => orden(a) - orden(b))
  const peorD = (c, k) => Math.max(...c.porForma.map((f) => f.d[k]))
  const MOVIL_54 = ['S25 412x915 m5', 'S25 412x915 m4', '390x844 m5', '390x844 m4', '360x640 m5', '360x640 m4']
  for (const c of celdas) {
    if (c.error) { anota(`${etq} ${c.celda}`, false, `ERROR ${c.error}`); continue }
    const recortadas = c.porForma.filter((f) => f.marca === '1').map((f) => f.id)
    const resumen = `óvalo Δmax ${peorD(c, 'ovalo')} · pozo ${peorD(c, 'pozo')} · igualar ${peorD(c, 'igualar')} · comodín ${peorD(c, 'comodin')}`
    const info = `<p> Δmax ${peorD(c, 'msg')} (no puntúa: C-3/C-4) · ${c.estilo.fontSize}/${c.estilo.lineHeight} alto ${c.estilo.pAlto} · justify-self ${c.estilo.justifySelf}`
    const recorte = `recortadas ${recortadas.length}/${c.porForma.length} [${recortadas.join(', ')}] · real «${c.original}» ve ${c.glifosReal.visibles}/${c.glifosReal.total} marca ${c.marcaReal}` +
      c.porForma.filter((f) => !f.recorteOk).map((f) => ` · ✗${f.id}: ve ${f.visibles}/${f.total}, marca ${f.marca}`).join('')
    if (!control) {
      anota(`voz2.c1 ${c.celda}`, c.c1Ok, `Δ contra la tabla C1 = ${c.dC1} px`)
      anota(`voz2.ovalo ${c.celda}`, c.ovaloOk, `${resumen} · ${info}`)
      anota(`voz2.recorte ${c.celda}`, c.recorteOk, recorte)
      if (c.centinela) anota(`voz2.contencion ${c.celda}`, c.contencionOk, c.contencionDetalle)
      anotaParte2(c)
    } else if (control === 'capa') {
      anotaParte2(c)
    } else {
      // Control: se exige que la puerta VEA el movimiento donde la Fase 0 lo
      // midió (C-2 sin contención; los 906 px con el recorte ingenuo). El resto
      // se imprime como dato, sin veredicto.
      const espera = control === 'contain' ? c.centinela : MOVIL_54.includes(c.celda)
      const vio = control === 'contain' ? c.contencionOk === false : c.ovaloOk === false
      if (espera) anota(`${etq} ve el movimiento ${c.celda}`, vio, `${resumen} · ${c.contencionDetalle ?? info}`)
      else console.log(`  ·     · ${etq} ${c.celda} (dato) · ${resumen} · ${c.ovaloOk ? 'Δ0' : 'SE MUEVE'}`)
    }
  }

  // ── 1b · voz2.burbuja: la recarga con la capa abierta (D10, exigencia a) ──
  // En el servidor de desarrollo (VOZ2_DEV, por defecto el 5173): `?apu=` no
  // existe en `dist/`. Por celda: la capa se abre ANTES de que salga la burbuja
  // y se comprueba que la burbuja no la cierra; con la capa abierta la burbuja
  // se ve y recibe los nueve toques; tocarla abre la tarjeta, la capa se recoge
  // y la tarjeta queda encima; «Ver la mesa» (si la tarjeta lo ofrece) la pliega
  // y la capa NO vuelve sola. Sólo en la corrida normal (`--sin-burbuja` la salta).
  if (!control && !process.argv.includes('--sin-burbuja')) {
    const DEV = process.env.VOZ2_DEV || 'http://localhost:5173'
    console.log(`\n── voz2.burbuja · ${DEV} (?apu=saldo:5000,recarga) ──`)
    const bur = await V.enPool(tareas, 4, async ([v, n]) => {
      const celda = V.etiquetaCelda(v, n)
      let ab
      try { ab = await V.abrirCeldaConBurbuja(browser, v, n, DEV) } catch (e) { return { celda, error: String(e.message || e) } }
      const { ctx, page } = ab
      const movil = v.movil
      const R = { celda, intentos: ab.intentos }
      try {
        // La frase llega con el pago; la capa se abre en cuanto hay texto.
        const t0 = Date.now()
        while (Date.now() - t0 < 8000 && !(await page.evaluate(() => !!document.querySelector('.voz2-texto')))) await page.waitForTimeout(100)
        R.burbujaAntes = await page.evaluate(() => !!document.querySelector('[data-accion="recarga-burbuja"]'))
        const fp = await formaDePrueba(page, V.formasVoz2(n))
        const peor = fp.texto
        R.forma = fp.nombre
        R.marca = await V.ponerTexto(page, peor)
        await page.evaluate((t) => { const c = document.querySelector('.voz2-capa'); if (c) c.textContent = t }, peor)
        await V.tocar(page, movil, ...(await centroTexto(page)))
        R.abiertaAntes = (await page.evaluate(V.ESTADO_VOZ2)).capa.visible
        R.salio = await V.esperarBurbuja(page)
        const e1 = await page.evaluate(V.ESTADO_VOZ2)
        // Si el toque cortó la celebración y la capa se abrió tarde, se vuelve a
        // abrir ahora (lo que se mide abajo es la convivencia, no el reloj).
        R.sigueAbierta = e1.capa.visible
        // La burbuja SIN capa (Esc la recoge), para comparar; y se vuelve a abrir.
        if (e1.capa.visible) { await page.keyboard.press('Escape'); await raf2(page) }
        R.burbujaSola = (await page.evaluate(V.ESTADO_VOZ2)).burbuja
        await V.tocar(page, movil, ...(await centroTexto(page)))
        const e2 = await page.evaluate(V.ESTADO_VOZ2)
        R.abierta = e2.capa.visible
        R.burbuja = e2.burbuja
        R.tapa = e2.tapa
        if (e2.burbuja.visible) {
          await V.tocar(page, movil, ...centro(e2.burbuja.caja))
          const t1 = Date.now()
          while (Date.now() - t1 < 3000 && !(await page.evaluate(() => !!document.querySelector('[data-accion="recarga"]')))) await page.waitForTimeout(80)
          await page.waitForTimeout(500)
          const e3 = await page.evaluate(() => {
            const m = document.querySelector('.bankrupt-modal')
            const b = m?.getBoundingClientRect()
            const h = b ? document.elementFromPoint(b.x + b.width / 2, b.y + b.height / 2) : null
            const c = document.querySelector('.voz2-capa')
            return { tarjeta: !!m, encima: !!h && !!m && m.contains(h), plegable: !!document.querySelector('[data-accion="recarga-ver-mesa"]'),
              capa: !!c && !c.hidden, expanded: document.querySelector('.voz2-texto')?.getAttribute('aria-expanded') ?? null }
          })
          R.tarjeta = e3
          if (e3.plegable) {
            await page.evaluate(() => document.querySelector('[data-accion="recarga-ver-mesa"]')?.click())
            await page.waitForTimeout(400)
            R.plegada = await page.evaluate(() => {
              const c = document.querySelector('.voz2-capa')
              return { burbuja: !!document.querySelector('[data-accion="recarga-burbuja"]'), capa: !!c && !c.hidden }
            })
          }
        }
        return R
      } catch (e) { return { ...R, error: String(e.message || e) } } finally { await ctx.close() }
    })
    bur.sort((a, b) => orden(a) - orden(b))
    for (const r of bur) {
      if (r.error && !r.burbuja) { anota(`voz2.burbuja ${r.celda}`, false, `ERROR ${r.error}`); continue }
      anota(`voz2.capa(a) burbuja ${r.celda}`, r.abierta && tocableOk(r.burbuja, r.burbujaSola), `capa abierta ${r.abierta} (${r.forma}) · burbuja ${fmtToc(r.burbuja, r.burbujaSola)}`)
      const t = r.tarjeta || {}
      const ok = r.salio && r.abierta && (r.abiertaAntes ? r.sigueAbierta : true) && t.tarjeta && t.encima && !t.capa && t.expanded === 'false' && (!r.plegada || !r.plegada.capa)
      anota(`voz2.burbuja ${r.celda}`, ok,
        `capa abierta antes de la burbuja ${r.abiertaAntes} → sigue abierta al salir la burbuja ${r.sigueAbierta} · tarjeta ${t.tarjeta} encima ${t.encima} · capa recogida ${t.capa === false} (aria-expanded ${t.expanded})` +
        `${r.plegada ? ` · «Ver la mesa»: burbuja ${r.plegada.burbuja}, la capa no vuelve ${!r.plegada.capa}` : ' · sin «Ver la mesa»'} · ${r.intentos} intento(s)${r.error ? ' · ' + r.error : ''}`)
      console.log(`  ·     · voz2.capa(b) burbuja ${r.celda} · tapa (${r.forma}): ${fmtTapa(r.tapa || {})}`)
    }
    resultados.bloques['voz2-burbuja'] = bur
    writeFileSync(`${SALIDA}/voz2-burbuja.json`, JSON.stringify({ edge: browser.version(), base: DEV, celdas: bur }, null, 2))
  }
  const nombreJson = control ? `voz2-control-${control}.json` : 'voz2.json'
  resultados.bloques[control ? `voz2-control-${control}` : 'voz2'] = { control, celdas }
  writeFileSync(`${SALIDA}/${nombreJson}`, JSON.stringify({ edge: browser.version(), control, celdas }, null, 2))
  console.log(`  JSON: ${SALIDA}/${nombreJson}`)
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

// ARN-3a · D5 · 0 todo verde · 1 alguna medición en rojo (también los rojos
// conocidos, como `1.8b`: un rojo dice rojo) · 2 si no se anotó nada.
const codigo = codigoDeSalida(anotadas === 0 ? [] : [fallos.length ? 'rojo' : 'verde'])
console.log(`── diagPUE ${modo} · ${anotadas} mediciones · ${fallos.length} en rojo → código ${codigo}`)
await terminar(codigo)
