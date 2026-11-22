// ── TUT-1 tanda 1 · `diagDSK tut` · el montaje de la capa, EN LA PÁGINA ─────
// No es de la app: lo pide la vara (`scripts/tut/tut.mjs`) con un `import()` dentro de
// la página, y lo sirve el servidor de desarrollo (5173, raíz del repo). Nadie de `src/`
// lo importa, así que no llega a `dist/` (la lámina, que montaba la capa desde `main.jsx`
// con el mando `?tut=`, se retiró en esta tanda).
//
// Monta la `CapaSenal` REAL en una raíz propia en `body`, fuera de `#root`, sobre la mesa
// que esté abierta. El contexto del sonido va apagado: en la app la capa vive dentro del
// árbol de `App` y lo hereda por el portal.
import { createElement } from 'react'
import { createRoot } from 'react-dom/client'
import CapaSenal from '/src/components/CapaSenal.jsx'
import { SoundContext } from '/src/context/useSoundContext.js'
import { sumarTextos } from '/src/config/textos.js'
import { TEXTOS_TUT_ES } from '/src/config/textos.tut.es.js'

const ID = 'tut-arnes'
let raiz = null

/** Monta la capa con estas props (las funciones, vacías). Desmonta la anterior. */
export function montar(props) {
  sumarTextos('es', TEXTOS_TUT_ES)
  desmontar()
  const nodo = document.createElement('div')
  nodo.id = ID
  document.body.appendChild(nodo)
  raiz = createRoot(nodo)
  const nada = () => {}
  raiz.render(createElement(SoundContext.Provider, { value: { soundEnabled: false } },
    createElement(CapaSenal, { onSiguiente: nada, onVolver: nada, onCerrar: nada, onSaltar: nada, ...props })))
}

export function desmontar() {
  if (raiz) { raiz.unmount(); raiz = null }
  document.getElementById(ID)?.remove()
}

/** Las claves de los rótulos (lo que pinta la capa, no los botones, la oferta ni el cierre). */
export function rotulos() {
  return Object.keys(TEXTOS_TUT_ES).filter((k) => !/^tut\.(ctl|capa|oferta|indice|cierre)\./.test(k) && !/\.(titulo|nombre)$/.test(k))
}

// TUT-1 T2 · lo más largo que la guiada puede poner en cada hueco: el rival, el palo y el pozo.
const PEOR = { rival: 'IA 2', palo: 'Espadas', pozo: 9900 }

/** Las variables de un rótulo, rellenas con lo más largo posible (`{n}` → 99). */
export function varsDe(clave) {
  return Object.fromEntries([...String(TEXTOS_TUT_ES[clave]).matchAll(/\{([a-z0-9_]+)\}/g)].map(([, n]) => [n, PEOR[n] ?? 99]))
}
