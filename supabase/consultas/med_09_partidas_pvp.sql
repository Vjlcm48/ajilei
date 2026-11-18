-- MED · 09 · Partidas PvP por tamaño, apuesta, entrada y ritmo
-- Contesta: cuántas partidas se abrieron por semana y mesa, y cuántas llegaron a jugarse.
-- Definiciones: semana de Chicago, de lunes a domingo, la de partidas.creada_en. Tamaño =
--   salas.jugadores. Jugada = al menos una mano (max(partida_asientos.manos) ≥ 1); la columna existe
--   desde MES-PvP 8 (2026-11-14), las partidas de antes salen sin jugar. manos_media mira las jugadas.
-- Lee: public.partidas, public.salas, public.partida_asientos
-- Ventana: últimas 12 semanas; solo las combinaciones con partidas.
-- Columnas: semana, jugadores, apuesta, entrada, ritmo, partidas, jugadas, pct_jugadas, manos_media
with por_partida as (
  select date_trunc('week', public.dia_chicago(p.creada_en)::timestamp)::date as semana,
         s.jugadores, s.apuesta, s.entrada, s.ritmo,
         coalesce(max(a.manos), 0) as manos
    from public.partidas p
    join public.salas s on s.id = p.sala_id
    left join public.partida_asientos a on a.sala_id = p.sala_id
   where public.dia_chicago(p.creada_en)
         >= date_trunc('week', public.dia_chicago(now())::timestamp)::date - 77
   group by p.sala_id, p.creada_en, s.jugadores, s.apuesta, s.entrada, s.ritmo
)
select semana, jugadores, apuesta, entrada, ritmo,
       count(*)                                as partidas,
       count(*) filter (where manos >= 1)      as jugadas,
       round(100.0 * count(*) filter (where manos >= 1) / count(*), 1) as pct_jugadas,
       round(avg(manos) filter (where manos >= 1), 1) as manos_media
  from por_partida
 group by semana, jugadores, apuesta, entrada, ritmo
 order by semana desc, jugadores, apuesta, entrada, ritmo;
