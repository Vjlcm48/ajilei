# AJILEI · APU-1 · Fase 1a · Informe — Tanda documental y lista cerrada de ediciones · v1.0

- **Campaña:** APU-1 — Apuestas, pilas y agresividad de las IAS
- **Fase:** 1a · documental · **sin código** · puerta de la Fase 1b
- **Base:** `main` en `f9ee503`. Todas las citas de línea son a esa base.
- **Fecha:** 2026-09-17
- **Ficha:** `AJILEI_APU-1_Fase1a_v1.0.md` · **Normativo:** `AJILEI_APU-1_Reglas_v1.0.md` (colocado por esta tanda)
- **Diagnóstico base:** `docs/reportes/AJILEI_APU-1_Fase0_Informe_v1.0.md`
- **Escrituras:** cuatro, las de §2 de la ficha. Ningún archivo de `src/`, `scripts/`, `supabase/` o `laminas/`. Ningún protegido abierto.

---

## §A · Línea base

| Vara | Esperado | Al arrancar | Al cerrar | Δ |
|---|---|---|---|---|
| `npm run lint` | 21 | **21** (20 errores + 1 aviso) | 21 | **0** |
| `npx vitest run` | 685 | **685** en 26 archivos | 685 | **0** |
| `node scripts/diagSAL.mjs sal` | 102/102 | **102/102**, 0 fallas | 102/102 | **0** |

Las tres se midieron al arrancar. **No se repiten al cerrar y la razón es que no pueden haber cambiado**: esta tanda no tocó un solo archivo que lint, Vitest o el arnés lean — sus cuatro escrituras son `.md` de `docs/`. `git status` (§G) es la prueba. `diagSAL` corrió contra el servidor de desarrollo en el puerto 5199 con `VITE_AUTH_BYPASS=1`, que es donde el propio arnés declara que debe correr (`scripts/diagSAL.mjs:10-23`).

---

## §B · Las tres escrituras documentales

`git diff --numstat -- docs/`, más el conteo del archivo nuevo:

```
 33   13   docs/AJILEI_Modos_y_Asistencia_v1.0.md
133   15   docs/AJILEI_Protegidos_v1.0.md
332    —   docs/AJILEI_APU-1_Reglas_v1.0.md   (nuevo, sin seguimiento)
```

### B-1 · `docs/AJILEI_APU-1_Reglas_v1.0.md` — nuevo

Copia **literal** del adjunto, sin un cambio de contenido. 332 líneas, UTF-8, LF. No hizo falta normalizar finales de línea: `.gitattributes:8` ya impone `* text=auto eol=lf` a todo el árbol desde GIT-1 (2026-08-26), así que la ley viaja en el repo y no en la máquina.

Con esto el proyecto tiene, por primera vez, **documento normativo del dinero**. Hasta hoy no existía ninguno: `AJILEI_Reglas_y_Motor_v2.md` nunca estuvo en el repositorio y no tenía sucesor (hallazgo I-1 de la Fase 0).

### B-2 · `docs/AJILEI_Modos_y_Asistencia_v1.0.md` — errata e1 en §3.3

Tres cambios y ninguno más:

| Dónde | Qué |
|---|---|
| Cabecera | Línea nueva **«Errata e1 (2026-09-17) — §3.3 corregida»**, con el remite al normativo. |
| §3.3, apertura | «**Costo único por partida.** El ganador se lleva el pote = monto × jugadores» → enunciado correcto: **el monto es el ante de cada mano**, con la cita `gameEngine.js:413-418` y el remite a `AJILEI_APU-1_Reglas_v1.0.md §2.4`. Se dice expresamente que **las tres tablas de montos siguen vigentes**: lo que estaba mal era qué significa el monto, no cuáles son. |
| §3.3, cierre | **Retiradas** la tabla de «pote mínimo / pote máximo» y la nota del 20 % del `saldoInicial`, con una línea que dice qué había y por qué se va. |
| §12 | Entrada de historial **«v1.0 · errata e1»**, con la razón, el alcance y la nota de que **§7 queda subsumido por `Protegidos` v1.4**. |

**Se retiran en vez de anotarse**, y la decisión se consigna porque la ficha la dejaba al ejecutor («lo más corto»). Las dos piezas describían **la primera mano con todos pasando**, no una partida: con ante por mano el pozo crece con cada subida y una partida cobra tantos antes como manos dure, así que no acotaban nada. Y la nota del 20 % se quedaba además sin referente, porque `saldoInicial` se retira en APU-1 (normativo §10). Una cifra que no acota nada, si se deja anotada, se sigue citando.

**Desviación de la ficha, consignada en §D-1:** la ficha pedía subir la versión interna de v1.0 a **v1.1**. No se hizo, porque ese nombre ya está ocupado por otro documento.

### B-3 · `docs/AJILEI_Protegidos_v1.0.md` — canónica a v1.4

| Dónde | Qué |
|---|---|
| Cabecera | Versión 1.3 → **1.4** y su bullet de actualización: la lista pasa de cinco a **seis**, con la procedencia (H-4 de MOT-1 → I-2 de APU-1 F0 → L-4 de Victor). |
| §2 | **Seis filas.** Entra `src/engine/deck.js` en la posición 3, con su autoridad. Prosa reescrita: los tres primeros son motor, IA y **baraja**; el cuarto, geometría de asientos. Párrafo nuevo **«Por qué `deck.js` entra en la v1.4, y por qué tarde»**, que cuenta el mecanismo del fallo: `Modos_y_Asistencia §7` se declaró *ampliación* a heredar «en el próximo salto natural de versión», y ese salto no ocurrió en tres versiones seguidas de esta lista. |
| §3 | Fila nueva de `deck.js`, **medida hoy** contra `f9ee503`. Nota al pie nueva sobre la columna `sha256` (§D-2). |
| §3, recuadro | El bucle de verificación pasa a recorrer **seis** archivos. |
| §4 | Bloque **«REABIERTO Y VUELTO A CERRAR — v1.4»**. Esta sección exigía «autorización explícita de Victor en este documento» para reabrirse; se deja constancia de que L-4 es esa autorización, y de que **lo que se reabre es el número, no el razonamiento**: los dos elementos no identificados de EMB-2 siguen sin ser archivos y ese cierre de la v1.1 se mantiene entero. |
| §5 | Viñeta nueva: **una excepción pre-autorizada se declara en la §6 y en ningún otro sitio**, con el motivo — la de la siembra vivió dos campañas dentro de un documento de fase, que es el mismo patrón que produjo el conflicto de la v1.4. |
| §6 | **Sección nueva, «Excepciones pre-autorizadas»**, con la única que existe: siembra del azar en `deck.js` **y en `aiPlayer.js`**, tabla de los siete puntos cubiertos, qué cambia respecto de la fase 4, por qué existe (la medición de R-3b) y el **límite declarado** — no autoriza cambiar ningún valor ni el orden de consumo del azar, y lo sella el test de oro. |

---

## §C · Tabla cerrada de ediciones

El entregable. Una fila por edición, contra `f9ee503`. **Ninguna se escribe en esta tanda.**

Leyenda de la columna «MOT-1»: número de edición de K-1(a) que esta fila cubre, según el normativo §9.1.

### C-1 · `src/engine/gameEngine.js` — **PROTEGIDO** · 11 ediciones

| # | Líneas | Qué cambia | Por qué (§ normativo) | Tanda | MOT-1 |
|---|---|---|---|---|---|
| **E-1** | `:1-4` | Los cuatro `import` pasan a llevar extensión `.js` explícita. | §9.1. Es la única edición que hace falta solo para **desplegar** el motor; la sonda MOT-1 la midió como necesaria y suficiente (P2). | 1b | **6** |
| **E-2** | `:51-53` `makePlayer` | Campos nuevos por jugador: **`allIn`** (bool), **`contribMano`** (int, contribución total a la mano) y **`entrada`** (int, con cuánto se sentó). | §4.3 (marca propia, distinta de `folded`), §4.2 (`C_i` es `contribMano`), §2.5 (el resultado se calcula contra la entrada). | 1b | — |
| **E-3** | `:56-89` `createInitialState` | Firma nueva: recibe **lista de jugadores con fichas por asiento** en vez de `(unit, numPlayers)`. Desaparece la lectura de `AJILEI_CONFIG.economy.saldoInicial` de `:57`. Cada jugador nace con su `entrada`. | §2.2 (entrada del humano), §2.3 (pila de cada IA = `min(entrada+1000, techo)`), §9.1. **La misma edición que MOT-1 pide, con el campo de fichas dentro.** | 1b | **4** |
| **E-4** | `:68-88` estado base | **`pot` deja de ser escalar.** Forma propuesta en §E; la decide el rector antes de 1b. | §4.2. Es el cambio de mayor superficie de la campaña: cambia la forma del estado que viajará por red. | 1b | — |
| **E-5** | `:113-117` `isRoundOver` | Salta a los `allIn` además de a los `folded` al decidir si la ronda cerró. Condición nueva: **si queda un solo jugador con fichas, no hay más rondas**. | §4.3. La Fase 0 (B-3) identificó esta función como el único sitio que decide que una ronda ya no tiene nada que hacer. | 1b | — |
| **E-6** | `:120-127` `nextActiveIndex` | Predicado de salto: `folded \|\| allIn`. | §4.3. **No se puede reutilizar `folded`**: el retirado pierde el pozo, el all-in compite por sus capas. | 1b | — |
| **E-7** | `:130-136` `resolveWinner` | Reparto **por capas** con su lista de elegibles, en vez de pozo entero a un ganador. | §4.2. | 1b | — |
| **E-8** | `:139-202` `doShowdown` | Resuelve **cada capa por separado**, restringiendo el desempate por cercanía a la Mano (`:157-163`, sin cambio de regla) a los elegibles de esa capa. | §4.2, tercer bullet. | 1b | — |
| **E-9** | `:210` y `:529` | El reset por ronda pone `contrib` a 0 y **deja `contribMano` intacto**. | §4.2. Hoy `contrib` es por ronda y no hay acumulado de mano; sin este matiz las capas se calculan sobre el dato equivocado. | 1b | — |
| **E-10** | `:249-361` `applyBetAction` | **(a)** se exporta; **(b)** se retiran las tres guardas de reescritura de `:255-262` —el motor deja de convertir acciones en `retirarse`—; **(c)** consulta legalidad y costo en `pozos.js`; **(d)** devuelve **señal de rechazo** y estado sin cambios ante acción ilegal; **(e)** acción nueva **`allIn`**; **(f)** valida monto (entero, > 0, `k ∈ {1,2,5,10}`). | §3.2 y §4.1. La (f) cierra además N-4 de la Fase 0 y el punto 5 de la tabla E5 de MOT-1 F0 («el motor acepta cualquier cosa»). | 1b | **1** |
| **E-11** | `:367-453` `startHand` | **(a)** el ante suma a `contribMano`; **(b)** se conserva la eliminación de quien no cubre el ante (`:374-382`); **(c)** **se retira el `GAME_OVER` por quiebra del asiento 0 con ≥2 vivos** (`:399-406`); **(d)** punto de entrada de la recarga. | §2.4, §5.4, §9.1. Hoy la pantalla ya **desobedece** ese `GAME_OVER` con un modal (`GameTable.jsx:1294-1302`); la edición pone el motor de acuerdo con lo que el juego ya hace. | 1b | **5** |
| **E-12** | `:479-483` `applyAIBetAction` | Pasa **`k × unit`** al aplicar, usando la `k` que la IA devuelve, en vez del `state.unit` fijo de `:482`. | §6.2. Es la línea que hoy hace imposible que la IA suba más de ×1 (Fase 0, C-5). | **1c** | — |

**Nota de cita:** la ficha §2.4 sitúa esta última edición en `:474-483`. Ese rango incluye `applyPlayerBetAction` (`:474-476`), que **no cambia**. La edición es solo sobre `applyAIBetAction` (`:479-483`), y dentro de ella solo sobre `:482`.

### C-2 · `src/engine/aiPlayer.js` — **PROTEGIDO** · 9 ediciones · todas 1c

| # | Líneas | Qué cambia | Por qué (§ normativo) |
|---|---|---|---|
| **A-1** | `:650` firma de `decideBetAction` | Devuelve **`{ action, k }`** con `k ∈ {1,2,5,10}` cuando la acción es `apostar` o `subir`. | §6.2 |
| **A-2** | `:664`, `:670`, `:831-832` | Las cuatro guardas de saldo dejan de hacer su propia aritmética y **consultan `pozos.js`**. | §3.2. Son dos de los cuatro sitios del riesgo R-5. |
| **A-3** | `:851-857` (`BET_2`) y `:863-869` (`BET_3`) | Rama nueva de **subida fuerte por puntaje**: si el puntaje alcanza el umbral de su mesa, sube con el **mayor `k` que su pila cubra**. `BET_1` queda reactiva. | §6.3 |
| **A-4** | `:759-767` `pagaElBote` | Sustituido por la **regla del cuarto del pozo**: si lo que debe poner es ≤ ¼ del pozo, paga siempre sin mirar cartas. | §6.5. La equidad de mano deja de intervenir en el pago. |
| **A-5** | donde hoy se retira por no cubrir (`:664`, y las salidas de `:844`, `:853`, `:865`) | Rama nueva de **all-in de la IA**: pila ≤ ¼ del pozo → all-in siempre; si no, all-in solo con puntaje ≥ umbral. | §6.6 |
| **A-6** | junto a `:461-471` | **Estado de módulo nuevo** para el farol por bloques: bloque actual, mano sorteada, IA elegida. Se tira con las mismas dos señales de partida nueva que ya usa `_ensurePersonalities` (`:563-574`). | §6.4 |
| **A-7** | `:13-18` perfiles | Cada temperamento **desplaza** los umbrales de §6.3 y el de §6.6. | §6.7 |
| **A-8** | `:829-839`, `:851-857` | **Pasar con mano grande**: con probabilidad `p` por reto, pasa o iguala en `BET_2` con mano sobre el umbral y sube fuerte en `BET_3`. | §6.8 |
| **A-9** | `:494`, `:644`, `:696`, `:803`, `:852`, `:864` | Los seis `Math.random` pasan a **generador inyectable**, `Math.random` por defecto. | §6.11 · **cubierto por la excepción pre-autorizada `Protegidos` v1.4 §6.1** |

**Edición que falta en la lista de la ficha y sí hace falta:** la **señal de «tamaño de decisión»** para el ritmo (§6.9). La ficha la nombra pero no le da sitio. Propuesta: viaja en el mismo objeto de retorno de `decideBetAction` (`{ action, k, peso }`), lo que la hace **parte de A-1** y no una edición aparte — si viajara por otra vía, el motor tendría que transportar un dato que no usa.

### C-3 · `src/engine/deck.js` — **PROTEGIDO desde `Protegidos` v1.4** · 1 edición

| # | Líneas | Qué cambia | Por qué | Tanda |
|---|---|---|---|---|
| **D-1** | `:42-49` `shuffleDeck`, el `Math.random` de `:45` | Generador inyectable, `Math.random` por defecto. | §6.11 · **excepción pre-autorizada** (`Protegidos` v1.4 §6.1, heredada de `Modos_y_Asistencia §7.1`) | 1b |

### C-4 · Archivos nuevos, **no protegidos**

**`src/engine/pozos.js`** (1b) — puro, sin React ni DOM, molde de `handEvaluator.js`. Firmas **propuestas**; las fija el rector:

| Función | Firma propuesta | Qué responde |
|---|---|---|
| `costoDe` | `(state, seat, accion, k) → int` | Cuántas fichas cuesta esa acción a ese asiento ahora mismo. |
| `esLegal` | `(state, seat, accion, k) → { ok: bool, motivo: string\|null }` | Si la acción se puede aplicar, y por qué no si no. El `motivo` es la señal de rechazo de §3.2. |
| `accionesDe` | `(state, seat) → string[]` | Las acciones legales de ese asiento. **La añade el ejecutor**: es lo que sustituye a `canPass/canBet/canCall/canRaise` (`GameTable.jsx:972-976`) y lo que hace que la pantalla deje de tener aritmética propia. Sin ella, R-5 se cierra a medias. |
| `capasDe` | `(state) → [{ monto, elegibles: int[] }]` | Las capas del pozo con sus elegibles. |
| `repartirCapas` | `(state, ganadorPorCapa) → players[]` | Aplica el reparto. |

**`src/config/ajileiConfig.js`** (1b) — no protegido:

| Qué | Líneas | Acción |
|---|---|---|
| `betting.multiplicadores` | nuevo | Entra: `[1, 2, 5, 10]`. Hoy es literal en `GameTable.jsx:1919` (normativo §10). |
| `betting.entrada.{piso,medio,techo}` | nuevo | 5× · 15× · 50× (§2.2). |
| `betting.recarga.{umbral,plazoMs}` | nuevo | 5× unit · 10 000 ms (§5.1). |
| `ia.margenPila` | nuevo | 1 000 HC (§2.3). |
| `ia.subidaFuerte.porMesa`, `ia.farol.bloquePorNivel`, `ia.fraccionPozo`, `ia.allIn.puntajeMin`, `ia.pasarConManoGrande` | nuevo | Cifras de TRABAJO (§10). Entran como **parámetros barribles**, que es la condición para que 1d las pueda fijar. |
| `subidaMaximaPorAccion`, `maximoPorRonda`, `subidaMinima`, `allInEnabled` | `:16-18` | **RETIRAR.** Cero lectores, verificado por `grep` global en la Fase 0 (A-7). |
| `economy.saldoInicial` | `:22` | **RETIRAR**, con sus lectores. Ver el detalle abajo — **y el hallazgo D-5**. |

**Los cinco lectores de `saldoInicial` y qué los sustituye:**

| # | Lector | Qué hace hoy | Qué lo sustituye |
|---|---|---|---|
| 1 | `src/engine/gameEngine.js:57` | Fichas iniciales de todo asiento | La **entrada por asiento** de E-3 |
| 2 | `src/hooks/sesionCore.js:50` `fichasNetas` | `chips − 5000` | `chips − entrada` (§2.5) |
| 3 | `src/components/ModeSelect.jsx:40` | Píldora de saldo | Desaparece con la pantalla (§7) |
| 4 | `src/screens/Lobby.jsx:173` | Píldora de saldo del lobby | **Saldo real** vía `saldoDelJugador()` |
| 5 | `src/lib/saldo.js:43` | **Es** el saldo real | **No se puede retirar todavía** — ver D-5 |

### C-5 · Fuera del motor — inventario para 1e (sin líneas de cambio)

| Archivo | Puntos | Qué le toca |
|---|---|---|
| `GameTable.jsx` | `:972-976` | Las cuatro legalidades → `pozos.accionesDe` |
| | `:1913-1938` | Fila de multiplicadores desde config; botón **All-in** como quinto de `.action-buttons` (§4.1) |
| | `:2000` | **Quinta condición** del gate de «Siguiente mano», para la recarga (§5.1) |
| | `:2236-2257` | El modal de bancarrota con dos «Próximamente» → **pantalla de recarga forzosa** (§5.4) |
| | `:60` `AI_ACTION_MS` | Ritmo por rango con sesgo (§6.9) |
| | `:1766-1773` | `fichasNetas` contra la entrada (§2.5) |
| | `OpponentPanel.jsx:147-151` / `:84-93` | Badge **ALL-IN**. Los dos huecos están **ocupados** (riesgo R-6): medir con `diagDSK o1` antes de decidir cuál cede |
| `cronicaCore.js` | `:74-91` | **Frase propia del all-in involuntario** (§4.4, L-7) |
| `salas.js` | `:39-41` | `BONO_BIENVENIDA` 1200 → **2500**. Mueve `ALCANCE_NUEVOS` (`:68`) y **dos aserciones** (`salas.test.js:74-83`) — ver D-6 |
| `ArmarMesa.jsx` | `:233-250`, `:252-287`, `:289-327` | Extraer `FilaChips` + carcasa (K-3a, §7) |
| `NivelSelect.jsx`, `ModeSelect.jsx` | completos | **Se retiran**, sustituidos por «Retar a las IAS» (§7) |
| `TableSelect.jsx` + `STAKE_OPTIONS` | `ajileiConfig.js:1` | **Código muerto**, se retira (§7) |
| `textos.es.js` | 101 claves, prefijos `lob.` y `sal.` | Claves nuevas. **Prefijo propuesto: `ia.`** — corto, libre, y paralelo a `sal.` |
| `App.jsx` | `:137-164`, `:448-481` | Una casilla de `screen` en vez de dos; `entrada` como estado nuevo, **no persistido** (§2.1) |

---

## §D · Hallazgos contra el adjunto y contra la ficha

Ninguno se corrigió. La regla §1.2 de la ficha prohíbe tocar el adjunto; y la ficha misma no se edita.

**D-1 · La ficha pide una versión que ya existe, y es otro documento.** ⚠ *Desviación ejecutada*

La ficha §2.2 dice: «Sube la versión interna del documento (v1.0 → v1.1; el nombre del archivo no cambia, criterio de la casa)». **No se puede.** `docs/AJILEI_Modos_y_Asistencia_v1.1.md` existe desde el 2026-08-15 (tanda NIV-CAL, 511 líneas) y es un documento **distinto**: un delta que «no sustituye párrafo a párrafo» a la v1.0 y «manda sobre ella allí donde diverge» (su cabecera, `:5-9`). Bajo la instrucción literal habría dos documentos llamados v1.1 con contenidos diferentes.

La causa es que **en este repositorio conviven dos convenciones de versionado** y la ficha aplicó la de un documento a la de otro:

| Convención | Cómo | Quién la usa |
|---|---|---|
| Versión **en la cabecera**, un solo archivo | `_v1.0.md` sube su cabecera a v1.1, v1.2, v1.3… | `Protegidos` (v1.0→v1.4) |
| Versión **por archivo** | `_v1.0.md`, `_v1.1.md`, `_v1.2.md`… cada uno se queda | `Modos_y_Asistencia`, `Menu_Utilidades` (v1.0→v1.5), `Tapetes`, `Victory_Celebration` |

**Ejecutado como errata `e1` en la cabecera y en §12 del propio v1.0**, sin tocar el número de versión. La razón queda escrita en el documento, no solo aquí. **Para el rector:** si prefiere otra forma —un `_v1.2.md` nuevo de la cadena, o llevar la corrección al v1.1 que es la cabeza viva— es un cambio de una tanda.

**D-2 · La columna `sha256` de `Protegidos §3` no reproduce en tres de cinco filas.** ⚠ *Levantado, no corregido*

Medidas hoy las seis filas contra `f9ee503`:

| Archivo | blob git | sha256 sellado | sha256 medido |
|---|---|---|---|
| `gameEngine.js` | `6ddadd536eb8` ✅ | `cad9af74e51e474e` | **`0bf7c67a68770328`** |
| `aiPlayer.js` | `0860812af936` ✅ | `9135fe06d0a5d2c0` | **`0b8da6501066c417`** |
| `seatLayouts.js` | `0d1bb8ea66a8` ✅ | `0049051fd4b8b891` | `0049051fd4b8b891` ✅ |
| `opponentPanel.css` | `3ce6383eec0d` ✅ | `50c98d51a91c3994` | `50c98d51a91c3994` ✅ |
| `gameTable.css` | `1e21371c8543` ✅ | `149591867769ad91` | **`269120a496910995`** |

Las seis blob git y las seis cifras de líneas reproducen **exactamente**, y `git diff f9ee503` sale limpio en los seis. El blob de git es un hash criptográfico del contenido exacto: **los bytes son provablemente los mismos**. **No es cuestión de finales de línea** — se comprobó normalizando a LF y el hash no cambia.

Conclusión: si el contenido no cambió, las tres cifras escritas **no pueden corresponder a estos bytes**. Es un error de medición o de transcripción del sellado, **no una alarma de integridad**. Se marcaron con ⚠ en el documento y **no se reescribió ninguna**: una tanda documental que no abre un solo archivo de `src/` no tiene mandato para re-sellar cifras de integridad. **Decisión para el rector:** cuándo se re-miden las seis de una vez, con el requisito que el propio §3 impone — medirlas, no copiarlas.

**D-3 · La cabeza de la cadena queda apuntando a dos cosas que ya no son ciertas.** *Residual, no corregible en esta tanda*

`AJILEI_Modos_y_Asistencia_v1.1.md §9` («Lo que la v1.0 mantiene, sin cambios») dice hoy:

- `:462` — «**§3 · Nombres y tablas** — Básico/Avanzado/Pro y las tres tablas de entrada» → tras la errata e1, §3.3 ya no dice lo que decía.
- `:466-467` — «**§7 · Lista de protegidos** — **cinco archivos**, con la excepción pre-autorizada de siembra en `deck.js`» → tras `Protegidos` v1.4 son **seis**, y la excepción cubre además `aiPlayer.js`.

**No se tocó**: sería una quinta escritura y la ficha autoriza exactamente cuatro. Es de dos líneas y debería viajar en la próxima tanda que abra ese archivo.

**D-4 · El sorteo de la Mano de PvP ya tiene función escrita, sin usar.**

El normativo §8 describe el sorteo de la Mano de la primera mano en PvP («cada jugador elige una carta al azar; gana el valor nominal más alto; el 12 es el mayor»). **Esa función existe**: `deck.js:32-40` `drawRank`, con el comentario «Maps printed card value to its rank in the initial draw (As is the LOWEST)» y el mapeo `1→1 … 7→7, Sota→8, Caballo→9, Rey→10`. MOT-1 F0 §A3 la censó como **«sin ningún consumidor»**.

No es un error del adjunto —el adjunto no tiene por qué saberlo— pero sí un dato que le ahorra trabajo a quien escriba §8: la escala ya está decidida y **coincide** con la del normativo (el Rey, 12, es el más alto). Con `deck.js` ahora protegido, conviene saber que esa función **ya está dentro** y no hace falta abrirlo para añadirla.

**D-5 · Retirar `saldoInicial` deja al saldo real sin fuente.** ⚠ *Contradicción operativa*

El normativo §10 manda **RETIRAR** `economy.saldoInicial` «y sus cinco lectores (A-1)». Cuatro de los cinco tienen sustituto claro (tabla de C-4). **El quinto no**: `src/lib/saldo.js:43` **es** el saldo real del jugador —`saldoDelJugador()` devuelve esa constante— y es el único lector que las salas pueden importar por doctrina de SAL-A. Sus consumidores vivos son `ArmarMesa.jsx:65`, `SalaOpciones`, `SalaEspera` y `BarraSuperior.jsx:44-50`.

Y la entrada de §2.2 **necesita** un saldo real: «si el saldo real no cubre ni el 5× de una mesa, esa mesa no se puede escoger». Retirar la constante sin que ECO-1 exista dejaría a la pantalla nueva sin la cifra contra la que decide.

Tampoco se puede leer de la base: `public.saldo_de()` devuelve también el literal `5000` (`sal_a_salas.sql:315-321`) y declara en su comentario que ECO-1 lo sustituye.

**Lectura del ejecutor:** el normativo tiene razón en el fondo —el saldo de la mesa y el saldo de la cuenta **son dos cosas distintas y hoy son la misma constante**, que es exactamente la confusión que APU-1 deshace—. Lo que no puede es retirar las dos a la vez. **Propuesta:** retirar `economy.saldoInicial` como *fichas de mesa* (lectores 1–4) y **dejar el lector 5 en pie con nombre propio** —`economy.saldoRealProvisional`, o que `saldo.js` lleve la constante él mismo— hasta ECO-1. Es una línea y separa los dos conceptos, que es lo que se busca. **Decide el rector.**

**D-6 · El bono a 2.500 mueve más de lo que el normativo anota, porque §8 cambia la regla de la que `ALCANCE_NUEVOS` se deriva.**

El normativo §10 dice que el bono «mueve `ALCANCE_NUEVOS` y dos aserciones». Correcto pero incompleto. `ALCANCE_NUEVOS` se deriva de la **regla del 5×** (`salas.js:68` → `apuestasAlAlcance` → `saldoMinimo` = `REGLA_ASIENTO × apuesta`), y el propio normativo §8 **retira esa regla** en PvP y la sustituye por «saldo real ≥ entrada», con entrada 15× o 50×. Los tres resultados no coinciden:

| Regla | Con bono 2.500 | Mesas al alcance de una cuenta nueva |
|---|---|---|
| 5× (hoy) | `5 × apuesta ≤ 2500` | `[100, 200, 500]` (hoy es `[100, 200]`) |
| Entrada corta 15× (§8) | `15 × apuesta ≤ 2500` | `[50, 100]` |
| Entrada llena 50× (§8) | `50 × apuesta ≤ 2500` | `[50]` |

Y el aviso al anfitrión de `ArmarMesa` (`salasCore.js:196-198` `fueraDelAlcanceDeNuevos`, texto `textos.es.js:109`) se calcula con la regla vieja: tras §8 diría algo falso. Está escrito como **fórmula y no como constante** —una decisión deliberada de SAL-A, con su razón en `salasCore.js:188-195`— así que **se corrige cambiando qué fórmula recibe**, no reescribiendo el texto. No es trabajo de 1b; es de la tanda de PvP. Se anota para que no se descubra allí.

**D-7 · Dos imprecisiones de cita menores.**

- Ficha §2.4: «`applyAIBetAction :474-483`». El rango incluye `applyPlayerBetAction` (`:474-476`), que no cambia. La edición es `:479-483`, y dentro de ella `:482`. Corregido en C-1/E-12.
- Normativo §1, tabla de vocabulario: sitúa el farol ⑥ «en Pro» sin línea. Está en `aiPlayer.js:769-812`. Sin consecuencia.

**D-8 · Una regla del normativo cuya implementación no es evidente sin abrir algo que no está en la tabla.**

§4.2 dice que el pozo se organiza en capas «**al cerrar cada ronda**», pero las capas son una función de las contribuciones **totales de la mano** (`C_i`) y de los niveles de all-in, y ninguna de las dos cosas queda fija hasta el final. Calcularlas al cierre de cada ronda y otra vez al cierre de mano puede dar resultados distintos si alguien va all-in en una ronda posterior.

**Lectura del ejecutor:** no es contradicción sino dos usos del mismo cálculo — el del **cierre de ronda** es para **enseñar** el pozo dividido, y el del **cierre de mano** es el que **reparte**. Si es así, `capasDe(state)` es pura y se puede llamar cuantas veces haga falta, y no hace falta abrir nada más. **Se anota porque la frase admite la otra lectura** (que el pozo se congele por capas al cerrar ronda), y esa sí obligaría a guardar las capas en el estado y a decidir qué pasa con un all-in posterior. Lo aclara el rector en §E.

---

## §E · Propuesta de forma del estado

Para que el rector la decida **antes** de 1b. Tres piezas.

### E-1 · El pozo

```js
// Hoy:  pot: 0                                    (escalar)
// Propuesta:
pot: 0,                       // SE CONSERVA: total de la mano. Invariante: pot === Σ capas.
// (no hay campo de capas en el estado)
```

**La propuesta es no guardar las capas.** Se derivan con `pozos.capasDe(state)` a partir de `players[i].contribMano`, `players[i].folded` y `players[i].allIn`, que es todo lo que la fórmula del §4.2 necesita. Razones:

1. **`pot` sigue siendo un entero** y el invariante `pot === Σ capas` se puede afirmar en cada prueba. Un campo derivado guardado es un campo que puede mentir.
2. **El estado no crece** (§E-3) y, sobre todo, **no cambia de forma** para el árbitro de MOT-1: un `pot` escalar serializa y viaja igual que hoy.
3. Resuelve D-8 por construcción: si las capas son una función pura, «calcularlas al cerrar ronda» es enseñarlas, no congelarlas.

**La alternativa** —`pot: { total, capas: [{monto, elegibles}] }`— solo hace falta si el rector quiere que las capas se **congelen** al cerrar ronda. Es más explícita y más fácil de pintar, pero introduce un estado que hay que mantener coherente en cada acción y que el árbitro tiene que validar al recibirlo.

### E-2 · Campos por jugador

```js
// Hoy:
{ id, name, isHuman, chips, cards, contrib, acted, folded, score, eliminated }
// Propuesta (+3):
{ id, name, isHuman, chips, cards, contrib, contribMano, acted, folded, allIn, score, eliminated, entrada }
```

| Campo | Tipo | Por qué |
|---|---|---|
| `contribMano` | `int` | El `C_i` de §4.2. `contrib` sigue siendo por ronda y se sigue reseteando (E-9). |
| `allIn` | `bool` | La marca propia de §4.3. Se resetea por mano como `folded`, no como `eliminated`. |
| `entrada` | `int` | Con cuánto se sentó. Lo necesitan §2.5 (resultado contra la entrada) y §2.3 (pila de las IAS). Se escribe una vez, en `createInitialState`, y no se vuelve a tocar **salvo recarga** (§5.2), que es el único caso en que sube. |

### E-3 · Señal de rechazo

**Propuesta: no viaja en el estado.** `applyBetAction` devuelve el **mismo objeto de estado** (identidad `===`, que es lo que hoy ya aprovecha `setGame` en `GameTable.jsx:301-306` para no re-renderizar) y el motivo se obtiene consultando `pozos.esLegal(...)` **antes** de aplicar, que es lo que la pantalla y la IA van a hacer de todas formas.

Razón: una señal dentro del estado es un campo que hay que limpiar en la acción siguiente, y que si no se limpia miente. El precedente de la casa es el mismo: `message` dejó de vivir en el óvalo por esto (REN-2). **Si el rector prefiere que el árbitro devuelva un motivo por red**, es el valor de `pozos.esLegal`, no un campo del estado.

### E-4 · Tamaño serializado

Referencias medidas por MOT-1: **3 282 bytes** el estado de mesa 2 en `BET_1` (F0 §D1) y **3 709 bytes** el máximo de mesa 5 en 200 manos (F0 §D3).

| Concepto | Δ por jugador | Δ mesa 2 | Δ mesa 5 |
|---|---|---|---|
| `contribMano` (clave + valor) | ~18 B | +36 B | +90 B |
| `allIn` (clave + `false`) | ~14 B | +28 B | +70 B |
| `entrada` (clave + valor) | ~16 B | +32 B | +80 B |
| **Total con la propuesta E-1** | ~48 B | **+96 B** | **+240 B** |

Mesa 2 pasa del orden de **3 378 B** y mesa 5 del orden de **3 949 B**: **sigue por debajo de 4 KB**, que es el listón que MOT-1 usó. Con la alternativa de capas guardadas habría que sumar el array —del orden de 40 B por capa, hasta 4 capas en mesa 5— y mesa 5 **rozaría los 4,1 KB** con las identidades PvP que MOT-1 estima en +270 B. Es un argumento más para E-1, y es el único de los tres que se puede medir en vez de discutir.

---

## §F · Conteo de pruebas previsto para 1b

Hoy el motor tiene **44 pruebas** (`scripts/testEngine.test.js`) y **de ellas tocan dinero 3** —el bloque «6. Fondos insuficientes → retiro forzoso» (`:325-376`)— más dos aserciones sueltas de pozo (`:392`, `:481`). El normativo pide del orden de 25–35 nuevas. Reparto propuesto:

| Función / archivo | Aserciones nuevas | Qué cubren |
|---|---|---|
| `pozos.capasDe` | **8–10** | Sin all-in (una capa) · un all-in · dos all-in a niveles distintos · all-in por debajo del ante · el retirado que contribuyó y no es elegible · **el invariante `Σ capas === pot`** en las cuatro mesas |
| `pozos.repartirCapas` | **5–6** | Ganador único por capa · ganadores distintos por capa · desempate por cercanía a la Mano **dentro** de una capa · la capa superior con un solo elegible vuelve entera a quien la puso · **aritmética entera sin sobrante** |
| `pozos.esLegal` / `costoDe` / `accionesDe` | **6–8** | Monto negativo · no entero · `k` fuera de `{1,2,5,10}` · acción fuera de turno · acción de un `folded` o de un `allIn` · «All-in» ofrecido **solo** cuando no se cubre · «Igualar» desaparece en ese caso |
| `applyBetAction` (E-10) | **5–6** | Acción ilegal **no cambia el estado** (identidad `===`) · el motor **ya no reescribe** a `retirarse` · all-in **no reabre** la ronda · all-in **no termina** la mano |
| `isRoundOver` / `nextActiveIndex` (E-5, E-6) | **4–5** | Se salta al `allIn` · un solo jugador con fichas → no hay más rondas · el `allIn` **sí** descarta |
| `createInitialState` / `startHand` (E-3, E-11) | **4–5** | Fichas por asiento · pila de IA `min(entrada+1000, techo)` · ante contra `contribMano` · **quebrar el asiento 0 con ≥2 vivos ya no devuelve `GAME_OVER`** |
| **Total** | **32–40** | |

Dos notas: (1) las 3 de «fondos insuficientes» **cambian de veredicto**, no se borran — donde esperaban retiro forzoso ahora esperan all-in, y conviene que lo hagan en su sitio para que el diff cuente la historia; (2) el **test de oro** de `scripts/testNivel1.test.js §1` y la trampa Proxy de `testNivel2.test.js §8` son **puertas de 1c, no de 1b**, pero la siembra de D-1/A-9 las cruza: un generador inyectable que con `Math.random` por defecto cambiara una sola decisión es violación de la excepción (`Protegidos` v1.4 §6.1).

---

## §G · Cierre

### `git status`

```
 M .gitignore
 M docs/AJILEI_Modos_y_Asistencia_v1.0.md          ← escritura 2
 M docs/AJILEI_Protegidos_v1.0.md                  ← escritura 3
?? _probeA1.mjs
?? _shotA1.mjs
?? docs/AJILEI_APU-1_Reglas_v1.0.md                ← escritura 1
?? docs/reportes/AJILEI_APU-1_Fase0_Informe_v1.0.md
?? docs/reportes/AJILEI_APU-1_Fase1a_Informe_v1.0.md  ← escritura 4
?? docs/reportes/AJILEI_MOT-1_Fase0_Informe_v1.0.md
?? docs/reportes/AJILEI_MOT-1_Fase1-0_Sonda_Informe_v1.0.md
?? laminas/mon1/_entorno.txt
?? laminas/mon1/lamina.html
?? laminas/mon1/tiempos.json
?? scripts/_cel1bFila.mjs
```

Las cuatro escrituras y **nada más**. Todo lo demás ya estaba así al arrancar. `.gitignore`, la sonda `supabase/functions/sonda_mot1/` y los tres informes previos sin seguimiento **no se tocaron**, como manda la ficha §3.

### Protegidos — los seis, intactos

```
INTACTO  src/engine/gameEngine.js
INTACTO  src/engine/aiPlayer.js
INTACTO  src/engine/deck.js          ← protegido desde hoy
INTACTO  src/config/seatLayouts.js
INTACTO  src/styles/opponentPanel.css
INTACTO  src/styles/gameTable.css
```

`git diff f9ee503` limpio en los seis; blobs y líneas idénticos a la instantánea de `Protegidos` §3 (con la salvedad de la columna `sha256`, D-2). **Ninguno se abrió**: se leyeron para citar líneas, que es lo que la ficha §1.1 permite.

### Tiempo por tramo

| Tramo | Tiempo |
|---|---|
| Línea base (lint · vitest · `diagSAL` con servidor propio) | ~10 min |
| Escritura 1 — el normativo | ~10 min |
| Escritura 2 — errata de `Modos_y_Asistencia` (incluido el descubrimiento de D-1) | ~20 min |
| Escritura 3 — `Protegidos` v1.4 (incluida la medición de los seis y D-2) | ~30 min |
| §C — la tabla cerrada, con verificación de citas | ~35 min |
| §D · §E · §F y redacción | ~30 min |
| **Total** | **~2 h 15**, dentro del tope de 3 h |

**STOP.** Sin commits.
