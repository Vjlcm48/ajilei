> Sustituido por v1.5 — 2026-11-03

# AJILEI — Configuración (el ⚙) · v1.4

- **Archivo:** `docs/AJILEI_Configuracion_v1.4.md`. Sustituye a `AJILEI_Configuracion_v1.3.md`, que se conserva como historia (y ésta a la v1.2, ésta a la v1.1 y ésta a la v1.0).
- **Versión:** 1.4 · **Fecha:** 2026-11-01 · **Nace en:** CFG-1, Fase 1a (v1.0); v1.1 en la Fase 1c; v1.2 en la Fase 1b; v1.3 en TIE-1, Fase 1a; v1.4 en la Fase 1d
- **Base:** `docs/reportes/AJILEI_CFG-1_Fase0_Informe_v1.0.md`, la lámina `laminas/cfg1a` (informe `docs/reportes/AJILEI_CFG-1_Fase1aL_Informe_v1.0.md`), las decisiones de Victor de la ficha de la 1a (§0), las de la ficha de la 1c (`AJILEI_CFG-1_Fase1c_v1.0.md` §0, con el Ajuste A de STOP-B1) y, para la v1.2, la lámina `laminas/cfg1b` (informe `docs/reportes/AJILEI_CFG-1_Fase1bL_Informe_v1.0.md`) con las decisiones de Victor de la ficha de la 1b (`AJILEI_CFG-1_Fase1b_v1.0.md` §0) y lo que el rector aprobó en sus tres paradas; para la v1.3, la lámina `laminas/tie1a` (V6, informe `docs/reportes/AJILEI_TIE-1_Fase1aL_Informe_v1.0.md`) y la ficha `AJILEI_TIE-1_Fase1a_v1.0` (§0 y §4); para la v1.4, la sonda `docs/reportes/AJILEI_CFG-1_Fase1d-0_Sonda_Informe_v1.0.md`, la lámina `laminas/cfg1d` (informe `docs/reportes/AJILEI_CFG-1_Fase1dL_Informe_v1.0.md`) y la ficha `AJILEI_CFG-1_Fase1d_v1.0.md` (§0), con lo resuelto en sus paradas.
- **Lo vigilan:** `diagDSK cfg` (veintiuna puertas, §6, §7, §8, §11, §12, §13 y §14), `diagDSK tienda` (tie.ojito, §6), `diagDSK rnk` (rnk-bandera, §12.5), `src/lib/lugarCore.test.js`, `src/lib/correoCore.test.js`, `src/lib/correoApi.test.js`, `src/dev/bancoImitado.test.js`, `scripts/testRnk1c.test.js`, `src/lib/saldoOculto.test.js`, `src/lib/cuentaApi.test.js`, `src/lib/limpiarAparato.test.js`, `src/lib/red.test.js`, `scripts/testClavesAlmacen.test.js`, `src/config/textos.test.js` y, en el servidor, `supabase/pruebas/cfg1c_verificacion.sql` y `supabase/pruebas/cfg1b_verificacion.sql` (`npm run guiones` antes del push).

En la casa se le llama «menú de configuraciones». Este documento dice qué hay en él, cómo se comporta y qué viene después.

**Qué cambia respecto de la v1.3** (CFG-1 1d):
1. §14, nuevo: el cambio de correo, con la plantilla y el espejo del panel (INV-78).
2. §12.1 y §12.7: la fila «Correo» deja de decir «Pronto» y abre el cambio.
3. §11.1: el aviso de «Eliminar cuenta» habla del correo con el que se creó la cuenta.
4. §9: la 1d sale de «Lo que viene» y la campaña CFG-1 queda sin nada pendiente de construir.

**Qué cambió de la v1.2 a la v1.3** (TIE-1 1a):
1. §2 y §13, nuevo: la fila «Tapetes» entre Sonido e Idioma, puerta de la tienda.
2. §6: el ojito tapa la cifra también en la tienda; la ventana de compra enseña el saldo siempre (INV-69, redactado de nuevo).
3. §1, §9 y §10: Tapetes sale del ⋮ (`AJILEI_Menu_Utilidades_v1.7.md`) y vive en el ⚙ y en la tienda; lo «comprado» en el aparato no se reconoce.

**Qué cambió de la v1.1 a la v1.2** (CFG-1 1b):
1. §2: la cabecera de la hoja es una puerta del perfil, con la bandera sin texto.
2. §7: el perfil y Rankings entran en el piso de 44, y se arreglan tres roces de zonas de Rankings.
3. §9: la 1b sale de «Lo que viene».
4. §12, nuevo: el perfil editable (la pantalla, las tres puertas, el nombre con su freno de 30 días, «De dónde eres» y dónde se ve el lugar).

**Qué cambió de la v1.0 a la v1.1** (CFG-1 1c): «Eliminar cuenta» viva (§2, §11); cerrar sesión reinicia la pantalla (§8, O-2).

---

## 1. El ⚙ y el ⋮

- **El ⚙** es el botón de la barra superior. Abre la hoja de configuración (`src/components/HojaConfiguracion.jsx`). Está en el lobby y en las seis pantallas de `.sal`: Retar, Armar mesa, Rankings, Salas, Sala de espera y PvP.
- **El ⋮** es «el menú de la mesa» (`src/components/UtilitiesMenu.jsx`). Solo existe dentro de la mesa. Se rige por `AJILEI_Menu_Utilidades_v1.7.md` (desde TIE-1 1a: Sonido, Reacciones, Partida rápida y Mano actual de pago).
- Son dos menús distintos y no se confunden (contradicción e, §10). Lo único que comparten es el estado del sonido (§3).

## 2. Lo que hay en la hoja tras TIE-1 1a

| Fila | Estado tras la 1c | Llega en |
|---|---|---|
| Cabecera: «Configuración», avatar, nombre y correo enmascarado | Fija; el correo con `enmascararCorreo` (`c•••@gmail.com`). **Desde la 1b es un botón con «›»** que cierra la hoja y abre el perfil (§12.2), y lleva la bandera **sin texto** detrás del nombre (§12.5) | 1b |
| Sonido | **Vivo.** Pastilla «Sí» / «No» | 1a |
| Tapetes | **Vivo.** El tapete y el tono en uso debajo, el disco y «›»; abre la tienda en Tapetes (§13) | TIE-1 1a |
| Idioma | «Español» + «Pronto» | IDI-1 |
| Enviar sugerencia | **Vivo.** Se despliega (§5) | 1a |
| Cerrar sesión | Vivo, como desde LOB-1 | — |
| Acerca de | **Vivo.** Primera línea: la versión (§4), luego los créditos | 1a |
| Eliminar cuenta | **Vivo.** En rojo (`lob-fila-peligro`); abre la ventana (§11) | 1c |

Las filas miden 44 px de alto como mínimo (§7). «Pronto» sale con el aviso de la hoja, por encima del velo.

## 3. Sonido: un solo estado

- Hay un solo estado de sonido, `SoundContext` (`src/context/SoundContext.jsx`), guardado en `ajilei.sound` (INV-68).
- La fila «Sonido» de la hoja y la entrada de sonido del ⋮ leen y cambian ese mismo estado.
- Si se apaga en la hoja, el ⋮ de la mesa sale con `is-off` y el icono atenuado. La regla vive en `src/styles/menuMovil.css` para la piel móvil y en `src/styles/hojaConfiguracion.css` §6 para la de escritorio.
- Si se enciende en el ⋮, la hoja dice «Sí».
- **El clic de la fila.** Es un `SoundButton`, que suena antes de su `onClick`.
  - Al apagar: el clic arranca y `Howler.mute` lo corta en el render siguiente.
  - Al encender: no suena, porque cuando se pidió todavía estaba apagado.
- Detalle anotado y no cambiado: `SoundContext.jsx:32` escribe `'on'` al montar si no había nada guardado.

## 4. La versión

- «Acerca de» empieza por `AJILEI {versión} · {commit}`, por ejemplo `AJILEI 0.9.0 · c0bc2c1`. El commit va en `<code>`, sin el vestido que `index.css` pone a todo `<code>`.
- **Dónde nace.** `vite.config.js` escribe dos globales con `define`:
  - `__APP_VERSION__`: la versión de `package.json` (0.9.0 desde la 1a);
  - `__APP_COMMIT__`: el commit.
- `src/config/version.js` las lee y cae a `'0.0.0'` y `'local'` si no existen.
- **La cadena del commit.** Se toma el primero que exista, cortado a 7 caracteres hexadecimales:
  1. `WORKERS_CI_COMMIT_SHA` (Workers Builds, que es como se compila ajilei.io);
  2. `CF_PAGES_COMMIT_SHA`;
  3. `git rev-parse --short=7 HEAD`;
  4. `local`.
- **El respaldo nunca rompe la compilación.** Compilar sin git da `local`. Lo que no parece un hash corto se descarta.

## 5. Enviar sugerencia

- Es contacto con soporte, no ayuda sobre una jugada (contradicción g, §10).
- La fila se despliega como «Acerca de» y enseña:
  - la dirección de soporte a la vista, seleccionable entera de un toque;
  - «Escribir correo»: un `mailto:` con el asunto `Sugerencia · AJILEI {versión}`. El cuerpo lleva jugador, versión y commit, aparato (`navigator.userAgent`), idioma y dos líneas en blanco;
  - «Copiar correo»: `src/lib/copiarTexto.js`, que usa `navigator.clipboard` y, si falla, `execCommand`. Al copiar sale el aviso «Copiado» por encima del velo. Si no pudo copiar, no lo dice.
- **El uuid no viaja nunca.**
- La dirección es una constante única, `CORREO_SOPORTE` en `src/config/soporte.js`. No está en el diccionario: una dirección no se traduce.
- Los dos botones miden 44 de alto y llevan `data-sin-pantalla-completa` (INV-45).

## 6. El ojito

- **INV-69, redactado de nuevo en TIE-1 1a:** el ojito tapa la cifra de la píldora **en el lobby y en la tienda**; en la ventana de compra de la tienda, «Tu saldo» y «Te quedarán» se ven **siempre**; la pila de la mesa, los rankings y el mini-perfil no lo obedecen.
- `BarraSuperior` lo pinta únicamente si recibe `onOjito`, y solo se la pasan `Lobby` y la tienda (por `PantallaChips`). En la tienda se destapa ahí mismo, como en el lobby, y lee y guarda la misma clave.
- No se pinta en Rankings, Retar, Salas, Armar mesa, la Sala de espera, PvP, la mesa ni el mini-perfil.
- Está entre la moneda y la cifra (lámina V1-C). Es un glifo de línea de 1,5 em, en el tono tenue de la cifra: **no es oro**. El único oro macizo de la barra es el «+».
- **Tapa la cifra siempre**, también mientras cuenta: con el aviso de saldo y con la celebración del video. La cifra sigue en su caja, invisible y con `aria-hidden`, y los puntos «••••» se pintan encima, centrados. Mientras la cifra de debajo cuenta, los puntos no se mueven.
- **La caja de la cifra mide 4,6 ch como mínimo**, abierta y tapada, en el lobby: el ancho de «2.500» en cifras tabulares. Así el ancho no delata los dígitos y la caja mide lo mismo abierta que tapada (O1).
  - Con 9 HC mide lo mismo que con 5.000.
  - Por encima de cuatro dígitos crece con la cifra, igual abierta que tapada.
- **Se recuerda en el aparato.** La clave es `ajilei.saldoOculto`, con `'si'` o `'no'`, por el accesor `src/lib/saldoOculto.js`. No viaja al servidor ni se borra al cerrar sesión.
- Para el arnés, la píldora lleva `data-saldo-oculto` mientras está tapada.
- **Su zona en la tienda.** Las reglas del piso de 44 del ojito valían solo bajo `.lobby`; desde TIE-1 1a valen también bajo la tienda (`:is(.lobby, :where(.sal[data-tienda]))` en `src/styles/tactilLobby.css`, con la misma especificidad: el lobby no se mueve). En la tienda el ojito medía 16×21 sin ellas.

## 7. El piso táctil de 44 y el camino Z

- **Dónde rige.** En el lobby y en la carcasa anclada (`.sal.es-anclada`: Retar, Salas, Armar mesa y Rankings).
  - La regla de los 44 viene de INV-07 y de la contradicción h (§10).
  - Las filas de la hoja y los botones de la sugerencia miden 44 visibles.
- **El camino Z.** Los tocables de la barra y de la cabecera ganan una zona invisible de 44 sin que cambie lo que se ve. Es un `::after` transparente con `inset: min(0px, calc(50% − 22px))`, en `src/styles/tactilLobby.css`.
  - Lo llevan el ⚙, el avatar, el «+», el ojito, la casa, la flecha, los chips, los ± y «Unirme».
  - Vale también con ratón: en escritorio los botones ya miden 44 y el pseudo vale 0.
- **Lo que hizo falta para que la zona fuera real, y no solo geométrica** (los cuatro arreglos de la lámina):
  1. **Capas.** `lob-top`, `lob-centro`, `sal-cab` y `sal-cuerpo` compartían `z-index: 1` y la fila siguiente se comía la zona. Ahora la barra va en 2 (lobby) o en 3 (carcasa) y la cabecera en 2.
  2. **La casa de la carcasa.** Era `static` y su zona se colgaba de un ancestro: 216×38 sobre la flecha. Ahora es `relative` con `inset: auto`.
  3. **La cifra tapada** no atrapa el toque (`pointer-events: none`).
  4. **El aviso de la hoja** va por encima del velo (§8).
- **El «+» del lobby va en `z-index: 1`.** Si no, la primera pepita de la ficha de la constancia le comía 1,4 px.
- **R-9.** Por debajo de 390 px de ancho, la zona de la casa y la de la flecha crece como mucho 2 px hacia arriba y el resto hacia abajo. En 360 se pisaban 3,7 px con las del ⚙ y el avatar.
- **La Sala de espera y PvP quedan fuera.** Es un hueco declarado (INV-07). Su velo y su diálogo de «Cancelar» viven dentro de `.sal-cuerpo`, y subir la barra los taparía. Se resuelve en MES-PvP.
- **v1.2 · el perfil y Rankings.** `cfg.zona` y `cfg.solape` miden también Rankings y la pantalla de perfil en sus cinco estados: las filas, el editor del nombre (solo su velo), la ventana de los 30 días, el selector y el selector buscando. Y otra vez Rankings y el perfil con un nombre de 15 «M» en 360×640, 412×915 y 915×412. Las filas del perfil y las opciones de la lista miden 44 visibles; «Cancelar» y «Cerrar» del Bautizo en edición ganan la zona de 44 por el camino Z (`src/styles/bautizo.css`); el «×» del buscador mide 44 y vive dentro del campo, en su relleno derecho (ese cruce es el diseño y la puerta no lo cuenta).
- **v1.2 · los tres roces de Rankings** (lámina 1b-L §6), en `src/styles/tactilLobby.css` §6, por el mismo camino y sin mover nada a la vista:
  - (a) ⚙ con casa en 915×412 (1,11 px en la lámina): ya no aparece en la app; lo vigila `cfg.solape` en Rankings.
  - (b) «+» con ⚙ con un nombre ancho en `.sal` (7,73 px en 360, 4,80 en 390, 2,64 en 412): la zona del ⚙ ya no crece hacia la izquierda (crece el doble hacia el borde de la pantalla) y la del «+» se corre 2 px a la izquierda, sobre su píldora. En el lobby no rozaba y no cambia.
  - (c) La casa y la flecha con la primera pestaña de Rankings, bajo 390 (0,89 px en 360): su zona sube −3,25 px (entre la barra y las pestañas quedan 44,75). Medido en 360, 375, 380 y 389.

**Las medidas** (`diagDSK cfg`, bundle real, 2026-10-29; caja → zona geométrica, barrido en cruz):

| Celda | ⚙ | avatar | «+» | ojito | casa / flecha | chips | ± | «Unirme» | solapes |
|---|---|---|---|---|---|---|---|---|---|
| 360×640 | 31,31 → 44 | 38,5 de alto → 44 | 18,36 → 43,98 | 18,36 → 43,98 | 31,31 → 44 (R-9) | 40 → 44 | 40 → 44 | 35,19 → 44 | 0 |
| 412×915 | 35,84 → 44 | 44,06 | 21 → 44 | 21 → 44 | 35,84 → 44 | 40 → 44 | 40 → 44 | 36,25 → 44 | 0 |
| 915×412 | 35,84 → 44 | 44,06 | 21 → 44 | 21 → 44 | 35,84 → 44 | 44 | 40 → 44 | 44 | 0 |
| 1366×768 | 52,19 | 64,19 | 30,59 → 44 | 30,59 → 44 | 52,19 | 44,39 | 42 → 44 | 44 | 0 |
| 1920×1080 | 52,19 | 64,19 | 30,59 → 44 | 30,59 → 44 | 52,19 | 57 | 42 → 44 | 52,8 | 0 |

- El 43,98 del «+» y del ojito en 360 es redondeo del subpíxel: su barrido efectivo da 45.
- **Zona sobre algo no tocable:** la del ojito pisa 8,5 px de la cifra en 360 (6,56 en 412) y la del «+», 5,63. Tocar el borde de la cifra tapa o destapa, o abre la hoja de monedas. La lámina lo midió y se aceptó.

## 8. La hoja en todas las pantallas

- **Una sola hoja.** El ⚙ de cada pantalla monta `HojaConfiguracion` como hija directa de su `main` (`.lobby` o `.sal`). Su estilo, `src/styles/hojaConfiguracion.css`, vale bajo `:is(.lobby, .sal)`.
- **Anclaje.**
  - Arriba: el ⚙ más 1,5 u.
  - Derecha: el relleno de la pantalla. `--cfg-pad` es `--lob-pad` en el lobby y `--pad` en `.sal`, incluido el «traje apretado» de 2,4 u.
  - Medido: borde derecho de la hoja − ⚙ = 0 y el mismo hueco ⚙→hoja que el lobby, en el lobby, Retar y Rankings, en las cinco celdas de `cfg`. Por ejemplo, 3,00 / 3,02 px en 1366×768 y 2,08 en 915×412.
  - La lámina V6 medía −6,61 y −4,53 px de desvío; ahora es 0.
- **Cabecera fija, cuerpo desplazable.** El título y la cuenta quedan quietos y se desplaza `.cfg-hoja-cuerpo`.
  - **Excepción, el apaisado bajo** (`orientation: landscape` y alto ≤ 520): se desplaza la hoja entera, cabecera incluida, como antes de la 1a.
  - El techo es el de siempre: `100dvh − 20 u`.
  - Al desplegar «Acerca de» o la sugerencia, el panel entra en la vista (`scrollIntoView`, `nearest`).
- **Alto medido.**
  - 360×640: 383,52 plegada y 526,03 con «Acerca de» abierto; termina en 575,34, dentro del tope de 584, y no se desplaza (medido en la 1b).
  - TIE-1 1a, con la fila «Tapetes» (+42,26): 425,78 plegada; con «Acerca de» abierto el contenido mide 568,29 contra su techo de 568 (`100dvh − 20 u`), así que el cuerpo desplaza 0,29 px (la cabecera, fija) y la hoja termina en 617,31. En 412×915, 1366×768 y 1920×1080 nada cambia de régimen.
- **Lo que se exige (TIE-1 1a, decisión del rector en el STOP-A3).** Tres principios, medidos por `cfg.hoja` en las cinco celdas: la hoja **cabe en su techo** (`100dvh − 20 u`), plegada y con «Acerca de» abierto; **cada fila mide 44 o más**; y **lo desplegado entra en la vista** aunque el cuerpo desplace. Se retira el tope literal de 584 en 360×640 (el fondo de la hoja en la lámina de CFG-1 1a): chocaba con la fila V6 de la lámina de TIE-1, y ganó la fila.
  - 1366×768 con «Acerca de» abierto: se desplaza el cuerpo, como hoy.
- **Foco.**
  - Al abrir, el foco entra en el título; al cerrar, vuelve al ⚙.
  - `Escape` cierra.
  - Cerrada, la hoja lleva `inert` y `aria-hidden`.
  - Mientras está abierta, `body.lobby-hoja-abierta`; se quita también si la pantalla se desmonta con la hoja abierta.
- **El aviso es de la hoja** (`.cfg-toast`, z 8 sobre el velo 6 y la hoja 7). El de las pantallas de `.sal` vive dentro de `.sal-cuerpo`, un contexto de apilamiento que queda por debajo del velo.
- **La Sala de espera.** La hoja va después de `.sal-cuerpo`: su velo y ella quedan por encima del cuerpo, y con él del velo y del diálogo de «Cancelar» de la sala. Al cerrar, la sala queda como estaba.
- **Cerrar sesión desde cualquier pantalla** sale a la Portada, igual que desde el lobby.
  - v1.1: la pantalla se reinicia. `App.cerrarSesion` deja `screen` en el lobby después del `signOut` (antes, el lobby asomaría mientras la salida viaja). Al volver a entrar se aterriza en el lobby, no donde se salió. Lo mide `cfg.salir.reinicia`.
  - Si se sale desde la Sala de espera, la mesa en espera queda a cargo del barrido del servidor (MES-PvP).
- **El stub de PvP en el apaisado bajo.** Su fila de barra se estira (`grid-template-rows: auto auto auto` con contenido corto, `salas.css:1270`), el ⚙ baja y la hoja lo pisa 28,89 px en 915×412. Es del stub y se va con MES-PvP. No se tocó (regla 6 de la ficha).

## 9. Lo que viene

- **1d** (hecha): el correo de la cuenta (§14).
- **1e** (hecha): el ⋮ adelgaza; salen «Cuenta» y «Saldo», entra «Partida rápida» y Mano actual se paga (`AJILEI_Menu_Utilidades_v1.6.md`).
- **1f** (hecha en TIE-1 1a): los tapetes en el ⚙, como puerta de la tienda (§13); «Tapetes» sale del ⋮ (`AJILEI_Menu_Utilidades_v1.7.md`).

## 10. Las contradicciones de la Fase 0 y qué gana

| | Contradicción | Gana |
|---|---|---|
| a | Dónde vive el ojito | Rankings §11 / Tienda §10: en la píldora del lobby y, desde TIE-1 1a, en la de la tienda (Tienda v1.2 §13.8). La entrada «Saldo» del ⋮ salió en la 1e |
| b | Los tapetes, en el ⋮ o en el ⚙ | Tienda §7: en el ⚙ (puerta) y en la tienda; salieron del ⋮ en TIE-1 1a |
| c | Con qué se compran los cosméticos | La Tienda: con HC |
| d | Lo «comprado» guardado en el aparato | Tienda §7: no se reconoce; desde TIE-1 1a lo comprado vive en el servidor (INV-76, Tienda v1.2 §13.6) |
| e | Qué es el «menú de configuraciones» | El ⚙ del lobby; el ⋮ es «el menú de la mesa» |
| f | Cómo se escribe la moneda | **HC** en texto corto y «Heptacoins» en frases |
| g | Qué es «Enviar sugerencia» | Contacto con soporte, no ayuda de jugada |
| h | 40 o 44 | Manda INV-07: 44 en todo. El disparador ⋮ ya cumple en táctil (45×44) y se deja |

## 11. Eliminar cuenta (v1.1)

### 11.1 La ventana
- La abre la fila «Eliminar cuenta» de la hoja, en las siete pantallas que la montan: `App` pone `eliminarCuenta` en el paquete `cuenta`, que todas pasan a la hoja.
- Es `src/components/EliminarCuenta.jsx`, **por portal en `<body>`** (el molde del mini-perfil), con su velo, en z 80: por encima de la hoja (7) y de su aviso (8). Mientras está abierta, `#root` es `inert`.
- Dice, en este orden: «Eliminar tu cuenta»; «Perderás tu saldo, tus puntos y tus compras.» · «**No se puede deshacer.**» · «Si vuelves a registrarte con el correo con el que creaste esta cuenta, empezarás de cero y sin bono.» (desde la 1d, porque la huella es la del correo original: §14.5); «Escribe ELIMINAR para confirmar.» y el campo; «Cancelar» y «Eliminar mi cuenta».
- **Confirmar es escribir.** «Eliminar mi cuenta» está apagado hasta que el campo diga la palabra (`lob.eliminar.palabra`) exactamente: sin espacios, comparada en mayúsculas («eliminar» vale). Intro también envía.
- **Sin oro y sin uuid.** El botón de borrar va relleno del rojo de `lob-fila-peligro` (`--loss-red`) con texto crema; el error, en `--lose-red`; el foco, anillo crema. La ventana no enseña el uuid (INV-67).
- **Se cierra** con ✕, tocando el velo o con `Escape`; la hoja se queda abierta y el foco vuelve a la fila. Mientras envía no se cierra.
- **Estados** (`data-elc-estado`): normal · enviando (los dos botones apagados; el de borrar dice «Eliminando» con los puntos del «Cargando» de BIE-1; el foco pasa a la ventana) · error (el texto bajo los botones; el campo se conserva). La ranura del error reserva su alto siempre (O1): una línea, o dos cuando el contenido mide menos de 23 em.
- **Tamaño (Ajuste A).** La letra escala como la de la hoja: la ventana trae el mismo `--u` (`clamp(3.2px, 1vmin, 6px)`) y los mismos factores (título 3,6; botones 3,4; aviso 3,3; lo menudo 3,1). El campo nunca baja de 16 px (Safari de iPhone acerca la página con menos). Ancho `min(100%, max(420px, 88u))`. Campo y botones ≥ 44 px. Cabe sin desplazarse en 360×640, 412×915, 915×412, 1366×768 y 1920×1080.

### 11.2 Qué contesta el servidor y qué hace el cliente
`src/lib/cuentaApi.js` llama a la Edge Function con `supabase.functions.invoke('eliminar_cuenta', { method: 'POST' })` y traduce a cuatro motivos cerrados; nunca lanza.

| Respuesta | Motivo | El cliente |
|---|---|---|
| 200 `{ ok: true }` | — | Limpia el aparato, cierra la sesión, Portada |
| 409 `{ motivo: 'mesa_abierta' }` | `mesa_abierta` | Cierra la ventana; aviso de la hoja «Cierra o abandona tu mesa primero»; sigue dentro |
| 401 | `sin_sesion` | **Igual que el ok** (Ajuste A): la sesión ya no vale en el servidor, casi siempre porque un borrado que pasó el tope ya se llevó la cuenta |
| sin respuesta en 20 s | `red` | En la ventana: «No se pudo eliminar la cuenta. Inténtalo de nuevo.» |
| cualquier otra cosa | `servidor` | Lo mismo |

- **El tope es de 20 s** (Ajuste A), no los 8 del resto del SDK. Se pide con la cabecera `x-ajilei-tope-ms` de `src/lib/red.js`, que es del cliente: `fetchConTope` la quita antes de mandar la petición, así que nunca sale ni pide CORS.
- **Lo que se limpia al salir** (`src/lib/limpiarAparato.js`): todas las claves `ajilei.*` de `localStorage`, recorriéndolas (sin lista fija), y `sessionStorage` entero. La sesión de Supabase la quita `signOut`, que sólo limpia el aparato (auth-js la borra aunque `/logout` conteste con error). Lo que no es `ajilei.*` se queda. **Cerrar sesión, sin borrar, no limpia** las preferencias del aparato.

### 11.3 La guarda y el borrado, en el servidor
- **La guarda** es `public.partida_abierta_de(uuid) returns text` (migración `20261030001500_cfg1c_eliminar_cuenta.sql`): `security definer`, `search_path` vacío, ejecutable **sólo** por `service_role`. Primero barre (`barrer_salas()`, doctrina de SAL-A); después devuelve `'mesa_ia'` si hay una fila abierta en `mesas_ia`, `'sala'` si es anfitrión o está sentado en una sala `esperando` o `activa`, y `null` si no.
- **La función** es `supabase/functions/eliminar_cuenta/index.ts`. Sólo POST. El uid sale del token (`GET /auth/v1/user` con la llave pública), nunca del cuerpo. Con la llave de servicio llama a la guarda y, si es `null`, a `auth.admin.deleteUser(uid)`. Ningún DELETE ni `raise` sobre ninguna tabla. Los errores van al log de la función, nunca a la respuesta. CORS: ajilei.io, localhost, la red de casa y los túneles de `trycloudflare.com`.
- **Se despliega con `--no-verify-jwt`** (y `verify_jwt = false` en `supabase/config.toml`): con las llaves nuevas la puerta del gateway no sirve, y la función verifica el token ella misma.
- **La cascada.** `deleteUser` borra la fila de `auth.users`; todo lo demás cuelga de ella (Fase 0 §H-2): perfil, billetera, libro de movimientos, intentos, mesas, salas (y con la sala de un anfitrión, los asientos de los demás), constancia, boletos, libro de puntos y total. Los cuatro libros rechazan un DELETE que no llegue en cascada: borrar tabla por tabla falla, y así debe ser (INV-71).
- **La huella queda.** `bonos_bienvenida` no tiene clave foránea: la fila del correo sobrevive. Quien vuelva con el mismo correo, o con un alias que tenga la misma huella (`+algo`, puntos en gmail), empieza con 0 HC, sin bono y sin puntos, y elige nombre de nuevo.

## 12. El perfil editable (v1.2)

### 12.1 La pantalla
- Es `src/screens/Perfil.jsx`, `screen === 'perfil'` en `App`, con la carcasa de siempre (`PantallaChips`, familia `.sal`: barra, ⚙, flecha y casa). Su hoja es `src/styles/perfil.css`, aditiva, sin `!important` ni hex.
- **Lo elegido por Victor** (ficha 1b §0): V1-A, filas que abren su editor; V3-A; banderas V7-A; la fila «Correo» con «Pronto» (la encendió la 1d); el avatar sin columna todavía.
- Arriba, la cabecera: el círculo grande con la inicial (la caja de AVA-1), el nombre y el lugar (bandera y texto; sin país, el isotipo en tenue).
- Las filas (44 visibles, las de la hoja ⚙):
  - **Avatar**: la rejilla de AVA-1 (celdas de 64 px como mínimo); la primera es la inicial de hoy, marcada con el contorno de oro de los chips (contorno, no macizo: INV-08); las demás, huecos; «Avatares en la tienda · Pronto».
  - **Nombre de usuario**: el nombre y, con el freno puesto, «Próximo cambio: 28 de noviembre» debajo. Abre el editor (§12.3).
  - **De dónde eres**: la bandera y «Venezuela · Zulia», o «Sin elegir» en tenue. Abre el selector (§12.4).
  - **Correo**: enmascarado y con «›»; abre el cambio de correo (§14). Con un cambio pendiente, dos líneas: «Pendiente: n•••@gmail.com» y «Revisa tus dos correos».
- En la banda de dos columnas de `salas.css` (≥ 900 × ≤ 830: 915×412, 1366×768) la cabecera va a la izquierda y las filas a la derecha.
- **La flecha** deshace un paso (el selector vuelve a las filas; los estados, a la lista de países si se llegó eligiendo Venezuela) y desde las filas vuelve a la **pantalla de origen**; **la casa** va al lobby. Desde el propio perfil, el avatar de la barra no hace nada.
- Los textos son `perfil.*` en el diccionario. Los nombres de país no: vienen de CLDR (§12.4).

### 12.2 Las tres puertas
- **El avatar de la barra**, en el lobby y en las pantallas de `.sal` (Retar, Armar mesa, Rankings, Salas, Sala de espera y PvP). Hasta la 1b decía «Pronto».
- **La cabecera de la hoja ⚙**, un `<button>` con «›» de 44 como mínimo: cierra la hoja y abre el perfil. Su geometría es la de la 1a: en 360×640 con «Acerca de» abierto la hoja sigue terminando en 573,61.
- **«Editar» del mini-perfil propio**, encendido y sin «Pronto», desde Rankings. **Desde la victoria no hay «Editar»**: dentro de la mesa no se va al perfil, y la tarjeta de la victoria no lo pinta (más baja que la de Rankings; `diagCEL0 celebracion` las compara con «Editar» escondido).
- `App` las cablea con `cuenta.abrirPerfil`, que recuerda la pantalla de origen (`desdePerfil`). Desde la mesa no hay puerta: `GameTable` no lo usa.
- Lo mide `cfg.perfil` (412×915 y 1366×768): la barra desde el lobby, Retar y Salas; la cabecera desde el lobby y desde Rankings; «Editar» desde Rankings (y el ajeno sin «Editar»); la flecha vuelve a cada origen y la casa, al lobby.

### 12.3 El nombre y su freno de 30 días
- **El editor es el Bautizo real en modo edición** (`src/screens/Bautizo.jsx`), el mismo que abría «Cambiar nombre» desde el ⋮ de la mesa hasta la 1e (que retiró «Cuenta» del ⋮), así que el nombre tiene unas solas reglas. **La puerta de entrada** (el Bautizo de la cuenta nueva) no cambia ni de aspecto ni de comportamiento (comparada byte a byte en la 1b-ii).
- **El freno vive en el servidor** (INV-72). Un nombre de verdad nuevo se puede poner una vez cada 30 días; la fecha la da el servidor y el cliente solo la formatea en la zona del aparato («28 de noviembre», `Intl.DateTimeFormat('es', { day: 'numeric', month: 'long' })`).
- **El orden al confirmar:**
  1. Solo cambian mayúsculas («devlocal» → «DevLocal»): se guarda sin ventana y **no gasta el freno**.
  2. Un nombre nuevo pregunta primero a `nombre_libre`. Si dice que sí (o no se sabe), sale la ventana «¿Cambiar tu nombre a {nombre}?» · «Después de este cambio no podrás cambiar tu nombre durante 30 días.» · «Cancelar» / «Cambiar» (la familia de «Eliminar cuenta», sin el rojo, encima del velo del Bautizo). Solo «Cambiar» envía.
  3. **Si `nombre_libre` dice que no, se envía sin ventana** (decisión consciente, D-11 de la 1b): el servidor contesta 23505 («Ese nombre ya está tomado») o P0001 («Ese nombre no está permitido — prueba otro») y la ranura lo dice con su texto; el freno no se gasta porque el cambio no entra. **Riesgo aceptado:** si el nombre se libera justo entre las dos llamadas, el cambio entraría sin el aviso.
  4. Si el servidor frena (AJ030, con la fecha en el `hint`), el editor pasa al estado bloqueado con esa fecha.
- **Bloqueado** (`bloqueadoHasta`): el campo se queda quieto con el nombre, la ranura dice «Podrás cambiarlo de nuevo el {fecha}.», «Confirmar» apagado y «Cancelar» pasa a «Cerrar». **También para un cambio solo de mayúsculas** (decisión consciente, D-15 de la 1b): el servidor lo dejaría pasar, pero la pantalla bloqueada no lo ofrece. Con el freno puesto no viaja nada.
- **Lo del modo edición, y solo de él:** Intro confirma (`enterKeyHint="go"`); la tarjeta es opaca (`--surface-modal`) y de ancho fijo (no cambia con el largo del aviso; en el teléfono la ranura reserva dos líneas); en el teléfono va **arriba** (con el teclado de Chrome por defecto, que no encoge la vista, «Confirmar» quedaba bajo el teclado en 360×640); «Cancelar» y «Cerrar» con zona de 44 (camino Z); el rótulo del campo dice «Nombre de usuario», como la fila.
- Tras un cambio, el toast «Listo: ahora eres {nombre}» y la fila con «Próximo cambio».
- Lo mide `cfg.freno` (360×640 y 1366×768, con el banco imitado): ocupado y vedado sin ventana; solo mayúsculas sin ventana y sin freno; libre con ventana, un solo viaje, la fecha en la fila, el toast y la barra; bloqueado quieto, con la fecha y sin viaje; y el AJ030 del servidor aunque el cliente no supiera del freno.

### 12.4 «De dónde eres»
- **Un país o ninguno** (INV-74). Al elegir, se guarda solo, con el toast «Guardado».
- **El selector** (V3-A): el buscador fijo arriba, «Prefiero no decirlo» (deja el país vacío), «Donde más estamos» (Venezuela, Estados Unidos, Colombia, España, Chile, Perú, Ecuador, Argentina, Panamá y México) y «Todos los países». La lista desplaza por dentro; la elegida lleva el contorno de oro y un ✓ crema.
- **Al elegir Venezuela** se guarda ya, con el estado vacío, y sale enseguida la lista de estados con «Sin estado» arriba y marcado. Al elegir otro país, el estado va nulo en el mismo `update` (si no, el CHECK lo rechaza).
- **La búsqueda** (`src/lib/lugarCore.js`): sin tildes, sin mayúsculas ni puntuación; cada palabra escrita tiene que ser comienzo de una palabra del nombre (o lo escrito, sin espacios, comienzo del nombre): «peru» encuentra Perú, «us» no encuentra Rusia. Busca por el nombre en español, el inglés y los alias («EEUU», «usa», «Holanda», «Curaçao»…). Sin resultado: «No encontramos ese país». El «×» nativo se esconde y sale uno propio de 44.
- **Los países** son 243: los 249 de ISO 3166-1 menos los seis sin población (Antártida, Bouvet, Heard y McDonald, las menores alejadas de EE. UU., los Australes Franceses y Georgia del Sur); Kosovo fuera. Nombres de CLDR en español, congelados en `src/config/paises.js` por `scripts/gen-paises.mjs`, con cinco arreglos (Hong Kong, Macao, Costa de Marfil, Palestina y Timor Oriental).
- **Los estados de Venezuela** son 24, los 23 y el Distrito Capital (`src/config/estados.js`). «La Guaira» se busca también como «Vargas». Fuera, Dependencias Federales y Guayana Esequiba. Los códigos de tres letras son contrato con la base.
- **Las banderas** (INV-73): rectangulares 3:2 de `country-flag-icons` 1.6.20 (MIT), copiadas una vez a `public/banderas/3x2/` (243 archivos, 159 KB) con su `LICENSE`; no es dependencia de `package.json`. Se pintan con `<img>` (`src/components/Bandera.jsx`, `src/styles/bandera.css`): una petición por bandera, solo la que se pinta, `lazy` en las listas; nunca emoji. Sin país, el isotipo de AJILEI en tenue en la misma caja.

### 12.5 Dónde se ve el lugar
- **El perfil**: la cabecera y la fila.
- **El mini-perfil**, propio y ajeno: la pastilla «País y estado» pasa de rayada a lisa con la bandera y el texto (cede con «…»); sin país, el isotipo en tenue y sin filete. La misma caja de 28 de alto; mientras carga, el hueco rayado.
- **Rankings**, en las dos pestañas: la **fila de dos líneas**, el nombre (· tú) arriba y la bandera y el lugar en tenue abajo; la fila sigue midiendo 56. La banda «Tu posición» lleva el de la cuenta.
- **La hoja ⚙**: la bandera **sin texto** detrás del nombre (con texto pasaría el tope de 360×640 con «Acerca de» abierto).
- **La barra del lobby: sin bandera** (no cabe).
- Lo mide `diagDSK rnk` (rnk-bandera: las filas de la vista con su bandera cargada y su texto, la segunda línea sin crecer la fila, y la tarjeta de la fila 3) y `cfg.freno` (la cabecera y la hoja tras elegir).

### 12.6 En el servidor
- Migración `20261030013000_cfg1b_perfil.sql`: `profiles` gana `pais` (`^[A-Z]{2}$` o nulo), `estado` (solo con `VE` y de la lista) y `nombre_cambiado_en` (lo escribe solo el disparador del freno).
- **El freno** es `profiles_freno_nombre()` (`BEFORE INSERT OR UPDATE`, antes que el portero de vedados): en el alta la columna nace nula; nadie la escribe a mano; solo mayúsculas pasa sin tocarla; un cambio antes de 30 días se rechaza con `nombre_frenado`, errcode `AJ030` y la fecha (ISO, UTC) en el `hint`.
- `nombre_libre(text)` y `mi_proximo_cambio()` son para el cliente (`authenticated`). Los vedados viven en `username_vedado(text)`, que llaman el portero y `nombre_libre`.
- El cliente actualiza solo `username`, `pais` y `estado` (grant por columnas).
- `mini_perfil` y `ranking_top` devuelven `pais` y `estado` (INV-67: 17 columnas, ninguna uuid ni correo).
- Lo verifica `supabase/pruebas/cfg1b_verificacion.sql` (18 filas), en el corredor antes del push y en el SQL Editor después.

### 12.7 Lo que no está todavía
- **El avatar**: la rejilla está; las imágenes llegan con AVA-1.
- **Pendiente de higiene (O-1 de la 1b):** la política de lectura de `profiles` de SUP-2a (`using (true)`) deja que cualquier jugador con sesión lea el `nombre_cambiado_en` de otro. Se cierra con un `grant select` por columnas; el cliente ya no lo necesita (lee su fecha con `mi_proximo_cambio()`).

## 13. La fila «Tapetes» (v1.3, TIE-1 1a)

- **Dónde.** Entre Sonido e Idioma (V6 de la lámina `laminas/tie1a`), en las siete pantallas que montan la hoja.
- **Qué dice.** «Tapetes» y, debajo, el tapete en uso con su tono: «{nombre} · {tono}» (`tie.cfg.valor`, el tono en minúscula: «Negro grafito · claro») o solo el nombre si no tiene tonos («Verde clásico»). A la derecha, el **disco** de 20 px —la misma `.vit` que la vitrina y la mesa, tamaño `disco` (`src/components/Vitrina.jsx`), así que pinta el fieltro en uso con sus tokens— y el «›».
- **De dónde lo saca.** Del canal de los tapetes (`src/lib/controlTapetes.js`), el mismo que leen la tienda y la mesa: `App` lo pone en el paquete `cuenta` (`cuenta.tapetes`). Lo que esté en uso lo dice el servidor (INV-77); mientras contesta, la copia del aparato.
- **Qué hace.** `.lob-fila` de 44 como las demás (lo mide `cfg.hoja`). Tocarla cierra la hoja y abre la tienda en el estante Tapetes (`cuenta.abrirTapetes`); desde la propia tienda, vuelve a montarla en Tapetes. Sin la puerta (nadie monta la hoja así hoy), dice «Pronto».
- **Lo vigila** `diagDSK cfg` (cfg.tapetes): el orden Sonido → Tapetes → Idioma, el disco de 20 dentro de la fila, «Verde clásico» con el banco vacío y «Negro grafito · claro» con el inventario sembrado (el disco en grafito claro), y la puerta a la tienda en 360×640 y 1366×768.

## 14. El cambio de correo (v1.4, CFG-1 1d)

### 14.1 De dónde sale el correo (INV-78)
- **El correo propio se lee solo de la sesión** (`sesion.user.email` en `src/hooks/useAuth.js`, y `getUser()` en `correoApi.estado`), nunca de `profiles`, que no tiene esa columna.
- Lo pide `supabase.auth.updateUser({ email })`, con «Secure email change» encendido: hacen falta los dos códigos.
- **No hay migración** ni se escribe nada en `profiles`, ni en `bonos_bienvenida`, ni en `eliminar_cuenta`.

### 14.2 La fila y la tarjeta
- **Enmascarado en la fila, completo en la tarjeta** (Decisión 2 del STOP-0). El aviso final también lo enseña completo («Listo: desde ahora entras con …»), igual que el mini-perfil propio («solo tú lo ves», Rankings). La hoja ⚙ lo enmascara.
- **La tarjeta** es `src/components/CambiarCorreo.jsx` con `src/styles/correo.css`: por portal en `<body>`, sobre el molde del Bautizo en edición, arriba en el teléfono. Tiene dos pasos en la misma tarjeta: el editor y los códigos (V3-A de la lámina). Con un cambio pendiente abre en los códigos.
- **Sin «Cancelar» un cambio** (Decisión 1 del STOP-0), porque el servidor no le da esa llamada al cliente:
  - la tarjeta dice «Si no confirmas en 10 minutos, el cambio se anula solo»;
  - «Cerrar» solo cierra y el «Pendiente» sigue;
  - «Reenviar» manda dos códigos nuevos y vacía los campos, con la espera a la vista;
  - «Usar otro correo» vuelve al editor. Antes de los 60 s dice «Continuar en N s», porque pedir antes es un 429 seguro.
- **El «Pendiente» se apaga solo** al pasar `email_change_sent_at + OTP_EXP_S`, aunque `new_email` siga en el servidor, donde nunca vence (`src/hooks/useCambioCorreo.js`, `estadoFila` en `src/lib/correoCore.js`).
- **Los campos de código no llevan `maxLength`:** el navegador cortaría lo pegado antes del filtro, y «123 456» se quedaría en cinco dígitos.
- Zonas de 44 sin solapes y cinco tamaños medidos (§14.6). Los textos son `perfil.correo.*` en el diccionario.

### 14.3 La API
`src/lib/correoApi.js` nunca lanza y toda llamada devuelve un motivo cerrado (`MOTIVOS` de `src/lib/correoCore.js`: ok, pendiente, invalido, mismo, en_uso, codigo_mal, codigo_vencido, limite, red, desconocido).

| Llamada | Qué hace |
|---|---|
| `estado()` | `getUser`: el correo, si hay algo pendiente, y la hora del envío |
| `pedirCambio(nuevo)` | No válido y el mismo se rechazan sin viajar. `updateUser`; `email_exists` es «Ese correo ya tiene una cuenta» |
| `confirmar(actual, nuevo)` | Manda **siempre** los dos códigos, con `verifyOtp({ email, token, type: 'email_change' })`, cada uno con el correo de quien lo recibió. **El éxito es que vuelva una sesión.** Si fallan los dos, los prueba cruzados una vez. Recuerda lo aceptado en ese envío |
| `reenviar()` | `resend({ type: 'email_change', email })`, **siempre con el correo actual**: con el nuevo contesta 200 y no manda nada |

Vencido e incorrecto son el mismo 403 del servidor. Se separan con `OTP_EXP_S`.

### 14.4 El panel de Supabase: lo que el repo no guarda
La plantilla y estos ajustes viven **solo en el panel** (no hay `supabase/templates/`). Esto es su espejo, leído por Victor en el STOP-0 de 2026-11-01. **Si se cambia el panel, se cambia aquí.**

| Ajuste (Auth) | Valor | Quién depende de él |
|---|---|---|
| Secure email change | Encendido | Toda la §14 |
| Email OTP expiration | 600 s | `OTP_EXP_S` y «10 minutos» en el texto de la tarjeta y de la plantilla |
| Email OTP length | 6 | Los campos de código |
| Intervalo mínimo entre envíos | 60 s | `INTERVALO_ENVIO_S`: «Reenviar» y «Continuar en N s» |
| Emails por hora | 30 | Cae en «Demasiados intentos» |
| Verificaciones | 30 cada 5 min por IP | Cae en «Demasiados intentos» |
| Aviso «Email address changed» | Apagado | Si se enciende, sale con su propia plantilla |

**La plantilla «Change email address»** es una sola para los dos destinatarios: el servidor la manda dos veces y solo cambia `{{ .Token }}`. No usa `{{ .SendingTo }}`, que está en el fuente de GoTrue pero no en su guía.

- **Asunto:** `Tu código para cambiar de correo en AJILEI`
- **Cuerpo:**

```html
<div style="font-family: Arial, Helvetica, sans-serif; color: #1f2a24; max-width: 480px; margin: 0 auto;">
  <h2 style="font-size: 20px; margin: 0 0 16px;">Cambiar el correo de tu cuenta de AJILEI</h2>
  <p style="margin: 0 0 12px;">Se pidió cambiar el correo de esta cuenta:</p>
  <p style="margin: 0 0 16px;"><strong>De:</strong> {{ .Email }}<br><strong>A:</strong> {{ .NewEmail }}</p>
  <p style="margin: 0 0 4px;">Tu código para este correo es:</p>
  <p style="font-size: 32px; font-weight: 700; letter-spacing: 4px; margin: 0 0 16px;">{{ .Token }}</p>
  <p style="margin: 0 0 12px;">Al otro correo le llega un código distinto. Escribe los dos en AJILEI, en la pantalla donde pediste el cambio. Vencen en 10 minutos.</p>
  <p style="font-size: 13px; color: #5b665f; margin: 0;">¿No fuiste tú? No hagas nada: sin los dos códigos, el correo no cambia.</p>
</div>
```

**El orden al publicar:** primero la plantilla y después el cliente. Con la de fábrica llegan enlaces y no códigos, y la tarjeta pediría algo que nadie recibió. Al revés no hay problema: el cliente en producción sin esta tanda no llega a pedir el cambio.

### 14.5 La huella del bono no se mueve
- **`bonos_bienvenida` se escribe al crear el perfil y no vuelve a tocarse.** Las migraciones no ponen ningún disparador en `auth.users`.
- **Cambiar el correo no da bono ni lo quita.** Quien cambia de `a@` a `b@` conserva su billetera; la huella de `a@` sigue ahí, y la de `b@` no se crea.
- **La cota sigue siendo un bono por dirección canónica.** Si esa cuenta se borra y alguien entra con `b@`, cobra el bono de `b@`, igual que si la hubiera usado desde el principio: cambiar de correo no da más bonos que tener otra dirección.
- **Volver con el correo original** es empezar de cero y sin bono, y por eso cambió el aviso de §11.1.

### 14.6 Lo vigila, y lo que no
- **`diagDSK cfg` (cfg.correo):** el bundle real con el SDK de Auth real y el servidor imitado por `/auth/v1/*` (`bancoImitado`), en 360×640, 412×915, 915×412, 1366×768 y 1920×1080.
- **Pruebas:** `src/lib/correoCore.test.js`, `src/lib/correoApi.test.js` y `src/dev/bancoImitado.test.js`.
- **Bypass:** `?cfg=correo-normal`, `correo-pendiente`, `correo-en-uso`, `correo-codigo-mal` y `correo-limite`; códigos `111111` (actual) y `222222` (nuevo).
- **Límite declarado:** el GoTrue de verdad y la plantilla solo se prueban a mano, con una cuenta desechable (ficha 1d §5, Prueba C). El arnés estima el teclado: el real se mira en el S25 (Prueba B).
- **Aceptado en el STOP-L:** con dos direcciones de 60 caracteres en 360×640 y teclado, a «Confirmar» le quedan 0,6 px de holgura (con direcciones normales, 32,5); y acostado con teclado queda tapado, pero la tecla «ir» confirma.
