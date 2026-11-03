# AJILEI · ARN-4 · Tanda 4a · Herramientas · Informe v1.0

**Para:** Victor y el rector · **De:** Claude Code · **Fecha:** 2026-11-03
**Ficha:** `AJILEI_ARN-4_Tanda4a_v1.0.md` · **Base:** `main` en `0364a5e` · **Sonda:** `AJILEI_ARN-4_Fase0_Informe_v1.0.md`
**Estado:** STOP-V aprobado por Victor, incluido lo hecho fuera de la ficha. Sin nada visible para el jugador.

---

## Qué entró

| ID | Qué | Dónde |
|---|---|---|
| **A1** | Vitest a prueba de la unidad en minúscula | `scripts/arnes/vitest.mjs`, `scripts/arnes/unidad.mjs`, `vite.config.js`; `npm test` |
| **A2 + A3 + A11** | Commits aislados, con limpieza segura y los 75 volcados | `scripts/arnes/aislado.mjs`, `scripts/arnes/aisladoCore.mjs`; `npm run aislado` |
| **A4** | Un solo botón para todas las varas | `scripts/arnes/orquesta.mjs`, `scripts/arnes/orquestaCore.mjs`; `npm run varas` |
| **A7** | Las dos lecturas que partían por `\n` | `scripts/testInvariantes.test.js`, `scripts/testRec2.test.js` |
| **D-5** | Vitest no necesita un build antes | `docs/AJILEI_Invariantes_v1.0.md` §3 |

## Cifras

| Prueba | Resultado |
|---|---|
| `npx vitest run` en una consola con `c:` | Código 2 con la frase, sin ningún archivo fallido |
| `npm test` en esa misma consola | Código 0 |
| `npm run aislado -- HEAD --perfil=rapido` | Verde en 14,9 s: 88/88, 2.076 pruebas, 0 omitidas, eslint igual a la base |
| Tras la copia | `git worktree list` en una línea; `node_modules` real con sus testigos y sus 155 entradas |
| `npm run varas -- rapido` | Código 0, unos 16 s |
| `npm run varas -- commit` | Código 0, 13 min 44 s; `humo` 13 min 27 s, sin compilar |
| vitest al cerrar | 91/91 archivos, 2.128 pruebas: 53 más que la base de la Fase 0, 52 de ellas de esta tanda |

Las duraciones sustituyen a las estimadas en la Fase 0, que daba ~15 s para `rapido` y ~14 min para `commit`.

## Sin corrida real

No lo pedía la ficha, y conviene saberlo antes de usarlo:

- `aislado`: `--perfil=commit`, `--dejar`, `--limpiar` y el corte con Ctrl+C.
- `varas -- completo`: solo lo vigila su contrato en `scripts/arnes/orquesta.test.js`. Sus topes por vara y sus unas 3 h siguen siendo estimados.
- La guarda de A1 cubre el proceso en minúscula. No se probó con `--root c:/…` en una consola en mayúscula.

Y lo que la Fase 0 dejó abierto sigue abierto: T3 está reproducido y curado, pero no está probado que todos los casos anteriores fueran este.

## Lo que la corrida real destapó

Errores míos de esta tanda, ya arreglados:

| Error | Efecto | Arreglo |
|---|---|---|
| La guarda de OneDrive buscaba la palabra en toda la ruta | Rechazaba el scratchpad, que lleva «OneDrive» en su nombre | Mira segmentos enteros |
| Contaba como fallo la protesta de `git worktree remove` | Código 2 con la copia ya quitada | Manda si la copia sigue ahí |
| Celdas de `apu` escritas de memoria | Una celda inexistente no mide nada y sale verde | Son las de `APU_VIEWPORTS`, y una prueba las compara |
| Un `eslint-disable` sobrante en un `.mjs` | Lo cazó la propia vara, que lo marcó como nuevo | Quitado |

Los `.mjs` pasan por eslint sin reglas, así que allí solo salta una directiva sobrante.

## Fuera de la letra de la ficha, aprobado por Victor

- **INV-40 pasa a vigilada**, con `scripts/arnes/aislado.test.js`.
- **Recuento del registro:** decía 78 filas y hay 80, por INV-79 e INV-80.
- **Duración de `humo`:** al día en §3 y §6.
- **Tres archivos más que los que nombra la ficha:** `unidad.mjs`, `aisladoCore.mjs` y `orquestaCore.mjs`, con lo que se prueba en unitario.

## Decisiones de diseño para la 4b y la 4c

- **Firma de eslint:** cuenta por archivo, regla y severidad, sin líneas. Vive en `FIRMA_ESLINT_BASE` (`scripts/arnes/aisladoCore.mjs`). **La B1 de la 4c debe bajarla en el mismo commit que arregle cada problema;** bajar no da rojo, pero la base quedaría floja. Solo lo que sube es rojo.
- **`--solo`:** acepta cualquier modo de `diagDSK` y `diagPUE`, aunque corra dentro de otro. Un modo nuevo, como la `pue.contraste` de la 4b, entra en `MODOS_PUE` y tiene que declararse en `scripts/arnes/orquestaCore.mjs`, o el contrato sale rojo.
- **Una omitida es un rojo:** `aislado` y `varas` dan código 1 si vitest omite algo.
- **`package.json`:** `git add -p` no se puede en este entorno. Cada commit lleva su script dejando el archivo en su versión intermedia antes del `git add`.

## Registro

`docs/AJILEI_Invariantes_v1.0.md`: INV-40 y el recuento de §2; §3 con las tres órdenes y vitest sin build; §6 con la duración de `humo` y dónde corre cada vara. Sin puertas ni invariantes nuevas. Protegidos: ninguno tocado. iOS: nada que medir, porque la tanda no toca nada visible (INV-41).

## Validación de los commits

Con `npm run aislado -- <a> <b> <c> <d> <e> --perfil=rapido`, después de este commit. El resultado va en el resumen de cierre de la tanda, porque este archivo forma parte de lo que se valida.
