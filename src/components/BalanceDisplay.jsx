import { useEffect, useRef, useState } from 'react'
import '../styles/balanceDisplay.css'

let _uid = 0

export default function BalanceDisplay({ chips }) {
  const prevRef = useRef(chips)
  const [anim, setAnim]  = useState(null)

  useEffect(() => {
    const prev = prevRef.current
    prevRef.current = chips
    if (prev === chips) return

    const delta = chips - prev
    const type  = delta > 0 ? 'gain' : 'loss'
    const id    = ++_uid
    setAnim({ id, delta, type })

    const dur = type === 'gain' ? 900 : 700
    const t   = setTimeout(() => setAnim(a => (a?.id === id ? null : a)), dur)
    return () => clearTimeout(t)
  }, [chips])

  return (
    <span className={`bd${anim ? ` bd-halo-${anim.type}` : ''}`}>
      <span className={`bd-num${anim ? ` bd-pulse-${anim.type}` : ''}`}>
        {chips}
      </span>
      {anim && (
        <span key={anim.id} className={`bd-float bd-float-${anim.type}`}>
          {anim.delta > 0 ? '+' : ''}{anim.delta}
        </span>
      )}
    </span>
  )
}
