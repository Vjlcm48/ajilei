# AJILEI · ECO-1 · Fase 1d — Informe: constancia, límites por minuto y la válvula apagada · v1.0

**Ficha:** `AJILEI_ECO-1_Fase1d_v1.0.md`, con el plan del STOP-1 aprobado (P-1 a P-6 y la precisión sobre la fila de avisos) y el STOP-2 aprobado (la migración tal cual y la lámina, ubicación A) · **Base:** `main` en `1ae1131` · **Fecha:** 2026-10-09
**Ejecutor:** Claude Code · **Rector:** Claude (chat) · **Decisor:** Victor
**Estado:** STOP-3, con las respuestas del rector a la §11 (P-1 y P-2), y **validada en el teléfono** por el túnel contra la base real (§10). Antes de la ceremonia de commit.

---

## 0. Resumen

- **La constancia funciona de punta a punta.** Al abrir la app con sesión y perfil, el teléfono llama a `marcar_ingreso()`. El servidor cuenta el día de Chicago y lleva la racha: el día siguiente suma uno y faltar un día la devuelve a 1. Cada 3 días seguidos paga 500 HC, con el aviso de saldo «+500 HC por tu constancia.» y el sonido de fichas. Un solo cobro por jugador y día.
- **La ficha del lobby (ubicación A)**: tres monedas pequeñas y «n/3» entre la píldora y el engranaje, siempre a la vista. La moneda del día se posa con un salto corto. El día del cobro se posa a la vez que la píldora empieza a contar. No mueve nada (O1).
- **Los avisos van en fila.** Si en el mismo arranque se recoge una mesa y se cobra la constancia, salen uno tras otro con un hueco de 250 ms, nunca a la vez, y la píldora cuenta cada subida. C5 y C6 sustituyen la fila sin que la píldora retroceda.
- **Los límites por minuto** están en las cinco funciones de dinero (sentarse 10, recargar 20, salir 30, recoger 10, marcar 6). El teléfono trata `limite` como «no contesta»: reintenta lo mismo con espera. **Un límite nunca atrapa dinero** (K7): lo prueban el guion, el banco imitado y el arnés.
- **La válvula está construida y apagada.** Encendida, sentarse y recargar dicen `tope_diario` sin efectos; la mesa en curso se juega y se paga completa. Retar y la tarjeta de recarga lo dicen con su texto.
- **La migración se aplicó y su guion dio 23/23 PASA en la base real** (§1).
- **Dos hallazgos de esta tanda, arreglados** (§5.1 y §5.2):
  - con un nombre real de 11–12 caracteres, la ficha hacía desbordar la barra en vertical;
  - el salto de la moneda se repetía al volver al lobby.
- **Varas, todas en verde** sobre el código definitivo (§7): vitest 1.473 (antes 1.437), lint 21, build correcto, `diagSAL` 102/102, `humo`, `rec`, `apu` en sus ocho viewports y REC-2 (18/18), `saldo`, `mesaia` 10/10, `revive`, `celebracion` (0 fallos) y el modo nuevo `constancia` 7/7, con su control rojo en una copia.
- **R-5 de la 1c, medido en producción:** en ajilei.io el «—» de la salida dura ~1 s (frente a ~3 s por el túnel). Queda resuelto en la práctica (§9).
- **Validada en el teléfono** (§10): seis pruebas bien, la de la válvula omitida (la cubren el guion y `constancia.7`) y la de los límites no aplica. La válvula sigue apagada.

---

## 1. STOP-2: la migración en la base real

Victor aplicó `supabase/migrations/20261009105658_eco1d_constancia_limites_valvula.sql` con `db push` y corrió `supabase/pruebas/eco1d_verificacion.sql` en el SQL Editor (consulta guardada «ECO-1d · verificación»). La migración, una vez aplicada, no se edita: su resultado va aquí.

| prueba | resultado | detalle |
|---|---|---|
| 1 · la válvula nace apagada, una sola fila | PASA | filas=1 · tope=nulo (apagada) |
| 2 · primer ingreso = día 1; otra vez = ya_marcado | PASA | 1.º=ok racha 1 día 1 cobrado 0 · 2.º=ya_marcado racha 1 cobrado 0 · constancias=0 |
| 3 · día siguiente = racha 2, sin cobro | PASA | codigo=ok · racha=2 · día=2 · cobrado=0 |
| 4 · día 3 = un cobro de 500 | PASA | codigo=ok · racha=3 · cobrado=500 · saldo 2500→3000 · otra vez=ya_marcado · constancias=1 por 500 |
| 5 · clave por jugador y día: un solo cobro | PASA | codigo=ok · racha=3 · cobrado=0 · saldo 3000→3000 · constancias=1 |
| 6 · día perdido = racha 1 | PASA | codigo=ok · racha=1 · día=1 · cobrado=0 |
| 7 · día 4 sin cobro, día 6 cobra; cada racha es suya | PASA | DOS sin fila antes=t · día 4=4/1 cobrado 0 · día 6=6/3 cobrado 500 · racha de UNO=1 |
| 8 · sin sesión; constancia_admin y sus guardas | PASA | sin sesión=sin_sesion · usuario falso=sin_usuario · día futuro=argumento_invalido · racha 0 con día=argumento_invalido · reinicio=ok |
| 9 · límite de marcar_ingreso: sin efectos, la anotación queda | PASA | 1.º=ok · 7.º=limite (racha 2) · anotados=7 · constancias=0 |
| 10 · límite de sentarse_ia: sin mesa ni cobro | PASA | 11.º=limite · mesas=0 · anotados=11 · saldo 2500→2500 |
| 11 · K7 · salir cortado: la mesa espera y se cobra entera | PASA | cortada=limite · mesa tras el corte=abierta/800 · un minuto después=ok cobrado 800 · saldo 2000→2800 · salidas=1 |
| 12 · K7 · recoger cortado: C4 la cierra y la cobra | PASA | recoger=limite · mesa=abierta · sentarse=ok anterior t (650) · saldo 2450→2600 · vieja=cerrada/reemplazada/650 |
| 13 · límite de recargar_ia: sin cobro | PASA | 21.ª=limite · recargas=0 · saldo intacto=t |
| 14 · informar_pila sin límite ni anotación | PASA | 41.º aviso=ok · pila=400 · anotados=0 |
| 15 · las cifras de limite_dinero | PASA | sentarse=10 · recargar=20 · salir=30 · recoger=10 · marcar=6 · informar=sin límite · constancia=500 cada 3 |
| 16 · apagada: no cierra nada | PASA | sentarse=ok · ganancia hoy=750 · cerrada=f · recarga=ok |
| 17 · encendida: tope_diario sin efectos, la vieja sigue | PASA | válvula=encendida (500) · sentarse=tope_diario · recargar=tope_diario · vieja=abierta · mesas=1 · saldo intacto=t · reintento del token=repetido |
| 18 · K8 · la mesa en curso cobra entera; después, tope | PASA | salir=ok cobrado 1300 · saldo 1950→3250 · sentarse después=tope_diario · ganancia hoy=750 (1.300 − 500 − 50) |
| 19 · apagada otra vez: se sienta; el rastro | PASA | tope 0=tope_invalido · apagar=apagada · apagar otra vez=sin_cambio · sentarse=ok · cambios anotados=2 |
| 20 · permisos: válvula y ayuda sólo para el Editor | PASA | marcar_ingreso sólo authenticated=t · internas o del Editor al cliente=f · las de la mesa siguen=t |
| 21 · tablas nuevas cerradas y fuera de Realtime | PASA | el cliente lee o escribe=f · en realtime=0 · con RLS=3 de 3 · políticas=0 |
| 22 · 1c · salir: un cobro, topado por el techo | PASA | techo=1250 · salir=ok cobrado 1250 · otra vez=repetido · salidas=1 |
| 23 · el libro cuadra; una mesa, un cobro; una constancia por día | PASA | billeteras descuadradas=0 · mesas sin su cobro=0 · días con dos constancias=0 |

**Antes del push**, la misma migración y el mismo guion pasaron en el banco de PGlite: 23/23, sin rastro con y sin `begin/rollback`, la migración aplicada dos veces, los roles `authenticated` y `anon` de verdad, los bloques SQL de §10 tal cual, y la medianoche de Chicago en `ganancia_ia_hoy` (una mesa cerrada a las 23:59 de ayer no cuenta; una cerrada a las 00:01 de hoy cuenta entera).

### 1.1 El guion de la 1c ya no se puede volver a correr

**Tras la 1d, el guion `eco1c_verificacion.sql` corta en su prueba 9.** Corre todo en UNA transacción, y dentro de una transacción `now()` no se mueve: las 16 veces que sienta a la misma cuenta caen en el mismo minuto, y desde la 1d la 11.ª es `limite`.

**No es una regresión.** En la base real cada llamada del teléfono es su propia transacción, con su `now()`, y ningún jugador se sienta 11 veces en un minuto. Las pruebas críticas de la 1c (un cobro por mesa, el techo, el libro cuadra) se repiten en el guion de la 1d (22 y 23), que sí está hecho para los límites: reparte las pruebas en cuatro cuentas y «pasa un minuto» envejeciendo las anotaciones de `intentos_dinero`.

Lo mismo le pasaba al recorrido de la 1c en el banco imitado (`bancoImitado.test.js`): cortaba en la 11.ª. Ese `describe` crea ahora su banco con `limites: false`, explicado en el propio archivo. Los límites tienen su recorrido propio.

---

## 2. Lo hecho

### 2.1 Archivos nuevos

| Archivo | Qué es |
|---|---|
| `supabase/migrations/20261009105658_eco1d_constancia_limites_valvula.sql` | La migración (aprobada en el STOP-2 y aplicada) |
| `supabase/pruebas/eco1d_verificacion.sql` | El guion de 23 pruebas |
| `src/lib/constanciaApi.js` | La puerta a `marcar_ingreso()`: nunca rechaza, `{ codigo: 'red' }` si no contesta |
| `src/hooks/constanciaCore.js` (+ prueba) | Puro: el día de Chicago, cuándo preguntar (`debeMarcar`), la ficha tras cada respuesta y cuándo se posa la moneda del día |
| `src/components/FichaConstancia.jsx` | La ficha del lobby (ubicación A) |
| `src/styles/constancia.css` | Su hoja, aditiva: las clases `cst-*` y las tres reglas que impiden que la barra desborde (§5.1) |
| `scripts/eco/constancia.mjs` | El modo `diagDSK constancia` (§6) |
| `docs/AJILEI_ECO-1_Reglas_v1.2.md` | El normativo; la v1.1 queda como historia |
| `docs/reportes/AJILEI_ECO-1_Fase1d_Informe_v1.0.md` | Este informe |

`laminas/eco1d/` (la lámina, su capturador y 62 capturas) **queda fuera de los commits**: Victor la borra tras el push, como la de la 1c.

### 2.2 Archivos cambiados

- **`src/App.jsx`**:
  - el aviso de saldo pasa a ser una **fila** (`filaAvisos`);
  - el arranque llama a `marcar_ingreso` detrás de `recoger_mesa_ia`, y la vuelta a primer plano pregunta si cambió el día;
  - la ficha se guarda con el uid de quien la ganó;
  - `retar` reintenta `limite` con el mismo token y renueva el token con `tope_diario`.
- **`src/hooks/avisoSaldoCore.js`** (la fila se prueba en `constanciaCore.test.js`):
  - la fila: `encolarAviso`, `sacarAviso` (el siguiente lleva el hueco de 250 ms), `sustituirFila` y `desdeAlSustituir`;
  - ids que no chocan (`nuevoIdAviso`): dos avisos del mismo milisegundo tenían el mismo `Date.now()`.
- **`src/hooks/useAvisoSaldo.js`**: el hueco (`espera`, con la cápsula oculta y la píldora en su `desde`), la sustitución desde la cifra visible y `contando`.
- **`src/components/BarraSuperior.jsx`**: la ficha (solo si la pantalla pasa `constancia`) y la cápsula, que no se pinta durante el hueco.
- **`src/screens/Lobby.jsx`**: pasa la ficha a la barra.
- **`src/hooks/mesaIACore.js`** (+ prueba):
  - `LIMITE` y `TOPE_DIARIO`;
  - **`limite` → reintentar.** Antes de la 1d un código desconocido era «rechazado», y una salida rechazada habría dejado las fichas en la mesa;
  - `LIMITE_SENTARSE` (15 s, 4 veces).
- **`src/components/GameTable.jsx`**: la tarjeta de recarga con `tope_diario` (P-3).
- **`src/screens/RetarIAS.jsx`**: las notas de `limite` y `tope_diario`.
- **`src/config/textos.es.js`**: 7 claves nuevas (§3.5).
- **`src/dev/bancoImitado.js`** (+ prueba): el contrato de la 1d en JS:
  - `marcar_ingreso`, los límites contados con su reloj, la válvula;
  - los mandos `hoy`, `constanciaAdmin`, `valvula`, `gananciaHoy`, `forzarLimite` y `envejecerIntentos`;
  - las pruebas de contrato con las cifras del guion y el espejo SQL = modelo = cliente.
- **`src/dev/billeteraFalsa.js`**: `simulacionConstancia()` para el bypass.
- **`scripts/diagDSK.mjs`, `scripts/arnes/nucleo.mjs`**: el modo `constancia` (preview; veredicto por `verde`).
- **`scripts/eco/mesaia.mjs`**: la medida `ventana60` (§4.2), informativa.
- **`scripts/testDistSinMoldes.test.js`**: `marcar_ingreso` entre las huellas obligatorias; `constanciaAdmin` y `forzarLimite` entre las prohibidas.
- **`scripts/testRec2.test.js`** (D-7):
  - su expresión admite la condición `&& !sinRecargaHoy` delante del primario;
  - es una condición MÁS, nunca menos: el primario sigue sin pintarse jamás con monto 0.
- **`docs/AJILEI_Invariantes_v1.0.md`**: INV-50, INV-51 e INV-52 nuevas; las fuentes de INV-46 a INV-49 y la fila de §4 pasan a las Reglas v1.2.
- **`.gitignore`**: `capturas-constancia/`.

Ningún protegido se abrió (`scripts/testProtegidos.test.js` en verde).

---

## 3. Cómo funciona

### 3.1 Cuándo se pregunta

- **Al arrancar**, con sesión y perfil, una vez por cuenta: la misma guarda que las salas y la recogida (`arranqueDeSesion`).
  - `marcar_ingreso` va **detrás** de `recoger_mesa_ia`. Así el servidor aplica primero la recogida y luego la constancia, y los dos avisos se encadenan solos: el segundo empieza donde acabó el primero.
  - Si la recogida no contesta, la constancia sale igual.
- **Al volver a primer plano**, solo si `debeMarcar` lo dice. Tienen que cumplirse las tres cosas:
  - el día de Chicago del reloj del teléfono no es el último que dijo el servidor (o el arranque no obtuvo ninguno);
  - no hay otra llamada en curso;
  - pasaron 60 s desde la última.
- El reloj del teléfono solo decide cuándo preguntar. Si miente, lo peor es una llamada de más, que el servidor contesta con `ya_marcado`.

### 3.2 El cobro y la ficha

- **Con `cobrado > 0`:** la billetera toma el saldo devuelto (sin relectura) y el aviso entra en la fila.
- **Sin cobro, el saldo no se toca.** La billetera ya tiene la cifra, y una salida que se estuviera cobrando no pierde su «—».
- **La ficha:**
  - `ok` posa la moneda del día;
  - `ya_marcado` no la hace saltar otra vez;
  - `red` y `limite` la dejan como estaba;
  - el día del cobro, la moneda y la cifra «n/3» esperan a que el aviso de constancia empiece a contar.

### 3.3 La fila de avisos

| Situación | Qué pasa |
|---|---|
| Recogida y constancia en el mismo arranque | En fila: la recogida primero, el hueco de 250 ms con la píldora quieta, y la constancia desde la cifra donde acabó la otra |
| C5 (sentarse cierra una vieja) y C6 (otro dispositivo) | **Sustituyen** la fila: van atadas a un cambio de pantalla. Arrancan desde la cifra que se ve: la píldora no retrocede ni pierde lo ya cobrado |
| Entrar en la mesa | Vacía la fila, como antes vaciaba el aviso |

### 3.4 `limite` y `tope_diario`, pantalla por pantalla

| Pantalla | `limite` | `tope_diario` |
|---|---|---|
| Retar | «Sentando…» sigue; se pide otra vez con el mismo token cada 15 s, hasta 4 veces. Si el jugador se va de Retar, se deja. Si no pasa, «Demasiados intentos seguidos. Espera un momento y vuelve a intentarlo.» y el token se conserva | «Llegaste al tope de hoy contra las IAS. Vuelve mañana o juega contra jugadores.»; el token se renueva |
| Mesa (avisos, recarga, salida) | «No contesta»: la cola reintenta lo mismo con 1, 2, 4, 8 y 15 s. La tarjeta de recarga conserva su tope de 10 s y «Reintentar»; la salida, su «—» | Solo en la recarga: el texto propio; sin montos ni primario; en la blanda, «Seguir sin recargar» o «Salir con mis fichas»; en la forzosa, solo «Salir con mis fichas». La mesa sigue y se paga completa |
| Arranque | No se ve nada; se pregunta otra vez más tarde | — |
| Lobby | — | Nada: la nota sale en Retar |

### 3.5 Los textos nuevos (`t()`, `textos.es.js`)

`aviso.saldo.constancia` («+{hc} HC por tu constancia.») · `lob.constancia.aria` («Constancia: día {d} de 3») · `ia.retar.sentarse.limite` · `ia.retar.sentarse.tope` · `ia.recarga.error.tope_diario` · `ia.recarga.error.tope_diario.forzosa` · `ia.recarga.seguir`.

La ficha estaba en la lámina como `constancia.ficha.aria`. La prueba de prefijos de IDI-0 la rechazó y pasó a `lob.`, que es donde vive.

---

## 4. Los límites

### 4.1 Por qué un límite no atrapa a nadie

`contar_intento_dinero` anota también el intento rechazado. Por eso un límite solo puede bloquear a un cliente que reintente más deprisa que el tope.

El cliente de la casa, en régimen, reintenta cada 15 s, que son 4 por minuto, por debajo de todos los topes. Sentarse reintenta cada 15 s. La cola de la mesa, con 1, 2, 4, 8 y 15 s, hace como mucho 7 llamadas en el primer minuto. Un cliente legítimo pasa siempre en unos 75 s como mucho.

### 4.2 El máximo medido (`mesaia`, ventana de 60 s)

Lo prometido en el plan del STOP-1: `mesaia` cuenta ahora, en cada contexto, el máximo de llamadas de cada función en cualquier ventana de 60 s. Es informativo (`ventana60`): no tiñe el veredicto, pero marca lo que pase de la mitad de su tope.

Corrida de la tanda de varas (los nueve puntos, con recargas, reintentos forzados, cortes de red y doble toque):

| Función | Máximo en 60 s | Tope | ¿Más de la mitad? |
|---|---|---|---|
| `sentarse_ia` | 1 | 10 | no |
| `recargar_ia` | 3 | 20 | no |
| `salir_ia` | 1 | 30 | no |
| `recoger_mesa_ia` | 2 | 10 | no |
| `marcar_ingreso` | 2 | 6 | no |
| `informar_pila` | 7 | sin límite (P-1) | — |

Ninguna pasa de la mitad. El arnés juega más deprisa que una persona, así que estas cifras son cota alta de lo legítimo. `informar_pila` llega a 7 por minuto en una mesa del arnés: lejos de los 120 que se habrían propuesto si llevara límite.

---

## 5. La lámina y la ficha

Victor eligió la **ubicación A** de `laminas/eco1d/` con sus textos tal cual; lo de B se descarta.

La ficha es la de la lámina: misma hoja (pasada a `constancia.css`), mismas medidas en unidades del lobby y el mismo salto (0,6 → 1,15 → 1 en 420 ms). Con movimiento reducido no hay salto.

Mientras la constancia no se sabe, la ficha reserva su caja con `visibility: hidden` (O1). El engranaje lleva `margin-left: auto`, así que la ficha no mueve nada: la lámina lo midió en las 62 capturas.

### 5.1 Hallazgo: con un nombre real, la barra desbordaba en vertical

La lámina midió la barra con el único nombre del bypass, «DevLocal» (8 caracteres). La primera corrida de `humo` salió **roja en `lob` a 360×640**: el arnés entra en `preview` como «Jugador_CAP» (11 caracteres).

**Lo que pasaba**, medido en una copia con cinco nombres y cinco viewports:
- Con 11–12 caracteres («Jugador_CAP», «ticotest2022», la cuenta del Motorola), la ficha llevaba la barra a **344 px en un hueco de 335** (360×640). También desbordaba a 390 y a 412 en vertical.
- La `.lob-top` es un elemento de rejilla con `min-width: auto` y crecía con su contenido. El lobby se ensanchaba, el botón de jugar se descentraba **4,7 px** (`lob.3b`, tope 2) y la hoja ⚙ se separaba **9,4 px** del engranaje (`lob.6`, tope 2).
- **Ya pasaba antes de la 1d** con un nombre de 15 caracteres anchos: 15 «W» desbordan a 360 incluso sin la ficha.

**El arreglo**, aditivo en `constancia.css` (tres reglas nuevas; ninguna regla de `lobby.css` se reescribe):
- la barra mide siempre su hueco (`min-width: 0` en `.lob-top` y en el botón de perfil);
- lo que cede, solo cuando no cabe, es el **nombre**, con «…»;
- la ficha pierde su relleno lateral (1 u a cada lado), porque el hueco de la barra ya la separa.

La ficha, la píldora y el engranaje no ceden nunca. Medido después:

| Viewport | «DevLocal» | «ticotest2022» | «Jugador_CAP» | 15 caracteres |
|---|---|---|---|---|
| 360×640 · 390×844 · 412×915 | entero | **entero** | recortado ~2 px («…») | recortado |
| 640×360 · 915×412 | entero | entero | entero | entero |

En los cinco viewports y con los cinco nombres, la barra mide su hueco y el engranaje no se mueve. **Pregunta al rector P-1 (§11): se queda así.**

### 5.2 Hallazgo: el salto de la moneda se repetía al volver al lobby

Lo vi al repasar el código antes de las varas. El lobby se desmonta al ir a Retar y se vuelve a montar al volver, y la clase del salto corría otra vez.

Ahora cada salto que termina se anota (en esa carga de página) y no se repite. El punto 2 del modo `constancia` va a Retar, vuelve y comprueba que no queda ninguna moneda saltando.

---

## 6. El modo `constancia`

`node scripts/diagDSK.mjs constancia` corre contra `vite preview` con la sesión simulada de CAP; contesta el banco imitado de cada contexto.

- La racha, el límite y la válvula se siembran en ESE banco, con los mismos mandos que el guion usa en el SQL Editor. No hay mando de URL (P-5).
- Un muestreo **por cuadro** de los avisos, la píldora y la ficha (`window.__muestras`, desde que nace la página) permite decir «nunca a la vez» y «nunca baja» sin depender de cuándo mira el arnés.

| Punto | Qué mide |
|---|---|
| 1 | Primer arranque: la ficha en el día 1, sin cobro ni aviso |
| 2 | Racha en 2 y el último día ayer: el aviso «+500 HC por tu constancia.» con `data-monto` 500, la píldora 5.000 → 5.500 sin bajar, UNA línea `constancia`. La ficha dice 2 cuando aparece el aviso y 3 después |
| 3 | Segundo arranque el mismo día: `ok,ya_marcado`, sin aviso ni cobro |
| 4 | Día perdido: la ficha en el día 1 |
| 5 | Mesa abierta, la app se cierra, «mañana» con la racha en 2: «Volvieron … HC de tu partida anterior.» y luego «+500 HC por tu constancia.», nunca dos a la vez, con hueco entre ellos. La píldora sube de la cifra de antes a esa más lo recogido más 500, sin bajar nunca |
| 6 | `limite` forzado al sentarse (`limite,ok` con el mismo token, ≥ 14 s de espera, una entrada) y dos al salir (`limite,limite,ok` con el mismo seq, una salida, ninguna mesa abierta, la píldora en la cifra del banco) |
| 7 | Una mesa ganada hoy (+750) y la válvula encendida a mitad de otra (tope 500): la recarga dice su texto, sin montos ni primario, con «Seguir sin recargar» y «Salir con mis fichas», y no cobra. Salir cobra las fichas enteras. Retar enseña la nota y no abre mesa; apagada, se sienta |
| consola | Sin errores |

**Un rojo del instrumento en la primera corrida (punto 5).** La espera «no hay `.avs`» se daba por buena en el hueco de 250 ms **entre** los dos avisos, y el arnés leía la píldora a mitad del segundo, a 4.950 en vez de 5.450. Ahora espera a que hayan pasado los avisos esperados y lleve 800 ms sin ninguno (`esperarFinFila`). El producto ya hacía lo correcto: la traza cuadro a cuadro lo enseñó.

---

## 7. Varas

Todas sobre el código definitivo (las dos últimas tandas, después de los arreglos de §5.1 y §5.2).

| Vara | Resultado |
|---|---|
| vitest | **1.473** en verde (línea base 1.437): +36 de la 1d en el banco imitado, `constanciaCore`, `mesaIACore` y las invariantes |
| lint | **21** (20 errores y 1 aviso), la línea base; ningún error nuevo |
| build | correcto (el aviso de trozos de más de 500 kB es el de siempre) |
| `diagSAL sal` | **102/102** |
| `humo` | verde (`gate`, `lob`, `retar`, aislamiento). La primera corrida dio `lob` rojo: el hallazgo de §5.1 |
| `rec` | verde (p1–p7 y anillo), 15 min |
| `apu` | las ocho celdas en verde, una por una (360×640, 640×360, 844×390, 1024×768, 1280×720, 1366×768, 1920×937), y `apu rec2` 18/18 |
| `saldo` | verde, 6/6 y consola |
| `mesaia` | verde, 10/10 más `ventana60` (§4.2) |
| `revive` | verde |
| `celebracion` | 0 fallos, 0 conocidos, control verde |
| `constancia` (nuevo) | **verde, 7/7 y consola**, dos veces (la segunda con la comprobación del salto, §5.2) |
| Guardia sobre `dist/` | verde (14/14): `marcar_ingreso` está; `constanciaAdmin`, `forzarLimite` y las huellas de antes, no |
| Registro de invariantes | verde (65/65) con INV-50, INV-51 e INV-52 |
| Protegidos | verde (8/8): ninguno abierto |

### 7.1 El control rojo (en una copia)

En una copia del árbol de trabajo (`scratchpad\eco1d\copiaRojo`, con la unión a `node_modules` ya quitada) se volvió a la regla de antes de la 1d: un `limite` en la cola de la mesa es «rechazado».

- **vitest:** sale roja la prueba de K7 de `mesaIACore` (1 de 26).
- **`diagDSK constancia`** (en el 4183): sale roja **solo** `constancia.6`, y por la razón buscada:
  - la salida recibió un `limite` y no se volvió a mandar;
  - **0 salidas** en el libro, y la píldora se quedó en **4.500**, con las fichas atrapadas en la mesa hasta una recogida;
  - los otros seis puntos y la consola siguieron en verde.

Es exactamente el caso que K7 prohíbe, y el arnés lo ve.

---

## 8. Riesgos y hallazgos

- **R-1 · El guion de la 1c ya no se puede volver a correr** (§1.1). Anotado en la cabecera del guion de la 1d y aquí.
- **R-2 · El «no» de la recarga por la válvula se queda en la tarjeta durante esa mesa** (así lo dejó el rector: P-2, §11). `recargaFallo` solo se borra al confirmar una recarga nueva. Por eso la siguiente tarjeta de la misma mesa ya nace diciendo que hoy no se puede recargar, sin preguntar.
  - Para la válvula es lo correcto dentro del día. Si Victor la apagara a mitad de esa mesa, la tarjeta lo seguiría diciendo hasta la mesa siguiente.
  - Pasaba igual antes con `saldo_insuficiente`. No lo toco.
- **R-3 · Un minuto de reintentos al sentarse** solo puede verse si el límite salta, y con 10 por minuto no salta jugando.
- **R-4 · `contar_intento_dinero` sin perfil responde «no cabe».** En `marcar_ingreso` eso sale como `limite`. Es inofensivo: el cliente solo llama con perfil. Anotado en el plan del STOP-1.
- **R-5 · La barra en vertical** (§5.1): arreglada; el rector dejó el arreglo como está (P-1, §11).
- **R-6 · El salto repetido** (§5.2): arreglado y vigilado.

---

## 9. R-5 de la 1c, medido en producción

En ajilei.io, al salir de una mesa contra las IAS, la píldora enseña el «—» **~1 s** antes de la cifra, frente a los ~3 s medidos por el túnel en la 1c. La salida sigue esperando a los avisos de la cola, pero con la latencia de producción esa espera no se nota.

**Queda resuelto en la práctica; no se toca.**

---

## 10. Pruebas en el teléfono para Victor

Con la build en el túnel de siempre, contra la base real. Cada bloque SQL se pega **entero** en el SQL Editor; buscan la cuenta por su nombre de usuario.

**Resultado (Victor, 2026-10-09):** la 1d queda validada en el teléfono. Victor cerró después el preview y el túnel.

| Prueba | Resultado |
|---|---|
| 1 · la ficha al abrir | **bien** |
| 2 · cerrar y abrir el mismo día | **bien** |
| 3 · el día 3 | **bien.** +500 con aviso y sonido, la moneda se posa con la cuenta, «3/3» |
| 4 · un día perdido | **bien.** «1/3», sin cobro |
| 5 · el Motorola | **bien.** Ficha propia; «ticotest2022» entero en la barra |
| 6 · los dos avisos en fila (Motorola, `ticotest2022`) | **bien.** Primero la recogida, luego la constancia, nunca a la vez |
| 7 · la válvula | **omitida.** `ganancia_ia_hoy` de `test1976` daba −400 (las pruebas de la 1c del mismo día), así que el tope no se podía alcanzar con una mano. La cubren el guion (16 a 19, en la base real) y `constancia.7`. **La válvula sigue apagada** |
| 8 · los límites | **no aplica**: los cubren el guion y el arnés |

1. **S25 (`test1976`). Abre la app.**
   - En el inicio, entre el saldo y el engranaje, hay **tres monedas pequeñas y «1/3»** (o el día que toque), con la primera moneda dorada. No sale ningún aviso de cobro.
2. **Ciérrala del todo y ábrela otra vez.**
   - Nada cambia: sigue el mismo día, no cobra y la moneda no vuelve a saltar.
3. **Simula el día 3.** En el SQL Editor:
   ```sql
   select * from public.constancia_admin('test1976', 2, public.dia_chicago(now()) - 1);
   ```
   Cierra la app del todo y ábrela.
   - Sale junto al saldo **«+500 HC por tu constancia.»** con el sonido de fichas.
   - El saldo **sube 500** contando.
   - La **tercera moneda se posa** (un saltito) a la vez que el saldo empieza a subir, y la ficha dice **«3/3»**.
4. **Simula un día perdido.** En el SQL Editor:
   ```sql
   select * from public.constancia_admin('test1976', 2, public.dia_chicago(now()) - 2);
   ```
   Cierra y abre la app.
   - La ficha vuelve a **«1/3»**, con una sola moneda dorada, y no cobra.
5. **Motorola (`ticotest2022`). Abre la app.**
   - Su ficha es **la suya**: no se mueve por nada de lo que hiciste en el S25.
6. **Opcional · los dos avisos en fila, en el Motorola (`ticotest2022`).**
   - Siéntate contra las IAS, juega un par de manos y **cierra la app del todo** a mitad de partida.
   - En el SQL Editor:
     ```sql
     select * from public.constancia_admin('ticotest2022', 2, public.dia_chicago(now()) - 1);
     ```
   - Abre la app. Primero sale **«Volvieron … HC de tu partida anterior.»** y el saldo sube; cuando ese se va, un instante después, **«+500 HC por tu constancia.»** y el saldo sube otra vez. **Nunca los dos a la vez.**
   - (Va en el Motorola porque la clave de la constancia es por jugador y día: el S25 ya cobró hoy en la prueba 3, y otra simulación hoy no volvería a pagar.)
7. **Opcional · la válvula, en el S25.**
   - **Enciéndela** con un tope justo por encima de lo que ya llevas ganado hoy contra las IAS:
     ```sql
     select * from public.valvula_ia(greatest((select public.ganancia_ia_hoy(p.id) from public.profiles p where p.username = 'test1976'), 0) + 1);
     ```
   - Siéntate contra las IAS, **gana algo** (aunque sea una mano) y sal con la ✕. Al salir te pagan todas tus fichas.
   - Intenta sentarte otra vez: Retar dice **«Llegaste al tope de hoy contra las IAS. Vuelve mañana o juega contra jugadores.»** y no se abre la mesa.
   - Si en esa mesa pides una recarga después de ganar, la tarjeta dice que hoy no se puede recargar, con «Seguir sin recargar» y «Salir con mis fichas».
   - **Apágala**, y comprueba que quedó apagada (la segunda línea debe decir vacío/`NULL`):
     ```sql
     select * from public.valvula_ia(null);
     select tope_diario_ia from public.ajustes_economia;
     ```
   - Siéntate otra vez: se abre la mesa. **La válvula debe quedar apagada al terminar.**
8. **Los límites** no se prueban a mano: los cubren el guion (9 a 15) y el arnés (`constancia`, punto 6).

---

## 11. Preguntas al rector, y sus respuestas

- **P-1 · La barra en vertical (§5.1).** Para que la barra no desborde, lo que cede hoy es el **nombre**, con «…», solo cuando no cabe. «ticotest2022» cabe entero en los tres teléfonos verticales; «Jugador_CAP» pierde ~2 px y un nombre de 15 caracteres, más.
  - **Alternativa:** que en vertical, por debajo de ~420 px de ancho, la ficha enseñe solo las tres monedas, sin «n/3». Ahorra ~20 px y deja entero cualquier nombre de hasta ~14 caracteres. Pero cambia los textos de A, que Victor aprobó «tal cual».
  - Recomiendo dejar lo hecho. Es la única de las dos que también arregla el desborde que ya existía con nombres de 15 caracteres anchos.
  - **Respuesta: se queda como está.** Cede el nombre con «…», solo cuando no cabe. Los textos de A no cambian.
- **P-2 · El «no» de la válvula en la tarjeta (R-2).** Se queda durante esa mesa. Lo dejo así salvo que el rector prefiera que cada tarjeta nueva vuelva a preguntar.
  - **Respuesta: se queda como está.** El «no» de la válvula dura esa mesa.

---

## 12. Cierre de terreno

- **Puertos del 4170 al 5599:** solo escucha el svchost del 5040, que no es nuestro.
- **Procesos node:** ninguno vivo. Los servidores de desarrollo que abrí a mano (5174 para la lámina y 5191 en la copia) los paré yo.
- **Protegidos:** ninguno abierto; `scripts/testProtegidos.test.js` en verde.
- **git status:**
  - lo de esta tanda (§2), todo sin añadir;
  - `laminas/eco1d/`, que no entra en los commits;
  - los 5 residuos de MOT-1, sin tocar.
  - `capturas-constancia/` está ignorada.
- **Para borrar (Victor):**
  - `laminas/eco1d/` tras el push;
  - en el scratchpad de la sesión, la carpeta `eco1d` entera: la copia `copiaRojo` (sin uniones), el banco de PGlite, los registros de las varas y las sondas de la barra.
  - El banco de PGlite de la 1a sigue en el scratchpad de aquella sesión (`c7885e3d…\scratchpad\eco1a`); lo reutilicé leyendo su `node_modules`, sin copiarlo.

---

## 13. El tope de 4 h

**Se llegó al tope, sin pasarlo: unas 3 h 45 min** en total, contando los tres STOP y el tiempo de reloj de las varas, que corrieron en segundo plano mientras escribía. Las 13 varas, las cinco tandas y el control rojo están completos.

Lo que la ficha no podía medir de antemano:
- el hallazgo de la barra (§5.1), que pidió medir cinco nombres en cinco viewports;
- repetir `humo`, `constancia` y `rec` sobre el código definitivo.

No he recortado ninguna vara.
