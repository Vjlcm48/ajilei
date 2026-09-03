import '../styles/puerta.css'
import '../styles/entrada.css'
import { Wordmark } from '../components/Wordmark'
import FormularioPuerta from '../components/FormularioPuerta'

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
//
// ── PUE-2.2 · Qué cambió en esta pantalla, y qué NO ─────────────────────────
// La Portada-Entrada tomó el relevo de `SIN_SESION` (ver App.jsx), así que esta
// pantalla ya no es la puerta del jugador. **No se borra:** borrar es otra
// tanda, y mientras tanto sigue siendo el molde de referencia del formulario y
// la única pantalla que lo enseña sin escenografía alrededor.
//
// Lo que cambió es de dónde sale el formulario: su cuerpo se extrajo a
// `components/FormularioPuerta.jsx` **sin tocar una línea de lógica ni una
// clase de CSS**, para que la portada no acabara con una copia que se separa a
// la tercera calibración. Lo que se ve aquí es exactamente lo de antes.
export default function Entrada({ onEnviarCodigo, onVerificar }) {
  return (
    <main className="puerta-screen entrada-screen">
      <section className="puerta-card entrada-card">
        {/* El rótulo es el MISMO objeto que el de la Bienvenida: misma clase,
            mismo tamaño, misma traza y el resplandor de EMB-1 que cuelga de
            `h1.welcome-title` sin gate alguno. El `aria-label` no es adorno —sin
            él la marca se leería "ILEI", que es la trampa que IDN-1 documentó. */}
        <h1 className="welcome-title" aria-label="AJILEI"><Wordmark /></h1>

        <FormularioPuerta onEnviarCodigo={onEnviarCodigo} onVerificar={onVerificar} />
      </section>
    </main>
  )
}
