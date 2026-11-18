-- MED · 10 · Reconexiones y recargas de las partidas PvP
-- Contesta: por semana y por partida, las reconexiones por vía, las recargas y qué parte las tuvo.
-- Definiciones: semana de Chicago, la de partidas.creada_en. Las dos vías cuentan y van separadas por
--   datos->>'via': `arranque` (recargó o reabrió) y `canal` (volvió el canal; incluye el bloqueo de
--   pantalla con la mesa abierta). `otra` debería ser 0: el cliente escribe `datos`, por eso la sala
--   se compara como texto. Fila `semana` = el resumen; fila `partida` = cada una que tuvo alguna.
-- Lee: public.partidas, public.eventos, public.movimientos
-- Ventana: últimas 12 semanas, con las semanas en cero.
-- Columnas: semana, nivel, sala, partidas, reconexiones_arranque, reconexiones_canal, reconexiones_otra, recargas, hc_recargas, partidas_con_reconexion, pct_con_reconexion, partidas_con_recarga, pct_con_recarga
with semanas as (
  select date_trunc('week', public.dia_chicago(now())::timestamp)::date - 7 * n as semana
    from generate_series(0, 11) as n
),
reconexiones as (
  select e.datos ->> 'sala' as sala,
         count(*) filter (where e.datos ->> 'via' = 'arranque') as arranque,
         count(*) filter (where e.datos ->> 'via' = 'canal')    as canal,
         count(*) filter (where coalesce(e.datos ->> 'via', '') not in ('arranque', 'canal')) as otra
    from public.eventos e
   where e.tipo = 'pvp_reconexion' and e.creado_en >= now() - interval '13 weeks'
   group by 1
),
recargas as (
  select m.ref_id as sala, count(*) as n, -sum(m.monto) as hc
    from public.movimientos m
   where m.tipo = 'recarga_pvp' and m.ref_tipo = 'sala'
   group by 1
),
por_partida as (
  select s.semana, p.sala_id::text as sala,
         coalesce(x.arranque, 0) as arranque,
         coalesce(x.canal, 0)    as canal,
         coalesce(x.otra, 0)     as otra,
         coalesce(r.n, 0)        as recargas,
         coalesce(r.hc, 0)       as hc
    from public.partidas p
    join semanas s on s.semana = date_trunc('week', public.dia_chicago(p.creada_en)::timestamp)::date
    left join reconexiones x on x.sala = p.sala_id::text
    left join recargas r on r.sala = p.sala_id::text
),
por_semana as (
  select s.semana,
         count(x.sala)                       as partidas,
         coalesce(sum(x.arranque), 0)        as arranque,
         coalesce(sum(x.canal), 0)           as canal,
         coalesce(sum(x.otra), 0)            as otra,
         coalesce(sum(x.recargas), 0)        as recargas,
         coalesce(sum(x.hc), 0)              as hc,
         count(*) filter (where x.arranque + x.canal + x.otra > 0) as con_reconexion,
         count(*) filter (where x.recargas > 0)                    as con_recarga
    from semanas s
    left join por_partida x on x.semana = s.semana
   group by s.semana
)
select semana, nivel, sala, partidas,
       reconexiones_arranque, reconexiones_canal, reconexiones_otra, recargas, hc_recargas,
       partidas_con_reconexion, pct_con_reconexion, partidas_con_recarga, pct_con_recarga
  from (
    select semana, 'semana' as nivel, null::text as sala, partidas,
           arranque::bigint as reconexiones_arranque, canal::bigint as reconexiones_canal,
           otra::bigint as reconexiones_otra, recargas::bigint as recargas, hc::bigint as hc_recargas,
           con_reconexion as partidas_con_reconexion,
           round(100.0 * con_reconexion / nullif(partidas, 0), 1) as pct_con_reconexion,
           con_recarga as partidas_con_recarga,
           round(100.0 * con_recarga / nullif(partidas, 0), 1) as pct_con_recarga
      from por_semana
    union all
    select semana, 'partida', sala, 1::bigint, arranque, canal, otra, recargas, hc::bigint,
           null::bigint, null::numeric, null::bigint, null::numeric
      from por_partida
     where arranque + canal + otra + recargas > 0
  ) as filas
 order by semana desc, nivel desc, sala;
