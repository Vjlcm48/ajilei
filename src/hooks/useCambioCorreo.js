import { useCallback, useEffect, useState } from 'react'
import { OTP_EXP_S } from '../lib/correoCore'

// ── CFG-1 1d · Lo que el perfil sabe del cambio de correo ───────────────────
// Lee el estado del servidor al montar (un cambio pendiente sobrevive a cerrar
// la app) y apaga el «Pendiente» cuando el código vence: `new_email` no se va
// solo. La lectura es de `auth.users`, la sesión; hasta que contesta, vale el
// correo de la sesión guardada.
export function useCambioCorreo(api, correoSesion) {
  const [leido, setLeido] = useState(null)
  const [pendiente, setPendiente] = useState(null)

  useEffect(() => {
    let vivo = true
    api.estado().then((r) => {
      if (!vivo || !r.ok) return
      setLeido(r.correo)
      setPendiente(r.estado === 'pendiente' ? { nuevo: r.nuevo, enviadoEn: r.enviadoEn } : null)
    })
    return () => { vivo = false }
  }, [api])

  useEffect(() => {
    if (!pendiente) return undefined
    const id = setTimeout(() => setPendiente(null), Math.max(0, pendiente.enviadoEn + OTP_EXP_S * 1000 - Date.now()))
    return () => clearTimeout(id)
  }, [pendiente])

  const alPedir = useCallback((nuevo, enviadoEn) => setPendiente({ nuevo, enviadoEn }), [])
  const alCompletar = useCallback((correo) => { setLeido(correo); setPendiente(null) }, [])

  return { correo: leido ?? correoSesion, pendiente, alPedir, alCompletar }
}
