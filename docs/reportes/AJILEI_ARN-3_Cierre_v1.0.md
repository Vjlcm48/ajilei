# AJILEI · ARN-3 · Higiene del arnés · Cierre de la serie · v1.0

**Fecha:** 2026-10-03.
**Ficha:** `AJILEI_ARN-3e-ii_v1.0.md` §5 (ficha madre `AJILEI_ARN-3e_v1.0.md`).
**Base:** los informes de la serie, en `docs/reportes/`:
- `AJILEI_ARN-3_Fase0_Informe_v1.0.md`;
- los de `ARN-3a`, `ARN-3b`, `ARN-3b-ii`, `ARN-3c` y `ARN-3d`;
- los dos de `ARN-3e` (Fase 0 y Fase 1).

La tabla de aplazados es la de `ARN-3e_Fase0` §E, puesta al día.

**Para qué sirve:** es el punto de partida de la próxima campaña que use el arnés. Las reglas que la serie dejó viven en el registro, `docs/AJILEI_Invariantes_v1.0.md`. Aquí queda la historia: qué hizo cada tanda, qué quedó pendiente y en qué estado están los modos.

---

## 1 · La serie en una tabla

| Tanda | Qué hizo, en una línea | Commits | ¿Tocó el producto? |
|---|---|---|---|
| **Fase 0 de ARN-3** (2026-10-01) | El censo del arnés: 43 modos, sus rojos de instrumento, el navegador que derivaba y la semilla del registro de invariantes (~350 reglas) | `52e570b` (el remiendo previo de `msg`) · el informe va en `c50c36d` | No |
| **ARN-3a** | El terreno común: navegador sellado, servidor dentro del proceso, puertos ajenos respetados y códigos 0/1/2 | `280de66` · `90b6e11` · `c50c36d` | No |
| **ARN-3b** | El bucle de autojuego común (`jugarMano`) y los tres estados de celda (`cobertura` ≠ rojo) | `33ed71c` · `83decea` · `2b96e09` | No |
| **ARN-3b-ii** | `vuelos` con alcance, el pago de `apu.7` por su señal y `rec` de vuelta en verde | (dentro de `83decea` y `2b96e09`) | No |
| **ARN-3c** (3c-i + 3c-ii) | Aislamiento de la red, `lob`/`msg` contra el bundle real con semillas, `congelado`, varas por mayoría de 3, encadenado honesto, y la retirada de 16 `verify*` y de las capturas rastreadas | `5f979e9` · `d0dbd08` · `ffcfe74` · `5cc97e7` | No |
| **ARN-3d** (Fase 0 + 3d-i + 3d-ii) | La mesa diferida con su precarga en el lobby, la decisión de recarga del chunk, sonidos a tiempo, `diagPUE mesa`, y el CSS y el modal muertos fuera | `d4e491a` · `f19c3c1` · `c3055f0` · `7db208c` | **Sí:** 16 archivos de `src/` (mesa diferida, `inert`, sonidos, CSS y modal muertos) |
| **ARN-3e** (Fase 0 + 3e-i + 3e-ii) | Las huellas de los protegidos, `!important`, claves y avisos vigilados por prueba; `humo` en lugar de `all`; `apu.5` en una lectura y con `cobertura`; el blindaje de H3e-i-1; E-22 cerrado; el registro de invariantes y la doctrina corregida | **sin commitear**: los 4 commits del mapa de `ARN-3e_Informe` §3e-ii.7 | **Solo un comentario** en `src/styles/playingCard.css`, con el `dist/` idéntico byte a byte (D10) |

**ARN-3 en cifras** (de la Fase 0 a la 3e-ii):
- **vitest:** de 1 175 pruebas en 44 archivos (3c) a **1 312 pruebas en 53 archivos**.
- **Ningún protegido cambió en toda la serie.** Lo comprobó la Fase 0 de 3e, y desde la 3e-i lo vigila `testProtegidos`.
- **Ningún informe de la serie se reescribió:** son historia.

---

## 2 · La tabla única de aplazados, al día

Es la tabla de `ARN-3e_Fase0` §E. Se renumera aquí: la columna «F0» da su número allí.

### 2.1 · Vigentes (21)

| # | F0 | Qué | Dueño | Estado al cierre |
|---|---|---|---|---|
| 1 | 1 | El saldo 2 800 frente a 2 933 ms (×5) | **CEL-2c** | Vigente. Los 5 conocidos de `diagCEL0 celebracion` |
| 2 | 2 | `u1` `hits 0/8` | **quien abra `UtilitiesMenu`** (APU-1 C-1) | Vigente. No se corrió en 3d ni en 3e |
| 3 | 3 | **H3d-3** · `wrangler.jsonc` sirve `index.html` con 200 cuando falta un chunk | **la campaña de despliegue** | Vigente |
| 4 | 4 | **H3d-ii-5** · `#root` se vacía menos de 0,2 s antes de la recarga de entrada | **quien añada un `ErrorBoundary`** | Vigente, aceptado |
| 5 | 5 | **H3d-ii-1** · un All-in con la mejor mano no se celebra como mano ganada | **VOZ-3** (ARN-3e D13) | Vigente, con dueño |
| 6 | 6 | `.btn-soon` y `.soon-tag` muertos en `gameTable.css` | **quien abra `gameTable.css` con autorización** | Vigente |
| 7 | 7 | La guarda `arranca` sin sellar | **el registro (INV-25)** | Vigente, aceptado como límite declarado |
| 8 | 8 | `retirado`, «no alcanzable» | **el registro (INV-25)** | Vigente, aceptado |
| 9 | 9 | Los generadores de assets fuera del arnés (Edge, sin `navegadorArnes`) | **la próxima campaña que regenere assets** | Vigente |
| 10 | 10 | El molde `allinHumano` descuenta la entrada elegida | **ECO-1** | Vigente |
| 11 | 11 | El diálogo de compra de tapetes sin clave en `textos` | **IDI-1** | Vigente |
| 12 | 12 | Los bucles hermanos (`playToShowdown`, `jugarHasta`, `lineaAllinEnMesa4`, …) | **la campaña que los toque** | Vigente. `jugarHasta` se tocó en 3e (devuelve el valor de la condición), pero no se migró |
| 13 | 16 | El orquestador C (una foto de todos los modos en 6 carriles) | **ARN-4** (ARN-3e D14) | Vigente, con dueño. Unos 60 min de escribir y ~1 h 40 por corrida (`ARN-3e_Fase0` §D4) |
| 14 | 17 | `apu` 360×640: `tel.blanda`, intermitente | **en vigilancia** | **No ha vuelto:** 3d mesa 7/7; en 3e, 360×640 ×5 verde y la matriz entera verde |
| 15 | 18 | `tel.forzosa`, rojo una vez en sonda | **en vigilancia** | No ha vuelto (3b-ii ×5, 3c, 3d, 3e) |
| 16 | 19 | `vuelos.banda` sin casos naturales (es una guarda) | **el registro (INV-20)** | Vigente, documentado |
| 17 | 20 | El origen de la reposición del descarte (23–29 px sobre el tapete) | **una campaña de producto, solo si el rector la quiere** | Vigente. Lo vigila `vuelos.sobrante` |
| 18 | 21 | **H3b-ii-3** · un fallo de carga de vitest, tras un build con 6 arneses | **en vigilancia** | Vigente. Ver la fila 19: volvió en 3e-i |
| 19 | — | **H3e-i-3 (nuevo)** · vitest no cargó sus 52 archivos («no tests») una vez, sin ningún arnés vivo. Dos repeticiones salieron verdes | **en vigilancia** | **Volvió una vez en 3e-ii** (08:13), con las copias ya en su caché propia (`CTL_CACHE`). Así que la primera sospecha, la caché `node_modules/.vite`, se debilita. La nueva es `node_modules/.vite-temp`, donde Vite empaqueta `vite.config.js` al arrancar: la comparten la copia y el repo por la unión, y en ese momento arrancaba un dev en la copia. Un intento de reproducirlo (vitest completo mientras arranca un dev en la copia) salió verde. **El error exacto no se guardó:** la próxima vez, la salida entera a un archivo antes de repetir |
| 20 | 22 | **Los pendientes de iOS** | **la sesión intensiva de iOS de Victor** | Vigente. Las marcas, en §3 |
| 21 | — | **H3e-ii-1 (nuevo)** · el piso de 36 px de `apu.6` nunca midió un botón (verde vacío). La fila de apuestas mide **28 px en 360×640 vertical**, por debajo del piso táctil de 40 px (INV-07). El modo `tactil` no lo detecta, sin saber aún por qué | **la próxima campaña de producto de la mesa que toque la fila de acciones** | Vigente. Arreglo decidido: `apu.6` medirá la fila a propósito en el turno del humano, y su rojo irá con la decisión de producto sobre la altura (revisión del STOP-2 de ARN-3e) |

### 2.2 · Resueltos (23)

Los 19 de `ARN-3e_Fase0` §E2 (sus números 23–41) siguen resueltos y no se repiten aquí:
- los `verify*` y las capturas fuera del repo;
- H-7 y el filtro de `401`;
- `rev`, `rec`, `tableKnock`, `1.8b`, `vc`;
- B9, B10, B6 y el comentario de `salta`;
- H3b-1, H3b-2, H3b-ii-2, H3d-ii-4 y el `preloadError` sin red.

Cada uno conserva allí su prueba. ARN-3e resuelve **cuatro más**:

| F0 | Qué | Resuelto en | Prueba |
|---|---|---|---|
| 13 | **E-22** · el rojo intermitente de `msg` (mesa 5 a 1366×768) | ARN-3e-i, D15 | 6/6 verdes con `--semilla=azar`, **15 en verde en total** (9 de 3c + 6). Cerrado como «no reproducible en el terreno de hoy» (bundle real, sesión simulada, sin red). Las 6 bases nuevas: 531546261, 1064097484, 906666771, 372832977, 125239192 y 488996419; las 9 de 3c, en `ARN-3c` §16 |
| 14 | **`apu.5`** · la carrera de lectura (H3c-ii-3) | ARN-3e-i (una lectura, en el pago) y ARN-3e-ii (D16, `cobertura`) | Controles en copia: lectura tardía con el código viejo → rojo, y con el arreglo → verde; el hueco real → la condición vieja, rojo. 3e-ii: sin pozo partido → `cobertura`; sin frase o sin tono → rojo. Vara: `apu 360x640` ×5 y la matriz, verdes |
| 15 | **`all` → `humo`** | ARN-3e-i, D12 | `humo` verde, código 0, en 2 min 44 s. `all` termina con código 2 y su mensaje. `nucleo.test.js` |
| — | **H3e-i-1** · compilar después de crear un dev en el mismo proceso deja inservible al dev | ARN-3e-i (el orden de `humo`) y ARN-3e-ii (el blindaje, D17) | El orden viejo, en copia: **código 2 en 1 s con el motivo**, en lugar de un timeout a los 30 s. El orden nuevo: verde, código 0. `nucleo.test.js` (`decidirBuild`) |

---

## 3 · Los pendientes de iOS (solo las marcas)

Son las de `ARN-3e_Fase0` §E3, al día: **38 marcas en 13 campañas.** ARN-3e no añade ninguna.
- Su línea, por INV-41 (D20): **«iOS: nada que validar (ARN-3e no toca lo que se ve)».**
- El único cambio de `src/` es un comentario, con el `dist/` idéntico.

| Campaña | Marcas | Qué espera al iPhone |
|---|---|---|
| FRZ-1 | 5 | el camino `pagehide` de iOS |
| AJF-1 | 1 | ídem |
| CAR-1 | 3 | AVIF en iPhone |
| PUE | 4 | *standalone* en iOS, `checkVisibility`, `mix-blend-mode`, la hoja móvil |
| MON-1 | 3 | VP9 con alfa en Safari |
| DIS-1 | 4 | el marco del teléfono y el 3D en WebKit real |
| BIE-1 | 2 | el desbloqueo del audio de Howler |
| LUZ-1 | 5 | el vistazo visual de la luz |
| REV-1 | 2 | el vistazo del reverso |
| REC-1 | 1 | el vistazo de la burbuja |
| SAL-B1 | 1 | los tres dispositivos |
| SAL-B2 | 3 | E9, el iPhone de Barcelona como invitado |
| ARN-3d | 4 | la lista de 7 pasos de la mesa diferida |

**ARN-3a, 3b, 3b-ii, 3c y 3e no llevan ninguna marca:** no tocaron nada que se vea en un teléfono.

La lista de pruebas se escribirá cuando Victor tenga los dispositivos.

---

## 4 · La foto de partida para la próxima campaña

El estado de los modos al cierre. «Dónde» es la corrida más reciente. **Lo que no se corrió en 3d ni en 3e se dice**, con su último estado conocido (`ARN-3c` §17).

### 4.1 · Medido en ARN-3d o ARN-3e

| Modo | Estado al cierre | Dónde |
|---|---|---|
| `vitest` | **53 archivos, 1 312 pruebas, verdes** | 3e-ii |
| `eslint` | **21** (la línea base: los tres archivos de `src/` de siempre) | 3e-ii |
| `build` | limpio. El único build de 3e-ii lo hizo `diagPUE voz2` | 3e-ii |
| `diagDSK humo` (`d1d2`, `d3`, `bug`, `shots`, `gate`, `lob`, `retar`) | **verde, código 0**: `gate`, `lob` y `retar` verdes, el resto informativos | 3e-i (repo) y 3e-ii (repo, y copia con build) |
| `diagDSK apu` | **matriz entera verde, código 0** (REC-2 18/18, mesa 7/7, sin huecos). Desde 3e-ii, `apu.5` sin pozo partido sale `cobertura`. **Ojo, H3e-ii-1:** en ese camino `apu.6` puede medir la fila de apuestas de 360×640, que mide 28 px, y salir rojo (pregunta al rector en `ARN-3e_Informe`) | matriz en 3e-i · 360×640 ×2 en 3e-ii |
| `diagDSK msg` | **verde** con la vara 1–15, y 6/6 con semillas al azar (E-22) | 3d · 3e-i |
| `diagDSK vc` | **verde, código 0**, 20/20 | 3d |
| `diagDSK rev` | **verde** | 3d |
| `diagDSK gate` · `lob` · `retar` | **verdes** (dentro de `humo`) | 3e-ii |
| `diagPUE todo` | **195 mediciones, 0 en rojo, código 0** | 3d |
| `diagPUE 1.8` | **verde**, 169,2 KiB | 3d |
| `diagPUE mesa` | **verde 3/3 ×3** (sola) | 3d |
| `diagPUE cap` | **verde**, 31 mediciones | 3d |
| `diagPUE voz2` | **verde** (el orden sano, preview y después dev, con el blindaje de D17 puesto) | 3e-ii |
| `diagCEL0 celebracion` | 5 conocidos de CEL-2c, 0 nuevos, código 1 | 3d |

### 4.2 · No corridos en ARN-3d ni en ARN-3e

Su último estado es el de `ARN-3c` §17:
- **verdes:** `p1`, `p2`, `tactil`, `r1`, `r2`, `o1` (16/16), `o2`, `a1` (16/16), `a2` (20/20), `m1` (20/20), `h1` (16/16), `f1` (16/16), `z1` (16/16), `menu-movil`, `u2`, `u3`, `tapetes`, `vuelo` (2/2), `luz`, `rec` (solo, ~17 min), `congelado` (5/5 guardas), `diagSAL sal`, `diagCEL0 diagnostico` y `diagPUE dis` (5/5);
- **`u1`:** 20/20, con el `hits 0/8` conocido (aplazado 2);
- **informativo:** `b1`.

**Lo que esa foto no garantiza:** ARN-3d cambió el producto (la mesa diferida) y ninguno de estos modos se ha corrido desde entonces. El orquestador de ARN-4 es la pieza que sustituye esta tabla a mano por una foto automática.
