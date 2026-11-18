# AJILEI · MED-1a · Medición base · Cierre de la campaña · v1.0

**Fecha:** 2026-11-18.
**Ficha:** `AJILEI_MED-1a_T3_v1.0.md` (la tanda 3).
**Base:** `main` = `origin/main` = `06f49b3`, y los informes `AJILEI_MED-1a_*` de `docs/reportes/`.
**Para qué sirve:** es el punto de partida de las campañas que heredan de MED-1a. Las reglas viven en sus normativos: el Contrato de MOT-1 v1.6 y el registro de invariantes (INV-87). Aquí queda la historia: qué hizo cada tanda, qué dejó en la nube, cómo se lee lo que mide y qué hereda cada campaña.

---

## 1 · Las tandas, con sus SHA

Todas están publicadas en `origin/main`, salvo los dos commits de la T3, cuyos SHA van en el chat del STOP-C.

| Tanda | Fecha | Qué hizo, en una línea | Commits | Nube |
|---|---|---|---|---|
| **Fase 0** | 2026-11-15 | La sonda: lo que ya se mide, los eventos que faltan, `origen` con país y las consultas | — (solo el informe) | — |
| **T0** | 2026-11-16 | Instrumentos: la CLI 3.1.0, `saldo.5` por valor y las semillas de `h1` y `z1` | `1ee7578` · `c71ad4f` · `4e8ad3f` · `1b35256` | Deploy de `partida` sin cambios, con la CLI v3 |
| **T1** | 2026-11-17 | `eventos`, `sesiones`, `origen`, el disparador `ingreso` y los `anuncio_*` del árbitro; Contrato v1.6 | `81acc6b` · `fc1e50c` · `72080a6` | Migración `med1a_eventos` y deploy de `partida` |
| **T2** | 2026-11-17 | El cliente: `origen` en el Bautizo, el latido de sesión y `pvp_reconexion` | `f9a86e1` · `cfff533` · `9c23481` · `06f49b3` | — |
| **T3** | 2026-11-18 | Las catorce consultas, su guion `med_consultas` y este cierre | Dos commits, `3-a` (consultas y guion) y `3-b` (documentos); sus SHA van en el chat | — |

---

## 2 · Lo que la campaña deja en la nube

- **La migración** `20261116120000_med1a_eventos.sql`, aplicada y verificada con sus Grupos A y B.
- **La función `partida` con el Contrato v1.6.** Se desplegó dos veces: sin cambios con la CLI v3 en la T0, y con los `anuncio_*` en la T1.
- **La CLI de Supabase 3.1.0** (`package.json`). Los comandos contra la nube llevan `--remote`.
- **En el SQL Editor:** las dos consultas de verificación (los Grupos A y B) y las catorce de seguimiento, con su nombre «MED · nn · …» (§6).
- **Cloudflare Web Analytics**, por inyección automática desde el panel (§6). No toca `dist/` y `1.8b` no lo ve.

---

## 3 · Lo que mide y cómo se lee

### Las definiciones

| Concepto | Definición |
|---|---|
| **Día y semana** | Los de Chicago, como la constancia (`public.dia_chicago`). La semana va de lunes a domingo |
| **Entró** | Tiene fila `ingreso` ese día |
| **Jugó** | Cerró al menos una mano ese día: `mesas_ia.mano_informada ≥ 1` por `abierta_en`, o `partida_asientos.manos ≥ 1` por `partidas.creada_en` |
| **Código verificado** | `auth.users.email_confirmed_at`. `created_at` es cuándo se pidió |
| **Retención** | Desde `profiles.created_at`; volver a Dn es *entrar* justo ese día; solo cuentan las cuentas cuyo Dn ya terminó. Las anteriores al 2026-11-16 son «previo» y no entran en las cohortes |
| **Sesión** | `ultimo_latido − inicio`. Las de menos de 30 s quedan fuera; media y mediana, las dos |
| **Reconexión** | Las dos vías cuentan, separadas por `via`. El bloqueo de pantalla con la mesa abierta es una reconexión por `canal` |
| **Pausa de anuncio** | Por mano, con cuatro salidas por asiento: omitió (y a qué segundo), lo devolvió el tope, lo devolvió la mesa, o no volvió (un `anuncio_inicio` sin cierre) |
| **País** | El elegido (`profiles.pais`) y el derivado de la zona horaria (`America/Caracas` = VE). Un `origen` nulo es «previo» |
| **Métrica rectora del Generador** | Jugadores nuevos por cada 100 activos al mes |

### Las catorce consultas

El texto vive en `supabase/consultas/`, y `npm run guiones` las ejecuta en cada corrida (INV-87).

| Nombre en el SQL Editor | Qué contesta |
|---|---|
| MED · 01 · Cuentas nuevas por día y embudo código → nombre | Cuántos piden código, lo verifican y eligen nombre |
| MED · 02 · Activos por día (entró / jugó) | Cuántos entraron y cuántos jugaron |
| MED · 03 · Manos contra las IAS, total y por activo | Manos, mesas, manos por activo y por reto |
| MED · 04 · Manos contra humanos, total y promedio por partida | Partidas terminadas, sus manos y sus asientos |
| MED · 05 · Retención D1/D7/D30 | Qué parte de cada cohorte semanal vuelve |
| MED · 06 · Tiempo de sesión | Sesiones y minutos, por sesión y por activo |
| MED · 07 · Tapetes comprados | Compras por artículo y tono, y HC gastados |
| MED · 08 · «Mano actual» antes y después de las 20 | Cuánto se gastan las gratis y cuánto se paga |
| MED · 09 · Partidas PvP por tamaño, apuesta, entrada y ritmo | Qué mesas se abren y cuáles llegan a jugarse |
| MED · 10 · Reconexiones y recargas de las partidas PvP | Reconexiones por vía, recargas y qué parte las tuvo |
| MED · 11 · La pausa de anuncio: cuántos omiten y a qué segundo | Qué hace cada asiento en cada pausa |
| MED · 12 · Origen y país de las cuentas nuevas | De dónde vienen las cuentas |
| MED · 13 · Vigilancia de la medición | Si la propia medición está sana |
| MED · 14 · Generador: nuevos por cada 100 activos | La métrica rectora, por mes |

---

## 4 · Reglas nuevas

- **La medición nunca tumba la mesa.** Un `anuncio_*` mal formado queda como `medicion_invalida` y la jugada se aplica. Una fila así es un defecto del árbitro, y la 13 la señala.
- **`eventos` es de solo inserción.** Sin `update`, `delete` ni `truncate`, salvo la cascada al borrar la cuenta.
- **`origen` se escribe una vez,** en el Bautizo. Nadie del cliente lo cambia ni lo lee.
- **Lo que no entra se pierde.** Ni latidos ni eventos se reintentan ni se guardan en cola: es medición, no dinero.
- **Las pruebas por túnel que pierden la conexión van contra `vite preview`** en el 4173, nunca contra `npm run dev`: su cliente recarga la página al perder el socket, y las recargas parecen defectos del producto.
- **Las consultas viven en el repo** y el guion las vigila (INV-87).

---

## 5 · La herencia, por campaña

| Campaña | Lo que hereda |
|---|---|
| **LEC-1** (la siguiente) | El rojo conocido de `vuelo humano` (INV-82). De MED-1a, nada más |
| **GEN-1** | Los `inv_*` entran en `eventos` sin migración de tabla (`tipo` va por formato); GEN-1 trae su función escritora. `origen = 'invitacion'` ya se escribe y `origen_datos.sala` lleva el código. La métrica rectora está en la 14 |
| **Ola 0** | Victor abre cada semana la **02, la 06, la 09, la 10, la 11 y la 13**, y cada día cuando arranque la pauta. Con la 11 se deciden **los 7/8 y los 30 s** de la pausa de anuncio |
| **MED-1b** | Los píxeles de pauta. La 12 ya separa por país |
| **NOC-1** | Los puntos dobles no tocan `eventos`. Si quiere medir la Noche, es un `tipo` nuevo por la función escritora que exista |
| **Junio de 2027** | Revisar la purga con la 13, que avisa si la base pasa de 300 MB |
| **Mantenimiento** | Quien renombra una columna que una consulta lee, la arregla: `npm run guiones` la pone en rojo |

---

## 6 · Lo que falta para cerrar del todo

Al escribir este informe, las dos cosas siguientes estaban pendientes. Las hace Victor en sus paneles:

1. **Guardar las catorce consultas** en el SQL Editor con su nombre. Será también su primera ejecución contra la base real: hasta ahora solo han corrido en PGlite.
2. **Encender Cloudflare Web Analytics** y comprobar que el código fuente de ajilei.io muestra `beacon.min.js`.
