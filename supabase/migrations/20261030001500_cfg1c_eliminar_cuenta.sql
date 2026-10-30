-- ═══════════════════════════════════════════════════════════════════════════
-- AJILEI · CFG-1 · Fase 1c — Eliminar cuenta: la guarda de la partida abierta
-- ═══════════════════════════════════════════════════════════════════════════
-- Ficha AJILEI_CFG-1_Fase1c_v1.0.md §3.1. Verificación:
-- supabase/pruebas/cfg1c_verificacion.sql.
--
-- ── QUÉ TRAE ───────────────────────────────────────────────────────────────
-- UNA función, `partida_abierta_de(uuid)`, que la Edge Function
-- `eliminar_cuenta` llama con la llave de servicio ANTES de borrar al usuario.
-- No trae tablas, ni disparadores, ni cambia ninguna función existente.
--
-- ── EL BORRADO NO ESTÁ AQUÍ ────────────────────────────────────────────────
-- Lo hace la función con `auth.admin.deleteUser(uid)`, que borra la fila de
-- `auth.users`; de ahí cuelga todo por cascada (Fase 0 §H-2): `profiles` y,
-- detrás, billetera, libro, mesas, salas, puntos… Los libros rechazan
-- cualquier DELETE que no llegue en cascada (`pg_trigger_depth() >= 2`), así
-- que un borrado tabla por tabla FALLA, y es lo que se quiere: nunca hay DELETE
-- manual sobre los libros (INV-71).
--
-- `bonos_bienvenida` NO cuelga de nadie (sin FK, a propósito, eco1a:229-241):
-- la huella del correo sobrevive y quien vuelva con el mismo correo empieza de
-- cero y sin bono.
--
-- ── POR QUÉ UNA FUNCIÓN NUEVA Y NO LAS QUE HAY ─────────────────────────────
--   · `mi_mesa_ia()` usa `auth.uid()`: con la llave de servicio no hay uid.
--   · `sala_esperando_de(uuid)` sólo ve las salas 'esperando', y aquí cuentan
--     también las 'activa' (decisión de Victor, §0), y el anfitrión aunque no
--     estuviera sentado.
-- Sus PREDICADOS sí se copian: la mesa abierta es la condición del índice
-- `mesas_ia_una_abierta_idx` (`estado = 'abierta'`), y la sala es la join de
-- `sala_esperando_de` con los dos estados vivos.
--
-- ── PRIMERO SE BARRE ───────────────────────────────────────────────────────
-- Doctrina de SAL-A (`sal_a_salas.sql:30`): quien decide si una sala venció es
-- `barrer_salas()`, y toda función que mira salas lo llama antes. Sin eso, una
-- sala 'esperando' caducada o una 'activa' muerta (más de 10 minutos sin
-- partida, provisional hasta MES-PvP) que nadie barrió bloquearía el borrado
-- hasta que alguien abriera Salas. Por eso es `plpgsql` y `volatile`.
--
-- ── QUIÉN LA PUEDE LLAMAR ──────────────────────────────────────────────────
-- Sólo `service_role`. Revocada a `public`, `anon` y `authenticated`: recibe un
-- uuid cualquiera, y al cliente no le toca preguntar por cuentas ajenas.
-- ═══════════════════════════════════════════════════════════════════════════

create or replace function public.partida_abierta_de(p_uid uuid)
returns text
language plpgsql
volatile
security definer
set search_path = ''
as $fn$
begin
  perform public.barrer_salas();

  if exists (
    select 1 from public.mesas_ia m
     where m.jugador_id = p_uid and m.estado = 'abierta'
  ) then
    return 'mesa_ia';
  end if;

  if exists (
    select 1 from public.salas s
     where s.anfitrion_id = p_uid
       and s.estado in ('esperando', 'activa')
  ) or exists (
    select 1 from public.salas s
      join public.sala_jugadores j on j.sala_id = s.id
     where j.jugador_id = p_uid
       and s.estado in ('esperando', 'activa')
  ) then
    return 'sala';
  end if;

  return null;
end
$fn$;

comment on function public.partida_abierta_de(uuid) is
  'CFG-1 1c · null, ''mesa_ia'' o ''sala'' (esperando o activa, anfitrión o sentado). La guarda de eliminar_cuenta. Sólo service_role.';

revoke execute on function public.partida_abierta_de(uuid) from public, anon, authenticated;
grant  execute on function public.partida_abierta_de(uuid) to service_role;
