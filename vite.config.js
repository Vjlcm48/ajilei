import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { execSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import process from 'node:process'

// ── CFG-1 1a · La versión y el commit, escritos en la compilación ──────────
// Rector: AJILEI_CFG-1_Fase1a_v1.0.md §2.2. «Acerca de» enseña
// `AJILEI 0.9.0 · c0bc2c1`. La versión es la de `package.json`; el commit, el
// primero que haya de esta cadena, cortado a 7 caracteres:
//   1. WORKERS_CI_COMMIT_SHA — Workers Builds, que es como se compila ajilei.io
//      (`npm run build` → `npx wrangler deploy`);
//   2. CF_PAGES_COMMIT_SHA — por si algún día vuelve a Pages;
//   3. `git rev-parse` — la copia local, `npm run dev` y `vite preview`;
//   4. `'local'` — sin git y sin variables.
// EL RESPALDO NUNCA ROMPE LA BUILD: todo lo que puede fallar va en un `try`, y
// lo que no parezca un hash corto se descarta.
const HASH_CORTO = /^[0-9a-f]{7}$/

function commitCorto() {
  const candidatos = [process.env.WORKERS_CI_COMMIT_SHA, process.env.CF_PAGES_COMMIT_SHA]
  try {
    candidatos.push(execSync('git rev-parse --short=7 HEAD', { stdio: ['ignore', 'pipe', 'ignore'] }).toString())
  } catch { /* sin git: queda el respaldo */ }
  for (const c of candidatos) {
    const corto = String(c ?? '').trim().toLowerCase().slice(0, 7)
    if (HASH_CORTO.test(corto)) return corto
  }
  return 'local'
}

function versionDelPaquete() {
  try { return JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')).version ?? '0.0.0' }
  catch { return '0.0.0' }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    __APP_VERSION__: JSON.stringify(versionDelPaquete()),
    __APP_COMMIT__: JSON.stringify(commitCorto()),
  },
  // Permite abrir `vite preview` a través de un túnel temporal de Cloudflare
  // (pruebas con teléfonos reales fuera de la red local). Solo afecta a preview.
  preview: { allowedHosts: ['.trycloudflare.com'] },
})
