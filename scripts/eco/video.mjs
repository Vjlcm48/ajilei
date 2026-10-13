// ── ECO-1g · el modo `video` de diagDSK ─────────────────────────────────────
// Rector: AJILEI_ECO-1_Fase1g_v1.0.md §2.3, con la respuesta P-1 al plan del
// STOP-1. Vive en su módulo, como `mesaia` y `constancia`; diagDSK sólo lo
// llama y lee su veredicto por `verde`.
//
// Contra el bundle REAL (`vite preview`) con la sesión simulada de CAP: la app
// usa la API de verdad (`lib/videoApi`) y contesta el banco imitado de cada
// contexto (`contextoCap`), el contrato de la migración eco1g en JS.
//
// LOS VIDEOS DURAN 40 s DE VERDAD (P-1). En la build no existe el mando que los
// acorta (`?apu=video:` es de desarrollo y la guardia de `dist/` lo prohíbe), y
// el banco exige sus 35 s. Por eso los recorridos que ven un video entero
// corren EN PARALELO, cada uno en su contexto y con su banco sembrado: todos
// juntos tardan lo que el más largo (unos 80 s), no la suma.
//
//   video.1  desde Retar sin saldo: completar → +500 con la celebración,
//            «Te quedan 7 de 8 hoy», UNA línea `video` en el libro y la píldora
//            sin bajar nunca; el video duró sus 40 s
//   video.2  la ✕ → «Salir»: ni saldo ni contador cambian y no se llama al
//            cobro; mientras la confirmación está abierta el reloj no corre;
//            → «Seguir viendo»: completa y cobra
//   video.3  el «+» → la hoja → el video, desde el lobby; el «Pronto» ya no sale
//   video.4  no hay video (la red caída al pedir): el mensaje T7, sin abrir la
//            capa, y nada cambia
//   video.5  el octavo: fila y botón de Retar apagados con «Vuelven en…»,
//            calculado con el reloj del banco
//   video.6  el cobro repetido y `limite` forzado en el cobro (S3, K7): un solo
//            movimiento y el mismo boleto; «Guardando tu premio…» sin ✕ durante
//            la primera tanda; tras ella, la ✕ y «Salir» abandonan sin contar
//   video.7  pedir con un boleto vivo: el viejo, anulado (S1)
//   video.8  la hoja del «+» con el nombre de 15 «W» y el contador de Retar, en
//            las siete vistas. El contador se mide con el nombre corriente: con
//            el de 15 «W» la barra de las pantallas de salas desborda por su
//            cuenta (el arreglo de la 1d es sólo del lobby), y eso se INFORMA
//            aparte, sin teñir esta vara
//   video.aux  los tres mandos de desarrollo (`?apu=video:<ms>|sin|cierra`),
//            contra el servidor de desarrollo con bypass
//   consola  sin errores (los 503 que provoca el propio arnés no cuentan)
//
// LO QUE ESTE MODO NO PUEDE MEDIR: la pausa con la pestaña oculta o la pantalla
// bloqueada (G8). Playwright no oculta una pestaña (FRZ-1). Se valida en el
// teléfono (informe de la 1g, prueba 3).

import { contextoCap, PERFIL_CAP } from '../cap/capMesa.mjs'
import { crearBanco } from '../arnes/nucleo.mjs'
import { videoReinicioSQL, VIDEO_MINIMO_S_SQL } from '../../src/dev/bancoImitado.js'
import { tiempoPartes } from '../../src/hooks/videoCore.js'
import { montoTexto } from '../../src/config/tapetes.js'
import { AJILEI_CONFIG } from '../../src/config/ajileiConfig.js'

const VP = { w: 412, h: 915, dpr: 1, movil: true }
const DURACION_MS = AJILEI_CONFIG.economy.video.duracionMs
const PREMIO = 500
const RUIDO_ARNES = /status of 503|Failed to load resource/
// Las siete vistas de la lámina de la 1f (H-3).
const VISTAS = [
  { id: '1920x1080', w: 1920, h: 1080, dpr: 1 },
  { id: '412x915', w: 412, h: 915, dpr: 1, movil: true },
  { id: '915x412', w: 915, h: 412, dpr: 1, movil: true },
  { id: '390x844', w: 390, h: 844, dpr: 1, movil: true },
  { id: '360x640', w: 360, h: 640, dpr: 1, movil: true },
  { id: '744x1133', w: 744, h: 1133, dpr: 1, movil: true },
  { id: '1133x744', w: 1133, h: 744, dpr: 1, movil: true },
]
const NOMBRE_ANCHO = 'WWWWWWWWWWWWWWW'

const numeroDe = (t) => Number(String(t ?? '').replace(/\D/g, '')) || 0
const movs = (banco) => banco.libro.filter((l) => l.tipo === 'video')
const llamadasDe = (b, nombre) => (b.llamadas ?? []).filter((l) => l.nombre === nombre)
const codigos = (b, nombre) => llamadasDe(b, nombre).map((l) => l.codigo)
const vivos = (banco) => banco.boletos.filter((x) => x.cobrado_en === null && x.anulado_en === null)

// Muestrea CADA cuadro desde que nace la página: la cifra de la píldora, y si
// hay capa, cobro, celebración o aviso. Deja decir «nunca baja» y «nunca los
// dos a la vez» sin depender de cuándo mira el arnés.
const MUESTREO = () => {
  window.__muestras = []
  const paso = () => {
    if (window.__muestras.length < 12000) {
      window.__muestras.push({
        t: Math.round(performance.now()),
        pildora: document.querySelector('.lob-pildora .bd-num')?.textContent?.trim() ?? null,
        capa: document.querySelector('[data-accion="video"]')?.dataset.fase ?? null,
        cel: !!document.querySelector('[data-accion="video-celebracion"] .vid-cel-tarjeta'),
        avisos: document.querySelectorAll('.avs').length,
        toast: !!document.querySelector('.sal-toast.is-on, .lob-toast.is-on'),
      })
    }
    requestAnimationFrame(paso)
  }
  requestAnimationFrame(paso)
}

function leerMuestras(m) {
  const cifras = m.map((x) => x.pildora).filter((p) => p && /\d/.test(p)).map(numeroDe)
  return {
    cuadros: m.length,
    baja: cifras.some((c, i) => i > 0 && c < cifras[i - 1]),
    primera: cifras[0] ?? null,
    ultima: cifras[cifras.length - 1] ?? null,
    distintas: new Set(cifras).size,
    celYAviso: m.some((x) => x.cel && x.avisos > 0),
    toast: m.some((x) => x.toast),
  }
}

async function contexto(browser, base, billetera, errores, { vista = VP, perfil = PERFIL_CAP } = {}) {
  const { ctx, page } = await contextoCap(browser, vista, base, { billetera, perfil })
  page.on('pageerror', (e) => errores.push(`pageerror: ${e.message}`))
  page.on('console', (m) => { if (m.type() === 'error' && !RUIDO_ARNES.test(m.text())) errores.push(`console: ${m.text()}`) })
  await page.addInitScript(MUESTREO)
  return { ctx, page }
}
async function abrir(page, base) {
  await page.goto(base)
  await page.waitForSelector('main.lobby .lob-pildora[data-saldo="listo"]')
}
const muestras = (page) => page.evaluate(() => window.__muestras ?? [])
const pildora = async (page) => (await page.textContent('.lob-pildora .bd-num'))?.trim()
const texto = async (page, sel) => (await page.textContent(sel).catch(() => null))?.trim() ?? null

// El «+» → la hoja, con el contador ya contestado por `mi_video`.
async function abrirHoja(page) {
  await page.click('.lob-pildora [data-accion="tienda"]')
  await page.waitForSelector('[data-accion="hoja-monedas"]')
  await page.waitForFunction(() => /\d/.test(document.querySelector('[data-accion="hoja-monedas"] [data-accion="video-quedan"]')?.textContent ?? ''), null, { timeout: 10000 })
}
const leerHoja = (page) => page.evaluate(() => {
  const h = document.querySelector('[data-accion="hoja-monedas"]')
  if (!h) return null
  const fila = h.querySelector('[data-accion="video-pedir"]')
  return {
    titulo: h.querySelector('.vid-hoja-t')?.textContent?.trim(),
    video: fila?.querySelector('b')?.textContent?.trim(),
    contador: fila?.querySelector('[data-accion="video-quedan"]')?.textContent?.trim(),
    premio: fila?.querySelector('.vid-fila-premio')?.textContent?.trim(),
    apagada: fila?.disabled === true,
    paquetes: h.querySelector('[data-accion="paquetes"] b')?.textContent?.trim(),
    pastilla: h.querySelector('[data-accion="paquetes"] .vid-pastilla')?.textContent?.trim(),
  }
})
async function irARetar(page) {
  await page.click('[data-accion="jugar-ia"]')
  await page.waitForSelector('[data-accion="reto"]')
}
// El bloque de saldo de Retar, con el contador ya contestado.
async function bloqueRetar(page) {
  await page.waitForSelector('.sal-saldo [data-accion="mas-monedas"]', { timeout: 10000 })
  await page.waitForFunction(() => /\d/.test(document.querySelector('.sal-saldo [data-accion="video-quedan"]')?.textContent ?? ''), null, { timeout: 10000 })
  return page.evaluate(() => {
    const b = document.querySelector('.sal-saldo[data-accion="aviso-saldo"]')
    const boton = b.querySelector('[data-accion="mas-monedas"]')
    return {
      boton: boton.textContent.trim(),
      apagado: boton.disabled === true,
      contador: b.querySelector('[data-accion="video-quedan"]').textContent.trim(),
    }
  })
}
const capaCorriendo = (page) => page.waitForSelector('[data-accion="video"][data-fase="corriendo"]', { timeout: 10000 })
const leerCapa = (page) => page.evaluate(() => ({
  marca: document.querySelector('[data-accion="video-marca"]')?.textContent?.trim(),
  falta: document.querySelector('[data-accion="video-falta"]')?.textContent?.trim(),
  consejo: document.querySelector('[data-accion="video-consejo"]')?.textContent?.trim(),
  pie: document.querySelector('.vid-capa .vid-premio')?.textContent?.trim(),
  sinPantallaCompleta: document.querySelector('[data-accion="video"]')?.closest('[data-sin-pantalla-completa]') !== null,
}))
// Espera a la celebración, la lee y espera a que se vaya.
async function celebracion(page, timeout = 100000) {
  await page.waitForSelector('[data-accion="video-celebracion"] .vid-cel-tarjeta', { timeout })
  const t = Date.now()
  const tarjeta = await page.evaluate(() => {
    const c = document.querySelector('[data-accion="video-celebracion"]')
    return {
      premio: c.querySelector('[data-accion="video-cel-premio"]')?.textContent?.trim(),
      sub: c.querySelector('.vid-cel-sub')?.textContent?.trim(),
      contador: c.querySelector('[data-accion="video-quedan"]')?.textContent?.trim(),
    }
  })
  await page.waitForSelector('[data-accion="video-celebracion"]', { state: 'detached', timeout: 10000 })
  return { ...tarjeta, duroMs: Date.now() - t }
}

export async function runVideo(browser, { base, baseDev = null, externo = false, out = 'capturas-video' }) {
  const puntos = {}
  const errores = []
  // `sinCobertura` es de ESTA corrida (algo que tocaba medir y no se midió).
  // `noMide` es del instrumento, siempre: se declara y no tiñe el veredicto.
  const sinCobertura = []
  const noMide = [
    'la pausa con la pestaña oculta o la pantalla bloqueada (G8): Playwright no oculta una pestaña (FRZ-1); se valida en el teléfono',
  ]

  // ════ Los recorridos que ven un video entero, EN PARALELO ══════════════════

  // ── video.1 · desde Retar sin saldo ───────────────────────────────────────
  const r1 = async () => {
    const b = { saldo: 300 }
    const { ctx, page } = await contexto(browser, base, b, errores)
    try {
      await abrir(page, base)
      await irARetar(page)
      const antes = await bloqueRetar(page)
      await page.screenshot({ path: `${out}/video1-retar.png` })
      await page.click('.sal-saldo [data-accion="mas-monedas"]')
      await capaCorriendo(page)
      const t0 = Date.now()
      await page.waitForTimeout(1500)
      const capa = await leerCapa(page)
      await page.screenshot({ path: `${out}/video1-capa.png` })
      const cel = await celebracion(page)
      const duracion = Date.now() - cel.duroMs - t0
      await page.waitForTimeout(300)
      const fila = leerMuestras(await muestras(page))
      const fin = { pildora: await pildora(page), bloque: await page.locator('.sal-saldo [data-accion="mas-monedas"]').count() }
      puntos['video.1'] = {
        antes, capa, cel, duracion, fila, fin, saldo: b.banco.saldo, libro: movs(b.banco), cobros: codigos(b, 'cobrar_boleto'),
        ok: antes.boton === `Ver un video · +${montoTexto(PREMIO)} HC` && antes.contador === 'Te quedan 8 de 8 hoy' && !antes.apagado
          && capa.marca === 'Video de prueba' && /^Faltan \d+ s$/.test(capa.falta) && capa.pie === `+${montoTexto(PREMIO)} HC al terminar`
          && !capa.sinPantallaCompleta && (capa.consejo ?? '').length > 10
          // 40 s de verdad: en la build no hay mando que lo acorte.
          && duracion >= DURACION_MS - 1500 && duracion >= VIDEO_MINIMO_S_SQL * 1000
          && cel.premio === `+${montoTexto(PREMIO)} HC` && cel.sub === '¡Video completado!' && cel.contador === 'Te quedan 7 de 8 hoy'
          && movs(b.banco).length === 1 && movs(b.banco)[0].monto === PREMIO && b.banco.saldo === 800
          && codigos(b, 'cobrar_boleto').join(',') === 'ok'
          // La píldora cuenta de 300 a 800 y no baja nunca; al cobrar ya alcanza y el bloque se va.
          && !fila.baja && fila.primera === 300 && fila.ultima === 800 && fila.distintas > 5
          && !fila.celYAviso && fin.pildora === montoTexto(800) && fin.bloque === 0,
      }
    } finally { await ctx.close() }
  }

  // ── video.2 · video.7 · la ✕ → «Salir», y otra vez → «Seguir viendo» ──────
  const r27 = async () => {
    const b = { saldo: 2500 }
    const { ctx, page } = await contexto(browser, base, b, errores)
    try {
      await abrir(page, base)
      await abrirHoja(page)
      await page.click('[data-accion="hoja-monedas"] [data-accion="video-pedir"]')
      await capaCorriendo(page)
      await page.waitForTimeout(4000)
      await page.click('[data-accion="video-cerrar"]')
      await page.waitForSelector('[data-accion="video-confirma"]')
      const confirma = {
        texto: await texto(page, '[data-accion="video-confirma"] .vid-dialogo-t'),
        seguir: await texto(page, '[data-accion="video-confirma"] [data-accion="video-seguir"]'),
        salir: await texto(page, '[data-accion="video-confirma"] [data-accion="video-salir"]'),
        f1: await texto(page, '[data-accion="video-falta"]'),
      }
      await page.waitForTimeout(2500)
      confirma.f2 = await texto(page, '[data-accion="video-falta"]')
      await page.screenshot({ path: `${out}/video2-confirma.png` })
      await page.click('[data-accion="video-salir"]')
      await page.waitForSelector('[data-accion="video"]', { state: 'detached' })
      await page.waitForTimeout(600)
      await abrirHoja(page)
      const trasSalir = {
        pildora: await pildora(page), hoja: (await leerHoja(page)).contador, saldo: b.banco.saldo, libro: movs(b.banco).length,
        cobros: llamadasDe(b, 'cobrar_boleto').length, cel: await page.locator('[data-accion="video-celebracion"]').count(),
        boletos: b.banco.boletos.length, vivos: vivos(b.banco).length,
      }
      const viejo = b.banco.boletos[0]?.id
      // Otra vez: el pedido anula el boleto que quedó vivo (S1, video.7).
      await page.click('[data-accion="hoja-monedas"] [data-accion="video-pedir"]')
      await capaCorriendo(page)
      const trasPedir = {
        boletos: b.banco.boletos.length,
        viejoAnulado: b.banco.boletos.find((x) => x.id === viejo)?.anulado_en !== null,
        vivos: vivos(b.banco).map((x) => x.id),
      }
      // El viejo ya no se cobra (lo que recibiría el otro dispositivo).
      const cobroViejo = b.banco.llamar('cobrar_boleto', { p_boleto: viejo }).codigo
      await page.waitForTimeout(3000)
      await page.click('[data-accion="video-cerrar"]')
      await page.waitForSelector('[data-accion="video-confirma"]')
      await page.click('[data-accion="video-confirma"] [data-accion="video-seguir"]')
      await capaCorriendo(page)
      const cel = await celebracion(page)
      await page.waitForTimeout(300)
      const fila = leerMuestras(await muestras(page))
      const fin = { pildora: await pildora(page), saldo: b.banco.saldo, libro: movs(b.banco).length, cobros: codigos(b, 'cobrar_boleto') }
      puntos['video.2'] = {
        confirma, trasSalir, cel, fin, fila,
        ok: confirma.texto === `Si sales ahora, no ganas los ${montoTexto(PREMIO)} HC.` && confirma.seguir === 'Seguir viendo' && confirma.salir === 'Salir'
          // Con la confirmación abierta el reloj no corre.
          && confirma.f1 === confirma.f2 && /^Faltan \d+ s$/.test(confirma.f1)
          // «Salir»: ni saldo ni contador, y ni una llamada al cobro.
          && trasSalir.pildora === montoTexto(2500) && trasSalir.hoja === 'Te quedan 8 de 8 hoy' && trasSalir.saldo === 2500
          && trasSalir.libro === 0 && trasSalir.cobros === 0 && trasSalir.cel === 0
          // «Seguir viendo»: completa y cobra.
          && cel.contador === 'Te quedan 7 de 8 hoy' && fin.saldo === 3000 && fin.libro === 1 && fin.pildora === montoTexto(3000)
          && fin.cobros.join(',') === 'ok' && !fila.baja && fila.ultima === 3000,
      }
      puntos['video.7'] = {
        viejo, trasSalir: { boletos: trasSalir.boletos, vivos: trasSalir.vivos }, trasPedir, cobroViejo,
        fin: b.banco.boletos.map((x) => ({ cobrado: x.cobrado_en !== null, anulado: x.anulado_en !== null })),
        ok: trasSalir.boletos === 1 && trasSalir.vivos === 1
          && trasPedir.boletos === 2 && trasPedir.viejoAnulado === true && trasPedir.vivos.length === 1 && trasPedir.vivos[0] !== viejo
          && cobroViejo === 'anulado'
          && b.banco.boletos.length === 2 && b.banco.boletos[0].anulado_en !== null && b.banco.boletos[0].cobrado_en === null
          && b.banco.boletos[1].cobrado_en !== null && movs(b.banco).length === 1,
      }
    } finally { await ctx.close() }
  }

  // ── video.3 · el «+» → la hoja → el video, desde el lobby ─────────────────
  const r3 = async () => {
    const b = { saldo: 2500 }
    const { ctx, page } = await contexto(browser, base, b, errores)
    try {
      await abrir(page, base)
      const mas = await page.evaluate(() => {
        const m = document.querySelector('.lob-pildora [data-accion="tienda"]')
        return { aria: m?.getAttribute('aria-label'), popup: m?.getAttribute('aria-haspopup') }
      })
      await abrirHoja(page)
      const hoja = await leerHoja(page)
      await page.waitForTimeout(350)
      await page.screenshot({ path: `${out}/video3-hoja.png` })
      await page.click('[data-accion="hoja-monedas"] [data-accion="video-pedir"]')
      await capaCorriendo(page)
      const hojaCerrada = (await page.locator('[data-accion="hoja-monedas"]').count()) === 0
      const cel = await celebracion(page)
      await page.screenshot({ path: `${out}/video3-fin.png` })
      await page.waitForTimeout(300)
      const fila = leerMuestras(await muestras(page))
      await abrirHoja(page)
      const despues = await leerHoja(page)
      puntos['video.3'] = {
        mas, hoja, hojaCerrada, cel, fila, despues, saldo: b.banco.saldo, libro: movs(b.banco).length,
        ok: mas.aria === 'Conseguir monedas' && mas.popup === 'dialog'
          && hoja.titulo === 'Conseguir monedas' && hoja.video === 'Ver un video' && hoja.contador === 'Te quedan 8 de 8 hoy'
          && hoja.premio === `+${montoTexto(PREMIO)} HC` && !hoja.apagada
          && hoja.paquetes === 'Paquetes de monedas' && hoja.pastilla === 'Pronto'
          && hojaCerrada && !fila.toast
          && cel.premio === `+${montoTexto(PREMIO)} HC` && cel.contador === 'Te quedan 7 de 8 hoy'
          && b.banco.saldo === 3000 && movs(b.banco).length === 1 && !fila.baja && fila.primera === 2500 && fila.ultima === 3000
          && despues.contador === 'Te quedan 7 de 8 hoy',
      }
    } finally { await ctx.close() }
  }

  // ── video.5 · el octavo ───────────────────────────────────────────────────
  const r5 = async () => {
    const banco = crearBanco({ saldo: 300 })
    banco.sembrarVideosCobrados(7)
    const b = { saldo: 300, banco }
    const { ctx, page } = await contexto(browser, base, b, errores)
    try {
      await abrir(page, base)
      await abrirHoja(page)
      const antes = await leerHoja(page)
      await page.click('[data-accion="hoja-monedas"] [data-accion="video-pedir"]')
      await capaCorriendo(page)
      const cel = await celebracion(page)
      await abrirHoja(page)
      const hoja = await leerHoja(page)
      // Lo que falta hasta la medianoche de Chicago, con el reloj del BANCO.
      const ahora = Date.now()
      const esperado = [0, -60000, 60000].map((d) => {
        const { h, m } = tiempoPartes(videoReinicioSQL(ahora) - ahora + d)
        return h > 0 ? `Vuelven en ${h} h ${m} min` : `Vuelven en ${m} min`
      })
      await page.waitForTimeout(350)
      await page.screenshot({ path: `${out}/video5-hoja.png` })
      // La fila apagada no pide nada.
      const pedidos = llamadasDe(b, 'pedir_boleto').length
      await page.click('[data-accion="hoja-monedas"] [data-accion="video-pedir"]', { force: true }).catch(() => {})
      await page.waitForTimeout(400)
      const pedidosTras = llamadasDe(b, 'pedir_boleto').length
      await page.keyboard.press('Escape')
      await page.waitForSelector('[data-accion="hoja-monedas"]', { state: 'detached' })
      // En Retar, con un reto que no alcanza (Pro, con 800): el botón apagado
      // con el mismo texto en la misma caja.
      await irARetar(page)
      await page.click('[data-accion="reto"]:nth-of-type(3)')
      const retar = await bloqueRetar(page)
      await page.screenshot({ path: `${out}/video5-retar.png` })
      await page.click('.sal-saldo [data-accion="mas-monedas"]', { force: true }).catch(() => {})
      await page.waitForTimeout(400)
      puntos['video.5'] = {
        antes: antes.contador, cel, hoja, esperado, retar, pedidos, pedidosTras, pedidosFin: llamadasDe(b, 'pedir_boleto').length,
        saldo: banco.saldo, libro: movs(banco).length, capa: await page.locator('[data-accion="video"]').count(),
        ok: antes.contador === 'Te queda 1 de 8 hoy' && !antes.apagada
          && esperado.includes(cel.contador) && banco.saldo === 800 && movs(banco).length === 1
          && hoja.apagada === true && esperado.includes(hoja.contador)
          && pedidosTras === pedidos && llamadasDe(b, 'pedir_boleto').length === pedidos
          && retar.apagado === true && esperado.includes(retar.contador)
          && (await page.locator('[data-accion="video"]').count()) === 0,
      }
    } finally { await ctx.close() }
  }

  // ── video.6 · el cobro repetido y `limite` forzado (S3, K7, P-2) ──────────
  const leerCobro = (page) => page.evaluate(() => ({
    fase: document.querySelector('[data-accion="video"]')?.dataset.fase ?? null,
    guardando: document.querySelector('[data-accion="video-guardando"]')?.textContent?.trim() ?? null,
    x: !!document.querySelector('[data-accion="video-cobro-cerrar"]'),
  }))
  // a · el cobro entra y su respuesta se pierde: el reintento recibe `ya_cobrado`.
  const r6a = async () => {
    const b = { saldo: 2500, cortes: { cobrar_boleto: { veces: 1, modo: 'despues' } } }
    const { ctx, page } = await contexto(browser, base, b, errores)
    try {
      await abrir(page, base)
      await abrirHoja(page)
      await page.click('[data-accion="hoja-monedas"] [data-accion="video-pedir"]')
      await capaCorriendo(page)
      await page.waitForSelector('[data-accion="video"][data-fase="cobrando"]', { timeout: 100000 })
      const cobro = await leerCobro(page)
      const cel = await celebracion(page, 20000)
      await page.waitForTimeout(300)
      const fila = leerMuestras(await muestras(page))
      const ll = llamadasDe(b, 'cobrar_boleto')
      return {
        cobro, cel, fila, codigos: ll.map((l) => l.codigo), boletos: [...new Set(ll.map((l) => l.params?.p_boleto))].length,
        saldo: b.banco.saldo, libro: movs(b.banco).length, pildora: await pildora(page),
        ok: cobro.fase === 'cobrando' && cobro.x === false
          && ll.map((l) => l.codigo).join(',') === 'corte-despues,ya_cobrado' && new Set(ll.map((l) => l.params?.p_boleto)).size === 1
          && movs(b.banco).length === 1 && b.banco.saldo === 3000
          && cel.premio === `+${montoTexto(PREMIO)} HC` && cel.contador === 'Te quedan 7 de 8 hoy'
          && !fila.baja && fila.ultima === 3000 && (await pildora(page)) === montoTexto(3000),
      }
    } finally { await ctx.close() }
  }
  // b · `limite` dos veces en el cobro: se reintenta el mismo boleto y cobra una vez.
  const r6b = async () => {
    const banco = crearBanco({ saldo: 2500 })
    const b = { saldo: 2500, banco }
    const { ctx, page } = await contexto(browser, base, b, errores)
    try {
      await abrir(page, base)
      await abrirHoja(page)
      await page.click('[data-accion="hoja-monedas"] [data-accion="video-pedir"]')
      await capaCorriendo(page)
      banco.forzarLimite('cobrar_boleto', 2)
      await page.waitForSelector('[data-accion="video"][data-fase="cobrando"]', { timeout: 100000 })
      await page.waitForTimeout(1200)
      const cobro = await leerCobro(page)
      await page.screenshot({ path: `${out}/video6-guardando.png` })
      const cel = await celebracion(page, 20000)
      const ll = llamadasDe(b, 'cobrar_boleto')
      return {
        cobro, cel, codigos: ll.map((l) => l.codigo), boletos: [...new Set(ll.map((l) => l.params?.p_boleto))].length,
        saldo: banco.saldo, libro: movs(banco).length,
        ok: cobro.fase === 'cobrando' && cobro.guardando === 'Guardando tu premio…' && cobro.x === false
          && ll.map((l) => l.codigo).join(',') === 'limite,limite,ok' && new Set(ll.map((l) => l.params?.p_boleto)).size === 1
          && movs(banco).length === 1 && banco.saldo === 3000 && cel.contador === 'Te quedan 7 de 8 hoy',
      }
    } finally { await ctx.close() }
  }
  // c · el límite no cede: tras la primera tanda (unos 30 s) sale la ✕, y
  //     «Salir» abandona el cobro. El video se pierde sin contar.
  const r6c = async () => {
    const banco = crearBanco({ saldo: 2500 })
    const b = { saldo: 2500, banco }
    const { ctx, page } = await contexto(browser, base, b, errores)
    try {
      await abrir(page, base)
      await abrirHoja(page)
      await page.click('[data-accion="hoja-monedas"] [data-accion="video-pedir"]')
      await capaCorriendo(page)
      banco.forzarLimite('cobrar_boleto', 999)
      await page.waitForSelector('[data-accion="video"][data-fase="cobrando"]', { timeout: 100000 })
      const t0 = Date.now()
      // A los 20 s (cuatro reintentos hechos) la ✕ sigue sin estar.
      await page.waitForTimeout(20000)
      const aMedias = { ...(await leerCobro(page)), llamadas: llamadasDe(b, 'cobrar_boleto').length }
      await page.waitForSelector('[data-accion="video-cobro-cerrar"]', { timeout: 30000 })
      const tardoX = Date.now() - t0
      const conX = { llamadas: llamadasDe(b, 'cobrar_boleto').length }
      await page.click('[data-accion="video-cobro-cerrar"]')
      await page.waitForSelector('[data-accion="video-cobro-confirma"]')
      const dialogo = {
        texto: await texto(page, '[data-accion="video-cobro-confirma"] .vid-dialogo-t'),
        volver: await texto(page, '[data-accion="video-cobro-volver"]'),
        salir: await texto(page, '[data-accion="video-cobro-salir"]'),
      }
      await page.screenshot({ path: `${out}/video6-salir.png` })
      await page.click('[data-accion="video-cobro-salir"]')
      await page.waitForSelector('[data-accion="video"]', { state: 'detached' })
      const alSalir = llamadasDe(b, 'cobrar_boleto').length
      // Ya no se reintenta más: en 17 s (más que la espera de 15) no sale otra llamada.
      await page.waitForTimeout(17000)
      banco.forzarLimite('cobrar_boleto', 0)
      await abrirHoja(page)
      const hoja = await leerHoja(page)
      const ll = llamadasDe(b, 'cobrar_boleto')
      return {
        aMedias, tardoX, conX, dialogo, alSalir, llamadasFin: ll.length, hoja: hoja.contador,
        boletos: [...new Set(ll.map((l) => l.params?.p_boleto))].length, saldo: banco.saldo, libro: movs(banco).length,
        pildora: await pildora(page), cel: await page.locator('[data-accion="video-celebracion"]').count(),
        ok: aMedias.x === false && aMedias.fase === 'cobrando' && aMedias.guardando === 'Guardando tu premio…'
          // La ✕ llega cuando la primera tanda (1 + 2 + 4 + 8 + 15 = 30 s) ya se hizo.
          && tardoX >= 28000 && conX.llamadas >= 6
          && dialogo.texto === `Si sales ahora, no ganas los ${montoTexto(PREMIO)} HC.` && dialogo.salir === 'Salir' && dialogo.volver === 'Volver'
          && ll.length === alSalir && ll.every((l) => l.codigo === 'limite') && new Set(ll.map((l) => l.params?.p_boleto)).size === 1
          && banco.saldo === 2500 && movs(banco).length === 0 && hoja.contador === 'Te quedan 8 de 8 hoy'
          && (await pildora(page)) === montoTexto(2500),
      }
    } finally { await ctx.close() }
  }

  const fallo = (nombre) => (e) => { puntos[nombre] = { ok: false, error: String(e?.message ?? e).split('\n')[0] }; return null }
  const [, , , , a6, b6, c6] = await Promise.all([
    r1().catch(fallo('video.1')),
    r27().catch((e) => { fallo('video.2')(e); fallo('video.7')(e) }),
    r3().catch(fallo('video.3')),
    r5().catch(fallo('video.5')),
    r6a().catch((e) => ({ ok: false, error: String(e?.message ?? e).split('\n')[0] })),
    r6b().catch((e) => ({ ok: false, error: String(e?.message ?? e).split('\n')[0] })),
    r6c().catch((e) => ({ ok: false, error: String(e?.message ?? e).split('\n')[0] })),
  ])
  puntos['video.6'] = { repetido: a6, limite: b6, salir: c6, ok: a6?.ok === true && b6?.ok === true && c6?.ok === true }

  // ════ Los que no ven ningún video ═════════════════════════════════════════

  // ── video.4 · no hay video: la red caída al pedir ─────────────────────────
  try {
    const b = { saldo: 2500, cortes: { pedir_boleto: { veces: 1, modo: 'antes' } } }
    const { ctx, page } = await contexto(browser, base, b, errores)
    await abrir(page, base)
    await abrirHoja(page)
    await page.click('[data-accion="hoja-monedas"] [data-accion="video-pedir"]')
    await page.waitForSelector('[data-accion="video-sin"]', { timeout: 10000 })
    const sin = await page.evaluate(() => {
      const s = document.querySelector('[data-accion="video-sin"]')
      return {
        titulo: s.querySelector('.vid-dialogo-t')?.textContent?.trim(),
        sub: s.querySelector('.vid-dialogo-sub')?.textContent?.trim(),
        volver: s.querySelector('[data-accion="video-volver"]')?.textContent?.trim(),
        capa: !!document.querySelector('[data-accion="video"]'),
      }
    })
    await page.screenshot({ path: `${out}/video4-sin.png` })
    await page.click('[data-accion="video-volver"]')
    await page.waitForSelector('[data-accion="video-sin"]', { state: 'detached' })
    await abrirHoja(page)
    const hoja = await leerHoja(page)
    // Desde Retar pasa lo mismo, sobre Retar.
    await page.keyboard.press('Escape')
    b.saldo = 300
    b.cortes.pedir_boleto = { veces: 1, modo: 'antes' }
    await abrir(page, base)
    await irARetar(page)
    await bloqueRetar(page)
    await page.click('.sal-saldo [data-accion="mas-monedas"]')
    await page.waitForSelector('[data-accion="video-sin"]', { timeout: 10000 })
    const enRetar = { capa: await page.locator('[data-accion="video"]').count(), retar: await page.locator('main.sal [data-accion="reto"]').count() > 0 }
    await page.click('[data-accion="video-volver"]')
    await page.waitForSelector('[data-accion="video-sin"]', { state: 'detached' })
    const retar = await bloqueRetar(page)
    puntos['video.4'] = {
      sin, hoja: hoja.contador, enRetar, retar, saldo: b.banco.saldo, boletos: b.banco.boletos.length, libro: movs(b.banco).length,
      pedidos: codigos(b, 'pedir_boleto'),
      ok: sin.titulo === 'Ahora no hay videos disponibles'
        && sin.sub === 'Prueba de nuevo en un momento. No se descontó ninguno de tus 8 videos de hoy.'
        && sin.volver === 'Volver' && sin.capa === false
        && hoja.contador === 'Te quedan 8 de 8 hoy' && enRetar.capa === 0 && enRetar.retar && retar.contador === 'Te quedan 8 de 8 hoy'
        && b.banco.boletos.length === 0 && movs(b.banco).length === 0 && b.banco.saldo === 300
        && codigos(b, 'pedir_boleto').join(',') === 'corte-antes,corte-antes',
    }
    await ctx.close()
  } catch (e) { fallo('video.4')(e) }

  // ── video.8 · la hoja con el nombre de 15 «W» y el contador de Retar, en las siete vistas ──
  try {
    const celdas = []
    for (const vista of VISTAS) {
      const banco = crearBanco({ saldo: 300 })
      const b = { saldo: 300, banco }
      // El perfil es un objeto VIVO: la ruta lo lee en cada petición.
      const perfil = { id: PERFIL_CAP.id, username: NOMBRE_ANCHO }
      const { ctx, page } = await contexto(browser, base, b, errores, { vista, perfil })
      await abrir(page, base)
      await abrirHoja(page)
      await page.waitForTimeout(300)
      const hoja = await page.evaluate(() => {
        const caja = (el) => { if (!el) return null; const r = el.getBoundingClientRect(); return { l: r.left, t: r.top, r: r.right, b: r.bottom, w: r.width, h: r.height } }
        const pisa = (a, c) => !!(a && c) && a.l < c.r - 0.5 && a.r > c.l + 0.5 && a.t < c.b - 0.5 && a.b > c.t + 0.5
        const h = caja(document.querySelector('[data-accion="hoja-monedas"]'))
        const p = caja(document.querySelector('.lob-pildora'))
        const de = document.documentElement
        const filas = [...document.querySelectorAll('[data-accion="hoja-monedas"] .vid-fila')].map(caja)
        return {
          vw: de.clientWidth, vh: de.clientHeight,
          nombre: document.querySelector('.lob-nombre')?.textContent?.trim(),
          hoja: h, pildora: p,
          bajoPildora: h && p ? +(h.t - p.b).toFixed(1) : null,
          dentro: !!h && h.l >= 15.5 && h.r <= de.clientWidth - 15.5 && h.t >= 0 && h.b <= de.clientHeight + 0.5,
          pisaPildora: pisa(h, p),
          pisaFicha: pisa(h, caja(document.querySelector('[data-accion="constancia"]'))),
          pisaEngranaje: pisa(h, caja(document.querySelector('[data-accion="ajustes"]'))),
          filaMin: Math.min(...filas.map((f) => f.h)),
          filasDentro: filas.every((f) => f.l >= h.l - 0.5 && f.r <= h.r + 0.5),
          desbordaX: de.scrollWidth > de.clientWidth,
          corchetes: document.querySelector('.vid-raiz')?.innerText.includes('⟦') ?? true,
          contador: document.querySelector('[data-accion="hoja-monedas"] [data-accion="video-quedan"]')?.textContent?.trim(),
        }
      })
      await page.screenshot({ path: `${out}/video8-hoja-${vista.id}.png` })
      await page.keyboard.press('Escape')
      await page.waitForSelector('[data-accion="hoja-monedas"]', { state: 'detached' })

      // El contador de Retar: con videos y, en la MISMA caja, con el tope (O1).
      const medirRetar = () => page.evaluate(() => {
        const de = document.documentElement
        const caja = (el) => { const r = el.getBoundingClientRect(); return { l: r.left, t: r.top, r: r.right, b: r.bottom, w: r.width, h: r.height } }
        const bloque = document.querySelector('.sal-saldo[data-accion="aviso-saldo"]')
        const boton = bloque.querySelector('[data-accion="mas-monedas"]')
        const cont = bloque.querySelector('[data-accion="video-quedan"]')
        const cta = caja(document.querySelector('[data-accion="cta"]'))
        const sal = document.querySelector('main.sal')
        const cuerpo = document.querySelector('.sal-cuerpo')
        const desplaza = [de, sal, cuerpo].some((n) => n && n.scrollHeight > n.clientHeight + 1 && (n === de || /auto|scroll/.test(getComputedStyle(n).overflowY)))
        return {
          bloque: caja(bloque), boton: caja(boton), contador: caja(cont), texto: cont.textContent.trim(), rotulo: boton.textContent.trim(),
          apagado: boton.disabled, desbordaX: de.scrollWidth > de.clientWidth,
          dentroX: caja(bloque).l >= -0.5 && caja(bloque).r <= de.clientWidth + 0.5,
          // Informativo (H-2 de la 1f): cuánto queda el CTA bajo el borde, y si la pantalla desplaza.
          ctaFuera: +Math.max(0, cta.b - de.clientHeight).toFixed(1), desplaza,
          corchetes: bloque.innerText.includes('⟦'),
        }
      })
      // INFORMATIVO, y de antes de esta tanda: con el nombre de 15 «W», ¿cuánto
      // se sale la barra de Retar de la pantalla? (El «…» de la 1d es del lobby.)
      await irARetar(page)
      const barraAncha = await page.evaluate(() => {
        const de = document.documentElement
        const eng = document.querySelector('.sal [data-accion="ajustes"]')?.getBoundingClientRect()
        return { engranajeFuera: eng ? +Math.max(0, eng.right - de.clientWidth).toFixed(1) : null }
      })
      // El contador, con el nombre corriente.
      perfil.username = PERFIL_CAP.username
      await abrir(page, base)
      await irARetar(page)
      await bloqueRetar(page)
      const con = await medirRetar()
      await page.screenshot({ path: `${out}/video8-retar-${vista.id}.png` })
      banco.sembrarVideosCobrados(8)
      await page.click('[data-accion="casa"]')
      await page.waitForSelector('main.lobby [data-accion="jugar-ia"]')
      await irARetar(page)
      await page.waitForFunction(() => /Vuelven/.test(document.querySelector('.sal-saldo [data-accion="video-quedan"]')?.textContent ?? ''), null, { timeout: 10000 })
      const tope = await medirRetar()
      const c = {
        vp: vista.id, hoja, retar: { con, tope }, barraAncha,
        okHoja: hoja.nombre === NOMBRE_ANCHO && hoja.dentro && Math.abs(hoja.bajoPildora - 9) <= 1
          && !hoja.pisaPildora && !hoja.pisaFicha && !hoja.pisaEngranaje
          && hoja.filaMin >= 44 && hoja.filasDentro && !hoja.desbordaX && !hoja.corchetes && hoja.contador === 'Te quedan 8 de 8 hoy',
        okRetar: con.texto === 'Te quedan 8 de 8 hoy' && con.rotulo === `Ver un video · +${montoTexto(PREMIO)} HC` && !con.apagado
          && con.boton.h >= 40 && con.contador.h > 0 && con.dentroX && !con.desbordaX && !con.corchetes
          && /^Vuelven en /.test(tope.texto) && tope.apagado && !tope.corchetes && !tope.desbordaX
          // O1 · el contador no cambia de alto ni mueve el botón al pasar de un texto al otro.
          && Math.abs(tope.contador.h - con.contador.h) <= 0.5 && Math.abs(tope.bloque.h - con.bloque.h) <= 0.5
          && Math.abs(tope.boton.t - con.boton.t) <= 0.5,
      }
      c.ok = c.okHoja && c.okRetar
      celdas.push(c)
      await ctx.close()
    }
    const cortado = celdas.filter((c) => c.retar.con.ctaFuera > 0 && !c.retar.con.desplaza).map((c) => `${c.vp} (${c.retar.con.ctaFuera} px)`)
    const barra = celdas.filter((c) => c.barraAncha.engranajeFuera > 0).map((c) => `${c.vp} (${c.barraAncha.engranajeFuera} px)`)
    puntos['video.8'] = {
      celdas,
      // H-2 de la 1f (ficha §1.3): se informa, no cuenta. Desde que el contador
      // va al lado del botón en el traje corto y ancho (`video.css`), vacío.
      ctaCortadoSinDesplazar: cortado,
      // De antes de la 1g y fuera de ella: se informa, no cuenta.
      barraDeRetarCon15W: barra,
      ok: celdas.length === VISTAS.length && celdas.every((c) => c.ok),
    }
  } catch (e) { fallo('video.8')(e) }

  // ── video.aux · los tres mandos de desarrollo (5173 con bypass) ───────────
  if (externo || !baseDev) {
    sinCobertura.push('video.aux (con --servidor=externo no hay servidor de desarrollo propio: los mandos ?apu=video: no se comprueban)')
  } else {
    try {
      const nueva = async (q) => {
        const ctx = await browser.newContext({ viewport: { width: VP.w, height: VP.h }, isMobile: true, hasTouch: true })
        const page = await ctx.newPage()
        page.on('pageerror', (e) => errores.push(`pageerror (dev): ${e.message}`))
        await page.goto(`${baseDev}/?apu=${q}`)
        await page.waitForSelector('main.lobby .lob-pildora[data-saldo="listo"]')
        return { ctx, page }
      }
      const bancoDe = (page) => page.evaluate(() => {
        const b = window.__ajileiBancoImitado.banco
        return { saldo: b.saldo, videos: b.libro.filter((l) => l.tipo === 'video').length, boletos: b.boletos.length, quedan: b.llamar('mi_video').quedan }
      })
      // corto · 3 s a la vista, y el banco del bypass acorta su mínimo.
      const corto = await nueva('saldo:2500,video:3000')
      await abrirHoja(corto.page)
      await corto.page.click('[data-accion="hoja-monedas"] [data-accion="video-pedir"]')
      await capaCorriendo(corto.page)
      const t0 = Date.now()
      const celCorto = await celebracion(corto.page, 15000)
      const duroCorto = Date.now() - celCorto.duroMs - t0
      const bCorto = await bancoDe(corto.page)
      await corto.ctx.close()
      // sin · el reproductor contesta «no hay video».
      const sin = await nueva('saldo:2500,video:sin')
      await abrirHoja(sin.page)
      await sin.page.click('[data-accion="hoja-monedas"] [data-accion="video-pedir"]')
      await sin.page.waitForSelector('[data-accion="video-sin"]', { timeout: 10000 })
      const capaSin = await sin.page.locator('[data-accion="video"]').count()
      await sin.page.click('[data-accion="video-volver"]')
      const bSin = await bancoDe(sin.page)
      await sin.ctx.close()
      // cierra · se cierra solo antes de tiempo.
      const cierra = await nueva('saldo:2500,video:cierra')
      await abrirHoja(cierra.page)
      await cierra.page.click('[data-accion="hoja-monedas"] [data-accion="video-pedir"]')
      await cierra.page.waitForSelector('[data-accion="video"]', { timeout: 10000 })
      await cierra.page.waitForSelector('[data-accion="video"]', { state: 'detached', timeout: 8000 })
      await cierra.page.waitForTimeout(600)
      const celCierra = await cierra.page.locator('[data-accion="video-celebracion"]').count()
      const bCierra = await bancoDe(cierra.page)
      await cierra.ctx.close()
      puntos['video.aux'] = {
        corto: { duro: duroCorto, cel: celCorto, banco: bCorto }, sin: { capa: capaSin, banco: bSin }, cierra: { cel: celCierra, banco: bCierra },
        ok: duroCorto >= 2500 && duroCorto < 9000 && celCorto.contador === 'Te quedan 7 de 8 hoy' && bCorto.saldo === 3000 && bCorto.videos === 1
          && capaSin === 0 && bSin.saldo === 2500 && bSin.videos === 0 && bSin.quedan === 8
          && celCierra === 0 && bCierra.saldo === 2500 && bCierra.videos === 0 && bCierra.quedan === 8 && bCierra.boletos === 1,
      }
    } catch (e) { fallo('video.aux')(e) }
  }

  puntos.consola = { errores, ok: errores.length === 0 }
  const verde = Object.values(puntos).every((x) => x.ok === true)
  const orden = ['video.1', 'video.2', 'video.3', 'video.4', 'video.5', 'video.6', 'video.7', 'video.8', 'video.aux', 'consola']
  const resumen = `${verde ? (sinCobertura.length ? 'SIN COBERTURA' : 'VERDE') : 'ROJO'} · ` + orden.filter((k) => puntos[k]).map((k) => `${k} ${puntos[k].ok ? '✓' : '✗'}`).join(' · ')
  console.log(`── VIDEO · ${resumen}`)
  for (const s of sinCobertura) console.log(`   sin cobertura · ${s}`)
  for (const s of noMide) console.log(`   no lo mide este modo · ${s}`)
  if (puntos['video.8']?.ctaCortadoSinDesplazar?.length) {
    console.log(`   informativo (H-2 de la 1f, aceptado hasta IOS-1) · CTA de Retar cortado sin desplazar: ${puntos['video.8'].ctaCortadoSinDesplazar.join(', ')}`)
  }
  if (puntos['video.8']?.barraDeRetarCon15W?.length) {
    console.log(`   informativo (de antes de la 1g) · en Retar, con el nombre de 15 «W», el engranaje se sale de la pantalla: ${puntos['video.8'].barraDeRetarCon15W.join(', ')}`)
  }
  return { verde, puntos, sinCobertura, noMide, resumen }
}
