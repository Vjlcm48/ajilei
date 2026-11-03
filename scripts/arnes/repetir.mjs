// ── arnes/repetir.mjs · ARN-4 A5 · repetir ante un rojo de foto ──────────────
// Rector: AJILEI_ARN-4_Tanda4b_v1.0.md §4. Un redibujado espontáneo de Chromium
// puede poner roja una foto sin que nada cambie (VIS-1 midió Δ 57 en 3–21 píxeles,
// por encima del tope de 40 de `TOLERANCIA_CAP`). Una foto fuera del umbral se
// repite hasta dos veces; si alguna vuelve dentro, es verde con su nota. Si ninguna
// vuelve, es rojo como siempre. EL UMBRAL NO SE AFLOJA, y el ruido no se calla: sale
// en la línea de quien lo mide y en el resumen del modo (`terminar`, `comun.mjs`).

export const REPETICIONES_FOTO = 2

const cuenta = { comparaciones: 0, conRuido: [] }

export const notaRuido = (n) => `ruido, ${n} ${n === 1 ? 'repetición' : 'repeticiones'}`

/** Deja constancia de una foto que volvió al umbral tras `n` repeticiones. */
export function anotarRuido(etiqueta, n) {
  const nota = notaRuido(n)
  cuenta.conRuido.push({ etiqueta, n })
  console.log(`  · ${etiqueta}: ${nota}`)
  return nota
}

/**
 * Toma y juzga. `tomar(i)` hace la captura y su comparación (`i` = 0 la primera);
 * `dentro(valor)` es el umbral, sin tocar.
 * @returns {Promise<{valor:any, dentro:boolean, repeticiones:number, nota:string|null}>}
 *   `valor` es el de la última toma, y `nota` solo existe si un rojo volvió al umbral.
 */
export async function conRepeticion(etiqueta, tomar, dentro, tope = REPETICIONES_FOTO) {
  cuenta.comparaciones++
  let valor = await tomar(0)
  let esta = dentro(valor)
  let repeticiones = 0
  while (!esta && repeticiones < tope) {
    repeticiones++
    valor = await tomar(repeticiones)
    esta = dentro(valor)
  }
  const nota = esta && repeticiones ? anotarRuido(etiqueta, repeticiones) : null
  return { valor, dentro: esta, repeticiones, nota }
}

/** La línea del resumen del modo, o `null` si no se comparó ninguna foto. */
export function resumenRuido() {
  if (!cuenta.comparaciones && !cuenta.conRuido.length) return null
  const n = cuenta.conRuido.reduce((a, r) => a + r.n, 0)
  return `· ruido de fotos: ${cuenta.conRuido.length} de ${cuenta.comparaciones} comparaciones, ${n} ${n === 1 ? 'repetición' : 'repeticiones'}`
}

/** Vuelve a cero la cuenta. Solo para las pruebas. */
export function reiniciarRuido() {
  cuenta.comparaciones = 0
  cuenta.conRuido = []
}
