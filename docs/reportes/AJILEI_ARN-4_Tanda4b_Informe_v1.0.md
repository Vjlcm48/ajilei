# AJILEI · ARN-4 · Tanda 4b · Varas sin azar ni ruido · Informe v1.0

**Para:** Victor y el rector · **De:** Claude Code · **Fecha:** 2026-11-03
**Ficha:** `AJILEI_ARN-4_Tanda4b_v1.0.md` · **Base:** `main` en `afd40a3` · **Sonda:** `AJILEI_ARN-4_Fase0_Informe_v1.0.md` §3
**Estado:** STOP-V aprobado por Victor, incluido lo hecho fuera de la ficha. Sin nada visible para el jugador. Ningún protegido abierto.

---

## Qué entró

| ID | Qué | Dónde |
|---|---|---|
| **A6** | El azar del arnés en 5173, sembrado | `scripts/arnes/siembra.mjs`; `APU_SEMILLAS` en `scripts/diagDSK.mjs`; `contextoCap` usa la misma pieza |
| **C5** | `u3Sembrar` sin azar | `U3_SEMILLA` en `scripts/diagDSK.mjs` |
| **A5** (corta) | Repetir ante un rojo de foto | `scripts/arnes/repetir.mjs`; `cap`, `tab`, `tinta.mjs` y sus usuarios |
| **A10a** | La Portada bajo su tinta, solo medir | `diagPUE contraste`, en `npm run varas -- --solo pue.contraste` |

## Las semillas selladas

| Dónde | Semilla | Qué da |
|---|---|---|
| Las 7 celdas de `apu` | 1 | La fila de All-in en la mesa de 2 y el pozo partido en la de 4; en `360x640`, también «Estás all-in» en la de 4 |
| `apu.8`, `apu.9` | 1 | C1 y C3 en la mesa de 2 |
| `u3` | 2 | Recuento del humano en las cuatro mesas, con la banda visible |

Una semilla envejece si cambia el consumo de azar (MOT-1, un cambio de la IA). Entonces el punto sale `cobertura` con el aviso «re-elegir semilla», y se elige otra con `--semilla=N`. Sin la línea, `apu tel.linea` tarda unos 40 s, así que barrer semillas es barato.

## Cifras

| Prueba | Resultado |
|---|---|
| `tel.linea`, dos corridas con la semilla 1 | Iguales: OK, 72 tiradas, caja 68,16 frente a 68,16; 41 y 40 s |
| `tel.linea` con la semilla 5 | `cobertura`, «re-elegir semilla», 39 s |
| `apu`, las 7 celdas, en grupos de tres a la vez | Verdes; entre 4 min 15 s y 5 min 07 s por celda |
| `apu.voz3` | 4/4 verdes, 1 min 12 s |
| `u3` | 20/20 celdas, manos 4/4, banda en las cuatro mesas; 7 min 41 s |
| `cap` | Verde, 0 repeticiones en 6 comparaciones, 2 min 36 s |
| `pue.contraste` | Verde, 2 min 29 s |
| `tab cel` (fuera de ficha) | 25/25 pares, **1 repetición en 44 comparaciones:** `V-cel 390x844 m5 entre@1`, «ruido, 1 repetición» |
| `tienda`, `luz 5`, `tab fuera` (fuera de ficha) | Verdes, 0 repeticiones |
| vitest | 93/93 archivos, 2.150 pruebas |

La semilla 1 en `u3` reproduce el fallo de C5: las mesas de 5 y de 2 acaban sin recuento.

## La Portada: las cifras y lo que decidió Victor

| Texto | 412×915 | 360×640 | 915×412 | 1920×1080 | Decisión |
|---|---|---|---|---|---|
| `.pue-cta-vacuna` | **4,32** | 4,50 | no visible | no visible | **Sube a 4,5 o más en la 4c**, con sus ojos en el S25 |
| `.pue-lema-categoria` | **4,10** | **4,11** | 5,46 | **4,23** | **Sube a 4,5 o más en la 4c**, con sus ojos en el S25 |
| `.entrada-proximamente` | no visible | no visible | no visible | **2,10** | **Exenta:** aviso apagado a propósito de una función que aún no existe |

La puerta dice «pendiente 4c» en las dos primeras y la exención con su motivo en la tercera, que también consta en INV-79. Ninguna sale roja. Un texto nuevo bajo 4,5 se informa como «sin decidir», y solo es rojo no haber medido. El 4,50 de `360x640` está redondeado a dos decimales, así que puede estar justo por debajo: la 4c debe medirlo otra vez.

## Lo que se apartó de la ficha

- **`?apu=allin` en las mesas de 3 a 5:** sembrado es reproducible, y la mano sale idéntica en las dos vistas. En 18 de 18 pruebas hubo all-in y pozo partido. `allin` da C1 en las tres mesas con la semilla 3. **`allin-espejo` no da C3** con las semillas 1, 2 y 3: paga una tercera IA y se lleva el sobrante («El pozo se partió: IA 3 se lleva…»). El comentario de `src/dev/siembraAPU.js` lo dice así. Ninguna vara mide esas mesas: fue una sonda, una vez.
- **`.pue-cta-vacuna` en 1920×1080:** la ficha la esperaba visible, y a ese ancho no se muestra.
- **«Una sola pieza»:** `msgPrng`, `msgSiembraAzar` y `luzSembrar` conservan su copia del generador. Siembran a mitad de página, y unificarlas obligaba a correr `msg` y `luz`.

## Fuera de la letra de la ficha, aprobado por Victor

- `apu tel.linea` y `--semilla=N` en `apu` y `u3`, para elegir una semilla sin correr la celda entera.
- `u3·manos` da `cobertura`, y no rojo, si la mano acaba sin recuento del humano. Con recuento y la banda oculta sigue siendo rojo.
- `tel.linea` y `voz3` bajan de 3 intentos a 1: la misma semilla repite la misma mano.
- Corregido también el comentario de `src/dev/repartoGanador.js`, que decía que las celdas reintentan.
- Corridas parciales de `tienda`, `luz 5`, `tab fuera` y `tab cel`, para ejecutar una vez el código cambiado. `tab fuera` se comparó contra el mismo build, no contra `main`.

## Sin corrida real

- `luz` y `tab` enteros, como pedía la ficha.
- `conRepeticion` en `cap` no llegó a repetir en real: solo se ejercitó en `V-cel`.
- `V-fuera` con ruido: sin caso real, solo su camino sin repeticiones.

## Decisiones de diseño para la 4c

- **`pue.contraste` lee las decisiones de `PUE_DECISIONES`** (`scripts/diagPUE.mjs`). Cuando la 4c suba los dos textos, sus entradas sobran y deben salir en el mismo commit.
- **Una repetición con un contraste bajo de verdad no es ruido:** `pue.contraste` hace las dos repeticiones y sigue informando la cifra, sin nota. Es normal que tarde unos segundos más.
- **Las varas por semilla:** un `cobertura` en la 4c puede ser la semilla, no el código. El aviso lo dice; se comprueba con `--semilla=N`.

## Registro

`docs/AJILEI_Invariantes_v1.0.md`: INV-81 e INV-82 nuevas; INV-79 con la Portada; §2 con el recuento de 82 filas; §3 con la siembra y la repetición; §6 con la fila de `diagPUE contraste` y la de `diagDSK apu`. iOS: nada que medir, porque la tanda no toca nada visible (INV-41).

## Validación de los commits

Con `npm run aislado -- <a> <b> <c> <d> <e> --perfil=rapido`, después de este commit. El resultado va en el resumen de cierre de la tanda, porque este archivo forma parte de lo que se valida.
