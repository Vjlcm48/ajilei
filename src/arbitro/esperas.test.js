// ── MOT-1 1b §5.6 · Las esperas y el ritmo ──────────────────────────────────
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resetRng, setRng } from '../engine/deck.js'
import { PHASES } from '../engine/gameEngine.js'
import {
  ANTES_DEL_REPARTO_MS, BARAJADO_MS, FACTOR_RAPIDA, FIN_SEGUNDO_REPARTO_MS, MANO_SIGUIENTE_MS, REVELACION_MS,
  TRAS_PRIMER_REPARTO_MS, TURN_TIME, VOLTEOS_SEGUNDO_REPARTO_MS, VOLTEO_SORTEO_MS, VUELO_REPARTO_MS,
} from '../config/esperas.js'
import { FACTOR_RAPIDA as FACTOR_DE_SU_SITIO } from '../lib/partidaRapida.js'
import {
  CLASES, ESPERA_REPARTO_SORTEO_MS, aplicarAccion, crearPartida, esperaManoSiguiente, esperaPrimerReparto, esperaSegundoReparto,
} from './index.js'

const SILLAS = [0, 1, 2].map((asiento) => ({ asiento, uid: `u${asiento}` }))

const pasos = (e, n) => {
  let x = e
  for (let i = 0; i < n; i++) {
    x = aplicarAccion(x, { uid: 'u0', version: x.version, accion: 'reclamar_vencimiento' }, { ahora: x.vencimiento.hora }).estado
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
  const e = pasos(crearPartida({ apuesta: 100, entrada: 'corta', ritmo }, SILLAS, 0), 1)
  const cartas = e.sorteo.cartas.map((c, i) => c.map((k) => ({ ...k, value: i === 0 ? 12 : 2 })))
  return pasos({ ...e, sorteo: { ...e.sorteo, cartas } }, 1)
}

const duracion = (e) => e.vencimiento.hora

beforeEach(() => { let n = 0; setRng(() => ((n += 0.37) % 1)) })
afterEach(() => resetRng())

describe('MOT-1 1b · las esperas y el ritmo', () => {
  it('el ritmo rápido escala el vuelo y las esperas del segundo reparto, y nada más', () => {
    expect(esperaPrimerReparto(6, 'normal')).toBe(120 + 6 * 595 + 400)
    expect(esperaPrimerReparto(6, 'rapido')).toBe(120 + 3 * 595 + 400)
    expect(esperaSegundoReparto(9, 'normal')).toBe(120 + 9 * 595 + 2000)
    expect(esperaSegundoReparto(9, 'rapido')).toBe(Math.round(120 + 9 * 297.5 + 1000))
    expect(esperaManoSiguiente(true)).toBe(960 + 4000)
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

  it('el sorteo va por oleadas y siempre rápido: la espera no depende del ritmo ni de los asientos', () => {
    expect(ESPERA_REPARTO_SORTEO_MS).toBe(Math.round(120 + 5 * 595 * FACTOR_RAPIDA + 400))
    for (const ritmo of ['normal', 'rapido']) {
      for (const n of [2, 3, 4, 5]) {
        const sillas = Array.from({ length: n }, (_, asiento) => ({ asiento, uid: `u${asiento}` }))
        expect(duracion(crearPartida({ apuesta: 100, entrada: 'corta', ritmo }, sillas, 0))).toBe(ESPERA_REPARTO_SORTEO_MS)
      }
    }
  })

  it('las provisionales: 3 s de volteo y 4 s de pausa', () => {
    expect(VOLTEO_SORTEO_MS).toBe(3000)
    expect(MANO_SIGUIENTE_MS).toBe(4000)
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

    const coreo = /const REVEAL_CHOREO = \{\s*FLIP_MS: (\d+),[^\n]*\s*STAGGER_MS: (\d+),[^\n]*\s*SCALE_MS: (\d+),[^\n]*\s*GROW_AT: ([\d.]+)/.exec(mesa)
    const [flip, stagger, scale, grow] = coreo.slice(1).map(Number)
    const giro = flip + 4 * stagger
    expect(giro + Math.round(scale * grow) + scale + giro).toBe(REVELACION_MS)
  })
})
