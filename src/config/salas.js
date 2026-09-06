// ── SAL-A · Las constantes selladas de las salas PvP ────────────────────────
// Rector: AJILEI_SALA_Fase1_v1.0.md §4.1.
//
// Módulo SIN React ni DOM, molde de `niveles.js`, `tapetes.js` y `textos.es.js`:
// así lo importan igual la app, Vitest y —el día que haga falta— un arnés desde
// `node`, en vez de mantener una copia paralela de las cifras.
//
// ── FÓRMULA SOBRE CONSTANTE, Y UNA SOLA VEZ ─────────────────────────────────
// Regla 5 de la tanda. Las cifras selladas viven AQUÍ y en ningún otro sitio del
// cliente; lo que un componente necesita saber lo pide con una función. El
// precedente es `niveles.js` con `apuestasDe(id)`: la pantalla no filtra tablas,
// pregunta. La lección de dónde acaba lo contrario está en la Fase 0 §5.2 —
// `saldoInicial` se lee hoy en SEIS sitios, uno de ellos dentro de un archivo
// protegido, y por eso ECO-1 no puede cambiarlo sin tocar seis manos.
//
// ── EL ESPEJO DEL SERVIDOR ──────────────────────────────────────────────────
// Estas mismas cifras están del otro lado, en `check` de columna y en las
// funciones de la migración `<timestamp>_sal_a_salas.sql`: las seis apuestas en
// `salas.apuesta`, la regla 5× en `crear_sala`/`unirse_sala`, el alfabeto en
// `salas_codigo_formato_chk`, los 180 s en el defecto de `expira_en`.
//
// LA DUPLICACIÓN ES DELIBERADA Y NO ES UNA FUENTE DE VERDAD PARTIDA. El cliente
// no valida: decide qué botón enseñar apagado para no gastar un viaje de red en
// algo que ya sabe. Quien decide de verdad es el servidor, que es el único al
// que un jugador no puede mentir. Es la misma doctrina que `REGLA_USERNAME` en
// `useAuth.js:66` declara palabra por palabra: «Esta copia NO valida: sólo
// enciende o apaga el botón mientras se teclea… Cualquier discrepancia la gana
// la base». Si un día divergen, la base tiene razón y esto es el que se corrige.

import { AJILEI_CONFIG } from './ajileiConfig'

// ── Las seis apuestas ───────────────────────────────────────────────────────
// Selladas. NO son las de `niveles.js` ni las de `STAKE_OPTIONS`: aquéllas están
// atadas a la dificultad de la IA, un concepto que en PvP no existe (Fase 0
// §5.1). Que la lista esté ordenada de menor a mayor es contrato: la pantalla
// las pinta en este orden y `apuestasAlAlcance` conserva el filtro estable.
export const APUESTAS_PVP = [100, 200, 500, 1000, 2000, 5000]

// El bono con el que nace una cuenta. La Fase 0 §5.3 buscó un `1200` en todo el
// árbol y no había ninguno: esta línea es la primera vez que la cifra existe.
export const BONO_BIENVENIDA = 1200

// ── La regla del 5× ─────────────────────────────────────────────────────────
// Para sentarse a una mesa hay que tener CINCO veces la apuesta, no una. No es
// una traba: una mesa donde alguien entra con el saldo justo para el ante se
// queda sin ese jugador en la primera mano y deja la partida coja para los otros
// cuatro. El 5 es el colchón que hace que un asiento ocupado siga ocupado.
export const REGLA_ASIENTO = 5

/** Saldo mínimo para sentarse a una mesa de esta apuesta. */
export function saldoMinimo(apuesta) {
  return REGLA_ASIENTO * apuesta
}

/**
 * Las apuestas que este saldo alcanza, en el orden sellado.
 * Devuelve un array NUEVO en cada llamada: quien lo reciba puede ordenarlo o
 * recortarlo sin corromper `APUESTAS_PVP` para el resto de la app.
 */
export function apuestasAlAlcance(saldo) {
  if (!Number.isFinite(saldo)) return []
  return APUESTAS_PVP.filter((apuesta) => saldoMinimo(apuesta) <= saldo)
}

// Lo que alcanza una cuenta recién nacida: [100, 200]. Se DERIVA en vez de
// escribirse, para que el día que el bono o la regla cambien esta lista cambie
// sola en vez de quedarse mintiendo.
export const ALCANCE_NUEVOS = apuestasAlAlcance(BONO_BIENVENIDA)

// ── El alfabeto del código, y por qué le faltan cuatro letras ───────────────
// Sin O ni 0, sin I ni 1. Un código se lee en voz alta por teléfono, se teclea
// mirando una captura de pantalla y se dicta a alguien que va en un autobús: los
// dos pares que se confunden a la vista salen de la baraja y con ellos toda una
// clase de fallo que, si no, aparece como «el código no funciona» sin que nadie
// sepa por qué. Quedan 32 símbolos → 32⁴ = 1 048 576 combinaciones, de sobra
// para una beta cerrada donde además el código sólo vive tres minutos.
//
// ESTA CADENA Y EL `check` DE LA BASE SON EL MISMO ALFABETO escrito de dos
// maneras: aquí en extenso, allí como rango `[A-HJ-NP-Z2-9]`. El test compara
// las dos formas carácter a carácter, que es la única manera de que no se
// separen en silencio.
export const ALFABETO_CODIGO = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

// El mismo alfabeto en forma de rango, tal cual viaja en la migración. Se
// exporta para que el test pueda confrontarlo con la cadena de arriba.
export const CODIGO_REGEX = /^AJ-[A-HJ-NP-Z2-9]{4}$/

/**
 * Deja un código tecleado en su forma canónica `AJ-XXXX`, o `null` si no lo es.
 *
 * ACEPTA de todo lo que un humano escribe de verdad: minúsculas, espacios, el
 * prefijo puesto o quitado, el guion puesto o quitado. `aj 7k2m`, `7K2M`,
 * `AJ-7K2M` y `aj7k2m` son el mismo código. Lo que NO acepta es un carácter
 * fuera del alfabeto: `AJ-0OI1` devuelve `null` aunque «parezca» un código,
 * porque esos cuatro símbolos no se emiten nunca y aceptarlos sería prometer una
 * búsqueda que la base no puede satisfacer.
 *
 * Devuelve `null` y no lanza: el consumidor es un campo de texto que se teclea
 * carácter a carácter, y ahí «todavía no es válido» es el estado normal, no un
 * error.
 */
export function normalizarCodigo(texto) {
  if (typeof texto !== 'string') return null

  // Fuera todo lo que no sea letra o dígito —espacios, guiones, el guion bajo—
  // y a mayúsculas. A partir de aquí sólo quedan cuerpo y, quizá, prefijo.
  const limpio = texto.toUpperCase().replace(/[^A-Z0-9]/g, '')

  // El prefijo se reconoce por LONGITUD y no sólo por las dos primeras letras:
  // un cuerpo de cuatro que empezara por `AJ` (y `A` y `J` están los dos en el
  // alfabeto) se comería sus propias letras si aquí se mirara sólo el comienzo.
  let cuerpo
  if (limpio.length === 6 && limpio.startsWith('AJ')) cuerpo = limpio.slice(2)
  else if (limpio.length === 4) cuerpo = limpio
  else return null

  for (const caracter of cuerpo) {
    if (!ALFABETO_CODIGO.includes(caracter)) return null
  }
  return `AJ-${cuerpo}`
}

// ── Los tres minutos ────────────────────────────────────────────────────────
// El cronómetro de la sala de espera. Vive aquí en SEGUNDOS porque es lo que la
// pantalla cuenta; la base lo escribe como `now() + interval '3 minutes'` en el
// defecto de `expira_en`, y el test que compara los dos números no existe —no
// hay forma de leer el defecto de una columna desde Vitest—, así que este
// comentario es el enlace: si uno cambia, el otro se cambia a mano.
export const DURACION_SALA_SEG = 180

// ── Los tamaños de mesa ─────────────────────────────────────────────────────
// [2, 3, 4, 5]. NO se escribe a mano: se DERIVA de `AJILEI_CONFIG.game`, que es
// quien decide de cuántos puede ser una mesa de Ajilei y ya gobernaba el motor y
// los asientos mucho antes de que existieran las salas. Escribir la lista aquí
// sería abrir la puerta a que un PvP de seis jugadores pareciera posible en la
// pantalla y reventara en el reparto. La base lo repite en su `check (jugadores
// between 2 and 5)`, con el mismo trato que las apuestas.
export const JUGADORES_PVP = Array.from(
  { length: AJILEI_CONFIG.game.playersMax - AJILEI_CONFIG.game.playersMin + 1 },
  (_, i) => AJILEI_CONFIG.game.playersMin + i
)
