// ── ECO-1e · A-1 · lo puro del corredor de guiones SQL ──────────────────────
// Rector: AJILEI_ECO-1_Fase1e_v1.0.md §2. El corredor (`scripts/guiones.mjs`,
// `npm run guiones`) levanta un Postgres en memoria y corre contra él los
// guiones de `supabase/pruebas/`. Aquí vive lo que decide SIN base de datos —la
// lista de guiones, el veredicto de una tabla de resultados, el guion sin su
// `begin/rollback`— para que vitest lo pruebe sin cargar PGlite (25 MB de WASM
// que no pueden alargar cada corrida de pruebas).
//
// ── LA LISTA ES EL CONTRATO ────────────────────────────────────────────────
// Un guion nuevo en `supabase/pruebas/` que nadie declara aquí no se corre, y
// un guion que no se corre parece verde. Por eso la carpeta se compara con las
// dos listas: lo que no está ni en VIGENTES ni en RETIRADOS es un error del
// instrumento (código 2), en el corredor y en `guionesCore.test.js`.

/** Los guiones que el corredor corre, con las filas que cada uno devuelve. */
export const GUIONES_VIGENTES = Object.freeze([
  Object.freeze({ archivo: 'eco1a_verificacion.sql', filas: 21, migracion: '20261007144943_eco1a_libro.sql' }),
  Object.freeze({ archivo: 'eco1d_verificacion.sql', filas: 23, migracion: '20261009105658_eco1d_constancia_limites_valvula.sql' }),
  Object.freeze({ archivo: 'eco1g_verificacion.sql', filas: 21, migracion: '20261012230807_eco1g_video.sql' }),
  Object.freeze({ archivo: 'rnk1a_verificacion.sql', filas: 37, migracion: '20261024191731_rnk1a_libro_puntos.sql' }),
  Object.freeze({ archivo: 'cfg1c_verificacion.sql', filas: 14, migracion: '20261030001500_cfg1c_eliminar_cuenta.sql' }),
  Object.freeze({ archivo: 'cfg1b_verificacion.sql', filas: 18, migracion: '20261030013000_cfg1b_perfil.sql' }),
  Object.freeze({ archivo: 'cfg1e_verificacion.sql', filas: 19, migracion: '20261030193000_cfg1e_mano_actual.sql' }),
  Object.freeze({ archivo: 'tie1a_verificacion.sql', filas: 23, migracion: '20261031150000_tie1a_inventario.sql' }),
  Object.freeze({ archivo: 'arn4c_verificacion.sql', filas: 7, migracion: '20261103150000_arn4c_profiles_columnas.sql' }),
])

/**
 * Los que ya no se corren, y por qué. El de la 1c (E10 de la 1e): corre en UNA
 * transacción, `now()` no se mueve y sienta 16 veces a la misma cuenta; desde
 * los límites por minuto de la 1d corta en su prueba 9 (la 11.ª sentada es
 * `limite`). Sus pruebas críticas viven en el guion de la 1d (22 y 23).
 */
export const GUIONES_RETIRADOS = Object.freeze([
  Object.freeze({
    archivo: 'eco1c_verificacion.sql', desde: 'ECO-1d',
    motivo: 'corta en su prueba 9 desde los límites por minuto; sus críticas, en el guion de la 1d (22 y 23)',
  }),
])

// Las pruebas 1 y 2 del guion de la 1a cuentan las CUATRO cuentas de antes de
// ECO-1 (D3), que la migración del libro bautiza con su bono. El banco las
// siembra justo antes de esa migración, como el banco de sesión de la 1a.
// Correos de `example.com`, con cuatro formas canónicas distintas (un punto y
// un `+` de más para que `correo_canonico` tenga algo que hacer).
export const SEMBRAR_ANTES_DE = '20261007144943_eco1a_libro.sql'
export const CUENTAS_PREVIAS = Object.freeze([
  Object.freeze({ id: '10000000-0000-4000-8000-000000000001', correo: 'Previa.Uno+s25@example.com', usuario: 'PreviaUno' }),
  Object.freeze({ id: '10000000-0000-4000-8000-000000000002', correo: 'previa.dos@example.com', usuario: 'PreviaDos' }),
  Object.freeze({ id: '10000000-0000-4000-8000-000000000003', correo: 'Previa.Tres@Example.com', usuario: 'PreviaTres' }),
  Object.freeze({ id: '10000000-0000-4000-8000-000000000004', correo: 'previacuatro@example.com', usuario: 'PreviaCuatro' }),
])

// El Postgres de la base real (`supabase/.temp/postgres-version` el día de la
// 1e). PGlite trae otra versión mayor: la diferencia es CONOCIDA y está en el
// registro de invariantes (§6). El corredor imprime las dos en cada corrida.
export const POSTGRES_SUPABASE = '17.6.1'

/**
 * Compara la carpeta de guiones con las dos listas.
 * @param {string[]} archivos  los `.sql` de `supabase/pruebas/`
 * @returns {{ vigentes: object[], retirados: object[], sinDeclarar: string[], faltan: string[] }}
 */
export function clasificarGuiones(archivos) {
  const hay = new Set(archivos)
  const declarados = new Set([...GUIONES_VIGENTES, ...GUIONES_RETIRADOS].map((g) => g.archivo))
  return {
    vigentes: GUIONES_VIGENTES.filter((g) => hay.has(g.archivo)),
    retirados: GUIONES_RETIRADOS.filter((g) => hay.has(g.archivo)),
    sinDeclarar: archivos.filter((a) => !declarados.has(a)).sort(),
    faltan: GUIONES_VIGENTES.filter((g) => !hay.has(g.archivo)).map((g) => g.archivo),
  }
}

/**
 * El guion sin su `begin;` … `rollback;`: el segundo camino de «no deja
 * rastro» (la función de `pg_temp` que se deshace sola). Exige UNA línea de
 * cada, a solas en su línea; si no, `null`: el guion cambió de forma y el
 * corredor no adivina.
 */
export function sinTransaccion(sql) {
  const lineas = String(sql).replace(/\r\n/g, '\n').split('\n')
  const es = (palabra) => (l) => l.trim().toLowerCase() === `${palabra};`
  const begins = lineas.filter(es('begin')).length
  const rollbacks = lineas.filter(es('rollback')).length
  if (begins !== 1 || rollbacks !== 1) return null
  return lineas.filter((l) => !es('begin')(l) && !es('rollback')(l)).join('\n')
}

/** ¿La migración trae su propia transacción? (la 0001 sí; las demás las envuelve el corredor). */
export const traeTransaccion = (sql) => /^\s*begin;\s*$/im.test(String(sql)) && /^\s*commit;\s*$/im.test(String(sql))

/**
 * El veredicto de la tabla que devuelve un guion (`prueba | resultado | detalle`).
 * Verde solo si trae EXACTAMENTE las filas esperadas y todas dicen PASA. Sin
 * tabla o sin filas es 'error': un guion que no contesta no midió nada.
 * @returns {{ veredicto: 'verde'|'rojo'|'error', fallos: string[] }}
 */
export function veredictoGuion(filas, esperadas) {
  if (!Array.isArray(filas) || filas.length === 0) return { veredicto: 'error', fallos: ['el guion no devolvió ninguna fila'] }
  const fallos = []
  for (const f of filas) {
    if (f?.resultado !== 'PASA') fallos.push(`${f?.prueba ?? '(sin nombre)'} → ${f?.resultado ?? '(sin resultado)'} · ${f?.detalle ?? ''}`)
  }
  if (filas.length !== esperadas) fallos.push(`devolvió ${filas.length} filas y se esperaban ${esperadas}`)
  return { veredicto: fallos.length ? 'rojo' : 'verde', fallos }
}

/**
 * Las tablas cuyo contenido cambió entre dos fotos del banco (`{ tabla: huella }`).
 * Vacío = sin rastro.
 */
export function rastro(antes, despues) {
  const tablas = [...new Set([...Object.keys(antes ?? {}), ...Object.keys(despues ?? {})])].sort()
  return tablas.filter((t) => (antes ?? {})[t] !== (despues ?? {})[t])
}
