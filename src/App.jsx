import { useState, useEffect } from 'react'
// ── LOB-1 · `Lobby` releva a `WelcomeScreen` en la casilla de `COMPLETO` ─────
// `components/WelcomeScreen.jsx` sigue en el árbol —borrar es otra tanda, igual
// que con `TableSelect` y `Entrada`— pero deja de importarse desde aquí, así que
// deja de renderizarse y pasa a ser código muerto declarado.
import Lobby from './screens/Lobby'
import NivelSelect from './components/NivelSelect'
import ModeSelect from './components/ModeSelect'
import GameTable from './components/GameTable'
import Portada from './screens/Portada'
import Bautizo from './screens/Bautizo'
import { readNivel, writeNivel } from './hooks/useNivel'
// `AUTH_BYPASS` sale del import con LOB-1: su único consumidor aquí era
// `cuentaLobby`, que protegía a la Bienvenida y se retiró con ella. La constante
// sigue viva y exportada en el hook, que es donde trabaja.
import { useAuth, CARGANDO, SIN_SESION, SESION_SIN_PERFIL } from './hooks/useAuth'
import { precargarSonidos, SONIDOS_MESA } from './hooks/useSounds'
import { precargarBaraja } from './lib/precargaBaraja'
// SAL-A · La invitación por enlace. Sólo se RECUERDA aquí; consumirla es SAL-B.
import { recogerDeLaUrl } from './config/salaPendiente'

// ── NIV-UI · Recorrido del lobby ─────────────────────────────────────────────
// Rector: docs/AJILEI_Modos_y_Asistencia_v1.0.md §4.1.
//   [Lobby] "Jugar contra la IA" → (1) dificultad → (2) mesa + apuesta → [Mesa]
// La pantalla de apuesta deja de existir como paso propio: se integró en la de
// mesa. `TableSelect` queda fuera del recorrido y sin usar; NO se borra en esta
// tanda —borrar es otra tanda— y su hoja de estilo sigue siendo la fuente del
// look de las tarjetas de apuesta a pantalla completa.
//
// ── LOB-1 · La Bienvenida sale del recorrido ────────────────────────────────
// Rector: AJILEI_LOB1_Fase1_v1.1.md §4. `screens/Lobby.jsx` ocupa la MISMA
// casilla que ocupaba `WelcomeScreen`: el destino de `COMPLETO`, que en este
// archivo no es un `return` con nombre sino la caída de la cascada. Ni la forma
// de la cascada ni el contrato de arranque de partida cambian.
//
// El único valor de `screen` que se movió es `'welcome'` → `'lobby'`, y se
// recablearon sus cuatro consumidores: el estado inicial, las dos guardas de la
// precarga y el `onBack` de `NivelSelect`. El nombre viejo no sobrevive en
// ninguna parte de `src/`.
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
  const [screen, setScreen] = useState('lobby') // 'lobby' | 'nivel-select' | 'mode-select' | 'table'
  const [stake, setStake] = useState(null)
  const [playerCount, setPlayerCount] = useState(2)
  // La preferencia se lee UNA vez al arrancar. Preselecciona la pantalla de
  // dificultad y jamás la salta (v1.0 §4.2): `screen` arranca en 'lobby' y el
  // único camino a la mesa pasa por elegir, aunque ya haya un nivel recordado.
  const [nivel, setNivel] = useState(() => readNivel())

  // ── SAL-A · La invitación se recoge ANTES de la puerta ────────────────────
  // Rector: AJILEI_SALA_Fase1_v1.0.md §4.3. Un `?sala=AJ7K2M` compartido por
  // WhatsApp puede caer en alguien que todavía no tiene cuenta, y este proyecto
  // no admite invitados (Fase 0 §1.6: `anonymous_users` es `false`). Sin esta
  // línea, el código muere en la Portada y el jugador llega al lobby sin saber
  // a qué venía.
  //
  // VA AQUÍ ARRIBA, ANTES DE LAS TRES GUARDAS DE SESIÓN, y no dentro de la rama
  // de `COMPLETO`: el efecto se declara con los demás hooks —el orden de llamada
  // tiene que ser el mismo en los cuatro estados— y se dispara aunque el render
  // haya devuelto `null` por `CARGANDO` o la Portada por `SIN_SESION`. Que
  // ocurra un fotograma después del primer pintado no importa: lo que se está
  // haciendo es guardar, y nadie lee la memoria hasta el otro lado de la puerta.
  //
  // AQUÍ SÓLO SE RECUERDA. Unirse a la sala al llegar a `COMPLETO` es de SAL-B,
  // que es cuando existen las pantallas que pueden enseñar el resultado.
  useEffect(() => { recogerDeLaUrl() }, [])

  // ── PUE-1.2 · La mesa precarga sus efectos al ENCAMINARSE a la mesa ────────
  // Desde esta campaña los `Howl` nacen perezosos: en la puerta no baja un solo
  // byte de audio de juego (era el hallazgo de la Fase 0 — 525,7 KiB de 706,2).
  // El precio de aplazar es que la primera reproducción llegaría tarde, así que
  // quien va a necesitarlos los pide antes.
  //
  // Y se piden aquí, al salir del lobby, en vez de al montar la mesa: el
  // recorrido dificultad → mesa+apuesta son varios segundos de margen, y el
  // primer `cardDeal` cae a los pocos fotogramas de que la mesa exista. Pedirlos
  // en `GameTable` sería llegar a la vez que el reparto.
  // No pinta nada y no toca el layout: Δ=0 en las tres pantallas del lobby.
  //
  // LOB-1 · La guarda dice `!== 'lobby'` y no `!== 'welcome'`, y ese cambio de
  // nombre es lo único que hacía falta: `Lobby` entra en la MISMA casilla que
  // ocupaba la Bienvenida —no delante de ella—, así que el instante de la
  // precarga es el mismo que antes de esta campaña. Si el lobby hubiera nacido
  // como un `screen` NUEVO por delante de `'welcome'`, esta línea habría
  // disparado 380 KiB de audio y 0,57 MB de baraja al entrar al lobby, que es
  // exactamente lo que PUE-1.2 y CAR-1 sacaron del arranque.
  useEffect(() => {
    if (screen !== 'lobby') precargarSonidos(SONIDOS_MESA)
    // CAR-1 §3.2 · y la baraja con ellos, por la misma razón y en el mismo
    // momento: 0,57 MB de WebP contra los 24,28 MB de PNG que ya no viajan.
    if (screen !== 'lobby') precargarBaraja()
  }, [screen])

  // CARGANDO no pinta: pinta NADA. El fondo del documento ya es el verde abismo
  // (welcome.css:1-6), así que el hueco de uno o dos fotogramas se ve como la
  // app arrancando y no como una pantalla que va y viene. Un spinner aquí sería
  // peor: parpadearía en el 99% de los arranques, que resuelven de inmediato.
  if (auth.estado === CARGANDO) return null

  // ── PUE · `SIN_SESION` deja de ser la Entrada y pasa a ser la PORTADA ──────
  // El contrato NO cambia: las mismas dos funciones, el mismo estado, el mismo
  // sitio en la cascada. Lo que cambia es la cara. `screens/Entrada.jsx` sigue
  // en el árbol —borrar es otra tanda— y comparte con la portada el MISMO
  // formulario, extraído a `components/FormularioPuerta.jsx`.
  if (auth.estado === SIN_SESION) {
    return <Portada onEnviarCodigo={auth.enviarCodigo} onVerificar={auth.verificarCodigo} />
  }

  if (auth.estado === SESION_SIN_PERFIL) {
    return <Bautizo onConfirmar={auth.crearPerfil} onCerrarSesion={auth.cerrarSesion} />
  }

  // ── El paquete de cuenta que baja a las pantallas ──────────────────────────
  // Se arma aquí y no en cada consumidor porque `useAuth` se llama UNA sola vez
  // (ver la cabecera del hook). Con el bypass activo el nombre es "DevLocal" y
  // las dos acciones responden diciendo que no hay cuenta real detrás — el hook
  // las corta antes de tocar la red.
  //
  // LOB-1 · Entra `correo`. La hoja ⚙ del lobby enseña con QUÉ cuenta se entró,
  // enmascarado (`c•••@gmail.com`), y `useAuth` ya lo devolvía sin que nadie lo
  // consumiera. Es un campo más en el mismo paquete: `GameTable`, que recibe
  // este mismo objeto, no se entera. Con el bypass es `null` y la línea del
  // correo se apaga reservando su caja (O1), en vez de desaparecer.
  // SAL-A · Entra `id`, y es el campo sin el cual no hay PvP. La Fase 0 §3.3
  // encontró el hueco: `useAuth` guarda el `uid` para sí (`useAuth.js:119`) y no
  // lo devuelve, pero el perfil se consulta con `.select('id, username')`, así
  // que `auth.perfil.id` ES el `auth.users.id`. Es el uuid que las salas usan
  // como `anfitrion_id` y `jugador_id` — nunca el username, que es rótulo
  // mutable (doctrina de SUP-2a: «el nombre es rótulo; el ID es contrato»).
  //
  // Con el bypass de desarrollo vale el uuid ficticio de `PERFIL_DEV`, que jamás
  // viaja a la red. De ahí que el modo del arnés que mida contra Supabase NO
  // pueda correr con bypass: ese uuid no existe en la base y cualquier clave
  // foránea lo rechaza.
  //
  // Es un campo más en el mismo paquete: `GameTable`, que recibe este objeto, no
  // se entera.
  const cuenta = {
    id: auth.perfil?.id ?? null,
    username: auth.perfil?.username ?? '',
    correo: auth.correo ?? '',
    cambiarNombre: auth.cambiarNombre,
    cerrarSesion: auth.cerrarSesion,
  }

  // ── LOB-1 · `cuentaLobby` se retira ────────────────────────────────────────
  // Existía para un trato concreto: que el bypass apagara el acceso de cuenta de
  // la BIENVENIDA y sólo ése, para que los arneses la vieran byte-idéntica. Esa
  // pantalla ya no se renderiza, así que la excepción protegía a un ausente.
  //
  // El lobby recibe la cuenta SIEMPRE, también con bypass, y por dos razones: su
  // bloque de perfil es parte de la cara que Victor selló —un lobby sin nombre no
  // es el lobby de la lámina— y el arnés tiene que poder medirlo. Lo que en el
  // bypass no hay es correo, y para eso está la reserva de caja de O1.

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
        onBack={() => setScreen('lobby')}
      />
    )
  }

  // La caída de la cascada sigue siendo el destino de `COMPLETO`. Tres props y
  // ninguna más: el lobby no conoce `screen`, ni Supabase, ni la mesa.
  return (
    <Lobby
      cuenta={cuenta}
      onJugarIA={() => setScreen('nivel-select')}
      onCerrarSesion={auth.cerrarSesion}
    />
  )
}

export default App
