import { createContext, useContext } from 'react'

// ── RET-A · El «Pronto» de la carcasa de chips, al alcance de sus hijos ─────
//
// `PantallaChips` monta UN toast para las tres entradas que todavía no llevan a
// ninguna parte —perfil, tienda, ⚙— y desde esta tanda también para el botón
// «Conseguir más monedas» de «Retar a las IAS». El manejador vive en la carcasa
// porque el toast vive en la carcasa; lo que faltaba era una vía para que un
// hijo lo alcance sin montar un segundo reloj.
//
// ── POR QUÉ CONTEXTO, Y POR QUÉ EN SU PROPIO ARCHIVO ───────────────────────
// Contexto y no un parámetro de render (`children({ pronto })`): `pronto` cierra
// sobre el `ref` del reloj del toast, y llamar durante el render a una función
// que lo hace es justo lo que `react-hooks/refs` prohíbe —lo dijo el linter, no
// la intuición—. Por contexto el manejador viaja como valor y sólo se ejecuta al
// pulsar, que es cuando un ref se puede leer.
//
// Y en su propio archivo porque `react-refresh/only-export-components` no deja
// que un archivo de componente exporte además un hook. La línea base de lint de
// esta casa son 21 y no se sube por una comodidad de colocación.
export const ProntoContext = createContext(null)

/**
 * El manejador que enseña «Pronto», o `null` fuera de `PantallaChips`. Devuelve
 * `null` en vez de lanzar: un botón sin manejador es un botón que no hace nada,
 * que es exactamente lo que este toast hace hasta que exista ECO-1, y tumbar la
 * pantalla por eso sería un precio absurdo.
 */
export function usePronto() {
  return useContext(ProntoContext)
}
