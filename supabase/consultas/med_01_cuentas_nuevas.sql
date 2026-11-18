-- MED · 01 · Cuentas nuevas por día y embudo código → nombre
-- Contesta: cuántos pidieron código, cuántos lo verificaron y cuántos eligieron nombre, por día.
-- Definiciones: día de Chicago. `signInWithOtp` crea la fila de auth.users al PEDIR el código
--   (created_at); verificarlo pone email_confirmed_at. El embudo mira a quienes verificaron ese
--   día y hoy tienen nombre, lo eligieran cuando lo eligieran. Las cuentas borradas no salen.
-- Lee: auth.users, public.profiles
-- Ventana: últimos 30 días de Chicago, con los días en cero.
-- Columnas: dia, codigos_pedidos, codigos_verificados, nombres_elegidos, verificados_con_nombre, pct_verificados_con_nombre
with dias as (
  select public.dia_chicago(now()) - n as dia
    from generate_series(0, 29) as n
),
cuentas as (
  select public.dia_chicago(u.created_at)         as dia_pedido,
         public.dia_chicago(u.email_confirmed_at) as dia_verificado,
         public.dia_chicago(p.created_at)         as dia_nombre,
         p.id is not null                         as con_nombre
    from auth.users u
    left join public.profiles p on p.id = u.id
)
select d.dia,
       count(*) filter (where c.dia_pedido = d.dia)                       as codigos_pedidos,
       count(*) filter (where c.dia_verificado = d.dia)                   as codigos_verificados,
       count(*) filter (where c.dia_nombre = d.dia)                       as nombres_elegidos,
       count(*) filter (where c.dia_verificado = d.dia and c.con_nombre)  as verificados_con_nombre,
       round(100.0 * count(*) filter (where c.dia_verificado = d.dia and c.con_nombre)
             / nullif(count(*) filter (where c.dia_verificado = d.dia), 0), 1) as pct_verificados_con_nombre
  from dias d
  left join cuentas c on d.dia in (c.dia_pedido, c.dia_verificado, c.dia_nombre)
 group by d.dia
 order by d.dia desc;
