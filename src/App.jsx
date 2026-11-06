import { useState, useEffect, useRef, useCallback, lazy, startTransition } from 'react'
// ── LOB-1 · `Lobby` releva a `WelcomeScreen` en la casilla de `COMPLETO` ─────
// `components/WelcomeScreen.jsx` dejó de importarse desde aquí y, ya sin uso, salió
// del árbol en ARN-4 4c, como `screens/Entrada.jsx`.
import Lobby from './screens/Lobby'
// PES-1 §3-B · la hoja de toda la familia `.sal` se queda en la entrada: sus
// pantallas viajan aparte, pero la espera pinta su fondo y todas la comparten.
import './styles/salas.css'
// RNK-1 1e · el intersticial de SumaMente: una pantalla de la cascada, entre el
// lobby y Rankings. La decisión es pura (`sumaCore`); el contador, del aparato.
// PES-1 · `sumaCore` se queda en la entrada: se decide al tocar, sin esperar a la red.
import { decidir, diaChicago } from './lib/sumaCore'
import { sumaContador } from './lib/sumaContador'
import { siembraSuma } from './dev/siembraSuma'
import { useIdioma } from './hooks/useIdioma'
// ARN-3d §2.4 (B11) · la mesa viaja en su propio chunk y entra por `lazy`. El
// especificador vive en `lib/cargarMesa`, el mismo que precarga el lobby; aquí
// NO puede quedar un import estático de `GameTable` (lo vigila
// `scripts/testMesaDiferida.test.js`), o la mesa volvería al paquete principal.
import { cargarMesa, fabricaMesa, marcarEntradaMesa } from './lib/cargarMesa'
// PES-1 · el resto de lo diferido: el mismo molde (`lib/trozos`) y la misma espera.
import { trozos } from './lib/trozos'
import PantallaDiferida from './components/PantallaDiferida'
import Portada from './screens/Portada'
import Bautizo from './screens/Bautizo'
// ECO-1b · la fuente única del saldo. `billeteraApi` lee `mi_billetera()`; la
// falsa sólo existe en desarrollo con bypass y, como `simulacionSalas`, en
// producción devuelve `null` en su primera línea y desaparece del bundle.
import { useBilletera } from './hooks/useBilletera'
import { billeteraApi } from './lib/billeteraApi'
import { simulacionBilletera, simulacionMesaIA, simulacionConstancia, simulacionVideo, simulacionRanking, simulacionCuenta, simulacionPerfil, simulacionConsulta, simulacionTienda, mesaContraHumanosDev } from './dev/billeteraFalsa'
import { perfilApi } from './lib/perfilApi'
import { cuentaApi } from './lib/cuentaApi'
import { limpiarAparato } from './lib/limpiarAparato'
import { rankingApi } from './lib/rankingApi'
import { consultaApi } from './lib/consultaApi'
import { tiendaApi } from './lib/tiendaApi'
import { crearControlTapetes } from './lib/controlTapetes'
import { crearAlmacenTapetes } from './hooks/useTapetes'
// ECO-1c · la mesa contra las IAS vive en el servidor: la API, la marca del
// dispositivo (P-4) y la entrada que siembran los moldes de humano en desarrollo
// (P-6). PES-1 · el canal de cada mesa llega con `trozos.controlMesa`, al sentarse.
import { mesaIAApi } from './lib/mesaIAApi'
import { idDispositivo } from './lib/dispositivo'
import { TOPE_RED_MS } from './lib/red'
import { saldoRecordado } from './lib/saldoRecordado'
import CuentaSinRed from './components/CuentaSinRed'
import { entradaSembradaAPU, videoSembradoAPU } from './dev/siembraAPU'
import { avisoDeVuelta, TIEMPOS_AVISO, encolarAviso, sacarAviso, sustituirFila } from './hooks/avisoSaldoCore'
// ECO-1d · la constancia: la API de `marcar_ingreso`, cuándo preguntar y la
// ficha del lobby (lámina `laminas/eco1d`, ubicación A).
import { constanciaApi } from './lib/constanciaApi'
import { debeMarcar, fichaTrasMarcar, soltarAvisoDeFicha } from './hooks/constanciaCore'
// ECO-1g · el video de recompensa: la API de sus tres funciones, el canal que
// pide y cobra el boleto, la costura del reproductor y el marco que monta sus
// capas una vez para todas las pantallas con barra.
import { videoApi } from './lib/videoApi'
import { crearControlVideo } from './lib/controlVideo'
import { reproductor } from './lib/reproductor'
import MarcoVideo from './components/MarcoVideo'
import { AJILEI_CONFIG } from './config/ajileiConfig'
// `AUTH_BYPASS` sale del import con LOB-1: su único consumidor aquí era
// `cuentaLobby`, que protegía a la Bienvenida y se retiró con ella. La constante
// sigue viva y exportada en el hook, que es donde trabaja.
import { useAuth, CARGANDO, SIN_SESION, SESION_SIN_PERFIL, COMPLETO, SIN_RED } from './hooks/useAuth'
import { precargarSonidos, SONIDOS_MESA } from './hooks/useSounds'
import { precargarBaraja } from './lib/precargaBaraja'
import { creaPantallaCompleta } from './lib/pantallaCompletaCore'
// BIE-1 · El «Cargando» de la rama CARGANDO y la regla D5 que lo gobierna.
import Cargando from './components/Cargando'
import { useEsperaVisible } from './hooks/useEsperaVisible'

// Fuera del componente: un `lazy` creado en cada render sería una mesa nueva
// cada vez. `fabricaMesa` da un thenable SÍNCRONO cuando el chunk ya llegó, así
// que con la precarga hecha `lazy` no suspende (Fase 0 §B4, H3d-2).
const GameTable = lazy(fabricaMesa)
// PES-1 §3-B · las pantallas, igual que la mesa. Van siempre dentro de
// `PantallaDiferida`, así que el `lazy` no llega a suspender.
const SalaOpciones = lazy(trozos.salaOpciones.fabrica)
const ArmarMesa = lazy(trozos.armarMesa.fabrica)
const SalaEspera = lazy(trozos.salaEspera.fabrica)
const PartidaPvP = lazy(trozos.partidaPvP.fabrica)
const RetarIAS = lazy(trozos.retar.fabrica)
const IntersticialSumaMente = lazy(trozos.sumamente.fabrica)
const Perfil = lazy(trozos.perfil.fabrica)
const Rankings = lazy(trozos.rankings.fabrica)
const Tienda = lazy(trozos.tienda.fabrica)
// ECO-1d · aplica `f` a la ficha de la constancia guardada como `{ uid, ficha }`.
const conFicha = (f) => (c) => (c ? { ...c, ficha: f(c.ficha) } : c)
// SAL-A la recogía; SAL-B1 la CONSUME (rector SAL-B1 §5.2), y el Ajuste A1 fija
// CUÁNDO: una vez por sesión, en el arranque, y ANTES de intentar nada (§4.1).
import {
  recogerDeLaUrl,
  leer as leerSalaPendiente,
  consumir as consumirSalaPendiente,
  borrar as borrarSalaPendiente,
} from './config/salaPendiente'
import { salasApi, esMesa } from './lib/salasApi'
// El unico punto por donde algo simulado puede entrar. En produccion devuelve
// `null` en su primera linea y el minificador se lleva el archivo entero.
import { apiSinMesa, simulacionSalas } from './dev/salasFixtures'
// A2 §6.1 · la decision de «¿este uid ya arranco?» es pura y vive en salasCore
// para poder probarse sin jsdom: aqui solo se le pasa el ref y el uid.
import { arranqueDeSesion } from './screens/salasCore'

// ── NIV-UI · Recorrido del lobby ─────────────────────────────────────────────
// Rector: docs/AJILEI_Modos_y_Asistencia_v1.0.md §4.1.
//   [Lobby] "Jugar contra la IA" → (1) dificultad → (2) mesa + apuesta → [Mesa]
// La pantalla de apuesta deja de existir como paso propio: se integró en la de
// mesa. `TableSelect` queda fuera del recorrido y sin usar; NO se borra en esta
// tanda —borrar es otra tanda— y su hoja de estilo sigue siendo la fuente del
// look de las tarjetas de apuesta a pantalla completa.
//
// ── LOB-1 · La Bienvenida sale del recorrido ────────────────────────────────
// Rector: AJILEI_LOB1_Fase1_v1.1.md §4. `screens/Lobby.jsx` ocupa la MISMA
// casilla que ocupaba `WelcomeScreen`: el destino de `COMPLETO`, que en este
// archivo no es un `return` con nombre sino la caída de la cascada. Ni la forma
// de la cascada ni el contrato de arranque de partida cambian.
//
// El único valor de `screen` que se movió es `'welcome'` → `'lobby'`, y se
// recablearon sus cuatro consumidores: el estado inicial, las dos guardas de la
// precarga y el `onBack` de `NivelSelect`. El nombre viejo no sobrevive en
// ninguna parte de `src/`.
//
// El paso de pantallas se mantiene con el MISMO patrón que ya usaba el
// proyecto: un `screen` en estado local, sin router. No se reorganizan rutas
// porque no hay rutas que reorganizar.
//
// ── SUP-2b · La puerta ──────────────────────────────────────────────────────
// Rector: docs/AJILEI_SUP-2b_Puerta_v1.0.md §1.1, con la adenda de OK de Fase 1
// que sitúa la puerta EXACTAMENTE aquí: delante del primer `if`.
//
// Es una interposición, no una reescritura. El recorrido del lobby de arriba no
// se toca: en `COMPLETO` el control cae al mismo `screen` de siempre y la
// decisión menú-vs-mesa queda byte a byte como estaba. Lo único que esta tanda
// añade por delante son dos retornos tempranos y una nada.
//
// POR QUÉ AQUÍ Y NO EN UN ROUTER. No hay router que interponer, y meter uno para
// esto habría sido reorganizar el recorrido entero para colgar de él dos
// pantallas. El patrón de la casa es un estado y una cascada de `if`; la puerta
// habla ese idioma.
// Las pantallas desde las que NO se va derecho a la mesa, y que por tanto no
// pagan la precarga. El lobby estaba solo hasta SAL-B1; ahora le acompañan las
// tres del PvP, que llevan a una partida que todavia no existe.
// SAL-B2 F1b · y el stub de partida PvP, que todavia no reparte nada.
// RNK-1 1e · y el intersticial de SumaMente: mientras corre su video no se
// baja la mesa (audio + baraja + chunk) por la misma red. Rankings, que viene
// detrás, precarga como hasta hoy.
const SIN_PRECARGA = ['lobby', 'sala-opciones', 'armar-mesa', 'sala-espera', 'partida-pvp', 'sumamente']

// ── RNK-1 1e · PREMIUM, EL HUECO ─────────────────────────────────────────────
// Rector RNK-1 1e §0: el video de SumaMente nunca sale para Premium, y Premium
// hoy no existe. Éste es el ÚNICO sitio de la condición: el día que exista, se
// lee aquí (de la cuenta) y `decidir` ya sabe qué hacer con ella.
const esPremium = false

// `?suma` / `?suma=fin` (sólo en desarrollo): el contador a una entrada del
// video, al cargar la página. En un build no hace nada.
siembraSuma()

// ECO-1c · un token por intento de sentarse (la idempotencia de `sentarse_ia`).
function nuevoToken() {
  try { return crypto.randomUUID() } catch {
    // Sin `randomUUID` (contexto no seguro): un v4 hecho a mano, que es lo que
    // el servidor espera (`uuid`).
    const h = Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16))
    h[12] = '4'; h[16] = ((parseInt(h[16], 16) & 3) | 8).toString(16)
    const x = h.join('')
    return `${x.slice(0, 8)}-${x.slice(8, 12)}-${x.slice(12, 16)}-${x.slice(16, 20)}-${x.slice(20)}`
  }
}

function App() {
  // Los hooks van todos ARRIBA y ninguno detrás de un retorno: el orden de
  // llamada tiene que ser el mismo en los cuatro estados de sesión. Es la razón
  // por la que `useAuth` abre la función y los `useState` del lobby se declaran
  // aunque la puerta esté a punto de devolver otra pantalla.
  // CFG-1 1b · el perfil se lee y se escribe por su capa: la del banco
  // imitado con el bypass (que entiende los mandos `?cfg=nombre-…`) o la real.
  const [apiPerfil] = useState(() => simulacionPerfil() ?? perfilApi)
  const auth = useAuth({ api: apiPerfil })
  // RNK-1 1e · el idioma de `t()` elige el video de SumaMente.
  const { idioma } = useIdioma()

  // BIE-1 · La regla D5 del indicador, con los hooks y no detrás de un retorno.
  // `mostrar`: pintar «Cargando». `liberar`: la pantalla siguiente puede
  // pintarse — falso mientras se carga Y mientras el indicador cumple su mínimo.
  const espera = useEsperaVisible(auth.estado === CARGANDO)

  // ── SAL-B1 · La simulacion del arnes, resuelta UNA vez ────────────────────
  // Rector SAL-B1 §8.2. `simulacionSalas()` mira `?sal=` detras de la puerta
  // doble `DEV && VITE_AUTH_BYPASS`; en produccion devuelve `null` en su primera
  // linea y el archivo entero desaparece del bundle (§9.3 lo comprueba con un
  // `grep` sobre `dist/`).
  //
  // Se resuelve en un `useState` perezoso y no en un `useMemo` porque no es un
  // calculo derivado: es una LECTURA de la URL en el instante del montaje, y
  // volver a hacerla en cualquier otro momento seria leer una barra de
  // direcciones que `salaPendiente` ya limpio.
  const [simulacion] = useState(() => simulacionSalas())

  // La API de salas entra en las tres pantallas por parametro. Es el UNICO
  // punto de inyeccion: ninguna pantalla importa `salasApi` por su cuenta, y por
  // eso no hay un segundo camino por el que algo simulado pueda colarse.
  //
  // ARN-4 C6 · con el bypass y sin `?sal=`, `mi_sala` no va a la base: el uuid de
  // `PERFIL_DEV` no existe allí y daba un 401 en cada arranque. `simulacion` sigue
  // siendo `null`, que es lo que el arranque de abajo mira para no quedarse quieto.
  const [apiDelBypass] = useState(() => apiSinMesa())
  const api = simulacion?.api ?? apiDelBypass ?? salasApi

  // ── §5.2 · La invitacion, leida en el PRIMER render ───────────────────────
  // Se MIRA en el inicializador perezoso —`leer()`, que no gasta— y no se
  // consume aqui: un inicializador de `useState` puede invocarse dos veces en
  // desarrollo (StrictMode), y un consumo dentro dejaria la segunda lectura sin
  // nada. El consumo vive en el efecto de arranque, mas abajo, tras la guardia.
  //
  // ── A1 · `recogerDeLaUrl()` SE LLAMA AQUI, NO EN UN EFECTO ────────────────
  // SAL-A la llamaba en un `useEffect`, que corre DESPUES de este inicializador:
  // un enlace `?sala=` abierto con sesion viva guardaba el codigo un fotograma
  // tarde, esta lectura ya habia devuelto `null`, y la invitacion solo se veia
  // en el SIGUIENTE arranque — una de las patas del defecto 3 (el codigo «que
  // vuelve»). Recoger primero y leer despues, en el mismo gesto, cierra eso. Es
  // idempotente: la segunda invocacion del inicializador ya no encuentra el
  // parametro (la barra se limpio) y cae a `leer()`, que devuelve lo mismo. Con
  // simulacion no se toca el almacenamiento: el codigo lo trae el fixture.
  //
  // Leerla ahora es tambien lo que permite que la pantalla inicial la tenga en
  // cuenta sin un `setScreen` dentro de un efecto — que es un `setState`
  // sincrono en efecto, encadena un render de mas y `react-hooks` lo prohibe.
  const [invitacion, setInvitacion] = useState(() => (
    simulacion ? (simulacion.codigo ?? null) : (recogerDeLaUrl() ?? leerSalaPendiente())
  ))

  // A1 §2.5 · el intento automatico NO se dispara por tener codigo: lo enciende
  // el arranque de abajo cuando `mi_sala()` ya dijo que no hay mesa en espera.
  // Con simulacion nace encendido si el fixture trae codigo, que es como el
  // arnes reproduce la secuencia exacta del Motorola.
  const [intentarInvitacion, setIntentarInvitacion] = useState(() => Boolean(simulacion?.codigo))

  const [screen, setScreen] = useState(() => {
    // MES-PvP 3 · `?pvp=<escena>` abre la partida con el árbitro imitado (`PartidaPvP` lo monta),
    // detrás de la misma puerta doble que `?sal=`. En producción la condición es constante.
    if (import.meta.env.DEV && import.meta.env.VITE_AUTH_BYPASS && new URLSearchParams(window.location.search).has('pvp')) return 'partida-pvp'
    if (simulacion) {
      // A2 §2.3 · la guarda del ultimo metro tambien en la entrada simulada: un
      // fixture que pida el stub sin una mesa CON id se queda en la pantalla
      // desde la que se entra al stub. Es la prueba negativa del arnes
      // (`espera-fantasma`), y es el mismo predicado que `entrarSala`.
      if (simulacion.pantalla === 'sala-espera' && !esMesa(simulacion.sala)) return 'sala-opciones'
      return simulacion.pantalla
    }
    return invitacion !== null ? 'sala-opciones' : 'lobby'
  })
  // 'lobby' | 'retar-ias' | 'table'
  // SAL-B1 anade: 'sala-opciones' | 'armar-mesa' | 'sala-espera'
  // SAL-B2 anade: 'partida-pvp'

  // La sala en la que este jugador esta. La ponen los tres caminos que llevan a
  // `SalaEspera` —entrar por codigo, unirse a una tarjeta, armar la tuya— y la
  // reanudacion de §5.3. Vive en `App` y no en la pantalla porque sobrevive a
  // que la pantalla se desmonte. Solo un fixture puede traerla al nacer; en
  // produccion es `null` hasta que una RPC devuelva una mesa con id.
  const [sala, setSala] = useState(() => (esMesa(simulacion?.sala) ? simulacion.sala : null))

  // ── APU-1 1e · LAS CUATRO DECISIONES VIAJAN JUNTAS ───────────────────────
  // Rector 1e §2.3. Eran tres estados sueltos —`stake`, `playerCount`, `nivel`—
  // repartidos por dos pantallas; ahora son UNA decisión que se toma de una vez
  // en «Retar a las IAS» y que la mesa consume entera. `null` mientras no haya
  // mesa, que es lo que permite que `GameTable` no se monte a medias.
  //
  // La MEMORIA de las tres primeras vive en la pantalla (`ajilei.retoConfig`),
  // no aquí: `App` no recuerda nada, sólo enruta. La cuarta —la entrada— no se
  // recuerda en ninguna parte, a propósito.
  const [mesa, setMesa] = useState(null)

  // ── ECO-1b · EL SALDO: UNA SOLA FUENTE ───────────────────────────────────
  // Rector ECO-1 1b §1 (B1–B3). Hasta aquí vivía en este sitio `saldoSesion`,
  // que nacía de una constante (5.000) y sólo veían vs-IA y el lobby; las
  // pantallas PvP leían la constante por su cuenta. Ahora la cifra sale de la
  // billetera del servidor (`mi_billetera()`) y baja por props a las seis
  // pantallas.
  //
  // ECO-1c · el ajuste local de la 1b se RETIRA: la entrada, las recargas y la
  // salida contra las IAS son movimientos del libro, y la billetera toma el
  // saldo que devuelve cada función de dinero (`billetera.tomar`).
  //
  // La API se resuelve UNA vez, como la de salas: la falsa (desarrollo con
  // bypass, `?apu=saldo:<n>` o 5.000) o la real. Las dos pasan por el mismo
  // núcleo; la falsa sólo cambia de dónde se lee la cifra.
  const [apiBilletera] = useState(() => simulacionBilletera() ?? billeteraApi)
  const uidCompleto = auth.estado === COMPLETO ? (auth.perfil?.id ?? null) : null
  const billetera = useBilletera(apiBilletera, uidCompleto)
  // IOS-1c · la cifra recordada (`lib/saldoRecordado`) se borra al cerrar
  // sesión, por el botón o porque la sesión acabó de verdad (SIN_SESION: sólo
  // un error no reintentable lleva ahí, nunca una red caída).
  const cerrarSesionDeAuth = auth.cerrarSesion
  // CFG-1 1c · O-2 de la 1a: al cerrar sesión `screen` vuelve al lobby, o al
  // volver a entrar se aterrizaba en la pantalla de la que se salió (Retar,
  // Rankings…). Después del `signOut` y no antes: antes, el lobby asomaría
  // mientras la salida viaja; después, la Portada ya tapa el cambio.
  const cerrarSesion = useCallback(async () => {
    saldoRecordado.borrar()
    await cerrarSesionDeAuth()
    setScreen('lobby')
  }, [cerrarSesionDeAuth])
  useEffect(() => {
    if (auth.estado === SIN_SESION) saldoRecordado.borrar()
  }, [auth.estado])

  // ── CFG-1 1c · ELIMINAR LA CUENTA ────────────────────────────────────────
  // La Edge Function (`lib/cuentaApi`) o, con el bypass, el banco imitado. Al
  // `ok`, el aparato queda limpio (todas las claves `ajilei.*` y
  // `sessionStorage`) y se cierra la sesión, que ya no vale en el servidor:
  // `signOut` sólo limpia el aparato. Los demás motivos los dice la ventana.
  //
  // El 401 (`sin_sesion`) sale IGUAL que el ok (Ajuste A de STOP-B1): la
  // sesión no vale en el servidor, casi siempre porque un borrado que tardó
  // más que el tope ya se llevó la cuenta. Quedarse dentro sería un reintento
  // sin fin.
  const [apiCuenta] = useState(() => simulacionCuenta() ?? cuentaApi)

  // ── CFG-1 1b · LA PANTALLA DE PERFIL Y DE DÓNDE SE VINO ───────────────────
  // Rector CFG-1 1b §2.5 (R-9). La flecha del perfil vuelve a la pantalla que
  // lo abrió (`desdePerfil`); la casa, al lobby. Desde el propio perfil, el
  // avatar de la barra no hace nada (ya se está ahí).
  const [desdePerfil, setDesdePerfil] = useState('lobby')
  const abrirPerfil = useCallback(() => {
    if (screen === 'perfil') return
    setDesdePerfil(screen)
    setScreen('perfil')
  }, [screen])
  // ── TIE-1 1a · LA TIENDA Y DE DÓNDE SE VINO ──────────────────────────────
  // Rector TIE-1 1a §3.4. Molde del perfil: la flecha vuelve a la pantalla que
  // la abrió, la casa al lobby. Se abre en un estante (`'monedas'` desde el
  // «+», `'tapetes'` desde la barra del lobby y la fila del ⚙). Pedirla estando
  // en ella cambia de estante: `n` es la llave que la vuelve a montar.
  const [tienda, setTienda] = useState({ estante: 'tapetes', desde: 'lobby', n: 0 })
  const abrirTienda = useCallback((estante) => {
    setTienda((x) => ({ estante, desde: screen === 'tienda' ? x.desde : screen, n: x.n + 1 }))
    setScreen('tienda')
  }, [screen])
  const eliminarCuenta = useCallback(async () => {
    const r = await apiCuenta.eliminar()
    if (!r.ok && r.motivo !== 'sin_sesion') return r
    limpiarAparato()
    await cerrarSesion()
    return { ok: true }
  }, [apiCuenta, cerrarSesion])
  const { tomar: tomarSaldo, esperar: esperarSaldo, soltar: soltarSaldo, refrescar: releerSaldo, alSaldoInsuficiente } = billetera

  // ── ECO-1c · LA MESA CONTRA LAS IAS, EN EL SERVIDOR ──────────────────────
  // Rector ECO-1 1c §2.2. `apiMesa` se resuelve UNA vez, como las otras dos:
  // la del banco imitado del bypass o la real.
  //
  // `controlMesa` es el canal de la mesa en curso (`lib/controlMesaIA`): lo
  // crea `sentarse_ia` y lo usa `GameTable` para avisar de la pila y recargar.
  // Vive AQUÍ y no en la mesa porque la salida no espera a la red: el jugador se
  // levanta en el acto y el cobro sigue mandándose con la mesa ya desmontada.
  // El `ref` es para los manejadores (saber si un evento es de la mesa actual);
  // el estado, para pasárselo a la mesa.
  const [apiMesa] = useState(() => simulacionMesaIA() ?? mesaIAApi)
  // RNK-1c · los rankings, por el MISMO interruptor: el banco imitado del
  // bypass (con sus jugadores sembrados) o la API real.
  const [apiRanking] = useState(() => simulacionRanking() ?? rankingApi)
  // CFG-1 1e · Mano actual de pago, por el MISMO interruptor (con los mandos
  // `?cfg=consulta-…` del bypass) o la API real.
  const [apiConsulta] = useState(() => simulacionConsulta() ?? consultaApi)
  // TIE-1 1a · el canal de los tapetes (`lib/controlTapetes`), UNO por carga de
  // página como el del video: lo leen la tienda, la fila del ⚙ y la mesa, y
  // los tres tienen que decir lo mismo. La API es la del banco imitado (con los
  // mandos `?tie=` del bypass) o la real; la copia del aparato pinta la mesa
  // antes de que conteste el servidor.
  const [tapetes] = useState(() => crearControlTapetes({
    api: simulacionTienda() ?? tiendaApi,
    almacen: crearAlmacenTapetes(),
  }))
  const [controlMesa, setControlMesa] = useState(null)
  const controlRef = useRef(null)
  // Sentarse: `null`, `{ fase: 'enviando' }` o `{ fase: 'error', codigo }`. El
  // token es de UN intento: el reintento de la misma elección lo repite (si la
  // primera llamada sí llegó, el servidor devuelve la misma mesa sin cobrar),
  // y una elección distinta o un «no» definitivo lo renuevan.
  const [sentando, setSentando] = useState(null)
  const intento = useRef(null)
  const enviandoRef = useRef(false)
  // El aviso de saldo (lámina `laminas/eco1c`): el dinero que vuelve FUERA de
  // la mesa, anclado a la píldora. Lo pintan el lobby y Retar.
  //
  // ECO-1d · ES UNA FILA (avisoSaldoCore §«la fila»). La recogida y la
  // constancia del mismo arranque van una tras otra, nunca a la vez, y la
  // píldora cuenta cada subida. C5 y C6 —atados a un cambio de pantalla— la
  // SUSTITUYEN, y arrancan desde la cifra que se está viendo. Entrar en la mesa
  // la vacía, como antes vaciaba el aviso.
  //
  // `constancia` es la ficha del lobby, con el uid de quien la ganó: así otra
  // cuenta en la misma carga de página no hereda la de la anterior, y no hace
  // falta ningún `setState` en un efecto para olvidarla.
  const [filaAvisos, setFilaAvisos] = useState([])
  const avisoSaldo = filaAvisos[0] ?? null
  const [constancia, setConstancia] = useState(null)   // { uid, ficha } | null
  const finAviso = useCallback((id) => {
    setFilaAvisos((f) => sacarAviso(f, id))
    setConstancia(conFicha((ficha) => (ficha?.avisoId === id ? soltarAvisoDeFicha(ficha) : ficha)))
  }, [])
  const encolarAvisoSaldo = useCallback((a) => setFilaAvisos((f) => encolarAviso(f, a)), [])
  const sustituirAvisos = useCallback((a) => setFilaAvisos(sustituirFila(a)), [])
  const vaciarAvisos = useCallback(() => {
    setFilaAvisos([])
    setConstancia(conFicha(soltarAvisoDeFicha))
  }, [])
  const [apiConstancia] = useState(() => simulacionConstancia() ?? constanciaApi)
  // Lo que decide si toca preguntar (constanciaCore.debeMarcar). Es un ref: no
  // pinta nada, y lo leen el arranque y la vuelta a primer plano.
  const marca = useRef({ ultimoDia: null, enVuelo: false, ultimaLlamada: null })

  // ── ECO-1g · EL VIDEO DE RECOMPENSA ───────────────────────────────────────
  // Rector ECO-1 1g §2.2. El canal del video (`lib/controlVideo`) se crea UNA
  // vez, como las APIs de arriba, y vive AQUÍ por las mismas razones que el de
  // la mesa: sobrevive a los cambios de pantalla, y es `App` quien le presta la
  // billetera (el cobro devuelve el saldo y se toma sin relectura) y quien
  // necesita saber si hay un video abierto (la constancia se pospone mientras).
  // No es estado de React: `App` no se repinta con el video; lo hace
  // `MarcoVideo`, que se suscribe.
  //
  // La API es la del banco imitado del bypass o la real. Los mandos
  // (`?apu=video:`) sólo existen en desarrollo: en la build son `null` y el
  // video dura lo que dice `ajileiConfig`.
  //
  // `chipsCollect` se precarga al PEDIR el video, unos 40 s antes de sonar en
  // la celebración: hoy no viaja en el lobby (Fase 0 P.2) y no se le añade.
  const [video] = useState(() => crearControlVideo({
    api: simulacionVideo() ?? videoApi,
    reproductor,
    duracionMs: AJILEI_CONFIG.economy.video.duracionMs,
    premioEspejo: AJILEI_CONFIG.economy.videoReward,
    mandos: videoSembradoAPU(),
    precargar: () => {
      precargarSonidos(['chipsCollect'])
      return trozos.capasVideo.cargar()
    },
  }))
  // MES-PvP 3 · la partida entra sola (la sala arrancó, o se vuelve a ella) y no lleva el marco
  // del video: el que estuviera a la vista se cierra antes de tiempo y no se cobra (P-4).
  useEffect(() => { if (screen === 'partida-pvp') video.cerrarPorMesa() }, [screen, video])

  // ── SAL-A · La invitación se recoge ANTES de la puerta ────────────────────
  // Rector: AJILEI_SALA_Fase1_v1.0.md §4.3. Un `?sala=AJ7K2M` compartido por
  // WhatsApp puede caer en alguien que todavía no tiene cuenta, y este proyecto
  // no admite invitados (Fase 0 §1.6: `anonymous_users` es `false`). Sin ese
  // gesto, el código muere en la Portada y el jugador llega al lobby sin saber
  // a qué venía.
  //
  // El Ajuste A1 movió la llamada al inicializador de `invitacion`, arriba: un
  // efecto corría un fotograma DESPUÉS de esa lectura y la invitación recién
  // llegada no se veía hasta el siguiente arranque. Sigue ocurriendo antes de
  // las tres guardas de sesión —el inicializador corre en el primer render, sea
  // cual sea el estado de `auth`— y sigue siendo sólo RECORDAR: el consumo está
  // en el efecto de arranque de aquí abajo.

  // ── A2 §2.3 · LA GUARDA DEL ULTIMO METRO ──────────────────────────────────
  // TODO camino al stub pasa por aqui —el arranque, el codigo, la tarjeta, armar
  // la tuya— y una mesa sin `id` NO cambia de pantalla. Aunque una RPC futura
  // devuelva basura, o PostgREST su fila de nulos, el stub no se pinta con
  // «Mesa de ⟦n⟧». `useCallback` con dependencias vacias porque los dos
  // `set` son estables y el efecto de arranque la lista entre las suyas.
  // MES-PvP 3 §3.3 · `mi_sala` también devuelve la mesa con partida viva (MOT-1): quien vuelve
  // a ella va directo a la partida, no a la sala de espera. Y la píldora relee al entrar.
  const refrescarSaldo = billetera.refrescar
  const entrarSala = useCallback((mesa) => {
    if (!esMesa(mesa)) return
    setSala(mesa)
    refrescarSaldo?.()
    setScreen(mesa.estado === 'activa' ? 'partida-pvp' : 'sala-espera')
  }, [refrescarSaldo])

  // ── SAL-B1 · El arranque de las salas, UNA sola vez ───────────────────────
  // Rector SAL-B1 §5.2 y §5.3, con la PRECEDENCIA que el Ajuste A1 §2.5 hizo
  // explicita despues de que dos telefonos la midieran al reves:
  //
  //   (1) LA MESA EN ESPERA MANDA. Si `mi_sala()` devuelve una —y desde la
  //       migracion `sal_b1_ajuste` solo devuelve 'esperando'— se abre el stub
  //       de esa mesa y el codigo pendiente SE CONSUME SIN INTENTARSE: ya estas
  //       sentado, y probar otro codigo solo produciria `ya_en_sala`.
  //   (2) SI NO LA HAY y hay codigo pendiente, se intenta UNA vez en
  //       `SalaOpciones`, con el codigo delante y el error —si lo hay— debajo.
  //   (3) SI NO → lobby, que es donde ya estaba.
  //
  // EL CODIGO SE CONSUME ANTES DEL INTENTO, no despues (A1 §4.1). Antes se
  // borraba condicionado al camino, y un fallo, una red caida o un cierre de
  // app a mitad lo dejaban vivo: el Motorola lo reintentaba en cada entrada a
  // «Jugar contra jugador» hasta que se borro a mano. `consumir()` lee y olvida
  // en el mismo gesto; a partir de ahi el unico sitio donde el codigo existe es
  // el estado `invitacion` de este componente, que muere al salir de
  // `SalaOpciones` (`olvidarInvitacion`) y con el cualquier reintento.
  //
  // ── LA GUARDA DEL `ref`, Y POR QUE ESTE EFECTO NO LLEVA `vivo` ───────────
  // El efecto depende de `cuenta.id`, que pasa de `null` a un uuid cuando el
  // perfil llega; y en desarrollo React monta, desmonta y remonta cada
  // componente. Sin la guardia, `mi_sala()` se pediria dos o tres veces por
  // arranque. Y NO lleva la bandera `vivo` de los otros efectos, a proposito:
  // con StrictMode el desmontaje simulado la pondria en falso y la respuesta de
  // `mi_sala()` —la unica que se va a recibir, porque la guardia impide pedirla
  // otra vez— se tiraria sin que nadie la viera. `App` no se desmonta nunca,
  // asi que no hay nada de lo que protegerse.
  //
  // ── A2 §6.1 · LA GUARDA SE REARMA CON CADA SESION ─────────────────────────
  // Era un booleano por instancia de `App`, y `App` no se desmonta al cerrar
  // sesion: el segundo login en la misma carga de pagina encontraba la guardia
  // puesta y nunca preguntaba `mi_sala()` — el S25 fue al lobby por eso, y una
  // cuenta que entrara despues de otra no reanudaba su mesa. Ahora la guardia
  // guarda EL UID QUE YA ARRANCO: se desarma cuando `uid` vuelve a `null`
  // (cerrar sesion) y vuelve a arrancar con cualquier login, la misma cuenta u
  // otra. Una sesion nueva es un arranque nuevo. StrictMode sigue cubierto:
  // el remontaje trae el mismo uid, y el mismo uid no arranca dos veces.
  // ── ECO-1c · P-4 · LA MESA QUE QUEDÓ ABIERTA, AL ARRANCAR ─────────────────
  // Una vez por cuenta, con la misma guarda que las salas: `recoger_mesa_ia`
  // cierra la mesa abierta si es de ESTE navegador (una mesa no sobrevive a
  // recargar la página) o si lleva más de 10 min sin avisos (de otro). Si volvió
  // algo —o la mesa se cerró sin fichas—, el aviso de saldo lo dice (escena a).
  // Con red caída no se hace nada: la recogerá la regla C4 al sentarse.
  //
  // ── ECO-1d · LA CONSTANCIA, DETRÁS DE LA RECOGIDA ─────────────────────────
  // `marcar_ingreso` va DESPUÉS de `recoger_mesa_ia`, una detrás de otra: así
  // el servidor aplica primero la recogida y después la constancia, cada
  // respuesta trae su saldo y los dos avisos se encadenan solos (el segundo
  // empieza donde acabó el primero). Si la recogida no contesta, la constancia
  // sale igual. El cobro entra en la fila con su aviso; la ficha del lobby
  // cambia con la respuesta. Sin cobro, el saldo no se toca: la billetera ya
  // tiene la cifra, y una mesa que se estuviera cerrando no pierde su «—».
  const marcar = useCallback((uid) => {
    const m = marca.current
    m.enVuelo = true
    m.ultimaLlamada = Date.now()
    return apiConstancia.marcar().then((r) => {
      m.enVuelo = false
      if (r.dia) m.ultimoDia = r.dia
      if (r.codigo !== 'ok' && r.codigo !== 'ya_marcado') return
      let aviso = null
      if (r.cobrado > 0 && Number.isFinite(r.saldo)) {
        aviso = avisoDeVuelta(r, { conMonto: 'aviso.saldo.constancia', cero: 'aviso.saldo.constancia' })
        tomarSaldo(r.saldo)
        encolarAvisoSaldo(aviso)
      }
      setConstancia((c) => ({ uid, ficha: fichaTrasMarcar(c?.uid === uid ? c.ficha : null, r, aviso?.id ?? null) }))
    })
  }, [apiConstancia, tomarSaldo, encolarAvisoSaldo])

  // ECO-1g · lo que `App` le presta al canal del video, y de quién es. Otra
  // cuenta en la misma carga de página no hereda ni el contador ni un video a
  // medias. `alLibre`: lo que se pospuso mientras había un video abierto —la
  // constancia de un día que cambió con el video delante— toca al cerrarse.
  useEffect(() => {
    video.enchufar({
      tomarSaldo,
      alLibre: () => { if (uidCompleto && debeMarcar(marca.current, Date.now())) marcar(uidCompleto) },
    })
  }, [video, tomarSaldo, uidCompleto, marcar])
  useEffect(() => { video.cuenta(uidCompleto) }, [video, uidCompleto])
  // TIE-1 1a · al entrar con sesión, el inventario del servidor (INV-76). Otra
  // cuenta en la misma carga de página relee el suyo.
  useEffect(() => { if (uidCompleto) tapetes.refrescar() }, [tapetes, uidCompleto])

  const arranqueMesa = useRef(null)
  useEffect(() => {
    const decision = arranqueDeSesion(arranqueMesa.current, uidCompleto)
    arranqueMesa.current = decision.arrancado
    if (!decision.arrancar) return
    const uid = uidCompleto
    marca.current = { ultimoDia: null, enVuelo: false, ultimaLlamada: null }
    apiMesa.recoger(idDispositivo()).then((r) => {
      if (r.codigo !== 'recogida') return
      tomarSaldo(r.saldo)
      encolarAvisoSaldo(avisoDeVuelta(r, { conMonto: 'aviso.saldo.recogida', cero: 'aviso.saldo.recogida.cero' }))
    }).then(() => marcar(uid))
  }, [uidCompleto, apiMesa, tomarSaldo, encolarAvisoSaldo, marcar])

  // Volver a primer plano reintenta lo que la mesa tenga pendiente (un aviso,
  // una recarga, la salida) sin esperar a la cuenta atrás del reintento.
  // ECO-1d · y pregunta por la constancia si cambió el día de Chicago (o el
  // arranque no la obtuvo), nunca en ráfaga: `debeMarcar`.
  // ECO-1g · con un video abierto la constancia NO se pregunta aquí: su aviso
  // caería sobre la capa o se cruzaría con la celebración. Se pospone, y el
  // canal del video la pide al quedar libre (`alLibre`, arriba). Y el cobro de
  // un video que se esté reintentando tampoco espera su cuenta atrás.
  useEffect(() => {
    const alCambiar = () => {
      if (document.visibilityState !== 'visible') return
      // IOS-1c · y lo que lleve colgado más que el tope de red se fuerza (mismo
      // `seq`: no cobra dos veces). Lo recién salido no se toca.
      controlRef.current?.reintentarAhora({ forzarTrasMs: TOPE_RED_MS })
      video.reintentarAhora()
      if (uidCompleto && !video.ocupado() && debeMarcar(marca.current, Date.now())) marcar(uidCompleto)
    }
    document.addEventListener('visibilitychange', alCambiar)
    return () => document.removeEventListener('visibilitychange', alCambiar)
  }, [uidCompleto, marcar, video])

  const arranqueSalas = useRef(null)
  const uid = auth.perfil?.id ?? null
  useEffect(() => {
    // `simulacion` ya decidio la pantalla: el arnes no quiere que nadie le
    // mueva el escenario por debajo.
    if (simulacion) return
    const decision = arranqueDeSesion(arranqueSalas.current, uid)
    arranqueSalas.current = decision.arrancado
    if (!decision.arrancar) return

    // Se consume AHORA, antes de saber nada: pase lo que pase con la red, el
    // almacenamiento ya no lo tiene. Se consume aqui —al llegar el jugador al
    // otro lado de la puerta— y no en el primer render: el trayecto puede
    // cruzar de pestaña (el codigo de seis digitos llega por correo), y
    // gastarla antes de la puerta dejaria sin invitacion a quien vuelva por
    // otra via.
    const pendiente = consumirSalaPendiente()

    api.miSala().then(({ data }) => {
      // La traza temporal de A2 (que devolvio `mi_sala()` y si habia invitacion)
      // se retiro en la ficha de commits; sus lecturas estan en los informes.
      if (esMesa(data)) {
        // (1) · ya sentado. El codigo pendiente, si lo habia, se descarta.
        setInvitacion(null)
        entrarSala(data)
        return
      }
      // (2) · un solo intento, en `SalaOpciones`, con el codigo que ya tiene.
      if (pendiente !== null) setIntentarInvitacion(true)
    })
  }, [simulacion, uid, api, entrarSala])

  // A1 §4.2/§4.3 · la invitacion vive UNA visita a `SalaOpciones`. Al salir de
  // la pantalla por cualquiera de sus tres puertas se olvida, y la siguiente
  // entrada —por navegacion normal— nace con el campo vacio y sin intento.
  const olvidarInvitacion = () => { setInvitacion(null); setIntentarInvitacion(false) }

  // ── PUE-1.2 · La mesa precarga sus efectos al ENCAMINARSE a la mesa ────────
  // Desde esta campaña los `Howl` nacen perezosos: en la puerta no baja un solo
  // byte de audio de juego (era el hallazgo de la Fase 0 — 525,7 KiB de 706,2).
  // El precio de aplazar es que la primera reproducción llegaría tarde, así que
  // quien va a necesitarlos los pide antes.
  //
  // Y se piden aquí, al salir del lobby, en vez de al montar la mesa: el
  // recorrido dificultad → mesa+apuesta son varios segundos de margen, y el
  // primer `cardDeal` cae a los pocos fotogramas de que la mesa exista. Pedirlos
  // en `GameTable` sería llegar a la vez que el reparto.
  // No pinta nada y no toca el layout: Δ=0 en las tres pantallas del lobby.
  //
  // LOB-1 · La guarda dice `!== 'lobby'` y no `!== 'welcome'`, y ese cambio de
  // nombre es lo único que hacía falta: `Lobby` entra en la MISMA casilla que
  // ocupaba la Bienvenida —no delante de ella—, así que el instante de la
  // precarga es el mismo que antes de esta campaña. Si el lobby hubiera nacido
  // como un `screen` NUEVO por delante de `'welcome'`, esta línea habría
  // disparado 380 KiB de audio y 0,57 MB de baraja al entrar al lobby, que es
  // exactamente lo que PUE-1.2 y CAR-1 sacaron del arranque.
  //
  // ── SAL-B1 · LAS TRES PANTALLAS DE SALAS NO PRECARGAN NADA ────────────────
  // Rector SAL-B1 §5.4, primera frase: «Ni `SalaOpciones` ni `ArmarMesa`
  // disparan precarga de mesa ni de baraja». La guarda decia `!== 'lobby'`, asi
  // que sin tocarla las tres pantallas nuevas habrian disparado 380 KiB de audio
  // y 0,57 MB de baraja al entrar a mirar quien esta armando mesa — que es
  // exactamente lo que PUE-1.2 y CAR-1 sacaron del arranque.
  //
  // Se convierte en una LISTA de pantallas que no precargan, en vez de encadenar
  // cuatro `!==`: asi la razon esta escrita una vez y la siguiente pantalla que
  // no sea la mesa se anade a una lista en vez de a una condicion.
  //
  // §5.4 dice ademas «la guarda que hoy exista se deja como esta; B2 la mueve a
  // la entrada de `SalaEspera`». Lo que NO se mueve es el sitio ni el momento:
  // sigue colgada de `screen` y en este mismo efecto. Lo unico que cambia es a
  // que pantallas alcanza, que es lo que la primera frase exige.
  useEffect(() => {
    if (SIN_PRECARGA.includes(screen)) return
    precargarSonidos(SONIDOS_MESA)
    // ARN-3d §2.4 · y el chunk de la mesa, por si el lobby no llegó a pedirlo
    // (su montaje es el primer sitio, `Lobby.jsx`). `import()` es idempotente:
    // si ya está pedido o llegado, esto no baja nada. AQUÍ y no antes: este
    // efecto deja fuera 'lobby' (`SIN_PRECARGA`) porque `screen` vale 'lobby'
    // también en la Portada (H3d-1), y la Portada no paga la mesa.
    cargarMesa().catch(() => {})
    // CAR-1 §3.2 · y la baraja con ellos, por la misma razón y en el mismo
    // momento: 0,57 MB de WebP contra los 24,28 MB de PNG que ya no viajan.
    precargarBaraja()
  }, [screen])

  // ── PAN-1 1c · LA PANTALLA COMPLETA EN LOS TELÉFONOS (INV-45, R1–R9) ──────
  // Un oyente en el documento, montado una vez: el primer toque en la app, sea
  // donde sea, la pide, para que la mesa nazca con el alto completo (R2). Si
  // algo la saca, fuera de la mesa vuelve con el siguiente toque; dentro, solo
  // con «Iniciar mano» o «Siguiente mano», que llaman a `reentrar` en
  // `GameTable` (R4). La política vive en `lib/pantallaCompletaCore.js`.
  const pantallaCompleta = useRef(null)
  useEffect(() => {
    const pc = creaPantallaCompleta(document, window)
    pantallaCompleta.current = pc
    return pc.engancha()
  }, [])
  useEffect(() => {
    pantallaCompleta.current?.fijaDentroMesa(screen === 'table')
  }, [screen])

  // ── ECO-1c · Lo que cuenta el canal de una mesa ──────────────────────────
  // Sólo la mesa ACTUAL mueve la pantalla y la píldora. Una mesa vieja que aún
  // cobraba su salida cuando el jugador se sentó en otra la cerró `sentarse_ia`
  // (C4): lo que conteste ya no es verdad para la píldora, que se relee.
  const escucharMesa = useCallback((ctl) => {
    ctl.suscribir((ev) => {
      const actual = controlRef.current === ctl
      const saldo = ev.respuesta?.saldo
      if (!actual) {
        if (ev.tipo === 'salida' || ev.tipo === 'cerrada') releerSaldo()
        return
      }
      // P-2a · con la salida ya pedida, el «sí» de una recarga que iba delante
      // no es la cifra final: la píldora sigue en «—» hasta que la salida (que
      // ya lleva esas fichas) conteste.
      if (ev.tipo === 'recarga' && ev.ok && !ctl.saliendo) tomarSaldo(saldo)
      // IOS-1c · un fallo de red de la salida YA NO suelta el «cobrando»: lo
      // que leería la billetera con la mesa abierta es la cifra sin sus fichas,
      // la falsa que S3 prohíbe. La cola la reintenta sola (con el tope de red
      // y forzada al volver a primer plano) y la píldora espera a su respuesta.
      if (ev.tipo === 'salida') {
        if (ev.respuesta?.codigo === 'ok' || ev.respuesta?.codigo === 'repetido') tomarSaldo(saldo)
        else soltarSaldo()
      }
      if (ev.tipo === 'cerrada') {
        tomarSaldo(saldo)
        // C6 · la cerró otro dispositivo MIENTRAS se jugaba aquí: aviso y vuelta
        // al inicio, sin perder dinero (lo cobró quien la cerró). Si el jugador
        // ya se había levantado, sólo se toma el saldo.
        if (!ctl.saliendo) {
          sustituirAvisos(avisoDeVuelta({ cobrado: ev.respuesta?.cobrado, saldo },
            { conMonto: 'aviso.saldo.otro', cero: 'aviso.saldo.otro.cero' }))
          setControlMesa(null)
          setMesa(null)
          setScreen('lobby')
        }
      }
    })
  }, [tomarSaldo, soltarSaldo, releerSaldo, sustituirAvisos])

  // ECO-1d · la pantalla de AHORA, para los reintentos de sentarse: si el
  // jugador ya se fue de Retar, el reintento no lo mete en una mesa.
  const pantallaRef = useRef(screen)
  useEffect(() => { pantallaRef.current = screen }, [screen])

  const retar = useCallback(async (elegida) => {
    if (enviandoRef.current) return
    // P-6 · con un molde de humano (`?apu=`, sólo desarrollo) la mesa se sienta
    // con la pila del molde, y ésa es la entrada que se cobra.
    const entrada = entradaSembradaAPU(elegida.apuesta) ?? elegida.entrada
    const firma = [elegida.reto, elegida.jugadores, elegida.apuesta, entrada].join('|')
    if (intento.current?.firma !== firma) intento.current = { firma, token: nuevoToken() }
    enviandoRef.current = true
    setSentando({ fase: 'enviando' })
    // PES-1 §3-A · el canal ANTES de cobrar: una entrada cobrada sin canal dejaría
    // la mesa abierta en el servidor. Sin el trozo no se ha pedido nada: es un `red`
    // más, con su reintento, y si Vite lo da por caído, recarga (`origenFalloChunk`).
    trozos.controlMesa.marcarEntrada()
    const canal = await trozos.controlMesa.cargar().catch(() => null)
    if (!canal) {
      enviandoRef.current = false
      setSentando({ fase: 'error', codigo: 'red' })
      return
    }
    const { crearControlMesa, LIMITE_SENTARSE } = canal
    const pedir = () => apiMesa.sentarse({ ...elegida, entrada, token: intento.current.token, dispositivo: idDispositivo() })
    let r = await pedir()
    // ECO-1d · K7 · `limite` es «no contesta»: se espera y se vuelve a pedir con
    // el MISMO token (mesaIACore.LIMITE_SENTARSE). Si el jugador se fue de
    // Retar mientras, se deja: el token sigue, y su próximo toque es el mismo
    // intento.
    for (let i = 0; r.codigo === 'limite' && i < LIMITE_SENTARSE.reintentos; i++) {
      await new Promise((res) => setTimeout(res, LIMITE_SENTARSE.esperaMs))
      if (pantallaRef.current !== 'retar-ias') { enviandoRef.current = false; setSentando(null); return }
      r = await pedir()
    }
    enviandoRef.current = false

    if (r.codigo !== 'ok' && r.codigo !== 'repetido') {
      if (r.codigo === 'saldo_insuficiente') alSaldoInsuficiente()
      // `red` y `limite` no son un «no»: el token se queda para el reintento.
      // `tope_diario` (la válvula) sí: la nota lo dice y el token se renueva.
      if (r.codigo !== 'red' && r.codigo !== 'limite') intento.current = null
      setSentando({ fase: 'error', codigo: r.codigo })
      return
    }

    intento.current = null
    tomarSaldo(r.saldo)
    const ctl = crearControlMesa({ api: apiMesa, mesaId: r.mesaId, pilaInicial: entrada })
    escucharMesa(ctl)
    controlRef.current = ctl

    const entrarAMesa = () => {
      setSentando(null)
      vaciarAvisos()
      // La marca va ANTES: desde aquí, un fallo del chunk es de la entrada y
      // recarga (ARN-3d STOP-2). Si recarga, la mesa queda abierta en el
      // servidor y la recoge el arranque (es de este dispositivo).
      marcarEntradaMesa()
      startTransition(() => {
        setControlMesa(ctl)
        // La MESA se arma con la entrada elegida (las IAS se sientan con su
        // 1,5×, como siempre); un molde de humano sólo cambia la pila del
        // asiento 0 (`siembraMesaAPU`), que es la que se cobró arriba.
        setMesa({ ...elegida, mesaId: r.mesaId })
        setScreen('table')
      })
    }

    if (r.anteriorCerrada) {
      // C4/C5 · escena (c) de la lámina: sentarse cerró una mesa vieja. En
      // Retar, la píldora cuenta SÓLO la devolución, hacia arriba (de la cifra
      // de antes de sentarse a esa cifra más lo devuelto), y la mesa nueva
      // entra cuando acaba la cuenta y medio segundo de lectura. La entrada no
      // se anima: la píldora no está en la mesa, y al volver ya enseña la cifra
      // real del servidor.
      const antes = r.saldo + entrada - r.anteriorCobro
      sustituirAvisos(avisoDeVuelta({ cobrado: r.anteriorCobro, saldo: antes + r.anteriorCobro },
        { conMonto: 'aviso.saldo.recogida', cero: 'aviso.saldo.recogida.cero' }))
      setTimeout(entrarAMesa, TIEMPOS_AVISO.cuentaIni + TIEMPOS_AVISO.cuentaDur + 500)
      return
    }
    entrarAMesa()
  }, [apiMesa, tomarSaldo, alSaldoInsuficiente, escucharMesa, sustituirAvisos, vaciarAvisos])

  // ── RNK-1 1e · UNA ENTRADA A RANKINGS ────────────────────────────────────
  // Rector RNK-1 1e §0 y §2.4. Sólo el botón «Rankings» del lobby pasa por
  // aquí: es lo que cuenta como entrada (regla 1). El contador se escribe en
  // el mismo gesto en que se decide, así que el día queda gastado cuando el
  // intersticial APARECE (regla 4), salga luego por donde salga.
  const entrarRankings = useCallback(() => {
    const { n, dia } = sumaContador.leer()
    const d = decidir({ n, ultimoDia: dia, hoy: diaChicago(), premium: esPremium })
    sumaContador.escribir({ n: d.n, dia: d.ultimoDia })
    setScreen(d.mostrar ? 'sumamente' : 'rankings')
  }, [])

  const levantarse = useCallback((fichas) => {
    const ctl = controlRef.current
    if (ctl && !ctl.terminado) {
      // La píldora enseña «—» hasta que `salir_ia` conteste (plan del STOP-1
      // §3): la cifra vieja ya no es verdad y la nueva no ha llegado.
      esperarSaldo()
      ctl.salir(fichas)
    }
    setControlMesa(null)
    setMesa(null)
    setScreen('retar-ias')
  }, [esperarSaldo])

  // ── BIE-1 · CARGANDO pinta NADA… hasta los 300 ms ──────────────────────────
  // El fondo del documento ya es el verde abismo (welcome.css:1-6), así que un
  // hueco de uno o dos fotogramas se ve como la app arrancando. Lo que decía este
  // comentario —un spinner parpadearía en el 99% de los arranques— sigue siendo
  // verdad, y por eso el indicador NO aparece antes de 300 ms (D5).
  //
  // Lo que la Fase 0 midió es que el hueco no siempre es de dos fotogramas: tras
  // «Entrar» dura lo que tarde la lectura de `profiles`, y con red lenta era un
  // verde vacío de segundos sin una palabra. Pasados 300 ms aparece «Cargando»;
  // si aparece, se queda al menos 500 ms, y mientras tanto la pantalla siguiente
  // espera aunque `useAuth` ya haya salido de CARGANDO (coste aceptado en D5).
  // No espera a `mi_sala()` (D6): eso pasa ya en el lobby.
  if (!espera.liberar) return espera.mostrar ? <Cargando /> : null

  // ── PUE · `SIN_SESION` deja de ser la Entrada y pasa a ser la PORTADA ──────
  // El contrato NO cambia: las mismas dos funciones, el mismo estado, el mismo
  // sitio en la cascada. Lo que cambia es la cara. `screens/Entrada.jsx` salió del
  // árbol en ARN-4 4c; su formulario sigue en `components/FormularioPuerta.jsx`.
  if (auth.estado === SIN_SESION) {
    return <Portada onEnviarCodigo={auth.enviarCodigo} onVerificar={auth.verificarCodigo} />
  }

  if (auth.estado === SESION_SIN_PERFIL) {
    return <Bautizo onConfirmar={auth.crearPerfil} onCerrarSesion={cerrarSesion} />
  }

  // IOS-1c · la sesión o el perfil no se pudieron saber por la red: ni la
  // Portada ni el Bautizo, que serían mentira (escena g de la lámina).
  if (auth.estado === SIN_RED) {
    return <CuentaSinRed onReintentar={auth.reintentar} onCerrarSesion={cerrarSesion} />
  }

  // ── El paquete de cuenta que baja a las pantallas ──────────────────────────
  // Se arma aquí y no en cada consumidor porque `useAuth` se llama UNA sola vez
  // (ver la cabecera del hook). Con el bypass activo el nombre es "DevLocal" y
  // las dos acciones responden diciendo que no hay cuenta real detrás — el hook
  // las corta antes de tocar la red.
  //
  // LOB-1 · Entra `correo`. La hoja ⚙ del lobby enseña con QUÉ cuenta se entró,
  // enmascarado (`c•••@gmail.com`), y `useAuth` ya lo devolvía sin que nadie lo
  // consumiera. Es un campo más en el mismo paquete: `GameTable`, que recibe
  // este mismo objeto, no se entera. Con el bypass es `null` y la línea del
  // correo se apaga reservando su caja (O1), en vez de desaparecer.
  // SAL-A · Entra `id`, y es el campo sin el cual no hay PvP. La Fase 0 §3.3
  // encontró el hueco: `useAuth` guarda el `uid` para sí (`useAuth.js:119`) y no
  // lo devuelve, pero el perfil se consulta con `.select('id, username')`, así
  // que `auth.perfil.id` ES el `auth.users.id`. Es el uuid que las salas usan
  // como `anfitrion_id` y `jugador_id` — nunca el username, que es rótulo
  // mutable (doctrina de SUP-2a: «el nombre es rótulo; el ID es contrato»).
  //
  // Con el bypass de desarrollo vale el uuid ficticio de `PERFIL_DEV`, que jamás
  // viaja a la red. De ahí que el modo del arnés que mida contra Supabase NO
  // pueda correr con bypass: ese uuid no existe en la base y cualquier clave
  // foránea lo rechaza.
  //
  // Es un campo más en el mismo paquete: `GameTable`, que recibe este objeto, no
  // se entera.
  //
  // CFG-1 1b · Entran el lugar (`pais`, `estado`), el freno (`proximoCambio`),
  // las dos acciones nuevas y `abrirPerfil`: las tres puertas del perfil (la
  // barra, la cabecera de la hoja ⚙ y «Editar» del mini-perfil propio) lo
  // llaman sin saber de `screen`. Desde la mesa no hay puerta: `GameTable` no
  // lo usa.
  const cuenta = {
    id: auth.perfil?.id ?? null,
    username: auth.perfil?.username ?? '',
    correo: auth.correo ?? '',
    pais: auth.perfil?.pais ?? null,
    estado: auth.perfil?.estado ?? null,
    proximoCambio: auth.proximoCambio,
    cambiarNombre: auth.cambiarNombre,
    comprobarNombre: auth.comprobarNombre,
    cambiarLugar: auth.cambiarLugar,
    cerrarSesion,
    // CFG-1 1c · la fila «Eliminar cuenta» de la hoja ⚙, en las siete pantallas.
    eliminarCuenta,
    abrirPerfil,
    // TIE-1 1a · la fila «Tapetes» de la hoja ⚙: el canal (lo que está en uso)
    // y su puerta, la tienda en Tapetes.
    tapetes,
    abrirTapetes: () => abrirTienda('tapetes'),
  }

  // ── LOB-1 · `cuentaLobby` se retira ────────────────────────────────────────
  // Existía para un trato concreto: que el bypass apagara el acceso de cuenta de
  // la BIENVENIDA y sólo ése, para que los arneses la vieran byte-idéntica. Esa
  // pantalla ya no se renderiza, así que la excepción protegía a un ausente.
  //
  // El lobby recibe la cuenta SIEMPRE, también con bypass, y por dos razones: su
  // bloque de perfil es parte de la cara que Victor selló —un lobby sin nombre no
  // es el lobby de la lámina— y el arnés tiene que poder medirlo. Lo que en el
  // bypass no hay es correo, y para eso está la reserva de caja de O1.

  // ── ECO-1g · EL MARCO DEL VIDEO, EN TODAS LAS PANTALLAS CON BARRA ─────────
  // Esto es una cascada de `return`, no un árbol con una raíz común, así que
  // cada pantalla que monta `BarraSuperior` se envuelve con el MISMO marco. Como
  // la forma es idéntica en todas, React conserva el marco al pasar de una a
  // otra: la hoja, la capa del video y la celebración no se desmontan. La mesa
  // NO se envuelve (G3: en la mesa no hay video).
  //
  // `avisoEnCurso`: la celebración del video espera a que la fila de avisos de
  // saldo quede vacía; nunca los dos a la vez sobre la píldora.
  const conVideo = (pantalla) => (
    <MarcoVideo control={video} avisoEnCurso={filaAvisos.length > 0} onMonedas={() => abrirTienda('monedas')}>{pantalla}</MarcoVideo>
  )
  // PES-1 §3-B · la misma forma, con la espera de su trozo. La `key` es la pantalla:
  // sin ella, React reutilizaría el `llegado` de la anterior al pasar de una a otra.
  const diferida = (trozo, pantalla) => conVideo(
    <PantallaDiferida key={screen} trozo={trozo}>{pantalla}</PantallaDiferida>,
  )

  // ── SAL-B1 · Las tres pantallas del PvP ───────────────────────────────────
  // Van ANTES de las de vs-IA y en el orden en que se recorren, que es la misma
  // convencion que ya seguian las otras: la cascada se lee como el viaje.
  //
  // Ninguna conoce `screen` ni el nombre de la siguiente: reciben callbacks. Es
  // lo que mantiene a este archivo como el unico sitio del proyecto que sabe
  // como se pasa de una pantalla a otra.
  //
  // LA CASA VA AL LOBBY DESDE LAS TRES (§5.1) y la flecha deshace UN paso, que
  // en `SalaOpciones` coincide con el lobby y en `ArmarMesa` no.
  if (screen === 'sala-opciones') {
    return diferida(trozos.salaOpciones,
      <SalaOpciones
        api={api}
        cuenta={cuenta}
        billetera={billetera}
        codigoInicial={invitacion}
        // El intento automatico ocurre solo cuando el codigo vino de un enlace
        // Y el arranque ya comprobo que no hay mesa en espera (A1 §2.5). Un
        // codigo tecleado a mano lo dispara el jugador con «Entrar».
        intentar={intentarInvitacion}
        onArmarMesa={() => { olvidarInvitacion(); setScreen('armar-mesa') }}
        onEntrarSala={(nueva) => { olvidarInvitacion(); entrarSala(nueva) }}
        onLobby={() => { olvidarInvitacion(); setScreen('lobby') }}
      />,
    )
  }

  if (screen === 'armar-mesa') {
    return diferida(trozos.armarMesa,
      <ArmarMesa
        api={api}
        cuenta={cuenta}
        billetera={billetera}
        configInicial={simulacion?.config ?? null}
        onEntrarSala={entrarSala}
        onVolver={() => setScreen('sala-opciones')}
        onLobby={() => setScreen('lobby')}
      />,
    )
  }

  if (screen === 'sala-espera') {
    return diferida(trozos.salaEspera,
      <SalaEspera
        api={api}
        cuenta={cuenta}
        billetera={billetera}
        salaInicial={sala}
        // Salir devuelve a `SalaOpciones` y no al lobby (§7): quien acaba de
        // dejar una mesa casi siempre quiere otra, y el listado esta ahi.
        onSalir={() => { setSala(null); refrescarSaldo?.(); setScreen('sala-opciones') }}
        // A1 §2.4 · «Volver al inicio» desde una mesa que arranco o murio va al
        // lobby y DESCARTA cualquier codigo pendiente: no hay nada que reanudar,
        // y un codigo que sobreviviera aqui volveria a intentarse solo.
        onLobby={() => { borrarSalaPendiente(); olvidarInvitacion(); setSala(null); setScreen('lobby') }}
        // SAL-B2 F1b · «Entrar a la mesa» cuando la mesa arranco: la mesa se
        // CONSERVA en el estado y solo cambia la pantalla. MES-PvP 3 · la sala entra sola.
        onPartida={(mesa) => { if (esMesa(mesa)) setSala(mesa); setScreen('partida-pvp') }}
      />,
    )
  }

  // ── SAL-B2 F1b · El stub de la partida PvP ────────────────────────────────
  // Decision de Victor (11-sep-2026): pantalla propia y no un estado mas de la
  // sala, para que MES-PvP la releve con su nombre sin desmontar la sala de
  // espera. La casa hace lo mismo que la casita de la sala (:421): olvida la
  // invitacion, suelta la mesa y va al lobby.
  // MES-PvP 3 · ya es LA MESA: sin el marco del video, como la mesa contra las IAS (G3) y
  // `sumamente`. Si el video estaba abierto al entrar sola, el marco se desmonta y se cierra.
  if (screen === 'partida-pvp') {
    return (
      <PantallaDiferida key={screen} trozo={trozos.partidaPvP}>
        <PartidaPvP
          cuenta={cuenta}
          billetera={billetera}
          sala={sala}
          tapetes={tapetes}
          onLobby={() => { borrarSalaPendiente(); olvidarInvitacion(); setSala(null); refrescarSaldo?.(); setScreen('lobby') }}
        />
      </PantallaDiferida>
    )
  }

  // ── APU-1 1e · LA MESA ───────────────────────────────────────────────────
  // Rector 1e §2.3. `GameTable` recibe la mesa ENTERA y la crea con la LISTA de
  // jugadores que arma `entrada.jugadoresVsIA` —nunca con el número—: es lo que
  // hace que el asiento 0 se siente con lo que el jugador eligió y las IAS con
  // la pila proporcional de §2.3 (factor 1,5, sellado en 1c-2).
  //
  // `onLeave` recibe las FICHAS con las que el humano se levanta. ECO-1c: van
  // a `salir_ia` por el canal de la mesa (`levantarse`), que las cobra UNA vez
  // y topadas por el techo; la píldora toma el saldo que devuelve.
  // RNK-1d · `apiRanking`, la misma de Rankings: la usa el mini-perfil propio
  // que abre «Ver tu nuevo ranking» en la victoria.
  if (screen === 'table' && mesa !== null) {
    return (
      /* APU-1 §5 · `saldo`: la recarga gasta BOLSILLO, y la mesa lo LEE para
         saber qué puede ofrecer. ECO-1c · ya no avisa de lo que gasta: la
         recarga se cobra en el servidor por `control`, y la billetera toma el
         saldo que devuelve. El `?? 0` es sólo de forma: «Retar» no deja
         sentarse mientras la cifra no ha llegado. */
      <GameTable
        stake={mesa.apuesta}
        numPlayers={mesa.jugadores}
        nivel={mesa.reto}
        entrada={mesa.entrada}
        // CFG-1 1e · sólo lo que la mesa pinta (el mini-perfil propio de la
        // victoria): el Bautizo en edición ya no monta desde la mesa.
        cuenta={{ username: cuenta.username, correo: cuenta.correo }}
        saldo={billetera.saldo ?? 0}
        control={controlMesa}
        apiRanking={apiRanking}
        apiConsulta={apiConsulta}
        tapetes={tapetes}
        onSaldo={tomarSaldo}
        // CFG-1 1e · esta mesa es contra las IAS (INV-70). `?cfg=mesa-humanos`
        // (sólo con el bypass) la monta como lo hará MES-PvP, para el arnés.
        contraIAS={!mesaContraHumanosDev()}
        onLeave={levantarse}
      />
    )
  }

  if (screen === 'retar-ias') {
    return diferida(trozos.retar,
      <RetarIAS
        cuenta={cuenta}
        billetera={billetera}
        sentando={sentando}
        avisoSaldo={avisoSaldo}
        onAvisoFin={finAviso}
        // ECO-1c · la entrada sale del bolsillo AL SENTARSE, y ahora en el
        // servidor: `retar` llama a `sentarse_ia` y sólo entra a una mesa que el
        // servidor abrió. Sigue entrando en una TRANSICIÓN (ARN-3d §2.4) y con
        // la marca de entrada delante (STOP-2 de ARN-3d).
        onRetar={retar}
        onVolver={() => { setSentando(null); setScreen('lobby') }}
        onLobby={() => { setSentando(null); setScreen('lobby') }}
      />,
    )
  }

  // ── RNK-1 1e · El intersticial de SumaMente ──────────────────────────────
  // Rector RNK-1 1e §1.4. Una pantalla, no una capa: SIN `conVideo` (no es el
  // video de recompensa, no lleva barra) y sin `data-escala`. Al terminar
  // —Omitir, Continuar o «atrás» pasados los 5 s— va a Rankings y no queda
  // nada montado detrás.
  if (screen === 'sumamente') {
    return (
      <PantallaDiferida trozo={trozos.sumamente} familia="abismo">
        <IntersticialSumaMente idioma={idioma} onFin={() => setScreen('rankings')} />
      </PantallaDiferida>
    )
  }

  // ── CFG-1 1b · El perfil ─────────────────────────────────────────────────
  // Pantalla con barra: con el marco del video, como Rankings.
  if (screen === 'perfil') {
    return diferida(trozos.perfil,
      <Perfil
        cuenta={cuenta}
        billetera={billetera}
        aviso={avisoSaldo}
        onAvisoFin={finAviso}
        onVolver={() => setScreen(desdePerfil)}
        onLobby={() => setScreen('lobby')}
      />,
    )
  }

  // ── RNK-1c · Rankings ────────────────────────────────────────────────────
  // Rector RNK-1 1c-i §2.1. Pantalla con barra: va con el marco del video y SIN
  // `data-escala` (INV-59, la escala es sólo de la mesa). Flecha y casa vuelven
  // al lobby. El mini-perfil lo abre `Rankings` por dentro: `App` no pasa `onJugador`.
  if (screen === 'rankings') {
    return diferida(trozos.rankings,
      <Rankings
        api={apiRanking}
        cuenta={cuenta}
        billetera={billetera}
        aviso={avisoSaldo}
        onAvisoFin={finAviso}
        onVolver={() => setScreen('lobby')}
        onLobby={() => setScreen('lobby')}
      />,
    )
  }

  // ── TIE-1 1a · La tienda ─────────────────────────────────────────────────
  // Pantalla con barra: con el marco del video (el estante Monedas pide el
  // video por su contexto).
  if (screen === 'tienda') {
    return diferida(trozos.tienda,
      <Tienda
        key={tienda.n}
        cuenta={cuenta}
        billetera={billetera}
        aviso={avisoSaldo}
        onAvisoFin={finAviso}
        control={tapetes}
        estanteInicial={tienda.estante}
        onVolver={() => setScreen(tienda.desde === 'tienda' ? 'lobby' : tienda.desde)}
        onLobby={() => setScreen('lobby')}
      />,
    )
  }

  // La caída de la cascada sigue siendo el destino de `COMPLETO`. Las props son
  // las de la cuenta, la billetera, los avisos y a dónde lleva cada botón: el lobby
  // sigue sin conocer `screen`, ni Supabase, ni la mesa.
  return conVideo(
    <Lobby
      cuenta={cuenta}
      billetera={billetera}
      aviso={avisoSaldo}
      onAvisoFin={finAviso}
      constancia={constancia?.uid === uidCompleto ? constancia.ficha : null}
      onJugarIA={() => setScreen('retar-ias')}
      onJugarPvP={() => setScreen('sala-opciones')}
      onRankings={entrarRankings}
      onTienda={() => abrirTienda('tapetes')}
      onCerrarSesion={cerrarSesion}
    />,
  )
}

export default App
