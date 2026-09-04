// ── gen-cards.mjs · Derivados de la baraja (campaña CAR-1) ───────────────────
// Documento rector: AJILEI_CAR1_Fase1_v1.0 §Bloque 1.
//
// Los MAESTROS son los 40 PNG de `src/assets/cards/*.png` y se quedan donde
// están, en el repo y bajo git. De ellos sale todo, y ninguna regeneración
// degrada nada porque siempre se parte del mismo origen — que es el argumento
// entero de la opción (A) del informe de Fase 0. Lo que deja de viajar al
// navegador son los maestros; lo que viaja son estos derivados.
//
// ── SIN SHARP, Y NO POR GUSTO ───────────────────────────────────────────────
// Mismo motivo que en `gen-portada-assets.mjs:12-21`: Sharp no está en el
// proyecto —ni en `dependencies`, ni en `devDependencies`, ni en
// `node_modules`— y el mandato prohíbe dependencias nuevas. El convertidor es
// el navegador vía playwright-core + Edge, que es el precedente de la casa.
// Ventaja de paso: el codificador es el MISMO que después decodifica en el
// navegador del jugador.
//
// ── Los dos números que mandan ──────────────────────────────────────────────
// Fase 0 §2: la carta más grande que llega a pintarse en la MESA mide 250×353
// px físicos (móvil apaisado, showdown de mesa 2, DPR 3). Fase 0 §6: a 320 px
// la imagen es indistinguible de la de 450, y WebP q80 es indistinguible del
// original a tamaño de mesa. El escape a q90 que el rector se reservó es
// cambiar CALIDAD aquí y volver a correr: un número, no una excursión.
//
// Uso:  node scripts/gen-cards.mjs
import { chromium } from 'playwright-core'
import { readFileSync, writeFileSync, mkdirSync, readdirSync, statSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ANCHO   = 320     // Fase 0 §2: máximo pintado 250 px físicos; 320 da un 28 % de margen.
const CALIDAD = 0.80    // Fase 0 §6: q80 indistinguible a tamaño de mesa; q90 es el escape.

const RAIZ   = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const ORIGEN = resolve(RAIZ, 'src/assets/cards')
const SALIDA = resolve(ORIGEN, 'webp')

// El techo NO es un objetivo, es una alarma: la Fase 0 extrapoló 0,57 MB para
// la baraja entera a este ancho y esta calidad. Si sale por encima de 0,80 MB
// algo ha cambiado bajo los pies y hay que mirarlo antes de seguir.
const TECHO_TOTAL = 0.80 * 1024 * 1024

const maestros = readdirSync(ORIGEN).filter((n) => n.toLowerCase().endsWith('.png')).sort()
console.log(`MAESTROS :: ${maestros.length} PNG en src/assets/cards/`)
if (maestros.length !== 40) console.log(`AVISO :: se esperaban 40, hay ${maestros.length}`)

mkdirSync(SALIDA, { recursive: true })

// Una sola sesión de navegador para las 40. Abrir Edge por carta serían 40
// arranques para el mismo canvas.
const navegador = await chromium.launch({ channel: 'msedge', headless: true })
const pagina = await navegador.newPage()

const comoDataURI = (ruta, tipo) => `data:${tipo};base64,${readFileSync(ruta).toString('base64')}`

const informe = []
for (const nombre of maestros) {
  const rutaOrigen = resolve(ORIGEN, nombre)

  const salida = await pagina.evaluate(async ({ uri, ancho, calidad }) => {
    const img = new Image()
    img.src = uri
    await img.decode()
    const alto = Math.round((ancho * img.naturalHeight) / img.naturalWidth)

    const lienzo = document.createElement('canvas')
    lienzo.width = ancho
    lienzo.height = alto
    const ctx = lienzo.getContext('2d')
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'
    ctx.drawImage(img, 0, 0, ancho, alto)

    const d = lienzo.toDataURL('image/webp', calidad)
    return {
      dataURL: d,
      // Si este Chromium no supiera codificar WebP, `toDataURL` devolvería un
      // PNG sin avisar. Se PREGUNTA por el tipo que salió, no se supone.
      tipo: d.slice(5, d.indexOf(';')),
      origenW: img.naturalWidth, origenH: img.naturalHeight,
      salidaW: ancho, salidaH: alto,
    }
  }, { uri: comoDataURI(rutaOrigen, 'image/png'), ancho: ANCHO, calidad: CALIDAD })

  if (salida.tipo !== 'image/webp') {
    console.log(`STOP :: ${nombre} — el canvas devolvió ${salida.tipo}, no image/webp`)
    await navegador.close()
    process.exit(1)
  }

  const destino = resolve(SALIDA, nombre.replace(/\.png$/i, '.webp'))
  writeFileSync(destino, Buffer.from(salida.dataURL.slice(salida.dataURL.indexOf(',') + 1), 'base64'))

  informe.push({
    nombre: nombre.replace(/\.png$/i, ''),
    destino,
    bytesOrigen: statSync(rutaOrigen).size,
    bytes: statSync(destino).size,
    origenW: salida.origenW, origenH: salida.origenH,
    salidaW: salida.salidaW, salidaH: salida.salidaH,
  })
}

// ── Verificación sobre lo ESCRITO, no sobre lo que se creyó escribir ────────
// Se vuelven a decodificar los 40 ficheros desde disco: dimensiones reales y
// ni uno de 0 bytes. Un canvas puede salir bien y el fichero salir vacío.
const fallos = []
for (const f of informe) {
  if (f.bytes === 0) { fallos.push(`${f.nombre}: 0 bytes`); continue }
  const dim = await pagina.evaluate(async (uri) => {
    const img = new Image()
    img.src = uri
    await img.decode()
    return { w: img.naturalWidth, h: img.naturalHeight }
  }, comoDataURI(f.destino, 'image/webp'))
  f.verifW = dim.w
  f.verifH = dim.h
  if (dim.w !== ANCHO) fallos.push(`${f.nombre}: ancho ${dim.w} ≠ ${ANCHO}`)
  if (dim.h !== f.salidaH) fallos.push(`${f.nombre}: alto ${dim.h} ≠ ${f.salidaH}`)
}

await navegador.close()

// ── La tabla ────────────────────────────────────────────────────────────────
const kb = (b) => (b / 1024).toFixed(1)
console.log(`\n=== CAR-1 · baraja a ${ANCHO} px · WebP q${CALIDAD} ===`)
console.log('carta'.padEnd(16), 'px'.padStart(9), 'KB origen'.padStart(10), 'KB WebP'.padStart(9), 'ratio'.padStart(8))
for (const f of informe) {
  console.log(
    f.nombre.padEnd(16),
    `${f.verifW ?? f.salidaW}×${f.verifH ?? f.salidaH}`.padStart(9),
    kb(f.bytesOrigen).padStart(10),
    kb(f.bytes).padStart(9),
    `${(f.bytesOrigen / f.bytes).toFixed(1)}×`.padStart(8),
  )
}

const totalOrigen = informe.reduce((a, x) => a + x.bytesOrigen, 0)
const total = informe.reduce((a, x) => a + x.bytes, 0)
console.log(
  `\nTOTAL :: ${informe.length} derivados · ${kb(total)} KB (${(total / 1048576).toFixed(2)} MB) ` +
  `· maestros ${(totalOrigen / 1048576).toFixed(2)} MB · −${(100 - (total / totalOrigen) * 100).toFixed(1)} % · ${(totalOrigen / total).toFixed(1)}× más ligera`
)
console.log(`MEDIA :: ${kb(total / informe.length)} KB por carta`)

if (fallos.length) {
  console.log(`\nSTOP :: ${fallos.length} verificaciones fallidas`)
  for (const f of fallos) console.log(`   ${f}`)
  process.exit(1)
}
if (total > TECHO_TOTAL) {
  console.log(`\nSTOP :: total ${(total / 1048576).toFixed(2)} MB por encima del techo de ${(TECHO_TOTAL / 1048576).toFixed(2)} MB (Fase 1 §1)`)
  process.exit(1)
}
console.log(`VERIFICADO :: ${informe.length}/${informe.length} a ${ANCHO}×${informe[0].verifH}, ninguno de 0 bytes, total dentro del techo`)
