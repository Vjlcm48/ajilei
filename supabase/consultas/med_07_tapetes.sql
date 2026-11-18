-- MED · 07 · Tapetes comprados
-- Contesta: tapetes comprados por semana, por artículo y tono, y los HC gastados.
-- Definiciones: semana de Chicago, de lunes a domingo, la del movimiento `compra`. El tono es el
--   que el artículo tiene HOY en inventario (se puede cambiar después de comprar); «sin tono» es
--   un artículo sin tonos o sin fila. La fila «(total)» suma la semana. El tapete gratis no sale.
-- Lee: public.movimientos, public.inventario
-- Ventana: últimas 12 semanas; solo las semanas con compras.
-- Columnas: semana, articulo, tono, compras, hc_gastados
with compras as (
  select date_trunc('week', public.dia_chicago(m.creado_en)::timestamp)::date as semana,
         split_part(m.ref_id, ':', 2) as articulo,
         i.tono,
         -m.monto as hc
    from public.movimientos m
    left join public.inventario i
      on i.jugador_id = m.jugador_id and i.tipo = 'tapete'
     and i.articulo = split_part(m.ref_id, ':', 2)
   where m.tipo = 'compra' and m.ref_tipo = 'inventario' and m.ref_id like 'tapete:%'
     and public.dia_chicago(m.creado_en)
         >= date_trunc('week', public.dia_chicago(now())::timestamp)::date - 77
)
select semana,
       case when grouping(articulo) = 1 then '(total)' else articulo end as articulo,
       case when grouping(articulo) = 1 then '(todos)' else coalesce(tono, 'sin tono') end as tono,
       count(*) as compras,
       sum(hc)  as hc_gastados
  from compras
 group by grouping sets ((semana, articulo, tono), (semana))
 order by semana desc, grouping(articulo), 2, 3;
