-- ═══════════════════════════════════════════════════════════════════════════
-- AJILEI · ARN-4 · Tanda 4c (C2) — Verificación de los permisos de `profiles`
-- ═══════════════════════════════════════════════════════════════════════════
-- Ficha AJILEI_ARN-4_Tanda4c_v1.0.md §8.
-- Migración que verifica: supabase/migrations/20261103150000_arn4c_profiles_columnas.sql.
--
-- CÓMO SE USA: como los demás. Se pega ENTERO en el SQL Editor DESPUÉS del push
-- y se corre UNA vez. Devuelve UNA tabla `prueba | resultado | detalle`, y cada
-- fila debe decir PASA. Solo lee permisos: no toca ninguna fila. Antes del push
-- lo corre `npm run guiones` contra un Postgres en memoria.
-- ═══════════════════════════════════════════════════════════════════════════

begin;

select c.orden || ' · authenticated ' || case when c.debe then 'lee ' else 'no lee ' end || c.columna as prueba,
       case when has_column_privilege('authenticated', 'public.profiles', c.columna, 'select') = c.debe
            then 'PASA' else 'FALLA' end as resultado,
       format('esperado=%s', c.debe) as detalle
  from (values
         (1, 'id', true),
         (2, 'username', true),
         (3, 'pais', true),
         (4, 'estado', true),
         (5, 'nombre_cambiado_en', false),
         (6, 'created_at', false),
         (7, 'updated_at', false)
       ) as c(orden, columna, debe)
 order by c.orden;

rollback;
