import Cargando from './Cargando'
import { useEsperaVisible } from '../hooks/useEsperaVisible'

// ── ARN-3d §2.4 · el `fallback` del ÚNICO `Suspense`, en la raíz (`main.jsx`) ─
// El «Cargando» de BIE-1, con su regla D5: nada hasta los 300 ms y, si aparece,
// se queda 500. No debería verse nunca: la única pantalla diferida (la mesa)
// entra por `startTransition`, y React deja la anterior puesta mientras llega el
// chunk. Un `Suspense` montado DENTRO de la transición sí pintaría su
// `fallback`; por eso hay uno solo y está en la raíz, a la vista desde el
// primer render. Archivo propio por `react-refresh/only-export-components`.
export default function EsperaDiferida() {
  const { mostrar } = useEsperaVisible(true)
  return mostrar ? <Cargando /> : null
}
