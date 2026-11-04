# AJILEI · ARN-4 · `npm run varas -- completo` · Informe v1.0

**Para:** Victor y el rector · **De:** Claude Code · **Fecha:** 2026-11-03
**Base:** `main` en `866c75a` · **Para qué:** línea base de todas las varas antes de MOT-1
**Estado:** corrida una sola vez, entera y sin arreglar nada. Es la primera vez que este perfil se corre entero. Sin commit.

---

## Resultado

**Código global 2.** De 57 varas: **49 verdes, 2 rojas y 6 cortadas por su tope**. Más 1 manual, sin correr.

- **Duración:** 6 h 25 min 31 s, de las 9:47:09 a las 16:12:39. La suma de los topes era de 15 h 44 min.
- **Un solo rojo es de producto:** `1.8b`, dentro de `todo`. El camino crítico mide 235,6 KiB contra un techo de 200 (INV-30).
- **El rojo de `tam` es de instrumento:** la vara sigue esperando un «Pronto» que CFG-1 1a retiró.
- **Las 6 cortadas son de tope:** ninguna imprimió un fallo antes del corte, pero tampoco dieron veredicto. **`tactil`, `h1`, `m1`, `a1`, `f1` y `vuelo` no tienen línea base en esta corrida.**
- **Semilla y cobertura:** ninguna. Ruido de fotos: 3 de 459 comparaciones, absorbido por las repeticiones automáticas.

---

## Antes de empezar

| Comprobación | Resultado |
|---|---|
| `git log -1` | `866c75a` |
| `git status` | Solo los 2 informes de MOT-1 y los 3 archivos de `laminas/mon1/`, sin seguimiento |
| `git worktree list` | Una línea |

---

## Las 57 varas

Salidas en `C:\Users\victo\AppData\Local\Temp\varas-mw0v2i42\`, una por vara. Es una carpeta temporal: si se quieren conservar los logs, hay que copiarlos.

| # | Vara | Código | Duración | Tope | Archivo |
|---|---|---|---|---|---|
| 1 | `eslint` | 0 | 6 s | 5 min | `eslint.log` (0 errores, 0 avisos) |
| 2 | `vitest` | 0 | 7 s | 10 min | `vitest.log` (93/93 archivos, 2155 pruebas) |
| 3 | `build` | 0 | 1 s | 5 min | `build.log` |
| 4 | `guiones` | 0 | 2 s | 5 min | `guiones.log` |
| 5 | `humo` | 0 | 13 min 17 s | 25 min | `humo.log` |
| 6 | `b1` | 0 | 11 s | 15 min | `b1.log` |
| 7 | `tactil` | **2** | 15 min 00 s | 15 min | `tactil.log` |
| 8 | `p1` | 0 | 2 min 30 s | 15 min | `p1.log` |
| 9 | `p2` | 0 | 2 min 04 s | 15 min | `p2.log` |
| 10 | `r1` | 0 | 8 min 16 s | 15 min | `r1.log` |
| 11 | `r2` | 0 | 10 min 21 s | 15 min | `r2.log` |
| 12 | `o1` | 0 | 5 min 27 s | 15 min | `o1.log` |
| 13 | `h1` | **2** | 15 min 00 s | 15 min | `h1.log` |
| 14 | `m1` | **2** | 15 min 00 s | 15 min | `m1.log` |
| 15 | `a1` | **2** | 15 min 00 s | 15 min | `a1.log` |
| 16 | `f1` | **2** | 15 min 00 s | 15 min | `f1.log` |
| 17 | `z1` | 0 | 11 min 35 s | 15 min | `z1.log` |
| 18 | `o2` | 0 | 17 s | 15 min | `o2.log` |
| 19 | `a2` | 0 | 14 min 34 s | 15 min | `a2.log` |
| 20 | `u1` | 0 | 14 min 43 s | 15 min | `u1.log` |
| 21 | `menu-movil` | 0 | 7 min 48 s | 15 min | `menu-movil.log` |
| 22 | `u2` | 0 | 4 min 51 s | 15 min | `u2.log` |
| 23 | `u3` | 0 | 7 min 43 s | 15 min | `u3.log` |
| 24 | `vc` | 0 | 1 min 42 s | 15 min | `vc.log` |
| 25 | `msg` | 0 | 18 min 44 s | 25 min | `msg.log` |
| 26 | `tapetes` | 0 | 1 min 24 s | 15 min | `tapetes.log` |
| 27 | `vuelo` | **2** | 15 min 00 s | 15 min | `vuelo.log` |
| 28 | `luz` | 0 | 23 min 14 s | 29 min | `luz.log` |
| 29 | `rev` | 0 | 3 min 49 s | 15 min | `rev.log` |
| 30 | `rec` | 0 | 15 min 40 s | 25 min | `rec.log` |
| 31 | `congelado` | 0 | 1 min 46 s | 15 min | `congelado.log` |
| 32 | `saldo` | 0 | 3 min 18 s | 15 min | `saldo.log` |
| 33 | `mesaia` | 0 | 6 min 51 s | 15 min | `mesaia.log` |
| 34 | `revive` | 0 | 19 s | 15 min | `revive.log` |
| 35 | `constancia` | 0 | 1 min 02 s | 15 min | `constancia.log` |
| 36 | `video` | 0 | 1 min 48 s | 15 min | `video.log` |
| 37 | `tam` | **1** | 5 min 06 s | 15 min | `tam.log` |
| 38 | `webkit` | 0 | 15 s | 20 min | `webkit.log` |
| 39 | `apu.360x640` | 0 | 5 min 11 s | 20 min | `apu.360x640.log` |
| 40 | `apu.640x360` | 0 | 4 min 22 s | 20 min | `apu.640x360.log` |
| 41 | `apu.844x390` | 0 | 4 min 20 s | 20 min | `apu.844x390.log` |
| 42 | `apu.1024x768` | 0 | 4 min 20 s | 20 min | `apu.1024x768.log` |
| 43 | `apu.1280x720` | 0 | 4 min 21 s | 20 min | `apu.1280x720.log` |
| 44 | `apu.1366x768` | 0 | 4 min 21 s | 20 min | `apu.1366x768.log` |
| 45 | `apu.1920x937` | 0 | 4 min 21 s | 20 min | `apu.1920x937.log` |
| 46 | `apu.rec2` | 0 | 7 min 02 s | 20 min | `apu.rec2.log` |
| 47 | `apu.voz3` | 0 | 1 min 11 s | 20 min | `apu.voz3.log` |
| 48 | `tab.frase` | 0 | 9 min 27 s | 20 min | `tab.frase.log` |
| 49 | `tab.resto` | 0 | 20 min 18 s | 25 min | `tab.resto.log` |
| 50 | `todo` | **1** | 5 min 23 s | 25 min | `todo.log` |
| 51 | `cap` | 0 | 2 min 36 s | 15 min | `cap.log` |
| 52 | `voz2` | 0 | 8 min 17 s | 15 min | `voz2.log` |
| 53 | `mesa` | 0 | 46 s | 15 min | `mesa.log` |
| 54 | `pue.contraste` | 0 | 2 min 11 s | 10 min | `pue.contraste.log` |
| 55 | `celebracion` | 0 | 8 min 14 s | 20 min | `celebracion.log` |
| 56 | `sal` | 0 | 1 min 45 s | 15 min | `sal.log` |
| 57 | `banco` | 0 | 8 min 14 s | 20 min | `banco.log` |
| — | guiones en la base real | manual | — | — | SQL Editor de Victor, tras cada `db push` |

**Total:** 6 h 25 min 31 s.

---

## Lo que no salió verde

| Vara | Código | Primer error | Clase |
|---|---|---|---|
| `todo` | 1 | `1.8b` camino crítico: 235,6 KiB en el cable, techo 200 | **Código** |
| `tam` | 1 | `tam.7` en `retar 1280x585`: `casa×cfg-perfil 2.4`. Causa: `tam.12`, «retar 1366x623 no salió» | **Instrumento** |
| `tactil` | 2 | Tope. 20 de 36 celdas impresas, todas OK | **Tope** |
| `h1` | 2 | Tope. No imprime por celda: log sin datos | **Tope** (sin confirmar) |
| `m1` | 2 | Tope. 6 de 20 celdas impresas, todas OK | **Tope** |
| `a1` | 2 | Tope. 6 de 16 celdas impresas, todas OK | **Tope** |
| `f1` | 2 | Tope. 15 de 16 celdas impresas, todas OK | **Tope** |
| `vuelo` | 2 | Tope. No imprime por celda: log sin datos | **Tope** (sin confirmar) |

### `todo` · `1.8b` (código)

El reparto del camino crítico, con 7 recursos y FCP de 132 ms:

| Recurso | En el cable | En crudo |
|---|---|---|
| `index-DfwcKnt2.js` | 198,5 KiB | 681,3 KiB |
| `index-DvVqv5PQ.css` | 30,4 KiB | 159,6 KiB |
| Documento, isotipo, icono y reverso | 6,7 KiB | 20,1 KiB |

- **No es ruido:** es gzip nivel 9 sobre un `dist/` fijo.
- **No es el rojo conocido de antes:** ARN-3d lo dejó en verde, a 169,0 KiB, y el cierre de ARN-3 lo dio a 169,2 KiB. Desde entonces ha subido unos 66 KiB.
- **Por qué nadie lo vio:** `1.8` no entra en `humo` ni en el perfil `commit`. No encontré una cifra posterior en los informes, así que no sé en qué campaña cruzó los 200. Tampoco he intentado averiguarlo.
- **Para MOT-1:** el JS del paquete principal, por sí solo, ya roza el techo.

### `tam` (instrumento)

1. `scripts/ios/tam.mjs:488` pulsa `.lob-ajustes` y espera el «Pronto» (`tam.12`).
2. Desde CFG-1 1a (`fff91e3`, 2026-10-29), ese botón abre la hoja de configuración (`PantallaChips.jsx:47`). `tam.mjs` no se toca desde el 2026-10-21.
3. La hoja se queda abierta y las celdas siguientes del mismo contexto miden sus botones como solapes. De ahí salen los **16 fallos de `tam.7`**, todos con filas `cfg-*`, `acerca` o `eliminar-cuenta`.
4. En el contexto táctil, el tercer clic (`360x640`) agota los 30 s y aborta el estado. De ahí sale el error de `consola`.

La consecuencia pesa más que el rojo: **19 de las 43 celdas del estado `retar` no se midieron**, y `matriz ✓` no lo avisa. Sale verde con 282 celdas, cuando la cifra verde de TAB-1 era 301. Otras 16 de las 24 medidas están contaminadas por la hoja, de modo que en `retar` solo valen 8. Los otros seis estados tienen sus 43 celdas, y `tam.1`–`tam.6` y `tam.8`–`tam.11` salen ✓.

No hay indicio de un fallo del producto. No lo he comprobado con una corrida corregida.

### Las 6 cortadas (tope)

- El corte da código 2 porque el orquestador trata «no terminó» como instrumento.
- Mató el árbol de procesos sin dejar huérfanos: la vara siguiente levantó su servidor en el mismo puerto y salió verde en los seis casos.
- **`h1` y `vuelo` no imprimen nada hasta el final,** así que su log no distingue una vara lenta de una colgada. Las clasifico como tope por sus precedentes, y no lo puedo afirmar sin repetirlas.
- **Trampa:** sus `capturas-dsk/diag_*.json` no se reescribieron. Siguen ahí los verdes de octubre, que no son de `866c75a`.

---

## Topes estimados

### Cortos

La proyección es lineal, a partir de las celdas impresas al corte. La columna de precedente es la distancia entre `ts` y la hora del archivo en el último JSON verde; esas corridas pudieron solaparse con otras.

| Vara | Tope | Avance al corte | Proyección | Precedente |
|---|---|---|---|---|
| `m1` | 15 min | 6/20 | ~50 min | 34 min (2-oct) |
| `a1` | 15 min | 6/16 | ~40 min | 27 min (20-oct) |
| `tactil` | 15 min | 20/36 | ~27 min | 20 min (20-oct) |
| `f1` | 15 min | 15/16 | ~16 min | 15 min (2-oct) |
| `h1` | 15 min | Sin datos | Sin datos | 27 min (2-oct) |
| `vuelo` | 15 min | Sin datos | Sin datos | 880 s (H-11); 6 min (20-oct) |

`m1` y `a1` se proyectan por encima de los 30 min de las tareas de Bash, el límite con el que se fijaron los topes (A4). Subirles el tope no bastaría: habría que partirlas, como `apu` y `tab`.

### Justos

Pasaron, pero con poco margen.

| Vara | Duración | Tope | Uso |
|---|---|---|---|
| `u1` | 14 min 43 s | 15 min | 98 % |
| `a2` | 14 min 34 s | 15 min | 97 % |
| `tab.resto` | 20 min 18 s | 25 min | 81 % |
| `luz` | 23 min 14 s | 29 min | 80 % |
| `z1` | 11 min 35 s | 15 min | 77 % |
| `msg` | 18 min 44 s | 25 min | 75 % |

### Largos

Por debajo de un cuarto de su tope. No hacen daño: un tope largo solo retrasa el aviso de un cuelgue.

- **`rapido`:** `eslint`, `vitest`, `build` y `guiones`, 16 s en total, con topes de 5 a 10 min.
- **Menos de 2 min sobre 15–20:** `b1`, `o2`, `revive`, `webkit`, `mesa`, `constancia`, `tapetes`, `vc`, `congelado`, `video`, `sal` y `apu.voz3`.
- **Celdas de `apu`:** 4 min 20 s a 5 min 11 s sobre 20. Es el único grupo uniforme y bien separado.
- **Otras:** `p1`, `p2`, `cap`, `saldo` y `rev`, de 2 a 4 min sobre 15; `todo`, 5 min 23 s sobre 25.

---

## Repeticiones, cobertura e informativos

| Vara | Comparaciones con ruido | Repeticiones automáticas |
|---|---|---|
| `tab.resto` | 2 de 47 (`V-cel 412x915 m5`: `turno@3`, `entre@1`) | 3 |
| `luz` | 1 de 318 (`p2 m5 915x412 atenuado vinotinto-claro`) | 2 |
| `humo` | 0 de 68 | 0 |
| `pue.contraste` | 0 de 20 | 0 |
| `cap` | 0 de 6 | 0 |
| **Total** | **3 de 459** | **5** |

- **Cobertura:** ningún veredicto `cobertura` ni «re-elegir semilla». `sinCobertura` de `tam`, vacío.
- **Informativos (código 0, no juzgan):** `b1`, y `d1d2`, `d3`, `bug` y `shots` dentro de `humo`.
- **`celebracion`:** 0 fallos, 0 conocidos.
- **`banco`:** 87/87 celdas verdes en 75 formas.
- **Aislamiento:** verde en todas las varas que terminaron. Ninguna escapada al Supabase real. Las 6 cortadas no llegaron a imprimir este veredicto.
- **`tactil`:** dos celdas OK con nota (`D4 nombre-tap#2`, 5 y 9 px, en `T5 412x915` y `T5 915x412`). No la he investigado.
- **`webkit`:** verde, con 10 de sus celdas marcadas LIMITACIÓN. El iPhone acostado no queda medido de verdad. Es el aviso que imprime la propia vara.

---

## Cómo se corrió

- **Proceso independiente:** se lanzó con `Start-Process`, no como tarea de fondo, porque esas tareas tienen un tope de 30 min y la corrida iba a durar horas. La orden es la de siempre, `npm run varas -- completo`, sin opciones.
- **El corte de sesión:** la sesión de Claude Code se interrumpió a media corrida por una reautenticación. A las 13:38 se comprobó que el proceso seguía vivo, y no hubo que repetir nada.
- **El equipo:** no estaba dedicado. Chrome y Edge ya estaban abiertos al empezar, de modo que las duraciones no son de una máquina en reposo.

**Al terminar:** `git log -1` sigue en `866c75a`, `git worktree list` da una línea, no quedan procesos `node` y `git status` solo añade este informe. La corrida reescribió `dist/` y las carpetas `capturas-*`, todas ignoradas por git. Nada de Supabase en la nube, ni commits ni push. Los guiones en la base real quedan como manual.

---

## Queda para decidir

Nada de esto se ha tocado.

1. **`1.8b` a 235,6 KiB:** si se baja antes de MOT-1 o se le da dueño dentro.
2. **`tam`:** actualizar `tam.12` a la hoja de CFG-1 y hacer que `matriz` avise de las celdas que faltan.
3. **Las 6 cortadas:** subir o partir los topes, y correr esas varas con `--solo` para completar la línea base.
