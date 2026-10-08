// ── ECO-1b · La billetera falsa del arnés y del modo sin sesión ─────────────
// Rector: AJILEI_ECO-1_Fase1b_v1.0.md §2.4 y el plan aprobado del STOP-1, con el
// ajuste 2 del rector: esto sustituye SÓLO la fuente de la lectura. No fabrica
// una billetera a mano: fabrica un CLIENTE falso con la forma del de Supabase
// (`rpc('mi_billetera')`) y lo pasa por `crearBilleteraApi`, que es la capa
// real. El núcleo (`hooks/billeteraCore.js`), el ajuste local y entrar /
// recargar / salir son exactamente los de la app, así que el arnés prueba ese
// código y no un doble suyo. Es el molde de `salasFixtures.js` (A2).
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

import { crearBilleteraApi } from '../lib/billeteraApi'
import { siembraAPU } from './siembraAPU'

// La huella que busca la guardia sobre `dist/`. Si algún día aparece en el
// bundle de producción, la puerta se ha roto.
export const MARCA_BILLETERA_FALSA = 'ajilei:billetera-falsa'

/**
 * La billetera simulada, o `null` fuera de desarrollo con bypass.
 * @returns {{inicial:number, leer:Function}|null}
 */
export function simulacionBilletera() {
  // ── La primera línea es la que borra el archivo en producción ────────────
  if (!import.meta.env.DEV) return null
  if (!import.meta.env.VITE_AUTH_BYPASS) return null

  const saldo = siembraAPU()?.saldo ?? 5000
  return crearBilleteraApi(clienteFalso(saldo), { inicial: saldo })
}

// El «servidor» de la billetera falsa. En la 1b el servidor no se mueve nunca
// —las partidas contra las IAS van al ajuste local—, así que contesta siempre
// la misma cifra, como haría `mi_billetera()` con una cuenta quieta.
function clienteFalso(saldo) {
  return {
    marca: MARCA_BILLETERA_FALSA,
    rpc(nombre) {
      if (nombre !== 'mi_billetera') return Promise.resolve({ data: null, error: null })
      return Promise.resolve({ data: saldo, error: null })
    },
  }
}
