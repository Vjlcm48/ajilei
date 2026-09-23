import { useState } from 'react'

import PantallaChips from '../components/PantallaChips'
import FilaChips from '../components/FilaChips'
import { useIdioma } from '../hooks/useIdioma'
import { montoTexto } from '../config/tapetes'
import { MOTIVOS_ENTRADA } from '../engine/entrada'
import {
  MEMORIA_RETO, MOTIVO_SIN_SALDO, normalizarReto,
  elegir, filaHabilitada, listo,
  opcionesReto, opcionesJugadores, opcionesApuesta, opcionesEntrada,
  idEntrada, pasoEntrada, topeEntrada, entradaDeLaSesion, pilaDeCadaIA,
} from './retarCore'

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
export default function RetarIAS({
  cuenta,
  saldoSesion,
  configInicial = null,
  onRetar,
  onVolver,
  onLobby,
}) {
  const { t } = useIdioma()

  // El inicializador perezoso corre UNA vez: leer el almacenamiento en cada
  // render sería trabajo repetido y dejaría que un cambio de saldo reescribiera
  // bajo el dedo lo que el jugador acaba de elegir. `entrada` nace en `null`
  // porque no se recuerda — no es un olvido, es la política.
  const [config, setConfig] = useState(() => ({
    ...(configInicial
      ? normalizarReto(configInicial, saldoSesion)
      : MEMORIA_RETO.leer(saldoSesion)),
    entrada: null,
  }))

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
  const filaEntrada = opcionesEntrada(unit, saldoSesion)
  const tope = apuesta !== null ? topeEntrada(unit, saldoSesion) : 0

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
    cambiar('entrada', pasoEntrada(entrada, unit, saldoSesion, direccion))
  }

  // ── El CTA y su nota ──────────────────────────────────────────────────────
  const completo = listo(config)
  const veredicto = completo ? entradaDeLaSesion(entrada, unit, saldoSesion) : { ok: false, motivo: null }

  const MOTIVOS_TEXTO = {
    [MOTIVOS_ENTRADA.MONTO_INVALIDO]: 'ia.entrada.monto_invalido',
    [MOTIVOS_ENTRADA.BAJO_PISO]:      'ia.entrada.bajo_piso',
    [MOTIVOS_ENTRADA.SOBRE_TECHO]:    'ia.entrada.sobre_techo',
    [MOTIVO_SIN_SALDO]:               'ia.entrada.sin_saldo',
  }

  let notaCta = null
  if (!completo) {
    notaCta = t('ia.retar.cta.falta')
  } else if (!veredicto.ok) {
    notaCta = t(MOTIVOS_TEXTO[veredicto.motivo] ?? 'ia.entrada.monto_invalido', {
      hc: montoTexto(unit * 5),
      techo: montoTexto(tope),
      saldo: montoTexto(saldoSesion),
    })
  }

  // «Retar a 1 IA» y «Retar a 4 IAS» son dos frases, no una con un plural
  // calculado: el español no pluraliza las siglas con una `s` y meter una regla
  // de pluralización en `t()` para un solo caso sería traer i18next por la
  // puerta de atrás (doctrina de `config/textos.js`).
  const rivales = jugadores !== null ? jugadores - 1 : 0
  const rotuloCta = completo
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
      saldo={saldoSesion}
      onVolver={onVolver}
      onLobby={onLobby}
      cta={{
        clase: 'es-retar',
        etiqueta: rotuloCta,
        disabled: !completo || !veredicto.ok,
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
          con 1.400 esa mesa no se puede jugar. */}
      <FilaChips
        titulo={t('ia.retar.apuesta')}
        accion="apuesta"
        opciones={opcionesApuesta(reto, saldoSesion).map((o) => ({
          ...o,
          etiqueta: montoTexto(o.etiqueta),
          aviso: o.disabled ? t('ia.retar.aviso.saldo', { min: montoTexto(o.minimo) }) : null,
        }))}
        valor={apuesta}
        onChange={(hc) => cambiar('apuesta', hc)}
        deshabilitada={!filaHabilitada(config, 'apuesta')}
        accionAviso="aviso-mesa"
        claseAviso="es-anfitrion"
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
    </PantallaChips>
  )
}
