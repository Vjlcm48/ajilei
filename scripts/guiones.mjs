// ── guiones.mjs · ECO-1e · A-1 · CORRER LOS GUIONES SQL ANTES DEL `db push` ──
// Rector: AJILEI_ECO-1_Fase1e_v1.0.md §2. Se invoca `npm run guiones`.
//
// ── POR QUÉ EXISTE ─────────────────────────────────────────────────────────
// Cada migración de ECO-1 se sella corriendo su guion de `supabase/pruebas/` en
// el SQL Editor DESPUÉS del `db push`, contra la base de verdad. Antes del push
// no había dónde probarla: la 1a y la 1d levantaron un Postgres de usar y tirar
// (PGlite, WASM) en el scratchpad de la sesión, que vivía y moría con ella. Este
// guion es ese banco, ya permanente y con nombre.
//
// ── QUÉ HACE, EN UN BANCO NUEVO CADA VEZ (en memoria: nada toca el disco) ───
//   1. prepara lo mínimo de Supabase que las migraciones dan por hecho: los
//      roles `anon`, `authenticated` y `service_role`, el esquema `auth` con
//      `auth.users` y `auth.uid()` (que lee `request.jwt.claims`, como los
//      guiones), los privilegios por defecto, la publicación
//      `supabase_realtime` y el disparador que activa RLS en cada tabla nueva;
//   2. aplica TODAS las migraciones de `supabase/migrations/`, en orden, y
//      siembra las cuatro cuentas de antes de ECO-1 justo antes de la del libro
//      (las cuenta el guion de la 1a);
//   3. corre cada guion vigente y exige que traiga sus filas y que TODAS digan
//      PASA (la lista y las filas, en `eco/guionesCore.mjs`);
//   4. lo corre otra vez sin su `begin/rollback` y comprueba, comparando el
//      contenido de todas las tablas, que ninguna de las dos pasadas deja rastro;
//   5. pasada `med_consultas` (MED-1a T3): ejecuta cada consulta de
//      `supabase/consultas/` en una transacción de solo lectura, exige las
//      columnas que promete su cabecera y prueba la 11 y la 13 con filas
//      fabricadas que se deshacen (la lista, en `eco/consultasCore.mjs`);
//   6. sale con 0 / 1 / 2, como el resto del arnés.
//
// ── LO QUE NO ES ───────────────────────────────────────────────────────────
// No sustituye la corrida en el SQL Editor contra la base real, que es la que
// sella cada migración. Es la comprobación de ANTES del push. Dos límites
// declarados (registro de invariantes §6):
//   · PGlite no es el Postgres de Supabase: es otra versión mayor. El corredor
//     imprime las dos en cada corrida;
//   · es UNA conexión: dos dispositivos a la vez (el `for update`, la clave
//     idempotente bajo carrera) no se pueden ejecutar en paralelo aquí.
//
// Códigos: 0 = todo PASA y sin rastro · 1 = una migración no aplica, un guion
// revienta, alguna fila no dice PASA, faltan filas o queda rastro · 2 = error
// de instrumento (PGlite no está, el andamio no se levanta, un guion sin
// declarar, nada que correr).
import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import process from 'node:process'
import { RAIZ } from './arnes/fuente.mjs'
import { CODIGO, codigoDeSalida } from './arnes/nucleo.mjs'
import {
  SEMBRAR_ANTES_DE, CUENTAS_PREVIAS, POSTGRES_SUPABASE,
  clasificarGuiones, sinTransaccion, traeTransaccion, veredictoGuion, rastro,
} from './eco/guionesCore.mjs'
import {
  PRUEBAS_CON_DATOS, clasificarConsultas, leerCabecera, fallosDeCabecera, fallosDeColumnas,
} from './eco/consultasCore.mjs'

const MIGRACIONES = join(RAIZ, 'supabase/migrations')
const PRUEBAS = join(RAIZ, 'supabase/pruebas')
const CONSULTAS = join(RAIZ, 'supabase/consultas')
const leer = (ruta) => readFileSync(ruta, 'utf8')
const t0 = Date.now()

function instrumento(mensaje) {
  console.error(`\n✖ ERROR DE INSTRUMENTO (código 2): ${mensaje}`)
  process.exit(CODIGO.INSTRUMENTO)
}

// ── 0 · qué hay que correr ──────────────────────────────────────────────────
const migraciones = existsSync(MIGRACIONES) ? readdirSync(MIGRACIONES).filter((f) => f.endsWith('.sql')).sort() : []
const guiones = clasificarGuiones(existsSync(PRUEBAS) ? readdirSync(PRUEBAS).filter((f) => f.endsWith('.sql')) : [])
if (!migraciones.length) instrumento('no hay migraciones en supabase/migrations/')
if (!migraciones.includes(SEMBRAR_ANTES_DE)) instrumento(`falta la migración ${SEMBRAR_ANTES_DE}: no sé dónde sembrar las cuentas previas`)
if (guiones.sinDeclarar.length) instrumento(`guiones sin declarar en scripts/eco/guionesCore.mjs (vigente o retirado): ${guiones.sinDeclarar.join(', ')}`)
if (guiones.faltan.length) instrumento(`guiones vigentes que no están en supabase/pruebas/: ${guiones.faltan.join(', ')}`)
if (!guiones.vigentes.length) instrumento('no hay ningún guion vigente que correr')
const consultas = clasificarConsultas(existsSync(CONSULTAS) ? readdirSync(CONSULTAS).filter((f) => f.endsWith('.sql')) : [])
if (consultas.sinDeclarar.length) instrumento(`consultas sin declarar en scripts/eco/consultasCore.mjs: ${consultas.sinDeclarar.join(', ')}`)
if (consultas.faltan.length) instrumento(`consultas declaradas que no están en supabase/consultas/: ${consultas.faltan.join(', ')}`)

// ── 1 · el banco ────────────────────────────────────────────────────────────
let PGlite, versionPglite
try {
  ({ PGlite } = await import('@electric-sql/pglite'))
  versionPglite = JSON.parse(leer(join(RAIZ, 'node_modules/@electric-sql/pglite/package.json'))).version
} catch (e) {
  instrumento(`no puedo cargar @electric-sql/pglite (¿falta \`npm install\`?): ${e.message}`)
}

const db = new PGlite()
const avisos = []
const alAvisar = { onNotice: (n) => avisos.push(`${n.severity}: ${n.message}`) }
const ejecutar = (sql) => db.exec(sql, alAvisar)
const consultar = (sql, params) => db.query(sql, params, alAvisar)
// Un error dentro de un `begin` deja la transacción abortada: se deshace antes
// de seguir, o todo lo de después diría «current transaction is aborted».
async function intentar(sql) {
  try { return { resultados: await ejecutar(sql), error: null } }
  catch (e) { await db.exec('rollback').catch(() => {}); return { resultados: null, error: e.message } }
}

const ANDAMIO = `
set timezone = 'UTC';
create role anon nologin;
create role authenticated nologin;
create role service_role nologin bypassrls;
create schema auth;
grant usage on schema auth   to anon, authenticated, service_role;
grant usage on schema public to anon, authenticated, service_role;
create table auth.users (
  id uuid primary key, instance_id uuid, aud text, role text, email text,
  encrypted_password text, created_at timestamptz, updated_at timestamptz,
  raw_app_meta_data jsonb, raw_user_meta_data jsonb, last_sign_in_at timestamptz,
  email_confirmed_at timestamptz);
create function auth.uid() returns uuid language sql stable as $$
  select coalesce(nullif(current_setting('request.jwt.claim.sub', true), ''),
                  (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub'))::uuid $$;
grant execute on function auth.uid() to anon, authenticated, service_role;
alter default privileges in schema public grant all on tables    to anon, authenticated, service_role;
alter default privileges in schema public grant all on functions to anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
create publication supabase_realtime;
create function public.rls_auto_enable() returns event_trigger language plpgsql as $$
declare r record;
begin
  for r in select * from pg_event_trigger_ddl_commands()
            where command_tag = 'CREATE TABLE' and schema_name = 'public' loop
    execute format('alter table %s enable row level security', r.object_identity);
  end loop;
end $$;
create event trigger ensure_rls on ddl_command_end execute function public.rls_auto_enable();
`

let versionPostgres = '?'
try {
  await ejecutar(ANDAMIO)
  versionPostgres = (await consultar('select version() v')).rows[0].v
} catch (e) {
  instrumento(`el andamio de Supabase no se levanta en PGlite: ${e.message}`)
}
const enlazada = existsSync(join(RAIZ, 'supabase/.temp/postgres-version')) ? leer(join(RAIZ, 'supabase/.temp/postgres-version')).trim() : null
console.log('── guiones · ECO-1 · los guiones SQL en un banco nuevo')
console.log(`   PGlite ${versionPglite} · ${versionPostgres.split(' on ')[0].split(',')[0]}`)
console.log(`   Supabase: Postgres ${POSTGRES_SUPABASE}${enlazada ? ` (proyecto enlazado: ${enlazada})` : ''} — otra versión mayor: diferencia conocida (Invariantes §6)`)

// ── 2 · las migraciones, en orden ───────────────────────────────────────────
const veredictos = []
let seguir = true
for (const archivo of migraciones) {
  if (archivo === SEMBRAR_ANTES_DE) {
    for (const c of CUENTAS_PREVIAS) {
      await consultar(
        `insert into auth.users (id, instance_id, aud, role, email, encrypted_password, created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
         values ($1, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', $2, '', now(), now(), '{}', '{}')`, [c.id, c.correo])
      await consultar('insert into public.profiles (id, username) values ($1, $2)', [c.id, c.usuario])
    }
    console.log(`   · ${CUENTAS_PREVIAS.length} cuentas de antes de ECO-1 sembradas`)
  }
  const sql = leer(join(MIGRACIONES, archivo))
  const { error } = await intentar(traeTransaccion(sql) ? sql : `begin;\n${sql}\ncommit;`)
  console.log(`   ${error ? '✗' : '✓'} migración ${archivo}${error ? ` — ${error}` : ''}`)
  if (error) { veredictos.push('rojo'); seguir = false; break }
}

// ── 3 y 4 · cada guion, con y sin su transacción, y sin rastro ──────────────
// La foto: una huella del CONTENIDO de cada tabla de `public` y de `auth`. Las
// secuencias no cuentan (un `nextval` no se deshace) y `pg_temp` tampoco (muere
// con la sesión): rastro es lo que quedaría en la base de verdad.
async function foto() {
  const tablas = (await consultar(
    `select schemaname || '.' || tablename as t from pg_tables where schemaname in ('public', 'auth') order by 1`)).rows.map((r) => r.t)
  const out = {}
  for (const t of tablas) {
    out[t] = (await consultar(`select count(*)::int || ':' || md5(coalesce(string_agg(x::text, '|' order by x::text), '')) as h from ${t} x`)).rows[0].h
  }
  return out
}
const tablaDe = (resultados) => (resultados ?? []).filter((r) => r.rows && r.rows.length && 'resultado' in r.rows[0]).pop()?.rows ?? []

async function pasada(guion, sql, etiqueta) {
  const antes = await foto()
  const { resultados, error } = await intentar(sql)
  if (error) {
    console.log(`   ✗ ${guion.archivo} ${etiqueta} — el guion reventó: ${error}`)
    return 'rojo'
  }
  const filas = tablaDe(resultados)
  const v = veredictoGuion(filas, guion.filas)
  const huellas = rastro(antes, await foto())
  const pasan = filas.filter((f) => f.resultado === 'PASA').length
  const rojo = v.veredicto !== 'verde' || huellas.length > 0
  console.log(`   ${rojo ? '✗' : '✓'} ${guion.archivo} ${etiqueta} — ${pasan}/${guion.filas} PASA · ${huellas.length ? `DEJA RASTRO en ${huellas.join(', ')}` : 'sin rastro'}`)
  for (const f of v.fallos) console.log(`       ${f}`)
  if (v.veredicto === 'error') return 'error'
  return rojo ? 'rojo' : 'verde'
}

if (seguir) {
  for (const guion of guiones.vigentes) {
    const sql = leer(join(PRUEBAS, guion.archivo))
    const suelto = sinTransaccion(sql)
    if (suelto === null) {
      console.log(`   ✗ ${guion.archivo} — no tiene UNA línea \`begin;\` y UNA \`rollback;\`: no sé correrlo sin transacción`)
      veredictos.push('error')
      continue
    }
    veredictos.push(await pasada(guion, sql, 'con begin/rollback'))
    veredictos.push(await pasada(guion, suelto, 'sin begin/rollback'))
  }
}
for (const g of guiones.retirados) console.log(`   · ${g.archivo} — RETIRADO desde ${g.desde}: ${g.motivo}`)

// ── 5 · MED-1a T3 · `med_consultas` ─────────────────────────────────────────
// Cada consulta va en una transacción de solo lectura: un `select` puro la pasa
// y cualquier escritura revienta. `db.query` admite UNA sentencia por archivo.
async function correrConsulta(sql, siembra = null) {
  await ejecutar('begin')
  try {
    if (siembra) await ejecutar(siembra)
    await ejecutar('set transaction read only')
    return await consultar(sql)
  } finally {
    await db.exec('rollback').catch(() => {})
  }
}

let consultasVerdes = 0
if (seguir) {
  console.log('   · med_consultas · supabase/consultas/, de solo lectura')
  const antes = await foto()
  for (const c of consultas.vigentes) {
    const sql = leer(join(CONSULTAS, c.archivo))
    const cabecera = leerCabecera(sql)
    const fallos = fallosDeCabecera(c, cabecera)
    let filas = 0
    try {
      const r = await correrConsulta(sql)
      filas = r.rows.length
      fallos.push(...fallosDeColumnas(cabecera, r.fields))
      const prueba = PRUEBAS_CON_DATOS.find((p) => p.archivo === c.archivo)
      if (prueba) {
        const conDatos = await correrConsulta(sql, prueba.siembra)
        fallos.push(...prueba.comprobar(conDatos.rows).map((f) => `con filas fabricadas · ${f}`))
      }
    } catch (e) {
      fallos.push(`reventó: ${e.message}`)
    }
    console.log(`   ${fallos.length ? '✗' : '✓'} ${c.archivo} — ${cabecera.columnas.length} columnas · ${filas} filas${PRUEBAS_CON_DATOS.some((p) => p.archivo === c.archivo) ? ' · con filas fabricadas' : ''}`)
    for (const f of fallos) console.log(`       ${f}`)
    if (!fallos.length) consultasVerdes += 1
    veredictos.push(fallos.length ? 'rojo' : 'verde')
  }
  const huellas = rastro(antes, await foto())
  if (huellas.length) {
    console.log(`   ✗ med_consultas DEJA RASTRO en ${huellas.join(', ')}`)
    veredictos.push('rojo')
  }
}

await db.close().catch(() => {})
const codigo = codigoDeSalida(veredictos)
const palabra = codigo === CODIGO.VERDE ? 'VERDE' : codigo === CODIGO.ROJO ? 'ROJO' : 'ERROR DE INSTRUMENTO'
console.log(`── guiones · ${palabra} · ${migraciones.length} migraciones · ${guiones.vigentes.length} guiones × 2 pasadas · med_consultas ${consultasVerdes}/${consultas.vigentes.length} · ${((Date.now() - t0) / 1000).toFixed(1)} s → código ${codigo}`)
process.exit(codigo)
