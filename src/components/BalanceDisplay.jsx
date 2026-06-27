import '../styles/balanceDisplay.css';
import ChipToken from './ChipToken';

// BalanceDisplay — saldo con token de ficha
// Props:
//   chips: number  — valor del saldo
//   size: 'full' | 'compact' | 'icon'  (default: 'compact')

export default function BalanceDisplay({ chips, size = 'compact' }) {
  return (
    <span className={`bd bd--${size}`}>
      <ChipToken size={size} />
      <span className="bd-num">{chips}</span>
    </span>
  );
}
