import { useState, useEffect, useRef, useCallback } from 'react'
import '../styles/puerta.css'
import '../styles/bautizo.css'
import { Wordmark } from '../components/Wordmark'
import { REGLA_USERNAME } from '../hooks/useAuth'
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

export default function Bautizo({
  modo = 'bautizo', actual = '', onConfirmar, onCancelar, onCerrarSesion,
}) {
  const [nombre, setNombre] = useState(actual)
  const [ocupado, setOcupado] = useState(false)
  const [error, setError] = useState(null)
  const campo = useRef(null)
  const edicion = modo === 'edicion'

  useEffect(() => { campo.current?.focus() }, [])

  // Esc cancela, pero SÓLO en edición: en el bautizo no hay nada que cancelar
  // —sin nombre no se juega— y una tecla que no hace nada es mejor que una que
  // parece cerrar y deja al jugador en la misma pantalla.
  useEffect(() => {
    if (!edicion || !onCancelar) return
    const onKey = (e) => { if (e.key === 'Escape') onCancelar() }
    document.addEventListener('keydown', onKey, true)
    return () => document.removeEventListener('keydown', onKey, true)
  }, [edicion, onCancelar])

  const valido = REGLA_USERNAME.test(nombre)
  // En edición, confirmar el mismo nombre es un viaje de red para no cambiar
  // nada — y la base lo devolvería con 23505 contra el propio jugador.
  const sinCambio = edicion && nombre === actual

  const confirmar = useCallback(async () => {
    if (ocupado) return
    setOcupado(true)
    setError(null)
    const r = await onConfirmar(nombre)
    if (r.ok) {
      // En bautizo el componente se desmonta al pasar a COMPLETO; en edición lo
      // cierra quien lo abrió. En ninguno de los dos casos hay que apagar
      // `ocupado`: escribir en un componente que ya no está es exactamente el
      // aviso que React da y que nadie lee.
      if (edicion && onCancelar) onCancelar()
      return
    }
    setOcupado(false)
    setError(r.mensaje)
  }, [nombre, ocupado, edicion, onConfirmar, onCancelar])

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

        <label className="bautizo-etiqueta" htmlFor="bautizo-nombre">Nombre de jugador</label>
        <input
          id="bautizo-nombre"
          ref={campo}
          className={`puerta-campo${error ? ' is-error' : ''}`}
          type="text"
          autoComplete="off"
          autoCapitalize="none"
          spellCheck="false"
          maxLength={15}
          placeholder="tunombre"
          value={nombre}
          onChange={(e) => { setNombre(e.target.value); if (error) setError(null) }}
          disabled={ocupado}
        />

        {/* La regla, VISIBLE y permanente (§1.4). No es un mensaje de error: es
            el contrato, y por eso vive fuera de la ranura de avisos y no la
            ocupa. Su alto es fijo, así que un error debajo no la mueve. */}
        <p className="bautizo-regla">6 a 15 caracteres: letras, números y guion bajo</p>

        <p className="puerta-aviso" role="status">{error ?? ''}</p>

        <SoundButton type="submit" className="puerta-btn" disabled={ocupado || !valido || sinCambio}>
          {ocupado ? 'Guardando…' : 'Confirmar'}
        </SoundButton>

        <div className="puerta-links">
          {edicion ? (
            <SoundButton type="button" className="puerta-link" onClick={onCancelar} disabled={ocupado}>
              Cancelar
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
    return (
      <div className="puerta-overlay" onClick={onCancelar}>
        <div onClick={(e) => e.stopPropagation()}>{cuerpo}</div>
      </div>
    )
  }

  return <main className="puerta-screen bautizo-screen">{cuerpo}</main>
}
