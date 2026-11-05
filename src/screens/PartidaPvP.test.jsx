// MOT-1 1f · La marca decide entre el stub de hoy y el panel de prueba. Sin DOM: el
// marcado inicial basta, porque lo que se prueba es qué se pinta y no cómo se mueve.
import { afterEach, describe, expect, it, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'

vi.mock('../lib/supabase', () => ({ supabase: {} }))

import { SoundProvider } from '../context/SoundContext'
import PartidaPvP from './PartidaPvP'

const SALA = { id: '11111111-1111-4111-8111-111111111111', jugadores: 2, apuesta: 100 }

function pintar(search, { sala = SALA, guardada = false } = {}) {
  vi.stubGlobal('location', { search })
  vi.stubGlobal('localStorage', {
    getItem: () => (guardada ? '1' : null),
    setItem: () => {},
    removeItem: () => {},
  })
  return renderToStaticMarkup(
    <SoundProvider>
      <PartidaPvP cuenta={null} billetera={null} sala={sala} onLobby={() => {}} />
    </SoundProvider>,
  )
}

afterEach(() => { vi.unstubAllGlobals() })

describe('MOT-1 1f · PartidaPvP y la marca', () => {
  it('sin marca, el stub de hoy: su rótulo y su CTA, y nada del panel', () => {
    const html = pintar('')
    expect(html).toContain('data-accion="pronto"')
    expect(html).toContain('data-accion="cta"')
    expect(html).not.toContain('data-mot1')
  })

  it('con la marca, el panel en el sitio del cuerpo del stub', () => {
    const html = pintar('?mot1=1')
    expect(html).toContain('data-mot1="panel"')
    expect(html).toContain('data-mot1="releer"')
    expect(html).toContain('data-mot1="abandonar"')
    expect(html).toContain(SALA.id)
    expect(html).not.toContain('data-accion="pronto"')
  })

  it('la marca guardada vale sin el parámetro, y `?mot1=0` manda sobre ella', () => {
    expect(pintar('', { guardada: true })).toContain('data-mot1="panel"')
    expect(pintar('?mot1=0', { guardada: true })).toContain('data-accion="pronto"')
  })

  it('con la marca pero sin mesa no hay nada que probar: el stub', () => {
    const html = pintar('?mot1=1', { sala: null })
    expect(html).toContain('data-accion="pronto"')
    expect(html).not.toContain('data-mot1')
  })
})
