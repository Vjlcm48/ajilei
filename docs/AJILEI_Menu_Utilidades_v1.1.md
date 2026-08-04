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
3. **Implementación** con **modo `menu` permanente del arnés** (`scripts/diagDSK.mjs`).

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

## 8. Historial de versiones

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
