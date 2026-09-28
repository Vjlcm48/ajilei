# AJILEI · REC-2 · Fase 0 · Informe de diagnóstico · v1.0

**Ejecutor:** Claude Code · **Fecha:** 2026-09-27 · **Base:** `5f672b4` (árbol sin cambios; solo lectura)
**Ficha:** `AJILEI_REC-2_v1.0.md` §3

---

## 0. Resumen

- **A-1 es un defecto y está reproducido.** El 0 no lo calcula el núcleo: lo pone la **vista** cuando ninguno de los tres montos cabe en el saldo. Hay además una incoherencia entre dos funciones del núcleo: `pideRecarga` pregunta en cuanto S ≥ 1 apuesta, pero el monto más bajo que ofrece `opcionesRecarga` es 10 apuestas. Cuando `unit ≤ S < 10·unit` la pregunta sale con todo apagado y un «Recargar 0». Afecta a la **automática y a la forzosa**, no solo a la forzosa.
- **A-2 no es un defecto.** El código y el normativo coinciden: la forzosa exige `P < unit`. Con P = 300 en mesa 100 el núcleo devuelve **automática** (moneda), no forzosa. El triángulo que vio Victor implica que, al cerrar esa mano, la pila ya estaba por debajo de 100. Lo más probable es que 300 fuera la pila **antes** de una mano que perdió. En la reproducción la forzosa sale exactamente así, con P = 0 y S = 600.
- **El normativo vigente es v1.2, no v1.1.** La v1.2 se publicó en REC-1 (`52a9e35`) y en §5.1 coincide con la v1.1 salvo en el momento de evaluar la forzosa. La regla híbrida de REC-2 **contradice dos frases selladas de la v1.2** (§3.D-2): hace falta una v1.3.
- Ningún archivo de la Fase 1 es protegido. No hace falta abrir `gameEngine.js`.

## 1. Reproducción

### 1.1 Núcleo puro (vitest de sondeo en el scratchpad, fuera del repo)

Mesa 100, S = 600, en mesas de 2 y 5, fases `PAYOUT` y `WAITING`:

| P | `pideRecarga` | `topeRecarga` | opciones (todas `disabled`) | `primera?.monto ?? 0` |
|---|---|---|---|---|
| 300 | **automatica** | 600 | 1000 · 2000 · 4700 | **0** |
| 150 | automatica | 600 | 1000 · 2000 · 4800 | 0 |
| 100 | automatica | 600 | 1000 · 2000 · 4900 | 0 |
| 99 | **forzosa** | 600 | 1000 · 2000 · 4900 | 0 |
| 0 | **forzosa** | 600 | 1000 · 2000 · 5000 | 0 |

`anteDejaAMudos` = false en todos los casos. Como contraste, en mesa 50 con P = 150 y S = 600 el piso vale 500 y cabe, así que el defecto no aparece: **solo aparece cuando 10·unit > S**.

### 1.2 Navegador (Edge, 5173 con bypass, 412×915)

`?apu=saldo:1600,recarga` · Avanzado · 2 jugadores · mesa 100 · entrada piso. El molde siembra P = 300, y la app descuenta la entrada de 1.000, así que S = 600. Se juega declinando cada pregunta:

| Pregunta | Pila | Subtítulo | Montos | Primario |
|---|---|---|---|---|
| automática | 400 | «Quedan 400 HC…» | 1000 / 2000 / 4600, los tres apagados | **«Recargar 0»** (disabled) |
| automática | 200 | «Quedan 200 HC…» | apagados | «Recargar 0» |
| automática | 100 | «Quedan 100 HC…» | apagados | «Recargar 0» |
| **forzosa** | **0** | «Con estas fichas la mesa no puede continuar.» | 1000 / 2000 / 5000, apagados | **«Recargar 0»** · «Salir con mis fichas» |

La última fila es el síntoma de Victor (triángulo + «Recargar 0»). Captura: `scratchpad/rec2f0_forzosa.png`. No se ha copiado al repo.

**Hallazgo visual:** el «Recargar 0» deshabilitado se pinta en **dorado pleno**, igual que uno activo. Ninguna hoja define `.btn-primary:disabled`, y eso explica que Victor lo tocara. Con la regla de REC-2 el botón de 0 deja de existir y el hallazgo queda sin efecto. Se anota por si algún otro primario puede quedar deshabilitado.

## 2. Respuestas a la ficha §3

### 2.1 A-2 · qué dispara la forzosa

**Código.** [src/hooks/mesaCore.js:241-242](../../src/hooks/mesaCore.js#L241-L242):

```js
const noCubreAnte = (humano.chips ?? 0) < unit
if (noCubreAnte || anteDejaAMudos(state)) return RECARGA.FORZOSA
```

**Normativo v1.2 §5.1** (y v1.1 §5.1, con la misma condición):

> **Forzosa**: se evalúa al cerrar la mano y, si la mesa está entre manos, también ahí, cuando el humano **no cubre el ante** o cuando el ante dejaría a todos mudos (D-12, ruta 1).

**Coinciden.** El listón de 5× (`pila < 5 × unit`) es el de la **automática**, que en mesa 100 cubre las pilas de 100 a 499. Una pila de 300 cae en la automática. Para cerrar A-2 del todo: si Victor recuerda el subtítulo, «Quedan 300 HC» habría sido la automática y «Con estas fichas la mesa no puede continuar» la forzosa con P < 100.

### 2.2 A-1 · dónde sale el 0

- Los montos se calculan en `opcionesRecarga` ([mesaCore.js:194-205](../../src/hooks/mesaCore.js#L194-L205)). Nunca devuelve 0 con `unit > 0` y P < techo, pero **apaga** (`disabled`) todo monto mayor que `topeRecarga`.
- **El 0 sale en** [src/components/GameTable.jsx:1170](../../src/components/GameTable.jsx#L1170):
  ```js
  setRecarga({ motivo: motivoRec, monto: primera?.monto ?? 0, abierta: false })
  ```
  `primera` es `undefined` porque ninguna opción está encendida, y el `?? 0` convierte eso en un monto de 0. La voluntaria repite el mismo patrón en [GameTable.jsx:2379-2380](../../src/components/GameTable.jsx#L2379-L2380) y también llega al 0: basta con P ≥ 5·unit y S < 10·unit.
- La causa de fondo es que la **puerta** de `pideRecarga` ([mesaCore.js:239](../../src/hooks/mesaCore.js#L239)) usa `topeRecarga > 0`, que equivale a S ≥ 1·unit, mientras que el monto mínimo ofrecido es el piso de 10·unit. Las dos funciones no comparten el mismo criterio de «hay saldo».
- El rótulo se pinta en [GameTable.jsx:2675](../../src/components/GameTable.jsx#L2675) (`t('ia.recarga.si', { hc: recarga.monto })`).

### 2.3 Qué pasa hoy al tocar «Recargar 0»

Medido en navegador con `click({ force: true })` sobre el botón deshabilitado:

- **No ocurre nada.** El botón lleva `disabled` porque `recargaValida(0)` devuelve `monto_invalido`, y el navegador no entrega el clic. Saldo sin cambios, pila sin cambios, `data-recargas` sigue en 0, **la tarjeta sigue abierta**, no se cierra ni se reabre y **no toca la nivelación** de las IAS. Tampoco suena, porque el sonido va dentro del `onClick` de `SoundButton`.
- Aunque el clic llegara, `confirmarRecarga` vuelve a validar en la primera línea ([GameTable.jsx:1110](../../src/components/GameTable.jsx#L1110)) y sale sin hacer nada.
- **La consecuencia real:** la única salida es «No recargar» o «Salir con mis fichas», o dejar que venza el plazo. En la forzosa eso **echa de la mesa a un jugador que tiene 600 HC en el bolsillo**.

### 2.4 Nivelación de las IAS: usa el monto efectivo

[GameTable.jsx:1124-1125](../../src/components/GameTable.jsx#L1124-L1125) aplica primero `aplicarRecarga(prev, 0, monto)` y después `nivelarLasIAS(g)`. Esta última toma como referencia la **pila del humano ya recargada** ([mesaCore.js:263-271](../../src/hooks/mesaCore.js#L263-L271)), es decir, el monto que realmente se cobró. `onRecargar(monto)` descuenta ese mismo monto del saldo ([App.jsx:494](../../src/App.jsx#L494)). Si el caso 2 cobra S, las IAS se nivelan contra P + S **sin tocar nada**.

### 2.5 Qué pasa hoy con S = 0 (o S < unit)

`pideRecarga` devuelve `NINGUNA`, así que no hay burbuja y vuelve «Siguiente mano». Si además P < unit, al pulsarla `startHand` elimina al humano y se abre el **modal de bancarrota antiguo** ([GameTable.jsx:1580](../../src/components/GameTable.jsx#L1580), [2717-2735](../../src/components/GameTable.jsx#L2717-L2735)): «Te quedaste sin Heptacoins», con «Volver al lobby» y dos «Próximamente». El caso 3 forzosa de REC-2 **sustituye esa ruta** para vs IAS.

## 3. Decisiones para el rector antes de la Fase 1

- **D-1 · A-2.** Se propone cerrarlo como «no es defecto» y reformular el síntoma: P < 100 al cierre de la mano. Opcional: confirmar con Victor el subtítulo que vio.
- **D-2 · Normativo.** La regla híbrida choca con dos frases selladas de la v1.2:
  - §5.1, «Sin saldo no hay pregunta»: el caso 3 forzosa sí pregunta sin saldo, con la tarjeta de solo salida.
  - §5.2, «Los inalcanzables se apagan, no se esconden» (la lección E-2): el caso 2 pasa de tres botones a uno.
  Hace falta una **v1.3** de `AJILEI_APU-1_Reglas`. Pregunta: ¿la redacta la Fase 1 como entregable o el rector?
- **D-3 · S que no es múltiplo de la apuesta.** Puede ocurrir, porque el residuo menor que `unit` vuelve al saldo según §2.5. §5.2 y `recargaValida` exigen múltiplos. Con S = 650 en mesa 100, «Recargar todo (650)» se rechazaría. **Propuesta:** caso 2 = `floor(S / unit) · unit`, el rótulo muestra esa cifra y **0 < S < unit se trata como caso 3**. La alternativa es permitir montos que no sean múltiplo, lo que abre `recargaValida` y la regla de §5.2.
- **D-4 · El techo también limita el caso 2.** Con P alta y poco saldo, por ejemplo mesa 100, P = 4.600 y S = 600 en la voluntaria, sumar S completo pasaría el techo de 5.000. **Propuesta:** el monto del caso 2 es `topeRecarga(P, unit, S)`, que ya existe y vale `min(techo − P, S)` redondeado a la apuesta. El rótulo «Recargar todo» es exacto cuando el tope es S. Cuando lo corta el techo, ¿«Al techo ({n})»?
- **D-5 · Forma del caso 3 forzosa.** ¿Mantiene burbuja con triángulo y 15 s, como hoy, y tarjeta con solo «Salir con mis fichas»? Propuesta: sí, la misma forma, sin la fila de montos y sin el primario. El modal de bancarrota antiguo deja de ser alcanzable en vs IAS; no se borra en esta campaña.
- **D-6 · Caso 2 en la automática y la voluntaria.** La ficha lo describe sobre todo para la forzosa. Se entiende que rige también en las otras dos (en la reproducción la automática es la que más veces muestra el 0). Confirmar.

## 4. Archivos de la Fase 1

| Archivo | Para qué | Protegido |
|---|---|---|
| `src/hooks/mesaCore.js` | regla §2: `opcionesRecarga` y `pideRecarga` comparten la puerta; caso 2 y caso 3 | no |
| `src/components/GameTable.jsx` | quitar el `?? 0` (1170 y 2380), pintar lo que diga el núcleo, tarjeta de caso 3 sin montos | no |
| `src/config/textos.es.js` (+ `textos.test.js` si lista claves) | «Recargar todo ({hc})» y los dos subtítulos | no |
| `scripts/testMesaAPU1.test.js` o un `scripts/testRec2.test.js` nuevo | matriz de §4.3 | no |
| `scripts/diagDSK.mjs` | estados «caso 2» y «caso 3 forzosa» en `apu` | no |
| `src/dev/siembraAPU.js` | posible molde para llegar a S = 0 sin jugar diez manos | no |
| `src/styles/apu.css` / `rec.css` | solo si la fila de un botón pide ajuste; aditivo | no |
| `docs/AJILEI_APU-1_Reglas_v1.3.md` | según D-2 | no |

`gameEngine.js` (`aplicarRecarga`) **no se toca**: ya cobra cualquier monto entero positivo. `gameTable.css` tampoco. La tarjeta es un overlay global y no depende de `OpponentPanel` ni de `.ai-zone`. §4.5 se cubre con capturas en mesa 2 y en mesa 5.

**STOP.** A la espera de D-1…D-6.
