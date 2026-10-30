// ── RNK-1c · Los jugadores de mentira del bypass, para ver Rankings llena ────
// Rector: AJILEI_RNK-1_Fase1c-i_v1.0.md §2.6 (M-3 de la 1b). La ficha daba por
// hecho que `SEMBRADOS_DEMO` (bancoImitado.js) traía 130 jugadores con puntos y
// 140 con billetera; trae seis, que son los del espejo del guion y así se
// quedan. Para que `npm run dev` enseñe la pantalla como la lámina —lista de
// 100 que desplaza, podio, el corte y «Tu posición»— el bypass siembra éstos.
//
// Son la forma de la lámina `laminas/rnk1/pantalla.html` (semilla 1976, los
// mismos nombres inventados), con una diferencia: la cuenta del bypass
// (`DevLocal`, 11 puntos) queda SOLA en el puesto 7, sin el empate de la
// lámina, porque con el Ajuste A el puesto es único y el bypass suma sus
// puntos el último. 129 con puntos + el bypass = 130; diez más con 0 puntos
// (sólo salen en Fortunas) = 140 con billetera. Un comprador (ElCatire88,
// 48.700) encabeza Fortunas; dos quebrados en 0; un nombre de 15 caracteres
// (MaracuchaBrava_) para ver el «…».
//
// Sólo lo importa `billeteraFalsa.js`, detrás de su puerta doble: en
// producción el banco del bypass no existe y esto no llega al bundle.

// Los puntos de la cuenta del bypass: seis por encima → puesto 7.
export const PUNTOS_DEL_BYPASS = 11

// Una cadena y no una lista partida al cargar: un `split()` en el nivel del
// módulo es un efecto que el empaquetador no puede tirar, y estos nombres
// acababan en `dist/` (medido). Se parte dentro de `sembradosRanking`.
const NOMBRES = `Bachaquero_VE Chamo_Pro MaracuchaBrava_ ElCatire88 LaNegraTomasa Pana_Jose
  Yulimar77 Tigrito_21 MargaritaSol Guaro_Real Andino_Merida LlaneroFiel ElGocho_ Arepera_Mayor
  Chiguire_23 Rosaura_M Pelotero_9 Cumanes_ OrinocoAzul TepuyAlto Perla_Negra CachapaQueso
  JoropoLibre Guayaba_Rosa Cocuy_Pecayero Turpial_77 Araguaney_1 Moriche_Palma CardonSol Samanes_
  Caribe_Mar Danta_Fuerte Lapa_Roja ElPapelon Tequenon Malojillo Parchita_8 Merengon_ Bienmesabe
  Golfeado_ Catalina_V Majarete Quesillo_9 Hallaquita Pabellon_C Asopado Chupe_Andino Mandoca_Zulia
  Patacon_Max Tostonero Casabe_Ind Bollito_ Polvorosa Conserva_C Jalea_Mango Dulce_Leche Marquesa_
  Torta_Burra Cocadas_ Alfondoque Huevo_Chimbo Besitos_Coco Catalinas_ Mojito_VE Papelon_Lim
  Chicha_And Fororo_ Atol_Maiz Carato_ Majarete_2 Sancocho_ Mondongo_ Pisca_Andina Cruzado_
  Hervido_ Funche_ Tizana_ Bijao_ Topocho_ Cambur_Pinto Lechosa_ Mamon_Rey Guanabana_ Nispero_
  Ponsigue Icaco_ Caimito_ Merey_ Pomalaca Anon_Dulce Cotoperiz Uvero_ Mamey_ Tamarindo_
  Ciruela_Hue Grosella_ Cereza_Neg Corozo_ Chirimoya Pitahaya_ Semeruco Guama_ Mango_Bocado
  Jabillo Ceiba_Alta Apamate_ Bucare_ Yaque_ Curarire Saman_Viejo Indio_Desn Gavilan_ Guacharaca
  Paraulata Querrequerre Cristofue_ Pericos_ Guacamaya_ Garzon_Sold Corocoro_ Chenchena
  Arrendajo_ Tucusito_ Colibri_ Pavito_ Turpialito Azulejo_ Canario_ Cardenalito Gonzalito
  Guardacaminos Rio_Caroni Salto_Angel Roraima_ Choroni_Mar Mochima_ Morrocoy_ Los_Roques
  Canaima_`

// [puntos, cuántos]: 129 jugadores con ≥ 1 punto.
const FORMA = [[96, 1], [74, 1], [58, 1], [41, 1], [27, 1], [18, 1], [10, 5], [9, 6], [8, 8],
  [7, 12], [6, 22], [5, 32], [4, 3], [3, 9], [2, 12], [1, 14]]
const SIN_PUNTOS = 10

// CFG-1 1b · el lugar de cada sembrado (R-5), con el reparto de la lámina
// `laminas/cfg1b/app.jsx`: casi todos de Venezuela o de la diáspora, alguno
// sin país, y los nombres largos con estado (para ver el «…» de la fila).
const REPARTO = [['VE', 'ZUL'], ['VE', null], ['CO', null], ['US', null], [null, null], ['ES', null], ['VE', 'DC'],
  ['PA', null], ['CL', null], ['VE', 'LAR'], ['AR', null], ['PE', null], ['MX', null], ['VE', 'CAR'], ['EC', null], ['CW', null], ['AW', null], ['PR', null]]
function lugarDe(username) {
  let h = 0
  for (const ch of username) h = (h * 31 + ch.charCodeAt(0)) >>> 0
  const [pais, estado] = REPARTO[h % REPARTO.length]
  return { pais, estado }
}

// El azar de la lámina (mulberry32), para que las cifras salgan iguales cada vez.
function azarCon(semilla) {
  let s = semilla
  return () => {
    s = (s + 0x6d2b79f5) | 0
    let x = Math.imul(s ^ (s >>> 15), 1 | s)
    x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296
  }
}

/** Los 139 jugadores sembrados, en la forma de `crearBanco({ sembrados })`. */
export function sembradosRanking() {
  const nombres = NOMBRES.split(/\s+/).filter(Boolean)
  const azar = azarCon(1976)
  const filas = []
  let i = 0
  for (const [puntos, n] of FORMA) {
    for (let k = 0; k < n; k++) filas.push({ username: nombres[i++], puntos })
  }
  for (let k = 0; k < SIN_PUNTOS; k++) filas.push({ username: nombres[i++], puntos: null })

  let ceros = 0
  return Object.freeze(filas.map((f, k) => {
    let saldo
    if (f.username === 'ElCatire88') saldo = 48700
    else if (f.puntos === null) saldo = ceros++ < 2 ? 0 : 2500
    else saldo = Math.min(12950, Math.round((900 + f.puntos * 95 + Math.floor(azar() * 7200)) / 50) * 50)
    // Fechas distintas para que los empates los decida la fecha (Ajuste A).
    return Object.freeze({ ...f, puntosHace: (k + 1) * 6e5, saldo, saldoHace: (k + 1) * 6e5, ...lugarDe(f.username) })
  }))
}
