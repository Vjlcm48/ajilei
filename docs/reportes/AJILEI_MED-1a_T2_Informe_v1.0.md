# AJILEI · MED-1a · Tanda 2 (el cliente) · Informe · v1.0

- **Ficha:** `AJILEI_MED-1a_T2_v1.0.md`. **Base:** `72080a6` (la tanda 1 publicada, con la migración aplicada y la función `partida` con el Contrato v1.6). **Fecha:** 2026-11-17.
- **Diseño:** `docs/reportes/AJILEI_MED-1a_Fase0_Informe_v1.0.md`, §B.3, §B.4, §C y §G, y «Lo que hereda la tanda 2» de `AJILEI_MED-1a_T1_Informe_v1.0.md`.
- **Estado:** tramos A, B y C hechos, con su control rojo y su control verde. El túnel de Victor salió verde en la segunda vuelta, contra `vite preview` (§6). Faltan los commits, con el visto bueno del mapa, y el push. Sin migración y sin deploy.

---

## Resumen

| Pieza | Qué hace | Dónde |
|---|---|---|
| `origen` | Lee los `utm_*` y `?sala=` antes de que `App` limpie la barra, los guarda (primer toque, 30 días) y los escribe en el `insert` del Bautizo, con la zona horaria del aparato | `src/lib/origen.js` · `src/main.jsx` · `src/lib/perfilApi.js` · `src/hooks/useAuth.js` |
| El latido | `latido_sesion` cada 60 s con la app visible; se para con la app oculta; menos de 5 min oculta sigue la misma sesión | `src/hooks/useLatidoSesion.js` · `src/App.jsx` |
| La reconexión | `pvp_reconexion` con `via: 'arranque'` (la recarga a media partida) y con `via: 'canal'` (el canal que vuelve tras perderse) | `src/lib/eventos.js` · `src/App.jsx` · `src/lib/partidaCliente.js` |
| INV-12 | 20 claves y 16 accesores, con `ajilei.origen` | `scripts/testClavesAlmacen.test.js` |

Las tres piezas son invisibles para el jugador. Se apagan con el bypass, y con él la simulación, por la misma guardia que el alta del perfil. Ninguna puede romper nada: una RPC que devuelve `false` o falla se ignora, sin reintento ni cola.

---

## 1 · `origen` (tramo A)

**`src/lib/origen.js`** es puro y no lleva React:
- `recogerOrigen(search, ahora)` se llama desde `main.jsx` antes de `createRoot`.
- `origenParaPerfil(ahora)` da `{ origen, origen_datos }` para el `insert`.
- `olvidarOrigen()` borra la clave tras un Bautizo con éxito.
- `normalizarCampana(texto)` está exportada para probarla contra la base.

Todo va protegido: sin `localStorage`, sin `Intl` o con un almacén que lanza, el resultado es `directo` y nada se rompe.

**`origen`:**
- `utm:<campaña>` si hay `utm_campaign`, o `utm_source` si es lo único que hay.
- Si no hay campaña, `invitacion` cuando hay `?sala=`.
- Si no hay nada, `directo`.

Lo guardado que no cumple el formato, por ejemplo tocado a mano, no vale y se recoge de nuevo.

**`origen_datos`:**
- los `utm_*` que vengan, en minúsculas y con 60 caracteres como máximo;
- `sala`, con 20 como máximo;
- `zona_horaria` en bruto;
- `idioma`;
- `llegada`.

Con todo lleno pesa menos de 800 bytes, frente al tope de 2 KB.

**Decisiones que la ficha no fijaba:**
- **La campaña pasa por NFD antes de filtrar:** «Día de la Madre!» queda `diadelamadre`, no `dadelamadre`. Si la campaña queda vacía tras normalizar, el origen es `directo`, porque `utm:` vacío no pasa el check.
- **El reintento del Bautizo** (`insertarPerfil`, en `useAuth.js`) se repite una vez sin `origen` ante **cualquier** 23514, no solo el del check de `origen`.
  - El código del error no distingue el check del nombre del de origen, y comparar el texto del mensaje va contra la doctrina de `useAuth` de comparar por código.
  - Si el rechazo era del nombre, el segundo intento falla igual y se traduce como siempre. Cuesta una petición de más, y solo con un nombre que el campo ya debería frenar.
- **`recogerOrigen` también se apaga con el bypass**, en `main.jsx`, para que las varas de 5173 no escriban `ajilei.origen`.
- **`limpiarAparato`, al eliminar la cuenta, ya borra `ajilei.origen` sin tocarlo:** borra toda clave `ajilei.*`.

**Pruebas:** `src/lib/origen.test.js`, 26 pruebas, más el censo de INV-12.
- **El normalizador se compara con la expresión regular leída de la migración**, no copiada. Prueba los casos de la ficha (`Ola0-Test`, `Día de la Madre!`, 60 caracteres, vacío) y mil textos al azar.
- **Rojo** con el código de `72080a6`:
  - la prueba no carga, porque `./origen` no existe;
  - el censo da 2 rojos con el censo nuevo (las claves que ya no están en el código) y otros 2 con el censo viejo y el código nuevo (la clave intrusa y el accesor no censado).
- **Rojo** con funciones vacías: caen 20 de 26. Siguen verdes:
  - la que lee el check de la migración;
  - «no rompe sin almacén»;
  - las 4 de `insertarPerfil`. Dos de ellas son rojas con un `insertarPerfil` sin reintento; todas lo son en `72080a6`, donde no existe.

## 2 · El latido (tramo B)

`crearLatido`, en `src/hooks/useLatidoSesion.js`, es lo que se prueba, con el reloj falso y sin jsdom. El hook `useLatidoSesion(uid)` se limita a envolverlo. `App` lo monta con la condición de `marcar_ingreso` (`uidCompleto`: la cuenta con perfil y billetera) y con `AUTH_BYPASS ? null : uidCompleto`.

**El comportamiento:**
- primer latido inmediato y después cada 60 s;
- parado con la app oculta;
- al volver, el mismo id si estuvo oculta menos de 5 min y uno nuevo si fue más;
- un `false` de la base da id nuevo en el siguiente latido;
- un fallo de red no lanza, no reintenta y no cambia el id.

**Tras la primera vuelta del túnel** (§6), el rector pidió tres cosas, ya hechas:
1. **La sesión es de la carga de la página, no del componente:** vive en el módulo (`sesionPara(uid)`), así que ningún remontaje abre otra. Una recarga evalúa el módulo de nuevo y es sesión nueva; otra cuenta, también.
2. **Al volver a verse, late en el acto** y la cadencia arranca de ahí, aunque el reloj siguiera en marcha porque no llegó el `hidden`. La base ignora lo que llegue a menos de 20 s.
3. **Volver sin hora de ocultación conserva el id.**

**Pruebas:** 16 en `src/hooks/useLatidoSesion.test.js`.
- **Rojo** con el código de `72080a6`: no carga, porque el módulo no existe.
- **Rojo** con un latido vacío: caen 10 de las 12 primeras.
- **Rojo** con uno que late siempre (sin pararse oculto y sin mirar el `false`): caen 7.
- **Rojo de los cambios del túnel**, con el latido de antes y un id nuevo en cada montaje (lo que hacía el `useRef`): caen 3, «`visible` sin `hidden`», `sesionPara` y «remontaje».
  - La cuarta prueba nueva, «volver tras un bloqueo corto late en el acto», ya pasaba con el código de antes. Confirma que la anomalía (b) de la primera vuelta no venía del latido (§6).

## 3 · La reconexión (tramo C)

**`src/lib/eventos.js`** (17 líneas) **no estaba en la lista de la ficha. El rector lo aprobó en el STOP-T, en la letra 2-c.** Tiene dos funciones:
- `registrarEvento(cliente, tipo, datos)` dispara y olvida: llama a `then` (PostgREST no sale sin él) y se traga el rechazo;
- `reconexionAlArrancar(cliente, mesa)` anota solo si la mesa trae la partida viva (`estado === 'activa'`).

Existe porque `App.jsx` no se puede probar sin jsdom, y meter `partidaCliente` en `App` lo subiría a la primera descarga.

- **El arranque** (`App.jsx`, la rama `(1) · ya sentado` del arranque de las salas): `mi_sala` devuelve la mesa con la partida viva, y eso es una recarga o una reapertura a media partida. El paso normal desde `SalaEspera` no pasa por ese arranque.
- **El canal** (`partidaCliente.js`, el `subscribe` de `abrirCanal`): `SUBSCRIBED` después de haberse perdido. La primera suscripción no cuenta, y los errores antes de ella tampoco.
  - La marca se crea en cada `abrirCanal`, así que el `iniciar` que repite StrictMode empieza de cero.
  - La opción nueva `medir` de `crearClientePartida` está apagada con el bypass por defecto; las pruebas la encienden a mano.
- **realtime-js 2.112.4 vuelve a emitir `SUBSCRIBED` al reunirse.** El callback cuelga del `receive('ok')` del empuje de unión (`node_modules/@supabase/realtime-js/dist/main/RealtimeChannel.js:163-171`), y al reunirse se reenvía ese mismo empuje.

**Pruebas:** 6 nuevas en `src/lib/partidaCliente.test.js` y 5 en `src/lib/eventos.test.js`.
- **Rojo** con el `partidaCliente` de `72080a6`: caen las 3 emisiones por el canal, y `eventos.test.js` no carga.
- **Rojo** si se emite en cada `SUBSCRIBED`: caen 5.
- **Rojo** si el arranque emite con cualquier mesa: cae «mesa en espera: nada».
- **Rojo** sin el manejador del rechazo: vitest da «Unhandled Rejection» y la corrida sale con error.

## 4 · El grafo y el peso

- **Grafo estático** desde `GameTable.jsx`, `RetarIAS.jsx` y `PantallaChips.jsx` (111 archivos, con el criterio de la Fase 0 §G): **ninguno** de los 8 archivos de código tocados o nuevos lo monta la mesa contra las IAS. Los dos de control, `salaPendiente.js` y `FilaChips.jsx`, sí salen; no se tocaron.
- **`1.8b`: 177,9 → 178,9 KiB en el cable (+1,0 KiB).** La Fase 0 estimó de +0,6 a +1,0. Meta 185 y techo 200. Lo nuevo en la entrada es `origen.js`, `useLatidoSesion.js` y `eventos.js`; `partidaCliente` sigue en su trozo.

## 5 · Los controles del §6

| Vara | Resultado |
|---|---|
| eslint | 0 errores / 0 avisos |
| vitest | 112/112 archivos, 3.038 pruebas, 0 fallidas, 0 omitidas |
| build | compila |
| 1.8b | 178,9 KiB (177,9 en `72080a6`) |
| pvp.mesa | verde, aislamiento verde: 144 contextos, 0 llamadas a Supabase |
| pvp.lm | verde, aislamiento verde: 398 contextos, 0 llamadas a Supabase |
| mesaia (la pasada de `aislamiento`) | verde 12/12, `supabaseAtendidas: 0`, 0 escapadas: con el bypass, el latido no sale |

**Cada letra construye sola.** Se probó con commits sueltos hechos con un índice temporal, sin tocar la rama, y `npm run aislado -- <sha> --perfil=rapido`:

| Letra | Resultado |
|---|---|
| 2-a | verde, 110 archivos y 3.011 pruebas |
| 2-b | verde, 111 archivos y 3.027 pruebas, con un `App.jsx` intermedio que solo lleva el latido |
| 2-c | verde, 112 archivos y 3.038 pruebas |
| 2-d | verde, 3.038 pruebas; su árbol es el del directorio de trabajo |

eslint da 0/0 en las cuatro, y `git worktree list` una línea al acabar.

Mientras el servidor de desarrollo de Victor ocupaba el 5173 para el túnel, las tres varas largas corrieron con `diagDSK` directamente en los puertos 5175 y 5176: el mismo modo y el mismo `dist/`. El orquestador no pasa puertos.

## 6 · El túnel de Victor

**Primera vuelta, contra el servidor de desarrollo** (`npm run dev` sin bypass, en el 5173):
- **T-1, perfecta:** `origen = 'utm:ola0-test'`, el `origen_datos` completo con `zona_horaria = 'America/Chicago'`, y la fila borrada en cascada con «Eliminar cuenta».
- **T-2** dejó sesiones de más:
  - dos nuevas con 4 s de diferencia (22:20:48 y 22:20:52);
  - aparentemente, ningún latido tras el bloqueo corto.
- **T-3** dejó dos filas `arranque` y ninguna `canal`. El Motorola, al salir del modo avión, pasó por «Cargando», la pantalla en blanco, el lobby y la mesa: una recarga entera.

**La causa: el cliente de Vite del servidor de desarrollo.** No fue nuestro código ni el Chrome del teléfono.
- Al perder su socket, el cliente de Vite sondea el servidor y, cuando vuelve, llama a `location.reload()` (`node_modules/vite/dist/client/client.mjs:991-998`).
- Bloquear el teléfono o perder la red corta ese socket.
- En `src/` no hay ninguna recarga ligada al canal:
  - las únicas son «Reintentar» de la tarjeta sin red (`useAuth.js:323`, solo con un toque) y un trozo que ya no existe (`main.jsx:65`);
  - `mesaPvPCore.js:245-254` solo arranca y para la partida al montar y desmontar.
- La consulta de T-2 llevaba `limit 3` y escondía la primera sesión. La predicción era una cuarta fila que acabara unos segundos antes de las 22:13:34. **Cuadró:** S0 de 22:09:21 a 22:13:31, con 5 latidos.
- Así, las filas se explican enteras:
  - S0 son el lobby y la vuelta del bloqueo de 1 min;
  - S1, a las 22:13:34, es la recarga de Vite;
  - S2, a las 22:20:48, es la vuelta tras 6 min, con id nuevo como se diseñó;
  - S3, a las 22:20:52, es otra recarga de Vite.

**Segunda vuelta, contra `vite preview` en el 4173** (`npm run build`, `npx vite preview --port 4173 --strictPort` y `cloudflared` contra el 4173), **verde en las tres:**
- **T-1:** el mismo resultado: `utm:ola0-test`, `origen_datos` completo con `America/Chicago`, y la cascada al eliminar la cuenta.
- **T-2:** dos sesiones de `test1976`:
  - una de 23:31:31 a 23:36:43 con 6 latidos: el bloqueo de 1 min no la cortó;
  - otra nueva a las 23:42:54 con 2.
- **T-3:** dos filas `via: 'canal'` en la sala `a1b5655d` y ninguna `arranque`:
  - `test1976` a las 23:48:20, por bloquear y desbloquear el S25 sin recargar;
  - `ticotest2022` a las 23:49:54, por 60 s de modo avión.

  El camino `arranque` ya quedó probado en la primera vuelta, con la recarga real del S25 de las 22:27:27.
- **T-4**, con el bypass: sin llamadas nuevas. Lo confirman las varas del §5, que corren con el bypass y dan 0 llamadas a Supabase.

## 7 · Lecciones

- **El servidor de desarrollo recarga la página al perder su socket** (`client.mjs:991-998`). Toda prueba por túnel que implique bloquear el teléfono o perder la red va **contra `vite preview` en el 4173, nunca contra `npm run dev`**. Si no, las recargas de Vite se hacen pasar por defectos del producto: sesiones de más y reconexiones que en realidad son arranques.
- **Una consulta de comprobación sin `limit`, acotada por la hora de empezar.** El `limit 3` escondió la fila que explicaba T-2.
- **Realtime late cada 25 s** (`RealtimeClient.js:12`) y solo nota el corte cuando le falta una respuesta. Para provocar un `canal`, mejor 60 s de modo avión que 10 s sin Wi-Fi, que además pasa a los datos móviles.
- **Bloquear y desbloquear el teléfono con la mesa abierta también deja un `canal`** (la fila de `test1976` en T-3). Es una pérdida real del canal, no un error de la medición; cuenta como reconexión, y la consulta 10 separa por `via` (§8).

## 8 · Lo que hereda la tanda 3

**Las doce consultas guardadas** son las once de la Fase 0 §D más «origen y país de las cuentas nuevas». Se nombran «MED · <nn> · <pregunta>» y su texto vive también en `supabase/consultas/med_*.sql`:

| # | Consulta | Fuente |
|---|---|---|
| 01 | Cuentas nuevas por día, y el embudo código → nombre | `auth.users`, `profiles` |
| 02 | Activos por día (entró / jugó) | `eventos` `ingreso` ∪ manos |
| 03 | Manos contra las IAS, total y por activo | `mesas_ia` |
| 04 | Manos contra humanos, total y promedio por partida | `partida_asientos`, `partidas` |
| 05 | Retención D1/D7/D30 | `profiles` + la 02 |
| 06 | Tiempo medio de sesión | `sesiones` (`ultimo_latido − inicio`), fuera las de menos de 30 s |
| 07 | Tapetes comprados | `inventario`, `movimientos` |
| 08 | «Mano actual» antes y después de las 20 | `consultas`, `movimientos` `'consulta'` |
| 09 | Partidas PvP por tamaño, apuesta, entrada y ritmo | `partidas`, `salas`, `partida_asientos` |
| 10 | …con reconexiones y recargas | `eventos` `pvp_reconexion` (`via`, `sala`), `movimientos` `'recarga_pvp'` |
| 11 | La pausa de anuncio: cuántos omiten y a qué segundo | `eventos` `anuncio_*`; un `anuncio_inicio` sin cierre cuenta como «no volvió» |
| 12 | Origen y país de las cuentas nuevas | `profiles.origen`, `origen_datos` (`zona_horaria`: `America/Caracas` = Venezuela), `pais` |

Además:
- **Vigilancia:** `medicion_invalida` debe ser siempre 0; una fila es un defecto del árbitro que mirar.
- **Cloudflare Web Analytics por el panel** (Fase 0 §E, opción (a)): no toca `dist/` ni `1.8b`. Se comprueba `beacon.min.js` en el código fuente de ajilei.io.
- **Lo que salió en esta tanda:**
  - la 10: el bloqueo de pantalla con la mesa abierta, que deja un `canal` (§7), **sí cuenta como reconexión** (decisión del rector en el STOP-C); la consulta separa por `via`;
  - la 06 mide la sesión de la carga de la página, y una recarga abre otra;
  - `latido_sesion` sigue sin tope de sesiones nuevas por cuenta (nota de la tanda 1, sin acción).
- **Las cuentas anteriores a MED-1a** tienen `origen` nulo, que las consultas leen como «previo».
