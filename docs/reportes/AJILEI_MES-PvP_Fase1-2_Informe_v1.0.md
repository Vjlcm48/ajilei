# AJILEI · MES-PvP · Fase 1-2 · Informe · v1.0

- **Ficha:** `AJILEI_MES-PvP_Fase1-2_v1.0.md`, sub-tanda 2, «El puente sin pantalla». **Normativo:** `docs/AJILEI_MOT-1_Contrato_v1.0.md` v1.1.
- **Base:** `7cac208`.
- **Commits:** `18e20ee` (2-a, núcleo puro), `3e16e13` (2-b, cliente y hook), `a94d4c3` (2-c, árbitro imitado y escenas) y el de este informe (2-d). Sin push: viaja con la sub-tanda 3.

**En tres líneas.** La vista de un asiento ya se convierte en el `game` que pinta la mesa, con la voz entre personas, el reloj con desfase y una escena por pantalla, todo sin tocar `GameTable.jsx`. Nada de esto se importa todavía en producción: la sub-tanda 3 lo conecta a `PartidaPvP`. La vara `msg` sale roja por un barrido que no mide nada, y el mismo rojo sale sobre `7cac208` limpio: es del instrumento.

---

## 1 · Lo que hay

| Archivo | Qué hace |
|---|---|
| `src/lib/vistaAMesa.js` | La vista de un asiento → `game`: rotación, dorsos con `id` estable, lo derivado y las dos trampas del pago; y `estadoDeAsiento` |
| `src/hooks/vozHumanos.js` | La crónica desde `ultimaAccion`, las líneas de fase y `sonidoDe` |
| `src/hooks/cronicaCore.js` | `VOZ`, `nombreEnVoz` y la voz en `componeCapas` |
| `src/hooks/resultadoCore.js` | La voz en `composeResultado`, con texto propio para la mesa de dos |
| `src/hooks/manoCore.js` | `resultadoDeMano` toma la voz de `game.voz` |
| `src/hooks/mesaPvPCore.js` | El controlador puro: foto, reloj, escena y aviso de cobro |
| `src/hooks/useMesaPvP.js` | El hook delgado sobre el controlador (`useSyncExternalStore`) |
| `src/lib/partidaCliente.js` | Desfase, reclamos escalonados, relectura con el canal caído y partida muerta |
| `src/dev/partidaImitada.js` | El árbitro real en memoria, 21 escenas y el mando `?pvp=` |
| `src/config/textos.es.js` | Diez claves `pvp.asiento.*` |

Pruebas nuevas: `vistaAMesa.test.js`, `vozHumanos.test.js`, `mesaPvPCore.test.js`, `partidaImitada.test.js`. Ampliadas: `partidaCliente.test.js`, `textos.test.js`, `arbitro.test.js`, `testEntradaLigera`, `testDistSinMoldes`.

Ningún protegido, ni `GameTable.jsx`, ni `src/engine`, ni la nube. El árbitro no cambia.

---

## 2 · La voz entre personas

| Acción | Propio | Ajeno, mesa de 2 | Ajeno, mesa de 5 |
|---|---|---|---|
| Pasar | Pasas. | Ana pasa. | Beto pasa. |
| Apostar | Apuestas 200 Heptacoins. | Ana apuesta 200. ¿Qué haces? | Beto apuesta 200. |
| Igualar | Igualas con 200. | Ana iguala con 200. | Beto iguala con 200. |
| Subir | Subes a 800. | Ana sube a 800. ¿Qué haces? | Beto sube a 800. |
| All-in | Vas all-in con 1.500 Heptacoins. | Ana va all-in con 1.500. | Beto va all-in con 1.500. |
| Retirarse | Te retiras. | Ana se retira. | Beto se retira. |
| Pasar por reloj | Pasaste por tiempo. | Ana pasa por tiempo. | Beto pasa por tiempo. |
| Retirarse por reloj | Te retiraste por tiempo. | Ana se retira por tiempo. | Beto se retira por tiempo. |

| Resultado | Texto |
|---|---|
| Retirada, mesa de 2 | ¡Ana se retira! Ganas el pozo. / Te retiras. Ana gana el pozo. |
| Retirada, mesa de 5 | Los demás se retiran. ¡Ganas el pozo! / Los demás se retiran. Gana Caro. |
| Empate, mesa de 2 | Empate, 30 pts. Gana Ana por estar más cerca de la Mano. |
| Capas, mesa de 3 | Ana gana con Copas, 41 pts. El pozo se partió: Beto se lleva 2.000. Se te devuelven 1.000 Heptacoins. |

- **Retoques del rector en el STOP-2:** «por estar más cerca de la Mano» y «Ganas el pozo», solo en PvP.
- **Contra las IAS no cambia nada:** `testResultado`, `testCronica` y `testVoz3` pasan sin tocarlos.
- **Nombres largos:** no se recortan. El único punto donde se haría es `nombreEnVoz`, en `cronicaCore.js`; la sub-tanda 3 lo decide con la medida de los 15 «W».
- **El punto de millar** solo va en la voz PvP. Queda anotado para IDI-1.

---

## 3 · `estadoDeAsiento`

Orden aprobado: **abandonó > en anuncio > retirado > all-in > ausente > su turno > última acción.** Abandonó es definitivo; en anuncio ocurre en el pago con el asiento aún `folded`; retirado, all-in, su turno y última acción siguen el orden de la mesa contra las IAS; ausente va antes del turno porque explica la espera.

El rótulo all-in reutiliza `ia.mesa.marca.allin` en vez de una clave `pvp.` con el mismo valor.

---

## 4 · Escenas

Mando: `?pvp=<escena>&n=2..5&asiento=k&nombres=largo`, detrás de DEV + `VITE_AUTH_BYPASS`. Nadie lo consume todavía: es para la sub-tanda 3.

| Pantalla | Escenas |
|---|---|
| `sorteo` | `sorteo-baraja`, `sorteo-oleadas`, `sorteo-eleccion`, `sorteo-empate-2`, `sorteo-empate-3` (n ≥ 3), `sorteo-azar` |
| `mesa` | `turno-propio`, `turno-ajeno`, `descarte-espera`, `reposicion`, `revelacion`, `retirada`, `anuncio-vuelta`, `ausente`, `abandono`, `aviso-salida` (n ≥ 3) |
| `anuncio` | `anuncio-yo` |
| `final` | `final-gana`, `final-pierde` |
| `fuera` | `final-fuera` |
| `muerta` | `muerta` |

Cada escena se prueba en toda mesa donde cabe y desde cada asiento. `testDistSinMoldes` comprueba que el imitado no llega a `dist/`.

---

## 5 · Reloj y cliente

- **Desfase:** una muestra por respuesta, `ahora + rtt/2 − local`. Se usa la de menor RTT de las últimas 8, no un promedio: el error de cada muestra está acotado por su RTT/2. Sesgo conocido: `ahora` se toma al responder, y el trabajo de la función suma unos p/2.
- **Reclamos escalonados:** `MARGEN + asiento × 200 ms`.
- **Canal caído:** con el canal no `SUBSCRIBED` el cliente relee por su cuenta. Una prueba existente cambió por eso: «no relee por su cuenta» exige ahora el canal suscrito.
- **Partida muerta:** `partida_terminada` no basta, porque otro teléfono pudo acabarla. El cliente relee y solo la declara muerta si la vista sigue viva.
- **`sala.entrada` y `sala.ritmo`:** comprobado leyendo el código que llegan a `useMesaPvP`. Todas las rutas que rellenan la sala devuelven la fila entera de `public.salas` (`mi_sala`, `crear_sala`, `unirse_sala`, `resolver_sala`, `jugar_ya` y `leerSala` con `select *`). Sin comprobar en la nube.

---

## 6 · Peso y varas

`1.8b`: **176,8 → 176,9 KiB**. El ruido son las diez claves de `textos.es.js`, que viaja en la entrada; ningún módulo nuevo entra en ella.

| Vara | Resultado | Sobre |
|---|---|---|
| `aislado --perfil=commit` | Verde: vitest 104/104 archivos, 2475 pruebas; eslint 0 errores y 0 avisos; `1.8b` y humo código 0 | `18e20ee` |
| `aislado --perfil=commit` | Verde: vitest 105/105 archivos, 2515 pruebas; eslint 0 errores y 0 avisos; `1.8b` y humo código 0 | `3e16e13` |
| `aislado --perfil=commit` | Verde: vitest 106/106 archivos, 2633 pruebas; eslint 0 errores y 0 avisos; `1.8b` y humo código 0 | `a94d4c3` |
| `npm run varas -- commit` | Verde | STOP-2, árbol sin los retoques de voz |
| `apu`, 7 celdas + `rec2` + `voz3` | Verde | STOP-2, igual |
| `msg` | **Rojo**, del instrumento (§7) | Árbol final y `7cac208` limpio |

---

## 7 · El rojo de `msg`, para la higiene

**El barrido «Heptacoins» de `msg` no mide nada y la vara exige al menos una medida.** Todo lo demás de `msg` pasa.

| Corrida | Árbol | Barrido | Resto |
|---|---|---|---|
| STOP-2 | `7cac208-dirty` | 0 medidas | compositor 92, jugado 7/7, fin 1/1, Δ 7/7, caza 2/2 |
| Tras el veredicto | `7cac208-dirty`, árbol final | 0 medidas | igual |
| Tras el veredicto | **`7cac208` limpio**, en un worktree | **0 medidas** | igual |
| `diagDSK msg 2` | `7cac208-dirty` | 5 medidas, verde | jugado 3/3 |
| Corridas verdes anteriores | `86dcf79-dirty` y una sin sufijo | 6 y 5 medidas, siempre la misma caja | — |

- **Lo que mide de verdad:** cuando mide algo, es una sola frase pasajera, «Apuestas 50 Heptacoins.», en T2. Solo aparece si el arnés pulsa «Apostar», y lo hace cuando no encuentra «Pasar» ni «Igualar» (`msgJuegaUnaMano`, `diagDSK.mjs:11168`).
- **Lo que tapa:** `msgBarre` se traga los errores de `page.evaluate`, así que una sonda que no ve nada da 0 sin decir por qué. Las vistas de P5 (ruta, hueco y tienda) no aportan ninguna medida en ninguna corrida.
- **Veredicto:** falla igual sobre `7cac208` limpio, así que es del instrumento (punto 1 del veredicto del rector). No se tocó el arnés.
- **Para la higiene:** que el barrido mida algo estable en cada corrida, que P5 cuente, y que un error de la sonda se vea.

---

## 8 · Decidido fuera de la ficha (aprobado en el STOP-2)

1. «Igualas con N», como el ejemplo de la ficha, extendido al ajeno.
2. El all-in reutiliza `ia.mesa.marca.allin`.
3. «Mesa de dos» es `handRules.ruleN === 2`, no dos sillas.
4. Las frases ajenas por reloj («Ana pasa por tiempo.»).
5. La frase propia por reloj gana a la línea de fase.
6. Líneas de fase PvP propias (`faseHumanos`), que nombran a quien tiene el turno (`activePlayerIndex`).
7. Punto de millar en toda la voz PvP.
8. `previa` es el `game` anterior, no la vista.
9. `turno`, `ultima` y `entrada` en cada asiento; `entrada` de `sala.entrada` y `ritmo` de `sala.ritmo` (§5).
10. `timeLeft` solo en turno, descarte, elección y pausa de anuncio.
11. Relectura antes de declarar la partida muerta.
12. La prueba de `partidaCliente` que exige el canal suscrito.
13. La excepción de `arbitro.test.js` para `partidaImitada.js`.
14. Pila a mano en `final-pierde` y `aviso-salida`.
15. `avanzar()`, `sala` y `marca` en el imitado.

---

## 9 · Pendiente para la sub-tanda 3

- Conectar `useMesaPvP` y `vistaAMesa` a `PartidaPvP` y a la mesa.
- Con qué cambia el hook `selectedDiscards`.
- El texto de salida («Pepito dejó la mesa…»).
- «Te quedaste sin Heptacoins» en el fin no es cierto para quien abandonó: lo resuelve su pantalla final.
- La guarda de `GameTable` que deja el rótulo en blanco en el pago con puntuación.
- El recorte de nombres largos, si la medida lo pide.
- El push, con estos cuatro commits.
