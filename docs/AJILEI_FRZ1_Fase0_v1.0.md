# AJILEI — Campaña FRZ-1 · Freeze de visibilidad · Fase 0 · v1.0

**Instrucción para Claude Code · Diagnóstico de solo lectura · 04-sep-2026**

---

## Contexto

Bug confirmado en producción: durante una partida vs IA, si el usuario bloquea la pantalla o manda la app a segundo plano (botón lateral, cambio de app, cambio de pestaña en escritorio), **el juego sigue corriendo y el audio sigue sonando**. Al volver, el estado puede haber avanzado sin él.

Comportamiento sellado por Victor y el rector para la Fase 1:

- Al perder visibilidad: **congelar todo** — silencio total, IA detenida, ningún reloj avanza.
- Al recuperarla: **reanudar intacto**, exactamente donde quedó, sin ráfaga de eventos acumulados.
- Fuera de alcance: cierre de sesión, cierre de pestaña, limpieza de apps recientes, recarga (eso es persistencia, otra campaña). Fuera también la Portada (rotor de escenas y WebP animado): sin estado que corromper ni audio; si se observa algo, se anota como hallazgo lateral.

Por qué Fase 0: en el navegador `visibilitychange` es un **aviso, no un freno**. Cada reloj del motor (timeouts, rAF, callbacks de animación, promesas con espera, Howler) sigue vivo por su cuenta y, según el motor, se ralentiza, se congela o se acumula para disparar de golpe al volver. La Fase 1 solo puede congelar lo que este informe inventaríe. Nada se enumera desde memoria.

Punto de partida: `main` en `3ea2e27`. Árbol limpio salvo los cuatro residuos declarados en DOC-1.

## Mandato

1. **Solo lectura.** Cero ediciones, cero archivos nuevos en el repo, cero commits. El único producto es el informe.
2. Archivos protegidos según `docs/AJILEI_Protegidos_v1.0.md` (commit `25290bb`): se leen, no se tocan. Si un hallazgo apunta a que la Fase 1 necesitaría tocar uno, se declara como tal.
3. Toda afirmación del informe lleva **archivo y línea**. "Creo que" no es un hallazgo.
4. Se puede ejecutar el arnés existente y `vite preview` para observar, nunca para modificar.

## Bloque 1 — Inventario de relojes

Censo exhaustivo de todo lo que avanza sin intervención del usuario, en `src/` (motor, pantallas, hooks, utilidades). Por cada uno: archivo:línea, tipo, qué dispara, dónde se guarda su handle (si se guarda), y si se cancela en algún `cleanup` de `useEffect`.

Tipos a buscar, sin limitarse a ellos:

- `setTimeout` / `setInterval` (incluye los envueltos en helpers tipo `sleep`, `wait`, `delay`).
- `requestAnimationFrame`.
- `onAnimationEnd` / `onTransitionEnd` / `animationend` / `transitionend` y cualquier lógica que dependa de que una animación CSS termine.
- Promesas que encadenan pasos con espera (reparto, reveal, turno de IA, conteo de puntos).
- Animaciones CSS con duración que gobiernan estado (no solo decoración): dónde se declaran y qué JS espera su fin.

Salida: **una tabla**, ordenada por archivo. Al pie, la cifra total y cuántos relojes **no guardan handle** (los que hoy no se podrían cancelar).

## Bloque 2 — Estado de partida

1. ¿Dónde vive el estado de la partida en curso? (`useState` en un componente, `useReducer`, contexto, módulo, varios sitios). Archivo:línea de cada fuente.
2. ¿Es **fotografiable**? Es decir: ¿existe un punto donde el estado completo se pueda leer como un valor, o está repartido entre estado React, variables de módulo y closures de timers en vuelo?
3. ¿Qué transiciones son **atómicas** y cuáles son **secuencias** (varios pasos con esperas entre medias)? Las secuencias son el riesgo: congelar a mitad de una es lo que hay que resolver en Fase 1.
4. Identifica la **máquina de turnos**: quién decide que le toca a la IA, dónde se programa su jugada, y qué pasa si ese timer se cancela y se reprograma.

## Bloque 3 — Audio

1. Cómo se instancia Howler: instancias por sonido, una global, `html5: true` o WebAudio, dónde (archivo:línea).
2. ¿Existe hoy un **punto único** de silencio/reanudación (`Howler.mute`, `Howler.ctx.suspend()`, un módulo `audio.js` con `pauseAll`)? Si no, cuántos sitios habría que tocar.
3. Sonidos con **loop** o de larga duración (música de fondo, ambiente) frente a efectos cortos: listarlos aparte, porque el tratamiento difiere.
4. Estado de `Howler.ctx` al volver del segundo plano: verifica si hay lógica existente de `resume()` tras gesto (la del strum-on-first-touch) y si se reutilizaría.

## Bloque 4 — Cobertura de los dos caminos de render

Verificación obligatoria: mesas 5/4/3 vía `OpponentPanel` y mesa 2 vía `.ai-zone`. Por cada camino: qué relojes del Bloque 1 le pertenecen en exclusiva, cuáles comparten, y si alguna secuencia (reveal, reparto, turno IA) tiene implementación distinta en uno y otro. Un freeze que cubra un camino y no el otro es un rojo de Fase 1.

## Bloque 5 — Manejo existente y observación

1. ¿Hay hoy algún listener de `visibilitychange`, `pagehide`, `pageshow`, `freeze`, `resume`, `blur`/`focus` en `src/` o en el service worker? Archivo:línea. Si hay, qué hace.
2. Observación empírica en `vite preview` (4173), sin tocar código: iniciar partida vs IA en mesa 2 y en mesa 5, cambiar de pestaña 30 s, volver. Registrar en consola qué timers dispararon durante la ausencia y qué pasó al volver (avanzó la partida, sonó audio, ráfaga de eventos). Basta un `console.log` temporal en DevTools o un snippet de consola; **no se edita ningún archivo** para observar.

## Cierre

**STOP.** Informe `docs/reportes/AJILEI_FRZ1_Fase0_Informe_v1.0.md` — **entregado en el reporte del chat, no escrito al repo** (Victor lo archiva y decide si viaja en una pasada de docs posterior). Estructura:

1. Tabla de relojes (Bloque 1) con totales.
2. Mapa del estado y lista de secuencias no atómicas (Bloque 2).
3. Audio: instancias, punto único sí/no, loops (Bloque 3).
4. Cobertura de los dos caminos (Bloque 4).
5. Manejo existente y lo observado en 4173 (Bloque 5).
6. **Recomendación de arquitectura para Fase 1**, en tres opciones como máximo, con su coste en archivos tocados — por ejemplo: (a) un `useVisibilityFreeze` central que pause una única fuente de relojes; (b) un reloj de partida propio (`gameClock`) al que todos los timers se suscriban y que se detenga con la visibilidad; (c) congelar a nivel de máquina de turnos y dejar que las secuencias en vuelo terminen antes de congelar. Sin ejecutar ninguna.
7. Riesgos declarados: relojes sin handle, protegidos implicados, diferencias iOS/Android/escritorio que la Fase 1 deba probar en aparato físico.

Nada más entra en esta fase. La Fase 1 se abre con instrucción propia del rector sobre este informe.
