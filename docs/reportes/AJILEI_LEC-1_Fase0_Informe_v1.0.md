# AJILEI · LEC-1 · Letra legible · Informe de la Fase 0 · v1.0

- **Fecha:** 2026-11-18 · **SHA:** `295ab7f` (`main` = `origin/main`) · **Sin commits, sin `git add`, sin tocar `src/`.**
- **Tiempo real:** unos 50 min (de 15:05 a 15:55 aprox.), con tres pasadas completas de medición (tope: 90).
- **Instrumento:** guion desechable en el scratchpad, sobre el dev de 5173 con bypass, con el Chromium del arnés, la red aislada (0 escapadas) y la escala real de TAB-1. Cada cifra sale de `getComputedStyle` por el zoom de `#root`. El archivo y la línea que fijan cada tamaño los da el protocolo de DevTools (la regla que gana de verdad).
- **Qué quedó sin mirar:**
  - **Las fuentes del teléfono real.** El texto de `.sal` y del lobby usa la pila del sistema: aquí es la de Windows, y en el S25 o el iPhone los anchos cambian. Los tamaños valen; los márgenes de §D son orientativos hasta la lámina en el S25.
  - **Las mesas de 3 y 4** (la ficha pide 2 y 5).
  - **Con cifra de CSS y sin medir en pantalla** (marcadas «CSS» en §B): el globo de VOZ-2 abierto, la tarjeta de recarga, la burbuja de recarga en T3, el popup de Mano actual y «Sin saldo».
  - **`vuelo` no se corrió** (§E): se leyó su último log y se midió la causa con una sonda de 1 min.
  - **La victoria de mesa contra las IAS** no se abrió: «pantalla final» es la de `?pvp=final-*`, que usa el mismo `GameTable`.

**Contradicciones de la ficha con el repo (manda el repo):**

| La ficha o el cierre dice | El repo dice |
|---|---|
| Protegidos: seis archivos | **Siete** desde v1.9: entró `src/engine/pozos.js` (`AJILEI_Protegidos_v1.0.md:54,103`). LEC-1 no lo toca |
| T4 (1024×768) es traje B | Es **`h`, factor 1** (traje C). `escala.js:7-11`, medido: `data-escala="h"`, `--escala: 1` |
| Tarjeta Llena apretada solo con mesa de 5 a 5.000 | **No.** Basta `entrada === 'llena'` y que la línea no quepa (`SalaOpciones.jsx:303,307,376`). Ver §A, fila 2 |
| Pendiente: el texto del tope de 10 sentadas | **Ya se corrigió en la sub-tanda 8** (`AJILEI_MES-PvP_Sub8_Informe_v1.0.md:92`). El cierre de MES-PvP (`:134`) quedó viejo |
| La moneda se desplaza «en el hueco» hasta soltar la espera (INV-82) | Se desplaza **en el mismo instante**, por la cifra retenida. Ver §E |
| El ⚙ tiene sonido, ritmo, Partida rápida y tapete | El único interruptor del ⚙ es **Sonido**. Partida rápida está en el ⋮, el ritmo en Armar mesa, el tapete en la tienda (§C) |
| «Omitir» entre los botones | Solo existe en el anuncio PvP y en SumaMente |

---

## Los seis tamaños y su traje

| | Tamaño | Mesa | `--u` fuera de la mesa | Zoom de la mesa |
|---|---|---|---|---|
| **T1** | 360×640 | traje A, sin atributo | 3,6 | 1 |
| **T2** | 390×844 | traje A, sin atributo | 3,9 | 1 |
| **T3** | 640×360 | traje B, sin atributo | 3,6 | 1 |
| **T4** | 1024×768 | `h` (traje C) | 6 | 1 |
| **T5** | 1366×768 | `h` (traje C) | 6 | 1 |
| **T6** | 1920×1080 | `h` (traje C) | 6 | **1,3** |

Ningún tamaño cae en la banda P de TAB-3 (410–599 de ancho). `--u` es `clamp(3.2px, 1vmin, 6px)`: por eso T1 y T3 miden igual fuera de la mesa, y T4, T5 y T6 también entre sí.

---

## A · El mapa de la letra pequeña

Entran los textos visibles bajo 12 px en algún tamaño, y los botones o rótulos tocables hasta 13. **320 filas, 43 bajo 10 px** (una misma letra cuenta una vez por pantalla; son **13 familias**). En T4, T5 y T6 no hay ninguna bajo 10: todo lo que baja de 10 es de teléfono.

### A.0 · La letra más chica de cada pantalla

| Pantalla | Filas | Bajo 10 | Más chica en T1 | Más chica en T3 |
|---|---|---|---|---|
| lobby | 5 | 0 | Rankings 10,4 (libre) | Rankings 10,4 (libre) |
| config (⚙) | 17 | 3 | Sí 9,6 (libre) | Sí 9,6 (libre) |
| retar | 19 | 0 | Reto 10,4 (libre) | Reto 10,4 (libre) |
| mesa IAS 2 | 36 | 0 | P 10 (protegido) | P 10 (protegido) |
| mesa IAS 5 | 46 | 12 | Comodín activo · vale 11 8 (protegido, óvalo) | Pozo 8 (protegido, óvalo) |
| mesa IAS 2 · ⋮ | 3 | 0 | No 10 (libre) | No 10 (libre) |
| mesa IAS 5 · ⋮ | 3 | 0 | No 10 (libre) | No 10 (libre) |
| salas | 11 | 2 | Entrada 5.000 HC 8,2 (libre) | Arma la tuya y comparte el código 10,1 (libre) |
| armar mesa | 15 | 0 | Jugadores 10,4 (libre) | Jugadores 10,4 (libre) |
| sala de espera | 20 | 4 | Tú 7,9 (libre) | Tú 7,9 (libre) |
| mesa personas 2 | 45 | 4 | Mano # 10 (protegido) | Pozo 8 (protegido, óvalo) |
| mesa personas 5 | 52 | 12 | Comodín activo · vale 11 8 (protegido, óvalo) | Pozo 8 (protegido, óvalo) |
| tienda | 11 | 3 | Pronto 9,3 (libre) | Pronto 9,3 (libre) |
| rankings | 34 | 3 | Puesto 9,4 (libre) | Puesto 9,4 (libre) |
| pantalla final | 3 | 0 | Salir de la mesa 12 (protegido) | Salir de la mesa 12 (protegido) |

### A.1 · Las cuatro filas obligatorias

**1 · La flecha, la casa y el ⚙ de la carcasa, en T3.**

| | Icono | Caja visible | Zona táctil real en T3 | En T1 |
|---|---|---|---|---|
| Flecha y casa | 21,6 | 31,3 | **≈ 44 × 41** | 44 × 45 |
| ⚙ | 21,6 | 31,3 | **≈ 40 × 44** | 44 × 44 |

- **El 41/40 es la zona táctil**, no el icono. Lo confirma un barrido con `elementFromPoint` en Salas y Armar mesa. El icono es `--ico: 6u` (`salas.css:63`), la caja `--ico-caja: 1,45 × --ico` (`salas.css:64`) y la zona el `::after` que busca 44 (`tactilLobby.css:112-119`).
- **Por qué se queda corta:** la flecha y la casa las corta por arriba `.lob-top` (solo hay 3,9 px hasta ella). El ⚙ tiene su zona anclada a la izquierda y crece hacia el borde, donde solo hay 8,6 px (`tactilLobby.css:178-181`).
- **Veredicto: se puede sin mover nada.** Las tres superan el piso de 40 de la casa, y llegar a 44 no pide mover píxeles:
  - flecha y casa: 2,7 px más de zona **hacia abajo**, donde en T3 solo está el título `h2`, que no se toca;
  - ⚙: 3,7 px **hacia la izquierda** solo en esta banda. La regla de `left: 0` existe por el roce con la casa a 915×412; en T3 la casa queda en otra fila, y hay que comprobarlo en esa medida antes de abrirla.

**2 · La tarjeta Llena de Salas.**

- **Texto:** línea 2, «Te faltan 245.000 HC · Entrada 250.000 HC» (`sal.opciones.mesa.faltan` + `sal.opciones.mesa.entrada`, `SalaOpciones.jsx:329-340`).
- **Tamaños de esa línea:** T1 **8,2** · T2 **8,9** · T3 10,4 (cabe) · T4 **12,4** · T5 17,4 · T6 17,4. Sin apretar sería 10,4 / 11,3 / 10,4 / 17,4.
- **Qué la aprieta:** `.sal-mesa-l2` (`salas.css:522-526`, 2,9u, una línea) en la columna entre las sillas y «Unirme», de 166 px en T1. `useEncajeLlena` (`SalaOpciones.jsx:369-386`) baja la letra lo justo y **no tiene mínimo**.
- **Condición:** no es solo la mesa de 5 a 5.000. Una réplica con el CSS real probó 72 combinaciones (jugadores, apuesta y saldo) y en T1 aprieta **37**, con ejemplos normales para una cuenta de 2.500 HC: mesa de 5 a 100 → 9,2 px; de 4 a 100 → 9,8.
- **Armar la de 5 a 5.000** sí se puede, pero pide 250.000 HC (50 × 5.000).
- **La línea 1 también se corta con «…»:** en T1 y T2 la de la mesa de 5, y en T4 tres de las cuatro tarjetas del molde.
- **Veredicto: solo cambiando el texto o moviendo.** La tarjeta tiene alto fijo (O1). La salida barata es acortar la frase: «Faltan 245.000 · Entrada 250.000» tiene el 78 % de los caracteres, lo justo para volver a 10,4 en T1. Es decisión de lámina.

**3 · Los 8 px del pozo y del comodín.**

- **Reglas:** «Pozo» en `gameTable.css:2715-2717` y comodín en `:2727-2729` (T3, mesas 3–5). El comodín también mide 8 en **T1** por `:2174`.
- **¿Se puede sin tocar el protegido?** **Técnicamente sí.** Son selectores de dos clases, y `escala.css:170-175` ya hace lo mismo para `h` con más especificidad y sin `!important`.
- **¿Sin mover nada?** No del todo. Con el alto congelado, subir «Pozo» de 8 a 9 no cambia el óvalo (Δ 0) pero mueve 7 piezas de dentro. El comodín crece a lo ancho (110 → 121 px a 9) y mueve 1.
- **Veredicto: no se sube.** Ambos están **dentro del óvalo del teléfono**, y esa regla manda (§0 de la ficha, INV-04). El bloqueo no es `gameTable.css`: solo Victor puede abrir una excepción. Ver §P-5.

**4 · El texto del tope de sentadas.**

- **Literal (PvP):** «Demasiados intentos seguidos. Espera un minuto y vuelve a probar.» (`sal.error.demasiados_intentos`, `textos.es.js:258`). **Contra las IAS:** «Demasiados intentos seguidos. Espera un momento y vuelve a intentarlo.» (`textos.es.js:353`). Ninguno nombra el 10.

| Dónde sale | Clase | T1 | T2 | T3 | T4 | T5 | T6 |
|---|---|---|---|---|---|---|---|
| Armar mesa y Retar, sobre el botón (`ArmarMesa.jsx:305`, `RetarIAS.jsx:230`) | `.sal-caja` | 11,2 | 12,1 | 11,2 | 18,6 | 18,6 | 18,6 |
| Salas, bajo el código (`SalaOpciones.jsx:283`) | `.sal-aviso-error` | 10,4 | 11,3 | 10,4 | 17,4 | 17,4 | 17,4 |
| Salas, al tocar «Unirme» (`:214`) | `.sal-toast` | 11,5 | 12,5 | 11,5 | 19,2 | 19,2 | 19,2 |

- **¿Lo verá alguien de la ola 0?** Por el tope de 10, casi nadie: hacen falta 11 sentadas cobradas en un minuto. **Sí por otra vía:** unirse por código tiene tope de **5 por minuto** (`20261104170000_mot1_dinero.sql:707-717`), y seis códigos bien formados muestran esa misma frase.
- **Veredicto: nada pendiente en el texto.** Su tamaño sube con el resto de Salas.

### A.2 · Por qué son tan chicas las que bajan de 10

«Sube a» es la letra máxima de **esa fila sola**, con el interlineado fijo para que no empuje en alto.

| Familia | Hoy (T1 · T2 · T3) | Qué la fija | Sube a, sin mover nada | Lo primero que se mueve o rompe |
|---|---|---|---|---|
| «Tú», en la silla | 7,9 · 8,6 · 7,9 | 2,2u, `salas.css:965` | **8** en T1 y T3 | La silla, 0,7 px a 8,5 |
| Nombre o «Libre» en la silla | 9,7 · 10,5 · 9,7 | 2,7u, `salas.css:958` | **Nada** | «MaracuchaBrava_» deja de caber |
| Llena, línea 2 | 8,2 · 8,9 · 10,4 | `useEncajeLlena` | **Nada** sin acortar | Ver fila 2 |
| «Sí» y «Pronto» del ⚙ | 9,6 · 10,3 · 9,6 | 0,78 em, `hojaMarco.css:111` | **Nada** | A 10, el valor de la fila se corre 2,1 px |
| Tapete en uso («Verde clásico») | 9,8 · 10,6 · 9,8 | 0,8 em, `hojaMarco.css:235` | **Nada** | A 10, «Eliminar cuenta» baja 2,6 px |
| «Pronto» del estante | 9,3 · 10,1 · 9,3 | 0,72 em, `tienda.css:116` | **Nada** | A 9,5 el estante crece 1,4 px; a 10 se sale de la pantalla |
| «Pronto» de la fila de video | 9,5 · 10,3 · 9,5 | 2,65u, `tienda.css:66` | **Nada** | A 10, el texto vecino se corre 2,1 px |
| «Te quedan 8 de 8 hoy» | 9,7 · 10,5 · 9,7 | 2,7u, `salas.css:1753` | **10** | A 10,5, 0,6 px |
| Cabecera de Rankings | 9,4 · 10,1 · 9,4 | 2,6u, `rankings.css:112` | **14 o más** | Nada: **es la subida gratis** |
| «Pozo» (T3) | 10 · 10 · 8 | `gameTable.css:2717` | Óvalo: no se toca | Fila 3 |
| Comodín (T1 y T3) | 8 · 10 · 8 | `gameTable.css:2174`, `:2729` | Óvalo: no se toca | Fila 3 |
| Crónica, mesas 3–5 (T3) | 13 · 13 · 9 | `gameTable.css:2723` | Óvalo: no se toca | La cubre la opción (§C) |
| Frase del resultado, mesas 3–5 (T3) | 13 · 13 · 9 | Hereda de `:2723` | Óvalo: no se toca | La cubre la opción (§C) |

### A.3 · La tabla completa, por pantalla

Columnas T1–T6 en px visibles. El número entre paréntesis tras el archivo dice en qué tamaños manda esa regla. «(her.)» es tamaño heredado de un padre. En **t()**, «sí» está medido: se marcó la salida de `t()` en el navegador y se vio qué textos la llevan. «dato o literal» no lleva la marca y puede ser un nombre o un texto del fixture. «¿?» es una frase que no salió en la pasada de la marca.

**lobby** · 5 filas

| Texto | Clase | CSS:línea | T1 | T2 | T3 | T4 | T5 | T6 | Prot. | Óvalo | t() |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Rankings | `lob-nav-btn` | `lobby.css:538 (her.)` | 10,4 | 11,3 | 10,4 | 17,4 | 17,4 | 17,4 | no | no | sí |
| Tienda | `lob-nav-btn.lob-nav-tienda` | `lobby.css:538 (her.)` | 10,4 | 11,3 | 10,4 | 17,4 | 17,4 | 17,4 | no | no | sí |
| Cómo se juega | `lob-nav-btn` | `lobby.css:538 (her.)` | 10,4 | 11,3 | 10,4 | 17,4 | 17,4 | 17,4 | no | no | sí |
| 1/3 | `cst-n` | `constancia.css:22 (her.)` | 10,8 | 11,7 | 10,8 | 18 | 18 | 18 | no | no | dato |
| DevLocal | `lob-nombre` | `lobby.css:208` | 13 | 14 | 13 | 21,6 | 21,6 | 21,6 | no | no | no |

**config (⚙)** · 17 filas

| Texto | Clase | CSS:línea | T1 | T2 | T3 | T4 | T5 | T6 | Prot. | Óvalo | t() |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Sí | `lob-pastilla.cfg-si` | `hojaMarco.css:111` | 9,6 | 10,3 | 9,6 | 15,9 | 15,9 | 15,9 | no | no | sí |
| Pronto | `lob-pastilla` | `hojaMarco.css:111` | 9,6 | 10,3 | 9,6 | 15,9 | 15,9 | 15,9 | no | no | sí |
| Verde clásico | `tie-cfg-txt` | `hojaMarco.css:235` | 9,8 | 10,6 | 9,8 | 16,3 | 16,3 | 16,3 | no | no | no |
| Rankings | `lob-nav-btn` | `lobby.css:538 (her.)` | 10,4 | 11,3 | 10,4 | 17,4 | 17,4 | 17,4 | no | no | sí |
| Tienda | `lob-nav-btn.lob-nav-tienda` | `lobby.css:538 (her.)` | 10,4 | 11,3 | 10,4 | 17,4 | 17,4 | 17,4 | no | no | sí |
| Cómo se juega | `lob-nav-btn` | `lobby.css:538 (her.)` | 10,4 | 11,3 | 10,4 | 17,4 | 17,4 | 17,4 | no | no | sí |
| 1/3 | `cst-n` | `constancia.css:22 (her.)` | 10,8 | 11,7 | 10,8 | 18 | 18 | 18 | no | no | dato |
| Español | `cfg-valor` | `hojaMarco.css:219` | 11 | 11,9 | 11 | 18,4 | 18,4 | 18,4 | no | no | sí |
| DevLocal | `b` | `hojaMarco.css:154 (her.)` | 11,9 | 12,9 | 11,9 | 19,8 | 19,8 | 19,8 | no | no | no |
| Sonido | `lob-fila` | `hojaMarco.css:204 (her.)` | 12,2 | 13,3 | 12,2 | 20,4 | 20,4 | 20,4 | no | no | sí |
| Tapetes | `tie-cfg-txt` | `hojaMarco.css:204 (her.)` | 12,2 | 13,3 | 12,2 | 20,4 | 20,4 | 20,4 | no | no | sí |
| Idioma | `lob-fila` | `hojaMarco.css:204 (her.)` | 12,2 | 13,3 | 12,2 | 20,4 | 20,4 | 20,4 | no | no | sí |
| Enviar sugerencia | `lob-fila` | `hojaMarco.css:204 (her.)` | 12,2 | 13,3 | 12,2 | 20,4 | 20,4 | 20,4 | no | no | sí |
| Cerrar sesión | `lob-fila` | `hojaMarco.css:204 (her.)` | 12,2 | 13,3 | 12,2 | 20,4 | 20,4 | 20,4 | no | no | sí |
| Acerca de | `lob-fila` | `hojaMarco.css:204 (her.)` | 12,2 | 13,3 | 12,2 | 20,4 | 20,4 | 20,4 | no | no | sí |
| Eliminar cuenta | `lob-fila.lob-fila-peligro` | `hojaMarco.css:204 (her.)` | 12,2 | 13,3 | 12,2 | 20,4 | 20,4 | 20,4 | no | no | sí |
| DevLocal | `lob-nombre` | `lobby.css:208` | 13 | 14 | 13 | 21,6 | 21,6 | 21,6 | no | no | no |

**retar** · 19 filas

| Texto | Clase | CSS:línea | T1 | T2 | T3 | T4 | T5 | T6 | Prot. | Óvalo | t() |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Reto | `sal-bloque` | `salas.css:363` | 10,4 | 11,3 | 10,4 | 17,4 | 17,4 | 17,4 | no | no | sí |
| El juego de siempre | `sal-aviso.is-on` | `salas.css:597` | 10,4 | 11,3 | 10,4 | 17,4 | 17,4 | 17,4 | no | no | no |
| Jugadores | `sal-bloque` | `salas.css:363` | 10,4 | 11,3 | 10,4 | 17,4 | 17,4 | 17,4 | no | no | sí |
| Sin comodín: el 7 de Oros es una carta m | `sal-aviso.is-on` | `salas.css:597` | 10,4 | 11,3 | 10,4 | 17,4 | 17,4 | 17,4 | no | no | sí |
| Apuesta HC por mano | `sal-bloque` | `salas.css:363` | 10,4 | 11,3 | 10,4 | 17,4 | 17,4 | 17,4 | no | no | sí |
| ¿Con cuánto entras? | `sal-bloque` | `salas.css:363` | 10,4 | 11,3 | 10,4 | 17,4 | 17,4 | 17,4 | no | no | sí |
| Cada IA se sienta con 1.500 HC. | `sal-aviso.is-on` | `salas.css:597` | 10,4 | 11,3 | 10,4 | 17,4 | 17,4 | 17,4 | no | no | sí |
| Con esta mesa juega el comodín (7 de Oro | `sal-aviso.is-on` | `salas.css:597` | 10,4 | 11,3 | 10,4 | 17,4 | 17,4 | 17,4 | no | no | sí |
| Básico · 2 jugadores · 50 por mano · ent | `sal-caja.is-resumen` | `salas.css:1602` | 11,2 | 12,1 | 11,2 | 18,6 | 18,6 | 18,6 | no | no | sí |
| 1.000 | `sal-caja.is-resumen` | `salas.css:1602 (her.)` | 11,2 | 12,1 | 11,2 | 18,6 | 18,6 | 18,6 | no | no | dato |
| DevLocal | `lob-nombre` | `salas.css:214` | 13 | 14 | 13 | 21,6 | 21,6 | 21,6 | no | no | no |
| Básico | `sal-chip` | `salas.css:582` | 13 | 14 | 13 | 21,6 | 21,6 | 21,6 | no | no | no |
| Avanzado | `sal-chip` | `salas.css:582` | 13 | 14 | 13 | 21,6 | 21,6 | 21,6 | no | no | no |
| Pro | `sal-chip` | `salas.css:582` | 13 | 14 | 13 | 21,6 | 21,6 | 21,6 | no | no | no |
| 2 | `sal-chip` | `salas.css:582` | 13 | 14 | 13 | 21,6 | 21,6 | 21,6 | no | no | dato |
| Mínimo 500 | `sal-chip` | `salas.css:582` | 13 | 14 | 13 | 21,6 | 21,6 | 21,6 | no | no | sí |
| Medio 1.000 | `sal-chip` | `salas.css:582` | 13 | 14 | 13 | 21,6 | 21,6 | 21,6 | no | no | sí |
| Techo 2.500 | `sal-chip` | `salas.css:582` | 13 | 14 | 13 | 21,6 | 21,6 | 21,6 | no | no | sí |
| Otra… | `sal-chip` | `salas.css:582` | 13 | 14 | 13 | 21,6 | 21,6 | 21,6 | no | no | sí |

**mesa IAS 2** · 36 filas

| Texto | Clase | CSS:línea | T1 | T2 | T3 | T4 | T5 | T6 | Prot. | Óvalo | t() |
|---|---|---|---|---|---|---|---|---|---|---|---|
| P | `seat-badge.seat-badge-neutral.seat-badge-letter` | `gameTable.css:981` (123) · `escala.css:161` (456) | 10 | 10 | 10 | 10 | 10 | 13 | sí | no | no |
| Pozo | `pot-label` | `gameTable.css:136` (12) · `gameTable.css:4099` (3) · `escala.css:171` (456) | 10 | 10 | 10 | 10 | 10 | 13 | sí | sí | no |
| Mano | `seat-badge.seat-badge-gold` | `gameTable.css:981` (123) · `escala.css:161` (456) | 10 | 10 | 10 | 10 | 10 | 13 | sí | no | no |
| Mano # | `hand-badge` | `gameTable.css:588` (123) · `escala.css:161` (456) | 10 | 10 | 10 | 10 | 10 | 13 | sí | no | no |
| 1 | `hand-badge` | `gameTable.css:588` (123) · `escala.css:161` (456) | 10 | 10 | 10 | 10 | 10 | 13 | sí | no | dato |
| Turno | `seat-badge.seat-badge-gold.badge-turno` | `gameTable.css:981` (123) · `escala.css:161` (456) | 10 | 10 | 10 | 10 | 10 | 13 | sí | no | no |
| 1 | `btn.btn-mult.btn-mult-active` | `gameTable.css:1931` (12) · `gameTable.css:3280` (3) · `gameTable.css:533` (45) | 12 | 12 | 10 | 12 | 12 | 15,6 | sí | no | dato |
| 2 | `btn.btn-mult` | `gameTable.css:1931` (12) · `gameTable.css:3280` (3) · `gameTable.css:533` (45) | 12 | 12 | 10 | 12 | 12 | 15,6 | sí | no | dato |
| T | `seat-badge.seat-badge-gold.seat-badge-letter` | `gameTable.css:981` (123) · `escala.css:161` (456) | 10 | 10 | 10 | 10 | 10 | 13 | sí | no | no |
| A igualar | `pot-label` | `gameTable.css:136` | 10 | 10 | — | 10 | 10 | 13 | sí | sí | no |
| M | `seat-badge.seat-badge-gold.seat-badge-letter` | `gameTable.css:981` (123) · `escala.css:161` (456) | 10 | 10 | 10 | 10 | 10 | 13 | sí | no | no |
| Pie | `seat-badge.seat-badge-neutral` | `gameTable.css:981` (123) · `escala.css:161` (456) | 10 | 10 | 10 | 10 | 10 | 13 | sí | no | no |
| Tú | `pbr-name` | `gameTable.css:1835 (her.)` (12) · `gameTable.css:3000 (her.)` (3) | 11 | 11 | 11 | 14 | 14 | 18,2 | sí | no | no |
| Iniciar mano | `btn.btn-primary` | `gameTable.css:1931` (12) · `gameTable.css:3244` (3) · `gameTable.css:491` (45) | 12 | 12 | 11 | 13 | 13 | 16,9 | sí | no | no |
| Mesa | `pbr-mesa` | `gameTable.css:1909` (12) · `gameTable.css:2981` (3) | 11 | 11 | 11 | 14 | 14 | 18,2 | sí | no | no |
| 50 | `pbr-mesa` | `gameTable.css:1909` (12) · `gameTable.css:2981` (3) | 11 | 11 | 11 | 14 | 14 | 18,2 | sí | no | dato |
| Pasar | `btn.btn-pass` | `gameTable.css:1931` (12) · `gameTable.css:3244` (3) · `gameTable.css:491` (45) | 12 | 12 | 11 | 13 | 13 | 16,9 | sí | no | no |
| Apostar | `btn.btn-bet` | `gameTable.css:1931` (12) · `gameTable.css:3244` (3) · `gameTable.css:491` (45) | 12 | 12 | 11 | 13 | 13 | 16,9 | sí | no | no |
| 50 | `btn.btn-bet` | `gameTable.css:1931` (12) · `gameTable.css:3244` (3) · `gameTable.css:491` (45) | 12 | 12 | 11 | 13 | 13 | 16,9 | sí | no | dato |
| Retirarse | `btn.btn-fold` | `gameTable.css:1931` (12) · `gameTable.css:3244` (3) · `gameTable.css:491` (45) | 12 | 12 | 11 | 13 | 13 | 16,9 | sí | no | no |
| Igualar ( | `btn.btn-call` | `gameTable.css:1931` (12) · `gameTable.css:3244` (3) · `gameTable.css:491` (45) | 12 | 12 | 11 | 13 | 13 | 16,9 | sí | no | no |
| 50 | `btn.btn-call` | `gameTable.css:1931` (12) · `gameTable.css:3244` (3) · `gameTable.css:491` (45) | 12 | 12 | 11 | 13 | 13 | 16,9 | sí | no | dato |
| Subir a | `btn.btn-raise` | `gameTable.css:1931` (12) · `gameTable.css:3244` (3) · `gameTable.css:491` (45) | 12 | 12 | 11 | 13 | 13 | 16,9 | sí | no | no |
| 100 | `btn.btn-raise` | `gameTable.css:1931` (12) · `gameTable.css:3244` (3) · `gameTable.css:491` (45) | 12 | 12 | 11 | 13 | 13 | 16,9 | sí | no | dato |
| Pulsa las cartas a descartar. | `discard-hint-2l` | `gameTable.css:1953 (her.)` | 11 | 11 | — | — | — | — | sí | no | no |
| (máx. | `discard-hint-2l` | `gameTable.css:1953 (her.)` | 11 | 11 | — | — | — | — | sí | no | no |
| 5 | `discard-hint-2l` | `gameTable.css:1953 (her.)` | 11 | 11 | — | — | — | — | sí | no | dato |
| ). Continúa sin descartar. | `discard-hint-2l` | `gameTable.css:1953 (her.)` | 11 | 11 | — | — | — | — | sí | no | no |
| Sin descartar | `btn.btn-primary` | `gameTable.css:1931` (12) · `gameTable.css:3244` (3) · `gameTable.css:491` (45) | 12 | 12 | 11 | 13 | 13 | 16,9 | sí | no | no |
| Siguiente mano | `btn.btn-primary` | `gameTable.css:1931` (12) · `gameTable.css:3244` (3) · `gameTable.css:491` (45) | 12 | 12 | 11 | 13 | 13 | 16,9 | sí | no | no |
| Recargar | `btn.btn-recarga` | `gameTable.css:1931` (12) · `gameTable.css:3244` (3) · `gameTable.css:491` (45) | 12 | 12 | 11 | 13 | 13 | 16,9 | sí | no | sí |
| Pulsa las cartas a descartar (máx. | `discard-hint-1l` | `gameTable.css:3312 (her.)` (3) · `gameTable.css:461 (her.)` (45) | — | — | 11 | 13 | 13 | 16,9 | sí | no | no |
| 5 | `discard-hint-1l` | `gameTable.css:3312 (her.)` (3) · `gameTable.css:461 (her.)` (45) | — | — | 11 | 13 | 13 | 16,9 | sí | no | dato |
| ) o continúa sin descartar. | `discard-hint-1l` | `gameTable.css:3312 (her.)` (3) · `gameTable.css:461 (her.)` (45) | — | — | 11 | 13 | 13 | 16,9 | sí | no | no |
| ✕ | `btn-leave` | `gameTable.css:616` | 13 | 13 | 13 | 13 | 13 | 16,9 | sí | no | no |
| All-in (300) | `btn.btn-call.btn-allin` | `gameTable.css:491` | — | — | — | 13 | — | — | sí | no | ¿? |

**mesa IAS 5** · 46 filas

| Texto | Clase | CSS:línea | T1 | T2 | T3 | T4 | T5 | T6 | Prot. | Óvalo | t() |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Pozo | `pot-label` | `gameTable.css:2165` (1) · `gameTable.css:136` (2) · `gameTable.css:2717` (3) · `escala.css:171` (456) | 10 | 10 | 8 | 10 | 10 | 13 | sí | sí | no |
| Comodín activo · vale 11 | `comodin-note` | `gameTable.css:2174` (1) · `gameTable.css:1958` (2) · `gameTable.css:2729` (3) · `escala.css:174` (45) | 8 | 10 | 8 | 11 | 11 | 14,3 | sí | sí | no |
| A igualar | `pot-label` | `gameTable.css:136` (2456) · `gameTable.css:2717` (3) | — | 10 | 8 | 10 | 10 | 13 | sí | sí | no |
| ¡Bienvenido a Ajilei! | `game-message` | `gameTable.css:1325` (12) · `gameTable.css:2723` (3) | 13 | 13 | 9 | 14 | 14 | 18,2 | sí | sí | no |
| Repartiendo... | `game-message` | `gameTable.css:1325` (12) · `gameTable.css:2723` (3) | 13 | 13 | 9 | 14 | 14 | 18,2 | sí | sí | no |
| A las 2 — Tú abre. | `game-message` | `gameTable.css:1325` (12) · `gameTable.css:2723` (3) | 13 | 13 | 9 | 14 | 14 | 18,2 | sí | sí | no |
| Selecciona hasta 3 cartas a descartar. | `game-message` | `gameTable.css:1325` (12) · `gameTable.css:2723` (3) | 13 | 13 | 9 | 14 | 14 | 18,2 | sí | sí | no |
| No descartas. | `game-message` | `gameTable.css:1325` (12) · `gameTable.css:2723` (3) | 13 | 13 | 9 | 14 | 14 | 18,2 | sí | sí | no |
| IA 1 descarta 3 cartas. / IA 1 descarta 2 cartas. | `game-message` | `gameTable.css:1325` (12) · `gameTable.css:2723` (3) | 13 | 13 | 9 | 14 | 14 | 18,2 | sí | sí | dato o literal |
| Descarte completado. Al descarte. | `game-message` | `gameTable.css:1325` (12) · `gameTable.css:2723` (3) | 13 | 13 | 9 | 14 | 14 | 18,2 | sí | sí | no |
| A las 2 — IA 1 abre. | `game-message` | `gameTable.css:1325` (12) · `gameTable.css:2723` (3) | 13 | 13 | 9 | 14 | 14 | — | sí | sí | no |
| ¡Ganas con Copas, 41 pts! | `voz2-texto` | `gameTable.css:2723 (her.)` | — | — | 9 | — | — | — | sí | sí | ¿? |
| Mano | `seat-badge.seat-badge-gold` | `gameTable.css:981` (123) · `escala.css:161` (456) | 10 | 10 | 10 | 10 | 10 | 13 | sí | no | no |
| Mano # | `hand-badge` | `gameTable.css:588` (123) · `escala.css:161` (456) | 10 | 10 | 10 | 10 | 10 | 13 | sí | no | no |
| 1 | `hand-badge` | `gameTable.css:588` (123) · `escala.css:161` (456) | 10 | 10 | 10 | 10 | 10 | 13 | sí | no | dato |
| P | `seat-badge.seat-badge-neutral.seat-badge-letter` | `gameTable.css:981` (123) · `escala.css:161` (456) | 10 | 10 | 10 | 10 | 10 | 13 | sí | no | no |
| Turno | `seat-badge.seat-badge-gold.badge-turno` | `gameTable.css:981` (123) · `escala.css:161` (456) | 10 | 10 | 10 | 10 | 10 | 13 | sí | no | no |
| 1 | `btn.btn-mult.btn-mult-active` | `gameTable.css:1931` (12) · `gameTable.css:3280` (3) · `gameTable.css:533` (45) | 12 | 12 | 10 | 12 | 12 | 15,6 | sí | no | dato |
| 2 | `btn.btn-mult` | `gameTable.css:1931` (12) · `gameTable.css:3280` (3) · `gameTable.css:533` (45) | 12 | 12 | 10 | 12 | 12 | 15,6 | sí | no | dato |
| T | `seat-badge.seat-badge-gold.seat-badge-letter` | `gameTable.css:981` (123) · `escala.css:161` (456) | 10 | 10 | 10 | 10 | 10 | 13 | sí | no | no |
| M | `seat-badge.seat-badge-gold.seat-badge-letter` | `gameTable.css:981` (123) · `escala.css:161` (456) | 10 | 10 | 10 | 10 | 10 | 13 | sí | no | no |
| Pie | `seat-badge.seat-badge-neutral` | `gameTable.css:981` (123) · `escala.css:161` (456) | 10 | 10 | 10 | 10 | 10 | 13 | sí | no | no |
| ✕ | `btn-leave` | `gameTable.css:616` (1245) · `gameTable.css:3362` (3) | 13 | 13 | 11 | 13 | 13 | 16,9 | sí | no | no |
| Tú | `pbr-name` | `gameTable.css:1835 (her.)` (12) · `gameTable.css:3000 (her.)` (3) | 11 | 11 | 11 | 14 | 14 | 18,2 | sí | no | no |
| Iniciar mano | `btn.btn-primary` | `gameTable.css:1931` (12) · `gameTable.css:3244` (3) · `gameTable.css:491` (45) | 12 | 12 | 11 | 13 | 13 | 16,9 | sí | no | no |
| Mesa | `pbr-mesa` | `gameTable.css:1909` (12) · `gameTable.css:2981` (3) | 11 | 11 | 11 | 14 | 14 | 18,2 | sí | no | no |
| 50 | `pbr-mesa` | `gameTable.css:1909` (12) · `gameTable.css:2981` (3) | 11 | 11 | 11 | 14 | 14 | 18,2 | sí | no | dato |
| Pasar | `btn.btn-pass` | `gameTable.css:1931` (12) · `gameTable.css:3244` (3) · `gameTable.css:491` (45) | 12 | 12 | 11 | 13 | 13 | 16,9 | sí | no | no |
| Apostar | `btn.btn-bet` | `gameTable.css:1931` (12) · `gameTable.css:3244` (3) · `gameTable.css:491` (45) | 12 | 12 | 11 | 13 | 13 | 16,9 | sí | no | no |
| 50 | `btn.btn-bet` | `gameTable.css:1931` (12) · `gameTable.css:3244` (3) · `gameTable.css:491` (45) | 12 | 12 | 11 | 13 | 13 | 16,9 | sí | no | dato |
| Retirarse | `btn.btn-fold` | `gameTable.css:1931` (12) · `gameTable.css:3244` (3) · `gameTable.css:491` (45) | 12 | 12 | 11 | 13 | 13 | 16,9 | sí | no | no |
| Pulsa las cartas a descartar. | `discard-hint-2l` | `gameTable.css:1953 (her.)` | 11 | 11 | — | — | — | — | sí | no | no |
| (máx. | `discard-hint-2l` | `gameTable.css:1953 (her.)` | 11 | 11 | — | — | — | — | sí | no | no |
| 3 | `discard-hint-2l` | `gameTable.css:1953 (her.)` | 11 | 11 | — | — | — | — | sí | no | dato |
| ). Continúa sin descartar. | `discard-hint-2l` | `gameTable.css:1953 (her.)` | 11 | 11 | — | — | — | — | sí | no | no |
| Sin descartar | `btn.btn-primary` | `gameTable.css:1931` (12) · `gameTable.css:3244` (3) · `gameTable.css:491` (45) | 12 | 12 | 11 | 13 | 13 | 16,9 | sí | no | no |
| Siguiente mano | `btn.btn-primary` | `gameTable.css:1931` (12) · `gameTable.css:3244` (3) · `gameTable.css:491` (45) | 12 | 12 | 11 | 13 | 13 | 16,9 | sí | no | no |
| Recargar | `btn.btn-recarga` | `gameTable.css:1931` (12) · `gameTable.css:3244` (3) · `gameTable.css:491` (45) | 12 | 12 | 11 | 13 | 13 | 16,9 | sí | no | sí |
| Igualar ( | `btn.btn-call` | `gameTable.css:1931` (2) · `gameTable.css:3244` (3) · `gameTable.css:491` (45) | — | 12 | 11 | 13 | 13 | 16,9 | sí | no | no |
| 50 | `btn.btn-call` | `gameTable.css:1931` (2) · `gameTable.css:3244` (3) · `gameTable.css:491` (45) | — | 12 | 11 | 13 | 13 | — | sí | no | dato |
| Subir a | `btn.btn-raise` | `gameTable.css:1931` (2) · `gameTable.css:3244` (3) · `gameTable.css:491` (45) | — | 12 | 11 | 13 | 13 | 16,9 | sí | no | no |
| 100 / 600 | `btn.btn-raise` | `gameTable.css:1931` (2) · `gameTable.css:3244` (3) · `gameTable.css:491` (45) | — | 12 | 11 | 13 | 13 | 16,9 | sí | no | dato |
| Pulsa las cartas a descartar (máx. | `discard-hint-1l` | `gameTable.css:3312 (her.)` (3) · `gameTable.css:461 (her.)` (45) | — | — | 11 | 13 | 13 | 16,9 | sí | no | no |
| 3 | `discard-hint-1l` | `gameTable.css:3312 (her.)` (3) · `gameTable.css:461 (her.)` (45) | — | — | 11 | 13 | 13 | 16,9 | sí | no | dato |
| ) o continúa sin descartar. | `discard-hint-1l` | `gameTable.css:3312 (her.)` (3) · `gameTable.css:461 (her.)` (45) | — | — | 11 | 13 | 13 | 16,9 | sí | no | no |
| ¡Ganas con Bastos, 32 pts! / IA 1 gana con Oros, 40 pts. | `voz2-texto` | `gameTable.css:1325 (her.)` | 13 | 13 | — | 15 | 15 | 19,5 | sí | sí | dato o literal |

**mesa IAS 2 · ⋮** · 3 filas

| Texto | Clase | CSS:línea | T1 | T2 | T3 | T4 | T5 | T6 | Prot. | Óvalo | t() |
|---|---|---|---|---|---|---|---|---|---|---|---|
| No | `util-estado` | `utilidadesMesa.css:41` | 10 | 10 | 10 | 10 | 10 | 13 | no | no | sí |
| 20 | `util-estado.util-estado-mano` | `utilidadesMesa.css:41` | 10 | 10 | 10 | — | — | — | no | no | dato |
| 20 | `util-badge` | `gameTable.css:5955` | — | — | — | 10 | 10 | 13 | sí | no | dato |

**mesa IAS 5 · ⋮** · 3 filas

| Texto | Clase | CSS:línea | T1 | T2 | T3 | T4 | T5 | T6 | Prot. | Óvalo | t() |
|---|---|---|---|---|---|---|---|---|---|---|---|
| No | `util-estado` | `utilidadesMesa.css:41` | 10 | 10 | 10 | 10 | 10 | 13 | no | no | sí |
| 20 | `util-estado.util-estado-mano` | `utilidadesMesa.css:41` | 10 | 10 | 10 | — | — | — | no | no | dato |
| 20 | `util-badge` | `gameTable.css:5955` | — | — | — | 10 | 10 | 13 | sí | no | dato |

**salas** · 11 filas

| Texto | Clase | CSS:línea | T1 | T2 | T3 | T4 | T5 | T6 | Prot. | Óvalo | t() |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Entrada 5.000 HC | `sal-mesa-entrada` | `salas.css:523 (her.)` | 8,2 | 8,9 | 10,4 | 12,4 | 17,4 | 17,4 | no | no | sí |
| Te faltan 5.000 HC | `sal-mesa-l2` | `salas.css:523` | 8,2 | 8,9 | 10,4 | 12,4 | 17,4 | 17,4 | no | no | sí |
| Arma la tuya y comparte el código | `sal-vacio` | `salas.css:568` | 10,1 | 10,9 | 10,1 | 16,8 | 16,8 | 16,8 | no | no | sí |
| ¿Te invitaron? Pega tu código | `sal-bloque` | `salas.css:363` | 10,4 | 11,3 | 10,4 | 17,4 | 17,4 | 17,4 | no | no | sí |
| Mesas formándose ahora | `sal-bloque` | `salas.css:363` | 10,4 | 11,3 | 10,4 | 17,4 | 17,4 | 17,4 | no | no | sí |
| 3/4 sentados | `sal-mesa-l2` | `salas.css:523` | 10,4 | 11,3 | 10,4 | 17,4 | 17,4 | 17,4 | no | no | sí |
| Privada con código, o abierta a quien qu | `sal-caja.is-nota` | `salas.css:1602` | 11,2 | 12,1 | 11,2 | 18,6 | 18,6 | 18,6 | no | no | sí |
| Unirme | `sal-unir` | `salas.css:535` | 11,5 | 12,5 | 11,5 | 19,2 | 19,2 | 19,2 | no | no | sí |
| Nadie está armando mesa ahora | `sal-vacio` | `salas.css:560` | 11,9 | 12,9 | 11,9 | 19,8 | 19,8 | 19,8 | no | no | sí |
| DevLocal | `lob-nombre` | `salas.css:214` | 13 | 14 | 13 | 21,6 | 21,6 | 21,6 | no | no | no |
| Entrar | `sal-entrar` | `salas.css:445` | 13 | 14 | 13 | 21,6 | 21,6 | 21,6 | no | no | sí |

**armar mesa** · 15 filas

| Texto | Clase | CSS:línea | T1 | T2 | T3 | T4 | T5 | T6 | Prot. | Óvalo | t() |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Jugadores | `sal-bloque` | `salas.css:363` | 10,4 | 11,3 | 10,4 | 17,4 | 17,4 | 17,4 | no | no | sí |
| Apuesta HC por mano | `sal-bloque` | `salas.css:363` | 10,4 | 11,3 | 10,4 | 17,4 | 17,4 | 17,4 | no | no | sí |
| Entrada | `sal-bloque` | `salas.css:363` | 10,4 | 11,3 | 10,4 | 17,4 | 17,4 | 17,4 | no | no | sí |
| Ritmo | `sal-bloque` | `salas.css:363` | 10,4 | 11,3 | 10,4 | 17,4 | 17,4 | 17,4 | no | no | sí |
| ¿Cómo la llenamos? | `sal-bloque` | `salas.css:363` | 10,4 | 11,3 | 10,4 | 17,4 | 17,4 | 17,4 | no | no | sí |
| Con código para compartir. Solo entra qu | `sal-modo-d` | `salas.css:637` | 10,4 | 11,3 | 10,4 | 17,4 | 17,4 | 17,4 | no | no | sí |
| Visible para todos. Entra quien quiera. | `sal-modo-d` | `salas.css:637` | 10,4 | 11,3 | 10,4 | 17,4 | 17,4 | 17,4 | no | no | sí |
| Privada · 4 jugadores · 100 por mano | `sal-caja.is-resumen` | `salas.css:1602` | 11,2 | 12,1 | 11,2 | 18,6 | 18,6 | 18,6 | no | no | sí |
| DevLocal | `lob-nombre` | `salas.css:214` | 13 | 14 | 13 | 21,6 | 21,6 | 21,6 | no | no | no |
| 2 | `sal-chip` | `salas.css:582` | 13 | 14 | 13 | 21,6 | 21,6 | 21,6 | no | no | dato |
| 1.500 HC | `sal-chip` | `salas.css:582` | 13 | 14 | 13 | 21,6 | 21,6 | 21,6 | no | no | sí |
| Normal | `sal-chip` | `salas.css:582` | 13 | 14 | 13 | 21,6 | 21,6 | 21,6 | no | no | sí |
| Rápido | `sal-chip` | `salas.css:582` | 13 | 14 | 13 | 21,6 | 21,6 | 21,6 | no | no | sí |
| Privada | `sal-modo-t` | `salas.css:626 (her.)` | 13 | 14 | 13 | 21,6 | 21,6 | 21,6 | no | no | sí |
| Abierta | `sal-modo-t` | `salas.css:626 (her.)` | 13 | 14 | 13 | 21,6 | 21,6 | 21,6 | no | no | sí |

**sala de espera** · 20 filas

| Texto | Clase | CSS:línea | T1 | T2 | T3 | T4 | T5 | T6 | Prot. | Óvalo | t() |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Tú | `sal-esp-tag` | `salas.css:965` | 7,9 | 8,6 | 7,9 | 13,2 | 13,2 | 13,2 | no | no | sí |
| DevLocal | `sal-esp-n` | `salas.css:958` | 9,7 | 10,5 | 9,7 | 16,2 | 16,2 | 16,2 | no | no | no |
| maria_ccs / MaracuchaBrava_ | `sal-esp-n` | `salas.css:958` | 9,7 | 10,5 | 9,7 | 16,2 | 16,2 | 16,2 | no | no | dato o literal |
| Libre | `sal-esp-n` | `salas.css:958` | 9,7 | 10,5 | 9,7 | 16,2 | 16,2 | 16,2 | no | no | sí |
| D | `sal-esp-ini` | `salas.css:950` | 10,4 | 11,9 | 10,4 | 16,3 | 16,3 | 18,2 | no | no | no |
| M | `sal-esp-ini` | `salas.css:950` | 10,4 | 11,9 | 10,4 | 16,3 | 16,3 | 18,2 | no | no | no |
| C | `sal-esp-ini` | `salas.css:950` | 10,4 | 11,9 | 10,4 | 16,3 | 16,3 | 18,2 | no | no | no |
| J | `sal-esp-ini` | `salas.css:950` | 10,4 | 11,9 | 10,4 | 16,3 | 16,3 | 18,2 | no | no | no |
| A | `sal-esp-ini` | `salas.css:950` | 10,4 | 11,9 | 10,4 | 16,3 | 16,3 | 18,2 | no | no | no |
| L | `sal-esp-ini` | `salas.css:950` | 10,4 | 11,9 | 10,4 | 16,3 | 16,3 | 18,2 | no | no | no |
| Eres el anfitrión · Privada | `sal-esp-sub` | `salas.css:772` | 10,4 | 11,3 | 10,4 | 17,4 | 17,4 | 17,4 | no | no | sí |
| Código de invitación | `sal-esp-eti` | `salas.css:804` | 10,4 | 11,3 | 10,4 | 17,4 | 17,4 | 17,4 | no | no | sí |
| 2/4 sentados | `sal-esp-estado` | `salas.css:909` | 10,4 | 11,3 | 10,4 | 17,4 | 17,4 | 17,4 | no | no | sí |
| Se juega con los que estén sentados | `sal-accion.sal-esp-accion` | `salas.css:678` | 10,4 | 11,3 | 10,4 | 17,4 | 17,4 | 17,4 | no | no | sí |
| ¡Mesa completa! | `sal-esp-estado` | `salas.css:909` | 10,4 | 11,3 | 10,4 | 17,4 | 17,4 | 17,4 | no | no | sí |
| Ya no hace falta «Jugar ya» | `sal-accion.sal-esp-accion` | `salas.css:678` | 10,4 | 11,3 | 10,4 | 17,4 | 17,4 | 17,4 | no | no | sí |
| Se juega con los que estén sentados cuan | `sal-esp-consejo` | `salas.css:1061` | 10,8 | 11,7 | 10,8 | 18 | 18 | 18 | no | no | sí |
| Compartir | `sal-esp-compartir` | `salas.css:859 (her.)` | 11,5 | 12,5 | 11,5 | 19,2 | 19,2 | 19,2 | no | no | sí |
| Salir de la mesa | `sal-esp-salir` | `salas.css:1097` | 11,5 | 12,5 | 11,5 | 19,2 | 19,2 | 19,2 | no | no | sí |
| DevLocal | `lob-nombre` | `salas.css:214` | 13 | 14 | 13 | 21,6 | 21,6 | 21,6 | no | no | no |

**mesa personas 2** · 45 filas

| Texto | Clase | CSS:línea | T1 | T2 | T3 | T4 | T5 | T6 | Prot. | Óvalo | t() |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Pozo | `pot-label` | `gameTable.css:136` (12) · `gameTable.css:4099` (3) · `escala.css:171` (456) | 10 | 10 | 8 | 10 | 10 | 13 | sí | sí | no |
| A igualar | `pot-label` | `gameTable.css:136` (12456) · `gameTable.css:2717` (3) | 10 | 10 | 8 | 10 | 10 | 13 | sí | sí | no |
| A las 2 — Tu turno. | `game-message` | `gameTable.css:1325` (12) · `gameTable.css:4147` (3) | 13 | 13 | 9 | 14 | 14 | 18,2 | sí | sí | no |
| Descarte completado. Al descarte — Caro  | `game-message` | `gameTable.css:1325` (12) · `gameTable.css:2723` (3) | 13 | 13 | 9 | 14 | 14 | 18,2 | sí | sí | dato o literal |
| Mano # | `hand-badge` | `gameTable.css:588` (123) · `escala.css:161` (456) | 10 | 10 | 10 | 10 | 10 | 13 | sí | no | no |
| 1 | `hand-badge` | `gameTable.css:588` (123) · `escala.css:161` (456) | 10 | 10 | 10 | 10 | 10 | 13 | sí | no | dato |
| M | `seat-badge.seat-badge-gold.seat-badge-letter` | `gameTable.css:981` (123) · `escala.css:161` (456) | 10 | 10 | 10 | 10 | 10 | 13 | sí | no | no |
| Pie | `seat-badge.seat-badge-neutral` | `gameTable.css:981` (123) · `escala.css:161` (456) | 10 | 10 | 10 | 10 | 10 | 13 | sí | no | no |
| Turno | `seat-badge.seat-badge-gold.badge-turno` | `gameTable.css:981` (123) · `escala.css:161` (456) | 10 | 10 | 10 | 10 | 10 | 13 | sí | no | no |
| 1 | `btn.btn-mult.btn-mult-active` | `gameTable.css:1931` (12) · `gameTable.css:3280` (3) · `gameTable.css:533` (45) | 12 | 12 | 10 | 12 | 12 | 15,6 | sí | no | dato |
| 2 | `btn.btn-mult` | `gameTable.css:1931` (12) · `gameTable.css:3280` (3) · `gameTable.css:533` (45) | 12 | 12 | 10 | 12 | 12 | 15,6 | sí | no | dato |
| T | `seat-badge.seat-badge-gold.seat-badge-letter` | `gameTable.css:981` (123) · `escala.css:161` (456) | 10 | 10 | 10 | 10 | 10 | 13 | sí | no | no |
| P | `seat-badge.seat-badge-neutral.seat-badge-letter` | `gameTable.css:981` (123) · `escala.css:161` (456) | 10 | 10 | 10 | 10 | 10 | 13 | sí | no | no |
| Mano | `seat-badge.seat-badge-gold` | `gameTable.css:981` (123) · `escala.css:161` (456) | 10 | 10 | 10 | 10 | 10 | 13 | sí | no | no |
| M | `pvp-sc-marca.seat-badge.seat-badge-gold` | `gameTable.css:981` | 10 | 10 | 10 | 10 | 10 | 13 | sí | no | no |
| Rankings | `lob-nav-btn` | `lobby.css:538 (her.)` | 10,4 | 11,3 | 10,4 | 17,4 | 17,4 | 17,4 | no | no | sí |
| Tienda | `lob-nav-btn.lob-nav-tienda` | `lobby.css:538 (her.)` | 10,4 | 11,3 | 10,4 | 17,4 | 17,4 | 17,4 | no | no | sí |
| Cómo se juega | `lob-nav-btn` | `lobby.css:538 (her.)` | 10,4 | 11,3 | 10,4 | 17,4 | 17,4 | 17,4 | no | no | sí |
| 1/3 | `cst-n` | `constancia.css:22 (her.)` | 10,8 | 11,7 | 10,8 | 18 | 18 | 18 | no | no | dato |
| Tú | `pbr-name` | `gameTable.css:1835 (her.)` (12) · `gameTable.css:3000 (her.)` (3) | 11 | 11 | 11 | 14 | 14 | 18,2 | sí | no | no |
| Pasar | `btn.btn-pass` | `gameTable.css:1931` (12) · `gameTable.css:3244` (3) · `gameTable.css:491` (45) | 12 | 12 | 11 | 13 | 13 | 16,9 | sí | no | no |
| Apostar | `btn.btn-bet` | `gameTable.css:1931` (12) · `gameTable.css:3244` (3) · `gameTable.css:491` (45) | 12 | 12 | 11 | 13 | 13 | 16,9 | sí | no | no |
| 100 | `btn.btn-bet` | `gameTable.css:1931` (12) · `gameTable.css:3244` (3) · `gameTable.css:491` (45) | 12 | 12 | 11 | 13 | 13 | 16,9 | sí | no | dato |
| Retirarse | `btn.btn-fold` | `gameTable.css:1931` (12) · `gameTable.css:3244` (3) · `gameTable.css:491` (45) | 12 | 12 | 11 | 13 | 13 | 16,9 | sí | no | no |
| Mesa | `pbr-mesa` | `gameTable.css:1909` (12) · `gameTable.css:2981` (3) | 11 | 11 | 11 | 14 | 14 | 18,2 | sí | no | no |
| 100 | `pbr-mesa` | `gameTable.css:1909` (12) · `gameTable.css:2981` (3) | 11 | 11 | 11 | 14 | 14 | 18,2 | sí | no | dato |
| Pulsa las cartas a descartar. | `discard-hint-2l` | `gameTable.css:1953 (her.)` | 11 | 11 | — | — | — | — | sí | no | no |
| (máx. | `discard-hint-2l` | `gameTable.css:1953 (her.)` | 11 | 11 | — | — | — | — | sí | no | no |
| 5 | `discard-hint-2l` | `gameTable.css:1953 (her.)` | 11 | 11 | — | — | — | — | sí | no | dato |
| ). Continúa sin descartar. | `discard-hint-2l` | `gameTable.css:1953 (her.)` | 11 | 11 | — | — | — | — | sí | no | no |
| Sin descartar | `btn.btn-primary` | `gameTable.css:1931` (12) · `gameTable.css:3244` (3) · `gameTable.css:491` (45) | 12 | 12 | 11 | 13 | 13 | 16,9 | sí | no | no |
| Igualar ( | `btn.btn-call` | `gameTable.css:1931` (12) · `gameTable.css:3244` (3) · `gameTable.css:491` (45) | 12 | 12 | 11 | 13 | 13 | 16,9 | sí | no | no |
| 100 | `btn.btn-call` | `gameTable.css:1931` (12) · `gameTable.css:3244` (3) · `gameTable.css:491` (45) | 12 | 12 | 11 | 13 | 13 | 16,9 | sí | no | dato |
| Subir a | `btn.btn-raise` | `gameTable.css:1931` (12) · `gameTable.css:3244` (3) · `gameTable.css:491` (45) | 12 | 12 | 11 | 13 | 13 | 16,9 | sí | no | no |
| 300 | `btn.btn-raise` | `gameTable.css:1931` (12) · `gameTable.css:3244` (3) · `gameTable.css:491` (45) | 12 | 12 | 11 | 13 | 13 | 16,9 | sí | no | dato |
| Pulsa las cartas a descartar (máx. | `discard-hint-1l` | `gameTable.css:3312 (her.)` (3) · `gameTable.css:461 (her.)` (45) | — | — | 11 | 13 | 13 | 16,9 | sí | no | no |
| 5 | `discard-hint-1l` | `gameTable.css:3312 (her.)` (3) · `gameTable.css:461 (her.)` (45) | — | — | 11 | 13 | 13 | 16,9 | sí | no | dato |
| ) o continúa sin descartar. | `discard-hint-1l` | `gameTable.css:3312 (her.)` (3) · `gameTable.css:461 (her.)` (45) | — | — | 11 | 13 | 13 | 16,9 | sí | no | no |
| ¡Ganas con Bastos, 23 pts! / ¡Ganas con Bastos, 23 pts! A Beto se le  | `voz2-texto` | `gameTable.css:1325 (her.)` (12) · `gameTable.css:4147 (her.)` (3) | 13 | 13 | 12 | 15 | 15 | 19,5 | sí | sí | dato o literal |
| Omitir | `btn.btn-pass.pvp-anu-omitir` | `gameTable.css:1931` (12) · `gameTable.css:2779` (3) · `gameTable.css:491` (45) | 12 | 12 | 12 | 13 | 13 | 16,9 | sí | no | sí |
| Salir de la mesa | `btn.btn-primary` | `gameTable.css:1931` (12) · `gameTable.css:2779` (3) · `gameTable.css:491` (45) | 12 | 12 | 12 | 13 | 13 | 16,9 | sí | no | no |
| Ver tu nuevo ranking | `btn.cel-ranking` | `gameTable.css:1931` (12) · `gameTable.css:2779` (3) · `gameTable.css:491` (45) | 12 | 12 | 12 | 13 | 13 | 16,9 | sí | no | sí |
| ✕ | `u2-cerrar` | `menuMovil.css:522` (123) · `gameTable.css:6197` (45) | 12 | 12 | 12 | 12 | 12 | 15,6 | sí | no | no |
| DevLocal | `lob-nombre` | `lobby.css:208` | 13 | 14 | 13 | 21,6 | 21,6 | 21,6 | no | no | no |
| ✕ | `btn-leave` | `gameTable.css:616` | 13 | 13 | 13 | 13 | 13 | 16,9 | sí | no | no |

**mesa personas 5** · 52 filas

| Texto | Clase | CSS:línea | T1 | T2 | T3 | T4 | T5 | T6 | Prot. | Óvalo | t() |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Pozo | `pot-label` | `gameTable.css:2165` (1) · `gameTable.css:136` (2) · `gameTable.css:2717` (3) · `escala.css:171` (456) | 10 | 10 | 8 | 10 | 10 | 13 | sí | sí | no |
| Comodín activo · vale 11 | `comodin-note` | `gameTable.css:2174` (1) · `gameTable.css:1958` (2) · `gameTable.css:2729` (3) · `escala.css:174` (45) | 8 | 10 | 8 | 11 | 11 | 14,3 | sí | sí | no |
| A igualar | `pot-label` | `gameTable.css:2165` (1) · `gameTable.css:136` (2456) · `gameTable.css:2717` (3) | 10 | 10 | 8 | 10 | 10 | 13 | sí | sí | no |
| A las 2 — Tu turno. | `game-message` | `gameTable.css:1325` (12) · `gameTable.css:2723` (3) | 13 | 13 | 9 | 14 | 14 | 18,2 | sí | sí | no |
| A las 2 — Caro abre. | `game-message` | `gameTable.css:1325` (12) · `gameTable.css:2723` (3) | 13 | 13 | 9 | 14 | 14 | 18,2 | sí | sí | no |
| Esperando el descarte de la mesa. | `game-message` | `gameTable.css:1325` (12) · `gameTable.css:2723` (3) | 13 | 13 | 9 | 14 | 14 | 18,2 | sí | sí | no |
| Selecciona hasta 3 cartas a descartar. | `game-message` | `gameTable.css:1325` (12) · `gameTable.css:2723` (3) | 13 | 13 | 9 | 14 | 14 | 18,2 | sí | sí | no |
| Beto gana con Espadas, 31 pts. / Los demás se retiran. Gana Caro. | `voz2-texto` | `gameTable.css:1325 (her.)` (12) · `gameTable.css:2723 (her.)` (3) · `gameTable.css:4147 (her.)` (3) | 13 | 13 | 9 | 15 | 15 | 19,5 | sí | sí | dato o literal |
| Empate, 30 pts. Gana Caro por ser la Man | `voz2-texto` | `gameTable.css:1325 (her.)` (12) · `gameTable.css:2723 (her.)` (3) | 13 | 13 | 9 | 15 | 15 | 19,5 | sí | sí | no |
| 1 turno más y saldrás de la mesa | `game-message` | `gameTable.css:1325` (12) · `gameTable.css:2723` (3) | 13 | 13 | 9 | 14 | 14 | 18,2 | sí | sí | sí |
| Descarte completado. Al descarte — Caro  | `game-message` | `gameTable.css:1325` (12) · `gameTable.css:2723` (3) | 13 | 13 | 9 | 14 | 14 | 18,2 | sí | sí | dato o literal |
| Repartiendo... | `game-message` | `gameTable.css:1325` (12) · `gameTable.css:2723` (3) | 13 | 13 | 9 | 14 | 14 | 18,2 | sí | sí | no |
| Mano # | `hand-badge` | `gameTable.css:588` (123) · `escala.css:161` (456) | 10 | 10 | 10 | 10 | 10 | 13 | sí | no | no |
| 1 | `hand-badge` | `gameTable.css:588` (123) · `escala.css:161` (456) | 10 | 10 | 10 | 10 | 10 | 13 | sí | no | dato |
| M | `seat-badge.seat-badge-gold.seat-badge-letter` | `gameTable.css:981` (123) · `escala.css:161` (456) | 10 | 10 | 10 | 10 | 10 | 13 | sí | no | no |
| P | `seat-badge.seat-badge-neutral.seat-badge-letter` | `gameTable.css:981` (123) · `escala.css:161` (456) | 10 | 10 | 10 | 10 | 10 | 13 | sí | no | no |
| Turno | `seat-badge.seat-badge-gold.badge-turno` | `gameTable.css:981` (123) · `escala.css:161` (456) | 10 | 10 | 10 | 10 | 10 | 13 | sí | no | no |
| 1 | `btn.btn-mult.btn-mult-active` | `gameTable.css:1931` (12) · `gameTable.css:3280` (3) · `gameTable.css:533` (45) | 12 | 12 | 10 | 12 | 12 | 15,6 | sí | no | dato |
| 2 | `btn.btn-mult` | `gameTable.css:1931` (12) · `gameTable.css:3280` (3) · `gameTable.css:533` (45) | 12 | 12 | 10 | 12 | 12 | 15,6 | sí | no | dato |
| T | `seat-badge.seat-badge-gold.seat-badge-letter` | `gameTable.css:981` (123) · `escala.css:161` (456) | 10 | 10 | 10 | 10 | 10 | 13 | sí | no | no |
| Mano | `seat-badge.seat-badge-gold` | `gameTable.css:981` (123) · `escala.css:161` (456) | 10 | 10 | 10 | 10 | 10 | 13 | sí | no | no |
| Pie | `seat-badge.seat-badge-neutral` | `gameTable.css:981` (123) · `escala.css:161` (456) | 10 | 10 | 10 | 10 | 10 | 13 | sí | no | no |
| M | `pvp-sc-marca.seat-badge.seat-badge-gold` | `gameTable.css:981` | 10 | 10 | 10 | 10 | 10 | 13 | sí | no | no |
| Rankings | `lob-nav-btn` | `lobby.css:538 (her.)` | 10,4 | 11,3 | 10,4 | 17,4 | 17,4 | 17,4 | no | no | sí |
| Tienda | `lob-nav-btn.lob-nav-tienda` | `lobby.css:538 (her.)` | 10,4 | 11,3 | 10,4 | 17,4 | 17,4 | 17,4 | no | no | sí |
| Cómo se juega | `lob-nav-btn` | `lobby.css:538 (her.)` | 10,4 | 11,3 | 10,4 | 17,4 | 17,4 | 17,4 | no | no | sí |
| 1/3 | `cst-n` | `constancia.css:22 (her.)` | 10,8 | 11,7 | 10,8 | 18 | 18 | 18 | no | no | dato |
| ✕ | `btn-leave` | `gameTable.css:616` (1245) · `gameTable.css:3362` (3) | 13 | 13 | 11 | 13 | 13 | 16,9 | sí | no | no |
| Tú | `pbr-name` | `gameTable.css:1835 (her.)` (12) · `gameTable.css:3000 (her.)` (3) | 11 | 11 | 11 | 14 | 14 | 18,2 | sí | no | no |
| Pasar | `btn.btn-pass` | `gameTable.css:1931` (12) · `gameTable.css:3244` (3) · `gameTable.css:491` (45) | 12 | 12 | 11 | 13 | 13 | 16,9 | sí | no | no |
| Apostar | `btn.btn-bet` | `gameTable.css:1931` (12) · `gameTable.css:3244` (3) · `gameTable.css:491` (45) | 12 | 12 | 11 | 13 | 13 | 16,9 | sí | no | no |
| 100 | `btn.btn-bet` | `gameTable.css:1931` (12) · `gameTable.css:3244` (3) · `gameTable.css:491` (45) | 12 | 12 | 11 | 13 | 13 | 16,9 | sí | no | dato |
| Retirarse | `btn.btn-fold` | `gameTable.css:1931` (12) · `gameTable.css:3244` (3) · `gameTable.css:491` (45) | 12 | 12 | 11 | 13 | 13 | 16,9 | sí | no | no |
| Mesa | `pbr-mesa` | `gameTable.css:1909` (12) · `gameTable.css:2981` (3) | 11 | 11 | 11 | 14 | 14 | 18,2 | sí | no | no |
| 100 | `pbr-mesa` | `gameTable.css:1909` (12) · `gameTable.css:2981` (3) | 11 | 11 | 11 | 14 | 14 | 18,2 | sí | no | dato |
| Pulsa las cartas a descartar. | `discard-hint-2l` | `gameTable.css:1953 (her.)` | 11 | 11 | — | — | — | — | sí | no | no |
| (máx. | `discard-hint-2l` | `gameTable.css:1953 (her.)` | 11 | 11 | — | — | — | — | sí | no | no |
| 3 | `discard-hint-2l` | `gameTable.css:1953 (her.)` | 11 | 11 | — | — | — | — | sí | no | dato |
| ). Continúa sin descartar. | `discard-hint-2l` | `gameTable.css:1953 (her.)` | 11 | 11 | — | — | — | — | sí | no | no |
| Sin descartar | `btn.btn-primary` | `gameTable.css:1931` (12) · `gameTable.css:3244` (3) · `gameTable.css:491` (45) | 12 | 12 | 11 | 13 | 13 | 16,9 | sí | no | no |
| Igualar ( | `btn.btn-call` | `gameTable.css:1931` (12) · `gameTable.css:3244` (3) · `gameTable.css:491` (45) | 12 | 12 | 11 | 13 | 13 | 16,9 | sí | no | no |
| 200 | `btn.btn-call` | `gameTable.css:1931` (12) · `gameTable.css:3244` (3) · `gameTable.css:491` (45) | 12 | 12 | 11 | 13 | 13 | 16,9 | sí | no | dato |
| Subir a | `btn.btn-raise` | `gameTable.css:1931` (12) · `gameTable.css:3244` (3) · `gameTable.css:491` (45) | 12 | 12 | 11 | 13 | 13 | 16,9 | sí | no | no |
| 300 | `btn.btn-raise` | `gameTable.css:1931` (12) · `gameTable.css:3244` (3) · `gameTable.css:491` (45) | 12 | 12 | 11 | 13 | 13 | 16,9 | sí | no | dato |
| Pulsa las cartas a descartar (máx. | `discard-hint-1l` | `gameTable.css:3312 (her.)` (3) · `gameTable.css:461 (her.)` (45) | — | — | 11 | 13 | 13 | 16,9 | sí | no | no |
| 3 | `discard-hint-1l` | `gameTable.css:3312 (her.)` (3) · `gameTable.css:461 (her.)` (45) | — | — | 11 | 13 | 13 | 16,9 | sí | no | dato |
| ) o continúa sin descartar. | `discard-hint-1l` | `gameTable.css:3312 (her.)` (3) · `gameTable.css:461 (her.)` (45) | — | — | 11 | 13 | 13 | 16,9 | sí | no | no |
| Omitir | `btn.btn-pass.pvp-anu-omitir` | `gameTable.css:1931` (12) · `gameTable.css:2779` (3) · `gameTable.css:491` (45) | 12 | 12 | 12 | 13 | 13 | 16,9 | sí | no | sí |
| Salir de la mesa | `btn.btn-primary` | `gameTable.css:1931` (12) · `gameTable.css:2779` (3) · `gameTable.css:491` (45) | 12 | 12 | 12 | 13 | 13 | 16,9 | sí | no | no |
| Ver tu nuevo ranking | `btn.cel-ranking` | `gameTable.css:1931` (12) · `gameTable.css:2779` (3) · `gameTable.css:491` (45) | 12 | 12 | 12 | 13 | 13 | 16,9 | sí | no | sí |
| ✕ | `u2-cerrar` | `menuMovil.css:522` (123) · `gameTable.css:6197` (45) | 12 | 12 | 12 | 12 | 12 | 15,6 | sí | no | no |
| DevLocal | `lob-nombre` | `lobby.css:208` | 13 | 14 | 13 | 21,6 | 21,6 | 21,6 | no | no | no |

**tienda** · 11 filas

| Texto | Clase | CSS:línea | T1 | T2 | T3 | T4 | T5 | T6 | Prot. | Óvalo | t() |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Pronto | `lob-pastilla.tie-pronto` | `tienda.css:116` | 9,3 | 10,1 | 9,3 | 15,6 | 15,6 | 15,6 | no | no | sí |
| Pronto | `vid-pastilla` | `tienda.css:66` | 9,5 | 10,3 | 9,5 | 15,9 | 15,9 | 15,9 | no | no | sí |
| Te quedan 8 de 8 hoy | `vid-quedan` | `salas.css:1753` | 9,7 | 10,5 | 9,7 | 16,2 | 16,2 | 16,2 | no | no | sí |
| Ver un video | `vid-fila-txt` | `tienda.css:45` | 12,2 | 13,3 | 12,2 | 20,4 | 20,4 | 20,4 | no | no | sí |
| +500 HC | `vid-fila-premio` | `tienda.css:50` | 12,2 | 13,3 | 12,2 | 20,4 | 20,4 | 20,4 | no | no | sí |
| DevLocal | `lob-nombre` | `salas.css:214` | 13 | 14 | 13 | 21,6 | 21,6 | 21,6 | no | no | no |
| Monedas | `sal-chip.tie-estante` | `salas.css:582 (her.)` | 13 | 14 | 13 | 21,6 | 21,6 | 21,6 | no | no | sí |
| Tapetes | `sal-chip.tie-estante` | `salas.css:582 (her.)` | 13 | 14 | 13 | 21,6 | 21,6 | 21,6 | no | no | sí |
| Reversos | `sal-chip.tie-estante.is-pronto` | `salas.css:582 (her.)` | 13 | 14 | 13 | 21,6 | 21,6 | 21,6 | no | no | sí |
| Avatares | `sal-chip.tie-estante.is-pronto` | `salas.css:582 (her.)` | 13 | 14 | 13 | 21,6 | 21,6 | 21,6 | no | no | sí |
| Premium | `sal-chip.tie-estante.is-pronto` | `salas.css:582 (her.)` | — | — | 13 | 21,6 | 21,6 | 21,6 | no | no | sí |

**rankings** · 34 filas

| Texto | Clase | CSS:línea | T1 | T2 | T3 | T4 | T5 | T6 | Prot. | Óvalo | t() |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Puesto | `rnk-cab-lista` | `rankings.css:112 (her.)` | 9,4 | 10,1 | 9,4 | 15,6 | 15,6 | 15,6 | no | no | sí |
| Jugador | `rnk-cab-lista` | `rankings.css:112 (her.)` | 9,4 | 10,1 | 9,4 | 15,6 | 15,6 | 15,6 | no | no | sí |
| Puntos | `rnk-cab-lista` | `rankings.css:112 (her.)` | 9,4 | 10,1 | 9,4 | 15,6 | 15,6 | 15,6 | no | no | sí |
| Venezuela | `rnk-lugar-t` | `rankings.css:195 (her.)` | 10,1 | 10,9 | 10,1 | 16,8 | 16,8 | 16,8 | no | no | no |
| Aruba | `rnk-lugar-t` | `rankings.css:195 (her.)` | 10,1 | 10,9 | 10,1 | 16,8 | 16,8 | 16,8 | no | no | no |
| Argentina | `rnk-lugar-t` | `rankings.css:195 (her.)` | 10,1 | 10,9 | 10,1 | 16,8 | 16,8 | 16,8 | no | no | no |
| Perú | `rnk-lugar-t` | `rankings.css:195 (her.)` | 10,1 | 10,9 | 10,1 | 16,8 | 16,8 | 16,8 | no | no | no |
| Venezuela · Carabobo / Venezuela · Distrito Capital | `rnk-lugar-t` | `rankings.css:195 (her.)` | 10,1 | 10,9 | 10,1 | 16,8 | 16,8 | 16,8 | no | no | dato o literal |
| Venezuela · Zulia | `rnk-lugar-t` | `rankings.css:195 (her.)` | 10,1 | 10,9 | 10,1 | 16,8 | 16,8 | 16,8 | no | no | no |
| Ecuador | `rnk-lugar-t` | `rankings.css:195 (her.)` | 10,1 | 10,9 | 10,1 | 16,8 | 16,8 | 16,8 | no | no | no |
| Colombia | `rnk-lugar-t` | `rankings.css:195 (her.)` | 10,1 | 10,9 | 10,1 | 16,8 | 16,8 | 16,8 | no | no | no |
| Curazao | `rnk-lugar-t` | `rankings.css:195 (her.)` | 10,1 | 10,9 | 10,1 | 16,8 | 16,8 | 16,8 | no | no | no |
| Panamá | `rnk-lugar-t` | `rankings.css:195 (her.)` | 10,1 | 10,9 | 10,1 | 16,8 | 16,8 | 16,8 | no | no | no |
| Estados Unidos | `rnk-lugar-t` | `rankings.css:195 (her.)` | 10,1 | 10,9 | 10,1 | 16,8 | 16,8 | 16,8 | no | no | no |
| Puerto Rico | `rnk-lugar-t` | `rankings.css:195 (her.)` | 10,1 | 10,9 | 10,1 | 16,8 | 16,8 | 16,8 | no | no | no |
| España | `rnk-lugar-t` | `rankings.css:195 (her.)` | 10,1 | 10,9 | 10,1 | 16,8 | 16,8 | 16,8 | no | no | no |
| México | `rnk-lugar-t` | `rankings.css:195 (her.)` | 10,1 | 10,9 | 10,1 | 16,8 | 16,8 | 16,8 | no | no | no |
| Chile | `rnk-lugar-t` | `rankings.css:195 (her.)` | 10,1 | 10,9 | 10,1 | 16,8 | 16,8 | 16,8 | no | no | no |
| Se muestran los 100 primeros. | `rnk-fin` | `rankings.css:266` | 10,1 | 10,9 | 10,1 | 16,8 | 16,8 | 16,8 | no | no | sí |
| Rankings | `sal-bloque` | `salas.css:363` | 10,4 | 11,3 | 10,4 | 17,4 | 17,4 | 17,4 | no | no | sí |
| Tu posición | `rnk-tu-l` | `rankings.css:320 (her.)` | 10,4 | 11,3 | 10,4 | 17,4 | 17,4 | 17,4 | no | no | sí |
| Puesto 7 | `rnk-tu-l` | `rankings.css:320 (her.)` | 10,4 | 11,3 | 10,4 | 17,4 | 17,4 | 17,4 | no | no | sí |
| Se gana jugando. No se compra. | `rnk-sub` | `rankings.css:81` | 11,2 | 12,1 | 11,2 | 18,6 | 18,6 | 18,6 | no | no | sí |
| SumaMente | `rnk-familia` | `rankings.css:421 (her.)` | 11,2 | 12,1 | 11,2 | 18,6 | 18,6 | 18,6 | no | no | sí |
| Ver en Google Play | `rnk-familia` | `rankings.css:421 (her.)` | 11,2 | 12,1 | 11,2 | 18,6 | 18,6 | 18,6 | no | no | sí |
| 1 | `rnk-medalla` | `rankings.css:238` | 11,5 | 12,5 | 11,5 | 19,2 | 19,2 | 19,2 | no | no | dato |
| 4 | `rnk-pos` | `rankings.css:152` | 11,9 | 12,9 | 11,9 | 19,8 | 19,8 | 19,8 | no | no | dato |
| Bachaquero_VE / Chamo_Pro | `rnk-nom` | `rankings.css:141 (her.)` | 12,6 | 13,7 | 12,6 | 21 | 21 | 21 | no | no | dato o literal |
| 96 | `rnk-cifra` | `rankings.css:141 (her.)` | 12,6 | 13,7 | 12,6 | 21 | 21 | 21 | no | no | dato |
| DevLocal | `rnk-nom` | `rankings.css:141 (her.)` | 12,6 | 13,7 | 12,6 | 21 | 21 | 21 | no | no | no |
| tú | `rnk-yo` | `rankings.css:141 (her.)` | 12,6 | 13,7 | 12,6 | 21 | 21 | 21 | no | no | sí |
| DevLocal | `lob-nombre` | `salas.css:214` | 13 | 14 | 13 | 21,6 | 21,6 | 21,6 | no | no | no |
| Los grandes maestros | `sal-chip` | `salas.css:582 (her.)` | 13 | 14 | 13 | 21,6 | 21,6 | 21,6 | no | no | sí |
| Las grandes fortunas | `sal-chip` | `salas.css:582 (her.)` | 13 | 14 | 13 | 21,6 | 21,6 | 21,6 | no | no | sí |

**pantalla final** · 3 filas

| Texto | Clase | CSS:línea | T1 | T2 | T3 | T4 | T5 | T6 | Prot. | Óvalo | t() |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Salir de la mesa | `btn.btn-primary` | `gameTable.css:1931` (12) · `gameTable.css:2779` (3) · `gameTable.css:491` (45) | 12 | 12 | 12 | 13 | 13 | 16,9 | sí | no | no |
| Ver tu nuevo ranking | `btn.cel-ranking` | `gameTable.css:1931` (12) · `gameTable.css:2779` (3) · `gameTable.css:491` (45) | 12 | 12 | 12 | 13 | 13 | 16,9 | sí | no | sí |
| DevLocal | `lob-nombre` | `salas.css:214` | 13 | 14 | 13 | 21,6 | 21,6 | 21,6 | no | no | no |

---

## B · Las frases transitorias

Tamaños medidos en **T1 · T3 · T6**, salvo «CSS». **R** = caja reservada, **M** = se monta y se desmonta. «Prot.» = su tamaño vive en `gameTable.css` u `opponentPanel.css`.

### B.1 · Bajo los asientos

El nodo es `.opp-status`, en las dos vías: `OpponentPanel.jsx:166-178` (3–5) y `GameTable.jsx:2206-2220` (`.ai-zone`, 2). Todas: **fuera del óvalo, tamaño protegido, caja R, 13 · 15 · 28,6**.

| Frase | Mesa | Quién la escribe | Clase | Dura | t() |
|---|---|---|---|---|---|
| «Pensando…» | IAS | `OpponentPanel.jsx:177` · `GameTable.jsx:2218` | `.opp-status-turn` | Su turno: 700–2.200 ms (`GameTable.jsx:1202`) | no |
| «Pasó» «Apostó» «Igualó» «Subió» | IAS | `GameTable.jsx:199-207`, guardada en `:1200` | `.opp-status` | Hasta su turno o la mano nueva (`:1984`) | no |
| «Descartó N» | IAS | `GameTable.jsx:1643` | `.opp-status` | Igual | no |
| «Se retiró» | IAS | `OpponentPanel.jsx:174` · `GameTable.jsx:2214` | `.opp-status` | Hasta la mano nueva | no |
| «ALL-IN» | ambas | `OpponentPanel.jsx:176` · `GameTable.jsx:2216` · `vistaAMesa.js:182` | `.opp-status-allin` | Hasta fin de mano | sí |
| «Su turno» | personas | `vistaAMesa.js:184` | `.opp-status-turn` | Su turno, hasta 20 s | sí |
| «Pasó» «Apostó» «Igualó» «Subió» | personas | `vistaAMesa.js:186-187` | `.opp-status` | Hasta su turno o la mano nueva | sí |
| «Descartó {n}» (la voz de la reposición, uno a uno) | personas | `vistaAMesa.js:185`, soltada por `GameTable.jsx:1718,1746` | `.opp-status` | Igual | sí |
| «Se retiró» · «Ausente» · «En anuncio» | personas | `vistaAMesa.js:181` · `:183` · `:176` | `.opp-status` | Hasta la mano nueva · mientras dure · hasta volver (tope 30 s) | sí |
| «Recargando» · «Fuera de esta mano» · «Abandonó» | personas | `vistaAMesa.js:180` · `:179` · `:175` | `.opp-status` | La pausa · la mano · hasta el fin | sí |
| «Sin saldo» | IAS | `OpponentPanel.jsx:168` | `.opp-status-elim` (CSS: 16, `opponentPanel.css:48`) | 1.000 ms de salida | no |

### B.2 · El badge TURNO, los relojes y la barra propia

Todas fuera del óvalo y con tamaño protegido.

| Frase | Mesa | Quién la escribe | Clase | T1 · T3 · T6 | Dura | Caja | t() |
|---|---|---|---|---|---|---|---|
| «Turno»/«T», «Mano»/«M», «Pie»/«P» | ambas | `OpponentPanel.jsx:88-94` · `GameTable.jsx:2156-2161,2673-2683` | `.seat-badge` | 10 · 10 · 13 | Turno o mano | M en móvil | no |
| «{n}s» turno y descarte | ambas | `GameTable.jsx:2752-2754,2794-2796,2938-2940` | `.timer-display`, `.ls-timer` | 18 · 22 · 26 | 20 s | M | no |
| «{n}s» del sorteo | personas | `SorteoMesa.jsx:210-219` | `.pvp-sc-reloj` | CSS: 22 (`pvp.css:78`) | 10 s | M | no |
| «… está pensando…» | ambas | `GameTable.jsx:2742-2745` | `.thinking` | 13 · 13 · 16,9 | Turno del rival | R | personas sí |
| «Barajando…» «Repartiendo cartas…» | ambas | `GameTable.jsx:2718,2722` | `.thinking` | 13 · 13 · 16,9 | 1.950 ms · el reparto | R | no |
| «Estás all-in — tus cartas siguen jugando.» | ambas | `GameTable.jsx:2735` | `.thinking` | 13 · 13 · 16,9 | Apuestas | R | sí |
| «Te retiraste — …» · «Fuera de esta mano» | ambas | `GameTable.jsx:2789` | `.thinking` | 13 · 13 · 16,9 | Apuestas | R | personas sí |
| «La mesa descarta…» «Esperando a la mesa…» «Reponiendo…» | ambas | `GameTable.jsx:2837,2841,2845` | `.thinking` | 13 · 13 · 16,9 | El descarte | R | parte |
| Pista de descarte, «N de M» | ambas | `GameTable.jsx:2815-2828` | `.discard-hint` | 11 · 11 · 16,9 | Hasta 20 s | R | no |

### B.3 · En el óvalo

Todas **dentro del óvalo, tamaño protegido**. La crónica y la frase del resultado van en `<p class="game-message">` (`GameTable.jsx:2398-2400,2462-2464`). En T3 la cifra doble es «mesas 3–5 / mesa 2».

| Frase | Mesa | Quién la escribe | T1 · T3 · T6 | Dura | Caja | t() |
|---|---|---|---|---|---|---|
| Acción: «La IA pasa.» «… apuesta N» «… sube a N» | IAS | `cronicaCore.js:113-128` | 18–22 · 15/12 · 36,4 (`.msg-action`) | Hasta la siguiente lectura | R | no |
| Acción: «{n} pasa.» etc. | personas | `vozHumanos.js:41-46` | 18–22 · 15/12 · 36,4 | Igual | R | no |
| «… va all-in con N.» | ambas | `cronicaCore.js:117,127` · `vozHumanos.js:45` | **13 · 9/12 · 18,2** (sale chica: no entra en `msg-action`) | Igual | R | no |
| «A las 2 — Tu turno.» «Repartiendo...» «La mesa descarta.» | ambas | `cronicaCore.js:155-170` · `vozHumanos.js:88-97` | 13 · 9/12 · 18,2 | Hasta la acción | R | no |
| «{n} descarta N cartas.» «{n} no descarta.» | ambas | `GameTable.jsx:253-258,1644` · `vozHumanos.js:53-58` | 13 · 9/12 · 18,2 | 750 ms sin cartas; 2.175 + 412,5 por carta extra | R | no |
| «1 turno más y saldrás de la mesa» | personas | `PartidaPvP.jsx:176-184` | 13 · 9/12 · 18,2 | Hasta que juegues; sustituye la crónica | R | sí |
| «{n} dejó la mesa · la mesa ahora es de N» | personas | `vozHumanos.js:77-85` | 13 · 9/12 · 18,2 | 3 s y sigue hasta cambiar de fase | R | no |
| «{n} abandonó la mesa.» | personas | `vozHumanos.js:127-132` | 13 · 9/12 · 18,2 | Hasta la acción | R | sí |
| **Resultado:** «¡Ganas con Oros, 27 pts!» «{X} gana con…» «Empate…» | ambas | `resultadoCore.js:102-190` | 13 · 9/12 · 19,5 (`.voz2-texto`, 2 líneas) | IAS: hasta «Siguiente mano». Personas: 4 s, u 8 s con revelación | R | no |
| Cola: «El pozo se partió…» «A la IA se le devuelven N…» «Se te devuelven…» | ambas | `cronicaCore.js:220-239` | La misma frase, **dentro del mismo recorte** | Igual | R | no |
| «+N» del pozo | ambas | `GameTable.jsx:2388,2454` | 16 · 16 · 20,8 | 600 ms | M | no |
| «A igualar» | ambas | `GameTable.jsx:2390-2392` | 10 · 8 · 13 | Apuesta viva | R | no |
| «X se quedó sin Heptacoins…» | IAS | `GameTable.jsx:2009,2420` | CSS: 12 (`gameTable.css:929`) | 3.750 ms | M | no |

### B.4 · Capas fuera del óvalo

| Frase | Mesa | Quién la escribe | Clase / capa | Prot. | T1 · T3 · T6 | Dura | Caja | t() |
|---|---|---|---|---|---|---|---|---|
| Globo de VOZ-2, la frase entera | ambas | `GameTable.jsx:3053-3060` · `Voz2Capa.jsx:67` | `.voz2-capa`, fixed z 20, sobre el óvalo | no | CSS: 14 · 14 · 15 (`voz2.css:161,172`) | Hasta tocar u otra mano | M | no |
| «…» + flechita | ambas | `GameTable.jsx:2342-2344` | `.voz2-indicio`, **dentro del óvalo** | no | Icono de 9 | Con recorte | R | — |
| «Mano 7 · Es Mano Ana» | ambas | `transicionCore.js:25-29` · `TransicionMano.jsx:85` | `.tm-pastilla`, portal z 140 | no | 15 · 15 · 19,5 | **1.900 ms** | M | no |
| «Elige una carta para saber quién es Mano» | personas | `sorteoMesaCore.js:55` · `SorteoMesa.jsx:205-209` | `.pvp-sc-franja`, z 150 | no | 14 · 14 (12 en crónica) · 19,5 | Hasta 10 s | M | no |
| «Hay empate entre {n}…» · «Tercer empate: el azar decide» | personas | `sorteoMesaCore.js:56-57` | igual | no | igual | 4.350 · 1.550 ms | M | no |
| «¡Ya tenemos Mano!» | personas | `sorteoMesaCore.js:58,75` | igual | no | igual | 4.350 ms (2.800 tras azar) | M | no |
| Mensajes prediseñados, burbuja | ambas | `Reacciones.jsx:263-287` · `MensajesMesa.jsx:62-85,219-230` | `.u2-burbuja`, `.pvp-msj-*` | escritorio sí | 14 · 14 · 18,2 | 3.000 ms | M | no |
| Burbuja propia en teléfono vertical | personas | `MensajesMesa.jsx:124-142,219` | `.es-en-ovalo`, **tapa el óvalo** | no | 14 · — · — | 3.000 ms | M | no |
| «{nombre} sigue en el anuncio» | personas | `entreManosCore.js:125-130` · `AnuncioPvP.jsx:42` | `.pvp-anu-quien`, z 130 | no | 16 · 16 · 20,8 | Hasta 30 s | M | sí |
| «Publicidad» · «Omitir» · «Quitar publicidad» | personas | `AnuncioPvP.jsx:25-45` | `.pvp-anu-*` | «Omitir» sí | 12 · 12 · 15,6 / 12 · 12 · 16,9 / 14 · 14 · 18,2 | Hasta 30 s | M | sí |
| Oferta de recarga: anillo + «Recargar» | ambas | `BurbujaRecarga.jsx:44-69` · `RecargaPvP.jsx:153-162` | `.rec-burbuja`, `.pvp-rec-ancla` | no | Rótulo 15 · CSS · 19,5; cifra 14 · CSS · 18,2 | 15 s | Ranura R | sí |
| Tarjeta de recarga | ambas | `GameTable.jsx:3123-3137` · `RecargaPvP.jsx:176` | `.bankrupt-*` | parte | CSS: título 14–18, resto 12–13 (`apu.css:157-260`) | Hasta decidir | M | sí |
| «Esperando a {nombre}…» | personas | `RecargaPvP.jsx:163-167` | `.pvp-rec-espera` | no | 14 · — · 18,2 | Hasta 15 s | M | sí |
| Puntos: «Mejor palo…» · chip del ganador | ambas | `OpponentPanel.jsx:95,183` · `GameTable.jsx:2162,2191,2637,2686` | `.score-tag`, `.win-score-chip` | sí | 12 · 12 · 15,6 | El pago | parte | no |
| Saldo flotante del rival | ambas | `OpponentPanel.jsx:142` · `GameTable.jsx:2234` | `.chip-balance-float` | sí | CSS: 14 | 3.000 ms | M | — |
| Popup «Mano actual» | ambas | `ManoActual.jsx:42-94` | `.u3-popup` | escritorio sí | CSS: 11–13 | 4.000 ms | M | casi todo |

### B.5 · Las candidatas de la opción

Sin estas nueve, un adulto no sabe qué pasó en la mano.

| # | Frase | Capa de hoy | ¿En el óvalo? | Se enciende en | Reloj que la apaga |
|---|---|---|---|---|---|
| 1 | Acción del rival («Pasó», «Apostó», «Igualó», «Subió») | `.opp-status` | no | IAS `GameTable.jsx:1200`; personas `vistaAMesa.js:186` → `mesaPvPCore.js:239` → `GameTable.jsx:1746` | Ninguno |
| 2 | «Se retiró» | `.opp-status` | no | IAS `GameTable.jsx:1201`; personas `vistaAMesa.js:181` | Ninguno |
| 3 | «ALL-IN» | `.opp-status-allin` | no | IAS `:1201`; personas `vistaAMesa.js:182` | Ninguno |
| 4 | «Descartó N» | `.opp-status` | no | IAS `GameTable.jsx:1643`; personas `:1718` | Ninguno |
| 5 | «Ausente» / «En anuncio» | `.opp-status` | no | `vistaAMesa.js:183,176` | Ninguno |
| 6 | Frase del resultado, con reparto y devoluciones | `.voz2-texto` | **sí** | Derivada: `GameTable.jsx:566` → `:2364,:2440` | IAS: el botón (`:2863-2866`). Personas: reloj del árbitro |
| 7 | «Mano 7 · Es Mano Ana» | `.tm-pastilla` | no (encima) | `TransicionMano.jsx:85` | **Sí**, `:89-93` (1.900 ms) |
| 8 | «¡Ya tenemos Mano!» | `.pvp-sc-franja` | no (encima) | `sorteoMesaCore.js:75` vía `SorteoMesa.jsx:112` | Fin del volteo |
| 9 | «1 turno más y saldrás de la mesa» | `.game-message` | **sí** | `PartidaPvP.jsx:176-184` | Ninguno: hasta que juegues |

**Lo que condiciona el diseño:**

- **Solo el rótulo del asiento conserva todas las acciones.** La jugada que cierra una ronda nunca sale en el óvalo (`cronicaCore.js:247`, `vozHumanos.js:114`). Por eso la opción debe colgar de `.opp-status` y no de la crónica.
- **Casi ninguna candidata tiene reloj propio.** La opción pone el suyo: arranca cuando cambia el texto y se apaga sola, sin tocar la frase de siempre.
- **No hay una variable común a las dos mesas**, pero sí un **nodo común**: `.opp-status`, en las dos mesas y las dos vías. `.opp-status-turn` permite descartar «Pensando…» y «Su turno» sin comparar textos.
- **El «grande» donde más falta es T3**, mesas 3–5: la frase del resultado y la crónica están a **9 px**. Bajo los asientos ya hay 13–15.

---

## C · Por dónde entraría la opción

### C.1 · Los interruptores que ya existen

| Ajuste | Dónde está el mando | Se guarda en | Cómo llega a la mesa |
|---|---|---|---|
| Sonido | ⚙ (`HojaContenido.jsx:172-176`) y ⋮ | `ajilei.sound` (`SoundContext.jsx:14`) | Contexto y `Howler.mute` |
| Partida rápida | Solo ⋮ (`menuEntradas.js:76-78`, `UtilitiesMenu.jsx:214-232`) | `ajilei.partidaRapida` = `si`/`no` (`partidaRapida.js:17`) | Estado en `GameTable.jsx:602-608` |
| Ritmo Normal · Rápido | Armar mesa (`ArmarMesa.jsx:252-261`) | Servidor, `salas.ritmo`; se recuerda en `ajilei.salaConfig` | `sala.ritmo` → `mesaPvPCore.js:122-124` |
| Tapete y tono | Tienda; fila del ⚙ que lleva a ella | Servidor, `inventario`; copia en `ajilei.tapete` | `body[data-tapete]` (`useTapetes.js:67-75`) → `tapetes.css` |
| Ojito del saldo | Píldora | `ajilei.saldoOculto` | La mesa no lo lee |

**El patrón más parecido se compone de dos:** la preferencia del aparato con mando propio es **Partida rápida**; el cambio de aspecto sin tocar el juego es el **tapete**.

### C.2 · Dónde se guarda: **en el aparato**

**Recomendación:** `localStorage`, clave **`ajilei.letraGrande`** con `si`/`no`, como `ajilei.partidaRapida` y `ajilei.saldoOculto` (`ajilei.lec` no sigue la convención de nombres descriptivos).

- El repo apoya al rector: `partidaRapida.js:4-6`, `saldoOculto.js:4-8`, `AJILEI_Configuracion_v1.5.md:104,215`. A Supabase va lo de la economía (`testClavesAlmacen.test.js:2-6`).
- `profiles` no tiene columna de preferencias, y la cuenta solo puede actualizar nombre, país y estado (`20261030013000_cfg1b_perfil.sql:215-216`).
- **Coste obligatorio:** la clave y su archivo se declaran en `scripts/testClavesAlmacen.test.js:25-66`, con su documento fuente. Sin eso sale rojo.
- La fila nueva del ⚙ debe copiarse en `FilasReservadas` (`HojaConfiguracion.jsx:49-77`) para que la hoja no salte.

### C.3 · El mecanismo: **(a), la capa flotante, y el globo para el resultado**

| | (a) Capa flotante nueva | (b) Globo de VOZ-2 | (c) `data-lec` + `scale()` en sitio |
|---|---|---|---|
| Protegidos | No | No | Las reglas viven ahí; se pisarían desde fuera |
| Óvalo del teléfono | No lo toca: pasa por encima | Encima, ya aprobado | **Prohibido** para crónica y resultado |
| O1 | Intacta por construcción | Intacta | Riesgo: `transform` no mueve, pero tapa sin control |
| Varias frases | Sí, una por asiento | **Una sola**, centrada | Sí |
| Mesa de 5 en T3 | Cabe (medido abajo) | Solo sirve para el resultado | El óvalo mide 37 px de alto: no cabe |
| Coste | ≈ 120 min con su vara | ≈ 25 min más, solo resultado | — |

**Recomendación:**

- **Las frases de los asientos (candidatas 1 a 5) van en una capa flotante nueva**, portal a `.game-table-screen`, como `TransicionMano.jsx:97`, `MensajesMesa.jsx:217` y `RecargaPvP.jsx:151`.
- **Se alimenta del DOM:** observa los `.opp-status` y copia su texto cuando cambia. Así no toca `OpponentPanel`, sirve a las dos vías y a las dos mesas, y no necesita traducción propia. Se ancla al asiento por `[data-coin-target]` (precedente: `MensajesMesa.jsx:101-106`).
- **El resultado (candidata 6) reutiliza el globo de VOZ-2**, que ya sale sobre el óvalo y cabe la frase entera: con la opción encendida se abre solo unos 2 s, también cuando no hay recorte.
- **La pastilla, el sorteo y el aviso de ausencia (7, 8, 9):** la pastilla y la franja ya son capas; solo crecen con la opción. El aviso de ausencia sale en la capa nueva.

**Medido en la mesa de verdad:** una etiqueta «Descartó 3» centrada sobre cada `.opp-status`.

| Tamaño | Mesa | 18 px | 20 px | 22 px | 24 px |
|---|---|---|---|---|---|
| T1 | 2 | toca el óvalo | igual | igual | igual |
| T1 | 5 | los 2 asientos de abajo tocan el óvalo | igual | igual | igual |
| T2 | 5 | limpio | limpio | limpio | limpio |
| T3 | 2 | limpio | limpio | limpio | limpio |
| T3 | 5 | limpio | **limpio** | toca el óvalo (los 4) | igual |

En ningún caso tapa las cartas propias ni pisa a otra etiqueta. **20 px es el tamaño natural**: limpio en T3 con la mesa de 5. Si en T1 la etiqueta crece hacia arriba, deja de tocar el óvalo.

### C.4 · `prefers-reduced-motion`

El repo lo respeta en 23 bloques CSS de 17 hojas y en 6 archivos JS. **En la mesa** solo lo hacen `transicion.css:31` (la pastilla), `rec.css:62`, `embellecimiento.css:132` y los emojis. `gameTable.css`, `opponentPanel.css` y `pvp.css` no tienen ninguna regla, y la celebración de la mano no lo consulta (`GameTable.jsx:1110-1112`).

**Con LEC-1:** el molde es `transicion.css`. Con movimiento reducido la frase sale ya grande y se apaga con un fundido o de golpe, sin encogerse.

---

## D · Los textos fijos: cuánto pueden subir

### D.1 · Los tokens

**No hay escala tipográfica:** ningún `--fs-*`. Hay **384 declaraciones de `font-size`**: 205 en px fijos y 104 con `calc(var(--u) * k)`, entre otras.

| Token | Definido en | Valor | Uso |
|---|---|---|---|
| `--u` | `lobby.css:66`, `salas.css:56`, `tienda.css:262`, `video.css:19` y otras | `clamp(3.2px, 1vmin, 6px)` (`pvp.css:32` lo fija en 4 px) | 118 usos dentro de `font-size` |
| `--ico` / `--ico-caja` | `lobby.css:86-87`, `salas.css:63-64` | 6u / 1,45 × `--ico` | 32 / 16 |
| `--dsk-u2-fs` | `gameTable.css:5780`, `menuMovil.css:372` | 14 px | 4 |
| `--font-base` | `theme.css:100` | Arial (familia) | 17 |

Conviven dos mundos: **las pantallas previas escalan con `--u`** (subir un factor sube esa letra en todos los tamaños), y **la mesa usa px sueltos**, 91 de 95 en `gameTable.css`. El Sistema de Diseño (§4, `:55-59`) no da tamaños.

### D.2 · El piso que aguanta cada pantalla

La prueba, hecha en memoria del navegador: **toda** la letra por debajo del piso sube a ese piso a la vez, salvo la del óvalo, con el interlineado fijo. La cifra es el piso más alto (9 a 13) en que **nada se mueve más de 0,5 px y nada se corta**.

| Pantalla | T1 | T2 | T3 | T4 | T5 | T6 | Primer elemento que rompe (T1; si no, T3) |
|---|---|---|---|---|---|---|---|
| Lobby | 11 | 12 | 11 | ≥ 13 | ≥ 13 | ≥ 13 | T1, piso 12: mueve span.lob-nombre (1.8), img.chip-token.chip-token--icon (1.8) |
| ⚙ | 9 | 10 | 9 | ≥ 13 | ≥ 13 | ≥ 13 | T1, piso 10: mueve span.cfg-valor (2.1) |
| Retar | 10 | 11 | 10 | ≥ 13 | ≥ 13 | ≥ 13 | T1, piso 11: mueve section.sal-bloque (0.8), section.sal-bloque (0.8) |
| Mesa IAS 2 | 10 | 10 | 10 | 10 | 10 | ≥ 13 | T1, piso 11: mueve div.header-center (3.9), span.pbr-tags (3.4) |
| Mesa IAS 5 | 10 | 10 | 10 | 10 | 10 | ≥ 13 | T1, piso 11: mueve span.pbr-tags (3.4), span.opp-header-anchor (0.7) |
| Salas | < 9 | 9 | 11 | 12 | ≥ 13 | ≥ 13 | T1, piso 9: «Te faltan 245.000 HC» (div.sal-mesa-l2, hoy 8.2): se corta con … |
| Armar mesa | 11 | 12 | 11 | ≥ 13 | ≥ 13 | ≥ 13 | T1, piso 12: «Con código para compartir. Solo entra qu» (span.sal-modo-d, hoy 10.4): parte línea |
| Sala de espera | < 9 | < 9 | < 9 | ≥ 13 | ≥ 13 | ≥ 13 | T1, piso 9: mueve button.sal-esp-silla.is-arriba (1.3) |
| Mesa personas 2 | 10 | 10 | 10 | 10 | 10 | ≥ 13 | T1, piso 11: mueve div.header-center (3.9), span.pbr-tags (1.8) |
| Mesa personas 5 | 10 | 10 | 10 | 10 | 10 | ≥ 13 | T1, piso 11: mueve strong.player-bar-left (4.0), span.opp-header-anchor (0.9) |
| Tienda | 9 | 10 | 9 | ≥ 13 | ≥ 13 | ≥ 13 | T1, piso 10: «Pronto» (span.lob-pastilla.tie-pronto, hoy 9.3): sale de pantalla |
| Rankings | 10 | 10 | 10 | ≥ 13 | ≥ 13 | ≥ 13 | T1, piso 11: «Rankings» (h2, hoy 10.4): desborda su caja |
| Pantalla final | 10 | 10 | 10 | 10 | 10 | ≥ 13 | T1, piso 11: mueve div.header-center (3.9) |

**Lectura:**

- **Lobby y Armar mesa:** 11 en T1 y T3, 12 en T2. **Retar:** 10 y 11. **Rankings:** 10.
- **⚙ y tienda:** 9 en T1 y T3. Las culpables son las pastillas «Sí» y «Pronto»; sin ellas la pantalla aguanta más (§A.2).
- **Salas:** la Llena es la que tira el piso. Sin ella, la pantalla aguanta 11 en T1 y T3, y 12 en T2.
- **Sala de espera:** no sube sin mover. Es la pantalla más chica de todas (7,9) y la silla no tiene sitio. **Es decisión de lámina.**
- **Mesa, en todos los tamaños con factor 1:** el piso es **10**, justo el sellado (TAB-2, y `escala.css:161,171`). A 11 se mueven las insignias y la cabecera (`.pbr-tags`, `.header-center`, 3 a 4 px). Con T6 no hay problema: el zoom ya da 13.

### D.3 · Lo que está sellado

- **10 px** en insignias y «Mano #N»: `gameTable.css:588,981`, y en `h` `max(10px, 10/f)` (`escala.css:155-162`). «Pozo» y comodín, igual en `h` (`escala.css:170-175`, INV-64).
- **Frase del óvalo en `hb`:** ≥ 10 en mesas 3–5 y ≥ 12 en la de 2 (`escala.css:258`, INV-61).
- **Subir el piso a 11 o 12 en el teléfono mueve la mesa.** No es gratis: es la pregunta §P-4.

### D.4 · Las subidas que sí mueven algo (para la lámina)

| Subida | Qué mueve |
|---|---|
| Insignias, «Mano #», «Mesa N» a 11 o 12 | La fila de cabecera y la barra propia, 3–4 px |
| Multiplicadores de T3 (10) y botones de apuesta de T3 (11) | Dentro de `.action-area`; hay que probarlos en lámina |
| Sillas de la sala de espera («Tú», nombres) | La silla; nombres largos dejan de caber |
| Pastillas «Sí» y «Pronto» | Lo que tienen al lado, 1,4–2,1 px |
| Línea 2 de la Llena | No cabe sin acortar el texto |

### D.5 · Los botones

| Botón | Clase | T1 | T2 | T3 | T4 | T5 | T6 | CSS |
|---|---|---|---|---|---|---|---|---|
| Acerca de | `lob-fila` | 12,2 | 13,3 | 12,2 | 20,4 | 20,4 | 20,4 | `hojaMarco.css:204 (her.)` |
| All-in (300) | `btn.btn-call.btn-allin` | — | — | — | 13 | — | 16,9 | `gameTable.css:491` |
| Apostar | `btn.btn-bet` | 12 | 12 | 11 | 13 | 13 | 16,9 | `gameTable.css:1931` · `gameTable.css:3244` · `gameTable.css:491` |
| Cerrar sesión | `lob-fila` | 12,2 | 13,3 | 12,2 | 20,4 | 20,4 | 20,4 | `hojaMarco.css:204 (her.)` |
| Crear mesa privada | `sal-cta` | 15,1 | 16,4 | 15,1 | 25,2 | 25,2 | 25,2 | ≥ 13,5 |
| Eliminar cuenta | `lob-fila.lob-fila-peligro` | 12,2 | 13,3 | 12,2 | 20,4 | 20,4 | 20,4 | `hojaMarco.css:204 (her.)` |
| Enviar sugerencia | `lob-fila` | 12,2 | 13,3 | 12,2 | 20,4 | 20,4 | 20,4 | `hojaMarco.css:204 (her.)` |
| Idioma | `lob-fila` | 12,2 | 13,3 | 12,2 | 20,4 | 20,4 | 20,4 | `hojaMarco.css:204 (her.)` |
| Igualar ( | `btn.btn-call` | 12 | 12 | 11 | 13 | 13 | 16,9 | `gameTable.css:1931` · `gameTable.css:3244` · `gameTable.css:491` |
| Iniciar mano | `btn.btn-primary` | 12 | 12 | 11 | 13 | 13 | 16,9 | `gameTable.css:1931` · `gameTable.css:3244` · `gameTable.css:491` |
| Jugar contra jugadores | `lob-cta-jugadores` | 15,8 | 17,2 | 15,8 | 26,4 | 26,4 | 26,4 | ≥ 13,5 |
| Jugar contra las IAS | `lob-cta-ia` | 15,8 | 17,2 | 15,8 | 26,4 | 26,4 | 26,4 | ≥ 13,5 |
| Normal | `sal-chip` | 13 | 14 | 13 | 21,6 | 21,6 | 21,6 | `salas.css:582` |
| Omitir | `btn.btn-pass.pvp-anu-omitir` | 12 | 12 | 12 | 13 | 13 | 16,9 | `gameTable.css:1931` · `gameTable.css:2779` · `gameTable.css:491` |
| Pasar | `btn.btn-pass` | 12 | 12 | 11 | 13 | 13 | 16,9 | `gameTable.css:1931` · `gameTable.css:3244` · `gameTable.css:491` |
| Rápido | `sal-chip` | 13 | 14 | 13 | 21,6 | 21,6 | 21,6 | `salas.css:582` |
| Recargar | `btn.btn-recarga` | 12 | 12 | 11 | 13 | 13 | 16,9 | `gameTable.css:1931` · `gameTable.css:3244` · `gameTable.css:491` |
| Recargar | `rec-rotulo` | 15 | 15 | — | 15 | 15 | 19,5 | ≥ 13,5 |
| Retirarse | `btn.btn-fold` | 12 | 12 | 11 | 13 | 13 | 16,9 | `gameTable.css:1931` · `gameTable.css:3244` · `gameTable.css:491` |
| Salir de la mesa | `sal-esp-salir` | 11,5 | 12,5 | 11,5 | 19,2 | 19,2 | 19,2 | `salas.css:1097` |
| Salir de la mesa | `btn.btn-primary` | 12 | 12 | 12 | 13 | 13 | 16,9 | `gameTable.css:1931` · `gameTable.css:2779` · `gameTable.css:491` |
| Sentarme a la mesa | `sal-cta.es-retar` | 15,8 | 17,2 | 15,8 | 26,4 | 26,4 | 26,4 | ≥ 13,5 |
| Siguiente mano | `btn.btn-primary` | 12 | 12 | 11 | 13 | 13 | 16,9 | `gameTable.css:1931` · `gameTable.css:3244` · `gameTable.css:491` |
| Sin descartar | `btn.btn-primary` | 12 | 12 | 11 | 13 | 13 | 16,9 | `gameTable.css:1931` · `gameTable.css:3244` · `gameTable.css:491` |
| Sonido | `lob-fila` | 12,2 | 13,3 | 12,2 | 20,4 | 20,4 | 20,4 | `hojaMarco.css:204 (her.)` |
| Subir a | `btn.btn-raise` | 12 | 12 | 11 | 13 | 13 | 16,9 | `gameTable.css:1931` · `gameTable.css:3244` · `gameTable.css:491` |
| Unirme | `sal-unir` | 11,5 | 12,5 | 11,5 | 19,2 | 19,2 | 19,2 | `salas.css:535` |
| Ver tu nuevo ranking | `btn.cel-ranking` | 12 | 12 | 12 | 13 | 13 | 16,9 | `gameTable.css:1931` · `gameTable.css:2779` · `gameTable.css:491` |

- **«Normal · Rápido» es `.sal-chip`**; «Entendido» y «Ahora no» son `.btn.btn-pass` (`RecargaPvP.jsx:183-184`), con los tamaños de «Pasar» en la mesa, solo que a 12 en T3 (`gameTable.css:2779`, fuera de `.action-area`; cifra de CSS, la tarjeta no se abrió). «Omitir» de SumaMente: `max(13px, 3,2u)` (`sumamente.css:106`).
- **Regla de la casa:** no hay reset global de `<button>`. Se cumple por componente en `.sal-cta` (`salas.css:656`, con `line-height: 1`), `.sal-chip` (`:581`) y `.lob-cta-ia` (`lobby.css:390`); `.lob-fila` trae `font: inherit` (`hojaMarco.css:202`) con su propio relleno.
- **`.btn` de la mesa no la cumple** (`gameTable.css:487-495`): sin `font: inherit`, con la familia del navegador y `padding: 9px 18px`. Está en un protegido y no estorba a LEC-1. Se anota.

---

## E · `vuelo humano` (INV-82)

### E.1 · Qué dice INV-82

> «con su semilla sellada, la 1, `vuelo humano` sale rojo por `septimaEnDestino`. La séptima moneda aterriza a 10,44 px en horizontal de la moneda del humano (dy 0,17) […] El defecto es del producto, no de la semilla: el destino se mide en la transición de fase (`useCelebracion.js:87`), las monedas salen al soltar la espera de `showdown.mp3` (`:98`), y en ese hueco la moneda del humano se desplaza. […] Se retira cuando LEC-1 vuelva a medir el destino de la moneda al soltar la espera» (`AJILEI_Invariantes_v1.0.md:122`).

### E.2 · Qué mide la vara y qué obtiene

- **Espera** (`diagDSK.mjs:12668`): `septimaEnDestino`, la séptima moneda a ≤ 1 px en x y en y de `[data-coin-target] .chip-token`. Se mide en el último muestreo por fotograma antes de que la capa muera (`:12512-12515`, `:12626-12635`), en 1920×1080 con la escala forzada a 1.
- **Obtiene** (último log, `%TEMP%\varas-mwhrzfi8\vuelo.log`, sobre `b9474c7`): `Δ dx=10.33 dy=0.09 · pozo 700→0 · saldo ["500"]→1250 · FALLA [septimaEnDestino]`. La IA, en verde con dx 0,34.

### E.3 · La causa, con el código y una medida

**La pista está en el log: el saldo pasa de `500` a `1250`, de 3 a 4 dígitos.**

1. El motor ya pagó al pintar `PAYOUT`. En ese primer render la barra enseña la cifra **final**, 1250, porque `celebracion.activa` aún es `null` (`GameTable.jsx:1113-1123`).
2. `useLayoutEffect` mide el destino con esa cifra en pantalla (`useCelebracion.js:87`, `GameTable.jsx:687-707`).
3. `setActiva` (`:115`) activa la retención: antes de pintar, la barra pasa a la cifra **retenida**, 500.
4. **La barra va alineada a la derecha** (`.player-bar-right`, `gameTable.css:265-266`), y la moneda está a la izquierda de la cifra. Con un dígito menos, **la moneda se corre un dígito a la derecha**.
5. Las monedas vuelan al sitio medido en el paso 2, y la vara compara con el sitio del paso 4.

**Medida** (cambiando solo el número en el navegador):

| Tamaño | Alineación | 500 → 950 (mismos dígitos) | 500 → 1250 | 1250 → 12500 |
|---|---|---|---|---|
| T1, T2, T4, T5 | derecha | 0 | **10,19 px** | 10,2 px |
| T3 | izquierda | 0 | 0 | 0 |
| T6 (zoom 1,3) | derecha | 0 | **13,25 px** | 13,25 px |

Los 10,19 explican los 10,33 y 10,44 del arnés, más el resto del muestreo. También explican por qué antes salía verde: **solo falla si ganar cambia el número de dígitos.**

**La hipótesis del cierre es correcta a medias:**

- **Sí:** medir al soltar la espera daría verde en una mano con `showdown.mp3`, porque entonces ya está la cifra retenida.
- **No explica el hueco:** la moneda no se mueve durante los 1,9 s, se mueve en el mismo instante. El comentario de `useCelebracion.js:20-22` («el tablero no se mueve entre ambos instantes») dejó de ser cierto con la retención de VIS-3c.
- **No cubre todo:** sin volteo (ganar porque todos se retiran) la espera es 0 y `arrancar` corre en el mismo efecto (`:116`), con la cifra final aún en pantalla. El defecto seguiría ahí.
- **Y deja un salto nuevo:** al aterrizar, la cifra sube y la moneda salta 10 px a la izquierda, ya sin monedas que lo disimulen.

### E.4 · Recomendación: **es de producto, y pequeño**

- **Qué ve hoy el jugador:** cuando ganar le cambia el número de dígitos (de 999 a 1.000, de 9.999 a 10.000), en vertical y en escritorio las monedas aterrizan unos 10 px a la izquierda de su moneda, y en ese instante la moneda salta a ese sitio al subir la cifra. Es sutil y dura un fotograma. En T3 no pasa.
- **Arreglo recomendado:** mientras dura la retención, la cifra **conserva el ancho de la cifra final** (mínimo en `ch`, alineada a la derecha). La moneda no se mueve en ningún momento, el destino medido es exacto en los dos caminos y no hay salto. Es O1 aplicada a la cifra. Toca `GameTable.jsx:2928` y una regla en hoja libre.
- **Alternativa,** en una línea: volver a medir tras pintar la retención. Da verde, pero deja el salto al aterrizar.
- **Estimación:** 20 min de código, unos 6 min de `vuelo --semilla=1` y 10 min para retirar la excepción de INV-82 y corregir su causa y el comentario de `useCelebracion.js`. **≈ 35 min.**

---

## F · El arnés y las varas

### F.1 · Lo que ya mide letra o anchos

| Vara | Qué mide | Dónde |
|---|---|---|
| `diagDSK tab` · V-h | Insignias, «Mano #», «Pozo» y comodín ≥ 10 visibles (`chicaMin`) | `scripts/tab/tab.mjs:286-291` |
| `diagDSK tab` · V-hb, V-frase | La frase ≥ 10 (mesas 3–5) y ≥ 12 (mesa 2) en `hb`; lectura de la frase contra el teléfono | `tab.mjs:241` · INV-61, INV-64 |
| `diagDSK tab` · matriz de TAB-3 | Tamaños de letra por pieza | `tab.mjs:376-392` |
| `snapshotFrentes`, el volcado de `diagDSK` | CSS de los textos de los paneles, sin piso | `diagDSK.mjs:720-759` |
| `diagSAL` | Proporción de letra de la línea 2 de la Llena | `diagSAL.mjs:483-484` |
| `diagDSK pvp` | 15 «W» en nombres y óvalo, sin veredicto | `scripts/pvp/pvp.mjs` |

`luz` compara cajas y contraste; no mide letra. **Ninguna vara recorre todas las pantallas con un piso.**

### F.2 · Lo que pediría LEC-1

| Celda nueva | Qué dice su verde | Escribirla | Correrla |
|---|---|---|---|
| `lec.mapa` | Ningún texto de las pantallas de §A baja de su piso, en los seis tamaños, con la lista de excepciones escrita (óvalo del teléfono, y lo que decida Victor) | 30 min (el guion de esta sonda es la base) | ≈ 5 min |
| `lec.delta` | Con la opción encendida, **Δ = 0**: ninguna caja de la mesa se mueve frente a apagada, mesas 2 y 5, T1, T3, T5, en reposo, turno y pago | 25 min | ≈ 3 min |
| `lec.capa` | La frase aparece grande, se apaga sola, no tapa las cartas propias, respeta movimiento reducido y **apagada no se monta nada** | 20 min | ≈ 2 min |

### F.3 · El control y el peso

- **LEC-1 toca la mesa** (`GameTable.jsx`): **control de las IAS obligatorio antes del push**, en ventana oculta, las 19 varas con `pvp.mesa` y `pvp.lm`.
- **`completo` va después del push**, como segunda línea base (unas 6 h 25 min, ventana oculta). `vuelo` está dentro de él.
- **`1.8b` hoy 178,8 KiB** (meta 185, techo 200). La capa y su hoja viajan con la mesa, y la fila del ⚙ con `trozos.hoja`, los dos fuera del camino crítico. Lo que entra en él son las subidas de `salas.css` y `lobby.css`, que cambian factores. **Estimación: +0,3 a +0,6 KiB**, unos 179,4.

---

## G · El grafo

| Archivo | Para qué | Estado |
|---|---|---|
| `src/lib/letraGrande.js` *(nuevo)* | Leer y guardar la opción | libre |
| `src/components/CapaLetra.jsx` *(nuevo)* | La capa, el observador y su reloj | libre |
| `src/styles/letra.css` *(nuevo)* | Capa, y subidas de la mesa aprobadas | libre |
| `src/components/GameTable.jsx` | Montar la capa · abrir el globo con la opción · ancho de la cifra (`:2928`) | libre, **dispara el control de las IAS** |
| `src/components/Voz2Capa.jsx` · `src/styles/voz2.css` | Letra del globo con la opción | libre (`voz2.css` no se mete en el óvalo) |
| `src/components/HojaContenido.jsx` · `HojaConfiguracion.jsx` | La fila del ⚙ y su reserva | libre |
| `src/components/UtilitiesMenu.jsx` · `src/config/menuEntradas.js` | La fila del ⋮, si Victor la quiere (§P-2) | libre |
| `src/components/TransicionMano.jsx`, `src/styles/transicion.css`, `src/styles/pvp.css` | Pastilla y sorteo con la opción | libre |
| `src/hooks/useCelebracion.js` | Corregir su comentario | libre |
| `src/styles/salas.css`, `lobby.css`, `hojaMarco.css`, `tienda.css`, `rankings.css`, `tactilLobby.css` | Subidas de textos fijos y zonas táctiles | libre |
| `src/config/textos.es.js` | Rótulo de la opción; texto de la Llena si se aprueba | libre |
| `scripts/testClavesAlmacen.test.js` · `scripts/diagDSK.mjs` | La clave nueva · las tres celdas | arnés |
| `docs/AJILEI_Invariantes_v1.0.md`, `AJILEI_Configuracion_*`, informes | INV nuevo, retirar la excepción de INV-82 | documentos |

**Cuenta:** **21 archivos de `src/`**, 3 de ellos nuevos. **Protegidos: 0. Óvalo del teléfono: no se toca** (las capas pasan por encima, fuera de su árbol).

**Las dos vías de render:**

- **`OpponentPanel` (mesas 3–5):** no se edita. La capa lee su `.opp-status` (`OpponentPanel.jsx:166`).
- **`.ai-zone` (mesa de 2):** no se edita su JSX. La capa lee su `.opp-status` (`GameTable.jsx:2206`). **Ojo:** esa vía blanquea el rótulo en el pago con puntos (`:2209`), y la capa debe tratar ese vacío como «sin frase».

**No se tocan:** `gameEngine.js`, `aiPlayer.js`, `deck.js`, `pozos.js`, `seatLayouts.js`, `gameTable.css`, `opponentPanel.css`.

---

## H · El plan y la estimación

En minutos de Claude Code.

| Tanda | Qué | Min | Lo que no se comprime |
|---|---|---|---|
| **L · Lámina** | Selector `?lec=` sobre la app real: las frases con la capa a 18, 20 y 22 px, frente a la alternativa de agrandar solo el resultado · pisos 11 y 12 en botones y rótulos · sala de espera · texto de la Llena · pozo y comodín, por si Victor abre la excepción · carcasa de T3 | **70** | Victor, en la PC y en el S25 |
| **1 · Textos fijos** | Subidas aprobadas, zonas táctiles de T3, texto de la Llena · `lec.mapa` | **80** | — |
| **2 · La opción** | Fila del ⚙ (y ⋮), clave, capa, globo, pastilla, movimiento reducido · `lec.delta`, `lec.capa` | **130** | Prueba en el S25 |
| **3 · Herencias y cierre** | `vuelo humano` (35) · INV nuevo («la opción no mueve la mesa») · retirar la excepción de INV-82 · informe de cierre | **70** | Control de las IAS → push → `completo` (6 h 25 min, en ventana oculta) |
| **Total** | | **≈ 350 min (≈ 5 h 50 min)** | Más los ojos de Victor y las dos corridas largas |

**Orden corregido respecto a la ficha:** `vuelo humano` puede ir **primero** dentro de la tanda 3, o suelto: no depende de nada de LEC-1 y retira un rojo conocido de todas las corridas.

**Si no cabe en los 3 días, se corta en este orden:**

1. La fila del ⋮ (queda solo en el ⚙).
2. Las pantallas que la ola 0 casi no ve: tienda y rankings.
3. El aviso de ausencia y las frases del sorteo en grande (ya miden 14–15).
4. `vuelo humano` pasa a después de la ola 0: es un rojo conocido, con excepción escrita.

**Lo que no se corta:** los textos fijos de lobby, Retar, Salas y Armar mesa, y la opción en el teléfono con las candidatas 1 a 6.

---

## §P · Preguntas para Victor

| # | Pregunta | Recomendación |
|---|---|---|
| 1 | ¿La opción se guarda por aparato? | **Sí, por aparato**: no pide migración y es lo que hace el repo |
| 2 | ¿El interruptor va solo en el ⚙ o también en el ⋮ de la mesa? | **En los dos**: quien no lee bien lo necesita a media mano, y desde la mesa no se llega al ⚙ |
| 3 | ¿La frase grande puede tapar un instante el óvalo y las cartas de los rivales? | **Sí a las dos; las cartas propias nunca** (a 20 px no las tapa en ningún tamaño medido) |
| 4 | ¿El piso de 10 px de la mesa sube a 11 en el teléfono, moviendo 3–4 px la cabecera y la barra? | **No**: se queda en 10, y la opción cubre la lectura |
| 5 | ¿Se abre una excepción para el «Pozo» y el comodín de 8 px, dentro del óvalo del teléfono? | **No**: se quedan en 8; el pozo se lee por su cifra, de 14–16 px |
| 6 | ¿Se acorta la línea de la Llena a «Faltan 245.000 · Entrada 250.000»? | **Sí**: vuelve a 10,4 en T1 sin mover nada; a confirmar en la lámina |
