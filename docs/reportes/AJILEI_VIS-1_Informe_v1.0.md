# AJILEI · VIS-1 · Tanda · Informe v1.0 · STOP-V

**Para:** Victor y el rector · **De:** Claude Code · **Fecha:** 2026-11-03
**Ficha:** `AJILEI_VIS-1_v1.0.md` · **Base:** `main` en `3e6f606` · **Sonda:** `AJILEI_VIS-1_Fase0_Sonda_Informe_v1.0.md` · **Lámina:** `AJILEI_VIS-1_FaseL_Lamina_Informe_v1.0.md`
**Estado:** STOP-V aprobado por el rector y Victor. Pruebas A y B de Victor al 100 %.

---

## Resultado

**Todas las varas están verdes y las puertas nuevas salen rojas contra `3e6f606` por lo que VIS-1 arregla.** Lo que el arnés no puede juzgar lo comprobó Victor: lo vio y lo oyó en la PC y en el S25, con todo al 100 % (pruebas A y B, abajo).

| Vara | Resultado | Tiempo |
|---|---|---|
| `vitest run` | 88 archivos, 2075 pruebas, verdes | 8 s |
| `eslint .` | 20 errores + 1 aviso, la línea base; ninguno nuevo | — |
| `diagDSK humo` | código 0 | 796 s |
| `diagDSK cfg` | código 0 | 463 s |
| `diagDSK luz`, con p2 | código 0 | 1413 s |
| `diagDSK lob` | código 0 | 42 s |
| `diagDSK tienda` | código 0 | 64 s |
| `diagDSK tab` | código 0 | 1649 s |
| `diagPUE cap` | código 0, 31/31, tras re-sellar (§4) | 157 s |

---

## Prueba A · PC · al 100 %

`npm run dev` (con el bypass de siempre) y `http://localhost:5173`.

1. **Victoria.** Abre `http://localhost:5173/?cel`, entra en una mesa de 2 y pulsa «Iniciar mano». Espera a que termine la melodía. ¿«Salir de la mesa» y «Ver tu nuevo ranking» se ven igual que antes y se pulsan bien?
2. **Derrota.** Abre `http://localhost:5173/?cel=derrota` y entra en una mesa de 2. La pantalla sale sola.
3. **Texto atenuado.** Rankings, en las dos pestañas (la segunda es la de fondo vino), y Salas. ¿Se lee bien y sigue pareciendo secundario?
4. **La mesa.** Juega una mano. ¿Se lee «Pasó» o «Igualó» en un rival atenuado, y «Se retiró» sigue viéndose apagado?
5. **⚙.** «Eliminar cuenta» sale en el rojo claro. Apaga el sonido y vuelve a encenderlo: al encender se oye el clic, al apagar no.

## Prueba B · S25, por el túnel · al 100 %

`npm run build`, `npx vite preview --host` y el túnel, con la cuenta `test1976`. No hace falta cuenta desechable.

1. **Victoria.** ⚠ **Ganar una mano no basta, aunque la ficha diga eso:** «Salir de la mesa» y «Ver tu nuevo ranking» solo salen al ganar **la mesa entera** (`PantallaVictoria`, con `GAME_OVER`). `?cel` no existe en el bundle, así que hay que desplumar a la IA. Lo más corto es una mesa de 2. Toca los botones con el pulgar, en vertical y en horizontal.
2. **Lobby en verde y en vino.** Rankings en las dos pestañas, Salas y Perfil, con la luz real del teléfono.
3. **Sonido.** Desde ⚙, apágalo y enciéndelo: tiene que oírse el clic al encender. Es lo único que el arnés mide en la señal de audio y no en un altavoz.

---

## 1. Lo construido

| Punto | Cambio | Archivo |
|---|---|---|
| **P1** | Botones de victoria y derrota: caja de 44 reales en vertical; zona de 44 con `::after` en horizontal alto; el apaisado bajo no cambia en victoria, y la derrota sube de 28 a 44. Todo con `calc(44px / var(--escala, 1))` donde hay escala | `src/styles/celebracion.css` |
| **P1b** | `?cel=derrota`, solo en desarrollo: entrega el estado terminal del motor sin abrirlo | `src/dev/siembraCEL.js` |
| **P2** | `--text-muted` a α 0,65 en `.lobby` y `.sal`; la vitrina vuelve a 0,55 en `.vit` | `src/styles/theme.css`, `src/styles/vitrina.css` |
| **P3** | `.opp-status` de α 0,64 a **0,76**, por decisión del STOP-L | `src/styles/luz.css` |
| **P5** | El clic suena al encender el sonido desde ⚙ | `src/components/HojaConfiguracion.jsx` |
| **Extra** | «Eliminar cuenta» a `--lose-red` | `src/styles/hojaConfiguracion.css`; en `eliminarCuenta.css` solo cambia un comentario |

**P4 queda fuera,** por decisión de Victor. **No se tocó:** el motor, Supabase, ninguno de los 6 protegidos ni lo de MOT-1. No hay `!important` ni hex sueltos.

**Lo que sube con el token,** aceptado en el STOP-L: el ojito del saldo, las sillas de las salas y los iconos apagados de la Tienda.

## 2. Las cifras

**P1 · Botones** (`cfg.victoria`, 14/14, con la escala real):

| Ventana | Escala | Caja, victoria | Caja, derrota | Zona mínima |
|---|---|---|---|---|
| 360×640 | — | 44 | 44 | 44,61 |
| 412×915 | — | 44 | 44 | 44,80 |
| 915×412 | — | 44 | 44 | 44,61 |
| 1366×768 | ×1 | 33 / 35, sin cambio | 33, sin cambio | 44,98 |
| 1920×1080 | ×1,3 | 43,38 / 45,38, sin cambio | 43,38, sin cambio | 44,98 |
| 768×1024 | ×1,261 | 44 | 44 | 44,61 |
| 1024×620 | ×0,87 | 27,66 / 29,66, sin cambio | 27,66, sin cambio | 44,31 |

**P2 · Texto atenuado, bajo su tinta** (piso 4,5):

| Dónde | Peor caso |
|---|---|
| Rankings, vino (`cfg.contraste`, 50/50) | **4,81**, «Venezuela», 360×640 |
| Salas | 4,89, «Mesas formándose ahora», 360×640 |
| Tienda, Monedas (`tie.contraste`) | 5,10 |
| Tienda, «No te alcanza» | 5,79 |
| Tienda, Tapetes | 6,20 |
| «Eliminar cuenta» | 5,02 (antes, 2,66) |

**P3 · El rival en la mesa** (`luz` p2: 28 filas, 1056 lecturas):

| Estado | Peor caso | `3e6f606` (m5, 1366×768) |
|---|---|---|
| Normal | **6,43** | 5,17 |
| Atenuado | **4,55**, mesa de 4 en 915×412, verde | 3,77 |
| «Se retiró», exento | 1,21 sobre `vinotinto-claro`; 2,92 sobre verde | 2,49 |
| Mesa de 2 apaisada, exenta | 3,54 / 3,07 | — |

**P5 · Sonido** (`cfg.sonido`, 11/11; el espía de audio, 4/4): al encender, un arranque y pico 0,26, igual que el control; al apagar, pico 0.

## 3. La prueba en rojo contra `3e6f606`

Las puertas nuevas, corridas con el arnés de hoy contra servidores levantados desde una copia de `3e6f606`. A esa copia solo le añadí `src/dev/siembraCEL.js`, para que `?cel=derrota` exista y `cfg.victoria` falle por los botones y no porque falte la ruta.

| Puerta | En `3e6f606` | Por qué falla | Lo que pasa, y es correcto |
|---|---|---|---|
| `cfg.victoria` | **3/14** | Caja 28 / 30, zona 28,61 / 30,61 en vertical; derrota a 28 | Victoria en 915×412, y victoria y derrota en 1920×1080: ya llegaban a 44 |
| `cfg.contraste` | **5/50** | Texto aún a α 0,55; «Eliminar cuenta» a 2,66 | Las 5 celdas del lobby: esa pantalla no lleva este token |
| `tie.contraste` | **6/24** | Texto aún a α 0,55 | El rótulo de la vitrina, que debe seguir a 0,55 |
| `luz` p2 | **rojo** | Atenuado a 3,80 y 3,77 | p1, p3, p4 y p5 verdes: VIS-1 no los toca |
| `cfg.sonido`, espía | **2/4** | Pico 0, 0 arranques al encender | El control y el apagado |

En `luz` corrí solo la mesa de 5 en 412×915, más su fila de 1366×768: era la comprobación de que la puerta falla, no la matriz.

**Un límite que cerré aparte.** En `3e6f606`, `cfg.contraste` y `tie.contraste` fallan porque encuentran el texto a 0,55, sin llegar a medir una cifra. Por eso comprobé la rama de «por debajo de 4,5» sobre el código actual, con un fondo `#8a8a80` inyectado solo en la página de prueba: Monedas pasa de 0 textos bajo el piso a **3 de 3**, con el peor en 2,13.

## 4. Lo que hice sin parar, porque la regla lo permite

- **`eslint`, 9 errores míos.** Faltaba `import { Buffer } from 'node:buffer'` en `scripts/testTinta.test.js`.
- **`tie.contraste`, cambio autorizado.** La vista del artículo se mide sin saldo, para que salga «No te alcanza». La regla de la celda sin medir sigue igual.
- **Las tres maestras, re-selladas con `diagPUE cap --sellar`,** autorizado por el rector. `cap.regresion` salía rojo solo por «Igualó» a 0,76:

  | Foto | Antes del sello, con VIS-1 | Δ > 2 dentro de las cajas de `.opp-status` | Tras el sello |
  |---|---|---|---|
  | Vertical | 99,731 %, Δ máx 30 | 5683 de 6143 | 100 %, 0 px distintos |
  | Horizontal | 99,651 %, Δ máx 23 | 7377 de 7757 | 100 %, 0 px distintos |
  | PC | 99,828 %, Δ máx 22 | 7214 de 7214 | 100 %, 0 px distintos |

  **Lo de fuera de las cajas** en vertical y horizontal parece el otro estado de raster ya conocido, sin demostrarlo píxel a píxel. **`--sellar` reescribe `cap.json` entero:** el bloque `resello` de CAP-2 ya no está en el archivo y sigue en la historia de git, y su campo `campana` sigue diciendo CAP-1, porque el arnés lo escribe fijo. Está anotado en el registro de invariantes.

## 5. Diferencias con lo que dije antes

- **Sistema de Diseño:** va como adenda 11 en `AJILEI_Sistema_Diseno_v1.2.md`, **sin renombrarlo**, aunque en la sonda dije v1.3. Más de 100 citas apuntan a ese archivo con línea, y por eso tampoco añadí líneas antes de la 433.
- **`.opp-status`:** `laminas/vis1/propuesta.css` sigue diciendo 0,75, porque se selló así. Lo que hay en `src/` es 0,76.

## 6. Normativos

- **INV-79, nueva:** el texto atenuado da 4,5 : 1 bajo su tinta, con «Se retiró», los controles apagados y la mesa de 2 apaisada exentos por escrito. INV-07, 59, 68 y 77 quedan al día.
- **Versiones nuevas:** `AJILEI_Configuracion_v1.5.md`, `AJILEI_Victory_Celebration_v1.2.md` y `AJILEI_Tienda_v1.3.md`. Las anteriores llevan su aviso de sustitución.

## 7. El ruido de la foto (los 68.000 px)

Dos fotos seguidas de la mesa, sin tocar nada, a veces difieren en casi toda la ventana:

| | Tandas con cambio grande | Píxeles | Δ máx |
|---|---|---|---|
| Con VIS-1 | 5 de 216 | 68.000–188.000 | 57 |
| `3e6f606` | 3 de 216 | 71.000–169.000 | 57 |

Hay 0 cambios en el DOM y 0 animaciones corriendo. En las parejas guardadas, más del 99,9 % de esos píxeles cambia Δ ≤ 3, y solo de 3 a 21 pasan de Δ 10. **La causa exacta no está demostrada;** parece un redibujado de Chromium. El rector lo trata como ruido del instrumento.

**En las varas no dio ningún rojo.** Sí se ve en `cap.estable`, que lo admite por tolerancia: dos pasadas de PC difirieron en 637.519 px, con el 99,994 % en Δ ≤ 2 y Δ máx 16, y las de la horizontal en 502.375 px, con Δ máx 22.

## 8. Observación por lectura: la derrota casi no se alcanza

**No lo he comprobado jugando; sale de leer el código.** `.game-over-screen` pide `GAME_OVER` con el humano perdedor, pero un humano sin ante abre la recarga forzosa, y decirle que no saca de la mesa sin pasar por esa pantalla. Por eso `?cel=derrota` entrega el estado directamente.

**La pregunta queda abierta:** ¿en qué caso real aparece esa pantalla? No se toca en VIS-1; va a MES-PvP, donde se revisa todo el fin de mesa.

## 9. Pendientes

| Pendiente | Para |
|---|---|
| Que las varas de fotos distingan el redibujado espontáneo de Chromium de un cambio real, junto a T3 | **ARN-4** |
| Portada: `.pue-cta-vacuna` a 4,32 | **ARN-4** |
| Controles apagados, de 1,64 a 3,06: declararlos exentos en la vara | **ARN-4** |
| «Se retiró» por debajo del piso: subirlo pide cambiar la opacidad del panel, en un protegido | **MES-PvP** |
| Mesa de 2 apaisada: la marca del rival pisa los huecos de carta unos 5 px | **MES-PvP** |
| La victoria no cabe en ventanas de poco alto (1280×720, 1280×650, 1024×620) | **MES-PvP** |
| En qué caso real aparece la derrota (§8) | **MES-PvP** |
| **Imágenes públicas sin regenerar:** `dis_telefono.webp`, `dis_laptop.webp` y la tarjeta social siguen con «Igualó» a 0,64 | Cuando se rehagan los recursos de la Portada |

**Sigue sin revisar** lo que la sonda ya decía: los `:hover`, `welcome.css` y parte de la Portada.

## 10. Estado del árbol

- **No va en ningún commit:** `laminas/vis1/` (134 MB; la borra Victor al final), y lo de MOT-1 (`docs/reportes/AJILEI_MOT-1_*` y `laminas/mon1/`), que no he tocado.
- **Sin push:** lo hace Victor.
- **Reparto en commits**, atómico y probado aislado:

| Commit | Contenido |
|---|---|
| `VIS-1 a:` | `src/` y las tres maestras, porque el registro pide el sello en el mismo commit que el cambio |
| `VIS-1 b:` | El instrumento y las puertas: `scripts/arnes/tinta.mjs`, `scripts/cfg/`, `scripts/tie/`, `scripts/diagDSK.mjs` y `scripts/testTinta.test.js` |
| `VIS-1 c:` | Normativos, INV-79 y los tres informes |
