# AJILEI · RNK-1 (Rankings) · Fase 1-L · Lámina · Informe · v1.0

- **Ficha:** `AJILEI_RNK-1_Fase1L_Lamina_v1.0.md` (rector) · **Normativo:** `docs/AJILEI_Rankings_v1.0.md` · **Fase 0:** `docs/reportes/AJILEI_RNK-1_Fase0_Informe_v1.0.md`
- **Fecha:** 2026-10-24 · **Ejecutor:** Claude Code · **Tiempo:** ~75 min de los 120
- **Escrito para:** el rector y Victor
- **Escrituras:** solo `laminas/rnk1/` (sin seguimiento de git) y este informe. Nada en `src/`, `scripts/`, `supabase/` ni `public/`.

---

## Resumen

La lámina dibuja la pantalla «Rankings» con sus dos pestañas, «Tu posición», la tarjeta de SumaMente y el mini-perfil, con datos sembrados, en los seis tamaños de la ficha. **Por defecto** salen las recomendaciones del rector: **V1 A · V2 B · V3 B**. Cada marco lleva su regla y lee sus propias medidas.

**Cómo abrirla:**

```
python -m http.server 8765 -d laminas\rnk1
```

y luego <http://localhost:8765/> (el índice). Hay que abrirla por http y no como archivo, porque la regla lee las medidas de dentro de cada marco.

Lo que más importa para decidir:

| | |
|---|---|
| **Filas a la vista (V3 B, 56 px)** | 360×640 → 6 · 412×915 → 10 · 915×412 → 4 · 744×1100 → 11 · 1366×623 → 7 · 1920×1080 → 11. Con V3 A (44 px), una a cuatro filas más (§4). |
| **Horizontal bajo** | En 915×412 y 1366×623 la pantalla pasa a **dos columnas**: pestañas y «Tu posición» a la izquierda, la lista a la derecha (molde de Salas B). Con una sola columna, en 915×412 quedaban unas dos filas. |
| **Mini-perfil** | Cabe sin desplazar en los seis tamaños. En el celular acostado se parte en dos columnas (468 → 278 px de alto). |
| **Dudas para Victor** | Fondo verde o vinotinto (§3-1), la carcasa de `PantallaChips` sin botón dorado (§3-2), el oro de la medalla 1 (§3-7) y si «Tu posición» lleva franja también dentro del top (§3-9). |

---

## §1 · Qué se dibujó

### 1.1 · Los archivos (`laminas/rnk1/`)

| Archivo | Qué es |
|---|---|
| `index.html` | El índice: tabla de 8 vistas × 6 tamaños (más «mosaico», los seis a la vez), los enlaces de cada variante y las comparaciones de fondo, corona, la caja de V2 A con guías y la victoria sin tarjeta. |
| `lamina.html` | El visor. Tiene una barra para elegir vista, tamaño, zoom, V1/V2/V3, fondo, corona, guías y mini-perfil. Cada marco lleva **una regla en px** (marca cada 10, número cada 100) y debajo **sus medidas**: `--u`, disposición, alto de fila, filas enteras a la vista, alto de la lista y de las pestañas, banda, SumaMente, mini-perfil (¿cabe?) y si la página desborda. Con `?tam=todos` enseña los seis tamaños juntos. |
| `pantalla.html` | La pantalla en sí: CSS y datos dentro, sin red. Va en un `iframe` del tamaño exacto del marco, para que `vmin`, `dvh` y los `@media` se comporten como en el aparato. Parámetros: `vista`, `v1`, `v2`, `v3`, `fondo`, `corona`, `lista`, `guias`, `perfil`. |
| `heptacoin.svg` | Copia de `src/assets/heptacoin.svg` (la HC-1 «Grabada»). |
| `_medir.mjs` | Mide y fotografía los 12 casos × 6 tamaños con el Chromium del arnés (`playwright-core`, `channel: 'chromium'`). Se corre así: `node laminas/rnk1/_medir.mjs <carpeta>`. Las capturas quedaron fuera del repo (§7). |
| `_err.mjs` | Script de depuración que saca los puestos de los sembrados. No pude borrarlo (`rm` denegado); se puede tirar. |

### 1.2 · Vistas (`?vista=`)

| Vista | Qué muestra |
|---|---|
| `maestros` | Pestaña Maestros, top 100; yo = `test1976`, **puesto 7, empatado con Yulimar77**. |
| `maestros-fuera` | Yo = `LuisMiguel_09` (inventado), 1 punto → «**Puesto 117 · dentro del 90 %**». |
| `maestros-vacio` | Yo = `gabriela` (0 puntos): la lista sigue; «Tu posición» dice «Gana tu primera mano para entrar». |
| `fortunas` | Pestaña Fortunas; yo = `test1976`, **puesto 2** (13.050), detrás del comprador ElCatire88 (48.700). |
| `sumamente` | `maestros` con la tarjeta. Con V2 B la lista se abre ya desplazada al final, para que se vea. |
| `perfil-ajeno` | Mini-perfil de Bachaquero_VE (n.º 1) sobre `maestros`. |
| `perfil-propio` | Mini-perfil de `test1976`, con el correo (`test1976@ejemplo.com`, inventado) y «Editar · Pronto» apagado. |
| `victoria` | Victoria de mesa **imitada** (fieltro, AJILEI, frase real de `frasesVictoria.js:17`, tarjeta de resumen, «Salir de la mesa», «Ver tu nuevo ranking») con el mini-perfil propio encima. Con `&perfil=no` se ve la victoria sola. |

### 1.3 · Variantes

| | Opciones | Por defecto |
|---|---|---|
| V1 «Tu posición» | A banda al pie · B fila arriba (entre pestañas y lista) | **A** |
| V2 SumaMente | A caja arriba, siempre reservada · B al final del top 100 · C primera fila, sin caja | **B** |
| V3 Fila | A 44 px · B 56 px con el podio | **B** |
| Extra: fondo | verde (el del producto) · vinotinto (lo que pide la ficha §3.1) | verde |
| Extra: corona | hueco (caja reservada, invisible) · muestra (dos jugadores con corona) | hueco |

### 1.4 · Los datos sembrados

Son deterministas (semilla 1976): **130 jugadores con ≥ 1 punto y 140 con billetera**. Los diez de más tienen 0 puntos y solo salen en Fortunas.

- **Por qué 140 y no 130:** con 130 en Maestros, el puesto 117 da exactamente «dentro del 90 %», que es lo que pide la ficha. `gabriela` (0 puntos) no puede contar en Maestros.
- Cifras con separador de miles, por la misma regla que `montoTexto` (`src/config/tapetes.js:105`). Un nombre de 15 caracteres (`MaracuchaBrava_`) sirve para ver el «…».

| Cuenta real | Maestros (puesto · fila) | Fortunas (puesto · fila) |
|---|---|---|
| test1976 · 11 / 13.050 | 7 · 7 (empate con Yulimar77) | 2 · 2 |
| 2Alejandro · 4 / 3.650 | 93 · 93 (tres con 4 puntos: 93–95) | 93 |
| ticotest2022 · 3 / 10.200 | 96 · **fila 104, fuera del top** | 6 |
| Alejandro1 · 2 / 2.300 | 105 | 126 |
| nena82 · 1 / 2.850 | 117 · fila 126 | 106 |
| gabriela · 0 / 2.500 | — (no entra) | 114 (empate con los del bono intacto) |

**El corte del top 100 con empate:** en Maestros, el puesto 96 lo comparten nueve jugadores con 3 puntos (filas 96–104). Se ven cinco y quedan fuera cuatro, entre ellos `ticotest2022`, que vería su puesto 96 en «Tu posición». En Fortunas el corte cae limpio (100 = 3.150, 101 = 3.100).

---

## §2 · De dónde salen los patrones (leídos del producto)

| Pieza | Fuente |
|---|---|
| Tokens (oro, verdes, superficies, textos, filigrana) | `src/styles/theme.css:4-118` |
| Carcasa `.sal` (`--u`, `--ico`, `--pad`, `--col`, alto `100dvh`, rejilla `auto auto 1fr`) | `src/styles/salas.css:40-133` |
| Fondo (rampa verde + filigrana) | `salas.css:157-165` y `--filigrana` de `theme.css:107-118` |
| Barra superior (perfil, píldora con moneda y «+», ⚙) | marcado `src/components/BarraSuperior.jsx:127-206`; CSS `salas.css:186-300` |
| Cabecera con flecha y casa a la derecha (zona anclada) | `src/components/PantallaChips.jsx:120-140`; `salas.css:303-347` y `:1660-1669` |
| Pestañas | `src/components/FilaChips.jsx:46-65` (`role="group"`, `aria-pressed`); `salas.css:573-589` |
| Círculo con la inicial (y el sitio de la imagen de AVA-1) | `inicialDe` en `src/screens/salaEsperaCore.js:37-40`; `salas.css:937-956` |
| Traje apretado en horizontal ≤ 800 | `salas.css:1682-1700` |
| Dos columnas en horizontal ≥ 900 × ≤ 830 | `salas.css:1713` y siguientes |
| Iconos (usuario, +, ⚙, volver, casa, trofeo) | `src/components/IconosLobby.jsx:38-102`, `src/components/IconosSalas.jsx:46-62` |
| Victoria imitada (tarjeta, cifras, botones) | `src/styles/celebracion.css:33-235`; `src/components/Celebracion.jsx:245-426` |
| Moneda | `src/assets/heptacoin.svg` (HC-1 «Grabada») |

---

## §3 · Dudas y decisiones al dibujar

1. **El fondo: la ficha y el producto no coinciden.**
   - La ficha (§3.1) pide «vinotinto `#7c1d30` de base» y cita el «Sistema de Diseño v1.3».
   - En el repo, ese documento es `docs/AJILEI_Sistema_Diseno_v1.2.md`, aunque por dentro dice «Versión 1.3» (`:3`). Su changelog dice: «la rampa vinotinto del icono **no es token y ninguna pantalla la consume**» (`:5`).
   - El lobby, Retar y Salas usan la rampa **verde** (`salas.css:157-165`). `#7c1d30` solo aparece en el isotipo y en la moneda.
   - **Dibujé las dos.** Por defecto va la verde (`?fondo=verde`), para que Rankings no tenga costura con el lobby. La vinotinto sale con `?fondo=vino`. Decide Victor.
2. **`PantallaChips` exige el botón dorado.**
   - La carcasa siempre pinta `.sal-cta` (`PantallaChips.jsx:150-158`), y Rankings no tiene acción principal.
   - Además, en la zona anclada desplaza **el cuerpo entero** (`salas.css:1583-1590`). En Rankings eso haría que las pestañas se fueran con la lista.
   - La lámina deja quietos barra, cabecera, pestañas, subtítulo y «Tu posición», y **desplaza solo la lista**.
   - Para la 1c hay dos caminos: (a) que `PantallaChips` acepte `cta = null` y una lista que desplace por dentro; (b) una carcasa propia que use `BarraSuperior` y las clases `sal-cab`/`sal-chips`. Recomiendo **(a)**: «Tu posición» ocupa exactamente el sitio de la zona anclada (`sal-accion`).
3. **Dos columnas en horizontal bajo.** Con una sola columna, 915×412 dejaba unas dos filas a la vista. Con el molde de Salas B salen 4 en 915×412 y 7 en 1366×623 (V3 B). En dos columnas, la izquierda tiene un hueco en el medio. Ahí cabe la caja de V2 A, y en el futuro la pestaña «Este mes» (normativo §4).
4. **Cabecera de la lista.** Añadí una línea fija «Puesto · Jugador · Puntos / Heptacoins» al principio de la lista. Así las filas no necesitan «pts» (que en el juego ya significa puntos de mano). Fortunas lleva la moneda en cada cifra. Son 7u de alto (25–42 px).
5. **La corona.** En la fila hay un hueco reservado e invisible detrás del nombre (O1: el día que exista no moverá nada). En el mini-perfil se dibuja como contorno tenue. `?corona=muestra` la enciende en dos jugadores.
6. **Tu fila** se resalta con oro al 10 % y un filete de 3 px a la izquierda, y lleva «· tú» detrás del nombre. Cuando estás en el top te ves dos veces (en la lista y en la banda), porque §1 de la ficha la pide «siempre visible».
7. **Un solo oro (INV-08).** Con V3 B, la medalla del 1 es un disco de oro macizo. En pantalla conviven entonces dos macizos: el «+» de la píldora (que ya existe en todas las pantallas con barra) y la medalla. Las medallas 2 y 3 son solo contorno. Si se quiere un solo macizo, la medalla 1 puede ir también en contorno (más grueso). Decide Victor.
8. **SumaMente con V2 B** solo se ve si se baja hasta el final del top. En la vista `sumamente` la lista se abre ya abajo para enseñarla. En el producto la vería poca gente, que es lo que busca el rector. Con V2 A la caja come 64–102 px de lista **en todas las visitas** (360×640: de 6 filas a 4). Con V2 C la lista baja una fila solo en esas visitas, y eso choca con INV-05.
9. **La franja dentro del top.** El normativo §6.2 la pide «fuera del top 100». Dentro, la lámina enseña solo «Puesto 7». ¿Se quiere también «· dentro del 10 %» dentro del top? Ocupa lo mismo (la línea de la banda está reservada).
10. **La victoria.** El velo del mini-perfil (negro al 62 %) tapa casi toda la victoria; con `&perfil=no` se ve sola. El «AJILEI» de la imitación es texto, no el wordmark real (letra doble + ILEI). No rediseña nada.
11. **1920×1080** se queda en una columna de 660 px (`--col: 110u`, como Retar), con mucho aire a los lados y 11 filas. Si se quiere aprovechar el monitor, la regla de dos columnas podría extenderse a «horizontal ≥ 1280 de ancho» sin límite de alto. Hoy no lo hace ninguna pantalla de lobby.
12. **Las pestañas en dos líneas.** En dos columnas («Los grandes / maestros»), la pastilla crece de 44 a 57–61 px. No mueve nada y se lee bien. Ponerlas una encima de otra costaría otros 50 px.

---

## §4 · Medidas (Chromium del arnés; V1 A, V2 B, V3 B salvo que se diga)

| Tamaño | `--u` | Disposición | Lista (px) | Filas a la vista V3 B / V3 A | «Tu posición» | SumaMente | Mini-perfil ajeno / propio |
|---|---|---|---|---|---|---|---|
| 360×640 | 3,6 | 1 col | 365,6 | **6** / 7 | 334,8×78,9 | 334,8×64 | 328×317 / 328×468 ✓ |
| 412×915 | 4,1 | 1 col | 615,5 | **10** / 13 | 383,2×82 | 383,2×70 | 379×317 / 379×468 ✓ |
| 915×412 | 4,1 | 2 col | 300,8 | **4** / 6 | 329,6×82 | 445×70 (en la lista) | 600×174 / 600×278 ✓ (2 col) |
| 744×1100 | 6 | 1 col | 696,8 | **11** / 15 | 660×93,5 | 660×102 | 400×317 / 400×468 ✓ |
| 1366×623 | 6 | 2 col | 461,1 | **7** / 9 | 480×93,5 | 648×102 (en la lista) | 400×317 / 400×468 ✓ |
| 1920×1080 | 6 | 1 col | 676,8 | **11** / 14 | 660×93,5 | 660×102 | 400×317 / 400×468 ✓ |

- **V2 A** (caja arriba) resta lista: 360×640 de 6 a 4 filas; 412×915 de 10 a 9; 744×1100 de 11 a 9.
- **V1 B** (arriba) da las mismas filas que V1 A: la banda mide igual y solo cambia de sitio.
- La página no desborda en ningún caso (ni a lo ancho ni a lo alto).

### Lo que la Fase 1c debería sellar

| Medida | Valor de la lámina |
|---|---|
| Alto de fila | **56 px** (V3 B) o **44 px** (V3 A), fijos; letra a 3,5u |
| Círculo de la inicial en la fila | 0,62 × alto de fila (34,7 px con 56; 27,3 con 44); inicial al 44 % |
| Medalla del podio | `min(7,4u, 0,92 × círculo)`, con cinta |
| Columnas de la fila | `9u · círculo · 1fr · auto`, hueco 2u, relleno lateral 2u |
| Cabecera de la lista | 7u, fija arriba dentro de la lista |
| Banda «Tu posición» | línea de 2,9u + fila + 1,6u de aire → 79 px (360), 82 (412/915), 93,5 (u = 6); filete de oro al 35 % |
| Pestañas | `min-height: max(44px, 9,5u)`, rejilla 1fr 1fr, hueco 2u |
| Tarjeta SumaMente | alto `max(64px, 17u)` (64 / 70 / 102 px); ancho = columna (335–660 px); botón de contorno de 44 px de alto |
| Mini-perfil | ancho `min(100%, 92u, 400px)`; ✕ de 44×44; círculo de 72 px; alto 317 (ajeno) / 468 (propio). En horizontal ≤ 520 de alto, dos columnas de 600 px de ancho (174 / 278 de alto) |
| Columna | `--col: 110u` (≤ 660 px); en dos columnas, `196u` partida 1 : 1,35 |

---

## §5 · Textos (tal como irían al diccionario)

Prefijo propuesto: `rnk.` (hay que añadirlo a la lista de `src/config/textos.test.js:92`). Son **29 claves**:

| Clave | Texto |
|---|---|
| `rnk.titulo` | Rankings |
| `rnk.pestana.maestros` / `.fortunas` | Los grandes maestros / Las grandes fortunas |
| `rnk.sub.maestros` / `.fortunas` | Se gana jugando. No se compra. / Saldo total en Heptacoins. |
| `rnk.col.puesto` / `.jugador` / `.puntos` / `.hc` | Puesto / Jugador / Puntos / Heptacoins |
| `rnk.tu` | Tu posición |
| `rnk.tu.puesto` | Puesto {n} |
| `rnk.tu.franja` | Puesto {n} · dentro del {p} % |
| `rnk.tu.vacio` | Gana tu primera mano para entrar |
| `rnk.tu.yo` | tú |
| `rnk.fin` | Se muestran los 100 primeros. |
| `rnk.suma.familia` / `.titulo` / `.linea` / `.boton` | De la familia HEPTACREATION / SumaMente / Entrena tu mente con números / Ver en Play Store |
| `rnk.perfil.cerrar` / `.pais` | Cerrar / País y estado |
| `rnk.perfil.maestros` / `.fortunas` | Los grandes maestros / Las grandes fortunas |
| `rnk.perfil.puntos` | Puesto {n} · {p} puntos |
| `rnk.perfil.hc` | Puesto {n} · {s} Heptacoins |
| `rnk.perfil.correo` / `.solo_tu` | Correo / Solo lo ves tú. |
| `rnk.perfil.editar` / `.pronto` | Editar / Pronto |

**Dos que chocarán con la prueba de textos repetidos** (`textos.test.js:98`):

- `rnk.pestana.maestros` y `rnk.perfil.maestros` dicen lo mismo (y también las dos de fortunas). Se resuelve declarándolas como par o usando una sola clave.
- `rnk.perfil.pronto` repite «Pronto» de `lob.toast.pronto`; se puede reutilizar esa.

Fuera de `rnk.*` quedan «Ver tu nuevo ranking» y los textos de la victoria (Fase 0 K-9).

---

## §6 · Lo que la lámina no hace

- No anima nada (ficha §3.6) y no navega: tocar una fila o una pestaña no hace nada. Cada estado es una vista por URL.
- Medido solo en Chromium (el sellado del arnés). No pasé WebKit (iOS: nada que validar en una lámina estática; la 1c lo mide con `diagDSK webkit`).
- La letra es la del producto (`var(--sans, system-ui, …)`, que hoy cae a `system-ui`).

---

## §7 · Fuera del repo

En el scratchpad de la sesión quedan las 72 capturas y `medidas.json` de `_medir.mjs`, más tres capturas del visor:
`C:\Users\victo\AppData\Local\Temp\claude\c--Users-victo-OneDrive-Documents-ajilei\1934b08c-d027-4e70-87e7-bd3e7e7f1296\scratchpad\rnk1\`.

No hay servidores vivos: el http.server de la comprobación se cerró al terminar.
