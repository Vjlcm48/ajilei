# AJILEI · PAN-1 · Piso táctil y pantalla completa · Informe de cierre v1.0

**Fecha:** 2026-10-05.
**Ficha:** `AJILEI_PAN-1_1c1d_PantallaCompleta_Cierre_v1.0.md` (Pasos 7 a 9).
**Estado:** la campaña cierra con este informe. El SHA de este commit lo da el push (§2).

## §1 · Lo que hizo PAN-1

**Fase 0 (2026-10-03).** Midió el piso táctil y la pantalla completa sin tocar el producto. El aplazado 21 confundía la caja visible con la zona táctil: la fila de 360×640 mide 28 visibles, pero 40 efectivos por el `::after` de BT-1. Lo que incumplía INV-07 eran los multiplicadores, la ✕, las fichas de las IA, los nombres del pago y dos filas del ⋮. La pantalla completa cambia la geometría del óvalo al cruzar los cortes de 772 y 900 (pregunta al rector sobre INV-04). Informe: `AJILEI_PAN-1_Fase0_Informe_v1.0.md`.

**1a (2026-10-04).** La lámina `laminas/pan1/` con los tres caminos (H, Z y V) sobre la mesa real, en una copia que no escribe el repo (una unión por paquete y `cacheDir` propio). Victor eligió **Z**: solo zona táctil, sin cambiar nada de lo que se ve. El anexo con el CSS de Z está al final del informe de la Fase 0. Sin commit.

**1b (2026-10-04).** `src/styles/tactil.css`, una hoja aditiva con el CSS de Z literal salvo tres reglas que decidió el rector (la ✕ de las mesas 3 y 4 en apaisado y la tarjeta de recarga: caja de 36 y zona de 40 con `min(0px, calc(50% - 20px))`). Los vigilantes en `scripts/diagDSK.mjs`: `tactil` con 36 páginas (teléfono y escritorio, la ✕ incluida), `apu.6` a propósito, y la vara de zona de la tarjeta y de «Ver la mesa». Informe: `AJILEI_PAN-1_1b_Informe_v1.0.md`.

**1c (2026-10-04 y 05).** La pantalla completa al estilo Netflix en los teléfonos, con la regla R1–R9 de Victor: `src/lib/pantallaCompletaCore.js` y su prueba (10 casos), el oyente en `App.jsx`, la reentrada en «Iniciar mano» y «Siguiente mano», el manifiesto en `fullscreen` y, por decisión del rector, la exclusión `data-sin-pantalla-completa` en copiar y compartir de la sala de espera. La regresión completa dio los mismos veredictos que la base. Informe: `AJILEI_PAN-1_1c_Informe_v1.0.md`.

**1d (2026-10-05).** La doctrina (§3) y este cierre.

## §2 · Los SHA

| Fase | Commit | SHA |
|---|---|---|
| Fase 0 y 1a | sin commit propio; sus informes van en el de la 1b | — |
| 1b | `PAN-1b: piso táctil Z y sus vigilantes` | `8009d4f` |
| 1b | `PAN-1b: informes` | `651c212` |
| 1c | `PAN-1c: pantalla completa` | `77e880b` |
| 1d | `PAN-1d: doctrina` | `353b554` |
| 1d | `PAN-1: informes y cierre` (este informe y el de la 1c) | el de este commit |

Publicados por Victor: `3d1b19e..651c212` (1b) y `651c212..77e880b` (1c).

## §3 · La doctrina que deja (1d)

**Filas del registro que toca PAN-1** (`docs/AJILEI_Invariantes_v1.0.md`):

- **INV-04, precisión** (Victor, 2026-10-03): el óvalo no se toca por diseño ni por contenido; se adapta al tamaño de la pantalla (el giro y la pantalla completa), y el vertical sigue siendo el vertical. Escrita también al final de §13 de `AJILEI_Sistema_Diseno_v1.2.md`, que es su fuente.
- **INV-07:** el vigilante, con el texto de C4 de la Fase 0 al día (36 páginas de `tactil`, `apu.6`, la zona de la tarjeta y de «Ver la mesa», `rec`); la zona se mide por barrido y no por la caja; el nombre del panel revelado no se mide en el pago, y el ganador manda sobre sus vecinos en la revelación. Etiqueta: **vigilado (parcial)**, con el hueco nombrado: Tapetes (`u1`), por el SVG de Cuenta sin tamaño, al punto 12. Deja de ser «doctrina por escribir»: la regla queda en §14 del sistema de diseño.
- **INV-45, nueva:** la pantalla completa, R1–R5, con la exclusión `data-sin-pantalla-completa`. Vigilante: `src/lib/pantallaCompletaCore.test.js`. Lo que el arnés no puede medir (el salto de entrada, el atrás de Android, el aviso de Chrome, el teclado del login y la vuelta de compartir) se valida en el S25. Etiqueta: **vigilado (parcial)**.

**Los otros dos textos:**

- `AJILEI_APU-1_Reglas_v1.3.md:217`: la tarjeta de recarga, con caja de 36 y zona táctil de 40; la forzosa, 42. La línea se cambió en su sitio para que las citas de `:217` sigan valiendo, con una adenda al final del documento.
- `AJILEI_Sistema_Diseno_v1.2.md`, **después de la línea 433** (la 432, que cita INV-03, no se mueve): la precisión de INV-04 al final de §13 y una §14 nueva, «Piso táctil: se mide la zona, no la caja», con la nota sobre tres comentarios del protegido `gameTable.css` que quedaron atrás (no se editan):
  - «aquí no hay presupuesto para 40 reales» (`:2042-2053`): cierto de la caja (28), no un incumplimiento, porque la zona es de 40;
  - «NUNCA a la izquierda» (`:3364-3366` y `:3581-3584`): rige para el botón visible; una zona transparente sobre una esquina sin nada tocable sí puede crecer a la izquierda (mesa 5 en apaisado), y la de mesa 4 lo respeta;
  - «su táctil es deuda aparte» (`:1936-1937`, los multiplicadores): pagada por `tactil.css`.

**Línea de iOS (INV-41):** iPhone: pendiente. Safari no tiene la API de pantalla completa y la función no hace nada; la PWA instalada se abre como antes. Lo que haya que mirar va a la sesión del iPhone.

## §4 · La validación del S25 (Victor, 2026-10-05)

Tal como la reportó Victor:

> Validación del S25 hecha por Victor sobre 77e880b, con la app publicada: V1–V11 todas bien:
>
> V1 primer toque;
> V2 entrada a la mesa sin salto;
> V3 barras desde el borde;
> V4 gesto de atrás (la mano sigue, un toque en la mesa no reentra, "Siguiente mano" sí);
> V5 bloqueo;
> V6 salir de la mesa;
> V7 giro;
> V8 login con teclado;
> V9 PWA reinstalada en pantalla completa sin tocar nada;
> V10 toques de la 1b;
> V11 compartir y copiar como primer toque, y la pantalla completa al volver de WhatsApp.

## §5 · Los aplazados, con su dueño

| Aplazado | Dueño |
|---|---|
| **Tapetes** en el ⋮: `u1` rojo en las 8 corridas táctiles (`item2` 63×35), porque el SVG de Cuenta (`svg.util-ico-cuenta`) no tiene tamaño y desborda 9 px sobre Tapetes | punto 12 |
| **El intermitente de `h1`** (`headsStable`, preexistente en `3d1b19e`) | ARN-4 |
| **`luz` p4_fugas** (`luz.css` vive en el chunk diferido de la mesa y no está en la Portada ni en la sala de espera) | ARN-4 |
| **Las copias de verificación** con `.env.local` y los volcados de APU-1: sin ellos, `apu` aborta con código 2 y vitest se salta una prueba | ARN-4 |
| **El arranque único de la copia** antes de las tandas en paralelo: once servidores sobre una caché vacía se pisan al optimizar las dependencias y dan rojos falsos | ARN-4 |
| **La cobertura de `apu`**, que depende del azar: las IA no llevan semilla en ese modo y la fila de All-in de 360×640 puede no darse en 4 mesas | ARN-4 |
| **`.btn-soon` y `.soon-tag`** (`gameTable.css:783` y `:798`, sin consumidores), y con ellos los tres comentarios desfasados de §3 | aplazado 6 |
| **La ficha de mesa 2 en 915×412**, en el pago, tapada por la carta ganadora de su propio panel (41×21) | anotada, preexistente |
| **El botón de invitar** de la mesa PvP lleva `data-sin-pantalla-completa`, como todo botón que comparta, copie o abra otra app (INV-45) | MES-PvP |
| **Las marcas «iPhone: pendiente»** (D8 de la Fase 0) | la sesión del iPhone |

## §6 · Nota final

`laminas/pan1/` (13 MB) no se commitea. Victor la borra a mano tras el cierre.
