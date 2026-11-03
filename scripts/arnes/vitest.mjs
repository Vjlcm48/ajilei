// ── arnes/vitest.mjs · ARN-4 A1 · vitest a prueba de la unidad en minúscula ──
// Rector: AJILEI_ARN-4_Tanda4a_v1.0.md §2. Corrige la letra de la unidad del
// directorio de trabajo y arranca vitest como proceso HIJO con ese `cwd`, pasando
// los argumentos y devolviendo su código. Tiene que ser un hijo: `--root C:/…` y
// `process.chdir` dentro de la configuración siguen rojos (Fase 0, §2.2).
//
// Vitest sale del `node_modules` del directorio de trabajo, no del de este guion:
// `aislado.mjs` lo lanza desde el árbol principal con el `cwd` en la copia.
import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import process from 'node:process'
import { corregirUnidad } from './unidad.mjs'

const cwd = corregirUnidad(process.cwd())
const vitest = join(cwd, 'node_modules', 'vitest', 'vitest.mjs')
if (!existsSync(vitest)) {
  console.error(`\n✖ ERROR DE INSTRUMENTO (código 2): no existe ${vitest}`)
  process.exit(2)
}

// `INIT_CWD` y `PWD` los deja npm o la consola, con la letra que trajeran.
const env = { ...process.env, INIT_CWD: cwd, PWD: cwd }
const r = spawnSync(process.execPath, [vitest, ...process.argv.slice(2)], { cwd, env, stdio: 'inherit' })
if (r.error) {
  console.error(`\n✖ ERROR DE INSTRUMENTO (código 2): no se pudo arrancar vitest: ${r.error.message}`)
  process.exit(2)
}
process.exit(r.status ?? 2)
