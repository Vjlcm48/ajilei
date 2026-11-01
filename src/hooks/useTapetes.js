import { useEffect, useSyncExternalStore } from 'react'
import { TAPETE_KEY, TAPETE_TONO_KEY, TAPETES_COMPRADOS_LEGADO } from '../config/tapetes'
import { normalizarTapete, atributosTapete } from './tapetesCore'

// ── EMB-2 · Estado y persistencia de los tapetes ─────────────────────────────
// Documento rector: docs/AJILEI_Tapetes_v1.0.md §4 y §5; TIE-1 1a.
// Infraestructura, no lógica: las decisiones viven en tapetesCore y el estado
// en el canal (`lib/controlTapetes`). Aquí quedan las dos cosas que tocan el
// navegador: la copia del aparato y el atributo de `<body>`.
//
// ── TIE-1 1a · LA COPIA DEL APARATO ─────────────────────────────────────────
// `ajilei.tapete` y `ajilei.tapete.tono` guardan el tapete EN USO para que la
// mesa lo pinte antes de que conteste el servidor y sin red. Lo comprado ya no
// se guarda aquí: lo dice `mi_inventario` (INV-76). La clave de antes
// (`ajilei.tapetes.comprados`) se borra una vez, al crear el almacén, y no se
// lee nunca: lo que un aparato «compró» sin pagar no se reconoce.

export function readTapete() {
  try {
    return normalizarTapete(window.localStorage.getItem(TAPETE_KEY))
  } catch {
    return normalizarTapete(null)   // storage denegado: se arranca en verde, sin ruido
  }
}

export function crearAlmacenTapetes(almacen = () => window.localStorage) {
  try { almacen().removeItem(TAPETES_COMPRADOS_LEGADO) } catch { /* sin almacén no hay legado */ }
  return {
    leer() {
      try {
        return { enUso: almacen().getItem(TAPETE_KEY), tono: almacen().getItem(TAPETE_TONO_KEY) }
      } catch {
        return { enUso: null, tono: null }
      }
    },
    guardar(enUso, tono) {
      try {
        almacen().setItem(TAPETE_KEY, normalizarTapete(enUso))
        if (tono) almacen().setItem(TAPETE_TONO_KEY, tono)
        else almacen().removeItem(TAPETE_TONO_KEY)
      } catch { /* storage denegado: la copia vive sólo en esta sesión */ }
    },
  }
}

const SIN_CANAL = { suscribir: () => () => {}, leer: () => null }

/** La foto del canal (`{ cargado, comprados, enUso, tono }`), o `null` sin canal. */
export function useTapetes(control) {
  const c = control ?? SIN_CANAL
  return useSyncExternalStore(c.suscribir, c.leer)
}

// ── Dónde se aplica el tapete, y por qué es `body` ──────────────────────────
// El candidato natural era `.game-table-screen` (el contenedor del fieltro), y
// se descartó MIDIENDO: `#root` está acotado a 1126px por index.css, así que a
// 1920 la pantalla de mesa deja ~400px de VACÍO a cada lado — y ese vacío lo
// pinta `body { background: var(--green-abyss) }` (welcome.css:4). Con el
// atributo en la pantalla, un tapete vinotinto quedaba enmarcado en verde: el
// tapete a medio poner. En `body` el token se redefine por encima de las dos
// superficies y todo el árbol lo hereda de una vez.
//
// El atributo VIVE MIENTRAS VIVE LA MESA. Al abandonarla se retira, y el lobby
// vuelve a su verde sin que ninguna pantalla tenga que saber que los tapetes
// existen. TIE-1 1a · son dos: `data-tapete` y `data-tapete-tono`; con el verde
// (o el tono 'actual') el atributo correspondiente no se pone.
export function useTapeteEnMesa(control) {
  const foto = useTapetes(control)
  const { tapete, tono } = atributosTapete(foto?.enUso, foto?.tono)
  useEffect(() => {
    const d = document.body.dataset
    if (tapete) d.tapete = tapete
    if (tono) d.tapeteTono = tono
    return () => { delete d.tapete; delete d.tapeteTono }
  }, [tapete, tono])
}
