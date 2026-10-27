# AJILEI · RNK-1 (Rankings) · Fase 1d · La victoria, la frescura, el arnés y los documentos · Informe · v1.0

**Ficha:** `AJILEI_RNK-1_Fase1d_v1.0.md` (rector) · **Ejecuta:** Claude Code · **Fecha:** 2026-10-27
**Base:** `main` en `2328ed1` (RNK-1 1a, 1b, 1c-i y 1c-ii publicadas). Árbol limpio al empezar, salvo lo de MOT-1 y `laminas/rnk1/`.
**Estado:** STOP-F revisado por el rector (2026-10-27: M-1 se queda así; M-2 a M-12 aceptadas; M-10 anotado para ARN-4). Ajuste C hecho (solo documentos, **D-1**); validada por Victor el 2026-10-27 (§6). **Sin commits.** Nada en `supabase/`, ningún protegido abierto, `vite.config.js` sin tocar, nada de la 1e.

---

## Resumen

- **«Ver tu nuevo ranking» abre tu mini-perfil.** Es la misma tarjeta de la 1c-ii, por portal en `<body>`, y no navega.
  - El botón está desde el primer fotograma, apagado (opacidad 0,45 y `disabled`) hasta que llega `saldoFinal`. Al llegar se enciende sin moverse ni un píxel.
  - Al cerrar la tarjeta, el foco vuelve al botón y sigues en la victoria.
  - El aviso «Próximamente» desaparece, con su temporizador y su región viva.
- **Mide lo mismo que desde Rankings,** en el mismo viewport:
  - 412×915: 379,03 × 468,25 (lámina 468,3);
  - 915×412: 600 × 277,5 (lámina 277,5);
  - 1366×768: 400 × 468,25.
  - Siempre fuera de `#root`.
- **«Puntos obtenidos» ya era una sola cifra** con el extra del AJILEI (`sesion.puntos`, desde la 1b). `Celebracion.jsx` no recalcula nada (`grep puntosDe` = 0). Hay una prueba nueva: un AJILEI de 51 ganado en Básico da 2, no 1.
- **Rankings se refresca al volver al primer plano** si la última consulta de esa pestaña tiene 60 s o más.
  - Es un refresco callado: no pasa por «Cargando…», no mueve la lista ni cambia de pestaña.
  - También refresca con la tarjeta abierta, y la tarjeta se queda.
  - No hay reloj: `setInterval` no aparece en `Rankings.jsx`.
- **Arnés:**
  - `diagCEL0 celebracion` tiene la puerta de «Ver tu nuevo ranking» reescrita.
  - `diagDSK rnk` suma la puerta 14, `rnk-fresco`.
  - Los cinco modos de la ficha salen en código 0.
- **Documentos:**
  - normativo `AJILEI_Rankings_v1.1.md`, archivo nuevo; el v1.0 queda como historia;
  - registro de invariantes: INV-65, INV-66 e INV-67, §4 y §6;
  - este informe.
- **Línea base:**
  - vitest: 77 archivos / **1.882** en verde (+9: 4 de `debeRefrescar`, 1 de la victoria y 4 de `testInvariantes` por las filas nuevas);
  - lint: los 21 de siempre;
  - build: verde, paquete principal 626,60 / 184,42 kB gzip (+0,78 / +0,24) y trozo de la mesa 95,91 / 30,49 (+0,20 / +0,12);
  - las huellas de los seis protegidos no cambian.
- **Lo que hay que decidir (§M):**
  - **M-1**, la vara «≥ 44 px» del botón, que hoy solo se cumple en el teléfono acostado.
  - **El molde para el túnel (§4):** existe por URL (`?cel`), pero por túnel haría falta `server.allowedHosts`.

---

## §1 · Línea base, arnés y huellas

| Vara | Resultado |
|---|---|
| vitest (`npx vitest run`) | 77 archivos · 1.882 pruebas en verde, 0 saltadas (en este árbol los volcados de `testBancoBandas` existen) |
| lint (`npm run lint`) | 21 problemas (20 errores y 1 aviso), los de siempre. Por archivo, igual que en `2328ed1`: `GameTable.jsx` 19, y 0 en `Celebracion.jsx`, `Rankings.jsx`, `MiniPerfil.jsx`, `App.jsx` y `Lobby.jsx`. Quitar el aviso no bajó ninguno: el código del aviso no tenía avisos de lint |
| build (`npx vite build`) | verde · `index-J_Pvk_3k.js` 626,60 kB / 184,42 gzip (base 625,82 / 184,18) · `GameTable-NhU2PHQp.js` 95,91 / 30,49 (base 95,71 / 30,37). La base se midió en una copia de `2328ed1` |
| `diagCEL0 celebracion` | **código 0** · 0 fallos · control negativo verde · 487 s |
| `diagDSK rnk` | **código 0** · 14 puertas + consola en verde · 12 s |
| `diagDSK humo` | **código 0** · gate, lob, retar y rnk en verde · 203 s |
| `diagDSK lob` | **código 0** · 42 s |
| `diagDSK webkit` | **código 0** · 40 celdas que cuentan, 10 con LIMITACIÓN (las de siempre) · 15 s |
| `grep setInterval` en `src/screens/Rankings.jsx` y `rankingsCore.js` | 0 (en `src/screens/` solo los dos de `SalaEspera.jsx`, que ya estaban) |
| `grep puntosDe` en `src/components/Celebracion.jsx` | 0 |

Los cinco modos se corrieron en serie. `rnk` salió rojo la primera vez por dos fallos del **andamio**, no del producto (§M-9). Se arreglaron y se volvieron a correr `rnk` y `humo`; los otros tres no usan `scripts/rnk/rnk.mjs`.

**Huellas de los protegidos** (sha256, primeros 16), iguales a las de `2328ed1`:

| Archivo | sha256 |
|---|---|
| `src/engine/gameEngine.js` | `317452ec5b57408a` |
| `src/engine/aiPlayer.js` | `3a8ea7b0386c7ddf` |
| `src/engine/deck.js` | `69f92d6b9aac433c` |
| `src/config/seatLayouts.js` | `0049051fd4b8b891` |
| `src/styles/opponentPanel.css` | `4b91338a205e4a6a` |
| `src/styles/gameTable.css` | `9b6b716f23ade19a` |

`git status` sobre los seis, `supabase/` y `vite.config.js`: sin cambios.

### La puerta de la victoria (salida de `diagCEL0 celebracion`)

```
-- RNK-1d · «Ver tu nuevo ranking» --
  alto del botón por celda (informativo; puerta ≥ 44 sólo en móvil horizontal): mesa5-1920x1080 35 · mesa5-375x812 30 · mesa5-360x640 30 · mesa5-640x360 44 · mesa5-812x375 44 · mesa2-1920x1080 35 · mesa2-375x812 30 · mesa2-360x640 30 · mesa2-640x360 44 · mesa2-812x375 44
  412x915   apagado sí (146.7×30 @132.64,703.66 op 0.45) → encendido sí (146.7×30 @132.64,703.66 op 1) · tarjeta victoria 379.03×468.25 / Rankings 379.03×468.25 · DevLocal «Puesto 7 · 11 puntos» · enRoot false · zoom #root 1 · ✕ cierra · foco vuelve · navegación ninguna
  915x412   apagado sí (146.7×44 @448.52,339.98 op 0.45) → encendido sí (146.7×44 @448.52,339.98 op 1) · tarjeta victoria 600×277.5 / Rankings 600×277.5 · DevLocal «Puesto 7 · 11 puntos» · enRoot false · zoom #root 1 · ✕ cierra · foco vuelve · navegación ninguna
  1366x768  apagado sí (166.59×35 @599.7,726.39 op 0.45) → encendido sí (166.59×35 @599.7,726.39 op 1) · tarjeta victoria 400×468.25 / Rankings 400×468.25 · DevLocal «Puesto 7 · 11 puntos» · enRoot false · zoom #root 1 · ✕ cierra · foco vuelve · navegación ninguna
FALLOS NUEVOS (0): ninguno
── diagCEL0 celebracion · 0 fallos (0 conocidos con dueño · 0 NUEVOS) · control verde → código 0
```

### `rnk-fresco` (salida de `diagDSK rnk`)

```
── RNK · VERDE · rnk-abre ✓ (2/2) · rnk-fila ✓ (3/3) · rnk-banda ✓ (6/6) · rnk-desplaza ✓ (2/2) · rnk-fin ✓ (2/2) · rnk-2col ✓ (6/6) · rnk-oro ✓ (1/1) · rnk-vino ✓ (1/1) · rnk-perfil ✓ (3/3) · rnk-propio ✓ (2/2) · rnk-uuid ✓ (1/1) · rnk-escala ✓ (1/1) · rnk-nohay ✓ (1/1) · rnk-fresco ✓ (4/4) · consola ✓
   rnk-fresco · 412x915 59 s llamadas top/mio 1/1→1/1 scrollTop 900→900
   rnk-fresco · 412x915 61 s top 1→2 mio 1→2 scrollTop 900→900 pestaña=maestros estado=listo cargando=0
   rnk-fresco · 412x915 tarjeta abierta top 2→3 mio 2→3 tarjeta=true scrollTop 900→900
   rnk-fresco · Rankings.jsx setInterval=false
```

---

## §2 · Medidas

### 2.1 · La tarjeta desde la victoria frente a la de Rankings

Medidas en el mismo viewport y en la misma corrida. Primero se abre tu tarjeta desde la banda de Rankings y después la de la victoria.

| Viewport | Desde la victoria | Desde Rankings | Lámina (1c-ii) | Fuera de `#root` |
|---|---|---|---|---|
| 412×915 | 379,03 × 468,25 | 379,03 × 468,25 | 468,3 de alto | sí |
| 915×412 | 600 × 277,5 | 600 × 277,5 | 277,5 de alto | sí |
| 1366×768 | 400 × 468,25 | 400 × 468,25 | — | sí |

La tarjeta es la del bypass: `DevLocal`, «Puesto 7 · 11 puntos». La mesa de `?cel` no gana manos, así que los puntos son los sembrados.

**Lo que esta medida no prueba** (M-10): el arnés corre con la escala forzada a 1 (INV-59, salvo `diagDSK tab`), así que en las tres celdas el `zoom` de `#root` vale 1. Que la tarjeta no herede un factor distinto de 1 está garantizado por construcción (el portal la saca de `#root` y el `zoom` vive en `#root`), y la puerta comprueba esa parte: `enRoot false`. Pero no se midió con f ≠ 1.

### 2.2 · El botón apagado y encendido

Son la misma caja, al centésimo, en las tres celdas. Solo cambia la opacidad (0,45 → 1).

| Viewport | Apagado (antes de `saldoFinal`) | Encendido |
|---|---|---|
| 412×915 | 146,7 × 30 en (132,64; 703,66) | 146,7 × 30 en (132,64; 703,66) |
| 915×412 | 146,7 × 44 en (448,52; 339,98) | 146,7 × 44 en (448,52; 339,98) |
| 1366×768 | 166,59 × 35 en (599,7; 726,39) | 166,59 × 35 en (599,7; 726,39) |

Para ver el estado apagado, el arnés retiene la respuesta de `salir_ia` en el banco imitado del bypass (`window.__ajileiBancoImitado`) hasta medir, y luego la suelta. Sin retenerla, el banco imitado contesta en el mismo instante y el apagado no llega a verse (relevante para la prueba A de Victor, §6).

---

## §3 · Archivo por archivo

### Producto

- **`src/config/textos.es.js:545`**: la clave `rnk.victoria.ver` = «Ver tu nuevo ranking», con su bloque `RNK-1d · La victoria`. `textos.test.js` no la canta como repetida.
- **`src/components/Celebracion.jsx`**:
  - `:12`: importa `useIdioma`.
  - `:334`: `PantallaVictoria` recibe `listoRanking` (por defecto `false`) y `abrirRanking(botón)`.
  - `:410`: `disabled={!listoRanking}`.
  - `:413`: el texto sale de `t('rnk.victoria.ver')`.
  - Fuera: `AVISO_MS`, `alternaAviso` con su temporizador y su limpieza, y la región viva `.cel-aviso`. Solo servían a ese aviso.
  - Los demás textos de la victoria siguen a mano hasta IDI-1 (K-9).
- **`src/styles/celebracion.css`**:
  - `:214`: `.cel-acciones .cel-ranking:disabled`, con opacidad 0,45, `cursor: default`, y sin el `filter` ni el `transform` del `:hover` de `.btn`, que levantaba 2 px el botón apagado.
  - Fuera: las tres reglas `.cel-aviso`, que ya no tenían elemento (M-5).
  - Dos comentarios al día (`:182` y `:191`).
  - `gameTable.css` no se toca.
- **`src/components/GameTable.jsx`**:
  - `:14-15`: importa `MiniPerfil` e `inicialDe`.
  - `:321`: prop nueva `apiRanking = null`, con su comentario (M-3).
  - `:958-976`: el bloque `RNK-1d · «VER TU NUEVO RANKING»`. `listoRanking = !!apiRanking && (!control || saldoFinal !== null)` (`:967`; M-2), y `abrirRanking`/`cerrarRanking` con el foco de vuelta al botón.
  - `:2386-2387`: las dos props a `PantallaVictoria`.
  - `:2391`: `MiniPerfil` propio con el username y el correo de `cuenta`, sin `onNoHay`.
  - Sin tocar la cola, `finMano` ni la sesión.
- **`src/components/MiniPerfil.jsx:104`**: `estadoLineas`. Si el banco no tiene la cuenta («nohay») y nadie pasó `onNoHay` (la victoria), las líneas dicen `rnk.sinred` y la tarjeta se queda. Rankings no cambia (M-4). La cabecera lo explica.
- **`src/App.jsx`**:
  - `:910`: pasa `apiRanking` a `GameTable`, con su nota en el comentario de la mesa.
  - `:938`: el comentario de `screen === 'rankings'` corregido (N-1): el mini-perfil lo abre `Rankings` y `App` no pasa `onJugador`.
  - `:953`: el «CUATRO props» se deja y se anota (M-6).
- **`src/screens/Lobby.jsx:65`**: «Recibe tres props» → «Recibe sus props» (una línea).
- **`src/screens/rankingsCore.js:70-79`**: `FRESCURA_MS = 60_000` y `debeRefrescar({ ultimaConsulta, ahora, umbralMs })`. Sin consulta previa devuelve `true`; con consulta previa, `true` desde 60 s (incluido).
- **`src/screens/Rankings.jsx`**:
  - `:31`: el bloque de cabecera `RNK-1d · LA FRESCURA`.
  - `:114`: `ultimaConsulta` por pestaña, anotada al pedir.
  - `:127-143`: el escucha de `visibilitychange`, que lee la pestaña y la clave del render por referencia.
  - Al volver visible, si toca, repite `top` y `mio` de la pestaña activa y guarda la respuesta con la **clave que ya se ve** (`:138`). No hay «Cargando…», las filas siguen montadas y el `scrollTop` no se toca. Si falla, se queda lo que había (M-7).
  - Se quita al desmontar.

### Pruebas y arnés

- **`src/screens/rankingsCore.test.js:105`**: `debeRefrescar`, en cuatro pruebas: el umbral, 59 s no, 60 s sí, sin consulta previa sí, y el umbral pasado a mano.
- **`scripts/testCelebracion.test.js:314`**: el AJILEI natural de 51, sacado de las cartas reales (`ajileiDe`, `createDeck`, `makeHandRules(2)`), ganado en Básico, da `sesion.puntos` = 2 y no 1.
- **`scripts/diagCEL0.mjs`**:
  - `:32-33`: importa `t` de `src/config/textos.js`.
  - `:176`: `alaVictoria` acepta `opciones.antesDeJugar`.
  - `:1366-1505`: `puertaRanking` reescrita, en tres celdas (§2).
  - `:1663-1673`: en cada celda de CEL-1 el botón existe, dice `t('rnk.victoria.ver')`, está **encendido** en reposo y su alto se informa (M-1).
  - `:1800`: `inf.rnk1d`.
  - El resumen impreso cambia el bloque del aviso por el de RNK-1d.
  - Se mantienen la puerta sin `href` y «Puntos obtenidos» = 0: la sembrada `?cel` no gana manos.
- **`scripts/rnk/rnk.mjs`**:
  - La cabecera lista `rnk-fresco`.
  - `abrirRankings` acepta `antes(page)`.
  - `:198` espera 4 medidas de `rnk-fresco`.
  - `:361-432`: la puerta. Finge el reloj (un salto en `Date.now`) y `visibilityState` solo en la página del arnés, y cuenta las llamadas en el banco del arnés. Mide 59 s, 61 s, 61 s con la tarjeta abierta y el `grep` de `setInterval`.

### Documentos

- **`docs/AJILEI_Rankings_v1.1.md`** (nuevo). La casa crea un archivo por versión y deja la anterior como historia (molde: `AJILEI_Menu_Utilidades_v1.0.md`, ECO-1 y APU-1). Lleva la lista «Qué cambia respecto de la v1.0» con los 13 puntos de la ficha §3.1 y el 14 del Ajuste C (D-1), cada uno marcado «v1.1:» en su sitio:
  - §3, H-2 y K-12;
  - §2.4.5 a §2.4.7, H-5, H-6 y H-7;
  - §6.5, el puesto único;
  - §1.1 y §6.7, SumaMente;
  - §6.10, los fondos;
  - §10, las guardas;
  - §7 y §7.4, el mini-perfil y la victoria;
  - §8.2, la frescura;
  - §12, la nota de lanzamiento.
  - Lo demás, tal cual (M-8).
- **`docs/AJILEI_Rankings_v1.0.md:1`**: la línea «> Sustituido por v1.1 — 2026-10-26».
- **`docs/AJILEI_Invariantes_v1.0.md`**:
  - `:5`: la entrada del 2026-10-26 en «Actualizado».
  - `:105-107`: INV-65, INV-66 e INV-67, con la forma de las demás.
  - `:109-111`: el recuento a 67 filas: 60 vigiladas y 27 con un límite declarado (INV-65 declara el suyo).
  - `:164`: §4, la fila de `AJILEI_Rankings_v1.1.md` (M-8).
  - `:208`: §6, la fila de `diagCEL0 celebracion` al día.
  - `:209`: §6, la fila nueva de `diagDSK rnk`, con 14 puertas y «En humo: sí».
  - `testInvariantes` en verde (85/85).
- **`docs/reportes/AJILEI_RNK-1_Fase1d_Informe_v1.0.md`**: este informe.

---

## §4 · El molde de la victoria para el túnel (informar, no construir)

- **Sí existe por URL: `?cel`** (`src/dev/siembraCEL.js:49`, `CEL_PARAM = 'cel'`). Los rivales nacen sin fichas y la mesa termina en el primer «Iniciar mano» con tu victoria, en las cuatro mesas. `?cel=<n>` da rivales con n fichas, para jugar manos de verdad; no es determinista. No depende de Playwright: el arnés solo abre la URL y recorre la ruta normal (lobby → Retar → mesa → «Iniciar mano»).
- **Solo en desarrollo:** `import.meta.env.DEV` lo apaga en cualquier build, así que funciona en el 5173 (`npm run dev`) y no en el 4173 ni en ajilei.io. En el 5173 la sesión es la del bypass (`DevLocal`) y el banco es el imitado: la tarjeta sale «Puesto 7».
- **Desde el teléfono:**
  - **Por la red local**, sin tocar nada: con `npx vite --host`, el S25 abre `http://<IP de la PC>:5173/?cel`. El servidor de desarrollo de Vite acepta direcciones IP sin lista.
  - **Por el túnel de Cloudflare hace falta `server.allowedHosts: ['.trycloudflare.com']`.** Hoy solo lo tiene `preview` (`vite.config.js:9`), y Vite 8.0.14 en desarrollo rechaza un nombre de host que no está en la lista. **No se cambió** `vite.config.js`: lo deciden el rector y Victor.

---

## §5 · `git status` (sin commits)

```
 M docs/AJILEI_Invariantes_v1.0.md
 M docs/AJILEI_Rankings_v1.0.md
 M scripts/diagCEL0.mjs
 M scripts/rnk/rnk.mjs
 M scripts/testCelebracion.test.js
 M src/App.jsx
 M src/components/Celebracion.jsx
 M src/components/GameTable.jsx
 M src/components/MiniPerfil.jsx
 M src/config/textos.es.js
 M src/screens/Lobby.jsx
 M src/screens/Rankings.jsx
 M src/screens/rankingsCore.js
 M src/screens/rankingsCore.test.js
 M src/styles/celebracion.css
?? docs/AJILEI_Rankings_v1.1.md
?? docs/reportes/AJILEI_MOT-1_Fase0_Informe_v1.0.md
?? docs/reportes/AJILEI_MOT-1_Fase1-0_Sonda_Informe_v1.0.md
?? docs/reportes/AJILEI_RNK-1_Fase1d_Informe_v1.0.md
?? laminas/mon1/_entorno.txt
?? laminas/mon1/lamina.html
?? laminas/mon1/tiempos.json
?? laminas/rnk1/
```

Los dos informes de MOT-1, `laminas/mon1/` y `laminas/rnk1/` ya estaban antes de la tanda y no se tocan. La copia de `2328ed1` que se usó para medir el build ya se quitó (`git worktree list`: solo el árbol principal).

---

## §6 · Pruebas de Victor

### A · PC con el bypass (5173) · unos 15 min

1. `npm run dev` y abre `http://localhost:5173/?cel`.
2. Lobby → Jugar contra las IAS → cualquier mesa → «Iniciar mano». La mesa termina y sale la victoria.
3. «Ver tu nuevo ranking» dice ese texto y **está encendido.** Con el bypass el banco imitado cobra en el mismo instante, así que el estado apagado no se llega a ver: lo midió el arnés (§2.2). Si se ve apagado más de un segundo, anótalo.
4. Tócalo. Sale **tu tarjeta**: `DevLocal`, «Puesto 7 · 11 puntos» y la línea de Fortunas, «Solo lo ves tú.», «Editar · Pronto» apagado y el correo en hueco (el bypass no tiene correo). Mide lo mismo que la tuya abierta desde Rankings.
5. Ciérrala con la ✕. Vuelves a la victoria y el botón queda enfocado: un Tab avanza desde él. Prueba también `Escape` y tocar el velo.
6. «Salir de la mesa» → lobby.
7. Rankings:
   1. Ábrelo y cambia de pestaña.
   2. Baja un poco en la lista.
   3. Bloquea la PC o cambia de ventana **más de un minuto** y vuelve.
   4. La lista **no se mueve**, no sale «Cargando…» y la pestaña es la misma.
   - **Con el bypass no hay llamadas de red que ver:** el banco imitado vive en la página. Que se pidieron una `ranking_top` y una `ranking_mio` lo cuenta `rnk-fresco`.
   - Si quieres verlas en la consola de red: `npm run build`, `npx vite preview` (4173) con tu cuenta real, y en DevTools → Red, filtra `ranking_`. Al volver tras más de un minuto aparecen dos peticiones nuevas; con menos de un minuto, ninguna.

### B · Túnel con el S25 · unos 15 min (más la victoria real, sin prisa)

1. Rankings por el túnel de siempre, contra el 4173 y la base real. Baja en la lista.
2. Apaga la pantalla **más de un minuto** y enciéndela. La lista sigue donde estaba, sin salto, y «Tu posición» está al día.
3. Si en otro dispositivo ganas una mano mientras tanto, al volver se nota el cambio sin tocar nada.
4. **La victoria real**, cuando ganes una mesa en ajilei.io después del push:
   1. el botón se ve apagado un instante y se enciende;
   2. al tocarlo sale tu tarjeta con tus puntos nuevos.
   3. Comprueba que «Puntos obtenidos» de la victoria cuadra con lo que subió tu total. Si hiciste AJILEI, el extra está dentro.
5. La victoria **sembrada** desde el teléfono (`?cel`) solo se puede por la red local con `npx vite --host`, o por el túnel si se añade `server.allowedHosts` (§4).

### C · Dejarlo como estaba · 1 min

`git restore` de los 15 archivos modificados y borrar `docs/AJILEI_Rankings_v1.1.md` y este informe. Nada de esta tanda toca la base.

Resultado real · 2026-10-27 (Victor): A · bypass en la PC con ?cel: victoria, «Ver tu nuevo ranking» encendido, tarjeta propia (DevLocal · Puesto 7 · 11 puntos), ✕ con el foco de vuelta, «Salir de la mesa» al lobby; Rankings tras más de un minuto fuera de la ventana: la lista no se mueve, sin «Cargando…», misma pestaña. Conforme. B · la victoria sembrada en el S25 por red local no se hizo (la dirección se escribió en el buscador y no en la barra; queda opcional); la victoria real en ajilei.io la cierra tras el push. C · túnel con el S25 (test1976) contra la base real: Rankings con la pantalla apagada más de un minuto, la lista donde estaba, sin salto y al día. Conforme. Veredicto: PASA.

---

## §M · Notas, desviaciones y preguntas

- **M-1 · La vara «≥ 44 px» del botón. Resuelta por el rector (2026-10-27): se queda así.** Los dos botones de la victoria («Salir de la mesa» y «Ver tu nuevo ranking») van a la tanda de la victoria. La puerta de `diagCEL0 celebracion` sigue exigiendo 44 solo en móvil horizontal y en las demás celdas informa el alto sin teñir.
  - Lo medido: 44 en el teléfono acostado (640×360 y 812×375, donde `celebracion.css` ya lo fija desde CEL-2e), 30 en vertical (360×640, 375×812 y 412×915) y 35 en escritorio (1366×768 y 1920×1080). La caja es la de CEL-2e, no la de la 1d, y subirla movería la columna (regla 2 de la ficha).
  - Esto no viene de la 1d: la caja es la de CEL-2e.
  - Subirla a 44 movería la columna de la victoria, y la regla 2 de la ficha lo prohíbe.
  - La puerta queda donde la casa la exigía (móvil horizontal) y en las demás celdas el alto **se informa** sin teñir.
  - **Pregunta al rector:** ¿se sube el alto (tocando la lámina de CEL-1), se le da una zona táctil de 44 sin mover la caja (molde PAN-1b, `::after`), o se queda así?
- **M-2 · Sin `control`, el botón nace encendido.** «Se enciende con `saldoFinal`» presupone el servidor. Sin `control` no hay libro que esperar (es el mismo caso en que «Saldo actual» pinta las fichas de la mesa), así que `listoRanking = !control || saldoFinal !== null`. Sin `apiRanking` se queda apagado. En la app real y en el bypass siempre hay `control`.
- **M-3 · `apiRanking` llega a `GameTable` por una prop nueva.** La mesa no tenía ninguna vía para las APIs: `control` es el canal de la mesa y no lleva rankings. Sale de `App` (`:910`), la misma instancia que usa Rankings.
- **M-4 · `MiniPerfil.jsx` también se tocó** (`:104`), aunque la ficha no lo nombra. Hacía falta para el «si el banco no tiene a la cuenta, `rnk.sinred` en las líneas, nunca rompe»: sin `onNoHay`, el estado «nohay» dejaba las líneas en hueco. Rankings pasa `onNoHay` y no cambia.
- **M-5 · Se quitaron las tres reglas `.cel-aviso` de `celebracion.css`.** Su elemento ya no existe. No mueve nada: era un elemento fuera de flujo. La regla «CSS aditivo» se leyó como «nada que mueva la victoria»; si el rector prefiere dejar las reglas muertas, se devuelven.
- **M-6 · El «CUATRO props» de `App.jsx:953` se deja.** La frase ocupa tres líneas y además nombra las props que llegaron con SAL-B1 y ECO-1b, así que no es «una línea». La de `Lobby.jsx:65` sí era una línea y se corrigió sin dar número («sus props»), para que no vuelva a envejecer.
- **M-7 · Decisiones de la frescura.**
  - `ultimaConsulta` se anota **al pedir**, no al llegar: así dos vueltas seguidas al primer plano no lanzan dos peticiones mientras la primera viaja.
  - Si el refresco falla (sin red), **se queda la lista que había** y no se pinta «No se pudo cargar». La lista nunca cambia sola a peor.
  - El refresco es por pestaña: la otra pestaña no se pide hasta que se entra en ella, como siempre.
- **M-8 · Documentos.**
  - El normativo nuevo es un archivo aparte (v1.1) y el v1.0 lleva la línea «Sustituido», como hace la casa.
  - «Frescura (nuevo §)» se escribió como §8.2, dentro de «Frecuencia y frescura», y el texto de §8 pasa a §8.1 sin cambios. Así no se renumera nada.
  - En §13, la línea de VOZ-3 decía «`finDeMano` en el servidor», que contradecía H-2. Se corrigió con su marca «v1.1:».
  - En el registro de invariantes se añadió también la fila del normativo en §4, que la ficha no pedía. Es la tabla de normativos y sus vigilantes, y sin ella el v1.1 no lo vigilaría nadie.
  - Algunos nombres de la fila de `diagCEL0` en §6 van sin comillas de código, porque `testInvariantes` exige que todo lo que va entre comillas sea un modo, una ruta o un documento.
- **M-9 · El andamio (arreglado y contado).**
  - **(a)** El `MutationObserver` del guion de arranque de `rnk-fresco` se enganchaba a `document.documentElement` antes de que existiera, y salía un `pageerror` en la consola. Ahora observa `document`.
  - **(b)** Para abrir la tarjeta, Playwright desplaza la lista hasta la fila 3, y la medida «con la tarjeta abierta» comparaba contra el `scrollTop` de antes del clic (900 → 0). Ahora la lista vuelve a 900 con la tarjeta abierta y se compara contra esa cifra.
  - Las dos eran del instrumento: el refresco no movía la lista (las medidas de 59 s y 61 s ya daban 900 → 900).
  - Aparte, la primera versión de la vara de 44 de `diagCEL0` dio 8 rojos, que son M-1.
- **M-10 · Lo que la puerta de la victoria no mide** (aceptada; anotada para ARN-4). El arnés fuerza la escala a 1 (INV-59), así que «la tarjeta no hereda el `zoom` de la mesa» se mide como **fuera de `#root`** (enRoot false) y como **mismo tamaño que desde Rankings**, pero no con f ≠ 1. Medirlo con f ≠ 1 pediría correr esta puerta dentro de `diagDSK tab`, que no es de esta tanda.
- **M-11 · Tocar el botón durante el arco.** Si `saldoFinal` llega mientras la celebración aún corre (lo normal: el servidor contesta en menos de un segundo), el primer toque sobre el botón hace dos cosas: salta el arco al reposo (el `pointerdown` en captura de `useCoreografia`, CEL-2) y abre la tarjeta. No se tocó. Si el rector prefiere que ese primer toque solo salte el arco, es una línea en `useCoreografia`.
- **M-12 · Lo que la ficha dejó fuera.** No se hizo «Ver los rankings» desde la tarjeta (queda anotado, §0). Tampoco nada de SumaMente (1e).
- **M-13 · Ajuste C (D-1).** La revisión del STOP-F cambia el normativo y no el código: no se volvieron a correr vitest entero, el build ni el arnés, solo `testInvariantes` (85/85), que es la prueba que lee los documentos.

---

## §D · Ajustes tras el STOP-F

- **D-1 · Ajuste C (2026-10-27, solo documentos).** En `docs/AJILEI_Rankings_v1.1.md`:
  - `:158` §5: la frase de la v1.0 sobre el saldo total con una mesa abierta (la recomendación del rector, «billetera + pila declarada», y «Victor decide con el informe») pasa a «**v1.1:** solo la billetera (K-1, Fase 0); quien está sentado aparece con lo que tiene en la billetera mientras juega». Es la respuesta (a) de K-1 en el informe de la Fase 0 (`docs/reportes/AJILEI_RNK-1_Fase0_Informe_v1.0.md:396`), la que se construyó en la 1a.
  - `:23`: el punto 14 de «Qué cambia respecto de la v1.0».
  - `:295` §14, primera línea: «**v1.1:** cumplido; respuestas en `docs/reportes/AJILEI_RNK-1_Fase0_Informe_v1.0.md` §K».
  - `scripts/testInvariantes.test.js`: 85/85 en verde.
