-- MED · 14 · Generador: nuevos por cada 100 activos
-- Contesta: la métrica rectora del Generador, por mes.
-- Definiciones: mes de Chicago. Nuevas = profiles.created_at. Activos = cuentas distintas con fila
--   `ingreso` en el mes. `ingreso` se escribe desde MED-1a T1: noviembre de 2026 va incompleto y antes
--   no hay activos (nuevos_por_100 nulo). Los `inv_*` la afinan cuando GEN-1 exista.
-- Lee: public.profiles, public.eventos
-- Ventana: últimos 12 meses de Chicago, con los meses en cero.
-- Columnas: mes, cuentas_nuevas, activos, nuevos_por_100_activos
with meses as (
  select (date_trunc('month', public.dia_chicago(now())::timestamp)
          - make_interval(months => n))::date as mes
    from generate_series(0, 11) as n
),
nuevas as (
  select date_trunc('month', public.dia_chicago(p.created_at)::timestamp)::date as mes,
         count(*) as n
    from public.profiles p
   group by 1
),
activos as (
  select date_trunc('month', public.dia_chicago(e.creado_en)::timestamp)::date as mes,
         count(distinct e.jugador_id) as n
    from public.eventos e
   where e.tipo = 'ingreso'
   group by 1
)
select m.mes,
       coalesce(n.n, 0) as cuentas_nuevas,
       coalesce(a.n, 0) as activos,
       round(100.0 * coalesce(n.n, 0) / nullif(a.n, 0), 1) as nuevos_por_100_activos
  from meses m
  left join nuevas n on n.mes = m.mes
  left join activos a on a.mes = m.mes
 order by m.mes desc;
