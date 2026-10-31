# AJILEI — Menú de Utilidades v1.6

**Estado:** Revisión de especificación. Sustituye a `AJILEI_Menu_Utilidades_v1.5.md`, que queda como historial.
**Fecha:** 2026-10-30
**Nace en:** CFG-1, Fase 1e (ficha `AJILEI_CFG-1_Fase1e_v1.0.md`, con las respuestas del rector al STOP-E1).
**Naturaleza:** **Delta sobre la v1.5.** Todo lo que esta revisión no cambia sigue vigente como está escrito en la v1.5 y, a través de ella, en la v1.4 a la v1.0: el disparador ⋮, el panel flotante `fixed` z:30 de solo iconos, la doctrina D6 de satélites, el circuito de Reacciones, Tapetes, la frontera de Mano actual con la banda «Tu mejor palo» y el desglose desde la fuente única. **Lo que cambia es qué entradas hay y que Mano actual se paga.**
**Lo vigilan:** `diagDSK cfg` (cfg.menu, cfg.consulta y cfg.rapida), `diagDSK u1`, `diagDSK u3`, `diagDSK menu-movil`, `scripts/testConsultas.test.js`, `src/lib/partidaRapida.test.js`, `src/dev/bancoImitado.test.js` y, en el servidor, `supabase/pruebas/cfg1e_verificacion.sql`.

---

## 1. Las entradas

| | v1.5 | **v1.6** |
|---|---|---|
| 1 | Sonido | Sonido |
| 2 | Reacciones | Reacciones |
| 3 | Tapetes | Tapetes (hasta la 1f, que lo lleva al ⚙) |
| 4 | Cuenta (la figurita, SUP-2b) | **sale** |
| 5 | Saldo (la Heptacoin inerte) | **Partida rápida**, en su sitio |
| 6 | Mano actual | Mano actual, **de pago** |

- **«Cuenta» sale.** El perfil tiene sus tres puertas desde CFG-1 1b (la barra, la cabecera de la hoja ⚙ y «Editar» del mini-perfil propio), y cerrar sesión vive en el ⚙. El Bautizo en modo edición ya no se monta desde la mesa: `GameTable` recibe de la cuenta sólo el nombre y el correo que pinta el mini-perfil de la victoria.
- **«Saldo» sale.** Era la Heptacoin inerte bajo la figurita, el interruptor «Saldo visible/oculto» de agosto de 2026. Lo sustituyó el ojito de la píldora del lobby (INV-69).
- **Los IDs `saldo` y `cuenta` quedan retirados** (`src/config/menuEntradas.js`): no se reutilizan.
- **El panel mide 64 × 244 con cinco filas, en todas las pieles.** `altoPanel(filas) = filas × 44 + 24` (`menuEntradas.js`) es la cifra que espeja la pinza (`useUtilitiesMenu.js`) y la que sella el arnés. Contra humanos monta sin «Partida rápida»: cuatro filas, 200.
- **Se acaba la excepción del móvil horizontal.** SUP-2b quitaba «Cuenta» en esa piel porque seis filas (288) no cabían en el corredor izquierdo (245,72 px libres a 640×360). Con cinco filas en todas las pieles, el segundo eje del panel (qué entradas montan) queda sólo por función: `presentesDe(contraIAS)`.
- **El `title` dice el nombre de la entrada y nada más** (regla de U1b). El estado va en el nombre accesible (`aria-label`, p. ej. «Mano actual · 13 gratis») y en una **pastilla** de la esquina de la fila.

### 1.1 La pastilla de estado

- Hermana del badge del contador de U1b: la misma caja de 18 de alto, arriba a la derecha de su fila, con el mismo filete y la misma cifra en el oro de la casa (un solo oro, INV-08).
- **No se toca** (`pointer-events: none`): es una lectura y no le roba toques a su entrada.
- La llevan «Partida rápida» («Sí»/«No») en las dos pieles y «Mano actual» en móvil, donde el badge no monta (v1.5 §7.1). En escritorio, la cifra de Mano actual sigue en el badge de U1b, con su popup.
- Vive en `src/styles/utilidadesMesa.css`, sin puerta de piel: es nueva e igual en las dos, así que no es una cuarta copia (v1.5 §7.3).

---

## 2. Partida rápida (INV-70)

- **Sólo contra las IAS.** Contra humanos no aparece: el ritmo lo decide el anfitrión al armar la mesa (MES-PvP). `GameTable` lo sabe por su prop `contraIAS`, `false` por defecto para que una mesa nueva no la herede sin decidirlo. Hoy la monta así sólo la mesa contra las IAS de `App`.
- **Es un interruptor como el sonido.** Cierra al ejecutar. Apagada lleva `is-off` y el icono atenuado, y su pastilla dice «No».
- **Se recuerda en el aparato:** `ajilei.partidaRapida`, `'si'`/`'no'`, por defecto no (`src/lib/partidaRapida.js`).
- **Se lee una vez por mano y se congela.** Se lee en `commitNewHand`, del aparato, y se guarda en un ref (`factorManoRef`) para toda la mano. Cambiarla a mitad de mano no toca la mano en curso.
- **Qué acelera, ×0,5:**
  - el **vuelo de cada carta del reparto** (0,595 → 0,2975 s), en el primer reparto y en el segundo;
  - las **esperas del segundo reparto** (`DEAL_3`): los volteos del humano a 300/600/900 → 150/300/450 ms, y el avance a 2000 → 1000 ms.
- **Qué no toca:**
  - **el barajado de 1,95 s**: el `setTimeout` de 1950 de `commitNewHand` va sincronizado con `fanOut 1.95s` de `gameTable.css`, que es protegido;
  - el volteo en sí (`.card-flip-anim`, 0,30 s, `gameTable.css`);
  - el vuelo del descarte (0,75 s);
  - las pausas del primer reparto (120 y 400 ms);
  - el ritmo de las IAS, el reloj del turno, la revelación y la celebración.

---

## 3. Mano actual de pago (INV-75)

### 3.1 La regla

- **Veinte consultas gratis por jugador, de por vida**, con el contador en el servidor (tabla `consultas`), no en el aparato. La clave `ajilei.consultas` del aparato se retira.
- **La mano es la unidad**, también para las gratis (rector, STOP-E1 P-1). La primera consulta de una mano gasta una gratis o se cobra. Las siguientes de esa misma mano no gastan nada (`repetida`).
- **Precios por mano:** Básico 100 · Avanzado 200 · Pro 300 · Humanos 500 HC. «Humanos» queda **durmiente** hasta MES-PvP. Da igual el tamaño de la mesa.
- **El precio sale de la mesa**, en el servidor (`mesas_ia.reto`). El cliente no manda ni el nivel ni el precio.
- **El cobro lo hace el servidor** con `aplicar_movimiento`: tipo `consulta`, clave `consulta:<mesa>:<mano>` y la nota «Mano actual · Básico/Avanzado/Pro». La clave hace que una mano se cobre una sola vez, aunque se vuelva a ella después de consultar otra (`pagada`).
- Límite: 30 llamadas por minuto (Reglas ECO-1 §7).

### 3.2 Lo que ve el jugador

- **La entrada dice siempre el contador o el precio**, en su nombre accesible y en su cifra (el badge en escritorio, la pastilla en móvil):

  | Estado | Nombre accesible | Cifra |
  |---|---|---|
  | quedan gratis | «Mano actual · 13 gratis» | 13 |
  | sin gratis | «Mano actual · 100 HC» | 100 |
  | mano en curso pagada | «Mano actual · pagada» | ✓ |

  Antes de que el servidor conteste, sin cifra.
- **Al tocar:**
  - Si quedan gratis, o es la última mano consultada, se abre la ventana sin preguntar. La última mano no vuelve a llamar al servidor.
  - Si va a cobrar y es **el primer cobro de la sesión** (`ajilei.consultaConfirmada` en `sessionStorage`), sale la confirmación de un toque: «Consultar tu mano cuesta 100 HC. Las demás consultas de esta mano son gratis.» · «Cancelar» / «Consultar». Es de la familia de «Eliminar cuenta», sin el rojo (`ConfirmarConsulta.jsx`).
  - Ya confirmado una vez en la sesión, cobra directo.
- **Sin saldo:** el aviso de una línea «No te alcanza: {precio} HC», sin ventana. Si la billetera que conoce la mesa no alcanza, el aviso sale sin preguntar ni llamar. Si el servidor contesta `saldo_insuficiente`, sale el mismo aviso.
- **Sin sesión, sin red, mesa inválida o límite:** «No se pudo consultar», y no se escribe nada.
- **La última línea de la ventana** dice:
  - «Te quedan N consultas gratis», «Te queda 1 consulta gratis» o «Ya no te quedan consultas gratis»;
  - con la mano pagada: «Mano pagada: vuelve a mirarla gratis».
- **El recorrido dorado** (el cometa de EMB-1, `embellecimiento.css`) rodea el borde de la ventana **sólo mientras la mano está pagada** (`data-pagada`). Con una consulta gratis, y en el aviso de una línea, el filete queda quieto. Es un pseudo-elemento: Δ=0 de layout.
- **Tras un cobro**, el saldo que contesta el servidor pasa a la billetera (`tomar`), así que la mesa y la píldora lo saben.
- **La ventana y el desglose no cambian.** Salen de la misma fuente que la banda «Tu mejor palo»; no hay una segunda calculadora.

### 3.3 La limitación declarada (§0-6 de la ficha)

Hasta MOT-1 el servidor no sabe qué mano se juega contra las IAS, así que «la misma mano» se la dice el cliente: el par (mesa del servidor, «Mano #N» del marcador). Un cliente tramposo podría repetir el número de mano para no volver a pagar.

- **El contador de las 20 gratis sí es inatacable:** vive en el servidor.
- **La mesa sí se comprueba:** abierta y del jugador.
- MOT-1 cierra el hueco cuando el árbitro conozca las manos.

### 3.4 En el servidor

- Migración: `supabase/migrations/20261030193000_cfg1e_mano_actual.sql`.
- Tabla `consultas`: una fila por jugador, con `gratis_usadas` (0–20) y la última mano consultada (`ultima_mesa`, `ultima_mano`). Lleva RLS sin políticas y ningún privilegio para el cliente.
- Funciones: `consultas_gratis()`, `precio_consulta(text)`, `consultar_mano(uuid, integer)` y `mi_consulta()`.
- Lo verifica `supabase/pruebas/cfg1e_verificacion.sql` (19 filas): en el corredor antes del push y en el SQL Editor después.

---

## 4. Límites documentados

- **El reloj del turno no se detiene** mientras la confirmación del primer cobro está abierta (`#root` queda inerte). Es una pregunta de un toque, como lo era el Bautizo en edición que vivía en la mesa.
- **Una mano anterior consultada gratis gasta otra gratis** si se vuelve a ella, porque sólo se recuerda la última. En el juego las manos sólo avanzan. Aceptado por el rector en el STOP-E1.
- **La consulta se paga de la billetera, nunca de la pila de la mesa.** Con la billetera corta y fichas en la mesa, el aviso es «No te alcanza» tal cual (decisión de Victor tras la prueba C de la 1e).
- **Tapetes ya tiene sus 44.** En `u1` medía 63×35 porque lo tapaba el SVG de «Cuenta», que no tiene tamaño; con «Cuenta» fuera mide 63×44 en las siete celdas táctiles. El hueco de INV-07 se cierra sin tocar Tapetes, que sale del ⋮ en la 1f.

---

## 5. Historial de versiones

- **v1.6** — 2026-10-30. **CFG-1 1e.**
  - Salen «Cuenta» y «Saldo», y entra «Partida rápida» (sólo contra las IAS, congelada por mano, ×0,5 en el vuelo y en las esperas del segundo reparto, el barajado intacto).
  - Mano actual pasa a ser de pago: 20 gratis en el servidor, la mano como unidad, precio por nivel, confirmación del primer cobro de la sesión y el recorrido dorado sólo con la mano pagada.
  - El panel queda en 64 × 244 en todas las pieles. Aparece la pastilla de estado.
- **v1.5** — 2026-08-23. El menú deja de ser una función de escritorio (campaña MOV). Ver su documento.
- **v1.4 · v1.3 · v1.2 · v1.1 · v1.0** — ver sus documentos.
