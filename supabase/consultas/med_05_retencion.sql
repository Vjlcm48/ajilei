-- MED · 05 · Retención D1/D7/D30
-- Contesta: de cada cohorte semanal de registro, qué parte volvió a entrar a D1, D7 y D30.
-- Definiciones: día de Chicago; semana de lunes a domingo. Registro = profiles.created_at. Volver a
--   Dn = tener fila `ingreso` justo el día registro + n. Una cuenta solo se mide en Dn cuando ese
--   día ya terminó (medibles_dn): los porcentajes de una cohorte joven miran solo a esas. Las
--   cuentas anteriores a 2026-11-16 no tienen `ingreso` previo: salen en la fila «previo», sin cifras.
-- Lee: public.profiles, public.eventos
-- Ventana: todas las semanas desde la del 2026-11-16, más la fila «previo».
-- Columnas: cohorte, cuentas, medibles_d1, pct_d1, medibles_d7, pct_d7, medibles_d30, pct_d30
with hoy as (
  select public.dia_chicago(now()) as dia
),
semanas as (
  select date '2026-11-16' + 7 * n as semana
    from generate_series(0, ((select dia from hoy) - date '2026-11-16') / 7) as n
),
ingresos as (
  select distinct e.jugador_id, public.dia_chicago(e.creado_en) as dia
    from public.eventos e
   where e.tipo = 'ingreso' and e.jugador_id is not null
),
cuentas as (
  select p.id, public.dia_chicago(p.created_at) as registro
    from public.profiles p
),
medidas as (
  select date_trunc('week', c.registro::timestamp)::date as semana,
         c.registro + 1  < h.dia as medible_d1,
         c.registro + 7  < h.dia as medible_d7,
         c.registro + 30 < h.dia as medible_d30,
         exists (select 1 from ingresos i where i.jugador_id = c.id and i.dia = c.registro + 1)  as volvio_d1,
         exists (select 1 from ingresos i where i.jugador_id = c.id and i.dia = c.registro + 7)  as volvio_d7,
         exists (select 1 from ingresos i where i.jugador_id = c.id and i.dia = c.registro + 30) as volvio_d30
    from cuentas c
   cross join hoy h
   where c.registro >= date '2026-11-16'
),
cohortes as (
  select s.semana,
         count(m.semana)                       as cuentas,
         count(*) filter (where m.medible_d1)  as medibles_d1,
         count(*) filter (where m.medible_d1  and m.volvio_d1)  as volvieron_d1,
         count(*) filter (where m.medible_d7)  as medibles_d7,
         count(*) filter (where m.medible_d7  and m.volvio_d7)  as volvieron_d7,
         count(*) filter (where m.medible_d30) as medibles_d30,
         count(*) filter (where m.medible_d30 and m.volvio_d30) as volvieron_d30
    from semanas s
    left join medidas m on m.semana = s.semana
   group by s.semana
)
select cohorte, cuentas, medibles_d1, pct_d1, medibles_d7, pct_d7, medibles_d30, pct_d30
  from (
    select 0 as orden, date '2026-11-16' as semana, 'previo' as cohorte,
           (select count(*) from cuentas c where c.registro < date '2026-11-16') as cuentas,
           null::bigint as medibles_d1, null::numeric as pct_d1,
           null::bigint as medibles_d7, null::numeric as pct_d7,
           null::bigint as medibles_d30, null::numeric as pct_d30
    union all
    select 1, semana, semana::text, cuentas,
           medibles_d1,  round(100.0 * volvieron_d1  / nullif(medibles_d1, 0), 1),
           medibles_d7,  round(100.0 * volvieron_d7  / nullif(medibles_d7, 0), 1),
           medibles_d30, round(100.0 * volvieron_d30 / nullif(medibles_d30, 0), 1)
      from cohortes
  ) as filas
 order by orden, semana desc;
