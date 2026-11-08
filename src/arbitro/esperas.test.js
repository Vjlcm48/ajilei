// ── MOT-1 1b §5.6 · Las esperas y el ritmo ──────────────────────────────────
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resetRng, setRng } from '../engine/deck.js'
import { PHASES } from '../engine/gameEngine.js'
import {
  ANTES_DEL_REPARTO_MS, AUSENTE_DESDE, AVISO_SALIDA_MS, BARAJADO_MS, FACTOR_RAPIDA, FIN_SEGUNDO_REPARTO_MS,
  LECTURA_TRAS_REVELACION_MS, MANO_SIGUIENTE_MS, N_AUSENCIA, PAUSA_ANUNCIO_MS, RED_REVELACION_MS, REPOSICION_SIN_CARTAS_MS,
  TRAS_PRIMER_REPARTO_MS, TURN_TIME, VOLTEOS_SEGUNDO_REPARTO_MS, VOLTEO_SORTEO_MS, VUELO_REPARTO_MS,
} from '../config/esperas.js'
import { FACTOR_RAPIDA as FACTOR_DE_SU_SITIO } from '../lib/partidaRapida.js'
import {
  CLASES, aplicarAccion, crearPartida, esperaManoSiguiente, esperaPrimerReparto, esperaRepartoSorteo, esperaReposicion,
  esperaSegundoReparto, llevaAnuncio,
} from './index.js'
import { esperaRepartoSorteo as deLaCapa } from '../lib/sorteoMesaCore.js'

const SILLAS = [0, 1, 2].map((asiento) => ({ asiento, uid: `u${asiento}` }))

const pasos = (e, n) => {
  let x = e
  for (let i = 0; i < n; i++) {
    x = aplicarAccion(x, { uid: 'u0', version: x.version, accion: 'reclamar_vencimiento' }, { ahora: x.vencimiento.hora }).estado
    // Avanzar por reloj no debe abandonar a nadie: estas pruebas no van de la ausencia.
    x = { ...x, asientos: x.asientos.map((a) => ({ ...a, vencidos: 0 })) }
  }
  return x
}

// Lo que dura el vencimiento que abrió `e`: `pasos` reclama justo a la hora.
const dura = (e) => {
  const sig = pasos(e, 1)
  return sig.vencimiento.hora - e.vencimiento.hora
}

// Del arranque hasta el volteo de la primera ronda, con un ganador claro.
function hastaVolteo(ritmo) {
  const e = pasos(crearPartida({ apuesta: 100, entrada: 'corta', ritmo }, SILLAS, 0), 2)
  const cartas = e.sorteo.cartas.map((c, i) => c.map((k) => ({ ...k, value: i === 0 ? 12 : 2 })))
  return pasos({ ...e, sorteo: { ...e.sorteo, cartas } }, 1)
}

beforeEach(() => { let n = 0; setRng(() => ((n += 0.37) % 1)) })
afterEach(() => resetRng())

describe('MOT-1 1b · las esperas y el ritmo', () => {
  it('el ritmo rápido escala el vuelo y las esperas del segundo reparto, y nada más', () => {
    expect(esperaPrimerReparto(6, 'normal')).toBe(120 + 6 * 595 + 400)
    expect(esperaPrimerReparto(6, 'rapido')).toBe(120 + 3 * 595 + 400)
    expect(esperaSegundoReparto(9, 'normal')).toBe(120 + 9 * 595 + 2000)
    expect(esperaSegundoReparto(9, 'rapido')).toBe(Math.round(120 + 9 * 297.5 + 1000))
    expect(esperaManoSiguiente(true)).toBe(6000 + 2000)
    expect(esperaManoSiguiente(false)).toBe(4000)
  })

  it('el barajado, el turno y el descarte son iguales en los dos ritmos', () => {
    for (const ritmo of ['normal', 'rapido']) {
      const volteo = hastaVolteo(ritmo)
      expect(volteo.vencimiento.clase).toBe(CLASES.VOLTEO_SORTEO)
      expect(dura(volteo)).toBe(BARAJADO_MS)
      const barajado = pasos(volteo, 1)
      expect(barajado.vencimiento.clase).toBe(CLASES.BARAJADO)
      expect(dura(barajado)).toBe(esperaPrimerReparto(6, ritmo))
      const reparto = pasos(barajado, 1)
      expect(reparto.vencimiento.clase).toBe(CLASES.REPARTO)
      expect(dura(reparto)).toBe(TURN_TIME * 1000)
      const antesDelDescarte = pasos(reparto, 7)
      expect(antesDelDescarte.motor.phase).toBe(PHASES.BET_2)
      expect(dura(antesDelDescarte)).toBe(TURN_TIME * 1000)
      const descarte = pasos(antesDelDescarte, 1)
      expect(descarte.motor.phase).toBe(PHASES.DISCARD)
      expect(descarte.vencimiento.clase).toBe(CLASES.DESCARTE)
      expect(descarte.vencimiento.hora - antesDelDescarte.vencimiento.hora).toBe(TURN_TIME * 1000)
    }
  })

  // Árbitro v1.3 · de una en una y siempre en Rápido: la espera depende de cuántos participan,
  // y es la misma cifra que pinta la capa (una sola fuente, `config/esperas.js`).
  it('v1.3 · el reparto del sorteo dura según los participantes, en los dos ritmos', () => {
    expect([2, 3, 4, 5].map(esperaRepartoSorteo)).toEqual([3495, 4983, 6470, 7958])
    expect(esperaRepartoSorteo(3)).toBe(Math.round(120 + 5 * 3 * 595 * FACTOR_RAPIDA + 400))
    expect(deLaCapa).toBe(esperaRepartoSorteo)
    for (const ritmo of ['normal', 'rapido']) {
      for (const n of [2, 3, 4, 5]) {
        const sillas = Array.from({ length: n }, (_, asiento) => ({ asiento, uid: `u${asiento}` }))
        const partida = crearPartida({ apuesta: 100, entrada: 'corta', ritmo }, sillas, 0)
        expect(partida.vencimiento).toEqual({ clase: CLASES.BARAJADO_SORTEO, hora: BARAJADO_MS })
        expect(dura(partida)).toBe(esperaRepartoSorteo(n))
      }
    }
  })

  it('las cifras nuevas: reposición, aviso, pausa y ausencia', () => {
    expect(VOLTEO_SORTEO_MS).toBe(5000)
    expect(MANO_SIGUIENTE_MS).toBe(4000)
    expect(LECTURA_TRAS_REVELACION_MS).toBe(2000)
    expect(AVISO_SALIDA_MS).toBe(3000)
    expect(PAUSA_ANUNCIO_MS).toBe(45000)
    expect(N_AUSENCIA).toBe(3)
    expect(AUSENTE_DESDE).toBe(2)
    expect(esperaReposicion(0)).toBe(REPOSICION_SIN_CARTAS_MS)
    expect(REPOSICION_SIN_CARTAS_MS).toBe(600)
    expect(esperaReposicion(5)).toBe(120 + 5 * 595 + 400)
  })

  it('el anuncio va en las manos 5, 11, 16, 22, 27, 33, 38 y 44', () => {
    const con = Array.from({ length: 45 }, (_, i) => i + 1).filter(llevaAnuncio)
    expect(con).toEqual([5, 11, 16, 22, 27, 33, 38, 44])
  })

  it('las cifras son las que mide hoy la mesa, y el factor no se duplica', () => {
    const mesa = readFileSync(new URL('../components/GameTable.jsx', import.meta.url), 'utf8')
    expect(FACTOR_RAPIDA).toBe(FACTOR_DE_SU_SITIO)
    expect(TURN_TIME).toBe(20)
    expect(mesa).toContain("import { TURN_TIME } from '../config/esperas'")
    expect(mesa).not.toMatch(/const TURN_TIME\b/)
    expect(mesa).toContain(`const VUELO_REPARTO_S = ${VUELO_REPARTO_MS / 1000}`)
    expect(mesa).toMatch(new RegExp(`\\}, ${BARAJADO_MS}\\)`))
    expect(mesa).toMatch(new RegExp(`dealStep === 0 \\? ${ANTES_DEL_REPARTO_MS} : 0`))
    expect(mesa).toMatch(new RegExp(`\\}, ${TRAS_PRIMER_REPARTO_MS}\\)`))
    expect(mesa).toMatch(new RegExp(`\\}, ${FIN_SEGUNDO_REPARTO_MS} \\* k\\)`))
    VOLTEOS_SEGUNDO_REPARTO_MS.forEach((ms, i) => {
      expect(mesa).toContain(`revealDeal3(${i + 2}), ${ms} * k)`)
    })

    const nucleoMesa = readFileSync(new URL('../hooks/mesaCore.js', import.meta.url), 'utf8')
    expect(nucleoMesa).toContain(`export const RED_REVELACION_MS = ${RED_REVELACION_MS}`)
  })
})
