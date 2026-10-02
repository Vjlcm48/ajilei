# AJILEI · ARN-3b-ii · Continuación del bucle de autojuego · Informe v1.0

**Fecha:** 2026-10-02
**Ficha:** `AJILEI_ARN-3b-ii_v1.0.md`
**Punto de partida:** `main` en `c50c36d`, **con el árbol de trabajo de ARN-3b sin commitear** encima. No se descartó nada.
**Referencia:** `docs/reportes/AJILEI_ARN-3b_Informe_v1.0.md`.
**`src/` no se tocó**, tampoco `src/dev/`. Ningún protegido se abrió.

**Dónde se midió:**
- **Sondas y controles:** en dos copias fuera del repo (`scratchpad/arn3b-ii/sonda` y `…/ctl2`), cada una `git archive HEAD` con el árbol de trabajo encima y su unión a `node_modules`.
- **Corridas «de verdad»:** en el repo, con servidores propios.
- **Paralelismo:** como mucho 6 a la vez. **Excepción:** unos minutos con 7, porque las corridas 09 y 10 del cazador de §4 ya habían salido cuando llegó la 07. `rec` y `diagPUE todo` (que incluye `dis`), solos (D5).

**Reloj:** de 00:54 a 02:03 (69 min de los 75). **Sin commits.**

## Resumen

| § | Resultado |
|---|---|
| **§1 · los 19 px** | **«Vacío»**, en las 16 vistas de la matriz de `a2` donde el caso se dio. El sobrante real es de **23 px** (1024/1280/1366) o **29 px** (1440/1920). Debajo solo hay `.cards-row`, `.player-zone` y `.player-bar`, ninguno con texto, imagen, fondo, borde, sombra ni contorno en esos puntos. La franja es tapete: desviación máxima de 2–4 niveles sobre la mediana, frente a 3–5 del tapete de abajo. **4 vistas no cubiertas** (el humano no llegó a retirarse) |
| **§2 · `vuelos` con alcance** | **Hecho.** `vuelos.banda` solo cuenta los fotogramas con la banda visible; `vuelos.zona`, todos. **Controles:** una carta inyectada bajo la banda **con la banda visible** da `FAIL [vuelosBanda]` (54 px); una carta inyectada que sale por abajo de la zona en reposo da `FAIL [vuelosZona]` (54 px). **La repetición de 1280×720 con el humano retirado** (máximo 609,97, 2 de 2) queda **verde por la razón correcta**: 0 fotogramas con banda visible y 0 px fuera de la zona |
| **§3 · `apu.7` (H3b-2)** | **Evidencia:** antes del clic, las cuatro vías de `APU_EN_PAGO` son falsas. Tras el clic, la que se enciende es **`data-rec-motivo`**: la pregunta de recarga pendiente, que el All-in deja puesta en el acto (2 ms) o al terminar el descarte (3 814 ms), **con la mano todavía en juego**. 3 de 3. **Arreglo D3:** `APU_PAGO_VISIBLE`, una señal que solo existe en el pago, y además transición (falsa antes del clic). **Control:** las 5 corridas nuevas llegan al pago entre **3 751 y 7 822 ms**, siempre por la **burbuja** y con `pagoAntes: null`; el caso de 2 ms ya no pasa · 360×640 ×5: **5/5 verdes** · matriz completa: **REC-2 18/18 · mesa 6/7**; las 7 puertas de las 7 vistas en verde, y `apu.7` llega al pago por la burbuja en las 7 (3 622–7 994 ms). La celda roja (1024×768) lo es **por la consola**: un corte de red con el Supabase real (H-7), no por una puerta |
| **§4 · mesa reducida en vivo** | **Se dio en la corrida 7 de 10** (`a1_07`): **verde**, `mesaReducida: { desde: "h2t0", vivos: "5→4", frames: 93 }`, los 199 fotogramas de antes de la quiebra con Δ = 0 en todas las anclas, y `ceremonias: 1` |
| **§5 · pendientes de 3b** | `rec`: **no corrido** (no cupo solo en el tope; §5.1) · P11: **7/7 con el mismo veredicto que ARN-3a** (`diagPUE todo`, solo: 1, únicamente `1.8b`) · `a2` completo: **20/20 verdes**, código 0 |
| **Varas** | build limpio · **vitest 1 145/1 145** (sin pruebas nuevas: 3b-ii no añade piezas puras) · **eslint 21**. **Ojo:** una primera pasada de vitest falló **al cargar** los 42 archivos (H3b-ii-3) |

---

## §1 · La comprobación de los 19 px (condición de D2)

**Cómo se midió.** En la copia `sonda` (parche: `scratchpad/arn3b-ii/sonda_patch.py`):
- `gotoMesa` añade `?apu=allinHumano`, para que la fila All-in/Retirarse salga y el bucle común se retire.
- El muestreador de vuelos de `a2`, **dentro del mismo tick de `requestAnimationFrame` y en síncrono**, actúa cada vez que una carta en vuelo dentro de la zona baja de la fila de cartas y supera en más de 1 px al mayor sobrante visto (así el máximo siempre se sondea):
  1. oculta **todas** las cartas en vuelo;
  2. pregunta `elementFromPoint` en una **rejilla de 5×3** sobre el sobrante (de `max(bottom de las ranuras)` al borde inferior de la carta, y a lo ancho de la carta dentro de la zona);
  3. anota de cada punto elemento, `visibility`, opacidad efectiva (producto de la cadena), y si pinta texto, imagen, fondo propio, borde, sombra o contorno;
  4. y las restaura.
- Un fotógrafo en paralelo hace la captura de la franja (con 24 px de margen arriba y abajo) con todas las cartas en vuelo ocultas por CSS. La toma llega unas decenas de ms después del fotograma, en la misma fase de descarte.
- Las 20 celdas de la matriz de `a2`, 4 manos y un intento, 6 a la vez.

**El peor caso de cada vista** (la carta es siempre la reposición del descarte, `translate(0px, 0px); transition: none`, en su primer fotograma):

| Vista | Mesas | Sobrante | Qué hay en la rejilla de 15 puntos |
|---|---|---|---|
| 1024×768 | 2 · 3 · 4 · 5 | **23 px** | `.cards-row` 5 · `.player-zone` 5 · `.player-bar` 5 |
| 1280×720 | 3 · 4 · 5 | **23 px** | ídem |
| 1366×768 | 3 · 5 | **23 px** | ídem |
| 1440×850 | 2 · 3 | **29 px** | `.cards-row` 10 · `.player-zone` 5 |
| 1440×850 | 4 · 5 | **29 px** | `.cards-row` 5 · `.player-zone` 5 · `.player-bar` 5 |
| 1920×937 | 2 (28,84) · 3 · 5 | **29 px** | `.cards-row` 15 (mesas 2 y 3) · `.cards-row` 5 + `.player-zone` 5 + `.player-bar` 5 (mesa 5) |

- En los 240 puntos: `visibility: visible`, opacidad 1, **sin texto, sin imagen, sin fondo propio, sin sombra, sin contorno**.
- El único borde es el de la propia `.player-zone` (`1px solid rgba(232, 184, 75, 0.25)`). Es su filo y no está en el interior que se sondea: los puntos caen dentro de la caja.
- **Mesa 5 a 1920×937 baja a 773,48**: es exactamente la cifra del «`vuelos` intermitente» de APU-1.

**Las capturas** (`scratchpad/arn3b-ii/fotos/`, fuera del repo):
- 16 capturas `m{mesa}_{vista}_*_{i}.png` (una por vista cubierta);
- la hoja de contacto `hoja_sobrante.png`, con la franja marcada entre dos líneas;
- el zoom `zoom_m2_1280.png`.

En las 16, la franja es **tapete liso**. Lo único pintado cerca es el contorno punteado de la ranura vacía del humano retirado, que **termina justo en el borde superior de la franja**. Medido en píxeles: desviación máxima respecto de la mediana de la franja de **2–4** niveles, frente a **3–5** del tapete justo debajo. Es la textura del paño.

**Veredicto: «vacío».**
- Una precisión sobre la lista de la ficha. Además del contenedor de la zona aparecen `.cards-row` y `.player-bar`, dos contenedores de maquetación dentro de la zona: una fila flex y una rejilla, ambas sin fondo, borde ni sombra (`gameTable.css:243-251`). `elementFromPoint` devuelve el elemento de más arriba, así que ningún hijo pintado de la barra (nombre, pastillas, saldo, botones) cae en esos puntos. Las capturas lo confirman.
- La casa de la banda está ahí y oculta (`visibility: hidden` en los 16 casos), por eso el hit-test la atraviesa.
- **No hay nada visible bajo el sobrante.**

**No cubiertas (4):** mesa 2 a 1280×720 y 1366×768, mesa 4 a 1366×768 y 1920×937. En esas corridas el humano no llegó a retirarse en sus 4 manos, y el máximo fue el aterrizaje normal (0,6–4 px, la sombra de la carta). El caso 2·1280×720 sí quedó cubierto en las dos repeticiones de §2.5 y en la sonda de 3b.

---

## §2 · La regla de `vuelos` con alcance

**Cambios** (`scripts/diagDSK.mjs`):

| Pieza | Línea | Qué hace |
|---|---|---|
| La regla y su porqué | `:5937-5950` | D2/H3b-1 escrito encima del muestreador: por qué la regla se parte, con las cifras de §1 |
| `a2InstallFlights` | `:5951-6018` | Por **fotograma**: ¿la banda está visible (su `visibility` real)? Si lo está, el peor exceso de una carta en vuelo dentro de la zona sobre el tope de la banda (`banda.peorExceso`). En **todos**, el peor exceso por abajo o por los lados de la zona (`zona.peorFuera`). Para cada uno, **la ficha de la carta** (D6): clase, estilo, caja, origen (`left`/`top`), destino (origen + `translate`), número de fotograma y tiempo |
| Check (11) | `:6234-6237` | `vuelosBanda`: `peorExceso ≤ 0,5` o ningún fotograma con banda visible y vuelo. `vuelosZona`: `peorFuera ≤ 0,5` |
| `checks` y log | `:6267`, `:6274` | `vuelosBanda`, `vuelosZona`; el log dice `vuelo banda X (Nf) zona Y · máx Z` |

**El borde de arriba no cuenta en `zona`.** El reparto y los descartes de los rivales entran en la zona desde arriba, y eso no es salirse de ella. Lo que la regla protege es lo que hay **debajo y a los lados**.

**§2.3 · el documento.** La regla **no está escrita en ningún documento** de `docs/`. El check cita «el diagnóstico A2b §5», que no está en el repo. La única fuente era el comentario del check (11) en el arnés, y es lo que se actualizó. No se tocó ninguna otra regla.

**Controles** (copia `ctl2`, una carta `.flying-card` falsa de 60×100 durante 300 ms):

| Control | Cuándo | Carta | Resultado |
|---|---|---|---|
| banda | en el primer instante con la banda **visible** (`bandaVis: "visible"`, tope 766,5) | de 716,5 a 820,5 | **`FAIL [vuelosBanda]`**, `vuelo banda 54 (1f) zona 0` · código 1 |
| zona | en reposo, banda oculta | de 813,5 a 917,5, zona hasta 863,5 | **`FAIL [vuelosZona]`**, `vuelo banda — (0f) zona 54` · código 1 |

Un primer intento del control de banda inyectó cuando la banda ya se había ocultado (`bandaVis: "hidden"`) y salió verde. No probaba nada, así que se rehízo con un vigía que inyecta en el primer fotograma con la banda visible.

**§2.5 · la reproducción**, mesa 2, 1280×720, `?apu=allinHumano`, regla nueva:

| Corrida | Humano retirado | Máximo | `vuelos.banda` | `vuelos.zona` |
|---|---|---|---|---|
| `c_repro_1` | sí | **609,97** | 0 fotogramas con banda visible y vuelo → **verde** | 0 px fuera (la zona baja hasta 698) → **verde** |
| `c_repro_3` | sí | **609,97** | ídem → **verde** | ídem → **verde** |
| `c_repro_2` | no | 590,97 | verde | verde |

El sobrante cae en una fase sin banda y dentro de la zona: verde por la razón correcta. (Esas celdas salen con código 1 por `cicloVisibility`, no por los vuelos. Es la mezcla del molde con la recarga: H3b-ii-2.)

---

## §3 · El verde falso de `apu.7` (H3b-2)

**§3.1 · la evidencia.** En la copia `ctl2` se volcaron las cuatro vías de `APU_EN_PAGO` en tres momentos: antes del clic en All-in, justo después, y cuando la espera daba el pago por llegado. Tres corridas de `apu 360x640`:

| Corrida | Antes del clic | Tras el clic | Al «pago» | ms |
|---|---|---|---|---|
| `v_apu_1` | las 4 falsas · fila `×1|×2|×5|×10|All-in (25)|Retirarse` | **`recMotivo: "automatica"`**, sin botones | lo mismo | **2** |
| `v_apu_2` | las 4 falsas | **`recMotivo: "forzosa"`**, sin botones | lo mismo | **2** |
| `v_apu_3` | las 4 falsas | `recMotivo: null`, botón «Sin descartar» | **`recMotivo: "forzosa"`**, sin botones | **3 814** |

**Es la vía `data-rec-motivo`, en las 3.** Esa marca es la pregunta de recarga **pendiente**: el All-in deja la pila bajo el listón y la pregunta queda puesta en el acto, o al cerrarse el descarte, con la mano aún en juego. Nunca se vio «Siguiente mano», ni la burbuja ni la tarjeta. El 3 792 ms de 3b era esto mismo: la espera jugó el descarte y el «pago» llegó con la pregunta, no con el pago.

**Por qué una prueba de transición pura no habría bastado:** esa vía *sí* era falsa antes del clic. La pasa a verdadera el propio All-in.

**§3.2 · el arreglo** (D3, las dos cosas a la vez):
- `APU_PAGO_VISIBLE` (`diagDSK.mjs:1698`) solo mira señales que existen en el pago: «Siguiente mano», la recarga voluntaria (`recargar`), o la pregunta **ya pintada** (burbuja o tarjeta), que REC-1 solo pinta al terminar la revelación. Devuelve cuál fue.
- **Transición** (`:2672-2700`): `pagoAntes` se lee antes del clic. Si ya era cierta, `apu.7` no da el pago por llegado y sale rojo con el motivo en el log.
- `APU_EN_PAGO` **no se tocó**: lo usan bucles que deben pararse ante la pregunta pendiente.
- El JSON lleva `pagoAntes` y `senalPago` (`:2717`).

**§3.3 · control.** Con la condición corregida, en las 5 corridas de `apu 360x640` del repo:

| Corrida | `apu.7` | ms hasta el pago | Señal | `pagoAntes` |
|---|---|---|---|---|
| `apu360_1` | ok | **3 751** | burbuja | null |
| `apu360_2` | ok | **7 584** | burbuja | null |
| `apu360_3` | ok | **7 489** | burbuja | null |
| `apu360_4` | ok | **3 792** | burbuja | null |
| `apu360_5` | ok | **7 822** | burbuja | null |

Con el predicado viejo, la misma escena daba 2 ms (`v_apu_1`, `v_apu_2`). Con el nuevo, el tiempo es el de una mano que de verdad termina: revelación más burbuja (~3,7 s), o con un descarte en medio (~7,5 s). **Ninguna corrida tuvo que rechazarse por `pagoAntes`:** la transición se cumplió en las 5.

**§3.4 · corridas.** - **360×640 ×5:** **5/5 verdes**, código 0. Los seis puntos de teléfono en verde en las 5, `tel.forzosa` incluido (no reproduce H3b-ii-5).
- **Matriz completa:** `diagDSK apu`, 2 135 s, código **1**.

| Parte | Resultado |
|---|---|
| REC-2 (recarga con saldo insuficiente) | **18/18** |
| Mesa de APU-1 · 360×640 | OK · `apu.7` al pago en 3 747 ms (burbuja) |
| 640×360 | OK · 7 419 ms (burbuja) |
| 844×390 | OK · 7 994 ms (burbuja) |
| **1024×768** | **FALLA, solo por la consola.** `apu.1`–`apu.7` las siete `true` · `apu.7` 7 531 ms (burbuja) · consola: `error: Failed to load resource: net::ERR_CONNECTION_CLOSED` y `warning: SAL-A: error inesperado de la base — TypeError: Failed to fetch` |
| 1280×720 | OK · 3 622 ms (burbuja) |
| 1366×768 | OK · 7 886 ms (burbuja) |
| 1920×937 | OK · 7 613 ms (burbuja) |

El rojo es un corte de red con el Supabase real, que el arnés en 5173 consulta sin necesidad (H-7 de la Fase 0). No es del juego ni del arreglo. No se repitió la matriz por el tope.

---

## §4 · La mesa reducida en vivo (D4)

`a1 5 1920x937` en el repo, 3 a la vez, hasta que quebrara una IA (`scratchpad/arn3b-ii/cazar.mjs`). **Se lanzaron 10. La 7.ª dio la quiebra**: las 09 y 10 ya habían salido de los otros carriles, y las 10 salieron verdes.

```
T5 1920x937 origen (655.67,581.5) Δ=0 · gaps pila→c1=16/16 T=18/18 · mazo (592.17,606.5) esp 592.17 Δ=0 · línea 2f fit=true peor=181/186 · resto Δ=0.02 · mesa reducida 5→4 desde h2t0 (93 frames aparte) · OK
```

| Exigencia | `a1_07` |
|---|---|
| La celda sale verde | **`passed: true`, `estado: "medida"`**, código 0 |
| Los fotogramas desde el cambio de vivos, apartados y contados | **93**, desde `h2t0` (el primer tick de la 3.ª mano), de 5 a 4 vivos (`juego.mesaReducida`) |
| Lo medido antes de la quiebra con Δ = 0 | **199 fotogramas medidos**. Origen `dX` 0 y `dY` 0 · mazo 0/0 · huecos 0/0 · `dZoneTop`, `dZoneH`, `dBar`, `dLeftX`, `dLeftY`, `dCenterY`, `dRightR`, `dRightY` y `dTimerY` en 0 · `dCenterSym` 0,02 (la simetría de la columna central, dentro de su tolerancia de 0,5) |
| La ceremonia de encogimiento, contada | **`ceremonias: 1`** |

Además: 3 manos y 3 cerradas, 0 sin cerrar, 0 fantasmas, el humano se retiró 1 vez.

**Lo que esta corrida no enseña:** cuánto se movía el abanico en los 93 fotogramas apartados. No se guardan, y la Fase 0 midió 36,83 px para una mesa de 5 reducida a 3. Si el rector quiere ese número para la reducción de 5 a 4, es una línea más en `resumenJuego`.

---

## §5 · Las corridas pendientes de 3b

### §5.3 · `a2` completo, con la regla de §2

**20/20 verdes, código 0** (783 s). En las 20 celdas: `vuelo banda — (0f) zona 0`.

| Mesa | 1024×768 | 1280×720 | 1366×768 | 1920×937 | 1440×850 |
|---|---|---|---|---|---|
| 5 | 638,97 | 590,97 | 638,97 | 748,48 | 679,98 |
| 4 | 638,96 | 590,96 | 638,96 | 748,48 | 679,98 |
| 3 | 638,96 | 590,96 | 638,96 | 727,66 | **699,67** |
| 2 | 638,97 | 590,97 | 638,97 | 727,66 | 674,67 |

(Máximo de las cartas en vuelo dentro de la zona; es informativo, la puerta ya no lo lee.)

- **T3 1440×850 llegó a 699,67** con la banda en 698: el sobrante de 29 px de §1, que se dio solo, sin molde. Con la regla vieja era rojo. Hoy es verde porque cae en una fase sin banda y dentro de la zona.
- **`vuelos.banda` no midió nada en ninguna de las 20** (0 fotogramas con banda visible y carta en vuelo). En juego natural la banda solo vive en el pago y en el pago no vuela ninguna carta. La puerta es una **guarda**: que sabe fallar lo demuestra su control (§2.4), no esta corrida. No se marca «sin cobertura» porque no es un caso que el azar deje de dar: hoy no existe por diseño (H3b-ii-6).

### §5.2 · P11 de 3b: el resto del arnés

Seis modos, como mucho 6 a la vez con lo que seguía corriendo. `cap` y `voz2` con `--sin-build`, sobre el `dist/` compilado minutos antes con este mismo árbol (`src/` sin cambios), para no compilar dos veces a la vez sobre la misma carpeta.

| Modo | ARN-3a | Hoy | Código | Duración |
|---|---|---|---|---|
| `diagPUE cap` | 31/31 | **31/31** (`TODO VERDE`) | 0 | 156 s |
| `diagPUE voz2` | 222/222 | **222/222**, burbuja incluida | 0 | 613 s |
| `diagSAL sal` | 102/102 | **verde** | 0 | 100 s |
| `diagCEL0 diagnostico` | 16/16 | **audio 11/11 · molde 4/4 · control verde** | 0 | 32 s |
| `diagDSK lob` | 6/6 | **verde** | 0 | 16 s |
| `diagDSK msg` | verde | **compositor 92 casos · jugado 7/7 · fin 1/1 · Δ larga 7/7 · caza 2/2** | 0 | 1 078 s |
| `diagPUE todo` (**solo**, D5) | 1, solo `1.8b` | **195 mediciones, 1 en rojo: `1.8b`** (222,0 KiB, FCP 124 ms, el rojo conocido). `dis.relevo` verde | 1 | 279 s |

**Mismo veredicto que en ARN-3a en los siete.**

### §5.1 · `rec`

**No corrido.** D5 lo quiere solo, sin ningún otro modo en paralelo, y dura unos 15 min. La matriz de `apu` ocupó la máquina hasta las 01:58, y `diagPUE todo` (también solo) hasta las 02:03. Con el tope a las 02:09 no cabía.

El reintento de p7 con D4 (3b §1.4) sigue escrito y sin ejecutar. La orden, para correrlo solo:

```
node scripts/diagDSK.mjs rec --puerto=5486
```

### §5.4 · varas

- `vite build`: limpio.
- `vitest`: **1 145/1 145**, 42 archivos. 3b-ii no añade piezas puras: la regla de vuelos y el predicado del pago viven en la página.
- `eslint`: **✖ 21 problems (20 errors, 1 warning)**, los mismos tres archivos de `src/`.
- **Una primera pasada de vitest falló al cargar** (H3b-ii-3). Repetida, verde.

---

## §6 · La foto de partida actualizada (los 43 modos)

La tabla de 3b §5, completada con 3b-ii. «No corrido» significa que el modo no se tocó en 3b ni en 3b-ii; vale su último estado (Fase 0 o ARN-3a).

| Modo | Fase 0 | Tras 3b + 3b-ii | Dónde |
|---|---|---|---|
| `build` | verde | **verde** | 3b-ii §5.4 |
| `vitest` | rojo en copia limpia (B7) | **1 145/1 145** con volcados | 3b-ii §5.4 · B7 es de 3c |
| `eslint` | 21 | **21** | 3b-ii §5.4 |
| `banco:verificar` | verde | no corrido | no se tocó |
| `diagPUE todo` | 1.8b + `dis.relevo` | **1, solo `1.8b`** (222,0 KiB) · `dis.relevo` verde corriendo solo | 3b-ii §5.2 |
| `diagPUE cap` | verde | **31/31** | 3b-ii §5.2 |
| `diagPUE voz2` | verde | **222/222** | 3b-ii §5.2 |
| `diagSAL sal` | verde | **verde** | 3b-ii §5.2 |
| `diagCEL0 diagnostico` | verde | **verde** (audio 11/11, molde 4/4) | 3b-ii §5.2 |
| `diagCEL0 celebracion` | rojo (H-5) | no corrido | 3c |
| `lob` | verde | **verde** | 3b-ii §5.2 |
| `retar` | verde | no corrido | no se tocó |
| `gate` | verde | no corrido | no se tocó |
| `p1` · `p2` · `tactil` | verde | no corridos | bucles hermanos, aplazados (§7) |
| `r1` · `r2` | verde | no corridos | `playToShowdown`, hermano aplazado |
| `o1` | verde | **verde 16/16** · D9: 0 geométricas | 3b P10 |
| `o2` | verde | no corrido | no juega manos |
| `a2` | rojo (`SINCERRAR`) | **verde 20/20** con `vuelos` con alcance · 0 `SINCERRAR` | 3b-ii §5.3 |
| `a1` | verde / 2 rojos en 20 (B4) | **verde 16/16** · T5 1920×937: 20/20 (3b) + 10/10 (3b-ii), **con una mesa reducida en vivo, verde** | 3b P2 · 3b-ii §4 |
| `m1` | **ROTO** (H-1) | **verde 20/20** · D9: 0 geométricas | 3b P1 |
| `h1` | rojo 0/16 (H-14) | **verde 16/16** | 3b P4 |
| `f1` | verde | **verde 16/16** | 3b |
| `z1` | rojo intermitente (H-4) | **verde 16/16** | 3b P7 |
| `u1` | rojo conocido (`hits 0/8`) | **20/20 celdas**, `hits 0/8` (el mismo rojo) | 3b · aplazado (APU-1 C-1) |
| `menu-movil` · `u2` · `u3` · `vc` | verde | no corridos | no se tocaron |
| `msg` | verde | **verde** | 3b-ii §5.2 |
| `tapetes` | **rojo** (H-3) | **verde** | 3b P5 |
| `vuelo` | **rojo** (H-13) | **verde 2/2** | 3b P6 |
| `luz` · `rev` | verde | no corridos | H-2 de LUZ-1 cerrado (3b §3) |
| `rec` | rojo intermitente (H-4) | **no corrido**, ni en 3b ni en 3b-ii. D4 escrito, sin probar | 3b-ii §5.1 |
| `apu` | rojo intermitente | **360×640: 5/5 verdes con el pago bien medido** (más 10/10 en 3b con el predicado viejo) · matriz: **REC-2 18/18 · mesa 6/7**, con la celda roja por un corte de red con Supabase en la consola (H3b-ii-7) | 3b-ii §3 |
| `d1d2` · `d3` · `bug` · `shots` · `b1` | informativos | no corridos | |

---

## §7 · Aplazados, con dueño

| Aplazado | Dueño | Por qué |
|---|---|---|
| El molde `allinHumano` descuenta la entrada elegida | **ECO-1** | La causa vive en `App.jsx:529` (producto), no en `src/dev/` |
| El diálogo de compra de tapetes sin clave en `textos` («¿Comprar **X** por N Heptacoins?», `TapetesPanel.jsx:115`) | **IDI-1** | Copy de producto. El arnés ya no lo compara contra un literal |
| Los bucles hermanos de 3b §1.4: `playToShowdown`, `jugarHasta`, `lineaAllinEnMesa4`, `runTactil`, `runP1`, `runP2`, `runU2`, `vcHastaVictoria`, `msgJuegaUnaMano`, `luzLlevarAlDescarte`, `revCelda` | **la campaña que los toque** | D2 de 3b: se anotan, no se migran de golpe |
| `u1` `hits 0/8` | quien abra `UtilitiesMenu` (APU-1 C-1) | sin cambio |
| El origen de la reposición del descarte (la causa de §1) | **ARN-3d u otra de producto, solo si el rector lo quiere** | Con §1 en «vacío» no es un fallo visible: la regla con alcance lo acepta. Si alguna vez algo se pinta bajo la fila en el descarte, `vuelos.zona` no lo verá, pero la regla de §1 sí habría que repetirla |

---

## §8 · Mapa archivo → commit (3b y 3b-ii juntos)

| # | Commit | Archivos |
|---|---|---|
| 1 | `ARN-3b-1: núcleo — el bucle de autojuego común y los tres estados de celda` | `scripts/arnes/juego.mjs` · `scripts/arnes/juego.test.js` · `scripts/arnes/autojuego.mjs` · `scripts/arnes/nucleo.mjs` |
| 2 | `ARN-3b-2: arnés — los modos sobre jugarMano; vuelos con alcance y el pago de apu.7` | `scripts/diagDSK.mjs` |
| — | documentos | **ninguno**: la regla de `vuelos` no estaba en `docs/` (§2.3) |
| 3 | `ARN-3b-3: informes de ARN-3b y ARN-3b-ii` | `docs/reportes/AJILEI_ARN-3b_Informe_v1.0.md` · `docs/reportes/AJILEI_ARN-3b-ii_Informe_v1.0.md` |

---

## §9 · Hallazgos nuevos (se reportan, no se arreglan)

| ID | Hallazgo |
|---|---|
| **H3b-ii-1** | **El sobrante es de 23 o 29 px, no de 19.** 3b medía contra el tope de la banda (605); la carta baja 23 px desde la fila (586,97 → 609,97) y 29 en 1440 y 1920. Se da en **las cuatro mesas**, no solo en la de 2: siempre que las reposiciones salen del mazo del humano y no van a él |
| **H3b-ii-2** | **`cicloVisibility` de `a2` sale rojo con el molde `allinHumano`.** La banda se ve en el pago, pero «Siguiente mano» no está montado porque la recarga está pendiente, y `enPago` pregunta por ese botón. Sin molde no se ha visto. Es la misma familia que H3b-2: el pago leído por una vía que la recarga altera |
| **H3b-ii-3** | **Una pasada de vitest falló al cargar los 42 archivos** (`TypeError: Cannot read properties of undefined (reading 'config')` y «Vitest failed to find the current suite»). Ninguna prueba llegó a correr. Fue justo detrás de un `vite build` y con 6 arneses vivos. Repetida sola: 1 145/1 145. Causa no investigada |
| **H3b-ii-4** | **La copia nueva arranca en frío:** el primer `a2` en una copia recién hecha, con tres servidores a la vez, no vio el lobby en 30 s y salió con 2. Es lo correcto (H3b-5), pero el primer arranque de cada copia conviene hacerlo solo |
| **H3b-ii-7** | **Un corte de red con el Supabase real pinta de rojo una celda de `apu`** (1024×768: `ERR_CONNECTION_CLOSED` + `SAL-A … Failed to fetch`, con sus 7 puertas en verde). Es H-7 de la Fase 0 con consecuencias: mientras el arnés de 5173 hable con la base real, un corte de red es un rojo. Lo honesto sería que `apu` separase el ruido de red conocido (como ya hace con `APU_RUIDO_CONOCIDO`), o que el arnés no hablase con la base |
| **H3b-ii-6** | **`vuelos.banda` no tiene casos en juego natural.** 0 fotogramas con banda visible y vuelo en las 20 celdas: la banda vive en el pago y en el pago no vuela nada. Hoy es una guarda que solo prueba su control. Si el rector la quiere viva, habría que sembrar un vuelo en el pago (no existe) o dejarla como está, documentada |
| **H3b-ii-5** | **`tel.forzosa` rojo en una corrida de sonda** (`v_apu_3`, copia `ctl2`, con el `apu.7` viejo). Era la tercera de tres corridas de sonda, con 6 arneses a la vez. **No se reprodujo en las 5 del repo** (`tel.forzosa` verde en las 5). No se diagnosticó; queda en vigilancia |

---

## §10 · STOP

**Por qué paró.** Por el tope de 75 min, no por D1: **§1 dio «vacío»** y no apareció ningún rojo del juego. Queda pendiente **`rec`** (§5.1).

**Servidores y navegadores.** Todos los del arnés vivieron dentro de su proceso y murieron con él. A las 02:03 no queda ningún `node` vivo. `netstat` en 4170–4199 y 5000–5599:

```
  TCP    0.0.0.0:5040           0.0.0.0:0              LISTENING       7724
```

Es el `svchost.exe` de Windows (PID 7724), que ya escuchaba al empezar. Ajeno, no se tocó. En los puertos que usó el arnés no escucha nada.

**Copias.** Siguen en `scratchpad/arn3b-ii/`:
- `sonda`: §1, con su parche en `sonda_patch.py`;
- `ctl2`: §2 y §3.1.

Sus uniones a `node_modules` se quitaron con `rmdir`, y el `node_modules` del repo sigue intacto. Allí quedan también las capturas (`fotos/`), los logs de cada corrida y el cazador de §4 (`cazar.mjs`).

**`git status --porcelain`:**

```
 M scripts/arnes/nucleo.mjs
 M scripts/diagDSK.mjs
?? docs/reportes/AJILEI_ARN-3b-ii_Informe_v1.0.md
?? docs/reportes/AJILEI_ARN-3b_Informe_v1.0.md
?? docs/reportes/AJILEI_MOT-1_Fase0_Informe_v1.0.md
?? docs/reportes/AJILEI_MOT-1_Fase1-0_Sonda_Informe_v1.0.md
?? laminas/mon1/_entorno.txt
?? laminas/mon1/lamina.html
?? laminas/mon1/tiempos.json
?? scripts/_cel1bFila.mjs
?? scripts/arnes/autojuego.mjs
?? scripts/arnes/juego.mjs
?? scripts/arnes/juego.test.js
```

Contra el STOP de 3b solo hay una línea nueva: este informe. `diagDSK.mjs` lleva además los cambios de 3b-ii (§2 y §3). `src/` está intacto. Sin `git add`.
