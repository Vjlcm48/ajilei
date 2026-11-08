# AJILEI · MES-PvP · Árbitro v1.3-c (hallazgos del túnel) · Informe · v1.0

**Base:** `145c69d` (v1.3-b) · **Origen:** el túnel del árbitro v1.3 desplegado (S25 y Motorola de 2022; mesas de 2 y de 3), con las decisiones de Victor sobre el diagnóstico.
**Estado:** STOP-C, cinco commits sin push. Sin nube: ni `db push`, ni deploy, ni consultas a la base real. Ningún arreglo pide deploy: todo es cliente.

## Resumen

- **Un solo anillo en la oferta de recarga.** En la mesa de 2, quien decide veía dos relojes seguidos: la pausa y luego los 15 s de la retención. Ahora la capa prevé la retención ya en la pausa y su anillo va hasta el final real. En la pausa de anuncio (mesas de 3 o más) la burbuja va sin anillo.
- **Una recogida por mano.** En el Motorola, las cartas se desvanecían y por un instante volvían a pintarse. El desfase con el reloj del servidor cambia al reclamar el vencimiento, y eso volvía a animar la recogida desde opacidad 1.
- **Sentado fuera con la recarga pedida.** La burbuja se va, el ⋮ lleva su punto y la caja de las acciones dice «Entras en la próxima mano». El segundo toque del túnel devolvió `ya_pedida`, que el cliente toma como éxito. **No hubo doble cobro.**
- **«Entendido» en la tarjeta de saldo insuficiente** (Victor). En la de recarga normal sigue «Ahora no».
- **Los dorsos del pago.** Al ganar un rival sin revelación, sus cartas salían como reversos blancos con el icono de imagen rota. **No es nuevo del v1.3: venía de MES-PvP 2-a** (`18e20ee`, 2026-11-05).
- **El área de «Tú»** (`GameTable.jsx:2884`) queda para la sub-tanda 5, junto con la línea de `GameTable.jsx:2771` (§4).
- **No se tocaron** `GameTable.jsx`, `config/reacciones.js` ni ningún protegido. El CSS solo añade. Contra las IAS no cambia nada.

---

## 1 · Lo hecho

### 1.1 · El anillo único

`resolverOfertas` del árbitro (`src/arbitro/partida.js:355-368`) abre la retención cuando, sin quien decide, menos de 2 jugadores cubren el ante. La vista ya trae lo que hace falta para preverlo: `unit`, y de cada jugador `chips`, `eliminated` y `abandonado`.

| Qué | Dónde |
|---|---|
| `cubrenElAnte`, que cuenta como el árbitro, y `TRAS_LA_PAUSA_MS` = margen del reclamo (300 ms) + oferta (15 s) | `src/lib/entreManosCore.js:68-69` |
| `retendra`: en la pausa, con oferta y menos de 2 que cubren; `retencion`: la que se ve venir o la que ya corre | `src/lib/entreManosCore.js:96-97` |
| `vence` es el final del anillo y `finPausa` el de la pausa | `src/lib/entreManosCore.js:106-107` |
| `anillo: false` en la pausa de anuncio | `src/lib/entreManosCore.js:111` |
| `totalSeg` con retención: 18 s con revelación y 20 s sin ella | `src/lib/entreManosCore.js:112` |
| La cuenta no sube cuando llega la hora real de la retención (cae unos rtt/2 después de la prevista) | `src/screens/RecargaPvP.jsx:88`, `:133-137` |
| `data-anillo` en la burbuja y la regla que esconde el anillo | `src/screens/RecargaPvP.jsx:180`, `src/styles/pvp.css:245` |

### 1.2 · Una recogida por mano

| Qué | Dónde |
|---|---|
| El efecto de la recogida sale si ya animó en esta mano | `src/components/TransicionMano.jsx:43` |

### 1.3 · Sentado fuera con la recarga pedida, y «Entendido»

| Qué | Dónde |
|---|---|
| La burbuja no se pinta con la recarga pedida | `src/screens/RecargaPvP.jsx:138` |
| `entra`: sentado fuera, con la recarga pedida y en las rondas de apuesta; pone `data-pvp-entra` en la mesa | `src/screens/RecargaPvP.jsx:111-117` |
| `lugarDeLaCaja`: el centro de la caja de la mesa, y un ancho máximo que no se sale de la zona del jugador | `src/screens/RecargaPvP.jsx:64-71` |
| La frase de la mesa se oculta sin mover nada, y la capa pinta encima la suya con la letra de la mesa (`.thinking`) | `src/styles/pvp.css:249-254` |
| Los textos `pvp.asiento.entra` y `pvp.recarga.entendido` | `src/config/textos.pvp.es.js:53`, `:58` |
| «Entendido» si el saldo no alcanza; «Ahora no» si alcanza | `src/screens/RecargaPvP.jsx:215` |

**El segundo toque.** Con la recarga pedida, la burbuja seguía ahí. Su botón llama a `recargar`, y el árbitro contesta `ya_pedida` (`src/arbitro/partida.js:516`). El cliente lo toma como éxito: cierra la tarjeta y relee el saldo.

**No hubo doble cobro, por dos razones:**
- `pedida` es un booleano y la recarga se aplica una sola vez, al cerrarse la mano (`resolverPedidos`).
- La clave `recarga_pvp:<sala>:<uid>:<mano>` es idempotente en SQL.

**La alternativa limpia** para la frase de «Fuera de esta mano» es una línea en `GameTable.jsx:2771`. Va a la sub-tanda 5, con su control de las IAS.

### 1.4 · Los dorsos del pago

**De dónde viene:**
- La vista manda la mano no revelada como `{ dorso: true }` (`src/lib/vistaAMesa.js:43`, `:101`).
- En el pago, la mesa pinta de cara la mano de todo rival que no se retiró: `faceDown` en `GameTable.jsx:2063` y `seatShowsFace` en `:1889-1894`.
- `CardImage` recibe una carta sin palo ni valor, y su `src` queda `undefined` (`src/components/CardImage.jsx:23-25`).

No es propio del abandono: pasa en cualquier pago de un rival que ganó sin revelación. En el túnel, el caso probable es que quien abandonó en la pausa había ganado la mano por retirada.

| Qué | Dónde |
|---|---|
| `PlayingCard` pinta el reverso cuando `card?.dorso`. Ninguna carta de las IAS lo lleva | `src/components/PlayingCard.jsx:10` |

### 1.5 · Pruebas nuevas

| Prueba | Dónde |
|---|---|
| Retención en la mesa de 2 (18 s y 20 s, continuidad en `oferta_recarga`), mesas de 3 con abandonado, con eliminado y con 99 frente a 100 de pila; quien espera sigue en 15; pausa de anuncio sin anillo | `src/lib/entreManosCore.test.js` |
| La retención que prevé la capa es la que abre el árbitro al vencer la pausa (mesa de 2 sí, mesa de 3 no) | `src/dev/partidaImitada.test.js` |
| Sentado fuera, dos «Recargar»: el segundo es `ya_pedida` y se cobran 1.500 una sola vez (saldo de 2.400 a 900) | `src/dev/partidaImitada.test.js` |

---

## 2 · Las varas y sus controles rojos

### 2.1 · Controles rojos

En cada control se quita el arreglo, se mide con la misma sonda en el navegador sobre el imitado y se restaura.

| Arreglo | Sin el arreglo | Con el arreglo |
|---|---|---|
| Anillo único | Mesa de 2 en vivo: dos anillos, 2 → 1 y luego 15 (1 subida). Es lo que vio Victor | Uno solo, de 18 a 1, 0 subidas y trazo continuo. Mesa de 3: 2 → 0 |
| Una recogida | Con desfase +400 ms y las cartas a 0,84, vuelven a **1,00** a los 20 ms (412×915 y 1366×768) | Siguen bajando, 0,81 → 0,09. Sin mover el desfase, bajan igual |
| Sentado fuera | Pedida: la burbuja sigue y la caja dice «Fuera de esta mano» (12/12 celdas) | Sin burbuja, con punto en el ⋮ y «Entras en la próxima mano» (12/12) |
| Dorsos | 2 imágenes rotas por celda (mesas de 2, 3 y 5 × 412×915 y 1366×768) | 0 rotas, con reversos de verdad |

**Sin control en el navegador:** la burbuja sin anillo en la pausa de anuncio. El imitado no tiene una escena de quiebra en una mano de anuncio. La cubren la prueba unitaria y la regla CSS.

### 2.2 · Medidas

**«Entras en la próxima mano».** Se midió en 12 celdas: 360×640, 412×915, 915×412 y 1366×768, cada una con mesas de 3, 4 y 5. En todas:
- la frase queda centrada en la caja que tapa (Δ centro 0–0,1 px);
- queda dentro de la zona del jugador;
- no se solapa con las cartas, la pila ni el nombre;
- usa la misma letra que la mesa (itálica, 13 px).

En 360×640 ocupa 167,9 px y queda dentro de la zona (21–339). En 915×412 la caja mide 150 px y la frase se parte en dos líneas de 140 px.

**«Entendido».** Se midió en 360×640, 412×915, 915×412 y 1366×768, con mesas de 2 y 5:
- una línea, sin desbordar;
- el texto queda dentro del botón, el botón dentro de la tarjeta y la tarjeta dentro de la vista;
- en 360×640 el botón mide 84,7×28 y el texto 58,7 px.

La tarjeta de recarga normal sigue diciendo «Ahora no», con el botón de 78,7×36, en las mismas celdas. La excepción es 915×412 con la oferta: la sonda no llegó a abrir la tarjeta, pero esa celda se cubrió con la voluntaria. Con ninguna de las dos tarjetas hubo errores de página.

### 2.3 · Varas (árbol final, antes del primer `git add`)

| Vara | Resultado | Tiempo |
|---|---|---|
| eslint | 0 errores, 0 avisos | 7 s |
| vitest | 108 archivos, 2.897 pruebas, 0 fallidas | 8 s |
| `diagDSK pvp`, corrido directo | 20/20 celdas, 62/62 escenas, 91/91 varas (incluida `v13·recarga-vista`), aislamiento verde, código 0 | 11 min 06 s |
| `congelado` (IAS) | Código 0 | 1 min 49 s |
| `rec` (IAS) | Código 0 | 15 min 14 s |
| `apu.360x640` (IAS) | Código 0 | 5 min 04 s |
| `rev` (IAS) | Código 0 | 3 min 51 s |
| Del clic en «Siguiente mano» al barajado (IAS, sonda propia) | Mesa de 2 a 412×915: 390–401 ms (la L-M 3 midió 390). Mesa de 5 a 1366×768: 398–426 ms. Una recogida por mano, 0 errores | ~1 min |

**Por qué estos modos de las IAS:**
- `congelado`, `rec` y `apu.360x640` pasan por «Siguiente mano», que es donde corre la recogida de `TransicionMano`.
- `rev` se corrió por prudencia, porque `PlayingCard` también cambió.
- La medida del clic al barajado no es un modo de `diagDSK`: en la L-M 3 se tomó a mano, y aquí se repitió con una sonda.

**`diagDSK pvp` ya no cabe en el tope de 10 min del orquestador.** Con `npm run varas -- --solo pvp` se cortó al empezar las varas del v1.3, con la L-M 3 ya entera en OK. Corrido directo, salió verde. Queda anotado para la higiene del arnés.

**«Entendido» llegó después de esas varas.** Es una clave de texto y un ternario en `RecargaPvP.jsx:215`. Lo cubren su sonda (§2.2), eslint sobre los dos archivos y el aislado del commit c.

---

## 3 · Commits

El commit a lleva versiones intermedias de `RecargaPvP.jsx`, `pvp.css` y `partidaImitada.test.js`, metidas en el índice por `cacheinfo`. Son tres archivos que el anillo comparte con el arreglo de «sentado fuera». El c los completa.

| # | SHA | Título | `npm run aislado -- --perfil=commit` |
|---|---|---|---|
| a | `a5553a6` | MES-PvP v1.3c-a · un solo anillo en la oferta de recarga | Verde · 806,8 s · 2.896 pruebas · eslint 0 · 1.8b y humo en 0 |
| b | `f7543c4` | MES-PvP v1.3c-b · una recogida por mano | Verde · 801,6 s · 2.896 pruebas · eslint 0 · 1.8b y humo en 0 |
| c | `732bcb9` | MES-PvP v1.3c-c · sentado fuera con la recarga pedida | Verde · 804,8 s · 2.897 pruebas · eslint 0 · 1.8b y humo en 0 |
| d | `6f3230d` | MES-PvP v1.3c-d · los dorsos del pago sin imagen rota | Verde · 814,1 s · 2.897 pruebas · eslint 0 · 1.8b y humo en 0 |
| e | este | MES-PvP v1.3c-e · informe | Solo este documento; su aislado va en el STOP-C |

`laminas/` queda fuera. Tras el commit d, el árbol es idéntico al probado: los 8 archivos coinciden, por `git hash-object`, con la huella guardada al congelar el árbol.

---

## 4 · Lo que queda para la sub-tanda 5

- **El área de «Tú» en la mesa de 2 en vertical** (`GameTable.jsx:2884`), con su control de las IAS.
- **«Entras en la próxima mano» desde la mesa** (`GameTable.jsx:2771`), en vez de la capa que tapa la frase. Con su control de las IAS.
- **`diagDSK pvp` dentro del tope del orquestador:** partirlo o subir su tope.
- Lo que ya estaba en el informe del v1.3-b, §5: la reposición, la mudanza de las `D_*`, su deploy, el arranque y `OFERTA_RECARGA_MS`, que sigue provisional.
