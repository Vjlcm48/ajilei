# AJILEI · VIS-1 · Lámina · Informe v1.0 · STOP-L

**Para:** Victor y el rector · **De:** Claude Code · **Fecha:** 2026-11-03
**Ficha:** `AJILEI_VIS-1_v1.0.md` §2, con lo decidido en el STOP-0 · **Base:** `main` en `3e6f606`
**Escrituras:** `laminas/vis1/` (no va en ningún commit), este informe y el §11 de `AJILEI_VIS-1_Fase0_Sonda_Informe_v1.0.md`. Nada en `src/`. Sin commits.

---

## Qué hace falta decidir

| # | Decisión | Mi recomendación |
|---|---|---|
| **1** | ¿Se sella la lámina? La mira Victor, en la PC y en el S25 | Lo que hay que mirar está en §2 |
| **2** | ¿`.opp-status` a 0,75, como se decidió, o a 0,76? Con 0,75, la fórmula de la tinta da **4,47** en el verde (§3.3) | **0,76.** A la vista no cambia nada, y la puerta de `luz` queda verde con el mismo método que `cfg.contraste` |
| **3** | El ojito del saldo, las sillas de las salas y los iconos apagados de la Tienda usan el mismo token, así que también suben (§3.2). ¿Se aceptan o se dejan a 0,55? | **Se aceptan:** son del mismo rango, y dejarlos fuera pide excepciones sueltas |
| **4** | La derrota en el apaisado bajo recibe `min-height: 44px`, que D-P1 no nombraba (§3.1) | **Sí:** hoy mide 28 y es de lo que trata D-P1b |

**P4 no está en la lámina,** por decisión de Victor. P5 no la lleva, porque la ficha dice que no la necesita.

---

## 1. Cómo verla

Vite queda levantado en el **5174**. Si se cierra: `npx vite --port 5174 --strictPort --host 0.0.0.0`, desde la raíz.

- **PC:** <http://localhost:5174/laminas/vis1/lamina.html>
- **S25, en la misma red:** `http://192.168.12.171:5174/laminas/vis1/lamina.html`
- **La app de verdad con un botón Hoy / VIS-1:** la pestaña **En vivo** de la lámina. Es la que sirve para mirar en el S25 con su luz y su tamaño. No pide pantalla completa, porque taparía el botón, así que el alto útil es algo menor que jugando.

Cada pestaña enseña hoy y VIS-1 lado a lado, en los cinco tamaños. Con **Alternar**, la foto cambia de versión al tocarla, que es como mejor se ve una diferencia pequeña.

**Lo que iría a `src/`** está entero en `laminas/vis1/propuesta.css`, con el archivo de destino de cada bloque.

---

## 2. Qué mirar

1. **P1, 360×640, victoria.** «Ver tu nuevo ranking» queda a **1,39 px** del borde de abajo, y la pantalla pasa de desplazar 3 px a desplazar 33. Es el caso más justo de la tanda.
2. **P1, 1366×768.** Los botones se ven igual que hoy: solo crece su zona de toque. Es lo decidido para que «Ranking» no salga de la vista.
3. **P2, Rankings · vino y Salas.** ¿El texto sigue leyéndose como secundario? Queda a 0,07 de `--text-secondary`.
4. **P3.** Normal, atenuado y «Se retiró» salen juntos en la foto, en los 11 fieltros.
5. **Eliminar cuenta.** `--lose-red` es más claro que `--loss-red`. ¿Sigue diciendo «peligro»?

---

## 3. Lo medido

### 3.1 P1 · Los botones

Medido con escala real, y la zona por barrido con `elementFromPoint`. Son 16 pantallas: victoria y derrota en ocho tamaños.

| Ventana | Escala | Victoria: caja «Salir» / «Ranking» | Zona, hoy → VIS-1 | Derrota: caja | Zona, hoy → VIS-1 |
|---|---|---|---|---|---|
| 360×640 | — | 28 / 30 → 44 / 44 | 29 / 31 → 45 / 45 | 28 → 44 | 29 → 45 |
| 412×915 | — | 28 / 30 → 44 / 44 | 29 / 31 → 45 / 45 | 28 → 44 | 29 → 45 |
| 915×412 | — | 44 / 44, sin cambio | 45 / 45 | 28 → 44 | 29 → 45 |
| 1366×768 | ×1 | 33 / 35, sin cambio | 34 / 36 → 45 / 45 | 33, sin cambio | 34 → 45 |
| 1920×1080 | ×1,3 | 43,38 / 45,38, sin cambio | 44 / 46 → 45 / 46 | 43,38, sin cambio | 44 → 45 |
| 768×1024 | ×1,261 | 34,63 / 36,63 → 44 / 44 | 36 / 38 → 45 / 45 | 34,63 → 44 | 35 → 45 |
| 1024×620 | ×0,87 | 27,66 / 29,66, sin cambio | 28 / fuera de vista → 42 / fuera de vista | 27,66, sin cambio | 28 → 45 |
| 1280×720 | ×1 | 33 / 35, sin cambio | 34 / fuera de vista → 45 / fuera de vista | 33, sin cambio | 34 → 45 |

- **La división entre la escala funciona:** 44 reales a ×1,261 en vertical.
- **Los 42 de 1024×620 no son un defecto de la regla:** la zona llega al borde de la vista y este la corta. Al desplazar, mide lo mismo que las demás. `cfg.victoria` tendrá que tenerlo en cuenta.
- **«Ranking» fuera de vista en 1024×620 y 1280×720** ya pasa hoy (§8.3 del informe de la sonda). Queda para MES-PvP.
- **La tarjeta sube** 15 px en 412×915 y 8,38 en 768×1024. En la derrota, la frase sube 8 px en los teléfonos y 4,69 en 768×1024. En horizontal alto no se mueve nada.
- **Añadido respecto a D-P1:** en el apaisado bajo, la derrota mide 28, porque la regla de 44 de CEL-2e solo cubre `.cel-acciones`. Le puse la misma regla (decisión 4).

**La derrota no tiene molde todavía.** Su selector entra con la tanda (D-P1b). Para la lámina reescribí `decideCelebracion` al vuelo en la prueba, sin tocar `src/`, y puse a mano su frase real, «IA 1 gana la mesa. Te quedaste sin Heptacoins.».

### 3.2 P2 · El texto atenuado

**329 lecturas** activas bajo la tinta, en 11 pantallas y 5 tamaños.

| | Hoy | VIS-1 |
|---|---|---|
| Bajo 4,5 | **61** | **0** |
| Peor caso | 3,85 (Rankings vino) | **4,81** |

| Pantalla | Peor hoy → VIS-1 | Dónde |
|---|---|---|
| Rankings · vino | 3,85 → 4,81 | `.rnk-lugar-t`, 360×640 |
| Salas | 3,97 → 4,89 | rótulo `h2`, 360×640 |
| Rankings · verde | 4,08 → 5,04 | `.rnk-lugar-t`, 412×915 |
| Tienda · monedas | 4,11 → 5,10 | subtítulo de `.vid-fila`, 1366×768 |
| Armar mesa | 4,18 → 5,20 | rótulo `h2`, 1920×1080 |
| Retar | 4,37 → 5,46 | rótulo `h2`, 1920×1080 |
| Perfil | 4,37 → 5,47 | `.pf-tenue`, 1920×1080 |
| Sala de espera | 4,44 → 5,57 | «Libre», 1920×1080 |
| Tienda · tapetes | 4,86 → 6,20 | chip, 915×412 |
| Hoja ⚙ | 5,31 → 6,92 | ya pasaba |
| Lobby | sin textos con este token | — |

Quedan fuera de esa cuenta 10 lecturas de Retar apagadas a propósito, que pasan de unos 2 a unos 2,3.

**Lo que cambia y no es texto, comparando las dos fotos:**

| Dónde | Qué | Cuánto cambia (de 255) |
|---|---|---|
| **Lobby** y Tienda | El ojito del saldo (`tactilLobby.css:53`). En la pantalla del lobby es lo **único** que cambia | 23 |
| **Hoja ⚙** | El mismo ojito, bajo el velo. La fila de «Eliminar cuenta» también cambia, pero es el D-Extra | 10 |
| **Salas** | Los puntos de las sillas (`salas.css:511`) | 24 |
| **Sala de espera** | El borde punteado de las sillas libres (`salas.css:973`) | 11 |
| **Tienda** | Iconos de las filas apagadas (`video.css:146` y `:151`) | 23 |

Quedan dos más que no son de este grupo. El reloj de la Sala de espera corre entre foto y foto (también sale en el control hoy contra hoy). Y en Rankings · vino cambian 12 a 15 px con Δ 20 al lado de «tú»: por el sitio parece el punto de «· tú», aunque no lo confirmé. **Fuera de `.lobby` y `.sal`, el token no cambia.** Las sillas y los iconos son la decisión 3.

### 3.3 P3 · El texto del rival

**1650 lecturas**, en las mesas de 2 a 5, los 5 tamaños, los 3 estados y los 11 fieltros. Peor caso con α 0,75, mesas 3 a 5:

| Tapete | Tono | Normal | Atenuado | Retirado (exento) |
|---|---|---|---|---|
| verde | — | 5,06 → 6,31 | 3,70 → **4,47** | 2,48 → 2,86 |
| tricolor | — | 5,80 → 7,37 | 4,22 → 5,20 | 2,73 → 3,21 |
| grafito | claro | 5,53 → 6,96 | 4,06 → 4,96 | 2,65 → 3,09 |
| grafito | medio | 5,97 → 7,61 | 4,30 → 5,31 | 2,77 → 3,26 |
| grafito | oscuro | 6,23 → 8,00 | 4,50 → 5,61 | 2,84 → 3,37 |
| azul | claro | 5,38 → 6,77 | 3,93 → 4,79 | 2,58 → 3,00 |
| azul | medio | 5,78 → 7,33 | 4,17 → 5,13 | 2,71 → 3,17 |
| azul | oscuro | 6,12 → 7,83 | 4,39 → 5,46 | 2,81 → 3,31 |
| vinotinto | claro | 5,29 → 6,70 | 3,82 → 4,69 | 2,48 → 2,89 |
| vinotinto | medio | 5,75 → 7,35 | 4,12 → 5,10 | 2,64 → 3,10 |
| vinotinto | oscuro | 6,10 → 7,87 | 4,34 → 5,42 | 2,74 → 3,25 |

**El 4,47 corrige lo que dije en el STOP-0.** El informe de la sonda daba 4,50 con 0,75, y no es exacto.

| α | Fórmula bajo la tinta: peor | Lecturas bajo 4,5 (de 539) | Píxeles medidos a 3×: peor |
|---|---|---|---|
| 0,64 (hoy) | 3,70 | 439 | 3,78 |
| **0,75** | **4,47** | **3** | **4,67** |
| 0,76 | 4,55 | 0 | 4,73 |
| 0,77 | 4,62 | 0 | 4,78 |

- **Las tres lecturas bajas** son del verde: 915×412 en mesa 4, y 1366×768 y 1920×1080 en mesa 2.
- **El texto cumple con 0,75** si se miden los píxeles reales. La fórmula es más severa porque compone sobre el fondo más claro bajo cada letra. Esa fila de 3× midió 5 combinaciones de tamaño y tapete, no las 11 × 5.
- **Pero la puerta nueva usará la fórmula,** la misma de `cfg.contraste`. Con 0,75 saldría roja, o habría que ponerle un piso propio. Con 0,76 no hace falta nada: por eso la decisión 2.

**Δ = 0:**
- **Mesa:** fuera de `.opp-status`, **59 de 60 fotos** no cambian ni un píxel. La otra (915×412, mesa 5, grafito claro) cambia unos 68.000 px en una sola foto. Repetí la secuencia 42 veces con varios fieltros y salió 1 vez, con vinotinto oscuro; las otras 5 de ese fieltro dieron 0. Solo lo he visto en 915×412. **No sé qué es.** Como no se repite con la misma hoja y el mismo estado, no lo atribuyo a la propuesta. Si reaparece, la tanda lo verá en las varas, ya sin hoja inyectada.
- **Vitrina:** el rótulo sigue a 0,55. En los teléfonos, **0 píxeles** dentro de su caja. En 1366×768 y 1920×1080 se mueven píxeles en 1 o 2 niveles de 255, y una hoja de estilos vacía provoca lo mismo (hasta 3): es el redibujado de la imagen escalada. Sin devolverle el 0,55, el rótulo cambiaría de 20 a 22 niveles. **Esto compara fotos; no sustituye a `tie.puerta`,** que corre en la tanda.

**Mesa 2 apaisada:** sigue dando 2,86 / 2,61 / 2,18 por el solape con los huecos de carta (§8.2 de la sonda). Queda para MES-PvP.

**Los tres estados de la foto están puestos a mano,** con las clases reales, porque ninguna IA se retira a voluntad.

### 3.4 «Eliminar cuenta»

**2,66 → 5,02** en los cinco tamaños, sobre `#0c1d13`. Es `rgb(239, 83, 80)`, el mismo rojo del error en esa ventana.

---

## 4. Lo que no se comprobó

- **El aspecto en un S25 real.** Las fotos son de Chromium. La pestaña En vivo la probé en Edge con táctil emulado: monta, y el botón cambia de 44 a 28. Falta verla en el aparato.
- **Los `:hover`** de cada fila, como en la sonda.
- **iOS (INV-41), pendiente de validar:** `calc(44px / var(--escala, 1))` bajo `zoom` en el iPad. P5, que no va en la lámina, sigue con su pendiente de Safari (§10 de la sonda). Nada de VIS-1 se ha visto en WebKit todavía.

## 5. Dos avisos del instrumento

- **Vite recarga las páginas abiertas al escribir `datos.js`,** si la lámina ya lo pidió. Eso devolvía al lobby la primera mesa de la pasada siguiente, y me hizo descartar y repetir P3 varias veces. Ahora `capturar.mjs` espera 4 s al empezar. **Las cifras de este informe son de las pasadas ya limpias.**
- **Las capturas de teléfono van a densidad 2** y las de escritorio a densidad 1. La sonda iba a densidad 1 en todo. Las cifras de hoy coinciden con las de la sonda donde se comparan (3,85, 3,97, 5,06, 3,70, 2,48), así que la medida no se movió.

## 6. Tras el sello

`laminas/vis1/` ocupa **134 MB** (312 capturas) y está dentro de OneDrive; Victor la borra al final, como dice la ficha. `src/`, `scripts/` y los normativos están intactos: todo eso es de la tanda. Lo de MOT-1 no se tocó.

**Para aquí** hasta que Victor la selle.
