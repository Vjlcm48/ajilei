# AJILEI — Fuentes de audio · Melodías de celebración (campaña CEL)

- **Archivo:** `docs/AJILEI_Fuentes_Audio_Celebracion_v1.0.md`
- **Versión:** 1.0 · sellado al cierre de **CEL-A** (2026-08-24)
- **Alcance:** de dónde sale cada melodía de la pantalla de victoria de mesa, con
  qué licencia entró, y con qué receta exacta se cortó.

> **Por qué existe.** La regla de licencias de VC2 (`AJILEI_Victory_Celebration_v1.0.md`
> §7.3, tras la lección de la lámina GNU): **ningún audio entra al repositorio sin
> licencia verificada y anotada.** Siete pistas nuevas de golpe hacían falta un
> documento, no una nota al pie.

---

## 1. Licencia

**Pixabay Content License** para las siete: uso comercial y modificación permitidos,
atribución no obligatoria. Se registra el autor de todas formas, como buena práctica
y para que una auditoría futura no tenga que reconstruirlo.

**Fecha de descarga:** 2026-08-24.

## 2. Las siete

| Asset final | Nombre de trabajo | Autor | Perfil | ID de pista |
|---|---|---|---|---|
| `celebracion-joropo-01` | joropo1 | Vadim | `pixabay.com/users/vadim_makes_sound-54823268` | 562346 |
| `celebracion-gaita-01` | gaita2 | Alejandro Pinero Amerio | `pixabay.com/users/vjgalaxy-8110364` | 479719 |
| `celebracion-latinjazz-01` | latinjazz3 | Alex Morgan | `pixabay.com/users/alex-morgan-54692529` | 560033 |
| `celebracion-percusion-01` | percusion4 | Bomb Sound | `pixabay.com/users/bombinsound-54782632` | 577424 |
| `celebracion-solemne-01` | celebracion5 | Voldemar SweetFinger | `pixabay.com/users/sweetfinger-49587451` | 353353 |
| `celebracion-brillante-01` | celebracion6 | Andrii Groza | `pixabay.com/users/gr0za-54059129` | 582641 |
| `celebracion-fiesta-01` | celebracion7 | Mykola Sosin | `pixabay.com/users/mfcc-28627740` | 406445 |

Cada una vive en `public/sounds/` en **dos formatos**: `.mp3` y `.ogg`.

**Nombres.** Convención en castellano, confirmada por Victor en la audición de
CEL-A: `celebracion-<carácter>-<NN>`. El `-01` deja sitio a una segunda pista del
mismo carácter sin renombrar la primera. Los cuatro primeros se llaman por su
género; los tres genéricos, por el carácter que se les midió (densidad de ataques,
brillo, cresta) y que Victor confirmó de oído.

## 3. La receta de corte — sellada por Victor, en tiempos absolutos

Idéntica para las siete. Herramienta: **`ffmpeg` 6.1.1** vía `ffmpeg-static`
(devDependency; no hay `ffmpeg` de sistema en el entorno, que es la razón por la que
VC2 tuvo que recortar el rasgueo en reproducción — §7.1 de aquel documento).

| Paso | Valor |
|---|---|
| Segmento | t = 0,000 → **t = 12,000 s exactos** |
| Fade-in | 10 ms (anticlick) |
| Fade-out | desde **t = 9,5 s** hasta silencio en 12,0 (2,5 s de bajada) |
| Sonoridad | **−20,0 LUFS** integrados, la misma cifra para las siete |
| Techo | −1,5 dBTP (no llegó a actuar: el pico más alto quedó en −5,9) |
| mp3 | 44,1 kHz · estéreo · 256 kb/s |
| ogg | 44,1 kHz · estéreo · `-q:a 5` |

Reproducible con `node scripts/audioCEL.mjs cortar -20.0 -1.5` desde los originales.

### 3.1 De dónde sale el −20,0 LUFS

De la familia con la que estas melodías conviven en la pantalla de victoria, no de
un manual:

| Referencia | LUFS del archivo | Volumen en `useSounds` | Lo que se oye |
|---|---|---|---|
| `table-knock.mp3` | −20,0 | 0,6 (−4,4 dB) | **−24,4 LUFS** |
| `ajilei-strum.mp3` | −22,3 | 0,8 (−1,9 dB) | **−24,2 LUFS** |

Los dos sonidos de VC2 caen a **0,2 dB uno del otro** en nivel efectivo. Los cortes
se normalizan al −20,0 del `table-knock` —el golpe que en la coreografía introduce
a la melodía—, así que **a volumen 0,6 la melodía entra exactamente al nivel del
toc-toc que la precede**. Si en CEL-2 resultan altas, se baja el volumen de
reproducción (0,5 → −26,4 efectivos): no hace falta volver a cortar.

> Salvedad: la medida EBU R128 integrada de `table-knock.mp3` (1,9 s) y
> `ajilei-strum.mp3` (3,66 s) es corta para lo que el estándar asume. Se usan
> porque **coinciden entre sí**, no porque sean canónicas.

### 3.2 Dos cosas que se verificaron en vez de suponerse

**El instante de corte.** El contenedor mp3 declara 12,04 s porque LAME rellena el
último fotograma. **Decodificados, los catorce archivos dan 529.200 muestras =
12,0000 s clavados**, y después de la muestra 529.200 no hay nada (−inf dBFS). El
instante sellado se cumple en los dos formatos.

**La ventana de medida.** El primer render normalizó midiendo los 12 s enteros y el
cuerpo de las siete acabó repartido en **0,9 dB** (−19,81 a −20,72): cada pista tiene
distinta energía en los 2,5 s de bajada y eso movía la ganancia. Se volvió a cortar
midiendo el **cuerpo** (0 → 9,5 s), que es el único tramo que suena a nivel pleno.
Dispersión final: **0,02 dB**.

## 4. Cifras finales

| Asset | Duración | LUFS (cuerpo) | Pico | mp3 | ogg |
|---|---|---|---|---|---|
| `celebracion-joropo-01` | 12,0000 s | −20,00 | −8,6 dBTP | 377 KB | 234 KB |
| `celebracion-gaita-01` | 12,0000 s | −19,99 | −9,6 dBTP | 377 KB | 235 KB |
| `celebracion-latinjazz-01` | 12,0000 s | −19,99 | −5,9 dBTP | 377 KB | 240 KB |
| `celebracion-percusion-01` | 12,0000 s | −20,00 | −9,9 dBTP | 377 KB | 234 KB |
| `celebracion-solemne-01` | 12,0000 s | −19,98 | −7,6 dBTP | 377 KB | 211 KB |
| `celebracion-brillante-01` | 12,0000 s | −20,00 | −8,1 dBTP | 377 KB | 241 KB |
| `celebracion-fiesta-01` | 12,0000 s | −20,00 | −10,3 dBTP | 377 KB | 224 KB |

**Peso.** Los catorce cortes suman **4,16 MB** (mp3 2,58 + ogg 1,58). Las siete
originales largas, que llegaron a estar en `public/sounds/` y por tanto habrían
viajado en la PWA, sumaban **22,58 MB**: se retiran en CEL-A y quedan en las
descargas de Victor. `public/sounds/` pasa de **23,22 MB a 4,67 MB**.

## 5. `win.mp3`, dado de baja

VC2 jubiló la fanfarria genérica y dejó el archivo en el repositorio sin uso, con la
nota de que borrarlo era otra tanda (`Victory_Celebration_v1.0.md` §7.2). **Esa
tanda fue CEL-A.** Con cero disparos confirmados —`grep` acotado al sonido en todo
el árbol, sin un solo `play('win')`— se retiran el archivo y su entrada de registro
en `useSounds.js`.

**No confundir con `ajilei-strum.mp3`, que está VIVO** y no se toca: es el rasgueo
de la mano perfecta (`sonidoDe('ajilei')`).

## 6. Estado

Las siete **quedan sin conectar**. CEL-A es taller de audio: ningún disparo del
juego cambia. La bolsa aleatoria y el enganche a la pantalla de victoria son CEL-2.
