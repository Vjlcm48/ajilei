import '../styles/balanceDisplay.css';
import ChipToken from './ChipToken';

// BalanceDisplay — saldo con token de ficha
// Props:
//   chips: number  — valor del saldo
//   size: 'full' | 'compact' | 'icon'  (default: 'compact')
//   junto: nodo opcional entre la moneda y la cifra. CFG-1 1a: el ojito de la
//          píldora del lobby va AHÍ (lámina `laminas/cfg1a`, V1-C), dentro del
//          mismo `gap` de la caja. Nadie más lo pasa: la mesa no cambia.

export default function BalanceDisplay({ chips, size = 'compact', junto = null }) {
  return (
    <span className={`bd bd--${size}`}>
      <ChipToken size={size} />
      {junto}
      <span className="bd-num">{chips}</span>
    </span>
  );
}
