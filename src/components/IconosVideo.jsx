// ── ECO-1g · Los tres iconos del video de recompensa ────────────────────────
// De la lámina aprobada (`laminas/eco1f`). Heredan el color (`currentColor`) y
// el tamaño lo fija la hoja (`video.css`), como los de `IconosLobby`.

export const IconoPlay = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M8.5 5.8v12.4a.8.8 0 0 0 1.2.7l10-6.2a.8.8 0 0 0 0-1.4l-10-6.2a.8.8 0 0 0-1.2.7Z" fill="currentColor" />
  </svg>
)

export const IconoBolsa = () => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M9 4.5h6l-1.4 3.2h-3.2L9 4.5Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    <path d="M10.2 7.7C7.3 9.6 5.5 12.6 5.5 15.3c0 2.7 2.3 4.2 6.5 4.2s6.5-1.5 6.5-4.2c0-2.7-1.8-5.7-4.7-7.6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
)

export const IconoX = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
)
