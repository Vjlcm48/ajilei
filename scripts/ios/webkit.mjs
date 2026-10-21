// ── IOS-1 1f · el modo `webkit` de diagDSK ──────────────────────────────────
// Rector: AJILEI_IOS-1_Fase1f_v1.0.md §1 T4. Vive en su módulo, como `tam`;
// diagDSK solo lo llama y lee su veredicto por `verde`.
//
// La misma matriz de `tam` (scripts/ios/tam.mjs), pero en el WebKit de
// Playwright y en los tamaños de Apple: el iPad mini 6 con el alto útil de
// Safari de la Fase 0 (§C.2), el iPad de 11" en horizontal y el iPhone 17 Pro
// Max. Contra `vite preview` (4173), con la sesión simulada de `contextoCap`.
//
//   webkit.1  las tres pantallas de la carcasa (Retar, Retar con el video,
//             Salas, Armar mesa): el botón dorado entero y tocable, la caja
//             encima, ningún tocable pisa a otro, 0 px de filas bajo el botón
//             (salvo acostado, que se informa) y ningún tocable NUEVO o MOVIDO
//             por debajo de 44
//   webkit.2  el lobby: ningún tocable montado sobre otro
//   consola   sin errores de página
//
// ── LO QUE WEBKIT NO SIMULA: LAS FRANJAS DEL ÁREA SEGURA ───────────────────
// En el iPhone acostado, Safari no deja a la página las franjas de la isla de
// la cámara (sin `viewport-fit=cover`, index.html:9): la ventana de la página
// mide unos 832 de ancho, no 956. El WebKit de Playwright no hace eso: a
// 956×440 la página mide 956 y sale en dos columnas, cuando el aparato da una.
// Por eso las celdas del iPhone acostado se miden y se enseñan, pero salen
// marcadas como LIMITACIÓN y no cuentan para el verde. El aviso va fijo en la
// salida. (Tampoco tiene CDP ni arrastre, y en Windows da `maxTouchPoints` 0:
// la Fase 0, §C.7.)

import { webkit } from 'playwright-core'
import { matriz } from './tam.mjs'

export const AVISO_WEBKIT = 'WebKit no simula las franjas del área segura: el iPhone acostado no queda medido de verdad'

export const TAMANOS_WEBKIT = Object.freeze([
  // Las dos primeras son la estimación de IOS-1 (se conservan con su nombre);
  // TAB-1 1e añade el alto útil MEDIDO en las fotos (Fase 0 TF-3, lámina 1a §3.0).
  { id: '744x1026', w: 744, h: 1026, tactil: true, n: 'iPad mini 6 vertical, Safari con barras (estimación de IOS-1)' },
  { id: '1133x637', w: 1133, h: 637, tactil: true, n: 'iPad mini 6 horizontal, Safari con barras (estimación de IOS-1)' },
  { id: '744x1047', w: 744, h: 1047, tactil: true, n: 'iPad mini 6 vertical, Safari con barras (medido)' },
  { id: '744x1100', w: 744, h: 1100, tactil: true, n: 'iPad mini 6 vertical, app instalada (medido)' },
  { id: '1133x658', w: 1133, h: 658, tactil: true, n: 'iPad mini 6 horizontal, Safari con barras (medido)' },
  { id: '1133x716', w: 1133, h: 716, tactil: true, n: 'iPad mini 6 horizontal, pantalla completa (medido)' },
  { id: '1180x713', w: 1180, h: 713, tactil: true, n: 'iPad 11" horizontal, Safari' },
  { id: '440x956', w: 440, h: 956, tactil: true, n: 'iPhone 17 Pro Max vertical' },
  { id: '956x440', w: 956, h: 440, tactil: true, acostado: true, franjas: true, n: 'iPhone 17 Pro Max acostado, ventana entera' },
  { id: '956x330', w: 956, h: 330, tactil: true, acostado: true, franjas: true, n: 'iPhone 17 Pro Max acostado, con las barras de Safari' },
])
export const ESTADOS_WEBKIT = Object.freeze(['retar', 'retar-video', 'salas', 'armar', 'lobby'])
const PISO = 44

function juzgar(c) {
  if (!c.medida) return { ok: false, motivo: 'no medida' }
  if (c.estado === 'lobby') {
    return c.solapes.length ? { ok: false, motivo: `solapes: ${c.solapes.join('; ')}` } : { ok: true }
  }
  const motivos = []
  if (!c.botonVisible) motivos.push('botón no entero')
  if (!c.cajaBien) motivos.push('caja')
  if (c.solapes.length) motivos.push(`solapes: ${c.solapes.join('; ')}`)
  if (!c.acostado && c.filas > 1) motivos.push(`filas ${c.filas}`)
  if (c.menor && c.menor.lado < PISO - 0.01) motivos.push(`${c.menor.k} ${c.menor.lado} < 44`)
  return motivos.length ? { ok: false, motivo: motivos.join(' · ') } : { ok: true }
}

/** Corre la matriz en WebKit. Devuelve `{ verde, puntos, celdas, aviso, resumen }`. */
export async function runWebkit({ base, tamanos = TAMANOS_WEBKIT, estados = ESTADOS_WEBKIT } = {}) {
  const nav = await webkit.launch({ headless: true })
  const version = nav.version()
  const errores = []
  let celdas = []
  try {
    celdas = await matriz(nav, { base, tamanos, estados, errores })
  } finally {
    await nav.close()
  }
  const porId = Object.fromEntries(tamanos.map((t) => [t.id, t]))
  for (const c of celdas) {
    Object.assign(c, juzgar(c))
    c.limitacion = Boolean(porId[c.tam]?.franjas)
  }
  const cuentan = celdas.filter((c) => !c.limitacion)
  const fallosDe = (filtro) => cuentan.filter((c) => filtro(c) && !c.ok).map((c) => `${c.estado} ${c.tam} (${c.motivo})`)
  const puntos = {
    'webkit.1': { fallos: fallosDe((c) => c.estado !== 'lobby') },
    'webkit.2': { fallos: fallosDe((c) => c.estado === 'lobby') },
    consola: { fallos: errores },
  }
  for (const p of Object.values(puntos)) p.ok = p.fallos.length === 0
  const verde = Object.values(puntos).every((p) => p.ok)
  const resumen = `${verde ? 'VERDE' : 'ROJO'} (WebKit ${version}) · `
    + Object.entries(puntos).map(([k, p]) => `${k} ${p.ok ? '✓' : `✗ (${p.fallos.length})`}`).join(' · ')
    + ` · ${cuentan.length} celdas que cuentan, ${celdas.length - cuentan.length} con LIMITACIÓN`
  console.log(`── WEBKIT · ${resumen}`)
  console.log(`   ⚠ ${AVISO_WEBKIT}`)
  for (const t of tamanos) {
    const fila = celdas.filter((c) => c.tam === t.id)
    const marca = t.franjas ? 'LIMITACIÓN' : (fila.every((c) => c.ok) ? '✓' : '✗')
    const cifras = fila.map((c) => `${c.estado} ${c.estado === 'lobby' ? (c.solapes?.length ? 'solapes' : 'ok') : `${c.filas > 1 ? `${c.filas} px` : 'cabe'}${c.dosColumnas ? ' 2col' : ''}`}`).join(' · ')
    console.log(`   ${marca.padEnd(10)} ${t.id.padEnd(9)} ${t.n} · botón ${fila.find((c) => c.boton)?.boton ?? '—'} · ${cifras}`)
  }
  for (const [k, p] of Object.entries(puntos)) if (p.fallos.length) console.log(`   ${k} ✗ ${p.fallos.slice(0, 10).join(' · ')}`)
  return { verde, puntos, celdas, aviso: AVISO_WEBKIT, version, resumen }
}
