# AJILEI · REC-2 · Informe de cierre · v1.0

**Campaña:** REC-2 — Recarga con saldo insuficiente
**Fecha:** 2026-09-28 · **Base:** `5f672b4` · **Ejecutor:** Claude Code · **Rector:** Claude (chat) · **Dueño:** Victor
**Documentos:** ficha `AJILEI_REC-2_v1.0.md` · `AJILEI_REC-2_Addendum1_v1.0.md` · `AJILEI_REC-2_Commits_v1.0.md`
**Informes:** `AJILEI_REC-2_Fase0_Informe_v1.0.md` · `AJILEI_REC-2_Fase1_Informe_v1.0.md`
**Normativo:** `docs/AJILEI_APU-1_Reglas_v1.3.md` (la v1.2 se conserva como historia)
**Validación:** Victor, en teléfono y en PC.

---

## 1. El defecto

La tarjeta de recarga mostraba **«Recargar 0»** en las tres recargas (forzosa, automática y voluntaria) cuando se cumplía **una apuesta de la mesa ≤ saldo < 10 apuestas**. En Avanzado · mesa 100 con 600 HC en el bolsillo salían los tres montos (1.000 · 2.000 · al techo) apagados, y un primario con 0 que se pintaba en dorado como si estuviera activo. En la forzosa, la única salida real era levantarse, aunque el jugador tuviera 600 HC para seguir.

**Causa:** dos funciones con distinto criterio de «hay saldo», más un `?? 0` en la vista.

- `pideRecarga` preguntaba en cuanto el saldo cubría una apuesta.
- El monto más bajo de `opcionesRecarga` era el piso de diez apuestas.
- Entre esas dos cifras no quedaba ningún monto encendido, y `GameTable.jsx` rellenaba el hueco con `primera?.monto ?? 0`.

El síntoma que se sospechaba por separado (A-2, «forzosa con 300 en la pila») **no era un defecto**. El código y el normativo coinciden en que la forzosa exige `P < unit`. La pila de 300 era la de antes de la mano; la forzosa salió al cierre de la mano, con P < 100.

## 2. La regla híbrida (normativo v1.3 §5.1 y §5.2)

El **saldo usable** es el saldo redondeado hacia abajo a la apuesta de la mesa. El resto se queda en el bolsillo.

| Caso | Condición | Qué se ofrece |
|---|---|---|
| **1** | al menos un monto de la fila cabe | la fila de siempre; los inalcanzables se apagan, no se esconden |
| **2** | ninguno cabe, pero el saldo usable llega a una apuesta | **un solo «Recargar todo ({hc})»** por el saldo usable, con «Es todo tu saldo disponible.» debajo |
| **3** | saldo usable < una apuesta | la **forzosa**, como tarjeta de solo salida («Salir con mis fichas»); en la automática y la voluntaria, sin pregunta |

Se implementa en un solo sitio, `tarjetaRecarga` en `mesaCore.js`, que decide el caso, los montos y el monto que nace elegido (positivo o `null`, nunca 0). `pideRecarga` usa la misma puerta (`hayRecarga`), y la vista pinta lo que el núcleo le da.

Nunca se ofrece un monto de cero. En el caso 2 el techo **no puede cortar**: si cortara, «Al techo» valdría exactamente lo que cabe y estaría encendida, así que sería caso 1. La rama «Recargar {hc}» existe solo como defensa y se prueba con una fila fabricada.

## 3. Decisiones

**De Victor:** la regla híbrida (ficha §2).

**Del rector, sobre la Fase 0 (Addendum 1):**

| # | Decisión |
|---|---|
| D-1 | A-2 se cierra: no es defecto. |
| D-2 | Normativo v1.3: la v1.2 íntegra con el texto literal de §5.1 y §5.2, y un registro de cambios. |
| D-3 | Montos múltiplos de la apuesta: el caso 2 usa `floor(S/unit)·unit`, y `0 ≤ S < unit` es caso 3. |
| D-4 | El techo también limita el caso 2 (monto = `topeRecarga`); el rótulo es «Recargar todo» o «Recargar {hc}». |
| D-5 | El caso 3 de la forzosa es de solo salida, con la misma burbuja. El modal de bancarrota antiguo deja de ser alcanzable. |
| D-6 | El caso 2 rige en las tres recargas; el caso 3 no pregunta en la automática ni en la voluntaria. |
| D-7 | Una sola puerta y ningún `?? 0` en la vista, con una prueba que lo vigila. |
| D-8 | Inventario de `.btn-primary:disabled`, sin cambios. |

**Del rector, sobre la Fase 1 (ficha de commits §0):**

1. El subtítulo del caso 2 queda como está (subtítulo de cada forma, más la nota); la frase «Te quedan {S} HC…» se descarta.
2. Las cabeceras de `mesaCore.js` citan la v1.3.
3. La regla `.btn-primary:disabled` queda para otro frente.
4. El modal de bancarrota antiguo queda como pendiente, sin borrar.

## 4. Cifras

- **Pruebas nuevas:** 49 en `scripts/testRec2.test.js`, y una prueba de `testMesaAPU1` que se parte en dos porque la forzosa sin saldo pasa de `NINGUNA` a `FORZOSA`. Cubren:
  - la matriz de la ficha (mesas 50 y 100 × tres formas × cinco saldos);
  - la matriz del addendum;
  - el barrido de D-4;
  - el invariante `0 < monto ≤ S` sobre toda la rejilla;
  - la puerta compartida;
  - el caso borde P + S bajo el listón;
  - la nivelación con el monto efectivo;
  - D-7 sobre el texto de `GameTable.jsx`.
- **Arnés:** los estados REC-2 del modo `apu` dan 18/18: caso 2 forzosa, caso 3 forzosa y caso 2 automática, en 360×640, 412×915 y 1920×1080, y en mesa 2 y mesa 5. Incluye tocar «Recargar todo» (la pila pasa a 650 y no vuelve a salir pregunta) y tocar «Salir con mis fichas» (se cierra la mesa).
- **Regresión de la Fase 1:**

  | Prueba | Resultado |
  |---|---|
  | build | limpio |
  | vitest | 1056/1056 |
  | lint | 21, igual que la línea base |
  | `diagDSK apu` | 7/7 celdas y 18/18 de REC-2 |
  | `diagDSK rec` | verde |
  | `diagDSK luz` | verde |
  | `diagPUE` | 122 en verde y 1 en rojo; `capvis` en verde |

  Se repite al cerrar: build limpio y vitest 1056/1056.
- **Camino crítico:** 219,4 KiB (219,0 en CAP-1). El rojo de `1.8b` sigue siendo el conocido; los +0,4 KiB vienen del código y los textos de la tarjeta.
- **Protegidos intactos:** los seis, con el mismo blob que la instantánea canónica (`gameEngine.js` `21c4d3f56318`, `gameTable.css` `1e21371c8543`). Ninguno se abrió.

## 5. Lecciones

1. **Dos funciones que deciden lo mismo con criterios distintos producen estados imposibles.** «¿Hay pregunta?» y «¿qué se ofrece?» vivían en dos funciones con dos umbrales. Ahora la regla vive en un solo sitio (`tarjetaRecarga`) y las demás la consultan (`hayRecarga`).
2. **Una vista no debe inventar un valor por defecto (`?? 0`) para un dato de reglas.** Si el núcleo no da monto, la vista no pinta el botón. Una prueba sobre el texto de `GameTable.jsx` lo vigila, porque sin jsdom el componente no se puede montar.
3. **Un botón deshabilitado sin estilo propio parece activo, y el jugador lo toca.** «Recargar 0» llevaba `disabled` y se veía dorado igual que uno activo. El inventario de D-8 queda como pendiente.
4. **No usar worktrees con uniones a `node_modules` para verificar commits.** Para comprobar que cada commit construye solo se usó un worktree temporal en el scratchpad, con una unión (junction) a `node_modules` del árbol principal.
   - Al retirarlo, `git worktree remove --force` **siguió la unión** y vació `node_modules/.bin` del proyecto. Windows cortó el borrado al no poder quitar el directorio.
   - Se reparó con `npm rebuild --ignore-scripts`: 51 enlaces regenerados, `package.json` y el lock sin cambios, `npm ls` sin paquetes perdidos. Build, vitest (1056), lint (21), `playwright-core`, `ffmpeg-static` y la CLI de Supabase siguieron respondiendo.
   - Para que no se repitiera, la unión que quedaba se quitó con un borrado no recursivo.
   - **Regla:** para verificar commits por separado, usar un **clon limpio con su propia instalación**, o aceptar la verificación en el árbol principal. Nunca un worktree enlazado al `node_modules` real.
5. **Una vara que falla por entorno no es una regresión, pero hay que demostrarlo.**
   - `luz` salió en rojo en `p4_fugas` porque su Portada se mide contra un segundo servidor en 5174 sin bypass, que no estaba levantado. Con él, verde.
   - En el worktree, `testBancoBandas` falló porque necesita los volcados ignorados de `capturas-dsk/`; en el árbol principal pasa.

## 6. Commits

| Commit | SHA | Contenido |
|---|---|---|
| REC-2a | `5d5902a3e109232fc9acae86f0f4cada2705970d` | regla híbrida en el núcleo y su prueba en `testMesaAPU1` |
| REC-2b | `99a6c3de6f9a20def46887ed54a534150f2d5963` | tarjeta de un monto y de solo salida, tres textos, §13 de `apu.css` y `testRec2` |
| REC-2c | `7a8d4cd5c270e05ab677e376dcb5183981a261e0` | molde `quiebra` (solo DEV) y estados REC-2 del modo `apu` |
| REC-2d | `fa9f6f3cacebd9ba4cf8946b3d372e95dc22e52a` | normativo v1.3 e informes de las fases 0 y 1 |
| REC-2e | este informe | — (no puede contener su propio SHA) |

El mapa se reordenó respecto a la ficha con el visto de Victor: `testRec2.test.js` va en REC-2b y no en REC-2a, porque sus tres pruebas de D-7 leen el JSX de la pantalla. Se comprobó que cada commit construye y pasa sus pruebas por sí solo; el único rojo, el de `testBancoBandas`, era del entorno del worktree.

## 7. Pendientes que deja la campaña

- **`.btn-primary:disabled`**, en otro frente. Propuesta aditiva en el informe de la Fase 1, §5: `.btn.btn-primary:disabled { opacity: 0.45; cursor: default; filter: none; transform: none; }`, nunca en `gameTable.css`.
- **El modal de bancarrota antiguo** («Te quedaste sin Heptacoins», con dos «Próximamente») es inalcanzable en vs IAS y sigue en `GameTable.jsx`.
- **`1.8b`**: el camino crítico mide 219,4 KiB contra un techo de 200. Pide una tanda propia.
- **Pendiente de Victor:** quitar `.git/worktrees/wt` con `git worktree prune`. Git ya no lista ese worktree, pero la carpeta de metadatos no se dejó borrar (Permission denied, posiblemente por un bloqueo de OneDrive). Es inofensiva. La carpeta del scratchpad ya no tiene la unión a `node_modules`.
