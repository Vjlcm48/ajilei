# AJILEI · IOS-1 · Fases 1a + 1b — La pantalla completa del iPad y el alcance de las pantallas bajas · Informe v1.0

**Campaña:** IOS-1 · Arreglos de iOS y de tamaños · **Sub-tandas:** 1a y 1b
**Ejecutor:** Claude Code · **Rector:** Claude (chat) · **Decisor:** Victor
**Base:** `main` en `92e2eeb` · **Fecha:** 2026-10-14 · **Estado:** STOP-3 (validado por Victor, 15 de 15; mapa de commits listo, antes del primer `git add`). Sin commits, sin `db push`.
**Ficha:** `AJILEI_IOS-1_Fase1ab_v1.0.md`, con las respuestas del rector al STOP-1 (1 a 4 y los encargos a y b).

---

## 0 · Lo más importante

1. **1a:** en Safari del iPad la pantalla completa ya no se pide fuera de la mesa, y dentro solo en horizontal. Android, el iPhone y la app instalada siguen como antes. Todo vive en `src/lib/pantallaCompletaCore.js`; `App.jsx` y `GameTable.jsx` no se tocan. vitest del núcleo: 19 casos (10 de antes y 9 nuevos). **Que el iPad dé de verdad las señales de la regla solo se comprueba en el iPad** (§2.3).
2. **1b:** en horizontal, de 521 a 830 de alto, Retar, Retar con video, Salas y Armar mesa desplazan cuando no caben; el lobby tiene traje de 661 a 749; la barra de las salas cede el nombre con «…». **El modo nuevo `diagDSK tam` nace rojo contra `92e2eeb` (162 + 18 + 10 fallos) y sale verde con el arreglo (320 puntos, 160 con gesto real).**
3. **Donde todo cabe, nada cambia:** en horizontal, de 521 a 911 de alto, a 1366 y a 1280, Retar, Retar con video, Salas y Armar mesa conservan todas sus cajas; solo cambia la del propio nombre, por la holgura de 2 px, y la casa en 1/64 de px (§5.1). El lobby solo cambia en su banda nueva, de 661 a 741. El vertical del teléfono sale **idéntico al píxel** (P6) en las 25 capturas medidas: 360×640, 390×844, 412×915 (S25), 360×704 y 360×740, cada una en lobby, Retar, Retar con video, Salas y Armar mesa.
4. **La casa queda en el mismo píxel que antes** (encargo a): a 1366, 1280, 1133 y 800 de ancho, a 623, 641, 760, 840 y 900 de alto, en Retar, Salas y Armar mesa, Δ 0 contra la base; y donde desplaza, se queda en ese mismo píxel al fondo del desplazamiento. Para eso su `left` reproduce el centrado de `.sal`; con un `position: fixed` a secas se habría ido 44 px a la izquierda a 1366 (§3.1).
5. **G-1 arreglaba más de lo que se veía:** en la base, con 15 «W», la barra ensanchaba la rejilla y toda la pantalla de Retar quedaba corrida unos 13 px y recortada por los dos lados. Con el «…» vuelve a su margen. Con `ticotest2022` y `test1976`, la barra sale idéntica al píxel (§3.3).
6. **Desviaciones de la ficha:** tres, todas pequeñas: el `left` de la casa (producto) y dos del instrumento (§6).

---

## 1 · Archivos tocados

| Archivo | Qué cambia |
|---|---|
| `src/lib/pantallaCompletaCore.js` | `esSafariDeIPad`, `pideAqui` y `CONSULTA_HORIZONTAL`; `alGesto` y las dos `reentrar` pasan por la política; cabecera (R7 corregida y la regla del iPad) |
| `src/lib/pantallaCompletaCore.test.js` | `monta()` gana `callout` (el `CSS.supports` de WebKit de iOS); casos 11 a 19 |
| `src/styles/salas.css` | §2: el «…» del nombre bajo `.sal`, con holgura de 2 px. §13: el comentario de la doctrina con la excepción temporal, y el bloque nuevo de la carcasa |
| `src/styles/lobby.css` | §11: el traje horizontal de 661 a 749 |
| `scripts/ios/tam.mjs` | Nuevo: el modo `tam` |
| `scripts/diagDSK.mjs` | `tam` registrado (import, `MODOS_PREVIEW`, despacho); `lob.9` y `lob.10`; `LOB_NOMBRE_VIEWPORTS` gana 440×956 |
| `scripts/arnes/nucleo.mjs` | `tam` en `MODOS_DSK` y en `VEREDICTO_DSK` |
| `docs/AJILEI_Invariantes_v1.0.md` | INV-45 (la regla del iPad y sus casos), INV-55 (nueva), recuento, §3 (`tam` en el 4173), §6 (filas de `tam` y `lob`, pendientes de IOS-1 resueltos) y la línea de actualización |
| `docs/reportes/AJILEI_IOS-1_Fase1ab_Informe_v1.0.md` | Este informe |

Ningún protegido (`docs/AJILEI_Protegidos_v1.0.md`): `scripts/testProtegidos.test.js` en verde. Ningún óvalo tocado. Sin `!important`.

---

## 2 · 1a · La pantalla completa del iPad

### 2.1 La regla

```js
export const CONSULTA_HORIZONTAL = '(orientation: landscape)'

export function esSafariDeIPad(win) {          // el único sitio que reconoce el aparato
  return coincide(win, CONSULTA_TACTIL)
    && typeof win?.document?.documentElement?.requestFullscreen === 'function'
    && !!win?.CSS?.supports?.('-webkit-touch-callout', 'none')
}

function pideAqui(win, { dentroMesa }) {        // la política por aparato
  if (esSafariDeIPad(win)) return dentroMesa && coincide(win, CONSULTA_HORIZONTAL)
  return true
}
```

- `alGesto` (el oyente de `pointerup` de `App.jsx`) añade `&& pideAqui(win, { dentroMesa: false })`: en el iPad no pide nunca.
- `reentrar` (la del controlador y la exportada que llama `GameTable.jsx` en «Iniciar mano» y «Siguiente mano») es `pideAqui(win, { dentroMesa: true }) && pedir(doc, win)`.
- **Plan de respaldo P2:** cambiar la rama del iPad de `pideAqui` a `return false`. Una línea.
- **El giro a vertical** (respuesta 2 del rector): no se sale a propósito. R3 y la prueba 7 de vitest (ninguna llamada de salida en todo `src/`) siguen intactas.

### 2.2 vitest del núcleo

| # | Caso | Resultado |
|---|---|---|
| 1–10 | Los de PAN-1 | igual que antes |
| 11 | Safari del iPad, fuera de la mesa, en las dos orientaciones (5 toques) | no pide |
| 12 | Safari del iPad, mesa en vertical | «Iniciar mano» y la `reentrar` de `GameTable` no piden |
| 13 | Safari del iPad, mesa en horizontal | «Iniciar mano» pide (con `navigationUI: 'hide'`); al dejar la mesa los toques de fuera no piden y no se sale |
| 14 | Tableta Android, fuera de la mesa | pide, como hoy |
| 15 | Teléfono Android, en las dos orientaciones | como hoy: fuera pide, dentro solo la reentrada |
| 16 | iPhone (sin la API, aunque tenga la capacidad de iOS) | no pide |
| 17 | App instalada en el iPad (dos señales) | no pide |
| 18 | Mac con ratón (con la capacidad de iOS) | no pide |
| 19 | iPad con teclado y panel táctil (entrada principal fina) | no pide |

### 2.3 Lo que no está probado

**La detección real solo se comprueba en el iPad.** vitest prueba la regla con un `window` falso que dice lo que se le pide. Que Safari del iPad conteste `true` a la consulta táctil y a `CSS.supports('-webkit-touch-callout', 'none')` está documentado, pero aquí no se ha probado: el WebKit de Playwright en Windows da `maxTouchPoints` 0 y la capacidad falsa (Fase 0, §C.7). Lo decide la prueba 1 de Victor (§7).

**Resuelto en la validación (2026-10-15):** comprobada en el aparato real, iPadOS 27 (§7, pruebas 1, 2 y 6).

---

## 3 · 1b · El alcance de las pantallas bajas

### 3.1 La carcasa (`salas.css` §13)

```css
@media (orientation: landscape) and (min-height: 521px) and (max-height: 830px) {
  .sal { overflow-y: auto; }
  .sal-casa {
    position: fixed;
    left: calc(max(0px, (100% - var(--u) * 213) / 2) + env(safe-area-inset-left, 0px) + var(--pad));
  }
}
```

- **Por qué no cambia nada donde cabe:** no toca filas, trajes ni medidas. `overflow-y: auto` solo desplaza si el contenido ya desborda; hasta hoy ese desborde se recortaba. Y al desbordar, el cuerpo no pierde su parte de arriba: `space-evenly` cae a `start`, y lo que sobra va todo hacia abajo.
- **La casa (encargo a del rector).** Al leer `.sal` para escribirlo apareció lo que la doctrina avisa: `.sal` tiene `max-width: 213u` (≈ 1278 px) y se centra con `margin: auto`. Con `position: fixed` a secas, como el traje acostado, la casa se habría ido al borde de la ventana: **44 px a la izquierda a 1366**, y 85 a 1280 con 521 de alto (ahí `--u` baja a 5,21). Ese `left` es el que tendría dentro de `.sal`, con el mismo `--u`. Medido contra la base: 60 medidas (4 anchos × 5 altos × 3 pantallas), Δ 0 en todas. A 1366 la casa está en x = 65 (los 44 del centrado más los 21 del relleno), antes y después. A 623 y 641, tras bajar con la rueda (de 8 a 123 px según la pantalla), sigue en el mismo píxel. En el barrido de cajas de §5.1 aparece una diferencia de 0,02 px (1/64, una unidad de maquetación) en los altos en que `--u` no es entero (521, 541, 571 y 591): cae en el mismo píxel de pantalla.
- **Los trajes de 660 y 800, sin tocar.** No hizo falta.
- **El comentario de la doctrina** (`salas.css` §13) deja escrita la excepción, que es temporal hasta la 1e, y por qué.
- **Retar con video, de 831 a 853:** también desborda (de 24 a 3 px), fuera del tramo. Lo que sobra es la caja reservada de la nota, que con el bloque del video está oculta (`:has(.sal-saldo) .sal-accion small { visibility: hidden }`). El botón cabe con 8,9 px de margen. No se amplió el tramo; lo vigila `tam` en su punto 831. **Decisión del rector (respuesta 1 al STOP-2):** el techo se queda en 830. Desplazar ahí haría que Windows pintara una barra de desplazamiento para bajar a nada visible.

### 3.2 El lobby (`lobby.css` §11)

```css
@media (orientation: landscape) and (min-height: 661px) and (max-height: 749px) {
  .lobby { --iso-lobby: calc(var(--u) * 32); --lob-cta-h: max(44px, calc(var(--u) * 10)); }
  .lobby .lob-marca { padding-bottom: calc(var(--u) * 2.5); gap: calc(var(--u) * 1.2); }
  .lobby .lob-accion { gap: calc(var(--u) * 2); }
}
```

Medido por `tam` (tam.4) en los dos perfiles, y antes en el STOP-1. El hueco entre «Jugar contra jugadores» y el menú:

| Alto | 521–651 | 661 | 671 | 741 | 751 | 831 |
|---|---|---|---|---|---|---|
| Antes | +10,3…+40,9 | **−36** | **−31** | +4 | +9 | +47,5 |
| Después | igual | **+19,4** | +24,4 | +59,4 | +9 | +47,5 |

Las cifras de `tam` sobre la build real coinciden al décimo con las de la calibración del STOP-1. En el barrido de `tam`, el mínimo es +9 (a 751); la calibración midió +8,5 a 750, justo fuera de la banda. El salto al pasar de 749 a 750 (el isotipo crece 48 px) se ve si se redimensiona la ventana, pero no deja ningún punto peor que antes. El S25 y el 360×740 en vertical no cambian (la condición lleva la orientación): `diagDSK lob` en verde y P6 idéntico al píxel.

### 3.3 El engranaje (`salas.css` §2)

```css
.sal > .lob-top { min-width: 0; }
.sal .lob-top .lob-perfil { min-width: 0; }
.sal .lob-top .lob-nombre { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; padding: 2px; margin: -2px; }
```

**Con la holgura puesta (respuesta 3 del rector)**, medido por `diagDSK lob` y por la sonda:

| Ancho | ⚙ acaba en, antes → ahora (15 «W») | Nombre visible | Δ ⚙ frente al nombre estrecho |
|---|---|---|---|
| 360 | 387,5 → **347,4** | 150 de 190 px, con «…» | 0 |
| 390 | 419,6 → **376,4** | 162 de 206, con «…» | 0 |
| 412 | 443,1 → **397,6** | 172 de 217, con «…» | 0 |
| 440 | 473,0 → **424,6** | 183 de 232, con «…» | 0 |

(Igual en Retar y en Salas. Las anchuras visibles son las del texto, sin la holgura. En 640×360 los 15 «W» caben enteros.)

**Con `ticotest2022` y `test1976`, en los cuatro anchos y en las dos pantallas:** el engranaje, la píldora y el nombre, en el mismo píxel, y la **captura de la barra idéntica** a la de la base. La única caja que cambia es la del propio nombre, que crece 2 px por lado con la holgura sin mover su texto.

**Lo que no se esperaba:** en la base, con 15 «W», no solo se salía el engranaje. La barra ensanchaba la rejilla entera de `.sal`, y toda la pantalla de Retar (columna, chips, botón y casa) quedaba corrida unos 13 px a la izquierda y recortada por los dos lados. Con el arreglo vuelve a su margen (`g1-retar-15W-360-base.png` frente a `-arreglo.png`).

---

## 4 · El arnés

### 4.1 `diagDSK tam` (nuevo, `scripts/ios/tam.mjs`)

Matriz: dos perfiles de Chromium (laptop a 1366 con ratón y rueda; tableta táctil a 1280, con un arrastre de dedo por CDP) × 32 altos (de 521 a 831, de 10 en 10) × 5 pantallas (lobby, Retar, Retar con video, Salas, Armar mesa). En cada punto, un solo contexto y `setViewportSize`.

| Punto | Qué mide |
|---|---|
| tam.1 | El botón principal se alcanza: dentro de la ventana y sin nada encima (`elementFromPoint`), de entrada o tras el gesto real. Un `scrollTop` desde código no vale: con `overflow: hidden` también se mueve |
| tam.2 | Su nota, si se ve, también (±1 px) |
| tam.3 | Donde todo cabe nada desplaza: ni el documento ni, a lo ancho, la pantalla. Y si no desborda, el gesto no mueve el botón |
| tam.4 | Lobby: «Jugar contra jugadores» a ≥ 8 px del menú |
| tam.5 | Ningún tocable sobre otro (la casa incluida): arriba, a media pasada y al fondo |

**Contra la base (`92e2eeb`, la build de la Fase 0, servida en el 4173 con `--servidor=externo`):**

```
── TAM · ROJO · tam.1 ✗ (162) · tam.2 ✓ · tam.3 ✓ · tam.4 ✗ (18) · tam.5 ✗ (10) · matriz ✓ · consola ✓ · 320 puntos, 162 con gesto
```

- tam.1: en Retar, Retar con video, Salas y Armar mesa el gesto no mueve nada y el botón sigue cortado. En los dos perfiles:
  - Retar, de 521 a 721;
  - Retar con video, de 521 a 741 y de 801 a 821;
  - Salas, de 521 a 691;
  - Armar mesa, de 521 a 611 y de 661 a 701.

  Y en el lobby, a 661.
- tam.4: el lobby de 661 a 741, en los dos perfiles.
- tam.5: de 661 a 701, «Jugar contra jugadores» pisa Rankings, Tienda y Reglas, hasta 20,6 px.

**Con el arreglo:**

```
── TAM · VERDE · tam.1 ✓ · tam.2 ✓ · tam.3 ✓ · tam.4 ✓ · tam.5 ✓ · matriz ✓ · consola ✓ · 320 puntos, 160 con gesto
```

Duración: 3 min 15 s con `--sin-build`. **Dos notas del instrumento:**
- `Input.synthesizeScrollGesture` con `gestureSourceType: 'touch'` no desplaza nada en este Chromium sin pantalla, ni lento ni rápido; en la primera corrida dio falsos rojos en toda la tableta. El perfil táctil usa una secuencia de `Input.dispatchTouchEvent` (tocar, mover, soltar), que sí desplaza.
- La nota de Retar con video está oculta y solo reserva su caja: tam.2 la exige solo si se ve.

### 4.2 `diagDSK lob`: lob.9 y lob.10

- `lob.9` es la barra de Retar y `lob.10` la de Salas. Usan la medida de `lob.8` con la raíz cambiada.
- En todas las celdas se exige que nada desborde, que el engranaje quede dentro y que el nombre no pise la píldora.
- En las del nombre de 15 se exige además lo mismo que en `lob.8`: el engranaje en el mismo píxel que con el nombre estrecho («iiiiii», medido en la misma pantalla) y el «…» puesto.
- Nueva celda 440×956.

| | Celdas | Fallos |
|---|---|---|
| Base | 6/11 | lob.9 y lob.10 en las cinco celdas del nombre de 15 (en 640×360 el nombre cabe, pero falta el «…») |
| Arreglo | **11/11** | — · el nombre de 15 cede en 360, 390, 412 y 440 |

### 4.3 El resto de varas

| Vara | Resultado | Duración |
|---|---|---|
| vitest (`npm test`) | **1.574 en verde**, 64 archivos: los 1.564 de la línea base, los 9 casos nuevos del núcleo y la fila de INV-55 de `testInvariantes` (línea base 1.564) | |
| lint | **21**, los de siempre (línea base 21) | |
| build | en verde. Paquete principal: 175,74 → 175,85 kB comprimido (+0,11); CSS: 20,53 → 20,61 (+0,08) | |
| `diagDSK lob` | verde, 11/11 | 41 s |
| `diagDSK retar` | verde, 6/6 | 25 s |
| `diagSAL sal` | verde | 1 min 40 s |
| `diagDSK video` | verde, 1 a 8 y aux. La línea informativa «engranaje fuera con 15 W» de video.8 ya no sale | 1 min 47 s |
| `diagDSK tam` | rojo en la base, verde con el arreglo | 3 min 15 s |

### 4.4 La pasada de WebKit a 1133 (sonda del scratchpad, respuesta 4)

`…\scratchpad\ios1f0\tam-webkit.mjs` importa `runTam` con WebKit 26.5 (`playwright-core`) a 1133 de ancho, el iPad en horizontal. **El WebKit de Playwright no tiene CDP ni arrastre, y en móvil tampoco admite la rueda** (`Mouse wheel is not supported in mobile WebKit`). Hay dos perfiles:
- **WebKit táctil** (`isMobile`): usa el gesto `codigo` de `tam`. Baja desde código, pero solo si la pantalla deja desplazar al usuario (`overflow-y` auto o scroll), así que la base no puede salir verde por esta vía.
- **WebKit con rueda** (escritorio): usa la rueda real.

| | Resultado |
|---|---|
| Base (solo táctil) | ROJO · tam.1 ✗ (81) · tam.4 ✗ (9) · tam.5 ✗ (5) · 160 puntos · 41 s |
| Arreglo (los dos perfiles) | **VERDE** · 320 puntos, 160 con gesto · 48 s |

Lo que esta pasada **no** prueba: el gesto del dedo en el WebKit de verdad, las barras de Safari y las señales del iPad (§2.3). Eso lo ve Victor.

---

## 5 · Antes y después

### 5.1 Las cajas en horizontal, de 521 a 911

Sonda `…\ios1f0\antesdespues.mjs`: la base (`ios1f0\dist`, de 92e2eeb) en el 4195 y el arreglo (`ios1f0\dist-arreglo`, copia del `dist/` de este árbol) en el 4196. Se compararon todas las cajas (botones, campos, títulos, notas, nombre, isotipo, menú, cuerpo y bloques) arriba del todo, de 521 a 911 de 10 en 10, a 1366 (ratón) y a 1280 (táctil), en las cinco pantallas:

- **Lobby:** solo cambian 4 cajas (el isotipo, la marca y los dos botones), de 661 a 741. Es el traje nuevo. Fuera de esa banda, idénticas.
- **Retar, Retar con video, Salas y Armar mesa:** idénticas, salvo la caja del propio nombre en todos los altos (la holgura: −2 px de posición y +4 de tamaño, con el texto quieto) y la casa ±0,02 px en 521, 541, 571 y 591.
- **Al píxel**, Retar antes de desplazar:
  - a 1366×623, la captura sale idéntica;
  - a 1133×641 difieren 30 píxeles del borde de abajo (y de 632 a 640), con una diferencia máxima de 2/255. Es el borde del botón cortado, ahora en una capa de desplazamiento propia. No se ve.

### 5.2 P6: el vertical

25 capturas, base contra arreglo: 360×640, 390×844, 412×915 (S25), 360×704 (S25 con barras) y 360×740, cada una en lobby, Retar, Retar con video, Salas y Armar mesa. **Las 25, idénticas al píxel.** En las pantallas de salas difiere la caja del nombre, por la holgura. El dibujo no.

### 5.3 Las capturas de la ficha (§6)

En el scratchpad, `…\scratchpad\ios1f0\salida-stop2\`:

| Toma | Antes | Después |
|---|---|---|
| Retar, laptop 1366×623 | `foto-retar-1366x623-base.png` (botón cortado; la rueda no mueve nada: `-base-tras-rueda.png` es igual) | `foto-retar-1366x623-arreglo.png` y `-arreglo-tras-rueda.png` (botón y nota a la vista) |
| Retar, iPad 1133×641 | `foto-retar-1133x641-base.png` (y `-tras-rueda`, igual) | `foto-retar-1133x641-arreglo.png` y `-arreglo-tras-rueda.png` |
| Retar con video, 1366×623 | `foto-retar-video-1366x623-base.png` (y `-tras-rueda`, igual) | `foto-retar-video-1366x623-arreglo.png` y `-arreglo-tras-rueda.png` |
| Lobby, 1366×670 y 1133×670 | `foto-lobby-1366x670-base.png` y `foto-lobby-1133x670-base.png` (el botón sobre el menú) | `foto-lobby-…-arreglo.png` (isotipo a 32 unidades, sin solape) |
| Retar con 15 «W», 360×800 | `g1-retar-15W-360-base.png` (engranaje fuera y la pantalla corrida) | `g1-retar-15W-360-arreglo.png` |
| Retar en vertical, 360×640 | `p6-retar-360x640-base.png` | `p6-retar-360x640-arreglo.png` (idéntica) |

---

## 6 · Desviaciones de la ficha

1. **La casa no va `fixed` a secas,** como proponía el STOP-1: lleva además el `left` que reproduce el centrado de `.sal` (§3.1). Sin él, la casa se iba 44 px a la izquierda a 1366. Es lo que el encargo (a) pedía vigilar.
2. **El perfil táctil de `tam` usa toques de CDP** (`Input.dispatchTouchEvent`) en vez de `Input.synthesizeScrollGesture`, que no desplaza en este Chromium (§4.1).
3. **`tam` barre 32 altos, hasta 831,** uno más que «de 521 a 830 de 10 en 10». El punto 831 queda justo fuera de la condición y vigila su borde.

Nada más. Los trajes de 660 y 800 no se tocaron, el tramo de la carcasa es el del STOP-1 y no se reservó espacio para la barra de desplazamiento de Windows (encargo b).

---

## 7 · La validación de Victor: 15 de 15 bien

Por túnel, con el árbol de esta tanda sin commitear (`npm run build`, `npx vite preview --host`, `npx cloudflared tunnel`), entre el STOP-2 y el STOP-3. Al acabar, Victor cerró el túnel.

**iPad, en Safari (sin instalar), iPadOS 27:**

| # | Prueba | Resultado |
|---|---|---|
| 1 | Tocar varias veces el lobby y Retar: ¿aparece la ✕ o se esconde la barra de Safari? | **Bien.** Ni ✕ ni barra que se esconda |
| 2 | El campo del código en Salas y «Otra…» en Retar: ¿el teclado sale a la primera? | **Bien.** A la primera |
| 3 | Retar en horizontal: desplazar con el dedo y tocar el botón dorado | **Bien.** Desplaza y el botón se toca |
| 4 | Lobby en horizontal: ¿«Jugar contra jugadores» pisa el menú? | **Bien.** Sin solape |
| 5 | Mesa de 5 en horizontal: «Iniciar mano» → pantalla completa, y «Pasar / Apostar / Retirarse» enteros | **Bien** |
| 6 | Mesas de 2 y 3 en vertical: sin pantalla completa, con las fichas y «Mesa 50» | **Bien** |
| 7 | Con una mano en curso, girar de horizontal a vertical | **Bien.** Ni fichas cortadas ni «Mesa 50» fuera. **F-5 cerrado; P2 no se aplica** |
| 8 | Salir de una mesa horizontal a Retar: ¿molesta la ✕ sobre el avatar? | **Bien.** No queda la ✕: Safari suelta la pantalla completa al salir. **El residuo de C+B que se aceptó en el STOP-1 no se da en la práctica** |
| 9 | La casa en Retar en horizontal, al desplazar | **Bien.** Se queda en su esquina |

**Laptop HP 1366×768, navegador normal:**

| # | Prueba | Resultado |
|---|---|---|
| 10 | Retar, Salas y Armar mesa: bajar con la rueda y tocar el botón | **Bien.** Se alcanzan con la rueda |
| 11 | La barra de desplazamiento de Windows (≈ 15 px; la columna se corre ≈ 7 px), sin tapar ni reservarle sitio (encargo b) | **Bien.** No le molesta |
| 12 | El lobby | **Bien** |

**S25:**

| # | Prueba | Resultado |
|---|---|---|
| 13 | La pantalla completa: entra al tocar y vuelve si se saca | **Bien.** Como siempre |
| 14 | Retar y el lobby en vertical | **Bien.** Iguales |

**iPhone:**

| # | Prueba | Resultado |
|---|---|---|
| 15 | Retar en vertical | **Bien.** Igual |

**La detección de Safari del iPad (§2.3) queda comprobada en el aparato real** (iPadOS 27): las pruebas 1, 2 y 6 solo salen así si `esSafariDeIPad` da verdadero.

**Corrección a la lista del STOP-2 (prueba 3):** el bloque del video en Retar solo sale cuando el saldo no alcanza ni para la mesa más barata (lo sellado en la 1g). Con los saldos de prueba no sale, así que Victor no lo vio; lo cubre el arnés: `diagDSK tam` en Retar con video, de 521 a 831 en los dos perfiles, y `diagDSK video`.

**Lo que no se probó por túnel:** la app instalada del iPad. Se mira en ajilei.io tras el push.

---

## 8 · Tiempo y cierre de terreno

**Tiempo:**
- hasta el STOP-2, de las 21:47 a las 22:27 del 14-oct-2026: **40 minutos** de Claude Code, frente a los 100–115 estimados en el STOP-1 y dentro del tope de 2 h;
- STOP-3 (informe, registro y comprobación por commit), el 15-oct, desde las 14:10: unos 6 minutos.

No se recortó ninguna vara.

**Cada commit, por sí solo** (exigencia del rector al STOP-2), comprobado en un árbol aparte del scratchpad y sin tocar el de Victor:
- el árbol es `git archive` de `92e2eeb`, con los `.env` copiados y `node_modules` por una unión que se quita al acabar;
- se le añaden los archivos de cada commit en el orden del mapa;
- en cada paso corren `npx vitest run` y `npx vite build`;
- al final, el árbol es igual, byte a byte, al de Victor en los 12 archivos.

| Estado | vitest | build |
|---|---|---|
| `92e2eeb` | 64 archivos · 1.563 + 1 saltada (1.564) | bien |
| + 1 núcleo | 1.572 + 1 saltada (1.573) | bien |
| + 2 CSS | 1.572 + 1 saltada (1.573) | bien |
| + 3 arnés | 1.572 + 1 saltada (1.573) | bien |
| + 4 doctrina e informes | 1.573 + 1 saltada (1.574) | bien |

La saltada es `scripts/testBancoBandas.test.js` (`skipIf(sinVolcados)`): sus volcados no viajan con `git archive`, y en el árbol de Victor pasa. Se salta igual en la base.

**Cierre de terreno** (comprobado a las 14:14 del 15-oct):
- **Puertos y procesos:** nadie escucha en 4173, 4195, 4196, 5173 ni 5174, y no queda ningún `node` vivo.
- **Copias:** ninguna en el repo. El `node_modules` del repo, intacto.
- **Fuera del repo,** en `…\scratchpad\ios1f0\`, además de lo del STOP-2 hay tres copias de `92e2eeb` sin `node_modules` (`arbol`, `arbol2` y `arbol3`, la de la corrida final, hecha con el registro y el informe ya cerrados). La primera corrida del guion se cortó a medias, y su borrado en recursivo no estaba permitido, así que no se borra ninguna. Las tres uniones se quitaron con `rmdir`, que borra solo el enlace. Todo sale con la carpeta tras los commits.
- **`git status --short`:** el mismo del STOP-2. Sin `git add`, sin commits, sin stash.

**STOP-3.** El mapa archivo → commit está en el mensaje del STOP-3. Paro antes del primer `git add`.

---

## 9 · Preguntas al rector, y sus respuestas (2026-10-15)

1. **Retar con video, de 831 a 853 de alto.** Se preguntó si subir el techo a 860.
   - **Respuesta: el techo se queda en 830.** Lo que desborda ahí es la caja oculta de la nota: desplazar haría que Windows pintara una barra para bajar a nada visible. Queda como decisión (§3.1).
2. **El gesto `codigo`.**
   - **Respuesta: se queda en `scripts/ios/tam.mjs`,** documentado como el gesto de WebKit móvil. La 1f decide si la pasada de WebKit entra fija en el arnés.
3. **Los 30 píxeles de 2/255 a 1133×641.**
   - **Respuesta: se aceptan como «sin cambio de lo que se ve».**
4. **El roce de 800×601–611 con la casa.**
   - **Respuesta: de acuerdo,** una celda de 800 de ancho en la `tam` completa de la 1f.
5. **El mapa.**
   - **Respuesta: de acuerdo con el orden** (núcleo → CSS → arnés → doctrina e informes, con el registro en el documental).
   - **Exigencia añadida:** cada commit pasa vitest por sí solo, comprobado en un árbol aparte. Hecho (§8).

**Pendientes para la 1f** (anotados): la celda de 800 de ancho y si la pasada de WebKit entra fija en `tam`.
