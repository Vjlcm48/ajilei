// ── ECO-1b · La billetera falsa del arnés y del modo sin sesión ─────────────
// Rector: AJILEI_ECO-1_Fase1b_v1.0.md §2.4 y el plan aprobado del STOP-1, con el
// ajuste 2 del rector: esto sustituye SÓLO la fuente de la lectura. No fabrica
// una billetera a mano: fabrica un CLIENTE falso con la forma del de Supabase
// (`rpc('mi_billetera')`) y lo pasa por `crearBilleteraApi`, que es la capa
// real. El núcleo (`hooks/billeteraCore.js`) es exactamente el de la app, así
// que el arnés prueba ese código y no un doble suyo. Es el molde de
// `salasFixtures.js` (A2).
//
// ── POR QUÉ HACE FALTA ─────────────────────────────────────────────────────
// Con `VITE_AUTH_BYPASS` la app entra con el perfil ficticio `DevLocal`, que no
// existe en la base y no tiene sesión: `mi_billetera()` no tendría a quién
// responder. Los modos del arnés que corren contra el servidor de desarrollo
// con bypass (`retar`, `apu`, `rec`, `diagSAL`, `diagCEL0`…) leen su saldo de
// aquí. Los que corren contra `vite preview` usan la API real y el arnés
// contesta la RPC por su ruta (`scripts/arnes/nucleo.mjs`).
//
// ── QUÉ CIFRA ──────────────────────────────────────────────────────────────
// La de `?apu=saldo:<n>` si viene, y si no 5.000: la cifra con la que nacieron
// las varas de hoy. Con ella ninguna se mueve por la 1b.
//
// ── LA PUERTA ES DOBLE, COMO EN `?sal=` ────────────────────────────────────
// `import.meta.env.DEV` es `false` bajo `vite build`: la primera línea se
// compila a `return null` y el minificador se lleva el archivo entero. La
// segunda mitad exige además el bypass, que es la variable que nunca va a un
// despliegue. La guardia de `scripts/testDistSinMoldes.test.js` compila de
// verdad y comprueba que `MARCA_BILLETERA_FALSA` no aparece en `dist/`: este
// comentario es una intención, aquella prueba es la medida.

// ── ECO-1c · YA NO SÓLO LEE: UN BANCO IMITADO POR CARGA DE PÁGINA ───────────
// Desde la 1c la mesa contra las IAS se abre, se recarga y se cobra en el
// servidor, así que el bypass necesita un servidor que se MUEVA. Es el banco
// imitado (`dev/bancoImitado.js`, el contrato SQL de la 1c en JS), UNO por carga
// de página, y lo comparten la billetera y las mesas: lo que una partida cobra
// es lo que la píldora lee después. Sigue entrando por las capas reales
// (`crearBilleteraApi`, `crearMesaIAApi`): lo que cambia es sólo la fuente.
//
// P-6 · si `?apu=` pide un molde de humano (`allinHumano`, `recarga`,
// `quiebra`, `sinRival:d12`), el banco admite su entrada aunque no sea legal:
// la mesa cobra lo que de verdad sentó (`entradaSembradaAPU`).

import { crearBilleteraApi } from '../lib/billeteraApi'
import { crearMesaIAApi } from '../lib/mesaIAApi'
import { crearConstanciaApi } from '../lib/constanciaApi'
import { crearVideoApi } from '../lib/videoApi'
import { crearRankingApi } from '../lib/rankingApi'
import { crearCuentaApi } from '../lib/cuentaApi'
import { crearPerfilApi } from '../lib/perfilApi'
import { crearConsultaApi } from '../lib/consultaApi'
import { crearTiendaApi } from '../lib/tiendaApi'
import { saldoOculto } from '../lib/saldoOculto'
import { crearBanco, VIDEO_MINIMO_S_SQL } from './bancoImitado'
import { sembradosRanking, PUNTOS_DEL_BYPASS } from './sembradosRanking'
import { siembraAPU, entradaSembradaAPU, videoSembradoAPU } from './siembraAPU'
import { AJILEI_CONFIG } from '../config/ajileiConfig'

// La huella que busca la guardia sobre `dist/`. Si algún día aparece en el
// bundle de producción, la puerta se ha roto.
export const MARCA_BILLETERA_FALSA = 'ajilei:billetera-falsa'

let banco = null

/** El banco imitado del bypass, uno por carga de página, o `null` fuera de él. */
export function bancoDelBypass() {
  // ── La primera línea es la que borra el archivo en producción ────────────
  if (!import.meta.env.DEV) return null
  if (!import.meta.env.VITE_AUTH_BYPASS) return null
  if (!banco) {
    // ECO-1g · con `?apu=video:<ms>` el video dura menos que los 35 s que el
    // servidor exige entre pedir y cobrar: el banco del bypass acorta su mínimo
    // en la misma proporción (35 de cada 40), o el cliente esperaría el resto.
    const corto = videoSembradoAPU()?.duracionMs ?? null
    banco = crearBanco({
      saldo: siembraAPU()?.saldo ?? saldoMandoTie() ?? 5000,
      entradaDeMolde: entradaSembradaAPU(100) !== null,
      videoMinimoS: corto === null ? VIDEO_MINIMO_S_SQL
        : Math.min(VIDEO_MINIMO_S_SQL, Math.floor((corto / AJILEI_CONFIG.economy.video.duracionMs) * VIDEO_MINIMO_S_SQL)),
      // RNK-1c · la cuenta del bypass es `DevLocal` (`PERFIL_DEV`,
      // `useAuth.js:90`), y Rankings la reconoce por el nombre; con los
      // jugadores sembrados la pantalla sale llena, como en la lámina.
      usuario: 'DevLocal',
      sembrados: sembradosRanking(),
    })
    // …y con sus puntos queda en el puesto 7 de Maestros (banda y «· tú» a la vez).
    banco.sumarPuntos('DevLocal', PUNTOS_DEL_BYPASS)
    // El arnés lo alcanza por aquí (C6, envejecer una mesa) sin ruta propia.
    if (typeof window !== 'undefined') window.__ajileiBancoImitado = { marca: MARCA_BILLETERA_FALSA, banco }
  }
  return banco
}

/**
 * La billetera simulada, o `null` fuera de desarrollo con bypass.
 * @returns {{inicial:number, leer:Function}|null}
 */
export function simulacionBilletera() {
  if (!import.meta.env.DEV) return null
  const b = bancoDelBypass()
  if (!b) return null
  return crearBilleteraApi(b, { inicial: b.saldo })
}

/** La API de mesas contra el banco imitado, o `null` fuera de desarrollo con bypass. */
export function simulacionMesaIA() {
  if (!import.meta.env.DEV) return null
  const b = bancoDelBypass()
  if (!b) return null
  // `?apu=bolsillo:<n>`: tras la PRIMERA mesa abierta, la billetera queda en n
  // (un ajuste del banco, como `ajuste_admin`), y la respuesta lo dice.
  // CFG-1 1e · `?cfg=consulta-sin-saldo` es lo mismo con 50: sentado, no le
  // alcanza para pagar una mano de Mano actual (100 en Básico).
  const bolsillo = siembraAPU()?.bolsillo ?? (mandoCfg() === 'consulta-sin-saldo' ? CONSULTA_SIN_SALDO : null)
  if (bolsillo === null) return crearMesaIAApi(b)
  let hecho = false
  return crearMesaIAApi({
    async rpc(nombre, params) {
      const r = await b.rpc(nombre, params)
      if (!hecho && nombre === 'sentarse_ia' && r.data?.codigo === 'ok') {
        hecho = true
        b.ajusteAdmin(bolsillo - b.saldo)
        return { ...r, data: { ...r.data, saldo: b.saldo } }
      }
      return r
    },
  })
}

/** ECO-1d · `marcar_ingreso` contra el banco imitado, o `null` fuera de desarrollo con bypass. */
export function simulacionConstancia() {
  if (!import.meta.env.DEV) return null
  const b = bancoDelBypass()
  if (!b) return null
  return crearConstanciaApi(b)
}

/** ECO-1g · el video de recompensa contra el banco imitado, o `null` fuera de desarrollo con bypass. */
export function simulacionVideo() {
  if (!import.meta.env.DEV) return null
  const b = bancoDelBypass()
  if (!b) return null
  return crearVideoApi(b)
}

/** RNK-1c · los rankings contra el banco imitado, o `null` fuera de desarrollo con bypass. */
export function simulacionRanking() {
  if (!import.meta.env.DEV) return null
  const b = bancoDelBypass()
  if (!b) return null
  return crearRankingApi(b)
}

// ── CFG-1 1c · eliminar la cuenta contra el banco imitado ──────────────────
// El mando `?cfg=` (sólo aquí, detrás de la misma puerta doble):
//   ?cfg=borrar-mesa   → la función contesta 409 mesa_abierta
//   ?cfg=borrar-ok     → contesta 200 aunque haya una mesa abierta
//   ?cfg=borrar-error  → contesta 500 (el error de la ventana)
//   ?cfg=borrar-401    → contesta 401 (la cuenta ya no está): sale como el ok
// Sin mando, lo que diga el banco: 409 con una mesa IA abierta, 200 si no.
// La respuesta tarda `CUENTA_TARDA_MS` para que el estado «enviando» se vea.
export const CFG_PARAM = 'cfg'
const CUENTA_TARDA_MS = 900

function mandoCfg() {
  try { return new URLSearchParams(window.location.search).get(CFG_PARAM) } catch { return null }
}

/** Un cliente con la forma de `supabase.functions` (functions-js 2.112.4). */
export function clienteFuncionesDe(b, { tarda = 0, mando = null } = {}) {
  return {
    functions: {
      async invoke(nombre) {
        if (tarda > 0) await new Promise((ok) => setTimeout(ok, tarda))
        const { status, cuerpo } = mando === 'borrar-error' ? { status: 500, cuerpo: { motivo: 'servidor' } }
          : nombre === 'eliminar_cuenta' ? b.eliminarCuenta() : { status: 404, cuerpo: {} }
        if (status >= 200 && status < 300) return { data: cuerpo, error: null }
        return { data: null, error: { name: 'FunctionsHttpError', context: { status, json: async () => cuerpo } } }
      },
    },
  }
}

/** La API de la cuenta contra el banco imitado, o `null` fuera de desarrollo con bypass. */
export function simulacionCuenta() {
  if (!import.meta.env.DEV) return null
  const b = bancoDelBypass()
  if (!b) return null
  const mando = mandoCfg()
  b.cuenta.forzar = mando === 'borrar-mesa' ? 'mesa' : mando === 'borrar-ok' ? 'ok' : null
  if (mando === 'borrar-401') b.cuenta.borrada = true
  return crearCuentaApi(clienteFuncionesDe(b, { tarda: CUENTA_TARDA_MS, mando }))
}

// ── CFG-1 1b · el perfil propio contra el banco imitado ────────────────────
// Rector: AJILEI_CFG-1_Fase1b_v1.0.md §2.10 (R-5). Un cliente con la forma de
// lo que `perfilApi` usa de Supabase (`from('profiles')…` y `rpc`), así que el
// bypass cambia de nombre y de lugar por la capa real. Los mandos `?cfg=`:
//   ?cfg=nombre-libre      → `nombre_libre` dice sí y el cambio pasa (si la forma vale)
//   ?cfg=nombre-ocupado    → dice no, y el cambio contesta 23505
//   ?cfg=nombre-vedado     → dice no, y el cambio contesta P0001
//   ?cfg=nombre-bloqueado  → el último cambio fue hace 2 días: el freno, con su fecha
// Sin mando, lo que diga el banco: los nombres de los sembrados están
// ocupados y los vedados de su muestra, vedados. Cada respuesta (menos la
// lectura) tarda `PERFIL_TARDA_MS`, para que «Guardando…» se vea.
const PERFIL_TARDA_MS = 450
const FRENO_DEMO_MS = 2 * 24 * 3600 * 1000

/** Un cliente con la forma de `supabase` para `perfilApi`: `from('profiles')` y `rpc`. */
export function clientePerfilDe(b, { tarda = 0 } = {}) {
  const espera = (v) => (tarda > 0 ? new Promise((ok) => setTimeout(() => ok(v), tarda)) : Promise.resolve(v))
  const fin = (r) => ({ maybeSingle: () => espera(r), single: () => espera(r) })
  return {
    from: () => ({
      // La lectura no espera: el bypass nace con su nombre, como antes.
      select: () => ({ eq: () => ({ maybeSingle: () => Promise.resolve(b.leerPerfil()) }) }),
      update: (campos) => ({ eq: () => ({ select: () => fin(b.actualizarPerfil(campos)) }) }),
      insert: () => ({ select: () => fin({ data: null, error: { code: '23505', message: 'el bypass ya tiene perfil' } }) }),
    }),
    rpc: (nombre, params) => b.rpc(nombre, params).then(espera),
  }
}

/** La API del perfil contra el banco imitado, o `null` fuera de desarrollo con bypass. */
export function simulacionPerfil() {
  if (!import.meta.env.DEV) return null
  const b = bancoDelBypass()
  if (!b) return null
  const mando = mandoCfg()
  if (mando === 'nombre-bloqueado') b.nombreCambiadoHace(FRENO_DEMO_MS)
  const fuerza = { 'nombre-libre': 'libre', 'nombre-ocupado': 'ocupado', 'nombre-vedado': 'vedado' }[mando] ?? null
  b.forzarNombre(fuerza)
  return crearPerfilApi(clientePerfilDe(b, { tarda: PERFIL_TARDA_MS }))
}

// ── CFG-1 1e · Mano actual de pago contra el banco imitado ─────────────────
// Rector: AJILEI_CFG-1_Fase1e_v1.0.md §2.4. Los mandos `?cfg=`:
//   ?cfg=consulta-gratis     → quedan 3 gratis
//   ?cfg=consulta-pago       → 0 gratis y saldo de sobra: la primera consulta cobra
//   ?cfg=consulta-sin-saldo  → 0 gratis y, ya sentado, 50 HC: «No te alcanza»
// Sin mando, las 20 del banco recién nacido. Cada consulta tarda
// `CONSULTA_TARDA_MS`, para que la espera del servidor exista también aquí.
//   ?cfg=mesa-humanos        → la mesa se monta como contra humanos (sin
//                              «Partida rápida»), como la montará MES-PvP.
const CONSULTA_TARDA_MS = 250
const CONSULTA_SIN_SALDO = 50
const GASTADAS_POR_MANDO = { 'consulta-gratis': 17, 'consulta-pago': 20, 'consulta-sin-saldo': 20 }

/** La API de Mano actual contra el banco imitado, o `null` fuera de desarrollo con bypass. */
export function simulacionConsulta() {
  if (!import.meta.env.DEV) return null
  const b = bancoDelBypass()
  if (!b) return null
  const gastadas = GASTADAS_POR_MANDO[mandoCfg()]
  if (gastadas !== undefined) b.gastarConsultas(gastadas)
  const espera = (v) => new Promise((ok) => setTimeout(() => ok(v), CONSULTA_TARDA_MS))
  return crearConsultaApi({ rpc: (nombre, params) => b.rpc(nombre, params).then(espera) })
}

/** `?cfg=mesa-humanos` con el bypass: la mesa sin «Partida rápida». Fuera de desarrollo, `false`. */
export function mesaContraHumanosDev() {
  if (!import.meta.env.DEV) return false
  if (!import.meta.env.VITE_AUTH_BYPASS) return false
  return mandoCfg() === 'mesa-humanos'
}

// ── TIE-1 1a · la tienda contra el banco imitado ───────────────────────────
// Rector: AJILEI_TIE-1_Fase1a_v1.0.md §3.5. Los mandos `?tie=`:
//   ?tie=vacia      → nada comprado, saldo 31.400
//   ?tie=comprado   → grafito oscuro en uso y azul (actual) comprado, 31.400
//   ?tie=sin-saldo  → nada comprado, saldo 4.000: «No te alcanza»
//   ?tie=error      → la compra contesta error del servidor (la ventana en `error`)
//   ?tie=ojito      → el saldo tapado (el ojito guardado en el aparato)
// Sin mando, el banco recién nacido (5.000, nada comprado). Cada llamada tarda
// `TIENDA_TARDA_MS`, para que «Comprando…» se vea.
export const TIE_PARAM = 'tie'
const TIENDA_TARDA_MS = 700
const SALDO_TIE = 31400
const SALDO_TIE_SIN = 4000

function mandoTie() {
  try { return new URLSearchParams(window.location.search).get(TIE_PARAM) } catch { return null }
}

function saldoMandoTie() {
  const m = mandoTie()
  if (m === null) return null
  return m === 'sin-saldo' ? SALDO_TIE_SIN : SALDO_TIE
}

/** La API de la tienda contra el banco imitado, o `null` fuera de desarrollo con bypass. */
export function simulacionTienda() {
  if (!import.meta.env.DEV) return null
  const b = bancoDelBypass()
  if (!b) return null
  const mando = mandoTie()
  if (mando === 'comprado') {
    b.sembrarInventario([
      { articulo: 'grafito', tono: 'oscuro', en_uso: true },
      { articulo: 'azul', tono: 'actual' },
    ])
  }
  if (mando === 'ojito') saldoOculto.guardar(true)
  const espera = (v) => new Promise((ok) => setTimeout(() => ok(v), TIENDA_TARDA_MS))
  return crearTiendaApi({
    rpc: (nombre, params) => (mando === 'error' && nombre === 'comprar_articulo'
      ? espera({ data: null, error: { code: 'XX000', message: 'mando ?tie=error' } })
      : b.rpc(nombre, params).then(espera)),
  })
}

/** Para las pruebas: un banco nuevo en la siguiente llamada. */
export function olvidarBancoDelBypass() {
  banco = null
}
