# AJILEI · ARN-4 · Fase 0 · Informe de la sonda · v1.0

**Para:** el rector y Victor · **Fecha:** 2026-11-03 · **Base:** `a32ec2f`
**Estado:** STOP-0. Nada arreglado, nada en el índice. Este informe es el único archivo escrito en el repo.

## Lo importante en seis líneas

1. **La falsa caída de vitest (T3) ya tiene causa reproducible:** si el proceso arranca con la unidad en minúscula (`c:\…`), caen los 88 archivos, con «no tests». Con `C:\…`, 2.075 verdes. No es azar: es determinista.
2. **eslint** da 20 errores y 1 aviso, como se esperaba. De los 21, 3 son limpieza pura, 11 son un cambio mecánico en los refs y 7 tocan efectos de la mesa, que pido no refactorizar ahora (P-4).
3. **CLI:** la v3 salió ayer, y `latest` ya apunta a ella. Propongo fijar la **2.122.1** exacta y dejar la v3 para después de MOT-1. En v3, un `db push` sin más **no va a la nube**.
4. **Ningún punto del inventario toca un protegido.** No hay 🔒.
5. **Varios puntos cambian de sitio o se cierran:** B5 ya no ocurre, A9b y A10b ya están resueltos o no tienen arreglo, C5 y C6 no son de servidor, y B4 no conviene antes de MES-PvP.
6. **Reparto propuesto: 4a Herramientas → 4b Varas → 4c Limpieza y servidor.** Cambia la hipótesis en un punto: las varas se afilan antes de limpiar, para que prueben la limpieza.

---

## 1. Punto de partida (§4.1)

| Comprobación | Esperado | Medido |
|---|---|---|
| `git log -1` | `a32ec2f` | `a32ec2f` ✓ |
| `git status --porcelain` | solo MOT-1 y `laminas/mon1/` | 2 informes y 3 archivos de `laminas/mon1/` ✓ |
| `git worktree list` | una línea | una línea ✓ |

Al terminar, `git status` sigue igual, más este informe.

### Lo que hice de más, para que conste

La ficha pedía 1 build y 5 corridas. Para la causa de T3 hice más, y hay una cosa que no estaba en la lista de permitidos:

| Qué | Efecto | ¿En la lista? |
|---|---|---|
| **`node scripts/guiones.mjs`** | Postgres en memoria; no toca Supabase ni el repo | **No.** Lo corrí para medir su tiempo (A4). Debí preguntarme antes si la ficha lo cubría |
| `git worktree prune --dry-run` | ninguno (solo simula) | **No** |
| 12 corridas completas más de vitest (§2.2) y 2 de un solo archivo (A8) | cachés ignoradas y `capturas-dsk/_tb_*` | Sí, para la hipótesis del §4.3 |
| 24 `vite build` a la vez que vitest, en `dist/` | `dist/` reescrito, del mismo commit | Sí, para la hipótesis |
| 1 `vite build --sourcemap` en el scratchpad | fuera del repo | Sí |
| Una unión de prueba en el scratchpad, con destino también en el scratchpad | creada y quitada | No se usa `node_modules`; prueba de diseño de A3 |
| `npx supabase migration list` | Imprimió **«Initialising login role…»** | Sí, y no pidió nada. Ver nota del §2.3 |

---

## 2. Mediciones

### 2.1 eslint (§4.2): 20 errores y 1 aviso

| Archivo | Regla | Cuántos | Líneas |
|---|---|---|---|
| `GameTable.jsx` | `react-hooks/refs` | 11 | 434, 440, 2463, 2472, 2474, 2477, 2485, 2487, 2490, 2503, 2508 |
| `GameTable.jsx` | `react-hooks/set-state-in-effect` | 6 | 794, 834, 870, 887, 1672, 1726 |
| `GameTable.jsx` | `react-hooks/immutability` | 1 | 913 |
| `GameTable.jsx` | aviso: `eslint-disable` que ya no hace falta | 1 | 873 |
| `CardImage.jsx` | `react-refresh/only-export-components` | 1 | 16 |
| `SoundContext.jsx` | `react-refresh/only-export-components` | 1 | 44 |

Tarda 7 s. La clasificación de cada uno está en B1.

### 2.2 vitest (§4.3): cinco de cinco en verde; la falla se reproduce con otra condición

Las cinco corridas pedidas, seguidas, en el árbol principal:

| Corrida | Archivos | Pruebas | Fallidas | Omitidas | Duración |
|---|---|---|---|---|---|
| 1 | 88/88 | 2.075 | 0 | 0 | 5,03 s |
| 2 | 88/88 | 2.075 | 0 | 0 | 5,23 s |
| 3 | 88/88 | 2.075 | 0 | 0 | 5,64 s |
| 4 | 88/88 | 2.075 | 0 | 0 | 4,43 s |
| 5 | 88/88 | 2.075 | 0 | 0 | 5,41 s |

La intermitencia no salió en esas cinco, así que probé las sospechas que dejaron los informes anteriores:

| Condición | Corridas | Resultado |
|---|---|---|
| **Directorio de trabajo con `c:` en minúscula** (forzado con `cmd /d /c "cd /d c:\…"` o `process.chdir('c:/…')`) | 2 | **Las 2: 88 fallidos, «no tests», código 1, 2,2 s** |
| `cd c:\…` en PowerShell o Git Bash | 2 | Verde. Ambos corrigen la letra a `C:` antes de lanzar node, así que **no prueban nada** |
| vitest con 6 builds a la vez (la sospecha de `.vite-temp` y de TAB-3) | 4 rondas | 4 verdes |
| Minúscula, con `--root C:/…` | 1 | Sigue roja |
| Minúscula, con `process.chdir` a mayúscula dentro de la configuración | 1 | Sigue roja |
| **Minúscula, pero lanzando vitest como proceso hijo con `cwd` en mayúscula** | 1 | **Verde: 88/88, 2.075** |

**El primer error completo:**

```
 RUN  v4.1.8 c:/Users/victo/OneDrive/Documents/ajilei
 FAIL  scripts/testAI.test.js [ scripts/testAI.test.js ]
TypeError: Cannot read properties of undefined (reading 'config')
 ❯ scripts/testAI.test.js:106:1
```

**Qué comparten los fallidos:** todos los archivos, ninguna prueba llega a correr. Tres textos: `reading 'config'` (75), `Vitest failed to find the runner` (7) y `Vitest failed to find the current suite` (6).

**Causa, separando lo medido de lo deducido:**

- **Medido:** la letra en minúscula lo provoca siempre, y corregirla antes de arrancar vitest lo cura.
- **Deducido, sin rastrearlo dentro de vitest:** Windows no distingue `c:` de `C:`, pero la caché de módulos de node sí. Vitest se carga dos veces como dos módulos distintos, y el corredor de uno no ve al del otro. Los dos textos «failed to find» encajan con esa carga doble.
- **Por qué parecía azar (deducido):** VS Code entrega las rutas como `c:\…` (la cabecera de esta sesión lo mostraba así) y un `cd C:/…` posterior lo corrige. Eso encaja con «la primera corrida falla y las siguientes no» de TAB-2, y con la nota de CFG-1 1e, que guardó este mismo texto de error.
- **Lo que no puedo afirmar:** que **todos** los casos anteriores sean este. ARN-3e y TAB-2 no guardaron el texto. La nota de TAB-3 («aparece mientras `diagDSK` compila») no se reprodujo con builds; con los servidores del arnés no se probó, porque el arnés no se corre en esta sonda.

**Hipótesis de la ficha:**

| Hipótesis | Veredicto |
|---|---|
| ¿Falta `dist/`? | **No.** `testDistSinMoldes` compila en su propia carpeta temporal y ninguna otra prueba lee `dist/`. La receta «`vite build` antes de vitest» de RNK-1 ha quedado vieja (D-5) |
| ¿`.env.local`? | Es otra firma: 5 archivos con SUP-1, no todos. No se probó aquí, sale de RNK-1 y TAB-3 |
| ¿Concurrencia o `.vite-temp`? | No reproducida en 4 rondas con builds. Sin descartar con servidores del arnés |
| ¿Solo en worktree? | No: se reproduce en el árbol principal |

### 2.3 CLI de Supabase (§4.4)

| Dato | Valor |
|---|---|
| Instalado | **2.116.0** (exacto en `package.json:33`, publicado el 2026-08-26) |
| Última 2.x | **2.122.1** (etiqueta `v2.stable`, 2026-11-02) |
| Última 3.x | **3.0.0** (etiqueta `latest`, 2026-11-02) |
| Política de v2 | Desde ayer, solo arreglos de seguridad y de lo roto de raíz |

**Línea base de `migration list`.** Contestó sin pedir contraseña, token ni confirmación. Sin terminal, la versión instalada la da en JSON. **14 de 14 iguales, 0 discrepancias:**

```
0001 · 20260905203158 · 20260911043500 · 20260911103000 · 20260911230935
20261007144943 · 20261008220239 · 20261009105658 · 20261012230807
20261024191731 · 20261030001500 · 20261030013000 · 20261030193000 · 20261031150000
```

> **Nota.** La salida empieza con «Initialising login role… Connecting to remote database…». Las notas de la v3 describen, al hablar de otro comando, que el CLI «crea un rol de acceso temporal». O sea, **probablemente este comando crea uno en el servidor**. No lo comprobé. La ficha lo permitía y no vi nada más, pero lo dejo escrito porque la sonda era de solo lectura.

Las notas de versión y lo que usa el proyecto están en C1.

### 2.4 Tamaño del paquete (lo usa B3)

| Trozo | Tamaño | gzip |
|---|---|---|
| `index-*.js` | **699,71 kB** | 206,49 kB |
| `GameTable-*.js` | 94,79 kB | 30,43 kB |
| `index-*.css` | 163,60 kB | 31,48 kB |
| `GameTable-*.css` | 119,89 kB | 19,61 kB |

Vite avisa de «más de 500 kB». Compilé con mapas de fuente en el scratchpad y repartí los bytes del `index` por archivo de origen. Es una atribución aproximada, en bytes sin comprimir:

| De `index-*.js` | Bytes |
|---|---|
| `node_modules` en total | 434.607 (62 %) |
| — `react-dom` | 174.754 |
| — `auth-js` (GoTrueClient) | 59.609 |
| — `howler` | 35.884 |
| — `phoenix` (Realtime) | 25.743 |
| — `storage-js` | 21.649 |
| `textos.es.js` | 18.156 |
| `paises.js` | 11.055 |
| **Rankings** + `rankingsCore` + `rankingApi` | **8.448** |
| **Intersticial** + `sumaCore` | **4.438** |
| `src/dev/` en total (`bancoImitado` 1.464) | 1.959 |

---

## 3. Inventario

**Leyenda de Tamaño:** S ≤ 20 min · M 20–60 · L > 60. **Sub-tanda:** la del §5.

### Grupo A · El taller del arnés

| ID | Estado | Dónde (hoy) | 🔒 | Tam. | Riesgo | Necesita | Depende de | Sub-tanda |
|---|---|---|---|---|---|---|---|---|
| **A1 · T3** | **Sigue vivo; causa hallada** | Sin línea propia: afecta a toda corrida. Remedio en `package.json:11` y `vite.config.js` | — | S | Ninguno | Nada | — | **4a** |
| **A2 · T4** | Sigue vivo | `.git/worktrees/` vacío; **queda 1 unión** (D-3) | — | S | **Alto si se hace mal:** un borrado recursivo por la unión vacía el `node_modules` real | Nada | — | **4a**, dentro de A3 |
| **A3 · G1** | Sigue vivo | No existe. Nacería en `scripts/arnes/aislado.mjs` | — | M | Ninguno para el producto | Nada | A1, A2, A11 | **4a** |
| **A4 · T5** | Sigue vivo | No existe. Nacería en `scripts/arnes/orquesta.mjs` | — | L | Ninguno para el producto | Nada | A1 | **4a** |
| **A5 · F1** | Sigue vivo | `scripts/cap/capMesa.mjs:401-427`, `scripts/tab/tab.mjs:347-356`, `:823`, `scripts/arnes/tinta.mjs` | — | M | Podría esconder un cambio real si el criterio es flojo | Nada | A4 | **4b** |
| **A6 · VOZ-3** | Sigue vivo | `apu`: `diagDSK.mjs:1936-1941`, `:3006-3016`; `tel.linea`: `:3510`, `:3601`; moldes: `src/dev/siembraAPU.js:185-186`, `:240-243` | — | M, y 40–45 min de máquina | Ninguno para el producto; una semilla sellada envejece si cambia la IA | Nada | A4 | **4b** |
| **A7 · TAB-1** | **Casi resuelto** | `scripts/testInvariantes.test.js:40`, `scripts/testRec2.test.js:266` | — | S | Ninguno | Nada | — | **4a** |
| **A8 · ECO-1** | **Ya resuelto; sin arreglo** | `scripts/testDistSinMoldes.test.js:92-106` | — | S | Ninguno | Nada | — | **4a**, solo la tabla |
| **A9a · RNK-1** | Sigue vivo a medias | `scripts/cfg/vis1.mjs:28`, `:63`, `:94` | — | S | Ninguno | Nada | — | **4b** |
| **A9b · RNK-1** | **Sin arreglo posible; propongo cerrarlo** | `supabase/pruebas/rnk1a_verificacion.sql:39` | — | — | Ninguno | Nada | — | **Cerrar** |
| **A10a · VIS-1** | Sigue vivo | `src/screens/Portada.jsx:527`, `src/styles/portada.css:698`. Ninguna vara mide el contraste de la Portada | — | S | La medida no; el cambio de color sí, y es de Victor | **Ojos de Victor** para decidir | A4 | **4b** |
| **A10b · VIS-1** | **Ya resuelto** | `scripts/arnes/tinta.mjs:169-187`, INV-79 | — | — | — | — | — | **Cerrar** |
| **A11 · CFG-1** | **Explicado; no es fallo** | `scripts/testBancoBandas.test.js:166-168`, `:188`; `.gitignore:31` | — | S | Ninguno | Nada | A3 | **4a** |

**A1 · Remedio propuesto.** Las dos vías dentro del proceso (`--root` y `chdir` en la configuración) ya se probaron y no sirven. Sirve esto:

1. `npm test` y los guiones pasan por un lanzador que corrige la letra y arranca vitest como hijo. Es lo que dio verde en la prueba.
2. Para quien teclee `npx vitest` en una consola con minúscula: `vite.config.js` sale con **código 2** y una frase clara cuando corre bajo vitest y la unidad va en minúscula. Un fallo de instrumento debe decir que lo es (doctrina de ARN-3a). Falta probar que salir ahí corta antes de los 88 fallidos.
3. Las fichas guardan siempre la salida entera en un archivo antes de repetir (ya lo pedía ARN-3e).

**A2 · Lo que deja hoy una prueba de commits, y orden seguro.** Hoy no hay ningún worktree. `.git/worktrees/` existe vacío (última modificación, 04:38 de hoy), y `git worktree list` da una línea. Revisé los 171 scratchpads de sesiones anteriores: ningún `wt-*` hasta dos niveles de profundidad, y **una unión viva** (D-3).

El orden de la ficha es correcto. Lo confirmo y le añado dos comprobaciones:

1. Comprobar que la ruta **es** una unión (`lstat`); si no lo es, parar.
2. Soltar la unión (`cmd /c rmdir`, o `fs.unlinkSync`).
3. Comprobar que el `node_modules` real sigue entero (`node_modules/vite/package.json` y `node_modules/.package-lock.json`).
4. `git worktree remove --force <ruta>`.
5. Borrar `.git\worktrees\wt-*` si OneDrive lo dejó.
6. `git worktree prune`.
7. `git worktree list` tiene que dar **una línea**.

Trampas ya registradas: en Git Bash, `cmd //c mklink /J` falla, y el modo automático deniega `rm -rf`. Por eso, en A3, todo desde Node.

**A3 · Diseño del guion.** Lenguaje: **Node**, por tres razones: el arnés ya lo es, sus piezas puras se prueban en vitest, y Node hace uniones de forma nativa, sin pasar por `cmd` ni por las conversiones de ruta de Git Bash. Lo probé en el scratchpad: `fs.symlinkSync(destino, enlace, 'junction')` crea la unión, `lstat` la reconoce y `fs.unlinkSync` la quita dejando intacto el destino.

```
node scripts/arnes/aislado.mjs <sha> [<sha>…]   # o: npm run aislado -- <sha>
     [--perfil=rapido|commit]  [--dejar]        # --dejar conserva la copia si sale rojo
```

| Paso | Qué hace |
|---|---|
| 1 | Ruta **fuera de OneDrive**: scratchpad si se pasa, si no `os.tmpdir()`; nombre nuevo por corrida. La ruta real sale de `git worktree list` |
| 2 | `git worktree add --detach <ruta> <sha>` |
| 3 | Unión de `node_modules` |
| 4 | Copia `.env.local` y los 75 volcados (A11) |
| 5 | `vite build`. Vitest ya no lo necesita (D-5), pero separa «no compila» de «no pasa» |
| 6 | `vitest run` con la letra corregida (A1) y la salida entera en un archivo |
| 7 | `eslint`, comparado con la firma de la base |
| 8 | **Limpieza de A2 en un `finally`**: se hace aunque algo falle |

Códigos 0/1/2, como el arnés. Lo puro (la ruta, el análisis de `git worktree list`, el veredicto) en `aislado.test.js`.

**A4 · Inventario de varas.**

| Vara | Qué mide | Necesita | Tiempo |
|---|---|---|---|
| `eslint .` | Estilo y hooks, solo `.js` y `.jsx` (D-1) | Nada | 7 s |
| `vitest run` | 88 archivos, 2.075 pruebas | Nada | 5 s |
| `vite build` | Que compile | Nada | 1,3 s |
| `npm run guiones` | 8 guiones × 2 pasadas, 14 migraciones | Nada: PGlite | 1,9 s |
| `npm run banco:verificar` | 75 formas, 87 celdas del banco | Nada | 577 s |
| Guiones en la base real | Filas de `supabase/pruebas/` | **Servidor real, SQL Editor de Victor** | Manual |
| `diagDSK humo` | d1d2, d3, bug, shots, gate, lob, retar, rnk, suma, cfg, tienda | 5173 + 4173 propios | **796 s** |
| `diagDSK apu` | La mesa con dinero, 7 celdas, `rec2`, `voz3` | 5173 | **40–45 min** |
| `diagDSK tab` | La escala real | 4173 | **1.649 s** (se parte: `tab frase` y las otras nueve) |
| `diagDSK luz` con p2 | Luz y contraste en la mesa | Servidor propio | **1.413 s** |
| `diagDSK msg` | Mensajes, semillas 1–15 | 4173 | ~14 min |
| `diagDSK cfg` | ⚙, ⋮, eliminar cuenta, contraste, victoria | 4173 + dev | 463 s |
| `diagDSK mesaia` | Mesas IA contra banco imitado | 4173 | 403 s |
| `diagDSK tam` | Tamaños en pantallas de chips | 4173 | 300 s |
| `diagDSK tapetes` | Tapetes | 5173 | 189 s |
| `diagDSK tienda` · `suma` · `lob` · `saldo` · `rnk` | Pantallas sueltas | 4173 | 64 · 57 · 42 · 14 · 12 s |
| `diagDSK webkit` · `constancia` · `video` | WebKit, constancia, video | 4173 | Sin cifra fiable reciente |
| Otros 30 modos de `diagDSK` (`d1d2`, `d3`, `bug`, `shots`, `gate`, `retar`, `b1`, `tactil`, `p1`, `p2`, `r1`, `r2`, `o1`, `h1`, `m1`, `a1`, `f1`, `z1`, `o2`, `a2`, `u1`, `menu-movil`, `u2`, `u3`, `vc`, `vuelo`, `rev`, `rec`, `congelado`, `revive`) | Geometría y mesa | 5173 con bypass | Sin cifra reciente en lo que leí |
| `diagPUE todo` · `cap` · `voz2` | Portada; fotos; frase | 4173; `voz2` añade 5173 | `cap` 157 s; el resto sin cifra |
| `diagCEL0 celebracion` | La celebración | 5173 con bypass | 484 s |
| `diagSAL sal` | Salas | 5173 con bypass | Sin cifra reciente |

Son **47 modos** en `MODOS_DSK` (`scripts/arnes/nucleo.mjs:227-231`) y 19 en `MODOS_PUE` (`diagPUE.mjs:189`). `diagARN.mjs`, que cita la ficha, **no existe**: el arnés se reparte entre esos cuatro `diag*`. Casi todos los modos levantan su propio servidor, salvo con `--servidor=externo`. Las cifras sin fuente propia las medirá la primera corrida del orquestador. Mi estimación de una pasada completa en serie es **unas 3 horas**.

**Forma propuesta:**

```
npm run varas -- rapido     # eslint, vitest, build, guiones            ~15 s
npm run varas -- commit     # rapido + humo                             ~14 min
npm run varas -- completo   # todo: apu por celdas, tab en dos partes…  ~3 h
npm run varas -- --solo cfg,lob
```

- **La lista es el contrato**, como en `guionesCore`: una prueba compara los perfiles con `MODOS_DSK` y `MODOS_PUE`. Un modo que nadie declara, o que se excluye sin motivo escrito, sale rojo.
- **Un solo build, y `--sin-build` después.** D17 da código 2 si se compila con un dev vivo, así que el orden importa.
- **Cada vara con su archivo de salida** y un tope propio por debajo de los 30 min de las tareas de Bash. Por eso `apu` va partida.
- **Salida:** una tabla con vara, código, duración y archivo. Código global: 2 si hubo fallo de instrumento, 1 si hubo rojo, 0 si todo verde.
- **Mide también los puntos sueltos**, como la Portada de A10a.

**A5 · Qué varas comparan fotos.** Solo estas:

| Vara | Compara | Umbral |
|---|---|---|
| `diagPUE cap`: `cap.estable` y regresión | Dos pasadas y contra la maestra | `TOLERANCIA_CAP`: 99,9 % con Δ ≤ 2 y ningún Δ > 40 |
| `diagDSK tab`: pares `V-cel` y `V-fuera` | Escala viva frente a escala 1 | La misma |
| `cfg.contraste`, `tie.contraste`, `luz` p2, por `tinta.mjs` | Foto con texto y foto sin texto | No compara con una maestra, pero **un redibujado entre las dos fotos se contaría como tinta** |

**El riesgo es real aunque aún no haya dado rojo.** VIS-1 midió ruido de hasta **Δ 57** en 3–21 píxeles. Eso pasa el tope de Δ 40 de `TOLERANCIA_CAP`, así que un redibujado puede poner roja una foto sin que nada haya cambiado.

**Criterio propuesto:** no aflojar el umbral. Solo ante un rojo:

1. Repetir la foto dos veces. Si vuelve a estar dentro del umbral, verde **con la nota «ruido, n repeticiones»**.
2. Si sigue fuera, comparar una huella tomada junto a la foto: el DOM, los estilos calculados de lo visible y las URL de las imágenes cargadas.
3. Veredicto de tres valores: **`igual`** · **`ruido`** (huella idéntica, más del 99,9 % con Δ ≤ 3 y pocos píxeles con Δ > 10) · **`cambio`** (la huella difiere, o el patrón no es de ruido). `ruido` se cuenta y se informa; nunca se calla.

Para el corte de «pocos píxeles» parto de los 3–21 de VIS-1. Se calibra en la tanda con parejas guardadas.

**A6 · `apu`, `tel.linea` y `?apu=allin`.**

- **Tamaño de `apu`:** 7 celdas (3 de teléfono y 4 de escritorio), más `rec2` con 18 estados y `voz3`. Tarda porque juega manos de verdad en tiempo real. El tope de 30 min no es del arnés: es de las tareas en segundo plano de Bash.
- **Partirlo ya se puede:** `apu 360x640` corre una celda, `apu rec2` y `apu voz3` lo suyo (`voz3` tardó 1 min 12 s). No hay cifra por celda; repartiendo los 40 min saldrían unos 5–6 min cada una. Falta que el orquestador lo haga, y en paralelo con `--puerto`.
- **`tel.linea`** (`diagDSK.mjs:3510`): la línea «Estás all-in» en la mesa de 4 de 360×640 depende de que una IA apueste. Sin verla, el punto queda «sin cobertura», no rojo (`:3601`). El cierre de REC-1 ya dijo que subir intentos solo esconde la fragilidad.
- **¿Se puede sembrar? Sí, sin abrir ningún protegido.** `deck.js:56` y `aiPlayer.js:599` leen `Math.random` en cada llamada, a propósito. Basta un `addInitScript` que cambie `Math.random` por un generador sembrado. Es lo que `msg` ya hace por `contextoCap` (`capMesa.mjs:100-101`, `:161-164`), con semillas 1–15 reproducibles según ARN-3c. Lo que falta es lo mismo para 5173, porque `apu` corre ahí.
- **`?apu=allin`** hoy fija el reparto una vez y deja a las IAS con su azar: en la mesa de 2 sale seguro, en las de 3 a 5 «lo más probable» (`siembraAPU.js:34-36`). La siembra anterior lo cierra.
- **Falta comprobar:** que sembrado siga siendo reproducible en 5173 y con la ventana de `tel.linea`. Y una semilla sellada hay que **volver a elegirla** si cambia la IA. Con MOT-1 cerca, conviene que esa señal sea un «sin cobertura» y no un rojo.

**A7.** Revisé todos los `.split('\n')` de `scripts/`. La inmensa mayoría parten el mensaje de un error y no leen datos. Los que leen archivo:

| Dónde | Estado |
|---|---|
| `scripts/tab/tab.mjs:464`, `scripts/arnes/nucleo.mjs:153` | Ya usan `/\r?\n/` |
| `scripts/eco/guionesCore.mjs:81` | Normaliza antes |
| `scripts/bancoVerificar.mjs:150` | Salida de un hijo, con `trim` por línea |
| `scripts/arnes/fuente.mjs:42`, `testProtegidos.test.js:42` | Solo cuentan líneas; el segundo, a propósito sobre bytes |
| **`testInvariantes.test.js:40`**, **`testRec2.test.js:266`** | **Los dos que faltan.** Hoy no fallan: `.gitattributes` fija LF |

**A8.** La guardia (`testDistSinMoldes`) compila en un proceso hijo a una carpeta temporal, con `NODE_ENV=production` y `VITE_AUTH_BYPASS=1`, y mira 26 condiciones sobre el resultado. **Sola tarda 1,7 s de pared; dentro de la suite no alarga la corrida**, que sigue en 5 s. **Propongo dejarla como está.** Los modos con servidor están en la tabla de A4: `MODOS_PREVIEW` (`diagDSK.mjs:455`) corre en 4173, y el resto en 5173 con bypass; `humo` y `cfg` usan los dos.

**A9a.** VIS-1 ya mide con escala real los **botones** de la victoria (`vis1.mjs`, `ESCALADAS`). La **tarjeta** «Ver tu nuevo ranking» sigue sin medirse con f ≠ 1 (M-10 de RNK-1 1d). Propongo añadirlo a `cfg.victoria`, que ya tiene la escala puesta, y no a `tab`: abrir la tarjeta, comprobar que vive fuera de `#root` y que mide lo mismo que desde Rankings.

**A9b.** La pregunta de la ficha ya tiene respuesta: el guion **ya corre con `begin … rollback`**. Los ~110 ids se gastan igual porque un `nextval` no se deshace con el `rollback` (M-12). Evitarlo pediría tocar la secuencia en la base real, y eso es peor que el hueco, que no tiene consecuencias. `npm run guiones` ya lo corre en PGlite sin gastar nada. **Propongo cerrarlo sin arreglo.**

**A10.** `.pue-cta-vacuna` da 4,32 en 412×915 según la sonda de VIS-1. Queda lista una puerta `pue.contraste` con `tinta.mjs`; **no decido nada sobre la Portada**. Los controles apagados ya están exentos: `tinta.mjs` cuenta aparte lo que tiene opacidad bajo 0,9, e INV-79 lo declara. Único matiz: la exención se reconoce **por la opacidad**. Un control apagado solo con color no quedaría exento.

**A11.** Se omite porque `sinVolcados` es cierto cuando no hay **ninguno** de los 75 volcados, y `capturas-dsk/*` está ignorado por git: un worktree nace sin ellos. En el árbol principal están los 75 (2,77 MB), y por eso sale 0 omitidas. **Propongo que el guion de A3 los copie**, y así un worktree prueba lo mismo que el árbol principal.

### Grupo B · Limpieza de código

| ID | Estado | Dónde (hoy) | 🔒 | Tam. | Riesgo | Necesita | Depende de | Sub-tanda |
|---|---|---|---|---|---|---|---|---|
| **B1 · T6** | Sigue vivo | Ver tabla abajo | — (`GameTable.jsx` no es `gameTable.css`) | **M** con la opción que recomiendo; **L** si se refactoriza todo | Según opción; la mesa es lo más sensible | `apu` y `humo`; **sin** lámina en la opción recomendada | A4, A6 | **4c** |
| **B2 · ECO-1** | Sigue vivo | `src/hooks/useAuth.js:94`; una aparición en `dist/assets/index-*.js` | — | S | Ninguno: rama muerta en producción | Nada | — | **4c** |
| **B3a** `state.winner` | Sigue vivo | `src/hooks/mesaIACore.js:189`; gemelo en `src/hooks/manoCore.js:86` | No | S | Bajo; por lectura la rama no se alcanza | Nada | — | **MOT-1** |
| **B3b** `Object.freeze` | Sigue vivo | `src/dev/bancoImitado.js:46-93`; 1.464 B en `index`, con `Bachaquero_VE` | — | S | Ninguno | Nada | — | **4c** |
| **B3c** carga diferida | Sigue vivo | `src/App.jsx:17`, `:21` | — | M | **Visible:** un «Cargando» al abrir Rankings o el video | Ojos de Victor | — | **Fuera** |
| **B3d** «CUATRO props» | Sigue vivo | `src/App.jsx:1132`. Hoy son 10 | — | S | Ninguno | Nada | — | **4c** |
| **B4a** `SalaOpciones` → `PantallaChips` | Sigue vivo | `src/screens/SalaOpciones.jsx:246` repite la carcasa de `src/components/PantallaChips.jsx:143` | — | **L** | **Visible** en una pantalla que iOS no puede validar (INV-41) | Lámina u ojos de Victor; teléfono | — | **MES-PvP** |
| **B4b** parche de la 1b | Sigue vivo, y **no se puede quitar aún** | `src/styles/salas.css:1247-1290` | — | M | **Visible:** la Sala de espera y la partida aún lo usan | Lámina y teléfono | B4a | **MES-PvP** |
| **B5 · TAB-1** | **No reproducible por lectura** | `src/components/AvisoSaldo.jsx:54` | — | — | — | — | — | **Cerrar** |
| **B6 · TAB-2** | Sigue vivo | `src/index.css:22`, con `--bg: #fff` en `:4` | — | S | Bajo; solo se ve en el rebote | **Ojos de Victor y teléfono** | — | **4c** |
| **B7 · CFG-1 1d** | **Sigue vivo; es un fallo real en producción** | `src/components/FormularioPuerta.jsx:153` | — | S | Mínimo | **Ojos de Victor:** pegar un código real | — | **4c** |
| **B8 · TIE-1 1a** | Sigue vivo; **nada vivo lo lee** | `src/config/tapetes.js:20-28`, `:39`, `:47`, `:55`, `:63`, `:73`; `src/styles/tapetes.css:92-116`; `scripts/testTapetes.test.js:46-50` | — | M por el normativo | Ninguno visible | Nada | — | **4c** |
| **B9 · TIE-1 1a** | **Confirmados los cinco, sin llamadores** | Ver abajo | — | S | Ninguno | **Los borra Victor a mano** | — | **4c**, al final |

**B1 · Cada error:**

| Líneas | Qué es | Clase | ¿Ojos de Victor? |
|---|---|---|---|
| 873 (aviso) | `eslint-disable` que ya no hace falta | **Inocuo** | No |
| `CardImage.jsx:16` | Exporta `URLS_BARAJA` junto al componente. Solo afecta a la recarga en caliente | **Otro:** mover la constante. Ojo: `precargaBaraja` la importa, y puede alterar los trozos; se comprueba con el build | No |
| `SoundContext.jsx:44` | Exporta `useSoundContext` junto al proveedor | **Otro:** mover el hook; 9 referencias en `src/` | No |
| 434, 440 | `useRef` con arranque perezoso de `slotRefs` y `deckRefs` | **Toca hooks; cambio mecánico** | No |
| 2463, 2472, 2474, 2477, 2485, 2487, 2490, 2503, 2508 | Funciones de render que leen esos refs | **Toca hooks; misma causa.** Probablemente desaparecen con el cambio de arriba (16 sitios de `.current`) | No |
| 794 | `setBetAmount(unit)` al cambiar la fase | **Toca efectos: puede cambiar comportamiento** | Sí, si se refactoriza |
| 834, 870 | Vaciar cartas y paso del reparto | **Ídem, en la coreografía del reparto** | Sí, si se refactoriza |
| 887 | Rearmar el reloj de turno | **Ídem, reloj de turno** | Sí, si se refactoriza |
| 1672, 1726 | Cierre del showdown y del desplegable | **Ídem** | Sí, si se refactoriza |
| 913 | `startDiscardAnim` usada antes de su declaración | **Otro:** en JS funciona, porque la función se eleva. Moverla arrastraría más código | Sí, si se refactoriza |

**Tres opciones:**

- **(a) Silenciar los 20** con `eslint-disable-next-line` y su motivo. Unos 20 min, sin riesgo, pero la deuda sigue.
- **(b) Recomendada: arreglar lo mecánico y silenciar lo sensible.** Refs con `useState(() => …)` (11 errores), mover los dos exports y quitar el aviso. Los 7 restantes se silencian con su motivo y su dueño: «MOT-1 reescribe este flujo». Unos 45 min. **eslint llega a cero**, y ningún efecto de la mesa cambia antes de la cirugía.
- **(c) Refactorizar todo.** Más de una hora, con riesgo en reparto y reloj justo antes de MOT-1, que los va a reabrir.

**B2.** `PERFIL_DEV` queda en el paquete como código muerto (~90 B). Arreglo: `const PERFIL_DEV = import.meta.env.DEV ? {…} : null`, porque todos sus usos ya están detrás de `AUTH_BYPASS`; y añadir `'DevLocal'` a `PROHIBIDAS` en la guardia. Es la misma puerta que ya llevan `siembraAPU` y `salasFixtures`. En desarrollo lo usa solo el bypass.

**B3.**

- **`state.winner`:** no es protegido, pero MOT-1 lleva este cálculo al servidor. Quitarlo ahora es tocar dos veces lo mismo. **A MOT-1.**
- **`Object.freeze`:** el empaquetador no se atreve a tirar esas llamadas. Basta marcarlas `/* @__PURE__ */`, o mover las tablas al cuerpo de `crearBanco`. Y añadir `Bachaquero_VE` a la guardia.
- **Carga diferida:** se ahorrarían ~6,7 kB (Rankings y su núcleo) + ~4,4 kB de JS: **el 1,6 %** de los 699,71 kB, más sus hojas. `rankingApi` (1,8 kB) no se movería: `App.jsx:44` lo importa de todos modos para la mesa. A cambio, un «Cargando» visible al abrir Rankings y al llegar al video. **No compensa. Propongo sacarlo** a una campaña de peso, donde hay piezas mucho mayores (ver Fuera de ARN-4).

**B4.** La Fase 1e de IOS-1 ya dejó dicho por qué el parche quedó acotado y no borrado: la Sala de espera y la partida comparten `.sal`, y sin anclaje propio se quedarían sin desplazar en 521–830. Son las pantallas que MES-PvP va a rehacer. **Propongo llevar B4a y B4b a MES-PvP.**

**B5.** **Hoy el caso no ocurre.** `AvisoSaldo` solo lo monta `BarraSuperior`, y `BarraSuperior` solo lo montan `Lobby`, `PartidaPvP`, `SalaEspera`, `SalaOpciones` y `PantallaChips`. `GameTable` no lo monta, `App` la pinta sola, y la escala solo vive con la mesa montada (`useEscalaMesa`). O sea, el aviso nunca sale sobre una mesa ampliada. **Propongo cerrarlo** con una nota para MES-PvP: si la barra entra en la mesa, se reabre.

**B6.** Confirmado leyendo el CSS. `html` tiene fondo propio (`--bg`), así que el del `body` no llega al lienzo. Arreglo aditivo: en `index.css:22`, `background: var(--green-abyss)` en vez de `var(--bg)`, que no usa nadie más (solo esa línea). Comprobar que `tapetes` y `luz` siguen verdes. **No lo he visto en pantalla:** solo asoma en el rebote de desplazamiento, y eso hay que mirarlo en un teléfono.

**B7.** **Confirmado: la pantalla de entrada es `FormularioPuerta`,** que monta `Portada.jsx:541` (va en el paquete). `screens/Entrada.jsx` no lo importa nadie. El filtro de la línea 160 ya recorta a 6 dígitos, y el `maxLength` de la 153 corta lo pegado **antes** de llegar a él: «123 456» se queda en «123 45», cinco dígitos. El arreglo es quitar esa línea, como ya hace `CambiarCorreo.jsx:25`. Solo falta añadir una puerta con un pegado real: `diagPUE` y `cfg` usan `fill` con seis dígitos, y por eso no lo vieron. **Lo sufre hoy cualquier jugador que pegue el código con espacio.**

**B8.** Solo lo lee la prueba del catálogo. `diagDSK.mjs:11714`, `:11753` y `:12031` son comentarios de historia y pueden quedarse. Ojo: **`AJILEI_Tapetes_v1.3.md` no existe**, la última es la v1.2. Hay que crearla, con su referencia en el registro.

**B9.** Busqué importaciones estáticas, dinámicas, en pruebas y en el arnés, y además miré los mapas de fuente: **los cuatro de JS no están en el paquete**. `App.css` mide 0 bytes y nadie la importa.

| Archivo | Líneas | Quién lo nombra | Tras borrarlo |
|---|---|---|---|
| `src/App.css` | 0 | Nadie | Nada |
| `src/components/SuitSymbol.jsx` | 105 | Nadie | Nada |
| `src/components/WelcomeScreen.jsx` | 116 | Solo comentarios; `diagDSK.mjs:1190` también, y su puerta `lob.1` mira el DOM | **`welcome.css` se queda:** la importa `Lobby.jsx:15` |
| `src/hooks/useReloj.js` | 80 | Solo comentarios | Nada |
| `src/screens/Entrada.jsx` | 43 | Solo comentarios | **`entrada.css` se queda:** la importa `Portada.jsx:3` |

Ninguno sale en `AJILEI_Invariantes_v1.0.md`, así que `testInvariantes` no debería protestar. Quedarán comentarios que los citan como historia (`ArcoEstrellas.jsx`, `creditos.js`, `embellecimiento.css`, `FormularioPuerta.jsx`). Tras el borrado de Victor: `vitest` + `eslint` + `build`.

### Grupo C · Servidor, permisos y CLI

| ID | Estado | Dónde (hoy) | 🔒 | Tam. | Riesgo | Necesita | Depende de | Sub-tanda |
|---|---|---|---|---|---|---|---|---|
| **C1 · CLI** | Sigue vivo | `package.json:33`. Ningún script del repo lo llama: se usa a mano | — | S | Bajo: 6 versiones menores en los comandos que se usan | Nada; `migration list` contra la línea base | Ningún worktree vivo | **4a**, primer commit, propio |
| **C2 · CFG-1** | Sigue vivo | Política en `0001_sup2a_identidad.sql:185`; columna en `20261030013000_cfg1b_perfil.sql:39`; cliente en `src/lib/perfilApi.js:16` | — | M | **Alto si falta una columna:** ningún jugador cargaría su perfil. Con vuelta atrás preparada | **SQL de Victor** y entrar con una cuenta real | Guion nuevo | **4c** |
| **C3 · CFG-1** | Sigue vivo | `20261030193000_cfg1e_mano_actual.sql:199` | — | S | Ninguno: 30 sigue siendo 30 | **SQL de Victor** | — | **4c**, con C4 |
| **C4 · TIE-1 1a** | Sigue vivo | `20261031150000_tie1a_inventario.sql:162` | — | S | Ninguno: 30 sigue siendo 30 | **SQL de Victor** | C3 | **4c**, con C3 |
| **C5 · CFG-1** | Sigue vivo; **no es de servidor** | `scripts/diagDSK.mjs:9340` (`u3Sembrar`) | — | S | Ninguno | Nada | A6 (la misma siembra) | **4b** |
| **C6 · O-4** | Sigue vivo; **no es de servidor** | `src/App.jsx:205`, `:600`; `src/dev/salasFixtures.js:83-93` | — | S | Solo desarrollo, y la guardia lo vigila | Nada | — | **4c** |

**C1 · Lo que usa el proyecto.** Ningún script de `package.json` ni de `scripts/` llama al CLI, y `npm run guiones` va por PGlite. **La ficha pedía comprobar `npm run guiones` tras la subida: esa vara no lo prueba.** Lo que vale es `migration list` contra la línea base del §2.3. Los comandos salen de informes y fichas:

| Comando | 2.116 → 2.122.1 | En v3 |
|---|---|---|
| `db push` | Los ajustes TLS `PGSSL*` llegan a `--linked` | **Va a la pila local por defecto.** Exige `--remote` o `--linked`, y `--yes` sin terminal. La guía avisa: si hay pila local, un `db push` pelado **dice que va bien y no toca el proyecto** |
| `migration list` | Sin cambios en las notas | Local por defecto; `--remote` |
| `functions deploy --use-api --no-verify-jwt` | **Arreglo:** ya sube importaciones dinámicas de varias líneas | Sigue yendo al proyecto enlazado, con confirmación o `--yes`. **`--use-api` sigue:** lo retirado es `functions download --legacy-bundle`. La guía no dice nada de `--no-verify-jwt` ni del empaquetador. **Crítico para nosotros, sin Docker ni Deno: hay que probarlo antes de pasar** |
| `functions list` | Sin cambios | La guía no lo menciona |
| `functions delete` | Sin cambios | Confirmación o `--yes` |
| `inspect db table-stats` · `index-stats` | 2.121 avisa de retiradas | Local por defecto; esos dos siguen |
| `db dump --schema-only` | TLS | Local por defecto |
| `link` | Sin cambios | Sin cambios según la guía; las notas marcan `--project-ref` como obsoleto en general |
| `login` | Sin cambios | La guía no lo menciona |
| `supabase/config.toml` | — | Sin `[inbucket]`, así que carga. Atención: las banderas y las variables `SUPABASE_*` pasan a mandar sobre el archivo |

2.122.1 es 2.122.0 con los nuevos canales de instalación. Revisé las notas de 2.117 a 2.122 por palabra clave, no línea a línea.

**Propuesta:**

- `npm install -D -E supabase@2.122.1`, **exacta**, y no la etiqueta `v2.stable`.
- Se hace **con cero worktrees**, porque comparten `node_modules`. Hoy hay cero: es el momento.
- Después, `migration list --linked` tiene que dar las 14 de la línea base.
- **La v3, después de MOT-1.** No se cambia de CLI en mitad de una cirugía con Edge Functions.
- **Desde ya, las fichas escriben `--linked`:** la guía confirma que `db push --linked --yes` vale en v2 y en v3. Así, el día del cambio nadie hace un `db push` que no llega a la nube.

**C2 · Propuesta de migración.** El cliente lee `id, username, pais, estado` (`perfilApi.js:16`) y nada más; solo `perfilApi` hace `from('profiles')`. Fechas: `mi_proximo_cambio()`. `profiles` no está en la publicación de Realtime y no hay vistas. Las RPC de la 1b que la leen son `security definer`, y corren con los permisos de su dueño; `mi_inventario`, la única `invoker` que encontré, no la toca.

```sql
revoke select on public.profiles from public, anon, authenticated;
grant  select (id, username, pais, estado) on public.profiles to authenticated;
-- vuelta atrás, escrita en el informe de la tanda:
-- grant select on public.profiles to authenticated;
```

Quedan fuera `nombre_cambiado_en`, `created_at` y `updated_at`. El `pais` y el `estado` de otros siguen legibles, y ya los da `mini_perfil`. Guion nuevo en `supabase/pruebas/`, registrado en `guionesCore`, con `has_column_privilege` en positivo y en negativo. **No he comprobado una por una que todas las RPC que tocan `profiles` sean `definer`:** lo hará `npm run guiones`, que corre con `set local role authenticated`. La prueba que cierra es Victor entrando con una cuenta real.

**C3 + C4 · Sí, en la misma migración.** Es una nueva, sin tocar las pasadas:

- `limite_dinero` gana `consultar_mano` y `comprar_articulo`, los dos en 30, conservando los 7 que tiene (última definición en `20261012230807_eco1g_video.sql:100`).
- `create or replace` del cuerpo **entero** de `consultar_mano` y `comprar_articulo`.

Y arrastra los espejos: `LIMITES_SQL` y `LIMITE_COMPRA_SQL` (`bancoImitado.js:57-65`, `:261`), su prueba (`bancoImitado.test.js:397-405`), y los espejos de `testConsultas` y `testTapetes`, que hoy leen el literal. Revisar también `scripts/eco/mesaia.mjs:648`, que recorre `LIMITES_SQL`. **C2 va en otra migración,** para poder deshacerla sola. Victor las aplica en un único `db push`.

**C5.** Lo que falla es que la banda «Tu mejor palo» se oculta si la mano acaba sin recuento del humano (`human.score` nulo), algo que depende del azar del bypass. Se arregla con la siembra de A6 o con `?apu=gana`, dentro de `u3Sembrar`. **No hay nada que hacer en Supabase;** por eso va a 4b.

**C6.** Sin `?sal=`, `simulacionSalas()` devuelve `null`, `api` cae en `salasApi` real, y el arranque llama a `mi_sala` con el cliente de verdad. El arnés ya no lo sufre: lo contesta desde ARN-3c, y `RETAR_RUIDO_CONOCIDO` ya está vacío. **Afecta solo al `npm run dev` de Victor.** Arreglo: `App.jsx:205` usa, bajo bypass, una API «sin mesa» servida desde `salasFixtures`. **Ojo:** no conviene que `simulacionSalas()` devuelva algo siempre, porque `App.jsx:227`, `:234` y `:242` distinguen por ella si hay simulación.

---

## 4. Fuera de ARN-4 y puntos nuevos

### Puntos nuevos (D·n)

| ID | Punto | Estado | Dónde | 🔒 | Tam. | Riesgo | Necesita | Depende de | Sub-tanda |
|---|---|---|---|---|---|---|---|---|---|
| **D-1** | **El arnés no pasa por eslint.** «eslint en cero» no cubrirá unas 27.000 líneas de `.mjs` | Vivo | `eslint.config.js:10` | — | S medirlo; quizá L arreglarlo | Ninguno | Nada | — | **4a** solo la medida |
| **D-2** | Archivos sueltos en la raíz, con seguimiento. `_diagShuffle.cjs`, `_measureDeck.cjs` y los tres `PUE_mes*_demo`: nada en `src/` ni `scripts/` los nombra. `PUE_lamina_v1.7.html` sí se cita en comentarios (`diagPUE`, `Portada.jsx`, `portada.css`), y **no la doy por muerta** | Vivo; sin clasificar | Raíz | — | S | Ninguno | **Los borra Victor** | — | **4c** |
| **D-3** | **Queda una unión viva hacia el `node_modules` real** en un scratchpad de una sesión anterior. Un borrado recursivo de esa carpeta alcanzaría el `node_modules` real | Vivo | `…\7a71b06a-c67c-4b03-b31e-9eb64a7abdb0\scratchpad\probe\node_modules` | — | S | **Alto si se borra mal** | Nada | A2 | **4a** |
| **D-4** | `supabase/functions/sonda_mot1/` está ignorada por git (`.gitignore:129`) y presente en disco. Queda para MOT-1 saber si sigue desplegada | Vivo | `.gitignore:129` | — | — | — | Rector | — | **MOT-1** |
| **D-5** | La receta «`vite build` antes de vitest» ha quedado vieja: la guardia compila sola | Vivo | Memoria y fichas; `testDistSinMoldes.test.js:92-106` | — | S | Ninguno | Nada | A3 | **4a** |

### Fuera de ARN-4

- **Campaña de peso del paquete.** `auth-js` ocupa unos 80 kB entre `GoTrueClient`, `webauthn` y `GoTrueAdminApi`; `storage-js` + `iceberg-js`, 27 kB, y el cliente no usa `.storage`; `paises.js`, 11 kB. Y `heptacoin` pesa 1,06 MB como imagen. Son bastante más que los 11 kB de B3c. **No lo he medido como ahorro real:** esas piezas vienen dentro de `@supabase/supabase-js`.
- **v3 del CLI:** decisión aparte, después de MOT-1.

---

## 5. Propuesta de reparto y orden

**Cambio frente a la hipótesis:** el Grupo A no cabe en una sola tanda razonable, y sus varas tienen que estar afiladas **antes** de limpiar, porque son las que prueban que la limpieza no cambió nada. Por eso A5 y A6 van a su propia tanda, y C2–C4 entran con la limpieza como cierre.

| Orden | Sub-tanda | Qué | Por qué en ese orden | Claude Code | Lo que no se comprime |
|---|---|---|---|---|---|
| 1 | **4a · Herramientas** | **C1 (commit propio, el primero)** · A1 · A3 + A2 · D-3 · A11 · D-5 · A4 · A7 · A8 (tabla) · D-1 (medida) | C1 hoy no choca con nada. A1 y A3 protegen todo lo demás. A4 mide lo que sigue | **~160 min** | Primera corrida `completo`: ~3 h de máquina, desatendida |
| 2 | **4b · Varas** | A6 · C5 · A5 · A9a · A10a | Sin ruido de azar ni de fotos, un rojo de la 4c significará algo | **~140 min** | Corridas de `apu`, 40–45 min. **Victor:** decide `.pue-cta-vacuna` con la cifra, ~5 min |
| 3 | **4c · Limpieza y servidor** | B1 (b) · B2 · B3b · B3d · B6 · B7 · B8 · C6 · y por último C2 + C3 + C4 · B9 y D-2 (Victor) | El servidor al final, en commits propios: es lo único con riesgo real, y lo más fácil de aislar | **~190 min** | **Victor:** pegar un código (B7), rebote en el teléfono (B6), `db push` + guiones + entrar con cuenta real (C2–C4), borrar a mano (B9, D-2): ~30 min |

**Total: unos 490 min de Claude Code, tirando por lo alto,** más unas 4 h de máquina y unos 35 min de Victor.

**Si hay que recortar, se aguanta bien sin:** A5 (aún no ha dado un rojo) y B6. **No recortaría:** C1, A1, A3 y B7.

### Lo grande o arriesgado, y lo que propongo sacar

| Punto | Motivo | A dónde |
|---|---|---|
| B4a, B4b | Grandes, visibles; iOS sin validar; las pantallas que MES-PvP rehará | **MES-PvP** |
| B3a | MOT-1 lleva ese cálculo al servidor | **MOT-1** |
| B3c | 1,6 % de ahorro a cambio de un «Cargando» visible | **Campaña de peso** |
| B1 (c), los efectos de la mesa | Riesgo justo antes de reabrirlos | **MOT-1** |
| B5, A9b, A10b | Ya no hay nada que hacer | **Cerrar** |
| A4 | Grande, pero es el corazón de la campaña | Se queda |
| C2 | Riesgo alto, tamaño pequeño, vuelta atrás escrita | Se queda |

### Lo que necesita lámina u ojos de Victor

- **Lámina:** nada de lo que se queda en ARN-4.
- **Ojos de Victor:** B6 (rebote en un teléfono), B7 (pegar un código real), A10a (decidir con la cifra), C2 (entrar con cuenta real).

### Lo que necesita SQL de Victor

Solo en **4c:** una migración para C2 y otra para C3 + C4, aplicadas en un único `db push --linked`, y sus guiones en la base real.

---

## 6. Preguntas para Victor y el rector

| # | Pregunta | Recomendación |
|---|---|---|
| **P-1** | ¿Subimos el CLI a **2.122.1** exacta como primer commit de 4a, y dejamos la v3 para después de MOT-1? | **Sí.** Hoy no hay worktrees, y v3 cambia `db push` |
| **P-2** | ¿Las fichas escriben desde ya `db push --linked` y `migration list --linked`? | **Sí.** Vale en v2 y en v3, y evita el `db push` que no llega a la nube |
| **P-3** | ¿Aceptan el reparto 4a → 4b → 4c, con las varas antes de limpiar? | **Sí** |
| **P-4** | **B1:** ¿(a) silenciar todo, (b) arreglar lo mecánico y silenciar los 7 de la mesa con su motivo, o (c) refactorizar todo? | **(b).** Cero en eslint sin tocar reparto ni reloj antes de MOT-1 |
| **P-5** | ¿Se llevan B4a y B4b a MES-PvP? | **Sí** |
| **P-6** | ¿B3a a MOT-1 y B3c a una campaña de peso? | **Sí a los dos** |
| **P-7** | ¿Se cierran B5, A9b y A10b sin cambios? | **Sí.** B5 con nota para MES-PvP |
| **P-8** | **A1:** ¿`vite.config.js` sale con código 2 bajo vitest cuando la unidad va en minúscula? | **Sí.** Cambia un falso «88 failed» por una frase clara |
| **P-9** | **D-1:** ¿el `.mjs` del arnés entra en eslint? | **Medirlo en 4a y decidir con la cifra.** No lo metería en el objetivo «cero» de esta campaña |
| **P-10** | **A11:** ¿el guion copia los 75 volcados, para que un worktree dé 0 omitidas? | **Sí:** son 2,77 MB y prueba lo mismo que el árbol principal |
| **P-11** | **B7** es un fallo real en producción. ¿Se adelanta como tanda de un solo commit, sin esperar a la 4c? | **Sí.** Es una línea y una puerta, y lo sufre cualquier jugador que pegue el código |
| **P-12** | **C2:** ¿`pais` y `estado` siguen legibles por lectura directa? | **Sí:** `mini_perfil` ya los da. Si Victor prefiere cerrarlos, habría que revisar quién más los lee |

---

## 7. Tiempo real de la sonda

**Unos 20 minutos:** de las 04:49:51 a las ~05:10, incluida la redacción.
