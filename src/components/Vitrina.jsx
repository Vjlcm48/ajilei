import '../styles/vitrina.css'
// La luz de LUZ-1 nombra también a la vitrina (luz.css §0, §2 y §3): la tienda
// la carga aunque la mesa no se haya cargado todavía. Todas sus reglas viven
// bajo `.game-table-screen` o `.vit`: fuera de ellas no pinta nada.
import '../styles/luz.css'
import cartaA from '../assets/cards/webp/uno_espada.webp'
import cartaB from '../assets/cards/webp/siete_oro.webp'
import cartaC from '../assets/cards/webp/tres_copa.webp'
import ChipToken from './ChipToken'
import { atributosTapete } from '../hooks/tapetesCore'

// ── TIE-1 1a · La vitrina ────────────────────────────────────────────────────
// Rector: AJILEI_TIE-1_Fase1a_v1.0.md §3.3; lámina `laminas/tie1a` (V4-A).
//
// Un tapete con su tono, pintado con LOS MISMOS NUEVE VALORES que la mesa: la
// raíz `.vit` lleva `data-tapete` y `data-tapete-tono` —los atributos que la
// mesa pone en `<body>` (`useTapeteEnMesa`), calculados por la misma función— y
// tapetes.css y luz.css declaran cada bloque para los dos (`:is(body, .vit)`).
// No importa `GameTable` ni gameTable.css: es un componente propio y ligero.
// Δ = 0 entre vitrina y mesa lo mide el arnés (`diagDSK tienda`, INV-77).
//
// Nada interactivo dentro: cartas, fichas y pozo son adorno quieto.
//
//   tamano  'grande'   la mesa entera (la vista del artículo de la tienda)
//           'muestra'  sólo el fieltro (las franjas de la lista)
//           'disco'    sólo el fieltro, redondo (los tonos y la fila del ⚙)

// Los asientos: cuatro IAS y el jugador, como huecos vacíos.
const ASIENTOS = ['n1', 'n2', 'o', 'e', 's']

export default function Vitrina({ tapete, tono = null, tamano = 'grande', className = '', pozo = '1.200' }) {
  const { tapete: dt, tono: dn } = atributosTapete(tapete, tono)
  const raiz = {
    'data-tapete': dt ?? undefined,
    'data-tapete-tono': dn ?? undefined,
    'aria-hidden': 'true',
  }
  if (tamano !== 'grande') {
    return <span className={`vit vit-${tamano}${className ? ` ${className}` : ''}`} {...raiz} />
  }
  return (
    <div className={`vit vit-grande${className ? ` ${className}` : ''}`} {...raiz}>
      <div className="vit-fondo">
        <div className="vit-mesa">
          {ASIENTOS.map((a) => <span key={a} className={`vit-asiento vit-asiento-${a}`} />)}
          <div className="vit-ovalo">
            <span className="vit-cartas">
              <img className="vit-carta" src={cartaA} alt="" draggable="false" />
              <img className="vit-carta" src={cartaB} alt="" draggable="false" />
              <img className="vit-carta" src={cartaC} alt="" draggable="false" />
            </span>
            <span className="vit-pozo">
              <span className="vit-pozo-l">Pozo</span>
              <span className="vit-pozo-v"><ChipToken size="icon" />{pozo}</span>
            </span>
            <span className="vit-fichas">
              <ChipToken size="icon" /><ChipToken size="icon" /><ChipToken size="icon" />
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
