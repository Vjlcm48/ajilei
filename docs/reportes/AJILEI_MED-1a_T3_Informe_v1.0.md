# AJILEI · MED-1a · Tanda 3 (las consultas y el cierre) · Informe · v1.0

- **Ficha:** `AJILEI_MED-1a_T3_v1.0.md`. **Base:** `06f49b3` (las tandas 0, 1 y 2 publicadas). **Fecha:** 2026-11-18.
- **Diseño:** `docs/reportes/AJILEI_MED-1a_Fase0_Informe_v1.0.md`, §A y §D, y «Lo que hereda la tanda 3» de `AJILEI_MED-1a_T2_Informe_v1.0.md`.
- **Estado:** tramos A y C hechos, con sus controles (§6). Quedan los commits, tras el visto bueno del mapa, el push, y lo que hace Victor en sus paneles: guardar las catorce consultas y encender Cloudflare (§5).
- **Sin migración, sin deploy y sin tocar `src/`.** `1.8b` no cambia.

---

## Resumen

| Pieza | Qué hace | Dónde |
|---|---|---|
| Las catorce consultas | Un `select` por archivo, con su cabecera: nombre del SQL Editor, qué contesta, definiciones, tablas, ventana y columnas | `supabase/consultas/med_*.sql` |
| El README | Los catorce nombres, las definiciones y cómo se añade una consulta | `supabase/consultas/README.md` |
| La pasada `med_consultas` | Corre en `npm run guiones`: ejecuta las catorce de solo lectura, exige sus columnas y prueba la 11 y la 13 con filas fabricadas | `scripts/guiones.mjs` · `scripts/eco/consultasCore.mjs` (+ su test) |
| INV-87 | Las consultas viven en el repo y el guion las vigila | `docs/AJILEI_Invariantes_v1.0.md` |
| El cierre | La historia de la campaña y lo que hereda cada una | `docs/reportes/AJILEI_MED-1a_Cierre_v1.0.md` |

---

## 1 · Las catorce consultas (tramo A)

Ninguna lleva parámetros. Las columnas salen con nombre en español. El día y la semana son los de Chicago, y la semana va de lunes a domingo.

| Nombre en el SQL Editor | Ventana | Qué devuelve |
|---|---|---|
| MED · 01 · Cuentas nuevas por día y embudo código → nombre | 30 días | Códigos pedidos y verificados, nombres elegidos, y cuántos de los verificados ese día tienen nombre |
| MED · 02 · Activos por día (entró / jugó) | 30 días | Entraron, jugaron, y jugaron dentro de entraron |
| MED · 03 · Manos contra las IAS, total y por activo | 30 días | Manos, mesas abiertas, manos por jugador activo y manos por reto |
| MED · 04 · Manos contra humanos, total y promedio por partida | 30 días | Partidas terminadas, las que tuvieron manos, manos (media y mediana) y asientos |
| MED · 05 · Retención D1/D7/D30 | desde la semana del 2026-11-16 | Por cohorte: cuentas, y por cada Dn cuántas ya se pueden medir y qué % entró; «previo» aparte |
| MED · 06 · Tiempo de sesión | 30 días | Sesiones de 30 s o más, las cortas aparte, minutos (media y mediana), y sesiones y minutos por activo |
| MED · 07 · Tapetes comprados | 12 semanas | Compras por artículo y tono, HC gastados y el total de la semana |
| MED · 08 · «Mano actual» antes y después de las 20 | historia y 12 semanas | Cuentas en 0, 1–5, 6–19 y 20 gratis; consultas de pago por semana, IAS y humanos |
| MED · 09 · Partidas PvP por tamaño, apuesta, entrada y ritmo | 12 semanas | Partidas, cuántas se jugaron (≥ 1 mano), % y manos de media |
| MED · 10 · Reconexiones y recargas de las partidas PvP | 12 semanas | Por semana y por partida: reconexiones por `via`, recargas, y qué parte de las partidas tuvo alguna |
| MED · 11 · La pausa de anuncio: cuántos omiten y a qué segundo | 30 días | Por mano con pausa: asientos, % que omitió, segundo (mediana y p90), % devuelto por el tope, % devuelto por la mesa y % que no volvió |
| MED · 12 · Origen y país de las cuentas nuevas | 12 semanas | Cuentas por origen, país de la zona (con la zona al lado) y país elegido; `previo` aparte |
| MED · 13 · Vigilancia de la medición | 7 días e historia | `medicion_invalida` y sus últimas 5, filas por `tipo` y su última fila, `sesiones`, y los tamaños con el aviso de 300 MB |
| MED · 14 · Generador: nuevos por cada 100 activos | 12 meses | Cuentas nuevas, activos del mes y nuevos por cada 100 activos |

---

## 2 · Lo que el código obligó a precisar

La ficha y la Fase 0 son la base. Estos seis puntos salen de leer las migraciones y el árbitro:

1. **«Código verificado» no es `auth.users.created_at`.** El cliente llama a `signInWithOtp` con `shouldCreateUser: true` (`src/hooks/useAuth.js:340-342`): la fila nace al **pedir** el código. Verificarlo pone `email_confirmed_at`. La 01 da las dos cifras, `codigos_pedidos` y `codigos_verificados`, y el embudo sale de la segunda. La Fase 0 (§A.2) decía lo contrario. El andamio de PGlite gana esa columna, que la tabla real ya tiene.
2. **La pausa de anuncio tiene cuatro salidas, no tres.** Además de omitir, el tope y no volver, el Contrato v1.6 tiene `anuncio_vuelto` con `como = 'mesa'`: la pausa se cierra porque quedan uno o ninguno que sigan. La 11 lo da en su propia columna, y así los cuatro porcentajes suman 100. Quien abandona dentro de la pausa no emite vuelta: cuenta como «no volvió».
3. **La retención solo mide lo que ya pudo pasar.** Una cuenta entra en el denominador de Dn cuando ese día de Chicago ya terminó (`medibles_dn`). Sin eso, una cohorte joven daría un D30 de 0 %.
4. **«Mano actual»: la cuenta sin fila cuenta en 0.** `consultas` solo tiene fila desde la primera consulta, así que la distribución parte de `profiles`.
5. **`datos` de `pvp_reconexion` lo escribe el cliente.** La 10 compara la sala como texto, nunca la convierte a `uuid`: un valor raro no rompe la consulta. Una `via` desconocida va a `reconexiones_otra`, que debería dar 0.
6. **El tono de la 07 es el de hoy.** `inventario` guarda el tono actual y el jugador puede cambiarlo después de comprar; el libro no guarda el de la compra.

Un matiz de fechas: `ingreso` empezó a escribirse al aplicar la migración de la T1, el 2026-11-17. Una cuenta registrada el 2026-11-16 que entró el 17 antes de ese momento sale sin su D1. La frontera de «previo» sigue en el 2026-11-16, como decidió la ficha.

---

## 3 · El guion `med_consultas`

`npm run guiones`, después de las 22 migraciones y de los 11 guiones:

1. Compara la carpeta con `CONSULTAS_MED` (`scripts/eco/consultasCore.mjs`). Un `.sql` sin declarar, o uno declarado que falta, es **error de instrumento (código 2)**, como en los guiones.
2. Ejecuta cada archivo con `db.query`, que admite una sola sentencia, dentro de una transacción `read only`: lo que intente escribir revienta.
3. Exige que el nombre, el número y el orden de las columnas sean los de la línea `Columnas:` de su cabecera, y que la cabecera traiga su nombre y sus cuatro claves.
4. **La 11 y la 13, otra vez con filas fabricadas** que se deshacen en la misma transacción:
   - la 11, cinco asientos de una pausa: dos omiten (4 s y 6 s), uno vuelve por el tope, otro por la mesa y uno no cierra. Exige `no_volvieron = 1`, 20 %, mediana 5,0 y p90 5,8;
   - la 13, una `medicion_invalida`: exige valor 1, estado `DEFECTO` y su fila de detalle.
5. Compara la foto de todas las tablas antes y después: la pasada no deja rastro.

Salida: una línea por consulta, y `med_consultas 14/14` en la línea final.

**Lo que se reescribió por PGlite: nada.** PGlite 0.5.8 es PostgreSQL 18.3 y corre tal cual `percentile_cont`, `grouping sets`, `pg_total_relation_size` y `pg_database_size`. La nube es Postgres 17.6: ninguna consulta usa nada propio de la 18, pero **ninguna ha corrido todavía contra la base real**. Su primera prueba allí es cuando Victor las guarde.

---

## 4 · Cómo se comprobó que dicen la verdad

El banco vacío solo prueba que corren. Por eso, fuera del repo, una sonda de usar y tirar aplicó las 22 migraciones, fabricó un escenario completo (siete cuentas, tres mesas de IAS, tres partidas, sesiones, compras, consultas, recargas y reconexiones), fijó el reloj en el 2027-01-20 para que D7 y D30 fueran medibles e hizo **49 comprobaciones contra cifras calculadas a mano**: las 49 pasan. Cubre trece consultas; la 11 la prueba el guion. No entra en el repo: el contrato permanente es el de §3.

**Controles rojos de la pasada**, cada uno provocado y deshecho:

| Provocación | Resultado |
|---|---|
| Una migración temporal renombra `mesas_ia.mano_informada` | La 02 y la 03 revientan: `med_consultas 12/14`, código 1 |
| La cabecera de la 14 promete otra columna | Rojo: nombra lo prometido y lo devuelto |
| La 11 deja de contar el inicio sin cierre | Rojo: `no_volvieron` 0, se esperaba 1 |
| La 13 deja de ver `medicion_invalida` | Rojo: valor 0, estado `OK` |
| La 07 se cambia por un `insert` | Rojo: «cannot execute INSERT in a read-only transaction» |
| Un `med_99_x.sql` sin declarar | Error de instrumento, código 2 |

---

## 5 · Cloudflare Web Analytics (tramo B)

Lo enciende Victor desde el panel, guiado por el rector. La ruta elegida es la de la Fase 0 §E, opción (a): **inyección automática** desde *Analytics & Logs → Web Analytics*, sin tocar `index.html` ni el repo.

- **`1.8b` no lo ve:** pesa solo `dist/`, y el beacon lo añade Cloudflare al servir la página.
- **Cómo se comprueba:** en ajilei.io, «Ver código fuente» debe mostrar `beacon.min.js`.
- **Qué mide:** visitas, país y referente por carga de página, sin cookies y sin unir a ningún jugador. No sustituye a `origen`.
- **Estado al escribir este informe: pendiente de encender y de comprobar.** Esta tanda no leyó `ajilei.io`, porque la ficha pide hacerlo después de que Victor lo encienda.

---

## 6 · Los controles

Sobre `06f49b3` con los cambios de la tanda, antes de los commits (`npm run varas -- --solo eslint,vitest,build,guiones,1.8b`):

| Control | Resultado |
|---|---|
| eslint | 0 errores y 0 avisos |
| vitest | 113/113 archivos, 3062 pruebas, 0 fallidas, 0 omitidas (24 pruebas nuevas, en `consultasCore.test.js`) |
| build | compila |
| `npm run guiones` | verde: 22 migraciones, 11 guiones × 2 pasadas, **`med_consultas` 14/14** |
| 1.8b | **178,8 KiB** en el cable, igual que `06f49b3` limpio |
| `git worktree list` | una línea |

**Sobre el `1.8b`:** la ficha esperaba 178,9, la cifra del informe de la T2. Una compilación de `06f49b3` limpio, en una copia aparte, da 178,8 KiB y el mismo `index-CQ3H74p5.js` que esta tanda: el paquete no cambió. El 178,9 sale de una corrida anterior, con otro nombre de archivo (`index-cQ19D9xW.js`) y el mismo peso en crudo (646,0 KiB).

**Cada letra construye sola.** Se probó con commits sueltos hechos con un índice temporal, sin tocar la rama, y `npm run aislado -- <sha> --perfil=rapido`: las dos dan build, eslint 0/0 y vitest 113/113 archivos con 3062 pruebas.

**Sin control de las IAS y sin `completo`:** la tanda no toca nada que monte la mesa.

---

## 7 · Lo que queda

- **Victor guarda las catorce consultas** en el SQL Editor, con su nombre, desde el texto del STOP-C o desde los archivos. Si alguna falla contra la base real, se arregla aquí y en el panel a la vez.
- **Victor enciende Cloudflare** y comprueba `beacon.min.js`.
- La herencia de la campaña está en `AJILEI_MED-1a_Cierre_v1.0.md`, §5.
