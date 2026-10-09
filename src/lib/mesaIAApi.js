import { supabase } from './supabase'

// ── ECO-1c · La puerta del cliente a las mesas contra las IAS ───────────────
// Rector: AJILEI_ECO-1_Fase1c_v1.0.md §2.2. Molde de `billeteraApi.js`:
// envoltorio delgado, sin estado y sin reglas. Llama a las seis funciones de la
// migración `20261008220239_eco1c_mesas_ia.sql` y traduce su
// `mesa_ia_resultado` a un objeto con las claves en camelCase.
//
// NUNCA RECHAZA. Una red caída, un 500 o una excepción del SDK llegan como
// `{ codigo: 'red' }`, que es lo que la cola de la mesa sabe reintentar
// (`mesaIACore.destinoDe`). Distinguir «no llegó» de «llegó y falló» no se
// puede desde aquí, y no hace falta: todas las funciones son idempotentes por
// token o por `seq`, así que reintentar lo que sí llegó no cobra dos veces.
//
// El cliente entra por parámetro para que el banco imitado del bypass
// (`dev/bancoImitado.js`, vía `dev/billeteraFalsa.js`) cambie SÓLO la fuente,
// igual que en la billetera (ajuste 2 del rector a la 1b).

export const CODIGO_RED = 'red'

const num = (v) => {
  if (v === null || v === undefined) return null
  const n = typeof v === 'number' ? v : Number(v)
  return Number.isFinite(n) ? n : null
}

/** Un `mesa_ia_resultado` de PostgREST → el objeto del cliente. */
export function traducirResultado(data) {
  if (!data || typeof data !== 'object' || typeof data.codigo !== 'string') {
    return { codigo: CODIGO_RED }
  }
  return {
    codigo: data.codigo,
    mesaId: data.mesa_id ?? null,
    saldo: num(data.saldo),
    pila: num(data.pila),
    techo: num(data.techo),
    seq: num(data.seq),
    cobrado: num(data.cobrado) ?? 0,
    anteriorCerrada: data.anterior_cerrada === true,
    anteriorCobro: num(data.anterior_cobro) ?? 0,
    motivoCierre: data.motivo_cierre ?? null,
  }
}

export function crearMesaIAApi(cliente = supabase) {
  const llamar = (nombre, params, traducir = traducirResultado) => {
    let llamada
    try {
      llamada = cliente.rpc(nombre, params)
    } catch (e) {
      console.warn(`ECO-1c: ${nombre} no salió —`, String(e?.message ?? e))
      return Promise.resolve(traducir(null))
    }
    return Promise.resolve(llamada)
      .then(({ data, error } = {}) => {
        if (error) {
          console.warn(`ECO-1c: ${nombre} falló —`, error.code ?? '(sin código)', error.message)
          return traducir(null)
        }
        return traducir(data)
      })
      .catch((e) => {
        console.warn(`ECO-1c: ${nombre} no contestó —`, String(e?.message ?? e))
        return traducir(null)
      })
  }

  return {
    sentarse({ reto, jugadores, apuesta, entrada, token, dispositivo = null }) {
      return llamar('sentarse_ia', {
        p_reto: reto, p_jugadores: jugadores, p_apuesta: apuesta,
        p_entrada: entrada, p_token: token, p_dispositivo: dispositivo,
      })
    },
    recargar(mesa, monto, seq) {
      return llamar('recargar_ia', { p_mesa: mesa, p_monto: monto, p_seq: seq })
    },
    /** `fin` = `{ vivos, ganoHumano }` en el aviso de fin de mano; si no, nulo. */
    informar(mesa, seq, pila, fin = null) {
      return llamar('informar_pila', {
        p_mesa: mesa, p_seq: seq, p_pila: pila,
        p_fin_vivos: fin ? fin.vivos : null, p_fin_gano: fin ? fin.ganoHumano : null,
      })
    },
    salir(mesa, fichas, seq) {
      return llamar('salir_ia', { p_mesa: mesa, p_fichas: fichas, p_seq: seq })
    },
    recoger(dispositivo) {
      return llamar('recoger_mesa_ia', { p_dispositivo: dispositivo })
    },
    /** La mesa abierta, o `null`. Con red caída, `{ codigo: 'red' }`. */
    miMesa() {
      return llamar('mi_mesa_ia', undefined, (data) => {
        if (data === null) return { codigo: CODIGO_RED }
        const fila = Array.isArray(data) ? data[0] : data
        return fila ? traducirResultado(fila) : null
      })
    },
  }
}

export const mesaIAApi = crearMesaIAApi()
