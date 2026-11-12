// ── MES-PvP 5a · A3 · El panel de `?medir=arranque` ─────────────────────────
// Solo de desarrollo: `PartidaPvP` lo pide con un `import()` dentro de `import.meta.env.DEV`.
// Pinta las marcas de `medirArranque` en ms desde la primera, y lo que sale de ellas:
// cuándo nació el barajado del sorteo en la hora del servidor, pasado a la de este teléfono con el
// `desfase`, y cuánto de él se había ido al primer cuadro con mesa y al llegar la vista real.
// No recibe toques: es para la captura de pantalla.
import { useEffect, useSyncExternalStore } from 'react'
import { BARAJADO_MS } from '../config/esperas'
import { inicioDeEtapa } from '../lib/sorteoMesaCore'
import { escucharArranque, leerArranque } from './medirArranque'

const CAJA = {
  position: 'fixed', top: 4, left: 4, zIndex: 9999, pointerEvents: 'none',
  font: '11px/1.35 ui-monospace, monospace', color: '#fff', background: 'rgba(0,0,0,0.72)',
  padding: '6px 8px', borderRadius: 6, whiteSpace: 'pre',
}

// La hora local en que nació el barajado, si la primera vista es del sorteo.
function naceDelBarajado(primeraVista, desfase) {
  const v = primeraVista?.vencimiento
  if (!v) return null
  const inicio = inicioDeEtapa(v, primeraVista.participan)
  if (inicio === null) return null
  const atras = { barajado_sorteo: 0, reparto_sorteo: BARAJADO_MS }[v.clase]
  return atras === undefined ? null : inicio - atras - desfase
}

function lineasDelArranque({ registro, primeraVista, sillas }, desfase) {
  if (registro.length === 0) return []
  const cero = registro[0].hora
  const en = (n) => registro.find((m) => m.nombre === n)?.hora ?? null
  const ms = (h) => (h === null ? '—' : `${Math.round(h - cero)}`)
  const nace = naceDelBarajado(primeraVista, desfase)
  const perdido = (n) => (nace === null || en(n) === null ? '—' : `${Math.round(en(n) - nace)}`)
  return [
    ...registro.map((m) => [m.nombre, ms(m.hora)]),
    ['barajado nace', ms(nace)],
    ['perdido · mesa-1', perdido('mesa-1')],
    ['perdido · vista-1', perdido('vista-1')],
    ['desfase', `${desfase}`],
    ['1.ª vista', primeraVista?.vencimiento?.clase ?? '—'],
    // La silla de la sala (la del anfitrión es la 0) y el asiento real del árbitro; el mazo del
    // sorteo va en el asiento real 0, contado desde el propio (0 = el tuyo).
    ['silla anfitrión·tuya', sillas ? `${sillas.anfitrion ?? '—'}·${sillas.propia ?? '—'}` : '—'],
    ['asiento real·mazo', primeraVista?.n ? `${primeraVista.asiento}·${(primeraVista.n - primeraVista.asiento) % primeraVista.n}` : '—'],
  ]
}

export default function PanelArranque({ desfase = 0 }) {
  const estado = useSyncExternalStore(escucharArranque, leerArranque)
  const lineas = lineasDelArranque(estado, desfase)
  const completo = lineas.some(([n]) => n === 'vista-1') && lineas.some(([n]) => n === 'mesa-1')
  useEffect(() => {
    if (completo) console.table(Object.fromEntries(lineas.map(([n, v]) => [n, { ms: v }])))
    // Una tabla por arranque: cuando se completa, no con cada cambio del desfase.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [completo, estado])
  if (lineas.length === 0) return null
  const ancho = Math.max(...lineas.map(([n]) => n.length))
  return (
    <div style={CAJA} data-medir="arranque" aria-hidden="true">
      {['arranque (ms)', ...lineas.map(([n, v]) => `${n.padEnd(ancho)}  ${v.padStart(6)}`)].join('\n')}
    </div>
  )
}
