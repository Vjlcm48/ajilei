import { TAPETE_POR_DEFECTO, conTonos } from '../config/tapetes'
import { desdeInventario, normalizarTapete, normalizarTono } from '../hooks/tapetesCore'

// ── TIE-1 1a · El canal de los tapetes ───────────────────────────────────────
// Rector: AJILEI_TIE-1_Fase1a_v1.0.md §3.2. Molde de `lib/controlVideo`: se crea
// UNA vez en `App` y sobrevive a los cambios de pantalla, porque lo leen tres
// sitios que no se conocen —la tienda, la fila «Tapetes» del ⚙ y la mesa— y
// los tres tienen que decir lo mismo. No es estado de React: quien pinta se
// suscribe (`useTapetes`).
//
// ── EL SERVIDOR MANDA (INV-76) ──────────────────────────────────────────────
// Lo comprado, lo puesto y su tono son lo que diga `mi_inventario`. Comprar,
// usar y elegir tono llaman a su RPC y la foto cambia SÓLO con su `'ok'`: una
// compra que falla no puede dejar un tapete puesto, y nada se da por comprado
// antes de que el servidor lo diga.
//
// ── LA COPIA DEL APARATO ────────────────────────────────────────────────────
// `almacen` guarda el tapete y el tono EN USO (`ajilei.tapete`,
// `ajilei.tapete.tono`) para pintar la mesa antes de que conteste el servidor y
// sin red. Es una copia, no una fuente: nadie la usa para decidir qué está
// comprado, y la primera respuesta del servidor la pisa. Lo comprado no se
// copia (`comprados` arranca vacío y `cargado` en falso).
//
// La foto: `{ cargado, comprados: { id: tono }, enUso, tono }`.

const TIPO = 'tapete'

export function crearControlTapetes({ api, almacen }) {
  const copia = almacen?.leer() ?? { enUso: TAPETE_POR_DEFECTO, tono: null }
  const enUsoCopia = normalizarTapete(copia.enUso)
  let foto = Object.freeze({
    cargado: false,
    comprados: {},
    enUso: enUsoCopia,
    tono: normalizarTono(enUsoCopia, copia.tono),
  })
  const oyentes = new Set()

  function fija(cambio) {
    foto = Object.freeze({ ...foto, ...cambio })
    almacen?.guardar(foto.enUso, foto.tono)
    for (const f of oyentes) f()
  }

  async function refrescar() {
    const filas = await api.inventario(TIPO)
    if (filas === null) return false
    fija({ ...desdeInventario(filas), cargado: true })
    return true
  }

  return {
    suscribir(fn) { oyentes.add(fn); return () => oyentes.delete(fn) },
    leer: () => foto,
    refrescar,

    /**
     * Compra el tapete y lo pone en uso. Devuelve el motivo del servidor, o
     * `null` si no contestó. Con 'ya_comprado' relee el inventario: el jugador
     * lo compró en otro aparato, y la vista tiene que pasar a «comprado».
     */
    async comprar(id, tono = null) {
      const t = conTonos(id) ? normalizarTono(id, tono) : null
      const motivo = await api.comprar(TIPO, id, t)
      if (motivo === 'ok') fija({ comprados: { ...foto.comprados, [id]: t }, enUso: id, tono: t })
      else if (motivo === 'ya_comprado') await refrescar()
      return motivo
    },

    /** Pone en uso un tapete comprado (o el verde). El motivo, o `null`. */
    async usar(id) {
      const motivo = await api.usar(TIPO, id)
      if (motivo === 'ok') fija({ enUso: id, tono: id === TAPETE_POR_DEFECTO ? null : foto.comprados[id] ?? null })
      return motivo
    },

    /** Cambia el tono de un tapete comprado (gratis). El motivo, o `null`. */
    async elegirTono(id, tono) {
      const motivo = await api.elegirTono(TIPO, id, tono)
      if (motivo === 'ok') {
        fija({
          comprados: { ...foto.comprados, [id]: tono },
          ...(foto.enUso === id ? { tono } : {}),
        })
      }
      return motivo
    },
  }
}
