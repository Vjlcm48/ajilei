/* SVG suit symbols styled after the traditional Fournier Spanish deck */

function Oros({ width }) {
  return (
    <svg width={width} height={width} viewBox="0 0 60 60" aria-hidden="true">
      {/* Outer coin ring */}
      <circle cx="30" cy="30" r="27" fill="#d4a017" stroke="#7a5200" strokeWidth="2.5"/>
      {/* Decorative middle ring */}
      <circle cx="30" cy="30" r="21.5" fill="none" stroke="#7a5200" strokeWidth="1.5"/>
      {/* Inner raised circle */}
      <circle cx="30" cy="30" r="16" fill="#f2c94c" stroke="#7a5200" strokeWidth="1.2"/>
      {/* Center boss */}
      <circle cx="30" cy="30" r="7" fill="#d4a017" stroke="#7a5200" strokeWidth="0.8"/>
      {/* 8 small dots between decorative rings */}
      <circle cx="30" cy="8.5" r="1.5" fill="#7a5200"/>
      <circle cx="30" cy="51.5" r="1.5" fill="#7a5200"/>
      <circle cx="8.5" cy="30" r="1.5" fill="#7a5200"/>
      <circle cx="51.5" cy="30" r="1.5" fill="#7a5200"/>
      <circle cx="44.6" cy="15.4" r="1.5" fill="#7a5200"/>
      <circle cx="15.4" cy="44.6" r="1.5" fill="#7a5200"/>
      <circle cx="44.6" cy="44.6" r="1.5" fill="#7a5200"/>
      <circle cx="15.4" cy="15.4" r="1.5" fill="#7a5200"/>
    </svg>
  )
}

function Copas({ width }) {
  const height = Math.round(width * 1.4)
  return (
    <svg width={width} height={height} viewBox="0 0 50 70" aria-hidden="true">
      {/* Chalice bowl — wide at top, curves to narrow waist */}
      <path
        d="M 8 12 Q 5 32 18 44 Q 22 47 25 48 Q 28 47 32 44 Q 45 32 42 12 Z"
        fill="#c0392b"
        stroke="#7a0000"
        strokeWidth="1.5"
      />
      {/* Rim / opening ellipse */}
      <ellipse cx="25" cy="12" rx="17" ry="6" fill="#e74c3c" stroke="#7a0000" strokeWidth="1.5"/>
      {/* Stem */}
      <rect x="22" y="48" width="6" height="11" rx="2.5" fill="#c0392b" stroke="#7a0000" strokeWidth="1"/>
      {/* Base foot — two ellipses for depth */}
      <ellipse cx="25" cy="60" rx="14" ry="5.5" fill="#c0392b" stroke="#7a0000" strokeWidth="1.5"/>
      <ellipse cx="25" cy="58.5" rx="14" ry="4.5" fill="#e55040" stroke="none"/>
    </svg>
  )
}

function Espadas({ width }) {
  const height = Math.round(width * 1.5)
  return (
    <svg width={width} height={height} viewBox="0 0 40 60" aria-hidden="true">
      {/* Blade — elongated diamond, tip at top */}
      <path
        d="M 20 3 L 23.5 37 L 20 41 L 16.5 37 Z"
        fill="#1a3a5c"
        stroke="#0a1a2c"
        strokeWidth="1.2"
      />
      {/* Blade shine */}
      <line x1="18.5" y1="6" x2="18.5" y2="36" stroke="#7aaad4" strokeWidth="1" opacity="0.5"/>
      {/* Cross-guard with upswept wings */}
      <path
        d="M 4 37 C 8 33 14 35 20 37 C 26 35 32 33 36 37 C 32 40 26 39 20 37 C 14 39 8 40 4 37 Z"
        fill="#2c5282"
        stroke="#0a1a2c"
        strokeWidth="1.2"
      />
      {/* Grip / handle */}
      <rect x="17.5" y="41" width="5" height="11" rx="2" fill="#4a6fa5" stroke="#0a1a2c" strokeWidth="0.8"/>
      {/* Pommel */}
      <ellipse cx="20" cy="55.5" rx="6" ry="3.5" fill="#2c5282" stroke="#0a1a2c" strokeWidth="1.2"/>
    </svg>
  )
}

function Bastos({ width }) {
  const height = Math.round(width * 1.5)
  return (
    <svg width={width} height={height} viewBox="0 0 40 60" aria-hidden="true">
      {/* Main baton body — thick, slightly curved */}
      <path
        d="M 17 57 C 14 47 13 36 15 24 C 17 14 22 8 27 16 C 31 23 28 43 26 57 Z"
        fill="#7B4F2E"
        stroke="#3d2010"
        strokeWidth="1.5"
      />
      {/* Lower knot */}
      <ellipse cx="20" cy="51" rx="7.5" ry="4.5" fill="#5a3a1a" stroke="#3d2010" strokeWidth="1.2"/>
      {/* Middle knot */}
      <ellipse cx="22" cy="35" rx="7.5" ry="4.5" fill="#5a3a1a" stroke="#3d2010" strokeWidth="1.2"/>
      {/* Head knot (top) */}
      <ellipse cx="23" cy="17" rx="9" ry="6.5" fill="#5a3a1a" stroke="#3d2010" strokeWidth="1.2"/>
      {/* Wood grain highlight */}
      <path d="M 18 54 C 17 44 16 30 18 19" stroke="#a07848" strokeWidth="1.2" fill="none" opacity="0.6"/>
    </svg>
  )
}

const SUITS = { Oros, Copas, Espadas, Bastos }

export default function SuitSymbol({ palo, width }) {
  const Comp = SUITS[palo]
  return Comp ? <Comp width={width} /> : null
}
