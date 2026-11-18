-- MED · 02 · Activos por día (entró / jugó)
-- Contesta: cuántas cuentas entraron, cuántas jugaron y cuántas de las que jugaron también entraron.
-- Definiciones: día de Chicago. Entró = fila `ingreso` ese día. Jugó = cerró al menos una mano:
--   mesas_ia.mano_informada ≥ 1 por abierta_en, o partida_asientos.manos ≥ 1 por partidas.creada_en.
--   `ingreso` se escribe desde la migración de MED-1a T1 (2026-11-17): antes, entraron = 0 no dice nada.
-- Lee: public.eventos, public.mesas_ia, public.partida_asientos, public.partidas
-- Ventana: últimos 30 días de Chicago, con los días en cero.
-- Columnas: dia, entraron, jugaron, jugaron_y_entraron, pct_jugaron_de_entraron
with dias as (
  select public.dia_chicago(now()) - n as dia
    from generate_series(0, 29) as n
),
entro as (
  select distinct public.dia_chicago(e.creado_en) as dia, e.jugador_id
    from public.eventos e
   where e.tipo = 'ingreso' and e.jugador_id is not null
     and e.creado_en >= now() - interval '31 days'
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
cifras as (
  select d.dia,
         (select count(*) from entro e where e.dia = d.dia) as entraron,
         (select count(*) from jugo j where j.dia = d.dia)  as jugaron,
         (select count(*) from jugo j
            join entro e on e.dia = j.dia and e.jugador_id = j.jugador_id
           where j.dia = d.dia)                             as jugaron_y_entraron
    from dias d
)
select dia, entraron, jugaron, jugaron_y_entraron,
       round(100.0 * jugaron_y_entraron / nullif(entraron, 0), 1) as pct_jugaron_de_entraron
  from cifras
 order by dia desc;
