import { useCallback, useEffect, useRef, useState } from 'react'
import '../styles/salas.css'

import BarraSuperior from '../components/BarraSuperior'
import { IconoCasa, IconoCopiar, IconoCheck } from '../components/IconosSalas'
import { useIdioma } from '../hooks/useIdioma'
import { montoTexto } from '../config/tapetes'
import { saldoDelJugador } from '../lib/saldo'
import { claveDeError } from '../lib/salasApi'

// ── SAL-B1 · SalaEspera · STUB PROVISIONAL ──────────────────────────────────
// Rector: AJILEI_SAL-B1_Fase1_v1.0.md §7. **B2 REEMPLAZA ESTA PANTALLA ENTERA.**
//
// ── PARA QUÉ EXISTE ────────────────────────────────────────────────────────
// Para dos cosas concretas, y ninguna más:
//   (1) que ningún CTA de B1 termine en una pantalla en blanco — un botón que
//       lleva a la nada es peor que un botón apagado;
//   (2) que las pruebas A y B de §9.5 se puedan hacer con dos teléfonos de
//       verdad, que es la única manera de comprobar que el índice parcial muerde
//       y que el sexto intento se corta.
//
// ── LO QUE DELIBERADAMENTE NO TIENE ────────────────────────────────────────
// Realtime, cronómetro, sonidos de llegada, mazo, marca de agua, consejos,
// «Jugar ya» y `navigator.share`. Todo eso es de B2 y está en la lámina SAL-3;
// adelantarlo aquí sería escribir dos veces la misma pantalla, y la segunda vez
// contra un dibujo que esta sub-tanda no tiene encargo de leer.
//
// El «x/N sentados» se lee UNA vez al montar y lo relee un botón. Sin latido: el
// número es correcto en el instante en que se pide y honesto el resto del
// tiempo, porque hay un botón al lado que dice que hay que volver a pedirlo. Un
// número que se queda quieto FINGIENDO estar vivo sería peor que este.
//
// ── LO QUE NO SE PUDO HACER, Y ESTÁ ANOTADO ────────────────────────────────
// §7 pide «Anfitrión: nombre». `mi_sala()` devuelve `anfitrion_id` —un uuid— y
// ninguna de las trece funciones de SAL-A traduce ese uuid a un username;
// `profiles` tampoco es legible para un tercero por RLS. Antes que inventar una
// consulta o pintar un uuid, el invitado lee «Estás en la mesa · Privada», que
// es cierto y útil. Queda en «Requiere autorización» del informe.

export default function SalaEspera({ api, cuenta, salaInicial = null, onSalir, onLobby }) {
  const { t } = useIdioma()
  const saldo = saldoDelJugador()

  const [sala, setSala] = useState(salaInicial)
  const [sentados, setSentados] = useState(null)
  const [confirmando, setConfirmando] = useState(false)
  const [copiado, setCopiado] = useState(false)
  const [toast, setToast] = useState(null)
  const [ocupado, setOcupado] = useState(false)

  const relojToast = useRef(null)
  const relojCopia = useRef(null)

  useEffect(() => {
    document.body.classList.add('sal-activa')
    return () => { document.body.classList.remove('sal-activa') }
  }, [])

  // Los dos relojes de esta pantalla, cancelados en el desmontaje. GT-HIG:
  // ninguno se queda suelto.
  useEffect(() => () => {
    clearTimeout(relojToast.current)
    clearTimeout(relojCopia.current)
  }, [])

  const avisar = useCallback((claveTexto) => {
    setToast(claveTexto)
    clearTimeout(relojToast.current)
    relojToast.current = setTimeout(() => setToast(null), 2600)
  }, [])

  // ── Releer: la sala y su recuento ────────────────────────────────────────
  // `mi_sala()` da la fila —incluido el `estado`, que es como se descubre que la
  // mesa arrancó o la cancelaron— y `contarSentados()` da el «x». Son dos
  // llamadas porque son dos preguntas: la fila de `salas` no lleva el recuento,
  // y la que sí lo lleva (`salas_abiertas`) no ve las privadas.
  //
  // NO ES `async`, y es a propósito: una función `async` llamada desde el cuerpo
  // de un efecto ejecuta todo lo anterior a su primer `await` de forma síncrona,
  // y `react-hooks/set-state-in-effect` la trata —con razón— como un `setState`
  // dentro del efecto. Encadenada con `.then`, cada `setState` cae en la
  // respuesta de un sistema externo, que es lo que la regla describe como
  // correcto. Molde de `releerMesas` en las otras dos pantallas.
  const releer = useCallback(() => {
    let vivo = true
    api.miSala().then(({ data }) => {
      if (!vivo) return
      if (!data) {
        // Sin sala: o venció y se canceló, o alguien la cerró. Se deja la última
        // conocida en pantalla —para que el jugador no vea un hueco— marcada
        // como cancelada, que es lo que enciende el mensaje de «la mesa arrancó».
        setSala((previa) => (previa ? { ...previa, estado: 'cancelada' } : null))
        return
      }
      setSala(data)
      return api.contarSentados(data.id).then(({ data: n }) => {
        if (vivo) setSentados(n)
      })
    })
    return () => { vivo = false }
  }, [api])

  useEffect(() => releer(), [releer])

  const copiar = () => {
    if (!sala?.codigo) return
    // `clipboard` puede no existir (contexto no seguro) o ser denegado. El
    // `catch` deja el botón sin acuse en vez de tumbar la pantalla, y el código
    // sigue en la pantalla para copiarlo a mano — que es lo que el jugador va a
    // hacer de todas formas.
    navigator.clipboard?.writeText(sala.codigo).then(() => {
      setCopiado(true)
      clearTimeout(relojCopia.current)
      relojCopia.current = setTimeout(() => setCopiado(false), 2000)
    }).catch(() => {})
  }

  const salir = async () => {
    setOcupado(true)
    const { error } = await api.salirSala(sala?.id)
    setOcupado(false)
    // Se sale IGUAL si el servidor falla. La sala ya no interesa al jugador que
    // pulsó «Salir», y dejarlo encerrado en una pantalla que no puede abandonar
    // por un error de red sería el peor de los dos males; el barrido cierra la
    // fila a los tres minutos de todas formas.
    if (error) avisar(claveDeError(error))
    onSalir?.()
  }

  const esAnfitrion = Boolean(sala && cuenta?.id && sala.anfitrion_id === cuenta.id)
  const arrancoOMurio = Boolean(sala && sala.estado !== 'esperando')
  const claveTipo = sala?.tipo === 'abierta' ? 'sal.espera.tipo.abierta' : 'sal.espera.tipo.privada'

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
        <h1>
          {sala
            ? t('sal.espera.titulo', { n: sala.jugadores, hc: montoTexto(sala.apuesta) })
            : ' '}
        </h1>
      </div>

      <div className="sal-cuerpo">
        <section className="sal-espera">

          <p className="sal-espera-sub">
            {sala
              ? t(esAnfitrion ? 'sal.espera.anfitrion.tu' : 'sal.espera.anfitrion.otro', {
                  tipo: t(claveTipo),
                })
              : ' '}
          </p>

          {/* El código en oro con su botón de copiar. Es la única línea de la
              lámina SAL-3 que esta sub-tanda adelanta —ya estaba sellada— y B2
              la hereda tal cual. Sólo las privadas tienen código. */}
          {sala?.codigo ? (
            <p className="sal-codigo-grande" data-accion="codigo-sala">
              <span>{sala.codigo}</span>
              <button
                type="button"
                className={`sal-copiar${copiado ? ' is-hecho' : ''}`}
                data-accion="copiar"
                aria-label={t(copiado ? 'sal.espera.codigo.copiado' : 'sal.espera.codigo.copiar')}
                onClick={copiar}
              >
                {copiado ? <IconoCheck /> : <IconoCopiar />}
              </button>
            </p>
          ) : null}

          {arrancoOMurio ? (
            // §7 · si el barrido arranca la mesa durante la prueba, el stub lo
            // DICE y ofrece la salida. No se juega nada: la partida PvP es de
            // otra campaña y fingir aquí una mesa sería la peor clase de humo.
            <>
              <p className="sal-sentados" data-accion="arranco">{t('sal.espera.arranco')}</p>
              <div className="sal-espera-botones">
                <button type="button" className="sal-secundario" data-accion="lobby" onClick={() => onLobby?.()}>
                  {t('sal.espera.lobby')}
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="sal-sentados" data-accion="sentados">
                {sala && sentados !== null
                  ? t('sal.espera.sentados', { x: sentados, n: sala.jugadores })
                  : ' '}
              </p>

              <p className="sal-provisional" data-accion="provisional">
                {t('sal.espera.provisional')}
              </p>

              <div className="sal-espera-botones">
                <button
                  type="button"
                  className="sal-secundario"
                  data-accion="actualizar"
                  onClick={releer}
                >
                  {t('sal.espera.actualizar')}
                </button>

                {/* ── Salir, y la confirmación que SÓLO ve el anfitrión ──────
                    Un invitado que se levanta deja una silla; el anfitrión que
                    se levanta CANCELA la mesa para todos los demás. Son dos
                    consecuencias muy distintas detrás del mismo rótulo, y por
                    eso sólo una de las dos pregunta. Preguntarle también al
                    invitado sería enseñarle a ignorar la pregunta. */}
                {confirmando ? (
                  <>
                    <button
                      type="button"
                      className="sal-secundario"
                      data-accion="cancelar-si"
                      disabled={ocupado}
                      onClick={salir}
                    >
                      {t('sal.espera.cancelar.si')}
                    </button>
                    <button
                      type="button"
                      className="sal-secundario"
                      data-accion="cancelar-no"
                      onClick={() => setConfirmando(false)}
                    >
                      {t('sal.espera.cancelar.no')}
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    className="sal-secundario"
                    data-accion="salir"
                    disabled={ocupado}
                    onClick={() => (esAnfitrion ? setConfirmando(true) : salir())}
                  >
                    {t('sal.espera.salir')}
                  </button>
                )}
              </div>

              <p className="sal-provisional" role={confirmando ? 'alert' : undefined}>
                {confirmando ? t('sal.espera.cancelar') : ' '}
              </p>
            </>
          )}

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
