// ── RNK-1c-ii · el modo `rnk` de diagDSK ────────────────────────────────────
// Rector: AJILEI_RNK-1_Fase1c-ii_v1.0.md §2.5. Vive en su módulo, como `tam` y
// `video`; diagDSK sólo lo llama y lee su veredicto por `verde`.
//
// CONTRA EL BUNDLE REAL (4173) Y EL BANCO IMITADO. `vite preview` no tiene el
// bypass (D-7 de la 1c-i): la sesión es la simulada de `contextoCap` y el
// servidor, el banco imitado POR CONTEXTO (`billetera.banco`), el mismo camino
// que `saldo` y `mesaia` (INV-16). Al banco se le siembran los 139 jugadores
// del bypass (`sembradosRanking`) y la cuenta del arnés suma los puntos del
// bypass: queda en el 7 de Maestros, como `DevLocal` en el 5173. Las celdas que
// necesitan otra población (menos de 100, sin puntos, un jugador que ya no
// existe) llevan su propio banco.
//
// LAS PUERTAS (cada una mide lo que dice; una celda sin medir es roja):
//   rnk-abre      del lobby, `[data-accion="rankings"]` lleva a Maestros «listo»
//   rnk-fila      fila 56 ± 0,5, círculo 34,7 ± 0,5, como mucho 100 filas
//   rnk-banda     la banda existe, mide lo de la lámina según `--u` y no se
//                 mueve al llevar la lista al final
//   rnk-desplaza  la lista al final: cuerpo y página en 0, cabecera pegada
//   rnk-fin       «Se muestran los 100 primeros.» con 100 filas; con 6, nada
//   rnk-2col      dos columnas en 832×384, 851×393, 915×412 y 1366×623; una en
//                 360×640 y 1920×1080
//   rnk-oro       la medalla del 1 sin relleno; el único oro macizo, el «+»
//   rnk-vino      Fortunas pinta `--fondo-vino` y la píldora sigue legible
//                 (≥ 4,5 : 1 contra el tono más claro del vino)
//   rnk-perfil    la fila 3 abre el dialog con su nombre, llega a «listo», mide
//                 lo de la lámina; ✕, velo y Escape cierran y el foco vuelve;
//                 un ajeno sin puntos dice «Aún no está en este ranking»
//                 (Ajuste B), no la frase de la banda
//   rnk-propio    la banda abre el propio (468 ± 2, «Solo lo ves tú.», «Editar»
//                 apagado, el correo de la sesión); con la banda en «Gana tu
//                 primera mano para entrar» también abre, con esa línea
//   rnk-uuid      ni un uuid en la pantalla ni en el dialog; el ajeno sin correo
//   rnk-escala    ninguna raíz con `data-escala`; el dialog fuera de `#root`
//   rnk-nohay     un jugador que ya no está → toast «Jugador no encontrado»,
//                 la tarjeta se va y la lista se vuelve a pedir (+1 llamada)
//   consola       sin errores de página
//
// DESVIACIÓN ANOTADA (informe 1c-ii §M): la ficha pide 400 × 317 en 412×915;
// la fórmula sellada (`min(100%, 92u, 400px)`) y la lámina dan 379 × 317 ahí,
// y la puerta mide contra la lámina.

import { contextoCap, PERFIL_CAP } from '../cap/capMesa.mjs'
import { crearBanco } from '../../src/dev/bancoImitado.js'
import { sembradosRanking, PUNTOS_DEL_BYPASS } from '../../src/dev/sembradosRanking.js'

const YO = PERFIL_CAP.username
const CORREO = 'cap@example.invalid'   // el de la sesión simulada de `contextoCap`
const UUID = /[0-9a-f]{8}-[0-9a-f]{4}-/i
const TOL = 0.5

// La lámina §4 (informe 1-L): la banda por `--u` y el mini-perfil por tamaño.
const BANDA = { '360x640': 78.9, '412x915': 82, '915x412': 82, '744x1100': 93.5, '1366x623': 93.5, '1920x1080': 93.5 }
const PERFIL = { '412x915': { w: 379, h: 317 }, '915x412': { w: 600, h: 174 } }
const PROPIO_H = 468
const DOS_COL = { '832x384': true, '851x393': true, '915x412': true, '1366x623': true, '360x640': false, '1920x1080': false }

// Un banco que cuenta las llamadas y que puede «perder» a un jugador para
// `mini_perfil` (el que se renombró o se borró entre la lista y el toque).
function bancoDe({ sembrados = sembradosRanking(), puntos = PUNTOS_DEL_BYPASS, perdido = null } = {}) {
  const b = crearBanco({ usuario: YO, sembrados })
  if (puntos) b.sumarPuntos(YO, puntos)
  const cuenta = {}
  return {
    cuenta,
    banco: {
      get saldo() { return b.saldo },
      llamar(nombre, params) {
        cuenta[nombre] = (cuenta[nombre] ?? 0) + 1
        if (nombre === 'mini_perfil' && perdido && String(params?.p_username).toLowerCase() === perdido.toLowerCase()) return []
        return b.llamar(nombre, params)
      },
    },
  }
}

const TAMANOS = [[360, 640], [412, 915], [915, 412], [744, 1100], [1366, 623], [1920, 1080], [832, 384], [851, 393]]

async function abrirRankings(browser, base, w, h, banco, errores) {
  const { ctx, page } = await contextoCap(browser, { w, h, dpr: 1, movil: false }, base, { billetera: { banco } })
  page.on('pageerror', (e) => errores.push(`${w}x${h} pageerror: ${e.message}`))
  page.on('console', (m) => { if (m.type() === 'error') errores.push(`${w}x${h} console: ${m.text()}`) })
  await page.goto(base)
  await page.waitForSelector('[data-accion="rankings"]', { timeout: 30000 })
  await page.click('[data-accion="rankings"]')
  await page.waitForSelector('main.sal[data-ranking="maestros"][data-rnk-estado="listo"]', { timeout: 15000 })
  await page.waitForTimeout(300)
  await page.mouse.move(2, 2)
  return { ctx, page }
}

const MEDIR = () => {
  const q = (s) => document.querySelector(s)
  const r = (el) => el.getBoundingClientRect()
  const lista = q('.rnk-lista'), sub = q('.rnk-sub'), tu = q('.rnk-tu')
  const filas = [...document.querySelectorAll('.rnk-filas .rnk-fila')]
  const f1 = filas[0]
  const med = q('.rnk-fila[data-puesto="1"] .rnk-medalla')
  // Todo fondo de oro macizo (el `--gold-brand` con α ≥ 0,9) que se pinte.
  const oros = [...document.querySelectorAll('body *')].filter((el) => {
    const c = getComputedStyle(el).backgroundColor.match(/rgba?\(([^)]+)\)/)
    if (!c) return false
    const [R, G, B, A = 1] = c[1].split(',').map(Number)
    return R === 232 && G === 184 && B === 75 && A >= 0.9 && el.getBoundingClientRect().width > 0
  }).map((el) => el.className || el.tagName)
  return {
    ranking: q('main.sal')?.dataset.ranking,
    filas: filas.length,
    filaH: f1 ? r(f1).height : null,
    av: f1 ? r(f1.querySelector('.rnk-av')).width : null,
    banda: tu ? r(tu).height : null,
    bandaTop: tu ? r(tu).top : null,
    dosColumnas: lista && sub ? r(lista).left > r(sub).right - 1 : null,
    fin: !!q('.rnk-fin'),
    medalla1: med ? { fondo: getComputedStyle(med).backgroundColor, borde: getComputedStyle(med).borderTopWidth } : null,
    oros,
    escala: !!q('[data-escala]'),
  }
}

const AL_FINAL = async () => {
  const q = (s) => document.querySelector(s)
  const lista = q('.rnk-lista')
  const tu0 = q('.rnk-tu').getBoundingClientRect().top
  lista.scrollTop = 1e6
  await new Promise((ok) => requestAnimationFrame(() => requestAnimationFrame(ok)))
  return {
    listaAbajo: lista.scrollTop > 0 && Math.abs(lista.scrollTop + lista.clientHeight - lista.scrollHeight) < 1.5,
    cuerpo: q('.sal-cuerpo').scrollTop,
    pagina: document.scrollingElement.scrollTop,
    cabeceraPegada: Math.abs(q('.rnk-cab-lista').getBoundingClientRect().top - lista.getBoundingClientRect().top) < 1.5,
    bandaQuieta: Math.abs(q('.rnk-tu').getBoundingClientRect().top - tu0) < 0.5,
  }
}

const TARJETA = () => {
  const t = document.querySelector('.mp-tarjeta')
  if (!t) return null
  const b = t.getBoundingClientRect()
  const velo = document.querySelector('.mp-velo')
  return {
    w: b.width, h: b.height,
    rol: t.getAttribute('role'), modal: t.getAttribute('aria-modal'),
    nombre: document.getElementById(t.getAttribute('aria-labelledby'))?.textContent ?? null,
    estado: velo.dataset.mpEstado,
    enRoot: document.getElementById('root').contains(t),
    padreBody: velo.parentElement === document.body,
    foco: document.activeElement?.dataset?.accion ?? null,
    html: t.outerHTML,
    solo: !!t.querySelector('.mp-solo'),
    editarApagado: t.querySelector('.mp-editar')?.disabled ?? null,
    correo: t.querySelector('.mp-correo span')?.textContent ?? null,
    maestros: t.querySelector('[data-mp-linea="maestros"] .mp-linea')?.textContent ?? null,
  }
}

const focoEn = (page) => page.evaluate(() => {
  const a = document.activeElement
  return a ? `${a.dataset.accion ?? a.tagName}${a.dataset.puesto ? `:${a.dataset.puesto}` : ''}` : null
})

async function abrirTarjeta(page, sel) {
  await page.click(sel)
  await page.waitForSelector('.mp-velo[data-mp-estado="listo"]', { timeout: 5000 })
  await page.waitForTimeout(100)
  return page.evaluate(TARJETA)
}

// El contraste WCAG de dos colores opacos [r, g, b].
function contraste(a, b) {
  const L = ([r, g, bl]) => {
    const c = [r, g, bl].map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4 })
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]
  }
  const [x, y] = [L(a), L(b)].sort((p, q) => q - p)
  return (x + 0.05) / (y + 0.05)
}
const rgba = (s) => { const m = s.match(/rgba?\(([^)]+)\)/); const [r, g, b, a = 1] = m[1].split(',').map(Number); return [r, g, b, a] }
const sobre = ([r, g, b, a], [R, G, B]) => [r * a + R * (1 - a), g * a + G * (1 - a), b * a + B * (1 - a)]

export async function runRnk(browser, { base }) {
  const errores = []
  const puertas = {}
  const p = (k) => (puertas[k] ??= { fallos: [], medidas: [], esperadas: 0 })
  const anota = (k, ok, quien, valor) => {
    const x = p(k)
    x.medidas.push(`${quien} ${valor}`)
    if (!ok) x.fallos.push(`${quien} ${valor}`)
  }
  const espera = (k, n) => { p(k).esperadas += n }
  for (const [k, n] of Object.entries({ 'rnk-abre': 2, 'rnk-fila': 3, 'rnk-banda': 6, 'rnk-desplaza': 2, 'rnk-fin': 2, 'rnk-2col': 6, 'rnk-oro': 1, 'rnk-vino': 1, 'rnk-perfil': 3, 'rnk-propio': 2, 'rnk-uuid': 1, 'rnk-escala': 1, 'rnk-nohay': 1 })) espera(k, n)

  for (const [w, h] of TAMANOS) {
    const clave = `${w}x${h}`
    const { banco } = bancoDe()
    let sesion
    try {
      sesion = await abrirRankings(browser, base, w, h, banco, errores)
    } catch (e) {
      errores.push(`${clave} no llegó a Rankings: ${String(e.message).split('\n')[0]}`)
      continue
    }
    const { ctx, page } = sesion
    try {
      const m = await page.evaluate(MEDIR)
      if (clave === '360x640' || clave === '1920x1080') anota('rnk-abre', m.ranking === 'maestros', clave, `ranking=${m.ranking}`)
      if (['360x640', '412x915', '1920x1080'].includes(clave)) {
        anota('rnk-fila', Math.abs(m.filaH - 56) <= TOL && Math.abs(m.av - 34.72) <= TOL && m.filas <= 100 && m.filas > 0,
          clave, `fila=${m.filaH?.toFixed(2)} av=${m.av?.toFixed(2)} filas=${m.filas}`)
      }
      if (clave in DOS_COL) anota('rnk-2col', m.dosColumnas === DOS_COL[clave], clave, `dosColumnas=${m.dosColumnas}`)
      if (clave === '412x915') {
        anota('rnk-fin', m.fin === true && m.filas === 100, `${clave} 100`, `filas=${m.filas} fin=${m.fin}`)
        const sinRelleno = m.medalla1 && rgba(m.medalla1.fondo)[3] === 0
        const soloMas = m.oros.length === 1 && String(m.oros[0]).includes('lob-mas')
        anota('rnk-oro', sinRelleno && soloMas, clave, `medalla1=${JSON.stringify(m.medalla1)} oros=${JSON.stringify(m.oros)}`)
      }
      if (clave in BANDA || clave === '360x640' || clave === '412x915') {
        // La banda, y que no se mueva al llevar la lista al final.
        const d = await page.evaluate(AL_FINAL)
        if (clave in BANDA) {
          anota('rnk-banda', m.banda !== null && Math.abs(m.banda - BANDA[clave]) <= TOL && d.bandaQuieta, clave, `banda=${m.banda?.toFixed(1)} quieta=${d.bandaQuieta}`)
        }
        if (clave === '360x640' || clave === '412x915') {
          anota('rnk-desplaza', d.listaAbajo && d.cuerpo === 0 && d.pagina === 0 && d.cabeceraPegada, clave, JSON.stringify(d))
        }
        await page.evaluate(() => { document.querySelector('.rnk-lista').scrollTop = 0 })
      }
      if (clave === '412x915' || clave === '915x412') {
        // rnk-perfil: la fila 3, y los tres cierres con el foco de vuelta.
        const fila3 = '.rnk-filas .rnk-fila[data-puesto="3"]'
        const nombre3 = await page.$eval(fila3, (el) => el.querySelector('.rnk-nom b').textContent)
        const t = await abrirTarjeta(page, fila3)
        const esp = PERFIL[clave]
        const medidaOk = Math.abs(t.w - esp.w) <= 2 && Math.abs(t.h - esp.h) <= 2
        await page.click('.mp-cerrar')
        const x = { cerrada: !(await page.$('.mp-velo')), foco: await focoEn(page) }
        await abrirTarjeta(page, fila3)
        await page.mouse.click(3, h - 3)
        const v = { cerrada: !(await page.$('.mp-velo')), foco: await focoEn(page) }
        await abrirTarjeta(page, fila3)
        await page.keyboard.press('Escape')
        const e = { cerrada: !(await page.$('.mp-velo')), foco: await focoEn(page) }
        const cierres = [x, v, e].every((c) => c.cerrada && c.foco === 'rnk-fila:3')
        anota('rnk-perfil', t.rol === 'dialog' && t.modal === 'true' && t.nombre === nombre3 && t.estado === 'listo' && t.foco === 'mp-cerrar' && medidaOk && cierres,
          clave, `${t.w.toFixed(1)}×${t.h.toFixed(1)} (lámina ${esp.w}×${esp.h}) nombre=${t.nombre}/${nombre3} foco=${t.foco} ✕=${JSON.stringify(x)} velo=${JSON.stringify(v)} esc=${JSON.stringify(e)}`)

        if (clave === '412x915') {
          // rnk-uuid y rnk-escala, con el ajeno abierto.
          await abrirTarjeta(page, fila3)
          const html = await page.evaluate(() => ({ pantalla: document.querySelector('main.sal').outerHTML, dialog: document.querySelector('.mp-tarjeta').outerHTML }))
          const fuera = await page.evaluate(TARJETA)
          anota('rnk-uuid', !UUID.test(html.pantalla) && !UUID.test(html.dialog) && !html.dialog.includes('@'), clave,
            `uuidPantalla=${UUID.test(html.pantalla)} uuidDialog=${UUID.test(html.dialog)} correoEnAjeno=${html.dialog.includes('@')}`)
          anota('rnk-escala', !m.escala && !fuera.enRoot && fuera.padreBody, clave, `data-escala=${m.escala} enRoot=${fuera.enRoot} body=${fuera.padreBody}`)
          await page.keyboard.press('Escape')

          // rnk-propio: la banda.
          const pr = await abrirTarjeta(page, '.rnk-tu .rnk-fila')
          anota('rnk-propio', Math.abs(pr.h - PROPIO_H) <= 2 && pr.solo && pr.editarApagado === true && pr.correo === CORREO && pr.nombre === YO && !UUID.test(pr.html),
            `${clave} banda`, `h=${pr.h.toFixed(1)} solo=${pr.solo} editar=${pr.editarApagado} correo=${pr.correo} nombre=${pr.nombre}`)
          await page.keyboard.press('Escape')

          // rnk-vino: Fortunas.
          await page.click('.rnk-pestanas .sal-chip:nth-child(2)')
          await page.waitForSelector('main.sal[data-ranking="fortunas"][data-rnk-estado="listo"]', { timeout: 10000 })
          await page.waitForTimeout(200)
          const vino = await page.evaluate(() => {
            const sonda = document.createElement('div')
            sonda.style.background = 'var(--fondo-vino)'
            document.body.appendChild(sonda)
            const token = getComputedStyle(sonda).backgroundImage
            sonda.remove()
            const css = getComputedStyle(document.documentElement)
            const num = document.querySelector('.lob-pildora .bd-num')
            return {
              fondo: getComputedStyle(document.querySelector('.sal-fondo')).backgroundImage,
              token,
              texto: getComputedStyle(num).color,
              pildora: getComputedStyle(document.querySelector('.lob-pildora')).backgroundColor,
              vinos: ['--vino', '--vino-deep', '--vino-abyss'].map((k) => css.getPropertyValue(k).trim()),
            }
          })
          const hex = (s) => [1, 3, 5].map((i) => parseInt(s.slice(i, i + 2), 16))
          const tx = rgba(vino.texto)
          const peor = Math.min(...vino.vinos.map((v) => contraste(sobre(tx, sobre(rgba(vino.pildora), hex(v))), sobre(rgba(vino.pildora), hex(v)))))
          anota('rnk-vino', vino.token !== 'none' && vino.fondo === vino.token && peor >= 4.5, clave, `fondo=token:${vino.fondo === vino.token} contrastePíldora=${peor.toFixed(2)}`)
        }
      }
    } catch (e) {
      errores.push(`${clave}: ${String(e.message).split('\n')[0]}`)
    }
    await ctx.close()
  }

  // rnk-fin con menos de 100 y rnk-propio con la banda vacía: 5 jugadores y la
  // cuenta del arnés SIN puntos (no está en Maestros: 5 filas, sin «fin»).
  // Y el ajeno sin puntos de rnk-perfil (Ajuste B): en el banco grande los diez
  // sin puntos tienen 2.500 o 0 y quedan fuera de los 100 de Fortunas (113.º a
  // 139.º), así que aquí se siembra uno —Rio_Caroni, 2.500— y se le toca en
  // Fortunas, donde sí sale.
  {
    const SIN_PUNTOS = 'Rio_Caroni'
    const todos = sembradosRanking()
    const pocos = [...todos.filter((j) => j.puntos).slice(0, 5), todos.find((j) => j.username === SIN_PUNTOS)]
    const { banco } = bancoDe({ sembrados: pocos, puntos: 0 })
    try {
      const { ctx, page } = await abrirRankings(browser, base, 412, 915, banco, errores)
      const m = await page.evaluate(MEDIR)
      anota('rnk-fin', m.fin === false && m.filas === 5, '412x915 pocos', `filas=${m.filas} fin=${m.fin}`)
      const pr = await abrirTarjeta(page, '[data-accion="rnk-tu-abre"]')
      anota('rnk-propio', pr.nombre === YO && pr.maestros === 'Gana tu primera mano para entrar' && Math.abs(pr.h - PROPIO_H) <= 2,
        '412x915 banda vacía', `h=${pr.h.toFixed(1)} maestros="${pr.maestros}"`)
      await page.keyboard.press('Escape')

      await page.click('.rnk-pestanas .sal-chip:nth-child(2)')
      await page.waitForSelector('main.sal[data-ranking="fortunas"][data-rnk-estado="listo"]', { timeout: 10000 })
      await page.waitForTimeout(200)
      const puesto = await page.$$eval('.rnk-filas .rnk-fila', (fs, n) => fs.find((f) => f.querySelector('.rnk-nom b')?.textContent === n)?.dataset.puesto ?? null, SIN_PUNTOS)
      if (puesto === null) throw new Error(`${SIN_PUNTOS} no sale en Fortunas`)
      const aj = await abrirTarjeta(page, `.rnk-filas .rnk-fila[data-puesto="${puesto}"]`)
      anota('rnk-perfil', aj.nombre === SIN_PUNTOS && aj.estado === 'listo' && aj.maestros === 'Aún no está en este ranking' && !aj.solo && !aj.html.includes('@'),
        '412x915 ajeno sin puntos', `${aj.w.toFixed(1)}×${aj.h.toFixed(1)} nombre=${aj.nombre} (Fortunas ${puesto}) maestros="${aj.maestros}" correo=${aj.solo}`)
      await page.keyboard.press('Escape')
      await ctx.close()
    } catch (e) {
      errores.push(`412x915 pocos: ${String(e.message).split('\n')[0]}`)
    }
  }

  // rnk-nohay: MaracuchaBrava_ (puesto 3) «se va» entre la lista y el toque.
  {
    const { banco, cuenta } = bancoDe({ perdido: 'MaracuchaBrava_' })
    try {
      const { ctx, page } = await abrirRankings(browser, base, 412, 915, banco, errores)
      const antes = cuenta.ranking_top ?? 0
      await page.click('.rnk-filas .rnk-fila[data-puesto="3"]')
      const toast = await page.waitForFunction(() => {
        const t = document.querySelector('.sal-toast.is-on')
        return t && t.textContent.trim() === 'Jugador no encontrado' ? t.textContent.trim() : null
      }, null, { timeout: 5000 }).then((x) => x.jsonValue(), () => null)
      await page.waitForSelector('main.sal[data-rnk-estado="listo"]', { timeout: 5000 })
      await page.waitForTimeout(200)
      const despues = cuenta.ranking_top ?? 0
      const sinTarjeta = !(await page.$('.mp-velo'))
      anota('rnk-nohay', toast === 'Jugador no encontrado' && despues === antes + 1 && sinTarjeta, '412x915',
        `toast=${toast} ranking_top ${antes}→${despues} tarjeta=${!sinTarjeta}`)
      await ctx.close()
    } catch (e) {
      errores.push(`412x915 nohay: ${String(e.message).split('\n')[0]}`)
    }
  }

  // Una puerta con menos medidas de las esperadas no es verde (un verde mide lo que dice).
  for (const x of Object.values(puertas)) {
    x.ok = x.fallos.length === 0 && x.medidas.length === x.esperadas
  }
  puertas.consola = { errores, ok: errores.length === 0 }
  const verde = Object.values(puertas).every((x) => x.ok === true)
  const resumen = `${verde ? 'VERDE' : 'ROJO'} · ` + Object.entries(puertas).map(([k, x]) => `${k} ${x.ok ? '✓' : '✗'}${x.medidas ? ` (${x.medidas.length}/${x.esperadas})` : ''}`).join(' · ')
  console.log(`── RNK · ${resumen}`)
  for (const [k, x] of Object.entries(puertas)) {
    for (const f of x.fallos ?? []) console.log(`   ${k} ✗ ${f}`)
    for (const mm of x.medidas ?? []) console.log(`   ${k} · ${mm}`)
  }
  for (const e of errores.slice(0, 8)) console.log(`   consola · ${e}`)
  return { verde, puertas, resumen }
}
