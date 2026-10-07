# AJILEI · ECO-1 · Fase 0 — Informe del diagnóstico del saldo persistente · v1.0

**Ficha:** `AJILEI_ECO-1_Fase0_v1.1.md` · **Ejecutor:** Claude Code · **Rector:** Claude (chat) · **Decisor:** Victor
**Base:** `main` en `eb378b0` · **Fecha:** 2026-10-06
**Naturaleza:** solo lectura. Este archivo es la única escritura en el repo. No hubo SQL, ni `db push`, ni consultas contra la base real, ni servidores (vite / preview) ni arnés de navegador.

---

## 0. Resumen en cinco líneas

1. **Hoy no existe dinero de verdad en ningún lado.** El cliente arranca de `SALDO_PROVISIONAL = 5000` (`src/lib/saldo.js:50`) y el servidor responde `select 5000` (`supabase/migrations/20260905203158_sal_a_salas.sql:315-321`). Además hay **dos saldos de cliente que no se hablan**: vs-IA usa `saldoSesion` (`src/App.jsx:206`), PvP llama a `saldoDelJugador()` directamente y ve siempre 5.000.
2. **Ganarle a las IAS acuña mucho, y casi todo sale de la mesa de 5.** El conductor `mañoso` (la maña de Victor transcrita) gana ~la mitad de las mesas de 5 en los tres retos y acuña de **8.600 a 42.000 HC por hora** según reto y entrada (de 1,7 a 8,4 packs de 5.000 HC por hora). En mesa de 2 está entre −8.200 y +4.200 HC/h. Los conductores `aleatorio` y `pasivo` pierden siempre y mucho.
3. **El rake no contiene la acuñación; un tope diario sí, pero muerde justo al jugador hábil.** Un rake del 3/5/8 % le quita al `mañoso` solo el ~4/6/10 % de lo que acuña. Un tope de 25.000 HC/día le cuesta 10–20 % en Básico, 18–58 % en Avanzado y 44–79 % en Pro (mesa de 5, 1 h/día). A los jugadores malos ninguna válvula les cuesta nada, porque no ganan.
4. **La liquidación recomendada es la (a):** mesa abierta en el servidor, la entrada sale del saldo al sentarse, las recargas también, y el cierre es idempotente y topado por el techo de §D. La (b) (liquidar solo al salir) deja jugar sin perder nunca: basta matar la app en las mesas que van mal.
5. **Hay diez preguntas para el rector en §M.** Tres son contradicciones entre la ficha y el código: el bono es 1.200 en el código y 2.500 sellado; el video vale 25 HC con tope de 5 en `ajileiConfig` y 500 con tope de 8 en S11; y K-9 («en PvP las fichas son el saldo real») no consta decidido en los informes de MOT-1. Además, una IA recién quebrada podría «revivir» al nivelarla en una recarga (leído en el código, sin reproducir).

---

## 1. Método, alcance y lecturas

- **Lectura por bloques:** A–J y P se leyeron en paralelo con cinco auxiliares de solo lectura. Las citas que sostienen conclusiones de dinero las re-verifiqué a mano: `src/lib/saldo.js:40-54`, `src/App.jsx:186-206` y `:536-576`, `src/config/salas.js:40-72`, `src/hooks/mesaCore.js:286-336`, `src/components/GameTable.jsx:1128-1152` y `src/engine/gameEngine.js:500-560` y `:660-680`.
- **Protegidos** (lista canónica `docs/AJILEI_Protegidos_v1.0.md:72-79`, versión interna v1.6, seis archivos): se **leyeron** `src/engine/gameEngine.js` (`:500-560`, `:660-680`, más citas puntuales) y `src/engine/deck.js` (solo grep). `src/engine/aiPlayer.js` no se abrió: lo ejecuta el banco por su API pública. No se editó ninguno.
- **Simulación del bloque E:** `scripts/bancoNiveles.mjs` tal cual, sin una línea cambiada. Toda la salida fue a una carpeta fuera del repo (el scratchpad de la sesión: `--volcado` y `--barrido` con rutas relativas `../../../../AppData/...`). Detalle en §E.0.
- **Las citas del informe de la Fase 0 de MOT-1 a líneas del motor están envejecidas** (cita `gameEngine.js` con 548 líneas; hoy tiene 748). Aquí solo se citan líneas del árbol actual.

---

## A · El saldo hoy, en el cliente

### A.1 Fuente provisional

| `archivo:línea` | L/E | Cifra | Origen |
|---|---|---|---|
| `src/lib/saldo.js:50` | define | `SALDO_PROVISIONAL = 5000` | constante |
| `src/lib/saldo.js:52-54` | L | `saldoDelJugador()` → 5000. Es síncrona; el comentario de `:37-41` avisa de que mañana será asíncrona | `:50` |
| `src/App.jsx:206` | nace | `saldoSesion = useState(() => siembraAPU()?.saldo ?? saldoDelJugador())` | 5000, o `?apu=saldo:n` en desarrollo |

### A.2 Los consumidores de `saldoDelJugador()` (grep completo de `src` y `scripts`)

| `archivo:línea` | Uso |
|---|---|
| `src/App.jsx:24`, `:206` | Valor inicial de `saldoSesion` |
| `src/screens/Lobby.jsx:31`, `:187` | Respaldo: `saldo ?? saldoDelJugador()` |
| `src/screens/SalaOpciones.jsx:9`, `:60` | `const saldo = saldoDelJugador()` → **5000 fijo** |
| `src/screens/ArmarMesa.jsx:17`, `:77` | Ídem |
| `src/screens/SalaEspera.jsx:13`, `:94` | Ídem |
| `src/screens/PartidaPvP.jsx:8`, `:25` | Ídem |

**Hallazgo A-1, dos saldos.** Tras perder 2.500 contra la IA, la píldora del Lobby y de Retar dice 2.500 y las cuatro pantallas PvP siguen diciendo 5.000 (también `saldo_de()` del servidor). ECO-1 tiene que unificar las dos fuentes en una sola.

### A.3 `saldoSesion` en `App`

| `archivo:línea` | L/E | Qué hace |
|---|---|---|
| `src/App.jsx:206` | nace | ver A.1 |
| `src/App.jsx:571` | **E (resta)** | `setSaldoSesion(p => p - elegida.entrada)`, dentro de `startTransition`, al pulsar «Retar» (`:569` marca la entrada antes). Sin piso en 0: se fía de la validación de Retar |
| `src/App.jsx:542` | **E (resta)** | `onRecargar = monto => Math.max(0, p - monto)` |
| `src/App.jsx:543-547` | **E (suma)** | `onLeave(fichas)`: `p + (Number.isFinite(fichas) ? fichas : mesa.entrada)`, y vuelve a `retar-ias` |
| `src/App.jsx:541`, `:556`, `:589` | props | a `GameTable`, `RetarIAS` y `Lobby`. Las pantallas PvP (`:457-512`) no lo reciben |

### A.4 «Retar a las IAS»

| `archivo:línea` | Qué |
|---|---|
| `src/screens/RetarIAS.jsx:78` | recibe `saldoSesion` |
| `RetarIAS.jsx:92-93` | `MEMORIA_RETO.leer(saldoSesion)`: una apuesta recordada que ya no alcanza se cae |
| `RetarIAS.jsx:117-118`, `:133` | `opcionesEntrada`, `topeEntrada` y `pasoEntrada` contra el saldo |
| `RetarIAS.jsx:140` | `avisoDeSaldo(saldoSesion, reto)`, casos 0/1/2 de RET-A |
| `RetarIAS.jsx:144`, `:150`, `:160` | `entradaDeLaSesion` → aviso «No te alcanza: tienes {saldo} HC» |
| `RetarIAS.jsx:182` | `PantallaChips saldo={saldoSesion}` (la píldora) |
| `RetarIAS.jsx:245` | `opcionesApuesta(reto, saldoSesion)`: la mesa va en gris si `saldo < pisoDe(apuesta)` |
| `RetarIAS.jsx:51-72`, `:339-345` | `AvisoSaldo` y «Conseguir más monedas» (`data-accion="mas-monedas"` en `:67`, `onClick={pronto}` en `:68`) |
| `src/screens/retarCore.js:91-92` | `alcanzaMesa`: `saldo >= pisoDe(apuesta)` |
| `retarCore.js:124-126`, `:145-159` | `CASO_ALCANZA` = 0, `CASO_RETO_MENOR` = 1, `CASO_SIN_MESA` = 2; `avisoDeSaldo` (hoy el caso 2 equivale a «saldo < 500», `:156`) |
| `retarCore.js:226-231`, `:238-241`, `:257-268`, `:283-288`, `:299-303` | `opcionesApuesta`, `topeEntrada`, `opcionesEntrada`, `pasoEntrada`, `entradaDeLaSesion` |

### A.5 Mesa y tarjeta de recarga

| `archivo:línea` | Qué |
|---|---|
| `src/components/GameTable.jsx:306` | props `saldo = 0`, `onRecargar`, `onLeave` |
| `GameTable.jsx:1124`, `:1128-1129` | `pideRecarga(game, saldo)`, `tarjetaRecarga(human.chips, unit, saldo)`, `topeRecarga(...)` |
| `GameTable.jsx:1131-1152` | `confirmarRecarga`: valida (`:1132`), aplica al humano (`:1146`), **nivela a las IAS** (`:1147`), `onRecargar(monto)` (`:1150`) |
| `GameTable.jsx:2474-2479` | botón «Recargar» voluntario |
| `GameTable.jsx:2716-2725`, `:2752` | subtítulos «Quedan {hc}», «Hasta {hc}» y el del caso 3 (`ia.recarga.sub.sinsaldo`) |
| `src/hooks/mesaCore.js:157-162` | `topeRecarga = min(techo − pila, floor(saldo/unit)·unit)` |
| `mesaCore.js:170-177` | `recargaValida` (motivo `sin_saldo`) |
| `mesaCore.js:224-229` | `saldoUsable`, `hayRecarga` |
| `mesaCore.js:231-235` | `CASOS_RECARGA`: `FILA` = 1, `TODO` = 2, `SIN_SALDO` = 3 (los tres casos de REC-2) |
| `mesaCore.js:252-264` | `tarjetaRecarga` / `armarTarjeta` |
| `mesaCore.js:296-310` | `pideRecarga`: la forzosa sale aunque no haya saldo (`:290-294`) |
| `mesaCore.js:327-335` | `nivelarLasIAS` → `nivelarIA` (`src/engine/entrada.js:85-87`) |

### A.6 Las salidas

Todas pasan por `salir = () => onLeave?.(human.chips)` (`GameTable.jsx:472`).

| Vía | `archivo:línea` | Cifra |
|---|---|---|
| ✕ de cabecera → «¿Abandonar la mesa?» → `salir()` | `GameTable.jsx:2154` → `:2700-2716`. Lleva `// TODO: sync balance to Supabase (Step 7)` en `:2712`. A mitad de mano, lo puesto en el pozo se pierde («Perderás el progreso de esta mano», `:2704`) | `human.chips` |
| «Salir con mis fichas» (forzosa rechazada o vencida) | `rechazarRecarga` en `GameTable.jsx:1155-1165`; botón en `:2812` (texto `ia.recarga.no.forzosa`, `src/config/textos.es.js:366`); vencimiento en `:1298` | `human.chips` |
| Victoria (`PantallaVictoria onLeave={salir}`) | `GameTable.jsx:2173-2180`; botón en `src/components/Celebracion.jsx:409` | `human.chips` |
| Derrota / bancarrota («Salir de la mesa») | `GameTable.jsx:2181-2195`; casi inalcanzable, porque la forzosa bloquea «Siguiente mano» (la pantalla de bancarrota la retiró ARN-3d, `:1117`, `:1159-1161`) | `human.chips` |
| «Te llevas N HC» | **No existe como salida.** Solo es la crónica de pozos partidos, `src/hooks/cronicaCore.js:203` | — |

### A.7 `PantallaVictoria` y «Saldo actual»

`GameTable.jsx:2175-2176` le pasa `netas = fichasNetas(human.chips, human.entrada)` y `saldo = human.chips`. **«Saldo actual» es la pila de la mesa, no el bolsillo.** `Celebracion.jsx:179-187` cuenta desde la entrada hasta las fichas y lo pinta en `:280-285`.

### A.8 Cabecera

- `src/components/BarraSuperior.jsx:80-93`: píldora `.lob-pildora` con `BalanceDisplay chips={montoTexto(saldo)}` y el comentario «PROVISIONAL… ECO-x» en `:81`.
- `BarraSuperior.jsx:94`: el «+» dorado (`.lob-mas`, `data-accion="tienda"`) llama a `onTienda`, que en las seis pantallas es un toast «Pronto» (detalle en §P.1).

### A.9 Salas PvP

| `archivo:línea` | Qué (siempre con saldo 5.000) |
|---|---|
| `src/screens/SalaOpciones.jsx:108`, `:296-300`, `:323-332` | `ordenarMesas`, clase atenuada `is-fuera`, «Te faltan {faltanPara} HC» |
| `src/screens/ArmarMesa.jsx:85`, `:105`, `:139`, `:240` | memoria, orden, `otraMesaAlAlcance`, chips apagados |
| `ArmarMesa.jsx:186-187` | error del servidor `saldo_insuficiente` → «Necesitas {5×} HC…» |
| `ArmarMesa.jsx:122`, `:244-253` | aviso a invitados nuevos: `fueraDelAlcanceDeNuevos(apuesta, BONO_BIENVENIDA)` y `ALCANCE_NUEVOS` |
| `src/screens/SalaEspera.jsx:94`, `:481` | solo la píldora |
| `src/screens/salasCore.js:61-62`, `:71-73`, `:104-111`, `:135-138`, `:170-180`, `:196-197` | reglas puras |

### A.10 Almacenamiento

**Ninguna clave de `localStorage`/`sessionStorage` guarda dinero** (censo en `scripts/testClavesAlmacen.test.js:20-31`).

| Clave | Relación con el dinero |
|---|---|
| `ajilei.retoConfig` (`retarCore.js:20`) | guarda la apuesta; se normaliza contra el saldo al leerla. La entrada no se guarda (`src/config/memoriaChips.js:10-13`) |
| `ajilei.salaConfig` (`src/config/salas.js:170`) | ídem para PvP |
| `ajilei.tapetes.comprados` (`src/config/tapetes.js:88`) | **propiedad «comprada» sin cobro**: «SIN DESCUENTO DE SALDO… nace con Supabase (ECO-1)» (`src/hooks/useTapetes.js:100-109`) |
| `ajilei.recargaPorChunk` (`src/main.jsx:40`) | homónimo: recarga de la página |
| `ajilei.consultas` (`src/config/consultas.js:11`) | homónimo: «saldo» de consultas |

### A.11 Cifras de dinero escritas a mano

**Saldo, bono o pila del jugador:**

| `archivo:línea` | Cifra | Qué es |
|---|---|---|
| `src/lib/saldo.js:50` | 5000 | bolsillo provisional |
| `supabase/migrations/20260905203158_sal_a_salas.sql:315-321` | 5000 | `saldo_de` (servidor) |
| `src/config/salas.js:44` | **1200** | `BONO_BIENVENIDA` (**contradice S1 = 2.500**, ver §M-1) |
| `src/config/salas.js:71` | → [100, 200] | `ALCANCE_NUEVOS`, derivado del bono y de la regla 5× |
| `src/config/ajileiConfig.js:202` | 5000 | `economy.pilaPruebas`: pila del banco y de las pruebas (`gameEngine.js:84`, `sesionCore.js:66-67`) |
| `src/config/ajileiConfig.js:203` | 50 | `bonoDiario`, **sin lectores** |
| `src/config/ajileiConfig.js:204-205` | 25 / 5 | `videoReward` / `maxVideosPerDay`, **sin lectores** (**contradicen S11 = 500 y 8**, §M-2) |
| `src/hooks/coreografiaCore.js:50-51` | 1000 / 25000 | `CONTEO_PISO` / `CONTEO_TECHO` de la animación («5 asientos × 5000») |
| `src/config/tapetes.js:38`, `:45`, `:52`, `:59`, `:66` | 0 / 10.000 / 15.000 / 25.000 / 50.000 | precios de tapetes (hoy no cobran) |

**Parámetros de mesa (no son saldo):** apuestas por reto (`src/config/niveles.js:22`, `:29`, `:36`); `APUESTAS_PVP` (`salas.js:40`); `REGLA_ASIENTO = 5` (`salas.js:51`); `multiplicadores` [1,2,5,10] (`ajileiConfig.js:25`); `entrada` 10/20/50 (`:34`); `recarga` umbral 5 y 15.000 ms (`:38`); `factorPila` 1,5 (`:65`).

---

## B · El saldo hoy, en el servidor

Abreviaturas: **0001** = `0001_sup2a_identidad.sql`, **SALA** = `20260905203158_sal_a_salas.sql`, **A1** = `20260911043500_sal_b1_ajuste.sql`, **A3** = `20260911103000_sal_b1_ajuste_a3.sql`, **B2** = `20260911230935_sal_b2.sql` (todas en `supabase/migrations/`).

### B.1 Funciones que leen saldo o lo rodean

| Función | Vigente en | Qué devuelve | Permisos | Quién la llama |
|---|---|---|---|---|
| `saldo_de(p_uid)` | SALA:315-321 | `select 5000`, `stable`, `security definer`. Comentario «PROVISIONAL… ECO-1 lo sustituye» (`:323-324`) | revocada a todos (SALA:806) | solo `crear_sala` (A1:157) y `unirse_sala` (B2:143) |
| `regla_asiento()` | SALA:285-290 | 5 | revocada (SALA:805) | ídem |
| `salas_abiertas()` | B2:228-253 | lista de mesas; **no lee saldo** | `authenticated` | `src/lib/salasApi.js:188` |
| `crear_sala` | A1:128-199 | `public.salas` | `authenticated` | `salasApi.js:143-144` |
| `unirse_sala` | B2:51-174 | `public.salas` o NULL | `authenticated` | `salasApi.js:168-172` |
| `mi_sala()` | A1:346-373 | sala `esperando` o NULL | `authenticated` | `salasApi.js:191` |
| `ahora()` | SALA:300-305 | `now()` | `authenticated` (SALA:804, `:818`) | `salasApi.js:135` → `useCronometroSala.js:77` |

La única comparación con saldo del servidor es `if public.saldo_de(v_uid) < public.regla_asiento() * p_apuesta then raise exception 'saldo_insuficiente'` (A1:157-159 y B2:143-145). **Ni el bono ni `ALCANCE_NUEVOS` existen en el servidor**: son del cliente y solo sirven para un aviso (`salasCore.js:196-198`).

### B.2 `profiles`

- **Columnas** (0001:29-41): `id uuid` PK `references auth.users(id) on delete cascade`; `username` (CHECK `^[A-Za-z0-9_]{6,15}$`); `created_at`; `updated_at`. Hay un índice único sobre `lower(username)` (0001:46-47). **No tiene columna de saldo, idioma ni zona horaria.**
- **RLS** (0001:179-206): SELECT para todo autenticado (`using (true)`); INSERT y UPDATE solo del propio perfil (`auth.uid() = id`); no hay política de DELETE.
- **Quién lo crea:** el **cliente, directamente por PostgREST** y sin RPC: `useAuth.crearPerfil` (`src/hooks/useAuth.js:205-216`), invocado desde el Bautizo (`App.jsx:399`).
- **`normalizar_username`** (0001:67-76): `translate(lower(txt), '013457_', 'oieast')`.
- **Disparador** `profiles_validar_username_trg` BEFORE INSERT OR UPDATE (0001:166-168), que llama a `validar_username()` (`security definer`, 0001:134-164).
- **Disparadores sobre `auth.users`: ninguno** (grep de `on auth.`, `handle_new_user` y `after insert` sin resultados).

### B.3 ¿Existe ya algo de saldo, movimientos o bonos?

**No.** El grep de `saldo|balance|bono|movimiento|coins|\bhc\b|ledger|billetera|wallet` en `supabase/` solo encuentra las llamadas a `saldo_de` y comentarios («Nada de saldo: eso es ECO-1», 0001:19). Tablas existentes: `profiles`, `reserved_usernames`, `salas`, `sala_jugadores` e `intentos_codigo`. La copia del motor en `supabase/functions/sonda_mot1/` (ignorada, `.gitignore:129`) trae `saldoInicial: 5000`, pero no es esquema.

### B.4 El modelo de seguridad, en cinco líneas

1. **Todo por RPC.** Las tablas de salas no tienen políticas INSERT/UPDATE/DELETE (SALA:12-17, `:276-279`). La excepción es `profiles`, cuyo dueño hace INSERT y UPDATE desde el cliente (0001:190-202).
2. **RLS de solo lectura.** `profiles` usa `using(true)`; `salas` y `sala_jugadores` solo las ven sus miembros o si la sala es pública (SALA:256-274), mediante `es_miembro` y `es_sala_publica` (SALA:225-249). `intentos_codigo` no tiene ninguna política.
3. **`security definer` con `set search_path = ''`** y nombres calificados (0001:119-123; SALA:221-224). La identidad se toma siempre de `auth.uid()` dentro de la función (por ejemplo A1:140 y B2:61), nunca de un parámetro.
4. **`revoke … from public, anon` + `grant … to authenticated`** (SALA:782-827). Las funciones internas se retiran también a `authenticated` (SALA:801-809; A1:76).
5. **Errores como claves**: `raise exception '<clave>' using errcode='P0001'` (SALA:23-27), filtradas por la lista cerrada `CLAVES_ERROR` del cliente (`salasApi.js:44-54`, `:99-104`).

### B.5 El precedente de límite de frecuencia: `intentos_codigo`

- **Columnas** (SALA:184-187): `jugador_id` (FK a `profiles`, `on delete cascade`) e `intentado_en default now()`. **Sin PK a propósito** (SALA:182-183). Índice `(jugador_id, intentado_en)` (SALA:188-189). RLS sin políticas y fuera de Realtime.
- **Purga al pasar**, solo del jugador actual, de las filas de más de 1 h (B2:86-87).
- **Cuenta:** anota el intento (B2:89), cuenta los del último minuto y corta en `> 5` (B2:91-96).
- **Sin `raise` (S10/A1):** «código bien formado sin mesa viva» acaba en `return null` (B2:100-104, `:113-115`; razonamiento en A1:202-232), y el cliente lo traduce en `salasApi.js:168-172`. `demasiados_intentos` sí hace `raise` y deshace solo su propia anotación (A1:226-227). Ese NULL llega como **fila de nulos** y se detecta por `id` (`esMesa`, `salasApi.js:69-82`).

### B.6 Relojes

- **Servidor:** `ahora()` = `now()`. Todos los plazos usan `now()` (SALA:97; A1:104, `:120`; B2:87, `:93`, `:167`).
- **Cliente:** `src/hooks/relojCore.js` (`calcularDesfase` :55, `ahoraServidor` :85, `restante` :105, `comoReloj` :119). Lo consume de verdad `useCronometroSala.js:77` (SalaEspera). `useReloj.js:42-43` llama a `rpc('ahora')`, pero **no lo importa nadie**.

---

## C · Los momentos en que el dinero se mueve contra las IAS

**Hoy no hay ninguna llamada de red de dinero**, así que «qué pasa si falla la red» no aplica a ningún momento de hoy. Se describe lo que pasaría con ECO-1.

| # | Momento | Dónde | Qué viajaría al servidor | Red caída (con ECO-1) | Doble toque, hoy |
|---|---|---|---|---|---|
| C1 | Sentarse | `RetarIAS.jsx:189-194` → `App.jsx:569-574` (resta en `:571`, dentro de `startTransition`); mesa con `jugadoresVsIA` (`entrada.js:103-113`, llamada en `GameTable.jsx:342`) | reto, apuesta, nº de jugadores, entrada → id de mesa | Cobro hecho y mesa no montada (por ejemplo el chunk falla tras `marcarEntradaMesa`: `main.jsx:40-50` recarga la página). **Hoy el comentario de `main.jsx:33-34` («el saldo se lee de la base al volver») es falso.** Hace falta reconciliar: `mi_mesa_ia()` al volver | **Riesgo real, sin medir.** No hay ref ni bandera «enviando»: el botón solo se apaga con `!completo \|\| !veredicto.ok` (`RetarIAS.jsx:188`). Como la resta va en una transición, un segundo toque antes del commit restaría la entrada dos veces |
| C2 | Recarga (voluntaria `GameTable.jsx:2474-2481`; automática/forzosa por el efecto `:1179-1194`, guarda `recargaPedidaRef`) | `confirmarRecarga` (`GameTable.jsx:1131-1152`) → `aplicarRecarga` (`gameEngine.js:666-679`) + `nivelarLasIAS` (`mesaCore.js:327-335`) → `onRecargar` → `App.jsx:542` | id de mesa, monto → saldo nuevo, nº de recarga | Recarga aplicada en la mesa y no cobrada. Debe cobrarse **antes** de aplicarse en la mesa | `setRecarga(null)` desmonta la tarjeta, y React 19 vacía un evento discreto antes del siguiente, así que el doble toque humano cae sin tarjeta. **Dos clics en el mismo task** aplicarían dos veces, y `aplicarRecarga` no mira el techo (`:670-679`) |
| C3 | Salir (las cuatro vías de A.6) | `salir()` en `GameTable.jsx:472` → `App.jsx:543-547` | id de mesa, fichas → saldo nuevo | Pérdida de dinero si se cae al salir. El cierre tiene que ser reintentable e idempotente | Sin guarda. **Carrera posible:** el vencimiento del plazo de 15 s (`:1298`) llega por `setTimeout` (no es evento discreto) y un toque en «Salir» o en la ✕ en el mismo fotograma podría llamar dos veces a `salir`. Hoy cobraría dos veces |
| C4 | Recargar la página, cerrar o matar | — | — | ver abajo | — |
| C5 | Pantalla bloqueada (`useCongelado`) | `src/hooks/useCongelado.js:147-170` | nada nuevo | — | — |
| C6 | Dos pestañas o dos teléfonos | — | — | ver abajo | — |

**Ojo con `App.jsx:544`:** si `fichas` no es finito, App abona `mesa.entrada` entera. El servidor no debe copiar esa red de seguridad.

**C4 · Partida interrumpida.** De la mesa no queda nada: `mesa` es `useState(null)` (`App.jsx:190`) y el motor vive en un `useState` de `GameTable.jsx:327-344`. No hay `beforeunload` ni guardado en `pagehide` (el `pagehide` de `useCongelado.js:134` solo silencia el audio). El saldo vuelve a 5.000 (`App.jsx:201-202`). Lo único persistente es preferencia (`ajilei.retoConfig`, sonido, tapetes, idioma…). **Nada se puede reconstruir:** el barajado de producción usa `Math.random` (`deck.js:56-65`). **Hoy, perder a mitad de mesa y recargar la página borra la pérdida.** Con ECO-1 hace falta una política de abandono (§L).

**C5 · `useCongelado`.** Silencia Howler (`:58-64`), publica `congelado` y `congeladoRef`, y guarda un único hueco `diferir` (`:87-93`). Se congelan el reloj de turno (`GameTable.jsx:785-802`), la decisión de las IAS (`:977-1011`), el salto automático (`:1040`), el descarte (`:1069`), el reparto (`:1688`), «Siguiente mano» (`:2463`) y el plazo de recarga (`:1288`). No se congelan las secuencias ya en vuelo (`:1357`, `:1651`). **A oscuras no se mueve dinero.** Si el sistema mata la pestaña congelada, se aplica C4.

**C6 · Misma cuenta en dos sitios.** El grep de `BroadcastChannel`, el evento `storage`, `navigator.locks` y `SharedWorker` en `src` sale vacío. Hoy es inocuo: cada pestaña nace con su propio 5.000. Con ECO-1 serían dos mesas contra una misma billetera.

---

## D · Lo que el servidor puede comprobar sin motor: el techo de cobro

**Notación.** u = apuesta, n = jugadores, E = entrada, T = 50u (`techoDe`, `entrada.js:39-41`), P(x) = min(round(1,5·x), T) (`pilaIA`, `entrada.js:75-78`; `factorPila` 1,5 en `ajileiConfig.js:65`), r_k = monto de la recarga k, K = nº de recargas.

### D.1 Fórmula

**Máximo honesto exacto** (las fichas que hay en la mesa):

`E + Σ r_k + (n−1)·P(E) + Σ_k Σ_IA max(0, P(H_k) − a_{i,k})`

donde H_k es la pila del humano tras la recarga k (referencia de `nivelarLasIAS`, `mesaCore.js:328`) y a_{i,k} es la pila de cada IA viva en ese momento. Equivale a la suma de `entrada` de todos los asientos, porque `aplicarRecarga` sube `entrada` con cada ficha nueva (`gameEngine.js:676`).

**El servidor no conoce H_k ni a_{i,k} sin el motor.** Sí sabe que H_k ≤ T (lo exige `recargaValida`) y que a ≥ 0, y como P(·) ≤ T, la cota segura que puede calcular con sus propios datos es:

> **Techo = E + Σ r_k + (n−1)·P(E) + K·(n−1)·T**, con Σ r_k ≤ saldo al sentarse − E.

Las IAS eliminadas no vuelven ni se nivelan (filtro `!p.eliminated`, `mesaCore.js:332`; normativo v1.3 §5.3 y §6.10). Las fichas sobrantes de una IA eliminada se quedan en su `chips` (`gameEngine.js:515` conserva `...p`), así que no se pueden ganar: el máximo real queda por debajo de la cota, y la cota sigue siendo válida.

**Hallazgo D-1 (PLAUSIBLE, solo por lectura).** `eliminated` solo se escribe en `startHand` (`gameEngine.js:507-515`). Una IA que quiebra en la mano en curso sigue con `eliminated: false` durante PAYOUT, que es justo cuando se ofrece la recarga (`pideRecarga`, `mesaCore.js:297`). `nivelarLasIAS` la nivelaría y volvería con P(H). Ejemplo: mesa de 2 al piso; el humano deja a la IA en 0 y queda con 25u; si pulsa «Recargar» (voluntaria) 10u, la IA vuelve con min(52,5u, 50u) = 50u y la victoria no llega. Choca con «las eliminadas no vuelven». No lo reproduje (no se arrancó la app). La cota de arriba lo cubre igualmente. → §M-7.

### D.2 Qué datos necesita y si el servidor los puede guardar

- **Al sentarse:** reto, u, n, E. **Al recargar:** r_k y K. T y el factor 1,5 son constantes que el servidor tiene que espejar. El reto solo sirve para validar que u pertenece a `apuestasDe(reto)`. **Nada de esto necesita el motor.**
- **Validaciones que el servidor sí puede hacer:** E múltiplo de u, 10u ≤ E ≤ 50u, E ≤ saldo; r_k múltiplo de u, r_k ≤ saldo, r_k ≤ T.
- **Validaciones que no puede hacer:** pila + r_k ≤ T, que la recarga sea entre manos, el motivo de la recarga y el nivelado real.
- **Conservación de fichas:** no se impone en tiempo de ejecución; la vigilan pruebas (`scripts/testNivel2.test.js:1167`, `:1203`; `scripts/testPozos.test.js:211`) y el propio banco (la puerta (a) cuenta 0 fallos de conservación).

### D.3 Tres ejemplos

1. **Básico, mesa de 2, apuesta 50, entrada al piso.** E = 500, T = 2.500, P(E) = 750. Sin recargas: **techo = 1.250**, que coincide exactamente con el máximo honesto (+750).
2. **Avanzado, mesa de 5, apuesta 100, entrada al medio, con una recarga.** E = 2.000, T = 5.000, P(E) = 3.000 × 4 IAS = 12.000. Con el saldo provisional, tras sentarse quedan 3.000. Recarga automática con la pila en 400: `topeRecarga` = min(4.600, 3.000) = 3.000, y la tarjeta nace con el piso (`mesaCore.js:261-262`). Con r = 1.000: H = 1.400 y P(H) = 2.100.
   - Si las IAS están en (5.200, 4.000, 3.000, 1.400), solo sube la última (+700) y el máximo honesto es **15.700**.
   - **Techo del servidor = 2.000 + 1.000 + 12.000 + 1·4·5.000 = 35.000.** La holgura sale de no conocer H ni las pilas.
3. **Pro, mesa de 2, apuesta 200, entrada al techo.** E = 10.000 = T, P(E) = min(15.000, 10.000) = 10.000. **Techo = 20.000.** Con la pila en T no cabe ninguna recarga (`topeRecarga` = 0). Con el saldo provisional de 5.000 esta mesa no se puede abrir (`retarCore.js:238-241`, `:299-304`).

### D.4 Lo que el techo no cubre

- **Declarar que siempre se gana sin pasarse del techo.** La simulación (§E) lo agrava: **cada mesa que gana el `mañoso` sin recargas cobra exactamente (n−1)·P(E), que es el techo.** El techo no distingue un cliente alterado de un buen jugador; solo acota el daño por mesa. Distinguirlos exige estadística agregada (tasa de mesas ganadas por cuenta frente a la del `mañoso`, ~50 % en mesa de 5 y ≤77 % en mesa de 2).
- **Viabilidad temporal.** En mesa de 2 no se puede ganar todo en una mano (en una mano solo se gana lo igualado), pero el techo lo permite. Y en mesa de 5 el p10 de duración de las partidas del `mañoso` es de **2 a 5 manos**: un mínimo de manos o de tiempo frena poco.
- **Recargas en serie:** cada una suma (n−1)·T de holgura.
- **Mesas en paralelo (C6) y abandono sin salida (C4):** el techo es por mesa y no resuelve ninguno de los dos.
- **La acuñación por diseño** (normativo §12): el techo acota por mesa, no por día.

---

## E · La válvula: cuánto acuña ganarle a las IAS

### E.0 Cómo se midió

- **Banco:** `scripts/bancoNiveles.mjs` sin modificar, en modo `--barrido` (`:2322-2380`) con `--entrada` (`:202`), `--unit`, `--nivel` y `--j0` por celda. Celdas: 3 retos × mesas {2, 5} × entradas {10×, 20×, 50×} × conductores {`manoso`, `aleatorio`} = 36, más 18 de `pasivo` como referencia añadida (marcadas con *).
- **Pilas según S3:** el banco reparte con `entrada.pilaIA` (`bancoNiveles.mjs:405-419`), así que cada IA se sienta con min(round(1,5·E), 50u).
- **La apuesta no cambia el juego, solo la escala.** Con la misma semilla, la apuesta 100 y la 150 dieron partidas idénticas al dedillo (671 partidas, 350 ganadas, 38.062 manos y la misma tabla de duraciones; mesa 5 · Avanzado · 20×). Por eso se corrió todo a 100 y se escaló a la **apuesta media** de cada reto, tomando la 3.ª de sus cuatro apuestas, que es la más cercana a la media aritmética: **Básico 150, Avanzado 300 y Pro 600 HC.** Para otra apuesta del mismo reto, la cifra se multiplica por apuesta/150, /300 o /600.
- **La unidad de medida es la partida.** El banco no vuelca las partidas una a una, pero sí cuenta victorias y duraciones. Con `--manos 1` cada celda juega **exactamente una partida**, que acaba cuando el asiento 0 quiebra o es el último con fichas. Con 3.000 semillas fijas (**1…3.000**; `pasivo`, 1…1.500) hay 3.000 partidas por celda. El neto de una partida es exacto por conservación: si gana, +(n−1)·P(E); si quiebra, −E (con un residuo < 1 apuesta, `gameEngine.js:511`).
- **Comprobación cruzada:** una matriz grande con `--seed 11` (20.000 manos contadas por celda) da la misma media dentro del ruido. Por ejemplo, Básico·5·20× `mañoso`: 15.248 frente a 15.635 HC/100.
- **Hora = 80 manos.** La hora se reconstruye encadenando partidas remuestreadas (PRNG fijo, semilla 12345, 20.000 horas por celda), **y el dinero se apunta al cerrar la partida**, que es cuando llega al saldo.
- **Tiempo de máquina:** 2 × 257 s (las 3.000 semillas en dos tandas en paralelo), 174 s (`pasivo`), 62 s (matriz de comprobación). ~9 min de CPU. Volcados: 637 MB en el scratchpad, **nada dentro del repo**.

**Lo que el banco no modela (no se programó, regla 4):**
- No hay recarga: la partida acaba cuando el humano quiebra. En la app, la forzosa le deja seguir y además nivela a las IAS, lo que da más fichas que ganar.
- No hay salida temprana: el conductor juega cada mesa hasta el final. Retirarse cuando se va ganando no cambia la media por mano, pero sí la dispersión.
- No hay rake por pozo, porque el banco no vuelca el pozo que gana el asiento 0 en cada mano. Ver E.3.

### E.1 HC netas por cada 100 manos y por hora

«HC/100 por partida» es la tasa de cada partida (neto ÷ manos × 100). «HC/hora» usa ventanas de 80 manos. «Packs/h» divide la media por hora entre 5.000 HC. El precio de referencia es 5.000 HC por $1,99, así que 1 pack/h = $1,99/h.

#### Básico · apuesta media 150 HC

| Mesa | Entrada | Conductor | % mesas ganadas | Manos/partida media (p10/med/p90) | HC/100 manos · media | HC/100 por partida · p10 / med / p90 | HC/hora · media | HC/hora · p10 / med / p90 | Packs/h |
|---|---|---|---|---|---|---|---|---|---|
| 2 | 10× | mañoso | 29,1 % | 37,3 (12/26/78) | **−1.098** | −12.500 / −4.054 / 10.227 | **−878** | −4.500 / −750 / 2.250 | −0,18 |
| 2 | 10× | aleatorio | 0,6 % | 7,4 (3/6/14) | **−19.924** | −50.000 / −25.000 / −10.714 | **−15.939** | −19.500 / −16.500 / −12.000 | −3,19 |
| 2 | 10× | pasivo* | 13,6 % | 14,0 (3/11/29) | **−7.087** | −50.000 / −12.500 / 9.783 | **−5.669** | −10.500 / −6.000 / −750 | −1,13 |
| 2 | 20× | mañoso | 55,7 % | 75,6 (20/56/154) | **1.558** | −10.714 / 2.542 / 16.071 | **1.246** | −3.000 / 0 / 4.500 | 0,25 |
| 2 | 20× | aleatorio | 0,1 % | 12,7 (6/11/21) | **−23.509** | −50.000 / −27.273 / −14.286 | **−18.807** | −24.000 / −18.000 / −15.000 | −3,76 |
| 2 | 20× | pasivo* | 9,4 % | 22,3 (5/15/45) | **−10.309** | −60.000 / −18.750 / −2.965 | **−8.247** | −15.000 / −9.000 / −1.500 | −1,65 |
| 2 | 50× | mañoso | 76,8 % | 156,4 (39/125/307) | **2.568** | −7.500 / 4.237 / 15.306 | **2.054** | 0 / 0 / 7.500 | 0,41 |
| 2 | 50× | aleatorio | 0,0 % | 25,5 (13/24/40) | **−29.358** | −57.692 / −31.250 / −18.750 | **−23.487** | −30.000 / −22.500 / −15.000 | −4,70 |
| 2 | 50× | pasivo* | 3,5 % | 60,6 (22/48/114) | **−11.520** | −34.091 / −15.000 / −5.814 | **−9.216** | −15.000 / −7.500 / 0 | −1,84 |
| 5 | 10× | mañoso | 49,3 % | 34,2 (3/19/86) | **10.771** | −50.000 / −1.456 / 42.857 | **8.616** | 0 / 7.500 / 18.000 | 1,72 |
| 5 | 10× | aleatorio | 0,0 % | 5,4 (3/4/9) | **−27.842** | −50.000 / −37.500 / −16.667 | **−22.273** | −27.000 / −22.500 / −18.000 | −4,45 |
| 5 | 10× | pasivo* | 0,9 % | 6,5 (1/2/15) | **−21.665** | −150.000 / −75.000 / −10.000 | **−17.332** | −30.000 / −16.500 / −4.500 | −3,47 |
| 5 | 20× | mañoso | 55,5 % | 55,4 (3/38/135) | **15.635** | −100.000 / 11.043 / 50.000 | **12.508** | 0 / 15.000 / 33.000 | 2,50 |
| 5 | 20× | aleatorio | 0,0 % | 6,8 (3/6/11) | **−43.985** | −100.000 / −50.000 / −27.273 | **−35.188** | −42.000 / −36.000 / −27.000 | −7,04 |
| 5 | 20× | pasivo* | 0,1 % | 9,1 (1/4/16) | **−32.734** | −300.000 / −75.000 / −18.750 | **−26.187** | −48.000 / −27.000 / −3.000 | −5,24 |
| 5 | 50× | mañoso | 59,6 % | 92,7 (5/68/213) | **16.022** | −150.000 / 14.320 / 56.604 | **12.818** | 0 / 0 / 30.000 | 2,56 |
| 5 | 50× | aleatorio | 0,0 % | 11,7 (5/11/19) | **−64.260** | −150.000 / −68.182 / −39.474 | **−51.408** | −67.500 / −52.500 / −37.500 | −10,28 |
| 5 | 50× | pasivo* | 0,1 % | 15,7 (3/10/32) | **−47.352** | −250.000 / −75.000 / −23.437 | **−37.881** | −67.500 / −37.500 / −7.500 | −7,58 |

#### Avanzado · apuesta media 300 HC

| Mesa | Entrada | Conductor | % mesas ganadas | Manos/partida media (p10/med/p90) | HC/100 manos · media | HC/100 por partida · p10 / med / p90 | HC/hora · media | HC/hora · p10 / med / p90 | Packs/h |
|---|---|---|---|---|---|---|---|---|---|
| 2 | 10× | mañoso | 30,1 % | 34,9 (10/25/73) | **−2.129** | −25.000 / −8.108 / 23.684 | **−1.703** | −9.000 / −1.500 / 4.500 | −0,34 |
| 2 | 10× | aleatorio | 0,6 % | 7,4 (3/6/13) | **−39.746** | −100.000 / −50.000 / −21.429 | **−31.797** | −39.000 / −33.000 / −24.000 | −6,36 |
| 2 | 10× | pasivo* | 12,8 % | 11,4 (2/9/24) | **−17.943** | −150.000 / −30.000 / 23.684 | **−14.354** | −25.500 / −13.500 / −3.000 | −2,87 |
| 2 | 20× | mañoso | 55,8 % | 69,4 (19/52/142) | **3.415** | −22.222 / 5.807 / 34.615 | **2.732** | −6.000 / 0 / 12.000 | 0,55 |
| 2 | 20× | aleatorio | 0,1 % | 11,9 (5/11/20) | **−50.166** | −120.000 / −54.545 / −30.000 | **−40.133** | −48.000 / −42.000 / −30.000 | −8,03 |
| 2 | 20× | pasivo* | 8,1 % | 18,4 (4/12/37) | **−25.971** | −150.000 / −46.154 / −8.942 | **−20.777** | −36.000 / −21.000 / −3.000 | −4,16 |
| 2 | 50× | mañoso | 73,6 % | 136,6 (32/112/274) | **5.190** | −18.750 / 9.317 / 35.714 | **4.152** | −15.000 / 0 / 15.000 | 0,83 |
| 2 | 50× | aleatorio | 0,1 % | 22,8 (11/22/36) | **−65.628** | −136.364 / −68.182 / −41.667 | **−52.502** | −75.000 / −45.000 / −30.000 | −10,50 |
| 2 | 50× | pasivo* | 3,6 % | 46,1 (15/36/88) | **−30.201** | −100.000 / −41.667 / −14.563 | **−24.161** | −45.000 / −30.000 / 0 | −4,83 |
| 5 | 10× | mañoso | 45,6 % | 31,8 (2/20/77) | **20.675** | −100.000 / −7.317 / 81.818 | **16.540** | −3.000 / 15.000 / 36.000 | 3,31 |
| 5 | 10× | aleatorio | 0,0 % | 5,5 (3/4/9) | **−54.107** | −100.000 / −75.000 / −33.333 | **−43.285** | −51.000 / −45.000 / −33.000 | −8,66 |
| 5 | 10× | pasivo* | 0,7 % | 5,2 (1/2/11) | **−54.893** | −300.000 / −150.000 / −25.000 | **−43.914** | −75.000 / −42.000 / −12.000 | −8,78 |
| 5 | 20× | mañoso | 49,6 % | 54,2 (3/36/133) | **27.386** | −200.000 / −3.158 / 90.000 | **21.908** | −6.000 / 30.000 / 60.000 | 4,38 |
| 5 | 20× | aleatorio | 0,0 % | 6,7 (3/6/11) | **−89.210** | −200.000 / −100.000 / −54.545 | **−71.368** | −84.000 / −72.000 / −54.000 | −14,27 |
| 5 | 20× | pasivo* | 0,1 % | 7,2 (1/4/13) | **−82.472** | −600.000 / −150.000 / −46.154 | **−65.977** | −108.000 / −66.000 / −18.000 | −13,20 |
| 5 | 50× | mañoso | 50,2 % | 82,3 (4/53/204) | **27.544** | −375.000 / 11.753 / 117.647 | **22.035** | −15.000 / 0 / 60.000 | 4,41 |
| 5 | 50× | aleatorio | 0,0 % | 11,3 (4/10/19) | **−132.767** | −375.000 / −150.000 / −78.947 | **−106.213** | −135.000 / −105.000 / −75.000 | −21,24 |
| 5 | 50× | pasivo* | 0,2 % | 12,9 (2/8/24) | **−114.755** | −750.000 / −187.500 / −62.500 | **−91.804** | −150.000 / −90.000 / −15.000 | −18,36 |

#### Pro · apuesta media 600 HC

| Mesa | Entrada | Conductor | % mesas ganadas | Manos/partida media (p10/med/p90) | HC/100 manos · media | HC/100 por partida · p10 / med / p90 | HC/hora · media | HC/hora · p10 / med / p90 | Packs/h |
|---|---|---|---|---|---|---|---|---|---|
| 2 | 10× | mañoso | 18,9 % | 30,8 (11/24/60) | **−10.262** | −50.000 / −20.690 / 37.500 | **−8.209** | −18.000 / −9.000 / 3.000 | −1,64 |
| 2 | 10× | aleatorio | 0,7 % | 7,6 (3/6/13) | **−77.741** | −200.000 / −100.000 / −42.857 | **−62.193** | −78.000 / −60.000 / −48.000 | −12,44 |
| 2 | 10× | pasivo* | 10,7 % | 8,4 (1/6/17) | **−52.374** | −600.000 / −85.714 / 31.145 | **−41.899** | −69.000 / −42.000 / −15.000 | −8,38 |
| 2 | 20× | mañoso | 40,4 % | 68,2 (21/52/139) | **176** | −46.154 / −12.000 / 60.000 | **141** | −24.000 / 0 / 18.000 | 0,03 |
| 2 | 20× | aleatorio | 0,0 % | 11,9 (5/10/21) | **−100.660** | −240.000 / −120.000 / −57.143 | **−80.528** | −108.000 / −84.000 / −60.000 | −16,11 |
| 2 | 20× | pasivo* | 5,4 % | 13,1 (3/9/27) | **−79.325** | −400.000 / −133.333 / −33.333 | **−63.460** | −96.000 / −60.000 / −24.000 | −12,69 |
| 2 | 50× | mañoso | 63,5 % | 158,7 (35/122/325) | **5.102** | −39.474 / 12.346 / 62.500 | **4.082** | −30.000 / 0 / 30.000 | 0,82 |
| 2 | 50× | aleatorio | 0,0 % | 22,5 (10/21/37) | **−133.476** | −300.000 / −142.857 / −81.081 | **−106.781** | −150.000 / −120.000 / −60.000 | −21,36 |
| 2 | 50× | pasivo* | 2,1 % | 32,5 (13/26/60) | **−88.425** | −230.769 / −115.385 / −46.875 | **−70.740** | −120.000 / −60.000 / −30.000 | −14,15 |
| 5 | 10× | mañoso | 41,3 % | 33,7 (3/20/83) | **33.660** | −200.000 / −17.143 / 150.000 | **26.928** | −12.000 / 30.000 / 66.000 | 5,39 |
| 5 | 10× | aleatorio | 0,0 % | 5,6 (3/5/9) | **−108.024** | −200.000 / −120.000 / −66.667 | **−86.419** | −102.000 / −90.000 / −66.000 | −17,28 |
| 5 | 10× | pasivo* | 0,7 % | 3,9 (1/2/9) | **−146.099** | −600.000 / −300.000 / −66.667 | **−116.879** | −174.000 / −114.000 / −60.000 | −23,38 |
| 5 | 20× | mañoso | 47,4 % | 58,0 (3/37/141) | **47.969** | −400.000 / −11.111 / 175.610 | **38.375** | −12.000 / 48.000 / 72.000 | 7,68 |
| 5 | 20× | aleatorio | 0,0 % | 7,2 (4/6/12) | **−166.922** | −300.000 / −200.000 / −100.000 | **−133.537** | −168.000 / −132.000 / −108.000 | −26,71 |
| 5 | 20× | pasivo* | 0,1 % | 6,0 (1/4/12) | **−197.858** | −1.200.000 / −300.000 / −100.000 | **−158.286** | −240.000 / −168.000 / −72.000 | −31,66 |
| 5 | 50× | mañoso | 49,5 % | 84,2 (4/56/207) | **52.467** | −600.000 / −9.023 / 230.769 | **41.974** | −30.000 / 0 / 120.000 | 8,39 |
| 5 | 50× | aleatorio | 0,0 % | 12,5 (6/11/20) | **−239.974** | −500.000 / −272.727 / −150.000 | **−191.980** | −240.000 / −180.000 / −150.000 | −38,40 |
| 5 | 50× | pasivo* | 0,1 % | 11,1 (3/8/21) | **−268.418** | −1.000.000 / −375.000 / −142.857 | **−214.735** | −330.000 / −210.000 / −90.000 | −42,95 |

\* `pasivo` no lo pedía la ficha: se añadió porque se parece más a un jugador casual que el `aleatorio` (iguala o pasa, nunca sube).

### E.2 Lo que dicen los números

1. **La acuñación vive en la mesa de 5.** El `mañoso` gana entre el 41 % y el 60 % de las mesas de 5. Arriesga E para cobrar 4·P(E), que es 6E al piso o al medio y 4E al techo. En apuestas por 100 manos acuña entre 56 y 107, según reto y entrada. A la apuesta media eso son 8.616–12.818 HC/h en Básico, 16.540–22.035 en Avanzado y 26.928–41.974 en Pro, es decir **de 1,7 a 8,4 packs por hora ($3,4 a $16,7 por hora de juego)**.
2. **En la mesa de 2 la acuñación es pequeña o negativa.** Al piso, el `mañoso` pierde en los tres retos. A 20× y 50× gana entre 141 y 4.152 HC/h.
3. **Los jugadores no hábiles pierden mucho, en todas las celdas.** `aleatorio` y `pasivo` no ganan casi nunca una mesa de 5 (≤ 0,9 %). Contra las IAS, para ellos el juego es un sumidero y no una fuente.
4. **La dispersión es grande.** Con 80 manos, la mediana de una hora del `mañoso` a 50× es **0** (las partidas son más largas que una hora y el dinero llega al cerrarlas), y el p90 llega a 120.000 HC en Pro. Una sola mesa de 5 ganada al techo en Pro **acuña 120.000 HC (24 packs)**.
5. **El `mañoso` es la maña de Victor transcrita** (`bancoNiveles.mjs:470-485`, «ESTOS NÚMEROS NO SON CIFRAS DEL JUEGO Y NO SE CALIBRAN»). Es, literalmente, el «jugador hábil común» de S7. Cualquier válvula que contenga la acuñación lo va a tocar a él.

### E.3 Las dos válvulas, como cuenta sobre los volcados

**Rake invisible.** El banco no vuelca el pozo que el asiento 0 gana en cada mano (no hay bandera para ello), así que el rake sobre el **pozo bruto** no se puede calcular sin programar. Lo que sí se calcula exacto es una **cota inferior**: el rake sobre lo que el humano extrae de las IAS al cerrar cada mesa ganada, r × (n−1)·P(E). El rake por pozo cobra más, porque también muerde las manos en las que el humano recupera fichas propias y las de las mesas que acaba perdiendo.

**Presupuesto diario.** Es un tope a la ganancia neta contra las IAS que se abona al saldo en un día; lo que pasa del tope no se abona. Se probaron **tres valores en HC fijas: 10.000, 25.000 y 50.000 HC/día** (2, 5 y 10 packs).
- **Por qué en HC fijas y no en múltiplos de la entrada:** lo que hay que proteger es la tienda, cuyos precios son fijos en HC. Un tope en múltiplos de la entrada dejaría a Pro acuñar 4× lo que Básico por el mismo esfuerzo.
- **El precio:** el tope fijo muerde mucho más en Pro. La alternativa, un tope en múltiplos de la apuesta, queda para el rector (§M-4).
- Se modelan días de 1 h (80 manos) y de 3 h (240 manos). En la tabla, «%» es la parte de la ganancia de los días positivos que se pierde.

| Reto · mesa · entrada (`mañoso`) | Neto HC/h | Rake 3 % | Rake 5 % | Rake 8 % | Tope 10.000/día | Tope 25.000/día | Tope 50.000/día | Ídem con 3 h/día (10k / 25k / 50k) |
|---|---|---|---|---|---|---|---|---|
| Básico · 2 · 10× | −878 | 42 | 70 | 112 | 0 (0 %) | 0 (0 %) | 0 (0 %) | 4 (0 %) / 0 (0 %) / 0 (0 %) |
| Básico · 2 · 20× | 1.246 | 80 (6 %) | 133 (11 %) | 212 (17 %) | 26 (1 %) | 0 (0 %) | 0 (0 %) | 637 (13 %) / 2 (0 %) / 0 (0 %) |
| Básico · 2 · 50× | 2.054 | 88 (4 %) | 147 (7 %) | 236 (11 %) | 168 (6 %) | 0 (0 %) | 0 (0 %) | 1.892 (26 %) / 50 (1 %) / 0 (0 %) |
| Básico · 5 · 10× | 8.616 | 312 (4 %) | 520 (6 %) | 832 (10 %) | 2.424 (27 %) | 96 (1 %) | 0 (0 %) | 16.292 (63 %) / 5.469 (21 %) / 218 (1 %) |
| Básico · 5 · 20× | 12.508 | 433 (3 %) | 722 (6 %) | 1.155 (9 %) | 6.401 (50 %) | 1.310 (10 %) | 24 (0 %) | 28.110 (75 %) / 15.595 (41 %) / 3.280 (9 %) |
| Básico · 5 · 50× | 12.818 | 463 (4 %) | 772 (6 %) | 1.235 (10 %) | 9.035 (66 %) | 2.781 (20 %) | 321 (2 %) | 30.420 (78 %) / 18.627 (48 %) / 6.394 (16 %) |
| Avanzado · 2 · 10× | −1.703 | 93 | 155 | 249 | 38 (3 %) | 0 (0 %) | 0 (0 %) | 217 (12 %) / 2 (0 %) / 0 (0 %) |
| Avanzado · 2 · 20× | 2.732 | 174 (6 %) | 289 (11 %) | 463 (17 %) | 826 (18 %) | 26 (1 %) | 0 (0 %) | 4.644 (44 %) / 798 (8 %) / 14 (0 %) |
| Avanzado · 2 · 50× | 4.152 | 194 (5 %) | 323 (8 %) | 517 (12 %) | 2.411 (40 %) | 224 (4 %) | 1 (0 %) | 8.996 (59 %) / 2.971 (20 %) / 174 (1 %) |
| Avanzado · 5 · 10× | 16.540 | 619 (4 %) | 1.032 (6 %) | 1.652 (10 %) | 9.838 (57 %) | 3.175 (18 %) | 183 (1 %) | 40.100 (81 %) / 26.615 (53 %) / 9.898 (20 %) |
| Avanzado · 5 · 20× | 21.908 | 791 (4 %) | 1.319 (6 %) | 2.110 (10 %) | 17.092 (74 %) | 8.364 (36 %) | 2.094 (9 %) | 56.626 (86 %) / 43.077 (65 %) / 24.481 (37 %) |
| Avanzado · 5 · 50× | 22.035 | 879 (4 %) | 1.464 (7 %) | 2.343 (11 %) | 21.037 (83 %) | 14.660 (58 %) | 5.364 (21 %) | 60.296 (88 %) / 48.404 (71 %) / 31.100 (45 %) |
| Pro · 2 · 10× | −8.209 | 133 | 221 | 354 | 247 (18 %) | 8 (1 %) | 0 (0 %) | 234 (30 %) / 29 (4 %) / 1 (0 %) |
| Pro · 2 · 20× | 141 | 256 (182 %) | 427 (303 %) | 682 (485 %) | 3.046 (48 %) | 605 (10 %) | 23 (0 %) | 7.008 (62 %) / 2.957 (26 %) / 490 (4 %) |
| Pro · 2 · 50× | 4.082 | 288 (7 %) | 480 (12 %) | 768 (19 %) | 5.969 (69 %) | 2.005 (23 %) | 247 (3 %) | 15.842 (77 %) / 8.767 (43 %) / 2.984 (15 %) |
| Pro · 5 · 10× | 26.928 | 1.059 (4 %) | 1.765 (7 %) | 2.824 (10 %) | 22.351 (76 %) | 12.790 (44 %) | 4.638 (16 %) | 71.812 (88 %) / 58.361 (72 %) / 38.436 (47 %) |
| Pro · 5 · 20× | 38.375 | 1.413 (4 %) | 2.354 (6 %) | 3.767 (10 %) | 36.075 (87 %) | 27.855 (67 %) | 14.811 (36 %) | 107.766 (92 %) / 94.248 (81 %) / 72.999 (62 %) |
| Pro · 5 · 50× | 41.974 | 1.691 (4 %) | 2.819 (7 %) | 4.510 (11 %) | 44.950 (91 %) | 38.638 (79 %) | 28.317 (58 %) | 126.199 (94 %) / 114.090 (85 %) / 94.732 (71 %) |

Las cifras son HC/h para el rake y HC/día perdidas para el tope. En el rake, el % es sobre el neto medio; en Pro·2·20× el neto es casi cero y el % se dispara.

**Lo que les cuesta al jugador medio.** Con `aleatorio`, el rake del 8 % cuesta como mucho **51 HC/h** y ningún tope le quita nada, porque nunca llega a él. Con `pasivo*`, el rake del 8 % cuesta como mucho 738 HC/h (Pro·2·10×) y los topes, menos de 102 HC/día.

**Conclusión para S7 (decide Victor).**
- **El rake del 3–8 % es un impuesto proporcional:** le quita al `mañoso` un 4–11 % y no contiene la acuñación. Pro·5·50× seguiría acuñando ~37.000–40.000 HC/h.
- **El tope diario sí contiene la acuñación, pero solo muerde al jugador hábil.** Esa es a la vez su virtud (no toca al jugador medio) y su conflicto con «no castigar al hábil común».
- **La cifra que separa las dos cosas es ~25.000 HC/día:** casi no toca la mesa de 2, le quita al Básico de mesa de 5 un 10–20 % y al Pro de mesa de 5 entre el 44 y el 79 %.
- **La palanca de fondo no es la válvula, es el pago de la mesa de 5:** 4·P(E) frente a E, con un 50 % de mesas ganadas. Tocarla es APU-1, no ECO-1 (§M-4).

---

## F · Conteos y límites del servidor (bocetos, sin SQL)

Todos siguen el precedente de la casa: tabla sin políticas de RLS (o solo de lectura propia) y RPC `security definer` con `search_path=''`. **Ninguna anotación de conteo va seguida de un `raise`** (S10): si se agota, la RPC devuelve un resultado (`{ok:false, motivo}`) en lugar de abortar, para que la anotación sobreviva. Todas las RPC de dinero bloquean primero la fila de billetera del jugador (`select … for update`), que es lo que ordena las carreras entre dispositivos.

| Operación | Tabla | Clave única (idempotencia) | Ventana | Al agotarse |
|---|---|---|---|---|
| Bono de bienvenida | `bonos_bienvenida(correo_canonico_hash PK, otorgado_en)`, **sin FK** a `auth.users` (ver G.4) | el hash del correo canónico | para siempre | no paga y devuelve `ya_otorgado` |
| Bono de constancia | `ingresos_dias(jugador_id, dia) PK`, más un movimiento `constancia` con clave `(jugador_id, 'constancia', dia)` | `(jugador, día)` | el día (F.1) | al completar 3 días seguidos se paga una vez y la racha se reinicia |
| Video | `boletos_video(id, jugador_id, emitido_en, cobrado_en null, vence_en)` | `id` del boleto; cobrar = `update … set cobrado_en = now() where id = $1 and jugador_id = auth.uid() and cobrado_en is null returning` | 8 cobrados por día (F.1) | *pedir* devuelve `tope_dia`; *cobrar* repetido devuelve el saldo actual sin pagar |
| Entrada | `mesas_ia(id, jugador_id, reto, apuesta, jugadores, entrada, recargas, techo, abierta, abierta_en, cerrada_en)`, con índice único parcial `(jugador_id) where abierta` | una mesa abierta por cuenta | — | `mesa_abierta` (ver C6) |
| Recarga | `mesas_ia` (+1 recarga, techo += r + (n−1)·T) y movimiento `recarga` con clave `(mesa_id, nº)` | `(mesa, nº de recarga)`: el cliente manda el nº que cree que toca | — | `nº` repetido → devuelve el estado sin cobrar |
| Salida | `mesas_ia` (`abierta = false`) y movimiento `salida` con clave `(mesa_id)` | una salida por mesa: `update … where abierta returning` | — | segunda llamada → devuelve el saldo sin abonar |

### F.1 ¿Qué es un «día»?

El servidor solo tiene hoy `now()` (UTC) y `profiles.created_at/updated_at` (0001:32-33). **No guarda zona horaria ni idioma** (grep de `timezone`, `last_sign_in` y `zona horaria` sin resultados; el idioma vive en `localStorage['ajilei.idioma']`, `src/config/textos.js:40`).

| Opción | Datos que necesita | A favor | En contra |
|---|---|---|---|
| Medianoche UTC | ninguno | trivial; nadie la puede manipular | en América el día cambia a media tarde (las 19:00–20:00); «hoy» no es el «hoy» del jugador |
| Hora del jugador | una columna nueva `zona` en `profiles`, enviada por el cliente (`Intl.DateTimeFormat().resolvedOptions().timeZone`) | «hoy» coincide con el del jugador | se puede manipular cambiando de zona: hay que limitar los cambios (por ejemplo uno cada 30 días) |
| 24 h móviles | ninguno | justo y sin manipulación | «Te quedan 6 de 8» deja de reiniciarse a una hora: se renuevan uno a uno, 24 h después de cada cobro; y la «constancia de 3 días» se vuelve rara |

### F.2 ¿Qué es «ingreso continuo»?

**Hoy no existe ningún evento que marque «el jugador entró hoy».**
- El OTP (`useAuth.js:195-199`) no sirve: la sesión persiste y se refresca sola (`useAuth.js:121-124`), así que quien vuelve con la sesión viva no pasa por él.
- La lectura de `profiles` es solo lectura, y `mi_sala()` solo barre salas.

**Propuesta:** una RPC `marcar_ingreso()` (o que la haga la lectura de la billetera al arrancar) que inserte `(jugador, día)` con `on conflict do nothing`. Un día cuenta como «ingresado» si la app se abrió con sesión ese día. Racha = días consecutivos con fila; al llegar a 3 se paga y se reinicia.

### F.3 Límite de frecuencia por minuto (propuesta)

| Función | Tope/min | Por qué |
|---|---|---|
| `sentarse_ia` | 6 | una mesa de 5 puede acabar en 2–3 manos (p10 de §E), pero no en menos de ~20 s; 6/min no toca el juego honesto |
| `recargar_ia` | 6 | como mucho una por mano, y una mano dura ≥ 10 s |
| `salir_ia` | 10 | es idempotente; el tope solo frena bucles |
| `pedir_boleto` | 3 | un video dura ~40 s; 3/min cubre los reintentos tras «no disponible» |
| `cobrar_boleto` | 10 | es idempotente; los reintentos de red son legítimos |
| bono de bienvenida y constancia | 3 | se llaman una vez al arrancar |

Precedente: `intentos_codigo`, 5/min con purga a la hora (B.5). Se recomienda **una sola tabla `intentos_dinero(jugador_id, funcion, en)`**, con la misma purga al pasar.

---

## G · El correo canónico

1. **Dónde vive:** solo en `auth.users`; `profiles` no lo copia. El cliente lo toma de la sesión (`useAuth.js:245` → `App.jsx:430`). **El repo no usa ni `auth.jwt()` ni `auth.email()`, y ninguna función lee `auth.users`**; solo usa `auth.uid()` (por ejemplo A1:140, B2:61, 0001:193). Una función `security definer` sí puede leer `select email from auth.users where id = auth.uid()`. Esa es la fuente recomendada, porque es la de verdad; `auth.jwt()->>'email'` sale del token. Se entra con **OTP de 6 dígitos por correo** (`useAuth.js:180-199`, `shouldCreateUser: true`); Google aún no está (`FormularioPuerta.jsx:134-137`). Con OTP el correo queda verificado por construcción.
2. **Hoy no hay ninguna normalización de correo:** el cliente solo hace `trim()` (`FormularioPuerta.jsx:68`). **Regla de Gmail (S2):** pasar a minúsculas; si el dominio es `googlemail.com`, cambiarlo por `gmail.com`; si es `gmail.com`, cortar la parte local desde el primer `+` y quitarle todos los puntos. El resultado es el correo canónico. A los demás dominios solo se les pasan a minúsculas (S2).
3. **Alias en otros dominios** (dato informativo, de conocimiento externo y no verificado en el repo):
   - Outlook/Hotmail/Live, iCloud, Fastmail y Proton admiten alias con `+`.
   - Yahoo no usa `+`: usa «direcciones desechables» con `-`.
   - Todos admiten además alias de cuenta (otra dirección completa), que ninguna regla textual detecta.

   Según S2, no se tratan.
4. **Dónde guardar «bono ya dado»:** el borrado de `auth.users` **arrastra todo en cascada**: `profiles` (0001:30) → `salas`, `sala_jugadores` e `intentos_codigo` (SALA:90, `:149`, `:148`, `:185`). Además, al volver a registrarse el jugador recibe un uuid nuevo. Por eso la marca va en una **tabla sin FK, cuya clave es el hash (sha256) del correo canónico**, y la futura función «Eliminar cuenta» (hoy en Pronto: `Lobby.jsx:349-353`, con el plan de una Edge Function en `:350-351`) **no debe borrarla**.
   - Aviso de privacidad: el hash de un correo sigue siendo un dato personal. Hay que mencionarlo en la política y decidir si caduca (§M-6).
   - **Cuándo se otorga:** el perfil lo inserta el cliente por PostgREST (B.2), así que el bono no puede ir en el cliente. Opciones: un disparador `AFTER INSERT` en `profiles` (`security definer`, lee `auth.users.email`), o una RPC `crear_perfil` que sustituya al insert directo. **Cuidado:** si el disparador hace `raise`, deshace también la creación del perfil (S10); tiene que terminar normalmente cuando el bono ya se dio.

---

## H · El libro de movimientos y su encaje con MOT-1

### H.1 Lo que el árbitro necesitará del saldo, según los informes de MOT-1

**Primero, lo que no aparece.** El grep de `escrow`, «depósito en garantía», `reconcilia` y «atómica por mano» en `docs/`, `src/`, `scripts/` y `supabase/` **no da ningún resultado**. Esos conceptos de S4 son nuevos de ECO-1, no de MOT-1.

**Lo que sí está en `docs/reportes/AJILEI_MOT-1_Fase0_Informe_v1.0.md`:**
- **Economía desacoplada** (`:541`, E5 n.º 7): motor y base no se conocen; la verdad del dinero vive en SQL.
- **K-6, tabla privada del estado** (`:766-769`): opción (b) recomendada, una tabla sin SELECT para los clientes y fuera de Realtime, escrita solo por el servidor, con la vista de cada jugador por Broadcast privado o `mi_vista`. El motivo (H-13, `:687`): `salas.estado_partida` tiene `replica identity full` (SALA:205) y está publicada (SALA:852-864).
- **K-11, tabla `índice ↔ uid`** (`:789-792`): opción (a) recomendada, compactar los índices 0..n−1 al arrancar, porque el pago va por `players[].id` (C5, `:287`).
- **K-8** (`:777-780`): la IA no va en el servidor; un abandono se resuelve por el reloj.
- **K-9** (`:782`): «¿Las fichas de la mesa son el saldo real del jugador (`saldo_de`) o una bolsa fija de mesa? **Sin recomendación**: es decisión de producto.» **No consta decidido en ningún informe** (grep de «K-9» fuera de este: sin resultados). Además, el normativo vigente dice otra cosa: «Entrada por jugador fija… Corta 15× · Llena 50×… saldo ≥ entrada», «**Sin recarga**» (`docs/AJILEI_APU-1_Reglas_v1.3.md:317-319`). → §M-3.
- **K-7** (`:771-775`): vencimientos idempotentes, con la doctrina de `resolver_sala`.
- **El estado heredado** (`AJILEI_APU-1_Reglas_v1.3.md:327`, §9): `contribMano`, `allIn` y `entrada` por jugador, más `pot` con capas. La invariante «Σ repartido = pot» está en `src/engine/pozos.js:333-345`. «En PvP el árbitro no llama nunca» a `aplicarRecarga` (`gameEngine.js:665`).
- **Lo que MOT-1 deja fijado y condiciona al libro:**
  - de 2 a 5 jugadores;
  - una invocación por acción (`:808`), con hasta 3 rondas de apuesta y 1 descarte por mano;
  - latencias de la sonda en frío: 0,34–0,42 s de extremo a extremo (Sonda `:101-105`); en caliente sin medir.
  - **Bloqueos:** ya hay `for update` sobre `salas` (SALA:380, `:570-572`, `:646`, `:678`; B2:98, `:123`, `:201`). El informe de la Sonda no habla de saldo.

### H.2 Dos formas de guardar el dinero

| Criterio | (1) Columna de saldo + tabla de movimientos | (2) Solo movimientos (saldo = suma) |
|---|---|---|
| Cabecera y lobby | O(1): leer una fila | O(nº de movimientos), o una vista materializada que habría que mantener |
| Ranking «Las grandes fortunas» (S8) | `order by saldo desc limit N` con índice | agregado sobre todo el libro, o materializarlo (es decir, volver a (1)) |
| Integridad | dos verdades que deben cuadrar: comprobación periódica `saldo = Σ movimientos` y `check (saldo >= 0)` | una sola verdad, por construcción |
| Carreras entre dispositivos | `update billeteras set saldo = saldo − x where jugador_id = … and saldo >= x returning`: atómico y serializado por la fila | hace falta bloqueo explícito (aviso o fila guía) o aislamiento serializable para no gastar dos veces |
| Encaje con S4 (garantía en PvP) | la garantía es un movimiento más (`garantia_pvp`); el árbitro bloquea las filas de billetera de los n jugadores en orden de uid y concilia en una transacción | igual, pero cada comprobación de «¿le alcanza?» es una suma |

**Recomendación: (1).** `billeteras(jugador_id PK, saldo bigint check >= 0)` y `movimientos(id, jugador_id, tipo, monto, saldo_tras, ref_tipo, ref_id, clave_idem unique, creado_en)`, solo de inserción. Toda RPC de dinero hace las dos escrituras en la misma transacción. La comprobación `Σ = saldo` va como prueba de SQL comentada y como consulta de Victor (§O). **Ninguna de las dos tablas entra en la publicación de Realtime con `replica identity full`** (lección de H-13). Si la cabecera necesita enterarse en vivo, que sea por Broadcast o por una relectura al volver a primer plano.

### H.3 Tipos de movimiento

`bono_bienvenida` · `constancia` · `video` · `entrada_ia` · `recarga_ia` · `salida_ia` · `compra` (tienda, futuro) · `ajuste_admin` (con motivo obligatorio) · `abandono_ia` (cierre por plazo, §L) · **marcadores de PvP (S4):** `garantia_pvp`, `liberacion_pvp` y `resultado_pvp`.

**Lección de VOZ-3 para el libro (I.3):** el resultado de una mano se apunta como **diferencia de `chips` por asiento entre el principio y el final de la mano**, nunca a partir de `state.winner`. `winner` es el ganador de la capa superior y puede ser una IA que solo recuperó su sobrante (`gameEngine.js:285`, `:292`).

---

## I · Pendientes que ECO-1 absorbe

### I.1 Los rojos conocidos de CEL-2c («2.800 frente a 2.933»)

- **No son Heptacoins, son milisegundos.** Es un solo fallo que se repite en las 5 celdas del arco (`docs/reportes/AJILEI_ARN-3c_Informe_v1.0.md:747`; dueño CEL-2c en `AJILEI_ARN-3_Cierre_v1.0.md:43`).
- **Qué mide:** `scripts/diagCEL0.mjs:1077` exige que la duración que pide la app para contar el saldo (`sIni.dur`, `src/hooks/useCoreografia.js:298-301`) sea `CONTEO_SALDO_MS = 2933` (`diagCEL0.mjs:530-533`, «el saldo va de 5000 a 5000»). Figura como conocido en `:517-519`.
- **Por qué está rojo:** `duracionConteo` (`src/hooks/coreografiaCore.js:48-61`) da 2.800 ms hasta una magnitud de 1.000 y 2.933 en 5.000. El arnés ya no se sienta con 5.000 sino con `ENTRADA_ARNES_CEL` = 10 × 50 = **500** (`diagCEL0.mjs:216-234`), así que la app pide 2.800.
- **¿Lo cura ECO-1? No por sí solo.** «Saldo actual» es la **pila** (`GameTable.jsx:2176`) y no el bolsillo, así que el saldo provisional no interviene. Para cerrarlo: (a) re-sellar `CONTEO_SALDO_MS` para la magnitud 500, o (b) decidir que «Saldo actual» enseñe la billetera, y entonces la cifra dependería del saldo del arnés. → §M-8.

### I.2 El molde `allinHumano`

- **Qué es:** `src/dev/siembraAPU.js:10`, `:102` (`{ humano: 1.5 }`) y `:114-119` sientan al humano con round(1,5·u), en `chips` y en `entrada`.
- **Por qué descuadra:** App ya restó la entrada elegida (`App.jsx:571`), el molde sienta 75, y al salir vuelve `human.chips`. Ejemplo medido: entrada de 1.000 y molde de 75 dejan el saldo en 4.000 en vez de 4.925 (`AJILEI_REC-1_Fase0_Informe_v1.0.md:455`).
- **Por qué se aplazó a ECO-1:** «la causa vive en `App.jsx` (producto)» (`AJILEI_ARN-3b-ii_Informe_v1.0.md:277`; `AJILEI_ARN-3b_Informe_v1.0.md:223`).
- **Qué necesita:** que el cargo por sentarse sea **lo que la mesa sentó de verdad** (`human.entrada` después del molde) y no lo que se eligió en Retar. Con la vía (a) de §L, la RPC `sentarse_ia` recibe la entrada efectiva. En desarrollo, el molde tiene que pasar su entrada sembrada a esa llamada (o a la billetera de prueba de J.2).

### I.3 VOZ-3: el sobrante no igualado

**Solo mueve pilas de la mesa; no toca el saldo del humano.** El mecanismo:
1. `capasDe` (`src/engine/pozos.js:260-296`) crea una capa superior cuyo único elegible es la IA.
2. `ganadoresPorCapa` (`:311-331`) se la adjudica a la IA.
3. `repartirCapas` (`:346-364`) suma a `players[g].chips`.
4. `doShowdown` fija `winner` = el ganador de la capa superior (`gameEngine.js:285`, `:292`).
5. `resultadoCore.deShowdown` le pone el tono `msg-lose` (`src/hooks/resultadoCore.js:50-52`, `:106-109`).

El saldo de sesión solo cambia al sentarse, al recargar y al salir (`App.jsx:571`, `:542`, `:543-545`). **No se fusiona con ECO-1.** Solo deja la lección de H.3: apuntar diferencias de chips y no `winner`.

### I.4 «Ocultar saldo»

- **No existe con ese nombre en el código.** Lo que hay es la entrada **inerte** «Saldo» del menú de utilidades (`src/components/UtilitiesMenu.jsx:94-102`, pintada con `disabled` en `:247-260`; ID `ENTRADA.SALDO` en `src/config/menuEntradas.js:23`). No está entre las vivas (`:46-49`, `:62-64`).
- **Normativo:** «Sigue inerte por diseño» (`docs/AJILEI_Menu_Utilidades_v1.5.md:205`); la especificación de la máscara está en `AJILEI_Menu_Utilidades_v1.1.md:163-210`. «Por decidir si se retira o se reasigna a la billetera» (`AJILEI_APU-1_Reglas_v1.3.md:319`).
- **Dónde se ve el saldo fuera de la mesa:** solo en la píldora de `BarraSuperior`, que hoy tiene dos fuentes: `saldoSesion` en el Lobby y en Retar, la constante 5.000 en Armar, Opciones, Espera y Partida PvP (tabla de A.2). «Saldo actual» de la celebración es la pila.

---

## J · Pruebas, arnés y el modo sin sesión

### J.1 Qué asume hoy un saldo fijo

**Pruebas unitarias.** Ninguna llama a `saldoDelJugador()`: todas reciben el saldo por parámetro, así que no se rompen si cambia la fuente. Las excepciones que **sí sellan cifras de ECO-1**:
- `src/config/salas.test.js:76`, `:82`, `:86` sellan `BONO_BIENVENIDA = 1200` y `ALCANCE_NUEVOS = [100, 200]`. Se moverán con §M-1.
- Por parámetro: `scripts/testRetarIAS.test.js:248`, `:266-302`, `:316` (1.200 / 5.000 / 2.000); `scripts/testMesaAPU1.test.js:579` (`SALDO = 100000`); `scripts/testRec2.test.js:51`, `:86-132`, `:230-249`; `src/screens/salasCore.test.js:97`, `:202-205`, `:216`.
- La pila, no el bolsillo: `scripts/testEngine.test.js:399-400`, `scripts/testCelebracion.test.js:267-269` y `scripts/testCoreografia.test.js:88-97`, `:309-327`.

**Arnés que depende del 5.000 implícito:**

| `archivo:línea` | Qué asume |
|---|---|
| `scripts/diagSAL.mjs:84`, `:408-433` | `opciones-fuera-alcance` exige el texto «20.000» (saldo 5.000, mesa de 5.000) |
| `scripts/diagSAL.mjs:530-540` | `armar` exige `apagados === 2` |
| `scripts/diagSAL.mjs:545-561` | `armar-aviso` exige «1.200» |
| `scripts/diagDSK.mjs:1409-1419` (`retar.3`), `:1425-1459` (`retar.5`) | saldo ≥ 4.000; «topado por el saldo (5.000)» (`:1428`) |
| `scripts/rutaMesa.mjs:32`, `:66-68` | la ruta común exige el chip de entrada vivo |
| `scripts/cap/capMesa.mjs:72-73` | Pro, mesa de 200, entrada medio de 4.000 |
| `scripts/diagDSK.mjs:2808-2885` (`apu.3`) y los moldes `?apu=` sin `saldo:` (`:2200`, `:2231`, `:2630`, `:2676`, `:2892`, `:2938`) | bolsillo ≥ piso tras la entrada |

**Lo que siembra el saldo explícitamente**, y por eso aguanta el cambio de fuente: `diagDSK.mjs:1244` (`RETAR_SALDO_GRIS = 2400`; su comentario de `:1242` llama «bono de bienvenida (2.500)» a una cifra que el código tiene en 1.200), `:1251`, `:1471`, `:2497-2499` (REC-2), `:13593` (`rec`); `scripts/voz2/voz2Mesa.mjs:546`; `scripts/diagPUE.mjs:2374`.

**El Supabase falso del arnés** contesta `rpc/*` → `null` y `/rest/v1/*` → `[]` (`scripts/arnes/nucleo.mjs:279-284`, `scripts/cap/capMesa.mjs:156-161`, `scripts/bie/bieRed.mjs:135-138`, aplicado a todos los contextos en `scripts/arnes/comun.mjs:271-283`). **Una RPC de saldo de ECO-1 le llegaría al arnés como `null`.** El arnés tiene que aprender a contestar la billetera (J.2).

### J.2 El modo `VITE_AUTH_BYPASS` y un saldo de prueba

- **Hoy:** `AUTH_BYPASS = Boolean(import.meta.env.DEV && import.meta.env.VITE_AUTH_BYPASS)` (`src/hooks/useAuth.js:50`) da un perfil falso con uuid fijo (`:54`, `:171`) y ninguna red de sesión. Se impide en producción porque `import.meta.env.DEV` es `false` en `vite build` y el minificador elimina la rama. **No hay ninguna prueba automática sobre `dist/`**: solo un grep manual (`src/dev/salasFixtures.js:17-23`).
- **Precedentes:** `?sal=` (doble puerta, `DEV` y bypass, `salasFixtures.js:85-86`); `?apu=saldo:<n>` (solo `DEV`, `src/dev/siembraAPU.js:50`, `:71-78`); `?cel` / `?cel=<n>` (`src/dev/siembraCEL.js:53`).
- **Propuesta:** una **billetera falsa en `src/dev/`**, con la misma forma que la API real (`crearBilleteraApi(cliente)`, igual que `crearSalasApi` de A2), que la fábrica elija solo bajo `DEV && VITE_AUTH_BYPASS`. Su saldo inicial sale de `?apu=saldo:<n>` (5.000 por defecto, para no mover las varas de J.1) y vive en memoria de la pestaña. En producción la rama no existe.
- **Guardia nueva:** una prueba de vitest que construya con `vite build` (o lea `dist/`) y compruebe que no aparecen ni `billeteraFalsa` ni la clave de siembra. Hoy no existe ninguna guardia de ese tipo.

### J.3 La vara de «una sola cifra»

Hoy **no existe ninguna vara que compare el saldo entre pantallas**: `diagDSK.mjs:1507`, `:1554` y `diagCEL0.mjs:1032-1034` miran una sola pantalla o la pila. Ni `docs/AJILEI_Invariantes_v1.0.md` tiene un invariante de saldo.

**Propuesta, un modo `saldo`:**
- recorre lobby → Retar → mesa → (recarga) → salida → lobby → Armar → SalaOpciones;
- en cada paso lee la píldora y la compara con la billetera falsa, que es la «verdad del servidor» en el arnés;
- al final comprueba la identidad contable `saldo_final = saldo_inicial − entrada − recargas + fichas_de_salida`.

Se añade un invariante nuevo, del tipo **«la píldora y la billetera dicen lo mismo en toda pantalla»**.

### J.4 El video simulado en el arnés

- **Hoy no existe ningún mecanismo para acortar tiempos** (grep de `rapido`, `factorTiempo`, `timeScale`, `page.clock`: vacío). `relojCore` acepta `ahoraLocal` por parámetro, pero solo en Vitest (`src/hooks/relojCore.js:1-11`).
- **Propuesta:** la duración del reproductor simulado sale de `ajileiConfig` (por ejemplo `video.duracionMs`), y **solo bajo `DEV`** la puede escalar `?apu=video:<ms>` (mismo patrón y misma puerta que `siembraAPU`).
- **El servidor no se acorta nunca.** Por eso el arnés **no cobra de verdad**: su billetera falsa de J.2 implementa `pedir_boleto` y `cobrar_boleto` con el mismo contrato (tope de 8, boleto ya cobrado, segundos mínimos) y un reloj inyectable.
- **Las reglas del servidor se prueban en la migración**, como pruebas de SQL comentadas al estilo de SAL-B (0001:278-353): el tope de 8, el doble cobro y el cobro antes de los segundos mínimos (con `emitido_en` retrasado a mano dentro de una transacción de prueba con rollback).
- Fixtures del cliente para los tres finales: `?apu=video:sin` (no disponible), `?apu=video:cierra` y `?apu=video:<ms>`.

---

## P · El video de recompensa simulado (S11)

### P.1 Dónde se pide hoy y dónde iría

- **«Conseguir más monedas»:** `AvisoSaldo` en `src/screens/RetarIAS.jsx:51-73` (botón `:64-72`, `onClick={pronto}` en `:68`), pintado en `:339-345` cuando `aviso.caso !== CASO_ALCANZA`. CSS en `src/styles/salas.css:1422-1454`.
- **El «Pronto» no es un modal: es un toast (`role="status"`) y hay cinco copias del manejador.** El principal está en `src/components/PantallaChips.jsx:75-79` (2.600 ms; contexto `src/hooks/usePronto.js:21`, `:29-31`; comentario «ECO-1: conectar a la tienda / videos» en `:67-74`). Las otras: Lobby `:138-142` (1.200 ms), SalaEspera `:159`, SalaOpciones `:90` y PartidaPvP `:37`.
- **El «+» dorado:** `BarraSuperior.jsx:94` → `onTienda` desde Lobby (`:189`, y el botón «Tienda» de la barra inferior en `:261`), `PantallaChips` (`:85-91`), SalaEspera (`:483`), SalaOpciones (`:218`) y PartidaPvP (`:51`). **La mesa no monta `BarraSuperior`**: dentro de la mesa no hay «+».
- **La forzosa con saldo 0 (caso 3):** se pinta en `GameTable.jsx:2741-2812`, sin botón primario, solo con «Salir con mis fichas». Tiene un plazo de 15 s (`ajileiConfig.js:38`; tic en `GameTable.jsx:1287-1301`) que **un video de 40 s tendría que congelar**.
- **Bancarrota:** la pantalla ya no existe (`GameTable.jsx:1117`, `:1159-1161`). Queda la derrota `.game-over-screen` (`:2182-2193`).

**Propuesta, solo descrita:**
- **(a) Sitio principal:** `AvisoSaldo` de Retar, con «Ver un video · +500 HC» como acción principal y, debajo, «Te quedan 6 de 8 hoy» en una caja reservada (O1).
- **(b)** La tarjeta del caso 3, como botón principal que hoy no existe. Pausa el plazo; al cobrar, `tarjetaRecarga` se recalcula sola con el saldo nuevo y pasa al caso 1 o 2.
- **(c)** El «+» de la píldora, que abre una hoja «Conseguir monedas» con la fila del video y su contador. Antes conviene **unificar los cinco manejadores** en `PantallaChips`/`usePronto`.
- **(d) Opcional:** la derrota `.game-over-screen`.

### P.2 Piezas de celebración reutilizables

**Ninguna está en un archivo protegido.** La tarjeta de recarga usa las clases `bankrupt-*` de `gameTable.css` (protegido), pero se puede ampliar desde `apu.css` o `rec.css`, como hizo REC-2.

| Pieza | `archivo:línea` | ¿Se puede montar fuera? |
|---|---|---|
| Sonido `chipsCollect` (30.929 B) | `src/hooks/useSounds.js:38`; precargado en `SONIDOS_MESA` (`:77-81`, App `:99`, `:345-347`) y `SONIDOS_SALAS` (`:127`); **no** en el lobby (`:99`, `Lobby.jsx:95`) | Sí: `useSounds().play('chipsCollect')` desde cualquier sitio (`SoundProvider` en `main.jsx:57`). Hay que precargarlo donde se pida el video |
| Cuenta del «Saldo actual» | `src/components/Celebracion.jsx:186-187`; puras: `valorEntre` (`src/hooks/coreografiaCore.js:121`), `valorConteo` (`src/hooks/sesionCore.js:76`), `TRASPASO_MS = 520` (`coreografiaCore.js:95`) | Las funciones puras, sí. `TarjetaResumen` (`:179`) necesita datos de mesa (`manosJugadas`, `mejorMano`): hace falta un componente propio |
| Vuelo de la moneda | `MonedaTraspaso`, `Celebracion.jsx:151-173`, **interna, no exportada**; CSS `.cel-traspaso` (`src/styles/celebracion.css:597`) | Hay que exportarla o copiarla; el CSS no tiene ámbito y sirve |
| `useCoreografia` | `src/hooks/useCoreografia.js:59`; acepta `precedente` nulo (`:239`) | Sí, pero arrastra la melodía de 12 s y el salto con `pointerdown`; para un +500 sobra |
| `LluviaHeptacoins` | `src/components/LluviaHeptacoins.jsx:23` (props `emitiendo`, `pausada`) | Sí; necesita un padre `.cel-screen` o una regla propia (`celebracion.css:361`) |
| Píldora con brillo sellado | `BarraSuperior.jsx:80-97`; brillo de ciclo 8 s en `src/styles/lobby.css:105-111`, `:468-497`, `:774-797` (duplicado en `salas.css:1256-1303`) | Sí, bajo `.lobby` o `.sal`. **No existe animación de subida de la cifra**: es nueva, en una hoja aditiva |
| Consejos rotativos | efecto inline `SalaEspera.jsx:250-262` (7.000 ms, fundido de 420 ms, `:51-53`); pura `siguienteConsejo` (`src/screens/salaEsperaCore.js:163`); textos `sal.espera.consejo.1..5` (`textos.es.js:170-174`) | Se imita el patrón; los textos actuales son de PvP: hace falta una lista nueva |

### P.3 Relleno de los ~40 s

| Contenido | Peso | V / A / E |
|---|---|---|
| Consejos rotativos (texto) | 0 B | sí / sí / sí |
| Isotipo como marca de agua (`src/assets/ajilei-isotipo.svg`) | 4.054 B | sí / sí / sí (vector). La de SalaEspera (`:546`, `salas.css:966-996`) necesita `--mesa-h`, `--ciclo` y `--u` |
| `Cargando` (isotipo + tres puntos, `src/components/Cargando.jsx:26-43`) | ~4 KB | sí / sí / sí (`fixed; inset:0`, `cqmin`) |
| Lluvia de Heptacoins (`heptacoin.svg`) | 3.503 B | sí / sí / sí |
| Escena 2 de la Portada (cinco cartas WebP) | 54.280 B | ver nota |
| Escena 4, Heptacoin 3D (`src/assets/heptacoin.webp`, 87 cuadros, 4,5 s) | **1.064.956 B** (póster de 18.272 B) | ver nota; para rebobinar hace falta un object URL (`Portada.jsx:309-330`) |
| Escena 5, aparatos (`dis_laptop.webp` / `dis_telefono.webp`) | 47.874 + 27.752 B | ver nota |
| Melodías de celebración (×7) | ~386 KB en mp3, ~216–247 KB en ogg cada una | solo audio, 12 s |

**Nota de la Portada:** las escenas son JSX inline (`Portada.jsx:424-523`) con el CSS bajo `.portada-lienzo`, y la Portada **retira el escenario** en vertical de ≤ 520 px de alto y en apaisado de ≤ 540 px (`portada.css:890-902`). Reutilizarlas exige extraerlas. Lo más barato y que funciona en las tres orientaciones: **consejos rotativos + isotipo + barra de progreso + la marca «video de prueba»**. Lo decide la lámina.

### P.4 El boleto (boceto)

- **Pedir boleto** (`pedir_boleto()`):
  1. bloquea la fila de billetera;
  2. comprueba el límite por minuto (F.3) y que `cobrados_hoy < 8`; si no, `{ok:false, motivo:'tope_dia'}`, sin `raise`;
  3. si hay un boleto sin cobrar y sin vencer, **lo devuelve** (no emite otro);
  4. si no, inserta `{id, emitido_en: now(), vence_en: now() + 10 min}`;
  5. devuelve `{id, emitido_en, ahora: now(), quedan}`.
- **Cobrar boleto** (`cobrar_boleto(id)`): `update boletos_video set cobrado_en = now() where id = $1 and jugador_id = auth.uid() and cobrado_en is null and now() < vence_en and now() >= emitido_en + interval '<segundos mínimos>' returning`. Si devuelve una fila, inserta el movimiento `video` (+500, `clave_idem = 'video:'||id`) y suma a la billetera. Si no, distingue el motivo (`ya_cobrado`, `vencido`, `demasiado_pronto`, `ajeno`) y **siempre devuelve el saldo actual**.
- **Idempotencia:** el `update … where cobrado_en is null` y la `clave_idem` única hacen que dos toques o un reintento de red paguen una sola vez; el segundo recibe `ya_cobrado` y el saldo (ya subido).
- **Reloj:** siempre el del servidor (`now()`), como en `relojCore`. El cliente usa el desfase solo para pintar.
- **Vida del boleto sin cobrar:** la propuesta es 10 min. Basta para una pantalla bloqueada a mitad del video sin dejar boletos eternos.
- **Segundos mínimos:** algo por debajo de los 40 s visibles (por ejemplo 35), para tolerar la latencia.

### P.5 Los tres finales y las interrupciones (opciones, sin decidir)

| Caso | Qué debe pasar |
|---|---|
| **No hay video** (`pedir` devuelve `tope_dia`, o falla el reproductor) | mensaje y ningún boleto. Con `tope_dia`, «Vuelve mañana» con la hora de reinicio (F.1) |
| **Cerrado antes de tiempo** | no cobra. Opciones para el boleto: **(i)** se pierde y no cuenta para el tope; **(ii)** se pierde y cuenta, que es como funciona la publicidad real; **(iii)** se puede retomar mientras no venza (`pedir` devuelve el mismo boleto). Decide el rector (§M-5) |
| **Completado** | cobrar → `chipsCollect` → la cifra de la píldora sube con `valorEntre` → vuelo de moneda (opcional) → «+500 HC» |
| **Pantalla bloqueada a mitad** (`useCongelado`) | el contador visible se pausa y solo cuenta con la pestaña visible (con `Date.now()` mientras `!congelado`). Chrome no estrangula si suena audio, y sin audio va a ~1 Hz (FRZ-1 Fase 0, `:150-162`). El servidor solo exige los segundos mínimos desde la emisión |
| **Recargar la página** | se pierde el reproductor; el boleto sigue vivo en el servidor. Con la opción (iii) se puede retomar |
| **Red caída al cobrar** | reintento con el mismo id (idempotente); si falla para siempre, el boleto se cobra al volver mientras no venza |
| **Dos dispositivos a la vez** | el bloqueo de la billetera serializa. Con «un boleto vivo por cuenta», el segundo `pedir` recibe el mismo boleto; si no, dos boletos y el tope de 8 los cuenta igual |

### P.6 La costura futura

Un único módulo **reproductor**, con la interfaz `empezar() → {estado: 'no_disponible' | 'cerrado_antes' | 'completado'}`. Hoy lo implementa el simulado; mañana, el anuncio real.
- Se monta **una vez** cerca de App, como capa fija, y se expone por contexto con `pedirVideo()`, en el molde de `ProntoContext`.
- **Lo usarían:** `RetarIAS.jsx` (`AvisoSaldo`), `PantallaChips.jsx` (`pronto`), `Lobby.jsx` (`:138`, `:189`, `:261`), `SalaEspera.jsx:483`, `SalaOpciones.jsx:218`, `PartidaPvP.jsx:51` (si el «+» se conecta en todas), `GameTable.jsx` (caso 3 y derrota), `App.jsx` (el dueño del saldo) y la API de billetera.

### P.7 Pantalla completa

**Confirmado: la capa del video no necesita `data-sin-pantalla-completa`.**
- La marca solo está en copiar y compartir (`SalaEspera.jsx:527`, `:537`), porque `requestFullscreen` consume la activación que necesitan `navigator.share`, el portapapeles o abrir otra app (`src/lib/pantallaCompletaCore.js:63-69`; INV-45 en `docs/AJILEI_Invariantes_v1.0.md:85`).
- La pantalla completa va sobre `documentElement` (`:50-61`), así que una capa `position: fixed` vive dentro y no se ve afectada: «Modales y burbuja de recarga… Nada que hacer» (`AJILEI_PAN-1_Fase0_Informe_v1.0.md:94`).
- **El anuncio real sí podría necesitarla** si su SDK abre una ventana o pestaña al tocar «Ver un video» (`window.open` gasta la activación).
- **Efecto colateral:** si algo saca la pantalla completa dentro de la mesa, solo vuelve con «Iniciar mano» o «Siguiente mano». Importa si el video se lanza desde la tarjeta del caso 3.

---

## K · Riesgos, de más grave a menos

| # | Riesgo | Dónde | Mitigación en la Fase 1 |
|---|---|---|---|
| K-1 | **Juego sin pérdidas por abandono:** matar la app cuando la mesa va mal y que el dinero vuelva. Hoy ya pasa (C4) y con la vía (b) seguiría pasando | C4, §L | entrada cobrada al sentarse (vía (a)) y política de abandono que **no devuelva la entrada** |
| K-2 | **Cliente alterado que declara ganar siempre sin pasarse del techo** | §D.4 | techo por mesa + una mesa abierta + estadística agregada (tasa de mesas ganadas frente a la del `mañoso`) + la válvula de §E |
| K-3 | **Acuñación del jugador hábil** (hasta ~42.000 HC/h en Pro·5) | §E | válvula (S7) y/o revisar el pago de la mesa de 5 (§M-4) |
| K-4 | **Duplicación por doble toque** al sentarse (transición sin guarda) y **doble salida** (vencimiento + toque en el mismo fotograma) | C1, C3 | idempotencia en el servidor (una mesa abierta, una salida por mesa) + bandera «enviando» en el cliente |
| K-5 | **Duplicación por reintento de red** | C2, C3, P.4 | `clave_idem` única en `movimientos` y RPC que devuelven el estado en vez de fallar |
| K-6 | **Pérdida de dinero por red caída al salir** | C3 | salida reintentable; al arrancar, `mi_mesa_ia()` reconcilia |
| K-7 | **Carreras entre dispositivos** (dos mesas o dos videos con la misma billetera) | C6 | `for update` en la fila de billetera + índice único parcial «una mesa abierta» |
| K-8 | **Bono múltiple** por variantes de Gmail o por borrar y recrear la cuenta | G | correo canónico + tabla de bonos sin FK |
| K-9 | **IA quebrada revivida por el nivelado** (PLAUSIBLE) | D-1 | filtrar también `chips < unit` en `nivelarLasIAS`, o no ofrecer recarga en el PAYOUT que deja la mesa decidida |
| K-10 | **Dos saldos en el cliente** (vs-IA y PvP) | A-1 | una sola fuente: la billetera |
| K-11 | **Moldes de desarrollo que se cuelen en producción** (la billetera falsa) | J.2 | puerta doble + prueba sobre `dist/` |
| K-12 | **El arnés recibe `null` de toda RPC de saldo** | J.1 | billetera falsa con contrato real |

---

## L · Caminos

### L.1 Liquidación contra las IAS

**(a) Sesión de mesa abierta en el servidor (recomendada).**
- `sentarse_ia(reto, apuesta, jugadores, entrada)`: valida, bloquea la billetera, descuenta la entrada (movimiento `entrada_ia`), crea la fila en `mesas_ia` con `techo = E + (n−1)·P(E)` y devuelve `mesa_id`.
- `recargar_ia(mesa_id, nº, monto)`: valida (múltiplo, ≤ saldo, ≤ T), descuenta y hace `techo += r + (n−1)·T`.
- `salir_ia(mesa_id, fichas)`: `update … where abierta returning`; abona `min(fichas, techo)`, y la válvula si se elige; es idempotente.
- **Partida interrumpida (C4):** la mesa queda abierta. Al arrancar, `mi_mesa_ia()` la encuentra. El motor no se puede reconstruir, así que hay que cerrarla. Opciones (§M-9):
  - **(i)** cerrar con 0, sin devolver nada. Honesto e inexplotable, pero castiga un corte de red real;
  - **(ii)** devolver la entrada. **Explotable** (K-1);
  - **(iii)** el cliente informa la pila al terminar cada mano (`pila_ia(mesa_id, nº_mano, pila)`, topada por el techo) y el abandono abona la última pila informada. Es explotable solo dentro del techo y añade una llamada por mano.
- **Dos dispositivos (C6):** el índice único parcial impide abrir una segunda mesa. El segundo dispositivo ve «Tienes una mesa abierta en otro dispositivo» y puede **cerrarla** (con la regla de abandono) para abrir otra.
- **Costo:** tres RPC y una tabla, más la integración de App y GameTable con guardas. Es la vía que también deja preparado PvP (garantía en S4).

**(b) Liquidar solo al salir, con el neto declarado y topado.**
- El cliente lleva el saldo localmente durante la mesa y al salir manda `neto`; el servidor abona `max(−E_declarada, min(neto, tope))`.
- **Partida interrumpida:** **la pérdida no se apunta nunca**. Se puede jugar sin perder: basta matar la app en las mesas que van mal (K-1, sin mitigación posible en esta vía).
- **Dos dispositivos:** los dos juegan con el mismo saldo a la vez, y el servidor no lo puede impedir porque no sabe que hay una mesa.
- **Costo:** una RPC. Es más barata, pero **no es segura**. No se recomienda.

### L.2 El libro

Columna `billeteras.saldo` + `movimientos`, solo de inserción, con `clave_idem` única, ambas escritas en la misma transacción y fuera de Realtime (H.2–H.3). Hay que espejar `saldo_de()` sobre la billetera **sin cambiar su firma**, para que `crear_sala` y `unirse_sala` funcionen sin tocarlas (SALA:323-324 lo prometía).

### L.3 El video simulado

- **Se pide** desde `AvisoSaldo` de Retar y desde la tarjeta del caso 3, y opcionalmente desde el «+» una vez unificados los cinco «Pronto».
- **Se reutiliza:** `chipsCollect`, `valorEntre`/`valorConteo` para la subida de la píldora, `LluviaHeptacoins` si la lámina la quiere, y el patrón de consejos rotativos con textos nuevos. Pausa con `useCongelado`.
- **Boleto:** `pedir_boleto` / `cobrar_boleto` como en P.4, con el reloj del servidor, idempotente y con una vida de 10 min.
- **Costura:** un único reproductor detrás de `pedirVideo()`.

---

## M · Preguntas al rector

1. **El bono vale 1.200 en el código y 2.500 en S1.** `BONO_BIENVENIDA = 1200` (`src/config/salas.js:44`; sellado por `src/config/salas.test.js:76-86` y por `diagSAL.mjs:545-561`) frente a S1 y el normativo (`AJILEI_APU-1_Reglas_v1.3.md:93`, `:338`). Con 2.500, `ALCANCE_NUEVOS` pasa de [100, 200] a [100, 200, 500]. ¿Se corrige a 2.500 en ECO-1?
2. **El video vale 25 HC con tope de 5 en la configuración, y 500 con tope de 8 en S11.** `ajileiConfig.js:204-205` (`videoReward: 25`, `maxVideosPerDay: 5`, sin lectores) y `bonoDiario: 50` (`:203`) frente a S11 y S6 (constancia de 500 cada 3 días). ¿Se borran esas tres claves o se reescriben con las cifras de S6/S11?
3. **K-9 no consta como decidido.** S4 dice «en PvP las fichas son el saldo real (K-9 de MOT-1)», pero el informe de la Fase 0 de MOT-1 deja K-9 «sin recomendación» (`:782`), y el normativo vigente dice «entrada fija Corta 15× / Llena 50×, saldo ≥ entrada, sin recarga» (`AJILEI_APU-1_Reglas_v1.3.md:317-319`). ¿Las fichas de PvP son el saldo entero o una entrada sacada del saldo? Para el libro da igual (en los dos casos es una garantía); para el árbitro, no.
4. **Válvula (S7).** Los números de §E muestran que el rake no contiene la acuñación y que el tope solo muerde al hábil. ¿Rake, tope (¿en HC fijas o en múltiplos de la apuesta?, ¿qué cifra?), o los dos? ¿Y se abre en APU-1 la palanca de fondo, el pago de la mesa de 5 (`factorPila` 1,5 con un 50 % de mesas ganadas)?
5. **Video cerrado antes de tiempo:** ¿el boleto se pierde sin contar, se pierde y cuenta, o se puede retomar mientras no venza (P.5)?
6. **«Día»** (F.1): ¿medianoche UTC, la zona del jugador o 24 h móviles? ¿Y la marca de bono por hash de correo caduca (privacidad, G.4)?
7. **Hallazgo D-1:** ¿se corrige en ECO-1 que una IA quebrada en la mano en curso pueda ser nivelada (y revivir) por una recarga del PAYOUT? Antes conviene reproducirlo con un molde.
8. **CEL-2c (I.1):** ¿«Saldo actual» de la celebración sigue siendo la pila o pasa a ser la billetera? Según la respuesta, el rojo se re-sella o cambia de naturaleza.
9. **Abandono de una mesa contra las IAS** (L.1 (a)): ¿cerrar con 0, devolver la entrada (explotable) o abonar la última pila informada mano a mano?
10. **«Ocultar saldo»** (S9) y la propiedad de tapetes «comprada» sin cobro (`useTapetes.js:100-109`, «nace con Supabase (ECO-1)»): ¿entran en ECO-1 o quedan para la tienda?

---

## N · Estimación de la Fase 1

Los minutos son de Claude Code, incluidos el arnés y el informe de cada sub-tanda.

| Sub-tanda | Contenido | Min CC |
|---|---|---|
| **1a · Libro** | migración: `billeteras`, `movimientos`, `intentos_dinero`, `bonos_bienvenida`, correo canónico, `mi_billetera()`, bono en la creación del perfil, `saldo_de` sobre la billetera; pruebas de SQL comentadas | 150 |
| **1b · Cliente de saldo** | `saldo.js` asíncrono → contexto de billetera; cabecera, Retar y las cuatro pantallas PvP con una sola fuente; retirar `saldoSesion`; billetera falsa en `src/dev/` + guardia sobre `dist/` | 180 |
| **1c · Mesa contra las IAS en el servidor** | migración `mesas_ia` + `sentarse_ia` / `recargar_ia` / `salir_ia` / `mi_mesa_ia`; integración en App y GameTable con guardas de doble toque; política de abandono (§M-9); `allinHumano` con la entrada efectiva; D-1 si se aprueba | 240 |
| **1d · Constancia, límites y válvula** | `marcar_ingreso`, racha, límites por minuto (F.3), la válvula elegida (§M-4) | 120 |
| **1e · Arnés** | Supabase falso con billetera, modo `saldo` (J.3) e invariante nuevo, re-sellos de `diagSAL` (bono) y CEL-2c (§M-8), la línea base | 150 |
| **1f · Lámina del video** | inicio, espera, los tres finales y la celebración, en los viewports de la casa | 120 |
| **1g · Video simulado** (la última) | migración de boletos, reproductor con costura, sitios de P.1, pausa con `useCongelado`, fixtures `?apu=video:…`, arnés | 210 |
| **Total** | | **~1.170 min (~19,5 h)** |

**Lo que no se comprime:**
- **El `db push` de Victor:** uno por cada migración (1a, 1c, 1d y 1g), con la consulta de §O antes del primero.
- **La validación en el S25 y el Motorola:** tras 1b, tras 1c (la más delicada: abandono, red caída y dos dispositivos reales), tras 1d y tras 1g (pantalla bloqueada durante el video).
- **Las decisiones del rector:** §M-1 a §M-3 antes de 1a, §M-9 antes de 1c, §M-4 y §M-6 antes de 1d, §M-5 antes de 1f.

---

## O · Consultas para Victor (solo lectura, en el SQL Editor)

```sql
-- O-1 · Migraciones aplicadas (deben ser las 5 del repo)
select version, name from supabase_migrations.schema_migrations order by version;

-- O-2 · Cuántos perfiles y cuántos usuarios hay
select (select count(*) from public.profiles) as perfiles,
       (select count(*) from auth.users)      as usuarios;

-- O-3 · Definición viva de saldo_de (debe ser «select 5000»)
select pg_get_functiondef('public.saldo_de(uuid)'::regprocedure);

-- O-4 · Tablas de public (esperadas: intentos_codigo, profiles, reserved_usernames, sala_jugadores, salas)
select table_name from information_schema.tables
where table_schema = 'public' order by 1;

-- O-5 · Funciones de public con su firma (comparar con las migraciones)
select p.proname, pg_get_function_identity_arguments(p.oid) as args, p.prosecdef as security_definer
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' order by 1, 2;

-- O-6 · Disparadores sobre auth.users (esperado: ninguno)
select tgname from pg_trigger where tgrelid = 'auth.users'::regclass and not tgisinternal;

-- O-7 · Políticas de RLS vigentes
select tablename, policyname, cmd, roles from pg_policies where schemaname = 'public' order by 1, 2;

-- O-8 · Tablas publicadas en Realtime (para que el libro NO entre)
select schemaname, tablename from pg_publication_tables where pubname = 'supabase_realtime';

-- O-9 · Permisos de saldo_de (esperado: false para authenticated)
select has_function_privilege('authenticated', 'public.saldo_de(uuid)', 'execute') as authenticated_puede;

-- O-10 · Zona horaria de la base (para el «día» de F.1)
show timezone;

-- O-11 · Colisiones ya existentes por la regla de Gmail (solo recuentos, sin mostrar correos)
with c as (
  select case
    when lower(split_part(email, '@', 2)) in ('gmail.com', 'googlemail.com')
      then replace(split_part(split_part(lower(email), '@', 1), '+', 1), '.', '') || '@gmail.com'
    else lower(email) end as canon
  from auth.users where email is not null)
select count(*) as cuentas, count(distinct canon) as personas from c;

-- O-12 · ¿Se usa last_sign_in_at? (insumo de F.2; solo recuento)
select count(*) filter (where last_sign_in_at > now() - interval '1 day') as entraron_ult_24h,
       count(*) as total
from auth.users;
```

---

## STOP · Comprobaciones de cierre

| Comprobación | Resultado |
|---|---|
| Escrituras en el repo | solo este informe |
| Salidas de la simulación | todas en el scratchpad de la sesión (fuera del repo): 637 MB de volcados + análisis. `capturas-dsk/` no recibió nada nuevo (el banco solo ejecuta `mkdirSync` idempotente de `capturas-dsk/evidencia`, que ya existía) |
| Copias de trabajo | ninguna (no hubo worktree, clon ni unión); el `node_modules` del repo, intacto |
| Línea base de `main` (`eb378b0`) | **vitest 54 archivos / 1.323 pruebas en verde · lint 21 problemas (20 errores, 1 aviso) · build correcto** (`vite build`, con el aviso de chunk > 500 kB de siempre) |
| Puertos 4170–5599 a la escucha | solo `svchost` en el 5040 |
| Procesos `node` vivos | ninguno |
| `git status` | `?? docs/reportes/AJILEI_ECO-1_Fase0_Informe_v1.0.md` + los 5 residuos de siempre (los dos informes de MOT-1 y `laminas/mon1/{_entorno.txt, lamina.html, tiempos.json}`). Sin `git add` ni commits |
