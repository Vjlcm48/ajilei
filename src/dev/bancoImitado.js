// ── ECO-1c · El banco imitado: el contrato SQL de la 1c, en JavaScript ──────
// Rector: AJILEI_ECO-1_Fase1c_v1.0.md §3 (STOP-2: «el código del cliente y el
// arnés pueden avanzar contra las rutas que imitan a Supabase») y el plan
// aprobado del STOP-1 (§6, 1c-i).
//
// UN SOLO MODELO para tres usos, para que no haya dos imitaciones que se
// separen sin que nadie lo vea:
//   · la billetera falsa del bypass (`dev/billeteraFalsa.js`, desde la 1c-iii);
//   · las rutas que imitan a Supabase en el arnés (`scripts/arnes/nucleo.mjs`,
//     `respuestaRpc`), que contestan con `rpc()` de aquí;
//   · las pruebas de contrato (`bancoImitado.test.js`), que repiten los casos
//     del guion `supabase/pruebas/eco1c_verificacion.sql` con las MISMAS
//     cifras. Si el modelo y el SQL se separan, ahí sale rojo.
//
// Es la migración `20261008220239_eco1c_mesas_ia.sql` leída función a función,
// para UNA cuenta (la de la sesión): mismas validaciones, en el mismo orden, y
// mismos códigos. `rpc(nombre, params)` devuelve `{ data, error }` con la forma
// de PostgREST: el compuesto `mesa_ia_resultado` llega como objeto con las
// claves en snake_case, y `mi_mesa_ia` como lista.
//
// PURO: sin `import.meta`, sin DOM y sin red, para que el arnés (Node) lo
// importe tal cual. En la app sólo lo importa código detrás de la puerta doble
// `DEV && VITE_AUTH_BYPASS`, y la guardia de `dist/` busca su marca.

export const MARCA_BANCO_IMITADO = 'ajilei:banco-imitado'

// ── Las constantes, copiadas del SQL (migración §1), NO del cliente ─────────
// A propósito: si alguien mueve una cifra del cliente y no la del servidor, la
// prueba de espejo (`bancoImitado.test.js`) compara las tres —SQL, este modelo
// y el cliente— y lo dice.
export const APUESTAS_SQL = Object.freeze({
  basico: [50, 100, 150, 250],
  avanzado: [100, 200, 300, 500],
  pro: [200, 400, 600, 1000],
})
export const PISO_SQL = 10
export const TECHO_SQL = 50
export const FACTOR_IA_SQL = 1.5
export const SILENCIO_RECOGIDA_MS = 10 * 60 * 1000

const techoMesa = (apuesta) => TECHO_SQL * apuesta
const pilaIA = (entrada, apuesta) => Math.min(Math.round(entrada * FACTOR_IA_SQL), techoMesa(apuesta))
const esEntero = (n) => Number.isInteger(n)

/**
 * @param {object} [opciones]
 * @param {number} [opciones.saldo=5000]  el saldo de la billetera al nacer.
 * @param {() => number} [opciones.ahora]  el reloj, en ms (para envejecer mesas).
 * @param {boolean} [opciones.entradaDeMolde=false]  admite una entrada bajo el
 *   piso o no múltiplo de la apuesta. SÓLO para los moldes de humano de `?apu=`
 *   (`allinHumano`, `recarga`, `quiebra`; P-6), que sientan una pila que no es
 *   una entrada legal y tienen que cobrar lo que de verdad sentaron. El SQL no
 *   tiene esta puerta.
 */
export function crearBanco({ saldo = 5000, ahora = () => Date.now(), entradaDeMolde = false } = {}) {
  const b = {
    saldo,
    mesas: new Map(),          // id → fila de `mesas_ia`
    record: new Map(),         // `${reto}:${vivos}` → { jugadas, ganadas_humano, ganadas_ia }
    libro: [],                 // { tipo, monto, saldo_tras, clave, ref }
    ultimoId: 0,
  }

  // ── El libro (1a): una línea por cambio, clave única ─────────────────────
  function aplicar(tipo, monto, clave, ref) {
    if (b.libro.some((l) => l.clave === clave)) return { aplicado: true, motivo: 'repetido' }
    if (b.saldo + monto < 0) return { aplicado: false, motivo: 'saldo_insuficiente' }
    b.saldo += monto
    b.libro.push({ tipo, monto, saldo_tras: b.saldo, clave, ref })
    return { aplicado: true, motivo: 'aplicado' }
  }

  const abierta = () => [...b.mesas.values()].find((m) => m.estado === 'abierta') ?? null

  function respuesta(codigo, mesa = null, anteriorCerrada = false, anteriorCobro = 0) {
    return {
      codigo,
      mesa_id: mesa?.id ?? null,
      saldo: b.saldo,
      pila: mesa?.pila_informada ?? 0,
      techo: mesa?.techo_cobro ?? 0,
      seq: mesa?.seq_informada ?? 0,
      cobrado: mesa?.cobrado ?? 0,
      anterior_cerrada: anteriorCerrada,
      anterior_cobro: anteriorCobro,
      motivo_cierre: mesa?.motivo_cierre ?? null,
    }
  }

  // C4 · `cerrar_partida_abierta`
  function cerrarAbierta(motivo) {
    const m = abierta()
    if (!m) return { cerrada: false, mesa_id: null, cobrado: 0 }
    const cobro = Math.min(m.pila_informada, m.techo_cobro)
    if (cobro > 0) aplicar('abandono_ia', cobro, `abandono_ia:${m.id}`, m.id)
    Object.assign(m, { estado: 'cerrada', motivo_cierre: motivo, cobrado: cobro, cerrada_en: ahora() })
    return { cerrada: true, mesa_id: m.id, cobrado: cobro }
  }

  function sentarse({ p_reto, p_jugadores, p_apuesta, p_entrada, p_token, p_dispositivo = null }) {
    if ([p_reto, p_jugadores, p_apuesta, p_entrada, p_token].some((v) => v === null || v === undefined)) {
      return respuesta('argumento_invalido')
    }
    const previa = [...b.mesas.values()].find((m) => m.token_apertura === p_token)
    if (previa) {
      return respuesta(previa.estado === 'abierta' ? 'repetido' : 'mesa_cerrada', previa,
        previa.reemplazo_de !== null, previa.reemplazo_cobro)
    }
    if (!(p_reto in APUESTAS_SQL)) return respuesta('reto_invalido')
    if (!(p_jugadores >= 2 && p_jugadores <= 5)) return respuesta('jugadores_invalidos')
    if (!APUESTAS_SQL[p_reto].includes(p_apuesta)) return respuesta('apuesta_invalida')
    const legal = esEntero(p_entrada) && p_entrada % p_apuesta === 0 && p_entrada >= PISO_SQL * p_apuesta
    const deMolde = entradaDeMolde && esEntero(p_entrada) && p_entrada > 0
    if (!(legal || deMolde) || p_entrada > techoMesa(p_apuesta)) return respuesta('entrada_invalida')

    const vieja = abierta()
    const vuelve = vieja ? Math.min(vieja.pila_informada, vieja.techo_cobro) : 0
    if (p_entrada > b.saldo + vuelve) return respuesta('saldo_insuficiente')

    const cierre = cerrarAbierta('reemplazada')
    const id = `mesa-imitada-${++b.ultimoId}`
    aplicar('entrada_ia', -p_entrada, `entrada_ia:${id}`, id)
    const mesa = {
      id, reto: p_reto, jugadores: p_jugadores, apuesta: p_apuesta, entrada: p_entrada,
      recargado: 0, recargas: 0,
      techo_cobro: p_entrada + (p_jugadores - 1) * pilaIA(p_entrada, p_apuesta),
      pila_informada: p_entrada, seq_informada: 0, anomalias: 0,
      estado: 'abierta', motivo_cierre: null, cobrado: null,
      token_apertura: p_token, dispositivo: p_dispositivo === null ? null : String(p_dispositivo).slice(0, 64),
      reemplazo_de: cierre.cerrada ? cierre.mesa_id : null, reemplazo_cobro: cierre.cobrado ?? 0,
      abierta_en: ahora(), ultimo_aviso_en: ahora(), cerrada_en: null,
    }
    b.mesas.set(id, mesa)
    return respuesta('ok', mesa, cierre.cerrada, cierre.cobrado)
  }

  function mesaPropia(id) {
    return b.mesas.get(id) ?? null
  }

  function recargar({ p_mesa, p_monto, p_seq }) {
    if ([p_mesa, p_monto, p_seq].some((v) => v === null || v === undefined)) return respuesta('argumento_invalido')
    const m = mesaPropia(p_mesa)
    if (!m) return respuesta('sin_mesa')
    if (m.estado !== 'abierta') return respuesta('mesa_cerrada', m)
    const clave = `recarga_ia:${m.id}:${p_seq}`
    if (b.libro.some((l) => l.clave === clave)) return respuesta('repetido', m)
    if (p_seq <= m.seq_informada) return respuesta('seq_viejo', m)
    if (!esEntero(p_monto) || p_monto <= 0 || p_monto % m.apuesta !== 0) return respuesta('monto_invalido', m)
    if (m.pila_informada + p_monto > techoMesa(m.apuesta)) return respuesta('sobre_techo', m)
    const r = aplicar('recarga_ia', -p_monto, clave, m.id)
    if (!r.aplicado) return respuesta(r.motivo, m)
    m.recargado += p_monto
    m.recargas += 1
    m.techo_cobro += p_monto + (m.jugadores - 1) * techoMesa(m.apuesta)
    m.pila_informada += p_monto
    m.seq_informada = p_seq
    m.ultimo_aviso_en = ahora()
    return respuesta('ok', m)
  }

  function informar({ p_mesa, p_seq, p_pila, p_fin_vivos = null, p_fin_gano = null }) {
    if ([p_mesa, p_seq, p_pila].some((v) => v === null || v === undefined) || p_pila < 0) {
      return respuesta('argumento_invalido')
    }
    const m = mesaPropia(p_mesa)
    if (!m) return respuesta('sin_mesa')
    if (m.estado !== 'abierta') return respuesta('mesa_cerrada', m)
    if (p_seq <= m.seq_informada) return respuesta('repetido', m)
    let anomalias = 0
    let pila = p_pila
    if (pila > m.techo_cobro) { pila = m.techo_cobro; anomalias++ }
    const fin = p_fin_vivos !== null || p_fin_gano !== null
    if (fin) {
      if (p_fin_vivos === null || p_fin_gano === null || p_fin_vivos < 2 || p_fin_vivos > m.jugadores) {
        anomalias++
      } else {
        const k = `${m.reto}:${p_fin_vivos}`
        const r = b.record.get(k) ?? { jugadas: 0, ganadas_humano: 0, ganadas_ia: 0 }
        b.record.set(k, {
          jugadas: r.jugadas + 1,
          ganadas_humano: r.ganadas_humano + (p_fin_gano ? 1 : 0),
          ganadas_ia: r.ganadas_ia + (p_fin_gano ? 0 : 1),
        })
      }
    }
    m.pila_informada = pila
    m.seq_informada = p_seq
    m.anomalias += anomalias
    m.ultimo_aviso_en = ahora()
    return respuesta('ok', m)
  }

  function salir({ p_mesa, p_fichas, p_seq }) {
    if ([p_mesa, p_fichas, p_seq].some((v) => v === null || v === undefined) || p_fichas < 0) {
      return respuesta('argumento_invalido')
    }
    const m = mesaPropia(p_mesa)
    if (!m) return respuesta('sin_mesa')
    if (m.estado !== 'abierta') return respuesta(m.motivo_cierre === 'salida' ? 'repetido' : 'mesa_cerrada', m)
    if (p_seq <= m.seq_informada) return respuesta('seq_viejo', m)
    const cobro = Math.min(p_fichas, m.techo_cobro)
    if (cobro > 0) {
      const r = aplicar('salida_ia', cobro, `salida_ia:${m.id}`, m.id)
      if (!r.aplicado) return respuesta(r.motivo, m)
    }
    Object.assign(m, {
      estado: 'cerrada', motivo_cierre: 'salida', cobrado: cobro, pila_informada: cobro,
      seq_informada: p_seq, anomalias: m.anomalias + (p_fichas > m.techo_cobro ? 1 : 0),
      ultimo_aviso_en: ahora(), cerrada_en: ahora(),
    })
    return respuesta('ok', m)
  }

  function miMesa() {
    const m = abierta()
    return m ? [respuesta('ok', m)] : []
  }

  function recoger({ p_dispositivo = null } = {}) {
    const m = abierta()
    if (!m) return respuesta('ninguna')
    const mismo = p_dispositivo !== null && m.dispositivo === String(p_dispositivo).slice(0, 64)
    const callada = m.ultimo_aviso_en < ahora() - SILENCIO_RECOGIDA_MS
    if (!(mismo || callada)) return respuesta('viva', m)
    const cierre = cerrarAbierta('abandono')
    return respuesta('recogida', b.mesas.get(cierre.mesa_id))
  }

  const RPC = {
    mi_billetera: () => b.saldo,
    sentarse_ia: sentarse,
    recargar_ia: recargar,
    informar_pila: informar,
    salir_ia: salir,
    mi_mesa_ia: miMesa,
    recoger_mesa_ia: recoger,
  }

  return {
    marca: MARCA_BANCO_IMITADO,
    /** Como `supabase.rpc`: una promesa de `{ data, error }`. */
    rpc(nombre, params = {}) {
      const f = RPC[nombre]
      if (!f) return Promise.resolve({ data: null, error: { code: 'PGRST202', message: `sin función ${nombre}` } })
      return Promise.resolve({ data: f(params ?? {}), error: null })
    },
    /** La misma llamada, síncrona: para el arnés y las pruebas. */
    llamar(nombre, params = {}) {
      return RPC[nombre]?.(params ?? {}) ?? null
    },
    // ── Lo que el guion hace por fuera de las funciones, y C6 ──────────────
    /** Otro dispositivo se sienta con la misma cuenta: la abierta se cierra
     *  como `reemplazada` y se cobra, como hace `sentarse_ia` (C6). */
    cerrarDesdeOtroDispositivo() {
      return cerrarAbierta('reemplazada')
    },
    /** Lo que hace `ajuste_admin` en el SQL Editor: el saldo cambia fuera de la
     *  partida (el arnés lo usa para que el servidor «sepa otra cosa»). */
    ajusteAdmin(monto) {
      if (!Number.isInteger(monto) || monto === 0 || b.saldo + monto < 0) return false
      aplicar('ajuste_admin', monto, `admin:${b.libro.length + 1}`, null)
      return true
    },
    /** Lo que el guion hace con `update … ultimo_aviso_en` (prueba 13). */
    envejecerAbierta(ms) {
      const m = abierta()
      if (m) m.ultimo_aviso_en -= ms
    },
    // Lecturas para las pruebas y el arnés. Copias: nadie toca el estado.
    get saldo() { return b.saldo },
    get libro() { return b.libro.map((l) => ({ ...l })) },
    get mesas() { return [...b.mesas.values()].map((m) => ({ ...m })) },
    get record() { return Object.fromEntries([...b.record].map(([k, v]) => [k, { ...v }])) },
  }
}
