// ── ARN-4 A4 · la lista es el contrato ───────────────────────────────────────
// El perfil `completo` no se corre para validarlo (unas 7 h): su contrato se vigila
// aquí, contra los modos que cada arnés dice tener.
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { RAIZ } from './fuente.mjs'
import { MODOS_DSK } from './nucleo.mjs'
import {
  CELDAS_APU, codigoDeVara, codigoGlobal, contratoDeModos, EXCLUIDOS_DSK, EXCLUIDOS_PUE, MANUALES, MESAS_PARTIDAS, modosPueDe, modosQueCorren, PERFILES, tablaDeVaras, topeMs, varasDeSolo, veredictoDeVara,
} from './orquestaCore.mjs'

const fuenteDSK = readFileSync(join(RAIZ, 'scripts/diagDSK.mjs'), 'utf8')
const MODOS_PUE = modosPueDe(readFileSync(join(RAIZ, 'scripts/diagPUE.mjs'), 'utf8'))
const { rapido, commit, completo } = PERFILES
const ids = (lista) => lista.map((v) => v.id)

describe('A4 · el contrato: ningún modo sin declarar', () => {
  it('los modos de los arneses se dejan leer', () => {
    expect(MODOS_DSK.length).toBeGreaterThan(0)
    expect(MODOS_PUE).toContain('todo')
  })
  it('cada modo de diagDSK corre en `completo` o se excluye con su motivo', () => {
    expect(contratoDeModos(MODOS_DSK, modosQueCorren(completo, 'diagDSK'), EXCLUIDOS_DSK)).toEqual([])
  })
  it('cada modo de diagPUE corre en `completo` o se excluye con su motivo', () => {
    expect(contratoDeModos(MODOS_PUE, modosQueCorren(completo, 'diagPUE'), EXCLUIDOS_PUE)).toEqual([])
  })
  it('un modo nuevo que nadie declara, o uno que ya no existe, sale rojo', () => {
    expect(contratoDeModos(['a', 'b'], ['a'], {})).toEqual(['b: nadie lo declara, y sin motivo escrito no se puede excluir'])
    expect(contratoDeModos(['a'], ['a', 'viejo'], {})).toEqual(['viejo: declarado aquí, y su arnés ya no lo tiene'])
    expect(contratoDeModos(['a'], ['a'], { a: 'x' })).toEqual(['a: corre y a la vez está excluido'])
  })
  it('un motivo vacío no vale', () => {
    expect(contratoDeModos(['a'], [], { a: '' })).toHaveLength(1)
  })
  it('las celdas de `apu` son las del arnés: una que no existe no mediría nada', () => {
    const bloque = (nombre) => fuenteDSK.match(new RegExp(`const ${nombre} = \\[([\\s\\S]*?)\\n\\]`))?.[1] ?? ''
    const celdas = `${bloque('APU_VIEWPORTS')}${bloque('VIEWPORTS')}`
    const reales = [...celdas.matchAll(/w: (\d+), h: (\d+)/g)].map((m) => `${m[1]}x${m[2]}`)
    expect(reales).toHaveLength(7)
    expect([...CELDAS_APU].sort()).toEqual(reales.sort())
    for (const c of ['rec2', 'voz3']) expect(ids(completo)).toContain(`apu.${c}`)
  })
  it('`tab` partida lleva todas sus varas', () => {
    const lista = readFileSync(join(RAIZ, 'scripts/tab/tab.mjs'), 'utf8').match(/VARAS_TAB = Object\.freeze\(\[([^\]]*)\]/)?.[1] ?? ''
    const reales = [...lista.matchAll(/'([^']+)'/g)].map((m) => m[1])
    const partidas = completo.filter((v) => v.id.startsWith('tab.')).flatMap((v) => v.args.slice(2).filter((a) => a !== '--sin-build'))
    expect(partidas.sort()).toEqual(reales.sort())
  })
  it('ARN-4d · los modos partidos por mesas llevan todas las mesas del arnés', () => {
    const mesasDe = (nombre) => [...(fuenteDSK.match(new RegExp(`const ${nombre} = \\[([^\\]]*)\\]`))?.[1] ?? '').matchAll(/\d+/g)].map((m) => Number(m[0]))
    for (const nombre of ['H1_TABLES', 'M1_TABLES', 'A1_TABLES']) expect(mesasDe(nombre), nombre).toEqual([...MESAS_PARTIDAS])
    expect(fuenteDSK).toMatch(/const TABLES = \[5, 4, 3, 2\]\s+\/\/ táctil coarse/)
    for (const modo of ['tactil', 'h1', 'm1', 'a1']) {
      expect(ids(completo).filter((i) => i.startsWith(`${modo}.`))).toEqual(MESAS_PARTIDAS.map((m) => `${modo}.${m}`))
      expect(ids(completo), modo).not.toContain(modo)
    }
  })
})

describe('A4 · los perfiles', () => {
  it('`rapido` son las cuatro varas de la ficha, y `commit` añade el peso, la espera y humo', () => {
    expect(ids(rapido)).toEqual(['eslint', 'vitest', 'build', 'guiones'])
    expect(ids(commit)).toEqual([...ids(rapido), '1.8b', 'pue.espera', 'humo'])
    expect(ids(completo)).toContain('1.8b')
  })
  it('vitest pasa por el lanzador', () => {
    expect(rapido.find((v) => v.id === 'vitest').args[0]).toBe('scripts/arnes/vitest.mjs')
  })
  for (const [nombre, perfil] of Object.entries(PERFILES)) {
    it(`${nombre}: un solo build, antes de toda vara que mida dist/, y ninguna otra compila`, () => {
      expect(ids(perfil).filter((i) => i === 'build')).toHaveLength(1)
      const primera = perfil.findIndex((v) => v.necesitaDist)
      if (primera >= 0) expect(ids(perfil).indexOf('build')).toBeLessThan(primera)
      for (const v of perfil.filter((x) => x.necesitaDist)) expect(v.args, v.id).toContain('--sin-build')
    })
    it(`${nombre}: ninguna vara repetida, y todas con un tope bajo los 30 min`, () => {
      expect(new Set(ids(perfil)).size).toBe(perfil.length)
      for (const v of perfil) expect(topeMs(v), v.id).toBeLessThan(30 * 60_000)
    })
  }
  it('las que necesitan el servidor real no corren: se listan como manuales', () => {
    expect(MANUALES.map((m) => m.id)).toContain('guiones en la base real')
    expect(ids(completo).filter((i) => i.includes('base real'))).toEqual([])
  })
})

describe('A4 · --solo', () => {
  const opciones = { modosDsk: MODOS_DSK, modosPue: MODOS_PUE }
  it('un modo suelto lleva el build delante', () => {
    expect(ids(varasDeSolo(['cfg', 'lob'], opciones).varas)).toEqual(['build', 'cfg', 'lob'])
  })
  it('vale un punto de la Portada, aunque corra dentro de `todo`', () => {
    const { varas, desconocidos } = varasDeSolo(['1.8'], opciones)
    expect(desconocidos).toEqual([])
    expect(varas[1].args).toEqual(['scripts/diagPUE.mjs', '1.8', '--sin-build'])
  })
  it('`pue.contraste` (A10a) se pide por su nombre, y está en `completo`', () => {
    const { varas, desconocidos } = varasDeSolo(['pue.contraste'], opciones)
    expect(desconocidos).toEqual([])
    expect(ids(varas)).toEqual(['build', 'pue.contraste'])
    expect(varas[1].args).toEqual(['scripts/diagPUE.mjs', 'contraste', '--sin-build'])
    expect(ids(completo)).toContain('pue.contraste')
  })
  it('un grupo se abre en sus partes', () => {
    expect(ids(varasDeSolo(['tab'], opciones).varas)).toEqual(['build', 'tab.frase', 'tab.resto'])
    expect(ids(varasDeSolo(['apu'], opciones).varas)).toHaveLength(10)
  })
  it('sin nada que mida dist/ no compila, y --sin-build lo quita', () => {
    expect(ids(varasDeSolo(['vitest'], opciones).varas)).toEqual(['vitest'])
    expect(ids(varasDeSolo(['cfg'], { ...opciones, build: false }).varas)).toEqual(['cfg'])
  })
  it('un nombre que no existe no se calla', () => {
    expect(varasDeSolo(['noexiste'], opciones).desconocidos).toEqual(['noexiste'])
  })
  it('ARN-4d · un modo partido se pide por su nombre y se abre en sus partes', () => {
    expect(ids(varasDeSolo(['m1'], opciones).varas)).toEqual(['build', 'm1.5', 'm1.4', 'm1.3', 'm1.2'])
    expect(varasDeSolo(['m1'], opciones).varas[1].args).toEqual(['scripts/diagDSK.mjs', 'm1', '5', '--sin-build'])
  })
})

describe('ARN-4d · el veredicto de cada vara', () => {
  const de = (id) => veredictoDeVara(completo.find((v) => v.id === id))
  it('un modo suelto no necesita copia', () => {
    expect(de('tam')).toEqual({ comun: 'capturas-dsk/diag_tam.json', propio: null })
    expect(de('menu-movil').comun).toBe('capturas-dsk/diag_menu-movil.json')
    expect(de('sal')).toEqual({ comun: 'capturas-sal/diag_sal.json', propio: null })
  })
  it('las partes de un modo no se pisan: cada una guarda el suyo', () => {
    expect(de('m1.5')).toEqual({ comun: 'capturas-dsk/diag_m1.json', propio: 'capturas-dsk/diag_m1.5.json' })
    expect(de('apu.rec2').propio).toBe('capturas-dsk/diag_apu.rec2.json')
    expect(de('tab.frase').propio).toBe('capturas-dsk/diag_tab.frase.json')
  })
  it('los modos de diagPUE comparten archivo, y cada vara guarda el suyo', () => {
    expect(de('todo')).toEqual({ comun: 'capturas-pue/diagPUE.json', propio: 'capturas-pue/diag_todo.json' })
    expect(de('pue.contraste').propio).toBe('capturas-pue/diag_pue.contraste.json')
  })
  it('toda vara de un arnés que da veredicto sabe dónde está el suyo', () => {
    for (const v of completo.filter((x) => /scripts\/diag/.test(x.args[0]))) expect(veredictoDeVara(v), v.id).not.toBeNull()
    for (const id of ['eslint', 'vitest', 'build', 'guiones', '1.8b', 'banco']) expect(de(id), id).toBeNull()
  })
  it('todos los arneses escriben el commit en su JSON', () => {
    for (const a of ['diagDSK', 'diagPUE', 'diagSAL', 'diagCEL0']) {
      expect(readFileSync(join(RAIZ, `scripts/${a}.mjs`), 'utf8'), a).toMatch(/commit(: |\s*=\s*)commitDelArbol\(\)/)
    }
  })
})

describe('A4 · el código global y la tabla', () => {
  const fila = (id, codigo) => ({ id, codigo, ms: 1000, archivo: `${id}.log` })
  it('2 si hubo instrumento, 1 si hubo rojo, 0 si todo verde', () => {
    expect(codigoGlobal([fila('a', 0), fila('b', 0)])).toBe(0)
    expect(codigoGlobal([fila('a', 0), fila('b', 1)])).toBe(1)
    expect(codigoGlobal([fila('a', 1), fila('b', 2)])).toBe(2)
  })
  it('una corrida sin varas no es un verde, y las manuales no cuentan', () => {
    expect(codigoGlobal([])).toBe(2)
    expect(codigoGlobal([{ id: 'm', manual: true }])).toBe(2)
    expect(codigoGlobal([fila('a', 0), { id: 'm', manual: true }])).toBe(0)
  })
  it('un código de salida raro es instrumento, y el tope también', () => {
    expect([0, 1, 2, 3221225786, null].map(codigoDeVara)).toEqual([0, 1, 2, 2, 2])
  })
  it('la tabla lleva vara, código, duración y archivo, y marca las manuales', () => {
    const t = tablaDeVaras([
      { ...fila('vitest', 0), ms: 5400, nota: '88/88' },
      { ...fila('humo', 1), ms: 796000 },
      { id: 'no', codigo: 2, ms: null, archivo: null, nota: 'no corrió' },
      { id: 'guiones en la base real', manual: true, motivo: 'SQL Editor' },
    ]).split('\n')
    expect(t[0]).toMatch(/Vara.*Código.*Duración.*Tope.*Salida/)
    expect(t[2]).toMatch(/vitest.*0.*5 s.*88\/88 · vitest\.log/)
    expect(t[3]).toMatch(/humo.*1.*13 min 16 s.*humo\.log/)
    expect(t[4]).toMatch(/no.*2.*—.*no corrió/)
    expect(t[5]).toMatch(/guiones en la base real.*manual.*SQL Editor/)
  })
})
