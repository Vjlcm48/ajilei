import { useIdioma } from '../hooks/useIdioma'
import { CICLO_CONSTANCIA } from '../hooks/constanciaCore'
import '../styles/constancia.css'

// ── ECO-1d · La ficha de la constancia (lámina `laminas/eco1d`, ubicación A) ──
// Aprobada por Victor (STOP-2 de la 1d): tres monedas pequeñas y «n/3» entre la
// píldora y el engranaje de la barra del LOBBY, siempre a la vista. No es un
// botón: es un dato, como la píldora.
//
// ── O1 ──────────────────────────────────────────────────────────────────────
// El engranaje lleva `margin-left: auto`, así que la ficha no mueve nada al
// aparecer (la lámina lo midió en los cinco viewports). Aun así RESERVA SU CAJA
// mientras la constancia no se sabe: se pinta igual, con `visibility: hidden`,
// para que el lobby mida lo mismo antes y después de la respuesta.
//
// ── LA MONEDA QUE SE POSA ───────────────────────────────────────────────────
// `ficha.posa` sube con cada ingreso nuevo del día; la moneda del día lleva ese
// número en su `key`, así que se vuelve a montar y su salto (`cst-posa`, una
// vez) corre sólo entonces: abrir otra vez el mismo día no la hace saltar. El
// día del cobro, `posada` es falso hasta que el aviso de saldo empieza a
// contar: la moneda y la cifra cambian a la vez que la píldora sube.
//
// Y salta UNA vez por ingreso: el lobby se desmonta al ir a Retar y se vuelve a
// montar al volver, y la clase del salto correría otra vez. Cada salto que
// termina se anota aquí (en esta carga de página) y no se repite.
const saltadas = new Set()

export default function FichaConstancia({ ficha = null, posada = true }) {
  const { t } = useIdioma()
  const lleno = ficha ? (posada ? ficha.lleno : ficha.lleno - 1) : 0
  const conocida = ficha !== null
  return (
    <div
      className={`cst-ficha${conocida ? '' : ' cst-oculta'}`}
      data-accion="constancia"
      data-constancia-dia={conocida ? lleno : ''}
      role="img"
      aria-label={conocida ? t('lob.constancia.aria', { d: lleno }) : undefined}
      aria-hidden={conocida ? undefined : 'true'}
    >
      <span className="cst-pips" aria-hidden="true">
        {Array.from({ length: CICLO_CONSTANCIA }, (_, i) => {
          const n = i + 1
          const llena = n <= lleno
          const delDia = conocida && posada && n === ficha.lleno && ficha.posa > 0
          const salta = delDia && !saltadas.has(ficha.posa)
          return (
            <span
              key={delDia ? `p${n}-${ficha.posa}` : `p${n}`}
              className={`cst-pip${llena ? ' is-llena' : ''}${salta ? ' cst-posa' : ''}`}
              onAnimationEnd={salta ? () => saltadas.add(ficha.posa) : undefined}
            />
          )
        })}
      </span>
      <span className="cst-n">{`${conocida ? lleno : 1}/${CICLO_CONSTANCIA}`}</span>
    </div>
  )
}
