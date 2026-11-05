import { useEffect, useMemo, useSyncExternalStore } from 'react'
import { crearClientePartida } from '../lib/partidaCliente'
import { supabase } from '../lib/supabase'
import { creaMesaPvP } from './mesaPvPCore'

// ── MES-PvP 2 · El enganche de la mesa contra personas ──────────────────────
// Envoltorio sin decisiones: todo lo que decide está en `mesaPvPCore`, que es lo que se
// prueba. `partida` se pasa para jugar con el árbitro imitado (`dev/partidaImitada`).
export function useMesaPvP({ sala, partida = null, alCobrar = null }) {
  const nucleo = useMemo(() => creaMesaPvP({
    partida: partida ?? crearClientePartida({ cliente: supabase, mesa: sala.id }),
    sala,
  }), [partida, sala])

  useEffect(() => {
    nucleo.iniciar()
    return () => nucleo.parar()
  }, [nucleo])

  useEffect(() => {
    nucleo.alCobrar(alCobrar)
    return () => nucleo.alCobrar(null)
  }, [nucleo, alCobrar])

  return useSyncExternalStore(nucleo.suscribir, nucleo.foto, nucleo.foto)
}
