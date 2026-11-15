# AJILEI · MES-PvP · La mesa contra personas · Cierre de la campaña · v1.0

**Fecha:** 2026-11-15.
**Ficha:** `AJILEI_MES-PvP_Sub9_v1.0.md` (la sub-tanda 9).
**Base:** `main` = `origin/main` = `2571c42`, y los informes `AJILEI_MES-PvP_*` de `docs/reportes/`.
**Para qué sirve:** es el punto de partida de las campañas que heredan de MES-PvP. Las reglas viven en sus normativos: las Reglas de APU-1 v1.12, el Contrato de MOT-1 v1.5, la Tienda v1.5 y el registro de invariantes. Aquí queda la historia: qué hizo cada sub-tanda, qué dejó en la nube y qué hereda cada campaña.

---

## 1 · Las sub-tandas, con sus SHA

Todas están publicadas en `origin/main`. La numeración salta el 4 y el 6. Su contenido se repartió entre las láminas L-M, el árbitro v1.3 y la 7; lo que quedó de la antigua 6 está en la Sub5 Fase 0, §G.

| Sub-tanda | Fecha | Qué hizo, en una línea | Commits | Nube |
|---|---|---|---|---|
| **Fase 0** | 2026-11-05 | La sonda de la campaña: el prop `partida`, la reposición y `contribMano` por hacer, y el plan de las sub-tandas 0 a 9 | — (solo el informe) | — |
| **0** | 2026-11-05 | Documental: las Reglas v1.5, E-4, el Contrato v1.1 y la Tienda v1.4 | `86dcf79` | — |
| **1** | 2026-11-05 | El árbitro v1.1 (`volver_anuncio`, `ahora`, la ausencia con `N_AUSENCIA` 3), la función y el panel | `a0b5443` · `cdba92f` · `7cac208` | Deploy de `partida` |
| **2** | 2026-11-05 | El puente: un núcleo puro, el cliente y su hook, el árbitro imitado y las escenas | `18e20ee` · `3e16e13` · `a94d4c3` · `d2806f5` | — |
| **3** | 2026-11-06 | La mesa viva: `GameTable` sobre la partida real, las pantallas y capas, y `diagDSK pvp` en `commit` | `689e03c` · `30cae2f` · `4a6e51d` · `db0313b` | — |
| **3-A** | 2026-11-06 | El abandono (C-8): retirarse en el acto, cobrar la pila al irse; Contrato v1.2 | `8d8b2ff` · `88040b7` · `35422d7` · `d7a954e` · `ac96f51` | Deploy de `partida` |
| **L-M 1** | 2026-11-06 | El sorteo sobre la mesa (lámina y código) | `2999b21` · `a2fdca1` · `a6696f0` · `4a06230` · `ebf9fd4` | — |
| **L-M 2** | 2026-11-07 | Los mensajes de la mesa, la mesa de 5 y la ausencia; Reglas v1.8 | `1c08d4e` · `3efe963` · `8244195` · `defa3a8` · `dea0f79` · `d850df2` | — |
| **L-M 3** | 2026-11-07 | Entre manos: la transición en la mesa y las capas PvP | `54db8d9` · `9181404` · `20b6087` · `b759043` · `a4a76c1` · `efd4c33` | — |
| **v1.3-a** | 2026-11-08 | El sorteo y el mensaje en el árbitro, la función y la base | `d0d9e47` · `a601e1f` · `62d6ff9` · `0e7867c` · `8b89eb9` | Migración `v13_mensaje` |
| **v1.3-b** | 2026-11-08 | La recarga PvP en el núcleo, la función, la base y el cliente; Contrato v1.3 | `ad85b1f` · `e78d9d0` · `8095995` · `7516900` · `145c69d` | Migración `v13_recarga` y deploy de `partida` |
| **v1.3-c** | 2026-11-08 | El túnel del v1.3, solo cliente: un anillo en la oferta, una recogida por mano, sentado fuera con recarga, dorsos sin imagen rota | `a5553a6` · `f7543c4` · `732bcb9` · `6f3230d` · `7a8c7c1` | — |
| **5a** | 2026-11-12 | La mesa provisional, la ceremonia del sorteo, el corte en la voz; `pvp.mesa` y `pvp.lm` | `36d07ff` · `55b53dd` · `8d650ea` · `6d890a7` · `e1d7a98` | — |
| **5b** | 2026-11-12 | La reposición uno a uno según el ritmo; las `D_*` en `esperas.js`; Contrato v1.4 y Reglas v1.11 | `6993fe2` · `50ab660` · `6cfdbf2` · `7b4e08e` · `3455468` | Deploy de `partida` |
| **7a** | 2026-11-13 | Cuánto vive una sala (5:00 la privada, 3:00 la pública), el segundo reparto, la sala y cerrar sesión | `8a1f774` · `b843077` · `9d0eb60` · `7360eac` · `a460e42` | Migración `sub7a_duracion_sala` |
| **7b** | 2026-11-14 | Siete apuestas, Corta y Llena, el ritmo recordado, Armar mesa con Entrada y Ritmo; `diagSAL` a 114 | `bf10cfe` · `ba7ac4e` · `314905f` · `5268458` · `eaef6d4` | — |
| **8** | 2026-11-14 | La pausa de anuncio tras la 7 y la 15 (hasta 30 s), los puntos contra humanos encendidos, «Mano actual» entre personas y `partida_asientos.manos`; Contrato v1.5, Reglas v1.12 y Tienda v1.5 | `da44d01` · `fe748bd` · `9bf8a4f` · `2571c42` | Migración `sub8`, interruptor encendido y deploy de `partida` |
| **9** | 2026-11-15 | El cierre: la semilla de `vuelo`, la higiene, la Tienda v1.5 en Invariantes y este informe | Dos commits, `9-a` (la semilla) y `9-b` (los documentos); sus SHA van en el chat del STOP-C | — |

Las Fases 0 propias de algunas sub-tandas (v1.3, 5, 7 y 8) van dentro de sus informes.

---

## 2 · Lo que la campaña deja en la nube

**Migraciones** (`supabase/migrations/`), las cuatro aplicadas con `db push --linked` y verificadas con sus Grupos A y B en el SQL Editor:

| Migración | Sub-tanda | Qué trae |
|---|---|---|
| `20261107200000_mespvp_v13_mensaje.sql` | v1.3-a | El mensaje de la mesa |
| `20261108120000_mespvp_v13_recarga.sql` | v1.3-b | La recarga PvP |
| `20261113150000_mespvp_sub7a_duracion_sala.sql` | 7a | `duracion_sala`: 5:00 y 3:00 |
| `20261114120000_mespvp_sub8_consulta_pvp_manos.sql` | 8 | «Mano actual» en la sala y `partida_asientos.manos` |

**El árbitro:** la función `partida` va con el Contrato v1.5. Se desplegó en las sub-tandas 1, 3-A, v1.3, 5b y 8.

**El Contrato de MOT-1:** v1.1 (sub-tanda 0) → v1.2 (3-A) → v1.3 (v1.3) → v1.4 (5b) → v1.5 (8). La 9 no sube versión: el árbitro no cambia, solo se cierra una fila del §9.

**Los datos:** el interruptor de los puntos contra humanos está encendido desde el 2026-11-14 (`interruptor_puntos_humanos(true)`).

**Los normativos que deja:** las Reglas de APU-1 v1.12, la Tienda v1.5 y el Contrato v1.5.

---

## 3 · La sub-tanda 9

### 3.1 · La semilla de `vuelo` (commit a)

`vuelo` jugaba sin sembrar el azar: la victoria humana llegaba entre la mano 2 y la 12, y en la corrida `completo` de ARN-4 se cortó por el tope. Ahora siembra `Math.random` con la pieza de ARN-4 (`arnes/siembra.mjs`), una semilla por escenario en `VUELO_SEMILLAS`, y admite `--semilla=N`. Si una semilla deja de dar su escenario, la celda sale «sin cobertura» con «re-elegir semilla», y no roja; una mesa atascada sigue siendo roja. INV-82 ya nombra `vuelo`.

**Los controles:**
- **Rojo antes del arreglo:** `vuelo --semilla=1` daba error de instrumento (código 2): «--semilla solo vale en «msg», «apu» y «u3»».
- **Misma semilla, misma partida:** dos corridas con la 1 dan la misma secuencia (el humano gana en la mano 7, pozo 700, saldo de 500 a 1.250; la IA que gana es la 4, en la mano 1). Sobre `de468b3`, el cierre de MOT-1, da exactamente la misma.
- **Otra semilla, otra partida:** con la 2 el humano gana en la mano 10, con pozo 550, y la IA que gana es la 3.

**Se sella la 1:** da los dos escenarios antes (en la mano 7 y en la 1; unos 6 min la vara entera).

**El hallazgo: `vuelo humano` sale rojo, y es un defecto del producto anterior a MES-PvP.** La puerta `septimaEnDestino` pide que la séptima moneda aterrice a ±1 px de la moneda del ganador. Cuando gana el humano, aterriza a 10,44 px en horizontal (dy 0,17):

| Corrida | Gana el humano | dx |
|---|---|---|
| Semilla 1, sobre `2571c42` | mano 7 | 10,44 |
| Semilla 1, repetida | mano 7 | 10,44 |
| Semilla 2 | mano 10 | 10,45 |
| Semilla 1, sobre `de468b3` (antes de MES-PvP) | mano 7 | 10,44 |

El escenario de la IA sale verde en las cuatro. La moneda sí llega a su `hasta`: la escala termina a la vez que el desplazamiento y llega al 99 %. Lo que se mueve es la moneda destino del humano. El producto mide el destino en la transición de fase (`useCelebracion.js:87`), y las monedas salen al soltar la espera de `showdown.mp3`, unos 1,9 s después (`:98`). En ese hueco algo de la barra del humano se desplaza; qué exactamente no se midió. La mesa PvP hereda el mismo vuelo.

Las salidas verdes de antes (ARN-3b, ARN-4d) serían manos donde no se daba el caso. `vuelo` no corrió en ninguna sub-tanda de MES-PvP: no está en las 19 varas del control de las IAS.

**Decisión de Victor (STOP-B):** se sella la semilla 1, y `vuelo humano` queda como **rojo conocido**, con su excepción escrita en INV-82 al estilo de INV-22. Se reproduce con `node scripts/diagDSK.mjs vuelo --semilla=1`. Se retira cuando LEC-1 vuelva a medir el destino de la moneda al soltar la espera. El defecto se hereda a LEC-1, o a PVP-2 si se abre antes (§4).

### 3.2 · La higiene

Victor borró a mano, con las rutas que dio la ficha:
- `capturas-ren1/` (7,1 MB): nadie la escribe desde que se retiró `verifyREN1.mjs`;
- `capturas-idn1/f2/` (1,5 MB): igual, desde `verifyIDN1.mjs`; `evidencia/` se queda;
- `capturas-idx/` (38 MB): `gen-idx.mjs` la regenera;
- `laminas/lm1/` a `lm3/`: sondas sin seguimiento, ya sustituidas por `scripts/pvp/varasLM.mjs`.

Ninguna estaba con seguimiento: no hay commit de eliminaciones, y `.gitignore` no cambia. El resto de las `capturas-*` se conserva, porque los modos vivos las reescriben. **`capturas-dsk/` guarda los 75 volcados sin seguimiento de los que depende `testBancoBandas`** (`scripts/apu1_bandas_origen.json`): borrarla haría que esa prueba se omita sin dar rojo.

**La regla para que no vuelva a pasar:** las sondas van al scratchpad de la sesión, nunca a `laminas/`. En `laminas/` solo entra lo que se comprometa.

### 3.3 · Lo que la 9 cierra de los informes

- **Invariantes con la Tienda v1.5** (anotado en la sub-tanda 1 como «v1.3 → v1.4»): las seis citas de `AJILEI_Tienda_v1.3.md` pasan a la v1.5, cuyo §13.3–§13.8 es el mismo (INV-12, INV-69, INV-76, INV-77, la lista de documentos y `diagDSK tienda`).
- **`vuelo` sin semilla:** la fila del Contrato §9 queda «Hecho».
- **Los topes en `limite_dinero()` y el respaldo `state.winner`:** ya estaban hechos (Sub5 Fase 0 §G, fila 12; la 8 cerró `state.winner`).

### 3.4 · Los controles del cierre

Sobre `2571c42` con los cambios de la 9, antes de los commits (`npm run varas -- --solo eslint,vitest,build,guiones,1.8b`):

| Control | Resultado |
|---|---|
| eslint | 0 errores y 0 avisos, igual que la base |
| vitest | 109/109 archivos, 2978 pruebas, 0 fallidas, 0 omitidas |
| build | compila |
| `npm run guiones` | verde: 21 migraciones, 10 guiones × 2 pasadas (`mespvp8` 14/14) |
| 1.8b | 177,9 KiB en el cable (techo 200, meta 185) |
| `git worktree list` | una línea |

**Sin control de las IAS:** la 9 no toca nada que monte la mesa. `scripts/diagDSK.mjs` es el arnés.

**El último control de las IAS de la campaña** fue el de la 8, sobre `2571c42`:
- 17 varas en código 0;
- `msg` en 1, por el INV-22 conocido;
- `apu.360x640` en 2 por su servidor (5173 no respondió tras el build); repetida sola, salió verde.

**`completo`:** corre después del push, sobre el SHA publicado de la 9, como línea base de MED-1a (§4). No bloquea el cierre.

---

## 4 · La herencia, por campaña

| Campaña | Lo que hereda | Dónde está anotado |
|---|---|---|
| **LEC-1** | Flecha, casa y ⚙ a 41/40 px en 640×360 (la carcasa de IOS-1 1e, también en Retar y Armar mesa) · la tarjeta Llena apretada a 8,2 px (360×640) y 12,4 px (1024×768), y la línea 1 de las tarjetas que ya se cortaba con «…» en la rejilla de 1024 · los 8 px del pozo · el texto del tope de 10 sentadas por minuto · **el destino de la moneda que vuela** (el rojo conocido de `vuelo humano`, §3.1): volver a medirlo al soltar la espera de `showdown.mp3`; con eso se retira la excepción de INV-82. Si PVP-2 se abre antes, lo hereda PVP-2 | Sub7b §«Abierto» · la ficha de la 9 · INV-82 |
| **MED-1a** | Los eventos de la pausa de anuncio · `origen` con país · **la CLI de Supabase v3** (decisión de la 9: se sube en MED-1a, como su primer commit propio, con un deploy de `partida` sin cambios antes de construir nada; en v3 `--linked` y `--project-ref` quedan obsoletos y las fichas pasan a `--remote`; `db push` pide confirmación) · **la línea base `completo`** sobre el SHA publicado de la 9 (unas 6 h 25 min, en ventana oculta) | STOP-L de la 9 (L-4) · la ficha de la 9 |
| **GEN-1** | La invitación como registro (hoy no hay ninguno: `?sala=` sienta) · el resto de GEN-1 (el reloj de 3:00, que un bono de 2.500 solo alcance la Corta) · **E9**, el iPhone sin cuenta por `?sala=`, sin probar desde SAL-B2 · `unirse_sala` por id no mira el tipo de sala (riesgo bajo, anterior a MES-PvP; pide migración) | Sub8 Fase 0 §C y §R · Sub8 §9 |
| **AMI-1** | `partida_asientos.manos` ya existe (criterio ≥ 1; también lo suma quien está sentado fuera, sin cobrar) · borrar la cuenta del anfitrión se lleva en cascada la sala, la partida y los `partida_asientos` de todos (`salas.anfitrion_id on delete cascade`); el libro de puntos sobrevive | Contrato §7 y §9 · Sub8 Fase 0 §D |
| **NOC-1** | Los puntos dobles van en una columna aparte, no en `puntos_base` (`libro_puntos_base_chk` obliga a `sentados + 3`); el disparador del total tendría que sumarla. La «noche» se deriva de `creado_en` | Sub8 Fase 0 §A.4 |
| **La ola 0** (con los teléfonos) | Los 15 s de la oferta · los 5:00 y 3:00 de las salas · la pausa tras la 7 y la 15, y sus 30 s · las cifras provisionales de `src/config/esperas.js` (Contrato §6) · la cifra de lo devuelto en la partida muerta, que no se pinta mientras `liberacion_pvp` sea provisional | Contrato §9 · Sub7b §«Abierto» · la ficha de la 9 |
| **PVP-2** (solo si hace falta) | Lo que se rompa en las mesas de 4 y 5 en producción (ficha de la 9, §5): concurrencia real (R-6 de la Fase 0), T7 (la partida muerta en real, sin probar por túnel) | Fase 0 de la campaña, §M (R-6) · Sub7b §«Abierto» |
| **iOS** | El iPhone de punta a punta (R-11): las cinco sesiones de la ficha de la 9 no llevan iPhone | Fase 0 de la campaña, §M (R-11) |
| **TUT-1 / GUI-1** | El modo guion: ni el árbitro, ni el motor, ni la función tienen manos escritas | Sub5 Fase 0 §G, fila 13 · Contrato §9 |

**Cerrados por decisión, sin heredero:**
- La cuenta atrás de la tarjeta del anuncio: la Tienda v1.5 la quita. Si algún día vuelve, es lámina.
- Los dos matices de las Reglas v1.9 frente al código (`{n}` frente a `{N}`, y «Es Mano IA» sin número en la mesa de 2): «se dejan así» (Contrato §9).

---

## 5 · Lo que falta para cerrar del todo

**Las mesas de 4 y 5, en producción** (Victor, ficha de la 9, §5). Cinco cuentas en S25, Motorola y tres ventanas de la PC; mesa privada, apuesta 100, Rápido. Después, en el SQL Editor, el libro con `sentados` 4 y 5, `puntos_base` 7 y 8, y `partida_asientos.manos` de cada asiento. Si nada falla, MES-PvP queda cerrada del todo y arranca MED-1a; lo que falle va a PVP-2.
