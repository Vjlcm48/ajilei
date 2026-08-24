// ── audioCEL.mjs · Taller de audio de la campaña CEL ────────────────────────
// Uso:  node scripts/audioCEL.mjs medir
//       node scripts/audioCEL.mjs cortar
//
// `ffmpeg` no existe en este entorno y nunca ha existido —por eso VC2 recortó el
// rasgueo EN REPRODUCCIÓN, con un fade de Howler, en vez de tocar el archivo
// (docs/AJILEI_Victory_Celebration_v1.0.md §7.1)—. Aquí sí hace falta de verdad:
// siete pistas de minutos hay que cortarlas a 12 s, y eso no se hace con un
// setTimeout. Entra `ffmpeg-static` como devDependency: binario, sin servicio
// externo, sin subir el material de Victor a ninguna parte.
//
// LA RECETA, sellada por Victor en tiempos ABSOLUTOS (CEL-A v3 §Fase 2):
//   · segmento t = 0,000 → t = 12,000 s exactos
//   · fade-out de t = 9,5 s a 12,0 (2,5 s de bajada)
//   · fade-in de 10 ms (anticlick)
//   · sonoridad normalizada al MISMO objetivo para las siete
//   · export .mp3 y .ogg con los parámetros de los assets que ya viven en el repo
//
// ORDEN DE LAS OPERACIONES, que no es indiferente:
//   recortar → medir → normalizar → desvanecer.
// Normalizar DESPUÉS de recortar porque el objetivo es la sonoridad de los 12 s
// que van a sonar, no la del minuto entero del que salen. Y desvanecer DESPUÉS
// de normalizar porque si se hace al revés los 2,5 s de bajada entran en la
// medida y tiran el cuerpo de la pista por encima del objetivo.
import { spawnSync } from 'node:child_process'
import { mkdirSync, existsSync, statSync, writeFileSync } from 'node:fs'
import ffmpeg from 'ffmpeg-static'

const PISTAS = ['joropo1', 'gaita2', 'latinjazz3', 'percusion4', 'celebracion5', 'celebracion6', 'celebracion7']
// La familia con la que estas melodías van a convivir en la pantalla de victoria.
// `volumen` es la ganancia con la que useSounds.js las reproduce: lo que el
// jugador oye no es el LUFS del archivo, es el LUFS del archivo MÁS esa ganancia.
const FAMILIA = [
  { archivo: 'table-knock.mp3', volumen: 0.6 },
  { archivo: 'ajilei-strum.mp3', volumen: 0.8 },
]

const SRC   = 'public/sounds'
const TALLER = '_audio_cel'
const OUT   = `${TALLER}/propuestas`

const FIN_S     = 12.0    // el instante en que el reproductor pasa de 0:11 a 0:12
const FADE_IN_S = 0.010
const FADE_OUT_DESDE_S = 9.5
const FADE_OUT_DUR_S   = FIN_S - FADE_OUT_DESDE_S   // 2,5

// ffmpeg escribe TODO su informe —ficha del archivo, resumen de loudnorm, el
// JSON de la medida— por STDERR, y sale con 0 o con 1 según el modo. Así que
// hace falta `spawnSync` y no `execFileSync`: éste último devuelve sólo stdout
// cuando el proceso termina bien, y ahí no hay nada. La primera corrida de la
// medida dio siete LUFS en `null` por exactamente eso.
const ff = (args) => {
  const r = spawnSync(ffmpeg, args, { encoding: 'utf8', maxBuffer: 1 << 26 })
  return `${r.stdout ?? ''}${r.stderr ?? ''}`
}
// Con `-i` a secas ffmpeg imprime la ficha del archivo y sale con 1 ("At least
// one output file must be specified"). Es el uso normal, no un fallo.
const ficha = (ruta) => ff(['-hide_banner', '-i', ruta])

function anatomia(ruta) {
  const t = ficha(ruta)
  const dur = /Duration:\s*(\d+):(\d+):(\d+\.\d+)/.exec(t)
  const aud = /Audio:\s*([a-z0-9]+).*?,\s*(\d+)\s*Hz,\s*([a-z0-9()]+).*?(?:,\s*(\d+)\s*kb\/s)?/i.exec(t)
  return {
    duracion: dur ? (+dur[1]) * 3600 + (+dur[2]) * 60 + parseFloat(dur[3]) : null,
    codec: aud?.[1] ?? null,
    hz: aud ? +aud[2] : null,
    canales: aud?.[3] ?? null,
    kbps: aud?.[4] ? +aud[4] : (/bitrate:\s*(\d+)\s*kb\/s/.exec(t)?.[1] ? +/bitrate:\s*(\d+)\s*kb\/s/.exec(t)[1] : null),
  }
}

// Sonoridad integrada EBU R128. `-t` opcional para medir sólo el segmento útil.
function lufs(ruta, segundos = null) {
  const args = ['-hide_banner', '-nostats']
  if (segundos) args.push('-t', String(segundos))
  args.push('-i', ruta, '-af', 'loudnorm=print_format=json', '-f', 'null', '-')
  const txt = ff(args)
  const j = txt.lastIndexOf('{')
  if (j < 0) return null
  try { return JSON.parse(txt.slice(j, txt.indexOf('}', j) + 1)) } catch { return null }
}

const dB = (v) => 20 * Math.log10(v)
const r1 = (n) => (n == null ? null : Math.round(n * 10) / 10)
const r2 = (n) => (n == null ? null : Math.round(n * 100) / 100)
const kb = (ruta) => Math.round(statSync(ruta).size / 1024)

// ── medir ───────────────────────────────────────────────────────────────────
function medir() {
  console.log('── FAMILIA · con la que las melodías van a convivir ──')
  const fam = []
  for (const f of FAMILIA) {
    const ruta = `${SRC}/${f.archivo}`
    const a = anatomia(ruta), l = lufs(ruta)
    const I = l ? parseFloat(l.input_i) : null
    const efectivo = I == null ? null : I + dB(f.volumen)
    fam.push({ ...f, ...a, I, efectivo })
    console.log(`  ${f.archivo.padEnd(20)} ${r2(a.duracion)}s · ${a.codec} ${a.hz}Hz ${a.canales} ${a.kbps}kb/s · LUFS ${r1(I)} · volumen ${f.volumen} (${r1(dB(f.volumen))} dB) → EFECTIVO ${r1(efectivo)} LUFS`)
  }

  console.log('\n── RESTO DE ASSETS · para copiar sus parámetros de export ──')
  for (const n of ['card-deal.mp3', 'chips-collect.mp3', 'showdown.mp3', 'comodin.mp3', 'card-shuffle.mp3']) {
    const a = anatomia(`${SRC}/${n}`)
    console.log(`  ${n.padEnd(20)} ${a.codec} ${a.hz}Hz ${a.canales} ${a.kbps}kb/s · ${kb(`${SRC}/${n}`)} KB`)
  }

  console.log('\n── LAS SIETE ──')
  const filas = []
  for (const p of PISTAS) {
    const ruta = `${SRC}/${p}.mp3`
    const a = anatomia(ruta)
    const lTotal = lufs(ruta)
    const lSeg = lufs(ruta, FIN_S)
    const fila = {
      pista: p, ...a, kbEntrada: kb(ruta),
      lufsTotal: lTotal ? parseFloat(lTotal.input_i) : null,
      lufsSegmento: lSeg ? parseFloat(lSeg.input_i) : null,
      tpSegmento: lSeg ? parseFloat(lSeg.input_tp) : null,
      corto: a.duracion != null && a.duracion < 12,
    }
    filas.push(fila)
    console.log(`  ${p.padEnd(14)} ${r2(a.duracion)}s ${fila.corto ? '← MENOS DE 12 s' : ''} · ${a.codec} ${a.hz}Hz ${a.canales} ${a.kbps}kb/s · ${fila.kbEntrada} KB · LUFS total ${r1(fila.lufsTotal)} · LUFS de los 12 s ${r1(fila.lufsSegmento)} · pico real ${r1(fila.tpSegmento)} dBTP`)
  }
  const cortas = filas.filter(f => f.corto)
  console.log(`\npistas por debajo de 12 s: ${cortas.length ? cortas.map(f => `${f.pista} (${r2(f.duracion)}s)`).join(', ') : 'ninguna'}`)
  if (!existsSync(TALLER)) mkdirSync(TALLER, { recursive: true })
  writeFileSync(`${TALLER}/medida.json`, JSON.stringify({ familia: fam, pistas: filas }, null, 2))
  return { fam, filas }
}

// ── cortar ──────────────────────────────────────────────────────────────────
// Dos pasadas de loudnorm, que es como se normaliza de verdad: la primera mide
// el segmento, la segunda aplica la corrección con esas cifras (`linear=true`,
// una ganancia constante) en vez de comprimir dinámicamente. Sin la primera
// pasada, loudnorm trabaja en modo dinámico y toca el balance de la pista.
function cortar(objetivoLUFS, techoTP) {
  if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true })
  const filas = []
  for (const p of PISTAS) {
    const ent = `${SRC}/${p}.mp3`
    // La medida se toma sobre el CUERPO (0 → 9,5 s), no sobre los 12 s.
    // Midiendo los 12 s, la ganancia sale calculada contra una ventana que
    // incluye 2,5 s de bajada, y como cada pista tiene más o menos energía en
    // ese tramo el cuerpo —lo único que el jugador oye a nivel pleno— acababa
    // repartido en 0,9 dB entre las siete (−19,81 a −20,72, medido). Midiendo
    // el cuerpo, el cuerpo queda igualado y la bajada decae desde ahí, que es
    // lo que "mismo LUFS para las siete" quiere decir de verdad.
    const medida = lufs(ent, FADE_OUT_DESDE_S)
    if (!medida) { console.log(`  ${p}: NO SE PUDO MEDIR`); continue }
    const ln = [
      `loudnorm=I=${objetivoLUFS}:TP=${techoTP}:LRA=11`,
      `measured_I=${medida.input_i}`,
      `measured_TP=${medida.input_tp}`,
      `measured_LRA=${medida.input_lra}`,
      `measured_thresh=${medida.input_thresh}`,
      `offset=${medida.target_offset}`,
      'linear=true', 'print_format=summary',
    ].join(':')
    // loudnorm resamplea a 192 kHz por dentro; se vuelve a 44,1 kHz, que es el
    // ritmo de todos los assets del repo.
    const cadena = [
      ln,
      'aresample=44100',
      `afade=t=in:st=0:d=${FADE_IN_S}`,
      `afade=t=out:st=${FADE_OUT_DESDE_S}:d=${FADE_OUT_DUR_S}`,
    ].join(',')

    const mp3 = `${OUT}/${p}.mp3`
    const ogg = `${OUT}/${p}.ogg`
    // Parámetros de los assets que ya viven en el repo: 44,1 kHz estéreo a
    // 256 kb/s es lo de `ajilei-strum.mp3` y `comodin.mp3`, y el strum es el
    // análogo más cercano —el único asset MUSICAL y el más largo—. Para `.ogg`
    // no hay precedente en el repo (los doce son mp3): `-q:a 5` (~160 kb/s
    // VBR) es el escalón de Vorbis que la práctica sitúa a la par de un mp3 de
    // 256, no una elección de gusto.
    ff(['-hide_banner', '-nostats', '-y', '-t', String(FIN_S), '-i', ent, '-af', cadena, '-c:a', 'libmp3lame', '-b:a', '256k', '-ar', '44100', '-ac', '2', mp3])
    ff(['-hide_banner', '-nostats', '-y', '-t', String(FIN_S), '-i', ent, '-af', cadena, '-c:a', 'libvorbis', '-q:a', '5', '-ar', '44100', '-ac', '2', ogg])

    const am = anatomia(mp3), ao = anatomia(ogg)
    const lm = lufs(mp3)
    filas.push({
      pista: p,
      durMp3: am.duracion, durOgg: ao.duracion,
      kbMp3: kb(mp3), kbOgg: kb(ogg),
      lufsFinal: lm ? parseFloat(lm.input_i) : null,
      tpFinal: lm ? parseFloat(lm.input_tp) : null,
    })
    console.log(`  ${p.padEnd(14)} mp3 ${r2(am.duracion)}s ${kb(mp3)} KB · ogg ${r2(ao.duracion)}s ${kb(ogg)} KB · LUFS final ${r1(filas.at(-1).lufsFinal)} · pico ${r1(filas.at(-1).tpFinal)} dBTP`)
  }
  writeFileSync(`${TALLER}/cortes.json`, JSON.stringify({ objetivoLUFS, techoTP, filas }, null, 2))
  return filas
}

const modo = process.argv[2] ?? 'medir'
if (modo === 'medir') medir()
else if (modo === 'cortar') cortar(parseFloat(process.argv[3]), parseFloat(process.argv[4] ?? '-1.5'))
else console.log('modos: medir | cortar <LUFS> [TP]')
