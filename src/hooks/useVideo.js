import { createContext, useContext } from 'react'

// ── ECO-1g · El video de recompensa, al alcance de las pantallas con barra ──
//
// `MarcoVideo` monta UNA vez las capas del video (la capa, el mensaje de «no
// hay video», la celebración) y deja aquí lo que las pantallas necesitan para
// pedirlo y pintarlo:
//
//   abrirMonedas() el «+» dorado de la píldora (`BarraSuperior`): la tienda en
//                 el estante Monedas (TIE-1 1a; antes, la hoja «Conseguir
//                 monedas», retirada). `null` si `App` no la pasa.
//   pedir()       el botón del bloque de saldo de Retar y la fila del estante Monedas
//   mirar()       pregunta al servidor cuántos quedan hoy (`mi_video`)
//   premio        lo que paga un video: lo dice el servidor
//   contador      «Te quedan N de 8 hoy» · «Vuelven en 5 h 12 min» · `null`
//   apagado       el tope del día alcanzado
//   pildora       mientras dura la celebración, `{ cifra, brilla }`: lo que
//                 enseña la píldora en vez del saldo
//
// Releva a `usePronto`, que sólo llevaba el «Pronto» de la carcasa de chips
// hasta el botón de Retar; con el video ese botón ya lleva a alguna parte.
//
// ── POR QUÉ EN SU PROPIO ARCHIVO ───────────────────────────────────────────
// `react-refresh/only-export-components` no deja que un archivo de componente
// exporte además un hook o un contexto (lo mismo que dejó escrito `usePronto`).
export const VideoContext = createContext(null)

/**
 * El video de recompensa, o `null` fuera de `MarcoVideo` (la mesa, la Portada).
 * Devuelve `null` en vez de lanzar: sin marco, el «+» no hace nada y el bloque
 * de Retar no enseña contador, que es preferible a tumbar la pantalla.
 */
export function useVideo() {
  return useContext(VideoContext)
}
