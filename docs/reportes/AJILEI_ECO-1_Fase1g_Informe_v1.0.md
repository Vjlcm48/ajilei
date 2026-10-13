# AJILEI · ECO-1 · Fase 1g — Informe: el video de recompensa simulado · v1.0

**Ficha:** `AJILEI_ECO-1_Fase1g_v1.0.md`, con el plan del STOP-1 aprobado (respuestas P-1 a P-4), el STOP-2 aprobado y el cambio «el premio lo dice el servidor» · **Base:** `main` en `c95f05c` · **Fecha:** 2026-10-13
**Ejecutor:** Claude Code · **Rector:** Claude (chat) · **Decisor:** Victor
**Estado:** STOP-3 revisado por el rector, con sus respuestas a la §12, y **validada por Victor en el teléfono** contra la base real (§10.1). Antes de la ceremonia de commit.

---

## 0. Resumen

- **El video funciona de punta a punta.** Se pide en Retar o en el «+» dorado, dura 40 s a la vista, el servidor paga 500 HC contra un boleto y sale la celebración. Hasta 8 por día de Chicago.
- **El teléfono nunca decide cuánto cobra.** El saldo que se ve es el que devuelve el cobro. El premio («+500 HC») y el tope («8») los dice el servidor; el teléfono no los lleva escritos (§3.6).
- **La migración está aplicada** (Victor, `db push`) y el guion corrido en el SQL Editor, contra la base real: **21 de 21 en PASA** (§1).
- **Varas, todas en verde** (§7): vitest 1.564 (antes 1.499), lint 21, build correcto, `npm run guiones`, `diagSAL` 102/102, `humo`, `saldo`, `mesaia` 10/10 más `ventana60`, `revive`, `constancia` 7/7, `celebracion` con 0 fallos, el modo nuevo `video`, la guardia de `dist/`, el registro y los protegidos.
- **El modo nuevo `diagDSK video`** (§6): los 9 puntos de la ficha más uno auxiliar, en verde. Los videos duran 40 s de verdad: 40,5 s medidos en la build, con el cobro incluido.
- **Control rojo, en una copia** (§7.1): sin la anulación de S1 cae el punto 7 y solo ese; sin la idempotencia del cobro cae el punto 6 y solo ese.
- **Cuatro decisiones mías que el rector debe mirar** (§5): el contador al lado del botón en pantallas anchas y bajas; la ✕ del cobro con confirmación; el contador se pregunta al abrir, no al arrancar; y una prueba de textos que hubo que ampliar.
- **Tres hallazgos** (§8): la barra de Retar y de las salas se sale de la pantalla con un nombre de 15 letras (ya estaba así); el paquete principal crece 8,4 kB comprimido; y `diagDSK retar` salió rojo con el contador hasta que lo recoloqué.
- **Lo que el arnés no pudo medir,** la pausa con la pantalla bloqueada, la validó Victor en el teléfono: bien (§10.1, prueba 3).
- **Validada en el teléfono** (§10.1): seis pruebas bien y una, la 5, que no aplica con el saldo de la cuenta de prueba.
- **iOS: pendiente** para la próxima sesión con el iPhone y el iPad (INV-41, §10).
- **Con esta sub-tanda ECO-1 queda cerrada**, a falta de los commits.

---

## 1. STOP-2: la migración en la base real

- **Migración:** `supabase/migrations/20261012230807_eco1g_video.sql`. Revisada línea por línea por el rector y aprobada tal cual. Aplicada por Victor con `db push` el 2026-10-13. **No se edita.**
- **Guion:** `supabase/pruebas/eco1g_verificacion.sql`, 21 filas. Victor lo corrió en el SQL Editor; consulta guardada «ECO-1g · verificación».
- **El resultado, en la base real:** 21 de 21 en PASA. La tabla va debajo, tal como la devolvió el SQL Editor (llegó con la revisión del STOP-3).
- **Antes del push**, en el corredor (`npm run guiones`, Postgres 18.3 en memoria): 21 de 21 PASA, con y sin `begin/rollback`, sin rastro.

**La corrida real** (SQL Editor, 2026-10-13):

| Prueba | Resultado | Detalle |
|---|---|---|
| 1 · las cifras del video y los topes por minuto | PASA | premio=500 · tope=8 · mínimo=35 s · vida=00:10:00 · pedir=10/min · cobrar=20/min · mi_video=sin límite · los cinco de la 1d=10/20/30/10/6 |
| 2 · mi_video: quedan 8 de 8, el reloj y el reinicio; no anota | PASA | codigo=ok · quedan 8 de 8 · reloj del servidor=t · reinicio a las 00:00:00 de Chicago, en 11:46:00 · anotados=0 |
| 3 · pedir_boleto: un boleto vivo de 10 min, sin cobro | PASA | codigo=ok · con boleto=t · vive 00:10:00 · mínimo=35 s · quedan=8 · vivos=1 · movimientos=0 · saldo intacto=t |
| 4 · antes de 35 s: demasiado_pronto, y dice cuánto falta | PASA | codigo=demasiado_pronto · faltan 35 s · cobrado=0 · saldo 2500→2500 · movimientos=0 · el boleto sigue vivo=t |
| 5 · tras 35 s: cobra 500, una línea video, quedan 7 | PASA | codigo=ok · cobrado=500 · saldo 2500→3000 · quedan=7 (mi_video dice 7) · líneas video=1 por 500 · con su clave=t |
| 6 · S3 · el mismo boleto otra vez: ya_cobrado, un movimiento | PASA | 2.ª=ya_cobrado cobrado 0 · 3.ª=ya_cobrado · saldo ya subido=t · quedan=7 · movimientos del boleto=1 |
| 7 · S1 · un solo boleto vivo: el viejo, anulado y sin cobro | PASA | vivos tras pedir dos=1 · el viejo anulado=t · cobrar el viejo=anulado (saldo intacto=t, movimientos=0) · cobrar el nuevo=ok +500 · quedan=6 |
| 8 · a los 10 min: vencido, sin cobro; un cobrado sigue ya_cobrado | PASA | sin cobrar a los 11 min=vencido · saldo intacto=t · movimientos=0 · quedan=6 · el cobrado, a los 11 min=ya_cobrado |
| 9 · G2 · pedir sin cobrar no gasta ninguno de los 8 | PASA | quedan tras el 1.º=8 · tras el 2.º=8 · anulados=1 · vivos=1 · cobrados=0 · movimientos=0 · saldo intacto=t |
| 10 · G1 · ocho al día: el noveno pedido es tope_dia | PASA | 7.º=ok quedan 1 · 8.º=ok quedan 0 · 9.º pedido=tope_dia sin boleto=t · boletos=8 (cobrados 8, vivos 0) · líneas video=8 por 4000 · saldo 2500→6500 |
| 11 · la guarda: con 8 cobrados, el cobro dice tope_dia y no paga | PASA | codigo=tope_dia · cobrado=0 · saldo intacto=t · quedan=0 · líneas video=7 · el boleto sigue vivo=t |
| 12 · al día siguiente de Chicago: 8 de 8 otra vez | PASA | mi_video quedan=8 · pedir=ok con boleto=t |
| 13 · G6 · el reinicio, también los dos días del cambio de hora | PASA | otoño=1 day 01:00:00 · primavera=23:00:00 · un día corriente=1 day |
| 14 · límite de pedir_boleto: sin boleto, el vivo intacto, la anotación queda | PASA | 10.º=ok · 11.º=limite sin boleto=t · boletos=10 (anulados 9) · el vivo sigue=t · anotados=11 |
| 15 · K7 · cobro cortado: el boleto espera y se cobra entero | PASA | cortado=limite (saldo intacto=t) · el boleto tras el corte, vivo=t · anotados=21 · un minuto después=ok cobrado 500 · saldo 2500→3000 · movimientos=1 |
| 16 · ajeno e inexistente: sin cobro, y el boleto del otro, intacto | PASA | el de otro=ajeno · uno inventado=inexistente · nulo=inexistente · saldo intacto=t · el boleto del otro sigue vivo=t · movimientos=0 |
| 17 · sin sesión: las tres dicen sin_sesion, sin efectos | PASA | mi_video=sin_sesion · pedir=sin_sesion · cobrar=sin_sesion · boletos nuevos=0 · anotaciones nuevas=0 |
| 18 · permisos: mi_video, pedir_boleto y cobrar_boleto, y nada más | PASA | las tres para authenticated=t · alguna para anon=f · alguna interna al cliente=f |
| 19 · boletos_video cerrada, fuera de Realtime, un vivo por cuenta | PASA | el cliente lee o escribe=f · en realtime=0 · con RLS=t · políticas=0 · índices=2 de 2 · cuentas con dos vivos=0 |
| 20 · el libro cuadra; cada boleto cobrado tiene su movimiento | PASA | billeteras descuadradas=0 · boletos cobrados sin su línea=0 · líneas video sin boleto=0 |
| 21 · el premio lo dice el servidor: mi_video y cobrar_boleto | PASA | mi_video=500 · cobro ok=500 · demasiado pronto=500 · ya cobrado=500 (cobrado 0) · la cifra del SQL=500 |

**Lo que cambió entre el STOP-2 y el push** (pedido por el rector): `mi_video` y `cobrar_boleto` devuelven `premio` (500), siempre, también con `ya_cobrado`. El guion pasó de 20 a 21 filas.

**Las diferencias con la ficha §2.1, aprobadas en el STOP-2:**
- «Ya cobrado» se mira antes que anulado y vencido: el reintento de un cobro que sí entró recibe `ya_cobrado` aunque hayan pasado los 10 minutos.
- `tope_dia` en el cobro es una guarda: con un solo boleto vivo por cuenta no se alcanza por las funciones.
- Códigos de más: `sin_billetera`, `inexistente`, `error_libro`. Campos de más: `faltan_s`, `vence_en` (respuesta P-3) y `premio`.
- `video_reinicio(p_ts)` lleva parámetro para poder probar los dos días del cambio de hora.

**Pendiente para después del lanzamiento** (pedido por el rector): limpiar los boletos de más de 30 días. La tabla `boletos_video` crece con cada video pedido y nadie la purga. Anotado en las Reglas v1.3 §11 y en el registro §6.

**Corrección a la ficha** (respuesta P-1 del rector): la ficha §2.3 pedía que el modo `video` corriera contra `vite preview` y, a la vez, con el video acortado por el mando de desarrollo. Las dos cosas no caben: el mando solo existe en desarrollo y la guardia de `dist/` lo prohíbe en la build. Fue un error del rector al escribirla. Se hizo como él decidió: videos de 40 s reales en la build, y un punto auxiliar en desarrollo para los mandos.

---

## 2. Lo hecho

### 2.1 Archivos nuevos

| Archivo | Qué es |
|---|---|
| `supabase/migrations/20261012230807_eco1g_video.sql` | La tabla de boletos y las tres funciones del cliente |
| `supabase/pruebas/eco1g_verificacion.sql` | El guion, 21 filas |
| `src/lib/videoApi.js` | La puerta a `mi_video`, `pedir_boleto` y `cobrar_boleto`. Nunca rechaza: la red caída es `red` |
| `src/hooks/videoCore.js` + prueba | Las reglas puras: el tiempo visible, el contador, qué se hace con cada código |
| `src/lib/reproductor.js` | **La costura:** `empezar() → { estado }` con sus tres finales |
| `src/lib/controlVideo.js` + prueba | El canal: pide el boleto, deja correr el video, cobra y reintenta |
| `src/hooks/useVideo.js` | El contexto que usan la barra y Retar |
| `src/components/MarcoVideo.jsx` | Monta las capas una vez y las deja al alcance de las pantallas con barra |
| `src/components/CapaVideo.jsx` | Lo de dentro: consejos, barra, ✕, confirmación y pausa |
| `src/components/HojaMonedas.jsx` | La hoja «Conseguir monedas» |
| `src/components/CelebracionVideo.jsx` | La celebración sobria |
| `src/components/SinVideo.jsx` | «Ahora no hay videos disponibles» |
| `src/components/GuardandoVideo.jsx` | «Guardando tu premio…» (respuesta P-2) |
| `src/components/IconosVideo.jsx` | Los tres iconos |
| `src/styles/video.css` | La hoja de la lámina, sin la lluvia ni la mesa |
| `scripts/eco/video.mjs` | El modo `diagDSK video` |
| `docs/AJILEI_ECO-1_Reglas_v1.3.md` | El normativo, con la §11 del video e INV-53 en la §5 |
| Este informe | |

### 2.2 Archivos cambiados

| Archivo | Qué cambia |
|---|---|
| `src/App.jsx` | Crea el canal del video, le presta la billetera, pospone la constancia mientras hay un video y envuelve las seis pantallas con barra |
| `src/components/BarraSuperior.jsx` | El «+» abre la hoja; la píldora enseña la cifra de la celebración |
| `src/screens/RetarIAS.jsx` | El botón del bloque de saldo pide el video y lleva el contador debajo |
| `src/components/PantallaChips.jsx`, `Lobby.jsx`, `SalaEspera.jsx`, `SalaOpciones.jsx`, `PartidaPvP.jsx` | Se quitan los cinco manejadores de «Pronto» del «+» |
| `src/config/textos.es.js` | 33 claves `video.*`; se retira `ia.retar.saldo.cta` |
| `src/config/textos.test.js` | El prefijo `video.` en la puerta; dos pares declarados (§5.4) |
| `src/config/ajileiConfig.js` | `video.duracionMs = 40000` |
| `src/dev/bancoImitado.js` + prueba | Las tres funciones del video, con el mismo contrato y las cifras del guion |
| `src/dev/billeteraFalsa.js`, `src/dev/siembraAPU.js` | Los mandos `?apu=video:<ms>`, `sin` y `cierra` |
| `scripts/diagDSK.mjs`, `scripts/arnes/nucleo.mjs` | El modo `video`; `retar.4` recableado |
| `scripts/testDistSinMoldes.test.js` | Tres huellas prohibidas y tres obligatorias más |
| `scripts/eco/guionesCore.mjs` + prueba | El guion de la 1g, vigente |
| `scripts/testInvariantes.test.js`, `docs/AJILEI_Invariantes_v1.0.md` | El registro (§11) |
| `.gitignore` | `capturas-video/` |

**Ningún protegido abierto.** `gameTable.css`, `opponentPanel.css` y los cuatro de motor y asientos conservan su huella (`testProtegidos`, en verde). Los óvalos no se tocaron. El CSS es solo aditivo: una hoja nueva, ninguna regla existente cambiada.

---

## 3. Cómo funciona

### 3.1 El recorrido

1. El jugador toca «Ver un video».
2. El teléfono pide un boleto (`pedir_boleto`). La capa no se abre hasta tenerlo.
3. Corre el video: 40 s **a la vista**.
4. Al terminar, el teléfono cobra el boleto (`cobrar_boleto`).
5. La billetera toma el saldo que devuelve el cobro, sin releer, y sale la celebración.

### 3.2 Dónde vive cada pieza

- **El canal** (`controlVideo.js`) no es un componente: se crea una vez en `App`, como el canal de la mesa. Así `App` no se repinta con el video y la regla entera se prueba sin navegador (22 pruebas).
- **El marco** (`MarcoVideo.jsx`) envuelve cada pantalla con barra. `App` es una cascada de `return`; como el marco tiene la misma forma en todas, no se desmonta al cambiar de pantalla.
- **La mesa no se envuelve:** en la mesa no hay video (G3).
- **La costura** (`reproductor.js`): lo de dentro es `CapaVideo`. El día del anuncio real cambia solo eso.

### 3.3 Qué hace el teléfono con cada respuesta

**Al pedir:**

| Código | Lo que se ve |
|---|---|
| `ok` | Se abre la capa |
| `tope_dia` | No se abre. Fila y botón apagados con «Vuelven en…» |
| `limite`, sin red, `sin_sesion` | El mensaje «Ahora no hay videos disponibles» y «Volver». Nada cambia |

**Al cobrar:**

| Código | Lo que se ve |
|---|---|
| `ok` | El saldo nuevo y la celebración |
| `ya_cobrado` | Lo mismo: el saldo ya viene subido. Se celebra una vez |
| `demasiado_pronto` | Espera los segundos que dice el servidor y reintenta |
| `limite`, sin red | «Guardando tu premio…» y reintenta el mismo boleto (§3.5) |
| `anulado`, `vencido`, `ajeno` | El mensaje «Ahora no hay videos disponibles», sin cobro |
| `tope_dia` | Se cierra sin celebrar |

### 3.4 El tiempo visible

- Un tic cada 100 ms suma tiempo solo si el video corre y la pestaña está a la vista (`useCongelado`).
- Cada suma se topa a 250 ms: el primer tic al volver no regala lo que pasó a oscuras.
- **Pantalla bloqueada o pestaña oculta:** queda «En pausa» y solo sigue con un toque.
- **La ✕:** abre la confirmación y el tiempo no corre. «Salir» no llama al servidor; el boleto queda sin cobrar y lo anula el siguiente pedido.
- **Pausa larga:** si al tocar «seguir» ya no da tiempo a terminar antes de que el boleto venza (10 min), sale el mensaje de «no hay video» en vez de hacer ver el resto para nada. El vencimiento lo trae `vence_en`; el teléfono no copia los 10 minutos.

### 3.5 «Guardando tu premio…» (respuesta P-2)

- Mientras el cobro se reintenta se ve la misma capa, con la barra llena y ese texto en el sitio de «Faltan N s».
- El texto entra con medio segundo de retraso. Un cobro normal contesta antes y no llega a verse.
- **Durante la primera tanda de reintentos (1, 2, 4, 8 y 15 s) la ✕ no está.** Si después el cobro sigue sin entrar, aparece. Su hueco está reservado: al aparecer no mueve nada.
- Mientras no se salga, se sigue reintentando el mismo boleto cada 15 s.
- Volver a primer plano adelanta el reintento.

### 3.6 El premio lo dice el servidor

- «+500 HC» sale de `premio` en los cinco sitios: el botón de Retar, la fila de la hoja, el pie de la capa, la pregunta de la ✕ y la celebración.
- El «8» de «No se descontó ninguno de tus 8 videos de hoy» sale de `tope`.
- `videoReward` y `maxVideosPerDay` de `ajileiConfig` son el espejo. Se leen solo mientras el servidor no ha contestado, y una prueba los compara con el SQL.
- El «500 HC» del consejo 8 es de la constancia y va escrito en el texto.

### 3.7 La celebración y los avisos de saldo

- No entra en la fila de avisos. Si hay un aviso en curso, espera a que termine.
- **La píldora:** el saldo se toma en el momento del cobro, pero mientras dura la celebración la píldora enseña la cifra que cuenta. El orden es: aviso vivo, celebración, saldo. Medido cuadro a cuadro: 70 cifras distintas de 300 a 800, y ninguna baja.
- **La constancia** se pospone mientras hay un video abierto y se pregunta al cerrarse.
- **`chipsCollect`** se precarga al pedir el video.
- **Movimiento reducido:** sin vuelo, sin cuenta y sin fundidos.

### 3.8 Los mandos de desarrollo

Solo existen con `DEV` y `VITE_AUTH_BYPASS`:
- `?apu=video:<ms>` acorta el video. El banco imitado acorta su mínimo en la misma proporción.
- `?apu=video:sin` hace que no haya video.
- `?apu=video:cierra` lo cierra solo antes de tiempo.

En la build no están: la guardia de `dist/` lo comprueba con el literal de su expresión regular (`|sin|cierra`).

---

## 4. Los límites

| Función | Tope | Razón |
|---|---|---|
| `pedir_boleto` | 10 por minuto | Solo la lanza un toque. Cada pedido anula el anterior, así que pedir de más no gana nada |
| `cobrar_boleto` | 20 por minuto | Con los reintentos de la casa, el primer minuto son 7 llamadas: menos de la mitad del tope. Hay una prueba que lo cuenta |
| `mi_video` | sin límite | No mueve dinero ni escribe |

`limite_dinero()` es un `case` cerrado, así que la 1g la redefine con los siete nombres. La prueba de espejo lee ahora la definición más reciente, no el archivo de la 1d por su nombre.

---

## 5. Decisiones mías que el rector debe mirar

### 5.1 En pantallas anchas y bajas, el contador va al lado del botón

- **Qué pasó.** Con el contador debajo, como en la lámina, la columna de Retar crece 24 px. A 1024×768 y a 1366×768 eso sacaba el botón principal de la ventana, y esa pantalla no desplaza. `diagDSK retar` salió rojo en esas dos celdas (puntos 4 y 6).
- **Qué hice.** Una regla nueva en `video.css`: con 1.000 px de ancho o más y 800 de alto o menos, el contador se sienta a la derecha del botón. El botón sigue centrado donde estaba. El bloque vuelve a medir lo que medía sin contador.
- **A quién alcanza.** A los escritorios de 768 de alto y al iPad girado (1133×744). En teléfono, en vertical y en apaisado, el contador sigue debajo, como en la lámina.
- **Efecto.** `diagDSK retar` vuelve a 6 de 6. Y de paso desaparece el H-2 de la lámina: a 1133×744 el botón principal ya no queda cortado esos 2,8 px. F-4 queda como estaba antes del video.
- **La alternativa** era dejar el rojo y aceptar el corte, como F-4. No me pareció mía la decisión de bajar una vara, y la doctrina de esa pantalla es apretar antes que desplazar. Si Victor prefiere el contador debajo también ahí, es quitar esa regla.
- Captura: `capturas-retar/retar_aviso_1024x768.png`.

### 5.2 La ✕ del cobro pregunta antes de salir

- La respuesta P-2 dice que tras la primera tanda «aparece la ✕ y "Salir" abandona el cobro».
- Hice que la ✕ abra la misma pregunta («Si sales ahora, no ganas los 500 HC.») con dos botones: «Volver» y «Salir». Un toque suelto en la ✕ no pierde un video ya visto.
- **No hay texto nuevo:** «Volver» es el del mensaje de «no hay video». «Seguir viendo» no valía ahí: el video ya terminó.

### 5.3 El contador se pregunta al abrir, no al arrancar

- `mi_video` se llama cuando se abre la hoja o cuando aparece el bloque de Retar, no al entrar en la app.
- **Por qué:** no añade una llamada al arranque de todo el mundo, y no cambia lo que miden los demás modos del arnés.
- **El coste:** al abrir la hoja el contador tarda un instante en escribirse. Su caja está reservada, así que no mueve nada.

### 5.4 Una prueba de textos que hubo que ampliar

- `textos.test.js` exige que «se nivelan» solo lo digan los dos subtítulos de la recarga («una sola voz»).
- El consejo 7, aprobado por Victor, dice «Si recargas fichas en la mesa, las IAS se nivelan contigo.»
- Amplié la prueba para admitir ese consejo y exigir que, dentro de `ia.*`, sigan siendo dos. La regla que protege es de la tarjeta de recarga, no del relleno de un video.
- También declaré un par de textos iguales: «Volver» (la flecha de las pantallas de chips y el botón del mensaje).

### 5.5 Otras, menores

- **El «doble toque en el final» del punto 6.** En lo construido el cobro sale solo al terminar el video: no hay botón que tocar dos veces. Lo medí como lo que de verdad puede pasar: el cobro entra, su respuesta se pierde y el teléfono lo repite. El segundo recibe `ya_cobrado`.
- **El saldo se toma al cobrar, no al acabar la cuenta.** Por eso en Retar el bloque de saldo se va cuando empieza la celebración, no cuando termina. La tarjeta de la celebración lleva su propio contador.
- **El nombre accesible del «+»** pasa de «Tienda» a «Conseguir monedas», y anuncia que abre un diálogo.
- **`src/hooks/usePronto.js` se quedó sin consumidores.** No lo borré yo: los borrados son de Victor, que lo borró tras el STOP-3 (§13).
- **El perfil, el ⚙ y el botón «Tienda» de la barra inferior** siguen diciendo «Pronto», como en el plan.

---

## 6. El modo `diagDSK video`

Contra `vite preview`, con la sesión simulada y un banco imitado por contexto. **Los videos duran 40 s de verdad.** Los siete recorridos que ven un video entero corren en paralelo: el modo tarda 1 min 50 s con `--sin-build`.

| Punto | Qué mide | Resultado |
|---|---|---|
| `video.1` | Desde Retar sin saldo: completar | 300 → 800. Una línea `video` de +500. «Te quedan 7 de 8 hoy». La píldora no baja. Del video abierto a la celebración pasaron 40,5 s |
| `video.2` | La ✕ → «Salir», y otra vez → «Seguir viendo» | Con la pregunta abierta, «Faltan 36 s» no se mueve en 2,5 s. Al salir: 2.500, 8 de 8, ninguna llamada al cobro. Al seguir: completa y cobra |
| `video.3` | El «+» → la hoja → el video, desde el lobby | La hoja con sus dos filas; 2.500 → 3.000; el «Pronto» no sale |
| `video.4` | No hay video: la red caída al pedir | El mensaje, sin abrir la capa. Ningún boleto, ningún movimiento. También desde Retar |
| `video.5` | El octavo | Antes: «Te queda 1 de 8 hoy». Después: fila y botón de Retar apagados con «Vuelven en 10 h 42 min», igual a lo que da el reloj del banco. Apagados no piden nada |
| `video.6` | El cobro repetido y `limite` en el cobro | Tres recorridos: respuesta perdida → `ya_cobrado`, un movimiento; `limite` dos veces → `limite, limite, ok`, el mismo boleto, un movimiento, sin ✕; `limite` sin fin → la ✕ a los 30,1 s, «Salir» abandona y no hay ni cobro ni cuenta |
| `video.7` | Pedir con un boleto vivo | El viejo queda anulado y no se cobra; queda uno vivo |
| `video.8` | La hoja con el nombre de 15 «W» y el contador de Retar, en siete vistas | La hoja, 9 px bajo la píldora, dentro de la pantalla, sin pisar la píldora, la ficha ni el engranaje; filas de 44 px o más. El contador no cambia de alto ni mueve el botón al pasar a «Vuelven en…» |
| `video.aux` | Los tres mandos, en desarrollo | `video:3000` completa en 3,4 s y cobra; `sin` da el mensaje; `cierra` no cobra ni cuenta |
| `consola` | Sin errores | Ninguno |

**Lo que este modo no mide:** la pausa con la pestaña oculta o la pantalla bloqueada. Playwright no oculta una pestaña (FRZ-1). El modo lo dice en cada corrida y va en la lista del teléfono.

**Un ajuste del punto 8.** El contador de Retar se mide con el nombre corriente. Con el de 15 «W» la barra de Retar se sale de la pantalla por su cuenta (§8, H-1), y eso descentra todo lo que hay debajo. El modo lo informa aparte, sin contarlo como rojo.

**`diagDSK retar` recableado.** Su punto 4 pulsaba «Conseguir más monedas» y esperaba el «Pronto». Ahora comprueba el rótulo nuevo, el contador, que el botón abre el video y que se puede cerrar. `humo` lo arrastra.

---

## 7. Varas

| Vara | Resultado |
|---|---|
| vitest (`npm test`) | 1.564 de 1.564, en 64 archivos. La línea base era 1.499: 65 pruebas nuevas |
| lint | 21, la línea base. Ningún error nuevo. Con `laminas/eco1f/` en el árbol da 30: los 9 de más son de la lámina, que no entra en los commits |
| build | Correcto (§8, H-2 para los tamaños) |
| `npm run guiones` | Verde: 9 migraciones; 1a 21/21, 1d 23/23 y 1g 21/21, cada uno con y sin `begin/rollback`, sin rastro |
| `diagSAL sal` | Verde, 102 de 102 |
| `diagDSK humo` | Verde: `gate`, `lob` 10/10 y `retar` 6/6. La primera corrida salió roja en `retar` (§5.1); esta es la segunda, con el contador recolocado |
| `diagDSK saldo` | Verde, 6 de 6 |
| `diagDSK mesaia` | Verde, 10 de 10, y `ventana60` verde |
| `diagDSK revive` | Verde |
| `diagDSK constancia` | Verde, 7 de 7 |
| `diagCEL0 celebracion` | 0 fallos: ninguno conocido y ninguno nuevo; control negativo verde |
| `diagDSK video` | Verde, los 10 puntos |
| Guardia sobre `dist/` | Verde: los mandos del video no aparecen; `mi_video`, `pedir_boleto` y `cobrar_boleto` sí |
| Registro de invariantes | `testInvariantes` en verde, con la fila nueva (INV-54) y la vara nueva |
| Protegidos | Ninguno abierto; `testProtegidos` en verde |
| `diagPUE cap` | **No corrida.** La ficha la pide solo si lo tocado cambia lo que se pinta en la mesa. El video no está en la mesa y ningún archivo de la mesa cambió |

### 7.1 El control rojo, en una copia

La copia es el árbol de trabajo en el scratchpad, con `node_modules` por una unión. El defecto se pone en el `src/dev/bancoImitado.js` de la copia, que es el servidor imitado que contesta al modo, y se corre `diagDSK video` entero.

| Defecto puesto | Qué cae | Lo que se vio |
|---|---|---|
| Sin la anulación de S1 | `video.7`, y solo ese | Tras el segundo pedido quedan dos boletos vivos. El viejo no está anulado y al cobrarlo contesta `demasiado_pronto` en vez de `anulado` |
| Sin la idempotencia del cobro (ni «ya cobrado» ni la clave única del libro) | `video.6`, y solo ese | El cobro repetido paga dos veces: dos líneas `video` y 3.500 de saldo en vez de 3.000 |

- **El par verde** es la corrida del repo, con los 10 puntos.
- **Al terminar,** el archivo de la copia se restauró y `cmp` lo da igual al del repo. La unión se quitó con `cmd /c rmdir`.

**Y el de la migración, en memoria** (STOP-2): nueve alteraciones de la migración, nueve rojos, cada uno en su fila. Sin la anulación de S1 el guion revienta contra el índice único; sin «ya cobrado» caen la 6, la 8 y la 21; sin el mínimo, la 4 y la 5; sin el tope, la 10; sin la comprobación de dueño, la 16 y la 20; sin vencimiento, la 8; sin límite en el cobro, la 15; y si el cobro o `mi_video` no dicen el premio, la 17 y la 21.

---

## 8. Hallazgos y riesgos

- **H-1 · La barra de Retar y de las salas se sale de la pantalla con un nombre de 15 letras. Ya estaba así.**
  - Con 15 «W», el engranaje queda 19,5 px fuera a 412 de ancho, 18,6 a 390 y 17,4 a 360. A lo ancho y en tableta, cabe.
  - El arreglo de la 1d (el nombre cede con «…») es solo del lobby. Las pantallas de salas tienen sus propias reglas y no lo heredaron.
  - No es de la 1g y no lo toqué. Lo informa `diagDSK video` en cada corrida.
- **H-2 · El paquete principal crece.** El JavaScript de arranque pasa de 575,5 a 603,2 kB (de 167,6 a 176,0 comprimido: 8,4 más); el CSS, de 95,7 a 106,6 kB (de 18,6 a 20,4 comprimido). El chunk de la mesa baja 4,1 kB porque un módulo que ahora también usa la celebración pasó al principal. Es el coste de montar el video cerca de `App`.
- **H-3 · `diagDSK retar` salió rojo con el contador.** Resuelto con la decisión de la §5.1.
- **H-4 · Dos dispositivos a la vez no se ejecutaron en paralelo.** Lo cubren por diseño el bloqueo de la billetera y el índice único de un boleto vivo por cuenta. Ni el guion ni el corredor tienen dos conexiones. Declarado en el registro (INV-54), como en la constancia.
- **H-5 · S6 sigue en pie.** El servidor sabe que pasaron los segundos, no que el jugador miró. Acotado a 4.000 HC por día. Escrito en las Reglas §11.
- **R-1 · La capa sigue encima si una sala arranca** (respuesta P-4). Anotado en el registro para MES-PvP.
- **R-2 · El contador puede ir un minuto por detrás.** «Vuelven en…» se refresca cada 30 s mientras está a la vista.

---

## 9. Lo que no comprobé

- **La pausa por pantalla bloqueada** está construida y probada en sus reglas, no medida en un navegador.
- **Movimiento reducido** está escrito; no lo capturé.
- **El sonido** de la celebración: en el arnés no se oye.
- **Teléfono real y Safari de iOS:** nada. Las vistas de iPad son de Chromium a ese tamaño.
- **La base real:** no me conecté. El guion en el SQL Editor lo corrió Victor.

---

## 10. Pruebas en el teléfono para Victor

Con la build en el túnel de siempre y contra la base real. **Los videos duran 40 s de verdad.**

1. **S25 (`test1976`), lobby.** Toca el «+» dorado.
   - Debe abrirse «Conseguir monedas» con «Te quedan 8 de 8 hoy».
   - Toca «Ver un video» y míralo entero.
   - Debe salir la tarjeta «+500 HC · ¡Video completado!», la moneda vuela al saldo, el saldo sube 500 y suenan las fichas.
   - Vuelve a tocar el «+»: debe decir «Te quedan 7 de 8 hoy».
2. **La ✕ a mitad.** Empieza otro video y toca la ✕ a los 15 o 20 s.
   - Debe preguntar «Si sales ahora, no ganas los 500 HC.» y el contador de segundos debe quedarse quieto.
   - Toca «Salir». El saldo no cambia y el «+» sigue diciendo «7 de 8».
3. **Pantalla bloqueada a mitad.** Empieza otro, bloquea el teléfono unos 20 s y desbloquéalo.
   - Debe estar «En pausa», con los segundos donde los dejaste.
   - Toca para seguir: termina y cobra.
   - **Esta es la única que el arnés no puede medir.**
4. **Modo avión.** Ponlo y toca «Ver un video».
   - Debe salir «Ahora no hay videos disponibles», sin abrirse el video.
   - Toca «Volver» y quita el modo avión. El saldo y el contador, iguales.
5. **Retar sin saldo.** El bloque del video en Retar solo sale cuando el saldo no alcanza ni para la mesa más barata del reto elegido: menos de 500 HC en Básico, de 1.000 en Avanzado o de 2.000 en Pro.
   - Con ese saldo, debe verse «Ver un video · +500 HC» con el contador debajo.
   - Ve uno y comprueba que, si con lo cobrado ya te alcanza, el bloque desaparece.
   - **Con más saldo no hay nada que probar aquí:** las mesas que no alcanzan salen en gris y no se eligen, como debe ser, y el bloque no aparece. En ese caso lo cubren `video.1` y `diagDSK retar` en el arnés.
   - (El texto de esta prueba se corrigió tras la validación: la primera versión decía «un saldo que no alcance para el reto elegido», sin precisar que es para su mesa más barata.)
6. **El tope, en el Motorola (`ticotest2022`).** Ve los 8 (unos 6 minutos en total).
   - Tras el octavo, la fila del «+» y el botón de Retar deben quedar apagados con «Vuelven en N h M min».
   - Esa cuenta debe cuadrar con la medianoche de Chicago.
7. **El libro, en el SQL Editor.** Pega este bloque:

   ```sql
   -- Una línea por cuenta: los videos cobrados hoy, sus líneas en el libro y si el libro cuadra.
   select p.username,
          (select count(*) from public.boletos_video b
            where b.jugador_id = p.id and b.cobrado_en is not null
              and public.dia_chicago(b.cobrado_en) = public.dia_chicago(now())) as cobrados_hoy,
          (select count(*) from public.movimientos m
            where m.jugador_id = p.id and m.tipo = 'video'
              and public.dia_chicago(m.creado_en) = public.dia_chicago(now())) as lineas_video_hoy,
          w.saldo,
          (select coalesce(sum(m.monto), 0) from public.movimientos m where m.jugador_id = p.id) as suma_del_libro
     from public.profiles p
     join public.billeteras w on w.jugador_id = p.id
    where p.username in ('test1976', 'ticotest2022');

   -- Las últimas líneas de video de las dos cuentas.
   select p.username, m.creado_en at time zone 'America/Chicago' as hora_chicago, m.monto, m.saldo_tras, m.clave_idem
     from public.movimientos m
     join public.profiles p on p.id = m.jugador_id
    where p.username in ('test1976', 'ticotest2022') and m.tipo = 'video'
    order by m.id desc
    limit 12;
   ```

   - `cobrados_hoy` y `lineas_video_hoy` deben ser iguales, y coincidir con los videos que completaste.
   - `saldo` y `suma_del_libro` deben ser iguales.
   - Cada línea de video es de +500.

### 10.1 Resultados (Victor, 2026-10-13)

Por el túnel, con la build y contra la base real. Al terminar, Victor cerró el preview y el túnel.

| Prueba | Resultado |
|---|---|
| 1 · el «+», un video entero, 7 de 8 | **bien** |
| 2 · la ✕ a mitad y «Salir» | **bien** |
| 3 · la pantalla bloqueada a mitad | **bien.** Es la única que el arnés no mide |
| 4 · el modo avión | **bien** |
| 5 · Retar sin saldo | **no aplica en el teléfono.** `test1976` tenía 4.050 HC, que alcanzan para la mesa más barata de los tres retos: el bloque no sale, y lo que no alcanza sale en gris y no se elige, como debe. Lo cubren `video.1` y `diagDSK retar` |
| 6 · el tope, en el Motorola | **bien.** 8 videos de +500 y «Vuelven en 7 h 59 min», que cuadra con la medianoche de Chicago |
| 7 · el libro | **bien.** `test1976`: 2 cobrados hoy, 2 líneas de video, saldo 4.050 y suma del libro 4.050. `ticotest2022`: 8 cobrados hoy, 8 líneas de video, saldo 11.000 y suma del libro 11.000 |

**iOS:** pendiente para la próxima sesión con el iPhone y el iPad (INV-41). Lo que hay que mirar allí: la capa a pantalla entera con las zonas seguras, la pausa al bloquear, y el iPad girado en Retar (§5.1).

---

## 11. El registro de invariantes

Filas tocadas en `docs/AJILEI_Invariantes_v1.0.md`:
- **INV-54, nueva:** el video se paga contra un boleto. Vigilado (parcial): la pausa y los dos dispositivos a la vez van declarados.
- **INV-53:** su fuente pasa a las Reglas v1.3 §5.
- **INV-51:** suma los dos límites del video.
- **INV-46 a INV-52:** sus fuentes pasan de las Reglas v1.2 a la v1.3. Las secciones no cambian de número.
- **§3:** el modo `video` y sus puertos.
- **§4:** el video entre lo que rigen las Reglas.
- **§6:** la fila de `diagDSK video`, el guion de la 1g como vigente, y los pendientes anotados.

**Pendientes anotados en la §6:**
- **Para ARN-4:** adaptar el guion de la 1c para que vuelva a ser vigente, darle a `celebracion` una celda en la que el cobro no sea la entrada, y diferir las capas del video a un trozo propio (respuesta P-3).
- **Para MES-PvP:** el video abierto cuando arranca una sala (P-4).
- **Para IOS-1:** F-4 sigue como estaba antes del video; el contador ya no lo empeora (§5.1). Y la barra de Retar y de las salas con nombres de 15 letras (respuesta P-4).
- **Para después del lanzamiento:** purgar los boletos de más de 30 días.

---

## 12. Preguntas al rector

- **P-1 · El contador al lado del botón en pantallas anchas y bajas (§5.1).** ¿Vale, o prefieres el contador debajo también ahí y aceptar el corte?
  - **Respuesta: aprobado.** El contador va al lado del botón con 1.000 px de ancho o más y 800 de alto o menos. En teléfono sigue debajo.
- **P-2 · La ✕ del cobro con su pregunta y «Volver» (§5.2).** ¿Vale reutilizar «Volver»?
  - **Respuesta: aprobada** la ✕ del cobro con su pregunta, «Volver» y «Salir».
- **P-3 · El paquete principal (H-2).** ¿Se deja así, o se anota para ARN-4 sacar las capas del video a un trozo diferido?
  - **Respuesta: se deja así.** Queda anotado para ARN-4: diferir las capas del video a un trozo propio (registro §6).
- **P-4 · La barra de las salas con nombres largos (H-1).** No es de la 1g. ¿Se anota para una tanda corta, con el mismo arreglo que el lobby?
  - **Respuesta: va a IOS-1,** la campaña de tamaños. Anotado en el registro (§6) con ese dueño.
- **P-5 · El resultado del guion en el SQL Editor (§1).** No venía en el mensaje. ¿Lo pegas tú, o me lo pasas?
  - **Respuesta: llegó con la revisión.** Copiado a la §1: las 21 en PASA.

---

## 13. Cierre de terreno

- **Puertos del arnés** (4173, 5173 y 5174): ninguno escucha.
- **Procesos node:** ninguno vivo.
- **Uniones a `node_modules`:** las dos copias tuvieron una y las dos se quitaron con `cmd /c rmdir`. El `node_modules` del repo está entero.
- **Protegidos:** ninguno abierto; `testProtegidos` en verde.
- **La base:** no me conecté ni hice `db push`.
- **Fin de línea:** todo en LF.
- **git status:** `main` sigue en `c95f05c`. Nada añadido.
  - lo de esta tanda (§2), todo sin añadir: 23 archivos cambiados y 20 nuevos, con este informe;
  - `laminas/eco1f/`, sin tocar;
  - los residuos de MOT-1, `laminas/mon1/` y `docs/reportes/AJILEI_iOS_Sesion1_Lista_v1.0.md`, sin tocar;
  - `capturas-video/`, `capturas-retar/` y las demás carpetas de capturas están ignoradas.

**Tras la revisión del STOP-3 (2026-10-13):**
- **Victor borró `src/hooks/usePronto.js`.** Comprobado con `grep` en `src/` y `scripts/`: nada lo importa, ni a `usePronto` ni a `ProntoContext`. Quedan cuatro menciones, todas en comentarios que cuentan la historia (`PantallaChips.jsx` y `useVideo.js`). En `git status` sale como borrado, sin añadir.
- Con el borrado: vitest 1.564 de 1.564, lint 21 y build correcto.
- No se tocó nada más: solo este informe y el registro, para anotar las respuestas.

**Para borrar (Victor):**
- `laminas/eco1f/` entera, tras el push (41 MB de capturas).
- En el scratchpad de la sesión, la carpeta `eco1g`: dos copias sin uniones, los registros de las varas y los parches. La copia del control rojo se restauró y es igual al repo.

**Propuesta de commits** (ninguno hecho):
1. `ECO-1g: la migración del video y su guion` — la migración, el guion y su alta en el corredor.
2. `ECO-1g: el banco imitado, la API y el canal del video` — `bancoImitado`, `videoApi`, `videoCore`, `controlVideo`, `reproductor`, `ajileiConfig` y los mandos.
3. `ECO-1g: el video en la app` — las piezas, la hoja de estilos, los textos, `App`, la barra, Retar y las pantallas de salas.
4. `ECO-1g: el modo video del arnés y la guardia de dist/`.
5. `ECO-1g: Reglas v1.3, invariantes e informe`.

---

## 14. El tope

**Dentro del tope, con margen.** Medido con las marcas de tiempo de la sesión, sin contar las pausas de más de 10 minutos:
- STOP-1 y STOP-2: unos 20 minutos.
- Del STOP-2 al STOP-3: 1 h 05 min, con las varas y el control rojo en segundo plano.

En total, en torno a 1 h 25 min, frente a un tope de 4 h 30 min. El plan del STOP-1 estimaba 4 h 20 min: se quedó muy largo.

Ninguna vara ni ningún control rojo se recortó. `diagDSK rec`, `diagDSK apu` y `diagPUE cap` no se corrieron porque la ficha no las pide: nada de lo tocado usa la recarga, el normativo de APU-1 ni lo que se pinta en la mesa.
