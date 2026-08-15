# AJILEI — Modos y Asistencia v1.1

**Estado:** **Especificación de implementación, con la fase 4 medida y cerrada de escalera.**
**Fecha:** 2026-08-15.
**Base de código:** HEAD `a1bc2ff` (NIV-2) + esta tanda **NIV-CAL**.
**Relación con la v1.0:** la **v1.0 se queda en el repositorio** — molde de versionado, igual que
la cadena de Utilidades. Esta v1.1 **no la sustituye párrafo a párrafo**: incorpora lo sellado
desde `4076561` y **manda sobre ella allí donde diverge**. Todo lo que la v1.1 no menciona sigue
vigente tal cual quedó en la v1.0.

**Qué la hace necesaria:** entre la v1.0 y hoy, la fase pasó de especificada a **medida**. Y
medirla cambió cosas que un documento de diseño no podía anticipar: apareció una fuga real en
Avanzado, la métrica con la que se juzgaba la escalera resultó estar midiendo otra cosa, y dos
límites del diseño se confirmaron jugando. Nada de eso cabía como nota al pie.

**Autoridades externas** (sin cambios): `AJILEI_Menu_Utilidades_v1.4.md` — cabeza de la cadena de
Menú de Utilidades, manda sobre *Mano actual* y *Sugerencias* · `AJILEI_Sistema_Diseno_v1.2.md` —
autoridad visual · `AJILEI_Reglas_Mano_Congeladas_v1.0.md` — doctrina de foto única (HR-1).

---

## 0. El delta en una página

| # | Qué | Estado |
|---|---|---|
| **§1** | **Reparación de la curva de BET_3 de Avanzado.** Fuga real, medida y corregida. | **Implementado (NIV-CAL)** |
| **§2** | **La escalera, medida y monotónica** en las cuatro mesas. | **Medido** |
| **§3** | **Bandas de regresión permanentes** + modo `--bandas` del banco. | **Implementado** |
| **§4** | `FREC_FAROL` y `FREC_DISIMULO` **se quedan en 0,5**, calibradas por evidencia. | **Cerrado** |
| **§5** | **Dos límites conocidos** con remedio nombrado y cero código. | **Registrado** |
| **§6** | **Precio de *Mano actual*** — la única decisión que la v1.0 dejaba abierta. | **Sellado** |
| **§7** | **Métrica oficial de la fase: fichas netas por mano.** | **Sellado** |
| **§8** | Registros de fase que la v1.0 no podía tener. | **Registrado** |

---

## 1. Acta de la reparación de Avanzado — **SELLADO**

### 1.1 Qué estaba mal

La v1.0 §5.2 asignó a Avanzado la capacidad **④ disciplina de bote**: igualar cuando la equidad
estimada cubre el precio que la mesa cobra. NIV-1 la implementó con curvas **medidas**, y para la
mano definitiva (BET_3) usó la **enumeración exacta de las C(40,5) = 658.008 manos**: para cada
puntaje, la probabilidad de que una mano al azar quede por debajo.

Era exacta y era el sitio equivocado. **En BET_3 no queda ninguna mano al azar sobre la mesa:**
todos los vivos acaban de pasar por la ronda de descarte, y la política de descarte —quedarse con
el mejor palo y cambiar el resto— produce manos bastante más fuertes que el azar. Contra un
puntaje de 30, la curva afirmaba **0,858** y la medición da **0,581**.

Consecuencia: **Avanzado sobreestimaba su equidad en cada mano definitiva y pagaba de más.**

### 1.2 Cómo se descubrió

No leyendo código. Midiendo, y por accidente: NIV-2 tuvo que medir la curva **condicionada al
número de cartas descartadas** para la capacidad ② de Pro, y su **marginal** —la mezcla sobre todos
los conteos— resultó ser un objeto distinto del que Avanzado estaba usando.

La confirmación llegó de la métrica nueva (§7): **en fichas netas por mano, Básico batía a
Avanzado en tres de las cuatro mesas.** Un nivel inferior batiendo al superior es un rojo que no
admite lectura amable.

### 1.3 Qué se cambió

**Una línea de decisión.** La curva de BET_3 de Avanzado pasa de `CURVA_FINAL` (mano al azar) a
`CURVA_DESCARTE.marginal` (mano ya descartada, medida sobre la dinámica real con 20 millones de
muestras). Ni un umbral, ni un perfil, ni una rama, ni el orden de ninguna comparación.

**La frontera Avanzado/Pro queda intacta, y es la mitad del encargo.** Avanzado **no recibe ②**:
no lee un solo conteo de descarte, no toca la memoria de módulo, y su trampa `Proxy` sigue
exigiendo que **no roce `state.deck` ni para su longitud**. Lo único que deja de hacer es suponer
un rival imposible. La distinción se conserva entera:

| | Qué supone de sus rivales en BET_3 |
|---|---|
| **Básico** | nada — no mira el bote, no calcula equidad |
| **Avanzado** | la **marginal**: todos los rivales son del montón, la misma cifra para los k |
| **Pro** | **condiciona rival por rival** con lo que leyó del descarte |

**Efecto colateral matemático, anotado porque simplificó código.** La capacidad ② de Pro cruzaba
dos escalas distintas —la de Avanzado (mano al azar) y la de la evidencia (post-descarte)— con una
actualización en **espacio de momios**, que era la única forma de hacerlo sin salirse de [0,1] ni
sesgar la corrección hacia un lado. Reparada la base, **las dos escalas son la misma**: la razón de
momios se cancela y toda la expresión colapsa a `Π q_{d_i}(s)` — el objeto exacto que ② siempre
estuvo aproximando. Quince líneas de maquinaria dejaron de tener trabajo.

### 1.4 El acta del test de oro

**Es la primera vez en la fase que una referencia de oro se mueve**, así que queda escrita:

- **Qué cambió:** la curva de BET_3 en la transcripción de referencia de Avanzado.
- **Por qué:** el hallazgo de §1.1, cuantificado en §1.2.
- **Bajo qué autorización:** instrucción NIV-CAL §1, decisión A de Victor.
- **Qué NO se movió:** **la batería de Básico, ni una línea.** Y no depende de la promesa: con
  rango 0 la transcripción **ni siquiera alcanza** la curva —`avanzado` sale falso, la equidad vale
  0 y la aritmética de bote no se ejecuta—, así que Básico es inmune por construcción. Su
  identidad sigue anclada además en la batería de NIV-1, que compara contra la lógica **anterior a
  NIV-1** y que esta tanda no ha rozado.
- **Se comprobó que la red nueva muerde:** revertir la curva hace fallar la batería.

> **Regla que nace aquí, de alcance permanente:** una referencia de oro sólo se mueve con
> **acta escrita en el propio archivo de prueba** —qué, por qué, bajo qué autorización, qué no se
> movió— y con la verificación de que la referencia nueva falla ante la mutación que la revierte.
> Una referencia que se mueve sin que nadie lo note no es una referencia.

---

## 2. La escalera medida — **SELLADO**

*(Cifras en **fichas netas por mano**, en unidades de entrada de mesa, comparación pareada del
asiento 0 contra su gemelo de temperamento. 100.000 manos contadas por celda, error estándar por
conglomerados, umbral por familia con corrección de Bonferroni. Negativo = el asiento 0 pierde.)*

### 2.1 El peldaño Básico → Avanzado: antes y después de la reparación

| Mesa | Antes (curva vieja) | Después (curva reparada) |
|---|---|---|
| **2** | **+0,084u** (4,39σ) ⛔ *invertido* | **−0,094u** (4,31σ) ✅ |
| **3** | **+0,046u** (1,99σ) ⛔ *invertido* | **−0,135u** (5,60σ) ✅ |
| **4** | −0,281u (9,76σ) ✅ | **−0,465u** (16,19σ) ✅ |
| **5** | **+0,147u** (4,74σ) ⛔ *invertido* | **−0,246u** (7,31σ) ✅ |

**La escalera es monotónica en fichas en las cuatro mesas.** La inversión de tres de cuatro era la
fuga, y ya no está. Es el resultado que §1 buscaba, verificado y no supuesto.

### 2.2 La escalera completa

| Mesa | Básico → Avanzado | Avanzado → Pro | Básico → Pro |
|---|---|---|---|
| **2** | −0,094u (4,31σ) | −0,048u (2,41σ) | −0,088u (5,39σ) |
| **3** | −0,135u (5,60σ) | −0,123u (5,45σ) | −0,267u (12,33σ) |
| **4** | −0,465u (16,19σ) | −0,204u (8,37σ) | −0,645u (23,46σ) |
| **5** | −0,246u (7,31σ) | −0,197u (6,61σ) | −0,365u (12,25σ) |

**Los dos peldaños existen y tienen el signo correcto en las cuatro mesas.** Básico < Avanzado <
Pro, medido.

### 2.3 Lo que la reparación le costó a Pro — dicho sin adorno

**La ventaja de Pro sobre Avanzado se estrechó**, y en mesa 2 mucho: de **−0,182u a 10,45σ** antes
de la reparación a **−0,048u a 2,41σ** ahora.

**No es una regresión de Pro: es que buena parte de esa ventaja era la fuga que se acaba de
tapar.** Pro batía a Avanzado, en parte, porque Avanzado pagaba de más. Tapado eso, lo que le queda
a Pro es lo suyo: la lectura condicionada rival por rival y el farol. En mesa 2 hay **un solo
rival** sobre el que condicionar, así que la capacidad tiene el mínimo de material con el que
trabajar — y ahí el peldaño se queda en el ruido.

**Consecuencia declarada:** la puerta que exige que Avanzado pierda contra Pro **con
significancia** sale **roja en mesa 2** (2,41σ contra un umbral de familia de 3,58σ). Es **falta de
potencia, no signo contrario**. No se re-lanzó la celda: repetirla hasta que saliera verde sería
fabricar el verde.

### 2.4 Los conductores basura

*(fichas netas por mano del asiento 0; más negativo = más castigado)*

| Mesa | PASIVO vs Avanzado | PASIVO vs Pro | ALEATORIO vs Avanzado | ALEATORIO vs Pro |
|---|---|---|---|---|
| **2** | −0,256u | −0,277u | **−1,617u** | −1,138u |
| **3** | −0,502u | −0,564u | **−2,214u** | −1,458u |
| **4** | −0,664u | −0,724u | **−2,633u** | −1,609u |
| **5** | −0,830u | −0,894u | **−2,718u** | −1,093u |

El **PASIVO** está más castigado por Pro que por Avanzado en las cuatro mesas, como debe ser.

El **ALEATORIO no**, y es el hallazgo que da cuerpo al límite de §5.2: **Avanzado lo castiga entre
un 40% y un 150% más que Pro**. Un rival que sube al azar encarece el precio del bote; Pro, que
calcula el precio pero no el patrón, se retira y le cede potes pequeños. Avanzado —que desde esta
tanda también calcula bien, pero se retira menos— lo desangra más. **Es un dato de la fase, no un
matiz**: la escalera ordena contra jugadores, no contra ruido.

### 2.5 Validez del instrumento

| Puerta | Resultado |
|---|---|
| Conservación de fichas en el 100% de las manos | 🟢 |
| Espejo simétrico (b1 · b2 con umbral por familia · b3) | 🟢 |
| El pasajero `nivelIA` sobrevive el motor entero | 🟢 |
| Diferencia pareada del espejo simétrico en fichas (debe ser 0) | 🟢 — máximo 2,02σ en 8 celdas |

Las cuatro puertas de NIV-1 sobre la matriz relanzada: **PASIVO castigado 🟢 · por temperamento 🟢
(16 de 16 con el signo correcto) · ALEATORIO triturado 🟢** (26,42 / 12,12 / 6,59 / 4,97% contra
31,27 / 15,37 / 9,79 / 5,88% de la línea base de Básico) · **la hermana mayor domina 🟡**: verde en
mesas 3, 4 y 5 (7,94σ · 28,51σ · 11,79σ) y por debajo del umbral de familia en mesa 2 (2,95σ contra
3,40σ) — la misma falta de potencia de §2.3, en la mesa donde menos material hay.

Las de NIV-2: **por temperamento 🟢** (32 de 32) · **escalera 🟡** con las rojas de §2.3 · **sin
regresión contra basura 🔴 en el eje ALEATORIO**, que es §5.2 y ya no es una sorpresa sino un
límite con nombre.

---

## 3. Bandas de regresión — **SELLADO, de por vida**

**Qué son:** la fotografía numérica de la escalera en el momento de sellarla, convertida en
**alarma permanente**. Viven en `capturas-dsk/evidencia/nivCAL_bandas.json`, rastreadas.

**Por qué existen.** Esta fase enseñó cómo se degrada una IA sin que nadie se entere: la curva de
§1 llevaba una tanda entera haciendo pagar de más a Avanzado, y sólo salió a la luz porque otra
tanda midió, por otro motivo, una magnitud que nadie miraba. **Una vara que no se comprueba no es
una vara.**

**Cómo se comparan.** Dos corridas del banco nunca dan la misma cifra —no hay siembra y el ruido
por racimos es real—, así que la banda **no es un intervalo fijo** sino una prueba de dos muestras:

```
|nuevo − sellado|  ≤  umbral · √(se_nuevo² + se_sellado²)
```

con el error estándar **por conglomerados** (un racimo por partida, que es el que manda en todo
este banco) y el umbral corregido por familia sobre el número de comparaciones que la corrida hace
de verdad. Con una sola comparación degenera en **3σ exactos**.

**El signo se exige aparte.** En los duelos, además de la magnitud, se comprueba que el signo se
conserve: una escalera podría invertirse y seguir «dentro de tolerancia» si la diferencia es
pequeña — y esa es justamente la degradación que estas bandas existen para cazar.

**Qué se sella:** por mesa y por celda de la matriz —los tres conductores (espejo, pasivo,
aleatorio) y los duelos entre niveles—, cuatro magnitudes: fichas por mano del asiento 0, su tasa
de manos, y las dos versiones del duelo pareado 0-vs-1.

> **Regla normativa de la fase en adelante:** **toda tanda que abra `aiPlayer.js` corre
> `--bandas` y reporta el resultado.** Un rojo no bloquea por sí solo —una tanda puede tener
> permiso explícito para mover una cifra, como lo tuvo NIV-CAL con la curva de Avanzado—, pero
> **moverla sin decirlo sí es un fallo de tanda**.

```
node scripts/bancoNiveles.mjs --nivel pro --duelo avanzado,basico --manos 100000 --bandas
```

Sale con código 1 si alguna celda se sale de banda.

---

## 4. Constantes de frecuencia — **CERRADO: se quedan en 0,5**

`FREC_FAROL` y `FREC_DISIMULO` **no se afinan**. Queda registrado como **calibrado por evidencia**,
no como pendiente, para que ninguna tanda futura las mueva por intuición:

- **`FREC_FAROL = 0,5`.** La frecuencia efectiva del farol **no la gobierna esta constante** sino
  el producto de respaldo, que se autorregula solo con el tamaño de la mesa: **0,19 faroles por
  mano en mesa 2 y 0,035 en mesa 5**. Contra cuatro rivales el producto de probabilidades cierra
  la rama sin que nadie tenga que prohibirla. Subirla no haría a Pro más audaz donde importa; sólo
  lo haría más legible en el duelo.
- **`FREC_DISIMULO = 0,5`.** El techo del Ajilei disimulado es **estructural, no de la
  constante**: el Ajilei se fabrica casi siempre **en** el descarte, así que la inmensa mayoría de
  las decisiones con Ajilei ya son de BET_3, donde Pro cobra por diseño. Medido: sólo el
  **1,4–3,5%** de las decisiones con Ajilei son disimulables. Con la constante en 1 el techo apenas
  se movería.

**Para moverlas hace falta evidencia nueva**, no una corazonada.

---

## 5. Límites conocidos — **REGISTRADOS, sin código en esta fase**

Se nombran para que ninguna tanda futura los tome por descuidos, y cada uno lleva **remedio con
nombre**.

### 5.1 El tell del pase

**Abrir o pasar se decide por un umbral de puntaje**, así que el pase revela debilidad: en los
**tres niveles**, una IA que pasa casi nunca lleva una mano fuerte. Confirmado **empíricamente por
Victor jugando de verdad**, no sólo por medición.

El farol de Pro tapa una parte del agujero —a veces abre con nada— pero sólo en BET_3 y sólo con
lectura de descartes, así que **el tell sobrevive entero en BET_1 y BET_2**.

**Por qué no se arregla aquí:** taparlo de verdad exige un *pase-trampa* con mano fuerte —jugar
lento a propósito, con frecuencia calibrada contra un rival concreto—, y eso es un **modelo de
rival**, no un umbral. **Remedio: capacidad ⑤**, diferida por la v1.0 §5.4 hasta que exista gancho
de showdown.

### 5.2 Retiro ante agresión no informativa

**Pro lee el precio del bote, no el patrón del agresor.** Un rival que sube constantemente sin
respaldo —un humano «ladrando»— encarece el precio, y Pro, que ahora sí calcula, se retira. **Cobra
potes que no debería cobrar.**

**El dato es más duro de lo que parecía en NIV-2, y conviene decirlo entero.** Allí se leyó como
ceguera de la métrica de manos. Con Avanzado reparado y midiendo en **fichas**, la conclusión es
peor: contra el conductor ALEATORIO, **Avanzado le saca entre un 40% y un 150% más de fichas que
Pro** (§2.4). No es que la métrica no lo viera — es que **contra agresión no informativa, el nivel
superior rinde menos que el intermedio.**

**Alcance, para no exagerarlo:** la escalera ordena bien contra jugadores —Básico, Avanzado, Pro y
el conductor PASIVO— y se desordena sólo contra **ruido puro**, que no es un adversario que exista
en la mesa. Pero un humano puede *imitarlo*, y por eso queda registrado como límite y no como
curiosidad.

**Remedio: capacidad ⑤ + gancho de showdown** (deuda de motor, v1.0 §8). La misma pieza que 5.1.
Un agente que ve el desenlace aprende que la agresión de ese rival no estaba respaldada; sin
desenlace, no hay forma de distinguir al que ladra del que muerde.

---

## 6. Precio de *Mano actual* — **SELLADO** (implementación en MA-1)

Cierra la **única decisión que la v1.0 dejaba abierta** (v1.0 §1.3 y §11.1). Autoridad de la
mecánica: `AJILEI_Menu_Utilidades_v1.4.md`; esto fija **el precio y la unidad de cobro**.

### 6.1 Precio por dificultad, no por mesa

| Contra quién juegas | Precio de una consulta |
|---|---|
| **Básico** | **20 fichas** |
| **Avanzado** | **30 fichas** |
| **Pro** | **50 fichas** |
| **Humanos** | **70 fichas** — *durmiente hasta PvP* |

**Racional de Victor, registrado:** el precio **correlaciona con la escala de puntos por
dificultad** (v1.0 §6) — cuanto más vale ganar, más vale la ayuda. Ancla el precio a *contra quién
juegas*, no a *cuánto arriesgas*, que es lo que la ayuda de verdad responde.

### 6.2 Cobro por mano

**La primera consulta de la mano cobra; las siguientes dentro de la misma mano son gratis.**

**Racional:** el cobro por mano **rinde para el jugador no experto**, que es quien más veces
necesita mirar la misma mano. Cobrar por consulta castigaría precisamente al que la utilidad
existe para ayudar.

**Las 20 consultas gratis vitalicias se agotan primero.** Su mecánica actual no cambia hasta MA-1.

### 6.3 Moneda: fichas

**Los puntos de ranking son prestigio, jamás moneda.** No se gastan, no se convierten, no compran
nada. La separación es doctrinal y no admite excepción.

> **Doctrina de economía, sellada aquí:** el saldo necesita **sumideros hormiga** — gastos
> pequeños, frecuentes y voluntarios que le den tensión al saldo sin castigar al jugador.
> **Mano actual es el primero. La tienda de cosméticos será el segundo.**

### 6.4 Cola: MA-1

La tanda siguiente, **terreno UI**:

- Cobro efectivo según §6.1 y §6.2.
- **Recorrido dorado animado por el borde de la ventana de Mano Actual** (`--gold-brand`, CSS
  puro, **cero movimiento de layout** — doctrina O1) señalando que la consulta está viva y pagada.

Aquí sólo se anuncia. **No se implementa nada de §6 en NIV-CAL.**

---

## 7. Métrica oficial de la fase — **SELLADO: fichas netas por mano**

La v1.0 no fijó métrica porque cuando se escribió no había nada que medir. La fase la eligió
midiendo, y la elección tiene consecuencias sobre cómo se lee todo lo anterior.

### 7.1 Por qué no «manos ganadas»

**Premia casi en exclusiva NO RETIRARSE.** El 99% de las manos llega al showdown, así que cada
retiro es una mano que ya no se puede ganar, y quien menos se retira gana más manos **juegue bien
o mal**.

**La prueba, con un número:** el conductor **PASIVO** —iguala o pasa, jamás sube, jamás se
retira— saca **exactamente 1/N** de las manos en las cuatro mesas contra una mesa Pro… mientras
pierde entre **0,26 y 0,71 unidades por mano**. Perfecto en la métrica, arruinado en la mesa.

### 7.2 Por qué tampoco «partidas ganadas»

**Defecto simétrico:** premia retirarse, porque conservar fichas alarga la supervivencia. Leída
así, Básico —que se retira mucho más— «batía» a Avanzado. Igual de falso, en el otro sentido.

### 7.3 Por qué fichas netas por mano

**No tiene lado barato.** El ante es forzado y se cobra a todos en cada barajado, así que
retirarse cuesta de verdad **y** pagar de más también.

**Sus credenciales, medidas antes de usarla para nada:**

1. **En el espejo simétrico da cero** en las cuatro mesas y en los niveles medidos. Una métrica que
   no da cero cuando los dos lados son idénticos no sirve para nada.
2. **Ordena los tres niveles** con el mismo signo y pasos comparables.
3. **Tritura a los conductores basura**: PASIVO y ALEATORIO salen inequívocamente negativos.

**Manos ganadas se sigue publicando** como métrica secundaria en cada puerta y en cada banda: es la
que las instrucciones de NIV-1 y NIV-2 enunciaron, y **su ceguera es ella misma un resultado de la
fase** que conviene tener a la vista.

---

## 8. Registros de fase

Cosas que la v1.0 no podía contener porque nacieron midiendo.

### 8.1 El rider del re-sorteo de perfiles

El re-sorteo por partida nueva de `aiPlayer` exigía `handCount === 0` en el momento de una
decisión, y **eso no ocurre jamás jugando**: el motor deja el contador en 1 antes de la primera
apuesta. Era una **rama muerta**, y su consecuencia en vivo era que los perfiles se repartían una
vez y se quedaban puestos mesa tras mesa durante toda la vida del módulo. Cuantificado: dos
corridas de 3.000 manos dieron 25,17% y 17,20% de tasa para el mismo asiento **sólo por el
reparto**.

**Se reparó, no se retiró** (decisión de Victor, NIV-1): la intención original era correcta —una
mesa nueva merece rivales nuevos—; lo roto era el detector. Ahora el límite de partida se detecta
por dos señales públicas del propio estado: `handCount` **retrocede**, o `aliveCount` **sube**.
Aplica igual a los tres niveles: **el temperamento es ortogonal al nivel** (v1.0 §5.5), así que el
reparto no es una capacidad que se gane subiendo.

**Punto ciego residual, declarado:** dos partidas consecutivas que terminaran ambas en su primera
mano serían indistinguibles. El motor no puede producirlo con las tablas de la v1.0 §3.3, y si
ocurriera, el efecto sería heredar los perfiles de la anterior — exactamente lo que pasaba
**siempre** antes del rider. Degrada al comportamiento viejo, nunca por debajo.

### 8.2 Ventaja posicional de la Mano — real, y es dato para PvP

**No es sesgo del banco:** la Mano gana por encima de 1/N y el Pie por debajo, en las cuatro
mesas. **Origen medido:** el 7,79% de las manos terminan en empate de showdown y **la Mano cobra el
100% de ellos** por la regla de desempate (orden de asiento desde la Mano). El desempate por sí
solo predice +3,89 pp y se observan +2,64 pp; abrir a ciegas más el ajuste de posición devuelve
~1,2 pp.

**Consecuencia anotada para PvP:** en una mesa de humanos, la posición de Mano vale dinero. Si el
PvP no rota la Mano de forma verificablemente justa, el juego tiene un sesgo estructural con
nombre y magnitud conocidos.

### 8.3 La fuerza por temperamento es una dimensión medida

Los cuatro perfiles no son decorativos: el banco mide la escalera **por temperamento**, con
comparación pareada dentro de la misma partida (los dos asientos gemelos comparten temperamento por
construcción del adaptador espejo, así que **lo único que los separa es el nivel**).

**Regla, normativa:** un nivel superior debe batir a su hermano menor **en los cuatro perfiles**.
Está prohibido que un nivel «suba» porque un solo temperamento cargue el promedio.

### 8.4 Regla de procedencia

> **El blob que se mide es el blob que se commitea.** Si después de la corrida cambia una sola
> línea del archivo —incluso un export—, **la matriz se relanza antes del commit**.

Nace en NIV-2 tras un incidente menor en NIV-1: un export añadido después de medir, inocuo en
comportamiento, dejó la evidencia describiendo un blob que no era el publicado. El remedio es
barato y la evidencia lo registra: los blobs se calculan antes de lanzar y se vuelven a calcular
después.

### 8.5 Doctrina de amend

**`git commit --amend` sólo sobre HEAD, y sólo antes del push.** Enmendar por debajo de un
descendiente reescribe historia publicada. Verificado en el diagnóstico de solo-lectura previo a
NIV-2: los tres amends de NIV-B0 ocurrieron cuando ese commit era la punta, y el push salió después
del último.

### 8.6 Identidad `ruleN + 3` de los puntos vs humanos — **verificada, sobrevive**

La v1.0 §6.2 sella que los puntos contra humanos son `ruleN + 3`, congelados al reparto con la
misma foto y la misma doctrina que `handRules`. **Sigue vigente sin cambios** y sin código que la
contradiga: nada de la fase 4 la ha tocado. Durmiente hasta Supabase.

---

## 9. Lo que la v1.0 mantiene, sin cambios

Se enumera para que no haya duda de alcance:

- **§2 · D-1…D-8** — las ocho decisiones, incluida **D-4 (prohibido el multiplicador ciego de
  agresión)** y **D-5 (integridad de información)** con la trampa `Proxy` como puerta obligatoria.
- **§3 · Nombres y tablas** — Básico/Avanzado/Pro y las tres tablas de entrada.
- **§4 · Pantallas** y el recorrido.
- **§5 · Asignación de capacidades** — con la única precisión de §1.3 de este documento sobre qué
  supone Avanzado de sus rivales.
- **§6 · Puntos de ranking**, sellados y durmientes.
- **§7 · Lista de protegidos** — cinco archivos, con la excepción pre-autorizada de siembra en
  `deck.js`.
- **§8 · Deuda de motor** — pila de descartes y gancho de showdown. **Sigue sin abrirse**, y ahora
  tiene dos límites de §5 esperándola por nombre.
- **§9 · Red de pruebas** y la regla de que **cada tanda de nivel trae la suya**.

---

## 10. Historial de versiones

- **v1.1** — 2026-08-15 (**NIV-CAL**). Cierra la fase de escalera con la evidencia en la mano.
  **Repara la fuga de Avanzado** (§1): la curva de BET_3 pasa de la enumeración exacta de la mano
  al azar a la **marginal post-descarte medida**, porque en BET_3 no queda ninguna mano al azar
  sobre la mesa; la frontera Avanzado/Pro se conserva entera —Avanzado no recibe ②—. Nace la
  **regla del acta del test de oro**. **Sella la escalera medida** (§2) y las **bandas de
  regresión permanentes** con su modo `--bandas` (§3). **Cierra las constantes de frecuencia** en
  0,5 como calibradas por evidencia (§4). **Registra dos límites conocidos** —el tell del pase y el
  retiro ante agresión no informativa— con la capacidad ⑤ nombrada como remedio (§5). **Sella el
  precio de *Mano actual***, la única decisión que la v1.0 dejaba abierta: 20/30/50/70 fichas por
  dificultad, cobro por mano, moneda fichas, con la doctrina de **sumideros hormiga** (§6).
  **Sella la métrica oficial de la fase**: fichas netas por mano, con la validación del PASIVO
  como argumento (§7). Registra el rider del re-sorteo, la ventaja posicional de la Mano como dato
  para PvP, la fuerza por temperamento, la regla de procedencia y la doctrina de amend (§8).
- **v1.0** — 2026-08-14. Primera versión en el repositorio. Ratifica D-1…D-8, sella la escalera
  **Básico · Avanzado · Pro** con sus tres tablas, implementa D-6 por la **Vía C** (pasajero
  `state.nivelIA`), da a D-5 dos renglones nuevos y convierte la trampa `Proxy` en puerta
  obligatoria, asigna capacidades con los semáforos de NIV-0 (③+④ a Avanzado; ②+⑥+Ajilei disimulado
  a Pro; ① excluido, ⑤ diferido), fija la arquitectura de **hermanas mayores**, sella las dos
  pantallas y los puntos de ranking, y amplía la lista de protegidos a cinco con `deck.js`.
  Doc-only.
- **v0.1** — 2026-07-31. Borrador de conceptualización, fuera del repositorio. Origen de
  D-1…D-8.

---

## 11. Historial de tandas de la fase 4

| Tanda | SHA | Qué hizo |
|---|---|---|
| **NIV-DOC** | `4076561` | La v1.0. Doc-only. |
| **NIV-B0** | `6db6221` → `c272cf7` → **`9910c3b`** | Banco de línea base. Tres versiones por *amend sobre HEAD*: B0 original, B0.b y B0.c (umbral por familia en b3). Cero cambios en `src/`. |
| **NIV-UI** | `0a45935` | Las dos pantallas, las tablas por nivel y el **pasajero `nivelIA`** cableado end-to-end, con `aiPlayer` ignorándolo aún. Δ=0 jugable, a propósito. |
| **NIV-1** | `ff966a6` | **Avanzado** — ③ comodín completo y ④ disciplina de bote. Primera apertura de `aiPlayer.js`. Rider del re-sorteo reparado. |
| **NIV-2** | `a1bc2ff` | **Pro** — ② lectura de descartes, ⑥ farol y Ajilei disimulado. Segunda apertura. Nace la métrica de fichas y la regla de procedencia. |
| **NIV-CAL** | *esta tanda* | Calibración: reparación de la curva de Avanzado, bandas selladas y esta v1.1. Tercera apertura, de alcance quirúrgico. |
| **MA-1** | *siguiente* | Cobro de *Mano actual* (§6) + recorrido dorado. Terreno UI. |
