-- vuelta atrás: grant select on public.profiles to authenticated;
-- ═══════════════════════════════════════════════════════════════════════════
-- AJILEI · ARN-4 · Tanda 4c (C2) — Permisos por columnas en `profiles`
-- ═══════════════════════════════════════════════════════════════════════════
-- Ficha AJILEI_ARN-4_Tanda4c_v1.0.md §8. Verificación:
-- supabase/pruebas/arn4c_verificacion.sql.
--
-- La política de lectura de `profiles` deja ver todas las filas a cualquier
-- cuenta, y con ellas `nombre_cambiado_en`, `created_at` y `updated_at`. El
-- cliente solo pide `id, username, pais, estado` (`COLUMNAS_PERFIL`, y `username`
-- en el embebido de asientos); las funciones que leen más columnas son
-- `security definer` y no pasan por este permiso.
revoke select on public.profiles from public, anon, authenticated;
grant  select (id, username, pais, estado) on public.profiles to authenticated;
