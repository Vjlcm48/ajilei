# AJILEI · IOS-1 · Fase 0 — Diagnóstico de iOS y de tamaños · Informe v1.0

**Campaña:** IOS-1 · Arreglos de iOS y de tamaños · **Fase:** 0 (solo lectura y medición)
**Ejecutor:** Claude Code · **Rector:** Claude (chat) · **Decisor:** Victor
**Base:** `main` en `92e2eeb` · **Fecha:** 2026-10-13
**Alcance cumplido:** no se tocó `src/`, `scripts/`, `supabase/` ni la base. Sin `git add`, sin commits, sin `db push`, sin conexión a Supabase. La única escritura en el repo es este informe.

---

## 0 · Lo más importante, en una página

1. **Los fallos de la sesión son de tamaño, y hay más de los que se vieron.** Con `--u` en su techo (6 px), las pantallas de la casa necesitan un alto mínimo que nadie había medido. En horizontal:

   | Pantalla | Qué se corta | Alto en que falla | ¿Se alcanza desplazando? |
   |---|---|---|---|
   | Retar a las IAS | el botón dorado | de 521 a 725 px | **No** (`overflow: hidden`) |
   | Retar con el bloque del video | el botón dorado | de 521 a 747 px, y otra vez de 801 a 822 | **No** |
   | Salas («Armar una mesa») | el botón | de 521 a ~664 px | **No** |
   | Lobby | «Jugar contra jugadores» se monta sobre el menú | de 661 a 732 px | — |
   | Mesa de 5 y de 4 | «Pasar / Apostar / Retirarse» | de 601 a 676 px | Sí, dentro de la mesa |
   | Mesa de 5 y de 4 | «Iniciar mano» | de 601 a 656 px | Sí |

2. **Eso no es solo el iPad.** En esas bandas caen: el iPad mini en horizontal (Safari con barras ≈ 641–674; app instalada ≈ 720), el iPad de 11" en Safari (≈ 713–750), las tabletas Android de 800×1280 en Chrome con barras (≈ 648), y **toda laptop de 1366×768 con el navegador en ventana normal (≈ 633–657 de alto útil): ahí el botón dorado de Retar no se ve ni se puede alcanzar.** Una laptop de 1920×1080 al 150 % (≈ 1280×585) tampoco lo ve, y además recibe la mesa de teléfono horizontal. El arnés nunca lo vio porque mide 1366×768 «limpio», como si el navegador no tuviera barras.

3. **F-3 (pantalla completa del iPad) tiene causa exacta:** fuera de la mesa, **cada toque** la pide (`src/lib/pantallaCompletaCore.js:75`), y Safari de iPad la suelta sola al sacar el teclado y al girar. De ahí el entrar y salir. **F-5 es efecto de F-3:** a 744×1026 sin pantalla completa las mesas de 2 y 3 salen limpias; y si al óvalo se le da el alto de la pantalla completa mientras la pantalla mide 1026, se reproduce al píxel lo que vio Victor (fichas cortadas 46 px, «Mesa 50» fuera 66 px).

4. **F-7 (el «—») tiene dos vías en el código, y las dos son una petición sin tiempo límite.** La píldora solo pinta «—» si no hay cifra todavía o si se está cobrando la salida de una mesa. En las dos, dura exactamente lo que tarde la petición colgada: con una petición de 30 s, la sonda midió 30,3 s, 30,1 s y 28,5 s de «—». Mientras dura, **el botón de Retar está apagado**: no es solo estética.

5. **F-2 queda «en vigilancia»**, con dos causas candidatas encontradas en el código y ninguna demostrada.

6. **Hallazgo nuevo para TAB-1:** en tabletas verticales de **768 px de ancho o más** (iPad de 11", iPad Pro, Android de 800) la mesa no es la del teléfono estirada: no casa con **ninguna** de las tres disposiciones y cae a la base, con botones de 33 px de alto y textos que se salen de los paneles en las mesas de 4 y 5. El iPad mini (744) se libra por 24 px.

**Tiempo real usado:** ver §H. **Decisiones para Victor:** §D. **Reparto:** §E.

---

## §A · Los hallazgos de la sesión iOS 1

Registro oficial de la sesión del 2026-10-10 (iPhone 17 Pro Max, iOS 27.0.1 · iPad mini 6, iPadOS 27.0), tal cual lo entregó la ficha:

| # | Aparato | Qué pasó | Estado |
|---|---|---|---|
| F-1 | iPhone | «tunombre» en el Bautizo: es el texto de ejemplo en gris. | **No es fallo.** Cerrado. |
| F-2 | iPhone, Safari | El Bautizo se quedó colgado la primera vez; la segunda funcionó. No se repitió. | A diagnosticar (§3.1). |
| F-3 | iPad, Safari | La pantalla completa entra y sale sola a cada toque y al girar; se gasta el toque que debía abrir el teclado; su ✕ tapa el avatar en Retar y el logo en la mesa; la hora y la batería se pintan sobre el nombre. En la **app instalada** no pasa. | A diagnosticar y decidir (§3.2). |
| F-4 | iPad horizontal (Safari y app instalada) | El botón dorado de Retar sale cortado por abajo; hay que desplazar. En vertical, bien. | A diagnosticar (§3.3), con la sugerencia del hijo de Victor. |
| F-5 | iPad vertical, Safari | En las mesas de 2 y 3 el óvalo crece y empuja la zona del jugador: se cortan sus fichas y desaparece «Mesa 50». **En la app instalada se ve bien.** | A confirmar si es solo efecto de F-3 (§3.2). |
| F-6 | iPad vertical | La mesa de 5 es la del teléfono estirada: todo pequeño y mucho verde vacío. | **Fuera de IOS-1:** es TAB-1. Esta fase solo **mide** (§4), para que TAB-1 use sus cifras. |
| F-7 | iPhone (app instalada) | Al volver de segundo plano o del bloqueo, la píldora queda en «—» unos 30 s. El rector comprobó en la base que ningún saldo se contó mal. | A diagnosticar (§3.4). |
| F-8 | iPad horizontal | En el lobby, «Jugar contra jugadores» queda montado sobre el menú de abajo. | A diagnosticar (§3.5). |
| G-1 | Teléfono vertical (lo midió la 1g) | En la barra de Retar y de las salas, con un nombre de 15 letras, el engranaje se sale 17–19,5 px. | A diagnosticar (§3.6). |

**Lo que salió bien:** en la mesa de 5 en horizontal del iPad, «Pasar / Apostar / Retirarse», «MANO» y «TURNO» se ven enteros, con y sin la app instalada.

Una precisión que importa para la decisión de §D-1: ese «bien» en Safari se vio **con la pantalla completa puesta** (F-3), o sea con 744 px de alto. Sin ella, Safari deja ≈ 641–674 px y los botones se cortan (§C, celda `ipm-saf-h`). Es el hallazgo H-1 del informe de la sesión, que sigue en pie.

---

## §B · Un apartado por hallazgo

### B.1 · F-2 — El Bautizo colgado → **en vigilancia**

**El flujo, con sus líneas.** Correo → código (`src/components/FormularioPuerta.jsx:66-79`) → «Entrar» (`:81-93`, `verifyOtp` en `src/hooks/useAuth.js:195-199`) → el SDK avisa de la sesión → se lee `profiles` (`useAuth.js:130-150`) → sin fila, el Bautizo → «Confirmar» (`src/screens/Bautizo.jsx:56-71`, el `insert` de `useAuth.js:205-216`).

**Lo que puede quedarse esperando sin salida.** Encontré cuatro sitios. Ninguno está demostrado como la causa.

| # | Dónde | Qué pasa | ¿Encaja con «colgado y a la segunda bien»? |
|---|---|---|---|
| C-1 | `Bautizo.jsx:51` y `:111` | El botón «Confirmar» se apaga si el nombre no cumple `^[A-Za-z0-9_]{6,15}$` (`useAuth.js:62`). El campo **no recorta espacios** y no lleva `autoCorrect="off"` (`Bautizo.jsx:89-102`; sí lleva `autoCapitalize="none"` y `spellCheck="false"`). En el iPhone, aceptar una sugerencia del teclado añade un espacio al final: el nombre se ve bien, el botón queda apagado y **no hay ningún mensaje que diga por qué** (la ranura de avisos solo habla cuando contesta la base, `:109`). | **Sí.** Se ve como «colgado» y la segunda vez, tecleando sin sugerencia, funciona. No lo pude comprobar: el WebKit del arnés no tiene teclado de iOS. |
| C-2 | `Bautizo.jsx:56-60` | «Confirmar» pone `ocupado` y espera la respuesta **sin tiempo límite**. Mientras espera: el campo apagado (`:101`), el botón en «Guardando…» (`:112`) y «Cerrar sesión» apagado (`:127`). Si la petición no vuelve, la única salida es recargar. El cliente de Supabase se crea sin tope (`src/lib/supabase.js:35`) y el SDK no trae ninguno. | **Sí**, si la primera petición tras volver de la app de correo se quedó colgada. Es la misma familia que F-7. |
| C-3 | `FormularioPuerta.jsx:81-93` | Lo mismo en el paso del código: «Entrando…» sin tiempo límite. | Solo si el cuelgue fue antes del Bautizo. |
| C-4 | `useAuth.js:130-150` | Entre «Entrar» y el Bautizo, la lectura de `profiles` no tiene tope: verde con «Cargando» hasta que conteste. Si **falla**, cae al Bautizo (coste declarado, `:141-145`). | Solo si lo colgado fue el «Cargando». |

**Lo que descarté.**
- El refresco de sesión al volver de otra app: el SDK reintenta hasta 30 s (`node_modules/@supabase/auth-js/dist/main/GoTrueClient.js:4012-4027`), pero solo refresca si al token le quedan menos de 90 s. Una sesión recién creada tiene una hora.
- Un cerrojo huérfano: esta versión del SDK (2.112.4) ya no usa `navigator.locks` por defecto (`GoTrueClient.js:4748-4765`).
- La pantalla completa: en el iPhone no se pide (§B.2).
- El foco: `Bautizo.jsx:39` enfoca el campo al montar, e iOS no abre el teclado sin un toque. Hay que tocar el campo, pero no es un cuelgue.

**Qué habría que observar si se repite** (basta con mirar el botón):
- **«Confirmar» en gris, sin texto de error** → C-1. Borrar el nombre entero y teclearlo sin aceptar sugerencias.
- **«Guardando…» que no acaba** → C-2. Anotar si se venía de otra app y cuánto tiempo.
- **«Entrando…» o «Cargando» que no acaban** → C-3 o C-4.
- El rector puede mirar en la base si el perfil de esa cuenta se creó en el primer intento (la fila de `profiles` existiría antes del segundo): eso distingue C-2 de C-1.

**Arreglo propuesto (barato, cubre las dos candidatas, a decidir en §D-5):** recortar espacios y decir por qué el botón está apagado (C-1); y el tope de tiempo de red que ya pide F-7 (C-2 a C-4). No toca protegidos. **Validación:** vitest para la regla del nombre; el tope, con el arnés (peticiones que tardan). El teclado de iOS, solo en el iPhone. **Estimación:** 15 min de Claude Code dentro de la tanda de F-7.

**Afecta a:** cualquier teléfono; C-1 sobre todo a iOS (su teclado propone y añade el espacio).

---

### B.2 · F-3 — La pantalla completa en el iPad, y F-5

#### Dónde y cuándo se pide

| Momento | Quién la pide | Línea |
|---|---|---|
| **Cada toque fuera de la mesa** (Portada, formulario, Bautizo, lobby, Retar, salas, hoja de monedas, video) | un oyente de `pointerup` en captura, montado una vez | `src/App.jsx:557-562` → `pantallaCompletaCore.js:75` y `:85-88` |
| Dentro de la mesa, **solo** al tocar «Iniciar mano» y «Siguiente mano» | la mesa llama a `reentrar` | `src/components/GameTable.jsx:2414` y `:2563` |
| Al girar | **nadie** en el código | — |

Lo medí con una sonda (WebKit, 744×1026 táctil, con la API contada y sin dejarla entrar, que es lo que le pasa al iPad cuando Safari la suelta):

| Paso | Peticiones |
|---|---|
| Bautizo · toque en el campo del nombre | 1 |
| Bautizo · segundo toque en el mismo campo | 1 |
| Bautizo · toque en el fondo | 1 |
| Lobby · toque en el fondo / en «Jugar contra las IAS» | 1 / 1 |
| Retar · cada una de las cuatro filas y el botón dorado | 1 cada uno |
| Mesa · toque en el tapete (antes y durante la mano) | 0 |
| Mesa · «Iniciar mano» | 1 |
| Girar (sin tocar) | 0 |

Si ya hay pantalla completa no se vuelve a pedir (`pantallaCompletaCore.js:52`). Así que **el bucle lo cierra Safari**, no la app: Safari la suelta, y el siguiente toque la vuelve a pedir. Es la regla R4 funcionando como se escribió para Android («si algo la saca, fuera de la mesa vuelve con el siguiente toque», `pantallaCompletaCore.js:17-20`).

**Cómo se libra hoy.** Tres maneras: la app instalada (`instalada()`, `:32-36`: no se pide nunca), el atributo `data-sin-pantalla-completa` (`:67-69`; hoy solo en copiar y compartir de `src/screens/SalaEspera.jsx:529` y `:539`), y no tener la API.

#### Por qué el iPad sí la acepta y el iPhone no

La condición es de capacidad, no de aparato (`pantallaCompletaCore.js:39-45`): entrada táctil, que exista `requestFullscreen`, y no estar instalada.

- **iPhone:** Safari no ofrece `requestFullscreen` para la página (solo para video). La condición da falso y no pasa nada. La sesión lo confirma en iOS 27.0.1.
- **iPad:** Safari sí la ofrece. Pero la da con tres condiciones suyas, que la app no puede cambiar:
  1. **No deja escribir.** WebKit bloquea el teclado en pantalla completa por seguridad: al enfocar un campo, sale de ella. El toque ya se gastó en pedirla (`requestFullscreen` consume la activación del gesto, medido en PAN-1 1c), y el siguiente toque la vuelve a pedir. Es el «se gasta el toque que debía abrir el teclado».
  2. **Pinta su ✕** arriba a la izquierda, encima de la página: sobre el avatar en Retar y sobre el logo en la mesa.
  3. **Deja la hora y la batería** encima de la página. Y sale al girar.

  En Android no existe ninguna de las tres: por eso allí funciona bien.

Fuentes: el comportamiento del teclado, en el registro de errores de WebKit (bug 121496, «la entrada alfanumérica en pantalla completa se considera un riesgo de seguridad»); el «solo iPad, no iPhone», en la tabla de compatibilidad de caniuse. Son anteriores a iPadOS 27: lo que vale es lo que vio Victor.

#### Cómo distinguir un teléfono de una tableta

El código no mira el agente de usuario en ningún sitio, y debe seguir así. Comparación de señales:

| Señal | Qué da | Qué falla |
|---|---|---|
| Nombre del aparato (*user agent*) | iPhone y Android se nombran; **el iPad dice «Macintosh»** | No distingue el iPad de una Mac. Descartada sola. |
| `platform === 'MacIntel'` y `maxTouchPoints > 1` | Detecta el iPad (una Mac da 0 puntos táctiles) | Es el mismo dato de agente de usuario por otra puerta; depende de que Apple no lo cambie. No dice nada de las tabletas Android. |
| **Tamaño de la pantalla:** `min(screen.width, screen.height)` | Teléfonos ≤ 480 (el 17 Pro Max, 440). Tabletas ≥ 600 (iPad mini, 744; Android, 600–900). No cambia al girar si se toma el mínimo, ni con la pantalla dividida. | Los plegables abiertos (≈ 590–720) caen del lado «tableta», que es discutible pero razonable. Hay que usar `screen`, **no** el ancho de la ventana: la ventana cambia al entrar en pantalla completa (PAN-1 lo midió cruzando el corte de 772). |
| Tipo de puntero (`pointer`, `hover`) | Separa lo táctil del ratón (ya lo usa R1, `:27`) | **Teléfono y tableta dan lo mismo.** No distingue. Con teclado y panel táctil, el iPad pasa a «ratón» y R1 ya lo excluye. |
| Puntos táctiles (`maxTouchPoints`) | 5 o más en todo lo táctil | No distingue teléfono de tableta. |
| Capacidad propia de iOS: `CSS.supports('-webkit-touch-callout', 'none')` | Verdadero solo en Safari de iPhone y iPad. Junto con «tiene la API» significa **iPad**, porque el iPhone no la tiene. | Es de un fabricante. No lo pude comprobar: el WebKit de Windows da falso (§F). |

**Combinaciones útiles:**
- *«Es una tableta»* = táctil **y** `min(screen.width, screen.height) ≥ 600`. Sirve para iPad y Android por igual.
- *«Es Safari de iPad»* = táctil **y** tiene la API **y** la capacidad propia de iOS. No toca a Android.

#### F-5: ¿desaparece sin pantalla completa? **Sí.**

Medido a 744×1026 (Safari con barras, sin pantalla completa), WebKit táctil:

| | Mesa de 2 | Mesa de 3 |
|---|---|---|
| Óvalo (arriba–abajo, alto) | 256–708,5 · 452,5 | 265,5–709 · 443,5 |
| Zona del jugador (arriba–abajo) | 712,5–1003,9 | 713–1004,4 |
| Textos fuera de la pantalla | **ninguno** | **ninguno** |

**Y el mecanismo.** La pantalla de la mesa mide `100dvh` (`src/styles/gameTable.css:6`), pero el óvalo de las mesas de 2 y 3 en vertical mide `100svh − lo fijo` (`gameTable.css:1628` y `:1981`). Las mesas de 4 y 5 no usan esa fórmula. Si Safari, al entrar o salir de la pantalla completa, deja `svh` en 1133 mientras la pantalla ya mide 1026, el óvalo crece 107 px y empuja todo. Lo simulé dándole al óvalo esos 107 px de más:

| Con el óvalo «de 1133» en una pantalla de 1026 | Mesa de 2 | Mesa de 3 |
|---|---|---|
| Zona del jugador | 819,5–1110,9 (se sale 85 px) | 820–1111,4 |
| Fichas del jugador («1000») | fuera **45,7 px** | fuera 46,2 px |
| «Mesa 50» | fuera **66 px** | fuera 66,5 px |
| «Tú» y «TURNO» | fuera 73,9 px | fuera 74,4 px |
| «Pasar / Apostar / Retirarse» | cortados 2,3 px | cortados 2,8 px |

Es lo que describió Victor: el óvalo crece, se cortan las fichas y desaparece «Mesa 50». Y explica las dos pistas que no encajaban de otro modo: **solo pasa en las mesas de 2 y 3** (las únicas con esa fórmula) y **no pasa en la app instalada** (allí no hay pantalla completa que entre y salga).

**Conclusión:** F-5 se cierra con F-3, **siempre que la opción elegida quite la pantalla completa del iPad en la mesa.** Si la deja (opción B), F-5 puede volver cada vez que Safari la suelte a mitad de una mano. Lo que no pude medir es el valor real de `svh` en el iPad: la simulación demuestra que el mecanismo da las cifras de Victor, no que sea el único posible. Se confirma en el aparato en un minuto (§E, validación de IOS-1a).

**Protegidos:** la causa de F-5 vive en `src/styles/gameTable.css`, que es protegido (lista canónica, fila 6). **No propongo tocarlo:** quitando la pantalla completa del iPad el desajuste no se produce. Si un día se quisiera blindar, haría falta autorización de Victor para ese archivo, o una hoja aparte.

#### Las opciones para Victor (no decide esta fase)

| Opción | Qué hace | A favor | En contra |
|---|---|---|---|
| **A** · Solo en teléfonos; en tabletas, nunca | Regla por tamaño de pantalla (`≥ 600` = tableta) | Cierra F-3 y F-5 enteros. Regla sencilla, sin fabricantes. | **Se la quita también a las tabletas Android, donde hoy va bien.** Y sin ella, la tableta en horizontal con Chrome (≈ 1280×648) y el iPad en Safari (≈ 1133×641–674) **cortan los botones de la mesa** de 5 y de 4 (20 px) y «Iniciar mano» (9–20 px). Obliga a arreglar antes la banda 601–676 de la mesa (§D-4). |
| **B** · En tabletas, solo dentro de la mesa | Fuera de la mesa no se pide; dentro, como hoy («Iniciar mano» y «Siguiente mano») | Cierra el entrar y salir, el teclado y la ✕ sobre el avatar. La mesa conserva los 744 px, que es lo que hoy la hace caber. Cambio mínimo. | En el iPad siguen la ✕ sobre el logo y la hora sobre el nombre **dentro de la mesa**. **F-5 no queda cerrado** (mesas de 2 y 3 en vertical, si Safari la suelta al girar). Y entrar en pantalla completa al tocar «Iniciar mano» mueve la mesa justo entonces. |
| **C** · Nunca en Safari de iPad; Android, como hoy | Regla por capacidad de iOS, no por tamaño | Cierra F-3 y F-5 enteros **sin tocar Android**, teléfono ni tableta. Es la que menos cosas mueve de las que hoy funcionan. | Distingue por fabricante (por capacidad, sin leer el nombre). El iPad en Safari horizontal se queda con los botones de la mesa cortados hasta que se arregle la banda 601–676 (§D-4); mientras tanto, se alcanzan desplazando dentro de la mesa, o instalando la app. |
| **C+B** · En Safari de iPad, solo en horizontal y solo dentro de la mesa | C en vertical (donde vive F-5 y la mesa cabe sin ayuda); B en horizontal (donde la mesa la necesita) | Cierra F-5 (que es solo vertical) y evita los botones cortados en horizontal, sin tocar el CSS de la mesa. | La regla más larga de las cuatro. Quedan la ✕ y la hora sobre la mesa en horizontal. Hay que decidir qué pasa al girar con la mano en curso. |

Mi recomendación va en §D-1.

**Validación:** vitest del núcleo (ya tiene 10 casos; se añaden los de la regla nueva). En el aparato: el iPad en Safari (escribir el correo y el nombre sin que entre y salga; girar; mesas de 2 y 3 en vertical) y el S25 (que V1–V11 de PAN-1 sigan igual). El arnés **no** reproduce el comportamiento de Safari de iPad con la pantalla completa: solo cuenta las peticiones.

**Estimación:** 35–45 min de Claude Code según la opción (C+B, 55). No toca protegidos. Sin lámina.

---

### B.3 · F-4 — El botón dorado de Retar en horizontal, y la sugerencia del hijo de Victor

#### Causa

Retar, Salas y Armar mesa comparten carcasa (`src/components/PantallaChips.jsx:82-143`). Esa carcasa:

- mide **exactamente** el alto de la pantalla y **recorta** lo que no cabe: `height: 100dvh` y `overflow: hidden` (`src/styles/salas.css:114-115` y `:125`). Es doctrina escrita: «lo que no cabe NO se scrollea, se aprieta» (`salas.css:1226`, `:1509-1511`);
- solo desplaza en un caso, el teléfono acostado: `(orientation: landscape) and (max-height: 520px)` (`salas.css:1237-1246`);
- se aprieta en dos trajes: `max-height: 660px` (`salas.css:1230-1236`) y, solo Retar, `max-height: 800px` (`salas.css:1521-1532`).

El fallo es que **la unidad `--u` no encoge cuando encoge el alto.** Vale `clamp(3.2px, 1vmin, 6px)` (`salas.css:56`): en cualquier pantalla con el lado corto de 600 px o más está en su techo, 6 px. Con `--u` = 6, la columna de Retar mide lo mismo a 620 de alto que a 800, y los trajes no bastan. Entre 521 y 725 px de alto el botón no cabe, y como la pantalla recorta y no desplaza, **no se alcanza de ninguna manera**.

El traje de 800 se calibró para 1024×768 «limpio» (lo dice su comentario, `salas.css:1504-1507`): 768 de alto, sin barras. Nadie midió por debajo.

#### Medido: el alto mínimo que necesita cada pantalla (horizontal, `--u` = 6)

Barrido de alto de 10 en 10 px. Sale igual a 1280, 1366, 1400 y 1536 de ancho en Chromium, y a 1133, 1180 y 1366 en WebKit táctil (las cifras de WebKit, en §C.4).

| Pantalla | Fondo del botón dorado | Alto mínimo para verlo entero | Para ver también su nota |
|---|---|---|---|
| Retar (reto, jugadores, apuesta y entrada elegidos) | y = 725,8 | **726** | 755 |
| Retar con el bloque «Ver un video · +500 HC» | y = 747,1 | **747**, y entre 801 y 822 vuelve a faltar (hasta 12 px) | 776 |
| Salas («Armar una mesa») | — | ≈ **664** con el traje de 660 (medido en 585, 633, 637 y 648); a 713 y a 724 el botón ya cabe. Sin barrido propio: entre 661 y 712 no hay muestra | ≈ 729 |
| Armar mesa («Crear mesa privada») | — | ≈ **600** (cortado 14 px a 585; limpio a 633) | — |

El segundo tramo del video (801–822) existe porque el traje corto se apaga justo al pasar de 800 y la columna vuelve a su aire completo. Es lo que la 1g vio como «2,8 px» en el iPad girado: hoy mido 2,1 px a 1180×820 (iPad de 11", app) y 3 px a 1133×744.

#### Qué tamaños afecta

| Aparato y modo | Alto útil | Retar | Retar con video |
|---|---|---|---|
| iPad mini, Safari horizontal con barras | ≈ 641–674 (medido a 637) | cortado **80 px**, sin alcanzar | botón 101 px, y «Ver un video» 29 px |
| iPad mini, **app instalada** horizontal | ≈ 720 (744 menos la barra de estado) | cortado **≈ 6 px** | ≈ 27 px |
| iPad mini, Safari a pantalla completa | 744 | cabe por 18 px | cortado 3 px |
| iPad de 11", Safari horizontal | ≈ 713–750 | cortado hasta 13 px | hasta 34 px |
| iPad de 11", app instalada | 820 | cabe | cortado 2 px |
| Tableta Android 800×1280, Chrome horizontal | ≈ 648 | cortado **69 px** | 90 px |
| Tableta Android 876×1400, Chrome horizontal | ≈ 724 | cortado 2 px | 23 px |
| **Laptop 1366×768, navegador en ventana** | ≈ 633–657 | cortado **84 px**: no se ve | 105 px |
| Laptop 1920×1080 al 125 % | ≈ 729 | cabe por 3 px | cortado 18 px |
| **Laptop 1920×1080 al 150 %** | ≈ 585 | cortado **114 px** | 135 px |
| Teléfonos en vertical (360 a 440) | — | bien | bien |
| Teléfono acostado (alto ≤ 520) | — | queda fuera 85–92 px, **pero la pantalla desplaza** (traje propio) | ídem |

Lo de Victor encaja: en Safari **y** en la app instalada el iPad queda por debajo de 726. En la app por muy poco (≈ 6 px): por eso «sale cortado» y no «no sale».

#### La sugerencia: botón fijo y de tamaño constante, con el resumen fuera y encima

La sugerencia tiene dos partes, y solo una arregla F-4:

1. **«De tamaño constante, con el resumen fuera».** Hoy el botón ya mide 66 px de alto en todos estos tamaños (una línea). Sacar el resumen a una línea encima **no ahorra alto**: suma una línea (≈ 24–29 px), salvo que ocupe la caja de la nota que hoy va debajo del botón (29 px). En el mejor caso queda igual. **Por sí sola no resuelve F-4.** Lo que sí gana: el botón deja de cambiar de ancho y de texto con cada elección, y el resumen puede cortarse o envolver sin que el botón mienta. Es buena idea por otras razones.

2. **«Fijo».** Si significa **anclado al fondo de la pantalla**, fuera del flujo de la columna, entonces **sí resuelve F-4 en todos los tamaños de §C por construcción**: el botón está siempre a la vista, mida lo que mida el alto. Lo que deja de caber ya no es el botón: son las filas de arriba.

**Presupuesto de alto con el botón anclado** (a 1133 de ancho, `--u` = 6):

| Pieza | Alto (px) | De dónde sale |
|---|---|---|
| Relleno de arriba | 21 | medido: la barra empieza en y = 21 |
| Barra superior | 64 | medido: 21–85,2 |
| Cabecera («Retar a las IAS», la flecha) y su aire | 70 | medido: el cuerpo empieza en y = 155 |
| Las cuatro filas, con el traje de 800 | ≈ 498 | medido: de y = 155 al botón (659,8) menos su hueco |
| …con el bloque del video | ≈ 519 | medido: el cuerpo pasa de 600 a 621 |
| Zona anclada: resumen (≈ 24) + botón (66) + huecos (≈ 12) | ≈ 102 | 66 medido; el resto, estimado |
| Relleno de abajo | 21 | el mismo de arriba |
| **Total** | **≈ 776** (≈ 797 con video) | |

O sea: con el botón anclado **todo** cabe entero desde ≈ 776 de alto. Por debajo, el botón se ve siempre y lo que no cabe son las filas: faltan ≈ 32 px a 744 (iPad a pantalla completa), ≈ 56 a 720 (iPad, app), ≈ 139 a 637 (iPad, Safari), ≈ 143 a 633 (laptop de 1366×768) y ≈ 191 a 585 (laptop al 150 %).

Hoy la pantalla «cabe» desde 726 —y no desde 776— porque el botón invade el relleno de abajo y su nota queda fuera de la pantalla (hasta 755). Anclar el botón es más honrado, pero **cuesta ≈ 50 px de columna**: no es gratis, y la lámina tiene que decir de dónde salen.

**Qué más habría que mover, para la lámina:**

- **Qué pasa con las filas cuando no caben.** Tres caminos: que la columna desplace por dentro (rompe la doctrina de `salas.css:1226`, pero con el botón siempre visible el argumento de «un botón al que hay que bajar con la rueda» ya no aplica); un traje más apretado para la banda 521–730; o dos columnas (Victor ya lo descartó, `salas.css:1514-1520`). Es la decisión D-2.
- **La casa.** Hoy vive abajo a la izquierda (a 1133×744, en y = 671–723). En teléfono vertical está justo debajo del botón (a 360×640: botón 537–581, casa 596–627). Un botón anclado al fondo ocupa ese sitio: hay que decir dónde va la casa.
- **El bloque del video** («Ver un video · +500 HC» y «Te quedan N de 8 hoy») va hoy entre las filas y el botón, y es lo que más aprieta. Hay que decidir si viaja con las filas o con la zona anclada.
- **La nota del botón** («Elige reto, jugadores, apuesta y entrada», «Cargando tu saldo…», los errores de sentarse): comparte sitio con el resumen. Nunca los dos a la vez, o hay que reservar dos cajas.
- **El aviso «Pronto»** de la carcasa sale abajo: no debe caer sobre la zona anclada.
- **El teléfono acostado** (alto ≤ 520) ya desplaza la pantalla entera. Un botón anclado de 66 + 29 px se come el 24 % de 390 px. Puede quedarse con su traje de hoy.
- **Las otras dos pantallas de la carcasa.** «Armar una mesa» (Salas) y «Crear mesa privada» (Armar mesa) tienen el mismo fallo en la misma banda. Si el anclaje se hace en `PantallaChips`, se arreglan las tres de una vez. La lámina debería enseñar las tres.
- **La raya de inicio de iOS** (≈ 21–34 px abajo) el día que entre `viewport-fit=cover`: la zona anclada tendrá que reservarla.

**Protegidos:** ninguno. `salas.css`, `PantallaChips.jsx` y `RetarIAS.jsx` no lo son. **Lleva lámina** antes del código (pedido por la ficha). **Estimación:** lámina 40–50 min; código 60–75 min con sus celdas de arnés.

**Validación:** arnés con un barrido de alto (521 a 830) en las tres pantallas, más el S25 y 360×640 para que el vertical no cambie; iPad en horizontal, en Safari y en la app; y la laptop de Victor en ventana normal.

---

---

### B.4 · F-7 — El saldo «—» al volver de segundo plano

#### Cuándo pinta «—» la píldora

Solo cuando no tiene una cifra finita (`src/components/BarraSuperior.jsx:100`, `:106` y `:145`). Y el saldo que le llega solo es nulo en dos casos (`src/hooks/billeteraCore.js:145-148`):

| Vía | Qué significa | Cuándo empieza | Cuándo acaba |
|---|---|---|---|
| **V-1** · `servidor === null` | Todavía no se ha leído la billetera de esta cuenta | Al arrancar la app (`src/hooks/useBilletera.js:70-74`) | Cuando contesta `mi_billetera()` |
| **V-2** · `pendiente` | Se está cobrando la salida de una mesa | Al levantarse (`src/App.jsx:692`, `billeteraCore.js:162-164`) | Cuando contesta `salir_ia`, o cuando falla y se relee (`App.jsx:584-595`) |

**Volver a primer plano, por sí solo, no puede pintar «—».** Al volver se relee (`useBilletera.js:77-84`), pero mientras llega la respuesta la píldora sigue enseñando la cifra que tenía, y si falla también (`billeteraCore.js:136-142`). Así que lo que vio Victor es V-1 o V-2:

- **V-1 encaja con «volver del bloqueo»** si iOS descartó la app instalada mientras estaba fuera y la arrancó de cero al volver (lo hace a menudo, y sin avisar). La mesa y el saldo viven solo en memoria: al arrancar no hay cifra que enseñar.
- **V-2 encaja con «volver de segundo plano»** si Victor venía de una mesa y salió de ella después de volver. La salida va por una cola ordenada (`src/lib/controlMesaIA.js:65-72`): si delante hay un aviso de fichas que se quedó colgado mientras la app estaba fuera, la salida espera detrás.

#### Lo que tienen en común: ninguna petición tiene tiempo límite

| Sitio | Línea | Qué pasa si la petición se cuelga |
|---|---|---|
| El cliente de Supabase | `src/lib/supabase.js:35` | Se crea sin tope de tiempo; el SDK no trae ninguno. |
| La lectura de la billetera | `src/lib/billeteraApi.js:52-62` | Nunca rechaza, pero tampoco caduca. Y mientras está «en vuelo» **nadie más puede leer**, sea cual sea el motivo (`billeteraCore.js:107`): ni la vuelta a primer plano ni el botón de reintentar. |
| Las seis funciones de mesa | `src/lib/mesaIAApi.js:47-67` | Igual. La cola no manda lo siguiente hasta que conteste lo que va delante (`controlMesaIA.js:65-72`). |
| Volver a primer plano | `App.jsx:454-463` → `controlMesaIA.js:156-167` | `reintentarAhora()` solo se salta una **espera**. Lo que está **en vuelo y colgado** no lo toca (haría falta `forzar`, que solo usa la tarjeta de recarga). Lo dice su propio comentario: «una petición colgada no falla». |
| Tras un fallo de lectura | `useBilletera.js:55-64` | No hay reintento automático. La siguiente lectura llega con otro cambio de visibilidad, o con el botón de Retar. |

Los reintentos que sí existen (1, 2, 4, 8 y 15 s, `controlMesaIA.js:34`) solo arrancan cuando una petición **falla**. Una que no contesta no falla.

#### Medido con el arnés (Chromium, 412×915, peticiones que tardan 30 s)

| Sonda | Qué se hizo | «—» durante |
|---|---|---|
| a | Arranque con `mi_billetera` tardando 30 s | **30,3 s** (lobby a los 0,3 s; cifra a los 30,3) |
| a2 | Lo mismo, entrando en Retar mientras dura | botón dorado **apagado**, nota «Cargando tu saldo…» |
| b | Salir de la mesa con `salir_ia` tardando 30 s | **30,1 s** |
| c | Salir de la mesa con un `informar_pila` colgado delante | **28,5 s** (la salida ni siquiera sale hasta que el aviso contesta) |

En las tres, la cifra final es la correcta. Coincide con lo que comprobó el rector en la base: no se cuenta mal, se enseña tarde.

**Mientras hay «—» no se puede jugar:** el botón de Retar se apaga sin cifra (`src/screens/RetarIAS.jsx:133` y `:258`).

#### Por qué ~30 s en iOS y no en Android

**No lo pude medir, y no quiero inventarlo.** Lo que sé:

- En el código de la app no hay ningún 30 en estas dos vías. La duración del «—» es la de la petición colgada, y esa la pone el sistema.
- iOS no frena una app instalada en segundo plano: la para del todo, con las conexiones abiertas. Al volver, la primera petición puede salir por una conexión que ya no existe, y el sistema tarda en darse cuenta. Android no congela así.
- Hay un 30 exacto en el SDK: si el token de sesión caducó (o le quedan menos de 90 s) mientras la app estaba fuera, el SDK lo refresca al volver, y **reintenta hasta 30 s** con la red caída (`GoTrueClient.js:4012-4027`; la constante, `lib/constants.js:6`). Mientras tanto todas las peticiones esperan ese refresco (`GoTrueClient.js:4179-4181`). El refresco automático se para al ocultarse la app (`GoTrueClient.js:4768-4771`). Es la mejor candidata para la **cifra**, pero no explica sola el «—»: necesita V-1 o V-2.

**Qué lo distinguiría**, sin tocar código:
- A Victor: ¿venía de una mesa (acababa de salir con la ✕)? ¿Vio la app arrancar otra vez (el verde, o «Cargando») al volver?
- Al rector, en la base: las filas de `mesas_ia` de esa cuenta el 10-oct. Si la mesa se cerró por la recogida del arranque, fue V-1 (la app arrancó de cero). Si se cerró por salida, con un hueco largo entre el último aviso y el cierre, fue V-2.

#### Arreglo propuesto (cubre las dos vías y las tres candidatas)

Cumple las dos condiciones de la ficha: mientras no hay respuesta se enseña lo último que se sabe o un estado claro, **nunca una cifra inventada**; y la cifra del servidor manda en cuanto llega.

1. **Tope de tiempo en toda petición al servidor**, en un solo sitio (`src/lib/supabase.js:35`: el cliente admite un `fetch` propio). Una petición que no contesta en N segundos pasa a ser un fallo de red, y entonces **sí** arrancan los reintentos que ya existen. Todas las funciones de dinero son idempotentes por ficha o por número de orden: reintentar no cobra dos veces (lo dice `mesaIAApi.js:9-13`).
2. **Reintento de la lectura** mientras la app está visible (hoy solo lee una vez y espera a otro cambio de visibilidad).
3. **Al volver a primer plano, forzar** lo que lleve demasiado tiempo en vuelo (`reintentarAhora({ forzar: true })`, que ya existe y ya es seguro: mismo número de orden).
4. **La píldora, con el último saldo conocido** en vez de «—», marcada como «poniéndose al día» (el cómo se ve es de §D-3):
   - en V-2, la cifra de antes de sentarse no vale (le faltan las fichas de la mesa), así que ahí va un estado claro, no una cifra;
   - en V-1, hace falta guardar el último saldo del servidor por cuenta (hoy no se guarda nada). Es una clave nueva de almacén; `scripts/testClavesAlmacen.test.js` las vigila.
5. Con la cifra recordada **no se juzga**: ni mesas en gris ni «no te alcanza». Quien decide es el servidor (`billeteraCore.js:176-186` ya lo hace así).

**Protegidos:** ninguno. Toca `supabase.js`, `useBilletera.js`, `billeteraCore.js`, `controlMesaIA.js`, `App.jsx`, `BarraSuperior.jsx` y sus pruebas. INV-46 (el modo `saldo`) habría que ampliarla.

**¿Lo puede simular el arnés?** **A medias.** El efecto sí: el modo `saldo` ya tiene los mandos (`retrasoMs`, `retrasos`, `cortes` en `scripts/cap/capMesa.mjs:118-137`) y las cuatro sondas de arriba son celdas listas para pasar a permanentes. **La causa no:** que iOS congele la app y deje la petición colgada solo se ve en el iPhone. Y el arnés no puede ocultar una pestaña de verdad (lo dejó escrito FRZ-1).

**Validación en el iPhone (app instalada):** en una mesa, bloquear 1 min, volver y salir con la ✕; y aparte, dejar la app 10 min en segundo plano y volver. En los dos casos la píldora no debe quedarse en «—» más de lo que dure el tope, y la cifra final debe cuadrar con el SQL 1 del informe de la sesión.

**Estimación:** 70–80 min de Claude Code (núcleo + pruebas + celdas del arnés). La forma de la píldora puede pedir una lámina corta (15 min) si Victor quiere verla antes.

**Afecta a:** todo aparato con mala red; se ve sobre todo en iOS instalado.

---

### B.5 · F-8 — «Jugar contra jugadores» sobre el menú de abajo

**Causa.** El lobby es una rejilla de tres filas (`auto 1fr auto`) que mide el alto de la pantalla y recorta (`src/styles/lobby.css:124-127` y `:143`). El centro es una columna centrada que **no encoge** (`lobby.css:317-323`; la zona de los dos botones lleva `flex: none`, `:369-375`). Cuando la marca y los dos botones miden más que la fila central, se desbordan por arriba y por abajo, y lo de abajo cae sobre la barra de navegación (`lobby.css:527-535`).

Hay dos trajes compactos: `max-height: 660px` (encoge el isotipo de 40 a 26 unidades, `lobby.css:834-843`) y el teléfono acostado, `max-height: 520px` (`:847-857`). **Entre 661 y 732 px de alto no hay traje**, y con `--u` = 6 la columna no cabe.

**Medido** (igual a 1280, 1366, 1400 y 1536 de ancho; hueco entre el fondo de «Jugar contra jugadores» y el borde de arriba del menú):

| Alto | 640 | 660 | **670** | 680 | 700 | 720 | 730 | 740 | 744 | 768 |
|---|---|---|---|---|---|---|---|---|---|---|
| Hueco (px) | +35 | +45 | **−31,5** | −26,5 | −16,5 | −6,5 | −1,5 | +3,5 | +5,5 | +17,5 |

El salto de +45 a −31,5 es el traje de 660 apagándose: al pasar de 660 a 661 el isotipo crece 84 px de golpe.

**Qué tamaños afecta:** iPad mini en Safari horizontal con la barra compacta (≈ 670–674: **−30 px**, el peor caso), iPad mini en la app instalada (≈ 720: −6,5), iPad de 11" en Safari (≈ 713: −10), tableta Android grande (≈ 724: −4,5), laptop 1920×1080 al 125 % (≈ 729: −2). A 744 (pantalla completa del iPad) cabe por 5,5 px. Por debajo de 661 cabe siempre: el iPad mini con las dos barras de Safari (≈ 641) y la laptop de 1366×768 (≈ 633) se libran.

Mi matriz general da «bien» al lobby en 724 y 729 porque el botón pisa solo el filete y el relleno del menú, no sus tres botones. A 670–700 sí pisa «Tienda».

**Arreglo propuesto.** Subir la frontera del traje compacto de 660 a ~740 **solo en horizontal**, o un traje intermedio para 661–740 (isotipo de ~32 unidades). CSS aditivo en `lobby.css`, que no es protegido. Hay que cuidar que el teléfono vertical de 661–740 de alto (el S25 a 360×704, el 360×740) **no cambie**: por eso la condición lleva la orientación.

**Validación:** arnés (`diagDSK lob` + el barrido de alto; el vertical debe salir idéntico) y un vistazo en el iPad horizontal. **Estimación:** 20–25 min de Claude Code. Sin lámina: es el mismo lobby, más apretado.

---

### B.6 · G-1 — El engranaje con nombres de 15 letras

**Causa.** La regla que hace ceder al nombre con «…» se escribió solo para el lobby: `src/styles/constancia.css:67-74` (`.lobby > .lob-top { min-width: 0 }`, y el nombre con `overflow: hidden; text-overflow: ellipsis`). Las pantallas de salas pintan la misma barra con su propia copia de estilos (`src/styles/salas.css:186-214`) y **esa copia no la tiene**: allí el nombre mide lo que mida y empuja a la píldora y al engranaje. Lo anunciaba el propio comentario de `constancia.css:56-62` («ya pasaba sin la ficha con un nombre de 15 caracteres anchos»).

**Medido hoy** con 15 «W» (el peor nombre que admite la regla), en Retar y en Salas:

| Ancho | Nombre | Píldora (derecha) | Engranaje | Se sale por la derecha |
|---|---|---|---|---|
| 360 (360×640 y S25) | 190 px, entero | 349 | 356,2–387,5 | **27,5 px** (queda fuera de la pantalla casi entero) |
| 390 | 206 px | 377,8 | 385,6–419,6 | **29,6 px** |
| 412 | 217 px | 399 | 407,2–443,1 | **31,1 px** |
| 440 (iPhone 17 Pro Max) | 232 px | 425,9 | 434,7–473 | **33 px** |

En el lobby, con el mismo nombre, el engranaje queda 12,6–15,4 px **dentro**, y el nombre enseña 77–94 px de sus 190–232 («WWWWW…»).

La 1g midió 17–19,5 px; mi cifra es mayor. No sé con qué nombre ni contra qué borde midió ella: la mía es el borde derecho del engranaje contra el borde de la pantalla, con 15 «W». El documento no crece (la pantalla recorta), así que **el engranaje no se ve ni se puede tocar**. Hoy ese botón solo dice «Pronto» en esas pantallas, por eso nadie lo echó de menos.

**Arreglo propuesto.** Las mismas tres reglas de `constancia.css:67-74`, bajo `.sal`. En el peor caso (360 de ancho, 15 «W») el nombre tiene que ceder 40 px: quedan 150 de 190, unas **12 de las 15 letras** más «…». Un nombre corriente no cambia. No corta el nombre de forma que deje de leerse. `salas.css` no es protegido; es CSS aditivo.

**Afecta a:** todo teléfono en vertical (360 a 440 de ancho) con nombres de 14–15 letras anchas. En tabletas y en horizontal sobra sitio.

**Validación:** arnés. `diagDSK lob` ya mide el lobby con 15 «W» (`lob.8`); falta la misma celda para Retar y para Salas. **Estimación:** 15 min de Claude Code.

---

## §C · La matriz de tamaños

### C.1 · Cómo se midió

- **Motores:** WebKit 26.5 de Playwright (todo lo de iOS, con entrada táctil) y Chromium 151.0.7922.34 (el sellado del arnés; teléfonos, tabletas Android y laptops).
- **Servidor:** `vite preview` del bundle de producción de `92e2eeb`, **compilado fuera del repo** (al directorio temporal de la sesión). Nunca el servidor de desarrollo. **Los puertos fueron 4191 a 4194, no el 4173:** el 4173 no se tocó para no pisar el preview de Victor. Es el mismo `vite preview`, en otro puerto.
- **Sesión simulada y banco imitado** (`contextoCap` de `scripts/cap/capMesa.mjs`): ninguna petición salió a la red real. Nombre `ticotest2022` (12 letras) salvo en G-1.
- **Ningún modo permanente del arnés mide esto**, así que todo fue desde el scratchpad (cuatro guiones: `medida.mjs`, `sondas.mjs`, `tab.mjs`, y los resúmenes). El modo permanente que haría falta se describe en §E (`tam`).
- **Qué se midió en cada celda:** textos, imágenes y tocables que se salen de la pantalla (y si se alcanzan desplazando); tocables montados unos sobre otros; tocables tapados; textos recortados; y la zona táctil real de cada tocable (como el modo `tactil`: barrido con `elementFromPoint`).
- **Los estados de la mesa:** *reposo* (antes de «Iniciar mano»), *turno* (tu turno de apuesta, con TURNO, el cronómetro y los multiplicadores: el peor caso) y *pago* (con «Siguiente mano»). Las dos vías de dibujo quedan cubiertas: las mesas de 5, 4 y 3 por `OpponentPanel`, y la de 2 por `.ai-zone` en vertical.
- **Celebración:** se midió la del video (llega sola a los 40 s). La de mesa (ganar una partida) **no se midió**: en preview no existe el molde que la provoca y no salió por azar (§F).

### C.2 · Los tamaños, y de dónde sale cada uno

Todos los tamaños «con barras» son **estimados**. No presento ninguno como si fuera el aparato. Para que las conclusiones no dependan de la estimación, cada fallo de alto se midió además con un **barrido** (§C.4): da el alto exacto en que algo deja de caber, sea cual sea la barra real.

| Celda | Tamaño | Qué representa | De dónde sale | Margen |
|---|---|---|---|---|
| `iph-app-v` | 440×956 | iPhone 17 Pro Max, pantalla entera | Tablas de tamaños de iPhone (sizzy.co, yesviz.com): 440×956 a ×3 | Es el techo: la app instalada puede dar menos (barra de estado) |
| `iph-saf-v` | 440×763 | Safari vertical con barras | Estimado por proporción con iPhone anteriores. **Sin fuente para iOS 27** | ± 25 px |
| `iph-app-h` | 832×440 | App instalada, horizontal | 956 menos las dos zonas de la isla (62 px por lado), que la página no ocupa sin `viewport-fit=cover` (`index.html:9`). Estimado | ± 30 px de ancho |
| `iph-saf-h` | 832×390 | Safari horizontal | Lo anterior menos ≈ 50 px de barra. Estimado | ± 20 px |
| `ipm-app-v` / `-h` | 744×1133 / 1133×744 | iPad mini 6, pantalla entera. **Es también Safari a pantalla completa** | Tabla `ios-dimensions`: 1133×744 | La app instalada real da ≈ 24 px menos (barra de estado): ≈ 1109 y ≈ 720. Ver §C.7 |
| `ipm-saf-v` / `-h` | 744×1026 / 1133×637 | iPad mini 6, Safari con barras | Foro de desarrolladores de Apple (hilo 735055): en un iPad, Safari quita **70 px** con una barra y **103 px** con barra de pestañas aparte. Para el mini: 674 o 641 en horizontal, 1063 o 1030 en vertical. Usé 4 px menos que el peor caso | La cifra es de iPadOS 16; iPadOS 27 puede diferir. El barrido cubre 560–820 |
| `ip11-app-*` | 820×1180 / 1180×820 | iPad de 11" (Air, iPad 10) | Tamaño conocido de esos modelos; de memoria, sin fuente comprobada hoy | Como el mini |
| `ip11-saf-*` | 820×1073 / 1180×713 | Ídem, Safari con las dos barras (−107) | La misma fuente del mini | Con una barra serían 1110 y 750 |
| `ip13-saf-*` | 1024×1259 / 1366×917 | iPad Pro 13" (≈ 1024×1366), Safari | Ídem | El modelo de 2024 mide 1032×1376 |
| `ref-390`, `ref-360` | 390×844, 360×640 | Teléfonos de referencia | Los que ya mide el arnés | Pantalla «limpia», como el arnés |
| `s25-704`, `s25-915` | 360×704, 412×915 | El S25: 360×704 es su pantalla real en la app instalada (`scripts/cap/capMesa.mjs:45-48`); 412×915 es la celda «S25» del arnés | El propio arnés | — |
| `and-m-v` / `-h` | 800×1128 / 1280×648 | Tableta Android de 800×1280 en Chrome | 800×1280 es la medida de las tabletas de 10–11" más vendidas (de memoria). Barras: estado 24 + pestañas y dirección ≈ 96–104 + navegación 24–48 → resté 152. **Sin fuente comprobada** | ± 30 px |
| `and-g-v` / `-h` | 876×1248 / 1400×724 | Tableta Android grande (≈ 876×1400, una de 12,4") | Ídem | ± 30 px |
| `lap-1366` | 1366×633 | Laptop 1366×768, Chrome en ventana maximizada | 768 − 40 de barra de tareas (una guía de freeCodeCamp: alto disponible 728) − ≈ 95 de pestañas y dirección | 633–657; con barra de marcadores, ≈ 600 |
| `lap-1536` | 1536×729 | Laptop 1920×1080 al 125 % | 864 − 40 − 95 | ± 25 px |
| `lap-1280` | 1280×585 | Laptop 1920×1080 al 150 % | 720 − 40 − 95 | ± 25 px |

Enlaces de las fuentes: [sizzy.co · tamaños de iPhone](https://sizzy.co/blog/iphone-viewport-sizes) · [yesviz · iPhone 16 Pro Max](https://yesviz.com/devices/iphone-16-pro-max/) · [ios-dimensions](https://github.com/bouchenoiremarc/ios-dimensions) · [foro de Apple, hilo 735055](https://developer.apple.com/forums/thread/735055) · [freeCodeCamp · tamaño de pantalla](https://www.freecodecamp.org/news/how-to-get-screen-size-in-pixels/) · [WebKit, bug 121496](https://bugs.webkit.org/show_bug.cgi?id=121496).

La laptop HP de Victor no está en la tabla: su configuración se añade cuando él la mire. Lo que hay que apuntar es el **alto de la ventana del navegador por dentro** (§G-7).

### C.3 · La matriz (pantalla × tamaño)

**Cómo leerla.** «bien» = nada cortado, montado ni tapado. Los números son píxeles. **«sin desplazar»** = queda fuera y no hay forma de llegar; «(se desplaza)» = queda fuera pero se alcanza arrastrando. «—» = no medida. `bien¹` = solo aparece la excepción ya aceptada por PAN-1 1b (durante el pago, las cartas reveladas tapan las fichas de un rival). `²` = la mesa no casa con ninguna disposición: ver §C.5.

**iPhone 17 Pro Max (WebKit)**

| Pantalla | iph-app-v<br>440×956 | iph-saf-v<br>440×763 | iph-app-h<br>832×440 | iph-saf-h<br>832×390 |
|---|---|---|---|---|
| bautizo | bien | bien | bien | «Cerrar sesión» cortado 38 (se desplaza) |
| bautizo-nombre | bien | bien | bien | «Cerrar sesión» cortado 38 (se desplaza) |
| lobby | bien | bien | bien | bien |
| retar | bien | bien | «Retar a 4 IAS ·» cortado 85 (se desplaza) | «Retar a 4 IAS ·» cortado 92 (se desplaza) |
| retar-video | bien | bien | «Ver un video · +» cortado 48 (se desplaza); «Elige tu mesa» cortado 119 (se desplaza) | «Ver un video · +» cortado 57 (se desplaza); «Elige tu mesa» cortado 121 (se desplaza) |
| salas | bien | bien | «Armar una mesa» cortado 54 (se desplaza) | «Armar una mesa» cortado 50 (se desplaza) |
| armar-mesa | bien | bien | «Crear mesa priva» cortado 11 (se desplaza) | «Crear mesa priva» cortado 17 (se desplaza) |
| hoja-monedas | bien | bien | bien | bien |
| video | bien | bien | bien | bien |
| video-celebracion | bien | bien | bien | bien |
| mesa2-reposo | bien | bien | bien | bien |
| mesa2-turno | bien | bien | bien | bien |
| mesa2-pago | bien | bien | bien | bien |
| mesa3-reposo | bien | bien | bien | bien |
| mesa3-turno | bien | bien | bien | bien |
| mesa3-pago | bien¹ | bien¹ | bien¹ | bien¹ |
| mesa4-reposo | bien | bien | bien | bien |
| mesa4-turno | bien | bien | bien | bien |
| mesa4-pago | bien | bien | bien¹ | bien¹ |
| mesa5-reposo | bien | bien | bien | bien |
| mesa5-turno | bien | bien | bien | bien |
| mesa5-pago | sin medir | bien | sin medir | bien¹ |

**iPad mini 6 (WebKit)**

| Pantalla | ipm-app-v<br>744×1133 | ipm-saf-v<br>744×1026 | ipm-app-h<br>1133×744 | ipm-saf-h<br>1133×637 |
|---|---|---|---|---|
| bautizo | bien | bien | bien | bien |
| bautizo-nombre | bien | bien | bien | bien |
| lobby | bien | bien | bien | bien |
| retar | bien | bien | bien | «Retar a 4 IAS ·» cortado 80 **sin desplazar** |
| retar-video | bien | bien | «Elige tu mesa» cortado 3 **sin desplazar** | «Ver un video · +» cortado 29 **sin desplazar**; «Elige tu mesa» cortado 101 **sin desplazar** |
| salas | bien | bien | bien | «Armar una mesa» cortado 27 **sin desplazar** |
| armar-mesa | bien | bien | bien | bien |
| hoja-monedas | bien | bien | bien | bien |
| video | bien | bien | bien | bien |
| video-celebracion | bien | bien | bien | bien |
| mesa2-reposo | bien | bien | bien | bien |
| mesa2-turno | bien | bien | bien | «Pasar», «Apostar 50» +1 cortado 7 (se desplaza) |
| mesa2-pago | bien | bien | bien | bien |
| mesa3-reposo | bien | bien | bien | bien |
| mesa3-turno | bien | bien | bien | bien |
| mesa3-pago | bien¹ | bien¹ | bien | bien |
| mesa4-reposo | bien | bien | bien | «Iniciar mano» cortado 20 (se desplaza) |
| mesa4-turno | bien | bien | bien | «Pasar», «Apostar 50» +1 cortado 21 (se desplaza) |
| mesa4-pago | bien | bien | bien | «Recargar» cortado 1 (se desplaza) |
| mesa5-reposo | bien | bien | bien | «Iniciar mano» cortado 20 (se desplaza) |
| mesa5-turno | bien | bien | bien | «Pasar», «Apostar 50» +1 cortado 21 (se desplaza) |
| mesa5-pago | bien | bien | bien | «Recargar» cortado 1 (se desplaza) |

**iPad de 11" y Pro 13" (WebKit)**

| Pantalla | ip11-app-v<br>820×1180 | ip11-saf-v<br>820×1073 | ip11-app-h<br>1180×820 | ip11-saf-h<br>1180×713 | ip13-saf-v<br>1024×1259 | ip13-saf-h<br>1366×917 |
|---|---|---|---|---|---|---|
| bautizo | bien | bien | bien | bien | bien | bien |
| bautizo-nombre | bien | bien | bien | bien | bien | bien |
| lobby | bien | bien | bien | «Jugar contra jugadores» pisa el menú 10.1 | bien | bien |
| retar | bien | bien | bien | «Retar a 4 IAS ·» cortado 13 **sin desplazar** | bien | bien |
| retar-video | bien | bien | «Elige tu mesa» cortado 2 **sin desplazar** | «Elige tu mesa» cortado 34 **sin desplazar** | bien | bien |
| salas | bien | bien | bien | texto «Privada con códi» fuera 16 | bien | bien |
| armar-mesa | bien | bien | bien | bien | bien | bien |
| hoja-monedas | bien | bien | bien | bien | bien | bien |
| video | bien | bien | bien | bien | bien | bien |
| video-celebracion | bien | bien | bien | bien | bien | bien |
| mesa2-reposo | sin disposición² | sin disposición² | bien | bien | sin disposición² | bien |
| mesa2-turno | sin disposición² | sin disposición² | bien | bien | sin disposición² | bien |
| mesa2-pago | sin disposición² | sin disposición² | bien | bien | sin disposición² | bien |
| mesa3-reposo | sin disposición² | sin disposición² | bien | bien | sin disposición² | bien |
| mesa3-turno | sin disposición² | sin disposición² | bien | bien | sin disposición² | bien |
| mesa3-pago | sin disposición² | sin disposición² | bien | bien | sin disposición² | bien |
| mesa4-reposo | sin disposición² | sin disposición² | bien | bien | sin disposición² | bien |
| mesa4-turno | sin disposición², textos fuera de su caja hasta 62 | sin disposición², textos fuera de su caja hasta 62 | bien | bien | sin disposición² | bien |
| mesa4-pago | sin disposición² | sin disposición² | bien | bien | sin disposición² | bien |
| mesa5-reposo | sin disposición² | sin disposición² | bien | bien | sin disposición² | bien |
| mesa5-turno | sin disposición², textos fuera de su caja hasta 62 | sin disposición², textos fuera de su caja hasta 62 | bien | bien | sin disposición² | bien |
| mesa5-pago | sin disposición² | sin disposición² | bien | bien | sin medir | bien |

**Teléfonos de referencia (Chromium)**

| Pantalla | ref-390<br>390×844 | ref-360<br>360×640 | s25-704<br>360×704 | s25-915<br>412×915 |
|---|---|---|---|---|
| bautizo | bien | bien | bien | bien |
| bautizo-nombre | bien | bien | bien | bien |
| lobby | bien | bien | bien | bien |
| retar | bien | bien | bien | bien |
| retar-video | bien | bien | bien | bien |
| salas | bien | bien | bien | bien |
| armar-mesa | bien | bien | bien | bien |
| hoja-monedas | bien | bien | bien | bien |
| video | bien | bien | bien | bien |
| video-celebracion | bien | bien | bien | bien |
| mesa2-reposo | bien | bien | bien | bien |
| mesa2-turno | bien | bien | bien | bien |
| mesa2-pago | bien | bien | bien | bien |
| mesa3-reposo | bien | bien | bien | bien |
| mesa3-turno | bien | bien | bien | bien |
| mesa3-pago | bien¹ | bien¹ | bien¹ | bien¹ |
| mesa4-reposo | bien | bien | bien | bien |
| mesa4-turno | bien | bien | bien | bien |
| mesa4-pago | bien¹ | bien¹ | bien¹ | bien |
| mesa5-reposo | bien | bien | bien | bien |
| mesa5-turno | bien | bien | bien | bien |
| mesa5-pago | bien¹ | bien¹ | bien¹ | bien |

**Tabletas Android (Chromium)**

| Pantalla | and-m-v<br>800×1128 | and-m-h<br>1280×648 | and-g-v<br>876×1248 | and-g-h<br>1400×724 |
|---|---|---|---|---|
| bautizo | bien | bien | bien | bien |
| bautizo-nombre | bien | bien | bien | bien |
| lobby | bien | bien | bien | «Jugar contra jugadores» pisa el menú 4.5 |
| retar | bien | «Retar a 4 IAS ·» cortado 69 **sin desplazar** | bien | «Retar a 4 IAS ·» cortado 2 **sin desplazar** |
| retar-video | bien | «Ver un video · +» cortado 18 **sin desplazar**; «Elige tu mesa» cortado 90 **sin desplazar** | bien | «Elige tu mesa» cortado 23 **sin desplazar** |
| salas | bien | «Armar una mesa» cortado 16 **sin desplazar** | bien | texto «Privada con códi» fuera 5 |
| armar-mesa | bien | bien | bien | bien |
| hoja-monedas | bien | bien | bien | bien |
| video | bien | bien | bien | bien |
| video-celebracion | bien | bien | bien | bien |
| mesa2-reposo | sin disposición² | bien | sin disposición² | bien |
| mesa2-turno | sin disposición² | bien | sin disposición² | bien |
| mesa2-pago | sin disposición² | bien | sin disposición² | bien |
| mesa3-reposo | sin disposición² | bien | sin disposición² | bien |
| mesa3-turno | sin disposición² | bien | sin disposición² | bien |
| mesa3-pago | sin disposición² | bien | sin disposición² | bien |
| mesa4-reposo | sin disposición² | «Iniciar mano» cortado 9 (se desplaza) | sin disposición² | bien |
| mesa4-turno | sin disposición², textos fuera de su caja hasta 72 | «Pasar», «Apostar 50» +1 cortado 20 (se desplaza) | sin disposición², textos fuera de su caja hasta 34 | bien |
| mesa4-pago | sin disposición² | «⋮» cortado 7 (se desplaza); «✕» cortado 6 (se desplaza) | sin disposición² | bien |
| mesa5-reposo | sin disposición² | «Iniciar mano» cortado 9 (se desplaza) | sin disposición² | bien |
| mesa5-turno | sin disposición², textos fuera de su caja hasta 72 | «Pasar», «Apostar 50» +1 cortado 20 (se desplaza) | sin disposición², textos fuera de su caja hasta 34 | bien |
| mesa5-pago | sin disposición² | «⋮» cortado 7 (se desplaza); «✕» cortado 6 (se desplaza) | sin disposición² | bien |

**Laptops (Chromium)**

| Pantalla | lap-1366<br>1366×633 | lap-1536<br>1536×729 | lap-1280<br>1280×585 |
|---|---|---|---|
| bautizo | bien | bien | bien |
| bautizo-nombre | bien | bien | bien |
| lobby | bien | «Jugar contra jugadores» pisa el menú 2 | bien |
| retar | «Retar a 4 IAS ·» cortado 84 **sin desplazar** | bien | «Retar a 4 IAS ·» cortado 114 **sin desplazar** |
| retar-video | «Ver un video · +» cortado 33 **sin desplazar**; «Elige tu mesa» cortado 105 **sin desplazar** | «Elige tu mesa» cortado 18 **sin desplazar** | «Ver un video · +» cortado 64 **sin desplazar**; «Elige tu mesa» cortado 135 **sin desplazar** |
| salas | «Armar una mesa» cortado 31 **sin desplazar** | bien | «Armar una mesa» cortado 62 **sin desplazar** |
| armar-mesa | bien | bien | «Crear mesa priva» cortado 14 **sin desplazar** |
| hoja-monedas | bien | bien | bien |
| video | bien | bien | bien |
| video-celebracion | bien | bien | bien |
| mesa2-reposo | texto «Mano» fuera 1 (se desplaza) | bien | bien |
| mesa2-turno | «Pasar», «Apostar 50» +1 cortado 8 (se desplaza) | bien | bien |
| mesa2-pago | bien | bien | bien |
| mesa3-reposo | bien | bien | bien |
| mesa3-turno | bien | bien | bien |
| mesa3-pago | bien | bien | bien¹ |
| mesa4-reposo | «Iniciar mano» cortado 24 (se desplaza) | bien | bien |
| mesa4-turno | «⋮» cortado 2 (se desplaza); «Pasar», «Apostar 50» +1 cortado 18 (se desplaza) | bien | bien |
| mesa4-pago | «⋮» cortado 58 (se desplaza); «✕» cortado 57 (se desplaza); «IA 2» cortado 10 (se desplaza) | bien | bien¹ |
| mesa5-reposo | «Iniciar mano» cortado 24 (se desplaza) | bien | bien |
| mesa5-turno | «⋮» cortado 2 (se desplaza); «Pasar», «Apostar 50» +1 cortado 18 (se desplaza) | bien | bien |
| mesa5-pago | «⋮» cortado 18 (se desplaza); «✕» cortado 17 (se desplaza) | bien | bien¹ |

**Lo que dice la matriz, en corto:**

- **En vertical, los teléfonos están bien** en las 22 pantallas (390×844, 360×640, el S25 en sus dos medidas y el iPhone 17 Pro Max en las suyas), con la excepción ¹ y con una celda sin medir (el pago de la mesa de 5 en `iph-app-v`). **No aparece nada nuevo** en los tamaños que el arnés ya medía.
- **El iPad mini en vertical está bien** en todo, con y sin las barras de Safari (744×1026 y 744×1133). F-5 no aparece sin pantalla completa.
- **Todos los fallos graves son de horizontal con poco alto**, y son los mismos en iPad, tableta Android y laptop: Retar, Salas, el lobby y la mesa de 5 y de 4.
- **El video, la hoja «Conseguir monedas», la celebración del video y el Bautizo** salen bien en los 25 tamaños. (En el iPhone acostado dentro de Safari, «Cerrar sesión» del Bautizo queda 38 px fuera, pero esa pantalla desplaza.)
- **La mesa de 3 es la que mejor aguanta** el horizontal bajo: limpia a 633 y a 637. La de 2 corta sus botones 7–8 px a 633–637 y cabe a 648.

### C.4 · Los barridos de alto: dónde deja de caber cada cosa

En una sola sesión por perfil se fue cambiando el alto de la ventana de 560 a 820 px, de 10 en 10 (en el turno de la mesa: 600 a 744), y se midió cada vez. Los tramos son **el alto de la ventana en que falta sitio**, y «peor» son los píxeles que faltan en el peor punto. El final de cada tramo está interpolado entre dos muestras. (En las tablas generadas por guion, los decimales van con punto.)

| Perfil y ancho | Lobby: «Jugar contra jugadores» sobre el menú | Retar: botón dorado cortado | Retar con video: botón cortado | Mesa de 5: «Iniciar mano» cortado | Mesa de 5: «Pasar / Apostar / Retirarse» cortados |
|---|---|---|---|---|---|
| Tableta Android (Chromium, táctil) · 1280 | 670–732 (peor -31.5) | 560–725 (peor -116.8) | 560–747 (peor -138.1); 810–822 (extrapolado; peor -12.1) | 610–656 (peor -46.6) | 620–676 (peor -56.6) |
| Tableta Android (Chromium, táctil) · 1400 | 670–732 (peor -31.5) | 560–725 (peor -116.8) | 560–747 (peor -138.1); 810–822 (extrapolado; peor -12.1) | 610–656 (peor -46.6) | 620–676 (peor -56.6) |
| iPad (WebKit, táctil) · 1133 | 670–733 (peor -31.6) | 560–725 (peor -116.8) | 560–747 (peor -138.1); 810–822 (extrapolado; peor -12.1) | 610–656 (peor -47) | 620–677 (peor -57.5) |
| iPad (WebKit, táctil) · 1180 | 670–733 (peor -31.6) | 560–725 (peor -116.8) | 560–747 (peor -138.1); 810–822 (extrapolado; peor -12.1) | 610–656 (peor -47ᵃ) | 620–677 (peor -57.5) |
| iPad (WebKit, táctil) · 1366 | 670–733 (peor -31.6) | 560–725 (peor -116.8) | 560–747 (peor -138.1); 810–822 (extrapolado; peor -12.1) | 610–656 (peor -47) | 620–677 (peor -57.5) |
| Laptop (Chromium, ratón) · 1280 | 670–732 (peor -31.5) | 560–725 (peor -116.8) | 560–747 (peor -138.1); 810–822 (extrapolado; peor -12.1) | 610–656 (peor -46.6) | 620–674 (peor -54.6) |
| Laptop (Chromium, ratón) · 1366 | 670–732 (peor -31.5) | 560–725 (peor -116.8) | 560–747 (peor -138.1); 810–822 (extrapolado; peor -12.1) | 610–656 (peor -46.6) | 620–674 (peor -54.6) |
| Laptop (Chromium, ratón) · 1536 | 670–732 (peor -31.5) | 560–725 (peor -116.8) | 560–747 (peor -138.1); 810–822 (extrapolado; peor -12.1) | 610–656 (peor -46.6) | 620–674 (peor -54.6) |

ᵃ En esa fila, la muestra de 610 px dio −245: es un fotograma a medio recolocar (la medida cayó justo al cambiar de ancho y de disposición). Las otras dos filas del iPad dan −47 en el mismo punto.

Cómo leer los extremos:

- El tramo del **lobby** empieza de verdad en **661**: es donde se apaga el traje compacto (`lobby.css:834`). La primera muestra por encima es 670.
- Los tramos de **Retar** siguen por debajo de 560 hasta **521**. De 520 para abajo, en horizontal, la pantalla desplaza (`salas.css:1237-1241`) y el botón se alcanza.
- Los tramos de la **mesa** empiezan en **601**: por debajo, la mesa pasa a la disposición de teléfono horizontal y cabe (`gameTable.css:2397`). En la mesa lo cortado **sí se alcanza** arrastrando dentro de ella (`gameTable.css:8`, `overflow-y: auto`).
- El segundo tramo de Retar con video (801–822) es el traje de 800 apagándose (`salas.css:1521`).

**Lo que esto significa para el arnés:** todas sus celdas de escritorio miden 720 de alto o más. Las cuatro bandas de arriba caen justo debajo. Y sus celdas de 1366×768 miden 768 «limpios», que ningún navegador en ventana da.

### C.5 · F-6 — La mesa en tabletas verticales (cifras para TAB-1; no se propone arreglo)

Qué disposición recibe cada tableta en vertical (lo deciden `src/components/GameTable.jsx:104`, `:110` y `:119`, y sus bloques en `gameTable.css:1165`, `:2397` y `:4251`):

| Ancho en vertical | Disposición | Ejemplos |
|---|---|---|
| hasta 767 px | **La de teléfono vertical**, estirada | iPad mini (744) |
| **768 px o más** | **Ninguna de las tres.** No es teléfono vertical (pide `max-width: 767px`) ni es horizontal. Cae a los estilos base, más el bloque `(min-width: 768px) and (min-height: 601px)` de `gameTable.css:1130` | iPad de 11" (820), iPad Pro (1024), Android de 800 y de 876 |

El corte está en un píxel: a 767×1128 sale la mesa de teléfono; a 768×1128, la base.

**a) iPad mini, 744 de ancho: la mesa de teléfono, estirada** (es F-6 tal como lo vio Victor)

| Medida | 744×1026 (Safari) | 744×1133 (app) |
|---|---|---|
| La mesa ocupa de la pantalla | 96 % | 96 % |
| Caja de la mesa | 726 × 1010 px | 726 × 1117 |
| Carta del jugador | 75 × 117 px | 75 × 117 |
| Carta de un rival (mesas de 3, 4 y 5) | 41,5 × 63 px | 41,5 × 63 |
| Letra del nombre de un rival | 13 px | 13 px |
| Óvalo de la mesa de 5 y de 4 | 512 × 119 px | 512 × 119 |
| Óvalo de la mesa de 2 | 702 × 452 px | 702 × 560 |
| Zona del jugador | 702 × 291 px | 702 × 291 |
| Botones de apuesta | 55–82 × 40 px (cumplen el piso táctil) | igual |
| Multiplicadores (×1…×10) | 35,5 × 27 px pintados | igual |

El «todo pequeño y mucho verde», en cifras: las cartas, las letras y la zona del jugador **miden lo mismo a 1026 que a 1133 de alto**; lo único que crece con la pantalla es el hueco. En las mesas de 4 y 5 el óvalo son 119 px de alto dentro de una mesa de 1010–1117: el 11–12 %. Las cinco cartas del jugador suman 375 px de los 702 de su zona. No medí la misma mesa en un teléfono con esta sonda, así que no doy la comparación.

**b) 768 px o más de ancho: la mesa sin disposición propia** (hallazgo nuevo)

| Medida | 800×1128 (Android) | 820×1073 (iPad 11", Safari) | 820×1180 (iPad 11", app) | 876×1248 (Android) | 1024×1259 (iPad Pro) |
|---|---|---|---|---|---|
| Caja de la mesa | 758 × **830** px | 778 × 830 | 778 × 830 | 834 × 830 | 860–982 × 830 |
| La mesa ocupa de la pantalla | 70 % | 73 % | 67 % | 63 % | 55–63 % |
| **Óvalo de la mesa de 5 y de 4** | **138 × 195–218** px | 158 × 195–218 | 158 × 195–218 | 214 × 218 | 362 × 218 |
| Textos que se salen del óvalo (mesas de 4 y 5) | «Comodín activo…» **72 px**; el mensaje de etapa, 13 | 62 px; 3 | 62 px; 3 | 34 px | ninguno |
| Fichas de un rival fuera de su panel (mesa de 5) | 46 px, y dos cifras **montadas** 26 × 24 | 41 px; montadas 16 × 24 | igual | 27 px | ninguno |
| Botones «Pasar / Apostar / Retirarse» | 71–103 × **33** px | 68–97 × 34 | igual | 71–103 × 33 | 68–97 × 34 |
| Multiplicadores | 40 × 28 px | 39 × 29 | igual | 40 × 28 | 39 × 29 |
| Carta del jugador / de un rival | 91 × 142 / 54 × 82 | igual | igual | igual | igual |

Lo que hay que saber para TAB-1:

- La caja de la mesa mide **830 px de alto fijos**, centrada: sobra verde arriba y abajo.
- En las mesas de 4 y 5 el óvalo se queda en una columna estrecha (138–214 px) y su contenido no cabe: el aviso del comodín se sale hasta 72 px y se recorta (`gameTable.css:1141`, `overflow: hidden`).
- **El piso táctil no se cumple:** los botones de apuesta miden 33–34 px de alto y los multiplicadores 28–29. El sub-bloque táctil de PAN-1 vive dentro del bloque de escritorio (horizontal), que aquí no aplica.
- A partir de ≈ 1000 px de ancho (iPad Pro) los textos ya caben. Los botones siguen en 34 px.
- El corte de 767/768 lo cruza también la **pantalla dividida** del iPad.

No propongo nada: es TAB-1. Sí lo señalo como más grave que F-6: en un iPad de 11" o en una tableta Android en vertical, las mesas de 4 y 5 no están «pequeñas», están descuadradas.

### C.6 · Tocables de menos de 40 px (no es de esta campaña; se anota)

En aparatos táctiles, fuera de la mesa. Lo que ya conocía el informe de la sesión (H-3) sigue igual; aparece uno nuevo.

| Tocable | Teléfono vertical (360–440) | iPad y tabletas |
|---|---|---|
| El «+» de la píldora | zona 20–23 px | 31 × 32 |
| El engranaje | 32–39 px | cumple |
| «Volver» y la casa de Retar y Salas | 31–35 px | cumplen |
| **El campo del código de invitación (Salas)** — nuevo | 98 × **24** px | 152 × 38 |
| «Cerrar sesión» del Bautizo | por debajo de 40 | por debajo de 40 |

En las laptops (ratón) no se cuenta. La mesa, en las disposiciones de teléfono y de escritorio táctil, cumple; donde no cumple es en §C.5 b.

### C.7 · Límites de la emulación

1. **Las barras.** Ningún tamaño «con barras» es el aparato. Los de iPad salen de una medición publicada de iPadOS 16; iPadOS 27 puede dar otra. Los de iPhone y Android son estimaciones mías sin fuente. Lo que no depende de la estimación son los barridos de §C.4.
2. **La app instalada del iPad no da 744.** El arnés midió 1133×744 y dio Retar por bueno (cabe por 18 px). Victor lo vio cortado en la app. La explicación más sencilla: la app deja fuera la barra de estado (≈ 24 px) y da ≈ 720, donde el barrido dice −6 px. **No lo pude comprobar.** Se mide en el aparato con un dato (§G-6).
3. **El iPhone instalado.** No sé si la página empieza debajo de la hora y de la isla o debajo de ellas pintadas encima. La sesión no reportó nada tapado, así que parece lo primero. La celda `iph-app-v` es el techo.
4. **El WebKit de Playwright en Windows no es Safari:** no tiene teclado en pantalla, ni barras, ni isla, ni la ✕ de la pantalla completa, ni congela la app. Tampoco da las señales de aparato (`maxTouchPoints` 0, plataforma «Win32», la capacidad propia de iOS en falso): las reglas de §B.2 para distinguir tabletas **no se pudieron probar aquí**.
5. **La pantalla completa.** Las celdas táctiles corren con la pantalla completa pedida (así es el arnés desde PAN-1 1c) y no cambia el tamaño de la ventana. El valor de `svh` frente a `dvh` del iPad real no se puede emular: F-5 se reprodujo forzando el alto del óvalo, no la unidad.
6. **Una sola mano por celda de mesa**, con semilla fija. El descarte y la recarga no tienen celda propia.

---

## §D · Las decisiones que tiene que tomar Victor

### D-1 · La pantalla completa en tabletas

Las cuatro opciones, con sus pros y contras, están en §B.2. En corto:

| | iPad en Safari | Tabletas Android | Cierra F-3 | Cierra F-5 | Coste |
|---|---|---|---|---|---|
| **A** · nunca en tabletas | nunca | **nunca** (hoy va bien) | sí | sí | Botones de la mesa cortados en horizontal en iPad **y** en Android, hasta arreglar D-4 |
| **B** · solo en la mesa | en la mesa | en la mesa | casi (quedan la ✕ y la hora en la mesa) | **no** | El menor cambio |
| **C** · nunca en Safari de iPad | nunca | como hoy | sí | sí | Botones de la mesa cortados en el iPad horizontal en Safari, hasta D-4 |
| **C+B** · en Safari de iPad, solo en la mesa y solo en horizontal | mesa horizontal | como hoy | casi (✕ y hora en la mesa horizontal) | sí en uso normal; a comprobar al girar | La regla más larga |

**Recomiendo C+B ahora, y pasar a C el día que la banda de la mesa esté arreglada (D-4).** Razones:

1. El problema no es «la tableta»: es **cómo da Safari de iPad la pantalla completa** (no deja escribir, pinta su ✕, sale al girar). En Android no pasa nada de eso. Quitársela a las tabletas Android (opción A) rompe algo que funciona para arreglar algo que allí no está roto.
2. Fuera de la mesa, en el iPad la pantalla completa solo estorba: ahí hay campos de texto y no hace falta el alto. Eso lo quitan B, C y C+B por igual.
3. Dentro de la mesa **en horizontal** es lo único que hoy hace caber los botones en Safari (744 px frente a ≈ 641–674). Victor lo anotó como «salió bien». C lo estropea hasta D-4; C+B lo conserva.
4. Dentro de la mesa **en vertical** no hace falta (la mesa cabe a 744×1026) y es donde vive F-5. C+B la quita ahí.
5. El riesgo que le queda a C+B (que F-5 asome al girar de horizontal a vertical con una mano en curso) se comprueba en el iPad en un minuto. Si asoma, se cae a C quitando una condición.

Lo que no sé y decide el aparato: si la regla «es Safari de iPad» por capacidad funciona en iPadOS 27 (§C.7, punto 4). Si no, la alternativa es la regla por tamaño de pantalla más «tiene la API y no es Android», que es peor.

### D-2 · El botón de Retar: qué significa «fijo»

| Opción | Qué es | A favor | En contra |
|---|---|---|---|
| **a** · Parche de alcance, ya | En horizontal, cuando la columna no cabe (entre 521 y ≈ 750 de alto, y el tramo 801–822 del video), la pantalla desplaza, como ya hace el teléfono acostado. No cambia el diseño | 5–10 líneas de CSS. Deja de haber un botón inalcanzable **en iPad, tabletas y laptops** esta misma semana | El botón sigue fuera de la vista hasta que se desplaza. Contradice «no se scrollea, se aprieta» en esa banda |
| **b** · Botón anclado al fondo, resumen encima (la sugerencia) | Lámina primero. El botón siempre visible; las filas desplazan por dentro si no caben | El botón nunca se pierde. Vale para las tres pantallas de la carcasa | Cuesta ≈ 50 px de columna. Hay que recolocar la casa, la nota y el bloque del video. Lleva lámina y una tanda de código |
| **c** · Solo apretar más | Un traje nuevo para 521–730 | Mantiene la doctrina | **No alcanza:** faltan hasta 117 px (138 con video) y los chips ya están en su piso táctil |

**Recomiendo a y luego b.** El parche (a) quita lo grave en una tanda corta y no compromete la lámina. La lámina (b) decide la forma buena con calma. (c) no llega por sí sola.

### D-3 · Qué enseña la píldora mientras no hay respuesta

| Opción | Al arrancar o al volver (V-1) | Al salir de una mesa (V-2) |
|---|---|---|
| **a** · Último saldo conocido, atenuado | La cifra guardada, en gris suave, hasta que conteste el servidor | No sirve: la cifra de antes de sentarse es falsa (le faltan las fichas de la mesa) |
| **b** · Un estado claro | «—» con un giro o un pulso | «—» con un giro o un pulso |
| **a+b** | Último saldo, atenuado | Estado claro (el «—» de hoy, con señal de que se está cobrando) |

**Recomiendo a+b.** Es lo que pide la ficha («el último saldo conocido **o** un estado claro, nunca uno inventado») aplicado a cada vía. Pide guardar el último saldo en el aparato: una clave nueva de almacén, por cuenta. La cifra recordada **no** enciende ni apaga mesas: con ella no se juzga.

Y una pregunta que va con esta: mientras la cifra es recordada, **¿el botón de Retar se enciende?** Hoy sin cifra está apagado. Recomiendo encenderlo: el servidor ya rechaza lo que no alcanza, y es mejor un «no te alcanza» que 30 s sin poder jugar.

### D-4 · La banda 601–676 de la mesa en horizontal (H-1)

No es de IOS-1, pero las decisiones de arriba dependen de ella. En esa banda la mesa de 5 y de 4 corta «Pasar / Apostar / Retirarse» (hasta 57 px) e «Iniciar mano». Caen ahí el iPad en Safari sin pantalla completa, la tableta Android de 800×1280 en Chrome con barras **y toda laptop de 1366×768 con el navegador en ventana**.

La causa vive en `src/styles/gameTable.css` (el bloque de escritorio empieza en 601 de alto, `:4251`, y la fila de botones necesita 677). **Es un protegido.** Arreglarlo pide autorización de Victor para ese archivo o una hoja aditiva, y respetar la regla de los óvalos (que el óvalo se adapte al tamaño es normal; que cambie de forma, no).

**Recomiendo abrirla como campaña propia, con su Fase 0, después de las tandas que necesitan el iPad.** No esta semana. Mientras, lo cortado se alcanza desplazando dentro de la mesa.

### D-5 · F-2: ¿se endurece el Bautizo aunque no haya causa demostrada?

**Recomiendo sí, dentro de la tanda de F-7:** recortar espacios del nombre, decir por qué el botón está apagado, y el tope de tiempo de red. Son 15 minutos, cubren las dos candidatas y no cambian nada para quien ya entra bien. F-2 sigue «en vigilancia» hasta que se repita o pasen dos sesiones sin verlo.

### D-6 · TAB-1 a la vista de §C.5

La mesa en tabletas verticales de 768 px o más no está «pequeña»: no tiene disposición. Afecta al iPad de 11", al iPad Pro y a las tabletas Android, no al iPad mini. **No pido decisión de arreglo** (es TAB-1), solo que Victor sepa que TAB-1 tiene dos casos distintos y que el segundo es más grave que el que él vio.

---

## §E · El reparto en sub-tandas

Ordenado por lo que necesita el iPhone o el iPad. Los minutos son de Claude Code. Lo que no se comprime va aparte.

| Sub-tanda | Qué cierra | Protegidos | Lámina | Minutos | Se valida en |
|---|---|---|---|---|---|
| **IOS-1a** · La pantalla completa del iPad | F-3, F-5 | No | No | 40–55 | **iPad** (Safari) · S25 · vitest del núcleo |
| **IOS-1b** · Alcance: lo que hoy no se puede tocar | F-4 (parche D-2 a), F-8, G-1 | No (CSS aditivo en `salas.css` y `lobby.css`) | No | 45–55 | **iPad** horizontal (Safari y app) · laptop de Victor · arnés |
| **IOS-1c** · El saldo al volver | F-7; endurece F-2 | No | Opcional, corta (la píldora atenuada): +15 | 75–90 | **iPhone** (app instalada) · arnés (modo `saldo`) |
| **IOS-1d** · Lámina de Retar | prepara F-4 de verdad | No | **Es la lámina** | 40–50 | Victor, en pantalla. No necesita aparato |
| **IOS-1e** · Retar con el botón anclado | F-4 | No | La de 1d, aprobada | 60–75 | **iPad** horizontal · S25 · laptop · arnés |
| **IOS-1f** · Arnés y cierre | modo `tam` completo, invariantes, informe | No | No | 60–70 | arnés. No necesita aparato |

**Total:** 320–395 minutos de Claude Code, en seis tandas cortas.

**Orden propuesto y por qué:**

1. **1a y 1b primero, juntas en una visita al iPad.** Son las dos cortas, no dependen una de otra y las dos se miran en el iPad en horizontal. 1d (la lámina) puede hacerse a la vez: no necesita aparato.
2. **1c después**, con el iPhone. Es la más larga y la que más depende de una prueba real (bloquear, esperar, volver).
3. **1e al final de la semana**, con la lámina ya aprobada. Es la última que necesita el iPad.
4. **1f cuando los aparatos ya se hayan ido.** Solo arnés y documentos.

Si la semana se queda corta, lo que puede esperar sin el iPad es 1e (el parche de 1b ya deja el botón alcanzable) y 1f.

**Lo que no se comprime:**

| Qué | Quién | Cuánto |
|---|---|---|
| Decidir D-1, D-2, D-3 y D-5 antes de empezar | Victor | — |
| Visita 1 al iPad (tras 1a y 1b): escribir correo y nombre sin que entre y salga; girar; mesas de 2 y 3 en vertical; Retar y lobby en horizontal, en Safari y en la app. Y el S25: que nada cambie | Victor | ≈ 15 min |
| Visita al iPhone (tras 1c): en una mesa, bloquear 1 min, volver y salir; aparte, 10 min en segundo plano y volver | Victor | ≈ 20 min, con las esperas |
| Revisar la lámina de Retar (1d) | Victor | — |
| Visita 2 al iPad y a la laptop (tras 1e) | Victor | ≈ 10 min |
| Publicar cada tanda | Victor | — |

**El modo permanente nuevo del arnés: `tam`.** Hoy ningún modo mide un tamaño «con barras» ni barre el alto. Propongo:

- **En 1b, lo mínimo:** un barrido de alto (521–830) del lobby, Retar, Retar con video y Salas, en un ancho de tableta y uno de laptop. Nace rojo con el código de hoy y verde con el arreglo: así el parche llega medido.
- **En 1c:** las cuatro sondas de F-7 pasan a ser celdas del modo `saldo`, que ya tiene los mandos.
- **En 1e:** el barrido se amplía a la carcasa nueva.
- **En 1f:** el modo completo, con la lista de tamaños de §C.2 como contrato, su fila en la tabla de varas y su invariante.

Fuera de `tam`: la regla de la pantalla completa se prueba en vitest (el núcleo ya es puro). Y G-1 es una celda más de `diagDSK lob`, que ya mide el lobby con 15 «W».

**Fuera de IOS-1:** la banda de la mesa (D-4), TAB-1 (F-6 y §C.5) y `viewport-fit=cover` (la hora y la isla sobre la página; pregunta 12).

---

## §F · Riesgos y lo que no se pudo medir

**No se midió:**

1. **La celebración de la mesa** (ganar la partida). En preview no existe el molde que la provoca (`?apu=gana` es solo de desarrollo) y no salió por azar. Sí se midió la del video.
2. **La sala de espera** y el stub de la partida PvP. Sin servidor no se puede crear una sala en preview. Se midieron Salas y Armar mesa.
3. **El descarte, la recarga, el menú ⋮ y los tapetes** de la mesa: no tienen celda en esta fase. Los midió la pasada del 10-oct en 8 tamaños.
4. **El pago de la mesa de 5 en el iPhone** (`iph-app-v` e `iph-app-h`): la mano no terminó en los 170 s de tope. El reposo y el turno de esas dos celdas sí están.
5. **La Portada.** No se repitió: salió limpia el 10-oct y no ha cambiado.
6. **Nada de lo que solo tiene el aparato:** las barras reales, la isla, el teclado de iOS, la ✕ y la hora de la pantalla completa, el valor real de `svh`, y qué hace iOS con una petición cuando congela la app.

**Riesgos de lo propuesto:**

1. **Los tamaños «con barras» son estimaciones.** Lo mitigan los barridos, que dan el umbral exacto. La cifra que más importa y no tengo es el alto real de la app instalada en el iPad (pregunta 6).
2. **La regla «es Safari de iPad»** no se pudo probar fuera del aparato. Es lo primero que hay que mirar en la visita 1.
3. **F-7 no tiene causa única demostrada.** El arreglo cubre las dos vías y las tres candidatas, pero si la causa real fuera otra (por ejemplo, que iOS tarde en devolver la red a la app), el tope de tiempo acorta el «—» pero no lo quita. Por eso va junto con «enseñar lo último que se sabe».
4. **El tope de tiempo de red** corta también peticiones lentas pero legítimas. No cobra dos veces (todo es idempotente), pero con mala red puede multiplicar los reintentos. La cifra del tope hay que elegirla midiendo, no a ojo.
5. **El parche de alcance (1b)** hace desplazar una pantalla que la doctrina dice que no desplaza. Es deliberado y temporal; si 1e se retrasa, se queda.
6. **El traje del lobby** no debe tocar el teléfono vertical de 661–740 px de alto (el S25 mide 704). Va atado a la orientación y lo vigila `diagDSK lob`.
7. **Anclar el botón de Retar** cuesta ≈ 50 px de columna: en la banda 726–776, donde hoy todo «cabe», las filas pasarán a desplazar.
8. **H-1 sigue ahí** con cualquier opción de D-1 hasta que se abra D-4. Con A o C se nota más.
9. **El WebKit del arnés es lento:** ≈ 10 minutos por cada 5 tamaños, tres veces más que Chromium. Un modo `tam` con WebKit completo ronda la media hora.

**Un punto ciego del arnés que esta fase destapa:** sus celdas de escritorio son 1280×720, 1366×768 y mayores, todas «limpias». Ningún navegador en ventana da 768 de alto en una pantalla de 768. Las cuatro bandas de §C.4 caen justo debajo de lo que se mide.

---

## §G · Preguntas al rector

1. **D-1:** ¿qué opción para la pantalla completa en tabletas? Recomiendo C+B.
2. **D-2:** ¿vale el parche de alcance (la pantalla desplaza entre 521 y ≈ 750 de alto en horizontal) antes de la lámina, aunque contradiga «no se scrollea, se aprieta» en esa banda?
3. **F-7, para elegir entre V-1 y V-2:** ¿qué hizo Victor justo antes de ver el «—»? ¿Venía de una mesa? ¿La app arrancó de nuevo? Y en la base: las filas de `mesas_ia` de su cuenta del 10-oct, con `motivo_cierre`, `ultimo_aviso_en` y `cerrada_en`.
4. **F-7:** ¿se acepta guardar el último saldo en el aparato (clave nueva de almacén, por cuenta)? ¿Y el botón de Retar se enciende con la cifra recordada?
5. **F-7:** ¿qué tope de tiempo de red? Propongo medirlo en 1c y partir de 8 s.
6. **El alto real de la app instalada en el iPad.** No hace falta código: una captura del iPad en horizontal, dentro de la app instalada, de Retar con las cuatro filas elegidas. Del sitio donde quede el botón saco el alto con ± 2 px. Lo mismo en Safari, con y sin la barra de pestañas aparte.
7. **La laptop HP de Victor:** resolución, escala de Windows y una captura de Retar con el navegador en ventana normal.
8. **F-2:** ¿qué decía el botón cuando se colgó: «Confirmar» en gris o «Guardando…»? ¿Existía ya la fila de `profiles` antes del segundo intento?
9. **D-4:** ¿se abre la banda 601–676 de la mesa como campaña propia? ¿Con hoja aditiva o con autorización para `gameTable.css`?
10. **G-1:** la 1g midió 17–19,5 px y yo 27,5–33 con 15 «W». ¿Con qué nombre y contra qué borde midió? No cambia el arreglo; es para no dejar dos cifras sin explicar.
11. **El modo `tam`:** ¿debe correr también en WebKit, con su media hora, o basta Chromium más una pasada WebKit al cierre de cada tanda?
12. **`viewport-fit=cover` (FS-1):** la hora y la batería sobre el nombre son, en parte, cosa de la pantalla completa de Safari. ¿FS-1 sigue fuera de IOS-1?
13. **TAB-1:** con lo de §C.5 b, ¿cambia su prioridad o su alcance?

---

## §H · Tiempo, cifras de la medida y cierre de terreno

**Tiempo real:** de las 17:55 a las 18:36 del 13-oct-2026: **41 minutos**, dentro del tope de 1 h 45 min. No se recortó ninguna medida de las pedidas; lo que no se pudo medir está en §F.

**Cifras de la medida:**

| | WebKit 26.5 | Chromium 151.0.7922.34 | Total |
|---|---|---|---|
| Tamaños | 14 | 11 | 25 |
| Celdas de la matriz | 308 | 242 | **550** (547 medidas, 3 sin medir) |
| Celdas con algún fallo | | | 115 (60 de ellas son «sin disposición» de §C.5) |
| Puntos de barrido de alto | 357 | 595 | 952 |
| Medidas de la barra con 15 «W» (G-1) | 6 | 12 | 18 |
| Errores de consola o de página | 0 | 0 | 0 |
| Sondas aparte | F-3 (14 pasos), F-5 (2 mesas × 3 estados), F-7 (4), F-6 (9 tamaños × 4 mesas) | | |

**Cierre de terreno** (comprobado a las 18:36):

- **Puertos:** nadie escucha en 4173, 4191, 4192, 4193, 4194, 5173 ni 5174. El 4173 no se usó.
- **Procesos:** ningún `node`, WebKit ni Playwright vivo. Los `chrome` que hay abiertos son de antes de la sesión (17:43–17:47) y no son del arnés.
- **Copias y uniones:** ninguna. Se compiló desde el propio árbol con la salida fuera del repo (`outDir` en el directorio temporal, `configLoader: 'native'`). El `dist/` y el `.vite-temp` del repo conservan su fecha de antes de la sesión (13-oct, 16:20).
- **Fuera del repo**, en el scratchpad de la sesión (`…\scratchpad\ios1f0\`): los guiones (`medida.mjs`, `sondas.mjs`, `tab.mjs`, `resumen.mjs`, `matriz.mjs`, `umbral*.mjs`), el `dist` compilado, cuatro carpetas de salida (JSON y 608 capturas) y los registros. Se puede borrar todo.
- **`git status --short`** (rama `main`, `92e2eeb`; sin `git add`, sin commits, sin stash):

```
?? docs/reportes/AJILEI_IOS-1_Fase0_Informe_v1.0.md
?? docs/reportes/AJILEI_MOT-1_Fase0_Informe_v1.0.md
?? docs/reportes/AJILEI_MOT-1_Fase1-0_Sonda_Informe_v1.0.md
?? docs/reportes/AJILEI_iOS_Sesion1_Lista_v1.0.md
?? laminas/mon1/_entorno.txt
?? laminas/mon1/lamina.html
?? laminas/mon1/tiempos.json
```

La única línea nueva es este informe; las otras seis ya estaban al empezar.

**STOP.** No se arregló nada ni se empezó ninguna sub-tanda. Quedan las seis decisiones de §D y las trece preguntas de §G.
