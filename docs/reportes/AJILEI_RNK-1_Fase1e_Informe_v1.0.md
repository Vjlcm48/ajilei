# AJILEI · RNK-1 (Rankings) · Fase 1e · El intersticial de SumaMente y la línea de la familia · Informe · v1.0

**Ficha:** `AJILEI_RNK-1_Fase1e_v1.0.md` (rector) · **Ejecuta:** Claude Code · **Fecha:** 2026-10-28 · **Escrito para:** el rector y Victor
**Base:** `main` en `a6ce473`. Al empezar, el árbol estaba limpio salvo lo de MOT-1, `laminas/rnk1/` y `laminas/rnk1e/`.
**Estado:** validada por Victor el 2026-10-28 (§5). **Sin commits** al cerrar la tanda. Nada en `supabase/`, ningún protegido abierto y `vite.config.js` sin tocar. Tardé unos 30 de los 180 minutos.
**Materiales:** los cinco estaban en `laminas/rnk1e/` (comprobado con un listado antes de empezar). Los dos mp4 son los recortados de 580×1280 que Victor puso a mitad de la tanda: es = 551.009 bytes y en = 538.643. Se copiaron después de cambiarlos, así que no hubo que repetir el copiado (§1.3).

---

## Resumen

- **El intersticial existe.** Es una pantalla de la cascada de `App` (`screen === 'sumamente'`), entre el lobby y Rankings, fuera de `conVideo` y sin `data-escala`. Es la lámina 1e-L traducida a React con V1 B · V2 A · V3 A · «Continuar» en fila, y la caja a la proporción real del video (29/64).
- **El contador es puro y está probado.** `decidir` aplica las cuatro reglas sin React ni almacén: la tabla del rector y Premium nunca. Un módulo aparte guarda `{ n, dia }` en una sola clave del aparato, censada en INV-12. El día es el de Chicago y se calcula en el cliente.
- **La línea de la familia** está al final del top 100 en las dos pestañas, para todos, dentro del hueco que dejó la 1c-i, que conserva su alto (64 en 360×640 y 70,03 en 412×915). Contraste en el peor tono: 5,49 sobre el verde y 5,19 sobre el vino.
- **El mando `?suma`** (solo en desarrollo) deja el contador a una entrada del video, y `?suma=fin` lo deja con el día gastado. No llega a ningún build: lo vigila la guardia de `dist/`, con una huella nueva.
- **El modo `diagDSK suma`** pasa sus 9 puertas y la consola en verde, con el mp4 enrutado al WebM de prueba. Entra en `humo`.
- **Lo que no se pudo medir aquí:** el arranque con sonido en un navegador que lo bloquee, que el arnés simula; el H.264 en el iPhone; y el enlace abriendo la app de Play Store. Son las pruebas B de Victor (§5).

---

## §1 · Línea base, arnés y huellas

### §1.1 · Pruebas y paquete

| Vara | Resultado |
|---|---|
| vitest (npm test) | **79 archivos, 1896 pruebas, en verde**. Incluye `testClavesAlmacen` (con `ajilei.sumamente`), `testDistSinMoldes` (con `molde-suma` prohibida y `sumamente_promo_es.mp4` obligatoria), `testInvariantes`, `testProtegidos` (huellas al byte) y las dos nuevas (`sumaCore.test.js`, 8 pruebas; `sumaContador.test.js`, 4). |
| lint | **21 problemas, los 21 de siempre** (20 errores y 1 aviso, en `CardImage.jsx`, `GameTable.jsx` y `SoundContext.jsx`). Lo nuevo: 0. |
| build | Compila. Paquete principal: **JS 632.545 B (184.013 gzip)**, frente a 626.605 (182.351) en `a6ce473`: **+5,9 kB, +1,7 kB gzip**. **CSS 129.784 B (24.378 gzip)**, frente a 123.852 (23.356): **+5,9 kB, +1,0 kB gzip**. La base se compiló en un worktree aparte. |
| Los mp4, fuera del JS | `dist/sumamente/` tiene los dos mp4, con el mismo sha256 que `public/`. En el JS solo está la ruta (`/sumamente/sumamente_promo_es.mp4`), y la guardia de `dist/` la exige. Ningún mp4 entra en `dist/assets/`. |
| Iconos | `sumamente_64.webp` (1.484 B) va como archivo aparte con `?no-inline`: incrustado, el minificador lo copiaba dos veces en el JS (§M-6). `sumamente_512.png` (44.392 B) es un archivo de `dist/assets/` y solo se pide cuando el intersticial lo pinta. |

### §1.2 · Los modos del arnés (todos con código 0)

| Modo | Veredicto |
|---|---|
| `diagDSK suma` | **VERDE**: suma-contador (5/5), suma-abre (1/1), suma-omitir (1/1), suma-fin (2/2), suma-caja (6/6), suma-sonido (1/1), suma-atras (1/1), suma-linea (4/4), suma-escala (2/2), consola. 16 contextos, aislamiento verde. 57 s por su nombre (`--sin-build`). |
| `diagDSK rnk` | **VERDE**: las 14 puertas y la consola (la línea nueva no movió la banda, el final ni las dos columnas). |
| `diagDSK lob` | **VERDE**: 11/11 celdas. |
| `diagDSK webkit` | **VERDE** (WebKit 26.5): 40 celdas que cuentan y 10 con LIMITACIÓN, las mismas de siempre (el iPhone acostado). |
| `diagDSK humo` | **Código 0**, en 4 min 20 s: gate, lob, retar, rnk y **suma** en verde, y d1d2, d3, bug y shots informativos (como siempre); aislamiento verde. |

### §1.3 · Los medios: tamaño y sha256 antes y después del copiado

| Archivo | Bytes | sha256 | En `laminas/rnk1e/` | En el repo |
|---|---|---|---|---|
| `sumamente_promo_es.mp4` | 551.009 | `d75913ce046c3a0f0c6f428fcb2c69efd67ebbc2a6451f69c49f06053b19f31e` | igual | `public/sumamente/` (y `dist/sumamente/`) |
| `sumamente_promo_en.mp4` | 538.643 | `26814b0ec2b8c0316e31d73abb98f1f11e272b783e15224d934c027f61bde78b` | igual | `public/sumamente/` (y `dist/sumamente/`) |
| `sumamente_64.webp` | 1.484 | `31b8d25b066abd5e6b4c90a9121b7704f0c1e5ca55fe5be4c8c278aeab601be0` | igual | `src/assets/` |
| `sumamente_512.png` | 44.392 | `6eb614a6ebd57d324b4abb13d7fc50e65cf6d118a9bfd64088224e0f55d43639` | igual | `src/assets/` |
| `sumamente_prueba.webm` | 32.021 | `a7e6c7243f5078f07d86a9833fb51dfbee55712e1fe81fdb5e2c7c40b78cb608` | igual | `scripts/arnes/fixtures/` (carpeta nueva) |

- El listado del principio aún enseñaba los mp4 viejos (564.620 y 549.252 bytes). El aviso de Victor llegó antes de copiar nada a `public/`: volví a listar, saqué las huellas de los nuevos y copié esos.
- **El 512 se queda tal cual.** No hay `sharp` en la máquina (ni `ffmpeg`), así que no hice el derivado de 256.

---

## §2 · Medidas

Medidas de `diagDSK suma`, en el Chromium del arnés y con el WebM de prueba (290×640, la misma proporción que los mp4). Son las del final del video, con todo a la vista: V1 B · V2 A · V3 A · `cont=fila`.

| Tamaño | `--u` | Disposición | Caja del video (an × al) | % del alto | Google Play (al × an) | «Continuar» (al) | «Omitir» (zona · sitio) | Cabe / desborda |
|---|---|---|---|---|---|---|---|---|
| 360×640 | 3,6 | apilada | **203 × 448** | 70,0 | 48 × 280 | 44 | 78,3 × 44 · (265,7, 16) | sí / no |
| 412×915 | 4,12 | apilada | **326,7 × 721** | 78,8 | 48 × 280 | 45,3 | 82,9 × 44 · (313,1, 16) | sí / no |
| 915×412 | 4,12 | lateral | **172,2 × 380** | 92,2 | 48 × 263,7 | 45,3 | 82,9 × 44 · (816,1, 16) | sí / no |
| 832×384 | 3,84 | lateral | **159,5 × 352** | 91,7 | 48 × 245,8 | 44 | 80,1 × 44 · (735,9, 16) | sí / no |
| 744×1100 | 6 | apilada | **378,8 × 836** | 76,0 | 66 × 384 | 66 | 119,9 × 54 · (603,1, 21) | sí / no |
| 1366×623 | 6 | lateral | **263,3 × 581** | 93,3 | 66 × 384 | 66 | 119,9 × 54 · (1225,1, 21) | sí / no |
| 1920×1080 | 6 | apilada | **369,8 × 816** | 75,6 | 66 × 384 | 66 | 119,9 × 54 · (1779,1, 21) | sí / no |

- **La proporción** es 1280/580 con un desvío de 0 a 0,02 px en los siete tamaños (la puerta pide ≤ 0,6).
- **Frente a la tabla de la lámina (§4 del 1e-L):** coinciden los **altos** del video, la disposición, los botones, «Omitir», el margen y que todo cabe sin desbordar. Cambian los anchos, porque la caja pasa de 9:16 a 29/64: es más estrecha. En 412×915 eso le cambia el límite: con 9:16 mandaba el ancho (380 × 675,5) y ahora manda el alto, así que el video **crece** a 721 (78,8 % frente a 73,8 %). Todo lo de «Lo que la 1e debería sellar» está tal cual.
- **Contraste** (el texto con su alfa, compuesto sobre el fondo): «Ver en Google Play» 15,77; «App para Android», familia y «Omitir» 8,52; «Continuar a Rankings» 9,51. Son las cifras de la lámina.
- **El botón de sonido** mide 44 × 44 en 360×640, porque `max(44px, 9u)` da 44 hasta u = 4,9.
- **«Omitir»** aparece a **5.010 ms** del arranque (con el video a media velocidad, en el segundo 2,53 de 4,01).
- **La línea de la familia:**

| Celda | Filas | Línea (an × al) | Hueco (1c-i) | Contraste en el peor tono |
|---|---|---|---|---|
| 412×915 Maestros | 100 | 250 × 44 | 70,03 (70,04) | 5,49 sobre `#1b482c` / `#153922` / `#09170e` |
| 412×915 Fortunas | 100 | 250 × 44 | 70,03 (70,04) | 5,19 sobre `#7c1d30` / `#5a1426` / `#1e070d` |
| 360×640 Maestros | 6 | 221,8 × 44 | 64 (64) | 5,49 |
| 360×640 Fortunas | 7 | 221,8 × 44 | 64 (64) | 5,19 |

- **Capturas** (fuera del repo), en `C:\Users\victo\AppData\Local\Temp\claude\c--Users-victo-OneDrive-Documents-ajilei\18b512dc-12ee-41a9-9c7e-637ff7eed4b7\scratchpad\rnk1e-g\`:
  - el final en los siete tamaños (`fin_<tamaño>.png`);
  - la carga (`cargando_412x915.png`) y la rama en silencio (`silencio_360x640.png`);
  - la línea en las dos pestañas y con pocas filas (`linea_*.png`);
  - y las de la sonda en desarrollo con Edge (`dev_*.png`, §M-12).

---

## §3 · Archivo por archivo

### Código nuevo
- **`src/lib/sumaCore.js`:** el núcleo puro.
  - `CADA_ENTRADAS = 8` (:20) y `ENLACE_PLAY` (:23).
  - `OMITIR_MS` (:26) y `RESCATE_MS` (:30), §M-3.
  - `diaChicago` (:39), `decidir` con las cuatro reglas (:51) y `videoDe` (:62).
- **`src/lib/sumaContador.js`:** la persistencia.
  - La clave `ajilei.sumamente` (:14), §M-1.
  - `crearSumaContador` con `try/catch` (:23): con basura o sin almacén lee `{ n: 0, dia: null }`.
  - `sumaContador` (:44).
- **`src/lib/sumaIconos.js`:** los dos iconos, el de 64 con `?no-inline` (:8–9).
- **`src/dev/siembraSuma.js`:** el mando `?suma` / `?suma=fin`, con doble puerta como `?cel` (:27). La huella `molde-suma` va en el aviso de consola.
- **`src/screens/IntersticialSumaMente.jsx`:** la pantalla.
  - El arranque con sonido y la caída a silencio por `NotAllowedError` (:84–98).
  - Los 5 s con un temporizador de 100 ms (:101–110) y el rescate a los 8 s (:96).
  - El historial para el botón «atrás» (:112–124).
  - La pausa en segundo plano (:126–137), §M-4.
  - `data-suma-estado` en la raíz (:158), y `onEnded` / `onError` → `fin` (:185–186).
  - Props `{ idioma, onFin }`.
- **`src/styles/sumamente.css`:** la hoja, nueva y aditiva, sin `!important`.
  - La carcasa fija a pantalla entera (:18).
  - La caja por `cq` a 29/64 (:127).
  - El corte lateral (:225).
  - Los fundidos solo con `prefers-reduced-motion: no-preference` (:242). La lámina los quitaba con `!important`.
- **`src/lib/sumaCore.test.js`** (8 pruebas: la tabla del rector, la entrada 16, Premium, contadores raros, `diaChicago` a las 23:30 y a las 00:30 en verano e invierno, `videoDe` es/en/pt y el enlace) y **`src/lib/sumaContador.test.js`** (4: sin almacén, almacén que lanza, escribir y leer bajo una sola clave, basura → n = 0).
- **`scripts/suma/suma.mjs`:** el modo `suma`, con 9 puertas y la consola (cabecera :1–44).

### Código tocado
- **`src/App.jsx`:**
  - Los imports (:18–24).
  - `'sumamente'` en `SIN_PRECARGA` (:139), §M-5.
  - `esPremium = false`, el único sitio de la condición (:145).
  - `siembraSuma()` (:149) y `useIdioma` (:170).
  - `entrarRankings` (:730).
  - La pantalla en la cascada, antes de Rankings (:974–976), y `onRankings={entrarRankings}` (:1010).
- **`src/screens/Rankings.jsx`:** la cabecera de la 1e y sus imports (:15–16), y la línea dentro del hueco (:266–281). El hueco pierde el `aria-hidden` porque ahora lleva un enlace; la caja sigue invisible y solo se enciende la línea.
- **`src/styles/rankings.css`:** §10 nueva (:376 en adelante). Es aditiva: el hueco `.rnk-premium` (:243) no cambia de alto.
- **`src/config/textos.es.js`:** las 8 claves `rnk.suma.*` (:547 en adelante); `rnk.suma.linea` es el nombre accesible de la línea (§M-9).
- **`scripts/testClavesAlmacen.test.js`:** `ajilei.sumamente` en el censo (:34) y `sumaContador.js` en los accesores (:49).
- **`scripts/testDistSinMoldes.test.js`:** `molde-suma` prohibida (:57) y `sumamente_promo_es.mp4` obligatoria (:79).
- **`scripts/diagDSK.mjs`:** el import (:335), `suma` en `MODOS_PREVIEW` (:431), la llamada en `suma` y en `humo`, y la cabecera de `humo` (:14).
- **`scripts/arnes/nucleo.mjs`:** el veredicto de `suma` (:213) y `suma` en `MODOS_DSK` (:228).
- **`.gitattributes`:** `*.mp4` y `*.webm` como binarios, §M-7.

### Medios
`public/sumamente/sumamente_promo_es.mp4` y `public/sumamente/sumamente_promo_en.mp4`, `src/assets/sumamente_64.webp` y `src/assets/sumamente_512.png`, y `scripts/arnes/fixtures/sumamente_prueba.webm` (§1.3).

### Documentos
- **`docs/AJILEI_Rankings_v1.2.md`** (nuevo): la v1.1 con:
  - «Qué cambia respecto de la v1.1» (los dos puntos de la ficha);
  - §6.7 (la línea para todos y Premium solo la línea);
  - §6.7.1 nueva (las cuatro reglas, la clave en el aparato, el día de Chicago, `CADA_ENTRADAS` y la ficha de la pantalla);
  - §13 (publicidad) y §15 (fuentes).
- **`docs/AJILEI_Rankings_v1.1.md`:** la línea «> Sustituido por v1.2 — 2026-10-28» arriba.
- **`docs/AJILEI_Invariantes_v1.0.md`:**
  - la línea de actualización;
  - §4 (la fila de Rankings pasa a la v1.2, con `sumaCore.test.js`, `sumaContador.test.js` y `diagDSK suma`);
  - las fuentes de INV-65, INV-66 e INV-67, que pasan a la v1.2 (§M-8);
  - §6 (la fila nueva de `diagDSK suma` y la de `diagDSK humo`).
- **Este informe.**

---

## §4 · `git status`

Sin commits. Modificados (11):

```
 M .gitattributes
 M docs/AJILEI_Invariantes_v1.0.md
 M docs/AJILEI_Rankings_v1.1.md
 M scripts/arnes/nucleo.mjs
 M scripts/diagDSK.mjs
 M scripts/testClavesAlmacen.test.js
 M scripts/testDistSinMoldes.test.js
 M src/App.jsx
 M src/config/textos.es.js
 M src/screens/Rankings.jsx
 M src/styles/rankings.css
```

Nuevos de la 1e (16 archivos):

```
?? docs/AJILEI_Rankings_v1.2.md
?? docs/reportes/AJILEI_RNK-1_Fase1e_Informe_v1.0.md
?? public/sumamente/sumamente_promo_en.mp4
?? public/sumamente/sumamente_promo_es.mp4
?? scripts/arnes/fixtures/sumamente_prueba.webm
?? scripts/suma/suma.mjs
?? src/assets/sumamente_512.png
?? src/assets/sumamente_64.webp
?? src/dev/siembraSuma.js
?? src/lib/sumaContador.js
?? src/lib/sumaContador.test.js
?? src/lib/sumaCore.js
?? src/lib/sumaCore.test.js
?? src/lib/sumaIconos.js
?? src/screens/IntersticialSumaMente.jsx
?? src/styles/sumamente.css
```

Y los que ya estaban sin seguimiento antes de empezar: MOT-1 (dos informes y `laminas/mon1/`), `laminas/rnk1/`, `laminas/rnk1e/` y el informe 1e-L.

- **Nada en** `supabase/`, en los protegidos (`testProtegidos` verde) ni en `vite.config.js` (`git diff` vacío).
- **Queda por borrar a mano:** `.git/worktrees/wt-base-1e`. Es del worktree en el que compilé la base para comparar el peso. `git worktree remove` lo quitó de la lista, pero OneDrive no dejó borrar la carpeta («Permission denied»). La unión de `node_modules` ya está quitada.
- **No quedan servidores vivos:** el 5181 de la sonda está libre, y los del arnés los cierra el propio arnés.

---

## §5 · Pruebas de Victor

**A · PC con bypass (5173).** `npm run dev` y luego `http://localhost:5173/?suma`.
1. Lobby → Rankings: sale el intersticial. Debe enseñar:
   - el icono mientras carga;
   - el video con sonido, o en silencio con el botón de sonido arriba a la izquierda;
   - «Ver en Google Play» desde el principio;
   - «Omitir» a los 5 s.
2. Dejarlo terminar: el último fotograma se queda y «Continuar a Rankings» se enciende en dorado. Tocarlo lleva a Rankings.
3. Volver al lobby (con la casa) y entrar 7 veces más: no sale nada. La 8.ª tampoco, porque el día está gastado. (Ya está comprobado en la sonda de §M-12.)
4. F12 a 390×844 y 360×640 (apilada), 915×412 (lateral) y el navegador a 1920×1080.
5. Bajar al final de la lista en las dos pestañas: aparece la línea de la familia. Tocarla abre Google Play en pestaña nueva.
6. Para repetir, se recarga la página con `?suma`.

**B · Túnel con el S25 contra la base real.**
1. Entrar a Rankings **8 veces** desde el lobby, contando. En la 8.ª sale el intersticial.
2. **Sonido:** anotar si arrancó solo o si salió el botón de sonido.
3. «Omitir» a los 5 s.
4. El **botón «atrás» del S25** antes de los 5 s (no debe pasar nada) y después (debe ir a Rankings).
5. Tocar «Ver en Google Play»: debe ofrecer **la app de Play Store** con SumaMente. Al volver, el video sigue donde estaba, y en Play Store no debe oírse (§M-4).
6. Girar el S25 con el video en curso: disposición lateral.
7. Dejar terminar otro → «Continuar a Rankings». Para esa segunda vuelta de 8 hace falta otro día, porque hoy ya está gastado. O se borran los datos del sitio en Chrome del S25 para repetir hoy, y se anota que se hizo así.
8. La línea de la familia al final de Fortunas → Play Store.

**C · Dejarlo como estaba.** Borrar los datos del sitio, o no hacer nada: el contador solo vive en el aparato.

Resultado real · 2026-10-28 (Victor): A · bypass en la PC con ?suma: intersticial con icono de carga, video con sonido, «Ver en Google Play» desde el inicio, «Omitir» a los 5 s, final con «Continuar a Rankings»; línea de la familia al final de las dos pestañas → Google Play en pestaña nueva; F12 390×844 y 360×640 (apilada), 915×412 (lateral) y 1920×1080. Conforme. B · túnel con el S25 (test1976) contra la base real, dos vueltas de 8 entradas (la segunda con una URL nueva del túnel, que reinicia el contador del aparato): el intersticial en la 8.ª entrada y no antes; arrancó CON sonido (sin botón de sonido); «atrás» del S25 inerte antes de los 5 s y como «Omitir» después; al girar, disposición lateral; «Ver en Google Play» abrió la app de Play Store con SumaMente y al volver el video continuó; «Continuar a Rankings» al terminar; la línea de la familia al final de Fortunas → Play Store. Conforme. iPhone: pendiente de la sesión de iOS. Veredicto: PASA.

---

## §M · Notas, desviaciones y preguntas

1. **La clave se llama `ajilei.sumamente`, con punto, y no `ajilei:sumamente`.**
   - La ficha la escribe con dos puntos. La convención de la casa es `ajilei.<cosa>`: la cabecera de `testClavesAlmacen`, y las 14 claves del censo.
   - Además, la primera prueba del censo solo caza claves `ajilei.`. Con dos puntos, una segunda clave hermana podría colarse sin que nadie la viera.
   - Es un cambio de un carácter. **Pregunta:** ¿se queda así?
2. **Premium, en el arnés, se mide en el núcleo y en el código, no en la pantalla.** `esPremium` es una constante del paquete (`App.jsx:145`) y `vite preview` no deja forzarla desde fuera sin dejar un mando en producción. La puerta mide dos cosas:
   - que `decidir` con `premium` no enseñe y reinicie;
   - que `App.jsx` tenga **una** sola definición, `false`, y que sea la que llega a `decidir`.
3. **El reloj de «Omitir».**
   - La lámina leía `currentTime` cada 100 ms. Aquí el tic es el mismo, pero cuenta el **tiempo de pared desde que el video arranca** (`playing`). A velocidad 1 es lo mismo; si el video se atasca, el reloj sigue y nadie se queda esperando un búfer.
   - Hay dos salidas que la lámina no previó:
     - si el video **no llega a arrancar** (sin red, o un ahorro de batería que bloquea hasta el arranque en silencio), «Omitir» sale igual a los **8 s** de montar la pantalla;
     - si el video da error, la pantalla pasa a `fin` con «Continuar».
   - **Pregunta:** ¿te valen los 8 s?
4. **Pausa en segundo plano (no estaba en la lámina).** Tocar «Ver en Google Play» abre otra pestaña o la app de Play Store, y el video con sonido seguiría sonando encima. Por eso se pausa al ocultarse la página y sigue al volver.
5. **`'sumamente'` va en `SIN_PRECARGA`.** Ninguna pantalla se había añadido a esa lista de precarga sin decirlo, así que lo anoto. El efecto que precarga la mesa (audio, baraja y chunk) ya corre al entrar en Rankings. Sin esto también correría durante el intersticial y competiría por la red con el video. Rankings, que viene detrás, sigue precargando como antes.
6. **Los iconos.** La webp de 64 incrustada salía **dos veces** en el JS: el minificador copia el data URI en cada sitio donde se usa. Va como archivo con `?no-inline`, igual que `heptacoin.svg` en Rankings.
7. **`.gitattributes`.** No declaraba `mp4` ni `webm`. `text=auto` los detecta como binarios por los NUL, pero para un video lo dejé escrito. Lo comprobé con `git check-attr`: `binary: set`.
8. **Invariantes.** Además de la fila de §4, las fuentes de INV-65, INV-66 e INV-67 pasan a la v1.2 (son las mismas secciones), como se hizo con las Reglas de ECO-1. La fila de `diagDSK humo` decía «d1d2, d3, bug, shots, gate, lob y retar», pero desde la 1c-ii ya corría `rnk`; ahora lo dice, y también `suma`.
9. **Textos.** La línea visible son `rnk.suma.titulo` («SumaMente») y `rnk.suma.boton` («Ver en Google Play»). `rnk.suma.linea` es su nombre accesible (`aria-label`), así que no hizo falta declarar ningún par en la prueba de repetidos. `{marca}` se interpola entero y solo después se pone en negrita, sin trocear la frase.
10. **¿Interfiere `history.pushState` con algo de la app?**
    - **No, que se haya visto.** En `src/` nadie más escucha `popstate` ni empuja historial; lo único es un `replaceState` de `salaPendiente.js`, que limpia la URL al arrancar. La URL no cambia (se empuja la misma), así que `?sala=` y la sesión no se enteran.
    - La entrada lleva una marca (`ajileiSumaMente`):
      - con `StrictMode` (el efecto corre dos veces) no se empujan dos;
      - al salir por un botón se consume con `history.back()`, y la puerta suma-fin comprueba que no queda una entrada muerta detrás de Rankings.
    - **Un caso raro:** si se recarga la página **durante** el intersticial, la entrada marcada se queda. Nada se rompe: la siguiente vez el «atrás» la consume y se vuelve a empujar.
11. **¿Arrancó con sonido en el Chromium del arnés?** **Sí.** Tras el clic en «Rankings» (un gesto de verdad), `play()` con sonido no fue rechazado: `muted = false` y sin botón de sonido (suma-abre). Por eso la rama en silencio se **simula** en suma-sonido. Un navegador real puede bloquearlo: esa es la prueba B-2.
12. **Sonda en desarrollo con Edge (H.264 real, bypass, `StrictMode`).** Fuera del arnés y fuera del repo (`scratchpad\sondaSumaDev.mjs`), contra `vite` en el 5181 con el bypass y Edge, que sí decodifica el mp4:
    - `?suma` dejó la clave en n = 7; la primera entrada abrió el intersticial y gastó el día.
    - El video real (580×1280, 19,6 s) arrancó **con sonido** (`muted = false`).
    - El historial quedó con una sola entrada marcada pese a `StrictMode`. «Atrás» a ~1 s no hizo nada; «Omitir» salió en el segundo 5,22 del video y llevó a Rankings sin dejar la entrada.
    - Las 8 entradas siguientes: 7 sin nada (n de 1 a 7) y la 8.ª tampoco, por el día gastado (n = 0).
    - El video entero hasta «Continuar»: 20,1 s en 360×640, 915×412 y 1920×1080, con el último fotograma posado (19,6/19,6).
    - `?suma=fin`: la entrada siguiente fue a Rankings directo y dejó n = 0.
    - Errores de consola: solo un 401 por contexto, del bypass de desarrollo, que llama al Supabase real sin sesión (ya pasaba antes, TAB-2a). Ninguno del intersticial.
13. **Lo que la lámina no previó, y anoto:**
    - con 29/64, en 412×915 el video crece (§2);
    - el WebM de prueba tiene la misma proporción que los mp4 (290×640), así que la caja medida es la del producto;
    - el intersticial va en el paquete principal (+5,9 kB de JS), sin diferirlo. Si se quiere en un trozo propio, es la misma cola de ARN-4 que las capas del video de ECO-1g.
14. **WebKit / iPhone.** `diagDSK webkit` está verde, pero no corre el intersticial: el WebKit de Playwright en Windows no garantiza estos códecs, y el arranque con sonido de Safari no se puede simular con honestidad. En el iPhone queda por ver.
15. **§3-8 de la lámina queda resuelto por el material:** los mp4 recortados de 580×1280 ya no traen franjas negras, y la caja tiene su proporción.
