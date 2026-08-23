import '../styles/nivelSelect.css'
import { SoundButton } from './SoundButton'
import { NIVELES } from '../config/niveles'

// ── NIV-UI · Pantalla 1: selección de dificultad ─────────────────────────────
// Documento rector: docs/AJILEI_Modos_y_Asistencia_v1.0.md §4.
// Es el primer paso tras "Jugar vs IA" y responde una sola pregunta —CONTRA
// QUIÉN JUEGO—, distinta de la que responde la pantalla siguiente (qué
// arriesgo). Esa frontera semántica es D-3, y es la razón de que sean dos
// pantallas y no una.
//
// Los tres niveles van SIEMPRE VISIBLES: sin desbloqueos, sin puertas por
// mérito, Pro disponible desde el minuto cero (v1.0 §4.2). Un nivel que no se
// ve no se elige, y la escalera existe para verse entera desde el primer día.
// La barrera de entrada a Pro es su tabla de apuestas, no un candado.
//
// `preseleccionado` llega ya normalizado (nivelCore). Marca la opción; NO salta
// la pantalla — esa es la regla dura de la v1.0 §4.2.
export default function NivelSelect({ preseleccionado, onSelect, onBack }) {
  return (
    <main className="nivel-select-screen">
      <section className="nivel-select-card">
        <h2 className="nivel-select-title">Elige tu reto</h2>
        <p className="nivel-select-sub">¿Contra quién quieres jugar?</p>

        <div className="select-divider" aria-hidden="true" />

        <div className="nivel-grid">
          {NIVELES.map(({ id, nombre, descripcion, apuestas }, idx) => {
            const esPre = id === preseleccionado
            return (
              <SoundButton
                key={id}
                className={`nivel-btn${esPre ? ' nivel-btn-pre' : ''}`}
                onClick={() => onSelect(id)}
                style={{ animationDelay: `${100 + idx * 70}ms` }}
                aria-label={`${nombre}. ${descripcion}. Entradas desde ${apuestas[0]} Heptacoins`}
              >
                <span className="nivel-btn-head">
                  <span className="nivel-btn-nombre">{nombre}</span>
                  {esPre && <span className="nivel-chip-ultimo">Tu último</span>}
                </span>
                <span className="nivel-btn-desc">{descripcion}</span>
                {/* El rango sale de la tabla del nivel, nunca de un literal:
                    config/niveles.js es la fuente única (v1.0 §3.3). */}
                <span className="nivel-btn-rango">
                  Entradas de {apuestas[0]} a {apuestas[apuestas.length - 1]} Heptacoins
                </span>
              </SoundButton>
            )
          })}
        </div>

        <SoundButton className="back-btn" onClick={onBack}>
          ← Volver
        </SoundButton>
      </section>
    </main>
  )
}
