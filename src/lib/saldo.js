// ── SAL-A · El ÚNICO lector de saldo que las salas pueden importar ──────────
// Rector: AJILEI_SALA_Fase1_v1.0.md §4.2.
//
// ── POR QUÉ EXISTE UN MÓDULO PARA UNA LÍNEA ─────────────────────────────────
// La Fase 0 §5.2 contó los sitios donde hoy se lee el saldo: SEIS. Uno de ellos
// —`gameEngine.js:57`, el que decide con cuántas fichas empieza un jugador—
// vive dentro de un archivo PROTEGIDO. Esa dispersión es la razón de que ECO-1
// no pueda cambiar el saldo por una billetera de verdad sin abrir seis manos, y
// una de ellas necesita autorización.
//
// Este archivo existe para que las salas no sean la séptima. SAL importa de
// aquí y de ningún otro sitio; el día que ECO-1 conecte Supabase, cambia esta
// función y las tres pantallas de salas no se enteran.
//
// LOS SEIS SITIOS EXISTENTES NO SE TOCARON en aquella tanda: eran de vs-IA,
// funcionaban, y moverlos habría sido una migración de toda la app metida de
// contrabando en una tanda de cimientos. APU-1 los deshizo por otra vía —las
// fichas de mesa salen de la entrada (§2.2) y las de prueba de
// `economy.pilaPruebas`— y en 1e-iii la constante del BOLSILLO bajó aquí, que
// es donde siempre debió estar: un solo sitio para que ECO-1 toque uno solo.
//
// ── EL ESPEJO DEL SERVIDOR ──────────────────────────────────────────────────
// `public.saldo_de(uuid)` en la migración de esta misma tanda hace lo mismo del
// otro lado y con el mismo aviso: devuelve la constante y lleva escrito que
// ECO-1 la sustituye. Que la regla 5× se compruebe en los dos sitios no es
// duplicación ociosa —el cliente apaga botones, el servidor decide— pero sí
// obliga a que las dos constantes se muevan juntas el día que se muevan.


/**
 * El saldo del jugador, en Heptacoins.
 *
 * PROVISIONAL: hoy devuelve una constante porque no hay billetera —el
 * producto no tiene ledger y una cifra que no se mueve es lo único honesto hasta
 * que exista—. ECO-1 lo conecta a Supabase; espejo de `saldo_de()` en la base.
 *
 * Es síncrona a propósito, y ése es el punto delicado de este contrato: el día
 * que consulte la red tendrá que devolver una promesa, y eso SÍ tocará a sus
 * consumidores. Por eso hay uno solo. Quien lo llame debe tratarlo ya como un
 * dato que puede tardar —enseñar el saldo, no calcular con él en un render—.
 *
 * @returns {number}
 */
// APU-1 1e-iii · la cifra vive AQUÍ y ya no en `ajileiConfig.economy`. Mientras
// se llamó `saldoInicial` la misma constante era el saldo del jugador y las
// fichas de cada asiento, y por eso «retirar saldoInicial» dejaba al saldo real
// sin fuente (D-5 de 1a). Separadas: las fichas de mesa salen de la entrada,
// las de prueba de `economy.pilaPruebas`, y esto —el bolsillo— es un
// PROVISIONAL con nombre propio que ECO-1 sustituye por la consulta de verdad.
const SALDO_PROVISIONAL = 5000

export function saldoDelJugador() {
  return SALDO_PROVISIONAL
}
