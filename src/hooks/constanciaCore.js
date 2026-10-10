// ── ECO-1d · La constancia, vista desde el teléfono ─────────────────────────
// Rector: AJILEI_ECO-1_Fase1d_v1.0.md §2.2 y el plan aprobado del STOP-1 (§1).
// Módulo PURO, sin React ni red: lo que aquí se decide se sella con pruebas sin
// jsdom (hallazgo de FRZ-1). El servidor es quien cuenta y quien paga
// (`marcar_ingreso`, migración eco1d); aquí sólo se decide CUÁNDO preguntarle y
// qué pinta la ficha del lobby (lámina `laminas/eco1d`, ubicación A, aprobada).
//
// ── CUÁNDO SE PREGUNTA ──────────────────────────────────────────────────────
// Al arrancar con sesión y perfil, una vez por cuenta (la guarda de App), y al
// volver a primer plano SÓLO si a la vez:
//   · el día de Chicago del reloj del teléfono ya no es el último que dijo el
//     servidor (o el servidor aún no ha dicho ninguno: la llamada del arranque
//     no llegó o contestó `limite`);
//   · no hay otra llamada en curso;
//   · pasaron al menos 60 s desde la última.
// El reloj del teléfono sólo decide cuándo preguntar: si miente, lo peor es una
// llamada de más, que el servidor contesta con `ya_marcado`.

/** Cada cuántos días seguidos se cobra. Espejo: `constancia_ciclo()` del SQL. */
export const CICLO_CONSTANCIA = 3

/** Lo mínimo entre dos llamadas que no son la del arranque. */
export const ESPERA_MARCAR_MS = 60_000

const FECHA_CHICAGO = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/Chicago', year: 'numeric', month: '2-digit', day: '2-digit',
})

/** El día de Chicago de un instante, 'AAAA-MM-DD' (como `dia_chicago` del SQL). */
export function diaChicago(ms) {
  return FECHA_CHICAGO.format(new Date(ms))
}

/**
 * ¿Toca preguntar al volver a primer plano?
 * @param {{ultimoDia:string|null, enVuelo:boolean, ultimaLlamada:number|null}} estado
 * @param {number} ahora  ms
 */
export function debeMarcar(estado, ahora) {
  if (!estado || estado.enVuelo) return false
  if (estado.ultimaLlamada !== null && ahora - estado.ultimaLlamada < ESPERA_MARCAR_MS) return false
  return diaChicago(ahora) !== estado.ultimoDia
}

/**
 * La ficha del lobby tras una respuesta de `marcar_ingreso`.
 *   lleno    cuántas monedas del ciclo están llenas (1, 2 o 3).
 *   posa     un contador: sube con cada ingreso NUEVO (`ok`) y la moneda del
 *            día se posa con un salto cuando cambia. `ya_marcado` no lo mueve:
 *            abrir otra vez el mismo día no salta.
 *   avisoId  si el ingreso cobró, el aviso de saldo que lo cuenta: la moneda
 *            del día se posa CUANDO ese aviso empieza a contar, no antes.
 * Una respuesta sin datos (`red`, `limite`, `sin_*`) deja la ficha como estaba.
 */
export function fichaTrasMarcar(previa, r, avisoId = null) {
  if (!r || !(r.diaDelCiclo >= 1 && r.diaDelCiclo <= CICLO_CONSTANCIA)) return previa ?? null
  if (r.codigo === 'ok') {
    return { lleno: r.diaDelCiclo, posa: (previa?.posa ?? 0) + 1, avisoId: r.cobrado > 0 ? avisoId : null }
  }
  if (r.codigo === 'ya_marcado') {
    return { lleno: r.diaDelCiclo, posa: previa?.posa ?? 0, avisoId: previa?.avisoId ?? null }
  }
  return previa ?? null
}

/**
 * ¿La moneda del día ya se ve llena? Siempre, salvo que espere a su aviso de
 * cobro: entonces cuando ese aviso es el que se pinta y ya cuenta.
 */
export function monedaPosada(ficha, avisoEnCurso, contando) {
  if (!ficha?.avisoId) return true
  return avisoEnCurso?.id === ficha.avisoId && contando === true
}

/** La ficha suelta su aviso (terminó, o se vació la fila al entrar en la mesa). */
export function soltarAvisoDeFicha(ficha) {
  return ficha?.avisoId ? { ...ficha, avisoId: null } : ficha
}
