# AJILEI — Cierre CAR-1 · Commits y push · v1.0

**Instrucción para Claude Code · 05-sep-2026**

---

## Contexto

Victor validó CAR-1 Fase 1 en 4173 con OTP real y en el S25 por red local: figuras nítidas en la mano, en el showdown del rival, en mesa 5 y en mesa 2; carga inmediata en todos los casos; decorativas de la Bienvenida correctas en escritorio. **Aprobado.** Se autoriza el cierre y el despliegue.

Base: `main` en `3e8cd15`. Árbol: `App.jsx`, `CardImage.jsx`, `WelcomeScreen.jsx` modificados; `public/_headers`, `scripts/gen-cards.mjs`, `src/lib/precargaBaraja.js` y `src/assets/cards/webp/` (40 archivos) nuevos; más los cuatro residuos de siempre.

## Mandato

1. **Atómico por ruta explícita.** `git add -A` / `git add .` prohibidos. Los 40 WebP entran por directorio (`git add src/assets/cards/webp/`) — es una ruta explícita, y `git status` tras el commit confirma que fueron exactamente 40.
2. Archivos protegidos según `docs/AJILEI_Protegidos_v1.0.md` (commit `25290bb`). Ninguno participa.
3. **Un solo push al final**, tras verificación sobre el árbol commiteado. `git push` en `ask`: la compuerta la responde Victor.
4. Mensajes en el estilo de la casa, prefijo sin tilde.
5. Cifras del arnés vigentes: `gate` matriz 4/4 `matrixOk` · `puerta` 6/6 · `mon` 12/12 · `2.5` 10/10.

## Paso 1 — Los commits

| # | Campaña | Contenido | Archivos |
|---|---------|-----------|----------|
| 1 | CAR-1a | Generador de la baraja WebP q80 320×452 y sus 40 derivados; los PNG quedan como maestros | `scripts/gen-cards.mjs`, `src/assets/cards/webp/` (40) |
| 2 | CAR-1b | La mesa y la Bienvenida pintan desde los derivados; `URLS_BARAJA` exportada | `src/components/CardImage.jsx`, `src/components/WelcomeScreen.jsx` |
| 3 | CAR-1c | Precarga de la baraja junto a los sonidos, al salir de la Bienvenida | `src/lib/precargaBaraja.js`, `src/App.jsx` |
| 4 | GOV-3 | Cabeceras Cloudflare: `/assets/*` inmutable a un año; `public/` sigue revalidando | `public/_headers` |

Orden 1 → 2 → 3 → 4: los derivados antes que quien los importa; la precarga después de que `URLS_BARAJA` exista; la gobernanza al final porque arregla el sitio entero, no solo las cartas. Cada commit deja el build verde por sí solo (el 1 no cambia nada del código; el 2 ya no referencia PNG; el 3 importa lo que el 2 exportó). Tras cada commit, `git status --short`: lo pendiente coincide con lo que el plan dice que falta. Discrepancia = STOP.

## Paso 2 — Verificación pre-push (árbol commiteado)

1. `git log --oneline -5` — los cuatro commits sobre `3e8cd15`.
2. `git status --short` — solo los cuatro residuos declarados.
3. `npm run build` verde; `dist/assets/` 40 WebP de carta y 0 PNG; `dist/_headers` presente.
4. `npm test` verde (467).
5. Arnés: `gate` 4/4 · `puerta` 6/6 contra 4173 · `mon` 12/12 · `2.5` 10/10.
6. `npx eslint .` en la línea base (20 + 1 aviso).
7. Protegidos: los cinco INTACTO contra `3e8cd15`.

Si cualquiera falla: **STOP sin push**.

## Paso 3 — Push y ceremonia de tres SHA

`git push` (compuerta de Victor) → `git rev-parse HEAD` · `git rev-parse origin/main` · `git ls-remote origin main`. Los tres idénticos, textuales.

## Paso 4 — Verificación post-despliegue (la que no se pudo hacer antes)

Cuando Cloudflare termine la construcción (unos minutos; Victor avisa o se sondea `https://ajilei.io` hasta que el `index.html` referencie el JS con hash nuevo):

1. `curl -I` contra una carta WebP en producción (la URL sale del `dist/assets/` del build local, mismo hash). Esperado: `content-type: image/webp` y `cache-control: public, max-age=31536000, immutable`.
2. `curl -I https://ajilei.io/` — el `index.html` **no** debe llevar `immutable`.
3. `curl -I https://ajilei.io/heptacoin.webp` — tampoco (zona `public/`).

Las tres líneas de `cache-control`, textuales, en el reporte. Si la carta no viene `immutable`, el `_headers` no fue leído: STOP y reporta — el código ya está desplegado y funciona sin él; solo falta la mitad barata.

## Cierre

**STOP final.** Reporte con: los cuatro commits (SHA corto + mensaje), la ceremonia de tres SHA, los siete puntos de verificación, las tres cabeceras de producción, y `git status`. Victor cierra desde la app instalada del S25 contra `ajilei.io`.

**Cola abierta tras este cierre**: `heptacoin.webp` 1 MB en la Portada (el doble que la baraja; MON-2.1) · `baraja.svg` / `baraja2.svg` 5,2 MB en cola de retiro · corrección de etiqueta en la doctrina de los dos caminos (mesa 2 = `opp-panel` dentro de `.rivals-zone`, no `.ai-zone`) para la próxima pasada de docs · `GT-HIG` · `ARN-x` · Identidad A al dominio · iPhone en vigilancia (FRZ-1 `pagehide`).
