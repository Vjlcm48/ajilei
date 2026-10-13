import { FASES } from '../hooks/videoCore'

// ── ECO-1g · LA COSTURA del video de recompensa (Fase 0 P.6) ────────────────
// Rector: AJILEI_ECO-1_Fase1g_v1.0.md §2.2. Un único «reproductor» con UNA
// pregunta y TRES respuestas:
//
//     reproductor.empezar()  →  Promise<{ estado }>
//         estado: 'no_disponible' | 'cerrado_antes' | 'completado'
//
// Quien lo llama (`lib/controlVideo`) no sabe qué hay dentro. Hoy lo de dentro
// es el video simulado (`components/CapaVideo`: los consejos, la barra, la ✕
// con su confirmación, la pausa y la cuenta del tiempo visible). El día del
// anuncio real se cambia SÓLO eso: `empezar` llamará al SDK de la red de
// anuncios y traducirá sus tres finales a estos tres estados.
//
// Lo de FUERA no vive aquí y se queda igual ese día: pedir y cobrar el boleto,
// el mensaje de «no hay video», el contador y la celebración.
//
// Es un almacén mínimo, sin React, para que la capa se monte UNA vez cerca de
// la raíz (`components/MarcoVideo`) y la lea con `useSyncExternalStore`.

export const ESTADOS = Object.freeze({
  NO_DISPONIBLE: 'no_disponible',
  CERRADO_ANTES: 'cerrado_antes',
  COMPLETADO: 'completado',
})

export function crearReproductor() {
  let sesion = null
  let serie = 0
  const oyentes = new Set()
  const avisar = () => { for (const fn of oyentes) fn() }

  return {
    suscribir(fn) { oyentes.add(fn); return () => oyentes.delete(fn) },
    leer: () => sesion,

    /**
     * @param {object} [o]
     * @param {boolean} [o.disponible=true]  falso = no hay video que enseñar:
     *   contesta `no_disponible` sin abrir nada
     * @param {number}  [o.duracionMs=40000] los ~40 s VISIBLES
     * @param {number|null} [o.caducaEn]     hasta cuándo sirve verlo, en el
     *   reloj local (`Date.now()`): tras una pausa larga, si ya no da tiempo a
     *   terminar, contesta `no_disponible` en vez de hacer ver el resto para nada
     * @param {number}  [o.inicio=0]         por qué consejo empieza
     * @param {boolean} [o.cierraSolo=false] sólo el mando de desarrollo
     *   `?apu=video:cierra`: se cierra antes de tiempo sin que nadie toque
     */
    empezar({ disponible = true, duracionMs = 40000, caducaEn = null, inicio = 0, cierraSolo = false } = {}) {
      // Un video a la vez: un segundo toque devuelve la promesa del primero.
      if (sesion) return sesion.promesa
      if (!disponible) return Promise.resolve({ estado: ESTADOS.NO_DISPONIBLE })
      let resolver
      const promesa = new Promise((ok) => { resolver = ok })
      sesion = { id: ++serie, fase: FASES.CORRIENDO, duracionMs, caducaEn, inicio, cierraSolo, promesa, resolver }
      avisar()
      return promesa
    },

    /** Cambia lo que se ve sin terminar (✕ → confirma, volver → pausa, seguir → corriendo). */
    fase(nueva) {
      if (!sesion || sesion.fase === nueva) return
      sesion = { ...sesion, fase: nueva }
      avisar()
    },

    /** Uno de los tres finales. Cierra la capa y contesta a quien pidió el video. */
    terminar(estado) {
      if (!sesion) return
      const { resolver } = sesion
      sesion = null
      avisar()
      resolver({ estado })
    },
  }
}

export const reproductor = crearReproductor()
