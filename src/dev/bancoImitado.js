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
// mismos códigos. ECO-1d le suma la `20261009105658_eco1d_constancia_limites_valvula.sql`:
// `marcar_ingreso`, los límites por minuto y la válvula, con sus pruebas de
// contrato y de espejo en el mismo archivo de pruebas. ECO-1g le suma la
// `20261012230807_eco1g_video.sql`: `mi_video`, `pedir_boleto` y `cobrar_boleto`
// (el video de recompensa contra un boleto), con las cuatro cifras del video y
// los dos límites nuevos. RNK-1b le suma la `20261024191731_rnk1a_libro_puntos.sql`:
// `informar_pila` con `p_fin_mano` y `p_fin_ajilei`, el libro de puntos, el
// total por jugador y las tres lecturas del ranking (`ranking_top`,
// `ranking_mio`, `mini_perfil`), contra unos cuantos jugadores sembrados.
// CFG-1 1b le suma la `20261030013000_cfg1b_perfil.sql`: el perfil propio
// (`pais`, `estado`, el freno de 30 días del nombre), `nombre_libre`,
// `mi_proximo_cambio` y el lugar en `ranking_top` y `mini_perfil`.
// TIE-1 1a le suma la `20261031150000_tie1a_inventario.sql`: la tabla
// `inventario` de la cuenta y `comprar_articulo`, `usar_articulo`,
// `elegir_tono` y `mi_inventario`, con el catálogo cerrado en SQL.
// `rpc(nombre, params)` devuelve `{ data, error }` con la forma
// de PostgREST: el compuesto `mesa_ia_resultado` llega como objeto con las
// claves en snake_case, y `mi_mesa_ia` y las lecturas del ranking como lista.
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
// ECO-1d · `limite_dinero()`, `bono_constancia_hc()` y `constancia_ciclo()`.
// ECO-1g · la 1g la redefine con los dos nombres del video.
export const LIMITES_SQL = Object.freeze({
  sentarse_ia: 10, recargar_ia: 20, salir_ia: 30, recoger_mesa_ia: 10, marcar_ingreso: 6,
  pedir_boleto: 10, cobrar_boleto: 20,
})
export const BONO_CONSTANCIA_SQL = 500
// CFG-1 1e · Mano actual de pago: `consultas_gratis()`, `precio_consulta(text)`
// y el tope por minuto de `consultar_mano` (va literal en la llamada a
// `contar_intento_dinero`, no en `limite_dinero`: por eso no está en
// LIMITES_SQL). El espejo los lee de `20261030193000_cfg1e_mano_actual.sql`.
export const CONSULTAS_GRATIS_SQL = 20
export const PRECIOS_CONSULTA_SQL = Object.freeze({ basico: 100, avanzado: 200, pro: 300, humanos: 500 })
export const LIMITE_CONSULTA_SQL = 30
// TIE-1 1a · el catálogo de la tienda (`inventario_tipo_valido`,
// `precio_articulo`, `articulo_con_tonos`, `articulo_gratis`) y el tope por
// minuto de `comprar_articulo`, literal en su llamada como el de la 1e. El
// espejo los lee de `20261031150000_tie1a_inventario.sql`.
export const TIPOS_INVENTARIO_SQL = Object.freeze(['tapete'])
export const PRECIOS_ARTICULO_SQL = Object.freeze({
  tapete: Object.freeze({ grafito: 10000, azul: 15000, vinotinto: 25000, tricolor: 50000 }),
})
export const CON_TONOS_SQL = Object.freeze({ tapete: Object.freeze(['grafito', 'azul', 'vinotinto']) })
export const GRATIS_SQL = Object.freeze({ tapete: 'verde' })
export const TONOS_SQL = Object.freeze(['claro', 'actual', 'oscuro'])
export const LIMITE_COMPRA_SQL = 30
// CFG-1 1b · el freno del nombre (`freno_nombre_hasta`: 30 días en UTC, que no
// tiene cambio de hora, así que son 30 × 24 h exactas), la forma del CHECK de
// SUP-2a, los códigos de estado de la lista sellada y una MUESTRA de los
// vedados (los de la casa y alguno más): el banco no es la autoridad de la
// lista, y el SQL no la duplica (`username_vedado`).
export const FRENO_NOMBRE_MS_SQL = 30 * 24 * 3600 * 1000
// CFG-1 1d · lo que el panel de Auth tiene puesto (leído por Victor, STOP-0), y
// los códigos y correos del simulacro. El espejo con `correoCore` va en las pruebas.
export const OTP_EXP_S_PANEL = 600
export const INTERVALO_ENVIO_S_PANEL = 60
export const CODIGO_ACTUAL_IMITADO = '111111'
export const CODIGO_NUEVO_IMITADO = '222222'
export const CORREOS_OCUPADOS_IMITADOS = Object.freeze(['test1976@gmail.com'])
export const FORMA_USERNAME_SQL = /^[A-Za-z0-9_]{6,15}$/
export const ESTADOS_VE_SQL = Object.freeze([
  'AMA', 'ANZ', 'APU', 'ARA', 'BAR', 'BOL', 'CAR', 'COJ', 'DEL', 'DC',
  'FAL', 'GUA', 'LGU', 'LAR', 'MER', 'MIR', 'MON', 'NES', 'POR', 'SUC',
  'TAC', 'TRU', 'YAR', 'ZUL'])
const VEDADOS_MUESTRA = ['admin', 'moderador', 'soporte', 'ajilei', 'heptacoin', 'sistema', 'oficial', 'pendejo', 'mierda', 'puta']
/** `normalizar_username` de SUP-2a: minúsculas, 0→o 1→i 3→e 4→a 5→s 7→t, sin `_`. */
export function normalizarUsernameSQL(txt) {
  const mapa = { 0: 'o', 1: 'i', 3: 'e', 4: 'a', 5: 's', 7: 't' }
  return String(txt).toLowerCase().replace(/[013457_]/g, (c) => mapa[c] ?? '')
}
const vedado = (txt) => {
  const n = normalizarUsernameSQL(txt)
  return VEDADOS_MUESTRA.some((w) => n.includes(w))
}
// El `hint` del freno: el ISO de `to_char(…, 'YYYY-MM-DD"T"HH24:MI:SS"Z"')`, sin milisegundos.
const isoSegundos = (ms) => new Date(Math.floor(ms / 1000) * 1000).toISOString().replace('.000Z', 'Z')
export const CICLO_CONSTANCIA_SQL = 3
// ECO-1g · `video_premio_hc()`, `video_tope_dia()`, `video_minimo_s()` y
// `video_vida_boleto()` (10 minutos, aquí en ms).
export const VIDEO_PREMIO_SQL = 500
export const VIDEO_TOPE_SQL = 8
export const VIDEO_MINIMO_S_SQL = 35
export const VIDEO_VIDA_MS_SQL = 10 * 60 * 1000
// RNK-1a · `puntos_reto_ia()`, `extra_ajilei()` e `ia_tope_manos_minuto()`. La
// tabla de humanos (`sentados + 3`) vive en el `check` del libro y aquí no hace
// falta: el banco, como el SQL de hoy, sólo escribe líneas `ias`.
export const PUNTOS_RETO_SQL = Object.freeze({ basico: 1, avanzado: 2, pro: 3 })
export const EXTRA_AJILEI_SQL = Object.freeze({ 0: 0, 51: 1, 52: 2 })
export const TOPE_MANOS_MINUTO_SQL = 12
/** `ranking_franja(puesto, total)`: ceil(puesto·20/total)·5, en enteros. */
export const franjaSQL = (puesto, total) => Math.floor((puesto * 20 + total - 1) / total) * 5

// RNK-1b · Jugadores de mentira para las lecturas del ranking, con cifras y
// fechas distintas (y un empate en cada ranking que decide la fecha). Sólo los
// usa quien los pide (`crearBanco({ sembrados })`); las fechas son relativas
// al reloj del banco al nacer (`…Hace`, en ms).
export const SEMBRADOS_DEMO = Object.freeze([
  Object.freeze({ username: 'Bachaquero_VE', puntos: 96, puntosHace: 9e7, saldo: 21400, saldoHace: 8e7 }),
  Object.freeze({ username: 'ElCatire88', puntos: 74, puntosHace: 8e7, saldo: 48700, saldoHace: 7e7 }),
  Object.freeze({ username: 'Yulimar77', puntos: 41, puntosHace: 6e7, saldo: 9800, saldoHace: 5e7 }),
  Object.freeze({ username: 'Mochima_21', puntos: 41, puntosHace: 5e7, saldo: 9800, saldoHace: 4e7 }),
  Object.freeze({ username: 'Turpial_Rojo', puntos: 11, puntosHace: 3e7, saldo: 3150, saldoHace: 2e7 }),
  Object.freeze({ username: 'Araguaney5', puntos: null, saldo: 2500, saldoHace: 1e7 }),
])

// `dia_chicago(ts)` de la 1a: la fecha en America/Chicago, con la zona por nombre.
const FECHA_CHICAGO = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Chicago', year: 'numeric', month: '2-digit', day: '2-digit' })
export const diaChicagoSQL = (ms) => FECHA_CHICAGO.format(new Date(ms))
/** Suma `n` días a una fecha 'AAAA-MM-DD' (como `date + n` en SQL). */
export function sumarDias(dia, n) {
  const d = new Date(`${dia}T12:00:00Z`)
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}

/**
 * ECO-1g · `video_reinicio(ts)`: la próxima medianoche de Chicago después de
 * `ms`, como instante. La medianoche de Chicago cae a las 05:00 UTC (horario de
 * verano) o a las 06:00 UTC (de invierno); el cambio de hora es a las 2 de la
 * madrugada, así que la medianoche nunca es ambigua. Se prueba la primera y, si
 * a esa hora Chicago aún no cambió de día, es la segunda.
 */
export function videoReinicioSQL(ms) {
  const [a, m, d] = sumarDias(diaChicagoSQL(ms), 1).split('-').map(Number)
  const verano = Date.UTC(a, m - 1, d, 5)
  return diaChicagoSQL(verano) === diaChicagoSQL(verano - 1) ? Date.UTC(a, m - 1, d, 6) : verano
}
const iso = (ms) => new Date(ms).toISOString()

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
 * @param {boolean} [opciones.limites=true]  cuenta los intentos por minuto
 *   (ECO-1d). Con `false` no corta nunca por sí solo (sí con `forzarLimite`):
 *   SÓLO para repetir el recorrido del guion de la 1c, que, como aquél, corre
 *   todo en el mismo instante y cortaría en la 11.ª sentada.
 * @param {number} [opciones.videoMinimoS=35]  los segundos mínimos entre pedir
 *   y cobrar un boleto (ECO-1g, S2). SÓLO el mando de desarrollo
 *   `?apu=video:<ms>` lo baja, para que un video corto se pueda cobrar; el SQL
 *   no tiene esta puerta.
 */
export function crearBanco({
  saldo = 5000, ahora = () => Date.now(), entradaDeMolde = false, limites = true,
  videoMinimoS = VIDEO_MINIMO_S_SQL, usuario = 'test1976', sembrados = [],
  correo = 'devlocal@ajilei.test',
} = {}) {
  const nace = ahora()
  const b = {
    saldo,
    saldoEn: nace,             // RNK-1b · `billeteras.actualizada_en`: el desempate de Fortunas
    mesas: new Map(),          // id → fila de `mesas_ia`
    record: new Map(),         // `${reto}:${vivos}` → { jugadas, ganadas_humano, ganadas_ia }
    libro: [],                 // { tipo, monto, saldo_tras, clave, ref }
    ultimoId: 0,
    // ECO-1d
    intentos: [],              // { funcion, en } — `intentos_dinero`
    forzados: {},              // funcion → cuántas respuestas `limite` quedan (mando del arnés)
    constancia: null,          // { racha, ultimo_dia } — la fila de `constancia`, o ninguna
    tope: null,                // `ajustes_economia.tope_diario_ia` (null = apagada)
    cambiosValvula: [],        // `valvula_cambios`
    // ECO-1g
    boletos: [],               // { id, emitido_en, vence_en, cobrado_en, anulado_en } — `boletos_video`
    ultimoBoleto: 0,
    // RNK-1b
    puntos: [],                // `libro_puntos` de la cuenta: { origen, nivel, sentados, puntos_base, ajilei, extra, mesa_id, mano, creado_en }
    total: null,               // `puntos_totales` de la cuenta: { puntos, manos, ajileis, actualizado_en }, o ninguna
    otros: [],                 // los demás jugadores: { username, saldo, saldoEn, total, pais, estado }
    // CFG-1 1d · la fila propia de `auth.users` en lo que toca al correo
    correoAuth: { email: correo, nuevo: null, enviadoEn: null, confirmados: 0, codigos: {}, forzar: null },
    // CFG-1 1b · la fila propia de `profiles` (el nombre es `usuario`)
    perfil: { id: '00000000-0000-4000-8000-000000000000', pais: null, estado: null, cambiadoEn: null, forzar: null },
    // CFG-1 1e · la fila de `consultas`, o ninguna (nace en la primera consulta)
    consultas: null,           // { usadas, ultimaMesa, ultimaMano }
    // TIE-1 1a · las filas de `inventario` de la cuenta (el gratis no tiene)
    inventario: [],            // { tipo, articulo, tono, en_uso, adquirido_en }
  }

  // ── El libro (1a): una línea por cambio, clave única ─────────────────────
  function aplicar(tipo, monto, clave, ref) {
    if (b.libro.some((l) => l.clave === clave)) return { aplicado: true, motivo: 'repetido' }
    if (b.saldo + monto < 0) return { aplicado: false, motivo: 'saldo_insuficiente' }
    b.saldo += monto
    b.saldoEn = ahora()
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

  // ── ECO-1d · `contar_intento_dinero` con `limite_dinero` ─────────────────
  // Purga lo de más de 1 h, anota y cuenta lo de este minuto, en ese orden. El
  // intento rechazado TAMBIÉN queda anotado (sin `raise`). `forzarLimite` es el
  // mando del arnés: las próximas `veces` llamadas contestan `limite` (y se
  // anotan, como en el SQL).
  function cabe(funcion) {
    const t = ahora()
    b.intentos = b.intentos.filter((x) => x.en >= t - 3600_000)
    b.intentos.push({ funcion, en: t })
    if ((b.forzados[funcion] ?? 0) > 0) { b.forzados[funcion]--; return false }
    if (!limites) return true
    const tope = funcion === 'consultar_mano' ? LIMITE_CONSULTA_SQL
      : funcion === 'comprar_articulo' ? LIMITE_COMPRA_SQL : LIMITES_SQL[funcion]
    if (tope === undefined) return false
    return b.intentos.filter((x) => x.funcion === funcion && x.en > t - 60_000).length <= tope
  }

  // ── ECO-1d · la válvula: `ganancia_ia_hoy` y `valvula_cerrada` (P-2) ─────
  // Por mesa y en el día de Chicago en que se CIERRA, más lo que daría la
  // abierta si se cerrara ahora.
  function gananciaHoy() {
    const hoy = diaChicagoSQL(ahora())
    let g = 0
    for (const m of b.mesas.values()) {
      if (m.estado === 'cerrada' && diaChicagoSQL(m.cerrada_en) === hoy) g += m.cobrado - m.entrada - m.recargado
      if (m.estado === 'abierta') g += Math.min(m.pila_informada, m.techo_cobro) - m.entrada - m.recargado
    }
    return g
  }
  const valvulaCerrada = () => b.tope !== null && gananciaHoy() >= b.tope

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
    if (!cabe('sentarse_ia')) return respuesta('limite')
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
    if (valvulaCerrada()) return respuesta('tope_diario')

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
      mano_informada: 0, manos_recientes: [],   // RNK-1a
    }
    b.mesas.set(id, mesa)
    return respuesta('ok', mesa, cierre.cerrada, cierre.cobrado)
  }

  function mesaPropia(id) {
    return b.mesas.get(id) ?? null
  }

  function recargar({ p_mesa, p_monto, p_seq }) {
    if (!cabe('recargar_ia')) return respuesta('limite')
    if ([p_mesa, p_monto, p_seq].some((v) => v === null || v === undefined)) return respuesta('argumento_invalido')
    const m = mesaPropia(p_mesa)
    if (!m) return respuesta('sin_mesa')
    if (m.estado !== 'abierta') return respuesta('mesa_cerrada', m)
    const clave = `recarga_ia:${m.id}:${p_seq}`
    if (b.libro.some((l) => l.clave === clave)) return respuesta('repetido', m)
    if (p_seq <= m.seq_informada) return respuesta('seq_viejo', m)
    if (!esEntero(p_monto) || p_monto <= 0 || p_monto % m.apuesta !== 0) return respuesta('monto_invalido', m)
    if (m.pila_informada + p_monto > techoMesa(m.apuesta)) return respuesta('sobre_techo', m)
    if (valvulaCerrada()) return respuesta('tope_diario', m)
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

  // ── RNK-1a · `libro_puntos` y su disparador `libro_puntos_suma_total` ────
  // La línea entra si su (origen, mesa, mano) es nueva (`on conflict do
  // nothing`); el total nace con la primera y suma `puntos_base + extra`, y su
  // fecha es la de la última línea: «cuándo llegó a esta cifra».
  function anotarPuntos(linea) {
    if (b.puntos.some((l) => l.origen === linea.origen && l.mesa_id === linea.mesa_id && l.mano === linea.mano)) return
    b.puntos.push(linea)
    const t = b.total ?? { puntos: 0, manos: 0, ajileis: 0, actualizado_en: null }
    b.total = {
      puntos: t.puntos + linea.puntos_base + linea.extra,
      manos: t.manos + 1,
      ajileis: t.ajileis + (linea.ajilei > 0 ? 1 : 0),
      actualizado_en: linea.creado_en,
    }
  }

  // RNK-1a · la migración §6, en el mismo orden. Cualquiera de los cuatro
  // `p_fin_*` = fin de mano. Sin `p_fin_mano` (cliente de antes de la 1b):
  // récord sí, libro no. Una anomalía no anota el fin en ningún sitio, y la
  // pila se guarda igual.
  function informar({
    p_mesa, p_seq, p_pila, p_fin_vivos = null, p_fin_gano = null, p_fin_mano = null, p_fin_ajilei = null,
  }) {
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
    const fin = p_fin_vivos !== null || p_fin_gano !== null || p_fin_mano !== null || p_fin_ajilei !== null
    const ajilei = p_fin_ajilei ?? 0
    let anota = false
    let libro = false
    let recientes = m.manos_recientes
    if (fin) {
      if (p_fin_vivos === null || p_fin_gano === null || p_fin_vivos < 2 || p_fin_vivos > m.jugadores) {
        anomalias++
      } else if (p_fin_mano === null) {
        anota = true
      } else {
        const ultima = b.puntos.filter((l) => l.origen === 'ias' && l.mesa_id === m.id)
          .reduce((x, l) => Math.max(x, l.mano), 0)
        recientes = m.manos_recientes.filter((t) => t > ahora() - 60_000)
        if (p_fin_mano < 1 || p_fin_mano <= m.mano_informada || p_fin_mano <= ultima
            || !(ajilei in EXTRA_AJILEI_SQL) || (ajilei === 52 && p_fin_vivos !== 5)
            || recientes.length >= TOPE_MANOS_MINUTO_SQL) {
          anomalias++
        } else {
          anota = true
          libro = true
        }
      }
    }
    if (anota) {
      const k = `${m.reto}:${p_fin_vivos}`
      const r = b.record.get(k) ?? { jugadas: 0, ganadas_humano: 0, ganadas_ia: 0 }
      b.record.set(k, {
        jugadas: r.jugadas + 1,
        ganadas_humano: r.ganadas_humano + (p_fin_gano ? 1 : 0),
        ganadas_ia: r.ganadas_ia + (p_fin_gano ? 0 : 1),
      })
    }
    if (libro && p_fin_gano) {
      anotarPuntos({
        origen: 'ias', nivel: m.reto, sentados: p_fin_vivos, puntos_base: PUNTOS_RETO_SQL[m.reto],
        ajilei, extra: EXTRA_AJILEI_SQL[ajilei], mesa_id: m.id, mano: p_fin_mano, creado_en: ahora(),
      })
    }
    m.pila_informada = pila
    m.seq_informada = p_seq
    m.anomalias += anomalias
    m.ultimo_aviso_en = ahora()
    if (libro) {
      m.mano_informada = p_fin_mano
      m.manos_recientes = [...recientes, ahora()]
    }
    return respuesta('ok', m)
  }

  // ── RNK-1a · las tres lecturas del ranking ───────────────────────────────
  // Los demás jugadores (las cuentas fabricadas del guion): saldo y, si tiene
  // puntos, su total, cada uno con su fecha.
  function sembrar({ username, puntos = null, saldo = 0, puntosEn = ahora(), saldoEn = ahora(), manos, ajileis = 0, pais = null, estado = null }) {
    b.otros.push({
      username, saldo, saldoEn, pais, estado,
      total: puntos ? { puntos, manos: manos ?? puntos, ajileis, actualizado_en: puntosEn } : null,
    })
  }
  for (const j of sembrados) {
    sembrar({
      username: j.username, puntos: j.puntos, saldo: j.saldo ?? 0,
      puntosEn: nace - (j.puntosHace ?? 0), saldoEn: nace - (j.saldoHace ?? 0),
      pais: j.pais ?? null, estado: j.estado ?? null,
    })
  }

  // El orden del Ajuste A, el mismo que `puesto_maestros` / `puesto_fortunas`
  // y `ranking_top`: cifra de mayor a menor, quien llegó antes a esa cifra, y
  // el nombre sin mayúsculas. Puesto único. Nunca un uuid.
  const porNombre = (x, y) => {
    const a = x.toLowerCase()
    const c = y.toLowerCase()
    return a < c ? -1 : a > c ? 1 : 0
  }
  function filasRanking(ranking) {
    let filas
    if (ranking === 'maestros') {
      filas = b.otros.filter((o) => o.total)
        .map((o) => ({ username: o.username, cifra: o.total.puntos, fecha: o.total.actualizado_en, yo: false, pais: o.pais, estado: o.estado }))
      if (b.total) filas.push({ username: usuario, cifra: b.total.puntos, fecha: b.total.actualizado_en, yo: true, pais: b.perfil.pais, estado: b.perfil.estado })
    } else if (ranking === 'fortunas') {
      filas = b.otros.map((o) => ({ username: o.username, cifra: o.saldo, fecha: o.saldoEn, yo: false, pais: o.pais, estado: o.estado }))
      filas.push({ username: usuario, cifra: b.saldo, fecha: b.saldoEn, yo: true, pais: b.perfil.pais, estado: b.perfil.estado })
    } else {
      return null
    }
    return filas.sort((p, q) => q.cifra - p.cifra || p.fecha - q.fecha || porNombre(p.username, q.username))
  }

  // `ranking_top`: 100 filas exactas, `row_number()`.
  function rankingTop({ p_ranking = null } = {}) {
    const filas = filasRanking(p_ranking)
    if (!filas) return []
    return filas.slice(0, 100).map((f, i) => ({
      puesto: i + 1, username: f.username, cifra: f.cifra, es_tu: f.yo, pais: f.pais, estado: f.estado,
    }))
  }

  // `ranking_mio`: en Maestros sin puntos, CERO filas («Gana tu primera mano
  // para entrar»).
  function rankingMio({ p_ranking = null } = {}) {
    const filas = filasRanking(p_ranking)
    if (!filas) return []
    const i = filas.findIndex((f) => f.yo)
    if (i < 0) return []
    return [{ puesto: i + 1, total: filas.length, franja: franjaSQL(i + 1, filas.length), cifra: filas[i].cifra }]
  }

  // `mini_perfil`: por nombre sin mayúsculas; puesto y puntos nulos sin puntos.
  function miniPerfil({ p_username = null } = {}) {
    if (p_username === null || p_username === undefined) return []
    const buscado = String(p_username).toLowerCase()
    const otro = b.otros.find((o) => o.username.toLowerCase() === buscado)
    const nombre = buscado === usuario.toLowerCase() ? usuario : otro?.username
    if (!nombre) return []
    const { pais, estado } = nombre === usuario ? b.perfil : otro
    const lugar = (ranking) => {
      const filas = filasRanking(ranking)
      const i = filas.findIndex((f) => f.username === nombre)
      return i < 0 ? { puesto: null, cifra: null } : { puesto: i + 1, cifra: filas[i].cifra }
    }
    const m = lugar('maestros')
    const f = lugar('fortunas')
    return [{ username: nombre, puesto_maestros: m.puesto, puntos: m.cifra, puesto_fortunas: f.puesto, saldo: f.cifra, pais, estado }]
  }

  // ── CFG-1 1b · el perfil propio ──────────────────────────────────────────
  // `nombre_libre`: la forma, los vedados (la muestra) y que no lo tenga OTRO;
  // el propio con otras mayúsculas cuenta como libre. `forzar` es el mando
  // `?cfg=nombre-ocupado|vedado|libre` del bypass: contesta eso sin mirar.
  const deOtro = (nombre) => b.otros.some((o) => o.username.toLowerCase() === String(nombre).toLowerCase())
  function nombreLibre({ p = null } = {}) {
    if (b.perfil.forzar === 'ocupado' || b.perfil.forzar === 'vedado') return false
    if (typeof p !== 'string' || !FORMA_USERNAME_SQL.test(p)) return false
    if (b.perfil.forzar === 'libre') return true
    return !vedado(p) && !deOtro(p)
  }
  const frenoHasta = () => (b.perfil.cambiadoEn === null ? null : b.perfil.cambiadoEn + FRENO_NOMBRE_MS_SQL)
  // `mi_proximo_cambio`: el instante ISO, o nulo si ya puede.
  function miProximoCambio() {
    const h = frenoHasta()
    return h !== null && ahora() < h ? iso(h) : null
  }
  // ── CFG-1 1e · Mano actual de pago (`consultar_mano`, `mi_consulta`) ──────
  // El orden del SQL: límite, argumentos, la mesa abierta (de ella el precio),
  // la última mano consultada ('repetida', sin tocar nada), una gratis, y el
  // cobro con la clave de la mano (una mano anterior ya cobrada: 'pagada').
  // El banco siempre tiene sesión: 'sin_sesion' no se da aquí.
  const gratisQuedan = () => Math.max(CONSULTAS_GRATIS_SQL - (b.consultas?.usadas ?? 0), 0)
  const filaConsulta = (resultado, precio) => ({
    resultado, precio, gratis_restantes: gratisQuedan(), saldo: b.saldo,
  })
  function consultarMano({ p_mesa = null, p_mano = null } = {}) {
    if (!cabe('consultar_mano')) return filaConsulta('limite', 0)
    if (!p_mesa || !Number.isInteger(p_mano) || p_mano < 1) return filaConsulta('argumento_invalido', 0)
    const m = b.mesas.get(p_mesa)
    if (!m || m.estado !== 'abierta') return filaConsulta('mesa_invalida', 0)
    const precio = PRECIOS_CONSULTA_SQL[m.reto]
    b.consultas ??= { usadas: 0, ultimaMesa: null, ultimaMano: null }
    const c = b.consultas
    if (c.ultimaMesa === p_mesa && c.ultimaMano === p_mano) return filaConsulta('repetida', precio)
    if (c.usadas < CONSULTAS_GRATIS_SQL) {
      c.usadas += 1
      c.ultimaMesa = p_mesa
      c.ultimaMano = p_mano
      return filaConsulta('gratis', precio)
    }
    const r = aplicar('consulta', -precio, `consulta:${p_mesa}:${p_mano}`, p_mesa)
    if (r.motivo === 'aplicado') {
      c.ultimaMesa = p_mesa
      c.ultimaMano = p_mano
      return filaConsulta('cobrada', precio)
    }
    if (r.motivo === 'repetido') return filaConsulta('pagada', precio)
    return filaConsulta(r.motivo, precio)
  }
  function miConsulta() {
    return {
      gratis_restantes: gratisQuedan(),
      ultima_mesa: b.consultas?.ultimaMesa ?? null,
      ultima_mano: b.consultas?.ultimaMano ?? null,
    }
  }

  const errorSQL = (code, message, hint = null) => ({ code, message, details: null, hint })
  const filaPerfil = () => ({ id: b.perfil.id, username: usuario, pais: b.perfil.pais, estado: b.perfil.estado })
  // El `update` de `profiles` con las tres columnas del `grant`, en el orden
  // del SQL: el freno (`profiles_freno_…` va antes que el portero), los
  // vedados (el portero, solo si el nombre cambia), los CHECK y el índice
  // único. Contesta como PostgREST, `{ data, error }`.
  function actualizarPerfil(campos = {}) {
    const nuevo = { username: usuario, pais: b.perfil.pais, estado: b.perfil.estado, ...campos }
    const cambiaNombre = String(nuevo.username).toLowerCase() !== usuario.toLowerCase()
    if (cambiaNombre) {
      const h = frenoHasta()
      if (h !== null && ahora() < h) return { data: null, error: errorSQL('AJ030', 'nombre_frenado', isoSegundos(h)) }
    }
    if (nuevo.username !== usuario && (b.perfil.forzar === 'vedado' || (b.perfil.forzar !== 'libre' && vedado(nuevo.username)))) {
      return { data: null, error: errorSQL('P0001', 'AJILEI: el nombre no esta disponible') }
    }
    if (typeof nuevo.username !== 'string' || !FORMA_USERNAME_SQL.test(nuevo.username)) {
      return { data: null, error: errorSQL('23514', 'profiles_username_formato_chk') }
    }
    if (nuevo.pais !== null && !/^[A-Z]{2}$/.test(nuevo.pais)) return { data: null, error: errorSQL('23514', 'profiles_pais_formato_chk') }
    if (nuevo.estado !== null && nuevo.pais !== 'VE') return { data: null, error: errorSQL('23514', 'profiles_estado_solo_ve_chk') }
    if (nuevo.estado !== null && !ESTADOS_VE_SQL.includes(nuevo.estado)) return { data: null, error: errorSQL('23514', 'profiles_estado_lista_chk') }
    if (cambiaNombre && (b.perfil.forzar === 'ocupado' || (b.perfil.forzar !== 'libre' && deOtro(nuevo.username)))) {
      return { data: null, error: errorSQL('23505', 'profiles_username_lower_uniq') }
    }
    if (cambiaNombre) b.perfil.cambiadoEn = ahora()
    usuario = nuevo.username
    b.perfil.pais = nuevo.pais
    b.perfil.estado = nuevo.estado
    return { data: filaPerfil(), error: null }
  }

  // ── CFG-1 1d · el cambio de correo ───────────────────────────────────────
  // GoTrue v2.197.0 leído función a función (sonda de la 1d, S-1…S-5), con
  // «Secure email change» encendido: `sendEmailChange`, `emailChangeVerify` y
  // `Resend`. Contesta como la API de Auth, `{ status, cuerpo }`: el arnés lo
  // pone en una ruta y el bypass lo pasa a la forma del SDK.
  // Los códigos son fijos para poder teclearlos en el bypass.
  const c = b.correoAuth
  const noCorreo = (status, code, message) => ({ status, cuerpo: { code, message } })
  const usuarioAuth = () => ({
    id: b.perfil.id, aud: 'authenticated', role: 'authenticated', email: c.email,
    ...(c.nuevo ? { new_email: c.nuevo, email_change_sent_at: iso(c.enviadoEn) } : {}),
    app_metadata: {}, user_metadata: {}, created_at: '2026-01-01T00:00:00Z',
  })
  function correoEnviar() {
    c.codigos = { [c.email]: CODIGO_ACTUAL_IMITADO, [c.nuevo]: CODIGO_NUEVO_IMITADO }
    c.confirmados = 0
    c.enviadoEn = ahora()
  }
  const correoFrenado = () => {
    if (c.forzar === 'limite') return noCorreo(429, 'over_email_send_rate_limit', 'email rate limit exceeded')
    const falta = c.enviadoEn === null ? 0 : c.enviadoEn + INTERVALO_ENVIO_S_PANEL * 1000 - ahora()
    return falta > 0 ? noCorreo(429, 'over_email_send_rate_limit', `For security purposes, you can only request this after ${Math.ceil(falta / 1000)} seconds.`) : null
  }
  // `PUT /auth/v1/user { email }`
  function correoPedir(email) {
    const nuevo = String(email ?? '').toLowerCase()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(nuevo)) return noCorreo(400, 'validation_failed', 'Unable to validate email address: invalid format')
    if (nuevo === c.email) return { status: 200, cuerpo: usuarioAuth() }
    if (c.forzar === 'en_uso' || CORREOS_OCUPADOS_IMITADOS.includes(nuevo)) return noCorreo(422, 'email_exists', 'A user with this email address has already been registered')
    const freno = correoFrenado()
    if (freno) return freno
    c.nuevo = nuevo
    correoEnviar()
    return { status: 200, cuerpo: usuarioAuth() }
  }
  // `POST /auth/v1/verify { type: 'email_change', email, token }`
  function correoVerificar(email, token) {
    const invalido = noCorreo(403, 'otp_expired', 'Token has expired or is invalid')
    if (c.forzar === 'codigo_mal' || !c.nuevo) return invalido
    if (ahora() >= c.enviadoEn + OTP_EXP_S_PANEL * 1000) return invalido
    const dir = String(email ?? '').toLowerCase()
    if (c.codigos[dir] === undefined || c.codigos[dir] !== token) return invalido
    delete c.codigos[dir]
    c.confirmados += 1
    if (c.confirmados === 1) {
      return { status: 200, cuerpo: { msg: 'Confirmation link accepted. Please proceed to confirm link sent to the other email', code: '200' } }
    }
    c.email = c.nuevo
    c.nuevo = null
    c.enviadoEn = null
    c.confirmados = 0
    c.codigos = {}
    const exp = Math.floor(ahora() / 1000) + 3600
    return { status: 200, cuerpo: {
      access_token: `e30.${btoa(JSON.stringify({ sub: b.perfil.id, email: c.email, exp }))}.imitado`,
      token_type: 'bearer', expires_in: 3600, expires_at: exp, refresh_token: 'imitado-refresh', user: usuarioAuth(),
    } }
  }
  // `POST /auth/v1/resend { type: 'email_change', email }`. Con el correo nuevo
  // no encuentra a nadie y contesta 200 sin mandar nada: la trampa de la sonda.
  function correoReenviar(email) {
    if (String(email ?? '').toLowerCase() !== c.email || !c.nuevo) return { status: 200, cuerpo: {} }
    const freno = correoFrenado()
    if (freno) return freno
    correoEnviar()
    return { status: 200, cuerpo: {} }
  }

  function salir({ p_mesa, p_fichas, p_seq }) {
    if (!cabe('salir_ia')) return respuesta('limite')
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
    if (!cabe('recoger_mesa_ia')) return respuesta('limite')
    const m = abierta()
    if (!m) return respuesta('ninguna')
    const mismo = p_dispositivo !== null && m.dispositivo === String(p_dispositivo).slice(0, 64)
    const callada = m.ultimo_aviso_en < ahora() - SILENCIO_RECOGIDA_MS
    if (!(mismo || callada)) return respuesta('viva', m)
    const cierre = cerrarAbierta('abandono')
    return respuesta('recogida', b.mesas.get(cierre.mesa_id))
  }

  // ── ECO-1d · `marcar_ingreso` (K2–K4) ────────────────────────────────────
  function respuestaConstancia(codigo, racha, cobrado = 0) {
    const r = racha ?? 0
    return {
      codigo, racha: r, dia_del_ciclo: r > 0 ? ((r - 1) % CICLO_CONSTANCIA_SQL) + 1 : 0,
      cobrado, saldo: b.saldo, dia: diaChicagoSQL(ahora()),
    }
  }
  function marcarIngreso() {
    if (!cabe('marcar_ingreso')) return respuestaConstancia('limite', b.constancia?.racha ?? 0)
    const hoy = diaChicagoSQL(ahora())
    const c = b.constancia ?? { racha: 0, ultimo_dia: null }
    if (c.ultimo_dia === hoy) return respuestaConstancia('ya_marcado', c.racha)
    const racha = c.ultimo_dia === sumarDias(hoy, -1) ? c.racha + 1 : 1
    b.constancia = { racha, ultimo_dia: hoy }
    let cobrado = 0
    if (racha % CICLO_CONSTANCIA_SQL === 0) {
      // 'repetido' = hoy ya se cobró (la clave es por día): ni paga ni se anuncia.
      const r = aplicar('constancia', BONO_CONSTANCIA_SQL, `constancia:${hoy}`, hoy)
      if (r.motivo === 'aplicado') cobrado = BONO_CONSTANCIA_SQL
    }
    return respuestaConstancia('ok', racha, cobrado)
  }

  // ── ECO-1g · el video de recompensa: `mi_video`, `pedir_boleto`, `cobrar_boleto` ──
  // La migración leída función a función, para la cuenta de la sesión. Lo que
  // el SQL contesta a otra cuenta o sin cuenta (`sin_sesion`, `sin_billetera`,
  // `ajeno`) aquí no puede darse: el boleto de otro es `inexistente`. Los
  // instantes viajan como texto ISO, que es como PostgREST da un `timestamptz`.
  const videoCobradosHoy = () => {
    const hoy = diaChicagoSQL(ahora())
    return b.boletos.filter((x) => x.cobrado_en !== null && diaChicagoSQL(x.cobrado_en) === hoy).length
  }
  const videoQuedan = () => Math.max(0, VIDEO_TOPE_SQL - videoCobradosHoy())

  function miVideo() {
    return {
      codigo: 'ok', quedan: videoQuedan(), tope: VIDEO_TOPE_SQL,
      ahora: iso(ahora()), reinicio_en: iso(videoReinicioSQL(ahora())), premio: VIDEO_PREMIO_SQL,
    }
  }

  function respuestaBoleto(codigo, boleto = null) {
    return {
      codigo,
      boleto_id: boleto?.id ?? null,
      emitido_en: boleto ? iso(boleto.emitido_en) : null,
      vence_en: boleto ? iso(boleto.vence_en) : null,
      ahora: iso(ahora()),
      minimo_s: videoMinimoS,
      quedan: videoQuedan(),
      reinicio_en: iso(videoReinicioSQL(ahora())),
    }
  }

  function respuestaCobro(codigo, cobrado = 0, faltan = 0) {
    return {
      codigo, cobrado, saldo: b.saldo, quedan: videoQuedan(),
      reinicio_en: iso(videoReinicioSQL(ahora())), faltan_s: Math.max(0, faltan), premio: VIDEO_PREMIO_SQL,
    }
  }

  function pedirBoleto() {
    if (!cabe('pedir_boleto')) return respuestaBoleto('limite')
    // El tope se mira ANTES de anular: con los 8 cobrados ni se emite ni se anula.
    if (videoCobradosHoy() >= VIDEO_TOPE_SQL) return respuestaBoleto('tope_dia')
    // S1 · un solo boleto vivo: pedir anula el anterior (también si ya venció).
    for (const x of b.boletos) if (x.cobrado_en === null && x.anulado_en === null) x.anulado_en = ahora()
    const boleto = {
      id: `boleto-imitado-${++b.ultimoBoleto}`,
      emitido_en: ahora(), vence_en: ahora() + VIDEO_VIDA_MS_SQL, cobrado_en: null, anulado_en: null,
    }
    b.boletos.push(boleto)
    return respuestaBoleto('ok', boleto)
  }

  function cobrarBoleto({ p_boleto = null } = {}) {
    if (!cabe('cobrar_boleto')) return respuestaCobro('limite')
    const x = b.boletos.find((y) => y.id === p_boleto)
    if (!x) return respuestaCobro('inexistente')
    // «Ya cobrado» va ANTES que anulado y vencido: el reintento de un cobro que
    // sí entró recibe `ya_cobrado` con el saldo ya subido (S3).
    if (x.cobrado_en !== null) return respuestaCobro('ya_cobrado')
    if (x.anulado_en !== null) return respuestaCobro('anulado')
    if (ahora() >= x.vence_en) return respuestaCobro('vencido')
    const desde = x.emitido_en + videoMinimoS * 1000
    if (ahora() < desde) return respuestaCobro('demasiado_pronto', 0, Math.ceil((desde - ahora()) / 1000))
    if (videoCobradosHoy() >= VIDEO_TOPE_SQL) return respuestaCobro('tope_dia')
    const r = aplicar('video', VIDEO_PREMIO_SQL, `video:${x.id}`, x.id)
    if (r.motivo !== 'aplicado') return respuestaCobro('error_libro')
    x.cobrado_en = ahora()
    return respuestaCobro('ok', VIDEO_PREMIO_SQL)
  }

  // ── TIE-1 1a · la tienda (`comprar_articulo`, `usar_articulo`, `elegir_tono`,
  // `mi_inventario`) ────────────────────────────────────────────────────────
  // En el orden del SQL: límite (sólo la compra), tipo, artículo, tono, ya
  // comprado, cobro y fila. Una sola cuenta: sin `sin_sesion`. La clave del
  // libro lleva al jugador (D-1 del STOP-A1) y 'repetido' sin fila se repara
  // sin cobrar (A-1).
  const precioArticulo = (tipo, articulo) => PRECIOS_ARTICULO_SQL[tipo]?.[articulo] ?? null
  const conTonosArt = (tipo, articulo) => CON_TONOS_SQL[tipo]?.includes(articulo) ?? false
  const gratisArt = (tipo, articulo) => articulo !== null && GRATIS_SQL[tipo] === articulo
  const filaInv = (tipo, articulo) => b.inventario.find((f) => f.tipo === tipo && f.articulo === articulo) ?? null
  const apagarTipo = (tipo, salvo = null) => {
    for (const f of b.inventario) if (f.tipo === tipo && f.articulo !== salvo) f.en_uso = false
  }

  function comprarArticulo({ p_tipo = null, p_articulo = null, p_tono = null } = {}) {
    if (!cabe('comprar_articulo')) return 'limite'
    if (!TIPOS_INVENTARIO_SQL.includes(p_tipo)) return 'tipo_invalido'
    const precio = precioArticulo(p_tipo, p_articulo)
    if (precio === null) return 'no_existe'
    let tono = null
    if (conTonosArt(p_tipo, p_articulo)) {
      tono = p_tono ?? 'actual'
      if (!TONOS_SQL.includes(tono)) return 'tono_invalido'
    } else if (p_tono !== null) {
      return 'sin_tono'
    }
    if (filaInv(p_tipo, p_articulo)) return 'ya_comprado'
    const r = aplicar('compra', -precio, `compra:${b.perfil.id}:${p_tipo}:${p_articulo}`, `${p_tipo}:${p_articulo}`)
    if (r.motivo === 'saldo_insuficiente') return 'sin_saldo'
    if (r.motivo !== 'aplicado' && r.motivo !== 'repetido') return r.motivo
    apagarTipo(p_tipo)
    b.inventario.push({ tipo: p_tipo, articulo: p_articulo, tono, en_uso: true, adquirido_en: iso(ahora()) })
    return 'ok'
  }

  function usarArticulo({ p_tipo = null, p_articulo = null } = {}) {
    if (!TIPOS_INVENTARIO_SQL.includes(p_tipo)) return 'tipo_invalido'
    const gratis = gratisArt(p_tipo, p_articulo)
    if (!gratis && precioArticulo(p_tipo, p_articulo) === null) return 'no_existe'
    if (!gratis && !filaInv(p_tipo, p_articulo)) return 'no_comprado'
    apagarTipo(p_tipo, p_articulo)
    const f = filaInv(p_tipo, p_articulo)
    if (f) f.en_uso = true
    return 'ok'
  }

  function elegirTono({ p_tipo = null, p_articulo = null, p_tono = null } = {}) {
    if (!TIPOS_INVENTARIO_SQL.includes(p_tipo)) return 'tipo_invalido'
    if (!gratisArt(p_tipo, p_articulo) && precioArticulo(p_tipo, p_articulo) === null) return 'no_existe'
    if (!conTonosArt(p_tipo, p_articulo)) return 'sin_tono'
    if (!TONOS_SQL.includes(p_tono)) return 'tono_invalido'
    const f = filaInv(p_tipo, p_articulo)
    if (!f) return 'no_comprado'
    f.tono = p_tono
    return 'ok'
  }

  function miInventario({ p_tipo = null } = {}) {
    return b.inventario
      .filter((f) => p_tipo === null || f.tipo === p_tipo)
      .sort((x, y) => x.tipo.localeCompare(y.tipo) || x.adquirido_en.localeCompare(y.adquirido_en) || x.articulo.localeCompare(y.articulo))
      .map((f) => ({ jugador_id: b.perfil.id, ...f }))
  }

  const RPC = {
    mi_billetera: () => b.saldo,
    marcar_ingreso: marcarIngreso,
    mi_video: miVideo,
    pedir_boleto: pedirBoleto,
    cobrar_boleto: cobrarBoleto,
    sentarse_ia: sentarse,
    recargar_ia: recargar,
    informar_pila: informar,
    salir_ia: salir,
    mi_mesa_ia: miMesa,
    recoger_mesa_ia: recoger,
    ranking_top: rankingTop,
    ranking_mio: rankingMio,
    mini_perfil: miniPerfil,
    nombre_libre: nombreLibre,
    mi_proximo_cambio: miProximoCambio,
    consultar_mano: consultarMano,
    mi_consulta: miConsulta,
    comprar_articulo: comprarArticulo,
    usar_articulo: usarArticulo,
    elegir_tono: elegirTono,
    mi_inventario: miInventario,
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
    // ── CFG-1 1b · `profiles` del jugador de la sesión ─────────────────────
    /** `select … from profiles where id = …`: la fila propia. */
    leerPerfil() { return { data: filaPerfil(), error: null } },
    /** `update profiles set … where id = …`, como PostgREST: `{ data, error }`. */
    actualizarPerfil(campos) { return actualizarPerfil(campos) },
    /** Lo que el guion hace con `cfg1b_mover`: el último cambio fue hace `ms`. */
    nombreCambiadoHace(ms) { b.perfil.cambiadoEn = ahora() - ms },
    /** Mando del bypass: `nombre_libre` y el `update` contestan 'ocupado', 'vedado' o 'libre' (null = lo que diga el banco). */
    forzarNombre(que) { b.perfil.forzar = que },
    get perfil() { return { ...filaPerfil(), nombre_cambiado_en: b.perfil.cambiadoEn === null ? null : iso(b.perfil.cambiadoEn) } },
    // ── CFG-1 1d · el cambio de correo ─────────────────────────────────────
    correoUsuario: usuarioAuth,
    correoPedir,
    correoVerificar,
    correoReenviar,
    /** Mando del bypass y del arnés: 'en_uso', 'codigo_mal' o 'limite' (null = lo que diga el banco). */
    forzarCorreo(que) { c.forzar = que },
    /** Mando: un cambio ya pedido hace `ms`. */
    sembrarCambioCorreo(nuevo, ms = 0) { c.nuevo = nuevo; correoEnviar(); c.enviadoEn = ahora() - ms },
    /** Lo que pasa el reloj: el envío se hizo hace `ms` más. */
    envejecerCambioCorreo(ms) { if (c.enviadoEn !== null) c.enviadoEn -= ms },
    get correoAuth() { return { ...c, codigos: { ...c.codigos } } },
    // ── CFG-1 1e · Mano actual ─────────────────────────────────────────────
    /** Lo que el dueño de la tabla escribe en `consultas.gratis_usadas` (el guion, B8): `n` gratis gastadas. */
    gastarConsultas(n) {
      if (!Number.isInteger(n) || n < 0 || n > CONSULTAS_GRATIS_SQL) return false
      b.consultas = { usadas: n, ultimaMesa: b.consultas?.ultimaMesa ?? null, ultimaMano: b.consultas?.ultimaMano ?? null }
      return true
    },
    get consultas() { return b.consultas ? { ...b.consultas } : null },
    // ── TIE-1 1a · la tienda ───────────────────────────────────────────────
    get inventario() { return b.inventario.map((f) => ({ ...f })) },
    /** Lo que el dueño de la tabla inserta a mano (y los mandos `?tie=`): las
     *  filas `{ tipo, articulo, tono, en_uso }`, sin cobrar. */
    sembrarInventario(filas) {
      b.inventario = filas.map((f, i) => ({ tipo: 'tapete', tono: null, en_uso: false, ...f, adquirido_en: iso(nace + i * 1000) }))
    },
    /** Lo que el guion hace con `delete from inventario` (B3b): la fila se va, el libro se queda. */
    borrarFilaInventario(tipo, articulo) { b.inventario = b.inventario.filter((f) => !(f.tipo === tipo && f.articulo === articulo)) },
    // ── CFG-1 1c · la Edge Function `eliminar_cuenta` ──────────────────────
    // No es una RPC: contesta `{ status, cuerpo }`, lo que la función manda por
    // HTTP. La guarda es la de `partida_abierta_de`: una mesa IA abierta (la de
    // este banco) o una sala, esperando o activa (el banco no tiene salas: la
    // marca `cuenta.sala`). Borrada la cuenta, la sesión ya no vale (401).
    // `cuenta.forzar` es el mando `?cfg=borrar-mesa` / `?cfg=borrar-ok` del
    // bypass: 'mesa' o 'ok' contestan eso sin mirar nada.
    cuenta: { borrada: false, sala: false, forzar: null, llamadas: 0 },
    eliminarCuenta() {
      const c = this.cuenta
      c.llamadas += 1
      if (c.borrada) return { status: 401, cuerpo: { motivo: 'sin_sesion' } }
      const ocupada = c.forzar === 'mesa' || (c.forzar !== 'ok' && (abierta() !== null || c.sala))
      if (ocupada) return { status: 409, cuerpo: { motivo: 'mesa_abierta' } }
      c.borrada = true
      return { status: 200, cuerpo: { ok: true } }
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
    // ── ECO-1d · los mandos del SQL Editor y del arnés ─────────────────────
    /** El día de Chicago de hoy, 'AAAA-MM-DD', con el reloj del banco. */
    hoy() { return diaChicagoSQL(ahora()) },
    /** `constancia_admin`: la racha en un estado dado, sin mover dinero. Con
     *  racha 0 el día va nulo; con racha > 0 hace falta día, y no futuro. */
    constanciaAdmin(racha, ultimoDia) {
      if (!Number.isInteger(racha) || racha < 0 || (racha === 0) !== (ultimoDia === null)) return false
      if (ultimoDia !== null && ultimoDia > diaChicagoSQL(ahora())) return false
      b.constancia = racha === 0 ? { racha: 0, ultimo_dia: null } : { racha, ultimo_dia: ultimoDia }
      return true
    },
    /** `valvula_ia(p_tope)`: encender o cambiar (tope > 0) o apagar (null). */
    valvula(tope) {
      if (tope !== null && !(Number.isInteger(tope) && tope > 0)) return { codigo: 'tope_invalido', tope: b.tope }
      if (tope === b.tope) return { codigo: 'sin_cambio', tope: b.tope }
      b.cambiosValvula.push({ antes: b.tope, despues: tope })
      b.tope = tope
      return { codigo: tope === null ? 'apagada' : 'encendida', tope }
    },
    /** `ganancia_ia_hoy` de la cuenta. */
    gananciaHoy() { return gananciaHoy() },
    /** Mando del arnés: las próximas `veces` llamadas a `funcion` dicen `limite`. */
    forzarLimite(funcion, veces = 1) { b.forzados[funcion] = veces },
    /** Lo que el guion hace con `update intentos_dinero set en = en - 2 min`. */
    envejecerIntentos(ms) { for (const x of b.intentos) x.en -= ms },
    // Lecturas para las pruebas y el arnés. Copias: nadie toca el estado.
    get saldo() { return b.saldo },
    get libro() { return b.libro.map((l) => ({ ...l })) },
    get mesas() { return [...b.mesas.values()].map((m) => ({ ...m })) },
    get record() { return Object.fromEntries([...b.record].map(([k, v]) => [k, { ...v }])) },
    get constancia() { return b.constancia ? { ...b.constancia } : null },
    get intentos() { return b.intentos.map((x) => ({ ...x })) },
    get tope() { return b.tope },
    get cambiosValvula() { return b.cambiosValvula.map((x) => ({ ...x })) },
    // ── RNK-1b · el libro de puntos y los demás jugadores ──────────────────
    get puntos() { return b.puntos.map((l) => ({ ...l })) },
    get total() { return b.total ? { ...b.total } : null },
    get usuario() { return usuario },
    /** Lo que el guion hace con `update mesas_ia set manos_recientes = … - 61 s` (B21). */
    envejecerManos(ms) { for (const m of b.mesas.values()) m.manos_recientes = m.manos_recientes.map((t) => t - ms) },
    /** Un jugador más para las lecturas, como las cuentas fabricadas del guion. */
    sembrarJugador(j) { sembrar(j) },
    /** Una línea del libro de OTRA cuenta (B18): su total sube y estrena fecha.
     *  RNK-1c · con el nombre de la PROPIA cuenta, su total sube igual (sin
     *  línea, como los sembrados): es lo que deja al bypass en su puesto. */
    sumarPuntos(username, n) {
      if (typeof username === 'string' && username.toLowerCase() === usuario.toLowerCase()) {
        if (!(n > 0)) return false
        const t = b.total ?? { puntos: 0, manos: 0, ajileis: 0 }
        b.total = { ...t, puntos: t.puntos + n, manos: t.manos + 1, actualizado_en: ahora() }
        return true
      }
      const o = b.otros.find((x) => x.username === username)
      if (!o || !(n > 0)) return false
      const t = o.total ?? { puntos: 0, manos: 0, ajileis: 0 }
      o.total = { ...t, puntos: t.puntos + n, manos: t.manos + 1, actualizado_en: ahora() }
      return true
    },
    // ── ECO-1g · el video ──────────────────────────────────────────────────
    get boletos() { return b.boletos.map((x) => ({ ...x })) },
    /** Lo que el guion hace con `update boletos_video set emitido_en = … - n s`:
     *  el boleto vivo «se pidió hace `ms`» (y vence `ms` antes). */
    envejecerBoleto(ms) {
      for (const x of b.boletos) {
        if (x.cobrado_en === null && x.anulado_en === null) { x.emitido_en -= ms; x.vence_en -= ms }
      }
    },
    /** Mando del arnés: `n` videos ya cobrados hoy (sólo los boletos: la cuenta
     *  del día, sin tocar el saldo ni el libro), para llegar al octavo sin ver
     *  siete. En el SQL Editor sería insertar las filas a mano. */
    sembrarVideosCobrados(n) {
      for (let i = 0; i < n; i++) {
        b.boletos.push({
          id: `boleto-sembrado-${++b.ultimoBoleto}`,
          emitido_en: ahora() - 60_000, vence_en: ahora() + VIDEO_VIDA_MS_SQL, cobrado_en: ahora(), anulado_en: null,
        })
      }
    },
  }
}
