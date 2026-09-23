import { useState, useEffect, useRef, useCallback } from 'react'
// ── LOB-1 · `Lobby` releva a `WelcomeScreen` en la casilla de `COMPLETO` ─────
// `components/WelcomeScreen.jsx` sigue en el árbol —borrar es otra tanda, igual
// que con `TableSelect` y `Entrada`— pero deja de importarse desde aquí, así que
// deja de renderizarse y pasa a ser código muerto declarado.
import Lobby from './screens/Lobby'
// SAL-B1 · Las tres pantallas del PvP. `SalaEspera` es todavia un STUB (rector
// SAL-B1 §7) y B2 la reemplaza entera; las otras dos son definitivas.
import SalaOpciones from './screens/SalaOpciones'
import ArmarMesa from './screens/ArmarMesa'
import SalaEspera from './screens/SalaEspera'
// SAL-B2 F1b · el destino de una mesa que arranco: un stub hasta MES-PvP.
import PartidaPvP from './screens/PartidaPvP'
// APU-1 1e · «Retar a las IAS» releva a `NivelSelect` + `ModeSelect`, que se
// RETIRAN del árbol en esta tanda (rector 1e §2.3) junto con `TableSelect`.
import RetarIAS from './screens/RetarIAS'
import GameTable from './components/GameTable'
import Portada from './screens/Portada'
import Bautizo from './screens/Bautizo'
import { saldoDelJugador } from './lib/saldo'
// El molde de APU-1, hermano de `siembraCEL`: en producción devuelve `null` en
// su primera línea y el minificador se lleva el archivo entero.
import { siembraAPU } from './dev/siembraAPU'
// `AUTH_BYPASS` sale del import con LOB-1: su único consumidor aquí era
// `cuentaLobby`, que protegía a la Bienvenida y se retiró con ella. La constante
// sigue viva y exportada en el hook, que es donde trabaja.
import { useAuth, CARGANDO, SIN_SESION, SESION_SIN_PERFIL } from './hooks/useAuth'
import { precargarSonidos, SONIDOS_MESA } from './hooks/useSounds'
import { precargarBaraja } from './lib/precargaBaraja'
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
import { simulacionSalas } from './dev/salasFixtures'
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
const SIN_PRECARGA = ['lobby', 'sala-opciones', 'armar-mesa', 'sala-espera', 'partida-pvp']

function App() {
  // Los hooks van todos ARRIBA y ninguno detrás de un retorno: el orden de
  // llamada tiene que ser el mismo en los cuatro estados de sesión. Es la razón
  // por la que `useAuth` abre la función y los `useState` del lobby se declaran
  // aunque la puerta esté a punto de devolver otra pantalla.
  const auth = useAuth()

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
  const api = simulacion?.api ?? salasApi

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

  // ── El saldo de la SESIÓN (ECO-1 sigue pendiente) ────────────────────────
  // Rector 1e §0 y §2.3. No hay billetera: `saldoDelJugador()` devuelve una
  // constante y nada se persiste. Lo que esta cifra sí hace es MOVERSE dentro de
  // la sesión —baja al sentarse, sube con lo que se levante de la mesa— y eso es
  // lo que permite validar de verdad las dos reglas que dependen de ella: la
  // mesa en gris por saldo (§2.2) y la recarga (§3.5).
  //
  // Vive en `App` y no en la pantalla porque tiene que SOBREVIVIR a que la
  // pantalla se desmonte: el viaje es lobby → retar → mesa → resultado → lobby,
  // y el saldo es lo único que cruza las cuatro. Al recargar la página vuelve a
  // la constante, que es exactamente lo honesto hasta que exista el ledger.
  //
  // `?apu=saldo:<n>` (solo en desarrollo) lo arranca en otra cifra: es lo que
  // permite fotografiar una mesa EN GRIS por saldo sin perder antes una partida.
  const [saldoSesion, setSaldoSesion] = useState(() => siembraAPU()?.saldo ?? saldoDelJugador())

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
  const entrarSala = useCallback((mesa) => {
    if (!esMesa(mesa)) return
    setSala(mesa)
    setScreen('sala-espera')
  }, [])

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
    // CAR-1 §3.2 · y la baraja con ellos, por la misma razón y en el mismo
    // momento: 0,57 MB de WebP contra los 24,28 MB de PNG que ya no viajan.
    precargarBaraja()
  }, [screen])

  // CARGANDO no pinta: pinta NADA. El fondo del documento ya es el verde abismo
  // (welcome.css:1-6), así que el hueco de uno o dos fotogramas se ve como la
  // app arrancando y no como una pantalla que va y viene. Un spinner aquí sería
  // peor: parpadearía en el 99% de los arranques, que resuelven de inmediato.
  if (auth.estado === CARGANDO) return null

  // ── PUE · `SIN_SESION` deja de ser la Entrada y pasa a ser la PORTADA ──────
  // El contrato NO cambia: las mismas dos funciones, el mismo estado, el mismo
  // sitio en la cascada. Lo que cambia es la cara. `screens/Entrada.jsx` sigue
  // en el árbol —borrar es otra tanda— y comparte con la portada el MISMO
  // formulario, extraído a `components/FormularioPuerta.jsx`.
  if (auth.estado === SIN_SESION) {
    return <Portada onEnviarCodigo={auth.enviarCodigo} onVerificar={auth.verificarCodigo} />
  }

  if (auth.estado === SESION_SIN_PERFIL) {
    return <Bautizo onConfirmar={auth.crearPerfil} onCerrarSesion={auth.cerrarSesion} />
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
  const cuenta = {
    id: auth.perfil?.id ?? null,
    username: auth.perfil?.username ?? '',
    correo: auth.correo ?? '',
    cambiarNombre: auth.cambiarNombre,
    cerrarSesion: auth.cerrarSesion,
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
    return (
      <SalaOpciones
        api={api}
        cuenta={cuenta}
        codigoInicial={invitacion}
        // El intento automatico ocurre solo cuando el codigo vino de un enlace
        // Y el arranque ya comprobo que no hay mesa en espera (A1 §2.5). Un
        // codigo tecleado a mano lo dispara el jugador con «Entrar».
        intentar={intentarInvitacion}
        onArmarMesa={() => { olvidarInvitacion(); setScreen('armar-mesa') }}
        onEntrarSala={(nueva) => { olvidarInvitacion(); entrarSala(nueva) }}
        onLobby={() => { olvidarInvitacion(); setScreen('lobby') }}
      />
    )
  }

  if (screen === 'armar-mesa') {
    return (
      <ArmarMesa
        api={api}
        cuenta={cuenta}
        configInicial={simulacion?.config ?? null}
        onEntrarSala={entrarSala}
        onVolver={() => setScreen('sala-opciones')}
        onLobby={() => setScreen('lobby')}
      />
    )
  }

  if (screen === 'sala-espera') {
    return (
      <SalaEspera
        api={api}
        cuenta={cuenta}
        salaInicial={sala}
        // Salir devuelve a `SalaOpciones` y no al lobby (§7): quien acaba de
        // dejar una mesa casi siempre quiere otra, y el listado esta ahi.
        onSalir={() => { setSala(null); setScreen('sala-opciones') }}
        // A1 §2.4 · «Volver al inicio» desde una mesa que arranco o murio va al
        // lobby y DESCARTA cualquier codigo pendiente: no hay nada que reanudar,
        // y un codigo que sobreviviera aqui volveria a intentarse solo.
        onLobby={() => { borrarSalaPendiente(); olvidarInvitacion(); setSala(null); setScreen('lobby') }}
        // SAL-B2 F1b · «Entrar a la mesa» cuando la mesa arranco: la mesa se
        // CONSERVA en el estado (el stub la nombra) y solo cambia la pantalla.
        onPartida={(mesa) => { if (esMesa(mesa)) setSala(mesa); setScreen('partida-pvp') }}
      />
    )
  }

  // ── SAL-B2 F1b · El stub de la partida PvP ────────────────────────────────
  // Decision de Victor (11-sep-2026): pantalla propia y no un estado mas de la
  // sala, para que MES-PvP la releve con su nombre sin desmontar la sala de
  // espera. La casa hace lo mismo que la casita de la sala (:421): olvida la
  // invitacion, suelta la mesa y va al lobby.
  if (screen === 'partida-pvp') {
    return (
      <PartidaPvP
        cuenta={cuenta}
        sala={sala}
        onLobby={() => { borrarSalaPendiente(); olvidarInvitacion(); setSala(null); setScreen('lobby') }}
      />
    )
  }

  // ── APU-1 1e · LA MESA ───────────────────────────────────────────────────
  // Rector 1e §2.3. `GameTable` recibe la mesa ENTERA y la crea con la LISTA de
  // jugadores que arma `entrada.jugadoresVsIA` —nunca con el número—: es lo que
  // hace que el asiento 0 se siente con lo que el jugador eligió y las IAS con
  // la pila proporcional de §2.3 (factor 1,5, sellado en 1c-2).
  //
  // `onLeave` recibe las FICHAS con las que el humano se levanta y las devuelve
  // al saldo de la sesión. Es la otra mitad de la resta de abajo, y sin ella el
  // saldo bajaría en cada mesa y no subiría nunca.
  if (screen === 'table' && mesa !== null) {
    return (
      /* APU-1 §5 · `saldo` y `onRecargar`: la recarga gasta BOLSILLO, y el
         bolsillo vive aquí. La mesa no lo guarda ni lo recuerda —lo LEE para
         saber qué puede ofrecer, y avisa cuando el jugador gasta—. Es la misma
         dirección que la entrada, que también sale del bolsillo al sentarse. */
      <GameTable
        stake={mesa.apuesta}
        numPlayers={mesa.jugadores}
        nivel={mesa.reto}
        entrada={mesa.entrada}
        cuenta={cuenta}
        saldo={saldoSesion}
        onRecargar={(monto) => setSaldoSesion((previo) => Math.max(0, previo - monto))}
        onLeave={(fichas) => {
          setSaldoSesion((previo) => previo + (Number.isFinite(fichas) ? fichas : mesa.entrada))
          setMesa(null)
          setScreen('retar-ias')
        }}
      />
    )
  }

  if (screen === 'retar-ias') {
    return (
      <RetarIAS
        cuenta={cuenta}
        saldoSesion={saldoSesion}
        onRetar={(elegida) => {
          // La entrada sale del bolsillo AQUÍ, al sentarse, y no cuando la mesa
          // termina: es lo que el jugador arriesga, y la barra superior de la
          // mesa tiene que enseñarlo desde la primera mano.
          setSaldoSesion((previo) => previo - elegida.entrada)
          setMesa(elegida)
          setScreen('table')
        }}
        onVolver={() => setScreen('lobby')}
        onLobby={() => setScreen('lobby')}
      />
    )
  }

  // La caída de la cascada sigue siendo el destino de `COMPLETO`. CUATRO props
  // desde SAL-B1 —entra `onJugarPvP`— y ninguna más: el lobby sigue sin conocer
  // `screen`, ni Supabase, ni la mesa. Lo unico que sabe es que su segundo CTA
  // ahora lleva a alguna parte.
  return (
    <Lobby
      cuenta={cuenta}
      saldo={saldoSesion}
      onJugarIA={() => setScreen('retar-ias')}
      onJugarPvP={() => setScreen('sala-opciones')}
      onCerrarSesion={auth.cerrarSesion}
    />
  )
}

export default App
