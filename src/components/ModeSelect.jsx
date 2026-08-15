import { useState } from 'react'
import '../styles/modeSelect.css'
import { SoundButton } from './SoundButton'
import BalanceDisplay from './BalanceDisplay'
import { AJILEI_CONFIG } from '../config/ajileiConfig'
import { apuestasDe, nivelPorId } from '../config/niveles'

// Diseñar conforme a docs/AJILEI_Sistema_Diseno_v1.2.md.
// El comodín (7 de Oros) está activo solo en mesas de 4 y 5 jugadores.
const TABLE_MODES = [
  { players: 2, opponents: '1 IA',  comodin: false },
  { players: 3, opponents: '2 IAs', comodin: false },
  { players: 4, opponents: '3 IAs', comodin: true  },
  { players: 5, opponents: '4 IAs', comodin: true  },
]

// ── NIV-UI · Pantalla 2: mesa + apuesta en una sola superficie ───────────────
// Documento rector: docs/AJILEI_Modos_y_Asistencia_v1.0.md §4.1.
// El selector de apuesta deja de ser pantalla propia y se integra aquí. Eso NO
// invierte el orden de decisión de D-3 —dificultad → mesa → monto—: la
// dificultad ya se decidió en la pantalla anterior y manda, porque de ella
// dependen los cuatro montos que aquí se ofrecen; mesa y monto se deciden
// después, en ese orden, sobre una misma superficie porque ambos responden la
// misma pregunta ("qué arriesgo"). La costura entre pantallas cae exactamente
// donde D-3 puso la frontera semántica.
//
// Los montos salen de config/niveles.js según el nivel elegido: `STAKE_OPTIONS`
// ya no se lee aquí. Cambiar de nivel cambia la oferta.
export default function ModeSelect({ nivel, onSelectMode, onBack }) {
  const [mesa, setMesa] = useState(null)   // nº de jugadores, elegido en el paso 1
  const apuestas = apuestasDe(nivel)
  const nivelInfo = nivelPorId(nivel)

  return (
    <main className="mode-select-screen">
      <section className="mode-select-card">
        <div className="mode-balance" title="Tu saldo">
          <span className="mode-balance-label">SALDO:</span>
          <span className="mode-balance-value">
            <BalanceDisplay chips={AJILEI_CONFIG.economy.saldoInicial} /> fichas
          </span>
        </div>

        <h2 className="mode-select-title">Elige tu mesa</h2>
        <p className="mode-select-sub">
          {/* El nivel viaja visible: en esta pantalla el jugador ya no lo elige,
              y sin el rótulo no habría forma de saber por qué la oferta de
              montos es ésta y no otra. */}
          {nivelInfo && <span className="mode-nivel-chip">{nivelInfo.nombre}</span>}
          Entrada de {apuestas[0]} a {apuestas[apuestas.length - 1]} fichas
        </p>

        <svg className="mode-star-arc" viewBox="0 0 200 65" aria-hidden="true">
          <defs>
            <polygon id="ms5" points="0,-4.5 1.06,-1.46 4.28,-1.39 1.71,0.56 2.65,3.64 0,1.8 -2.65,3.64 -1.71,0.56 -4.28,-1.39 -1.06,-1.46" />
          </defs>
          <path d="M 10,56 Q 100,28 190,56" fill="none" stroke="#003893" strokeWidth="1.2" strokeOpacity="0.38" />
          {[[10,56],[35.7,49.1],[61.5,44.6],[87.2,42.3],[112.7,42.3],[138.5,44.6],[164.2,49.1],[190,56]].map(([x,y],i) => (
            <use key={i} href="#ms5" transform={`translate(${x},${y})`} fill="#f5edd8" opacity="0.88" />
          ))}
        </svg>

        {/* Dos pasos, UNA pantalla. La apuesta RELEVA a la mesa en vez de
            apilarse debajo, y no por gusto: cuatro mesas más cuatro montos
            desbordan el presupuesto vertical de un 360×640, y esta pantalla
            hereda `overflow: hidden` (criterio C3.2), así que lo que sobra no
            se scrollea — se pierde. Relevar mantiene los dos pasos sin
            navegación y deja el orden de D-3 —mesa, luego monto— visible en la
            propia superficie. */}
        {mesa === null ? (
          <div className="mode-grid">
            {TABLE_MODES.map(({ players, opponents, comodin }, idx) => (
              <div
                key={players}
                className="mode-option"
                style={{ animationDelay: `${100 + idx * 70}ms` }}
              >
                <SoundButton
                  className="mode-btn mode-btn-enabled"
                  onClick={() => setMesa(players)}
                >
                  <span className="mode-btn-title">Mesa de {players} jugadores</span>
                  <span className="mode-btn-row">
                    <span className="mode-btn-subtitle">Tú vs {opponents}</span>
                    <span className={`comodin-chip${comodin ? ' comodin-chip-on' : ' comodin-chip-off'}`}>
                      {comodin ? 'Comodín activo' : 'Sin comodín'}
                    </span>
                  </span>
                </SoundButton>
              </div>
            ))}
          </div>
        ) : (
          <div className="mode-apuesta">
            <SoundButton
              className="mode-mesa-elegida"
              onClick={() => setMesa(null)}
              aria-label={`Mesa de ${mesa} jugadores elegida. Cambiar de mesa`}
            >
              <span className="mode-mesa-elegida-txt">Mesa de {mesa} jugadores</span>
              <span className="mode-mesa-cambiar">Cambiar</span>
            </SoundButton>

            <p className="mode-apuesta-titulo">¿Con cuánto entras?</p>

            <div className="mode-stake-grid">
              {apuestas.map((monto, idx) => (
                <SoundButton
                  key={monto}
                  className="mode-stake-btn"
                  onClick={() => onSelectMode(mesa, monto)}
                  style={{ animationDelay: `${60 + idx * 50}ms` }}
                >
                  <span className="mode-stake-amount">{monto}</span>
                  <span className="mode-stake-label">fichas</span>
                </SoundButton>
              ))}
            </div>
          </div>
        )}

        <SoundButton className="back-btn" onClick={onBack}>
          ← Volver
        </SoundButton>
      </section>
    </main>
  )
}
