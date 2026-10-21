import { useLayoutEffect } from 'react'
import { enganchaEscala } from '../lib/escala'

// ── TAB-1 · La escala de la mesa ────────────────────────────────────────────
// Lo monta `GameTable` y SOLO `GameTable` (ficha 1b–1e §1.4): `data-escala` y
// `--escala` existen en `<html>` mientras la mesa está montada y se borran al
// desmontarla, así que fuera de la mesa ninguna pantalla cambia ni un píxel.
// Todo lo que decide vive en `src/lib/escala.js` (puro, sellado por Vitest);
// el hook solo ejecuta.
//
// `useLayoutEffect` y no `useEffect`: el atributo tiene que estar puesto antes
// del primer pintado de la mesa, o la tableta vería un fotograma a escala 1.
export function useEscalaMesa() {
  useLayoutEffect(() => enganchaEscala(window), [])
}
