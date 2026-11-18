-- MED · 06 · Tiempo de sesión
-- Contesta: sesiones por día, minutos por sesión (media y mediana), y sesiones y minutos por activo.
-- Definiciones: día de Chicago, el de inicio. Duración = ultimo_latido − inicio. Las sesiones de
--   menos de 30 s quedan fuera de todas las cifras y se cuentan aparte (sesiones_cortas). Una
--   recarga de la página abre otra sesión. Activo = entró ese día (fila `ingreso`).
-- Lee: public.sesiones, public.eventos
-- Ventana: últimos 30 días de Chicago, con los días en cero.
-- Columnas: dia, sesiones, sesiones_cortas, minutos_media, minutos_mediana, activos, sesiones_por_activo, minutos_por_activo
with dias as (
  select public.dia_chicago(now()) - n as dia
    from generate_series(0, 29) as n
),
duraciones as (
  select public.dia_chicago(s.inicio) as dia,
         extract(epoch from s.ultimo_latido - s.inicio) / 60 as minutos
    from public.sesiones s
   where s.inicio >= now() - interval '31 days'
),
activos as (
  select public.dia_chicago(e.creado_en) as dia, count(distinct e.jugador_id) as n
    from public.eventos e
   where e.tipo = 'ingreso' and e.creado_en >= now() - interval '31 days'
   group by 1
),
cifras as (
  select d.dia,
         count(*) filter (where x.minutos >= 0.5) as sesiones,
         count(*) filter (where x.minutos <  0.5) as sesiones_cortas,
         sum(x.minutos) filter (where x.minutos >= 0.5) as minutos,
         avg(x.minutos) filter (where x.minutos >= 0.5) as media,
         percentile_cont(0.5) within group (order by x.minutos)
           filter (where x.minutos >= 0.5)        as mediana
    from dias d
    left join duraciones x on x.dia = d.dia
   group by d.dia
)
select c.dia, c.sesiones, c.sesiones_cortas,
       round(c.media::numeric, 1)                       as minutos_media,
       round(c.mediana::numeric, 1)                     as minutos_mediana,
       coalesce(a.n, 0)                                 as activos,
       round(c.sesiones::numeric / nullif(a.n, 0), 2)   as sesiones_por_activo,
       round(c.minutos::numeric / nullif(a.n, 0), 1)    as minutos_por_activo
  from cifras c
  left join activos a on a.dia = c.dia
 order by c.dia desc;
