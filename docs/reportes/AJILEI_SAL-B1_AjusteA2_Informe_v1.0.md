# AJILEI · SAL-B1 · Ajuste A2 · Informe v1.0
## La «mesa fantasma»: una fila de nulos que el cliente tomaba por mesa

**Rector:** `AJILEI_SAL-B1_AjusteA2_v1.0.md`. Corrige el árbol de A1; no reabre nada más.
**Punto de partida:** el árbol de A1 en STOP, con `20260911043500_sal_b1_ajuste.sql` aplicada por Victor (Grupos A y B en verde).
**Estado:** **STOP sin commits. Sin SQL nuevo.** Falta que Victor reconstruya y repita §4 con los dos teléfonos.

---

## 0. Resumen en cuatro líneas

La hipótesis del rector es correcta: `unirse_sala` (y `mi_sala`) hacen `return null`, pero PostgREST llama a una función que `returns public.salas` con `select * from f()`, y Postgres expande un compuesto nulo en `FROM` como **una fila con todas las columnas en null**. El cliente recibía `{ id: null, jugadores: null, estado: null, … }`, lo tomaba por mesa y pintaba el stub con «Mesa de ⟦n⟧ · 0 HC · La mesa arrancó».

El arreglo es el de §2 del rector sin la alternativa SQL: **un solo predicado `esMesa` (por `id`)** en `salasApi`, aplicado a las cinco RPC que devuelven una mesa; la **guarda del último metro** en `App` por la que pasa todo camino al stub, incluida la entrada simulada; y las **trazas temporales** de §1. 613 pruebas (+7), lint 21, `dist/` limpio, **66/66** celdas (11 estados), `diagDSK lob` 6/6, protegidos intactos.

---

## 1. La forma exacta de la respuesta, y hasta dónde se confirmó

### 1.1 Lo que se pudo confirmar sin sesión

No hay sesión real disponible en esta máquina (la cuenta necesita el código de correo), así que la llamada desde la consola que pide §1 **queda para Victor**. Lo que sí se confirma leyendo:

- **Postgres.** Una función no-SETOF que devuelve un tipo compuesto y se invoca en `FROM` produce **exactamente una fila**; si el valor es NULL, la fila se rellena con nulos (`ExecMakeTableFunctionResult`: «NULL result, store a null row»). No hay forma de que `select * from f()` devuelva cero filas para una función que no es `setof`.
- **PostgREST.** Para una RPC cuyo tipo de retorno es compuesto usa `select * from f(...)` (es lo que permite `?select=` sobre RPC) y serializa la única fila como un objeto. Un objeto con `id: null` y las demás columnas en null.
- **La pantalla lo confirma por su forma.** «Mesa de ⟦n⟧» es `sala.jugadores` nulo; «0 HC» es `montoTexto(null)`; «Estás en la mesa · Privada» es `anfitrion_id` nulo y `tipo` nulo (cae a la etiqueta de privada); «La mesa arrancó» es `estado !== 'esperando'` con `estado` nulo. Los cuatro síntomas son los cuatro campos de una fila de nulos.

**El propio SAL-A lo había rozado.** El comentario de `mi_sala` en la migración de SAL-A avisa de que un `select … into` sin filas «dejaría la variable compuesta con todos sus campos vacíos» y que «PostgREST lo entregaría como `{"id":null,…}`», y por eso hace `return null`. La mitad SQL del razonamiento era buena; la mitad PostgREST no: **`return null` produce, tras `select * from f()`, exactamente la misma fila de nulos que quería evitar.**

### 1.2 Cómo lo confirma Victor, con una sesión real

Ya no hace falta pegar nada en la consola: desde A2 la propia capa **escribe la forma cruda** cuando le llega una fila sin `id`:

```
SAL-A2 · unirse_sala devolvió una fila sin id — forma cruda: {"id":null,"codigo":null,…}
```

Basta abrir la build (`vite preview`) en un **navegador de escritorio con sesión real**, DevTools abierto, y teclear un código falso. Si en vez de esa línea aparece el error bajo el campo **sin** traza, la base devolvió un `null` de verdad y la hipótesis era otra; la ficha manda parar y preguntar en ese caso. La línea va **verbatim al informe** en cuanto se lea.

### 1.3 El fantasma al iniciar sesión en el Motorola, y por qué el S25 no lo sufría

Las dos causas que §1 baraja se neutralizan en A2 (2.1 cubre `mi_sala()`, 2.3 cubre cualquier código guardado), pero la asimetría entre teléfonos tiene una explicación **de código, no de datos**:

El efecto de arranque de `App` lleva la guardia `arranqueSalas` (un `ref`) para pedir `mi_sala()` una sola vez. `App` **no se desmonta al cerrar sesión**: la Portada se pinta dentro del mismo `App`, así que el segundo login **en la misma carga de página** encuentra la guardia ya puesta y nunca pregunta `mi_sala()` → lobby. Es lo que hizo el S25. El Motorola, en cambio, volvió por una **carga nueva** (el enlace del código de correo, o la PWA relanzada) → arranque limpio → `mi_sala()` → fila de nulos → fantasma. También explica por qué «trampa cerrada» dio lobby en A1: volver a una PWA que seguía viva en memoria no es un arranque.

Es decir: **(a) `mi_sala()` devolviendo la fila de nulos**, y el S25 no la vio porque no la pidió. Las trazas de §1 (la de `App` dice qué devolvió `mi_sala()` y si había invitación) lo dejarán escrito en el teléfono. La consecuencia lateral —una segunda sesión en la misma carga no reanuda su mesa— se anota en §6.

---

## 2. Arreglo

### 2.1 `esMesa` y `mesaOpcional` en `salasApi`

`esMesa(mesa)` = objeto con `id` no nulo. Es el **único** predicado de «hay mesa» del cliente; nada vuelve a comparar contra `null` a mano. `mesaOpcional(nombre, args)` envuelve a `llamar`: sin error y sin `id` → `{ data: null, error: null }`, sea `null`, `undefined` o la fila de nulos. Lo usan **las cinco** RPC que devuelven `public.salas`: `crear_sala`, `unirse_sala`, `jugar_ya`, `resolver_sala`, `mi_sala`. `unirseSala` por código sigue convirtiendo ese `null` en `codigo_invalido`, como A1 quería; por id lo deja pasar, como ya hacía.

### 2.2 La guarda del último metro en `App`

`entrarSala(mesa)` (`useCallback`, dependencias vacías): si `!esMesa(mesa)` no cambia de pantalla. Pasan por ella el arranque, el código, la tarjeta y «Armar mesa». **También la entrada simulada:** el inicializador de `screen`, cuando un fixture pide `sala-espera` sin una mesa con `id`, se queda en `sala-opciones` con el mismo predicado. Es lo que hace posible la prueba negativa sin abrir una puerta trasera en producción.

### 2.3 Las trazas de §1

Dos `console.log`, ambos marcados **TEMPORAL A2, se retiran en la ficha de commits**: la forma cruda en `mesaOpcional` (sólo cuando llega una fila sin `id`) y, en el arranque de `App`, qué devolvió `mi_sala()` ya normalizado y si había invitación pendiente. `console.log` no cuenta para el arnés, que sólo escucha `error`, `warning` y `pageerror`.

### 2.4 Lo que no se hizo

La alternativa SQL de §2.4 (`setof` + `return;`) **no hizo falta**: 2.1 basta y cambiar la firma pediría migración y autorización. No hay SQL en A2.

---

## 3. Pruebas

### 3.1 `salasApi.test.js` (+7)

El mock imita a PostgREST, no a SQL: la fila de nulos con las once columnas. Se sella que `esMesa` sólo acepta un objeto con `id`; que por código la fila de nulos da `codigo_invalido`; que `mi_sala` con ella da `null` **y deja la traza con la forma cruda**; que un `null` de verdad también es «sin mesa» y sin traza; que una fila con `id` pasa intacta por las cinco; que por id la fila de nulos da `null` sin error; y que un `raise` de la base gana a la normalización.

### 3.2 Los fixtures ya no fabrican una API: fabrican un cliente

Hasta A1, `salasFixtures.js` construía a mano un objeto con la forma de `crearSalasApi`, así que **la capa de traducción quedaba fuera de lo que el arnés medía**. Ahora fabrica un **cliente falso con la forma del SDK** (`rpc`, `from().select().eq()`, `channel`) que devuelve lo que PostgREST devolvería, y lo pasa por `crearSalasApi`. Es la manera de que «`opciones-error` y `opciones-codigo-lleno` alimenten a `salasApi` con la fila de nulos» sin una segunda copia de nada: esos dos estados responden con `filaDeNulos()` a `unirse_sala`, y `mi_sala` sin mesa responde también con ella, porque es lo que la base hace de verdad. Los diez estados anteriores siguen verdes con la capa real por medio.

### 3.3 `espera-fantasma`, la prueba negativa

Undécimo estado: pide el stub y trae, como `mi_sala()`, la fila de nulos. El arnés exige que **nada del stub** esté en el DOM (`sentados`, `arranco`, `codigo-sala`), que la pantalla sea `SalaOpciones` (campo de código y CTA presentes, título «Jugar contra jugador») y cero `⟦`. 6/6.

---

## 4. Archivos

| Archivo | Qué |
|---|---|
| `src/lib/salasApi.js` | `esMesa` exportado, `mesaOpcional`, las cinco RPC de mesa por él, traza temporal |
| `src/lib/salasApi.test.js` | +7 pruebas |
| `src/App.jsx` | `entrarSala` con guarda (`useCallback`), los tres `onEntrarSala` y el arranque por ella, `screen` y `sala` iniciales con el mismo predicado, traza temporal del arranque |
| `src/dev/salasFixtures.js` | cliente falso con forma de SDK + `crearSalasApi`; `filaDeNulos()`; estado `espera-fantasma`; `sala` en la simulación |
| `scripts/diagSAL.mjs` | el estado y su punto negativo; once nombres |

Sin SQL. Sin CSS. `SalaEspera.jsx`, `SalaOpciones.jsx` y `ArmarMesa.jsx` sin tocar: reciben `null` donde antes recibían la fila y ya sabían qué hacer con él.

---

## 5. Verificación · §4

| Qué | Resultado |
|---|---|
| Protegidos (`git diff 12188af`) | vacío |
| `npm test` | **613 / 613** (606 → +7) |
| `npx eslint .` | **21** (20 + 1), línea base |
| `npm run build` | limpio |
| `grep` en `dist/` | sin `salasFixtures`, `simulacionSalas`, `ESTADOS_SAL`, `filaDeNulos`, `clienteDe`, `espera-fantasma`, `?sal=`; control `sal.error.sala_llena` presente |
| `diagSAL sal` | **66 / 66** · 11 estados × 6 viewports · consola limpia · cero `⟦` |
| `diagDSK lob` | **6 / 6** |
| `git status` | residuos conocidos + B1 + A1 + este informe |

---

## 6. Requiere autorización / lateral

1. **Una segunda sesión en la misma carga de página no reanuda su mesa** (§1.3). La guardia `arranqueSalas` es por instancia de `App` y no se rearma al cambiar `uid`. No se toca porque A2 «no reabre nada más», pero es un defecto real: quien cierra sesión y entra con otra cuenta sin recargar no vuelve a su mesa en espera. Arreglo probable: rearmar la guardia cuando `uid` cambie. Lo decide Victor.
2. **Las dos trazas `console.log`** son temporales por diseño (rector §1) y hay que retirarlas en la ficha de commits; quedan marcadas en el código.
3. **La forma cruda de PostgREST** se confirma por lectura y por síntoma (§1.1), no por una llamada con sesión real. La traza de §1.2 la escribirá literalmente; si dijera otra cosa, la ficha manda parar.

---

## 7. Para la memoria del proyecto

**Una RPC que devuelve un compuesto nulo llega como fila de nulos; se detecta por `id`.** `return null` en una función que `returns <tabla>` no produce JSON `null` en el cliente: PostgREST hace `select * from f()` y Postgres rellena la fila con nulos. La única salida que produce «nada» de verdad es `setof` + `return;` (→ `[]`).

---

## 8. STOP

Sin commits, sin push, sin SQL. Lo que sigue es de Victor: `npm run build` + preview + túnel, y las cuatro pruebas de §4 del rector (código falso → error rojo sin cambiar de pantalla; B, seis códigos; Motorola cerrar sesión y entrar → lobby; pendiente consumido), más `select count(*) from intentos_codigo` > 0 y la línea de traza de §1.2 leída en el navegador.

---

## Nota al pie · §6.1 autorizado (2026-09-11)

Victor autorizó el punto 1 de §6, sin tocar nada más. La guardia `arranqueSalas` deja de ser un booleano por instancia de `App` y **guarda el uid que ya arrancó**: se desarma cuando `uid` vuelve a `null` (cerrar sesión) y vuelve a arrancar con cualquier login, la misma cuenta u otra. Una sesión nueva es un arranque nuevo. StrictMode sigue cubierto porque el remontaje trae el mismo uid, y el mismo uid no arranca dos veces seguidas.

La decisión es la función pura `arranqueDeSesion(arrancado, uid)` en `salasCore.js`, para poder probar la **secuencia** sin jsdom: `salasCore.test.js` +5 recorre CARGANDO → A → remontaje → cierre → B → cierre → A otra vez, y un cambio de uid sin pasar por `null`. `App.jsx` sólo le pasa el `ref` y el `uid`; el `if (simulacion) return` va antes de la decisión, así que el arnés no rearma ni desarma nada.

Consecuencia visible que Victor debe esperar en §4: **el segundo login en la misma carga de página vuelve a preguntar `mi_sala()`** —la traza de arranque saldrá dos veces en la consola, una por sesión—. Con A2 completo, esa pregunta devuelve «sin mesa» y va al lobby, no al fantasma.

Verificación tras la nota: protegidos intactos · `npm test` **618 / 618** (+5) · lint **21** · build limpio · `dist/` sin fixtures · `diagSAL sal` **66 / 66** · `diagDSK lob` **6 / 6**. STOP sin commits.

---

## Nota al pie · Validación con la build nueva (2026-09-11, S25 + Motorola + PC con consola)

Con la guardia por `uid` (`arranqueDeSesion`, 618 pruebas) y las trazas de §1 en la build, las cuatro pruebas de §4 del rector dieron verde:

- **Forma exacta de PostgREST, leída en el PC:** `mi_sala` y `unirse_sala` devuelven la fila de nulos (`{"id":null,"codigo":null,…}`) y `mesaOpcional` la traduce a «sin mesa». La hipótesis de §1 queda confirmada por observación, además de por lectura. Las trazas se retiran en la ficha de commits.
- **Código falso** → error rojo bajo el campo, sin cambiar de pantalla, en ambos teléfonos.
- **Prueba B:** el sexto código falso en un minuto devuelve «Demasiados códigos seguidos…»; pasado el minuto vuelve «Código no encontrado o mesa ya iniciada».
- **Motorola, cerrar sesión y entrar** → lobby, sin fantasma.

La fila de `intentos_codigo` de la prueba (ii) de A3 Fase 0 y el «PC sentado por el enlace» quedaron explicados en A3: el primero era una fila anterior, el segundo la reanudación por `mi_sala()` de la misma cuenta. La invitación real se probó con cuenta distinta en A3 §5.
