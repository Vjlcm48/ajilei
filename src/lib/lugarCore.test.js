import { describe, it, expect } from 'vitest'
import { normalizar, buscarPaises, textoLugar, lugarValido, DIASPORA, POR_CODIGO } from './lugarCore'
import { CODIGOS_PAIS, CODIGOS_ESTADO_VE } from '../config/lugaresCodigos'
import { PAISES } from '../config/paises'
import { esEstado, esPais, lugarValido as lugarValidoEntrada } from './lugarCodigos'
import { ESTADOS_VE } from '../config/estados'

// ── CFG-1 1b · «De dónde eres» ──────────────────────────────────────────────
// Rector: AJILEI_CFG-1_Fase1b_v1.0.md §2.1. Las búsquedas del informe de la
// lámina (§5.3) y las listas selladas (§0-7, §0-8).

const codigos = (texto) => buscarPaises(texto).map((p) => p.c)

describe('CFG-1 1b · las listas', () => {
  it('243 países: ISO 3166-1 menos los seis sin población, sin Kosovo', () => {
    expect(PAISES).toHaveLength(243)
    const c = new Set(PAISES.map((p) => p.c))
    expect(c.size).toBe(243)
    for (const fuera of ['AQ', 'BV', 'HM', 'UM', 'TF', 'GS', 'XK']) expect(c.has(fuera)).toBe(false)
    for (const p of PAISES) expect(p.c).toMatch(/^[A-Z]{2}$/)
  })
  it('los cinco nombres arreglados', () => {
    expect(POR_CODIGO.get('HK').n).toBe('Hong Kong')
    expect(POR_CODIGO.get('MO').n).toBe('Macao')
    expect(POR_CODIGO.get('CI').n).toBe('Costa de Marfil')
    expect(POR_CODIGO.get('PS').n).toBe('Palestina')
    expect(POR_CODIGO.get('TL').n).toBe('Timor Oriental')
  })
  it('24 estados (23 + Distrito Capital), sin Guayana Esequiba ni Dependencias Federales', () => {
    expect(ESTADOS_VE).toHaveLength(24)
    expect(ESTADOS_VE.map((e) => e.c)).toEqual([
      'AMA', 'ANZ', 'APU', 'ARA', 'BAR', 'BOL', 'CAR', 'COJ', 'DEL', 'DC',
      'FAL', 'GUA', 'LGU', 'LAR', 'MER', 'MIR', 'MON', 'NES', 'POR', 'SUC',
      'TAC', 'TRU', 'YAR', 'ZUL'])
    expect(ESTADOS_VE.some((e) => /esequib|dependencia/i.test(e.n))).toBe(false)
    expect(ESTADOS_VE.find((e) => e.c === 'LGU').a).toContain('Vargas')
  })
  it('la diáspora son diez países de la lista, Venezuela primero', () => {
    expect(DIASPORA).toHaveLength(10)
    expect(DIASPORA[0]).toBe('VE')
    for (const c of DIASPORA) expect(POR_CODIGO.has(c)).toBe(true)
  })
})

describe('CFG-1 1b · normalizar y buscar', () => {
  it('normalizar quita tildes, mayúsculas y puntuación', () => {
    expect(normalizar('Perú')).toBe('peru')
    expect(normalizar('EE. UU.')).toBe('ee uu')
    expect(normalizar('Curaçao')).toBe('curacao')
    expect(normalizar(null)).toBe('')
  })
  it('«peru» encuentra Perú', () => {
    expect(codigos('peru')[0]).toBe('PE')
  })
  it('«EEUU» y «usa» encuentran Estados Unidos y nada más', () => {
    expect(codigos('EEUU')).toEqual(['US'])
    expect(codigos('usa')).toEqual(['US'])
  })
  it('«us» no encuentra Rusia', () => {
    expect(codigos('us')).toContain('US')
    expect(codigos('us')).not.toContain('RU')
  })
  it('«republica» encuentra las repúblicas', () => {
    const r = codigos('republica')
    expect(r).toEqual(expect.arrayContaining(['DO', 'CZ', 'CF']))
    expect(r.length).toBeGreaterThan(2)
  })
  it('«curazao» encuentra Curazao', () => {
    expect(codigos('curazao')[0]).toBe('CW')
  })
  it('«zzz» no encuentra nada; vacío, la lista entera', () => {
    expect(codigos('zzz')).toEqual([])
    expect(buscarPaises('  ')).toBe(PAISES)
  })
})

describe('CFG-1 1b · el texto del lugar y lo que llega del servidor', () => {
  it('textoLugar', () => {
    expect(textoLugar('VE', 'ZUL')).toBe('Venezuela · Zulia')
    expect(textoLugar('VE', null)).toBe('Venezuela')
    expect(textoLugar('ES', 'ZUL')).toBe('España')
    expect(textoLugar(null, null)).toBe('')
    expect(textoLugar('XK', null)).toBe('')
  })
  it('lugarValido: país fuera de la lista → sin país; estado sin Venezuela → sin estado', () => {
    expect(lugarValido('VE', 'ZUL')).toEqual({ pais: 'VE', estado: 'ZUL' })
    expect(lugarValido('ES', 'ZUL')).toEqual({ pais: 'ES', estado: null })
    expect(lugarValido('VE', 'ESQ')).toEqual({ pais: 'VE', estado: null })
    expect(lugarValido('ve', null)).toEqual({ pais: null, estado: null })
    expect(lugarValido(undefined, undefined)).toEqual({ pais: null, estado: null })
  })
})

describe('PES-1 §3-D · los códigos de la entrada son las claves de los nombres', () => {
  it('los mismos países, en el mismo orden', () => {
    expect([...CODIGOS_PAIS]).toEqual(PAISES.map((p) => p.c))
  })
  it('los mismos estados, en el mismo orden', () => {
    expect([...CODIGOS_ESTADO_VE]).toEqual(ESTADOS_VE.map((e) => e.c))
  })
  it('sin nombres: el archivo de la entrada no lleva ninguno', () => {
    expect(JSON.stringify(CODIGOS_PAIS)).not.toMatch(/Venezuela/)
    expect(esPais('VE')).toBe(true)
    expect(esPais('XX')).toBe(false)
    expect(esEstado('VE', 'ZUL')).toBe(true)
    expect(esEstado('CO', 'ZUL')).toBe(false)
  })
  it('lugarCore reexporta la misma validación', () => {
    expect(lugarValido).toBe(lugarValidoEntrada)
  })
})
