# AJILEI · PAN-2 · Tanda 1 · Informe de cierre · v1.0

**Fecha:** 2026-11-27 (la tanda se abrió el 2026-11-26; las pruebas en los teléfonos, el 27).
**Ficha:** `AJILEI_PAN-2_T1_v1.0.md`. **Base:** `main` = `origin/main` = `cb4ade0`. **Respaldo:** `respaldo-pan-2`.
**Decisiones del rector sobre las §P de la Fase 0:**

| §P | Decisión |
|---|---|
| P1 | P1-B |
| P2 | nada |
| P3 | no entra |
| P4 | solo si P1-B falla; no hizo falta |
| P5 | sí |
| P6 | la contesta Victor aparte |

**Paradas:** STOP-T, aprobado; STOP-C.

---

## 1 · Qué se hizo

La franja blanca del S25 en la app instalada era el margen que Chrome reserva para el recorte de la cámara cuando la página no declara `viewport-fit=cover`. La tanda declara `cover` **solo cuando la app está instalada en Android** (`display-mode: fullscreen`), en vivo al arrancar. Es FS-1 en su forma mínima.

- **`src/lib/viewportCover.js`** (nuevo). Es un núcleo puro, con `doc` y `win` por parámetro, en el molde de `pantallaCompletaCore.js`.
  - `debeCubrir(win)`: verdadero solo si casa `(display-mode: fullscreen)`. Ni `standalone`, ni iOS, ni la pestaña.
  - `aplicarCover(doc, win)`: añade `, viewport-fit=cover` a la meta del viewport una sola vez. Si la meta ya declara otro `viewport-fit`, no lo pisa. Devuelve si lo aplicó y nunca lanza.
- **`src/main.jsx`**: una llamada, `aplicarCover(document, window)`, antes de `createRoot`, con su import y dos líneas de comentario (+5 líneas).
- **`src/lib/viewportCover.test.js`** (nuevo). Tiene 6 casos: los cuatro de la ficha y dos más.
  1. Instalada: añade `cover` una vez.
  2. Dos llamadas siguen dejando un solo `viewport-fit`.
  3. `standalone`, la pestaña (`browser`) o nada: no se toca la meta.
  4. Sin `matchMedia`, sin meta o con un DOM que lanza: no lanza y devuelve falso.
  5. Un `viewport-fit` ya declarado no se pisa.
  6. `main.jsx` lo llama antes de `createRoot`.
- **Sin tocar:**
  - `index.html`: la meta sigue sin `cover`, así que la pestaña de Chrome (PAN-1) e iOS no cambian.
  - el manifiesto;
  - `pantallaCompletaCore.js`: R5 sigue tal cual, y la app instalada no pide la pantalla completa;
  - `escala.js`, la mesa y los siete protegidos;
  - el arnés y `diagDSK`.
- **CSP:** ni `public/_headers` ni `wrangler.jsonc` llevan CSP. Si algún día la llamada tuviera que pasar a un `<script>` en línea en la cabecera, nada lo impide. No hizo falta: no hubo parpadeo (§2).

## 2 · STOP-T · Lo que Victor vio en los teléfonos (2026-11-27)

La app se instaló **desde el túnel**, con un build aparte de `dist/` servido por `vite preview` en el 4174. El hash de entrada fue `index-BbjqEodG.js`, el mismo en los dos túneles: el del 26 no llegó a usarse y el del 27 se levantó sobre el mismo árbol.

| # | Dónde | Resultado |
|---|---|---|
| T1 | S25, instalada, vertical, lobby | **Verde.** Sin franja blanca. |
| T2 | S25, mesas de 3 y de 5 contra las IAS | **Verde.** Bajo la cámara no queda nada relevante. |
| T3 | S25, Portada | **Verde.** |
| T4 | S25: girar, bloquear y desbloquear, tocar arriba | **Verde.** Sin franja en ningún estado, sin aviso de Chrome. |
| T5 | S25, pestaña de Chrome | **Verde.** PAN-1 intacto. |
| T6 | Motorola, instalada, vertical | **Verde.** Sigue en pantalla completa, sin aviso y sin ningún cambio visible. |
| T7 | S25: ⚙, Sumamente, «Cómo se juega» y un capítulo | **Verde.** |

- **Sin parpadeo blanco al abrir** en el S25. La llamada se queda en `main.jsx`.
- **La regla de §2 de la ficha no se disparó.** Nada que se lea o se toque quedó bajo el agujero, así que no hizo falta la reserva en la mesa ni en la Portada.
- **P6 (tema oscuro del sistema): sin medir.** Queda como **pendiente, sin bloquear**. Ya no hace falta para decidir, porque `cover` quitó la franja, pero confirmaría que el blanco era el fondo nativo de la ventana.
- **P4 (diagnóstico en pantalla):** no entró. P1-B bastó sola.

## 3 · Varas

| Vara | Resultado |
|---|---|
| vitest (`npm test`) | **121 archivos, 3213 pruebas, verde.** En `cb4ade0` eran 120 y 3207: +1 archivo y +6 casos, los de `viewportCover.test.js`. |
| `viewportCover.test.js`, control rojo | Al quitar la condición de `debeCubrir` en `aplicarCover` caen **el 3 y el 4**. Restaurada: 6/6. |
| eslint (`npx eslint .`) | **0** |
| `1.8b` | **180,07 → 180,22 KiB** (180,1 → 180,2). Lo de antes es un build de `cb4ade0` al scratchpad pesado con `pesoCore.pesarDist`; lo de después, la vara. |
| `testInvariantes` (INV-45) | **Verde con la nota**, tras dos rojos propios del andamio que corregí en el acto. (1) La fuente citaba la ficha `AJILEI_PAN-2_T1_v1.0.md`, pero las fichas no viven en el repo: la cita salió. (2) En la columna del vigilante había palabras entre comillas de código que no eran rutas (`cover`, `matchMedia`…): van sin comillas y queda solo `src/main.jsx`. |
| `npm run varas -- --solo 1.8b,lec.mapa,msg,cap,tut` | Sobre `cb4ade0-dirty`, el árbol de la tanda: |
| · build | código 0 |
| · `1.8b` | **verde**, 180,2 KiB en el cable (JS 151,6 · CSS 22,0 · HTML 2,1), techo 200 |
| · `lec.mapa` | **verde**, 41 s, aislamiento verde |
| · `msg` | **rojo solo por la excepción declarada de INV-22**: el barrido «Heptacoins» con 0 medidas (0 cajas). Lo demás bien: compositor (92 casos), jugado 7/7, fin 1/1, Δ larga 7/7, caza 2/2, aislamiento verde, 18 min 56 s. Es el mismo rojo que en `a98d842` y `cb4ade0` limpios (informe de TUT-1 T7). |
| · `cap` | **verde**: 31 mediciones, 0 en rojo, 2 min 37 s |
| · `tut` | **verde**, 9 s, aislamiento verde |

Que la mesa no cambie lo dicen `lec.mapa`, `msg`, `cap` y `tut`. En el arnés (Chromium de escritorio, sin `display-mode: fullscreen`), `aplicarCover` no hace nada.

## 4 · Doctrina

- **`docs/AJILEI_Invariantes_v1.0.md`, INV-45:** lleva la nota fechada 2026-11-26.
  - Explica que, en el WebAPK de Android, Chrome reserva el margen del recorte de la cámara si la página no declara `cover`, y que desde Chrome 158 / Android 17 lo pinta blanco.
  - Dice que PAN-2 declara `cover` solo instalada, en vivo al arrancar, y que la pestaña e iOS siguen sin él: FS-1 completo sigue abierto. R5 no cambia.
  - Fuente: los dos informes de PAN-2.
  - Vigilante: `src/lib/viewportCover.test.js`, más la validación en el S25 y el Motorola.
  - La cabecera de actualizaciones también lo recoge.
- **FS-1 completo sigue abierto:** `cover` fijo en `index.html` para la pestaña de Chrome e iOS, con su repaso de iOS (IOS-1, TAB-1 y TAB-3 se midieron con los *insets* a 0) y la reserva que hoy no tienen la mesa y la Portada. PAN-2 no lo cierra ni lo empeora.

## 5 · Después del STOP-C (Victor)

1. Push de `main` con los tres SHA.
2. Borrar `respaldo-pan-2`.
3. Desinstalar los iconos del túnel del S25 y del Motorola.
4. En ajilei.io, cerrar y abrir la app instalada del S25: sin franja. No hace falta reinstalar, porque no hay service worker y `index.html` revalida. Lo mismo en el Motorola.
