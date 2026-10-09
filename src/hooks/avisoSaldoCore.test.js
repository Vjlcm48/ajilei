import { describe, it, expect } from 'vitest'
import {
  TIEMPOS_AVISO, vidaAviso, cifraAviso, brillaAviso, suenaAviso, avisoDeVuelta,
} from './avisoSaldoCore'

// ── ECO-1c · el aviso de saldo (lámina `laminas/eco1c`, aprobada) ───────────

const A = { desde: 3650, hasta: 5000 }
const { cuentaIni, cuentaDur, brilloDur } = TIEMPOS_AVISO

describe('ECO-1c · el aviso de saldo', () => {
  it('vive entre 3,2 y 4 s según lo largo del texto', () => {
    expect(vidaAviso('+500 HC por tu constancia.')).toBe(3200)
    expect(vidaAviso('x'.repeat(60))).toBe(3700)
    expect(vidaAviso('x'.repeat(200))).toBe(4000)
  })

  it('la píldora cuenta de la cifra vieja a la nueva, y sólo después de empezar', () => {
    expect(cifraAviso(A, 0)).toBe(3650)
    expect(cifraAviso(A, cuentaIni - 1)).toBe(3650)
    const medio = cifraAviso(A, cuentaIni + cuentaDur / 2)
    expect(medio).toBeGreaterThan(3650)
    expect(medio).toBeLessThan(5000)
    expect(cifraAviso(A, cuentaIni + cuentaDur)).toBe(5000)
    expect(cifraAviso(A, 9999)).toBe(5000)
  })

  it('sube siempre: nunca baja a mitad de cuenta', () => {
    let previa = 0
    for (let t = 0; t <= cuentaIni + cuentaDur; t += 16) {
      const c = cifraAviso(A, t)
      expect(c).toBeGreaterThanOrEqual(previa)
      previa = c
    }
  })

  it('con movimiento reducido salta, sin contar ni brillar', () => {
    expect(cifraAviso(A, cuentaIni + 1, true)).toBe(5000)
    expect(brillaAviso(A, cuentaIni + 1, true)).toBe(false)
  })

  it('el brillo dura una vez, desde que empieza la cuenta', () => {
    expect(brillaAviso(A, cuentaIni - 1)).toBe(false)
    expect(brillaAviso(A, cuentaIni)).toBe(true)
    expect(brillaAviso(A, cuentaIni + brilloDur)).toBe(false)
  })

  it('con 0 HC: sólo el texto — sin cuenta, sin brillo y sin sonido', () => {
    const cero = { desde: 3650, hasta: 3650 }
    expect(cifraAviso(cero, 2000)).toBe(3650)
    expect(brillaAviso(cero, cuentaIni + 10)).toBe(false)
    expect(suenaAviso(cero, cuentaIni + 10)).toBe(false)
    expect(suenaAviso(A, cuentaIni)).toBe(true)
  })

  it('el aviso de una mesa que volvió cuenta de saldo − cobrado a saldo, y elige el texto de 0', () => {
    const claves = { conMonto: 'aviso.saldo.recogida', cero: 'aviso.saldo.recogida.cero' }
    expect(avisoDeVuelta({ cobrado: 1350, saldo: 5000 }, claves, 7))
      .toEqual({ id: 7, clave: 'aviso.saldo.recogida', monto: 1350, desde: 3650, hasta: 5000 })
    expect(avisoDeVuelta({ cobrado: 0, saldo: 3650 }, claves, 8))
      .toEqual({ id: 8, clave: 'aviso.saldo.recogida.cero', monto: 0, desde: 3650, hasta: 3650 })
  })
})
