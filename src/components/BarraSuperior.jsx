import BalanceDisplay from './BalanceDisplay'
import { SoundButton } from './SoundButton'
import { IconoUsuario, IconoMas, IconoAjustes } from './IconosLobby'
import { montoTexto } from '../config/tapetes'
import { useIdioma } from '../hooks/useIdioma'
import { useSounds } from '../hooks/useSounds'

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
// El lobby le pasa la constante de config que ya pintaba; las salas le pasan
// `saldoDelJugador()`, que es el ÚNICO lector que SAL puede importar (SAL-A
// §4.2). Los dos resuelven hoy al mismo número, y el día que ECO-1 conecte la
// billetera esta barra no se entera: recibe un número y lo pinta.

export default function BarraSuperior({
  usuario = '',
  saldo,
  onPerfil,
  onTienda,
  onAjustes,
  ajustesRef,
  // `undefined` = esta pantalla no tiene hoja que abrir, así que el ⚙ no anuncia
  // un diálogo que no existe. Sólo el lobby pasa un booleano. Anunciar
  // `aria-haspopup="dialog"` donde no hay diálogo es mentirle a un lector de
  // pantalla, y es peor que no anunciar nada.
  ajustesExpandido,
}) {
  const { t } = useIdioma()
  const { play } = useSounds()

  const hayHoja = typeof ajustesExpandido === 'boolean'

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
      <div className="lob-pildora" aria-label={t('lob.saldo.aria')}>
        {/* PROVISIONAL: sin billetera; ECO-x lo conecta a Supabase. No hay saldo
            vivo en el producto: no existe ledger, y una cifra que no se mueve
            nunca es lo único honesto que se puede enseñar hasta que exista.

            ── La moneda de la casa, y UNA sola ──────────────────────────────
            `BalanceDisplay` YA monta su `ChipToken`, que es `heptacoin.svg` —el
            maestro sellado— en un <img>. Es exactamente la moneda que pide la
            lámina, así que no se añade una segunda al lado: se envuelve la que
            hay. El lado lo fija `--ico` desde la hoja, no el atributo del
            componente — contrato de iconos. */}
        <span className="lob-moneda">
          <BalanceDisplay chips={montoTexto(saldo)} size="icon" />
        </span>
        <SoundButton className="lob-mas" data-accion="tienda" aria-label={t('lob.nav.tienda')} onClick={onTienda}>
          <IconoMas />
        </SoundButton>
      </div>

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
    </header>
  )
}
