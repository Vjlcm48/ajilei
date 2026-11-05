# AJILEI · MOT-1 · Cierre · v1.0

- **Normativo:** `docs/AJILEI_MOT-1_Contrato_v1.0.md`.
- **Base de la campaña:** `1f5cb14`. **Fecha:** 2026-11-04.

**En tres líneas.** El servidor ya arbitra una partida PvP de punta a punta: reparte, sortea la Mano, lleva el dinero y el reloj, y le da a cada teléfono solo lo que puede ver. Dos teléfonos reales la jugaron por el canal privado, sin Ably. Lo que falta es la mesa: un jugador normal aún no puede jugar, y eso es MES-PvP.

---

## 1 · Las tandas

No hubo 1c: el contrato §10 pasa de la 1b a la 1d-i.

| Tanda | Qué hizo | Commits |
|---|---|---|
| **1a** · Documental | El contrato y Protegidos v1.9 | `1d73838` |
| **1b** · Motor y árbitro sin red | Edición 3 del motor, el árbitro, `vistaDe`, el sorteo, el azar seguro y las esperas | `d55a5e6` · `16f7045` · `459e057` · `1357d83` · `118408d` |
| **1d-i** · Esquema | Tablas de partida y vistas, canal privado, siete apuestas, `entrada` y `ritmo` | `d2b7fc7` · `77e4e4c` |
| **1d-ii** · Dinero y puntos | Garantía y liberación, pilas por mano, partida muerta y puntos detrás del interruptor | `3fe7fa0` · `342dbc7` · `c9ec865` |
| **1e** · Edge Function | La función `partida`: token, árbitro, guardado y aviso | `f5c1143` · `a948767` |
| **1f** · Humo con dos teléfonos | El cliente, el panel de prueba y este cierre | `fe80829` · MOT-1f-b (este commit) |

---

## 2 · Lo que quedó en pie

**En producción:**
- La función `partida`, desplegada, con la llave Current en ECC P-256.
- Las migraciones `mot1_esquema` y `mot1_dinero`, aplicadas.
- El interruptor de los puntos contra humanos, **apagado**. El humo no escribió en los rankings.
- La sonda, borrada: función y carpeta.

**En el código:**
- `src/arbitro/`: el árbitro, puro, sin red ni base. Corre en la función y ningún archivo del cliente lo importa, salvo `motivos.js`.
- `src/lib/partidaCliente.js`: el cliente que usará MES-PvP.
- El panel de prueba en `PartidaPvP.jsx`, escondido tras `?mot1=1`. No es la mesa.

**Probado por Victor con dos teléfonos (informe 1f §2):**
- las jugadas aparecen solas en el otro teléfono;
- nadie ve las cartas ajenas hasta la revelación;
- el reloj resuelve solo a los 20 s;
- retirarse funciona;
- el canal vuelve a `SUBSCRIBED` tras 30 s de pantalla apagada;
- tras un abandono, la partida termina sola y la suma de los saldos cuadra.

**El bus: se queda Realtime.** «Su aviso» va en cientos de ms, por debajo de los ~800 ms, y el canal se recupera. El gatillo de Ably sellado el 12-sep no se dispara. Mirar de nuevo si la mesa real cambia el volumen de avisos.

---

## 3 · Lo que pasa a MES-PvP

**La mesa y su pantalla (contrato §11):**
1. Armar mesa con Entrada, chip de 50 y ritmo; `APUESTAS_PVP` en el cliente.
2. Los flujos de `GameTable.jsx` marcados «MOT-1 reescribe este flujo».
3. La gracia de reconexión y lo que ve el que vuelve.
4. «Mano actual · Humanos 500».
5. El mini-perfil en la sala.
6. Encender los puntos contra humanos.

**El relevo del panel (1f):**
7. Quitar `PanelMot1`, `panelMot1.css`, la marca y su clave `ajilei.mot1`. `partidaCliente.js` se queda, salvo la marca.
8. **Una mesa `activa` sin partida.** Con el stub nadie crea la partida. La entrada sigue fuera de la billetera hasta que `barrer_salas` cancela la mesa, pasados 10 min y cuando alguien llama a `salas_abiertas`, `crear_sala` o `unirse_sala`. **Hoy le pasa a cualquier jugador que arranque una mesa PvP en producción** sin la marca. Victor lo vivió en su primer intento.

**Las sillas (1b §4):**
9. Cada cliente debe verse abajo: `seatLayouts.js` no rota por cliente y es protegido, así que la rotación va fuera de él.
10. La sala de espera no rota y va en sentido horario, con el anfitrión arriba. La mesa va en antihorario.

**El reloj y el final (1b y contrato §6):**
11. Ajustar con teléfonos los 4 s de la pausa de mano siguiente, cifra provisional.
12. La revelación: 4,96 s pueden quedarse cortos, porque la mesa real además celebra, con tope de red de 6 s.
13. El ganador de la partida no sale en la vista en `GAME_OVER`: se deduce de quién sigue sin eliminar. La pantalla final lee `cobrado`.

**Salas y saldo (1d-i y 1d-ii):**
14. `salas_abiertas` no devuelve `entrada`: con mesas Llenas, dos de la misma combinación se verían iguales.
15. La píldora al día tras sentarse y salir: hoy solo se pone al día al volver a la app tras 15 s o más, o con `saldo_insuficiente`.
16. Un texto propio para el tope de 10 sentadas por minuto: `sal.error.demasiados_intentos` habla de códigos.

**Abandono y partida muerta (1d-ii y 1e):**
17. Quien abandona con la acción `abandonar` sigue viendo la mesa en `mi_sala` hasta que cobra.
18. Partida muerta: las vistas no se reescriben. Decidir qué se pinta. Una acción que el árbitro rechaza antes de guardar, como `fuera_de_turno`, responde ese motivo y no `partida_terminada`; `reclamar_vencimiento` sí lo recibe.

**Del rector, al cerrar MOT-1 (contrato §9), no de MES-PvP:**
- Reglas v1.5: los motivos con otro nombre y «`pozos.js` no protegido» (Reglas v1.4 `:143`).
- Protegidos §7.1, fila E-4: dice que el pozo deja de ser escalar.

**Sin dueño:** `supabase/functions/eliminar_cuenta/index.ts:25` cita `sonda_mot1/index.ts:33-45`, que ya no existe. Es solo un comentario.

---

## 4 · Lo que queda sin medir

**Del humo de la 1f, lo que no consta (informe 1f §2):**
- Que el sorteo decidiera la Mano, comprobado por separado.
- Cada saldo por su lado: consta la suma de los dos.
- Las cifras de las medidas: solo el orden de magnitud de «su aviso», y nada de «mi última acción» ni de «aviso → vista nueva».
- El número de manos jugadas.
- Que el barrido cancelara la mesa del primer intento y devolviera su entrada. El SQL lo hace y sus Grupos lo cubren, pero en esa mesa no se comprobó.

**Lo que ninguna tanda probó en real:**
- **Concurrencia de verdad:** dos versiones a la vez, el barrido contra una jugada, y los cerrojos. PGlite tiene una conexión y todo el banco va en secuencia. Está razonada. Dos teléfonos a ritmo humano no la ponen a prueba.
- **El fin por quiebra:** el humo terminó por abandono.
- **Mesas de 3 a 5 asientos, la entrada Llena y el ritmo rápido** en teléfonos. El árbitro y los Grupos los cubren sin red.
- **iPhone y Safari:** el humo fue con dos Android.
- **Pantalla apagada más de 30 s,** una sesión que caduque a mitad de partida y una partida muerta vista desde el cliente.
- **Los puntos encendidos** con partidas reales. Los Grupos los cubren sin teléfonos.
- **Postgres:** el banco va en 18.3 y Supabase en 17.6.1 (Invariantes §6).
