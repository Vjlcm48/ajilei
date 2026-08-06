# AJILEI — Menú de Utilidades v1.1

**Estado:** Revisión de especificación. Sustituye a `AJILEI_Menu_Utilidades_v1.0.md`.
**Fecha:** 2026-08-04
**Base de código:** HEAD `57f0939` (DSK-A2). Documento sin implementación asociada — doc-only.
**Naturaleza:** **Delta sobre la v1.0.** Todo lo que esta revisión no modifique explícitamente
sigue vigente tal como está escrito en la v1.0 (justificación, reserva del badge de
notificación, despliegue por escenario pendiente, reglas de sistema, estado de los no
habilitados). Lo heredado se recoge en la sección 6 para evitar consultar dos documentos.
**Autoridad visual:** `AJILEI_Sistema_Diseno_v1.2.md` — single-gold estricto, regla de los
2 segundos por entrada, hover como afordancia en escritorio (lenguaje Z1).

---

## 1. Alcance y disparador

### 1.1 Alcance de esta versión

**Solo gate de escritorio:** `@media (orientation: landscape) and (min-height: 601px)`.

Móvil está **sellado** y conserva su botón de bocina tal cual: ni un cambio de glifo, de caja
ni de comportamiento. El menú llegará a móvil en ciclo propio, **si llega** — no está
comprometido en esta hoja de ruta.

### 1.2 Disparador

El disparador es **⋮** (tres puntos verticales) y ocupa **exactamente la caja del botón de
sonido actual** — mismo footprint, misma posición.

**Δ=0 por construcción:** en la barra solo cambia el glifo. Ningún otro elemento se mueve, ni
un píxel.

El control de sonido **no desaparece**: se muda adentro como primera entrada del menú.

### 1.3 Panel

- **Flotante y fuera de flujo** — doctrina de la banda A2: superponerse, jamás empujar.
- Pinta **por encima de todo** — incluido el sobrevuelo Z1 y los paneles revelados `z:7`.
  La cadena de apilamiento exacta la determinará el diagnóstico (sección 5).
- **Cierre:** clic fuera, `Esc`, o al ejecutar una entrada — con la distinción de 1.3.1.

#### 1.3.1 Cierre por tipo de entrada (enmienda 2026-08-04)

El cierre no es uniforme: depende de si la entrada **conmuta** o **informa**.

- **Toggles** (Sonido, Mensajes, Saldo: visible/oculto) — **cierran al ejecutar**. El efecto es
  inmediato y visible en la mesa; el panel no tiene nada más que decir.
- **"Mano actual"** — al ejecutar, **muestra su desglose** y el panel permanece abierto el
  tiempo de leerlo: **autocierre de lectura ~4–5 s**, o **cierre por clic fuera / `Esc`**, lo
  que llegue primero. Es una entrada que informa: cerrar de inmediato destruiría lo que el
  usuario acaba de pagar. La ventana de lectura respeta la regla de los 2 segundos por entrada
  del sistema de diseño (la lectura completa cabe con margen).

> **Supersesión explícita, enmendada:** este cierre reemplaza al protocolo de la v1.0 §4 ("la
> bandeja permanece abierta tras usar una opción; autocierre a ~3s sin interacción"). El
> autocierre por inactividad queda derogado **como regla general** —los toggles cierran al
> ejecutar— pero **sobrevive acotado** en "Mano actual" como **autocierre de lectura**: único
> heredero legítimo de la v1.0 §4, y solo ahí.

---

## 2. Las cuatro entradas

Orden del panel:

| # | Entrada | Tipo | Estado |
|---|---|---|---|
| 1 | **Sonido** | Toggle on/off | Funcional desde el estreno |
| 2 | **Mensajes** | Toggle | Aún deshabilitado — semántica resuelta en esta sección |
| 3 | **Mano actual** | Acción bajo demanda | Según v1.0 + sección 3 de esta revisión |
| 4 | **Saldo: visible/oculto** | Toggle de privacidad | **Entrada nueva** — sección 4 |

**Sonido** — hereda la función **íntegra** de la bocina actual: mismo toggle, misma
persistencia, mismos handlers. No se reescribe: se relocaliza.

**Mensajes** — **toggle, aún deshabilitado.** La v1.0 lo deja ubicado y deshabilitado hasta su
implementación, con el estado de no habilitados vigente (atenuado, sin respuesta al clic/tap).

**Semántica (resuelta 2026-08-04):** silencia los **mensajes narrativos** del centro de mesa,
**jamás** los que portan **información imprescindible de juego** — apuestas a igualar,
instrucciones de descarte, resultados, eliminaciones. **La clasificación de las familias se
hará en el diagnóstico de implementación.**

**Mano actual** — según v1.0, más la especificación ampliada de la sección 3.

**Saldo: visible/oculto** — entrada nueva de esta revisión, especificación en la sección 4.

### 2.1 Sugerencias — DESCARTADA

**Descartada de momento — decisión de producto de agosto 2026.** Se retira del menú y de la
hoja de ruta.

**Motivo:** el fundador prefiere no ofrecer asistencia de decisión de jugada en esta fase.
Podrá reevaluarse en el futuro.

La subsección correspondiente de la v1.0 queda **referenciada como descartada, no borrada del
historial documental**: la v1.0 permanece íntegra en el repositorio como registro de la
decisión original y de su reversión.

> **Nota de trazabilidad:** la v1.0 no nombra una entrada "Sugerencias". Su antecedente
> documental es **"Asistente IA"** (v1.0 §3.3, icono burbuja con signo de pregunta, ubicado y
> deshabilitado). Es esa entrada la que queda descartada por esta decisión. Ver sección 7.

---

## 3. "Mano actual" — especificación ampliada

### 3.1 Qué informa

La **cuenta matemática de las cartas del usuario al momento de consultar**, expresada en
**valor relativo según las reglas del juego** — **nunca** el valor nominal impreso en la carta.

Formato de referencia:

> *"Tu mejor palo es 30 de oros; además espadas 10, bastos 10"*

Incluye la **valoración correcta del comodín** según los **parámetros congelados de la mesa**
(regla de motor sellada: el comodín y demás parámetros se fijan en el barajado del Pie según
la **mesa de origen**, no según los vivos).

### 3.2 Frontera con lo gratuito

- La banda **"Tu mejor palo"** (fase de pago) seguirá mostrando **gratis** el resumen
  retrospectivo del mejor palo.
- **"Mano actual"** entrega el **desglose completo de todos los palos**, **bajo demanda**, en
  **cualquier momento de la mano**.

Esa es la diferencia que se consume: **la foto completa cuando la decisión de descarte o
apuesta está viva.**

### 3.3 Fuente única de cálculo

El desglose sale de **la misma fuente que alimenta la banda "Tu mejor palo"**. **Prohibido
implementar una segunda calculadora de reglas en paralelo.**

**Sin tocar `gameEngine.js`** (restricción general del sistema de diseño).

### 3.4 Economía

- **20 consultas gratis por usuario.**
- **Contador global único** — acumulable a través de **cualquier escenario, mesa y dificultad**.
- Agotadas las gratuitas, **cada consulta cuesta fichas**.
- **Precio: por definir.** Se calibrará en la **fase de niveles de dificultad**, donde toda la
  economía se revisa junta.
- **Principio ancla:** barato relativo al **ante mínimo (100)** — comodidad, **no peaje**.

### 3.5 Transparencia

- La entrada del menú **muestra siempre el saldo de consultas**:
  `Mano actual — 13 gratis` / `Mano actual — 5 fichas`.
- El **primer cobro de cada sesión** pide **confirmación de un toque**; los siguientes de la
  misma sesión, **no**.
- **El usuario jamás descubre el cobro después de consultar.**

### 3.6 Integridad del contador

- **Pre-login:** vive en `localStorage`. **Limitación conocida y aceptada en Fase 1**
  (manipulable borrando los datos del navegador).
- **Con login:** migra a **Supabase** como **ledger autoritativo**, junto al saldo de fichas.

---

## 4. "Saldo: visible/oculto" — especificación

Toggle de **privacidad sobre el saldo propio** del jugador.

### 4.1 Máscara, jamás remoción

La **reserva de 7 dígitos alineada a la derecha (H1) permanece intacta**; los dígitos se
sustituyen por **máscara** (`•••••` o glifo de la pila de monedas — decisión visual en
implementación, contra el sistema de diseño).

**Δ=0 por construcción: ocultar no mueve nada.**

### 4.2 Saldo Vivo con máscara activa

- Se **suprime el delta numérico flotante**.
- Se **conservan pulso y halo** (dorado ganancia / vinotinto pérdida).

**Feedback emocional sin cifra.**

### 4.3 Persistencia

`localStorage` pre-login → **columna de preferencias en Supabase** con login.
**No se resetea por partida.**

### 4.4 Arquitectura de política

El comportamiento queda gobernado por la bandera **`balancePrivacyAllowed`** (Supabase).

Si alguna vez se activara la **fase de dinero real**, la bandera se apaga y **todos los saldos
vuelven a ser visibles** por requisito regulatorio — **cero retrabajo**.

### 4.5 Decisiones PvP selladas

Se documentan ya, para el ciclo multijugador:

**(a) Doble efecto** — el toggle rige **vista propia y vista ajena**: si un rival humano toca
tu `cornerChip` y ocultaste tu saldo, ve la **máscara 3 segundos**, no la cifra.

**(b)** El `cornerChip` del **rival humano** se comporta **idéntico al de la IA**, salvo toggle
activo del dueño.

**(c)** El **rango del lobby (🟢🟡🔴) permanece público siempre**, incluso para quien oculta —
privacidad sobre **la cifra exacta**, no sobre la categoría.

**(d) Misma máscara** en vista propia y ajena — **un solo componente, un solo lenguaje**.

**(e) Sin regla recíproca:** quien oculta **sigue pudiendo** curiosear a quien no oculta.

---

## 5. Nota de proceso

La implementación seguirá el **flujo de campaña**:

1. **Diagnóstico de solo lectura** — caja de la bocina, presupuesto del panel, cadena de
   apilamiento, persistencia actual del ajuste de sonido, handlers existentes.
2. **Decisión.**
3. **Implementación** con **modo permanente del arnés** (`scripts/diagDSK.mjs`). *Nombre final:
   `u1`* — la campaña DSK nombra sus modos por la tanda, no por la función (`b1`, `o1`, `z1`,
   `a2`…), y un `menu` suelto habría roto esa convención.

---

## 6. Heredado de la v1.0 (vigente, sin cambios)

Se transcribe para no obligar a consultar dos documentos. En caso de duda, la v1.0 es el texto
original.

- **Justificación** (v1.0 §2): espacio crítico en mesa 5; mínima distracción — son funciones
  auxiliares, no vitales para la partida.
- **Color de mesa** (v1.0 §3.4): futuro no cercano. **NO se ubica aún** — por eso no aparece
  entre las cuatro entradas de la sección 2.
- **Estado de no habilitados** (v1.0 §3): atenuados y sin respuesta al clic/tap.
- **Reserva de badge de notificación** (v1.0 §5): el disparador podrá portar un puntito-badge
  cuando el panel esté cerrado (mensajes futuros). Se contempla en el diseño del recuadro desde
  el inicio; **no se implementa aún**.
- **Despliegue por escenario** (v1.0 §6): **PENDIENTE**, mesa a mesa según el espacio
  disponible, con validación visual. Esta revisión lo acota al gate de escritorio.
- **Sistema** (v1.0 §7): regla single-gold; valores fluidos (sin píxeles hardcodeados);
  ocultamiento por `visibility`/`opacity`; coherencia con `AJILEI_Sistema_Diseno_v1.2.md`.

---

## 7. Discrepancias detectadas contra la v1.0

Ninguna era una contradicción de fondo con este delta; se registran para trazabilidad. Las dos
marcadas **RESUELTA** lo fueron por la **enmienda del 2026-08-04**; las demás siguen abiertas y,
si el fundador lo considera, van a decisión.

1. **"Mensajes" — tipo de control. ✅ RESUELTA (enmienda 2026-08-04, sección 2).** La v1.0
   (§3.2) lo describía como *entrada ubicada y deshabilitada*, sin declararlo toggle; este delta
   lo llamaba *toggle, según v1.0*, y quedaba sin definir **qué alterna**. Verificado en código a
   HEAD `57f0939`: **no existe hoy ningún toggle de mensajes**; lo único que hay son los mensajes
   de centro de mesa (`game.message` / `discardMsg` en `GameTable.jsx`). **Resolución:** toggle,
   aún deshabilitado; silencia los **narrativos** del centro de mesa y **nunca** los
   **imprescindibles de juego** (apuestas a igualar, instrucciones de descarte, resultados,
   eliminaciones). La **clasificación de las familias** se hará en el diagnóstico de
   implementación (sección 5).
2. **"Mano actual" — sin antecedente nominal en la v1.0.** La v1.0 no contiene ninguna entrada
   con ese nombre; la referencia "según v1.0" no tiene texto que heredar más allá del orden y
   del estado de no habilitados.
3. **"Sugerencias" — sin subsección propia en la v1.0.** Su antecedente documental es
   **"Asistente IA"** (v1.0 §3.3). Se ha marcado esa entrada como la descartada.
4. **Protocolo de cierre. ✅ RESUELTA (enmienda 2026-08-04, sección 1.3.1).** Única
   contradicción real: la v1.0 §4 mantenía el panel abierto tras usar una opción, con autocierre
   a ~3s, y este delta lo cerraba al ejecutar. **Resolución:** cierre por tipo de entrada — los
   **toggles cierran al ejecutar**; **"Mano actual"** muestra su desglose con **autocierre de
   lectura ~4–5 s** o cierre por clic fuera / `Esc`, lo que llegue primero. El autocierre de la
   v1.0 §4 queda derogado como regla general y **sobrevive acotado** ahí, como su único heredero.
5. **Encuadre móvil de la v1.0.** La v1.0 está redactada en lenguaje táctil ("tap", "mesa 5") y
   asume alcance general. Esta revisión acota el alcance a escritorio y **sella móvil**; el
   lenguaje táctil de la v1.0 no aplica al gate de esta versión.

---

## 9. Apéndice — decisiones de implementación (DSK-U1, 2026-08-05)

Cerradas sobre el diagnóstico de solo lectura U1 (20 celdas: 4 mesas × 4 viewports + centinela
1440×850) y aplicadas en la tanda **DSK-U1**. No reabren nada de las secciones 1–4: las
concretan.

### (a) Apertura y apilamiento

**Apertura abajo-derecha**, alineada al filo derecho del disparador, **uniforme en las cuatro
mesas**. El diagnóstico midió cinco direcciones candidatas: sólo *abajo-der* e *izq-arriba*
caben en las 20 celdas (las otras tres se salen del área entre 62 y 184px). Se elige
*abajo-der* porque es la lectura natural del ⋮ y porque *izq-arriba* tapa cartas de la IA en
las mesas 5, 3 y 2. Tras el panel quedan **460–582px libres** por debajo en todas las celdas.

**Panel `position: fixed`, `z-index: 30`**, montado como hermano del área siguiendo el patrón
de las cartas voladoras. Ningún ancestro de la cadena tiene `transform`, así que el `fixed`
ancla al viewport y **no hace falta portal**. El 30 se elige por el censo de z vivos: el techo
real medido dentro del área es **10** (el "+N" volador del pozo, `.pot-float`), por encima del
sobrevuelo Z1 (**9**) y de los paneles revelados (**7**); los modales quedan intactos por
encima (`leave-overlay` 100, bancarrota 120). El arnés no se conforma con el número declarado:
verifica que el panel **gane el hit-test** en su centro y sus cuatro esquinas con Z1 activo.

**Δ=0 no es gratuito.** Cambiar sólo el glifo 🔊 → ⋮ encoge el botón de 40,61 a 25px y desplaza
`.header-right` **15,61px** en las 20 celdas. La caja se **reserva explícitamente** (ancho y
alto de la caja viva, `box-sizing: border-box`); con la reserva, Δ=0 exacto verificado.

### (b) El timer se hereda — decisión de diseño, no descuido

**El reloj de turno sigue corriendo con el menú abierto.** No es un efecto colateral: es la
regla. Hoy ningún overlay lo pausa —medido: con el modal de abandonar abierto, el reloj del
descarte bajó de 20s a 17s en 3 segundos— y el menú **no** introduce una excepción.

**Razón:** "Mano actual" será una consulta **monetizada que se paga en fichas y en segundos**.
Si abrir el menú congelara el turno, consultar sería gratis en tiempo y la ventaja competitiva
de comprar información quedaría sin coste real. Que el reloj corra es lo que hace que la
consulta sea una **decisión**, no un trámite. Se documenta aquí para que ningún ciclo futuro lo
lea como bug.

**Garantía de que no se convierte en trampa:** la guardia de contenido del arnés exige que el
panel **jamás** toque `.action-buttons`, `.btn-mult`, `.timer-display` ni la banda "Tu mejor
palo", en ningún estado de la mano — el jugador siempre ve el reloj y siempre alcanza sus
botones. Y el cierre por clic fuera **no se traga la acción**: con el menú abierto, un clic
sobre un botón de acción cierra el panel **y ejecuta el botón** (por eso el cierre usa un
listener no bloqueante en vez de un overlay — molde del toggle de ficha H4).

### (c) Regla de clasificación de mensajes

Resuelve el método que la sección 2 dejaba al diagnóstico.

> **Imprescindible** — todo mensaje que **exige o habilita una decisión del humano**, o que
> **comunica un resultado o una eliminación**.
> **Narrativa** — la **crónica de acciones ajenas** que no cambia lo que el humano debe hacer.

**Método: fase + emisor. Jamás regex sobre el texto.** El motor emite `message` como cadena
plana, sin etiqueta de familia; el único precedente de clasificar (`messageActionKind`) lee el
verbo con expresiones regulares, y eso ata la semántica a la redacción: cambiar una palabra
rompería la clasificación en silencio. La UI ya conoce la fase y el emisor de cada mensaje —
esa es la señal estable.

### (d) Las cuatro familias dudosas, resueltas

| Familia | Resolución | Motivo |
|---|---|---|
| **apertura** | **Partida por emisor.** "Tu turno" → imprescindible; la crónica de apertura de una IA → narrativa | el mismo molde de texto sirve a dos funciones distintas; el emisor las separa sin ambigüedad |
| **descarte-fin** | **Partida por emisor.** La variante de mesa 2 que porta "Tu turno." → imprescindible; "Descarte completado." → narrativa | idéntico criterio |
| **igualar** | **Narrativa** | la cifra a igualar no vive en el mensaje: está protegida en `.call-box`, que el toggle no toca |
| **retirarse** | **Narrativa** | el retiro de una IA no cambia la decisión del humano; cuando el retiro **cierra la mano**, quien lo comunica es la familia 15 ("Los demás se retiran…"), que es imprescindible |

### (e) Emisores fuera del óvalo

`.elim-notice` (eliminaciones), `.comodin-note` (parámetro congelado de la mano) y la pantalla
GAME_OVER son **imprescindibles**: el toggle de Mensajes no los alcanza nunca.

### (f) Sonido — lo que cambia el día 1

- **Persistencia en `localStorage`** (`ajilei.sound`), leída al inicializar el contexto y
  escrita en cada conmutación. Hasta hoy el ajuste era estado React volátil: sobrevivía al
  cambio de pantalla y de mesa, pero **cada recarga devolvía el sonido encendido**.
- **Mute real** vía `Howler.mute(!enabled)`, sincronizado en el arranque y en cada toggle:
  **silencio es silencio, incluido lo que ya está sonando**. La guarda existente
  (`if (!soundEnabled) return`) se conserva como segunda capa.
- **Nota autorizada:** el contexto de sonido es compartido con móvil, así que **móvil hereda la
  persistencia**. Es mejora, no regresión, y visualmente **Δ=0** — el sellado móvil de esta
  tanda es visual: ni una regla CSS ni un nodo del árbol móvil cambian.
- La entrada **refleja el estado** con glifo **y clase** (`is-off`): hasta hoy no existía gancho
  CSS de estado, la bocina lo delegaba todo al glifo y al `title`.

### (g) Estado de las otras tres entradas

**Mensajes**, **Mano actual** y **Saldo: visible/oculto** se renderizan **presentes, visibles e
inertes**, en el estado de no habilitados que la sección 6 hereda de la v1.0 §3 (atenuados, sin
respuesta al clic). Cero lógica. En particular, **"Mano actual" no muestra todavía su saldo de
consultas** (§3.5): el contador no existe, y anunciar una cifra sin ledger detrás sería
inventarla. El **autocierre de lectura ~4–5 s** de §1.3.1 queda especificado y **sin
implementar** hasta que esa entrada viva.

### (h) Insumo verificado para "Mano actual"

`getBestSuitScore` (`handEvaluator.js`) **ya devuelve el desglose completo por palos**
(`suitScores`); la banda "Tu mejor palo" sólo consume `palo` y `points` y descarta el resto. El
formato de §3.1 sale de esa misma fuente — **fuente única de cálculo, sin segunda calculadora y
sin tocar `gameEngine.js`**, tal como manda §3.3. Dos cautelas registradas para el ciclo que la
implemente:

1. La llamada correcta es con **`handRules.ruleN`** y `handRules.comodinValue !== null` (los
   parámetros **congelados** en el barajado del Pie). La función **recalcula el valor del
   comodín por dentro** a partir del `ruleN` que recibe: pasarle el número de vivos cambiaría
   la valoración en silencio.
2. **Ese desliz ya existe hoy**, fuera del alcance de esta tanda: el aviso de descarte usa
   `maxDiscard(aliveN)` mientras el motor aplica `handRules.maxDiscard`. En una mesa reducida a
   mitad de sesión el texto puede anunciar un tope distinto del que se aplica. **Watch item.**

---

## 10. Apéndice — panel a solo-iconos y contador de consultas (DSK-U1b, 2026-08-06)

Segunda tanda de implementación, sobre `82cd83a`. Refina el panel de la sección 9 sin reabrir
ninguna de sus decisiones selladas (apertura, `fixed` z:30, timer heredado, clasificación de
mensajes).

### (a) Entradas a solo-icono

Las palabras se retiran; cada entrada queda en **icono + `title` nativo** ("Sonido",
"Mensajes", "Mano actual", "Saldo").

**Motivo doble:** *uniformidad futura con móvil* —cuando el menú llegue al teléfono, un panel
de iconos cabe donde uno de etiquetas no— y *economía de espacio*: el ancho deja de estar
gobernado por la etiqueta más larga (223,89px medidos con la tipografía viva) y pasa a
gobernarlo el icono. **El panel encoge de 224 a 64px, un 71 % menos.**

**El área táctil NO encoge.** La fila conserva sus 44px de alto y el interior del panel mide 62
de ancho: ambos por encima del estándar de 44 que esta tanda exige a las entradas (el
disparador ⋮ conserva el de campaña, 40). *El panel encoge en ancho, jamás en área.*

**Los cuatro iconos:**

| Entrada | Icono | Procedencia |
|---|---|---|
| Sonido | 🔊 / 🔇 | el glifo de hoy — sigue portando el estado, ahora sin palabra que lo repita |
| Mensajes | 💬 | glifo de texto |
| Saldo | **`ChipToken`** | **el componente de ficha que ya usa el `cornerChip`** — SVG dorado plano de la app. Inventar otro glifo de moneda habría roto el lenguaje |
| Mano actual | **silueta de carta con "?"** | SVG nuevo, `viewBox` 22:31 — la **simplificación entera de los assets 1055×1491** (0,7097 contra 0,7076), misma familia de proporción que `--card-w/h` |

**Single-gold:** el trazo de la carta hereda `--text-primary` (`currentColor`). El único oro
sólido del panel es la ficha de Saldo —glifo de moneda ya establecido, no un acento nuevo— y el
único acento dorado que la tanda estrena es el **filete del badge**.

### (b) "Mano actual", última y separada

Cierra el panel, después del grupo de las tres, con **aire de 6px + filete de 1px** del sistema
(`rgba(--gold-brand, .18)`). Es la entrada **premium** y la separación lo dice sin palabras.

Detalle de marcado con consecuencia real: esta entrada **no puede ser un `<button disabled>`**
—un botón deshabilitado bloquea los eventos de sus hijos y el badge quedaría muerto—, así que
es un `<div>` inerte. Y el `role="menuitem"` con `aria-disabled` vive **en el icono, no en el
contenedor**: un control vivo no puede colgar de un subárbol `aria-disabled`, porque las
herramientas de accesibilidad lo dan por muerto con razón.

### (c) El badge contador

Disco de 18px junto al icono de "Mano actual": superficie del sistema, filete dorado fino,
cifra a 10px bold. Muestra las **consultas restantes**.

**Infraestructura, no lógica.** Clave `localStorage` **`ajilei.consultas`**, creada con las **20
gratis** de §3.4 y leída para pintar el badge. **Nadie decrementa todavía** — el consumo es de
su propio ciclo, y hasta entonces la cifra será 20 fija.

*Momento de inicialización:* la clave se crea al **montar el panel por primera vez**, no al
arrancar la app. Es el primer instante en que la función existe, y así móvil —donde el menú no
se monta— no estrena una clave que nunca va a leer.

Deuda táctil: 18px visuales, hit **40×44 confinado a su propia fila**. El confinamiento no es
escrúpulo — desbordar hacia arriba le robaría taps a la entrada de Saldo.

### (d) El popup del contador

Al **presionar** el badge (clic/tap; **jamás** por hover) aparece un popup flotante fuera de
flujo con **"Tienes N consultas gratis"**, N del contador vivo. Se ancla por su borde **derecho**
a la izquierda del badge, centrado en él — así el ancho puede crecer con la cifra sin
recalcular nada. Un peldaño por encima del panel (z:31): nace de él y debe pintarse sobre él.

**Cierre por dos vías exactas, lo que llegue primero:**
1. **Clic en cualquier otra parte.**
2. **Autocierre a los 2 segundos.**

Molde técnico: el patrón H4 ya usado — `setTimeout` en ref + `pointerdown` en captura, sin
overlay.

> **Invariante sellado — presionar el badge no es "ejecutar".** El menú **permanece abierto**.
> Mientras el popup vive, ningún cierre del menú se dispara salvo por las vías del propio
> popup. Coherencia: si el clic-en-otra-parte cae **fuera del panel**, cierra **ambos**; si cae
> **dentro** (o sobre el propio popup), cierra sólo el popup y el menú no se inmuta.

### (e) Nota sobre una pausa futura

Esta tanda **no introduce ninguna pausa**. Queda anotado para cuando "Mano actual" viva: si
algún día se implementa el **autocierre de lectura ~4–5 s** de §1.3.1, su temporizador deberá
regirse por la **misma regla que el popup** —arrancar al abrir, morir al primer clic en otra
parte— y, sobre todo, **no arrastrar consigo al reloj de turno**: el timer se hereda corriendo
(§9.b) y una pausa de lectura no puede convertirse por la puerta de atrás en una pausa de
juego. El popup de 2 s de esta tanda es el precedente y el molde.

---

## 8. Historial de versiones

- **v1.1 · apéndice U1b** — 2026-08-06. Sección 10: panel a **solo-iconos** con tooltips nativos
  (224 → 64px de ancho, área táctil intacta a 44), ficha `ChipToken` para Saldo y **SVG propio
  de carta con "?"** para Mano actual, esa entrada **última y separada** por filete del sistema,
  **badge contador** con la clave `ajilei.consultas` inicializada a 20, y **popup** informativo
  con sus dos cierres exactos (clic en otra parte / autocierre 2 s) bajo el invariante
  **presionar el badge no cierra el menú**. Implementado en la tanda **DSK-U1b**.
- **v1.1 · apéndice de implementación** — 2026-08-05. Sección 9: apertura abajo-derecha
  uniforme y panel `fixed` z:30 (sin portal), **timer heredado** con su razón de diseño, regla
  de clasificación de mensajes por **fase + emisor** con las cuatro dudosas resueltas, emisores
  externos imprescindibles, sonido persistente con mute real (y la herencia autorizada en
  móvil), estado inerte de las otras tres entradas e insumo verificado de "Mano actual".
  Implementado en la tanda **DSK-U1** con modo `u1` permanente del arnés.
- **v1.1 · enmienda** — 2026-08-04. Resuelve §7.1 y §7.4: **semántica del toggle de Mensajes**
  (silencia narrativos, nunca lo imprescindible de juego; clasificación de familias al
  diagnóstico) y **cierre por tipo de entrada** (toggles cierran al ejecutar; "Mano actual" con
  autocierre de lectura ~4–5 s o clic fuera / `Esc`, heredero acotado de la v1.0 §4).
- **v1.1** — 2026-08-04. Alcance acotado al gate de escritorio (móvil sellado con su bocina).
  Disparador ⋮ en la caja exacta del botón de sonido (Δ=0); el sonido pasa a ser la primera
  entrada del menú. Panel flotante fuera de flujo, por encima de Z1 y de los paneles `z:7`;
  cierre por clic fuera / `Esc` / ejecución de entrada (deroga el autocierre de la v1.0).
  Cuatro entradas: Sonido, Mensajes, Mano actual, **Saldo: visible/oculto** (nueva).
  "Mano actual" especificada y **monetizada** (20 gratis, contador global, precio por definir
  en la fase de dificultad; transparencia de saldo y confirmación del primer cobro por sesión).
  **Sugerencias / Asistente IA descartada** — decisión de producto de agosto 2026.
- **v1.0** — Preliminar. Reserva las decisiones ya tomadas; diseño de despliegue por escenario
  e implementación pendientes.
