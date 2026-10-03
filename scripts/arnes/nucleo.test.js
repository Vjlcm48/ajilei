// ── ARN-3a · las decisiones puras del terreno del arnés ──────────────────────
// Rector: AJILEI_ARN-3a_v1.0.md §0. Lo que aquí se sella es lo que el arnés
// DECIDE: qué navegador vale, qué opciones lee y qué código devuelve. Los casos
// de `veredictosDSK` imitan la forma real del JSON de cada modo (ARN-3 Fase 0).
import { describe, it, expect } from 'vitest'
import {
  NAVEGADOR_SELLADO, ETIQUETA_NAVEGADOR, ORDEN_INSTALAR, CODIGO, ErrorInstrumento,
  codigoDeSalida, canalPedido, comprobarVersion, faltaNavegador, leerOpciones, esBanderaComun,
  pidQueEscucha, veredictosDSK, VEREDICTO_DSK, MODOS_DSK,
  esLocal, clasificarPeticion, respuestaSupabase, corteDelArnes, veredictoAislamiento, PERFIL_ARNES, decidirBuild,
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
  it('todos los modos válidos (menos `humo`, que es un paquete) tienen lector', () => {
    const clave = (m) => (m === 'menu-movil' ? 'menuMovil' : m)
    for (const m of MODOS_DSK.filter((x) => x !== 'humo')) expect(VEREDICTO_DSK[clave(m)], m).toBeTypeOf('function')
  })
  it('ARN-3e · D12 · `humo` es un modo y `all` ya no', () => {
    expect(MODOS_DSK).toContain('humo')
    expect(MODOS_DSK).not.toContain('all')
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

// ── ARN-3c · D6 · el aislamiento de la red ───────────────────────────────────
describe('D6 · qué sale del arnés y qué no', () => {
  it('lo local y lo que no es de red se queda en la máquina', () => {
    for (const u of ['http://localhost:5173/', 'http://127.0.0.1:4173/x.js', 'ws://localhost:5173/?token=1',
      'http://[::1]:4173/', 'data:image/png;base64,AA', 'blob:http://localhost:5173/abc', 'about:blank']) {
      expect(esLocal(u), u).toBe(true)
    }
    expect(esLocal('https://abc.supabase.co/rest/v1/rpc/mi_sala')).toBe(false)
    expect(esLocal('wss://abc.supabase.co/realtime/v1/websocket')).toBe(false)
  })
  it('clasifica: local pasa, Supabase se contesta, lo demás se corta', () => {
    expect(clasificarPeticion('http://localhost:4173/', 'abc.supabase.co')).toBe('local')
    expect(clasificarPeticion('https://abc.supabase.co/rest/v1/profiles?id=eq.1', 'abc.supabase.co')).toBe('supabase')
    expect(clasificarPeticion('https://fonts.googleapis.com/css2', 'abc.supabase.co')).toBe('fuera')
  })
  it('cualquier *.supabase.co es Supabase aunque el host no se conozca', () => {
    expect(clasificarPeticion('https://otro.supabase.co/auth/v1/user', null)).toBe('supabase')
    expect(clasificarPeticion('https://supabase.co.evil.example/x', null)).toBe('fuera')
  })
  it('contesta como contextoCap: RPC null (sin cuerpo de error), perfil, usuario y [] por defecto', () => {
    expect(respuestaSupabase('/rest/v1/rpc/mi_sala')).toBe(null)
    expect(respuestaSupabase('/rest/v1/profiles', 'application/vnd.pgrst.object+json')).toEqual(PERFIL_ARNES)
    expect(respuestaSupabase('/rest/v1/profiles', 'application/json')).toEqual([PERFIL_ARNES])
    expect(respuestaSupabase('/auth/v1/user').id).toBe(PERFIL_ARNES.id)
    expect(respuestaSupabase('/rest/v1/salas')).toEqual([])
  })
  it('distingue un corte del arnés de un fallo de red de verdad', () => {
    expect(corteDelArnes('net::ERR_BLOCKED_BY_CLIENT.Inspector')).toBe(true)
    expect(corteDelArnes('net::ERR_FAILED')).toBe(true)
    expect(corteDelArnes('net::ERR_CONNECTION_CLOSED')).toBe(false)
    expect(corteDelArnes('net::ERR_NAME_NOT_RESOLVED')).toBe(false)
  })
  it('una sola escapada es error de instrumento; sin registro, también', () => {
    expect(veredictoAislamiento({ escapadas: [] })).toBe('verde')
    expect(veredictoAislamiento({ escapadas: ['POST https://abc.supabase.co/rest/v1/rpc/mi_sala ← 1.2.3.4:443'] })).toBe('error')
    expect(veredictoAislamiento(null)).toBe('error')
  })
  it('en diagDSK el aislamiento entra como un veredicto más y una escapada sale con 2', () => {
    const v = veredictosDSK({ mode: 'lob', lob: { ok: true }, aislamiento: { escapadas: ['x'] } })
    expect(v).toEqual([['lob', 'verde'], ['aislamiento', 'error']])
    expect(codigoDeSalida(v.map(([, x]) => x))).toBe(2)
    const limpio = veredictosDSK({ mode: 'lob', lob: { ok: true }, aislamiento: { escapadas: [] } })
    expect(codigoDeSalida(limpio.map(([, x]) => x))).toBe(0)
  })
})

describe('ARN-3e-ii · D17 · nunca compilar con un dev vivo en el mismo proceso (H3e-i-1)', () => {
  it('sin servidores de desarrollo, se puede compilar', () => {
    expect(decidirBuild([])).toEqual({ ok: true, motivo: null })
    expect(decidirBuild()).toEqual({ ok: true, motivo: null })
  })
  it('con un dev vivo, no: el motivo nombra el puerto, la causa y el orden sano', () => {
    const d = decidirBuild([5173])
    expect(d.ok).toBe(false)
    expect(d.motivo).toContain(':5173')
    expect(d.motivo).toContain('H3e-i-1')
    expect(d.motivo).toMatch(/preview .*ANTES que el dev/)
    expect(d.motivo).toContain('--sin-build')
  })
  it('con dos, los nombra a los dos', () => {
    expect(decidirBuild([5173, 5174]).motivo).toContain(':5173, :5174')
  })
  it('servidorArnes lo consulta antes de compilar y lo convierte en código 2', () => {
    const t = readFileSync(new URL('./comun.mjs', import.meta.url), 'utf8')
    const preview = t.slice(t.indexOf("tipo === 'preview'"), t.indexOf('vite.build('))
    expect(preview).toMatch(/decidirBuild\(DEVS_VIVOS\)[\s\S]*throw new ErrorInstrumento\(puede\.motivo\)/)
    const dev = t.slice(t.indexOf("if (tipo === 'dev')"), t.indexOf("tipo === 'preview'"))
    expect(dev).toContain('DEVS_VIVOS.push(puerto)')
  })
})
