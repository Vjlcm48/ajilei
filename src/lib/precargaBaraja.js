// ── precargaBaraja.js · CAR-1 §3.1 ──────────────────────────────────────────
// Rector: AJILEI_CAR1_Fase1_v1.0.
//
// La Fase 0 midió el flash y salió de RED, no de decodificación: 1 893 ms de
// mediana entre insertar el <img> y verlo pintado en Fast 4G, contra ~15 ms de
// decodificar. Comprimir baja el numerador; precargar lo lleva a cero, porque
// cuando la mesa inserta la carta el byte ya está en el navegador.
//
// Se pide en el LOBBY y no al montar la mesa, por el mismo motivo por el que
// `precargarSonidos` se pide ahí (App.jsx:62-64): el recorrido dificultad →
// mesa + apuesta son varios segundos de margen, y el primer reparto cae a los
// pocos fotogramas de que la mesa exista.
import { URLS_BARAJA } from '../components/CardImage'

// RETENCIÓN DELIBERADA. Sin una referencia viva, el objeto Image es basura
// recolectable en cuanto acaba la función y el navegador puede desalojar la
// imagen de su caché de memoria antes de que la mesa la pida — que es
// exactamente el caso que esto viene a evitar. El array de módulo no es
// descuido: es la única parte del mecanismo que hace falta escribir.
const retenidas = []

export function precargarBaraja() {
  // Guarda de reentrada. `App.jsx` pide la precarga en un efecto que depende de
  // `screen`, y el lobby cambia de pantalla tres veces antes de la mesa: sin
  // esta línea serían 120 peticiones para 40 archivos.
  if (retenidas.length) return

  for (const url of URLS_BARAJA) {
    const img = new Image()
    img.src = url
    retenidas.push(img)
  }
}

// Sin `decode()` y sin promesa que esperar, a propósito: lo que se quiere es
// que la RED ocurra ahora. La decodificación son ~15 ms medidos (Fase 0 §4),
// ruido frente a lo que se está corrigiendo, y forzarla aquí ocuparía el hilo
// principal del lobby para adelantar nada que se note.
