import { useLayoutEffect, useRef, useState } from 'react'

import { CAJA, elegirForma } from './zonaAccionCore'

// ── IOS-1 1e · La caja de encima del botón dorado ───────────────────────────
// Rector: AJILEI_IOS-1_Fase1e_v1.0.md §2.3. Pinta lo que `cajaDeAccion` decide
// (`zonaAccionCore.js`): una nota o el resumen, nunca las dos.
//
// ── LA CAJA GUARDA SU LÍNEA (O1), SALVO CALLADA ─────────────────────────────
// Sin nada que decir, la caja sigue ahí con su línea y `visibility: hidden`:
// aparecer y desaparecer no puede cambiar el aire de las filas de encima.
// Callada (el bloque del video o el de la lectura, que ya hablan con su botón)
// suelta la línea: ese bloque ocupa justo ese sitio, en la misma zona.
//
// ── EL RESUMEN SE ELIGE MIDIENDO ────────────────────────────────────────────
// Las formas (larga, corta) se pintan también en una regla invisible, cada una
// en una sola línea, y se compara su ancho con el de la caja. Así decide la
// medida y no el número de letras, y vale en cualquier idioma. Si ninguna cabe,
// la última se corta con «…» (CSS). Un `ResizeObserver` repite la cuenta al
// cambiar el ancho (girar el aparato, la ventana de la laptop).
//
// `data-accion="cta-nota"` es el de la nota de antes: el arnés la sigue
// buscando por ahí, ahora encima del botón.

function conCifra(texto, cifra) {
  const i = cifra ? texto.lastIndexOf(cifra) : -1
  if (i < 0) return texto
  return <>{texto.slice(0, i)}<b>{cifra}</b>{texto.slice(i + cifra.length)}</>
}

export default function CajaAccion({ caja }) {
  const ref = useRef(null)
  const regla = useRef(null)
  const formas = caja?.tipo === CAJA.RESUMEN ? caja.formas : null
  const firma = formas ? formas.join('\n') : ''
  const [eleccion, setEleccion] = useState({ firma: '', indice: 0, cortada: false })

  useLayoutEffect(() => {
    const el = ref.current
    if (!el || !formas) return undefined
    const medir = () => {
      const anchos = [...(regla.current?.children ?? [])].map((s) => s.getBoundingClientRect().width)
      const caben = (texto) => (anchos[formas.indexOf(texto)] ?? Infinity) <= el.clientWidth + 0.5
      const { indice, cortada } = elegirForma(formas, caben)
      setEleccion((previa) => (previa.firma === firma && previa.indice === indice && previa.cortada === cortada
        ? previa
        : { firma, indice, cortada }))
    }
    medir()
    const vigia = new ResizeObserver(medir)
    vigia.observe(el)
    return () => vigia.disconnect()
    // `formas` cambia de identidad en cada render; la firma es su contenido.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [firma])

  const tipo = caja?.tipo ?? CAJA.NADA
  let contenido = ' '
  let cortada = false
  if (tipo === CAJA.ALERTA || tipo === CAJA.NOTA) contenido = caja.texto
  else if (formas) {
    const i = eleccion.firma === firma ? eleccion.indice : 0
    contenido = conCifra(formas[Math.min(i, formas.length - 1)], caja.cifra)
    cortada = eleccion.firma === firma && eleccion.cortada
  }

  // La regla va FUERA del párrafo (hermana, `position: absolute` en la zona):
  // dentro, su texto se sumaría al de la caja para quien la lea.
  return (
    <>
      <p
        ref={ref}
        className={`sal-caja is-${tipo}${caja?.callada ? ' is-callada' : ''}${cortada ? ' is-cortada' : ''}`}
        data-accion="cta-nota"
        data-forma={formas ? (eleccion.firma === firma ? eleccion.indice : 0) : undefined}
        role={tipo === CAJA.ALERTA ? 'alert' : undefined}
      >
        {contenido}
      </p>
      {formas && (
        <span ref={regla} className="sal-caja-regla" aria-hidden="true">
          {formas.map((f) => <span key={f}>{conCifra(f, caja.cifra)}</span>)}
        </span>
      )}
    </>
  )
}
