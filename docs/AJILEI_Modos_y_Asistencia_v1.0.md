# AJILEI — Modos y Asistencia v1.0

**Estado:** **Especificación de implementación.** Ya no es borrador de conceptualización.
**Errata e1 (2026-09-17) — §3.3 corregida.** El modelo de «costo único por partida» que este
documento describía **no es el del código ni el del juego**: el monto es el ante de cada mano. La
autoridad de todo lo que toque dinero pasa a `AJILEI_APU-1_Reglas_v1.0.md`. Detalle en §12.
**Fecha:** 2026-08-14
**Base de código:** HEAD `df5270f` (ESC-1). Documento **doc-only**: no toca `src/`, no abre
protegidos. Lo implementan las tandas **NIV-B0 → NIV-UI → NIV-1 → NIV-2** (§10).
**Procedencia:** la **v0.1** (31 de julio de 2026) nació como **borrador de conceptualización
fuera del repositorio** y nunca se versionó aquí. Esta v1.0 es, por tanto, **la primera versión
en el repositorio**: no archiva un archivo previo porque no lo hay. La v0.1 conserva su valor
como registro de origen de las decisiones **D-1…D-8**, que esta versión ratifica (§2).
**Base de diagnóstico:** informe **NIV-0** (2026-08-14, solo lectura absoluta sobre
`aiPlayer.js` + superficie de llamada). Todos los semáforos, líneas y evidencias de código que
esta especificación cita salen de ahí; lo que no se diagnosticó se declara como tal.
**Autoridades externas:**
- `AJILEI_Menu_Utilidades_v1.4.md` — **cabeza de la cadena** de Menú de Utilidades. Manda sobre
  todo lo relativo a *Mano actual* y *Sugerencias*. Este documento **referencia, no duplica**.
- `AJILEI_Sistema_Diseno_v1.2.md` — autoridad visual.
- `AJILEI_Reglas_Mano_Congeladas_v1.0.md` — doctrina de **foto única** (HR-1), de la que §6 toma
  el molde palabra por palabra.

---

## 0. Verificación de procedencia — ejecutada

| Comprobación | Resultado |
|---|---|
| ¿Existe `docs/AJILEI_Modos_y_Asistencia_v0.1.md`? | **No.** `docs/` contiene 13 documentos; ninguno de Modos. |
| ¿Hay que archivar una versión previa (molde Menú de Utilidades)? | **No aplica.** No hay archivo que archivar. |
| Acción tomada | Creación directa de la **v1.0** con la procedencia anotada en el encabezado. |

**Consecuencia de proceso:** no existe en el repositorio un **archivo** de la v0.1 contra el cual
contrastar este delta línea por línea. Lo que sí llega es su **sustancia**: las ocho decisiones
**D-1…D-8**, las tres primeras por transcripción literal desde el registro de la sesión en que se
redactó el borrador (§2), y el resto por las decisiones selladas de hoy. Las contradicciones que
el §11 manda *reportar y no resolver* se buscaron, pues, en dos frentes —los documentos que **sí**
viven aquí y los ocho enunciados—, y en ninguno aparecieron: sólo dos precisiones (§11).

---

## 1. Estado del mundo desde la v0.1

Tres cosas cambiaron entre el 31 de julio y hoy. Ninguna se re-decide aquí; se registran para
que la v0.1 deje de ser lectura vigente en esos tres puntos.

### 1.1 *Sugerencias* — descartada

Decisión de producto de **agosto de 2026**, ya registrada y motivada en
**`AJILEI_Menu_Utilidades_v1.1.md` §2.1** (y su nota de trazabilidad hacia el *Asistente IA* de
la v1.0 §3.3). **No se duplica el motivo aquí: se referencia.**

Lo que importa para esta fase: **la escalera de dificultad NO es un sustituto encubierto de
*Sugerencias*.** Ninguna capacidad de §5 asiste la decisión del humano; todas viven del lado de
la IA. La frontera que la v1.1 §2.1 trazó sigue intacta.

### 1.2 *Mano actual* — implementada, con la cifra corregida

- Implementada en la tanda **DSK-U3**; especificación funcional sellada en
  **`AJILEI_Menu_Utilidades_v1.3.md`** y vigente por herencia hasta la **v1.4**.
- **La cifra viva es 20 consultas gratis**, no las 12 del borrador v0.1. Origen del número:
  **v1.1 §3.4**, nunca modificado desde entonces; implementado como `CONSULTAS_GRATIS = 20` en
  `config/consultas.js`. **La v0.1 queda corregida en este punto.**
- Contador **global único**, acumulable entre escenarios, mesas **y dificultades** (v1.1 §3.4).
  Esto ya contemplaba la existencia de niveles: **el contador no se ramifica por nivel.**

### 1.3 El precio post-20 — la única decisión abierta de la fase

La v1.1 §3.4 dejó el precio *«por definir, se calibrará en la fase de niveles de dificultad»*.
**Esta es esa fase**, y el precio se calibra **al final** (§10), no ahora, porque depende de dos
cosas que aún no están fijadas: las tablas nuevas (§3, ya selladas) y las bandas de tasa de
victoria por nivel (NIV-B0 → calibración).

Lo que sí se fija hoy:

- **El ancla se actualiza.** La v1.1 §3.4 escribió *«barato relativo al **ante mínimo (100)**»*.
  Con la tabla de **Básico**, la entrada más baja del juego pasa a **50**. El **principio** no
  cambia —comodidad, **no peaje**—; cambia la magnitud contra la que se mide.
- **Precisión terminológica necesaria** (§11.2): el *«ante mínimo»* de la v1.1 §3.4 es la
  **entrada de mesa más baja** (`STAKE_OPTIONS[0]`, hoy 100), **no** `betting.entrada` (10) ni
  `betting.apuestaMinima` (10). El código tiene tres números distintos que podrían llamarse
  «ante»; el ancla es el primero.
- **Sigue sobre la mesa la opción porcentaje-de-mesa**: precio como fracción de la entrada de la
  mesa en curso en vez de un número plano. Se decide en la calibración, con la aritmética de las
  tres tablas ya conocida.

---

## 2. Decisiones D-1…D-8 — ratificadas, con enmiendas de hoy

Las ocho decisiones de la v0.1 se **ratifican**. Cuatro reciben enmienda o cierre en esta
versión; el resto pasa sin cambios.

**Procedencia de D-1, D-2 y D-3:** transcripción **literal** del borrador **v0.1** (31-jul-2026),
recuperada del registro de la sesión en que se redactó. El borrador nunca se versionó en el
repositorio (§0); estas tres filas son, por tanto, su primer asiento documental aquí.

| # | Enunciado | Estado en esta v1.0 |
|---|---|---|
| **D-1** | **Se construyen tres niveles.** El comportamiento actual pasa a ser el nivel base; se añaden dos superiores. | Ratificada · **desarrollada** en §3 y §5 |
| **D-2** | **Libre elección, no progresión por desbloqueo.** El usuario escoge dificultad en cada sesión. | Ratificada · **desarrollada** en §4.2 |
| **D-3** | **Orden de decisión: dificultad → mesa (cantidad de jugadores) → monto de apuesta.** La dificultad responde «contra quién juego»; mesa y monto responden «qué arriesgo». | Ratificada · **es el §4.1** |
| **D-4** | **Prohibido el multiplicador ciego de agresión.** Un nivel superior no es «la misma IA, más agresiva». | Ratificada · **reforzada** en §5.4 |
| **D-5** | **Integridad de información: la IA nunca ve cartas ocultas.** | Ratificada · **+2 renglones** (§2.1) |
| **D-6** | **El nivel entra sin tocar el motor.** | Ratificada · **vía elegida** (§2.2) |
| **D-7** | **El nivel se congela al empezar la mesa.** | Ratificada · **satisfecha por construcción** (§2.3) |
| **D-8** | **Economía y recompensa de la escalera.** | **Cerrada** (§3 y §6) |

### 2.1 D-5 — integridad de información · dos renglones nuevos

El diagnóstico NIV-0 certificó que **hoy la IA no accede, por ninguna vía, a cartas ocultas del
humano ni del mazo**. Evidencia: toda lectura de `.cards` en `aiPlayer.js` pasa por
`players[aiIndex]` (`:85`, `:98`, `:159`, `:162`, `:163`); la única lectura cruzada es `p.folded`
en el conteo de oponentes activos (`:107`); `state.deck` **no aparece ni una vez** en el archivo.

**Renglón (a) — la naturaleza de esa limpieza, dicha sin adorno.**
Es limpieza **de conducta**, no **de encapsulación**. El parámetro `state` que la IA recibe lleva
dentro `players[i].cards` de todos los asientos y el mazo restante en orden. Nada en la
arquitectura impide la lectura: lo que la impide es la disciplina del código más un test. Esto no
es un defecto a reparar en esta fase —reparar la encapsulación es abrir el motor, y el motor no se
abre aquí (§8)—, pero **debe estar escrito**, porque toda capacidad nueva de §5 se añade sobre esa
base de confianza y no sobre una barrera.

**Renglón (b) — regla nueva: la trampa `Proxy` es puerta obligatoria.**
El test de aislamiento de `testAI.test.js:177-233` instrumenta el getter `.cards` de los asientos
ajenos con un `Proxy` y verifica que **no se dispare** —en `decideBetAction` N=2, `decideDiscard`
N=2 y `decideBetAction` N=5 con los cuatro asientos ajenos a la vez—.

> **Regla, de alcance permanente:** **ninguna capacidad nueva entra sin extender esa vigilancia.**
> Cada tanda que añada lectura a la IA (NIV-1, NIV-2 y cualquiera futura) debe **ampliar la trampa
> a los datos que introduce**, no sólo pasar la existente. Una capacidad que no se pueda vigilar
> con este molde es una capacidad que no entra en esta fase.

Aplicación inmediata a §5: la lectura de `state.deck` que Pro necesita (②) es de **longitud**, no
de contenido. La trampa debe extenderse para exigir exactamente eso: que se lea `.length` y que
**no se indexe** el array. La simetría con el jugador humano se sostiene sobre esa distinción y
sobre nada más.

### 2.2 D-6 — la vía de entrada del nivel: **pasajero `state.nivelIA`** (Vía C)

De las tres vías que NIV-0 §3 enumeró, se implementa la **Vía C**.

| | Decisión |
|---|---|
| **Quién lo crea** | La **UI**, en la creación del estado — `GameTable.jsx:268`, junto a `createInitialState(stake, numPlayers)`. |
| **Quién lo lee** | `aiPlayer.js`, con **default explícito**: `state.nivelIA ?? 'basico'`. |
| **Valores** | `'basico'` · `'avanzado'` · `'pro'` (§3). |
| **Quién NO se toca** | `gameEngine.js`. **Ni una línea.** |

**Por qué funciona sin tocar el motor.** Cada retorno del engine es un *spread* de `state`, así
que una clave inyectada en la creación **sobrevive la partida entera** sin que el motor la
conozca: `startHand:435`, `advanceBettingPhase:208`, `applyBetAction:356`, `applyDiscard:525`,
`doShowdown:201` → `resolveWinner:135`. No hay un solo punto donde el motor reconstruya el estado
desde cero y pierda la clave.

**Costos aceptados, y cómo quedan mitigados:**

| Costo (NIV-0 §3, Vía C) | Mitigación |
|---|---|
| `createInitialState` construye `base` campo a campo e **ignoraría** la clave | El pasajero entra **por fuera**, en el sitio de la UI que ya arma el estado inicial (`GameTable.jsx:268`). El motor no la declara porque no la necesita. |
| **Todos los estados sintéticos de los tests** habría que actualizarlos | **El `?? 'basico'` los deja intactos.** Las fixtures de `testAI.test.js:45-62` y los tres archivos que mockean el módulo (`testEngine:12`, `testEliminations:9`, `testHandRules:32`) siguen valiendo sin tocarse: sin pasajero, la IA es la de hoy. |
| **Campo no declarado**, invisible en la firma del motor | **Se declara aquí.** Esta sección es su contrato: nombre, valores, quién escribe, quién lee, y el default. El motor lo transporta a ciegas **a propósito** — es carga de la UI, no del engine. |

**Contrato del pasajero — normativo:**

1. **Nombre exacto:** `nivelIA`. Sin variantes, sin abreviaturas.
2. **Sólo lo escribe la UI**, y **una sola vez**, en la creación del estado.
3. **Nadie lo muta durante la partida.** Ninguna acción del motor lo toca — no puede, no lo
   conoce.
4. **Lector único:** `aiPlayer.js`, siempre con el `??`. Ningún otro módulo lo lee.
5. **Ausencia = Básico.** Un estado sin pasajero es un estado válido, y su IA es la de hoy.

### 2.3 D-7 — congelado, satisfecha por construcción

D-7 pide que el nivel no cambie a mitad de mesa. **La Vía C la satisface sin maquinaria de
congelado**: el pasajero **nace con la mesa y muere con el componente**. No hay setter, no hay
estado de módulo, no hay ventana en la que alguien pueda moverlo.

Contraste con la alternativa descartada: el estado de módulo (Vía A) habría exigido decidir a mano
qué le pasa al nivel en el re-sorteo por sesión nueva de `aiPlayer.js:59-63` —que hoy reinicia
perfiles— y habría dejado el valor vivo entre mesas. **La Vía C hace ese problema inexistente.**

Nota de alineación doctrinal: el pasajero es **hermano de `handRules`** en espíritu —una foto que
se toma una vez y ya no se mueve (HR-1, `gameEngine.js:27-46`)— pero con un ámbito más ancho: la
foto de `handRules` dura **una mano**; la del nivel dura **toda la mesa**.

### 2.4 D-8 — cerrada

Se cierra con dos piezas selladas: **pote escalado por tabla** (§3) y **puntos de ranking** (§6).

---

## 3. Nombres y tablas — **SELLADO**

### 3.1 Los tres nombres

**Básico · Avanzado · Pro.** Sin sinónimos, sin abreviaturas, sin numeración.

> **Puerta abierta sin costo.** Un sabor venezolano futuro para estos tres rótulos es **cambio de
> cadena de texto y nada más**: los identificadores internos (`'basico'`, `'avanzado'`, `'pro'`)
> son el contrato (§2.2) y **no se renombran nunca**. Rótulo y valor viven separados desde el
> día 1 precisamente para que esa puerta no cueste una tanda.

### 3.2 Precisión de escalera — qué significa «actual»

Una sola palabra causaba dos lecturas, y se separan:

- **La IA actual = Básico.** El comportamiento que hoy juega en la mesa, intacto, es el nivel de
  entrada de la escalera (§5.1).
- **Las apuestas actuales pasan a Avanzado.** Los cuatro montos vigentes —100/200/300/500,
  `STAKE_OPTIONS` en `config/ajileiConfig.js:1`— **suben un peldaño**: ya no son la tabla del
  juego, son la tabla del nivel intermedio.

La consecuencia importante: **el jugador que hoy juega en 100 y no toca nada acabará jugando
Básico en 50**, más barato y contra la misma IA de siempre. La escalera abarata la entrada, no la
encarece.

### 3.3 Las tres tablas

**ERRATA e1 (2026-09-17).** Donde decía «Costo único por partida. El ganador se lleva el pote =
monto × jugadores» hay que leer: **el monto es el ANTE DE CADA MANO**. Cada mano arranca cobrando
un ante igual al monto a cada jugador vivo (`gameEngine.js:413-418`), y el pozo de esa mano se
reparte al final de esa mano. Una partida son muchas manos y, por tanto, muchos antes y muchos
pozos. **Reglas del dinero: `AJILEI_APU-1_Reglas_v1.0.md` §2.4**, que manda sobre esta sección en
todo lo que toque dinero. Las tres tablas de abajo —qué montos ofrece cada nivel— **siguen
vigentes tal cual**: lo que estaba mal era qué significa el monto, no cuáles son.

| Nivel | Entradas |
|---|---|
| **Básico** | **50 · 100 · 150 · 250** |
| **Avanzado** | **100 · 200 · 300 · 500** *(las de hoy)* |
| **Pro** | **200 · 400 · 600 · 1000** |

**Retirado por la errata e1:** aquí vivían una tabla de «pote mínimo / pote máximo» por nivel
(100–1250 · 200–2500 · 400–5000) y una nota sobre el 20 % del `saldoInicial`. Las dos describían
**la primera mano con todos pasando**, no una partida, así que no acotaban nada: con ante por mano
el pozo crece con cada subida y una partida cobra tantos antes como manos dure. Además
`saldoInicial` se retira en APU-1 (`AJILEI_APU-1_Reglas_v1.0.md` §10), con lo que la nota se
quedaba sin referente. Se retiran en vez de anotarse porque una cifra que no acota nada, anotada,
se sigue citando.

**Solapamiento deliberado:** 100 pertenece a Básico *y* a Avanzado; 200 a Avanzado *y* a Pro. No
es un descuido de tabla — es la costura que permite subir de nivel **sin subir de apuesta**, de
modo que el salto de dificultad se pruebe con el bolsillo quieto.

---

## 4. Pantallas — **SELLADO**

### 4.1 El recorrido

```
[Bienvenida]  "Jugar vs IA"
      ↓
(1) SELECCIÓN DE DIFICULTAD     ← pantalla nueva
      ↓
(2) SELECCIÓN DE MESA + APUESTA ← una sola pantalla, apuesta integrada
      ↓
[Mesa]
```

**Cambio respecto del recorrido de hoy.** Hoy son: `WelcomeScreen` → `ModeSelect` (tamaño de
mesa) → `TableSelect` (apuesta) → `GameTable`, encadenadas en `App.jsx`. La v1.0 **inserta la
dificultad al frente y funde los dos pasos siguientes en uno**: el selector de apuesta deja de ser
pantalla propia y pasa a vivir dentro de la selección de mesa.

**El selector de apuesta es dinámico según el nivel**: muestra **los cuatro montos de la tabla del
nivel elegido** (§3.3) y ningún otro. `STAKE_OPTIONS` deja de ser una lista única para pasar a ser
**una tabla por nivel** — cambio en `config/ajileiConfig.js`, que **no es archivo protegido**.

> **Este recorrido es D-3, y lo cumple entero.** D-3 fija un **orden de decisión** —dificultad →
> mesa → monto—, no un número de pantallas. El orden se preserva intacto: la dificultad se decide
> primero **y manda**, porque de ella depende qué cuatro montos existen; mesa y monto se deciden
> después, en ese orden, sobre una sola superficie. Fundir dos pasos en una pantalla **no invierte
> ni salta ninguno**: los aproxima porque ambos responden la misma pregunta —*«qué arriesgo»*—
> mientras que el primero responde otra distinta —*«contra quién juego»*—. La costura entre
> pantallas cae exactamente donde D-3 puso la frontera semántica.

### 4.2 Arranque en frío

| Regla | Sellado |
|---|---|
| Visibilidad | **Los tres niveles siempre visibles.** Ninguno se oculta ni se bloquea por progreso. Un nivel que no se ve no se elige, y la escalera existe para ser vista entera desde el primer día. |
| Preselección del nuevo | **Básico.** |
| Memoria | **Se recuerda la última elección.** `localStorage` pre-login → **Supabase con login**, misma escalera de autoridad que el contador de consultas (v1.1 §3.6). |

Sin desbloqueos, sin puertas por mérito: **Pro está disponible desde el minuto cero**. La barrera
de entrada a Pro es su tabla (§3.3), no un candado. **Esto es D-2 literal**: libre elección, no
progresión.

**La memoria preselecciona, jamás salta la pantalla.** Recordar la última elección es una
comodidad, no un compromiso: la pantalla de dificultad **aparece siempre** y el usuario **vuelve a
escoger en cada sesión**, como manda D-2. Un recorrido que entrara directo a la mesa con el nivel
de ayer convertiría una preferencia en una decisión tomada por otro.

### 4.3 Terreno y verificación

**Terreno compartido móvil + escritorio.** Estas dos pantallas viven **fuera de las mesas
selladas**: no son `gameTable.css`, no son geometría de asientos, no tocan el gate de escritorio
de la campaña DSK.

**Regla de verificación para NIV-UI:** checkpoint **en los dos viewports** (móvil y escritorio),
**sin tocar el arnés de mesas**. `diagDSK.mjs` mide mesas; estas pantallas necesitan su propia
comprobación, y esa comprobación **no se cuela en los modos existentes del arnés** — la lección de
U3 sobre no reutilizar el helper de la app aplica igual a no reutilizar el modo del arnés.

---

## 5. Asignación de capacidades — **SELLADO**

Nomenclatura: los números **① a ⑥** son los de la escalera de capacidades de **NIV-0 §4**, y sus
semáforos (🟢 verde / 🟡 amarillo / 🔴 rojo) son la **evidencia** que justifica cada asignación.

### 5.1 Básico — la IA de hoy, intacta

**Cero cambios de comportamiento.** El pasajero llega y `aiPlayer` lo ignora: `?? 'basico'`
devuelve exactamente el código de hoy.

**Sus puntos ciegos son identidad del nivel, no defectos a corregir.** Se nombran para que ninguna
tanda futura los «arregle» por su cuenta creyendo que ayuda:

| Punto ciego | Dónde |
|---|---|
| **No protege el 7 de Oros en N=4**, aunque ahí también es comodín y vale 10 | `aiPlayer.js:164` protege sólo si `ruleN === 5`; `handEvaluator.js:3` da comodín en 4 y 5 |
| **No lee el pote.** `state.pot` le llega y no lo usa ni una vez | única aritmética de bote: `toCall ≤ unit*2` en `:129`, `:137`, `:145` |
| **El Ajilei es un tell perfecto**: agresión total e incondicional | `aiPlayer.js:98-100` |
| **Descarta todo lo que no sea del mejor palo**, sin matices | `aiPlayer.js:161-168` |

Un principiante debe poder ganarle. **Ese es el trabajo del nivel.**

### 5.2 Avanzado — Básico + ③ + ④sí

**③ Estrategia completa de comodín** — 🟢 **verde** (NIV-0: *«ya le llega todo; lo que falta es
estrategia, no información»*). `handRules.ruleN` y `handRules.comodinValue` ya viajan a las dos
funciones (`aiPlayer.js:83-84`, `:156-158`).

- **Protección también en N=4**, no sólo en N=5. Cierra el punto ciego de §5.1.
- **La apuesta distingue** un puntaje **con** comodín de uno **sin** comodín del mismo valor: hoy
  `getBestSuitScore` suma los 10/11 puntos (`handEvaluator.js:28`) y la decisión de apuesta no
  distingue el origen. Avanzado sí.

**④ Disciplina de bote — la mitad «sí», no la mitad «cuánto»** — 🟢 **verde para *si*** /
🔴 **rojo para *cuánto*** (NIV-0).

- **Entra:** lectura de `state.pot` y decisión de igualar/retirarse con **matemática de bote**.
  Todo el insumo ya está en el estado que recibe: `pot`, `toCall` (`:86`), `ai.chips`,
  `ai.contrib`, `unit`, y los `contrib` de todos los asientos.
- **Queda explícitamente fuera:** **el tamaño de la apuesta.** `applyAIBetAction` pasa
  `state.unit` fijo e **ignora cualquier monto** que la decisión devolviera
  (`gameEngine.js:482`). Elegir tamaño es tocar el motor, y el motor no se abre en esta fase.
  **Todos los montos de todos los niveles son múltiplos de `unit`.**

### 5.3 Pro — Avanzado + ② + ⑥ + Ajilei disimulado

**② Inferencia de descartes, por el atajo verde** — 🟡 amarillo por la vía limpia,
🟢 **verde por el atajo** (NIV-0).

Dos mitades, y ninguna toca el motor:

1. **Descartes de las otras IAs:** `aiPlayer` decide por **todos** los asientos IA
   (`gameEngine.js:500-502`), así que **memoriza lo que él mismo decidió**. Es su propia memoria,
   no información ajena.
2. **Descarte del humano:** el humano nunca pasa por `decideDiscard`. Pero la longitud de
   `state.deck` cae **exactamente** en el total de descartes de la ronda (`gameEngine.js:511`);
   restando lo propio, se deduce lo ajeno.

> **Por qué esto es simetría y no privilegio.** El número de cartas que cada quien cambió **es
> información que el juego anuncia en voz alta**: el mensaje de mesa lo dice literalmente
> —*«Descartaste 3, la IA descartó 2»*, `gameEngine.js:517-520`— y el taco menguante está a la
> vista de todos. El humano ve ese dato **gratis**; que la IA de nivel Pro lo use es ponerla a la
> par, no por encima. **D-5 sigue intacta**: se lee la **longitud** del mazo, jamás su contenido —
> y la trampa `Proxy` ampliada (§2.1b) es la que lo prueba, no la buena fe.

**⑥ Farol estratégico, por frecuencia** — 🟢 **verde, con techo** (NIV-0).

- **Montos siempre en `unit`** (techo de ④). La única variable expresiva del farol es la
  **frecuencia**, no el tamaño.
- **Respaldado por la lectura de descartes**, no lanzado a ciegas: un rival que cambió cuatro
  cartas es un rival contra el que el farol tiene sentido. **Farol informado, no farol aleatorio**
  — la diferencia es exactamente D-4.

**Ajilei disimulado — exclusivo de Pro.**

Hoy el Ajilei dispara agresión total e incondicional (`aiPlayer.js:98-100`), y por eso es un tell
legible: quien sube sin pestañear tiene la mano perfecta. Pro puede **jugarlo lento y engordar el
pote** en vez de anunciarlo.

**Básico y Avanzado conservan el tell honesto.** No es un descuido heredado: es lo que hace que la
escalera se **sienta** distinta. En Pro, la calma también puede ser una mano perfecta.

### 5.4 Lo excluido y lo diferido

| | Capacidad | Motivo |
|---|---|---|
| **EXCLUIDO de la fase** | **① Conteo de cartas salidas** | 🔴 **Rojo estructural.** El motor **destruye** los descartes (`applyDiscard` sobreescribe en sitio, `gameEngine.js:509-511`) y **no existe pila de descarte**. Además la IA **nunca es llamada en SHOWDOWN/PAYOUT**. El dato **no existe para pasarlo**. Ver §8. |
| **DIFERIDO** | **⑤ Modelado adaptativo del humano** | 🟡 Amarillo, pero por la razón equivocada para actuar ahora: la IA puede acumular conducta, **pero nunca ve el desenlace** (mismo hueco de ①). **Un modelo sin desenlace aprende mal** — aprendería que la agresión funciona sin saber jamás si estaba respaldada. Espera el **gancho de showdown**. |

### 5.5 Arquitectura «hermanas mayores»

**Las capacidades se apilan sobre los cuatro perfiles de personalidad existentes.** No los
sustituyen, no los reescriben, no los promedian.

> **Temperamento ⊥ inteligencia.** El perfil (CONSERVADORA · EQUILIBRADA · AGRESIVA ·
> IMPREDECIBLE, `aiPlayer.js:12-17`) dice **cómo se comporta**. El nivel dice **cuánto entiende**.
> Son ejes **ortogonales**: una CONSERVADORA de Pro es cautelosa **y** aguda; una AGRESIVA de
> Básico es lanzada **y** ciega. **Ningún nivel reemplaza el ADN.**

De ahí el nombre: las de Pro no son *otras* IAs, son **las hermanas mayores de las mismas cuatro**.
Doce combinaciones (4 perfiles × 3 niveles), un solo reparto sin repetición por mesa
(`aiPlayer.js:36-44`), una sola identidad reconocible por asiento.

**Prohibido el multiplicador ciego de agresión (D-4).** Subir de nivel **no es** bajar umbrales ni
subir la probabilidad de los dados `0.6`/`0.7` (`:135`, `:143`). Una IA que apuesta más sin
entender más no es más difícil: es más fácil de explotar y menos creíble.

> **La agresividad de Pro es estratégica, respaldada por lectura.** Si una tanda no puede explicar
> **qué leyó** la IA antes de subir, esa subida no entra.

---

## 6. Puntos de ranking — **SELLADO, durmiente hasta Supabase**

**Nada se acumula hasta el login.** La tabla se sella hoy para que la implementación no la
improvise el día que llegue el ledger; **no se implementa en esta fase**.

### 6.1 Vs IA — por nivel, plano

| Rival | Puntos por **mano ganada** |
|---|---|
| IA **Básico** | **1** |
| IA **Avanzado** | **2** |
| IA **Pro** | **3** |

**Plano: sin componente de mesa.** Ganarle a cuatro IAs de Básico da lo mismo que ganarle a una.
Contra máquinas, lo que se puntúa es **a qué máquina**.

### 6.2 Vs humanos — por cantidad de gente

Por **jugadores sentados al barajado del Pie de esa mano**:

| Jugadores | Puntos por mano ganada |
|---|---|
| 2 | **5** |
| 3 | **6** |
| 4 | **7** |
| 5 | **8** |

### 6.3 La foto — misma doctrina que `handRules`

**El número se congela al reparto y no se vuelve a mover en toda la mano.** Lo que ocurra durante
la mano —retiros, subidas, quiebras— **no altera sus puntos**.

Esto **no es una regla nueva**: es exactamente HR-1 (`gameEngine.js:27-39`), donde los parámetros
de la mano se fijan en el barajado del Pie según los vivos **en ese instante**, los `folded` jamás
los alteran, y la bancarrota sólo pesa en el barajado siguiente.

> **Fuente única, prohibida la calculadora paralela.** El número de jugadores que manda es el
> **mismo** que ya congela `makeHandRules` en `startHand` — `alive` en `gameEngine.js:381`,
> sellado en `handRules` en `:441`. La aritmética del ranking es, literalmente,
> **`ruleN + 3`**. Ningún módulo puede recontar asientos por su cuenta: ese fue el accidente que
> HR-1 vino a cerrar, y volver a abrirlo por la puerta del ranking sería repetirlo con otro
> nombre.

**Ejemplo canónico:** una partida arranca en **5** → sus manos valen **8** puntos. Se retiran tres
jugadores → la mano siguiente **arranca en 2** → vale **5** puntos. El recálculo ocurre **en cada
mano nueva**, en el barajado, nunca a mitad de mano.

### 6.4 La asimetría, deliberada

**Vs humanos la dificultad es la cantidad; vs IA, el nivel.** No es una inconsistencia de diseño:
son dos ejes distintos de lo que hace difícil una mano. Contra gente, cinco cabezas pensando son
más difíciles que una. Contra máquinas, cinco clones de Básico no son más difíciles que uno —
**pero un Pro sí**.

**Diferido, sin cambios:** la decisión anti-coerción de mesas privadas sigue esperando a
**PvP/torneos**. No se toca aquí.

---

## 7. Lista de protegidos — ampliación

**A partir de la fase 4, la lista de archivos protegidos es de cinco:**

| Archivo | Estado |
|---|---|
| `src/engine/gameEngine.js` | protegido |
| `src/engine/aiPlayer.js` | protegido |
| `src/config/seatLayouts.js` | protegido |
| `src/styles/opponentPanel.css` | protegido |
| **`src/engine/deck.js`** | **protegido — nuevo** |

`deck.js` entra porque NIV-0 §5 lo situó en el segundo eje del azar del juego
(`Math.random()` en `deck.js:45`): mientras estuvo fuera de la lista, la baraja era el único
componente de la partida modificable sin ceremonia.

**Forma de la ampliación.** Esta declaración **amplía** las listas de
`AJILEI_Sistema_Diseno_v1.2.md:12` y `AJILEI_Plan_Tandas_Landscape_v1.0.md:25` **sin editarlas**.
Ambos documentos **heredan esta línea en su próximo salto natural de versión**. Se declara arriba
y se recoge abajo — el mismo molde con que la v1.4 archivó una doctrina sin borrar la v1.2.

### 7.1 Excepción pre-autorizada — única, y sólo para `deck.js`

> **Siembra del azar** (`seed` / PRNG inyectable) **al servicio del banco de simulación**.
> Autorizada de antemano: no requiere ceremonia.
>
> **Cualquier otro cambio en `deck.js` — ceremonia completa.** La excepción cubre el
> *cómo se sortea*, jamás *qué hay en la baraja* ni *cuánto valen las cartas*.

**La siembra gemela de `aiPlayer.js`** —las cuatro fuentes de `Math.random()` del archivo:
`:29` sorteo de perfiles, `:69` jitter, `:135` y `:143` dados de subida— **no** está
pre-autorizada: viaja con la **ceremonia normal de NIV-1/NIV-2**, que son las tandas que abren ese
archivo de todos modos.

---

## 8. Deuda de motor registrada — fuera de fase

**Los dos rojos de NIV-0 son un mismo hueco**, y vive en `gameEngine.js`:

| Pieza que falta | Evidencia |
|---|---|
| **No existe pila de descartes.** `applyDiscard` sobreescribe las cartas en sitio con `deckCopy.shift()`; lo reemplazado simplemente se pierde. | `gameEngine.js:509-511` |
| **La IA nunca es llamada en SHOWDOWN ni PAYOUT.** Sus dos únicos puntos de invocación son la apuesta y el descarte. | `gameEngine.js:481` y `:502` |

**Qué bloquea:** **① completo** (conteo de cartas salidas más allá de las propias) y **la capa
profunda de ⑤** (modelado con desenlace, el que cierra el bucle de aprendizaje).

**Queda anotada con nombre para una futura apertura del motor.** No se abre aquí, no se planifica
aquí, y ninguna tanda de esta fase puede tomarla como excusa para tocar `gameEngine.js`.

---

## 9. Red de pruebas — brechas heredadas

NIV-0 §6 dejó el inventario: **`testAI.test.js` es el único archivo que ejercita la IA real**; los
otros tres que la tocan (`testEngine:12`, `testEliminations:9`, `testHandRules:32`) la **mockean**
—lo cual sella el contrato de llamada y **no da cobertura de estrategia**—.

**Decisiones de la IA sin red hoy:**

| # | Decisión sin cubrir | Dónde |
|---|---|---|
| 1 | **Umbrales de perfil.** Nada verifica que CONSERVADORA sea más estrecha que AGRESIVA; sólo que los **nombres** se reparten. A efectos de prueba, los cuatro perfiles son intercambiables. | `aiPlayer.js:12-17` |
| 2 | **Ajustes de listón** por oponentes y por posición Mano/Pie | `:108`, `:111` |
| 3 | **Jitter de IMPREDECIBLE** — nada confirma que ese perfil sea más variable | `:67-71` |
| 4 | **Dados de subida 0.6 / 0.7** — ni la rama ni la proporción | `:135`, `:143` |
| 5 | **Degradado `canAffordRaise` → igualar** (sólo se prueba el retiro por saldo) | `:95`, `:127` |
| 6 | **Call barato de BET_1** y bandas `callMin + 4` | `:129`, `:136`, `:144` |
| 7 | **Política de descarte** — que se tire *todo* lo que no es del mejor palo; mano monocolor → `[]` | `:161-168` |
| 8 | **Fallback de fase desconocida** | `:149` |
| 9 | **Guarda de retirado** — sin test unitario | `:79` |

> **Regla de la fase — normativa.** **Cada tanda de nivel trae su propia red.** La red actual
> protege la **integridad** (D-5), la **legalidad** (saldos, conservación, topes) y la
> **vitalidad** (no se retira con mano fuerte). Lo que no protege es exactamente **la calidad de
> juego** — que es justo lo que la escalera mueve.
>
> **La calidad de juego que un nivel introduce debe quedar medida, no supuesta.** Una capacidad de
> §5 que no venga con la prueba que demuestra que actúa, no entra. Esto se suma —no sustituye— a
> la puerta obligatoria de la trampa `Proxy` (§2.1b).

Las nueve brechas heredadas **no son deuda de esta fase**: se registran para que ninguna tanda las
dé por cubiertas. Las que caigan dentro del radio de una tanda de nivel, se cierran con ella.

---

## 10. Plan de tandas de la fase

| # | Tanda | Qué hace | Δ jugable |
|---|---|---|---|
| 1 | **NIV-DOC** | *Esta.* Doc-only. | 0 |
| 2 | **NIV-B0** | **Banco de línea base.** Script permanente, molde `diagDSK`, **cero cambios en `src/`**. Mide la tasa de victoria de la IA actual con `simHand` (`testAI.test.js:82-92`), que ya corre manos completas headless. **Las bandas objetivo por nivel se fijarán relativas a esa línea**, no a un número inventado. | 0 |
| 3 | **NIV-UI** | Las **dos pantallas** (§4) + **tablas por nivel** (§3.3) + **pasajero cableado end-to-end**, con `aiPlayer` **ignorándolo aún**. **Δ=0 jugable**: la partida se comporta exactamente igual, y el cableado queda probado antes de que nada dependa de él. | **0, a propósito** |
| 4 | **NIV-1** | **Avanzado** — ③ + ④sí (§5.2), con su red (§9). | Avanzado juega distinto |
| 5 | **NIV-2** | **Pro** — ② + ⑥ + Ajilei disimulado (§5.3), con su red. | Pro juega distinto |
| 6 | **Calibración** | Contra las bandas de NIV-B0. | ajustes |
| 7 | **Cierre** | **Precio de *Mano actual*** post-20 (§1.3), con las tablas y las bandas ya en la mano. | — |

**La forma del plan tiene un motivo:** NIV-B0 mide **antes** de que exista algo que medir mal, y
NIV-UI cablea **antes** de que haya comportamiento que confunda un fallo de cableado con un fallo
de estrategia. Cuando NIV-1 cambie el juego, las dos preguntas —*¿llega el nivel?* y *¿cuánto
gana la IA de hoy?*— ya estarán contestadas.

---

## 11. Lo que queda abierto y lo que se reporta

### 11.1 Abierto — se resuelve en esta fase

- **Precio de *Mano actual* post-20 consultas.** Única decisión abierta de la fase (§1.3). Se
  calibra al final (§10, paso 7), con ancla actualizada a **50** y la opción **porcentaje de
  mesa** todavía sobre la mesa. **Autoridad: `AJILEI_Menu_Utilidades_v1.4.md`** y su cadena.

### 11.2 Reportado — no resuelto aquí

Conforme al mandato de **reportar y no resolver**:

1. **D-1 · D-2 · D-3 — transcritas y verificadas, sin hallazgos.** Llegan por transcripción
   literal desde el registro de la sesión de la v0.1 (§2) y se contrastaron una por una contra
   todo lo sellado en §3–§10: **ninguna contradicción**. D-1 («tres niveles, el actual como base»)
   es §3.1, §3.2 y §5.1–§5.3; D-2 («libre elección, no desbloqueo») es §4.2, donde además quedó
   explícito que **la memoria preselecciona pero jamás salta la pantalla**; D-3 (orden dificultad →
   mesa → monto) es §4.1, con la precisión de que **fija un orden de decisión, no un número de
   pantallas** —fundir mesa y monto en una superficie no invierte ni salta ningún paso, porque
   ambos responden *«qué arriesgo»* y la dificultad responde *«contra quién juego»*—.
2. **Precisión sobre el ancla, no contradicción.** `AJILEI_Menu_Utilidades_v1.1.md:145` ancla el
   precio al *«ante mínimo (100)»*. Dos matices: **(a)** ese «ante» es la **entrada de mesa más
   baja** (`STAKE_OPTIONS[0]`), no `betting.entrada` (10) ni `betting.apuestaMinima` (10) —el
   código tiene tres números que admiten ese nombre—; **(b)** con Básico esa magnitud pasa a
   **50**. **El principio de la v1.1 no se toca**: barato relativo, comodidad y no peaje.
3. **Sin contradicción con la v1.4.** Lo relativo a *Mano actual* y *Sugerencias* se
   **referencia**, no se duplica ni se re-decide. La corrección **12 → 20** del borrador v0.1 no
   es un choque con la cadena de Utilidades: **la cadena siempre dijo 20** (v1.1 §3.4), y el
   código lo implementa así (`CONSULTAS_GRATIS = 20`). Era el borrador el que estaba desfasado.
4. **Sin v0.1 en el repositorio contra la cual contrastar** (§0). Si aparece y contradice algo de
   este delta, la regla se mantiene: **reportar, no resolver.**

---

## 12. Historial de versiones

- **v1.0 · errata e1** — 2026-09-17 (**APU-1 Fase 1a**). **Corrección de un error de hecho en
  §3.3**, levantado como **I-1a/I-1b** por `docs/reportes/AJILEI_APU-1_Fase0_Informe_v1.0.md`. El
  documento describía la apuesta como **«costo único por partida»** con un pozo único; el código
  la cobra como **ante de cada mano** desde antes de que este documento existiera. Se corrige el
  enunciado, **se conservan las tres tablas de montos** (que eran correctas) y **se retiran** la
  tabla de rango del pote y la nota del 20 % del `saldoInicial`, porque describían la primera mano
  y no una partida. La autoridad sobre el dinero pasa a **`AJILEI_APU-1_Reglas_v1.0.md`**, que se
  declara a sí mismo sustituto de esta §3.3.
  **§7 (lista de protegidos) queda subsumido por `AJILEI_Protegidos_v1.0.md` v1.4**, que recoge los
  seis archivos y la excepción pre-autorizada de siembra —ampliada por decisión de Victor del
  2026-09-17 (L-3) a `aiPlayer.js` además de `deck.js`—. Nada más de este documento se toca.
  **Por qué «errata e1» y no «v1.1»:** el nombre v1.1 ya lo ocupa
  `AJILEI_Modos_y_Asistencia_v1.1.md`, un documento distinto y posterior (NIV-CAL, 2026-08-15) que
  es la cabeza viva de esta cadena. Esta cadena versiona **por archivo**, no por cabecera, así que
  subir la cabecera del v1.0 a v1.1 habría creado dos documentos con el mismo nombre de versión y
  distinto contenido. Queda consignado en el informe de la tanda §D.
- **v1.0** — 2026-08-14. **Primera versión en el repositorio.** **Ratifica las ocho decisiones
  D-1…D-8 con su enunciado literal** —las tres primeras transcritas desde el registro de la sesión
  de la v0.1— y las desarrolla. Sella la escalera
  **Básico · Avanzado · Pro**: tres tablas de entrada (**50/100/150/250 · 100/200/300/500 ·
  200/400/600/1000**, pote = monto × jugadores) con las apuestas de hoy subiendo a Avanzado y la
  IA de hoy quedando como Básico. **D-6 se implementa por la Vía C** — pasajero **`state.nivelIA`**
  creado por la UI en `GameTable.jsx:268` y leído con `?? 'basico'`, que **no toca una línea de
  `gameEngine.js`** y deja fixtures y mocks intactos; **D-7 queda satisfecha por construcción**
  (nace con la mesa, muere con el componente). **D-5 gana dos renglones**: la limpieza actual es de
  **conducta, no de encapsulación**, y la **trampa `Proxy` de `testAI.test.js:177-233` pasa a ser
  puerta obligatoria** de toda capacidad nueva. **Capacidades asignadas** con los semáforos de
  NIV-0 como evidencia: Avanzado suma ③ comodín completo y ④ disciplina de bote *(sizing fuera:
  `gameEngine.js:482` impone `unit`)*; Pro suma ② inferencia de descartes por el atajo verde
  —simetría, no privilegio: el juego ya anuncia los conteos— , ⑥ farol por frecuencia y el
  **Ajilei disimulado**, exclusivo suyo. **① excluido** (rojo estructural) y **⑤ diferido**
  (modelo sin desenlace aprende mal); ambos anotados como **deuda de motor** con nombre. Arquitectura
  **hermanas mayores**: temperamento ⊥ inteligencia, **prohibido el multiplicador ciego de
  agresión**. **Dos pantallas** (dificultad → mesa con apuesta integrada y dinámica), tres niveles
  siempre visibles, Básico preseleccionado, última elección recordada. **Puntos de ranking
  sellados y durmientes** hasta Supabase: vs IA 1/2/3 plano, vs humanos `ruleN + 3` congelado al
  reparto con la **misma foto y la misma doctrina que `handRules`**. **Lista de protegidos ampliada
  a cinco** con `deck.js`, cuya **única excepción pre-autorizada** es la siembra del azar para el
  banco de simulación. Doc-only; la implementan **NIV-B0 → NIV-UI → NIV-1 → NIV-2**.
- **v0.1** — 2026-07-31. **Borrador de conceptualización, fuera del repositorio.** Origen de las
  decisiones **D-1…D-8**. Superada en tres puntos por esta v1.0: *Sugerencias* descartada,
  *Mano actual* implementada con **20** consultas gratis (no 12), y precio post-20 calibrable con
  ancla nueva.
