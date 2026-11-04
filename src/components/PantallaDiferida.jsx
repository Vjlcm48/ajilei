import { useEffect, useState } from 'react'
import Cargando from './Cargando'
import { useEsperaVisible } from '../hooks/useEsperaVisible'

// ── PES-1 · La espera de una pantalla diferida ──────────────────────────────
// Rector: AJILEI_PES-1_Fase1_v1.0.md §3-B. Envuelve a un `lazy(trozos.x.fabrica)`.
// Si el trozo ya llegó, que es lo normal con la precarga del lobby, pinta a su
// hijo en este mismo render: `fabrica` da entonces un thenable síncrono y no hay
// fotograma de espera. Si no, enseña el fondo de la familia y, con la regla D5 de
// BIE-1, el «Cargando»: nada hasta los 300 ms y, si aparece, se queda 500.
//
// POR QUÉ NO ES UN `Suspense` LOCAL. React retiene su `fallback` 300 ms aunque el
// trozo llegue antes (H3d-2, ~330 ms medidos), y esa espera no se podría quitar:
// aquí el hijo no se pinta hasta que el módulo está en memoria, y el `lazy` nunca
// suspende. El `Suspense` de la raíz sigue siendo la red de `main.jsx`.
//
// LAS FAMILIAS. `sal` es la rampa de `.sal-fondo`, que `salas.css` deja en la
// entrada; `abismo`, el verde del `body`, el del intersticial. `capa` es para lo
// que cubre otra pantalla, las capas del video: no pinta nada hasta los 300 ms y
// luego tapa lo de debajo.
//
// EL TROZO CAÍDO. Al montar se marca la entrada: si el `import()` falla, el
// escuchador de `main.jsx` recarga una vez, como con la mesa. Si la recarga no lo
// arregla, se queda el «Cargando» y no una pantalla vacía.
export default function PantallaDiferida({ trozo, familia = 'sal', children }) {
  const [llegado, setLlegado] = useState(trozo.llego)

  useEffect(() => {
    if (llegado) return undefined
    let vivo = true
    trozo.marcarEntrada()
    // Con el evento prevenido, Vite resuelve el `import()` sin módulo: por eso se
    // pregunta `llego()` y no basta con que la promesa se cumpla.
    trozo.cargar().then(() => { if (vivo && trozo.llego()) setLlegado(true) }, () => {})
    return () => { vivo = false }
  }, [trozo, llegado])

  const { mostrar, liberar } = useEsperaVisible(!llegado)
  if (liberar) return children
  return (
    <div className={`espera-trozo es-${familia}`} data-espera-trozo={familia}>
      {familia === 'sal' && <div className="sal-fondo" aria-hidden="true" />}
      {mostrar && <Cargando />}
    </div>
  )
}
