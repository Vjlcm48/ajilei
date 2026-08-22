import { useState, useCallback, useEffect } from 'react'
import { TAPETE_KEY, TAPETES_COMPRADOS_KEY, TAPETE_POR_DEFECTO } from '../config/tapetes'
import {
  normalizarTapete, parseComprados, serializarComprados,
  comprar, decidirPresion, tapeteVisible,
} from './tapetesCore'

// ── EMB-2 · Estado y persistencia de los tapetes ─────────────────────────────
// Documento rector: docs/AJILEI_Tapetes_v1.0.md §4 y §5.
// Infraestructura, no lógica: toda decisión vive en tapetesCore. Molde exacto
// de useNivel (lectura/escritura con try/catch en las dos direcciones, porque
// un storage denegado no puede tumbar la mesa) y de useUtilitiesMenu (el gate
// se DERIVA, jamás se sincroniza con un efecto).


export function readTapete() {
  try {
    return normalizarTapete(window.localStorage.getItem(TAPETE_KEY))
  } catch {
    return TAPETE_POR_DEFECTO   // storage denegado: se arranca en verde, sin ruido
  }
}

export function writeTapete(id) {
  try {
    window.localStorage.setItem(TAPETE_KEY, normalizarTapete(id))
  } catch { /* storage denegado: la elección vive sólo en esta sesión */ }
}

export function readComprados() {
  try {
    return parseComprados(window.localStorage.getItem(TAPETES_COMPRADOS_KEY))
  } catch {
    return parseComprados(null)   // el gratuito entra igual: es propiedad de todos
  }
}

export function writeComprados(ids) {
  try {
    window.localStorage.setItem(TAPETES_COMPRADOS_KEY, serializarComprados(ids))
  } catch { /* storage denegado: la propiedad vive sólo en esta sesión */ }
}

// Ni la clave del activo ni la de la propiedad se SIEMBRAN al leer —a
// diferencia del contador de consultas, que nace con sus 20 gratis—: una
// preferencia que el jugador todavía no ha expresado no se inventa en disco.
// Se escriben cuando elige o cuando compra, y hasta entonces el default es el
// verde clásico (v1.0 §1).
//
// `enabled` es el gate de escritorio, el MISMO que monta el ⋮ (`useIsDesktopTable`).
// Fuera de él no hay panel, no hay atributo y el fieltro es verde aunque el
// storage traiga un tricolor: el sello móvil se sostiene por construcción, no
// por promesa. El puerto móvil del ⋮ heredará todo después (v1.0 §4 y §7).
export function useTapetes(enabled = true) {
  const [activo, setActivo] = useState(() => readTapete())
  const [comprados, setComprados] = useState(() => readComprados())
  // La vista previa es un estado APARTE y nunca se persiste: la reversión de
  // «No» es soltarla, no restaurar nada (tapetesCore.tapeteVisible).
  const [previa, setPrevia] = useState(null)
  const [dialogo, setDialogo] = useState(null)   // null = cerrado; id = "¿comprar?"
  const [anclaGuardada, setAncla] = useState(null)   // null = panel cerrado

  const abierto = enabled && anclaGuardada !== null
  const ancla = abierto ? anclaGuardada : null
  // Fuera del gate el fieltro es el default, pase lo que pase en disco.
  const tapete = enabled ? tapeteVisible(activo, previa) : TAPETE_POR_DEFECTO

  // Soltar la previa y el diálogo a la vez: son la misma acción de usuario
  // («No», cerrar el diálogo o cerrar el panel) y separarlas sólo abre la
  // puerta a un diálogo huérfano sobre un tapete ya revertido.
  const revertir = useCallback(() => { setPrevia(null); setDialogo(null) }, [])

  const cerrar = useCallback(() => { setAncla(null); revertir() }, [revertir])

  // Se mide al abrir, no al renderizar — molde del panel de utilidades y del
  // selector de reacciones. El panel se ancla al ⋮ por su borde derecho.
  // MOV-1b-a · el ancla llega HECHA desde `anclaSatelite` (D6). Antes se
  // calculaba aquí, y con el puerto móvil eso habría significado tres copias de
  // la misma regla de colocación —una por satélite— divergiendo a la primera
  // celda que alguien midiera de más.
  const abrir = useCallback((ancla) => {
    if (!ancla) return
    setAncla(ancla)
  }, [])

  const presionar = useCallback((id) => {
    const { accion, tapete: destino } = decidirPresion(id, activo, comprados)
    if (accion === 'nada') return
    if (accion === 'aplicar') {
      setPrevia(null); setDialogo(null)
      setActivo(destino); writeTapete(destino)
      return
    }
    // 'previsualizar': la mesa es el probador — el tapete se aplica al instante
    // y el diálogo se pinta encima (v1.0 §4).
    setPrevia(destino); setDialogo(destino)
  }, [activo, comprados])

  // «Sí» registra la propiedad y DEJA EL TAPETE PUESTO: el jugador acaba de
  // verlo aplicado, quitárselo para volver a ponerlo sería un parpadeo gratis.
  // SIN DESCUENTO DE SALDO — no existe billetera; el descuento nace con
  // Supabase (ECO-1), y nace en tapetesCore.comprar, no aquí (v1.0 §5).
  const confirmar = useCallback(() => {
    if (!dialogo) return
    const nuevos = comprar(dialogo, comprados)
    setComprados(nuevos); writeComprados(nuevos)
    setActivo(dialogo); writeTapete(dialogo)
    setPrevia(null); setDialogo(null)
  }, [dialogo, comprados])

  // ── Dónde se aplica el tapete, y por qué es `body` ────────────────────────
  // El candidato natural era `.game-table-screen` (el contenedor del fieltro), y
  // se descartó MIDIENDO: `#root` está acotado a 1126px por index.css, así que
  // a 1920 la pantalla de mesa deja ~400px de VACÍO a cada lado — y ese vacío lo
  // pinta `body { background: var(--green-abyss) }` (welcome.css:4). Con el
  // atributo en la pantalla, un tapete vinotinto quedaba enmarcado en verde: el
  // tapete a medio poner. En `body` el token se redefine por encima de las dos
  // superficies y todo el árbol lo hereda de una vez.
  //
  // Es el único efecto de esta tanda que sale del árbol de React, y se paga con
  // su limpieza: el atributo VIVE MIENTRAS VIVE LA MESA. Al abandonarla —o al
  // salir del gate de escritorio— se retira, y el lobby vuelve a su verde sin
  // que ninguna pantalla tenga que saber que los tapetes existen.
  useEffect(() => {
    if (!enabled) return
    document.body.dataset.tapete = tapete
    return () => { delete document.body.dataset.tapete }
  }, [enabled, tapete])

  // Cierre por clic fuera y por Esc, molde H4: listener `pointerdown` en
  // captura y NO BLOQUEANTE (nada de overlay). Este panel vive DURANTE la mano
  // — v1.0 §4: no bloquea ni pausa el juego—, así que el clic fuera cierra Y su
  // acción procede, exactamente como en el menú que lo abre.
  useEffect(() => {
    if (!abierto) return
    const onDown = (e) => {
      if (e.target.closest && e.target.closest('.tapetes-panel, .utilities-trigger')) return
      cerrar()
    }
    const onKey = (e) => { if (e.key === 'Escape') cerrar() }
    document.addEventListener('pointerdown', onDown, true)
    document.addEventListener('keydown', onKey, true)
    // el ancla se midió una vez: si la ventana cambia de tamaño deja de ser
    // válida, y un panel mal anclado es peor que un panel cerrado
    window.addEventListener('resize', cerrar)
    return () => {
      document.removeEventListener('pointerdown', onDown, true)
      document.removeEventListener('keydown', onKey, true)
      window.removeEventListener('resize', cerrar)
    }
  }, [abierto, cerrar])

  return {
    tapete, activo, comprados, previa, dialogo,
    abierto, ancla, abrir, cerrar, presionar, confirmar, revertir,
  }
}
