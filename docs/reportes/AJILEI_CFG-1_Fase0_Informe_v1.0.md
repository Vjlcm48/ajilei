# AJILEI · CFG-1 · Fase 0 · Informe · v1.0

**Escrito para:** el rector y Victor
**Campaña:** CFG-1 · el ⚙ del lobby y el ⋮ de la mesa, completos y activos
**Base:** `main` en `c0bc2c1`. Solo lectura. Este archivo es lo único que se escribió en el repo.
**Fecha:** 2026-10-29 · **Ejecutor:** Claude Code

Cómo se midió:
- Las medidas de tocables (F-1) se tomaron con una sonda de un solo uso guardada fuera del repo, en el scratchpad.
- Se usó el `dist/` recién compilado, servido con `vite preview` en el puerto **4191** (el 4173 es el del túnel de Victor).
- La sesión fue la simulada del arnés (`contextoCap`) y el navegador, el Chromium sellado (`channel: 'chromium'`).
- La zona táctil se mide por barrido en cruz con `elementFromPoint`, la misma vara que `__hitBox` de `diagDSK tactil`.
- La lectura de código se repartió en cinco frentes. Los datos que sostienen riesgos o recomendaciones se volvieron a comprobar a mano. Esos datos son: los seis protegidos, `commitNewHand`, la huella del bono, la política UPDATE de `profiles`, la cascada de `salas`, el SVG de Cuenta y la altura del panel ⋮.

---

## 1 · Resumen en diez líneas

1. **El ⚙ del lobby no es `UtilitiesMenu`.** Es una hoja escrita dentro de `src/screens/Lobby.jsx:283-368`. `UtilitiesMenu`, `TapetesPanel`, `CuentaPanel`, `useTapetes` y `menuEntradas` son todos del **⋮ de la mesa**.
2. **Qué funciona hoy del ⚙:** solo «Cerrar sesión» y «Acerca de». Sonido, Idioma, Enviar sugerencia y Eliminar cuenta dicen «Pronto». La cabecera no reacciona al toque.
3. **En las demás pantallas** (Retar, Salas, Armar mesa, Sala de espera, PvP y Rankings) el ⚙ solo dice «Pronto».
4. **Hoy no hay tapetes en el ⚙.** Su única puerta es el ⋮ de la mesa. Los «63×35» del encargo no son botones de compra: son la **zona táctil de la fila «Tapetes» del ⋮**. La recorta el SVG de «Cuenta», que no tiene tamaño. Es el hueco declarado en INV-07.
5. **La «figurita» del ⋮ es la entrada «Cuenta».** Hoy es la **única puerta para cambiar el nombre**, porque abre el Bautizo en modo edición. Si sale del ⋮ antes de que exista el perfil editable (1b), el nombre se queda sin puerta.
6. **El sonido tiene un solo estado** (`ajilei.sound`) y una sola puerta viva, el ⋮. Que la fila del ⚙ funcione es enchufarla al mismo contexto.
7. **Versión:** no existe ninguna. `package.json` está en `0.0.0`, no hay `define` y no hay commit en el código. El despliegue es Cloudflare **Workers con static assets** (`wrangler.jsonc`). Desde el repo no se puede saber si la compilación ve el SHA.
8. **Base de datos:**
   - `profiles` solo tiene `id`, `username`, `created_at` y `updated_at`. No hay avatar, ni país, ni fecha del último cambio de nombre.
   - La RLS deja al cliente actualizar **cualquier columna** de su fila. Por eso el freno de 30 días tiene que vivir en el servidor.
   - No hay inventario ni compras. El tipo de movimiento `compra` existe y nadie lo usa.
9. **Borrado de cuenta:**
   - Todo cuelga de `profiles` con `on delete cascade`.
   - La huella del bono (`bonos_bienvenida.correo_hash`) no tiene FK **a propósito** y está probado que sobrevive.
   - Los libros solo aceptan el DELETE que llega por la cascada. Una función que borre tabla por tabla **falla**.
10. **Riesgos mayores:**
    - Leer «Partida rápida» en vivo alteraría el DEAL_3 de la mano en curso.
    - El barajado (1,95 s) vive en `gameTable.css`, que está protegido.
    - El orden de las sub-tandas importa: 1e no puede ir antes de 1b ni de 1f.
    - **Los protegidos son seis, no cinco.**

---

## 2 · Documentos → lo que dicen → si el código lo cumple hoy

**Versiones más nuevas.** El encargo cita algunas versiones que ya no son las últimas:

| Familia | Más nueva | Nota |
|---|---|---|
| Menu_Utilidades | **v1.5** | El encargo cita la v1.2 |
| Tapetes | **v1.2** | |
| Tienda | **v1.1** | |
| ECO-1 Reglas | **v1.3** | |
| Rankings | v1.2 | |
| Invariantes | v1.0 | Actualizada hasta RNK-1 1e |
| Protegidos | archivo v1.0 | La lista va por la v1.8 |
| PAN-1 | — | No tiene normativo propio. Su regla vive en INV-07, INV-45, `Sistema_Diseno_v1.2` §14 y `pantallaCompletaCore.js:1-35` |

Qué añadió cada versión del Menú desde la v1.2:
- **v1.3:** «Mano actual» funciona (una consulta por mano, `ajilei.consultas`).
- **v1.4:** la burbuja de reacción pasa a dos pisos, SVG y AVIF.
- **v1.5:** el ⋮ llega al móvil, sustituye a la bocina y nacen los satélites (D6).

| Documento · sección | Qué dice | ¿Lo cumple hoy? |
|---|---|---|
| Menu v1.1 §1.2 | El ⋮ ocupa la caja de la bocina y Sonido es la primera entrada | **Sí.** `UtilitiesMenu.jsx:80-93`, `:178-187` |
| Menu v1.5 §1 | Vivas en móvil: Sonido · Reacciones · Tapetes · Mano actual | **No.** Hay además «Cuenta» (`menuEntradas.js:62-64`), que no figura en ninguna versión del Menú (viene de SUP-2b §1.5). En móvil horizontal no se monta (`:94-96`) |
| Menu v1.5 §7.3 | Panel de 64×244 | Solo en móvil horizontal. Con 6 filas es 288 (`useUtilitiesMenu.js:46`, `:97`) |
| Menu v1.1 §9f | Sonido persistente en `ajilei.sound`, silencio real | **Sí.** `SoundContext.jsx:15`, `:31-35` |
| Menu v1.1 §9f | La entrada refleja el estado con `is-off` | **A medias.** La clase se pone (`UtilitiesMenu.jsx:181`), pero no hay ninguna regla CSS para ella |
| Menu v1.1 §4 | «Saldo: visible/oculto» enmascara la cifra **en la mesa** | **No implementado.** La entrada sigue inerte (`UtilitiesMenu.jsx:101-103`). Lo contradicen Rankings §11 y Tienda §10 (ver la tabla de abajo) |
| INV-07 (44 en el lobby y el menú) | Zona táctil ≥ 44 | **No**, en varios sitios (ver F-1): ⚙, «+», casa, flecha, avatar en 360, chips y ± a 40, «Unirme» a 35, filas «Acerca de» y «Cerrar sesión» a 40,45, y Tapetes del ⋮ a 63×35 |
| Tapetes v1.0 §1 · Tienda v1.1 §7 | Precios: 0 · 10.000 · 15.000 · 25.000 · 50.000 | **Sí.** `config/tapetes.js:33-71` |
| Tapetes v1.0 §5 · INV-12 | Claves `ajilei.tapete` y `ajilei.tapetes.comprados` | **Sí.** `tapetes.js:87-88` |
| Tapetes v1.0 §4 | «¿Comprar X por N **fichas**?» | **Difiere.** El código dice «Heptacoins» (`TapetesPanel.jsx:115`) |
| Tapetes v1.0 §5 | Propiedad y descuento nacen juntos cuando la economía esté en Supabase | **No.** ECO-1 ya está en Supabase y comprar sigue sin cobrar (`tapetesCore.js:55-63`) |
| Tapetes v1.2 §1 | `data-tapete` en `body`, también en móvil | **Sí.** `useTapetes.js:124-128`, sin gate (`GameTable.jsx:606`) |
| Tienda v1.1 §7 | No se compran tapetes a mitad de partida; la entrada sale del ⋮ | **No.** Tapetes sigue vivo en el ⋮ y la compra no mira la fase |
| Tienda v1.1 §7 | Los «comprados» antes de la tienda no cuentan | No se puede comprobar todavía: no hay tienda |
| Rankings v1.2 §11 · Tienda v1.1 §10-11 | «Ocultar saldo» = un ojito en la píldora del lobby; nunca en la pila, ni en los rankings, ni en el mini-perfil | **No existe** (grep vacío). Que Rankings lo ignore se cumple de forma trivial |
| Rankings v1.2 §7.3 | Tarjeta propia con correo y «Editar» apagado; hueco para país y estado | **Sí.** `MiniPerfil.jsx:138-139`, `:152-165` |
| INV-67 | Ni uuid ni correo ajeno; solo `ranking_top`, `ranking_mio` y `mini_perfil` | **Sí.** `rankingApi.js:115-131`; la RPC no devuelve uuid ni correo (`rnk1a:660-661`) |
| INV-12 | Solo claves censadas | **Sí**, pero la fila del documento se quedó vieja: dice «12 claves, 8 accesores» y la prueba censa **15 y 11** (`testClavesAlmacen.test.js:19-50`) |
| INV-45 · PAN-1 | `data-sin-pantalla-completa` en todo lo que copia, comparte o abre otra app | **A medias.** Solo lo llevan `SalaEspera.jsx:531` y `:541`. Les falta a «Ver en Google Play» (`IntersticialSumaMente.jsx:200`), a la línea de SumaMente de Rankings (`Rankings.jsx:271-272`) y al enlace de créditos (`Lobby.jsx:352`, `target="_blank"`) |
| ECO-1 v1.3 §3 | Bono una vez por correo canónico; la huella sobrevive al borrado | **Sí.** `eco1a_libro.sql:229-241`, `:284-328`; prueba 18 en `supabase/pruebas/eco1a_verificacion.sql:290-304` |
| ECO-1 v1.3 §2 | Libro de solo inserción e idempotente | **Sí.** `eco1a_libro.sql:162-227`, `:420-513` |
| Protegidos v1.8 | **Seis** archivos | El encargo dice cinco. `deck.js` entró en la v1.4 (2026-09-17). Lista en §3 |

Contradicciones entre documentos que afectan a CFG-1:

| # | Tema | Una parte dice | La otra parte dice |
|---|---|---|---|
| a | «Ocultar saldo» | Menu v1.1 §4: interruptor del ⋮ que enmascara la pila de la mesa, también para el rival en PvP | Rankings §11 y Tienda §10: nunca en la mesa; ojito solo en la píldora del lobby. Menu v1.5 §9 no retira la v1.1 §4 |
| b | Tapetes en el ⋮ | Tapetes v1.0/v1.2 y Menu v1.5 §4 lo ponen ahí | Tienda v1.1 §7 lo saca |
| c | Dónde se venden los cosméticos | Tapetes v1.0 §6: «la tienda es solo de dinero real» | Tienda v1.0/v1.1: tapetes y avatares con HC |
| d | Propiedad guardada en `localStorage` | Tapetes v1.0 §5: migra con el login | Tienda v1.1 §7: no se reconoce. La decisión de Victor en el encargo coincide con Tienda |
| e | «Menú de configuraciones» | Tienda §7 lo usa para el ⋮ de la mesa | Rankings §7.3, §11 y §13 lo usan para el ⚙ del lobby |
| f | Moneda | Tapetes: «fichas» | Tienda: «HC»; código: «Heptacoins» |
| g | «Sugerencias» | Menu v1.1 §2.1 descarta «Sugerencias» como ayuda de jugada | La fila del ⚙ es «Enviar sugerencia» (contacto). Es otra cosa con el mismo nombre |
| h | Piso táctil | INV-07: 44 en el menú | Menu v1.1 §10a deja el disparador ⋮ en 40 |

Comentarios de código que se quedaron viejos (anotados, sin tocar):
- `UtilitiesMenu.jsx:9`: «SOLO gate de escritorio».
- `useTapetes.js:50-53`: sello móvil.
- `theme.css:39`: «`data-tapete` nunca se aplica en móvil».
- `menuEntradas.js:86-90`: habla de la Bienvenida, que ya no se monta.
- `Lobby.jsx:252`: «seis filas con Pronto».
- `IconosLobby.jsx:63`: «atajo a la Tienda».
- `BarraSuperior.jsx:51-52`: «ajuste local de vs-IA».
- `lobby.css:682-683`: dice que la fila supera 44 en todo el rango, y es falso (ver F-1).

---

## 3 · Respuestas A → M

### Protegidos (regla 3 de §0)

`docs/AJILEI_Protegidos_v1.0.md:85-92`, lista v1.8. Los vigila `scripts/testProtegidos.test.js` (INV-01).

1. `src/engine/gameEngine.js`
2. `src/engine/aiPlayer.js`
3. `src/engine/deck.js`
4. `src/config/seatLayouts.js`
5. `src/styles/opponentPanel.css`
6. `src/styles/gameTable.css`

Qué toca CFG-1 de estos seis:
- El barajado: `.shuffle-fan-card { animation: fanOut 1.95s }` en `gameTable.css:1083`, con keyframes en `:1087-1091` y `:3166-3173`.
- El volteo del DEAL_3: `.card-flip-anim` 0,30 s en `gameTable.css:1099-1100`.
- La piel de escritorio del ⋮: `gameTable.css:5821` (disparador), `:5859` (panel) y `:5874` (fila). Su `height: auto` hace que **cambiar las entradas del ⋮ no obligue a tocarlo**. La altura solo está espejada en JS (`useUtilitiesMenu.js:46`, `:97`).

### A · El ⚙ del lobby

**A-1. Qué es y cómo se monta.**
- Es un `<aside className="lob-hoja">` dentro de `Lobby` (`src/screens/Lobby.jsx:283-368`), con el estado `hojaAbierta` (`:79`).
- Lo abre `button.lob-ajustes[data-accion="ajustes"]` (`src/components/BarraSuperior.jsx:184-194`). El lobby le pasa `onAjustes={() => setHojaAbierta(true)}` (`Lobby.jsx:202-204`).
- No hay ruta ni portal. La hoja está **siempre en el DOM**: cerrada lleva `inert` y `aria-hidden` (`src/hooks/lobbyCore.js:54-56`, aplicado en `Lobby.jsx:302`).
- Capas:
  - Velo `div.lob-velo`: `position: fixed`, `z-index: 6` (`lobby.css:564-578`).
  - Hoja: `position: absolute`, `z-index: 7` (`lobby.css:592-643`).
  - Toast: `z-index: 5` (`lobby.css:725-747`).
  - El contexto de apilamiento es `.lobby { position: relative; z-index: 0 }` (`lobby.css:113-114`).
- Foco: va al título al abrir y vuelve al ⚙ al cerrar. La clase `lobby-hoja-abierta` va en `<body>` (`Lobby.jsx:121-125`). `Escape` cierra (`:130-135`).
- En las demás pantallas el mismo botón solo dice «Pronto»: `PartidaPvP.jsx:54`, `SalaEspera.jsx:488`, `SalaOpciones.jsx:252` y `PantallaChips.jsx:139` (este último cubre Retar, Armar mesa y Rankings).

**A-2. Tabla de tópicos.** Todas las filas son `SoundButton` y suenan con `buttonClick`. «Pronto» es `pronto()` (`Lobby.jsx:137-141`): enseña un toast de 1.200 ms.

| Entrada | Texto | Qué hace hoy | Dónde |
|---|---|---|---|
| Título | `t('lob.cfg.titulo')` «Configuración» | Rótulo (`h2`, `tabIndex=-1`) | `Lobby.jsx:304-306` |
| Cabecera · figura | `<IconoUsuario/>`, SVG fijo | Nada | `Lobby.jsx:309` |
| Cabecera · nombre | `cuenta.username`, de `profiles` (`useAuth.js:218-219` → `App.jsx:810`) | Nada | `Lobby.jsx:311` |
| Cabecera · correo | `enmascararCorreo(cuenta.correo)` → `c•••@dominio`. El correo sale de la **sesión** (`useAuth.js:372` → `App.jsx:811`) | Nada | `Lobby.jsx:313` · `lobbyCore.js:32-41` |
| Sonido | `lob.cfg.sonido` + «Pronto» | «Pronto» | `Lobby.jsx:317-319` |
| Idioma | `lob.cfg.idioma` + «Pronto» | «Pronto» | `Lobby.jsx:320-322` |
| Enviar sugerencia | `lob.cfg.sugerencias` + «Pronto» | «Pronto» | `Lobby.jsx:323-325` |
| Cerrar sesión | `lob.cfg.salir` | **Funciona** | `Lobby.jsx:327-329`, `:153-156` → `App.jsx:276-280` → `useAuth.js:366-369` |
| Acerca de | `lob.cfg.acerca` + `›` | **Funciona.** Despliega `#lob-acerca` | `Lobby.jsx:331-361` |
| Eliminar cuenta | `lob.cfg.eliminar` + «Pronto» | «Pronto» | `Lobby.jsx:363-367` |

- La cabecera es un `div.lob-hoja-cuenta` sin manejador (`Lobby.jsx:308-315`, `lobby.css:657-668`).
- Ningún dato de la cabecera pasa por RPC.
- Con el bypass, el nombre es «DevLocal» y el correo queda vacío, con su caja reservada (`App.jsx:821-824`).

**A-3. Tapetes.**
- **En el ⚙ del lobby: no encontrado.** `useTapetes` solo se usa en `GameTable.jsx:606` y `TapetesPanel` solo se monta en `GameTable.jsx:2861-2872`.
- Catálogo (`src/config/tapetes.js:33-71`; por defecto `'verde'` en `:75`): verde 0 · grafito 10.000 · azul 15.000 · vinotinto 25.000 · tricolor 50.000.
- Claves exactas: `TAPETE_KEY = 'ajilei.tapete'` y `TAPETES_COMPRADOS_KEY = 'ajilei.tapetes.comprados'` (`tapetes.js:87-88`). La segunda se guarda como CSV (`tapetesCore.js:33-40`).
- `useTapetes` (`src/hooks/useTapetes.js`):
  - Lee y escribe con try/catch (`:16-42`).
  - `presionar` (`:86-97`) y `confirmar` (`:103-109`). **Comprar no cobra** (`tapetesCore.js:55-63`).
  - Pone `document.body.dataset.tapete` (`:124-128`).
- **«Desktop gate»: ya no decide nada sobre los tapetes.**
  - La firma es `useTapetes(enabled = true)` (`:54`) y `GameTable.jsx:606` la llama sin argumento. MOV-1b-a quitó el gate (`GameTable.jsx:603-605`).
  - El gate sigue vivo como `DESKTOP_TABLE_MQ = '(orientation: landscape) and (min-height: 601px)'` (`GameTable.jsx:126`). Solo decide `vivas` (`:2811`), y la única diferencia es el badge CONTADOR (`menuEntradas.js:46-64`).
- **Los 63×35** (medidos en las cuatro celdas, F-1):
  - Son la fila «Tapetes» del ⋮: `button.util-item-tapetes` (`UtilitiesMenu.jsx:214-225`).
  - Caja visible: **62×44** (81,19×57,19 a 1920×1080). Zona táctil real: **63×35** (82×45 a 1920).
  - Causa: el `<svg className="util-ico util-ico-cuenta" viewBox="0 0 24 24">` de la fila siguiente no lleva `width` ni `height` (`UtilitiesMenu.jsx:57-74`). Ninguna hoja tiene regla para `.util-ico-cuenta`. `.util-ico` solo pone `display` y `font-size` (`gameTable.css:5896-5902`, `menuMovil.css:218-224`).
  - El SVG mide 62 de alto en una fila de 44, desborda 9 px arriba y abajo y tapa el pie de «Tapetes».
  - Reglas de la fila: `.util-item { width: 100%; height: var(--dsk-u1-item-h) }` (`gameTable.css:5874-5889` y `menuMovil.css:195-210`), con `--dsk-u1-item-h: 44px` y `--dsk-u1-panel-w: 64px` (`gameTable.css:5758-5759`, `menuMovil.css:69-70`).
  - Ya documentado en `docs/reportes/AJILEI_PAN-1_1b_Informe_v1.0.md:77-82` e INV-07 («Hueco (parcial)… Dueño: el punto 12»).
- **Los botones del panel de tapetes, que no son el problema:**
  - Muestras `.tap-swatch`: medidas **72×108,39** con zona 73×109 en 360, 412 y 1366; **93,59×139,77** a 1920. Regla en `tapetes.css:365-380`, con `--tap-tile-w: 72px` y `--tap-disco: 44px` (`:324-331`).
  - «Sí/No» `.tap-btn { min-height: 40px }` (`tapetes.css:459-472`). Por cálculo, sin medir: ~109×40.

**A-4. Textos.**
- Claves `cfg.*`: **0**. Claves `menu.*`: **0**.
- Hay 7 `lob.cfg.*` (`textos.es.js:47-53`): `titulo`, `sonido`, `idioma`, `sugerencias`, `salir`, `acerca`, `eliminar`. Relacionadas: `lob.acerca.sonidos` (`:54`), `lob.ajustes.aria` (`:62`), `lob.toast.pronto` (`:44`), `lob.perfil.aria` (`:60`).
- **Límite de la prueba:** `textos.test.js:95` solo admite los prefijos `lob.`, `sal.`, `ia.`, `app.`, `aviso.`, `video.` y `rnk.`. Un prefijo `cfg.` o `menu.` rompe la prueba si no se añade ahí. La prueba de `:101+` prohíbe textos duplicados.
- Literales a mano, que van a IDI-1:
  - **`UtilitiesMenu.jsx`** (no usa `t()`): «Utilidades» (`:88`), «Saldo» (`:102`), «Sonido» (`:184`), «Reacciones (espera un momento)» / «Reacciones» (`:203`), «Tapetes» (`:222`), «Cuenta» (`:249`), «Mano actual» (`:298`, `:314`), «… consultas gratis» (`:327`, `:341`).
  - **`TapetesPanel.jsx`**: «Tapetes» (`:56`, `:66`), «Puesto» (`:100`), «Comprado» (`:101`), «Confirmar compra» (`:113`), «¿Comprar … por … Heptacoins?» (`:115`), «Sí» (`:118`), «No» (`:119`). Nombres y descripciones en `tapetes.js:36-66`.
  - **`CuentaPanel.jsx`**: «Cuenta» (`:57`), «Tu nombre» (`:62`), «Cambiar nombre» (`:66`), «Cerrar sesión» (`:74`), «Salir abandona la mano en curso.» (`:80`).
  - **La hoja del lobby**: «by HEPTACREATION» (`Lobby.jsx:349`) y `CREDITOS_EMOJI` (`creditos.js:29-34`).

### B · Sonido

**B-1. Un solo estado.**
- Interruptor: `toggle = () => setSoundEnabled(prev => !prev)` (`src/context/SoundContext.jsx:24`).
- El efecto de `:31-35` escribe `localStorage['ajilei.sound']` (`'on'`/`'off'`, clave en `:15`; todo lo que no sea `'off'` cuenta como encendido, `:18-19`) y llama a `Howler.mute(!soundEnabled)`.
- El proveedor está en la raíz (`main.jsx:60`).
- El ⋮ lo lee y lo cambia (`UtilitiesMenu.jsx:119`, `:178-187`).
- La fila del ⚙ **no lo lee**: `Lobby` no importa `useSoundContext`, solo dice «Pronto».
- Para que el ⚙ y el ⋮ compartan estado basta con enchufar la fila al mismo contexto. No hace falta clave nueva.
- Detalle: el efecto escribe `'on'` al montar aunque nadie haya tocado nada (`:32`).

**B-2. Interruptores.** Hay **uno solo**.
- Los 11 efectos de Howler dependen de él: clics, golpe de mesa, cartas y fichas (`useSounds.js:23-41`, `:207-208`, `:237-254`).
- La música de la celebración no sortea melodía con el sonido apagado (`useCoreografia.js:63`, `:84`) y además Howler la silencia.
- `useCongelado.js:31-37` usa `Howler.volume(0)` al ocultar la pestaña, sin tocar la preferencia.
- **Fuera del interruptor:**
  - El video de SumaMente (`<video>`, `IntersticialSumaMente.jsx:178-187`, `:89-94`, `:143-149`) lleva su propio `muted` y **no respeta `ajilei.sound`**.
  - El video de recompensa es simulado y sin audio (`lib/reproductor.js:10-13`).
  - Las «voces» de VOZ-2 son visuales.

**B-3. eslint en `SoundContext.jsx`.**
- Hay **un** aviso de los 21 de siempre: `44:17 react-refresh/only-export-components`. El archivo exporta el hook `useSoundContext` (`:44-46`) junto al componente `SoundProvider` (`:22`).
- No hay `setState` en efectos ni refs leídas en el render.
- Si 1a importa el contexto en `Lobby.jsx`, la cuenta no sube.
- Si 1a añade otro export que no sea un componente a `SoundContext.jsx`, la cuenta no sube tampoco: es la misma regla, en la misma línea por archivo. Lo único que hay que evitar es crear un archivo `.jsx` nuevo que exporte un componente y un hook a la vez.

### C · Versión en «Acerca de»

**C-1.**
- `package.json:4` → `"version": "0.0.0"`.
- `vite.config.js` no tiene `define` (solo `plugins` y `preview.allowedHosts`, `:5-10`).
- `__APP_VERSION__`, el commit o cualquier marca de versión: no encontrado en `src/`, `index.html` ni `manifest.webmanifest`.

**C-2. Cómo se compila ajilei.io.**
- `wrangler.jsonc:1-8`: `name: "ajilei"`, `assets: { directory: "./dist", not_found_handling: "single-page-application" }`, sin `main`. Es **Cloudflare Workers con static assets**. El commit `cfeb39c` se titula «DES-1: ficha de despliegue Workers».
- `dist/` está en `.gitignore:19`, así que la compilación ocurre en Cloudflare, desde `main` (`AJILEI_FRZ1_Cierre_Commits_v1.0.md:51` y otros cierres).
- No hay `.github/` ni `_redirects`. El README es la plantilla de Vite.
- Los documentos mezclan «Pages» (`AJILEI_CAR1_Fase0_v1.0.md:46`, `AJILEI_RNK-1_Fase1eL_Informe_v1.0.md:46`) y «Workers» (`AJILEI_PUE_Fase0_Informe_v1.0.md:580`, `scripts/diagPUE.mjs:1096`). La ficha del repo dice Workers.
- **Desde el repo no se puede saber** qué comando de build ni qué variables ve la compilación. Victor lo mira en el panel de Cloudflare.
- Por conocimiento general, no por el repo:
  - Workers Builds expone `WORKERS_CI_COMMIT_SHA`.
  - Pages expone `CF_PAGES_COMMIT_SHA`.
  - Si la compilación clona con `.git`, `git rev-parse --short=7 HEAD` también serviría.

**C-3. Qué muestra hoy «Acerca de».** `Lobby.jsx:348-361`, estilos en `lobby.css:694-704`:
1. «by HEPTACREATION».
2. «Emoji: **Google Animated Noto Emoji** · CC BY 4.0», con enlace a `googlefonts.github.io/noto-emoji-animation/` (`creditos.js:29-34`).
3. «Sonidos y música: freesound_community, EAGLAXLE, … Mykola Sosin — Pixabay Content License.» (`textos.es.js:54`, `creditos.js:54-82`).

No muestra versión ni contacto.

### D · Enviar sugerencia

**D-1.** Existe (`Lobby.jsx:323-325`, `textos.es.js:50`) y solo dice «Pronto». `mailto:` o una dirección de soporte: no encontrado en `src/`.

**D-2. `data-sin-pantalla-completa`.**
- Se lee en `src/lib/pantallaCompletaCore.js:96`: `SIN_PANTALLA_COMPLETA = '[data-sin-pantalla-completa]'`, con `e.target.closest(...)` en `:98`.
- Lógica (`:104-106`): fuera de la mesa, un `pointerup` en fase de captura pide pantalla completa **salvo** que el toque caiga dentro de un elemento con el atributo. Pedir pantalla completa gasta la activación que necesitan copiar o compartir (`:92-95`).
- Se engancha en `App.jsx:600-608`.
- Lo llevan hoy: `SalaEspera.jsx:531` (copiar código) y `:541` (compartir). Nada más.
- El `mailto:` y «Copiar correo» deben llevarlo igual que esos dos.

**D-3. Portapapeles.**
- `SalaEspera.jsx:336` copia `sala.codigo` y silencia el fallo con `.catch(() => {})`.
- `SalaEspera.jsx:353` copia el texto de compartir cuando no hay `navigator.share` (`:348-355`), con un try/catch silencioso.
- Las dos usan `navigator.clipboard?.`.
- **No hay ningún helper reutilizable.** No hay respaldo con `execCommand` ni aviso de «copiado».

**D-4. Datos para prellenar el correo.**
- Nombre: `cuenta.username` (`App.jsx:810` → `Lobby.jsx:163`).
- Correo: `cuenta.correo`, de la sesión.
- uuid: `cuenta.id`. INV-67 no se aplica a un correo que el jugador manda por su cuenta, pero conviene decidir si va (pregunta P-4).
- Versión: hoy no existe (C).
- Aparato:
  - `navigator.userAgent`, `platform` o `userAgentData`: no encontrado en `src/`.
  - `src/lib/dispositivo.js:17-38` solo da un UUID aleatorio (`ajilei.dispositivo`).
  - La única detección es `esSafariDeIPad` (`pantallaCompletaCore.js:62-66`).
- Idioma: `useIdioma` (`Lobby.jsx:76`).

### E · «Ocultar saldo» y la píldora

**E-1. La píldora.**
- Es `div.lob-pildora` en `src/components/BarraSuperior.jsx:140-176`. La monta el lobby (`Lobby.jsx:187-205`) con `saldo={billetera?.saldo ?? null}`; App le pasa `billetera = useBilletera(...)` (`App.jsx:270-272`).
- La cifra (`BarraSuperior.jsx:111-124`) se elige por prioridad: aviso vivo → celebración del video → saldo.
  - Sin cifra y cobrando: tres puntos `.pil-puntos`.
  - Con cifra recordada: `montoTexto(recordado)`, atenuada (`ajilei.saldoVisto`, `saldoRecordado.js:18`).
  - Sin nada: «—».
  - Se pinta con `<BalanceDisplay chips={numero} size="icon"/>` (`:165`; `BalanceDisplay.jsx:9-15`).
  - Ganchos para el arnés: `data-saldo`, `data-saldo-vacio`, `data-saldo-recordado` y `data-saldo-cobrando` (`:144-148`).
- INV-46 (`Invariantes:86`): una sola fuente, la billetera del servidor. Su lista de pantallas no nombra Rankings, aunque Rankings monta la misma píldora.
- El «+» dorado: `SoundButton.lob-mas[data-accion="tienda"]`, con `aria-label` «Conseguir monedas» y `onClick={video?.abrirHoja}` (`BarraSuperior.jsx:167-175`). Abre `HojaMonedas` por portal (`MarcoVideo.jsx:75`, `:88-97`). El oro está en `lobby.css:248-260`.

**E-2. «Ocultar saldo».**
- En el ⚙: **no existe**.
- Lo único parecido es la entrada «Saldo» del ⋮, inerte (`UtilitiesMenu.jsx:101-103`, `:255-268`; `menuEntradas.js:23`, `:36`). Viene de Menu v1.1 §4 (`Menu_Utilidades_v1.1.md:163`).
- Rankings v1.2 §11 (`Rankings_v1.2.md:294-298`; también `:323` y `:351`) dice que Rankings **ignora** el interruptor. Como no existe, no hay código que lo ignore.
- **Ojo:** la píldora es el mismo componente en Retar, Salas, Armar mesa, Sala de espera, PvP y Rankings (vía `PantallaChips`, `Rankings.jsx:182-197`). Si el estado vive en `BarraSuperior`, el ojito taparía la cifra en todas.

**E-3. Dónde se ve el saldo fuera de la mesa.** La Fase 1 **no toca** nada de esta lista salvo la 1:

| # | Sitio | Archivo:línea |
|---|---|---|
| 1 | Píldora del lobby | `Lobby.jsx:187-192` → `BarraSuperior.jsx:140-176` |
| 2 | Retar · píldora | `RetarIAS.jsx:270-278` vía `PantallaChips.jsx:129-139` |
| 3 | Retar · «No te alcanza: tienes {saldo} HC.» | `RetarIAS.jsx:252-256`, `textos.es.js:325` |
| 4 | Salas · píldora | `SalaOpciones.jsx:245-252` · `ArmarMesa.jsx:233-240` · `SalaEspera.jsx:481-488` · `PartidaPvP.jsx:47-54` |
| 5 | Rankings · píldora | `Rankings.jsx:182-189` |
| 6 | Rankings · cifras de Fortunas | `Rankings.jsx:94-97`, `:250-261` |
| 7 | Rankings · banda «Tu posición» | `Rankings.jsx:199-215` (`:206`) |
| 8 | Mini-perfil · «Las grandes fortunas» | `MiniPerfil.jsx:148-151` · `miniPerfilCore.js:33-35` |
| 9 | Aviso de saldo | `AvisoSaldo.jsx:25-73` (monto en `:68`); la píldora cuenta de `aviso.desde` a `aviso.hasta` (`BarraSuperior.jsx:94-102`, `:113`) |
| 10 | Celebración del video | `CelebracionVideo.jsx:9-22`, `:51-52` → `MarcoVideo.jsx:71`, `:82` → `BarraSuperior.jsx:112-114` |
| 11 | Celebración de la victoria · «Saldo actual» | `Celebracion.jsx:287-292` (el saldo total de `salir_ia`, `GameTable.jsx:947-955`, `:2382`) |
| 12 | Recarga (en la mesa), de forma indirecta | `GameTable.jsx:2984`, `:3040-3042`; tope en `mesaCore.js:157-162` |
| — | «Conseguir monedas» | No enseña el saldo, solo el premio (`HojaMonedas.jsx:73`) |

### F · Tocables de menos de 44 px

**F-1. Medidas tal como se aplican.**
- Formato de cada celda: caja visible ancho×alto **/** zona táctil real.
- La zona cuenta píxeles inclusivos, por eso sale un píxel de más.
- Los teléfonos se midieron con `pointer: coarse` (`isMobile` + `hasTouch`).
- En 1366×768 se midió con ratón y con táctil: **las cifras son idénticas**, porque `tactil.css` no alcanza el lobby ni Salas.
- `--u = clamp(3.2px, 1vmin, 6px)` (`lobby.css:66`, `salas.css:56`), así que de 1366 hacia arriba todo está en el tope.

| Elemento | 360×640 | 412×915 | 1366×768 | 1920×1080 | Regla que lo produce |
|---|---|---|---|---|---|
| ⚙ lobby `.lob-ajustes` | **31,31×31,31 / 32×32** | **35,84 / 37×37** | 52,19 / 53×53 | 52,19 / 53×53 | `width/height: var(--ico-caja)` (`lobby.css:289-302`); `--ico-caja: calc(var(--ico)*1.45)`, `--ico: calc(var(--u)*6)` (`lobby.css:86-87`). En Salas, `salas.css:285-298` |
| «+» de la píldora `.lob-mas` | **18,36×18,36 / 19×20** | **21×21 / 22×21** | **30,59 / 32×32** | **30,59 / 32×32** | `width/height: 1.5em` (`lobby.css:248-260`) contra `font: inherit` (`:282-286`). En Salas, `salas.css:265-283` |
| Avatar + nombre `.lob-perfil` | 124,03×**38,5** / 125×**39** | 142,42×44,06 / 143×44 | 210,44×64,19 | 210,44×64,19 | `padding: var(--u) calc(var(--u)*1.5) var(--u) var(--u)` (`lobby.css:183-194`) más el círculo `.lob-avatar` de `--ico-caja` (`:195-204`) |
| Casa `.sal-casa` (Retar y Salas) | **31,31 / 32×31** | **35,84 / 37×36** | 52,19 / 53×52 | 52,19 / 53×52 | `width/height: var(--ico-caja)` (`salas.css:686-701`; `--ico-caja` en `:63-64`) |
| Flecha `.sal-volver` | **31,31 / 32×31** | **35,84 / 37×36** | 52,19 / 53×52 | 52,19 / 53×52 | `salas.css:310-322` |
| Chips `.sal-chip` (las cuatro filas de Retar) | alto **40 / 41** | alto **40 / 41** | 44,39 / 45 | 57 / 58 | `height: var(--chip-h)` (`salas.css:574-587`), con `--chip-h: max(40px, calc(var(--u)*9.5))` (`salas.css:69`). El piso de 40 es lo que manda en teléfono. Anchos: jugadores 64 (`min-width: calc(var(--chip-h)*1.6)`, `:592`), apuesta «50» **45,17** |
| Campo de código `label.sal-campo` | 144×44 / 145×45 | 164,8×45,31 / 166×46 | 240×54 | 240×66 | `height: var(--cta-h)` (`salas.css:378-389`), con `--cta-h: max(44px, calc(var(--u)*11))` (`:67`). El `<input>` mide 89,78×**21** (`:398+`), pero el `<label>` lo envuelve, así que tocar la caja enfoca el campo. **Cumple** |
| «Entrar» `.sal-entrar` | 66,09×44 / 67×45 | 75,34×45,31 | 108,86×54 | 108,86×66 | `--cta-h` · cumple |
| «Unirme» `.sal-unir` | 65,61×**35,19** / 66×**36** | 74,78×**36,25** / 76×**37** | 108,03×44 / 109×45 | 108,03×52,8 | `height: calc(var(--cta-h)*0.8)` (`salas.css:527-539`). Solo `.sal.es-anclada` lo sube a `max(44px, …)` (`salas.css:1690`) |
| ± del contador `.sal-paso` | **40×40 / 41×41** | **40×40 / 41×41** | **42×42 / 43×43** | **42×42 / 43×43** | `width/height: max(calc(var(--u)*7), 40px)` (`salas.css:1411-1425`) |
| Filas del ⚙ con «Pronto» (Sonido, Idioma, Sugerencia) | 242,81×44,73 | 278,17×47,55 | 406×57,8 | 406×60,69 | `.lob-fila`, `padding: calc(var(--u)*2.4) 0` (`lobby.css:670-684`). La pastilla «Pronto» es la que da el alto |
| Filas del ⚙ **sin** pastilla: Acerca de, Cerrar sesión | 242,81×**40,45** / ×**41** | 278,17×**42,95** / ×**43–44** | 406×51,98 | 406×54,88 | La misma regla. El comentario de `lobby.css:682-683` («por encima de los 44px en todo el rango») **es falso** en teléfono |
| Eliminar cuenta | ×45,73 | ×48,55 | ×58,8 | ×61,69 | Ídem, más el borde de `lob-fila-peligro` |
| ⋮ de la mesa `.utilities-trigger` | 40,61×32 / **45×44** (con `::after`) | 40,61×32 / 45×44 | 40,61×32 / 42×32 (ratón) | 52,78×41,59 / 53×43 (ratón) | `tactil.css:133-161` en coarse; sin coarse no hay pseudo. INV-07 deja el ⋮ en 40 (Menu v1.1 §10a) |
| ⋮ · fila Tapetes | 62×44 / **63×35** | 62×44 / **63×35** | 62×44 / **63×35** | 81,19×57,19 / 82×**45** | Ver A-3: lo tapa el SVG de Cuenta |
| Muestra de tapete `.tap-swatch` | 72×108,39 / 73×109 | ídem | ídem | 93,59×139,77 | `tapetes.css:365-380` · cumple |

No hay ningún tocable de la lista que dependa de `pointer: coarse` fuera de la mesa.

**F-2. Qué vigila hoy los tocables.**
- `diagDSK tactil` mide zonas de 40 **solo en la mesa** (36 páginas: mesas 5, 4, 3 y 2 × 9 celdas; `diagDSK.mjs:3722-3868`).
- INV-07 (`Invariantes:47`) enumera más vigilantes: `apu` (apu.6), `rec`, `u1`, `u2`, `menu-movil`, `diagSAL sal` (p4), `diagDSK lob` y `diagDSK retar`.
- **Pero `lob` solo mide el CTA, y por caja, no por zona:** `c['lob.2'] … p2.h >= 44` (`diagDSK.mjs:1165-1178`).
- **Ninguna puerta mide hoy la zona táctil del ⚙, del «+», del avatar, de la casa o la flecha, de los chips, de «Unirme» ni del ±.**

**F-3. ¿Camino Z (zona táctil sin mover lo que se ve) o lámina?**

| Elemento | Camino | Por qué |
|---|---|---|
| ⚙, casa, flecha | **Z** | Botón con `::after` transparente de `min(0, 50% − 22px)` por lado, el molde de la tarjeta de recarga (`tactil.css:94-107`). La casa ya es `position: absolute/fixed`. Hay que vigilar dos cosas: en 360 la zona del ⚙ (+6,3 px por lado) roza la ficha de constancia, que está justo a su izquierda; y la flecha roza el título |
| Avatar `.lob-perfil` | **Z** | Le faltan 5,5 px de alto en 360. Sin vecinos encima ni debajo |
| «+» de la píldora | **Z, pero a lámina** | Le faltan **25,6 px por eje** en 360. El pseudo cubriría la cifra de la píldora y casi toda la altura de la barra. Funciona solo si la cifra no es tocable (hoy no lo es) y la ficha de constancia no queda debajo. Mejor verlo en lámina |
| Chips (alto 40) | **Z** | +2 px arriba y abajo. Las filas están separadas por más de 4 px |
| ± del contador | **Z** | +2 px por lado. Lo de al lado es el monto, que no es tocable |
| «Unirme» | **Z** | +4,4 px por lado vertical, dentro de la tarjeta `.sal-mesa`, que es más alta |
| Campo de código | — | Ya cumple por el `<label>` |
| Filas «Acerca de» y «Cerrar sesión» del ⚙ | **Mueve geometría** | Un `min-height: 44px` hace crecer la hoja 3,5 px por fila en 360. Las filas van pegadas, así que no queda aire para un pseudo. Cambio pequeño, pero mueve la hoja. **Lámina corta, o aceptación expresa** |
| Fila Tapetes del ⋮ | **Se resuelve sola en 1e** | Si «Cuenta» sale del ⋮, su SVG desaparece. Si «Cuenta» se queda, darle tamaño al SVG en una hoja no protegida (`menuMovil.css`, o una hoja aditiva con la media query de escritorio). No hace falta tocar `gameTable.css` |

### G · Perfil editable

**G-1. Tabla `profiles`** (`supabase/migrations/0001_sup2a_identidad.sql`).
- **Columnas** (`:29-41`):
  - `id uuid` PK `references auth.users(id) on delete cascade` (`:30`)
  - `username text not null` (`:31`)
  - `created_at timestamptz` (`:32`)
  - `updated_at timestamptz` (`:33`)
  - Ninguna migración posterior la altera.
- **Restricciones:**
  - `profiles_username_formato_chk`: `'^[A-Za-z0-9_]{6,15}$'` (`:39-40`).
  - Índice único `profiles_username_lower_uniq` sobre `lower(username)` (`:46-47`).
  - Palabras vedadas: `reserved_usernames` (`:86-112`) con `normalizar_username()` (`:67-76`).
- **Triggers:**
  - `profiles_validar_username_trg`, BEFORE INSERT OR UPDATE (`:166-168`). Ejecuta `validar_username()`, `security definer` (`:134-164`), que rechaza vedados con P0001 y **pone `updated_at := now()` en todo UPDATE** (`:161`).
  - `profiles_abrir_billetera_trg`, AFTER INSERT (`eco1a_libro.sql:647-650`): abre la billetera y da el bono.
- **RLS** (`:179-206`):
  - SELECT: todos los `authenticated` ven todo (`:184-187`).
  - INSERT de la fila propia (`:190-193`).
  - **UPDATE de la fila propia, sin límite por columnas** (`:196-202`). No hay `grant update (col)`.
  - No hay política DELETE.
- **Cómo se fija el username:**
  - **Lo hace el cliente** en el Bautizo, con `.from('profiles').insert({ id: uid, username })` (`src/hooks/useAuth.js:314-343`, insert en `:322-326`). No hay `handle_new_user`.
  - Cambiar el nombre es `.update({ username }).eq('id', uid)` (`useAuth.js:347-362`).
  - Los errores se traducen por 23514/P0001/23505 (`:108-116`). La copia de la regla en el cliente es `REGLA_USERNAME` (`:98`).

**G-2. ¿Se puede cambiar algo hoy?**
- **Solo el nombre, y solo desde la mesa:** ⋮ → «Cuenta» (`UtilitiesMenu.jsx:240-253`) → `CuentaPanel` → «Cambiar nombre» (`CuentaPanel.jsx:62-67`) → `Bautizo modo="edicion"` como modal (`GameTable.jsx:2834`, `:2844-2851`) → `useAuth.cambiarNombre`.
- En móvil horizontal la entrada no se monta (`menuEntradas.js:94-96`).
- **El Bautizo en edición es una pieza reutilizable para 1b.**

**G-3. El avatar.**
- **Figurita del lobby:** `SoundButton.lob-perfil[data-accion="perfil"]` (`BarraSuperior.jsx:128-136`), con `span.lob-avatar > IconoUsuario` (`IconosLobby.jsx:54-61`) y `.lob-nombre`.
  - Al tocarla: «Pronto» (`Lobby.jsx:201`; `PantallaChips.jsx:138`; `SalaOpciones.jsx:251`; `SalaEspera.jsx:487`; `PartidaPvP.jsx:53`).
  - Medidas en F-1. CSS: `lobby.css:183-208`; recorte del nombre en `constancia.css:67-74`; en Salas, `salas.css:191-223`.
- **Mini-perfil:** `div.mp-avatar` con la inicial (`MiniPerfil.jsx:132-133`, «el sitio de la imagen de AVA-1»). CSS: `miniPerfil.css:67-77`, `--av: 72px` (64 en `:190`).
- **Filas de Rankings:** `span.rnk-av` con la inicial (`Rankings.jsx:88`; `rankings.css:22`, `:156-166`; Fortunas en vino, `:32-35`).
- **Sala de espera:** `.sal-esp-av` (`SalaEspera.jsx:597-598`; `inicialDe` en `salaEsperaCore.js:37-40`).
- **«Avatar elegido»:** no existe. No hay columna, ni clave, ni estado. Solo comentarios que remiten a AVA-1.

**G-4. `MiniPerfil.jsx`.**
- «Editar»: `button.mp-editar[data-accion="mp-editar"] disabled`, sin `onClick`, solo si `propio` (`:152`, `:161-164`). `min-height: 44px` (`miniPerfil.css:152-160`).
- Se monta con `createPortal(…, document.body)` (`:109-171`). No es un `screen` (`:18-20`).
- Lo abren Rankings (`Rankings.jsx:162-165`, `:285-296`) y la victoria con «Ver tu nuevo ranking» (`GameTable.jsx:2391-2399`).
- **Para abrir una pantalla desde ahí** hace falta una prop nueva (`onEditar`) que suba por Rankings hasta `App`. `App` es el único enrutador, con una cascada de `if (screen === …)` (`App.jsx:843-1013`). La alternativa es un modal sobre lo que haya, con el patrón del Bautizo en edición.
- Desde la victoria (dentro de la mesa) abrir la edición de perfil chocaría con Rankings §7.2 («el mini-perfil nunca dentro de la mesa»). Ver pregunta P-6.

**G-5. País, estado y banderas.**
- Recursos de banderas: **no hay**.
  - Solo cinco banderas provisionales dibujadas en CSS para el selector de idioma de la Portada (`Portada.jsx:126-132`, `:399-402`; `portada.css:734-750`).
  - `scripts/fetchEmoji.mjs` no baja banderas.
- Emoji hoy:
  - Las reacciones son Noto Animated autoalojados en `public/emoji/`: 24 archivos (12 SVG con 62.226 B y 12 AVIF con 584.179 B, ~680 KB).
  - El resto son emoji de la fuente del sistema.
- Formatos posibles (se recomienda en R-11):
  - **Emoji de bandera** (indicadores regionales): 0 bytes. Windows no los pinta (sale «VE» en letras). Android, iOS y macOS sí.
  - **SVG propios:** ~190 banderas a 0,5–2 KB cada una dan ~150–300 KB sin comprimir, cargadas a demanda una por una.
  - **Fuente de banderas:** Twemoji Country Flags pesa ~80 KB en woff2 y arregla Windows.
- **RPC `mini_perfil`** (`supabase/migrations/20261024191731_rnk1a_libro_puntos.sql:662-693`):
  - Firma: `mini_perfil(p_username text) returns table (username text, puesto_maestros integer, puntos bigint, puesto_fortunas integer, saldo bigint)`, `stable security definer set search_path = ''`.
  - `grant` solo a `authenticated` (`:724-727`).
  - Para añadir avatar, país y estado:
    - Las columnas en `profiles`.
    - Un **`drop function` + `create`**, porque cambia el tipo de retorno, y repetir el grant.
    - Ajustar la prueba A10, que exige **13 columnas en total** entre las tres RPC (`supabase/pruebas/rnk1a_verificacion.sql:185-198`) **y rechaza nombres que casen con `(correo|email|mail|_id$|^id$)`**. Por eso no sirven `avatar_id` ni `pais_id`.
    - En el cliente, `traducirPerfil` (`rankingApi.js:68-74`) y la imitación (`bancoImitado.js:432`).

**G-6. El nombre como identificador.**
- **En el servidor:**
  - Ninguna tabla copia el username; todo cuelga de `profiles(id)`.
  - Lo usan como clave de búsqueda `mini_perfil` (`rnk1a:680-682`) y `constancia_admin` (solo SQL Editor, `eco1d:379-411`).
  - **Es el tercer criterio de desempate** en `puesto_maestros` (`rnk1a:490`, `:503`), `puesto_fortunas` (`:521`, `:534`) y `ranking_top` (`:574-579`, `:588-593`). Cambiar el nombre puede mover el puesto dentro de un empate.
- **En el cliente:**
  - «¿Es tuya?» se decide por username sin mayúsculas (`rankingsCore.js:59-63`, `miniPerfilCore.js:11-14`).
  - `key` de React por username (`Rankings.jsx:251`, `:287`).
  - Salas identifica por uuid (`salaEsperaCore.js:52-58`).
  - Se muestra en la barra de todas las pantallas, la hoja ⚙, CuentaPanel, Rankings, el mini-perfil y la Sala de espera (vía `profiles(username)`, `salasApi.js:251-263`).
- **Caché del cliente:** ninguna clave de almacenamiento guarda el username. Solo memoria de React: `cargaPerfil` (`useAuth.js:137`) y `perfil` en Rankings (`Rankings.jsx:116`). Tras el `update`, `useAuth` ya refresca su estado (es lo que usa la edición de hoy).
- **Fechas para el freno de 30 días:** solo `created_at` y `updated_at`. **`updated_at` no sirve**: el trigger lo refresca en cualquier UPDATE y el cliente puede hacer UPDATE libre. Hace falta una columna propia (p. ej. `nombre_cambiado_en timestamptz`) y la regla **en el trigger o en una RPC**, nunca en el cliente.

### H · Eliminar cuenta

**H-1.** Existe (`Lobby.jsx:363-367`, `data-accion="eliminar-cuenta"`, `lob-fila-peligro`) y dice «Pronto». Su comentario: «CUENTA-DEL: Edge Function con clave de servicio; borrado de perfil, registros y auth; grace period por decidir».

**H-2. Mapa de dependencias.**

| Tabla.columna | Apunta a | on delete | Migración |
|---|---|---|---|
| `profiles.id` | `auth.users(id)` | CASCADE | `0001_sup2a_identidad.sql:30` |
| `salas.anfitrion_id` | `profiles(id)` | CASCADE | `20260905203158_sal_a_salas.sql:90` |
| `sala_jugadores.jugador_id` | `profiles(id)` | CASCADE | `sal_a_salas.sql:149` |
| `sala_jugadores.sala_id` | `salas(id)` | CASCADE | `sal_a_salas.sql:148` |
| `intentos_codigo.jugador_id` | `profiles(id)` | CASCADE | `sal_a_salas.sql:185` |
| **`billeteras.jugador_id`** (PK) | `profiles(id)` | CASCADE | `20261007144943_eco1a_libro.sql:88` |
| **`movimientos.jugador_id`** (el libro) | `profiles(id)` | CASCADE | `eco1a_libro.sql:164` |
| `intentos_dinero.jugador_id` | `profiles(id)` | CASCADE | `eco1a_libro.sql:250` |
| **`mesas_ia.jugador_id`** | `profiles(id)` | CASCADE | `20261008220239_eco1c_mesas_ia.sql:124` |
| `record_manos.jugador_id` | `profiles(id)` | CASCADE | `eco1c_mesas_ia.sql:186` |
| **`constancia.jugador_id`** (PK) | `profiles(id)` | CASCADE | `20261009105658_eco1d_….sql:88` |
| **`boletos_video.jugador_id`** | `profiles(id)` | CASCADE | `20261012230807_eco1g_video.sql:121` |
| **`libro_puntos.jugador_id`** | `profiles(id)` | CASCADE | `20261024191731_rnk1a_libro_puntos.sql:114` |
| **`puntos_totales.jugador_id`** (PK) | `profiles(id)` | CASCADE | `rnk1a_libro_puntos.sql:186` |
| **`bonos_bienvenida.correo_hash`** (PK) | — | **sin FK, a propósito** | `eco1a_libro.sql:229-241` |
| `movimientos.ref_id` | texto; en el bono es el uuid del perfil | sin FK (la fila se va con la cascada de `jugador_id`) | `eco1a_libro.sql:169`, `:610` |
| `libro_puntos.mesa_id`, `mesas_ia.reemplazo_de` | uuid de mesas, no de usuarios | sin FK | `rnk1a:122`, `eco1c:140` |
| `valvula_cambios.quien` | `current_user` (un rol) | — | `eco1d:264` |

**La huella del correo:**
- Tabla `public.bonos_bienvenida`, columnas `correo_hash text primary key` y `otorgado_en` (`eco1a:235-238`).
- `huella_correo(email) = encode(sha256(convert_to(correo_canonico(email),'UTF8')),'hex')` (`eco1a:318-328`). El canónico pasa a minúsculas y, en gmail/googlemail, corta en el `+`, quita los puntos y fija `gmail.com` (`:284-309`).
- El comentario de `:233` dice: «La futura "Eliminar cuenta" NO debe borrarla».
- **Probado:** la marca sobrevive a `delete from auth.users` (`supabase/pruebas/eco1a_verificacion.sql:290-304`, prueba 18).
- La copia dentro de `movimientos.clave_idem = 'bono:'||huella` (`:610`) sí se va con la cascada. No hace falta: la que manda es la de `bonos_bienvenida`.

**Triggers que impiden el DELETE directo.** Todos dejan pasar el DELETE solo con `pg_trigger_depth() >= 2`, es decir, el que llega por la cascada:

| Trigger | Tabla | Ubicación |
|---|---|---|
| `movimientos_inmutable_trg` | movimientos | `eco1a:205-222` (`:211`) |
| `billeteras_solo_por_libro_trg` | billeteras | `eco1a:112-142` (`:131`) |
| `libro_puntos_inmutable_trg` | libro_puntos | `rnk1a:155-172` (`:161`) |
| `puntos_totales_solo_por_libro_trg` | puntos_totales | `rnk1a:215-235` (`:224`) |

- Todos tienen además su `*_sin_truncate`.
- La cascada pasa: está probado con `delete from auth.users` (`eco1a_verificacion.sql:292`) y con `delete from public.profiles` (`rnk1a_verificacion.sql:669-684`, B17).
- **Un borrado tabla por tabla falla.**

**Efectos laterales:**
- Borrar a un anfitrión **borra su sala y los asientos de los demás** (`sal_a:90` + `:148`), en Realtime (`sal_a:851-866`).
- Borrar con una mesa IA abierta borra la fila de `mesas_ia` sin pasar por `cerrar_partida_abierta`. El dinero de la mesa se va con la cuenta de todos modos, pero no queda asiento de cierre en el libro, porque el libro también se va.

**H-3. Edge Functions.**
- Solo hay `supabase/functions/sonda_mot1/index.ts`. Es **de MOT-1, desechable e ignorada por git** (`.gitignore:129`; «no entra en ningún commit», `index.ts:1-3`). **No se tocó.**
- Cómo verifica la sesión: lee `Authorization: Bearer` y hace `fetch(${SUPABASE_URL}/auth/v1/user)` (`:111-134`), que equivale a `getUser`. El uid sale del token, nunca del cuerpo.
- Clave: `SUPABASE_SERVICE_ROLE_KEY` o `SUPABASE_SECRET_KEYS` con las llaves `sb_secret_` (`:33-45`). Con `sb_` no manda `Authorization` (`:154`).
- `config.toml` no tiene `[functions]`. La sonda se desplegó con `--no-verify-jwt` y `functions deploy --use-api`, porque no hay Docker ni Deno (`docs/reportes/AJILEI_MOT-1_Fase1-0_Sonda_Informe_v1.0.md:20`, `:91`).
- En `scripts/` no hay ningún guion de despliegue.
- **Molde de producción: ninguno.** Lo reutilizable de la sonda es el patrón `llave()` y la regla del uid del token.
- `auth.admin.deleteUser`: no aparece en el repo.

**H-4. ¿Tiene una mesa abierta?**
- **Mesas IA:** `public.mi_mesa_ia() returns setof mesa_ia_resultado` (`eco1c_mesas_ia.sql:705-727`), con `grant` a `authenticated, service_role` (`:831`). Usa `auth.uid()`: desde una Edge Function con clave de servicio **no sabe quién es el jugador**. Hay que llamarla con el JWT del usuario o escribir un predicado por uid. Red de seguridad: índice único `mesas_ia_una_abierta_idx` (`:167-168`).
- **Salas:** `public.sala_esperando_de(p_uid uuid) returns uuid` (`20260911043500_sal_b1_ajuste.sql:55-69`). Está revocada a los roles del cliente (`:76`) y recibe el uid, así que sirve dentro de una función `security definer`. Para el cliente existe `mi_sala()` (`:346-373`). **Las salas en estado `activa` no cuentan** (provisional hasta MES-PvP, `:33-37`).
- Ninguna RPC une las dos comprobaciones: no encontrado.

**H-5. Qué hace el cliente al cerrar sesión.**
- `Lobby.cerrarSesion` (`Lobby.jsx:153-156`) → `App.cerrarSesion` (`App.jsx:276-280`):
  1. `saldoRecordado.borrar()`, que borra `ajilei.saldoVisto` (`saldoRecordado.js:43-45`).
  2. `supabase.auth.signOut()` (`useAuth.js:366-369`).
  3. Red de seguridad: un efecto borra `ajilei.saldoVisto` al pasar a `SIN_SESION` (`App.jsx:281-283`).
- Vuelve a la **Portada** por `onAuthStateChange` (`App.jsx:769-771`).
- **No se limpia** ninguna otra clave `ajilei.*` ni `sessionStorage`, y **`screen` no se reinicia**: no hay `setScreen` al cerrar sesión.
- Tras un borrado, reutilizar `App.cerrarSesion` basta para volver a la Portada. Habría que decidir si se limpian además las claves de preferencias (pregunta P-7).

### I · Cambio de correo

**I-1. Cómo se entra.**
- **Solo correo y código OTP de 6 dígitos.**
  - `FormularioPuerta.jsx`: paso `'correo'` → `pedirCodigo` (`:66-79`); paso `'codigo'` → `verificar` (`:81-93`).
  - Se monta en `Portada.jsx:541-543`.
- Métodos usados:
  - `signInWithOtp({ email, options: { shouldCreateUser: true } })` (`useAuth.js:284-287`)
  - `verifyOtp({ email, token, type: 'email' })` (`:302`)
  - `onAuthStateChange` (`:152`), `getSession` (`:175`) y `signOut` (`:368`)
- No hay contraseña ni OAuth. `updateUser`: no encontrado.

**I-2. Configuración de Auth.**
- `supabase/config.toml` solo tiene `project_id = "ajilei"` (`:30`); el resto son comentarios. Es mínimo a propósito (`:14-20`).
- `double_confirm_changes`, `secure_email_change`, `enable_confirmations`, `otp`: **no encontrado en el repo**.
- **Victor lo mira en el panel:** Authentication → Sign In / Providers → Email → «Secure email change».

**I-3. Dónde se ve el correo propio.**

| Sitio | Archivo:línea | De dónde | Cómo |
|---|---|---|---|
| Hoja ⚙ | `Lobby.jsx:164`, `:313` | `cuenta.correo` ← `sesion.user.email` | Enmascarado |
| Mini-perfil propio (Rankings) | `Rankings.jsx:292` → `MiniPerfil.jsx:155-160` | Sesión | Completo, con «Solo lo ves tú.» |
| Mini-perfil propio (victoria) | `GameTable.jsx:2397` | Sesión | Completo |
| Formulario de entrada | `FormularioPuerta.jsx:141-143` | El estado del formulario | El tecleado |

- **Todos leen la sesión.** Ninguno lee `profiles`, que no tiene correo.
- `onAuthStateChange` con `USER_UPDATED` refresca la sesión, así que ningún sitio se quedaría con el correo viejo.

**I-4. La huella no se recalcula.**
- `huella_correo` solo se llama dentro de `abrir_billetera()` (`eco1a:567-629`; lectura de `auth.users.email` en `:590`; huella en `:596`).
- La disparan el AFTER INSERT de `profiles` (`:631-650`) y el relleno inicial (`:661-679`).
- Ningún trigger ON UPDATE sobre `auth.users`: no encontrado.
- **Matiz:** la huella se toma con el correo que tenga la cuenta **al crear el perfil** (Bautizo), no en el alta de `auth.users`.

### J · El ⋮ de la mesa

**J-1. Componente y montaje.**
- Piezas:
  - Disparador: `UtilitiesTrigger` (`UtilitiesMenu.jsx:80-93`).
  - Panel: `UtilitiesPanel` (`:109-346`).
  - Estado: `useUtilitiesMenu` (`src/hooks/useUtilitiesMenu.js:224-333`).
  - Geometría espejada en JS: `PANEL_W = 64` (`:17`), `PANEL_H = 288` (`:46`), `PANEL_H_HORIZONTAL = 244` (`:97`).
- Montaje: el hook se llama sin gate (`GameTable.jsx:574`).
  - El disparador se monta con `{!isGameOver && …}` (`:2356-2358`).
  - El panel siempre (`:2792-2817`).
  - **El ⋮ aparece en las tres pieles.**
  - El gate solo decide `vivas` (`:2811`) y `presentes` (`:2816`).
- Pieles:
  - Escritorio: `gameTable.css` (protegido), dentro de `@media (orientation: landscape) and (min-height: 601px)` (`:4251`).
  - Móvil: `menuMovil.css:61`.

| # | Entrada | Qué hace | Archivo:línea |
|---|---|---|---|
| 1 | Sonido 🔊/🔇 | `toggleSound(); onClose()` | `UtilitiesMenu.jsx:178-187` |
| 2 | Reacciones 💬 | Abre el selector | `:195-206` · `GameTable.jsx:2801-2805` |
| 3 | **Tapetes** (godete) | Abre `TapetesPanel` | `:214-225` · `GameTable.jsx:2809`, `:2861-2872` |
| 4 | **Cuenta** (silueta = la «figurita») | Abre `CuentaPanel`: nombre, «Cambiar nombre», «Cerrar sesión» | `:57-74`, `:240-253` · `GameTable.jsx:2810`, `:2829-2851` |
| 5 | Saldo (ChipToken) | Inerte | `:101-103`, `:255-268` |
| 6 | Mano actual | Consulta la mano | `:295-320` · `GameTable.jsx:2808` |
| 6b | Badge de consultas (solo escritorio) | Popup «Tienes N consultas gratis» | `:321-343` |

Medido en las cuatro celdas: `['Sonido','Reacciones','Tapetes','Cuenta','Saldo (inerte)','Mano actual (inerte)']`. «Mano actual» sale inerte porque se midió antes de la primera mano.

En el repo no existe la palabra «figurita». Se interpreta como «Cuenta», porque es la única figura humana del panel. Ver la pregunta P-1.

**J-2. ¿IAs o humanos?**
- No hay bandera ni prop. **`GameTable` es, por construcción, solo contra IAs.**
  - Firma: `GameTable({ stake, numPlayers, nivel, entrada, onLeave, cuenta, saldo, control, apiRanking })` (`:321`).
  - La mesa nace con `jugadoresVsIA(...)` (`:357`).
  - Los puntos llevan `origen: 'ias'` (`:512`).
  - `control` es el canal de la mesa IA del servidor (`App.jsx:688`).
- El PvP va por `screen === 'partida-pvp'` → `PartidaPvP`, un stub que no reparte (`App.jsx:907-916`; `PartidaPvP.jsx:9-19`).
- **Hoy «no aparece contra humanos» se cumple sin condición.** Si MES-PvP reutiliza `GameTable`, hará falta una prop explícita.

**J-3. El reparto.**

Todo el **vuelo** del reparto está en `src/components/GameTable.jsx`, que **no** está protegido. El barajado y el volteo viven en `gameTable.css`, que **sí** lo está.

| Paso | Tiempo | Dónde |
|---|---|---|
| Embudo de cada mano nueva | — | **`commitNewHand(next)`** (`:1887-1896`), al que llegan `beginHand()` (`:1834-1847`) y la ceremonia de eliminación (`:1857-1880`: `CEREMONY_MS=1000` y `ELIM_NOTICE_MS=3750` en `:101-102`, `reflowing` 600 ms) |
| Barajado | **1.950 ms** | En JS, `setTimeout(…, 1950)` (`:1891-1895`), diferido si la pestaña está oculta. En CSS, `.shuffle-fan-card { animation: fanOut 1.95s }` (**`gameTable.css:1083`, protegido**), keyframes en `:1087-1091` y `:3166-3173`. Componente `ShuffleDeck` con `animationDelay: i*25ms` (`:270-283`). **El JS y el CSS van sincronizados** |
| DEAL_2 · primera carta | **120 ms** | `:834` (efecto en `:808-836`; secuencia `buildDealSeq` en `:168-181`) |
| Vuelo de cada carta | **0,595 s** | `FlyingCard` (`:286`; transición en línea `transform ${duration}s ease-out`, `:307`); `duration={fc.fast ? 0.75 : 0.595}` (`:2765`). Cada carta sale al aterrizar la anterior (`onTransitionEnd`, `:2766-2773`) |
| Fin del DEAL_2 → apuesta | **400 ms** | `:828-831` (`advanceFromDeal`) |
| DEAL_3 (a mitad de mano, tras BET_1) | Vuelo de 0,595 s; volteos del humano a **300/600/900 ms**; avance a **2.000 ms** | `:818-825`. Volteo `.card-flip-anim` 0,30 s (**`gameTable.css:1099-1100`, protegido**) |

**Lo que NO debe cambiar:**
- **Descarte**, que usa el mismo `FlyingCard` con `fast: true` + `isDiscardOut/In`. «fast» dura 0,75 s: es el **más lento**. Los tiempos `D_OUT` … `D_SKIP` están en `:261-267` y la lógica en `:1500-1599`. No hay un «robar» aparte del descarte.
- **IA:** `ritmoDe` (`mesaCore.js:96-100`), con `ritmoIA` en `ajileiConfig.js:189`; `AI_SPEED_FACTOR = 1.25` y `AI_ACTION_MS = 1125` (`GameTable.jsx:94-95`).
- **Reloj:** `TURN_TIME = 20` y `WARNING_AT = 5` (`:88-89`), con tic de 1 s (`:871-889`).
- **Revelación:** `REVEAL_CHOREO` (`:132-137`), ligado a `--reveal-*` de `opponentPanel.css` (protegido); `SHAKE_MS` y `PAUSE_MS` (`:1788`); `RED_REVELACION_MS = 6000` (`mesaCore.js:395`).
- **Fichas y celebración:** `VIAJE_MS = 1100`, `VIAJE_ESCALON_MS = 90`, `CELEBRACION_TOPE_MS = 2500` y `VIAJE_DESVANECIDO_MS = 240` (`celebracionCore.js:17-28`); pantalla de victoria (`useCoreografia.js` / `coreografiaCore.js`).
- **Otros:** pozo «+N» 600 ms (`:474`), `CHIP_TOGGLE_MS` (`:1684`), recarga `TOPE_RECARGA_MS` (`mesaIACore.js:29`).
- **El arnés depende de 595, 750 y 1.950:** `diagDSK.mjs:6475` (vuelos) y `:13694`, `:13788`, `:13802` (barajado, modo `congelado`).

**El punto «entre manos»:**
- La mano termina en PAYOUT.
- «Siguiente mano» solo se ofrece si `isPayoutPhase && !isClearing && !isShuffling && !ceremony && !recarga` (`:2665`). Al pulsarlo: `setIsClearing(true)` → 300 ms → `beginHand()` (`:2676-2686`).
- La primera mano empieza con «Iniciar mano» (`:2521-2531`).
- **El sitio es `commitNewHand` (`:1887`):** todas las manos pasan por ahí, va antes del barajado y no hay ninguna mano en curso.
- La lectura debe **congelarse en un ref para toda la mano**. Leerla en vivo en `:2765`, `:834` u `:818-831` aceleraría el DEAL_3 de la mano en curso si el jugador lo activa durante BET_1.

**J-4. Funciones que se quedan sin otra puerta.**
- **Sonido:** hoy su única puerta viva es el ⋮. No sale en este plan. Cuando 1a active la fila del ⚙ tendrá dos puertas.
- **Tapetes:**
  - Hoy su única puerta es el ⋮.
  - **Si sale antes de que el ⚙ tenga tapetes,** quien tenga puesto grafito, azul, vinotinto o tricolor se queda con él sin poder cambiarlo, porque `useTapetes` sigue aplicando `ajilei.tapete` (`useTapetes.js:124-128`).
- **Cuenta / «Cambiar nombre»:**
  - **Se queda sin puerta** si «Cuenta» sale antes de 1b: `cuenta.cambiarNombre` solo se consume en `GameTable.jsx:2844-2850`.
  - «Cerrar sesión» conserva otras puertas: el ⚙ (`Lobby.jsx:327`), el Bautizo (`App.jsx:774`) y CuentaSinRed (`App.jsx:780`).
- **Efectos colaterales de cambiar las entradas:**
  - Cambia el espejo `PANEL_H` (`useUtilitiesMenu.js:46`, `:97`) y las listas de `menuEntradas.js`.
  - `u1` y `menu-movil` cuentan las entradas (`diagDSK.mjs:7950-8004`).
  - El modo `tapetes` entra por `.util-item-tapetes` (`diagDSK.mjs:11888-11892`): **sin esa entrada, `tapetes` se queda sin puerta de entrada.**

### K · Inventario y venta de tapetes

**K-1.** Ninguna tabla de inventario, compras, artículos ni tienda: no encontrado. Solo aparecen menciones en comentarios (`eco1a:153`, `eco1g:6`) y el tipo `'compra'` del CHECK del libro (`eco1a:177`).

**K-2. El libro.**
- **Tabla `public.movimientos`** (`eco1a:162-187`):
  - `id bigint identity`
  - `jugador_id` (FK cascade)
  - `tipo text`
  - `monto bigint` (con signo, `<>0`)
  - `saldo_tras bigint` (`>=0`)
  - `ref_tipo`, `ref_id`
  - `clave_idem text unique`
  - `motivo` (obligatorio en `ajuste_admin`)
  - `creado_en`
  - Índice `(jugador_id, creado_en)` (`:189-190`).
- **Tipos** (CHECK `movimientos_tipo_chk`, `:175-180`): `bono_bienvenida`, `constancia`, `video`, `entrada_ia`, `recarga_ia`, `salida_ia`, `abandono_ia`, **`compra`**, `ajuste_admin`, `garantia_pvp`, `liberacion_pvp`, `resultado_pvp`.
- **La billetera no se actualiza por trigger.** El único que escribe el saldo es `aplicar_movimiento(p_jugador, p_tipo, p_monto, p_clave, p_ref_tipo, p_ref_id, p_motivo)` (`eco1a:420-513`), una función interna revocada a todos (`:790`). Sus pasos:
  1. Comprueba la clave idempotente.
  2. Bloquea `billeteras … for update`.
  3. Vuelve a comprobar la clave ya con el bloqueo.
  4. Sin saldo devuelve `'saldo_insuficiente'`, sin `raise`.
  5. Pone la marca `ajilei.libro`, hace el UPDATE y el INSERT.
  6. Traduce `unique_violation` y `check_violation`.
- **Molde de una RPC que cobra:** `sentarse_ia(...)`. La versión vigente está en `eco1d:420-528` (la original en `eco1c:356-455`):
  1. Comprueba `auth.uid()`.
  2. Aplica el límite por minuto con `contar_intento_dinero` (sin `raise`).
  3. Bloquea `for update`.
  4. Idempotencia por token: `repetido` / `token_en_uso`.
  5. Valida los argumentos.
  6. Mira la válvula.
  7. Comprueba el saldo.
  8. Llama a `aplicar_movimiento(v_uid,'entrada_ia',-p_entrada,'entrada_ia:'||v_id,…)`.
  9. Devuelve siempre un compuesto relleno.
  - Grants a `authenticated, service_role` (`eco1d:764`, `:768`).
- Otro descuento: `recargar_ia` (`eco1d:536-613`).
- **El precio tiene que vivir en el servidor.** `config/tapetes.js` sería solo un espejo.

**K-3. Cómo se aplica el tapete.**
- Va como `data-tapete` **en `<body>`** (`useTapetes.js:126`) y se retira al desmontar la mesa (`:127`).
- El verde no tiene regla: sin atributo, mandan los tokens de `:root`.
- La hoja es `src/styles/tapetes.css`, global (`main.jsx:13`) y **no protegida**.

| Tapete | Tokens: 5 paradas `--green-*` + `--surface-game` + `--surface-area` + `--surface-area-light` | Disco |
|---|---|---|
| verde | `theme.css:42` `#09170e` · `:48` `#0b1c11` · `:49` `#153922` · `:50` `#1b482c` · `:51` `#235c38` · `:71` `rgba(27,72,44,.88)` · `:73-74` `rgba(9,23,14,.45/.30)` | `tapetes.css:108` |
| grafito | `tapetes.css:158-168` · `#0d0d0f` `#0f1012` `#202224` `#282b2e` `#34373b` · `rgba(40,43,46,.88)` · `rgba(13,13,15,.45/.30)` | `:109` |
| azul | `tapetes.css:177-187` · `#090f17` `#0b121c` `#152539` `#1b2f48` `#233c5c` · `rgba(27,47,72,.88)` · `rgba(9,15,23,.45/.30)` | `:110` |
| vinotinto | `tapetes.css:196-206` · `#1b080d` `#210910` `#470f1e` `#5a1426` `#731931` · `rgba(90,20,38,.88)` · `rgba(27,8,13,.45/.30)` | `:111` |
| tricolor | `tapetes.css:226-256` · `#0c131c` … `#334d70` · `rgba(39,60,88,.88)` … más `--tap-tri-*` (amarillo, azul, rojo, p1–p4, viñetas). **Además sustituye `background` por especificidad** (`:267-279`, `:288-301`), y ese degradado está **copiado** en `luz.css:139` y `escala.css:222` | `:115` (degradado) |

- **Grafito, azul y vinotinto son, cada uno, un conjunto de 8 tokens** bajo un solo selector `body[data-tapete="X"]`. Un tono claro u oscuro es **otro conjunto de 8**, por ejemplo con un segundo atributo (`data-tapete-tono`).
- Las rampas siguen el factor `k` de Tapetes v1.1 §2, así que los tonos pueden derivarse con la misma regla.
- Los tokens se consumen por herencia en `gameTable.css` (20 usos) y `opponentPanel.css` (1). **No hace falta abrir ningún protegido.**
- La decisión de que el tricolor no tenga tonos evita tocar tres hojas.

**K-4. El modo `tapetes`.**
- Está en `scripts/diagDSK.mjs:11659-12366` (`runTapetes` en `:12030`).
- No está en `humo` ni en la §6 de Invariantes. Lo vigilan INV-08, INV-10 y la §4.
- **Qué mide:**
  1. **Δ = 0 en vivo**: 2 caminos de render (`TAP_MESAS = [5, 2]`) × 2 vistas (1920×937 y 1024×768) = **4 páginas**.
     - En cada una se pulsan los 4 tapetes no verdes y se miden 18 anclas (`TAP_ANCLAS`, `:11766-11772`).
     - Comprueba la vuelta al verde y el contrato de color (`tapJuzgaBanda`, `:11913-11985`: escalera de L, alfas, matiz ±8°, bandas del tricolor).
     - Comprueba el disco frente al base y que el verde sea igual a `:root`.
  2. **Compra:** 2 páginas.
  3. **Móvil con tricolor sembrado:** 360×640 y 740×360.
  4. **Capturas:** 2 mesas × 2 vistas × 5 tapetes = **20 páginas**, con «Iniciar mano» y espera del TURNO.
- **Tiempo:** **190 s** según `docs/reportes/AJILEI_ARN-3_Fase0_Informe_v1.0.md:41`. La corrida de hoy está en M-1.
- **Extenderlo a tonos sin duplicar el tiempo:**
  - Los tonos van **dentro del bucle en vivo de (1)**: alternar el tono en la página ya cargada y repetir `tapLeeTokens`, `tapDelta` y `tapJuzgaBanda`. Cuesta ~0,3 s por combinación.
  - En (4), **dos fotos por página** tras `tapEsperaTurno`, sin volver a navegar.
  - La puerta «verde por defecto = `:root`» se queda solo para el verde.
- **Y entrar por otra puerta:** hoy `tapetes` llega por `.util-item-tapetes` del ⋮. Si los tapetes pasan al ⚙, el modo tiene que entrar desde el lobby y aplicar el tapete antes de ir a la mesa.

### L · Claves del aparato e invariantes

**L-1. Censo de INV-12.**
- **El censo vive en la prueba**, no en el documento: `scripts/testClavesAlmacen.test.js:19-35`.
- 15 claves, todas de `localStorage` salvo `ajilei.recargaPorChunk`, que es de `sessionStorage`:
  - `ajilei.sound`
  - `ajilei.idioma`
  - `ajilei.nivel` (legado)
  - `ajilei.retoConfig`
  - `ajilei.consultas`
  - `ajilei.tapete`
  - `ajilei.tapetes.comprados`
  - `ajilei.fraseVictoria`
  - `ajilei.melodiaCelebracion`
  - `ajilei.salaPendiente`
  - `ajilei.salaConfig`
  - `ajilei.recargaPorChunk`
  - `ajilei.dispositivo`
  - `ajilei.saldoVisto`
  - `ajilei.sumamente`
- **11 accesores** (`:38-50`): `memoriaChips.js`, `salaPendiente.js`, `sinRepetir.js`, `SoundContext.jsx`, `useIdioma.js`, `useTapetes.js`, `useUtilitiesMenu.js`, `main.jsx`, `dispositivo.js`, `saldoRecordado.js` y `sumaContador.js`.
- **Qué comprueba la prueba:**
  1. Ningún literal `ajilei.*` fuera del censo.
  2. Solo los accesores tocan el almacén.
  3. Cada clave sigue usándose.
  4. `sessionStorage` solo en `main.jsx`.
- Fuera del censo: ninguna.
- La fila del documento (`Invariantes:52`) dice «12 claves, 8 accesores» y está vieja.
- Convención: `ajilei.<cosa>`.

**Claves que añadiría CFG-1:**

| Clave propuesta | Sub-tanda | Nota |
|---|---|---|
| `ajilei.sound` | 1a | **Ya existe.** No se añade |
| `ajilei.saldoOculto` | 1a | El ojito. Valores `'si'`/`'no'`. Accesor nuevo o el de la píldora |
| `ajilei.partidaRapida` | 1e | Lectura solo en `commitNewHand` |
| `ajilei.tapete.tonos` | 1f | Solo si el tono se guarda en el aparato además de en el servidor (pregunta P-9). Formato `id:tono,…` como el CSV de comprados |
| `ajilei.tapetes.comprados` | 1f | **Sale del censo** cuando el inventario pase al servidor (Tienda §7: no se reconoce). Retirarla exige quitarla de la prueba |

Cada clave nueva entra en `testClavesAlmacen.test.js`, y su accesor en la lista de `:38-50`.

**L-2. Invariantes que toca cada sub-tanda.**
- **1a:**
  - INV-07: los 44 en lobby y menú, más una puerta nueva por zona en `lob`/`retar` o en un modo `cfg`.
  - INV-12: claves.
  - INV-45: `data-sin-pantalla-completa` en el `mailto:` y en «Copiar».
  - INV-46: el ojito no es otra cifra; tapa, no cambia la fuente.
  - INV-08: el ojito no puede ser un segundo oro.
  - INV-28: los sonidos del lobby.
- **1b:**
  - INV-67: avatar, país y estado entran por `mini_perfil` sin uuid ni correo ajeno; prueba A10.
  - INV-56: un fallo al leer el perfil no lleva a la Portada.
  - INV-50.
- **1c:**
  - INV-66: la cascada es la única excepción al libro inmutable.
  - INV-56.
- **1d:**
  - INV-67: el correo propio solo de la sesión.
- **1e:**
  - INV-07: la fila de Tapetes desaparece.
  - INV-59.
  - Las reglas de reparto: el arnés depende de 595, 750 y 1.950.
- **1f:**
  - INV-08, INV-10 y el modo `tapetes`.
  - INV-12.
  - INV-46: una compra mueve la cifra solo por el libro.
- **Invariantes nuevos, solo enunciados:**
  - **INV-68**: un solo estado de sonido, el mismo en ⚙ y ⋮.
  - **INV-69**: «Ocultar saldo» solo tapa la píldora del lobby; nunca la mesa, los rankings ni el mini-perfil.
  - **INV-70**: «Partida rápida» se lee en `commitNewHand` y no cambia nada de una mano en curso; solo el vuelo del reparto; nunca en PvP.
  - **INV-71**: borrar la cuenta borra todo por cascada salvo `bonos_bienvenida`; solo con sesión verificada y sin mesa abierta.
  - **INV-72**: los cosméticos se poseen solo por el inventario del servidor y se pagan solo por el libro.
  - **INV-73**: un cambio de nombre cada 30 días, impuesto en el servidor.
  - **INV-74**: cambiar el correo no mueve la huella del bono.

### M · Línea base

Medida hoy, en este orden, en el mismo aparato:

| Pieza | Resultado | Tiempo |
|---|---|---|
| `npm run build` | OK. Paquete principal `index-B-yuWJKT.js` **632,54 kB (gzip 186,11 kB)**; diferido `GameTable-BfGsqbLN.js` **95,91 kB (gzip 30,49 kB)**. CSS: `index` 129,78 kB (gzip 24,59), `GameTable` 125,37 kB (gzip 20,52). `heptacoin.webp` 1.064,95 kB. Aviso de trozo > 500 kB (el de siempre) | ~1 s |
| `vitest run scripts/ src/` | **79 archivos, 1.896 pruebas, todas en verde** | 6,7 s |
| `npm run lint` | **21 problemas (20 errores + 1 aviso)**. 19 en `GameTable.jsx` (refs en el render: `:423`, `:429`, `:2429`, `:2438`, `:2440`, `:2443`, `:2451`, `:2453`, `:2456`, `:2469`, `:2474`; set-state-in-effect: `:772`, `:809`, `:841`, `:858`, `:1643`, `:1697`; immutability: `:884`; el aviso, sin regla, en `:844`). Uno en `CardImage.jsx:16` (only-export-components). Uno en `SoundContext.jsx:44` (only-export-components). **Los 21 de siempre** | 8,2 s |
| `diagDSK lob` | **Verde** · código 0 · aislamiento verde (11 contextos) | 42 s |
| `diagDSK rnk` | **Verde** · código 0 · aislamiento verde (11 contextos) | 12 s |
| `diagDSK suma` | **Verde** · código 0 · aislamiento verde (16 contextos) | 57 s |
| `diagDSK tapetes` | **Verde** · código 0 · aislamiento verde (28 contextos; 30 llamadas a Supabase contestadas por el arnés, 0 escapadas). Corre en 5173 con bypass | 189 s (el informe de ARN-3 decía 190) |
| `diagCEL0 celebracion` | **Verde** · 0 fallos (0 conocidos, 0 nuevos) · control verde · código 0 · aislamiento verde (38 contextos). Las capturas van a `../_cel2/`, fuera del repo | 484 s |

Los modos se corrieron uno detrás de otro, nunca dos a la vez.

---

## 4 · Riesgos

1. **RI-1 · «Partida rápida» leída en vivo.** Si se lee en `GameTable.jsx:2765`, `:834` u `:818-831` y no se congela en `commitNewHand` (`:1887`), activarla en BET_1 acelera el DEAL_3 de la mano en curso.
2. **RI-2 · El barajado es protegido.**
   - Los 1,95 s viven en `gameTable.css:1083` (protegido), sincronizados con el `setTimeout(…, 1950)` de `GameTable.jsx:1891-1895`.
   - Acelerar el barajado exige una de dos cosas: tocar el protegido (STOP y autorización) o una regla de anulación de `animation-duration` con más especificidad en una hoja aditiva, desplazando a la vez el `setTimeout`.
   - Si se desincronizan, el abanico queda cortado o la mesa se queda esperando.
   - El volteo del DEAL_3 (0,30 s) tiene el mismo problema (`gameTable.css:1099-1100`).
3. **RI-3 · El arnés cuenta con 595, 750 y 1.950** (`diagDSK.mjs:6475`, `:13694`, `:13788`, `:13802`). El interruptor tiene que estar apagado por defecto, y el arnés entra siempre con el almacenamiento limpio.
4. **RI-4 · Sacar Tapetes del ⋮ antes de que el ⚙ tenga tapetes** deja a quien tenga un tapete puesto sin poder cambiarlo. Además, el modo `tapetes` pierde su puerta de entrada (`diagDSK.mjs:11888-11892`).
5. **RI-5 · Sacar «Cuenta» del ⋮ antes de 1b** deja «Cambiar nombre» sin ninguna puerta.
6. **RI-6 · La RLS de `profiles` deja actualizar cualquier columna de la fila propia** (`0001:196-202`).
   - El freno de 30 días, el avatar comprado y el país solo son fiables si los impone el servidor (trigger o RPC).
   - Hoy un cliente puede reescribir `username` sin límite y también `created_at`.
   - Si el avatar es un artículo comprado, el cliente podría escribirse un avatar que no tiene. Hace falta validarlo contra el inventario en el servidor.
7. **RI-7 · Desempate por nombre.** Cambiar el nombre puede mover el puesto en un empate de los rankings (`rnk1a:490`, `:503`, `:521`, `:534`, `:574-593`).
8. **RI-8 · Borrado de cuenta.**
   - Borra en cascada la sala de un anfitrión **con los asientos de los demás** (`sal_a:90`, `:148`).
   - `sala_esperando_de` no ve las salas `activa`.
   - `mi_mesa_ia()` usa `auth.uid()` y no sirve con clave de servicio.
   - Borrar tabla por tabla falla por los triggers del libro. **Solo `auth.admin.deleteUser`** (o `delete from auth.users`).
   - Borrar con una mesa IA abierta se salta `cerrar_partida_abierta`.
9. **RI-9 · `mini_perfil` cambia de forma.** Hace falta `drop` + `create` + `grant`. La prueba A10 exige 13 columnas y rechaza los nombres `*_id`. El cliente y la imitación también cambian (`rankingApi.js:68-74`, `bancoImitado.js:432`).
10. **RI-10 · El ojito en `BarraSuperior`.** La píldora es compartida por 7 pantallas. Si el estado vive en el componente, tapa también Rankings, que debe ignorarlo. Hay que pasarlo como prop **solo desde `Lobby`**.
11. **RI-11 · `mailto:` y «Copiar» sin `data-sin-pantalla-completa`.** La petición de pantalla completa del `pointerup` gasta la activación y el portapapeles falla. Ya hay tres enlaces que hoy incumplen INV-45 (D-2).
12. **RI-12 · Cambio de correo sin «Secure email change».** El acceso es solo por OTP al correo. Una errata en el correo nuevo sin confirmación doble **deja la cuenta inaccesible**. La configuración no está en el repo.
13. **RI-13 · Commit en «Acerca de».** Si la compilación de Cloudflare no expone el SHA ni tiene `.git`, el `define` cae al respaldo. Hay que decidir qué se ve en ese caso, y el respaldo no puede romper la build.
14. **RI-14 · Compra a mitad de mano.** Hoy se «compra» un tapete durante la mano y sin cobrar. Al cobrar de verdad (1f) eso tiene que salir de la mesa (Tienda §7), o una compra tocaría la cifra durante una mano. Sería una segunda cifra móvil frente a INV-46.
15. **RI-15 · Reconocer o no los «comprados» locales.** Con la decisión de no reconocerlos, quien hoy tiene puesto un tapete «comprado» gratis vuelve al verde al llegar 1f. Es un cambio visible; conviene avisarlo.
16. **RI-16 · Prefijos de textos.** `textos.test.js:95` rompe con un prefijo `cfg.` o `menu.` nuevo.
17. **RI-17 · El tricolor está copiado** en `luz.css:139` y `escala.css:222`. No se toca porque no lleva tonos, pero cualquier cambio de su fondo tendría que ir a tres hojas.

---

## 5 · Recomendaciones

**Orden propuesto: 1a → 1c → 1b → 1f → 1e → 1d.**
- 1e (el ⋮) **tiene que ir después de 1b y de 1f**. Si no, el nombre y los tapetes se quedan sin puerta (RI-4, RI-5).
- 1c es independiente y de servidor. Adelantarla deja el riesgo del borrado cerrado pronto.
- 1d depende de una configuración del panel (pregunta P-8) y va al final como estaba previsto.

| # | Recomendación | Sub-tanda | Minutos |
|---|---|---|---|
| R-1 | **Sonido:** enchufar la fila del ⚙ a `useSoundContext` y quitarle «Pronto». La pastilla pasa a enseñar «Sí/No». Sin clave nueva. Añadir la regla `is-off` del ⋮, que falta | 1a | 20 |
| R-2 | **Versión:** `define` en `vite.config.js` con `__APP_VERSION__` (de `package.json`) y `__APP_COMMIT__`. El commit sale de esta cadena: `WORKERS_CI_COMMIT_SHA` → `CF_PAGES_COMMIT_SHA` → `git rev-parse --short=7 HEAD` → `'local'`. Mostrarlo en «Acerca de» y llevar la línea a `textos.es.js`. Victor fija primero el número de versión (P-3) y mira la variable en el panel (P-2) | 1a | 25 |
| R-3 | **Sugerencia:** `<a href="mailto:soporte@ajilei.io?subject=…&body=…">` con `data-sin-pantalla-completa`. Cuerpo: nombre, versión+commit, `navigator.userAgent` y el idioma. Botón «Copiar correo», también con `data-sin-pantalla-completa`, sacando un helper `copiarTexto()` en `src/lib/` con respaldo y aviso. Reutilizarlo en `SalaEspera.jsx:336` y `:353` es opcional y no entra aquí. Aprovechar para poner el atributo en los tres enlaces que hoy incumplen INV-45, si el rector lo admite en esta campaña | 1a | 35 |
| R-4 | **Ojito:** el estado vive en `Lobby` con la clave `ajilei.saldoOculto` y baja a `BarraSuperior` como prop (`saldoOculto`, `onOjito`) **solo desde `Lobby`**. Las demás pantallas no la pasan, así que Rankings lo ignora por construcción. La cifra tapada conserva su caja (INV-46: es la misma fuente). El ojito no es oro (INV-08). Decidir si también tapa el conteo del aviso y del video (P-5) | 1a | 40 |
| R-5 | **Tocables (camino Z):** una hoja aditiva `src/styles/tactilLobby.css` con `::after` `min(0, 50% − 22px)` en ⚙, casa, flecha, avatar, chips, ± y «Unirme». El «+» de la píldora, a lámina. Las filas «Acerca de» y «Cerrar sesión» necesitan `min-height: 44px` (mueve 3,5 px por fila en 360): lámina corta o visto bueno. Corregir el comentario falso de `lobby.css:682` | 1a | 60 (+ lámina) |
| R-6 | **Puerta nueva del arnés:** extender `lob`/`retar` (o un modo `cfg` nuevo) con zona ≥ 44 por barrido en las 4 celdas. Hoy no hay ninguna puerta para estos tocables (F-2) | 1a | 45 |
| R-7 | **Eliminar cuenta:** Edge Function `eliminar_cuenta` desplegada con `--use-api`. Pasos: verificar el JWT (`/auth/v1/user` o JWKS) → comprobar que no hay mesa IA abierta (llamar a `mi_mesa_ia` con el JWT del usuario, o una función nueva `tiene_partida_abierta(uid)` revocada y con clave de servicio, que una mesa IA, `sala_esperando_de` y **las salas `activa`**) → `auth.admin.deleteUser(uid)`. Ningún DELETE manual. Una prueba en el guion PGlite que confirme la cascada y la huella (la 18 ya cubre la huella). Ventana con confirmación «ELIMINAR». En el cliente, reutilizar `App.cerrarSesion` | 1c | 120 |
| R-8 | **Perfil (servidor):** columnas `avatar text`, `pais text`, `estado text` y `nombre_cambiado_en timestamptz` (sin `_id`). Un trigger que, cuando `old.username <> new.username`, exija 30 días y selle la fecha. Valores válidos de avatar, país y estado comprobados en el servidor. Considerar `revoke update` + `grant update (username, avatar, pais, estado)` para cerrar `created_at` y `nombre_cambiado_en` al cliente (RI-6). `mini_perfil` con `drop` + `create`, y A10 a 16 columnas | 1b | 90 |
| R-9 | **Perfil (cliente):** una pantalla única con tres puertas: la figurita del lobby (`Lobby.jsx:201`), la cabecera del ⚙ (`Lobby.jsx:308`) y «Editar» del mini-perfil (prop `onEditar` hasta `App`). Reutilizar el Bautizo en edición para el nombre. Lámina antes | 1b | 150 (+ lámina) |
| R-10 | **Correo en el perfil:** el correo propio se sigue leyendo solo de la sesión (I-3). El cambio va con `supabase.auth.updateUser({ email })` y el flujo de confirmación; no toca `bonos_bienvenida` | 1d | 60 |
| R-11 | **Banderas:** solo hacen falta las de los países que se ofrezcan. Recomendación: emoji de bandera más una fuente de banderas para Windows (~80 KB woff2, a demanda solo en la pantalla del perfil), o SVG propios a demanda. Venezuela con sus estados es una lista fija en `config/` | 1b | 30 |
| R-12 | **El ⋮:** quitar Tapetes y Cuenta de `menuEntradas.js` y del JSX y añadir «Partida rápida» (icono en una hoja no protegida). Actualizar `PANEL_H` y `PANEL_H_HORIZONTAL`, y `u1` y `menu-movil`. «Partida rápida» se lee en `commitNewHand` y se guarda en un ref; afecta solo al vuelo del reparto (0,595, 120, 400 y, si el rector lo quiere, 300/600/900 y 2.000 del DEAL_3). **No** toca el barajado (protegido, RI-2), salvo decisión expresa (P-10). Una prop `contraIAS` en `GameTable` deja preparado MES-PvP | 1e | 75 |
| R-13 | **Inventario:** tabla genérica `inventario (jugador_id → profiles on delete cascade, tipo text, articulo text, tono text, adquirido_en, unique(jugador_id, tipo, articulo))` y precio en el servidor. RPC `comprar_articulo(p_tipo, p_articulo, p_token)` con el molde de `sentarse_ia`: sesión, límite, `for update`, `aplicar_movimiento(…,'compra',-precio,'compra:'||tipo||':'||articulo||':'||uid,…)`. RPC `elegir_tono`, gratis. El cliente deja de escribir `ajilei.tapetes.comprados`. Comprar **solo fuera de la mesa** (Tienda §7) | 1f | 150 |
| R-14 | **Tonos:** dos conjuntos más de 8 tokens por tapete de pago, con un segundo atributo `data-tapete-tono="claro|oscuro"` en `body`, en `tapetes.css`. Derivados con el factor `k` de Tapetes v1.1 §2. Verde y tricolor sin tonos. El modo `tapetes` alterna el tono dentro de la página (K-4), y entra desde el ⚙ en vez de desde el ⋮. Lámina de tonos antes | 1f | 90 (+ lámina) |
| R-15 | **Higiene de documentos** (sin código): poner al día la fila de INV-12 (15 claves, 11 accesores), la lista de protegidos (seis), la fuente de INV-07 (Menu v1.5) y los comentarios viejos de §2. Que el normativo nuevo de CFG-1 deje fijado qué gana en las contradicciones a–h | cierre | 30 |

---

## 6 · Preguntas al rector y a Victor

1. **P-1.** ¿La «figurita» que sale del ⋮ es la entrada **«Cuenta»** (la silueta que abre «Cambiar nombre» y «Cerrar sesión»)? Es la única figura humana del panel.
2. **P-2.** **Victor, panel de Cloudflare:**
   - ¿El proyecto es Workers Builds o Pages?
   - ¿Qué comando de build usa?
   - ¿Está `WORKERS_CI_COMMIT_SHA` o `CF_PAGES_COMMIT_SHA`?
   - ¿La compilación tiene `.git`?
3. **P-3.** ¿Qué número de versión arranca? Hoy `package.json` dice `0.0.0`. ¿`1.0.0`, `0.9.0`…?
4. **P-4.** El cuerpo prellenado de la sugerencia, ¿lleva el uuid de la cuenta, o solo el nombre? El uuid facilita encontrar la cuenta, pero INV-67 no deja enseñarlo en la app.
5. **P-5.** El ojito, ¿tapa también la cifra mientras la píldora **cuenta** (aviso de saldo, celebración del video), o esos momentos la enseñan siempre?
6. **P-6.** Desde la victoria se abre el mini-perfil propio dentro de la mesa. ¿Su «Editar» abre el perfil allí mismo, o solo se edita fuera de la mesa (Rankings §7.2)?
7. **P-7.** Tras eliminar la cuenta, ¿se borran también las preferencias del aparato (`ajilei.sound`, `ajilei.idioma`, `ajilei.tapete`…), o solo lo que hoy borra «Cerrar sesión»?
8. **P-8.** **Victor, panel de Supabase:** ¿está activo «Secure email change» (confirmar en las dos direcciones)? Sin eso, 1d no debe salir (RI-12).
9. **P-9.** El tono elegido de cada tapete, ¿vive solo en el servidor (con el inventario) o también en el aparato, para pintarlo antes de que llegue la red?
10. **P-10.** «Partida rápida acelera solo la animación del reparto»:
    - ¿El **barajado** (1,95 s, en un protegido) cuenta como reparto?
    - ¿Y los volteos y la espera del DEAL_3?
    - ¿Qué factor: ×0,5, o un tiempo fijo?
11. **P-11.** El ⚙ de las demás pantallas (Retar, Salas, Armar mesa, Sala de espera, PvP y Rankings) hoy dice «Pronto». ¿CFG-1 lo hace abrir la misma hoja, o solo el del lobby?
12. **P-12.** Al eliminar una cuenta que es anfitriona de una sala **activa** (no `esperando`), ¿se bloquea el borrado o se deja?
13. **P-13.** Quien vuelva a registrarse con el mismo correo tras borrar la cuenta empieza en 0 y sin bono, porque la huella sobrevive. ¿La ventana de aviso del borrado lo dice?
14. **P-14.** Contradicción **a**: ¿se retira de forma expresa la entrada «Saldo» inerte del ⋮ (Menu v1.1 §4) ahora que «Ocultar saldo» es solo el ojito del lobby? «Partida rápida» podría ocupar su sitio.
15. **P-15.** ¿Entran en CFG-1 los tres enlaces que hoy incumplen INV-45 (Google Play, la línea de SumaMente y los créditos), o se anotan para otra campaña?

---

## 7 · `git status`

```
On branch main
Your branch is up to date with 'origin/main'.

Untracked files:
  (use "git add <file>..." to include in what will be committed)
	docs/reportes/AJILEI_CFG-1_Fase0_Informe_v1.0.md
	docs/reportes/AJILEI_MOT-1_Fase0_Informe_v1.0.md
	docs/reportes/AJILEI_MOT-1_Fase1-0_Sonda_Informe_v1.0.md
	laminas/mon1/_entorno.txt
	laminas/mon1/lamina.html
	laminas/mon1/tiempos.json

nothing added to commit but untracked files present (use "git add" to track)
```

Solo el informe nuevo y lo de MOT-1, que ya estaba.
- Las corridas tocaron `dist/` y las carpetas `capturas-*`, que están ignoradas.
- Las sondas de F-1 viven en el scratchpad, fuera del repo.
- `supabase/functions/sonda_mot1/` no se tocó.
- El `vite preview` del puerto 4191 se cerró al terminar.

**STOP-0.**
