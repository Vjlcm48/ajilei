// ── ARN-3d §2.5 (D9, D14) · prueba de fuente: los sonidos que se precargan ──
// Dos sonidos tienen que estar en el navegador ANTES de su primer `play`, y la
// única defensa es que alguien los pida a tiempo:
//   · `tableKnock` — el golpe del CTA del lobby y el toc-toc de la victoria de
//     mesa. Lo precarga el lobby al montar desde LOB-1 (H3d-4); D9 cierra el
//     pendiente sellando que la precarga EXISTA.
//   · `chipsCollect` — el roce de fichas de la celebración de mano. Hasta
//     ARN-3d nacía en su primer `play` (`loading`): el primer roce de la partida
//     llegaba tarde con red real (Fase 0 §C4). Entra en `SONIDOS_MESA`.
// Estas pruebas se rompen si alguien los saca de su lista o si el lobby deja de
// pedir la suya.
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { SONIDOS_LOBBY, SONIDOS_MESA, SONIDOS_PORTADA } from '../src/hooks/useSounds.js'

const fuente = (ruta) => readFileSync(new URL(`../src/${ruta}`, import.meta.url), 'utf8')

describe('ARN-3d · las listas de precarga', () => {
  it('tableKnock está en SONIDOS_LOBBY', () => {
    expect(SONIDOS_LOBBY).toContain('tableKnock')
  })

  it('chipsCollect está en SONIDOS_MESA', () => {
    expect(SONIDOS_MESA).toContain('chipsCollect')
  })

  it('la Portada sigue sin pagar los sonidos de la mesa (PUE-1.2)', () => {
    expect(SONIDOS_PORTADA).not.toContain('chipsCollect')
    expect(SONIDOS_PORTADA).not.toContain('tableKnock')
  })
})

describe('ARN-3d · quién pide cada lista', () => {
  it('Lobby.jsx precarga SONIDOS_LOBBY al montar', () => {
    const src = fuente('screens/Lobby.jsx')
    expect(src).toMatch(/import\s*\{[^}]*\bSONIDOS_LOBBY\b[^}]*\}\s*from\s*['"]\.\.\/hooks\/useSounds['"]/)
    expect(src).toMatch(/useEffect\(\s*\(\)\s*=>\s*\{\s*precargarSonidos\(\s*SONIDOS_LOBBY\s*\)\s*\}\s*,\s*\[\s*\]\s*\)/)
  })

  it('App.jsx precarga SONIDOS_MESA al encaminarse a la mesa', () => {
    expect(fuente('App.jsx')).toMatch(/precargarSonidos\(\s*SONIDOS_MESA\s*\)/)
  })
})
