import { useCallback, useEffect, useRef, useState } from 'react'
import '../styles/salas.css'

import BarraSuperior from '../components/BarraSuperior'
import CajaAccion from '../components/CajaAccion'
import { cajaDeAccion } from '../components/zonaAccionCore'
import { useDesborde } from '../hooks/useDesborde'
import { IconoVolver, IconoCasa } from '../components/IconosSalas'
import { useIdioma } from '../hooks/useIdioma'
import { montoTexto } from '../config/tapetes'
import { normalizarCodigo } from '../config/salas'
import { saldoParaJuzgar } from '../hooks/billeteraCore'
import { claveDeError } from '../lib/salasApi'
import {
  LARGO_CODIGO,
  alcanza,
  codigoListo,
  faltanPara,
  filtrarCodigo,
  ordenarMesas,
} from './salasCore'

// ── SAL-B1 · SalaOpciones · la primera pantalla del PvP ─────────────────────
// Rector: AJILEI_SAL-B1_Fase1_v1.0.md §3. Autoridad visual: `AJILEI_SAL1_lamina
// _v1.2.html`, sellada por Victor.
//
// Tres bloques y un CTA: pega tu código · mira quién está armando · arma la
// tuya. En ese orden, y el orden es la decisión de producto: quien llega con un
// código invitado lo trae en la mano y no debe tener que buscar dónde pegarlo.
//
// ── LO QUE ESTA PANTALLA NO SABE ───────────────────────────────────────────
// No conoce `screen`, ni el valor de la siguiente pantalla, ni cómo se navega:
// recibe callbacks y los llama. Es el mismo trato que `Lobby` y lo que permite
// que `App.jsx` siga siendo el único sitio que sabe pasar de una pantalla a
// otra —un `useState` y una cascada de `if`, sin router—.
//
// TAMPOCO CONOCE `salasApi`. La API entra por parámetro, y es lo que permite
// que el arnés le pase datos fijos con `?sal=` sin que la pantalla se entere
// (§8.2). Ese parámetro es también el único punto por donde algo simulado puede
// entrar: no hay un segundo camino.
//
// ── LO QUE NO ESTÁ AQUÍ, Y ES DE B2 ────────────────────────────────────────
// Realtime, cronómetro en las tarjetas, sonidos y precarga. El listado se lee al
// montar y al volver, y punto (§3.3): montar y volver son el mismo instante,
// porque esta pantalla se desmonta al navegar. La cuenta atrás de la tarjeta la
// resolvió Victor a favor de la ficha el 7-sep-2026 — `salas_abiertas()` ya
// devuelve `expira_en` y `useReloj` ya sabe restar, así que lo que le falta a
// B2 es el latido, no el dato.

export default function SalaOpciones({
  api,
  cuenta,
  // §5.2 · el código que llegó por enlace y sobrevivió al registro. Viene ya
  // consumido por `App.jsx`: aquí sólo se pinta y, cuando `intentar` se
  // enciende, se prueba UNA vez.
  codigoInicial = null,
  intentar = false,
  // ECO-1b · la cifra única de `useBilletera` (App).
  billetera = null,
  onArmarMesa,
  onEntrarSala,
  onLobby,
}) {
  const { t } = useIdioma()
  // ECO-1b · `saldo` es lo que se pinta (o `null` mientras no se sabe);
  // `juicio` es contra qué se atenúan las mesas: sin cifra, contra nada
  // (`SIN_JUICIO`), y decide el servidor.
  const saldo = billetera?.saldo ?? null
  const juicio = saldoParaJuzgar(saldo)
  // Estable (un `useCallback` de `useBilletera`): puede ir en las dependencias
  // del intento automático sin rearmarlo en cada render de `App`.
  const alSaldoInsuficiente = billetera?.alSaldoInsuficiente

  // El cuerpo del código: SÓLO los cuatro caracteres. El `AJ-` se dibuja fuera
  // del campo porque es constante y no algo que el jugador teclee.
  const [cuerpo, setCuerpo] = useState(() => cuerpoDe(codigoInicial))
  const [errorCodigo, setErrorCodigo] = useState(null)
  // ECO-1b · se guardan las filas CRUDAS y el orden se calcula al pintar: así
  // la llegada del saldo reordena sin volver a pedir `salas_abiertas()`.
  const [filas, setFilas] = useState([])
  const mesas = ordenarMesas(filas, juicio)
  const [ocupado, setOcupado] = useState(false)
  const [toast, setToast] = useState(null)

  const campoRef = useRef(null)
  // GT-HIG · TODO reloj lleva handle y se cancela. Ninguno nuevo se suma suelto
  // al censo de nueve `setTimeout` de FRZ-1 §1.3.
  const relojToast = useRef(null)

  // ── La jaula de 1126px, exceptuada con alcance ────────────────────────────
  // Molde de `Lobby.jsx` y `Portada.jsx`: la clase vive en el <body> mientras la
  // pantalla vive, y `salas.css` declara la excepción con especificidad en vez
  // de con `!important`.
  useEffect(() => {
    document.body.classList.add('sal-activa')
    return () => { document.body.classList.remove('sal-activa') }
  }, [])

  useEffect(() => () => clearTimeout(relojToast.current), [])

  // El toast guarda una CLAVE DE TEXTO, no un código de error: por él pasan las
  // dos cosas —el fallo de unirse por tarjeta y el «Pronto» de los tres
  // controles de la barra— y hacerle distinguir cuál es cuál al pintar sería
  // reintroducir en la vista una decisión que `claveDeError` ya tomó.
  const avisar = useCallback((claveTexto) => {
    setToast(claveTexto)
    clearTimeout(relojToast.current)
    relojToast.current = setTimeout(() => setToast(null), 2600)
  }, [])

  // ── El listado ────────────────────────────────────────────────────────────
  // Una lectura al montar, y al volver a la pantalla es otra vez montar. SIN
  // suscripción: B2 decidirá si esta lista se suscribe (§3.3).
  //
  // El fallo de la lectura NO grita. Si `salas_abiertas()` falla, la caja se
  // queda en su estado vacío —que ya dice «nadie está armando mesa ahora»— en
  // vez de pintar un error rojo sobre una pantalla en la que el jugador todavía
  // puede pegar un código y armar la suya. Un error de fondo no debe secuestrar
  // dos caminos que siguen funcionando.
  const releerMesas = useCallback(() => {
    let vivo = true
    api.salasAbiertas().then(({ data }) => {
      if (vivo) setFilas(data ?? [])
    })
    return () => { vivo = false }
  }, [api])

  useEffect(() => releerMesas(), [releerMesas])

  // ── Entrar por código ─────────────────────────────────────────────────────
  // El camino del BOTÓN. El del enlace (§5.2) está abajo, en su efecto, y no
  // pasa por aquí: la razón está explicada allí.
  const entrar = async (texto) => {
    const codigo = normalizarCodigo(texto)
    if (codigo === null) {
      setErrorCodigo('codigo_invalido')
      campoRef.current?.focus()
      return
    }

    setOcupado(true)
    const { data, error } = await api.unirseSala({ codigo })
    setOcupado(false)

    if (error) {
      // El código SE CONSERVA y el campo recupera el foco (§3.2). Borrarlo
      // obligaría a reteclear cuatro caracteres por un fallo que puede ser del
      // otro lado —una mesa que arrancó mientras se escribía—, y ésa es la clase
      // de castigo que hace que la gente deje de intentarlo.
      setErrorCodigo(error)
      campoRef.current?.focus()
      // ECO-1b · el servidor sabe un saldo más bajo que el que enseñamos: se
      // vuelve a leer la billetera para que la píldora diga lo mismo que él.
      if (error === 'saldo_insuficiente') alSaldoInsuficiente?.()
      return
    }
    onEntrarSala?.(data)
  }

  // ── §5.2 · El intento automático, UNA sola vez ────────────────────────────
  // `intentar` lo enciende `App` cuando el arranque de la sesión ya comprobó que
  // no hay mesa en espera (A1 §2.5) y ya consumió el código del almacenamiento
  // (A1 §4.1). Puede llegar encendido en el montaje o encenderse un instante
  // después —la respuesta de `mi_sala()` tarda lo que tarda la red— y el efecto
  // sirve a los dos casos: corre cuando cambia y la guardia decide.
  //
  // El `ref` de guardia no es paranoia: en desarrollo React monta, desmonta y
  // vuelve a montar cada componente (StrictMode), y además `onEntrarSala` es
  // una función nueva en cada render de `App`, así que este efecto vuelve a
  // correr más de una vez. Sin la guardia, un código de invitación gastaría dos
  // de los cinco intentos por minuto que la base concede, y el jugador llegaría
  // a su tercera prueba manual ya castigado.
  //
  // ── POR QUÉ ESTE EFECTO NO LLEVA BANDERA `vivo` ──────────────────────────
  // La llevaba, y era un agujero: cualquier re-render de `App` con la RPC en
  // vuelo —el propio `intentar` encendiéndose, un cambio de sesión— cambiaba las
  // dependencias, corría la limpieza, y la respuesta se tiraba sin que nadie la
  // viera. Lo que sí hace falta es no tocar el estado de una pantalla que ya se
  // desmontó, y para eso está `montado`, que sólo cambia al desmontar de verdad
  // (y vuelve a `true` en el remontaje de StrictMode, que no es uno de verdad).
  //
  // ── POR QUÉ NO LLAMA A `entrar` Y REPITE SUS CUATRO LÍNEAS ────────────────
  // Porque `entrar` empieza poniendo `ocupado` a `true`, y llamarla desde el
  // cuerpo de un efecto sería un `setState` SÍNCRONO dentro del efecto — lo que
  // `react-hooks/set-state-in-effect` prohíbe con razón: encadena un render
  // extra antes de que el primero haya terminado de pintarse.
  //
  // Aquí el efecto hace lo que la regla SÍ describe como correcto: arranca una
  // operación en un sistema externo —la RPC— y toca el estado sólo en su
  // respuesta. Y de paso `ocupado` no se enciende, que es lo honesto: en el
  // montaje no hay ningún botón que deshabilitar todavía.
  const yaIntentado = useRef(false)
  const montado = useRef(true)
  useEffect(() => {
    montado.current = true
    return () => { montado.current = false }
  }, [])
  useEffect(() => {
    if (!intentar || yaIntentado.current) return
    const codigo = normalizarCodigo(codigoInicial)
    if (codigo === null) return
    yaIntentado.current = true

    api.unirseSala({ codigo }).then(({ data, error }) => {
      if (!montado.current) return
      if (error) {
        setErrorCodigo(error)
        campoRef.current?.focus()
        if (error === 'saldo_insuficiente') alSaldoInsuficiente?.()
        return
      }
      onEntrarSala?.(data)
    })
  }, [intentar, codigoInicial, api, onEntrarSala, alSaldoInsuficiente])

  const alTeclear = (e) => {
    setCuerpo(filtrarCodigo(e.target.value))
    setErrorCodigo(null)
  }

  const unirmeA = async (mesa) => {
    setOcupado(true)
    const { data, error } = await api.unirseSala({ salaId: mesa.id })
    setOcupado(false)
    if (error) {
      avisar(claveDeError(error))
      releerMesas()
      if (error === 'saldo_insuficiente') alSaldoInsuficiente?.()
      return
    }
    onEntrarSala?.(data)
  }

  // IOS-1 1e · la zona anclada, igual que en `PantallaChips` (esta pantalla
  // repite su marcado a mano): el cuerpo desplaza por dentro si no cabe, el
  // botón queda al pie con su nota ENCIMA, la casa sube a la cabecera y el aviso
  // flotante vive en la zona, apoyado encima de ella.
  const cuerpoRef = useRef(null)
  useDesborde(cuerpoRef)

  return (
    <main className="sal es-anclada">
      <div className="sal-fondo" aria-hidden="true" />

      <BarraSuperior
        usuario={cuenta?.username ?? ''}
        saldo={saldo}
        estadoSaldo={billetera?.estado}
        recordado={billetera?.recordado ?? null}
        cobrando={billetera?.pendiente === true}
        onPerfil={() => avisar('lob.toast.pronto')}
        onAjustes={() => avisar('lob.toast.pronto')}
      />

      <div className="sal-cab">
        {/* La flecha vuelve al lobby, que es de donde se llega. En esta pantalla
            coincide con la casa —las dos van al mismo sitio— y aun así están las
            dos, porque la lámina las selló y porque en `ArmarMesa` dejan de
            coincidir: allí la flecha deshace un paso y la casa salta al lobby. */}
        <button
          type="button"
          className="sal-volver"
          data-accion="volver"
          aria-label={t('sal.volver.aria')}
          onClick={() => onLobby?.()}
        >
          <IconoVolver />
        </button>
        <h1>{t('sal.opciones.titulo')}</h1>
        <button
          type="button"
          className="sal-casa"
          data-accion="casa"
          aria-label={t('sal.casa.aria')}
          onClick={() => onLobby?.()}
        >
          <IconoCasa />
        </button>
      </div>

      <div ref={cuerpoRef} className="sal-cuerpo">

        {/* ── Bloque 1 · ¿Te invitaron? ──────────────────────────────────── */}
        <section className="sal-bloque">
          <h2>{t('sal.opciones.codigo.titulo')}</h2>
          <div className="sal-codigo">
            <label className="sal-campo">
              <span className="sal-pre" aria-hidden="true">AJ-</span>
              <input
                ref={campoRef}
                value={cuerpo}
                onChange={alTeclear}
                onKeyDown={(e) => { if (e.key === 'Enter' && codigoListo(cuerpo)) entrar(cuerpo) }}
                maxLength={LARGO_CODIGO}
                autoComplete="off"
                autoCapitalize="characters"
                spellCheck="false"
                placeholder="____"
                data-accion="codigo"
                aria-label={t('sal.opciones.codigo.aria')}
                aria-invalid={errorCodigo ? 'true' : undefined}
              />
            </label>
            <button
              type="button"
              className="sal-entrar"
              data-accion="entrar"
              disabled={!codigoListo(cuerpo) || ocupado}
              onClick={() => entrar(cuerpo)}
            >
              {t('sal.opciones.codigo.entrar')}
            </button>
          </div>
          {/* O1 · la caja del aviso está SIEMPRE, ocupando su alto; lo que
              cambia es su visibilidad. Sin esto, equivocarse de código empujaría
              el listado hacia abajo en el momento exacto en que el jugador mira
              el campo. `role="alert"` lo anuncia sin que haya que mover el foco
              a un párrafo. */}
          <p className={`sal-aviso-error${errorCodigo ? ' is-on' : ''}`} role="alert">
            {errorCodigo ? t(claveDeError(errorCodigo)) : ' '}
          </p>
        </section>

        {/* ── Bloque 2 · Mesas formándose ahora ──────────────────────────── */}
        <section className="sal-bloque">
          <h2>{t('sal.opciones.mesas.titulo')}</h2>
          {/* `es-vacia` no es cosmetica: hace que la caja punteada ocupe la
              ventanilla entera en vez de encogerse a su texto, y con ella que la
              pantalla mida lo mismo haya mesas o no. El porque esta en la hoja. */}
          <div className={`sal-lista${mesas.length === 0 ? ' es-vacia' : ''}`} data-accion="lista">
            {mesas.length === 0 ? (
              <div className="sal-vacio">
                {t('sal.opciones.mesas.vacio')}
                <small>{t('sal.opciones.mesas.vacio.sub')}</small>
              </div>
            ) : (
              mesas.map((mesa) => {
                const aMiAlcance = alcanza(mesa.apuesta, juicio)
                return (
                  <div
                    key={mesa.id}
                    className={`sal-mesa${aMiAlcance ? '' : ' is-fuera'}`}
                    data-accion="mesa"
                  >
                    {/* Las sillas dicen de un vistazo lo que el `x/N` dice con
                        cifras. `aria-hidden` porque son redundantes para quien
                        escucha: la línea 2 ya lo lee en palabras. */}
                    <div className="sal-sillas" aria-hidden="true">
                      {Array.from({ length: mesa.jugadores }, (_, i) => (
                        <span key={i} className={`sal-silla${i < mesa.sentados ? ' is-ocupada' : ''}`} />
                      ))}
                    </div>
                    <div className="sal-mesa-info">
                      <div className="sal-mesa-l1">
                        {t('sal.opciones.mesa.de', { n: mesa.jugadores })}
                        {' · '}
                        <b>{t('sal.opciones.mesa.apuesta', { hc: montoTexto(mesa.apuesta) })}</b>
                      </div>
                      {/* Fuera de alcance, la línea 2 dice lo que falta EN VEZ
                          del recuento. Decisión de Victor (7-sep-2026) sobre la
                          contradicción lámina/ficha: manda la lámina, y el botón
                          se queda apagado en su sitio para que la tarjeta siga
                          midiendo lo mismo que las demás. */}
                      <div className="sal-mesa-l2">
                        {aMiAlcance
                          ? t('sal.opciones.mesa.estado', { x: mesa.sentados, n: mesa.jugadores })
                          : t('sal.opciones.mesa.faltan', { hc: montoTexto(faltanPara(mesa.apuesta, juicio)) })}
                      </div>
                    </div>
                    <button
                      type="button"
                      className="sal-unir"
                      data-accion="unirme"
                      disabled={!aMiAlcance || ocupado}
                      onClick={() => unirmeA(mesa)}
                    >
                      {t('sal.opciones.mesa.unirme')}
                    </button>
                  </div>
                )
              })
            )}
          </div>
        </section>

        {/* ── Bloque 3 · Armar una mesa ──────────────────────────────────── */}
        {/* SIEMPRE vivo (§3.4): no depende del saldo ni del listado. Quien no
            alcanza ninguna apuesta se encontrará los chips apagados en la
            pantalla siguiente, que es donde ese hecho se explica con cifras. */}
        <section className="sal-bloque sal-accion">
          <CajaAccion caja={cajaDeAccion({ aviso: t('sal.opciones.armar.nota') })} />
          <button
            type="button"
            className="sal-cta es-opciones"
            data-accion="armar"
            onClick={() => onArmarMesa?.()}
          >
            {t('sal.opciones.armar')}
          </button>
          {/* El toast recoge lo que no cabe bajo el campo de código: el error de
              unirse por tarjeta y los tres controles de la barra, que todavía no
              llevan a ninguna parte. `role="status"` lo anuncia sin robar el
              foco. La caja se reserva siempre y sólo se apaga con `visibility`
              (O1). IOS-1 1e · vive en la zona y sale apoyado encima de ella. */}
          <div className={`sal-toast${toast !== null ? ' is-on' : ''}`} role="status" aria-live="polite">
            {toast !== null ? t(toast) : ' '}
          </div>
        </section>

      </div>
    </main>
  )
}

// El código llega canónico (`AJ-7K2M`) y el campo sólo enseña el cuerpo.
function cuerpoDe(codigo) {
  const canonico = normalizarCodigo(codigo)
  return canonico === null ? '' : canonico.slice(3)
}
