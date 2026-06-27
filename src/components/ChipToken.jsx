import './ChipToken.css';
// ChipToken.jsx
// Token SVG de ficha AJILEI — 2D plano, dorado único, tres tamaños.
// Props:
//   size: 'full' | 'compact' | 'icon'  (default: 'compact')

const SIZES = {
  full:    { outer: 36, inner: 27, stroke: 2 },
  compact: { outer: 24, inner: 18, stroke: 1.5 },
  icon:    { outer: 16, inner: 12, stroke: 1 },
};

export default function ChipToken({ size = 'compact' }) {
  const { outer, inner, stroke } = SIZES[size];
  const center = outer / 2;

  return (
    <svg
      width={outer}
      height={outer}
      viewBox={`0 0 ${outer} ${outer}`}
      xmlns="http://www.w3.org/2000/svg"
      className={`chip-token chip-token--${size}`}
      aria-hidden="true"
    >
      <circle
        cx={center}
        cy={center}
        r={center - 2}
        fill="var(--gold-brand)"
      />
      <circle
        cx={center}
        cy={center}
        r={inner / 2}
        fill="none"
        stroke="var(--green-deep)"
        strokeWidth={stroke}
        opacity="0.9"
      />
    </svg>
  );
}
