-- MED · 11 · La pausa de anuncio: cuántos omiten y a qué segundo
-- Contesta: por pausa (la mano en que se abre), qué hizo cada asiento que vio el anuncio.
-- Definiciones: cada asiento de un `anuncio_inicio` sale por una de cuatro puertas, que suman 100 %:
--   `anuncio_omitido` (con su segundo: ms desde la apertura, mediana y p90); `anuncio_vuelto` con
--   como = 'tope' (vencieron los 30 s); `anuncio_vuelto` con como = 'mesa' (quedaron ≤ 1 que sigan);
--   y sin cierre = no volvió (también quien abandonó dentro de la pausa, y una pausa abierta ahora).
-- Lee: public.eventos
-- Ventana: pausas abiertas en los últimos 30 días; solo las manos con pausa.
-- Columnas: mano, pausas, asientos, omitieron, pct_omitieron, segundo_mediana, segundo_p90, devueltos_tope, pct_tope, devueltos_mesa, pct_mesa, no_volvieron, pct_no_volvieron
with filas as (
  select e.tipo,
         e.datos ->> 'sala'            as sala,
         (e.datos ->> 'mano')::integer as mano,
         e.datos ->> 'asiento'         as asiento,
         (e.datos ->> 'ms')::integer   as ms,
         e.datos ->> 'como'            as como
    from public.eventos e
   where e.tipo in ('anuncio_inicio', 'anuncio_omitido', 'anuncio_vuelto')
     and e.creado_en >= now() - interval '30 days'
),
asientos as (
  select distinct sala, mano, asiento from filas where tipo = 'anuncio_inicio'
),
omitidos as (
  select sala, mano, asiento, min(ms) as ms
    from filas where tipo = 'anuncio_omitido'
   group by sala, mano, asiento
),
vueltos as (
  select sala, mano, asiento, min(como) as como
    from filas where tipo = 'anuncio_vuelto'
   group by sala, mano, asiento
),
salidas as (
  select a.sala, a.mano, a.asiento, o.ms as ms_omitido, v.como
    from asientos a
    left join omitidos o on o.sala = a.sala and o.mano = a.mano and o.asiento = a.asiento
    left join vueltos v  on v.sala = a.sala and v.mano = a.mano and v.asiento = a.asiento
),
cifras as (
  select mano,
         count(distinct sala) as pausas,
         count(*)             as asientos,
         count(ms_omitido)    as omitieron,
         percentile_cont(0.5) within group (order by ms_omitido) / 1000 as mediana,
         percentile_cont(0.9) within group (order by ms_omitido) / 1000 as p90,
         count(*) filter (where ms_omitido is null and como = 'tope')   as tope,
         count(*) filter (where ms_omitido is null and como = 'mesa')   as mesa,
         count(*) filter (where ms_omitido is null and como is null)    as no_volvieron
    from salidas
   group by mano
)
select mano, pausas, asientos,
       omitieron,    round(100.0 * omitieron / asientos, 1)    as pct_omitieron,
       round(mediana::numeric, 1)                              as segundo_mediana,
       round(p90::numeric, 1)                                  as segundo_p90,
       tope as devueltos_tope, round(100.0 * tope / asientos, 1) as pct_tope,
       mesa as devueltos_mesa, round(100.0 * mesa / asientos, 1) as pct_mesa,
       no_volvieron, round(100.0 * no_volvieron / asientos, 1) as pct_no_volvieron
  from cifras
 order by mano;
