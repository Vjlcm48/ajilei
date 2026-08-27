import '../styles/welcome.css'
import { SoundButton } from './SoundButton'
import { Wordmark } from './Wordmark'
import reyOroUrl     from '../assets/cards/doce_oro.png?url'
import caballoOroUrl from '../assets/cards/once_oro.png?url'

// SUP-2b · `cuenta` es OPCIONAL y su ausencia es un estado legítimo, no un
// olvido: no llega con el bypass de desarrollo activo (la adenda de Fase 1 lo
// exige literalmente, para que los 20 arneses vean la Bienvenida byte-idéntica a
// la de hoy) y no puede llegar sin sesión, porque sin sesión no se llega a esta
// pantalla. Cuando no llega, no se monta nada.
function WelcomeScreen({ onSelectMode, cuenta }) {
  return (
    <main className="welcome-screen">
      {/* El acceso a la cuenta, periférico y FUERA DE FLUJO. Es `absolute`
          contra `.welcome-screen` a propósito y no un bloque del panel: así su
          presencia o su ausencia no mueven un píxel del resto —ni del wordmark,
          ni del arco de estrellas, ni de los dos botones—, que es lo que O1 pide
          de la manera más barata posible. No compite con la marca ni con el CTA:
          vive en la esquina, en el gris del sistema, con el nombre como único
          dato y una sola acción. */}
      {cuenta && (
        <div className="welcome-cuenta">
          <span className="welcome-cuenta-nombre">{cuenta.username}</span>
          <button type="button" className="welcome-cuenta-salir" onClick={cuenta.cerrarSesion}>
            Cerrar sesión
          </button>
        </div>
      )}

      <img className="deco-card deco-left"  src={reyOroUrl}     alt="" aria-hidden="true" />
      <img className="deco-card deco-right" src={caballoOroUrl} alt="" aria-hidden="true" />

      <section className="welcome-card">
        {/* IDN-1 · el nombre pasa a ser [letra doble] + ILEI. El `aria-label`
            no es adorno: sin él la marca se leería "ILEI" en un lector de
            pantalla. La clase y la caja del <h1> no se tocan — el barrido
            dorado de EMB-1 sigue colgando de `h1.welcome-title` y ahora
            recorre sólo las cuatro letras, con el símbolo quieto al lado
            (decisión de Victor, 2026-08-20). */}
        <h1 className="welcome-title" aria-label="AJILEI"><Wordmark /></h1>

        <svg className="star-arc" viewBox="0 0 200 65" aria-hidden="true">
          <defs>
            <polygon id="s5" points="0,-4.5 1.06,-1.46 4.28,-1.39 1.71,0.56 2.65,3.64 0,1.8 -2.65,3.64 -1.71,0.56 -4.28,-1.39 -1.06,-1.46" />
          </defs>
          <path d="M 10,56 Q 100,28 190,56"
            fill="none" stroke="#003893" strokeWidth="1.2" strokeOpacity="0.38"
          />
          {[[10,56],[35.7,49.1],[61.5,44.6],[87.2,42.3],[112.7,42.3],[138.5,44.6],[164.2,49.1],[190,56]].map(([x,y],i) => (
            <use key={i} href="#s5" transform={`translate(${x},${y})`} fill="#f5edd8" opacity="0.88" />
          ))}
        </svg>

        <p className="subtitle">
          El clásico juego de cartas venezolano, ahora digital.
        </p>

        <div className="mode-buttons">
          <SoundButton className="btn-mode btn-mode-ai" onClick={() => onSelectMode('ai')}>
            Jugar vs IA
          </SoundButton>
          <div className="btn-secondary-wrap">
            <SoundButton className="btn-mode btn-mode-players" disabled>
              Vs Jugadores
            </SoundButton>
            <p className="soon-label">Próximamente</p>
          </div>
        </div>

        <p style={{
          textAlign: 'center',
          fontSize: '0.65rem',
          color: 'rgba(232, 184, 75, 0.6)',
          letterSpacing: '0.08em',
          fontWeight: 400,
          marginTop: '0.75rem'
        }}>
          by HEPTACREATION
        </p>

        {/* DSK-U2c · crédito CC BY, obligatorio y VISIBLE (v1.4 §6). La
            licencia de los emoji de las reacciones exige atribución, y un
            comentario en código no la cumple: la lección de la lámina GNU
            (Diseno_Landscape §10.3) fue exactamente ésta. Va aquí y no en
            ModeSelect —donde el encargo lo situaba— porque la marca de la casa
            vive en esta pantalla. Un peldaño por debajo de HEPTACREATION en
            tamaño y opacidad: acredita sin competir. */}
        <p style={{
          textAlign: 'center',
          fontSize: '0.58rem',
          color: 'rgba(232, 184, 75, 0.42)',
          letterSpacing: '0.04em',
          fontWeight: 400,
          marginTop: '0.35rem'
        }}>
          Emoji:{' '}
          <a
            href="https://googlefonts.github.io/noto-emoji-animation/"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: 'inherit', textDecoration: 'underline' }}
          >
            Google Animated Noto Emoji
          </a>
          {' '}· CC BY 4.0
        </p>
      </section>
    </main>
  )
}

export default WelcomeScreen
