import { createContext, useContext, useState } from 'react'

const SoundContext = createContext()

export function SoundProvider({ children }) {
  const [soundEnabled, setSoundEnabled] = useState(true)
  const toggle = () => setSoundEnabled(prev => !prev)
  return (
    <SoundContext.Provider value={{ soundEnabled, toggle }}>
      {children}
    </SoundContext.Provider>
  )
}

export function useSoundContext() {
  return useContext(SoundContext)
}
