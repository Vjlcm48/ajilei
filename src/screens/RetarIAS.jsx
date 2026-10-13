import { useEffect, useState } from 'react'

import PantallaChips from '../components/PantallaChips'
import FilaChips from '../components/FilaChips'
import { useIdioma } from '../hooks/useIdioma'
import { useVideo } from '../hooks/useVideo'
import { AJILEI_CONFIG } from '../config/ajileiConfig'
import { montoTexto } from '../config/tapetes'
import { nivelPorId } from '../config/niveles'
import { MOTIVOS_ENTRADA } from '../engine/entrada'
import {
  MEMORIA_RETO, MOTIVO_SIN_SALDO, normalizarReto,
  elegir, filaHabilitada, listo,
  opcionesReto, opcionesJugadores, opcionesApuesta, opcionesEntrada,
  idEntrada, pasoEntrada, topeEntrada, entradaDeLaSesion, pilaDeCadaIA,
  avisoDeSaldo, CASO_ALCANZA, CASO_RETO_MENOR, guardaDeSaldo,
} from './retarCore'
import { saldoParaJuzgar, ERROR as SALDO_ERROR } from '../hooks/billeteraCore'

// ── APU-1 1e · «Retar a las IAS» ────────────────────────────────────────────
// Rector: AJILEI_APU-1_Fase1e_v1.0.md §2.2. Boceto aprobado por Victor en
// «Multijugador 5». Releva a `NivelSelect` + `ModeSelect`, que eran dos
// pantallas para tres decisiones y no tenían sitio para la cuarta.
//
// ── POR QUÉ CUATRO FILAS Y NO DOS PANTALLAS ────────────────────────────────
// D-3 (NIV-UI) separó «contra quién juego» de «qué arriesgo» y las puso en
// pantallas distintas. Esa frontera sigue siendo cierta, pero APU-1 añade una
// decisión que D-3 no conocía —con CUÁNTO me siento— y que sólo tiene sentido
// junto a la apuesta de mesa, porque es un múltiplo suyo. Tres pantallas para
// cuatro chips habrían sido dos toques de más; una sola superficie con relevo en
// cascada las enseña en el orden en que dependen unas de otras, que es lo que
// D-3 quería proteger.
//
// ── LA CASCADA ES LA REGLA, Y ESTÁ EN `retarCore` ──────────────────────────
// Elegir una fila habilita la siguiente; cambiar una superior limpia las
// inferiores. Aquí no se decide nada de eso: `elegir` y `filaHabilitada` lo
// resuelven y Vitest los sella, porque este proyecto no tiene jsdom y una regla
// escrita en JSX es una regla que sólo mide Playwright.
//
// ── LO QUE NO SE RECUERDA ──────────────────────────────────────────────────
// La entrada. Es la única de las cuatro que gasta dinero, y un jugador que abre
// la pantalla con el techo puesto de ayer puede sentarse con cincuenta veces la
// apuesta sin haberlo decidido hoy. La política vive en `config/memoriaChips.js`
// y esta pantalla sólo la declara.
// ── RET-A · El aviso de saldo y su única salida ────────────────────────────
// La DECISIÓN —qué caso y qué frase— se queda en la pantalla: esto sólo pinta.
//
// ── ECO-1g · LA SALIDA YA LLEVA A ALGUNA PARTE: EL VIDEO (G3 a) ────────────
// El botón decía «Conseguir más monedas» y contestaba «Pronto». Ahora dice
// «Ver un video · +500 HC» y pide el video, con el contador debajo: «Te quedan
// N de 8 hoy» o, con el tope alcanzado, «Vuelven en 5 h 12 min» y el botón
// apagado (G6). Las dos frases ocupan la misma caja, siempre presente (O1).
// El premio y el contador los dice el servidor (`mi_video`), y se preguntan al
// salir este bloque; mientras no contesta, la caja se queda vacía y el premio
// es el del espejo.
function AvisoSaldo({ texto }) {
  const { t } = useIdioma()
  // El video llega por el contexto de `MarcoVideo`. Fuera de él sería `null` y
  // el botón no haría nada, que es preferible a tumbar la pantalla.
  const video = useVideo()
  const mirar = video?.mirar
  useEffect(() => { mirar?.() }, [mirar])

  return (
    <section className="sal-saldo" data-accion="aviso-saldo">
      {/* El aviso NO es un botón: quien cambia de reto son los chips de la fila
          de arriba, y convertir la frase en un atajo dejaría dos maneras de
          hacer lo mismo y un párrafo que se pulsa sin parecerlo. */}
      <p className="sal-saldo-txt">{texto}</p>
      <button
        type="button"
        className="sal-saldo-cta"
        data-accion="mas-monedas"
        disabled={!video || video.apagado}
        onClick={video?.pedir}
      >
        {t('video.pedir', { hc: montoTexto(video?.premio ?? AJILEI_CONFIG.economy.videoReward) })}
      </button>
      <p className="vid-quedan" data-accion="video-quedan">{video?.contador ?? ' '}</p>
    </section>
  )
}

// ── ECO-1b · Sin cifra y con la lectura fallida: decirlo y dejar reintentar ──
// Ajuste 1 del rector al plan de la 1b. Si la billetera falló y no hay ninguna
// cifra conocida, «Cargando tu saldo…» sería mentir para siempre. Este bloque
// dice lo que pasa y ofrece la única salida que depende del jugador: volver a
// leer. Mismo traje que `AvisoSaldo` (las clases `sal-saldo*`), otro
// `data-accion` para que el arnés lo distinga.
function AvisoLectura({ onReintentar }) {
  const { t } = useIdioma()
  return (
    <section className="sal-saldo" data-accion="aviso-lectura" role="alert">
      <p className="sal-saldo-txt">{t('ia.retar.saldo.error')}</p>
      <button
        type="button"
        className="sal-saldo-cta"
        data-accion="saldo-reintentar"
        onClick={onReintentar}
      >
        {t('ia.retar.saldo.reintentar')}
      </button>
    </section>
  )
}

export default function RetarIAS({
  cuenta,
  // ECO-1b · la cifra única de `useBilletera` (App). Releva a `saldoSesion`.
  billetera = null,
  configInicial = null,
  // ECO-1c · sentarse es una llamada al servidor. `sentando`: null, o
  // `{ fase: 'enviando' }` mientras contesta, o `{ fase: 'error', codigo }`.
  // Mientras se envía —y mientras corre el aviso de una mesa vieja que se
  // cerró (escena c de la lámina)— el CTA no se puede volver a pulsar.
  sentando = null,
  avisoSaldo = null,
  onAvisoFin,
  onRetar,
  onVolver,
  onLobby,
}) {
  const { t } = useIdioma()

  // ── ECO-1b · la cifra y el juicio ─────────────────────────────────────────
  // `saldo` es lo que se enseña (o `null` mientras no se sabe). `juicio` es
  // contra qué se apagan mesas y entradas: sin cifra, contra nada
  // (`SIN_JUICIO`) — ni mesas en gris, ni «No te alcanza», ni aviso de saldo.
  // Lo único que se apaga sin cifra es el CTA: sentarse SÍ gasta, y no se gasta
  // a ciegas.
  const saldo = billetera?.saldo ?? null
  const juicio = saldoParaJuzgar(saldo)
  const sinCifra = saldo === null
  const lecturaFallida = sinCifra && billetera?.estado === SALDO_ERROR

  // El inicializador perezoso corre UNA vez: leer el almacenamiento en cada
  // render sería trabajo repetido y dejaría que un cambio de saldo reescribiera
  // bajo el dedo lo que el jugador acaba de elegir. `entrada` nace en `null`
  // porque no se recuerda — no es un olvido, es la política.
  //
  // ECO-1b · sin cifra se lee sin la guarda de saldo, y `guardaDeSaldo` la
  // aplica al pintar en cuanto la cifra llega (sin efecto que escriba estado).
  const [configCruda, setConfig] = useState(() => ({
    ...(configInicial
      ? normalizarReto(configInicial, juicio)
      : MEMORIA_RETO.leer(juicio)),
    entrada: null,
  }))
  const config = guardaDeSaldo(configCruda, juicio)

  // Si el contador de «Otra…» está abierto. Es estado de PINTURA y no de
  // decisión: el monto elegido vive en `config.entrada`, y por eso el contador
  // no se recuerda ni viaja a ninguna parte.
  const [otra, setOtra] = useState(false)

  const { reto, jugadores, apuesta, entrada } = config

  const cambiar = (campo, valor) => {
    setConfig((previa) => elegir(previa, campo, valor))
    // Cambiar cualquier fila cierra el contador: el monto que enseñaba era de
    // otra mesa y seguir viéndolo sería enseñar una cifra que ya no significa
    // nada.
    if (campo !== 'entrada') setOtra(false)
  }

  // ── Fila 4 · la entrada ───────────────────────────────────────────────────
  // Todo lo de aquí depende de la apuesta, así que hasta que haya mesa no hay
  // ni montos que ofrecer. `unit` es la apuesta de mesa; el 0 de relleno nunca
  // se usa porque la fila va deshabilitada.
  const unit = apuesta ?? 0
  const filaEntrada = opcionesEntrada(unit, juicio)
  const tope = apuesta !== null ? topeEntrada(unit, juicio) : 0

  const tocarEntrada = (id) => {
    if (id === 'otra') {
      setOtra(true)
      // Abre en el piso, que es lo más barato: el contador sube, no baja. Abrir
      // en el medio sería preseleccionar un monto que el jugador no pidió.
      cambiar('entrada', filaEntrada[0].monto)
      return
    }
    setOtra(false)
    cambiar('entrada', filaEntrada.find((o) => o.id === id).monto)
  }

  const mover = (direccion) => {
    cambiar('entrada', pasoEntrada(entrada, unit, juicio, direccion))
  }

  // ── RET-A · El aviso de saldo ─────────────────────────────────────────────
  // La regla entera está en `retarCore.avisoDeSaldo` y aquí sólo se pinta. Mira
  // el SALDO y el RETO, nada más: ni la apuesta ni la entrada, que son las dos
  // filas que el jugador recorre con el dedo.
  const aviso = avisoDeSaldo(juicio, reto)

  // ── El CTA y su nota ──────────────────────────────────────────────────────
  const completo = listo(config)
  const veredicto = completo ? entradaDeLaSesion(entrada, unit, juicio) : { ok: false, motivo: null }

  const MOTIVOS_TEXTO = {
    [MOTIVOS_ENTRADA.MONTO_INVALIDO]: 'ia.entrada.monto_invalido',
    [MOTIVOS_ENTRADA.BAJO_PISO]:      'ia.entrada.bajo_piso',
    [MOTIVOS_ENTRADA.SOBRE_TECHO]:    'ia.entrada.sobre_techo',
    [MOTIVO_SIN_SALDO]:               'ia.entrada.sin_saldo',
  }

  const enviando = sentando?.fase === 'enviando'
  let notaCta = null
  if (sentando?.fase === 'error') {
    // ECO-1d · `limite` (K7: ya se reintentó un minuto con el mismo token) y
    // `tope_diario` (K8: la válvula, encendida desde el SQL Editor).
    notaCta = t(sentando.codigo === 'red' ? 'ia.retar.sentarse.red'
      : sentando.codigo === 'saldo_insuficiente' ? 'ia.retar.sentarse.saldo'
        : sentando.codigo === 'limite' ? 'ia.retar.sentarse.limite'
          : sentando.codigo === 'tope_diario' ? 'ia.retar.sentarse.tope'
            : 'ia.retar.sentarse.otro')
  } else if (sinCifra) {
    // ECO-1b · mientras carga, la nota lo dice; si la lectura falló, lo dice
    // `AvisoLectura` con su botón y la nota calla para no repetirlo.
    notaCta = lecturaFallida ? null : t('ia.retar.saldo.cargando')
  } else if (!completo) {
    notaCta = t('ia.retar.cta.falta')
  } else if (!veredicto.ok) {
    notaCta = t(MOTIVOS_TEXTO[veredicto.motivo] ?? 'ia.entrada.monto_invalido', {
      hc: montoTexto(unit * 5),
      techo: montoTexto(tope),
      saldo: montoTexto(saldo),
    })
  }

  // «Retar a 1 IA» y «Retar a 4 IAS» son dos frases, no una con un plural
  // calculado: el español no pluraliza las siglas con una `s` y meter una regla
  // de pluralización en `t()` para un solo caso sería traer i18next por la
  // puerta de atrás (doctrina de `config/textos.js`).
  const rivales = jugadores !== null ? jugadores - 1 : 0
  const rotuloCta = enviando ? t('ia.retar.sentando') : completo
    ? t(rivales === 1 ? 'ia.retar.cta.una' : 'ia.retar.cta', {
        n: rivales,
        hc: montoTexto(apuesta),
        entrada: montoTexto(entrada),
      })
    : t('ia.retar.cta.vacio')

  return (
    <PantallaChips
      titulo={t('ia.retar.titulo')}
      clase="es-retar"
      cuenta={cuenta}
      saldo={saldo}
      estadoSaldo={billetera?.estado}
      aviso={avisoSaldo}
      onAvisoFin={onAvisoFin}
      onVolver={onVolver}
      onLobby={onLobby}
      cta={{
        clase: 'es-retar',
        etiqueta: rotuloCta,
        disabled: enviando || sinCifra || !completo || !veredicto.ok,
        onClick: () => {
          // Se recuerda lo que el jugador llegó a USAR, no por dónde paseó el
          // dedo — y de eso, sólo los tres campos de la política.
          MEMORIA_RETO.guardar(config)
          onRetar?.({ reto, jugadores, apuesta, entrada })
        },
        nota: notaCta,
      }}
    >
      {/* ── 1 · Reto ─────────────────────────────────────────────────────── */}
      <FilaChips
        titulo={t('ia.retar.reto')}
        accion="reto"
        opciones={opcionesReto()}
        valor={reto}
        onChange={(id) => cambiar('reto', id)}
        accionAviso="aviso-reto"
      />

      {/* ── 2 · Jugadores ────────────────────────────────────────────────── */}
      {/* La nota de comodín es la que hoy da `ModeSelect`: el 7 de Oros sólo
          entra en mesas de 4 y 5. Es rótulo, no regla — quien lo decide es
          `handRules`, y la frontera sale de `retarCore.COMODIN_DESDE`. */}
      <FilaChips
        titulo={t('ia.retar.jugadores')}
        accion="jugadores"
        claseChips="es-jugadores"
        opciones={opcionesJugadores().map((o) => ({
          ...o,
          aviso: t(o.comodin ? 'ia.retar.comodin.si' : 'ia.retar.comodin.no'),
        }))}
        valor={jugadores}
        onChange={(n) => cambiar('jugadores', n)}
        deshabilitada={!filaHabilitada(config, 'jugadores')}
        accionAviso="aviso-comodin"
      />

      {/* ── 3 · Apuesta ──────────────────────────────────────────────────── */}
      {/* Una mesa va en gris cuando el saldo de la sesión no cubre su PISO de
          entrada —10× la apuesta desde 1f-A4, §2.2 del normativo v1.1—, no
          cuando no cubre la apuesta: sentarse a la mesa de 150 cuesta 1.500, y
          con 1.400 esa mesa no se puede jugar.

          ── RET-A · ESTA FILA YA NO TIENE AVISO, Y NO ES UN OLVIDO ──────────
          Llevaba uno que nombraba el piso de la primera mesa apagada, en el
          naranja de los problemas. El chip en gris ya dice «esta mesa no», así
          que el párrafo era el mismo mensaje dos veces; y lo que le faltaba al
          jugador no era la cifra sino la salida, que ahora está abajo con su
          botón. Se retira `accionAviso` entero en vez de dejarlo vacío porque
          FilaChips sólo reserva la caja cuando la fila la declara, y una caja
          reservada para algo que nunca se escribe son 1,4em de aire en una
          columna que ya se aprieta para caber en un 1024×768. Tocar un chip
          gris no hace nada: no hay pista ni toast, a propósito. */}
      <FilaChips
        titulo={t('ia.retar.apuesta')}
        accion="apuesta"
        opciones={opcionesApuesta(reto, juicio).map((o) => ({
          ...o,
          etiqueta: montoTexto(o.etiqueta),
        }))}
        valor={apuesta}
        onChange={(hc) => cambiar('apuesta', hc)}
        deshabilitada={!filaHabilitada(config, 'apuesta')}
      />

      {/* ── 4 · Entrada ──────────────────────────────────────────────────── */}
      {/* SIN PRESELECCIÓN, a propósito (§2.2): es la decisión que gasta dinero y
          la única que no se recuerda. El aviso reservado promete con cuánto se
          sienta cada IA, y esa cifra sale de `entrada.pilaIA` —el factor 1,5
          sellado en 1c-2— y nunca de una copia de la fórmula. */}
      <FilaChips
        titulo={t('ia.retar.entrada')}
        accion="entrada"
        opciones={filaEntrada.map((o) => ({
          id: o.id,
          // Sin mesa elegida el chip lleva su nombre y nada más: `{hc}` vacío
          // no es una variable ausente —que pintaría ⟦hc⟧— sino una cadena, y
          // el espacio sobrante lo colapsa el propio HTML.
          etiqueta: o.id === 'otra'
            ? t('ia.retar.entrada.otra')
            : t(`ia.retar.entrada.${o.id}`, { hc: o.monto === null ? '' : montoTexto(o.monto) }),
          disabled: o.disabled,
        }))}
        valor={otra ? 'otra' : idEntrada(entrada, unit)}
        onChange={tocarEntrada}
        deshabilitada={!filaHabilitada(config, 'entrada')}
        accionAviso="aviso-pila"
        nota={entrada !== null
          ? t('ia.retar.aviso.pila', { hc: montoTexto(pilaDeCadaIA(entrada, unit)) })
          : null}
      >
        {/* ── O1 · EL CONTADOR SE RESERVA, NO APARECE ───────────────────
            Vive DENTRO de la fila de chips, en su misma caja de flex. Montarlo
            sólo al abrir «Otra…» costaba una línea de flex nueva, y esa línea
            empujaba el CTA fuera de la ventana en 1024×768 — medido, no supuesto
            (informe 1e §E-8). Ahora está siempre y lo que cambia es su
            visibilidad, que es la misma regla que gobierna los avisos: la caja
            no se mueve bajo el dedo que va a pulsar.
            `visibility: hidden` lo saca también del orden de tabulación, así que
            oculto no es alcanzable ni con teclado. */}
        <span
          className={`sal-contador${otra ? '' : ' is-off'}`}
          data-accion="contador"
          aria-hidden={!otra}
        >
          <button
            type="button"
            className="sal-paso"
            data-accion="entrada-menos"
            aria-label={t('ia.retar.entrada.menos')}
            disabled={entrada <= filaEntrada[0].monto}
            onClick={() => mover(-1)}
          >
            −
          </button>
          {/* Oculto enseña el piso de la mesa, no un cero: lo que reserva la
              caja tiene que medir lo que medirá de verdad. */}
          <b data-accion="entrada-monto">{montoTexto(entrada ?? filaEntrada[0].monto ?? 0)}</b>
          <button
            type="button"
            className="sal-paso"
            data-accion="entrada-mas"
            aria-label={t('ia.retar.entrada.mas')}
            disabled={entrada >= tope}
            onClick={() => mover(+1)}
          >
            +
          </button>
        </span>
      </FilaChips>

      {/* ── RET-A · El aviso de saldo y su única salida ─────────────────
        Depende SÓLO del saldo y del reto (`retarCore.avisoDeSaldo`), así que
        aparece y desaparece al tocar la PRIMERA fila, nunca al pasear por la
        tercera o la cuarta.

        ── POR QUÉ NO RESERVA CAJA, SIENDO O1 LA DOCTRINA ───────────────
        O1 existe para que nada se mueva bajo el dedo que va a pulsar. Aquí
        no puede pasar, y es mecánico: lo único que enciende o apaga este
        bloque es cambiar de reto, y cambiar de reto LIMPIA apuesta y entrada
        (la cascada de §2.2), o sea que el CTA queda apagado sí o sí en ese
        mismo gesto. Nada que el jugador estuviera a punto de pulsar cambia
        de sitio; las tres filas que hay por encima no se mueven, porque el
        bloque crece hacia abajo. Reservarle caja, en cambio, costaría ~70 px
        permanentes en una columna que ya se aprieta para caber en 768 de
        alto, y se los cobraría al 100 % de las partidas para un estado que
        casi nadie ve.

        El botón es el ÚNICO nuevo de la pantalla. Desde ECO-1g pide el video
        de recompensa (`useVideo`), lo mismo que la fila de la hoja del `+`
        dorado de la cabecera. */}
      {lecturaFallida && <AvisoLectura onReintentar={billetera?.refrescar} />}
      {aviso.caso !== CASO_ALCANZA && (
        <AvisoSaldo
          texto={aviso.caso === CASO_RETO_MENOR
            ? t('ia.retar.saldo.reto', { reto: nivelPorId(aviso.retoSugerido).nombre })
            : t('ia.retar.saldo.ninguno')}
        />
      )}
    </PantallaChips>
  )
}
