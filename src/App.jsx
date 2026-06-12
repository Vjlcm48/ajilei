import { useState } from 'react'
import WelcomeScreen from './components/WelcomeScreen'
import ModeSelect from './components/ModeSelect'
import TableSelect from './components/TableSelect'
import GameTable from './components/GameTable'

function App() {
  const [screen, setScreen] = useState('welcome') // 'welcome' | 'mode-select' | 'table-select' | 'table'
  const [stake, setStake] = useState(null)
  const [playerCount, setPlayerCount] = useState(2)

  if (screen === 'table') {
    return <GameTable stake={stake} onLeave={() => setScreen('table-select')} />
  }

  if (screen === 'table-select') {
    return (
      <TableSelect
        onSelect={(s) => { setStake(s); setScreen('table') }}
        onBack={() => setScreen('mode-select')}
      />
    )
  }

  if (screen === 'mode-select') {
    return (
      <ModeSelect
        onSelectMode={(players) => { setPlayerCount(players); setScreen('table-select') }}
        onBack={() => setScreen('welcome')}
      />
    )
  }

  return <WelcomeScreen onSelectMode={() => setScreen('mode-select')} />
}

export default App
