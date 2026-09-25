// ── gen-idx.mjs · El índice digital de las 40 cartas (campaña IDX-1) ─────────
// Rector: AJILEI_IDX-1_Fase1a_v1.0. Lámina sellada:
// `laminas/idx1/AJILEI_IDX1_lamina_v1.2.html`.
//
// Toma los 40 PNG maestros y produce, FUERA del juego, las 40 caras con el
// índice nuevo: se borran los dos índices viejos, se aparta el dibujo con su
// factor SELLADO (Fase 1b, B-1) y se pinta un solo número arriba a la derecha,
// con el color del palo y un contorno crema. Los maestros no se tocan nunca
// (D-2): el índice se aplica al derivar.
//
// Desde la Fase 1b es la herramienta de REVISIÓN (B-6): el juego y la Portada
// derivan sus cartas con `gen-cards.mjs` y `gen-portada-assets.mjs`, que abren
// la misma página con el mismo núcleo (`scripts/idx/idxNavegador.mjs`).
//
// ── SIN SHARP (D-3) ─────────────────────────────────────────────────────────
// Mismo motor que los otros dos: playwright-core + Edge + canvas, en una
// página que sólo ve archivos del repo (ver `idxNavegador.mjs`).
//
// Se detiene SIN escribir si una carta baja de 17,0 px de holgura con su
// factor sellado o conserva restos del número viejo (B-2).
//
// Salida, toda en `capturas-idx/` (ignorada por git):
//   maestros/{numero}_{palo}.png   la carta resultante a 1055×1491
//   informe.json                   medidas y estado por carta
//   hoja.html                      hoja de contacto autocontenida, para el teléfono
//
// Uso:  node scripts/gen-idx.mjs                 las 40
//       node scripts/gen-idx.mjs siete_copa ...  sólo esas (sin hoja)
import { writeFileSync, mkdirSync, rmSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { CARTAS, COLORES, ORDEN_PALOS, HOLGURA_MINIMA, HOLGURA_TOLERADA, FACTOR_SUELO, COMPONENTE_MINIMA, INTENSIDAD_RESTO } from './idx/idxCore.mjs'
import { abrirIdx, procesarCarta, derivarClasica, motivosDeParada, avisosDeRegla } from './idx/idxNavegador.mjs'

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const SALIDA = resolve(RAIZ, 'capturas-idx')

const pedidas = process.argv.slice(2).filter((a) => !a.startsWith('--'))
const cartas = pedidas.length ? CARTAS.filter((c) => pedidas.includes(c.nombre)) : CARTAS
if (pedidas.length && cartas.length !== pedidas.length) {
  console.log(`STOP :: cartas desconocidas: ${pedidas.filter((p) => !CARTAS.some((c) => c.nombre === p)).join(', ')}`)
  process.exit(1)
}
const completa = cartas.length === CARTAS.length

const { navegador, pagina, versionEdge } = await abrirIdx()

const informe = []
const imagenes = {}
const pngs = {}
const DERIVADOS = [{ clave: 'webp320', ancho: 320, calidad: 0.8 }, { clave: 'webp640', ancho: 640, calidad: 0.8 }]
for (const carta of cartas) {
  const r = await procesarCarta(pagina, carta, { png: true, derivados: DERIVADOS })
  pngs[r.nombre] = Buffer.from(r.png, 'base64')
  const clasica = await derivarClasica(pagina, carta, { derivados: [DERIVADOS[0]] })
  imagenes[r.nombre] = { webp320: r.derivados.webp320.b64, webp640: r.derivados.webp640.b64, clasica320: clasica.webp320.b64 }
  delete r.png; delete r.derivados
  r.sha256 = createHash('sha256').update(pngs[r.nombre]).digest('hex')
  informe.push(r)
  const f = typeof r.factor === 'number' ? r.factor.toFixed(2) : r.factor
  console.log(`${r.nombre.padEnd(14)} holgura ${String(r.holguraAntes.px).padStart(6)} → ${String(r.holguraDespues.px).padStart(6)} px · factor ${f} · ${r.estado}`)
}
await navegador.close()

for (const a of avisosDeRegla(informe)) console.log(`REGLA :: ${a}`)
const paradas = motivosDeParada(informe)
if (paradas.length) {
  console.log(`\nSTOP :: ${paradas.length} carta(s) no pasan la comprobación; no se escribe nada`)
  for (const m of paradas) console.log(`   ${m}`)
  process.exit(1)
}

// Una corrida completa reescribe la carpeta entera: lo que no escriba esta
// corrida no puede quedarse pareciendo suyo.
if (completa) rmSync(SALIDA, { recursive: true, force: true })
mkdirSync(resolve(SALIDA, 'maestros'), { recursive: true })
for (const [nombre, bytes] of Object.entries(pngs)) writeFileSync(resolve(SALIDA, 'maestros', `${nombre}.png`), bytes)

const cuenta = (e) => informe.filter((r) => r.estado === e).length
const resumen = { ok: cuenta('ok'), encogida: cuenta('encogida'), 'necesita-decision': cuenta('necesita-decision'), 'borrado-incompleto': cuenta('borrado-incompleto') }
writeFileSync(resolve(SALIDA, 'informe.json'), JSON.stringify({
  generado: new Date().toISOString(),
  edge: versionEdge,
  reglas: { holguraMinima: HOLGURA_MINIMA, holguraTolerada: HOLGURA_TOLERADA, factorSuelo: FACTOR_SUELO, componenteMinima: COMPONENTE_MINIMA, intensidadResto: INTENSIDAD_RESTO, factores: 'sellados (B-1)' },
  resumen,
  cartas: informe,
}, null, 1))
console.log(`\nRESUMEN :: ${Object.entries(resumen).map(([k, v]) => `${k} ${v}`).join(' · ')} · Edge ${versionEdge}`)

if (!completa) process.exit(0)

// ── La hoja de contacto (§4) ────────────────────────────────────────────────
// «Hoy» es la baraja CLÁSICA: el maestro PNG sin IDX, reducido a 320 px en
// WebP q80 con el mismo método (Cierre, C-3). «Nueva», el mismo derivado de la
// carta con IDX, que es lo que sirve el juego. Se lee de los maestros y no de
// `src/assets/cards/webp/` para que la hoja siga enseñando el antes y el
// después cuando el juego ya sirve la baraja nueva.
const hoy = (n) => imagenes[n].clasica320
const uri = (b64) => `data:image/webp;base64,${b64}`
const NOMBRE_PALO = { oro: 'Oros', copa: 'Copas', espada: 'Espadas', basto: 'Bastos' }
const ANCHOS = [
  { px: 45, nota: 'Carta del rival que gana la mano · celular pequeño (360 px), mesa de 5. La más pequeña del juego' },
  { px: 56, nota: 'Tu mano · celular pequeño (360 px)' },
  { px: 66.4, nota: 'Tu mano · S25 en vertical' },
]
const etiquetaFactor = (r) => (typeof r.factor === 'number' ? (r.factor === 1 ? 'sin encoger' : `dibujo al ${Math.round(r.factor * 100)} %`) : 'monedas al 84 %')
const ESTADO = { ok: 'ok', encogida: 'encogida', 'necesita-decision': 'necesita decisión', 'borrado-incompleto': 'borrado incompleto' }
const porPalo = (palo) => informe.filter((r) => r.palo === palo)
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;')

const fila = (palo, px, cual) => porPalo(palo).map((r) =>
  `<img src="${uri(cual === 'hoy' ? hoy(r.nombre) : imagenes[r.nombre].webp320)}" alt="${esc(r.texto)} de ${NOMBRE_PALO[palo]}, ${cual}" width="${px}" style="width:${px}px">`).join('')

// Qué quedó del número viejo según la verificación del borrado (Ajuste A-2).
const notaBorrado = (r) => {
  if (r.borradoOk) return ''
  const partes = ['sup', 'inf'].filter((k) => r.anillo[k].restos).map((k) =>
    `${k === 'sup' ? 'arriba' : 'abajo'}: ${r.anillo[k].restos} px de resto (${r.anillo[k].muestra[0]})`)
  return `<br><small>${esc(partes.join(' · '))}</small>`
}
const destacadas = informe.filter((r) => r.estado !== 'ok')
const orden = { 'borrado-incompleto': 0, 'necesita-decision': 1, encogida: 2 }
destacadas.sort((a, b) => orden[a.estado] - orden[b.estado] || (a.holguraDespues.px - b.holguraDespues.px))

const html = `<!doctype html>
<html lang="es"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>IDX-1 · Hoja de contacto</title>
<style>
:root{--pagina:#E9E2CF;--tinta:#1B2A20;--tinta-2:#4A5A4E;--linea:rgba(27,42,32,.18);--fieltro:#153922;--fieltro-2:#1d4a2e;--crema:#F5EDD8;--alerta:#9b1c1c;--aviso:#7A5200}
@media (prefers-color-scheme: dark){:root{--pagina:#0c1f14;--tinta:#F5EDD8;--tinta-2:#b9b29f;--linea:rgba(245,237,216,.16);--alerta:#ff8a80;--aviso:#e8c07a}}
*{box-sizing:border-box}
body{margin:0;background:var(--pagina);color:var(--tinta);font:16px/1.45 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
main{max-width:980px;margin:0 auto;padding:20px 12px 60px}
h1{font-size:28px;margin:0 0 4px}h2{font-size:22px;margin:34px 0 6px}h3{font-size:17px;margin:18px 0 4px}
p{margin:4px 0 10px;color:var(--tinta-2)}
.cifras{display:flex;flex-wrap:wrap;gap:8px;margin:12px 0}
.cifra{border:1px solid var(--linea);border-radius:10px;padding:8px 12px;min-width:110px}
.cifra b{display:block;font-size:26px;line-height:1.1}
.lista{list-style:none;padding:0;margin:8px 0;display:grid;gap:6px}
.lista li{border-left:4px solid var(--linea);padding:4px 10px}
.lista li.necesita-decision,.lista li.borrado-incompleto{border-color:var(--alerta)}
.lista li.encogida{border-color:var(--aviso)}
.lista b{font-weight:600}
.fieltro{background:radial-gradient(120% 140% at 50% 0%,var(--fieltro-2),var(--fieltro));border-radius:12px;padding:10px;overflow-x:auto}
.filas{display:grid;gap:10px;width:max-content}
.fila{display:flex;align-items:center;gap:6px}
.rot{font:600 12px/1 system-ui,sans-serif;color:var(--crema);opacity:.75;width:40px;flex:none}
.fila img{display:block;height:auto;border-radius:3px;box-shadow:0 2px 5px rgba(0,0,0,.35)}
.grande{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:18px;justify-items:center}
.grande figure{margin:0;width:240px}
.grande img{width:240px;height:auto;display:block;border-radius:10px;box-shadow:0 3px 10px rgba(0,0,0,.28)}
.grande figcaption{font-size:14px;color:var(--tinta-2);margin-top:6px}
.grande figcaption b{color:var(--tinta)}
.est-necesita-decision,.est-borrado-incompleto{color:var(--alerta);font-weight:700}
.est-encogida{color:var(--aviso);font-weight:600}
footer{margin-top:40px;font-size:13px;color:var(--tinta-2)}
</style></head><body><main>
<h1>Índice digital · hoja de contacto</h1>
<p>IDX-1 (factores sellados). Las 40 cartas, hoy y con el índice nuevo. Ábrela en el teléfono y sin zoom: las franjas están al ancho con que se ven en la mesa.</p>
<div class="cifras">
${Object.entries(resumen).map(([k, v]) => `<div class="cifra"><b>${v}</b>${ESTADO[k]}</div>`).join('\n')}
</div>
${destacadas.length ? `<h2>Para revisar</h2>
<p>Primero las que necesitan una decisión; después las encogidas, con su factor sellado.</p>
<ul class="lista">
${destacadas.map((r) => `<li class="${r.estado}"><b>${esc(r.texto)} de ${NOMBRE_PALO[r.palo]}</b> · ${ESTADO[r.estado]} · ${etiquetaFactor(r)} · holgura ${r.holguraAntes.px} → ${r.holguraDespues.px} px${notaBorrado(r)}</li>`).join('\n')}
</ul>` : ''}
<h2>Tal como se ven en la mesa</h2>
<p>Cada franja lleva su ancho real en píxeles de pantalla. Las filas se pueden desplazar de lado.</p>
${ORDEN_PALOS.map((palo) => `<h3>${NOMBRE_PALO[palo]} <span style="color:${COLORES[palo]}">■</span></h3>
${ANCHOS.map((a) => `<p>${a.px} px · ${a.nota}</p>
<div class="fieltro"><div class="filas">
<div class="fila"><span class="rot">Hoy</span>${fila(palo, a.px, 'hoy')}</div>
<div class="fila"><span class="rot">Nueva</span>${fila(palo, a.px, 'nueva')}</div>
</div></div>`).join('\n')}`).join('\n')}
<h2>Las 40 nuevas de cerca</h2>
<p>A 240 px de ancho, con el tratamiento que recibió cada una.</p>
${ORDEN_PALOS.map((palo) => `<h3>${NOMBRE_PALO[palo]}</h3>
<div class="grande">
${porPalo(palo).map((r) => `<figure><img src="${uri(imagenes[r.nombre].webp640)}" alt="${esc(r.texto)} de ${NOMBRE_PALO[palo]}, nueva"><figcaption><b>${esc(r.texto)} de ${NOMBRE_PALO[palo]}</b> · ${etiquetaFactor(r)} · holgura ${r.holguraDespues.px} px · <span class="est-${r.estado}">${ESTADO[r.estado]}</span></figcaption></figure>`).join('\n')}
</div>`).join('\n')}
<footer>HEPTACREATION · AJILEI · IDX-1 · generado ${new Date().toISOString().slice(0, 10)} con Edge ${versionEdge}</footer>
</main></body></html>
`
writeFileSync(resolve(SALIDA, 'hoja.html'), html)
console.log(`HOJA :: capturas-idx/hoja.html · ${(Buffer.byteLength(html) / 1048576).toFixed(2)} MB`)
