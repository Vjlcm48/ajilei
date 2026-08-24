// ── _vc2audio.mjs · DSK-VC2 · anatomía de los tres audios nuevos ────────────
// No hay ffmpeg en el entorno, así que se mide con lo que sí hay: Web Audio
// decodifica el mp3 y devuelve las muestras. De ahí salen duración real y
// envolvente RMS, y de la envolvente se cuentan los ATAQUES — que es como se
// sabe cuántos nudillos trae table-knock sin abrir un editor.
// Uso:  node scripts/_vc2audio.mjs
import { chromium } from 'playwright-core'
import { readFileSync, writeFileSync } from 'node:fs'

const ARCHIVOS = ['chips-collect.mp3', 'ajilei-strum.mp3', 'table-knock.mp3']
// Referencias de la casa, para situar los nuevos en el sobre existente.
// CEL-A: `win.mp3` sale del repositorio. Se cae de las referencias porque esto
// lo lee con readFileSync y un archivo que ya no esta no es una referencia, es
// un ENOENT.
const REFS = ['coin-bet.mp3', 'card-shuffle.mp3', 'showdown.mp3']

const browser = await chromium.launch({ channel: 'msedge', headless: true })
const page = await browser.newPage()
await page.setContent('<html><body></body></html>')

const analiza = async (nombre) => {
  const b64 = readFileSync(`public/sounds/${nombre}`).toString('base64')
  return page.evaluate(async ({ b64, nombre }) => {
    const bin = atob(b64)
    const buf = new Uint8Array(bin.length)
    for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i)
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    const audio = await ctx.decodeAudioData(buf.buffer)
    const ch = audio.getChannelData(0)
    const sr = audio.sampleRate

    // Envolvente RMS en ventanas de 10 ms.
    const win = Math.round(sr * 0.01)
    const env = []
    for (let i = 0; i + win <= ch.length; i += win) {
      let s = 0
      for (let j = 0; j < win; j++) s += ch[i + j] * ch[i + j]
      env.push(Math.sqrt(s / win))
    }
    const pico = Math.max(...env)

    // Ataques: cruces al alza de un umbral relativo, con refractario de 120 ms
    // para no contar el mismo golpe dos veces por su cola.
    const umbral = pico * 0.22
    const ataques = []
    let armado = true, ultimo = -1e9
    env.forEach((v, i) => {
      const t = i * 0.01
      if (armado && v >= umbral && t - ultimo > 0.12) {
        ataques.push(Math.round(t * 1000) / 1000)
        ultimo = t; armado = false
      }
      if (v < umbral * 0.5) armado = true
    })

    // Cola de silencio al final: dónde cae por debajo del 3% del pico y ya no
    // vuelve. Es la duración ÚTIL, que puede ser muy menor que la del archivo.
    let fin = env.length - 1
    while (fin > 0 && env[fin] < pico * 0.03) fin--
    return {
      nombre,
      duracion: Math.round(audio.duration * 1000) / 1000,
      utilHasta: Math.round((fin + 1) * 0.01 * 1000) / 1000,
      sampleRate: sr, canales: audio.numberOfChannels,
      pico: Math.round(pico * 1000) / 1000,
      ataques,
      nAtaques: ataques.length,
    }
  }, { b64, nombre })
}

const out = []
for (const f of [...ARCHIVOS, ...REFS]) {
  const r = await analiza(f)
  out.push(r)
  console.log(
    `${f.padEnd(20)} dur=${String(r.duracion).padEnd(7)} util=${String(r.utilHasta).padEnd(7)} ` +
    `${r.sampleRate}Hz ${r.canales}ch pico=${r.pico} ataques=${r.nAtaques} ${JSON.stringify(r.ataques.slice(0, 8))}`)
}
await browser.close()
writeFileSync('capturas-dsk/vc2_audio.json', JSON.stringify(out, null, 1))
