# AJILEI · MES-PvP · Sub-tanda 7a (el segundo reparto, el reloj de la sala y lo pequeño) · Informe · v1.0

- **Ficha:** `AJILEI_MES-PvP_Sub7a_v1.0.md` (rector, 2026-11-13), sin lámina.
- **Base:** `main` = `origin/main` = `3455468`.
- **Recorrido:** tramo A (construcción, STOP-A aprobado) → tramo C (commits). Siguen el tramo V (el control de las IAS) y el paso a la nube de Victor (migración, túnel y push).
- **Norma:** el informe de la Fase 0 de la sub-tanda 7 (`AJILEI_MES-PvP_Sub7_Fase0_Informe_v1.0.md`, que entra en el commit de documentos) y las decisiones P-1 a P-5 del STOP-0.

---

## Resumen

- **El segundo reparto entre personas** vuelve a salir una carta tras otra, de jugador en jugador. Lo arregla una línea de `GameTable.jsx`. **Contra las IAS no cambia nada.**
- **La sala privada dura 5:00 y la pública 3:00.** Lo decide la base: hay una migración y no hay que desplegar la función.
- **Cerrar sesión con una mesa en espera** te saca de ella. Si eres el anfitrión, la mesa se cancela para todos.
- Además:
  - la silla propia dice siempre «Tú»;
  - la fila «Tapetes» del ⚙ está apagada dentro de la sala, con el aviso «Disponible fuera de la mesa»;
  - el texto de la partida muerta lleva punto final.
- **Un rojo conocido, que no es de la 7a:** 18 celdas de `diagSAL`. Llevan así desde `342dbc7` y las rehace la 7b (§2.3).

---

## 1 · Lo hecho

### 1.1 · F · El segundo reparto (P-1)

`src/components/GameTable.jsx:850`: al salir de la fase de reparto, `setDealStep(0)` junto a `setFlyingCards([])`. El comentario está en `:846-849`.

**La causa.** Entre personas, el paso del reparto se quedaba en `2·n` al acabar `DEAL_2`, porque con `partida` la mesa no pasa por `advanceFromDeal`. En el `DEAL_3` de la mano siguiente, el primer render salía con ese paso viejo. `DEAL_3` no tiene barajado que lo tape, así que enseñaba de golpe las cartas de los pasos ya «repartidos» y luego las quitaba (§2.2).

**Con `partida` nula, todo sigue como hoy:**
- Contra las IAS, cada salida del reparto pasa por `:871` (`DEAL_3`) o por `:878` (`DEAL_2`). Las dos ponen `dealStep` a 0 en el mismo lote que `advanceFromDeal`.
- Cuando el efecto ve `!isDealPhase`, el valor ya es 0. React descarta el `setDealStep(0)` sin volver a pintar.
- Fuera del reparto nadie lee `dealStep`: `:1974` devuelve 5, y `:883` solo corre dentro del reparto.
- Al entrar en cada reparto, `:891` lo vuelve a poner a 0.

### 1.2 · B.1 · El reloj de la sala

- **Base:** la migración `20261113150000_mespvp_sub7a_duracion_sala.sql` (§3).
- **Cliente:** `DURACION_SALA_SEG` se sustituye por `duracionSala(tipo)` (`src/config/salas.js:142-147`): `privada` → 300 y `abierta` → 180. Si llega un tipo desconocido, se usa el de la abierta.
  - Es solo un espejo. El cronómetro sigue contando desde el `expira_en` del servidor, y `duracionSala` solo la leen las pruebas.
  - **La prueba de espejo** (`salas.test.js`) lee la última `duracion_sala` de `supabase/migrations/` y exige las mismas cifras.
- **La mesa llena no cambia:** `LLENA_SEG = 10`, y en SQL `least(expira_en, now() + 10 s)`.
- **Comentarios al día:** `relojCore.js`, `useCronometroSala.js` y `salas.js` hablan ya de 5:00 y 3:00. Las pruebas de `relojCore`, `useCronometroSala` y `salaEsperaCore` usan `duracionSala('abierta')`.
- **Contrato de MOT-1:** la fila pendiente del reloj de la sala (`docs/AJILEI_MOT-1_Contrato_v1.0.md:615`) queda marcada como hecha en la 7a. Ningún otro normativo de `docs/` fijaba los 3:00.

### 1.3 · B.3 · Cerrar sesión desde la sala (P-5)

- `salirDeSalaEnEspera(api)` (`src/lib/salasApi.js:365-376`) hace tres cosas:
  1. pide `mi_sala()`;
  2. si la mesa está en `esperando`, llama a `salir_sala()`;
  3. corre contra un tope de 2 s (`TOPE_SALIDA_MS`).
- Devuelve `salio`, `sin-sala`, `error` o `tope`, y **no lanza nunca**.
- `cerrarSesion` (`src/App.jsx:309`) la espera antes de borrar el saldo recordado y antes del `signOut`. Si falla o vence el tope, la salida sigue igual, con el mismo criterio que `salirDeVerdad`.
- Si es el anfitrión, `salir_sala` cancela la mesa para todos, sin confirmación, igual que su «Salir».
- **Pruebas** (`salasApi.test.js`, 5 pruebas):
  - el tope es de 2 s;
  - con la mesa esperando, como invitado y como anfitrión, se levanta; si cancela, lo decide el servidor;
  - sin mesa, con la fila de nulos o con la partida ya en marcha, no llama a `salir_sala`;
  - si falla `mi_sala`, o `salir_sala` da error o lanza, la salida no se bloquea;
  - si el servidor no contesta, sigue a los 2 s.

### 1.4 · B.2 · «Tú» (P-4)

`rotuloSilla(silla)` (`src/screens/salaEsperaCore.js:67`) mira primero `esTu` y después `esAnfitrion`. Se usa en `SalaEspera.jsx:629`. Su prueba cubre la silla propia del anfitrión («Tú»), el anfitrión ajeno («Anfitrión») y la silla de un invitado ajeno (sin rótulo).

### 1.5 · D · La fila «Tapetes» dentro de la sala (INV-76)

- `filaTapetes(cuenta)` (`src/hooks/tiendaCore.js:38`) decide la fila:
  - **apagada**, con el aviso `tie.cfg.fuera`, si la pantalla pasa `tapetesApagados`;
  - **viva**, si hay puerta a la tienda;
  - **«Pronto»**, como antes, si no hay puerta.
- `HojaContenido.jsx:104` y `:189-190` la usan: `aria-disabled` y el toast en vez de abrir la tienda.
- La fila no se oculta ni se mueve. La hoja mide lo mismo que en el lobby (O1).
- `SalaEspera.jsx:710` es la única pantalla que pasa `tapetesApagados: true`.
- Texto nuevo: `'tie.cfg.fuera': 'Disponible fuera de la mesa'` (`textos.es.js:714`).
- CSS aditivo (`hojaConfiguracion.css:132-133`): la fila se atenúa con `opacity: 0.4` y `cursor: default`, sin cambiar de tamaño.
- **Pruebas** (`scripts/testTapetes.test.js` §10):
  - la decisión de la fila y su texto;
  - que solo `SalaEspera.jsx` la apaga, recorriendo `src/`.
- **INV-76**, en el registro de invariantes: el límite declarado incluye ya la sala de espera. Su fuente es `src/hooks/tiendaCore.js` y su vigilante, `testTapetes` §10. Lleva su línea en «Actualizado».

### 1.6 · E.4 · El punto final

`src/config/textos.pvp.es.js:27`: «La mesa se cerró por inactividad. Tu pila volvió a tu saldo.»

### 1.7 · El andamio

- **El mando `retira=<k>`** del árbitro imitado (`src/dev/partidaImitada.js`, `leerMandoPvP`): el asiento `k` se retira en su turno de `BET_1`. Hace falta para la mesa de 3 con un retirado. Fuera de ese turno, juega como siempre.
- **`scripts/diagSAL.mjs`**, dos fallos del andamio, arreglados y contados (regla andamio frente a commit):
  - Con P-4, los estados que mira el anfitrión esperan ahora «Tú» en la silla 0.
  - `espera-fin-activa` tiraba el arnés (código 2). Desde MES-PvP 3 §3.3, una sala que arranca entra sola en la partida. La celda comprueba ahora eso: espera `.game-table-screen` antes de buscar `main.sal`.

### 1.8 · Una corrección a mi informe de la Fase 0

La `crear_sala` vigente no es la de `mot1_esquema`: es la de `mot1_dinero.sql:591`. Y la restitución de `salir_sala` está en `levantarse_de_sala`. La migración redefine esas dos.

---

## 2 · Las varas

### 2.1 · Las corridas sobre el árbol del STOP-A

| Corrida | Resultado |
|---|---|
| eslint | 0 errores y 0 avisos, igual a la firma |
| vitest | 2.963 de 2.963 (9 pruebas nuevas) |
| build, `npm run guiones` | 0 |
| `pvp.mesa` | **Verde**, 7 min 30 s (tope 10): 20/20 celdas, 62/62 escenas, 7/7 varas |
| `pvp.lm` | **Verde**, 7 min 48 s: 91/91 |
| `congelado`, `rev` (humo de las IAS) | Verdes, 1 min 48 s y 3 min 52 s. El control completo va en el tramo V |
| `diagSAL` | 84/102. Todos los estados de la sala de espera, en verde. Las 18 rojas, en §2.3 |
| `1.8b` | **177,1 → 177,2 KiB** (meta 185, techo 200). La cifra de antes es la de `3455468` en el STOP-V de la 5b |

### 2.2 · La vara nueva, `7a·segundo-reparto`

Está en `scripts/pvp/sub7aMesa.mjs`, dentro de `pvp.mesa`. Corre contra 5173 con `?pvp=reponer&ver=vivo`: el árbitro imitado juega manos seguidas. Mide el primer `DEAL_3` que llega después de un `DEAL_2` en vivo en la misma mesa.

| Caso | Viewport | Resultado |
|---|---|---|
| Mesa de 2, Normal | 412×915 | Verde |
| Mesa de 2, Rápido | 1366×768 | Verde |
| Mesa de 3 con un retirado (`retira=1`), Normal | 1366×768 | Verde |
| Mesa de 3 con un retirado, Rápido | 412×915 | Verde |

**En cada caso se comprueba que:**
- como mucho hay un vuelo `fly-DEAL_3-*` en el aire;
- los pasos salen en el orden de `buildDealSeq`: 0, 1, …, 3·vivos − 1, cada uno una vez;
- el primer estado de `DEAL_3` no enseña ninguna carta que no hubiera en el último de `BET_1` (`deGolpe` = 0).

**El control rojo:** `GameTable.jsx` servido sin la línea con `page.route`, que es el cliente de hoy en ajilei.io. Se corre en la mesa de 2 y en la de 3 con un retirado, en Normal. **Salen rojos los dos, 4 de 4 veces seguidas.**

**El síntoma de hoy, de los dos de la F.4, es el destello.** El primer estado de `DEAL_3` enseña de golpe las cartas de los pasos viejos:
- en la mesa de 2, 4 cartas: dos para cada jugador;
- en la mesa de 3 con un retirado, 6 cartas: el segundo reparto entero.

En el Chromium del arnés se ven entre 5 y 11 ms; después se quitan y el reparto sigue bien, uno a uno y en orden. **La doble cadena de vuelos no salió en ninguna corrida.**

**Por qué la vara muestrea dos veces.** Toma una muestra en cada cuadro (`requestAnimationFrame`) y otra en cada cambio del DOM (`MutationObserver`). Muestreando solo los cuadros, el render viejo a veces se corregía antes de pintarse, y el control falló una vez de cuatro. Con las mutaciones se ve siempre. En un teléfono lento, ese render sí llega a la pantalla. Las pruebas 1 y 2 del túnel dirán si es exactamente lo que vio Victor.

### 2.3 · Rojo conocido: 18 celdas de `diagSAL`

| Estado | Viewports | Qué espera la celda |
|---|---|---|
| `opciones-fuera-alcance` | los 6 | «Te faltan…» y los chips apagados calculados con la regla de 5× |
| `armar` | los 6 | Los chips apagados con la regla de 5× |
| `armar-aviso` | los 6 | El aviso de nuevos con la regla de 5× |

- **Causa:** la entrada pasó de 5× a 15× la apuesta en `342dbc7` (MOT-1 1d-ii, 2026-11-04). `diagSAL` no se tocó desde antes, así que sus cifras esperadas son las de 5×. La pantalla está bien; la celda es la que se quedó vieja.
- **SHA de origen:** `342dbc7`. Las 18 están rojas también en `3455468`, antes de la 7a.
- **Decisión (STOP-A aprobado):** no se arreglan en la 7a. Las tres pantallas las rehace la 7b (Armar mesa y `SalaOpciones`), y las celdas se rehacen con ellas.

---

## 3 · La migración

**`supabase/migrations/20261113150000_mespvp_sub7a_duracion_sala.sql`**, sin aplicar: el `db push` lo hace Victor.

| Pieza | Qué hace |
|---|---|
| `public.duracion_sala(p_tipo sala_tipo) returns interval` | `privada` → 5 minutos y `abierta` → 3 minutos. Es SQL inmutable, con `search_path` vacío |
| Permisos | `revoke execute … from public, anon, authenticated`: solo la llaman las funciones de la base. Supabase da `execute` por defecto en toda función nueva, y lo que cuenta es el `revoke` |
| `crear_sala` | Es el cuerpo vigente de `mot1_dinero.sql:591`, con la misma firma. Los dos `insert` escriben `expira_en = now() + duracion_sala(p_tipo)` |
| `levantarse_de_sala` | La restitución pasa a `greatest(expira_en, creada_en + duracion_sala(v_sala.tipo))` |
| El defecto de la columna | Sigue en 3 minutos, de respaldo |

**Los grupos van comentados dentro de la migración y salen verdes en PGlite**, con el andamio de `npm run guiones`:

- **Grupo A, 4/4 PASA:**
  - A1, los valores y la definición;
  - A2, sin `execute` para `anon` ni para `authenticated` (mira los dos);
  - A3, `crear_sala` y `levantarse_de_sala` usan `duracion_sala` y ya no dicen «3 minutes»;
  - A4, los permisos de siempre en las dos funciones.
  - Controles: sin la migración, el grupo revienta; sin el `revoke`, A2 sale FALLA (`anon=t · aut=t`).
- **Grupo B, 5/5 PASA:**
  - B1, la privada nace con 5:00;
  - B2, la abierta nace con 3:00;
  - B3, la mesa llena baja a 10 s en las dos;
  - B4 y B5, el invitado que sale devuelve el reloj a `creada_en + 5` o `+ 3` minutos, y recupera su entrada.
  - Control: sin la migración fallan B1 y B4.
  - **No deja rastro:** todo se deshace con `sub7a_deshacer`. La abierta del grupo es una Llena de 50, que el cliente no arma, para no unirse en la base real a una mesa de verdad que esté esperando.

`npm run guiones` aplica todas las migraciones, la de la 7a incluida, y sigue en verde.

---

## 4 · La ventana: lo que se ve en ajilei.io

El orden de la ficha es migración → túnel → push. **La ventana va del `db push` al push:** ajilei.io sigue sirviendo el cliente de `3455468`, frente a la base nueva.

- **El reloj:**
  - las salas privadas nacen con 5:00 y el cliente viejo las pinta con 5:00, porque cuenta desde el `expira_en` del servidor (`useCronometroSala.js`), y `DURACION_SALA_SEG` solo la leían las pruebas;
  - las públicas, 3:00, como hoy;
  - si un invitado sale, el reloj vuelve a la duración de su tipo y el cliente lo pinta;
  - la mesa llena, 10 s, como hoy.
- **Lo que llega con el push, y en la ventana sigue como hoy:**
  - el destello del segundo reparto entre personas;
  - «Anfitrión» en la silla propia del anfitrión;
  - la fila «Tapetes» abre la tienda desde la sala, con el riesgo de INV-76: si la mesa arranca, juega ausente;
  - el texto de la partida muerta sin punto final.
- **Cerrar sesión desde la sala** sigue sin sacar de la mesa. En una privada, la silla vacía puede durar ahora hasta 5:00 en vez de 3:00. Con 2 o más sentados, `barrer_salas` arranca con él dentro y juega ausente, igual que hoy.
- **No se rompe nada:** `crear_sala` conserva su firma, `levantarse_de_sala` es interna, la vista no cambia y no se despliega la función `partida`.
- **Si el orden fuera el contrario** (el cliente antes que la base), tampoco se rompería nada: el cliente nuevo no lee la duración, y `salirDeSalaEnEspera` usa `mi_sala` y `salir_sala`, que ya existen. Solo faltaría el 5:00.

El túnel (servidor de desarrollo sin bypass) usa el cliente nuevo contra la base nueva: es el estado final.

---

## 5 · Commits

**Cómo se hicieron:**
- La huella del árbol probado (29 archivos, sha256 de cada uno) se guardó antes del primer `git add`.
- Cada commit va por ruta explícita y pasó su `npm run aislado -- <sha> --perfil=commit` antes del siguiente.
- Un archivo entra en versión intermedia: `scripts/testTapetes.test.js`.
  - En (b) lleva la prueba de `filaTapetes` y su texto.
  - En (c), la de que solo `SalaEspera` apaga la fila, que necesita la pantalla.

| | SHA | Título | Aislado |
|---|---|---|---|
| a | `8a1f774` | MES-PvP 7a-a · la base: cuánto vive una sala (duracion_sala) | verde, 817 s (vitest 2.954) |
| b | `b843077` | MES-PvP 7a-b · el núcleo: duracionSala, rotuloSilla, filaTapetes y salirDeSalaEnEspera | verde, 843 s (vitest 2.962) |
| c | `9d0eb60` | MES-PvP 7a-c · el cliente: el segundo reparto, la sala, cerrar sesión y la hoja | verde, 845 s (vitest 2.963) |
| d | `7360eac` | MES-PvP 7a-d · el arnés: la vara 7a·segundo-reparto y diagSAL al día | verde, 834 s (vitest 2.963) |
| e | (este) | MES-PvP 7a-e · documentos: INV-76, el Contrato y los informes | en el STOP-C |

Las sondas `laminas/lm1/`, `lm2/` y `lm3/` siguen sin seguimiento.

---

## 6 · Lo que hereda la 7b

**La 7b no cierra sin `diagSAL` 102/102.** Tiene que rehacer las 18 celdas de §2.3 (`opciones-fuera-alcance`, `armar` y `armar-aviso`, rojas desde `342dbc7` por la regla de 5× frente a 15×) junto con las pantallas que las causan.

**Las piezas de la 7b, con lámina:**
- **Armar mesa:**
  - la fila Ritmo, visible y apagada cuando el CTA dice «Unirme» (P-2);
  - la apuesta de 50;
  - la fila Entrada (Corta / Llena) (P-3).
  - Al llegar el control de ritmo, la puerta `?ritmo=rapido` de `salasApi.crearSala`, que hoy solo existe en desarrollo, sobra. Se retira junto con su huella en `testDistSinMoldes`.
- **La sala de espera:** anclada, con el mini-perfil y la pasada de 44.
- **La partida muerta**, anclada.
- **`SalaOpciones`** con `PantallaChips`. El parche de la 1b solo se quita cuando la sala y la partida vayan ancladas.

**Lo que la 7b encuentra hecho:**
- `duracionSala(tipo)` en `src/config/salas.js`. Si Armar mesa o la sala enseñan cuánto dura la espera, se lee de ahí; la cifra que decide sigue en SQL, en `duracion_sala`.
- `rotuloSilla` para el rótulo de la silla, y `filaTapetes` para la hoja dentro de la sala anclada.
- El mando `retira=<k>` del árbitro imitado, para las varas de mesas con retirados.

**Lo que sigue abierto (riesgo §R de la Fase 0):** el segundo reparto no va anclado a la hora del árbitro. Un teléfono con más de 0,55 s de retraso en Rápido puede ver aparecer de golpe las últimas cartas. Lo dirá la prueba 2 del túnel en el Motorola. Si sale mal, el arreglo (anclarlo como la reposición) se decide con el rector antes del push.
