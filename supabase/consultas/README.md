# Consultas de medición (MED-1a)

Las abre Victor en el SQL Editor de Supabase. Son texto de solo lectura: no crean ningún objeto en la base ni piden permisos. Cada pestaña se llama como dice la tabla y su texto es idéntico al del archivo. Ninguna lleva parámetros que editar.

| Nombre en el SQL Editor | Archivo | Qué devuelve |
|---|---|---|
| MED · 01 · Cuentas nuevas por día y embudo código → nombre | `med_01_cuentas_nuevas.sql` | Por día: códigos pedidos y verificados, nombres elegidos y el embudo |
| MED · 02 · Activos por día (entró / jugó) | `med_02_activos.sql` | Por día: entraron, jugaron y jugaron dentro de entraron |
| MED · 03 · Manos contra las IAS, total y por activo | `med_03_manos_ias.sql` | Por día: manos, mesas abiertas, manos por activo y por reto |
| MED · 04 · Manos contra humanos, total y promedio por partida | `med_04_manos_humanos.sql` | Por día: partidas terminadas, manos (media y mediana) y asientos |
| MED · 05 · Retención D1/D7/D30 | `med_05_retencion.sql` | Por cohorte semanal: cuentas y % que entró a D1, D7 y D30 |
| MED · 06 · Tiempo de sesión | `med_06_sesiones.sql` | Por día: sesiones, minutos (media y mediana), y por activo |
| MED · 07 · Tapetes comprados | `med_07_tapetes.sql` | Por semana: compras por artículo y tono, y HC gastados |
| MED · 08 · «Mano actual» antes y después de las 20 | `med_08_mano_actual.sql` | Cuentas por tramo de gratis y consultas de pago por semana, IAS y humanos |
| MED · 09 · Partidas PvP por tamaño, apuesta, entrada y ritmo | `med_09_partidas_pvp.sql` | Por semana y mesa: partidas y cuántas llegaron a jugarse |
| MED · 10 · Reconexiones y recargas de las partidas PvP | `med_10_reconexiones_recargas.sql` | Por semana y por partida: reconexiones por vía, recargas y qué parte las tuvo |
| MED · 11 · La pausa de anuncio: cuántos omiten y a qué segundo | `med_11_pausa_anuncio.sql` | Por pausa: asientos, omisiones y su segundo, tope, mesa y no volvió |
| MED · 12 · Origen y país de las cuentas nuevas | `med_12_origen_pais.sql` | Por semana: origen, país por zona (con la zona) y país elegido |
| MED · 13 · Vigilancia de la medición | `med_13_vigilancia.sql` | `medicion_invalida`, filas por tipo, última fila y tamaños |
| MED · 14 · Generador: nuevos por cada 100 activos | `med_14_generador.sql` | Por mes: cuentas nuevas, activos y nuevos por cada 100 activos |

## Las definiciones

- **Día y semana:** los de Chicago, como la constancia (`public.dia_chicago`). La semana va de lunes a domingo.
- **Entró:** tiene fila `ingreso` ese día.
- **Jugó:** cerró al menos una mano ese día: `mesas_ia.mano_informada ≥ 1` por `abierta_en`, o `partida_asientos.manos ≥ 1` por `partidas.creada_en`.
- **Retención:** desde `profiles.created_at`, y volver es *entró* justo ese día. Las cuentas anteriores al 2026-11-16 salen como «previo» y no cuentan en las cohortes.
- **Sesión:** `ultimo_latido − inicio`. Las de menos de 30 s no entran en las cifras; media y mediana, las dos.
- **Reconexión:** las dos vías cuentan y van separadas por `via`. El bloqueo de pantalla con la mesa abierta es una reconexión por `canal`.
- **Pausa de anuncio:** cada asiento sale por una de cuatro puertas: omitió, lo devolvió el tope, lo devolvió la mesa, o no volvió (un `anuncio_inicio` sin cierre).
- **Código verificado:** `auth.users.email_confirmed_at`. `created_at` es cuándo se pidió el código.
- **País:** el elegido (`profiles.pais`) y el derivado de la zona horaria. Un `origen` nulo es «previo».
- **Purga:** ninguna hasta junio de 2027. La 13 avisa si la base pasa de 300 MB.

## Cómo se añade una consulta

1. Crea `med_nn_<slug>.sql` con un solo `select` y la cabecera de las demás: el nombre en la primera línea, y `Contesta`, `Definiciones`, `Lee`, `Ventana` y `Columnas`.
2. Declárala en `CONSULTAS_MED`, en `scripts/eco/consultasCore.mjs`, con ese mismo nombre, y añádela a la tabla de arriba.
3. Corre `npm run guiones`: la pasada `med_consultas` la ejecuta de solo lectura y exige las columnas que promete.
4. Guárdala en el SQL Editor con su nombre.

Quien renombra una columna que una consulta lee, la arregla: `npm run guiones` se pone en rojo.
