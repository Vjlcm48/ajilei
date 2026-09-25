// ── gen-portada-assets.mjs · Derivados de la Portada-Entrada (campaña PUE) ───
// Documento rector: AJILEI_PUE_Fase1_v1.0 §1.3.
//
// Los MAESTROS son de Victor y viven en la RAÍZ sin rastrearse:
//   PUE_mesav_demo.jpg   captura del S25 vertical
//   PUE_mesah_demo.jpg   captura del S25 horizontal
//   PUE_mesapc_demo.png  captura de escritorio
// De ellos salen los derivados que la portada sí publica. El día que Victor
// cambie una captura, `node scripts/gen-portada-assets.mjs` reescribe los ocho
// y nadie tiene que acordarse de cuál faltaba. Fórmula sobre constante.
//
// ── SIN SHARP, Y NO POR GUSTO ───────────────────────────────────────────────
// La ficha da por hecho que Sharp vive en el proyecto «(gen-icons.mjs)».
// MEDIDO: no está. Ni en `dependencies` ni en `devDependencies` ni en
// `node_modules`; `gen-icons.mjs` rasteriza con **playwright-core + Edge**, que
// es lo que sí está pineado. Y el mandato prohíbe dependencias nuevas.
//
// Así que se sigue el precedente de la casa: el navegador ES el convertidor.
// Un canvas recorta, redimensiona y codifica a WebP y a JPEG con control de
// calidad, que es exactamente lo que hacía falta. Ventaja de paso: el codificador
// es el MISMO que después decodifica en el navegador del jugador.
//
// ── El peso manda sobre la calidad, no al revés ─────────────────────────────
// Cada derivado tiene un techo en bytes. El script BUSCA la calidad más alta que
// entra en su techo por bisección, y reporta la que usó. Fijar una calidad a ojo
// y esperar que entre es cómo se pasan los techos sin que nadie se entere.
//
// ── LAS CINCO COPAS LLEVAN EL ÍNDICE DIGITAL (IDX-1 Fase 1b, B-4) ───────────
// Las cartas de la Portada son las del juego: salen de sus maestros PNG
// pasando por IDX-1 en memoria (aplanar, borrar los índices viejos, factor
// SELLADO, número nuevo) con el mismo núcleo que `gen-cards.mjs`, y después
// se reducen y se pesan como siempre. Si una no pasa la comprobación de
// holgura (B-2) o le quedan restos del número viejo, no se escribe ninguna.
// Las tres capturas (`mesav`, `mesapc`, `og-image`) no cambian de método.
//
// Uso:  node scripts/gen-portada-assets.mjs               los ocho
//       node scripts/gen-portada-assets.mjs uno_copa ...  sólo esos ids
//       node scripts/gen-portada-assets.mjs cartas        sólo las cinco copas
import { chromium } from 'playwright-core'
import { readFileSync, writeFileSync, mkdirSync, existsSync, statSync } from 'node:fs'
import { resolve, dirname, extname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { CARTAS as CARTAS_IDX } from './idx/idxCore.mjs'
import { abrirIdx, procesarCarta, motivosDeParada, avisosDeRegla } from './idx/idxNavegador.mjs'

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const SALIDA_SRC = resolve(RAIZ, 'src/assets/portada')
const SALIDA_PUB = resolve(RAIZ, 'public')

// ── Las barras del sistema NO se recortan con constantes, se DETECTAN ───────
// La lámina recorta por CSS con 100 arriba y 130 abajo, que son las del S25 en
// VERTICAL. Se probó a deducirlas por orientación para la captura horizontal y
// MIDIÓ MAL: en horizontal el S25 deja la barra de estado arriba igual, la de
// navegación en el lateral DERECHO, y una banda negra de muesca a la IZQUIERDA
// — tres bordes distintos, no dos girados. El primer og-image salió con la
// marca «AJILEI» cortada a «AILEI».
//
// Así que se busca la caja del JUEGO, que es lo que de verdad se quiere: el
// fieltro es verde —g por encima de r y de b— y las barras del sistema son
// negro neutro con iconos blancos. Se camina hacia dentro desde cada borde
// hasta encontrar la primera línea mayoritariamente verde. Funciona igual en
// las tres capturas y no hay que mantener un número por aparato.
const ORO_MINIMO = 0.30        // fracción de la línea que ha de ser dorada
const BANDA_OG = '#09170e'     // --green-abyss · el marco de la tarjeta social

const CARTAS = ['uno_copa', 'tres_copa', 'cinco_copa', 'diez_copa', 'doce_copa']

// nombre · origen · ancho de salida · techo en bytes · formato · recorte
const TRABAJOS = [
  ...CARTAS.map((c) => ({
    id: c,
    origen: `src/assets/cards/${c}.png`,
    destino: `${SALIDA_SRC}/${c}.webp`,
    ancho: 200,               // ~2× su mayor tamaño en pantalla (94px a escritorio)
    techo: 25 * 1024,
    tipo: 'image/webp',
    recorte: null,
    idx: true,                // pasa por el índice digital (IDX-1)
  })),
  {
    id: 'mesav',
    origen: 'PUE_mesav_demo.jpg',
    destino: `${SALIDA_SRC}/mesav.webp`,
    ancho: 340,
    techo: 80 * 1024,
    tipo: 'image/webp',
    recorte: 'juego',
  },
  {
    id: 'mesapc',
    origen: 'PUE_mesapc_demo.png',
    destino: `${SALIDA_SRC}/mesapc.webp`,
    ancho: 820,
    techo: 120 * 1024,
    tipo: 'image/webp',
    recorte: null,
  },
  {
    // El póster social. Va a `public/` y NO a `src/assets/`: un rastreador
    // cachea la tarjeta por URL, y la URL con hash de Vite cambia en cada build
    // — sería una tarjeta que se rompe sola. Nombre estable, ruta estable.
    id: 'og-image',
    origen: 'PUE_mesah_demo.jpg',
    destino: `${SALIDA_PUB}/og-image.jpg`,
    ancho: 1200,
    alto: 630,                // encuadre fijo de la tarjeta social
    techo: 200 * 1024,
    tipo: 'image/jpeg',
    calidadTope: 0.85,
    recorte: 'juego',
    encaje: 'contener',
  },
]

// Qué se regenera: todo, o sólo los ids pedidos («cartas» = las cinco copas).
const pedidos = process.argv.slice(2).flatMap((a) => (a === 'cartas' ? CARTAS : [a]))
const desconocidos = pedidos.filter((id) => !TRABAJOS.some((t) => t.id === id))
if (desconocidos.length) {
  console.log(`STOP :: ids desconocidos: ${desconocidos.join(', ')} (válidos: ${TRABAJOS.map((t) => t.id).join(', ')}, cartas)`)
  process.exit(1)
}
const trabajos = pedidos.length ? TRABAJOS.filter((t) => pedidos.includes(t.id)) : TRABAJOS

const TIPOS = {
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.webp': 'image/webp', '.svg': 'image/svg+xml',
}

function comoDataURI(ruta) {
  const b = readFileSync(ruta)
  return `data:${TIPOS[extname(ruta).toLowerCase()] ?? 'application/octet-stream'};base64,${b.toString('base64')}`
}

// Edge, el mismo canal que diagDSK/diagPUE y gen-icons: no se instala un
// navegador nuevo para esto.
const navegador = await chromium.launch({ channel: 'msedge', headless: true })
const pagina = await navegador.newPage()

mkdirSync(SALIDA_SRC, { recursive: true })
mkdirSync(SALIDA_PUB, { recursive: true })

const informe = []

// ── Las copas, por IDX-1 ────────────────────────────────────────────────────
// Todas en memoria primero; se escriben sólo si todas pasan la comprobación.
const conIdx = trabajos.filter((t) => t.idx)
if (conIdx.length) {
  const idx = await abrirIdx()
  const resultados = []
  for (const t of conIdx) {
    const carta = CARTAS_IDX.find((c) => c.nombre === t.id)
    if (!carta) throw new Error(`${t.id} no es una carta de IDX-1`)
    resultados.push(await procesarCarta(idx.pagina, carta, { derivados: [{ clave: 'portada', ancho: t.ancho, techo: t.techo, calidadTope: t.calidadTope ?? 0.92 }] }))
  }
  await idx.navegador.close()
  for (const a of avisosDeRegla(resultados)) console.log(`REGLA :: ${a}`)
  const paradas = motivosDeParada(resultados)
  if (paradas.length) {
    console.log(`STOP :: ${paradas.length} carta(s) no pasan la comprobación (B-2); no se escribe ninguna`)
    for (const m of paradas) console.log(`   ${m}`)
    await navegador.close()
    process.exit(1)
  }
  for (const [i, t] of conIdx.entries()) {
    const r = resultados[i]
    const d = r.derivados.portada
    writeFileSync(t.destino, Buffer.from(d.b64, 'base64'))
    const real = statSync(t.destino).size
    const antes = statSync(resolve(RAIZ, t.origen)).size
    const veredicto = real <= t.techo ? 'DENTRO' : 'PASADO'
    const f = typeof r.factor === 'number' ? r.factor.toFixed(2) : r.factor
    console.log(
      `${veredicto === 'DENTRO' ? 'OK   ' : 'TECHO'} :: ${t.id.padEnd(12)} IDX factor ${f} · holgura ${r.holguraDespues.px} px → ` +
      `${String(d.ancho).padStart(4)}×${String(d.alto).padEnd(4)} · q=${d.calidad.toFixed(3)} · ${String(real).padStart(7)} B ` +
      `(techo ${t.techo}) · maestro ${antes} B · −${(100 - real / antes * 100).toFixed(1)} %`
    )
    informe.push({ id: t.id, bytes: real, techo: t.techo, calidad: d.calidad, veredicto })
  }
}

// ── Las capturas, como siempre ──────────────────────────────────────────────
for (const t of trabajos.filter((x) => !x.idx)) {
  const rutaOrigen = resolve(RAIZ, t.origen)
  if (!existsSync(rutaOrigen)) {
    console.log(`FALTA :: ${t.id} — no existe ${t.origen}`)
    informe.push({ id: t.id, error: 'maestro ausente' })
    continue
  }

  const salida = await pagina.evaluate(async ({ uri, trabajo, verdeMin, banda }) => {
    const img = new Image()
    img.src = uri
    await img.decode()
    const W = img.naturalWidth, H = img.naturalHeight

    let sx = 0, sy = 0, sw = W, sh = H
    if (trabajo.recorte === 'juego') {
      // Se lee el maestro entero UNA vez y se busca la caja verde.
      const aux = document.createElement('canvas')
      aux.width = W; aux.height = H
      const actx = aux.getContext('2d', { willReadFrequently: true })
      actx.drawImage(img, 0, 0)
      const px = actx.getImageData(0, 0, W, H).data
      // Se busca el ORO, no el verde. El primer intento buscó fieltro verde y
      // MIDIÓ MAL: la barra de estado del teléfono está pintada con el
      // `theme-color` del manifest —#0a1e10, que es verde— así que la barra
      // pasaba el examen y no se recortaba nada por arriba. El oro, en cambio,
      // sólo lo pone el juego: es el filete de la mesa, y su caja envolvente ES
      // la caja del juego. Ninguna barra del sistema tiene un píxel dorado.
      const esOro = (i) => {
        const r = px[i], g = px[i + 1], b = px[i + 2]
        return r > 80 && r - b > 35 && g - b > 20 && g < r + 15
      }
      const oroFila = (y) => {
        let n = 0
        for (let x = 0; x < W; x += 2) if (esOro((y * W + x) * 4)) n++
        return n >= (W / 2) * verdeMin
      }
      const oroCol = (x) => {
        let n = 0
        for (let y = 0; y < H; y += 2) if (esOro((y * W + x) * 4)) n++
        return n >= (H / 2) * verdeMin
      }
      let y0 = 0, y1 = H - 1, x0 = 0, x1 = W - 1
      while (y0 < y1 && !oroFila(y0)) y0++
      while (y1 > y0 && !oroFila(y1)) y1--
      while (x0 < x1 && !oroCol(x0)) x0++
      while (x1 > x0 && !oroCol(x1)) x1--
      sx = x0; sy = y0; sw = x1 - x0 + 1; sh = y1 - y0 + 1
    }

    // Destino: o el encuadre fijo (la tarjeta social) o el alto que salga de
    // conservar la proporción del recorte.
    const dw = trabajo.ancho
    const dh = trabajo.alto ?? Math.round((sh / sw) * dw)

    const lienzo = document.createElement('canvas')
    lienzo.width = dw
    lienzo.height = dh
    const ctx = lienzo.getContext('2d')
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'

    if (trabajo.encaje === 'contener') {
      // CONTENER, no cubrir, y se decidió midiendo. Recortada la caja del
      // juego, la captura horizontal queda en proporción 2,23 contra el 1,905
      // de la tarjeta social: `cover` se comería un 15 % por cada lado y ahí
      // vive la marca «AJILEI» de la cabecera. Conteniendo, la mesa entra
      // ENTERA con dos bandas de 45px del verde abismo de la casa — que se
      // leen como el marco de la pieza, no como un error de encuadre.
      ctx.fillStyle = banda
      ctx.fillRect(0, 0, dw, dh)
      const escala = Math.min(dw / sw, dh / sh)
      const iw = Math.round(sw * escala), ih = Math.round(sh * escala)
      ctx.drawImage(img, sx, sy, sw, sh, Math.round((dw - iw) / 2), Math.round((dh - ih) / 2), iw, ih)
    } else if (trabajo.alto) {
      const escala = Math.max(dw / sw, dh / sh)
      const cw = dw / escala, ch = dh / escala
      ctx.drawImage(img, sx + (sw - cw) / 2, sy + (sh - ch) / 2, cw, ch, 0, 0, dw, dh)
    } else {
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, dw, dh)
    }

    // Bisección sobre la calidad: la más alta que entra en el techo. Doce
    // pasadas dan una resolución de 0,0002 en calidad, de sobra.
    const pesar = (q) => {
      const d = lienzo.toDataURL(trabajo.tipo, q)
      return { d, bytes: Math.floor((d.length - d.indexOf(',') - 1) * 3 / 4) }
    }
    const qMax = trabajo.calidadTope ?? 0.92
    let mejor = pesar(qMax)
    let qUsada = qMax
    if (mejor.bytes > trabajo.techo) {
      let lo = 0.30, hi = qMax
      for (let i = 0; i < 12; i++) {
        const q = (lo + hi) / 2
        const r = pesar(q)
        if (r.bytes <= trabajo.techo) { mejor = r; qUsada = q; lo = q } else { hi = q }
      }
    }
    return {
      dataURL: mejor.d, bytes: mejor.bytes, calidad: qUsada,
      origenW: W, origenH: H, salidaW: dw, salidaH: dh,
      cajaX: sx, cajaY: sy, recorteW: sw, recorteH: sh,
    }
  }, { uri: comoDataURI(rutaOrigen), trabajo: t, verdeMin: ORO_MINIMO, banda: BANDA_OG })

  const coma = salida.dataURL.indexOf(',') + 1
  writeFileSync(t.destino, Buffer.from(salida.dataURL.slice(coma), 'base64'))
  const real = statSync(t.destino).size
  const antes = statSync(rutaOrigen).size
  const veredicto = real <= t.techo ? 'DENTRO' : 'PASADO'
  console.log(
    `${veredicto === 'DENTRO' ? 'OK   ' : 'TECHO'} :: ${t.id.padEnd(12)} ` +
    `${String(salida.origenW).padStart(5)}×${String(salida.origenH).padEnd(5)} ` +
    `[caja ${salida.cajaX},${salida.cajaY} ${salida.recorteW}×${salida.recorteH}] → ` +
    `${String(salida.salidaW).padStart(4)}×${String(salida.salidaH).padEnd(4)} · ` +
    `q=${salida.calidad.toFixed(3)} · ${String(real).padStart(7)} B ` +
    `(techo ${t.techo}) · maestro ${antes} B · −${(100 - real / antes * 100).toFixed(1)} %`
  )
  informe.push({ id: t.id, bytes: real, techo: t.techo, calidad: salida.calidad, veredicto })
}

await navegador.close()

const total = informe.reduce((a, x) => a + (x.bytes ?? 0), 0)
const pasados = informe.filter((x) => x.veredicto === 'PASADO' || x.error)
console.log(`\nTOTAL :: ${informe.length} derivados · ${total} B (${(total / 1024).toFixed(1)} KiB)`)
console.log(pasados.length ? `AVISO :: ${pasados.length} fuera de techo o sin maestro` : `TECHOS :: ${informe.length === TRABAJOS.length ? 'los ocho' : `los ${informe.length} regenerados`} DENTRO`)
process.exit(pasados.length ? 1 : 0)
