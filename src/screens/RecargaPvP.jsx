import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import BurbujaRecarga from '../components/BurbujaRecarga'
import { SoundButton } from '../components/SoundButton'
import { RECARGA } from '../hooks/mesaCore'
import { MOTIVOS } from '../arbitro/motivos.js'
import { t } from '../config/textos'
import { aPropios, escalaActual } from '../lib/escala'
import { RECARGA_PVP, recargaDeVista, textoTarjeta } from '../lib/entreManosCore'
import { CORTE_VOZ, recortaNombre } from '../lib/corteVoz'
import heptacoinUrl from '../assets/heptacoin.svg?no-inline'

// ── MES-PvP L-M 3 · §1 · La recarga PvP ─────────────────────────────
// Reglas de APU-1 v1.9 §8.1 y las decisiones de Victor en el STOP-L. Árbitro v1.3-b: lee la VISTA
// del árbitro (la del imitado tiene su misma forma) con `recargaDeVista`, el saldo de la billetera
// y manda `recargar` · `pedir_recarga` · `anular_recarga` por `foto.enviar`. Lo único de la lámina
// (`lamina`, solo con el imitado, detrás de la puerta DEV): la tarjeta abierta al llegar, el anillo
// congelado y el saldo de la escena. El molde es la burbuja
// de REC-1 (§5.5), sin tocar la de las IAS: el mismo componente y las mismas clases, montados
// encima de la mesa, `fixed` y en portal a `.game-table-screen` (Δ = 0 de layout).
//   · Ofrecida (quebraste): la burbuja con el triángulo en la ranura de las acciones, al terminar
//     la revelación; un toque abre la tarjeta. Sentado fuera, la burbuja va sobre la fila de tus
//     cartas, que está vacía, y la caja de las acciones dice «Fuera de esta mano».
//   · Voluntaria (pila bajo la entrada): la moneda del ⋮ (variante b). En la pausa abre la tarjeta
//     y recarga en el acto; durante la mano, la tarjeta la deja PEDIDA y se aplica en la pausa
//     siguiente (si la pila ya no está por debajo de la entrada, el pedido se cancela solo).
//     Pedida, la moneda lleva su marca y otro toque la anula. Sentado fuera, «Recargar» también la
//     deja pedida (P-6): el dinero nunca se mueve dentro de una mano.
//   · «Ahora no» solo cierra la tarjeta (P-2): la oferta sigue hasta su plazo.
//   · El pedido cancelado por saldo abre la tarjeta una vez por cancelación; un `recargar` rechazado
//     con `saldo_insuficiente` la deja abierta y relee la billetera, y entonces dice que no alcanza.
//   · La tarjeta: «… para seguir en la mesa» con la pila en 0; «… para volver a {entrada} HC» con
//     pila; sin saldo, lo dice y no hay tienda (INV-76).
//   · La retención (sin quien decide quedaría uno solo): «Esperando a {nombre}…» en la caja de las
//     acciones.
// Túnel del v1.3 (Victor):
//   · Un solo anillo para quien decide y va a ser retenido: desde que aparece la burbuja hasta el
//     final real (`recargaDeVista`, `retencion`); la cuenta nunca sube cuando llega la hora real
//     de la retención, que cae unos rtt/2 después de la prevista. En la pausa de anuncio, sin anillo.

const caja = (sel) => {
  const el = document.querySelector(sel)
  return el && el.offsetWidth > 0 ? aPropios(el.getBoundingClientRect(), escalaActual()) : null
}

// Dónde va la burbuja (o el texto): el centro de la ranura de las acciones de la barra propia o,
// sentado fuera, el de la fila de cartas.
function anclaDe(fuera) {
  const fila = fuera ? caja('.game-table-screen .player-zone .cards-row') : null
  if (fila) return { x: fila.left + fila.width / 2, y: fila.top + fila.height / 2 }
  const barra = caja('.game-table-screen .player-bar')
  const centro = caja('.game-table-screen .player-bar-center')
  if (!barra) return null
  return { x: centro ? centro.left + centro.width / 2 : barra.left + barra.width / 2, y: barra.top + barra.height / 2 }
}

// La tarjeta abierta vale para el momento en que se abrió: al cambiar de mano, de pausa a mano o
// al sentarse fuera, se cierra sola.
const momentoDe = (rec) => `${rec.mano}:${rec.pausa}:${rec.fuera}`

/**
 * @param {{ foto: object, saldo: number, lamina?: object|null, desfase?: number, alRecargar?: Function|null }} props
 *   `foto` la de la mesa (`useMesaPvP`: `vista`, `game`, `enviar`); `saldo` el de la billetera;
 *   `alRecargar` relee la billetera.
 */
export default function RecargaPvP({ foto, saldo, lamina = null, desfase = 0, alRecargar = null }) {
  const entrada = foto.game?.players[0]?.entrada ?? 0
  const rec = recargaDeVista(foto.vista, { saldo: lamina?.saldo?.() ?? saldo, entrada })
  const [ahora, setAhora] = useState(() => Date.now())
  const [ancla, setAncla] = useState(null)
  const [tope, setTope] = useState(null)   // { mano, seg }: lo último que contó el anillo único
  const [panel, setPanel] = useState(null)
  const [disparador, setDisparador] = useState(null)
  const [abiertaEn, setAbiertaEn] = useState(() => (lamina?.abierta && rec ? momentoDe(rec) : null))
  // La última cancelación por saldo que ya se enseñó (y se cerró).
  const [acusada, setAcusada] = useState(null)

  // Un reloj de 250 ms: el anillo, el ancla y el ⋮ (que se abre y se cierra por su cuenta).
  useEffect(() => {
    const tic = () => {
      setAhora(Date.now())
      setAncla(anclaDe(!!rec?.fuera))
      setPanel(document.querySelector('.game-table-screen .utilities-panel'))
      setDisparador(caja('.game-table-screen .utilities-trigger'))
    }
    const id = setInterval(tic, 250)
    const primero = requestAnimationFrame(tic)
    return () => { clearInterval(id); cancelAnimationFrame(primero) }
  }, [rec?.fuera])

  const raiz = document.querySelector('.game-table-screen')
  if (!rec || !raiz) return null
  const { oferta } = rec
  const abierta = !!oferta && (abiertaEn === momentoDe(rec) || (rec.cancelada !== null && rec.cancelada !== acusada))
  const fija = lamina?.fija ?? null
  const restaMs = rec.vence === null ? null : rec.vence - (ahora + desfase)
  const restaPausaMs = rec.finPausa === null ? null : rec.finPausa - (ahora + desfase)
  const ofrecida = oferta?.tipo === RECARGA_PVP.OFRECIDA
  // §5.5.1 · al terminar la revelación (queda la lectura); sin revelación, en el acto.
  const trasRevelacion = fija !== null || !rec.revelacion || (restaPausaMs !== null && restaPausaMs <= rec.lecturaMs)
  const total = rec.revelacion && !rec.retencion ? Math.round(rec.lecturaMs / 1000) : rec.totalSeg
  const cuenta = fija ?? (restaMs === null ? null : Math.max(0, Math.ceil(restaMs / 1000)))
  // El anillo único no sube: si la hora real de la retención cae después de la prevista, se
  // queda en lo último que contó hasta que la cuenta real lo alcanza.
  let seg = cuenta
  if (rec.retencion && fija === null && cuenta !== null) {
    if (tope?.mano === rec.mano && tope.seg < cuenta) seg = tope.seg
    else if (tope?.mano !== rec.mano || tope.seg !== cuenta) setTope({ mano: rec.mano, seg: cuenta })
  }
  const verBurbuja = ofrecida && !abierta && (rec.fuera || (rec.pausa && trasRevelacion))
  const espera = !oferta ? rec.espera : null
  const estilo = ancla ? { left: ancla.x, top: ancla.y } : { visibility: 'hidden' }

  const abrir = () => setAbiertaEn(momentoDe(rec))
  const cerrar = () => { setAbiertaEn(null); setAcusada(rec.cancelada) }
  const mandar = async (accion) => {
    const r = await foto.enviar(accion, { mano: rec.mano })
    if (r?.ok || r?.motivo === MOTIVOS.YA_PEDIDA) {
      cerrar()
      if (accion === 'recargar') alRecargar?.()
    } else if (r?.motivo === MOTIVOS.SALDO_INSUFICIENTE) {
      // La tarjeta sigue abierta: con el saldo releído dirá que no alcanza.
      alRecargar?.()
    }
  }
  const partida = {
    abrir,
    cerrar,
    recargar: () => mandar('recargar'),
    pedir: () => mandar('pedir_recarga'),
    anular: () => mandar('anular_recarga'),
  }

  // La moneda del ⋮: viva con una voluntaria (en la pausa o en la mano) o con un pedido que anular.
  const cerrarMenu = () => document.querySelector('.game-table-screen .utilities-trigger')?.click()
  const voluntaria = !!oferta && !ofrecida
  const tocarMoneda = () => {
    cerrarMenu()
    if (rec.pedida) partida.anular()
    else partida.abrir()
  }
  // En la mano, «Recargar» la deja pedida (sentado fuera también, en el árbitro); en la pausa,
  // recarga en el acto.
  const confirmar = rec.enMano ? partida.pedir : partida.recargar

  return (
    <>
      {createPortal(
        <>
          {verBurbuja && (
            <div className="pvp-rec-ancla" data-pvp-recarga="burbuja" data-fuera={rec.fuera ? '1' : '0'} data-anillo={rec.anillo ? '1' : '0'} style={estilo}>
              <BurbujaRecarga
                motivo={RECARGA.FORZOSA}
                seg={rec.fuera ? total : seg ?? total}
                total={total}
                onAbrir={partida.abrir}
              />
            </div>
          )}
          {espera && (
            <div className="pvp-rec-ancla pvp-rec-espera" data-pvp-recarga="espera" style={estilo}>
              {t('pvp.recarga.espera', { nombre: recortaNombre(espera, CORTE_VOZ) })}
            </div>
          )}
          {/* Pedida: un punto dorado sobre el ⋮ cerrado, para que no se olvide. */}
          {rec.pedida && disparador && (
            <span className="pvp-rec-punto" data-pvp-recarga="punto" aria-hidden="true"
              style={{ left: disparador.right - 4, top: disparador.top + 4 }} />
          )}
          {abierta && (
            <div className="bankrupt-overlay apu-suave pvp-rec-tarjeta" data-accion="recarga" data-pvp-recarga="tarjeta" data-tipo={oferta.tipo} data-en-mano={rec.enMano ? '1' : '0'}>
              <div className="bankrupt-modal apu-recarga">
                <p className="bankrupt-sub" data-accion="recarga-sub">{textoTarjeta(oferta)}</p>
                <div className="bankrupt-actions">
                  {oferta.alcanza && (
                    <SoundButton className="btn btn-primary" data-accion="recarga-si" onClick={confirmar}>
                      {t('ia.recarga.pedir')}
                    </SoundButton>
                  )}
                  <SoundButton className="btn btn-pass" data-accion="recarga-no" onClick={partida.cerrar}>
                    {t('pvp.recarga.no')}
                  </SoundButton>
                </div>
              </div>
            </div>
          )}
        </>,
        raiz,
      )}
      {/* La entrada del ⋮: al final del panel, como sus hermanas (solo el icono). */}
      {panel && createPortal(
        <button
          type="button"
          role="menuitem"
          className={`util-item util-item-recarga${voluntaria || rec.pedida ? '' : ' is-disabled'}${rec.pedida ? ' es-pedida' : ''}`}
          data-pvp-recarga="menu"
          data-pedida={rec.pedida ? '1' : '0'}
          disabled={!voluntaria && !rec.pedida}
          title={t(rec.pedida ? 'pvp.recarga.anular' : 'ia.recarga.pedir')}
          aria-label={t(rec.pedida ? 'pvp.recarga.anular' : 'ia.recarga.pedir')}
          onClick={tocarMoneda}
        >
          <span className="util-ico" aria-hidden="true">
            <img src={heptacoinUrl} alt="" width="20" height="20" draggable="false" />
          </span>
          {rec.pedida && <span className="pvp-rec-pedida" aria-hidden="true">✓</span>}
        </button>,
        panel,
      )}
    </>
  )
}
