// ── APU-1 1e-iv · §5.D · EL LECTOR DE BANDAS, POR LO QUE SE NIEGA A DECIR ────
//
// `compararConBandas` vive dentro de un guion que juega al importarse, así que
// no se puede llamar desde aquí: se prueba como se usa, lanzando el banco y
// leyendo lo que imprime. Son cuatro corridas cortas contra una vara de usar y
// tirar, y lo que sellan no es un número sino un VEREDICTO — que es justo lo
// que 1e-iv encontró roto (E-24, E-26).
import { describe, it, expect, beforeAll } from 'vitest'
import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import process from 'node:process'

const RAIZ  = join(dirname(fileURLToPath(import.meta.url)), '..')
const BANCO = join(RAIZ, 'scripts', 'bancoNiveles.mjs')
const VARA  = 'capturas-dsk/_tb_vara.json'
const BASE  = ['--mesa', '2', '--j0', 'pasivo', '--manos', '2000', '--seed', '7', '--sinReloj', '--tanda', 'TB']

// El banco sale con código 1 (roja) o 2 (sin comparar) a propósito: aquí
// interesa lo que IMPRIME, así que el estado se recoge y no se lanza.
function banco(args) {
  try { return execFileSync('node', [BANCO, ...args], { encoding: 'utf8', cwd: RAIZ }) }
  catch (e) { return (e.stdout ?? '') + (e.stderr ?? '') }
}

beforeAll(() => {
  banco([...BASE, '--unit', '50', '--volcado', '_tb_run.json'])
  banco(['--sellar-bandas', 'capturas-dsk/_tb_run.json', '--vara-bandas', VARA, '--tanda', 'TB'])
}, 120000)

describe('El sellador registra la PROCEDENCIA de lo que sella', () => {
  it('cada celda guarda la apuesta de mesa con la que se jugó', () => {
    const v = JSON.parse(readFileSync(join(RAIZ, VARA), 'utf8'))
    expect(v.celdas).toHaveLength(1)
    expect(v.celdas[0].unit).toBe(50)
    expect(v.celdas[0].siembra).toBe(7)
  })

  it('la vara guarda el blob de los tres archivos que el banco mide', () => {
    const v = JSON.parse(readFileSync(join(RAIZ, VARA), 'utf8'))
    for (const f of ['src/engine/gameEngine.js', 'src/engine/aiPlayer.js', 'src/engine/deck.js']) {
      expect(v.motor[f]).toMatch(/^[0-9a-f]{40}$/)
    }
  })

  // APU-1 C-0.4 · y la graba TAMBIEN EN LA CELDA. La vara viva es mixta desde el
  // re-sello parcial —84 celdas cuyo arbol ya no existe y las re-selladas hoy—,
  // asi que la huella tiene que viajar con la celda o no puede decir la verdad
  // sobre las dos mitades a la vez.
  it('cada celda sellada hoy lleva su propia huella del motor', () => {
    const v = JSON.parse(readFileSync(join(RAIZ, VARA), 'utf8'))
    expect(v.celdas[0].blobs).toEqual(v.motor)
  })
})

describe('El lector se niega a comparar lo que no es comparable', () => {
  it('misma entrada y mismo motor: compara, y con siembra da el cero exacto', () => {
    const out = banco([...BASE, '--unit', '50', '--bandas', '--vara-bandas', VARA, '--volcado', '_tb_a.json'])
    expect(out).toContain('VERDE 1/1 comparables')
    expect(out).not.toContain('INCOMPARABLE')
    expect(out).toMatch(/peor: \w+ (0\.00|-0\.00)s/)
  })

  // E-24 · el defecto que fabricó §D.6 del informe de 1e: una corrida a la
  // entrada por defecto contra una vara sellada al doble salía ROJA por veinte
  // sigmas. Ahora no sale roja: sale incomparable, que es lo que es.
  it('otra apuesta de mesa: ni VERDE ni ROJA, INCOMPARABLE', () => {
    const out = banco([...BASE, '--unit', '100', '--bandas', '--vara-bandas', VARA, '--volcado', '_tb_b.json'])
    expect(out).toContain('VARA DE OTRA ENTRADA')
    expect(out).toContain('INCOMPARABLE')
    expect(out).not.toMatch(/mesa2\|.*\bROJA\b/)
  })

  it('otro motor: la celda está caducada, no roja', () => {
    const ruta = join(RAIZ, VARA)
    const v = JSON.parse(readFileSync(ruta, 'utf8'))
    const limpio = JSON.stringify(v)
    // Se toca la huella DE LA CELDA, que desde C-0.4 es la que manda: la de la
    // cabecera solo decide por las celdas viejas, que no traen la suya.
    v.motor['src/engine/gameEngine.js'] = '0'.repeat(40)
    v.celdas[0].blobs['src/engine/gameEngine.js'] = '0'.repeat(40)
    writeFileSync(ruta, JSON.stringify(v, null, 2))
    const out = banco([...BASE, '--unit', '50', '--bandas', '--vara-bandas', VARA, '--volcado', '_tb_c.json'])
    writeFileSync(ruta, limpio)
    expect(out).toContain('VARA DE OTRO MOTOR')
    expect(out).toContain('OTRO MOTOR 1')
    expect(out).toContain('INCOMPARABLE')
  })

  // D-16 de 1b puso la cuenta de celdas comparadas; E-20 mostró que una cuenta
  // que no entra en el veredicto no sirve de nada. Ahora entra.
  // La otra mitad de la regla: una celda VIEJA, sin huella propia, sigue
  // juzgandose por la de la cabecera. Sin esto, el rescate de C-0.4 habria
  // dejado ciega la proteccion de E-25 para las 84 celdas de 1c-2.
  it('celda sin huella propia: manda la de la cabecera', () => {
    const ruta = join(RAIZ, VARA)
    const v = JSON.parse(readFileSync(ruta, 'utf8'))
    const limpio = JSON.stringify(v)
    delete v.celdas[0].blobs
    v.motor['src/engine/gameEngine.js'] = '0'.repeat(40)
    writeFileSync(ruta, JSON.stringify(v, null, 2))
    const out = banco([...BASE, '--unit', '50', '--bandas', '--vara-bandas', VARA, '--volcado', '_tb_e.json'])
    writeFileSync(ruta, limpio)
    expect(out).toContain('VARA DE OTRO MOTOR')
    expect(out).toContain('OTRO MOTOR 1')
  })

  it('sin vara: la celda entra en el veredicto, y el veredicto empieza por INCOMPARABLE', () => {
    const ruta = join(RAIZ, VARA)
    const v = JSON.parse(readFileSync(ruta, 'utf8'))
    const limpio = JSON.stringify(v)
    v.celdas = []
    writeFileSync(ruta, JSON.stringify(v, null, 2))
    const out = banco([...BASE, '--unit', '50', '--bandas', '--vara-bandas', VARA, '--volcado', '_tb_d.json'])
    writeFileSync(ruta, limpio)
    expect(out).toContain('SIN VARA (celda nueva)')
    expect(out).toContain('SIN VARA 1')
    expect(out).toContain('INCOMPARABLE')
  })
})

// ── APU-1 C-0.3 · LA PROCEDENCIA, BACK-FILLEADA ─────────────────────────────
// Hasta C-0.3 las celdas de `APU1-1c2` no decian con que apuesta de mesa ni con
// que semilla se jugaron: habia que ir al volcado de origen, y `capturas-dsk/`
// no se rastrea. En un `clone` limpio la proteccion de E-24 se quedaba ciega.
// Ahora lo dicen ellas. Lo que esta prueba sella no es el numero: es que el
// back-fill NO TOCO UNA SOLA CIFRA MEDIDA.
describe('La vara viva de APU-1 dice con qué se selló, y sólo eso se le añadió', () => {
  const VIVA = 'scripts/apu1_bandas.json'
  // El sha256 del archivo tal y como lo dejo el sellador de 1c-2, antes del
  // back-fill. Es la unica forma de demostrar que anadir procedencia no movio
  // un numero: se quitan las claves anadidas, se vuelve a serializar con el
  // mismo formato del sellador y tiene que salir el MISMO archivo, byte a byte.
  //
  // C-0.4 · la vara es MIXTA desde el re-sello: 60 celdas siguen siendo las que
  // 1c-2 sello, 24 se volvieron a medir (D-31 y E-13) y 3 son nuevas (V2 a 20x).
  // El sha de abajo es el de las 60 INTACTAS, despojadas de lo que C-0.3 les
  // anadio: mientras no se mueva, ninguna de esas sesenta cifras ha cambiado.
  // El sha del archivo entero de 84 celdas antes del re-sello —el que probo que
  // el back-fill no movia nada— era 3ed210cc… y queda en el informe de cierre.
  const SHA_INTACTAS = '02c3e5c598b33c5f6fafec624634950939b9bf9aabb430f0112028e89c489013'

  it('las celdas de 1c-2 traen su apuesta de mesa y su siembra', () => {
    const v = JSON.parse(readFileSync(join(RAIZ, VIVA), 'utf8'))
    const viejas = v.celdas.filter(c => c.tanda?.startsWith('APU1-1c2'))
    expect(viejas).toHaveLength(60)
    expect(viejas.every(c => c.unit === 100)).toBe(true)
    expect(viejas.every(c => c.siembra === 11 || c.siembra === 23)).toBe(true)
    // `blobs: null` y no una huella inventada: no hay commit del arbol de 1c-2,
    // y una huella falsa seria peor que ninguna (E-25).
    expect(viejas.every(c => c.blobs === null)).toBe(true)
  })

  // ARN-3c · D5 · los 75 volcados de origen viven en `capturas-dsk/`, que no se
  // rastrea, y no se pueden regenerar (salieron de un motor sin commit). Hasta
  // aqui la prueba exigia tenerlos y en un clon limpio salia roja (Fase 0 de
  // ARN-3, B7). Ahora la procedencia se comprueba en dos pisos: contra el
  // INDICE comprometido (`apu1_bandas_origen.json`), siempre; y el indice
  // contra los volcados, por sha256, solo cuando estan. Si faltan TODOS, esa
  // segunda prueba se salta EN VOZ ALTA; si falta una parte, es roja.
  const INDICE = 'scripts/apu1_bandas_origen.json'
  const indice = JSON.parse(readFileSync(join(RAIZ, INDICE), 'utf8')).volcados
  const rutas = Object.keys(indice)
  const presentes = rutas.filter(r => existsSync(join(RAIZ, r)))
  const sinVolcados = presentes.length === 0
  if (sinVolcados) {
    // `process.stderr` y no `console.warn`: vitest solo enseña la consola de una
    // prueba que pasa con `--reporter=verbose`, y este aviso tiene que verse
    // tambien con el `npm test` de siempre.
    process.stderr.write(`\n⚠ testBancoBandas · SALTADA la comprobacion por sha256: no hay ninguno de los ${rutas.length} volcados de ${INDICE} en este arbol (clon limpio). La vara solo se comprueba contra el indice.\n\n`)
  }

  it('la procedencia de cada celda coincide con el índice de sus volcados', () => {
    const v = JSON.parse(readFileSync(join(RAIZ, VIVA), 'utf8'))
    expect(rutas).toHaveLength(75)
    for (const c of v.celdas) {
      expect(indice[c.origen], `celda sin volcado en el indice: ${c.origen}`).toBeTruthy()
      expect(c.unit).toBe(indice[c.origen].unit)
      expect(c.siembra).toBe(indice[c.origen].siembra)
    }
    // Ni entradas sobrantes: cada volcado del indice es el origen de alguna celda.
    const usados = new Set(v.celdas.map(c => c.origen))
    expect(rutas.filter(r => !usados.has(r))).toEqual([])
  })

  it.skipIf(sinVolcados)(
    sinVolcados
      ? `cada volcado es el del índice, por sha256 — SALTADA: faltan los ${rutas.length} volcados (clon limpio)`
      : 'cada volcado es el del índice, por sha256, y dice lo mismo que la celda',
    () => {
      expect(rutas.filter(r => !presentes.includes(r)), 'faltan volcados (presencia parcial)').toEqual([])
      for (const r of rutas) {
        const buf = readFileSync(join(RAIZ, r))
        expect(createHash('sha256').update(buf).digest('hex'), `sha256 de ${r}`).toBe(indice[r].sha256)
        const j = JSON.parse(buf.toString('utf8'))
        expect(j.configuracion.unit).toBe(indice[r].unit)
        expect(j.siembra).toBe(indice[r].siembra)
      }
    })

  // Una celda re-sellada NO puede pasar por vieja: trae su huella del motor y
  // dice por que cambio. Sin esto, un re-sello silencioso seria indistinguible
  // de una medida de 1c-2.
  it('las celdas re-selladas traen huella del motor y nota', () => {
    const v = JSON.parse(readFileSync(join(RAIZ, VIVA), 'utf8'))
    const nuevas = v.celdas.filter(c => c.tanda === 'APU1-C04')
    expect(nuevas).toHaveLength(27)
    for (const c of nuevas) {
      expect(c.nota).toBeTruthy()
      expect(c.blobs['src/engine/gameEngine.js']).toMatch(/^[0-9a-f]{40}$/)
    }
    // Las tres de V2 a 20x son celdas NUEVAS, no re-sellos: las de e=15 siguen.
    expect(v.celdas.filter(c => c.entrada === 20)).toHaveLength(3)
    expect(v.celdas.filter(c => c.entrada === 15)).toHaveLength(3)
  })

  it('quitando lo añadido vuelve el archivo sellado, byte a byte', () => {
    const v = JSON.parse(readFileSync(join(RAIZ, VIVA), 'utf8'))
    delete v.procedencia
    // Se comparan SOLO las 84 de 1c-2: lo que se re-selle despues es una medida
    // nueva y no tiene por que reproducir el archivo viejo.
    v.celdas = v.celdas.filter(c => c.tanda?.startsWith('APU1-1c2'))
    for (const c of v.celdas) { delete c.unit; delete c.siembra; delete c.blobs; delete c.nota }
    // El sellador escribe con `JSON.stringify(..., 2)` y un salto final: se
    // reconstruye ese MISMO texto y se le toma el sha en utf8, que es como se
    // midio el archivo en disco. (Nada de `Buffer`: este lint no lo declara.)
    const texto = JSON.stringify(v, null, 2) + '\n'
    expect(createHash('sha256').update(texto, 'utf8').digest('hex')).toBe(SHA_INTACTAS)
  })
})
