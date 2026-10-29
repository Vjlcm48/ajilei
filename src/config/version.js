// ── CFG-1 1a · La versión y el commit de esta compilación ───────────────────
// Rector: AJILEI_CFG-1_Fase1a_v1.0.md §2.2. Las dos globales las escribe
// `vite.config.js` (`define`) en la compilación: la versión sale de
// `package.json` y el commit de la cadena WORKERS_CI_COMMIT_SHA →
// CF_PAGES_COMMIT_SHA → `git rev-parse` → `'local'`, siempre en 7 caracteres.
// El `typeof` es la red de quien importe esto sin pasar por Vite (un guion de
// Node): ahí no hay `define` y se cae al respaldo en vez de romper.
/* global __APP_VERSION__, __APP_COMMIT__ */
export const VERSION = typeof __APP_VERSION__ === 'string' ? __APP_VERSION__ : '0.0.0'
export const COMMIT = typeof __APP_COMMIT__ === 'string' ? __APP_COMMIT__ : 'local'
