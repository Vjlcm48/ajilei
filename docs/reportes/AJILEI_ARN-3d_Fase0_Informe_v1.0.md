# AJILEI · ARN-3d · Producto: la mesa ligera y los sonidos a tiempo · Fase 0 · Informe v1.0

**Fecha:** 2026-10-02, de 09:23 a 10:02 (tope 60 min).
**Punto de partida:** `main` en `5cc97e7` (ARN-3c-4). Árbol con los 5 residuos conocidos.
**Tipo:** Fase 0, solo lectura. En el repo solo se escribió este informe.
**Dónde se midió:** cinco copias `git archive HEAD` en el scratchpad (`base`, `lazyP`, `lazyP2`, `lazyP3`, `lazy0`, `lazy0T`), cada una con su `.env.local` y una unión a `node_modules`. Servidores propios dentro del proceso: preview en 4183/4184/4190–4201 y dev con bypass en 5181/5182. El 4173 no se tocó.
**Protegidos:** ninguno abierto. De `gameEngine.js` y `gameTable.css` solo se leyeron líneas con `grep`/`sed` para citarlas.
**Navegador:** Chromium 151.0.7922.34 de `playwright-core` 1.62.1 (`navegadorArnes`).

---

## Resumen

| Pregunta | Respuesta |
|---|---|
| ¿Sigue vigente el diagnóstico de ARN-3? | **Sí, las cuatro piezas siguen igual**, solo con las líneas movidas. El modal de bancarrota sigue muerto, `inert: ''` sigue en `Lobby.jsx:280` y `.lob-cta-pvp` sigue sin consumidor |
| `1.8b` hoy | **222,0 KiB, rojo**: idéntico a ARN-3 |
| `1.8b` con `GameTable` diferida | **168,8 KiB, verde** con la precarga bien puesta. Chunk de la mesa: 36,3 KiB de JS + 18,5 de CSS en el cable |
| ¿Dónde va la precarga? | **En `Lobby.jsx`, no en `App`.** En `App`, `screen` vale `'lobby'` **también mientras se ve la Portada**. Una precarga colgada de `screen === 'lobby'` se dispara en la Portada a los 167 ms, antes del FCP: medido, **223,7 KiB, rojo** |
| ¿Parpadea la entrada a la mesa? | **Con un `Suspense` local, sí, aunque el chunk ya esté descargado:** 322–334 ms de `#root` vacío. React estrangula 300 ms la salida de un `fallback`. **Arreglo medido:** `Suspense` en la raíz, `startTransition` al ir a la mesa y un *thenable* síncrono cuando el módulo ya está en memoria. Resultado: **28–31 ms del toque a la mesa pintada (hoy 21–23) y 0 ms en blanco** |
| ¿Cambia el aspecto de la mesa? | **No:** 147–152 elementos por vista en 3 vistas, todos con el mismo estilo computado, la misma caja y el mismo texto. La única diferencia es el puerto dentro de una URL |
| `tableKnock` | **Ya se precarga desde LOB-1** (`Lobby.jsx:94`, `SONIDOS_LOBBY`), y la celebración usa ese mismo `Howl`. El `encadenado` honesto sale rojo con `/sounds/` estrangulado solo porque la sonda llega a la victoria ~0,4 s después de cargar la página. Con una pausa humana de 3 s en el lobby sale **verde, incluso con 2,5 s de retraso**. **Una precarga nueva no tiene nada que arreglar: pregunta 1** |
| Margen del `encadenado` | Verde: `espera` = 2 146 ms (1 896 + 250). Nominal: 1 896. **La separación es de 250 ms, no de 1**: la deducción por igualdad es segura con el archivo de hoy |
| Roce de `vc` | **Las dos cosas.** El arnés lee `sonando` en el instante en que aparece la capa, que es el mismo en que la celebración llama a `play('chipsCollect')`: es instrumento. En la **primera** celebración de la página ese `Howl` nace en ese `play` (`estado: 'loading'`), porque en el camino de IA nadie lo precarga: es producto. En local suena antes de 50 ms; en la segunda celebración ya está `loaded`. Con red real, la primera vez llegaría tarde. La medida con red estrangulada **queda pendiente**: 20 manos sin una victoria |
| Δ de `.pbr-chips` | **Es la cifra retenida.** `saldoMostrado` (`GameTable.jsx:930`) le resta el pozo al ganador mientras vuela la celebración. El toque la corta, la cifra salta al saldo real y, si gana un dígito, la caja cambia 10,19 px. Arreglo de instrumento: igualar el texto en la segunda toma |
| PWA | **No hay *service worker*.** El riesgo real es un despliegue a mitad de sesión. `wrangler.jsonc` sirve un chunk que ya no existe como `index.html` con 200 (`not_found_handling: "single-page-application"`) |

---

## §A · El diagnóstico de ARN-3 contra el `main` de hoy

### A1 · B6 · El modal de bancarrota muerto: **sigue igual**

**Qué dijo ARN-3** (§B6): se abre solo si `startHand` devuelve `GAME_OVER`, el humano está eliminado **y** `aliveCount ≥ 2` (`GameTable.jsx:1630`). El motor solo devuelve `GAME_OVER` con `alive <= 1` (`gameEngine.js:521`), así que las condiciones son incompatibles y el modal es código muerto.

**Hoy (`5cc97e7`):**
- **El motor** (protegido, leído con `grep`/`sed`, sin abrirlo): el único `GAME_OVER` de `startHand` está dentro de `if (alive <= 1)` (`gameEngine.js:522`), y ese retorno lleva `aliveCount: alive` (`:526`). Solo cambia el número de línea, de 521 a 522.
- **La guarda que lo abre:** `GameTable.jsx:1630`, sin cambios: `if (next.players[0].eliminated && next.aliveCount >= 2) setBankruptModal(true)`.
- **La prueba que lo sella:** `scripts/testEliminations.test.js:198-205` (humano quebrado con ≥ 2 vivos → `DEAL_2`, no `GAME_OVER`).

**Dónde vive todo:**

| Pieza | Sitio | Qué es |
|---|---|---|
| Estado | `GameTable.jsx:370` | `const [bankruptModal, setBankruptModal] = useState(false)` |
| Guarda | `GameTable.jsx:1622-1623` (comentario) y `:1630` | La rama que lo abre. Queda `setGame(next)` sin condición |
| Condición del botón | `GameTable.jsx:2430-2431` (comentario) y `:2436` | `!bankruptModal &&` dentro de la guarda de «Siguiente mano» |
| JSX | `GameTable.jsx:2841-2863` | Comentario C4.5 «Caso B» y el bloque `{bankruptModal && (…)}` |
| Efectos | — | **Ninguno.** No hay efecto propio: solo la guarda de `beginHand` |
| Sonido | `SoundButton` «Volver al lobby» → `buttonClick` | Compartido con media app: **no se borra nada de audio** |
| Textos | Literales en el JSX | No están en el diccionario (`textos`): nada que borrar allí |
| CSS de la caja | `gameTable.css:719-778` (`.bankrupt-overlay`, `-modal`, `-title`, `-sub`, `-actions`, `bankruptFade`, `bankruptRise`) | **Vivo:** la tarjeta de recarga lo hereda (`GameTable.jsx:2733-2775`, `apu.css:72-343`). **No se toca** |
| CSS de los «Próximamente» | `gameTable.css:780-806` (`.btn-soon`, `.soon-tag`) y `welcome.css:136-…` (`.soon-tag`, «Kept for ModeSelect») | **Muere con el modal:** son sus únicos consumidores en JSX. `ModeSelect` ya no existe (solo aparece en comentarios). `gameTable.css` es **protegido** → **pregunta 2** |

**Dos comentarios que lo nombran como historia y deben quedarse:** `GameTable.jsx:1112` («Releva al modal de bancarrota…») y `:1155` («la MISMA puerta que la ✕ de la cabecera y que el modal de bancarrota»). Cuentan de dónde viene la recarga. En la Fase 1 se reescribe `:1155` en pasado, para que no hable de una puerta que ya no existe.

**Qué se borraría exactamente** (archivo no protegido, invisible para el jugador, D8):
1. `:370`, la línea del estado;
2. en `beginHand`, la rama `if (…) setBankruptModal(true) else`, que deja `setGame(next)`, y la última frase del comentario de `:1622-1623`;
3. `!bankruptModal && ` en `:2436`, y «o el modal de bancarrota» en el comentario de `:2430`;
4. `:2841-2863`, el bloque JSX con su comentario.

**Protegidos:** nada del borrado está en uno. Lo único que queda colgando en un protegido son `.btn-soon` y `.soon-tag` de `gameTable.css` (pregunta 2).

### A2 · B9 · El aviso `inert`: **sigue igual**

- **Texto exacto** (consola, `error`, solo en DEV), sin cambios desde ARN-3 §B9:
  > Received an empty string for a boolean attribute `inert`. This will treat the attribute as if it were false. Either pass `false` to silence this warning, or pass `true` if you used an empty string in earlier versions of React to indicate this attribute is true.
- **Quién lo produce:** `src/screens/Lobby.jsx:280`, en la hoja ⚙ (`aside.lob-hoja`): `{...(hojaAbierta ? {} : { inert: '', 'aria-hidden': 'true' })}`. Nació en LOB-1c (`716d84d`), según `git log -S`.
- **React instalado:** `react` y `react-dom` **19.2.6**. Vite 8.0.14.
- **Arreglo:** `inert: true`. `Lobby.jsx` **no es protegido**. No cambia nada visible. Durante los 0,2 s de la transición de cierre, la hoja pasa a ser inerte al instante, que es lo correcto.
- **Filtros del arnés que lo esconden hoy:**
  - `RETAR_RUIDO_CONOCIDO = [/boolean attribute/]` (`diagDSK.mjs:1255-1257`), usado en `runRetar` (`:1305`), modos `retar` y `all`;
  - `APU_RUIDO_CONOCIDO = RETAR_RUIDO_CONOCIDO` (`:1640`), usado en `runRec2` (`:2522`) y `runApu` (`:2573`), modos `apu` y `all`;
  - ningún otro colector filtra (`diagSAL.mjs:163-166`, `capMesa.mjs:170-171`, `bieRed.mjs:143-144`, `diagPUE.mjs:230/295/1268`). Los de 4173 no lo verían de todos modos: es un aviso de desarrollo.
- **Cuando se arregle:** `RETAR_RUIDO_CONOCIDO = []` (el alias lo hereda). **Control:** en la copia, volver a poner `inert: ''` → `retar` sale **rojo** con «boolean attribute» en `consola`, en las 6 celdas.

### A3 · B10 · `.lob-cta-pvp`: **sigue igual**

- `grep -rn lob-cta-pvp src/ scripts/ index.html`: **solo `src/styles/lobby.css`**. Cero consumidores en JSX y en JS.
- **3 reglas más el comentario de AJF-1**, todas en `lobby.css`:
  - comentario `:502-505`;
  - `.lobby .lob-cta-pvp` `:506-518`;
  - `.lobby .lob-cta-pvp .lob-ico` `:521-525` (con su comentario `:519-520`);
  - `.lobby .lob-cta-pvp .lob-pastilla` `:535`.
- **Se queda la base `.lobby .lob-pastilla` (`:526-534`)**, que sigue viva en la hoja ⚙ y en el toast. El encabezado de sección `:501` («EL ACCESO QUE TODAVÍA NO EXISTE») se queda vacío: se quita con las reglas.
- **`lobby.css` no es protegido.**

### A4 · El comentario de `salta` (H3c-ii-5)

**Hoy** (`GameTable.jsx:1012-1015`):
```
  // ── Saltar en silencio a un jugador activo RETIRADO (C4.4.1) ──────────────
  // Puede ocurrir al iniciar BET_2/BET_3 si la Mano se retiró en una ronda
  // previa (el motor reinicia activePlayerIndex = manoIndex). Sin "pensando" ni
  // retardo: se avanza el turno de inmediato vía la API del motor (sin tocarlo).
```

**Propuesta** (solo el comentario; el código de `:1024-1038` no se toca):
```
  // ── Saltar en silencio a un jugador activo RETIRADO (C4.4.1) ──────────────
  // Nació para cuando BET_2/BET_3 abrían en la Mano retirada en una ronda
  // previa. HOY NO SE ALCANZA: el motor abre la ronda en la siguiente silla
  // viva, nunca en la retirada (medido a la vista, 3 de 3, en ARN-3c §11.1.2;
  // por eso la celda `retirado` del modo `congelado` sale «no alcanzable»).
  // La guarda se MANTIENE como defensa: si el motor volviera a dar el turno a
  // un retirado, se avanza de inmediato vía su API (sin tocarlo), sin
  // "pensando" ni retardo, en vez de dejar la mesa esperando a quien no juega.
```
El bloque FRZ-1 §2.3 (`:1017-1023`) sigue valiendo tal cual.

---

## §B · La carga diferida de la mesa (`1.8b`)

### B1 · Medida de hoy

`node scripts/diagPUE.mjs 1.8 --puerto=4183` en la copia `base`:

| Recurso | KiB de cable | KiB en crudo |
|---|---|---|
| documento `/` | 2,1 | 5,2 |
| `index-*.js` (un solo chunk) | **181,3** | 626,3 |
| `index-*.css` (una sola hoja) | **34,0** | 201,1 |
| icono maestro SVG | 1,1 | 4,1 |
| isotipo SVG | 1,5 | 4,0 |
| reverso SVG | 2,0 | 6,8 |
| **Total** | **222,0 · ROJO** (FCP 260 ms, 7 recursos) | 847,5 |

Es la misma cifra que ARN-3 al décimo. 1.8a, 1.8c, 1.8d y 1.8e, en verde.

### B2 · El experimento en las copias

En cada variante, `diagPUE 1.8` compila y mide su propio `dist/`:

| Variante | Qué hace | `1.8b` |
|---|---|---|
| `base` | Hoy | **222,0 · rojo** |
| `lazyP` | `lazy(GameTable)`; precarga con `requestIdleCallback` en un efecto de `App` con `screen === 'lobby'` | **223,7 · rojo.** La Portada pide `GameTable-*.js` y `GameTable-*.css` a los 167 ms, antes del FCP (256 ms) |
| `lazy0` | `lazy(GameTable)` sin precarga | **168,8 · verde** |
| `lazy0T` | `lazy0` + `Suspense` en la raíz + `startTransition` | **168,8 · verde** |
| `lazyP2` | `lazy` + precarga en el **efecto de montaje de `Lobby.jsx`** (ocioso) | **168,7 · verde**: el chunk no aparece en la bitácora de la Portada |
| **`lazyP3`** (la propuesta) | `lazyP2` + `Suspense` en la raíz + `startTransition` + *thenable* síncrono | **168,8 · verde** |

**Chunk de la mesa** (`lazyP`, gzip 9): `GameTable-*.js`, 114,1 KiB en crudo y **36,3 en el cable**; `GameTable-*.css`, 115,0 en crudo y **18,5 en el cable**. El principal baja a 145,9 + 16,2 KiB.

**Por qué falló `lazyP` (hallazgo H3d-1).** `App` tiene `screen` en `'lobby'` desde que nace (`App.jsx:149-158`), y la Portada **no es un `screen`**: es la rama `SIN_SESION` de la cascada de autenticación. Por eso el efecto de precarga de hoy lleva `'lobby'` en `SIN_PRECARGA` (`App.jsx:89`). `requestIdleCallback` tampoco espera al primer pintado: llegó a los 167 ms, con el FCP a los 256. **La precarga tiene que colgar de algo que solo exista con sesión: el montaje de `Lobby`.**

### B3 · La precarga: cuándo y cómo

**Cuándo: al montar el lobby, en un momento ocioso** (`useEffect(() => { precargarMesa() }, [])` en `Lobby.jsx`, junto al de `SONIDOS_LOBBY`, `:94`). Además, el efecto de `App.jsx:335-341` (Retar y mesa) la vuelve a pedir, porque `import()` es idempotente: si el lobby no llegó a pedirla, Retar la pide.

Las tres condiciones de la ficha:

| Condición | Cómo queda |
|---|---|
| La Portada no paga la mesa antes de su primera pintura | `Lobby` no se monta en la Portada. **Medido: `1.8b` 168,7, y el chunk no aparece en la bitácora** |
| PvP o enlace `?sala=` | **Hoy ninguno de los dos llega a `GameTable`.** La única entrada es `screen === 'table'` (`App.jsx:497`), y solo la pone `RetarIAS` (`:531`). `partida-pvp` es el *stub* `PartidaPvP`, que no importa la mesa. `?sala=` aterriza en `sala-opciones` (`:157`) sin pasar por el lobby. Cuando MES-PvP monte la mesa, la precarga va también en el montaje de `SalaEspera` (donde ya se piden `SONIDOS_SALAS`, `SalaEspera.jsx:149`) |
| Reanudación por `mi_sala()` | Hoy lleva a `sala-espera` (`App.jsx:221`), no a la mesa. Mismo remedio que PvP cuando haga falta. **Si por cualquier camino se llega a la mesa sin precarga, el `startTransition` cubre la espera sin parpadeo** (§B4) |

**Cómo: `import()` adelantado, no `<link rel="modulepreload">`.**
- `import()` pasa por el `__vitePreload` de Vite, que trae **también la hoja CSS** del chunk y la inserta antes de resolver.
- `modulepreload` solo trae el JS, y habría que escribir en `index.html` un nombre con hash que cambia en cada compilación.
- Un único módulo, `src/lib/cargarMesa.js`, con `cargarMesa`, `fabricaMesa` y `precargarMesa`: así `App` y `Lobby` piden el mismo especificador.

### B4 · Tiempo de entrada a la mesa, en frío

**Sonda** `_sondaEntrada.mjs`, en la copia:
- `contextoCap` (sesión simulada) en preview a 1366×768, con un contexto nuevo por corrida (caché vacía);
- red estrangulada por CDP, `Network.emulateNetworkConditions`, perfil «4G lento» de DevTools: `latency: 562.5`, `downloadThroughput: 180000` B/s, `uploadThroughput: 84375` B/s;
- se mide desde el `pointerdown` en «Jugar» (`[data-accion="cta"]`) hasta dos `requestAnimationFrame` después de que `.game-table` entra en el DOM;
- un `MutationObserver` registra cada intervalo con `#root` vacío;
- 3 repeticiones por celda.

**A = con la precarga ya terminada** (se espera a que llegue el chunk, o a `networkidle` en `base`, y 500 ms más). **B = entrada inmediata** (la ruta del arnés: del lobby al CTA en ~150 ms).

| Variante | Escenario | Toque → mesa pintada (ms) | `#root` vacío (ms) | ¿Chunk listo al tocar? |
|---|---|---|---|---|
| `base` | A | 22 · 23 · 23 | — | (no hay chunk) |
| `base` | B | 22 · 23 · 23 | — | — |
| `lazyP2` (`Suspense` local) | A | **334 · 325 · 330** | **330 · 322 · 327** | sí |
| `lazyP2` | B | 995 · 985 · 950 | **991 · 981 · 946** | no |
| `lazy0` (sin precarga) | B | 3 254 · 3 247 · 3 259 | **3 249 · 3 243 · 3 254** | no |
| `lazy0T` (sin precarga, transición) | B | 3 262 · 3 281 · 3 258 | **0** | no |
| **`lazyP3`** | **A** | **30 · 31 · 30** | **0** | sí |
| **`lazyP3`** | **B** | **999 · 988 · 955** | **0** | no |

**Lectura:**
- **Hallazgo H3d-2.** Con un `Suspense` local, `React.lazy` suspende siempre en su primer render, **aunque el módulo ya esté en memoria**. React no revela el contenido hasta que pasan 300 ms desde que pintó el `fallback`. De ahí los ~330 ms en blanco de `lazyP2` A, que serían un parpadeo para el jugador (D1).
- **`lazyP3` lo resuelve con dos piezas:**
  - **un *thenable* síncrono:** cuando el módulo ya llegó, `fabricaMesa` devuelve `{ then: (ok) => ok(modulo) }`, `React.lazy` lo da por resuelto en el acto y no suspende;
  - **`startTransition` con `Suspense` en la raíz:** si aún no llegó, React deja la pantalla de Retar puesta hasta que la mesa está lista, en vez de pintar el `fallback`.
- **Coste de `lazyP3` con la precarga hecha:** +7 a +8 ms sobre `base` (30 frente a 23), sin un solo fotograma vacío.
- **Entrada inmediata con 4G lento:** ~1 s con la pantalla de Retar quieta tras el toque. El chunk compite con la baraja (0,57 MB) y los sonidos de mesa (~380 KiB), que se piden al entrar en Retar. Un humano tarda varios segundos en elegir las cuatro filas, así que en la práctica entra en el caso A.
- **Sin precarga, la transición sola** (`lazy0T`) evita el blanco, pero deja Retar quieta 3,3 s: la precarga sí hace falta.
- Ninguna corrida dio errores de consola (salvo el aviso `inert`, que la sonda filtró).

### B5 · El `fallback` de `Suspense`

- **Qué se vería:** con la propuesta, nada, salvo en una suspensión **fuera** de una transición. Hoy no existe ninguna: la única pantalla diferida entra por `startTransition`.
- **Para que no haya parpadeo** se combinan las tres piezas de §B4: el *thenable* síncrono, `startTransition` en `onRetar` (`App.jsx:525-532`, envolviendo `setSaldoSesion`, `setMesa` y `setScreen`) y un **único** `Suspense` por encima del cambio de pantalla.
  - Un `Suspense` nuevo, montado dentro de la transición, **sí** pintaría su `fallback`. React solo retiene la pantalla anterior si el límite ya estaba a la vista.
- **¿Sirve el «Cargando» de BIE-1?** Sí, como red, con su regla D5: `fallback={<Cargando/>}` dentro de un componente que no pinte nada hasta los 300 ms (`useEsperaVisible`). Así no hay dos esperas distintas en la app. Por la transición, no debería verse nunca.
  - Ojo: `diagPUE bie` cuenta `.cargando` (`bieRed.mjs:194-228`). `bie` no llega a la mesa, así que no le afecta, pero el `fallback` no debe montarse en la puerta.

### B6 · La PWA y el *service worker*

- **No hay *service worker* ni plugin de PWA.** `vite.config.js` solo lleva `react()`, y no aparece `serviceWorker`, `registerSW` ni `workbox` en `src/` ni en `index.html`. Hay `manifest.webmanifest` con `display: standalone`. **No hay precacheo que generar ni manifiesto de precacheo donde entre el chunk.**
- **El usuario con la versión vieja «instalada»** no tiene nada en caché que la PWA controle:
  - cada arranque pide `index.html` a la red, porque `_headers` no le pone `immutable`;
  - **sin red, hoy la app no arranca, ni antes ni después de este cambio.**
- **El momento nuevo de riesgo: un despliegue a mitad de sesión.**
  - La pestaña abierta tiene el `index-*.js` viejo, que apunta a `GameTable-<hash viejo>.js`.
  - Si el jugador entra a la mesa **después** del despliegue y el chunk viejo ya no está en el servidor, `wrangler.jsonc` (`assets.not_found_handling: "single-page-application"`) devuelve **`index.html` con 200**. El `import()` falla por tipo MIME (hallazgo H3d-3).
  - La precarga del lobby **acorta mucho esa ventana**: el chunk se pide en el primer segundo del lobby, no al tocar «Jugar».
  - Lo que queda es una sesión que se abre antes del despliegue y no ha pasado por el lobby, o que se quedó sin red justo en ese segundo.
- **Mitigación propuesta (pregunta 3):** en `main.jsx`, un escuchador de `vite:preloadError` que recargue la página **una sola vez** (guarda en `sessionStorage`).
  - No hay estado que perder: el saldo de la sesión se lee de la base al volver.
  - Sin ese escuchador, el `lazy` rechazado haría caer el árbol y la pantalla se quedaría en blanco.

### B7 · El arnés

**Quién entra a la mesa** (inventario completo en la tabla; ninguno lo hace por `App` sin pasar por la ruta):

| Entrada | Dónde | Servidor | Cómo espera la mesa |
|---|---|---|---|
| `recorrerRuta` / `irALaMesa` | `scripts/rutaMesa.mjs:47-94` | cualquiera | `waitForSelector('.game-table')` en `:72` |
| `gotoMesa` y ~40 llamadas: d1d2, d3, bug, shots, gate, tactil, p1, p2, r1, r2, o1, h1, m1, a1, f1, z1, o2, a2, u1, menu-movil, u2, u3, vc, tapetes, vuelo, congelado | `diagDSK.mjs:496-501` | 5173 | `recorrerRuta` |
| `?apu=` (apu, rec2, recargas, all-in) | `diagDSK.mjs:1817…2876` | 5173 | `recorrerRuta` |
| `rec`, `luz`, `rev` | `diagDSK.mjs:13352`, `12270`, `12668`, `12867` | 5173 / 5174 | `recorrerRuta` / `irALaMesa` |
| `msg` (`contextoCap`) | `diagDSK.mjs:10516-10519` | **4173** | `recorrerRuta` |
| `?cel` / `?cel=<n>` (`alaVictoria`, `controlNegativo`) | `diagCEL0.mjs:156-200`, `1835-1845` | 5173 | `recorrerRuta` |
| `pasadaCap` (`cap`), `abrirCeldaEnPago` (`voz2`) | `cap/capMesa.mjs:217-224`, `voz2/voz2Mesa.mjs:134-140` | **4173** | `recorrerRuta` |
| `abrirCeldaConBurbuja` (`voz2.burbuja`) | `voz2Mesa.mjs:542-547` | 5173 | `recorrerRuta` |
| `?sal=` (`diagSAL`), `lob`, `retar`, `bie` | — | — | **No entran a la mesa** |

- **¿Quién podría leer la mesa antes de que llegue el chunk?** **Nadie hoy**: todas las lecturas inmediatas (`runD1D2` `:590-624`, `vcInstall`, `msgSiembraAzar`, `ESTADO_REC`) van detrás de `rutaMesa.mjs:72`.
- **Por qué basta `.game-table`:** con `startTransition`, el DOM de la mesa solo se confirma cuando el módulo ya está evaluado, y Vite inserta la hoja del chunk **antes** de resolver el `import()`. Que exista `.game-table` implica que ya hay CSS. Lo confirma la comparación de estilos de §B8: 0 diferencias en la primera foto tras `recorrerRuta`.
- En 5173 (dev) el `lazy` es un módulo más; los 4173 son `msg`, `cap` y `voz2`.
- **El azar sembrado** (`msg`/`cap` cuentan tiradas de `Math.random`): la comparación de §B8 usó `contextoCap` con su semilla y dio los **mismos textos** en las 3 vistas. Cargar el chunk antes, en el lobby, no consume tiradas.
- **La espera común:**
  - un solo `esperarMesa(page)` exportado desde `scripts/rutaMesa.mjs`, que ya es el terreno común de la ruta: hoy `:72` hace `waitForSelector('.game-table')`;
  - lo llaman `recorrerRuta` y los dos sitios que hoy repiten la espera a su manera: el `waitForSelector('.game-table')` redundante de `u1` (`diagDSK.mjs:6966`) y el `waitForTimeout(3500)` de `controlNegativo` (`diagCEL0.mjs:1835-1845`);
  - sin `sleep`. Con `startTransition` basta el selector; si algún día hubiera un `fallback` visible, `esperarMesa` añade «y no hay `.cargando`».
  - **Vara:** en una copia, retrasar 2 s `**/GameTable-*` en 4173 y correr `msg` y `cap`: deben seguir verdes.
  - **Control:** quitar la espera y repetir: deben salir rojos (mesa nula).

### B8 · D1: el aspecto de la mesa no cambia

Sonda `_sondaCascada.mjs`:
- `base` frente a `lazyP3`, en preview, con `contextoCap` (semilla 5);
- `recorrerRuta(5, 'basico', 0)`, `mesaQuieta` y 400 ms;
- `getComputedStyle` completo (sin `animation*`/`transition*`) más `getBoundingClientRect` y texto de cada elemento de `#root`.

| Vista | Elementos | Estilo distinto | Caja distinta | Texto distinto |
|---|---|---|---|---|
| 1366×768 | 152 / 152 | 5 → **0** | 0 | 0 |
| 412×915 (móvil) | 147 / 147 | 5 → **0** | 0 | 0 |
| 915×412 (móvil) | 148 / 148 | 5 → **0** | 0 | 0 |

Los 5 de cada vista son `background-image` de `.deck-pile` con la URL `http://localhost:4200/…` frente a `:4201/…`: el mismo archivo con el mismo hash, servido desde otro puerto. **Diferencia real: 0.**

- **El riesgo que se miró:** el CSS de la mesa pasa a ir en su propio `<link>`, **después** de las hojas de `Portada` y de cualquier pantalla importada detrás de `GameTable` en `App.jsx:18-19`. Las hojas globales de `main.jsx` (`embellecimiento`, `tapetes`, `menuMovil`) ya iban antes y siguen antes.
- **Alcance:** es una foto en reposo de la primera mano. Las pantallas de celebración y de fin de mesa, que viajan en el mismo chunk, se cubren en la Fase 1 con `cel`, `vc`, `gate` y `rev`.

---

## §C · Los sonidos a tiempo

### C1 · El mapa de la precarga

| Lista | Dónde se pide | Sonidos |
|---|---|---|
| `SONIDOS_PORTADA` (`useSounds.js:62`) | `Portada.jsx:259`, a 1 s del montaje | `buttonClick` (el desbloqueo de Howler en iOS) |
| `SONIDOS_LOBBY` (`:88`) | `Lobby.jsx:94`, al montar | **`tableKnock`** |
| `SONIDOS_MESA` (`:69-72`) | `App.jsx:337`, en cualquier `screen` fuera de `SIN_PRECARGA` (Retar y mesa) | `cardDeal`, `coinBet`, `cardFold`, `cardShuffle`, `timerWarning`, `showdown`, `comodin`, `buttonClick` |
| `SONIDOS_SALAS` (`:120`) | `SalaEspera.jsx:149` | `chipsCollect`, `cardShuffle`, `tableKnock` |
| **Primer `play`** | `obtener()` construye el `Howl` en la primera llamada | **`chipsCollect`** (en el camino de IA nadie lo precarga), **`ajileiStrum`** |
| Melodías de celebración | `useCoreografia.js:184`, `new Howl` propio al montar la pantalla de victoria | `celebracion-*-01.{ogg,mp3}` |

**Pesos** (`public/sounds/`, en bytes):

| Sonido | Bytes | Sonido | Bytes |
|---|---|---|---|
| `button-click` | 16 896 | `showdown` | 66 816 |
| `coin-bet` | 7 680 | `comodin` | 65 201 |
| `card-deal` | 30 929 | `timer-warning` | 21 504 |
| `card-fold` | 39 288 | `chips-collect` | 30 929 |
| `card-shuffle` | 104 160 | `table-knock` | 37 920 |
| `ajilei-strum` | 117 028 | melodías `.mp3` | 386 238 c/u (7) |
| | | melodías `.ogg` | 215 770 – 246 533 (7) |

`SONIDOS_MESA` suma 352 494 B (344 KiB).

### C2 · La vara de `tableKnock`

**Hallazgo de partida (H3d-4).** `tableKnock` **ya se precarga** al montar el lobby desde LOB-1 (`Lobby.jsx:94`, para el golpe del CTA).
- La celebración de fin de partida lo toca con ese mismo `Howl` (`GameTable.jsx:961`, `play('tableKnock')`).
- Si al llegar a `GAME_OVER` el archivo no ha cargado, Howler **encola** el `play` y devuelve un `id`, pero `playing(id)` es falso. Entonces `esperaPrecedente` da 0 (`celebracionCore.js:124`) y `esperaRevienta` cae al nominal: el `encadenado` honesto sale rojo.
- **Así que el rojo solo aparece si el archivo tarda más que todo el camino del lobby a la victoria.**

**Sonda** `_sondaSonidos.mjs toc`, dev con bypass en 5181:
- `page.route('**/sounds/**')` retrasa D ms y luego `fallback()`: solo el audio;
- `?cel`, `recorrerRuta(5, 'basico', 0, 'piso')`, «Iniciar mano»;
- se leen la marca `ancla` de `__AJILEI_ARCO`, el `responseEnd` de `table-knock.mp3`, `Howl.duration()` y, con un envoltorio de `Howl.prototype.play`, el estado del `Howl` al tocar y si suena en los 300 ms siguientes.

| D | Entrada | Del `goto` a la victoria | `ancla.espera` | Estado del `Howl` al tocar | ¿Suena? | Honesto |
|---|---|---|---|---|---|---|
| 0 | `load` | 765 ms | 2 146 | `loaded` | sí | **verde** |
| 800 («4G lento» para 38 KB) | `load` | 423 ms | **1 896** | `loading` | no | **ROJO** |
| 3 000 | `load` | 418 ms | **1 896** | `loading` | no | **ROJO** |
| 10 000 | `load` | 409 ms | **1 896** | `loading` | no | **ROJO** |
| 30 000 | `load` | 411 ms | **1 896** | `loading` | no | **ROJO** |
| 3 000 | **`networkidle`** (lo que usa `alaVictoria`) | 3 936 ms | 2 146 | `loaded` | sí | verde (**enmascarado**) |
| 800 | `load` + **3 s en el lobby** | 3 678 ms | 2 146 | `loaded` | sí | **verde** |
| 800 | `load` + 3 s en el lobby | 3 447 ms | 2 146 | `loaded` | sí | **verde** |
| 2 500 | `load` + 3 s en el lobby | 3 468 ms | 2 146 | `loaded` | sí | **verde** |

**Lectura:**
- **Sí sale rojo estrangulando**, pero por la velocidad del arnés: llega a la victoria **~0,4 s** después de cargar la página, porque `?cel` mata la mesa en la primera mano y la ruta se recorre en ~150 ms. Un jugador real pasa como mínimo por las cuatro filas de Retar y una mano entera.
- **Con 3 s en el lobby, verde incluso con 2,5 s de retraso.** El «4G lento» realista para 37 920 B son ~0,77 s (562,5 de latencia más 0,21 de transferencia).
- **El arnés de hoy no puede ver el problema:** `alaVictoria` entra con `networkidle` (`diagCEL0.mjs:157`), que espera la descarga del lobby (hallazgo H3d-5).
- **Consecuencia para D6:**
  - La precarga ya existe y está en el sitio más temprano posible con sesión. Adelantarla a la Portada iría contra PUE-1.2 y BIE-1.
  - **No hay producto que pase la vara de rojo a verde con una precarga:** el rojo de la vara mide al arnés, no al jugador.
  - Lo único que la pondría verde a 0,4 s es un cambio de doctrina en `esperaPrecedente`: encadenar también un `play` **encolado**, esperando a `load` y después a `end`. Eso toca la doctrina sellada de VC2 (`celebracionCore.js`, no protegido, pero sellado por Vitest).
  - Es la **pregunta 1**.

**Cómo queda la variante como bandera permanente:** `diagCEL0 celebracion --audio-lento[=ms]` (800 por defecto).
1. Registra en cada contexto de arco `ctx.route('**/sounds/**')` con el retraso.
2. Hace que `alaVictoria` entre con `waitUntil: 'load'` en vez de `networkidle`, solo con la bandera.
3. Pausa **`PAUSA_LOBBY_MS = 3000`** tras `main.lobby [data-accion="jugar-ia"]`: un humano rápido, declarado como constante.
4. Corre solo las celdas de arco con sonido (escritorio, móvil 360×640 y 640×360), por mayoría de 3, como hoy.

**Vara:** verde hoy y verde después; no hay «antes rojo» posible sin cambiar el producto (pregunta 1). **Control** que demuestra que sabe fallar: `--audio-lento --pausa-lobby=0` (o `D` = 30 000) → **rojo** con el mensaje de dueño ARN-3d, medido arriba.

### C3 · El margen del `encadenado`

- **Duración real de `table-knock.mp3`:**
  - **`ffprobe` no está instalado** en la máquina (`command not found`). En su lugar, recuento de marcos en Node: MPEG-2 Layer III a 24 000 Hz, sin cabecera Xing/LAME, **79 marcos × 576 muestras = 1,896 s exactos**;
  - **`Howl.duration()` = 1,896** (leído en la sonda, 5 corridas verdes);
  - coincide con `TOC_NOMINAL_MS = 1896` (`coreografiaCore.js:27`, «arnés CEL-0: 1,896 s de archivo»).
- **`espera` en verde: 2 146 ms en las 6 corridas verdes** (1 896 + `ESPERA_MARGEN_MS` 250).
- **¿Puede `duración + 250` caer a menos de 1 ms del nominal?** Solo si el archivo pasara a durar **1,646 s**. Con `duration() = 0`, `esperaPrecedente` devuelve el tope (3 000), no el nominal. **Hoy la separación es de 250 ms: la deducción por igualdad no es frágil.** Lo sería si alguien recorta el toc-toc a ~1,65 s, o cambia el margen o el nominal sin tocar el otro.
- **Alternativa, más robusta y barata:** que la marca diga la verdad.
  - `useCoreografia.js:241` publicaría `marcaCEL('ancla', { encadenado: !!audio, honesto: esperaPrecedente(audio) > 0, espera })`. `marcaCEL` no hace nada en producción (`src/dev/arcoCEL.js`).
  - El arnés leería `honesto`, con la deducción por igualdad como respaldo cuando falte el campo.
  - Es una línea en un archivo de producto no protegido: entra en la tanda de producto si el rector la acepta (pregunta 5).

### C4 · El roce de `vc` (H3c-ii-1)

**Sonda** `_sondaSonidos.mjs vc`, en la copia `base`:
- dev con bypass en 5181, mesa 2, 1366×768, en una sola página (primera y segunda celebración);
- envoltorio de `Howl.prototype.play` por `addInitScript`: en cada `play` de `chips-collect.mp3` anota el instante, `state()` y una serie de `playing(id)` cada 50 ms durante 3 s;
- el bucle de juego es el de `vcHastaVictoria` (sondeo de `.msg-win` cada 250 ms), más `contestarRecargaComun`;
- en el instante en que el bucle ve la victoria, se toma la misma lectura que hace el arnés.

| Celebración | Mano | Lectura del arnés al ver `.msg-win` | `play('chipsCollect')` | Estado del `Howl` | `playing()` cada 50 ms (1 = suena) |
|---|---|---|---|---|---|
| 1.ª | 1 | t = 19 367 · capa no · suenan `coin-bet`, `showdown`, `button-click` | t = 21 177 (+1,81 s) | **`loading`** | `1111111111111111111` + ceros (950 ms) |
| 1.ª (2.º `play`, mismo cuadro) | 1 | — | t = 21 186 | `loaded` | igual |
| 2.ª | 8 | t = 158 788 · capa no · suenan `coin-bet`, `showdown`, `button-click` | t = 160 602 (+1,81 s) | **`loaded`** | `1111111111111111111` + ceros |

**Lectura:**
- **El roce entra 1,81 s después de que el arnés ve la victoria**, cuando acaba `showdown.mp3` (la doctrina VC2b). `vc·jugado` lee `viva` y `sonando` en cuanto aparece `.vc-capa`, que es **el mismo instante** del `play`.
  - Si el `Howl` todavía carga, `playing()` es falso en ese tick. En local deja de serlo antes de la primera muestra (50 ms); con red, tarda lo que tarde la descarga.
  - **Eso es lectura temprana: instrumento.**
- **En la primera celebración, el `Howl` nace en el `play`** (`loading`). `chipsCollect` no está en `SONIDOS_MESA` (`useSounds.js:69-72`, «son de la celebración»), y en el camino de IA nadie lo precarga: solo `SONIDOS_SALAS` (PvP).
  - Con red real, el **primer** roce de la partida llegaría tarde respecto a las monedas: ~0,73 s con «4G lento» para 30 929 B, contando 562,5 de latencia.
  - La segunda vez ya está `loaded`.
  - **Eso es falta de precarga: producto.**
- **Clasificación: las dos.** El instrumento lo destapa leyendo en el mismo tick del `play`, y el producto lo provoca en la primera celebración.
- **Sin explicar:** la 1.ª celebración hizo **dos** `play` de `chipsCollect` separados 9 ms (el primero en `loading` y el segundo en `loaded`); la 2.ª, uno. No hay sonda que lo aclare aún; StrictMode (que en DEV monta dos veces) es la sospecha, sin medir.
- **Pendiente, sin medir:** la variante con `chips-collect.mp3` retrasado 800 ms. Dos intentos (8 y 12 manos) acabaron sin una sola victoria humana. El molde `?cel` no sirve aquí, porque gana la mesa entera y no una mano. En la Fase 1, con un molde `?apu=` que garantice ganar una mano (pregunta 6).

**Propuesta:**
- **Instrumento:** leer `sonando` con `waitForFunction` hasta 300 ms y anotar `state()`, en vez de una lectura única.
- **Producto (pregunta 6):** añadir `chipsCollect` (30 929 B) a `SONIDOS_MESA`.
  - **Vara:** `vc` con `chips-collect.mp3` retrasado → la primera celebración en `loading` antes y `loaded` después.
  - **Control:** sacarlo otra vez de la lista → `loading`.

### C5 · El Δ de `.pbr-chips` en `vc` (H-14)

**Por qué cambia la cifra entre las dos tomas:**
- `.pbr-chips` contiene la cifra del humano: `BalanceDisplay chips={saldoMostrado(0, human.chips)}` (`GameTable.jsx:2507`).
- Mientras dura la celebración de una mano ganada, **`saldoMostrado` retiene** la cifra en `chips − pozo` (`:928-930`, «Sólo el GANADOR retiene, y sólo para pintar»). Las monedas vuelan y la cifra sube al aterrizar.
- `vc·jugado` toma `durante` con la capa viva (`diagDSK.mjs:9578`), **corta con un toque** (`:9595`) y toma `despues` (`:9609`). El toque acaba la celebración, la retención se suelta y la cifra **salta** al saldo real.
- Si el salto cambia el número de dígitos (por ejemplo, de 950 a 1 150), la caja crece un dígito: **10,19 px**, la misma firma que `h1` en ARN-3 (H-14). Si no cambia de dígitos, Δ = 0. Por eso la cifra cambia entre corridas.
- **No es el *overlay* moviendo nada: es el saldo pintado, que cambia a propósito.** El Δ = 0 que la puerta quiere ver es el del *overlay*.

**Arreglo del instrumento, sin aflojar la puerta** (la tolerancia se queda en 0,02 px para las 13 anclas):
- **Igualar el texto en la segunda toma** con una sonda de DOM, el mismo molde que CEL usa para medir sin sembrar: en `despues`, escribir en `.pbr-chips` el texto que tenía en `durante`, forzar el reflujo, medir y devolver el texto en el mismo tick.
- Así las dos tomas comparan la misma cifra, y la diferencia que quede solo puede venir del *overlay*.
- La línea del modo dice «`.pbr-chips` medido con el texto de `durante` (950 → 1150)».
- **La alternativa es la regla de `h1`** (borde derecho, `y` y alto; `bboxDeltaDerecha`, `diagDSK.mjs:4415`, ARN-3b D6). Vale porque el saldo está anclado a la derecha: `.player-bar-right` lleva `justify-self: end` (`gameTable.css:265-269`) y el bloque crece hacia la izquierda (`:1448-1457`). **Se prefiere la sonda de texto** porque conserva la caja **entera** de `.pbr-chips` a 0,02 px y no depende de la alineación de cada piel.
- **Control:** en la copia, que el *overlay* desplace 1 px la barra (`transform` en `.vc-capa ~ .player-bar`, o un `margin` en la copia) → `p2` **rojo** con el texto igualado.

---

## §D · El plan de la Fase 1

### D1 · Las piezas, en orden (dos sub-tandas)

**ARN-3d-i · Instrumento** (sin tocar `src/`):
1. `esperarMesa(page)` en `scripts/rutaMesa.mjs`, usado por `recorrerRuta`, `u1` y `controlNegativo` (§B7).
2. Nuevo modo `diagPUE mesa`, a partir de `_sondaEntrada`. Mide 4G lento por CDP, toque → mesa pintada y `#root` vacío, en los escenarios A y B. Puertas:
   - `mesa.a`: con la precarga hecha, ≤ 60 ms y 0 ms en blanco;
   - `mesa.b`: entrada inmediata, 0 ms en blanco (sin techo de tiempo; se informa);
   - `mesa.portada`: el chunk no se pide antes del FCP. Es redundante con `1.8b`, pero lo nombra.
3. `diagCEL0 celebracion --audio-lento` con la pausa humana (§C2).
4. `vc`: el Δ con el texto igualado (§C5), y la lectura del roce según §C4.
5. `encadenado`: leer `honesto` si existe (§C3).

**ARN-3d-ii · Producto:**
1. B9: `inert: true` (`Lobby.jsx:280`) y `RETAR_RUIDO_CONOCIDO = []`.
2. B10: borrar `.lob-cta-pvp` (`lobby.css:501-525` y `:535`).
3. B6: borrar el modal (`GameTable.jsx`, §A1) y el comentario de `salta` (§A4).
4. B11: `src/lib/cargarMesa.js`, el `lazy`, el `Suspense` en la raíz, el `startTransition` en `onRetar`, la precarga en `Lobby` y en el efecto de `App`, y el `vite:preloadError` (si se aprueba).
5. Si se aprueba, la marca `honesto` en `useCoreografia.js:241`.

### D2 · Vara, control y pruebas por pieza

| Pieza | Vara (antes → después) | Control (la puerta sabe fallar) | Vitest nuevas |
|---|---|---|---|
| `esperarMesa` | `msg`/`cap` verdes con el chunk retrasado 2 s | quitar la espera → rojo (mesa nula) | — |
| `diagPUE mesa` | `base`: a/b verdes (no hay chunk); `lazyP3`: a/b verdes | variante `lazyP2` (`Suspense` local) → `mesa.a` **rojo**, ~330 ms en blanco | — |
| `--audio-lento` | verde → verde (no hay rojo de producto, §C2) | `--pausa-lobby=0` → **rojo** (medido: `espera` 1 896) | — |
| `vc` Δ | `p2` con Δ 10,19 → `p2` con Δ 0 | 1 px de desplazamiento en la barra → **rojo** | — |
| B9 | consola de `retar` con 4 conocidos por celda → 0 y filtro vacío | `inert: ''` en la copia → `retar` **rojo** | `atributosHoja(abierta)` pura en `lobbyCore` (o junto al Lobby): con la hoja cerrada, `{ inert: true, 'aria-hidden': 'true' }` |
| B10 | `grep lob-cta-pvp src/` 3 reglas → 0; `lob` verde y sin cambios de caja | — (borrado sin consumidor) | — |
| B6 | `grep bankruptModal src/` 5 sitios → 0; `testEliminations` verde; `apu`/`rec2` verdes (la tarjeta de recarga conserva la caja) | — (código inalcanzable; lo cubre `testEliminations:198-205`) | — |
| B11 | `1.8b` **222,0 rojo → 168,8 verde**; `diagPUE mesa` verde; `gate`, `cel`, `vc`, `rev`, `msg`, `cap` sin cambios | `lazyP2` → `mesa.a` rojo · `lazyP` (precarga en `App`) → `1.8b` **rojo**, 223,7 | `cargarMesa.test.js`: `fabricaMesa` devuelve la promesa antes de cargar y un *thenable* síncrono después; `precargarMesa` es idempotente y usa `requestIdleCallback` o su sustituto (importador y reloj inyectados). `sinImportEstatico.test.js`: ningún archivo de `src/` importa `GameTable` de forma estática (si no, Vite avisa `INEFFECTIVE_DYNAMIC_IMPORT` y el `lazy` deja de servir) |
| marca `honesto` | `celebracion` verde con `honesto: true` | `table-knock.mp3` apartado → `honesto: false`, rojo | `coreografiaCore`: si ya existe la prueba de `esperaRevienta`, un caso más |

### D3 · Lista de comprobación para el teléfono de Victor (S25 e iPhone)

Antes de empezar, en cada teléfono: abrir AJILEI con la versión nueva publicada en el túnel (o desplegada).

1. **Primera entrada después de borrar la caché.**
   - Ajustes del navegador → borrar datos del sitio de AJILEI. Abrir AJILEI.
   - **Mira:** la Portada aparece igual de rápido o más que antes, sin cuadros vacíos.
   - Entra con tu cuenta, ve al lobby, toca «Retar a las IAS», elige las cuatro filas y toca «Jugar».
   - **Mira:** la mesa aparece **directamente**, sin un instante de pantalla verde vacía ni un parpadeo entre Retar y la mesa. Las cartas, la barra de abajo y los rivales, en su sitio de siempre.
2. **Entrada muy rápida.** Borra otra vez los datos y repite, pero en el lobby toca «Retar a las IAS» **en cuanto aparezca**, elige rápido y toca «Jugar».
   - **Mira:** puede tardar un momento en cambiar de pantalla, pero **nunca debe verse la pantalla vacía**: o sigue Retar, o ya está la mesa.
3. **Con la app instalada (icono en la pantalla de inicio).** Ábrela desde el icono, entra a una mesa y juega una mano.
   - **Mira:** lo mismo que en el paso 1. Si la tenías instalada de antes, que abra la versión nueva sin pedir nada.
4. **La celebración del fin de partida.** Juega hasta ganar la mesa.
   - **Mira y escucha:** primero suenan los dos golpes del toc-toc y, justo cuando acaban, empieza la fiesta (la lluvia y la música). La fiesta **no** debe empezar a mitad de los golpes ni con silencio antes.
5. **Una mano ganada.** Cuando ganes una mano:
   - **Escucha:** el sonido de fichas al volar las monedas, a la vez que se mueven. La primera vez de la partida también.
6. **La hoja ⚙ del lobby.** Ábrela y ciérrala.
   - **Mira:** se ve igual que siempre.
   - En el PC: con la hoja cerrada, el tabulador no debe entrar en ella.
7. **Vuelve al lobby y entra a otra mesa.**
   - **Mira:** la segunda entrada es instantánea.

Si algo no cuadra: una captura y la hora.

### D4 · Mapa provisional archivo → commit

| # | Commit | Archivos |
|---|---|---|
| 1 | `ARN-3d-1: núcleo — cargarMesa y sus pruebas` | `src/lib/cargarMesa.js` · `src/lib/cargarMesa.test.js` · `src/sinImportEstatico.test.js` (o en `scripts/`, junto a las demás pruebas de fuente) · `atributosHoja` y su prueba |
| — | API | **Ninguno:** esta tanda no toca Supabase ni `salasApi` |
| 2 | `ARN-3d-2: arnés — esperarMesa, diagPUE mesa, --audio-lento, vc con texto igualado` | `scripts/rutaMesa.mjs` · `scripts/diagPUE.mjs` (modo `mesa`; y quitar la etiqueta «rojo conocido desde CAP-1» de `1.8b`, que pasa a verde) · `scripts/diagCEL0.mjs` · `scripts/diagDSK.mjs` (`vc`, `u1`) |
| 3 | `ARN-3d-3: pantallas — mesa diferida con precarga en el lobby, inert, CSS y modal muertos` | `src/App.jsx` · `src/main.jsx` (`vite:preloadError`, si se aprueba) · `src/screens/Lobby.jsx` · `src/components/GameTable.jsx` · `src/styles/lobby.css` · `scripts/diagDSK.mjs` (`RETAR_RUIDO_CONOCIDO = []`, que va **aquí** y no en el 2, para que el commit 2 no quede rojo sin el arreglo de `Lobby`) · `src/hooks/useCoreografia.js` (si se aprueba `honesto`) |
| 4 | `ARN-3d-4: informes` | `docs/reportes/AJILEI_ARN-3d_Fase0_Informe_v1.0.md` · `docs/reportes/AJILEI_ARN-3d_Informe_v1.0.md` |

Cada commit se comprueba solo, en una copia `git archive` con la unión a `node_modules` (molde de BIE-1): compila, vitest y lint (línea base de 20).

### D5 · Estimación

| Trabajo | Minutos de Claude Code |
|---|---|
| 3d-i · `esperarMesa` + vara y control | 15 |
| 3d-i · `diagPUE mesa` (desde la sonda) + control `lazyP2` | 30 |
| 3d-i · `--audio-lento` + control | 20 |
| 3d-i · `vc`: texto igualado y lectura del roce, + control | 25 |
| 3d-ii · B9 + B10 + B6 + comentario de `salta` | 20 |
| 3d-ii · B11 (código, pruebas, `1.8b`, `mesa`) | 40 |
| Corridas de regresión: `gate`, `cel` (vara), `vc`, `apu`, `retar`, `lob`, `msg`, `cap`, `rev`, `diagPUE todo` | 45 |
| Comprobación por commit en copia + informe | 25 |
| **Total** | **~3 h 40 min** |

**Validación de Victor**, aparte: ~30–40 min (los 7 pasos de §D3 en el S25 y en el iPhone).

---

## §E · Preguntas al rector

1. **`tableKnock` (D6).** Ya se precarga desde LOB-1, al montar el lobby. La vara estrangulada sale **roja solo cuando el camino del lobby a la victoria dura menos que la descarga**: el arnés lo hace en ~0,4 s. Con una pausa humana de 3 s sale **verde con hasta 2,5 s de retraso**. ¿Qué se hace?
   - **(a) Recomendada:** se cierra el pendiente «precargar `tableKnock`» como **ya hecho por LOB-1**. `--audio-lento` con la pausa humana queda como vigilancia (verde y verde), con su control de pausa 0 en rojo.
   - **(b)** Se quiere que el arco encadene también un toc-toc que aún carga. Eso cambia `esperaPrecedente`/`esperaRevienta` (doctrina VC2, sellada por Vitest), no la precarga, y sería su propia pieza.
2. **`.btn-soon` y `.soon-tag`**, que mueren con el modal (B6).
   - Viven en `gameTable.css:780-806`, que es **protegido** (D2). ¿Se dejan como CSS muerto (recomendado: no cuestan nada visible) o se autoriza abrir el protegido para borrarlos?
   - Además, `.soon-tag` de `welcome.css:136-…` («Kept for ModeSelect») ya no tiene a `ModeSelect`. `welcome.css` no es protegido, pero D8 no lo nombra. ¿Se borra en esta tanda?
3. **Un despliegue a mitad de sesión (B11).** ¿Se aprueba un escuchador de `vite:preloadError` en `main.jsx` que recargue **una vez**? Solo actúa si el chunk de la mesa no llega: hoy esto no puede pasar, porque no hay chunk.
4. **La entrada inmediata con red lenta.** Con `startTransition`, si la precarga no terminó, la pantalla de Retar se queda quieta tras tocar «Jugar» (medido ~1 s en 4G lento con todo compitiendo; suena el clic). ¿Se acepta así? La alternativa de mostrar algo en el botón mientras tanto sería un cambio de diseño (D1).
5. **La marca `honesto` en `useCoreografia.js:241`** (§C3). Una línea que solo existe en desarrollo y vuelve robusta la vara del `encadenado`. ¿Entra en la tanda de producto, o la vara sigue deduciéndolo por igualdad (hoy con 250 ms de margen)?
6. **`vc` / `chipsCollect`** (§C4). El roce es las dos cosas: lectura temprana y falta de precarga. ¿Se añade `chipsCollect` (30 929 B) a `SONIDOS_MESA` para que el primer roce de la partida suene a tiempo con red real? Es el mismo tipo de cambio que se pensaba para `tableKnock`, y aquí sí tiene un caso real: en el camino de IA nadie lo precarga. Para medirlo estrangulado hace falta un molde que gane una mano (`?apu=`, DEV): ¿se autoriza tocar `src/dev/` para eso, o se mide jugando con un tope más alto?
7. **El orden de commits.** El vaciado de `RETAR_RUIDO_CONOCIDO` va en el commit de pantallas, no en el de arnés, para que cada commit quede verde por sí solo. ¿De acuerdo?

---

## Hallazgos nuevos (se reportan, no se arreglan)

| # | Hallazgo |
|---|---|
| **H3d-1** | En `App`, `screen` vale `'lobby'` también en la Portada (y en `SESION_SIN_PERFIL`/Bautizo). Cualquier efecto colgado de `screen === 'lobby'` corre en la puerta. Medido con la precarga de la mesa: `1.8b` 223,7 KiB. Hoy no hay ninguno; el efecto actual se salva porque `'lobby'` está en `SIN_PRECARGA` |
| **H3d-2** | `React.lazy` con un `Suspense` local deja ≥ 300 ms en blanco aunque el chunk ya esté en memoria (322–334 ms medidos): React estrangula la salida del `fallback`. Hace falta un *thenable* síncrono o una transición |
| **H3d-3** | `wrangler.jsonc` sirve `index.html` con 200 para cualquier ruta que no exista, también `/assets/*.js`. Un chunk retirado por un despliegue no da 404 sino HTML, y `_headers` le pondría `immutable` a esa respuesta en `/assets/*` |
| **H3d-4** | `tableKnock` ya se precarga en el lobby (LOB-1). El pendiente «precargar `tableKnock`» de ARN-3c §24-4 parte de que no se precargaba |
| **H3d-5** | `alaVictoria` (`diagCEL0.mjs:157`) entra con `networkidle`, que espera también las descargas del lobby: ninguna variante «red lenta» se puede medir por ahí sin cambiar la entrada |
| **H3d-6** | El encabezado de `diagCEL0.mjs` (`:2`) pide «npm run dev en otra consola»: está desactualizado desde ARN-3a, porque el arnés levanta su propio servidor |
| **H3d-7** | `ffprobe` no está instalado en la máquina. La duración de los MP3 se midió por recuento de marcos y coincide con `Howl.duration()` |

---

## STOP

Parada aquí, sin commits y sin `git add`. Comprobado a las 10:00:

- **Puertos 4170–5599:** solo `0.0.0.0:5040`, pid 7724 (el `svchost`). Hoy no había nada en 4173.
- **`node` vivos:** ninguno (`tasklist`). Las sondas usaron servidores dentro del proceso, y la de `vc` que se colgó terminó con código 2 por «Page crashed» y cerró su servidor.
- **Copias:** las seis uniones a `node_modules` (`base`, `lazyP`, `lazyP2`, `lazyP3`, `lazy0`, `lazy0T`) **se quitaron** con `rmdir`. Las carpetas de las copias **siguen** en el scratchpad de la sesión: el borrado recursivo está denegado (también con `Remove-Item`), como en ARN-3c. Ya no enlazan con el repo.
- **`node_modules` del repo, intacto:** 150 entradas, vite 8.0.14, playwright-core 1.62.1.
- **`git status --porcelain`:** los 5 residuos más este informe.
  ```
  ?? docs/reportes/AJILEI_ARN-3d_Fase0_Informe_v1.0.md
  ?? docs/reportes/AJILEI_MOT-1_Fase0_Informe_v1.0.md
  ?? docs/reportes/AJILEI_MOT-1_Fase1-0_Sonda_Informe_v1.0.md
  ?? laminas/mon1/_entorno.txt
  ?? laminas/mon1/lamina.html
  ?? laminas/mon1/tiempos.json
  ```

**Sondas de un solo uso** (en la copia, no en el repo): `_sondaEntrada.mjs`, `_sondaCascada.mjs`, `_sondaSonidos.mjs` (`toc`/`vc`), `_sondaSonidos2.mjs` (pausa humana), `_sondaSonidos3.mjs` (roce estrangulado, sin victoria), y `variantes.cjs`, `v2.cjs`, `v3.cjs` (las variantes de `App`).

**Pendiente dentro del tope:** solo el roce de `vc` con red estrangulada (§C4).
