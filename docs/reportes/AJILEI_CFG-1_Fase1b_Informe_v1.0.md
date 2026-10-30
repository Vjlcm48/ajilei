# AJILEI · CFG-1 · Fase 1b · Perfil editable · Informe v1.0

**Escrito para:** el rector y Victor
**Ficha:** `AJILEI_CFG-1_Fase1b_v1.0.md` · **Base:** `main` en `e98aef8` · **Fecha:** 2026-10-30
**Estado:** **Validada por Victor (2026-10-30)**: A en la PC con el bypass, B en el S25 por túnel con `test1976` (sin cambiarle el nombre) y C en el servidor real con una cuenta desechable `+borrar1b`, en ventana de incógnito de la PC sobre `localhost:4173`, terminando con "Eliminar cuenta". Las tres, al 100 %. Las consultas opcionales del SQL Editor de C2 y C5 no se corrieron.

---

## Resumen

- **El jugador edita su perfil.** Una pantalla nueva (`src/screens/Perfil.jsx`) con las filas de la lámina (V1-A): Avatar, Nombre de usuario, De dónde eres y Correo · Pronto. Se llega por tres puertas: el avatar de la barra, la cabecera de la hoja ⚙ y «Editar» del mini-perfil propio. La flecha vuelve a la pantalla de origen.
- **El nombre** se cambia en el Bautizo real en modo edición, con un **freno de 30 días que vive en el servidor**. Solo mayúsculas no lo gastan. El aviso de 30 días sale solo si `nombre_libre` dice que el nombre está libre. Con el freno puesto, el editor se queda quieto con la fecha que da el servidor.
- **El lugar** es un país (243, con búsqueda sin tildes y alias) o ninguno. Venezuela pide el estado al instante, con «Sin estado» marcado. Se guarda solo, y se ve con su bandera en el perfil, el mini-perfil, la fila de dos líneas de Rankings y la hoja ⚙ (sin texto).
- **Las banderas** son de `country-flag-icons` 1.6.20 (MIT), copiadas a `public/banderas/3x2/`. Se piden con `<img>`, solo la que se pinta.
- **Los tres roces de Rankings** (lámina §6) quedan arreglados o comprobados, sin mover nada a la vista.
- **Arnés:** `diagDSK cfg` pasa a 16 puertas, con `cfg.perfil` y `cfg.freno`. `diagDSK rnk` gana `rnk-bandera` y `diagCEL0 celebracion` compara las dos tarjetas propias. Invariantes nuevas: INV-72, INV-73 e INV-74. El normativo pasa a Configuración v1.2.

---

## 1. Qué se hizo, mitad por mitad

### 1b-i · Servidor (STOP-B1, aprobado con el Ajuste A-1; publicado)

| Qué | Dónde |
|---|---|
| `profiles` gana `pais`, `estado` y `nombre_cambiado_en`, con tres CHECK. El estado solo va con `VE`, se usa `is not distinct from` y la lista tiene 24 códigos de tres letras | `supabase/migrations/20261030013000_cfg1b_perfil.sql:36-62` |
| Los vedados pasan a `username_vedado(text)`. El portero la llama y, si el nombre no cambia, no la mira (Ajuste A-1) | `…cfg1b_perfil.sql:69` y `:84` |
| El freno: `profiles_freno_nombre()`, BEFORE INSERT OR UPDATE y antes que el portero. Lanza AJ030 `nombre_frenado` con la fecha ISO en el `hint` | `…cfg1b_perfil.sql:130` |
| `nombre_libre(p)` y `mi_proximo_cambio()` | `…cfg1b_perfil.sql:175` y `:192` |
| `update` de `profiles` solo en `username`, `pais` y `estado` | `…cfg1b_perfil.sql:216` |
| `ranking_top` y `mini_perfil` con el lugar | `…cfg1b_perfil.sql:225` y siguientes |
| El guion, con 18 filas. El A10 de RNK-1 pasa a 17 columnas | `supabase/pruebas/cfg1b_verificacion.sql`, `supabase/pruebas/rnk1a_verificacion.sql:185` |
| El corredor lo declara | `scripts/eco/guionesCore.mjs:22` |

### 1b-ii · La pantalla de perfil (STOP-B2, aprobado)

| Qué | Dónde |
|---|---|
| Datos: 243 países (CLDR 47) y las banderas, generados una vez | `scripts/gen-paises.mjs`, `src/config/paises.js`, `public/banderas/3x2/` (243, 159 KB) y `public/banderas/LICENSE` |
| Los 24 estados | `src/config/estados.js` |
| Búsqueda, texto del lugar y validación, con 13 pruebas | `src/lib/lugarCore.js:42`, `src/lib/lugarCore.test.js` |
| La bandera, con el isotipo en tenue sin país | `src/components/Bandera.jsx`, `src/styles/bandera.css` |
| La capa del perfil propio | `src/lib/perfilApi.js:44` |
| `useAuth`: el lugar, el freno (`proximoCambio`), `comprobarNombre`, `cambiarLugar`, y `cambiarNombre` traduce AJ030 | `src/hooks/useAuth.js:270`, `:389`, `:410` y `:419` |
| El Bautizo en edición: `bloqueadoHasta`, `onComprobar`, la ventana de 30 días, Intro, tarjeta opaca, de ancho fijo y arriba en el teléfono, y «Cancelar»/«Cerrar» a 44 | `src/screens/Bautizo.jsx:61`, `:164` y `:220`, `src/styles/bautizo.css:45` |
| La pantalla | `src/screens/Perfil.jsx:232`, `src/styles/perfil.css` |
| `App`: la pantalla, `desdePerfil` y `cuenta.abrirPerfil` | `src/App.jsx:174`, `:314` |
| Las puertas de la barra (lobby, carcasa, Salas, Sala de espera, PvP) | `src/components/PantallaChips.jsx:150`, `src/screens/Lobby.jsx`, `SalaOpciones.jsx`, `SalaEspera.jsx`, `PartidaPvP.jsx` |
| La cabecera de la hoja ⚙ como botón | `src/components/HojaConfiguracion.jsx:176`, `src/styles/hojaConfiguracion.css:142` |
| «Editar» del mini-perfil | `src/components/MiniPerfil.jsx:181`, `src/screens/Rankings.jsx:318` |
| El Bautizo de la mesa también lleva el freno | `src/components/GameTable.jsx:2849` |
| Textos `perfil.*` | `src/config/textos.es.js`, `src/config/textos.test.js` |
| Banco imitado: perfil, freno, `nombre_libre`, `mi_proximo_cambio`, el lugar en las lecturas y los sembrados con lugar. Mandos `?cfg=nombre-…` | `src/dev/bancoImitado.js:503`, `src/dev/billeteraFalsa.js:218`, `src/dev/sembradosRanking.js` y sus pruebas en `src/dev/bancoImitado.test.js` |

### 1b-iii · Lo elegido en el resto del juego, arnés y documentos

| Qué | Dónde |
|---|---|
| `traducirFilaTop` y `traducirPerfil` copian `pais` y `estado`, validados | `src/lib/rankingApi.js:50` y `scripts/testRnk1c.test.js` (prueba nueva) |
| Mini-perfil: la pastilla del lugar pasa de rayada a lisa, con bandera y texto. Sin país, el isotipo sin filete | `src/components/MiniPerfil.jsx:153`, `src/styles/miniPerfil.css:116` |
| Rankings: la fila de dos líneas en las dos pestañas y en la banda; la fila sigue en 56 | `src/screens/Rankings.jsx:80`, `src/styles/rankings.css:170` |
| Hoja ⚙: la bandera sin texto detrás del nombre | `src/components/HojaConfiguracion.jsx:190` |
| Los tres roces de Rankings | `src/styles/tactilLobby.css:161` (§6) |
| `diagDSK cfg`: perfil y Rankings en `cfg.zona` y `cfg.solape`, también con 15 «M»; puertas `cfg.perfil` y `cfg.freno` | `scripts/cfg/cfg.mjs:539`, `:573` y `:608` |
| `diagDSK rnk`: `rnk-bandera` | `scripts/rnk/rnk.mjs:42` |
| `diagCEL0 celebracion`: la tarjeta de la victoria sin «Editar» | `scripts/diagCEL0.mjs:1438` |
| Normativo y registro | `docs/AJILEI_Configuracion_v1.2.md` (§12 nuevo; la v1.1 queda marcada «Sustituido») y `docs/AJILEI_Invariantes_v1.0.md` (INV-72, INV-73 e INV-74; INV-07 e INV-67 al día; recuento de 73 filas) |

**Los tres roces de Rankings** (§0-14), medidos en la app real antes y después, en nueve celdas (de 360 a 1920) y con DevLocal y con 15 «M»:
- **(a)** El ⚙ con la casa en 915×412: **ya no aparece en la app.** La lámina lo vio con su propia hoja. No se tocó nada para él; lo vigila `cfg.solape` en Rankings.
- **(b)** El «+» con el ⚙, con un nombre ancho en `.sal`: medía 7,73 px en 360, 4,80 en 390 y 2,64 en 412.
  - La zona del ⚙ ya no crece hacia la izquierda: crece el doble hacia el borde de la pantalla.
  - La del «+» se corre 2 px a la izquierda, sobre su propia píldora.
  - Ahora: 0 en todas.
- **(c)** La casa y la flecha con la primera pestaña, por debajo de 390: medía 0,89 px en 360. Su zona sube −3,25 px solo en Rankings. Ahora: 0 en 360, 375, 380 y 389.

---

## 2. Dónde me aparté de la lámina y por qué

- **La ventana de 30 días va dentro del Bautizo**, no en la pantalla. Así el «Cambiar nombre» de la mesa también tiene freno y aviso (D-10).
- **La tarjeta del editor tiene ancho fijo**, y en el teléfono la ranura de avisos reserva dos líneas. La lámina heredaba un ancho que cambiaba con el texto, de 313 a 370 px en 412 (D-13).
- **La bandera es su propia hoja** (`bandera.css`), no el §1 de `perfil.css`, porque sale en cinco sitios (D-9).
- **El «×» del buscador** es propio y de 44 (R-18).
- **Sin país, la hoja ⚙ pinta el isotipo** detrás del nombre (D-24). Así lo pide INV-74, igual que en el resto de los sitios.
- **Las variantes no elegidas** (V1-B, V3-B, V7-B/C) y los mandos de la lámina no se copiaron.

---

## 3. Desviaciones

**1b-i y 1b-ii** (aceptadas por el rector en los STOP-B1 y B2):

| | Desviación | Nota |
|---|---|---|
| D-1 | Los vedados, en `username_vedado(text)` | Con el Ajuste A-1, el portero no los mira si el nombre no cambia |
| D-2 | El freno es BEFORE INSERT OR UPDATE | En el alta, `nombre_cambiado_en` nace nula |
| D-3 | El freno devuelve la columna también al dueño de la tabla | El guion mueve el reloj apagando el disparador en su transacción |
| D-4 | `revoke update` también a `public` y `anon` | — |
| D-5 | Los códigos de estado de tres letras son el contrato | — |
| D-6 | `freno_nombre_hasta`, compartida por el disparador y `mi_proximo_cambio` | — |
| D-7 | `guionesCore` declara el guion nuevo | — |
| D-8 | Errcode propio, AJ030 | Comprobado de punta a punta en `cfg.freno` contra la ruta imitada. En el servidor real, prueba C (§6) |
| D-9 | La bandera, en `bandera.css` | — |
| D-10 | La ventana de 30 días, dentro del Bautizo | — |
| **D-11** | **Si `nombre_libre` dice que no, se envía sin ventana** | **Decisión consciente.** El servidor da el texto exacto (23505 o P0001) y el freno no se gasta. **Riesgo aceptado:** si el nombre se libera justo entre las dos llamadas, el cambio entra sin el aviso |
| D-12 | En edición, el rótulo dice «Nombre de usuario» | La entrada sigue con «Nombre de jugador» |
| D-13 | La tarjeta del editor es de ancho fijo y `border-box` | En el teléfono, la ranura reserva dos líneas |
| D-14 | La victoria no pinta «Editar» | `diagCEL0` compara con «Editar» escondido |
| **D-15** | **Con el freno puesto, el campo se queda quieto, también para un cambio solo de mayúsculas** | **Decisión consciente.** El servidor lo permitiría, pero la pantalla bloqueada no lo ofrece |
| D-16 | En el bypass, cambiar de nombre funciona contra el banco imitado | — |
| D-17 | El banco imitado usa una muestra de 10 vedados | — |
| D-18 | `avisar(clave, vars)` en `PantallaChips` | — |

**1b-iii:**

| | Desviación | Por qué |
|---|---|---|
| D-19 | El roce (a), ⚙ con casa en 915×412, no se reproduce y no se tocó nada para él | Medido en la app real en las nueve celdas. Lo vigila `cfg.solape` en Rankings |
| D-20 | Los roces se arreglan en `tactilLobby.css` §6, no en `rankings.css`. El de (c) es una cifra medida (−3,25 px), no una fórmula, y solo en Rankings (`[data-ranking]`) | Las zonas de la barra y la cabecera viven en `tactilLobby.css`. La holgura de (c) es de 0,75 px y una fórmula no la garantiza en todos los anchos: se midió en 360, 375, 380 y 389 |
| D-21 | `cfg.solape` no cuenta el cruce del «×» con el buscador | El «×» vive a propósito dentro del campo, en su relleno derecho. Su zona propia sí se mide (44) |
| D-22 | `rnk-bandera` rehace `textoLugar` con las dos listas | `lugarCore.js` importa sin extensión y el arnés lo carga antes del gancho de resolución |
| D-23 | `diagCEL0` mide la altura de la lámina en la tarjeta de Rankings y compara la de la victoria con la de Rankings con «Editar» escondido | Consecuencia de D-14 |
| D-24 | La hoja ⚙ sin país pinta el isotipo | INV-74: sin país, el isotipo, en todos los sitios |
| D-25 | La banda «Tu posición» lleva el lugar de la cuenta | `ranking_mio` no trae lugar. La lista sí, del servidor |
| D-26 | `cfg.freno` contesta `profiles` con una ruta propia sobre el banco imitado, encima de la de `contextoCap` | La de `contextoCap` contesta siempre la fila fija, también a un PATCH |

**Pendiente de higiene (O-1, no se cierra ahora):** la política de lectura de SUP-2a (`using (true)`) deja que cualquier jugador con sesión lea el `nombre_cambiado_en` de otro. Se cierra con un `grant select` por columnas: el cliente ya lee su fecha con `mi_proximo_cambio()`. Está anotado en Configuración v1.2 §12.7.

---

## 4. Las medidas

| Vara | Resultado |
|---|---|
| `npm run guiones` | Verde: 12 migraciones y 6 guiones × 2 pasadas, sin rastro (cfg1b 18/18, rnk1a 37/37 con el A10 en 17) |
| SQL Editor, base real (Victor) | cfg1b 18/18 PASA |
| `diagDSK cfg` | **Verde**, 16 de 16 puertas y consola limpia. Aislamiento verde, 2 min 16 s. La zona y el solape incluyen Rankings, el perfil en sus cinco estados y la pasada con 15 «M». `cfg.perfil` cubre 14 recorridos y `cfg.freno`, 12 casos |
| `diagDSK rnk` | **Verde**, 15 de 15. `rnk-bandera` 5/5; `rnk-fila` sigue en 56,00 |
| `diagCEL0 celebracion` | **Verde**, 0 fallos y control verde. Victoria 379,03×410,25 contra Rankings con «Editar» 379,03×468,25 (412×915); 600×223,5 / 600×277,5 (915×412); 400×410,25 / 400×468,25 (1366×768). La de Rankings coincide con la lámina |
| `diagDSK humo` | **Verde**, código 0: gate, lob, retar, rnk, suma y cfg verdes; d1d2, d3, bug y shots informativos; aislamiento verde. Unos 6 min 43 s con la compilación |
| `vitest` | 83 de 83 archivos, 1.952 pruebas |
| `npm run lint` | 21, la línea base, fuera de `laminas/` (la lámina sin seguimiento añade 10) |
| La puerta de entrada (el Bautizo de la cuenta nueva) | Idéntica byte a byte antes y después, 9 de 9 capturas (STOP-B2) |

---

## 5. `git status`

Sin commits.

- **Modificados (33):**
  - **docs:** `AJILEI_Configuracion_v1.1.md` (marcado «Sustituido») y `AJILEI_Invariantes_v1.0.md`.
  - **scripts:** `cfg/cfg.mjs`, `diagCEL0.mjs`, `eco/guionesCore.mjs` y su prueba, `rnk/rnk.mjs` y `testRnk1c.test.js`.
  - **src:** `App.jsx`; `GameTable.jsx`, `HojaConfiguracion.jsx`, `MiniPerfil.jsx` y `PantallaChips.jsx`; `textos.es.js` y su prueba; `bancoImitado.js` y su prueba, `billeteraFalsa.js` y `sembradosRanking.js`; `useAuth.js`; `rankingApi.js`; `Bautizo.jsx`, `Lobby.jsx`, `PartidaPvP.jsx`, `Rankings.jsx`, `SalaEspera.jsx` y `SalaOpciones.jsx`; y `bautizo.css`, `hojaConfiguracion.css`, `miniPerfil.css`, `rankings.css` y `tactilLobby.css`.
  - **supabase:** `pruebas/rnk1a_verificacion.sql`.
- **Nuevos de la 1b:**
  - **docs:** `docs/AJILEI_Configuracion_v1.2.md`, este informe y el de la lámina (`AJILEI_CFG-1_Fase1bL_Informe_v1.0.md`).
  - **public:** `public/banderas/` (243 SVG y `LICENSE`).
  - **scripts:** `scripts/gen-paises.mjs`.
  - **src:** `Bandera.jsx`, `estados.js`, `paises.js`, `lugarCore.js` y su prueba, `perfilApi.js`, `Perfil.jsx`, `bandera.css` y `perfil.css`.
  - **supabase:** la migración `20261030013000_cfg1b_perfil.sql` y el guion `cfg1b_verificacion.sql`.
- **Sin seguimiento y que no van en los commits:** `laminas/cfg1b/` (la lámina, con las capturas de la 1b-ii en `capturas-1b/` y la página de comparación de la entrada en `entrada/`) y lo de MOT-1 (dos informes y tres archivos de `laminas/mon1/`).

---

## 6. El guion de pruebas de Victor

### A · PC con el bypass (`npm run dev`, http://localhost:5173)

| # | Qué hacer | Qué debe ver |
|---|---|---|
| A1 | Toca el avatar de la barra en el lobby | La pantalla «Perfil»: el círculo con la «D», «DevLocal», el isotipo en tenue y cuatro filas. La flecha te devuelve al lobby |
| A2 | «Jugar contra las IAS» → avatar → flecha. Repite desde «Jugar contra jugadores» | La flecha te devuelve a Retar y a Salas, no al lobby |
| A3 | ⚙ → toca la cabecera (tu nombre, con «›») | La hoja se cierra y se abre el perfil. La flecha te devuelve a donde estabas |
| A4 | Rankings → toca tu banda → «Editar» | El perfil. La flecha te devuelve a Rankings. Una fila ajena no tiene «Editar» |
| A5 | Perfil → «De dónde eres» → España | Vuelves al perfil con «Guardado»; la bandera de España está en la cabecera y en la fila |
| A6 | «De dónde eres» → Venezuela | Sale enseguida «Venezuela · ¿de qué estado?», con «Sin estado» arriba y marcado |
| A7 | Elige Zulia | «Venezuela · Zulia» en la cabecera y en la fila. **Rankings:** tu fila (puesto 7) y tu banda llevan la bandera y el lugar en la segunda línea. **Mini-perfil propio:** la pastilla lisa con «Venezuela · Zulia». **Hoja ⚙:** la bandera, sin texto, detrás del nombre |
| A8 | «De dónde eres» → «Prefiero no decirlo» | El isotipo en tenue en la cabecera, «Sin elegir» en la fila, y el isotipo en Rankings, en el mini-perfil y en la hoja |
| A9 | En el selector, escribe «peru», «EEUU», «usa», «curazao» y «zzz» | Perú; Estados Unidos (solo); Estados Unidos; Curazao; «No encontramos ese país». El «×» borra |
| A10 | «Nombre de usuario» → escribe `ElCatire88` y pulsa Intro | «Ese nombre ya está tomado», **sin** la ventana de 30 días |
| A11 | Escribe `Ajilei_Oficial` → Intro | «Ese nombre no está permitido — prueba otro», **sin** ventana |
| A12 | Escribe `devlocal` (solo mayúsculas) → Intro | Se guarda sin ventana; la fila **no** dice «Próximo cambio» |
| A13 | Escribe `Panita_Nueva` → Intro | **La ventana**: «¿Cambiar tu nombre a Panita_Nueva?» y el aviso de 30 días. «Cancelar» la cierra y deja el editor; «Cambiar» guarda, «Listo: ahora eres Panita_Nueva», y la fila dice «Próximo cambio: {hoy + 30}» |
| A14 | Vuelve a abrir «Nombre de usuario» | El editor quieto: el campo apagado, «Podrás cambiarlo de nuevo el {fecha}.», «Confirmar» apagado y «Cerrar» |
| A15 | Recarga con `http://localhost:5173/?cfg=nombre-bloqueado` y abre el editor | Bloqueado desde el principio, con la fecha de dentro de 28 días |
| A16 | `?cfg=nombre-ocupado` y `?cfg=nombre-vedado`: prueba cualquier nombre válido | Siempre «tomado» o «no permitido», sin ventana |
| A17 | Dentro de una mesa, ⋮ → «Cambiar nombre» | El mismo editor, con las mismas reglas: si ya cambiaste en A13, bloqueado |

### B · Túnel con el S25 (`npm run build` → `npx vite preview --host` → `cloudflared tunnel --url http://localhost:4173`)

Con `test1976`. **No le cambies el nombre:** gastaría su freno de 30 días. El lugar sí se puede cambiar, porque no tiene freno.

| # | Qué hacer | Qué debe ver |
|---|---|---|
| B1 | Perfil → «Nombre de usuario» y toca el campo | Con el teclado de verdad, la tarjeta arriba: se ven el campo y «Confirmar»; la tecla del teclado dice «Ir» y confirma. Toca «Cancelar» sin escribir |
| B2 | «De dónde eres» y toca el buscador | El buscador queda a la vista sobre el teclado; la lista desplaza por debajo |
| B3 | Desplaza la lista entera | Las banderas cargan a medida que bajas; la de Venezuela trae sus 8 estrellas |
| B4 | Toca las filas y las opciones con el pulgar | Responden a la primera (44 px); ninguna se toca por error al lado |
| B5 | Elige Venezuela → tu estado; luego «Prefiero no decirlo» | Lo mismo que en A6–A8, en el teléfono |
| B6 | Rankings, en vertical y acostado | La fila de dos líneas no corta el nombre más de lo necesario; las banderas se ven nítidas |

### C · Servidor real, solo con una cuenta desechable (alias `+borrar`)

**El nombre de `test1976` y el de `ticotest2022` no se cambian.**

| # | Qué hacer | Qué debe ver |
|---|---|---|
| C1 | Crea una cuenta con `tucorreo+borrar1b@…` y bautízala | El lobby, con el nombre elegido |
| C2 | Perfil → cámbiale el nombre una vez (ventana → «Cambiar») | «Listo: ahora eres …» y «Próximo cambio: {hoy + 30}». En el SQL Editor (opcional): `select username, nombre_cambiado_en from profiles where username = '…'` |
| C3 | Intenta un segundo cambio | El editor bloqueado con la fecha. Si lo abres desde otro aparato que no lo sabía, al confirmar el servidor contesta y el editor pasa a bloqueado con la misma fecha (AJ030) |
| C4 | Cambia solo mayúsculas | No se puede desde el editor bloqueado (D-15). Es lo esperado |
| C5 | Elige Venezuela → un estado, luego España | Se guarda; en Rankings y en tu mini-perfil se ve. En el SQL Editor (opcional): `pais = 'ES'`, `estado` nulo |
| C6 | ⚙ → «Eliminar cuenta» → «ELIMINAR» | La Portada. Prueba la 1c de punta a punta |
