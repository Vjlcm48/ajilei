import { useEffect, useRef, useState } from 'react'
// ── EL IMPORT QUE NO SE PUEDE QUITAR ────────────────────────────────────────
// `welcome.css` la importaba SÓLO `WelcomeScreen.jsx` (Fase 0 §2.3). Al salir la
// Bienvenida del recorrido, esa hoja saldría del grafo de módulos y con ella:
//   · las reglas base de `h1.welcome-title` —color, 72px, traza 12— de las que
//     dependen la PORTADA (portada.css:109-118 sólo redeclara la escalera, no el
//     color), la mesa y la pantalla de celebración;
//   · `body { margin:0; min-height:100vh; background: var(--green-abyss);
//     color; font-family }` (welcome.css:1-7), que `tapetes.css:31` y
//     `useTapetes.js:115` dan por hecho.
// El lobby NO usa una sola de sus clases. La importa para sostener un contrato
// que es de toda la app y que esta campaña no tiene encargo de mudar. Va PRIMERO
// para que `lobby.css` caiga después en la cascada. Cuando alguna tanda futura
// mude esas reglas a una hoja propia, esta línea se va con ella.
import '../styles/welcome.css'
import '../styles/lobby.css'

import ArcoEstrellas from '../components/ArcoEstrellas'
import { SoundButton } from '../components/SoundButton'
// SAL-B1 · La barra superior sale de aquí a un componente compartido: las
// pantallas de salas montan la MISMA, no una copia (rector SAL-B1 §3.1). El
// lobby pinta exactamente el mismo DOM que antes —mismas clases, mismos
// `data-accion`, misma hoja de estilo—; lo único que cambia es dónde está
// escrito el marcado. `BalanceDisplay`, `montoTexto`, `IconoMas` e
// `IconoAjustes` se fueron con él y por eso ya no se importan aquí.
import BarraSuperior from '../components/BarraSuperior'
// CFG-1 1a · la hoja del ⚙ se fue a su componente: la montan también las seis
// pantallas de `.sal`. Con ella se fueron los créditos y `enmascararCorreo`.
import HojaConfiguracion from '../components/HojaConfiguracion'
import {
  IconoTrofeo, IconoTienda, IconoLibro, IconoPersonas,
} from '../components/IconosLobby'
import ChipToken from '../components/ChipToken'
import { useIdioma } from '../hooks/useIdioma'
import { useSounds, precargarSonidos, SONIDOS_LOBBY } from '../hooks/useSounds'
import { precargarMesa } from '../lib/cargarMesa'
import { precargarDelLobby } from '../lib/trozos'
import { saldoOculto as ojitoGuardado } from '../lib/saldoOculto'

// ── El isotipo del lobby ────────────────────────────────────────────────────
// `?no-inline` por el mismo motivo que `ChipToken` y `Wordmark`: el nombre del
// activo es ID de contrato (Identidad A §5.4) y un data URI lo disuelve.
//
// SE MONTA COMO <img> Y NO COMO MÁSCARA, y la ficha lo previó: «Si el SVG lleva
// colores propios, se monta como <img> y se anota». LLEVA. La cabecera del
// maestro lo declara —«Color: gold-brand #e8b84b · rampa tonal y acentos
// vino/marino solo dentro de la Heptacoin»— y el archivo trae dos degradados
// (`ajFld`, `ajH`), el filete vino `#7c1d30` y la sombra marino `#1c305f`.
// Enmascararlo con `background: var(--gold-brand)` aplanaría la Heptacoin del
// vano a un solo oro: sería recolorear el activo, que es justo lo que Identidad
// A §5.2 prohíbe. `embellecimiento.css` lo usa como máscara para OTRA cosa —una
// banda de luz que barre el título—, no para pintarlo.
//
// SU CAJA NO ES CUADRADA. `viewBox="15 30 60 90"` → proporción 2:3, la misma que
// `.wm-iso` respeta con `height: calc(1.5 * var(--wm-cap))`. El ancho se deriva
// del alto en `lobby.css`; forzarlo a cuadrado deformaría la letra doble.
import isotipoUrl from '../assets/ajilei-isotipo.svg?no-inline'

// ── LOB-1 · El lobby post-login ─────────────────────────────────────────────
// Documento rector: AJILEI_LOB1_Fase1_v1.2.md. Autoridad visual:
// `AJILEI_LOB1_lamina_v1.4.html`, sellada por Victor.
//
// Ocupa la casilla que ocupaba `WelcomeScreen` en la cascada de `App.jsx`: mismo
// sitio, mismo estado (`screen === 'lobby'`), mismo destino al pulsar. Lo que
// cambia es la cara y que los textos ya no viven en el JSX.
//
// ── LO QUE ESTA PANTALLA NO SABE ────────────────────────────────────────────
// No conoce `screen`, ni Supabase, ni la mesa. Recibe sus props y ya. Es lo que
// permite que `App.jsx` siga siendo el único sitio del proyecto que sabe cómo se
// pasa de una pantalla a otra —el patrón de la casa desde NIV-UI: un estado y
// una cascada de `if`, sin router—.
//
// ── VIVAS Y NO VIVAS ────────────────────────────────────────────────────────
// Vivas: el CTA (→ `NivelSelect`), el ⚙ (abre la hoja), «Cerrar sesión»,
// «Acerca de», Rankings y, desde TIE-1 1a, la Tienda. Todo lo demás avisa «Pronto» con el mismo toast. Un botón que no
// hace nada Y no lo dice es peor que no tenerlo; el toast es la promesa mínima.
// CFG-1 1a · en la hoja ya sólo dicen «Pronto» Idioma y Eliminar cuenta, y lo
// dicen con el aviso de la hoja (`HojaConfiguracion`), no con éste.

export default function Lobby({ cuenta, billetera = null, aviso = null, onAvisoFin, constancia = null, onJugarIA, onJugarPvP, onRankings, onTienda, onCerrarSesion }) {
  const { t } = useIdioma()
  const { play } = useSounds()

  const [hojaAbierta, setHojaAbierta] = useState(false)
  const [toastVivo, setToastVivo] = useState(false)
  // CFG-1 1a · el ojito. Se lee UNA vez al montar (dato de arranque, como el
  // idioma) y se escribe al tocarlo: recargar la página lo deja como estaba.
  const [saldoOculto, setSaldoOculto] = useState(() => ojitoGuardado.leer())
  const alternarOjito = () => {
    const nuevo = !saldoOculto
    ojitoGuardado.guardar(nuevo)
    setSaldoOculto(nuevo)
  }

  const ajustesRef = useRef(null)
  // GT-HIG · TODO reloj lleva handle y se cancela. El censo de FRZ-1 §1.3
  // encontró nueve `setTimeout` sueltos; ninguno nuevo se suma a esa lista.
  const relojToast = useRef(null)

  // ── El golpe de mesa se pide al MONTAR, no al pulsar ───────────────────────
  // Molde de PUE-1.2: quien sabe que va a necesitar un sonido lo pide antes de
  // necesitarlo. `tableKnock` son 37 920 B y el CTA puede pulsarse a los dos
  // segundos de que el lobby exista; pedirlo en el manejador llegaría tarde y
  // Howler lo encolaría para después del clic. `precargarSonidos` es idempotente.
  useEffect(() => { precargarSonidos(SONIDOS_LOBBY) }, [])
  // ARN-3d §2.4 (B11) · y el chunk de la mesa, en un momento ocioso. Aquí, en el
  // MONTAJE del lobby, porque el lobby sólo existe con sesión: la Portada no lo
  // monta y no paga la mesa antes de su primera pintura (`1.8b`). Un humano
  // tarda segundos en elegir las cuatro filas de Retar; el chunk, con 4G lento,
  // menos de uno.
  // PES-1 §3-B · y, en el mismo momento, lo que se abre desde aquí.
  useEffect(() => { precargarMesa(); precargarDelLobby() }, [])

  // ── La jaula de 1126px se EXCEPCIONA, no se demuele ───────────────────────
  // Molde EXACTO de `Portada.jsx:217-223`: `index.css` es andamiaje de Vite y
  // esta campaña no lo abre. El lobby se anuncia con una clase en el <body> y
  // `lobby.css` declara la excepción con alcance (`body.lobby-activa #root`,
  // especificidad 0,2,1), así que gana sin un solo `!important` y MUERE al
  // desmontar. Ninguna otra pantalla ve la diferencia.
  useEffect(() => {
    document.body.classList.add('lobby-activa')
    return () => { document.body.classList.remove('lobby-activa') }
  }, [])

  // El reloj del toast, con su cancelación en el desmontaje.
  useEffect(() => () => clearTimeout(relojToast.current), [])

  // El foco de la hoja (entra en el título, vuelve al ⚙), `Escape` y la clase
  // `lobby-hoja-abierta` del <body> viven ahora en `HojaConfiguracion`.

  const pronto = () => {
    setToastVivo(true)
    clearTimeout(relojToast.current)
    relojToast.current = setTimeout(() => setToastVivo(false), 1200)
  }

  const jugarIA = () => {
    // El golpe de mesa RELEVA al clic de botón, no se suma. Por eso el CTA es un
    // <button> pelado y no un `SoundButton`: aquél dispara `buttonClick` antes de
    // llamar al `onClick`, y las dos muestras sonarían encimadas en el mismo
    // fotograma. Es el único botón del lobby con voz propia — y le toca, porque
    // es el único que abre la mesa.
    play('tableKnock')
    onJugarIA?.()
  }

  // O1 · el nombre RESERVA SU CAJA aunque no haya cuenta (bypass): se apaga
  // con `visibility` y el lobby mide lo mismo con cuenta y sin ella.
  const usuario = cuenta?.username ?? ''

  return (
    <main className="lobby">
      <div className="lob-fondo" aria-hidden="true" />

      {/* ── Barra superior ─────────────────────────────────────────────── */}
      {/* SAL-B1 · El marcado se fue a `components/BarraSuperior.jsx` para que
          las tres pantallas de salas monten LA MISMA barra y no una copia
          (rector SAL-B1 §3.1). Lo que se pinta es idéntico a lo de antes: las
          mismas clases `lob-*`, los mismos tres `data-accion` y la misma
          píldora con su `BalanceDisplay`.

          APU-1 1e · el saldo ENTRA POR PROP y ya no se lee de `ajileiConfig`
          aquí (rector 1e §2.3). Sigue siendo provisional —ECO-1 no existe— pero
          dentro de la sesión SE MUEVE: baja al sentarse a una mesa y sube con
          lo que el jugador se levanta. Un lobby que siguiera pintando la
          constante diría 5.000 justo después de que el jugador perdiera 2.500,
          que es peor que no enseñar nada.

          ECO-1b · la prop es la `billetera` entera de `useBilletera` (App) y ya
          no hay defecto: el respaldo `saldoDelJugador()` era la constante 5.000,
          y una píldora sin cifra enseña su hueco, no un número de mentira. */}
      <BarraSuperior
        usuario={usuario}
        saldo={billetera?.saldo ?? null}
        estadoSaldo={billetera?.estado}
        recordado={billetera?.recordado ?? null}
        cobrando={billetera?.pendiente === true}
        aviso={aviso}
        onAvisoFin={onAvisoFin}
        // ECO-1d · la ficha de la constancia vive SÓLO en el lobby (lámina
        // `laminas/eco1d`, ubicación A). `null` mientras no se sabe: caja
        // reservada.
        constancia={constancia}
        // ECO-1g · el «+» dorado ya no pasa por aquí: `BarraSuperior` abre la
        // hoja «Conseguir monedas» por el contexto del video (`useVideo`).
        onPerfil={cuenta?.abrirPerfil ?? pronto}
        onAjustes={() => setHojaAbierta(true)}
        ajustesRef={ajustesRef}
        ajustesExpandido={hojaAbierta}
        // CFG-1 1a · el ojito: SÓLO aquí (INV-69). Ninguna otra pantalla pasa
        // `onOjito`, y sin él la barra no lo pinta.
        saldoOculto={saldoOculto}
        onOjito={alternarOjito}
      />

      {/* ── Centro ─────────────────────────────────────────────────────── */}
      <section className="lob-centro">
        <div className="lob-marca">
          <ArcoEstrellas idBase="lob" className="lob-arco" />
          {/* El <h1> de la página es la MARCA, y la marca aquí es el isotipo
              solo: decisión sellada — en el lobby no aparece el nombre, que sólo
              existe como logotipo [letra doble]+ILEI y aquí no se usa. El nombre
              accesible lo pone el `alt`: sin él la página no tendría encabezado
              legible y un lector de pantalla anunciaría una imagen sin nombre.
              En el lobby NO existe `h1.welcome-title` — su contrato de selector
              es de la Bienvenida, la Portada, la mesa y la celebración. */}
          <h1 className="lob-marca-h1">
            <img
              className="lob-iso"
              src={isotipoUrl}
              alt="AJILEI"
              draggable="false"
            />
          </h1>
        </div>

        <div className="lob-accion">
          {/* El CTA va SOLO y centrado. La v1.3 de la lámina le ponía una
              moneda grande al lado; la v1.4 la retira y la moneda del producto
              pasa a ser una sola: la de la píldora de saldo. Su ancho es
              `--cta-w`, fórmula sobre `--u` con techo de 64 u. */}
          {/* AJF-1 · Variante «A + icono» de la lámina AJF-1: la moneda de la
              casa a la izquierda del rótulo, decorativa (el rótulo ya lo dice).
              La ranura mide en `em`; `ChipToken` ya sale `aria-hidden`. */}
          <button
            type="button"
            className="lob-cta-ia"
            data-accion="jugar-ia"
            onClick={jugarIA}
          >
            <span className="lob-cta-ico" aria-hidden="true"><ChipToken size="icon" /></span>
            {t('lob.cta.ia')}
          </button>

          {/* ── SAL-B1 · El PvP deja de estar cerrado ──────────────────────
              Pierde el candado y la pastilla «Próximamente» porque ya lleva a
              alguna parte: `SalaOpciones`. Las dos cosas eran la promesa mínima
              de un botón que no hacía nada; con el botón vivo, dejarlas sería
              mentir en la otra dirección.
              `lob.cta.pronto` NO se borra del diccionario: la pastilla sigue
              viva en las seis filas de la hoja ⚙ y en el toast.
              AJF-1 · Y con el botón vivo deja de vestirse de enlace: es una
              píldora de la MISMA caja que la de las IAS —alto `--lob-cta-h` con
              su suelo táctil de 44 px, ancho `--lob-cta-w`— en contorno de oro
              (`.lob-cta-jugadores`, lobby.css §3.1), con las dos personas a la
              izquierda. Sigue siendo `SoundButton` porque no abre la mesa: su
              voz es el clic, no el golpe de mesa. */}
          <SoundButton type="button" className="lob-cta-jugadores" data-accion="jugar-pvp" onClick={() => onJugarPvP?.()}>
            <IconoPersonas className="lob-cta-ico" />
            <span>{t('lob.cta.pvp')}</span>
          </SoundButton>
        </div>
      </section>

      {/* ── Barra inferior ─────────────────────────────────────────────── */}
      <nav className="lob-nav" aria-label={t('lob.cfg.titulo')}>
        {/* RNK-1c · Rankings ya lleva a su pantalla. TIE-1 1a · la Tienda,
            también (en Tapetes, V1-A); «Cómo se juega» sigue diciendo «Pronto». */}
        <SoundButton className="lob-nav-btn" data-accion="rankings" onClick={() => onRankings?.()}>
          <IconoTrofeo /><span>{t('lob.nav.rankings')}</span>
        </SoundButton>
        {/* La Tienda al centro es el ÚNICO oro sólido de la barra: regla del oro
            único. El color lo pone `lobby.css`; el icono es `currentColor`. */}
        <SoundButton className="lob-nav-btn lob-nav-tienda" data-accion="tienda" onClick={onTienda ?? pronto}>
          <IconoTienda /><span>{t('lob.nav.tienda')}</span>
        </SoundButton>
        <SoundButton className="lob-nav-btn" data-accion="reglas" onClick={pronto}>
          <IconoLibro /><span>{t('lob.nav.reglas')}</span>
        </SoundButton>
      </nav>

      {/* ── Hoja de configuración ──────────────────────────────────────── */}
      {/* CFG-1 1a · el componente de todas las pantallas. Va DENTRO de
          `main.lobby`, como antes: la hoja se ancla al relleno del lienzo. */}
      <HojaConfiguracion
        abierta={hojaAbierta}
        onCerrar={() => setHojaAbierta(false)}
        ajustesRef={ajustesRef}
        cuenta={cuenta}
        onCerrarSesion={onCerrarSesion}
      />

      {/* Un solo toast para los diez avisos. `role="status"` + `aria-live` lo
          anuncia sin robar el foco; la caja se reserva siempre y sólo se apaga
          con `visibility`, para que aparecer no empuje un píxel (O1). */}
      <div className={`lob-toast${toastVivo ? ' is-on' : ''}`} role="status" aria-live="polite">
        {t('lob.toast.pronto')}
      </div>
    </main>
  )
}
