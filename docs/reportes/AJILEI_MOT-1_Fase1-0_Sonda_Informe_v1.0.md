# AJILEI · MOT-1 · Fase 1-0 — Sonda de empaquetado · Informe v1.0

**Ficha:** `AJILEI_MOT-1_Fase1-0_Sonda_v1.0.md` · **Base:** `main` en `f9ee503` · **Apertura:** 2026-09-12 · **Cierre del informe:** 2026-09-14
**Estado:**
- **Vuelta 1 (V1):** desplegada por Victor. P1 y P2 respondidas y **cerradas**.
- **Vuelta 2 (V2-copia):** desplegada e invocada por Victor. P3–P8 y B respondidas y **cerradas**.
- **Veredicto del rector: J-1 CONFIRMADO** (§3).
- **Limpieza (§6): NO ejecutada.** La hace Victor cuando el rector cierre la fase.

Todas las cifras de §2 son las que Victor pegó de las invocaciones reales. Lo que no se midió está marcado como no medido, no supuesto.

---

## §0 Hechos previos a escribir la sonda (medidos, sin desplegar)

| # | Hecho | Evidencia |
|---|---|---|
| 0-1 | **El nombre `_sonda_mot1` de la ficha no es desplegable.** El CLI valida el slug. | `grep -a` sobre `node_modules/@supabase/cli-windows-x64/bin/supabase.exe` (98 938 880 B, CLI 2.116.0): `^[A-Za-z][A-Za-z0-9_-]*$` ×7 y el mensaje literal `Invalid Function name. Must start with at least one letter, and only include alphanumeric characters, underscores, and hyphens.` |
| 0-2 | **Victor autorizó `sonda_mot1`** (mismo contenido y reglas, sin guion bajo). La línea de `.gitignore` usa ese nombre. | Respuesta en el chat del 2026-09-12 |
| 0-3 | **En esta máquina no hay Docker ni Deno.** El despliegue tiene que ser con `--use-api` (empaquetado en el servidor). | `docker: command not found`, `deno: command not found`; `functions deploy --help` → `--use-api  Bundle functions server-side without using Docker.` |
| 0-4 | CLI enlazado a `cbbnddlapolelbdsprjm`, que es el mismo host de `VITE_SUPABASE_URL`. El proyecto usa **llaves nuevas** (`sb_publishable_…`). | `supabase/.temp/project-ref`; `.env.local` (solo se leyeron el host y el prefijo de la llave) |
| 0-5 | **La referencia de P4 son dos cifras, no una.** `JSON.stringify(estado).length` = **3 282** (la de la Fase 0, D1) y los **bytes UTF-8** = **3 285** (`Tú` y `—`). Con tres barajados distintos no cambia. | Sonda Node por stdin ×3: `length 3282 utf8 3285 phase BET_1 hand 1 deck 36` |
| 0-6 | El grafo que V1 tiene que arrastrar pesa **77 281 B de fuente**: gameEngine 22 060, aiPlayer 51 000, deck 1 252, handEvaluator 2 497, ajileiConfig 472. | `wc -c` |
| 0-7 | Login de la app por **OTP de correo** (`useAuth.js:181`). Sesión en `localStorage`, clave por defecto de supabase-js `sb-cbbnddlapolelbdsprjm-auth-token`. De ahí sale el token de P5. | `src/hooks/useAuth.js`, `src/lib/supabase.js:35` (sin `storageKey` propio) |

## §1 Qué se construyó

Una Edge Function en `supabase/functions/sonda_mot1/index.ts`, sin `deno.json`.

### Vuelta 1 — V1, import directo (cerrada)

`import * as motor from '../../../src/engine/gameEngine.js'`, **estático** y sin tocar el motor. Victor la desplegó y esta es la salida literal de `deploy`:

```
Uploading asset (sonda_mot1): supabase/functions/sonda_mot1/index.ts
Uploading asset (sonda_mot1): src/engine/gameEngine.js
unexpected deploy status 400: {"message":"Failed to bundle the function
(reason: Module not found \"file:///tmp/user_fn_..._1/source/src/engine/deck\".
    at file:///tmp/user_fn_..._1/source/src/engine/gameEngine.js:1:41)."}
```

Lo que se lee en esa salida:
- El empaquetador siguió el import estático fuera de `supabase/functions/` y **subió `src/engine/gameEngine.js`**.
- Dentro de ese archivo no pudo resolver `./deck`, que no lleva extensión. Se paró en el primer especificador (`:1:41`), así que **no llegó a subir** `deck.js`, `handEvaluator.js`, `aiPlayer.js` ni `ajileiConfig.js`.

**Control local (2026-09-12, Node v22.19.0, ESM estricto sin el resolvedor `scripts/_resolveExt.mjs`):** Node rechaza el mismo archivo por el mismo motivo. El fallo no es una rareza de Supabase; es que el motor no es ESM correcto sin un resolvedor que añada extensiones (Vite y Vitest lo añaden).

```
ERR_MODULE_NOT_FOUND | Cannot find module 'C:\Users\victo\OneDrive\Documents\ajilei\src\engine\deck' imported from C:\Users\victo\OneDrive\Documents\ajilei\src\engine\gameEngine.js
```

**Decisión del rector tras V1:** no se prueba la V2 de la ficha (mapa de importaciones). Un mapa que repita los imports internos del motor es deuda permanente: el día que alguien añada otro import sin extensión, el despliegue se rompe sin explicación. La edición 6 de K-1 ya está autorizada y es ESM correcto. La V3 de la ficha tampoco se prueba.

### Vuelta 2 — V2-copia (orden del rector, cerrada)

**V2 ya no mide el arreglo compartido; eso lo respondió P1.** Solo mide que el motor se ejecuta en Deno (P3–P8). Es una copia desechable y se borra con la sonda.

- Import: `import * as motor from './motor/engine/gameEngine.js'`.
- **Copia de los cinco archivos del grafo** en `supabase/functions/sonda_mot1/motor/`, con la estructura `engine/` + `config/`. Si los cinco quedaran sueltos en `motor/`, el cuarto import (`../config/ajileiConfig`) pediría cambiar la ruta además de la extensión. Con esta estructura, la única edición es la que ordenó el rector.
- **Única edición, sobre la copia de `gameEngine.js`:** añadir `.js` a las líneas 1-4. Evidencia:

```
$ diff src/engine/gameEngine.js supabase/functions/sonda_mot1/motor/engine/gameEngine.js
1,4c1,4
< import { createDeck, shuffleDeck } from './deck'
< import { getBestSuitScore, isAjilei, getComodinValue } from './handEvaluator'
< import { decideBetAction, decideDiscard } from './aiPlayer'
< import { AJILEI_CONFIG } from '../config/ajileiConfig'
---
> import { createDeck, shuffleDeck } from './deck.js'
> import { getBestSuitScore, isAjilei, getComodinValue } from './handEvaluator.js'
> import { decideBetAction, decideDiscard } from './aiPlayer.js'
> import { AJILEI_CONFIG } from '../config/ajileiConfig.js'
  aiPlayer.js idéntico · deck.js idéntico · handEvaluator.js idéntico · ajileiConfig.js idéntico   (cmp)
```

- **Control local de la copia**, con Node en ESM estricto y sin resolvedor: `length 3282 utf8 3285 phase BET_1 hand 1 exports 11`. Es idéntico a lo que da `src/` con el resolvedor.
- `src/` no se tocó: `git diff --stat` de los cinco protegidos sale vacío.

**Despliegue de V2 (Victor, 2026-09-14):** subieron los seis archivos del grafo: `index.ts`, `motor/engine/gameEngine.js`, `aiPlayer.js`, `deck.js`, `handEvaluator.js` y `motor/config/ajileiConfig.js`. Sin error de empaquetado. Runtime reportado: **`supabase-edge-runtime-1.76.0` (compatible con Deno v2.1.4), V8 11.6.189.12**.

Victor hizo cuatro invocaciones: dos sin token, una con token y una con token y `?b=1`. **`bloque_A_ok: true` en las cuatro.**

### Común a las dos vueltas

- Ejecuta `createInitialState(10, 2)` → `startHand` → `advanceFromDeal`.
- El uid sale de la cabecera `Authorization`, validado contra `/auth/v1/user`. Nunca del cuerpo. **Eso es un atajo de la sonda; la Fase 1 no lo usa** (§4, hallazgo H-S1).
- Cada medición va en su propio `try/catch`.
- **Límite de ese diseño:** un import estático que falle no llega al handler. Ese fallo lo muestra el `deploy` o el arranque del worker, no el JSON (fue lo que pasó en V1).
- Bloque B con `?b=1`, **solo si el bloque A pasó entero**: emite por REST `/realtime/v1/api/broadcast`.
- Se despliega con `--no-verify-jwt`, para que la llamada sin sesión llegue a la función y P5 pueda dar `null`. Es decisión de la sonda, no de la Fase 1.

**Variante con la que quedó:** V2-copia. Es la variante de medición; en la Fase 1 el camino es la edición 6 sobre `src/` y el import directo de V1.

## §2 P1–P8

| # | Pregunta | Resultado | Evidencia |
|---|---|---|---|
| P1 | ¿Empaqueta archivos de fuera de `supabase/functions/`? | **VERDE · cerrada** | V1: `Uploading asset (sonda_mot1): src/engine/gameEngine.js` (§1). |
| P2 | ¿Resuelve los 4 especificadores sin extensión? | **ROJO · cerrada** | V1: `Module not found ".../source/src/engine/deck"` en `gameEngine.js:1:41`; Node estricto da el mismo fallo (§1). **La edición 6 de K-1 es necesaria.** |
| P3 | ¿El motor se ejecuta? | **VERDE · cerrada** | `ok: true`, `phase: BET_1`, `handCount: 1`, `pot: 20`, `cartas_en_mazo: 36`, `ms_mano` **0,46 – 0,79 ms**. Cartas distintas en cada invocación: el barajado corre en el runtime, no llega fijado. |
| P4 | ¿Mismo tamaño que en Node (3 282 / 3 285)? | **VERDE · cerrada** | `ok: true`, `length 3282`, `utf8 3285`. Idéntico a Node, con barajados distintos (confirma 0-5). |
| P5 | ¿Conoce al jugador? | **VERDE · cerrada** (con reserva, H-S1) | Sin token: `ok: true`, `uid: null`. Con token: `ok: true`, `http 200`, `uid afd4e2ab-94f0-4838-aa4a-6e925219c549`, `is_anonymous: false`. **La vía medida cuesta ~280 ms por invocación y no es la de la Fase 1** (§4). |
| P6 | ¿`crypto.getRandomValues`? | **VERDE · cerrada** | `ok: true`. |
| P7 | Peso y arranque en frío/caliente | **VERDE en frío · caliente NO medido** | `ms_modulo_evaluado` **14,8 – 23,5 ms** (carga del grafo entero, IA incluida). `ms_handler` **0,8 – 1,3 ms** sin token. `T_TOTAL` **0,34 – 0,42 s** extremo a extremo desde la máquina de Victor. **Las invocaciones dieron `invocacion_en_este_isolate: 1`**: fueron arranques en frío, ninguna cayó en un isolate caliente, así que el tiempo en caliente queda sin cifra. **Peso del bundle:** la salida de `deploy` no da tamaño; lo único medido es la fuente subida, 85 246 B (`index.ts` 7 953 + grafo 77 293, la copia de `gameEngine.js` tiene 12 B más por las cuatro extensiones). |
| P8 | ¿Arrastra `aiPlayer.js` sin ejecutarlo? | **VERDE · cerrada** | Arrastrado: `deploy` subió `motor/engine/aiPlayer.js`. No ejecutado: el recorrido de P3 no pasa por la IA. En `gameEngine.js`, `decideBetAction` y `decideDiscard` solo se llaman en `:481` (`applyAIBetAction`) y `:502` (`applyDiscard`), y la sonda no llama a ninguna de las dos. Su coste en frío va dentro de los 14,8 – 23,5 ms de P7. |
| B | Broadcast con llave de servicio (opcional) | **VERDE para emisión · recepción NO probada** | `ejecutado: true`, `http 202`, `tipo_llave: sb_secret`, cuerpo vacío. **El 202 prueba permiso y camino de emisión, no recepción** (H-S2). |

## §3 Veredicto

**J-1 CONFIRMADO** (veredicto del rector, 2026-09-14).

- El motor compartido se despliega desde `src/` (P1) y se ejecuta en el runtime de Edge Functions con el mismo estado y el mismo tamaño que en Node (P3, P4).
- El runtime tiene lo que K-5(a) necesita (P6), conoce al jugador (P5) y puede emitir por Broadcast con la llave secreta (B).
- **La única condición es la edición 6:** cuatro extensiones `.js` en `gameEngine.js:1-4`. Es corrección ESM, no una concesión a la plataforma: Node v22 en ESM estricto falla igual que Supabase (§1).
- Cae el riesgo **I-8** de la Fase 0 y quedan respondidas **F3-1** y **F3-2**.
- No se abre J-2 por empaquetado. La recomendación de la Fase 0 §L («si falla cambia el camino J-1 → J-2») ya no aplica.

## §4 Efecto sobre las seis ediciones de K-1, y hallazgos para la Fase 1

### Las seis ediciones

| Edición de K-1(a) | Efecto de la sonda |
|---|---|
| 1 · exportar `applyBetAction` | Sin cambio |
| 2 · asiento como parámetro | Sin cambio |
| 3 · descarte por asiento | Sin cambio |
| 4 · `createInitialState` con lista de jugadores | Sin cambio |
| 5 · quitar la terminación de mesa atada al asiento 0 | Sin cambio |
| **6 · especificadores con `.js`** | **Pasa de condicional a NECESARIA** (P2). Suficiente: con ella sola, el grafo entero empaqueta y corre (V2). |

- Se descarta sustituirla por un mapa de importaciones (decisión del rector tras V1).
- Es la única edición que hace falta solo para que el motor **se despliegue**; las otras cinco son de reglas y arbitraje.
- En `src/` es inocua para Vite y Vitest, que ya resuelven con o sin extensión. La confirmación la darán las 685 pruebas cuando se aplique.
- El resto del grafo no pide nada: `aiPlayer.js:1-2` ya importa con `.js`, y `deck.js`, `handEvaluator.js` y `ajileiConfig.js` no importan nada. V2 lo demuestra: los otros cuatro archivos subieron idénticos al byte.
- Colateral: con la edición 6, `scripts/_resolveExt.mjs` deja de hacer falta para cargar `gameEngine.js` en Node. No se toca en esta fase; se anota.

### Hallazgos para la Fase 1 (anotados por orden del rector)

**H-S1 · La verificación del token va por JWKS local, no por HTTP.**
- Validar el token llamando a `/auth/v1/user` cuesta **~280 ms por invocación**, frente a 0,8 – 1,3 ms de `ms_handler` sin token.
- Pagar eso en cada jugada es **inaceptable**.
- En MOT-1 el uid se obtiene verificando la firma del JWT **en local contra la JWKS** (`SUPABASE_JWKS` está en el entorno de la función) y leyendo `sub` de las claims verificadas.
- Sigue valiendo la regla de F4: el uid sale del token, nunca del cuerpo.
- La vía `/auth/v1/user` de esta sonda no se reutiliza.

**H-S2 · El 202 del bloque B no prueba recepción.**
- `http 202` con `sb_secret` prueba dos cosas: que la llave tiene **permiso** y que el **camino de emisión** REST existe.
- No prueba que un cliente suscrito reciba el mensaje. Tampoco prueba nada de canales privados ni de políticas sobre `realtime.messages`: la sonda emitió `private: false`.
- **La recepción se prueba en la Fase 1d, con un cliente suscrito.**

**H-S3 · Cómo leer las cifras de P7 (reserva de medición).**
- Todas son de arranque en frío.
- El tiempo en caliente no está medido. Si hace falta, sale solo en la Fase 1 al invocar en ráfaga; esta fase no lo repite.

## §5 Efecto sobre la estimación de §L (Fase 0)

La base es la tabla de la Fase 0 §L: J-1, 18 – 25 h.

| Sub-tanda | Antes | Efecto de la sonda | Después |
|---|---|---|---|
| 1a · Documental | 1 – 1,5 h | Sin cambio | 1 – 1,5 h |
| 1b · Motor y árbitro | 5 – 7 h | La edición 6 ya estaba dentro («ediciones autorizadas»). Pasa de condicional a segura y es trivial, con las 685 pruebas como control. | 5 – 7 h |
| 1c · Azar | 1 – 1,5 h | P6 confirma que el CSPRNG existe en el runtime; no cambia el trabajo. | 1 – 1,5 h |
| 1d · Esquema | 3 – 4 h | Sin cambio en horas. Su verificación incluye la **recepción** de Broadcast con cliente suscrito (H-S2), que ya era parte de la «verificación viva». | 3 – 4 h |
| 1e · Edge Function | 6 – 9 h | **Sale la puerta de empaquetado** («prueba de empaquetado en Deno primero, como STOP si falla»): hecha aquí. **Entra la verificación JWT por JWKS local** (H-S1) en lugar de `getUser`; es de tamaño parecido a lo que ya contaba «auth `uid → asiento`», más sus pruebas (firma mala, token caducado, sin token). Balance: aprox. −1 h. | 5 – 8 h |
| 1f · Humo con dos sesiones | 2 h | Sin cambio | 2 h |
| **Total** | **18 – 25 h** | | **17 – 24 h** |

- **Riesgo, más que horas.** Lo que cambia de verdad es el riesgo. Desaparece el único punto de la Fase 0 que podía obligar a cambiar de camino (J-1 → J-2) a mitad de la Fase 1. La lectura de «3 a 4 jornadas» se mantiene; la de la casa (ARN-1) sigue siendo la corrección prudente.
- **Partición.** La recomendación de partir la Fase 1 se mantiene: 1a + 1b + 1c sin Supabase, con commit propio. Cambia su motivo: 1e ya no empieza con una puerta que pueda reabrir el camino.

## §6 Limpieza (la hace Victor al cerrar la fase — NO ejecutada)

Lista definitiva. Claude Code no borra nada.

1. **La función desplegada:**
   ```
   npx supabase functions delete sonda_mot1 --project-ref cbbnddlapolelbdsprjm
   ```
2. **El directorio `supabase/functions/sonda_mot1/` entero** (ignorado por git, no aparece en `git status`):
   - `index.ts`
   - `motor/engine/gameEngine.js` (copia con las cuatro extensiones)
   - `motor/engine/aiPlayer.js`
   - `motor/engine/deck.js`
   - `motor/engine/handEvaluator.js`
   - `motor/config/ajileiConfig.js`

   `supabase/functions/` no existía antes de la sonda (Fase 0 F1). Al quedar vacío, se borra también.
3. **Las cuatro líneas añadidas al final de `.gitignore`** (una en blanco, dos de comentario y `supabase/functions/sonda_mot1/`). Después, `git diff .gitignore` tiene que salir vacío.
4. **Comprobación final:**
   - `git status` sin ` M .gitignore`.
   - `git diff --stat` de los cinco protegidos, vacío.

**Se queda en el árbol, sin rastrear, hasta que el rector decida si viaja:** este informe, `docs/reportes/AJILEI_MOT-1_Fase1-0_Sonda_Informe_v1.0.md`.
