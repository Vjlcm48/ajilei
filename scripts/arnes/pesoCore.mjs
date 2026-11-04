// ── arnes/pesoCore.mjs · ARN-4d · el camino crítico, sin navegador ───────────
// INV-30: lo que viaja hasta el primer pintado pesa 200 KiB o menos. `diagPUE 1.8` lo
// mide con un navegador, y por eso solo salía en `completo`: el peso cruzó el techo
// sin que `commit` lo viera. Aquí se pesa `dist/` con la misma cuenta que su bitácora:
// lo que no nace comprimido, en gzip de nivel 9.
//
// LO QUE ESTO NO VE. Las imágenes del primer pintado no se deducen del HTML: las pide
// el bundle al montar, y van por nombre en `IMAGENES_DEL_PINTADO`. Una imagen NUEVA en
// el primer pintado solo la ve `diagPUE 1.8`, que sigue en `completo` y dice la
// diferencia entre las dos cifras (`1.8f`). Una de la lista que desaparezca es error de
// instrumento: esta lista no envejece callada.
//
// PES-1 · INV-30 sigue en 200, y la meta es 185: los 15 de margen son para lo que la
// ruta sume a la entrada. Toda pantalla nueva nace diferida (INV-84).
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { gzipSync } from 'node:zlib'
import { ErrorInstrumento } from './nucleo.mjs'
import { RAIZ } from './fuente.mjs'

export const TECHO_CRITICO_KIB = 200
export const IMAGENES_DEL_PINTADO = Object.freeze(['ajilei-isotipo', 'reverso_carta'])

const YA_COMPRIMIDO = /\.(webp|jpe?g|png|gif|mp3|mp4|woff2?|avif)$/i
const BLOQUEAN = /^(?:stylesheet|modulepreload|preload|icon)$/i

const atributo = (etiqueta, nombre) => etiqueta.match(new RegExp(`\\s${nombre}=["']([^"']*)["']`, 'i'))?.[1] ?? null

/** Las rutas que el HTML pide antes de pintar: sus scripts y sus `<link>` que cuentan. */
export function rutasDelHtml(html) {
  const sinComentarios = html.replace(/<!--[\s\S]*?-->/g, '')
  const scripts = [...sinComentarios.matchAll(/<script\b[^>]*>/gi)].map((m) => atributo(m[0], 'src'))
  const enlaces = [...sinComentarios.matchAll(/<link\b[^>]*>/gi)]
    .filter((m) => BLOQUEAN.test(atributo(m[0], 'rel') ?? ''))
    .map((m) => atributo(m[0], 'href'))
  return [...scripts, ...enlaces].filter(Boolean)
}

/** Los trozos que un módulo importa de forma ESTÁTICA: un `import()` no viaja antes de pintar. */
export function importsEstaticos(js) {
  return [...js.matchAll(/\bimport\s*(?:[\w$*{}\s,]+?\s*from\s*)?["']\.\/([^"']+\.js)["']/g)].map((m) => m[1])
}

const tipoDe = (ruta) => (ruta === '/' ? 'html' : /\.m?js$/.test(ruta) ? 'js' : /\.css$/.test(ruta) ? 'css' : 'resto')

/** Lo que pesa un recurso en el cable. */
export function pesoEnCable(ruta, bytes) {
  return YA_COMPRIMIDO.test(ruta) ? bytes.length : gzipSync(bytes, { level: 9 }).length
}

/**
 * Pesa el camino crítico de un `dist/`. Devuelve `{ recursos, cable, crudo, porTipo }`,
 * en bytes. Lo que debería existir y no existe lanza `ErrorInstrumento`.
 */
export function pesarDist(dist = join(RAIZ, 'dist')) {
  const leer = (ruta) => {
    const abs = join(dist, ruta)
    if (!existsSync(abs)) throw new ErrorInstrumento(`1.8b: falta ${ruta} en ${dist}. ¿Se compiló?`)
    return readFileSync(abs)
  }
  const html = leer('index.html')
  const rutas = new Map([['/', html]])
  const pendientes = rutasDelHtml(html.toString('utf8'))

  const assets = existsSync(join(dist, 'assets')) ? readdirSync(join(dist, 'assets')) : []
  for (const nombre of IMAGENES_DEL_PINTADO) {
    const hallados = assets.filter((a) => a.startsWith(`${nombre}-`) && a.endsWith('.svg'))
    if (hallados.length !== 1) throw new ErrorInstrumento(`1.8b: «${nombre}» debería ser un SVG en assets/, y hay ${hallados.length}. Actualiza IMAGENES_DEL_PINTADO`)
    pendientes.push(`/assets/${hallados[0]}`)
  }

  while (pendientes.length) {
    const ruta = pendientes.shift()
    if (rutas.has(ruta)) continue
    const bytes = leer(ruta)
    rutas.set(ruta, bytes)
    if (tipoDe(ruta) === 'js') {
      const carpeta = ruta.slice(0, ruta.lastIndexOf('/') + 1)
      pendientes.push(...importsEstaticos(bytes.toString('utf8')).map((n) => `${carpeta}${n}`))
    }
  }

  const recursos = [...rutas].map(([ruta, bytes]) => ({ ruta, tipo: tipoDe(ruta), crudo: bytes.length, cable: pesoEnCable(ruta, bytes) }))
  const suma = (lista, campo) => lista.reduce((n, r) => n + r[campo], 0)
  const porTipo = Object.fromEntries(['html', 'js', 'css', 'resto'].map((t) => [t, suma(recursos.filter((r) => r.tipo === t), 'cable')]))
  return { recursos, cable: suma(recursos, 'cable'), crudo: suma(recursos, 'crudo'), porTipo }
}

// PES-1 §3-G · `1.8f` sale roja si las dos cifras se separan: desde aquí, una imagen
// nueva en el primer pintado es un rojo y no una línea que nadie lee. La Fase 0 midió
// un ruido de cero en cinco corridas.
export const TOLERANCIA_1_8F_BYTES = 1024

/** ¿El navegador y `pesarDist` cuentan lo mismo? */
export const instrumentosCoinciden = (navegador, sinNavegador) => Math.abs(navegador - sinNavegador) < TOLERANCIA_1_8F_BYTES

/** ¿Está dentro del techo? */
export const dentroDelTecho = (cable) => cable <= TECHO_CRITICO_KIB * 1024
