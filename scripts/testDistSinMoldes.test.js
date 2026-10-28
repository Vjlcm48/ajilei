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
  // ECO-1c · el banco imitado del bypass (`MARCA_BANCO_IMITADO`): el contrato
  // SQL de la 1c en JS, que sirve las mesas sin servidor en desarrollo
  'ajilei:banco-imitado',
  // la tabla de moldes de `siembraAPU`
  'allinHumano',
  // VOZ-3 · D13 · el molde de C3 (`?apu=allin-espejo`): nunca a producción
  'allin-espejo',
  // ECO-1c · el mando `?apu=bolsillo:<n>` (el literal de su expresión regular;
  // fuera de `src/dev/` «bolsillo» sólo vive en comentarios, que no llegan)
  'bolsillo:',
  // ECO-1d · los mandos nuevos del banco imitado: sembrar la racha (lo que
  // `constancia_admin` hace en el SQL Editor) y forzar un `limite`. P-5: no
  // hay mando de URL para la racha; éstos sólo los alcanza el arnés.
  'constanciaAdmin',
  'forzarLimite',
  // ECO-1g · los mandos del video de recompensa (`?apu=video:<ms>`,
  // `?apu=video:sin`, `?apu=video:cierra`). La huella es el LITERAL de su
  // expresión regular en `siembraAPU.videoSembradoAPU`, no `video:` a secas:
  // esa cadena la pueden traer las tablas de etiquetas de `react-dom`. Si
  // aparece, un video se podría acortar en producción. Y los dos mandos del
  // banco imitado que sólo alcanza el arnés.
  '|sin|cierra',
  'sembrarVideosCobrados',
  'envejecerBoleto',
  // RNK-1 1e · el mando `?suma` (`src/dev/siembraSuma.js`), que pone el
  // contador de SumaMente a una entrada del video. Su huella es el rótulo del
  // aviso de consola, que sólo vive detrás de la puerta.
  'molde-suma',
  // los estados de `?sal=`
  'opciones-fuera-alcance',
  'espera-fantasma',
  // ECO-1e · A-1 · el Postgres del corredor de guiones (`scripts/guiones.mjs`)
  // es una dependencia de DESARROLLO: 25 MB de WASM que nadie importa en `src/`.
  // Estas tres no son de `src/dev/`: son el nombre del paquete y el de su clase.
  '@electric-sql',
  'pglite',
  'PGlite',
]

// Y las que SÍ tienen que estar: la lectura de verdad y, desde ECO-1c, las
// funciones de mesa de verdad (la falsa no puede ser la única que llega).
// ECO-1d · y la constancia de verdad.
// ECO-1g · y el video de verdad: el contador, el boleto y su cobro.
// RNK-1 1e · y la ruta del video de SumaMente.
const OBLIGATORIAS = [
  'mi_billetera', 'sentarse_ia', 'informar_pila', 'recoger_mesa_ia', 'marcar_ingreso',
  'mi_video', 'pedir_boleto', 'cobrar_boleto',
  // RNK-1 1e · y el video de SumaMente de verdad (el mp4 de `public/`, no el
  // WebM de prueba del arnés).
  'sumamente_promo_es.mp4',
]

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
