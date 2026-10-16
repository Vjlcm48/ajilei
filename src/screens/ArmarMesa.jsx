import { useCallback, useEffect, useState } from 'react'

import PantallaChips from '../components/PantallaChips'
import FilaChips from '../components/FilaChips'
import { IconoGlobo } from '../components/IconosSalas'
import { IconoCandado } from '../components/IconosLobby'
import { useIdioma } from '../hooks/useIdioma'
import { montoTexto } from '../config/tapetes'
import {
  ALCANCE_NUEVOS,
  APUESTAS_PVP,
  BONO_BIENVENIDA,
  JUGADORES_PVP,
  saldoMinimo,
} from '../config/salas'
import { MEMORIA_PVP } from '../config/salaRecordada'
import { saldoParaJuzgar } from '../hooks/billeteraCore'
import { claveDeError } from '../lib/salasApi'
import {
  alcanza,
  buscarCombinacion,
  fueraDelAlcanceDeNuevos,
  normalizarConfig,
  ordenarMesas,
  otraMesaAlAlcance,
} from './salasCore'

// ── SAL-B1 · ArmarMesa · las tres decisiones del anfitrión ──────────────────
// Rector: AJILEI_SAL-B1_Fase1_v1.0.md §4. Autoridad visual: `AJILEI_SAL2_lamina
// _v1.2.html`, sellada por Victor.
//
// Cuántos · cuánto · cómo se llena. Y un CTA que cambia de nombre según lo que
// esas tres decisiones signifiquen, que es la parte interesante de esta
// pantalla: «Abrir mesa» se vuelve «Unirme a esa mesa» cuando la combinación ya
// existe, porque una segunda mesa idéntica no la quiere nadie —parte a la mitad
// a los que esperan y las dos tardan el doble en llenarse—.
//
// ── APU-1 1e · LA CARCASA Y LAS FILAS SE COMPARTEN CON «RETAR A LAS IAS» ────
// Rector 1e §2.1 (K-3a). Lo que era marcado a mano aquí pasa a `PantallaChips`
// y `FilaChips`, y esta pantalla queda con lo suyo: las tres decisiones, la
// consulta de mesas abiertas y el CTA que cambia de nombre. La extracción es
// NEUTRA —las mismas clases, los mismos `data-accion`, el mismo orden— y quien
// lo prueba es `diagSAL`: sus tres estados de `armar` no cambiaron una línea.
//
// El bloque de modos NO se convierte en `FilaChips`: sus botones son
// `.sal-modo` con dos líneas y un icono, no chips de píldora. Forzarlo en el
// molde de los chips habría cambiado su marcado, que es justo lo que la
// neutralidad prohíbe.
//
// ── LA REGLA SELLADA VIVE EN EL SERVIDOR, NO AQUÍ ──────────────────────────
// Lo que esta pantalla hace es ENSEÑAR la regla antes de tiempo. Quien decide es
// `crear_sala`, que ante una `abierta` con la combinación ocupada llama a
// `unirse_sala` por su cuenta (migración §9). Entre la consulta de esta pantalla
// y el toque del jugador cabe otro anfitrión, así que el CTA puede decir «Abrir
// mesa» y acabar uniendo — y está bien, porque el resultado es el mismo y el
// jugador aterriza donde quería. Lo que NO puede pasar es que se creen dos, y de
// eso se encarga el índice parcial.
//
// ── EL AVISO AL ANFITRIÓN NO ES UNA ADVERTENCIA DE ERROR ───────────────────
// «Con 2.000 HC, un invitado nuevo no podrá sentarse» no impide nada: es
// información que sólo el anfitrión puede usar, porque es el único que sabe a
// quién va a invitar. Por eso es naranja y no rojo, y por eso el chip de 2.000
// sigue vivo.

// ECO-1b · «100 o 200» con dos; «100, 200 o 500» con tres. El bono subió y la
// lista creció: unirla siempre con « o » habría dado «100 o 200 o 500».
function listaConO(partes) {
  if (partes.length <= 1) return partes.join('')
  return `${partes.slice(0, -1).join(', ')} o ${partes[partes.length - 1]}`
}

export default function ArmarMesa({
  api,
  cuenta,
  // §8.2 · el arnés inyecta la configuración inicial para poder fotografiar
  // `armar-aviso` y `armar-unirme` sin tocar el almacenamiento del navegador.
  // En producción es `null` y manda la memoria.
  configInicial = null,
  // ECO-1b · la cifra única de `useBilletera` (App).
  billetera = null,
  onEntrarSala,
  onVolver,
  onLobby,
}) {
  const { t } = useIdioma()
  // ECO-1b · `saldo` es lo que se pinta (o `null` mientras no se sabe);
  // `juicio` es contra qué se apagan los chips: sin cifra, contra nada
  // (`SIN_JUICIO`), y decide el servidor.
  const saldo = billetera?.saldo ?? null
  const juicio = saldoParaJuzgar(saldo)

  // ── §4.4 · La configuración recordada, ya pasada por sus guardas ──────────
  // El inicializador perezoso de `useState` corre UNA vez, que es exactamente
  // lo que se quiere: leer el almacenamiento en cada render sería trabajo
  // repetido, y peor, dejaría que un cambio de saldo a mitad de pantalla
  // reescribiera bajo el dedo lo que el jugador acaba de elegir.
  //
  // ECO-1b · si la pantalla se monta antes de que llegue el saldo, la memoria
  // se lee SIN la guarda de saldo y la guarda se aplica al pintar, en cuanto la
  // cifra llega: `normalizarConfig` es idempotente, así que con el saldo ya
  // conocido al montar no cambia nada respecto a antes. Sin efecto que escriba
  // estado (`react-hooks/set-state-in-effect`).
  const [configCruda, setConfig] = useState(
    () => (configInicial ? normalizarConfig(configInicial, juicio) : MEMORIA_PVP.leer(juicio))
  )
  const config = normalizarConfig(configCruda, juicio)
  const { jugadores, apuesta, tipo } = config

  // ECO-1b · filas crudas; el orden se calcula al pintar (ver `SalaOpciones`).
  const [filas, setFilas] = useState([])
  const mesas = ordenarMesas(filas, juicio)
  const [error, setError] = useState(null)
  // ECO-1b · la apuesta con la que se INTENTÓ. Tras un `saldo_insuficiente` la
  // billetera se relee, y si la cifra nueva ya no alcanza esa mesa la guarda de
  // saldo la cae al defecto: la nota tiene que seguir hablando de la mesa que
  // el servidor rechazó, no de la que quedó marcada después.
  const [apuestaIntentada, setApuestaIntentada] = useState(null)
  const [ocupado, setOcupado] = useState(false)

  // ── Qué mesas abiertas hay ───────────────────────────────────────────────
  // §4.3 permitía «vía `salas_abiertas` filtrada en cliente, o vía la función de
  // SAL-A que lo resuelva si existe». NO EXISTE: el informe de SAL-A lista las
  // trece funciones y ninguna responde «¿hay una abierta de N×X?». Se filtra en
  // cliente, que es la otra vía que la propia ficha autoriza, y queda anotado.
  //
  // Se ordenan con `ordenarMesas` aunque aquí no se pinte ninguna lista: lo que
  // se necesita de ese orden es que `otraMesaAlAlcance` coja la MÁS LLENA, que
  // es la que antes va a arrancar y por tanto la única que merece señalar.
  const releerMesas = useCallback(() => {
    let vivo = true
    api.salasAbiertas().then(({ data }) => {
      if (vivo) setFilas(data ?? [])
    })
    return () => { vivo = false }
  }, [api])

  useEffect(() => releerMesas(), [releerMesas])

  const elegir = (cambio) => {
    setConfig((previa) => ({ ...previa, ...cambio }))
    // Cambiar de opción borra el error anterior: seguía hablando de una mesa que
    // ya no es la que está sobre la mesa.
    setError(null)
  }

  // ── Lo que las tres decisiones significan ────────────────────────────────
  const existeMisma = buscarCombinacion(mesas, jugadores, apuesta)
  const esUnirme = tipo === 'abierta' && existeMisma !== null
  const avisoNuevos = fueraDelAlcanceDeNuevos(apuesta, BONO_BIENVENIDA)

  // ── El recordatorio suave, en sus DOS modos ──────────────────────────────
  // Victor resolvió el 7-sep-2026 la contradicción entre la lámina —que sólo lo
  // enseña en modo Abierta, señalando OTRA mesa a mi alcance— y la ficha §4.3
  // —que lo describe en modo Privada, cuando MI combinación ya existe abierta—.
  // La resolución es que no eran dos versiones de lo mismo: cada documento
  // describía un modo distinto, y los dos casos son útiles.
  //
  //   · Privada: «vas a hacer una mesa cerrada y ya hay una abierta igualita».
  //   · Abierta sin mi combinación: «vas a abrir la tuya, pero mira esta otra».
  //
  // En Abierta CON mi combinación no hay recordatorio, y no es un olvido: ahí el
  // CTA ya dice «Unirme a esa mesa» y su nota lo explica. Repetirlo debajo sería
  // decir dos veces lo mismo en dos tonos distintos.
  const recuerdo = tipo === 'privada'
    ? existeMisma
    : (existeMisma ? null : otraMesaAlAlcance(mesas, juicio, jugadores, apuesta))

  const rotuloCta = tipo === 'privada'
    ? 'sal.armar.cta.privada'
    : (esUnirme ? 'sal.armar.cta.unirme' : 'sal.armar.cta.abrir')

  const pulsar = async () => {
    setOcupado(true)
    const respuesta = esUnirme
      ? await api.unirseSala({ salaId: existeMisma.id })
      : await api.crearSala(tipo, jugadores, apuesta)
    setOcupado(false)

    if (!respuesta.error) {
      // §4.4 · se recuerda lo que el jugador llegó a USAR, no por dónde paseó el
      // dedo. Por eso se guarda aquí y no en `elegir`.
      MEMORIA_PVP.guardar(config)
      onEntrarSala?.(respuesta.data)
      return
    }

    setError(respuesta.error)
    setApuestaIntentada(apuesta)

    // ECO-1b · el servidor sabe un saldo más bajo que el que enseñamos: se
    // vuelve a leer la billetera y la píldora y los chips se ponen al día.
    if (respuesta.error === 'saldo_insuficiente') billetera?.alSaldoInsuficiente?.()

    // ── §4.3 · La carrera del índice parcial ────────────────────────────────
    // Si entre la lectura de arriba y este toque otro anfitrión abrió la misma
    // combinación, `crear_sala` la habría unido sola. Pero si los dos llegan en
    // el mismo milisegundo, el índice parcial `salas_abierta_unica_idx` rechaza
    // el segundo `insert` con un 23505 que `salasApi` entrega como
    // `error_inesperado` —su contrato no deja pasar códigos crudos, y hace bien—.
    //
    // No se distingue ese caso por el código: se RELEE. Si tras releer la
    // combinación existe, el CTA pasa solo a «Unirme a esa mesa» con su nota, sin
    // recargar y sin que el jugador tenga que entender qué pasó. Es lo que §4.3
    // pide, y funciona igual sea cual sea la causa del fallo.
    if (!esUnirme && tipo === 'abierta') releerMesas()
  }

  // ── La nota bajo el CTA ─────────────────────────────────────────────────
  // Un solo hueco para tres cosas, en orden de urgencia: el error manda sobre la
  // nota informativa, porque es la respuesta a lo último que hizo el jugador.
  //
  // `saldo_insuficiente` se cuenta con `sal.armar.nota.5x` y no con su texto de
  // error, y es la única excepción: aquí SÍ se conocen las dos cifras, así que
  // «Necesitas 2.500 HC para sentarte a 500» dice lo mismo que «No te alcanza» y
  // además dice cuánto falta. Es también lo que le da consumidor a esa clave de
  // la lámina.
  let notaCta = null
  if (error === 'saldo_insuficiente') {
    const rechazada = apuestaIntentada ?? apuesta
    notaCta = t('sal.armar.nota.5x', { min: montoTexto(saldoMinimo(rechazada)), hc: montoTexto(rechazada) })
  } else if (error) {
    notaCta = t(claveDeError(error))
  } else if (esUnirme) {
    notaCta = t('sal.armar.nota.unirme', {
      n: existeMisma.jugadores,
      hc: montoTexto(existeMisma.apuesta),
      x: existeMisma.sentados,
    })
  }

  return (
    <PantallaChips
      titulo={t('sal.armar.titulo')}
      clase="es-armar"
      cuenta={cuenta}
      saldo={saldo}
      estadoSaldo={billetera?.estado}
      recordado={billetera?.recordado ?? null}
      cobrando={billetera?.pendiente === true}
      // Aquí la flecha y la casa DEJAN de coincidir: la flecha deshace un paso
      // —vuelve a `SalaOpciones`, §4.5— y la casa salta al lobby de un tirón
      // (§5.1). Tener las dos es lo que hace que el jugador que entró a mirar
      // pueda salir sin desandar.
      onVolver={onVolver}
      onLobby={onLobby}
      cta={{
        etiqueta: t(rotuloCta),
        disabled: ocupado,
        onClick: pulsar,
        nota: notaCta,
        alerta: Boolean(error),
      }}
    >
      {/* ── Jugadores ────────────────────────────────────────────────────── */}
      <FilaChips
        titulo={t('sal.armar.jugadores')}
        accion="jugadores"
        claseChips="es-jugadores"
        opciones={JUGADORES_PVP.map((n) => ({ id: n, etiqueta: n }))}
        valor={jugadores}
        onChange={(n) => elegir({ jugadores: n })}
      />

      {/* ── Apuesta ──────────────────────────────────────────────────────── */}
      {/* O1 · dos líneas de caja reservada. El texto es largo y aparecer no
          puede empujar el bloque de modos ni el CTA. */}
      <FilaChips
        titulo={t('sal.armar.apuesta')}
        accion="apuesta"
        opciones={APUESTAS_PVP.map((hc) => ({
          id: hc,
          etiqueta: montoTexto(hc),
          // La regla 5× apaga el chip. Es CORTESÍA (§3.5), no validación: el
          // servidor la comprueba otra vez y su `saldo_insuficiente` se pinta
          // como cualquier otro error.
          disabled: !alcanza(hc, juicio),
        }))}
        valor={apuesta}
        onChange={(hc) => elegir({ apuesta: hc })}
        accionAviso="aviso-nuevos"
        claseAviso="es-anfitrion"
        nota={avisoNuevos
          ? t('sal.armar.aviso.nuevos', {
              hc: montoTexto(apuesta),
              bono: montoTexto(BONO_BIENVENIDA),
              // Se DERIVA de `ALCANCE_NUEVOS`, que a su vez se deriva del bono y
              // de la regla. Escribir «100 o 200» a mano aquí habría dejado una
              // frase que mentía en cuanto subió el bono (ECO-1b: ahora son
              // tres, «100, 200 o 500»).
              alcance: listaConO(ALCANCE_NUEVOS.map(montoTexto)),
            })
          : null}
      />

      {/* ── ¿Cómo la llenamos? ───────────────────────────────────────────── */}
      <section className="sal-bloque">
        <h2>{t('sal.armar.como')}</h2>
        <div className="sal-modos" role="group" aria-label={t('sal.armar.como')}>
          <button
            type="button"
            className="sal-modo"
            data-accion="modo-privada"
            aria-pressed={tipo === 'privada'}
            onClick={() => elegir({ tipo: 'privada' })}
          >
            <span className="sal-modo-t">
              <IconoCandado /><span>{t('sal.armar.privada')}</span>
            </span>
            <span className="sal-modo-d">{t('sal.armar.privada.d')}</span>
          </button>
          <button
            type="button"
            className="sal-modo"
            data-accion="modo-abierta"
            aria-pressed={tipo === 'abierta'}
            onClick={() => elegir({ tipo: 'abierta' })}
          >
            <span className="sal-modo-t">
              <IconoGlobo /><span>{t('sal.armar.abierta')}</span>
            </span>
            <span className="sal-modo-d">{t('sal.armar.abierta.d')}</span>
          </button>
        </div>
        <p className={`sal-aviso es-recuerdo${recuerdo ? ' is-on' : ''}`} data-accion="recuerdo">
          {recuerdo
            ? t('sal.armar.recuerdo', {
                n: recuerdo.jugadores,
                hc: montoTexto(recuerdo.apuesta),
                x: recuerdo.sentados,
              })
            : ' '}
        </p>
      </section>
    </PantallaChips>
  )
}
