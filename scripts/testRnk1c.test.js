// ── RNK-1c · La API de los rankings contra el banco imitado ─────────────────
// Rector: AJILEI_RNK-1_Fase1c-i_v1.0.md §4. `rankingApi` es la capa real; aquí
// habla con el banco imitado (el contrato de la 1a en JS, el mismo que usa el
// bypass) y con clientes rotos a propósito:
//   1) el top llega en el orden del banco y nunca pasa de 100;
//   2) `mio` es `null` sin puntos, y una fila con puntos;
//   3) un ranking que no existe se rechaza SIN llamar;
//   4) «sin red» —error, excepción, rechazo o espera sin fin— devuelve un
//      estado y nunca lanza;
//   5) los sembrados del bypass: 130 con puntos, 140 con billetera, la cuenta
//      del bypass en el puesto 7.
//   6) RNK-1c-ii · `perfil`: un nombre que no cumple la regla no llama; «no
//      hay» es `perfil: null`; una fila llega sin uuid ni correo; sin red, el
//      estado de siempre.

import { describe, it, expect } from 'vitest'
import { crearRankingApi, traducirFilaTop, traducirMio, traducirPerfil } from '../src/lib/rankingApi.js'
import { crearBanco } from '../src/dev/bancoImitado.js'
import { sembradosRanking, PUNTOS_DEL_BYPASS } from '../src/dev/sembradosRanking.js'

const bancoDelBypass = () => {
  const b = crearBanco({ usuario: 'DevLocal', sembrados: sembradosRanking() })
  b.sumarPuntos('DevLocal', PUNTOS_DEL_BYPASS)
  return b
}

describe('RNK-1c · rankingApi contra el banco imitado', () => {
  it('top: hasta 100 filas, en el orden que da el banco', async () => {
    const b = bancoDelBypass()
    const api = crearRankingApi(b)
    for (const ranking of ['maestros', 'fortunas']) {
      const r = await api.top(ranking)
      expect(r.ok).toBe(true)
      expect(r.filas).toHaveLength(100)
      const delBanco = b.llamar('ranking_top', { p_ranking: ranking })
      expect(r.filas).toEqual(delBanco.map((f) => ({ puesto: f.puesto, username: f.username, cifra: f.cifra, esTu: f.es_tu, pais: f.pais, estado: f.estado })))
      expect(r.filas.map((f) => f.puesto)).toEqual(Array.from({ length: 100 }, (_, i) => i + 1))
    }
  })

  it('top con pocos jugadores: las que haya, sin rellenar', async () => {
    const b = crearBanco({ usuario: 'test1976' })
    b.sumarPuntos('test1976', 3)
    const r = await crearRankingApi(b).top('maestros')
    expect(r).toEqual({ ok: true, filas: [{ puesto: 1, username: 'test1976', cifra: 3, esTu: true, pais: null, estado: null }] })
  })

  it('mio: null sin puntos en Maestros; en Fortunas siempre hay fila', async () => {
    const b = crearBanco({ usuario: 'nuevo_1', sembrados: sembradosRanking() })
    const api = crearRankingApi(b)
    expect(await api.mio('maestros')).toEqual({ ok: true, mio: null })
    const f = await api.mio('fortunas')
    expect(f.ok).toBe(true)
    expect(f.mio).toEqual(expect.objectContaining({ total: 140, cifra: 5000 }))
  })

  it('mio: puesto, total, franja y cifra tal como los da el banco', async () => {
    const r = await crearRankingApi(bancoDelBypass()).mio('maestros')
    expect(r).toEqual({ ok: true, mio: { puesto: 7, total: 130, franja: 10, cifra: PUNTOS_DEL_BYPASS } })
  })

  it('un ranking que no existe se rechaza sin llamar al servidor', async () => {
    let llamadas = 0
    const api = crearRankingApi({ rpc: () => { llamadas++; return Promise.resolve({ data: [], error: null }) } })
    for (const malo of ['semanal', '', null, undefined, 'MAESTROS']) {
      expect(await api.top(malo)).toEqual({ ok: false, motivo: 'invalido' })
      expect(await api.mio(malo)).toEqual({ ok: false, motivo: 'invalido' })
    }
    expect(llamadas).toBe(0)
  })
})

describe('RNK-1c · sin red devuelve un estado y no lanza', () => {
  const SINRED = { ok: false, motivo: 'sinred' }
  const casos = {
    'error de la base': () => Promise.resolve({ data: null, error: { code: '500', message: 'caída' } }),
    'excepción al llamar': () => { throw new Error('sin SDK') },
    'promesa rechazada': () => Promise.reject(new Error('fetch failed')),
    'espera sin fin (tope)': () => new Promise(() => {}),
  }
  for (const [nombre, rpc] of Object.entries(casos)) {
    it(nombre, async () => {
      const api = crearRankingApi({ rpc }, { tope: 5 })
      await expect(api.top('maestros')).resolves.toEqual(SINRED)
      await expect(api.mio('fortunas')).resolves.toEqual(SINRED)
    })
  }
})

describe('RNK-1c · «hay fila» se decide por el contenido', () => {
  it('una fila sin puesto entero no es una fila', () => {
    expect(traducirFilaTop({ puesto: null, username: 'x', cifra: 1 })).toBe(null)
    expect(traducirFilaTop({ puesto: 1.5, username: 'x', cifra: 1 })).toBe(null)
    expect(traducirFilaTop({ puesto: 1, username: null, cifra: 1 })).toBe(null)
    expect(traducirFilaTop({ puesto: '3', username: 'x', cifra: '48700', es_tu: false }))
      .toEqual({ puesto: 3, username: 'x', cifra: 48700, esTu: false, pais: null, estado: null })
  })

  it('mio: [] o una fila de nulos = sin fila', () => {
    expect(traducirMio([])).toBe(null)
    expect(traducirMio(null)).toBe(null)
    expect(traducirMio([{ puesto: null, total: null, franja: null, cifra: null }])).toBe(null)
    expect(traducirMio([{ puesto: 117, total: 130, franja: 90, cifra: 1 }]))
      .toEqual({ puesto: 117, total: 130, franja: 90, cifra: 1 })
  })
})

describe('RNK-1c · los sembrados del bypass', () => {
  it('139 jugadores con nombres válidos y distintos', () => {
    const s = sembradosRanking()
    expect(s).toHaveLength(139)
    for (const j of s) expect(j.username).toMatch(/^[A-Za-z0-9_]{6,15}$/)
    expect(new Set(s.map((j) => j.username.toLowerCase())).size).toBe(139)
    expect(sembradosRanking()).toEqual(s)   // determinista
  })

  it('130 en Maestros y 140 en Fortunas, con la cuenta del bypass en el 7', () => {
    const b = bancoDelBypass()
    const m = b.llamar('ranking_mio', { p_ranking: 'maestros' })[0]
    const f = b.llamar('ranking_mio', { p_ranking: 'fortunas' })[0]
    expect(m).toEqual(expect.objectContaining({ puesto: 7, total: 130 }))
    expect(f.total).toBe(140)
    const top = b.llamar('ranking_top', { p_ranking: 'maestros' })
    expect(top[6]).toEqual(expect.objectContaining({ puesto: 7, username: 'DevLocal', cifra: PUNTOS_DEL_BYPASS, es_tu: true }))
    expect(b.llamar('ranking_top', { p_ranking: 'fortunas' })[0].username).toBe('ElCatire88')
  })
})

// ── RNK-1c-ii · `perfil` (`mini_perfil`) ────────────────────────────────────
// Rector: AJILEI_RNK-1_Fase1c-ii_v1.0.md §3.
describe('RNK-1c-ii · rankingApi.perfil', () => {
  const UUID = /[0-9a-f]{8}-[0-9a-f]{4}-/i

  it('un nombre fuera de la regla (6–15, [A-Za-z0-9_]) → perfil null SIN llamar', async () => {
    let llamadas = 0
    const api = crearRankingApi({ rpc: () => { llamadas++; return Promise.resolve({ data: [], error: null }) } })
    for (const malo of ['corto', 'nombre-con-guion', 'demasiado_largo_16', '', null, undefined, 42, 'ñandú_123']) {
      expect(await api.perfil(malo)).toEqual({ ok: true, perfil: null })
    }
    expect(llamadas).toBe(0)
  })

  it('[] (no encontrado) → perfil null', async () => {
    const api = crearRankingApi({ rpc: () => Promise.resolve({ data: [], error: null }) })
    expect(await api.perfil('Nadie_Existe')).toEqual({ ok: true, perfil: null })
    expect(traducirPerfil([])).toBe(null)
    expect(traducirPerfil([{ username: null }])).toBe(null)
  })

  it('contra el banco: ajeno con sus dos puestos, por nombre sin mayúsculas, sin uuid', async () => {
    const b = bancoDelBypass()
    const api = crearRankingApi(b)
    const r = await api.perfil('bachaquero_ve')
    expect(r).toEqual({ ok: true, perfil: { username: 'Bachaquero_VE', puestoMaestros: 1, puntos: 96, puestoFortunas: expect.any(Number), saldo: expect.any(Number), pais: 'VE', estado: null } })
    expect(JSON.stringify(r)).not.toMatch(UUID)
    expect(Object.keys(r.perfil).sort()).toEqual(['estado', 'pais', 'puestoFortunas', 'puestoMaestros', 'puntos', 'saldo', 'username'])
  })

  it('contra el banco: sin puntos → puesto y puntos de Maestros nulos; la cuenta del bypass en el 7', async () => {
    const b = bancoDelBypass()
    const api = crearRankingApi(b)
    const sinPuntos = sembradosRanking().find((j) => !j.puntos)
    const r = await api.perfil(sinPuntos.username)
    expect(r.perfil).toEqual(expect.objectContaining({ puestoMaestros: null, puntos: null }))
    expect(r.perfil.puestoFortunas).toEqual(expect.any(Number))
    expect((await api.perfil('DevLocal')).perfil).toEqual(expect.objectContaining({ username: 'DevLocal', puestoMaestros: 7, puntos: PUNTOS_DEL_BYPASS }))
    expect(await api.perfil('Inventado_99')).toEqual({ ok: true, perfil: null })
  })

  it('CFG-1 1b · el lugar llega validado: fuera de la lista, sin lugar', () => {
    expect(traducirFilaTop({ puesto: 1, username: 'x', cifra: 1, pais: 'VE', estado: 'ZUL' })).toMatchObject({ pais: 'VE', estado: 'ZUL' })
    expect(traducirFilaTop({ puesto: 1, username: 'x', cifra: 1, pais: 'ES', estado: 'ZUL' })).toMatchObject({ pais: 'ES', estado: null })
    expect(traducirFilaTop({ puesto: 1, username: 'x', cifra: 1, pais: 'XK', estado: null })).toMatchObject({ pais: null, estado: null })
    expect(traducirPerfil([{ username: 'x', pais: 'VE', estado: 'ESQ' }])).toMatchObject({ pais: 'VE', estado: null })
  })

  it('la fila del servidor con campos de más (uuid, correo) no los deja pasar', () => {
    const p = traducirPerfil([{ username: 'test1976', puesto_maestros: '1', puntos: '3', puesto_fortunas: 1, saldo: '5000',
      id: '0ca90000-0000-4000-8000-00000000ca91', email: 'x@y.z' }])
    expect(p).toEqual({ username: 'test1976', puestoMaestros: 1, puntos: 3, puestoFortunas: 1, saldo: 5000, pais: null, estado: null })
  })

  const casos = {
    'error de la base': () => Promise.resolve({ data: null, error: { code: '500', message: 'caída' } }),
    'excepción al llamar': () => { throw new Error('sin SDK') },
    'promesa rechazada': () => Promise.reject(new Error('fetch failed')),
    'espera sin fin (tope)': () => new Promise(() => {}),
  }
  for (const [nombre, rpc] of Object.entries(casos)) {
    it(`sin red (${nombre}) → { ok: false, motivo: 'sinred' }`, async () => {
      expect(await crearRankingApi({ rpc }, { tope: 5 }).perfil('test1976')).toEqual({ ok: false, motivo: 'sinred' })
    })
  }
})
