import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/theme.css'
import './index.css'
// EMB-1 · capa de pintura (recorrido de Mano Actual + resplandor del título).
// Global y no por componente: cruza dos pantallas que no comparten árbol. Gana
// por especificidad, no por orden de carga — ver la cabecera de la hoja.
import './styles/embellecimiento.css'
// EMB-2 · los cinco tapetes. Hoja propia y global por la misma razón que la de
// EMB-1: gameTable.css es archivo sellado y la capa de color se lee de un
// tirón. Después de embellecimiento.css — nada de aquí compite con nada de
// allí, pero el orden de la cascada de pintura queda declarado y no al azar.
import './styles/tapetes.css'
import App from './App.jsx'
import { SoundProvider } from './context/SoundContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <SoundProvider>
      <App />
    </SoundProvider>
  </StrictMode>,
)
