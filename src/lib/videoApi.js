import { supabase } from './supabase'

// ── ECO-1g · La puerta del cliente al video de recompensa ───────────────────
// Rector: AJILEI_ECO-1_Fase1g_v1.0.md §2.2. Molde de `constanciaApi.js`:
// envoltorio delgado, sin estado y sin reglas. Llama a las tres funciones de la
// migración `20261012230807_eco1g_video.sql` y traduce sus respuestas a
// camelCase:
//   · `mi_video()`       → `estado()`   lo que pinta el contador, sin tocar nada
//   · `pedir_boleto()`   → `pedir()`    el boleto de un video
//   · `cobrar_boleto(id)`→ `cobrar(id)` el premio contra ese boleto, una vez
//
// NUNCA RECHAZA. Una red caída, un 500 o una excepción del SDK llegan como
// `{ codigo: 'red' }`. Cobrar es idempotente por boleto (S3), así que repetir
// la llamada nunca paga dos veces.
//
// Los instantes (`ahora`, `reinicio_en`, `vence_en`) llegan como texto de
// PostgREST y salen en milisegundos, o `null` si no se dejan leer.
//
// El cliente entra por parámetro para que el banco imitado del bypass cambie
// SÓLO la fuente (`dev/billeteraFalsa.simulacionVideo`).

export const CODIGO_RED = 'red'

const num = (v) => {
  if (v === null || v === undefined) return null
  const n = typeof v === 'number' ? v : Number(v)
  return Number.isFinite(n) ? n : null
}
// `new Date(null)` es la época, no una fecha inválida (la trampa de `relojCore`).
const instante = (v) => {
  if (v === null || v === undefined || v === '') return null
  const ms = new Date(v).getTime()
  return Number.isFinite(ms) ? ms : null
}
const fila = (data) => {
  const f = Array.isArray(data) ? data[0] : data
  return f && typeof f === 'object' && typeof f.codigo === 'string' ? f : null
}

/** Un `video_estado` de PostgREST → el objeto del cliente. */
export function traducirEstado(data) {
  const f = fila(data)
  if (!f) return { codigo: CODIGO_RED }
  return {
    codigo: f.codigo,
    quedan: num(f.quedan) ?? 0,
    tope: num(f.tope) ?? 0,
    ahora: instante(f.ahora),
    reinicioEn: instante(f.reinicio_en),
    premio: num(f.premio),
  }
}

/** Un `boleto_video_resultado` → el objeto del cliente. */
export function traducirBoleto(data) {
  const f = fila(data)
  if (!f) return { codigo: CODIGO_RED }
  return {
    codigo: f.codigo,
    boletoId: f.boleto_id ?? null,
    emitidoEn: instante(f.emitido_en),
    venceEn: instante(f.vence_en),
    ahora: instante(f.ahora),
    minimoS: num(f.minimo_s) ?? 0,
    quedan: num(f.quedan) ?? 0,
    reinicioEn: instante(f.reinicio_en),
  }
}

/** Un `cobro_video_resultado` → el objeto del cliente. */
export function traducirCobro(data) {
  const f = fila(data)
  if (!f) return { codigo: CODIGO_RED }
  return {
    codigo: f.codigo,
    cobrado: num(f.cobrado) ?? 0,
    saldo: num(f.saldo),
    quedan: num(f.quedan) ?? 0,
    reinicioEn: instante(f.reinicio_en),
    faltanS: num(f.faltan_s) ?? 0,
    premio: num(f.premio),
  }
}

export function crearVideoApi(cliente = supabase) {
  const llamar = (nombre, params, traducir) => {
    let llamada
    try {
      llamada = params ? cliente.rpc(nombre, params) : cliente.rpc(nombre)
    } catch (e) {
      console.warn(`ECO-1g: ${nombre} no salió —`, String(e?.message ?? e))
      return Promise.resolve({ codigo: CODIGO_RED })
    }
    return Promise.resolve(llamada)
      .then(({ data, error } = {}) => {
        if (error) {
          console.warn(`ECO-1g: ${nombre} falló —`, error.code ?? '(sin código)', error.message)
          return { codigo: CODIGO_RED }
        }
        return traducir(data)
      })
      .catch((e) => {
        console.warn(`ECO-1g: ${nombre} no contestó —`, String(e?.message ?? e))
        return { codigo: CODIGO_RED }
      })
  }
  return {
    estado: () => llamar('mi_video', null, traducirEstado),
    pedir: () => llamar('pedir_boleto', null, traducirBoleto),
    cobrar: (boletoId) => llamar('cobrar_boleto', { p_boleto: boletoId }, traducirCobro),
  }
}

export const videoApi = crearVideoApi()
