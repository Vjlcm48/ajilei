// ── EMB-2 · Tapetes: catálogo sellado ────────────────────────────────────────
// Documento rector: docs/AJILEI_Tapetes_v1.0.md §1 (catálogo y precios) y §5
// (persistencia). FUENTE ÚNICA que consumen la app, los tests y el arnés: nunca
// una copia paralela. Módulo sin React ni DOM, para que `node` lo importe tal
// cual (molde de config/niveles.js y de config/consultas.js).
//
// PROHIBIDO hardcodear montos o nombres en JSX (v1.0 §1, y lección ARN-1: los
// rótulos son copy). Si un número de este archivo se mueve, se mueve en toda la
// app a la vez; ése es el punto.

// Identificadores internos: son el CONTRATO y no se renombran nunca — el CSS
// los lee como valor de `data-tapete` y el arnés los siembra en localStorage.
// El rótulo visible vive en `nombre` y es copy PROVISIONAL (v1.0 §1): Victor lo
// ajusta en su checkpoint, y por eso vive separado del valor desde el día 1.
//
// `precio` en FICHAS. Los precios son constantes deliberadas, no fórmula: la
// escalera ES el diseño (v1.0 §1) — a mayor carga venezolana, mayor precio, del
// grafito sobrio al Tricolor insignia. No se derivan de nada.
export const TAPETES = [
  {
    id: 'verde',
    nombre: 'Verde clásico',
    descripcion: 'El de siempre',
    precio: 0,
    tonos: false,
  },
  {
    id: 'grafito',
    nombre: 'Negro grafito',
    descripcion: 'Sobrio y neutro',
    precio: 10000,
    tonos: true,
  },
  {
    id: 'azul',
    nombre: 'Azul profundo',
    descripcion: 'Frío y hondo',
    precio: 15000,
    tonos: true,
  },
  {
    id: 'vinotinto',
    nombre: 'Vinotinto',
    descripcion: 'Cálido y criollo',
    precio: 25000,
    tonos: true,
  },
  {
    id: 'tricolor',
    nombre: 'Tricolor',
    descripcion: 'La mesa vestida de tricolor',
    precio: 50000,
    tonos: false,
  },
]

// El default de todo usuario. Sin atributo aplicado = verde byte-idéntico
// (v1.0 §3): el verde NO existe como regla CSS, es la ausencia de variante.
export const TAPETE_POR_DEFECTO = 'verde'

// Claves de persistencia. Convención del proyecto: `ajilei.<cosa>`, igual que
// `ajilei.nivel` (config/niveles.js), `ajilei.consultas` (config/consultas.js) y
// `ajilei.sound` (SoundContext). Pre-login viven en localStorage; con el login
// migran a Supabase junto a la propiedad y el descuento, que nacen juntos y
// autoritativos (v1.0 §5).
//
// Son DOS claves y no una porque son dos cosas de vida distinta: el activo es
// una preferencia que cambia a diario y la propiedad es un hecho que sólo
// crece. Meterlas en un mismo blob obligaría a reescribir la propiedad cada vez
// que el jugador cambia de tapete — más superficie para perderla.
export const TAPETE_KEY = 'ajilei.tapete'
// TIE-1 1a · el tono del tapete en uso, copia del servidor como `ajilei.tapete`.
export const TAPETE_TONO_KEY = 'ajilei.tapete.tono'
// TIE-1 1a · LEGADO. Hasta la 1a la propiedad vivía aquí, en el aparato, y se
// «compraba» sin cobrar. Ya no se lee: lo comprado es lo que diga
// `mi_inventario` (INV-76). La clave sólo se nombra para borrarla al arrancar.
export const TAPETES_COMPRADOS_LEGADO = 'ajilei.tapetes.comprados'

// ── TIE-1 1a · Los tonos ────────────────────────────────────────────────────
// Tres por tapete de pago con `tonos: true` (grafito, azul, vinotinto); el verde
// y el tricolor no tienen. 'actual' es el de siempre y no lleva atributo: los
// otros dos se pintan con `data-tapete-tono` (tapetes.css §1b). Espejo del
// servidor: `articulo_con_tonos` en `20261031150000_tie1a_inventario.sql`.
export const TONOS = ['claro', 'actual', 'oscuro']
export const TONO_POR_DEFECTO = 'actual'

export function tapetePorId(id) {
  return TAPETES.find(t => t.id === id) ?? null
}

// El default es GRATUITO y por tanto propiedad de todos desde el primer
// arranque (v1.0 §1). No se compra, no se pierde y no se pinta con precio.
export function esGratuito(id) {
  return (tapetePorId(id)?.precio ?? 0) === 0
}

/** ¿El tapete tiene los tres tonos? */
export function conTonos(id) {
  return tapetePorId(id)?.tonos === true
}

// Formato de monto de la casa: "10.000". No había formateador de saldo en el
// proyecto —`BalanceDisplay` pinta la cifra cruda— así que nace aquí, junto a
// los únicos montos que hoy necesitan miles. Función pura y sin `Intl`: el
// arnés y Vitest la corren en Node, donde el juego de locales instalado no es
// una constante del entorno, y una cifra de precio no puede depender de eso.
export function montoTexto(n) {
  const s = String(Math.trunc(Math.abs(n)))
  const conPuntos = s.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return n < 0 ? `-${conPuntos}` : conPuntos
}
