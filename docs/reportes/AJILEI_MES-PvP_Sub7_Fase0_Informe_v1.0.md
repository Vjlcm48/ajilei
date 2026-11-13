# AJILEI · MES-PvP · Sub-tanda 7 · Fase 0 · Informe · v1.0

**Para:** el rector · **De:** Claude Code · **Fecha:** 2026-11-13
**Árbol:** `main` = `origin/main` = `3455468`. `git status` al empezar y al acabar: sin seguimiento solo `laminas/lm1/`, `lm2/` y `lm3/` (más este informe). Una sola línea en `git worktree list`.
**Método:** solo lectura. No corrí vitest, ni el imitado, ni un navegador. Las cifras de píxeles salen de la fórmula del CSS (`--u = clamp(3.2px, 1vmin, 6px)`, `salas.css:56`: 3,6 px en 360×640 y 6 px en 1366×768). Las marco como **estimadas**.

---

## F · El segundo reparto entre personas

### F.1 · Contra las IAS

- Un solo camino para los dos repartos. `buildDealSeq` (`GameTable.jsx:171-184`) arma la secuencia de la Mano al Pie, una carta por asiento y por ronda, sin los retirados. DEAL_2 hace 2 rondas desde el índice 0; DEAL_3, 3 rondas desde el índice 2.
- El efecto `GameTable.jsx:845-881` lanza un vuelo cada vez:
  - el primero a los 120 ms;
  - cada uno de los siguientes cuando aterriza el anterior: `onDone` → `setDealStep(s => s + 1)` (`:2953-2961`) → el efecto lanza el paso nuevo con 0 ms (`:879`).
- Cada vuelo dura `0,595 s × factor` (`:840`). Las cartas propias se voltean a 300, 600 y 900 ms × factor (`:858-861`), y el estado avanza a 2.000 ms × factor (`:865-869`).
- **De una en una e intercaladas** (Mano, siguiente, …, Pie, y vuelta a empezar), igual que el primer reparto.

### F.2 · Entre personas

- **El árbitro:** al cerrar BET_1 pone DEAL_3 con `vencimiento = reparto` (`partida.js:264-267`) y la espera `esperaSegundoReparto(3·vivos, ritmo)` (`reloj.js:42`). La vista ya trae las 5 cartas de cada uno: las propias boca arriba y los rivales con `dorsos(asiento, numCartas)` (`vistaAMesa.js:101`).
- **El cliente:** usa el **mismo** efecto y la misma secuencia. Solo cambia el final: con `partida` no avanza el estado y espera a la vista siguiente (`GameTable.jsx:862-863` en DEAL_3 y `:873` en DEAL_2).

### F.3 · La espera del árbitro frente a la duración en el cliente

| | Árbitro (`reloj.js:37-42`) | Cliente (contra las IAS) |
|---|---|---|
| Fórmula | `120 + 3·n·595·f + 2000·f` | 120 + 3·n vuelos de `595·f` seguidos + volteos hasta `900·f` + margen hasta `2000·f` |
| Normal (f = 1) | igual | igual |
| Rápido (f = 0,5) | igual | igual |

La espera del árbitro **ya es la de un reparto en serie**. No hay nada que corregir en el servidor.

### F.4 · La causa (por lectura, sin medir en pantalla)

**Contra personas, `dealStep` no vuelve a 0 al acabar el primer reparto.**

1. Contra las IAS se pone a 0 antes de avanzar (`:867` y `:874`). Contra personas, la rama `if (partida) return` (`:873`) lo deja en `2·n` (4 con dos jugadores).
2. El primer reparto no lo sufre: entra con `barajando = true` (`:400`, `isShuffling = partida.game.barajando`). El efecto se para en `:847` y el reinicio por cambio de fase (`:884-890`) llega antes que el primer vuelo.
3. DEAL_3 no tiene barajado:
   - la vista llega por `useSyncExternalStore` (`useMesaPvP.js:25`), y el primer render de DEAL_3 se pinta con el `dealStep` viejo;
   - `dealVisibility(seq, 4, 2)` (`:187-193`, `:1970`) enseña **de golpe a todos los asientos** las cartas de los 4 primeros pasos: dos por jugador en la mesa de 2;
   - en el mismo vaciado de efectos, el efecto de reparto programa `launchFlyingCard(4)` a 0 ms (`:879`), y después el reinicio pone `dealStep` a 0.
4. Lo que se ve depende de qué llega antes: el render del reinicio o el temporizador de 0 ms.
   - **Si llega antes el render**, hay un destello de cartas en todos los asientos, que desaparecen y vuelven a repartirse una a una.
   - **Si llega antes el temporizador**, sale un vuelo «fantasma» al hueco 4 de la Mano y, 120 ms después, arranca el vuelo del paso 0. Las dos cadenas avanzan a la vez y cada aterrizaje suma un paso: **las cartas vuelan de dos en dos, a la Mano y al Pie casi a la vez**. Es lo que describe Victor.
5. Con retirados puede ser peor. Si `2·n(DEAL_2) ≥ 3·n(DEAL_3)` (mesa de 3 con 1 retirado, 4 con 2, 5 con 2), el primer render cae directamente en la rama final: **las 3 cartas aparecen en todos a la vez** y empiezan los volteos. Luego el reinicio las vuelve a repartir.

### F.5 · Qué hace falta

- **No toca el árbitro.** No hay deploy ni cambio del Contrato: §6 ya dice 300·600·900 escalado (`Contrato:440`).
- **Toca `GameTable.jsx`**, que no es protegido. Es un archivo compartido, así que **pide el control de las IAS**.
- **Reutiliza el camino del primer reparto tal cual.** No hace falta el calendario de la reposición de la 5b.
- **El arreglo mínimo:** poner `dealStep` a 0 al salir de la fase de reparto, `GameTable.jsx:846`:
  ```js
  if (!isDealPhase) { setFlyingCards([]); setDealStep(0); return }
  ```
  - Contra las IAS no cambia nada: ahí `dealStep` ya vale 0 en ese momento, y React descarta un estado igual.
  - Con `isDealPhase` falso, `visFor` devuelve 5 (`:1970`), así que en BET_1 no se ve ninguna diferencia.
- **Alternativa más robusta**, si el rector la prefiere: atar el paso a su fase (`{clave: handCount+phase, paso}`) y leer 0 cuando la clave no coincide. Cubre también cualquier render intermedio. Recomiendo la de una línea: es la causa exacta, y la otra reescribe un efecto que el compilador de `react-hooks` vigila.
- **La vara** (va en `scripts/pvp/`): con el imitado, en la mesa de 2 y en una de 3 con un retirado, en Normal y en Rápido.
  - Los vuelos `data-vuelo="fly-DEAL_3-*"` (`:2952`) no se solapan nunca.
  - Salen en el orden de `buildDealSeq`.
  - El primer render de DEAL_3 no enseña más de 2 cartas por asiento.

### F.6 · Duración por mesa

Es la espera del árbitro (`reloj.js:42`), **igual hoy y después**:

| Mesa | Normal | Rápido |
|---|---|---|
| 2 | 5.690 ms | 2.905 ms |
| 3 | 7.475 ms | 3.798 ms |
| 4 | 9.260 ms | 4.690 ms |
| 5 | 11.045 ms | 5.583 ms |

En el cliente, el último vuelo aterriza a `120 + 3·n·595·f` (mesa de 2: 3.690 ms en Normal y 1.905 ms en Rápido) y el último volteo, `900·f` después. Con la doble cadena de hoy, los vuelos acababan en unos `120 + ⌈3n/2⌉·595·f` (mesa de 2 en Normal: unos 1.905 ms). Tras el arreglo **no se pierde margen**: entre el último volteo y la hora del árbitro quedan `1.100·f` ms (1,1 s en Normal y 0,55 s en Rápido).

---

## A · Armar mesa

### A.1 · El ritmo

**El servidor ya lo tiene todo:**
- `salas.ritmo` con su `check` (`mot1_esquema.sql:42-43`);
- `crear_sala(…, p_ritmo default 'normal')` (`:326-332`);
- el ritmo **no** forma parte de la identidad de la mesa pública (`:362-368`).

**Falta en el cliente:**
1. **La pantalla:** una fila `FilaChips` con «Normal · Rápido» (el mismo componente que Jugadores, `ArmarMesa.jsx:265-273`). Va entre Apuesta (`:279-301`) y «¿Cómo la llenamos?» (`:303`).
2. **Los textos:** `sal.armar.ritmo` («Ritmo»), `sal.armar.ritmo.normal` y `sal.armar.ritmo.rapido`. Hoy no existe ninguno; solo está «Partida rápida» de las IAS (`textos.es.js:380`).
3. **El envío:** `crearSala(tipo, jugadores, apuesta, ritmo)` manda `p_ritmo` siempre (`salasApi.js:143-151`).
4. **La memoria:** `MEMORIA_PVP` recuerda `jugadores`, `apuesta` y `tipo` (`salaRecordada.js:47-50`). Hay que añadir `ritmo` a los campos y a `normalizarConfig` (`salasCore.js:180-191`), con `normal` por defecto en `CONFIG_POR_DEFECTO` (`salasCore.js:157`).

**¿Recuerda el ritmo? Recomiendo que sí,** como las otras tres decisiones. Es una preferencia del anfitrión y está a la vista en la misma pantalla, así que no hay sorpresa escondida. La primera vez sale Normal.

**La puerta de desarrollo `?ritmo=rapido`: recomiendo retirarla.** Con los botones sobra. Al retirarla hay que cambiar dos cosas:
- `testDistSinMoldes` (`:80-81`) vigila la huella `p_ritmo` en `dist/`, y ahora estará de verdad: se quita la huella;
- `salasApi.test.js:68`.

El mando `ritmo=rapido` del imitado es otro y se queda.

**Al unirse a una pública igual:** cuando la combinación ya existe, `crear_sala` une al jugador a esa mesa con **su** ritmo (`:362-368`) y la pantalla cambia el CTA a «Unirme» (`ArmarMesa.jsx:148`). Ahí el ritmo elegido no vale. Ver P-2.

### A.2 · La apuesta de 50

La pantalla empieza en 100 porque **el cliente no tiene el 50**:
- `APUESTAS_PVP = [100, 200, 500, 1000, 2000, 5000]` (`salas.js:41`);
- `CONFIG_POR_DEFECTO.apuesta = 100` (`salasCore.js:157`).

Dónde vive la lista de apuestas:

| Sitio | ¿Tiene el 50? |
|---|---|
| `salas.check` | Sí (`mot1_esquema.sql:33-35`) |
| `crear_sala` | No filtra: lo hace el `check` |
| Índice de identidad | `(jugadores, apuesta, entrada)` (`mot1_esquema.sql:51-52`), sin lista |
| Árbitro | Sí: `APUESTAS = [50, …]` (`partida.js:63`) |
| `salas_abiertas()` | Lee la tabla |
| Cliente | **No** (`salas.js:41`), además del comentario «las seis apuestas» (`:36`) y su prueba en `salas.test.js` |

**No pide migración.** Es una constante del cliente y sus pruebas.

Efecto de rebote: `ALCANCE_NUEVOS` pasa de `[100]` a `[50, 100]` (`salas.js:78`), y el aviso a los nuevos dirá «50 o 100» (`ArmarMesa.jsx:298`). Como se deriva, sale solo.

### A.3 · El saldo

`alcanza(hc, saldo)` = `saldo ≥ 15·hc` (`salasCore.js:69-71`, `salas.js:57-62`). El chip se apaga con `disabled` (`ArmarMesa.jsx:288`, `opacity 0.4`, `salas.css:589`). El 50 sigue la misma regla: se apaga por debajo de 750 HC. El servidor lo repite (`saldo_insuficiente`, `mot1_esquema.sql:357-359`).

**El cliente siempre arma Corta:** no hay fila Entrada, como dice `salas.js:53-56`. Ver P-3.

### A.4 · El texto y la posición; ¿lámina?

- **Propuesta:** título «Ritmo» y chips «Normal» y «Rápido», bajo Apuesta, con la misma altura de chip.
- **Altura del chip:** `--chip-h = max(40px, 9,5u)`. Con el anclado es `max(44px, 7,4u)` (`salas.css:1687`).
- **Lo que suma la fila** (estimado): unos 65-75 px en 360×640 y unos 90 px en 1366×768. Además, el séptimo chip de apuesta puede abrir una línea más en 360×640.
- `ArmarMesa` va anclada (IOS-1 1e) y las filas desplazan dentro del cuerpo, así que el botón no se pierde. Lo que sí cambia es cuánto se ve sin desplazar.
- **Recomiendo una lámina corta**, junto con la sala de espera (G.2): 360×640, 640×360, 844×390 y 1366×768.

---

## B · La sala de espera

### B.1 · El reloj

**Dónde vive el 3:00:**
- **SQL:**
  - el defecto de la columna `expira_en … default now() + interval '3 minutes'` (`sal_a_salas.sql:97`); `crear_sala` no lo escribe y usa ese defecto (`mot1_esquema.sql:381-392`);
  - la restitución de `salir_sala`, `greatest(expira_en, creada_en + interval '3 minutes')` (`mot1_dinero.sql:533`).
- **Cliente:** `DURACION_SALA_SEG = 180` (`salas.js:139`), que solo usan las pruebas (`salas.test.js:172`, `relojCore.test.js:75`, `useCronometroSala.test.js:36`). El cronómetro cuenta desde el `expira_en` del servidor (`useCronometroSala.js:120-147`, `SalaEspera.jsx:161`), así que **pinta 5:00 sin tocarlo**.

**El cambio: pide migración.** Una función `duracion_sala(tipo)` (`privada` → 5 min, `abierta` → 3 min), que se usa en:
- `crear_sala`, que inserta `expira_en = now() + duracion_sala(p_tipo)`;
- la restitución de `salir_sala`, con `creada_en + duracion_sala(s.tipo)`.

El defecto de la columna puede quedarse en 3 minutos, de respaldo. En el cliente, `DURACION_SALA_SEG` pasa a `duracionSala(tipo)`, como espejo.

**Con la mesa llena no cambia nada:** `least(expira_en, now() + 10 s)` (`sal_b2.sql:167` y su copia vigente) es independiente de la duración, y `LLENA_SEG = 10` se queda. `barrer_salas` solo mira `expira_en`. Las pruebas del banco PGlite que esperan 3 minutos (`sal_b2` §7) se actualizan en el guion.

### B.2 · El mini-perfil

- **Qué datos tiene la sala de cada jugador:** solo `asiento`, `jugador_id` y `profiles(username)` (`salasApi.js:256-259`). La silla pinta la inicial y el nombre (`SalaEspera.jsx:622-631`).
- El avatar, el país, la posición y los puntos **no** hacen falta en la sala: `MiniPerfil` los pide por sí mismo con `api.perfil(username)` (`MiniPerfil.jsx:86`, `:94`).
- **Cómo se monta**, igual que en Rankings (`Rankings.jsx:308-320`):
  - la silla ocupada pasa a ser un `<button>`;
  - al tocarla, se guarda `perfil = { username, inicial, propio: s.esTu }`;
  - se pinta `<MiniPerfil key api username inicial propio correo onCerrar onNoHay onEditar>`, que ya es un portal (`MiniPerfil.jsx:2`, `:122`).
- **Falta en `App`:** pasar `apiRanking` a `SalaEspera`, como ya se hace con la mesa (`App.jsx:368`, `:1078`).
- **Peso:** `SalaEspera` es un trozo diferido (`App.jsx:81`), así que `MiniPerfil` y la bandera no tocan la `1.8b`.
- **No pide migración.**
- **El asiento propio dice «Tú».** Hoy, si eres el anfitrión, tu silla dice «Anfitrión», porque el rótulo mira primero `esAnfitrion` y después `esTu` (`SalaEspera.jsx:629`). Recomiendo que la silla propia diga siempre «Tú» y que la del anfitrión ajeno diga «Anfitrión». Ver P-4.
- **Nunca dentro de la mesa:** el único `MiniPerfil` de `GameTable` es la tarjeta propia de la pantalla de victoria (`GameTable.jsx:2549-2557`), no un asiento de la mesa. Está bien.

### B.3 · Lo pendiente de CFG-1

**O-1 · el apaisado bajo.** Las líneas se han movido: `SalaEspera.jsx:502` y `PartidaPvP.jsx:60` llevan `main.sal` **sin** `es-anclada`. Les afectan las dos reglas de `salas.css` acotadas con `:not(.es-anclada)`:
- el traje acostado `≤520` (`salas.css:1265-1273`): desplaza la pantalla entera y deja la casa `fixed`;
- el parche de la 1b, de 521 a 830 (`:1282-1289`).

Anclarlas supone:
- subir la casa a la cabecera (hoy es hermana del cuerpo, `SalaEspera.jsx:685-692`);
- que el cuerpo desplace por dentro y el bloque de acción quede al pie.

Es un cambio visible: **va a lámina**.

**La pasada de 44** (estimada por fórmula; 360×640 → 1366×768):

| Pantalla | Elemento | Medida | ¿< 44? |
|---|---|---|---|
| Sala | `.sal-volver` (8,7u) | 31 → 52 | Sí, en teléfono |
| Sala | `.sal-casa` (8,7u) | 31 → 52 | Sí, en teléfono |
| Sala | `.sal-copiar` (8,7u, `salas.css:835`) | 31 → 52 | Sí, en teléfono |
| Sala | `.sal-esp-compartir` (0,8 × `--cta-h`, `:851`) | 35 → 53 | Sí, en teléfono |
| Sala | `.sal-esp-salir` (`max(40, 9u)`, `:1091`) | 40 → 54 | Sí, en teléfono |
| Sala | Diálogo «Cancelar», `.sal-secundario` (`:1155`) | 40 → 54 | Sí, en teléfono |
| Sala | Silla, si abre el mini-perfil (avatar `0,72·sillaPx`, `:607`) | Depende del óvalo | Medir en la lámina |
| PvP (arrancando, saliendo, muerta) | `.sal-cta` | 44 | No |
| PvP | Volver o casa | No hay | — |

El piso de 44 por `::after` ya existe, pero **solo para `.sal.es-anclada`** (`tactilLobby.css:109-127`): al anclar la sala, la flecha y la casa lo heredan. Copiar, compartir, salir y los botones del diálogo necesitan su propio `::after`, aditivo. La barra (avatar, ⚙ y píldora) es la del lobby, con su propio piso; no la medí aquí.

**Cerrar sesión con una mesa en espera.**
- **Hoy:** `cerrarSesion` (`App.jsx:305-309`) no llama a `salir_sala`; el comentario lo asume (`SalaEspera.jsx:697-702`). Se llega por dos caminos: el ⚙ de la sala, y el lobby, porque la casita **no cancela** (`SalaEspera.jsx:420-425`).
- **Qué pasa con el asiento y la entrada (ya cobrada al sentarse):**
  - si al vencer hay 2 o más sentados, `barrer_salas` arranca la partida **con él dentro** (`mot1_dinero.sql:1539-1556`). Juega ausente: pierde los antes y lo que el reloj le haga poner hasta el tercer vencimiento, que lo retira y lo cobra por la ruta del abandono (`Contrato:382`);
  - si está solo, la sala se cancela y la entrada vuelve (`Contrato:515`).
- **Recomendación:**
  - en `cerrarSesion`, antes del `signOut`, `mi_sala()` y, si está `esperando`, `salir_sala()`. Con un tope corto (unos 2 s) y sin bloquear la salida si falla, con el mismo criterio que `salirDeVerdad` (`SalaEspera.jsx:397-407`);
  - el anfitrión **cancela** la mesa para todos, que es lo que hace su «Salir» después de confirmar. Ver P-5.

---

## C · `SalaOpciones` con `PantallaChips` y el parche de la 1b

**Qué cambia.** `SalaOpciones` repite a mano la carcasa (`SalaOpciones.jsx:238-246`; lo dice `PantallaChips.jsx:61-62`). La diferencia con `PantallaChips` (`:143-213`):
- su sección de acción lleva además `sal-bloque`, que no pinta nada sin `h2` (`salas.css:362`);
- el CTA lleva `es-opciones`, que ya cabe en `cta.clase`;
- la caja `aviso` ya cabe en `cta.caja`;
- el toast propio se sustituye por el de la carcasa, con `avisoRef`;
- la flecha va a `onVolver = onLobby`.

**Δ esperado en `diagSAL`:** 0 px en las 36 celdas de `opciones-*` (6 estados × 6 viewports).

**El parche.** Ya **no** le afecta a `SalaOpciones`, que va anclada. Solo actúa sobre la sala de espera y la partida PvP, con `:not(.es-anclada)` (`salas.css:1265-1289`). Se podrá retirar con Δ 0 **cuando esas dos pantallas vayan ancladas** (B.3 y E). Antes, no: quitarlo hoy deja el botón de la sala cortado en 521-830 de alto, el defecto de la IOS-1 1b.

---

## D · INV-76 · La tienda desde la sala de espera

**Hoy:**
- ⚙ → Tapetes llama a `cuenta.abrirTapetes` (`HojaContenido.jsx:184-187`, `App.jsx:935`). Eso cambia la pantalla a `tienda` y anota `desde = 'sala-espera'` (`App.jsx:342-345`).
- **`SalaEspera` se desmonta.** La mesa sigue en el servidor y nadie la mira:
  - al llegar a 0 (o a los 10 s con la mesa llena), el siguiente `barrer_salas` o `resolver_sala` de otro teléfono la arranca;
  - **la mesa arranca sin él**: en el sorteo y en sus turnos vence el reloj (20 s cada turno);
  - si vuelve con «Volver» de la tienda (`App.jsx:1168`), la sala se vuelve a montar, ve la mesa `activa` y entra tarde;
  - si tarda más de 3 vencimientos, el abandono lo retira y cobra su pila;
  - si sale de la tienda por la casa, va al lobby con la partida en marcha.
- **No pierde el asiento, pero juega ausente y pierde fichas sin enterarse.**

**Recomiendo apagar la fila con un aviso.** Al tocarla, un toast «Disponible fuera de la mesa». La fila no se oculta ni se mueve, para que la hoja mida igual que en el lobby (O1).
- **Cómo:** `SalaEspera` pasa a la hoja `cuenta` sin `abrirTapetes` y con un motivo. `HojaContenido` ya cae a un toast cuando no hay puerta (`:187`), pero dice «Pronto», que aquí mentiría: hace falta una clave nueva.
- **Por qué esta opción:**
  - ocultar la fila cambia la hoja entre pantallas;
  - volver solo a la sala no evita el reloj, sobre todo los 10 s de la mesa llena.

---

## E · La partida muerta

**Qué ve el jugador:**
- `partidaCliente.js:166-167` marca `muerta` y `escenaDe` devuelve `'muerta'` (`mesaPvPCore.js:54-58`);
- `PartidaPvP.jsx:155-156` pinta `Traje` (`:53-68`) con `Aviso` (`:70-81`);
- se ve:
  - el título «Mesa de {n} · {hc}»;
  - el texto «La mesa se cerró por inactividad. Tu pila volvió a tu saldo» (`textos.pvp.es.js:27`, **sin punto final**);
  - el botón «Volver al inicio» (`textos.es.js:221`), que lleva al lobby.

**Qué falta:**
1. **Va sin anclar** (`main.sal`, `:60`): en el apaisado bajo le aplican el traje acostado y el parche (B.3). El CTA queda centrado en la vertical (`salas.css:1178`), no al pie.
2. **No tiene barra:** la píldora se relee (`PartidaPvP.jsx:103-105`), pero no hay píldora en la pantalla, así que «volvió a tu saldo» no se ve. Tampoco hay flecha ni casa.
3. No dice cuánto volvió. La cifra es la de `liberacion_pvp`, provisional (`Contrato:453`). Recomiendo no darla hasta que la cifra se selle.
4. Falta el punto final del texto.

Recomiendo anclarla con la barra: «Arrancando» y «Saliendo» heredan lo mismo, porque comparten `Traje`. Va en la misma lámina que la sala.

---

## G · Corte y estimación

### G.1 · El corte: dos tandas

**7a · sin lámina:**

| Pieza | Archivos |
|---|---|
| F, el segundo reparto | `GameTable.jsx` + vara pvp |
| B.1, el reloj de 5:00 y 3:00 | migración + espejo y pruebas |
| B.3, cerrar sesión con `salir_sala` | `App.jsx` |
| B.2, el «Tú» de la silla propia | — |
| D, la fila Tapetes apagada | `HojaContenido.jsx`, `SalaEspera.jsx` y un texto |
| E.4, el punto final del texto | — |

Ninguna de estas piezas mueve la maqueta.

**7b · con lámina:**
- A: la fila Ritmo, el séptimo chip y la memoria;
- B.2: la silla como botón y el mini-perfil;
- B.3: anclar la sala y la pasada de 44;
- E: la muerta anclada y con barra;
- C: `SalaOpciones` → `PantallaChips` y retirar el parche.

C va al final de la 7b: su Δ 0 se demuestra cuando ya están ancladas las otras dos pantallas.

### G.2 · Qué necesita los ojos de Victor antes del código

La lámina de la 7b:
- `ArmarMesa` con Ritmo y las 7 apuestas;
- la sala anclada, con «Tú» y el mini-perfil abierto;
- la partida muerta anclada.

En 360×640, 640×360, 844×390 y 1366×768.

**La 7a va directa.** F es una corrección sin diseño nuevo, y su prueba es la vara.

### G.3 · La nube

- **Migración: una**, en la 7a (`duracion_sala`, `crear_sala` y `salir_sala`). Es compatible con el cliente viejo, que solo lee `expira_en`.
- **Orden:** `db push` primero y después el push del cliente.
- **Deploy de la función `partida`: ninguno** en las dos tandas.
- La CLI sigue en 2.122.1.

### G.4 · El control de las IAS

**Sí en la 7a, solo por `GameTable.jsx` (F).** La 7b no toca la mesa.
- `HojaContenido` y `SalaEspera` no los monta la mesa contra las IAS: solo los usan `Lobby`, las salas y `PantallaChips`.
- La 7b pasa con `diagSAL` y `diagDSK cfg`/`tam` en las pantallas tocadas.

### G.5 · Estimación (minutos de Claude Code)

| Tanda | Trabajo | Lo que no se comprime |
|---|---|---|
| 7a | Código y pruebas ≈ 60; vara del reparto ≈ 30; migración y guion PGlite ≈ 25 | Aislados ≈ 13,5 × 5 commits ≈ 70; control de las IAS + pvp ≈ 135; la nube, con Victor y el túnel |
| 7b | Lámina ≈ 100; código ≈ 120; varas `diagSAL`/`diagDSK` ≈ 30 | Aislados ≈ 70 |

Totales aproximados: **7a ≈ 2 h de trabajo + 3 h 25 min fijas**; **7b ≈ 4 h + 1 h 10 min**.

---

## §P · Preguntas al rector

1. **F, el arreglo.** ¿La línea en `GameTable.jsx:846` (`setDealStep(0)` al salir del reparto) o atar el paso a su fase? **Recomiendo la línea:** es la causa exacta, no cambia nada contra las IAS y su vara lo prueba.
2. **El ritmo en una pública que ya existe** (CTA «Unirme»). ¿La fila Ritmo se queda visible pero apagada mientras el CTA dice «Unirme»? **Recomiendo que sí:**
   - no mueve la pantalla (O1);
   - no enseña el ritmo de la mesa ajena, como está sellado;
   - deja claro que ese ritmo no lo eliges tú.
3. **La fila Entrada.** El sellado habla de Corta 15× y Llena 50×, pero el cliente no la ofrece (`salas.js:53-56`; `crear_sala` ya acepta `p_entrada`). ¿Entra en la 7b? **Recomiendo dejarla fuera:** no está en el §0 de esta sub-tanda y añade otra fila a una pantalla que ya va justa. Si entra, va en la misma lámina.
4. **«Tú» frente a «Anfitrión».** Si eres el anfitrión, ¿tu silla dice «Tú» en vez de «Anfitrión»? **Recomiendo que sí,** que es lo sellado. Tu condición de anfitrión ya se ve en el «Jugar ya» y en «Cancelar mesa».
5. **Cerrar sesión siendo anfitrión** de una mesa en espera. ¿Cancela la mesa para todos (`salir_sala`) sin pedir confirmación? **Recomiendo que sí:** es lo que hace su salida, y dejarla viva lo sienta ausente y le cuesta fichas. Si se quiere confirmación, la hoja la pediría solo con mesa viva.

## §R · Riesgos

- F está diagnosticado por lectura, sin medir: el orden entre el render del reinicio y el temporizador de 0 ms decide cuál de los dos síntomas sale. La vara de la 7a lo cierra.
- El segundo reparto no va anclado a la hora del árbitro: un teléfono con más de 0,55 s de retraso en Rápido ve aparecer de golpe las últimas cartas, porque la vista de BET_2 corta los vuelos. Pasa hoy igual y queda fuera del alcance.
- El séptimo chip y la fila Ritmo pueden hacer que `ArmarMesa` desplace en 360×640, donde hoy no lo hace.
- Quitar el parche antes de anclar la sala y la partida recorta el botón en 521-830 de alto.
- Mientras D no esté arreglado, un jugador en la tienda pierde fichas sin enterarse si la mesa arranca.
- Las pruebas del banco PGlite y los comentarios que dicen «3 minutos» o «180» tienen que cambiar a la vez que la migración.
- La pasada de 44 es estimada por fórmula: la silla del mini-perfil y la barra se miden en la lámina.
