# AJILEI · SAL-B1 · Ajuste A1 · Informe v1.0
## Cuatro defectos de la validación con dos teléfonos, corregidos

**Rector:** `AJILEI_SAL-B1_AjusteA1_v1.0.md`. Corrige el árbol de B1 (`AJILEI_SAL-B1_Fase1_Informe_v1.0.md`); no lo reemplaza.
**Punto de partida:** `12188af` (SAL-Ae) + el árbol de B1 sin commits + `vite.config.js` con `allowedHosts` (cambio de Victor, conservado).
**Estado:** **STOP sin commits.** Falta el `db push` de Victor y la repetición de §6 con los dos teléfonos.

---

## 0. Resumen en cinco líneas

Los cuatro defectos tienen causa confirmada y arreglo con prueba. **Una migración nueva** (`20260911043500_sal_b1_ajuste.sql`, 495 líneas, cuatro cuerpos con `create or replace` y una función interna). **606 pruebas** verdes (+9), lint **21** (la línea base exacta), build limpio, `dist/` sin fixtures, **60/60 celdas** del arnés (10 estados × 6 viewports) y `diagDSK lob` **6/6**. Protegidos intactos byte a byte.

La sorpresa de la tanda no está en los cuatro defectos sino **debajo del tercero**: `recogerDeLaUrl()` corría un fotograma DESPUÉS de la lectura que decide la pantalla inicial, así que un enlace `?sala=` abierto con sesión viva no se veía hasta el siguiente arranque. Es la pata del «código que vuelve» que la ficha no podía prever. Está en §4.

---

## 1. Causa confirmada de cada defecto

| # | Defecto | Causa | Cómo se confirmó |
|---|---|---|---|
| 1 | Mesa arrancada retiene | Tres predicados distintos: `mi_sala()` miraba `esperando`+`activa`, las guardas «ya en mesa» sólo `esperando`, y nada termina una `activa` en B1 | Lectura de `sal_a_salas.sql` §9, §10, §14 |
| 2 | Límite de 5/min nunca salta | **Sí era el rollback.** `unirse_sala` inserta en `intentos_codigo` y luego `raise`; una excepción que sale de la función de arriba deshace la RPC entera, anotación incluida. `count(*)` veía siempre 0 | Lectura del cuerpo (§10): no hay `exception` que atrape el `raise`, y Postgres no tiene transacción autónoma. La consulta `select count(*) from intentos_codigo` del rector la confirma empíricamente tras el push (§6.C de la migración) |
| 3 | Código pendiente se reintenta en cada entrada | Dos patas: (a) `borrar()` estaba condicionado al camino y el fallo no lo alcanzaba; (b) `recogerDeLaUrl()` corría en un efecto, DESPUÉS del inicializador que leía la invitación → la invitación de este arranque se guardaba tarde y aparecía en el siguiente, ya sin enlace que la explicara | Lectura de `App.jsx` (B1) y una sonda de un solo uso con el bypass, que reprodujo la secuencia y verificó el arreglo (§4.4) |
| 4 | La `L` se esconde en el Motorola | El `<input>` medía `6.2ch` y cuatro mayúsculas con 0,28em de tracking miden más que eso en casi cualquier fuente. Con contenido más ancho que la caja, el campo se desplaza hacia el cursor **al recibir el foco**, que es justo lo que §3.2 hace tras el error. El S25 no lo mostraba por tener una fuente de sistema más estrecha | El arnés, con el estado nuevo, lo midió: sin el arreglo, `scrollLeft > 0` y el primer glifo por debajo del borde del prefijo |

---

## 2. Defecto 1 · Mesa `activa` sin partida = mesa muerta

### 2.1 En la base

**`sala_esperando_de(p_uid) → uuid`**, función interna nueva (revocada a `public`, `anon` y `authenticated`, como `barrer_salas`). Es el predicado único de §2.3: `crear_sala`, `unirse_sala` y `mi_sala` preguntan aquí. Devuelve uuid y no booleano porque `mi_sala` necesita la fila y las guardas sólo el hecho; una función sirve a los dos.

**`mi_sala()`** devuelve sólo `esperando` (§2.1), vía el predicado. **`barrer_salas()`** gana una segunda rama, marcada `-- provisional hasta MES-PvP`: cancela las `activa` con `estado_partida is null` y más de **10 minutos** desde `coalesce(iniciada_en, expira_en)`. La cifra es `ACTIVA_SIN_PARTIDA_MIN = 10` en `src/config/salas.js`, copiada al SQL con comentario cruzado —el mismo trato que `DURACION_SALA_SEG`—.

**Un predicado que la ficha no pedía y se añadió:** `estado_partida is null`. Es la definición honesta de «sin partida»; el día que MES-PvP escriba ahí el motor, la rama deja de tocar esas filas sola (aunque lo correcto será retirarla). Sin él, la rama cancelaría también las partidas reales de MES-PvP el día que existan y nadie recordara este barrido. Se declara en §9.

**`crear_sala`** se reemplaza entero porque `create or replace` no admite parches, pero **cambia una sola línea**: el `exists (...)` a mano por `sala_esperando_de(v_uid) is not null`.

### 2.2 En el cliente

`App.jsx` implementa la precedencia de §2.5 tal como se enunció: **(1)** `mi_sala()` primero; si hay mesa `esperando`, stub y el código pendiente se descarta sin intentarse; **(2)** si no, y hay código, un solo intento en `SalaOpciones`; **(3)** si no, lobby. El «Volver al inicio» del stub (§2.4) va al lobby y llama a `borrar()` + olvida la invitación en memoria.

**Lo que esto cambia respecto a B1:** B1 tenía la precedencia al revés (invitación primero) y el intento se disparaba en el montaje de `SalaOpciones`, ANTES de saber si el jugador ya estaba sentado. Ahora `SalaOpciones` recibe `intentar` (antes `intentarAlMontar`), que `App` enciende sólo cuando la base ya contestó que no hay mesa.

---

## 3. Defecto 2 · El mecanismo elegido para que el intento persista

### 3.1 Las dos opciones de la ficha, y por qué la segunda no funciona como está escrita

La ficha ofrecía dos caminos. El segundo —«la resolución del código se separa en una función que anota y devuelve `null` sin lanzar, y `unirse_sala` lanza solo cuando el límite ya está superado»— **no basta por sí solo**: una función auxiliar en PL/pgSQL vive en la misma transacción que quien la llama, así que si `unirse_sala` lanza después (por `sala_no_disponible`, por ejemplo), la anotación de la auxiliar se deshace igual. Lo único que preserva un `insert` en Postgres es que la llamada de arriba **termine normalmente**. `dblink` simularía una transacción autónoma a costa de una conexión por intento, y es una pieza nueva que la ficha no autoriza.

### 3.2 Lo que se hizo

**`unirse_sala` por código devuelve `NULL`** —el mismo `NULL` que `mi_sala` ya devuelve cuando no hay mesa— en los dos casos que el texto de la lámina ya nombraba juntos: **código no encontrado** y **mesa ya iniciada** (o vencida, o cancelada), salvo para quien ya está sentado, que la recupera como siempre. La firma no cambia: sigue devolviendo `public.salas`. La anotación queda ANTES de contar y de buscar, como en SAL-A, y se confirma con la transacción.

**`salasApi.unirseSala`** traduce ese `NULL` —sólo cuando se llamó con `codigo`— a `codigo_invalido`, la clave cuyo texto es «Código no encontrado o mesa ya iniciada». Por id (`p_sala`, el «Unirme» de una tarjeta) la base sigue lanzando `sala_no_disponible` y el `NULL` no se disfraza: ahí no hay intento que persistir.

**Lo que no cambia:** `demasiados_intentos` sigue siendo un `raise` (deshace SU anotación, pero el límite ya se cumplió con las cinco que quedaron); un código MAL FORMADO sigue lanzando `codigo_invalido` sin anotar; ventana y tope siguen siendo 5 por minuto por usuario; la anotación y la comprobación viven juntas en la función que resuelve el código, así que no hay RPC que las sortee.

### 3.3 Un efecto lateral que conviene saber

Antes, un código que **existió pero murió** devolvía `sala_no_disponible` («Esa mesa ya no está…») y uno **inexistente** también, pero por caminos distintos y con un `raise` que además no persistía. Ahora los dos devuelven lo mismo por el mismo camino. Quien sondea códigos ya no puede distinguir «existió» de «nunca existió». Es mejor, y se declara en §9 porque cambia el texto que el jugador lee en ese caso.

### 3.4 Pruebas

`salasApi.test.js` +4: el `NULL` por código → `codigo_invalido`; el `NULL` por id se deja pasar; una sala devuelta no se toca; un `raise` de la base conserva su clave. El servidor se prueba en §6.B con teléfono y en el Grupo B de la migración (seis filas OK). Ningún script de un solo uso queda en el repo.

---

## 4. Defecto 3 · Consumir antes de intentar, y la pata que la ficha no veía

### 4.1 `consumir()` en `salaPendiente.js`

Lee y borra en el mismo gesto. `leer()` sigue existiendo para **mirar** —decidir la pantalla inicial sin gastar la invitación—; `consumir()` es para quien va a actuar. La basura también se consume. **+5 pruebas**, la primera literalmente la de §4.4: «devuelve el código una vez y `null` la segunda».

### 4.2 Dónde se consume

En el efecto de arranque de `App`, **antes** de llamar a `mi_sala()` y por tanto antes de cualquier intento (§4.1). Pase lo que pase con la red, el almacenamiento ya no lo tiene. A partir de ahí el código sólo existe en el estado `invitacion` de `App`, que muere al salir de `SalaOpciones` por cualquiera de sus tres puertas (`olvidarInvitacion`): la siguiente entrada por navegación normal nace con el campo vacío y sin intento (§4.2 y §4.3).

### 4.3 La pata escondida: `recogerDeLaUrl()` corría tarde

SAL-A la llamaba en un `useEffect`. El inicializador de `useState` que lee la invitación corre en el **primer render**, y los efectos corren **después** del primer pintado. Con un enlace `?sala=` y sesión viva, la secuencia era: leer (nada) → decidir lobby → guardar el código → … y el código aparecía en el **siguiente** arranque, ya sin enlace, como un intento que el jugador no provocó. Con registro de por medio (Portada, correo, bautizo: varios arranques) el defecto no se notaba, y por eso B1 lo dio por bueno.

**Arreglo:** `recogerDeLaUrl()` se llama dentro del inicializador de `invitacion`, antes de `leer()`. Es idempotente bajo StrictMode (la segunda invocación ya no encuentra el parámetro y cae a `leer()`, que devuelve lo mismo). El efecto de SAL-A desaparece; su comentario se conserva actualizado. Es un efecto secundario en un inicializador —`replaceState` + `setItem`— y se declara en §9.

### 4.4 La bandera `vivo` que tiraba respuestas

Dos efectos llevaban el molde `let vivo = true … return () => { vivo = false }`, y los dos lo pagaban:

- **El de arranque en `App`**, bajo StrictMode con el bypass (uid disponible en el primer montaje): el desmontaje simulado ponía `vivo` a falso y la respuesta de `mi_sala()` —la única que se recibiría, porque la guardia impide pedirla otra vez— se tiraba. `App` no se desmonta nunca; la bandera se quitó.
- **El del intento en `SalaOpciones`**: `onEntrarSala` es una función nueva en cada render de `App`, así que cualquier re-render con la RPC en vuelo —el propio `intentar` encendiéndose— cambiaba las dependencias, corría la limpieza y la respuesta se perdía. Se sustituyó por un `ref` `montado` que sólo cambia al desmontar de verdad (y vuelve a `true` en el remontaje de StrictMode).

### 4.5 La sonda

Un script de un solo uso, fuera del repo, recorrió el camino real con el bypass: `?sala=aj7k2m` → barra limpia, almacén vacío antes del intento, `mi_sala` llamada **antes** que `unirse_sala` (la consola lo ordena), error bajo el campo con `7K2M` y el foco; volver al lobby y entrar de nuevo → campo vacío, sin error; recarga → lobby. Los 401 de la consola son los esperados del uid ficticio contra la base real.

---

## 5. Defecto 4 · El campo reserva sus cuatro glifos

### 5.1 CSS

`.sal-campo input` pasa de `width: 6.2ch` a:

```css
--tracking: 0.28em;
flex: 1 1 auto;
width: auto;
min-width: calc(4 * (1em + var(--tracking)));
letter-spacing: var(--tracking);
```

`ch` es el avance del «0» y no dice nada de las mayúsculas; `1em + tracking` por hueco es el techo de una mayúscula latina en cualquier fuente de sistema, así que el mínimo reserva los cuatro enteros en cualquier fuente y viewport. Sin `!important`, sin píxeles, y con la única cifra (`4`) copiada de `LARGO_CODIGO` porque CSS no puede importarla.

### 5.2 Por qué además `flex: 1`, y no sólo el mínimo

La primera versión era el mínimo a secas (`width: calc(4 * (1em + tracking))`), y el arnés dijo 59/60: a **360×640 con `MWMW`** —las cuatro letras más anchas— el contenido caía a un píxel de la caja y el cuantizado del ancho del `<input>` decidía si desplazaba 1px o no. La `L` seguía visible (el primer glifo quedaba 6 px a la derecha del prefijo), pero el criterio del arnés es `scrollLeft = 0`, y con razón: un desplazamiento que depende de la fracción de píxel en que cae la caja es un fallo que aparece en un teléfono y no en otro, que es exactamente la historia de este defecto.

El campo mide **40u** por la lámina, y tras relleno, `AJ-` y hueco quedaban ~24,5u frente a las ~22,5u del mínimo: espacio muerto a la derecha del `<input>`. Se le cede entero. La holgura es **derivada del campo**, no una cifra: si la lámina ensancha el campo, el `<input>` crece con él; si lo estrecha por debajo del mínimo, manda el mínimo y el arnés lo ve (`cabe`). Se declara en §9 porque la ficha decía «el ancho exacto».

### 5.3 El estado nuevo del arnés

`opciones-codigo-lleno` llega lleno **por el camino real**: el fixture trae `codigo: 'AJ-LHQH'`, `App` enciende `intentar` como si viniera de un enlace, el intento falla con `codigo_invalido`, el error se pinta y el foco vuelve al campo — la secuencia exacta del Motorola. La medida explícita de la ficha, y dos más:

- **primer glifo ≥ borde interior del campo + ancho del prefijo**, calculado como `input.left + padding − scrollLeft` contra `pre.right` (la caja de un `<input>` no se lee glifo a glifo, su desplazamiento sí);
- `scrollLeft = 0` y `scrollWidth ≤ clientWidth`;
- el `<input>` entero cabe dentro del campo (`cabe`), porque un ancho reservado que no cupiera sería el fallo contrario.

Se mide **dos veces por celda**: precargado (`LHQH`, con error y foco) y **tecleado a mano** con `MWMW` tras desenfocar y reenfocar, que es lo que dispara el desplazamiento. Resultado: 6/6, `scrollLeft = 0` en las doce medidas, primer glifo entre 7,4 y 11 px a la derecha del prefijo según viewport. Los 9 estados anteriores siguen 54/54 y `sal.0` sigue comparando las dos listas (ahora de diez).

---

## 6. La migración · `20260911043500_sal_b1_ajuste.sql`

| Sección | Qué | Cómo |
|---|---|---|
| 1 | `sala_esperando_de(uuid)` | nueva, interna, `security definer`, `search_path = ''`, revocada a todos |
| 2 | `barrer_salas()` | cuerpo de SAL-A + rama `activa` sin partida > 10 min, `-- provisional hasta MES-PvP` |
| 3 | `crear_sala` | cuerpo íntegro, una línea cambiada (predicado común) |
| 4 | `unirse_sala` | por código: `NULL` en no encontrado / no viva; por id: como estaba; predicado común en «ya en mesa» |
| 5 | `mi_sala()` | sólo `esperando`, vía el predicado |

Ninguna cambia de nombre ni de firma; `create or replace` conserva los grants de SAL-A §15 (lo comprueba el Grupo A). Sin `alter table`, sin tocar políticas ni publicación.

**Verificación entregada, de solo lectura (Grupo A):** que los cinco cuerpos existen, que tres usan el predicado y dos llevan la marca provisional; que `sala_esperando_de` no es invocable por `anon` ni `authenticated`; que los grants sobrevivieron. **Grupo B** (dos usuarios fabricados, se limpia solo, seis filas OK): código inexistente → `NULL`; intento persistido = 1; el sexto → `demasiados_intentos`; `mi_sala` ignora la `activa`; el barrido cancela la `activa` vieja; el jugador liberado crea otra a la primera. **Grupo C:** la consulta del rector sobre `intentos_codigo` tras un fallo desde el teléfono.

---

## 7. Archivos

| Archivo | Δ | Qué |
|---|---|---|
| `supabase/migrations/20260911043500_sal_b1_ajuste.sql` | **nuevo**, 495 | §6 |
| `src/config/salas.js` | +19 | `ACTIVA_SIN_PARTIDA_MIN = 10` |
| `src/config/salaPendiente.js` | +29 | `consumir()` |
| `src/config/salaPendiente.test.js` | +42 | 5 pruebas |
| `src/lib/salasApi.js` | +20 | `unirseSala` traduce el `NULL` por código |
| `src/lib/salasApi.test.js` | +34 | 4 pruebas |
| `src/App.jsx` | ~+60/−30 | precedencia §2.5, consumo antes del intento, `recogerDeLaUrl` en el inicializador, `olvidarInvitacion`, descarte en §2.4 |
| `src/screens/SalaOpciones.jsx` | ~+20/−6 | prop `intentar`, efecto sin `vivo`, `ref` `montado` |
| `src/dev/salasFixtures.js` | +14 | estado `opciones-codigo-lleno` y `codigo` en la simulación |
| `scripts/diagSAL.mjs` | +58 | el estado y su medida doble |
| `src/styles/salas.css` | +30/−3 | el campo (aditivo; ningún selector reescrito) |
| `vite.config.js` | +3 | `allowedHosts` de Victor, conservado |

`SalaEspera.jsx`, `ArmarMesa.jsx`, `textos.es.js`, `salasCore.js` no se tocaron: la clave `sal.error.codigo_invalido` ya decía lo que hacía falta.

---

## 8. Verificación · §6.1

| Qué | Resultado |
|---|---|
| `git diff 12188af` sobre los cinco protegidos | **vacío**, al inicio y al final |
| `npm test` | **606 / 606** en 24 archivos (597 → +9: 5 de §4, 4 de §3) |
| `npm run build` | limpio |
| `npx eslint .` | **21** (20 + 1), la línea base exacta |
| `grep` en `dist/` | sin `salasFixtures`, `simulacionSalas`, `ESTADOS_SAL`, `?sal=` ni los nombres de estado; control `sal.error.sala_llena` presente |
| `diagSAL sal` | **60/60** · 10 estados × 6 viewports · consola limpia · cero `⟦` |
| `diagDSK lob` | **6/6** |
| `git status` | residuos conocidos + archivos de B1 + la migración + `vite.config.js` |

El arnés corrió contra el servidor de desarrollo con `VITE_AUTH_BYPASS`, por la razón que el informe de B1 §7 dejó escrita.

**Hallazgo lateral, no de esta tanda:** el lobby emite en consola el aviso de React «Received an empty string for a boolean attribute `inert`». Vive en `Lobby.jsx` desde antes de A1 y `diagDSK lob` no lo cuenta como fallo. Se anota para quien abra ese archivo.

---

## 9. Requiere autorización / desviaciones declaradas

1. **`estado_partida is null` en la rama provisional del barrido.** La ficha §2.2 no lo pedía. Sin él, el día que MES-PvP exista y alguien olvide retirar la rama, el barrido cancelaría partidas reales a los diez minutos. Con él, la rama sólo alcanza mesas sin partida, que es literalmente lo que la regla provisional dice.
2. **El texto de un código inexistente cambia.** Antes «Esa mesa ya no está…» (`sala_no_disponible`); ahora «Código no encontrado o mesa ya iniciada» (`codigo_invalido`), que es lo que la ficha §3 manda y lo que el texto de la lámina siempre describió. Es más exacto, y además deja de distinguir «existió» de «nunca existió» ante quien sondea.
3. **`recogerDeLaUrl()` en un inicializador de `useState`.** Un efecto secundario (`replaceState`, `setItem`) durante el primer render, idempotente bajo StrictMode. La alternativa —mantener el efecto— es la que producía la pata escondida del defecto 3.
4. **`flex: 1` además del mínimo en el `<input>`.** La ficha decía «el ancho exacto de cuatro glifos con su tracking»; se reserva ese ancho como mínimo y se cede el resto del campo. La razón medida está en §5.2.
5. **Dos banderas `vivo` retiradas** (§4.4). No son de la ficha; son dos maneras de perder la única respuesta que se iba a recibir, y una de ellas hacía invisible el arreglo del defecto 3 en desarrollo.
6. **`crear_sala` reemplazado entero para cambiar una línea.** Lo exige `create or replace`; se dice para que nadie busque una diferencia mayor.

---

## 10. STOP

Sin commits y sin push. Lo que sigue es de Victor, en este orden:

1. `npx supabase db push` con la migración nueva, y el Grupo A + B de su bloque de verificación en el SQL Editor.
2. Las cuatro pruebas de §6 del rector con los dos teléfonos y el túnel: **B otra vez** (el sexto dice «Demasiados códigos seguidos…»), **trampa cerrada** (dos en una mesa de 2, arranca, «Volver al inicio», reabrir → lobby, crear una nueva a la primera), **pendiente consumido** (enlace de una mesa muerta → un solo error, y al volver el campo vacío), **`L` visible** en el Motorola, tecleado y precargado.
3. El Grupo C tras un fallo desde el teléfono: `intentos_codigo` con una fila por intento.

Sólo después del visto bueno se autoriza la ficha de commits.
