// ── PES-1 §3-B · El cambio de correo contra el banco imitado ───────────────
// Salió de `billeteraFalsa.js`, que está en la entrada. El empaquetador reparte por
// el grafo de `import`, también lo que en producción es código muerto: importar
// `correoApi` desde allí dejaba la API en el paquete principal. Lo importa `Perfil`,
// y viaja con él. Los mandos `?cfg=correo-*` están en `billeteraFalsa.js`.
import { crearCorreoApi } from '../lib/correoApi'
import { bancoDelBypass, clienteCorreoDe, mandoCfg } from './billeteraFalsa'

const CORREO_TARDA_MS = 450

/** La API del correo contra el banco imitado, o `null` fuera de desarrollo con bypass. */
export function simulacionCorreo() {
  if (!import.meta.env.DEV) return null
  const b = bancoDelBypass()
  if (!b) return null
  const mando = mandoCfg()
  if (mando === 'correo-pendiente') b.sembrarCambioCorreo('nuevo.correo@gmail.com', 20_000)
  b.forzarCorreo({ 'correo-en-uso': 'en_uso', 'correo-codigo-mal': 'codigo_mal', 'correo-limite': 'limite' }[mando] ?? null)
  return crearCorreoApi(clienteCorreoDe(b, { tarda: CORREO_TARDA_MS }))
}
