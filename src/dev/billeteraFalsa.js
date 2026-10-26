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
      saldo: siembraAPU()?.saldo ?? 5000,
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
  const bolsillo = siembraAPU()?.bolsillo ?? null
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

/** Para las pruebas: un banco nuevo en la siguiente llamada. */
export function olvidarBancoDelBypass() {
  banco = null
}
