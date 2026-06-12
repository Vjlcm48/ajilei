import { useSoundContext } from '../context/SoundContext'

export function MuteButton() {
  const { soundEnabled, toggle } = useSoundContext()
  return (
    <button
      className="mute-button"
      onClick={toggle}
      title={soundEnabled ? 'Silenciar' : 'Activar sonido'}
    >
      {soundEnabled ? '🔊' : '🔇'}
    </button>
  )
}
