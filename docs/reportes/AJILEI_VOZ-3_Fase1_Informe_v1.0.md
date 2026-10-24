# AJILEI · VOZ-3 · La voz del All-in · Fase 1 · Informe v1.0

**Para:** el rector y Victor · **De:** Claude Code · **Fecha:** 2026-10-23
**Ficha:** `AJILEI_VOZ-3_Fase1_v1.0.md` · **Base:** `main` en `5fad6d9` (TAB-2), con la Fase 0 aceptada (`docs/reportes/AJILEI_VOZ-3_Fase0_Informe_v1.0.md`)
**Tramos:** A (1a + 1b, STOP-A aceptado por el rector y Victor) y B (1c + 1d, hasta el STOP-B). Sin commits, sin `git add`, sin `git stash`, sin uniones `node_modules`. Ningún protegido se abrió.

---

## Resumen para Victor

1. **La mano la gana quien gana la capa principal, y toda la mesa lo dice.** En un all-in corto que gana, el óvalo dice «¡Ganas con Copas, 50 pts! A la IA se le devuelven 475 Heptacoins.», en verde, con tu mano en grande y las monedas hacia ti. El espejo dice «La IA gana con… Se te devuelven…», en rojo. Lo vi pintado de verdad en la mesa, con el molde nuevo `?apu=allin` (§4).
2. **Una sola cuenta.** `lecturaDeMano` (`src/hooks/manoCore.js`) decide el ganador, el tono, la celebración, el vuelo, lo retenido, «Manos ganadas» y las devoluciones. La mesa ya no lee `game.winner` en el pago (§3).
3. **Lo que no cambia, no cambia.** Una mano sin pozo partido se dice, suena y vuela igual que antes (control al byte en Vitest y en la captura C9 del STOP-A).
4. **El arnés ya no se puede engañar a sí mismo.** El modo `msg` sacaba al ganador del chip de la pantalla; ahora lo saca de las cartas y de la Mano. Con la mesa de antes, en C1, el viejo daba verde y el nuevo da rojo (§5.2). Todo el arnés reconoce el pago por `data-tono`, también el tono `neutro`.
5. **Un hallazgo que no es de VOZ-3 (D16).** En la tableta vertical (744×1100) con 4 o 5 jugadores **la frase del resultado no se ve**: la caja mide 0 px. Pasa también con el código de antes; la Fase 0 lo tomó por un fallo del instrumento y no lo era (§6). No lo arreglé: toca el óvalo (D15). Es tu iPad mini, así que lo pongo en las pruebas.
6. **Cifras finales:**
   - vitest: 73 archivos y 1.781 pruebas, verde a la primera;
   - lint: en su línea base (los mismos 21);
   - build: verde;
   - `voz2`: 222/222;
   - `msg`: verde;
   - `apu`: verde en las 7 vistas, con `rec2` 18/18 y `voz3` 4/4;
   - `tab`: verde, 9/9 varas;
   - protegidos: idénticos al byte.

---

## 1. Línea base y huellas

| Prueba | Inicio de la fase | Fin del Tramo A | Fin del Tramo B |
|---|---|---|---|
| vitest | 71 archivos / 1.680 | 72 / 1.758, verde a la primera | **73 / 1.781**, verde a la primera (+1 archivo: `oraculo.test.js`; +23 pruebas: 14 de los moldes, 7 del oráculo y 1 huella prohibida más en `dist/`) |
| lint | 20 errores + 1 aviso | los mismos 21 | los mismos 21 (comparados diagnóstico a diagnóstico) |
| build | verde | verde | verde |

**Huellas de los protegidos** (lista canónica v1.8). Medidas al empezar y al terminar cada tramo, con sha256 entero, blob y líneas, y comparadas con `diff`: idénticas en los cuatro momentos e idénticas a las de la Fase 0.

| Archivo | sha256 (inicio) | blob | líneas |
|---|---|---|---|
| `src/engine/gameEngine.js` | `317452ec5b57…` | `21c4d3f56318` | 748 |
| `src/engine/aiPlayer.js` | `3a8ea7b0386c…` | `8cfc3736cba2` | 1.445 |
| `src/engine/deck.js` | `69f92d6b9aac…` | `eb61426083ca` | 69 |
| `src/config/seatLayouts.js` | `0049051fd4b8…` | `0d1bb8ea66a8` | 59 |
| `src/styles/opponentPanel.css` | `4b91338a205e…` | `fbc9f3d08ede` | 1.084 |
| `src/styles/gameTable.css` | `9b6b716f23ad…` | `87c9cb519bdb` | 6.289 |

---

## 2. Lo hecho, por archivo

### Tramo A · 1a, el núcleo

- **`src/hooks/manoCore.js` (nuevo).** `lecturaDeMano(state)`, pura. Rehace los tramos de las capas con la fórmula de `capasDe` y exige que casen con `repartoPorCapas`; si no casan, devuelve `null` y no inventa nada. Por capa:
  - sin elegibles: cada asiento recupera lo suyo;
  - un elegible en la capa 0: es la ruta de los retiros y se gana entera;
  - un elegible en otra capa: lo propio es vuelto y lo ajeno, ganado sin disputa (D7);
  - dos o más: disputada.

  Devuelve `principal`, `tono` (con `neutro`, D4), `nivel`, `destinoVuelo`, `retencion` (lo que cobra el principal), `ganoHumano`, `porAsiento` (disputado, sin disputa, vuelto, cobro y neto), `otras` (agrupadas y sumadas, D8) y `devoluciones`. `resultadoDeMano(state, lectura)` compone el titular con el principal y le pone el tono de la lectura. La única lectura de `state.winner` que queda es de presencia: «Siguiente mano» lo pone a `null` para vaciar el óvalo.
- **`src/hooks/cronicaCore.js`.** `componeCapas(lectura, players)`: la cola de APU-1 y, al final, las devoluciones de D5 en orden de asiento, con singular por regla. Sin la del principal (D6) y sin «El pozo se partió:» si solo hay devoluciones. «N vuelven sin igualar» desaparece. Las frases siguen siendo literales aquí (D18).
- **`scripts/testVoz3.test.js` (nuevo).** Con el motor real (estado a mitad de `BET_3` y última acción por `applyBetAction`):
  - los casos C1–C10 (y C5b, C6b, C7g, C10c, C10e y C10f) en las mesas donde aplican;
  - el control al byte de D11 contra la voz de antes, tomada sobre `5fad6d9` antes de tocar nada;
  - el barrido de 1.500 mesas por tamaño con semilla 7. En cada estado: cobro igual al del motor por asiento, neto del principal > 0, `ganoHumano` igual al de `finDeMano` y una capa igual que antes. Exige además haber pasado por el neutro, por la capa sin elegibles y por una capa de un elegible con fichas de un retirado.
- **`scripts/testMesaAPU1.test.js` §6.** La referencia de `:789` pasa a «Se te devuelven 400 Heptacoins.» y las demás pruebas del apartado se reescriben con la firma nueva. **Dos de ellas fijaban como principal al dueño de la capa de arriba: sellaban el defecto.** Quedó anotado en su comentario.

### Tramo A · 1b, la mesa

- **`src/components/GameTable.jsx`.** La lectura se calcula una vez (`useMemo` sobre `game`) y se reparte. Los consumidores están en la tabla de §3. Las tres lecturas de `game.winner` que quedan en el código son del fin de partida (§3.2).

### Tramo B · 1c, el arnés

- **`scripts/voz2/voz2Mesa.mjs`.**
  - `formasVoz2` llama a `componeCapas` con la lectura. Cambian a propósito `peor` y `corriente+1capa`; `IA+tellevas` sale ahora del compositor y queda al byte. Se añaden las formas `C1` y `C3`. Longitudes en §5.1.
  - `abrirCeldaEnPago` reconoce el pago por `data-tono` con `TONO_DE_PAGO`, que se exporta para el resto del arnés.
  - `MEDIR_VOZ2`: una línea para D16 (§6).
- **`scripts/diagDSK.mjs`.**
  - Los cinco lectores que reconocían el pago por `msg-win`/`msg-lose` pasan a `data-tono`: u2 (jerarquía), `vcHastaVictoria`, el bucle de `msg`, el de `vc` por escenario y su `ganadorCorroborado`. El sexto sitio (`:6255`) no lee: pone una clase para medir O1, y se queda.
  - El oráculo de `msg` (§5.2).
  - `apu.5` acepta «devuelven» en vez de «vuelven».
  - Las celdas `apu.8` y `apu.9` (§4).
- **`scripts/arnes/oraculo.mjs` y `oraculo.test.js` (nuevos).** El oráculo puro de D12 y su prueba.
- **`scripts/tab/tab.mjs`.** El pago de `vuelosEn`, por `data-tono`.
- **`scripts/diagPUE.mjs`.** «recortadas N/9» pasa a contar las formas que haya, y se corrige el comentario de cabecera del modo.
- **`src/dev/repartoGanador.js`, `src/dev/siembraAPU.js` y `src/dev/repartoGanador.test.js`.** Los moldes `?apu=allin` y `?apu=allin-espejo` (§4).
- **`scripts/testDistSinMoldes.test.js`.** `allin-espejo` entra en las huellas prohibidas en `dist/`.
- **`docs/AJILEI_Invariantes_v1.0.md`.** INV-63 (texto de §G.2 de la Fase 0, con los vigilantes de esta fase). En §4, las Reglas de APU-1 pasan a la v1.4 y suman `testVoz3`; en §6, la fila de `diagDSK apu` con `apu.8`, `apu.9` y el filtro `voz3`. Recuento: 63 filas, 56 vigiladas.

### Tramo B · 1d, documentos

- **`docs/AJILEI_APU-1_Reglas_v1.4.md` (nuevo).** La v1.3 íntegra con una tabla de cambios al principio y tres cambios:
  - §4.3: la mano la gana el principal; `winner` del motor no se lee en pantalla; las tres cuentas (disputado, vuelto, ganado sin disputa);
  - §4.5: el titular del principal, la cola, las devoluciones de D5, el tono `neutro` y D11;
  - §5.5: el vuelo va al principal.

  Al final, la entrada «v1.3 → v1.4» con sus vigilantes. La v1.3 no se tocó.
- Este informe.

---

## 3. §B re-corrida: todos los que leen al ganador, con el código nuevo

Leyenda: ✓ acierta con VOZ-3 · — no aplica. Mismas columnas que la §B de la Fase 0. Cada ✓ lo exige `testVoz3` con el motor real: por caso, el principal, la frase exacta, el tono, el nivel, el destino, la retención, `ganoHumano` y las devoluciones. El cableado de cada consumidor a la lectura se comprueba con el `grep` de §3.2 y se vio en las capturas del STOP-A y en `apu.8`/`apu.9`.

| # | Consumidor | Dónde está | Qué lee ahora | C1 | C2 | C3 | C4 | C5 | C6a | C7 | C8 | C9 | C10a |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Titular de la frase | `GameTable.jsx` → `resultadoDeMano` | `lectura.principal` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| 2 | Cola «El pozo se partió…» y devoluciones | `componeCapas(lectura, players)` | `lectura.otras`, `lectura.devoluciones` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| 3 | Tono y clase del óvalo | `resultadoDeMano` → `claseTono` | `lectura.tono` (con `neutro`) | ✓ | ✓ | ✓ | ✓ | ✓ neutro | ✓ | ✓ | ✓ | ✓ | ✓ |
| 4 | `data-tono` (lo lee el arnés) | `GameTable.jsx`, el `<p>` del óvalo | el tono | igual que 3 |||||||||||
| 5 | Sonido del volteo | `GameTable.jsx`, efecto del showdown | `ganadorVisible` (= principal en el pago) | ✓ (suena en todo volteo, como antes) |||||||||||
| 6 | Nivel de celebración | `useCelebracion` | `winner: ganadorVisible` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| 7 | Sonido y fanfarria | `celebracionCore` (`banderasDe`, `sonidoDe`) | el nivel | ✓ | ✓ | ✓ | ✓ | ✓ sin pulso | ✓ | ✓ | ✓ | ✓ | ✓ «¡AJILEI!» |
| 8 | Hacia dónde vuelan las monedas | `geometriaViaje` | `lectura.destinoVuelo` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| 9 | Saldo retenido durante el vuelo | `retencion` → `saldoMostrado` | `lectura.retencion` (lo que cobra el principal) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| 10 | Mano en grande, cartas resaltadas, chip, `opp-winner` | `showdownWinnerSeat` | `lectura.principal` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| 11 | «Manos ganadas» y sus puntos | `useSesion` → `sesionCore` | `winner: ganadorVisible` (D10) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| 12 | Récord de manos del servidor (ECO-1) | `mesaIACore.finDeMano` | capa 0 (sin cambios) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| 13 | Fin de partida | `resultadoCore.js:68-80`; `celebracionCore.js:63` | `winner` de `startHand` (no es de esta fase) | — |||||||||||
| 14 | Crónica de apuestas | `cronicaCore.componeAccion` | no lee `winner` | — |||||||||||
| **15** | **La espera de la recarga (REC-1, `vueloMano`)** | `GameTable.jsx`, `vueloMano = enPago && llevaViaje(…)` | `lectura.nivel` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |

**La fila 15 es el octavo consumidor**, el que la tabla de la Fase 0 no listó. REC-1 decide con `llevaViaje(nivel)` si la burbuja de la recarga espera a que aterrice el vuelo de fichas (Reglas §5.5.1). Antes hacía su propia cuenta: llamaba a `decideCelebracion` con `game.winner`. Ahora lee el nivel de la lectura, el mismo que la celebración.

En la práctica la espera no cambia en ningún caso de la matriz: `llevaViaje` es cierto para los tres niveles de una mano con volteo (`mano`, `ajilei` y `recoleccion`). Lo que se corrige es que era una cuenta suelta con `game.winner`, la misma forma en que nació el defecto (D3).

Notas:
- **C5 en la fila 3** es el tono `neutro`: sin clase, en el color normal del óvalo. Victor lo aprobó en el STOP-A tal cual, sin color propio.
- **La fila 9 en C3 y C5:** las devoluciones y los cobros que no son del principal aparecen en su pila en el acto, no al aterrizar (respuesta del rector al STOP-A). Medido en las capturas: en C3, tu 1.850 está desde el primer fotograma; en C1, tu pila se queda en 0 hasta que aterriza tu cobro.

### 3.2 · `grep game.winner` en `GameTable.jsx`

Lecturas en el código (lo demás son comentarios):
- `:492`, en `ganadorVisible`, la rama que **no** es el pago;
- `:917`, en `esVictoriaDeMesa`, condicionada a `isGameOver`;
- `:1050`, condicionada a `phase === GAME_OVER`.

Las tres son el `winner` de `startHand` (el último con fichas), no el de una mano. **Veredicto: ninguna lectura de `game.winner` en el pago fuera del núcleo.** Dentro del núcleo, `winner == null` solo se usa como compuerta de presencia.

---

## 4. El molde `?apu=allin` (D13) y las celdas `apu.8` y `apu.9`

**Qué siembra.** Sigue la disciplina de los demás moldes de `siembraAPU.js`: no fabrica un estado a mitad de mano. Prepara el reparto de la primera mano con `setRng` de `deck.js`, que es una API exportada y no abre el protegido, y siembra las pilas. El motor y las IAS hacen el resto por su regla.
- **`?apu=allin` (C1).** Tú te sientas con 1,5 apuestas (tras el ante te queda media). Recibes la mano de `?apu=gana`: 50 en la mesa de 2. La IA 1 recibe cuatro «diez» de Oros y el 6 de Oros, 46: fuerte pero menor, la mano que la hace apostar. Con media apuesta tu única respuesta es el All-in. Sus mejoras posibles no pasan de 50: el As de Oros sigue al fondo y, si empata a 50, el empate es tuyo por ser la Mano.
- **`?apu=allin-espejo` (C3).** Las dos manos cambian de sitio y la corta es la IA 1. Tú, que eres la Mano, apuestas en tu primer turno; ella contesta con su All-in.
- **Límites declarados.** Es exacto en la mesa de 2. En las de 3 a 5, si una IA se retira «a las 2», las posiciones del reparto cambian. Y las IAS deciden con su propio azar: el molde hace probable que la IA apueste (C1) o pague (C3), no seguro.
- **Doble puerta**, como los demás: `import.meta.env.DEV` y el parámetro. `testDistSinMoldes` comprueba que `allin-espejo` no llega a `dist/`.
- **Sellado en Vitest** (`src/dev/repartoGanador.test.js`, 14 pruebas nuevas; 41 en el archivo). Las dos órdenes son permutaciones exactas del barajado real en las mesas de 2 a 5. En C1 la mano del humano es la de `ordenGanador` y la de la IA 1 queda entre 40 y menos que la suya. El techo de las demás no pasa del humano. En C3 la IA 1 tiene la del humano de `ordenGanador` y el humano una de 21 o menos. Y **con el motor real**, en la mesa de 2, siguiendo el guion de la prueba de Victor, salen exactamente «¡Ganas con Copas, 50 pts! A la IA se le devuelven 50 Heptacoins.» (tono `gana`) y «La IA gana con Copas, 50 pts. Se te devuelven 50 Heptacoins.» (tono `pierde`).

**Las celdas.** `diagDSK apu` gana `apu.8` (C1) y `apu.9` (C3), en la mesa de 2 y en 360×640 y 1366×768. Exigen:
- el tono por `data-tono`;
- la frase entera por expresión regular, sin «El pozo se partió»;
- el chip de ganador en el asiento correcto (el tuyo en C1, el de la IA en C3);
- dos capas y la consola limpia.

Si la IA no apuesta o no paga en tres mesas, quedan «sin cobertura», no rojas. Con el argumento `voz3`, `diagDSK apu voz3` corre solo esas dos.

| Celda | Resultado (`apu voz3`, 5183, 1 min 12 s) |
|---|---|
| `apu.8` C1 360×640 | ✓ tono gana · chip en ti · 2 capas · «¡Ganas con Copas, 50 pts! A la IA se le devuelven 475 Heptacoins.» (primera mesa) |
| `apu.9` C3 360×640 | ✓ tono pierde · chip en la IA · 2 capas · «La IA gana con Copas, 50 pts. Se te devuelven 25 Heptacoins.» (primera mesa) |
| `apu.8` C1 1366×768 | ✓ igual que en 360×640 |
| `apu.9` C3 1366×768 | ✓ igual que en 360×640 |

Capturas (ignoradas por git): `capturas-apu/tel/apu_voz3_C1_360x640.png`, `capturas-apu/tel/apu_voz3_C3_360x640.png` y las dos de 1366×768 en `capturas-apu/`. En la de C1 se ve el pozo aún en vuelo (625) y tu pila retenida en 0. En la de C3, tu pila ya con la devolución (925) mientras el pozo vuela a la IA.

**La celda en `diagPUE voz2`** (1c.3) no se pudo poner: el molde solo existe en desarrollo y `voz2` mide sobre el `dist` del 4173. Por eso la celda va en `apu`, que ya corre en el 5173, como pide la ficha para este caso. En `voz2` entran las formas C1 y C3 compuestas por los compositores reales (§5.1).

---

## 5. El arnés

### 5.1 · `formasVoz2`: las formas re-selladas

Solo cambian las formas que la ficha nombra, más las dos nuevas. Las otras seis quedan al byte. Caracteres antes → con VOZ-3:

| Forma | m2 | m3 | m4 | m5 | Por qué |
|---|---|---|---|---|---|
| `peor` | 110 → 98 | 143 → 192 | 167 → 258 | 188 → 321 | «100000 vuelven sin igualar» pasa a una devolución por asiento a todos los que no son el principal (D5). Son las de la sonda de §E.2 de la Fase 0 |
| `corriente+1capa` | 82 → 63 | 68 → 69 | 68 → 69 | 68 → 69 | La IA principal y una devolución: «Se te devuelven 200 Heptacoins.» en la mesa de 2 y «A IA 1 se le devuelven 200 Heptacoins.» en las demás |
| `IA+tellevas` | 83 → 83 | 82 → 82 | 82 → 82 | 82 → 82 | Al byte: la cola de APU-1 se conserva (D8). Sale ahora del compositor en vez de un literal |
| `C1` (nueva) | 67 | 66 | 66 | 66 | «¡Ganas con Espadas, 41 pts! A la IA / A IA 1 se le devuelven 350 Heptacoins.» |
| `C3` (nueva) | 63 | 62 | 62 | 62 | «La IA / IA 1 gana con Espadas, 41 pts. Se te devuelven 350 Heptacoins.» |

`peor` se alarga en las mesas de 3 a 5. Es la forma que usan `formaDePrueba` de `voz2` y el globo de `tab` (V-vuelo, m5). Las dos varas siguen exigiendo lo mismo: el óvalo no se mueve, el recorte marca bien y el globo cabe en la ventana. Corridas en §7.

### 5.2 · El oráculo de `msg` (D12)

**Antes.** `msgAuditaMano` tomaba como ganador (`idxGana`) la zona con el chip de puntos del showdown. Ese chip lo pinta la mesa con `showdownWinnerSeat`, que seguía a `game.winner`. En C1, la mesa decía «La IA gana con Bastos, 21 pts.», el chip estaba en la IA y el arnés componía lo mismo: con pozo partido solo exige que la frase **empiece** por lo compuesto, así que salía verde.

**Ahora.** El ganador sale de `principalPorCartas` (`scripts/arnes/oraculo.mjs`), que usa dos cosas que el arnés ya leía por su cuenta:
- las cartas de cada finalista, destapadas por la puerta del producto y cruzadas contra la banda, puntuadas con `getBestSuitScore` y las reglas vivas;
- la Mano, leída en vuelo.

Gana la mejor mano y, si empatan, la más cercana a la Mano recorriendo asientos. Es el desempate de `pozos.js:319-326`, replicado a propósito: el oráculo no puede depender del código que juzga. Sin cartas fiables o sin la Mano no hay oráculo y no se compone nada (`via` = `sin-cartas` o `sin-mano`). El chip se sigue leyendo, antes de los toques, pero solo para juzgarlo: la puerta nueva `chipDelPrincipal` exige que esté en el principal. El registro de cada mano añade `gana:` (el principal del oráculo) y, si el chip está en otro sitio, `✗chip:`.

**Demostración de que con el código de antes habría salido rojo.** No había un `dist` viejo guardado y `git stash` está prohibido. Lo demuestra `scripts/arnes/oraculo.test.js` con la frase real que la mesa de antes pintó en C1, tomada de la captura `hoy_C1_m2_390x844` del STOP-A:
- el oráculo viejo (el chip, en la IA) compone «La IA gana con Bastos, 21 pts.» y la frase empieza por eso: **verde**, el falso verde de §G.1;
- el nuevo, con Copas 41 contra Bastos 21, compone «¡Ganas con Copas, 41 pts!»: **rojo**;
- con la frase de VOZ-3, el nuevo da **verde**.

La misma prueba cruza el desempate contra `ganadoresPorCapa` en 5.000 mesas al azar (más de 1.000 con empate) y exige que coincidan siempre.

**La corrida** (§7) dice si `msg` sigue verde con el oráculo nuevo. Sus manos son de la semilla, sin all-in casi nunca, así que el ganador del oráculo y el del chip coinciden: lo que la corrida prueba es que el oráculo nuevo no rompe nada. El caso que muerde lo cubren `oraculo.test.js` y `apu.8`/`apu.9`.

### 5.3 · El pago por `data-tono`

Respuesta del rector al STOP-A: el pago se reconoce por `data-tono` (gana, pierde o neutro), nunca por la clase. Así queda en:
- `voz2Mesa.abrirCeldaEnPago`, que lo exporta como `TONO_DE_PAGO`;
- `tab.vuelosEn`;
- los cinco lectores de `diagDSK`, que leen el tono en la misma evaluación.

`apu.5` y las celdas nuevas ya leían el atributo. Fuera del arnés solo quedan `msg-win`/`msg-lose` en `scripts/testResultado.test.js`, que prueba la clase misma (`claseTono`), y en `diagDSK.mjs:6255`, que la pone para medir.

---

## 6. D16 · La tableta vertical en las mesas de 4 y 5

**La medida.** Repetí la de §E.3 de la Fase 0 con las mismas formas, en 744×1100 (`tv`, ×1,301) para las cuatro mesas, y en 360×640 de testigo. Sonda del scratchpad `medir_voz3_tv.mjs`, contra el `dist` de este árbol en el 4173, con la escala real y `MEDIR_VOZ2` corregido. Caracteres leídos antes del «…» frente al total; ✓ = el titular entero se lee:

| Vista | m2 | m3 | m4 | m5 |
|---|---|---|---|---|
| 744×1100 `tv` (caja de la frase) | 486 px · ✓ todas, enteras (C1 65/65, peor 98/98) | 486 px · ✓ todas (peor 145/192, titular entero) | **0 px · 0 de N en todas**, también la frase real de la mano («IA 2 gana con Bastos, 30 pts.») | **0 px · 0 de N en todas**, también la real |
| 360×640 (testigo) | 272 px · ✓ todas | 272 px · ✓ todas | 73 px · 16–19 (lo de la Fase 0) | 73 px · 16–20 (lo de la Fase 0) |

El óvalo se mueve 0 px en las ocho celdas con todas las formas. El globo de VOZ-2 se abre dentro de la ventana con la forma peor en m3, m4 y m5.

**La causa no era el instrumento: es la mesa.** En `tv` m4/m5 el `<p>` de la frase mide **0 px de ancho en el producto**, y en pantalla no se ve ni una letra: solo asoma la flechita «⌄» de VOZ-2. Captura: `capturas/diag_tv_744x1100_m4.png` del scratchpad.

El mecanismo:
1. El centro del óvalo (`.center-zone`, flex con `flex-wrap`) lleva en una fila el pozo, la frase (`flex: 1 1 0%`) y la pastilla «Comodín activo · vale 10».
2. Con la escala, la mesa se maqueta a 744 / 1,301 ≈ 572 px CSS. El pozo y el comodín caben juntos en la fila y a la frase no le queda nada. Como su base es 0 % y su contenido no empuja (`contain: inline-size` de VOZ-2), no salta de fila: se queda en 0.
3. En 360×640 la fila es más estrecha, el comodín salta abajo y la frase se queda con 73 px.

Solo pasa en las mesas de 4 y 5, porque son las que llevan la pastilla del comodín.

**No es de VOZ-3 y ya estaba.** La caja no depende del texto. La Fase 0 midió el mismo «caja 0px» sobre el `dist` de `5fad6d9`, antes de tocar nada, y lo tomó por un fallo del clon. La nota de la Fase 0 («por geometría es la caja del celular ampliada») era falsa, y aquí queda corregida.

**Por qué `tab` no lo vio.** `V-tv` mide que la mesa cabe, las P y la zona de 44 px. Ninguna de sus varas mira si la frase del óvalo tiene ancho.

**Lo que hice:**
- **El arreglo de una línea en `MEDIR_VOZ2`.** Con la caja a 0 px, `leidos` devuelve 0 en vez de partir la frase en un clon de 0 px (de ahí salían los 4–14 «leídos» de la Fase 0). Solo actúa con caja 0, así que no cambia la medida de ninguna otra celda: las de 360×640 y `tv` m2/m3 dan lo mismo que en la Fase 0.
- **El producto no lo toqué.** Arreglarlo es cambiar cómo se reparte el centro del óvalo, y D15 dice que el óvalo no se toca en esta campaña. Por ejemplo, una gemela en `escala.css` (no protegido) que mande el comodín a su propia fila en `tv` m4/m5, como en el celular. La regla original vive en `gameTable.css`, que es protegido. Es una decisión del rector (pregunta P-1).

---

## 7. Corridas

| Modo | Puerto | Duración | Resultado |
|---|---|---|---|
| `diagPUE voz2` (`--sin-build`) | 4173 y 5173 | 8 min 12 s | **VERDE, código 0: 222 mediciones, 0 en rojo**, aislamiento verde (40 contextos). Las 20 celdas con las 11 formas: óvalo Δ0, recorte bien marcado (11/11 recortadas en 360×640 m5), contención C-2 Δ0 con `peor` e `IA+tellevas` en las dos centinelas, la capa, la rejilla, a11y, «Siguiente mano» y `voz2.burbuja` en el 5173 |
| `diagDSK msg` (`--sin-build --puerto=4183`) | 4183 | 18 min 39 s | **VERDE, código 0**, aislamiento verde (22 contextos). Compositor 92/92. Las 20 manos jugadas, re-derivadas con las cartas leídas (20/20 cruzadas con el evaluador) y con el ganador del oráculo nuevo; 4 empates resueltos por cercanía a la Mano y ningún chip fuera del principal. Las dos cazas de AJILEI, verdes |
| `diagDSK apu`, por vista | 5183–5186 (`--puerto`), dos grupos a la vez | 3 min 51 s a 5 min 48 s por vista; `voz3` 1 min 12 s; `rec2` 5 min 15 s | **VERDE en las 7 vistas, `rec2` 18/18 y `voz3` 4/4** (§4). Dos vistas salieron primero «sin cobertura» (código 1, no rojo) y verdes al repetir; detalle abajo |
| `diagDSK tab` (compila) | 4173 | 1.106 s | **VERDE, código 0**, aislamiento verde (314 contextos). V-cel 25/25 (14 idénticos al píxel) y t3 88/88 · V-tv 48/48 · V-h 24/24 · V-vuelo: cartas y monedas ≤ 0,02 px; el globo con la `peor` nueva en 744×1100 m5 y 1366×623 m5, error ≤ 0,02 px y dentro · V-fuera 12/12 y 3/3 · V-borde 40/40 · V-hb 48/48 · V-frontera 16/16 · V-giro 2/2. La misma cifra que en la Fase 0 en todas las varas |

**Las dos «sin cobertura» de `apu`.** Ninguna es un rojo ni lee nada del pago:
- **1280×720, `apu.2`/`apu.7`:** en cuatro mesas con `?apu=allinHumano` ninguna IA abrió por encima de tu media apuesta, así que no hubo fila de All-in que medir. Verde al repetir (3 min 56 s).
- **360×640, `tel.linea`:** la línea «Estás all-in — tus cartas siguen jugando.» en la mesa de 4 no llegó a verse en tres mesas, dos corridas seguidas (la segunda con la máquina cargada por los otros grupos). Verde a la tercera (4 min). Es el punto frágil que el cierre de REC-1 dejó para la tanda de higiene del arnés: depende del azar de las IAS, y la línea vive en una ronda de apuestas, no en el pago.

Los tres primeros modos corrieron en paralelo, como pide la ficha (`apu voz3` en el 5183 con `voz2` en el 4173/5173 y `msg` en el 4183). El `dist` se compiló una vez antes (`vite build`, verde) y `voz2` y `msg` lo sirvieron con `--sin-build`. `tab` corrió solo al final y compiló el suyo.

---

## 8. Riesgos

- **R-1 · La frase invisible en la tableta vertical, m4/m5 (§6).** Ya estaba antes y no es de VOZ-3. Pero el iPad mini de Victor está justo ahí: con 4 o 5 jugadores en vertical, no ve quién ganó ni lo que vuelve. Solo le quedan el color de la flechita, el chip de puntos y la mano en grande.
- **R-2 · El molde depende del azar de la IA.** `apu.8`/`apu.9` salieron a la primera mesa en las cuatro celdas, pero la IA decide con su azar. Si un día no apuesta en tres mesas, la celda sale «sin cobertura», no roja, y lo dice.
- **R-3 · El tono `neutro` no tiene molde.** Es raro (1 a 5 de cada 1.500 mesas) y en pantalla solo se vio inyectado (captura C5 del STOP-A). Lo sella Vitest (C5, C5b, C10c y el barrido).
- **R-4 · `msg` casi nunca ve un pozo partido.** Sus manos sembradas rara vez llevan all-in. El oráculo nuevo se ejercita en cada showdown, pero el caso que muerde lo prueban `oraculo.test.js` y `apu`.
- **R-5 · La frase de VOZ-3 es más larga cuando hay devolución** (+32 a +43 caracteres por devolución). La devolución va detrás del titular y nunca lo desplaza, pero en las cajas estrechas de siempre (m4/m5 en vertical, el S25 acostado, `hb`) se lee menos de la cola. Lo mismo que en la Fase 0, §E.3.

## 9. Preguntas para el rector

1. **P-1 · La frase invisible en `tv` m4/m5.** ¿Una tanda propia, fuera de VOZ-3, con su lámina? Mi propuesta es una gemela en `escala.css` que mande el comodín a su propia fila en `tv` m4/m5, como en el celular, y una vara nueva en `tab`: en el pago, la frase tiene ancho y se lee el sujeto. Toca el centro del óvalo, así que necesita la decisión de Victor.
2. **P-2 · ¿`apu.8`/`apu.9` en más vistas?** Hoy van en 360×640 y 1366×768. Cada celda es una mano de la mesa de 2, unos 20 s.

---

## 10. Pruebas de Victor

Unos 25 minutos en total. Antes de empezar, en la PC: `npm run dev` en la carpeta del proyecto (deja el 5173 con el bypass de siempre) y, para el paso 3, `npm run build` y `npm run preview -- --host` con el túnel de siempre.

| # | Dónde | Qué haces | Cuánto | Qué tienes que ver |
|---|---|---|---|---|
| 1 | PC, `http://localhost:5173/?apu=allin` | Entra a «Retar a las IAS», mesa de **2**, y «Iniciar mano». En tus turnos, **Pasar**. Cuando la IA apueste, te sale el botón **All-in**: tócalo. En el descarte, **Sin descartar**. No toques «Siguiente mano». | 1–2 min | La frase «**¡Ganas con Copas, 50 pts! A la IA se le devuelven N Heptacoins.**» en **verde**; tus cartas resaltadas y el chip «50» en tu lado; las monedas vuelan **hacia ti** y tu pila espera en 0 hasta que aterrizan. |
| 2 | PC, `http://localhost:5173/?apu=allin-espejo` | Igual, mesa de 2. En tu **primer** turno, **Apostar** (×1). La IA contesta con su All-in. Después, Pasar o Igualar y Sin descartar. | 1–2 min | «**La IA gana con Copas, 50 pts. Se te devuelven N Heptacoins.**» en **rojo**; la mano de la IA en grande; las monedas vuelan **a la IA**; tu devolución aparece en tu pila **en el acto**, sin volar. |
| 3 | S25 por túnel, mesa de 2, Pro con entrada al piso | Juega hasta provocar un all-in corto de verdad: entra con poco, o espera a que la IA vaya all-in con menos que tú. Hasta 10 manos. | hasta 10 min | En el all-in corto, la frase, el color y las monedas como en 1 o 2, según quién gane la capa principal. Si en 10 manos no sale, vale lo de la PC; anótalo. |
| 4 | S25, una mano normal sin all-in | Juega una mano corriente. | 1 min | Idéntica a como era: misma frase, mismo color, mismas monedas. |
| 5 | **iPad mini en vertical** (opcional, para P-1) | Mesa de **4**, juega una mano hasta el resultado. | 2 min | Hoy esperamos que **la frase del resultado no se vea** (solo la flechita «⌄»). Si se ve, avísame: el arnés y el aparato no coinciden. |
| 6 | Dejarlo como estaba | Cierra el túnel, `Ctrl + C` en `npm run dev` y en el preview, y `Ctrl + 0` si tocaste el zoom. | 1 min | Nada escuchando. |

**Resultados posibles:**

| Ves | Significa | Qué hacer |
|---|---|---|
| 1 y 2 como en la tabla | VOZ-3 funciona | nada |
| En 1 la IA no apuesta en toda la mano | el azar de la IA (R-2) | recarga la página con `?apu=allin` y repite; si en tres no apuesta, anótalo |
| En 1 sale «La IA gana…» | VOZ-3 no está en lo que se sirve | comprueba que es el 5173 de este árbol; si sí, avísame |
| En 3 la frase o el color contradicen a tus fichas | un defecto | foto y avísame |
| En 4 algo distinto de antes | rompe D11 | foto y avísame |

«Manos ganadas» solo se ve en la tarjeta de victoria al ganar la mesa entera. Su regla (el principal eres tú) la sella Vitest con el récord del servidor (D10). No hace falta perseguirla en la prueba.

---

## 11. Cierre

- **Node y puertos:** ningún `node.exe` vivo. Nada escuchando en 4173, 4174, 4183, 5173, 5174 ni 5183–5186. Cada modo levantó su servidor en su proceso y lo cerró al salir.
- **Huellas al terminar:** idénticas a las del inicio del tramo y a las de la Fase 0 (`diff` vacío).
- **`git status`** (sin commits ni `git add`):
  - modificados (12):
    - `docs/AJILEI_Invariantes_v1.0.md`
    - `scripts/diagDSK.mjs`
    - `scripts/diagPUE.mjs`
    - `scripts/tab/tab.mjs`
    - `scripts/testDistSinMoldes.test.js`
    - `scripts/testMesaAPU1.test.js`
    - `scripts/voz2/voz2Mesa.mjs`
    - `src/components/GameTable.jsx`
    - `src/dev/repartoGanador.js`
    - `src/dev/repartoGanador.test.js`
    - `src/dev/siembraAPU.js`
    - `src/hooks/cronicaCore.js`

    En total, 557 líneas añadidas y 133 quitadas.
  - nuevos de VOZ-3 (7):
    - `docs/AJILEI_APU-1_Reglas_v1.4.md`
    - `docs/reportes/AJILEI_VOZ-3_Fase0_Informe_v1.0.md`
    - `docs/reportes/AJILEI_VOZ-3_Fase1_Informe_v1.0.md`
    - `scripts/arnes/oraculo.mjs`
    - `scripts/arnes/oraculo.test.js`
    - `scripts/testVoz3.test.js`
    - `src/hooks/manoCore.js`
  - residuos conocidos, fuera de VOZ-3: los dos informes de MOT-1 y `laminas/mon1/`.
- **En el scratchpad, sin borrar** (`C:\Users\victo\AppData\Local\Temp\claude\c--Users-victo-OneDrive-Documents-ajilei\4ddc44bc-2426-4d4c-8932-a9dc3dfaaed8\scratchpad\`):
  - las sondas de la Fase 0, con sus salidas;
  - del Tramo A: `captura_voz3.mjs`, `comparar_voz3.mjs`, `capturas/` (las 14 del STOP-A y sus JSON) y los registros `*_A.txt`;
  - del Tramo B: `diag_tv.mjs` y `medir_voz3_tv.mjs` (D16), `medida_voz3_tv.json`/`.txt`, `capturas/diag_tv_*.png`, `viejo/` (las longitudes de antes de las formas de `voz2`), los registros de las corridas (`voz2_B.txt`, `msg_B.txt`, `apu_*.txt`, `tab_B.txt`), `lint_B.txt`, `vitest_B.txt`, las huellas y los tres parches en Python (`parche_apu_voz3.py`, `hacer_v14.py`, `inv63.py`), que se aplicaron así porque Bash corta los comandos de más de 8 KB.
- **Fuera del repo y sin comprometer:** `capturas-apu/` (ignorada) con las cuatro capturas de `apu.8`/`apu.9`.
- **Tiempo:** Tramo B de 20:45 a 22:10. El trabajo activo, unos 75 min (la ficha da 120 más el tiempo de los modos). Corridas, unos 55 min de reloj: los tres primeros modos en paralelo y `tab` solo.

---

## 12. Validación de Victor (2026-10-23)

| Prueba (§10) | Resultado |
|---|---|
| 1 · PC, `?apu=allin` (C1) | **verde**, como se esperaba |
| 2 · PC, `?apu=allin-espejo` (C3) | **verde**, como se esperaba |
| 3 · S25 por túnel, all-in corto de verdad | no se hizo: la PC bastó |
| 4 · S25, mano normal (control) | **verde**: idéntica a como era |
| 5 · iPad mini en vertical, mesa de 4 | no se hizo: no hay iPad a mano |

STOP-B aceptado.

## 13. Resoluciones del rector sobre las preguntas del STOP-B

- **P-1 · La frase invisible en la tableta vertical, mesas de 4 y 5 (§6).** Va a una campaña corta propia, **TAB-3**, fuera de VOZ-3. Aquí no se toca nada.
- **P-2 · ¿`apu.8`/`apu.9` en más vistas?** **No.** Los moldes se quedan en sus dos pantallas (360×640 y 1366×768).
- **El mapa de la ficha de commits.** Puso `docs/AJILEI_APU-1_Reglas_v1.4.md` en el commit d cuando el registro de invariantes, que va en el c, ya la cita (INV-63 y la fila de §4). Fue un error del rector y se corrigió antes del push. El commit c salía rojo por sí solo: dos pruebas de `scripts/testInvariantes.test.js` no encontraban el documento. Con la autorización del rector, el c se rehízo con la v1.4 dentro (12 archivos) y con el mismo mensaje, y el d quedó con los dos informes. Cada commit se probó sobre la copia de su propio árbol: vitest y build en verde.
