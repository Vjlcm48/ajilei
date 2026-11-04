# AJILEI · PES-1 · Fase 1 · La entrada ligera · Informe · v1.0

**Para:** Victor y el rector · **Fecha:** 2026-11-04 · **Ficha:** `AJILEI_PES-1_Fase1_v1.0.md`
**Estado:** STOP-V. Sin commits, sobre `main` en `4a7acbf`. Queda por hacer las pruebas de Victor; después, el mapa de commits.

**En tres líneas.** `1.8b` baja de 235,6 a **176,8 KiB**, por debajo de la meta de 185 y con 8,2 de margen. El guardián, `1.8f` en rojo y la puerta de espera quedan permanentes. Ninguna vara visual cambió de cifra, y `luz` cazó una regresión que se arregló antes de seguir (§5).

---

## 1 · La cifra final

| | Antes (`4a7acbf`) | Ahora | Δ |
|---:|---:|---:|---:|
| **Total** | **235,57** | **176,8** | **−58,8** |
| JS | 198,48 | 149,0 | −49,5 |
| CSS | 30,38 | 21,1 | −9,3 |
| Resto (HTML e imágenes) | 6,71 | 6,7 | 0 |

KiB en gzip 9, como en la Fase 0. La vara y el navegador coinciden: Δ 0,0 KiB (`1.8f`).

---

## 2 · El ahorro de cada punto

El total es medido. El reparto por puntos es proporcional, igual que en la Fase 0: parte en crudo por el factor de su paquete. Por eso suma −59,3 y no −58,8, y los decimales son orientativos.

| Punto | Ficha | Ahorro | Qué salió |
|---|---:|---:|---|
| A · el motor vuelve a la mesa | ~8 | **−8,5** | `aiPlayer`, `gameEngine`, `pozos`, `handEvaluator`, `deck`, `entrada`, `mesaIACore`, `controlMesaIA` |
| B · las pantallas al abrirlas | ~30 | **−34,2** | Las nueve pantallas, las capas del video y sus CSS, `correoApi` y `correoCore`. Ya cuenta lo que añade el molde |
| C · la hoja del ⚙ al primer toque | ~4–6 | **−3,7** | `HojaContenido`, `EliminarCuenta`, `Vitrina`, créditos; `hojaMarco.css` suma +0,85 |
| D · `paises.js` partido | ~3 | **−3,4** | Los nombres de países y estados y `lugarCore`; `lugaresCodigos.js` suma +0,27 |
| E · Howler después de pintar | ~10 | **−9,7** | `howler` −10,2; `motorHowler` suma lo suyo |
| F · `constancia.css` | — | **−0,8** | El SVG incrustado pasa a URL con `?no-inline`, en una línea |
| Otros | — | +0,9 | Sobre todo la subida del factor de compresión, que reparte el peso de lo que se queda |

**El punto A se comprueba en el sourcemap:** los cinco archivos del motor no están en el JS de entrada.

---

## 3 · Cómo funciona ahora

**Un solo molde.** `creaCargador` (`lib/cargarMesa.js`) es la fábrica de la mesa, generalizada. `lib/trozos.js` guarda los doce trozos nuevos y es el único sitio con sus `import()`. Las pantallas son `lazy(trozos.x.fabrica)`, igual que la mesa.

**La espera.** `components/PantallaDiferida.jsx` envuelve cada pantalla.

- Con el trozo ya en memoria pinta en el mismo render, sin fotograma de espera. Es lo normal con la precarga.
- Si no ha llegado, enseña el fondo de la familia, y pasados 300 ms el «Cargando» de BIE-1, con su regla D5 entera.
- **No es un `Suspense` local.** React retiene su `fallback` 300 ms aunque el trozo llegue antes (H3d-2), y eso sería una espera añadida en cada toque.

**La precarga.** Al montar el lobby, en el mismo momento que la mesa: Tienda, Perfil, Rankings, la hoja y RetarIAS. Las salas y el intersticial se piden al tocarlos, y las capas del video al pedir un video. La Portada no pide nada.

**El trozo caído.** Igual que la mesa: la precarga calla y, si alguien está esperando ese trozo, se recarga una vez. `vite:preloadError` no dice qué trozo falló, así que `origenFalloChunk` mira si alguno está esperando.

**La hoja del ⚙.** `HojaConfiguracion` queda como marco en la entrada: velo, caja, título, foco y aviso. Nace al primer toque, abre con su animación de siempre, y las filas llegan en `HojaContenido`. Las demás pantallas que la montan no cambian su `import`.

**Sentarse.** `retar` espera el canal **antes** de pedir `sentarse_ia`. Si no llega, es un error de red con su reintento y no se ha cobrado nada; una entrada cobrada sin canal dejaría la mesa abierta en el servidor.

**El video.** `controlVideo.pedir` espera a las capas antes de arrancar el reloj: con red lenta, el jugador vería menos video del que se le cuenta.

---

## 4 · Lo que quedó en la entrada y por qué

| Módulo | KiB | Por qué |
|---|---:|---|
| `@supabase/*`, `textos.es.js`, `src/dev/` | 58,3 · 5,3 · 0,15 | Fuera de PES-1 por la ficha |
| `salas.css` | 5,9 | Por la ficha: la comparte la familia `.sal`, y la espera pinta su fondo |
| `controlVideo`, `videoCore`, `reproductor` | ~1,5 | Por la ficha: se crean al arrancar |
| `vitrina.css` y `luz.css` | 1,6 | **Desviación D-1** |
| Cajas de la hoja, en `hojaMarco.css` | 0,85 | **Desviación D-2** |
| `eliminarCuenta.css` | 0,7 | Lo importa `Bautizo`, que está en la entrada. No se parte: sus clases `.elc-*` no empatan con nadie, y partirla para ganar medio KiB no compensa |
| `sumaCore` | 0,16 | `App` decide al tocar Rankings si sale el intersticial: esperar a la red ahí sería peor que el peso |
| `rankingApi`, `tiendaApi`, `controlTapetes`, `mesaIAApi` y las demás API | ~3 | `App` las crea al montar y la ficha no las pide fuera. `lugarValido` entra con los códigos |
| `carasBaraja` | 0,85 | Son las URL de la precarga de la baraja, que `App` lanza al salir del lobby |

**No hizo falta espejo de `PHASES`:** ningún módulo de la entrada lo necesita ya.

---

## 5 · Lo que cazaron las varas

- **`luz`, roja: regresión mía, de la familia de D-21.** Puse `vitrina.css` y `luz.css` en `main.jsx`, antes que `ChipToken.css`. En la mesa, la ficha perdía su `filter` (`p5_token` rojo en las 20 celdas). Se arregló llevándolas a `HojaConfiguracion.jsx`, justo el sitio que tenían en la cascada, y `luz` volvió a verde sin subir especificidad. El guardián exige ahora ese sitio.
- **`video.8`, roja: del instrumento.** Buscaba `⟦` dentro de `.vid-raiz`, y si no existía daba positivo. Esa capa ya no está en el DOM fuera de un video, que es el cambio querido. Ahora mira la pantalla entera, lo que además mide más.
- **Orden de la cascada.** Comparé el orden de carga de la entrada antes y ahora. Solo se invierten `eliminarCuenta.css` y `cargando.css` con otras hojas, y no comparten ningún selector.
- **El empaquetador reparte por el grafo, también lo que es código muerto.** `dev/billeteraFalsa` importaba `correoApi` y lo dejaba en la entrada aunque en producción nadie lo use. La simulación del correo se mudó a `dev/correoFalso.js`, que viaja con el Perfil. Por eso el guardián sigue también `src/dev/`.

---

## 6 · Las reglas de CSS movidas

Todas con el mismo cuerpo y el mismo selector. Ningún `!important` y ninguna subida de especificidad.

| Reglas | De | A | Por qué |
|---|---|---|---|
| `.vid-quedan`, `.sal-saldo > .vid-quedan`, `.sal-saldo:has(> .vid-quedan)`, `.sal-saldo .sal-saldo-cta:disabled` | `video.css` | `salas.css`, al final | Las pintan Retar y la celebración, y `video.css` viaja con las capas. Ya cargaban detrás de `salas.css` |
| `.vid-fila*`, `.vid-pastilla` | `video.css` | `tienda.css`, al principio | Solo las pinta el estante Monedas. Delante de las reglas que les dan su filete, que es su orden |
| Tokens `--cfg-*`, `.lob-velo`, `.lob-hoja`, `.lob-hoja-t`, `.lob-hoja-cuenta*`, `.cfg-hoja-cuerpo`, `.lob-fila*`, `.lob-chev`, `.cfg-valor`, `.tie-cfg-*`, `.lob-pastilla*`, y la excepción del apaisado bajo | `hojaConfiguracion.css` | `hojaMarco.css`, nueva | Lo que la hoja necesita para abrir antes de que lleguen las filas. Perfil y Tienda usan también las filas y la pastilla |
| `.util-item-sound.is-off .util-ico` (el ⋮ de la mesa) | `hojaConfiguracion.css` | `hojaMarco.css` | Si se quedara con la hoja, la mesa lo perdería con la hoja sin abrir |

**Se quedan en `hojaConfiguracion.css`:** `.lob-acerca`, `.cfg-sug*`, `.cfg-version`, `.cfg-toast`.

**Regla nueva:** `.espera-trozo .cargando` en `cargando.css`, para que el «Cargando» no tape el fondo de la familia; y `.cfg-reserva` en `hojaMarco.css`.

---

## 7 · Lo tocado en el sonido

- **`lib/motorHowler.js`, nuevo.** Carga `howler` con el molde justo tras el primer pintado con contenido, o a los 900 ms si el navegador no lo cuenta. Lo que se pida antes queda en orden y corre al llegar.
- **`hooks/useSounds.js`, tres sitios.** `obtener` usa el `Howl` del motor; `precargarSonidos` pasa por `conHowler`; y `reproducir`, sin motor, deja el sonido pendiente y devuelve `null`, una vez por sonido.
- **`context/SoundContext.jsx`, una línea.** `Howler.mute` pasa por `conHowler`.
- **Sin tocar:** `useCoreografia` y `useCongelado` siguen importando `howler`, y viajan en trozos diferidos.

En la Portada medida: FCP 152 ms, `howler` 183 ms, y el clic se pide a los 1000 ms, como hoy. **`vc`, `celebracion` y `diagPUE bie` salen verdes sin tocar ninguna cifra.** Lo que no se puede medir aquí es el primer toque en un teléfono real: es la prueba B de Victor.

---

## 8 · El guardián, las varas nuevas y la doctrina

- **Guardián:** `scripts/testEntradaLigera.test.js`. Recorre el grafo estático desde `main.jsx` y exige que no aparezcan 43 módulos: las pantallas, la hoja, el motor, los nombres de lugares, `howler` y la mesa. Dice el camino.
  - **Una excepción, escrita:** `dev/repartoGanador.js` importa `deck.js` para `?apu=gana`. En la build desaparece, y `deck.js` no está en el sourcemap de entrada.
  - **Control rojo real:** con `import Tienda2 from './screens/Tienda'` en `App.jsx` sale rojo y enseña `main.jsx → App.jsx → screens/Tienda.jsx`. Revertido, verde, con el archivo idéntico byte a byte. El mismo control vive dentro de la prueba, sobre un grafo inyectado.
- **`1.8f` decide:** roja con 1 KiB o más de diferencia. **Control rojo real:** quitando `reverso_carta` de la lista de `peso`, `Δ −2,0 KiB` y código 1. Revertido, Δ 0,0.
- **`1.8b` en `aislado --perfil=commit`,** antes del humo.
- **Puerta de espera:** `diagPUE espera`, 15 mediciones en 21 s, contra la build. En `commit` y `completo` como `pue.espera`. Va en `diagPUE` porque en desarrollo no hay trozos.
- **Invariantes:** INV-84 nueva e INV-30 con la meta de 185.

---

## 9 · Las varas corridas

**Perfil `commit` sobre el árbol final:** **código 0.** eslint 0 errores y 0 avisos · vitest 97/97 archivos y 2193 pruebas · build · guiones · `1.8b` 176,8 KiB · `pue.espera` · `humo` en 13 min 11 s.

| Vara | Resultado |
|---|---|
| `luz` | **verde**, 20 celdas y 4 tapetes, por los dos caminos de render: p1 Δ, p2 contraste, p3 estados, p4 fugas, p5 token |
| `m1.5` · `m1.2` | **verdes:** una mesa por cada camino de render (`OpponentPanel` y `.ai-zone`) |
| `rev` · `tapetes` · `vc` · `congelado` | **verdes** |
| `video` | **verde**, con el instrumento de `video.8` arreglado (§5) |
| `saldo` · `mesaia` · `constancia` · `tam` | **verdes** |
| `diagPUE todo` | **verde**, 198 mediciones, 0 rojas (incluye `bie`) |
| `diagPUE cap` · `mesa` · `contraste` | **verdes**, 31, 3 y 7 mediciones |
| `diagSAL sal` | **verde** |
| `diagCEL0 celebracion` | **verde**, 0 fallos |

**No corridas:** `apu`, `tab`, `m1.3`, `m1.4`, `a1`, `h1`, `f1`, `tactil`, `o1`, `o2`, `webkit` y las demás de `completo`. La ficha no las pide, y el camino de render de sus mesas está cubierto. El primer pase de `luz` fue antes del arreglo (§5); todas las de esta tabla son con el arreglo puesto.

---

## 10 · Desviaciones

- **D-1 · `vitrina.css` y `luz.css` se quedan en la entrada** (1,6 KiB), aunque la ficha lista `vitrina.css` con la Tienda. `luz.css` también la importa la mesa: repartida entre trozos, cargaría en el orden en que lleguen, y empata con `vitrina.css` y con `ChipToken.css`. Es el riesgo que avisaba la ficha, y con 8,2 KiB de margen preferí un orden fijo.
- **D-2 · La reserva de la hoja son cajas de verdad, no una cifra.** Una fórmula en `calc` no sirvió: el alto de las filas depende de la vista, de la familia y del interlineado, y daba Δ de 11 a 39 px. `FilasReservadas` monta las mismas clases sin contenido, y Δ es 0,0 en las cuatro vistas y en `.sal`. Cuesta +0,85 KiB, y mover esas reglas evitó que Perfil y Tienda importaran la hoja entera.
- **D-3 · `controlMesa` entra en la precarga del lobby,** que la ficha no lista: `retar` lo espera antes de sentarse. Son 1,1 KiB, más lo que comparte con la mesa.
- **D-4 · A la segunda caída de un trozo se queda el «Cargando»; la mesa hoy deja la pantalla vacía.** La primera vez todas recargan igual que la mesa. No cambié la mesa.
- **D-5 · `src/dev/` se toca sin recortar:** la simulación del correo se muda a `dev/correoFalso.js` (§5).
- **D-6 · `wt-pes1` sigue en disco.** La ficha lo da por limpiado, pero `git worktree list` lo enseña, y `npm run aislado` se niega a correr con otra copia viva. Intenté quitarlo con los comandos del §9 de la Fase 0 y el permiso fue denegado, así que no insistí. **Hay que quitarlo antes del §5** (abajo).

---

## 11 · Tiempo real

- **Hasta el STOP-V:** unas 3 h, de las 23:46 a las 02:50 de la máquina, contra el tope de 6 h. La mayor parte es de varas corriendo.

---

## 12 · Para Victor antes del §5

```
cmd /c rmdir "C:\Users\victo\AppData\Local\Temp\claude\c--Users-victo-OneDrive-Documents-ajilei\e2065153-ea81-4d5e-9d54-b872f5856b86\scratchpad\wt-pes1\node_modules"
git worktree remove --force "C:\Users\victo\AppData\Local\Temp\claude\c--Users-victo-OneDrive-Documents-ajilei\e2065153-ea81-4d5e-9d54-b872f5856b86\scratchpad\wt-pes1"
git worktree prune
git worktree list
```

La última orden debe dar una sola línea.
