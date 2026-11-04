import isotipoUrl from '../assets/ajilei-isotipo.svg?no-inline'
import '../styles/bandera.css'
import { esPais } from '../lib/lugarCodigos'

// ── CFG-1 1b · La bandera ───────────────────────────────────────────────────
// Rector: AJILEI_CFG-1_Fase1b_v1.0.md §0-3 y §2.2 (R-11, V7-A). Rectangular
// 3:2, de `country-flag-icons` copiada a `public/banderas/3x2/` (no es
// dependencia: ver `scripts/gen-paises.mjs`).
//
// `<img>` y no SVG en línea (INV-73 propuesto): una petición por bandera, SOLO
// la que se pinta —con `lazy` en las listas largas—, y el SVG no ejecuta nada.
// Nunca emoji: Windows no los dibuja como banderas.
//
// SIN PAÍS, el isotipo de AJILEI en tenue en la MISMA caja (O1): elegir o
// quitar el país no mueve lo de al lado. El alto lo pone `--band-h` en cada
// sitio y el ancho sale de la forma (`perfil.css` §1).
export default function Bandera({ pais, lazy = false, className = '' }) {
  const clase = `cfg-band${className ? ` ${className}` : ''}`
  if (!esPais(pais)) {
    return <img className={`${clase} es-iso`} src={isotipoUrl} alt="" draggable="false" />
  }
  return (
    <img
      className={clase}
      src={`${import.meta.env.BASE_URL}banderas/3x2/${pais}.svg`}
      alt=""
      draggable="false"
      decoding="async"
      loading={lazy ? 'lazy' : undefined}
      data-pais={pais}
    />
  )
}
