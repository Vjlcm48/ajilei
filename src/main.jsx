import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/theme.css'
import './index.css'
// EMB-1 · capa de pintura (recorrido de Mano Actual + resplandor del título).
// Global y no por componente: cruza dos pantallas que no comparten árbol. Gana
// por especificidad, no por orden de carga — ver la cabecera de la hoja.
import './styles/embellecimiento.css'
import App from './App.jsx'
import { SoundProvider } from './context/SoundContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <SoundProvider>
      <App />
    </SoundProvider>
  </StrictMode>,
)
