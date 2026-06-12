import { useSounds } from '../hooks/useSounds'

export function SoundButton({ onClick, children, ...props }) {
  const { play } = useSounds()

  const handleClick = (e) => {
    play('buttonClick')
    onClick?.(e)
  }

  return <button onClick={handleClick} {...props}>{children}</button>
}
