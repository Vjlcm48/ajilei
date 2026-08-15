import { useState } from 'react'
import WelcomeScreen from './components/WelcomeScreen'
import NivelSelect from './components/NivelSelect'
import ModeSelect from './components/ModeSelect'
import GameTable from './components/GameTable'
import { readNivel, writeNivel } from './hooks/useNivel'

// ── NIV-UI · Recorrido del lobby ─────────────────────────────────────────────
// Rector: docs/AJILEI_Modos_y_Asistencia_v1.0.md §4.1.
//   [Bienvenida] "Jugar vs IA" → (1) dificultad → (2) mesa + apuesta → [Mesa]
// La pantalla de apuesta deja de existir como paso propio: se integró en la de
// mesa. `TableSelect` queda fuera del recorrido y sin usar; NO se borra en esta
// tanda —borrar es otra tanda— y su hoja de estilo sigue siendo la fuente del
// look de las tarjetas de apuesta a pantalla completa.
//
// El paso de pantallas se mantiene con el MISMO patrón que ya usaba el
// proyecto: un `screen` en estado local, sin router. No se reorganizan rutas
// porque no hay rutas que reorganizar.
function App() {
  const [screen, setScreen] = useState('welcome') // 'welcome' | 'nivel-select' | 'mode-select' | 'table'
  const [stake, setStake] = useState(null)
  const [playerCount, setPlayerCount] = useState(2)
  // La preferencia se lee UNA vez al arrancar. Preselecciona la pantalla de
  // dificultad y jamás la salta (v1.0 §4.2): `screen` arranca en 'welcome' y el
  // único camino a la mesa pasa por elegir, aunque ya haya un nivel recordado.
  const [nivel, setNivel] = useState(() => readNivel())

  if (screen === 'table') {
    return (
      <GameTable
        stake={stake}
        numPlayers={playerCount}
        nivel={nivel}
        onLeave={() => setScreen('mode-select')}
      />
    )
  }

  if (screen === 'mode-select') {
    return (
      <ModeSelect
        nivel={nivel}
        onSelectMode={(players, monto) => {
          setPlayerCount(players)
          setStake(monto)
          setScreen('table')
        }}
        onBack={() => setScreen('nivel-select')}
      />
    )
  }

  if (screen === 'nivel-select') {
    return (
      <NivelSelect
        preseleccionado={nivel}
        onSelect={(id) => { setNivel(id); writeNivel(id); setScreen('mode-select') }}
        onBack={() => setScreen('welcome')}
      />
    )
  }

  return <WelcomeScreen onSelectMode={() => setScreen('nivel-select')} />
}

export default App
