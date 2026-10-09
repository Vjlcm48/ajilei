// ── ECO-1c · La marca de este navegador (P-4) ───────────────────────────────
// `sentarse_ia` la guarda con la mesa, y `recoger_mesa_ia` la compara al
// arrancar: una mesa abierta desde ESTE navegador está muerta seguro (la mesa
// vive sólo en memoria y no sobrevive a recargar la página), así que se recoge
// en el acto; la de otro dispositivo sólo tras 10 min sin avisos.
//
// No es una frontera de seguridad: cerrar una mesa nunca le quita dinero a
// nadie (cobra su última pila avisada). Por eso basta un identificador al azar
// en `localStorage`. Si el almacenamiento no se puede usar (ventana privada,
// datos bloqueados), la marca nace nueva en cada carga: la mesa se trata como
// de otro dispositivo, que es el caso prudente.
//
// Residuo aceptado por el rector (P-4): dos pestañas del mismo navegador
// comparten la marca, y la segunda recoge la mesa de la primera, que se entera
// por C6 sin perder dinero.

export const CLAVE_DISPOSITIVO = 'ajilei.dispositivo'

let enMemoria = null

const nueva = () => {
  try { return globalThis.crypto.randomUUID() } catch { return `d-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}` }
}

export function idDispositivo() {
  if (enMemoria) return enMemoria
  try {
    const guardada = globalThis.localStorage?.getItem(CLAVE_DISPOSITIVO)
    if (guardada) { enMemoria = guardada; return guardada }
    const n = nueva()
    globalThis.localStorage?.setItem(CLAVE_DISPOSITIVO, n)
    enMemoria = n
    return n
  } catch {
    enMemoria = nueva()
    return enMemoria
  }
}
