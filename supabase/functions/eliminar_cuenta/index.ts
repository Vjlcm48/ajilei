// ── CFG-1 · Fase 1c · eliminar_cuenta ───────────────────────────────────────
// Rector: AJILEI_CFG-1_Fase1c_v1.0.md §3.2. La llama el cliente desde la
// ventana «Eliminar cuenta» (`src/lib/cuentaApi.js`), con el JWT de la sesión.
//
// QUÉ HACE, en este orden:
//   1. Sólo POST (y el OPTIONS de CORS).
//   2. El uid sale del TOKEN: `Authorization: Bearer` → `GET /auth/v1/user` con
//      la llave pública. Nunca del cuerpo, que ni se lee. Sin usuario → 401.
//   3. La guarda, con la llave de servicio: `partida_abierta_de(uid)`
//      (migración 20261030001500). Mesa IA abierta o sala esperando/activa →
//      409 { motivo: 'mesa_abierta' }.
//   4. `auth.admin.deleteUser(uid)`: borra la fila de `auth.users` y todo lo
//      demás cae en cascada (profiles, billetera, libro, mesas, salas,
//      puntos…). `bonos_bienvenida` no cuelga de nadie: la huella del correo
//      se queda. → 200 { ok: true }.
//   Cualquier otro fallo → 500 { motivo: 'servidor' }, con el error en el log
//   de la función y NUNCA en la respuesta.
//
// LO QUE NO HACE: ningún DELETE ni `raise` sobre ninguna tabla. Los libros
// rechazan el DELETE que no llegue en cascada, y así debe ser (INV-71).
//
// LAS LLAVES las inyecta Supabase en toda función: no hay secreto que poner a
// mano. El proyecto usa las llaves nuevas (`sb_publishable_` / `sb_secret_`);
// se prueban las legadas y las nuevas, con el patrón `llave()`, que nació en la
// sonda de MOT-1, ya borrada.
//
// SE DESPLIEGA CON `--no-verify-jwt` (y `verify_jwt = false` en config.toml),
// como la sonda: la puerta del gateway no sirve con las llaves nuevas, y esta
// función verifica el token por sí misma en el paso 2.

import { createClient } from 'npm:@supabase/supabase-js@2.112.4'

const env = (k: string): string | null => {
  try { return Deno.env.get(k) ?? null } catch { return null }
}

function llave(tipo: 'publica' | 'secreta'): string | null {
  const legada = env(tipo === 'publica' ? 'SUPABASE_ANON_KEY' : 'SUPABASE_SERVICE_ROLE_KEY')
  if (legada) return legada
  const nueva = env(tipo === 'publica' ? 'SUPABASE_PUBLISHABLE_KEYS' : 'SUPABASE_SECRET_KEYS')
  if (!nueva) return null
  try {
    const obj = JSON.parse(nueva)
    return obj.default ?? Object.values(obj)[0] ?? null
  } catch { return null }
}

// ── CORS ────────────────────────────────────────────────────────────────────
// La app (ajilei.io) y lo de desarrollo: localhost y la red de casa (la PC y el
// S25 contra `vite preview`) y los túneles rápidos de Cloudflare que Victor usa
// para probar en el teléfono. CORS no es la cerradura —sin el JWT del jugador
// nadie borra nada—, sólo la puerta del navegador.
const ORIGENES = new Set(['https://ajilei.io', 'https://www.ajilei.io'])
const ORIGENES_DESARROLLO = [
  /^http:\/\/localhost(:\d+)?$/,
  /^http:\/\/127\.0\.0\.1(:\d+)?$/,
  /^http:\/\/192\.168\.\d{1,3}\.\d{1,3}(:\d+)?$/,
  /^https:\/\/[a-z0-9-]+\.trycloudflare\.com$/,
]
function cabecerasCors(origen: string | null): Record<string, string> {
  const base: Record<string, string> = { Vary: 'Origin' }
  if (!origen || !(ORIGENES.has(origen) || ORIGENES_DESARROLLO.some((r) => r.test(origen)))) return base
  return {
    ...base,
    'Access-Control-Allow-Origin': origen,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Max-Age': '600',
  }
}

const err = (e: unknown) => String((e as Error)?.message ?? e).slice(0, 400)

Deno.serve(async (req) => {
  const cors = cabecerasCors(req.headers.get('Origin'))
  const responder = (status: number, cuerpo: Record<string, unknown>) =>
    new Response(JSON.stringify(cuerpo), {
      status,
      headers: { ...cors, 'Content-Type': 'application/json; charset=utf-8' },
    })

  // ── 1 · sólo POST ─────────────────────────────────────────────────────────
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors })
  if (req.method !== 'POST') return responder(405, { motivo: 'metodo' })

  const base = env('SUPABASE_URL')
  const publica = llave('publica')
  const secreta = llave('secreta')
  if (!base || !publica || !secreta) {
    console.error(`CFG-1c: faltan variables · SUPABASE_URL=${!!base} · pública=${!!publica} · secreta=${!!secreta}`)
    return responder(500, { motivo: 'servidor' })
  }

  // ── 2 · el uid, del token ─────────────────────────────────────────────────
  const cab = req.headers.get('Authorization') ?? ''
  const token = cab.startsWith('Bearer ') ? cab.slice(7).trim() : ''
  if (!token) return responder(401, { motivo: 'sin_sesion' })
  let uid: string | null = null
  try {
    const r = await fetch(`${base}/auth/v1/user`, { headers: { Authorization: `Bearer ${token}`, apikey: publica } })
    if (r.status >= 500) {
      console.error(`CFG-1c: /auth/v1/user contestó ${r.status}`)
      return responder(500, { motivo: 'servidor' })
    }
    // 401/403/404: el token no es de una sesión viva (o es la llave pública
    // sola, que es lo que manda el SDK sin sesión).
    if (!r.ok) return responder(401, { motivo: 'sin_sesion' })
    const usuario = await r.json().catch(() => null)
    uid = typeof usuario?.id === 'string' ? usuario.id : null
  } catch (e) {
    console.error('CFG-1c: no se pudo leer el usuario del token —', err(e))
    return responder(500, { motivo: 'servidor' })
  }
  if (!uid) return responder(401, { motivo: 'sin_sesion' })
  const quien = uid.slice(0, 8)

  const admin = createClient(base, secreta, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  })

  // ── 3 · la guarda ─────────────────────────────────────────────────────────
  const { data: abierta, error: errorGuarda } = await admin.rpc('partida_abierta_de', { p_uid: uid })
  if (errorGuarda) {
    console.error(`CFG-1c: partida_abierta_de falló (${quien}…) —`, errorGuarda.code ?? '', errorGuarda.message)
    return responder(500, { motivo: 'servidor' })
  }
  if (abierta !== null) {
    console.log(`CFG-1c: ${quien}… no se borra: ${abierta}`)
    return responder(409, { motivo: 'mesa_abierta' })
  }

  // ── 4 · el borrado ────────────────────────────────────────────────────────
  const { error: errorBorrado } = await admin.auth.admin.deleteUser(uid)
  if (errorBorrado) {
    console.error(`CFG-1c: deleteUser falló (${quien}…) —`, errorBorrado.status ?? '', errorBorrado.message)
    return responder(500, { motivo: 'servidor' })
  }
  console.log(`CFG-1c: cuenta ${quien}… eliminada`)
  return responder(200, { ok: true })
})
