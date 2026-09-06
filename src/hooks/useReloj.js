import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { calcularDesfase, ahoraServidor as calcularAhora, restante as calcularRestante } from './relojCore'

// ── SAL-A · El reloj del servidor, en su mitad de infraestructura ───────────
// Rector: AJILEI_SALA_Fase1_v1.0.md §5.1.
//
// La semántica entera vive en `relojCore.js`, que no sabe qué hora es. Este hook
// pone las dos cosas que aquél no puede tener: la llamada a la red y `Date.now()`.
// Es la misma frontera que separa `nivelCore.js` de `useNivel.js`.
//
// ── UNA SOLA LLAMADA, AL MONTAR ─────────────────────────────────────────────
// `rpc('ahora')` se pide UNA vez y su resultado se guarda. No se repite por
// pantalla, ni por sala, ni cada minuto «por si acaso»: el desfase entre dos
// relojes de cuarzo no cambia de forma apreciable en los tres minutos que dura
// una sala, y repetirla sería gastar un viaje de red por cada latido para
// corregir microsegundos.
//
// EL FICHERO ES `.js` Y NO `.jsx` porque no devuelve JSX. Molde de `useAuth.js`
// y `useNivel.js`: así `react-refresh/only-export-components` ni se aplica.

export function useReloj() {
  // El desfase vive en un `ref` Y en un `state`, y no es despiste:
  //
  //   · el `ref` es lo que leen `ahoraServidor` y `restante`, que tienen que
  //     devolver el valor VIGENTE en el instante de la llamada —si leyeran del
  //     state, quedarían clavadas al valor del render en que se crearon—;
  //   · el `state` existe para provocar UN repintado cuando la medida llega, de
  //     modo que un cronómetro ya montado se corrija solo en cuanto se sepa el
  //     desfase en vez de esperar al siguiente latido.
  const desfaseRef = useRef(0)
  const [medido, setMedido] = useState(false)

  useEffect(() => {
    let vivo = true

    // El instante local se toma JUSTO ANTES de mandar, no al recibir: entre las
    // dos cosas está la latencia del viaje, y anclarla al envío deja el error
    // acotado por debajo (ver la nota de `calcularDesfase` en el núcleo).
    const antes = Date.now()

    supabase
      .rpc('ahora')
      .then(({ data, error }) => {
        if (!vivo) return
        if (error || !data) {
          // COSTE DECLARADO: sin medida se cuenta con el reloj local a pelo. Un
          // teléfono con la fecha corrida verá mal el cronómetro —pero el
          // vencimiento de verdad lo decide `resolver_sala` en el servidor, así
          // que lo peor que pasa es que la cuenta atrás mienta, no que una sala
          // se cancele antes de tiempo.
          //
          // UN aviso y no uno por render, molde del guardia de `textos.js`: si
          // esto escupiera por fotograma ahogaría la consola, que es donde
          // `puerta.6` del arnés exige silencio.
          console.warn('SAL-A: no se pudo leer la hora del servidor — la cuenta atrás usa el reloj local')
          setMedido(true)
          return
        }
        desfaseRef.current = calcularDesfase(data, antes)
        setMedido(true)
      })

    return () => { vivo = false }
  }, [])

  // Las dos salidas son estables (`useCallback` con dependencias vacías) porque
  // leen del `ref`: se pueden meter en las dependencias de un `useEffect` de
  // cronómetro sin provocar que se vuelva a montar en cada render.
  const ahoraServidor = useCallback(() => calcularAhora(Date.now(), desfaseRef.current), [])
  const restante = useCallback((expiraEn) => calcularRestante(expiraEn, calcularAhora(Date.now(), desfaseRef.current)), [])

  // `desfase` NO sale en el paquete, y no es olvido: leer `desfaseRef.current`
  // aquí es leer un ref durante el render, que `react-hooks/refs` prohíbe con
  // razón —el número que se devolviera quedaría clavado al valor de ESE render
  // y mentiría en cuanto llegara la medida—. Quien necesite el desfase para
  // depurar tiene `medido` para saber si ya se midió, y las dos funciones, que
  // sí leen el valor vigente porque se ejecutan fuera del render.
  return { ahoraServidor, restante, medido }
}
