# AJILEI · SAL-B2 · Cierre · v1.0
## El barajado acompasado al abanico, y la campaña entera en ocho atómicos sobre `e037db0`

**Ficha:** `AJILEI_SAL-B2_Cierre_v1.0.md`. **Rectores leídos enteros antes de empezar:** los informes de F1a, F1b y Ajustes, en `docs/reportes/`.
**Autoridad visual:** `AJILEI_SAL3_lamina_v1.6.html` (sellada 12-sep-2026). **Fecha:** 2026-09-12. **Cero SQL.**

---

## 1 · Parte A · El barajado

**El hecho medido** (informe de Ajustes §2.3): `card-shuffle.mp3` dura 5,208 s y el recorte del 49 % de la receta deja **2 552 ms** de sonido, contra un abanico que ningún techo razonable dejaba pasar de 1 400. La decisión de Victor invierte quién manda: **el abanico manda y el sonido se acompasa a él**.

| Qué | Dónde |
|---|---|
| `MAZO_ANIM_MS = 1200` y `MAZO_FUNDIDO_MS = 250`, con el porqué escrito encima | `SalaEspera.jsx:61-82` |
| El pulso del mazo: mismo tick, cortina y parada | `SalaEspera.jsx:264-325` |
| `--sal-esp-baraja` con los 1 200 ms | `SalaEspera.jsx:546`, `salas.css:1022-1029` |

**Por qué 1 200 y no la duración del audio**, que es lo que la ficha pedía dejar escrito: el recorte del 49 % lo diseñó la **mesa de juego** para su propio gesto —un barajado que reparte una mano—, y aquí el mazo es ambiente en el fieltro. Una receta pensada para otra pantalla no se hereda. 1 200 ms es el abanico de la lámina (900) con el aire justo para que se lea a este tamaño, y es **una sola cifra**: gobierna la animación por `--sal-esp-baraja` y el apagado del sonido por los dos relojes. La lectura de `sound.duration()`, el suelo y el techo desaparecen del código, y con ellos la posibilidad de que dos números se separen.

**Cómo muere el sonido.** A los `1200 − 250 = 950 ms` se arranca `sound.fade(0,15 → 0, 250, id)` sobre **esa** instancia, y al terminar la cortina se la detiene. Un corte seco se oye feo. `useSounds.js` no se toca: su propio recorte sigue programado para los 2 552 ms y encuentra la instancia ya parada, que es una operación sin efecto.

**Una decisión de higiene, declarada.** La ficha §1.3 pedía que los dos `setTimeout` llevaran handle y se limpiaran al desmontar y al ocultarse la pestaña. `callar()` hace eso **y para la instancia en el mismo gesto**: cancelar los relojes sin parar el sonido dejaría sonando el resto del archivo, que es justo el defecto que esto existe para quitar. Es el molde de `cancelaRecorte` en `useSounds.js`, que ya lo razona así desde FRZ-1.

**Medido en el navegador, no deducido.** Enganchando el prototipo de Howler desde una sonda, sin tocar el código:

| t (ms) | Qué | Con qué |
|---|---|---|
| 21 982 | `play` | id 1004 |
| 21 983 | `volume` | `0,15` sobre 1004 |
| 22 936 | `fade` | `0,15 → 0` en 250 ms (= play + 954) |
| 23 190 | `stop` | 1004 (= play + 1 208) |
| 24 412 | `fade` de la receta | sobre 1004, ya parada: sin efecto |

La clase `is-baraja` vivió de 21 985 a 23 189 —**1 204 ms**— con `animation-duration: 1.2s`. Sonido y dibujo mueren juntos.

**Cero pruebas nuevas, y el motivo.** El cambio vive entero en un efecto de `SalaEspera.jsx`, y esa pantalla no tiene arnés de pruebas: no hay jsdom ni `@testing-library` en el proyecto, y la receta de la casa para probar un hook exige extraer un controlador puro —un módulo nuevo que el §2 de la ficha deja fuera del alcance—. Lo que sella este cambio es la medición de arriba.

---

## 2 · Los ocho atómicos

Mapa aprobado por Victor **antes del primer `git add`**, cumplido archivo por archivo. Orden núcleo → API → arnés → pantallas → informes.

| # | SHA | Commit | Archivos |
|---|---|---|---|
| B2a | `fd1c832fdcd8bbad5e01bc2f502adc521d2fc116` | `SAL-B2a: migracion sal_b2 …` | `supabase/migrations/20260911230935_sal_b2.sql` |
| B2b | `afbe698f8bbb22974567235ac62f3c2633494c06` | `SAL-B2b: nucleo puro salaEsperaCore …` | `salaEsperaCore.js` + test, `useCronometroSala.js` + test, `config/salas.js` |
| B2c | `69358e58f4f4cd246d7a84d39fcc1e296eb6ac98` | `SAL-B2c: salasApi con asientosDe y leerSala …` | `lib/salasApi.js` + test |
| B2d | `e94d3dde879f151ca598d5873207ed4f98d13074` | `SAL-B2d: textos de SAL-3 … e icono Compartir` | `textos.es.js`, `textos.test.js`, `IconosSalas.jsx` |
| B2e | `abbfe0b0bd238d9d17b5f444a9405cbe2efcea54` | `SAL-B2e: arnes con 17 estados …` | `dev/salasFixtures.js`, `scripts/diagSAL.mjs` |
| B2f | `54ea4c4014eb22bfb01fcaa8689ef6f7a8766e20` | `SAL-B2f: SalaEspera real con Realtime …` | `SalaEspera.jsx`, `PartidaPvP.jsx`, `App.jsx`, `salas.css`, `useSounds.js` |
| B2g | `5748ece73397fd74a65867400bf70728194209ab` | `SAL-B2g: informes de SAL-B2 …` | los cuatro informes anteriores |
| B2h | **este mismo commit** | `SAL-B2h: informe de cierre de SAL-B2 …` | este informe |

22 archivos. `git diff --name-only e037db0..HEAD` los devuelve exactamente, sin uno de más ni de menos.

**Fuera, sin seguimiento al terminar (los seis residuos conocidos):** `_probeA1.mjs`, `_shotA1.mjs`, `laminas/mon1/_entorno.txt`, `laminas/mon1/lamina.html`, `laminas/mon1/tiempos.json`, `scripts/_cel1bFila.mjs`.

### 2.1 · Por qué un octavo, y no siete

La ficha metía el informe de cierre en B2g y a la vez le pedía los SHA de los siete: un informe dentro de B2g no puede llevar el SHA de B2g. Se planteó la contradicción **antes** de tocar `git` y Victor decidió el octavo atómico, con este motivo, que queda aquí escrito:

> **La ceremonia existe para que el repo cuente su propia historia sin ayuda del chat.** Las otras dos salidas —el informe con seis SHA y un hueco, o los SHA pegados sólo en el chat— dejaban la trazabilidad a medias o fuera del repo. «Siete atómicos» nunca fue el objetivo; el objetivo es que **cada commit construya solo** y que **cada archivo tenga su sitio**, y un informe de más no rompe ninguna de las dos cosas.

### 2.2 · «Cada atómico construye solo», comprobado por el grafo

Un `npm run build` del árbol entre commits **no prueba nada**: el árbol de trabajo es el final en todo momento y no cambia al commitear, así que construiría igual con el orden invertido. La comprobación que sí mide lo que dice es estática: para cada atómico, que **ningún archivo suyo importe algo que no esté ya** en `e037db0` o en un atómico anterior.

| Atómico | Importa | Estaba en |
|---|---|---|
| B2a | — (SQL, fuera del bundle) | — |
| B2b | `config/salaPendiente`, `hooks/relojCore`, `config/ajileiConfig` | `e037db0` |
| B2c | `lib/supabase` | `e037db0` |
| B2d | — (`textos.es.js` e `IconosSalas.jsx` no importan nada) | — |
| B2e | `crearSalasApi`, `LLENA_SEG` | B2c, B2b |
| B2f | `salaEsperaCore`, `useCronometroSala`, `salasApi`, `IconosSalas`, `PartidaPvP` | B2b, B2b, B2c, B2d, mismo commit |
| B2g · B2h | — (Markdown) | — |

Dos detalles que se miraron a propósito: `salasFixtures.js` (B2e) manda a `sala-espera`, pantalla que `App` ya conocía en `e037db0`, así que el arnés no adelanta ninguna ruta; y `textos.test.js` (B2d) no recorre `src/`, así que retirar claves no lo rompe aunque la pantalla que las usaba llegue un commit más tarde.

---

## 3 · Cifras finales y ceremonia

Corridas **una sola vez sobre el árbol commiteado**, antes del push:

| Qué | Resultado | Línea base |
|---|---|---|
| `npx eslint .` | **21** (20 errores, 1 aviso) | 21 |
| `npm test` | **685 / 685** en 26 archivos | 618 / 24 al empezar la campaña |
| `npm run build` | limpio; `dist/` sin `__salEmitir`, `simulacionSalas` ni `ESTADOS_SAL` | — |
| `node scripts/diagSAL.mjs sal` | **102 / 102** | 66 / 66 al empezar |
| Protegidos (`git diff e037db0` sobre los cinco) | vacío | — |
| `git status` | sólo los seis residuos | — |

**Ceremonia de tres SHA iguales:** se hace sobre el árbol final, después de este commit, con `git rev-parse HEAD`, `git rev-parse main` y `git log -1 --format=%H`. Los tres devuelven el SHA de B2h, que es el de este mismo informe, y quedan pegados en el chat de la sesión.

---

## 4 · La campaña SAL-B2, de una pieza

Cuatro tandas sobre `e037db0`, del 11 al 12 de septiembre de 2026.

| Tanda | Qué se construyó | Cifras al cerrar |
|---|---|---|
| **Fase 0** · diagnóstico | Sólo lectura: 416 líneas de informe con cada afirmación citada por `archivo:línea`. Encontró que B1 se equivocaba al decir que `profiles` no era legible por terceros (`using (true)`), que Realtime estaba publicado y verificado **sin un solo consumidor**, que `salas_abiertas` no filtraba las llenas, y 33 claves de texto que faltaban | — |
| **Fase 1a** · servidor y núcleo | Migración `sal_b2`: `unirse_sala` v5 (cuenta corta de 10 s al llenarse), `salir_sala` v2 (restituye `creada_en + 3 min`), `salas_abiertas` v2 (sin llenas). `salasApi.asientosDe`, `LLENA_SEG`, el núcleo puro `salaEsperaCore` y el hook `useCronometroSala` | lint 21 · **678** pruebas · 66/66 |
| **Fase 1b** · la pantalla | `SalaEspera` real (563 líneas) con Realtime, `leerSala`, stub `partida-pvp`, §12 y §14 del CSS, 30 textos nuevos, 17 estados de arnés con emisor de Realtime sin backend | lint 21 · **682** pruebas · 102/102 |
| **Ajustes** · lo que dijeron los teléfonos | Seis correcciones: `finDe` por quien mira, el mazo mudo con la pantalla apagada, el abanico acompasado, los dos sonidos intercambiados, «Libre» y el botón de salir, dos claves retiradas | lint 21 · **685** pruebas · 102/102 |
| **Cierre** · esta tanda | El barajado cortado a la medida del abanico con cortina, y los ocho atómicos | lint 21 · **685** pruebas · 102/102 |

**La validación con dos teléfonos** (Victor, 11 y 12-sep-2026, túnel + S25 `test1976` + Motorola `ticotest2022`): **E1, E2, E3, E4, E6, E7 y E8 en verde**. Realtime llegó de verdad entre dos teléfonos —llegada, salida y cancelación en vivo, cronómetro sincronizado en ambos—, que es exactamente lo que ningún arnés puede dar. **E5 con defecto**, corregido en la tanda de ajustes (§2.1 de aquel informe). **E9 pendiente**, se corre contra `ajilei.io` tras el despliegue. E7 quedó verde con el enlace pegado directo en Chrome; con el navegador incrustado del correo no sienta al invitado, y eso es deuda de la Portada, no de la sala.

**Lo que la campaña deja funcionando:** un jugador arma una mesa, comparte el enlace, ve llegar a los demás en vivo sin tocar nada, arranca desde dos con «Jugar ya» o espera a que la mesa llena arranque sola en diez segundos, y los tres finales se leen en la misma pantalla — cada uno con el texto que corresponde a **quien mira**.

---

## 5 · Las lecciones, todas salidas de medir

1. **Una fila de estado no guarda quién la escribió.** `resolver_sala` y `salir_sala` escriben la misma palabra, `'cancelada'`, y el anfitrión leía «El anfitrión cerró la mesa» sobre su propia mesa vencida. Un texto que **atribuye una acción** necesita saber quién mira, no sólo qué dice la fila. Si el dato no distingue, lo distingue el lector.
2. **StrictMode invoca dos veces el inicializador de `useState`** y se queda con uno de los dos resultados. Un emisor de pruebas colgado de `window` al *construir* el cliente falso acababa siendo el del cliente descartado, y el arnés emitía eventos que no cambiaban nada. Se cuelga al **suscribir**, que es el momento en que el cliente ya es el que la pantalla usa.
3. **Un `min-height` explícito puede dejar que el grid encoja el ítem por debajo de su contenido** cuando el espacio va justo (medido: 54 px de caja para 64 de contenido). El mínimo que parecía una garantía era el permiso.
4. **Una receta de audio pensada para otra pantalla no se hereda: el gesto manda sobre la cifra.** El recorte del 49 % era de la mesa de juego; aquí dejaba 2 552 ms de sonido sobre un abanico de 900. La salida no fue estirar el dibujo hasta el audio, sino cortar el audio a la medida del gesto.
5. **Y la de proceso, que es la que más caro sale:** el mapa archivo → commit se pega **antes** del primer `git add` y se espera el visto bueno. Esta vez la parada sirvió además para cazar una contradicción de la propia ficha —el informe de cierre no podía contener su propio SHA— antes de tocar `git`, y no después.

---

## 6 · Lo siguiente

1. **Comprobación en `ajilei.io`** tras el despliegue de Cloudflare: que la sala real funciona en producción como funcionó en el túnel.
2. **E7 completa** (compartir por WhatsApp, con el navegador incrustado) y **E9** (el iPhone de Barcelona, invitado sin cuenta, desde `?sala=`). Las dos contra `ajilei.io`, no contra el túnel.
3. La cola sellada: **MOT-1 → MES-PvP → ECO-1**. `PartidaPvP` es hoy un rótulo; MES-PvP lo releva y es quien convierte una mesa `activa` en una partida de verdad.

---

## 7 · Deuda viva que la campaña deja anotada

| Deuda | Dónde vive | Qué haría falta |
|---|---|---|
| El **navegador incrustado** del correo y WhatsApp no sienta al invitado desde `?sala=` | Portada / CUENTA, no la sala | Se decidió que no es de SAL; el debate viene de B1 |
| El **cronómetro late oculto** en `fin`: un `setState` por segundo sobre una pantalla que el jugador abandona con un toque | `useCronometroSala`, intocable en las tres tandas | Un parámetro `activo` en el hook; es una tanda que sí lo abra |
| La **barra superior duplicada** en CSS | estilos de lobby y salas | Unificar en un solo bloque |
| **`inert=""`** en `Lobby.jsx` | `Lobby.jsx` | Atributo booleano mal escrito |
| **`line-height: 145%`** en `index.css` | `index.css` | Porcentaje donde la casa usa número |
| **Keyframes duplicados** de la moneda (`sal-halo-moneda`, `sal-destello-moneda`) | `salas.css` §14 | Se duplicaron con razón medida (F1b §4.3); se resuelven el día que el CSS del lobby y el de salas compartan hoja |
| **`sal.espera.fin.cerraste`** del diccionario v1.6, sin escribir | `textos.es.js` | Sólo haría falta si el anfitrión pudiera quedarse en pantalla tras cerrar |

---

## 8 · Tiempo

La campaña entera, ≈ 4 h 15 min de trabajo medido entre las cinco tandas (Fase 0, F1a, F1b, ajustes y cierre), más la validación con teléfonos de Victor.

**Cierre de SAL-B2.**
