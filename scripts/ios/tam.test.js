// ── ARN-4d · la matriz de `tam` cuenta lo que tenía que haber ────────────────
// La línea base dijo `matriz ✓` con 282 de 301 celdas: un clic agotó sus 30 s a media
// pasada y las 19 que faltaban no llegaron a existir.
import { describe, it, expect } from 'vitest'
import { celdasSinMedir, ESTADOS_MATRIZ, TAMANOS_MATRIZ } from './tam.mjs'

const todas = () => ESTADOS_MATRIZ.flatMap((estado) => TAMANOS_MATRIZ.map((t) => ({ estado, tam: t.id, medida: true })))

describe('ARN-4d · celdasSinMedir', () => {
  it('la matriz de hoy son 301 celdas, y enteras no falta ninguna', () => {
    expect(todas()).toHaveLength(301)
    expect(celdasSinMedir(todas(), TAMANOS_MATRIZ, ESTADOS_MATRIZ)).toEqual([])
  })
  it('control rojo: las celdas perdidas a media pasada se ven', () => {
    const sinRetar = todas().filter((c) => !(c.estado === 'retar' && TAMANOS_MATRIZ.findIndex((t) => t.id === c.tam) >= 24))
    expect(sinRetar).toHaveLength(282)
    const falta = celdasSinMedir(sinRetar, TAMANOS_MATRIZ, ESTADOS_MATRIZ)
    expect(falta).toHaveLength(19)
    expect(falta.every((n) => n.startsWith('retar '))).toBe(true)
  })
  it('una celda que nació sin llegar a su estado tampoco cuenta', () => {
    const c = todas()
    c[0].medida = false
    expect(celdasSinMedir(c, TAMANOS_MATRIZ, ESTADOS_MATRIZ)).toEqual([`${c[0].estado} ${c[0].tam}`])
  })
})
