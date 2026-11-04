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
})

// §3-B · lo que se abre desde el lobby, en el mismo momento que la mesa. Las
// salas y el intersticial no: se piden al tocarlos. La Portada no monta el lobby,
// así que no paga nada de esto. `controlMesa` va con ellos porque `retar` lo
// espera antes de sentarse.
const DEL_LOBBY = [trozos.tienda, trozos.perfil, trozos.rankings, trozos.hoja, trozos.retar, trozos.controlMesa]

export function precargarDelLobby() {
  DEL_LOBBY.forEach((t) => t.precargar())
}

// ARN-3d STOP-2, para todos: `vite:preloadError` no dice qué trozo falló, así
// que se mira si alguien está ESPERANDO uno. Si es así se recarga, una vez; si
// no, era una precarga y se calla.
const TODOS = [trozoMesa, ...Object.values(trozos)]

export const origenFalloChunk = () => (TODOS.some((t) => t.esperando()) ? 'entrada' : 'precarga')
