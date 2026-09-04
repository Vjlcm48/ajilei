# AJILEI — Cierre FRZ-1 · Commits y push · v1.0

**Instrucción para Claude Code · 04-sep-2026**

---

## Contexto

Victor validó FRZ-1 Fase 1 en 4173 con OTP real (escritorio) y en el S25 por red local, pantalla bloqueada: turno del humano congelado en el mismo segundo, descarte en vuelo terminando a oscuras y máquina de turnos esperando al regreso, IA jugando una sola vez tras volver, silencio absoluto durante la ausencia. **Aprobado.** Se autoriza el cierre y el despliegue.

Base: `main` en `3ea2e27`. Árbol: `GameTable.jsx` modificado, `useCongelado.js` y `useCongelado.test.js` nuevos, más los cuatro residuos de siempre.

## Mandato

1. **Atómico por ruta explícita.** `git add -A` / `git add .` prohibidos.
2. Archivos protegidos según `docs/AJILEI_Protegidos_v1.0.md` (commit `25290bb`). Ninguno participa.
3. **Un solo push al final**, tras verificación sobre el árbol commiteado. `git push` en `ask`: la compuerta la responde Victor.
4. Mensajes en el estilo de la casa (`CAMPAÑA-n: qué cambia`, prefijo sin tilde como el historial).

## Paso 0 — Un hunk que se abre ahora: `npm test` debe ver `src/`

Hoy `npm test` es `vitest run scripts/` y el test del hook solo corre con `npx vitest run`. Un verde que nadie ejecuta por el camino habitual no es un verde. Cambia el script `test` en `package.json` para que cubra `scripts/` **y** `src/` (la forma mínima: `vitest run scripts/ src/`, o quitar el filtro si vitest ya descubre ambos sin recoger nada indeseado — verifica que la cuenta siga siendo 467 y ninguno más). Solo ese hunk; nada más de `package.json` se toca. Confirma `npm test` verde con el hook incluido antes de commitear.

## Paso 1 — Los commits

| # | Campaña | Contenido | Archivos |
|---|---------|-----------|----------|
| 1 | FRZ-1a | El hook `useCongelado`: visibilidad, volumen con memoria, slot único de continuación; y su test declarado | `src/hooks/useCongelado.js`, `src/hooks/useCongelado.test.js` |
| 2 | FRZ-1b | La mesa se congela con la visibilidad: guardas en reloj de turno, IA, retirados y arranque de mano; handle a los dos relojes de mano nueva | `src/components/GameTable.jsx` |
| 3 | GOV-2 | `npm test` cubre `src/` además de `scripts/` | `package.json` |

Orden 1 → 2 → 3: el hook antes que quien lo importa, y la gobernanza al final, sobre un árbol que ya contiene el test que justifica el cambio. Tras cada commit, `git status --short`: lo pendiente coincide con lo que el plan dice que falta. Discrepancia = STOP.

## Paso 2 — Verificación pre-push (árbol commiteado)

1. `git log --oneline -4` — los tres commits sobre `3ea2e27`.
2. `git status --short` — solo los cuatro residuos declarados.
3. `npm run build` verde.
4. `npm test` verde — **por el script de la casa**, no por `npx` — con los 10 casos del hook dentro de la cuenta.
5. Arnés: `gate` 6/6, `mon` 11/11, `2.5` con el halo, `puerta` 6/6 contra 4173.
6. `npx eslint .` en la línea base (20).

Si cualquiera falla: **STOP sin push**.

## Paso 3 — Push y ceremonia de tres SHA

`git push` (compuerta de Victor) → `git rev-parse HEAD` · `git rev-parse origin/main` · `git ls-remote origin main`. Los tres idénticos, textuales.

## Cierre

**STOP final.** Reporte con: los tres commits (SHA corto + mensaje), la ceremonia de tres SHA, los seis puntos de verificación, y `git status`. Cloudflare construye desde `main`; Victor verifica `https://ajilei.io` desde la app instalada en el S25 — ahora sí con FRZ-1 dentro — y el iPhone de la familia queda en vigilancia (camino `pagehide` de iOS, el único que ningún aparato ha ejercitado).

**Cola abierta tras este cierre**: `GT-HIG` (siete relojes sin handle en el juego) · `ARN-x` (sonda CDP cruda como arnés permanente) · MON-2.1 (sombra en empaquetado) · retiro de vectores 2D / `heptacoin.svg` con diagnóstico · Identidad A al dominio · S8 bajo freeze si algún día importa · PvP (temporizador visible, auto-jugada, reconexión) cuando exista.
