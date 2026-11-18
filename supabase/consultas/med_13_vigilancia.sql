-- MED · 13 · Vigilancia de la medición
-- Contesta: si la propia medición está sana, en una sola tabla.
-- Definiciones: `medicion_invalida` debe ser 0; una fila es un defecto del árbitro (estado DEFECTO)
--   y salen las últimas 5. Por cada `tipo`, filas en 7 días y su última fila: MIRAR = nada en 7 días,
--   para ver si algo dejó de escribir (sin partidas PvP, los anuncio_* callan con razón). Sin purga
--   hasta junio de 2027: la base avisa al pasar de 300 MB. valor va en filas o en bytes.
-- Lee: public.eventos, public.sesiones, tamaños de tablas y base
-- Ventana: 7 días para las filas; toda la historia para `medicion_invalida` y la última fila.
-- Columnas: seccion, nombre, valor, ultima_fila, estado, detalle
with tipos as (
  select t.tipo
    from (values ('ingreso'), ('anuncio_inicio'), ('anuncio_omitido'),
                 ('anuncio_vuelto'), ('pvp_reconexion')) as t(tipo)
  union
  select distinct e.tipo from public.eventos e where e.tipo <> 'medicion_invalida'
),
por_tipo as (
  select t.tipo,
         count(e.id) filter (where e.creado_en >= now() - interval '7 days') as filas_7d,
         max(e.creado_en) as ultima
    from tipos t
    left join public.eventos e on e.tipo = t.tipo
   group by t.tipo
),
invalidas as (
  select count(*) as n, max(e.creado_en) as ultima
    from public.eventos e
   where e.tipo = 'medicion_invalida'
),
ultimas_invalidas as (
  select e.id, e.creado_en, e.datos
    from public.eventos e
   where e.tipo = 'medicion_invalida'
   order by e.id desc
   limit 5
),
sesiones as (
  select count(*) filter (where s.inicio >= now() - interval '7 days') as filas_7d,
         max(s.ultimo_latido) as ultima
    from public.sesiones s
),
tamanos as (
  select 'eventos' as nombre, pg_total_relation_size('public.eventos') as bytes, 1 as orden
  union all
  select 'sesiones', pg_total_relation_size('public.sesiones'), 2
  union all
  select 'base', pg_database_size(current_database()), 3
)
select seccion, nombre, valor, ultima_fila, estado, detalle
  from (
    select 1 as bloque, 0::bigint as orden, 'medicion_invalida' as seccion, 'filas' as nombre,
           n as valor, ultima as ultima_fila,
           case when n = 0 then 'OK' else 'DEFECTO' end as estado,
           'debe ser 0' as detalle
      from invalidas
    union all
    select 2, -id, 'medicion_invalida', 'fila ' || id, null::bigint, creado_en, 'DEFECTO', datos::text
      from ultimas_invalidas
    union all
    select 3, 0, 'eventos_7d', tipo, filas_7d, ultima,
           case when filas_7d > 0 then 'OK' else 'MIRAR' end,
           case when ultima is null then 'nunca se escribió' else 'filas en 7 días' end
      from por_tipo
    union all
    select 4, 0, 'sesiones_7d', 'filas', filas_7d, ultima,
           case when filas_7d > 0 then 'OK' else 'MIRAR' end, 'filas en 7 días'
      from sesiones
    union all
    select 5, orden, 'tamano', nombre, bytes, null::timestamptz,
           case when nombre = 'base' and bytes > 300 * 1024 * 1024 then 'MIRAR' else 'OK' end,
           pg_size_pretty(bytes) || case when nombre = 'base' then ' · aviso al pasar de 300 MB' else '' end
      from tamanos
  ) as filas
 order by bloque, orden, nombre;
