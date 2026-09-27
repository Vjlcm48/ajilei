# AJILEI · CAP-1 · Informe de cierre

**Versión:** 1.0 · 2026-09-26
**Campaña:** CAP-1: capturas nuevas de la Portada (escena 5) y de la `og-image`
**Base:** `main` en `82917bd` · **Ejecuta:** Claude Code · **Rector:** Claude (chat)
**Fichas:**
- `AJILEI_CAP-1_Fase0_v1.0.md`
- `AJILEI_CAP-1_Fase1_v1.0.md`
- `AJILEI_CAP-1_Fase1_Addendum1_v1.0.md`
- `AJILEI_CAP-1_Commits_v1.0.md`

**Informes:**
- `docs/reportes/AJILEI_CAP-1_Fase0_Informe_v1.0.md`
- `docs/reportes/AJILEI_CAP-1_Fase1_Informe_v1.0.md`

---

## 1. Qué cambió

- **Tres maestras nuevas, tomadas y selladas por el arnés**, versionadas en `maestras/portada/`:
  - `mesav.png`: teléfono de la escena 5;
  - `mesapc.png`: laptop de la escena 5 y, más adelante, DIS-1;
  - `mesah.png`: sólo la `og-image`.

  Las fabrica `node scripts/diagPUE.mjs cap --sellar` contra `vite preview`, con semilla sellada, tamaño exacto, sin barras del sistema y una traza en `cap.json`. Las capturas a mano de antes (`PUE_*_demo.*`, en la raíz) no cambian: alimentan la lámina histórica.
- **Derivados de la escena 5 regenerados** (`src/assets/portada/mesav.webp` y `mesapc.webp`) desde las maestras nuevas. Ya enseñan la mesa actual: índice digital (IDX-1), luz (LUZ-1) y reverso único (REV-1).
- **`public/og-image-v2.jpg`:** la variante C, una captura horizontal estrecha de 686×360 @3 cuya caja dorada **cubre** la tarjeta de 1200×630 casi sin recorte.
- **Versionado de la `og-image`:** `index.html` apunta `og:image` y `twitter:image` a `og-image-v2.jpg`. El nombre sale de `OG_DESTINO` en `scripts/gen-portada-assets.mjs`, y `public/og-image.jpg` se conserva una campaña.
- **Caché:** `public/_headers` gana la regla `/og-image*` → `Cache-Control: public, max-age=86400`. La de `/assets/*` sigue intacta.
- **Arnés:**
  - modo `cap` (fuera de `todo`) y modo `capvis` (dentro de `todo`) en `scripts/diagPUE.mjs`;
  - la lógica, en `scripts/cap/capMesa.mjs`;
  - `capturas-cap/` ignorada.
- **Sistema de Diseño:** IDX-1 D-14 queda marcado como cerrado por CAP-1.

## 2. Decisiones

**De Victor:**
- Las capturas las toma el arnés, no una persona a mano.
- Se publican ya, dentro de los aparatos planos actuales, antes de DIS-1; DIS-1 reutiliza las mismas maestras.
- Semilla **5**: la mano del jugador es 3E · Rey E · As C · Rey B · 5O.
- Una sola mesa para las tres maestras: **mesa 200, pozo 2000**.
- En pantalla: **«Tú» · 3600 Heptacoins · Mesa 200** y el cronómetro en **«20s»**.
- `og-image`: **variante C**, aceptando que cruza el escalón `max-width: 772px` del mazo en apaisado.

**Del rector:**
- **Sesión simulada** contra 4173, con toda la red a Supabase interceptada por `page.route`. Los datos falsos viven sólo en `scripts/`.
- Vertical a **360×704 @3**, el viewport real del S25 en standalone.
- **`cap.estable` por tolerancia:** ≥ 99,9 % de los píxeles con Δ ≤ 2 y Δ máximo ≤ 40. La huella queda como trazabilidad en `cap.json`.
- **Varas de `capvis`:** teléfono ≥ 90 %; laptop ≥ 91 %, y ≥ 89 % a 360×640.
- **`1.8b` de `diagPUE` como rojo conocido:** 219,0 KiB frente a un techo de 200, anterior a CAP-1. El techo no se toca.
- **`maestras/portada/` versionada.** `og-image-v2.jpg` y conservar `og-image.jpg` una campaña.

## 3. Cifras

**Parte visible de cada captura en la escena 5** (fracción del alto del derivado; modo `capvis`):

| Viewport | Teléfono antes → después | Laptop antes → después |
|---|---|---|
| S25 360×780 | 92,9 % → 91,16 % | 61,9 % → **92,09 %** |
| 390×844 | 92,9 % → 91,16 % | 62,0 % → **92,20 %** |
| 360×640 | 92,9 % → 91,17 % | 60,5 % → **89,97 %** |
| 1920×1080 | 92,9 % → 91,16 % | 64,0 % → **95,19 %** |

Antes, la laptop perdía la cabecera y la botonera; ahora las enseña.

**Pesos:**

| Derivado | Antes | Después | Techo |
|---|---|---|---|
| `mesav.webp` | 30 886 B · 340×679 | 35 280 B · 340×692 | 81 920 |
| `mesapc.webp` | 49 914 B · 820×686 | 31 050 B · 820×461 | 122 880 |
| `og-image` | `og-image.jpg` 109 974 B (contener, con bandas) | `og-image-v2.jpg` 117 065 B (cubrir, 4,57 px CSS por lado) | 204 800 |

Las cinco copas de la Portada siguen idénticas al byte a `82917bd`.

**Maestras** (Edge **154.0.4258.37**, semilla 5, sha256 completo):

| Maestra | Viewport | Dimensiones | Bytes | sha256 |
|---|---|---|---|---|
| `mesav.png` | 360×704 @3 | 1080×2112 | 1 169 975 | `198289a8f290fca3bc603e5e2b4b941fd3b34bc21c3323101a0573e431ad43bc` |
| `mesah.png` | 686×360 @3 | 2058×1080 | 1 097 468 | `1e13575a3f10a1f1b3afb37db63d10584250f99762bf8b3ed489d49aaaae2710` |
| `mesapc.png` | 1366×768 @2 | 2732×1536 | 1 757 307 | `6bca77f6bb092d3c3a0e36f9cc0cc47d6a495e96a0d441ace14f991a9d6761a6` |

**Regresión antes de los commits:**
- build limpio;
- vitest 1 006/1 006;
- lint 20 errores y 1 aviso (línea base);
- `diagPUE` completo: 122 verdes y 1 rojo conocido (`1.8b`);
- `cap` sin `--sellar` contra las selladas: verde.

## 4. Lecciones

1. **«Dos pasadas idénticas al byte» no prueba reproducibilidad cuando el rasterizado por GPU tiene más de un estado.**
   - Las tres vistas mostraron dos estados recurrentes, estables cada uno, que sólo difieren en los degradados radiales del tapete y del óvalo: el 97 % de los píxeles distintos a Δ1.
   - Una pareja salió verde con el estado minoritario, así que una puerta al byte puede sellar cualquiera de los dos y ponerse en rojo con la próxima versión de Edge sin que la mesa cambie.
   - La puerta de estabilidad se juzga por tolerancia; la huella queda como trazabilidad.
2. **Sin sesión, `vite preview` no llega a la mesa.** `AUTH_BYPASS` es `DEV && VITE_AUTH_BYPASS`, así que el build de producción se queda en la Portada. La vía sellada para fotografiar el artefacto real es una sesión simulada en `localStorage` con **toda** la red a Supabase interceptada. La puerta `cap.red` exige cero peticiones fuera de la ruta.
3. **Lo que un marco con `object-fit: cover` recorta no se ve a ojo: se mide.** La captura a mano llevaba meses enseñando el 60–64 % en la laptop. `capvis` queda en `todo` para que no vuelva a pasar en silencio.

## 5. Commits

| Commit | SHA |
|---|---|
| CAP-1a · modos `cap` y `capvis`, `.gitignore` | `e664828f656cb5d301de751ced35e62e388e202d` |
| CAP-1b · maestras selladas y generador | `59ad115a5b9469202b65717a76ae725bacf0107e` |
| CAP-1c · derivados, `og-image-v2`, `index.html`, `_headers` | `5704f4c7b8c7565866960847f1cb49c70b920eb6` |
| CAP-1d · informes de las fases y nota del Sistema de Diseño | `bf683b7c0ae966b7456c8979b195dd58118bab9e` |
| CAP-1e · este informe | el commit que lo contiene |

## 6. Pendientes que deja la campaña

1. **`1.8b` de `diagPUE`:** rojo conocido. El camino crítico mide 219,0 KiB en el cable frente a un techo de 200, por el JS (179,1 KiB) y el CSS (33,2 KiB) del bundle. Pide una tanda propia.
2. **Limpieza manual (Victor):** `capturas-cap/_taller/`, y `capturas-cap/maestras/mesav_pasada2.png` y `mesapc_pasada2.png`. La carpeta está ignorada.
3. **`public/og-image.jpg`** se retira en una campaña futura (DIS-1 o posterior), junto con la frase que lo menciona en `index.html` y en `_headers`.
4. **Tras el despliegue:** Sharing Debugger de Facebook («Scrape Again») sobre `https://ajilei.io/` y prueba en WhatsApp con `https://ajilei.io/?s=2`, para ver la tarjeta nueva sin la caché del chat.
5. **DIS-1** parte de las maestras de `maestras/portada/`, a resolución nativa. Para regenerarlas: `npm run build`, `npx vite preview --port 4173` y `node scripts/diagPUE.mjs cap --sellar`.
