// ── MED-1a T3 · lo puro de la pasada `med_consultas` ────────────────────────
// Rector: AJILEI_MED-1a_T3_v1.0.md §3. Las consultas de `supabase/consultas/` son
// texto que Victor pega en el SQL Editor: si una campaña renombra una columna,
// tienen que romperse A LA VISTA. `scripts/guiones.mjs` las ejecuta contra el
// banco PGlite; aquí vive lo que decide sin base de datos (la lista, la cabecera
// y los veredictos), para que vitest lo pruebe sin cargar PGlite.
//
// Como con los guiones, LA LISTA ES EL CONTRATO: un `.sql` que nadie declara aquí
// no se corre, y lo que no se corre parece verde.

const consulta = (nn, slug, pregunta) => Object.freeze({
  nn, archivo: `med_${nn}_${slug}.sql`, nombre: `MED · ${nn} · ${pregunta}`,
})

export const CONSULTAS_MED = Object.freeze([
  consulta('01', 'cuentas_nuevas', 'Cuentas nuevas por día y embudo código → nombre'),
  consulta('02', 'activos', 'Activos por día (entró / jugó)'),
  consulta('03', 'manos_ias', 'Manos contra las IAS, total y por activo'),
  consulta('04', 'manos_humanos', 'Manos contra humanos, total y promedio por partida'),
  consulta('05', 'retencion', 'Retención D1/D7/D30'),
  consulta('06', 'sesiones', 'Tiempo de sesión'),
  consulta('07', 'tapetes', 'Tapetes comprados'),
  consulta('08', 'mano_actual', '«Mano actual» antes y después de las 20'),
  consulta('09', 'partidas_pvp', 'Partidas PvP por tamaño, apuesta, entrada y ritmo'),
  consulta('10', 'reconexiones_recargas', 'Reconexiones y recargas de las partidas PvP'),
  consulta('11', 'pausa_anuncio', 'La pausa de anuncio: cuántos omiten y a qué segundo'),
  consulta('12', 'origen_pais', 'Origen y país de las cuentas nuevas'),
  consulta('13', 'vigilancia', 'Vigilancia de la medición'),
  consulta('14', 'generador', 'Generador: nuevos por cada 100 activos'),
])

/** Compara la carpeta con la lista. */
export function clasificarConsultas(archivos) {
  const hay = new Set(archivos)
  const declaradas = new Set(CONSULTAS_MED.map((c) => c.archivo))
  return {
    vigentes: CONSULTAS_MED.filter((c) => hay.has(c.archivo)),
    sinDeclarar: archivos.filter((a) => !declaradas.has(a)).sort(),
    faltan: CONSULTAS_MED.filter((c) => !hay.has(c.archivo)).map((c) => c.archivo),
  }
}

/**
 * La cabecera comentada de una consulta: la primera línea es su nombre para el
 * SQL Editor; después, `-- Clave: valor`. Una línea `--   …` continúa la anterior.
 * @returns {{ nombre: string|null, contesta?: string, definiciones?: string, lee?: string, ventana?: string, columnas: string[] }}
 */
export function leerCabecera(sql) {
  const lineas = String(sql).replace(/\r\n/g, '\n').split('\n')
  const comentarios = []
  for (const l of lineas) {
    if (!l.startsWith('--')) break
    comentarios.push(l)
  }
  const out = { nombre: comentarios[0]?.match(/^-- (MED · \d\d · .+)$/)?.[1] ?? null }
  let clave = null
  for (const l of comentarios.slice(1)) {
    const m = l.match(/^-- (Contesta|Definiciones|Lee|Ventana|Columnas): (.+)$/)
    if (m) {
      clave = m[1].toLowerCase()
      out[clave] = m[2].trim()
    } else if (clave && /^-- {3}\S/.test(l)) {
      out[clave] += ` ${l.slice(5).trim()}`
    } else {
      clave = null
    }
  }
  out.columnas = (out.columnas ?? '').split(',').map((c) => c.trim()).filter(Boolean)
  return out
}

/** Lo que la cabecera de una consulta tiene que traer, sin ejecutarla. */
export function fallosDeCabecera(consultaMed, cabecera) {
  const fallos = []
  if (cabecera.nombre !== consultaMed.nombre) fallos.push(`la cabecera se llama «${cabecera.nombre}» y la lista dice «${consultaMed.nombre}»`)
  for (const clave of ['contesta', 'definiciones', 'lee', 'ventana']) {
    if (!cabecera[clave]) fallos.push(`la cabecera no trae «${clave}»`)
  }
  if (!cabecera.columnas.length) fallos.push('la cabecera no promete columnas')
  return fallos
}

/** Las columnas devueltas contra las prometidas: nombre, número y orden. */
export function fallosDeColumnas(cabecera, campos) {
  const reales = (campos ?? []).map((c) => c.name)
  if (reales.join('|') === cabecera.columnas.join('|')) return []
  return [`columnas: prometía ${cabecera.columnas.length} (${cabecera.columnas.join(', ')}) y devolvió ${reales.length} (${reales.join(', ')})`]
}

const SALA_11 = 'e1a3a000-0000-4000-8000-000000000011'
const SALA_13 = 'e1a3a000-0000-4000-8000-000000000013'
const num = (v) => (v === null || v === undefined ? null : Number(v))
const distinto = (nombre, real, esperado) => (real === esperado ? [] : [`${nombre}: ${real} y se esperaba ${esperado}`])

const evento = (tipo, datos) => `(null, '${tipo}', '${JSON.stringify(datos)}'::jsonb)`
const anuncio = (tipo, asiento, extra = {}) => evento(tipo, { sala: SALA_11, mano: 7, asiento, ...extra })

/**
 * Las dos consultas con más lógica se prueban con filas fabricadas, que se
 * deshacen en la misma transacción. La 11, con un asiento por cada salida y dos
 * omisiones (4 s y 6 s): mediana 5,0 y p90 5,8.
 */
export const PRUEBAS_CON_DATOS = Object.freeze([
  Object.freeze({
    archivo: 'med_11_pausa_anuncio.sql',
    siembra: `insert into public.eventos (jugador_id, tipo, datos) values
      ${[
    ...[0, 1, 2, 3, 4].map((a) => anuncio('anuncio_inicio', a)),
    anuncio('anuncio_omitido', 0, { ms: 4000 }),
    anuncio('anuncio_omitido', 1, { ms: 6000 }),
    anuncio('anuncio_vuelto', 2, { ms: 30000, como: 'tope' }),
    anuncio('anuncio_vuelto', 3, { ms: 9000, como: 'mesa' }),
  ].join(',\n      ')}`,
    comprobar(filas) {
      if (filas.length !== 1) return [`devolvió ${filas.length} filas y se esperaba 1 (la mano 7)`]
      const f = filas[0]
      return [
        ...distinto('mano', num(f.mano), 7),
        ...distinto('pausas', num(f.pausas), 1),
        ...distinto('asientos', num(f.asientos), 5),
        ...distinto('omitieron', num(f.omitieron), 2),
        ...distinto('pct_omitieron', num(f.pct_omitieron), 40),
        ...distinto('segundo_mediana', num(f.segundo_mediana), 5),
        ...distinto('segundo_p90', num(f.segundo_p90), 5.8),
        ...distinto('devueltos_tope', num(f.devueltos_tope), 1),
        ...distinto('devueltos_mesa', num(f.devueltos_mesa), 1),
        ...distinto('no_volvieron (inicio sin cierre)', num(f.no_volvieron), 1),
        ...distinto('pct_no_volvieron', num(f.pct_no_volvieron), 20),
      ]
    },
  }),
  Object.freeze({
    archivo: 'med_13_vigilancia.sql',
    siembra: `insert into public.eventos (jugador_id, tipo, datos) values
      ${evento('medicion_invalida', { sala: SALA_13, efecto: 'fabricado' })}`,
    comprobar(filas) {
      const total = filas.find((f) => f.seccion === 'medicion_invalida' && f.nombre === 'filas')
      const detalle = filas.filter((f) => f.seccion === 'medicion_invalida' && f.nombre !== 'filas')
      if (!total) return ['no trae la fila medicion_invalida · filas']
      return [
        ...distinto('medicion_invalida · valor', num(total.valor), 1),
        ...distinto('medicion_invalida · estado', total.estado, 'DEFECTO'),
        ...distinto('filas de detalle', detalle.length, 1),
        ...distinto('el detalle lleva la sala', String(detalle[0]?.detalle ?? '').includes(SALA_13), true),
      ]
    },
  }),
])
