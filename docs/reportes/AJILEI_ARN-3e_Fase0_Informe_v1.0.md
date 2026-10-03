# AJILEI · ARN-3e · El registro de invariantes y el cierre de ARN-3 · Fase 0 · Informe v1.0

**Fecha:** 2026-10-03, de 05:07 a 05:18 por el reloj de la máquina (tope 60 min).
**Ficha:** `AJILEI_ARN-3e_Fase0_v1.0.md`.
**Punto de partida:** `main` en `7db208c` (ARN-3d-4), con los 5 residuos conocidos.
**Tipo:** Fase 0, solo lectura. En el repo solo se escribió este informe. Sin commits y sin `git add`.
**Dónde se experimentó:** una copia `git archive HEAD` en el scratchpad (`arn3e/copia`), con una unión a `node_modules`. Solo vitest: no se levantó ningún servidor ni ningún navegador.
**Protegidos:** ninguno abierto.
- Las huellas se calcularon leyendo sus bytes desde fuera (`git hash-object`, `sha256sum`, `wc -l`), como permite D2.
- De `gameTable.css` solo se leyeron líneas sueltas con `grep`/`sed` para citarlas (`:783`, `:798`, `:1194-1196` y los comentarios de `!important`).
- El byte cambiado del experimento §B1 fue en el `seatLayouts.js` **de la copia**, por `Buffer`, y se restauró copiando el del repo (`cmp`: idéntico).

---

## Resumen

| § | Resultado |
|---|---|
| **§A · censo** | La semilla de ARN-3 §B12 (~350 reglas únicas) sigue valiendo. ARN-3a–3d añaden **~45 reglas nuevas**, casi todas del arnés y casi todas con vigilante. Tabla borrador de **42 invariantes transversales**: **31 vigilados** (5 de ellos parciales), **4 vigilables barato** (dos ya probados aquí) y **7 solo doctrina**. De las diez de la muestra, ARN-3 cambió el vigilante de **cuatro** (1, 7, 8 y 10) |
| **§B1 · huellas de los protegidos** | **Protegidos §3 ya fija las huellas** (blob de 12, `sha256` de 16 y líneas), y **las seis coinciden hoy una a una**. La prueba lee §2 y §3 del propio documento (sin JSON aparte, sin copiar nada). **En la copia:** 8/8 verde · un byte cambiado → **rojo** · restaurado → verde · un 7.º protegido sin fila en §3 → **rojo** · §3 ilegible → **rojo** |
| **§B2 · `!important`** | **Hay 3, todos documentados**: `.card-selected` en `playingCard.css:24-26`. Su sitio escrito es `Sistema_Diseno_v1.2.md:432-433`, más `luz.css:195`; **la hoja en sí no lleva comentario**. Las otras ~40 apariciones son comentarios que dicen «sin `!important`». Ningún `setProperty(…, 'important')`. **En la copia:** verde · uno nuevo en CSS → **rojo** · uno por `setProperty` en JS → **rojo** · una excepción retirada → **rojo** |
| **§C · doctrina** | **Ningún documento dice que los óvalos sean intocables.** La regla vive repartida en comentarios de `gameTable.css` (O1, DSK-O2) y de `voz2.css` (D7). Texto propuesto en §C1. **Las dos contradicciones están localizadas**, y hay **cuatro sitios más** que listan 3 protegidos o dicen «cinco» (§C2) |
| **§D · remiendos** | `all` corre 7 modos y tarda ~43 min, 40 de ellos de `apu`. `humo` serían ~4 min. Hay **9 sitios** de código que nombran `all`. **`apu.5`: confirmada la doble lectura**, y una sola evaluación **no basta** si la condición sigue siendo `capas > 1` (§D2). E-22 y el orquestador, planificados |
| **§E · aplazados** | **Tabla única de 41 filas**: **22 vigentes** con dueño, **19 resueltos** con su prueba. Los pendientes de iOS son **38 marcas en 13 campañas**; ninguna ficha de ARN-3a–3c lleva alguna, y la 3d sí |
| **§F · Fase 1** | Dos sub-tandas: **3e-i** (pruebas y arnés, ~2 h 15) y **3e-ii** (documentos, ~1 h 45). Unas **4 h** en total |
| **Varas en la copia** | vitest **50 archivos · 1 241 verdes + 1 saltada en voz alta = 1 242** (1 232 de hoy + las 10 nuevas). La saltada es la de los volcados de `testBancoBandas`, que la copia no lleva |

---

## §A · El censo de invariantes, al día

### A1 · Fuentes

La tabla de ARN-3 §B12.1 sigue valiendo: unas **~350 reglas únicas**, de 400–560 afirmaciones. Las nuevas fuentes de ARN-3a–3d son **informes**, porque la serie no escribió doctrina (3a §3: «no hay en `docs/` un documento de uso del arnés»).

| Fuente nueva | Reglas permanentes (aprox.) | De qué |
|---|---|---|
| `ARN-3a` (D1–D9) | ~7 | navegador sellado, códigos 0/1/2, puertos ajenos, servidor en proceso, `NODE_ENV` propio |
| `ARN-3b` + `3b-ii` | ~9 | bucle común, `cobertura` ≠ rojo, turno fantasma, mesa reducida aparte, `vuelos` con alcance, el pago por su señal |
| `ARN-3c` (3c-i + 3c-ii, §24) | ~15 | aislamiento de red, barrido «Heptacoins», `msg` con semillas, índice de volcados, varas por mayoría de 3, `congelado`, encadenado honesto, la compuerta del roce, un solo build, LF |
| `ARN-3d` (Fase 0 + Fase 1 + revisiones) | ~10 | mesa diferida (sin import estático, sin blanco, sin chunk en la Portada, `1.8b`), la precarga nunca recarga, las listas de precarga de sonido, consola limpia, el molde `?apu=gana` dentro de §6.1 |
| Comentarios «no negociable» del código | ~10 más, ya contados en §B12 | O1 y DSK-O2 en `gameTable.css`, VOZ-2 D7 en `voz2.css`, cabeceras de las hojas aditivas |

**Total al día: unas ~395 reglas únicas.** Lo nuevo sale casi todo con vigilante, porque cada tanda de ARN-3 dejó una puerta con su control. Lo que falta es lo de siempre: reglas escritas solo en código o solo en informes.

**El alcance del registro es una pregunta (§G-1).** Las ~395 incluyen las 60–80 del normativo de APU-1 y las cadenas de Menú, Tapetes, Celebración y Modos, que ya se vigilan por sus propias pruebas. La tabla de A2 propone un registro **transversal**: las reglas que cruzan campañas, más un puntero por documento normativo («vigilado por sus pruebas: …»). No propone un registro **exhaustivo** de ~395 filas.

### A2 · La tabla borrador del registro

Vigilante: `script modo [puerta]` · `archivo.test.js` · «doctrina» · «nadie».

| id | Regla (una línea) | Fuente | Vigilante hoy | Etiqueta |
|---|---|---|---|---|
| **INV-01** | Los seis protegidos no cambian sin autorización de Victor | `Protegidos` §1–§3 | **nadie** (a mano en los cierres) | **vigilable barato:** `testProtegidos.test.js` (§B1, probado) |
| INV-02 | La siembra (§6.1) no cambia ninguna decisión de la IA ni de la baraja | `Protegidos` §6.1 | `testNivel1.test.js` §1 (test de oro) | vigilado |
| **INV-03** | CSS aditivo: sin `!important`, salvo las 3 de `.card-selected` | `Protegidos:50-51` · `Sistema_Diseno:432-433` · cabeceras de `rec`/`rev`/`luz`/`salas`/`menuMovil` | **nadie** (`eslint` no mira CSS) | **vigilable barato:** `testImportant.test.js` (§B2, probado) |
| **INV-04** | Los óvalos de la mesa no se tocan: ni geometría, ni CSS, ni contenido que los haga crecer | **no escrita como regla** (§C1). En código: `gameTable.css:1194-1196`, `:4985`, `:5016`, `:5473-5475` · `voz2.css:30-39` (D7) | `o1`, `o2`, `h1`, `r1`/`r2`, `msg`, `apu` (`solapeOvalo`), `luz`/`rev` (Δ 0), `diagPUE voz2.ovalo`. **Hueco:** `o1`/`o2` solo en escritorio | vigilado (parcial) · **doctrina por escribir** |
| INV-05 | O1 general: nada aparece ni desaparece sin una caja ya reservada | `SUP-2b:12` · `Sistema_Diseno:517` · `APU-1_Reglas_v1.3:224` | `p1` (`noShift`), `h1`, Δ de `a1`/`a2`/`m1`/`f1` | vigilado (parcial) |
| INV-06 | La pastilla TURNO no produce salto | **solo código** (`GameTable.jsx`, `OpponentPanel.jsx`) | `p1`, `h1` (sano de nuevo desde 3b: 16/16). **Solo escritorio** | vigilado · doctrina por escribir |
| INV-07 | Piso táctil de 40 px (44 en lobby y menú) | `diagDSK` («estándar de campaña») · `Menu_Utilidades_v1.2:145` · `APU-1_Reglas_v1.3:217` | `tactil`, `u1`, `u2`, `menu-movil`, `diagSAL` p4, `lob`, `apu`, `retar` | vigilado · doctrina por escribir |
| INV-08 | Un solo oro | `Identidad_A_v1.1:71` · `Sistema_Diseno:7, 42, 90, 149` | parcial: `testIdxCore:47`, `diagPUE 2.5j`, `tapetes` | **solo doctrina** en lo global: contar oros por pantalla no es barato |
| INV-09 | «Siguiente mano» siempre tocable, salvo con la recarga pendiente | `VOZ-2_Fase1:18, 192` · `Victory_Celebration_v1.0:317-319` · `APU-1_Reglas_v1.3:186, 212, 224` | `voz2.capa(a)`, `voz2.siguiente` y su control · `apu` (el caso contrario) | vigilado |
| INV-10 | Dos caminos de render del rival (`opp-panel` y `.ai-zone`) | `Sistema_Diseno:179-201` · `GameTable.jsx:95` | `tapetes`, `p1`, `h1`, `apu`, `rec2`, `msg` (P5 en `hueco5`/`hueco2` desde 3c), el `LEER` del bucle común (desde 3b). **Nadie afirma la matriz de enrutado** | vigilado (parcial) · la matriz, **vigilable** en `gate` (no se diseña aquí) |
| INV-11 | Anclaje óptico del isotipo: prohibido centrarlo geométricamente | `Icono_v1.0:33-49` | nadie (`lob.5` solo mira 2:3 y `src`) | **solo doctrina** |
| INV-12 | Solo las claves de almacenamiento censadas | `Tapetes_v1.0:52-53` · `Victory_Celebration_v1.0:309-311` · censo en `LOB1_Fase0:302` | parcial: `testTapetes`, `puerta.0`. **ARN-3d añadió una clave**: `sessionStorage` `ajilei.recargaPorChunk` | **vigilable barato:** prueba de fuente con lista blanca de claves, el molde de `testImportant` (§G-6) |
| INV-13 | El arnés corre en el Chromium sellado (151.0.7922.34, `playwright-core` 1.62.1) | ARN-3a D1–D3 | `scripts/arnes/nucleo.test.js` | vigilado |
| INV-14 | Códigos 0/1/2: error > rojo > `cobertura` > verde; una lista vacía es 2 | ARN-3a D5 · 3b §1.3 | `nucleo.test.js` | vigilado |
| INV-15 | El arnés nunca toca un puerto ajeno | ARN-3a D8 | `nucleo.test.js` (`pidQueEscucha`) + P6 a mano | vigilado (parcial) |
| INV-16 | El arnés no habla con la base real: una escapada es código 2 | ARN-3c D6 | `terminar()` de cada corrida · `nucleo.test.js` (`veredictoAislamiento`) | vigilado |
| INV-17 | «El caso no se dio» no es rojo: es `cobertura` | ARN-3b D4 | `scripts/arnes/juego.test.js` | vigilado |
| INV-18 | Nunca «X está pensando…» con X en «Se retiró» (turno fantasma) | ARN-3b D8 (`verifyC441b`) | el bucle común en `a1`, `a2`, `m1`, `h1`, `f1`, `o1`, `u1` y `vuelo` | vigilado |
| INV-19 | Lo medido en mesa reducida se aparta, no tiñe la geometría | ARN-3b D3 | `juego.test.js` · `a1` (en vivo en 3b-ii §4) | vigilado |
| INV-20 | Vuelos de la zona del humano: bajo la banda solo con la banda visible, nunca fuera de la zona, y el sobrante solo sobre tapete | ARN-3b-ii §2 · 3c-ii §12. **Solo en el comentario de `diagDSK`** (3b-ii §2.3: «no está en ningún documento») | `a2` (`vuelosBanda`, `vuelosZona`, `vuelosSobrante`) | vigilado · doctrina por escribir |
| INV-21 | La banda «Tu mejor palo» solo se ve en el pago | DSK-A2 · ARN-3c-ii §13 | `a2` `cicloVisibility` (por `A2_EN_PAGO`) | vigilado |
| INV-22 | Ninguna caja con «Heptacoins» desborda | ARN-3c D4 (fusión de `verifyREN1`) | `msg` P5 | vigilado |
| INV-23 | Varas de tiempo por mayoría de 3, sin aflojar umbrales | ARN-3c D9 | `scripts/arnes/varas.test.js` · `diagCEL0 celebracion`, `diagPUE dis`, `diagPUE mesa` | vigilado |
| INV-24 | `msg` es reproducible: la vara son las semillas 1–15; `--semilla=azar` es exploración | ARN-3c D7 | `msg` | vigilado |
| INV-25 | Con la pestaña oculta no corre nada: 5 guardas. `retirado` **no alcanzable**, `arranca` **no sellada** (límite declarado) | ARN-3c §11.1.2 · §24-3 | `diagDSK congelado` | vigilado, con límite |
| INV-26 | La fiesta se encadena al `end` del toc-toc (honesto) | ARN-3c §11.1.1 · 3d D13 | `diagCEL0 celebracion` · `varas.test.js` | vigilado |
| INV-27 | En la celebración de mano suena el roce y nada más | ARN-3c §11.1.3 | `vc` p1 (`AJENO=[…]`) | vigilado |
| INV-28 | `tableKnock` en `SONIDOS_LOBBY` y `chipsCollect` en `SONIDOS_MESA`; la Portada no paga ninguno | ARN-3d D9/D14 | `scripts/testPrecargas.test.js` · `vc` (`loaded`) | vigilado |
| INV-29 | `GameTable` solo se importa de forma dinámica | ARN-3d B11 | `scripts/testMesaDiferida.test.js` | vigilado |
| INV-30 | `1.8b` ≤ 200 KiB | CAP-1 · ARN-3 B11 | `diagPUE 1.8` | vigilado |
| INV-31 | Entrar a la mesa no pinta blanco, y el chunk no se pide en la Portada | ARN-3d §2.4 · H3d-1/H3d-2 | `diagPUE mesa` (sola, fuera de `todo`) | vigilado |
| INV-32 | La precarga nunca recarga; la entrada recarga una vez por sesión, sin bucle | ARN-3d, revisión del STOP-2 | `src/lib/cargarMesa.test.js` (`decidirFalloChunk`) | vigilado |
| INV-33 | La consola de `retar` y `apu` sale limpia: el filtro de ruido está vacío | ARN-3c D12 · 3d D15 | `retar`, `apu` | vigilado |
| INV-34 | Los volcados de la vara del banco son los del índice (`sha256`) | ARN-3c D5 | `scripts/testBancoBandas.test.js` | vigilado |
| INV-35 | Un solo build por tanda; el resto con `--sin-build` | ARN-3b-ii · 3c H3c-6 · D13 | nadie | **solo doctrina** |
| INV-36 | Las varas de tiempo corren solas; como mucho 6 arneses a la vez | ARN-3b-ii D5 · H3b-5 | nadie | **solo doctrina** |
| INV-37 | Todo en LF | ARN-3c D16 · `.gitattributes` (`eol=lf`) | git normaliza al añadir | vigilado (por git) |
| INV-38 | Los avisos en pruebas van por `stderr`, no por `console.warn` | H3c-1 | nadie (hoy solo un archivo avisa, y lo hace bien) | **vigilable barato:** prueba de fuente, ningún `console.warn` fuera de comentarios en `*.test.js` |
| INV-39 | Un protegido se lee para citarlo (`grep`/`sed`), no se abre | `Protegidos` §7.4 punto 4 | nadie | **solo doctrina** |
| INV-40 | Una copia de pruebas: su unión a `node_modules` se quita con `rmdir` **antes** de borrarla | ficha de commits de ARN-3d (el tropiezo) | nadie | **solo doctrina** |
| INV-41 | Cada informe marca sus pendientes de iOS | ARN-3e D5 | nadie | **solo doctrina** |
| INV-42 | Las reglas de la mano se congelan hasta PAYOUT | `Reglas_Mano_Congeladas_v1.0` §5 | `scripts/testHandRules.test.js` (7) | vigilado |

**Recuento (42 filas, una etiqueta por fila):**
- **vigilados (31):** 02, 04, 05, 06, 07, 09, 10, 13–34, 37 y 42.
  - Cinco son parciales: 04 y 06 solo en escritorio, 05, 10 sin la matriz de enrutado, y 15.
  - Ampliarlos: la matriz de 10 es vigilable en `gate`; el hueco móvil de 04 no es barato (§G-4).
- **vigilables barato (4):** 01 y 03, ya probados en la copia; 12 y 38, del mismo molde.
- **solo doctrina (7):** 08, 11, 35, 36, 39, 40 y 41.
- **Doctrina por escribir:** 04, 06, 07 y 20 tienen vigilante, pero ninguna regla escrita en `docs/`.

El molde de formato sigue siendo `Reglas_Mano_Congeladas_v1.0.md` §5 («Qué lo vigila»).

### A3 · Las diez de la muestra de ARN-3 §B12, hoy

| # | Regla | Vigilante en ARN-3 Fase 0 | Hoy | ¿ARN-3 lo cambió? |
|---|---|---|---|---|
| 1 | El óvalo, intocable | `o1`, `o2`, `h1`, `r1`/`r2`, `msg`, `apu`, `luz`/`rev`, `voz2.ovalo` | Los mismos. `o1` corre sobre el bucle común y aparta el óvalo de la mesa reducida (3b) | **Sí:** `o1` ya no se tiñe por una quiebra. Sigue sin regla escrita (§C1) |
| 2 | Los protegidos no cambian | ninguno | ninguno | No. **Propuesta:** `testProtegidos` (§B1) |
| 3 | Piso táctil de 40 px | `tactil`, `u1`, `u2`, `menu-movil`, `diagSAL` p4, `lob`, `apu`, `retar` | Los mismos (no se corrieron en ARN-3 salvo `u1`, `lob`, `apu`, `retar`, todos con el mismo veredicto) | No |
| 4 | Un solo oro | parcial | parcial | No |
| 5 | CSS aditivo sin `!important` | ninguno | ninguno | No. **Propuesta:** `testImportant` (§B2) |
| 6 | «Siguiente mano» siempre tocable | `voz2.*`, `apu` | Los mismos, más `congelado.sigue` (3c), que mide la guarda de «Siguiente mano» a oscuras | No en lo esencial |
| 7 | Dos caminos de render | `tapetes`, `p1`, `h1`, `apu`, REC-2, `msg` | Más `msg` P5 en las dos vías del hueco (3c) y el `LEER` del bucle común, que cuenta vivos por las dos (3b) | **Sí, amplía.** La matriz de enrutado sigue sin puerta |
| 8 | Pastilla TURNO sin salto | `p1`, `h1` (`h1` estaba 0/16 por instrumento) | `h1` **16/16** desde 3b (D6: el borde derecho de la cifra) | **Sí:** `h1` vuelve a vigilar |
| 9 | Anclaje óptico del isotipo | ninguno | ninguno | No |
| 10 | Nada de almacenamiento donde no toca | parcial | parcial, y con **una clave nueva** (`sessionStorage` `ajilei.recargaPorChunk`, ARN-3d) | **Sí, en contra:** hay una clave más y ningún censo la recoge |

### A4 · Lecciones técnicas de ARN-3 que deben quedar como regla

| Lección | Regla | Dónde debería vivir |
|---|---|---|
| **H3c-1** | Un aviso en una prueba va por `process.stderr.write`: `console.warn` no se ve con el reporter por defecto de vitest | Registro (INV-38), con su prueba de fuente si el rector la quiere. Ya está escrito en `testBancoBandas.test.js:169` |
| **La unión a `node_modules`** | Se quita con `rmdir` antes de borrar la copia. Si `rmdir` falla, **se para**: nada de `rm -rf` sobre una carpeta que aún enlaza al repo | Registro (INV-40), en la parte de «reglas de trabajo del arnés». También en la memoria de Claude Code, que ya la recoge |
| **H3d-2** | `React.lazy` necesita un *thenable* síncrono (módulo ya en memoria) o una transición; un `Suspense` local deja ≥ 300 ms en blanco | **Ya vive en `src/lib/cargarMesa.js:16-19`** y lo vigila `diagPUE mesa` (INV-31). El registro solo apunta ahí |
| **H3d-ii-2 y H3d-ii-3** | Chromium deja en caché un `import()` fallido, y `vite:preloadError` también salta cuando falla una **precarga** | **Ya viven en `src/lib/cargarMesa.js:41-45`** y los sella `cargarMesa.test.js` (INV-32). El registro apunta ahí |
| **`TaskStop` deja vivo al `bash` hijo** | Se cierra por árbol (`taskkill /T /F`) y se comprueba con `Get-CimInstance`, no con el estado de la tarea | Registro, en las reglas de trabajo (solo doctrina). Los arneses ya se protegen con el vigía de ARN-3a; esto vale para los corredores de shell |
| **Un solo build por tanda** | El resto, con `--sin-build`. Nunca compilar mientras otro arnés sirve `dist/` | Registro (INV-35) |

**No hay documento de uso del arnés en `docs/`** (3a §3). Propuesta: el registro lleva una sección corta, **«Cómo se trabaja con el arnés»**, con las cinco líneas de 3a §3 más estas reglas de trabajo. Así no hace falta un documento nuevo (§G-2).

---

## §B · Dos vigilantes nuevos

### B1 · Las huellas de los protegidos

**¿El documento fija hoy sus huellas?** **Sí.** `Protegidos` §3 (`:109-116`) tiene, por archivo, el blob de git (12), el `sha256` (16) y las líneas, re-medidos el 2026-09-18 y el 2026-09-22. **Hoy, en `7db208c`, las seis filas coinciden una a una:**

| Archivo | blob | sha256 (16) | líneas | ¿= §3? |
|---|---|---|---|---|
| `src/engine/gameEngine.js` | `21c4d3f56318` | `317452ec5b57408a` | 748 | sí |
| `src/engine/aiPlayer.js` | `8cfc3736cba2` | `3a8ea7b0386c7ddf` | 1445 | sí |
| `src/engine/deck.js` | `eb61426083ca` | `69f92d6b9aac433c` | 69 | sí |
| `src/config/seatLayouts.js` | `0d1bb8ea66a8` | `0049051fd4b8b891` | 59 | sí |
| `src/styles/opponentPanel.css` | `3ce6383eec0d` | `50c98d51a91c3994` | 1084 | sí |
| `src/styles/gameTable.css` | `1e21371c8543` | `269120a496910995` | 6289 | sí |

Las seis están en `i/lf w/lf`. Así que ARN-3 (3a–3d) **no tocó un byte de ningún protegido**, y los informes que lo afirmaban quedan comprobados.

**Propuesta: sin JSON aparte.** La prueba lee **el propio documento**: las filas de §2 (la lista) y las de §3 (las huellas). Es D3 llevado a la prueba: una sola fuente, nada copiado. Lo que puede fallar:
- un byte, un blob o el número de líneas de cualquier protegido;
- un protegido en §2 sin fila en §3, o al revés;
- un documento que ya no se deja leer: 0 filas no es verde.

**La regla que la acompaña** (para `Protegidos` §5, en la v1.6; la redacción la aprueba Victor):

> **La huella se re-mide en el mismo commit.** Una campaña autorizada a abrir un protegido actualiza su fila de §3 (blob, `sha256` y líneas) **en el mismo commit** que cambia el archivo, y nombra la tanda en la columna «abierto en». `scripts/testProtegidos.test.js` compara cada fila con los bytes del árbol: un protegido cambiado sin su fila es rojo, y una fila cambiada sin el archivo también. Así el diff de cada commit enseña la apertura junto al código, y una apertura sin permiso no llega verde a `main`.

**Experimento en la copia** (`scripts/testProtegidos.test.js`, borrador en el Anexo A):

| Paso | Resultado |
|---|---|
| Copia tal cual | **8/8 verde** (2 de lectura + 6 huellas) |
| `seatLayouts.js` de la copia, byte 100 + 1 (por `Buffer`) | **rojo:** `src/config/seatLayouts.js ya no es el de docs/AJILEI_Protegidos_v1.0.md §3. Si la campaña está AUTORIZADA a abrirlo, re-mide su fila en el MISMO commit; si no, es una apertura sin permiso.: expected { blob: 'adc8662821d3', … } to deeply equal { blob: '0d1bb8ea66a8', … }` · 1 roja, 7 verdes |
| Restaurado desde el repo (`cmp`: idéntico) | **8/8 verde** |
| Un 7.º protegido en §2 (`handEvaluator.js`) sin fila en §3 | **rojo:** «§3 tiene exactamente una fila por cada protegido de §2» |
| La cabecera de §3 renombrada (el documento deja de leerse) | **rojo** en la misma prueba; las de huella no llegan a generarse |
| Restaurado | **8/8 verde** |

**Una precisión:** el `sha256` de 16 hex son 64 bits. Basta para detectar un cambio accidental; no es una firma contra un cambio malicioso, que no es el riesgo de este proyecto. El blob es el de git (`sha1("blob <n>\0" + bytes)`, la fórmula de `bancoNiveles.mjs:1739`), y cuadra con `git hash-object` porque el repo normaliza a LF.

### B2 · `!important`

**Los «tres casos documentados»:**

| # | Archivo y línea | Declaración | ¿Justificación escrita? |
|---|---|---|---|
| 1 | `src/styles/playingCard.css:24` | `.card-selected { transform: translateY(-18px) !important }` | **No en el archivo.** Fuera: `Sistema_Diseno_v1.2.md:432-433` («Conserva su halo dorado `!important` (`playingCard.css:23-27`)») y `luz.css:195` («gana siempre (K-2: sin contacto)») |
| 2 | `src/styles/playingCard.css:25` | `border-color: var(--gold-brand) !important` | ídem |
| 3 | `src/styles/playingCard.css:26` | `box-shadow: 0 14px 26px rgba(var(--gold-brand-rgb), 0.6) !important` | ídem |

- Nacieron en `819e276` (2026-06-12, «v1.2 estable 2 jugadores»), antes de la doctrina aditiva.
- Su inventario como «únicos» está en `ARN-3_Fase0:418` y `LUZ-1_Fase0:389`.

**Cuántos hay hoy en `src/`: tres.**
- El resto de apariciones son **comentarios** que afirman la regla: ~40, en `apu.css`, `celebracion.css`, `embellecimiento.css`, `lobby.css`, `luz.css`, `menuMovil.css`, `portada.css`, `rec.css`, `rev.css`, `salas.css`, `tapetes.css`, `voz2.css`, seis de `gameTable.css` (vistos por `grep`), `Lobby.jsx`, `Portada.jsx`, `SalaOpciones.jsx` y `useUtilitiesMenu.js`.
- No hay ningún `setProperty(…, 'important')`.

**La prueba** (`scripts/testImportant.test.js`, borrador en el Anexo B):
- Recorre `src/**/*.{css,js,jsx}` e `index.html`.
- Quita los comentarios conservando las líneas.
- Para cada `!important` (o `setProperty(…, 'important')`), saca archivo, línea, selector y propiedad, y lo cruza con la **lista blanca**: archivo + selector + propiedad + motivo con su fuente.
- Es roja en dos casos: un intruso, o una entrada de la lista que ya no existe. Así la lista no envejece.

**Experimento en la copia:**

| Paso | Resultado |
|---|---|
| Copia tal cual | **2/2 verde** |
| `.apu-control { color: red !important }` al final de `apu.css` | **rojo:** `{ archivo: "src/styles/apu.css", linea: 528, selector: ".apu-control", propiedad: "color" }` |
| `el.style.setProperty("top", "0", "important")` en un `.js` | **rojo:** `{ archivo: "src/lib/cargarMesa.js", selector: "(js)" }` |
| Se quita `!important` de `border-color` en `.card-selected` | **rojo:** «`.card-selected { border-color }`: expected +0 to be 1» |
| Los ~40 comentarios que dicen «`!important`» | **no cuentan** (verde en la copia tal cual) |
| Todo restaurado (`cmp`) | **verde** |

**Una propuesta menor para la Fase 1** (§G-5): el comentario de justificación también en `playingCard.css`, encima de `.card-selected`. No es protegido. La lista blanca lo citaría por línea.

---

## §C · La doctrina

### C1 · Los óvalos intocables

**¿Está escrita? No como regla.** Lo confirma `ARN-3_Fase0:414`, y el barrido de hoy lo repite.
- **En `docs/`** solo hay piezas:
  - `Protegidos:93-97` y `:172-173` (las constantes del óvalo O1, «constantes selladas no-archivo»);
  - `Mensajes_Resultado_v1.0.md:150-151, 185` (robustez del óvalo, Δ=0);
  - `DSK_U2_fase1_reporte.md:204` («El óvalo nunca se mueve», que es una medición).
- **Donde la regla sí está dicha con fuerza es el código:**
  - `gameTable.css:1194-1196`: «O1 · Geometría FIJA del óvalo central … no se mueve ni redimensiona jamás»;
  - `gameTable.css:4985-4986`: «para que ningún contenido presente ni futuro lo mueva»;
  - `gameTable.css:5016`: «el óvalo nunca podrá ser inflado tampoco desde dentro»;
  - `gameTable.css:5473-5475` (DSK-O2): «Óvalo CONGELADO en mesas 4, 3 y 2»;
  - `voz2.css:30-39` (D7 de VOZ-2): «LA CONTENCIÓN NO ES OPCIONAL», el óvalo que se movía 906 px;
  - `voz2.css:100`: la regla apunta al `<p>`, «nunca al óvalo».

**Texto propuesto** (para Victor). **Dónde:** en `Sistema_Diseno_v1.2.md`, como sección propia junto a O1, con la fila INV-04 del registro apuntando a ella.

> **Los óvalos de la mesa son intocables.** Su caja —posición, tamaño y forma— la fijan las constantes de O1 y DSK-O2, selladas por medición, y no cambia por ninguna vía:
>
> 1. **Ni geometría.** Ninguna campaña mueve, redimensiona ni recoloca un óvalo, en ninguna mesa (2, 3, 4 o 5) ni en ninguna vista.
> 2. **Ni CSS.** Ninguna hoja nueva escribe reglas sobre el óvalo ni sobre su caja. Lo nuevo que deba verse dentro entra como elemento propio, con su clase, y se estiliza ahí (molde `.voz2-texto`, VOZ-2).
> 3. **Ni contenido que lo haga crecer.** Lo que se pinte dentro cabe en la caja sellada o se recorta por dentro (elipsis con `contain: inline-size`, VOZ-2 D7). Ningún texto, cifra, icono ni animación puede empujar la caja, tampoco desde su `min-content`.
>
> Cambiar un óvalo es una decisión de Victor, con la misma ceremonia que abrir un protegido (`AJILEI_Protegidos_v1.0.md` §1): detenerse, reportar y esperar. Lo vigilan `o1`, `o2`, `h1`, `r1`/`r2`, `msg`, `apu` (`solapeOvalo`), `luz`/`rev` (Δ 0) y `diagPUE voz2`; el registro lleva la lista al día (INV-04).

**Una duda de alcance** para Victor (§G-3): «los óvalos», en plural, ¿son el óvalo central (mensaje, pozo y comodín) en sus variantes por mesa, o incluyen también otra forma ovalada de la mesa, como el tapete? El texto de arriba está escrito para el óvalo central y sus variantes O1/DSK-O2, que es lo que el código sella.

### C2 · Las contradicciones

| # | Documento y línea | Texto exacto | Choca con | Corrección propuesta (no se edita en esta Fase 0) |
|---|---|---|---|---|
| **1** | `docs/AJILEI_Diseno_Landscape_v1.0.md:15` | «Archivos protegidos (`gameEngine.js`, `aiPlayer.js`, `seatLayouts.js`) **no** se modifican sin autorización explícita.» | `Protegidos` §2: **seis** archivos | «Archivos protegidos: **la lista canónica de `AJILEI_Protegidos_v1.0.md` §2** (hoy seis). No se modifican sin autorización explícita de Victor.» |
| 1b | `Diseno_Landscape_v1.0.md:202` | «No tocar `gameEngine.js` / `aiPlayer.js` / `seatLayouts.js` sin autorización.» | ídem | «No tocar ningún protegido (`AJILEI_Protegidos_v1.0.md` §2) sin autorización.» |
| 1c | `docs/AJILEI_Plan_Tandas_Landscape_v1.0.md:25` y `:96` | la misma lista de tres | ídem | la misma corrección |
| 1d | `docs/AJILEI_Componente_Fichas_v2.0.md:169` | «No tocar `gameEngine.js` / `aiPlayer.js` / `seatLayouts.js` sin autorización.» | ídem | la misma corrección |
| **2** | `docs/AJILEI_Sistema_Diseno_v1.2.md:13` (bajo «## ⚠️ RESTRICCIÓN GENERAL», `:11`) | «**NO modificar `gameEngine.js` ni `aiPlayer.js` bajo ninguna circunstancia.** Este sistema es 100% capa visual.» | `Protegidos` §6 (la siembra pre-autorizada) y §7 (las aperturas autorizadas de APU-1), y el molde `?apu=gana`, que usa `setRng` de `deck.js` dentro de §6.1 | «**Los archivos protegidos** (lista canónica en `AJILEI_Protegidos_v1.0.md` §2; entre ellos `gameEngine.js` y `aiPlayer.js`) **no se modifican sin autorización explícita de Victor.** Este sistema es 100 % capa visual: ninguna campaña de diseño tiene motivo para abrirlos. La excepción pre-autorizada y las aperturas autorizadas viven en Protegidos §6 y §7, y en ningún otro sitio.» |
| 3 | `docs/AJILEI_Protegidos_v1.0.md:186` | «**Rige, como hasta ahora, la tabla de §2: cinco archivos.**» | la nota de la v1.4 justo debajo (`:196`: «La tabla de §2 pasa a seis») | Conservar la frase (es la constancia de la v1.1) y añadir al final: «*(v1.1; desde la v1.4 son seis: ver la nota siguiente.)*». Lo decide Victor: es el documento que manda (§5) |

**No son contradicciones, pero se anotan:**
- **Fechadas antes de la v1.4:**
  - `SUP-2b_Puerta_v1.0.md:86` y `Victory_Celebration_v1.1.md:355` dicen «los cinco protegidos»;
  - unos 15 informes dicen «cinco», como `SAL_Fase0:745` (que afirma que `deck.js` no es protegido) o `SAL-B1_Fase1:12`. **Los informes son historia y no se tocan.**
- **De una campaña, no generales:** `Victory_Celebration_v1.0.md:303` («El motor no se toca ni para estadística») y `Mensajes_Resultado_v1.0.md:14`. Eran reglas de aquellas tandas.

**El criterio que se propone** (§G-7): se corrigen solo los documentos **normativos vivos** (1, 1b–1d, 2 y 3), cada uno con una línea que apunte a Protegidos §2 en lugar de copiar la lista. Así se cumple `Protegidos` §5: «las enumeraciones … son referencias, no autoridad».

---

## §D · Los últimos remiendos del arnés

### D1 · `all` → `humo`

**Qué corre hoy `all`:** 7 de los 35 modos de `diagDSK`. Son `d1d2`, `d3`, `bug` y `shots` (informativos), más `lob`, `retar` y `apu` (despacho en `diagDSK.mjs:14093-14108`). Desde 3c-i levanta además un preview para `lob` y compila. **Tarda unos 43 min, y 40 de ellos son `apu`** (3c §11.1.4; las cifras por modo de `ARN-3_Fase0` §A1 suman lo mismo).

**Qué correría `humo`** (la opción A de 3c §11.1.4, decidida en §24-1): `d1d2`, `d3`, `bug`, `shots`, `gate`, `lob` y `retar`. Por modo: 73 + 11 + 73 + 12 + 7 + 17 + 24 = **217 s**, unos **3,6 min**, más el build del preview para `lob`. **En total, ~4 min.**

**Una incoherencia del informe de 3c:** la opción A se describe como «lo que hoy corre `all` sin `apu`», pero su lista **añade `gate`**, que `all` no corre (`:14101`, solo con `MODE === 'gate'`). `gate` cuesta 7 s y es la pantalla de entrada. La propuesta es incluirlo, pero lo confirma el rector (§G-8).

**Todos los sitios que nombran `all`:**

| Sitio | Qué es | En la Fase 1 |
|---|---|---|
| `scripts/diagDSK.mjs:14` | cabecera de uso: «`all → d1d2 + d3 + bug + shots + lob`» (**ya desactualizada**: le faltan `retar` y `apu`) | `humo → d1d2 + d3 + bug + shots + gate + lob + retar` |
| `diagDSK.mjs:371-372` | comentario: «`all` corre `lob`, así que también levanta el preview» | `humo` |
| `diagDSK.mjs:405` | `const MODE = process.argv[2] \|\| 'all'`: **sin argumento corre `all`** | por defecto `humo` |
| `diagDSK.mjs:14063-14065` | levanta el preview auxiliar con `all` | `humo` |
| `diagDSK.mjs:14088` | etiqueta del servidor en el JSON (`+ preview … para lob`) | `humo` |
| `diagDSK.mjs:14093-14108` | el despacho de los 7 modos (más `:14101`, `gate`) | `humo` en los 7; `apu` solo con su nombre |
| `diagDSK.mjs:14102-14105` | comentario de LOB-1 (por qué `lob` entra en `all`) | `humo` |
| `scripts/arnes/nucleo.mjs:196` | `MODOS_DSK` empieza por `'all'` | `'humo'`. `all` sale de la lista: un modo desconocido es código 2 (ARN-3a), con un mensaje como el de `diagSAL shots` en 3c: «`all` se retiró en ARN-3e: usa `humo`, y `apu` por su nombre» |
| `scripts/arnes/nucleo.test.js:119-121` | «todos los modos válidos (menos `all`) tienen lector» | `humo` en lugar de `all` |
| Documentos | solo informes (`ARN-3c:243, 366, 376, 459, 480, 586-596, 864, 883`, `ARN-3d_Fase0:73-74`, `LOB1_Fase1:139`, `LOB1_Fase0:747`, `MOT-1_Fase0:659`) | **no se tocan**: son historia. El registro dice `humo` |

### D2 · `apu.5` (H3c-ii-3)

**Confirmado con el código: son dos evaluaciones.**
- `diagDSK.mjs:2891`: `const huboCapas = await jugarHasta(page, () => Number(document.querySelector('.game-message')?.dataset.capas ?? 0) > 1, 12, true)`.
  - `jugarHasta` (`:1676-1707`) evalúa la condición en `:1678`, `:1704` y `:1706`, y **solo devuelve un booleano**.
- `:2892-2899`: un `page.evaluate` **posterior** vuelve a leer `data-capas`, la frase (`textContent`) y `data-tono`.

**La carrera está entre `:2891` y `:2892`.** En ese hueco `jugarHasta` puede haber pulsado «Siguiente mano». La mesa vacía el mensaje (`message: ''`) 300 ms antes de la mano nueva, mientras `data-capas` sigue en 3 (ARN-3c §14.2). Resultado: `capas: 3`, `texto: ''`, rojo.

**Lo que esta Fase 0 añade: una sola evaluación no basta si la condición sigue siendo `capas > 1`.** En esos 300 ms, una sola evaluación también vería `capas: 3` con el texto vacío. **La condición tiene que exigir el pago entero**: `data-tono` no vacío, que solo existe con `resultado` en PAYOUT y GAME_OVER (3c-ii §13, `GameTable.jsx:2029/2093`).

**El cambio propuesto:**
1. `jugarHasta` devuelve **el valor** de la condición, no `true`. En `:1678`, `:1704` y `:1706`: `const v = await page.evaluate(cond); if (v) return v`.
   - Los demás llamadores (`:1719`, `:2176`, `:2480` y `:2777`) solo miran si es verdadero, y sus condiciones devuelven booleanos. No cambian.
2. La condición de `apu.5` lee las tres cosas a la vez y solo se cumple con la frase puesta:

```js
const leido = await jugarHasta(page, () => {
  const m = document.querySelector('.game-message')
  const capas = Number(m?.dataset.capas ?? 0), tono = m?.dataset.tono ?? ''
  return capas > 1 && tono ? { capas, texto: m.textContent.trim(), tono } : false
}, 12, true)
const huboCapas = !!leido
const capas = leido || { capas: 0, texto: '', tono: '' }
```

3. El juicio (`:2911-2912`) no cambia.

**Cómo se demuestra que cierra la carrera:** dos controles en una copia, cada uno encendido por una variable que solo existe en ella (el molde de `parche_ctl2.py` de 3c-ii).
- **Control de la lectura separada (`CTL_APU5_TARDE`):** entre la condición cumplida y la lectura, el arnés de la copia pulsa «Siguiente mano» y espera 50 ms. Con eso reproduce a voluntad el hueco que el azar daba 1 de cada pocas veces.
  - **Con el código de hoy:** rojo determinista (`texto: ''`, `capas: 3`).
  - **Con el arreglo:** verde. La foto ya se tomó dentro de la condición, y el retraso posterior no tiene nada que leer.
- **Control del hueco de 300 ms (`CTL_APU5_HUECO`):** un `addInitScript` vacía el texto de `.game-message` en cuanto `data-capas` pasa de 1, y lo devuelve 300 ms después, imitando a la mesa.
  - **Con la condición `capas > 1` en una sola evaluación:** rojo.
  - **Con `capas > 1 && tono`:** verde, porque espera al pago entero.

  Es el control que demuestra que la segunda mitad del arreglo hace falta.

**Vara:** `apu 360x640` ×3, sola, más la matriz completa una vez (~40 min). REC-2 18/18 y mesa 7/7, o `cobertura` por el hueco de azar conocido, nunca rojo.

### D3 · E-22: las 6 corridas que faltan (D17 de ARN-3c)

**Solo plan; no se corre en esta Fase 0.**
- **Qué:** 6 corridas de `node scripts/diagDSK.mjs msg --semilla=azar --sin-build --puerto=N`, como mucho 6 a la vez, sobre el único build de la tanda. Es la segunda tanda de 3c-ii §16.
- **Cuánto:** ~20 min de pared (`msg` dura 1 078–1 186 s; las seis en paralelo, como en 3c-ii).
- **Qué se anota:** la base de cada corrida (para `--semilla=N`) y las frases de T5 1366×768. Es la celda de E-22: mesa 5 a 1366×768, «un toque que no entra en el showdown» (`APU-1_Fase1e:1315`).
- **Lectura:** con 6 más, son **15 corridas en verde** (9 de 3c + 6). A la frecuencia histórica de 1 de cada 4, la probabilidad de no verlo en 15 es 0,75¹⁵ ≈ **1,3 %**. Con eso se puede proponer **cerrar E-22** como «no reproducible en el terreno de hoy (bundle real, sesión simulada, sin red)», con las bases anotadas por si vuelve.
- **Si aparece:** se clasifica (juego o instrumento) con su base, y **no se arregla** en ARN-3e. Si es del juego, es un STOP: D1 prohíbe tocar `src/`.

### D4 · El orquestador C: costo y valor, al día

| | En ARN-3c (§11.1.4) | Al día, con lo aprendido en 3c–3d |
|---|---|---|
| **Qué haría** | cada modo en su proceso, 6 carriles, `rec` y las varas solas, un build | Lo mismo. **Casi todo lo que necesita ya existe:** códigos 0/1/2 con `cobertura` (agregar es leer un número), JSON por modo, `--sin-build`, `--puerto`, aislamiento por proceso y servidor en proceso |
| **Costo de escribirlo** | 60–90 min | **~60 min.** La planificación es pura (carriles, solos, orden por duración) y se prueba en vitest; lo demás es lanzar procesos y leer códigos |
| **Costo de una corrida** | ~1 h 05 de pared | **~1 h 40.** Los 34 modos en 6 carriles (~65 min) **más los solos en serie**: `rec` (~17 min), `celebracion` (~8), `dis` (~1,5 por la mayoría de 3, dentro de `todo`), `mesa` (~2) y `congelado` |
| **Riesgo** | medio | **bajo-medio.** El riesgo de un aborto a mitad ya no tira horas: cada modo es un proceso y su código queda escrito |
| **Valor** | la foto de partida de cada campaña | El mismo, **y medido:** 3b-ii §6, 3c §17 y la regresión de 3d se armaron **a mano**, con «no corrido» en un tercio de las filas. Una foto automática sustituye esas tablas |

**Lectura para el rector:**
- Entra bien **después**, como pieza propia (ARN-4 o la cabecera de la próxima campaña que pida foto). No **ahora**: ARN-3e es sobre todo documento, y el orquestador pide al menos una corrida entera de validación (~1 h 40) que no cabe en sus topes.
- **Nunca** es defendible si las campañas siguientes no van a pedir foto de partida. Hasta hoy, todas la han pedido.

---

## §E · La tabla única de aplazados de ARN-3

Fuentes: ARN-3 Fase 0 §C2/§C3, 3a §5, 3b §7, 3b-ii §7/§9, 3c §20/§21/§24, 3d Fase 0 y 3d (hallazgos, revisiones y cierre). «Comprobado hoy» es una verificación de esta Fase 0 contra `7db208c`.

### E1 · Vigentes (22)

| # | Qué | De dónde | Dueño | Por qué se aplazó | Estado hoy |
|---|---|---|---|---|---|
| 1 | El saldo 2 800 frente a 2 933 ms (×5) | Fase 0 C2 · 3c §20 | **CEL-2c** | Producto de la celebración | **Vigente.** 5 conocidos en la regresión de 3d |
| 2 | `u1` `hits 0/8` | Fase 0 C2 · 3c §20 | **quien abra `UtilitiesMenu`** (APU-1 C-1) | Sin cambio | **Vigente** (3c §17; 3d no lo corrió) |
| 3 | **H3d-3** · `wrangler.jsonc` sirve `index.html` con 200 cuando falta un chunk | 3d Fase 0 · cierre de 3d | **la campaña de despliegue** | Infraestructura, no arnés | **Vigente.** Comprobado hoy: `wrangler.jsonc:6`, `"not_found_handling": "single-page-application"` |
| 4 | **H3d-ii-5** · `#root` se vacía < 0,2 s antes de la recarga de entrada | revisión STOP-2 de 3d | **quien añada un `ErrorBoundary`** | Aceptado tal cual por el rector | **Vigente** (aceptado) |
| 5 | **H3d-ii-1** · un All-in con la mejor mano no se celebra como mano ganada | 3d | **«su campaña»**, sin nombre (§G-9) | Decisión de Victor: «¡Ganas con…!» en tono de victoria; la devolución del sobrante a la IA, aparte | **Vigente** |
| 6 | `.btn-soon` y `.soon-tag` en `gameTable.css` | 3d Fase 0 §A1 · 3d §2.3 (D10) | **quien abra `gameTable.css` con autorización** | El archivo es protegido; el CSS muerto no cuesta nada visible | **Vigente.** Comprobado hoy: `gameTable.css:783` y `:798` (por `grep`) |
| 7 | La guarda `arranca` sin sellar | 3c §11.1.2 · §24-3 | **el registro (INV-25), con su límite** | Sellarla obliga a un molde de reparto en `src/dev` | **Vigente, aceptado.** Entra al registro como «no sellada» |
| 8 | `retirado` «no alcanzable» | 3c §11.1.2 · §24-3 | **el registro (INV-25)** | El motor ya no da el turno a la Mano retirada (H3c-ii-5) | **Vigente, aceptado** |
| 9 | Los generadores de assets fuera del arnés (Edge, sin `navegadorArnes`) | Fase 0 B2 · 3c H3c-5 | **la próxima campaña que regenere assets** | Pueden mover bytes sellados | **Vigente** |
| 10 | El molde `allinHumano` descuenta la entrada elegida | Fase 0 H-12 · 3b H3b-6 · 3b-ii §7 | **ECO-1** | La causa está en `App.jsx` (producto) | **Vigente** |
| 11 | El diálogo de compra de tapetes sin clave en `textos` | 3b H3b-3 · 3b-ii §7 | **IDI-1** | Copy de producto | **Vigente.** Comprobado hoy: `TapetesPanel.jsx:115` sigue con la frase en el JSX |
| 12 | Los bucles hermanos: `playToShowdown`, `jugarHasta`, `lineaAllinEnMesa4`, `runTactil`, `runP1`, `runP2`, `runU2`, `msgJuegaUnaMano`, `luzLlevarAlDescarte`, `revCelda` | 3b §1.4 · 3b-ii §7 | **la campaña que los toque** | D2 de 3b: anotar, no migrar de golpe | **Vigente, menos `vcHastaVictoria`**, que se tocó en 3c §11.1.3 |
| 13 | E-22 (las 6 corridas de D17) | 3c §16, §24 | **ARN-3e** | No cupieron en el tope | **Vigente → Fase 1 de esta tanda** (§D3) |
| 14 | `apu.5`, la carrera de lectura | 3c §14.2, §24 | **ARN-3e** | — | **Vigente → Fase 1** (§D2) |
| 15 | `all` → `humo` | 3c §24-1 | **ARN-3e** | — | **Vigente → Fase 1** (§D1) |
| 16 | El orquestador C | 3c §11.1.4, §24-1 | **se decide al cerrar ARN-3** | Pieza propia | **Vigente → §G-10** (§D4) |
| 17 | `apu` 360×640: `tel.blanda`, intermitente | 3c H3c-ii-3 | **en vigilancia** | No se reprodujo | **Vigente, en vigilancia.** 3d: mesa 7/7, sin rojo |
| 18 | `tel.forzosa`, rojo una vez en sonda | 3b-ii H3b-ii-5 | **en vigilancia** | Una vez en 6 a la vez | **Vigente, en vigilancia.** No ha vuelto (3b-ii ×5, 3c, 3d) |
| 19 | `vuelos.banda` sin casos naturales (es una guarda) | 3b-ii H3b-ii-6 | **el registro (INV-20)** | Por diseño: en el pago no vuela nada | **Vigente, documentado** |
| 20 | El origen de la reposición del descarte (cuelga 23–29 px sobre tapete) | 3b-ii §7 | **una campaña de producto, solo si el rector lo quiere** | Con §1 en «vacío» no es un fallo visible | **Vigente.** Lo vigila `vuelos.sobrante` (3c-ii §12) |
| 21 | La causa del fallo de carga de vitest (una vez, tras un build con 6 arneses) | 3b-ii H3b-ii-3 | **en vigilancia** | No se reprodujo | **Vigente** |
| 22 | **Los pendientes de iOS** | toda la serie y antes | **la sesión intensiva de iOS de Victor** | D5 | **Vigente.** Las marcas, en E3 |

### E2 · Resueltos en una tanda posterior (19)

| # | Qué | De dónde | Resuelto en | Prueba |
|---|---|---|---|---|
| 23 | Los 16 `verify*` + 4 sondas + `_vc2audio.mjs` | Fase 0 B1 · 3c D15 | ARN-3c (`git rm`) | Comprobado hoy: `git ls-files 'scripts/verify*' scripts/_vc2audio.mjs` → 0 |
| 24 | `scripts/screenshots/` rastreado (31 PNG) | 3c H3c-4 | ARN-3c (`git rm -r --cached`) | Comprobado hoy: `git ls-files scripts/screenshots` → 0 |
| 25 | `scripts/_cel1bFila.mjs` | 3c §19 | a mano por Victor | Comprobado hoy: no existe (y ya no está en `git status`) |
| 26 | H-7 · el arnés de 5173 hablaba con Supabase | Fase 0 H-7 · 3b-ii H3b-ii-7 | ARN-3c D6 | 0 escapadas en todas las corridas desde 3c-i |
| 27 | El filtro de ruido con `401` (H3c-2) | 3c-i | 3c-ii D12 → vacío en 3d D15 | `retar`: 0 avisos y filtro vacío (3d §Regresión) |
| 28 | `rev` canónico sin datos (H-11/H3c-3) | Fase 0 · 3c-i | 3c-ii D11 (retirado) | `rev` 10/10 sin canónico (3c-ii §14.1) |
| 29 | `rec` sin correr tras 3b | 3b · 3b-ii §5.1 | después de 3b-ii | Verde solo, 1 002 s (3c §17) |
| 30 | Precargar `tableKnock` | 3c §20, §24-4 | ARN-3d D9 (ya lo hacía LOB-1, H3d-4) | `testPrecargas`: «tableKnock está en SONIDOS_LOBBY» |
| 31 | `1.8b` (222,0 KiB) | Fase 0 B11 · 3c §20 | ARN-3d B11 | 169,2 KiB, verde (revisión del STOP-2) |
| 32 | `vc` rojo (Δ `.pbr-chips` + roce + azar) | 3c §20, §24-2 · H3d-i-2 | ARN-3d (texto igualado, molde `?apu=gana`, `chipsCollect`) | `vc` verde, código 0 (3d §Regresión) |
| 33 | B9 · el aviso `inert` | Fase 0 | ARN-3d §2.1 | `retar` 6/6 con 0 avisos |
| 34 | B10 · `.lob-cta-pvp` | Fase 0 | ARN-3d §2.2 | `grep` → 0 |
| 35 | B6 · el modal de bancarrota muerto | Fase 0 | ARN-3d §2.3 | `grep bankruptModal src/` → 0 |
| 36 | El comentario de `salta` | 3c §20 · H3c-ii-5 | ARN-3d §2.3 | Reescrito con el texto de la Fase 0 §A4 |
| 37 | H3b-1 · el rojo de `vuelos` (los 19 px) | 3b | 3b-ii §2 (la regla con alcance) + 3c-ii §12 (`sobrante`) | `a2` 20/20 |
| 38 | H3b-2 · `apu.7`, un verde falso | 3b | 3b-ii §3 (`APU_PAGO_VISIBLE` + transición) | 5/5 con el pago a 3,7–7,8 s |
| 39 | H3b-ii-2 · `cicloVisibility` con la recarga | 3b-ii | 3c-ii §13 (`A2_EN_PAGO`) | controles: antes rojo ×2, después verde |
| 40 | H3d-ii-4 · la foto de `cap` a 686×360@3 | 3d | revisión del STOP-2 de 3d | Idéntica byte a byte a la maestra; era rasterizado |
| 41 | El `vite:preloadError` sin red (§2.4 (b)) | 3d | revisión del STOP-2 de 3d (opción 2) | `cargarMesa.test.js` (+10) y `sondaD11b` |

### E3 · Los pendientes de iOS (D5: solo las marcas)

**38 marcas en 13 campañas.** El barrido excluye las tablas de compatibilidad, las propiedades `-webkit-*` y las medidas de WebKit de Playwright que ya salieron verdes.

| Campaña | Marcas | Qué espera al iPhone |
|---|---|---|
| FRZ-1 | 5 | el camino `pagehide` de iOS (`FRZ1_Fase1:18`, `FRZ1_Cierre_Commits:51`, …) |
| AJF-1 | 1 | ídem (`AJF-1:98`) |
| CAR-1 | 3 | AVIF en iPhone (`CAR1_Fase0:83`, `CAR1_Fase0_Informe:227`, `CAR1_Cierre_Commits:62`) |
| PUE | 4 | *standalone* en iOS, `checkVisibility`, `mix-blend-mode`, la hoja móvil (`PUE_Fase0_Informe:564-571, 885`, `PUE_Auditoria_Informe:625-627`, `PUE_Fase1:505`) |
| MON-1 | 3 | VP9 con alfa en Safari (`MON1_Fase0:470, 504-505, 868`) |
| DIS-1 | 4 | el marco del teléfono y el 3D en WebKit real (`DIS-1_Fase0:671`, `DIS-1_Cierre:66, 70`, …) |
| BIE-1 | 2 | el desbloqueo del audio de Howler (`BIE-1_Fase0:80, 201`) |
| LUZ-1 | 5 | el vistazo visual de la luz (`LUZ-1_Cierre:55`, `Sistema_Diseno:409`, …) |
| REV-1 | 2 | el vistazo del reverso (`REV-1_Cierre:87`) |
| REC-1 | 1 | el vistazo de la burbuja (`REC-1_Cierre:137`) |
| SAL-B1 | 1 | los tres dispositivos (`SAL-B1_Fase1:233`) |
| SAL-B2 | 3 | E9, el iPhone de Barcelona como invitado (`SAL-B2_Cierre:132`) |
| **ARN-3d** | 4 | la lista de 7 pasos (`ARN-3d_Fase0:435, 486`; `ARN-3d:635, 797`: «**Pendiente.** … sesión intensiva de iOS») |

**Una nota de contexto, que no se cuenta como marca:** `FRZ1_Fase0_Informe:199` avisa que iOS Safari necesita un `resume()` del `AudioContext` que «no existe en el proyecto».

**ARN-3a, 3b, 3b-ii y 3c no llevan ninguna marca:** no tocaron nada que se vea en un teléfono. La costumbre de D5 («cada informe marca sus pendientes de iOS») se cumple hoy por accidente. La propuesta es que el registro la recoja como INV-41 y que cada informe lleve una línea «iOS: nada que validar» o «iOS: pendiente, …».

---

## §F · El plan de la Fase 1

### F1 · Las piezas, en orden (dos sub-tandas)

**ARN-3e-i · Pruebas y arnés** (sin `src/`, D1):
1. `scripts/testProtegidos.test.js`, el del Anexo A, con sus tres controles en una copia.
2. `scripts/testImportant.test.js`, el del Anexo B, con sus tres controles.
3. Si el rector las quiere (§G-6): `testClavesAlmacen` (INV-12) y la de `console.warn` (INV-38), del mismo molde.
4. `humo` (§D1): `diagDSK.mjs`, `nucleo.mjs` y `nucleo.test.js`. Vara: `humo` verde en ~4 min, con código 0. Control: `all` → código 2, con el mensaje.
5. `apu.5` (§D2), con sus dos controles en una copia. Vara: `apu 360x640` ×3, sola, más la matriz entera una vez.
6. E-22 (§D3): 6 corridas de `msg --semilla=azar`, sobre el único build.
7. Regresión: vitest, eslint (21) y `humo`.

**ARN-3e-ii · Documentos** (tras la aprobación de Victor de §C1 y §C2):
1. **El registro**, `docs/AJILEI_Invariantes_v1.0.md`:
   - la tabla de §A2 al día;
   - la sección «Cómo se trabaja con el arnés» (§A4);
   - un puntero por documento normativo («vigilado por sus pruebas»).
2. **Las correcciones de la doctrina:**
   - `Protegidos` v1.6: la regla de la huella en §5 y la nota de `:186`;
   - `Sistema_Diseno`: `:13` y la sección de los óvalos;
   - `Diseno_Landscape`, `Plan_Tandas` y `Componente_Fichas`: el puntero a §2.
3. **La tabla de aplazados** de §E, al día, en el informe de cierre de ARN-3 (`docs/reportes/AJILEI_ARN-3_Cierre_v1.0.md`). Los aplazados no son invariantes y no van en el registro: el registro solo apunta a INV-07, INV-19, INV-20 e INV-25 para los cuatro que sí lo son.
4. Si el rector la quiere (§G-2): `scripts/testInvariantes.test.js`, que lea la tabla del registro y falle si una puerta apunta a un modo, archivo o prueba que ya no existe. Es la propuesta de ARN-3 §B12.3, ahora **leyendo el Markdown y no un JSON gemelo**, por la misma razón que §B1.

### F2 · Dónde vive el registro

`docs/AJILEI_Invariantes_v1.0.md`. **Sin `scripts/invariantes.json`:** ARN-3 §B12.3 lo proponía, pero un gemelo legible por máquina es una segunda copia (D3). La prueba de §B1 demuestra que se puede leer la tabla del documento y fallar ruidosamente si deja de leerse.

### F3 · Mapa provisional archivo → commit

| # | Commit | Archivos |
|---|---|---|
| 1 | `ARN-3e-1: pruebas — las huellas de los protegidos y !important con lista blanca` | `scripts/testProtegidos.test.js` · `scripts/testImportant.test.js` (+ las de §G-6, si entran) |
| 2 | `ARN-3e-2: arnés — humo en lugar de all, apu.5 en una sola lectura` | `scripts/diagDSK.mjs` · `scripts/arnes/nucleo.mjs` · `scripts/arnes/nucleo.test.js` |
| 3 | `ARN-3e-3: doctrina — el registro de invariantes, los óvalos, la huella en el mismo commit y las listas de protegidos` | `docs/AJILEI_Invariantes_v1.0.md` (nuevo) · `docs/AJILEI_Protegidos_v1.0.md` · `docs/AJILEI_Sistema_Diseno_v1.2.md` · `docs/AJILEI_Diseno_Landscape_v1.0.md` · `docs/AJILEI_Plan_Tandas_Landscape_v1.0.md` · `docs/AJILEI_Componente_Fichas_v2.0.md` · (`scripts/testInvariantes.test.js`, si entra: va aquí, junto al documento que lee) · (`src/styles/playingCard.css`, solo el comentario de §G-5, **si el rector lo autoriza contra D1**) |
| 4 | `ARN-3e-4: informes y cierre de ARN-3` | este informe · `docs/reportes/AJILEI_ARN-3e_Informe_v1.0.md` · `docs/reportes/AJILEI_ARN-3_Cierre_v1.0.md` |

**Una dependencia:** `testProtegidos` (commit 1) lee `Protegidos` §2/§3, que **ya existen hoy**, así que el commit 1 queda verde por sí solo. La regla escrita de la huella llega con el 3.

### F4 · Estimación

| Trabajo | Minutos de Claude Code |
|---|---|
| 3e-i · las dos pruebas (borradores hechos) + controles en copia | 20 |
| 3e-i · las dos pruebas opcionales de §G-6 | 20 |
| 3e-i · `humo` + control + corrida | 15 |
| 3e-i · `apu.5` + dos controles + `apu 360` ×3 | 35 |
| 3e-i · matriz de `apu` una vez (en paralelo con E-22) | 40 de pared |
| 3e-i · E-22, 6 corridas | (en el mismo hueco) |
| 3e-ii · el registro | 60 |
| 3e-ii · las correcciones de doctrina | 20 |
| 3e-ii · la tabla de aplazados y el cierre de ARN-3 | 20 |
| 3e-ii · `testInvariantes` (si entra) | 30 |
| Regresión, comprobación por commit en copia e informe | 30 |
| **Total** | **~4 h 10** (≈ 3 h 20 sin las piezas opcionales) |

---

## §G · Preguntas al rector

1. **Alcance del registro:** ¿transversal, con unas 42 filas más un puntero por documento normativo (la propuesta de §A1), o exhaustivo, con ~395 filas?
2. **Mantenimiento del registro:** ¿entra `testInvariantes.test.js` (+30 min), que lee la tabla del Markdown? ¿Y la sección «Cómo se trabaja con el arnés» dentro del registro, en lugar de un documento de uso aparte?
3. **Óvalos:** ¿aprueba Victor el texto de §C1? ¿«Los óvalos» son el óvalo central y sus variantes por mesa (O1, DSK-O2), o algo más?
4. **El hueco móvil de INV-04:** `o1`/`o2` solo miden escritorio. ¿Se acepta que en móvil lo vigilen `voz2.ovalo`, `msg` y `apu`, o se quiere una puerta móvil propia (no es barata; sería su propia pieza)?
5. **`playingCard.css`:** ¿se autoriza añadir el comentario que justifica sus tres `!important`? Es un archivo de `src/` no protegido, solo comentario, y D1 dice que ARN-3e no toca `src/`. La alternativa es que la lista blanca de la prueba sea la única justificación junto al código.
6. **Vigilantes opcionales:** ¿entran `testClavesAlmacen` (INV-12, con la clave nueva `ajilei.recargaPorChunk`) y la prueba de `console.warn` (INV-38)? Las dos son del molde de `testImportant` y cuestan ~10 min cada una.
7. **Las listas viejas de protegidos:** ¿se corrigen los normativos vivos (§C2: `Diseno_Landscape`, `Plan_Tandas`, `Componente_Fichas` y `Sistema_Diseno:13`) con un puntero a Protegidos §2, editando en sitio sin subir versión? ¿Y la nota de `Protegidos:186`, en la v1.6?
8. **`humo`:** ¿incluye `gate` (+7 s), como dice la opción A, aunque `all` nunca lo corrió? ¿Y `humo` pasa a ser el modo por defecto sin argumento?
9. **H3d-ii-1:** ¿qué campaña es «su campaña» para la voz del All-in con la mejor mano? (APU-2, VOZ-3, …)
10. **El orquestador C:** ¿ahora, después (como pieza propia, ARN-4) o nunca? La lectura de §D4 recomienda después.
11. **E-22:** si las 6 corridas salen verdes, ¿se cierra como «no reproducible en el terreno de hoy», con las 15 bases anotadas?

---

## STOP

Parada aquí. Sin commits y sin `git add`. Comprobado a las 05:18:

- **Puertos 4170–5599:** solo `0.0.0.0:5040`, pid 7724 (el `svchost` de Windows de siempre). Esta Fase 0 no levantó ningún servidor ni ningún navegador.
- **`node` vivos:** ninguno (`tasklist`).
- **La copia (`scratchpad/arn3e/copia`):**
  - Su unión a `node_modules` **se quitó con `rmdir`** (`cmd /c rmdir`), y se comprobó que ya no existe.
  - **El borrado recursivo de la carpeta está denegado** en esta sesión, como en ARN-3c y ARN-3d. No se reintentó por otra vía. La carpeta sigue en el scratchpad, ya sin enlace al repo. Lleva los dos borradores de prueba (Anexos A y B) y el `Protegidos` y `playingCard.css` ya restaurados (`cmp` idéntico al repo).
- **`node_modules` del repo, intacto:** 150 entradas (154 con las ocultas), vite 8.0.14, playwright-core 1.62.1.
- **`git status --porcelain`:** los 5 residuos más este informe, en LF.

```
?? docs/reportes/AJILEI_ARN-3e_Fase0_Informe_v1.0.md
?? docs/reportes/AJILEI_MOT-1_Fase0_Informe_v1.0.md
?? docs/reportes/AJILEI_MOT-1_Fase1-0_Sonda_Informe_v1.0.md
?? laminas/mon1/_entorno.txt
?? laminas/mon1/lamina.html
?? laminas/mon1/tiempos.json
```

---

## Anexo A · Borrador de `scripts/testProtegidos.test.js` (el que corrió en la copia)

```js
// ── ARN-3e · borrador de Fase 0 · las huellas de los protegidos ────────────
// La lista y sus huellas viven en UN sitio: `docs/AJILEI_Protegidos_v1.0.md`
// (§2 la lista, §3 la instantánea). Esta prueba no copia nada: lee las dos
// tablas del documento y compara cada fila con los bytes del árbol.
//   · un byte cambiado en un protegido → rojo (blob, sha256 o líneas);
//   · un protegido en §2 sin fila en §3, o al revés → rojo;
//   · un documento que ya no se deja leer (0 filas) → rojo, no verde.
// Una campaña AUTORIZADA a abrir un protegido re-mide su fila de §3 EN EL MISMO
// COMMIT: el diff del documento enseña la apertura al lado del código.
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'

const raiz = new URL('../', import.meta.url)
const DOC = 'docs/AJILEI_Protegidos_v1.0.md'
const doc = readFileSync(new URL(DOC, raiz), 'utf8')

// El trozo de una sección «## N.» hasta la siguiente «## ».
function seccion(n) {
  const ini = doc.search(new RegExp(`^## ${n}\\.`, 'm'))
  if (ini < 0) return ''
  const resto = doc.slice(ini + 1)
  const fin = resto.search(/^## /m)
  return fin < 0 ? resto : resto.slice(0, fin)
}

const lista = [...seccion(2).matchAll(/^\|\s*\d+\s*\|\s*`([^`]+)`/gm)].map((m) => m[1])
const huellas = [...seccion(3).matchAll(
  /^\|\s*`([^`]+)`\s*\|\s*`([0-9a-f]{12})`\s*\|\s*`([0-9a-f]{16})`\s*\|\s*([\d.]+)\s*\|/gm,
)].map((m) => ({ archivo: m[1], blob: m[2], sha256: m[3], lineas: Number(m[4].replace('.', '')) }))

function medir(archivo) {
  const bytes = readFileSync(new URL(archivo, raiz))
  const cabecera = Buffer.from(`blob ${bytes.length}\0`)
  return {
    blob: createHash('sha1').update(Buffer.concat([cabecera, bytes])).digest('hex').slice(0, 12),
    sha256: createHash('sha256').update(bytes).digest('hex').slice(0, 16),
    lineas: bytes.toString('latin1').split('\n').length - 1,
  }
}

describe('ARN-3e · Protegidos §2 y §3 se leen', () => {
  it('la lista de §2 no está vacía y no repite archivos', () => {
    expect(lista.length).toBeGreaterThan(0)
    expect(new Set(lista).size).toBe(lista.length)
  })

  it('§3 tiene exactamente una fila por cada protegido de §2', () => {
    expect(huellas.map((h) => h.archivo).sort()).toEqual([...lista].sort())
  })
})

describe('ARN-3e · cada protegido conserva su huella de §3', () => {
  for (const h of huellas) {
    it(h.archivo, () => {
      const real = medir(h.archivo)
      const aviso = `${h.archivo} ya no es el de ${DOC} §3. Si la campaña está AUTORIZADA a abrirlo, `
        + `re-mide su fila en el MISMO commit; si no, es una apertura sin permiso.`
      expect(real, aviso).toEqual({ blob: h.blob, sha256: h.sha256, lineas: h.lineas })
    })
  }
})
```

## Anexo B · Borrador de `scripts/testImportant.test.js` (el que corrió en la copia)

```js
// ── ARN-3e · borrador de Fase 0 · `!important` solo con permiso escrito ────
// Doctrina: el CSS del proyecto es aditivo y se gana por especificidad u orden,
// nunca con `!important` (Protegidos §1; cabeceras de rec/rev/luz/salas/
// menuMovil). Las únicas excepciones son las de LISTA_BLANCA, cada una con su
// archivo, su selector, su propiedad y el sitio donde está escrita.
//   · un `!important` que no esté en la lista → rojo;
//   · una entrada de la lista que ya no exista → rojo (la lista no envejece);
//   · `setProperty(…, 'important')` en JS cuenta igual.
// Los comentarios no cuentan: decir «sin `!important`» es la costumbre de la casa.
import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const RAIZ = fileURLToPath(new URL('../', import.meta.url))

const LISTA_BLANCA = [
  { archivo: 'src/styles/playingCard.css', selector: '.card-selected', propiedad: 'transform',
    motivo: 'la carta seleccionada sube por encima del hover · Sistema_Diseno_v1.2 §7 (:432-433), luz.css:195' },
  { archivo: 'src/styles/playingCard.css', selector: '.card-selected', propiedad: 'border-color',
    motivo: 'el filo dorado de la seleccionada · ídem' },
  { archivo: 'src/styles/playingCard.css', selector: '.card-selected', propiedad: 'box-shadow',
    motivo: 'el halo dorado de la seleccionada, sin sombra de contacto (K-2 de LUZ-1) · ídem' },
]

function archivos(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = join(dir, e.name)
    if (e.isDirectory()) return archivos(p)
    return /\.(css|jsx?|html)$/.test(e.name) ? [p] : []
  })
}

// Quita los comentarios conservando los saltos de línea, para que las líneas cuadren.
const blanco = (s) => s.replace(/[^\n]/g, ' ')
function sinComentarios(texto, css) {
  let t = texto.replace(/\/\*[\s\S]*?\*\//g, blanco)
  if (!css) t = t.replace(/(^|[^:'"`\\])\/\/[^\n]*/g, (m, a) => a + blanco(m.slice(a.length)))
  return t
}

function hallazgos() {
  const fuera = []
  for (const abs of [...archivos(join(RAIZ, 'src')), join(RAIZ, 'index.html')]) {
    const archivo = relative(RAIZ, abs).split('\\').join('/')
    const css = archivo.endsWith('.css')
    const t = sinComentarios(readFileSync(abs, 'utf8'), css)
    for (const m of t.matchAll(/!\s*important\b|setProperty\([^)]*['"]important['"]\s*\)/g)) {
      const antes = t.slice(0, m.index)
      const linea = antes.split('\n').length
      const abre = antes.lastIndexOf('{')
      const selector = css ? antes.slice(antes.lastIndexOf('}', abre) + 1, abre).trim() : '(js)'
      const decl = antes.slice(Math.max(antes.lastIndexOf(';'), abre) + 1)
      const propiedad = css ? decl.slice(0, decl.indexOf(':')).trim() : '(js)'
      fuera.push({ archivo, linea, selector, propiedad })
    }
  }
  return fuera
}

const casa = (h, b) => h.archivo === b.archivo && h.selector === b.selector && h.propiedad === b.propiedad

describe('ARN-3e · `!important` solo con permiso escrito', () => {
  const todos = hallazgos()

  it('ningún `!important` fuera de la lista blanca', () => {
    const intrusos = todos.filter((h) => !LISTA_BLANCA.some((b) => casa(h, b)))
    expect(intrusos, 'cada uno necesita justificación escrita y una entrada aquí, o se quita').toEqual([])
  })

  it('cada entrada de la lista blanca sigue existiendo, una sola vez', () => {
    for (const b of LISTA_BLANCA) {
      expect(todos.filter((h) => casa(h, b)).length, `${b.archivo} ${b.selector} { ${b.propiedad} }`).toBe(1)
    }
  })
})
```

**Dos límites conocidos del borrador**, para la Fase 1:
- El quitacomentarios de JS es ingenuo: no distingue un `//` dentro de una cadena que no vaya precedido de `:` o de una comilla. Hoy no hay ningún caso. Si apareciera, el error sería un **rojo falso**, nunca un verde falso.
- La prueba **lee** los bytes de `gameTable.css` y `opponentPanel.css` al recorrer `src/`. Es lectura desde fuera (D2), como la de `testProtegidos`.
