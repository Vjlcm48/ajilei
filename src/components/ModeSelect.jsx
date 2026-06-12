import '../styles/modeSelect.css'
import { SoundButton } from './SoundButton'

const TABLE_MODES = [
  { players: 2, title: 'Mesa de 2 jugadores', subtitle: 'Tú vs 1 IA',                   enabled: true  },
  { players: 3, title: 'Mesa de 3 jugadores', subtitle: 'Tú vs 2 IAs',                  enabled: true  },
  { players: 4, title: 'Mesa de 4 jugadores', subtitle: 'Tú vs 3 IAs · Comodín activo', enabled: true  },
  { players: 5, title: 'Mesa de 5 jugadores', subtitle: 'Tú vs 4 IAs · Comodín activo', enabled: true  },
]

export default function ModeSelect({ onSelectMode, onBack }) {
  return (
    <main className="mode-select-screen">
      <section className="mode-select-card">
        <h2 className="mode-select-title">Elige tu mesa</h2>

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
          {TABLE_MODES.map(({ players, title, subtitle, enabled }, idx) => (
            <div
              key={players}
              className="mode-option"
              style={{ animationDelay: `${100 + idx * 70}ms` }}
            >
              <SoundButton
                className={`mode-btn ${enabled ? 'mode-btn-enabled' : 'mode-btn-disabled'}`}
                onClick={enabled ? () => onSelectMode(players) : undefined}
                disabled={!enabled}
              >
                <span className="mode-btn-title">{title}</span>
                <span className="mode-btn-subtitle">{subtitle}</span>
              </SoundButton>
              {!enabled && <span className="soon-tag">Próximamente</span>}
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
