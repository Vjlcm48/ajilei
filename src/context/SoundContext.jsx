import { useEffect, useState } from 'react'
import { SoundContext } from './useSoundContext'
import { conHowler } from '../lib/motorHowler'

// DSK-U1 · El ajuste de sonido deja de ser volátil. Antes vivía sólo en estado
// React: sobrevivía al cambio de pantalla y de mesa (el provider cuelga de la
// raíz en main.jsx) pero NO a la recarga — cada F5 devolvía el sonido encendido.
// Clave simple y estable; cualquier lectura distinta de 'off' (incluida la
// ausencia de la clave o un storage bloqueado) se resuelve como ENCENDIDO: el
// default histórico manda ante cualquier duda.
// El contexto es compartido con móvil, así que móvil gana la persistencia
// también. Es mejora, no regresión, y visualmente Δ=0 (el sellado móvil de esta
// tanda es visual: ni una regla CSS ni un nodo del árbol móvil cambian).
const SOUND_KEY = 'ajilei.sound'

function readStoredSound() {
  try { return window.localStorage.getItem(SOUND_KEY) !== 'off' }
  catch { return true }   // modo privado / storage denegado → default de siempre
}

export function SoundProvider({ children }) {
  const [soundEnabled, setSoundEnabled] = useState(readStoredSound)
  const toggle = () => setSoundEnabled(prev => !prev)

  // Persistencia y mute REAL en el mismo efecto, para que jamás diverjan.
  // Howler.mute() silencia el motor entero, incluido lo que YA está sonando
  // (el `if (!soundEnabled) return` de useSounds sólo frena reproducciones
  // nuevas y se queda como segunda capa). Corre también en el montaje: un 'off'
  // guardado silencia el motor antes del primer play() de la sesión.
  useEffect(() => {
    try { window.localStorage.setItem(SOUND_KEY, soundEnabled ? 'on' : 'off') }
    catch { /* storage no disponible: el ajuste sigue vivo en memoria */ }
    // PES-1 §3-E · si el motor aún no llegó, entra el primero al llegar.
    conHowler(({ Howler }) => Howler.mute(!soundEnabled))
  }, [soundEnabled])

  return (
    <SoundContext.Provider value={{ soundEnabled, toggle }}>
      {children}
    </SoundContext.Provider>
  )
}
