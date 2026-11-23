import { createPortal } from 'react-dom'
import PlayingCard from '../components/PlayingCard'
import ChipToken from '../components/ChipToken'
import { t } from '../config/textos'
import { montoTexto } from '../config/tapetes'
import '../styles/muestra.css'

// ── TUT-1 T4 · La muestra de cartas (P-4) ───────────────────────────────────
// Rector: AJILEI_TUT-1_T4_v1.0.md §1.2 y P-4. Donde la guiada no enseña la carta o
// el estado que el paso nombra, el paso pinta en el centro de la mesa congelada LOS
// COMPONENTES REALES (`PlayingCard`, los botones de la fila de acciones, la caja del
// pozo) en el estado que enseña. Nunca PNG, nunca arte nuevo.
//
// Sin lógica de juego: recibe lo que pinta (las cartas las fija `capitulos.js`).
// Va en `body` (portal) como la capa, justo DEBAJO de ella (z 39 contra 40): el paso
// la señala como ancla, así que el velo le abre su hueco y la muestra se ve entera,
// con la burbuja pegada. No recibe toques.

const VALOR = { 1: 11, 6: 6, 7: 7 }
const carta = (id) => {
  const [v, palo] = id.split('-')
  const value = Number(v)
  return { id, value, palo, points: VALOR[value] ?? 10, name: id }
}
const puntos = (id) => carta(id).points

// TRES TAMAÑOS según cuántas cartas enseña (STOP-T, Victor; vale para todos los capítulos):
// una → `grande` (el As, el 7 de Oro); dos → `media` (el 6 y el 7, las del mismo palo); más →
// `chica`, lo más grande que quepa sin tocar la burbuja, la barra ni los aros (`tut.solape`).
// Las medidas viven en `muestra.css`; el paso no elige tamaño.
const tamanoMuestra = (n) => (n <= 1 ? 'grande' : n === 2 ? 'media' : 'chica')

/**
 * @param {object} p
 * @param {'cartas'|'empate'|'mults'|'allin'|'pozos'|'sobrante'} p.tipo
 * @param {string[]} [p.cartas]   ids del motor (`1-Copas`…), en `cartas`
 * @param {boolean}  [p.valores]  el valor de cada carta debajo
 * @param {boolean}  [p.tachadas] cada carta con su aspa (no suman)
 * @param {number}   [p.suma]     la suma al lado
 * @param {number[]} [p.gris]     los multiplicadores apagados, en `mults`
 */
export default function MuestraCartas({ tipo, cartas = [], valores = false, tachadas = false, suma = null, gris = [] }) {
  // En `cartas`, el tamaño por la cuenta; `--n`, las columnas de la fila (la suma ocupa una);
  // de seis cartas arriba, en vertical van en dos filas (`muestra--dos-filas`).
  const tam = tipo === 'cartas' ? tamanoMuestra(cartas.length) : null
  const clase = tam ? ` muestra--${tam}${cartas.length > 5 ? ' muestra--dos-filas' : ''}` : ''
  const estilo = tam === 'chica' ? { '--n': cartas.length + (suma !== null ? 1 : 0) } : undefined
  return createPortal(
    <div className={`muestra muestra--${tipo}${clase}`} style={estilo} data-muestra={tipo} data-tamano={tam ?? undefined} aria-hidden="true">
      {tipo === 'cartas' && (
        <div className="muestra-fila">
          {cartas.map((id) => (
            <span key={id} className={`muestra-carta${tachadas ? ' es-tachada' : ''}`}>
              <PlayingCard card={carta(id)} />
              {valores && <span className="muestra-valor">{puntos(id)}</span>}
            </span>
          ))}
          {suma !== null && <span className="win-score-chip muestra-suma">{suma}</span>}
        </div>
      )}
      {tipo === 'empate' && (
        <div className="muestra-empate">
          <Jugador nombre={t('tut.muestra.tu')} mano cartas={['1-Oros', '11-Oros', '6-Oros']} />
          <Jugador nombre={t('tut.muestra.rival')} cartas={['12-Copas', '5-Copas', '7-Copas']} />
        </div>
      )}
      {tipo === 'mults' && (
        <div className="mult-row muestra-mults">
          {[1, 2, 5, 10].map((k) => (
            <button key={k} type="button" tabIndex={-1} className="btn btn-mult" disabled={gris.includes(k)}>×{k}</button>
          ))}
        </div>
      )}
      {tipo === 'allin' && (
        <div className="action-buttons muestra-acciones">
          <button type="button" tabIndex={-1} className="btn btn-call btn-allin">{t('ia.mesa.allin', { hc: montoTexto(3000) })}</button>
          <button type="button" tabIndex={-1} className="btn btn-fold">{t('mesa.retirarse')}</button>
        </div>
      )}
      {tipo === 'pozos' && (
        <div className="muestra-pozos">
          <Pozo etiqueta={t('mesa.pozo')} monto={1500} />
          <Pozo etiqueta={t('tut.muestra.pozo2')} monto={800} />
        </div>
      )}
      {tipo === 'sobrante' && (
        <div className="muestra-pozos">
          <Pozo etiqueta={t('mesa.pozo')} monto={1000} />
          <Pozo etiqueta={t('tut.muestra.vuelve')} monto={500} mas />
        </div>
      )}
    </div>,
    document.body,
  )
}

function Jugador({ nombre, mano = false, cartas }) {
  const total = cartas.reduce((s, id) => s + puntos(id), 0)
  return (
    <div className="muestra-jugador">
      <span className="muestra-nombre">
        {nombre}
        {mano && <span className="seat-badge seat-badge-gold">{t('tut.muestra.mano')}</span>}
      </span>
      <span className="muestra-fila">
        {cartas.map((id) => <span key={id} className="muestra-carta"><PlayingCard card={carta(id)} /></span>)}
      </span>
      <span className="win-score-chip muestra-suma">{total}</span>
    </div>
  )
}

function Pozo({ etiqueta, monto, mas = false }) {
  return (
    <div className="pot-box muestra-pozo">
      <span className="pot-label">{etiqueta}</span>
      <strong className="pot-value"><ChipToken size="compact" />{mas ? `+${montoTexto(monto)}` : montoTexto(monto)}</strong>
    </div>
  )
}
