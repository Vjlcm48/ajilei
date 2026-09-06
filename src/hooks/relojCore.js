// ── SAL-A · El reloj del servidor, en su mitad pura ─────────────────────────
// Rector: AJILEI_SALA_Fase1_v1.0.md §5.1.
//
// Sin React, sin DOM y —esto es lo importante— SIN `Date.now()`. La hora local
// entra por parámetro en todas las funciones de este archivo. Molde de
// `nivelCore.js`, `tapetesCore.js` y `celebracionCore.js`: la semántica en un
// módulo puro, la infraestructura en el hook.
//
// Que el núcleo no llame a `Date.now()` no es purismo: es lo que permite probar
// el vencimiento de un cronómetro de tres minutos sin esperar tres minutos, y
// probar un reloj adelantado sin tocar el reloj de la máquina.
//
// ── POR QUÉ EL CLIENTE NO PUEDE CONTAR SOLO ─────────────────────────────────
// La Fase 0 §2 midió que hoy no hay una sola lectura de hora de servidor en toda
// la app, y que el único cronómetro que existe —el de la Portada— se apoya en un
// `setInterval` cuyo propio comentario declara que «el límite de verdad lo impone
// el servidor». Ahí eso bastaba porque sólo apagaba un enlace.
//
// Aquí no basta, por dos motivos distintos que conviene no confundir:
//
//   1. EL RELOJ DEL TELÉFONO PUEDE ESTAR CORRIDO. Horas, días. Un jugador con la
//      fecha mal puesta vería una sala «vencida hace dos días» o «con 47 horas
//      por delante». Restar `expira_en − Date.now()` es exactamente el fallo.
//
//   2. UN `setInterval` DE 1 s NO ES UN CRONÓMETRO. En una pestaña congelada
//      —FRZ-1— el navegador lo estrangula y acumula minutos de retraso. Contar
//      pulsos es contar la atención del navegador, no el tiempo.
//
// La salida es medir el DESFASE una vez al entrar y contar siempre contra la
// hora local corregida. El intervalo de 1 s se queda, pero sólo como latido que
// dispara un repintado: en cada pulso se vuelve a CALCULAR el restante contra el
// reloj corregido en vez de restarle uno al número anterior. Así una pestaña que
// vuelve de dormir se pone al día en el primer fotograma.

/**
 * El desfase entre el reloj del servidor y el de esta máquina, en milisegundos.
 *
 * Positivo = el servidor va por delante (el reloj local atrasa).
 * Negativo = el servidor va por detrás (el reloj local adelanta).
 *
 * ── LO QUE ESTA MEDIDA NO CORRIGE, DECLARADO ────────────────────────────────
 * La latencia del viaje. Entre que el servidor dice su hora y el cliente la
 * recibe pasan decenas o cientos de milisegundos, así que el desfase calculado
 * lleva ese error dentro y el reloj local queda ligeramente ATRASADO respecto al
 * real. Se acepta a propósito: corregirlo bien exige medir ida y vuelta (media
 * de varias muestras, estilo NTP) y aquí se está contando una cuenta atrás de
 * tres minutos que se muestra en segundos enteros. Un error de 200 ms no lo ve
 * nadie, y el vencimiento de verdad lo decide el servidor —`resolver_sala`—, no
 * este número.
 *
 * @param {string|number|Date} servidor  lo que devolvió `rpc('ahora')`
 * @param {number} ahoraLocal            `Date.now()` del momento de recibirlo
 * @returns {number} milisegundos; 0 si la hora del servidor no se pudo leer
 */
export function calcularDesfase(servidor, ahoraLocal) {
  const ms = aMilisegundos(servidor)
  // Un `timestamptz` ilegible degrada a «sin corrección» en vez de envenenar
  // todos los cronómetros con un `NaN` que se propaga en silencio.
  if (!Number.isFinite(ms) || !Number.isFinite(ahoraLocal)) return 0
  return ms - ahoraLocal
}

// ── `new Date(null)` NO es una fecha inválida, y ahí estaba la trampa ───────
// Devuelve la época — 1 de enero de 1970—, un número perfectamente finito, así
// que un `Number.isFinite` sobre el resultado da `true` y el guardia no salta.
// Con una RPC que fallara y devolviera `null`, el desfase habría salido de
// −1 788 609 600 000 ms: cincuenta y seis años, y todas las salas vencidas al
// nacer. Lo cazó el test antes que la sala.
//
// `undefined` sí produce `NaN`, y `''` también da época en algunos motores. Por
// eso los tres se rechazan a mano ANTES de construir la fecha, en vez de
// confiar en que `Date` distinga la ausencia de una hora del año cero.
function aMilisegundos(valor) {
  if (valor === null || valor === undefined || valor === '') return NaN
  return new Date(valor).getTime()
}

/**
 * La hora del servidor, estimada desde la local y el desfase.
 *
 * @param {number} ahoraLocal  `Date.now()`
 * @param {number} desfase     el de `calcularDesfase`
 * @returns {number} milisegundos desde la época, en tiempo de servidor
 */
export function ahoraServidor(ahoraLocal, desfase = 0) {
  return ahoraLocal + (Number.isFinite(desfase) ? desfase : 0)
}

/**
 * Segundos que faltan para un instante, contados en tiempo de servidor.
 *
 * NUNCA devuelve un número negativo: una sala vencida hace un minuto está a
 * cero, no a −60. La pantalla que lo pinta no tiene que acordarse de recortar, y
 * `restante(x) === 0` es la única condición de vencimiento que hay que escribir.
 *
 * Redondea HACIA ARRIBA, que es lo que hace que la cuenta empiece diciendo «3:00»
 * y no «2:59»: en el instante de crearse la sala faltan 180 000 ms exactos, y con
 * `floor` el primer fotograma ya enseñaría 179. También significa que el «0»
 * aparece justo cuando se agota y no un segundo antes.
 *
 * @param {string|number|Date} expiraEn  el `expira_en` de la sala
 * @param {number} ahoraEnServidor       de `ahoraServidor()`
 * @returns {number} segundos enteros ≥ 0
 */
export function restante(expiraEn, ahoraEnServidor) {
  const fin = aMilisegundos(expiraEn)
  if (!Number.isFinite(fin) || !Number.isFinite(ahoraEnServidor)) return 0
  return Math.max(0, Math.ceil((fin - ahoraEnServidor) / 1000))
}

/**
 * Segundos a `m:ss`, para pintar. `180 → '3:00'`, `7 → '0:07'`, `0 → '0:00'`.
 *
 * Vive aquí y no en el componente porque es semántica y no pintura: el mismo
 * formato lo van a querer la Sala de espera y cualquier aviso que lo mencione, y
 * dos implementaciones de esto se separan en el primer caso de borde (el 60,
 * siempre el 60).
 */
export function comoReloj(segundos) {
  const seg = Number.isFinite(segundos) ? Math.max(0, Math.floor(segundos)) : 0
  const m = Math.floor(seg / 60)
  const s = seg % 60
  return `${m}:${String(s).padStart(2, '0')}`
}
