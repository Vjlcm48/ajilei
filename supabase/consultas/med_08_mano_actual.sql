-- MED · 08 · «Mano actual» antes y después de las 20
-- Contesta: cuántas cuentas gastaron 0, 1–5, 6–19 o las 20 consultas gratis, y las de pago por semana.
-- Definiciones: sección «gratis»: consultas.gratis_usadas hoy; una cuenta sin fila cuenta en 0 (no
--   hay fecha de cada gratis). Sección «pago»: movimientos `consulta` por semana de Chicago;
--   ref_tipo 'mesa_ia' = contra las IAS, 'sala' = contra humanos. En «pago», cuentas = quienes pagaron.
-- Lee: public.profiles, public.consultas, public.movimientos
-- Ventana: «gratis», toda la historia; «pago», últimas 12 semanas, con las semanas en cero.
-- Columnas: seccion, grupo, cuentas, consultas_ias, consultas_humanos, hc_ias, hc_humanos
with semanas as (
  select date_trunc('week', public.dia_chicago(now())::timestamp)::date - 7 * n as semana
    from generate_series(0, 11) as n
),
tramos as (
  select * from (values (1, '0'), (2, '1–5'), (3, '6–19'), (4, '20')) as t(orden, tramo)
),
gratis as (
  select case when coalesce(c.gratis_usadas, 0) = 0 then '0'
              when c.gratis_usadas <= 5  then '1–5'
              when c.gratis_usadas <= 19 then '6–19'
              else '20' end as tramo,
         count(*) as cuentas
    from public.profiles p
    left join public.consultas c on c.jugador_id = p.id
   group by 1
),
pago as (
  select date_trunc('week', public.dia_chicago(m.creado_en)::timestamp)::date as semana,
         count(distinct m.jugador_id)                        as cuentas,
         count(*) filter (where m.ref_tipo = 'mesa_ia')      as ias,
         count(*) filter (where m.ref_tipo = 'sala')         as humanos,
         coalesce(-sum(m.monto) filter (where m.ref_tipo = 'mesa_ia'), 0) as hc_ias,
         coalesce(-sum(m.monto) filter (where m.ref_tipo = 'sala'), 0)    as hc_humanos
    from public.movimientos m
   where m.tipo = 'consulta'
   group by 1
)
select seccion, grupo, cuentas, consultas_ias, consultas_humanos, hc_ias, hc_humanos
  from (
    select 1 as bloque, t.orden, null::date as semana, 'gratis' as seccion, t.tramo as grupo,
           coalesce(g.cuentas, 0) as cuentas,
           null::bigint as consultas_ias, null::bigint as consultas_humanos,
           null::bigint as hc_ias, null::bigint as hc_humanos
      from tramos t
      left join gratis g on g.tramo = t.tramo
    union all
    select 2, 0, s.semana, 'pago', s.semana::text,
           coalesce(p.cuentas, 0), coalesce(p.ias, 0), coalesce(p.humanos, 0),
           coalesce(p.hc_ias, 0), coalesce(p.hc_humanos, 0)
      from semanas s
      left join pago p on p.semana = s.semana
  ) as filas
 order by bloque, orden, semana desc;
