// ── BIE-1 · La puerta con la red de Supabase simulada ───────────────────────
// Rector: AJILEI_BIE-1_Fase1_v1.0.md §2 (1a-ii). Lo consume el modo `bie` de
// `scripts/diagPUE.mjs`.
//
// QUÉ RESUELVE. El paso del código —correo, código de seis dígitos, lobby— no
// se puede recorrer en `vite preview` con una cuenta real: el código llega por
// correo. Pero el SDK de Supabase no sabe si la red es de verdad. Aquí se le
// contesta todo lo que pide al host del proyecto:
//   · `POST /auth/v1/otp`     → `{}` (el «te enviamos un código»);
//   · `POST /auth/v1/verify`  → una sesión entera, con el MISMO molde que
//     `contextoCap` (CAP-1) mete en el almacén; el SDK la guarda y emite
//     `SIGNED_IN` como con una de verdad;
//   · `/rest/v1/profiles`     → el perfil de CAP-1, con un RETARDO
//     parametrizable: es la espera que deja la pantalla vacía (Fase 0 §B1);
//   · `/rest/v1/rpc/*`        → `null` (no hay sala);
//   · `/auth/v1/user`         → el usuario.
// Lo que no es del origen local ni de Supabase se corta y se anota: la puerta
// no tiene que hablar con nadie más.
//
// QUÉ MIDE. Dos instrumentos que corren ANTES que la app (`INSTRUMENTO_BIE`):
//   · cada `AudioBufferSourceNode.start` con la duración de su búfer. Howler
//     reproduce por Web Audio, así que cada `play()` es un `start`; la duración
//     dice QUÉ sonó (`clasificaAudio`). El búfer de 1 muestra es el desbloqueo
//     de Howler (`autoUnlock`), que reproduce en el primer gesto;
//   · los hijos de `#root`, cada vez que cambian (MutationObserver): cuándo se
//     desmonta la Portada y cuándo llega la pantalla siguiente.
// Las dos series llevan la hora de la página (`performance.now`), y el arnés
// mete sus propias marcas (`window.__bieMarca`) para repartirlas por gesto.
import { hostSupabase, PERFIL_CAP } from '../cap/capMesa.mjs'
import { respuestaRpc, crearBanco, SALDO_ARNES } from '../arnes/nucleo.mjs'

// Duraciones decodificadas en Edge (Fase 0 §A1): rasgueo 3,657 s, clic 0,528 s.
// El desbloqueo de Howler es un búfer de 1 muestra a 22 050 Hz (≈ 0,000045 s).
export const DURACION_RASGUEO = 3.657
export const DURACION_CLIC = 0.528
const TOLERANCIA_S = 0.01

/** Qué sonido es un búfer, por su duración. */
export function clasificaAudio(duracion) {
  if (duracion >= 0 && duracion < 0.001) return 'desbloqueo'
  if (Math.abs(duracion - DURACION_RASGUEO) <= TOLERANCIA_S) return 'rasgueo'
  if (Math.abs(duracion - DURACION_CLIC) <= TOLERANCIA_S) return 'clic'
  return 'otro'
}

// Corre en la página ANTES que la app.
export const INSTRUMENTO_BIE = () => {
  window.__bie = []
  const ahora = () => Math.round(performance.now())
  window.__bieMarca = (m) => window.__bie.push({ t: ahora(), marca: m })
  const start0 = AudioBufferSourceNode.prototype.start
  AudioBufferSourceNode.prototype.start = function (...a) {
    window.__bie.push({ t: ahora(), audio: this.buffer ? this.buffer.duration : -1 })
    return start0.apply(this, a)
  }
  const vigila = () => {
    const root = document.getElementById('root')
    if (!root) return
    // Si lo que llegó es el «Cargando», su caja se lee AQUÍ, en el commit y
    // antes de pintar —con el isotipo casi siempre aún sin cargar—: es la caja
    // contra la que se compara la de después (no debe moverse al aparecer).
    const cajaDe = (e) => { const r = e.getBoundingClientRect(); return [r.x, r.y, r.width, r.height].map((n) => +n.toFixed(2)).join(',') }
    const foto = () => {
      const h = root.firstElementChild
      const e = { t: ahora(), root: root.childElementCount, que: h ? String(h.className || h.tagName).slice(0, 40) : '' }
      const st = h && h.classList.contains('cargando') ? h.querySelector('[role="status"]') : null
      if (st) {
        const iso = h.querySelector('.cargando-iso')
        e.caja = cajaDe(st)
        e.isoCargado = !!iso && iso.complete && iso.naturalWidth > 0
      }
      window.__bie.push(e)
    }
    foto()
    new MutationObserver(foto).observe(root, { childList: true })
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', vigila)
  else vigila()
}

function sesionFalsa() {
  const ahora = Math.floor(Date.now() / 1000)
  const dura = 30 * 86400
  const user = {
    id: PERFIL_CAP.id, aud: 'authenticated', role: 'authenticated', email: 'bie@example.invalid',
    app_metadata: {}, user_metadata: {}, created_at: '2026-01-01T00:00:00Z',
  }
  const sesion = {
    access_token: 'bie.' + Buffer.from(JSON.stringify({ sub: user.id, exp: ahora + dura })).toString('base64url') + '.bie',
    token_type: 'bearer', expires_in: dura, expires_at: ahora + dura, refresh_token: 'bie-refresh', user,
  }
  return { user, sesion }
}

const espera = (ms) => new Promise((r) => setTimeout(r, ms))

// Corre en la página ANTES que la app: deja la sesión en el almacén del SDK,
// como `contextoCap` (CAP-1). Es el arranque de quien vuelve con sesión abierta.
const SIEMBRA_SESION = ({ clave, sesion }) => {
  try { localStorage.setItem(clave, JSON.stringify(sesion)) } catch { /* sin almacén no hay sesión: bie.c5 lo cantará */ }
}

/**
 * Un contexto con la red de Supabase simulada y los instrumentos puestos.
 * `vista` = { w, h, dpr, movil }. Por defecto ANÓNIMO (sin sesión guardada);
 * `conSesion` siembra la sesión con el molde de CAP-1 (bie.c5) y `reducido`
 * emula `prefers-reduced-motion: reduce` (bie.c7).
 * `red.supabase` = lo que se contestó; `red.fuera` = lo que se cortó.
 */
export async function contextoBie(browser, vista, base, { perfilMs = 0, verifyMs = 0, conSesion = false, reducido = false } = {}) {
  const { host, ref } = hostSupabase()
  const { user, sesion } = sesionFalsa()
  const ctx = await browser.newContext({
    viewport: { width: vista.w, height: vista.h },
    deviceScaleFactor: vista.dpr ?? 1,
    ...(vista.movil ? { isMobile: true, hasTouch: true } : {}),
    ...(reducido ? { reducedMotion: 'reduce' } : {}),
  })
  await ctx.addInitScript(INSTRUMENTO_BIE)
  if (conSesion) await ctx.addInitScript(SIEMBRA_SESION, { clave: `sb-${ref}-auth-token`, sesion })
  const red = { supabase: [], fuera: [] }
  const origen = new URL(base).host
  // ECO-1c · el servidor imitado de las mesas, uno por contexto.
  const banco = crearBanco({ saldo: SALDO_ARNES })
  await ctx.route('**/*', async (route) => {
    const r = route.request()
    const u = new URL(r.url())
    if (u.protocol === 'data:' || u.protocol === 'blob:' || u.host === origen) return route.continue()
    if (u.host !== host) { red.fuera.push(`${r.method()} ${r.url()}`); return route.abort() }
    red.supabase.push(`${r.method()} ${u.pathname}`)
    const json = async (b, ms = 0) => {
      if (ms) await espera(ms)
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(b) })
    }
    if (u.pathname.startsWith('/auth/v1/otp')) return json({})
    if (u.pathname.startsWith('/auth/v1/verify')) return json(sesion, verifyMs)
    if (u.pathname.startsWith('/auth/v1/user')) return json(user)
    if (u.pathname.startsWith('/rest/v1/profiles')) {
      return json((r.headers()['accept'] || '').includes('vnd.pgrst.object') ? PERFIL_CAP : [PERFIL_CAP], perfilMs)
    }
    // ECO-1b · mi_billetera contesta el saldo del arnés (5.000); el resto, null.
    if (u.pathname.startsWith('/rest/v1/rpc/')) {
      let params = null
      try { params = r.postDataJSON() } catch { params = null }
      return json(respuestaRpc(u.pathname, { banco, params }))
    }
    return json([])
  })
  const page = await ctx.newPage()
  const errores = []
  page.on('pageerror', (e) => errores.push(`pageerror: ${e.message}`))
  page.on('console', (m) => { if (m.type() === 'error') errores.push(`console: ${m.text()}`) })
  return { ctx, page, red, errores }
}

/** Marca un gesto en la serie de la página. */
export const marca = (page, nombre) => page.evaluate((m) => window.__bieMarca(m), nombre)

/**
 * Reparte la serie por gestos: cada marca abre una ventana que dura hasta la
 * siguiente. Devuelve [{ gesto, audio: { rasgueo, clic, desbloqueo, otro } }].
 */
export function porGesto(serie) {
  const ventanas = []
  let actual = null
  for (const e of serie) {
    if (e.marca) {
      actual = { gesto: e.marca, t: e.t, audio: { rasgueo: 0, clic: 0, desbloqueo: 0, otro: 0 } }
      ventanas.push(actual)
    } else if (e.audio !== undefined && actual) {
      actual.audio[clasificaAudio(e.audio)]++
    }
  }
  return ventanas
}

/**
 * Un punto INERTE de la pantalla para «tocar un hueco»: ni botón, ni enlace, ni
 * campo, ni etiqueta, ni nada con `onclick`. Se busca en una rejilla y se
 * devuelve con lo que hay debajo, para que el informe diga dónde se tocó.
 */
export const HUECO = `(() => {
  const W = innerWidth, H = innerHeight;
  const pasos = [0.5, 0.35, 0.65, 0.2, 0.8];
  for (const fy of pasos) for (const fx of [0.04, 0.5, 0.96, 0.25, 0.75]) {
    const x = Math.round(W * fx), y = Math.round(H * fy);
    const e = document.elementFromPoint(x, y);
    if (!e) continue;
    if (e.closest('button, a, input, label, select, textarea, [role="button"], [onclick], .pue-velo, form')) continue;
    return { x, y, debajo: (e.className && String(e.className)) || e.tagName };
  }
  return null;
})()`

/**
 * La vida del indicador en la serie de `#root`, a partir de `desde` (ms de la
 * página): cuándo se vació la raíz (`vacio`), cuándo llegó «Cargando»
 * (`cargando`), cuándo el lobby (`lobby`) y qué hubo justo después del
 * indicador (`tras`). Las horas son las del MutationObserver, o sea las del
 * commit de React, no las de la pintura.
 */
export function vidaIndicador(serie, desde = 0) {
  const raiz = serie.filter((e) => e.root !== undefined && e.t >= desde)
  const vacio = raiz.find((e) => e.root === 0)
  const iCarga = raiz.findIndex((e) => /(^|\s)cargando(\s|$)/.test(e.que))
  const lobby = raiz.find((e) => /(^|\s)lobby(\s|$)/.test(e.que))
  const cargando = iCarga >= 0 ? raiz[iCarga] : null
  return {
    vacio: vacio?.t ?? null,
    cargando: cargando?.t ?? null,
    lobby: lobby?.t ?? null,
    tras: cargando ? (raiz[iCarga + 1]?.que || (raiz[iCarga + 1] ? '(vacío)' : null)) : null,
    caja: cargando?.caja ?? null,
    isoCargado: cargando?.isoCargado ?? null,
    veces: raiz.filter((e) => /(^|\s)cargando(\s|$)/.test(e.que)).length,
  }
}

/** Lo que el indicador expone mientras está a la vista (bie.c6, bie.c7). */
export const SONDA_INDICADOR = `(() => {
  const c = document.querySelector('.cargando');
  if (!c) return null;
  const st = c.querySelector('[role="status"]');
  const caja = (e) => { if (!e) return null; const r = e.getBoundingClientRect(); return [r.x, r.y, r.width, r.height].map((n) => +n.toFixed(2)).join(','); };
  return {
    t: Math.round(performance.now()),
    status: !!st,
    vivo: st ? st.getAttribute('aria-live') : null,
    texto: st ? st.textContent.trim() : null,
    ocultos: [...c.querySelectorAll('[aria-hidden="true"]')].map((e) => e.className),
    animaciones: c.getAnimations({ subtree: true }).filter((a) => a.playState === 'running').length,
    caja: caja(st),
    iso: (() => { const i = c.querySelector('.cargando-iso'); return i ? { cargado: i.complete && i.naturalWidth > 0, caja: caja(i) } : null; })(),
    fondo: getComputedStyle(c).backgroundColor,
  };
})()`
