import { useState, useEffect, useRef, useCallback } from 'react'
import { LEMA_ENTRADA } from '../config/textosPuerta'
// BIE-1 · Los cuatro botones del formulario suenan con el clic de la casa.
// `SoundButton` pinta el MISMO `<button>` con las mismas props —`type`,
// `disabled`, clase—, así que la caja no cambia. Y el envío con Enter dentro de
// un campo suena UNA vez: el envío implícito del formulario es un clic en su
// botón de envío, y ese clic es el único que dispara el sonido (`onSubmit` no
// suena). Con el botón deshabilitado no hay envío implícito, ni clic.
import { SoundButton } from './SoundButton'

// ── PUE-2.2 · El formulario de la puerta, extraído ──────────────────────────
// Documento rector: AJILEI_PUE_Fase1_v1.0 §2.2 — «el formulario no se reescribe:
// se reubica».
//
// ESTE ARCHIVO NO ES CÓDIGO NUEVO. Es, línea por línea, el cuerpo de
// `screens/Entrada.jsx` tal como SUP-2b lo dejó: los mismos dos pasos, el mismo
// `ESPERA_REENVIO` de 60 s, el mismo filtrado a dígitos en la ENTRADA, el mismo
// `ocupado` como única guarda contra el doble envío, las mismas cajas de alto y
// ancho reservados de O1 y las mismas notas de por qué cada cosa está donde
// está. Lo único que cambia es que ahora vive en un componente propio, para que
// la Portada y la Entrada no acaben con dos formularios que se van separando a
// la tercera calibración de Victor.
//
// LA FRONTERA SIGUE INTACTA: esto no sabe de Supabase. Recibe dos funciones que
// devuelven `{ ok, mensaje }` y no conoce ni un código de error ni un nombre de
// tabla. Es lo que permite montarlo en un arnés sin red.
//
// LO ÚNICO PARAMETRIZADO ES EL LEMA, porque es lo único que Victor selló
// distinto en la portada: allí dice «Te enviaremos… fácil, sin contraseñas» y en
// la Entrada «Te enviamos… no hace falta contraseña». Un `prop`, no una copia;
// los dos textos viven en `config/textosPuerta.js`.

// Segundos de espera antes de poder pedir otro código. Es el límite de reenvío
// del propio Supabase (§1.3): un contador más corto sólo serviría para que el
// jugador se coma un 429.
const ESPERA_REENVIO = 60

export default function FormularioPuerta({ onEnviarCodigo, onVerificar, lema = LEMA_ENTRADA }) {
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
    /* Cuerpo de alto RESERVADO: los dos pasos comparten la caja más alta, así
       que pasar de uno a otro no mueve la tarjeta ni un píxel. Es la aplicación
       de O1 al único sitio de esta pantalla donde el contenido cambia de
       tamaño. La cifra está MEDIDA, y para la portada se RE-MIDIÓ: su tarjeta
       no tiene la misma caja que la de la Entrada. Ver entrada.css. */
    <div className="entrada-cuerpo">
      {enPaso1 ? (
        <form onSubmit={(e) => { e.preventDefault(); pedirCodigo() }}>
          <p className="puerta-lema">{lema}</p>
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
          <SoundButton type="submit" className="puerta-btn" disabled={ocupado}>
            {ocupado ? 'Enviando…' : 'Enviar código'}
          </SoundButton>
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
          <SoundButton type="submit" className="puerta-btn" disabled={ocupado || codigo.length !== 6}>
            {ocupado ? 'Entrando…' : 'Entrar'}
          </SoundButton>
          <div className="puerta-links">
            <SoundButton
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
            </SoundButton>
            <SoundButton type="button" className="puerta-link" onClick={volverAlCorreo} disabled={ocupado}>
              Cambiar correo
            </SoundButton>
          </div>
        </form>
      )}
    </div>
  )
}
