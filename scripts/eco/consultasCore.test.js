// ── MED-1a T3 · lo puro de `med_consultas` ──────────────────────────────────
// Sin PGlite: la carpeta, las cabeceras y los veredictos. Ejecutar las consultas
// es trabajo de `npm run guiones`.
import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { RAIZ } from '../arnes/fuente.mjs'
import {
  CONSULTAS_MED, PRUEBAS_CON_DATOS,
  clasificarConsultas, leerCabecera, fallosDeCabecera, fallosDeColumnas,
} from './consultasCore.mjs'

const CARPETA = join(RAIZ, 'supabase/consultas')
const sqlDe = (archivo) => readFileSync(join(CARPETA, archivo), 'utf8')
const enCarpeta = readdirSync(CARPETA).filter((f) => f.endsWith('.sql'))

describe('MED-1a T3 · la lista de consultas es el contrato', () => {
  it('son catorce, numeradas de 01 a 14, y están todas en la carpeta', () => {
    expect(CONSULTAS_MED.map((c) => c.nn)).toEqual(Array.from({ length: 14 }, (_, i) => String(i + 1).padStart(2, '0')))
    const c = clasificarConsultas(enCarpeta)
    expect(c.sinDeclarar).toEqual([])
    expect(c.faltan).toEqual([])
  })

  it('un archivo sin declarar y uno que falta se nombran', () => {
    const c = clasificarConsultas([...CONSULTAS_MED.slice(1).map((x) => x.archivo), 'med_99_nueva.sql'])
    expect(c.sinDeclarar).toEqual(['med_99_nueva.sql'])
    expect(c.faltan).toEqual([CONSULTAS_MED[0].archivo])
  })

  it.each(CONSULTAS_MED.map((c) => [c.archivo, c]))('%s trae su cabecera completa y es un solo select', (archivo, c) => {
    const sql = sqlDe(archivo)
    const cabecera = leerCabecera(sql)
    expect(fallosDeCabecera(c, cabecera)).toEqual([])
    const cuerpo = sql.split('\n').filter((l) => !l.startsWith('--')).join('\n').trim()
    expect(cuerpo).toMatch(/^(with|select)\b/)
    expect(cuerpo.replace(/;\s*$/, '')).not.toContain(';')
  })

  it('el README da el nombre exacto de cada una para el SQL Editor', () => {
    const readme = readFileSync(join(CARPETA, 'README.md'), 'utf8')
    for (const c of CONSULTAS_MED) {
      expect(readme, c.nombre).toContain(c.nombre)
      expect(readme, c.archivo).toContain(c.archivo)
    }
  })
})

describe('MED-1a T3 · leerCabecera', () => {
  const sql = [
    '-- MED · 99 · Una prueba',
    '-- Contesta: algo',
    '-- Definiciones: una línea',
    '--   y otra que continúa',
    '-- Lee: public.x',
    '-- Ventana: 30 días',
    '-- Columnas: a, b ,c',
    'select 1 as a, 2 as b, 3 as c;',
    '-- Columnas: esto ya no es cabecera',
  ].join('\r\n')

  it('lee el nombre, las claves, la continuación y las columnas', () => {
    const c = leerCabecera(sql)
    expect(c.nombre).toBe('MED · 99 · Una prueba')
    expect(c.definiciones).toBe('una línea y otra que continúa')
    expect(c.columnas).toEqual(['a', 'b', 'c'])
  })

  it('sin cabecera no inventa nada, y fallosDeCabecera lo dice', () => {
    const c = leerCabecera('select 1;')
    expect(c.nombre).toBeNull()
    expect(c.columnas).toEqual([])
    expect(fallosDeCabecera({ nombre: 'MED · 99 · x' }, c).length).toBeGreaterThan(0)
  })
})

describe('MED-1a T3 · fallosDeColumnas', () => {
  const cabecera = { columnas: ['a', 'b'] }
  it('iguales, sin fallos', () => {
    expect(fallosDeColumnas(cabecera, [{ name: 'a' }, { name: 'b' }])).toEqual([])
  })
  it('otro nombre, otro número u otro orden: fallo', () => {
    expect(fallosDeColumnas(cabecera, [{ name: 'a' }, { name: 'x' }])).toHaveLength(1)
    expect(fallosDeColumnas(cabecera, [{ name: 'a' }])).toHaveLength(1)
    expect(fallosDeColumnas(cabecera, [{ name: 'b' }, { name: 'a' }])).toHaveLength(1)
  })
})

describe('MED-1a T3 · las pruebas con filas fabricadas', () => {
  const de = (archivo) => PRUEBAS_CON_DATOS.find((p) => p.archivo === archivo)

  it('son la 11 y la 13, y cada una apunta a una consulta declarada', () => {
    expect(PRUEBAS_CON_DATOS.map((p) => p.archivo)).toEqual(['med_11_pausa_anuncio.sql', 'med_13_vigilancia.sql'])
    for (const p of PRUEBAS_CON_DATOS) expect(CONSULTAS_MED.some((c) => c.archivo === p.archivo)).toBe(true)
  })

  const bien11 = {
    mano: 7, pausas: '1', asientos: '5', omitieron: '2', pct_omitieron: '40.0', segundo_mediana: '5.0',
    segundo_p90: '5.8', devueltos_tope: '1', devueltos_mesa: '1', no_volvieron: '1', pct_no_volvieron: '20.0',
  }
  it('la 11 acepta lo esperado y señala un inicio sin cierre mal contado', () => {
    expect(de('med_11_pausa_anuncio.sql').comprobar([bien11])).toEqual([])
    const mal = de('med_11_pausa_anuncio.sql').comprobar([{ ...bien11, no_volvieron: '0' }])
    expect(mal.join(' ')).toContain('no_volvieron')
  })

  it('la 13 exige la fila DEFECTO y su detalle', () => {
    const p = de('med_13_vigilancia.sql')
    expect(p.comprobar([{ seccion: 'medicion_invalida', nombre: 'filas', valor: 0, estado: 'OK' }]).length).toBeGreaterThan(0)
    expect(p.comprobar([])).toEqual(['no trae la fila medicion_invalida · filas'])
  })
})
