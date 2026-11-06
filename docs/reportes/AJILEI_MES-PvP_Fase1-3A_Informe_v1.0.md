# AJILEI · MES-PvP · Fase 1-3A · Informe · v1.0

- **Ficha:** `AJILEI_MES-PvP_Fase1-3A_v1.0.md`, sub-tanda 3-A, «El abandono y la pantalla final». **Normativo:** `docs/AJILEI_APU-1_Reglas_v1.7.md` §8.2 y §8.3, y `docs/AJILEI_MOT-1_Contrato_v1.0.md` v1.2.
- **Base:** `db0313b` (sub-tanda 3, publicada).
- **Commits:** 3A-a `8d8b2ff` (documentos), 3A-b `88040b7` (árbitro), 3A-c `35422d7` (cliente), 3A-d `d7a954e` (arnés) y el de este informe (3A-e).
- **Deploy:** Victor desplegó la función `partida` tras el STOP-A. No hubo migración ni campo nuevo en el contrato de la vista.

**En tres líneas.** Abandonar ya es retirarse en el acto, en cualquier fase: el que se queda deja de jugar contra un ausente, y si queda uno solo la partida termina en la misma jugada. Quien se va cobra su pila del momento, nunca más. La pantalla final dice la verdad del dinero: celebra solo con resultado positivo, y la frase dice cómo terminó la partida.

---

## 1 · La sonda (STOP-S), sobre `db0313b`

La sonda fue de solo lectura y no quedó escrita en el repo. Este es su resumen. Los dos fallos que vio Victor salían de dos decisiones del diseño, no de un descuido:
- La C-8 vieja decía que quien abandona a mitad de mano «no mueve dinero y sigue disputando lo que puso». No se retiraba hasta que le llegaba el turno.
- La mesa decidía la victoria solo por quién quedaba en pie, sin mirar el dinero. Por eso salió «Arrasaste» con −1.300.

### A · Los caminos que producen «Abandonó»

1. **La ✕:** `abandonar` → `aplicarAccion` → `marcarAbandono`.
2. **El 3.er vencimiento** (`N_AUSENCIA = 3`): `contarVencidos` marca `abandonado` sin pasar por `marcarAbandono`. En su turno de apuesta se retiraba; en su descarte, descartaba vacío y seguía en la mano. El vencimiento del sorteo no cuenta.
3. **Sentarse en otra mesa:** `cerrar_partida_abierta(uid, 'reemplazada')` marca `partida_asientos.abandono_pedido`. La función lo aplica en la siguiente llamada de cualquier asiento de esa mesa (`abandonarPorServidor`).

No producen «Abandonó» la partida muerta (15 min sin jugadas, escena `muerta`) ni eliminar la cuenta, que está bloqueado con partida viva.

### B · Los casos frente a R1-R3, antes

R1: abandonar es retirarse. R2: la partida termina cuando quedan menos de 2 sentados. R3: quien abandona cobra su pila, nunca más.

| Caso | En `db0313b` | R1 | R2 | R3 |
|---|---|---|---|---|
| Mesa de 2 · apuesta, le toca al que se va | Se retira y el otro cobra; `GAME_OVER` tras 4 s de pago | ✔ | tarde | ✔ |
| Mesa de 2 · apuesta, le toca al que se queda | El que se queda juega con su reloj contra un ausente. Si deja vencer frente a una apuesta, **el que se fue gana el pozo** (reproducido: cobró 1.600 sobre 1.500). All-in: showdown contra el ausente | ✘ | ✘ | ✘ |
| Mesa de 2 · descarte (el caso de Victor) | El que se va descarta vacío; el que se queda descarta con su reloj, y siguen la reposición y la apuesta 3 | ✘ | ✘ | posible ✘ |
| Mesa de 2 · pago entre manos | Cobra ya; la partida termina al vencer `MANO_SIGUIENTE` | — | tarde | ✔ |
| Mesa de 2 · barajado o reparto | Cuenta como mano en curso: juega como en la apuesta | ✘ | ✘ | posible ✘ |
| Mesa de 2 · pausa de anuncio o sorteo | Cobra y la partida termina en el acto | — | ✔ | ✔ |
| Mesa de 3 · el 1.º abandona a mitad de mano | Sigue en la mano hasta su turno, o hasta el showdown si está all-in, y puede ganar | ✘ | ✔ | posible ✘ |
| Mesa de 3 · después abandona el 2.º | El último juega contra un ausente; `GAME_OVER` tras la espera | ✘ | ✘ | posible ✘ |

### C · El dinero

- **La contabilidad cuadra siempre, por construcción:** `aplicar_efectos` exige `mesa_cuadra`; al terminar, todos cobrados y neto de la mesa 0; cada asiento cobra una sola vez (`liberacion_pvp:<sala>:<uid>:salida`).
- **El reparto no era el de R1:** quien se iba podía disputar y ganar el pozo.
- **El −1.300 de Victor cuadraba con la pantalla:** el problema era la pantalla que lo celebraba, no el libro.

---

## 2 · Lo que cambió

### El árbitro (3A-b, `src/arbitro/partida.js` y `vista.js`; motor y `pozos.js` cerrados)

- **`retirarEnMano`:** todo abandonado que siga en la mano se retira en el acto. En su turno de apuesta, por el motor (`retirarse`). Fuera de él, se pliega sobre el motor. En la reposición, lo calculado (la apuesta 3 o el showdown) se recalcula sin él. En el reparto, el turno se recalcula para que la ronda no abra en él.
- **Si queda uno en la mano,** cobra el pozo por la ruta de los retiros (`pagarAlUltimo`: `ganadoresPorCapa` + `repartirCapas`, el mismo resultado que `resolveWinner`). Lo que nadie igualó vuelve al que se retira (D-7).
- **`terminarSiQuedaUno`:** con menos de 2 sentados, `GAME_OVER` en la misma jugada. El fin conserva los datos de la mano que lo cerró, y `vista.finConPago` publica su `resultado` en la vista del fin, con la forma de siempre.
- **Las tres vías** (✕, 3.er vencimiento, otra mesa) van por el mismo camino.
- **Quien se va cobra su pila al cierre de su mano** (`cerrarMano` → `sacarAbandonados`), sin nada del pozo, o en el acto si no hay mano en curso.

La tabla B, ahora (todas las filas con R1, R2 y R3 en ✔; en la mesa de 3 con un solo abandono, R2 no aplica):

| Caso | Ahora |
|---|---|
| Mesa de 2 · apuesta (cualquier turno), descarte, reposición, barajado y reparto | Se retira, el otro cobra el pozo y la partida termina en la misma jugada |
| Mesa de 2 · pago entre manos | Cobra en el acto y la partida termina; la vista lleva `resultado` |
| Mesa de 2 · pausa o sorteo | Fin en el acto, como antes; en el sorteo `resultado` es `null` |
| Mesa de 3 · primer abandono | Se retira; la mano sigue entre los otros dos y él cobra su pila al cerrarse |
| Mesa de 3 · segundo abandono | El que queda cobra y la partida termina en la misma jugada |
| Showdown ya calculado (reposición) | Se recalcula sin él |

### El cliente (3A-c, todo detrás de `partida`)

- **R4, el tono:** sale del signo de `cobrado − entrada`. Positivo: `PantallaVictoria` con lluvia. Cero: neutro. Negativo: sobrio, la cifra en rojo (`--lose-red`) y sin lluvia.
- **R4, la frase** (`finDePartida`, `vozHumanos.js`):
  1. «Saliste de la mesa»;
  2. «Te quedaste sin fichas»;
  3. «Te quedaste solo: {nombre} abandonó la mesa»;
  4. «Te quedaste solo en la mesa»;
  5. con todas las fichas, las frases de victoria al azar.
- **El óvalo:** «{nombre} abandonó la mesa.» y, si termina, «… La partida termina.».
- **El pago entero antes del final** (`mesaPvPCore`):
  - **A.** La vista del fin trae `resultado`: pago sintético de `MANO_SIGUIENTE_MS`, o revelación más lectura si hubo showdown.
  - **B.** Ya se veía un pago: termina a su hora.
  - **C.** Sin pago (pausa): el aviso se queda `AVISO_FIN_MS` = 2,5 s.
  - En el sorteo no se retiene nada.
- **Quien abandona o quiebra** va a su pantalla final en el acto, y no cambia aunque lleguen vistas nuevas. La escena `fuera` y sus textos desaparecen.
- **La cifra del fin** vive en `pvp.css` (`.pvp-fin-cifra`), porque `gameTable.css` es protegida. Es provisional.

### El arnés (3A-d)

- Escenas nuevas en `diagDSK pvp`: `final-negativo` (el caso de Victor), `final-cero` (abandono en el sorteo) y `final-todas`. `final-fuera` se redefine como el abandono propio, en toda mesa. Son 25 escenas.
- `abandonar-en-vivo` mira el caso 1, el tono sobrio sin lluvia y que la pantalla no cambie.
- El bloque de los fines mide frase, tono, cifra y lluvia, con capturas a 412×915.

**`partidaImitada` en tres commits.** La escena depende del árbitro y de `escenaDe` a la vez. Con la versión final solo en 3A-d, los árboles de 3A-b y 3A-c fallaban en `partidaImitada.test.js`. Por eso:
- en 3A-b, `abandono` y `final-fuera` piden mesa de 3;
- en 3A-c, la pantalla de `final-fuera` pasa a `final`;
- en 3A-d entra el resto.

Cada árbol intermedio se probó antes del commit, sin fallos.

### Peso y varas

`1.8b`: **176,9 KiB en `db0313b` y 176,9 KiB después** (JS 149,2; CSS 21,1).

| Vara | Resultado | Sobre |
|---|---|---|
| `npm test` | 105 archivos, 2.693 pruebas en verde; árbitro 89/89 | Árbol final |
| eslint | 0 mensajes; sin aviso nuevo del compilador de react-hooks | Árbol final |
| `diagDSK pvp` | Verde: 20/20 celdas, 32/32 escenas | Árbol final |
| `apu`: 7 celdas + `rec2` + `voz3` | Verde, las 9: 360x640 5:09, 640x360 4:21, 844x390 4:20, 1024x768 4:20, 1280x720 4:21, 1366x768 4:21, 1920x937 4:21, rec2 10:08, voz3 1:11 | Árbol final |
| `u3`, `congelado`, `rec` | Verde: 7:38, 1:48 y 15:58 | Árbol final |
| `tab.frase`, `tab.resto` | Verde: 9:20 y 20:22 | Árbol final |
| `msg` | Solo el rojo conocido: el barrido «Heptacoins» con 0 medidas. Compositor 92, jugado 7/7, fin 1/1, Δ 7/7, caza 2/2 (18:57) | Árbol final |
| Árboles intermedios | Vitest y eslint verdes en 3A-a, 3A-b, 3A-c y 3A-d (worktree sobre `db0313b`) | Antes de los commits |
| `aislado --perfil=commit` | Verde en 3A-a (2.643 pruebas), 3A-b (2.652), 3A-c (2.677) y 3A-d (2.693): build, vitest 105/105 archivos, eslint igual a la firma, `1.8b` y humo; de 803 a 811 s cada uno | Cada commit |

El control de las IAS corrió sobre un árbol con el mismo código que el final: después solo cambiaron documentos. El rojo de `msg` también sale sobre `7cac208` limpio (informe de la sub-tanda 2, §7). No cuenta.

### Decidido fuera de la ficha (aceptado tras el STOP-V)

1. El mecanismo del pago antes del final (casos A, B y C); la única espera nueva es `AVISO_FIN_MS` = 2,5 s.
2. Si todos los de la mano se van a la vez (varios 3.er vencimientos en un mismo descarte), el más cercano a la Mano no se retira y cobra. Sin esto `doShowdown` revienta; lo encontró la prueba de propiedad de la mesa de 5. Declarado en INV-85.
3. Lo que nadie igualó vuelve al que se retira (D-7), como a cualquiera que se retira.
4. Los avisos en plural (`pvp.abandono.*.varios`).
5. Quien quiebra con la mesa todavía viva va a su final en el acto (caso 2).
6. Las escenas de `partidaImitada`: `abandono` pide mesa de 3; `final-fuera` se redefine.
7. `CLASE_MANO_SIGUIENTE` exportada en `partidaCliente.js`.
8. El Contrato no tenía la etiqueta «C-8» ni una lista de pendientes v1.2: la tabla del §7 va rotulada C-8, y los pendientes pasan a v1.3.

El §4 de `AJILEI_Invariantes_v1.0.md` ya cita las Reglas v1.7 (pedido del rector en el STOP-V).

---

## 3 · La prueba de Victor

**Por túnel, el 2026-11-06, tras el deploy de la función `partida`.** Los tres casos de la ficha §7, en verde, con el comportamiento sellado en pantalla:
1. **Mesa de 2, abandono en el descarte.**
2. **Mesa de 2, abandono cuando le toca apostar al que se queda.**
3. **Mesa de 3 con la PC:** uno abandona a mitad de mano y la mano sigue entre los otros dos sin él; después abandona el segundo y la partida termina.

### La nube

Consulta de solo lectura en el SQL Editor, sobre las partidas desde las 12:00 de Chicago:

```sql
-- MES-PvP 3-A · STOP-V (SOLO LECTURA)
with params as (
  select timestamptz '2026-11-06 12:00 America/Chicago' as desde
),
mesas as (
  select p.sala_id, p.creada_en, p.terminada_en, p.estado
    from public.partidas p, params
   where p.creada_en >= params.desde
     and exists (select 1 from public.partida_asientos a
                   join public.profiles pr on pr.id = a.uid
                  where a.sala_id = p.sala_id
                    and pr.username in ('test1976', 'ticotest2022'))
)
select
  m.sala_id,
  to_char(m.creada_en    at time zone 'America/Chicago', 'HH24:MI:SS')    as partida_creada_chi,
  to_char(m.terminada_en at time zone 'America/Chicago', 'HH24:MI:SS')    as partida_terminada_chi,
  pr.username,
  a.asiento,
  (m.estado -> 'asientos' -> a.asiento::int ->> 'abandonado')::boolean   as abandono_arbitro,
  a.abandono_pedido,
  a.entrada,
  a.liberado,
  a.cobrado,
  a.liberado - a.entrada                                                  as resultado_asiento,
  sum(mv.monto) over (partition by m.sala_id, a.uid)                      as resultado_libro,
  (select sum(x.liberado - x.entrada) from public.partida_asientos x
    where x.sala_id = m.sala_id)                                          as suma_mesa,
  to_char(mv.creado_en at time zone 'America/Chicago', 'HH24:MI:SS')      as mov_hora_chi,
  mv.tipo,
  mv.monto,
  mv.saldo_tras
from mesas m
join public.partida_asientos a on a.sala_id = m.sala_id
join public.profiles pr        on pr.id = a.uid
left join public.movimientos mv
       on mv.jugador_id = a.uid
      and mv.ref_tipo = 'sala'
      and mv.ref_id = m.sala_id::text
order by m.creada_en, a.asiento, mv.creado_en, mv.id;
```

| Sala | Mesa | Quién se fue (`abandono_arbitro`) | Resultado por asiento | `resultado_libro` = `resultado_asiento` | `suma_mesa` |
|---|---|---|---|---|---|
| `52866584` | 2 | test1976 | test1976 −800 · ticotest2022 +800 | ✔ | 0 |
| `265a1ef8` | 2 | ticotest2022 | ticotest2022 −600 · test1976 +600 | ✔ | 0 |
| `31ec9a83` | 3 | test1976 y ticotest2022 | test1976 −800 · ticotest2022 −1.100 · nena82 +1.900 | ✔ | 0 |

`abandono_arbitro` sale en verdadero solo en quien se fue.

**R3, leído en el código:** si el primero se va en una mano anterior, su liberación sale al cerrarse esa mano y no al final (`cerrarMano` → `sacarAbandonados`, `partida.js:128-131`; prueba `arbitro.test.js:1363`), así que las dos de `31ec9a83` a las 13:25:33 dicen que los dos se fueron en la mano final.

### Para la ficha del árbitro v1.3

«Quien quiebra va a su final en el acto» (caso 2, `escenaDe`) cambiará cuando exista la recarga PvP.

---

## 4 · Pendiente

- **Árbitro v1.3** (Contrato v1.3 y deploy), con la sub-tanda de la recarga: la reposición uno a uno, el volteo del sorteo de 5 s y la nota de §3 sobre quien quiebra.
- **Lámina L-M:** lo que ya tenía (sorteo sobre la mesa, mensajes de la mesa, transición entre manos y recorte de nombres).
- **La línea de la cifra del fin:** provisional en `pvp.css`; espera su diseño.
- **Higiene:** el barrido «Heptacoins» de `msg`.
