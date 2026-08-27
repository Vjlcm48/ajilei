import { useState, useEffect, useRef, useCallback } from 'react'
import '../styles/puerta.css'
import '../styles/entrada.css'
import { Wordmark } from '../components/Wordmark'

// ── SUP-2b · Pantalla Entrada ───────────────────────────────────────────────
// Documento rector: docs/AJILEI_SUP-2b_Puerta_v1.0.md §1.3.
//
// UNA pantalla con DOS pasos, no dos pantallas. Entrar y registrarse son el
// mismo gesto —`shouldCreateUser: true` en el hook—, así que pedir el correo y
// pedir el código son dos momentos de la misma conversación: el rótulo no se
// remonta, la tarjeta no se recompone, sólo cambia lo que hay dentro.
//
// El componente NO SABE de Supabase. Recibe dos funciones que devuelven
// `{ ok, mensaje }` y no conoce ni un código de error ni un nombre de tabla:
// toda la traducción vive en useAuth. Es lo que permite montar esta pantalla en
// un arnés sin red, y es la misma frontera que separa TapetesPanel de useTapetes.

// Segundos de espera antes de poder pedir otro código. Es el límite de reenvío
// del propio Supabase (§1.3): un contador más corto sólo serviría para que el
// jugador se coma un 429.
const ESPERA_REENVIO = 60

export default function Entrada({ onEnviarCodigo, onVerificar }) {
  const [paso, setPaso] = useState('correo')   // 'correo' | 'codigo'
  const [correo, setCorreo] = useState('')
  const [codigo, setCodigo] = useState('')
  const [ocupado, setOcupado] = useState(false)
  const [aviso, setAviso] = useState(null)     // null | { texto, tipo: 'error' | 'info' }
  const [restante, setRestante] = useState(0)
  const campoCodigo = useRef(null)

  // La cuenta regresiva se apoya en un intervalo de 1 s y no en un `Date.now()`
  // acumulado porque su único trabajo es apagar un enlace: un desfase de medio
  // segundo tras una pestaña en segundo plano no le hace daño a nadie, y el
  // límite de verdad —el que devuelve 429— lo impone el servidor, no esto.
  useEffect(() => {
    if (restante <= 0) return
    const id = setInterval(() => setRestante(n => (n > 0 ? n - 1 : 0)), 1000)
    return () => clearInterval(id)
  }, [restante])

  // Foco al llegar al paso del código: el dato que se espera es ése y el jugador
  // viene de su bandeja de correo con seis dígitos en la cabeza.
  useEffect(() => {
    if (paso === 'codigo') campoCodigo.current?.focus()
  }, [paso])

  // Envío del código — sirve al primer envío Y al reenvío. `ocupado` es la única
  // guarda contra el doble envío: el botón se deshabilita, pero un Enter repetido
  // llega antes de que React vuelva a pintar.
  const pedirCodigo = useCallback(async () => {
    if (ocupado) return
    const limpio = correo.trim()
    if (!limpio) { setAviso({ texto: 'Escribe tu correo', tipo: 'error' }); return }
    setOcupado(true)
    setAviso(null)
    const r = await onEnviarCodigo(limpio)
    setOcupado(false)
    if (!r.ok) { setAviso({ texto: r.mensaje, tipo: 'error' }); return }
    setCorreo(limpio)
    setCodigo('')
    setRestante(ESPERA_REENVIO)
    setPaso('codigo')
  }, [correo, ocupado, onEnviarCodigo])

  const verificar = useCallback(async () => {
    if (ocupado) return
    if (codigo.length !== 6) { setAviso({ texto: 'El código tiene 6 dígitos', tipo: 'error' }); return }
    setOcupado(true)
    setAviso(null)
    const r = await onVerificar(correo, codigo)
    // Si sale bien NO se toca el estado: la sesión cambia, useAuth lo recoge por
    // su suscripción y esta pantalla se desmonta entera. Apagar `ocupado` aquí
    // sería escribir en un componente que está a un fotograma de no existir.
    if (r.ok) return
    setOcupado(false)
    setAviso({ texto: r.mensaje, tipo: 'error' })
  }, [codigo, correo, ocupado, onVerificar])

  const volverAlCorreo = () => {
    setPaso('correo')
    setCodigo('')
    setRestante(0)
    setAviso(null)
  }

  const enPaso1 = paso === 'correo'

  return (
    <main className="puerta-screen entrada-screen">
      <section className="puerta-card entrada-card">
        {/* El rótulo es el MISMO objeto que el de la Bienvenida: misma clase,
            mismo tamaño, misma traza y el resplandor de EMB-1 que cuelga de
            `h1.welcome-title` sin gate alguno. El `aria-label` no es adorno —sin
            él la marca se leería "ILEI", que es la trampa que IDN-1 documentó. */}
        <h1 className="welcome-title" aria-label="AJILEI"><Wordmark /></h1>

        {/* Cuerpo de alto RESERVADO: los dos pasos comparten la caja más alta,
            así que pasar de uno a otro no mueve la tarjeta ni un píxel. Es la
            aplicación de O1 al único sitio de esta pantalla donde el contenido
            cambia de tamaño. La cifra está MEDIDA sobre el paso más alto —el del
            código, con sus dos enlaces— y no estimada. */}
        <div className="entrada-cuerpo">
          {enPaso1 ? (
            <form onSubmit={(e) => { e.preventDefault(); pedirCodigo() }}>
              <p className="puerta-lema">
                Entra con tu correo. Te enviamos un código de 6 dígitos —
                no hace falta contraseña.
              </p>
              <label className="entrada-etiqueta" htmlFor="entrada-correo">Correo</label>
              <input
                id="entrada-correo"
                className={`puerta-campo${aviso?.tipo === 'error' ? ' is-error' : ''}`}
                type="email"
                inputMode="email"
                autoComplete="email"
                autoCapitalize="none"
                spellCheck="false"
                placeholder="tucorreo@ejemplo.com"
                value={correo}
                onChange={(e) => { setCorreo(e.target.value); if (aviso) setAviso(null) }}
                disabled={ocupado}
              />
              <p className={`puerta-aviso${aviso?.tipo === 'info' ? ' is-info' : ''}`} role="status">
                {aviso?.texto ?? ''}
              </p>
              <button type="submit" className="puerta-btn" disabled={ocupado}>
                {ocupado ? 'Enviando…' : 'Enviar código'}
              </button>
              {/* SUP-3 · el hueco de Google. Se deja dicho y no se construye:
                  un botón muerto es peor que ninguno, así que aquí sólo hay la
                  nota de que llega, con el aire ya repartido. */}
              <p className="entrada-proximamente">Entrar con Google, próximamente</p>
            </form>
          ) : (
            <form onSubmit={(e) => { e.preventDefault(); verificar() }}>
              <p className="puerta-lema">
                Te enviamos un código a<br />
                <span className="entrada-correo-eco">{correo}</span>
              </p>
              <label className="entrada-etiqueta" htmlFor="entrada-codigo">Código</label>
              <input
                id="entrada-codigo"
                ref={campoCodigo}
                className={`puerta-campo puerta-campo-codigo${aviso?.tipo === 'error' ? ' is-error' : ''}`}
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                placeholder="······"
                value={codigo}
                // Se filtra a dígitos en la ENTRADA y no al enviar: así el campo
                // nunca muestra un carácter que después va a desaparecer, que es
                // la clase de sorpresa que hace dudar de si el código se pegó bien.
                onChange={(e) => {
                  setCodigo(e.target.value.replace(/\D/g, '').slice(0, 6))
                  if (aviso) setAviso(null)
                }}
                disabled={ocupado}
              />
              <p className={`puerta-aviso${aviso?.tipo === 'info' ? ' is-info' : ''}`} role="status">
                {aviso?.texto ?? ''}
              </p>
              <button type="submit" className="puerta-btn" disabled={ocupado || codigo.length !== 6}>
                {ocupado ? 'Entrando…' : 'Entrar'}
              </button>
              <div className="puerta-links">
                <button
                  type="button"
                  className="puerta-link"
                  onClick={pedirCodigo}
                  disabled={ocupado || restante > 0}
                >
                  {/* La cuenta regresiva vive en una caja de ancho RESERVADO: sin
                      ella, al llegar a cero el rótulo encogería y arrastraría a
                      "Cambiar correo" hacia la izquierda. O1 también manda en un
                      enlace de 0,82 rem. */}
                  Reenviar código
                  {/* El espacio va FUERA de la caja reservada, como `{' '}`. Dentro no
                      vale: un blanco al principio del contenido de un
                      `inline-block` lo colapsa el navegador y el rotulo salia
                      pegado: "Reenviar codigo(60 s)". Se descarto el espacio
                      duro literal porque eslint lo prohibe con razon
                      (`no-irregular-whitespace`): en el editor es
                      indistinguible de uno normal. */}
                  {' '}
                  <span className="entrada-cuenta">{restante > 0 ? `(${restante} s)` : ''}</span>
                </button>
                <button type="button" className="puerta-link" onClick={volverAlCorreo} disabled={ocupado}>
                  Cambiar correo
                </button>
              </div>
            </form>
          )}
        </div>
      </section>
    </main>
  )
}
