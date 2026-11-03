import { createContext, useContext } from 'react'

// ARN-4 B1 · el contexto y su lector, aparte del proveedor: un archivo de
// componentes no puede exportar también un hook sin romper el refresco en caliente.
export const SoundContext = createContext()

export function useSoundContext() {
  return useContext(SoundContext)
}
