# AJILEI — Menú de Utilidades v1.3

**Estado:** Revisión de especificación. Sustituye a `AJILEI_Menu_Utilidades_v1.2.md`.
**Fecha:** 2026-08-07
**Base de código:** HEAD `995a4db` (DSK-U2). Implementado en la tanda **DSK-U3**.
**Naturaleza:** **Delta sobre la v1.2.** Todo lo que esta revisión no modifique explícitamente
sigue vigente tal como está escrito en la v1.2 y, a través de ella, en la v1.1 y la v1.0:
disparador ⋮, panel flotante `fixed` z:30, apertura abajo-derecha, cierre por tipo de entrada,
panel a solo-iconos, badge contador y su popup, y el circuito completo de Reacciones. Lo que
cambia es que **"Mano actual" deja de ser una entrada inerte y pasa a funcionar**.
**Autoridad visual:** `AJILEI_Sistema_Diseno_v1.2.md`.

---

## 1. Qué cambia — "Mano actual" se vuelve funcional

La v1.1 §3 la especificó entera (qué informa, frontera con lo gratuito, fuente única, economía,
transparencia, integridad del contador) y la dejó **ubicada e inerte**; U1b le puso el badge
contador con su popup, **sin lógica de consumo**. Esta tanda entrega el consumo.

| | v1.2 | **v1.3** |
|---|---|---|
| Entrada | Inerte (`is-disabled` permanente) | **Acción viva** — cierra al ejecutar |
| Badge | Cifra fija en 20 | **Descuenta** al consumir; persiste |
| Valor | — | **Desglose completo de palos** desde la fuente única |
| Disponibilidad | — | **Sólo con decisión viva**; inerte en el resto |

Nada de lo sellado en v1.1 §3 se reabre. Esta revisión **añade las cuatro semánticas** que la
implementación obligó a fijar y que ningún documento anterior nombraba.

---

## 2. Las cuatro semánticas — SELLADAS

### 2.1 Consulta POR MANO, no por press

La unidad que se cobra es **la mano**, no el toque. El **primer press de cada mano** descuenta
exactamente **1**; **cualquier re-press de la misma mano es gratis** y **vuelve a derivar el
valor** — que puede haber cambiado, porque entre un press y otro cabe un descarte. Una **mano
nueva vuelve a cobrar**.

**Identidad de mano:** el **número de mano del marcador** (`game.handCount`, el que pinta
"Mano #N"). Jamás una heurística sobre las cartas: dos manos pueden repartir las mismas cinco.

> **Por qué gratis el re-press.** Lo que se compra es **la foto de esta mano**, y una foto se
> mira más de una vez. Cobrar por toque convertiría una comodidad en un peaje — justo lo que el
> principio ancla de v1.1 §3.4 prohíbe.

### 2.2 Disponibilidad

La entrada está viva **sólo cuando hay una decisión viva**: las cuatro fases `BET_1`, `BET_2`,
`DISCARD`, `BET_3`, con mano repartida (`handCount > 0`) y cartas en mano.

Queda **`is-disabled`** —la lengua de *no habilitado* del sistema, **distinta del `is-off`** de
*apagado-por-ti*— en espera, **durante el reparto** (`DEAL_2`/`DEAL_3`: las cartas están
volando, no hay foto que tomar) y en **showdown, pago y fin de mesa**.

> **Frontera con lo gratuito, verificada.** En fase de pago la banda **"Tu mejor palo"** está
> visible y la entrada está inerte: **no coexisten jamás**. La banda es retrospectiva y gratuita;
> "Mano actual" es la foto completa **mientras la decisión sigue viva**. Es exactamente la
> diferencia que v1.1 §3.2 declaró consumible. **La banda no se toca.**

### 2.3 Saldo agotado (N=0)

Con saldo 0 la entrada **sigue habilitada**: quien no tiene gratis merece que se lo digan, no un
botón muerto sin explicación. El press abre el **popup de agotadas**, **sin valor** y **sin mover
el contador**.

**Excepción que el orden de las guardas garantiza:** quien gastó su **última** gratis en esta
mano **conserva el derecho sobre ella**. La comprobación de *re-press* va **antes** que la de
saldo — ya pagó por esa mano, aunque el saldo haya quedado en cero.

El **cobro en fichas** de v1.1 §3.4 (precio por definir, calibración en la fase de dificultad)
**queda fuera de esta tanda**: aquí sólo se anuncia que las gratis se acabaron.

### 2.4 Persistencia

`ajilei.consultas` en `localStorage`. **Se lee siempre** al montar (inicializando a 20 la primera
vez); **se escribe sólo al consumir**. Con storage denegado el contador vive en memoria y la
cifra mostrada no miente — simplemente no sobrevive al cierre del navegador.

Clave, saldo gratis y los dos autocierres viven en **`src/config/consultas.js`**, **fuente única
que consumen la app Y el arnés** — molde de `config/reacciones.js` (v1.2 §2). El ledger de
Supabase llega con login (v1.1 §3.6) y sigue fuera de alcance.

---

## 3. Las dos superficies y sus cierres

### 3.1 Popup del VALOR — nuevo

**Press de la entrada = ejecutar**: cierra el menú y abre el popup, como sus hermanas Sonido y
Reacciones (v1.1 §1.3.1). Por eso el popup **no puede vivir dentro del panel**: cuando se pinta,
el panel ya se desmontó con su ancla. Es **superficie propia, hermana del área**, anclada al ⋮
por su borde **derecho** — molde de capa de v1.2 §5.2.

- **Contenido:** el **desglose completo de todos los palos** en **valor relativo según las reglas
  vivas**, jamás el nominal impreso (v1.1 §3.1). **Sólo las cartas propias del humano: cero
  información oculta.**
- **Fuente única:** `getBestSuitScore` con el **`ruleN` congelado** del snapshot de la mano
  (`game.handRules`), **jamás un recuento vivo de jugadores** — esa lectura viva es el patrón
  enfermo que HR-1 erradicó. **Prohibida una segunda calculadora** (v1.1 §3.3).
- **El comodín** no cuenta como carta de su palo pero **sí suma al mejor**. La bonificación se
  **declara**, para que la cifra no parezca un error de suma, y se **deriva de la propia salida
  de la fuente** (`points` menos el crudo del mejor palo): no se vuelve a decidir si aplica.
- **Se dice el saldo restante en el mismo acto**: el usuario **jamás descubre el cobro después de
  consultar** (v1.1 §3.5).
- **Cierres:** **autocierre a los 4 s** o **clic en cualquier otra parte**, lo que llegue primero.
  Molde **H4** — `setTimeout` en ref + `pointerdown` en captura, **sin overlay**: un overlay se
  tragaría el primer clic sobre los botones de acción, y esta lectura ocurre **durante la mano**.
- **Capa 31** (`calc(--dsk-u1-panel-z + 1)`), la de sus hermanos: nace del menú y debe pintarse
  sobre él. **Fuera de flujo estricto → Δ=0 de layout por construcción.**

**Copy vigente** (propuesto por la implementación, ajustable en checkpoint sin mover ninguna
puerta — el arnés verifica el valor **cruzado contra los `data-*`**, nunca con regex sobre prosa):

> Tu mejor palo es **Espadas**, 32 pts
> Además: Copas 16 · Oros 10
> Incluye el comodín (+11)
> — Te quedan 18 consultas gratis

> Se acabaron tus consultas gratis
> Pronto podrás pagarlas con fichas.

### 3.2 Popup del CONTADOR — sin un pelo de cambio

El badge conserva **todo** lo sellado en U1b: press → `Tienes N consultas gratis`, **2 s**, y el
**menú SIGUE ABIERTO**. **INVARIANTE:** presionar el badge **no es ejecutar**. Lo único que
cambia es de dónde sale la cifra — ahora del estado compartido, no de un `useState` local que no
podría enterarse del consumo.

---

## 4. Reglas nuevas (aplican a cualquier tanda futura)

### 4.1 El estado que dos superficies comparten sube al hook

`useConsultas` es hermano de `useUtilitiesMenu` y `useReacciones`: **un solo estado, dos
consumidores.** La regla no es estética. El saldo vivía en un `useState` dentro del panel, y el
panel **se desmonta al ejecutar**: cualquier consumo disparado desde fuera lo dejaría mostrando
una cifra vieja. **Cuando una entrada cierra al ejecutar, su estado no puede vivir en el panel.**

### 4.2 Núcleo puro separado, sellado por Vitest

Toda la **decisión** (contador, desbloqueo por mano, N=0, disponibilidad) vive en un módulo
**sin React, sin DOM, sin storage** (`consultasCore.js`). El hook sólo sostiene, persiste y
pinta. Lo que puede ser cierto sin un navegador delante **se prueba sin navegador**: el arnés
queda para lo que sólo existe en la página (Δ=0, capa, autocierres, invariantes de superficie).

### 4.3 El arnés no reutiliza el helper de la app

El modo `u3` verifica el valor **recomponiendo la mano desde el DOM** (el `alt` de cada carta) y
las **reglas desde el chip de comodín** —el hogar visual de `handRules` (C4.5), no el número de
sillas—, corriendo `getBestSuitScore` **en Node** y comparando contra atributos `data-*` del
popup. **Reutilizar el helper de la app escondería un error dentro del propio helper**, y leer la
prosa con expresiones regulares haría que un cambio de copy volviera roja una puerta de valor —
o que una redacción con números sueltos la aprobara por accidente.

---

## 5. Alcance de esta tanda y lo que queda

**Entregado (DSK-U3):** consulta por mano con contador — entrada viva con su disponibilidad,
popup del valor con sus dos cierres, popup de agotadas, persistencia y el badge descontando.

**Fuera de alcance, sin cambios respecto a la v1.1:**

- **Cobro en fichas** tras las 20 gratis: **precio por definir**, se calibra en la fase de
  niveles de dificultad, donde toda la economía se revisa junta (§3.4). Con él llega la
  **confirmación de un toque en el primer cobro de cada sesión** (§3.5).
- **Ledger de Supabase** con login (§3.6). Pre-login sigue siendo `localStorage`, con la
  limitación conocida y aceptada de la Fase 1.
- **"Saldo: visible/oculto"** (§4 de la v1.1) sigue inerte, y con ella la **deuda `is-off`** que
  la v1.2 §1.2 dejó anotada: hoy sólo Sonido tiene apagado real.
- **Respuesta de las IAs a las reacciones** — sigue en **U2b** (v1.2 §6).

---

## 6. Historial de versiones

- **v1.3** — 2026-08-07. **"Mano actual" funcional.** Cuatro semánticas selladas:
  **consulta por mano** (primer press cobra 1, re-press gratis con valor re-derivado, mano nueva
  vuelve a cobrar, identidad = `handCount`), **disponibilidad** (sólo `BET_1/BET_2/DISCARD/BET_3`;
  `is-disabled` en reparto, showdown y pago, donde la banda gratuita toma el relevo), **N=0**
  (entrada viva, popup de agotadas, contador quieto, con el derecho adquirido sobre la mano ya
  pagada) y **persistencia** (leer siempre, escribir al consumir). Popup del valor con el
  desglose completo desde la fuente única y el comodín declarado, dos cierres (4 s / clic fuera,
  molde H4), capa 31, Δ=0. Badge **intacto**, incluido su invariante. Reglas nuevas de alcance
  general: **estado compartido al hook**, **núcleo puro sellado por Vitest** y **el arnés no
  reutiliza el helper de la app**. Implementado en la tanda **DSK-U3**, con modo `u3` permanente
  del arnés (10 puertas × 20 celdas + sub-pasadas de manos, agotadas y relojes) y 16 pruebas
  nuevas de Vitest sobre el núcleo puro.
- **v1.2** — 2026-08-07. La entrada 💬 se redefine como **Reacciones**: selector en grilla 3×4
  con las **12 frases selladas**, burbuja de 3,0 s (0,3/2,4/0,3) anclada **por tinta** al nombre,
  capa 25 (área) / 31 (selector), X de cierre anticipado **solo visual** con hit ≥40 por
  embaldosado B2, y **cooldown de 5 s indiferente a la X**. La clasificación
  imprescindible/narrativa queda **archivada como descartada** (molde *Sugerencias*): los
  mensajes del juego son siempre visibles. Reglas nuevas de alcance general: **anclaje por
  tinta**, **molde de capa hermano-del-área** y **cartas propias inocluibles**. Respuesta de las
  IAs diferida a **U2b**, con factibilidad verificada y cautelas registradas. Implementado en la
  tanda **DSK-U2**, con modo `u2` permanente del arnés (10 puertas × 20 celdas + sub-pasadas de
  ciclo/reloj y `pointer: coarse`).
- **v1.1 · apéndice U1b** — 2026-08-06. Panel a solo-iconos con tooltips, ficha `ChipToken` para
  Saldo y SVG propio de carta con "?" para Mano actual, badge contador con `ajilei.consultas` y
  popup informativo con sus dos cierres.
- **v1.1 · apéndice de implementación** — 2026-08-05. Apertura abajo-derecha uniforme y panel
  `fixed` z:30 sin portal, timer heredado con su razón de diseño, clasificación de mensajes por
  fase+emisor *(descartada en v1.2 §1.1)*, sonido persistente con mute real, estado inerte de las
  otras tres entradas e insumo verificado de "Mano actual".
- **v1.1 · enmienda** — 2026-08-04. Semántica del toggle de Mensajes *(descartada en v1.2 §1.1)*
  y cierre por tipo de entrada.
- **v1.1** — 2026-08-04. Alcance acotado al gate de escritorio; disparador ⋮; panel flotante;
  cuatro entradas; "Mano actual" monetizada; Sugerencias descartada.
- **v1.0** — Preliminar.
