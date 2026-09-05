// ── LOB-1 · El arco de ocho estrellas, extraído a componente ────────────────
// Documento rector: AJILEI_LOB1_Fase1_v1.1.md §3.1.
//
// GEOMETRÍA VERBATIM de `components/WelcomeScreen.jsx:46-56`: mismo `viewBox`,
// mismo `path` de la bezier, mismos ocho pares de coordenadas y mismo `polygon`
// de cinco puntas. Ni un número se recalculó. La lámina v1.3 trae un arco propio
// con otra caja (`0 0 200 60`) y otras paradas, y la propia lámina lo declara
// stand-in: «[SUSTITUIR] arco de 8 estrellas: Fase 1 monta el SVG real de
// WelcomeScreen.jsx:46-56 como componente único». Esto es ese montaje.
//
// ── LOS DOS HEX SE VUELVEN TOKEN, Y LOS PÍXELES NO SE MUEVEN ────────────────
// El original cablea `#003893` y `#f5edd8`. Los dos SON tokens de `theme.css`
// —`--flag-blue` y `--text-primary`, líneas 82 y 73— con exactamente ese valor,
// así que sustituirlos deja el dibujo idéntico al píxel y cumple la regla «ni un
// hex fuera de theme.css» (§1.4), que en un archivo nuevo sí rige. La lámina
// v1.3 ya pinta su arco con `var(--text-primary)`: es la misma decisión.
//
// ── POR QUÉ `idBase` ES PROP Y NO UNA CONSTANTE ─────────────────────────────
// El `<polygon>` vive en `<defs>` con un `id`, y los `<use>` lo referencian por
// almohadilla. Un `id` es GLOBAL al documento: `WelcomeScreen` usa `s5` y
// `ModeSelect` usa `ms5` precisamente porque las dos pantallas ya chocaron una
// vez. Con la prop, dos arcos pueden convivir en un mismo árbol sin que el
// segundo pinte las estrellas del primero.
//
// ── `ModeSelect` CONSERVA SU COPIA ──────────────────────────────────────────
// Unificar las tres copias del arco es otra tanda. Esta fase no abre
// `ModeSelect`: es la pantalla intocable del encargo (§0), y cambiarla para
// ahorrar once líneas sería exactamente el ensanche de alcance que la ficha
// prohíbe. Queda anotado en el informe como deuda conocida.

// Las ocho paradas sobre la bezier, verbatim del original. Fuera del componente
// porque son constantes y no tienen por qué reconstruirse en cada render.
const PARADAS = [
  [10, 56], [35.7, 49.1], [61.5, 44.6], [87.2, 42.3],
  [112.7, 42.3], [138.5, 44.6], [164.2, 49.1], [190, 56],
]

export default function ArcoEstrellas({ idBase = 'arco', className = '' }) {
  const idPunta = `${idBase}-p5`
  return (
    <svg className={className} viewBox="0 0 200 65" aria-hidden="true" focusable="false">
      <defs>
        <polygon
          id={idPunta}
          points="0,-4.5 1.06,-1.46 4.28,-1.39 1.71,0.56 2.65,3.64 0,1.8 -2.65,3.64 -1.71,0.56 -4.28,-1.39 -1.06,-1.46"
        />
      </defs>
      <path
        d="M 10,56 Q 100,28 190,56"
        fill="none" stroke="var(--flag-blue)" strokeWidth="1.2" strokeOpacity="0.38"
      />
      {PARADAS.map(([x, y], i) => (
        <use
          key={i}
          href={`#${idPunta}`}
          transform={`translate(${x},${y})`}
          fill="var(--text-primary)"
          opacity="0.88"
        />
      ))}
    </svg>
  )
}
