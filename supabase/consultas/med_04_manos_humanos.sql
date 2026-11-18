-- MED · 04 · Manos contra humanos, total y promedio por partida
-- Contesta: partidas entre personas terminadas por día, sus manos (promedio y mediana) y asientos.
-- Definiciones: día de Chicago, el de terminada_en. Manos de una partida = max(partida_asientos.manos)
--   de la sala; la columna existe desde MES-PvP 8 (2026-11-14). El promedio y la mediana miran solo
--   las partidas con al menos una mano. Borrar la cuenta del anfitrión se lleva su partida.
-- Lee: public.partidas, public.partida_asientos
-- Ventana: últimos 30 días de Chicago, con los días en cero.
-- Columnas: dia, partidas_terminadas, partidas_con_manos, manos, manos_por_partida_media, manos_por_partida_mediana, asientos
with dias as (
  select public.dia_chicago(now()) - n as dia
    from generate_series(0, 29) as n
),
por_partida as (
  select public.dia_chicago(p.terminada_en) as dia,
         p.sala_id,
         coalesce(max(a.manos), 0) as manos,
         count(a.asiento)          as asientos
    from public.partidas p
    left join public.partida_asientos a on a.sala_id = p.sala_id
   where p.terminada_en >= now() - interval '31 days'
   group by p.sala_id, p.terminada_en
)
select d.dia,
       count(x.sala_id)                              as partidas_terminadas,
       count(x.sala_id) filter (where x.manos >= 1)  as partidas_con_manos,
       coalesce(sum(x.manos), 0)                     as manos,
       round(avg(x.manos) filter (where x.manos >= 1), 1) as manos_por_partida_media,
       round((percentile_cont(0.5) within group (order by x.manos)
              filter (where x.manos >= 1))::numeric, 1)   as manos_por_partida_mediana,
       coalesce(sum(x.asientos), 0)                  as asientos
  from dias d
  left join por_partida x on x.dia = d.dia
 group by d.dia
 order by d.dia desc;
