import { useEffect, useMemo, useState, useSyncExternalStore } from 'react'
import { createPortal } from 'react-dom'
import '../styles/video.css'

import HojaMonedas from './HojaMonedas'
import CapaVideo from './CapaVideo'
import GuardandoVideo from './GuardandoVideo'
import SinVideo from './SinVideo'
import CelebracionVideo from './CelebracionVideo'
import { VideoContext } from '../hooks/useVideo'
import { useIdioma } from '../hooks/useIdioma'
import { contadorDe, sinVideosHoy, tocaReleer } from '../hooks/videoCore'
import { FASES_CONTROL } from '../lib/controlVideo'
import { AJILEI_CONFIG } from '../config/ajileiConfig'

// ── ECO-1g · El marco del video de recompensa ───────────────────────────────
// Rector: AJILEI_ECO-1_Fase1g_v1.0.md §2.2 («se monta una vez cerca de App») y
// el plan aprobado del STOP-1 §3. `App` es una cascada de `return`, así que
// envuelve con ESTE marco cada pantalla que lleva `BarraSuperior` (el lobby,
// Retar, y las cuatro de salas). La forma del árbol es la misma en todas, y por
// eso el marco —y con él la hoja, la capa y la celebración— NO se desmonta al
// pasar de una a otra. La mesa no se envuelve (G3: en la mesa no hay video).
//
// QUÉ HACE: se suscribe al canal (`lib/controlVideo`) y a la costura
// (`lib/reproductor`), pinta lo que toque y deja en el contexto lo que las
// pantallas necesitan (`hooks/useVideo`). No decide nada: las reglas están en
// `hooks/videoCore` y el recorrido en el canal.
//
// LAS CAPAS VAN EN <body> (portal), como la cápsula del aviso de saldo: son
// `position: fixed`, y un antecesor con `transform` las anclaría a él.
//
// P-4 (rector) · si una sala arranca con un video abierto, la capa sigue
// encima. Queda anotado en el registro para MES-PvP.

const ESPEJO = AJILEI_CONFIG.economy

export default function MarcoVideo({ control, avisoEnCurso = false, children }) {
  const { t } = useIdioma()
  const foto = useSyncExternalStore(control.suscribir, control.leer)
  const sesion = useSyncExternalStore(control.reproductor.suscribir, control.reproductor.leer)
  // Lo que la celebración le dicta a la píldora: `{ id, cifra, brilla }`.
  const [pintura, setPintura] = useState(null)
  // «Vuelven en…» baja con el reloj: un tic cada 30 s mientras está a la vista.
  const [tic, setTic] = useState(0)

  const apagado = sinVideosHoy(foto.estado)
  useEffect(() => {
    if (!apagado) return undefined
    const id = setInterval(() => {
      const ahora = Date.now()
      setTic(ahora)
      // Pasó la medianoche de Chicago: el servidor dirá que vuelven a ser 8.
      if (tocaReleer(control.leer().estado, ahora)) control.mirar()
    }, 30000)
    return () => clearInterval(id)
  }, [apagado, control])

  // Al entrar en la mesa el marco se va: lo que sólo era pintura se recoge.
  useEffect(() => () => control.recoger(), [control])

  // El premio y el tope LOS DICE EL SERVIDOR; el espejo, sólo mientras no ha
  // contestado.
  const premio = foto.estado?.premio ?? ESPEJO.videoReward
  const tope = foto.estado?.tope ?? ESPEJO.maxVideosPerDay
  const c = contadorDe(foto.estado, Math.max(foto.en, tic))
  const contador = c === null ? null
    : c.tiempo ? t(c.clave, { tiempo: t(c.tiempo.clave, c.tiempo.vars) }) : t(c.clave, c.vars)

  const ocupado = foto.fase !== null || foto.cel !== null
  const cel = foto.cel
  const cifra = cel ? (pintura?.id === cel.id ? pintura.cifra : cel.desde) : null
  const brilla = cel !== null && pintura?.id === cel.id && pintura.brilla === true

  const valor = useMemo(() => ({
    abrirHoja: control.abrirHoja,
    pedir: control.pedir,
    mirar: control.mirar,
    premio,
    contador,
    apagado,
    ocupado,
    pildora: cifra === null ? null : { cifra, brilla },
  }), [control, premio, contador, apagado, ocupado, cifra, brilla])

  return (
    <VideoContext.Provider value={valor}>
      {children}
      {createPortal(
        <div className="vid-raiz">
          {foto.hoja && (
            <HojaMonedas
              contador={contador}
              apagada={apagado}
              premio={premio}
              onCerrar={control.cerrarHoja}
              onVideo={control.pedir}
            />
          )}
          {sesion && <CapaVideo key={sesion.id} reproductor={control.reproductor} sesion={sesion} premio={premio} />}
          {foto.fase === FASES_CONTROL.COBRANDO && (
            <GuardandoVideo premio={premio} salible={foto.salible} onSalir={control.salirDelCobro} />
          )}
          {foto.fase === FASES_CONTROL.SIN && <SinVideo total={tope} onVolver={control.cerrarSin} />}
          {/* Si hay un aviso de saldo en curso, espera a que termine: nunca los
              dos a la vez sobre la píldora. */}
          {cel && !avisoEnCurso && (
            <CelebracionVideo key={cel.id} cel={cel} contador={contador} onPildora={setPintura} onFin={control.finCelebracion} />
          )}
        </div>,
        document.body,
      )}
    </VideoContext.Provider>
  )
}
