# AJILEI — Victory Celebration v1.1 · La campaña CEL

- **Archivo:** `docs/AJILEI_Victory_Celebration_v1.1.md`
- **Estado:** especificación sellada e implementada. **Delta sobre la v1.0**, que
  NO se toca: aquel archivo sigue siendo la autoridad de todo lo que no aparezca
  aquí, y sus §§1–6 y 8–9 se leen tal cual.
- **Fecha:** 2026-08-25 · sellado al cierre de **CEL-3**.
- **Base de código:** HEAD `3fbfcb6` (CEL-2h), con los ocho commits de CEL-2
  validados en vivo por Victor y en `origin/main`.
- **Campaña cubierta:** CEL-0 (diagnóstico) · CEL-A (taller de audio) · CEL-1
  (la pantalla) · CEL-2, 2c, 2e, 2g (la coreografía).
- **Autoridad visual:** `AJILEI_Sistema_Diseno_v1.2.md`.
- **Documentos relacionados:** `AJILEI_Fuentes_Audio_Celebracion_v1.0.md` (de
  dónde sale cada melodía y con qué receta se cortó) ·
  `AJILEI_Modos_y_Asistencia_v1.0.md` §6.1 (la tabla de puntos) ·
  `AJILEI_Protegidos_v1.0.md` (los cinco archivos que no se abren).

> **Por qué un archivo nuevo y no una enmienda dentro.** La v1.0 lleva sus
> versiones dentro (§10) y así seguirá para lo suyo. Pero la campaña CEL no
> enmienda aquella especificación: **estrena una pantalla entera** que aquélla no
> describía, con su audio, su arco temporal y sus decisiones tomadas de oído.
> Meterlo dentro habría convertido un documento legible en un archivo de dos
> historias. Aquí está la segunda; la primera se cita por §.

---

## 1. Qué cambia respecto de la v1.0, en un párrafo

En la v1.0 la **victoria de mesa** compartía pantalla con la derrota:
`.game-over-screen`, un mensaje y un botón. CEL-1 la separó en pantalla propia
(`PantallaVictoria`, clases `cel-*`, hoja `celebracion.css`) con la tarjeta de
resumen, la frase del ganador y la lámina de marca. CEL-A le dio música. CEL-2 y
sus tandas le dieron **tiempo**: la pantalla ya no aparece hecha, se cuenta.

**La derrota no estrena nada.** Las dos ramas son excluyentes y la de derrota no
hereda ni una regla de la hoja nueva. Es deliberado: la frase y la lámina son del
ganador.

---

## 2. §7.2 de la v1.0, corregido

Aquella sección terminaba diciendo: *«`win.mp3` queda en el repositorio sin uso.
Borrarlo es otra tanda.»* **Esa tanda fue CEL-A.**

**Estado verificado hoy, sobre HEAD `3fbfcb6`:**

| Comprobación | Resultado |
|---|---|
| `play('win')` en `src/` | **0 apariciones** |
| Entrada `win:` en el registro de `useSounds.js` | **no existe** |
| `public/sounds/win.mp3` | **no existe** |
| Menciones restantes de la cadena `win.mp3` | **6**, ninguna un disparo: 5 comentarios (`GameTable.jsx:691`, `diagCEL0.mjs:36`, `diagDSK.mjs:157` y `:6835`, `_vc2audio.mjs:12`) y **1 línea de código** —`diagDSK.mjs:6837`— que es la aserción de que **no** suena |

Las menciones del arnés no son deuda: son un **control negativo**. Un día alguien
podría reintroducir la fanfarria por costumbre, y esas dos puertas se encenderían.

**`ajilei-strum.mp3` sigue VIVO y no se toca**: es el rasgueo de la mano perfecta
(`sonidoDe('ajilei')` → `ajileiStrum`, `celebracionCore.js:101`), con su recorte
en reproducción de §7.1 intacto. Confundirlos sería jubilar el momento héroe.

---

## 3. La bolsa de melodías

Siete assets, uno por partida ganada, sorteados sin repetir el anterior.

| Qué | Valor |
|---|---|
| Assets | `celebracion-{joropo,gaita,latinjazz,percusion,solemne,brillante,fiesta}-01`, en `.mp3` y `.ogg` |
| Receta de corte | t = 0 → **12,000 s** · fade-in 10 ms · fade-out desde **9,5 s** · **−20,0 LUFS** integrados (la sonoridad del `table-knock`) · techo −1,5 dBTP · mp3 44,1 kHz estéreo **256 kb/s** · ogg `-q:a 5` |
| Volumen de reproducción | **0,6** — el mismo del `table-knock`, y por la misma razón: es un fondo, no un anuncio |
| Carga | **perezosa**, al montar la pantalla. Las siete pesan 4,16 MB entre los dos formatos; cargarlas al arrancar el juego sería pagar la fiesta en cada partida que se pierde |
| Sorteo | `eligeSinRepetir(7, ultima)` — nunca dos veces seguidas la misma |
| Licencia | Pixabay Content License, las siete, con autor e ID de pista anotados |

La contabilidad completa —autor, ID, LUFS y peso de cada corte— vive en
`AJILEI_Fuentes_Audio_Celebracion_v1.0.md`, que es su documento y no se duplica
aquí.

### 3.1 El sorteo, fuera del inicializador

`eligeSinRepetir` es común a las melodías y a las frases (`config/sinRepetir.js`),
y las dos siguen la misma regla, que costó un defecto encontrar:

> **Sortear no es recordar.** El inicializador de `useState` se invoca **dos
> veces** en desarrollo (StrictMode). Si el sorteo escribiera la memoria del "no
> repitas", la escribiría dos veces y con dos resultados distintos, y lo
> recordado no sería lo que se vio. Por eso `melodiaPara`/`frasePara` **sólo
> devuelven** `{indice, …}`, y `recuerdaMelodia`/`recuerdaFrase` se llaman desde
> un efecto, con el índice que de verdad se pintó.

El arnés lo comprueba de la única forma que vale: leyendo la frase **de la
pantalla** y comparándola con la que quedó en memoria. Seis de seis.

---

## 4. La coreografía sellada

El arco, de principio a fin. Cada flecha es un **encadenamiento**, no un
cronómetro: donde hay un sonido que oír, manda el `end` de ese sonido y el
temporizador es sólo la **red**.

```
  sobria  ─ silencio ─▶ toc-toc ─(end)─▶ REVIENTA ─▶ premio ─▶ traspaso ─▶
  saldo ─▶ asentamiento ─▶ cascada de rubros ─(fin de melodía)─▶ calma ─▶ reposo
```

### 4.1 Fase por fase

| Fase / tramo | Qué se ve | Qué la termina |
|---|---|---|
| **sobria** | La tarjeta entera, quieta. Premio en **0**; **"Saldo actual" ya con su cifra de entrada**; los cuatro rubros con su **sitio reservado** pero invisibles; el resplandor de marca **pausado** | Que suene el toc-toc |
| *silencio* | Nada. **1,24 s** medidos tras el último nudillo | — |
| **revienta** | Melodía + lluvia de Heptacoins + resplandor + frase, todo en el mismo fotograma | — |
| **premio** | Las netas cuentan de 0 a su cifra, ×2 | Su propio reloj |
| **traspaso** | **Una** moneda en miniatura vuela de la fila del premio a la del saldo (520 ms) | Su **aterrizaje** (`transitionend`), no un temporizador |
| **saldo** | "Saldo actual" cuenta de la cifra de entrada a la final, ×2 | Su propio reloj |
| **asentamiento** | Un pulso y un destello sobre la cifra. **Un solo disparo** | 520 ms |
| **cascada** | Los cuatro rubros entran escalonados a **250 ms**, "Tu mejor mano" al final | 1.130 ms |
| **calma** | La lluvia deja de emitir y las gotas vivas terminan su caída | El `end` de la melodía, con tope propio de 15 s |
| **reposo** | La pantalla en su estado final, quieta | — |

### 4.2 Los tiempos, medidos en CEL-2g

Milisegundos desde que monta la pantalla, celda de 360×640 sin capturas:

| Hito | Pedido | Medido |
|---|---|---|
| fiesta (revienta) | — | 1.900 |
| fin del premio | 2.800 | **2.805** |
| aterrizaje de la moneda | 520 | **562** |
| fin del saldo | 2.933 | **2.944** |
| cascada completa | 1.130 | **1.137** |
| **relato completo** | — | **8.004** |
| reposo | — | 16.000 |

Las cinco celdas medidas (escritorio 1920×1080, móvil 360×640 y 640×360, sin
capturas, y con el sonido apagado) coinciden dentro de ±20 ms, **salvo la de
1920**, que sale inflada porque el arnés congela su propio hilo de render al
capturar. Eso es la sonda, no la pantalla: véase §8.2.

### 4.3 La prueba que de verdad importa

La lluvia dura lo que la melodía: **12 s**. Todo el relato de los números va
**dentro**. Si un día no cupiera, la cascada empezaría sobre una pantalla ya
apagada — y eso no se ve en una corrida buena, se ve en la peor. Por eso está
sellado en Vitest sobre el **peor caso aritmético posible** (los dos conteos en su
techo):

```
  3.600 (premio) + 520 (traspaso) + 3.600 (saldo) + 520 (asiento) + 1.130 (cascada)
= 9.370 ms  <  12.000 ms
```

**2.630 ms de margen.** Si alguien sube un conteo o alarga el vuelo, el test cae
antes que la pantalla.

### 4.4 Por qué el encadenamiento y no el reloj

`esperaPrecedente` (VC2) espera al `end` del sonido que precede, con tope de 3 s.
CEL-2 añade dos parientes con el mismo principio y topes propios:
`esperaRevienta` (el toc-toc, con **1.896 ms** nominales medidos del archivo como
red) y `esperaFinMelodia` (la melodía, tope **15 s**). La regla, en una línea:
**donde hay algo que oír, el sonido manda; el temporizador existe para que un
audio que nunca cargó no deje la pantalla congelada.**

---

## 5. Decisiones selladas en vivo por Victor

Cada una con su derogación, si la hubo. Están aquí porque son de **oído**: no se
deducen de ningún principio y quien las lea dentro de un año no las reconstruiría.

| # | Decisión | Deroga |
|---|---|---|
| 1 | **La lluvia dura lo que la melodía** (12 s), no lo que el contador | «la calma llega con el fin del conteo» (CEL-2) |
| 2 | **"Saldo actual" arranca en su cifra de entrada**, visible desde el primer fotograma, y sólo se mueve cuando le toca | «el saldo arranca en 0» (CEL-2c) — la puerta del arnés no desapareció, se **invirtió** |
| 3 | **El suspenso de 1,24 s** tras el último nudillo **se queda** | — |
| 4 | **Caída ×1,4**, con la cadencia de emisión escalada por el mismo factor y techo de **18 gotas vivas** | — |
| 5 | **Opacidad de gota 0,55–0,7** | «hasta 1,0» (CEL-2) |
| 6 | **Moneda +25 %**: 70 px en escritorio, 60 en las dos pieles de móvil | — |
| 7 | **Brillo con el período de EMB-1 leído en vivo**, desfasado **medio ciclo** | — |
| 8 | **Cabecera limpia en GAME_OVER**: sin ⋮ y sin wordmark pequeño. La ✕ y el rótulo de mano se quedan | — |
| 9 | **Botones en fila** en móvil horizontal, con el ranking como **secundario de borde** (estilo aplicado también en vertical y escritorio) | — |
| 10 | **"Próximamente" bajo demanda**: 3 s, o hasta el segundo toque | — |
| 11 | **Tarjeta a dos columnas** en móvil horizontal | — |
| 12 | **Banco de 8 frases**, sorteo fuera del inicializador | — |
| 13 | **Silencio de reacciones** en toda la pantalla terminal | — |

### 5.1 El suspenso, y su remedio nombrado

`table-knock.mp3` mide **1,896 s** y trae **dos** golpes; el segundo termina
mucho antes que el archivo. Encadenar por `end` significa, por tanto, **1,24 s de
silencio** entre el último nudillo y la explosión.

Victor lo escuchó y lo selló **como suspenso**, no como defecto. Queda escrito el
remedio por si algún día cambia de opinión: **recortar la cola al reproducir**,
con el molde que la casa ya tiene dos veces —`ajileiStrum` (v1.0 §7.1) y
`cardShuffle`—, sin tocar el archivo licenciado.

### 5.2 La lluvia, cuando se frena

Ralentizar la caída un 40 % sin tocar nada más **duplicaría la densidad**: las
gotas viven más y se acumulan. Por eso `CAIDA_FACTOR = 1.4` escala **las dos**
cosas a la vez —la caída (1.100→**1.540** ms, 1.500→**2.100**) y la cadencia de
emisión (90→**126** ms)—, y el techo de 18 gotas vivas es un tope duro sobre las
**vivas**, no sobre las nacidas. La densidad es la misma; sólo el tiempo cambia.

### 5.3 El brillo que no se descalibra

La moneda de la tarjeta brilla con el **mismo período** que el rótulo de marca de
EMB-1, **leído del CSSOM en vivo** (`getComputedStyle(...).animationDuration`) y
publicado como `--cel-moneda-ciclo`, con `--cel-moneda-desfase` a medio ciclo. No
es un 4 s copiado: si mañana alguien recalibra EMB-1, la moneda le sigue sola y el
turno alterno se conserva. Medido: ciclo 4 s, desfase 2 s.

---

## 6. Los datos que la tarjeta pinta

### 6.1 "Saldo actual" = `human.chips`, jamás una fórmula

La tentación era `5000 + 5000 × rivales`: el ganador se lo lleva todo. **Está
descartada**, y no por prudencia abstracta — por aritmética. Un jugador queda
eliminado cuando **no puede pagar el ante** (`gameEngine.js:376`, `p.chips < unit`),
y se lleva a la tumba el residuo que no alcanzaba. Ese residuo es `5000 mod unit`
y **no siempre es cero**:

| Nivel | Apuestas | `5000 mod unit` |
|---|---|---|
| Básico | 50 · 100 · 150 · 250 | 0 · 0 · **50** · 0 |
| Avanzado | 100 · 200 · 300 · 500 | 0 · 0 · **200** · 0 |
| Pro | 200 · 400 · 600 · 1000 | 0 · **200** · **200** · 0 |

En cuatro de las doce mesas la fórmula **mentiría** por hasta 200 Heptacoins por
rival caído, y mentiría en silencio. El estado dice la verdad siempre. Coinciden
hoy en la mayoría de las mesas, que es exactamente lo que hace peligrosa a la
fórmula: parece correcta hasta el día que no lo es.

**Corolario de CEL-2g:** la cifra de entrada del conteo tampoco se importa de
ninguna configuración — se **deriva** de las dos que la tarjeta ya recibe
(`entrada = saldo − netas`, porque `netas = chips − saldoInicial`). Una fuente
menos que pueda desincronizarse.

### 6.2 "Puntos obtenidos" = `manosGanadas × puntosDe(nivel)`

La tabla plana de `Modos_y_Asistencia_v1.0.md` §6.1: Básico 1 · Avanzado 2 ·
Pro 3. **Plano** es la palabra del rector: no hay componente de mesa, ganarle a
cuatro IAs de Básico vale lo mismo que a una. Contra máquinas se puntúa **a qué**
máquina.

La tabla de §6.2 —vs humanos, `ruleN + 3`— no vive en `config/niveles.js` a
propósito, y esta pantalla no la anticipa.

### 6.3 Sin persistencia hasta ECO-1

Los acumulados de sesión mueren con la sesión (v1.0 §5). La línea de ranking
existe en la fila, **desactivada**, con "Próximamente" bajo demanda: cuando ECO-1
encienda la persistencia, la línea se enciende de verdad **sin rediseñar la
pantalla**. Ése era el punto de ponerla ya.

---

## 7. Límites y deudas escritas

1. **El molde `?cel` gana la mesa sin ganarle un céntimo a nadie.** Las netas son
   0 y el saldo va de 5.000 a 5.000: los dos conteos **corren** —sus relojes están
   medidos— pero no hay nada que ver moverse en las cifras. Para una audición con
   cifras vividas, `?cel=<n>`, que deja jugar `n` manos antes de ganar. Las puertas
   del arnés miran por eso el **tramo**, el vuelo y la cascada, no el número
   subiendo.
2. **Desfase de 5,14 px** del pie de la burbuja en escritorio, heredado de U2c.
   Documentado y **no corregido a propósito**: sigue como deuda escrita hasta que
   Victor decida su campaña.
3. **La derrota no estrena nada.** Ver §1.
4. **Letra muerta consciente**, en dos sitios:
   - `.vc-tarjeta`, `.vc-netas*` y `.vc-detalle` en `gameTable.css:395` y
     siguientes, que es **archivo protegido**. CEL-1 dejó de usarlas al mudarse a
     `celebracion.css`. **Cuidado al limpiarlas el día que ese archivo se abra:**
     `.game-over-screen`, `.game-over-msg` y `.vc-ajilei` **siguen vivas** — las
     dos primeras las usa la derrota, la tercera la lámina de AJILEI.
   - Las **cuatro cadenas visibles** del motor que REN-1 no pudo renombrar porque
     `gameEngine.js` es protegido: `Apuestas ${amount} fichas.` (:319),
     `'¡Ganaste la mesa! Eres el último con fichas.'` (:395),
     `` `… gana la mesa. Te quedaste sin fichas.` `` (:396) y
     `'Te quedaste sin fichas.'` (:404). **Ninguna se pinta**: el óvalo compone la
     crónica (`cronicaCore.js`) y la pantalla terminal compone el resultado. Son
     letra muerta, pero letra muerta que dice "fichas" donde la app dice
     "Heptacoins", y el día que los protegidos se abran hay que barrerlas.
5. **El bug de mesa 2 de la v1.0 §9 sigue en pie**, sin tocar y sin agravarse por
   esta campaña.

---

## 8. Salvaguardas

Las cinco que hacen que el arco sea una decoración y no un requisito:

1. **El toque salta al final.** Un toque en cualquier punto lleva la pantalla a su
   estado de reposo: todas las cifras puestas, los cuatro rubros dentro, la lluvia
   apagada. **Y no enciende el pulso del asentamiento**, que es una celebración de
   propina y no tiene sentido para quien acaba de decir "ya".
2. **`prefers-reduced-motion` completo.** Sin lluvia, sin vuelo, sin cascada: las
   cifras y los rubros están puestos desde el primer fotograma. No es la
   coreografía "rápida", es la pantalla **sin** coreografía.
3. **Pausa con la pestaña oculta.** El acotado del delta del contador —el mismo
   que hace que la cuenta no salte al volver— congela el relato mientras nadie
   mira, y las animaciones CSS se pausan con `animation-play-state` en vez de
   desmontarse.
4. **El botón de salir responde desde el primer fotograma.** Ninguna fase lo
   bloquea, ni siquiera la sobria.
5. **El arco visual corre aunque la melodía no cargue.** Los topes propios de cada
   espera (`ANCLA_TOPE_MS` 500 · toc-toc 1.896 · `FIESTA_TOPE_MS` 15.000) están ahí
   para eso: sin red, un audio que no llega dejaría la pantalla en sobria para
   siempre.

### 8.1 El único control que el arnés no puede automatizar

El **sonido**. Las nueve celdas del modo `celebracion` miden geometría, tiempos y
estados del DOM; que la melodía suene **bien** lo valida Victor en vivo, y las
cuatro tandas de CEL-2 se cerraron con esa audición. Está escrito aquí para que
nadie confunda "el arnés está verde" con "la fiesta funciona".

### 8.2 Dos lecciones de medición, para la próxima campaña

- **`page.screenshot` congela el hilo de render.** Infla los tiempos de fotograma,
  las duraciones de conteo y la separación entre `animationstart`. Se resuelve con
  celdas **sin captura** para las medidas de reloj, y midiendo lo demás por
  **CSSOM** (`animation-delay` resuelto), que no depende de cuándo mire la sonda.
- **Dos fuentes independientes, y una contradicción es un hallazgo.** Las marcas
  en página y los observadores del DOM discrepaban en el recuento de gotas: el
  observador no contaba las que nacían **dentro** de una capa recién añadida. La
  discrepancia era el defecto, no el ruido.

---

## 9. Historial de la campaña CEL

| Tanda | Qué dejó |
|---|---|
| **CEL-0** | Diagnóstico read-only de la pantalla terminal y nacimiento del arnés `celebracion` |
| **CEL-A** | Taller de audio: las siete melodías cortadas y licenciadas; `win.mp3` retirado del registro y del disco; `public/sounds/` de 23,22 a 4,67 MB |
| **CEL-1** | La pantalla propia (`PantallaVictoria`, hoja `celebracion.css`), la tarjeta de resumen, el banco de 8 frases, la tarjeta a dos columnas en móvil horizontal |
| **CEL-2** | La coreografía: cuatro fases, encadenamiento por sonido, la bolsa de melodías, la lluvia de Heptacoins, las cuatro salvaguardas |
| **CEL-2c** | Lluvia durante toda la melodía · caída ×1,4 · opacidad ≤0,7 · el sorteo de frases fuera del inicializador |
| **CEL-2e** | Cabecera limpia · botones en fila con ranking secundario · moneda +25 % · brillo con el período de EMB-1 |
| **CEL-2g** | El relato de los números: premio ×2 → traspaso con vuelo → saldo ×2 → asentamiento → cascada de cuatro rubros |
| **CEL-3** | Este documento |

**Cifras al cierre:** 457 pruebas de Vitest en 16 archivos · arnés `celebracion`
con **6 celdas de arco** (escritorio, dos de móvil, una sin capturas, una muda y
una de movimiento reducido) sobre las 5 de geometría de CEL-1, **5 puertas**
—menú, melodías, frases, ranking, salto— y su control negativo · **cero**
modificaciones en los cinco archivos protegidos en toda la campaña.

---

## 10. Fuera de alcance

**ECO-1** (persistencia y economía) · el **ranking** de verdad · **PvP** · el
desfase de 5,14 px · la limpieza de la letra muerta de §7.4, que espera a que los
protegidos se abran.
