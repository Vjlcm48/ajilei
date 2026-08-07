# AJILEI — Menú de Utilidades v1.2

**Estado:** Revisión de especificación. Sustituye a `AJILEI_Menu_Utilidades_v1.1.md`.
**Fecha:** 2026-08-07
**Base de código:** HEAD `b1d9359` (DSK-U1b). Implementado en la tanda **DSK-U2**.
**Naturaleza:** **Delta sobre la v1.1.** Todo lo que esta revisión no modifique explícitamente
sigue vigente tal como está escrito en la v1.1 y, a través de ella, en la v1.0: disparador ⋮,
panel flotante `fixed` z:30, apertura abajo-derecha, cierre por tipo de entrada, timer heredado,
panel a solo-iconos, badge contador y su popup. Lo que cambia es **qué es la entrada 💬**.
**Autoridad visual:** `AJILEI_Sistema_Diseno_v1.2.md`.

---

## 1. Qué cambia — la entrada 💬 se redefine

La v1.1 §2 describía **"Mensajes"** como un **toggle** que silenciaría los mensajes narrativos
del centro de mesa. **Esa lectura queda descartada.** La entrada 💬 pasa a ser el disparador de
un **sistema de reacciones preconfiguradas entre jugadores**.

| | v1.1 | **v1.2** |
|---|---|---|
| Nombre | Mensajes | **Reacciones** |
| Tipo | Toggle (deshabilitado) | **Acción viva** — abre un selector |
| Efecto | Silenciar narrativas del óvalo | **Enviar una frase** que aparece como burbuja sobre el emisor |
| Estado | Deshabilitada | **Funcional desde esta tanda** (circuito humano) |

**Los mensajes del juego quedan SIEMPRE VISIBLES, sin conmutador.** No hay nada que silenciar:
la crónica del óvalo es parte del juego, no ruido opcional.

### 1.1 La clasificación imprescindible/narrativa — DESCARTADA

Queda **descartada**, con el mismo molde que la v1.1 §2.1 aplicó a *Sugerencias*: **se marca
descartada y no se borra del historial documental.** La v1.1 permanece íntegra en el repositorio
como registro de la decisión original y de su reversión.

Alcanza a: **v1.1 §2** (párrafo "Semántica (resuelta 2026-08-04)"), **v1.1 §7.1**, y el
**apéndice §9c, §9d y §9e** (regla de clasificación por fase+emisor, las cuatro familias dudosas
y los tres emisores externos).

> **Motivo:** la clasificación existía para alimentar un toggle que ya no existe. Sin conmutador
> que decida qué callar, etiquetar cada familia no resuelve ningún problema vivo.

**Sobrevive como insumo técnico**, y por eso el trabajo no se pierde: el mapa de emisión de los
mensajes y la desambiguación por transición `(prev, next)` en los 10 sitios `setGame` de
`GameTable` son exactamente los **ganchos de evento** que U2b necesitará para disparar las
reacciones contextuales de las IAs (§6).

### 1.2 Deuda heredada que esta tanda NO salda

El gancho CSS **`is-off`** que la v1.1 §9f prometió («la entrada refleja el estado con glifo **y**
clase») **se aplica en JSX pero no tiene ninguna regla de estilo**. Al desaparecer el toggle de
Mensajes, la deuda **queda acotada a Sonido**, y **fuera del alcance de esta tanda**. Se anota
aquí para que no se pierda.

---

## 2. Las 12 reacciones — CONTENIDO SELLADO

Orden del selector (izquierda→derecha, arriba→abajo). El **emoji es parte de la frase**: se sella
junto al texto, viaja con él y es **estático** — ni animación ni sprite.

| # | Frase | | # | Frase |
|---|---|---|---|---|
| 1 | ¡Ajilei! 🎴 | | 7 | Aquí no se regala nada 😏 |
| 2 | ¡Eso, chamo! 🙌 | | 8 | Camarita, te estoy mirando 👀 |
| 3 | Eso estuvo fino, chamo 👌 | | 9 | Pana, qué mano te salió 😳 |
| 4 | Suerte la próxima 🤝 | | 10 | Tú y yo sabemos cómo es esto 🤨 |
| 5 | ¡Me lleva el diablo! 😤 | | 11 | ¡Qué va! 🤦 |
| 6 | ¡Eso fue trampa! 😂 | | 12 | No me hagas eso, pana 😅 |

**Fuente única:** `src/config/reacciones.js`. El selector las pinta en este orden, la burbuja
muestra la elegida y **el arnés las importa de ahí** — jamás una lista paralela, que se
desincronizaría al primer retoque de redacción.

---

## 3. El selector

- **Disparador:** la entrada 💬 del panel de utilidades. **Cierra el menú al ejecutar**, como su
  hermana Sonido (v1.1 §1.3.1) — el panel no tiene nada más que decir y el selector lo releva.
- **Superficie propia**, no un submenú: el panel mide 64px de ancho (v1.1 §10a) y una rejilla de
  12 frases no cabe dentro.
- **Anclado al ⋮** por su borde **derecho** (molde del popup del contador): el ancho puede crecer
  con la rejilla sin recalcular el ancla.
- **Hermano del área**, `position: fixed`, `z-index: calc(--dsk-u1-panel-z + 1)` = **31**. Nace
  del menú y debe pintarse sobre él. No coexiste con el popup del contador (ambos son
  excluyentes por construcción), así que comparten peldaño sin conflicto.
- **Rejilla 3×4.** Elegida sobre 2×6 por el criterio de la tanda: **ninguna de las dos toca
  cartas ni botones del humano en ninguna de las 20 celdas** (0,00% las dos), y el empate lo
  rompe la **oclusión total** — 3×4 es menor en **19 de las 20** (media 34,97% contra 44,28%).
- **Fila de 44px**, el mismo estándar táctil que la v1.1 §10a exige a las entradas del panel.
- **Estética del panel de utilidades:** superficie del sistema (`--surface-modal`), filete
  `--gold-brand` de 1px, radio 8, **una** sombra.

### 3.1 Tres vías de cierre

1. **Clic fuera** — `pointerdown` en captura, **sin overlay** (molde H4/U1): el clic cierra el
   selector **y** su acción procede. Un overlay se tragaría el primer clic sobre los botones de
   acción, y este selector vive **durante** la mano.
2. **`Esc`** — listener montado **sólo mientras el selector vive**.
3. **Selección** — elegir una frase **envía y cierra**.

---

## 4. La burbuja

- **Overlay puro**: fuera de flujo, `position: fixed`, **Δ=0 de layout por construcción** — no
  ocupa una sola celda del flujo. Verificado 0,00 en las 20 celdas.
- **Hermana del área**, jamás dentro de `.opp-panel` ni de `.ai-zone` (§5.2).
- **`z-index: 25`** — por encima de todo lo que vive dentro del área (censo vivo: techo real
  **10**, el `+N` del pozo; paneles revelados 7; sobrevuelo Z1 9) y **por debajo del panel del
  menú (30)**: si llega una reacción mientras el humano tiene el selector abierto, no se le tapa
  la superficie que está tocando. Muy por debajo de los modales (100/120), que sí deben taparlo
  todo.
- **`pointer-events: none`** en todo el cuerpo. La **única** parte viva es la X.
- **Pico de triángulo invertido** apuntando al nombre del emisor. **Visible para todos, incluido
  el emisor.**
- **Texto 14**, superficie del sistema, **filete neutro — sin oro**. El único acento dorado de la
  familia del menú sigue siendo el del badge del contador (v1.1 §10c).

### 4.1 Ciclo de vida y candado

| Tramo | Duración |
|---|---|
| Entrada | **0,3 s** |
| Visible | **2,4 s** |
| Salida | **0,3 s** |
| **Total** | **3,0 s** |

- **Una a la vez.** Con burbuja viva, el envío está bloqueado.
- **La duración vive UNA sola vez**: las constantes de `src/config/reacciones.js` viajan al CSS
  como `--u2-dur` en línea. El keyframe **no repite ninguna cifra de tiempo**: sólo **reparte**
  el total en sus dos topes — `300/3000 = 10%` cierra la entrada y `(300+2400)/3000 = 90%` abre
  la salida. Es el arreglo de la deuda que `GameTable.jsx:38-42` dejó anotada para
  `ELIM_NOTICE_MS`, donde la duración sí vive dos veces.
- Sólo `opacity` y `transform` — ley del sistema v1.2 §5.1.

> **Corrección de aritmética respecto al encargo.** La orden de implementación pedía «topes
> 10/80/100%». Con el total de 3,0 s, el 80% daría **0,3 / 2,1 / 0,6**, que contradice los
> tramos sellados en la misma frase. Los topes correctos para **0,3 / 2,4 / 0,3** son
> **10 / 90 / 100**. Manda el reparto sellado; se implementó 10/90/100 y se registra aquí.

### 4.2 La X de cierre anticipado

- Glifo discreto dentro de la burbuja, **hitbox ≥40px** por el **patrón embaldosado B2**
  (`::after` transparente con insets negativos, bajo `@media (pointer: coarse)`).
- **Mata la burbuja al instante**, con guardia de id (molde `potFloat`): un temporizador viejo
  jamás mata una burbuja nueva.
- El hit crece **hacia dentro** de la burbuja, **nunca hacia la derecha**: desbordar por ahí lo
  llevaría hacia la primera carta del humano. Mismo escrúpulo que confinó el hit del badge del
  contador a su propia fila (v1.1 §10c).
- **Cierra SÓLO lo visual.** El cooldown ni se entera.

### 4.3 Cooldown

**5 s desde el envío**, constante ajustable (`REACCION_COOLDOWN_MS`). **Indiferente a la X**:
cerrar la burbuja antes de tiempo es un gesto visual, no un permiso para volver a hablar.

Durante el cooldown la entrada 💬 queda inerte con **clase propia** (`is-cooling`), **nunca**
con `is-disabled`: aquélla es la lengua de «no habilitado» (permanente, v1.0 §3) y esto es un
estado **temporal** de una entrada que sí está habilitada.

---

## 5. Reglas nuevas (aplican a cualquier tanda futura)

### 5.1 Anclaje por TINTA, jamás por caja

Los nombres de jugador llevan **reserva fija de 12ch** (DSK-P1/H1/H2) con el texto alineado a la
izquierda. El centro de la **caja** queda lejos del centro de la **tinta**:

| Ruta | Desfase caja↔tinta | Ancho de la tinta |
|---|---|---|
| `OpponentPanel` (mesas 5/4/3) | **31,80px** | 23,14 (`"IA 1"`) |
| `.ai-zone` (mesa 2) | **37,05px** | 12,66 (`"IA"`) |
| Banda humana | **37,98px** | 17,47 (`"Tú"`) |

El desfase **supera al ancho del propio nombre** en las tres rutas: un pico centrado en la caja
apuntaría a espacio vacío. **El rect bueno es el del `Range` sobre el contenido**
(`document.createRange().selectNodeContents(el)`).

### 5.2 Molde de capa: hermano del área, nunca hijo de un panel

`.opp-panel` es `position: relative` con `z-index` (1, y **7** revelado): **un contexto de
apilamiento** que atraparía cualquier hijo absoluto. Y la coreografía R2 le aplica `transform`,
lo que anclaría un `fixed` descendiente **al panel** en vez de al viewport.

Toda superficie flotante nueva se monta como **hermana del área**, vecina de las cartas
voladoras y del panel de utilidades: ahí el `fixed` ancla al viewport (cadena sin `transform`,
verificada) y los tokens `--dsk-*` del bloque DSK siguen heredando.

### 5.3 Las cartas propias son inocluibles

Ninguna superficie efímera puede taparle al humano sus propias cartas. Cuando la geometría no lo
permita de forma simétrica, **la asimetría es preferible a la oclusión**: desplazar, encoger o
anclar distinto está permitido mientras el pico alcance el nombre.

**Aplicación en esta tanda.** El nombre del humano vive en `.player-bar`, **debajo** de las
cartas, y entre cartas y barra hay sólo **8px**: una burbuja anclada sobre él cae necesariamente
sobre el abanico. La solución es un **tope de ancho derivado del corredor vivo** — del filo útil
izquierdo del área a la primera carta, medido **136,5..289,73px** según mesa y viewport — más el
clamp del cuerpo contra ese filo. Las frases largas **envuelven**: encoger es la mitigación, y es
deliberada.

**Resultado medido: 0,00% de oclusión de cartas propias en las 20 celdas**, con el pico dentro de
la tinta del nombre en todas.

> **Nota de trazabilidad.** El diagnóstico de fase 1 reportó 52,59–71,44% para este mismo caso.
> Aquella cifra medía contra `.cards-row` —el **contenedor**, que abarca el mazo y los márgenes—
> y no contra los slots de carta. Medido contra las cartas reales, el peor caso antes del tope
> era 9,81%; con el tope, 0,00%.

---

## 6. Alcance de esta tanda y lo que queda

**Entregado (DSK-U2):** el **circuito humano completo** — entrada 💬 viva, selector 3×4 con sus
tres cierres, burbuja anclada por tinta con su ciclo de 3,0 s, candado de una a la vez, X de
cierre anticipado y cooldown de 5 s.

**Diferido a U2b:** **la respuesta de las IAs.** Verificado factible **sin tocar los protegidos**
(`gameEngine.js` y `aiPlayer.js`, restricción general del sistema de diseño):

- `aiPlayer.js` **ya exporta** `getPersonalityName(aiIndex)` → `CONSERVADORA | EQUILIBRADA |
  AGRESIVA | IMPREDECIBLE | null`. Lectura directa del perfil por asiento, cero líneas nuevas.
- **Cautela registrada:** devuelve `null` hasta la primera decisión de apuesta de una IA no
  retirada y sin Ajilei de la sesión (`_ensurePersonalities` vive tras dos `return` tempranos), y
  adelantarlo llamando a `initPersonalities` **no es seguro** — el re-barajado por `isNewSession`
  puede desfasar el perfil leído. **Camino limpio: lectura perezosa + frase neutra.**
- Los **ganchos de evento** ya están inventariados y vivos en `GameTable` (§1.1): `inferAction`,
  el delta del pozo, el plan de descarte, las transiciones de fase, el ganador, la eliminación,
  el turno y el curiosear.
- Cuando la burbuja del rival viva, su anclaje sale de §5.1 en **las dos rutas**
  (`.opp-name` y `.ai-name`), y su colocación del clamp genérico contra los filos del área.

---

## 7. Historial de versiones

- **v1.2** — 2026-08-07. La entrada 💬 se redefine como **Reacciones**: selector en grilla 3×4
  con las **12 frases selladas**, burbuja de 3,0 s (0,3/2,4/0,3) anclada **por tinta** al nombre,
  capa 25 (área) / 31 (selector), X de cierre anticipado **solo visual** con hit ≥40 por
  embaldosado B2, y **cooldown de 5 s indiferente a la X**. La clasificación
  imprescindible/narrativa queda **archivada como descartada** (molde *Sugerencias*): los
  mensajes del juego son siempre visibles. Reglas nuevas de alcance general: **anclaje por
  tinta**, **molde de capa hermano-del-área** y **cartas propias inocluibles**. Respuesta de las
  IAs diferida a **U2b**, con factibilidad verificada y cautelas registradas. Implementado en la
  tanda **DSK-U2**, con modo `u2` permanente del arnés (10 puertas × 20 celdas + sub-pasadas de
  ciclo/reloj y `pointer: coarse`).
- **v1.1 · apéndice U1b** — 2026-08-06. Panel a solo-iconos con tooltips, ficha `ChipToken` para
  Saldo y SVG propio de carta con "?" para Mano actual, badge contador con `ajilei.consultas` y
  popup informativo con sus dos cierres.
- **v1.1 · apéndice de implementación** — 2026-08-05. Apertura abajo-derecha uniforme y panel
  `fixed` z:30 sin portal, timer heredado con su razón de diseño, clasificación de mensajes por
  fase+emisor *(descartada en v1.2 §1.1)*, sonido persistente con mute real, estado inerte de las
  otras tres entradas e insumo verificado de "Mano actual".
- **v1.1 · enmienda** — 2026-08-04. Semántica del toggle de Mensajes *(descartada en v1.2 §1.1)*
  y cierre por tipo de entrada.
- **v1.1** — 2026-08-04. Alcance acotado al gate de escritorio; disparador ⋮; panel flotante;
  cuatro entradas; "Mano actual" monetizada; Sugerencias descartada.
- **v1.0** — Preliminar.
