# AJILEI · PAN-2 · Fase 0 · Informe · v1.0

**Fecha:** 2026-11-26 · **Ficha:** `AJILEI_PAN-2_Fase0_v1.1.md` · **Parada:** STOP-0.
**Base:** `main` = `origin/main` = `cb4ade0` (comprobado: `git log -1` = `cb4ade0 TUT-1 7-b…`, `git rev-parse origin/main` = `cb4ade02…`, `git status` limpio).
**Modo:** solo lectura. Sin ediciones de código, sin build, sin servidor, sin commits. El único archivo nuevo es este informe, que entra con la tanda.

---

## 1 · Hechos

### A.1 · `index.html` (cabecera)

| Línea | Literal |
|---|---|
| `:9` | `<meta name="viewport" content="width=device-width, initial-scale=1.0" />` |
| `:15` | `<link rel="manifest" href="/manifest.webmanifest" />` |
| `:16` | `<meta name="theme-color" content="#0a1e10" />` |
| `:74` | `<meta name="apple-mobile-web-app-capable" content="yes" />` |
| `:75` | `<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />` |
| `:76` | `<meta name="apple-mobile-web-app-title" content="AJILEI" />` |
| `:77` | `<meta name="mobile-web-app-capable" content="yes" />` |

- **No lleva `viewport-fit=cover`.** En el repo ya figura como deuda con nombre, **FS-1**: `lobby.css:128-131` («`env(safe-area-inset-*)` está escrito y hoy vale 0: `index.html:9` NO lleva `viewport-fit=cover`… Añadirlo es FS-1»), `LOB1_Fase1_Informe §332`, `IOS-1_Fase0_Informe §875` (pregunta 12) e `iOS_Sesion1_Lista §359` (R-1: «si la isla tapa la barra del lobby en la app instalada, la cura natural es FS-1»).
- **`theme-color` sí existe**, y es oscuro: `#0a1e10` (`--green-abyss`, el mismo que pinta `:root` en `src/index.css:22`).
- No hay `<meta name="color-scheme">`. `:root` declara `color-scheme: light dark` (`src/index.css:20`).

### A.2 · El manifiesto

Archivo estático `public/manifest.webmanifest`. No lo genera ningún plugin: `vite.config.*` no menciona ni manifiesto ni PWA. **No hay service worker** (`serviceWorker`/`registerSW`/`workbox` no aparecen en `src/`, `index.html` ni la configuración de Vite) y `_headers` no le pone caché a `index.html` ni al manifiesto (revalidan siempre).

```json
{
  "name": "AJILEI",
  "short_name": "AJILEI",
  "start_url": "/",
  "scope": "/",
  "display": "fullscreen",
  "orientation": "any",
  "background_color": "#0a1e10",
  "theme_color": "#0a1e10",
  "icons": [ …192 y 512, "any maskable"… ]
}
```

- `display`: `fullscreen`. **`display_override`: no existe.** **`theme_color`: existe**, `#0a1e10`. `background_color`: `#0a1e10`. `orientation`: `any`. `start_url` y `scope`: `/`. **`id`: no existe**, así que Chrome usa `start_url` como identidad.

### A.3 · `safe-area-inset` (hoy valen 0 en todas partes, porque no hay `cover`)

| Pantalla | Dónde | Reserva arriba |
|---|---|---|
| Lobby | `lobby.css:132-136` (padding de las cuatro caras) | **sí** (`top + --lob-pad`) |
| Salas y Sala de espera (`.sal`) | `salas.css:118-122`, más pies en `:688-689` y `:712` | **sí** |
| Hoja ⚙ (lobby y `.sal`) | `hojaMarco.css:63-66` | **sí** (`top` y `right`) |
| Hoja de configuración (toast) | `hojaConfiguracion.css:105` | solo abajo |
| Intersticial «Sumamente» | `sumamente.css:36-40`, `:227` | **sí** |
| Lámina de video | `video.css:63-67` | **sí** |
| Tutorial, botón «Salir»/«Cerrar» | `senal.css:214-215` (`max(8px, env(...))`) | **sí** |
| Panel ⋮ de la mesa y sus satélites | `useUtilitiesMenu.js:76, 80-81, 90, 151` (pinza `clamp()` en línea) | **sí, el panel**; el **botón ⋮** no |
| **Mesa** (cabecera, `.header-right` con el ⋮, paneles de rivales) | `gameTable.css` (**protegido**), `menuMovil.css`, `tactil.css`, `escala.css` | **no**: ninguna reserva |
| **Portada** | `portada.css`, `welcome.css` | **no** |

Lo que quedaría debajo del agujero de la cámara con `cover` en vertical: en el lobby, las salas, las hojas, Sumamente, el video y el tutorial, **nada**, porque la reserva ya está escrita y se encendería sola. En **la mesa y la Portada** el contenido de arriba subiría hasta el borde físico: en la mesa, la cabecera (el ⋮ está a la derecha, el agujero del S25 en el centro) y la fila de rivales de arriba. **No hay en `src/` ninguna pantalla ni clase llamada «la Noche»**: el único resultado de `grep -i noche` es una subcadena de `IconoCheck`. Si la ficha se refiere a otra franja, que el rector la nombre y la tanda la mide.

### B.4 · El núcleo (`src/lib/pantallaCompletaCore.js`)

- `instalada(win)` (`:43-47`) devuelve verdadero con `(display-mode: standalone)`, **o** `(display-mode: fullscreen)`, **o** `navigator.standalone === true`.
- `aplica(win)` (`:50-56`) = `(hover: none) and (pointer: coarse)` **y** `requestFullscreen` es función **y** `fullscreenEnabled !== false` **y** `!instalada(win)`.
- `pedir(doc, win)` (`:79-90`): si no `aplica`, nada. Si ya hay `fullscreenElement`, nada. Si no, llama a `requestFullscreen({ navigationUI: 'hide' })` de forma síncrona y se traga el rechazo.
- «Dentro de la mesa» (R4): `creaPantallaCompleta` (`:102-121`) guarda `dentroMesa`, que `App.jsx:728` fija con `screen === 'table'`. Fuera de la mesa, cada `pointerup` (en captura, sobre `document`) pide. Dentro, solo `reentrar`.
- Safari del iPad (IOS-1 1a): `esSafariDeIPad` (`:62-66`) y `pideAqui` (`:71-74`). En el iPad solo pide dentro de la mesa y en horizontal.
- La prueba, `pantallaCompletaCore.test.js` (354 líneas, 19 casos), tiene el caso **3 · «instalada (R5): no hace nada»** y el caso **17 · la app instalada en el iPad**. El caso 7 vigila que no haya ninguna llamada de salida en `src/`.

### B.5 · Quién toca la pantalla completa en `src/`

| Archivo:línea | Disparador | ¿Pide? | ¿Pasa por `aplica()`? |
|---|---|---|---|
| `pantallaCompletaCore.js:84` | único `requestFullscreen` de `src/` | sí | **sí** (`:80`) |
| `App.jsx:723-725` | `creaPantallaCompleta` + `engancha()`: `pointerup` en captura sobre el documento | sí, fuera de la mesa | **sí** (`alGesto` → `pideAqui` → `pedir`) |
| `App.jsx:728` | `fijaDentroMesa(screen === 'table')` | no | — |
| `GameTable.jsx:2772` | «Iniciar mano» → `reentrar` | sí | **sí** |
| `GameTable.jsx:2937` | «Siguiente mano» → `reentrar` | sí | **sí** |
| `AnuncioPvP.jsx:19` | «Omitir» del anuncio PvP → `reentrar` (MES-PvP, sub-tanda 3) | sí | **sí** |
| `SorteoMesa.jsx:107` | elegir carta del sorteo → `reentrar` (MES-PvP L-M 1) | sí | **sí** |
| `escala.js:161, 184` | lee `fullscreenElement` y escucha `fullscreenchange` para el factor de escala | no | — |
| `escala.js:160, 177, 181` | `matchMedia('(orientation: portrait)')` y `orientationchange`, solo para leer | no | — |
| `CapaSenal.jsx:216-234`, `Capitulo.jsx:223-233` | `pedir` **homónimo**: pide un cuadro de medida (`rAF`), no la pantalla completa | no | — |
| `controlVideo.js:137`, `rankingApi.js:92,137`, `App.jsx:797` | `pedir` **homónimo** de red | no | — |

`webkitRequestFullscreen` y `screen.orientation` no aparecen en ninguna parte.

**Punto 6 (estado tras PAN-1):** el oyente de `App.jsx` y las dos reentradas de `GameTable.jsx` siguen como las dejó PAN-1 1c. Después se sumaron **dos llamadores** de `reentrar`, los de `AnuncioPvP.jsx` y `SorteoMesa.jsx`. Los dos van por el mismo núcleo y no cambian el veredicto.

### C.7 · Protegidos y peso

- La lista v1.9 de `docs/AJILEI_Protegidos_v1.0.md §2` tiene siete archivos: `gameEngine.js`, `aiPlayer.js`, `deck.js`, `seatLayouts.js`, `opponentPanel.css`, `gameTable.css` y `pozos.js`. **Ni `index.html`, ni el manifiesto, ni `App.jsx`, ni `pantallaCompletaCore.js` están en ella.** `gameTable.css` sí lo está, y eso pesa en §P1: la mesa no tiene reserva y no se le puede añadir ahí.
- `1.8b` = **180,1 KiB**, según los informes de TUT-1 T6 y T7 (sobre `a98d842` y `cb4ade0`). No lo he vuelto a medir porque la fase no construye. Las piezas (a) y (b) no tocan JS. La (c) añade unas líneas al núcleo, que ya viaja en la entrada.

---

## 2 · Veredicto sobre la lectura del rector (§0)

1. **¿La cabecera lleva `viewport-fit=cover`?** **No** (`index.html:9`, literal arriba). La pista principal sigue en pie.
2. **¿Hay `theme_color`?** **Sí, y ya es oscuro** (`#0a1e10`), en el manifiesto y en la meta. **Esto corrige la pieza (b) de la ficha**, que lo daba por ausente. Y es evidencia: la franja sale **blanca** aunque `theme_color`, `background_color` y el fondo de `:root` son verde abismo. Así que **la franja no la pinta la página ni la tiñe el manifiesto**. Es superficie nativa de Chrome/WebAPK, por fuera del contenido web, con el fondo por defecto de la ventana (blanco en tema claro). Encaja con la lectura del rector, «el margen se reserva y se pinta», y con que el defecto viva en el reparto de *insets* de Chrome (issue 407420295) y no en nada que la página declare como color.
3. **¿Algún llamador pide en el WebAPK?** **No.** Los cinco caminos de B.5 que piden pasan por `aplica()`, que se corta en `!instalada(win)`. Esto vale tanto si el WebAPK del S25 reporta `display-mode: fullscreen` como si cayera a `standalone`, porque `instalada` acepta los dos. Es lo que dicen V2–V5 («sin aviso de Chrome»): R5 se cumple al pie de la letra. Leyendo el código no se puede saber **cuál** de los dos modos reporta el S25. El comportamiento de V5 (barras que aparecen al tocar y se esconden solas a los 2–3 s) es el del inmersivo, así que es casi seguro `fullscreen`. Lo confirma la primera medida de la tanda.
4. **Lo que no se puede saber leyendo:**
   - si `cover` hace que Chrome 158 suelte el margen en el WebAPK, o si el defecto de Chromium lo reserva igual;
   - si en el estado roto el contenido web **encoge** (`innerHeight` menor) o solo se **desplaza**;
   - si la franja cambia de color con el tema oscuro del teléfono.

   Esto último es barato y lo puede ver Victor sin tanda (§P6).
5. **Por qué el Motorola sí y el S25 no** (lectura compatible, sin probar): Android 15+ obliga al *edge-to-edge* a las apps con *targetSdk* reciente, y el caparazón del WebAPK tiene que repartir él los *insets* de la barra de estado y del recorte de la cámara. El Motorola, con un Android anterior, sigue el camino viejo. Que el giro o el desbloqueo cambien el resultado (V3–V5) apunta a un cálculo de *insets* que depende del orden de los eventos del sistema, no a nada de AJILEI.

---

## 3 · La señal de «instalada y con el margen reservado»

**Candidata:**

```
display-mode: fullscreen   (instalada en inmersivo; el iPhone/iPad instalado es standalone y queda fuera)
∧ !document.fullscreenElement   (no es la pantalla completa de la API, la de la pestaña)
∧ (hover: none) and (pointer: coarse)
∧ screen.height − window.innerHeight ≥ 8   (en la orientación actual; Chrome Android rota screen.width/height)
```

**Por qué esta y no las otras:**

- **`innerHeight` frente a `screen.height`.** En inmersivo sano, las dos barras están escondidas y la ventana de la página mide lo mismo que la pantalla, así que la diferencia es 0. Eso es el Motorola (V6), y en ese caso no se hace nada. Con el margen reservado, la diferencia sería el alto de la franja (unos 24–32 px CSS en el S25). El umbral de 8 absorbe redondeos de `devicePixelRatio`.
- **`visualViewport.height` no sirve.** Baja con el zoom y, en Chrome, con el teclado. `innerHeight` no baja con el teclado: el proyecto ya midió `resizes-visual` en CFG-1 1b-L. Es peor señal.
- **`document.fullscreenElement` solo no basta.** En el WebAPK vale `null` tanto sano como roto: el inmersivo del manifiesto no es el de la API.
- **`display-mode` solo no basta.** Vale `fullscreen` en los dos estados.
- **Riesgo que no se puede quitar leyendo:** si en el estado roto Chrome **desplaza** el contenido en vez de encogerlo, `innerHeight` seguiría igual a `screen.height` y la señal no lo vería. Entonces habría que mirar `screen.availHeight`, `outerHeight` o una sonda CSS de `env(safe-area-inset-top)`. Por eso la tanda **mide antes de cablear** (§P4).
- Se lee **en vivo en cada gesto**, como hoy `aplica()`. V5, bloquear y desbloquear, devuelve el estado roto a mitad de sesión, y una señal fijada al arrancar se lo perdería.

---

## 4 · Propuesta de la tanda PAN-2 (decisiones §P)

Va de lo más barato a lo más caro. **Cada pieza se prueba sola en el S25 (y en el Motorola) antes de sumar la siguiente.**

### P1 · (a) `viewport-fit=cover`: ¿estático o solo en la app instalada?

Es la pieza candidata a resolverlo sola. No requiere reinstalar: no hay service worker y `index.html` revalida siempre, así que basta con cerrar y abrir la app instalada.

- **P1-A · Estático en `index.html:9`.** Una línea: `width=device-width, initial-scale=1.0, viewport-fit=cover`. Enciende FS-1 **en todas partes**:
  - En la **pestaña de Chrome** (PAN-1), al entrar en pantalla completa por la API, la página también pinta bajo el agujero.
  - En **iOS** (iPhone en horizontal con la muesca a un lado, iPhone e iPad instalados con `black-translucent`), los `env()` de A.3 dejan de valer 0: el lobby, las salas y las hojas ganan aire, que es justo la R-1 de iOS Sesión 1. Pero cambian las cifras que IOS-1, TAB-1 y TAB-3 midieron con los *insets* a 0.
  - En **la mesa y la Portada no hay reserva**. En la mesa no se puede poner en `gameTable.css` (protegido), y la ficha dice que la mesa no se toca. Si la cabecera de la mesa queda bajo el agujero, eso es un STOP.
- **P1-B · Solo en la app instalada (recomendada).** En el arranque (`main.jsx`, antes de pintar), si `matchMedia('(display-mode: fullscreen)').matches`, se reescribe `content` de la meta del viewport añadiendo `viewport-fit=cover`.
  - **Solo cambia el WebAPK de Android**: el S25 y el Motorola. La pestaña arranca en `browser`. iOS instalado es `standalone`.
  - Chrome lee los cambios de `viewport-fit` en caliente. La tanda lo confirma en el S25.
  - Alcance mínimo. Deja FS-1 completo (pestaña e iOS) como decisión aparte, que es donde estaba.
  - Coste: unas 6 líneas fuera de los protegidos y fuera del núcleo.
- En las dos variantes hay que medir en el S25, en vertical, qué queda bajo el agujero en la **mesa** (cabecera y rivales de arriba, en mesas de 2 a 5) y en la **Portada**. Si algo tapa un control, se para y se pide decisión: la mesa no se toca.

### P2 · (b) `theme_color` y `display_override`

- **`theme_color` ya está, oscuro, en los dos sitios** (A.1, A.2). No hay nada que hacer.
- **`display_override: ["fullscreen", "standalone"]` no lo recomiendo.** Con `display: fullscreen` ya honrado (V5), es redundante: el orden dice lo mismo que `display`. Además, cambiar el manifiesto obliga a desinstalar y volver a instalar en cada prueba, y no ataca la franja, que es nativa y no del color del manifiesto. Lo dejaría para el día en que algún Chrome caiga de verdad a `standalone`, que hoy nadie ha visto. **«Lo justo, nunca de más».**

### P3 · (c) Pedir la API en el WebAPK, solo si (a) no basta

- Se cambia el núcleo. Se divide `instalada` en dos ideas: «instalada **sana**», que sigue sin hacer nada (R5, Motorola), e «instalada **con margen**», la señal de §3, que entra en `aplica()` como un caso más. Así se pide al primer toque fuera de la mesa, con la misma política R4 dentro de la mesa («Iniciar mano», «Siguiente mano», y ahora también el anuncio y el sorteo PvP, que ya llaman a `reentrar`).
- Requiere **enmendar INV-45 R5**, con fecha 2026-11-26.
- **Riesgos a medir en el S25:**
  - el aviso de Chrome («desliza para salir») en un WebAPK ya inmersivo;
  - si la transición a la pantalla completa de la API recalcula los *insets* (V3–V5 sugieren que cualquier transición lo hace, pero no se ha probado);
  - que no entre en bucle con `fullscreenchange` ni con el factor de `escala.js:184`, que en el teléfono vale 1.
- **Vara:** `pantallaCompletaCore.test.js`. El caso 3 se parte en «3a · instalada sana: no hace nada» y «3b · instalada con margen: pide al primer toque fuera de la mesa; dentro, solo `reentrar`». Se añade «3c · al recuperar el margen (bloqueo/desbloqueo) vuelve a pedir con el siguiente toque». Los casos 16 (iPhone) y 17 (iPad instalado) no cambian.

### P4 · Cómo se prueba

- **Build del túnel, instalada desde el túnel en el S25.** Es un segundo icono, porque el origen distinto da otro WebAPK. Se desinstala al terminar. Con P1-B no hace falta reinstalar entre cambios; solo si se tocara el manifiesto. Lo mismo en el Motorola.
- **Diagnóstico en pantalla, primero, antes de (a).** Detrás de una variable de build (`VITE_PAN2_DIAG`, como el `VITE_TUT_DIAG` de TUT-1 T5), **solo en el build del túnel y retirado antes del commit**. Pinta en una esquina: `display-mode`, `fullscreenElement`, `innerWidth×innerHeight`, `screen.width×height`, `screen.availHeight`, `outerHeight`, `visualViewport.height`, `devicePixelRatio` y una sonda CSS de `env(safe-area-inset-top)`.
  - En el S25 se lee en cuatro estados: arranque roto, tras girar, tras bloquear y desbloquear, y tras tocar la franja (V5). En el Motorola, en el estado sano.
  - Esto decide la señal de §3 **antes** de necesitarla.
  - Cadena prohibida en el `dist` de producción: `pan2-diag`, con la misma regla y la misma guardia que `tut-diag`.
- **Orden:**
  1. Diagnóstico solo (línea base).
  2. (a) con P1-B y el diagnóstico.
  3. Si la franja sigue: (c) con el diagnóstico.
  4. Fuera el diagnóstico.
  5. Verificación final sin él en el S25, el Motorola y una pestaña de Chrome (PAN-1 intacto).

### P5 · Varas

- **Si solo entra (a):** no se recablea ninguna vara. La valida el teléfono y la deja escrita el informe de cierre. Opcional y barato: un caso en `pantallaCompletaCore.test.js`, o donde decida el rector, que fije que `cover` se añade **solo** con `display-mode: fullscreen` (P1-B), para que nadie lo pierda ni lo generalice sin querer. Lo recomiendo si entra P1-B, porque es lógica de arranque y no una línea de HTML.
- **Si entra (c):** `pantallaCompletaCore.test.js` como en P3.
- `diagDSK` y el arnés no se tocan. Los rectángulos de Edge no ven `display-mode: fullscreen`, así que nada de lo que miden cambia con P1-B. Con P1-A, en Chromium de escritorio `env()` sigue valiendo 0, pero WebKit (`scripts/ios/`) sí cambiaría, y habría que repasarlo.

### P6 · Una pregunta barata para Victor, sin tanda

Con el S25 en **tema oscuro del sistema**, ¿la franja sale negra o sigue blanca? Si cambia, queda confirmado que es el fondo nativo de la ventana. Y si con ninguna pieza se elimina, (c) y el fondo serían el plan B.

### P7 · Estimación (minutos de Claude Code)

| Pieza | Min |
|---|---|
| Diagnóstico tras la bandera + build del túnel + guía de lectura para Victor | 25 |
| (a) P1-B + caso de prueba + build del túnel | 20 |
| (c), si hace falta: núcleo + casos 3a–3c + enmienda de INV-45 en el normativo | 40 |
| Retirada del diagnóstico + guardia del `dist` + `npm test` + `commit` + informe de cierre | 30 |
| **Total** | **≈75 sin (c) · ≈115 con (c)** |

Sin contar las esperas de las pruebas de Victor en los teléfonos.

---

## 5 · Lo que no se toca

La mesa (`gameTable.css` y las demás hojas de la mesa), el óvalo, los siete protegidos, `escala.js`, el arnés y `diagDSK`, el manifiesto (salvo que el rector reabra P2) y la Portada. Si (a) dejara un control de la mesa o de la Portada bajo el agujero de la cámara, **se para y se pide decisión**: no se compensa con CSS en la mesa.

---

**STOP-0.** A la espera de las §P del rector.
