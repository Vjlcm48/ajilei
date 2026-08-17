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
//
// `swatch` es el color del disco del panel: el tono medio de cada familia, o
// sea el mismo `--green-base` del que parte la variante (ver tapetes.css). Vive
// aquí y no sólo en el CSS porque el panel lo pinta inline: un swatch que no
// fuera EL color real del tapete sería una promesa falsa. El Tricolor lo
// declara como degradado porque su tapete también lo es.
export const TAPETES = [
  {
    id: 'verde',
    nombre: 'Verde clásico',
    descripcion: 'El de siempre',
    precio: 0,
    swatch: '#235c38',   // --green-base, sin tocar
  },
  {
    id: 'grafito',
    nombre: 'Negro grafito',
    descripcion: 'Sobrio y neutro',
    precio: 10000,
    swatch: '#3b3f44',
  },
  {
    id: 'azul',
    nombre: 'Azul profundo',
    descripcion: 'Frío y hondo',
    precio: 15000,
    swatch: '#233c5c',
  },
  {
    id: 'vinotinto',
    nombre: 'Vinotinto',
    descripcion: 'Cálido y criollo',
    precio: 25000,
    swatch: '#5c232e',
  },
  {
    id: 'tricolor',
    nombre: 'Tricolor',
    descripcion: 'La mesa vestida de tricolor',
    precio: 50000,
    // Las tres bandas del tapete, en su orden y sus tonos exactos (tapetes.css).
    // No es la bandera: es el tratamiento profundo, desaturado, del tapete.
    swatch: 'linear-gradient(to bottom, #3c331b 0%, #1c2e45 50%, #3e191e 100%)',
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
export const TAPETES_COMPRADOS_KEY = 'ajilei.tapetes.comprados'

export function tapetePorId(id) {
  return TAPETES.find(t => t.id === id) ?? null
}

// El default es GRATUITO y por tanto propiedad de todos desde el primer
// arranque (v1.0 §1). No se compra, no se pierde y no se pinta con precio.
export function esGratuito(id) {
  return (tapetePorId(id)?.precio ?? 0) === 0
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
