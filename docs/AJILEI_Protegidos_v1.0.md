# AJILEI — Archivos protegidos · Lista canónica v1.6

- **Archivo:** `docs/AJILEI_Protegidos_v1.0.md`
- **Versión:** 1.6
- **Estado:** **LISTA CANÓNICA ÚNICA.** Sellado 2026-08-20 por Victor
  (HEPTACREATION LLC), al cierre de la campaña IDN-1.
- **Actualización v1.1 (2026-08-26):** se cierra el hueco de reconstrucción
  de la §4 declarando que los «7» de EMB-2 incluían **sellados no-archivo**.
  La lista de la §2 no cambia: siguen siendo los cinco evidenciados.
- **Actualización v1.2 (2026-08-26):** refresco de la instantánea §3 tras
  VIS/TAC — dos filas vencidas por movimientos legítimos ya sellados. La
  lista de la §2 sigue sin cambiar; sólo se re-miden las cifras.
- **Actualización v1.3 (2026-08-26):** la prosa de la §2 deja de llevar
  cifras de líneas — envejecían con cada campaña. La medida vive donde se
  mide: la instantánea de la §3.
- **Actualización v1.4 (2026-09-17):** **la lista pasa de cinco a SEIS.**
  Entra `src/engine/deck.js`, que `AJILEI_Modos_y_Asistencia_v1.0.md §7`
  protegía desde la fase 4 y esta lista no recogía — el conflicto que MOT-1
  levantó como **H-4** y APU-1 Fase 0 volvió a medir como **I-2**, con el
  hallazgo de que las dos listas no discrepaban en un archivo sino en dos.
  Se resuelve **por unión**, por decisión de Victor del 2026-09-17 (APU-1
  Fase 0 §L-4), que es también la autorización explícita que la §4 exige para
  reabrirla. Entra con ella la **§6 nueva, «Excepciones pre-autorizadas»**,
  donde vive la siembra del azar —hasta hoy escrita en un documento de
  campaña— **ampliada a `aiPlayer.js`** (§L-3). Las cinco filas anteriores de
  la §3 no cambian: se re-midieron y salieron idénticas.
- **Actualización v1.5 (2026-09-22):** cierre de APU-1 (ficha de commits, C-0.6).
  **La lista sigue siendo las mismas seis**; lo que cambia es que ahora se puede
  auditar qué hizo la campaña con ella. La §3 se re-mide entera contra el árbol
  final —las seis filas salen **idénticas** a la re-medición del 2026-09-18, o
  sea que 1e-iv, 1f y la tanda previa a los commits no tocaron un byte de ningún
  protegido— y nace la **§7, «Rangos abiertos en APU-1»**: por archivo y por
  fase, qué rango se abrió, por qué y con qué autoridad. De paso corrige **dos
  atribuciones equivocadas de la §3** que salieron al reconstruir esa historia.
- **Actualización v1.6 (2026-10-03):** cierre de ARN-3 (ARN-3e). **La lista sigue
  siendo las mismas seis y la §3 no cambia:** ningún protegido cambió, y desde
  ARN-3e lo comprueba `scripts/testProtegidos.test.js`, que lee la §2 y la §3
  de este documento y compara cada fila con los bytes del árbol. Entra en la §5
  la regla que la acompaña, **«la huella se re-mide en el mismo commit»**, y la
  §4 aclara que su «cinco archivos» es la constancia de la v1.1.
- **Actualización v1.7 (2026-10-20):** TAB-1 1d. **La lista sigue siendo las
  mismas seis.** Victor autorizó (R-4 del informe de la Fase 0 de TAB-1) abrir
  la **puerta del traje A**: cuatro líneas de condición de `@media`, tres en
  `gameTable.css` y una en `opponentPanel.css`, sin tocar geometría ni valores.
  Sus dos filas de la §3 se re-miden aquí, en el mismo cambio que los archivos
  (§5), y nace la **§7.5** con el rango y su autoridad.
- **Alcance:** qué archivos del árbol no se abren sin autorización explícita,
  con qué autoridad, y qué hace un agente cuando una tanda parece exigirlo.

> **Por qué existe este documento.** Hasta hoy la lista de protegidos no tenía
> casa: vivía repartida en las instrucciones de campaña, y por eso había **tres
> versiones distintas y vivas a la vez** — 3 archivos en
> `AJILEI_Diseno_Landscape_v1.0.md`, 4 en la instrucción de IDN-1 y 7 en la de
> EMB-2. Un guardarraíl que cambia de tamaño según qué documento se lea no es un
> guardarraíl. Desde este sellado, **manda esta lista**; las enumeraciones que
> aparezcan en instrucciones de campaña son referencias, no autoridad.

---

## 1. Qué significa "protegido"

Un archivo protegido **no se abre**: no se edita, ni "sólo una línea", ni con un
bloque nuevo al final, ni con `!important` para no tener que tocarlo por dentro.

Cuando una tanda parece exigir tocar uno:

1. **DETENERSE.** No se implementa una versión parcial "a la espera".
2. **Reportar** qué se necesita, por qué, y qué alternativa aditiva existe.
3. **Esperar autorización explícita de Victor**, que es quien decide.

La experiencia de las campañas DSK, EMB e IDN es que la alternativa aditiva casi
siempre existe y suele ser mejor: EMB-2 metió cinco tapetes sin abrir
`gameTable.css` (los fieltros entraron por hoja propia y atributo) e IDN-1
sustituyó las 13 apariciones de moneda y las 3 del wordmark sin abrirlo tampoco.

## 2. La lista

| # | Archivo | Autoridad que lo protege |
|---|---|---|
| 1 | `src/engine/gameEngine.js` | `AJILEI_Diseno_Landscape_v1.0.md` §1 · `AJILEI_Componente_Fichas_v2.0.md` §12 · instrucción IDN-1 |
| 2 | `src/engine/aiPlayer.js` | `AJILEI_Diseno_Landscape_v1.0.md` §1 · `AJILEI_Componente_Fichas_v2.0.md` §12 · instrucción IDN-1 |
| 3 | `src/engine/deck.js` | `AJILEI_Modos_y_Asistencia_v1.0.md` §7 (fase 4) · **recogido aquí por decisión de Victor del 2026-09-17** (APU-1 Fase 0 §L-4) |
| 4 | `src/config/seatLayouts.js` | `AJILEI_Diseno_Landscape_v1.0.md` §1 · `AJILEI_Componente_Fichas_v2.0.md` §12 · instrucción IDN-1 |
| 5 | `src/styles/opponentPanel.css` | Instrucción IDN-1 |
| 6 | `src/styles/gameTable.css` | Instrucción EMB-2 · **reafirmado por fallo de Victor del 2026-08-20** (IDN-1 §5: «Si resultara imprescindible tocar `gameTable.css`: DETENTE y pide autorización») |

Los tres primeros son el **motor** (reglas del juego), la **IA** y la **baraja**;
el cuarto, la **geometría de asientos**. Tocarlos cambia lo que el juego *es*, no
cómo se ve, y ninguna campaña de interfaz tiene por qué hacerlo. Los tres de la
familia de landscape —1, 2 y 4— llevan protegidos desde aquel plan.

**Por qué `deck.js` entra en la v1.4, y por qué tarde.** No es un protegido
nuevo: `AJILEI_Modos_y_Asistencia_v1.0.md §7` lo declaró protegido desde la fase
4, con el motivo escrito —es el **segundo eje del azar** del juego
(`Math.random()` en `deck.js:45`) y, mientras estuvo fuera, la baraja era el
único componente de la partida modificable sin ceremonia—. Aquel documento se
declaraba *ampliación* que los demás heredarían «en su próximo salto natural de
versión», y ese salto no ocurrió: la v1.1, la v1.2 y la v1.3 de esta lista
pasaron sin recogerlo. El resultado, medido por MOT-1 (**H-4**) y vuelto a medir
por APU-1 Fase 0 (**I-2**), era que **`deck.js` estaba protegido según un
documento y no según el que manda, y `gameTable.css` al revés**. Se resuelve por
**unión** y aquí, que es donde la §5 dice que se resuelve.

Los dos últimos son **hojas de estilo grandes y sedimentadas** —del orden de
miles de líneas, con la cifra exacta en la instantánea de la §3— donde viven
constantes selladas por medición (las columnas de O1, el alto de
`.rivals-zone`, los tokens `--dsk-*`). Su protección no es dogma: es que
una edición ahí puede romper en silencio una geometría que costó una campaña
entera calibrar.

## 3. Instantánea (sellado 2026-08-20 · refrescos 2026-08-26 y 2026-09-17 · **re-medida entera el 2026-09-18**)

Estado exacto de cada archivo, para que cualquier «byte-idéntico» futuro sea
auditable contra algo y no contra un recuerdo.

**Las seis filas están MEDIDAS, no copiadas, contra el árbol de trabajo al cerrar
APU-1 1e-iii** (base `f9ee503` más las fases 1a…1e sin commitear). Es la
re-medición que la ficha de 1e-iii ordenó y que el aviso de la v1.4 dejaba
pendiente de la decisión de Victor.

| Archivo | blob git | sha256 (16) | líneas | abierto en |
|---|---|---|---|---|
| `src/engine/gameEngine.js` | `21c4d3f56318` | `317452ec5b57408a` | 748 | APU-1 1b-ii, 1c, 1d-i, **1e-iii** |
| `src/engine/aiPlayer.js` | `8cfc3736cba2` | `3a8ea7b0386c7ddf` | 1445 | NIV-1, NIV-2, NIV-CAL, APU-1 1c, **1c-2** |
| `src/engine/deck.js` | `eb61426083ca` | `69f92d6b9aac433c` | 69 | APU-1 **1b-ii y 1d-i** (siembra pre-autorizada) |
| `src/config/seatLayouts.js` | `0d1bb8ea66a8` | `0049051fd4b8b891` | 59 | — (intacto desde el sellado) |
| `src/styles/opponentPanel.css` | `fbc9f3d08ede` | `4b91338a205e4a6a` | 1084 | **TAB-1 1d** (la puerta del traje A, 1 línea; §7.5) |
| `src/styles/gameTable.css` | `6eedfa949259` | `e97a1565c29bc5a6` | 6289 | **TAB-1 1d** (la puerta del traje A, 3 líneas; §7.5) |

**Las seis filas se volvieron a medir el 2026-09-22**, al cerrar la campaña, y
salen **idénticas una a una** a las de arriba: blob, `sha256` y líneas. Entre el
2026-09-18 y el cierre de APU-1 —1e-iv, las cinco partes de 1f y la tanda previa
a los commits— **no se tocó un byte de ningún protegido**.

**Dos atribuciones de esta tabla estaban equivocadas y se corrigen en la v1.5**,
con la historia reconstruida en la §7:

- `deck.js` decía «abierto en APU-1 **1c**». En 1c salió **intacto**; quien lo
  abrió fue **1b-ii** (la siembra) y **1d-i** (el ligado tardío del generador).
- `aiPlayer.js` no nombraba **1c-2**, que sí lo abrió: pasó de 1.289 a 1.445
  líneas (R-A, R-B, R-D). La cifra de líneas de la fila ya era la de después.

**El aviso ⚠ de la v1.4 queda resuelto y se retira.** Decía que tres `sha256`
escritos no reproducían mientras sus `blob git` sí, y concluía que las cifras
escritas no podían corresponder a esos bytes. La conclusión era correcta: el
`sha256` de `gameTable.css` —el único de los tres cuyo contenido no ha cambiado
desde entonces— mide hoy `269120a496910995`, exactamente el valor que 1a midió
en vivo y distinto del que estaba transcrito. Era un error de transcripción del
sellado, no una alarma de integridad, y esta re-medición lo corrige midiendo.

**Nota sobre `gameEngine.js` en 1e-iii.** La última apertura, autorizada por la
ficha de 1e-iii §1, se limitó a **cuatro rangos** y no tocó una línea fuera de
ellos:

1. `isRoundOver` — se borra el corte `pendientes.length <= 1` (hallazgo E-13:
   cerraba la ronda antes de que el último con fichas pudiera responder a un
   all-in).
2. La **entrada a fase de apuesta** — nace `abrirApuesta`, y las tres puertas
   que abren `BET_1`, `BET_2` y `BET_3` pasan por ella: §4.3 se aplica al ABRIR
   la ronda, que es donde el normativo la pone.
3. `applyPlayerBetAction` — se retira la traducción `betAmount → k` (E-12).
4. La constante de `createInitialState` — `economy.saldoInicial` pasa a
   `economy.pilaPruebas` (E-3).

Los otros cinco archivos cierran 1e-iii **intactos al blob** respecto de la
medición de STOP-2, y los tres que no se han abierto en toda la campaña
(`seatLayouts.js` y las dos hojas de estilo) conservan además el blob del
sellado original.

## 4. Reconstrucción CERRADA (v1.1)

**La instrucción de EMB-2 refirió «los 7 protegidos/sellados» y esa enumeración
completa no está versionada en el repositorio.** El documento de instrucción de
aquella campaña no se guardó en `docs/`, así que los **dos** archivos que
faltan para llegar a siete no se pueden reconstruir desde el árbol ni desde el
historial de git: se buscaron en los mensajes de commit, en `docs/` y en
`scripts/diagDSK.mjs`, y no aparecen enumerados en ninguno.

Se deja constancia en vez de completar la tabla a ojo: **inventar dos nombres
para que cuadre un número sería peor que admitir el hueco**, porque produciría
falsos protegidos que nadie podría desautorizar después.

**Cierre (decisión de Victor, 2026-08-26).** La referencia de EMB-2 a «7
protegidos/sellados» mezclaba archivos protegidos con **constantes selladas
no-archivo** (p. ej. las constantes del óvalo O1 y valores sellados
equivalentes). Los dos elementos no identificados **no son archivos**: no
existen en commits, docs ni scripts, y su búsqueda exhaustiva —la registrada
más arriba en esta misma sección desde la v1.0— lo confirmó. Por decisión de
Victor (2026-08-26) este hueco queda **CERRADO**: la lista canónica de archivos
protegidos es y sigue siendo la de los **cinco** evidenciados en la §2.
**Reabrir este punto requiere autorización explícita de Victor en este
documento.**

Los dos párrafos que abren esta sección se conservan tal como se escribieron
en la v1.0: la constancia de la búsqueda es parte del valor del documento, y
quien lea esta sección debe poder ver qué se buscó antes de aceptar el cierre.

**Rige, como hasta ahora, la tabla de §2: cinco archivos.** *(v1.1; desde la v1.4 son seis: ver la nota siguiente. Nota de la v1.6, ARN-3e (2026-10-03).)*

> **REABIERTO Y VUELTO A CERRAR — v1.4 (2026-09-17).** Esta sección exigía
> «autorización explícita de Victor en este documento» para reabrirse, y aquí
> está: **decisión de Victor del 2026-09-17** (APU-1 Fase 0 §L-4), tomada sobre
> el hallazgo I-2 de aquel informe. Lo que se reabre es **el número**, no el
> razonamiento: los dos elementos no identificados de EMB-2 **siguen sin ser
> archivos** y ese cierre de la v1.1 se mantiene entero. Lo que entra es
> `src/engine/deck.js`, que **sí es un archivo, sí está evidenciado** y llevaba
> protegido desde la fase 4 por `AJILEI_Modos_y_Asistencia_v1.0.md §7` sin que
> esta lista lo recogiera. **La tabla de §2 pasa a seis**; la aritmética de EMB-2
> no tiene nada que ver con ese seis y no se reconstruye a partir de él.

## 5. Cómo se mantiene

- Añadir o quitar un protegido es **decisión de Victor**, y se hace **aquí**,
  subiendo la versión de este documento.
- Una instrucción de campaña puede *recordar* la lista, pero no ampliarla ni
  recortarla por su cuenta. Si una instrucción y este documento discrepan,
  manda este documento y se reporta la discrepancia.
- El informe de cierre de cada campaña incluye la verificación de §3 sobre los
  archivos de esta lista.
- **La huella se re-mide en el mismo commit** *(v1.6, ARN-3e (2026-10-03))*.
  Una campaña autorizada a abrir un protegido actualiza su fila de §3 (blob,
  `sha256` y líneas) **en el mismo commit** que cambia el archivo, y nombra la
  tanda en la columna «abierto en». `scripts/testProtegidos.test.js` compara
  cada fila con los bytes del árbol: un protegido cambiado sin su fila es rojo,
  y una fila cambiada sin el archivo también. Así el diff de cada commit enseña
  la apertura junto al código, y una apertura sin permiso no llega verde a
  `main`.
- **Una excepción pre-autorizada se declara en la §6 de este documento y en
  ningún otro sitio.** La de la siembra vivió dos campañas dentro de un documento
  de fase (`AJILEI_Modos_y_Asistencia_v1.0.md §7.1`), que es justo el patrón que
  produjo el conflicto de la v1.4: una regla sobre protegidos escrita donde nadie
  la busca acaba siendo una regla que no manda.

## 6. Excepciones pre-autorizadas

Una excepción pre-autorizada permite **un cambio concreto y nombrado** en un
archivo protegido **sin la ceremonia de la §1** (detenerse, reportar, esperar).
No abre el archivo para nada más: todo lo que no esté escrito aquí sigue
necesitando autorización de Victor, en ese archivo y en cualquier otro.

**Hay una sola, y es ésta.**

### 6.1 Siembra del azar — `deck.js` y `aiPlayer.js`

> **Sustituir `Math.random()` por un generador inyectable**, con `Math.random`
> como valor por defecto, al servicio del banco de simulación y del árbitro de
> PvP. **Autorizada de antemano: no requiere ceremonia.**
>
> Cubre **el cómo se sortea**. Jamás **qué hay en la baraja**, **cuánto valen las
> cartas** ni **qué decide la IA**: cualquier cambio de esa clase es ceremonia
> completa, aunque viaje en la misma línea.

| Archivo | Puntos cubiertos | Autoridad |
|---|---|---|
| `src/engine/deck.js` | `shuffleDeck` (`:45`) | `AJILEI_Modos_y_Asistencia_v1.0.md` §7.1 (2026-08-14), recogida aquí en la v1.4 |
| `src/engine/aiPlayer.js` | los seis: reparto de perfiles `:494`, jitter `:644`, dado del disimulo `:696`, dado del farol `:803`, dado de subida de `BET_2` `:852` y de `BET_3` `:864` | **Ampliación nueva de la v1.4** — decisión de Victor del 2026-09-17 (APU-1 Fase 0 §L-3) |

**Qué cambia respecto de la fase 4.** `Modos_y_Asistencia §7.1` pre-autorizaba la
siembra de `deck.js` y **excluía expresamente** la de `aiPlayer.js`, razonando
que ésta «viaja con la ceremonia normal de NIV-1/NIV-2, que son las tandas que
abren ese archivo de todos modos». El razonamiento sigue siendo bueno y por eso
la ampliación no lo contradice: **APU-1 abre `aiPlayer.js` igualmente**, así que
la siembra viaja con una tanda que ya tiene autorización para ese archivo. Lo que
la ampliación evita es que la mitad de una misma decisión técnica —un generador
inyectable en los dos ejes del azar del juego— necesite dos permisos distintos.

**Por qué existe.** APU-1 Fase 0 lo midió (§C-6, §G-4, riesgo R-3b): con siete
fuentes de azar sin semilla, dos corridas del banco sobre el mismo código dieron
25,17 % y 17,20 % de victoria para el mismo asiento. Calibrar umbrales que se
distinguen por un punto contra ese ruido no es calibrar. La reproducibilidad no
es una comodidad del ejecutor: es la condición para que las cifras de TRABAJO de
`AJILEI_APU-1_Reglas_v1.0.md` §10 se puedan fijar con datos.

**Límite declarado.** La excepción **no autoriza cambiar ningún valor** de
`aiPlayer.js` —ni un umbral, ni una frecuencia, ni una curva— ni el orden en que
se consume el azar. Un generador inyectable que, con `Math.random` por defecto,
produjera una decisión distinta a la de hoy para el mismo estado **es una
violación de esta excepción**, no un efecto colateral: lo sella el test de oro de
`scripts/testNivel1.test.js` §1.

---

## 7. Rangos abiertos en APU-1 (v1.5)

Qué tocó la campaña, archivo por archivo y fase por fase. Existe por una razón
concreta: la §3 dice **si** un archivo se abrió, pero no **dónde** ni **con qué
permiso**, y sin eso una lista de protegidos sólo sirve para discutir después.
Las filas salen de los informes de fase, que son la única fuente versionada —las
fichas rectoras no viven en el repositorio—.

### 7.1 · `src/engine/gameEngine.js` — cuatro fases

| Fase | Rango | Por qué | Autoridad |
|---|---|---|---|
| 1b-ii | imports con extensión (`:1-5`) | **E-1** · §9.1; sin ello el motor no se despliega | ficha 1b §3 |
| 1b-ii | lector de la unidad por defecto (`:20`) | renombre §3.1 `betting.entrada` → `betting.unidadPorDefecto` | ficha 1b §3.1 |
| 1b-ii | `makePlayer` | **E-2** · §4.3 (`allIn` propio), §4.2 (`contribMano`) | ficha 1b §3 |
| 1b-ii | `createInitialState` | **E-3** · §2.2/§2.3 — fichas por asiento | ficha 1b §3 |
| 1b-ii | estado base / `pot` | **E-4** · §4.2 — el pozo deja de ser escalar | forma decidida por el rector antes de 1b |
| 1b-ii | `isRoundOver`, `nextActiveIndex`, `primerTurno` | **E-5/E-6** · §4.3 — saltar también a `allIn` | ficha 1b §3 |
| 1b-ii | `resolveWinner`, `doShowdown` | **E-7/E-8** · §4.2 — reparto por capas con elegibles | ficha 1b §3 |
| 1b-ii | `advanceBettingPhase` y el reset de `applyDiscard` | **E-9** · §4.2 — `contrib` a cero, `contribMano` intacto | ficha 1b §3 |
| 1b-ii | `applyBetAction` | **E-10** · §3.2/§4.1 — legalidad a `pozos.js`, mueren las guardas que reescribían a `retirarse` | ficha 1b §3 |
| 1b-ii | `startHand` y `aplicarRecarga` | **E-11** · §2.4/§5.4 | ficha 1b §3 |
| 1c | `decidirIA` nueva; `applyAIBetAction` queda sin puente | **E-12** · §6.2 — el `unit` fijo impedía que la IA subiera más de ×1 | ficha 1c §2.4 |
| 1d-i | `startHand`, el cobro del ante | **D-7 de 1c** · el ante podía dejar la pila en cero sin marcar `allIn` | ficha 1d §1.2 |
| 1d-i | `startHand`, el `return` con `primerTurno(...)` | **D-11**, ⚠ **salida de rango consignada**: sin ella la ronda no converge | fuera del rango literal de la ficha; **ratificado por el rector** al abrir 1d-ii |
| 1e-iii | `isRoundOver`: se borra el corte `pendientes.length <= 1` | **E-13** · cerraba la ronda antes de que el último con fichas pudiera responder a un all-in | **no estaba en la ficha**: STOP-2 se detuvo, reportó con reproducción y **el rector autorizó** |
| 1e-iii | nace `abrirApuesta`; las tres puertas de `BET_1/2/3` pasan por ella | §4.3 al **abrir** la ronda, que es donde el normativo la pone | autorizado por el rector, con E-13 |
| 1e-iii | `applyPlayerBetAction` | **E-12** · se retira la traducción `betAmount → k` | ficha 1e-iii §1 |
| 1e-iii | la constante de `createInitialState` | **E-3** · `economy.saldoInicial` → `economy.pilaPruebas` | ficha 1e-iii §1 |

**Los cuatro rangos de 1e-iii son el mejor ejemplo del mecanismo de la §1 en
funcionamiento**: **dos venían de la ficha** (E-12 y E-3) y **dos los autorizó el
rector después** de que la tanda se detuviera y reportara con una reproducción en
la mano (E-13 y `abrirApuesta`). Detenerse no costó la tanda: costó una
autorización.

### 7.2 · `src/engine/aiPlayer.js` — dos fases

| Fase | Rango | Por qué | Autoridad |
|---|---|---|---|
| 1c-i | los seis sitios de azar (`:494`, `:644`, `:696`, `:803`, `:852`, `:864`) | **A-9** · §6.11 — sin siembra, dos corridas del banco daban 25,17 % y 17,20 % para el mismo asiento | **excepción pre-autorizada §6.1**, ampliada a este archivo el 2026-09-17 |
| 1c | dos `import` nuevos (`pozos.js`, `ajileiConfig.js`) | **D-1**, ⚠ **salida de rango consignada**: A-2 y §2.2 no son implementables sin ellos | fuera de rango, consignado y no detenido |
| 1c | firma de `decideBetAction` → `{ action, k, peso }` | **A-1** · §6.2 | ficha 1c |
| 1c | las cuatro guardas de saldo → `puede('subir')` | **A-2** · §3.2 (riesgo R-5 de Fase 0) | ficha 1c |
| 1c | fila de decisión (pasos 2-7) y colas de `BET_1/2/3` | **A-3…A-8** · §6.3 a §6.8 | ficha 1c §3.2 |
| 1c | mueren `boteDecide`/`porIgualar`/`pagaElBote` | **A-4** y **D-10** · §6.5 | ficha 1c |
| 1c | lectores de configuración por reto | §2.2 — las cifras son parámetro por reto | ficha 1c §2.2 |
| 1c-2-i | **R-A** · las dos vías del farol | **D-18** de 1d: el farol no miraba su propia mano | ficha 1c-2 §2.2 |
| 1c-2-i | **R-B** · `umbralSubidaFuerte` | **D-17**: un solo mapa `porMesa` para los tres retos; V3 se rompía | ficha 1c-2 §2.2 |
| 1c-2-i | **R-D** · Básico empuja sólo con el humano en la mano | **D-13** reformulado: «Básico no pone dinero» chocaba con V7 | ficha 1c-2 §2.2 |
| 1c-2-ii | 4.ª línea de R-D: el multiplicador del Ajilei | **D-19** · §6.2 se quedó fuera de §2.2 | **decisión del rector al abrir 1c-2-ii** |

### 7.3 · `src/engine/deck.js` — dos fases, las dos bajo la excepción §6.1

| Fase | Rango | Por qué | Autoridad |
|---|---|---|---|
| 1b-ii | `shuffleDeck` (`:42-49`): `rng`/`setRng`/`resetRng` | **D-1** · §6.11 — riesgo R-3b de Fase 0 | **excepción pre-autorizada §6.1** |
| 1d-i | el ligado del generador (`AZAR_POR_DEFECTO`) | alinear con el ligado tardío que 1c-i hizo en `aiPlayer.js` | §6.1, dentro del límite: mismo algoritmo, mismas llamadas, mismo orden |

### 7.4 · Los tres que APU-1 no abrió

`src/config/seatLayouts.js`, `src/styles/opponentPanel.css` y
`src/styles/gameTable.css` **conservan el blob del sellado original** de punta a
punta de la campaña. No fue casualidad: hubo **cinco ocasiones** en que parecía
que había que abrirlos, y en las cinco existió la alternativa aditiva que la §1
promete.

1. **1e-ii** — el botón All-in y la marca del asiento pedían reglas en las dos
   hojas protegidas. La marca acabó viviendo en un hueco que `opponentPanel.css`
   **ya reservaba** y que su §H5 saca de flujo con `position: absolute` —diga lo
   que diga, no mueve un píxel—, y todo lo demás fue a `src/styles/apu.css`,
   hoja nueva importada después. Sin un solo `!important`.
2. **1e §3.2** — se midió **antes** de escribir: el rótulo «ALL-IN» ocupaba
   69,56 px contra 151 de hueco. Medir salió más barato que abrir.
3. **1f, STOP de A.2** — el STOP era literalmente «¿hay que abrir el CSS
   protegido?» para que la tarjeta de recarga dejara de tapar las cartas en
   360×640 (**E-29**). No se disparó: el arreglo entero cupo en `apu.css`.
4. **Lecturas, no aperturas** — `gameTable.css:737` (la caja que no es flex, y
   por eso su `gap` no hacía nada) y el `min-height: 40px` de la media query
   táctil (**E-15**) se citan por línea en comentarios e informes. Leer un
   protegido para citarlo es lo que la §1 permite; escribirlo es lo que no.
5. **C-0.5, E-33** — al perseguir el cronómetro de `a1` se hizo un `grep` de
   `.mult-row` sobre el árbol y la salida trajo **~20 líneas de
   `gameTable.css`** (las reglas de la fila y su embaldosado táctil). Se
   consigna aquí por la misma razón que el punto 4: es lectura, no apertura, y
   el blob sigue en `1e21371c8543`. A partir de ahí **toda la geometría se
   midió viva**, por `getComputedStyle` y `getBoundingClientRect` contra el
   servidor de desarrollo, sin volver a leer la hoja; y la regla culpable
   resultó estar en `apu.css`, que es de esta campaña.

### 7.5 · TAB-1 — la puerta del traje A (v1.7)

La mesa del teléfono en vertical (traje A) se abría con `(max-width: 767px) and
(orientation: portrait)`; las tabletas verticales de 768 en adelante caían en una
base huérfana (traje D, informe de la Fase 0 de TAB-1, TF-1). TAB-1 lleva el traje
A a **toda ventana vertical** y lo amplía con un factor (`src/lib/escala.js`,
`src/styles/escala.css`). La apertura es **solo de condición**: ni una regla, ni
un valor, ni una línea más.

| Archivo | Línea | Antes | Después | Autoridad |
|---|---|---|---|---|
| `gameTable.css` | `:1114` | `@media (min-width: 768px) and (min-height: 900px) {` | `@media (min-width: 768px) and (min-height: 900px) and (orientation: landscape) {` | R-4, Victor (ficha TAB-1 1b–1e §3) |
| `gameTable.css` | `:1130` | `@media (min-width: 768px) and (min-height: 601px) {` | `@media (min-width: 768px) and (min-height: 601px) and (orientation: landscape) {` | R-4 |
| `gameTable.css` | `:1165` | `@media (max-width: 767px) and (orientation: portrait) {` | `@media (orientation: portrait) {` | R-4 |
| `opponentPanel.css` | `:645` | `@media (max-width: 767px) and (orientation: portrait) {` | `@media (orientation: portrait) {` | R-4 |

Las dos primeras retiran la base D de la vertical sin tocarla en horizontal (allí
vive el traje de escritorio, que sigue igual); las dos últimas abren A a toda
vertical. Las nueve reglas hermanas de las hojas NO protegidas (`theme.css:120`,
`voz2.css:72,170`, `tactil.css:26,66`, `celebracion.css:242,322`,
`embellecimiento.css:517` y el espejo JSX `GameTable.jsx`) cambian en la misma
tanda con la misma transformación. `seatLayouts.js`, el motor, la IA y la baraja:
ninguna apertura.

