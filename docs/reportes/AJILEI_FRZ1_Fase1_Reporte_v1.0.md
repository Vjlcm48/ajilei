Fase 1 implementada. **Sin commits.**

## Los hunks de `GameTable.jsx` (+90 −9, un solo archivo tocado)

| Guarda | Líneas reales | Qué hace |
|---|---|---|
| montaje | [29](src/components/GameTable.jsx#L29), [342-354](src/components/GameTable.jsx#L342) | `import { useCongelado }` y `const { congelado, congeladoRef, diferir } = useCongelado()` |
| §2.4 refs | [372-376](src/components/GameTable.jsx#L372), [386-387](src/components/GameTable.jsx#L386) | `barajaTimerRef` y `siguienteManoTimerRef`, ambos limpiados en el cleanup de desmontaje |
| **§2.1** reloj de turno | [695-706](src/components/GameTable.jsx#L695), [714](src/components/GameTable.jsx#L714) | `if (congelado) return` + `congelado` en deps. `timeLeft` no se toca: volver reprograma **desde el mismo segundo** |
| **§2.2** turno de la IA | [889-897](src/components/GameTable.jsx#L889), [913](src/components/GameTable.jsx#L913) | Condición de **entrada** + `congelado` en deps. Al volver reprograma los 1125 ms enteros con `gameRef.current` fresco |
| **§2.3** salto de retirado | [920-941](src/components/GameTable.jsx#L920) | El cuerpo se extrae a `salta`; si `congeladoRef.current` → `diferir(salta)` |
| **§2.3** descarte de retirado | [944-955](src/components/GameTable.jsx#L944) | Ídem con `arranca` |
| **§2.4** disparo del reparto | [1328-1341](src/components/GameTable.jsx#L1328) | 1950 ms con handle; al vencer a oscuras, `diferir(reparte)` |
| **§2.4** "Siguiente mano" | [1986-2005](src/components/GameTable.jsx#L1986) | 300 ms con handle; difiere la mano **entera**, `isClearing` incluido (si no, la mesa volvería a ofrecer el botón en segundo plano) |
| **§2.5** declarativo | [1028](src/components/GameTable.jsx#L1028), [1303](src/components/GameTable.jsx#L1303) | «FRZ-1 §2.5: secuencia en vuelo, se deja terminar; estado ya sentenciado.» |

Una decisión de diseño que conviene que veas: **§2.3 usa el slot y no las dependencias**, a propósito. Con las dos vías vivas, volver ejecutaría el slot *y* rearmaría el efecto — dos caminos para un solo salto. §2.1 y §2.2, en cambio, son cadenas que deben rearmarse, así que ésas sí van por deps.

## El hook

[`src/hooks/useCongelado.js`](src/hooks/useCongelado.js) — `creaCongelador()` (el controlador: memoria del volumen, slot único, orden de la vuelta), `enganchaVisibilidad(ctrl, doc, win)` (listeners, con `document`/`window` por parámetro) y `useCongelado()` (envoltorio delgado). `Howler.volume(0)` con memoria; guarda de reentrada para que `pagehide` + `visibilitychange` por el mismo hecho no recuerden el 0 como previo; `suelta()` restaura al desmontar.

## Dos desviaciones, declaradas

**1. El test no usa `jsdom`.** No está instalado (ni `happy-dom`, ni `@testing-library`) y el mandato prohíbe dependencias nuevas. Lo que hice en su lugar: los siete casos recorren el **camino real** — listeners de verdad, controlador de verdad, memoria de volumen de verdad — con un `document`/`window` falsos en el sitio del DOM. Fuera del sello queda solo el espejo de React (`useState`/`useRef` reflejando la misma verdad), que no decide nada. Es el molde de `coreografiaCore`/`useCoreografia`. Está dicho textualmente en la cabecera del archivo, junto a la frase que pedías.

**2. La observación de Bloque 4.4 no pudo ser "manual sin herramienta".** No puedo mirar una pantalla. Y como estableció la Fase 0, **Playwright no puede ocultar una pestaña**. Usé la sonda de CDP crudo de la Fase 0, que vive en el scratchpad y no toca el repo.

## Verificación

- `npm run build` ✅ · `npx vitest run` ✅ **467/467 en 17 archivos** (10 casos en el hook: los 7 pedidos + 3 que añadí: montar ya oculto, doble ocultamiento estilo iOS, y que la continuación encuentra el estado ya descongelado).
- `npx eslint .` = **20 problemas, exactamente la línea base**. Los 3 errores que introduje al principio (`react-hooks/refs`, ref leída en render) los corregí cambiando el controlador a un `useState` con inicializador perezoso.
- Arnés sobre el árbol modificado: `diagDSK.mjs gate` **6/6, matrixOk** · `diagPUE.mjs mon` **11/11 TODO VERDE** · `diagPUE.mjs 2.5` **10/10 TODO VERDE, halo incluido**.
- Cobertura de los dos caminos: las nueve guardas viven en `GameTable.jsx` y ninguna fuera → mesa 2 y mesa 5 cubiertas por construcción.
- Protegidos: los cinco `INTACTO`.

## Lo observado en 5173 (mesa 5, sonido activo, 30 s ocultos)

Añadí una sonda del **gain maestro de Howler** para no dar por bueno el silencio sin medirlo.

**Corrida A — turno del humano.** Antes `19s` → **en plena ausencia `19s`** → `18s` a 0,9 s de volver → `13s` a 7 s. Misma mano, misma fase, ningún rival con acción. **0 sonidos arrancados a oscuras.** 2 timers a oscuras y ninguno es del juego: son el autosuspend de Howler (30000 ms).

**Corrida B — ausencia iniciada a mitad del descarte.** La coreografía terminó a oscuras, como pide §2.5 (69 timers, 21 sonidos arrancados) — **y el gain maestro estaba en 0 durante los 21, o sea mudos**. Al terminar llegó a BET_3 con el reloj en `20s`, **que se quedó en `20s`** el resto de la ausencia y solo empezó a bajar al volver (`19s` a 0,9 s, `13s` a 7 s). La máquina de turnos esperó al regreso.

**Corrida C — la que sella §2.2** (no la pedías; la añadí porque en A el humano era Mano y la IA no llegaba a tener nada programado). Oculté con la jugada de la IA en vuelo: antes «IA 1 está pensando…», **en plena ausencia «IA 1 está pensando…»**, a 0,9 s de volver todavía pensando, y a 7 s las cuatro IA ya habían jugado. Reprograma entera, sin doble jugada.

**Gain maestro medido: `1` → `0` al ocultarse → `1` al volver.**

Un detalle honesto sobre esa lectura: en la corrida C el gain se leyó `0` a los 0,9 s de volver. No es un fallo — es que Howler ya había autosuspendido el `AudioContext` a los 30 s, y con el contexto suspendido `gain.value` devuelve el valor viejo hasta que el tiempo del contexto avanza. La restauración sí había ocurrido (`Howler._volume`), y la foto de los 7 s lo confirma: ctx `running`, gain `1`, cartas sonando.

## Estado

```
 M src/components/GameTable.jsx
?? src/hooks/useCongelado.js
?? src/hooks/useCongelado.test.js
?? laminas/mon1/_entorno.txt · lamina.html · tiempos.json · scripts/_cel1bFila.mjs   (los cuatro de siempre)
```

Nada más. **STOP** — a la espera de tu compuerta física en 4173 con OTP real y en el S25.

Dos avisos para esa compuerta: `npm test` es `vitest run scripts/` y **no ve `src/`**, así que el test nuevo solo corre con `npx vitest run` (si quieres que entre en el script de siempre, es un hunk de `package.json` y esta tanda no lo abre). Y en el S25, la prueba que más me interesa es la de bloquear pantalla **con el descarte en vuelo**: ahí es donde iOS puede mandar `pagehide` sin su `visibilitychange`, que es el único camino del hook que ningún navegador de escritorio ejercita.
