// ── arnes/unidad.mjs · ARN-4 A1 · lo PURO de la letra de la unidad ───────────
// Windows no distingue `c:` de `C:`, pero la caché de módulos de node sí: con el
// proceso en `c:\…` vitest se carga dos veces y caen todos los archivos, con
// «reading 'config'» y «failed to find the runner» (Fase 0 de ARN-4, §2.2).

/** La ruta con la letra de su unidad en mayúscula. Lo que no empieza por `x:` no cambia. */
export const corregirUnidad = (ruta) => String(ruta).replace(/^[a-z]:/, (u) => u.toUpperCase())

/** ¿La ruta empieza por una unidad en minúscula? */
export const unidadEnMinuscula = (ruta) => /^[a-z]:/.test(String(ruta))
