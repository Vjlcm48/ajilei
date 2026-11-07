# AJILEI · MES-PvP · Lámina L-M · Tanda 1 · Informe · v1.0

- **Ficha:** `AJILEI_MES-PvP_LM-1_v1.0.md`, «El arranque: quién es quién». La lámina pasó por tres vueltas (STOP-L, L2 y L3) y Victor aprobó la tercera. **Normativo:** Reglas de APU-1 v1.8 §8.4 (los textos del sorteo) y `docs/AJILEI_MOT-1_Contrato_v1.0.md` v1.2. El reparto pide la v1.3: ver §3.
- **Base:** `ac96f51` (sub-tanda 3-A, publicada).
- **Commits:** L-M1-a `2999b21` (núcleo), L-M1-b `a2fdca1` (componentes), L-M1-c `a6696f0` (imitado y escenas), L-M1-d `4a06230` (servidor de desarrollo) y el de este informe (L-M1-e).
- **Sin push:** ver §4. **Sin nube:** no hay migración, no hay deploy y el árbitro real no cambia.

**En tres líneas.** El sorteo de la Mano se juega sobre la mesa: la capa del centro desaparece y, en `SORTEO`, se monta ya la mesa. El anfitrión reparte de una en una desde su mazo, cada uno elige en su fila y las elegidas se voltean en cada asiento. Los mensajes son cuatro textos neutrales, los mismos para toda la mesa. La crónica PvP corta los nombres largos en 10 caracteres.

---

## 1 · Lo aprobado por Victor (STOP-L3)

1. **Variante c del mazo:** el mazo va en el anclaje `.deck-pile`/`.opp-deck` del anfitrión. La carta elegida sube 18 px dentro de su recuadro, también en los asientos ajenos.
2. **Reparto de uno en uno:**
   - en sentido antihorario: la primera carta al jugador a la derecha del anfitrión y la última a él;
   - en el desempate, solo a los empatados;
   - siempre a la velocidad del reparto rápido del juego (297,5 ms por carta), también en la mesa de 5;
   - las cartas vuelven al mazo con el mismo vuelo.
3. **El «salto raro»:** el primer fotograma de cada etapa usaba el tiempo de la anterior. Se arregló guardando el tiempo junto con su etapa. En vivo quedan 0 fotogramas con cartas en los huecos antes del primer vuelo.
4. **Cronómetro:** solo el propio, en el sitio del cronómetro del turno, y desaparece al elegir. **Aviso de poco tiempo:** el del turno (pulso rojo de `.timer-warning` y sonido `timerWarning`), a los 3 s.
5. **Mensajes:**
   - los cuatro textos de §2, los mismos para toda la mesa;
   - **quien no está en el desempate** ve el mensaje de empate hasta el volteo, en lugar de la invitación;
   - con el veredicto, la carta del Mano brilla y la marca de Mano se desliza hasta su asiento.
6. **«Pozo 0» y «Comodín activo»** se ocultan durante el sorteo. La caja se queda y el óvalo no cambia.
7. **Mesa de 2 a 915×412:** la franja choca siempre con el recuadro rival. En ese caso el mensaje va dentro del óvalo de la crónica, en 1 a 3 líneas, sin salirse y sin que el óvalo cambie de tamaño.
8. **Corte de nombres en 10** en la crónica PvP (`CORTE_VOZ`). Con 15 «W» no desborda ni hace crecer el óvalo en ninguna de las cinco pantallas. En la lámina, `&corte=0` lo quita para comparar.

**Arreglado por el camino:**
- en el volteo de un empate, las cartas de quien no había empatado desaparecían; ahora se ven todas;
- el guion en vivo de `sorteo-desempate-fuera` se colgaba en la ronda 2.

## 2 · Los textos del sorteo

Están sellados en las Reglas de APU-1 v1.8 §8.4. Victor guardó la v1.8, y entra en `docs/` con la ficha de la tanda 2. Hasta entonces los textos viven en `TEXTOS_SORTEO` (`src/lib/sorteoMesaCore.js`):

1. «Elige una carta para saber quién es Mano»
2. «Hay empate entre {N} jugadores, vamos a desempatar»
3. «Tercer empate: el azar decide»
4. «¡Ya tenemos Mano!»

Las claves viejas `pvp.sorteo.*` de `textos.pvp.es.js` siguen en el diccionario y se retiran con la tanda 2. Ya no las lee nadie.

## 3 · Para el Contrato v1.3: el tiempo del reparto del sorteo

El tiempo del reparto pasa a depender de cuántos participan (P):

**120 + 5·P·297,5 + 400 ms** → 3.495 ms con 2 jugadores · 7.958 ms con 5 (`esperaRepartoSorteo`).

El árbitro real sigue con **2.008 ms fijos** (`ESPERA_REPARTO_SORTEO_MS`, reparto por oleadas) hasta la sub-tanda que lo cambie. En la lámina, el árbitro imitado en vivo alarga el reparto a `esperaRepartoSorteo(P)`.

## 4 · Por qué no hay push

La tanda 1 no se puede publicar todavía. Con el árbitro real, el reloj de elección arranca a los 2.008 ms, pero el reparto en pantalla dura de 3.495 ms (2 jugadores) a 7.958 ms (5). Si se publicara hoy, el reloj se comería parte de los 10 s de elección mientras las cartas todavía vuelan. **El push espera al árbitro con el Contrato v1.3.**

## 5 · Para la sub-tanda 5

- **Quitar «Arrancando la partida…»:**
  - Es el `Traje` de las salas con ese texto, que sale entre la sala de espera y la mesa. Viene de la escena `arrancando` (sin vista aún) y del respaldo de `Suspense` mientras carga la mesa, ambos en `PartidaPvP.jsx`.
  - Objetivo: de la sala de espera se entra directo a la mesa y empieza el sorteo, en los tres casos (se sientan todos, se cumple el tiempo, o el anfitrión inicia con los sentados).
  - Es solo cliente, sin migración ni deploy. Antes hay que medir cuánto dura hoy con el servidor real.
- **El `.action-area` del salto del óvalo:** `GameTable` no lo monta en `SORTEO`, así que el óvalo se desplaza 28–46 px al pasar del sorteo al primer turno. El cronómetro del sorteo imita hoy su sitio con medidas tomadas en un turno real.
- **El cobro no cambia.** La entrada se cobra al sentarse:
  - `crear_sala` y `unirse_sala`, con `cobrar_entrada` (`mot1_dinero.sql:661` y `:778`);
  - `crear_partida` solo comprueba que el neto de cada sentado sea −entrada.
  - Ninguna pantalla intermedia interviene en el dinero.

## 6 · Varas candidatas para la tanda 2

Hoy las mide `laminas/lm1/medir.mjs` (sin seguimiento). Propuestas como celdas de `diagDSK pvp`:

1. **Franja del sorteo:** que no choque con recuadros ajenos ni con cartas propias. En la mesa de 2 a 915×412, que vaya dentro del óvalo de la crónica sin salirse y sin cambiar su tamaño.
2. **Crónica con 15 «W» y corte 10:** «… pasa.» en las cinco pantallas, sin desbordes y sin que crezca el óvalo.
3. **Salto raro:** en vivo, ningún fotograma con cartas en los huecos antes del primer vuelo del reparto.

## 7 · Controles

- **eslint:** 0.
- **`npm test`:** 106 archivos y 2.754 pruebas, con `src/lib/sorteoMesaCore.test.js`, que cubre el orden del reparto, el mensaje dentro y fuera del desempate, el tercer empate y el corte.
- **`1.8b`:** 176,9 KiB, sin cambios: el sorteo nace en el trozo de la partida (INV-84).
- **`diagDSK pvp`:** 20/20 celdas y 43/43 escenas, con las 11 escenas nuevas del sorteo.
- **Aislados (`--perfil=commit`):** de los cinco commits, en el STOP-C.
- **Mesa de las IAS:** no cambia. No se tocó `GameTable` ni ningún núcleo compartido ni archivo protegido.

## 8 · Cómo se pide cada cosa en la lámina

Puerta doble DEV + bypass:

`/?pvp=<escena>&n=2..5&asiento=k[&nombres=largo][&ver=vivo][&corte=0][&momento=ms]`

Escenas del sorteo:

`sorteo-reparto` · `sorteo-elige` · `sorteo-elige-algunos` · `sorteo-volteo-propio` · `sorteo-volteo-ajeno` · `sorteo-empate` · `sorteo-desempate` · `sorteo-desempate-fuera` · `sorteo-azar-propio` · `sorteo-azar-ajeno` · `sorteo-vuelta`

Para abrirla en un teléfono: `npx cloudflared tunnel --url http://localhost:5173` (por eso L-M1-d).
