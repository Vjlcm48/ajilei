# AJILEI · MES-PvP · Sub-tanda 7b (Armar mesa y sala, con lámina) · Informe · v1.0

- **Ficha:** `AJILEI_MES-PvP_Sub7b_v1.0.md` (rector, 2026-11-13).
- **Base:** `main` = `origin/main` = `a460e42` (la 7a publicada, con `duracion_sala` en la nube).
- **Recorrido:** tramo L (STOP-L, vuelta L2) → tramo A (STOP-A, vuelta L3) → túnel de Victor → tramo C (commits) → STOP-C. Sin push.
- **Norma:** `AJILEI_APU-1_Reglas_v1.11.md` §7 (la memoria de `PantallaChips`) y §8 (siete apuestas, Corta 15× · Llena 50×, el ritmo del anfitrión); el informe de la Fase 0 de la sub-tanda 7 (bloques A, B.2, B.3, C y E).
- **Sin migración, sin deploy de `partida` y sin control de las IAS:** no se tocó `GameTable.jsx` ni nada que monte, ni `src/arbitro/`, ni `supabase/`.

---

## Resumen

- **Armar mesa** trae las siete apuestas (con el 50), la fila **Entrada** (chips con el monto: «1.500 HC», «5.000 HC») y la fila **Ritmo** (Normal · Rápido), en el orden Jugadores · Apuesta · Entrada · Ritmo · ¿Cómo la llenamos? La Llena se apaga si el saldo no llega a 50 × apuesta, y la entrada vuelve sola a Corta si la apuesta sube. Con «Unirme», Ritmo va apagado y sin chip marcado. Recuerda el ritmo, nunca la entrada.
- **`crearSala` manda siempre `p_ritmo` y `p_entrada`.** La puerta de desarrollo `?ritmo=rapido` se retiró.
- **Salas** enseña «Entrada X HC» en las mesas Llenas, y «Te faltan» cuenta con la entrada de cada mesa. La entrada se lee de la tabla `salas`, sin migración.
- **La sala de espera y la partida PvP van ancladas** (casa en la cabecera, botón al pie, cuerpo que desplaza por dentro). La silla ocupada abre el mini-perfil; en el propio, «Editar» va apagado y avisa «Disponible fuera de la mesa», igual que el avatar de la barra. Todo lo que se toca en la sala mide 44.
- **`SalaOpciones` monta `PantallaChips`** con Δ 0 px, y el parche de la 1b se retiró.
- **`diagSAL` 114/114** (84/102 en `a460e42`). `1.8b` 177,2 → 177,7 KiB. «Retar a las IAS» no cambió.
- **El túnel:** T1 a T6 perfectas. T7, opcional, no se hizo.

---

## 1 · Lo hecho

| Pieza | Qué | Dónde |
|---|---|---|
| A1 · El núcleo | `APUESTAS_PVP = [50, 100, …, 5000]`; `ENTRADAS_PVP { corta: 15, llena: 50 }`, `ENTRADA_POR_DEFECTO`, `saldoMinimo(apuesta, entrada)`; `RITMOS_PVP`. `ALCANCE_NUEVOS` pasa a `[50, 100]` | `src/config/salas.js` |
| | `alcanza`, `faltanPara`, `buscarCombinacion` y `otraMesaAlAlcance` con la entrada (sin ella, la Corta). La identidad de una pública es jugadores × apuesta × entrada. `normalizarMesa` trae la entrada; `normalizarConfig` y `CONFIG_POR_DEFECTO`, el ritmo (uno desconocido cae a Normal) | `src/screens/salasCore.js` |
| | La memoria PvP guarda jugadores, apuesta, tipo y ritmo; la entrada no (Reglas §7) | `src/config/salaRecordada.js` · `src/config/memoriaChips.js` |
| A2 · La API | `crearSala(tipo, jugadores, apuesta, ritmo = 'normal', entrada = 'corta')` con `p_ritmo` y `p_entrada` siempre. `salasAbiertas` añade la entrada leída con `from('salas').select('id, entrada').in('id', …)`: `salas_abiertas()` no la devuelve y la política de lectura ya deja ver las abiertas. Si esa lectura falla, las mesas cuentan como Cortas | `src/lib/salasApi.js` |
| A3 · Armar mesa | Filas Entrada y Ritmo; Ritmo apagado con «Unirme»; Llena apagada por saldo y vuelta a Corta. Desde 700 px de ancho, fuera de la rejilla de dos columnas: Entrada y Ritmo lado a lado y las siete apuestas en una fila (L3) | `src/screens/ArmarMesa.jsx` · `src/styles/salas.css` §18 |
| A4 · La sala | `es-anclada`; la silla ocupada es botón y abre `MiniPerfil` con `apiRanking` desde `App`; el propio con «Editar» apagado; se cierra solo si la mesa arranca. El avatar de la barra apagado (decisión de L2). Los `::after` de 44 | `src/screens/SalaEspera.jsx` · `src/App.jsx` · `src/styles/salas.css` §18 |
| A5 · La partida | `Traje` anclado y con barra; mientras arranca o sale, la fila «Tapetes» apagada (INV-76) y el avatar con el aviso; en la muerta, todo vuelve a abrir | `src/screens/PartidaPvP.jsx` |
| A6 · Salas y el parche | `SalaOpciones` → `PantallaChips`, con el campo nuevo `cta.accion` para conservar `data-accion="armar"`. Después se retiró el parche de la 1b (521–830) y el traje `≤520`: ningún `.sal` queda sin `es-anclada` | `src/screens/SalaOpciones.jsx` · `src/components/PantallaChips.jsx` · `src/styles/salas.css` |

- **La tarjeta Llena que no cabe se aprieta.** «Te faltan 245.000 HC · Entrada 250.000 HC» (mesa de 5 a 5.000) no cabe en 360×640 ni en la rejilla de 1024×768. Solo entonces `useEncajeLlena` (`SalaOpciones.jsx`) baja su letra: **8,2 px en 360×640 y 12,4 px en 1024×768**. Aceptado por Victor; **queda pendiente para LEC-1**. En esa rejilla de 1024 la línea 1 ya se cortaba con «…» antes de esta tanda.
- **`data-sin-pantalla-completa`** (solo lectura): copiar y compartir ya lo llevaban.
- **Grafo de la mesa:** de los archivos tocados, solo dos aparecen en el grafo de importaciones de `GameTable.jsx`, y los dos los manda la ficha: `config/salas.js` (por `salaEsperaCore` → `salaPendiente`, que solo usa `normalizarCodigo`, sin cambios) y `textos.es.js` (solo añade claves).

---

## 2 · Las varas

### 2.1 · `diagSAL`: 84/102 → 114/114

19 estados por 6 tamaños. Los dos estados nuevos son permanentes y nombrados.

| Celdas | Antes (`a460e42`) | Ahora | Por qué |
|---|---|---|---|
| `opciones-fuera-alcance` ×6 | rojo: esperaba «Te faltan 20.000» (5×) | verde: «70.000», y las Cortas sin «Entrada» | La regla de 15× desde `342dbc7` |
| Las otras `opciones-*` ×30 (5 estados) | verdes | verdes, con Δ 0 px (§ abajo) | `SalaOpciones` en `PantallaChips` |
| `armar` ×6 | rojo: 6 apuestas, 2 apagadas | verde: 7 apuestas, 4 apagadas; orden Apuesta · Entrada · Ritmo; «1.500 HC* \| 5.000 HC», y con Llena elegida, subir a 200 da «3.000 HC* \| 10.000 HC(off)» | 15× y las filas nuevas |
| `armar-aviso` ×6 | rojo: apuesta 1.000, «100, 200 o 500» | verde: apuesta 200, «usa 50 o 100 HC» | Con 15×, el saldo de prueba (5.000) no llega a 1.000 |
| `armar-unirme` ×6 | verde | verde, y además «Normal(off) \| Rápido(off)» → «Normal* \| Rápido» al pasar a Privada | P-2 |
| `espera-*` ×48 (8 estados) | verdes | verdes; `esp.accion` rehecho para el pie anclado (caja de `--cta-h`, entera, al pie, con «Salir» dentro) y la zona igual en todas las variantes de cada tamaño (O1) | La fórmula vieja medía la columna sin anclar |
| `opciones-llena` ×6 (nuevo) | — | verde: 4 mesas (Llena alcanzable, Llena 3×200 fuera, peor caso 5×5.000, una Corta); ninguna línea cortada, las cuatro miden lo mismo | La tarjeta Llena |
| `espera-nombres` ×6 (nuevo) | — | verde: la silla es botón, mini-perfil ajeno y propio, «Editar» y avatar con el aviso, pasada de 44 | L4 y L5 |

**Las 18 celdas rojas conocidas** (`opciones-fuera-alcance`, `armar` y `armar-aviso`) son las tres primeras filas.

**Δ 0 de `SalaOpciones`:** las 36 capturas `opciones-*` y las 6 de `espera-fantasma` son idénticas píxel a píxel a las de `a460e42`.

### 2.2 · Controles rojos

Cada uno sabotea el árbol, corre su estado y restaura comprobando el hash.

| Control | Resultado |
|---|---|
| C1 · Llena encendida sin saldo | `armar` 6/6 rojo |
| C2 · Ritmo encendido con «Unirme» | `armar-unirme` 6/6 rojo |
| C3 · Sin el `::after` de 44 | `espera-nombres` 3/6 rojo (los tres teléfonos; en escritorio el tamaño natural ya llega) |
| C4 · Salas con 15× para todas las mesas | `opciones-llena` 6/6 rojo |
| C5 · Sin apretar la línea Llena | `opciones-llena` 2/6 rojo (360×640 y 1024×768) |
| C6 · El avatar abre el Perfil | `espera-nombres` 6/6 rojo |
| C7 · La sala sin anclar | `espera-anfitrion` 6/6 rojo |

C4 y C6 no salían rojos la primera vez y se arreglaron las varas: el estado con solo el peor caso no separaba 15× de 50× (se añadió la Llena de 3×200), y el avatar saboteado sacaba de la sala y el instrumento caía con código 2 (la pasada de 44 se mide antes y la sala desaparecida es rojo).

### 2.3 · La pasada de 44, medida

Zona real con `elementFromPoint`; entre paréntesis, sin el `::after`.

| | copiar | compartir | Salir | silla | Cancelar: no / sí |
|---|---|---|---|---|---|
| 360×640 | 44×44 (32) | 99×44 (36) | 114×45 (41) | 53×50 | 123×45 / 88×45 (41) |
| 640×360 | 44×44 (32) | 99×45 (39) | 114×45 (41) | 53×50 | 123×45 / 88×45 (41) |
| 844×390 | 45×45 (35) | 106×45 (39) | 124×45 (41) | 57×54 | 132×45 / 95×45 (41) |
| 1024 a 1920 | ≥ 53 | ≥ 162×44 | 189×55 | ≥ 83×80 | ≥ 145×55 |

La barra mide 103×46 o más. **Flecha, casa y ⚙ solo se informan:** en 640×360 miden 41 de alto la flecha y la casa y 40 de ancho el ⚙. Viene de la carcasa de la IOS-1 1e (pasa igual en Armar mesa y en Retar) y Victor decidió no tocarlo.

### 2.4 · `tam.8` y la vuelta L3

Con las dos filas nuevas, Armar mesa desplazaba en tableta y escritorio alto (`tam.8` rojo en 5 tamaños). Victor eligió la opción (a): desde 700 px de ancho y fuera de la rejilla B, el cuerpo pasa a `flex-flow: row wrap` (no rejilla: `tam.9` cuenta como «dos columnas» cualquier cuerpo `display: grid` de dos pistas), Entrada y Ritmo comparten línea y las apuestas van en una fila con un mínimo de 44 px (sin él, el «50» medía 43,1 en 832×390 y `tam.10` salía rojo). En 440×763 el hueco entre filas baja de 2,5u a 2u.

| Tamaño | Antes | Ahora |
|---|---|---|
| 744×1026 | 26 px | 0 |
| 1366×917 | 135 px | 0 |
| 1920×937 | 115 px | 0 |
| 440×763 | 9 px | 0 |
| 1366×831 | 13 px | 0 |
| 744×1047 | 5 px | 0 |

844×390 baja de 217 a 101 px. 360×640 y 640×360 quedan idénticos a L2 (10 capturas comparadas píxel a píxel). `tam` verde entero, 301/301.

### 2.5 · Las demás

| Vara | `a460e42` | 7b |
|---|---|---|
| `1.8b` | 177,2 KiB | **177,7 KiB** (JS 149,5 → 149,7; CSS 21,1 → 21,3); meta 185, techo 200 |
| `diagDSK retar` | verde | verde. Fuera del video, las capturas son iguales salvo 4–6 px de ≤ 3/255, el mismo parpadeo que la base da contra sí misma |
| `diagDSK cfg` | — | verde |
| `diagDSK tam` | verde | verde (tras L3) |
| `congelado`, `rev` | — | verdes |
| eslint · vitest | 0 | 0 · 2.976 (13 más que en `a460e42`, con los espejos del SQL de apuesta, `entrada_de` y ritmo) |

**La «1 omitida» de vitest** en la copia donde se probaron los árboles intermedios **no es de esta tanda:** es `scripts/testBancoBandas.test.js:192`, un `it.skipIf(sinVolcados)` de `ffcfe74` que se salta cuando faltan los volcados del banco, que no van en el repositorio. En el árbol de trabajo y en los aislados (que copian los volcados) corre: 0 omitidas.

---

## 3 · Los textos, tal como se pintan (UTF-8)

| Clave | Texto | Bytes |
|---|---|---|
| `sal.armar.ritmo` | `Ritmo` | 5 |
| `sal.armar.ritmo.normal` | `Normal` | 6 |
| `sal.armar.ritmo.rapido` | `Rápido` (á = U+00E1) | 7 |
| `sal.armar.entrada` | `Entrada` | 7 |
| `sal.armar.entrada.monto` | `{hc} HC`; se pinta «1.500 HC» (punto ASCII) | 7 |
| `sal.opciones.mesa.entrada` | `Entrada {hc} HC`, tras « · » (U+00B7) | 15 |
| `tie.cfg.fuera` (reutilizada) | `Disponible fuera de la mesa` | 27 |

El aviso a los nuevos, sin cambiar su clave, se pinta: «Con 200 HC, un invitado nuevo (2.500 HC de bienvenida) no podrá sentarse. Para invitar gente nueva, usa 50 o 100 HC.»

Ningún texto sellado de las Reglas cambió. Para las Reglas v1.12 (las escribe el rector).

---

## 4 · El túnel de Victor

Servidor de desarrollo sin bypass, contra la base real. S25 (`test1976`), Motorola (`ticotest2022`) y la PC de tercera silla.

| # | Prueba | Resultado |
|---|---|---|
| T1 | Privada, 50, Llena, Rápido; el Motorola entra por código; 5:00, «Tú», mini-perfil ajeno y propio con «Editar» apagado | perfecta |
| T2 | La partida arranca: reparto y reposición en Rápido; cada uno entra con 2.500 | perfecta |
| T3 | Pública, 2, 100, Corta; el Motorola ve «Unirme» con Ritmo apagado y se une | perfecta |
| T4 | 5.000 con Llena apagada; la vuelta a Corta al subir la apuesta | perfecta |
| T5 | Recuerda el Ritmo y no la Entrada | perfecta |
| T6 | S25 acostado y PC a 640×360: casa arriba, botón al pie y entero | perfecta |
| T7 | La partida muerta, anclada (opcional) | no se hizo |

---

## 5 · Commits

**Cómo se hicieron:**
- Los árboles intermedios a, b y c se probaron antes del primer `git add` en una copia de `a460e42` (build, vitest y eslint en 0).
- La huella del árbol de código probado, `b84541326d242838aea08f556dc4cc71b52c81a6` (`git write-tree` de los 21 archivos), se guardó antes del primer `git add`; el árbol de 7b-d es idéntico a ella.
- Cada commit por ruta explícita, con su `npm run aislado -- <sha> --perfil=commit` antes del siguiente: los cuatro en verde, con eslint en 0 igual a la base, `1.8b` y humo en código 0. `diagSAL` corrió aparte: 114/114 sobre el árbol de 7b-d (143 s, la cifra de §6 del registro) y otra vez sobre 7b-e.
- **Reubicaciones respecto al orden de la ficha** (cada prueba va con lo que mide): `testRetarIAS` en a (la política con `MEMORIA_PVP.campos`); `testDistSinMoldes` en b (la versión vieja prohíbe `p_ritmo`, que desde b va siempre); `testTapetes` §10 y `PantallaChips.jsx` en c; `salasFixtures` en d, con el arnés.

| | SHA | Título | Aislado |
|---|---|---|---|
| a | `bf10cfe` | MES-PvP 7b-a · el núcleo: siete apuestas, Corta y Llena, el ritmo recordado | verde, 808 s (vitest 2.972) |
| b | `ba7ac4e` | MES-PvP 7b-b · la API: crearSala con ritmo y entrada, y la entrada de las abiertas | verde, 814 s (vitest 2.976) |
| c | `314905f` | MES-PvP 7b-c · las pantallas: Armar mesa con Entrada y Ritmo, la sala y la partida ancladas, Salas en PantallaChips | verde, 809 s (vitest 2.976) |
| d | `5268458` | MES-PvP 7b-d · el arnés: los estados ?sal= y diagSAL a 114 | verde, 812 s (vitest 2.976) |
| e | (este) | MES-PvP 7b-e · documentos: INV-76, el Contrato y el informe | en el STOP-C |

**Documentos (7b-e):** el registro de invariantes (INV-76 admite `PartidaPvP` además de `SalaEspera`, con su vigilante §10; la fila de `diagSAL sal`, 114; la línea de «Actualizado») y el Contrato de MOT-1 (las filas de `APUESTAS_PVP`, Armar mesa, `salas_abiertas` y la sala de espera, hechas en la 7b).

Las sondas `laminas/lm1/`, `lm2/` y `lm3/` siguen sin seguimiento.

---

## 6 · Lo que queda

**Para la sub-tanda 8** (Contrato de MOT-1):
- «Mano actual · Humanos 500» en PvP (`consultar_mano` solo mira `mesas_ia`).
- Encender los puntos contra humanos (el interruptor existe y está apagado).
- Las cifras provisionales del §6 (`src/config/esperas.js`), con los teléfonos.
- El resto de GEN-1.

**Para la sub-tanda 9:**
- El registro de invariantes con Tienda v1.3 → v1.4.
- Topes, respaldo `state.winner` y la semilla de `vuelo`; el modo guion se anota (TUT-1/GUI-1).

**Abierto desde esta tanda, sin dueño asignado:**
- **LEC-1:** la línea Llena apretada a 8,2 px (360×640) y 12,4 px (1024×768), y la línea 1 de las tarjetas que ya se cortaba con «…» en la rejilla de 1024.
- **El texto del tope de 10 sentadas por minuto** (la otra mitad de la fila de `salas_abiertas` en el Contrato).
- **La cifra de lo devuelto en la partida muerta:** no se pinta mientras `liberacion_pvp` sea provisional.
- **Flecha, casa y ⚙ a 41/40 px en 640×360**, de la carcasa de la IOS-1 1e (no se tocan por decisión de Victor).
- **T7**, la partida muerta en real, sin probar por túnel (la cubren la lámina L7 y `diagSAL`).
