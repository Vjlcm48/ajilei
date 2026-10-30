// ── ECO-1e · A-1 · lo puro del corredor de guiones ──────────────────────────
// Sin PGlite: aquí se prueba lo que decide sin base de datos. La corrida de
// verdad es `npm run guiones` (fuera de vitest, antes de cada `db push`).
import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { RAIZ, archivos, codigo } from '../arnes/fuente.mjs'
import {
  GUIONES_VIGENTES, GUIONES_RETIRADOS, SEMBRAR_ANTES_DE, CUENTAS_PREVIAS,
  clasificarGuiones, sinTransaccion, traeTransaccion, veredictoGuion, rastro,
} from './guionesCore.mjs'

const PRUEBAS = join(RAIZ, 'supabase/pruebas')
const MIGRACIONES = join(RAIZ, 'supabase/migrations')
const guion = (a) => readFileSync(join(PRUEBAS, a), 'utf8')

describe('ECO-1e · la lista de guiones es el contrato', () => {
  const enCarpeta = readdirSync(PRUEBAS).filter((f) => f.endsWith('.sql'))
  const c = clasificarGuiones(enCarpeta)

  it('todo guion de supabase/pruebas/ está declarado vigente o retirado', () => {
    expect(c.sinDeclarar, 'guiones que nadie declaró en guionesCore.mjs').toEqual([])
    expect(c.faltan, 'guiones vigentes que ya no están en la carpeta').toEqual([])
  })

  it('ninguno está en las dos listas', () => {
    const v = GUIONES_VIGENTES.map((g) => g.archivo)
    expect(GUIONES_RETIRADOS.filter((g) => v.includes(g.archivo))).toEqual([])
  })

  it('cada vigente apunta a una migración que existe y se deja correr sin su transacción', () => {
    for (const g of GUIONES_VIGENTES) {
      expect(existsSync(join(MIGRACIONES, g.migracion)), `${g.archivo}: ${g.migracion}`).toBe(true)
      expect(sinTransaccion(guion(g.archivo)), `${g.archivo}: begin/rollback`).not.toBeNull()
      expect(g.filas).toBeGreaterThan(0)
    }
  })

  it('el guion de la 1c sigue en la carpeta, retirado y con su nota', () => {
    expect(c.retirados.map((g) => g.archivo)).toEqual(['eco1c_verificacion.sql'])
    expect(guion('eco1c_verificacion.sql')).toMatch(/RETIRADO/)
  })

  it('las cuentas previas se siembran antes de una migración que existe', () => {
    expect(existsSync(join(MIGRACIONES, SEMBRAR_ANTES_DE))).toBe(true)
    expect(CUENTAS_PREVIAS).toHaveLength(4)
    expect(new Set(CUENTAS_PREVIAS.map((x) => x.id)).size).toBe(4)
    for (const x of CUENTAS_PREVIAS) {
      expect(x.usuario).toMatch(/^[A-Za-z0-9_]{6,15}$/)
      expect(x.correo.toLowerCase()).toMatch(/@example\.com$/)
    }
  })
})

describe('ECO-1e · clasificarGuiones', () => {
  it('un guion nuevo sin declarar sale en sinDeclarar', () => {
    const r = clasificarGuiones(['eco1a_verificacion.sql', 'eco1d_verificacion.sql', 'eco1g_verificacion.sql', 'rnk1a_verificacion.sql', 'cfg1c_verificacion.sql', 'cfg1b_verificacion.sql', 'eco1c_verificacion.sql', 'eco9z_verificacion.sql'])
    expect(r.sinDeclarar).toEqual(['eco9z_verificacion.sql'])
    expect(r.faltan).toEqual([])
  })
  it('un vigente que falta sale en faltan', () => {
    expect(clasificarGuiones(['eco1a_verificacion.sql']).faltan).toEqual(['eco1d_verificacion.sql', 'eco1g_verificacion.sql', 'rnk1a_verificacion.sql', 'cfg1c_verificacion.sql', 'cfg1b_verificacion.sql'])
  })
})

describe('ECO-1e · sinTransaccion y traeTransaccion', () => {
  it('quita la línea begin; y la línea rollback;, y nada más', () => {
    expect(sinTransaccion('-- a\nbegin;\nselect 1;\nrollback;\n')).toBe('-- a\nselect 1;\n')
    expect(sinTransaccion('begin;\r\n  begin\r\n  end;\r\nrollback;')).toBe('  begin\n  end;')
  })
  it('sin una de las dos, o con dos, no adivina', () => {
    expect(sinTransaccion('select 1;')).toBeNull()
    expect(sinTransaccion('begin;\nselect 1;')).toBeNull()
    expect(sinTransaccion('begin;\nbegin;\nrollback;')).toBeNull()
  })
  it('la 0001 trae su transacción y las de ECO-1 no', () => {
    const m = (f) => readFileSync(join(MIGRACIONES, f), 'utf8')
    expect(traeTransaccion(m('0001_sup2a_identidad.sql'))).toBe(true)
    expect(traeTransaccion(m('20261007144943_eco1a_libro.sql'))).toBe(false)
  })
})

describe('ECO-1e · veredictoGuion', () => {
  const pasa = (n) => Array.from({ length: n }, (_, i) => ({ prueba: `${i + 1} · x`, resultado: 'PASA', detalle: '' }))
  it('todas PASA y las filas justas: verde', () => {
    expect(veredictoGuion(pasa(3), 3)).toEqual({ veredicto: 'verde', fallos: [] })
  })
  it('una FALLA: rojo, y dice cuál', () => {
    const filas = pasa(3)
    filas[1] = { prueba: '5 · clave por jugador y día', resultado: 'FALLA', detalle: 'constancias=2' }
    const r = veredictoGuion(filas, 3)
    expect(r.veredicto).toBe('rojo')
    expect(r.fallos).toEqual(['5 · clave por jugador y día → FALLA · constancias=2'])
  })
  it('todas PASA pero faltan o sobran filas: rojo', () => {
    expect(veredictoGuion(pasa(2), 3).veredicto).toBe('rojo')
    expect(veredictoGuion(pasa(4), 3).veredicto).toBe('rojo')
  })
  it('sin filas: error, no verde', () => {
    expect(veredictoGuion([], 3).veredicto).toBe('error')
    expect(veredictoGuion(null, 3).veredicto).toBe('error')
  })
})

describe('ECO-1e · rastro', () => {
  it('dos fotos iguales: sin rastro', () => {
    expect(rastro({ a: 'x', b: 'y' }, { a: 'x', b: 'y' })).toEqual([])
  })
  it('una tabla que cambia, aparece o desaparece: se nombra', () => {
    expect(rastro({ a: 'x', b: 'y' }, { a: 'x', b: 'z', c: 'w' })).toEqual(['b', 'c'])
    expect(rastro({ a: 'x' }, {})).toEqual(['a'])
  })
})

describe('ECO-1e · PGlite no sale de scripts/', () => {
  it('ningún archivo de src/ lo importa', () => {
    const culpables = archivos('src', (n) => /\.(jsx?|mjs)$/.test(n)).filter((f) => /@electric-sql|pglite/i.test(codigo(f)))
    expect(culpables).toEqual([])
  })
  it('es una dependencia de desarrollo, fijada a una versión exacta', () => {
    const pkg = JSON.parse(readFileSync(join(RAIZ, 'package.json'), 'utf8'))
    expect(pkg.dependencies?.['@electric-sql/pglite']).toBeUndefined()
    expect(pkg.devDependencies?.['@electric-sql/pglite']).toMatch(/^\d+\.\d+\.\d+$/)
    expect(pkg.scripts?.guiones).toBe('node scripts/guiones.mjs')
  })
})
