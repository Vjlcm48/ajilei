import { useEffect, useLayoutEffect, useReducer, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ReaccionBurbuja } from '../components/Reacciones'
import { REACCION_MIN_W_PX, REACCION_TOTAL_MS, rutaEmoji, textoDe } from '../config/reacciones'
import { aPropios, escalaActual } from '../lib/escala'
import {
  AIRE_PX, FRENO_MENSAJE_MS, burbujasVivas, claveDeFrase, colocarAjena, corta, fraseDeClave, frenoRestante, topeAjena,
} from '../lib/mensajesMesaCore'

// ── MES-PvP L-M 2 · Los mensajes compartidos, sobre la mesa (lámina) ────────
// Ficha AJILEI_MES-PvP_LM-2_v1.0.md §2. Capa del trozo de la partida: no toca `GameTable` ni el
// circuito de las IAS (`useReacciones`), que sigue igual. En PvP:
//   · la frase elegida en el selector 💬 NO pasa por el freno local («una a la vez» + 5 s): la
//     capa la recoge antes (captura), la manda como clave y cierra el selector con Esc;
//   · cada burbuja viva se pinta junto a quien la mandó: la propia, con el componente y la
//     colocación de siempre (`ReaccionBurbuja`: encima de «Tú» en escritorio, satélite del ⋮ en
//     el teléfono); las ajenas, bajo el nombre de su recuadro, con el pico hacia arriba;
//   · el freno de 10 s, por jugador: la entrada 💬 atenuada y sin respuesta, con un anillo que se
//     vacía (variante a, elegida por Victor en el STOP-L de la tanda 2).
// Todo cuelga de `.game-table-screen` (portal), como la burbuja de las IAS: hereda sus tokens y
// su escala, y es `fixed`: Δ = 0 de layout.

const ahoraReal = () => Date.now()

// DECISIÓN DE LA LÁMINA (fuera de la ficha). En el teléfono VERTICAL la propia no va de
// satélite del ⋮ como contra las IAS: allí pisa los recuadros de la fila de arriba y empuja las
// burbujas ajenas en cascada hasta el óvalo (medido en la mesa de 5 a 412×915). Va centrada sobre
// el óvalo, sin pico: tapa la crónica 3 s, pero ni cartas ni botones (aprobado por Victor). En
// horizontal y en escritorio, la de siempre (`ReaccionBurbuja`).
const MQ_VERTICAL_TELEFONO = '(orientation: portrait) and (max-width: 600px)'

function useLista(mensajes) {
  const [, repinta] = useReducer((x) => x + 1, 0)
  useEffect(() => mensajes?.suscribir?.(repinta), [mensajes])
  return mensajes?.lista() ?? []
}

function useReloj(activo) {
  const [ahora, setAhora] = useState(ahoraReal)
  useEffect(() => {
    if (!activo) return undefined
    const id = setInterval(() => setAhora(ahoraReal()), 100)
    return () => clearInterval(id)
  }, [activo])
  return ahora
}

// La caja de un elemento visible, en px propios (la escala de la mesa).
function cajaDe(el) {
  if (!el) return null
  const r = aPropios(el.getBoundingClientRect(), escalaActual())
  return r.width > 0 && r.height > 0 ? r : null
}

function filosArea() {
  const el = document.querySelector('.game-table')
  if (!el) return null
  const r = cajaDe(el)
  return r && { izq: r.left, der: r.right }
}

function BurbujaAjena({ m, msjMs, onCerrar, enOvalo = false }) {
  const frase = fraseDeClave(m.clave)
  const congelada = msjMs !== null
  return (
    <div
      className={`u2-burbuja pvp-msj-ajena${enOvalo ? ' es-en-ovalo' : ''}`}
      role="status"
      aria-label={frase}
      data-msj-asiento={m.asiento}
      style={{
        '--u2-dur': `${REACCION_TOTAL_MS}ms`,
        '--u2-pico': '8px',
        visibility: 'hidden',
        ...(congelada ? { animationDelay: `-${msjMs}ms`, animationPlayState: 'paused' } : {}),
      }}
    >
      <span className="u2-texto">{textoDe(frase)}</span>
      <button type="button" className="u2-cerrar" onClick={() => onCerrar(m.id)} aria-label="Cerrar reacción" title="Cerrar">✕</button>
      <picture className="u2-emoji">
        <source media="(prefers-reduced-motion: reduce)" srcSet={rutaEmoji(frase, 'svg')} />
        <img src={rutaEmoji(frase, 'avif')} alt="" />
      </picture>
    </div>
  )
}

// Coloca las ajenas en el DOM, en orden de asiento, apartándose de la propia y de las ya puestas.
function colocarAjenas() {
  const area = filosArea()
  if (!area) return
  const puestas = []
  const propia = document.querySelector('.game-table-screen .u2-burbuja:not(.pvp-msj-ajena)')
  if (propia && propia.style.visibility !== 'hidden') {
    const left = parseFloat(propia.style.left)
    const top = parseFloat(propia.style.top)
    if (Number.isFinite(left) && Number.isFinite(top)) {
      puestas.push({ left, top, right: left + propia.offsetWidth, bottom: top + propia.offsetHeight + 8 })
    }
  }
  for (const el of document.querySelectorAll('.game-table-screen .pvp-msj-ajena:not(.es-en-ovalo)')) {
    const k = el.dataset.msjAsiento
    const raiz = document.querySelector(`[data-coin-target="${k}"]`)?.closest('.opp-panel, .ai-zone')
    const nombreEl = raiz?.querySelector('.opp-name, .ai-name')
    const recuadro = cajaDe(raiz)
    if (!nombreEl || !recuadro) { el.style.visibility = 'hidden'; continue }
    // La tinta del nombre, no su caja (molde de `ReaccionBurbuja`).
    const rango = document.createRange()
    rango.selectNodeContents(nombreEl)
    const tinta = aPropios(rango.getBoundingClientRect(), escalaActual())
    const nombre = { left: tinta.left, right: Math.min(tinta.right, recuadro.right), top: tinta.top, bottom: tinta.bottom }
    el.style.maxWidth = `${topeAjena(recuadro, REACCION_MIN_W_PX)}px`
    const caja = { width: el.offsetWidth, height: el.offsetHeight }
    const pos = colocarAjena({ nombre, recuadro, caja, puestas, area })
    el.style.left = `${pos.left}px`
    el.style.top = `${pos.top}px`
    el.style.setProperty('--u2-pico-x', `${pos.picoX}px`)
    el.dataset.desplazada = pos.desplazada ? '1' : '0'
    el.style.visibility = 'visible'
    puestas.push({ left: pos.left, top: pos.top - 8, right: pos.left + caja.width, bottom: pos.top + caja.height })
  }
  // La propia en el teléfono vertical, la última: centrada sobre el óvalo; si pisa una ajena,
  // baja lo justo, sin pasar de la fila de tus cartas.
  const enOvalo = document.querySelector('.game-table-screen .pvp-msj-ajena.es-en-ovalo')
  const ovalo = cajaDe(document.querySelector('.center-zone'))
  if (enOvalo && ovalo) {
    enOvalo.style.maxWidth = `${Math.max(REACCION_MIN_W_PX, ovalo.width - 24)}px`
    const w = enOvalo.offsetWidth
    const h = enOvalo.offsetHeight
    const left = ovalo.left + (ovalo.width - w) / 2
    let top = ovalo.top + (ovalo.height - h) / 2
    const cartas = cajaDe(document.querySelector('.player-zone .card-slot-wrapper'))
    const suelo = cartas ? cartas.top - h : Infinity
    for (const p of puestas) {
      if (corta({ left, top, right: left + w, bottom: top + h }, p)) top = Math.max(top, p.bottom + AIRE_PX)
    }
    top = Math.min(top, suelo)
    enOvalo.style.left = `${left}px`
    enOvalo.style.top = `${top}px`
    enOvalo.dataset.pisa = puestas.some((p) => corta({ left, top, right: left + w, bottom: top + h }, p)) ? '1' : '0'
    enOvalo.style.visibility = 'visible'
  }
}

export default function MensajesMesa({ partida, oculta = false }) {
  const mensajes = partida?.mensajes ?? null
  const msjMs = partida?.lamina?.msjMs ?? null
  const lista = useLista(mensajes)
  const congelada = msjMs !== null
  const [cerradas, setCerradas] = useState(() => new Set())
  // Congelada: cada burbuja en su ms `msjMs` (la hora de quien mira, fija).
  const [fija] = useState(() => (congelada && lista.length ? Math.max(...lista.map((x) => x.hora)) + msjMs : null))
  const viva = useReloj(!!mensajes && !congelada)
  const ahora = congelada && fija !== null ? fija : viva
  const vivas = burbujasVivas(lista, ahora).filter((m) => !cerradas.has(m.id))
  const freno = frenoRestante(lista, 0, ahora)

  // La frase elegida en el selector: se recoge antes que el circuito de las IAS.
  const frenoRef = useRef(0)
  useEffect(() => { frenoRef.current = freno }, [freno])
  useEffect(() => {
    if (!mensajes) return undefined
    const alClic = (e) => {
      const boton = e.target.closest?.('.u2-selector .u2-frase')
      if (!boton) return
      e.stopPropagation()
      e.preventDefault()
      if (frenoRef.current > 0) return
      const clave = claveDeFrase(boton.getAttribute('aria-label'))
      if (clave) mensajes.enviar(clave)
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    }
    document.addEventListener('click', alClic, true)
    return () => document.removeEventListener('click', alClic, true)
  }, [mensajes])

  // El freno, a la vista: clase y variable en `body` (la entrada 💬 es de la mesa; `pvp.css` la
  // viste sin abrir sus hojas).
  useEffect(() => {
    const b = document.body
    if (!mensajes || freno <= 0) { b.classList.remove('pvp-freno'); return }
    b.classList.add('pvp-freno')
    b.style.setProperty('--pvp-freno-frac', String(freno / FRENO_MENSAJE_MS))
  }, [mensajes, freno])
  useEffect(() => () => {
    document.body.classList.remove('pvp-freno')
    document.body.style.removeProperty('--pvp-freno-frac')
  }, [])

  // La mesa llega por `Suspense`: el portal espera a que exista su raíz.
  const [destino, setDestino] = useState(null)
  useEffect(() => {
    if (!mensajes) return undefined
    const buscar = () => {
      const el = document.querySelector('.game-table-screen')
      setDestino((d) => (d === el ? d : el))
    }
    buscar()
    const id = setInterval(buscar, 250)
    return () => clearInterval(id)
  }, [mensajes])

  useLayoutEffect(() => { if (!oculta) colocarAjenas() })
  // La propia (`ReaccionBurbuja`) se coloca en su propio efecto, a veces después de este: se
  // repasa la colocación al rato (congelada no hay reloj que lo haga).
  const firma = vivas.map((m) => m.id).join(',')
  useEffect(() => {
    if (oculta || !firma) return undefined
    const ids = [60, 300, 900].map((ms) => setTimeout(colocarAjenas, ms))
    return () => ids.forEach(clearTimeout)
  }, [firma, oculta, destino])
  if (!mensajes || oculta || !destino) return null
  const propia = vivas.find((m) => m.asiento === 0)
  const ajenas = vivas.filter((m) => m.asiento !== 0)
  const cerrar = (id) => setCerradas((s) => new Set(s).add(id))
  const enOvalo = window.matchMedia(MQ_VERTICAL_TELEFONO).matches
  return createPortal(
    <>
      {propia && enOvalo && <BurbujaAjena m={propia} msjMs={msjMs} onCerrar={cerrar} enOvalo />}
      {propia && !enOvalo && (
        <div className={congelada ? 'pvp-msj-propia es-congelada' : 'pvp-msj-propia'} style={congelada ? { '--pvp-msj-ms': `-${msjMs}ms` } : undefined}>
          <ReaccionBurbuja
            key={propia.id}
            activa={{ id: propia.id, frase: fraseDeClave(propia.clave) }}
            anchorSel=".pbr-name"
            onCerrar={() => cerrar(propia.id)}
          />
        </div>
      )}
      {ajenas.map((m) => <BurbujaAjena key={m.id} m={m} msjMs={msjMs} onCerrar={cerrar} />)}
    </>,
    destino,
  )
}
