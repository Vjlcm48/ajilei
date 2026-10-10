// ── capMesa.mjs · CAP-1 · la mesa fotografiada para la Portada y la og-image ─
// Rector: AJILEI_CAP-1_Fase1_v1.0.md §1a.1 · Fase 0: docs/reportes/
// AJILEI_CAP-1_Fase0_Informe_v1.0.md (B2, B3, B5).
//
// Las tres capturas de la mesa que se enseñan FUERA del juego (el teléfono y la
// laptop de la escena 5 de la Portada, y la tarjeta social) dejan de tomarse a
// mano: las toma el arnés, a tamaño exacto, sin barras del sistema y
// REPRODUCIBLES. Este módulo sabe llegar al momento y leerlo; el veredicto y
// las escrituras viven en el modo `cap` de `diagPUE.mjs`.
//
// ── POR QUÉ UNA SESIÓN SIMULADA (decisión 1 del rector) ─────────────────────
// Se fotografía el bundle de PRODUCCIÓN (`vite preview`, 4173), y ahí
// `AUTH_BYPASS` es `DEV && VITE_AUTH_BYPASS` = false: sin sesión la cascada de
// `App.jsx` se queda en la Portada y la mesa no existe. Así que se le da una
// sesión FALSA en `localStorage` y se INTERCEPTA toda la red al host de
// Supabase con `page.route`: ni una petición sale al proyecto real. Los datos
// falsos viven SÓLO aquí, en `scripts/` — nunca en `src/`.
//
// ── POR QUÉ ES DETERMINISTA (Fase 0 §B2) ─────────────────────────────────────
// La mano y las decisiones de las IAS beben sólo de `Math.random` (60 tiradas
// hasta la foto): sembrarlo basta, `crypto` no interviene. Lo único que se
// mueve con el reloj real en el instante de la foto es `turnBreath`, la
// respiración dorada de `.player-zone.turn-active` (2,4 s, infinita): su fase
// se FIJA con Web Animations. No se usa `prefers-reduced-motion`, que cambia el
// aspecto; fijar la fase sólo elige el instante. Y el cronómetro se COMPRUEBA
// («20s») en vez de congelarse.
import { readFileSync, existsSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { recorrerRuta } from '../rutaMesa.mjs'
import { respuestaRpc, crearBanco, SALDO_ARNES } from '../arnes/nucleo.mjs'

// ── Constantes selladas ─────────────────────────────────────────────────────

// Semilla 5, elegida por Victor en la hoja de la Fase 0: cuatro palos, dos
// reyes y el As de copas en la mano del jugador. La misma semilla da la MISMA
// mano en las tres vistas (el reparto no depende del viewport).
export const SEMILLA_CAP = 5

// La mano que la semilla 5 reparte, en el orden en que llega. Es la puerta
// `cap.mano`: si cambia, cambió el consumo de azar del motor y la maestra
// sellada ya no es reproducible — hay que volver a elegir semilla, no a mano.
export const MANO_CAP = ['3 de Espadas', 'Rey de Espadas', 'As de Copas', 'Rey de Bastos', '5 de Oros']

// Las tres vistas (decisión 2 y Fase 0 §B3):
//  · v  360×704 @3 → 1080×2112. Es el viewport REAL del S25 en standalone:
//       (2340 − 100 de barra de estado − 130 de navegación) / 3 ≈ 703. La mesa
//       se ve como la ve el jugador, y el teléfono de la escena 5 la enseña casi
//       entera (a 360×780, el 83 %).
//  · h  686×360 @3 → 2058×1080. Sólo alimenta la og-image (DIS-1 usa v y pc).
//       Es la variante C que eligió Victor (Addendum 1, D-3): a 686 de ancho la
//       caja dorada de la mesa mide 1,931, casi el 1,905 de la tarjeta social,
//       así que la og-image la CUBRE perdiendo 4,6 px CSS por lado en vez de
//       llevar bandas (a 780 la caja medía 2,20). Cruza el escalón
//       `max-width: 772px` de gameTable.css —el mazo de las IAS pasa de 27×42 a
//       21×32 (MZ-2b)—; el orden de las piezas no cambia y esa disposición
//       quedó ACEPTADA por Victor. La puerta `cap.ogRecorte` vigila el recorte.
//  · pc 1366×768 @2 → 2732×1536. La resolución de portátil más común, 16:9 como
//       el hueco de la laptop, la mesa llena el 79 % del ancho, sobra para
//       DIS-1 y en la Fase 0 salió idéntica al byte (a 1920×1080 @1 no: ruido
//       de raster de ±2–4 niveles en los degradados).
// OJO (1a): las TRES vistas tienen dos estados de raster recurrentes que sólo
// difieren en los degradados radiales (97 % de los píxeles distintos a Δ1) —
// ver el informe de la Fase 1. Por eso `cap.estable` se juzga por TOLERANCIA
// (Addendum 1, D-1) y no por huella: ver TOLERANCIA_CAP más abajo.
export const VISTAS_CAP = {
  v:  { w: 360,  h: 704, dpr: 3, movil: true,  maestra: 'mesav.png' },
  h:  { w: 686,  h: 360, dpr: 3, movil: true,  maestra: 'mesah.png' },
  pc: { w: 1366, h: 768, dpr: 2, movil: false, maestra: 'mesapc.png' },
}

// La receta (Fase 0 §A4): el mismo momento que las capturas a mano de antes.
export const RECETA_CAP = { jugadores: 5, nivel: 'pro', stakeIdx: 0, entrada: 'medio' }
export const POZO_CAP = 2000
export const SALDO_CAP = '3600'          // entrada «medio» 20 × 200 = 4000 − 200 de la mesa − 200 de la apuesta ×1
export const MESA_CAP = 'Mesa 200'
export const CRONO_CAP = '20s'

// Fase de `turnBreath` en la foto, en ms dentro de su ciclo de 2400.
export const FASE_RESPIRACION_MS = 1200

// El perfil falso. No se pinta en la mesa (el asiento dice «Tú»), pero la
// cascada de sesión lo exige para llegar a COMPLETO.
export const PERFIL_CAP = { id: '0ca90000-0000-4000-8000-00000000ca91', username: 'Jugador_CAP' }

// ── El host de Supabase, leído del mismo sitio que el build ─────────────────
// La clave de almacenamiento del SDK es `sb-<ref>-auth-token`, y <ref> es el
// subdominio de VITE_SUPABASE_URL. Se lee de `.env.local` (lo que compiló el
// build) para no clavar el proyecto en el repo.
export function hostSupabase() {
  const url = process.env.VITE_SUPABASE_URL ||
    (existsSync('.env.local') ? (readFileSync('.env.local', 'utf8').match(/^VITE_SUPABASE_URL=(.+)$/m) || [])[1] : null)
  if (!url) throw new Error('cap: no encuentro VITE_SUPABASE_URL (.env.local) — sin él no sé qué host interceptar')
  const u = new URL(url.trim())
  return { host: u.host, ref: u.host.split('.')[0] }
}

export const sha256 = (buf) => createHash('sha256').update(buf).digest('hex')

// Corre en la página ANTES que la app: siembra el azar y deja la sesión.
const INICIO = ({ semilla, clave, sesion }) => {
  let a = semilla
  window.__capTiradas = 0
  Math.random = () => {
    window.__capTiradas++
    a |= 0; a = a + 0x6D2B79F5 | 0
    let t = Math.imul(a ^ a >>> 15, 1 | a)
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t
    return ((t ^ t >>> 14) >>> 0) / 4294967296
  }
  try { localStorage.setItem(clave, JSON.stringify(sesion)) } catch { /* sin almacén no hay sesión: la puerta cap.escena lo cantará */ }
}

/**
 * Un contexto nuevo con la vista, la siembra, la sesión falsa y la red vigilada.
 * `red.fuera` = peticiones que NO son del origen local ni del host de Supabase
 * (la puerta cap.red las quiere en cero). `red.supabase` = las interceptadas.
 *
 * ECO-1b · `billetera` (opcional) es un objeto VIVO que la ruta lee en cada
 * petición, así que el modo que lo pasa puede cambiarlo a mitad de recorrido:
 *   saldo       lo que contesta `mi_billetera` (sin él, `SALDO_ARNES` = 5.000)
 *   retrasoMs   cuánto tarda en contestar `mi_billetera`
 *   falla       `mi_billetera` contesta 503 (la red o la base caídas)
 *   errores     { nombreRpc: 'clave' } → esa RPC contesta el `raise` P0001
 *   lecturas    lo cuenta la ruta: cuántas veces se pidió `mi_billetera`
 * Sin `billetera`, la ruta contesta lo de siempre más la billetera de 5.000.
 *
 * ECO-1c · el servidor es un BANCO IMITADO por contexto (`billetera.banco`,
 * que la ruta crea si no viene): el contrato de la 1c en JS, el mismo del
 * bypass y de las pruebas. `mi_billetera` contesta su saldo, y las seis
 * funciones de mesa, lo que diga él. Cambiar `billetera.saldo` a mitad de
 * recorrido es un `ajuste_admin` en el banco (el servidor «sabe otra cosa»).
 * Y dos mandos más:
 *   cortes      { nombreRpc: { veces, modo } } → las próximas `veces` llamadas
 *               a esa RPC no contestan: 'antes' = no llegan al banco (503);
 *               'despues' = el banco las aplica y la respuesta se pierde (503)
 *   retrasos    { nombreRpc: ms } → esa RPC tarda en contestar
 *   llamadas    lo anota la ruta: [{ nombre, params, codigo, t }] de las RPC de mesa
 *
 * ECO-1e (E6) · `perfil` (opcional) es el perfil que contesta `/rest/v1/profiles`:
 * un objeto VIVO `{ id, username }` que la ruta lee en cada petición, así que
 * el modo que lo pasa puede cambiar el nombre y recargar la página. Sin él,
 * `PERFIL_CAP`, como siempre. Es la forma de medir el lobby con el peor nombre
 * que admite la regla (`^[A-Za-z0-9_]{6,15}$`) sin un mando de URL en la app.
 */
export async function contextoCap(browser, vista, base, { semilla = SEMILLA_CAP, billetera = null, perfil = PERFIL_CAP } = {}) {
  // `vista` es una clave de VISTAS_CAP o, para sondas fuera de lo sellado
  // (la variante C de la og-image), un objeto con la misma forma.
  // ARN-3c · D7 · `semilla`: `msg` juega en 4173 por aquí y no puede jugar
  // siempre la misma mano (Fase 0 de ARN-3, B3). Por defecto, la sellada de CAP.
  const v = typeof vista === 'string' ? VISTAS_CAP[vista] : vista
  const { host, ref } = hostSupabase()
  const ctx = await browser.newContext({
    viewport: { width: v.w, height: v.h },
    deviceScaleFactor: v.dpr,
    ...(v.movil ? { isMobile: true, hasTouch: true } : {}),
  })
  const ahora = Math.floor(Date.now() / 1000)
  const user = {
    id: PERFIL_CAP.id, aud: 'authenticated', role: 'authenticated', email: 'cap@example.invalid',
    app_metadata: {}, user_metadata: {}, created_at: '2026-01-01T00:00:00Z',
  }
  const dura = 30 * 86400    // lejos: el SDK no intenta refrescar
  const sesion = {
    access_token: 'cap.' + Buffer.from(JSON.stringify({ sub: user.id, exp: ahora + dura })).toString('base64url') + '.cap',
    token_type: 'bearer', expires_in: dura, expires_at: ahora + dura, refresh_token: 'cap-refresh', user,
  }
  await ctx.addInitScript(INICIO, { semilla, clave: `sb-${ref}-auth-token`, sesion })

  // ARN-3c · D6 · el terreno común (`aislarNavegador`) ya desvía los sockets no
  // locales al nacer el contexto, y un socket desviado NO dispara
  // `page.on('websocket')`: sin esto, `cap.red` dejaría de verlos. Se leen de
  // su registro (`ctx.__aislamiento`), además de los que sí disparen el evento.
  const red = { supabase: [], fuera: [], sockets: ctx.__aislamiento ? ctx.__aislamiento.sockets : [] }
  // ECO-1c · el servidor imitado de ESTE contexto, con el saldo que se pida.
  const banco = billetera?.banco ?? crearBanco({ saldo: billetera?.saldo ?? SALDO_ARNES })
  if (billetera) { billetera.banco = banco; billetera.__saldoVisto = billetera.saldo }
  const origen = new URL(base).host
  // UNA ruta para todo: lo local pasa, Supabase se contesta aquí, lo demás se
  // corta y se anota (es la puerta cap.red, no un error silencioso).
  await ctx.route('**/*', async (route) => {
    const r = route.request()
    const u = new URL(r.url())
    if (u.protocol === 'data:' || u.protocol === 'blob:' || u.host === origen) return route.continue()
    if (u.host === host) {
      red.supabase.push(`${r.method()} ${u.pathname}`)
      const json = (b) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(b) })
      if (u.pathname.startsWith('/rest/v1/profiles')) {
        return json((r.headers()['accept'] || '').includes('vnd.pgrst.object') ? perfil : [perfil])
      }
      if (u.pathname.startsWith('/rest/v1/rpc/')) {
        // mi_sala y compañía: «no hay»; mi_billetera: el saldo (ECO-1b); las
        // mesas contra las IAS: el banco imitado (ECO-1c).
        const nombre = u.pathname.slice('/rest/v1/rpc/'.length)
        let params = null
        try { params = r.postDataJSON() } catch { params = null }
        if (billetera) {
          if (billetera.saldo !== undefined && billetera.saldo !== billetera.__saldoVisto) {
            if (billetera.__saldoVisto !== undefined) banco.ajusteAdmin(billetera.saldo - banco.saldo)
            billetera.__saldoVisto = billetera.saldo
          }
          const retraso = billetera.retrasos?.[nombre]
          if (retraso) await new Promise((ok) => setTimeout(ok, retraso))
          const corte = billetera.cortes?.[nombre]
          if (corte && corte.veces > 0) {
            corte.veces -= 1
            if (corte.modo === 'despues') respuestaRpc(u.pathname, { banco, params })
            ;(billetera.llamadas ??= []).push({ nombre, params, codigo: `corte-${corte.modo}`, t: Date.now() })
            return route.fulfill({ status: 503, contentType: 'application/json',
              body: JSON.stringify({ code: 'PGRST000', message: 'arnés: corte', details: null, hint: null }) })
          }
          if (nombre === 'mi_billetera') {
            billetera.lecturas = (billetera.lecturas ?? 0) + 1
            if (billetera.retrasoMs) await new Promise((ok) => setTimeout(ok, billetera.retrasoMs))
            if (billetera.falla) {
              return route.fulfill({ status: 503, contentType: 'application/json',
                body: JSON.stringify({ code: 'PGRST000', message: 'arnés: billetera caída', details: null, hint: null }) })
            }
          }
          const clave = billetera.errores?.[nombre]
          if (clave) {
            return route.fulfill({ status: 400, contentType: 'application/json',
              body: JSON.stringify({ code: 'P0001', message: clave, details: null, hint: null }) })
          }
        }
        const respuesta = respuestaRpc(u.pathname, { banco, params })
        if (billetera && respuesta && typeof respuesta === 'object' && 'codigo' in respuesta) {
          ;(billetera.llamadas ??= []).push({ nombre, params, codigo: respuesta.codigo, t: Date.now() })
        }
        return json(respuesta)
      }
      if (u.pathname.startsWith('/auth/v1/user')) return json(user)
      if (u.pathname.startsWith('/auth/v1/token')) return json(sesion)
      return json([])
    }
    red.fuera.push(`${r.method()} ${r.url()}`)
    return route.abort()
  })
  const page = await ctx.newPage()
  page.on('websocket', (ws) => red.sockets.push(ws.url()))
  const errores = []
  page.on('pageerror', (e) => errores.push(`pageerror: ${e.message}`))
  page.on('console', (m) => { if (m.type() === 'error') errores.push(`console: ${m.text()}`) })
  return { ctx, page, red, errores }
}

// Espera REAL a que no quede animación finita viva ni vuelo de carta.
export async function mesaQuieta(page, limite = 8000) {
  const t0 = Date.now()
  let seguidas = 0
  while (Date.now() - t0 < limite) {
    const vivas = await page.evaluate(() =>
      document.getAnimations().filter((a) => a.playState === 'running' &&
        a.effect?.getComputedTiming().iterations !== Infinity).length +
      document.querySelectorAll('.flying-card').length)
    seguidas = vivas === 0 ? seguidas + 1 : 0
    if (seguidas >= 3) return Date.now() - t0
    await page.waitForTimeout(60)
  }
  return null
}

// Lo visible de la mesa, leído del DOM (innerText respeta lo oculto).
export const leerMesaCap = (page) => page.evaluate(() => {
  const vis = (e) => !!e && e.getClientRects().length > 0 && getComputedStyle(e).visibility !== 'hidden'
  const t = (e) => (e?.innerText || '').replace(/\s+/g, ' ').trim()
  const hum = document.querySelector('.player-zone')
  const mano = hum ? [...hum.querySelectorAll('img')].map((i) => i.alt).filter((a) => / de /.test(a)) : []
  const rivales = [...document.querySelectorAll('.opp-panel, .ai-zone')].filter(vis).map((p) => t(p))
  const pozo = [...document.querySelectorAll('.pot-box')].filter(vis)
    .find((b) => /pozo/i.test(t(b.querySelector('.pot-label'))))
  const cronos = [...document.querySelectorAll('.timer-display')].filter(vis).map(t)
  return {
    mensaje: t(document.querySelector('.game-message')),
    mano, rivales,
    pozo: pozo ? Number((t(pozo).match(/\d[\d.\s]*/) || [''])[0].replace(/\D/g, '')) : null,
    cronos,
    texto: t(document.querySelector('.game-table')),
    turno: [...document.querySelectorAll('[data-accion="apostar"], [data-accion="pasar"], [data-accion="igualar"]')].some((b) => !b.disabled),
    tiradas: window.__capTiradas ?? null,
  }
})

/**
 * Una pasada de la receta en un contexto NUEVO. Devuelve la lectura, el PNG y
 * la red; NO juzga (las puertas son del modo). `intentos` repite desde cero si
 * en el instante de la foto el cronómetro no dice «20s».
 */
export async function pasadaCap(browser, vista, base, intentos = 3, { alFinal = null } = {}) {
  const notas = []
  for (let n = 1; n <= intentos; n++) {
    const { ctx, page, red, errores } = await contextoCap(browser, vista, base)
    try {
      await page.goto(base, { waitUntil: 'networkidle' })
      await recorrerRuta(page, RECETA_CAP.jugadores, RECETA_CAP.nivel, RECETA_CAP.stakeIdx, RECETA_CAP.entrada)
      await page.mouse.move(5, 5)
      await page.locator('button:has-text("Iniciar mano")').first().click()

      // «A las 2»: Apostar ×1. Luego se espera el turno de «A las 3».
      let etapa = 0, m = null
      const t0 = Date.now()
      while (Date.now() - t0 < 60000) {
        await page.waitForTimeout(120)
        m = await leerMesaCap(page)
        if (!m.turno) continue
        if (etapa === 0 && /A las 2/.test(m.mensaje)) {
          await page.click('[data-accion="apostar"]'); await page.mouse.move(5, 5); etapa = 1; continue
        }
        if (etapa === 1 && /A las 3/.test(m.mensaje)) { etapa = 2; break }
        break      // otro turno cualquiera: la escena no salió (la puerta lo dirá)
      }
      const quieta = etapa === 2 ? await mesaQuieta(page) : null
      await page.mouse.move(5, 5)
      // Fase de la respiración fijada, y dos fotogramas para que se pinte.
      const fijadas = await page.evaluate(async (f) => {
        const inf = document.getAnimations().filter((a) => a.effect?.getComputedTiming().iterations === Infinity)
        inf.forEach((a) => { a.pause(); a.currentTime = f })
        await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))
        return inf.map((a) => a.animationName || '?')
      }, FASE_RESPIRACION_MS)
      m = await leerMesaCap(page)
      if (etapa === 2 && !m.cronos.every((c) => c === CRONO_CAP) && n < intentos) {
        notas.push(`intento ${n}: cronómetro ${m.cronos.join('/')} ≠ ${CRONO_CAP}, se repite desde cero`)
        continue
      }
      const png = await page.screenshot()
      // Gancho opcional para medir la página en el instante de la foto (la
      // hoja de la og-image lo usa para saber qué cae fuera de un recorte).
      const extra = alFinal ? await alFinal(page) : null
      return { vista, intento: n, notas, etapa, quieta, fijadas, lectura: m, png, sha: sha256(png), red, errores, extra }
    } finally {
      await ctx.close()
    }
  }
  throw new Error('cap: inalcanzable')
}

// ── Addendum 1 · D-1 · la vara de `cap.estable` ─────────────────────────────
// Dos pasadas son EQUIVALENTES si tienen las mismas dimensiones, al menos el
// 99,9 % de los píxeles con Δ ≤ 2 por canal y ningún canal con Δ > 40. No se
// compara huella: el rasterizado de los degradados tiene más de un estado (1a)
// y una vara al byte o por mayoría se pondría roja con la próxima versión de
// Edge sin que la mesa cambie.
export const TOLERANCIA_CAP = { deltaFino: 2, fraccionFina: 0.999, deltaMax: 40 }

/** Compara dos PNG en el navegador (sin dependencias). */
export async function compararPng(page, a, b) {
  return page.evaluate(async ([x, y, fino]) => {
    const carga = async (s) => {
      const i = new Image(); i.src = 'data:image/png;base64,' + s; await i.decode()
      const c = document.createElement('canvas'); c.width = i.naturalWidth; c.height = i.naturalHeight
      const g = c.getContext('2d', { willReadFrequently: true }); g.drawImage(i, 0, 0)
      return g.getImageData(0, 0, c.width, c.height)
    }
    const A = await carga(x), B = await carga(y)
    if (A.width !== B.width || A.height !== B.height) return { mismasDim: false, dimA: [A.width, A.height], dimB: [B.width, B.height] }
    let distintos = 0, finos = 0, max = 0
    const n = A.width * A.height
    for (let i = 0; i < A.data.length; i += 4) {
      const d = Math.max(Math.abs(A.data[i] - B.data[i]), Math.abs(A.data[i + 1] - B.data[i + 1]),
        Math.abs(A.data[i + 2] - B.data[i + 2]), Math.abs(A.data[i + 3] - B.data[i + 3]))
      if (d) distintos++
      if (d <= fino) finos++
      if (d > max) max = d
    }
    return { mismasDim: true, dim: [A.width, A.height], pixeles: n, distintos, fraccionFina: finos / n, deltaMax: max }
  }, [a.toString('base64'), b.toString('base64'), TOLERANCIA_CAP.deltaFino])
}

export const equivalentes = (c) => c.mismasDim && c.fraccionFina >= TOLERANCIA_CAP.fraccionFina && c.deltaMax <= TOLERANCIA_CAP.deltaMax

// ── La caja dorada, con el MISMO código del generador ───────────────────────
// `cap.ogRecorte` necesita saber qué recorta la og-image, y eso lo decide el
// cuerpo de canvas de `gen-portada-assets.mjs` (caja por filete dorado +
// encaje). En vez de copiarlo —dos copias acaban divergiendo— se EXTRAE del
// fichero entre sus dos marcas y se ejecuta en una página. Si alguien cambia
// esas marcas, esto falla ruidoso, no en falso.
export function cuerpoGenerador(ruta = 'scripts/gen-portada-assets.mjs') {
  const src = readFileSync(ruta, 'utf8')
  const ini = 'const salida = await pagina.evaluate('
  const i0 = src.indexOf(ini), i1 = src.indexOf('}, { uri: comoDataURI(rutaOrigen)')
  if (i0 < 0 || i1 < 0) throw new Error('cap: no encuentro el cuerpo de canvas en gen-portada-assets.mjs (¿cambiaron sus marcas?)')
  const oro = Number((src.match(/const ORO_MINIMO = ([\d.]+)/) || [])[1])
  const banda = (src.match(/const BANDA_OG = '(#[0-9a-fA-F]+)'/) || [])[1]
  return { cuerpo: src.slice(i0 + ini.length, i1) + '}', oro, banda }
}

/** Deriva `png` (Buffer) con el trabajo dado, por el cuerpo del generador. */
export async function derivarComoGenerador(page, png, trabajo) {
  const { cuerpo, oro, banda } = cuerpoGenerador()
  const uri = 'data:image/png;base64,' + png.toString('base64')
  const s = await page.evaluate(`(${cuerpo})(${JSON.stringify({ uri, trabajo, verdeMin: oro, banda })})`)
  return { ...s, dataURL: undefined, bytes: s.bytes }
}
