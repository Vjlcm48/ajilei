import { StrictMode, Suspense } from 'react'
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
// MOV-1a · piel MÓVIL del menú de utilidades. Hoja propia y global por la misma
// razón que sus dos hermanas: gameTable.css es archivo sellado y toda la piel
// del menú vive dentro de su bloque de escritorio. Su gate es el complemento
// EXACTO del de aquel bloque, así que las dos pieles no pueden coexistir.
// El sitio en esta lista es DOCUMENTACIÓN, no mecanismo: la hoja gana por
// especificidad y no por orden de carga (ver su encabezado).
import './styles/menuMovil.css'
import App from './App.jsx'
import { SoundProvider } from './context/SoundContext.jsx'
import EsperaDiferida from './components/EsperaDiferida'
import { decidirFalloChunk, origenFalloMesa } from './lib/cargarMesa'

// ── ARN-3d §2.4 (D11) · un chunk que ya no está: recargar UNA vez ───────────
// La mesa viaja en su propio chunk con nombre de hash. Si se despliega una
// versión nueva mientras una pestaña sigue abierta con la vieja, esa pestaña
// pide un `GameTable-<hash viejo>.js` que ya no existe, y el servidor contesta
// `index.html` (H3d-3: `wrangler.jsonc` no se toca en esta tanda). El `import()`
// falla y Vite lo anuncia con `vite:preloadError`.
//
// Recargar trae el `index.html` nuevo, que apunta al chunk nuevo. El saldo no
// se pierde: es la billetera del servidor y se vuelve a leer al volver
// (`useBilletera`). Y desde ECO-1c tampoco la mesa: si `sentarse_ia` ya la
// abrió, queda abierta en el servidor y la recoge el arranque, porque es de
// este dispositivo (`recoger_mesa_ia`, P-4), con su aviso de saldo. UNA vez por
// sesión de la pestaña (la guarda vive en `sessionStorage`): si tras recargar
// vuelve a fallar, no se entra en bucle y el error sigue su curso.
//
// Y SÓLO al entrar (STOP-2): si el fallo es de la precarga del lobby, se calla
// y el lobby sigue. La decisión es `decidirFalloChunk` (`lib/cargarMesa`).
const GUARDA_RECARGA = 'ajilei.recargaPorChunk'
window.addEventListener('vite:preloadError', (evento) => {
  let guarda
  try { guarda = sessionStorage.getItem(GUARDA_RECARGA) === null ? 'libre' : 'usada' } catch { guarda = 'rota' }
  const decision = decidirFalloChunk(origenFalloMesa(), guarda)
  if (decision === 'silencio') { evento.preventDefault(); return }
  if (decision !== 'recargar') return
  try { sessionStorage.setItem(GUARDA_RECARGA, String(Date.now())) } catch { return }
  evento.preventDefault()
  window.location.reload()
})

// ARN-3d §2.4 · el ÚNICO `Suspense`, en la raíz, con el «Cargando» de BIE-1
// como `fallback` (`EsperaDiferida`). La mesa entra en una transición: no
// debería verse nunca.
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <SoundProvider>
      <Suspense fallback={<EsperaDiferida />}>
        <App />
      </Suspense>
    </SoundProvider>
  </StrictMode>,
)
