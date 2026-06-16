import '../styles/modeSelect.css'
import { SoundButton } from './SoundButton'
import BalanceDisplay from './BalanceDisplay'
import { STAKE_OPTIONS, AJILEI_CONFIG } from '../config/ajileiConfig'

// Diseñar conforme a docs/AJILEI_Sistema_Diseno_v1.2.md.
// El comodín (7 de Oros) está activo solo en mesas de 4 y 5 jugadores.
const TABLE_MODES = [
  { players: 2, opponents: '1 IA',  comodin: false },
  { players: 3, opponents: '2 IAs', comodin: false },
  { players: 4, opponents: '3 IAs', comodin: true  },
  { players: 5, opponents: '4 IAs', comodin: true  },
]

const STAKE_MIN = STAKE_OPTIONS[0]
const STAKE_MAX = STAKE_OPTIONS[STAKE_OPTIONS.length - 1]

export default function ModeSelect({ onSelectMode, onBack }) {
  return (
    <main className="mode-select-screen">
      <section className="mode-select-card">
        <div className="mode-balance" title="Tu saldo">
          <span className="mode-balance-label">Saldo</span>
          <span className="mode-balance-value">
            <BalanceDisplay chips={AJILEI_CONFIG.economy.saldoInicial} /> fichas
          </span>
        </div>

        <h2 className="mode-select-title">Elige tu mesa</h2>
        <p className="mode-select-sub">Entrada de {STAKE_MIN} a {STAKE_MAX} fichas · la eliges en el siguiente paso</p>

        <svg className="mode-star-arc" viewBox="0 0 200 65" aria-hidden="true">
          <defs>
            <polygon id="ms5" points="0,-4.5 1.06,-1.46 4.28,-1.39 1.71,0.56 2.65,3.64 0,1.8 -2.65,3.64 -1.71,0.56 -4.28,-1.39 -1.06,-1.46" />
          </defs>
          <path d="M 10,56 Q 100,28 190,56" fill="none" stroke="#003893" strokeWidth="1.2" strokeOpacity="0.38" />
          {[[10,56],[35.7,49.1],[61.5,44.6],[87.2,42.3],[112.7,42.3],[138.5,44.6],[164.2,49.1],[190,56]].map(([x,y],i) => (
            <use key={i} href="#ms5" transform={`translate(${x},${y})`} fill="#f5edd8" opacity="0.88" />
          ))}
        </svg>

        <div className="mode-grid">
          {TABLE_MODES.map(({ players, opponents, comodin }, idx) => (
            <div
              key={players}
              className="mode-option"
              style={{ animationDelay: `${100 + idx * 70}ms` }}
            >
              <SoundButton
                className="mode-btn mode-btn-enabled"
                onClick={() => onSelectMode(players)}
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

        <SoundButton className="back-btn" onClick={onBack}>
          ← Volver
        </SoundButton>
      </section>
    </main>
  )
}
