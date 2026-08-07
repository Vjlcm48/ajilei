// ── DSK-U3 · "Mano actual": constantes selladas ──────────────────────────────
// Documento rector: docs/AJILEI_Menu_Utilidades_v1.3.md §2 y §3.
// FUENTE ÚNICA que consumen la app Y el arnés (modo u3), nunca una copia
// paralela — la lección que dejó U2 con las 12 frases. Un módulo sin React ni
// DOM, para que `node` pueda importarlo tal cual.

// Contador GLOBAL único de consultas: acumulable entre escenarios, mesas y
// dificultades (v1.1 §3.4). Pre-login vive en localStorage, con la limitación
// conocida y aceptada de la Fase 1 (manipulable borrando los datos del
// navegador); con login migra al ledger de Supabase como autoridad (§3.6).
export const CONSULTAS_KEY = 'ajilei.consultas'
export const CONSULTAS_GRATIS = 20

// Autocierre de lectura del popup del VALOR. Es la única pausa que la campaña
// admite (v1.1 §5): tiempo de leer dos líneas sin quedarse colgado en la mesa.
export const CONSULTA_POPUP_MS = 4000

// Autocierre del popup del CONTADOR (badge). Sellado en U1b y NO se toca aquí:
// se muda a este módulo para que el arnés lo lea de la misma fuente que la app.
export const BADGE_POPUP_MS = 2000
