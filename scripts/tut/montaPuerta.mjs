// ── TUT-1 tanda 3 · `diagDSK tut puerta` · la puerta del lobby, EN LA PÁGINA ────
// No es de la app: lo pide la vara (`scripts/tut/puerta.mjs`) con un `import()` dentro de la
// página, y lo sirve el servidor de desarrollo (5173). Nadie de `src/` lo importa: no llega a
// `dist/`. Monta la `PuertaGuiada` REAL en una raíz propia con un cliente que cuenta lo que le
// piden, para probar la guarda de la sala pendiente sin montar una invitación entera.
import { createElement } from 'react'
import { createRoot } from 'react-dom/client'
import PuertaGuiada from '/src/components/PuertaGuiada.jsx'
import { SoundContext } from '/src/context/useSoundContext.js'

const espera = (ms) => new Promise((ok) => setTimeout(ok, ms))
// Como en `montaCapa.mjs`: el contexto del sonido, apagado (en la app, la puerta lo hereda de `App`).
const conSonido = (hijo) => createElement(SoundContext.Provider, { value: { soundEnabled: false } }, hijo)

/** Con sala pendiente la puerta no pregunta ni saca la tarjeta; sin ella (el control), sí. */
export async function probarSalaPendiente() {
  const previa = localStorage.getItem('ajilei.guia')
  localStorage.setItem('ajilei.guia', JSON.stringify({ ofrecida: false }))
  const llamadas = []
  const cliente = {
    rpc: (n) => { llamadas.push(n); return Promise.resolve({ data: { estado: 'disponible', monto: 2000, tramo: 'limpio' }, error: null }) },
  }
  const nodo = document.createElement('div')
  document.body.appendChild(nodo)
  const raiz = createRoot(nodo)
  try {
    raiz.render(conSonido(createElement(PuertaGuiada, { key: 'con-sala', cliente, salaPendiente: true, onJugar: () => {} })))
    await espera(1200)
    const sale = !!document.querySelector('.ofg-tarjeta')
    const llamadasConSala = [...llamadas]
    raiz.render(conSonido(createElement(PuertaGuiada, { key: 'sin-sala', cliente, salaPendiente: false, onJugar: () => {} })))
    await espera(1200)
    const control = !!document.querySelector('.ofg-tarjeta')
    return { sale, control, llamadasConSala, llamadas }
  } finally {
    raiz.unmount()
    nodo.remove()
    if (previa === null) localStorage.removeItem('ajilei.guia')
    else localStorage.setItem('ajilei.guia', previa)
  }
}
