// ── PES-1 · Lo que no viaja en la primera descarga ──────────────────────────
// Rector: AJILEI_PES-1_Fase1_v1.0.md §1 y §3-B. La regla de INV-84: la entrada
// solo lleva lo que pinta la primera pantalla, y toda pantalla nueva nace
// diferida. El molde es UNO, el de la mesa (`creaCargador`, `lib/cargarMesa`):
// cada trozo es un cargador con su `import()`, y aquí viven todos los
// especificadores, para que quien precarga y quien entra pidan el mismo.
//
// QUIÉN LOS USA:
//   · `App` y las pantallas: `lazy(trozos.x.fabrica)`, siempre dentro de
//     `PantallaDiferida`, que decide qué se ve mientras llega.
//   · `HojaConfiguracion`: el contenido de la hoja del ⚙, al primer toque.
//   · `retar` (`App`): el canal de la mesa, ANTES de cobrar la entrada.
//
// El guardián es `scripts/testEntradaLigera.test.js`: si un `import` estático
// devuelve algo de esto a la entrada, se rompe él, no solo `1.8b`.
import { creaCargador, ociosoDelNavegador, trozoMesa } from './cargarMesa'

const trozo = (importar) => creaCargador(importar, ociosoDelNavegador)

export const trozos = Object.freeze({
  tienda: trozo(() => import('../screens/Tienda')),
  perfil: trozo(() => import('../screens/Perfil')),
  rankings: trozo(() => import('../screens/Rankings')),
  sumamente: trozo(() => import('../screens/IntersticialSumaMente')),
  salaOpciones: trozo(() => import('../screens/SalaOpciones')),
  armarMesa: trozo(() => import('../screens/ArmarMesa')),
  salaEspera: trozo(() => import('../screens/SalaEspera')),
  partidaPvP: trozo(() => import('../screens/PartidaPvP')),
  retar: trozo(() => import('../screens/RetarIAS')),
  capasVideo: trozo(() => import('../components/CapasVideo')),
  hoja: trozo(() => import('../components/HojaContenido')),
  controlMesa: trozo(() => import('./controlMesaIA')),
  // TUT-1 T2 · la partida guiada: su mesa, su capa y sus textos.
  // TUT-1 T3 · y TODO el tutorial de la tanda 3 en el mismo trozo (`screens/Guiada.jsx` lo
  // reexporta): «Cómo se juega», la puerta del lobby (el reintento del premio y la oferta) y
  // las señales de primera vez de la mesa. Comparten la capa, los textos, las marcas y la API
  // del premio: en trozos aparte, cada pieza compartida sería un nombre más en la tabla de la
  // entrada (`1.8b`, medido: +0,3 KiB). Así el lobby lo pide al aterrizar y la guiada, la
  // pantalla de las tres tarjetas y la primera mesa real lo encuentran ya en la caché.
  guiada: trozo(() => import('../screens/Guiada')),
})

// §3-B · lo que se abre desde el lobby, en el mismo momento que la mesa. Las
// salas y el intersticial no: se piden al tocarlos. La Portada no monta el lobby,
// así que no paga nada de esto. `controlMesa` va con ellos porque `retar` lo
// espera antes de sentarse.
// La guiada no va aquí: el lobby ya la pide al montarse (lleva su puerta, TUT-1 T3).
const DEL_LOBBY = [trozos.tienda, trozos.perfil, trozos.rankings, trozos.hoja, trozos.retar, trozos.controlMesa]

export function precargarDelLobby() {
  DEL_LOBBY.forEach((t) => t.precargar())
}

// ARN-3d STOP-2, para todos: `vite:preloadError` no dice qué trozo falló, así
// que se mira si alguien está ESPERANDO uno. Si es así se recarga, una vez; si
// no, era una precarga y se calla.
const TODOS = [trozoMesa, ...Object.values(trozos)]

export const origenFalloChunk = () => (TODOS.some((t) => t.esperando()) ? 'entrada' : 'precarga')
