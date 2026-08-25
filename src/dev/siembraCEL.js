// ── siembraCEL.js · El molde de la campaña CEL: GAME_OVER en un paso ────────
// Llegar a la pantalla de victoria de mesa costaba, hasta hoy, jugar una partida
// entera contra la IA hasta desplumarla: minutos por corrida, resultado no
// determinista (puede ganar una IA) y una regresión visual imposible de repetir
// dos veces igual. La campaña CEL entera —y sus regresiones futuras— vive en esa
// pantalla, así que necesita una puerta.
//
// QUÉ HACE. Con `?cel` en la URL, los RIVALES nacen sin fichas. Nada más. El
// motor hace el resto solo y por su propia regla: `startHand` marca
// `eliminated` a todo el que no pueda pagar el ante (`p.chips < unit`), cuenta
// los vivos, y con uno solo cierra la mesa en GAME_OVER con `winner` = el
// superviviente. Como el superviviente es el asiento 0, `decideCelebracion`
// devuelve 'partida' y la tarjeta-resumen monta. Un clic en "Iniciar mano" y
// estás en la pantalla.
//
// POR QUÉ ASÍ Y NO DE OTRA FORMA.
//   · No abre `gameEngine.js`, que es protegido. No hay condición nueva ni
//     atajo: se usa la condición terminal que el motor YA tiene, alimentándola
//     con un estado inicial distinto. El motor no se entera de que existe esto.
//   · No inventa una pantalla ni un modo de render. Lo que se ve es la pantalla
//     de verdad, montada por el camino de verdad — que es el requisito de
//     cualquier molde que vaya a servir de referencia visual.
//   · No toca la estadística de sesión. `sesionCore` cuenta lo que de verdad
//     pasó, y con `?cel` no pasó ninguna mano: la tarjeta dirá "Manos jugadas
//     0". Es una limitación REAL del atajo, no un defecto a tapar sembrando
//     cifras falsas en la tarjeta — una tarjeta que miente no sirve para
//     calibrar una tarjeta. Para verla con cifras vividas está `?cel=<n>`.
//
// USO
//   ?cel        → rivales a 0 fichas. DETERMINISTA: la mesa termina en el
//                 primer "Iniciar mano", siempre, en las cuatro mesas.
//   ?cel=<n>    → rivales con n fichas. Aguantan mientras puedan pagar el ante
//                 (`n >= unit`), así que se juegan manos de verdad y la tarjeta
//                 sale con cifras vividas. NO es determinista: una IA puede
//                 ganar el pozo y estirar la partida, o ganar la mesa.
//   &frase=<n>  → CEL-1. Fuerza la frase n del banco (1-based) en vez de
//                 sortearla, para medir la más larga sin depender de la
//                 lotería. No toca la memoria de "última frase mostrada":
//                 forzar una frase para medirla no debe cambiar la que el
//                 jugador verá en su próxima victoria de verdad.
//   &melodia=<n> → CEL-2. Lo mismo para la bolsa de melodías.
//
// SÓLO EN DESARROLLO. `import.meta.env.DEV` lo apaga en cualquier build de
// producción: allí la función es la identidad y el parámetro no significa nada.
// La puerta es doble a propósito —el gate del build Y la presencia del
// parámetro—, para que ni un despiste de configuración pueda sembrar una mesa
// real.

export const CEL_PARAM = 'cel'

// Devuelve el estado tal cual (identidad) salvo que se pida la siembra.
export function siembraCEL(estado) {
  if (!import.meta.env.DEV) return estado
  if (typeof window === 'undefined') return estado

  let crudo
  try { crudo = new URLSearchParams(window.location.search).get(CEL_PARAM) }
  catch { return estado }
  if (crudo == null) return estado

  // `?cel` a secas llega como cadena vacía → 0, que es el caso determinista.
  // Un valor no numérico o negativo cae también a 0: el molde nunca se queda a
  // medias por una URL mal escrita, se comporta como el caso por defecto.
  const n = Number.parseInt(crudo, 10)
  const fichas = Number.isFinite(n) && n > 0 ? n : 0

  return {
    ...estado,
    players: estado.players.map((p, i) => (i === 0 ? p : { ...p, chips: fichas })),
  }
}

// ── CEL-1/CEL-2 · Los accesorios forzados del molde ─────────────────────────
// Misma DOBLE PUERTA que la siembra —el gate del build Y la presencia del
// parámetro—, y además exigen `?cel`: son accesorios del molde, no parámetros
// sueltos. Devuelven `null` (= sortea) ante cualquier duda.
export const FRASE_PARAM = 'frase'
// CEL-2 · `&melodia=<n>` fuerza la pieza n de la bolsa (1-based). Sirve para
// auditar una melodía concreta sin recargar hasta que salga por sorteo, y —como
// la frase— NO toca la memoria de "última sonada".
export const MELODIA_PARAM = 'melodia'

function forzadoCEL(param) {
  if (!import.meta.env.DEV) return null
  if (typeof window === 'undefined') return null
  try {
    const q = new URLSearchParams(window.location.search)
    if (q.get(CEL_PARAM) == null) return null
    const n = Number.parseInt(q.get(param), 10)
    return Number.isFinite(n) && n >= 1 ? n : null
  } catch { return null }
}

export function fraseForzadaCEL() { return forzadoCEL(FRASE_PARAM) }
export function melodiaForzadaCEL() { return forzadoCEL(MELODIA_PARAM) }
