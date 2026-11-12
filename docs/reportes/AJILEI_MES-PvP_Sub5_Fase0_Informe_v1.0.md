# AJILEI · MES-PvP · Sub-tanda 5 · Fase 0 · Informe v1.0

- **Ficha:** `AJILEI_MES-PvP_Sub5_Fase0_v1.0.md` (rector, 2026-11-09). **Relevo:** `AJILEI_Relevo_2026-11-08.md` §3.1.
- **Árbol:** `main` = `origin/main` = `7a8c7c1`. `git status` al empezar: sin rastreados modificados; sin seguimiento solo `laminas/lm1/`, `laminas/lm2/`, `laminas/lm3/`. `git worktree list`: un solo árbol (`ajilei 7a8c7c1 [main]`).
- **Sonda de solo lectura.** Sin commits, sin deploy, sin nube. La única escritura del repo es este informe. Las reproducciones se hicieron en el scratchpad:
  - la tabla de costos, con un script de node que simula `startDiscardAnim` con las `D_*` reales;
  - la voz del pago, con una prueba de vitest fuera del repo que importa los módulos reales.
- **Todas las citas `archivo:línea` son de `7a8c7c1`.** Donde la ficha o el relevo daban otra línea, va la nueva.

---

## A · Documentos

### A.1 · El Contrato

`docs/AJILEI_MOT-1_Contrato_v1.0.md:1` dice **«Contrato del árbitro · v1.3»**. La última línea «Al día con…» es la del árbitro v1.3 (`:14`). Confirmado.

**Lo que tocará la v1.4** (lista de cambios, sin redactar):

| Sección | Cambio |
|---|---|
| Cabecera | Línea «Al día con MES-PvP, sub-tanda 5»: v1.4, con la reposición uno a uno y su deploy. |
| §4 · La vista | Fila «Descarte» (`:285`): `descarte.cuantas`, junto con `manoIndex` y `folded`, ya basta para el orden y para cuántas cartas repone cada asiento. Solo cambia si el rector elige mandar también las posiciones (B.4). |
| §6 · Los vencimientos | Fila «Reposición» (`:359`): pasa de «todos en paralelo, 120 + mayor × 595 + 400» a la fórmula uno a uno con `f` por ritmo. «Si nadie descartó, 600 ms» desaparece: con todos en 0 son `100 + 750·P + 500`. |
| §6 · «La reposición uno a uno · pendiente» | Pasa de pendiente a normativa (`:384-390`). Las `D_*` viven en `esperas.js`. |
| §6 · «Durante la reposición…» | Añade el anclaje del cliente al reloj del árbitro y el corte al cambiar de fase (B.9). |
| §6 · El ritmo | «Qué escala» (`:417`) suma la reposición entera, pausas y vuelos, **solo entre personas** (P-4). «Qué no escala» (`:418`) deja de nombrar la reposición. Contra las IAS sigue sin escalar. |
| §6 · Las esperas base | Fila «Reposición» (`:433`): fórmula y constantes de `esperas.js`. En «¿La escala el ritmo?» pasa a **«Sí, ×0,5»**. |

### A.2 · Lo que entra en las Reglas v1.10: textos de hoy, al byte

| Punto | Texto en `7a8c7c1` | Dónde |
|---|---|---|
| Tarjeta de saldo insuficiente | `'Tu saldo no alcanza para recargar.'` | `src/config/textos.pvp.es.js:54` (`pvp.recarga.sinsaldo`) |
| Su botón | `'Entendido'` | `textos.pvp.es.js:53` (`pvp.recarga.entendido`) |
| Recarga normal | `'Ahora no'` | `textos.pvp.es.js:51` (`pvp.recarga.no`) |
| Sentado fuera con la recarga pedida | `'Entras en la próxima mano'` | `textos.pvp.es.js:58` (`pvp.asiento.entra`). La pinta hoy la capa: `RecargaPvP.jsx:194-196`. |
| Frase a la que releva | `'Fuera de esta mano'` | `textos.pvp.es.js:56` (`pvp.asiento.fuera`) |
| Anillo único | Lo que queda de la pausa, más 300 ms de margen, más 15.000 ms; `totalSeg = ⌈(tramo + 300 + 15.000)/1000⌉` | `src/lib/entreManosCore.js:63-70`, `:95-112`. `MARGEN_VENCIMIENTO_MS = 300` en `src/lib/partidaCliente.js:51`. En el túnel salió 18 s con revelación y 20 s sin ella. |
| Sin anillo en la pausa de anuncio | `anillo: clase !== CLASES_PAUSA_RECARGA.PAUSA_ANUNCIO` | `entreManosCore.js:110-111` · `pvp.css:245` |
| Placeholders | El código usa `{n}` y las Reglas `{N}`: el empate es `'Hay empate entre {n} jugadores, vamos a desempatar'` frente a «{N}» de §8.4 (Reglas `:566`); el anuncio es `'{n} jugadores siguen en el anuncio'` frente a «{N}» de §8.6 (`:603`) | `src/lib/sorteoMesaCore.js:51` · `textos.pvp.es.js:66` |
| Pastilla de la mesa de 2 contra las IAS | `` `Mano ${handCount} · Es Mano ${corta(…name)}` `` con la IA llamada `IA`, así que dice **«Mano {n} · Es Mano IA»** | `src/lib/transicionCore.js:24-28`. Reglas §8.5 (`:593`) solo trae «Mano {n} · Es Mano IA {k}». |
| §10 · la retención | `OFERTA_RECARGA_MS = 15000`, provisional | `src/config/esperas.js:67` |

**Nota para la v1.10:** las Reglas no describen hoy la reposición en paralelo (solo la nombran en §8.2 R1, `:505-506`). Si el rector quiere dejar escrito P-4 (uno a uno, Rápido ×0,5), cabe una línea en §8. Es opcional.

---

## B · La reposición uno a uno

### B.1 · Qué hay hoy

**En el árbitro**
- `aplicarDescartes` (`src/arbitro/partida.js:383-406`) aplica el descarte y guarda `descartaron[i]`: `null` si el asiento está retirado, si no el número de cartas.
- Abre `CLASES.REPOSICION` con `esperaReposicion(Math.max(0, ...descartaron))` (`:403`).
- `esperaReposicion` (`src/arbitro/reloj.js:48-50`) vale `120 + mayor·595 + 400`, o `REPOSICION_SIN_CARTAS_MS = 600` (`esperas.js:57`). **No mira el ritmo.**
- `trasReposicion` (`partida.js:409-411`) mueve el motor cuando vence.

**En el cliente**
- `startReposicionPvP` (`GameTable.jsx:1678-1725`) la dispara el efecto de `:1730-1736` cuando la vista pasa a `reponiendo`.
- Hace **todos los asientos a la vez**, con vuelos propios cortos: sale 250 ms, paso 40, pausa 50, entra 400 ms, paso 120.
- Para los rivales anima **sus primeras k cartas**, porque solo se sabe cuántas.
- No narra, no pone `lastActions` y no hace `setGame`: el estado ya es el del servidor.

**Contra las IAS**
- `startDiscardAnim` (`:1626-1662`) hace `applyDiscard` con el motor local y luego `buildDiscardPlan` (`:236-249`), que va de Mano a Pie, se salta los retirados y compara las cartas.
- Recorre **asiento a asiento** con `discardNarration` (`:252-257`) y `setLastActions('Descartó n')` (`:1643`).
- Los vuelos son de 750 ms (`fast: true` → `duration 0.75`, `:2936`).
- Al final hace `setGame(nextGame)`, a los `t + 500` si el humano descartó (su volteo de 350 ms) o a los `t + 200` si no (`:1655-1660`).

**Las constantes** (`GameTable.jsx:263-269`, con `AI_SPEED_FACTOR = 1.25` en `:96`):

| Constante | Valor efectivo | Quién la lee |
|---|---|---|
| `D_OUT` | 750 | `startDiscardAnim:1649`. Es la duración real del vuelo `fast` (`:2936`). |
| `D_OUT_STAG` | 187,5 | `:1648-1649` |
| `D_PAUSE` | 375 | `:1651-1652` |
| `D_IN` | 750 | `:1652`. Mismo vuelo `fast`. |
| `D_IN_STAG` | 225 | `:1651-1652` |
| `D_SEAT_GAP` | 300 | `:1652` |
| `D_SKIP` | 750 | `:1646` |

Solo las lee `startDiscardAnim`. `AI_SPEED_FACTOR` lo usan también `AI_ACTION_MS` (`:97`) y otras pausas de la IA, así que **no se muda**.

### B.2 · La fórmula: confirmada

Por asiento con `n ≥ 1`:

`t' = t + (n−1)·187,5 + 750 + 375 + (n−1)·225 + 750 + 300 = t + 2.175 + 412,5·(n−1)`

Con `n = 0`: `t' = t + 750`. Se arranca en `t = 100` y se cierra con `+500` si el humano descartó, o `+200` si no.

**`R = 100 + f · Σ [n=0 → 750 ; n≥1 → 2.175 + 412,5·(n−1)] + 500` ms. Confirmada al milisegundo:** la simulación de `startDiscardAnim` coincide con la fórmula en las 12 combinaciones de la tabla.

Tres precisiones:
- **El `+500` es el peor caso.** Cada cliente cierra a +500 o a +200 según su propio descarte. El árbitro debe usar 500 para todos.
- **`f` multiplica solo el sumatorio.** El arranque de 100 ms y el cierre de 500 (volteo propio de 350 + 150) no escalan. Si el rector quiere Rápido ×0,5 también ahí, es otra cifra; recomiendo no hacerlo, porque el volteo es una animación CSS que no escala.
- **El árbitro no necesita el orden:** la suma solo depende de cuántas repone cada asiento. Los retirados (`null`) no cuentan.

### B.3 · El costo por mano (ms)

«Hoy» es la espera del árbitro en paralelo (`120 + n·595 + 400`), igual en los dos ritmos, porque hoy Rápido no la escala. La diferencia es contra hoy.

| Mesa | Descarte | Hoy | Uno a uno, Normal | Δ Normal | Uno a uno, Rápido | Δ Rápido |
|---|---|---|---|---|---|---|
| 2 | todos 1 | 1.115 | 4.950 | +3.835 | 2.775 | +1.660 |
| 2 | todos 3 | 2.305 | 6.600 | +4.295 | 3.600 | +1.295 |
| 2 | todos 5 | 3.495 | 8.250 | +4.755 | 4.425 | +930 |
| 3 | todos 1 | 1.115 | 7.125 | +6.010 | 3.863 | +2.748 |
| 3 | todos 3 | 2.305 | 9.600 | +7.295 | 5.100 | +2.795 |
| 3 | todos 5 | 3.495 | 12.075 | +8.580 | 6.338 | +2.843 |
| 4 | todos 1 | 1.115 | 9.300 | +8.185 | 4.950 | +3.835 |
| 4 | todos 3 | 2.305 | 12.600 | +10.295 | 6.600 | +4.295 |
| 4 | todos 5 | 3.495 | 15.900 | +12.405 | 8.250 | +4.755 |
| 5 | todos 1 | 1.115 | 11.475 | +10.360 | 6.038 | +4.923 |
| 5 | todos 3 | 2.305 | 15.600 | +13.295 | 8.100 | +5.795 |
| 5 | todos 5 | — | — | — | — | — |

- **La mesa de 5 descarta como mucho 3** (`gameEngine.js:27-29`), así que «todos 5» no existe ahí. Su peor caso es «todos 3»: 15,6 s en Normal y 8,1 s en Rápido.
- **Nadie descarta:** hoy 600 ms. Uno a uno, 2.100 / 2.850 / 3.600 / 4.350 ms en Normal (mesas de 2 a 5) y 1.350 / … / 2.475 ms en Rápido.
- **En resumen:** en Normal, de **+3,8 s a +13,3 s por mano**; en Rápido, de **+0,9 s a +5,8 s**. Es exactamente lo que dura hoy contra las IAS.

### B.4 · Qué necesita la vista

**Ya está todo:**
- `descarte.cuantas` (`src/arbitro/vista.js:119-122`), que el cliente rota (`src/lib/vistaAMesa.js:83-86`);
- `manoIndex` (`vista.js:115`);
- `folded` de cada asiento, que también vale para el sentado fuera (informe LM-3).

Con eso el cliente reconstruye el plan igual que `buildDiscardPlan`. **No hace falta campo nuevo ni migración.** La vista la arma la función (`vistaDe`) y se guarda como `jsonb` (`p_vistas`, `supabase/functions/partida/nucleo.js:213-219`). `leer_partida` (`20261108120000_mespvp_v13_recarga.sql:210-228`) devuelve `estado jsonb` sin columnas por campo.

**Opcional:** hoy los rivales animan sus primeras k cartas, no las que de verdad salieron. Si se quieren las posiciones reales, se añade `descarte.posiciones` en `vista.js` y en el árbitro. Va en el deploy, sin migración. Recomiendo **no hacerlo**: el dorso no deja ver qué carta sale, y no está sellado.

### B.5 · El orden

- **Contra las IAS:** `buildDiscardPlan` (`GameTable.jsx:236-249`) va desde `manoIndex`, en orden de asiento, y se salta `folded`.
- **Entre personas,** sobre el `game` rotado de `vistaAMesa`, la misma vuelta da el mismo orden en cada teléfono. Por casos:
  - **Retirado y abandonado:** `folded` (el abandono retira en el acto, R1 de §8.2). Fuera del plan, y su `cuantas` es `null`.
  - **Sentado fuera por una recarga pedida:** la vista lo da `folded` (informe LM-3). Fuera del plan.
  - **Ausente:** sigue en la mano y el reloj descarta por él (descarte vacío, Contrato §6 `:357`). Entra con `n = 0`, «{nombre} no descarta.», 750 ms.
  - **Abandono durante la reposición:** el árbitro recalcula lo que viene (Contrato `:394`). El plan que ya se pinta no cambia. El cliente corta al cambiar de fase (B.9).

### B.6 · La mudanza de las `D_*` a `esperas.js`

**Nada lo impide.** `esperas.js` no importa nada pesado (PES-1). El factor 1,25 se escribe allí, con nombre propio y el valor ya multiplicado (`187.5`, `375`, `225`, `300`, `750`), o como `FACTOR_PAUSAS_IA = 1.25` sin tocar `AI_SPEED_FACTOR`.

`esperas.test.js` ya confronta copias, porque `TURN_TIME` se mudó así. Una prueba nueva fija:
- los siete valores;
- que `GameTable` los importa en vez de declararlos;
- que la fórmula del árbitro es igual a la duración del plan del cliente.

**Contra las IAS los valores quedan idénticos:** son los mismos números y `startDiscardAnim` sigue con `f = 1`. Desaparecen `REPOSICION_SIN_CARTAS_MS` y la rama de `esperaReposicion`. `esperas.test.js:101-103` cambia.

### B.7 · El camino en el cliente

**Lo que `startDiscardAnim` toma del motor local:**
1. `applyDiscard(g, …)`, que calcula `nextGame` (`:1627`).
2. `buildDiscardPlan`, que **compara cartas**. Entre personas no sirve, porque los rivales son dorsos (`vistaAMesa.js:43`); allí se usa `cuantas`.
3. `discardNarration`, con `g.players[seat].name`. Entre personas el nombre va cortado (E.2) y la frase es de `vozHumanos`.
4. `setGame(nextGame)` al cerrar. Entre personas no se hace.

**Cómo compartir sin duplicar.** Se saca el calendario a una función **pura, fuera del componente**, por ejemplo `programaReposicion(plan, f)` en un núcleo del trozo de la mesa. Devuelve los instantes:

`[{ t, tipo: 'narra'|'sale'|'entra', seat, idx }]` y `fin`.

- `startDiscardAnim` (IAS) y `startReposicionPvP` (personas) cambian solo en cómo arman `plan` y en el cierre.
- Los dos usan `launchDiscardOut` y `launchDiscardIn` con una duración `0.75·f`, en vez de `fast`.

**El aviso del STOP-V** (`:1694-1696`): cuando `startReposicionPvP` llamaba a esas funciones, el compilador de `react-hooks` dejaba de ver el acceso adelantado. Con el calendario puro fuera del componente, y las dos `start*` como sus únicas consumidoras, hay que volver a comprobar ese diagnóstico. **La firma de eslint de ARN-4a lo vigila.**

**Lo que arriesga la mesa contra las IAS:**
- un cambio de cadencia (lo cubre la prueba que ancla el calendario con `f = 1` al de hoy, instante a instante);
- el cambio de `fast: true` por `dur` (la duración debe seguir en 0,75);
- el cierre a +500/+200.

**Varas que lo miran:** `congelado` (FRZ-1 §2.5, secuencia en vuelo), `rev` (los dorsos en vuelo) y `vuelo` (ver H.3).

### B.8 · Rápido

**El ritmo nace en la sala.** Es la columna `salas.ritmo` (`supabase/migrations/20261104150000_mot1_esquema.sql:42-43`), y `crear_sala` la recibe como `p_ritmo text default 'normal'` (`:331`).
- **El árbitro** la copia en `estado.ritmo` (`partida.js:815-831`).
- **El cliente** la lee de la fila de la sala: `factorReparto` (`src/hooks/mesaPvPCore.js:78-80`) y `factorManoRef` (`GameTable.jsx:1734`).
- Hoy **nadie la pide**: `salasApi` no pasa `p_ritmo`.

**Contra las IAS, «Partida rápida» no acelera la reposición:** el vuelo del descarte no se toca (`GameTable.jsx:288-289`) y `startDiscardAnim` no lee `factorManoRef`. **Eso no cambia.**

**Cómo se prueba Rápido antes de la sub-tanda 7:**
- **Imitado:** el ritmo va fijo en `'normal'` en dos sitios, `src/dev/partidaImitada.js:73` y `:824`. Basta un `&ritmo=rapido` en el mando (`leerMandoPvP`) que lo pase a los dos.
- **Servidor real:** una puerta solo de desarrollo en `salasApi.crearSala`, con `import.meta.env.DEV` y `?ritmo=rapido`, que mande `p_ritmo: 'rapido'`. Funciona por túnel al 5173 sin bypass. En `dist/` no existe.
  - La alternativa es un `update salas set ritmo = 'rapido'` en el SQL Editor antes de que acabe la cuenta atrás. Funciona, pero es más lento de repetir. Recomiendo la puerta de desarrollo.

### B.9 · El reloj

**El turno siguiente no puede arrancar antes.** Durante la reposición la mano sigue en `DISCARD` y ningún reloj de turno corre (Contrato `:394`). El turno de `BET_3` empieza cuando un cliente reclama el vencimiento, a la hora más `MARGEN_VENCIMIENTO_MS = 300` (`partidaCliente.js:51`). El anillo se pinta con la hora del servidor y el desfase (`mesaPvPCore.js:186-188`).

**El teléfono que llega tarde** recibe la vista `reponiendo` con un retraso `L`. Hoy arranca su secuencia al recibirla:
- termina en `R + L`;
- si `L > 300`, se solapa con `BET_3`;
- entonces `discardAnim` sigue vivo (`setDiscardAnim(null)` solo llega por su temporizador, `:1723`) y **las ranuras aún no repuestas siguen vacías mientras corre el reloj del turno**.

Hoy, en paralelo, el margen es de 15 ms (1.100 frente a 1.115). Uno a uno el riesgo crece con la duración. Es la lección del Motorola.

**Recomendación, solo de cliente, en dos piezas:**
1. **Anclar la secuencia al reloj del árbitro**, como hace `recogerEnPvP` (`transicionCore.js:32-34`). El inicio es `vencimiento.hora − R − desfase`, y cada paso cae en `inicio + t`. Los pasos ya vencidos se aplican sin vuelo, con la ranura repuesta en el acto. Así el cliente tardío alcanza al resto y termina a la vez.
2. **Cortar al salir de `reponiendo`:** si la vista cambia de fase o de mano con la secuencia viva, se limpian sus temporizadores, se pone `discardAnim = null` y se quitan sus vuelos.

**El árbitro no necesita colchón:** los 300 ms del margen de reclamo ya lo son.

### B.10 · La ventana

El cliente de `7a8c7c1` en ajilei.io, frente al árbitro nuevo:
- anima en paralelo (≤ 3,5 s);
- luego se queda quieto con las cartas ya repuestas, «Esperando el descarte de la mesa.» (`pvp.mesa.espera`, `:2823`) y la crónica de `resumenDescarte` (`vozHumanos.js:53-59`), hasta que vence la `R` larga.

**Ve solo una espera más larga. No se rompe nada.** No hay campo nuevo en la vista que el cliente viejo lea mal. **No hace falta migración: basta el deploy de la función.** El orden es commits, deploy, túnel y push, igual que en el v1.3.

---

## C · «Arrancando la partida…»

### C.1 · Dónde y en qué caminos

Texto: `'pvp.arrancando'` (`textos.pvp.es.js:27`). Se pinta en `src/screens/PartidaPvP.jsx` en cuatro sitios:

| Sitio | Cuándo |
|---|---|
| `:134-135` | Escena `arrancando`, que da `escenaDe` cuando no hay vista (`mesaPvPCore.js:52`), o sin `game` |
| `:143` | Fallback del `Suspense` mientras baja `GameTable` |
| `:200` | Imitado, hasta que carga su módulo (solo en desarrollo) |
| `:203` | Sin `sala` |

- **Quién lo pone:** cualquier entrada a `partida-pvp`. Es la misma para la mesa privada y la pública, para anfitrión e invitado, por código o por enlace. Todas pasan por `SalaEspera` (`fin === 'activa'` → `onPartida`, `SalaEspera.jsx:141-143`) y por `App.jsx:1021`, o por `mi_sala` al volver (`App.jsx:474`).
- **Quién lo quita:** la primera vista de la partida, que pasa a la escena `sorteo`, y el trozo de la mesa ya cargado.

### C.2 · La línea de tiempo del arranque (estimada; se mide en la construcción)

| # | Paso | Duración |
|---|---|---|
| 0 | La cuenta atrás de la sala llega a 0 | — |
| 1 | `resolver_sala` (`SalaEspera.jsx:229-239`), una llamada a PostgREST. La sala pasa a `activa` (`barrer_salas`, `sal_a_salas.sql:343-360`). | 150–400 ms |
| 2 | `onPartida` → `setScreen('partida-pvp')` → trozo `PartidaPvP` (`App.jsx:82`). Si no estaba en caché. | 0–600 ms |
| 3 | `MesaViva` monta `useMesaPvP`: primera lectura sin partida y `reclamar_vencimiento` v0 | — |
| 4 | Función `partida` → `arrancar` (`nucleo.js:202-226`): `leerSala`, `leerSillas`, `crearPartida` y la RPC `crear_partida`. **Aquí nace `barajado_sorteo` (1.950 ms) con la hora del servidor.** | 300–800 ms en caliente; +0,3–1 s en frío |
| 5 | Respuesta, lectura de la vista y escena `sorteo` | 150–300 ms |
| 6 | `GameTable` (`cargarMesa`, `PartidaPvP.jsx:76`) y primer cuadro | 0–500 ms |

- **«Arrancando» dura los pasos 2 a 6: entre 0,6 y 2,5 s.** El relevo estimaba entre 0,5 y 1,5 s. En frío o con red lenta, más.
- **El barajado del sorteo empieza a correr en el paso 4.** Cuando se pinta el primer cuadro ya se ha comido entre 0,3 y 1 s de sus 1,95 s. Con red lenta, entero.

### C.3 · Qué se ve en su lugar

| Opción | Qué es | Teléfono a tiempo | Teléfono tarde |
|---|---|---|---|
| **(a) Mesa provisional (recomendada)** | `PartidaPvP` monta `GameTable` en el acto con un `game` provisional sacado de la sala (asientos, nombres, apuesta). Escena `sorteo`, etapa `barajado`, local, en el mazo del anfitrión. Al llegar la vista, la capa se ancla al reloj del árbitro. | Mesa y barajado desde el primer cuadro | Mesa con barajado continuo hasta que llega la vista; si el barajado del servidor ya pasó, entra en el reparto en su punto. Nunca blanco ni a medias. |
| (b) Sala hasta la vista | `SalaEspera` sigue en pantalla (ya tiene su mazo barajando, `:326`) y `PartidaPvP` se monta oculta debajo hasta la primera vista | Transición sala → mesa | Bien, pero la disposición salta de la sala a la mesa y toca la cascada de pantallas de `App` |
| (c) Traje sin texto | El `Traje` con un mazo barajando en vez del texto | Una pantalla intermedia | Una pantalla intermedia más larga |

**Recomiendo (a).**
- Es solo de cliente: `PartidaPvP` y `sorteoMesaCore` necesitan saber pintar la etapa `barajado` sin vista.
- Necesita los nombres de las sillas: se pasan desde `SalaEspera` por `onPartida(sala)` o los lee la propia `PartidaPvP`.
- Con **la precarga de la mesa en la sala de espera** (I.3), el paso 6 desaparece.
- El colchón en el árbitro, retrasar el inicio de `barajado_sorteo` unos 500 ms, solo si la medida lo pide. Iría en el deploy de la tanda 5b.

### C.4 · Cómo se mide con el servidor real

**Marcas** (`performance.mark`), que se publican solo en desarrollo:
- `sala-cero`, `resuelta`, `pantalla`, `reclamo-enviado`, `reclamo-respuesta`, `vista-1`, `mesa-1` (primer cuadro de `GameTable`);
- además, `vencimiento.hora − 1950` (la hora del servidor en que nació el barajado) y el `desfase`.

De ahí sale **cuánto barajado se perdió** en cada teléfono.

Se ven con un panel pequeño solo de desarrollo (`?medir=arranque`) o con `console.table`. En el teléfono, el panel.

**La prueba corta de Victor:** por túnel al 5173 sin bypass, mesa de 2 con el S25 de anfitrión y el Motorola de invitado.
1. Tres arranques en caliente.
2. Uno tras 10 min sin tocar la función, en frío.
3. Captura del panel en los dos teléfonos.
4. Unos 15 min. Se hace **antes** de quitar «Arrancando», con las marcas en un commit de andamio, y otra vez después.

---

## D · El salto de la `.action-area`

### D.1 · En el pago

`GameTable.jsx:2884` hoy:

```
((isPayoutPhase && isClearing) || ceremony || !!recarga)
```

Propuesta:

```
((isPayoutPhase && (isClearing || !!partida)) || ceremony || !!recarga)
```

**Demostración con `partida` nula** (contra las IAS):
1. `!!partida` es `false`.
2. `isClearing || false` vale `isClearing`.
3. La expresión queda `(isPayoutPhase && isClearing) || ceremony || !!recarga`, **idéntica** a la de hoy para todo valor de las otras cuatro.

**Entre personas en el pago** no se monta nada en `player-bar-center`: «Siguiente mano» está cerrada con `!partida` (`:2836`). Con el cambio, la ranura `.rec-ranura` reserva la caja.

Dentro no sale ninguna burbuja: `recForma` deriva de `recarga`, que contra personas es nulo, porque la recarga es la capa `RecargaPvP`.

### D.2 · En el sorteo

- **El salto de 28 a 46 px** (`LM-1_Informe:63`) tiene la misma causa. En la fase `SORTEO` ninguna condición de `player-bar-center` (`:2686-2898`) monta una `.action-area`. En el teléfono la caja tiene alto fijo (`gameTable.css:1930`, `:2041`, `:2778`), así que su ausencia mueve el óvalo.
  - **Arreglo:** en `GameTable`, solo con `partida` y en `SORTEO`, una `.action-area thinking` reservada con `visibility: hidden` y `aria-hidden` (O1).
  - Contra las IAS la fase `SORTEO` no existe y `partida` es nula: **no cambia nada, se ve leyendo**.
  - El cronómetro del sorteo (`lugarDelReloj`, `sorteoMesaCore.js:220-225`) se mide sobre la geometría viva, así que sigue a la caja. Hay que volver a medir sus desplazamientos `RELOJ_TELEFONO` y `RELOJ_ESCRITORIO`, que se tomaron con el óvalo sin caja.
- **La franja que asoma 1 px** (mesa de 5, 915×412, `LM-2_Informe:109`). `lugarDeLaFranja` (`sorteoMesaCore.js:202-217`) la pone en `C.y − oval.h · FRANJA_SOBRE_CENTRO` sin tope arriba. Con el óvalo deformado por la caja que falta, se sale 1 px.
  - Lo más probable es que **se vaya con el arreglo anterior**.
  - Si no, se añade un tope en `lugarDeLaFranja`: `y ≥ oval.y + FRANJA_MEDIO_ALTO`, en JavaScript puro, con su prueba.

### D.3 · Protegidos

**Ninguno.** Los tres arreglos van en la condición o en el JSX de `GameTable.jsx` (no está en la lista canónica, `docs/AJILEI_Protegidos_v1.0.md:95-103`) y en `sorteoMesaCore.js`. **No hace falta CSS:** ni `pvp.css` ni `gameTable.css`.

---

## E · Los textos de la mesa

### E.1 · «Entras en la próxima mano» desde la mesa

`GameTable.jsx:2771` hoy:

```
t(human.recarga === 'fuera' ? 'pvp.asiento.fuera' : 'pvp.mesa.retirado')
```

Pasa a:

```
t(human.recarga === 'fuera' ? (partida.vista?.recarga?.pedida ? 'pvp.asiento.entra' : 'pvp.asiento.fuera') : 'pvp.mesa.retirado')
```

- `pedida` es el mismo dato que lee `recargaDeVista` (`entreManosCore.js:105`).
- `partidaMesa` lleva `vista` (`PartidaPvP.jsx:125-130`).
- Contra las IAS la rama `partida` no se evalúa.

**Lo que se retira después:**
- `RecargaPvP.jsx:43` (comentario), `:60-71` (`lugarDeLaCaja`), `:87` (`lugar`), `:100` (`setLugar`), `:110-117` (`entra` y `data-pvp-entra`), `:141` (`estiloEntra`) y `:194-198` (la capa);
- `pvp.css:246-254`: la regla `[data-pvp-entra='1']` y `.pvp-rec-entra`.

El arnés no los cita: `grep` vacío en `scripts/`. La frase queda en la letra de `.thinking` de la mesa, sin capa, y sin el problema de ancho en el teléfono apaisado que resolvía `lugarDeLaCaja`, porque es la caja real.

### E.2 · «{nombre} está pensando…» cortado a 10

`GameTable.jsx:2721-2728`; la rama de personas está en `:2724`, con `game.players[…].name` sin cortar.

**El corte de 10 vive hoy en tres sitios:**
- `src/lib/corteVoz.js:8-13` (`CORTE_VOZ`, `recortaNombre`; trozo PvP), que aplica `mesaPvPCore.js:67-69` a la crónica;
- copiado en `transicionCore.js:14` (`CORTE_PASTILLA`, trozo de la mesa);
- en `RecargaPvP.jsx:191`.

`corteVoz.js:4-5` ya dice que **en la sub-tanda 5 el corte pasa a `cronicaCore.nombreEnVoz`**. Hoy `nombreEnVoz = (p) => p.name` (`cronicaCore.js:38-40`) y no corta.

**Arreglo:** `nombreEnVoz` corta a 10, con la misma regla de `recortaNombre`, y `:2724` lo usa.

**Contra las IAS hoy:** «La IA está pensando…» en la mesa de 2 y `` `${name} está pensando…` `` (`IA 1`…`IA 4`) en las de 3 a 5. No pasa por `nombreEnVoz`, así que **no cambia**.

### E.3 · La voz del pago entre personas

**Causa.**
- `GameTable.jsx:1757` (la ficha decía `:1754`) llama a `componeCapas(lectura, game.players)` **sin voz**, así que toma `VOZ.IAS` por defecto (`cronicaCore.js:201`).
- El titular, `resultadoDeMano(game, lectura)` en `GameTable.jsx:571` (la ficha decía `:568`), sí toma `game.voz = HUMANOS` (`vistaAMesa.js:118`). Pero recibe los nombres de `game` **sin cortar**: el corte solo se aplica a la crónica (`mesaPvPCore.js:178-179`).

**Reproducción** con vitest en el scratchpad: la lectura real `lecturaDeMano`, por el camino de `GameTable`, con un rival llamado «Maximiliano Rodríguez».

| Mesa · caso | Frase de hoy | Lo que debe decir |
|---|---|---|
| 2 · gano yo con all-in corto; al rival le vuelve | «A la IA se le devuelven 1800 Heptacoins.» | «A Maximilian… se le devuelven 1.800 Heptacoins.» |
| 2 · gana el rival con all-in corto; me vuelve | titular «Maximiliano Rodríguez gana con Copas, 41 pts.» · capas «Se te devuelven 1800 Heptacoins.» | «Maximilian… gana con Copas, 41 pts.» · «Se te devuelven 1.800 Heptacoins.» |
| 3 · gana Maxi con all-in corto; Beto se lleva la capa 2; me vuelve | «El pozo se partió: Beto se lleva 2800. Se te devuelven 2400 Heptacoins.» (titular sin corte) | «El pozo se partió: Beto se lleva 2.800. Se te devuelven 2.400 Heptacoins.» · «Maximilian… gana…» |
| 3 · gano yo; la capa 2 a Maxi; a Beto le vuelve | «El pozo se partió: Maximiliano Rodríguez se lleva 2800. A Beto se le devuelven 2400 Heptacoins.» | «El pozo se partió: Maximilian… se lleva 2.800. A Beto se le devuelven 2.400 Heptacoins.» |

**Los defectos son tres:**
1. **«A la IA»** en la mesa de 2.
2. **Las cifras sin punto de millar** en las capas.
3. **Los nombres sin el corte de 10**, en las capas y en **todo titular del pago**: «{nombre} gana…», «¡{nombre} se retira!…», y también fuera de los pozos partidos.

La forma correcta ya está sellada en `vozHumanos.test.js:195-210` (VOZ-3 D5 y MES-PvP 2).

**El arreglo es solo de cliente, en dos líneas:**
- `:1757` pasa a `componeCapas(lectura, game.players, game.voz)`;
- `nombreEnVoz` corta a 10 (E.2).

`resultadoCore.nombreDe` (`:41`) ya usa `nombreEnVoz` con `HUMANOS`.

**Contra las IAS:** `game.voz` es `undefined`, que equivale a `VOZ.IAS`, y `nombreEnVoz` solo se llama con `HUMANOS`. **Idéntico, leyendo.** El doble corte con `mesaPvPCore` (`voz()`) no hace daño: `recortaNombre` de «Maximilian…» devuelve lo mismo.

Hay un efecto aparte: el mando `&corte=0` de la lámina L-M 1 dejará de quitar el corte en las frases de la mesa.

**Producción.** El defecto está en ajilei.io. No mueve dinero:
- «la IA» y las cifras sin punto solo salen con un pozo partido y devolución (all-in corto);
- el nombre largo, en cualquier titular con un rival de más de 10 caracteres.

**Recomiendo que espere al push de la sub-tanda**, salvo que la ola 0 o los testers entren antes:
- su propio control de las IAS costaría unas 2 h;
- uno reducido, justificado porque contra las IAS es idéntico leyendo (`apu.voz3` 1:11 + `msg` 19 min + `apu.360x640` 5 min + un aislado de 13,5 min), sale en unos 40 min.

---

## F · El sonido del sorteo de la Mano

### F.1 · Inventario

**Módulo y carga**
- Módulo: `src/hooks/useSounds.js` (`FUENTES` en `:24-40`, `play` en `:269`).
- `howler` llega tras el primer pintado o a los 900 ms (`src/lib/motorHowler.js`; lo arranca `main.jsx:76`).
- Lo pedido antes queda en `pendientes` y suena al llegar (`useSounds.js:217-222`).

**Archivos** (`public/sounds/`; duración estimada por bytes y bitrate):

| Sonido | Peso | Duración |
|---|---|---|
| `card-deal` | 30,9 KB | ~0,97 s |
| `card-shuffle` | 104 KB | ~5,2 s, recortado al 49 % con fundido (`:233-246`) |
| `card-fold` | 39 KB | — |
| `timer-warning` | 21,5 KB | ~0,67 s |
| `button-click` | 16,9 KB | — |
| `comodin` | 65 KB | ~2 s |
| `showdown` | 67 KB | ~2,1 s |
| `coin-bet` | — | — |
| `chips-collect` | 30,9 KB | — |
| `table-knock` | 38 KB | — |
| `ajilei-strum` | — | — |

Además, siete celebraciones.

**Dónde suenan contra las IAS** (`GameTable.jsx`):
- `cardDeal`, carta a carta: `:817`, `:832`, `:1580`, `:1600`, `:1709`;
- `cardShuffle`: `:897`;
- `timerWarning`: `:932`, en el tick que solo corre con `!partida` (`:925`);
- `showdown`: `:983`;
- `comodin`: `:820`, `:856`, `:1620`, `:2942`.

### F.2 · Por qué el sorteo es mudo

- **`SorteoMesa.jsx` y `sorteoMesaCore.js` no llaman a `play()`.** El barajado, el reparto, el volteo y «¡Ya tenemos Mano!» (`sorteoMesaCore.js:53`) son solo imagen.
- **El aviso 3-2-1 sí suena hoy.** Lo dispara el contenedor, no la capa: `PartidaPvP.jsx:107-114` (`eligeSorteo`, umbral `AVISO_RELOJ_S = 3`, `sorteoMesaCore.js:24`). El rojo lo pinta `SorteoMesa.jsx:147`, `:168`.
- Cumple §8.4, que dice al pie de la letra «Aviso de poco tiempo a los 3, 2 y 1 s (el rojo y el sonido del turno), solo para quien aún no ha elegido» (Reglas `:558`).
- **Riesgo:** en el camino PvP `timerWarning` y `cardDeal` no se precargan.
  - `App.jsx:149` (`SIN_PRECARGA`) deja fuera `sala-espera` y `partida-pvp`.
  - `SalaEspera.jsx:161` solo pide `SONIDOS_SALAS`: chips, barajado y golpe (`useSounds.js:131`).
  - **El primer «3» puede llegar tarde.**

### F.3 · El mapa propuesto, a afinar con los oídos de Victor

| Momento | Sonido | Peso nuevo | Cadencia |
|---|---|---|---|
| Barajado (1,95 s) | `cardShuffle`, recortado y con fundido como en la mesa | 0, ya precargado | Encaja |
| Reparto carta a carta | `cardDeal` por carta | 0 | Pasos de 297,5 ms con un sonido de ~0,97 s: se solapan 3 o 4 instancias, 25 golpes en ~7,4 s en la mesa de 5. **Es lo mismo que ya suena en la mesa contra las IAS con «Partida rápida»** (595 × 0,5 por carta), así que la cadencia está probada. |
| Volteo (todas a la vez) | `showdown` una vez | 0 | ~2,1 s dentro de los 5 s del volteo |
| Aviso 3-2-1 | `timerWarning` (ya está) | 0 | ~0,67 s; cabe en 1 s |
| «¡Ya tenemos Mano!» | A elegir: `tableKnock` (golpe en la mesa, «listo») o `comodin` (celebración breve) | 0 | — |

**No hace falta ningún sonido nuevo.**
- Basta añadir `cardDeal`, `timerWarning` y `showdown` a la precarga de la sala de espera, unos 118 KB.
- Son archivos de `public/`, que no cuentan para `1.8b`.
- Los `play()` van en `SorteoMesa`, en los cambios de etapa de `sorteoMesaCore` (`:8`), y uno por carta, colgado del mismo reloj que pinta el vuelo.

### F.4 · El interruptor y el bloqueo

- **Sonido del ⚙:** `Howler.mute(!soundEnabled)` (`src/context/SoundContext.jsx:22-35`), y `reproducir()` devuelve `null` con el sonido apagado (`useSounds.js:214`). El conmutador está en `HojaContenido.jsx:172-174`.
- **Pantalla bloqueada:** `useCongelado` pone `Howler.volume(0)` (`useCongelado.js:62`, `:133-134`). Lo monta `GameTable` (`:442`), y en PvP ya está montada durante el sorteo (`PartidaPvP.jsx:144`).
- Todo `play()` por `useSounds` queda cubierto, porque el volumen es global.

### F.5 · Cómo lo oye Victor antes de sellar

**Lámina con sonido en el imitado:**
- `?pvp=<escena del sorteo>` en el 5173 por túnel, con un mando de variante (`&sonsorteo=a|b`) para elegir el sonido de «¡Ya tenemos Mano!» y, si quiere, comparar `showdown` frente a `cardDeal` en el volteo;
- mesas de 2 y de 5, en el S25;
- el reloj de 10 s se deja correr para oír el 3-2-1.

---

## G · Lo que quedó de la antigua sub-tanda 6 y las herencias de la ruta

Barrido de un agente de solo lectura, con citas comprobadas a mano donde se indica.

| # | Fila | Estado | Prueba o qué falta | Sub-tanda |
|---|---|---|---|---|
| 1 | Lo que ve el que vuelve: tras bloquear, tras recargar, tras cerrar y abrir, a mitad de mano y entre manos | Parcial: código hecho, sin prueba en teléfono | `mi_sala` → `partida-pvp` (`App.jsx:467-475`). Al volver, `visibilitychange` → `leer()` (`partidaCliente.js:274-278`, `:346`). Relee al caer el canal (`:296`, `:318`). Congelado en `GameTable.jsx:442`. Falta la prueba de apagar, cerrar y quedarse sin red. | 5 (prueba en el túnel) |
| 2 | La partida muerta en pantalla | Hecho, en forma mínima | `partidaCliente.js:165` → `mesaPvPCore.js:56` → `PartidaPvP.jsx:137-138`. La píldora relee (`:89`). El traje sin anclar es la fila 8. | 7 (anclaje) |
| 3 | La píldora al salir de la mesa de personas | Hecho | `onLobby` → `refrescarSaldo()` (`App.jsx:1041`). También relee al cobrar y al recargar (`PartidaPvP.jsx:73`, `:161`). | — |
| 4 | Una partida por cuenta; INV-46 | Hecho | `cobrar_entrada` llama a `cerrar_partida_abierta('reemplazada')` (`mot1_dinero.sql:411-413`). INV-46 se cerró quitando el saldo de la partida (MES-PvP 3). | — |
| 5 | Tapete, tono, escala y `lecturaDeMano` | Hecho | Es el mismo `GameTable` (`PartidaPvP.jsx:144`): `useTapeteEnMesa` (`GameTable.jsx:641`), escala (`:443`), `lecturaDeMano` (`:519`). | — |
| 6 | `data-sin-pantalla-completa` | Hecho | `SalaEspera.jsx:543` (copiar) y `:553` (compartir). Ni Armar mesa ni la mesa abren otra app. | — |
| 7 | Mini-perfil en la sala de espera | Falta | `SalaEspera` no importa `MiniPerfil`. | 7 |
| 8 | CFG-1: O-1 del apaisado bajo, la pasada de 44 y la mesa en espera de quien cierra sesión | Falta (O-1 parcial) | «Arrancando» y «muerta» van en un `.sal` sin anclar (`PartidaPvP.jsx:47`). La Sala de espera, sin `es-anclada` (`SalaEspera.jsx:488`). `cerrarSesion` (`App.jsx:302-306`) no llama a `salir_sala`. | 7 |
| 9 | ARN-4: `SalaOpciones` con `PantallaChips` y el parche de la 1b | Falta | La carcasa va a mano (`SalaOpciones.jsx:238-246`). El parche sigue en `salas.css:1247-1290`. | 7 |
| 10 | INV-76: una puerta a la tienda a mitad de partida | Parcial | La mesa no tiene puerta (`PartidaPvP.jsx:147`, `GameTable.jsx:640`). En la Sala de espera, ⚙ → Tapetes abre la tienda con la entrada ya cobrada (`SalaEspera.jsx:689-693`, `HojaContenido.jsx:187`). Falta decidirlo. | 7 |
| 11 | Ganchos de la sub-tanda 8 | Parcial | AMI-1 hecho (`partida_asientos`). GEN-1: `?sala=` ya sienta; falta el resto. El interruptor de los puntos existe y está apagado (`mot1_dinero:1094`, `:1118`, `:1325`). «Mano actual» falta en PvP: `consultar_mano` solo mira `mesas_ia`. | 8 |
| 12 | Topes en `limite_dinero()`, respaldo `state.winner`, semilla de `vuelo` | Hecho, hecho y falta | Topes: `mot1_dinero:62-79`. `state.winner` queda solo sin lectura (`manoCore.js:166`). `vuelo` sigue sin semilla. | 9 |
| 13 | El modo guion | Falta en producción | Solo existe el guion del imitado para el arnés, que busca semillas (`partidaImitada.js:59-127`). Ni el árbitro, ni el motor, ni la función tienen manos escritas ni mazo dado. | Fuera de MES-PvP (TUT-1 y GUI-1); se anota en la 9 |

---

## H · El arnés

### H.1 · `diagDSK pvp` (11 min 06 s; el tope es de 10)

**El tope está en `scripts/arnes/orquestaCore.mjs:73`:** `diag('diagDSK', 'pvp', 'pvp', 10)`. Va en `commit` y en `completo` (`:112-113`).

**Partes, en serie** (`scripts/pvp/pvp.mjs:368-401`). No hay tiempos medidos por parte; son estimaciones:

| Parte | Tiempo estimado |
|---|---|
| 20 celdas | ~1,5–2 min |
| 62 escenas | ~1,5–2 min |
| L-M 1 | — |
| L-M 2 | — |
| L-M 3 (50 celdas con capturas; la más gorda) | — |
| L-M 1 a L-M 3 en total | ~6–6,5 min |
| v1.3 | ~0,7–1 min |
| Nombres largos | ~15 s |
| Celdas + 25 escenas + largos, medido en `Fase1-3_Informe:98` | 2 min 29 s |

**Recomiendo partirlo**, no solo subirle el tope. La sub-tanda 5 lo alarga por tres lados:
- la reposición uno a uno: cada escena que repone pasa de ~1 s a 5–16 s;
- la escena de la quiebra en anuncio;
- las marcas del arranque.

**Cómo:**
- un submodo en `runPvp`;
- dos varas: `pvp.mesa` (celdas, escenas y largos; tope 10) y `pvp.lm` (L-M 1 a 3 y v1.3; tope 15);
- con el patrón de `TAB` (`orquestaCore.mjs:44-47`);
- y retocar `orquesta.test.js:63-65`, que fija que `commit` termina en `'pvp','humo'`.

### H.2 · La escena que falta: la quiebra en una mano de anuncio

- **Dónde va:** `ESCENAS_LM3` (`src/dev/partidaImitada.js:423-471`). Ya tiene los ayudantes `quiebra` (`:409-413`) y `sentadoFuera` (`:415-419`).
- **La escena:** mesa de 3 o más; quiebra propia en la mano 5 o 11 (`llevaAnuncio`, `reloj.js:53`); se avanza hasta `pausa_anuncio` con la oferta viva (`partida.js:321-329`).
- **Su control:** un caso en `CASOS_RECARGA` (`scripts/pvp/arbitro13LM.mjs:132-139`) que exija burbuja con `data-anillo='0'`.
- **Lo que hay que retocar:** la cuenta de `partidaImitada.test.js:92` (`toHaveLength(55)`) y su mapa `ESPERADO`.

### H.3 · El control de las IAS de esta sub-tanda

| Vara | Motivo en esta sub-tanda | Tiempo conocido |
|---|---|---|
| `apu.360x640` … `apu.1920x937` (7) | La geometría de la mesa en cada celda: `:2884`, `:2771`, la caja del sorteo, el calendario del descarte | 4:20–5:09 cada una; ~31 min |
| `apu.rec2` | La ranura O1 de `:2884`, con la recarga contra las IAS | 10:08 |
| `apu.voz3` | `componeCapas` y `nombreEnVoz` (E.3) | 1:11 |
| `u3` | Mesa entera con manos auto-jugadas (control general) | 7:38 |
| `congelado` | La secuencia del descarte en vuelo, FRZ-1 §2.5 (B.7) | 1:48 |
| `rec` | La burbuja de la ranura O1 (`:2884`) | 15:58 |
| `tab.frase` y `tab.resto` | Tableta; `tab.resto` lleva `vuelo` dentro (`orquestaCore.mjs:46`) | 9:20 + 20:22 |
| `msg` | Los mensajes y la voz (E.2, E.3). Sale con código 1 por el rojo conocido de «Heptacoins». | 18:57 |
| `rev` | Los dorsos en vuelo durante el descarte (B.7) | 3:51 |

- **Total ≈ 2 h 00 min.** Son las 16 varas de siempre (1 h 52 min, `LM-3_Informe:156`) más `rev`.
- **No añado** la vara suelta `vuelo` (29 min): `tab.resto` ya lleva el submodo `vuelo`, y la prueba unitaria del calendario con `f = 1` ancla la cadencia instante a instante.

**El comando, desatendido.** Desde PowerShell, con `node` directo y la orquesta como padre (lección de LM-3: un `diagDSK` suelto pierde a su padre; la orquesta no):

```powershell
$d = "$env:TEMP\ias-sub5"; New-Item -ItemType Directory -Force $d | Out-Null
Start-Process powershell -WindowStyle Minimized -ArgumentList '-NoProfile','-Command',"Set-Location 'C:\Users\victo\OneDrive\Documents\ajilei'; node scripts/arnes/orquesta.mjs --solo apu,u3,congelado,rec,tab,msg,rev --carpeta=$d *> $d\orquesta.log; exit `$LASTEXITCODE"
```

- Los veredictos quedan en `$d\varas.json` y uno por vara en `$d\<vara>.log`.
- `--solo` admite la lista con comas y los grupos `apu` y `tab` por prefijo (`orquesta.mjs:43-44`, `orquestaCore.mjs:131`).

---

## I · Las caras de las cartas

### I.1 · Cómo cargan

- **El `src`:** `src/components/CardImage.jsx:25` toma `cardImages[...webp]` y lo pinta en un `<img>` sin `loading` ni `decoding` (`:28-32`).
- **De dónde salen:** `cardImages` viene de `import.meta.glob(..., { eager: true, query: '?url' })` (`src/lib/carasBaraja.js:5`). Las imágenes están en `src/assets/cards/webp/` y se sirven en `/assets/` con hash.
- **Formato y peso:** WebP de 320×452 a q80. Las **40 caras pesan 559 KiB** (572.272 B). La más ligera, 7,5 KB; la más pesada, 27,9 KB.
- **Precarga:** `src/lib/precargaBaraja.js:22-32` hace `new Image()` con referencia retenida y sin `decode()`, a propósito. Solo la llama `App.jsx:671-683`, que se salta las pantallas de `SIN_PRECARGA`, entre ellas `sala-espera` y `partida-pvp`.
- **El Lobby** precarga solo JS (`Lobby.jsx:112`, `trozos.js:39-42`).
- **En el camino PvP las caras no se precargan**, salvo que el jugador haya pasado antes por una pantalla que sí lo haga.

### I.2 · Caché y service worker

- `public/_headers:8-9`: `/assets/*` lleva `public, max-age=31536000, immutable`. Entran las caras.
- **No hay service worker** (no aparece `serviceWorker`, `workbox` ni `vite-plugin-pwa`). Solo `manifest.webmanifest` (`index.html:15`), que no guarda nada.
- El jugador nuevo baja cada cara la primera vez que se pinta, durante el reparto. **Eso explica que «les cueste mostrarse».**

### I.3 · Recomendación

**Precargar en la sala de espera:** `precargarBaraja()`, `cargarMesa()` y los sonidos de la mesa al montar `SalaEspera`.
- El motivo escrito de `SIN_PRECARGA` (`App.jsx:142-148`, «llevan a una partida que todavía no existe», del stub de SAL-B2) **ya no vale**: la sala lleva a la mesa.
- La sala dura minutos y deja tiempo de sobra para 559 KiB.
- No toca `1.8b`: `precargaBaraja` y `carasBaraja` no entran en la entrada, y si alguno lo hiciera, se pide con `import()`.
- **Red de seguridad:** la misma llamada al montar `PartidaPvP`, durante el barajado, para quien llega por `mi_sala` sin pasar por la sala.
- **Costo:** unos 15 min con su prueba y el peso en `1.8b`.
- **Cabe en esta sub-tanda.** El modo sin conexión sigue en SW-1.

---

## J · Corte, orden y estimación

### J.1 · Corte

| Tanda | Qué lleva | Deploy |
|---|---|---|
| **5a · cliente** | E.1, E.2 y E.3 · D.1 y D.2 · C (mesa provisional, sin «Arrancando», con sus marcas) · F (el sonido, tras la lámina) · I (precarga en la sala) · H.1 y H.2 (el arnés) | No |
| **5b · reposición** | `D_*` a `esperas.js` · calendario compartido · árbitro uno a uno con `f` · `startReposicionPvP` anclado y con corte · imitado con `&ritmo=` · puerta de desarrollo `?ritmo=rapido` · Contrato v1.4 | Sí, solo la función |

- **Un solo control de las IAS** sobre el árbol final de 5a + 5b, antes del push.
- **No veo una razón fuerte para dos controles.** La única candidata es publicar antes la voz del pago (§P-2).

### J.2 · Lo que necesita lámina y lo que va directo

| Pieza | Lámina | Para qué |
|---|---|---|
| F · el sonido del sorteo | **Sí** | Los oídos de Victor: el mapa y el sonido de «¡Ya tenemos Mano!» |
| C · lo que se ve en lugar de «Arrancando» | **Sí** | Los ojos de Victor sobre la mesa provisional, con red lenta simulada en el imitado (retraso de la primera vista) |
| B · la reposición uno a uno en Normal y en Rápido | Recomendada, corta | Victor ve el costo en la mesa de 5 antes de pagar el deploy. La lámina sale gratis del imitado con `&ritmo=` y el calendario nuevo. |
| D, E, I, H | No: directo | — |

### J.3 · El paso a la nube

1. Los commits de 5a y 5b, cada uno con su aislado.
2. El control de las IAS sobre el último commit.
3. `diagDSK pvp` partido.
4. Aviso de «árbol congelado» a Victor.
5. **Deploy de la función `partida`** (CLI 2.122.1, `--linked`), sin mesas vivas.
6. Túnel: el S25 y el Motorola. La reposición en mesas de 2 y 3, en Normal y en Rápido; el arranque con las marcas; el sonido del sorteo; la voz del pago; el que vuelve (fila G-1).
7. Push.

**Sin migración.**

### J.4 · Estimación (minutos de Claude Code)

| Bloque | Minutos |
|---|---|
| Láminas F, C y B (una sesión, STOP-L) | 75 |
| 5a · código: E 40 · D 35 · C 70 · F 40 · I 15 · H 60 | 260 |
| 5b · código: `esperas.js` y calendario 50 · árbitro y pruebas 40 · cliente anclado y corte 45 · imitado y puerta de desarrollo 15 · Contrato v1.4 (líneas) 20 | 170 |
| Informe y cierre | 30 |
| **Total que se comprime** | **~535 (~9 h)** |

**Lo que no se comprime:**

| Pieza | Tiempo |
|---|---|
| El control de las IAS | ~2 h 00 min |
| Aislados, ~8 commits × 13,5 min, uno detrás de otro | ~1 h 50 min |
| `diagDSK pvp` partido | ~12–15 min |
| Deploy | ~10 min |
| La medida del arranque por túnel, antes del código | ~15 min |
| El túnel final de Victor | ~60 min |
| **Total** | **~4 h 30 min** |

---

## §P · Preguntas al rector

1. **Lo que reemplaza a «Arrancando» (C.3).** Recomiendo **(a), la mesa provisional con el barajado local anclado después al servidor**: es la única que no deja pantalla intermedia ni en el teléfono lento, y es solo de cliente. La (b) toca la cascada de pantallas de `App`, y la (c) deja una pantalla intermedia.
2. **La voz del pago en producción (E.3).** Recomiendo **esperar al push de la sub-tanda**: es texto y no dinero, sale en casos poco frecuentes, y un hotfix suelto cuesta su control (unos 40 min reducido o 2 h completo). Publicarlo antes solo si la ola 0 o los testers entran antes de que cierre la sub-tanda.
3. **El cierre de la reposición en Rápido (B.2).** Recomiendo **que no escale** el arranque de 100 ms ni el cierre de 500. El volteo de la carta propia es CSS y no escala; P-4 habla de «pausas y vuelos».
4. **Las posiciones reales de las cartas de los rivales (B.4).** Recomiendo **no mandarlas**: salen las primeras k, como hoy. El dorso no deja ver la diferencia y añadirlas abre la vista sin necesidad.
5. **Partir `diagDSK pvp` o subirle el tope (H.1).** Recomiendo **partirlo** en `pvp.mesa` y `pvp.lm`, porque la reposición uno a uno lo alarga varios minutos más.

## §R · Riesgos

- **IAS:** el calendario compartido cambia la cadencia del descarte en un paso. Lo frena la prueba que ancla `f = 1` instante a instante frente al calendario de hoy.
- **IAS:** cambiar `fast: true` por `dur` deja el vuelo del descarte en otra duración si se escribe mal `0.75·f`.
- **IAS:** el compilador de `react-hooks` deja de ver la mesa al mover las funciones del descarte (STOP-V). Lo vigila la firma de eslint de ARN-4a.
- **IAS:** la caja del sorteo o la ranura de `:2884` se cuela fuera de su condición `partida`. Lo cubren las 7 celdas de `apu` y `rec`.
- **Ventana:** el cliente viejo frente al árbitro nuevo ve 4 a 13 s de espera quieta tras reponer. No se rompe, pero el túnel no debe alargarse.
- **Deploy:** que haya una mesa viva en el momento del deploy y quede con una reposición calculada por la fórmula vieja. Se despliega sin mesas vivas, como en el v1.3.
- **Teléfono lento:** si el anclaje al reloj se omite, las ranuras quedan vacías con el reloj de `BET_3` corriendo (B.9).
- **Arranque:** el frío de la función alarga el paso 4 por encima de 1,95 s y el barajado del servidor ya pasó. La mesa provisional lo tapa, pero hay que medirlo.
- **Sonido:** `cardDeal` y `timerWarning` sin precargar llegan tarde la primera vez. Va con la precarga de la sala.
- **Peso:** la precarga en la sala no debe tirar de `carasBaraja` desde la entrada. Hay que comprobar `1.8b` tras la 5a (hoy 176,9 KiB).
- **Arnés:** `diagDSK pvp` crece con la reposición larga. Si no se parte, vuelve a cortarse.
