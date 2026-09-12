import { useCallback, useEffect, useRef, useState } from 'react'
import '../styles/salas.css'

import BarraSuperior from '../components/BarraSuperior'
import { IconoVolver, IconoCasa, IconoGlobo } from '../components/IconosSalas'
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
import { leerConfig, guardarConfig } from '../config/salaRecordada'
import { saldoDelJugador } from '../lib/saldo'
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

export default function ArmarMesa({
  api,
  cuenta,
  // §8.2 · el arnés inyecta la configuración inicial para poder fotografiar
  // `armar-aviso` y `armar-unirme` sin tocar el almacenamiento del navegador.
  // En producción es `null` y manda `salaRecordada`.
  configInicial = null,
  onEntrarSala,
  onVolver,
  onLobby,
}) {
  const { t } = useIdioma()
  const saldo = saldoDelJugador()

  // ── §4.4 · La configuración recordada, ya pasada por sus guardas ──────────
  // El inicializador perezoso de `useState` corre UNA vez, que es exactamente
  // lo que se quiere: leer el almacenamiento en cada render sería trabajo
  // repetido, y peor, dejaría que un cambio de saldo a mitad de pantalla
  // reescribiera bajo el dedo lo que el jugador acaba de elegir.
  const [config, setConfig] = useState(
    () => (configInicial ? normalizarConfig(configInicial, saldo) : leerConfig(saldo))
  )
  const { jugadores, apuesta, tipo } = config

  const [mesas, setMesas] = useState([])
  const [error, setError] = useState(null)
  const [ocupado, setOcupado] = useState(false)
  const [toast, setToast] = useState(null)

  const relojToast = useRef(null)

  useEffect(() => {
    document.body.classList.add('sal-activa')
    return () => { document.body.classList.remove('sal-activa') }
  }, [])

  useEffect(() => () => clearTimeout(relojToast.current), [])

  const avisar = useCallback((claveTexto) => {
    setToast(claveTexto)
    clearTimeout(relojToast.current)
    relojToast.current = setTimeout(() => setToast(null), 2600)
  }, [])

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
      if (vivo) setMesas(ordenarMesas(data ?? [], saldo))
    })
    return () => { vivo = false }
  }, [api, saldo])

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
    : (existeMisma ? null : otraMesaAlAlcance(mesas, saldo, jugadores, apuesta))

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
      guardarConfig(config)
      onEntrarSala?.(respuesta.data)
      return
    }

    setError(respuesta.error)

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
    notaCta = t('sal.armar.nota.5x', { min: montoTexto(saldoMinimo(apuesta)), hc: montoTexto(apuesta) })
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
    <main className="sal">
      <div className="sal-fondo" aria-hidden="true" />

      <BarraSuperior
        usuario={cuenta?.username ?? ''}
        saldo={saldo}
        onPerfil={() => avisar('lob.toast.pronto')}
        onTienda={() => avisar('lob.toast.pronto')}
        onAjustes={() => avisar('lob.toast.pronto')}
      />

      <div className="sal-cab">
        {/* Aquí la flecha y la casa DEJAN de coincidir: la flecha deshace un
            paso —vuelve a `SalaOpciones`, §4.5— y la casa salta al lobby de un
            tirón (§5.1). Tener las dos es lo que hace que el jugador que entró a
            mirar pueda salir sin desandar. */}
        <button
          type="button"
          className="sal-volver"
          data-accion="volver"
          aria-label={t('sal.volver.aria')}
          onClick={() => onVolver?.()}
        >
          <IconoVolver />
        </button>
        <h1>{t('sal.armar.titulo')}</h1>
      </div>

      <div className="sal-cuerpo es-armar">

        {/* ── Jugadores ──────────────────────────────────────────────────── */}
        <section className="sal-bloque">
          <h2>{t('sal.armar.jugadores')}</h2>
          <div className="sal-chips es-jugadores" role="group" aria-label={t('sal.armar.jugadores')}>
            {JUGADORES_PVP.map((n) => (
              <button
                key={n}
                type="button"
                className="sal-chip"
                data-accion="jugadores"
                aria-pressed={jugadores === n}
                onClick={() => elegir({ jugadores: n })}
              >
                {n}
              </button>
            ))}
          </div>
        </section>

        {/* ── Apuesta ────────────────────────────────────────────────────── */}
        <section className="sal-bloque">
          <h2>{t('sal.armar.apuesta')}</h2>
          <div className="sal-chips" role="group" aria-label={t('sal.armar.apuesta')}>
            {APUESTAS_PVP.map((hc) => (
              <button
                key={hc}
                type="button"
                className="sal-chip"
                data-accion="apuesta"
                aria-pressed={apuesta === hc}
                // La regla 5× apaga el chip. Es CORTESÍA (§3.5), no validación:
                // el servidor la comprueba otra vez y su `saldo_insuficiente` se
                // pinta como cualquier otro error.
                disabled={!alcanza(hc, saldo)}
                onClick={() => elegir({ apuesta: hc })}
              >
                {montoTexto(hc)}
              </button>
            ))}
          </div>
          {/* O1 · dos líneas de caja reservada. El texto es largo y aparecer no
              puede empujar el bloque de modos ni el CTA. */}
          <p className={`sal-aviso es-anfitrion${avisoNuevos ? ' is-on' : ''}`} data-accion="aviso-nuevos">
            {avisoNuevos
              ? t('sal.armar.aviso.nuevos', {
                  hc: montoTexto(apuesta),
                  bono: montoTexto(BONO_BIENVENIDA),
                  // Se DERIVA de `ALCANCE_NUEVOS`, que a su vez se deriva del
                  // bono y de la regla. Escribir «100 o 200» a mano aquí sería
                  // dejar una frase que mentiría el día que suba el bono.
                  alcance: ALCANCE_NUEVOS.map(montoTexto).join(' o '),
                })
              : ' '}
          </p>
        </section>

        {/* ── ¿Cómo la llenamos? ─────────────────────────────────────────── */}
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

        {/* ── El CTA ─────────────────────────────────────────────────────── */}
        <section className="sal-accion">
          <button
            type="button"
            className="sal-cta"
            data-accion="cta"
            disabled={ocupado}
            onClick={pulsar}
          >
            {t(rotuloCta)}
          </button>
          <small data-accion="cta-nota" role={error ? 'alert' : undefined}>
            {notaCta ?? ' '}
          </small>
        </section>

      </div>

      <button
        type="button"
        className="sal-casa"
        data-accion="casa"
        aria-label={t('sal.casa.aria')}
        onClick={() => onLobby?.()}
      >
        <IconoCasa />
      </button>

      <div className={`sal-toast${toast !== null ? ' is-on' : ''}`} role="status" aria-live="polite">
        {toast !== null ? t(toast) : ' '}
      </div>
    </main>
  )
}
