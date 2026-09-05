import { describe, it, expect, vi, afterEach } from 'vitest'
import {
  t,
  clavesDe,
  idiomaValido,
  IDIOMA_POR_DEFECTO,
  IDIOMAS_DISPONIBLES,
  CLAVE_IDIOMA_STORAGE,
} from './textos.js'
import { TEXTOS_ES } from './textos.es.js'

// ── IDI-0 · Contrato del diccionario ────────────────────────────────────────
// Documento rector: AJILEI_LOB1_Fase1_v1.1.md §2.4.
//
// Corre en Node pelado, sin jsdom (que este proyecto NO tiene — hallazgo de
// FRZ-1): por eso el test importa `textos.js` y `textos.es.js`, que no tocan el
// DOM, y jamás `useIdioma.js`, que sí.
//
// Lo que este archivo defiende no es "que las cadenas estén bien escritas" —eso
// lo mira Victor—: es que la FORMA del diccionario aguante el día que haya un
// segundo idioma. Cada aserción existe contra un modo concreto de romperlo.

describe('IDI-0 · diccionario es', () => {
  it('toda clave devuelve una cadena no vacía', () => {
    const claves = clavesDe('es')
    expect(claves.length).toBeGreaterThan(0)
    for (const clave of claves) {
      const valor = t(clave, 'es')
      expect(typeof valor).toBe('string')
      expect(valor.length).toBeGreaterThan(0)
      // …y no es el marcador de fallo disfrazado de texto.
      expect(valor.startsWith('⟦')).toBe(false)
    }
  })

  it('ninguna clave lleva espacios ni mayúsculas', () => {
    // Las claves son el CONTRATO y viajan a `data-i18n`, a los tests y a los
    // diccionarios hermanos. Una mayúscula o un espacio cuelan una clave que se
    // escribe de dos maneras y sólo funciona en una.
    for (const clave of clavesDe('es')) {
      expect(clave).toBe(clave.toLowerCase())
      expect(clave).not.toMatch(/\s/)
      expect(clave).toMatch(/^[a-z0-9]+(\.[a-z0-9]+)+$/)
    }
  })

  it('todas las claves del lobby viven bajo el prefijo lob.', () => {
    // El alcance de esta fase es el lobby y sólo el lobby (§2.1). El prefijo es
    // lo que permitirá que otra campaña añada `mesa.*` sin pisar nada.
    for (const clave of clavesDe('es')) {
      expect(clave.startsWith('lob.')).toBe(true)
    }
  })

  it('no hay dos claves con el mismo texto por descuido de copia-pega', () => {
    // Excepción declarada y ÚNICA: `lob.cfg.titulo` y `lob.ajustes.aria` dicen
    // los dos "Configuración" a propósito —el rótulo de la hoja y el nombre
    // accesible del engranaje que la abre son la misma palabra—. Cualquier otro
    // par repetido es una clave que se duplicó al escribir el diccionario.
    const vistos = new Map()
    const repetidos = []
    for (const [clave, valor] of Object.entries(TEXTOS_ES)) {
      if (vistos.has(valor)) repetidos.push([vistos.get(valor), clave].sort().join(' = '))
      else vistos.set(valor, clave)
    }
    expect(repetidos).toEqual(['lob.ajustes.aria = lob.cfg.titulo'])
  })
})

describe('IDI-0 · fallback', () => {
  afterEach(() => { vi.restoreAllMocks() })

  it('una clave inexistente devuelve ⟦clave⟧, nunca cadena vacía', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    expect(t('lob.no.existe')).toBe('⟦lob.no.existe⟧')
  })

  it('avisa UNA sola vez por clave', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    // Clave nueva en cada corrida del archivo: el guardia `AVISADAS` es de
    // módulo y sobrevive entre tests, así que reusar una ya avisada mediría cero.
    const clave = 'lob.aviso.unico'
    t(clave); t(clave); t(clave)
    expect(warn).toHaveBeenCalledTimes(1)
  })

  it('un idioma sin diccionario cae al por defecto en vez de romper', () => {
    // El caso real: `localStorage` manipulado a mano con 'kl'. La misma
    // doctrina de `normalizarNivel` — basura conocida cae al valor de la casa.
    expect(t('lob.cta.ia', 'kl')).toBe(TEXTOS_ES['lob.cta.ia'])
  })
})

describe('IDI-0 · constantes de la plomería', () => {
  it('el idioma por defecto tiene diccionario', () => {
    expect(IDIOMAS_DISPONIBLES).toContain(IDIOMA_POR_DEFECTO)
    expect(idiomaValido(IDIOMA_POR_DEFECTO)).toBe(true)
  })

  it('sólo `es` está disponible mientras no exista un segundo diccionario', () => {
    // Este test es un RECORDATORIO deliberado: cuando IDI-1 añada `textos.en.js`
    // esta línea saldrá roja y obligará a actualizar la lista a mano, en vez de
    // dejar un idioma medio conectado que el selector ofrece y `t` no sabe pintar.
    expect(IDIOMAS_DISPONIBLES).toEqual(['es'])
    expect(idiomaValido('en')).toBe(false)
  })

  it('la clave de almacenamiento sigue la convención ajilei.<cosa>', () => {
    expect(CLAVE_IDIOMA_STORAGE).toBe('ajilei.idioma')
  })
})
