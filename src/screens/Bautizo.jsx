import { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import '../styles/puerta.css'
import '../styles/eliminarCuenta.css'
import '../styles/bautizo.css'
import { Wordmark } from '../components/Wordmark'
import { nombreLimpio, nombreValido, avisoDelNombre, AVISO_NOMBRE, PAUSA_AVISO_MS } from './bautizoCore'
import { useIdioma } from '../hooks/useIdioma'
import { fechaCorta } from '../lib/perfilApi'
// BIE-1 · Los tres botones del Bautizo suenan con el clic, como el resto de la
// puerta (D1: suenan los botones, no los huecos). `SoundButton` trae su propio
// `useSounds`; esta pantalla no necesita ningún otro sonido.
import { SoundButton } from '../components/SoundButton'

// ── SUP-2b · Pantalla Bautizo ───────────────────────────────────────────────
// Documento rector: docs/AJILEI_SUP-2b_Puerta_v1.0.md §1.4 (elegir nombre) y
// §1.5 (el mismo componente en modo edición, desde el ⋮).
//
// UN SOLO PROPÓSITO y dos vestidos. En `modo="bautizo"` es una pantalla entera
// —el jugador tiene sesión y todavía no tiene nombre, no hay nada más que hacer
// en la app—; en `modo="edicion"` es un modal sobre la mesa. Lo que NO cambia
// entre los dos es el fondo del asunto: el mismo campo, la misma regla, el mismo
// intento contra la base y la misma traducción de sus tres códigos. El §1.5 pide
// literalmente "la misma pantalla en modo edición", y esto lo cumple compartiendo
// el código en vez de pareciéndose a él.
//
// ── LA AUTORIDAD ES LA BASE ────────────────────────────────────────────────
// Aquí no se valida nada más allá de largo y charset, y eso sólo para encender o
// apagar el botón mientras se teclea (§1.4). Los vedados no se consultan, no se
// copia la lista, no se adivina: se intenta el insert/update y se traduce lo que
// responda. Duplicar la regla en el cliente era garantizar dos verdades — y la
// del cliente sería la que se queda vieja.
//
// ── IOS-1c · el nombre recortado y el aviso (lámina `laminas/ios1c`, f2) ────
// Se juzga y se envía el nombre SIN los espacios del principio y del final, y
// el campo se limpia solo al salir de él o tras 1,2 s sin teclear. La línea fija
// de la regla se quita: el aviso «De 6 a 15 letras, números o _, sin espacios»
// sale en la ranura de avisos SÓLO cuando el nombre no vale (`bautizoCore.js`).
//
// ── CFG-1 1b · el modo edición, con el freno de 30 días ─────────────────────
// Rector: AJILEI_CFG-1_Fase1b_v1.0.md §0-6, §0-9, §0-12 y §2.4 (R-7). TODO lo
// de aquí abajo es SOLO del modo edición: la puerta de entrada no cambia ni de
// aspecto ni de comportamiento.
//   · `bloqueadoHasta` (Date): el freno está puesto. El campo se queda quieto
//     con el nombre, la ranura dice desde qué día se puede y «Cancelar» pasa a
//     «Cerrar». También entra así si el servidor frena al confirmar (AJ030).
//   · `onComprobar(nombre)` → `{ libre }`: antes de enviar se pregunta a
//     `nombre_libre`. Si dice que sí (o no se sabe), sale la ventana de los 30
//     días y solo «Cambiar» envía. Si dice que no, se envía sin ventana: el
//     servidor contesta 23505 o P0001 y la ranura lo dice con su texto; el
//     freno no se gasta porque el cambio no entra. Solo mayúsculas
//     («devlocal» → «DevLocal») no gasta el freno (§0-6): va sin ventana.
//   · Intro confirma (`enterKeyHint="go"`), la tarjeta es opaca, en el
//     teléfono va arriba (el teclado no la tapa) y «Cancelar» y «Cerrar» tienen
//     zona de 44 (`bautizo.css`). El rótulo del campo dice «Nombre de usuario»,
//     como la fila del perfil que lo abre.
//
// La ventana es la familia de «Eliminar cuenta» (`elc-*`) sin el rojo, en
// `body` y por encima del velo de esta tarjeta.

function ConfirmarNombre({ nombre, onCambiar, onCancelar, t }) {
  const cancelar = useRef(null)
  useEffect(() => { cancelar.current?.focus() }, [])
  return createPortal(
    <div className="elc-velo cfn-velo" onClick={(e) => { if (e.target === e.currentTarget) onCancelar() }}>
      <div className="elc-tarjeta cfn-tarjeta" role="alertdialog" aria-modal="true" aria-labelledby="cfn-t" aria-describedby="cfn-d">
        <h2 id="cfn-t" className="elc-titulo cfn-titulo">
          {t('perfil.nombre.aviso.titulo', { nombre: '{nombre}' }).split('{nombre}').flatMap((x, i) => (i ? [<b key={i}>{nombre}</b>, x] : [x]))}
        </h2>
        <div className="elc-aviso" id="cfn-d">
          <p>{t('perfil.nombre.aviso.texto')}</p>
        </div>
        <div className="elc-botones">
          <SoundButton ref={cancelar} type="button" className="elc-btn elc-cancelar" data-accion="cfn-cancelar" onClick={onCancelar}>
            {t('perfil.nombre.cancelar')}
          </SoundButton>
          <SoundButton type="button" className="elc-btn cfn-cambiar" data-accion="cfn-cambiar" onClick={onCambiar}>
            {t('perfil.nombre.aviso.cambiar')}
          </SoundButton>
        </div>
      </div>
    </div>,
    document.body,
  )
}

export default function Bautizo({
  modo = 'bautizo', actual = '', onConfirmar, onCancelar, onCerrarSesion,
  bloqueadoHasta = null, onComprobar,
}) {
  const { t } = useIdioma()
  const [nombre, setNombre] = useState(actual)
  const [ocupado, setOcupado] = useState(false)
  const [error, setError] = useState(null)
  // IOS-1c · el jugador dejó de escribir (1,2 s) o salió del campo.
  const [pausado, setPausado] = useState(false)
  // CFG-1 1b · el nombre que espera «Cambiar» en la ventana, y el freno que el
  // servidor puso al confirmar (gana al de la prop, que puede llegar tarde).
  const [ventana, setVentana] = useState(null)
  const [frenado, setFrenado] = useState(null)
  const campo = useRef(null)
  const edicion = modo === 'edicion'
  const hasta = edicion ? (frenado ?? (bloqueadoHasta instanceof Date ? bloqueadoHasta : null)) : null
  const bloqueado = hasta !== null

  useEffect(() => { campo.current?.focus() }, [])

  // Esc cancela, pero SÓLO en edición: en el bautizo no hay nada que cancelar
  // —sin nombre no se juega— y una tecla que no hace nada es mejor que una que
  // parece cerrar y deja al jugador en la misma pantalla.
  // CFG-1 1b · con la ventana abierta, Esc la cierra a ella y nada más.
  useEffect(() => {
    if (!edicion || !onCancelar) return
    const onKey = (e) => {
      if (e.key !== 'Escape') return
      if (ventana !== null) { e.stopPropagation(); setVentana(null); return }
      onCancelar()
    }
    document.addEventListener('keydown', onKey, true)
    return () => document.removeEventListener('keydown', onKey, true)
  }, [edicion, onCancelar, ventana])

  const limpio = nombreLimpio(nombre)
  const valido = nombreValido(nombre)
  // En edición, confirmar el mismo nombre es un viaje de red para no cambiar
  // nada — y la base lo devolvería con 23505 contra el propio jugador.
  const sinCambio = edicion && limpio === actual
  const aviso = avisoDelNombre(nombre, { pausado })

  // IOS-1c · la pausa: 1,2 s sin teclear limpian el campo y dejan hablar al
  // aviso de «corto». La escritura vive en el callback del reloj, no en el
  // cuerpo del efecto.
  useEffect(() => {
    if (pausado) return
    const id = setTimeout(() => {
      setPausado(true)
      setNombre((n) => nombreLimpio(n))
    }, PAUSA_AVISO_MS)
    return () => clearTimeout(id)
  }, [nombre, pausado])

  const enviar = useCallback(async (valor) => {
    setOcupado(true)
    setError(null)
    const r = await onConfirmar(valor)
    if (r.ok) {
      // En bautizo el componente se desmonta al pasar a COMPLETO; en edición lo
      // cierra quien lo abrió. En ninguno de los dos casos hay que apagar
      // `ocupado`: escribir en un componente que ya no está es exactamente el
      // aviso que React da y que nadie lee.
      if (edicion && onCancelar) onCancelar()
      return
    }
    setOcupado(false)
    // CFG-1 1b · el servidor frenó (AJ030): la tarjeta pasa a bloqueada.
    if (edicion && r.bloqueadoHasta instanceof Date) {
      setFrenado(r.bloqueadoHasta)
      setNombre(actual)
      return
    }
    setError(r.mensaje)
  }, [edicion, actual, onConfirmar, onCancelar])

  const confirmar = useCallback(async () => {
    if (ocupado || bloqueado) return
    // CFG-1 1b · un nombre de verdad nuevo pregunta primero (§0-9).
    if (edicion && onComprobar && limpio.toLowerCase() !== actual.toLowerCase()) {
      setOcupado(true)
      setError(null)
      const { libre } = await onComprobar(limpio)
      if (libre !== false) {
        setOcupado(false)
        setVentana(limpio)
        return
      }
    }
    enviar(limpio)
  }, [limpio, ocupado, bloqueado, edicion, actual, onComprobar, enviar])

  const cuerpo = (
    <section className={`puerta-card bautizo-card${edicion ? ' is-edicion' : ''}`}>
      {edicion ? (
        <h2 className="bautizo-titulo">Cambiar nombre</h2>
      ) : (
        <h1 className="welcome-title" aria-label="AJILEI"><Wordmark /></h1>
      )}

      <form onSubmit={(e) => { e.preventDefault(); confirmar() }}>
        {!edicion && (
          <p className="puerta-lema">
            Ya casi. Elige el nombre con el que te van a ver en la mesa.
          </p>
        )}

        <label className="bautizo-etiqueta" htmlFor="bautizo-nombre">
          {edicion ? t('perfil.fila.nombre') : 'Nombre de jugador'}
        </label>
        <input
          id="bautizo-nombre"
          ref={campo}
          className={`puerta-campo${error ? ' is-error' : ''}`}
          type="text"
          autoComplete="off"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck="false"
          maxLength={15}
          placeholder="tunombre"
          enterKeyHint={edicion ? 'go' : undefined}
          value={nombre}
          onChange={(e) => { setNombre(e.target.value); setPausado(false); if (error) setError(null) }}
          onBlur={() => { setPausado(true); setNombre((n) => nombreLimpio(n)) }}
          disabled={ocupado || bloqueado}
        />

        {/* IOS-1c · la línea fija de la regla (§1.4) se quitó (lámina f2): la
            regla sale en la ranura de avisos sólo cuando el nombre no vale. El
            error de la base, si lo hay, manda. La ranura tiene alto mínimo
            (`puerta.css`), así que aparecer no mueve el botón. */}
        {bloqueado ? (
          <p className="puerta-aviso is-info" role="status" data-accion="aviso-nombre">
            {t('perfil.nombre.bloqueado', { fecha: fechaCorta(hasta) })}
          </p>
        ) : (
          <p className="puerta-aviso" role="status" data-accion="aviso-nombre">{error ?? (aviso ? AVISO_NOMBRE : '')}</p>
        )}

        <SoundButton type="submit" className="puerta-btn" disabled={ocupado || bloqueado || !valido || sinCambio}>
          {ocupado ? 'Guardando…' : 'Confirmar'}
        </SoundButton>

        <div className="puerta-links">
          {edicion ? (
            <SoundButton type="button" className="puerta-link" data-accion="bautizo-cancelar" onClick={onCancelar} disabled={ocupado}>
              {bloqueado ? t('perfil.nombre.cerrar') : t('perfil.nombre.cancelar')}
            </SoundButton>
          ) : (
            // SIN ESTO EL BAUTIZO ES UNA TRAMPA. Un jugador con sesión y sin
            // perfil no tiene ninguna otra pantalla a la que ir: si entró con el
            // correo equivocado, sin esta salida sólo le queda borrar el
            // almacenamiento del navegador. No lo pide el rector; lo pide la
            // pantalla en cuanto se mira de frente.
            onCerrarSesion && (
              <SoundButton type="button" className="puerta-link" onClick={onCerrarSesion} disabled={ocupado}>
                Cerrar sesión
              </SoundButton>
            )
          )}
        </div>
      </form>
    </section>
  )

  if (edicion) {
    // Clic en el velo cierra; clic dentro de la tarjeta no. Mismo `stopPropagation`
    // que la confirmación de abandonar mesa (GameTable), que es el modal que ya
    // existía en la casa.
    // CFG-1 1b · la ventana va FUERA del velo: es un portal, pero en React los
    // clics suben por el árbol de componentes, y dentro del velo su clic
    // llegaría a `onCancelar`.
    return (
      <>
        <div className="puerta-overlay bautizo-overlay" onClick={onCancelar}>
          <div onClick={(e) => e.stopPropagation()}>{cuerpo}</div>
        </div>
        {ventana !== null && (
          <ConfirmarNombre
            nombre={ventana}
            t={t}
            onCancelar={() => { setVentana(null); campo.current?.focus() }}
            onCambiar={() => { const v = ventana; setVentana(null); enviar(v) }}
          />
        )}
      </>
    )
  }

  return <main className="puerta-screen bautizo-screen">{cuerpo}</main>
}
