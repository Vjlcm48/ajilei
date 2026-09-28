# AJILEI · REC-2 · Fase 1 · Informe · v1.0

**Ejecutor:** Claude Code · **Fecha:** 2026-09-27 · **Base:** `5f672b4` + árbol sin commitear
**Ficha:** `AJILEI_REC-2_v1.0.md` §4 · **Decisiones:** `AJILEI_REC-2_Addendum1_v1.0.md` (D-1…D-8)
**Normativo nuevo:** `docs/AJILEI_APU-1_Reglas_v1.3.md`

---

## 0. Resumen

- La regla híbrida vive en **un solo sitio**: `tarjetaRecarga(pila, unit, saldo)` en `mesaCore.js`. De ahí salen el caso (1 fila · 2 todo · 3 sin saldo), los montos que se pintan y el monto que nace elegido. Ese monto **es `null` o positivo, nunca 0**.
- `pideRecarga` y la tarjeta **comparten la puerta**: `hayRecarga = topeRecarga > 0`, que bajo el techo equivale exactamente a `Su ≥ unit` (D-7). La única excepción es la forzosa, que ahora sale también sin saldo usable, como caso 3 (D-5).
- Los dos `?? 0` de `GameTable.jsx` **desaparecen**. La vista pinta lo que le da el núcleo: la fila solo en el caso 1, un primario «Recargar todo (600)» con su nota en el caso 2, y ningún primario en el caso 3.
- Normativo **v1.3** creado desde la v1.2 íntegra, con el texto literal de §1 del addendum y un registro de cambios al principio. La v1.2 no se toca.
- **Sin commits.** `gameEngine.js` y `gameTable.css` sin abrir; los seis protegidos, al mismo blob (§6).

## 1. Lo hecho, archivo por archivo

| Archivo | Cambio |
|---|---|
| `src/hooks/mesaCore.js` | `saldoUsable`, `hayRecarga`, `CASOS_RECARGA`, `tarjetaRecarga` y `armarTarjeta` (la decisión, separada para poder probar la rama defensiva de D-4). `pideRecarga`: la forzosa se decide **antes** de la puerta de saldo, y las otras dos pasan por `hayRecarga`. |
| `src/components/GameTable.jsx` | `tarjRec = tarjetaRecarga(...)` sustituye a `opcRecarga`. Las dos aperturas usan `monto: tarjRec.monto`. La fila de montos solo se pinta en el caso 1; en el caso 2, `.rec-todo` (primario más nota); en el caso 3, sin primario, con el subtítulo nuevo. `data-rec-caso` en el overlay para el arnés. |
| `src/config/textos.es.js` | `ia.recarga.sub.sinsaldo`, `ia.recarga.si.todo` y `ia.recarga.todo.nota`. El primario que corta el techo reutiliza `ia.recarga.si`. `textos.test.js` no lista estas claves y no hace falta tocarlo: la prueba de duplicados y la de «se nivelan» siguen verdes. |
| `src/styles/apu.css` | §13 nueva, **aditiva**: `.rec-todo` y `.rec-todo-nota`. En las tarjetas en fila (las blandas y la forzosa apaisada) la fila pasa a rejilla con `.rec-todo` en `display: contents`, para que el otro botón conserve el alto del primario. Sin `!important`. Ninguna regla toca una tarjeta que no tenga `.rec-todo`. |
| `src/dev/siembraAPU.js` | Molde `quiebra` (el humano con media apuesta): la forzosa sale en `WAITING` sin jugar ninguna mano. Con `saldo:` se elige el caso. Solo en DEV, igual que el resto del archivo. |
| `scripts/testRec2.test.js` | **Nuevo**, 49 pruebas (§3). |
| `scripts/testMesaAPU1.test.js` | La prueba «ninguna sin bolsillo» se parte en dos: la forzosa sin bolsillo pasa de `NINGUNA` a `FORZOSA` (D-5). El comentario dice por qué. |
| `scripts/diagDSK.mjs` | `runRec2`, enganchado al final de `runApu`: estados permanentes `caso2`, `caso3` y `caso2auto`. `node scripts/diagDSK.mjs apu rec2` los corre solos. |
| `docs/AJILEI_APU-1_Reglas_v1.3.md` | Nuevo (D-2). |

## 2. Respuestas que pide el STOP

### 2.1 D-4 · ¿Puede cortar el techo en el caso 2? **No.**

`opcionesRecarga` pinta tres montos: piso `10·u`, medio `20·u` y «Al techo» = `floor((techo − P)/u)·u`. Cada uno se enciende si `0 < monto ≤ tope`, con `tope = floor(min(techo − P, S)/u)·u`.

- Si el techo cortara (`techo − P < Su`), entonces `tope = floor((techo − P)/u)·u`, que es **exactamente** el monto de «Al techo». Esa opción queda encendida, así que es caso 1, no caso 2.
- Cuando `techo − P` es menor que el piso (por ejemplo mesa 100, P = 4.600, S = 600), «Al techo 400» es el único monto encendido. La fila se queda **como hoy**, con piso y medio apagados. Probado en `testRec2` («“Al techo” por debajo del piso sigue en la fila»).
- Si «Al techo» vale 0 (P en el techo), el tope es 0 y el caso es 3, sin pregunta en la voluntaria.

Por tanto, en el caso 2 el monto **es siempre `Su`** y el rótulo siempre dice «Recargar todo». Se comprueba además con un barrido de 6 mesas × todas las pilas × saldos de 0 a 12·u en pasos de media apuesta (`testRec2`, D-4). La rama «Recargar {hc}» está implementada (`armarTarjeta` con `todo: false`) y probada con una fila fabricada, como pide D-4.

### 2.2 D-6 · La entrada de la voluntaria

**Hoy:** el botón `[data-accion="recargar"]` junto a «Siguiente mano» solo se monta si `pideRecarga === VOLUNTARIA`, y esa condición ya exigía `topeRecarga > 0`, es decir, `Su ≥ unit` y P por debajo del techo. **Con `S < unit` el botón no aparece.** Con `unit ≤ S < 10·u` sí aparecía, y abría la tarjeta con los tres montos apagados y «Recargar 0». Ese era el mismo defecto que en la automática.

**Ahora:** la condición es la misma, porque `hayRecarga` es esa puerta con nombre. Con `unit ≤ S < 10·u` la tarjeta abre en caso 2. La entrada no necesitó ningún cambio propio.

## 3. Pruebas (`scripts/testRec2.test.js`, 49)

- **Matriz de la ficha (§4.3):** mesas 50 y 100 × forzosa, automática y voluntaria × S ≥ M, S = M, S = M − 1, S = 1 y S = 0. Son 30 casos, y en cada uno se comprueban el motivo y el caso.
- **Matriz del addendum (mesa 100):** 5000/300 → caso 1 · 600/300 → automática, caso 2, 600 · 650/300 → caso 2 con 600, y los 50 se quedan en el saldo · 600/0 → forzosa, caso 2 · 50/0 y 0/0 → forzosa, caso 3 · 0/300 → sin pregunta. Además, la forzosa por D-12 con S < unit también es caso 3.
- **D-4:** el barrido y la rama defensiva fabricada (§2.1).
- **Invariante:** sobre toda la rejilla (6 mesas, pilas hasta techo + u, saldos hasta 60·u), todo monto pintado es > 0, y todo monto encendido y todo primario cumple `0 < m ≤ S` y pasa `recargaValida`. El caso 3 equivale a «sin primario», que equivale a `!hayRecarga`.
- **Puerta compartida (D-7):** `pideRecarga ≠ NINGUNA` ⇔ la tarjeta no es caso 3, en las formas blandas.
- **Caso borde (P + S bajo el listón):** mesa 100, P = 100, S = 200 → «Recargar todo (200)». Tras recargar, P = 300 (sigue bajo el listón) y S = 0 → **sin pregunta**. Al perder hasta P < unit → forzosa, caso 3.
- **Nivelación efectiva:** P = 300 y S = 600, en el mismo orden que `confirmarRecarga`. La IA de 200 sube a `pilaIA(900)`, no a `pilaIA(1.300)`; la IA de 5.000 no baja.
- **D-7 en el JSX (sin jsdom, sobre el texto del archivo):** toda llamada `setRecarga({ motivo… })` usa `monto: tarjRec.monto`, no queda ningún `?? 0` en una línea con `monto`, y los dos primarios están condicionados a `CASOS_RECARGA.FILA` y `CASOS_RECARGA.TODO`.

## 4. El arnés: `apu`, estados REC-2 (18/18)

`?apu=saldo:1600,quiebra` (caso 2 forzosa) · `?apu=saldo:1000,quiebra` (caso 3) · `?apu=saldo:1600,recarga` (automática de Victor: P = 300, S = 600, tras una mano). Avanzado · mesa 100 · entrada al piso. Se corre en 360×640, 412×915 (S25 vertical) y 1920×1080, en mesa 2 y en mesa 5.

Vara en cada celda:

- ningún monto pintado vale 0 y ningún primario dice «Recargar 0»;
- en el caso 2, primario «Recargar todo (600)» encendido, sin fila y con la nota **debajo** del primario;
- en el caso 3, sin primario, sin fila, con el subtítulo nuevo y «Salir con mis fichas»;
- botones de 36 px o más, sin solapes, y la tarjeta dentro de la pantalla.

Además se hace el **gesto** en cada caso:

- **Caso 2:** se toca «Recargar todo». Resultado: la pila pasa a 650, `data-recargas = 1` y no queda ni burbuja ni pregunta, porque S = 0.
- **Caso 3:** se toca «Salir con mis fichas». Resultado: la mesa se cierra.

Hallazgo durante la medición, **ya corregido:** la primera versión de la §13 alineaba la fila con `flex-start`, y en la automática «No recargar» se quedaba en **28 px** (33 px en escritorio), por debajo del piso táctil. La rejilla lo resuelve. La vara lo cazó en la primera corrida.

Capturas (`capturas-apu/rec2/`, ignoradas por git):

| | mesa 2 | mesa 5 |
|---|---|---|
| caso 2 forzosa | `rec2_caso2_m2_{360x640,412x915,1920x1080}.png` | `rec2_caso2_m5_…` |
| caso 3 forzosa | `rec2_caso3_m2_…` | `rec2_caso3_m5_…` |
| caso 2 automática | `rec2_caso2auto_m2_…` | `rec2_caso2auto_m5_…` |

La tarjeta es un overlay global: no depende de `OpponentPanel` ni de `.ai-zone`. Las dos vías quedan cubiertas porque cada estado se corre en mesa 2 y en mesa 5.

## 5. D-8 · Inventario de `.btn-primary` deshabilitable

Ninguna hoja define `.btn-primary:disabled` ni `.btn:disabled`. `.btn:hover` (gameTable.css:497) sube el botón 2 px y lo aclara **aunque esté deshabilitado**.

| Pantalla | Botón | ¿Lleva `disabled`? | ¿Alcanzable deshabilitado? |
|---|---|---|---|
| Tarjeta de recarga, caso 1 | `recarga-si` «Recargar {hc}» | sí: `!recargaValida(monto…)` | **No, desde REC-2:** el monto nace de la primera opción encendida y solo se puede elegir entre opciones encendidas. Antes de REC-2 era el «Recargar 0». |
| Tarjeta de recarga, caso 2 | `recarga-si` «Recargar todo ({hc})» | sí, mismo criterio | **No:** el monto es `topeRecarga`, válido por construcción. |
| Mesa, barra | «Iniciar mano» · «Descartar / Sin descartar» · «Siguiente mano» | no | no: se montan o desmontan, nunca se apagan |
| Mesa, salida de partida | «Salir de la mesa» (GameTable:2105) · «Volver al lobby» (modal de bancarrota) | no | no |
| Celebración | «Salir de la mesa» (Celebracion.jsx:409) | no | no |

No hay ningún otro `.btn-primary` en `src/`. Hoy no queda ninguno deshabilitado que se pueda alcanzar. **Propuesta de regla aditiva** para otro frente, en `apu.css` o en una hoja nueva, nunca en `gameTable.css`: sigue el molde de `puerta.css:201` y `salas.css:648`.

```css
.btn.btn-primary:disabled { opacity: 0.45; cursor: default; filter: none; transform: none; }
```

## 6. Regresión

| Vara | Resultado |
|---|---|
| `npm run build` | limpio. Sigue el aviso de chunk > 500 kB, que ya existía. `quiebra` y `?apu=` no llegan al bundle (0 apariciones en `dist/assets`). |
| vitest completo | **37 archivos, 1056 pruebas, todo verde.** Incluye las 49 de `testRec2` y la prueba de `testMesaAPU1` que se partió en dos. |
| eslint | **21 problemas (20 errores y 1 aviso), igual que la línea base.** Se comparó mensaje a mensaje con HEAD; los dos avisos que introdujo `testRec2` se corrigieron. |
| `diagDSK apu` | **7/7 celdas de APU-1 y 18/18 de REC-2.** 39 min. |
| `diagDSK rec` | **VERDE**: p1…p7 y anillo. |
| `diagDSK luz` | **VERDE**: 20 celdas y 4 tapetes, p1…p5 y extras. La primera corrida salió en rojo en `p4_fugas` **por entorno**: la Portada se mide contra un segundo servidor en 5174 sin bypass (`VITE_AUTH_BYPASS= npx vite --port 5174`, ver LUZ-1 §5), y no estaba levantado (`ERR_CONNECTION_REFUSED`). Con él arriba: 114 elementos, 0 diferencias. |
| `diagPUE` (todo, 4173) | **122 en verde y 1 en rojo**. El rojo es **1.8b**, el conocido: camino crítico de 219,4 KiB contra 200 de techo, que en CAP-1 medía 219,0. Los +0,4 KiB vienen del código de la tarjeta y de los tres textos nuevos. **`capvis` en verde** en las 8 celdas. |
| Protegidos | Los seis, con el mismo blob que la instantánea de `AJILEI_Protegidos_v1.0.md` §3. `gameEngine.js` es `21c4d3f56318` y `gameTable.css` es `1e21371c8543`. |
| Commits | ninguno |

## 7. Pendientes que se anotan

- **El modal de bancarrota antiguo** («Te quedaste sin Heptacoins», `GameTable.jsx` ~2750, con dos «Próximamente») **deja de ser alcanzable en vs IAS**. Antes se llegaba con P < unit y S < unit; ahora esa situación es la forzosa de caso 3. No se borra en esta campaña (D-5).
- El v1.3 remite a `docs/reportes/AJILEI_REC-2_Cierre_v1.0.md`, que se escribe al cerrar la campaña.
- Los comentarios de cabecera de `mesaCore.js` siguen citando la v1.2 como normativo general. Los bloques nuevos citan la v1.3.
- La voz de §2 de la ficha para el subtítulo del caso 2 («Te quedan {S} HC…») **no se implementó**: el addendum no la lista. El caso 2 conserva el subtítulo de cada forma («Quedan {P} HC…», «Hasta {tope} HC más…» o «Con estas fichas…»), más la nota bajo el primario. Queda para el visto de Victor.

## 8. Tiempo

Fase 1 de 16:02 a 18:03, unas **2 h de reloj**. De ellas, unos 80 minutos fueron corridas del arnés en segundo plano: `apu` completo 39 min, `rec` 14, `luz` 11 más 11 de la repetición, y `diagPUE` 3,5. El trabajo activo fue de unos 55 minutos. **La ficha estimaba 30 minutos, y el trabajo activo lo pasa en unos 25.** Se fueron en el arnés nuevo (con una corrección de CSS que la propia vara exigió y un presupuesto de manos corto en mesa 5) y en la v1.3.

## 9. Decisiones del rector sobre la Fase 1

Tomadas en `AJILEI_REC-2_Commits_v1.0.md` §0, tras la validación de Victor en teléfono y en PC.

| # | Decisión |
|---|---|
| 1 | **Subtítulo del caso 2:** queda como está implementado. Cada forma conserva su subtítulo y se añade la nota «Es todo tu saldo disponible.» bajo el primario. La frase de §2 de la ficha («Te quedan {S} HC…») **se descarta**, porque repetiría lo que ya dice la nota. |
| 2 | **Cabeceras de `mesaCore.js`:** los comentarios de cabecera que citan la v1.2 como normativo general pasan a citar la **v1.3**. Solo comentarios; ningún cambio de código. Hecho: la cabecera del archivo y las dos citas de sección (§5.1 en el comentario de `pideRecarga` y §5.5 en la cabecera de REC-1), que la v1.3 conserva con el mismo contenido. |
| 3 | **`.btn-primary:disabled`:** la regla propuesta en §5 queda como pendiente de otro frente. No entra en REC-2. |
| 4 | **Modal de bancarrota antiguo:** sigue como pendiente anotado, sin borrar. |
