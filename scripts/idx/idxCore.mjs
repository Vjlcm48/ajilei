// ── idxCore.mjs · Lógica pura del índice digital (campaña IDX-1) ─────────────
// Rector: AJILEI_IDX-1_Fase1a_v1.0 §3. Entrada: informe de la Fase 0 (tabla
// §B.6) y lámina sellada `laminas/idx1/AJILEI_IDX1_lamina_v1.2.html`.
//
// Todo lo que NO depende del navegador vive aquí: tablas, colores, alturas,
// cajas de borrado, factores de encogido y las operaciones de píxel sobre
// arrays planos (máscaras, transformada de distancia, componentes). Se importa
// tal cual desde Vitest y desde la página de Edge que monta `gen-idx.mjs`, así
// que la regla que se prueba es la misma que se ejecuta.
//
// Coordenadas: px del maestro de 1055×1491, origen arriba a la izquierda,
// cajas INCLUSIVAS [x0, y0, x1, y1].

export const ANCHO = 1055
export const ALTO = 1491

export const CREMA = [0xf5, 0xed, 0xd8]          // #F5EDD8 · --text-primary
export const ESTRELLA = [0x87, 0x9b, 0x83]       // #879B83 · la fila de estrellas

// Interior del marco (Fase 0 §B.5): primer y último píxel crema dentro.
export const INTERIOR = [54, 71, 1000, 1419]

// §3.2 · desviación ≤ 12 dentro del interior → crema exacta.
export const UMBRAL_APLANAR = 12
// §3.4 · desviación > 18 → dibujo.
export const UMBRAL_DIBUJO = 18
// §3.4 · ventana de MEDIDA: dentro del marco y por encima de las estrellas.
export const VENTANA_MEDIDA = [60, 78, 995, 1300]
// A-3 · al medir, se descartan las componentes del dibujo de menos de 10 px:
// un píxel suelto de antialias no puede obligar a encoger una carta.
export const COMPONENTE_MINIMA = 10
// Ventana de ENCOGIDO (regla, Ajuste A-8): la de medida prolongada hasta el
// filo interior del marco, sin las estrellas. En 12 cartas el dibujo baja de
// y = 1300 (hasta 1356 en el as de bastos); encogiendo con la ventana cortada
// en 1300, el trozo de abajo se quedaría quieto y la figura se partiría. Las
// estrellas se excluyen por color (ver `mascaraEstrellas`) porque no se mueven.
export const VENTANA_ENCOGIDO = [60, 78, 995, 1416]
// Caja de la fila de estrellas (Fase 0 §B.7: x 364–690 × y 1319–1385, idéntica
// en las 40), ampliada 8 px para cubrir su antialias.
export const CAJA_ESTRELLAS = [356, 1311, 698, 1393]

// D-11 · el dibujo a ≥ 18 px del número. Desde la Fase 1b (B-2) ya no decide
// el factor: sólo dice qué factor «habría dado la regla», como dato.
export const HOLGURA_MINIMA = 18
// B-2 · con el factor sellado, por debajo de 17,0 px el generador se detiene
// (1 px de tolerancia sobre la regla para el antialias de otra versión de Edge).
export const HOLGURA_TOLERADA = 17
// D-12 · de 1 en 1 %, con suelo en 85 %.
export const FACTOR_SUELO = 0.85
// §3.5.1 y §3.6.1 · dilatación que arrastra el antialias del dibujo.
export const DILATACION_DIBUJO = 2

// D-7 · la tinta del número empieza en y = 93 y acaba a la derecha en x = 976.
export const TINTA_ARRIBA = 93
export const TINTA_DERECHA = 976
// Ajuste A-1: se ancla la TINTA, no la caja de avance del texto. Así todos los
// números acaban en el mismo borde —el 1 y el 11 incluidos— y el margen al
// marco interior (x 54–1000, y 71–1419) es de 22 px arriba y 24 a la derecha.
// D-8 · contorno crema de 9 px a cada lado → lineWidth 18.
export const CONTORNO_PX = 9
// D-6 · Roboto Condensed seminegrita.
export const FUENTE_PESO = 600

// §3.6 · 4 de oros.
export const MONEDAS = { areaMinima: 50000, factor: 0.84, centroX: 527, separacionMedia: 8 }

// §3.3 (Ajuste A-2) · verificación del borrado, sobre la carta FINAL.
export const ANILLO_VERIFICACION = 8
export const TOLERANCIA_RESTO = 12
// B-3 · un resto ha de apartarse ≥ 6 niveles de la crema en algún canal: un
// píxel pálido de remuestreo no es un número a medio borrar.
export const INTENSIDAD_RESTO = 6

// ── Rangos ──────────────────────────────────────────────────────────────────
// D-6: del 1 al 7 la cifra mide el 16 % del alto; 10, 11 y 12, el 12 %.
export const RANGOS = {
  uno:    { texto: '1',  figura: false },
  dos:    { texto: '2',  figura: false },
  tres:   { texto: '3',  figura: false },
  cuatro: { texto: '4',  figura: false },
  cinco:  { texto: '5',  figura: false },
  seis:   { texto: '6',  figura: false },
  siete:  { texto: '7',  figura: false },
  diez:   { texto: '10', figura: true },
  once:   { texto: '11', figura: true },
  doce:   { texto: '12', figura: true },
}
export const ORDEN_RANGOS = Object.keys(RANGOS)

export const PORCENTAJE_CIFRA = { pinta: 0.16, figura: 0.12 }

export function alturaCifra(rango) {
  const r = RANGOS[rango]
  if (!r) throw new Error(`rango desconocido: ${rango}`)
  return ALTO * (r.figura ? PORCENTAJE_CIFRA.figura : PORCENTAJE_CIFRA.pinta)
}

export function textoRango(rango) {
  const r = RANGOS[rango]
  if (!r) throw new Error(`rango desconocido: ${rango}`)
  return r.texto
}

// ── Palos ───────────────────────────────────────────────────────────────────
// D-9 · todas las cartas del palo, figuras incluidas.
export const COLORES = {
  oro:    '#CF142B',
  copa:   '#235C38',
  espada: '#003893',
  basto:  '#7A5200',
}
export const ORDEN_PALOS = ['oro', 'copa', 'espada', 'basto']

export function colorPalo(palo) {
  const c = COLORES[palo]
  if (!c) throw new Error(`palo desconocido: ${palo}`)
  return c
}

export const CARTAS = ORDEN_PALOS.flatMap((palo) => ORDEN_RANGOS.map((rango) => ({ rango, palo, nombre: `${rango}_${palo}` })))

// ── Cajas de los índices viejos ─────────────────────────────────────────────
// Informe de la Fase 0, tabla §B.6: la caja es la misma en los cuatro palos
// (es texto tipográfico) y la de abajo es la de arriba girada 180°.
export const CAJAS_INDICE = {
  uno:    { sup: [876, 138, 915, 242], inf: [139, 1248, 178, 1352] },
  dos:    { sup: [870, 137, 939, 242], inf: [115, 1248, 184, 1353] },
  tres:   { sup: [870, 137, 935, 243], inf: [119, 1247, 184, 1353] },
  cuatro: { sup: [867, 139, 942, 242], inf: [112, 1248, 187, 1351] },
  cinco:  { sup: [875, 139, 939, 243], inf: [115, 1247, 179, 1351] },
  seis:   { sup: [873, 139, 938, 243], inf: [116, 1247, 181, 1351] },
  siete:  { sup: [869, 139, 938, 242], inf: [116, 1248, 185, 1351] },
  diez:   { sup: [791, 137, 935, 243], inf: [119, 1247, 263, 1353] },
  once:   { sup: [791, 138, 913, 242], inf: [141, 1248, 263, 1352] },
  doce:   { sup: [791, 137, 937, 242], inf: [117, 1248, 263, 1353] },
}

// §3.3 · 3 px por lado; en el índice inferior del 4 de oros, 2 px (la moneda
// queda a 2,8 px de la caja, Fase 0 §B.7).
export function margenBorrado(rango, palo, cual) {
  if (rango === 'cuatro' && palo === 'oro' && cual === 'inf') return 2
  return 3
}

export function ampliarCaja([x0, y0, x1, y1], m) {
  return [x0 - m, y0 - m, x1 + m, y1 + m]
}

export function cajasBorrado(rango, palo) {
  const c = CAJAS_INDICE[rango]
  if (!c) throw new Error(`rango desconocido: ${rango}`)
  return {
    sup: ampliarCaja(c.sup, margenBorrado(rango, palo, 'sup')),
    inf: ampliarCaja(c.inf, margenBorrado(rango, palo, 'inf')),
  }
}

// Ajuste A-2 · un píxel es RESTO del número viejo si su color está en la
// mezcla crema #F5EDD8 → #CF142B (el rojo de los índices viejos, Fase 0 §B.1):
// a ≤ 12 por canal de esa recta y apartado ≥ 6 niveles de la crema (B-3).
// Sustituye al criterio genérico «rojizo» (R > G + 40 y R > B + 40), que
// atrapaba el oro de las monedas del 4 de oros.
export const ROJO_VIEJO = [0xcf, 0x14, 0x2b]
export function esRestoNumero(r, g, b, tol = TOLERANCIA_RESTO) {
  if (desviacion(r, g, b) < INTENSIDAD_RESTO) return false
  const v = [ROJO_VIEJO[0] - CREMA[0], ROJO_VIEJO[1] - CREMA[1], ROJO_VIEJO[2] - CREMA[2]]
  const p = [r - CREMA[0], g - CREMA[1], b - CREMA[2]]
  const t = Math.min(1, Math.max(0, (p[0] * v[0] + p[1] * v[1] + p[2] * v[2]) / (v[0] * v[0] + v[1] * v[1] + v[2] * v[2])))
  return Math.abs(p[0] - t * v[0]) <= tol && Math.abs(p[1] - t * v[1]) <= tol && Math.abs(p[2] - t * v[2]) <= tol
}

// ── Factores de encogido ────────────────────────────────────────────────────
// 0,99; 0,98; … ; 0,85. Enteros en centésimas para que no se cuele un
// 0,8500000001 y el suelo se salte por redondeo.
export function factoresEncogido() {
  const out = []
  for (let c = 99; c >= Math.round(FACTOR_SUELO * 100); c--) out.push(c / 100)
  return out
}

// ── Factores sellados (Fase 1b, B-1) ────────────────────────────────────────
// Lo que Victor aprobó en la hoja de contacto del ajuste (2026-09-25). El
// generador APLICA esta tabla y no recalcula: el 7 de copas (18,2 px) y el 5
// de copas (18,0 px) están en el filo de la regla, y un cambio de antialias en
// Edge no puede cambiar una carta aprobada. 1 = el dibujo sin tocar;
// MONEDAS_SELLADO = las cuatro monedas del 4 de oros al 84 % (§3.6).
export const MONEDAS_SELLADO = `monedas-${MONEDAS.factor}`
export const FACTORES_SELLADOS = Object.freeze({
  uno_oro: 1,   dos_oro: 1,   tres_oro: 1,   cuatro_oro: MONEDAS_SELLADO, cinco_oro: 0.90,
  seis_oro: 1,  siete_oro: 1, diez_oro: 1,   once_oro: 1,   doce_oro: 1,
  uno_copa: 1,  dos_copa: 1,  tres_copa: 1,  cuatro_copa: 0.90, cinco_copa: 0.93,
  seis_copa: 1, siete_copa: 1, diez_copa: 1, once_copa: 1,  doce_copa: 1,
  uno_espada: 1, dos_espada: 1, tres_espada: 1, cuatro_espada: 0.90, cinco_espada: 1,
  seis_espada: 1, siete_espada: 1, diez_espada: 1, once_espada: 1, doce_espada: 1,
  uno_basto: 1, dos_basto: 1, tres_basto: 1, cuatro_basto: 0.91, cinco_basto: 0.91,
  seis_basto: 0.96, siete_basto: 0.96, diez_basto: 1, once_basto: 1, doce_basto: 1,
})

export function factorSellado(nombre) {
  const f = FACTORES_SELLADOS[nombre]
  if (f === undefined) throw new Error(`carta sin factor sellado: ${nombre}`)
  return f
}

// El factor como número (el 4 de oros cuenta con el de sus monedas).
export const factorNumerico = (f) => (f === MONEDAS_SELLADO ? MONEDAS.factor : f)

// B-2 · la comprobación: no corrige, se detiene.
export function comprobarHolgura(nombre, px) {
  if (!(px >= HOLGURA_TOLERADA)) {
    throw new Error(`${nombre}: holgura ${Number.isFinite(px) ? px.toFixed(1) : px} px < ${HOLGURA_TOLERADA} con el factor sellado ${factorSellado(nombre)} (B-2)`)
  }
  return true
}

// ── Estado de una carta ─────────────────────────────────────────────────────
// Prioridad: un borrado incompleto se ve antes que todo lo demás, porque
// significa que quedó rastro del índice viejo; después, lo que no cumplió. Con
// los factores sellados, «no cumplir» es bajar de la holgura tolerada (B-2).
export function estadoCarta({ borradoOk, holguraFinal, factor }) {
  if (!borradoOk) return 'borrado-incompleto'
  if (holguraFinal < HOLGURA_TOLERADA) return 'necesita-decision'
  if (factor !== null && factor !== 1) return 'encogida'
  return 'ok'
}

// ── 4 de oros ───────────────────────────────────────────────────────────────
// §3.6.3 · x central en 527 − (8 + r) a la izquierda y 527 + (8 + r) a la
// derecha, con r el radio de la moneda ya escalada; y central conservada.
export function destinoMoneda({ cx, cy, radio }, factor = MONEDAS.factor) {
  const r = radio * factor
  const izquierda = cx < MONEDAS.centroX
  const x = izquierda ? MONEDAS.centroX - (MONEDAS.separacionMedia + r) : MONEDAS.centroX + (MONEDAS.separacionMedia + r)
  return { cx: x, cy, radio: r }
}

// ── Operaciones de píxel (RGBA plano, Uint8ClampedArray o similar) ──────────
export const desviacion = (r, g, b) => Math.max(Math.abs(r - CREMA[0]), Math.abs(g - CREMA[1]), Math.abs(b - CREMA[2]))

// §3.2 · devuelve cuántos píxeles cambió.
export function aplanarCrema(data, W, [x0, y0, x1, y1] = INTERIOR, umbral = UMBRAL_APLANAR) {
  let n = 0
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      const i = (y * W + x) * 4
      const r = data[i], g = data[i + 1], b = data[i + 2]
      if (desviacion(r, g, b) <= umbral && (r !== CREMA[0] || g !== CREMA[1] || b !== CREMA[2])) {
        data[i] = CREMA[0]; data[i + 1] = CREMA[1]; data[i + 2] = CREMA[2]; data[i + 3] = 255
        n++
      }
    }
  }
  return n
}

export function rellenarCaja(data, W, H, [x0, y0, x1, y1], rgb = CREMA) {
  for (let y = Math.max(0, y0); y <= Math.min(H - 1, y1); y++) {
    for (let x = Math.max(0, x0); x <= Math.min(W - 1, x1); x++) {
      const i = (y * W + x) * 4
      data[i] = rgb[0]; data[i + 1] = rgb[1]; data[i + 2] = rgb[2]; data[i + 3] = 255
    }
  }
}

// Los restos del número viejo en el anillo de `ancho` px alrededor de `caja`.
export function restosEnAnillo(data, W, H, caja, ancho = ANILLO_VERIFICACION) {
  const [x0, y0, x1, y1] = caja
  const out = []
  for (let y = Math.max(0, y0 - ancho); y <= Math.min(H - 1, y1 + ancho); y++) {
    for (let x = Math.max(0, x0 - ancho); x <= Math.min(W - 1, x1 + ancho); x++) {
      if (x >= x0 && x <= x1 && y >= y0 && y <= y1) continue
      const i = (y * W + x) * 4
      if (esRestoNumero(data[i], data[i + 1], data[i + 2])) out.push({ x, y, rgb: [data[i], data[i + 1], data[i + 2]] })
    }
  }
  return out
}

// Máscara (Uint8Array W×H, 1 = dibujo) de los píxeles con desviación > umbral
// dentro de la ventana.
export function mascaraDibujo(data, W, H, [x0, y0, x1, y1], umbral = UMBRAL_DIBUJO) {
  const m = new Uint8Array(W * H)
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      const i = (y * W + x) * 4
      if (desviacion(data[i], data[i + 1], data[i + 2]) > umbral) m[y * W + x] = 1
    }
  }
  return m
}

// Las estrellas, por color, dentro de su caja. Se usan para SACARLAS de la
// máscara de encogido: la fila de estrellas no se mueve (D-10).
export function mascaraEstrellas(data, W, H, [x0, y0, x1, y1] = CAJA_ESTRELLAS, tolerancia = 60) {
  const m = new Uint8Array(W * H)
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      const i = (y * W + x) * 4
      const dr = data[i] - ESTRELLA[0], dg = data[i + 1] - ESTRELLA[1], db = data[i + 2] - ESTRELLA[2]
      if (Math.sqrt(dr * dr + dg * dg + db * db) < tolerancia) m[y * W + x] = 1
    }
  }
  return m
}

// ── Transformada de distancia euclídea exacta (Felzenszwalb–Huttenlocher) ────
// Devuelve la distancia AL CUADRADO de cada píxel al píxel de `m` más cercano
// (0 en los propios píxeles de `m`). Distancia entre centros de píxel.
const INF = 1e20
function dt1d(f, n, d, v, z) {
  let k = 0
  v[0] = 0; z[0] = -INF; z[1] = INF
  for (let q = 1; q < n; q++) {
    let s = ((f[q] + q * q) - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k])
    while (s <= z[k]) { k--; s = ((f[q] + q * q) - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k]) }
    k++; v[k] = q; z[k] = s; z[k + 1] = INF
  }
  k = 0
  for (let q = 0; q < n; q++) {
    while (z[k + 1] < q) k++
    const dq = q - v[k]
    d[q] = dq * dq + f[v[k]]
  }
}

export function distancia2(m, W, H) {
  const g = new Float64Array(W * H)
  for (let i = 0; i < W * H; i++) g[i] = m[i] ? 0 : INF
  const n = Math.max(W, H)
  const f = new Float64Array(n), d = new Float64Array(n), v = new Int32Array(n), z = new Float64Array(n + 1)
  for (let x = 0; x < W; x++) {
    for (let y = 0; y < H; y++) f[y] = g[y * W + x]
    dt1d(f, H, d, v, z)
    for (let y = 0; y < H; y++) g[y * W + x] = d[y]
  }
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) f[x] = g[y * W + x]
    dt1d(f, W, d, v, z)
    for (let x = 0; x < W; x++) g[y * W + x] = d[x]
  }
  return g
}

// §3.4 · holgura = distancia mínima entre la máscara del número y la del
// dibujo. `d2Numero` es `distancia2(mascaraNumero)`, que se calcula una vez
// por carta porque el número no se mueve. Devuelve también dónde.
export function holgura(d2Numero, mDibujo, W) {
  let min = Infinity, idx = -1
  for (let i = 0; i < mDibujo.length; i++) {
    if (mDibujo[i] && d2Numero[i] < min) { min = d2Numero[i]; idx = i }
  }
  if (idx < 0) return { px: Infinity, x: null, y: null }
  return { px: Math.sqrt(min), x: idx % W, y: Math.floor(idx / W) }
}

// Dilatación por disco de radio r (vía la transformada: d² ≤ r²).
export function dilatar(m, W, H, r) {
  const d2 = distancia2(m, W, H)
  const out = new Uint8Array(W * H)
  const r2 = r * r
  for (let i = 0; i < out.length; i++) if (d2[i] <= r2) out[i] = 1
  return out
}

export function restar(a, b) {
  const out = new Uint8Array(a.length)
  for (let i = 0; i < a.length; i++) out[i] = a[i] && !b[i] ? 1 : 0
  return out
}

export function cajaMascara(m, W) {
  let x0 = Infinity, y0 = Infinity, x1 = -1, y1 = -1
  for (let i = 0; i < m.length; i++) {
    if (!m[i]) continue
    const x = i % W, y = (i - x) / W
    if (x < x0) x0 = x; if (x > x1) x1 = x
    if (y < y0) y0 = y; if (y > y1) y1 = y
  }
  return x1 < 0 ? null : [x0, y0, x1, y1]
}

// Componentes conexas (vecindad 8) con área ≥ areaMinima. Cada una trae su
// caja y la lista de índices.
export function componentes(m, W, H, areaMinima = 1) {
  const visto = new Uint8Array(W * H)
  const pila = new Int32Array(W * H)
  const out = []
  for (let s = 0; s < m.length; s++) {
    if (!m[s] || visto[s]) continue
    let top = 0, n = 0
    pila[top++] = s; visto[s] = 1
    const idx = []
    let x0 = Infinity, y0 = Infinity, x1 = -1, y1 = -1
    while (top) {
      const p = pila[--top]
      idx.push(p); n++
      const x = p % W, y = (p - x) / W
      if (x < x0) x0 = x; if (x > x1) x1 = x
      if (y < y0) y0 = y; if (y > y1) y1 = y
      for (let dy = -1; dy <= 1; dy++) {
        const yy = y + dy
        if (yy < 0 || yy >= H) continue
        for (let dx = -1; dx <= 1; dx++) {
          const xx = x + dx
          if ((dx || dy) && xx >= 0 && xx < W) {
            const q = yy * W + xx
            if (m[q] && !visto[q]) { visto[q] = 1; pila[top++] = q }
          }
        }
      }
    }
    if (n >= areaMinima) out.push({ area: n, caja: [x0, y0, x1, y1], indices: idx })
  }
  return out
}

// Ajuste A-3 · la máscara sin sus componentes de menos de `minimo` px.
export function sinComponentesPequenas(m, W, H, minimo = COMPONENTE_MINIMA) {
  const out = new Uint8Array(W * H)
  for (const c of componentes(m, W, H, minimo)) for (const p of c.indices) out[p] = 1
  return out
}

// §3.6.1 · rellena los huecos interiores de UNA componente: todo lo que no es
// alcanzable desde el borde de su caja (ampliada 1 px) sin cruzarla.
export function rellenarHuecos(comp, W) {
  const [x0, y0, x1, y1] = comp.caja
  const w = x1 - x0 + 3, h = y1 - y0 + 3
  const local = new Uint8Array(w * h)
  for (const p of comp.indices) {
    const x = p % W, y = (p - x) / W
    local[(y - y0 + 1) * w + (x - x0 + 1)] = 1
  }
  const fuera = new Uint8Array(w * h)
  const pila = new Int32Array(w * h)
  let top = 0
  pila[top++] = 0; fuera[0] = 1
  while (top) {
    const p = pila[--top]
    const x = p % w, y = (p - x) / w
    const vec = [[1, 0], [-1, 0], [0, 1], [0, -1]]
    for (const [dx, dy] of vec) {
      const xx = x + dx, yy = y + dy
      if (xx < 0 || yy < 0 || xx >= w || yy >= h) continue
      const q = yy * w + xx
      if (!local[q] && !fuera[q]) { fuera[q] = 1; pila[top++] = q }
    }
  }
  const indices = []
  for (let yy = 1; yy < h - 1; yy++) {
    for (let xx = 1; xx < w - 1; xx++) {
      if (!fuera[yy * w + xx]) indices.push((yy - 1 + y0) * W + (xx - 1 + x0))
    }
  }
  return { area: indices.length, caja: comp.caja, indices }
}

export function mascaraDeIndices(indices, W, H) {
  const m = new Uint8Array(W * H)
  for (const p of indices) m[p] = 1
  return m
}
