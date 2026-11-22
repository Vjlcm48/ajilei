import { bancoDelBypass } from './billeteraFalsa'

// ── TUT-1 T3 · El premio de la guiada contra el banco imitado ───────────────
// Aparte de `billeteraFalsa.js` a propósito: lo importa `lib/guiadaApi`, que viaja en
// los trozos de la guiada, y la billetera falsa vive en la entrada. En la build la
// primera línea es `return null` y de este archivo no queda nada en el trozo; si
// importara de `billeteraFalsa` sin esa puerta, la entrada tendría que exportarle algo.
// Rector: AJILEI_TUT-1_T3_v1.0.md §2 y §3. No hay una API aquí: el cliente (el
// banco, con su `rpc`) viaja a los trozos que la envuelven (`lib/guiadaApi`), y
// así la envoltura no entra en la entrada. Los mandos `?guia=` (solo aquí,
// detrás de la misma puerta doble):
//   ?guia=cobrado  → el premio ya se cobró con este correo (limpio, 2.000)
//   ?guia=jugado   → una mano cerrada entre personas: el tramo es de 1.000
//   ?guia=red      → las dos funciones contestan error de red
//   ?guia=lento    → cada respuesta tarda 2,5 s (la espera del cierre se ve)
// Sin mando, lo que diga el banco (limpio, 2.000), con `GUIADA_TARDA_MS`.
export const GUIA_PARAM = 'guia'
const GUIADA_TARDA_MS = 300
const GUIADA_LENTA_MS = 2500

function mandoGuia() {
  try { return new URLSearchParams(window.location.search).get(GUIA_PARAM) } catch { return null }
}

/** El cliente del premio de la guiada contra el banco imitado, o `null` fuera de desarrollo con bypass. */
export function clienteGuiadaDev() {
  if (!import.meta.env.DEV) return null
  const b = bancoDelBypass()
  if (!b) return null
  const mando = mandoGuia()
  if (mando === 'cobrado') b.sembrarPremioGuiada('limpio')
  if (mando === 'jugado') b.cerrarManoPvp()
  const tarda = mando === 'lento' ? GUIADA_LENTA_MS : GUIADA_TARDA_MS
  const espera = (v) => new Promise((ok) => setTimeout(() => ok(v), tarda))
  return {
    rpc: (nombre, params) => (mando === 'red'
      ? espera({ data: null, error: { code: 'PGRST000', message: 'mando ?guia=red' } })
      : b.rpc(nombre, params).then(espera)),
  }
}
