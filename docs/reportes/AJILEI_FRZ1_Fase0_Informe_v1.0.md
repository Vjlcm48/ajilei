Fase 0 cerrada. Árbol intacto (`3ea2e27`, los cuatro residuos declarados, cinco protegidos `INTACTO`); lo único que escribí fue `dist/` al reconstruir para el preview — carpeta ignorada, y el build salió con el mismo hash que ya servía el 4173.

---

# AJILEI · FRZ-1 · Fase 0 · Informe v1.0

**Diagnóstico de solo lectura · 04-sep-2026 · base `main` @ `3ea2e27`**

---

## 1 · Tabla de relojes

### 1.1 `src/components/GameTable.jsx` — 30 relojes (29 `setTimeout` + 1 `rAF`)

| Línea | Tipo | Qué dispara | Handle | ¿Se cancela? |
|---|---|---|---|---|
| [254](src/components/GameTable.jsx#L254) | `rAF` | `FlyingCard`: aplica el `translate` → **arranca la transición CSS** | local `id` | sí, 255 |
| [273](src/components/GameTable.jsx#L273) | `onTransitionEnd` | fin del vuelo → `onDone` ([1971](src/components/GameTable.jsx#L1971)): retira la voladora y **`setDealStep(s+1)`** o `markRefilled` | — | no cancelable (evento) |
| [377](src/components/GameTable.jsx#L377) | `setTimeout` 600 | retira el "+N" del pozo | `t` | sí, 378 |
| [631](src/components/GameTable.jsx#L631)/632/633 | `setTimeout` 300/600/900 | `revealDeal3(2/3/4)` — voltea las 3 cartas de DEAL_3 | `t0/t1/t2` | sí, 639 |
| [634](src/components/GameTable.jsx#L634) | `setTimeout` 2000 | cierra DEAL_3: `setDealStep(0)` + `advanceFromDeal` | `t3` | sí, 639 |
| [641](src/components/GameTable.jsx#L641) | `setTimeout` 400 | cierra DEAL_2: `advanceFromDeal` | `t` | sí, 645 |
| [647](src/components/GameTable.jsx#L647) | `setTimeout` 120/0 | `launchFlyingCard(dealStep)` — siguiente carta | `t` | sí, 648 |
| [677](src/components/GameTable.jsx#L677) | `setTimeout` 1000 | **reloj de turno**: `timeLeft−1`, `timerWarning` ≤5, y a 0 pasar/retirarse o descartar | `t` | sí, 690 |
| [860](src/components/GameTable.jsx#L860) | `setTimeout` 1125 | **jugada de la IA**: `applyAIBetAction` + sus sonidos | `t` | sí, 870 |
| [883](src/components/GameTable.jsx#L883) | `setTimeout` 0 | salta en silencio a un activo retirado | `t` | sí, 889 |
| [895](src/components/GameTable.jsx#L895) | `setTimeout` 1125 | humano retirado en DISCARD → rivales descartan solos | `t` | sí, 896 |
| [962](src/components/GameTable.jsx#L962) | `setTimeout` 350 | revelado de la carta repuesta del humano (+ comodín) | **ninguno** | **NO** |
| [982](src/components/GameTable.jsx#L982) | `setTimeout` | narración del descarte por asiento | `discardTimersRef` | solo al desmontar (360-365) |
| [988](src/components/GameTable.jsx#L988) | `setTimeout` | vuelo carta→mazo | ídem | ídem |
| [991](src/components/GameTable.jsx#L991) | `setTimeout` | vuelo mazo→slot | ídem | ídem |
| [996](src/components/GameTable.jsx#L996) | `setTimeout` | **commit del descarte: `setGame(nextGame)`** | ídem | ídem |
| [1076](src/components/GameTable.jsx#L1076) | `setTimeout` 3000 | autocierre del toggle de saldo | `chipTimerRef` | sí (1073/1082/1096/364) |
| [1117](src/components/GameTable.jsx#L1117)/1119/1128/1130 | `setTimeout` ×4 | coreografía de reveal: `collect` → `grow`+`setDisplayedSeat` → `open` → fin | `revealTimersRef` | sí, 1031 + unmount |
| [1179](src/components/GameTable.jsx#L1179)/1181/1187 | `setTimeout` ×3 | rotación de sacudida del nombre | `timers` local | sí, 1188 |
| [1247](src/components/GameTable.jsx#L1247) | `setTimeout` 1000 | ceremonia de eliminación: aviso central | `ceremonyTimersRef` | solo unmount |
| [1251](src/components/GameTable.jsx#L1251) | `setTimeout` 3750 | ceremonia: fade + `commitReflow(next)` | `ceremonyTimersRef` | solo unmount |
| [1265](src/components/GameTable.jsx#L1265) | `setTimeout` 600 | apaga `reflowing` | **ninguno** | **NO** |
| [1272](src/components/GameTable.jsx#L1272) | `setTimeout` 1950 | apaga `isShuffling` → **dispara el reparto** | **ninguno** | **NO** |
| [1920](src/components/GameTable.jsx#L1920) | `setTimeout` 300 | "Siguiente mano": `isClearing=false` + `beginHand()` | **ninguno** | **NO** |

### 1.2 Resto del árbol del juego

| Archivo:línea | Tipo | Qué dispara | Handle | ¿Se cancela? |
|---|---|---|---|---|
| [Celebracion.jsx:31](src/components/Celebracion.jsx#L31) | `rAF` | `FichaViajera`: mide escala y lanza el vuelo | `id` | sí, 41 |
| [Celebracion.jsx:154](src/components/Celebracion.jsx#L154) | `rAF` | `MonedaTraspaso`: lanza el vuelo | `id` | sí, 155 |
| [Celebracion.jsx:168](src/components/Celebracion.jsx#L168) | `onTransitionEnd` | **aterrizaje → avanza el tramo del relato** | — | no cancelable |
| [Celebracion.jsx:205](src/components/Celebracion.jsx#L205) | `rAF` | mide el vuelo de la tarjeta | `id` | sí, 212 |
| [Celebracion.jsx:345](src/components/Celebracion.jsx#L345) | `setTimeout` 3000 | retira "Próximamente" | `avisoTimer` | sí, 342/349 |
| [LluviaHeptacoins.jsx:29](src/components/LluviaHeptacoins.jsx#L29) | `setInterval` | emite gotas | `t` | sí, 39 · **ya se apaga con `pausada`** |
| [LluviaHeptacoins.jsx:58](src/components/LluviaHeptacoins.jsx#L58) | `onAnimationEnd` | `cel-caida` → retira la gota (animación CSS que gobierna estado) | — | no cancelable |
| [useCoreografia.js:111](src/hooks/useCoreografia.js#L111)/114 | `rAF` | contadores premio/saldo; **acota el delta a 100 ms (107)** | `id` | sí, 115 |
| [useCoreografia.js:157](src/hooks/useCoreografia.js#L157)/159 | `setTimeout` | red del fin de fiesta (12 s nominal / duración real) | `fiestaRef` | sí, 130-137 |
| [useCoreografia.js:235](src/hooks/useCoreografia.js#L235)/239 | `setTimeout` | red del estallido (con y sin audio) | `esperaRef` | sí, 120-127 |
| [useCoreografia.js:245](src/hooks/useCoreografia.js#L245)/246 | `rAF` + `setTimeout` | arranque del arco (cuadro + red `ANCLA_TOPE_MS`) | locales | sí, 247 |
| [useCoreografia.js:278](src/hooks/useCoreografia.js#L278)/303/312/325 | `setTimeout` ×4 | red del traspaso · asiento · rubros · calma→reposo | `t` | sí, 282/307/316/329 |
| [useCoreografia.js:350](src/hooks/useCoreografia.js#L350) | `setTimeout` | `howl.stop()` tras el fundido de corte | **ninguno** | **NO** |
| [useCelebracion.js:106](src/hooks/useCelebracion.js#L106) | `setTimeout` | mata la celebración | `timerRef` | sí, 50/91/137 |
| [useCelebracion.js:119](src/hooks/useCelebracion.js#L119) | `setTimeout` | red del encadenado al `end` de showdown | `esperaRef` | sí, 34-41 |
| [useReacciones.js:88](src/hooks/useReacciones.js#L88)/96 | `setTimeout` ×2 | burbuja y enfriamiento | refs | sí, 54/55/95/103 |
| [useConsultas.js:57](src/hooks/useConsultas.js#L57) | `setTimeout` | autocierre del popup (4 s) | `timerRef` | sí, 67 |
| [UtilitiesMenu.jsx:136](src/components/UtilitiesMenu.jsx#L136) | `setTimeout` | autocierre del badge | `popupTimer` | sí, 143 |
| [useSounds.js:101](src/hooks/useSounds.js#L101)/103 | `setTimeout` ×2 | recorte del rasgueo (1300 + 130 ms) | **ninguno** | **NO** |
| [useSounds.js:119](src/hooks/useSounds.js#L119)/121 | `setTimeout` ×2 | recorte del barajado (~49 % + 130 ms) | **ninguno** | **NO** |

Fuera de alcance (Portada/puerta): [Portada.jsx](src/screens/Portada.jsx) 159/190/199/228 (con handle) y 312 (**sin handle**); [FormularioPuerta.jsx:46](src/components/FormularioPuerta.jsx#L46) `setInterval` de 1 s con cleanup.

### 1.3 Totales

- **64** relojes creados en `src/`. **58** en el juego (los 6 restantes son Portada + puerta).
- **9 no guardan handle** en el juego — hoy **no se pueden cancelar**: `GameTable` 962 / 1265 / 1272 / 1920, `useCoreografia` 350, `useSounds` 101 / 103 / 119 / 121. (+1 en la Portada.)
- **6** guardan handle pero **solo se cancelan al desmontar la mesa**: `discardTimersRef` (4 sitios) y `ceremonyTimersRef` (2).
- **4** relojes de evento de animación, no cancelables por definición: `GameTable:273`, `Celebracion:168`, `LluviaHeptacoins:58` y la animación `cel-caida` ([celebracion.css:380/402](src/styles/celebracion.css#L380)).

---

## 2 · Mapa del estado y secuencias no atómicas

**2.1 Dónde vive.** Una sola fuente para la partida: `motor = {game, cronica}` en [GameTable.jsx:300-316](src/components/GameTable.jsx#L300). Alrededor, 22 `useState` de UI ([317-338](src/components/GameTable.jsx#L317)) y 8 refs con estado en vuelo (352-357, 462, 517, 566, 575, 845). Estado satélite en `useCelebracion`, `useReacciones`, `useConsultas`, `useTapetes`, `useUtilitiesMenu`, `useCoreografia`. Estado de módulo: `vivos` en [useSounds.js:45](src/hooks/useSounds.js#L45).

**2.2 ¿Fotografiable?** **El motor sí**: objeto plano y serializable, sin `Map`/`Set`/función/clase ([gameEngine.js:33-52](src/engine/gameEngine.js#L33), [deck.js:20-27](src/engine/deck.js#L20)). **El conjunto no**: hay futuro ya decidido viviendo en closures de timers en vuelo — el `nextGame` de `startDiscardAnim` ([973](src/components/GameTable.jsx#L973) y el timer [996](src/components/GameTable.jsx#L996)) y el `next` de la ceremonia ([1245-1259](src/components/GameTable.jsx#L1245)). Congelar sin cancelarlos deja fuera del estado una transición ya sentenciada.

**2.3 Atómicas vs secuencias.** Atómicas (un `setGame`, sin espera): acción del humano ([911-915](src/components/GameTable.jsx#L911)), `toggleDiscard` (1343), salto de retirado (883, timer 0), `advanceFromDeal` (637/643).

Las **ocho secuencias** son el riesgo:

| # | Secuencia | Duración | Cómo encadena |
|---|---|---|---|
| S1 | Mano nueva: `beginHand` → `commitNewHand` | 1950 ms | `setGame` + `isShuffling` + timer **sin handle** (1272) |
| S2 | Ceremonia de eliminación | ~5,4 s | 1000 + 3750 + 600 ms, refs solo cancelables al desmontar |
| S3 | Reparto DEAL_2 | N×2 cartas × ~0,6 s | timer → **`rAF` → transición CSS → `transitionend`** |
| S4 | Reparto DEAL_3 | ídem + 2,0 s | ídem + volteos 300/600/900/2000 |
| S5 | Turno de la IA | 1125 ms | un timer con cleanup |
| S6 | Reloj de turno del humano | 20 × 1000 ms | cadena de timers, con efectos a 5 y a 0 |
| S7 | Descarte | ~0,5 s por jugador + 500 | **todos los timers programados de golpe**, con `nextGame` ya calculado |
| S8 | Celebración / victoria | hasta 12 s (melodía) | encadenado por `end` de Howler + temporizador-red |

**2.4 Máquina de turnos.** No existe como pieza; está repartida en tres. *Quién decide*: el motor (`applyBetAction` → `nextActiveIndex`, [gameEngine.js:85+](src/engine/gameEngine.js#L85)). *Dónde se programa la jugada*: [GameTable.jsx:856-872](src/components/GameTable.jsx#L856), un efecto con deps `[phase, game.activePlayerIndex]`. *Si su timer se cancela y se reprograma*: se reprograma **entero**, con los 1125 ms completos, y lee `gameRef.current` fresco ([861](src/components/GameTable.jsx#L861)) — **no hay jugada obsoleta ni doble jugada**. Esa propiedad es la que hace viable la opción (c) del §6. El riesgo simétrico: un ciclo de cancelar/reprogramar que se repitiera dejaría a la IA sin jugar nunca.

---

## 3 · Audio

**3.1 Instancias.** Dos familias, ambas WebAudio — **`html5: true` no aparece en ninguna receta**:
- [useSounds.js:45-52](src/hooks/useSounds.js#L45): módulo `vivos`, un `Howl` perezoso por sonido, 11 recetas en `FUENTES` (22-40).
- [useCoreografia.js:179](src/hooks/useCoreografia.js#L179): un `Howl` propio de la melodía por montaje de la pantalla de victoria, destruido en su cleanup (182-185).
- El singleton `Howler` se importa **en un solo sitio**: [SoundContext.jsx:2](src/context/SoundContext.jsx#L2).

**3.2 ¿Punto único de silencio?** **Sí existe uno — y no sirve tal cual.** [SoundContext.jsx:34](src/context/SoundContext.jsx#L34) `Howler.mute(!soundEnabled)` silencia el motor entero, incluido lo que ya suena, y alcanza a las dos familias. Pero está acoplado a la preferencia del usuario y **persiste en `localStorage`** (15, 31-35): usarlo para el freeze escribiría `'off'` en el ajuste. No hay `pauseAll`, ni módulo `audio.js`, ni una sola aparición de `Howler.ctx` / `suspend` / `resume` en `src/`. La Fase 1 necesita **otra palanca sobre el mismo singleton** (`Howler.volume(0)` con memoria, o `Howler.ctx.suspend()`), no un recorrido por archivos: con `Howler` siendo un singleton, el coste es **1 punto**, no 2.

**3.3 Loops y larga duración.** **Ningún `loop: true` en `src/`**: no hay música de fondo ni ambiente. El único sonido largo son las 7 melodías de celebración, **12,000 s exactas** con fundido desde 9,5 s ([melodiasCelebracion.js:7-10](src/config/melodiasCelebracion.js#L7)) — es lo único que puede seguir sonando minutos en segundo plano. El resto son los 11 efectos cortos, dos de ellos recortados por temporizadores **sin handle** (`ajileiStrum`, `cardShuffle`).

**3.4 `Howler.ctx` al volver.** No hay lógica de `resume()` que reutilizar. Lo que existe es el desbloqueo interno de Howler en el primer gesto, y [Portada.jsx:205-209](src/screens/Portada.jsx#L205) — un `pointerdown {once:true}` que toca el rasgueo. **No es un `resume()`**: es un `play()` que se aprovecha de que Howler desbloquea solo. Medido en las corridas: Howler **auto-suspende** el `AudioContext` a los 30 s sin reproducción (el temporizador de 30000 ms que aparece en los registros) y lo reanuda en el siguiente `play()`.

---

## 4 · Cobertura de los dos caminos de render

- [OpponentPanel.jsx](src/components/OpponentPanel.jsx) — 160 líneas, **cero hooks, cero efectos, cero relojes**. Es solo layout; recibe `renderCard(i)` desde [GameTable.jsx:1452-1492](src/components/GameTable.jsx#L1452).
- `renderTwoPlayerRival` ([1355-1450](src/components/GameTable.jsx#L1355)) es una función *dentro* de GameTable — también solo render.

**Conclusión: ningún reloj es exclusivo de un camino. Los 30 pertenecen a los dos.** Un freeze montado en `GameTable` cubre `.opp-panel` y `.ai-zone` a la vez, sin trabajo extra.

Diferencias de implementación verificadas: reparto, descarte y turno de IA son **idénticos** (todo se indexa por asiento real, y los gates de montaje 1714 / 1723 / 1733 son exclusivos, así que las refs no se duplican). La **única** diferencia es el reveal: `isRevealEligible` y `revealProtocolActive` exigen `aliveN ≥ 3` ([1041](src/components/GameTable.jsx#L1041), [1160](src/components/GameTable.jsx#L1160)) y `handleRevealTap` cae al camino instantáneo si no corre la coreografía ([1060-1062](src/components/GameTable.jsx#L1060)) — en mesa 2 los 4 timers de `startRevealSwap` no llegan a existir. Es una diferencia **a favor**: menos que congelar, no más. Empíricamente, mesa 2 y mesa 5 dan el mismo cuadro.

---

## 5 · Manejo existente y lo observado

### 5.1 Listeners

- [useCoreografia.js:365-369](src/hooks/useCoreografia.js#L365) — **el único `visibilitychange` del proyecto**. Solo pone `oculta`, que viaja como `numeros.pausada` a la lluvia de monedas. Su cabecera (360-364) declara explícitamente que **la melodía NO se toca**.
- [useCoreografia.js:101-116](src/hooks/useCoreografia.js#L101) — el acotado del delta a 100 ms hace que los contadores del relato "pausen" sin saber nada de visibilidad.
- [Portada.jsx:229](src/screens/Portada.jsx#L229) — lectura de `document.hidden` que frena el rotor y lo rearma. Precedente útil, fuera de alcance.
- **No hay** `pagehide`, `pageshow`, `freeze`, `resume`, `blur`/`focus`. **No hay service worker** (solo `manifest.webmanifest`; cero `navigator.serviceWorker` en el árbol).

> **La mesa no escucha la visibilidad. Ni una línea.**

### 5.2 Dos notas de método, antes de las cifras

**(a) En `vite preview` la mesa es inalcanzable.** `AUTH_BYPASS` exige `import.meta.env.DEV` ([useAuth.js:50](src/hooks/useAuth.js#L50)), que es `false` bajo `vite build`: el 4173 se queda en la Portada pidiendo un código real. La observación corrió sobre `npm run dev` (5173), donde el bypass entra. El código medido —React, Howler, los 30 relojes— es el mismo; lo único que cambia es la puerta.

**(b) Playwright no sirve para medir esto, y hay que decirlo.** Manda `Emulation.setFocusEmulationEnabled:true` a cada página ([coreBundle.js:37399](node_modules/playwright-core/lib/coreBundle.js#L37399)) y arranca Chromium con `--disable-background-timer-throttling`, `--disable-backgrounding-occluded-windows` y `--disable-renderer-backgrounding` (34643-34665). Con eso `document.visibilityState` **nunca vale `hidden`** y los relojes nunca se estrangulan — justo lo que hay que observar. Comprobadas y descartadas **cinco vías**: `bringToFront`, `Target.activateTarget`, `window.open`, minimizar la ventana por CDP y desactivar la emulación de foco a mano. Las cinco devuelven `visible`. La sonda final habla **CDP crudo** contra un Edge 152 propio, con dos pestañas de verdad y `/json/activate`; vive en el scratchpad, fuera del repo.

### 5.3 Lo observado

**Corrida A — mesa 2, ocultar durante el reparto, 30 s**
- `visibilitychange` llega (`hidden` t=5,6 s / `visible` t=36,3 s). **Nadie lo escucha.**
- 5 timers dispararon a oscuras, **estrangulados**: el de 1950 ms llegó 918 ms tarde; los de 120 y 130 ms, ~865 ms tarde. Cadencia ≈ 1/s.
- **`rAF`: 0.** Congelado.
- **El reparto se queda clavado**: "Barajando…" → "Repartiendo cartas…" y ahí se queda los 30 s. La razón está en la tabla: cada carta necesita el `rAF` de [254](src/components/GameTable.jsx#L254) para arrancar su transición, y sin transición no hay `transitionend` ([273](src/components/GameTable.jsx#L273)) que avance `dealStep`. Al volver se reanuda y termina (7 s después: turno del humano, reloj a 20 s).

**Corrida B — mesa 5, mismo escenario:** cuadro idéntico. Mismos 5 timers, mismos retrasos, `rAF` 0, reparto clavado y reanudado al volver.

**Corrida C — mesa 5, ocultar con el turno del humano corriendo, 30 s. Ésta es la del bug.**
- Antes: `19s · Pasar / Apostar 50 / Retirarse`.
- **Los relojes NO se estrangulan: retrasos de 0 a 18 ms.** 37 timers a oscuras, entre ellos los 19 ticks de 1000 ms del reloj de turno y los de 1125 ms de la IA. Motivo medido: el `AudioContext` estaba en `running` **y sonando** — Chrome exime del estrangulamiento a la pestaña que emite audio. Es decir: **en uso normal, con el sonido encendido, el juego corre a velocidad real en segundo plano.**
- **6 sonidos arrancaron con la pestaña oculta** (t = 28,4 / 29,4 / 30,4 / 31,4 / 32,5 / 38,3 s), los seis con `ctx: running`: los `timerWarning` de los últimos segundos y lo que vino detrás.
- **La partida avanzó sin el usuario**: se le agotó el turno (auto-pasar), las cuatro IA jugaron (`IA 1/2/3/4 · Pasó`) y la mano cruzó a DEAL_3. Al volver encuentra una mano distinta de la que dejó.
- **La ráfaga acumulada no existe**: Chrome no encola disparos perdidos. 1 timer en los primeros 500 ms de vuelta. Lo que hay no es una ráfaga; es avance real.
- Contraste con la misma mesa 2 sin audio desbloqueado: los mismos ticks de 1000 ms llegaron ~1 s tarde cada uno (cadencia 2 s) → el reloj de turno corrió **a media velocidad**. Sigue corriendo igual.

**Tres caras del mismo fallo, entonces:**
1. **Con sonido** (el caso normal): tiempo real y audio audible en segundo plano.
2. **Sin sonido**: ~mitad de velocidad. La partida avanza igual.
3. **Si la ausencia empieza a mitad de una animación**: el `rAF` congelado deja la secuencia clavada y solo se reanuda al volver — un freeze involuntario, parcial e **inconsistente** con los temporizadores que sí siguen.

---

## 6 · Recomendación de arquitectura para la Fase 1

### (a) `useVisibilityFreeze` + un solo punto de audio — el mínimo honesto
Hook nuevo que expone `congelado`; al perder visibilidad silencia el audio y **anula la consecuencia** de los dos relojes que hacen daño: guarda en el reloj de turno ([674-691](src/components/GameTable.jsx#L674)) y en el efecto de la IA ([856-872](src/components/GameTable.jsx#L856)). No pausa nada más.
**Coste: 1 archivo nuevo + `GameTable.jsx` (2 guardas). Ningún protegido.**
*Cubre* S5 y S6 — el bug reportado y su daño real. *No cubre* S1-S4, S7, S8 en vuelo: una mano que se oculte a mitad del descarte seguirá cometiendo el `setGame(nextGame)` de [996](src/components/GameTable.jsx#L996) en segundo plano.

### (b) `gameClock` — un reloj de partida propio
`src/lib/gameClock.js` con `programa(fn, ms) → cancelador`, un tiempo lógico único que se detiene con la visibilidad. Sustituye los 29 `setTimeout` de la mesa y obliga a dar handle a los 9 que hoy no lo tienen.
**No resuelve solo el problema duro**: S3/S4 y el vuelo de monedas no avanzan por temporizador sino por **transición CSS + `transitionend`** (254/273, Celebracion 154/168). Ahí el navegador ya congela por su cuenta; lo que hay que garantizar es que al reanudar la transición se reanuda y el evento llega — y si no llega, hace falta una red, que es la doctrina que `useCoreografia` ya practica.
**Coste: 1 archivo nuevo + ≈7 tocados** (`GameTable`, `useSounds`, `useCoreografia`, `useCelebracion`, `useReacciones`, `useConsultas`, `UtilitiesMenu`). **Ningún protegido.** La más completa y la más cara.

### (c) Congelar en la máquina de turnos, dejando terminar la secuencia en vuelo — **la recomendada**
Al perder visibilidad: silenciar el audio ya, marcar `congelado`, y **no interrumpir** lo que corre; cuando la secuencia llega a su punto de reposo (fin de reparto, de descarte, de ceremonia), no se programa el paso siguiente. Se apoya en la propiedad verificada en §2.4: los dos relojes que deciden se reprograman enteros y leen estado fresco.
**Coste: 1 archivo nuevo + `GameTable.jsx`** (guardas en 674, 856, 878, 893 y en el disparador de mano nueva 1222/1272) **+ el punto de audio. Ningún protegido.**
*Precio declarado*: una ausencia que empiece a mitad de S7 deja correr hasta ~4 s de coreografía con la pantalla oculta. No avanza la **decisión**, solo la animación, y el estado que se compromete ya estaba sentenciado antes de irse.

**Recomiendo (c) con (a) dentro.** (b) queda para el día que haga falta pausar la coreografía y no solo la partida. Ninguna se ejecuta en esta fase.

---

## 7 · Riesgos declarados

- **9 relojes sin handle** en el juego. Ninguna opción puede cancelarlos hoy. Los 4 de `useSounds` importan poco (recorte de sonido); **`1272` y `1920` sí importan**: gobiernan el arranque de la mano.
- **6 relojes que solo se cancelan al desmontar la mesa** (`discardTimersRef` ×4, `ceremonyTimersRef` ×2). Congelar a mitad de S2 o S7 exige un punto de cancelación que hoy no existe.
- **Protegidos implicados: ninguno.** El motor es puro y no programa nada; la geometría y las dos hojas grandes quedan fuera. **Con un matiz**: si la Fase 1 quisiera *pausar* la animación CSS del reparto —y no solo dejar que el navegador la congele—, la duración vive en `gameTable.css` (protegido). La alternativa aditiva existe y es el molde de EMB-2: atributo en el nodo raíz + hoja propia.
- **`Howler.mute()` es del usuario y persiste** ([SoundContext.jsx:15/32](src/context/SoundContext.jsx#L15)). Usarlo para el freeze corrompería la preferencia. La Fase 1 debe usar otra palanca sobre el mismo singleton.
- **Aparato físico, lo que hay que probar:**
  - **iOS Safari**: al bloquear pantalla o cambiar de app, WebKit **suspende** la página (no la ralentiza) y el `AudioContext` se interrumpe; volver exige un `resume()` explícito tras gesto — el `resume()` que hoy **no existe en el proyecto** (§3.4). Y `pagehide` puede llegar sin su `visibilitychange`.
  - **Android Chrome**: a los 5 min entra el *intensive throttling* (1 disparo/min), **pero la pestaña que emite audio queda exenta** — exactamente lo medido aquí. El fallo es **peor en el caso normal** (sonido encendido) que en el degradado.
  - **Escritorio**: lo de §5.3. Con audio, tiempo real; sin audio, ~2 s por tick.
  - La auto-suspensión del `AudioContext` de Howler a los 30 s (medida) interactúa con cualquier `suspend()/resume()` que se añada: hay que decidir quién manda.
- **Arnés**: esto no se puede medir con Playwright (§5.2b). Si la Fase 1 quiere regresión automática, tiene que heredar la sonda de CDP crudo. Hoy vive en el scratchpad de esta sesión; hacerla permanente es una tanda de arnés propia.
- **Hallazgo lateral (Portada, fuera de alcance):** nada que corregir. El rotor ya se frena con `document.hidden` ([229](src/screens/Portada.jsx#L229)) y la lluvia con `oculta`; el WebP animado de la escena 4 es un `<img>` y el navegador lo congela solo.

---

**STOP.** Nada más entra en esta fase.

Si quieres el informe como página con enlace propio para archivarlo, lo publico como artifact en un paso.
