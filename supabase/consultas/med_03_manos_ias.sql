-- MED · 03 · Manos contra las IAS, total y por activo
-- Contesta: manos contra las IAS por día, mesas abiertas, manos por jugador activo y manos por reto.
-- Definiciones: día de Chicago, el de abierta_en (una mesa que cruza la medianoche cuenta el día
--   que abrió). Manos = Σ mano_informada: depende del aviso del teléfono, sin red se subcuenta.
--   Jugador activo = jugó ese día, contra las IAS o contra personas (la definición de la 02).
-- Lee: public.mesas_ia, public.partida_asientos, public.partidas
-- Ventana: últimos 30 días de Chicago, con los días en cero.
-- Columnas: dia, manos, mesas_abiertas, jugadores_activos, manos_por_activo, manos_basico, manos_avanzado, manos_pro
with dias as (
  select public.dia_chicago(now()) - n as dia
    from generate_series(0, 29) as n
),
mesas as (
  select public.dia_chicago(m.abierta_en) as dia, m.reto, m.mano_informada
    from public.mesas_ia m
   where m.abierta_en >= now() - interval '31 days'
),
jugo as (
  select public.dia_chicago(m.abierta_en) as dia, m.jugador_id
    from public.mesas_ia m
   where m.mano_informada >= 1 and m.abierta_en >= now() - interval '31 days'
  union
  select public.dia_chicago(p.creada_en), a.uid
    from public.partida_asientos a
    join public.partidas p on p.sala_id = a.sala_id
   where a.manos >= 1 and a.uid is not null and p.creada_en >= now() - interval '31 days'
),
activos as (
  select dia, count(*) as n from jugo group by dia
),
cifras as (
  select d.dia,
         coalesce(sum(m.mano_informada), 0)                                       as manos,
         count(m.dia)                                                             as mesas_abiertas,
         coalesce(sum(m.mano_informada) filter (where m.reto = 'basico'), 0)      as manos_basico,
         coalesce(sum(m.mano_informada) filter (where m.reto = 'avanzado'), 0)    as manos_avanzado,
         coalesce(sum(m.mano_informada) filter (where m.reto = 'pro'), 0)         as manos_pro
    from dias d
    left join mesas m on m.dia = d.dia
   group by d.dia
)
select c.dia, c.manos, c.mesas_abiertas,
       coalesce(a.n, 0)                     as jugadores_activos,
       round(c.manos::numeric / nullif(a.n, 0), 1) as manos_por_activo,
       c.manos_basico, c.manos_avanzado, c.manos_pro
  from cifras c
  left join activos a on a.dia = c.dia
 order by c.dia desc;
