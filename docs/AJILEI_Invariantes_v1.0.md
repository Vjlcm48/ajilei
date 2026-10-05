# AJILEI — Registro de invariantes · v1.0

- **Archivo:** `docs/AJILEI_Invariantes_v1.0.md`
- **Versión:** 1.0 · **Fecha:** 2026-10-03 · **Nace en:** ARN-3e (cierre de ARN-3)
- **Actualizado:** 2026-10-05, PAN-1 (1d): INV-04 (precisión), INV-07 (vigilante y etiqueta) e INV-45 (nueva).
- **Base:** la tabla borrador de `AJILEI_ARN-3e_Fase0_Informe_v1.0.md` §A2, al día con la sub-tanda 3e-i y con las decisiones D1–D20 de ARN-3e.
- **Lo vigila:** `scripts/testInvariantes.test.js`, que lee las dos tablas de este documento (§2 y §4) y comprueba que cada vigilante y cada fuente siguen existiendo.

---

## 1. Para qué es y cómo se lee

Es la lista de las reglas que **cruzan campañas**. Cada fila tiene una regla, dónde está escrita y quién la vigila. El registro **apunta y no copia**:
- la regla manda donde está escrita (la columna «Fuente»);
- la medida manda en su prueba o en su modo (la columna «Vigilante»).

Si una fila de aquí y su fuente discrepan, manda la fuente, y la fila se corrige.

**Es transversal, no exhaustivo.** Las reglas propias de cada campaña viven en sus documentos normativos y en sus pruebas: el normativo de APU-1, el Menú, los Tapetes, la Celebración, Modos y Mensajes de resultado. El registro no las repite: lleva **un puntero por documento** (§4).

**Las columnas:**
- **id:** `INV-nn`. No se reutiliza: una regla retirada se marca «retirada» y conserva su número.
- **Regla:** una línea.
- **Fuente:** el documento (y la línea o la sección) donde está escrita. Si solo vive en código o en un informe, se dice.
- **Vigilante:** lo que la pone en rojo si se rompe.
  - un **modo de arnés**, escrito `diagDSK <modo>`, `diagPUE <modo>`, `diagCEL0 <modo>` o `diagSAL <modo>`, con la puerta entre paréntesis y sin comillas de código;
  - un **archivo de prueba**, con su ruta desde la raíz;
  - o, si no hay vigilante, la palabra **«nadie»**.
- **Etiqueta:** «vigilado», «vigilado (parcial)» o «solo doctrina». «Doctrina por escribir» se añade cuando el vigilante existe pero la regla no está escrita en `docs/`.

**La forma la exige `testInvariantes`:**
- En «Fuente» y «Vigilante», lo que va entre comillas de código es algo que se comprueba: un documento `AJILEI_*.md` (en `docs/` o `docs/reportes/`), una ruta del repo (con `:línea` opcional), un archivo `*.test.js` o un modo de arnés.
- Cualquier otra cosa se escribe sin comillas de código: puertas como «solapeOvalo» o «noShift», nombres de función, selectores.

---

## 2. La tabla

| id | Regla | Fuente | Vigilante | Etiqueta |
|---|---|---|---|---|
| INV-01 | Los seis protegidos no cambian sin autorización de Victor. Una apertura autorizada re-mide su huella de §3 en el mismo commit | `AJILEI_Protegidos_v1.0.md` §1–§3 y §5 (v1.6) | `scripts/testProtegidos.test.js`: blob, sha256 y líneas de cada fila de §3 contra los bytes del árbol | vigilado |
| INV-02 | La siembra (§6.1) no cambia ninguna decisión de la IA ni de la baraja | `AJILEI_Protegidos_v1.0.md` §6.1 | `scripts/testNivel1.test.js` §1 (test de oro) | vigilado |
| INV-03 | CSS aditivo: sin `!important`, salvo las tres de `.card-selected` | `AJILEI_Protegidos_v1.0.md` §1 · `AJILEI_Sistema_Diseno_v1.2.md:432` · `src/styles/playingCard.css` (el comentario de ARN-3e) | `scripts/testImportant.test.js`: lista blanca por archivo, selector y propiedad; setProperty con «important» cuenta igual | vigilado |
| INV-04 | **Los óvalos de la mesa son intocables:** el óvalo central (mensajes, pozo y comodín), en sus versiones para las mesas de 2, 3, 4 y 5. Ni geometría, ni CSS, ni contenido que lo haga crecer. **Precisión (Victor, 2026-10-03, PAN-1):** el óvalo no se toca por diseño ni por contenido; se adapta al tamaño de la pantalla (el giro y la pantalla completa), y el vertical sigue siendo el vertical | `AJILEI_Sistema_Diseno_v1.2.md` §13 (aprobado por Victor, ARN-3e D19; la precisión, al final de §13) · `src/styles/gameTable.css:1194` (O1) · `src/styles/voz2.css:30` (VOZ-2 D7) | `diagDSK o1` · `diagDSK o2` · `diagDSK h1` · `diagDSK r1` · `diagDSK r2` · `diagDSK msg` · `diagDSK apu` (solapeOvalo) · `diagDSK luz` · `diagDSK rev` (Δ 0) · `diagPUE voz2` (voz2.ovalo). **Hueco aceptado (ARN-3e D8):** o1 y o2 solo miden escritorio; en móvil vigilan voz2, msg y apu | vigilado (parcial) |
| INV-05 | O1 general: nada aparece ni desaparece sin una caja ya reservada | `AJILEI_SUP-2b_Puerta_v1.0.md:12` · `AJILEI_Sistema_Diseno_v1.2.md:517` · `AJILEI_APU-1_Reglas_v1.3.md:224` | `diagDSK p1` (noShift) · `diagDSK h1` · el Δ de `diagDSK a1`, `diagDSK a2`, `diagDSK m1` y `diagDSK f1` | vigilado (parcial) |
| INV-06 | La pastilla TURNO no produce salto | solo código: `src/components/GameTable.jsx` · `src/components/OpponentPanel.jsx` | `diagDSK p1` · `diagDSK h1` (16/16 desde ARN-3b). Solo escritorio | vigilado (parcial) · doctrina por escribir |
| INV-07 | Piso táctil de 40 px por eje (44 en el lobby y el menú), medido como **zona táctil**, no como caja visible | `AJILEI_Menu_Utilidades_v1.2.md:145` · `AJILEI_APU-1_Reglas_v1.3.md:217` · `AJILEI_Sistema_Diseno_v1.2.md` §14 (PAN-1) · `src/styles/tactil.css` · `AJILEI_PAN-1_1b_Informe_v1.0.md` §11 | `diagDSK tactil` (desde PAN-1: 36 páginas, mesas 5, 4, 3 y 2 en el teléfono —360×640, 390×844, 412×915, 640×360 y 915×412— y en el escritorio —1024×768, 1280×720, 1366×768 y 1920×1080—; la ✕ incluida) · `diagDSK apu` (apu.6: la fila y los multiplicadores en el turno del humano, con el piso de 40 bajo pointer coarse; la tarjeta de recarga: caja de 36 y zona de 40, la forzosa 42, con zonaMin y bajoZona) · `diagDSK rec` («Ver la mesa»: caja 36, zona 40) · `diagDSK u1` · `diagDSK u2` · `diagDSK menu-movil` · `diagSAL sal` (p4) · `diagDSK lob` · `diagDSK retar`. La zona táctil se mide por barrido en cruz con elementFromPoint, no por la caja visible. En el pago no se mide el nombre del panel revelado (su toque es nulo, R1.c), y durante la revelación el ganador manda sobre sus vecinos. **Hueco (parcial):** Tapetes en el ⋮ (u1: item2 63×35, tapado por el SVG de Cuenta, que no tiene tamaño). Dueño: el punto 12 | vigilado (parcial) |
| INV-08 | Un solo oro | `AJILEI_Identidad_A_v1.1.md:71` · `AJILEI_Sistema_Diseno_v1.2.md:42` | en parte: `scripts/testIdxCore.test.js:47` · `diagPUE 2.5` (2.5j) · `diagDSK tapetes`. Contar oros por pantalla no es barato | solo doctrina (en lo global) |
| INV-09 | «Siguiente mano» siempre tocable, salvo con la recarga pendiente | `AJILEI_VOZ-2_Fase1_Informe_v1.0.md` · `AJILEI_Victory_Celebration_v1.0.md:317` · `AJILEI_APU-1_Reglas_v1.3.md:186` | `diagPUE voz2` (voz2.capa, voz2.siguiente y su control) · `diagDSK apu` (el caso contrario) · `diagDSK congelado` (la guarda a oscuras) | vigilado |
| INV-10 | Dos caminos de render del rival (opp-panel y ai-zone) | `AJILEI_Sistema_Diseno_v1.2.md` §12 (:179-201) · `src/components/GameTable.jsx:95` | `diagDSK tapetes` · `diagDSK p1` · `diagDSK h1` · `diagDSK apu` · `diagDSK msg` (P5) · `scripts/arnes/autojuego.mjs` (el LEER del bucle común). Nadie afirma la matriz de enrutado | vigilado (parcial) |
| INV-11 | Anclaje óptico del isotipo: prohibido centrarlo geométricamente | `AJILEI_Icono_v1.0.md:33` | nadie (lob.5 solo mira el 2:3 y el src) | solo doctrina |
| INV-12 | Solo las claves de almacenamiento censadas. El censo vive en la prueba, no aquí (ARN-3e D18) | `AJILEI_Tapetes_v1.0.md:52` · `AJILEI_Victory_Celebration_v1.0.md:309` · `AJILEI_LOB1_Fase0_Informe_v1.0.md:302` | `scripts/testClavesAlmacen.test.js`: 12 claves, 8 accesores, y sessionStorage solo en `src/main.jsx` | vigilado |
| INV-13 | El arnés corre en el Chromium sellado (151.0.7922.34, playwright-core 1.62.1) | `AJILEI_ARN-3a_Informe_v1.0.md` (D1–D3) | `scripts/arnes/nucleo.test.js` | vigilado |
| INV-14 | Códigos 0/1/2: error > rojo > cobertura > verde; una lista vacía es 2 | `AJILEI_ARN-3a_Informe_v1.0.md` (D5) · `AJILEI_ARN-3b_Informe_v1.0.md` §1.3 | `scripts/arnes/nucleo.test.js` | vigilado |
| INV-15 | El arnés nunca toca un puerto ajeno | `AJILEI_ARN-3a_Informe_v1.0.md` (D8) | `scripts/arnes/nucleo.test.js` (pidQueEscucha); la prueba P6, a mano | vigilado (parcial) |
| INV-16 | El arnés no habla con la base real: una escapada es código 2 | `AJILEI_ARN-3c_Informe_v1.0.md` (D6) | `scripts/arnes/nucleo.test.js` (veredictoAislamiento) · la puerta de aislamiento de cada corrida, en `scripts/arnes/comun.mjs` | vigilado |
| INV-17 | «El caso no se dio» no es rojo: es cobertura. **apu.5:** sin pozo partido en 3 mesas es cobertura; un pozo partido con la frase o el tono vacíos sigue siendo rojo | `AJILEI_ARN-3b_Informe_v1.0.md` (D4) · `AJILEI_ARN-3e_Informe_v1.0.md` (D16) | `scripts/arnes/juego.test.js` · `scripts/arnes/nucleo.test.js` · `diagDSK apu` | vigilado |
| INV-18 | Nunca «X está pensando…» con X en «Se retiró» (turno fantasma) | `AJILEI_ARN-3b_Informe_v1.0.md` (D8) | el bucle común en `diagDSK a1`, `diagDSK a2`, `diagDSK m1`, `diagDSK h1`, `diagDSK f1`, `diagDSK o1`, `diagDSK u1` y `diagDSK vuelo` | vigilado |
| INV-19 | Lo medido en una mesa reducida se aparta y no tiñe la geometría | `AJILEI_ARN-3b_Informe_v1.0.md` (D3) | `scripts/arnes/juego.test.js` · `diagDSK a1` | vigilado |
| INV-20 | Vuelos de la zona del humano: bajo la banda solo con la banda visible, nunca fuera de la zona, y el sobrante solo sobre el tapete | `AJILEI_ARN-3b-ii_Informe_v1.0.md` §2 · `AJILEI_ARN-3c_Informe_v1.0.md` §12 · `scripts/diagDSK.mjs` (el comentario). La regla escrita en `docs/` es esta fila | `diagDSK a2` (vuelosBanda, vuelosZona, vuelosSobrante) | vigilado |
| INV-21 | La banda «Tu mejor palo» solo se ve en el pago | `AJILEI_ARN-3c_Informe_v1.0.md` §13 (DSK-A2) | `diagDSK a2` (cicloVisibility, por A2_EN_PAGO) | vigilado |
| INV-22 | Ninguna caja con «Heptacoins» desborda | `AJILEI_ARN-3c_Informe_v1.0.md` (D4) | `diagDSK msg` (P5) | vigilado |
| INV-23 | Varas de tiempo por mayoría de 3, sin aflojar umbrales | `AJILEI_ARN-3c_Informe_v1.0.md` (D9) | `scripts/arnes/varas.test.js` · `diagCEL0 celebracion` · `diagPUE dis` · `diagPUE mesa` | vigilado |
| INV-24 | msg es reproducible: la vara son las semillas 1–15, y la semilla al azar es exploración | `AJILEI_ARN-3c_Informe_v1.0.md` (D7) | `diagDSK msg` | vigilado |
| INV-25 | Con la pestaña oculta no corre nada: 5 guardas. «retirado» no es alcanzable y «arranca» no está sellada (límite declarado) | `AJILEI_ARN-3c_Informe_v1.0.md` §11.1.2 y §24-3 | `diagDSK congelado` | vigilado, con límite |
| INV-26 | La fiesta se encadena al end del toc-toc (encadenado honesto) | `AJILEI_ARN-3c_Informe_v1.0.md` §11.1.1 · `AJILEI_ARN-3d_Informe_v1.0.md` (D13) | `diagCEL0 celebracion` · `scripts/arnes/varas.test.js` | vigilado |
| INV-27 | En la celebración de mano suena el roce y nada más | `AJILEI_ARN-3c_Informe_v1.0.md` §11.1.3 | `diagDSK vc` (p1, AJENO) | vigilado |
| INV-28 | tableKnock en SONIDOS_LOBBY y chipsCollect en SONIDOS_MESA; la Portada no paga ninguno | `AJILEI_ARN-3d_Informe_v1.0.md` (D9 y D14) | `scripts/testPrecargas.test.js` · `diagDSK vc` (loaded) | vigilado |
| INV-29 | GameTable solo se importa de forma dinámica | `AJILEI_ARN-3d_Informe_v1.0.md` (B11) | `scripts/testMesaDiferida.test.js` | vigilado |
| INV-30 | El 1.8b pesa 200 KiB o menos | `AJILEI_CAP-1_Cierre_v1.0.md` · `AJILEI_ARN-3_Fase0_Informe_v1.0.md` (B11) | `diagPUE 1.8` | vigilado |
| INV-31 | Entrar a la mesa no pinta blanco, y el chunk de la mesa no se pide en la Portada | `AJILEI_ARN-3d_Informe_v1.0.md` §2.4 (H3d-1, H3d-2) | `diagPUE mesa` (sola, fuera de todo) | vigilado |
| INV-32 | La precarga nunca recarga; la entrada recarga una vez por sesión, sin bucle | `AJILEI_ARN-3d_Informe_v1.0.md` (revisión del STOP-2) | `src/lib/cargarMesa.test.js` (decidirFalloChunk) | vigilado |
| INV-33 | La consola de retar y apu sale limpia: el filtro de ruido está vacío | `AJILEI_ARN-3c_Informe_v1.0.md` (D12) · `AJILEI_ARN-3d_Informe_v1.0.md` (D15) | `diagDSK retar` · `diagDSK apu` | vigilado |
| INV-34 | Los volcados de la vara del banco son los del índice (sha256) | `AJILEI_ARN-3c_Informe_v1.0.md` (D5) | `scripts/testBancoBandas.test.js` | vigilado |
| INV-35 | Un solo build por tanda; el resto, sin build | `AJILEI_ARN-3b-ii_Informe_v1.0.md` · `AJILEI_ARN-3c_Informe_v1.0.md` (H3c-6, D13) | nadie | solo doctrina |
| INV-36 | Las varas de tiempo corren solas; como mucho 6 arneses a la vez | `AJILEI_ARN-3b-ii_Informe_v1.0.md` (D5, H3b-5) | nadie | solo doctrina |
| INV-37 | Todo en LF | `.gitattributes` · `AJILEI_ARN-3c_Informe_v1.0.md` (D16) | git normaliza al añadir, por `.gitattributes`. El árbol de trabajo puede quedar en CRLF: Protegidos lo estuvo hasta ARN-3e | vigilado (por git) |
| INV-38 | Los avisos en las pruebas van por stderr, no por console.warn | `AJILEI_ARN-3c_Informe_v1.0.md` (H3c-1) · `scripts/testBancoBandas.test.js:169` | `scripts/testAvisosPruebas.test.js` | vigilado |
| INV-39 | Un protegido se lee para citarlo y no se abre | `AJILEI_Protegidos_v1.0.md` §7.4 | nadie | solo doctrina |
| INV-40 | Una copia de pruebas: su unión a node_modules se quita con rmdir **antes** de borrarla, y si rmdir falla, se para | `AJILEI_ARN-3d_Informe_v1.0.md` | nadie | solo doctrina |
| INV-41 | Cada informe marca sus pendientes de iOS, aunque sea con «iOS: nada que validar» | `AJILEI_ARN-3e_Fase0_Informe_v1.0.md` §E3 · `AJILEI_ARN-3e_Informe_v1.0.md` (D20) | nadie | solo doctrina |
| INV-42 | Las reglas de la mano se congelan hasta PAYOUT | `AJILEI_Reglas_Mano_Congeladas_v1.0.md` §5 | `scripts/testHandRules.test.js` | vigilado |
| INV-43 | Nunca se compila después de crear un servidor de desarrollo en el mismo proceso: el preview y su build van antes (H3e-i-1) | `AJILEI_ARN-3e_Informe_v1.0.md` (D17) | `scripts/arnes/nucleo.test.js` (decidirBuild) · `scripts/arnes/comun.mjs` (servidorArnes sale con código 2 y el motivo) | vigilado |
| INV-44 | humo es el modo por defecto de diagDSK. all se retiró (código 2, con su mensaje) y apu se corre por su nombre | `AJILEI_ARN-3e_Informe_v1.0.md` (D12) | `scripts/arnes/nucleo.test.js` · `diagDSK humo` | vigilado |
| INV-45 | **La pantalla completa en los teléfonos (PAN-1, R1–R5):** solo si la entrada principal es táctil (hover: none y pointer: coarse), la API existe y la app no está instalada; nunca en el computador, tampoco con pantalla táctil. Se pide de forma síncrona dentro del gesto, con el primer toque en la app y antes de la mesa. La app nunca la suelta. Si algo la saca, fuera de la mesa vuelve con el siguiente toque y dentro solo con «Iniciar mano» o «Siguiente mano», nunca en mitad de una mano. Instalada, la da el manifiesto (display fullscreen). Sin bloqueo del giro. **Un toque dentro de un elemento con data-sin-pantalla-completa no la pide:** lo llevan todos los botones que comparten, copian o abren otra app (pedirla gasta la activación del toque que ellos necesitan). iPhone: pendiente (Safari no tiene la API) | `src/lib/pantallaCompletaCore.js` (cabecera: R1–R7 y la exclusión) · `public/manifest.webmanifest` · `src/screens/SalaEspera.jsx:527` (copiar y compartir). Escrita también en el informe de la 1c de PAN-1, §11 | `src/lib/pantallaCompletaCore.test.js` (10 casos: síncrona, sin API, instalada, escritorio, ya dentro, rechazo tragado, nunca sale —también en todo src—, fuera y dentro de la mesa, y la exclusión). **Lo que el arnés no puede medir** (Chromium sin cabeza entra sin cambiar el alto): el salto de entrada, el atrás de Android, el aviso de Chrome, el teclado del login y la vuelta de una hoja de compartir. Se validan en el S25: V1–V11 de PAN-1, todas bien (2026-10-05) | vigilado (parcial) |

**Recuento (45 filas):**
- **vigilados (38):** 01–07, 09, 10, 12–34, 37, 38 y 42–45.
  - Siete son parciales: 04 (el hueco móvil aceptado, D8), 05, 06 (solo escritorio), 07 (Tapetes, punto 12), 10 (sin la matriz de enrutado), 15 y 45 (lo que solo mide el S25).
  - 25 lleva un límite declarado.
- **solo doctrina (7):** 08 (en lo global), 11, 35, 36, 39, 40 y 41.
- **Doctrina por escribir (1):** 06. La 04 quedó escrita en ARN-3e (D19), la 07 en PAN-1 (`AJILEI_Sistema_Diseno_v1.2.md` §14) y la 20 está escrita en esta fila.

---

## 3. Cómo se trabaja con el arnés

**Las cinco líneas de ARN-3a §3:**
1. **No se levanta ningún servidor a mano.** Basta con `node scripts/diagDSK.mjs a2`: el arnés levanta el suyo dentro de su proceso y lo apaga al salir. Es un dev con bypass en 5173; `luz` y `rev` levantan además uno sin bypass en 5174, y `diagPUE` compila y sirve en 4173.
2. **Puerto ocupado:** el arnés se niega (código 2) y dice el PID y la línea de órdenes. Se elige otro con `--puerto=N` (y `--puerto-aux=N` para el segundo servidor).
3. **Un servidor propio levantado a mano** se usa con `--servidor=externo`, con `AJILEI_BASE` o `PUE_BASE` (y `VOZ2_DEV`). `--sin-build` mide el `dist/` que haya.
4. **El navegador** es el Chromium fijo de `playwright-core`, que se instala una vez con `node node_modules/playwright-core/cli.js install --no-shell chromium`. `ARNES_CANAL=msedge` hace la pasada de contraste con el Edge de la máquina.
5. **Los códigos:**
   - **0:** verde o informativo;
   - **1:** alguna puerta en rojo, o en `cobertura`;
   - **2:** error de instrumento (excepción, modo que aborta, servidor, navegador, puerto ocupado, modo u opción desconocidos, escapada de red, build con un dev vivo).

**Las reglas de trabajo:**
- **Un solo build por tanda** (INV-35). El resto corre con `--sin-build`, y nunca se compila mientras otro arnés sirve `dist/`.
- **El orden de los servidores en un mismo proceso:** primero el preview con su build, después el dev (INV-43). Al revés, el arnés sale con código 2 y lo dice.
- **Las varas de tiempo corren solas**, y como mucho van **6 arneses a la vez** (INV-36).
- **`humo` es el modo por defecto** de `diagDSK`: `d1d2`, `d3`, `bug`, `shots`, `gate`, `lob` y `retar`, en unos 4 min. `apu` se corre **por su nombre** (unos 40 min la matriz entera). `all` ya no existe (INV-44).
- **Una copia de pruebas** (`git archive HEAD` más lo que haga falta del árbol) enlaza `node_modules` con una unión. **La unión se quita con `rmdir` antes de borrar la copia.** Si `rmdir` falla, se para: nada de borrar en recursivo una carpeta que aún enlaza al repo (INV-40).
- **`TaskStop` deja vivo al `bash` hijo.** Un corredor de shell se cierra por árbol (`taskkill /T /F`) y se comprueba con `Get-CimInstance`, no con el estado de la tarea. Los arneses se protegen solos con el vigía de ARN-3a.
- **Los avisos en las pruebas van por `process.stderr.write`** (INV-38): con el reporter por defecto de vitest, `console.warn` no se ve.
- **Un protegido se lee para citarlo y no se abre** (INV-39): se usan `grep`, `sed`, `git hash-object` o `sha256sum`, nunca el editor.
- **Un control provoca el estado real; no lo imita** (H3e-i-4).
  - Las imitaciones fallan por instrumento: React lleva sus nodos de texto, y una tapa que oculta un estado hace que el bucle avance.
  - Si hace falta cambiar el producto para provocar el estado, se cambia **en la copia** y tras una variable de entorno.
- **Cada control tiene su par:** rojo con el defecto puesto y verde al quitarlo, con `cmp` contra el repo al restaurar.
- **Todo en LF** (INV-37). Python escribe con `newline=''` y la herramienta de edición puede dejar CRLF: se comprueba con `git ls-files --eol`.

---

## 4. Los documentos normativos y sus vigilantes

Una línea por documento. Sus reglas no se copian aquí: viven en el documento y las vigilan sus pruebas.

| Documento | Qué rige | Vigilado por |
|---|---|---|
| `AJILEI_APU-1_Reglas_v1.3.md` | El normativo de APU-1: All-in, pozos por capas, recarga, entrada y la IA de las mesas de apuesta | `scripts/testMotorAPU1.test.js` · `scripts/testMesaAPU1.test.js` · `scripts/testIAAPU1.test.js` · `scripts/testPozos.test.js` · `scripts/testEntrada.test.js` · `scripts/testRec2.test.js` · `scripts/testRecargaREC1.test.js` · `diagDSK apu` |
| `AJILEI_Menu_Utilidades_v1.5.md` | El menú de utilidades y las consultas | `scripts/testConsultas.test.js` · `diagDSK u1` · `diagDSK u2` · `diagDSK u3` · `diagDSK menu-movil` |
| `AJILEI_Tapetes_v1.2.md` | Los tapetes y su tienda | `scripts/testTapetes.test.js` · `diagDSK tapetes` |
| `AJILEI_Victory_Celebration_v1.1.md` | La celebración de victoria: frases, melodías y coreografía | `scripts/testCelebracion.test.js` · `scripts/testFrasesVictoria.test.js` · `scripts/testMelodias.test.js` · `scripts/testCoreografia.test.js` · `diagCEL0 celebracion` · `diagDSK vc` |
| `AJILEI_Modos_y_Asistencia_v1.1.md` | Los niveles de la IA y la asistencia | `scripts/testNivel1.test.js` · `scripts/testNivel2.test.js` · `scripts/testNiveles.test.js` |
| `AJILEI_Mensajes_Resultado_v1.0.md` | El mensaje de resultado y la crónica | `scripts/testResultado.test.js` · `scripts/testCronica.test.js` · `diagDSK msg` |
| `AJILEI_Protegidos_v1.0.md` | Los seis protegidos y sus huellas | `scripts/testProtegidos.test.js` |
| `AJILEI_Reglas_Mano_Congeladas_v1.0.md` | Las reglas de la mano, congeladas hasta PAYOUT | `scripts/testHandRules.test.js` |

---

## 5. Cómo se mantiene

- **Añadir una regla** es añadir una fila con su vigilante. Si no lo tiene, se escribe «nadie» y la etiqueta «solo doctrina»: dicho en voz alta, no por omisión.
- **Retirar una regla** es marcarla «retirada» en su etiqueta, con la tanda que la retira. El número no se reutiliza.
- **Cambiar un vigilante** (renombrar un modo, mover una prueba) obliga a tocar su fila **en el mismo commit**. `scripts/testInvariantes.test.js` sale rojo en cuatro casos:
  - un archivo de prueba citado que no existe;
  - un modo que su arnés ya no tiene;
  - un documento fuente que no está en `docs/` ni en `docs/reportes/`;
  - un id repetido.
- **Una tabla que deja de leerse es roja, no verde:** la prueba exige leer filas. Si se renombra la cabecera de §2 o de §4, sale roja.
- **Los informes de `docs/reportes/` no se tocan:** son historia. Una regla que hoy solo vive en un informe se cita aquí con ese informe como fuente, hasta que tenga un documento normativo.
- **El informe de cierre de cada campaña** dice qué filas tocó, aunque sea «ninguna», y lleva su línea de iOS (INV-41).
