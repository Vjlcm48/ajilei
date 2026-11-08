# AJILEI · MES-PvP · Lámina L-M · Tanda 3 · Informe · v1.0

- **Ficha:** `AJILEI_MES-PvP_LM-3_v1.0.md`, «Entre una mano y otra». Victor revisó la lámina y decidió lo del §1. **Normativo:** Reglas de APU-1 v1.8 (§5.5, §8.1, §8.3) y `docs/AJILEI_MOT-1_Contrato_v1.0.md` v1.2.
- **Base:** `d850df2` (tandas 1 y 2 de la lámina, sin push).
- **Commits:** los del mapa del §9 (L-M3-a a L-M3-e) y el de este informe (L-M3-f).
- **Sin push:** sigue esperando al árbitro del Contrato v1.3, como las tandas 1 y 2. **Sin nube:** ni migración, ni deploy, ni cambios en el árbitro real. La recarga PvP no existe todavía en el árbitro: en la lámina la lleva el árbitro imitado.

**En tres líneas.**
- Entre una mano y otra, las cartas se desvanecen en su sitio, la marca de Mano se desliza a su asiento nuevo y sale una pastilla «Mano 7 · Es Mano Ana». Pasa en las dos mesas.
- La recarga PvP tiene cara: la burbuja de REC-1 cuando quiebras, la moneda del ⋮ para la voluntaria (que se puede pedir durante la mano) y una tarjeta con el monto y el saldo que queda.
- La pausa de anuncio tiene su anuncio simulado y su tarjeta para quien vuelve antes. La pantalla final tiene sus tres tonos.

---

## 1 · Lo decidido por Victor (STOP-L)

1. **Transición: la variante b, en las dos mesas.** Las cartas se desvanecen en su sitio y solo se desliza la marca de Mano. La a (las cartas vuelan al mazo) y el mando `?trans=` se retiraron: en producción solo queda la b.
2. **Recarga voluntaria: la variante b, la moneda en el ⋮.**
   - Se puede pedir durante la mano y se aplica en la pausa siguiente.
   - Si al llegar la pausa la pila ya no está por debajo de la entrada, el pedido se cancela solo.
   - Mientras está pedida, el ⋮ lo muestra y la moneda la anula.
   - La a (un botón «Recargar» en la caja de las acciones) se retiró.
3. **El texto de la tarjeta de recarga** depende de la pila:
   - con la pila en 0: «Recargar {monto} HC para seguir en la mesa. Te quedarán {saldo} HC.»;
   - con pila: «Recargar {monto} HC para volver a {entrada} HC. Te quedarán {saldo} HC.».
4. **La tarjeta de quien vuelve del anuncio: la variante a**, centrada sobre la mesa con velo. La b se retiró.
5. **El final negativo: la variante b**, la cifra roja dentro de una pastilla. La a se retiró. El neutro queda tal cual.
6. **La frase final de los casos 3 y 4 de §8.3** se funde en «Te quedaste solo en la mesa», sin nombre, se fuera uno o se fueran varios. Es solo la voz de la pantalla final PvP (`hooks/vozHumanos.finDePartida`): se aplicó.
7. **`1.8b` vuelve a 176,9 KiB** (§7).

## 2 · La transición entre manos

**Cómo funciona.**
- Es una capa propia, `components/TransicionMano.jsx`, que monta `GameTable` en las dos mesas.
- No toca la maqueta:
  - las cartas reales se desvanecen con `opacity` en 380 ms (Web Animations);
  - la marca de Mano hace un FLIP desde su asiento anterior en 480 ms;
  - la pastilla es `fixed`, en el cuarto alto del óvalo, y dura 1,9 s.
- La mesa de 2 apaisada no tiene óvalo: allí la pastilla va al centro de la franja del pozo y la crónica.
- Desde la mano 2. Los nombres van cortados a 10 (`CORTE_PASTILLA`, copia de `CORTE_VOZ` para no compartir trozo). Una prueba ancla que son iguales, y ninguno de los dos módulos importa al otro.

**Contra las IAS** arranca al pulsar «Siguiente mano». La mano nueva espera lo que dura la recogida: la espera pasa de 300 ms a 380 ms. Medido del clic al barajado, mesa de 2 a 412×915:

| Variante | Del clic al barajado | Lo que añade |
|---|---|---|
| Hoy (sin transición) | 310 ms | — |
| b | 390 ms | **+80 ms** (medido en el STOP-L; la espera, 380 ms, no cambió) |
| a (retirada) | 530 ms | +220 ms |

- El deslizamiento y la pastilla caen sobre el barajado, que ya existía: no añaden tiempo.
- La pastilla no tapa cartas ni botones, y el óvalo no se mueve.

**En PvP** la recogida empieza 380 ms antes de que venza la pausa entre manos (4 s, u 8 s con revelación) y la mano nueva llega a su hora: medido entre 389 y 412 ms en las 10 celdas. No hay tiempo nuevo.

**Medidas** (`diagDSK pvp`, 5 pantallas × mesas 2 y 5): la pastilla tapa 0 cartas propias y 0 botones, no sale de la pantalla y no mueve la maqueta (Δ = 0 con y sin ella). Control rojo: la pastilla puesta sobre las cartas las tapa.

**Dato aparte, que no causa la transición:** el óvalo ya salta hoy del pago al barajado. Son 21,7 px en escritorio y 34–46 px en la mesa de 5 en teléfono. Es el mismo `.action-area` que `GameTable` no monta (informe de la tanda 1, §5).

## 3 · La recarga PvP

**Las escenas.**
- Quiebras y se te ofrece sola: la burbuja; con `&abierta=1`, la tarjeta.
- La voluntaria en la pausa y pedida durante la mano.
- El saldo no alcanza.
- No decides a tiempo y te saltas la mano: «Fuera de esta mano», con la burbuja sobre tu fila de cartas, que está vacía.
- Un rival decide («Recargando») o se salta la mano («Fuera de esta mano»).
- La mesa de 2 espera al rival: «Esperando a {nombre}…» en la caja de las acciones.

**Las piezas.**
- La burbuja es la de REC-1, con el mismo componente y las mismas clases, montada encima de la mesa sin tocar la de las IAS.
- La tarjeta es la suave de las IAS: apoyada abajo, sin velo y sin título.
- Las marcas de asiento van en la ranura de estado, detrás de «En anuncio» y antes de «retirado».

**La moneda del ⋮.**
- **En la pausa**, abre la tarjeta, y «Recargar» recarga en el acto.
- **Durante la mano**, abre la misma tarjeta, y «Recargar» la deja **pedida**. Se ve de dos formas: una marca ✓ en la moneda y un punto dorado sobre el ⋮ cerrado. Otro toque en la moneda la anula.
- **Al abrirse la pausa**, se aplica con el monto de ese momento: lo que falte para volver a la entrada. Si no se puede, se cancela sola:
  - **si la pila ya no está por debajo de la entrada**, en silencio, porque no hace falta recargar;
  - **si el saldo no alcanza**, se abre la tarjeta, que dice «Tu saldo no alcanza para recargar.» con «Ahora no» (`pedidoEnLaPausa` da el motivo).
- **El monto de la tarjeta.** Cuando se pide durante la mano, la tarjeta muestra el monto de ese momento. El que se aplica es el de la pausa, porque la pila cambia con la mano; el destino, la entrada, es el mismo.

**Medidas** (5 pantallas × mesas 2 y 5):

| Pieza | Cartas propias tapadas | Botones tapados | Se sale | Δ |
|---|---|---|---|---|
| Burbuja | 0 | 0 | 0 | 0 |
| Tarjeta | 0 en escritorio y teléfonos verticales; 32.914 px² a 915×412 (permitido, como en la de las IAS, §5.4) | 0 | 0 | 0 |

- La frase de la tarjeta, en sus dos formas, va en 2 líneas en las cinco pantallas y las dos mesas: 0 px fuera de la tarjeta y sin cortarse.
- Control rojo: la burbuja sobre las cartas las tapa, y metida en el flujo de la barra mueve la maqueta.

**El tiempo para decidir.**
- La pausa de 4 s se quedaba corta para la voluntaria: 3,6 s quitando la recogida, para dos toques. Por eso se pide también durante la mano.
- La ofrecida casi siempre llega por revelación: la burbuja aparece con 2 s de pausa por delante. Aun así cabe, porque la oferta sigue durante la mano que se salta.

## 4 · La pausa de anuncio

- **Tu anuncio** es simulado: una pieza 16:9 con la etiqueta «Publicidad» y «Omitir».
- **Quien vuelve antes** ve una tarjeta centrada con velo:
  - «Ana sigue en el anuncio» o «4 jugadores siguen en el anuncio»;
  - la frase sellada;
  - «Quitar publicidad», que abre en el sitio «Premium · Pronto» con «Cerrar».
- **Medidas** (5 pantallas × mesas 2 y 5):
  - la frase va en 2 líneas, sin cortarse;
  - «Quitar publicidad» mide 139 × 40 (INV-07).
  - Control rojo: con la tarjeta a 120 px, la frase se corta y el enlace a 30 px no llega a 40.
- **El cierre:** en vivo, al volver todos (`anuncio-cierre`) y al vencer los 45 s (`anuncio-vence`).

## 5 · La pantalla final

- **Celebración:** no cambia.
- **Neutro:** la frase en blanco, sin oro, y «0 Heptacoins» en gris bajo un filo fino.
- **Sobrio:** la misma frase, y la cifra roja dentro de una pastilla con borde rojo.
- Contra las IAS la pantalla final no cambia.

## 6 · Para la sub-tanda 5, el Contrato v1.3 y las Reglas v1.9

**Para la sub-tanda 5**
1. **El salto del óvalo entre el pago y el barajado** (§2): va con el `.action-area` que `GameTable` no monta.
2. **La recarga en la mesa de verdad.** La lleva hoy `partidaImitada` encima del árbitro (la oferta, el asiento sentado fuera y el pedido). Las capas (`RecargaPvP`) leen `foto().recargaLamina`, que la vista real tendrá que dar.

**Para el Contrato v1.3**
1. **Las acciones de la recarga:** `recargar` en la pausa entre manos, y `pedir_recarga` y `anular_recarga` durante la mano.
2. **El asiento sentado fuera de la mano:** no está eliminado, no recibe cartas y conserva su oferta.
3. **El plazo de la oferta** y la espera de la mesa de 2. En la lámina, la oferta dura la pausa; quien se la salta y tampoco decide en la pausa siguiente sale; y la mesa de 2 espera hasta 15 s.
4. **La pausa entre manos sigue en 4 s / 8 s:** la transición cabe dentro.

**Para las Reglas de APU-1 v1.9 (los textos)**

| Uso | Texto |
|---|---|
| Recarga, pila en 0 | «Recargar {monto} HC para seguir en la mesa. Te quedarán {saldo} HC.» |
| Recarga, con pila | «Recargar {monto} HC para volver a {entrada} HC. Te quedarán {saldo} HC.» |
| Recarga, sin saldo | «Tu saldo no alcanza para recargar.» |
| Recarga, botones | «Recargar» y «Ahora no» |
| Marca, decide | «Recargando» |
| Marca, sentado fuera | «Fuera de esta mano» |
| Moneda pedida (título y lectura de pantalla) | «Anular la recarga pedida» |
| Mesa de 2 esperando | «Esperando a {nombre}…» |
| La pastilla | «Mano {n} · Es Mano {nombre}» y «Mano {n} · Eres Mano», con el nombre cortado a 10 |
| La ausencia (sellado en la tanda 2) | «1 turno más y saldrás de la mesa» |
| La frase final fundida (§8.3, casos 3 y 4) | «Te quedaste solo en la mesa» |
| El anuncio | «Publicidad», «{nombre} sigue en el anuncio», «{n} jugadores siguen en el anuncio», «La publicidad ayuda a mantener el juego, gracias por tu comprensión», «Quitar publicidad», «Premium · Pronto» |

- §8.1 suma lo del §1.2 de este informe (pedir durante la mano y aplicar en la pausa).
- §8.3 deja de tener la fila «Te quedaste solo: {nombre} abandonó la mesa».

## 7 · Controles

| Control | Resultado |
|---|---|
| eslint | 0 |
| `npm test` | 108 archivos y 2.857 pruebas, con `src/lib/entreManosCore.test.js` (la pastilla y su corte igual a `CORTE_VOZ`, las esperas, la recarga, la frase de la tarjeta, el pedido con su motivo y el anuncio) y, en `partidaImitada.test.js`, el pedido sin saldo que se cancela diciéndolo |
| `1.8b` | **176,9 KiB** (176,933; en crudo 639,15), contra 177,0 del STOP-L. El núcleo de la transición (`lib/transicionCore.js`) solo lo importa el trozo de la mesa: ya no hay un trozo compartido más en el mapa de la entrada |
| `diagDSK pvp` | 20/20 celdas, 62/62 escenas (50 + 12 nuevas) y 88/88 varas LM: las 38 de las tandas 1 y 2, más 50 de esta (30 de recarga, 10 de transición y 10 de anuncio), cada familia con su control rojo. Aislamiento verde (473 contextos), código 0. 0 capturas fallidas |
| Varas de las IAS (b, el árbol final) | 16 corridas. Las 15 que no son `msg`, verdes con código 0: `apu` en sus 7 pantallas, `rec2` y `voz3`, `u3`, `congelado`, `rec`, `tab.frase` y `tab.resto`. `msg` sale con código 1 solo por el rojo conocido, el barrido «Heptacoins» con 0 medidas; lo demás, verde (compositor 92, jugado 7/7, fin 1/1, Δ larga 7/7, caza 2/2). Unas 1 h 52 min |
| Varas de las IAS (a, STOP-L) | Cortadas a las 11:02 al terminar la sesión: 7 de 16, `apu` en las siete pantallas, verdes y con código 0. Las otras nueve no corrieron |

## 8 · Cómo se pide cada cosa en la lámina

Puerta doble DEV + bypass:

`/?pvp=<escena>&n=2..5&asiento=k[&nombres=largo][&ver=vivo][&abierta=1][&premium=1][&saldo=HC]`

**Escenas nuevas:**
- `entre-manos`
- `recarga-ofrecida`, `recarga-voluntaria`, `recarga-pedida`, `recarga-sinsaldo`
- `recarga-fuera`, `recarga-ajena`, `recarga-ajena-fuera`, `recarga-rival`
- `anuncio-premium`, `anuncio-cierre`, `anuncio-vence`

Con `ver=vivo`, las escenas de esta tanda juegan manos seguidas a la hora real: los rivales a los 1,2 s, y tú a los 6 s si no tocas nada.

Las capturas se regeneran con `diagDSK pvp` en `capturas-dsk/lm3_*`.

## 9 · Mapa archivo → commit

| Commit | Archivos |
|---|---|
| L-M3-a · núcleo y textos | `src/lib/transicionCore.js` · `src/lib/entreManosCore.js` · `src/lib/entreManosCore.test.js` · `src/config/textos.pvp.es.js` · `src/config/textos.test.js` · `src/lib/vistaAMesa.js` · `src/hooks/vozHumanos.js` · `src/hooks/vozHumanos.test.js` · `src/hooks/mesaPvPCore.test.js` |
| L-M3-b · la transición en la mesa | `src/components/TransicionMano.jsx` · `src/styles/transicion.css` · `src/components/GameTable.jsx` |
| L-M3-c · las capas PvP | `src/screens/RecargaPvP.jsx` · `src/screens/AnuncioPvP.jsx` · `src/screens/PartidaPvP.jsx` · `src/styles/pvp.css` · `src/config/textos.pvp.es.js` (solo retira `pvp.anuncio.titulo` y `pvp.anuncio.volver`, que leía la capa vieja del anuncio hasta este commit) |
| L-M3-d · imitado y escenas | `src/dev/partidaImitada.js` · `src/dev/partidaImitada.test.js` |
| L-M3-e · varas | `scripts/pvp/entreManosLM.mjs` · `scripts/pvp/pvp.mjs` |
| L-M3-f · informe | `docs/reportes/AJILEI_MES-PvP_LM-3_Informe_v1.0.md` |

- `laminas/lm1/`, `lm2/` y `lm3/` quedan sin seguimiento.
- `diagDSK pvp` no está en `--perfil=commit`, así que basta pasarlo una vez sobre L-M3-e: espera la frase fundida, que entra en L-M3-a.
