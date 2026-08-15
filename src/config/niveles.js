// ── NIV-UI · Niveles de dificultad: constantes selladas ──────────────────────
// Documento rector: docs/AJILEI_Modos_y_Asistencia_v1.0.md §3 (nombres y tablas)
// y §4 (pantallas). FUENTE ÚNICA que consumen la app, los tests y —el día que
// haga falta— el arnés: nunca una copia paralela. Módulo sin React ni DOM, para
// que `node` lo importe tal cual (molde de config/consultas.js en U3).
//
// PROHIBIDO hardcodear montos o nombres en JSX. Si un número de este archivo se
// mueve, se mueve en toda la app a la vez; ése es el punto.

// Identificadores internos: son el CONTRATO (v1.0 §3.1) y no se renombran
// nunca. El rótulo visible vive en `nombre` y puede cambiar —un sabor
// venezolano futuro es cambio de cadena de texto, no de código— justamente
// porque rótulo y valor viven separados desde el día 1.
export const NIVELES = [
  {
    id: 'basico',
    nombre: 'Básico',
    // Copy PROVISIONAL (instrucción NIV-UI §0): Victor lo ajusta en su
    // checkpoint. Es texto, es barato.
    descripcion: 'El juego de siempre',
    apuestas: [50, 100, 150, 250],
  },
  {
    id: 'avanzado',
    nombre: 'Avanzado',
    descripcion: 'Rivales que piensan más',
    apuestas: [100, 200, 300, 500],   // las apuestas de hoy suben un peldaño (v1.0 §3.2)
  },
  {
    id: 'pro',
    nombre: 'Pro',
    descripcion: 'El reto mayor',
    apuestas: [200, 400, 600, 1000],
  },
]

// El SOLAPAMIENTO de las tablas es intención sellada (v1.0 §3.3): el 100 está
// en Básico y en Avanzado, el 200 en Avanzado y en Pro. Es la costura que
// permite subir de nivel SIN subir de apuesta, para que el salto de dificultad
// se pruebe con el bolsillo quieto. No es un descuido: no se "corrige".

export const NIVEL_POR_DEFECTO = 'basico'

// Clave de persistencia. Convención del proyecto: `ajilei.<cosa>`, igual que
// `ajilei.consultas` (config/consultas.js) y `ajilei.sound` (SoundContext).
// Pre-login vive en localStorage; con login migra a Supabase junto al resto de
// la preferencia de usuario (v1.0 §4.2).
export const NIVEL_KEY = 'ajilei.nivel'

export function nivelPorId(id) {
  return NIVELES.find(n => n.id === id) ?? null
}

// Los 4 montos del nivel. Un id desconocido cae al nivel por defecto en vez de
// devolver una lista vacía: una pantalla sin apuestas no es un error legible.
export function apuestasDe(id) {
  return (nivelPorId(id) ?? nivelPorId(NIVEL_POR_DEFECTO)).apuestas
}
