# AJILEI · MOT-1 · Fase 1d-ii · Informe · v1.0

- **Ficha:** `AJILEI_MOT-1_Fase1d-ii_v1.0.md`. **Normativo:** `docs/AJILEI_MOT-1_Contrato_v1.0.md` (§7, §9).
- **Base:** `77e4e4c`. **Migración:** `supabase/migrations/20261104170000_mot1_dinero.sql`.
- **Duración hasta el STOP-1:** 25 min de reloj (16:30 → 16:55). Tope: 2 h 30.

**En tres líneas.** El dinero de una mesa PvP vive en SQL de punta a punta: la entrada sale al sentarse, vuelve en cualquier salida de la espera, las pilas se guardan al cerrar cada mano y una partida muerta se paga sola. Los puntos contra humanos quedan escritos y apagados. El rector resolvió los cuatro asuntos del STOP-1 (§3).

---

## 1 · Lo que lleva la migración

| Bloque | Qué crea o cambia |
|---|---|
| **a) Sentarse** | `entrada_de(apuesta, entrada)`, la única que calcula la entrada · `cobrar_entrada`: tope, una partida por cuenta y `garantia_pvp` · `crear_sala` y `unirse_sala`: saldo ≥ entrada y garantía en la transacción de la silla, sin cambiar la firma · fuera `regla_asiento()` |
| **b) Devolver** | `devolver_entrada`, `cancelar_sala` y `levantarse_de_sala`, usadas por `salir_sala`, `resolver_sala`, `barrer_salas` y `cerrar_partida_abierta`. Ninguna pasa por un tope |
| **c) Pilas** | Tabla `partida_asientos` (`sala_id`, `asiento`, `uid`, `entrada`, `pila`, `liberado`, `cobrado`, `abandono_pedido`) · `crear_partida` las inicia y comprueba el libro, con la misma firma |
| **d) Efectos** | `aplicar_efectos(sala, efectos, terminada)`, llamada por `guardar_jugada` con la misma firma · `neto_mesa`, `neto_jugador_mesa`, `mesa_cuadra` |
| **e) Puntos** | `ajustes_economia.puntos_humanos`, apagado · mando `interruptor_puntos_humanos(boolean)` · rastro `interruptor_cambios` · `anotar_puntos_humanos` |
| **f) Partida muerta** | `cerrar_partida_muerta`, desde `barrer_salas`, fila a fila con `skip locked` · `partida_abierta_de` mira el asiento |
| **g) Una por cuenta** | `cerrar_partida_abierta` con el motivo `reemplazada` conoce la espera y la partida viva · `sentarse_ia` cuenta lo que devolvería la sala · `mi_sala` mira el asiento |
| **h) Topes** | `limite_dinero` con cuatro nombres más · `consultar_mano` y `comprar_articulo` sin tope literal, cuerpo copiado por programa |

**La única firma que cambia:** `leer_partida(uuid)` devuelve además `abandonos smallint[]`, los asientos que la 1e tiene que abandonar.

**Forma de los efectos:** la del informe 1b §1. La 1e los pasa tal cual en `p_efectos`.

---

## 2 · La regla de oro: dónde se comprueba

**Lo que la sostiene por construcción.**

- La devolución de la espera no recibe un monto: paga lo que el libro dice que esa cuenta tiene dentro de esa mesa. Una mesa de antes de esta migración, sin garantías, no devuelve nada.
- Las claves del libro: `garantia_pvp:<sala>:<uid>:<sentada>`, `liberacion_pvp:<sala>:<uid>:devolucion:<sentada>` y `liberacion_pvp:<sala>:<uid>:salida`. Esta última la comparten la `salida` y la partida muerta: un asiento cobra una sola vez, por cualquiera de los dos caminos.

**Lo que se comprueba, y si falla, `estado_incoherente` y se deshace.**

| Dónde | Qué |
|---|---|
| `crear_partida` | Cada asiento tiene en el libro una garantía neta igual a la entrada, y el neto de la mesa es −asientos × entrada |
| `guardar_jugada`, con efectos | `mesa_cuadra`: pilas + liberado = entradas, y el libro dice lo mismo que los asientos |
| `partida_terminada` | Todos cobrados y `neto_mesa` = 0. El efecto y `p_terminada` tienen que decir lo mismo |
| Partida muerta | `mesa_cuadra` y `neto_mesa` = 0, después de pagar |
| `cancelar_sala` | `neto_mesa` = 0, después de devolver |

**En el barrido, una mesa que no cuadra no para a las demás.** Lo llaman casi todas las funciones de salas, y un `raise` dejaría a todos sin poder sentarse. Cada mesa va en su propio bloque: se deshace solo lo suyo, sale por `raise warning` a los registros de Postgres y se reintenta en el siguiente barrido.

---

## 3 · Lo que decidió el rector al STOP-1

**1 · Tres archivos fuera de lo permitido dejaban rojas las varas.** Codificaban el 5× o la lista cerrada de topes. **Decisión:** autorizado el parche. Se corrigen también los comentarios de `bancoImitado.js` que decían que los dos topes iban literales.

| Archivo | Qué falla | El cambio |
|---|---|---|
| `supabase/pruebas/eco1a_verificacion.sql` | Fila 16: «la de 500 pide 2.500 y entra» | Mesas de 200 y 100 |
| `src/dev/bancoImitado.js` | `LIMITES_SQL` no era el espejo de `limite_dinero` | Una línea con los cuatro nombres |
| `src/screens/salasCore.test.js` | 7 pruebas con cifras del 5× | Las cifras de 15× |

**2 · El anfitrión ya cobrado y el borrado de su cuenta.** La ficha §2-f dice que podrá borrarla «cuando haya cobrado». Pero `salas.anfitrion_id` es `on delete cascade`: borrarlo se llevaría la sala, la partida y las pilas de todos. **Decisión:** sigue bloqueado hasta que la partida termine o muera. El contrato §6 lo recoge.

**3 · La píldora no se mueve sola.** `useBilletera` relee al arrancar, al volver a primer plano (si pasaron 15 s) y con `saldo_insuficiente`. `crear_sala`, `unirse_sala` y `salir_sala` no devuelven saldo y la pantalla no pide releerlo. El dinero está bien; lo que se ve va atrasado hasta recargar. **Decisión:** va a MES-PvP y no se toca `src/` por ella. En la prueba del §5 de la ficha hay que recargar tras sentarse y tras salir.

**4 · Un texto quedaba falso.** `sal.espera.consejo.3` decía «5 veces la apuesta» (`textos.es.js:207`). **Decisión:** pasa a «15 veces la apuesta».

**Dos menores:**
- `sal.error.demasiados_intentos` habla de códigos, y ahora también lo ve quien se sienta más de 10 veces en un minuto. **Decisión:** el texto propio va a MES-PvP.
- El contrato §7 decía que la llamada a los puntos era de la 1e, y la ficha §2-e la pone en `guardar_jugada`. **Decisión:** vive en `guardar_jugada` (1d-ii). El contrato §7 y §9 lo recogen.

**Para MES-PvP, de esta tanda:** la píldora al día tras sentarse y salir, y el texto propio del tope.

---

## 4 · Lo que el contrato no cubría y decidí

- **Pilas en tabla hija,** con `entrada` y `liberado`: el libro de una cuenta borrada se va en cascada y la mesa tiene que seguir cuadrando sin él.
- **`uid` del asiento, `on delete set null`,** con un `check` que impide borrar una cuenta con asiento sin cobrar aunque alguien se salte la guarda.
- **Número de sentada en la clave:** quien se levanta y vuelve a la misma mesa paga otra vez. Sin el número, el libro lo daría por repetido y lo sentaría gratis.
- **Índice parcial en `movimientos`** (`ref_id` donde `ref_tipo = 'sala'`), para comprobar por mesa sin recorrer el libro. No cambia su forma.
- **Tope:** 10 por minuto en `crear_sala` y en `unirse_sala`, como `sentarse_ia`. Rebota con `demasiados_intentos`.
- **Saldo:** cuenta lo que devolvería la mesa contra las IAS que se va a cerrar, y en `sentarse_ia` lo que devolvería la sala que se va a dejar. Es el criterio que ya tenía `sentarse_ia`.
- **`salir_sala` con partida:** no hace nada, y no borra la silla. Se sale con la acción `abandonar`. Lo que dejé anotado en la 1d-i.
- **`activa` sin partida:** el invitado que sale recupera lo suyo; el anfitrión espera al barrido, que era lo de hoy.
- **`crear_partida` con menos de dos:** `sala_no_activa`, porque `crearPartida` del árbitro lanza con una silla.
- **`guardar_jugada`:** bloquea primero la sala, para el orden de cerrojos sala → partida → asiento → billetera. El recuento de vistas distingue asientos de filas: la vista de una cuenta borrada se va en cascada y la partida de los demás no puede pararse.
- **Efecto desconocido:** `estado_incoherente`. No se ignora.
- **Puntos que no entran:** aviso, sin deshacer la mano de dinero.
- **`recoger_mesa_ia`:** sigue mirando solo la mesa contra las IAS. Corre al arrancar la app, y recargar la página no puede sacar a nadie de una partida.
- **`mi_sala`:** quien cobró o pidió abandonar no vuelve a esa mesa.

---

## 5 · Pruebas antes del push

| Prueba | Resultado |
|---|---|
| Grupos A y B, sacados del texto de la migración, en PGlite 0.5.8 (Postgres 18.3) | **18/18 y 51/51 PASA** |
| Partidas completas con el árbitro real y sus efectos reales, 2 a 5 asientos, corta y llena | **17/17 PASA:** 1.959 jugadas, 196 manos, 37 salidas. 10 terminadas y 7 muertas, cortadas también a media mano. Neto 0, nadie sin cobrar y la suma de saldos igual en todas |
| Rotura a propósito, 69 cambios en la migración | **68 cazados.** Sobrevive poner el 5× en la pre-comprobación de `crear_sala`: es equivalente, porque `aplicar_movimiento` vuelve a juzgar el saldo |
| `db push --linked --dry-run` | Lista solo `20261104170000_mot1_dinero.sql` |
| `eslint` | 0 errores, 0 avisos |
| `vitest`, antes del parche del §3.1 | 97/99 archivos, 2232/2240: las 8 del §3.1 |
| `npm run guiones`, antes del parche | ROJO por una fila: `eco1a` 16. Los otros 8 guiones, verdes |
| Las dos anteriores, con el parche y el texto | **2240/2240 y VERDE,** 17 migraciones, 9 guiones × 2 pasadas |
| Las tres varas en el estado del commit 1, sin el grupo de `salas.js` | **2240/2240, `eslint` 0 y VERDE** |

Los Grupos cazaron un error real al escribirlos: con el interruptor encendido, `coalesce` cambiaba el tipo de `ajilei` y la jugada reventaba. Con él apagado no se habría visto hasta MES-PvP.

**Lo que el banco no podía medir:**
- **Concurrencia real:** dos dispositivos a la vez, el barrido contra una jugada, y los cerrojos pide dos conexiones, y PGlite tiene una. Está razonada, y sigue sin medir. Si dos barridos cruzan billeteras entre mesas distintas, Postgres aborta uno y se deshace entero.
- **Postgres:** el banco va en 18.3 y Supabase en 17.6.1 (diferencia conocida, Invariantes §6).

---

## 6 · Resultados de Victor

| Prueba | Resultado |
|---|---|
| `db push --linked` | Finished |
| Grupo A | **18/18 PASA** |
| Grupo B | **51/51 PASA,** sin fila `X` |
| S25 (`test1976`), mesa privada de 100 | Al sentarse, el saldo baja 1.500; al salir, vuelve |
| S25 y Motorola (`ticotest2022`), con el anfitrión cancelando | Los dos recuperan su entrada |

**La píldora** solo se actualizó al volver a la app tras 20 s, como anunciaba el §3.3. Queda para MES-PvP.

---

## 7 · Nota para la 1e

- **Abandono pedido:** `leer_partida` lo trae en `abandonos`. La 1e llama a `abandonarPorServidor` en la siguiente llamada a esa mesa. `abandonarPorServidor` rechaza con `asiento_abandonado` si ya lo aplicó, y el asiento sigue en `abandonos` hasta que cobra: hay que tolerar ese rechazo.
- **Abandono por la acción `abandonar`:** vive en el estado del árbitro hasta que el asiento cobra. `mi_sala` no lo ve entretanto. Si debe dejar de devolver la mesa, la 1e tiene que marcar también `abandono_pedido`.
- **Partida muerta:** las vistas no se reescriben. El cliente se entera con el siguiente rechazo, `partida_terminada`, y MES-PvP decide qué pinta.
- **Vencimiento y `p_terminada`:** `p_terminada` tiene que coincidir con el efecto `partida_terminada`. Es `partidaTerminada(estado)`, y los dos salen juntos del árbitro.
