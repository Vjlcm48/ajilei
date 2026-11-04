// ── ARN-4d · el camino crítico sin navegador ─────────────────────────────────
import { describe, it, expect } from 'vitest'
import { Buffer } from 'node:buffer'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { dentroDelTecho, importsEstaticos, instrumentosCoinciden, pesarDist, pesoEnCable, rutasDelHtml } from './pesoCore.mjs'

describe('ARN-4d · lo que pide el HTML', () => {
  const html = `<!-- <script src="/comentado.js"></script> -->
    <link rel="icon" href="/icons/i.svg" />
    <link rel="manifest" href="/manifest.webmanifest" />
    <link rel="apple-touch-icon" href="/icons/a.png" />
    <script type="module" crossorigin src="/assets/index.js"></script>
    <link rel="modulepreload" href="/assets/vendor.js">
    <link rel="stylesheet" crossorigin href="/assets/index.css">`
  it('cuenta scripts, hojas, precargas e icono; no el manifest, ni lo comentado', () => {
    expect(rutasDelHtml(html).sort()).toEqual(['/assets/index.css', '/assets/index.js', '/assets/vendor.js', '/icons/i.svg'])
  })
})

describe('ARN-4d · los imports', () => {
  it('sigue los estáticos, con y sin nombres', () => {
    expect(importsEstaticos('import{a as b}from"./x-1.js";import"./y-2.js";import * as z from "./z-3.js"')).toEqual(['x-1.js', 'y-2.js', 'z-3.js'])
  })
  it('un import dinámico no viaja antes de pintar (la mesa, INV-30)', () => {
    expect(importsEstaticos('const m=()=>import("./GameTable-9.js")')).toEqual([])
  })
})

describe('ARN-4d · el peso', () => {
  it('lo que ya nace comprimido no se vuelve a comprimir', () => {
    const b = Buffer.alloc(5000, 'a')
    expect(pesoEnCable('/assets/x.webp', b)).toBe(5000)
    expect(pesoEnCable('/assets/x.js', b)).toBeLessThan(100)
  })
  it('el techo es 200 KiB, y justo 200 cabe', () => {
    expect(dentroDelTecho(200 * 1024)).toBe(true)
    expect(dentroDelTecho(200 * 1024 + 1)).toBe(false)
  })

  const conDist = (fn, { imagenes = true } = {}) => {
    const d = mkdtempSync(join(tmpdir(), 'peso-'))
    try {
      mkdirSync(join(d, 'assets'))
      writeFileSync(join(d, 'index.html'), '<script type="module" src="/assets/e.js"></script><link rel="stylesheet" href="/assets/e.css">')
      writeFileSync(join(d, 'assets/e.js'), 'import"./c.js";const m=()=>import("./perezoso.js")')
      writeFileSync(join(d, 'assets/c.js'), 'x')
      writeFileSync(join(d, 'assets/perezoso.js'), 'y'.repeat(500000))
      writeFileSync(join(d, 'assets/e.css'), 'a{}')
      if (imagenes) for (const n of ['ajilei-isotipo-1.svg', 'reverso_carta-2.svg']) writeFileSync(join(d, 'assets', n), '<svg/>')
      return fn(d)
    } finally {
      rmSync(d, { recursive: true, force: true })
    }
  }
  it('pesa el camino: el trozo estático entra y el perezoso no', () => {
    conDist((d) => {
      const { recursos, porTipo, cable } = pesarDist(d)
      expect(recursos.map((r) => r.ruta).sort()).toEqual(['/', '/assets/ajilei-isotipo-1.svg', '/assets/c.js', '/assets/e.css', '/assets/e.js', '/assets/reverso_carta-2.svg'])
      expect(cable).toBe(Object.values(porTipo).reduce((a, b) => a + b, 0))
    })
  })
  it('una imagen de la lista que ya no está es error de instrumento, no un verde', () => {
    conDist((d) => { expect(() => pesarDist(d)).toThrow(/ajilei-isotipo/) }, { imagenes: false })
  })
  it('sin compilar es error de instrumento', () => {
    expect(() => pesarDist(join(tmpdir(), 'no-existe-este-dist'))).toThrow(/¿Se compiló\?/)
  })
})

describe('PES-1 §3-G · 1.8f: el navegador y `peso` dicen lo mismo', () => {
  it('coinciden por debajo de 1 KiB (el ruido medido en la Fase 0 es cero)', () => {
    expect(instrumentosCoinciden(241220, 241220)).toBe(true)
    expect(instrumentosCoinciden(241220, 241220 + 1023)).toBe(true)
    expect(instrumentosCoinciden(241220 + 1023, 241220)).toBe(true)
  })
  it('CONTROL ROJO · 1 KiB o más de diferencia, en cualquier sentido, es rojo', () => {
    expect(instrumentosCoinciden(241220, 241220 + 1024)).toBe(false)
    expect(instrumentosCoinciden(241220 + 1024, 241220)).toBe(false)
    expect(instrumentosCoinciden(241220, 0)).toBe(false)
  })
})
