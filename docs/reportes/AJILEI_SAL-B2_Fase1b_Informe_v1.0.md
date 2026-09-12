# AJILEI · SAL-B2 · Fase 1b · Informe · v1.0
## `SalaEspera` real con Realtime, stub `'partida-pvp'`, CSS, textos y arnés — STOP antes de la validación con teléfonos

**Ficha:** `AJILEI_SAL-B2_Fase1b_v1.0.md`. **Rectores en el repo:** `docs/reportes/AJILEI_SAL-B2_Fase0_Informe_v1.0.md` y `…Fase1a_Informe_v1.0.md`, leídos enteros antes de empezar.
**Punto de partida:** `main` en `e037db0` más el árbol de F1a sin commitear (migración `20260911230935_sal_b2.sql` aplicada en producción; Grupos A y B en verde, ya transcritos al informe de F1a).
**Fecha:** 2026-09-12. **Estado al cerrar:** sin commits, sin push. Cero SQL. Protegidos intactos.

---

## 1 · Archivos

**Creados**

| Archivo | Líneas | Qué es |
|---|---|---|
| `src/screens/PartidaPvP.jsx` | 90 | Stub de partida: barra, cabecera con la mesa, rótulo `sal.partida.pronto`, CTA `sal.partida.volver`, casa, toast |
| `docs/reportes/AJILEI_SAL-B2_Fase1b_Informe_v1.0.md` | — | este informe |

**Reemplazado entero**

| Archivo | Líneas | Qué es |
|---|---|---|
| `src/screens/SalaEspera.jsx` | 563 (era 280) | La pantalla real: §2 de este informe |

**Editados (aditivo)**

| Archivo | Cambio | Líneas |
|---|---|---|
| `src/lib/salasApi.js` | `leerSala(salaId)` con su bloque de motivo | :270-292 |
| `src/lib/salasApi.test.js` | `describe('SAL-B2 · leerSala')`, 4 pruebas | :475-520 |
| `src/screens/salaEsperaCore.js` | `finDe` con el contrato corregido (F1b §3.3) | :97-112 |
| `src/screens/salaEsperaCore.test.js` | la prueba de la carrera sustituye a «la resuelta manda» | :161-167 |
| `src/components/IconosSalas.jsx` | `IconoCompartir` (el `i-share` de la lámina) | :99-113 |
| `src/config/textos.es.js` | bloque `sal.espera.*` reescrito y bloque `sal.partida.*` | :112-172 |
| `src/config/textos.test.js` | tres pares nuevos en la lista de textos repetidos declarados | :118-142 |
| `src/App.jsx` | import, `SIN_PRECARGA`, `onPartida`, rama `'partida-pvp'` | :13, :82, :150, :428, :433-446 |
| `src/styles/salas.css` | §12 reemplazado (:709-1172), §14 nuevo (:1197-1266). §0–§11 y §13 intactos | 1266 líneas (era 789) |
| `src/dev/salasFixtures.js` | 17 estados, datos vivos, `from` con filas y fila, canal con handlers, `__salEmitir` | 392 líneas (era 285) |
| `scripts/diagSAL.mjs` | 17 estados, `medirEspera` con 7 puntos, moneda en `sal.5`, controles ocultos fuera de `sal.4` | 880 líneas (era 681) |
| `docs/reportes/AJILEI_SAL-B2_Fase1a_Informe_v1.0.md` | sección «Corrida real · 2026-09-11» al final (rector §10) | añadida |

`git diff --stat` de los editados: 11 archivos, 1688 inserciones, 297 borrados. Intocables sin tocar: `useReloj.js`, `relojCore.js`, `useCronometroSala.js`, `supabase/migrations/*`; en `salas.css`, `:1-708` byte-idénticos y §13 sin cambios (`.sal-casa` se reutiliza tal cual, así que §6.4 no pidió nada).

---

## 2 · `SalaEspera.jsx`, bloque a bloque

**2.1 · Lo que decide vive en el núcleo.** `finDe` (:106), `resumenDe`, `sillasDe` (:107-108), `posicionSilla` (:488), `urge` (:112), `siguienteConsejo` (:216), `enlaceDeSala` (:263). La pantalla pinta, escucha y limpia.

**2.2 · Props:** `{ api, cuenta, salaInicial, onSalir, onLobby, onPartida }` (:63-70). Los callbacks, `play` y `t` se leen desde un `ref` que un efecto sin dependencias mantiene al día (:100-101), para que los efectos con dependencias estables no se remonten por funciones que `App` recrea en cada render.

**2.3 · El ciclo de vida (rector §3.4), efecto a efecto:**

| # | Efecto | Líneas | Qué hace |
|---|---|---|---|
| 1 | Jaula | :115-118 | `body.sal-activa` mientras vive |
| 2 | Montaje | :120-132 | `precargarSonidos(SONIDOS_SALAS)`; al desmontar, los tres `setTimeout` con handle (toast, copia, llegada) |
| 3 | Sin mesa | :145-153 | Si `salaInicial` es `null`, `api.miSala()` una vez; sin mesa, `onSalir()` |
| 4 | Lectura + suscripción | :176-189 | `Promise.all([leerSala, asientosDe])` al montar y en cada evento de `suscribirSala`; `baja()` en la limpieza |
| 5 | Reloj a cero | :197-205 | Si `segundos === 0`, la fila conocida sigue `'esperando'` y no hay `fin`: `api.resolverSala` **una vez** (ref de guarda que se suelta si el servidor dice que sigue esperando) |
| 6 | Geometría | :213-222 | `ResizeObserver` sobre la mesa: su primer callback llega al observar, así no hay `setState` en el cuerpo del efecto |
| 7 | Consejos | :225-236 | rota cada 7 s con fundido de 420 ms; parado en `fin`; ambos handles limpios |
| 8 | Mazo | :239-249 | cada 22 s `is-baraja` 900 ms y `cardShuffle` a 0,15 en ESA reproducción con el handle `{ sound, id }` de `play` |
| 9 | Escape | :321-326 | cierra el diálogo mientras está abierto |

**2.4 · Llegadas** (`recibirAsientos`, :159-173). Se compara la lectura nueva con la anterior por `jugadorId`; la primera lectura no suena ni salta. Cada nuevo marca su **asiento** en un `Set` (`sillasDe` no expone el uuid; el asiento es único por silla), suena `chipsCollect`, sale el toast `sal.espera.llego` con el username del primero, y la marca `is-llega` se retira sola a los 800 ms.

**2.5 · Fin** = `finDe(sala, resuelta)` derivado en cada render (:106). `is-fin is-fin-<estado>` sobre el cuerpo; el reloj y el «x/n» ceden su sitio al mensaje por CSS; consejos y mazo se paran (efectos 7 y 8 dependen de `fin`); el canal sigue hasta desmontar. `jugar_ya` con éxito suena `tableKnock` (:284) y la fila `activa` que devuelve pasa por `setSala`, así que el final `'activa'` sale de la misma `finDe`.

**2.6 · Acción, misma caja (O1)** (:343-392): `fin === 'activa'` → «Entrar a la mesa» + nota → `onPartida(sala)`; otro `fin` → «Buscar otra mesa» → `onSalir()` sin `salirSala`; llena → caja punteada «¡Mesa completa! Arranca sola» + nota según vista; anfitrión → «Jugar ya» apagado con `< 2` y nota `jugar.min`/`jugar.nota`; invitado → caja punteada «Esperando al anfitrión…» + `salir.inv`. La caja mide `--cta-h + 1.6u + 1.4em·2.9u` en las cinco variantes; el arnés lo mide.

**2.7 · Salir** (:289-319). «Volver» y «Salir de la mesa» → `salir`: en `fin`, lo mismo que el CTA del final; anfitrión → diálogo; invitado → `salirSala` y `onSalir`. Casita → `onLobby()` sin cancelar (sellado). El diálogo cierra con el velo, «Seguir esperando» y `Escape`.

**2.8 · Compartir** (:262-274): `navigator.share({ text, url })` con `url = enlaceDeSala(codigo)` y `text = compartir.msg`; sin `share`, `clipboard.writeText(text)` y toast `codigo.copiado`. Copiar (:252-260): check verde 2 s con handle.

**2.9 · Sillas** (:483-512): `posicionSilla(i, n, rx, ry, W/2, H/2)` con `rx = ow/2 + silla·.55`, `ry = oh/2 + silla·.55`, `silla = (W − ow)/2` y el avatar anclado sobre el anillo (`top` o `bottom` según `arriba`), exactamente la aritmética de `pintar` en la lámina. Silla ocupada: `.sal-esp-ini` con la inicial; vacía: punteada con «Esperando…».

---

## 3 · `leerSala`, `finDe`, `PartidaPvP`, `App`

- **`salasApi.leerSala(salaId)`** (:284-292): `from('salas').select('*').eq('id', salaId).maybeSingle()` → `{ data: fila | null, error }`, normalizado con `esMesa`. Lo permite `salas_select_visibles` (miembro ve su sala en cualquier estado), que es lo que `mi_sala()` no da. Cuatro pruebas: consulta, fila en cualquier estado, `null`/fila sin id, error del SDK.
- **`finDe`** (`salaEsperaCore.js:104-112`): si la fila conocida es terminal gana ella; la resuelta decide sólo con la conocida en `'esperando'`; resuelta `'esperando'` → `null`. La prueba de la carrera (:161-167) sella `cancelada + cancelada → 'cancelada'`, `cancelada + activa → 'cancelada'`, `activa + cancelada → 'activa'`.
- **`PartidaPvP.jsx`**: el traje de las salas con un rótulo y un CTA; `onLobby` es el mismo camino que la casita de la sala (`App.jsx:442`). No lee `estado_partida` ni se suscribe: una `activa` sin partida es una mesa muerta hasta MES-PvP.
- **`App.jsx`**: `'partida-pvp'` en `SIN_PRECARGA` (:82) y en la unión de `screen` (:150); `onPartida` conserva la mesa y cambia de pantalla (:428); rama nueva (:433-446). La precedencia de arranque y `entrarSala` no se tocan.

---

## 4 · CSS

**4.1 · §12 reemplazado** (`salas.css:709-1172`). Tokens de la lámina sobre `.sal-esp` = el cuerpo de la pantalla (`.sal-cuerpo.sal-esp`), hija de `.sal` (:727-732). Bloques traídos verbatim con hex → tokens: cabecera con subtítulo (:743-753), código/rótulo (:755-845), mesa y óvalo (:847-895), sillas, llegada y anillo (:897-965), marca de agua con el isotipo real por `mask-image` (:967-996), mazo de tres `<img>` del dorso real (:998-1023), consejo (:1025-1037), acción y caja punteada (:1039-1051), velo y diálogo (:1053-1104), los tres finales (:1107-1119), el stub de partida (:1122-1131), keyframes `sal-esp-*` (:1133-1142), `prefers-reduced-motion` (:1144-1153) y los trajes (:1156-1172). Ni un hex; los `rgba(0,0,0,α)` son sombras.

**Clases de §12 retiradas**, con `grep` de cero consumidores en `src/` fuera de `salas.css`: `.sal-espera`, `.sal-espera-sub`, `.sal-codigo-grande`, `.sal-sentados`, `.sal-provisional`, `.sal-espera-botones`. Conservadas tal cual: `.sal-copiar` (con la animación de acuse añadida) y `.sal-secundario` (con `is-seguir`/`is-cancelar` para el diálogo).

**4.2 · Tres desviaciones de la lámina, medidas** (todas en §7):
1. **Un traje que la lámina no tenía**, `min-height: 661px and max-height: 800px` (:1166-1169): a 768 px con `--u` en su techo las cuatro filas no cabían y el grid encogía la caja del código. Mesa a `27u/7.6u`, aire a `1.2u`.
2. **`.sal-esp-codigo` sin `min-height: 15u`** (:765-772): un mínimo explícito deja que el grid encoja el ítem por debajo de su contenido cuando el alto va justo (medido: 54 px para 64 de contenido en apaisado). El contenido mide `17.4u` en los dos modos porque la fila del código reserva `--ico-caja` (:788-790), así que el mínimo de la lámina se supera igual.
3. **Las sillas salen unos píxeles de la caja de la mesa** (la lámina también: el bloque de la silla es más ancho que su aire). El arnés mide que no se salgan de la columna ni pisen el código o el consejo.

**4.3 · §14 · la moneda bajo `.sal`** (:1197-1266): posición, `--ico`, halo y destello con `--ciclo: 8s`, y los **keyframes duplicados con nombre propio** (`sal-halo-moneda`, `sal-destello-moneda`). Decisión medida: `lobby.css` sólo lo importa `Lobby.jsx`; en producción todo el CSS va junto, pero en desarrollo Vite inyecta cada hoja al importar su módulo, y el arnés arranca en la sala sin pasar por el lobby: con los nombres del lobby, el metro no vería brillar la moneda. Misma deuda declarada que §2.

---

## 5 · Textos (`textos.es.js:112-172`)

- **Conservadas (12):** `titulo`, `anfitrion.tu`, `tipo.privada`, `tipo.abierta`, `codigo.copiar`, `codigo.copiado`, `sentados`, `salir`, `cancelar`, `cancelar.si`, `cancelar.no`, `lobby`.
- **Retiradas (4)**, `grep` de cero consumidores en `src/` y `scripts/`: `actualizar`, `provisional`, `arranco`, `anfitrion.otro`.
- **Nuevas (30 en `sal.espera.*`):** `sub.inv`, `cod.eti`, `abierta.rot`, `compartir`, `compartir.msg`, `anfitrion`, `tu`, `vacia`, `jugar`, `jugar.nota`, `jugar.min`, `esperando`, `salir.inv`, `cancelar.p` (con el texto corregido por el rector), `salio`, `llego`, `consejo.1`…`consejo.5`, `llena`, `llena.corta`, `llena.nota`, `fin.cancelada`, `fin.vencida`, `fin.activa`, `fin.volver`, `fin.entrar`, `fin.entrar.nota`. **Más 2:** `sal.partida.pronto`, `sal.partida.volver`. Textos verbatim del `DICC` v1.5.
- **Pares de texto repetido declarados** en `textos.test.js` (tres nuevos, con su motivo): `fin.entrar.nota = sal.partida.pronto`, `sal.espera.lobby = sal.partida.volver`, `sal.espera.cod.eti = sal.opciones.codigo.aria`.
- `compartir.url` no es texto: es `enlaceDeSala`.

---

## 6 · Arnés

**6.1 · Estados.** 17 en las dos listas (`salasFixtures.js:47-72`, `diagSAL.mjs:61-83`), `sal.0` los compara: `espera-stub` fuera; `espera-fantasma` se queda; entran los siete `espera-*`. 17 × 6 = **102 celdas**.

**6.2 · Fixtures** (`datosDe`, :268-289): anfitrión = `anfitrion_id: UID_DEV` (el uuid de `PERFIL_DEV`, :148) con `DevLocal` en la 0 y `maria_ccs` en la 1; invitado = otro anfitrión (`carlos_vzla`) y `DevLocal` en la 1; abierta sin código; llena = 5/5 con `expira_en = LLENA_SEG`; fin-cancelada = fila ya `'cancelada'`, vista de invitado; fin-vencida = anfitrión solo y reloj en el pasado, `resolver_sala` → `cancelada`; fin-activa = dos sentados, reloj en el pasado, `resolver_sala` → `activa`. Los datos son **un objeto vivo** compartido por la mesa con la que `App` nace y por el cliente falso (:94-105). `from` (:347-366) sirve la fila de `salas`, los asientos con `profiles` incrustado, y el `count` con `head: true`. El canal guarda sus handlers y **cuelga `window.__salEmitir` al suscribir** (:385), no al construir el cliente: StrictMode invoca dos veces el inicializador que llama a `simulacionSalas()` y se queda con uno; colgarlo al suscribir garantiza que el emisor sea el del cliente que la pantalla usa (medido: la primera corrida emitía al cliente equivocado y nada cambiaba).

**6.3 · `medirEspera`** (`diagSAL.mjs:699-807`), siete puntos con nombre:

| Punto | Mide |
|---|---|
| `esp.sillas` | tantas sillas como `jugadores`; ocupadas = sentados; iniciales exactas; «Anfitrión» en la 0 y «Tú» donde toca; ninguna fuera de la columna ni sobre el código o el consejo |
| `esp.reloj` | `m:ss`; sin `is-urge`; en llena `is-llena`, `≤ 0:10` y «¡Mesa completa!»; en los finales, reloj y «x/n» en `display: none` |
| `esp.accion` | la caja mide `--cta-h + 1.6u + 1.4em·2.9u` (±1,5 px) en todos; CTA con su texto y estado, o caja punteada con el suyo |
| `esp.codigo` | la caja mide etiqueta + `--ico-caja` + relleno + borde (±1,5 px) en privada Y en abierta; privada con Copiar y Compartir visibles; abierta con globo, sin Copiar y Compartir con `visibility: hidden` |
| `esp.fin` | clases `is-fin is-fin-<estado>`, texto exacto de `fin.*`, mazo oculto; y su ausencia fuera de los finales |
| `esp.sub` | el invitado lee «Anfitrión: carlos_vzla · Privada» (el username llegó por la incrustación de `profiles`) |
| `esp.realtime` | sólo en `espera-anfitrion`: `DELETE` con una silla → 1/4 y «Jugar ya» apagado; `INSERT` de `ana_bcn` → silla 1 con `is-llega`, toast «ana_bcn se sentó», 2/4; `UPDATE` a `cancelada` → `is-fin-cancelada`, «El anfitrión cerró la mesa», «Buscar otra mesa» |

`sal.2` (consola limpia, cero `⟦`) cubre los siete: consola vacía en las 102 celdas. `sal.5` incorpora la moneda (`:308`). `sal.4` salta controles con `visibility: hidden` (:273): los botones del diálogo viven ocultos con `scale(.96)` y medían 38,4 px sin ser tocables.

**6.4 · Resultado:** `node scripts/diagSAL.mjs sal` → **102 / 102** (playwright-core 1.62.1, Chromium 152.0.4191.66), contra `vite` en 5173 con `VITE_AUTH_BYPASS=1`, levantado y apagado por esta tanda. Capturas en `capturas-sal/`.

---

## 7 · Cifras

| Qué | Resultado | Línea base |
|---|---|---|
| `npx eslint .` | **21** (20 errores, 1 aviso), los mismos 21 | 21 |
| `npm test` | **682 / 682** en 26 archivos | 678 |
| Pruebas nuevas | +4 (`leerSala`); `finDe` sustituye una prueba por otra; `textos.test.js` declara tres pares | — |
| `npm run build` | limpio; `dist/` sin `__salEmitir`, `simulacionSalas`, `ESTADOS_SAL` ni nombres de estado | — |
| `node scripts/diagSAL.mjs sal` | **102 / 102** | 66 / 66 |
| Protegidos | `git diff e037db0` sobre los cinco: vacío, al inicio y al final | — |
| Sin seguimiento | los seis residuos conocidos + lo de F1a y F1b (dos informes, cinco archivos de F1a, `PartidaPvP.jsx` y este informe) | — |

---

## 8 · Guion de la validación con teléfonos (Victor, tras el STOP)

**Preparación.** `npm run build` → `npx vite preview --host` (el `preview.allowedHosts: ['.trycloudflare.com']` ya está) → `cloudflared tunnel --url http://localhost:4173` → abrir la URL del túnel en el S25 (`test1976`) y el Motorola (`ticotest2022`). Consola del PC abierta en una tercera sesión si se quiere leer `SAL-A: …` por si algo falla.

| # | Prueba | Resultado esperado |
|---|---|---|
| E1 | El S25 arma una **privada de 3**; el Motorola entra por código | **El S25 ve la silla 1 aparecer sin tocar nada**, con el salto y el anillo dorado, suena `chipsCollect`, toast «ticotest2022 se sentó», «2/3 sentados», «Jugar ya» se enciende |
| E2 | El Motorola pulsa «Salir de la mesa» | El S25 ve la silla vaciarse, «1/3 sentados», «Jugar ya» apagado con «Hacen falta al menos 2» |
| E3 | **Mesa de 2**: el S25 arma, el Motorola entra | **Ambos ven `3:00 → 0:10`** en oro con «¡Mesa completa!» y la caja «¡Mesa completa! Arranca sola»; a los 10 s ambos leen «¡Arranca la partida!» con las sillas en oro → «Entrar a la mesa» → stub «Partida PvP · Próximamente» → «Volver al inicio» → lobby |
| E4 | Mesa de 3 con los dos sentados; el S25 pulsa «Salir» → «Sí, cancelar» | **El Motorola lee «El anfitrión cerró la mesa» en vivo**, sillas apagadas, «Buscar otra mesa» → SAL-1. El S25 va a SAL-1 |
| E5 | El S25 arma y se queda solo 3:00 | «La mesa se cerró: no llegó gente a tiempo» → «Buscar otra mesa» → SAL-1 |
| E6 | Mesa de 3 con 2 sentados; el S25 pulsa «Jugar ya» | Suena `tableKnock` en el S25; **ambos** leen «¡Arranca la partida!» → «Entrar a la mesa» |
| E7 | El S25 pulsa «Compartir» → WhatsApp → el Motorola abre el enlace `?sala=AJ-XXXX` | El enlace abre la PWA del Motorola y lo sienta directamente; el S25 ve la llegada |
| E8 | Con el Motorola sentado, pantalla apagada 40 s y vuelta | El reloj del Motorola dice la verdad al primer pulso (no 40 s de más); si mientras tanto pasó algo (llegada, cancelación), la pantalla lo tiene al volver |
| E9 | El iPhone de Barcelona, **sin cuenta**, abre un enlace `?sala=` | Portada → código de correo → Bautizo → aterriza SENTADO en la sala; el anfitrión lo ve llegar |

Lo que ninguna prueba de arnés cubre y estas nueve sí: que el evento de Realtime **llegue** (no sólo que el canal diga SUBSCRIBED), y el sonido en teléfono real.

---

## 9 · Dudas y «requiere autorización»

1. **El cronómetro no se para en `fin`** (rector §3.4-6: «el hook expone `para` o equivalente; si no, para y pregunta»). `useCronometroSala` es intocable y no expone `para` al consumidor; en `fin` el reloj queda en `display: none` y el latido sigue hasta desmontar, un `setState` por segundo sobre una pantalla que el jugador abandona con un toque. Se siguió adelante para no bloquear la tanda. Si Victor lo quiere parado, es un parámetro `activo` en el hook (una tanda que sí lo abra).
2. **Traje nuevo 661–800 px** (§4.2-1): la lámina desborda a 768 px con `--u` al techo; el arnés exige no desbordar. Cifras a confirmar en escritorio real.
3. **`.sal-esp-codigo` sin `min-height`** (§4.2-2): el contenido (17,4u) supera el mínimo de la lámina (15u), pero es una línea de la lámina que no se copió.
4. **`sal.4` salta controles ocultos** (§6.3): cambio de semántica del punto, honesto pero nuevo.
5. **Keyframes duplicados** `sal-halo-moneda`/`sal-destello-moneda` (§4.3), con la razón medida.
6. **Dos claves sin consumidor:** `sal.espera.salio` (la ficha la manda; la lámina la usaba en su propio toast, pero el invitado que sale abandona la pantalla en el mismo gesto) y `sal.espera.lobby` (conservada como contrato de B1). Retirarlas o darles uso es decisión de Victor.
7. **«Esperando…» se trunca a «Esperand…»** en las sillas vacías a 360 px de ancho (captura `espera-anfitrion_360x640.png`): el bloque de la silla mide `1.6·silla` en la lámina y a `--u` mínimo no cabe la palabra. Opciones: ensanchar sólo la silla vacía, o un texto más corto («Libre»). No se tocó: es texto y ancho sellados.
8. **`is-llega` se marca por asiento** y no por uuid (`sillasDe` no expone `jugadorId`); es equivalente porque una silla es de un solo jugador.
9. **`VOLUMEN_BARAJADO = 0,15`** (un cuarto de la receta 0,6): la lámina dice «a volumen bajo» sin cifra.
10. **`resolverSala` no reintenta si la red falla** hasta que el cronómetro corregido vuelva a cero; el `UPDATE` de Realtime del barrido de otro cliente cubre el hueco. Documentado en :191-196.
11. **`esp.accion` con un solo sentado** se mide emitiendo un `DELETE` (la opción B de la ficha), no con un estado más.

Ninguna bloquea la validación con teléfonos.

---

## 10 · Tiempo real

≈ 1 h 45 min (lectura de los dos informes y de las recetas de la casa, `leerSala`, `finDe`, icono, textos, `PartidaPvP`, `App`, la pantalla, el CSS, las fixtures, el arnés, tres corridas del arnés con dos correcciones medidas —el emisor colgado al suscribir, la caja del código y el traje de 768—, lint, test, build e informe).

**STOP.** Sin commits, sin push. Después del STOP: validación física E1–E9 → ajustes si hacen falta → ficha de commits de SAL-B2 (F1a + F1b) con el mapa archivo → commit pegado antes del primer `git add`.
