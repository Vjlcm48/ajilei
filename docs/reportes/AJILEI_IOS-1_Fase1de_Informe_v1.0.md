# AJILEI · IOS-1 · Fases 1d y 1e — El botón fijo de Retar, Salas y Armar mesa · Informe v1.0

**Campaña:** IOS-1 · Arreglos de iOS y de tamaños · **Sub-tandas:** 1d (lámina) y 1e (código)
**Ejecutor:** Claude Code · **Rector:** Claude (chat) · **Decisor:** Victor
**Base:** `main` en `eb37d84`. **Fecha:** 2026-10-16.
**Fichas:** `AJILEI_IOS-1_Fase1d_v1.0.md` y `AJILEI_IOS-1_Fase1e_v1.0.md`.
**Lámina:** `laminas/ios1d/` (fuera de commits; Victor la borra al cerrar la 1e).

---

## A · La lámina (1d)

La 1d diseñó, sin tocar el juego, el botón que propuso el hijo de Victor: **de tamaño constante, anclado abajo, siempre visible, con el resumen de la mesa encima y fuera del botón**. Hacía falta además que en una laptop (la HP de Victor: 1366×768 en ventana, unos 623 px útiles) no hubiera que desplazar.

La lámina montó la app real con cuatro variantes inyectadas desde fuera (H = hoy, A = una columna anclada, Ar = A con piso de ratón, B = dos columnas en horizontal ancho y bajo) y midió 404 casos: 16 tamaños, tres pantallas y los estados de Retar.

**Lo que decidió la lámina, en px que faltaban para verlo todo** (Retar con todo elegido; entre paréntesis, el botón cortado):

| Tamaño | H (hoy) | A | Ar | B |
|---|---|---|---|---|
| 1366×623 (laptop de Victor) | 144 (94) | 58 | 8 | cabe |
| 1280×585 | 162 (114) | 83 | 32 | cabe |
| 1133×641 (iPad, Safari) | 126 (76) | 40 | — | cabe |
| 1280×648 (tableta) | 119 (69) | 33 | — | cabe |
| 915×412 (acostado) | 119 (84) | 135 | — | 19 |
| Teléfonos y tabletas en vertical | cabe | cabe | — | cabe |

Solo B hacía caber la laptop sin bajar del piso táctil de 44. Ningún tocable nuevo bajaba de 44. Hallazgo de paso: hoy el aviso «Pronto» cae encima del botón dorado en 412×915 y 360×640.

**Decisiones de Victor (2026-10-16):** 1 = B en `(orientation: landscape) and (min-width: 900px) and (max-height: 830px)` y A fuera, sin Ar · 2 = «Sentarme a la mesa» · 3 = una caja con prioridad · 4 = el video dentro de la zona · 5 = la casa en la cabecera · 6 = el «Pronto» encima de la zona · 7 = el acostado en B · 8 = el vertical anclado · 9 = fuera el parche de la 1b · 10 = reabrir las dos columnas solo con esa condición.

---

## B · Qué se hizo (1e)

**Las tres pantallas** (Retar, Salas y Armar mesa) llevan `main.sal.es-anclada`:

- **La zona anclada.** `.sal-accion` es `sticky` al pie del cuerpo, y el cuerpo desplaza por dentro. Lleva tres cosas, de arriba abajo:
  - el bloque que mande la pantalla (en Retar, el del video o el de «Reintentar»);
  - **la caja** de nota o resumen;
  - **el botón dorado**.

  Si las filas no caben, pasan por debajo de la zona. La pantalla ya no desplaza nunca. La zona solo se oscurece cuando hay filas debajo (`data-desborda`).
- **El botón de Retar** dice siempre «Sentarme a la mesa» («Sentando…» mientras envía). Vuelve a ser `--cta-w` × `--cta-h`, en una línea.
- **La caja** (`CajaAccion` + `cajaDeAccion`): error > cobrando > cargando > «Elige…» > no alcanza > aviso propio de la pantalla > resumen. Nunca dos a la vez.
  - El resumen elige entre la forma larga y la corta **midiendo**: las pinta en una regla invisible y compara anchos. Si ninguna cabe, se corta con «…».
  - Con el bloque del video o el de «Reintentar», la caja calla y suelta su línea. Sin nada que decir, guarda la línea vacía (O1).
- **La casa** sube a la cabecera, a la derecha de la flecha. El **«Pronto»** vive dentro de la zona, apoyado encima.
- **El traje apretado de A** (horizontal hasta 800 de alto): chips de 44,4, botón de 48–54, «Unirme» con piso propio de 44 y el botón del video con piso de 44.
- **B** (la banda sellada): Retar, reto y jugadores a la izquierda, apuesta y entrada a la derecha; Armar mesa, jugadores y apuesta a la izquierda, el modo a la derecha; Salas, la lista a la izquierda (`1.25fr 1fr`) y el código a la derecha. La zona va al pie de la columna derecha.
- **El parche de la 1b y el traje del acostado** quedan acotados con `.sal:not(.es-anclada)`, en vez de borrados. **Motivo:** la sala de espera y la partida comparten `.sal` y están fuera de esta tanda; para ellas siguen como estaban. El comentario de las dos columnas (`salas.css` §15) dice ahora la decisión nueva y su fecha.

**Archivos:**

| Capa | Archivo | Qué |
|---|---|---|
| Núcleo | `src/components/zonaAccionCore.js` (nuevo) | `cajaDeAccion` y `elegirForma`, puras |
| | `src/components/zonaAccionCore.test.js` (nuevo) | 12 pruebas |
| | `src/components/CajaAccion.jsx` (nuevo) | la caja, con su regla de medida |
| | `src/hooks/useDesborde.js` (nuevo) | marca `data-desborda` en el cuerpo |
| Pantallas | `src/components/PantallaChips.jsx` | `es-anclada`, la zona, la casa y el «Pronto» |
| | `src/screens/RetarIAS.jsx` | rótulo fijo, la caja, el video en `pie` |
| | `src/screens/ArmarMesa.jsx` | la caja con el resumen |
| | `src/screens/SalaOpciones.jsx` | el mismo marcado a mano |
| | `src/styles/salas.css` | §16 nueva; §13 acotada; §15 (el CTA fijo y los comentarios) |
| | `src/config/textos.es.js` | +5 claves, −3 (`ia.retar.cta`, `.una`, `.vacio`) |
| Arnés | `scripts/ios/tam.mjs` | recableado y con la matriz de la 1e |
| | `scripts/diagDSK.mjs` | modo `retar` (retar.3 a retar.6) |
| Doctrina | `docs/AJILEI_Invariantes_v1.0.md` | INV-55 reescrita; fila de `tam` |
| | este informe | |

**Protegidos:** ninguno tocado (se leyó `AJILEI_Protegidos_v1.0.md` al empezar).

---

## C · Medidas del arnés (`diagDSK tam`, Chromium 151)

Px de filas bajo el botón («cabe» = 0). El botón está **entero a la vista y se puede tocar en las 154 celdas**. La página no desplaza en ninguna (ni a lo alto ni a lo ancho).

| Tamaño | Col. | Botón | Retar | Sin elegir | Video | Error | Lectura | Salas | Armar | Menor movido (táctil) |
|---|---|---|---|---|---|---|---|---|---|---|
| **1366×623** | 2 | 384×54 | cabe | cabe | cabe | cabe | cabe | cabe | cabe | — (ratón) |
| 1280×585 | 2 | 374,4×52,6 | cabe | cabe | cabe | cabe | cabe | cabe | cabe | — (ratón) |
| 1536×729 | 2 | 384×54 | cabe | cabe | cabe | cabe | cabe | cabe | cabe | — (ratón) |
| 1920×1080 | 1 | 384×66 | cabe | cabe | cabe | cabe | cabe | cabe | cabe | — (ratón) |
| 1133×641 | 2 | 384×54 | cabe | cabe | cabe | cabe | cabe | cabe | cabe | 44,4 |
| 1133×720 | 2 | 384×54 | cabe | cabe | cabe | cabe | cabe | cabe | cabe | 44,4 |
| 1180×713 | 2 | 384×54 | cabe | cabe | cabe | cabe | cabe | cabe | cabe | 44,4 |
| 744×1026 | 1 | 384×66 | cabe | cabe | cabe | cabe | cabe | cabe | cabe | 57 |
| 1280×648 | 2 | 384×54 | cabe | cabe | cabe | cabe | cabe | cabe | cabe | 44,4 |
| 800×1128 | 1 | 384×66 | cabe | cabe | cabe | cabe | cabe | cabe | cabe | 57 |
| 412×915 | 1 | 263,7×45,3 | cabe | cabe | cabe | cabe | cabe | cabe | cabe | 44 |
| 360×704 | 1 | 230,4×44 | cabe | cabe | cabe | cabe | cabe | cabe | cabe | 44 |
| 390×844 | 1 | 249,6×44 | cabe | cabe | cabe | cabe | cabe | cabe | cabe | 44 |
| 360×640 | 1 | 230,4×44 | cabe | cabe | cabe | cabe | cabe | cabe | cabe | 44 |
| 440×956 | 1 | 281,6×48,4 | cabe | cabe | cabe | cabe | cabe | cabe | cabe | 44 |
| **915×412** (acostado) | 2 | 263,7×48 | 10 | 10 | 38 | 28 | 5 | cabe | cabe | 44 |
| *Fronteras y extra (informan, fuera del criterio de la ficha):* | | | | | | | | | | |
| 899×600 | 1 | 384×54 | 83 | 83 | 97 | 83 | 49 | 61 | cabe | — |
| 900×600 | 2 | 384×54 | cabe | cabe | 9 | 21 | cabe | cabe | cabe | — |
| 1366×830 | 2 | 384×66 | cabe | cabe | cabe | cabe | cabe | cabe | cabe | — |
| 1366×831 | 1 | 384×66 | 7 | 7 | 24 | 7 | cabe | cabe | cabe | — |
| 800×601 | 1 | 384×54 | 82 | 82 | 96 | 82 | 48 | 60 | cabe | — |
| 800×611 | 1 | 384×54 | 72 | 72 | 86 | 72 | 38 | 50 | cabe | — |

- **Frontera de B (tam.9):** dos columnas a 900×600 y a 1366×830; una a 899×600 y a 1366×831. Correcto.
- **Casa (tam.11):** en la cabecera, sin rozar el título ni el botón en las 154 celdas, también a 800×601 y 800×611.
- **«Pronto» (tam.12):** encima de la zona y sin tapar el botón a 1366×623 (464–508 sobre la zona en 516), 412×915 (787–818 sobre 823) y 360×640 (523–550 sobre 555). **El hallazgo de la 1d queda cerrado.**
- **Barrido (tam.1 a tam.6):** 320 puntos de 521 a 831 de alto, a 1366 (rueda) y 1280 (dedo). El botón se toca sin desplazar en todos. En 4 puntos las filas no cabían y el gesto real las recorrió hasta el final sin mover el botón.

**WebKit 26.5 (Playwright, sonda aparte):** 1180×713, 744×1026, 430×932 y 932×430, en los siete estados (28 celdas).
- Botón entero en todas.
- 0 px de filas, salvo el acostado: 2 en Retar, 31 con video, 20 con error.
- Ningún tocable movido por debajo de 44.
- La casa, bien.

---

## D · Cifras que cambian respecto a la lámina, y por qué

- **El acostado mejora:** Retar 19 → 10, error 37 → 28, Armar mesa 2 → 0.
  - **Causa:** en la lámina, el bloque del video era una fila propia de la rejilla B (5 filas, una de ellas vacía sin video), y una fila vacía también cobra su hueco de 2,4u (9,9 px a 915×412).
  - En el código el bloque va dentro de la zona: 4 filas, un hueco menos.
- **Con video, el acostado se queda igual (38):** el hueco que se gana lo gasta el `gap` interno de la zona.
- **«Unirme» de Salas:** su piso de 44 se pone en la propia regla, no subiendo el botón dorado. Así se hizo ya en la lámina final.
- **El botón del video** pasa de 40 a 44 en los teléfonos (`max(44px, --chip-h)`): es un tocable movido. Le cuesta 4 px a la zona en ese estado, y todo sigue cabiendo.
- El resto de la tabla coincide con la variante B de la lámina en los 16 tamaños («cabe» donde ella decía «cabe»).

---

## E · Tocables de menos de 44 que vienen de PAN-1 (sin tocar)

En aparatos táctiles, iguales que antes de la 1e:

| Tocable | Medida |
|---|---|
| El «+» de la píldora | 18–31 |
| La flecha, el ⚙ y la casa | 31–38 |
| El avatar | 38,5–41,7 |
| Chips en vertical | 40–41,8 |
| El campo de código de Salas | 21–34 |
| «Unirme» en vertical | 35 |
| El ± del contador de «Otra…» | 40–42 (por CSS: el arnés no abre el contador) |

**La casa es tocable movido** (de la esquina a la cabecera), pero conserva su tamaño de PAN-1 (8,7u: 31–36 px en teléfonos), como pide la ficha en «No entra». Si Victor quiere que la mudanza la suba a 44, son dos líneas; la fila de la cabecera crecería unos 8 px en el teléfono.

---

## F · Hallazgos y propuestas

1. **La franja de 831 a ~855 de alto en horizontal ancho** (p. ej., 1366×831): ya no hay dos columnas y el traje apretado tampoco aplica (solo llega a 800). En Retar quedan 7 px de filas bajo el botón (24 con video).
   - El botón se ve y se toca; las filas se alcanzan desplazando el cuerpo.
   - Si se quiere 0, hay dos caminos, cualquiera de los dos de una línea:
     - subir el techo de B a 860;
     - subir el del traje a 860.
   - **Decisión de Victor** (la banda está sellada).
2. **Ventanas de laptop estrechas y bajas** (menos de 900 de ancho y unos 600 de alto, p. ej. 800×601): son A, con 72–97 px de filas bajo el botón. Es la variante A tal como se midió en la lámina; el botón se ve siempre.
3. **La sala de espera y la partida** siguen con el parche de la 1b y el traje del acostado, que solo se acotaron (§B). Si se quiere el mismo anclaje, sería otra tanda.
4. **Propuesta:** que `SalaOpciones` use `PantallaChips`. Hoy repite su marcado a mano, y esta tanda tuvo que hacer el mismo cambio dos veces (cabecera, zona, «Pronto», desborde). No se ha hecho, como pide la ficha.

---

## G · Comprobaciones

| Comprobación | Resultado |
|---|---|
| vitest | 1.617 (1.605 + 12 nuevas), todas verdes |
| lint | 21 avisos, igual que la base |
| `npm run build` | correcto |
| `diagDSK tam` | **VERDE**, 15/15: tam.1 a tam.12, matriz, celdas medidas y consola; 320 puntos, 154 celdas |
| `diagDSK retar` | verde, 6/6. retar.3 lee «Sentarme a la mesa», una línea y la misma caja apagado y encendido (230,4×44 a 360×640; 384×54 a 1024×768), y el resumen «Pro · 5 jugadores · 200 por mano · entras con 4.000» |
| `diagSAL` | verde, 102/102 |
| `diagDSK lob` y `diagDSK constancia` | verdes (11/11 y 7/7 más consola): la barra con 15 «W» y la nota de la válvula, que ahora sale en la caja de encima |
| WebKit 26.5 | §C |

---

## H · Lo que Victor valida con los aparatos

1. **Laptop HP** (1366×768, ventana normal): en Retar, Salas y Armar mesa, dos columnas, todo a la vista sin rueda y el botón al pie a la derecha.
2. **iPad en Safari y en la app instalada**, en horizontal: igual que la laptop. En vertical, una columna con el botón al pie.
3. **iPhone y S25 en vertical:** el botón al pie, con la línea del resumen encima; la casa arriba a la derecha.
4. **El teléfono acostado:** dos columnas. Si algo no cabe, las filas se arrastran por debajo del botón, que no se mueve.
5. **Retar sin saldo** (el bloque del video): el bloque sale pegado encima del botón, sin bajar.
6. **El «Pronto»** (tocar el avatar o el ⚙): sale encima de la zona, sin tapar el botón.
7. **La raya de inicio del iPhone:** hoy no hay `viewport-fit=cover` (R-1), así que el área segura de abajo vale 0. El día que entre, la zona ya la respeta (el relleno de `.sal` lleva `env(safe-area-inset-bottom)`).

---

## I · Validación física (2026-10-17)

Victor probó la 1e por el túnel con los aparatos reales. Él y el rector la aprueban con una limitación.

**Todo bien en:**

- el iPad;
- la laptop HP (1366×768 en ventana);
- el S25 en vertical;
- el iPhone en vertical.

**Limitación conocida, en observación: el iPhone 17 Pro Max acostado, en Safari.**

- **Qué se ve:** no se activan las dos columnas. Sale una columna con muy poca altura útil (unos 330 px, con las barras). El botón sale entero y funciona.
- **Causa probable, sin confirmar:** las franjas laterales que Safari reserva junto a la isla de la cámara dejan el ancho útil por debajo de 900, y la condición de la variante B (`min-width: 900px`) no se cumple.
- **Decisión de Victor:** no se arregla en la 1e. Las pantallas previas a la mesa se usan en vertical.

**Pasan a la 1f:**

1. La línea de 860 px: la franja de 831 a unos 855 de alto en horizontal ancho (§F.1).
2. El diagnóstico de la causa del iPhone 17 Pro Max acostado: medir el ancho útil real en Safari y si las franjas de la isla lo bajan de 900.

**Desviación aceptada.** El parche de la 1b (desplazar la pantalla de 521 a 830 de alto) y el traje del acostado **se acotaron con `.sal:not(.es-anclada)` en vez de borrarse**, como pedía la decisión 9.

- **Motivo:** la sala de espera y la partida comparten `.sal`.
- **Efecto:** en Retar, Salas y Armar mesa ya no aplican; las otras dos pantallas siguen como estaban (§B, §F.3).

**La 1c**, de paso, quedó validada en el iPhone en ajilei.io.
