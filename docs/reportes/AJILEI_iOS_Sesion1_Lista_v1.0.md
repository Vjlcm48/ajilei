# AJILEI · iOS · Sesión 1 — lista de pruebas y pasada previa (v1.0)

**Fecha:** 10-oct-2026 · **Base:** `main` en `f1ea8d0` (ECO-1 publicada hasta la 1d) · **Contra:** `ajilei.io`
**Aparatos:** iPhone 17 Pro Max (iOS 27.0.1) · iPad mini 6 (iPadOS 27.0) · Safari y app instalada («Añadir a pantalla de inicio»)
**Alcance de esta ficha:** solo lectura. No se tocó `src/`, `scripts/`, `supabase/` ni la base. La única escritura en el repo es este informe. Sin `git add` ni commits.

---

## 0 · Lo que hay que saber antes de coger los aparatos

1. **Hallazgo H-1 (puede bloquear el iPad en horizontal dentro de Safari).** Con la mesa en disposición de escritorio, los botones «Pasar / Apostar / Retirarse» quedan cortados por abajo cuando la ventana mide **menos de ~680 px de alto** (mesas de 5 y de 4) o menos de unos 650 (mesa de 2). El iPad mini en horizontal mide 744 px a pantalla entera, pero Safari le quita la barra de estado y la suya: lo que quede está justo en esa frontera. A pantalla entera (744) no pasa. Es **la primera prueba del iPad** (A9). Detalle en §3.2.
2. **Riesgo R-1 (app instalada en el iPhone).** `index.html` no lleva `viewport-fit=cover` y sí `black-translucent`. Con esa pareja, lo normal en iOS es que la página empiece **debajo** del reloj y de la isla, y las reservas `env(safe-area-inset-*)` que el código ya tiene escritas valen 0. La barra de arriba del lobby (avatar, saldo, constancia, engranaje) y la fila de arriba de la mesa (⋮ y ✕) son las candidatas a quedar tapadas. **No se puede medir desde aquí**; se decide en el aparato (A10).
3. **Riesgo R-2 (iPad, pantalla completa de PAN-1).** PAN-1 dio por hecho que «Safari no tiene la API». En el iPhone es así; **en el iPad la API sí existe**, y la condición del código (táctil + API + no instalada) se cumple: al primer toque el iPad puede entrar en pantalla completa. Hay que ver qué hace con el teclado del correo y con la ✕ que Safari pinta arriba a la izquierda (A8).
4. **Safari y la app instalada son dos «dispositivos» para AJILEI.** Cada una guarda su sesión y su `localStorage`. Hay que entrar dos veces (dos códigos por correo), y una mesa abierta en una no la recoge la otra hasta pasados 10 minutos. Nadie pierde fichas. Detalle en §2.3.
5. **El día 1 la constancia no paga.** La ficha debe decir «1/3» y el saldo debe ser **2.500** (el bono). Los 500 HC llegan al tercer día seguido (`constancia_ciclo() = 3`). Si el día 1 aparece un «+500», es un fallo.
6. **Antes de empezar, en los dos aparatos:** quitar el modo silencio (el interruptor o el botón de acción) y subir el volumen —el sonido del juego es Web Audio y **iOS lo calla con el modo silencio**—; apagar «Reducir movimiento» (Ajustes › Accesibilidad › Movimiento), porque con él activo la app no hace sonar el aviso de saldo ni la fiesta; apagar el modo de bajo consumo; no usar navegación privada.

**Minutos estimados:** bloque A ≈ 30 · bloque B ≈ 40 · bloque C ≈ 20.

---

## 1 · Barrido de pendientes de iPhone / iOS / iPad / WebKit / Safari

Se leyeron las ~620 menciones en 120 documentos de `docs/` y `docs/reportes/`. La mayoría son descriptivas («se midió con el WebKit de Playwright») o falsas coincidencias. **Ningún documento registra una validación hecha en un iPhone o iPad real.** El índice más reciente de la casa es `docs/reportes/AJILEI_ARN-3_Cierre_v1.0.md:85-109`; después solo PAN-1 añadió marcas.

| # | Campaña | Dónde está la marca | Qué quedó sin comprobar | ¿Vigente con el código de hoy? |
|---|---|---|---|---|
| 1 | DIS-1 | `AJILEI_DIS-1_Cierre_v1.0.md:66,70` («iPhone: pendiente; se probará contra ajilei.io») | La escena 5 de la Portada (teléfono y laptop) en un Safari real | **Vigente solo como vistazo.** Los dos riesgos de origen ya no aplican: los aparatos son dos `<img class="pue-dis">` horneados (`src/screens/Portada.jsx:504-517`), sin marco CSS con `aspect-ratio` ni `matrix3d`. Prueba C1 |
| 2 | PUE (instalada) | `AJILEI_PUE_Fase1_Informe_v1.0.md:505-508`; `AJILEI_PUE_Fase0_Informe_v1.0.md:565-572` («RIESGO DECLARADO, NO VERIFICADO») | Que «Añadir a pantalla de inicio» abra sin la barra de Safari, con el verde hasta arriba, el icono y el nombre «AJILEI» | **Vigente.** `index.html:80-82`. Además, desde PAN-1 el manifiesto dice `"display": "fullscreen"` (`public/manifest.webmanifest:6`); cómo lo trata iOS no está visto. Pruebas A10 y B9 |
| 3 | PUE (auditoría) | `AJILEI_PUE_Auditoria_Informe_v1.0.md:625-627` | `checkVisibility`, `mix-blend-mode` y la hoja móvil en iOS | **Parcial.** `mix-blend-mode` ya no existe en `src/`; `checkVisibility` solo lo usa el arnés. Queda la hoja móvil (`src/styles/portada.css:819-860`). Prueba C2 |
| 4 | MON-1 | `AJILEI_MON1_Fase0_Informe_v1.0.md:470,868` («Safari/iOS no reproduce VP9 con alfa») | El `<video>` de la moneda | **Ya no aplica.** No hay `<video>` en `src/`: la moneda es un WebP animado en un `<img>` (`src/screens/Portada.jsx:486-495`). Queda un vistazo al WebP animado (C1), que no tenía marca |
| 5 | FRZ-1 (y AJF-1) | `AJILEI_AJF-1_Informe_v1.0.md:98`; `AJILEI_FRZ1_Cierre_Reporte_v1.0.md:46` («sellado no es lo mismo que visto») | El camino `pagehide` sin `visibilitychange`, que solo iOS manda | **Vigente.** `src/hooks/useCongelado.js:54-64,124-135`. Solo lo cubre la prueba unitaria. Pruebas B2 y B3 |
| 6 | FRZ-1 (nota) | `AJILEI_FRZ1_Fase0_Informe_v1.0.md:199` («volver exige un `resume()` tras gesto, que no existe en el proyecto») | Que el sonido vuelva tras bloquear el iPhone | **Vigente.** Sigue sin haber `.resume(` en `src/`; se delega en Howler (`node_modules/howler/dist/howler.js:514-524`). Prueba B2 |
| 7 | CAR-1 | `AJILEI_CAR1_Fase0_Informe_v1.0.md:227` («AVIF en el iPhone, si se elige ese camino») | AVIF de las cartas | **No aplica:** AVIF se descartó y las cartas son WebP (`src/components/CardImage.jsx:11`). **Pero** el mismo riesgo vive sin marca en las reacciones: `src/components/Reacciones.jsx:302-303` sirve un `.avif` animado sin formato alternativo. Prueba C6 |
| 8 | BIE-1 | `AJILEI_BIE-1_Fase0_Informe_v1.0.md:201` («en iOS ese clic podría salir mudo») | Que el primer clic de la Portada suene | **Vigente.** Mitigación puesta y no vista: `src/hooks/useSounds.js:60-65`, `src/screens/Portada.jsx:259`. Prueba B1 |
| 9 | LUZ-1 | `AJILEI_LUZ-1_Informe_Cierre_v1.0.md:55` | `calc()` dentro del alfa de `rgba()` en un Safari real | **Vigente** (`src/styles/luz.css:30,46-51`). Con iOS 27 el riesgo es bajo. Prueba C3 |
| 10 | REV-1 | `AJILEI_REV-1_Informe_Cierre_v1.0.md:87` | El reverso de mesa y la carta que vuela | **Vigente** (`src/styles/rev.css`). Prueba C3 |
| 11 | REC-1 | `AJILEI_REC-1_Informe_Cierre_v1.0.md:137` | La burbuja y la tarjeta de recarga | **Vigente** (`src/styles/rec.css`, `src/styles/tactil.css`). Prueba C5 |
| 12 | SAL-B1 | `AJILEI_SAL-B1_Fase1_Informe_v1.0.md:233` | Las pantallas de salas en iPhone | **Vigente.** El cierre se validó sin iPhone. Prueba C8 |
| 13 | SAL-B2 | `AJILEI_SAL-B2_Cierre_v1.0.md:113,132` («E9 pendiente») | El invitado sin cuenta que llega por `?sala=` desde un iPhone | **Vigente** (`src/config/salaPendiente.js`, `src/App.jsx:179`). Necesita un tercer correo sin cuenta: queda **fuera de esta sesión** salvo que sobre uno (C9) |
| 14 | ARN-3d | `AJILEI_ARN-3d_Informe_v1.0.md:635-658,797` («iPhone: pendiente… entra en la sesión intensiva de iOS») | Los 7 pasos de la mesa diferida | **Vigente.** La rama sin `requestIdleCallback` (`src/lib/cargarMesa.js:108-114`) corrió hoy por primera vez en un WebKit (§3), pero no en un aparato. Pruebas A4, B1 y B12 |
| 15 | PAN-1 | `AJILEI_PAN-1_Cierre_v1.0.md:48,81` («Safari no tiene la API y la función no hace nada») | (a) que no haga nada en Safari, (b) la app instalada, (c) el piso táctil, (d) el `:hover` pegado | **Vigentes las cuatro**, y (a) es falso para el iPad (riesgo R-2). `src/lib/pantallaCompletaCore.js:39-45`, `src/styles/tactil.css:20-22,26-93`. Pruebas A8, A10, C4 |
| 16 | ARN-3 / INV-41 | `AJILEI_ARN-3_Cierre_v1.0.md:62,109`; `docs/AJILEI_Invariantes_v1.0.md:81` | La sesión de iOS y su lista | **Se cierra con este documento** (la lista) y con la sesión |

**Sin marca y que deberían tenerla** (hallados en el barrido):

- **ECO-1 (1a–1d) no lleva línea de iOS** y toca pantallas visibles (constancia, avisos, billetera). INV-41 la pide en el cierre, y ECO-1 aún no lo tiene. Las pruebas A3, A7, B4–B8 la cubren.
- **`viewport-fit=cover` ausente**: lo dicen `AJILEI_LOB1_Fase1_Informe_v1.0.md:332` y `src/styles/lobby.css:128-131`, sin nombrar al iPhone. Es el riesgo R-1.
- **Tabletas en vertical**: `AJILEI_LUZ-1_Fase1_Informe_v1.0.md:242` deja «decisión pendiente del rector». Hoy el iPad en vertical recibe la disposición de teléfono (§2.7).

---

## 2 · Riesgos de iOS en el código de hoy

Lo que sigue es lectura del código. Donde digo «iOS hace…» sin haberlo podido medir, lo marco como **sin verificar**: se decide en el aparato.

### 2.1 · El audio

Todo el sonido pasa por Howler en modo Web Audio (ningún `html5: true` en `src/`): `src/hooks/useSounds.js:51`.

| Qué | Archivo:línea | Qué hace hoy | Qué puede pasar en iOS |
|---|---|---|---|
| El desbloqueo | `howler.js:301-410`; `src/screens/Portada.jsx:259`; `src/screens/Lobby.jsx:94` | Howler arma su desbloqueo (`touchstart`/`touchend`/`click`) al construirse el primer `Howl`. La Portada construye `buttonClick` 1 s después de montar; el lobby, `tableKnock` al montar | Si el primer toque llega **antes** de ese segundo, el clic puede salir mudo. Un toque muy rápido al abrir es el caso a probar (B1) |
| El modo silencio | — | No hay nada en el código que lo trate | iOS calla Web Audio con el modo silencio. **No es un fallo de AJILEI**, pero hace falso un «no suena» |
| El toc-toc | `src/screens/Lobby.jsx:149` (CTA); `src/components/GameTable.jsx:1004` (fiesta) | En el lobby suena dentro del toque; en la fiesta, encadenado desde un reloj | El del lobby es seguro. El de la fiesta depende de que el audio siga desbloqueado |
| `chipsCollect` | `src/hooks/useSounds.js:77-81` | Precargado con los de la mesa (ARN-3d) | Sin riesgo propio; se oye en la primera mano que se cobra |
| La celebración | `src/hooks/useCoreografia.js:188,209`; `src/config/melodiasCelebracion.js:48-49` | Un `Howl` nuevo por fiesta, `.mp3` primero y `.ogg` después | Safari toma el `.mp3`. Suena desde un evento `end`, no desde un toque: bien mientras el contexto esté vivo |
| El aviso de saldo | `src/hooks/useAvisoSaldo.js:69-72` | `chipsCollect` a volumen suave cuando el aviso empieza a contar; calla con «Reducir movimiento» | Al **abrir** la app (mesa recogida, constancia del día 3) el aviso sale antes de cualquier toque: el audio aún está bloqueado. Howler deja el sonido **en espera** y lo suelta con el primer toque (`howler.js:886`): puede sonar tarde, pegado al primer botón. En Android pasa lo mismo, pero aquí no se ha visto (B8) |
| Volver de bloqueo | `src/hooks/useCongelado.js:58-70`; `howler.js:514-524` | Al ocultarse pone el volumen a 0 y al volver lo restaura. Nadie llama a `resume()` | iOS deja el contexto de audio «interrumpido» al bloquear. Howler lo reanuda en el siguiente `play`, pero si ese `play` no nace de un toque, iOS puede negarlo: **la mesa podría quedar muda hasta el siguiente toque, o más** (B2). Sin verificar |

### 2.2 · La pantalla completa de PAN-1

`src/lib/pantallaCompletaCore.js:39-45` pide tres cosas a la vez: entrada táctil (`(hover: none) and (pointer: coarse)`, línea 27), que exista `requestFullscreen`, y que no esté instalada. Se engancha una vez en `src/App.jsx:508-516` y la mesa la vuelve a pedir en `src/components/GameTable.jsx:2414,2563`.

- **iPhone, Safari.** Hasta iOS 18 el iPhone no ofrecía `requestFullscreen` en la página: `aplica()` da falso y **no se hace nada**, ni se rompe nada (la detección es por capacidad, no por nombre del navegador). No sé si iOS 27 la ha añadido; si la tiene, el iPhone se comportará como el iPad de abajo. La prueba A2 lo dice en diez segundos.
- **iPad, Safari.** La API existe desde hace años y el iPad sin ratón es táctil: `aplica()` da **verdadero**. Al primer toque en la Portada, Safari entra en pantalla completa. Tres cosas sin verificar, las tres importantes:
  1. Safari pinta su propia ✕ arriba a la izquierda, encima de la página. En la mesa, esa esquina es la de la marca; la ✕ de salir de la mesa está a la derecha.
  2. El teclado. Con pantalla completa de página (no de video), Safari en iPad ha puesto históricamente pegas al teclado en pantalla y saca un aviso de «parece que estás escribiendo en pantalla completa» cuando ve toques rápidos y repetidos en la parte baja. Los toques del registro (correo, código) y los de la mesa son candidatos.
  3. Si Safari saca a la página de pantalla completa, fuera de la mesa el siguiente toque **la vuelve a pedir** (regla R4): puede verse un entrar y salir a cada toque mientras se escribe el correo.
- **App instalada (los dos).** `navigator.standalone === true` (línea 35): no se pide nada. Correcto.
- **El manifiesto dice `fullscreen`** (`public/manifest.webmanifest:6`). iOS no conoce ese modo; lo esperable es que caiga a `standalone` gracias a la meta de `index.html:80`. Sin verificar (A10).

### 2.3 · La app instalada: dos almacenes, dos «dispositivos»

Safari y la app instalada no comparten nada de lo que guarda el navegador. En `localStorage` viven: la sesión de Supabase (`sb-<ref>-auth-token`), `ajilei.dispositivo` (`src/lib/dispositivo.js:17`), `ajilei.sound`, `ajilei.tapete`, `ajilei.tapetes.comprados` (`src/config/tapetes.js:87-88`), `ajilei.consultas` (`src/config/consultas.js:11`), `ajilei.retoConfig`, `ajilei.idioma` y `ajilei.salaPendiente`.

**Consecuencias, por orden de importancia:**

1. **Hay que entrar otra vez en la app instalada**, con otro código por correo. Y el paso «espero el código» solo vive en memoria (`src/components/FormularioPuerta.jsx:39-41`): si iOS recarga la app mientras se mira el correo, vuelve al paso del correo y hay que pedir otro código. Para no tropezar, leer el código en la notificación o en la sugerencia del teclado (el campo lleva `autoComplete="one-time-code"`, línea 152) sin salir de la app.
2. **Recogida de mesas (P-4 de la 1c).** Al arrancar, `recoger_mesa_ia` recibe la marca de este almacén (`src/App.jsx:395`). El servidor recoge en el acto la mesa abierta **desde la misma marca**, y la de otra marca solo tras 10 minutos sin avisos (`supabase/migrations/20261008220239_eco1c_mesas_ia.sql:97-101`).
   - Mesa abierta en Safari, se cierra la pestaña y se vuelve a abrir **Safari**: se recoge al instante, con el aviso «Volvieron N HC de tu partida anterior.». Igual dentro de la app instalada.
   - Mesa abierta en Safari y se abre **la app instalada** (o al revés) antes de 10 minutos: **no se recoge y no hay aviso**. El saldo se ve más bajo, porque la entrada sigue en la mesa. No es un fallo. Se resuelve de dos maneras: sentándose en una mesa nueva (el servidor cierra la vieja y devuelve sus fichas) o esperando 10 minutos y abriendo de nuevo.
   - Si después se vuelve a la pestaña vieja, dice «Abriste otra partida en otro dispositivo. Volvieron N HC.» y devuelve al lobby.
   - En iOS una página en segundo plano deja de mandar avisos enseguida: los 10 minutos empiezan a contar casi desde que se cambia de app.
3. **Constancia.** La clave es por jugador y día (en el servidor), no por dispositivo. El primer almacén que abre ese día marca; el segundo recibe «ya marcado»: misma ficha, sin aviso y sin cobro (`src/App.jsx:377-384`). No se puede cobrar dos veces abriendo Safari y la app.
4. **Lo que no viaja de un almacén al otro:** el ajuste de sonido, el tapete elegido, **los tapetes comprados** y **el contador de consultas gratis**. Un tapete comprado en Safari no aparece en la app instalada, y las consultas gratis se pueden gastar dos veces. No es de iOS —pasa igual entre dos navegadores—, pero aquí es donde un jugador real lo va a ver. Va como hallazgo para el rector (H-6).
5. **Safari borra el almacén de un sitio tras 7 días sin usarlo** (la app instalada no). Para un jugador de Safari significa volver a entrar con código y estrenar marca de dispositivo: sus mesas pasan a ser «de otro» (el caso prudente). Sin verificar en iOS 27.

### 2.4 · Zonas seguras, `100vh` frente a `dvh`, y la barra de Safari

- **`index.html:9`** es `width=device-width, initial-scale=1.0`, **sin `viewport-fit=cover`**. `src/styles/lobby.css:128-136` y `src/styles/salas.css:119-122` ya reservan `env(safe-area-inset-*)`, pero sin esa palabra valen 0 (lo dice el propio comentario, `lobby.css:128-131`). La mesa (`src/styles/gameTable.css`) no reserva nada.
  - **Safari, vertical:** la página empieza debajo de la barra de estado y acaba encima de la barra de Safari. Sin riesgo.
  - **Safari, horizontal (iPhone):** iOS mete la página entre las dos zonas de la isla y rellena los lados con el color de fondo. La mesa no mide 956 de ancho sino unos 832 (estimado). Se midió así en §3; sin hallazgos graves.
  - **App instalada, vertical (iPhone):** es el riesgo **R-1** de §0. Con `black-translucent` (`index.html:81`) la página ocupa toda la pantalla y el reloj y la isla van **encima**. La isla del 17 Pro Max cae, aproximadamente, sobre la franja y = 11–48 px en el centro: justo donde el lobby pinta el saldo (§3.4). Abajo, la raya de inicio se pinta sobre los últimos ~34 px: en el lobby, sobre «Rankings / Tienda / Cómo se juega»; en la mesa, sobre el borde de la zona del jugador.
- **Unidades de alto.** La mesa usa `height: 100dvh` (`gameTable.css:6`) y `100svh` para el óvalo (`gameTable.css:1219-1220,1402,1628,1981`); el lobby y las salas, `100vh` con `100dvh` detrás (`lobby.css:124-125`, `salas.css:114-115`); la Portada, `100svh` (`portada.css:57-58`). Todo correcto para Safari.
  - **Quedan con `100vh` a secas** `src/styles/puerta.css:41` (la Entrada y el Bautizo) y `src/styles/welcome.css:3,13`. En Safari de iPhone `100vh` es el alto **con las barras recogidas**: esas pantallas nacen ~80–100 px más altas que lo que se ve y se pueden arrastrar. Con el teclado abierto no molesta; sin él, puede verse el formulario algo bajo. Cosmético (C7).
- **La barra de Safari que sube y baja.** Solo se recoge al arrastrar la página. Lobby, Retar y la mesa no se arrastran, así que no debería moverse. La Portada sí se arrastra, y usa `svh`, que no cambia: sin salto.

### 2.5 · Bloquear, volver, y el primer plano

- **La mesa se congela** con `visibilitychange` y `pagehide` (`src/hooks/useCongelado.js:128-135`) y se descongela solo con `visibilitychange`. iOS puede mandar `pagehide` sin lo otro (es la marca 5 de §1): si pasara, la mesa quedaría congelada y muda hasta el siguiente cambio de visibilidad. La guarda de reentrada (líneas 54-64) evita la mesa «muda para siempre», pero no este caso.
- **Al volver** se relee el saldo (`src/hooks/useBilletera.js:77-84`), se reintenta lo que la mesa tenga pendiente y se pregunta por la constancia solo si cambió el día de Chicago (`src/App.jsx:406-414`, `src/hooks/constanciaCore.js:39-43`).
- **iOS no frena las páginas en segundo plano: las para del todo.** Y a la app instalada puede matarla sin avisar si pasa un rato. Al volver arranca de cero, y la mesa —que solo vive en memoria— ya no existe. Es el camino de «partida cortada» de §2.3: se recoge al arrancar, con su aviso (B4 y B5).
- **El paso del código** se pierde con esa misma recarga (§2.3, punto 1).

### 2.6 · La carga diferida de la mesa y la recarga tras un despliegue (ARN-3d)

- `src/lib/cargarMesa.js:108-114`: Safari no tiene `requestIdleCallback` y la precarga sale por `setTimeout(f, 1)`. Esa rama corrió en la pasada de §3 (el WebKit del arnés tampoco lo tiene) y la mesa llegó en las 56 entradas medidas (32 de la pasada y 24 del barrido).
- `src/main.jsx:43-53`: si el trozo de la mesa ya no existe (se desplegó una versión nueva con la app abierta), se recarga **una vez**, guardándolo en `sessionStorage`. El saldo no se pierde y la mesa abierta se recoge al arrancar.
- **Por qué importa más en iOS:** la app instalada puede quedarse días dormida con el `index.html` viejo en memoria. Es el aparato donde más fácil será caer en este camino. No se puede provocar sin desplegar (B12).

### 2.7 · El iPad: qué disposición recibe

El código **no mira el agente de usuario** en ningún sitio (cero apariciones de `userAgent` o `platform` en `src/`). Que Safari del iPad se presente como Mac no cambia nada. La disposición la deciden solo tres consultas de `src/components/GameTable.jsx:104,110,119` y sus bloques en `gameTable.css`:

| Postura | Tamaño | Consulta que casa | Disposición |
|---|---|---|---|
| iPad vertical | 744 × 1133 (≈ 744 × 1026 en Safari) | `(max-width: 767px) and (orientation: portrait)` | **La de teléfono vertical**, estirada. Por 23 px: a partir de 768 de ancho sería otra |
| iPad horizontal | 1133 × 744 (≈ 1133 × 637–670 en Safari) | `(orientation: landscape) and (min-height: 601px)` | **La de escritorio**, con el sub-bloque táctil (`pointer: coarse`) |
| iPhone vertical | 440 × 956 | la de teléfono vertical | Teléfono |
| iPhone horizontal | 956 × 440 (≈ 832 de ancho útil) | `(orientation: landscape) and (max-height: 600px)` | Teléfono horizontal |

**Medidas que el arnés nunca midió** (inventario de todos los tamaños que aparecen en `scripts/`):

- **Teléfono vertical más ancho de 412 px.** El mayor medido es 412 × 915. Ni 440 (el 17 Pro Max) ni, sobre todo, **744** (el iPad): toda la banda de 481 a 767 px de ancho en vertical está sin medir, y es donde cae el iPad.
- **Escritorio con menos de 720 px de alto.** El más bajo medido es 1280 × 720. La banda de 601 a 719 no la ha visto nadie, y es donde cae **el iPad horizontal dentro de Safari**. Ahí vive el hallazgo H-1.
- **1133 de ancho** no está medido, pero cae en las mismas bandas que 1280 × 720 y 1366 × 768 cuando el alto es 744.
- **Fuera de alcance, pero existe:** el iPad en pantalla dividida o con Stage Manager da ventanas de cualquier tamaño (por ejemplo ~560 × 744, que recibiría la disposición de teléfono).

---

## 3 · Pasada previa con el WebKit del arnés

### 3.1 · Cómo se hizo

- WebKit 26.5 de Playwright (el mismo de `diagPUE dis`), contra `vite preview` de `f1ea8d0`. La compilación y todas las salidas viven **fuera del repo**, en el directorio temporal de la sesión (`…\scratchpad\ios1\`): el guion, el `dist`, 2 JSON y las capturas. Puertos 4191 y 4192; el 4173 no se tocó.
- Sesión simulada y banco imitado (`contextoCap` de `scripts/cap/capMesa.mjs`), con el nombre `ticotest2022` (12 caracteres) y la constancia en el día 1. Ninguna petición salió a la red real.
- **Tamaños.** El iPhone 17 Pro Max mide **440 × 956 px CSS** (1320 × 2868 a ×3) y el iPad mini 6, **744 × 1133** (1488 × 2266 a ×2): los de la ficha son correctos. Pero esos son los de la **pantalla entera**, que solo ve la app instalada. Dentro de Safari la ventana es menor, así que añadí cuatro tamaños **estimados** (marcados así en todo el informe; no conozco las barras exactas de Safari en iOS 27):

| Celda | Tamaño | Qué representa |
|---|---|---|
| iphone-v | 440 × 956 | pantalla entera, vertical |
| iphone-h | 956 × 440 | pantalla entera, horizontal |
| ipad-v | 744 × 1133 | pantalla entera, vertical |
| ipad-h | 1133 × 744 | pantalla entera, horizontal |
| iphone-safari-v | 440 × 763 | **estimado:** Safari con sus barras |
| iphone-safari-h | 832 × 390 | **estimado:** Safari horizontal, sin las zonas de la isla |
| ipad-safari-v | 744 × 1026 | **estimado:** Safari con barra de pestañas aparte |
| ipad-safari-h | 1133 × 637 | **estimado:** ídem, horizontal |

- **Pantallas:** Portada (al cargar, a los 12 s y con el correo escrito), Lobby (con la ficha y el nombre de 12 caracteres; también con la hoja de ajustes), Retar, y la mesa de 5, 4, 3 y 2 en espera, en el turno de apuesta, en el pago y con el menú ⋮.
- **Qué se buscó:** desbordes (documento más ancho o alto que la ventana; textos, imágenes y botones fuera de ella), solapes entre tocables, y **zona táctil real** de menos de 40 px, medida como el modo `tactil` del arnés (barrido con `elementFromPoint`, el `::after` cuenta).
- **Lo que esta pasada no puede ver:** la isla, la barra de estado, la raya de inicio, las barras de Safari, el teclado, el sonido, el bloqueo, la pantalla completa real. Y el WebKit de Windows no hace transformaciones 3D (DIS-1): nada de eso se cuenta como fallo.

### 3.2 · Hallazgos

**Resumen:** 186 celdas en la pasada principal (8 tamaños) y 48 en un barrido de altos. **Cero errores de consola o de página en WebKit, cero desbordes horizontales del documento, cero textos recortados** (el nombre de 12 caracteres cabe sin «…» en los 8 tamaños) y la Portada limpia en sus tres estados. Miré a ojo una docena de capturas; el resto se juzgó por las cifras.

**H-1 · GRAVE si se confirma · iPad horizontal dentro de Safari: los botones de la mesa se cortan por abajo.**
En la disposición de escritorio, la fila «Pasar / Apostar / Retirarse» de las mesas de 5 y de 4 se pinta entre y = 643,5 y y = 677,5 px: necesita una ventana de **678 px de alto o más**. El documento no se desplaza (`height: 100dvh`), así que lo que cae fuera no se alcanza arrastrando.

| Alto de la ventana (ancho 1133) | Mesa de 5, en tu turno | Mesa de 2, en tu turno |
|---|---|---|
| 744 (pantalla entera) · 720 · 700 · 680 | limpia | limpia |
| 670 | los tres botones cortados 7,5 px; zona táctil 31 px | limpia |
| 660 | botones cortados 17,5 px, **su centro ya fuera de la ventana**; «MANO», «TURNO» y «Mesa 50» cortados | limpia |
| 640 · 637 | lo mismo, 20,5 px; «Iniciar mano» cortado 20 px, con el centro fuera | botones cortados 7 px; zona táctil 31 px |
| 620 · 601 | lo mismo, más | cortados, con el centro fuera |

La mesa de 4 se comporta como la de 5; la de 3 salió limpia a 637. En el pago de la mesa de 4 a 637 se salen además, por arriba, la ⋮ y la ✕. **Nadie había medido esta banda:** el escritorio más bajo del arnés es 1280 × 720. Lo que no sé es el alto real que deja Safari en el iPad mini con iPadOS 27 (744 menos la barra de estado y la suya: entre ~637 y ~670 según la barra). Lo dice la prueba A9. En la app instalada (744) no ocurre.

**H-2 · Cosmético · iPad vertical recibe la mesa de teléfono, estirada.** A 744 de ancho casa `(max-width: 767px) and (orientation: portrait)`. Sin desbordes ni solapes; las cinco cartas del jugador quedan repartidas a todo el ancho y sobra verde. Prueba C10.

**H-3 · Menor · tocables de menos de 40 px en el lobby y en Retar** (PAN-1 censó la mesa, no estas pantallas):

| Tocable | iPhone vertical | iPhone horizontal | iPad |
|---|---|---|---|
| El «+» de la píldora del saldo (`.lob-mas`, hoy «Pronto») | 22 px (zona 23 × 24) | 20–22 px | 31 px (zona 31 × 32) |
| El engranaje (`.lob-ajustes`) | 38 px (zona 39 × 40) | 34 px (zona 35 × 35) con 390 de alto | ≥ 40 |
| «Volver» y «Casa» de Retar (`.sal-volver`, `.sal-casa`) | 38 px (zona 39 × 38–39) | 34 px con 390 de alto | ≥ 40 |

**H-4 · Menor · dos tocables de la mesa a 1–5 px del piso.**
- «Pasar» en el iPhone horizontal: zona táctil 150 × **39** (caja pintada de 28) en las cuatro mesas. El modo `tactil` del arnés la da por buena en Chromium a 640 × 360 y 915 × 412; la diferencia de 1 px huele a redondeo de WebKit, pero no lo he demostrado.
- La entrada «Tapetes» del menú ⋮: zona 63 × **35** (caja pintada de 62 × 44) en vertical y en el iPad. Algo le quita 9 px de alto por encima o por debajo.

**H-5 · No se cuenta · nombres y fichas de los rivales durante el pago.** Salen con 29–35 px (nombres) y 25 px (fichas), y algunas fichas tapadas por las cartas reveladas. Coincide con las dos excepciones que PAN-1 1b aceptó («durante la revelación del pago, el ganador manda», y el nombre del panel revelado fuera del piso). Mi sonda no aplica esa regla y el arnés sí: lo anoto para que no se lea como hallazgo nuevo.

**H-6 · De lectura (§2.3), para el rector · tapetes comprados y consultas gratis viven en `localStorage`.** No viajan de Safari a la app instalada.

**H-7 · Correcto por diseño · la hoja de ajustes en el iPhone horizontal.** «Eliminar cuenta» queda 10–31 px bajo la ventana, pero la hoja se desplaza (`src/styles/lobby.css:631-635`). Prueba C11.

**Lo que la pasada dejó sin medir:** el descarte solo se midió en la mesa de 2 (en las otras, la mano acabó sin esa fase); el menú ⋮ de la mesa de 5 solo se abrió en 3 de los 8 tamaños; la escena 5 de la Portada no se juzgó (sin 3D en este WebKit); y nada de lo que lista el final de §3.1.

### 3.3 · Tabla de celdas

Cada celda: **fuera / menos de 40 px / tapados / solapes**. En `lobby-ajustes` los «tapados» son los botones del lobby bajo el velo de la hoja (esperado). «—» = no medida.

| Pantalla | iphone-v | iphone-h | ipad-v | ipad-h | iphone-safari-v | iphone-safari-h | ipad-safari-v | ipad-safari-h |
|---|---|---|---|---|---|---|---|---|
| portada | 0/0/0/0 | 0/0/0/0 | 0/0/0/0 | 0/0/0/0 | 0/0/0/0 | 0/0/0/0 | 0/0/0/0 | 0/0/0/0 |
| portada-12s | 0/0/0/0 | 0/0/0/0 | 0/0/0/0 | 0/0/0/0 | 0/0/0/0 | 0/0/0/0 | 0/0/0/0 | 0/0/0/0 |
| portada-correo | 0/0/0/0 | 0/0/0/0 | 0/0/0/0 | 0/0/0/0 | 0/0/0/0 | 0/0/0/0 | 0/0/0/0 | 0/0/0/0 |
| lobby | 0/2/0/0 | 0/1/0/0 | 0/1/0/0 | 0/1/0/0 | 0/2/0/0 | 0/2/0/0 | 0/1/0/0 | 0/1/0/0 |
| lobby-reposo | 0/2/0/0 | 0/1/0/0 | 0/1/0/0 | 0/1/0/0 | 0/2/0/0 | 0/2/0/0 | 0/1/0/0 | 0/1/0/0 |
| lobby-ajustes | 0/0/8/0 | 2/0/9/5 | 0/0/8/0 | 0/0/8/2 | 0/0/8/1 | 2/1/9/5 | 0/0/8/0 | 0/0/8/6 |
| retar | 0/4/0/0 | 0/3/0/0 | 0/1/0/0 | 0/1/0/0 | 0/4/0/0 | 0/4/0/0 | 0/1/0/0 | 0/1/0/0 |
| mesa5-espera | 0/0/0/0 | 0/0/0/0 | 0/0/0/0 | 0/0/0/0 | 0/0/0/0 | 0/0/0/0 | 0/0/0/0 | 4/0/1/0 |
| mesa5-apuesta | 0/0/0/0 | 0/1/0/0 | 0/0/0/0 | 0/0/0/0 | 0/0/0/0 | 0/1/0/0 | 0/0/0/0 | 6/2/3/0 |
| mesa5-pago | 0/2/0/0 | 0/2/2/0 | 0/2/0/0 | 0/0/0/0 | 0/2/0/0 | 0/2/2/0 | 0/2/0/0 | 3/4/0/0 |
| mesa5-menu | — | — | — | — | 0/3/0/1 | 0/3/2/0 | — | 3/5/1/2 |
| mesa4-espera | 0/0/0/0 | 0/0/0/0 | 0/0/0/0 | 0/0/0/0 | 0/0/0/0 | 0/0/0/0 | 0/0/0/0 | 4/0/1/0 |
| mesa4-apuesta | 0/0/0/0 | 0/1/0/0 | 0/0/0/0 | 0/0/0/0 | 0/0/0/0 | 0/1/0/0 | 0/0/0/0 | 6/2/3/0 |
| mesa4-pago | 0/2/0/0 | 0/1/1/0 | 0/2/0/0 | 0/0/0/0 | 0/2/0/0 | 0/1/1/0 | 0/2/0/0 | 4/0/2/0 |
| mesa4-menu | 0/3/0/0 | 0/1/3/3 | 0/3/0/0 | 0/1/1/2 | 0/3/0/0 | 0/1/3/3 | 0/3/0/0 | 2/3/1/2 |
| mesa3-espera | 0/0/0/0 | 0/0/0/0 | 0/0/0/0 | 0/0/0/0 | 0/0/0/0 | 0/0/0/0 | 0/0/0/0 | 0/0/0/0 |
| mesa3-apuesta | 0/0/0/0 | 0/1/0/0 | 0/0/0/0 | 0/0/0/0 | 0/0/0/0 | 0/1/0/0 | 0/0/0/0 | 0/0/0/0 |
| mesa3-pago | 0/0/2/0 | 0/2/2/0 | 0/0/1/0 | 0/0/0/0 | 0/0/2/0 | 0/2/2/0 | 0/0/1/0 | 0/0/0/0 |
| mesa3-menu | 0/1/2/0 | 0/2/2/0 | 0/1/1/0 | 0/1/1/0 | 0/1/2/0 | 0/2/2/0 | 0/1/1/0 | 0/1/1/0 |
| mesa2-espera | 0/0/0/0 | 0/0/0/0 | 0/0/0/0 | 0/0/0/0 | 0/0/0/0 | 0/0/0/0 | 0/0/0/0 | 0/0/0/0 |
| mesa2-apuesta | 0/0/0/0 | 0/1/0/0 | 0/0/0/0 | 0/0/0/0 | 0/0/0/0 | 0/1/0/0 | 0/0/0/0 | 3/3/0/0 |
| mesa2-descarte | 0/0/0/0 | — | 0/0/0/0 | 0/0/0/0 | 0/0/0/0 | 0/0/0/0 | 0/0/0/0 | 0/0/0/0 |
| mesa2-pago | 0/0/0/0 | 0/0/0/0 | 0/0/0/0 | 0/0/0/0 | 0/0/0/0 | 0/0/0/0 | 0/0/0/0 | 0/0/0/0 |
| mesa2-menu | 0/1/0/0 | 0/1/0/0 | 0/1/0/0 | 0/1/1/0 | 0/1/0/0 | 0/1/0/0 | 0/1/0/0 | 0/1/1/0 |

### 3.4 · Lo que dicen las capturas sobre la isla (lectura, no medida)

En `iphone-v`, la barra de arriba del lobby ocupa de y ≈ 20 a y ≈ 58: avatar y nombre a la izquierda, **la píldora del saldo entre x ≈ 173 y x ≈ 285**, la ficha de constancia hasta x ≈ 375 y el engranaje a la derecha. La isla del 17 Pro Max está centrada (x ≈ 157–283) y baja hasta y ≈ 48. Si en la app instalada la página empieza en el borde de la pantalla, **la isla cae exactamente sobre el saldo**, y el reloj y la batería sobre el nombre y el engranaje. En la mesa vertical, la fila de arriba (marca, «Mano #1», ⋮ y ✕) está en y ≈ 20–52: mismo sitio.

---

## 4 · La lista de pruebas

Cómo leerla: cada fila es una prueba. **Si algo no se ve como dice la columna «Qué debe verse», haz una captura (botón lateral + subir volumen) y anota el número de la prueba.** No hace falta entender por qué.

Cuentas: una nueva por aparato, con un Gmail distinto. Apunta aquí los dos nombres del Bautizo, que harán falta para el SQL: iPhone = `____________` · iPad = `____________`.

### A · Crítico — si falla, no se puede jugar en iOS (≈ 30 min)

| # | Aparato · modo | Qué hacer | Qué debe verse | Origen |
|---|---|---|---|---|
| A1 | iPhone · Safari | Abrir `ajilei.io`. Esperar 5 s sin tocar | La Portada completa, con su botón para entrar. Nada cortado a los lados | PUE |
| A2 | iPhone · Safari | Tocar el botón de jugar (sube una hoja con el formulario) y escribir el correo. **Fíjate en si Safari se pone a pantalla completa** al tocar (desaparecen sus barras) | El teclado sale con la @. La pantalla **no** se acerca sola al tocar el campo. Lo esperado es que Safari **no** entre en pantalla completa; si entra, anótalo | PUE · BIE-1 · PAN-1 |
| A3 | iPhone · Safari | Pedir el código. Leerlo **sin salir de Safari**: en la notificación del correo o en la sugerencia que sale sobre el teclado. Escribirlo. Elegir un nombre de 12 letras en el Bautizo | Teclado de números en el código. Tras el nombre, el lobby: arriba tu nombre, el saldo **2.500** y la ficha de constancia con **una moneda llena y «1/3»**. **No** debe salir ningún «+500» | SUP-2b · BIE-1 · ECO-1a · ECO-1d |
| A4 | iPhone · Safari | «Jugar contra las IAS». Elegir Básico, 2 jugadores, la apuesta más baja y la entrada mínima. Tocar el botón dorado | Aparece la mesa en menos de 2 s, sin pantalla en blanco. Dos cartas tuyas boca arriba, el rival arriba | ARN-3d · ECO-1c |
| A5 | iPhone · Safari | «Iniciar mano» y jugar la mano entera en vertical | Cada botón responde **al primer toque**. Se ven enteros el reloj, los ×1 ×2 ×5 ×10 y los tres botones. Nada queda bajo la barra de Safari | DSK · PAN-1 · APU-1 |
| A6 | iPhone · Safari | En la segunda mano, girar el teléfono a horizontal a mitad de turno. Jugar. Volver a vertical | La mesa se recoloca sola en los dos giros. En horizontal los botones quedan a la derecha y se ven enteros, con la isla a un lado | DSK · PAN-1 |
| A7 | iPhone · Safari | Antes de salir, **apunta las fichas que tienes en la mesa** (abajo a la derecha). Tocar la ✕ de arriba a la derecha → «Abandonar mesa» | Vuelves a Retar o al lobby. El saldo de arriba es: **2.500 − entrada + fichas que tenías**. Si no cuadra, corre el SQL 1 de §5 | ECO-1c |
| A8 | iPad · Safari, **vertical** | Repetir A1–A3 con la otra cuenta. **Mira si al primer toque Safari entra en pantalla completa** y si aparece una ✕ suya arriba a la izquierda | Se puede escribir el correo y el código **sin que la pantalla entre y salga de pantalla completa a cada toque** y sin avisos de Safari sobre «escribir en pantalla completa». Llegas al lobby con 2.500 y «1/3» | PAN-1 (R-2) · ECO-1 |
| A9 | iPad · Safari, **horizontal** | Girar a horizontal. Entrar en una mesa de **5** jugadores. «Iniciar mano» y esperar tu turno | **Se ven enteros los tres botones «Pasar / Apostar / Retirarse»** y, abajo a la izquierda, las píldoras «MANO» y «TURNO». Si los botones se ven cortados por abajo, es el hallazgo H-1: captura, y prueba a tocarlos | H-1 de este informe |
| A10 | iPhone · **app instalada** | En Safari: Compartir → «Añadir a pantalla de inicio». Abrir desde el icono. Entrar con **la misma cuenta** (pedirá otro código: es normal). Jugar una mano de 2 y salir | Se abre sin la barra de Safari. El mismo saldo que dejaste. **Mira arriba:** el saldo y el engranaje del lobby, y la ⋮ y la ✕ de la mesa, se ven **enteros y se pueden tocar**, no quedan debajo de la isla ni del reloj. Abajo, la raya de inicio no tapa botones | PUE · PAN-1 (R-1) |

Si A9 o A10 fallan, se puede seguir jugando en las otras posturas: anótalo y continúa.

### B · Importante (≈ 40 min)

| # | Aparato · modo | Qué hacer | Qué debe verse (u oírse) | Origen |
|---|---|---|---|---|
| B1 | iPhone · Safari | Con el modo silencio quitado. Recargar la página y tocar un botón **nada más aparezca**. Luego «Jugar contra las IAS» y una mano entera; ganar una si se puede | Clic en los botones desde el primero. Un **toc-toc** al tocar «Jugar contra las IAS». En la mesa: el reparto, las monedas al apostar, y **el roce de fichas** cuando alguien cobra, a la vez que las monedas, no después. Si ganas: melodía de fiesta | BIE-1 · LOB-1 · ARN-3d · CEL |
| B2 | iPhone · Safari | En tu turno, con el reloj en marcha, **bloquear la pantalla 30 s** y desbloquear | El reloj de turno sigue donde estaba (no ha bajado 30 s) y nadie ha jugado por ti. **El sonido vuelve**: el siguiente botón suena. Si la mesa queda muda, anota cuántos toques tarda en volver | FRZ-1 |
| B3 | iPhone · Safari | En tu turno, ir a otra app 20 s (deslizar hacia arriba, abrir Mensajes) y volver | Lo mismo que B2. Además, el saldo de arriba no parpadea ni cambia | FRZ-1 · ECO-1b |
| B4 | iPhone · Safari | **Partida cortada.** Sentarse, jugar una mano, apuntar tus fichas y, sin salir de la mesa, **cerrar la pestaña**. Abrir `ajilei.io` otra vez | En el lobby, un aviso: «Volvieron N HC de tu partida anterior.», con N = tus fichas. El saldo sube contando hasta la cifra correcta | ECO-1c (P-4) |
| B5 | iPhone · app instalada | Lo mismo dentro de la app: en la mesa, sacar la app (deslizar hacia arriba y tirarla). Abrirla de nuevo | El mismo aviso y el saldo correcto. No pide entrar otra vez | ECO-1c · PUE |
| B6 | iPhone · Safari y app | **Dos almacenes.** Sentarse en una mesa en Safari y **no salir**. Abrir la app instalada | En la app **no** hay aviso y el saldo se ve más bajo (falta la entrada): es lo esperado. Sentarse en una mesa en la app: el saldo se corrige. Volver a Safari: «Abriste otra partida en otro dispositivo. Volvieron N HC.» y te devuelve al lobby. **Al final, corre el SQL 1: el saldo y la suma del libro deben ser iguales** | ECO-1c (P-4, C5, C6) |
| B7 | iPhone · Safari y app | Mirar la ficha de constancia en los dos sitios el mismo día | «1/3» en los dos. Ningún aviso de constancia en ninguno. (Si la sesión sigue otro día: «2/3», todavía sin cobro. El cobro de +500 es el tercer día seguido.) SQL 3 | ECO-1d |
| B8 | iPhone · Safari | Justo después de B4, al abrir y **sin tocar nada**, escuchar | El aviso de saldo se ve aunque no toques. El sonido puede no oírse hasta el primer toque: **anota qué pasa** (no suena / suena tarde, al tocar / suena bien) | ECO-1c · riesgo §2.1 |
| B9 | iPhone e iPad · app instalada | Mirar el icono y el nombre en la pantalla de inicio. Abrir. Girar a horizontal. Cerrar y abrir al día siguiente si se puede | Icono de AJILEI nítido y el nombre «AJILEI». Verde hasta arriba, sin franja negra ni blanca. En horizontal, la mesa se ve entera (en el iPhone habrá una banda verde a cada lado: es normal). La sesión sigue abierta al volver | PUE · PAN-1 |
| B10 | iPad · Safari | Jugar tres manos seguidas tocando deprisa, en vertical y en horizontal | Safari **no** saca avisos de pantalla completa ni te echa de ella en mitad de una mano. Su ✕ (si la pinta) no tapa nada que haga falta tocar | PAN-1 (R-2) |
| B11 | iPad · **app instalada** | Añadir a pantalla de inicio. Abrir, escribir el correo, pedir el código, **ir a la app de correo a leerlo** y volver | Al volver, la app sigue en el paso del código. Si ha vuelto al paso del correo, anótalo (es el riesgo de §2.3) y pide otro código | BIE-1 · riesgo §2.3 |
| B12 | cualquiera | **Solo si el rector despliega algo durante la sesión:** tener el lobby abierto desde antes del despliegue y tocar «Jugar» después | La página se recarga sola **una vez** y acabas en el lobby con el saldo correcto (y, si llegó a sentarse, el aviso de «Volvieron N HC»). No entra en bucle | ARN-3d |

### C · Cosmético — se ve mal pero se juega (≈ 20 min)

| # | Aparato · modo | Qué hacer | Qué debe verse | Origen |
|---|---|---|---|---|
| C1 | iPhone e iPad · Safari | Portada: mirarla entera 30 s sin tocar. Girar | La moneda dorada gira sin fondo negro ni cuadrado alrededor. En la escena de los aparatos, el teléfono y la laptop se ven enteros, con la mesa dentro de su pantalla | DIS-1 · MON-2 |
| C2 | iPhone e iPad vertical · Safari | Portada: abrir y cerrar la hoja del formulario dos veces | La hoja es opaca, las escenas de detrás se esconden mientras está abierta y vuelven al cerrarla | PUE (auditoría) |
| C3 | iPhone · Safari | En la mesa, mirar la luz y las cartas al repartir | El tapete tiene luz en el centro (no es un verde plano ni negro). Las cartas vuelan con el dorso granate desde el primer instante, sin parpadeo blanco | LUZ-1 · REV-1 · CAR-1 |
| C4 | iPhone e iPad · cualquiera | Tocar un botón de la mesa y soltar | El botón **no** se queda «levantado» o iluminado después de soltarlo | PAN-1 (D5) |
| C5 | iPhone · Safari | Jugar con la entrada mínima hasta quedarte sin fichas | Sale la burbuja de recarga junto a tu zona y su tarjeta, enteras, con botones que se pueden tocar | REC-1 · REC-2 · APU-1 |
| C6 | iPhone · Safari | Menú ⋮ → reacciones → mandar una | El emoji **se ve y se mueve**. Si sale un hueco vacío, es el AVIF que no carga | Menú de utilidades (sin marca) |
| C7 | iPhone · Safari | En la pantalla de entrar (correo) y en el Bautizo, arrastrar la página arriba y abajo sin teclado | Anota si la pantalla se puede arrastrar y deja un hueco verde abajo (`100vh`) | Riesgo §2.4 |
| C8 | iPhone · Safari | «Jugar contra jugadores» → mirar las pantallas de salas sin crear nada | Nada cortado; el campo del código no acerca la pantalla al tocarlo | SAL-B1 |
| C9 | iPhone · Safari | **Solo si sobra un correo sin cuenta:** abrir un enlace `?sala=` de una sala creada en el iPad | Portada → código → Bautizo → entra a la sala sin escribir el código de sala | SAL-B2 (E9) |
| C10 | iPad · Safari y app, vertical | Mirar la mesa de 5 en vertical | Es la mesa de teléfono, estirada: las cinco cartas quedan muy separadas y hay mucho verde vacío. Se juega. Anota si molesta: es la decisión de tabletas pendiente del rector | LUZ-1 · §2.7 |
| C11 | iPhone · Safari, horizontal | Lobby → engranaje | La hoja de ajustes cabe o se puede arrastrar hasta «Eliminar cuenta» | LOB-1 · §3.2 |

---

## 5 · SQL para el Editor (solo lectura)

El Editor enseña solo el resultado de **la última** sentencia: pega **un bloque cada vez**. En los tres, cambia `NOMBRE_AQUI` por el nombre del Bautizo.

**SQL 1 · ¿Cuadra el saldo?** Las dos primeras filas deben dar la misma cifra.

```sql
with yo as (
  select id from public.profiles where lower(username) = lower('NOMBRE_AQUI')
)
select 'saldo de la billetera' as que, b.saldo::text as valor
  from yo join public.billeteras b on b.jugador_id = yo.id
union all
select 'suma del libro', coalesce(sum(m.monto), 0)::text
  from yo join public.movimientos m on m.jugador_id = yo.id
union all
select 'mesas abiertas ahora', count(*)::text
  from yo join public.mesas_ia t on t.jugador_id = yo.id and t.estado = 'abierta';
```

**SQL 2 · El libro, línea a línea** (lo último, arriba). Debe empezar por abajo con `bono_bienvenida` de 2500.

```sql
select m.creado_en, m.tipo, m.monto, m.saldo_tras, m.ref_tipo, m.motivo
  from public.movimientos m
  join public.profiles p on p.id = m.jugador_id
 where lower(p.username) = lower('NOMBRE_AQUI')
 order by m.id desc
 limit 40;
```

**SQL 3 · Las mesas y la constancia.** `dispositivo` distinto = Safari frente a app instalada. `motivo_cierre` dice quién cerró cada mesa.

```sql
select t.abierta_en, t.estado, t.motivo_cierre, t.jugadores, t.apuesta,
       t.entrada, t.recargado, t.pila_informada, t.cobrado,
       left(t.dispositivo, 8) as dispositivo, t.ultimo_aviso_en, t.cerrada_en,
       c.racha, c.ultimo_dia
  from public.profiles p
  join public.mesas_ia t on t.jugador_id = p.id
  left join public.constancia c on c.jugador_id = p.id
 where lower(p.username) = lower('NOMBRE_AQUI')
 order by t.abierta_en desc
 limit 20;
```

Si la cuenta aún no se ha sentado nunca, el SQL 3 sale vacío; para ver solo la constancia:

```sql
select p.username, c.racha, c.ultimo_dia, c.actualizada_en
  from public.profiles p
  left join public.constancia c on c.jugador_id = p.id
 where lower(p.username) = lower('NOMBRE_AQUI');
```

---

## 6 · Preguntas al rector

1. **H-1:** si el iPad en horizontal dentro de Safari cae por debajo de 680 px, ¿se arregla el bloque de escritorio para la banda 601–679, o el iPad en esa postura debería recibir otra disposición?
2. **R-1:** si la isla tapa la barra del lobby en la app instalada, la cura natural es FS-1 (`viewport-fit=cover` + las reservas que ya están escritas). ¿Se abre?
3. **R-2:** ¿la pantalla completa de PAN-1 debe aplicarse al iPad, o solo a los teléfonos (R1 dice «teléfonos»)? Hoy la condición no distingue.
4. **H-6:** tapetes comprados y consultas gratis viven en `localStorage`. ¿Se queda así hasta que pasen al servidor?
5. **Tabletas en vertical** (C10): sigue pendiente desde LUZ-1.

---

## 7 · Cierre del terreno

Comprobado el 10-oct-2026 a las 00:18, al terminar:

- **Puertos:** nadie escucha en 4173, 4191, 4192, 5173 ni 5174 (solo conexiones del 4191 en `TIME_WAIT`, que caducan solas). El 4173 no se usó.
- **Procesos:** ningún `node`, WebKit ni Playwright vivo.
- **Copias y uniones:** no se hizo ninguna copia del repo ni ninguna unión. Se compiló desde el propio árbol con la salida **fuera** del repo (`outDir` en el directorio temporal) y `configLoader: 'native'`, que no escribe en `node_modules/.vite-temp`. El `dist/` y el `.vite-temp` del repo conservan su fecha de antes de la sesión (09-oct, 23:39).
- **Salidas, fuera del repo:** `%TEMP%/claude/c--Users-victo-OneDrive-Documents-ajilei/f00e18bf-5890-4903-af77-b1d5bc186064/scratchpad/ios1/` — `pasada.mjs`, `barrido.mjs`, `resumen.mjs`, `dist/`, `salida/` (186 capturas + `pasada.json`) y `salida-barrido/` (48 + JSON). Se pueden borrar.
- **`git status --short`** (rama `main`, `f1ea8d0`, sin `git add`, sin commits, sin stash):

```
?? docs/reportes/AJILEI_MOT-1_Fase0_Informe_v1.0.md
?? docs/reportes/AJILEI_MOT-1_Fase1-0_Sonda_Informe_v1.0.md
?? docs/reportes/AJILEI_iOS_Sesion1_Lista_v1.0.md
?? laminas/mon1/_entorno.txt
?? laminas/mon1/lamina.html
?? laminas/mon1/tiempos.json
```

La única línea nueva es este informe; las otras cinco ya estaban al empezar.

**STOP.** No se arregló nada. Quedan las cinco preguntas de §6 y la sesión en los aparatos.
