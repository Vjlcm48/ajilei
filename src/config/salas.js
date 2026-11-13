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
// `saldoInicial` se leía en SEIS sitios, uno de ellos dentro de un archivo
// protegido, y por eso ECO-1 no podía cambiarlo sin tocar seis manos. APU-1
// 1e-iii lo partió en dos: `economy.pilaPruebas` para el banco y las pruebas, y
// el bolsillo con nombre propio dentro de `lib/saldo.js`, que era el único que
// ECO-1 tendría que tocar. ECO-1b lo relevó por la billetera del servidor
// (`hooks/useBilletera.js`) y ya nadie importa aquel archivo.
//
// ── EL ESPEJO DEL SERVIDOR ──────────────────────────────────────────────────
// Estas mismas cifras están del otro lado, en `check` de columna y en las
// funciones de la migración `<timestamp>_sal_a_salas.sql`: las seis apuestas en
// `salas.apuesta`, la entrada en `entrada_de` (`<timestamp>_mot1_dinero.sql`), el
// alfabeto en `salas_codigo_formato_chk`, la vida de la sala en `duracion_sala`
// (`<timestamp>_mespvp_sub7a_duracion_sala.sql`).
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
// árbol y no había ninguno: esta línea fue la primera vez que la cifra existió.
//
// ECO-1b (B4) · 2.500, la cifra sellada (S1) y la que da de verdad el servidor
// desde la 1a (`bono_bienvenida_hc()` en la migración `eco1a_libro`). El 1.200
// contradecía al normativo (Fase 0 de ECO-1, §M-1). Si una cambia, la otra se
// cambia a mano: Vitest no puede leer una función SQL.
export const BONO_BIENVENIDA = 2500

// ── La entrada Corta ────────────────────────────────────────────────────────
// MOT-1 (C-12) · Para sentarse hay que tener la entrada de la mesa, que sale del
// saldo al sentarse. Hoy todas las mesas que arma el cliente son Cortas: 15 veces
// la apuesta (`entrada_de` en la migración `mot1_dinero`). Con el 5× de antes,
// `ArmarMesa` ofrecía mesas que el servidor rechaza. MES-PvP trae la fila Entrada.
export const REGLA_ASIENTO = 15

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

// Lo que alcanza una cuenta recién nacida: [100] desde MOT-1 (15 × 100 = 1.500 cabe
// en el bono de 2.500; 15 × 200 = 3.000, no). Se DERIVA en vez de
// escribirse, para que el día que el bono o la regla cambien esta lista cambie
// sola en vez de quedarse mintiendo.
export const ALCANCE_NUEVOS = apuestasAlAlcance(BONO_BIENVENIDA)

// ── El alfabeto del código, y por qué le faltan cuatro letras ───────────────
// Sin O ni 0, sin I ni 1. Un código se lee en voz alta por teléfono, se teclea
// mirando una captura de pantalla y se dicta a alguien que va en un autobús: los
// dos pares que se confunden a la vista salen de la baraja y con ellos toda una
// clase de fallo que, si no, aparece como «el código no funciona» sin que nadie
// sepa por qué. Quedan 32 símbolos → 32⁴ = 1 048 576 combinaciones, de sobra
// para una beta cerrada donde además el código sólo vive cinco minutos.
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

// ── Cuánto vive una sala ────────────────────────────────────────────────────
// MES-PvP 7a · 5:00 la privada (hay que pasar el código) y 3:00 la abierta. El
// cronómetro de la sala de espera cuenta desde el `expira_en` de la fila, así que
// la pantalla no usa esta cifra: es el ESPEJO de `duracion_sala(tipo)` (migración
// `<timestamp>_mespvp_sub7a_duracion_sala.sql`), que `crear_sala` escribe y la
// restitución de `salir_sala` repite. `salas.test.js` lee esa función del SQL y la
// compara con ésta. Un tipo que no es ninguno de los dos vale lo que el defecto de
// la columna, que se quedó en 3 minutos de respaldo.
const DURACIONES_SALA_SEG = Object.freeze({ privada: 300, abierta: 180 })

/** Segundos que vive una sala de este tipo (`'privada'` | `'abierta'`). */
export function duracionSala(tipo) {
  return DURACIONES_SALA_SEG[tipo] ?? DURACIONES_SALA_SEG.abierta
}

// ── SAL-B2 · Los diez segundos de la mesa llena ─────────────────────────────
// Rector: AJILEI_SAL-B2_Fase1a_v1.0.md §5. Cuando se ocupa la última silla,
// `unirse_sala` (migración `<timestamp>_sal_b2.sql`) acorta `expira_en` a
// `now() + interval '10 seconds'`: los que ya están no esperan a un reloj que
// ya no espera a nadie. Esta constante es el ESPEJO de ese `interval`, con el
// mismo trato que `duracionSala`: la cifra que decide vive en SQL, ésta
// sólo sirve para enseñar y para que las fixtures del arnés fabriquen una mesa
// llena coherente. Si cambia uno, el otro se cambia a mano.
export const LLENA_SEG = 10

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

// ── SAL-B1 · La memoria de la última mesa armada ────────────────────────────
// Rector: AJILEI_SAL-B1_Fase1_v1.0.md §4.4, que pide expresamente que el nombre
// de la clave viva AQUÍ. Es lo ÚNICO que esta sub-tanda añade a este archivo:
// ninguna de las líneas de arriba cambia.
//
// La lógica de leer y escribir está en `salaRecordada.js` y las guardas en
// `screens/salasCore.js`; aquí sólo el nombre, por la misma razón que
// `APUESTAS_PVP` está aquí y no en la pantalla que la pinta. Convención de la
// casa `ajilei.<cosa>`, la de `ajilei.nivel`, `ajilei.tapete`, `ajilei.idioma`,
// `ajilei.sound` y `ajilei.salaPendiente`.
//
// NUNCA VIAJA AL SERVIDOR. Es una comodidad del dedo —volver a la pantalla y
// encontrar puesto lo de ayer—, no un dato de la partida: la base no sabe ni
// tiene por qué saber qué mesa suele armar cada quien.
export const CLAVE_CONFIG_SALA = 'ajilei.salaConfig'

// ── SAL-B1 · Ajuste A1 · Una mesa `activa` sin partida es una mesa muerta ───
// Rector: AJILEI_SAL-B1_AjusteA1_v1.0.md §2.2. PROVISIONAL HASTA MES-PvP.
//
// En B1 no existe la partida: una mesa que el barrido arranca (`activa`) no
// lleva a ninguna parte, y sin esta regla RETENÍA al jugador para siempre —
// `mi_sala()` la devolvía en cada arranque y ninguna función la terminaba. Lo
// midieron dos teléfonos el 2026-09-11: hubo que cancelarla a mano en SQL.
//
// Los minutos que una `activa` sin `estado_partida` puede vivir desde que
// arrancó antes de que `barrer_salas()` la cancele. La cifra viaja COPIADA al
// SQL de la migración `<timestamp>_sal_b1_ajuste.sql` con un comentario que
// apunta aquí y ninguna prueba las compara (la vida de la sala sí, desde MES-PvP
// 7a, leyendo la migración): si una cambia, la otra se cambia a mano. El
// cliente NO la usa para decidir nada —el barrido es del servidor—; vive aquí
// para que la cifra tenga un dueño con nombre.
//
// MES-PvP, cuando exista la partida, reescribe el ciclo de vida de `activa` y
// esta constante se retira con la rama del barrido que la cita.
export const ACTIVA_SIN_PARTIDA_MIN = 10
