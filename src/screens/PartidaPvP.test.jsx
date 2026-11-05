// MOT-1 1f · La marca decide entre el stub de hoy y el panel de prueba. Sin DOM: el
// marcado inicial basta, porque lo que se prueba es qué se pinta y no cómo se mueve.
import { afterEach, describe, expect, it, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'

vi.mock('../lib/supabase', () => ({ supabase: {} }))

// Con una foto puesta a mano, el panel pinta esa vista; sin ella, el cliente de verdad.
const pruebas = vi.hoisted(() => ({ foto: null }))
vi.mock('../lib/partidaCliente', async (original) => {
  const real = await original()
  return {
    ...real,
    crearClientePartida: (partes) => (pruebas.foto
      ? { suscribir: () => () => {}, foto: () => pruebas.foto, iniciar: () => {}, parar: () => {}, enviar: () => {}, releer: () => {} }
      : real.crearClientePartida(partes)),
  }
})

import { SoundProvider } from '../context/SoundContext'
import { CLASES, crearPartida, vistaDe } from '../arbitro/index.js'
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

afterEach(() => {
  vi.unstubAllGlobals()
  pruebas.foto = null
})

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

  describe('MES-PvP 1 · lo mínimo para probar con los teléfonos', () => {
    const SILLAS = [{ asiento: 0, uid: 'a', nombre: 'Ana' }, { asiento: 1, uid: 'b', nombre: 'Beto' }]
    const FOTO = { canal: 'SUBSCRIBED', avisos: 0, msAccion: null, msAviso: null, msEco: null, rechazo: null }

    function conVista(cambios, asientos = (a) => a) {
      const partida = crearPartida({ apuesta: 100, entrada: 'corta', ritmo: 'normal' }, SILLAS, 0)
      const estado = { ...partida, ...cambios, asientos: partida.asientos.map(asientos) }
      pruebas.foto = { ...FOTO, vista: vistaDe(estado, 0) }
      return pintar('?mot1=1')
    }

    it('en la pausa: quién está en anuncio y el botón de volver, solo si el asiento propio sigue en ella', () => {
      const pausa = { vencimiento: { clase: CLASES.PAUSA_ANUNCIO, hora: 45000 } }
      const html = conVista(pausa, (a) => ({ ...a, enAnuncio: true }))
      expect(html).toContain('data-mot1="volver-anuncio"')
      expect(html).toContain('en anuncio')
      expect(conVista(pausa, (a) => ({ ...a, enAnuncio: a.uid !== 'a' }))).not.toContain('data-mot1="volver-anuncio"')
      expect(conVista({}, (a) => ({ ...a, enAnuncio: true }))).not.toContain('data-mot1="volver-anuncio"')
    })

    it('«ausente» y la última acción, en una línea', () => {
      const ultimaAccion = { asiento: 1, tipo: 'pasar', puesto: 0, apuestaAntes: 0, apuestaDespues: 0, porReloj: true }
      const html = conVista({ ultimaAccion }, (a) => ({ ...a, vencidos: a.uid === 'b' ? 2 : 0 }))
      expect(html).toContain('ausente')
      expect(html).toContain('data-mot1="ultima-accion"')
      expect(html).toContain('porReloj')
    })
  })

  it('con la marca pero sin mesa no hay nada que probar: el stub', () => {
    const html = pintar('?mot1=1', { sala: null })
    expect(html).toContain('data-accion="pronto"')
    expect(html).not.toContain('data-mot1')
  })
})
