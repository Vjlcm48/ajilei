import { lazy, useEffect, useMemo, useRef, useState } from 'react'
import PantallaDiferida from '../components/PantallaDiferida'
import GuiaControl from '../components/GuiaControl'
import CierreGuiada from './CierreGuiada'
import { sumarTextos } from '../config/textos'
import { TEXTOS_TUT_COMUNES, TEXTOS_TUT_GUIADA } from '../config/textos.tut.es'
import { armarOrden, soltarMazo } from '../lib/mazoDado'
import { ORDENES, MANOS, APUESTA, ASIENTOS, NIVEL, estadoInicial, decidirRival } from '../lib/guiaManos'
import { fabricaMesa, trozoMesa } from '../lib/cargarMesa'

// La mesa, por su trozo (INV-29, ARN-3d): nadie la importa de forma estática. Con la precarga
// del lobby ya llegó y `PantallaDiferida` la pinta en el mismo render.
const GameTable = lazy(fabricaMesa)

// ── GUI-1 · La partida guiada ────────────────────────────────────────────────
// Rector: AJILEI_TUT-1_T2_v1.0.md §1.3 y §1.4; normativo AJILEI_Tutorial_v1.3.md
// §1. Pantalla diferida (INV-84, `lib/trozos.guiada`): la entrada sólo lleva la
// rama de `App` y el `onClick` del lobby; esto, la capa y sus textos viajan aquí.
//
// LA MESA ES LA DE SIEMPRE, SIN SERVIDOR. `GameTable` con `guion` y sin
// `control`, `apiRanking` ni `apiConsulta`: no pasa por `retar` ni por
// `sentarse_ia`, no cobra entrada, no mueve el saldo, no da puntos, no avisa
// pila (excepción escrita a INV-47; la vigila `diagDSK tut`, puerta
// `tut.guiada`). Tres manos con mazo dado; los rivales, de guion. La ÚNICA
// llamada al servidor de toda la guiada es la del cierre: `cobrar_guiada()`
// (tanda 3, `CierreGuiada`), una vez.
//
// R-2 DE LA FASE 0: EL GUION NUNCA LLEGA A UNA MESA DE VERDAD. Cada mano arma su
// orden justo antes de barajar y el barajado lo consume; aun así, `soltarMazo`
// devuelve el azar de verdad al salir de la mesa por cualquier puerta —«Salir»,
// el cierre, desmontar la pantalla—, se haya consumido o no.
sumarTextos('es', { ...TEXTOS_TUT_COMUNES, ...TEXTOS_TUT_GUIADA })

// TUT-1 T3 · el resto del tutorial viaja en ESTE trozo (`lib/trozos.guiada`): «Cómo se
// juega», la puerta del lobby y las señales de primera vez de la mesa.
export { default as ComoSeJuega } from './ComoSeJuega'
export { default as PuertaGuiada } from '../components/PuertaGuiada'
export { default as SenalesPrimeraVez } from '../components/SenalesPrimeraVez'

export default function Guiada({ onLobby, onJugar, onSaldo }) {
  const [fase, setFase] = useState('mesa')
  // Los de `App` cambian en cada render; el guion es uno para toda la mesa.
  const salidas = useRef({ onLobby, onJugar, onSaldo })
  useEffect(() => { salidas.current = { onLobby, onJugar, onSaldo } })

  useEffect(() => {
    if (fase !== 'mesa') soltarMazo()
    return soltarMazo
  }, [fase])

  // `html[data-guiada]`: la palabra AJILEI de la celebración no se desvanece en la mesa
  // guiada (`guiada.css`, `GuiaControl`). Sólo mientras la mesa está montada.
  useEffect(() => {
    if (fase !== 'mesa') return undefined
    const html = document.documentElement
    html.setAttribute('data-guiada', '')
    return () => html.removeAttribute('data-guiada')
  }, [fase])

  const guion = useMemo(() => ({
    manos: MANOS,
    estadoInicial,
    // La mano que va a empezar es la siguiente a la del estado previo.
    armar: (previo) => { const orden = ORDENES[previo.handCount]; if (orden) armarOrden(orden) },
    decidir: decidirRival,
    Control: GuiaControl,
    alTerminar: () => setFase('cierre'),
    alSalir: () => { soltarMazo(); salidas.current.onLobby?.() },
  }), [])

  if (fase === 'cierre') {
    return (
      <CierreGuiada onSaldo={(saldo) => salidas.current.onSaldo?.(saldo)}
        onJugar={() => salidas.current.onJugar?.()} onLobby={() => salidas.current.onLobby?.()} />
    )
  }
  return (
    <PantallaDiferida trozo={trozoMesa} familia="abismo">
      <GameTable
        stake={APUESTA}
        numPlayers={ASIENTOS}
        nivel={NIVEL}
        guion={guion}
        onLeave={() => guion.alSalir()}
      />
    </PantallaDiferida>
  )
}
