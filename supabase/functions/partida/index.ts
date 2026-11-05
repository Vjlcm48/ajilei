// ── MOT-1 1e · partida ──────────────────────────────────────────────────────
// Rector: AJILEI_MOT-1_Fase1e_v1.0.md. La llamará el cliente de la 1f con el JWT de la
// sesión. Aquí solo se lee el entorno y se crean los clientes: el recorrido vive en
// `nucleo.js`, con sus pruebas en `scripts/testFuncionPartida.test.js`.
//
// LAS LLAVES las inyecta Supabase en toda función: no hay secreto que poner a mano.
// El patrón `llave()` es el de `supabase/functions/eliminar_cuenta/index.ts:37-46`.
//
// SE DESPLIEGA CON `verify_jwt = false` en config.toml: verifica el token ella misma, en
// local y contra `SUPABASE_JWKS`, porque `/auth/v1/user` costó unos 280 ms por llamada
// en la sonda (H-S1).

import { createClient } from 'npm:@supabase/supabase-js@2.112.4'
import { createLocalJWKSet, jwtVerify } from 'npm:jose@6.2.12'
import { crearEmisor, crearManejador, crearVerificador, sillaDeFila } from './nucleo.js'

const env = (k: string): string | null => {
  try { return Deno.env.get(k) ?? null } catch { return null }
}

function llaveSecreta(): string | null {
  const legada = env('SUPABASE_SERVICE_ROLE_KEY')
  if (legada) return legada
  const nueva = env('SUPABASE_SECRET_KEYS')
  if (!nueva) return null
  try {
    const obj = JSON.parse(nueva)
    return obj.default ?? Object.values(obj)[0] ?? null
  } catch { return null }
}

// Sin variables, la función sigue en pie: el CORS responde y lo demás da 500 con su registro.
let admin: ReturnType<typeof createClient> | null = null
function cliente() {
  const base = env('SUPABASE_URL')
  const secreta = llaveSecreta()
  if (!base || !secreta) throw new Error(`faltan variables · SUPABASE_URL=${!!base} · secreta=${!!secreta}`)
  admin ??= createClient(base, secreta, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  })
  return admin
}

function datos({ data, error }: { data: unknown, error: { code?: string, message: string } | null }, que: string) {
  if (error) throw new Error(`${que}: ${error.code ?? ''} ${error.message}`)
  return data
}

Deno.serve(crearManejador({
  verificarToken: crearVerificador({ jwks: env('SUPABASE_JWKS'), createLocalJWKSet, jwtVerify }),

  rpc: async (nombre: string, args: Record<string, unknown>) => datos(await cliente().rpc(nombre, args), nombre),

  leerSala: async (mesa: string) => datos(
    await cliente().from('salas').select('estado, apuesta, entrada, ritmo').eq('id', mesa).maybeSingle(),
    'salas',
  ),

  leerSillas: async (mesa: string) => (datos(
    await cliente().from('sala_jugadores').select('asiento, jugador_id, profiles(username)').eq('sala_id', mesa),
    'sala_jugadores',
  ) as Parameters<typeof sillaDeFila>[0][]).map(sillaDeFila),

  emitir: (mesa: string, version: number) => {
    const base = env('SUPABASE_URL')
    const secreta = llaveSecreta()
    if (!base || !secreta) throw new Error('faltan variables para el aviso')
    return crearEmisor({ base, secreta })(mesa, version)
  },
}))
