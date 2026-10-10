// ── ECO-1d · el modo `constancia` de diagDSK ────────────────────────────────
// Rector: AJILEI_ECO-1_Fase1d_v1.0.md §4 (varas, «modo nuevo») y el plan
// aprobado del STOP-1 §7. Vive en su módulo, como `mesaia`; diagDSK sólo lo
// llama y lee su veredicto por `verde`.
//
// Contra el bundle REAL (`vite preview`) con la sesión simulada de CAP: la app
// usa las APIs de verdad (`lib/constanciaApi`, `lib/mesaIAApi`) y contesta el
// banco imitado de cada contexto (`contextoCap`), el contrato de las
// migraciones eco1c y eco1d en JS. La racha, el límite y la válvula se siembran
// en ESE banco antes o durante el recorrido (P-5: sin mando de URL), con los
// mismos mandos que el guion usa en el SQL Editor (`constanciaAdmin`,
// `valvula`) más `forzarLimite`.
//
//   constancia.1  primer arranque: la ficha dice el día 1, sin cobro ni aviso
//   constancia.2  racha en 2 y el último día ayer: «+500 HC por tu constancia.»,
//                 la píldora sube 500, UNA línea `constancia` en el libro, y la
//                 moneda del día se posa cuando la píldora empieza a contar (y
//                 no vuelve a saltar al ir a Retar y volver)
//   constancia.3  segundo arranque el mismo día: sin cobro ni aviso
//   constancia.4  día perdido: la ficha vuelve al día 1
//   constancia.5  recogida de mesa y constancia en el mismo arranque: dos avisos
//                 EN FILA, nunca a la vez, la recogida primero, y la píldora
//                 sube las dos veces sin bajar nunca
//   constancia.6  `limite` al sentarse y al salir (K7): se reintenta con espera,
//                 el mismo token y el mismo seq; un movimiento de cada, sin
//                 perder dinero
//   constancia.7  la válvula encendida (K8, P-3): la recarga dice su texto y no
//                 cobra; la mesa en curso se cobra entera; Retar enseña la nota
//                 de `tope_diario` y no abre mesa; apagada, se sienta
//   consola       sin errores (los 503 que provoca el propio arnés no cuentan)

import { contextoCap } from '../cap/capMesa.mjs'
import { recorrerRuta, esperarMesa } from '../rutaMesa.mjs'
import { jugarMano, nuevoJuego } from '../arnes/autojuego.mjs'
import { crearBanco } from '../arnes/nucleo.mjs'
import { sumarDias } from '../../src/dev/bancoImitado.js'
import { montoTexto } from '../../src/config/tapetes.js'

const VP = { w: 412, h: 915, dpr: 1, movil: true }
const SALDO = 5000
const RUIDO_ARNES = /status of 503|Failed to load resource/
const numeroDe = (t) => Number(String(t ?? '').replace(/\D/g, '')) || 0
const movs = (banco, tipo) => banco.libro.filter((l) => l.tipo === tipo)
const llamadasDe = (b, nombre) => (b.llamadas ?? []).filter((l) => l.nombre === nombre)

// Muestrea CADA cuadro desde que nace la página: los avisos vivos (texto y
// opacidad), la cifra de la píldora y el día de la ficha. Es lo que deja decir
// «nunca a la vez» y «nunca baja» sin depender de cuándo mira el arnés.
const MUESTREO = () => {
  window.__muestras = []
  const paso = () => {
    if (window.__muestras.length >= 6000) return
    window.__muestras.push({
      t: Math.round(performance.now()),
      avisos: [...document.querySelectorAll('.avs')].map((e) => e.textContent.trim()),
      pildora: document.querySelector('.lob-pildora .bd-num')?.textContent?.trim() ?? null,
      dia: document.querySelector('[data-accion="constancia"]')?.dataset.constanciaDia ?? null,
    })
    requestAnimationFrame(paso)
  }
  requestAnimationFrame(paso)
}

async function contexto(browser, base, billetera, errores) {
  const { ctx, page } = await contextoCap(browser, VP, base, { billetera })
  page.on('pageerror', (e) => errores.push(`pageerror: ${e.message}`))
  page.on('console', (m) => { if (m.type() === 'error' && !RUIDO_ARNES.test(m.text())) errores.push(`console: ${m.text()}`) })
  await page.addInitScript(MUESTREO)
  return { ctx, page }
}
async function abrir(page, base) {
  await page.goto(base)
  await page.waitForSelector('main.lobby .lob-pildora')
}
// La ficha, cuando ya sabe su día (sin `cst-oculta`).
const fichaLista = (page, timeout = 10000) =>
  page.waitForSelector('[data-accion="constancia"]:not(.cst-oculta)', { timeout })
const leerFicha = (page) => page.evaluate(() => {
  const f = document.querySelector('[data-accion="constancia"]')
  return f ? { dia: f.dataset.constanciaDia, texto: f.textContent.trim(), oculta: f.classList.contains('cst-oculta'), aria: f.getAttribute('aria-label') } : null
})
const muestras = (page) => page.evaluate(() => window.__muestras ?? [])
async function abandonar(page) {
  await page.click('.btn-leave'); await page.waitForTimeout(200)
  await page.click('.leave-modal button:has-text("Abandonar mesa")')
  await page.waitForSelector('[data-accion="reto"]')
}
// Lo que dicen las muestras de los avisos: cuántos a la vez como mucho, el
// orden en que aparecieron (cada texto distinto, una vez) y si la píldora bajó.
function leerFila(m) {
  const vez = Math.max(0, ...m.map((x) => x.avisos.length))
  const orden = []
  for (const x of m) for (const a of x.avisos) if (orden[orden.length - 1] !== a) orden.push(a)
  const cifras = m.map((x) => x.pildora).filter((p) => p && /\d/.test(p)).map(numeroDe)
  const baja = cifras.some((c, i) => i > 0 && c < cifras[i - 1])
  // ¿Hubo cuadros sin aviso ENTRE dos avisos? (el hueco de la fila)
  const conAviso = m.map((x) => x.avisos.length > 0)
  const primero = conAviso.indexOf(true)
  const ultimo = conAviso.lastIndexOf(true)
  const hueco = primero >= 0 && conAviso.slice(primero, ultimo + 1).some((v) => !v)
  // La traza: sólo los cuadros en que algo cambia (aviso o cifra), para leer
  // en el JSON qué pintó la píldora con cada aviso.
  const traza = []
  let previa = ''
  for (const x of m) {
    const k = `${x.avisos.join('|')}#${x.pildora}#${x.dia}`
    if (k !== previa) { traza.push(`${x.t} ${x.avisos.length ? x.avisos[0].slice(0, 12) : '·'} ${x.pildora} d${x.dia}`); previa = k }
  }
  return { vez, orden, baja, hueco, primera: cifras[0] ?? null, ultima: cifras[cifras.length - 1] ?? null, traza: traza.length > 90 ? [...traza.slice(0, 20), '…', ...traza.slice(-70)] : traza }
}
// La fila terminó: ya pasaron `n` avisos distintos y lleva 800 ms sin ninguno.
// NO basta «no hay `.avs`»: entre dos avisos de la fila hay un hueco de 250 ms
// sin cápsula, y esa espera se daba por buena a mitad de la fila (rojo del
// instrumento de la primera corrida: leía la píldora del segundo aviso a 0).
async function esperarFinFila(page, n, timeout = 20000) {
  await page.waitForFunction((n) => {
    const m = window.__muestras ?? []
    if (new Set(m.flatMap((x) => x.avisos)).size < n) return false
    let i = m.length - 1
    while (i >= 0 && m[i].avisos.length === 0) i--
    return i >= 0 && m[m.length - 1].t - m[i].t > 800
  }, n, { timeout })
}

// Retar con lo que recuerda la pantalla, sin esperar a la mesa (la válvula no
// la abre). La memoria del reto (`MEMORIA_RETO`) guarda reto, jugadores y
// apuesta, NO la entrada: se elige el piso, como hace `recorrerRuta`.
async function tocarRetar(page) {
  await page.waitForSelector('[data-accion="entrada"]:not([disabled])', { timeout: 10000 })
  await page.click('[data-accion="entrada"]:nth-of-type(1)')
  await page.waitForSelector('[data-accion="cta"]:not([disabled])', { timeout: 10000 })
  await page.click('[data-accion="cta"]')
}

export async function runConstancia(browser, { base, out = 'capturas-constancia' }) {
  const puntos = {}
  const errores = []
  const sinCobertura = []

  // ── constancia.1 · 3 ──────────────────────────────────────────────────────
  {
    const b = { saldo: SALDO }
    const { ctx, page } = await contexto(browser, base, b, errores)
    await abrir(page, base)
    await fichaLista(page)
    await page.waitForTimeout(1200)
    const f1 = await leerFicha(page)
    const m1 = leerFila(await muestras(page))
    puntos['constancia.1'] = {
      ficha: f1, avisos: m1.orden, constancias: movs(b.banco, 'constancia').length, racha: b.banco.constancia,
      ok: f1?.dia === '1' && f1.texto.endsWith('1/3') && !f1.oculta && m1.orden.length === 0
        && movs(b.banco, 'constancia').length === 0 && b.banco.constancia?.racha === 1,
    }
    await page.screenshot({ path: `${out}/constancia1.png` })
    // 3 · otra vez el mismo día: ni cobro ni aviso, la ficha igual.
    await abrir(page, base)
    await fichaLista(page)
    await page.waitForTimeout(1500)
    const f3 = await leerFicha(page)
    const m3 = leerFila(await muestras(page))
    const marcas = llamadasDe(b, 'marcar_ingreso').map((l) => l.codigo)
    puntos['constancia.3'] = {
      ficha: f3, avisos: m3.orden, marcas, constancias: movs(b.banco, 'constancia').length,
      ok: f3?.dia === '1' && m3.orden.length === 0 && marcas.join(',') === 'ok,ya_marcado'
        && movs(b.banco, 'constancia').length === 0,
    }
    await ctx.close()
  }

  // ── constancia.2 · el día 3 cobra ─────────────────────────────────────────
  {
    const banco = crearBanco({ saldo: SALDO })
    banco.constanciaAdmin(2, sumarDias(banco.hoy(), -1))
    const b = { saldo: SALDO, banco }
    const { ctx, page } = await contexto(browser, base, b, errores)
    await abrir(page, base)
    await page.waitForSelector('.avs', { timeout: 10000 })
    const aviso = await page.evaluate(() => {
      const a = document.querySelector('.avs')
      return { texto: a?.textContent.trim(), monto: a?.dataset.monto }
    })
    await esperarFinFila(page, 1)
    const m = await muestras(page)
    const fila = leerFila(m)
    // La moneda del día: 2 mientras el aviso aún no cuenta, 3 después; nunca
    // 3 antes de que aparezca el aviso.
    const iAviso = m.findIndex((x) => x.avisos.length > 0)
    const diasAntes = [...new Set(m.slice(0, Math.max(0, iAviso)).map((x) => x.dia).filter(Boolean))]
    const diaAlAparecer = iAviso >= 0 ? m[iAviso].dia : null
    const diaFinal = (await leerFicha(page))?.dia
    const pildora = await page.textContent('.lob-pildora .bd-num')
    // Ir a Retar y volver vuelve a montar el lobby: la moneda NO salta otra vez.
    await page.waitForTimeout(600)
    await page.click('[data-accion="jugar-ia"]'); await page.waitForSelector('[data-accion="reto"]')
    await page.click('[data-accion="casa"]'); await page.waitForSelector('main.lobby [data-accion="constancia"]')
    const saltaOtraVez = await page.evaluate(() => !!document.querySelector('[data-accion="constancia"] .cst-posa'))
    puntos['constancia.2'] = {
      aviso, fila, diasAntes, diaAlAparecer, diaFinal, pildora, saltaOtraVez, constancias: movs(banco, 'constancia').map((l) => l.monto),
      ok: aviso.texto === `+${montoTexto(500)} HC por tu constancia.` && aviso.monto === '500'
        && fila.vez === 1 && !fila.baja && fila.ultima === SALDO + 500
        && !diasAntes.includes('3') && diaAlAparecer === '2' && diaFinal === '3' && !saltaOtraVez
        && pildora === montoTexto(SALDO + 500) && movs(banco, 'constancia').length === 1 && banco.saldo === SALDO + 500,
    }
    await page.screenshot({ path: `${out}/constancia2.png` })
    await ctx.close()
  }

  // ── constancia.4 · día perdido ────────────────────────────────────────────
  {
    const banco = crearBanco({ saldo: SALDO })
    banco.constanciaAdmin(2, sumarDias(banco.hoy(), -2))
    const b = { saldo: SALDO, banco }
    const { ctx, page } = await contexto(browser, base, b, errores)
    await abrir(page, base)
    await fichaLista(page)
    await page.waitForTimeout(1200)
    const f = await leerFicha(page)
    const fila = leerFila(await muestras(page))
    puntos['constancia.4'] = {
      ficha: f, avisos: fila.orden, racha: banco.constancia,
      ok: f?.dia === '1' && fila.orden.length === 0 && banco.constancia?.racha === 1 && movs(banco, 'constancia').length === 0,
    }
    await ctx.close()
  }

  // ── constancia.5 · recogida y constancia, en fila ─────────────────────────
  {
    const banco = crearBanco({ saldo: SALDO })
    const b = { saldo: SALDO, banco }
    const { ctx, page } = await contexto(browser, base, b, errores)
    await abrir(page, base)
    await fichaLista(page)
    await recorrerRuta(page, 2, 'basico', 0, 'piso')
    await page.click('button:has-text("Iniciar mano")')
    await page.waitForTimeout(2500)
    // La app se cierra a mitad de partida y es «mañana» con la racha en 2.
    banco.constanciaAdmin(2, sumarDias(banco.hoy(), -1))
    const antes = banco.saldo
    await abrir(page, base)
    await page.waitForSelector('.avs', { timeout: 10000 })
    await esperarFinFila(page, 2)
    const fila = leerFila(await muestras(page))
    const recogida = movs(banco, 'abandono_ia')[0]?.monto ?? 0
    const pildora = await page.textContent('.lob-pildora .bd-num')
    puntos['constancia.5'] = {
      fila, antes, recogida, saldo: banco.saldo, pildora,
      ok: fila.vez === 1 && fila.orden.length === 2
        && fila.orden[0].startsWith('Volvieron') && fila.orden[1] === `+${montoTexto(500)} HC por tu constancia.`
        && fila.hueco && !fila.baja && fila.primera === antes && fila.ultima === antes + recogida + 500
        && recogida > 0 && movs(banco, 'abandono_ia').length === 1 && movs(banco, 'constancia').length === 1
        && pildora === montoTexto(banco.saldo),
    }
    await page.screenshot({ path: `${out}/constancia5.png` })
    await ctx.close()
  }

  // ── constancia.6 · `limite` al sentarse y al salir (K7) ───────────────────
  {
    const banco = crearBanco({ saldo: SALDO })
    const b = { saldo: SALDO, banco }
    const { ctx, page } = await contexto(browser, base, b, errores)
    await abrir(page, base)
    await fichaLista(page)
    banco.forzarLimite('sentarse_ia', 1)
    const t0 = Date.now()
    await recorrerRuta(page, 2, 'basico', 0, 'piso')
    const espera = Date.now() - t0
    const sent = llamadasDe(b, 'sentarse_ia')
    await page.click('button:has-text("Iniciar mano")')
    await page.waitForTimeout(2500)
    banco.forzarLimite('salir_ia', 2)
    await abandonar(page)
    for (let i = 0; i < 60 && movs(banco, 'salida_ia').length === 0; i++) await page.waitForTimeout(250)
    await page.waitForSelector('.lob-pildora[data-saldo="listo"]:not([data-saldo-vacio])', { timeout: 10000 })
    const sal = llamadasDe(b, 'salir_ia')
    const pildora = await page.textContent('.lob-pildora .bd-num')
    puntos['constancia.6'] = {
      espera, sentarse: sent.map((l) => l.codigo), salir: sal.map((l) => `${l.params?.p_seq}:${l.codigo}`),
      entradas: movs(banco, 'entrada_ia').length, salidas: movs(banco, 'salida_ia').length, saldo: banco.saldo, pildora,
      ok: sent.map((l) => l.codigo).join(',') === 'limite,ok' && sent[0].params?.p_token === sent[1].params?.p_token
        && espera >= 14000 && movs(banco, 'entrada_ia').length === 1
        && sal.map((l) => l.codigo).join(',') === 'limite,limite,ok' && new Set(sal.map((l) => l.params?.p_seq)).size === 1
        && movs(banco, 'salida_ia').length === 1 && banco.mesas.every((m) => m.estado === 'cerrada')
        && pildora === montoTexto(banco.saldo),
    }
    await ctx.close()
  }

  // ── constancia.7 · la válvula (K8, P-3) ───────────────────────────────────
  {
    const banco = crearBanco({ saldo: SALDO })
    // Una mesa ganada hoy antes de abrir la app: +750 (techo 1.250 − 500).
    banco.llamar('sentarse_ia', { p_reto: 'basico', p_jugadores: 2, p_apuesta: 50, p_entrada: 500, p_token: 'previa-7' })
    const previa = banco.mesas[0].id
    banco.llamar('informar_pila', { p_mesa: previa, p_seq: 1, p_pila: 1250 })
    banco.llamar('salir_ia', { p_mesa: previa, p_fichas: 1250, p_seq: 2 })
    const b = { saldo: banco.saldo, banco }
    const { ctx, page } = await contexto(browser, base, b, errores)
    await abrir(page, base)
    await fichaLista(page)
    // Apagada: se sienta. Encendida a mitad (tope 500 < 750): la mesa sigue.
    await recorrerRuta(page, 2, 'basico', 0, 'medio')
    const entrada = banco.mesas.find((m) => m.estado === 'abierta')?.entrada
    banco.valvula(500)
    const juego = nuevoJuego()
    let recarga = { cubierta: false }
    for (let i = 0; i < 6 && !recarga.cubierta; i++) {
      const r = await jugarMano(page, juego, { cada: 0, muestraFinal: false })
      if (!r.cerrada) break
      if (await page.locator('[data-accion="recargar"]').isVisible().catch(() => false)) {
        await page.click('[data-accion="recargar"]')
        await page.waitForSelector('[data-accion="recarga-si"]')
        await page.click('[data-accion="recarga-si"]')
        await page.waitForSelector('[data-accion="recarga-sub"][data-rec-servidor="tope_diario"]', { timeout: 10000 })
        recarga = await page.evaluate(() => ({
          cubierta: true,
          sub: document.querySelector('[data-accion="recarga-sub"]')?.textContent?.trim(),
          si: !!document.querySelector('[data-accion="recarga-si"]'),
          montos: document.querySelectorAll('[data-accion="recarga-monto"]').length,
          no: document.querySelector('[data-accion="recarga-no"]')?.textContent?.trim(),
          salir: document.querySelector('[data-accion="recarga-salir"]')?.textContent?.trim(),
        }))
        await page.screenshot({ path: `${out}/constancia7-recarga.png` })
        await page.click('[data-accion="recarga-no"]')
        await page.waitForSelector('[data-accion="recarga"]', { state: 'detached', timeout: 5000 })
      }
      if (!recarga.cubierta) {
        await page.locator('button:has-text("Siguiente mano")').click().catch(() => {})
        await page.waitForTimeout(400)
      }
    }
    if (!recarga.cubierta) sinCobertura.push('constancia.7 recarga (no salió la recarga voluntaria en 6 manos)')
    const fichas = numeroDe(await page.evaluate(() => document.querySelector('.pbr-chips .bd-num')?.textContent ?? ''))
    await abandonar(page)
    for (let i = 0; i < 40 && movs(banco, 'salida_ia').length < 2; i++) await page.waitForTimeout(250)
    const cobro = movs(banco, 'salida_ia')[1]?.monto ?? 0
    // Retar: la nota del tope, y ninguna mesa nueva.
    const mesasAntes = banco.mesas.length
    await tocarRetar(page)
    await page.waitForFunction(() => /tope de hoy/.test(document.querySelector('[data-accion="cta-nota"]')?.textContent ?? ''), null, { timeout: 10000 })
    const nota = await page.textContent('[data-accion="cta-nota"]')
    await page.screenshot({ path: `${out}/constancia7-retar.png` })
    const mesasTope = banco.mesas.length
    // Apagada otra vez: se sienta.
    banco.valvula(null)
    await tocarRetar(page)
    await esperarMesa(page)
    puntos['constancia.7'] = {
      entrada, recarga, fichas, cobro, nota: nota?.trim(), mesasAntes, mesasTope, mesasFin: banco.mesas.length,
      recargas: movs(banco, 'recarga_ia').length, cambios: banco.cambiosValvula,
      ok: (!recarga.cubierta || ((recarga.sub ?? '').includes('tope de hoy') && !recarga.si && recarga.montos === 0
            && recarga.no === 'Seguir sin recargar' && recarga.salir === 'Salir con mis fichas'))
        && movs(banco, 'recarga_ia').length === 0
        && cobro === fichas && fichas > 0
        && (nota ?? '').includes('Llegaste al tope de hoy contra las IAS') && mesasTope === mesasAntes
        && banco.mesas.length === mesasAntes + 1,
    }
    await ctx.close()
  }

  puntos.consola = { errores, ok: errores.length === 0 }
  const verde = Object.values(puntos).every((x) => x.ok === true)
  const resumen = `${verde ? (sinCobertura.length ? 'SIN COBERTURA' : 'VERDE') : 'ROJO'} · ` +
    Object.entries(puntos).map(([k, v]) => `${k} ${v.ok ? '✓' : '✗'}`).join(' · ')
  console.log(`── CONSTANCIA · ${resumen}`)
  return { verde, puntos, sinCobertura, resumen }
}
