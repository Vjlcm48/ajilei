// ── RNK-1 1e · El contador de SumaMente, en el aparato ──────────────────────
// Rector: AJILEI_RNK-1_Fase1e_v1.0.md §0 y §2.2. Molde de `saldoRecordado.js`.
//
// UNA entrada, `{ n, dia }`, bajo `ajilei.sumamente` (censada en INV-12,
// `scripts/testClavesAlmacen.test.js`). Vive en el aparato a propósito: dos
// teléfonos cuentan aparte y borrar los datos del sitio reinicia. No es dinero
// ni puntos: un jugador que la toque con F12 sólo consigue ver el video antes,
// o no verlo.
//
// El almacén puede fallar o venir vacío (navegación privada, cuota, sin
// `localStorage`): todo va protegido, nunca lanza, y un fallo se lee como
// «n = 0, ningún día gastado».

const CLAVE = 'ajilei.sumamente'

const almacenDelNavegador = () => {
  try { return globalThis.localStorage ?? null } catch { return null }
}

const DIA = /^\d{4}-\d{2}-\d{2}$/

/** @param {() => Storage|null} [almacen] */
export function crearSumaContador(almacen = almacenDelNavegador) {
  return {
    /** `{ n, dia }`; con basura o sin almacén, `{ n: 0, dia: null }`. */
    leer() {
      try {
        const crudo = almacen()?.getItem(CLAVE)
        if (!crudo) return { n: 0, dia: null }
        const r = JSON.parse(crudo)
        const n = Number.isInteger(r?.n) && r.n >= 0 ? r.n : 0
        const dia = typeof r?.dia === 'string' && DIA.test(r.dia) ? r.dia : null
        return { n, dia }
      } catch {
        return { n: 0, dia: null }
      }
    },
    escribir({ n, dia }) {
      try { almacen()?.setItem(CLAVE, JSON.stringify({ n, dia: dia ?? null })) } catch { /* sin almacén se cuenta desde 0 */ }
    },
  }
}

export const sumaContador = crearSumaContador()
