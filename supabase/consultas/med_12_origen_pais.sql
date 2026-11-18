-- MED · 12 · Origen y país de las cuentas nuevas
-- Contesta: cuentas nuevas por semana, por origen, por país derivado de la zona y por país elegido.
-- Definiciones: semana de Chicago, la de profiles.created_at. origen nulo = «previo», y sale aparte:
--   su país derivado también dice «previo». pais_zona sale de origen_datos->>'zona_horaria'
--   (America/Caracas = VE); lo que el CASE no conoce es «otro», con la zona al lado para ampliarlo.
--   pais_elegido = profiles.pais, o «sin elegir».
-- Lee: public.profiles
-- Ventana: últimas 12 semanas; solo las combinaciones con cuentas.
-- Columnas: semana, origen, pais_zona, zona_horaria, pais_elegido, cuentas
with cuentas as (
  select date_trunc('week', public.dia_chicago(p.created_at)::timestamp)::date as semana,
         p.origen,
         p.origen_datos ->> 'zona_horaria' as zona,
         p.pais
    from public.profiles p
   where public.dia_chicago(p.created_at)
         >= date_trunc('week', public.dia_chicago(now())::timestamp)::date - 77
),
con_pais as (
  select semana, origen, zona, pais,
         case
           when origen is null then 'previo'
           when zona = 'America/Caracas' then 'VE'
           when zona = 'America/Bogota' then 'CO'
           when zona in ('Europe/Madrid', 'Atlantic/Canary', 'Africa/Ceuta') then 'ES'
           when zona = 'Pacific/Honolulu'
             or zona ~ '^America/(New_York|Detroit|Chicago|Menominee|Denver|Boise|Phoenix|Los_Angeles|Anchorage|Juneau|Sitka|Yakutat|Metlakatla|Nome|Adak|Indianapolis|Louisville|Indiana/.+|Kentucky/.+|North_Dakota/.+)$' then 'US'
           when zona ~ '^America/(Mexico_City|Cancun|Merida|Monterrey|Matamoros|Mazatlan|Chihuahua|Ciudad_Juarez|Ojinaga|Hermosillo|Tijuana|Bahia_Banderas)$' then 'MX'
           when zona = 'America/Sao_Paulo' then 'BR'
           when zona = 'America/Lima' then 'PE'
           when zona = 'America/Santiago' then 'CL'
           when zona = 'America/Buenos_Aires' or zona like 'America/Argentina/%' then 'AR'
           when zona = 'America/Panama' then 'PA'
           when zona = 'America/Guayaquil' then 'EC'
           else 'otro'
         end as pais_zona
    from cuentas
)
select semana,
       coalesce(origen, 'previo')    as origen,
       pais_zona,
       zona                          as zona_horaria,
       coalesce(pais, 'sin elegir')  as pais_elegido,
       count(*)                      as cuentas
  from con_pais
 group by semana, origen, pais_zona, zona, pais
 order by semana desc, (origen is null), cuentas desc, 2, 3, 4, 5;
