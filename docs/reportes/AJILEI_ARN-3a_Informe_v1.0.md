# AJILEI · ARN-3a · Instrumento I: el terreno · Informe v1.0

**Fecha:** 2026-10-01
**Ficha:** `AJILEI_ARN-3a_v1.0.md`
**Punto de partida:** `main` en `67175f7`. Fase 0 aceptada, sin commitear.
**Alcance:** B8 (servidores), B2 (navegador fijo), H-2 (códigos de salida) y H-9 (base de `diagCEL0`). **`src/` no se tocó**: ningún protegido se abrió.
**Dónde se probó:** en una copia del árbol de trabajo (`git ls-files -co`) dentro del scratchpad, con una unión a `node_modules` y el `.env.local` copiado. Así el `dist/` y las capturas del repo no se tocaron.
**Reloj:** de 21:36 a 22:30 (54 min de los 90). **Sin commits.**

## Resumen

| Prueba | Resultado |
|---|---|
| **P5 · nada de huérfanos (la clave)** | **Verde en los dos servidores.** Se mató la tarea de fondo a mitad de corrida. El 5173 (`diagDSK u1`) y el 4173 (`diagPUE todo`) quedaron **libres** en menos de 10 s, sin ningún `node` de vite ni Chromium del arnés vivo. **Control:** con `npx vite` como antes, el vite **sobrevive** a la misma operación. **Vigía:** con el padre muerto sin `/T`, el arnés huérfano se cierra solo y sale con 2 |
| P1 · mismas cifras con Chromium fijo | **Verde.** `o2`: 515 números, **0 diferencias** con el Edge 154 de la Fase 0. `o1`, `a1`, `a2` y `u1`: **ninguna ancla geométrica cambia**. Todas las diferencias están en campos que dependen de la mano jugada (texto de la secuencia, recuentos de fotogramas, ancho de la banda según el texto, quién gana el apilado). Los rojos que aparecen son los conocidos (`u1` `hits 0/8`, un `SINCERRAR` de `a2`) y son de 3b |
| P2 · mismo veredicto en el resto | **Verde.** El mismo veredicto que en la Fase 0 en `diagPUE todo` (1, solo `1.8b` = 222,0 KiB), `cap` (31/31), `voz2` (222/222, **tras arreglar A-6**), `diagSAL sal` (102/102), `diagCEL0 diagnostico` (16/16), `lob` (6/6) y `msg` |
| P3 · contraste `ARNES_CANAL=msedge` | **Verde.** `o2`: 515 números, **0 diferencias** entre Chromium y Edge. `o1` (10 580 números), `a2` (1 008), `u1` (2 884) y `a1` (1 141): 0 diferencias geométricas; las que hay son del mismo tipo que en P1 |
| P4 · códigos de salida | **Los 6 casos dan el código esperado** (y los 4 arneses con modo inexistente). El de `m1` se demostró con una caída provocada a mitad de matriz, porque la corrida natural de hoy no abortó |
| P6 · puerto ajeno respetado | **Verde.** El arnés se niega, nombra PID y línea de órdenes y sale con 2. El proceso ficticio sigue vivo |
| P7 · `--servidor=externo` | **Verde.** Usa el preview levantado a mano y lo deja vivo |
| P8 · varas | build limpio · **vitest 1 117/1 117** (1 089 + 28 nuevas) · **eslint 21** |

---

## §1 · Los cambios

### 1.1 · Núcleo puro: `scripts/arnes/nucleo.mjs` (nuevo, 191 líneas)

| Pieza | Línea | Qué decide |
|---|---|---|
| `NAVEGADOR_SELLADO`, `ETIQUETA_NAVEGADOR` | `:14-21` | D1/D2: `chromium 151.0.7922.34 (playwright-core 1.62.1)` |
| `ORDEN_INSTALAR` | `:24` | D4: `node node_modules/playwright-core/cli.js install --no-shell chromium` |
| `CODIGO`, `ErrorInstrumento`, `codigoDeSalida()` | `:27-50` | D5: 0 / 1 / 2. Un error manda sobre un rojo. **Una lista vacía es 2**: un arnés que no midió nada no sale verde |
| `canalPedido()`, `comprobarVersion()`, `faltaNavegador()` | `:53-81` | D1/D3: con el canal sellado, una versión distinta es error («el navegador cambió: hay que re-sellar»); con `msedge`, solo se anota |
| `leerOpciones()`, `esBanderaComun()` | `:91-118` | D7–D9: `--servidor=`, `--puerto=`, `--puerto-aux=` y `--sin-build`. **Las saca de la línea de órdenes**, para que los arneses sigan leyendo sus modos por posición aunque la bandera vaya delante |
| `pidQueEscucha()` | `:125-131` | D8: quién escucha en el puerto, a partir de `netstat -ano`, en IPv4 e IPv6 |
| `VEREDICTO_DSK`, `MODOS_DSK`, `veredictosDSK()` | `:146-191` | D5: cada modo de `diagDSK` se lee **por donde ya escribe su veredicto** (`passed` por celda, `passed`/`ok`/`verde`/`matrixOk` arriba, o los booleanos de los diagnósticos de DSK). Ninguna puerta cambia. Los informativos (`d1d2`, `d3`, `bug`, `shots`, `b1`) no deciden. Una matriz vacía, una clave sin lector o un `report.error` son **2** |

**Comprobado contra la realidad:** `veredictosDSK` aplicado a los 33 JSON de la corrida de estado de la Fase 0 reproduce su tabla celda por celda. 26 verdes o informativos → 0; `a2`, `apu`, `h1`, `rec`, `tapetes`, `u1`, `vuelo` y `z1` → 1; `m1` → 2.

### 1.2 · Terreno común: `scripts/arnes/comun.mjs` (nuevo, 243 líneas)

| Pieza | Qué hace |
|---|---|
| `instalarSalidas()` | Excepción sin atrapar, promesa rechazada, `SIGINT`/`SIGTERM`/`SIGHUP`/`SIGBREAK` → cierra todo y sale con **2**. Además, **un vigía** comprueba cada segundo si el padre sigue vivo (`process.kill(ppid, 0)`) y, si desapareció, cierra y sale con 2 (B8). `ARNES_SIN_VIGIA=1` lo apaga |
| `opcionesDelArnes()` | Lee las opciones comunes y las quita de `process.argv` |
| `navegadorArnes()` | `chromium.launch({ channel })`. Distingue «no instalado» (D4, con la orden) de otros fallos, y aplica D3 |
| `servidorArnes({ tipo, puerto, bypass, build, externo })` | D6: Vite **dentro del proceso** (`createServer` + `listen` para dev; `build` + `preview` para producción). D7: compila antes, salvo `--sin-build`. D8: **antes de nada mira el puerto** y, si está ocupado, se niega con PID y línea de órdenes, sin matar nunca. D9: con `externo` solo comprueba que el servidor responde. Para el 5174 sin bypass vacía `VITE_AUTH_BYPASS` **solo durante la resolución de la configuración** (vacía, no `'0'`) y la restaura |
| `terminar(codigo)`, `alSalir()`, `fallarInstrumento()` | Cierre en orden inverso (navegador y servidores), con tope de 5 s por pieza, y salida con código |
| `conNodeEnvPropio()` | Cada `createServer`/`build`/`preview` nace sin `NODE_ENV` y al terminar se repone el anterior, para que un `preview` no convierta en producción al servidor de desarrollo que venga detrás (A-6) |

Un detalle de Vite 8: `server.forwardConsole` copia la consola del navegador a la terminal del servidor, que ahora es la del arnés. Se apaga (`comun.mjs`, en `createServer`) porque los modos ya recogen la consola por su cuenta.

### 1.3 · Pruebas: `scripts/arnes/nucleo.test.js` (nuevo, 28 casos)

- La versión sellada coincide con `package.json` y con `node_modules/playwright-core/browsers.json`. Si alguien sube `playwright-core` sin re-sellar, la prueba lo dice.
- Códigos 0/1/2, incluida la lista vacía.
- Canal y versión, y reconocer «no instalado».
- Opciones delante y detrás de los posicionales, sin tocar las banderas propias (`--control=`, `--sin-burbuja`, `--sellar`).
- `netstat` en IPv4 e IPv6, sin confundir el 41730 con el 4173.
- El lector de cada modo de `diagDSK`, incluidos la matriz vacía, `m1` abortado y la clave desconocida.

### 1.4 · Cableado en los cuatro arneses (las rutas, las puertas y las cifras no cambian)

| Arnés | Cambios |
|---|---|
| `scripts/diagDSK.mjs` | Cabecera de uso `:2-9` · importa el terreno común `:281-287` · `instalarSalidas`, opciones y `BASE` (propia salvo `--servidor=externo`), y las bases de Portada de `luz`/`rev` hacia el servidor auxiliar propio `:352-359` · modo desconocido → 2 `:366-369` · `chromiumBaselines: ETIQUETA_NAVEGADOR` `:390-395` · servidor(es) y navegador `:13237-13252`; `luz` y `rev` levantan además el 5174 sin bypass · el JSON lleva `canal`, `chromiumDeriva` (solo con contraste) y `servidor` `:13262-13265` · veredicto y código `:13314-13327` |
| `scripts/diagPUE.mjs` | Cabecera `:28-41` · opciones y `BASE` `:54-57` · contador `anotadas` `:97-99` · modo desconocido → 2 y la vieja guarda «levanta el preview a mano» sustituida por `servidorArnes` (preview con build; `voz2` levanta además el dev con bypass para la burbuja y fija `VOZ2_DEV`) `:184-206` · `--control` desconocido pasa de 1 a **2** `:1861` · código `:2256-2261` |
| `scripts/diagSAL.mjs` | Comentario de uso `:25-30` · terreno común `:44-53` · opciones, `BASE` y modo desconocido `:60-69` · servidor y navegador `:887-894` · código `:955-959` |
| `scripts/diagCEL0.mjs` | **H-9:** `BASE` sale de `AJILEI_BASE` con `--servidor=externo`, ya no clavada `:28-44` · `modoCelebracion` devuelve `{ fallos, controlOk }` `:1732-1734` (antes imprimía seis fallos y salía con 0) · servidor y navegador `:1739-1746` · código de `celebracion` `:1752-1755` · código de `diagnostico` `:1879-1886` |

---

## §2 · Las pruebas

### P1 · Mismas cifras con el navegador fijo (Chromium 151.0.7922.34)

Las cinco corridas completas, con Chromium 151.0.7922.34, servidor propio y un puerto distinto para cada una, para poder ir en paralelo. Se compararon con la corrida de estado de la Fase 0 (Edge 154.0.4258.48) número a número, agrupando las diferencias por campo:

| Modo | Código hoy | Números comparados | Diferencias | De qué son |
|---|---|---|---|---|
| `o2` (peor caso construido, determinista) | 0 · 15/15 | 515 | **0** | — |
| `o1` | 0 · 16/16 | 11 170 | 185 | **todas** en `realSeq`: el texto de la secuencia de mensajes de la mano jugada. 0 geométricas |
| `a1` | 0 · 16/16 | 1 144 | 47 | recuentos de fotogramas, la muestra de texto de «Tu mejor palo» y los `timerDys` del instante muestreado. Origen, huecos, mazo y Δ del resto, idénticos |
| `a2` | 1 · 19/20 | 1 008 | 106 | recuentos de fotogramas y de muestras de vuelo, ancho de la banda (depende del texto) y **una celda `SINCERRAR`** (T4 1440×850). En la Fase 0 cayó en T4 1920×937: es el intermitente del bucle (B4/B5, 3b). `sim`, `carta`, `respiro`, `pila`, `dy`, `flujo` y el máximo de `vuelo`, idénticos |
| `u1` | 1 · 20/20 celdas | 2 906 | 77 | quién queda encima en cada sonda de apilado y el techo vivo, según el estado de la mano. El rojo es el `hits 0/8` conocido (APU-1 §5), el mismo de la Fase 0 |

El intermitente de `a1` por mesa reducida (B4) no apareció en esta corrida con Chromium.

### P2 · Mismo veredicto en el resto

| Arnés · modo | Fase 0 | Hoy (Chromium, servidor propio) | Código |
|---|---|---|---|
| `diagPUE todo` | 193 verdes + `1.8b` + `dis.relevo` (intermitente) | **194 verdes + `1.8b`** (222,0 KiB, FCP 120 ms) · 195 mediciones · 278 s, build incluido | **1** |
| `diagPUE cap` (`--sin-build`) | 31/31 | **31/31** · 154 s | **0** |
| `diagPUE voz2` (`--sin-build`) | 222/222 | 1.ª pasada: **20 rojos**, todos en `voz2.burbuja` (A-6, instrumento). **Tras el arreglo: 222/222** · 520 s | **0** |
| `diagSAL sal` | 102/102 | **102/102** · 116 s | **0** |
| `diagCEL0 diagnostico` | 16/16 | audio 11/11 · molde 4/4 · control verde · 32 s | **0** |
| `diagDSK lob` | 6/6 | **6/6** · 21 s | **0** |
| `diagDSK msg` | verde | **verde** · 1 186 s | **0** |

### P3 · Pasada de contraste (`ARNES_CANAL=msedge`, Edge 154.0.4258.48)

Las mismas cinco, con `ARNES_CANAL=msedge`. El JSON anota `chromiumDeriva: "pasada de contraste: msedge 154.0.4258.48 frente a chromium 151.0.7922.34 (playwright-core 1.62.1)"`, y la diferencia **no** es un error (D3).

| Modo | Chromium | Edge | Números | Diferencias | De qué son |
|---|---|---|---|---|---|
| `o2` | 0 | 0 | 515 | **0** | — |
| `o1` | 0 | 0 | 10 580 | 229 | **todas** en `realSeq` (texto de la mano jugada) |
| `a1` | 0 | **1** | 1 141 | 50 | recuentos de fotogramas y muestras. El rojo de Edge es de **cobertura**: en T5 1366×768 la banda «Tu mejor palo» no llegó a verse (`línea 0f`), porque el humano no llegó al pago con puntaje. Todas sus anclas dan Δ=0 |
| `a2` | 1 | 1 | 1 008 | 99 | recuentos, ancho de la banda y un `SINCERRAR` en cada canal, **en celdas distintas** (Chromium T4 1440×850, Edge T4 1366×768) |
| `u1` | 1 | 1 | 2 884 | 90 | apilado según la mano. 20/20 celdas en los dos canales; el rojo es `hits 0/8` |

**Ninguna diferencia geométrica entre los dos navegadores.** Los rojos de cada lado son del juego (cobertura y `SINCERRAR`) y caen en celdas distintas en cada corrida.

### P4 · Códigos de salida (corridos de verdad)

| Caso | Esperado | Obtenido |
|---|---|---|
| `diagDSK lob` (verde) | 0 | **0** · `lob verde → código 0`, 6/6 celdas, 15 s |
| `diagDSK d3` (informativo) | 0 | **0** · `d3 informativo → código 0` |
| `diagPUE todo` (`1.8b` en rojo conocido) | 1 | **1** · `── diagPUE todo · 195 mediciones · 1 en rojo → código 1` |
| `diagDSK m1` (aborta a mitad, H-1) | 2 | **2** en la caída forzada (abajo). La corrida natural de hoy **no abortó**: 16/16 en verde, código 0, en 2 261 s. La caída de H-1 depende de cómo caiga el juego |
| modo inexistente (`inventado`) | 2 | **2** en los cuatro: `diagDSK`, `diagPUE`, `diagSAL` y `diagCEL0` («modo desconocido… los modos son…») |
| Chromium no encontrado (`PLAYWRIGHT_BROWSERS_PATH` → carpeta vacía) | 2 + orden | **2** · «el Chromium del arnés no está instalado (canal chromium, 151.0.7922.34). Instálalo con: `node node_modules/playwright-core/cli.js install --no-shell chromium`». El servidor que ya había levantado se cerró: 0 procesos escuchando en su puerto |

**La caída a mitad de matriz, provocada.** `diagDSK m1 --puerto=5199`, lanzado desde `bash`. Al terminar la primera celda se mató **solo el Chromium hijo de ese arnés** (`taskkill /T` sobre el `chrome.exe` cuyo padre era el arnés):

```
── diagDSK m1 · error error → código 2
✖ el modo abortó: page.waitForTimeout: Target page, context or browser has been closed
código real 2
```

El 5199 quedó libre. Una primera prueba lanzada desde `cmd` anotó `codigo 0`, porque `cmd` expande `%ERRORLEVEL%` antes de ejecutar la orden. El fallo era de la medida, no del arnés, que había impreso «→ código 2».

Además: con `--servidor=externo` y el preview a mano, `diagPUE 1.8` salió con **1** por el rojo conocido de `1.8b` (P7).

### P5 · Nada de huérfanos (B8)

**Servidor de desarrollo (`diagDSK u1`, 5173), como tarea de fondo:**

```
── ANTES de matar la tarea (21:46:41)
  TCP    [::1]:5173             [::]:0                 LISTENING       1084
1084:node.exe ["C:\Program Files\nodejs\node.exe" scripts/diagDSK.mjs u1]
  <- 6604:bash.exe … <- 56600:bash.exe … <- 51776:bash.exe …
chrome del arnés: 9

── DESPUÉS de matar la tarea (21:46:52)
1084 vivo: False
escuchando en 5173/5174/4173: (nada)
node con vite o diagDSK: 0
chrome del arnés: 0
```

Quien escucha en el 5173 **es el propio arnés** (PID 1084), no un vite aparte.

**Servidor de producción (`diagPUE todo`, 4173, con su build), como tarea de fondo:**

```
── ANTES (21:47:37)
  TCP    [::1]:4173             [::]:0                 LISTENING       15436
15436: "C:\Program Files\nodejs\node.exe" scripts/diagPUE.mjs
chrome del arnés: 8
── DESPUÉS (21:47:43)
15436 vivo: False · escuchando: (nada) · node vite/diag: 0 · chrome del arnés: 0
```

**Control: la forma de antes, en la misma máquina** (`npx vite --port 5173` como tarea de fondo):

```
── control tras matar la tarea (21:48:02)
  TCP    [::1]:5173             [::]:0                 LISTENING       44928
17488 <- 740   · node … npx-cli.js …          (el npx, vivo)
44928 <- 39408 · "node" …\vite\bin\vite.js     (el vite, vivo y escuchando)
```

Es B8 reproducido: el huérfano sigue ahí. Era mío y se cerró por árbol (`taskkill /T /F /PID 17488`).

**El vigía, por separado.** Arnés colgando de un `cmd` (`Start-Process cmd /c node scripts\diagDSK.mjs u1`). Se mató **solo el `cmd`**, sin `/T`. Justo después el arnés seguía vivo (21:48:28.552). Pocos segundos más tarde, en el log:

```
✖ el proceso padre (21848) desapareció: se cierra el arnés para no dejar huérfanos
── diagDSK u1 · error error → código 2
```

El PID 28128 ya no existía, nada escuchaba en 5173/5174/4173 y no quedaba ningún Chromium del arnés. En las dos pasadas con `TaskStop` el arnés murió directamente, sin que hiciera falta el vigía. El vigía cubre el caso de la Fase 0, en el que muere el padre y no el hijo.

### P6 · Puerto ajeno respetado

Un `node -e` ficticio escuchando en 4173 (PID 6152, `0.0.0.0` y `[::]`). Después, `node scripts/diagPUE.mjs 1.8 --sin-build`:

```
✖ ERROR DE INSTRUMENTO (código 2): el puerto 4173 está ocupado por otro proceso y el arnés NO lo toca.
    PID 6152 · "C:\Program Files\nodejs\node.exe" -e "require(\"http\").createServer((q,r)=>r.end(\"ficticio\")).listen(4173); setTimeout(()=>{}, 3600000)"
  Elige otro puerto con --puerto=N, o usa ese servidor con --servidor=externo.
código 2
```

El ficticio **seguía vivo** después (`tasklist` = 1). Luego lo cerré yo.

### P7 · `--servidor=externo`

`vite preview --port 4173` levantado a mano (PID 57804). Después, `node scripts/diagPUE.mjs 1.8 --servidor=externo`: midió `1.8b` = **222,0 KiB**, la misma cifra de la Fase 0 ahora con Chromium, y salió con **1**. Al terminar, el PID 57804 **seguía vivo y escuchando**. Luego lo cerré yo.

### P8 · Varas

- **build:** limpio. Lo compila `diagPUE` en la copia; sigue el aviso conocido de chunks > 500 kB, que es B11.
- **vitest:** **1 117/1 117** en 41 archivos, en la copia y con los volcados de `testBancoBandas` copiados (B7 sigue siendo de 3c).
- **eslint:** **21** (20 errores + 1 aviso), igual que la línea base. Los seis archivos nuevos o tocados no dan ni un aviso.

---

## §3 · La nueva forma de correr el arnés

1. **No se levanta ningún servidor a mano:** `node scripts/diagDSK.mjs a2`. El arnés levanta el suyo dentro de su proceso (dev con bypass en 5173; `luz`/`rev` además sin bypass en 5174; `diagPUE` compila y sirve en 4173) y lo apaga al salir.
2. **Puerto ocupado:** el arnés se niega (código 2) y dice PID y línea de órdenes. Hay que elegir otro con `--puerto=N` (y `--puerto-aux=N` para el segundo servidor).
3. **Servidor propio levantado a mano:** `--servidor=externo`, con `AJILEI_BASE` o `PUE_BASE` (y `VOZ2_DEV`) como antes. `diagPUE --sin-build` mide el `dist/` que haya.
4. **Navegador:** el Chromium fijo de `playwright-core`. Se instala una vez con `node node_modules/playwright-core/cli.js install --no-shell chromium`. `ARNES_CANAL=msedge` hace la pasada de contraste con el Edge de la máquina.
5. **Códigos:** **0** verde o informativo · **1** alguna puerta en rojo (también los rojos conocidos) · **2** error de instrumento (excepción, modo que aborta, servidor, navegador, puerto ocupado, modo u opción desconocidos).

No hay en `docs/` un documento de uso del arnés que actualizar (`grep` de `node scripts/diag`, `vite preview --port` y `AJILEI_BASE`: nada fuera de los informes). Estas cinco líneas son la entrada para el registro de 3e. Las cabeceras de `diagDSK`, `diagPUE`, `diagSAL` y `diagCEL0` ya lo dicen.

---

## §4 · Mapa archivo → commit propuesto

| # | Commit | Archivos |
|---|---|---|
| ARN-3a-1 · núcleo | el terreno común y sus pruebas | `scripts/arnes/nucleo.mjs` · `scripts/arnes/nucleo.test.js` · `scripts/arnes/comun.mjs` |
| ARN-3a-2 · arnés | los cuatro arneses sobre el terreno común | `scripts/diagDSK.mjs` · `scripts/diagPUE.mjs` · `scripts/diagSAL.mjs` · `scripts/diagCEL0.mjs` |
| ARN-3a-3 · documentos | — | ninguno: no hay documento de uso en `docs/`; las cabeceras van en el commit 2 |
| ARN-3a-4 · informes | la Fase 0 de ARN-3 y este informe | `docs/reportes/AJILEI_ARN-3_Fase0_Informe_v1.0.md` · `docs/reportes/AJILEI_ARN-3a_Informe_v1.0.md` |

El commit 1 compila y pasa sus pruebas solo: los arneses viejos no lo importan. El commit 2 depende del 1.

---

## §5 · Hallazgos nuevos (se reportan, no se arreglan)

| ID | Hallazgo |
|---|---|
| **A-1** | **`TaskStop` hoy sí mata al hijo directo.** En las dos pasadas de P5, el `node` del arnés murió con la tarea. En la Fase 0, un `node` hijo directo del `bash` (el `npx`) sobrevivió; en el control de hoy sobrevivieron el `npx` y su vite. La diferencia probable es que el arnés corre **con la salida redirigida a un archivo** y el control no, pero no se demostró. Por eso el vigía se queda: cubre los dos casos |
| **A-2** | **Vite 8 reenvía la consola del navegador** (`server.forwardConsole`) a la terminal del servidor. Con el servidor dentro del arnés ensuciaba su salida: se apagó en `comun.mjs`. Quien levante un vite a mano para `--servidor=externo` verá esos mensajes en su consola, como ya pasaba |
| **A-3** | **`diagSAL shots` no existe como modo distinto.** La cabecera promete «solo capturas, sin veredicto», pero el código no ramifica por `MODE`: `shots` corre y juzga igual que `sal`. Se dejó como modo válido y con veredicto |
| **A-4** | **`npm test` en una copia limpia necesita los 75 volcados** de `capturas-dsk/` para dar 1 117. Es B7, de 3c, y aquí solo se constata |
| **A-5** | La comprobación de D3 se cubrió con pruebas unitarias. No se simuló en vivo un Chromium de otra versión, porque haría falta otra versión de `playwright-core` |
| **A-6** | **Dos servidores Vite en el mismo proceso compartían `NODE_ENV`. Se arregló aquí porque es del terreno de esta tanda.** Vite solo pone su `NODE_ENV` por defecto si el proceso no tiene ya uno (`vite/dist/node/chunks/node.js:34338-34340`). En `diagPUE voz2` el `preview` se crea primero y fija `production`, así que el servidor de desarrollo de la burbuja nacía en producción: sin `import.meta.env.DEV`, sin `?apu=` y sin bypass. Resultado: **las 20 `voz2.burbuja` en rojo** por `waitForSelector`. Arreglo: `conNodeEnvPropio()` en `comun.mjs`; cada `createServer`/`build`/`preview` nace sin `NODE_ENV` y al terminar se repone el que había. Repetido: **222/222**. Las corridas de `diagDSK`, `diagSAL`, `diagCEL0` y `diagPUE todo`/`cap` se lanzaron antes del arreglo, pero tienen un solo tipo de servidor por proceso y no les afecta. A `luz`/`rev` (dos servidores dev) tampoco: el problema solo aparece al mezclar `preview` y `dev` |
| **A-7** | **El rojo de `a1` también puede ser de cobertura:** la banda que no llega a verse en la celda (`línea 0f`), igual que el `selReached` de `f1`. Junto con `SINCERRAR` (`a2`) y la mesa reducida (B4), son tres maneras en que el azar del reparto pinta de rojo una celda sin que se mueva la geometría. Es de 3b |

---

## §6 · STOP

**Servidores.** Todos los del arnés vivieron dentro de su proceso y murieron con él. El `npx vite` del control de P5, el ficticio de P6 y el preview a mano de P7 eran míos y los cerré por PID. `netstat` al final, en los puertos de siempre y en los que se usaron para ir en paralelo (4173–4189, 5173, 5174, 5180–5199):

```
(nada escuchando)
```

Durante la tanda no había en esos puertos nada de Victor (el 4173 con túnel de la Fase 0 ya no estaba).

**Copia de pruebas.** `scratchpad/arn3a/app` conserva los logs, los JSON y las capturas. Su unión a `node_modules` ya se quitó con `rmdir` (nunca con `rm -rf`), y el `node_modules` del repo sigue intacto.

**`git status --porcelain`:**

```
 M scripts/diagCEL0.mjs
 M scripts/diagDSK.mjs
 M scripts/diagPUE.mjs
 M scripts/diagSAL.mjs
?? docs/reportes/AJILEI_ARN-3_Fase0_Informe_v1.0.md
?? docs/reportes/AJILEI_ARN-3a_Informe_v1.0.md
?? docs/reportes/AJILEI_MOT-1_Fase0_Informe_v1.0.md
?? docs/reportes/AJILEI_MOT-1_Fase1-0_Sonda_Informe_v1.0.md
?? laminas/mon1/_entorno.txt
?? laminas/mon1/lamina.html
?? laminas/mon1/tiempos.json
?? scripts/_cel1bFila.mjs
?? scripts/arnes/
```

Los cuatro arneses modificados, `scripts/arnes/` (3 archivos nuevos), los dos informes de ARN-3 y los seis residuos de siempre. Sin `git add`.
