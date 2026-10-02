// ── ARN-3a · las decisiones puras del terreno del arnés ──────────────────────
// Rector: AJILEI_ARN-3a_v1.0.md §0. Lo que aquí se sella es lo que el arnés
// DECIDE: qué navegador vale, qué opciones lee y qué código devuelve. Los casos
// de `veredictosDSK` imitan la forma real del JSON de cada modo (ARN-3 Fase 0).
import { describe, it, expect } from 'vitest'
import {
  NAVEGADOR_SELLADO, ETIQUETA_NAVEGADOR, ORDEN_INSTALAR, CODIGO, ErrorInstrumento,
  codigoDeSalida, canalPedido, comprobarVersion, faltaNavegador, leerOpciones, esBanderaComun,
  pidQueEscucha, veredictosDSK, VEREDICTO_DSK, MODOS_DSK,
} from './nucleo.mjs'
import { readFileSync } from 'node:fs'

describe('D1/D2 · el navegador sellado', () => {
  it('es el Chromium que trae la versión FIJADA de playwright-core', () => {
    const pkg = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf8'))
    expect(pkg.devDependencies['playwright-core']).toBe(NAVEGADOR_SELLADO.playwrightCore)
    const navegadores = JSON.parse(readFileSync(new URL('../../node_modules/playwright-core/browsers.json', import.meta.url), 'utf8'))
    expect(navegadores.browsers.find((b) => b.name === 'chromium').browserVersion).toBe(NAVEGADOR_SELLADO.version)
  })
  it('la etiqueta dice canal, versión y playwright-core', () => {
    expect(ETIQUETA_NAVEGADOR).toBe('chromium 151.0.7922.34 (playwright-core 1.62.1)')
  })
  it('D4 · la orden de instalación no baja el headless shell', () => {
    expect(ORDEN_INSTALAR).toContain('install --no-shell chromium')
  })
})

describe('D5 · del veredicto al código de salida', () => {
  it('verde e informativo → 0', () => {
    expect(codigoDeSalida(['verde'])).toBe(0)
    expect(codigoDeSalida(['informativo'])).toBe(0)
    expect(codigoDeSalida(['verde', 'informativo'])).toBe(0)
  })
  it('un solo rojo → 1', () => {
    expect(codigoDeSalida(['verde', 'rojo', 'informativo'])).toBe(CODIGO.ROJO)
  })
  it('un solo error manda sobre el rojo → 2', () => {
    expect(codigoDeSalida(['rojo', 'error'])).toBe(CODIGO.INSTRUMENTO)
  })
  it('nada medido no es verde → 2', () => {
    expect(codigoDeSalida([])).toBe(2)
    expect(codigoDeSalida(undefined)).toBe(2)
  })
  it('un veredicto que no se conoce es de instrumento → 2', () => {
    expect(codigoDeSalida(['verde', 'quizá'])).toBe(2)
  })
})

describe('D1/D3 · canal y versión', () => {
  it('sin ARNES_CANAL, el canal sellado; con msedge, el contraste', () => {
    expect(canalPedido({})).toBe('chromium')
    expect(canalPedido({ ARNES_CANAL: 'msedge' })).toBe('msedge')
    expect(() => canalPedido({ ARNES_CANAL: 'firefox' })).toThrow(ErrorInstrumento)
  })
  it('canal sellado con su versión: ok y sin nota', () => {
    expect(comprobarVersion('chromium', '151.0.7922.34')).toEqual({ ok: true, contraste: false, nota: null })
  })
  it('canal sellado con OTRA versión: error, «hay que re-sellar»', () => {
    const v = comprobarVersion('chromium', '152.0.0.0')
    expect(v.ok).toBe(false)
    expect(v.nota).toMatch(/el navegador cambió: hay que re-sellar/)
  })
  it('contraste con msedge: la diferencia es esperada y se anota', () => {
    const v = comprobarVersion('msedge', '154.0.4258.48')
    expect(v).toMatchObject({ ok: true, contraste: true })
    expect(v.nota).toMatch(/contraste/)
  })
  it('reconoce el «no está instalado» de Playwright', () => {
    expect(faltaNavegador(new Error("browserType.launch: Executable doesn't exist at C:\\x\\chrome.exe"))).toBe(true)
    expect(faltaNavegador(new Error('Target closed'))).toBe(false)
  })
})

describe('D7–D9 · opciones comunes', () => {
  it('por defecto: servidor propio, puertos de siempre, con build', () => {
    expect(leerOpciones(['lob'])).toEqual({ opc: { servidor: 'propio', puerto: null, puertoAux: null, build: true }, resto: ['lob'] })
  })
  it('las banderas comunes salen del resto aunque vayan delante de los posicionales', () => {
    const { opc, resto } = leerOpciones(['--puerto=5180', 'a2', '--sin-build', '4', '1920x937', '--puerto-aux=5181', '--servidor=externo'])
    expect(opc).toEqual({ servidor: 'externo', puerto: 5180, puertoAux: 5181, build: false })
    expect(resto).toEqual(['a2', '4', '1920x937'])
  })
  it('las banderas propias de cada arnés se quedan', () => {
    expect(leerOpciones(['voz2', '--control=capa', '--sin-burbuja', '--sellar']).resto)
      .toEqual(['voz2', '--control=capa', '--sin-burbuja', '--sellar'])
  })
  it('un puerto o un servidor inválidos son error de instrumento', () => {
    expect(() => leerOpciones(['--puerto=99999'])).toThrow(ErrorInstrumento)
    expect(() => leerOpciones(['--puerto=abc'])).toThrow(ErrorInstrumento)
    expect(() => leerOpciones(['--servidor=remoto'])).toThrow(ErrorInstrumento)
  })
  it('esBanderaComun', () => {
    expect(esBanderaComun('--sin-build')).toBe(true)
    expect(esBanderaComun('--puerto=1')).toBe(true)
    expect(esBanderaComun('--sin-burbuja')).toBe(false)
  })
})

describe('D8 · quién escucha en el puerto', () => {
  const NETSTAT = [
    '  Proto  Dirección local          Dirección remota        Estado           PID',
    '  TCP    0.0.0.0:4173           0.0.0.0:0              LISTENING       29600',
    '  TCP    127.0.0.1:41730        0.0.0.0:0              LISTENING       111',
    '  TCP    [::1]:5173             [::]:0                 LISTENING       46020',
    '  TCP    127.0.0.1:5174         127.0.0.1:60000        ESTABLISHED     222',
  ].join('\r\n')
  it('encuentra el PID en IPv4 e IPv6, sin confundir 41730 con 4173', () => {
    expect(pidQueEscucha(NETSTAT, 4173)).toBe(29600)
    expect(pidQueEscucha(NETSTAT, 5173)).toBe(46020)
  })
  it('una conexión establecida no es escuchar', () => {
    expect(pidQueEscucha(NETSTAT, 5174)).toBe(null)
  })
})

describe('D5 · cada modo de diagDSK se lee por donde escribe su veredicto', () => {
  const celdas = (...p) => p.map((passed) => ({ passed }))
  it('todos los modos válidos (menos `all`) tienen lector', () => {
    const clave = (m) => (m === 'menu-movil' ? 'menuMovil' : m)
    for (const m of MODOS_DSK.filter((x) => x !== 'all')) expect(VEREDICTO_DSK[clave(m)], m).toBeTypeOf('function')
  })
  it('`passed` por celda (a1, h1, z1…): una celda roja tiñe el modo', () => {
    expect(veredictosDSK({ mode: 'a1', a1: celdas(true, true) })).toEqual([['a1', 'verde']])
    expect(veredictosDSK({ mode: 'h1', h1: celdas(true, false) })).toEqual([['h1', 'rojo']])
  })
  it('una matriz VACÍA no es verde: es error', () => {
    expect(veredictosDSK({ mode: 'a2', a2: [] })).toEqual([['a2', 'error']])
  })
  it('`passed`, `ok`, `verde` y `matrixOk` arriba', () => {
    expect(veredictosDSK({ u1: { passed: false } })).toEqual([['u1', 'rojo']])
    expect(veredictosDSK({ lob: { ok: true } })).toEqual([['lob', 'verde']])
    expect(veredictosDSK({ luz: { verde: true } })).toEqual([['luz', 'verde']])
    expect(veredictosDSK({ gate: { matrixOk: true } })).toEqual([['gate', 'verde']])
    expect(veredictosDSK({ r2: { cells: celdas(true) } })).toEqual([['r2', 'verde']])
  })
  it('los diagnósticos de DSK, por sus booleanos', () => {
    expect(veredictosDSK({ p1: [{ allBadgesLetters: true, scoreHidden: true, noShift: true }] })).toEqual([['p1', 'verde']])
    expect(veredictosDSK({ tactil: [{ allInteractiveOk: true, multNoOverlap: false }] })).toEqual([['tactil', 'rojo']])
  })
  it('los informativos no deciden', () => {
    expect(veredictosDSK({ d3: [], shots: [] })).toEqual([['d3', 'informativo'], ['shots', 'informativo']])
  })
  it('un modo que abortó (H-1, `m1`) es error aunque no haya dejado datos', () => {
    const v = veredictosDSK({ mode: 'm1', ts: 'x', arnes: {}, error: 'TypeError: …' })
    expect(v).toEqual([['error', 'error']])
    expect(codigoDeSalida(v.map(([, x]) => x))).toBe(2)
  })
  it('una clave que nadie sabe leer es error, no verde', () => {
    expect(veredictosDSK({ nuevo: { passed: true } })).toEqual([['nuevo', 'error']])
  })
})
