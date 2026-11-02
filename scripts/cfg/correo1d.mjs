// ── CFG-1 1d · el cambio de correo en el modo `cfg` ─────────────────────────
// Rector: AJILEI_CFG-1_Fase1d_v1.0.md §4. Una puerta, `cfg.correo`.
//
// CONTRA EL BUNDLE REAL (4173) con la sesión simulada de `contextoCap`: el SDK
// de Auth es el de verdad, y lo que no existe aquí es el servidor, que lo
// contesta el banco imitado por las rutas `/auth/v1/user`, `/verify` y
// `/resend`, con las formas de GoTrue v2.197.0 (sonda de la 1d). El arnés mueve
// el reloj del envío desde Node. Los cinco mandos `?cfg=correo-*` van contra el
// servidor de desarrollo con bypass (`baseDev`).
//
//   la fila        enmascarada, con «›» y sin «Pronto»; pendiente, con la
//                  dirección nueva enmascarada; sobrevive a recargar; se apaga
//                  cuando el código vence aunque `new_email` siga en el servidor
//   el editor      arriba en el teléfono; el correo actual completo; zonas de 44
//                  y sin solapes; «Confirmar» a la vista con el teclado (360×640
//                  y 412×915, el teclado tapa)
//   los errores    no válido y el mismo sin viaje; en uso y límite con viaje; el
//                  botón no se mueve al salir un error (O1)
//   los códigos    uno malo se marca y el bueno queda aceptado; vencido lo dice
//                  el reloj; cruzados completan; «Reenviar» manda el correo
//                  ACTUAL y vacía los dos campos; con algo pendiente el editor
//                  dice «Cerrar», enseña «Continuar en N s» y no apaga la fila
//   hecho          el aviso con la dirección, la fila, la hoja ⚙ y la sesión con
//                  el correo nuevo; `profiles` no se toca ni se relee
//   el bypass      `?cfg=correo-normal|pendiente|en-uso|codigo-mal|limite`

const CELDAS_CORREO = [
  { w: 360, h: 640, movil: true, teclado: 260 },
  { w: 412, h: 915, movil: true, teclado: 336 },
  { w: 915, h: 412, movil: true },
  { w: 1366, h: 768, movil: false },
  { w: 1920, h: 1080, movil: false },
]
const CORREO_CAP = 'cap@example.invalid'
const NUEVO = 'nuevo.correo@gmail.com'
const OTRO = 'otro.correo@gmail.com'
const COD_ACTUAL = '111111'
const COD_NUEVO = '222222'
const ZONA_GEO = 43.5
const ZONA_EFECTIVA = 43
// O1: la ranura reserva dos líneas en em y el navegador redondea el subpíxel (0,02 px).
const quieto = (a, b) => Math.abs(a - b) <= 0.05

const A = (n) => `[data-accion="${n}"]`

async function rutaCorreo(ctx, banco, perfil) {
  const viajes = { get: 0, put: [], verify: [], resend: [], perfiles: 0, patch: 0 }
  // `error_code` además de `code`: el SDK solo lee `code` si ve la cabecera de
  // versión, que una respuesta entre orígenes no le enseña.
  const responde = (ruta, { status, cuerpo }) => {
    const b = cuerpo.code && status !== 200 ? { ...cuerpo, error_code: cuerpo.code, msg: cuerpo.message } : cuerpo
    return ruta.fulfill({ status, contentType: 'application/json', body: JSON.stringify(b) })
  }
  const conId = (u) => ({ ...u, id: perfil.id })
  await ctx.route(/\/auth\/v1\/(user|verify|resend)(\?|$)/, async (ruta) => {
    const r = ruta.request()
    const camino = new URL(r.url()).pathname
    let cuerpo = {}
    try { cuerpo = r.postDataJSON() ?? {} } catch { cuerpo = {} }
    if (camino.endsWith('/user') && r.method() === 'GET') {
      viajes.get += 1
      return responde(ruta, { status: 200, cuerpo: conId(banco.correoUsuario()) })
    }
    if (camino.endsWith('/user')) {
      viajes.put.push(cuerpo.email)
      const x = banco.correoPedir(cuerpo.email)
      return responde(ruta, x.status === 200 ? { status: 200, cuerpo: conId(x.cuerpo) } : x)
    }
    if (camino.endsWith('/verify')) {
      viajes.verify.push([cuerpo.email, cuerpo.token, cuerpo.type])
      const x = banco.correoVerificar(cuerpo.email, cuerpo.token)
      return responde(ruta, x.cuerpo.access_token ? { status: 200, cuerpo: { ...x.cuerpo, user: conId(x.cuerpo.user) } } : x)
    }
    viajes.resend.push(cuerpo)
    return responde(ruta, banco.correoReenviar(cuerpo.email))
  })
  await ctx.route(/\/rest\/v1\/profiles/, async (ruta) => {
    const r = ruta.request()
    if (r.method() === 'PATCH') viajes.patch += 1
    else viajes.perfiles += 1
    const fila = { ...banco.leerPerfil().data, id: perfil.id }
    const objeto = (r.headers().accept || '').includes('vnd.pgrst.object')
    return ruta.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(objeto ? fila : [fila]) })
  })
  return viajes
}

const LEER_FILA = () => {
  const f = document.querySelector('[data-accion="pf-fila-correo"]')
  if (!f) return null
  return {
    valor: f.querySelector('.pf-valor')?.innerText.replace(/\n/g, ' / ') ?? '',
    chev: !!f.querySelector('.lob-chev'),
    pronto: !!f.querySelector('.lob-pastilla'),
    alto: f.getBoundingClientRect().height,
  }
}
const LEER_TARJETA = () => {
  const c = document.querySelector('.cor-card')
  if (!c) return null
  const b = c.getBoundingClientRect()
  const btn = c.querySelector('.puerta-btn')
  return {
    paso: c.dataset.cor,
    arriba: b.top,
    baja: b.bottom,
    boton: btn ? { y: btn.getBoundingClientRect().top, baja: btn.getBoundingClientRect().bottom, texto: btn.textContent.trim(), apagado: btn.disabled } : null,
    aviso: c.querySelector('[data-accion="cor-aviso"]')?.textContent ?? null,
    actual: c.querySelector('[data-accion="cor-actual"]')?.textContent ?? null,
    dir1: c.querySelector('[data-accion="cor-c1-dir"]')?.textContent ?? null,
    dir2: c.querySelector('[data-accion="cor-c2-dir"]')?.textContent ?? null,
    c1: c.querySelector('#cor-c1')?.value ?? null,
    c2: c.querySelector('#cor-c2')?.value ?? null,
    mal1: !!c.querySelector('#cor-c1.is-error'),
    mal2: !!c.querySelector('#cor-c2.is-error'),
    reenviar: c.querySelector('[data-accion="cor-reenviar"]')?.textContent ?? null,
    reenviarApagado: c.querySelector('[data-accion="cor-reenviar"]')?.disabled ?? null,
    salida: c.querySelector('[data-accion="cor-cancelar"]')?.textContent ?? null,
  }
}

export async function correo1d(browser, { base, baseDev }, errores, anota, { abrirLobby, bancoCon, MEDIR, esperarQuieta, perfil: PERFIL }) {
  for (const celda of CELDAS_CORREO) {
    const id = `${celda.w}x${celda.h}`
    let ctx = null
    let paso = 'abrir'
    // Los 4xx son las respuestas pedidas: Chromium los apunta en la consola.
    const propios = []
    try {
      const banco = bancoCon(CORREO_CAP)
      let viajes = null
      ;({ ctx } = await abrirLobby(browser, base, celda, propios, {
        billetera: { banco },
        antes: async (c) => { viajes = await rutaCorreo(c, banco, PERFIL) },
      }))
      const page = ctx.pages()[0]
      const al = async () => {
        await page.click('.lob-top [data-accion="perfil"]')
        await page.waitForSelector('.pf-cab')
      }
      const fila = () => page.evaluate(LEER_FILA)
      const tarjeta = () => page.evaluate(LEER_TARJETA)
      const zonas = async (que) => {
        const m = await page.evaluate(MEDIR, { dentro: '.cor-overlay' })
        const cortos = m.tocables.filter((x) => Math.min(...x.zona) < ZONA_GEO || !x.efectiva || Math.min(...x.efectiva) < ZONA_EFECTIVA)
        const tipos = new Set(m.tocables.map((x) => x.tipo))
        anota('correo', !cortos.length && !m.solapes.length && tipos.has('confirmar') && tipos.has('campo'),
          { celda: id, que: `zonas: ${que}`, cortos: cortos.map((x) => [x.n, x.zona, x.efectiva]), solapes: m.solapes, tipos: [...tipos] })
      }
      const esperaAviso = (re) => page.waitForFunction((src) => new RegExp(src).test(document.querySelector('[data-accion="cor-aviso"]')?.textContent ?? ''), re, { timeout: 8000 })
      const pedir = async (correo, re) => {
        await page.fill('#cor-nuevo', correo)
        await page.press('#cor-nuevo', 'Enter')
        await esperaAviso(re)
        return tarjeta()
      }
      const recargar = async () => {
        await page.goto(base)
        await page.waitForSelector('main.lobby .lob-pildora .bd-num', { timeout: 30000 })
        await esperarQuieta(page)
        await al()
        await page.waitForTimeout(250)
      }

      // ── La fila normal y el editor ─────────────────────────────────────
      paso = 'fila normal'
      await al()
      await page.waitForFunction(() => /•••/.test(document.querySelector('[data-accion="pf-fila-correo"] .pf-valor')?.textContent ?? ''), null, { timeout: 8000 })
      const f0 = await fila()
      anota('correo', f0.valor === 'c•••@example.invalid' && f0.chev && !f0.pronto && f0.alto >= 43.9, { celda: id, que: 'la fila: enmascarada, con «›» y sin «Pronto»', ...f0 })

      paso = 'editor'
      await page.click(A('pf-fila-correo'))
      await page.waitForSelector('.cor-card[data-cor="editor"]')
      await page.waitForTimeout(650)
      const t0 = await tarjeta()
      const arribaOk = celda.w <= 680 || celda.h <= 520 ? t0.arriba <= 24 : true
      anota('correo', arribaOk && t0.actual === CORREO_CAP && t0.salida === 'Cancelar', { celda: id, que: 'el editor: arriba en el teléfono y el correo completo', arriba: t0.arriba, actual: t0.actual, salida: t0.salida })
      await zonas('el editor')
      if (celda.teclado) {
        anota('correo', t0.boton.baja <= celda.h - celda.teclado, { celda: id, que: 'teclado: «Continuar» a la vista', boton: t0.boton.baja, linea: celda.h - celda.teclado })
      }

      // ── Los errores del editor ─────────────────────────────────────────
      paso = 'errores'
      const yBoton = (await page.evaluate(() => document.querySelector('.cor-card .puerta-btn').getBoundingClientRect().top))
      const e1 = await pedir('nuevo@correo', 'no es válido')
      const e2 = await pedir(`  ${CORREO_CAP.toUpperCase()} `, 'mismo correo')
      anota('correo', viajes.put.length === 0 && quieto(e1.boton.y, yBoton) && quieto(e2.boton.y, yBoton), { celda: id, que: 'no válido y el mismo: sin viaje, y el botón quieto', put: viajes.put, y: [yBoton, e1.boton.y, e2.boton.y] })
      const e3 = await pedir('test1976@gmail.com', 'ya tiene una cuenta')
      banco.forzarCorreo('limite')
      const e4 = await pedir(NUEVO, 'Demasiados intentos')
      banco.forzarCorreo(null)
      anota('correo', viajes.put.length === 2 && banco.correoAuth.nuevo === null && quieto(e3.boton.y, yBoton) && quieto(e4.boton.y, yBoton), { celda: id, que: 'en uso y límite: con viaje y sin cambio', put: viajes.put, nuevo: banco.correoAuth.nuevo })

      // ── Pedir: los códigos y la fila pendiente ─────────────────────────
      paso = 'pedir'
      await page.fill('#cor-nuevo', ' Nuevo.Correo@GMAIL.com')
      await page.press('#cor-nuevo', 'Enter')
      await page.waitForSelector('.cor-card[data-cor="codigos"]')
      await page.waitForTimeout(100)
      const t1 = await tarjeta()
      anota('correo', viajes.put.at(-1) === NUEVO && t1.dir1 === CORREO_CAP && t1.dir2 === NUEVO && t1.boton.apagado && t1.reenviarApagado && /^Reenviar en \d+ s$/.test(t1.reenviar) && t1.aviso === 'Si no confirmas en 10 minutos, el cambio se anula solo.',
        { celda: id, que: 'los códigos: normaliza, las dos direcciones, la espera y los 10 minutos', put: viajes.put.at(-1), ...t1 })
      await zonas('los códigos')
      if (celda.teclado) {
        anota('correo', t1.boton.baja <= celda.h - celda.teclado, { celda: id, que: 'teclado: «Confirmar» a la vista', boton: t1.boton.baja, linea: celda.h - celda.teclado })
      }

      paso = 'pendiente'
      await page.click(A('cor-cerrar'))
      await page.waitForSelector('.cor-card', { state: 'detached' })
      const f1 = await fila()
      anota('correo', f1.valor === 'Pendiente: n•••@gmail.com / Revisa tus dos correos' && f1.chev && banco.correoAuth.nuevo === NUEVO, { celda: id, que: '«Cerrar» deja la fila pendiente', ...f1 })
      await recargar()
      await page.waitForFunction(() => /Pendiente/.test(document.querySelector('[data-accion="pf-fila-correo"]')?.textContent ?? ''), null, { timeout: 8000 })
      anota('correo', (await fila()).valor.startsWith('Pendiente: n•••@gmail.com'), { celda: id, que: 'lo pendiente sobrevive a recargar', get: viajes.get })

      // ── Con algo pendiente: «Usar otro correo» ─────────────────────────
      paso = 'usar otro'
      await page.click(A('pf-fila-correo'))
      await page.waitForSelector('.cor-card[data-cor="codigos"]')
      await page.click(A('cor-otro'))
      await page.waitForSelector('.cor-card[data-cor="editor"]')
      await page.fill('#cor-nuevo', OTRO)
      await page.waitForTimeout(100)
      const t2 = await tarjeta()
      const puts = viajes.put.length
      await page.press('#cor-nuevo', 'Enter')
      await page.waitForTimeout(150)
      anota('correo', t2.salida === 'Cerrar' && t2.boton.apagado && /^Continuar en \d+ s$/.test(t2.boton.texto) && viajes.put.length === puts, { celda: id, que: 'con algo pendiente: «Cerrar» y «Continuar en N s», sin chocar', ...t2 })
      await page.click(A('cor-cancelar'))
      await page.waitForSelector('.cor-card', { state: 'detached' })
      anota('correo', (await fila()).valor.startsWith('Pendiente:') && banco.correoAuth.nuevo === NUEVO, { celda: id, que: 'ese «Cerrar» no apaga lo pendiente', nuevo: banco.correoAuth.nuevo })

      // ── Un código malo y el otro bueno ─────────────────────────────────
      paso = 'código malo'
      await page.click(A('pf-fila-correo'))
      await page.waitForSelector('.cor-card[data-cor="codigos"]')
      await page.waitForTimeout(650)   // la entrada de la tarjeta (`panel-enter`, 0,55 s)
      await page.fill('#cor-c1', `${COD_ACTUAL.slice(0, 3)} ${COD_ACTUAL.slice(3)}`)
      await page.fill('#cor-c2', '000000')
      const pegado = (await tarjeta()).c1
      const yb = (await tarjeta()).boton.y
      await page.click(A('cor-confirmar'))
      await esperaAviso('correo nuevo no es correcto')
      const t3 = await tarjeta()
      anota('correo', pegado === COD_ACTUAL && t3.mal2 && !t3.mal1 && banco.correoAuth.confirmados === 1 && quieto(t3.boton.y, yb) && banco.correoAuth.nuevo === NUEVO,
        { celda: id, que: 'uno malo: lo pegado entra entero, se marca el malo y el bueno queda aceptado', pegado, mal: [t3.mal1, t3.mal2], confirmados: banco.correoAuth.confirmados, y: [yb, t3.boton.y] })

      // ── «Reenviar», con el correo actual ───────────────────────────────
      paso = 'reenviar'
      banco.envejecerCambioCorreo(61_000)
      await recargar()
      await page.click(A('pf-fila-correo'))
      await page.waitForSelector('.cor-card[data-cor="codigos"]')
      await page.waitForTimeout(100)
      const t4 = await tarjeta()
      await page.fill('#cor-c1', '123456')
      await page.click(A('cor-reenviar'))
      await esperaAviso('dos códigos nuevos')
      const t5 = await tarjeta()
      anota('correo', t4.reenviar === 'Reenviar' && !t4.reenviarApagado && viajes.resend.length === 1 && viajes.resend[0].email === CORREO_CAP && viajes.resend[0].type === 'email_change'
        && t5.c1 === '' && t5.c2 === '' && t5.reenviarApagado && banco.correoAuth.confirmados === 0,
        { celda: id, que: '«Reenviar»: el correo ACTUAL, vacía los campos y vuelve a esperar', antes: t4.reenviar, resend: viajes.resend, c1: t5.c1, confirmados: banco.correoAuth.confirmados })

      // ── Vencido: lo dice el reloj, y la fila se apaga ──────────────────
      paso = 'vencido'
      banco.envejecerCambioCorreo(601_000)
      await page.fill('#cor-c1', COD_ACTUAL)
      await page.fill('#cor-c2', COD_NUEVO)
      const v0 = viajes.verify.length
      await page.click(A('cor-confirmar'))
      await esperaAviso('vencieron')
      const t6 = await tarjeta()
      anota('correo', t6.mal1 && t6.mal2 && viajes.verify.length === v0 + 1, { celda: id, que: 'vencido: el texto, los dos marcados y una sola llamada', llamadas: viajes.verify.length - v0, aviso: t6.aviso })
      await recargar()
      await page.waitForFunction(() => /•••/.test(document.querySelector('[data-accion="pf-fila-correo"] .pf-valor')?.textContent ?? ''), null, { timeout: 8000 })
      const f2 = await fila()
      anota('correo', f2.valor === 'c•••@example.invalid' && banco.correoAuth.nuevo === NUEVO, { celda: id, que: 'vencido: la fila vuelve a normal aunque `new_email` siga en el servidor', ...f2, nuevo: banco.correoAuth.nuevo })

      // ── Hecho, con los códigos cruzados ────────────────────────────────
      paso = 'hecho'
      await page.click(A('pf-fila-correo'))
      await page.waitForSelector('.cor-card[data-cor="editor"]')
      const t7 = await tarjeta()
      await page.fill('#cor-nuevo', OTRO)
      await page.press('#cor-nuevo', 'Enter')
      await page.waitForSelector('.cor-card[data-cor="codigos"]')
      const perfiles = viajes.perfiles
      const v1 = viajes.verify.length
      await page.fill('#cor-c1', COD_NUEVO)
      await page.fill('#cor-c2', COD_ACTUAL)
      await page.click(A('cor-confirmar'))
      await page.waitForSelector('.cor-card', { state: 'detached', timeout: 8000 })
      await page.waitForSelector('.sal-toast.is-on')
      const hecho = await page.evaluate(() => {
        const clave = Object.keys(localStorage).find((k) => /^sb-.*-auth-token$/.test(k))
        let email = null
        try { email = JSON.parse(localStorage.getItem(clave))?.user?.email ?? null } catch { email = null }
        const t = document.querySelector('.sal-toast')
        const b = t.getBoundingClientRect()
        return { toast: t.textContent, dentro: b.left >= 0 && b.right <= innerWidth, email, perfil: !!document.querySelector('.pf-cab') }
      })
      const f3 = await fila()
      const verificados = viajes.verify.slice(v1)
      anota('correo', t7.salida === 'Cancelar' && hecho.toast === `Listo: desde ahora entras con ${OTRO}` && hecho.dentro && hecho.email === OTRO && hecho.perfil && f3.valor === 'o•••@gmail.com' && banco.correoAuth.email === OTRO && banco.correoAuth.nuevo === null
        && verificados.length === 4 && verificados.every((v) => v[2] === 'email_change'),
        { celda: id, que: 'hecho con los códigos cruzados: el aviso, la fila y la sesión', ...hecho, fila: f3.valor, verificados })
      anota('correo', viajes.patch === 0 && viajes.perfiles === perfiles, { celda: id, que: '`profiles` no se toca ni se relee', patch: viajes.patch, relecturas: viajes.perfiles - perfiles })

      await page.click('.lob-top [data-accion="ajustes"]')
      await page.waitForSelector('.lob-hoja.is-on')
      const hoja = await page.evaluate(() => document.querySelector('.lob-hoja-correo')?.textContent ?? null)
      anota('correo', hoja === 'o•••@gmail.com', { celda: id, que: 'la hoja ⚙ enseña el correo nuevo, de la sesión', hoja })

      errores.push(...propios.filter((e) => !/Failed to load resource/.test(e)))
    } catch (e) {
      anota('correo', false, { celda: id, paso, error: String(e?.message ?? e).split('\n').slice(0, 3).join(' | ') })
    } finally { await ctx?.close().catch(() => {}) }
  }

  // ── Los cinco mandos del bypass ─────────────────────────────────────────
  if (!baseDev) {
    anota('correo', false, { que: 'los mandos del bypass', error: 'sin servidor de desarrollo (baseDev)' })
    return
  }
  const mando = async (nombre, prueba) => {
    let ctx = null
    try {
      ctx = await browser.newContext({ viewport: { width: 412, height: 915 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 })
      const page = await ctx.newPage()
      page.on('pageerror', (e) => errores.push(`bypass ${nombre} pageerror: ${e.message}`))
      await page.goto(`${baseDev}?cfg=correo-${nombre}`, { waitUntil: 'domcontentloaded' })
      await page.waitForSelector('main.lobby', { timeout: 30000 })
      await page.click('.lob-top [data-accion="perfil"]')
      await page.waitForSelector('.pf-cab')
      await page.waitForFunction(() => /•••/.test(document.querySelector('[data-accion="pf-fila-correo"] .pf-valor')?.textContent ?? ''), null, { timeout: 8000 })
      await prueba(page)
    } catch (e) {
      anota('correo', false, { que: `?cfg=correo-${nombre}`, error: String(e?.message ?? e).split('\n')[0] })
    } finally { await ctx?.close().catch(() => {}) }
  }
  const leerFila = (page) => page.evaluate(LEER_FILA)
  const abrir = async (page, sel) => { await page.click(A('pf-fila-correo')); await page.waitForSelector(sel) }
  const avisoEs = (page, re) => page.waitForFunction((src) => new RegExp(src).test(document.querySelector('[data-accion="cor-aviso"]')?.textContent ?? ''), re, { timeout: 8000 })

  await mando('normal', async (page) => {
    const f = await leerFila(page)
    await abrir(page, '.cor-card[data-cor="editor"]')
    await page.fill('#cor-nuevo', NUEVO)
    await page.press('#cor-nuevo', 'Enter')
    await page.waitForSelector('.cor-card[data-cor="codigos"]')
    await page.fill('#cor-c1', COD_ACTUAL)
    await page.fill('#cor-c2', COD_NUEVO)
    await page.click(A('cor-confirmar'))
    await page.waitForSelector('.sal-toast.is-on', { timeout: 8000 })
    const g = await leerFila(page)
    anota('correo', f.valor === 'd•••@ajilei.test' && g.valor === 'n•••@gmail.com', { que: '?cfg=correo-normal: el cambio entero', antes: f.valor, despues: g.valor })
  })
  await mando('pendiente', async (page) => {
    const f = await leerFila(page)
    await abrir(page, '.cor-card[data-cor="codigos"]')
    const t = await page.evaluate(LEER_TARJETA)
    anota('correo', f.valor.startsWith('Pendiente: n•••@gmail.com') && t.dir2 === NUEVO && t.reenviarApagado && /^Reenviar en (3|4)\d s$/.test(t.reenviar), { que: '?cfg=correo-pendiente: la fila y la espera que queda', fila: f.valor, reenviar: t.reenviar })
  })
  await mando('en-uso', async (page) => {
    await abrir(page, '.cor-card[data-cor="editor"]')
    await page.fill('#cor-nuevo', NUEVO)
    await page.press('#cor-nuevo', 'Enter')
    await avisoEs(page, 'ya tiene una cuenta')
    anota('correo', true, { que: '?cfg=correo-en-uso' })
  })
  await mando('codigo-mal', async (page) => {
    await abrir(page, '.cor-card[data-cor="editor"]')
    await page.fill('#cor-nuevo', NUEVO)
    await page.press('#cor-nuevo', 'Enter')
    await page.waitForSelector('.cor-card[data-cor="codigos"]')
    await page.fill('#cor-c1', COD_ACTUAL)
    await page.fill('#cor-c2', COD_NUEVO)
    await page.click(A('cor-confirmar'))
    await avisoEs(page, 'Los dos códigos no son correctos')
    anota('correo', true, { que: '?cfg=correo-codigo-mal' })
  })
  await mando('limite', async (page) => {
    await abrir(page, '.cor-card[data-cor="editor"]')
    await page.fill('#cor-nuevo', NUEVO)
    await page.press('#cor-nuevo', 'Enter')
    await avisoEs(page, 'Demasiados intentos')
    anota('correo', true, { que: '?cfg=correo-limite' })
  })
}
