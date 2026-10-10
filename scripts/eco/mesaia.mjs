// ── ECO-1c · los modos `mesaia` y `revive` de diagDSK ───────────────────────
// Rector: AJILEI_ECO-1_Fase1c_v1.0.md §4 (varas) y el plan aprobado del STOP-1
// §6. Viven en su módulo y no dentro de `diagDSK.mjs` (14.000 líneas): éste
// sólo los llama, como a los demás, y lee su veredicto por `verde`.
//
// ── `mesaia` · LA MESA CONTRA LAS IAS, CONTRA EL SERVIDOR IMITADO ───────────
// Contra el bundle REAL (`vite preview`) con la sesión simulada de CAP: la app
// usa las APIs de verdad (`lib/mesaIAApi`, `lib/billeteraApi`) y quien contesta
// es el banco imitado de cada contexto (`contextoCap`, ECO-1c), el contrato de
// la migración eco1c en JS. El punto 3 va al servidor de desarrollo con bypass,
// porque la victoria sólo se fuerza con un molde de `?apu=` (DEV).
//
//   mesaia.1  sentarse descuenta la entrada y salir cobra: la píldora dice la
//             cifra del servidor en las cuatro pantallas, sin relecturas.
//             ECO-1e (E4) · se solapa A PROPÓSITO con `saldo.2` de diagDSK:
//             `saldo` es el recorrido rápido de la 1b (una sola cifra, INV-46)
//             y éste, el del servidor de la 1c (el libro y la mesa). Se quedan
//             los dos
//   mesaia.2  recargar descuenta y las fichas llegan SÓLO tras la confirmación;
//             con la respuesta perdida, se dice y «Reintentar» la cobra una vez
//   mesaia.3  salir de una mesa ganada cobra una vez y la celebración cuenta
//             el saldo real (C8, Reglas §9). ECO-1e (E1) · mide EL COBRO: una
//             mano ganada y una recarga antes de la victoria, para que «Saldo
//             actual» = saldo inicial − entrada − recargas + cobro no pueda
//             coincidir con ninguna otra cifra del recorrido (ver el bloque)
//   mesaia.4  partida cortada: (a) al recargar la página, el arranque la recoge
//             y el aviso de saldo lo dice; (b) con la mesa en otro dispositivo,
//             sentarse la cierra y el aviso sale en Retar antes de la mesa
//   mesaia.5  la mesa cerrada desde otro dispositivo: aviso y vuelta al lobby
//   mesaia.6  doble toque al sentarse y al salir: un solo movimiento de cada
//   mesaia.7  avisos de pila que fallan (respuesta perdida) se reintentan y
//             llegan una vez y en orden: el récord cuenta cada mano una vez
//   mesaia.8  REGLA SELLADA (P-4 de la 1c, INV-48): una partida que se juega
//             nunca calla N = 10 min, el silencio tras el que otro dispositivo
//             la recoge. Vigila y tiñe: rojo si algún hueco entre avisos
//             consecutivos llega a N, o si no hubo huecos que medir
//   mesaia.9  P-2 de la 1c (INV-53) · la salida espera a la recarga en vuelo y,
//             si entra, la lleva:
//             (a) la ✕ con la recarga en vuelo 3 s; (b) la recarga 14 s sin
//             contestar: a los 10 s la tarjeta lo dice, «Reintentar» manda el
//             mismo seq, la ✕ sigue viva y «Salir con mis fichas» sale. En los
//             dos, el libro: una recarga, una salida con fichas + recarga, y el
//             saldo final el de quien no recargó
//   consola   sin errores (los 503 que provoca el propio arnés no cuentan)
//   ventana60 ECO-1e (E3) · VIGILA Y TIÑE: el máximo de llamadas de cada función
//             de dinero en cualquier ventana de 60 s de un mismo contexto,
//             contra su límite por minuto (`LIMITES_SQL`). MÁS DE LA MITAD del
//             tope = rojo. Es la guardia permanente del margen de K7: un
//             cliente legítimo nunca toca un límite, y el arnés juega más
//             deprisa que una persona. `informar_pila` no lleva tope y sólo se
//             reporta. Cuenta los contextos del preview y el banco del bypass
//             de `mesaia.3`. Si sale rojo, el umbral NO se sube: es un hallazgo.
//
// ── `revive` · D-1 (C9) ─────────────────────────────────────────────────────
// Servidor de desarrollo con bypass: `?apu=saldo:5000,allinIA,gana`, mesa de
// 2. La IA se sienta con la apuesta justa, se queda en all-in en el ante y el
// humano gana la primera mano: la IA queda a 0 sin estar `eliminated`. Se pide
// la recarga voluntaria y después «Siguiente mano». Verde si la mesa se cierra
// con la victoria (la IA no volvió); rojo si se reparte otra mano.

import { contextoCap } from '../cap/capMesa.mjs'
import { recorrerRuta, esperarMesa } from '../rutaMesa.mjs'
import { jugarMano, nuevoJuego } from '../arnes/autojuego.mjs'
import { montoTexto } from '../../src/config/tapetes.js'
import { LIMITES_SQL } from '../../src/dev/bancoImitado.js'

const VP = { w: 412, h: 915, dpr: 1, movil: true }
const SALDO = 5000
// ECO-1e (E1) · la billetera de `mesaia.3`: ni la del arnés ni una cifra que
// el cobro pueda devolver. Es la misma que sirve el modo `saldo`.
const SALDO_3 = 3700
const N_MS = 10 * 60 * 1000
const numeroDe = (t) => Number(String(t ?? '').replace(/\D/g, '')) || 0
const RUIDO_ARNES = /status of 503|Failed to load resource/

async function leerPildora(page) {
  return page.evaluate(() => {
    const p = document.querySelector('.lob-pildora')
    return p ? {
      texto: p.querySelector('.bd-num')?.textContent?.trim() ?? '',
      estado: p.dataset.saldo ?? null,
      vacio: p.hasAttribute('data-saldo-vacio'),
    } : null
  })
}
const pildoraLista = (page, timeout = 10000) =>
  page.waitForSelector('.lob-pildora[data-saldo="listo"]:not([data-saldo-vacio])', { timeout })
const ir = {
  lobby: async (page) => { await page.click('[data-accion="casa"]'); await page.waitForSelector('main.lobby [data-accion="jugar-ia"]') },
  retar: async (page) => { await page.click('[data-accion="jugar-ia"]'); await page.waitForSelector('[data-accion="reto"]') },
  opciones: async (page) => { await page.click('[data-accion="jugar-pvp"]'); await page.waitForSelector('[data-accion="armar"]') },
  armar: async (page) => { await page.click('[data-accion="armar"]'); await page.waitForSelector('[data-accion="apuesta"]') },
}
async function enLasCuatro(page) {
  const out = {}
  await pildoraLista(page)
  out.retar = await leerPildora(page)
  await ir.lobby(page); await pildoraLista(page); out.lobby = await leerPildora(page)
  await ir.opciones(page); out.opciones = await leerPildora(page)
  await ir.armar(page); out.armar = await leerPildora(page)
  await ir.lobby(page)
  return out
}
const todasDicen = (pantallas, n) => Object.values(pantallas).every((p) => p && p.texto === montoTexto(n) && p.estado === 'listo' && !p.vacio)
const fichasMesa = (page) => page.evaluate(() => document.querySelector('.pbr-chips .bd-num')?.textContent ?? '').then(numeroDe)
async function abandonar(page, { doble = false } = {}) {
  await page.click('.btn-leave'); await page.waitForTimeout(200)
  const sel = '.leave-modal button:has-text("Abandonar mesa")'
  if (doble) await page.dblclick(sel).catch(() => page.click(sel))
  else await page.click(sel)
  await page.waitForSelector('[data-accion="reto"]')
}
const movs = (banco, tipo) => banco.libro.filter((l) => l.tipo === tipo)

// ECO-1d · las billeteras de cada contexto, para medir la ventana de 60 s.
const vistas = []
/** El máximo de llamadas de cada función en una ventana de 60 s, por contexto. */
export function ventana60(listas) {
  const max = {}
  for (const llamadas of listas) {
    const porNombre = {}
    for (const l of llamadas ?? []) (porNombre[l.nombre] ??= []).push(l.t)
    for (const [nombre, ts] of Object.entries(porNombre)) {
      ts.sort((a, b) => a - b)
      let j = 0
      for (let i = 0; i < ts.length; i++) {
        while (ts[i] - ts[j] >= 60_000) j++
        max[nombre] = Math.max(max[nombre] ?? 0, i - j + 1)
      }
    }
  }
  return max
}

async function contexto(browser, base, billetera, errores) {
  vistas.push(billetera)
  const { ctx, page } = await contextoCap(browser, VP, base, { billetera })
  page.on('pageerror', (e) => errores.push(`pageerror: ${e.message}`))
  page.on('console', (m) => { if (m.type() === 'error' && !RUIDO_ARNES.test(m.text())) errores.push(`console: ${m.text()}`) })
  await page.goto(base)
  await page.waitForSelector('main.lobby .lob-pildora')
  return { ctx, page }
}

// Juega manos hasta que la condición se cumpla (o `max`). La recarga la
// contesta `jugarMano` (H-10), así que una mesa larga no se cuelga.
async function jugarHasta(page, juego, cond, max = 6) {
  for (let i = 0; i < max; i++) {
    const r = await jugarMano(page, juego, { cada: 0, muestraFinal: false })
    if (!r.cerrada) return false
    if (await cond()) return true
    await page.locator('button:has-text("Siguiente mano")').click().catch(() => {})
    await page.waitForTimeout(400)
  }
  return false
}

export async function runMesaIA(browser, { base, baseDev, externo = false, out = 'capturas-mesaia' }) {
  const puntos = {}
  const errores = []
  const sinCobertura = []

  // ── mesaia.1 ──────────────────────────────────────────────────────────────
  {
    const b = { saldo: SALDO }
    const { ctx, page } = await contexto(browser, base, b, errores)
    await pildoraLista(page)
    const ruta = await recorrerRuta(page, 2, 'basico', 0, 'piso')
    const entrada = ruta.monto * 10
    const trasSentarse = { saldo: b.banco.saldo, abiertas: b.banco.mesas.filter((m) => m.estado === 'abierta').length }
    await page.click('button:has-text("Iniciar mano")')
    await page.waitForTimeout(2500)
    const fichas = await fichasMesa(page)
    await abandonar(page)
    const pantallas = await enLasCuatro(page)
    const esperado = SALDO - entrada + fichas
    puntos['mesaia.1'] = {
      entrada, fichas, esperado, trasSentarse, pantallas, lecturas: b.lecturas ?? 0,
      libro: b.banco.libro.map((l) => `${l.tipo} ${l.monto}`),
      ok: trasSentarse.saldo === SALDO - entrada && trasSentarse.abiertas === 1
        && movs(b.banco, 'entrada_ia').length === 1 && movs(b.banco, 'salida_ia').length === 1
        && b.banco.saldo === esperado && fichas > 0 && fichas < entrada
        && todasDicen(pantallas, esperado) && (b.lecturas ?? 0) === 1,
    }
    await page.screenshot({ path: `${out}/mesaia1.png` })
    await ctx.close()
  }

  // ── mesaia.2 ──────────────────────────────────────────────────────────────
  {
    const b = { saldo: SALDO }
    const { ctx, page } = await contexto(browser, base, b, errores)
    await pildoraLista(page)
    await recorrerRuta(page, 2, 'basico', 0, 'medio')
    const juego = nuevoJuego()
    const hay = () => page.locator('[data-accion="recargar"]').isVisible().catch(() => false)
    const conVoluntaria = await jugarHasta(page, juego, hay)
    if (!conVoluntaria) {
      sinCobertura.push('mesaia.2 (no salió la recarga voluntaria en 6 manos)')
      puntos['mesaia.2'] = { ok: true, sinCobertura: true }
    } else {
      // (a) lenta: las fichas no se mueven hasta que el servidor contesta. Se
      // lee la pila con la tarjeta YA ABIERTA: en el pago la mesa retiene el
      // pozo en la cifra que pinta (VIS-3c), y abrir la tarjeta lo suelta.
      await page.click('[data-accion="recargar"]')
      await page.waitForSelector('[data-accion="recarga-si"]')
      await page.waitForTimeout(300)
      const antes = await fichasMesa(page)
      b.retrasos = { recargar_ia: 1500 }
      await page.click('[data-accion="recarga-si"]')
      await page.waitForTimeout(400)
      const enVuelo = await page.evaluate(() => ({
        boton: document.querySelector('[data-accion="recarga-si"]')?.textContent?.trim() ?? null,
        apagado: document.querySelector('[data-accion="recarga-si"]')?.disabled ?? null,
        noApagado: document.querySelector('[data-accion="recarga-no"]')?.disabled ?? null,
      }))
      const fichasEnVuelo = await fichasMesa(page)
      const recargasEnVuelo = movs(b.banco, 'recarga_ia').length
      await page.waitForSelector('[data-accion="recarga"]', { state: 'detached', timeout: 10000 })
      await page.waitForTimeout(700)
      const despues = await fichasMesa(page)
      const monto1 = -movs(b.banco, 'recarga_ia')[0]?.monto
      b.retrasos = {}
      // (b) la respuesta se pierde: se dice, y «Reintentar» la cobra UNA vez.
      let perdida = { cubierta: false }
      if (await hay()) {
        await page.click('[data-accion="recargar"]')
        await page.waitForSelector('[data-accion="recarga-si"]')
        b.cortes = { recargar_ia: { veces: 1, modo: 'despues' } }
        const f0 = await fichasMesa(page)
        await page.click('[data-accion="recarga-si"]')
        await page.waitForSelector('[data-accion="recarga-sub"][data-rec-servidor="red"]', { timeout: 10000 })
        const texto = await page.textContent('[data-accion="recarga-sub"]')
        const fRed = await fichasMesa(page)
        await page.click('[data-accion="recarga-si"]')     // «Reintentar»
        await page.waitForSelector('[data-accion="recarga"]', { state: 'detached', timeout: 10000 })
        await page.waitForTimeout(700)
        const f1 = await fichasMesa(page)
        const recs = movs(b.banco, 'recarga_ia')
        perdida = { cubierta: true, texto, f0, fRed, f1, recargas: recs.length, monto2: -recs[1]?.monto,
          ok: (texto ?? '').includes('No pudimos confirmar') && fRed === f0 && recs.length === 2 && f1 === f0 - recs[1].monto }
      } else {
        sinCobertura.push('mesaia.2b (tras la primera recarga no quedó voluntaria)')
      }
      puntos['mesaia.2'] = {
        antes, enVuelo, fichasEnVuelo, recargasEnVuelo, despues, monto1, perdida,
        ok: enVuelo.boton === 'Recargando…' && enVuelo.apagado === true && enVuelo.noApagado === true
          && fichasEnVuelo === antes && recargasEnVuelo === 0
          && despues === antes + monto1 && monto1 > 0
          && (perdida.cubierta ? perdida.ok : true),
      }
    }
    await page.screenshot({ path: `${out}/mesaia2.png` })
    await ctx.close()
  }

  // ── mesaia.3 · dev con bypass: la mesa ganada y su cobro (ECO-1e, E1) ─────
  // Hasta la 1e entraba con `?cel`: los rivales nacen sin fichas, la mesa acaba
  // sin jugar una mano, el cobro ES la entrada y el saldo vuelve a la cifra de
  // partida. Exigir «Saldo actual = 5.000» pasaba igual si la celebración
  // pintara el saldo de antes de sentarse: medía el saldo inicial, no el cobro.
  //
  // Ahora la receta de `revive` (`allinIA,gana`), mesa de 2, Básico al piso, con
  // una billetera que no es la del arnés. En papel (mesa de 50, entrada 500):
  //   3.700 → sentado 3.200 (pila 500) → gana la mano, pila 550 → recarga 500:
  //   billetera 2.700, pila 1.050 → «Siguiente mano» → victoria, cobro 1.050
  //   → «Saldo actual» 3.750 = 3.700 − 500 − 500 + 1.050.
  // Ninguna cifra se clava: entrada, recargas y cobro se LEEN del libro, la pila
  // de la mesa, y la identidad se exige entera. Y el punto se niega a pasar si
  // el esperado coincide con otra cifra del recorrido (el saldo de antes, el de
  // sentado, el de tras recargar, la pila, la entrada o los 5.000 del arnés):
  // una vara que no puede distinguirlas no mide nada.
  if (externo) {
    sinCobertura.push('mesaia.3 (con --servidor=externo no hay servidor de desarrollo propio)')
    puntos['mesaia.3'] = { ok: true, sinCobertura: true }
  } else {
    const page = await browser.newPage({ viewport: { width: VP.w, height: VP.h } })
    page.on('pageerror', (e) => errores.push(`pageerror: ${e.message}`))
    const banco = () => page.evaluate(() => {
      const b = window.__ajileiBancoImitado?.banco
      return b ? {
        saldo: b.saldo, libro: b.libro.map((l) => ({ tipo: l.tipo, monto: l.monto })), intentos: b.intentos,
        pila: b.mesas.find((m) => m.estado === 'abierta')?.pila_informada ?? null,
      } : null
    })
    await page.goto(`${baseDev}/?apu=saldo:${SALDO_3},allinIA,gana`)
    await page.waitForSelector('main.lobby .lob-pildora')
    await pildoraLista(page)
    const antes = numeroDe((await leerPildora(page))?.texto)
    const ruta = await recorrerRuta(page, 2, 'basico', 0, 'piso')
    const entradaRuta = ruta.monto * 10
    const sentado = await banco()
    const mano = await jugarMano(page, nuevoJuego(), { cada: 0, muestraFinal: false })
    // La recarga voluntaria, para que el término «− recargas» esté vivo. La pila
    // se lee con la tarjeta YA abierta (VIS-3c, como en mesaia.2).
    const hay = await page.locator('[data-accion="recargar"]').isVisible().catch(() => false)
    let pila = null, pilaFinal = null, trasRecarga = null
    if (hay) {
      await page.click('[data-accion="recargar"]')
      await page.waitForSelector('[data-accion="recarga-si"]')
      await page.waitForTimeout(300)
      pila = await fichasMesa(page)
      await page.click('[data-accion="recarga-si"]')
      await page.waitForSelector('[data-accion="recarga"]', { state: 'detached', timeout: 10000 })
      await page.waitForTimeout(700)
      pilaFinal = await fichasMesa(page)
      trasRecarga = (await banco())?.saldo ?? null
    } else {
      // Sin tarjeta que abrir, la mesa retiene el pozo en la cifra que pinta:
      // la pila es la última que la mesa avisó al servidor. La identidad se
      // juzga igual, con recargas = 0, y el hueco se declara (código 1).
      await page.waitForTimeout(1500)
      pila = pilaFinal = (await banco())?.pila ?? null
      sinCobertura.push('mesaia.3 (no salió la recarga voluntaria: la identidad se juzgó con recargas = 0)')
    }
    await page.locator('button:has-text("Siguiente mano")').click().catch(() => {})
    const victoria = await page.waitForSelector('.cel-screen', { timeout: 20000 }).then(() => true).catch(() => false)
    // El relato del saldo termina hacia los 8 s (Victory_Celebration §4.2).
    if (victoria) await page.waitForTimeout(9500)
    const enCeleb = await banco()
    const celeb = {
      saldo: victoria ? await page.evaluate(() => document.querySelector('.cel-saldo-num')?.textContent?.trim() ?? null) : null,
      banco: enCeleb?.saldo ?? null,
      salidas: enCeleb?.libro.filter((l) => l.tipo === 'salida_ia').length ?? null,
    }
    await page.screenshot({ path: `${out}/mesaia3_celebracion.png` })
    let tras = { pildora: null, salidas: null, saldo: null }
    let fin = enCeleb
    if (victoria) {
      await page.click('.cel-screen button:has-text("Salir de la mesa")')
      await page.waitForSelector('[data-accion="reto"]')
      await pildoraLista(page)
      fin = await banco()
      tras = {
        pildora: (await leerPildora(page))?.texto ?? null,
        salidas: fin?.libro.filter((l) => l.tipo === 'salida_ia').length ?? null,
        saldo: fin?.saldo ?? null,
      }
    }
    // El banco del bypass también cuenta en la ventana de 60 s.
    vistas.push({ llamadas: (fin?.intentos ?? []).map((x) => ({ nombre: x.funcion, t: x.en })) })
    const de = (tipo) => (fin?.libro ?? []).filter((l) => l.tipo === tipo)
    const entrada = -(de('entrada_ia')[0]?.monto ?? NaN)
    const recargas = -de('recarga_ia').reduce((s, l) => s + l.monto, 0)
    const cobro = de('salida_ia')[0]?.monto ?? NaN
    const esperado = SALDO_3 - entrada - recargas + cobro
    // Las otras cifras del recorrido: el esperado no puede ser ninguna.
    const otras = {
      antesDeSentarse: SALDO_3, sentado: SALDO_3 - entrada, trasRecargar: SALDO_3 - entrada - recargas,
      pila, pilaFinal, entrada, arnes: SALDO,
    }
    const coincide = Object.entries(otras).filter(([, v]) => v === esperado).map(([k]) => k)
    puntos['mesaia.3'] = {
      saldoInicial: SALDO_3, antes, entradaRuta, entrada, recargas, pila, pilaFinal, cobro, esperado, trasRecarga,
      sentado: sentado?.saldo ?? null, manoCerrada: mano.cerrada, voluntaria: hay, victoria, celeb, tras, otras, coincide,
      libro: (fin?.libro ?? []).map((l) => `${l.tipo} ${l.monto}`),
      ok: antes === SALDO_3 && mano.cerrada === true && victoria
        // el libro: una entrada, una salida y, si hubo tarjeta, una recarga
        && de('entrada_ia').length === 1 && entrada === entradaRuta && sentado?.saldo === SALDO_3 - entrada
        && (hay ? de('recarga_ia').length === 1 && recargas > 0 && trasRecarga === SALDO_3 - entrada - recargas
          && pilaFinal === pila + recargas : de('recarga_ia').length === 0)
        && de('salida_ia').length === 1 && cobro === pilaFinal
        // la identidad contable, por los tres caminos que la pintan
        && Number.isFinite(esperado) && coincide.length === 0
        && celeb.salidas === 1 && celeb.banco === esperado && numeroDe(celeb.saldo) === esperado
        && tras.salidas === 1 && tras.saldo === esperado && tras.pildora === montoTexto(esperado),
    }
    await page.close()
  }

  // ── mesaia.4a · partida cortada: el arranque la recoge ────────────────────
  {
    const b = { saldo: SALDO }
    const { ctx, page } = await contexto(browser, base, b, errores)
    await pildoraLista(page)
    await recorrerRuta(page, 2, 'basico', 0, 'medio')
    const juego = nuevoJuego()
    await jugarMano(page, juego, { cada: 0, muestraFinal: false })
    await page.waitForTimeout(1500)
    const mesa = b.banco.mesas.find((m) => m.estado === 'abierta')
    const pila = mesa?.pila_informada ?? null
    await page.reload()
    await page.waitForSelector('[data-accion="aviso-saldo"]', { timeout: 15000 })
    const aviso = await page.textContent('[data-accion="aviso-saldo"]')
    await page.screenshot({ path: `${out}/mesaia4a_aviso.png` })
    await page.waitForSelector('[data-accion="aviso-saldo"]', { state: 'detached', timeout: 8000 })
    const pildora = await leerPildora(page)
    const cerrada = b.banco.mesas.find((m) => m.id === mesa?.id)
    puntos['mesaia.4a'] = {
      pila, aviso, pildora, cerrada: cerrada && { estado: cerrada.estado, motivo: cerrada.motivo_cierre, cobrado: cerrada.cobrado },
      ok: pila > 0 && cerrada?.estado === 'cerrada' && cerrada.motivo_cierre === 'abandono' && cerrada.cobrado === pila
        && (aviso ?? '').includes(montoTexto(pila)) && (aviso ?? '').includes('partida anterior')
        && pildora?.texto === montoTexto(b.banco.saldo),
    }
    await ctx.close()
  }

  // ── mesaia.4b · la mesa vieja en OTRO dispositivo: sentarse la cierra ─────
  {
    const b = { saldo: SALDO }
    const errores4 = []
    const { ctx, page } = await contexto(browser, base, b, errores4)
    // La mesa vieja se abre en el servidor ANTES, desde otro dispositivo y con
    // avisos recientes: el arranque de aquí la respeta (`viva`).
    const vieja = b.banco.llamar('sentarse_ia', { p_reto: 'basico', p_jugadores: 2, p_apuesta: 50, p_entrada: 1000, p_token: 'otro-1', p_dispositivo: 'otro-dispositivo' })
    b.banco.llamar('informar_pila', { p_mesa: vieja.mesa_id, p_seq: 1, p_pila: 1350 })
    errores.push(...errores4)
    // La app ya leyó su saldo antes de que la mesa vieja existiera: se recarga
    // para que arranque con el servidor tal como está (y recoger_mesa_ia la respete).
    await page.reload()
    await pildoraLista(page)
    const antes = await leerPildora(page)
    await recorrerRuta(page, 2, 'basico', 0, 'piso', {
      alPaso: async (p, paso) => {
        if (paso !== 'entrada') return
        await p.evaluate(() => {
          window.__mesaiaTraza = []
          const t0 = performance.now()
          new MutationObserver(() => {
            const a = document.querySelector('[data-accion="aviso-saldo"]')
            const cta = document.querySelector('[data-accion="cta"]')?.textContent?.trim()
            window.__mesaiaTraza.push({ t: Math.round(performance.now() - t0), aviso: a?.textContent ?? null,
              pildora: document.querySelector('.lob-pildora .bd-num')?.textContent ?? null,
              cta, mesa: !!document.querySelector('.game-table') })
          }).observe(document.body, { childList: true, subtree: true, characterData: true })
        })
      },
    })
    const traza = await page.evaluate(() => window.__mesaiaTraza ?? [])
    const conAviso = traza.filter((x) => x.aviso)
    const enMesa = traza.find((x) => x.mesa)
    const cifras = conAviso.map((x) => numeroDe(x.pildora))
    const viejaFin = b.banco.mesas.find((m) => m.id === vieja.mesa_id)
    puntos['mesaia.4b'] = {
      antes, avisos: [...new Set(conAviso.map((x) => x.aviso))], primeraCifra: cifras[0], ultimaCifra: cifras.at(-1),
      ctaDuranteAviso: [...new Set(conAviso.map((x) => x.cta))], mesaEnMs: enMesa?.t ?? null, avisoEnMs: conAviso[0]?.t ?? null,
      vieja: viejaFin && { estado: viejaFin.estado, motivo: viejaFin.motivo_cierre, cobrado: viejaFin.cobrado },
      ok: viejaFin?.estado === 'cerrada' && viejaFin.motivo_cierre === 'reemplazada' && viejaFin.cobrado === 1350
        && conAviso.length > 0 && conAviso.every((x) => x.aviso.includes('1.350'))
        && cifras[0] === numeroDe(antes?.texto) && Math.max(...cifras) === numeroDe(antes?.texto) + 1350
        && cifras.every((c, i) => i === 0 || c >= cifras[i - 1])
        && conAviso.every((x) => x.cta === 'Sentando…' || x.cta === undefined)
        && enMesa && enMesa.t > conAviso[0].t,
    }
    await page.screenshot({ path: `${out}/mesaia4b_mesa.png` })
    await ctx.close()
  }

  // ── mesaia.5 · C6 ─────────────────────────────────────────────────────────
  {
    const b = { saldo: SALDO }
    const { ctx, page } = await contexto(browser, base, b, errores)
    await pildoraLista(page)
    await recorrerRuta(page, 2, 'basico', 0, 'medio')
    await page.click('button:has-text("Iniciar mano")')
    await page.waitForTimeout(2500)
    const cierre = b.banco.cerrarDesdeOtroDispositivo()
    const juego = nuevoJuego()
    await jugarMano(page, juego, { cada: 0, muestraFinal: false, iniciar: false, max: 120 })
    // El aviso va en `body` (portal), no dentro de `main.lobby`.
    await page.waitForSelector('main.lobby', { timeout: 20000 })
    await page.waitForSelector('[data-accion="aviso-saldo"]', { timeout: 10000 })
    const aviso = await page.textContent('[data-accion="aviso-saldo"]')
    await page.screenshot({ path: `${out}/mesaia5_lobby.png` })
    await page.waitForSelector('[data-accion="aviso-saldo"]', { state: 'detached', timeout: 8000 })
    const pildora = await leerPildora(page)
    puntos['mesaia.5'] = {
      cierre, aviso, pildora, saldo: b.banco.saldo,
      ok: cierre.cerrada && (aviso ?? '').includes('otro dispositivo') && (aviso ?? '').includes(montoTexto(cierre.cobrado))
        && pildora?.texto === montoTexto(b.banco.saldo) && movs(b.banco, 'salida_ia').length === 0,
    }
    await ctx.close()
  }

  // ── mesaia.6 · doble toque ────────────────────────────────────────────────
  {
    const b = { saldo: SALDO, retrasos: { sentarse_ia: 800, salir_ia: 800 } }
    const { ctx, page } = await contexto(browser, base, b, errores)
    await pildoraLista(page)
    await ir.retar(page)
    for (const [accion, nth] of [['reto', 1], ['jugadores', 1], ['apuesta', 1], ['entrada', 1]]) {
      await page.waitForSelector(`[data-accion="${accion}"]:not([disabled])`)
      await page.click(`[data-accion="${accion}"]:nth-of-type(${nth})`)
    }
    await page.dblclick('[data-accion="cta"]')
    await esperarMesa(page)
    await page.click('button:has-text("Iniciar mano")')
    await page.waitForTimeout(2500)
    await abandonar(page, { doble: true })
    await pildoraLista(page)
    const llamadas = (b.llamadas ?? []).map((l) => l.nombre)
    puntos['mesaia.6'] = {
      sentarseLlamadas: llamadas.filter((n) => n === 'sentarse_ia').length,
      salirLlamadas: llamadas.filter((n) => n === 'salir_ia').length,
      mesas: b.banco.mesas.length, entradas: movs(b.banco, 'entrada_ia').length, salidas: movs(b.banco, 'salida_ia').length,
      ok: b.banco.mesas.length === 1 && movs(b.banco, 'entrada_ia').length === 1 && movs(b.banco, 'salida_ia').length === 1,
    }
    await ctx.close()
  }

  // ── mesaia.7 y mesaia.8 · avisos que fallan; los huecos entre avisos ──────
  {
    const b = { saldo: SALDO, cortes: { informar_pila: { veces: 3, modo: 'despues' } } }
    const { ctx, page } = await contexto(browser, base, b, errores)
    await pildoraLista(page)
    await recorrerRuta(page, 5, 'basico', 0, 'medio')
    const juego = nuevoJuego()
    let manos = 0
    for (let i = 0; i < 5; i++) {
      const r = await jugarMano(page, juego, { cada: 0, muestraFinal: false })
      if (!r.cerrada) break
      manos++
      if (i < 4) { await page.locator('button:has-text("Siguiente mano")').click().catch(() => {}); await page.waitForTimeout(400) }
    }
    await page.waitForTimeout(9000)   // 1 + 2 + 4 s de reintentos, de sobra
    const fichas = await fichasMesa(page)
    const avisos = (b.llamadas ?? []).filter((l) => l.nombre === 'informar_pila')
    const seqs = avisos.map((l) => l.params?.p_seq)
    const cortados = avisos.filter((l) => String(l.codigo).startsWith('corte'))
    const mesa = b.banco.mesas[0]
    const jugadas = Object.values(b.banco.record).reduce((s, r) => s + r.jugadas, 0)
    // Cada aviso cortado vuelve a salir DESPUÉS con el mismo seq y llega.
    const reintentados = cortados.every((c) => avisos.some((l) => l !== c && l.t >= c.t
      && l.params?.p_seq === c.params?.p_seq && !String(l.codigo).startsWith('corte')))
    puntos['mesaia.7'] = {
      manos, cortados: cortados.length, jugadas, fichas, pilaInformada: mesa?.pila_informada, seqInformada: mesa?.seq_informada,
      enOrden: seqs.every((s, i) => i === 0 || s >= seqs[i - 1]), reintentados,
      ok: manos >= 3 && cortados.length === 3 && jugadas === manos && reintentados
        && seqs.every((s, i) => i === 0 || s >= seqs[i - 1]) && mesa?.pila_informada === fichas,
    }
    // Los huecos: entre avisos consecutivos de la partida jugada.
    const ts = avisos.filter((l) => !String(l.codigo).startsWith('corte')).map((l) => l.t)
    const huecos = ts.slice(1).map((t, i) => t - ts[i]).sort((x, y) => x - y)
    const p = (q) => huecos.length ? huecos[Math.min(huecos.length - 1, Math.floor(q * huecos.length))] : null
    // Regla sellada (P-4 de la 1c, INV-48): vigila y tiñe.
    puntos['mesaia.8'] = {
      avisos: ts.length, manos, maxMs: huecos.at(-1) ?? null, p95Ms: p(0.95), medianaMs: p(0.5),
      nMs: N_MS, ok: huecos.length > 0 && huecos.at(-1) < N_MS,
    }
    await page.screenshot({ path: `${out}/mesaia7.png` })
    await ctx.close()
  }

  // ── mesaia.9 · P-2 · la salida que espera a una recarga en vuelo ─────────
  // La recarga voluntaria con `retrasos`: la ruta espera ANTES de pasarla al
  // banco, así que mientras tanto no está cobrada y la salida, pedida detrás,
  // no puede haber salido. Lo que se mide es el libro del banco.
  async function salidaConRecargaEnVuelo(caso) {
    const b = { saldo: SALDO }
    const { ctx, page } = await contexto(browser, base, b, errores)
    await pildoraLista(page)
    await recorrerRuta(page, 2, 'basico', 0, 'medio')
    const hay = () => page.locator('[data-accion="recargar"]').isVisible().catch(() => false)
    if (!(await jugarHasta(page, nuevoJuego(), hay))) {
      await ctx.close()
      return null
    }
    await page.click('[data-accion="recargar"]')
    await page.waitForSelector('[data-accion="recarga-si"]')
    await page.waitForTimeout(300)
    const fichas = await fichasMesa(page)
    const entrada = -movs(b.banco, 'entrada_ia')[0].monto
    b.retrasos = { recargar_ia: caso === 'tope' ? 14000 : 3000 }
    // Las recargas se cuentan AL SALIR de la página: `b.llamadas` las anota la
    // ruta al contestar, tras el retraso, y el reintento forzado contestaría
    // cuando el contexto ya se cerró.
    const enviadas = []
    page.on('request', (q) => {
      if (!q.url().includes('/rest/v1/rpc/recargar_ia')) return
      try { enviadas.push(q.postDataJSON()?.p_seq) } catch { enviadas.push(null) }
    })
    const t0 = Date.now()
    await page.click('[data-accion="recarga-si"]')
    const r = { fichas, entrada, enviadas }
    if (caso === 'tope') {
      await page.waitForSelector('[data-accion="recarga-sub"][data-rec-servidor="tope"]', { timeout: 16000 })
      r.topeMs = Date.now() - t0
      r.tarjeta = await page.evaluate(() => {
        const x = document.querySelector('.btn-leave')
        const c = x?.getBoundingClientRect()
        const encima = c ? document.elementFromPoint(c.left + c.width / 2, c.top + c.height / 2) : null
        return {
          sub: document.querySelector('[data-accion="recarga-sub"]')?.textContent?.trim() ?? null,
          si: document.querySelector('[data-accion="recarga-si"]')?.textContent?.trim() ?? null,
          siApagado: document.querySelector('[data-accion="recarga-si"]')?.disabled ?? null,
          salir: document.querySelector('[data-accion="recarga-salir"]')?.textContent?.trim() ?? null,
          xViva: !!x && !x.disabled && (encima === x || x.contains(encima)),
        }
      })
      r.recargasAlTope = movs(b.banco, 'recarga_ia').length
      await page.click('[data-accion="recarga-si"]')          // «Reintentar»: el mismo seq
      await page.waitForTimeout(300)
      await page.click('[data-accion="recarga-salir"]')
      await page.waitForSelector('[data-accion="reto"]')
    } else {
      await page.waitForTimeout(300)
      await abandonar(page)                                    // la ✕ con la recarga en vuelo
    }
    r.alSalir = { recargas: movs(b.banco, 'recarga_ia').length, salidas: movs(b.banco, 'salida_ia').length }
    const limite = Date.now() + 40000
    while (movs(b.banco, 'salida_ia').length === 0 && Date.now() < limite) await page.waitForTimeout(250)
    await pildoraLista(page, 15000).catch(() => {})
    r.pildora = await leerPildora(page)
    const recs = movs(b.banco, 'recarga_ia')
    const sals = movs(b.banco, 'salida_ia')
    r.monto = -(recs[0]?.monto ?? 0)
    r.recargas = recs.length
    r.salidas = sals.length
    r.cobrado = sals[0]?.monto ?? null
    r.saldo = b.banco.saldo
    r.esperado = SALDO - entrada + fichas
    const ll = (b.llamadas ?? []).filter((l) => l.nombre === 'recargar_ia' || l.nombre === 'salir_ia')
    r.llamadas = ll.map((l) => `${l.nombre}#${l.params?.p_seq}:${l.codigo}`)
    const iOk = ll.findIndex((l) => l.nombre === 'recargar_ia' && l.codigo === 'ok')
    const iSal = ll.findIndex((l) => l.nombre === 'salir_ia')
    r.ok = r.alSalir.recargas === 0 && r.alSalir.salidas === 0
      && r.recargas === 1 && r.salidas === 1 && r.monto > 0
      && r.cobrado === fichas + r.monto && r.saldo === r.esperado
      && iOk >= 0 && iSal > iOk && ll.filter((l) => l.nombre === 'salir_ia').length === 1
      && r.pildora?.texto === montoTexto(r.esperado)
    if (caso === 'tope') {
      r.ok = r.ok && r.topeMs >= 9500 && r.topeMs < 13000 && r.recargasAlTope === 0
        && (r.tarjeta.sub ?? '').includes('no responde') && r.tarjeta.si === 'Reintentar' && r.tarjeta.siApagado === false
        && r.tarjeta.salir === 'Salir con mis fichas' && r.tarjeta.xViva
        && enviadas.length === 2 && enviadas[0] === enviadas[1] && enviadas[0] != null
    }
    await page.screenshot({ path: `${out}/mesaia9-${caso}.png` })
    await ctx.close()
    return r
  }
  {
    const x = await salidaConRecargaEnVuelo('x')
    const tope = await salidaConRecargaEnVuelo('tope')
    if (!x) sinCobertura.push('mesaia.9a (no salió la recarga voluntaria en 6 manos)')
    if (!tope) sinCobertura.push('mesaia.9b (no salió la recarga voluntaria en 6 manos)')
    puntos['mesaia.9'] = { x, tope, ok: (x ? x.ok : true) && (tope ? tope.ok : true) }
  }

  puntos.consola = { errores, ok: errores.length === 0 }
  {
    // ECO-1e (E3) · más de la mitad del tope en una ventana de 60 s = rojo.
    const max = ventana60(vistas.map((b) => b.llamadas))
    const tabla = Object.entries(LIMITES_SQL).map(([funcion, tope]) => ({
      funcion, max: max[funcion] ?? 0, tope, mitad: tope / 2, sobreMitad: (max[funcion] ?? 0) > tope / 2,
    }))
    const sobreMitad = tabla.filter((f) => f.sobreMitad).map((f) => f.funcion)
    puntos.ventana60 = {
      max, limites: { ...LIMITES_SQL }, tabla, sobreMitad, sinTope: { informar_pila: max.informar_pila ?? 0 },
      ok: sobreMitad.length === 0,
    }
    console.log('── MESAIA · ventana de 60 s (máximo / tope; rojo por encima de la mitad)')
    for (const f of tabla) console.log(`   ${f.sobreMitad ? '✗' : '✓'} ${f.funcion.padEnd(16)} ${String(f.max).padStart(2)} / ${f.tope}  (mitad ${f.mitad})`)
    console.log(`   · informar_pila    ${String(max.informar_pila ?? 0).padStart(2)} / sin tope (P-1 de la 1d): sólo se reporta`)
  }
  const verde = Object.values(puntos).every((x) => x.ok === true)
  const resumen = `${verde ? (sinCobertura.length ? 'SIN COBERTURA' : 'VERDE') : 'ROJO'} · ` +
    Object.entries(puntos).map(([k, v]) => `${k} ${v.ok ? '✓' : '✗'}`).join(' · ')
  console.log(`── MESAIA · ${resumen}`)
  return { verde, puntos, sinCobertura, resumen }
}

export async function runRevive(browser, { base, out = 'capturas-mesaia' }) {
  const errores = []
  const page = await browser.newPage({ viewport: { width: 1366, height: 768 } })
  page.on('pageerror', (e) => errores.push(`pageerror: ${e.message}`))
  await page.goto(`${base}/?apu=saldo:${SALDO},allinIA,gana`)
  await recorrerRuta(page, 2, 'basico', 0, 'piso')
  const juego = nuevoJuego()
  const r = await jugarMano(page, juego, { cada: 0, muestraFinal: false })
  const voluntaria = await page.locator('[data-accion="recargar"]').isVisible().catch(() => false)
  let recargo = false
  if (voluntaria) {
    await page.click('[data-accion="recargar"]')
    await page.waitForSelector('[data-accion="recarga-si"]')
    await page.click('[data-accion="recarga-si"]')
    await page.waitForSelector('[data-accion="recarga"]', { state: 'detached', timeout: 10000 })
    recargo = true
  }
  await page.locator('button:has-text("Siguiente mano")').click().catch(() => {})
  // Con D-1 arreglado la IA no vuelve: la mesa se cierra con la victoria. Sin
  // el arreglo se reparte otra mano (la IA, nivelada, sigue sentada).
  const fin = await Promise.race([
    page.waitForSelector('.cel-screen', { timeout: 15000 }).then(() => 'victoria').catch(() => null),
    page.waitForSelector('.action-buttons [data-accion]', { timeout: 15000 }).then(() => 'otra-mano').catch(() => null),
  ])
  await page.screenshot({ path: `${out}/revive.png` })
  const recargas = await page.evaluate(() => window.__ajileiBancoImitado?.banco?.libro.filter((l) => l.tipo === 'recarga_ia').length ?? null)
  await page.close()
  const ok = r.cerrada && voluntaria && recargo && recargas === 1 && fin === 'victoria' && errores.length === 0
  const resumen = `${ok ? 'VERDE' : 'ROJO'} · primera mano ${r.cerrada ? 'cerrada' : 'sin cerrar'} · voluntaria ${voluntaria} · recargas ${recargas} · después: ${fin}`
  console.log(`── REVIVE · ${resumen}`)
  return { verde: ok, voluntaria, recargo, recargas, fin, errores, resumen }
}
