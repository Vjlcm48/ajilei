# AJILEI · MES-PvP · Fase 1-3 · Informe · v1.0

- **Ficha:** `AJILEI_MES-PvP_Fase1-3_v1.0.md`, sub-tanda 3, «La mesa viva». **Normativo:** `docs/AJILEI_MOT-1_Contrato_v1.0.md` v1.1.
- **Base:** `d2806f5` (sub-tanda 2, sin push).
- **Commits:** 3-a (la mesa), 3-b (pantallas y capas), 3-c (arnés) y el de este informe (3-d). El push lleva los cuatro de la sub-tanda 2 (`18e20ee`, `3e16e13`, `a94d4c3`, `d2806f5`) y estos cuatro.

**En tres líneas.** Dos personas ya juegan en LA mesa de las IAS: `PartidaPvP` monta `GameTable` con la foto de `useMesaPvP`, y alrededor van las capas mínimas (sorteo, anuncio, salida con la mesa viva y mesa muerta). Contra las IAS la mesa no cambia: las guardas solo se encienden con el prop `partida`, y el control de las IAS sale verde sobre el árbol final. Victor jugó por túnel la mesa de 2 y la de 3 de punta a punta; de sus cinco hallazgos, uno se corrige aquí y cuatro tienen destino.

---

## 1 · Lo que hay

| Archivo | Qué hace |
|---|---|
| `src/components/GameTable.jsx` | El prop `partida` y sus guardas (3a). En la 3b: el barajado y la reposición en paralelo salen de la vista, el ritmo de la mesa escala el reparto, «ya descarté», los rótulos de cada asiento, los textos PvP, la ✕ con su texto y «Saldo actual» de la billetera |
| `src/components/OpponentPanel.jsx` | El prop `rotulo`, que manda en `.opp-status` |
| `src/screens/PartidaPvP.jsx` | Reescrita: la mesa con `useMesaPvP` y las capas mínimas (sorteo, anuncio, salida, mesa muerta); los sonidos ajenos, los avisos de ≤ 5 s y el mando `?pvp=` |
| `src/styles/pvp.css` | La hoja aditiva de las capas, sin `!important` |
| `src/config/textos.pvp.es.js` | Los 30 textos `pvp.*`: viajan con el trozo de la partida (INV-84) |
| `src/config/textos.js` | `sumarTextos`: un trozo diferido suma sus textos al cargarse |
| `src/lib/vistaAMesa.js` | Suma los textos PvP; `barajando`, `reponiendo`, el rótulo de cada asiento, lo cobrado como pila en el fin y la selección del descarte, que se vacía al abrirse la reposición |
| `src/hooks/mesaPvPCore.js` | `alternarDescarte` y `factorReparto` |
| `src/hooks/vozHumanos.js` | «Pepito dejó la mesa · la mesa ahora es de 3» y `listaDeNombres` |
| `src/hooks/resultadoCore.js` | El fin entre personas con lo cobrado: «Te llevas N Heptacoins» |
| `src/lib/partidaCliente.js` | Tres clases de vencimiento nuevas; fuera la marca `?mot1` |
| `src/lib/controlVideo.js` | `cerrarPorMesa`: el video abierto se cierra sin cobrar el boleto |
| `src/App.jsx` | La mesa ya arrancada va directa a la partida, `?pvp=`, la partida sin marco de video y la píldora al entrar y salir de una sala |
| `src/screens/SalaEspera.jsx` | Entra sola a la partida cuando la mesa arranca |
| `src/dev/partidaImitada.js` | La escena `descarte-propio`: el descarte abierto, para hacerlo desde la mesa |
| `scripts/pvp/pvp.mjs`, y el modo en `nucleo`, `orquestaCore` y `diagDSK` | `diagDSK pvp`, en el perfil `commit` |
| `docs/AJILEI_Invariantes_v1.0.md` | INV-46 reescrita; la fila de `diagDSK pvp` y el perfil `commit` |
| Borrados | `src/styles/panelMot1.css` y `src/screens/PartidaPvP.test.jsx` |

Pruebas nuevas o ampliadas: `mesaPvPCore`, `vistaAMesa`, `vozHumanos`, `controlVideo`, `textos`, `partidaCliente`, `partidaImitada` y `orquesta`; ajustadas `testEntradaLigera` y `testClavesAlmacen`.

Ningún protegido, ni `src/engine`, ni la nube. El árbitro no cambia.

---

## 2 · La mesa contra las IAS no cambia (3a)

- **Las guardas solo existen con `partida`.** Contra las IAS son falsas: ningún hook cambia de sitio y las tiradas son las mismas, en el mismo orden (`decidirIA` y `startHand`).
- **Con `partida`:** el motor no se crea, `game` y la crónica salen de la foto, el reloj es el del servidor, el reparto no avanza ni rebobina, la IA, el salto y el descarte del retirado no corren, y las acciones van por `partida.enviar` (`apostar`, `descartar`, `abandonar`). Los botones «Iniciar mano» y «Siguiente mano» no salen.
- **El compilador de `react-hooks`:** la lista de diagnósticos con `--no-inline-config` es la de `d2806f5`, más el `exhaustive-deps` del efecto nuevo, que lleva su directiva; los dos `exhaustive-deps` que ya había nombran además `partida`. El control rojo (un `setState` inyectado en un efecto) sale como `set-state-in-effect` sobre el árbol final y sobre `d2806f5`.
- **La trampa:** llamar a `launchDiscardOut` o `launchDiscardIn` desde la función nueva que corre en un efecto hizo que el compilador dejara de ver el acceso adelantado a `startDiscardAnim` (aparecía el aviso «Unused eslint-disable directive»). Los vuelos de la reposición se crean dentro de `startReposicionPvP`, y `launchDiscard*` quedan como estaban.

---

## 3 · La partida y sus capas (3b)

- **Escenas** (`mesaPvPCore.escenaDe`): arrancando · sorteo · mesa · anuncio (la mesa, con su capa encima) · final (la mesa) · fuera · muerta.
- **El final** con la mesa terminada lo pinta `GameTable`: la victoria conserva su sesión y su toc-toc, y su «Saldo actual» lee la billetera. La pantalla propia de `PartidaPvP` queda para quien sale con la mesa viva.
- **La reposición en paralelo:** todos a la vez y con vuelos cortos (`SALE_MS` 250, `SALE_PASO` 40, pausa 50, `ENTRA_MS` 400, `ENTRA_PASO` 120). Con una carta tarda 1.100 ms y el servidor espera 1.115. De un rival solo se sabe cuántas, así que salen sus primeras. **Se revierte** (hallazgo 2).
- **El sorteo** usa `CardImage`, no `PlayingCard`, que trae `playingCard.css` y cambiaría el orden del CSS también contra las IAS.
- **El video:** si estaba abierto al entrar sola a la partida, `cerrarPorMesa` lo cierra antes de tiempo, el final que no cobra el boleto. Probado con el banco imitado: el saldo no cambia y el video no vuelve.
- **Los textos `pvp.*`** salen de la entrada a su propio diccionario, en el trozo de la partida: con ellos en `textos.es.js`, `1.8b` subía a 177,3 KiB.
- **INV-46** pasa a «vigilado»: la partida no enseña el saldo mientras se juega, así que el hueco de ECO-1e se cierra quitándolo; la cifra sale al final, en la victoria, desde la billetera.

---

## 4 · Las tres correcciones del cierre

### 4.1 · Los textos del sorteo, sellados

Los de la capa del sorteo se reemplazan por los que Victor selló el 2026-11-06. Las claves que sobraban se borran (`pvp.sorteo.espera`) y la que faltaba se añade (`pvp.sorteo.azar.tu`): seis claves `pvp.sorteo.*`, ninguna huérfana. Los textos de la mesa contra las IAS no cambian.

| Momento | Quién lo ve | Clave | Texto |
|---|---|---|---|
| Hay que elegir (cada ronda, el desempate también) | quien debe elegir | `pvp.sorteo.elige` | «{nombre}, vamos a elegir el jugador Mano. Elige una carta.» |
| Veredicto, Mano ajeno | todos menos el Mano | `pvp.sorteo.mano` | «{nombre} es Mano por tener la carta más alta» |
| Veredicto, Mano propio | el Mano | `pvp.sorteo.mano.tu` | «Eres Mano por tener la carta más alta» |
| Empate | todos | `pvp.sorteo.empate` | «Hay empate entre {lista}: vamos al desempate» |
| El azar decide, ajeno | todos menos el elegido | `pvp.sorteo.azar` | «Siguen empatados: el azar elige a {nombre} como Mano» |
| El azar decide, propio | el elegido | `pvp.sorteo.azar.tu` | «Siguen empatados: el azar te elige como Mano» |

- `{lista}` sale de `listaDeNombres` (`vozHumanos.js`), la misma que dice el aviso de salida: todos los empatados, el propio incluido, con comas y «y» antes del último.
- La llamada a elegir se queda hasta que la ronda tiene veredicto, también para quien ya eligió (su carta queda adelantada). Quien no empató no ve llamada: se queda con el texto del empate, en la lista de rondas.

### 4.2 · Las cartas repuestas vuelven a su sitio (hallazgo 5)

- **Lo que vio Victor:** marca cartas para descartar (suben), llegan las nuevas y se quedan arriba, en la posición de «seleccionada».
- **La causa, confirmada:** `vistaAMesa` conservaba `selectedDiscards` durante toda la mano (`mismaMano ? previa.selectedDiscards : []`). El descarte aplicado no la vaciaba, y las cartas nuevas llegaban a índices que seguían marcados. Contra las IAS no pasa porque el motor la vacía al descartar.
- **La regla:** la selección se vacía cuando la vista confirma el descarte aplicado, es decir, en la primera lectura con la reposición abierta (`vencimiento.clase === 'reposicion'`), antes de los vuelos. De guardia, también al cambiar de fase o de mano. Hasta ese momento las marcadas siguen arriba, y así se ve qué se va.
- **En la mesa, una línea:** `startReposicionPvP` saca los índices propios de la vista anterior (`previa.selectedDiscards`), porque la nueva ya llega vacía. Va en el commit de la mesa, con el control de las IAS sobre el árbol final (§5).
- **Pruebas.** Las tres salen rojas sin el arreglo y verdes con él.
  - `mesaPvPCore.test.js`: la selección sigue mientras la mesa descarta y se vacía al abrirse la reposición.
  - `vistaAMesa.test.js`: se vacía en la reposición y al cambiar de fase.
  - `partidaImitada.test.js`: con el árbitro de verdad, marcar, descartar, avanzar hasta la reposición y la selección vacía.
- **En pantalla:** `diagDSK pvp` hace la reposición desde la mesa, en 412×915 y en una mesa de 3 desde el asiento 1. La escena `reposicion` llega con el descarte de guion, sin tocar la mesa, así que hace falta la escena nueva `descarte-propio`.
  - Se tocan dos cartas: 2 levantadas.
  - Se pulsa «Descartar 2»: siguen 2 levantadas mientras la mesa descarta.
  - Se abre la reposición: después de los vuelos hay 0 levantadas y 5 caras en la fila.
  - Capturas en `capturas-dsk/pvp_reposicion_antes_412x915.png` y `capturas-dsk/pvp_reposicion_412x915.png`, regenerables.

### 4.3 · `diagDSK pvp` en el perfil `commit`

- `diagDSK pvp` entra en `commit` (y en `completo`, en su sitio) con un tope de 10 min; sale de los sueltos. `orquesta.test.js` lo ancla.
- **Tiempo del perfil:** 13 min 43 s → 16 min 19 s (+2 min 36 s, un 19 %), sumando las varas en serie; `pvp` se lleva 2 min 29 s y el humo sigue en unos 13 min.
- `aislado --perfil=commit` no lo corre: los commits 3-a y 3-b no tienen el modo, y el perfil de `aislado` es el suyo (peso y humo).

---

## 5 · Peso y varas

`1.8b`: **176,9 KiB en `d2806f5` → 176,9 en el STOP-V → 176,9 en el cierre** (crudo 639,1; JS 149,2).

| Vara | Resultado | Sobre |
|---|---|---|
| `npm run varas -- commit` | Verde: eslint 0 errores y 0 avisos; vitest 105/105 archivos, 2.631 pruebas; humo 13 min 04 s. Perfil: 13 min 43 s | STOP-V |
| `npm run varas -- commit` | Verde: eslint 0 errores y 0 avisos; vitest 105/105 archivos, 2.641 pruebas; `pue.espera`; `pvp` 2 min 29 s; humo 13 min 12 s. Perfil: 16 min 19 s | Árbol final |
| `apu`: 7 celdas + `rec2` + `voz3` | Verde, las 9: 360x640 5:03, 640x360 4:22, 844x390 4:21, 1024x768 4:20, 1280x720 4:20, 1366x768 4:16, 1920x937 4:22, rec2 7:28, voz3 1:11 | Árbol final |
| `u3`, `congelado`, `rec` | Verde: 7:46, 1:46 y 15:33 | Árbol final |
| `tab.resto`, `tab.frase` | Verde: 20:22 y 9:29 | Árbol final |
| `msg` | Solo el rojo conocido: barrido «Heptacoins» con 0 cajas. Compositor 92, jugado 7/7, fin 1/1, Δ 7/7, caza 2/2 (18:58) | Árbol final |
| `diagDSK pvp` | Verde: 20/20 celdas, 24/24 escenas (las 22 del mando, la salida en vivo y la reposición desde la mesa) | Árbol final |
| `aislado --perfil=commit` | Verde en 3-a, 3-b y 3-c (vitest, eslint contra la firma, build, `1.8b` y humo) | Cada commit |

El control de las IAS (`apu`, `u3`, `msg`, `congelado`, `rec` y `tab`) corrió dos veces: en el STOP-V, todo verde salvo el rojo conocido de `msg`, y otra vez en el cierre, porque la corrección 4.2 toca `GameTable.jsx`. El `GameTable.jsx` del árbol final es el mismo, byte a byte, que el del commit 3-a.

**El rojo conocido de `msg`:** el barrido «Heptacoins» con 0 medidas, que también falla sobre `7cac208` limpio (informe de la sub-tanda 2, §7). No cuenta. El resto de `msg` pasa: compositor 92, jugado 7/7, fin 1/1, Δ 7/7, caza 2/2.

---

## 6 · Nombres de 15 «W» (la medida; el recorte lo decide L-M)

| Dónde | 412×915 | 915×412 |
|---|---|---|
| `.ai-name`, mesa de 2 | 80 px visibles de 173, con elipsis | — (en apaisado va en panel) |
| `.opp-name` | 80 de 187 (98 de 205 en la revelación), elipsis | 72–90 de 187–205, elipsis |
| Crónica «WWW… pasa.», mesa de 2 | Cabe: 324 px, una línea | **Se sale 19 px** (154 de 135), sin recorte |
| Crónica, mesa de 5 | Cabe: 324 px | Cabe: 215 px |
| Resultado «WWW… gana con Espadas, 31 pts.», mesa de 5 | Recortado por VOZ-2 (con su toque) | Recortado por VOZ-2; el `<p>` se sale 7 px |

El único desborde visible es la crónica de la mesa de 2 en apaisado. El único punto para recortar sigue siendo `nombreEnVoz`.

---

## 7 · Decidido fuera de la ficha (aprobado tras el STOP-V)

Las trece del STOP-V, aprobadas tal cual, salvo lo que corrigen los puntos 1 y 2 del cierre (§4.1 y §4.2):

1. El final con la mesa terminada lo pinta `GameTable` (§3).
2. La reposición en paralelo, con sus tiempos y los vuelos creados dentro de su función (§2 y §3). Se revierte en el árbitro v1.2 (hallazgo 2).
3. Los textos `pvp.*` en su propio diccionario, en el trozo, con `sumarTextos`.
4. Los mensajes del sorteo: **reemplazados** por los sellados (§4.1).
5. `cerrarPorMesa` para el video abierto.
6. «Pepito dejó la mesa · la mesa ahora es de 3», igual para la quiebra y el abandono, en la voz.
7. En la mesa de 2 vertical, «En anuncio» y «Abandonó» se ven también en el pago.
8. Quien vuelve con el asiento ya abandonado va al lobby.
9. Los sonidos ajenos y los avisos de ≤ 5 s viven en `PartidaPvP`.
10. El sorteo con `CardImage`.
11. Fuera `PartidaPvP.test.jsx`; la pantalla la cubre `diagDSK pvp`.
12. En `diagDSK pvp`, el piso de 40 solo en las celdas táctiles y el O1 sobre el óvalo.
13. INV-46 «vigilado».

---

## 8 · La prueba de Victor

**Por túnel, el 2026-11-06:** la mesa de 2 (S25 y Motorola) y la de 3 (con la PC). Todo en verde: la partida de punta a punta, la pausa de anuncio tras las manos 5 y 11 con el aviso para quien vuelve antes, y los finales.

### Cinco hallazgos y su destino

1. **La ceremonia del sorteo, sobre la mesa misma, sin capa aparte.** Destino: lámina L-M y sub-tanda 5.
   - Al arrancar la partida todos caen en la mesa, y el mazo está junto al asiento del anfitrión durante el sorteo. Esto resuelve «el mazo sin Pie» del informe de la Fase 0.
   - El reparto va con los vuelos de la mesa: cinco cartas propias boca abajo y los dorsos ajenos en sus asientos.
   - Se elige tocando una carta. La elegida se adelanta, también en los asientos ajenos, para ver quién falta.
   - Las elegidas se voltean en cada asiento (5 s, árbitro v1.2), y después todas las cartas vuelven al mazo del anfitrión.
   - Los mensajes van en el óvalo, con los textos sellados (§4.1).
   - En el desempate, quien no empató ve el reparto a los empatados en sus asientos.
2. **La reposición, una persona a la vez, como contra las IAS:** el mismo orden y la misma velocidad. Se revierte P-3. Destino: árbitro v1.2 (Contrato v1.2 y deploy), con la sub-tanda de la recarga.
3. **Normal · Rápido en Armar mesa**, con Normal marcado de entrada. Destino: sub-tanda 7.
   - Solo lo sabe el anfitrión: no aparece en la invitación ni en la sala de espera.
   - Rápido acelera todos los vuelos de cartas, también la reposición uno a uno.
   - El barajado, el sorteo y los relojes no cambian.
4. **Los mensajes de la mesa** (las frases ya diseñadas). Destino: lámina L-M y sub-tanda 5.
   - Llegan a todos por el canal de la mesa, sin pasar por el árbitro.
   - Se leen junto al recuadro de quien los envía, cada uno en su idioma.
   - Freno de 10 s por jugador, contados desde que se publica su mensaje. Sin silenciar.
5. **Cartas repuestas levantadas.** Destino: corregido aquí (§4.2).

### La transición entre manos

- Las cartas de todos vuelven al mazo del Pie, el mazo se desliza al Pie siguiente y se baraja.
- En el centro aparece una pastilla, «Mano 7 · Es Mano Ana», y se desvanece.
- Todo cabe en las esperas que ya existen, sin tiempo nuevo.
- Va en las dos mesas, como excepción consciente con su control: las varas de las IAS en verde, y solo cambia el tramo entre manos.
- Destino: lámina L-M, con dos o tres variantes animadas para que Victor elija a ojo.

---

## 9 · Pendiente

- **Lámina L-M:**
  - la ceremonia del sorteo sobre la mesa;
  - los mensajes de la mesa;
  - la transición entre manos (dos o tres variantes);
  - el recorte de los nombres largos (§6).
- **Sub-tanda 5:** lo que salga de L-M. La capa mínima del sorteo se queda hasta entonces.
- **Árbitro v1.2** (Contrato v1.2 y deploy), con la sub-tanda de la recarga: la reposición uno a uno y el volteo del sorteo de 5 s.
- **Sub-tanda 7:** Normal · Rápido en Armar mesa.
- **Higiene:** el barrido «Heptacoins» de `msg` (informe de la sub-tanda 2, §7). El punto de millar solo en PvP queda anotado para IDI-1.
