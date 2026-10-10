import { supabase } from './supabase'

// ── ECO-1d · La puerta del cliente a la constancia ──────────────────────────
// Rector: AJILEI_ECO-1_Fase1d_v1.0.md §2.2. Molde de `mesaIAApi.js`: envoltorio
// delgado, sin estado y sin reglas. Llama a `marcar_ingreso()` (migración
// `20261009105658_eco1d_constancia_limites_valvula.sql`) y traduce su
// `constancia_resultado` a camelCase.
//
// NUNCA RECHAZA. Una red caída, un 500 o una excepción del SDK llegan como
// `{ codigo: 'red' }`. `marcar_ingreso` es idempotente por día (la segunda del
// día es `ya_marcado` y la clave del cobro es por jugador y día), así que
// preguntar otra vez nunca paga dos veces.
//
// El cliente entra por parámetro para que el banco imitado del bypass cambie
// SÓLO la fuente (`dev/billeteraFalsa.simulacionConstancia`).

export const CODIGO_RED = 'red'

const num = (v) => {
  if (v === null || v === undefined) return null
  const n = typeof v === 'number' ? v : Number(v)
  return Number.isFinite(n) ? n : null
}

/** Un `constancia_resultado` de PostgREST → el objeto del cliente. */
export function traducirConstancia(data) {
  const fila = Array.isArray(data) ? data[0] : data
  if (!fila || typeof fila !== 'object' || typeof fila.codigo !== 'string') return { codigo: CODIGO_RED }
  return {
    codigo: fila.codigo,
    racha: num(fila.racha) ?? 0,
    diaDelCiclo: num(fila.dia_del_ciclo) ?? 0,
    cobrado: num(fila.cobrado) ?? 0,
    saldo: num(fila.saldo),
    // PostgREST da la fecha como 'AAAA-MM-DD'; se recorta por si llegara con hora.
    dia: typeof fila.dia === 'string' ? fila.dia.slice(0, 10) : null,
  }
}

export function crearConstanciaApi(cliente = supabase) {
  return {
    marcar() {
      let llamada
      try {
        llamada = cliente.rpc('marcar_ingreso')
      } catch (e) {
        console.warn('ECO-1d: marcar_ingreso no salió —', String(e?.message ?? e))
        return Promise.resolve({ codigo: CODIGO_RED })
      }
      return Promise.resolve(llamada)
        .then(({ data, error } = {}) => {
          if (error) {
            console.warn('ECO-1d: marcar_ingreso falló —', error.code ?? '(sin código)', error.message)
            return { codigo: CODIGO_RED }
          }
          return traducirConstancia(data)
        })
        .catch((e) => {
          console.warn('ECO-1d: marcar_ingreso no contestó —', String(e?.message ?? e))
          return { codigo: CODIGO_RED }
        })
    },
  }
}

export const constanciaApi = crearConstanciaApi()
