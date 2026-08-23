import '../styles/tableSelect.css'
import { SoundButton } from './SoundButton'
import { STAKE_OPTIONS } from '../config/ajileiConfig'

export default function TableSelect({ onSelect, onBack }) {
  return (
    <main className="table-select-screen">
      <section className="table-select-card">
        <h2 className="select-title">Elige tu sala</h2>
        <p className="select-subtitle">Heptacoins de entrada por jugador</p>

        <div className="select-divider" aria-hidden="true" />

        <div className="stake-grid">
          {STAKE_OPTIONS.map((stake, idx) => (
            <SoundButton
              key={stake}
              className="stake-btn"
              onClick={() => onSelect(stake)}
              style={{ animationDelay: `${100 + idx * 70}ms` }}
            >
              <span className="stake-amount">{stake}</span>
              <span className="stake-label">Heptacoins</span>
            </SoundButton>
          ))}
        </div>

        <SoundButton className="back-btn" onClick={onBack}>
          ← Volver
        </SoundButton>
      </section>
    </main>
  )
}
