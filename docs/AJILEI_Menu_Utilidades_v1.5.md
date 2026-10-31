# AJILEI — Menú de Utilidades v1.5

> **Sustituido** por `AJILEI_Menu_Utilidades_v1.6.md` (CFG-1 1e, 2026-10-30): salen «Cuenta» y «Saldo», entra «Partida rápida» y Mano actual se paga. Se conserva como historial.

**Estado:** Revisión de especificación. Sustituye a `AJILEI_Menu_Utilidades_v1.4.md`, que queda como historial.
**Fecha:** 2026-08-23
**Base de código:** HEAD `4b42496` (MOV-1b-f). Documento **posterior a la implementación**: recoge lo que la campaña **MOV** ya selló y midió, tanda por tanda, desde `630ee6a`.
**Naturaleza:** **Delta sobre la v1.4.** Todo lo que esta revisión no modifique explícitamente sigue vigente tal como está escrito en la v1.4 y, a través de ella, en la v1.3, v1.2, v1.1 y v1.0: disparador ⋮, panel flotante `fixed` z:30, panel a solo-iconos, badge contador y su popup, "Mano actual" funcional, el circuito completo de Reacciones —selector, burbuja de dos pisos, ciclo de 3,0 s, candado de una a la vez, ✕ de cierre anticipado, enfriamiento de 5 s—, el emoji como pieza propia y la regla de jerarquía de la celebración. **Lo que cambia es dónde vive todo eso: el menú deja de ser una función de escritorio.**
**Autoridad visual:** `AJILEI_Sistema_Diseno_v1.2.md`.
**Base de medición:** campaña **MOV** — modo permanente `menu-movil` del arnés, **16 celdas** (4 mesas × 4 viewports: 375×812, 360×640, 812×375, 640×360) más **contra-celda de escritorio 1920×1080**, con **27 puertas por celda** en la corrida de cierre. Toda cifra de este documento sale de ahí; las que no se midieron se declaran como tales.

---

## 1. Qué cambia — el ⋮ releva a la bocina y se lleva sus cuatro superficies

Hasta la v1.4, el menú entero vivía dentro de `useIsDesktopTable()`. En móvil la única utilidad era el botón de sonido (`MuteButton`), y las cuatro superficies del menú —panel, aviso de "Mano actual", panel de Tapetes y el par selector/burbuja de Reacciones— **no existían**.

| | v1.4 (DSK) | **v1.5 (MOV)** |
|---|---|---|
| Cabecera en móvil | Bocina 🔊 | **⋮**, la misma de escritorio |
| Puerta | `useIsDesktopTable()` | **Dos ramas complementarias por construcción** (§2) |
| Entradas vivas en móvil | — | **Sonido · Reacciones · Tapetes · Mano actual** |
| Colocación de las superficies | Ancladas al ⋮, sin pinza | **Doctrina D6** — satélites con pinza al techo derivado (§4) |
| Selector de reacciones | Rejilla 3×4, 732,56×198 | **Lista de 4 visibles de 12**, 242×186 (§5) |
| Burbuja del humano | Pico sobre la tinta del nombre | **Escritorio igual; en móvil satélite del ⋮, sin pico** (§6) |
| Badge del contador | Montado | **No monta en móvil**; la cifra va en el aviso (§7.1) |

---

## 2. La puerta — complemento exacto, rama por orientación

La puerta de escritorio es `(orientation: landscape) and (min-height: 601px)`: dos *features* de medio y nada más. Su complemento **se expresa**, y exacto:

```css
@media not all and (orientation: landscape) and (min-height: 601px)
```

`not` de Media Queries 3 niega la consulta **entera** (`not all and A and B` = ¬(A ∧ B)). Se elige sobre la forma de MQ4 `@media not ((…) and (…))` por soporte. **Consecuencia buscada: las dos pieles son mutuamente excluyentes por construcción** — nunca aplican las dos y nunca ninguna. Ni un hueco que dependa de que alguien mantenga sincronizadas dos condiciones distintas.

**Regla dura: la rama se toma por ORIENTACIÓN, jamás por ancho.** Dentro del móvil, lo que separa los dos comportamientos es `(orientation: landscape) and (max-height: 600px)` — la misma cifra que ya usaba `LANDSCAPE_TABLE_MQ`. Un `max-width` habría partido mal las cuatro celdas: 812×375 es más ancho que 375×812 y se comporta como el estrecho.

**Espejo JSX↔CSS.** El JS que decide qué se monta y el CSS que lo viste leen la **misma cadena**. Donde el JS necesita el valor —altos de satélite, ramas de colocación— la constante vive en el módulo que la usa y el arnés la importa de ahí; nunca se transcribe.

---

## 3. D4 — ANULADA, con contabilidad

**Lo que decía D4.** El panel en móvil iría abajo a la derecha, con pinza vertical.

**Por qué se anula.** La medición de MOV-1a la descartó en horizontal: en las 8 celdas apaisadas la columna de acción ocupa x 650..800 (a 812 de ancho) y 478..628 (a 640), y el panel de 64×244 caía **encima de los botones del turno**. D4.1 propuso alinearlo al disparador; la medición volvió a descartarla, porque el bloque de saldo del humano (`.player-bar-right`) arranca en y 253,7 y un panel de 244 sólo cabe **empezando arriba del todo**.

**La sustituta (MOV-1a-c) — regla de filos VIVOS.** En horizontal el panel se aparta al único corredor libre, y sus dos números se **miden**, no se cablean:

```
left = max( min(.action-area.left, .player-zone .cards-row.left) − 6 − 64 , 8 )
top  = pinza(8)                       ← el techo manda siempre
```

Se toma el **más a la izquierda** de los dos obstáculos porque entre la mano y la columna de acción hay un canalón de 6 px por el que D4.1 metía el panel encima de las cartas. El corredor resultante es x 76..140, y su holgura al saldo en la celda peor (640×360) es de **1,7 px**: por eso el tope inferior manda sobre el ancla del disparador, y no al revés.

> **Lección de arnés que esto dejó.** El primer verde de este bloque era **vacuo**: `.action-buttons` y `.mult-row` eran `null` en las 16 celdas cuando se midieron, así que «0 px² de solape» no significaba nada. Desde MOV-1a el modo exige **objetivos obligatorios presentes** (`.action-buttons .btn` y `.player-zone .card-slot-wrapper`) antes de dar por limpia una guardia.

---

## 4. D6 · Satélites del ⋮ — doctrina nueva

Las cuatro superficies que **nacen del menú y lo relevan** —aviso de "Mano actual", panel de Tapetes, selector de Reacciones y burbuja del humano— comparten **una sola** regla de colocación (`anclaSatelite`, `useUtilitiesMenu.js`; su gemela para la burbuja, `anclaDelDisparador`, en `Reacciones.jsx`):

```
vertical    right = innerWidth − ⋮.right          top_nominal = ⋮.bottom + 6
horizontal  right = innerWidth − (⋮.left − 6)     top_nominal = 8 + safe-top
siempre     top = clamp( 8 + safe-top, top_nominal,
                         min(timer, cards, action, saldo).top − alto − safe-bottom )
```

Cuatro propiedades que la definen:

1. **Filos VIVOS.** El techo se deriva midiendo `.timer-display`, `.player-zone .cards-row`, `.action-area` y `.player-bar-right` **en el momento de abrir**, y descartando toda caja de 0×0. Ninguna cifra de `gameTable.css` se copia.
2. **La pinza se emite como `clamp()` en línea**, para que el área segura entre por `env(safe-area-inset-*)` sin un solo `!important`.
3. **Rama por orientación**, dentro del complemento de §2.
4. **Puertas:** 0 px² contra la guardia **y contra el propio disparador**, y la superficie entera dentro del viewport. En horizontal, `dRight = 0` contra el filo esperado en las 16 celdas.

**Alto declarado por satélite.** El ancla se calcula **antes** de que la superficie exista, así que cada uno declara su peor caso y el arnés lo contrasta contra la caja viva:

| satélite | alto declarado | caja medida |
|---|---|---|
| Aviso de "Mano actual" | 105 | 203–228 × 65,39–85,58 |
| Tapetes · vertical | 271 | 250 × 270,98 (rejilla 3×2) |
| Tapetes · horizontal | 162 | 406 × 161,59 (fila de 5) |
| Selector de Reacciones | 186 | 244,19 × 188 de borde · 242 × 186 de cliente |
| Burbuja del humano | — (se mide antes de colocar) | 91,56 × 81 · 250,8 × 81 |

> **Cifra que costó una corrección:** el alto de la fila de Tapetes se calculó a mano en 153 y **se quedó 8,59 corto**. La constante se fijó con la medida (162). Un techo derivado no perdona una estimación.

**Colocación medida, 16/16:** vertical `dist ⋮ = 0` por construcción (filos derechos alineados); horizontal, exactamente el hueco de 6 px de D6.

---

## 5. El selector de reacciones en móvil — lista de 4 visibles de 12

La rejilla 3×4 de escritorio mide **732,56 × 198** y no cabe en ninguno de los cuatro viewports móviles (el más ancho es 812; 375, 360 y 640 no dan). La lámina aprobada por Victor la sustituye por una **lista con desplazamiento**.

**Geometría sellada.** Item **idéntico** al de escritorio: 238,19 × 44, relleno 0 12, 14 px / 1,3, glifo SVG de Noto a 1,11 em con margen izquierdo 0,35 em, `nowrap`.

| | valor | derivación |
|---|---|---|
| Caja de **cliente** | **242 × 186** | 4·44 + 3·2 de separación + 2·2 de relleno |
| Caja de **borde** | 244,19 × 188 | + el filete de 1 px por lado |
| Recorrido (`scrollHeight`) | **554** | 12·44 + 11·2 + 2·2 |
| Filas visibles | 4 de 12 | token `--mov-u2-visibles` |

**Es un solo token y ninguna caja nueva.** `--dsk-u2-cols: 1` sobre la **misma** rejilla que ya gobierna el selector; el relleno y la separación bajan de 4 a **2** (con doce filas apiladas, 4 sumaban 44 px de recorrido sin ganar legibilidad). **No hizo falta `data-layout`** — mismo criterio que la fila de cinco de Tapetes.

**Desplazamiento.** `overflow-y: auto` con `overscroll-behavior: contain`, indicador fino en `--gold-brand` (`scrollbar-width: thin`) y desvanecido inferior por máscara. La máscara **recupera alfa plena en los últimos 2 px a propósito**: ahí vive el filete dorado, y una máscara que llega a 0 en el filo se lo comería y el panel parecería roto por abajo.

**El gesto de desplazamiento no cierra el selector, y ya no cerraba.** El cierre por clic fuera es un `pointerdown` en captura que **exime `.u2-selector`** desde DSK-U2. La comprobación previa lo confirmó por lectura y la puerta lo confirma en vivo: `pointerdown` dentro → sigue abierto, `scrollTop > 0`, y **`window.scrollY` sigue en 0**.

**Puertas del selector, 16/16:** las **doce** filas alcanzables —cada una se lleva a la vista y el centro de su caja resuelve a ella, no a un hermano ni al fondo— con hit ≥ 44 en los dos ejes; D6 con `dRight = 0`; 0 px² contra guardia y disparador; tap fuera cierra.

---

## 6. La burbuja del humano en móvil — satélite del ⋮, sin pico

**Decisión de Victor (MOV-1b-e):** en móvil, en las **dos** orientaciones, la burbuja cuelga del ⋮ por D6. **Escritorio conserva el pico sobre la tinta del nombre, sin cambio alguno.**

**Por qué no hay pico.** Colgando del ⋮ el triángulo no alcanza la tinta y señalaría a otra cosa; un pico que apunta a quien no habla miente más que no tenerlo. En la piel móvil **no se copia ni una regla de pico**: los pseudo-elementos viven en el bloque DSK de `gameTable.css`, que no aplica fuera de escritorio, así que no hay nada que apagar. El componente publica `data-ancla` (`tinta` | `satelite`) y ése es el dato que el arnés lee para exigir que **arriba haya pico y aquí no**.

**Un renglón siempre.** Colgada del ⋮ el ancho deja de ser el recurso escaso: la burbuja mide **91,56 × 81** con la frase más corta y **250,8 × 81** con la más larga, en las 16 celdas. Mismo alto, ninguna frase pasa de un renglón.

### 6.1 La rama E (banda junto al nombre) — RETIRADA, con contabilidad

Se retira con el molde de A2 y del emoji no huérfano: **se archiva, no se borra**, y queda **nombrada como remedio disponible si algún día se rediseña la banda del humano**.

**Lo que era.** La burbuja tumbada en dos columnas —emoji 40 a la izquierda, texto a la derecha— dentro de la banda libre entre el bloque del nombre y el del saldo, con pico de 8 px por el costado izquierdo a la altura de la tinta.

**Por qué no se sostiene, medido:**

| | cifra |
|---|---|
| Banda con la mano repartida | **146,92** (375×812) · **131,92** (360×640) — las pastillas Mano/Pie/Turno ensanchan el bloque del nombre |
| Columna de texto que queda | ~50 px |
| Alto de la frase más larga | **125,13** contra los **88,4** disponibles |
| Frases que cabían | **10 de 12** a 375×812 · **4 de 12** a 360×640 |

El resultado era que **la misma pantalla mostraba dos colocaciones distintas según la frase**. Bajar el aire de 6 a 4 —autorizado por Victor— ganó 4 px y no alcanzó; el emoji y el texto no se tocaron por instrucción explícita.

**Encima de la tinta no hay sitio en ninguna de las dos orientaciones, y ésa es la razón de fondo:**

- **Vertical.** Los botones del turno ocupan la banda entera justo encima del nombre, y los 44 px que quedan hasta la tinta son las **pastillas del propio jugador**, que en vertical van encima del nombre. La burbuja mínima se comía **5 646 px²** de la guardia en las ocho celdas.
- **Horizontal.** Con el reloj del turno vivo quedan **10,41 px** sobre la tinta (temporizador 12..60,81 × 198,91..222,11; tinta a y 232,52) y la burbuja más corta mide 76. A los lados tampoco: el raíl apila temporizador, nombre y saldo en 80 px de ancho, y del saldo a las cartas quedan 37.

> **Lección de arnés.** El horizontal se dio por bueno en la comprobación previa con **0 px²**, y era falso: la sonda midió en una fase **sin cuenta atrás**, o sea fotografiando un corredor que no existe cuando el jugador puede reaccionar. Una medida tomada en el estado equivocado es peor que no tenerla.

---

## 7. Límites documentados

### 7.1 El badge del contador no monta en móvil

No es olvido: su popup se ancla **al propio badge**, y en horizontal el panel vive en el filo izquierdo de la pantalla, así que el aviso se saldría. **El saldo sí es el mismo** —una sola clave, un solo contador de 20 consultas gratis, una consulta por mano— y la cifra se dice al consultar, **en la última línea del aviso**. Verificado en las 16 celdas: 20 → 19 al consultar, una segunda consulta de la misma mano no vuelve a cobrar, y el valor persiste tras recarga (comprobado en una celda declarada).

### 7.2 Desfase de 5,14 px en el pie de la burbuja de escritorio — NO corregido, a propósito

El componente sellado mide su caja **al montar**, o sea con la escala de la animación de entrada puesta (`scale(0.94)`), y coloca con 76,14 en vez de con 81. Resultado: el pie de la burbuja queda a **5,14 px** de la tinta y no a los **10** nominales (`pico + 2`). **Existe desde DSK-U2c**, no lo introdujo esta campaña y no se toca aquí: corregirlo mueve escritorio, y eso es otra tanda con su ceremonia. Las dos ramas móviles sí miden la caja real (apagan la animación, miden, la devuelven — dentro de `useLayoutEffect`, o sea antes de pintar). **La contra-celda del arnés lo REPORTA y no lo exige**, para que la deuda esté a la vista cada vez que alguien corra el modo.

### 7.3 Deuda de dos pieles — tres bloques copiados a mano

`gameTable.css` es archivo **protegido** y su bloque DSK no se abre, así que la piel móvil vive en `src/styles/menuMovil.css` bajo el complemento de §2. Son **tres bloques copiados con tokens**:

| bloque | origen | qué cubre |
|---|---|---|
| Panel y disparador | `gameTable.css` §DSK-U1/U1b | tokens `--dsk-u1-*`, caja del ⋮, panel 64×244, entradas 62×44, embaldosado táctil |
| `.u3-*` | §DSK-U3 | las 10 reglas del aviso de "Mano actual" |
| `.u2-*` | §DSK-U2 | las 17 reglas del selector, la burbuja, la ✕ y su embaldosado B2 |

**Todo cambio visual del menú en escritorio hay que replicarlo a mano.** Mientras la fusión no exista —desanidar el bloque DSK es abrir el protegido, y eso lo decide Victor— **el arnés es el único guardián**: el modo `menu-movil` contrasta las cajas móviles contra las **mismas** cifras que `u1` exige arriba, así que una piel que se desvíe de la otra sale en rojo y no en silencio.

**Lo que deliberadamente NO se copió:** `.utilities-popup` (el popup del badge, que no monta en móvil — sería piel muerta).

---

## 8. Notas estructurales de la campaña

**`tapetes.css` desanidado.** Su bloque entero vivía dentro de la media query de escritorio como **segundo cinturón** del sello móvil (fieltro verde aunque el `localStorage` trajera un tricolor). Encendida la función en móvil, ese cinturón dejaría al jugador elegir un tapete, persistirlo y **no ver nada**. Pasa a global. **Δ=0 en escritorio por construcción** y Δ=0 en móvil hasta que el panel se monta: ninguno de esos selectores existía en el árbol móvil. Ver `AJILEI_Tapetes_v1.2.md` §1.

**El barrido dorado de EMB-1 desanidado.** Mismo caso y mismo motivo: el gate de `embellecimiento.css` era espejo de `useIsDesktopTable`, y desde MOV-1b-a la ventana de "Mano actual" monta en móvil. El gate hacía exactamente lo que su comentario prometía impedir —*la ventana existe y el trazo falta*—. Pasa a global, **Δ=0 en escritorio por construcción**.

**Mesa 2 en móvil invierte las vías de render.** En escritorio, mesa 2 pinta al rival por `.ai-zone`; en móvil usa `.ai-zone` en vertical y `.opp-panel` en horizontal. Es la inversa de arriba, está medido y **el arnés lo reporta por celda** en vez de suponerlo.

**`.player-bar` es `display: contents` en horizontal.** Su caja mide 0×0, así que una guardia que la mirase a ella estaría ciega: el saldo del humano quedaba cubierto mientras el arnés daba verde. La guardia mira las **tres celdas hijas** (`.player-bar-left/-center/-right`).

**Un solo verde, y sigue siéndolo.** Con el fieltro verde puesto en móvil, `--green-base`, `--green-abyss` y `--green-deep` resuelven a los mismos valores que antes de la campaña (`#1b482c`, `#09170e`, `#153922`), medidos a los dos lados. El verde no existe como regla: es la ausencia de atributo.

**Contrato de entradas.** Qué está vivo en cada rama no se declara en el arnés: vive en `src/config/menuEntradas.js` (`ENTRADA`, `VIVAS_ESCRITORIO`, `VIVAS_MOVIL`) y el modo lo **importa**, comparándolo contra el `data-entrada` que cada fila publica en el DOM. Antes eran rótulos mantenidos a mano, y los rótulos son copy declarado provisional.

**El botón de sonido queda retirado.** `src/components/MuteButton.jsx` se borra en MOV-2 con cero consumidores en `src/`: el ⋮ es la única cabecera del móvil desde MOV-1a.

---

## 9. Alcance de la campaña y lo que queda

**Dentro:** el envoltorio del menú y sus cuatro entradas vivas en las 16 celdas móviles, con sus cuatro superficies colocadas por D6.

**Fuera, y por qué:**

- **Reacciones de las IAs (U2b).** No se abrió en ninguna tanda de MOV.
- **Saldo.** Sigue inerte por diseño desde la v1.0 §3, en las dos ramas.
- **Copy de las frases.** Provisional y sellado aparte; que una frase larga estire la burbuja es dato para el checkpoint de Victor, no una licencia para reescribirla.
- **El desfase de 5,14 px** (§7.2).
- **Escritorio.** Δ=0 verificado en la contra-celda 1920×1080 en cada tanda.

**Tres correcciones del propio arnés**, todas de la misma familia —*un verde que no mide lo que dice es un bug del arnés*—, registradas aquí porque la lección es general:

1. **Guardia vacua** (MOV-0/1a): se medía solape contra elementos que eran `null`. Se exigen objetivos obligatorios presentes.
2. **Guardia ciega** (MOV-1a-d): `display: contents` da 0×0 y el arnés lo leía como «no hay nada que cubrir».
3. **Medida a destiempo** (MOV-1b-d): la caja de la burbuja se leía a mitad de la animación de entrada — 86,07×76,14 donde la real es 91,56×81, exactamente el 94%. Estuvo a punto de reportarse como regresión de escritorio.
4. **Puerta que pasa por casualidad** (MOV-1b-f): `picoPintado` miraba `display`, y la piel móvil no *apaga* el pseudo del pico: **no lo declara**. Un pseudo sin `content` no se genera aunque su `display` diga `block`. Ahora se lee `content`.

---

## 10. Historial de versiones

- **v1.5** — 2026-08-23. **El menú deja de ser una función de escritorio.** Campaña **MOV**, diez commits desde `630ee6a` hasta `4b42496`. El **⋮ releva a la bocina** en las 16 celdas móviles bajo el **complemento exacto** de la puerta de escritorio, con rama por **orientación y nunca por ancho** (§2). **D4 queda anulada** y la sustituye la regla de **filos vivos** en horizontal (§3). Doctrina nueva **D6 · satélites del ⋮** (§4), compartida por las cuatro superficies, con pinza al techo derivado y 0 px² contra guardia y disparador. **Selector móvil**: lista de 4 visibles de 12, 242×186 de cliente, recorrido 554, un solo token `--dsk-u2-cols: 1` y ninguna caja nueva (§5). **Burbuja del humano en móvil: satélite del ⋮, sin pico y de un renglón**, con la rama E archivada y su contabilidad (§6.1); escritorio conserva el pico sobre la tinta. **Límites escritos**: el badge del contador no monta en móvil y la cifra viaja en el aviso (§7.1); el desfase de 5,14 px del pie de la burbuja de escritorio existe desde U2c y **no se corrige a propósito** (§7.2); la **deuda de dos pieles** son tres bloques copiados a mano y el arnés es su único guardián (§7.3). **Notas estructurales**: `tapetes.css` y el barrido de EMB-1 se desanidan a globales con Δ=0 verificado, y mesa 2 móvil invierte las vías de render (§8). Verificado con el modo permanente `menu-movil`: **27 puertas × 16 celdas, 16/16 verde en 537 s**, más contra-celda 1920×1080 con Δ=0.
- **v1.4** — 2026-08-14. **El emoji se vuelve pieza propia.** La burbuja pasa a dos pisos, el emoji anima mientras la burbuja vive, la doctrina del emoji no huérfano queda archivada con contabilidad (techo medido de 17,03 px), dos sustituciones selladas para cumplir 12/12, fuente de glifos unificada y autoalojada, tres reglas de accesibilidad medidas, y la regla nueva de que **la celebración manda el lenguaje de movimiento**. Doc-only; la implementó **DSK-U2c**.
- **v1.3** — 2026-08-07. **"Mano actual" funcional.** Consulta por mano, disponibilidad por fase, caso N=0 y persistencia; popup del valor con desglose desde la fuente única, dos cierres, capa 31, Δ=0. Implementado en la tanda **DSK-U3**.
- **v1.2 · v1.1 · v1.0** — ver sus documentos. Selector 3×4 con sus tres cierres, burbuja anclada por tinta, candado y enfriamiento; badge del contador y su popup; disparador ⋮ y panel flotante a solo-iconos.
