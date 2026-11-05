# AJILEI · MES-PvP · Fase 1-01 · Informe · v1.0

- **Ficha:** `AJILEI_MES-PvP_Fase1-01_v1.0.md`, sub-tandas 0 y 1. **Normativo:** `docs/AJILEI_MOT-1_Contrato_v1.0.md` v1.1 (§2 y §6).
- **Base:** `de468b3`.
- **Commits:** `86dcf79` (0), `a0b5443` (1-ab), `cdba92f` (1-c) y el de este informe (1-d).

**En tres líneas.** El árbitro v1.1 ya tiene reposición, aviso de salida, pausa de anuncio, última acción y ausencia, y dos teléfonos lo jugaron de verdad con el cuadre de saldos correcto. Después de esa prueba cambiaron dos cosas, `N_AUSENCIA` de 6 a 3 y el sorteo deja de contar para la ausencia: las cubren las pruebas y se verán en real en la próxima sub-tanda. La función publicada no los tendrá hasta el `deploy` de Victor, que va antes del push.

---

## 1 · Lo que hay

| Archivo | Qué es |
|---|---|
| `src/config/esperas.js` | Las cifras nuevas; sale `REVELACION_MS` |
| `src/arbitro/reloj.js` | Cuatro clases de vencimiento nuevas, `esperaReposicion`, `llevaAnuncio` y `esperaManoSiguiente` |
| `src/arbitro/sorteo.js` | Cada ronda nace en `BARAJADO`, y `volteo[].posicion` |
| `src/arbitro/partida.js` | `volver_anuncio`, pausa de anuncio, reposición, aviso de salida, ausencia y `ultimaAccion` |
| `src/arbitro/vista.js` | `contribMano`, `enAnuncio`, `ausente`, `ultimaAccion` y `posicion`, con valor por defecto para estados viejos (R-4) |
| `src/arbitro/motivos.js`, `src/arbitro/index.js` | El motivo `ya_volvio` y las exportaciones nuevas |
| `supabase/functions/partida/nucleo.js` | `volver_anuncio` como acción simultánea, y `ahora` en toda respuesta |
| `src/lib/partidaCliente.js`, `src/screens/PartidaPvP.jsx` | En el panel `?mot1`: «en anuncio», «ausente», la última acción y «Volví del anuncio», sin estilos nuevos |
| `src/arbitro/arbitro.test.js`, `src/arbitro/esperas.test.js`, `scripts/testFuncionPartida.test.js`, `src/lib/partidaCliente.test.js`, `src/screens/PartidaPvP.test.jsx` | Sus pruebas |

Sin migración: `guardar_jugada` y `crear_partida` solo leen `version` de `p_estado`, y los tipos de efecto no cambian. No se abrió ningún protegido.

---

## 2 · Cifras

| Constante | Valor | Estado |
|---|---|---|
| `VOLTEO_SORTEO_MS` | 4000 ms | provisional |
| `RED_REVELACION_MS` | 6000 ms | provisional |
| `LECTURA_TRAS_REVELACION_MS` | 2000 ms | provisional |
| `MANO_SIGUIENTE_MS` | 4000 ms | provisional |
| `REPOSICION_SIN_CARTAS_MS` | 600 ms | provisional; la animación de la sub-tanda 3 debe caber aquí |
| `AVISO_SALIDA_MS` | 3000 ms | provisional |
| `PAUSA_ANUNCIO_MS` | 45000 ms | contrato §6 |
| `AUSENTE_DESDE` | 2 | provisional |
| `N_AUSENCIA` | **3** (era 6) | provisional |

La espera entre manos se queda como está (decisión de Victor tras los teléfonos).

---

## 3 · Resultados de Victor

S25 con `test1976` y Motorola con `ticotest2022`, por túnel con `?mot1=1`, mesa privada de 2. Resultado: **todo bien.** Sorteo, última acción, pausa de anuncio en la mano 5 con «Volví del anuncio», ausente y abandono, y el cuadre de saldos en los dos teléfonos.

**Lo que no cubre esa prueba:**

| Punto | Lo que consta |
|---|---|
| `N_AUSENCIA` = 3 | Se probó con 6. El cambio llegó después y, por decisión del rector, no se repitió |
| El sorteo no cuenta | Se probó con el sorteo contando. Se verá en real en la próxima sub-tanda |
| Mano 11: nadie pulsa y arranca a los 45 s | Estaba en el guion y no consta en el resultado. Lo cubren las pruebas |

---

## 4 · Lo que se decidió en esta tanda

**Del rector y de Victor, tras los teléfonos:**

1. **`N_AUSENCIA` pasa de 6 a 3.** Abandono al 3.er vencimiento propio seguido; «ausente» sigue desde el 2.º. Puede caer en una sola mano: `BET_2`, descarte y `BET_3`.
2. **El sorteo no cuenta para la ausencia.** Solo cuentan apuesta y descarte. Quien no elige recibe la posición 0, sin falta (`partida.js`, caso `ELECCION_SORTEO`). Contrato §6 al día.
3. **`docs/reportes/AJILEI_MES-PvP_Fase0_Informe_v1.0.md`** entra en el commit documental.
4. **Tres commits en vez de cuatro:** `testFuncionPartida.test.js` no se reparte, y el árbitro y la función van juntos.

**Aceptadas en el STOP-0:** reposición en `DISCARD` con el resultado guardado, retirada en el vencimiento que abandona, cierre de la pausa con uno o menos que siga, y `ultimaAccion` sin pisar.

**Aprobadas en el STOP-1:**

- Quien cobra al abrirse la pausa no se marca eliminado hasta `startHand`, para que dispare `aviso_salida`. El rector pidió confirmar ese intervalo: no actúa, no recibe cartas y no cuenta para el reloj ni para el orden. Lo prueba el bloque `quien cobra al abrirse la pausa, hasta que startHand lo elimina` de `arbitro.test.js`. **Salvedad:** sí puede enviar `reclamar_vencimiento` a la hora, como cualquier asiento no abandonado (K-7). No se ha pedido cambiarlo.
- `AUSENTE_DESDE` como constante propia.
- `RED_REVELACION_MS` duplicada, porque el árbitro no puede importar `mesaCore.js`; una prueba comprueba que coincidan.
- `posicion ?? null` para los estados viejos.
- `sinAnuncio` siempre falso al crear la partida, porque Premium aún no existe. La ruta sin anuncio está probada.

---

## 5 · Límite conocido: la mesa parada

**Si nadie reclama el reloj, la mesa se queda parada hasta el barrido.** Ocurre cuando todos los jugadores han cerrado la app o quedan abandonados a media mano: el reloj lo reclaman los clientes (K-7), así que sin ninguno no avanza. Con `N_AUSENCIA` en 3 se llega antes.

- **Salida:** a los 15 min sin cambiar de versión, `barrer_salas` cierra la partida (contrato §6, «Partida muerta»; cifra provisional).
- **Dinero:** no se pierde. La mano en curso se anula y cada asiento no cobrado recibe la pila de la última mano cerrada.
- **Decisión:** se queda como está (rector y Victor). Este comportamiento ya existía; esta tanda no lo ejercitó de nuevo.

---

## 6 · La prueba intermitente

`el azar se fija en cada jugada…` (`scripts/testFuncionPartida.test.js`, desde `f5c1143`) daba rojo al azar. **Era de la prueba, no del producto.**

- **Causa:** `montar` crea la partida sin semilla y la prueba da por hecho que la primera ronda cierra. Si las posiciones 0 empatan se abre otra ronda: `expected 'barajado' to be 'cerrado'`. Medido: 7,70 % de empates en 20.000 partidas, el 3/39 teórico.
- **El producto sí lo resuelve:** hasta 3 rondas y, en la tercera, el azar (`sorteo.js:45-47`, `partida.js:299-304`). Lo cubren `en el empate solo participan los empatados…` y `la tercera ronda empatada la decide el azar…`.
- **Arreglo:** `setRng(semilla(1))` antes de `montar`. Esa semilla no empata.

**Los dos rojos sin nombre** salieron de 10 pasadas de `npm test -- src/arbitro`. Ese filtro no estrecha: `npm test` ya lleva `scripts/ src/` y corre los 102 archivos, así que esas pasadas incluían esta prueba. No se guardaron sus nombres, de modo que la atribución es por deducción:

| Pasadas de vitest entero | Resultado |
|---|---|
| Sin la semilla, 40 | 1 rojo, esta prueba |
| Con la semilla, 130 seguidas | Ninguno. Descarta otra intermitente de más de un 2 % aproximadamente, no una más rara |
| Cierre pedido por el rector, 20 de esas 130 | 20/20 |

Los 5 rojos con nombre de toda la tanda fueron esta prueba.

---

## 7 · Pruebas

Las pruebas que avanzan por reloj ponen `vencidos` a 0 (`aCero`, `hasta`, `pasos`): con la ausencia en 3, apenas dos rondas de apuesta y un descarte abandonarían a todos. En la prueba de propiedad, la semilla 37 juega sin ausencia, para que la bancarrota y su aviso sigan pasando por ahí.

| Vara | Resultado | Sobre |
|---|---|---|
| `aislado --perfil=commit` | Verde: vitest 102/102 archivos, 2405 pruebas; eslint 0 errores y 0 avisos; `1.8b` y humo código 0 | `a0b5443` |
| `aislado --perfil=commit` | Verde: vitest 102/102 archivos, 2407 pruebas; eslint 0 errores y 0 avisos; `1.8b` y humo código 0 | `cdba92f` |
| `npm run varas -- --solo apu,u3,msg` | Verde | STOP-1, con `N_AUSENCIA` en 6 y el sorteo contando. No se repitió |
| `npm run banco:verificar` | Verde: 87/87 celdas | STOP-1, igual |

Los dos cambios posteriores solo tocan `src/config/esperas.js` y el vencimiento de la elección en `src/arbitro/partida.js`.

---

## 8 · Pendiente

- **El `deploy` de Victor, después de los commits y antes del push.** Hasta entonces, la función publicada sigue con `N_AUSENCIA` en 6 y contando el sorteo:

  ```
  npx supabase functions deploy partida --use-api --no-verify-jwt --project-ref cbbnddlapolelbdsprjm
  ```

- **El push**, que lleva también `86dcf79`.
- **Ver en real** `N_AUSENCIA` = 3 y el sorteo sin contar, en la prueba de la próxima sub-tanda.
- **Sub-tanda 9:** Invariantes con Tienda v1.3 → v1.4.
