# AJILEI · MES-PvP · Lámina L-M · Tanda 2 · Informe · v1.0

- **Ficha:** `AJILEI_MES-PvP_LM-2_v1.0.md`, «La mesa que se habla». Victor revisó la lámina en la PC y en el S25 y eligió las variantes del §1. **Normativo:** Reglas de APU-1 v1.8 (entran a `docs/` con esta tanda) y `docs/AJILEI_MOT-1_Contrato_v1.0.md` v1.2.
- **Base:** `ebf9fd4` (tanda 1 de la lámina, sin push).
- **Commits:** L-M2-0 (las Reglas v1.8, documental), L-M2-a (núcleo), L-M2-b (componentes), L-M2-c (imitado y escenas), L-M2-d (varas) y el de este informe (L-M2-e).
- **Sin push:** sigue esperando al árbitro del Contrato v1.3, como la tanda 1. **Sin nube:** ni migración, ni deploy, ni cambios en el árbitro real.

**En tres líneas.** Las frases del 💬 se comparten en PvP: viajan como clave, cada jugador ve la burbuja de cada uno junto a su recuadro, y hay un freno de 10 s por jugador. La mesa de 5 se recorrió de punta a punta con nombres largos, y la ausencia tiene aviso propio en la crónica. Contra las IAS no cambia nada: no se tocó `GameTable`, ni el circuito de reacciones, ni un núcleo compartido, ni un archivo protegido.

---

## 1 · Lo aprobado por Victor (STOP-L)

1. **El freno de los mensajes es la variante a.** La entrada 💬 sale atenuada, sin respuesta y con un anillo dorado que se vacía en 10 s. La variante b (el selector con «Podrás enviar otro en N s») se retiró junto con su texto.
2. **Tu burbuja en el teléfono vertical va sobre el óvalo, sin pico.** Como satélite del ⋮ (su sitio contra las IAS) pisaba los recuadros de la fila de arriba y empujaba en cascada las burbujas ajenas hasta el óvalo. Medido en la mesa de 5 a 412×915: la propia ocupaba 102–353 × 58–139 y la última ajena acababa en y 342–440. En horizontal y en escritorio va como contra las IAS.
3. **El aviso de ausencia va en la línea de la crónica:** «1 turno más y saldrás de la mesa». La pastilla sobre las cartas se retiró.
   - La primera propuesta, «Un turno más sin jugar y saldrás de la mesa», se salía 8,3 px por arriba del óvalo en 360×640: la columna de la crónica mide allí 73 px y el texto iba a 5 líneas.
4. **La mesa de 5:** sin observaciones de Victor.

## 2 · Los mensajes

**Cómo funcionan en la lámina:**
- La capa `screens/MensajesMesa.jsx`, en el trozo de la partida, recoge la frase elegida en el selector antes que el circuito de las IAS (en captura, sobre `document`).
- La manda como clave y cierra el selector. En PvP no corre el freno local («una a la vez» + 5 s).
- Pinta todas las burbujas vivas, una por jugador:
  - **la propia**, con `ReaccionBurbuja` tal cual (o sobre el óvalo en el teléfono vertical, §1.2);
  - **las ajenas**, bajo el nombre de su recuadro, con el pico hacia arriba y dentro del ancho del recuadro. Si chocan con una ya puesta, bajan lo justo.
- Todo cuelga de `.game-table-screen` y es `fixed`.
- La regla pura vive en `lib/mensajesMesaCore.js`: la clave, las burbujas vivas, el freno de 10 s y el rechazo.

**Las medidas** son 30 celdas: cinco pantallas × mesas 2 y 5 × tres momentos (cartas en la mano con botones, el sorteo, el pago con capas). Todos hablan a la vez, con las frases más largas.

| Medida | Resultado |
|---|---|
| Cartas propias tapadas | 0 en las 30 celdas, lo mismo que contra las IAS |
| Botones de acción tapados | 0 |
| Burbujas que se pisan | 0 |
| Δ de layout (óvalo, barra propia y recuadros, con y sin mensajes) | 0 |

- **Control rojo:** una burbuja puesta a mano encima de otra se mide como 14.175 px² pisados.
- **360×640, mesa de 5:** la propia queda a 0 px de la fila de cartas, y las burbujas de la fila de arriba tapan los nombres de la fila de abajo, pero no sus burbujas.
- **El pago en la mesa de 5:** un rival quebrado ya no tiene recuadro y su burbuja no se pinta.

**La pausa de anuncio.** Hoy no llega nada. En la lámina, mientras estás en el anuncio no se pinta ninguna burbuja, y al volver solo se ven las que siguen dentro de sus 3 s, sin cola.

## 3 · La mesa de 5 de punta a punta

**Escenas nuevas:** `mano-reparto`, `ultima-accion`, `allin-rival` y `pago-capas`. Se suman a las de antes: `sorteo-desempate`, `descarte-espera` y `reposicion`.
- `ultima-accion` llega al primer turno y juega jugada a jugada al arrancar, porque la mesa aprende la última acción comparando lecturas. Deja «Igualó · Subió · Apostó · Pasó» en los cuatro recuadros.
- `pago-capas` usa pilas escalonadas que no se igualan justo con ninguna apuesta: la pila mayor (la del rival siguiente) abre con lo más alto que le dejan, y los demás igualan o van all-in. La escena llega cuando un rival gana una capa que no es la principal y a otro rival se le devuelve lo que nadie cubrió.

**Medido con `&nombres=largo`** en ocho escenas por cinco pantallas:
- Los nombres de los recuadros salen con elipsis en todas.
- Ninguna marca se pisa en la ranura de estado.
- **«WWWWWWWWWWWWWWW está pensando…» sale 39 px por la derecha a 915×412**, en las mesas de 2 y de 5 (§6.3).

**La voz del pago.** Las frases, tal como salen hoy:

| Mesa | Frase |
|---|---|
| 2 | «¡Ganas con Bastos, 23 pts! A la IA se le devuelven 300 Heptacoins.» |
| 3 | «Empate, 20 pts. Gana WWWWWWWWWWWWWWW por ser la Mano. El pozo se partió: WWWWWWWWWWWWWWW se lleva 700. A WWWWWWWWWWWWWWW se le devuelven 150 Heptacoins.» |
| 5 | «Empate, 28 pts. Gana WWWWWWWWWWWWWWW por ser la Mano. El pozo se partió: WWWWWWWWWWWWWWW se lleva 700. A WWWWWWWWWWWWWWW se le devuelven 250 Heptacoins.» |

- **La caja de la frase no sale del óvalo en ninguna de las 15 combinaciones.** Donde no cabe entera, VOZ-2 la recorta («Empate, 28 pts. Gana… ⌄») y la abre completa en su capa. Va recortada en 11 de 15: la mesa de 2 a 915×412, y las mesas de 3 y 5 en las cinco pantallas.
- **Pero la voz del pago no lleva el corte de 10, y las capas hablan con la voz de las IAS.** El corte solo lo aplica `mesaPvPCore` a la crónica (`lib/corteVoz.js`). El resultado (`GameTable.jsx:568`) y las capas (`GameTable.jsx:1754`, que llama a `componeCapas` sin `VOZ.HUMANOS`) se componen con los nombres enteros. Por eso la mesa de 2 entre personas dice «A la IA». Va a la sub-tanda 5 (§6.6).

## 4 · La ausencia

**Lo que ven los demás.** La marca «Ausente» va en la única ranura de estado (`.opp-status`), igual en las dos rutas (`OpponentPanel` y `.ai-zone`). El orden (`vistaAMesa.js:169-179`) es abandonó > en anuncio > retirado > all-in > ausente > su turno > última acción. Así que **sustituye a «última acción», no convive con ella**, y debajo de retirado o all-in no se ve.

**Lo que ve el ausente.** Desde su 2.º vencimiento seguido, y hasta que juegue, la línea de la crónica dice «1 turno más y saldrás de la mesa». No hay botón «Sigo aquí»: el contador vuelve a cero con cualquier jugada.

| Pantalla (mesa de 5, nombres largos) | 1920×1080 | 412×915 | 915×412 | 390×844 | 360×640 |
|---|---|---|---|---|---|
| Líneas | 1 | 2 | 2 | 3 | 3 |
| Se sale del óvalo | 0 | 0 | 0 | 0 | 0 |
| El óvalo crece | 0 | 0 | 0 | 0 | 0 |

Control rojo: con 60 «W» en la línea, la medida sale roja en las cinco pantallas.

**El 3.er vencimiento en la mesa de 5:**
- el de un rival (`ausencia-tercero`): «Caro abandonó la mesa.» y la mano sigue;
- el tuyo (`ausencia-fuera`, solo en vivo): tu pantalla final, «Saliste de la mesa».

## 5 · Deberes de la tanda 1

1. **Las Reglas de APU-1 v1.8 entran a `docs/`.** Los cuatro textos de `TEXTOS_SORTEO` coinciden al byte con la tabla de §8.4. La única diferencia es el nombre del hueco: `{N}` en el documento y `{n}` en el código, que es la convención del diccionario. El texto que se pinta es idéntico.
2. **Se retiraron las seis claves `pvp.sorteo.*`.** Ya no las leía nadie.
3. **Las tres varas candidatas son celdas de `diagDSK pvp`** (`scripts/pvp/varasLM.mjs`), cada una con su control rojo:

| Vara | Medida | Control rojo |
|---|---|---|
| Franja del sorteo | Mesas 2 y 5 en las cinco pantallas, 10 de 10 filas bien | La franja puesta encima de un recuadro rival corta los recuadros 4 (183×30) y 1 (131×30) |
| Crónica con 15 «W» y corte 10 | 10 de 10 filas bien | `&corte=0` sale rojo en 4 de 10 filas: hasta 42 px fuera, pisa el pozo, y el óvalo crece 12,2 px |
| Salto raro | En vivo, 0 fotogramas con cartas en los huecos de 12 | `sorteo-elige` congelada da 11 de 11 |

La vara 2 mide que la tinta no salga del óvalo ni pise el pozo. El criterio anterior (`scrollHeight`) daba rojos falsos cuando el texto pasa a 2 líneas.

## 6 · Para la sub-tanda 5 y el Contrato v1.3

1. **Los mensajes, por la ruta B.**
   - Una acción `mensaje` en la función `partida`, fuera de `ACCIONES_ARBITRO` (`src/arbitro/partida.js:50`) y sin subir la versión. El asiento sale del uid, la clave se valida, y la función reemite el mensaje por el canal privado de la mesa (`partida:<mesa>`) con su clave de servicio, igual que hoy el aviso de versión (`supabase/functions/partida/nucleo.js:102-106`).
   - El freno de 10 s se guarda en la partida, en el servidor: una migración pequeña y un deploy.
   - Los clientes ya pueden recibir (política SELECT `partida_recibir`, `mot1_esquema.sql:535-541`), pero no emitir. La ruta A (que emita el cliente) se descartó: el asiento lo declararía el propio cliente y el freno no se podría imponer.
   - Quien entra tarde o se reconecta pierde los mensajes: son efímeros y el broadcast no se guarda.
2. **Cada frase lleva un identificador fijo propio**, no el código de su emoji: los ids son contrato y la etiqueta es provisional. Toca `config/reacciones.js`, que es compartido: pide el control de las IAS. Hoy la lámina usa el código del emoji (`codepointDe`).
3. **«{nombre} está pensando…» se corta a 10** (`GameTable.jsx:2721`), con el control de las IAS. Hoy se sale 39 px a 915×412 con 15 «W».
4. **La franja del sorteo asoma 1 px fuera del óvalo** en la mesa de 5 a 915×412. Revisarlo junto con el `.action-area` que `GameTable` no monta en `SORTEO` (informe de la tanda 1, §5).
5. **El texto del aviso de ausencia**, «1 turno más y saldrás de la mesa», queda sellado por Victor y va a las Reglas de APU-1 v1.9.
6. **Hallado al afinar `pago-capas`: la voz del pago en PvP.** El resultado y las capas no pasan por el corte de 10, y las capas usan la voz de las IAS («A la IA se le devuelven…» en la mesa de 2 entre personas). Es el paso del corte a `cronicaCore.nombreEnVoz` que ya anunciaba `lib/corteVoz.js`, más pasar `VOZ.HUMANOS` a `componeCapas` (`GameTable.jsx:1754`) y revisar `resultadoDeMano` (`GameTable.jsx:568`). Con el control de las IAS.
7. **Para el Contrato v1.3:** la acción `mensaje` y su freno (punto 1), y el reparto del sorteo de la tanda 1 (120 + 5·P·297,5 + 400 ms).

## 7 · Controles

| Control | Resultado |
|---|---|
| eslint | 0 |
| `npm test` | 107 archivos y 2.791 pruebas, con `src/lib/mensajesMesaCore.test.js` (la clave, una burbuja por asiento, el freno por jugador y la colocación) |
| `1.8b` | 176,9 KiB, sin cambios: lo nuevo nace en el trozo de la partida (INV-84) |
| `diagDSK pvp` | 20/20 celdas, 50/50 escenas (43 + 7 nuevas) y 38/38 varas LM: las 3 de la tanda 1, 30 de mensajes y 5 del aviso de ausencia |
| Varas de las IAS | No hacen falta: no se tocó `GameTable`, ni `useReacciones`, ni `Reacciones.jsx` ni `config/reacciones.js` (solo se importan), ni ningún protegido |

## 8 · Cómo se pide cada cosa en la lámina

Puerta doble DEV + bypass:

`/?pvp=<escena>&n=2..5&asiento=k[&nombres=largo][&ver=vivo][&msj=uno|todos|propio][&msjms=ms]`

**Mensajes:**
- `msj=uno`: habla el rival siguiente;
- `msj=todos`: los rivales y tú, a la vez;
- `msj=propio`: tú ya mandaste uno y el freno corre.

Congelada, cada burbuja se pinta a los `msjms` ms (1.200 por defecto). Con `ver=vivo`, los rivales hablan solos: a los 1,5 s y luego cada 11 s.

**Escenas nuevas:**
- `mano-reparto`
- `ultima-accion`
- `allin-rival`
- `pago-capas`
- `ausente-yo`
- `ausencia-tercero`
- `ausencia-fuera` (solo con `ver=vivo`)

Las capturas se regeneran con `diagDSK pvp` en `capturas-dsk/lm2_*`.
