// ── MED-1a T2 · De dónde vino cada cuenta nueva (`profiles.origen`) ─────────
// Rector: AJILEI_MED-1a_T2_v1.0.md §2 y §3; Fase 0 §C. Puro y sin React.
//
// `main.jsx` llama a `recogerOrigen` ANTES de montar `App`, que limpia `?sala=`
// de la barra. Lo que se recoge espera en `ajilei.origen` (INV-12): primer
// toque, 30 días, y se borra tras un Bautizo con éxito (`olvidarOrigen`). Los
// `utm_*` se quedan en la barra: «Abrir en Chrome» los lleva consigo.
//
// El check de la base es `^(directo|utm:[a-z0-9_-]{1,40}|invitacion|tienda)$`
// (migración `20261116120000_med1a_eventos.sql`): la campaña se normaliza aquí
// para que nunca haga fallar el Bautizo, y `useAuth` reintenta sin `origen` si
// aun así la base lo rechaza. Medición, no dinero: todo va protegido y nada
// lanza; ante cualquier fallo, `directo`.

const CLAVE = 'ajilei.origen'
const CADUCA_MS = 30 * 24 * 60 * 60 * 1000
const UTM = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content']
const FORMATO = /^(directo|utm:[a-z0-9_-]{1,40}|invitacion|tienda)$/

const almacen = () => { try { return globalThis.localStorage ?? null } catch { return null } }
const corto = (v, n) => String(v).trim().toLowerCase().slice(0, n)

/** Minúsculas, sin tildes, solo `[a-z0-9_-]`, 40 como mucho. Puede quedar vacía. */
export function normalizarCampana(texto) {
  return String(texto ?? '').normalize('NFD').toLowerCase().replace(/[^a-z0-9_-]/g, '').slice(0, 40)
}

function leer(ahora) {
  try {
    const g = JSON.parse(almacen()?.getItem(CLAVE) ?? 'null')
    const t = Date.parse(g?.llegada)
    if (!FORMATO.test(g?.origen) || !(ahora - t < CADUCA_MS)) return null
    return { origen: g.origen, datos: g.datos && typeof g.datos === 'object' ? g.datos : {}, llegada: g.llegada }
  } catch { return null }
}

/** Primer toque: si no hay nada vigente, guarda lo de esta visita. Devuelve lo guardado (o `null`). */
export function recogerOrigen(search, ahora = Date.now()) {
  try {
    const vigente = leer(ahora)
    if (vigente) return vigente
    const p = new URLSearchParams(search ?? '')
    const datos = {}
    for (const k of UTM) if (p.get(k)) datos[k] = corto(p.get(k), 60)
    if (p.get('sala')) datos.sala = String(p.get('sala')).trim().slice(0, 20)
    const campana = normalizarCampana(p.get('utm_campaign')) || normalizarCampana(p.get('utm_source'))
    const origen = campana ? `utm:${campana}` : datos.sala ? 'invitacion' : 'directo'
    const g = { origen, datos, llegada: new Date(ahora).toISOString() }
    almacen()?.setItem(CLAVE, JSON.stringify(g))
    return g
  } catch { return null }
}

/** `{ origen, origen_datos }` para el `insert` del Bautizo, con la zona horaria del aparato. */
export function origenParaPerfil(ahora = Date.now()) {
  const g = leer(ahora)
  const datos = { ...(g?.datos ?? {}) }
  try { datos.zona_horaria = String(Intl.DateTimeFormat().resolvedOptions().timeZone ?? '').slice(0, 60) } catch { /* sin Intl */ }
  try { datos.idioma = String(globalThis.navigator?.language ?? '').slice(0, 35) } catch { /* sin navigator */ }
  for (const k of ['zona_horaria', 'idioma']) if (!datos[k]) delete datos[k]
  try { datos.llegada = g?.llegada ?? new Date(ahora).toISOString() } catch { /* reloj inválido */ }
  return { origen: g?.origen ?? 'directo', origen_datos: datos }
}

/** Tras el Bautizo: el origen ya está en `profiles`. */
export function olvidarOrigen() {
  try { almacen()?.removeItem(CLAVE) } catch { /* sin almacén */ }
}
