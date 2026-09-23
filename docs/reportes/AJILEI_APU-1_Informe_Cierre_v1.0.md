# AJILEI · APU-1 — Informe de cierre · v1.0

**Campaña:** APU-1 — Apuestas, pilas y agresividad de las IAS
**Fases:** 0 · 1a · 1b · 1c · 1c-2 · 1d · 1e · 1e-iv · 1f (A, A2, A3, A4, A5) · ficha de commits
**Ejecutor:** Claude Code · **Rector:** Claude (chat) · **Decisor:** Victor
**Del 2026-09-17 al 2026-09-22** · **Base:** `main` en `f9ee503`
**Ficha:** `AJILEI_APU-1_Commits_v1.0.md` C-0.8

---

## 1. Qué entrega la campaña, para quien juega

Antes de APU-1 la mesa contra las IAS no tenía dinero: todos se sentaban con la
misma pila fija, nadie podía apostar de más ni quedarse sin fichas, y el reto
sólo cambiaba lo lista que era la IA.

Ahora hay una mesa con dinero de verdad:

- **Se elige con cuánto se entra.** Piso 10× la apuesta de mesa, medio 20×,
  techo 50×. La profundidad cambia la partida: a la corta se acaba en pocas
  manos, al techo da para maniobrar.
- **Las IAS se sientan contigo, no contra ti.** Cada una entra con 1,5 veces lo
  que puso el humano, topado por el techo, así que la mesa no es una pared de
  fichas ni un regalo.
- **Existe el all-in.** Empujar la pila entera es un botón propio, se marca en el
  asiento, y el pozo se parte en capas: quien puso menos sólo puede ganar la
  parte que cubrió. Un all-in vale lo que un all-in debe valer — cuando el rival
  todavía puede pagar, se le deja pagar (**E-13**).
- **Se puede recargar.** Cuando la pila baja del listón, la mesa lo ofrece sola y
  espera 15 segundos con «No» por defecto; el jugador también puede pedirlo. Si
  con lo que queda la mesa no puede seguir, la pregunta bloquea y la alternativa
  es levantarse con las fichas.
- **Las IAS juegan distinto en cada reto.** Suben fuerte con mano hecha, faroleen
  por bloques, pagan por cuarto del pozo y empujan la pila cuando toca. Básico ya
  no es un espantapájaros: pone dinero cuando el humano está en la mano.
- **La pantalla de entrada es nueva**: «Retar a las IAS», con los chips de
  jugadores, apuesta y entrada, y el saldo a la vista.

## 2. Qué entrega la campaña, para quien programa

| Pieza | Dónde | Qué hace |
|---|---|---|
| Pozos y capas | `src/engine/pozos.js` | legalidad (`accionesDe`, `esLegal`) y reparto por capas, fuera del motor protegido |
| Entrada | `src/engine/entrada.js` | piso/medio/techo, validación, pila de las IAS y nivelado tras recarga |
| Motor con dinero | `src/engine/gameEngine.js` | all-in de verdad, §4.3 al abrir la ronda, ante que puede dejar en all-in |
| Cerebro por reto | `src/engine/aiPlayer.js` | subida fuerte, farol por bloques, cuarto del pozo, all-in, temperamentos |
| Azar sembrable | `deck.js`, `aiPlayer.js`, banco | `setRng` inyectable; dos corridas con la misma semilla dan el mismo volcado |
| La mesa | `src/hooks/mesaCore.js`, `src/components/GameTable.jsx`, `src/styles/apu.css` | recarga (automática, voluntaria, forzosa), marca de all-in, botón y tarjeta |
| La entrada a la mesa | `src/screens/RetarIAS.jsx`, `retarCore.js`, `PantallaChips.jsx`, `FilaChips.jsx` | la pantalla nueva y su lógica, separadas |
| El bolsillo | `src/lib/saldo.js` | el saldo de cuenta, ya separado de las fichas de mesa: **el único punto que ECO-1 tendrá que tocar** |
| Banco de niveles | `scripts/bancoNiveles.mjs`, `scripts/apu1_bandas.json` | simulación sin UI, bandas de regresión selladas y su lector |
| Verificador del banco | `scripts/bancoVerificar.mjs` (`npm run banco:verificar`) | corre cada celda con la forma con que se selló |
| Arnés | `scripts/diagDSK.mjs` modos `retar` y `apu`, `scripts/rutaMesa.mjs` | siete viewports, la ruta a la mesa en un solo sitio |

## 3. Las fases, una por una

| Fase | Qué entregó | Fecha | Informe | Varas al cerrar |
|---|---|---|---|---|
| 0 | Diagnóstico de solo lectura del dinero, la IA y la selección | 2026-09-17 | `…Fase0_Informe_v1.0.md` | línea base: lint 21 · vitest 685/26 · `diagSAL` 102/102 |
| 1a | El normativo `Reglas_v1.0` y la lista cerrada de ediciones; cero código | 2026-09-17 | `…Fase1a…` | Δ = 0 en las tres |
| 1b | Motor puro: pozos, entrada por asiento, all-in y capas | 2026-09-17 | `…Fase1b…` | vitest 745/29 · lint 21 · protegidos intactos |
| 1c | La IA: monto, subida fuerte, cuarto del pozo, all-in, farol, siembra | 2026-09-17 | `…Fase1c…` | vitest 779/30 · lint 21 · build ✓ |
| 1c-2 | Piso del farol, umbral por reto, Básico contra el humano; 238 celdas | 2026-09-18 | `…Fase1c2…` | vitest 818/30 · `diagDSK o1` 16/16 |
| 1d | Calibración por simulación y encendido de Básico | 2026-09-17 | `…Fase1d…` | vitest 783/30 · lint 21 |
| 1e | La pantalla, el all-in, la recarga y el ritmo (tres STOP) | 2026-09-18 | `…Fase1e…` | vitest 933/32 · `diagSAL` 102/102 · build sin moldes |
| 1e-iv | **No había deriva**: §D.6 se midió a `--unit 50` contra una vara de 100 | 2026-09-18 | `…Fase1e-iv…` | vitest 942/33 · 80/84 celdas verdes |
| 1f | Teléfono: E-29, la voz de §5.3, las cifras que Victor jugó, el aire de la tarjeta | 2026-09-18 al 21 | `…Fase1f…` | `apu` 7/7 · vitest 943/33 · lint 21 |
| commits | La tanda previa (C-0) y la serie de commits | 2026-09-22 | este informe | §6 |

Dos cosas que se leen mejor juntas: **ninguna fase commiteó** —las nueve viven
sobre `f9ee503`, y por eso esta ficha existe— y **`lint` no se movió ni una vez**
(21, de los cuales 20 errores y 1 aviso, todos anteriores a la campaña). La única
vara que crece es `vitest`: **685 → 953**, de 26 a 34 archivos.

## 4. Los seis protegidos

| Archivo | blob al entrar (`f9ee503`) | blob al cerrar | ¿abierto? |
|---|---|---|---|
| `src/engine/gameEngine.js` | `6ddadd536eb8` | `21c4d3f56318` | sí — 1b-ii, 1c, 1d-i, 1e-iii |
| `src/engine/aiPlayer.js` | `0860812af936` | `8cfc3736cba2` | sí — 1c, 1c-2 |
| `src/engine/deck.js` | `ad6769a761d5` | `eb61426083ca` | sí — 1b-ii, 1d-i (siembra pre-autorizada) |
| `src/config/seatLayouts.js` | `0d1bb8ea66a8` | `0d1bb8ea66a8` | **no** |
| `src/styles/opponentPanel.css` | `3ce6383eec0d` | `3ce6383eec0d` | **no** |
| `src/styles/gameTable.css` | `1e21371c8543` | `1e21371c8543` | **no** |

El detalle —qué rango, por qué y con qué autoridad— está en la **§7 nueva de
`docs/AJILEI_Protegidos_v1.0.md` (v1.5)**, que esta campaña estrena. Lo que
conviene retener: las dos hojas de estilo protegidas **no se abrieron ni una
vez**, y hubo cuatro ocasiones en que pareció que habría que hacerlo.

## 5. Lo que queda ABIERTO, con dueño

| Hallazgo | Qué es | Dueño |
|---|---|---|
| **E-4** · `inert` de React | aviso en el primer render, en una carga pelada de `/`; el nodo ya no está en el DOM cuando el lobby asienta | la cáscara de la app, no APU-1 |
| **E-22** · el toque en showdown de mesa 5 | rojo intermitente de `diagDSK msg` (1 de cada 4) a 1366×768; no se reprodujo en 1f | ARN-1 / quien toque la coreografía de eliminación |
| **CEL-2c** · el rojo de 133 ms | desajuste entre el plazo del conteo del saldo y el doble de la constante de CEL-2c | campaña CEL-2c |
| **16 verificadores rotos** | `scripts/verify*.mjs` con los tres clics viejos escritos a mano; el remedio son dos líneas (`rutaMesa.mjs`) | decisión del rector: no se reescribieron porque son de un solo uso y no entran en ninguna vara |
| **«Ocultar saldo»** | la opción existe sin activar y perdió su sentido al separarse pila de mesa y saldo de cuenta | por decidir (normativo v1.1 §8) |
| **PvP Corta 15× vs Medio 20×** | vs IA subió su medio a 20× en 1f; PvP sigue sellada en 15× | macro 2, decisión de Victor |
| **E-10** · la profundidad en el teléfono | falta el vistazo de Victor con las tres entradas | Victor |
| **El motor de 1e-ii ya no existe** | el A/B de las bandas no se puede repetir: aquel motor fue una edición del árbol de trabajo y nunca se commiteó | ver §6.3.2 |
| **`u1` · `hits 0/8`** | la geometría de `u1` sale **20/20 en verde**, pero su sub-pasada táctil falla en las ocho celdas: `.util-item-tapetes` mide **63×35** contra el mínimo de 44 de la casa. Las cifras son **idénticas en las dos corridas** de C-0.5 → no es deriva de Edge; y `UtilitiesMenu.jsx` y `menuMovil.css` **no los tocó APU-1** (no aparecen en `git status`) → no es regresión de esta campaña | **quien abra `UtilitiesMenu`** (decidido en C-1) |
| **`a1` · el frame suelto, ahora con cifra** | en T5 1920×937, en **un único frame** de 305 (`h2t14`), el origen del abanico y el mazo saltaron **36,83 px** y volvieron (`originConst=false`, `deckOk=false`). Es el «frame suelto» que DSK tenía en vigilancia sin medida; ahora tiene mesa, viewport y magnitud. **No se reprodujo** en la corrida de confirmación de E-33 (misma celda, 305 frames, verde), así que es intermitente y no tiene nada que ver con E-33 | vigilancia DSK |
| **La fila de acciones del teléfono y el mínimo táctil** | medido bajo `pointer: coarse`: 32 px en portrait y 28 en apaisado, **contra los 40 del estándar de la casa**, y en los dos botones —el que E-33 tocó y el que no—. Es anterior a APU-1. E-33 le quita 4 px más en portrait (32 → 28) porque esos 4 venían del borde, no de una regla; en apaisado no cambia nada (`min-height: 28px` con `border-box`). **Si esa fila debe medir 32 o 40 en el teléfono, hay que escribirlo como regla** | **PAN-1** (mesa en teléfono). Decidido en C-1: **no se toca en esta serie**. El encargo, con las palabras del rector: «fila de acciones al mínimo táctil de la casa en las dos orientaciones; requiere abrir `gameTable.css`» |
| **`a2` · `vuelos` intermitente** | T4 1920×937 salió rojo en la matriz completa (`vuelo 773,48 ≤ 766,5`) y **verde al repetirlo a solas** (`748,48`). La medida depende del estado de la mesa, no del navegador: **25 px de diferencia entre dos corridas de la misma celda** | vigilancia DSK |
| **`f1` · el punto ciego gemelo** | `f1` es el único modo con manos auto-jugadas al que C-0.5 **no** le puso `contestarRecarga(page)`: si la tarjeta de recarga aparece, el modo mide una mesa tapada y no se entera, exactamente como les pasaba a `o1`, `o2`, `a1`, `a2` y `u1` antes de C-0.5. El remedio es **una línea**. Decidido en C-1: **no ahora** | próxima tanda de arnés |

**ECO-1** es la campaña corta que APU-1 deja mejor preparada: el saldo de cuenta
quedó reducido a un solo punto de contacto (`src/lib/saldo.js`, hoy con una
constante provisional de 5.000, espejada en `public.saldo_de()`). **PAN-1** y
**VOZ-2** se nombran en la ficha de commits pero **no existen en el repositorio**:
si se quieren, hay que escribirlas.

## 6. La tanda previa a los commits (C-0)

### 6.1 · Lo que se hizo

- **C-0.1 · el normativo v1.1 en los comentarios.** Nueve cabeceras citaban
  `Reglas_v1.0.md`; ahora citan la v1.1. Y once comentarios más presentaban como
  vigentes cifras que 1f-A4 movió (piso 5×, medio 15×, plazo de 10 s).
- **C-0.2 · `npm run banco:verificar`.** La forma con que se selló cada celda
  estaba escrita en la vara y no en la cabeza de nadie; ahora se reconstruye sola.
- **C-0.3 · back-fill de procedencia.** Las 84 celdas dicen su `unit` (100) y su
  `siembra` (11 o 23), y `blobs: null` porque el árbol de 1c-2 no existe.
- **C-0.4 · `j0Aleatorio` sembrado (D-31) y el re-sello.** Ver §6.3.
- **C-0.5 · Edge 153 contra las líneas base de píxel.** Ver §6.4.
- **C-0.6 · `Protegidos` v1.5**, con la §7 nueva y dos atribuciones corregidas.
- **C-0.7 · las sondas**, listadas y no commiteadas.

### 6.2 · Una excepción declarada: dónde corren los modos con línea base de píxel

La regla de la casa es que el arnés se valida contra `vite preview`, que es lo
que Victor va a usar. **`o1`, `o2`, `a1`, `a2` y `u1` son los únicos cinco modos
que no pueden cumplirla**, y conviene que esté escrito aquí y no en la memoria de
quien corre el comando:

- sus líneas base (`A1_PRE`, `M1_PRE`, las de `o1`/`o2`/`u1`) son **coordenadas
  absolutas en píxeles**, tomadas en su día contra el servidor de desarrollo;
- en `preview` existe la **Portada**, y el arnés se queda esperando el lobby: la
  ruta a la mesa no se recorre y no hay nada que medir (se comprobó: `o1` contra
  4173 muere en `waitForSelector` de `[data-accion="jugar-ia"]`);
- correrlos en otro sitio **no los haría más estrictos: los haría incomparables**,
  que es justo lo que una línea base de píxel no admite.

Así que estos cinco corren contra el servidor de desarrollo con
`VITE_AUTH_BYPASS=1`, que es donde se sellaron. Los demás modos —`apu`, `retar`,
`msg`, `lob`— no tienen línea base de píxel absoluta y no necesitan la excepción.

### 6.3 · El re-sello del banco (C-0.4), y las tres cosas que la vara no podía decir

**La vara pasó de 84 a 87 celdas y ninguna de las 60 que no se tocaron cambió una
cifra.** El reparto:

| | celdas | qué son |
|---|---|---|
| intactas | **60** | lo que 1c-2 selló, con su procedencia añadida y `blobs: null` |
| re-selladas por **D-31** | 18 | el conductor `aleatorio`, que ahora entra en la siembra |
| re-selladas por **E-13** (+ D-31 las dos de mesa 2) | 6 | mesa 2 `aleatorio` a 100.000 en avanzado y pro; `manoso` en mesas 4 y 5 a 100.000 |
| **nuevas** | 3 | V2 a 20×: `mesa5 manoso` en los tres retos, n=100.000, `e=20` |

Las de `e=15` **se conservan al lado**: son otra profundidad, no una versión
vieja de las de 20×.

**Cada celda re-sellada dice por qué cambió.** El campo `nota` no es decoración:
una cifra que se mueve sin explicación es indistinguible de una regresión. Las de
E-13 citan la tabla A/B del informe de 1e-iv (§B.6), que es **la única evidencia
que queda** — ver §6.3.2.

**`npm run banco:verificar`: VERDE, 87/87 celdas comparadas, sin una sola
`INCOMPARABLE`, peor 2,65σ.** Es la primera vez en la campaña que la vara entera
se puede reproducir con un comando, y que ese comando no depende de que nadie
recuerde con qué `--unit` ni con qué semilla se selló cada cosa.

#### 6.3.1 · D-31, y por qué costaba veinte celdas y no treinta y seis

`j0Aleatorio` —el conductor que juega el asiento 0 al azar— tiraba con
`Math.random` aunque la corrida llevara `--seed`. Era **E-27**, estaba consignado,
y significaba que las celdas de ese conductor no se reproducían ni sembradas.
Ahora tira de la misma corriente que el mazo y la IA, y dos corridas con la misma
semilla dan el mismo volcado; sin semilla siguen difiriendo, como siempre.

El precio era re-sellar sus celdas, y aquí hay una cifra que la campaña venía
repitiendo mal: **son veinte, no treinta y seis.** El «36» contaba los volcados
de la tanda de convergencia, de los que sólo un tercio usa este conductor.
Corregido en el banco y consignado aquí.

Lo interesante es lo que se midió al hacerlo: **con los dados nuevos, sólo 5 de
las 20 celdas se salían de banda**. Cambiar la corriente de azar de un conductor
no mueve las cifras del producto — mueve el ruido. Las cinco que se salían son
las que §6.4.2 explica.

#### 6.3.2 · E-13, y una evidencia que ya no se puede volver a tomar

Seis celdas cambian por una razón distinta y deliberada: **E-13**, la corrección
de 1e-iii que impide al motor cerrar la ronda antes de que el último con fichas
pueda responder a un all-in. En la mesa de dos, el rival **es siempre** ese
último, y por eso ahí el efecto es enorme (de −18 a −20σ, estable en tres
semillas); con el conductor `manoso`, que empuja la pila con mano hecha, pasa
algo parecido en las mesas 4 y 5.

**El A/B que lo demuestra no se puede repetir.** La ficha pedía comprobar contra
el motor de 1e-ii que el Δ es real, y ese motor **ya no existe**: fue una edición
del árbol de trabajo durante 1e-iv, nunca se commiteó, y su blob no está en el
repositorio (`git cat-file -t 65c403358d92` → *not a valid object name*). Lo que
queda es la medición que 1e-iv sí hizo y dejó escrita: con el motor de 1e-ii esas
celdas daban **+0,83σ** (avanzado) y **+1,87σ** (pro), dentro de banda.

Es, además, una lección sobre por qué esta ficha existe: **una campaña sin
commits no puede volver atrás a medir nada.** El A/B de 1e-iv se pudo hacer
porque el motor viejo todavía estaba en el disco de quien lo midió.

### 6.4 · Edge 153 contra las líneas base de píxel (C-0.5)

El motivo de este punto era **E-30**: el navegador de la máquina se adelantó dos
versiones (151.0.4129.93 → 153.0.4234.48) y ya había movido una cifra sellada —el
rótulo «ALL-IN» pasó de 69,56 a 73,17 px sin que nadie tocara una regla—. La
pregunta era si las líneas base de píxel seguían valiendo.

**Respuesta: sí. Ninguna cifra sellada se movió por el navegador.** Lo que sí
aparecieron fueron otras dos cosas: un arnés que se había quedado viejo respecto
del producto (§6.4.1) y **un movimiento de 3,74 px que es nuestro, no de Edge**, y
que se sube a la mesa del rector sin taparlo con una línea base nueva (§6.4.3).

#### 6.4.1 · Lo que estaba roto no era la línea base: era el arnés

`a1` y `a2` se escribieron cuando el pago de una mano tenía **un solo botón**,
«Siguiente mano», y cuando nada podía interponerse entre el final de una mano y
la siguiente. APU-1 cambió las dos cosas:

- el pago ahora lleva **dos** botones —el de seguir y el de la recarga
  voluntaria—;
- y la pregunta de recarga **bloquea «Siguiente mano» a propósito** (§5.1).

Contra eso, los dos modos hacían lo mismo que siempre y medían otra pantalla:

| Síntoma | Qué pasaba de verdad |
|---|---|
| `a2` · **las 20 celdas en rojo** por `cicloVisibility` | el arnés comprobaba que la banda «Tu mejor palo» vive sólo en el pago preguntando si la lista de botones era **exactamente** `'Siguiente mano'`. Con dos botones, nunca lo es. Todas sus medidas geométricas salían a 0,07 px o menos: **no se había movido nada** |
| `a2` · una celda con `banda 0f (SINCERRAR)` | la mano no cerró: salió la pregunta de recarga, el bucle no la contestaba y se quedó esperando un botón que la propia pregunta escondía |
| `a1` · rojos de 3,74 / 3,94 px en el cronómetro | **no era el arnés viejo, y tampoco era una sola cosa**: 2,00 px de producto (el borde del botón All-in) más 1,74 px de instrumento (la caja del cronómetro medida con la escala de su animación dentro). Es **E-33** y tiene sección propia: §6.4.3 |
| `a1` · el modo entero abortado | con las pilas cortas de APU-1 una rotación de tres manos puede acabar en bancarrota: `.player-zone` deja de existir y el arnés reventaba con un `getBoundingClientRect` de `null`, perdiendo las dieciséis celdas |

**Ninguno de los cuatro es deriva del navegador, y ninguno pedía re-tomar una
línea base.** El criterio del rector para re-baselinear pide tres condiciones a
la vez —ancla que depende de texto, Δ proporcional al tamaño de letra, y CSS/JSX
sin cambios desde el sellado—; en los tres primeros **falla la primera**: no hay
ningún ancla movida que explicar, sólo un instrumento que se quedó viejo
respecto del producto que mide. El cuarto, E-33, sí tenía un ancla movida, y
tampoco se re-baselineó: **se arregló el producto y se volvió a la línea base**,
que es lo que el rector decidió al leer las medidas.

#### 6.4.2 · Lo que se arregló en el arnés

1. **El pago se reconoce por pertenencia, no por igualdad**: que «Siguiente mano»
   esté entre los botones, no que sea el único. Dos sitios (`a2`: el ciclo de
   visibility y el filtro de frames de pago).
2. **Los bucles contestan la pregunta de recarga** (`contestarRecarga`): que sí
   mientras haya saldo —estos modos quieren la mesa viva tres manos enteras— y
   que no cuando no lo haya. Es la misma disciplina que el modo `apu`, que la
   declina por la razón contraria y lo dice en su bucle.
3. **`a1` tolera que la mesa se acabe**: el frame se marca ausente, el bucle se
   detiene y la celda consigna cuántos frames se quedaron sin medir. Una celda
   con menos evidencia ya no puede pasar por completa.

**Queda uno sin arreglar, y se dice aquí para que no se descubra tarde: `f1`
tiene el mismo punto ciego.** Su bucle es hermano del de `a1` y tampoco contesta
la pregunta de recarga. No entra en los cinco modos que C-0.5 manda correr, así
que no se tocó —cambiar un instrumento que esta tanda no va a volver a correr es
cambiarlo a ciegas—, pero el día que `f1` se corra contra una mesa de APU-1 hará
lo mismo que hacía `a1`: medir frames con la pregunta abierta. El remedio es una
línea, `contestarRecarga(page)`, y ya está escrita al lado.

#### 6.4.3 · E-33 · Un anillo de 2 px que movía el cronómetro

El rojo más caro de C-0.5 fue éste, y merece contarse entero porque el primer
diagnóstico estuvo mal y el arreglo acabó siendo de una línea.

**El síntoma.** Cuatro de las dieciséis celdas de `a1` fallaban por una sola
ancla, `dTimerY`: el cronómetro de la fase de apuesta aparecía **3,74 px más
arriba** de lo que sella `A1_PRE` (3,94 en 1920×937), y no en una posición nueva
sino en un **continuo** de diez a diecisiete valores fraccionarios.

| celda | Δ | posiciones medidas | selladas en `A1_PRE` |
|---|---|---|---|
| T5 1280×720 | 3,74 | 175,15 … 176,89 (17 valores) + 178,89 + 199,39 | 178,89 · 199,39 |
| T5 1366×768 | 3,74 | 175,15 … 176,89 (10 valores) + 178,89 + 199,39 | 178,89 · 199,39 |
| T5 1920×937 | 3,94 | 207,51 … 209,45 (10 valores) + 211,45 + 231,95 | 211,45 · 231,95 |
| T2 1024×768 | 3,74 | 175,15 … 176,89 (10 valores) + 178,89 | 178,89 · 199,39 |

**El primer diagnóstico fue equivocado, y se deja escrito.** Se concluyó que
APU-1 había hecho dinámico el contenido de `.mult-row` —la fila donde vive el
cronómetro— y que la fila cambiaba de alto con los multiplicadores y el botón
All-in. Medido vivo, **es falso**: la fila mide 28 px en los dos estados y lleva
exactamente los mismos cuatro botones (`×1 ×2 ×5 ×10`). Lo que había eran **dos
causas sumadas**, una del producto y otra del instrumento, y la cifra 3,74 era
su suma: 2,00 + 1,74.

**Sumando 1 · 2,00 px de producto: el borde del botón All-in.** `.action-area`
`.action-col` reparte sus dos hijos —la fila de multiplicadores y la de
acciones— **centrados verticalmente en una caja de alto fijo** (84 px en las
mesas de escritorio). Medido frame a frame, con el cronómetro en reposo:

| contenido de `.action-buttons` | alto de la fila | `dy` de `.mult-row` | `dy` del cronómetro |
|---|---|---|---|
| `Pasar · Apostar 50 · Retirarse` | 33 | 176,5 | **178,89** (sellado) |
| `Igualar (550) · Subir a 600 · Retirarse` | 33 | 176,5 | **178,89** (sellado) |
| **`All-in (200) · Retirarse`** | **37** | 174,5 | **176,89** |

Los 4 px de diferencia son el `border: 2px solid var(--gold-brand)` que la §1 de
`apu.css` le daba al botón All-in: un borde suma 2 px arriba y 2 abajo. Con el
centrado, esos 4 px se reparten en dos y **suben la fila entera —y el cronómetro
con ella— exactamente 2,00 px**. `gameTable.css` no tiene nada que ver: está
byte a byte desde agosto (blob `1e21371c8543`). La regla culpable era nuestra.

**Sumando 2 · 1,74 px de instrumento: el cronómetro está animado.** Cuando
quedan ≤5 s, `GameTable.jsx` le pone la clase `timer-warning` y arranca
`timerPulse`, una animación de 0,7 s que lo escala hasta **1,15**:

| `timeLeft` | clase | `transform` | alto | `dy` medido |
|---|---|---|---|---|
| 6 s | `timer-display` | `none` | 23,20 | 178,89 |
| 5 s | `+ timer-warning` | `matrix(1.14783…)` | 26,63 | 177,18 |
| pico | `+ timer-warning` | `matrix(1.15)` | 26,68 | **177,15** |

`getBoundingClientRect` devuelve la caja **pintada**, con el `transform` dentro:
la caja crece 3,48 px de alto y su borde superior sube la mitad, **1,74 px**, que
es justo el ancho del continuo. Es **la misma trampa que `bankruptRise` en
1f-A5**, y aquí el arnés la encontró solo: APU-1 alargó los turnos —con la
pregunta de recarga abierta el bucle no contesta y el reloj llega al aviso—, y
`A1_PRE` se selló cuando eso no pasaba nunca. `timerPulse` es de agosto: ni de
esta campaña ni del navegador.

**El arreglo, y por qué no es el que la orden pedía.** El rector ordenó reservar
la caja con un `min-height` fijo en `.mult-row`. **No habría movido un píxel**:
la fila no cambia de alto ni de contenido; la empuja su vecina. Lo que había que
quitar de en medio eran los 4 px del borde, así que:

```css
/* antes */  border: 2px solid var(--gold-brand);            /* +4 px de alto y de ancho */
/* ahora */  box-shadow: inset 0 0 0 2px var(--gold-brand);  /* el mismo anillo, cero maqueta */
```

Mismo anillo de 2 px, en el mismo borde, mismo oro, sin tocar el color ni la
lectura aprendida (verde = pagar, naranja = subir, rojo = soltar). Y sin
aritmética de paddings por viewport, que era lo frágil de «reservar una caja»:
una sombra interior **no ocupa sitio en ningún tamaño**, así que no pelea con el
`min-height: 40px` táctil ni con el padding compacto del apaisado bajo que
`gameTable.css` ya le da al botón. Cambio **aditivo y dentro de `apu.css`**: no
se abrió ningún protegido, porque la regla culpable era de esta campaña.

En el arnés, `a1Snap` deshace la escala del cronómetro antes de medirlo. El
pulso escala respecto del centro (`transform-origin` por defecto), de modo que
deshacerlo es exacto: mismo centro, dimensiones divididas. **`A1_PRE` no se
tocó**, que es lo que el rector pedía: la línea base sigue siendo la verdad y el
producto ha vuelto a ella.

**La vara, después.** `diagDSK a1` cierra **16/16 celdas**, todas en
`resto Δ=0,02`, contra `A1_PRE` **sin tocarla**. Y no es que el máximo baje: es
que el cronómetro vuelve a caer **exactamente** en las posiciones selladas y en
ninguna otra —`dTimerY = 0` en las dieciséis—, con `timerInsideCenter` en
verde también en las dieciséis:

| mesa | 1024×768 | 1280×720 | 1366×768 | 1920×937 |
|---|---|---|---|---|
| T5 | `[178,89]` | `[178,89]` | `[178,89 · 199,39]` | `[211,45 · 231,95]` |
| T4 | `[178,89 · 199,39]` | `[178,89 · 199,39]` | `[178,89]` | `[211,45 · 231,95]` |
| T3 | `[178,89]` | `[178,89]` | `[178,89 · 199,39]` | `[211,45 · 231,95]` |
| T2 | `[178,89 · 199,39]` | `[178,89 · 199,39]` | `[178,89 · 199,39]` | `[211,45 · 231,95]` |

(Las celdas con un solo valor son las que no llegaron a muestrear la fase de
descarte en su rotación; el criterio es de **pertenencia** al juego sellado, y
ninguna trajo un tercer valor.) Se comprobaron **las dos vías de render**: T2,
que pinta al rival por `.ai-zone`, y T3/T4/T5, que lo pintan por
`OpponentPanel`.

**Por qué la vara que debía cazarlo no lo cazó.** El modo `apu` ya comprueba
que el botón All-in **no es el raro de su fila** (`mismoAlto`), y salía **verde
con el borde puesto**. No era un fallo de la vara: `.action-buttons` es un flex
con `align-items: stretch`, así que el botón más alto **estira a todos los
demás**. El All-in no se salía de su fila: **se llevaba la fila entera consigo**,
y por eso la comprobación de uniformidad no veía nada. Se mide en las cifras del
propio modo, antes y después:

| | ancho | alto | `mismoAlto` |
|---|---|---|---|
| antes (`border: 2px`) | 101,14 | **32** | true |
| después (sombra interior) | 97,14 | **28** | true |

Cuatro píxeles menos de alto y cuatro de ancho, y la fila sigue sin desbordar
(`filaDesborda: false` también con el rótulo extremo «All-in (50000)»). La
lección de instrumento: **una vara de uniformidad no detecta un desplazamiento
uniforme**; para eso hacía falta la posición absoluta que sella `A1_PRE`, y por
eso fue `a1` —y no `apu`— quien lo encontró.

**Lo que el cambio sí se lleva por delante, medido con un A/B.** Quitarle 4 px
de alto a un botón en una app que se juega con el dedo merece medirse, no
razonarse. El modo `tactil` sale **345/345 objetivos en 16 celdas**, pero **no
cubre este botón**: su rotación nunca alcanza el estado de all-in. Así que se
midió aparte, forzando el estado con el molde `?apu=allinHumano` en mesa 4 y con
`pointer: coarse`, **con el borde puesto y con la sombra**:

| celda | con `border: 2px` | con la sombra | por qué |
|---|---|---|---|
| 360×640 portrait | **32** | **28** | alto automático: el borde sumaba sus 4 px |
| 640×360 apaisado | **28** | **28** | `min-height: 28px` con `box-sizing: border-box`: **el borde iba DENTRO** |
| 844×390 apaisado | **28** | **28** | igual |
| escritorio (fila entera) | 37 | 33 | alto automático |

**En apaisado no cambia nada**, y conviene decirlo porque la sospecha razonable
era la contraria: ahí manda un `min-height: 28px` de `gameTable.css` y, siendo
`border-box`, el borde vivía dentro de esos 28. **En portrait sí se pierden 4
px**, y no sólo el All-in: con `align-items: stretch`, el borde estiraba también
a «Retirarse», así que la fila entera pasa de 32 a 28.

**Ninguna de esas celdas cumplía el mínimo táctil de la casa (40) ni antes ni
después** —ni el botón que se tocó ni el que no—: la fila de acciones del
teléfono mide 32 o 28 según la orientación, y eso es anterior a APU-1. Lo que
E-33 destapa es que **4 px de área de toque en portrait venían de una regla
decorativa**, no de una decisión. Si esa fila debe medir 32 —o 40— en el
teléfono, tiene que escribirse como regla y medirse como vara; heredarlo de un
borde es cómo se llega a que nadie sepa que estaba ahí. **Queda para el rector**,
consignado en la §5.

**El hermano, revisado y dejado en paz.** `apu.css` tiene otro borde: el
`border: 1px solid` de `.btn-recarga`, el botón discreto de la recarga
voluntaria, que vive en la **fila del pago**, junto a «Siguiente mano». El mismo
patrón, la mitad del tamaño (2 px de alto). **No se tocó**, y por una razón
medida, no por pereza: en la fase de pago no hay cronómetro ni fila de
multiplicadores, y las anclas que `a1` y `a2` sellan en esa fase —`relBar`,
`relCenter`, la reserva de la banda «Tu mejor palo» (`dy = 22,02` contra los 22
esperados)— **salen todas a Δ = 0 con el borde puesto**. Cambiarlo ahora sería
mover una geometría que acaba de medirse verde para arreglar un problema que no
tiene. Queda escrito aquí para que, si algún día esa fila gana una línea base
absoluta, se sepa dónde mirar primero.

**La lección**, que vale más que el arreglo: tres reglas más abajo, en el §2 de
ese mismo archivo, la marca del asiento lleva escrito *«ni una caja, ni un borde,
ni un tamaño — cualquiera de esas tres movería el renglón que O1 mide»*. Al
botón, en la regla de al lado, se le olvidó. **Un borde no es decoración: es
maqueta.** Cuando lo que se quiere es pintar y no ocupar, el instrumento es la
sombra interior.

### 6.5 · Cinco lecciones de método que la campaña deja escritas

- **E-24 / E-27 · una vara sólo dice la verdad si se la interroga como se
  selló.** El susto de §D.6 de 1e no era deriva del producto: era una corrida a
  `--unit 50` contra celdas selladas a 100. Y como la corriente de azar es única
  para toda la matriz, una celda sólo se reproduce repitiendo la misma lista de
  mesas y conductores. Las dos cosas dejan de depender de la memoria: las guarda
  la vara y las vuelve a pedir `banco:verificar`.
- **E-25 · la huella del motor viaja con la celda.** Una vara mixta —celdas cuyo
  árbol ya no existe y celdas de hoy— no se puede juzgar con una sola huella en
  la cabecera. Desde C-0.4 cada celda lleva la suya, y las viejas llevan `null`,
  que es la verdad y no una huella inventada.
- **E-32 · un mínimo escrito al mínimo se fabrica rojos.** Las cajas caen en
  posiciones fraccionarias, así que un margen de 8 px se lee 7,88. En CSS los
  mínimos van con 2 px de holgura.
- **C-0.5 · un arnés envejece con el producto, y su rojo miente antes que él.**
  Los cuatro fallos de `a1`/`a2` no eran del producto ni del navegador: eran de
  instrumentos que reconocían el pago por el rótulo de un botón y daban por hecho
  que nada se interpone entre dos manos. APU-1 rompió las dos suposiciones —dos
  botones en el pago, y una pregunta que bloquea— y los modos siguieron midiendo
  como si nada. La lección práctica es la forma de la pregunta: **se comprueba
  por pertenencia («está entre»), no por igualdad («es exactamente»)**, porque lo
  primero sobrevive a que el producto añada cosas al lado y lo segundo no.
- **E-33 · un borde no es decoración: es maqueta — y una vara de uniformidad no
  ve un desplazamiento uniforme.** Dos lecciones en un solo píxel. La primera es
  de CSS: `border` ocupa sitio, y cuando lo único que se quiere es **pintar** un
  anillo sin moverle la caja a nadie, el instrumento es **`box-shadow: inset`**,
  que no ocupa nada en ningún viewport y no pelea con mínimos táctiles ni con
  paddings por celda. La segunda es de instrumento: `apu` comprobaba que el
  botón All-in no fuera **el raro de su fila** y salía verde, porque con
  `align-items: stretch` el botón no se salía —**estiraba la fila entera**—. Lo
  que cazan las varas relativas es lo que sobresale; lo que cazó esto fue la
  única vara **absoluta**, `A1_PRE`. Las dos clases hacen falta, y no se
  sustituyen.
- **1f-A5 y C-0.5 · la caja pintada no es la caja.** Dos veces en la misma
  campaña `getBoundingClientRect` devolvió una animación en vuelo en vez de una
  maqueta: `bankruptRise` con su `scale(0.96)` al aparecer la tarjeta de recarga,
  y `timerPulse` con su 1,15 en el cronómetro en aviso. Se resolvió distinto
  porque el caso lo pide: en A5 **esperando a que la caja se quede quieta**, y en
  E-33 **descontando el `transform`**, que permite seguir auditando el estado
  animado en vez de saltarse sus frames. La regla común: **antes de creerse una
  medida, mirar si hay una animación corriendo encima.**

## 7. El árbol, al cerrar (C-0.9)

| vara | pedido | medido |
|---|---|---|
| `vitest` | 0 fallos | **953/953 en 34 archivos** (943 + 10 de C-0.2/C-0.3/D-31) |
| `lint` | 21, los mismos | **21** (20 errores + 1 aviso), Δ = 0 desde la Fase 0 |
| `build` | ✓ y limpio | **✓** · `dist/`: `?apu` 0 · `siembra` 0 · bypass 0 |
| `npm run banco:verificar` | VERDE sin `INCOMPARABLE` | **VERDE · 75 formas · 87/87 celdas · ROJA 0 · OTRA ENTRADA 0 · OTRO MOTOR 0 · SIN VARA 0** |
| `diagDSK apu` | 7/7 | **7/7** |
| `diagDSK retar` | 6/6 | **6/6** |
| `diagDSK lob` | 6/6 | **6/6** |
| `diagDSK msg` | VERDE | **VERDE** · compositor 92 casos · jugado 7/7 · fin 1/1 · Δ larga 7/7 · caza 2/2. La primera corrida salió ROJA por **E-22** con dos cadenas del arnés a la vez; **a solas, verde** |
| `diagSAL` | 102/102 | **102/102 celdas** |
| `diagDSK o1` | 16/16 | **16/16** (Edge 153). Volcado comparado con el de antes de E-33: **misma geometría celda a celda**; sólo cambian el texto de los mensajes y el número de frames muestreados, que dependen del azar de la partida |
| `diagDSK o2` | 15/15 | **15/15** (Edge 153). Volcado **idéntico byte a byte** al de antes de E-33, quitando el sello de tiempo |
| `diagDSK a1` | 16/16 | **16/16** · `resto Δ=0,02` en todas · **`dTimerY = 0`** en las dieciséis, contra `A1_PRE` sin tocarla (ver §6.4.3, E-33) |
| `diagDSK a2` | 20/20 | **19/20** en la matriz; la celda roja (T4 1920×937, `vuelo 773,48 ≤ 766,5`) **sale verde repetida a solas** (`748,48`). Intermitente, consignada en la §5 |
| `diagDSK u1` | 20/20 + hits + sonido | geometría **20/20** y sonido **2/2**; **`hits 0/8`** (`.util-item-tapetes` 63×35 contra 44). Cifras idénticas en las dos corridas → ni Edge ni APU-1; consignada en la §5 |
| `diagDSK tactil` | 40 px, sin ocluir | **345/345 objetivos** en 16 celdas. **No cubre el botón All-in**: su rotación no alcanza ese estado, así que se midió aparte (§6.4.3) |
| `diagCEL0 celebracion` | sin rojos nuevos | 10 celdas medidas; único fallo, el conocido **CEL-2c de 133 ms** (el saldo pide 2800 y el doble de la constante son 2933) en las cinco celdas de tiempo. El cambio de constante de C-0.1 (250 → 500) no movió ninguna caja |
| seis protegidos | al mismo blob | los seis de la §4, idénticos a la re-medición del 18-sep |
| commits | ninguno | **ninguno** — el árbol sigue sobre `f9ee503` |

**Navegador de esta corrida: Edge 153.0.4234.48**; las líneas base de píxel se
tomaron con 151.0.4129.93 y **ninguna se movió por el cambio de versión** (E-30,
contestado).

La fila «commits: ninguno» es la foto de **C-0.9**, tomada a propósito antes de
tocar el índice. La serie que la sucede está en la §8.

## 8. La serie de commits (C-2)

Seis atómicos, cada uno por **ruta explícita** —nunca `git add -A`— y cada uno
construyendo por su cuenta, sobre el mapa que Victor revisó y aprobó en C-1.

| | commit | rutas | vara pasada antes de cerrarlo |
|---|---|---|---|
| **a** | motor con dinero | 21 | `build` ✓ · 11 archivos / **350 pruebas** verdes |
| **b** | banco de niveles | 7 | `build` ✓ |
| **c** | la pantalla y la mesa, con los siete `git rm` dentro | 28 | `build` ✓ · 3 archivos / **138 pruebas** verdes |
| **d** | arnés | 5 | `build` ✓ |
| **e** | documentos | 14 | `build` ✓ |
| **f** | este informe | 1 | `build` ✓ · `vitest` completo · `lint` 21 · `diagSAL` 102/102 · `diagDSK apu` 7/7 |

Los siete borrados de (c) —`NivelSelect`, `ModeSelect`, `TableSelect`,
`useNivel` y sus tres hojas— viajan **en el mismo commit** que la pantalla que
los sustituye: separarlos dejaría un commit intermedio que no construye.

**Fuera de la serie, y a propósito:** las **trece sondas** `_*.mjs` (dos de DSK,
seis de E-33, cuatro de 1f, una de CEL-1b), que Victor borra a mano, y las
**cinco rutas** de MOT-1 y MON-1, que son trabajo de otras campañas y no llevan
el prefijo `APU-1`.

**Antes del primer `git add`** se comprobó, por orden del rector, el `diff` de
`src/config/salas.js` y `src/dev/salasFixtures.js` contra `f9ee503`: **sólo
comentarios de cabecera**, ni una línea de código ni un `import`, así que las dos
rutas se quedaron en (c) como decía el mapa.
