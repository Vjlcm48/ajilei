// VIS-1 · `?cel=derrota`: el estado terminal del motor, y el decisor no celebra.
import { afterEach, describe, expect, it, vi } from 'vitest'
import { PHASES, createInitialState } from '../engine/gameEngine'
import { decideCelebracion } from '../hooks/celebracionCore'
import { siembraCEL } from './siembraCEL'

const conUrl = (search) => vi.stubGlobal('window', { location: { search } })
const mesa = () => createInitialState(100, 3)

afterEach(() => vi.unstubAllGlobals())

describe('siembraCEL', () => {
  it('sin el parámetro, el estado es el mismo', () => {
    conUrl('')
    const e = mesa()
    expect(siembraCEL(e)).toBe(e)
  })

  it('`?cel` deja a los rivales sin fichas y al humano con las suyas (la victoria)', () => {
    conUrl('?cel')
    const e = mesa()
    const s = siembraCEL(e)
    expect(s.phase).toBe(e.phase)
    expect(s.players[0].chips).toBe(e.players[0].chips)
    expect(s.players.slice(1).every((p) => p.chips === 0)).toBe(true)
  })

  it('`?cel=derrota` nace en GAME_OVER, con la IA 1 de ganadora y el humano eliminado', () => {
    conUrl('?cel=derrota')
    const e = mesa()
    const s = siembraCEL(e)
    expect(s.phase).toBe(PHASES.GAME_OVER)
    expect(s.winner).toBe(1)
    expect(s.players[0]).toMatchObject({ chips: 0, eliminated: true })
    expect(s.players[1].chips).toBe(e.players[1].chips)
    expect(s.players[1].eliminated).toBe(false)
    expect(decideCelebracion({ phase: s.phase, winner: s.winner, humanCards: s.players[0].cards, ruleN: s.handRules?.ruleN })).toBeNull()
  })
})
