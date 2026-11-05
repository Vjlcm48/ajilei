# AJILEI · MOT-1 · Fase 1e · Informe · v1.0

- **Ficha:** `AJILEI_MOT-1_Fase1e_v1.0.md`. **Normativo:** `docs/AJILEI_MOT-1_Contrato_v1.0.md` (§2, §5, §7, §8).
- **Base:** `c9ec865`. **Función:** `supabase/functions/partida/`.
- **Duración hasta el STOP-1:** 10 min de reloj (19:41 → 19:51), más la lectura inicial. Tope: 2 h 30.

**En tres líneas.** La función une lo que ya existía: comprueba quién es el jugador, lee la partida, la pasa por el árbitro, la guarda con sus efectos de dinero en una sola llamada y avisa a la mesa por el canal privado. Está desplegada, con las cuatro decisiones del rector aplicadas (§3) y las comprobaciones de Victor en verde (§6), y la sonda ya no está. La partida de verdad y la recepción por el canal se prueban en la 1f.

---

## 1 · Lo que hay

| Archivo | Qué es |
|---|---|
| `supabase/functions/partida/index.ts` | Delgado: lee el entorno, crea los clientes y llama a `Deno.serve` |
| `supabase/functions/partida/nucleo.js` | El recorrido, con sus dependencias inyectadas. Exporta `crearManejador`, `crearVerificador`, `crearEmisor`, `cabecerasCors`, `sillaDeFila`, `ALGORITMOS_TOKEN`, `EVENTO_AVISO` e `INTENTOS_SIMULTANEAS` |
| `scripts/testFuncionPartida.test.js` | 87 pruebas |
| `supabase/config.toml` | `[functions.partida]` con `verify_jwt = false` |

**Dependencias de la función:** `npm:@supabase/supabase-js@2.112.4`, la misma que `eliminar_cuenta`, y `npm:jose@6.2.12`. El árbitro y `setRng` van por ruta relativa desde `src/`. El despliegue debe subir 19 archivos, 197.770 B de fuente: `index.ts`, `nucleo.js`, 9 de `src/arbitro`, 5 de `src/engine`, `ajileiConfig`, `esperas` y `partidaRapida`.

**El token.** `jwtVerify` en local contra `SUPABASE_JWKS`, sin llamar a `/auth/v1/user`. Exige `ES256`, `RS256` o `EdDSA`, `aud` y `role` iguales a `authenticated`, y `exp`. El uid sale de `sub`.

**El aviso.** `POST {SUPABASE_URL}/realtime/v1/api/broadcast` con la llave secreta en `apikey` y este cuerpo, con un tope de 3 s:

```json
{"messages":[{"topic":"partida:<mesa>","event":"version","payload":{"version":N},"private":true}]}
```

---

## 2 · Una versión por llamada

`guardar_jugada` solo admite un estado con la versión leída + 1, y `abandonarPorServidor` y `aplicarAccion` suben una cada uno. Encadenarlos daría +2 y `estado_incoherente`. El contrato pide además una sola transacción condicionada a la versión leída (§5).

Por eso, si en una llamada se aplican abandonos pedidos y una acción, todo va en un solo `guardar_jugada`, con un solo aviso, y la versión queda en la leída + 1. La versión que manda el cliente se compara con la leída: un abandono aplicado en esa misma llamada no se la deja vieja.

---

## 3 · Lo que decidió el rector al STOP-1

**1 · Intentos en el sorteo y el descarte.** La ficha decía 3. Con 5 asientos a la vez, el último puede chocar 4 veces y habría recibido `version_vieja`, que el contrato §2 prohíbe. **Decisión:** `INTENTOS_SIMULTANEAS` pasa a 5, con su prueba.

**2 · `abandonar` y `mi_sala`.** Quien abandona por la acción `abandonar` sigue viendo la mesa en `mi_sala` hasta que cobra (informe 1d-ii §7). Marcar `abandono_pedido` exigiría una RPC nueva o una escritura fuera de la transacción. **Decisión:** va a MES-PvP.

**3 · La partida muerta no siempre responde `partida_terminada`.** La 1d-ii lo daba por hecho en el siguiente rechazo, pero `leer_partida` no trae `terminada_en`. Una acción que el árbitro rechaza antes de guardar, como `fuera_de_turno`, responde ese motivo. `reclamar_vencimiento` sí recibe `partida_terminada`, porque el vencimiento ya pasó y llega a `guardar_jugada`. **Decisión:** aceptado así.

**4 · CORS.** **Decisión:** se añade `https://www.ajilei.io` a los cuatro orígenes de la ficha.

---

## 4 · Lo que el contrato no cubría y decidí

- **Abandono pedido con la acción rechazada:** el abandono se guarda y se avisa, y la respuesta es el rechazo con la versión nueva.
- **Quien no es de la mesa** no dispara los abandonos de otros.
- **Arranque:** si otro creó la partida antes, `version_vieja` y sin aviso. `asientos_distintos` da `version_vieja` con versión 0, y el cliente repite. `sala_no_activa` o menos de dos sillas dan `no_es_de_esta_mesa`.
- **`mesa` mal formada o cuerpo que no es JSON:** `no_es_de_esta_mesa`, sin llegar a la base.
- **Códigos HTTP:** 200 en todo rechazo, 401 solo en `no_autenticado`, 405 con motivo `metodo` y 500 con motivo `servidor`. Sin partida, `version` es `null`.
- **JWKS vacío, ausente o ilegible:** 500 con cualquier token. No se confunde con un token malo, y por eso la comprobación del token inventado lo delataría.
- **Sin comprobar `iss`:** la llave ya es de este proyecto, y un `iss` mal supuesto dejaría fuera a todos.
- **Sesión cerrada:** su token vale hasta que caduca. Es el precio de verificar en local.
- **Las pruebas viven en `scripts/`:** `npm test` y `aislado` no corren `supabase/`.
- **`jose` en las pruebas:** sale del `node_modules`, como dependencia transitiva del CLI. No añade ninguna dependencia nueva.

---

## 5 · Pruebas antes del despliegue

| Prueba | Resultado |
|---|---|
| `vitest` | 100/100 archivos, **2327/2327** (2240 + 87 nuevas) |
| `eslint` | Código 0, sin errores ni avisos |
| `node --input-type=module -e "await import('./supabase/functions/partida/nucleo.js')"` | Código 0 |
| Partidas por `crearManejador` contra las migraciones reales en PGlite 0.5.8, con las RPC llamadas por nombre de parámetro | **23/23 mesas con neto 0**, sin ningún 500 y con los saldos intactos: 6.791 peticiones, 2.533 llamadas a `guardar_jugada`, 11 abandonos pedidos, 25 elecciones o descartes que chocaron, 17 partidas terminadas y 6 muertas |
| Rotura a propósito, 43 cambios en el núcleo | **43 cazados,** medido con 3 intentos y antes de añadir `www`. No se repitió: esos dos cambios tienen su prueba. En la primera pasada fueron 39/43: se añadieron tres pruebas y se quitó una comprobación redundante |

**Lo que el banco no podía medir:**
- **Concurrencia real:** los choques del banco van en secuencia, porque PGlite tiene una conexión.
- **El empaquetado y el formato de `SUPABASE_JWKS`:** los despejó el despliegue (§6).
- **Un token real, las RPC por `supabase-js` contra la base real, el 202 con `private: true` y la recepción:** se prueban en la 1f.

---

## 6 · Resultados de Victor

| Paso | Resultado |
|---|---|
| Captura de las llaves JWT | La **Current es ECC (P-256)**; la HS256 queda solo como Previous. Es decir, `ES256`, uno de los algoritmos que el verificador admite |
| `npx supabase functions deploy partida --use-api --no-verify-jwt --project-ref cbbnddlapolelbdsprjm` | 19 archivos, sin error |
| Petición sin token | **401** `no_autenticado` |
| Token inventado | **401** `no_autenticado`, no 500 |
| `OPTIONS` con origen `https://ajilei.io` | **204** con `Access-Control-Allow-Origin: https://ajilei.io` |
| Sonda | Función `sonda_mot1` eliminada y carpeta `supabase/functions/sonda_mot1/` borrada a mano |

**Lo que esto prueba:** la función está en pie, empaqueta el árbitro desde `src/` y rechaza lo que debe. El 401 del token inventado, y no un 500, dice además que `SUPABASE_JWKS` llega con llaves y en una forma que el verificador acepta.

**Lo que no prueba:** que un token real pase, las RPC con la base real, el 202 con `private: true` y la recepción por el canal. Todo eso va en la 1f.

---

## 7 · Los commits

`npm run aislado -- <sha> --perfil=commit`, cada uno por separado:

| Commit | Resultado | `vitest` | `eslint` | `1.8b` y humo |
|---|---|---|---|---|
| `f5c1143` MOT-1e-a | **Verde**, 806 s | 100/100 archivos, 2327 pruebas | 0 y 0, igual a la base | Código 0 los dos |

MOT-1e-b, el commit de este informe, se prueba igual; su resultado va en el chat.

---

## 8 · Notas

**Para la 1f:**
- El aviso sale con el evento `version` en el tema `partida:<mesa>`.
- Las acciones con versión se mandan con la que el cliente cree vigente. Una respuesta `version_vieja` pide releer la vista.

**Para MES-PvP:**
- `abandonar` y `mi_sala` (§3.2): quien abandona por la acción sigue viendo la mesa hasta que cobra.

**Comentario que queda viejo:** `supabase/functions/eliminar_cuenta/index.ts:25` cita `sonda_mot1/index.ts:33-45`, que ya no existe. El código no depende de él y esa función quedaba fuera de lo permitido en esta tanda.
