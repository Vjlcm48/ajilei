// ── APU-1 · Entrada a la mesa y pila de las IAS ───────────────────────────────
//
// Módulo PURO, sin React ni DOM. Normativo: `docs/AJILEI_APU-1_Reglas_v1.1.md`
// §2.2 (entrada), §2.3 (pila de las IAS) y §5.3 (nivelado tras recarga).
//
// La ENTRADA son las fichas con que un asiento se sienta; la APUESTA DE MESA
// (`unit`) es la unidad de todo. Antes de 1e no existía ninguna de las dos
// cosas: todos nacían con una sola constante, la misma que era a la vez el
// saldo del jugador. Desde 1e la mesa se arma con esta pieza, y esa constante
// —hoy `economy.pilaPruebas`— sólo sienta las mesas del banco y de las pruebas.
//
// MOT-1 no la usa: en PvP la entrada la fija SQL.

import { AJILEI_CONFIG } from '../config/ajileiConfig.js'

// La clave nació como `betting.entradaMesa` porque `betting.entrada` era
// todavía el número 10 que `gameEngine.js:20` usaba como unidad por defecto. La
// §3.1 de la ficha renombró esa vieja a `betting.unidadPorDefecto` y esta pasó
// a `betting.entrada`. Este lector sirvió para las dos sin tocarse, y se deja
// tolerante porque la copia del motor de la sonda todavía lleva el nombre viejo.
function cfgEntrada(cfg) {
  const b = cfg?.betting ?? {}
  const e = b.entradaMesa ?? b.entrada
  return (e && typeof e === 'object') ? e : { piso: 10, medio: 20, techo: 50 }
}

export const MOTIVOS_ENTRADA = Object.freeze({
  MONTO_INVALIDO: 'monto_invalido',   // no entero, ≤ 0, o no múltiplo de la apuesta
  BAJO_PISO:      'bajo_piso',
  SOBRE_TECHO:    'sobre_techo',
})

// Piso 10× y techo 50× la apuesta de mesa (§2.2). Fueron 5× y 50× hasta 1f-A4:
// ver el comentario de `betting.entrada` en `ajileiConfig.js` para el porqué.
export function pisoDe(unit, cfg = AJILEI_CONFIG) {
  return cfgEntrada(cfg).piso * unit
}

export function techoDe(unit, cfg = AJILEI_CONFIG) {
  return cfgEntrada(cfg).techo * unit
}

// El botón «Medio» del selector de cuatro (§2.2).
export function medioDe(unit, cfg = AJILEI_CONFIG) {
  return cfgEntrada(cfg).medio * unit
}

// La entrada es siempre un múltiplo entero de la apuesta de mesa, entre piso y
// techo. No mira el saldo real: eso lo hace la pantalla (§2.2), porque hasta
// ECO-1 el saldo real es una constante y no vive aquí.
export function entradaValida(monto, unit, cfg = AJILEI_CONFIG) {
  if (!Number.isInteger(monto) || monto <= 0)   return { ok: false, motivo: MOTIVOS_ENTRADA.MONTO_INVALIDO }
  if (!Number.isInteger(unit)  || unit  <= 0)   return { ok: false, motivo: MOTIVOS_ENTRADA.MONTO_INVALIDO }
  if (monto % unit !== 0)                       return { ok: false, motivo: MOTIVOS_ENTRADA.MONTO_INVALIDO }
  if (monto < pisoDe(unit, cfg))                return { ok: false, motivo: MOTIVOS_ENTRADA.BAJO_PISO }
  if (monto > techoDe(unit, cfg))               return { ok: false, motivo: MOTIVOS_ENTRADA.SOBRE_TECHO }
  return { ok: true, motivo: null }
}

// §2.3:  pila_IA = min( round( entrada_humano × FACTOR_IA ) , techo_de_la_mesa )
//
// EL FACTOR SUSTITUYE AL MARGEN (1c-2-iii, decisión 3 del rector). Hasta aquí
// la fórmula era `entrada + 1.000 HC`, un margen FIJO, y por eso su efecto
// dependia de la profundidad sin que nadie lo eligiera: en la mesa de 100, la
// IA se sentaba con ×3,00 la pila del humano si entraba al piso (5×), con
// ×1,67 al medio (15×) y con ×1,00 al techo (50×). D-27 del informe 1c-2 midió
// la consecuencia: no había ninguna entrada en la que las dos mitades de V1 —o
// de V2— se cumplieran a la vez, porque la ventaja de la IA se movía sola.
//
// Con un factor la ventaja es la MISMA a toda profundidad. El techo sigue
// topando, así que quien entra al techo se sienta exactamente igual que las
// IAS, como antes. Se redondea porque una pila es un entero de fichas: el
// factor 1,5 sobre una entrada que sea múltiplo impar de la apuesta da media
// ficha, y media ficha no existe.
export function pilaIA(entradaHumano, unit, cfg = AJILEI_CONFIG) {
  const factor = cfg?.ia?.factorPila ?? 1
  return Math.min(Math.round(entradaHumano * factor), techoDe(unit, cfg))
}

// §5.3: tras una recarga cada IA viva se completa HACIA ARRIBA. A la que ya va
// por encima de la fórmula no se le quita nada — la pila de una IA nunca se
// reduce por regla, solo por perder. La fórmula que se le aplica es la de
// arriba, con el factor: `max( actual , min( pila_humano_tras_recarga ×
// factor , techo ) )`.
export function nivelarIA(pilaActual, entradaHumano, unit, cfg = AJILEI_CONFIG) {
  return Math.max(pilaActual, pilaIA(entradaHumano, unit, cfg))
}

// La lista de jugadores que la Fase 1e le pasa a `createInitialState`: asiento 0
// humano con su entrada, el resto IAS con la pila de §2.3.
//
// ── LOS NOMBRES VIAJAN EXPLÍCITOS, Y NO ES ADORNO ─────────────────────────
// `createInitialState` tiene DOS formas. La numérica —la que usó la app hasta
// 1e— bautiza los asientos con una excepción para la mesa de dos: ahí el rival
// se llama «IA», a secas, porque no hay ningún otro del que distinguirlo. La
// forma de LISTA cae a `IA ${i}` para todo el que no traiga nombre, así que sin
// estas dos líneas el rival de la mesa de 2 pasaba a llamarse «IA 1» — y con él
// la rótula del óvalo, la crónica y el resultado.
//
// Lo cazó `diagDSK msg` en su punto T2 (informe 1e §E-7). Se arregla AQUÍ y no en
// el motor —que está protegido y cuya rama numérica es correcta—: quien arma la
// lista es quien tiene que decir cómo se llaman los asientos que arma.
export function jugadoresVsIA(entradaHumano, numPlayers, unit, cfg = AJILEI_CONFIG) {
  const pila = pilaIA(entradaHumano, unit, cfg)
  return [
    { isHuman: true, chips: entradaHumano, name: 'Tú' },
    ...Array.from({ length: Math.max(0, numPlayers - 1) }, (_, k) => ({
      isHuman: false,
      chips: pila,
      name: numPlayers === 2 ? 'IA' : `IA ${k + 1}`,
    })),
  ]
}
