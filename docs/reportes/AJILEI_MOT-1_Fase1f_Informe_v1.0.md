# AJILEI · MOT-1 · Fase 1f · Informe · v1.0

- **Ficha:** `AJILEI_MOT-1_Fase1f_v1.0.md`. **Normativo:** `docs/AJILEI_MOT-1_Contrato_v1.0.md` (§2 y §5).
- **Base:** `a948767`.
- **Duración hasta el STOP-1:** 35 min de reloj (20:50 → 21:25). Tope: 2 h.

**En tres líneas.** Dos teléfonos jugaron una partida real a través del servidor, por túnel, con el token real, la base real y el canal privado real. Las jugadas aparecieron solas en el otro teléfono, nadie vio las cartas ajenas, el reloj resolvió solo y el canal volvió tras apagar la pantalla. El gatillo de Ably no se dispara.

---

## 1 · Lo que hay

| Archivo | Qué es |
|---|---|
| `src/lib/partidaCliente.js` | El cliente: enviar, leer y escuchar, el reloj, el arranque y la marca |
| `src/screens/PartidaPvP.jsx` | El panel de prueba. Sin la marca, el stub de hoy |
| `src/styles/panelMot1.css` | Los estilos del panel, con prefijo `.mot1` y los colores de `.sal` |
| `src/lib/partidaCliente.test.js`, `src/screens/PartidaPvP.test.jsx` | 45 pruebas nuevas |
| `scripts/testEntradaLigera.test.js` | El guardián: el cliente y la hoja de estilo, fuera de la entrada |
| `scripts/testClavesAlmacen.test.js` | Censa la clave `ajilei.mot1` |
| `src/arbitro/arbitro.test.js` | Exceptúa `motivos.js` (§3) |

No se tocaron la función, las migraciones, el código del árbitro, el motor, `GameTable.jsx`, los protegidos ni la sala de espera. Se entra por el botón de hoy, «¡Arranca la partida!».

**La suscripción:**

```js
await cliente.realtime.setAuth(session.access_token)
cliente
  .channel(`partida:${mesa}`, { config: { private: true } })
  .on('broadcast', { event: 'version' }, ({ payload }) => alAviso(payload?.version))
  .subscribe((estado, error) => { /* … */ if (estado === 'SUBSCRIBED') leer() })
```

Con un `accessToken` configurado, como en `supabase-js`, `setAuth(token)` no le quita al SDK el refresco del token. Al quedar suscrito se relee, porque lo anterior no avisó a nadie.

---

## 2 · Resultados de Victor

S25 con `test1976` y Motorola con `ticotest2022`, mesa privada de 100 para 2, por túnel y con `?mot1=1`.

| Prueba | Resultado |
|---|---|
| A · las jugadas aparecen solas en el otro teléfono | **Sí** |
| B · no se ven las cartas del otro hasta la revelación | **Sí** |
| C · el reloj resuelve solo a los 20 s | **Sí** |
| D · retirarse | **Sí** |
| E · pantalla apagada unos 30 s y vuelta | **Sí,** sin trabarse; el canal volvió a `SUBSCRIBED` |
| Errores | Ninguno |
| Abandono final | La partida terminó sola y **la suma de los dos saldos cuadró** |
| «Su aviso» | En cientos de ms, por debajo del umbral de ~800 ms |

**El gatillo de Ably (sellado el 12-sep): no se dispara.** El aviso no tarda de forma habitual más de ~800 ms y el canal se recupera al volver de pantalla apagada.

**Un primer intento se hizo sin la marca.** Esa mesa quedó `activa` sin partida, y la cancela el barrido. Es lo que ocurre hoy a cualquier jugador sin la marca (§6).

### Lo que esto prueba, y lo que no

**Por primera vez, de punta a punta:** un token real pasa el verificador, las RPC funcionan contra la base real y el aviso con `private: true` llega por el canal privado. Lo último se deduce de que «su aviso» dio cifras y de que las jugadas aparecieron solas. El 202 no se miró directamente.

**Frente a los seis puntos de la ficha §6, tres quedaron menos cubiertos de lo pedido:**

| Punto de la ficha | Lo que consta |
|---|---|
| 2 · el sorteo funciona y decide la Mano | No se reportó por separado. Sin él no se llega a la primera mano, pero no consta que se comprobara quién quedó de Mano |
| 5 · cada saldo es el de antes − 1.500 + la pila final | Consta la **suma** de los dos, no cada saldo por su lado. El fin fue por abandono; la quiebra no se probó |
| 6 · las medidas, apuntadas en unas cuantas jugadas | Solo el orden de magnitud de «su aviso». Sin cifras, y sin las de «mi última acción» y «aviso → vista nueva» |

No consta tampoco el número de manos jugadas: la ficha pedía unas 4–6.

---

## 3 · Lo que se decidió en esta tanda

Declarado en el STOP-1. El rector siguió adelante sin cambios.

**1 · `arbitro.test.js`.** Prohibía cualquier import de `src/arbitro/` desde el cliente, y la ficha §2 pide leer `motivos.js`, como dice `src/arbitro/index.js:3`. Se abre la excepción solo para ese archivo. Es una línea de prueba dentro de una carpeta que la ficha manda no tocar; el código del árbitro sigue intacto. Copiar la lista iba contra la ficha.

**2 · Una medida y una línea de más.** Las dos medidas de la ficha no miden lo que tarda el bus: una es el viaje de la acción y la otra empieza cuando el aviso ya llegó. Para juzgar el gatillo de Ably se añadió:
- **«su aviso»:** de enviar mi acción a recibir su propio aviso, con el mismo reloj. Es un tope superior, porque incluye el tiempo de la función;
- **el estado del canal y un contador de avisos,** para ver si se recupera.

**3 · La marca se lee al llegar a la pantalla de la partida,** no al abrir la app: leerla antes movería `1.8b`. La app conserva `?mot1=1` en la dirección. Se censa como `ajilei.mot1`.

**4 · El enlace de invitación apunta siempre a `https://ajilei.io/`.** En el túnel, el código se teclea a mano.

**Menores:**
- Los textos del panel van en el JSX, porque `textos.es.js` viaja en la entrada.
- Los botones que `esLegal` da por malos se ven apagados y se pueden tocar, para poder probar el rechazo.
- El panel relee el saldo al entrar y al cobrar, porque la píldora no lo hace sola (1d-ii §3.3).
- `partida_terminada`, `no_es_de_esta_mesa` y demás rechazos definitivos paran los reclamos, y «Releer» los reactiva. La red y el 500 se reintentan cada segundo.
- `'version'`, las fases y la etapa van como literales, porque importarlos arrastraría el motor. Una prueba los ancla a la función y al árbitro.
- El área que se desplaza termina encima de la casita. El ensayo enseñó que «Retirarse» podía quedar debajo, y tocarla saca de la mesa.

---

## 4 · Pruebas antes de la prueba de Victor

| Prueba | Resultado |
|---|---|
| `vitest` | 102/102 archivos, **2372/2372** (2327 + 45 nuevas) |
| `eslint` | Código 0, sin errores ni avisos |
| `1.8b` | **176,8 KiB**, igual que antes |
| `npm run varas -- commit` | Código 0, las 7 varas |
| Rotura a propósito, 42 cambios en el cliente y la marca | **42 cazados.** En la primera pasada fueron 39: se añadieron dos pruebas y se corrigió otra |
| Trozo `PartidaPvP` | 13,6 KB de JS y 1 KB de CSS, sin `gameEngine` |

**El ensayo, fuera del repo.** La app compilada y el SDK reales, en Edge a 360×780, contra `crearManejador` y el árbitro reales. Lo falso era la base, Auth y el socket, que imitaba el protocolo de Realtime. No tocó Supabase. Dio verde en: arranque único, canal privado con el token de cada uno, 4 manos, un turno resuelto a los 20,4 s, un aviso perdido recuperado a los 2,5 s, el rechazo con su motivo, el abandono con neto 0 y ninguna llamada tras el fin.

**Un rojo que no se aisló.** Una corrida dio rojo en «cartas ajenas». Aquella comprobación leía la fase y el texto en dos momentos, así que podía mezclar manos, pero el caso no se aisló. Rehecha como una lectura única contra el historial del servidor, salió 0, con 0 fugas en 138 lecturas del JSON. Esa corrida fue la única con la comprobación nueva; la prueba de Victor (B) es la que lo cierra.

---

## 5 · Los commits

`npm run aislado -- <sha> --perfil=commit`, cada uno por separado:

| Commit | Resultado | `vitest` | `eslint` | `1.8b` y humo |
|---|---|---|---|---|
| `fe80829` MOT-1f-a | **Verde**, 878 s | 102/102 archivos, 2372 pruebas | 0 y 0, igual a la base | Código 0 los dos |

MOT-1f-b, el commit de este informe y del cierre, se prueba igual; su resultado va en el chat.

---

## 6 · Notas para MES-PvP

Reunidas, con las de las demás tandas, en `AJILEI_MOT-1_Cierre_v1.0.md` §3.

- **El panel se va:** `PanelMot1`, `panelMot1.css`, la marca, su clave en `testClavesAlmacen` y el comentario de cabecera de `PartidaPvP.jsx`.
- **`partidaCliente.js` se queda,** salvo la marca. Mantiene las reglas de la ficha §2.
- **Una mesa `activa` sin partida:** sin la marca, el stub no reclama nada, así que nadie crea la partida. Lo vivió Victor en el primer intento. La entrada sigue fuera de la billetera hasta que `barrer_salas` cancela la mesa, pasados 10 min y cuando alguien llama a `salas_abiertas`, `crear_sala` o `unirse_sala`.
