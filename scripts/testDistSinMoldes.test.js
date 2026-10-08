// ── ECO-1b · La guardia sobre `dist/`: ningún saldo falso llega a producción ──
// Rector: AJILEI_ECO-1_Fase1b_v1.0.md §2.4 y §3.5 (K-11 de la Fase 0).
//
// La billetera falsa (`src/dev/billeteraFalsa.js`), el molde `?apu=`
// (`src/dev/siembraAPU.js`) y los estados `?sal=` (`src/dev/salasFixtures.js`)
// se apagan con `import.meta.env.DEV`, que es `false` bajo `vite build`: el
// minificador se lleva sus archivos enteros. Hasta la 1b eso se comprobaba con
// un `grep` a mano (SAL-B1 §9.3); esta prueba lo hace en cada corrida.
//
// ── POR QUÉ COMPILA EN UN PROCESO HIJO ──────────────────────────────────────
// Vitest pone `NODE_ENV=test`, y Vite decide el modo de producción mirando
// `NODE_ENV`: compilar desde aquí dentro podría dar un build con `DEV` a
// `true`, que es justo lo que se quiere descartar (la trampa NODE_ENV de
// ARN-3a). El hijo compila con `NODE_ENV=production` y además con
// `VITE_AUTH_BYPASS=1`: el peor caso, el de un despiste que suba un `.env`
// de desarrollo. Compila a una carpeta temporal: `dist/` no se toca.
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { execFileSync } from 'node:child_process'
import { mkdtempSync, readdirSync, readFileSync, rmSync, statSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import process from 'node:process'
import { RAIZ } from './arnes/fuente.mjs'

// Las huellas que NO pueden aparecer. Cada una es una cadena que sólo existe
// dentro de un archivo de `src/dev/` detrás de su puerta.
const PROHIBIDAS = [
  // la billetera falsa (`MARCA_BILLETERA_FALSA`)
  'ajilei:billetera-falsa',
  // la tabla de moldes de `siembraAPU`
  'allinHumano',
  // los estados de `?sal=`
  'opciones-fuera-alcance',
  'espera-fantasma',
]

// Y la que SÍ tiene que estar: la lectura de verdad.
const OBLIGATORIAS = ['mi_billetera']

let carpeta = null
let textos = []

function archivos(dir) {
  return readdirSync(dir).flatMap((n) => {
    const ruta = join(dir, n)
    return statSync(ruta).isDirectory() ? archivos(ruta) : [ruta]
  })
}

beforeAll(() => {
  carpeta = mkdtempSync(join(tmpdir(), 'ajilei-dist-'))
  const salida = join(carpeta, 'dist')
  execFileSync(process.execPath, [
    join(RAIZ, 'node_modules', 'vite', 'bin', 'vite.js'),
    'build', '--outDir', salida, '--emptyOutDir', '--logLevel', 'error',
  ], {
    cwd: RAIZ,
    env: { ...process.env, NODE_ENV: 'production', VITE_AUTH_BYPASS: '1' },
    stdio: 'pipe',
  })
  textos = archivos(salida)
    .filter((r) => /\.(js|html|css)$/.test(r))
    .map((r) => ({ ruta: r, texto: readFileSync(r, 'utf8') }))
}, 180000)

afterAll(() => {
  // La carpeta es nuestra y no enlaza nada: se borra entera.
  if (carpeta) rmSync(carpeta, { recursive: true, force: true })
})

describe('ECO-1b · la guardia sobre dist/', () => {
  it('el build de producción tiene código que mirar', () => {
    expect(textos.some((a) => a.ruta.endsWith('.js'))).toBe(true)
  })

  for (const huella of PROHIBIDAS) {
    it(`no aparece «${huella}»`, () => {
      const donde = textos.filter((a) => a.texto.includes(huella)).map((a) => a.ruta)
      expect(donde).toEqual([])
    })
  }

  for (const huella of OBLIGATORIAS) {
    it(`aparece «${huella}» (la lectura real)`, () => {
      expect(textos.some((a) => a.texto.includes(huella))).toBe(true)
    })
  }
})
