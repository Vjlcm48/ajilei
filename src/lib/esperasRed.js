// ── PES-1 · Los reintentos de la casa ───────────────────────────────────────
// Rector: AJILEI_PES-1_Fase1_v1.0.md §3-A. Vivían en `controlMesaIA`, y `useAuth`
// y `billeteraCore` los pedían de allí: una constante arrastraba al paquete de
// entrada el canal de la mesa y, detrás, el motor entero (Fase 0 §5). Módulo
// propio y sin dependencias, para que no pueda volver a arrastrar nada.
export const ESPERAS_RED_MS = Object.freeze([1000, 2000, 4000, 8000, 15000])
