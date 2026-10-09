# AJILEI · ECO-1 · Fase 1c — Informe: la mesa contra las IAS en el servidor · v1.0

**Ficha:** `AJILEI_ECO-1_Fase1c_v1.0.md`, con el plan del STOP-1 aprobado (P-1 a P-6, CEL-2c y el cambio de P-5) y el STOP-2 aprobado (migración y lámina) · **Base:** `main` en `16f9d44` · **Fecha:** 2026-10-08/09
**Ejecutor:** Claude Code · **Rector:** Claude (chat) · **Decisor:** Victor
**Estado:** STOP-3, con las respuestas del rector a la §9 ya hechas (P-2a y P-2b), y **validada en el teléfono** por el túnel contra la base real (§10). Antes de la ceremonia de commit.

---

## 0. Resumen

- **Cada mesa contra las IAS existe en el servidor.** La entrada se cobra al sentarse (`sentarse_ia`), cada recarga al confirmarse (`recargar_ia`) y la salida una sola vez, topada por el techo de la mesa (`salir_ia`). El teléfono no entra a una mesa que el servidor no abrió.
- **El teléfono avisa de cada cambio de su pila** (C3): el ante, cada apuesta en cuanto sale al pozo, el pozo que cobra y la recarga. Si la partida se corta, se cobra la última pila avisada. El aviso de fin de mano lleva el récord (C7).
- **Una sola partida abierta por cuenta** (C4). Sentarse cierra y cobra la vieja; al arrancar, la app recoge la que quedó abierta en este dispositivo, o la de otro si lleva más de 10 minutos callada (P-4). El dispositivo que pierde su mesa se entera en su siguiente aviso y vuelve al inicio (C6).
- **El aviso de saldo** de la lámina aprobada dice el dinero que vuelve fuera de la mesa, junto a la píldora, con la cuenta de la cifra vieja a la nueva y el brillo de la moneda.
- **El ajuste local de la 1b desaparece**, con sus siete marcas `TRANSITORIO hasta ECO-1c`. La píldora es siempre la billetera del servidor. **El caso R-1 de la 1b desaparece con él.**
- **D-1 era real** y está arreglado: una IA que se queda sin fichas en la mano ya no vuelve al recargar. El modo `revive` sale rojo sin el arreglo y verde con él.
- **CEL-2c se cierra**: `celebracion` sale en verde, sin un solo conocido, por primera vez desde ARN-3c. «Saldo actual» es el saldo real (C8).
- **Varas, todas en verde:** vitest 1.437 (antes 1.361), lint 21, build correcto, `diagSAL` 102/102, `humo`, `rec`, `apu` en sus ocho viewports y los estados de REC-2, `saldo`, `mesaia` (10/10 con P-2), `revive` y `celebracion`.
- **El tope de 4 h se pasó.** Lo digo en §12 y no he recortado ninguna vara.

---

## 1. STOP-2: la migración en la base real

**Victor aplicó la migración** `supabase/migrations/20261008220239_eco1c_mesas_ia.sql` con `db push`, sin errores, y corrió `supabase/pruebas/eco1c_verificacion.sql` en el SQL Editor (consulta guardada «ECO-1c · verificación»). **19 de 19 en PASA.** Lo medido, fila a fila:

| # | Prueba | Detalle medido |
|---|---|---|
| 1 | Sentarse cobra la entrada | saldo 2.500 → 2.000 · pila 500 · techo 1.250 |
| 2 | Mismo token, un solo cobro | `repetido`, misma mesa |
| 3 | Validación de la mesa, sin efectos | las siete validaciones correctas, sin efectos |
| 4 | `informar_pila`: seq y techo | seq viejo y repetido ignorados · 5.000 → 1.250 · anomalías 1 |
| 5 | Récord: una mano por aviso | jugadas 2 · humano 1 · IA 1 |
| 6 | Recargar cobra y sube el techo | saldo 2.000 → 1.500 · pila 850 · techo 4.250 |
| 7 | Recarga sobre el techo, no múltiplo, sin saldo | `sobre_techo` / `monto_invalido` / `saldo_insuficiente`, saldo intacto |
| 8 | Salir: un cobro, topado | cobrado 4.250 una vez |
| 9 | Sentarse cierra la vieja y lo dice | anterior 700 · B cerrada/reemplazada/700 · reintento repetido/700 |
| 10 | Una sola mesa abierta | la segunda abierta a mano, rechazada |
| 11 | La mesa reemplazada responde | `mesa_cerrada` en las tres funciones |
| 12 | Saldo insuficiente, sin efectos | `saldo_insuficiente`, C sigue abierta |
| 13 | Recoger al arrancar | viva / recogida 1.000 / recogida 500 / ninguna |
| 14 | Salir con 0 | cobrado 0, sin movimiento |
| 15 | Ajena y sin sesión | `sin_mesa` ×3, `sin_sesion` |
| 16 | Permisos del cliente | correctos |
| 17 | Realtime y RLS | Realtime 0 · RLS 2/2 · políticas 0 |
| 18 | El libro cuadra | cuadrado, un cobro por mesa |
| 19 | `record_manos_resumen` | correcto |

**La migración no se edita**: su línea «CORRIDA REAL · pendiente» se queda, y la corrida vive aquí, con el mismo criterio que la 1a.

**Antes de entregarla** pasó por el banco de PGlite de la 1a (`scratchpad/eco1a/prueba1c.mjs`, fuera del repo), con todo en verde a la primera:
- todas las migraciones del repo, y la 1c dos veces;
- el guion, con y sin `begin`/`rollback`, sin dejar rastro;
- los roles de verdad: `authenticated` juega una partida entera, no lee tablas ni llama a las internas, y `anon` no llama a nada;
- `mi_mesa_ia` sin mesa da cero filas, no una fila de nulos;
- borrar la cuenta arrastra sus mesas y su récord.

---

## 2. Lo hecho

### 2.1 Archivos nuevos

| Archivo | Qué es |
|---|---|
| `supabase/migrations/20261008220239_eco1c_mesas_ia.sql` | Las tablas `mesas_ia` y `record_manos`, la pieza `cerrar_partida_abierta`, las seis funciones del cliente y `record_manos_resumen()` (STOP-2) |
| `supabase/pruebas/eco1c_verificacion.sql` | El guion de 19 filas (STOP-2) |
| `src/hooks/mesaIACore.js` (+ prueba) | La cola única de avisos, recargas y salida, con `seq`; la salida que espera a la recarga (P-2a); `TOPE_RECARGA_MS` (P-2b); `finDeMano` (la capa 0, no `winner`) |
| `src/dev/bancoImitado.js` (+ prueba) | **El contrato SQL de la 1c en JS**, un solo modelo para el bypass, el arnés y las pruebas de contrato (las mismas cifras que el guion), más una prueba de espejo que lee la migración |
| `src/lib/mesaIAApi.js` | La API de las seis funciones; nunca rechaza |
| `src/lib/controlMesaIA.js` (+ prueba) | El canal de UNA mesa con el servidor: manda en orden, reintenta lo mismo (también lo colgado, con `forzar`, P-2b) y avisa |
| `src/lib/dispositivo.js` | La marca del navegador (P-4), en `ajilei.dispositivo` |
| `src/hooks/avisoSaldoCore.js` (+ prueba), `src/hooks/useAvisoSaldo.js`, `src/components/AvisoSaldo.jsx`, `src/styles/avisoSaldo.css` | El aviso de saldo de la lámina |
| `scripts/eco/mesaia.mjs` | Los modos `mesaia` y `revive` de `diagDSK` |
| `laminas/eco1c/` | La lámina aprobada en el STOP-2 (`lamina.html`, `capturar.mjs`, `capturas/`) |
| `docs/AJILEI_ECO-1_Reglas_v1.1.md` | El normativo v1.1. La v1.0 se queda como historia |

### 2.2 Archivos cambiados

- **La billetera:** `src/hooks/billeteraCore.js` (+ prueba) y `src/hooks/useBilletera.js`. Fuera `entrar`/`recargar`/`salir` y el ajuste; dentro `tomarSaldo`, el estado «pendiente» y la generación.
- **`src/dev/billeteraFalsa.js`:** un banco imitado por carga de página para la billetera y las mesas.
- **`src/dev/siembraAPU.js`:** `entradaSembradaAPU` (P-6) y el mando `bolsillo:<n>` (§8, H-2).
- **`src/App.jsx`:**
  - sentarse con token por intento;
  - el canal de la mesa, y la píldora mientras la salida espera a una recarga (P-2a);
  - la recogida al arrancar;
  - C6;
  - el aviso de saldo.
- **`src/components/GameTable.jsx`:**
  - el efecto de C3;
  - la recarga por el servidor, con el tope de 10 s (P-2b);
  - el cobro de la victoria (C8).

  **No es protegido.**
- **`src/components/BarraSuperior.jsx`, `PantallaChips.jsx`, `src/screens/Lobby.jsx` y `RetarIAS.jsx`:** el aviso de saldo y «Sentando…».
- **`src/components/Celebracion.jsx` y `src/hooks/useCoreografia.js`:** la cuenta del saldo espera a la cifra real, con un tope de 4 s.
- **`src/hooks/mesaCore.js`:** D-1 (§4).
- **`src/config/textos.es.js`:** 14 claves nuevas (13 + `ia.recarga.error.tope` de P-2b), con el prefijo nuevo `aviso.*`.
- **`src/main.jsx`:** el comentario de la última marca TRANSITORIO.
- **Arnés:**
  - `scripts/arnes/nucleo.mjs`: `respuestaRpc` con banco, y `mesaia` y `revive` en `MODOS_DSK` con su lector de veredicto;
  - `scripts/arnes/comun.mjs`, `scripts/cap/capMesa.mjs` y `scripts/bie/bieRed.mjs`: un banco imitado por contexto, más los mandos `cortes`, `retrasos` y `llamadas`;
  - `scripts/diagDSK.mjs`: los dos modos, y `saldo.2` contra el libro;
  - `scripts/diagCEL0.mjs`: el re-sello de CEL-2c.
- **Pruebas que existían:**
  - `scripts/testMesaAPU1.test.js`: D-1, §4;
  - `scripts/testClavesAlmacen.test.js`: la clave nueva;
  - `src/config/textos.test.js`: el prefijo y un «Reintentar» repetido a propósito;
  - `scripts/testDistSinMoldes.test.js`: la marca del banco y la huella `bolsillo:` como prohibidas, y las funciones de mesa como obligatorias.
- **`docs/AJILEI_Invariantes_v1.0.md`:** INV-46 actualizada, INV-47, INV-48 e INV-49 nuevas, y las Reglas v1.1 en §4.
- **`.gitignore`:** `capturas-mesaia/`.

**Ningún protegido se abrió.** Del motor solo se importan `PHASES` y `createInitialState`, como ya hacía `mesaCore`.

---

## 3. Cómo funciona

### 3.1 Sentarse
`App.retar` llama a `sentarse_ia` antes de entrar.
- **Mientras contesta**, el CTA dice «Sentando…» y está apagado.
- **Un token por intento:** el reintento de la misma elección lo repite, así que si la primera llamada sí llegó, el servidor devuelve la misma mesa sin cobrar. Una elección distinta, o un «no» definitivo, lo renueva.
- **Si falla**, se queda en Retar con la nota:
  - «No pudimos abrir la mesa…» si es la red;
  - la de saldo, con relectura, si es `saldo_insuficiente`.
- **Con la respuesta**, la billetera toma el saldo devuelto y nace el canal de la mesa (`controlMesaIA`).

### 3.2 Los avisos de pila (C3)
**Un solo efecto en `GameTable`.** Mira la pila del humano, la fase y el número de mano. Todo lo que mueve la pila pasa por `setGame`, así que basta con él, sin abrir el motor.
- **En PAYOUT, una vez por mano**, el aviso lleva el fin de mano: `vivos` = `aliveCount`, y `ganoHumano` = el humano se lleva la capa 0.

**La cola** (`mesaIACore`) manda una cosa a la vez y en orden:
- un aviso de solo pila se salta si detrás llega otro;
- el de fin de mano no se salta nunca;
- lo que no contesta se reintenta con el mismo `seq`, esperando 1, 2, 4, 8 y luego 15 s, o en el acto al volver a primer plano.

### 3.3 La recarga
**Las fichas llegan cuando el servidor confirma.**
- **Mientras contesta:**
  - el botón dice «Recargando…»;
  - «No recargar» y los montos se apagan;
  - **el plazo de 15 s se para**, para que una forzosa no venza con la recarga quizá cobrada.
- **Si no contesta:** el subtítulo dice «No pudimos confirmar la recarga.» y el botón pasa a «Reintentar», que repite la misma recarga sin cobrarla dos veces.
- **A los 10 s sin respuesta (P-2b),** falle la red o se quede la petición colgada:
  - el subtítulo dice «El servidor no responde. Si la recarga entra, sus fichas van contigo.»;
  - «Reintentar» queda encendido y vuelve a mandar la misma recarga (el mismo `seq`) aunque la primera siga en vuelo;
  - el segundo botón pasa a **«Salir con mis fichas»**, también en la automática y la voluntaria;
  - la ✕ sigue viva (en la forzosa la tapa el velo, como desde REC-1; ahí la salida es ese botón).
  Una vez ofrecida, la salida no se retira al reintentar: solo la quita la respuesta del servidor.
- **Un «no» del servidor** (sin saldo, sobre el techo) se dice en el subtítulo.

La geometría de la tarjeta no cambia (O1): se reutilizan el renglón del subtítulo y el botón.

**Una recarga cuya respuesta se pierde no se abandona nunca.** La regla de la salida que la espera es la del §3.4.

### 3.4 La salida
- **El jugador se levanta en el acto** y la píldora enseña «—» hasta que `salir_ia` contesta.
- **Si la salida no contesta,** la píldora deja el «—» y enseña lo que diga el servidor, y la cola la sigue reintentando.
- **Si la página se cierra antes,** la mesa queda abierta con su última pila y la recoge el arranque.
- **La ✕, el plazo y la celebración piden la MISMA salida**, porque el canal devuelve la misma promesa.
- **Con una recarga pendiente, la salida espera su respuesta en la cola (P-2a, regla sellada).**
  - Si la recarga entró (`ok` o `repetido`), sus fichas se suman a las de la salida. La mesa no llegó a ponerlas, porque solo aparecen cuando el servidor confirma.
  - Si falló de forma definitiva (un «no» del servidor, o `seq_viejo`, que en una recarga quiere decir que no se aplicó), la salida va sin ellas.
  - Sin respuesta no es definitivo: la recarga se reintenta y la salida sigue detrás.
  - Vive en el núcleo (`mesaIACore.alResponder`), no en el canal. La sellan siete pruebas, entre ellas «la ✕ se pulsa con la recarga en vuelo y la recarga entra». La segunda respuesta de un mismo `seq` no suma dos veces.
  - Mientras tanto la píldora sigue en «—»: el «sí» de la recarga no es la cifra final, y solo un «no contesta» de lo que va delante de la salida la suelta.

### 3.5 La victoria (C8)
- **La mesa ganada se cobra al entrar en la celebración**, y «Saldo actual» cuenta la cifra que devuelve `salir_ia`.
- **Si no ha llegado** cuando le toca el turno (unos 5 s después de montar), el tramo del saldo la espera hasta 4 s. Si sigue sin llegar, se pinta «—» y el relato sigue.

### 3.6 Una sola partida abierta (C4–C6) y el aviso de saldo
- **Al arrancar** (una vez por cuenta), `recoger_mesa_ia` recoge la mesa abandonada y sale el aviso en el lobby (escena a).
- **Sentarse con una mesa abierta en otro dispositivo** la cierra (escena c): en Retar, la píldora cuenta solo la devolución, hacia arriba, y la mesa nueva entra a los 1,65 s.
- **El dispositivo que pierde su mesa** recibe `mesa_cerrada` en su siguiente aviso: aviso (b) y vuelta al lobby. Si ya se había levantado, solo se toma el saldo.

Los textos son los aprobados:
- (b): «Abriste otra partida en otro dispositivo. Volvieron {hc} HC.»
- (e): «Tu partida anterior quedó cerrada. No quedaban fichas en la mesa.»

### 3.7 El modo sin sesión y el arnés
- **En desarrollo con bypass**, la app habla con un banco imitado por carga de página (`billeteraFalsa.bancoDelBypass`), el mismo modelo del SQL.
- **Contra `vite preview`**, quien contesta es un banco imitado por contexto en las rutas del arnés.
- **La guardia de `dist/`** comprueba que la marca del banco no llega a producción, y ahora también que las funciones de mesa de verdad sí llegan.

---

## 4. D-1: reproducido y arreglado

**Reproducción:** en la 1c-i, con una prueba `it.fails` en `src/hooks/mesaIACore.test.js`. Mesa de 2 en PAYOUT, IA a 0 y sin `eliminated` (solo lo escribe `startHand`): `nivelarLasIAS` le daba la pila entera. En la app, el modo `revive` (`?apu=saldo:5000,allinIA,gana`, recarga voluntaria y «Siguiente mano»):

| | Resultado de `revive` |
|---|---|
| **Sin el arreglo** | **rojo**: tras la recarga se reparte otra mano, porque la IA nivelada sigue sentada |
| **Con el arreglo** | **verde**: la mesa se cierra con la victoria |

**El arreglo (P-2):** `mesaCore.nivelarLasIAS` solo completa a las IAS con fichas ≥ la apuesta, el mismo criterio con el que `startHand` elimina. La prueba `it.fails` pasa a `it`, con un caso más: la IA con menos de una apuesta tampoco se nivela, y con una apuesta justa sí.

**Las dos pruebas de `scripts/testMesaAPU1.test.js` que cambian** (§5.3, «el nivelado de las IAS»):

- **«Las eliminadas no vuelven».**
  - **Antes:** la mesa `[1000, 0, 0]` con la IA 1 marcada `eliminated`. La prueba esperaba que se nivelara **la IA 2, que está a 0 sin marcar**. Es decir, daba por bueno exactamente el defecto D-1: una IA quebrada en la mano, aún sin marca, recibía fichas.
  - **Ahora:** la mesa es `[1000, 0, 0, 200]` y se espera que solo suba la IA 3, viva con fichas. No vuelven ni la eliminada (por su marca) ni la quebrada (por no cubrir el ante). El nombre pasa a «…ni las quebradas sin marca (D-1)».
- **«El techo de la mesa topa también a las IAS».**
  - **Antes:** sentaba al humano en el techo (2.500) y a la IA **en 0**, y esperaba que la IA subiera 2.500. Afirmaba dos cosas a la vez:
    1. que el techo topa la fórmula: 1,5 × 2.500 = 3.750 se queda en 2.500, que es lo que dice su nombre;
    2. que una IA a 0 se nivela, que es D-1.

    Con el arreglo, la segunda mitad ya no es verdad y la prueba se caía por la mitad equivocada.
  - **Ahora:** la IA se sienta con **una apuesta, viva**, y se espera que suba `techo − apuesta`. La prueba afirma solo lo que dice su nombre: tras nivelar, la pila de la IA no pasa del techo aunque 1,5 veces la del humano lo pasaría.

**La cota del servidor no cambia con D-1:** el techo de cobro ya cubría al peor caso (Fase 0 §D.1).

**Una nota de método.** El control rojo de `revive` lo hice quitando el arreglo un momento **en el árbol principal**, corriendo el modo y restaurando el archivo desde una copia. `git diff` lo confirma: solo queda el arreglo. La regla de la casa (Invariantes §3, H3e-i-4) pide hacer esto en una copia. Lo consigno aquí en vez de esconderlo.

---

## 5. Los moldes de humano (P-6) y CEL-2c

**Moldes.** `siembraAPU.entradaSembradaAPU(apuesta)` devuelve la pila con que sienta un molde de humano:

| Molde | Pila sembrada |
|---|---|
| `allinHumano` | 1,5 apuestas |
| `recarga` | 3 |
| `quiebra` | 0,5 |
| `sinRival:d12` | 1 |

- **`App` se sienta en el servidor con esa cifra**, y el banco del bypass la admite aunque no sea una entrada legal (`entradaDeMolde`; el SQL real no tiene esa puerta).
- **El descuadre de la Fase 0 §I.2 desaparece:** entrada de 1.000, molde de 75 y saldo 4.000 al salir. Ahora se cobran 75 y el saldo cuadra.
- **La mesa se sigue armando con la entrada elegida:** las IAS se sientan con su 1,5×, como siempre, y el molde solo cambia la pila del asiento 0. El primer borrador armaba la mesa con la entrada del molde y dejaba a las IAS cortas; lo vi en la revisión y lo corregí antes de las varas de `apu`.
- **Un efecto declarado, solo en desarrollo:** como el servidor imitado se sienta con 75 y no con la elegida, el techo de cobro de esas mesas es pequeño. Una mesa de molde que ganara mucho cobraría topado. No pasa en la base real, que no admite esas entradas.
- **Lo usan `apu` y `rec`** (§7).
- **La guardia de `dist/` sigue sin ver `allinHumano`**: la tabla de moldes salió de la función a nivel de módulo y el minificador la sigue quitando.

**CEL-2c.** El re-sello aprobado:
- `diagCEL0` toma como saldo la billetera del arnés (5.000), sin la entrada.
- La lista de conocidos queda vacía.
- Junto a la constante 2.933 queda escrito que es la curva en 5.000.

**Resultado:** `diagCEL0 celebracion` da **0 fallos, 0 conocidos, control verde, código 0**.

---

## 6. N = 10 minutos, respaldada (P-4)

**Medido** (`mesaia.8`): una partida de 5 jugadores, 5 manos jugadas solas, con 15 avisos.

| Hueco entre avisos | |
|---|---|
| Mediana | 12,7 s |
| Máximo | 43,9 s |

El máximo es una mano entera en la que el humano se retira pronto y juegan solo las IAS: no cambia su pila hasta el ante de la siguiente.

**La cota que da el código**, para un humano que agota sus turnos sin apostar:
- 3 turnos × 20 s (`TURN_TIME`);
- unas 12 jugadas de IA de 1.125 ms;
- el reparto, el descarte y la revelación (unos 3,7 s).

**Entre 1,5 y 2 minutos.** Diez minutos son más de cinco veces eso.

**Lo que no se puede acotar:**
- la espera antes de «Siguiente mano»;
- la pantalla bloqueada (`useCongelado`).

Para esos casos N es una política. Con la marca de dispositivo, la recogida de una mesa de este mismo navegador no espera a N.

---

## 7. Varas

| Vara | Línea base | Resultado |
|---|---|---|
| vitest | 1.361 | **1.437 en verde**, 60 archivos. D-1 pasa de `it.fails` a `it`. Las 9 últimas, tras el STOP-3: la huella `bolsillo:` de la guardia de `dist/`, 7 del núcleo (P-2a) y 1 del canal (la recarga colgada, P-2b) |
| lint | 21 (20 errores, 1 aviso) | **21**, los mismos archivos (`CardImage`, `GameTable`, `SoundContext`) |
| build | correcto | **correcto** |
| `diagSAL` | 102/102 | **102/102** |
| `diagDSK humo` | verde | **verde** (gate, lob, retar) |
| `diagDSK rec` | verde | **verde** (p1–p7 y anillo), dos corridas en el STOP-3 y una tercera con P-2 |
| `diagDSK apu` (por viewport) | verde | **verde** en los ocho viewports, uno por corrida. **`apu rec2` salió rojo y está corregido** (§8, H-2) |
| `diagDSK saldo` | verde | **verde** (7/7). `saldo.2` comprueba además el libro del servidor imitado: una entrada, una salida y su saldo |
| `diagDSK mesaia` (nueva) | — | **verde 9/9** y consola limpia en el STOP-3; **10/10 con `mesaia.9`** (P-2) (§7.1) |
| `diagDSK revive` (nueva) | — | **rojo sin el arreglo, verde con él** (§4) |
| `diagCEL0 celebracion` | 5 conocidos de CEL-2c | **verde, 0 conocidos** |
| Guardia sobre `dist/` | verde | **verde**: ni `ajilei:billetera-falsa` ni `ajilei:banco-imitado` ni `allinHumano` ni `bolsillo:` (con su control rojo, §8); sí `mi_billetera`, `sentarse_ia`, `informar_pila` y `recoger_mesa_ia` |
| Invariantes | 46 filas | **49 filas**; `testInvariantes` en verde |

### 7.1 `mesaia`, punto a punto

| Punto | Lo medido |
|---|---|
| **1** · sentarse y salir | entrada 500 → servidor 4.500, una mesa abierta. Tras el ante, salida con 450 → **4.950 en Retar, Lobby, Opciones y Armar**. Una entrada y una salida en el libro. **Una sola lectura de `mi_billetera` en toda la visita** (todo lo demás llegó en las respuestas) |
| **2** · la recarga | con la respuesta retrasada 1,5 s, el botón dice «Recargando…», «No recargar» está apagado, las fichas siguen en 1.050 y el libro aún no tiene la recarga; al contestar, 1.550. Con la respuesta perdida: «No pudimos confirmar la recarga.», las fichas quietas en 1.550; «Reintentar» → 2.050, **dos recargas en el libro, no tres** |
| **3** · la victoria (dev, `?cel`) | «Saldo actual» = 5.000 = el banco, una salida; el «Salir» de la celebración no cobra otra vez (sigue habiendo una); la píldora dice 5.000 |
| **4a** · partida cortada | tras una mano, la página se recarga: «Volvieron 1.050 HC de tu partida anterior.»; la mesa queda cerrada/abandono/1.050 y la píldora en 5.050 |
| **4b** · la mesa vieja en otro dispositivo | (pila 1.350, de hace un momento: el arranque la respeta) al sentarse: el aviso en Retar con «Sentando…» en el CTA, la píldora sube de 4.000 a 5.350 sin bajar nunca, y la mesa entra a los 1,70 s. La vieja queda cerrada/reemplazada/1.350 |
| **5** · C6 | cerrada desde «otro dispositivo» con 950: «Abriste otra partida en otro dispositivo. Volvieron 950 HC.», vuelta al lobby, píldora 4.950 = el banco, sin salida propia |
| **6** · doble toque | con 0,8 s de retraso en las dos: doble clic en «Retar» y en «Abandonar mesa» → **una llamada a cada función**, una mesa, una entrada y una salida |
| **7** · avisos perdidos | tres respuestas de `informar_pila` perdidas a propósito en 5 manos de mesa de 5: cada una se reintenta con su mismo `seq` y llega; los `seq` nunca bajan; **el récord cuenta 5 manos**; la pila del servidor (350) = la de la mesa |
| **8** · huecos | §6 |
| **9** · P-2 · la salida que espera a la recarga | Mesa de 2, entrada 1.000, recarga voluntaria de 500 con 1.050 en la mesa. **(a) la ✕ con la recarga en vuelo 3 s:** al salir, el libro aún no tiene ni la recarga ni la salida; luego `recargar_ia#3:ok` y después `salir_ia#4:ok`, que cobra **1.550 = 1.050 + 500**; saldo y píldora **5.050** = 5.000 − 1.000 + 1.050, lo mismo que sin recargar. **(b) la recarga 14 s sin contestar:** a los **10,5 s** la tarjeta dice «El servidor no responde. Si la recarga entra, sus fichas van contigo.», «Reintentar» encendido, «Salir con mis fichas» y la ✕ viva (es el elemento que hay bajo su centro). «Reintentar» manda **la misma recarga dos veces con el mismo `seq` (3, 3)**, contadas al salir de la página; «Salir con mis fichas» sale; el libro tiene **una** recarga y **una** salida de 1.550, y saldo y píldora 5.050 |

---

## 8. Riesgos y hallazgos

- **R-1 · Jugar sin red.** La partida no se para si los avisos no llegan: la cola los acumula y los manda al volver. Si la red no vuelve antes de salir, la salida no sale (va detrás), la mesa queda con la última pila que llegó y la recoge el arranque. Es lo que piden C3 y C10: lo ganado sin red no cuenta hasta que se avisa.
- **R-2 · Una recarga sin respuesta.** Cerrado por P-2: a los 10 s la tarjeta lo dice y deja salir, y la salida lleva la recarga si entra (§3.3, §3.4). Queda una cosa: «No recargar» sigue apagado mientras no conteste, porque el servidor puede haberla cobrado. Lo que se ofrece es salir, no seguir jugando sin ella.
- **R-3 · Dos pestañas del mismo navegador** comparten la marca: la segunda recoge la mesa de la primera, que se entera por C6. Es el residuo aceptado en P-4.
- **R-4 · En Retar, el aviso tapa la flecha y el título** unos 2 s (L-1, aceptado). En 915×412 tapa la marca del lobby (L-2, aceptado).
- **R-5 · La salida enseña «—» unos 3 s.** **Medido en el teléfono contra la base real** (§10, prueba 1): al salir, la píldora muestra «—» unos 3 s antes de la cifra. La salida va detrás de los avisos pendientes de la cola, y espera a que lleguen. En el arnés no se ve, porque el servidor imitado contesta en el acto. **Queda para revisarlo en ajilei.io; no se toca ahora.**
- **H-2 · P-6 cambió el bolsillo de los estados de REC-2.** `apu rec2` sembraba `saldo:1600,quiebra` contando con que sentarse costaba la entrada elegida (1.000) y dejaba 600 en el bolsillo. Con P-6 se cobra lo que el molde sienta (50), y la tarjeta salía en otro caso: **18 rojos, todos del instrumento**. Sembrar 650 tampoco sirve, porque Retar (con razón) no deja sentarse a una entrada de 1.000 con 650. Nace el mando de desarrollo `?apu=bolsillo:<n>`: tras la primera mesa, el banco del bypass deja la billetera en n con un ajuste, como `ajuste_admin`. Los tres estados siembran ahora `saldo:5000,bolsillo:600|0|600`: los mismos bolsillos de la ficha de REC-2. `apu rec2` vuelve a verde.
  - **La puerta del mando (pregunta del rector tras el STOP-3).** `bolsillo:` solo se lee dentro de `simulacionMesaIA`, después de `bancoDelBypass()`, así que está detrás de `DEV && VITE_AUTH_BYPASS`, como `saldo:`. Los moldes de mesa (`allinIA`, `quiebra`, `gana`…) llevan una puerta doble distinta: `DEV` y que el parámetro esté. Sin bypass también siembran. Con la base real, un molde de humano sin bypass manda su entrada a `sentarse_ia`, y el servidor la rechaza con `entrada_invalida` (no es múltiplo de la apuesta o está bajo el piso) sin cobrar nada.
  - **La guardia de `dist/` no buscaba el mando; ahora sí.** Se añade la huella `bolsillo:`, el literal de su expresión regular. Fuera de `src/dev/` «bolsillo» solo vive en comentarios, que no llegan al bundle. La guardia da 11/11 en verde en el árbol. Control rojo en una copia del árbol de trabajo (unión a `node_modules`), con las 9 puertas `import.meta.env.DEV` de `siembraAPU.js` y `billeteraFalsa.js` cambiadas por `true`: 4 rojos (`ajilei:billetera-falsa`, `ajilei:banco-imitado`, `allinHumano` y `bolsillo:`) y 7 verdes.
- **H-1 · El banco imitado es el contrato.** Si alguien cambia una cifra del SQL o del cliente, la prueba de espejo lo dice. Si cambia una regla del SQL sin tocar el modelo, lo dicen las pruebas de contrato de `bancoImitado.test.js`, que repiten el guion con sus mismas cifras.

---

## 9. Preguntas al rector, y sus respuestas

- **P-1 · El récord y las mesas con molde.** En desarrollo, un molde de humano sienta 75 y el banco del bypass lo admite. No llega a la base real (el bypass no tiene sesión).
  - **Respuesta: basta con el informe.** Los moldes no entran en el normativo.
- **P-2 · La recarga sin red (R-2).**
  - **Respuesta (a), regla sellada:** con una recarga pendiente, la salida espera su respuesta en la cola; si entró (`ok` o `repetido`), sus fichas se suman a la salida; si falló de forma definitiva, va sin ellas. Vale para la ✕, el plazo y la celebración.
    - **Hecho.** La regla pasa del canal (`controlMesaIA`) al núcleo (`mesaIACore.alResponder`), donde la sellan siete pruebas (§3.4). Entre ellas está «la ✕ se pulsa con la recarga en vuelo y la recarga entra»: la recarga de 500 en vuelo y la salida con 300 detrás; al entrar, la salida sale con 800. Control rojo en una copia con la suma quitada: 5 rojas (las que suman) y verdes las 2 de «sin ellas». El control rojo es del núcleo solo: en la copia, `controlMesaIA.test.js` no llega a cargar porque falta `.env.local` (SUP-1).
    - Las tres puertas ya pedían la misma salida (§3.4), así que la regla les vale a las tres sin código propio.
  - **Respuesta (b):** tope de 10 s sin respuesta en la tarjeta, con aviso, «Reintentar» con el mismo `seq` y la opción de salir con las fichas; la ✕ sigue viva; textos por `t()`.
    - **Hecho** (§3.3). `TOPE_RECARGA_MS` = 10.000 en `mesaIACore`. Una clave nueva, `ia.recarga.error.tope`; el botón de salir reutiliza `ia.recarga.no.forzosa` («Salir con mis fichas»).
    - **«Reintentar» tenía que poder con una petición colgada,** que no falla y por eso no programa reintento: sin más, el botón no habría hecho nada. `reintentarAhora({ forzar: true })` vuelve a mandar lo que sigue en vuelo, con el mismo `seq`. De las dos respuestas cuenta la primera, y el fallo de un envío ya reemplazado no programa otro reintento. Lo sella una prueba del canal: recarga colgada, ✕ detrás, «Reintentar» forzado → dos llamadas con el mismo `seq`, una recarga y una salida en el libro, y la salida cobra fichas + recarga.
    - **Un ajuste en `App`** que la regla trae consigo: con la salida ya pedida, el «sí» de la recarga ya no toca la píldora (seguiría en «—» hasta la salida), y un «no contesta» de lo que va delante de la salida la suelta igual que uno de la salida.
  - **`mesaia` lo mide con el servidor imitado:** punto nuevo `mesaia.9` (§7.1).
- **P-3 · `mi_mesa_ia`.**
  - **Respuesta: se queda.** Queda **reservada** para el diagnóstico y para MES-PvP, **sin consumidor en el cliente**: `mesaIAApi.miMesa` existe y la prueban el guion y `controlMesaIA.test.js`, pero ninguna pantalla la llama. El arranque usa `recoger_mesa_ia`.

---

## 10. Pruebas en el teléfono para Victor

Con la build en el túnel de siempre, contra la base real. Cada prueba dice qué hacer y qué debe verse.

**Resultado (Victor, 2026-10-09):** la 1c queda validada en el teléfono. Victor cerró después el preview y el túnel.

| Prueba | Resultado |
|---|---|
| 1 · sentarse y salir | **bien.** Al salir, la píldora mostró «—» unos 3 s antes de la cifra (R-5, §8) |
| 2 · recargar y salir | **bien.** Perdió 500, recargó y salió con 2.000 |
| 3 · recargar la página | **bien** |
| 4 · partida cortada | **bien** |
| 5 · dos dispositivos | **bien** |
| 6 · el Motorola | **bien** |
| 7 · recarga sin respuesta (P-2) | **bien** |
| 8 · el caso R-1 de la 1b | **omitida**: la cubre el arnés |
| 9 · el récord | **bien.** `record_manos_resumen`: básico · 2 vivos, 2 jugadas (1 ganada / 1 perdida); básico · 3, 1 (0/1); básico · 5, 1 (0/1); **total 4 (1/3)**, lo que jugó Victor |

1. **S25 (`test1976`). Entra y siéntate contra las IAS** (cualquier mesa).
   - Al pulsar «Retar», el botón dice un momento **«Sentando…»** y luego se abre la mesa.
   - Sal enseguida con la ✕ sin jugar: la píldora debe enseñar **la misma cifra que antes de sentarte**, en el inicio, en Retar y en «Jugar contra jugador».
2. **Juega unas manos, recarga una vez y sal.**
   - Al recargar, el botón dice **«Recargando…»** y las fichas aparecen cuando termina.
   - Al salir, la píldora dice la cifra nueva, la misma en todas las pantallas.
   - Si ganas la mesa entera, en la pantalla de victoria **«Saldo actual» es tu saldo de verdad**, el mismo que luego enseña la píldora.
3. **Recarga la página** (desliza hacia abajo o cierra y abre).
   - El saldo **ya no vuelve** a la cifra de antes de jugar: lo ganado o perdido se quedó.
4. **Partida cortada.** Siéntate, juega un par de manos, **cierra la app del todo** a mitad de partida y vuelve a abrirla.
   - Al entrar sale, junto a la píldora, **«Volvieron … HC de tu partida anterior.»** y la píldora sube hasta la cifra nueva.
   - La cifra es lo que tenías en la mesa en la última jugada (lo que ya estaba en el pozo no vuelve).
   - Es al abrir la app, no al sentarte: la partida era de este mismo teléfono.
5. **Dos dispositivos.** Siéntate en el S25. Sin salir, entra en el PC con la misma cuenta y siéntate allí.
   - En el PC, antes de abrirse la mesa, sale **«Volvieron … HC de tu partida anterior.»** en Retar.
   - En el S25, en la siguiente jugada, sale **«Abriste otra partida en otro dispositivo. Volvieron … HC.»** y vuelve al inicio.
   - No se pierde dinero: la cifra del S25 y la del PC acaban siendo la misma.
6. **Motorola (`ticotest2022`).** Entra.
   - Su saldo **no se mueve** por nada de lo que hiciste en el S25.
7. **Recarga sin respuesta (P-2).** En una mesa, pulsa «Recargar» (la burbuja) y elige un monto. **Justo antes de pulsar «Recargar …», pon el modo avión.**
   - Primero dice «No pudimos confirmar la recarga.» y el botón dice «Reintentar».
   - **A los 10 segundos** dice «El servidor no responde. Si la recarga entra, sus fichas van contigo.» y el otro botón pasa a **«Salir con mis fichas»**.
   - Pulsa «Salir con mis fichas» y **quita el modo avión**. La píldora enseña «—» un momento y luego la cifra final: la de antes de sentarte, menos la entrada, más las fichas con que saliste. La recarga se manda al volver la red y, si entra, sale contigo: se cobra y vuelve en la misma salida, así que la cifra final es la misma entre o no.
8. **El caso R-1 de la 1b desaparece.** Si tu saldo pasa de 5.000, ve a «Jugar contra jugador» → «Armar una mesa».
   - La mesa de 1.000 te deja entrar.
9. **El récord.** En el SQL Editor, corre `select * from public.record_manos_resumen();`.
   - Salen las manos que jugaste, por reto y por jugadores vivos, con cuántas ganaste tú y cuántas las IAS.

---

## 11. Cierre de terreno

- **Puertos del 4170 al 5599:** solo escucha el svchost del 5040, que no es nuestro.
- **Procesos node:** ninguno vivo.
- **Protegidos:** ninguno abierto; scripts/testProtegidos.test.js en verde (las seis huellas, idénticas).
- **git status:** los 5 residuos de MOT-1, sin tocar, más lo de esta tanda (§2), todo sin añadir. capturas-mesaia/ está ignorada.
- **Las varas de tiempo (mesaia, revive y saldo) se repitieron al final** sobre el código definitivo, en verde. El hueco más largo entre avisos en esa corrida: 44,4 s.
- **Con P-2 (tras el STOP-3):**
  - `mesaia` dio primero un rojo **del instrumento** en `mesaia.9b`: contaba los reenvíos en `b.llamadas`, que la ruta anota al contestar, tras el retraso de 14 s. El reintento forzado contestaba con el contexto ya cerrado. Ahora se cuentan al salir de la página (`page.on('request')`), y todo lo demás de aquella corrida ya estaba en verde. Segunda corrida: 10/10.
  - Las copias de los controles rojos, `eco1c\copiaGuardia` (la guardia de `dist/`) y `eco1c\copiaP2` (P-2a), quedaron en el scratchpad sin uniones. **Victor borró a mano la carpeta `scratchpad\eco1c` entera** (las dos copias y los registros), tras comprobar que no tenía puntos de reparación (cuenta 0). `%TEMP%\ajilei-dist-chk`, una build de comprobación, ya no existía: Victor la había borrado antes.

---

## 12. El tope de 4 h

**Se pasó.** La sub-tanda tuvo tres partes que la ficha no podía medir de antemano:
- la lámina del aviso de saldo (el cambio de P-5), con su capturador y cinco escenas en cinco vistas;
- el banco imitado, para que el bypass, el arnés y las pruebas hablen con el mismo contrato;
- las varas largas, que no he recortado: `apu` por viewport ronda los 49 minutos y `rec` los 17.

No he recortado ninguna vara.
