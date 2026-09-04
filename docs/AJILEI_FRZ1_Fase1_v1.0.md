# AJILEI — Campaña FRZ-1 · Freeze de visibilidad · Fase 1 · v1.0

**Instrucción para Claude Code · Producción · 04-sep-2026**

---

## Contexto

La Fase 0 (`AJILEI_FRZ1_Fase0_Informe_v1.0.md`, base `3ea2e27`) midió el fallo: la mesa no escucha la visibilidad, y con el audio activo Chrome exime la pestaña del estrangulamiento, así que la partida vs IA **avanza a tiempo real en segundo plano** — se agota el turno, juegan las IA, suenan los avisos, cambia la mano. No hay ráfaga al volver; hay avance real. Sin audio, avanza a media velocidad. Si la ausencia cae a mitad de una animación, el rAF congelado la clava hasta el regreso.

Decisiones selladas por Victor y el rector sobre el informe:

1. **Arquitectura (c) con (a) dentro**: congelar en la máquina de turnos, silenciar ya, dejar terminar la secuencia en vuelo, y **no programar el paso siguiente** hasta recuperar visibilidad. Un **único slot de continuación diferida**, no una cola.
2. **Audio por `Howler.volume(0)` con memoria** del valor previo. Nunca `Howler.mute()` (es la preferencia del usuario y persiste), nunca `ctx.suspend()` (choca con el autosuspend y auto-resume propios de Howler).
3. **Alcance**: se congelan S5 (turno IA), S6 (reloj de turno del humano) y S1 (arranque de mano). S2/S3/S4/S7 se dejan terminar — estado ya sentenciado, coreografía corta. S8 (celebración) **fuera**: `useCoreografia` declara que la melodía no se toca; con volumen 0 suena en silencio y termina.
4. **Handle solo a 1272 y 1920**, porque la guarda de mano nueva lo exige. Los otros siete relojes sin handle quedan en cola `GT-HIG`.
5. **Arnés honesto**: vitest del hook con visibilidad simulada; mide la respuesta del hook al evento, no el estrangulamiento del navegador, y lo declara. La sonda CDP queda en cola `ARN-x`.
6. **Validación física** en 4173 con OTP real + S25. iPhone en vigilancia.

Referencias de línea en esta ficha son las del informe sobre `3ea2e27`; si el archivo cambió, manda el contenido, no el número.

## Mandato

1. **Régimen aditivo.** Un archivo nuevo (el hook), un test nuevo, y hunks en `GameTable.jsx`. Δ=0 en todo lo demás: ni `SoundContext`, ni `useCoreografia`, ni `useSounds`, ni estilos, ni motor.
2. Archivos protegidos según `docs/AJILEI_Protegidos_v1.0.md` (commit `25290bb`). **Ninguno participa.** Si una guarda te pide tocar uno, STOP y reporta.
3. Sin `!important`, O1 vigente, dos caminos de render cubiertos (la Fase 0 verificó que todos los relojes viven en `GameTable`; se confirma al cierre).
4. **Sin commits, sin push.** Un STOP al cierre.
5. Nada de nuevas dependencias.

## Bloque 1 — El hook `useCongelado`

`src/hooks/useCongelado.js`. Un solo hook, sin estado de partida dentro. Expone:

- `congelado` (boolean, estado React) — `true` mientras `document.hidden`.
- `congeladoRef` — la misma verdad como ref, para leer dentro de timers y closures sin cierre obsoleto.
- `diferir(fn)` — guarda `fn` en el **slot único**. Si el slot ya está ocupado, **sobrescribe y lo declara en consola de DEV** (`console.warn`), porque por diseño no debería ocurrir; si ocurre en pruebas es un hallazgo, no un silencio.
- Al pasar a visible: primero restaura el audio, luego pone `congelado=false`, luego ejecuta el slot **una vez** y lo vacía. Ese orden, siempre.

Audio, dentro del hook:

- Al ocultarse: `volumenPrevioRef = Howler.volume()`; `Howler.volume(0)`.
- Al volver: `Howler.volume(volumenPrevioRef)`. Si el hook se desmonta estando oculto, restaura también en el cleanup — una mesa desmontada en segundo plano no puede dejar el motor mudo para la siguiente pantalla.
- `Howler` se importa desde `howler` igual que en `SoundContext.jsx:2`. No se toca `mute`.

Listener: `visibilitychange` sobre `document`, registrado en un `useEffect` con cleanup. **Además `pagehide`** como equivalente de ocultarse (iOS puede mandarlo sin su `visibilitychange`, §7 del informe); `pageshow` no se escucha — la vuelta la da `visibilitychange`, y si WebKit restaura desde bfcache, la lectura de `document.hidden` al montar decide el estado inicial. El hook lee `document.hidden` al montar para no asumir visible.

## Bloque 2 — Guardas en `GameTable.jsx`

Monta el hook una vez en `GameTable`. Guardas, en el orden del informe:

**2.1 Reloj de turno del humano (674-691, S6).** El tick de 1000 ms no se programa si `congeladoRef.current`. Al volver, el efecto se rearma desde el **mismo `timeLeft`** — el usuario recupera los segundos que tenía. Mecanismo recomendado: `congelado` en las deps del efecto; ocultar cancela el timer en el cleanup, volver lo reprograma. Verifica que los efectos de umbral (`timerWarning` a ≤5, auto-pasar a 0) no disparan durante la ausencia ni se duplican al volver.

**2.2 Turno de la IA (856-872, S5).** `congelado` entra en las deps. Si `congeladoRef.current`, el efecto no programa la jugada. Al volver, se reprograma entera (1125 ms, `gameRef.current` fresco), como la Fase 0 verificó. **Cuidado con el ciclo** declarado en §2.4: la guarda debe ser una condición de entrada, no un cancelar/reprogramar en bucle.

**2.3 Salto de retirado (878-889) y descarte de retirado (893-896).** Misma guarda de entrada: si congelado, `diferir` la acción en vez de programarla. Son transiciones de un paso; el slot las absorbe.

**2.4 Arranque de mano (S1): 1222, 1272, 1920.**
- Da handle a 1272 y 1920 (ref cada uno, cleanup al desmontar).
- La llamada que **inicia** la mano siguiente (el `beginHand()` de 1920 y el disparo del reparto en 1272) se envuelve: si congelado, `diferir(() => …)`; si no, ejecuta como hoy. No se toca la duración del barajado ni la animación.
- Si la ausencia empieza **dentro** del reparto (S3/S4), no se hace nada: el navegador clava el rAF y lo reanuda solo, medido en las corridas A y B. Al terminar el reparto, la máquina de turnos ya está guardada por 2.1/2.2.

**2.5 Lo que NO se guarda, declarado en código.** Un comentario de una línea en la cabecera de las guardas de descarte (973-996) y ceremonia (1245-1259): «FRZ-1: secuencia en vuelo, se deja terminar; estado ya sentenciado.» Sin cambio funcional.

## Bloque 3 — Test honesto

`src/hooks/useCongelado.test.js` (vitest, entorno jsdom). Simula `document.hidden` con `Object.defineProperty(document, 'hidden', { configurable: true, get })` y despacha `visibilitychange`. Howler mockeado como singleton con `volume()` leíble y escribible.

Casos:

1. Al montar visible → `congelado=false`, volumen intacto.
2. Al ocultar → `congelado=true`, `Howler.volume()` === 0, previo recordado.
3. Al volver → volumen restaurado al previo exacto (no a 1), `congelado=false`.
4. `diferir(fn)` en oculto → `fn` no corre; al volver corre **exactamente una vez**; segundo `visible` no la repite.
5. `diferir` dos veces en oculto → corre la última, `console.warn` una vez.
6. Desmontar estando oculto → volumen restaurado.
7. `pagehide` → equivale a ocultar.

Cabecera del archivo, textual: «Mide la respuesta del hook al evento de visibilidad. NO mide el estrangulamiento de temporizadores del navegador, que solo se observa en aparato o con CDP crudo (cola ARN).»

## Bloque 4 — Verificación

1. `npm run build` verde. `npx vitest run` verde con los 7 casos.
2. Arnés existente sin regresión: `gate` 6/6, `mon` 11/11, `2.5` con el halo — sobre el árbol modificado.
3. Cobertura de los dos caminos: confirma que ninguna guarda vive fuera de `GameTable`, luego mesa 2 y mesa 5 quedan cubiertas por construcción.
4. Observación manual en `npm run dev` (5173, bypass), sin herramienta: partida vs IA con sonido activo, ocultar la pestaña 30 s durante el turno del humano, volver. Esperado: **mismo `timeLeft`, misma mano, ningún sonido durante la ausencia, la IA juega tras volver**. Repite con la ausencia iniciada a mitad del descarte: la coreografía termina a oscuras, y la máquina de turnos espera al regreso. Reporta lo observado, tal cual, aunque contradiga lo esperado.
5. `git status --short`: solo `src/hooks/useCongelado.js`, `src/hooks/useCongelado.test.js` y `src/components/GameTable.jsx` (más los cuatro residuos de siempre). Cualquier otra ruta modificada = STOP.

## Cierre

**STOP.** Reporte con: los hunks de `GameTable.jsx` resumidos por guarda (2.1-2.5, con líneas reales); el hook y el test; resultados de build, vitest y arnés; lo observado en 5173 en las dos corridas; y `git status`. **Sin commits.**

Después: compuerta física de Victor en 4173 (OTP real) y en el S25 — bloquear pantalla con el turno corriendo, esperar, desbloquear: mismo reloj, misma mano, silencio durante la ausencia. Con su verde llega la instrucción de cierre (commits + push).

**Cola abierta**: `GT-HIG` (siete relojes sin handle) · `ARN-x` (sonda CDP cruda permanente) · S8/celebración bajo freeze si algún día importa · PvP (temporizador visible + auto-jugada + reconexión) cuando exista.
