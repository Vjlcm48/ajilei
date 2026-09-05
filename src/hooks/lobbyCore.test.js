import { describe, it, expect } from 'vitest'
import { enmascararCorreo } from './lobbyCore.js'

// Corre en Node pelado: `lobbyCore.js` no toca React ni DOM, que es el punto
// entero de que exista.
describe('LOB-1 · enmascararCorreo', () => {
  it('conserva la inicial y el dominio entero', () => {
    expect(enmascararCorreo('carlos@gmail.com')).toBe('c•••@gmail.com')
    expect(enmascararCorreo('victorjlcm32@gmail.com')).toBe('v•••@gmail.com')
  })

  it('tapa siempre con TRES puntos, sea cual sea el largo', () => {
    // Un relleno proporcional filtraría la longitud del correo y haría que la
    // caja de la hoja midiese distinto por jugador (O1).
    const corto = enmascararCorreo('ab@x.co')
    const largo = enmascararCorreo('abcdefghijklmnop@x.co')
    expect(corto).toBe('a•••@x.co')
    expect(largo).toBe('a•••@x.co')
    expect(corto).toBe(largo)
  })

  it('conserva subdominios y dominios compuestos', () => {
    expect(enmascararCorreo('ana@correo.una.edu.ve')).toBe('a•••@correo.una.edu.ve')
  })

  it('devuelve cadena vacía cuando no hay correo que enseñar', () => {
    // El caso real es el bypass de desarrollo: no hay sesión, luego no hay
    // correo. El consumidor reserva la caja y la apaga con `visibility`.
    expect(enmascararCorreo('')).toBe('')
    expect(enmascararCorreo(null)).toBe('')
    expect(enmascararCorreo(undefined)).toBe('')
    expect(enmascararCorreo(12345)).toBe('')
  })

  it('devuelve cadena vacía ante algo que no es un correo entero', () => {
    expect(enmascararCorreo('sinarroba')).toBe('')      // sin @
    expect(enmascararCorreo('@gmail.com')).toBe('')     // sin nombre local
    expect(enmascararCorreo('carlos@')).toBe('')        // sin dominio
  })

  it('nunca deja escapar el nombre local más allá de su inicial', () => {
    // La aserción que de verdad importa: lo tapado tiene que estar tapado.
    const salida = enmascararCorreo('nombresecreto@gmail.com')
    expect(salida).not.toContain('ombresecreto')
    expect(salida.startsWith('n•••@')).toBe(true)
  })
})
