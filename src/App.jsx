import { useState, useEffect } from 'react'
import WelcomeScreen from './components/WelcomeScreen'
import NivelSelect from './components/NivelSelect'
import ModeSelect from './components/ModeSelect'
import GameTable from './components/GameTable'
import Entrada from './screens/Entrada'
import Bautizo from './screens/Bautizo'
import { readNivel, writeNivel } from './hooks/useNivel'
import { useAuth, AUTH_BYPASS, CARGANDO, SIN_SESION, SESION_SIN_PERFIL } from './hooks/useAuth'
import { precargarSonidos, SONIDOS_MESA } from './hooks/useSounds'

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
//
// ── SUP-2b · La puerta ──────────────────────────────────────────────────────
// Rector: docs/AJILEI_SUP-2b_Puerta_v1.0.md §1.1, con la adenda de OK de Fase 1
// que sitúa la puerta EXACTAMENTE aquí: delante del primer `if`.
//
// Es una interposición, no una reescritura. El recorrido del lobby de arriba no
// se toca: en `COMPLETO` el control cae al mismo `screen` de siempre y la
// decisión menú-vs-mesa queda byte a byte como estaba. Lo único que esta tanda
// añade por delante son dos retornos tempranos y una nada.
//
// POR QUÉ AQUÍ Y NO EN UN ROUTER. No hay router que interponer, y meter uno para
// esto habría sido reorganizar el recorrido entero para colgar de él dos
// pantallas. El patrón de la casa es un estado y una cascada de `if`; la puerta
// habla ese idioma.
function App() {
  // Los hooks van todos ARRIBA y ninguno detrás de un retorno: el orden de
  // llamada tiene que ser el mismo en los cuatro estados de sesión. Es la razón
  // por la que `useAuth` abre la función y los `useState` del lobby se declaran
  // aunque la puerta esté a punto de devolver otra pantalla.
  const auth = useAuth()
  const [screen, setScreen] = useState('welcome') // 'welcome' | 'nivel-select' | 'mode-select' | 'table'
  const [stake, setStake] = useState(null)
  const [playerCount, setPlayerCount] = useState(2)
  // La preferencia se lee UNA vez al arrancar. Preselecciona la pantalla de
  // dificultad y jamás la salta (v1.0 §4.2): `screen` arranca en 'welcome' y el
  // único camino a la mesa pasa por elegir, aunque ya haya un nivel recordado.
  const [nivel, setNivel] = useState(() => readNivel())

  // ── PUE-1.2 · La mesa precarga sus efectos al ENCAMINARSE a la mesa ────────
  // Desde esta campaña los `Howl` nacen perezosos: en la puerta no baja un solo
  // byte de audio de juego (era el hallazgo de la Fase 0 — 525,7 KiB de 706,2).
  // El precio de aplazar es que la primera reproducción llegaría tarde, así que
  // quien va a necesitarlos los pide antes.
  //
  // Y se piden aquí, al salir de la Bienvenida, en vez de al montar la mesa: el
  // recorrido dificultad → mesa+apuesta son varios segundos de margen, y el
  // primer `cardDeal` cae a los pocos fotogramas de que la mesa exista. Pedirlos
  // en `GameTable` sería llegar a la vez que el reparto.
  // No pinta nada y no toca el layout: Δ=0 en las tres pantallas del lobby.
  useEffect(() => {
    if (screen !== 'welcome') precargarSonidos(SONIDOS_MESA)
  }, [screen])

  // CARGANDO no pinta: pinta NADA. El fondo del documento ya es el verde abismo
  // (welcome.css:1-6), así que el hueco de uno o dos fotogramas se ve como la
  // app arrancando y no como una pantalla que va y viene. Un spinner aquí sería
  // peor: parpadearía en el 99% de los arranques, que resuelven de inmediato.
  if (auth.estado === CARGANDO) return null

  if (auth.estado === SIN_SESION) {
    return <Entrada onEnviarCodigo={auth.enviarCodigo} onVerificar={auth.verificarCodigo} />
  }

  if (auth.estado === SESION_SIN_PERFIL) {
    return <Bautizo onConfirmar={auth.crearPerfil} onCerrarSesion={auth.cerrarSesion} />
  }

  // ── El paquete de cuenta que baja a las pantallas ──────────────────────────
  // Se arma aquí y no en cada consumidor porque `useAuth` se llama UNA sola vez
  // (ver la cabecera del hook). Con el bypass activo el nombre es "DevLocal" y
  // las dos acciones responden diciendo que no hay cuenta real detrás — el hook
  // las corta antes de tocar la red.
  const cuenta = {
    username: auth.perfil?.username ?? '',
    cambiarNombre: auth.cambiarNombre,
    cerrarSesion: auth.cerrarSesion,
  }

  // EL BYPASS APAGA EL ACCESO DE LA BIENVENIDA, Y SÓLO ÉSE. Es lo que la adenda
  // pide con esas palabras, y su razón es una sola: que los 20 arneses vean la
  // Bienvenida byte-idéntica a la de hoy. El ⋮ de la mesa NO entra en ese trato
  // —su entrada "Cuenta" está viva en las dos listas y su panel forma parte de
  // lo que esta tanda tiene que poder medir—, y una entrada viva que no abriera
  // nada sería además una mentira del propio menú.
  const cuentaLobby = AUTH_BYPASS ? null : cuenta

  if (screen === 'table') {
    return (
      <GameTable
        stake={stake}
        numPlayers={playerCount}
        nivel={nivel}
        cuenta={cuenta}
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

  return <WelcomeScreen onSelectMode={() => setScreen('nivel-select')} cuenta={cuentaLobby} />
}

export default App
