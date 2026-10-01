# AJILEI · VOZ-2 · La frase del óvalo · Fase 0 · Informe v1.0

**Fecha:** 2026-10-01
**Ficha:** `AJILEI_VOZ-2_Fase0_v1.0.md`
**Punto de partida:** `main` en `422f83b` (BIE-1d), árbol limpio salvo los seis residuos conocidos.
**Línea base al empezar:** build limpio · vitest **1073/1073** (39 archivos) · eslint **21** (20 errores + 1 aviso) · `1.8b` **220,4 KiB** (rojo conocido, techo 200). Las cuatro cifras coinciden con el cierre de BIE-1.
**Instrumento:** Edge **154.0.4258.37** (las baselines selladas de DSK son de 151; aquí solo se usan medidas relacionales, ver R-9) · playwright-core del repo · `vite preview` 4173 tras `npm run build`, con la sesión simulada de `scripts/cap/capMesa.mjs` (`contextoCap`) y la ruta de `scripts/rutaMesa.mjs` (`basico`, apuesta 0, entrada `medio`, semilla 5).
**Escrituras:** solo este informe. Las tres sondas (`frases.mjs`, `sonda.mjs`/`sonda3.mjs`, `sonda2.mjs`) vivieron en el scratchpad, fuera del repo. El preview se cerró al terminar. Sin commits.

## Resumen

| Pregunta | Respuesta |
|---|---|
| ¿STOP-1? | **No.** El rectángulo del óvalo da **Δ = 0** en las 20 celdas (5 vistas × mesas 5/4/3/2) con las 9 formas de frase, de 27 a 188 caracteres. Hay un hallazgo cercano que el rector debe ver primero: **C-2** |
| C-2 · El interior del óvalo sí se mueve | En **360×640, mesas 5 y 4**, una frase que contiene «Heptacoins» hace saltar el `<p>` a su propia fila. El pozo se mueve **3,09 px**, la nota del comodín **161,78 px** y el mensaje **198,81 px**. El contorno del óvalo no se mueve. El hallazgo es anterior a VOZ-2 |
| ¿Cabe la frase hoy? | En escritorio, hasta ~68 caracteres en 2 líneas. **En móvil vertical de mesas 5/4 no cabe ni la frase real más corta**: el `<p>` mide 73–117 × 28 px (cabe 1 línea) y «IA 3 gana con Oros, 42 pts.» ya ocupa 2–4 líneas y se sale de su caja |
| ¿Recorte sin protegidos? | **Sí**, con un `<span>` nuevo en `GameTable.jsx` (no protegido) y una hoja aditiva como `luz.css`, sin `!important`. **Pero el recorte ingenuo mueve el óvalo hasta 906 px** en móvil 5/4: hace falta cortar el `min-content` (`contain: inline-size`). Con eso, Δ = 0 medido en todas las celdas |
| ¿Dónde se engancha D3? | En el `onClick` de «Siguiente mano» (`GameTable.jsx:2359-2368`), que anula `winner` y deja `resultado` en `null` en ese mismo render. Se recomienda **derivar** el estado abierto de `game.handCount`, sin efecto |
| ¿Créditos cruzados? | **`src/config/creditos.js:65-66` ya coincide con la tabla de verdad.** El cruce vive en un documento: `docs/AJILEI_Victory_Celebration_v1.0.md:345-346` |

---

## §A · Dónde nace y dónde se pinta la frase

### A1 · El texto

La frase se compone en `GameTable.jsx:1909` (ruta `center-zone`) y `:1985` (ruta `two-ovals`), con la misma fórmula:

```js
const centerMsg = resultado ? [resultado.texto, capasTexto].filter(Boolean).join(' ') : (discardMsg ?? cronica)
```

| Pieza | De dónde sale |
|---|---|
| `resultado` | `composeResultado(...)` en `GameTable.jsx:472`, de `src/hooks/resultadoCore.js:175`. Devuelve `null` fuera de PAYOUT/GAME_OVER |
| Ganador y mano | `deShowdown` (`resultadoCore.js:106`): ganador corriente con `voz()` («Espadas, 41 pts», `:26`), empate («Empate, N pts.»), desempate «por ser la Mano» / «por ser el más cercano a la Mano», AJILEI, «(comodín)» y «¡Ambos/Tres/Cuatro/Cinco con AJILEI!» (`CUANTOS`, `:44`). El sujeto es «La IA» en mesa 2 y «IA n» en 3–5 (`:38-39`) |
| Retiros | `porRetiros` (`:87`) |
| Fin de partida | `finDePartida` (`:68`). **No llega al óvalo**: en GAME_OVER la mesa pinta `.game-over-screen` o `PantallaVictoria` en lugar del tablero (`GameTable.jsx:2076-2100`) |
| Capas | `capasTexto = componeCapas(repartoPorCapas(game), ...)` (`GameTable.jsx:1363-1364`; `cronicaCore.js:180`; `mesaCore.js:347`). Solo existe si el pozo se partió en más de una capa. Formato: «El pozo se partió: Te llevas otros N Heptacoins. IA k se lleva N. N vuelven sin igualar.» |

**No pasa por `t()`.** Todo son literales en `resultadoCore.js` y `cronicaCore.js`, más `MONEDA = 'Heptacoins'` (`cronicaCore.js:27`). No hay claves en `textos.es.js` para esta frase. IDI-1 tendrá que sacarlas, y eso alarga la frase (D4).

### A2 · El pintado

Hay **un solo componente** (`GameTable`) y **un solo elemento**: `<p className={"game-message"+msgClass} data-tono data-capas key=…>`. La clase de resultado es `msg-win` o `msg-lose` (`claseTono`, `resultadoCore.js:50`). El elemento se monta por dos caminos de render:

| Camino | Dónde | Cuándo |
|---|---|---|
| `renderCenterZone()` → `section.center-zone > p` (`GameTable.jsx:1901-1971`, p en `:1943`) | `:2120` y `:2144` | Mesas 3/4/5 en todas las vistas, y mesa 2 en escritorio y en vertical |
| `renderTwoOvalsZone()` → `.two-ovals > .felt-oval.oval-right > p` (`:1978-2014`, p en `:2007`) | `:2131` | Solo mesa 2 en **horizontal móvil** (`aliveN === 2 && isLandscapeTable`) |

**Nota sobre la regla de los dos caminos.** La partición de la ficha (`OpponentPanel` en 5/4/3, `.ai-zone` en mesa 2) es la del **rival**. Para la **frase**, la partición real es la de la tabla de arriba. En escritorio, mesa 2 usa `.ai-zone` para el rival y `center-zone` para la frase. Las dos particiones se midieron.

**PvP:** no tiene camino. `src/screens/PartidaPvP.jsx` (90 líneas) es un stub sin `.game-message` ni `GameTable`.

### A3 · El estilo

**Todas las reglas que gobiernan la frase viven en `src/styles/gameTable.css`, que es protegido (n.º 6).** Ninguna hoja no protegida toca `.game-message`. `luz.css:157-174` toca `.center-zone`, pero solo su fondo.

| Línea | Ámbito | Regla |
|---|---|---|
| `:186-197` | base | `font-size 14; line-height 1.3; height 54px; flex: 1; display: flex; align-items/justify-content: center; text-align: center` (sin `overflow`) |
| `:199-200` | base | `.msg-win` / `.msg-lose`: 15 px, peso 700, color |
| `:1140-1150` | escritorio ≥768×601 | `.table-four/.table-five .center-zone`: grid `auto minmax(0,360px)`, `overflow: hidden`. El `<p>` va en la columna 2 y la fila 1 (`:1147-1148`) |
| `:1317-1320`, `:1325` | vertical ≤767 | mesa 3: `flex-basis: 100%; height: 36px`. General: `.game-message { height: 28px; font-size: 13px }` |
| `:1972` | vertical | mesa 2: `flex-basis: 100%` |
| `:2721-2723` | horizontal ≤600 alto | `.table-wide/-four/-three .game-message { font-size: 9px; height: 16px }` |
| `:2751` | horizontal | `.game-message { height: 22px; font-size: 12px }` (lo pisan las de arriba en 5/4/3) |
| `:4143-4150` | horizontal, mesa 2 | `.table-two .oval-right .game-message { height: auto; font-size: 12px; line-height: 1.3 }`. **Es la única caja de altura variable** |
| `:5561-5568` | escritorio | `.table-three/.table-two .center-zone { overflow: hidden }` y `.game-message { min-width: 0 }` |

Valores calculados en el pago (medidos): escritorio 15 px / 19,5 / 54 de alto; vertical 13 px / 16,9 / 28 (36 en mesa 3); horizontal 5/4/3 9 px / 11,7 / 16; horizontal mesa 2 12 px / 15,6 / alto automático.

### A4 · El ciclo de vida

| Momento | Qué pasa con la frase | Referencia |
|---|---|---|
| Entrada en PAYOUT | `resultado` deja de ser `null`, y en el mismo render se pinta la frase con su tono. Con `key='msg'` el `<p>` no se remonta, solo cambia el texto. «Siguiente mano» está disponible desde t = 0 (medido en 10/10 celdas) | `GameTable.jsx:472`, `:1909` |
| Recarga confirmada | `aplicarRecarga` cambia pilas, pero la fase sigue en PAYOUT y `winner` no cambia: **la frase se queda** | `:1112-1135` |
| **Clic en «Siguiente mano»** | `setIsClearing(true)` y `setGame(prev => ({ ...prev, message: '', winner: null }))`. `resultado` pasa a `null` en ese render y el `<p>` queda vacío (la crónica devuelve `''` en PAYOUT). A los 300 ms se llama a `beginHand()` | `:2359-2368`, `:1577` |
| Mano nueva | `commitNewHand` → `setGame(next)` (`handCount` + 1), y la crónica de fase llena el óvalo | `:1631-1640` |
| Eliminación de una IA | `beginHand` → `runEliminationCeremony`. Durante `elimNotice` el `<p>` **se desmonta** y lo sustituye `.elim-notice-inline` | `:1593-1615`, `:1915`, `:1964` |
| Quiebra del humano | `beginHand` → `setBankruptModal(true)`. Ocurre ya fuera de la frase (tras el clic) | `:1582` |
| Fin de partida | GAME_OVER: no hay óvalo | `:2076` |

**Punto de enganche de D3.** El único camino de PAYOUT a la mano siguiente pasa por el `onClick` de `:2359`, y ese clic anula `winner` antes de nada. Se recomienda no escuchar el clic, sino **derivar**:

```js
const [vozAbierta, setVozAbierta] = useState(null)              // guarda game.handCount
const abierta = !!resultado && vozAbierta === game.handCount     // se cierra sola
```

- Se cierra en el mismo render en que `resultado` cae a `null`.
- Una frase vieja no puede reabrirse porque `handCount` ya cambió.
- Sin `useEffect`, así que no se añade un `set-state-in-effect` al lint (molde U1: derivar en vez de sincronizar).
- `FRZ-1` difiere `beginHand` con la pestaña oculta, pero el `winner: null` es síncrono al clic, así que el cierre no se difiere.

---

## §B · Cuánto mide la frase y cuánto cabe

### B1 · Inventario de formas

Generadas con los compositores **reales** (`composeResultado` + `componeCapas`, importados desde Node). Los caracteres cuentan espacios y signos.

| Forma | Ejemplo (mesa 5) | Car. (m2 / m3 / m4 / m5) |
|---|---|---|
| Corriente, humano (la más corta) | ¡Ganas con Espadas, 41 pts! | 27 / 27 / 27 / 27 |
| Corriente, IA | IA 4 gana con Espadas, 41 pts. | 31 / 30 / 30 / 30 |
| Retiros, humano | Los demás se retiran. ¡Ganaste el pozo! | 34 / 39 / 39 / 39 |
| Empate, la Mano gana | Empate, 31 pts. Gana IA 4 por ser la Mano. | 43 / 42 / 42 / 42 |
| AJILEI con comodín, IA | ¡AJILEI! IA 4 gana con mano perfecta (comodín). | — / — / — / 47 |
| Empate, gana el más cercano | Empate, 31 pts. Gana IA 4 por ser el más cercano a la Mano. | 60 / 59 / 59 / 59 |
| **Varios AJILEI + desempate** (la más larga sin capas) | ¡Cinco con AJILEI! IA 4 gana por ser el más cercano a la Mano. | 63 / 61 / 63 / 62 |
| Corriente + 1 capa | IA 4 gana con Espadas, 41 pts. El pozo se partió: IA 1 se lleva 200. | 82 / 68 / 68 / 68 |
| Corriente + «Te llevas» | IA 4 gana … El pozo se partió: Te llevas otros 1500 Heptacoins. | 83 / 82 / 82 / 82 |
| **Peor caso factible** | ¡Cinco con AJILEI! IA 4 gana por ser el más cercano a la Mano. El pozo se partió: Te llevas otros 125000 Heptacoins. IA 1 se lleva 125000. IA 2 se lleva 125000. 100000 vuelven sin igualar. | **110 / 143 / 167 / 188** |
| Fin de partida (no va al óvalo) | ¡Ganaste la mesa! Eres el último con Heptacoins. | 48 |

Cómo se acotó el peor caso:
- Con N asientos hay como mucho N capas. Una la gana el principal, N−2 van a otros asientos y la de arriba puede volver sin igualar. Por eso en mesa 2 la cola solo puede ser «N vuelven sin igualar.»
- Los montos de 6 cifras salen de la apuesta `pro` de 1000 × entrada `techo` 50 (`ajileiConfig.js:34`).
- Los montos se escriben sin separador de miles.

### B2 · Caja disponible (pago real, mano jugada, revelación asentada)

Los anchos de la caja son los del `<p>` en el pago real. «Real» es la frase que salió con la semilla 5, en líneas.

| Vista | Mesa | `<p>` (an × al) | Fuente / línea | Líneas que caben | Real |
|---|---|---|---|---|---|
| 1920×1080 | 5 / 4 | 197–275 × 54 (ancho según contenido, tope medido 275,56) | 15 / 19,5 | 2 | 1 |
| 1920×1080 | 3 | 357,09 × 54 | 15 / 19,5 | 2 | 1 |
| 1920×1080 | 2 | 505,19 × 54 | 15 / 19,5 | 2 | 1 |
| S25 412×915 | 5 / 4 | **117,19 × 28** | 13 / 16,9 | 1 | **2** (se sale) |
| S25 412×915 | 3 | 324 × 36 | 13 / 16,9 | 2 | 1 |
| S25 412×915 | 2 | 324 × 28 | 13 / 16,9 | 1 | 1 |
| 390×844 | 5 / 4 | **95,19 × 28** | 13 / 16,9 | 1 | **2** (se sale) |
| 390×844 | 3 / 2 | 302 × 36 / 302 × 28 | 13 / 16,9 | 2 / 1 | 1 |
| 360×640 | 5 / 4 | **73,19 × 28** | 13 / 16,9 | 1 | **3 / 4** (se sale) |
| 360×640 | 3 / 2 | 272 × 36 / 272 × 28 | 13 / 16,9 | 2 / 1 | 1 |
| 844×390 | 5 / 4 | **113,5 × 16** | 9 / 11,7 | 1 | **2** (se sale) |
| 844×390 | 3 | 235,75 × 16 | 9 / 11,7 | 1 | 1 |
| 844×390 | 2 (`two-ovals`) | 135 × alto auto (31,19 con 2 líneas) | 12 / 15,6 | crece | 2 |

**Ya hoy hay desborde.** Ningún `<p>` tiene `overflow`, así que el texto que no cabe se sale de su caja por arriba y por abajo (centrado por `align-items`).
- En escritorio lo recorta `.center-zone { overflow: hidden }`, pero el óvalo es tan alto (234 / 170 px) que **nada llega a recortarse**: con el peor caso, 188/188 caracteres siguen dentro del óvalo.
- En móvil el óvalo no recorta nada. El peor caso de mesa 5 a 390×844 ocupa 15 líneas y se sale **112 px por arriba y 111 por abajo** de su caja, sobre los paneles rivales y la zona del jugador.

### B3 · Qué formas caben enteras hoy (sin salirse de la caja del `<p>`)

| Vista | Mesa 5 / 4 | Mesa 3 | Mesa 2 |
|---|---|---|---|
| 1920×1080 | hasta 68 car. (2 líneas). No caben: «Te llevas» (82, 3 líneas) ni el peor (6 y 5 líneas) | hasta 82. No cabe: el peor (143, 4 líneas) | **todas**, incluido el peor (110 en 2 líneas) |
| S25 412×915 | **ninguna** (la corta ya va en 2 líneas) | hasta 68. No cabe: el peor | hasta 48. No caben: ≥ 60 |
| 390×844 | **ninguna** (la corta va en 3 líneas) | hasta 68. No cabe: el peor | hasta 34. No caben: ≥ 48 |
| 360×640 | **ninguna** (la corta va en 3 líneas) | hasta 68. No cabe: el peor | hasta 34. No caben: ≥ 48 |
| 844×390 | **ninguna** (la corta va en 2 líneas en una caja de 1) | hasta 48. No caben: ≥ 59 | La caja crece. Hasta 34 caben en 2 líneas; con ≥ 48 crece el `<p>` (ver C-3) |

---

## §C · El óvalo como línea base de D1

### C1 · Rectángulo del óvalo (x, y, ancho, alto) en el pago

«Óvalo» es `.center-zone`, o `.felt-oval.oval-right` en `two-ovals`. Se midió con la frase real y después, **en el mismo `evaluate` síncrono**, con cada una de las 9 formas inyectadas en el `<p>` real, restaurando al final (`restaurado: true` en 20/20). **La medida con la frase más corta (27) y con la más larga (110–188) es idéntica a la de la tabla: Δ < 0,01 px en 20 celdas × 9 formas.**

| Vista | Mesa 5 | Mesa 4 | Mesa 3 | Mesa 2 |
|---|---|---|---|---|
| 1920×1080 | 728,22, 391 · 463,56 × 234 | 728,22, 391 · 463,56 × 234 | 630,05, 391 · 659,91 × 234 | 556, 455 · 808 × 170 |
| S25 412×915 | 21, 409,47 · 370 × 119 | 21, 410,08 · 370 × 119 | 21, 265,5 · 370 × 332,5 | 21, 256 · 370 × 341,5 |
| 390×844 | 21, 365,02 · 348 × 119 | 21, 364,52 · 348 × 119 | 21, 265,5 · 348 × 261,5 | 21, 256 · 348 × 270,5 |
| 360×640 | 21, 274,81 · 318 × 96 | 21, 274,81 · 318 × 96 | 21, 237,5 · 318 × 134,5 | 21, 231 · 318 × 140,5 |
| 844×390 | 186, 166,11 · 486 × 37,8 | 186, 166,11 · 486 × 37,8 | 186, 166,11 · 486 × 37,8 | `oval-right` 678, 134,91 · 157 × 69 |

Con el peor caso inyectado, el scroller (`.game-table-screen`) tampoco creció: `scrollHeight − clientHeight` = 0 en las 20 celdas.

### C2 · Hallazgo crítico: el óvalo no se mueve, pero su interior sí

**El tamaño y la posición del óvalo no dependen de la frase** en ninguna celda, así que no hay STOP-1. Pero hay tres sensibilidades del **contenido** que el rector debe conocer antes de la Fase 1:

**C-2 (la importante) · 360×640, mesas 5 y 4.** Con cualquier frase que contenga «Heptacoins» se reacomoda el interior del óvalo:

| Ancla | Δ medido |
|---|---|
| Mensaje | 198,81 px |
| Nota del comodín | 161,78 (m5) / 161,19 (m4) px |
| Pozo | 3,09 px |
| Contorno del óvalo | 0 |

- **Formas que lo disparan:** el fin de partida, la forma realista «IA 3 gana con Espadas, 41 pts. El pozo se partió: Te llevas otros 1500 Heptacoins.» y el peor caso. Las formas sin esa palabra no lo hacen, aunque sean más largas (por ejemplo, la de 68 caracteres).
- **Causa:** el `<p>` es `flex: 1` con `min-width: auto` dentro de un `flex-wrap`, así que su mínimo es la **palabra más larga**. «Heptacoins.» no cabe en 73,19 px y el `<p>` salta a una fila propia. A 390 y en el S25 la caja (95 y 117 px) sí la admite y no pasa.
- Es **preexistente**: le pasa hoy a la frase de capas cuando el humano se lleva una capa en mesa 4/5 a 360×640. Probablemente también a la crónica de apuestas con «Heptacoins» en 20 px; eso no lo medí.
- Captura: `s3_360x640_m5_peor.png` del scratchpad. El `<p>` cae sobre el pozo y la nota del comodín se va a la derecha.

**C-3 · 844×390, mesa 2 (`two-ovals`).** El `<p>` tiene `height: auto` (`gameTable.css:4143-4150`) y **crece con la frase**: +15,59 px con 3 líneas y +46,78 con 5. El `oval-right` no cambia (157 × 69): con 5 líneas el texto sobresale del óvalo.

**C-4 · 1920, mesas 5 y 4.** El `<p>` es un ítem de grid con `justify-items: center`, así que **su ancho sigue al contenido**: 196,86 px con la frase real y 275,56 de tope medido. El pozo y el óvalo no se mueven (la pista es `minmax(0,360px)`).

### C3 · Referencia para la Fase 1

La tabla C1 es la referencia de Δ = 0. Las anclas del interior que ya se movían antes de VOZ-2 (C-2, C-3 y C-4) se reportan aparte, para que una puerta de la Fase 1 no las tome por regresión ni las esconda.

---

## §D · Viabilidad del recorte sin protegidos

### D1 · Mecanismo

**Viable sin abrir `gameTable.css`.** Hacen falta tres piezas:

1. **JSX** (`GameTable.jsx`, no protegido). En las dos rutas, el texto pasa a `<p …><span className="voz2-texto">{centerMsg}</span></p>`, **solo cuando hay `resultado`**. El `<p>` conserva su caja, su `key`, su `data-tono` y su `msgPop`. `textContent` no cambia.
2. **Hoja aditiva** `src/styles/voz2.css`, con una línea de import como `luz.css` (`GameTable.jsx:70`). El `span` es una clase **nueva**: ninguna regla existente lo alcanza, así que no hay especificidad que ganar.
3. **Un solo punto con cascada:** en escritorio 4/5 el `<p>` necesita `justify-self: stretch` (ver D2). Basta con `.game-table-screen .center-zone .game-message.voz2-…` (0,4,0) frente a 0,3,0. Sin `!important`.

El recorte **no se puede poner sobre el `<p>`**. El `<p>` es `display: flex` y el texto vive en un ítem anónimo: `text-overflow` no lo alcanza, y `-webkit-line-clamp` obliga a cambiar el `display` y se pierde el centrado vertical.

### D2 · Medido: una línea frente a dos (con `span` interior)

**Trampa medida (R-1).** El candidato obvio (`span { white-space: nowrap; overflow: hidden; text-overflow: ellipsis }`) **mueve el óvalo**:
- **+906 px** (360×640 m5, peor caso), +780 (m4) y +854 (S25 m5).
- 56–148 px ya con 59–68 caracteres.

La causa es que el `min-content` de una línea sin cortes es la frase entera y sube por el `flex-wrap` hasta el óvalo. El clamp a dos líneas sin contención también movía el `<p>` 198,81 px en 360×640 5/4.

**El arreglo medido es `contain: inline-size; width: 100%` en el `span`.** Corta la propagación: **óvalo Δ0, pozo Δ0 y comodín Δ0 en las 10 celdas de la sonda dirigida, con las 9 formas.** Como efecto lateral corrige C-2.

En escritorio 4/5, con la contención el `<p>` (de ancho según contenido) se colapsa a 0. Hay que estirarlo a su pista: queda en **275,56 px constantes**, cuando hoy varía entre 196 y 275 según la frase. Es un cambio de la caja del `<p>`, no del óvalo.

Caracteres visibles (los que caen dentro del recorte, contados glifo a glifo con `Range`):

| Vista | Mesa | **1 línea** (`ellipsis`) | **2 líneas** (`line-clamp: 2`) | ¿Cambia el alto de la caja? |
|---|---|---|---|---|
| 1920 | 5 / 4 | ~37 car. | **enteras hasta 68**; «Te llevas» 71/82; peor 77 | No (`<p>` 54; el `span` mide 39) |
| 1920 | 3 | 47–49 | enteras hasta 82; peor 92/143 | No |
| 1920 | 2 | 67–69 | **todas enteras** (peor 110 en 2 líneas) | No |
| S25 | 5 / 4 | 16–17 | 27–39 | `<p>` no. **El `span` (33,78) sobresale 2,89 px arriba y abajo** de la caja de 28 |
| 390 | 5 / 4 | 13–14 | 23–36 (la corta, 23/27) | Igual: sobresale 2,89 |
| 360 | 5 / 4 | **10–11** | **15–25** (la corta, 20/27) | Igual: sobresale 2,89 |
| S25 / 390 / 360 | 3 | ~41–48 | enteras hasta 68; peor 85–97 | No (el `span` cabe en 36) |
| S25 / 390 / 360 | 2 | ~41–49 | enteras hasta 82–83; peor 83–90 | Sobresale 2,89 |
| 844 | 5 / 4 | 23–25 | enteras hasta 48; las demás 44–51 | Sobresale 3,69 (caja de 16, `span` de 23,38) |
| 844 | 3 | ~47 | enteras hasta 68; peor 104 | Sobresale 3,69 |
| 844 | 2 (`two-ovals`) | 21–24 | 27–47 | **Sí con 1 línea**: el `<p>` (alto auto) baja de 31,19 a 15,59. Con 2 líneas queda en 31,19, como hoy con 2 líneas |

En las celdas donde «sobresale», el sobrante (2,89 o 3,69 px) es mucho menor que el desborde de hoy (11–112 px). El óvalo no se mueve en ningún caso.

**Lectura.** En escritorio y en mesas 3/2, el clamp a **2 líneas** deja enteras casi todas las formas reales, y el «…» solo aparece con capas largas. En **móvil vertical de mesas 5/4** la caja es tan estrecha que la frase recogida dice «IA 3 gana…» (1 línea) o poco más de media frase (2 líneas). Es la decisión de producto más importante de la Fase 1 (pregunta 2).

### D3 · El «…» solo cuando no cabe

Con CSS, el «…» de `text-overflow` y de `line-clamp` solo se pinta si hay recorte. Medido: las formas que caben salen sin recorte (`scrollWidth/Height ≤ client`) en todas las celdas.

El **indicio de toque** (cursor, subrayado o un `aria-expanded` con sentido) sí necesita saber si hubo recorte. CSS no lo expone, así que hará falta medir `scrollHeight > clientHeight` en JS: en layout tras pintar y con `ResizeObserver` al cambiar de vista. La medida es por **ancho real** y no por caracteres, como pide D4.

---

## §E · La capa desplegada

### E1 · Dónde montarla

Cadena de posicionamiento medida en el pago, por encima de la frase (`sonda2`, 10 celdas):

| Ancestro | Escritorio | Vertical | Horizontal |
|---|---|---|---|
| `.center-zone` | `relative` · **`overflow: hidden`** | `relative` | `relative` |
| `.mid-center` / `.table-mid` | `static` | `static` | `.table-mid` `relative` en 5/4 |
| `.game-table` | `static` | `static` (`relative` en 360×640 m5) | `relative` |
| `main.game-table-screen` | `static`, `overflow: auto` (scroller) | igual | igual |

Ningún ancestro tiene `transform`, `filter`, `contain` ni `z-index`, así que no hay contexto de apilamiento intermedio.

Consecuencias para el patrón que sugiere la ficha:

- **`absolute` colgado de `<main>` no ancla a `<main>`.** `<main>` es `static`, así que la capa se resolvería contra el bloque contenedor inicial y no seguiría al scroller. La «lección del panel de configuración» (`lobby.css:605-625`) era justo lo contrario: allí el lienzo `.lobby` sí era `relative`. Para que el patrón funcione habría que dar `position: relative` a `<main>` o a `.game-table` desde la hoja nueva, **y antes auditar qué absolutos de la mesa cambiarían de bloque contenedor** (R-6).
- **Dentro de `.center-zone`** (siempre `relative`), la capa sigue al óvalo y al scroll. Pero **en escritorio la recorta el óvalo**, así que tendría que caber dentro de él. Cabe sin problema: a 15 px el peor caso (188) ocupa ~6 líneas en 275 px, unos 117 px, frente a óvalos de 234, 234 y 170 px de alto. En móvil no hay recorte y puede salir del óvalo.
- **Hermana de `<main>` en `fixed`**, colocada midiendo el `<p>`. Es el patrón de todas las capas de mesa de hoy (`.vc-capa`, `.vc-ajilei-capa`, `.utilities-panel`, `.u2-burbuja`): `GameTable.jsx:2584-2590`, `gameTable.css:321-369`. No necesita portal. Hay que recolocarla con `resize`, y con scroll si lo hubiera (en el pago medido `scrollHeight = clientHeight` en 10/10; DSK midió 27 px de scroll a 1280×720).

D2 dice «fuera del óvalo». Si eso significa *fuera de su flujo*, la segunda opción lo cumple. Si significa *fuera de su contorno*, en escritorio solo lo cumplen la primera (previa auditoría) y la tercera. Es la pregunta 4.

### E2 · Convivencia al final de la mano

Línea de tiempo medida (`sonda2`, t = 0 cuando se detecta el resultado, ≤ 0,2 s después de entrar en PAYOUT): el resultado, `win-score-chip` y «Siguiente mano» aparecen a 0. `.vc-capa` (vuelo de monedas) y `.vc-pulso` (si gana el humano) van de **~2,0 s a ~3,65 s**, igual que REC-1 (+3,72 s).

| Capa | Posición · z | Eventos de puntero | Cuándo | Fuente |
|---|---|---|---|---|
| Paneles rivales / ganador revelado / grow / Z1 | en flujo · 1 / 7 / 8 / 9 | sí (nombre tocable z 6) | todo el pago | `opponentPanel.css:35`, `gameTable.css:5155,5288,5363` |
| `.pot-float` (+N) | absoluto · 10 | no | solo si el pozo sube (no en el pago) | `gameTable.css:164-175` |
| `.rec-burbuja` | absoluto en `.rec-ranura` · 5 | sí | tras `recargaLista` (vuelo aterrizado o red de 6 s), mientras quedan > 5 s de plazo | `rec.css:19-35`, `mesaCore.js:384,396` |
| `.u2-burbuja` (reacción) | fixed · 25 | no | vetada durante la celebración | `gameTable.css:6076-6098` |
| `.vc-capa` (vuelo del pozo) | fixed · 26 | no | ~2,0 → ~3,65 s | `gameTable.css:321-326` |
| Panel ⋮ / popups | fixed · 30 / 31 | sí | a petición | `gameTable.css:5859`, `menuMovil.css:84` |
| `.vc-ajilei-capa` | fixed · 32 | no | 2000 ms, solo con AJILEI | `gameTable.css:361-369`, `celebracionCore.js:30` |
| Abandonar | fixed · 100 | sí | a petición | `gameTable.css:670-679` |
| Tarjeta de recarga / bancarrota | fixed · 120 (`apu-suave`: sin velo, pegada abajo) | sí (forzosa con velo) | al tocar la burbuja, en los últimos 5 s o en el acto (voluntaria); la bancarrota sale tras «Siguiente mano» | `gameTable.css:720-730`, `apu.css:141-150` |

**Dónde encaja la capa sin tapar lo que REC-1 protegió:**
- **z entre 10 y 24.** Así queda sobre la mesa (techo de la mesa en el pago: 9) y bajo el vuelo (26), AJILEI (32), los popups y los modales. El vuelo y la celebración se seguirían viendo por encima de una frase abierta.
- **Geometría:**
  - En móvil vertical el óvalo está a **2–4 px** de la zona del jugador. En mesa 5 a 360×640 los paneles rivales terminan 1,8 px por encima (paneles hasta y = 273, óvalo desde 274,81).
  - Una capa que crezca hacia abajo tapa las cartas del humano; una que crezca hacia arriba tapa las cartas reveladas de los rivales, que es justo «ver la revelación».
  - En 844×390 el `oval-right` de mesa 2 queda 45 px por encima de «Siguiente mano» y de la ranura de la burbuja (x 682–832). En 5/4/3 la ranura está a la derecha del óvalo, no debajo.
- La capa la abre el jugador, así que el tapado es voluntario. Aun así, la forma y la posición por vista son materia de la lámina.

### E3 · Si llega la burbuja o la tarjeta con la frase abierta (comportamiento del código de hoy)

- **La burbuja** se monta en `.player-bar .action-area.rec-ranura` (`GameTable.jsx:2397-2411`), lejos del óvalo en vertical y en escritorio (126–238 px). No toca la frase. Solo choca en 844×390 mesa 2, si la capa crece hacia abajo.
- **La tarjeta** (`.bankrupt-overlay.apu-suave`, fixed, z 120, alineada abajo) taparía cualquier capa de z < 120 donde se solapen. La **forzosa** lleva velo y desenfoque sobre todo, incluida la capa.
- **Con la recarga viva, «Siguiente mano» no existe** (quinta condición del gate, `GameTable.jsx:2350`). El cierre automático de D3 se retrasa hasta que la recarga se resuelve.
  - Si se confirma, la frase sigue (sigue PAYOUT con el mismo `winner`).
  - Si se rechaza la forzosa, `salir()` desmonta la mesa entera.
- Nada de hoy cierra la frase por sí solo al llegar la burbuja. La regla de convivencia queda para el rector (pregunta 6).

---

## §F · El toque

### F1 · Zona tocable recogida (rectángulo del `<p>`, medido)

| Vista | Mesa 5 / 4 | Mesa 3 | Mesa 2 |
|---|---|---|---|
| 1920×1080 | 197–275 × **54** | 357 × 54 | 505 × 54 |
| S25 412×915 | 117 × **28** | 324 × 36 | 324 × 28 |
| 390×844 | 95 × **28** | 302 × 36 | 302 × 28 |
| 360×640 | 73 × **28** | 272 × 36 | 272 × 28 |
| 844×390 | 113 × **16** | 236 × **16** | 135 × 31 |

Contra el piso táctil de la casa (**40 px**, estándar de campaña DSK), **solo escritorio llega**. En móvil el alto se queda entre **16 y 36 px**. El patrón de la casa para ampliar la zona sin mover nada es un `::after` transparente (DSK-B2). Aquí ese `::after` invadiría el pozo y el comodín, que son hermanos del `<p>` dentro del mismo óvalo.

### F2 · Conflictos con otros gestos en el pago

- **El corte de la celebración.** `useCelebracion.js:126-135` registra un `pointerdown` **en captura** mientras dura el vuelo. Un toque en la frase entre ~2,0 y ~3,65 s **corta el vuelo y el toque sigue su curso** (abriría la capa). Es el molde H4 a propósito. Que pase es decisión de producto (pregunta 7).
- **El nombre para curiosear** (`.opp-name-tappable`, `relative`, z 6, mesas ≥ 3) está en los paneles, por encima del óvalo. En 360×640 mesa 5 queda a 1,8 px del contorno del óvalo y su `::after` táctil puede acercarse más.
- **«Siguiente mano»** está a 45–238 px. No hay solape.
- **`cornerChip`** no hace nada en el showdown (`GameTable.jsx:1427`).
- La frase y el pozo no tienen handlers hoy, ni `pointer-events: none`.
- `elementFromPoint` en el centro del texto devuelve el propio `<p>` en 10/10 celdas: nada lo tapa hoy.

### F3 · Accesibilidad

- **Hoy** el `<p>` no tiene `role`, `aria-*` ni `tabIndex` (`GameTable.jsx:1943`, `:2007`), y sus ancestros tampoco. Un lector de pantalla lo lee como párrafo cuando llega a él. **No se anuncia al cambiar**: no hay `aria-live`. Lo único con `role="status"` en la mesa es la capa AJILEI (`Celebracion.jsx:125`).
- **No hay foco de teclado posible** sobre la frase. En toda la mesa no hay `keydown` salvo el Esc de los paneles abiertos.
- **Con el recorte de D1** el texto completo sigue en el DOM (`textContent` íntegro dentro del `span`), así que el lector lo sigue leyendo entero aunque la vista esté recortada.
- **Propuesta:** para tocarla con teclado y para que el lector sepa que se despliega, el elemento tocable debería ser un `<button>` (doctrina `<button>` de `rec.css`), o un `role="button"` con `tabIndex={0}` y `aria-expanded`/`aria-controls`. Enter y Espacio alternan.
- **Trampa U1b:** el control no puede colgar de un subárbol con `aria-disabled` ni de un `<button disabled>`.

---

## §G · El arnés

### G1 · El modo `msg`

- **Dónde vive:** `scripts/diagDSK.mjs`, `runMSG` en `:10179`.
- **Celdas:** `MSG_CELDAS`, `:9476-9484`: 5/4/3/2 a 1366×768, 5 y 2 a 360×640, y 2 a 740×360. Según la memoria de APU-1 C-0.5, el arnés `diagDSK` corre contra el 5173 con bypass, no contra el preview.
- **Qué mide:**
  - **P1:** el compositor puro, con una matriz construida **solo con `composeResultado`, sin capas**.
  - **P2:** manos jugadas. Relee el texto pintado y lo **vuelve a derivar** del estado visible.
  - **P2b:** caza dirigida de AJILEI.
  - **P3:** el CSS del fin de partida.
  - Con capas solo comprueba que la cabeza re-derivada sea el principio del texto y que la cola hable de capas (`:9924-9938`).
- **Cómo obtiene la frase:** `document.querySelector('.game-message')` + `textContent` (`msgLee`, `:9555-9567`; `msgTexto`, `:9672-9675`).
- **¿Mide lo que se ve?** Hoy sí, por accidente: el texto no se recorta. **Con VOZ-2 dejará de hacerlo.** `textContent` seguirá devolviendo la frase entera aunque se vean 10 caracteres. Es la misma familia del falso verde de la insignia oculta (ARN-1 ①). El modo no mide geometría ni visibilidad: verifica la identidad del texto, no su lectura.

### G2 · Puertas propuestas para VOZ-2 (sin escribir)

| Puerta | Qué exige | Cómo, para que no sea falso verde |
|---|---|---|
| `voz2.ovalo` | Δ = 0 del óvalo (tabla C1) y del pozo, «A igualar» y comodín, entre frase recogida, abierta y cerrada, con las 9 formas, en 20 celdas | Inyección y medida en **un** `evaluate` síncrono sobre la misma página, con `transition/animation: none` inyectado (lección LUZ-1 y O2: `msgPop` empieza en `scale(0.8)`) |
| `voz2.recorte` | Hay recorte ⇔ la forma no cabe. Hay indicio de toque ⇔ hay recorte. Las formas cortas, sin «…» y sin indicio | `scrollW/H` frente a `clientW/H` del `span`, **y** el conteo de glifos visibles con `Range` dentro del rectángulo de recorte (lo que hizo esta sonda), nunca `textContent` |
| `voz2.contencion` | Con el peor caso, el `min-content` no sube: `<p>` Δ0 en móvil y óvalo Δ0 en todas | Celda centinela **360×640 m5/m4** con la forma «Te llevas … Heptacoins» (C-2) |
| `voz2.capa` | Al tocar se abre con el texto entero visible (todos los glifos dentro del viewport y sin tapar, muestreando `elementFromPoint`). Al tocarla otra vez se cierra. Abrir y cerrar no mueve ni un ancla | Δ de todas las anclas antes, abierta y después |
| `voz2.siguiente` | Abierta + clic en «Siguiente mano» → la capa desaparece en ≤ 1 fotograma y no reaparece en la mano siguiente | Señal **positiva** de mano nueva: pastilla TURNO visible (lección ARN-2). No basta con la ausencia del chip |
| `voz2.burbuja` | Con `?apu=saldo:5000,recarga`: frase abierta → burbuja visible y tocable (`elementFromPoint` = burbuja); la tarjeta por encima de la capa; el cierre llega tras resolver la recarga | Leer `data-rec-motivo` y tocar `[data-accion="recarga-burbuja"]` (helper `abrirRecarga`, REC-1) |
| `voz2.toque` | Zona ≥ 40 px (o la medida que fije el rector) sin interceptar el nombre para curiosear | Rejilla de `elementFromPoint` en puntero grueso |
| `voz2.a11y` | Texto completo en el árbol de accesibilidad, enfocable, `aria-expanded` coherente; Enter y Espacio alternan | Locators por rol de Playwright |
| `msg` recableado | P2 lee el texto del `span` y además comprueba que el **visible** es un prefijo del compuesto | Regla ARN-1: quien mueve el marcado, recablea el metro, en la misma tanda |

---

## §H · Los créditos cruzados (lectura)

### H1 · Las dos filas tal como están hoy (`src/config/creditos.js:65-66`)

| Uso | Autor | id | Enlace |
|---|---|---|---|
| `Nudillos (golpe de mesa)` | `freesound_community` | **85867** | `URL_PIXABAY` = `https://pixabay.com/` |
| `Guitarra (sustituye al cuatro)` | `u_op8btczor7` | **504874** | `URL_PIXABAY` = `https://pixabay.com/` |

### H2 · Diferencias con la tabla de verdad

**Ninguna en `creditos.js`.** Uso, autor e id coinciden con la tabla de Victor. Los archivos también: `tableKnock` → `/sounds/table-knock.mp3` y `ajileiStrum` → `/sounds/ajilei-strum.mp3` (`useSounds.js:39-40`).

El cruce existe, pero **en un documento**, no en el código:

| Dónde | Hoy | Debería |
|---|---|---|
| `docs/AJILEI_Victory_Celebration_v1.0.md:345` | `ajilei-strum.mp3` · ID **85867** | 504874 |
| `docs/AJILEI_Victory_Celebration_v1.0.md:346` | `table-knock.mp3` · ID **504874** | 85867 |

Es el mismo hallazgo que BIE-1 Fase 0 §E-8 dejó sin resolver. Notas:
- `useSounds.js:33` solo enumera «IDs 96121, 85867, 504874» sin asignarlos, así que no miente.
- La hoja visible del lobby pinta solo `AUTORES_PIXABAY` (`Lobby.jsx:337`), sin ids ni usos: lo que ve el jugador no cambia.
- Ningún test sella `creditos.js`.
- Sobre el enlace: las 19 filas apuntan a la raíz de Pixabay por decisión de LOB-1 (`creditos.js:41-48`). La tabla de verdad no trae enlace, así que no hay diferencia que corregir.

Consecuencia para D5: el commit propio de la Fase 1 sería **sobre el documento** (y, si el rector quiere, sobre el comentario de `useSounds.js:33`). No sobre `creditos.js`, que ya está en el estado final (pregunta 10).

---

## §I · Cierre

### Riesgos

- **R-1 · El recorte ingenuo mueve el óvalo hasta 906 px** (móvil vertical 5/4 y S25). Cualquier variante de CSS tiene que llevar la contención y pasar la puerta `voz2.contencion`. Es el riesgo n.º 1 de D1.
- **R-2 · Escritorio 4/5:** la contención obliga a estirar el `<p>` a su pista (de ancho variable a 275,56 constantes). Cambia la caja del `<p>`, no la del óvalo. Hay que reportarlo como cambio visible y validarlo en la lámina.
- **R-3 · En móvil vertical de 5/4 la caja recogida es diminuta** (73–117 × 28): 10–17 caracteres en 1 línea, o 15–39 en 2 sobresaliendo 2,89 px. Ensancharla sería tocar el reparto interior del óvalo, que vive en `gameTable.css` (protegido) y roza D1. No se propone.
- **R-4 · C-2 es preexistente** y la contención lo corrige de paso. Es un cambio de comportamiento que hay que sellar como tal y no esconder.
- **R-5 · `two-ovals` tiene la única caja de alto automático.** Un clamp a 1 línea cambia el alto del `<p>` (31,19 → 15,59). El de 2 líneas lo conserva.
- **R-6 · Anclaje de la capa.** El único ancestro posicionado común es `.center-zone`, que en escritorio recorta. Dar `position: relative` a `<main>` o a `.game-table` desde la hoja nueva exige auditar antes qué absolutos de la mesa cambiarían de bloque contenedor.
- **R-7 · El `pointerdown` en captura de la celebración** hace que tocar la frase durante el vuelo corte la celebración.
- **R-8 · Arnés:** `msg` lee `textContent` y verá la frase entera aunque esté recortada. Además corre en 5173, no en 4173.
- **R-9 · Deriva del navegador:** Edge 154 contra baselines de 151. Las cifras de este informe son relacionales (misma página) o nuevas, así que no dependen de ellas. Las puertas selladas de DSK (`o1`, `o2`, `a1`, `a2`, `u1`) tienen la deriva sin auditar debajo.
- **R-10 · IDI-1:** la frase no pasa por `t()`. Al traducirla crecerá. La medida por ancho real (D4) lo absorbe, pero las claves habrá que crearlas en algún momento, y no es alcance de VOZ-2.
- **R-11 · Lint:** el estado abierto debe **derivarse** de `handCount`, no sincronizarse con un efecto, o el lint sube de 21 a 22.

### Preguntas al rector

1. **C-2:** ¿entra en el alcance de VOZ-2 corregirlo (sale gratis con la contención), o se reporta y se deja para una tanda propia? En el primer caso quedará como cambio sellado de 360×640 m5/m4.
2. **Móvil vertical 5/4:** ¿recogida a **1 línea** (10–17 car., «IA 3 gana…») o a **2 líneas** (15–39 car.) con 2,89 px de sobrante fuera de la caja del `<p>` y dentro del óvalo? En escritorio y en mesas 3/2 la recomendación es 2 líneas.
3. **Escritorio 4/5:** ¿se acepta estirar el `<p>` a su pista (275,56 px constantes en lugar de 196–275 según la frase)?
4. **Anclaje de la capa:**
   - (a) dentro de `.center-zone`: sigue al óvalo, pero en escritorio la recorta su contorno y tendría que caber dentro (cabe);
   - (b) hermana de `<main>` en `fixed`, colocada midiendo el `<p>` (patrón de todas las capas de mesa);
   - (c) `position: relative` en `<main>` o en `.game-table` desde la hoja nueva, previa auditoría.
5. **z-index:** propuesto entre 10 y 24 (sobre la mesa, bajo el vuelo, AJILEI, los popups y los modales). ¿La frase abierta va por debajo del vuelo de monedas, como se propone, o por encima?
6. **Convivencia con la recarga:** con la frase abierta, ¿se queda abierta bajo la burbuja y la tarjeta, o se recoge cuando aparece la burbuja? (Hoy nada la cerraría, y el cierre de D3 se retrasa hasta resolver la recarga.)
7. **Tocar durante el vuelo** (~2,0–3,65 s): ¿se permite (corta la celebración, molde H4) o la frase no responde hasta que el vuelo aterriza?
8. **Teclado y lector:** ¿`<button>` con `aria-expanded` y Enter/Espacio? ¿Se admite **Esc** como tercera forma de cierre, además de las dos de D3?
9. **Indicio de toque:** ¿basta el «…», o también un gesto visual (cursor o subrayado) cuando hay recorte? Sin recorte no habría ninguno (§D3).
10. **D5:** `creditos.js` ya está bien. ¿El commit propio corrige `docs/AJILEI_Victory_Celebration_v1.0.md:345-346` (y el comentario de `useSounds.js:33`), o se cierra el punto sin commit?
11. **Fin de partida:** sus frases no van al óvalo (`.game-over-screen` / `PantallaVictoria`). ¿Quedan fuera de VOZ-2?
12. **Piso táctil:** el `<p>` mide 16–36 px de alto en móvil. ¿Se exige 40 px (habría que ampliar la zona sin invadir el pozo ni el comodín) o se acepta el rectángulo del texto?

### Estimación de la Fase 1 (minutos de Claude Code)

| Bloque | Min |
|---|---|
| JSX: `span` en las dos rutas, estado derivado de `handCount`, botón accesible, medida del recorte (layout + `ResizeObserver`) | 45 |
| `voz2.css` (recorte con contención, estirado en escritorio 4/5, capa y z) + import | 35 |
| Colocación de la capa según la respuesta 4 (con la auditoría si es la opción c) | 30–60 |
| Puertas nuevas (§G2) como modo del arnés existente, más el recableado de `msg` | 120 |
| Regresión: vitest, eslint en paridad 21, build, `1.8b`, `msg`, `rec`, `luz` y las DSK que toquen el óvalo, con la deriva de Edge anotada | 60 |
| Commit de créditos (D5) | 10 |
| **Total comprimible** | **~5–5,5 h** |
| **No comprimible:** lámina de la capa desplegada (forma, posición y tamaño por vista) para que Victor elija | 60 de Claude + el tiempo de Victor |
| **No comprimible:** validación por túnel en el S25 y el PC | lo que tarde Victor |

---

**STOP final.** Informe escrito. `git status --porcelain` al cierre: el informe nuevo más los seis residuos conocidos. Sin `git add`.
