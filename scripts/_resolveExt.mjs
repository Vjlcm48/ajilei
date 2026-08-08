// ── _resolveExt.mjs · resolutor de extensiones para el arnés ────────────────
// `gameEngine.js` importa `'./handEvaluator'` SIN extensión. Vite y Vitest lo
// resuelven; Node ESM no, y por eso cualquier módulo de src/ que dependa del
// motor era inimportable desde diagDSK (U3 lo esquivó importando sólo módulos
// autocontenidos; VC2 ya no puede, porque el decisor necesita PHASES e
// isAjilei).
//
// El arreglo obvio —añadir la extensión— toca `gameEngine.js`, que es ARCHIVO
// PROTEGIDO ("no modificar bajo ninguna circunstancia", sistema de diseño). Así
// que el arnés se adapta al motor y no al revés: un gancho de resolución que
// prueba con `.js` cuando el especificador relativo no trae extensión. Vive
// aquí, en scripts/, y no cambia una coma de la app.
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

export async function resolve(especificador, contexto, siguiente) {
  try {
    return await siguiente(especificador, contexto)
  } catch (e) {
    const relativo = especificador.startsWith('./') || especificador.startsWith('../')
    if (!relativo || /\.[a-z]+$/i.test(especificador)) throw e
    const url = new URL(especificador + '.js', contexto.parentURL)
    if (!existsSync(fileURLToPath(url))) throw e
    return { url: url.href, shortCircuit: true }
  }
}
