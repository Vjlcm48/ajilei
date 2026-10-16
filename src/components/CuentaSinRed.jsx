import '../styles/puerta.css'
import { Wordmark } from './Wordmark'
import { SoundButton } from './SoundButton'

// ── IOS-1c · La cuenta que no se pudo cargar (escena g de la lámina) ─────────
// Rector: AJILEI_IOS-1_Fase1c_v1.0.md §3.4 (S7) y la respuesta 3 al STOP-1.
// La pinta `App` con `useAuth` en SIN_RED: la sesión o el perfil no se pudieron
// saber por la red. Antes eso era un «Cargando» sin fin, la Portada (con el
// token caducado) o el Bautizo (con el perfil fallido). Aquí el jugador sabe
// qué pasa, y la app lo sigue intentando sola: el botón sólo adelanta el
// siguiente intento. «Cerrar sesión» es la misma salida que la del Bautizo.
//
// Misma tarjeta que la puerta (`puerta.css`), y los textos fijos en español
// como los de la puerta y el Bautizo, aprobados en la lámina.
export default function CuentaSinRed({ onReintentar, onCerrarSesion }) {
  return (
    <main className="puerta-screen" data-accion="cuenta-sin-red">
      <section className="puerta-card">
        <h1 className="welcome-title" aria-label="AJILEI"><Wordmark /></h1>
        <p className="puerta-lema" role="status">No pudimos cargar tu cuenta</p>
        <p className="puerta-sin-red">Revisa tu conexión. Lo seguimos intentando.</p>
        <SoundButton type="button" className="puerta-btn" data-accion="reintentar-cuenta" onClick={onReintentar}>
          Reintentar
        </SoundButton>
        <div className="puerta-links">
          <SoundButton type="button" className="puerta-link" onClick={onCerrarSesion}>
            Cerrar sesión
          </SoundButton>
        </div>
      </section>
    </main>
  )
}
