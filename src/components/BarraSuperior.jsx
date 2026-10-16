import { useRef } from 'react'
import '../styles/pildora.css'
import BalanceDisplay from './BalanceDisplay'
import AvisoSaldo from './AvisoSaldo'
import FichaConstancia from './FichaConstancia'
import { SoundButton } from './SoundButton'
import { IconoUsuario, IconoMas, IconoAjustes } from './IconosLobby'
import { montoTexto } from '../config/tapetes'
import { useIdioma } from '../hooks/useIdioma'
import { useSounds } from '../hooks/useSounds'
import { useAvisoSaldo } from '../hooks/useAvisoSaldo'
import { useVideo } from '../hooks/useVideo'
import { vidaAviso } from '../hooks/avisoSaldoCore'
import { monedaPosada } from '../hooks/constanciaCore'

// ── SAL-B1 · La barra superior, extraída para poder reusarla ────────────────
// Rector: AJILEI_SAL-B1_Fase1_v1.0.md §3.1 — «barra superior del lobby (misma
// que `Lobby.jsx`, reutilizada, no copiada)».
//
// ── QUÉ ES ESTE ARCHIVO Y QUÉ NO ES ────────────────────────────────────────
// Es EXACTAMENTE el marcado que vivía incrustado en `Lobby.jsx`, movido sin
// tocar una clase, un `data-accion` ni un `aria-label`. No es un rediseño ni una
// generalización: si algo aquí se ve distinto de como se veía antes de esta
// sub-tanda, es un fallo.
//
// La ficha §2 dice que del lobby «nada más cambia» y §3.1 pide reutilizar. Se
// resuelve así, con el visto bueno de Victor (7-sep-2026): el lobby PINTA lo
// mismo —mismo DOM, mismas clases, misma hoja— y lo que cambia es dónde está
// escrito. Copiar el marcado habría dejado tres copias que divergen a la primera
// que alguien toque una.
//
// ── LAS CLASES SIGUEN SIENDO `lob-*`, Y NO SE RENOMBRAN ────────────────────
// Tentación evidente: llamarlas `barra-*` ahora que ya no son sólo del lobby.
// No se hace, y por dos razones que pesan más que la coherencia del nombre:
//
//   (1) `lobby.css` las tiene bajo `.lobby .lob-*` y esta tanda es de CSS
//       ADITIVO ESTRICTO (regla 2): renombrar obligaría a reescribir selectores
//       existentes, que es justo lo prohibido;
//   (2) el arnés `diagDSK lob` consume `.lob-pildora`, `.lob-top .lob-avatar
//       svg`, `.lob-moneda .chip-token` y `.lob-pildora [data-accion="tienda"]`
//       en sus puntos 3, 3b y 3c. Renombrar dejaría ciego el metro del lobby en
//       una tanda que ni siquiera es del lobby — «quien mueve la ruta, recablea
//       el metro», y aquí lo barato es no moverla.
//
// El precio se paga en `salas.css`: como `lobby.css` acota TODO a `.lobby`, las
// pantallas de salas necesitan las mismas reglas re-escaladas bajo `.sal`. Es
// duplicación de CSS —declarada en el informe— a cambio de cero duplicación de
// marcado, que es la que se pudre.
//
// ── EL SALDO ENTRA POR PARÁMETRO ───────────────────────────────────────────
// ECO-1b · las seis pantallas le pasan la MISMA cifra, la de `useBilletera`
// (billetera del servidor + ajuste local de vs-IA). Esta barra no sabe de dónde
// sale: recibe un número, o `null` mientras no se sabe, y lo pinta.
//
// `null` NO se pinta como 0 (`montoTexto(null)` daría «0»): la píldora enseña
// la moneda y un hueco «—» con caja reservada (O1), nunca una cifra inventada.
// `estadoSaldo` —cargando, listo o error— viaja al atributo `data-saldo` para
// que el arnés lo lea (modo `saldo` de diagDSK, INV-46).
//
// ── IOS-1c · lo que se enseña mientras no hay cifra del servidor ───────────
// Lámina `laminas/ios1c`, elecciones de Victor (2026-10-16):
//   · `recordado` (escena b2): la última cifra que este aparato vio del
//     servidor, atenuada y con un pulso suave, sin texto. Al llegar la real,
//     cambio directo (escena c, A). `data-saldo-recordado` para el arnés;
//   · `cobrando` (escena d3): se cobra la salida de una mesa y la cifra de
//     antes de sentarse sería falsa: tres puntos. `data-saldo-cobrando`.
// Los dos sólo actúan sin cifra del servidor; el aviso y la celebración del
// video siguen mandando por delante. Sin ninguno de los dos, el «—» de ECO-1b.

export default function BarraSuperior({
  usuario = '',
  saldo = null,
  estadoSaldo,
  recordado = null,
  cobrando = false,
  onPerfil,
  onAjustes,
  ajustesRef,
  // `undefined` = esta pantalla no tiene hoja que abrir, así que el ⚙ no anuncia
  // un diálogo que no existe. Sólo el lobby pasa un booleano. Anunciar
  // `aria-haspopup="dialog"` donde no hay diálogo es mentirle a un lector de
  // pantalla, y es peor que no anunciar nada.
  ajustesExpandido,
  aviso = null,
  onAvisoFin,
  // ECO-1d · la ficha de la constancia (lámina `laminas/eco1d`, ubicación A).
  // `undefined` = esta pantalla no la lleva (sólo el lobby la pasa); `null` =
  // el lobby la lleva pero aún no se sabe (caja reservada, O1).
  constancia,
}) {
  const { t } = useIdioma()
  const { play } = useSounds()

  // ── ECO-1c · El aviso de saldo ─────────────────────────────────────────
  // Lámina `laminas/eco1c`. Mientras vive, la píldora enseña la cifra que
  // CUENTA (de `aviso.desde` a `aviso.hasta`) y no el saldo, y su moneda
  // brilla una vez. `aviso.clave` es la del texto; `{hc}` se queda como marca
  // para que la cápsula lo pinte en oro.
  const pildoraRef = useRef(null)
  const monedaRef = useRef(null)
  const textoAviso = aviso ? t(aviso.clave, { hc: '{hc}' }) : ''
  const avisoVivo = useAvisoSaldo(aviso, vidaAviso(textoAviso.replace('{hc}', montoTexto(aviso?.monto ?? 0))), onAvisoFin)
  // ── ECO-1g · El video de recompensa ────────────────────────────────────
  // El «+» dorado abre la hoja «Conseguir monedas» (G3 b). Llega por contexto
  // (`MarcoVideo`), no por parámetro: las seis pantallas que montan esta barra
  // lo heredan igual, y eran cinco manejadores de «Pronto» que mantener.
  //
  // Mientras dura la celebración del video, la píldora enseña la cifra que
  // CUENTA y su moneda brilla, con el mismo mecanismo del aviso. El orden es:
  // aviso vivo → celebración → saldo. Así no salta ni retrocede.
  const video = useVideo()
  const celebra = video?.pildora ?? null
  const cifra = avisoVivo.vivo ? avisoVivo.cifra : (celebra ? celebra.cifra : saldo)
  const brillaVideo = !avisoVivo.vivo && celebra?.brilla === true
  // El día del cobro la moneda del día espera a que su aviso empiece a contar.
  const posada = monedaPosada(constancia, avisoVivo.vivo ? aviso : null, avisoVivo.contando)

  const hayHoja = typeof ajustesExpandido === 'boolean'
  const sinCifra = !Number.isFinite(cifra)
  const enCobro = sinCifra && cobrando
  const conRecuerdo = sinCifra && !cobrando && Number.isFinite(recordado)
  const numero = enCobro
    ? <span className="pil-puntos" aria-hidden="true"><i /><i /><i /></span>
    : conRecuerdo ? montoTexto(recordado) : sinCifra ? '—' : montoTexto(cifra)

  return (
    <header className="lob-top">
      <SoundButton
        className={`lob-perfil${usuario ? '' : ' lob-hueco'}`}
        data-accion="perfil"
        aria-label={t('lob.perfil.aria')}
        onClick={onPerfil}
      >
        <span className="lob-avatar" aria-hidden="true"><IconoUsuario /></span>
        <span className="lob-nombre">{usuario || ' '}</span>
      </SoundButton>

      {/* La píldora NO es un botón: es un dato con un atajo dentro. El `+` sí
          lo es, y por eso es el único elemento pulsable de la caja. */}
      <div
        ref={pildoraRef}
        className="lob-pildora"
        aria-label={t('lob.saldo.aria')}
        data-saldo={estadoSaldo}
        data-saldo-vacio={sinCifra ? '' : undefined}
        data-saldo-recordado={conRecuerdo ? '' : undefined}
        data-saldo-cobrando={enCobro ? '' : undefined}
        aria-busy={sinCifra && estadoSaldo !== 'error' ? 'true' : undefined}
      >
        {/* ECO-1b · la cifra es la de la billetera (ver la cabecera). Sin cifra,
            un hueco con la caja reservada: `lobby.css` y `salas.css` le dan el
            ancho de una cifra de cuatro dígitos para que la llegada del saldo
            no empuje el `+`.

            ── La moneda de la casa, y UNA sola ──────────────────────────────
            `BalanceDisplay` YA monta su `ChipToken`, que es `heptacoin.svg` —el
            maestro sellado— en un <img>. Es exactamente la moneda que pide la
            lámina, así que no se añade una segunda al lado: se envuelve la que
            hay. El lado lo fija `--ico` desde la hoja, no el atributo del
            componente — contrato de iconos. */}
        <span
          ref={monedaRef}
          className={`lob-moneda${avisoVivo.vivo || brillaVideo ? ' avs-viva' : ''}${avisoVivo.brilla || brillaVideo ? ' avs-brilla' : ''}`}
        >
          <BalanceDisplay chips={numero} size="icon" />
        </span>
        <SoundButton
          className="lob-mas"
          data-accion="tienda"
          aria-label={t('video.hoja.titulo')}
          aria-haspopup="dialog"
          onClick={video?.abrirHoja}
        >
          <IconoMas />
        </SoundButton>
      </div>

      {constancia !== undefined && <FichaConstancia ficha={constancia} posada={posada} />}

      {/* <button> pelado y no `SoundButton` por una razón mecánica: en el lobby
          necesita `ref` para devolverle el foco al cerrar la hoja, y
          `SoundButton` no expone el nodo. El clic de la casa se dispara a mano.
          Las pantallas que no pasan `ref` heredan el mismo botón sin coste. */}
      <button
        ref={ajustesRef}
        type="button"
        className="lob-ajustes"
        data-accion="ajustes"
        aria-label={t('lob.ajustes.aria')}
        {...(hayHoja ? { 'aria-haspopup': 'dialog', 'aria-expanded': ajustesExpandido } : {})}
        onClick={() => { play('buttonClick'); onAjustes?.() }}
      >
        <IconoAjustes />
      </button>
      {avisoVivo.vivo && !avisoVivo.oculto && (
        <AvisoSaldo
          texto={textoAviso}
          monto={aviso.monto}
          montoTexto={montoTexto(aviso.monto)}
          pildoraRef={pildoraRef}
          monedaRef={monedaRef}
          saliendo={avisoVivo.saliendo}
          onCerrar={avisoVivo.cerrar}
        />
      )}
    </header>
  )
}
