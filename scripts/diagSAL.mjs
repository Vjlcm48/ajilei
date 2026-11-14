// ═══════════════════════════════════════════════════════════════════════════
// AJILEI · diagSAL.mjs · El metro de las salas jugador contra jugador
// Rector: AJILEI_SAL-B1_Fase1_v1.0.md §8. Autoridad visual: láminas SAL-1 v1.2
// y SAL-2 v1.2.
//
//   node scripts/diagSAL.mjs sal            → los 19 estados × 6 viewports (114 celdas)
//   node scripts/diagSAL.mjs sal <estado>   → un solo estado, para depurar
//
// ARN-3c (A-3 de ARN-3a) · `shots` se retiró: la cabecera prometía «solo
// capturas, sin veredicto», pero el código no ramificaba por modo y `shots`
// corría y juzgaba igual que `sal`. `sal` ya deja las capturas.
//
// ── CONTRA QUÉ SERVIDOR CORRE, Y POR QUÉ NO ES EL QUE PEDÍA §8.1 ───────────
// §8.1 dice «corre contra `vite preview` (4173), como `diagDSK`». No puede, y la
// causa está en la propia ficha: §8.2 exige que `?sal=` lleve «la misma guarda
// que el bypass de auth», y esa guarda es `import.meta.env.DEV && VITE_AUTH_BYPASS`.
// `import.meta.env.DEV` es FALSE en cualquier build, así que en `vite preview`:
//
//   · no hay bypass  → la Portada pide correo y el arnés no llega ni al lobby;
//   · no hay fixtures → `?sal=` no significa nada, porque §9.3 exige —y esta
//     tanda verifica con `grep`— que el archivo entero desaparezca de `dist/`.
//
// Las dos mitades de §8 no pueden cumplirse a la vez, y la que manda es §8.2:
// es la que protege producción. Así que esto corre en el servidor de desarrollo
// con `VITE_AUTH_BYPASS=1`, que es exactamente donde corre `diagDSK lob`. La
// desviación queda anotada en el informe.
//
// ARN-3a · el arnés levanta su propio servidor; con el 5173 ocupado se niega y
// dice quién lo ocupa. Otro puerto: `--puerto=N`. Un servidor ya levantado a
// mano: `--servidor=externo` con `AJILEI_BASE`, misma convención que `diagDSK`.
//
//   node scripts/diagSAL.mjs sal --puerto=5180
//   AJILEI_BASE=http://localhost:5174 node scripts/diagSAL.mjs sal --servidor=externo
//
// ── QUÉ MIDE Y QUÉ NO ──────────────────────────────────────────────────────
// Mide GEOMETRÍA y silencio: que nada desborde, que la ventanilla sean tres
// tarjetas, que los CTA lleguen al piso táctil, que los iconos midan `--ico`,
// que la consola calle y que no haya un solo `⟦`.
//
// MES-PvP 7b · las cifras de dinero son las de la regla de 15× (Corta) y 50×
// (Llena) de `config/salas.js`; las 18 celdas que esperaban la de 5× (rojas
// desde `342dbc7`) se rehicieron con la pantalla nueva.
//
// NO mide las reglas del servidor. La regla 5×, el límite de cinco intentos por
// minuto y el índice parcial viven en SQL y se comprueban con dos teléfonos
// (§9.5). Un arnés contra fixtures que dijera «la regla 5× funciona» estaría
// midiendo los fixtures.
// ═══════════════════════════════════════════════════════════════════════════

import { writeFileSync, mkdirSync, readFileSync } from 'node:fs'
// ARN-3a · navegador, servidor, puerto y código de salida: terreno común.
// El arnés levanta su propio servidor de desarrollo con bypass (5173 o
// `--puerto=N`) dentro de su proceso; `--servidor=externo` usa `AJILEI_BASE`.
// Sale con 0 (verde), 1 (rojo) o 2 (instrumento).
import {
  instalarSalidas, opcionesDelArnes, navegadorArnes, servidorArnes, terminar, fallarInstrumento,
  ErrorInstrumento, codigoDeSalida,
} from './arnes/comun.mjs'
import { commitDelArbol } from './arnes/fuente.mjs'

// ARN-1 · el instrumento se autoetiqueta. `playwright-core` va pineado exacto en
// devDependencies porque los píxeles cambian entre versiones. Desde ARN-3a el
// NAVEGADOR también: es el Chromium que trae esa versión (D1), y su versión se
// relee en vivo y viaja en el JSON.
const PW_VERSION = JSON.parse(
  readFileSync(new URL('../node_modules/playwright-core/package.json', import.meta.url), 'utf8')).version

instalarSalidas()
const OPC = opcionesDelArnes()
const EXTERNO = OPC.servidor === 'externo'
const BASE = EXTERNO ? (process.env.AJILEI_BASE || 'http://localhost:5173') : `http://localhost:${OPC.puerto || 5173}`
const OUT_DIR = 'capturas-sal'
const MODE = process.argv[2] || 'sal'
const SOLO = process.argv[3] || null
if (MODE !== 'sal') {
  await fallarInstrumento(new ErrorInstrumento(`modo desconocido: «${MODE}». El modo es: sal${MODE === 'shots' ? ' («shots» se retiró en ARN-3c: no era un modo distinto; `sal` deja las capturas)' : ''}`))
}

// Los nueve estados de §8.3, el décimo del Ajuste A1 §5 y el undécimo del A2 §3.
// Se declaran aquí y NO se importan de
// `src/dev/salasFixtures.js`, aunque aquél exporte la misma lista: importarlo
// arrastraría `import.meta.env` a un proceso de Node, que no lo tiene. La
// duplicación se paga con un punto del arnés —`sal.0`— que compara las dos
// listas leyendo el archivo como TEXTO, así que separarse sigue costando rojo.
const ESTADOS = [
  { id: 'opciones-vacio',         pantalla: 'opciones', nota: 'ventanilla en estado vacío' },
  { id: 'opciones-3',             pantalla: 'opciones', nota: 'tres tarjetas exactas' },
  { id: 'opciones-mas',           pantalla: 'opciones', nota: 'cinco mesas · scroll interno' },
  { id: 'opciones-fuera-alcance', pantalla: 'opciones', nota: 'mesa de 5000 atenuada y al final' },
  { id: 'opciones-error',         pantalla: 'opciones', nota: 'código rechazado' },
  { id: 'opciones-codigo-lleno',  pantalla: 'opciones', nota: 'campo lleno LHQH + error · la primera letra visible' },
  // MES-PvP 7b · dos Llenas (una a mi alcance, otra no) y una Corta.
  { id: 'opciones-llena',         pantalla: 'opciones', nota: 'mesas Llenas · «Entrada … HC» y «Te faltan» con la entrada de cada mesa' },
  { id: 'armar',                  pantalla: 'armar',    nota: 'estado base · 7 apuestas, Entrada y Ritmo · Llena apagada y vuelta a Corta' },
  { id: 'armar-aviso',            pantalla: 'armar',    nota: 'apuesta 200 · aviso al anfitrión' },
  { id: 'armar-unirme',           pantalla: 'armar',    nota: 'combinación existente · CTA cambiado · Ritmo apagado' },
  // ── SAL-B2 F1b · la sala de espera real, un estado por vista de la lámina ──
  { id: 'espera-anfitrion',       pantalla: 'espera',   nota: 'anfitrión · 2/4 · «Jugar ya» · llegada, salida y cancelación por Realtime' },
  { id: 'espera-invitado',        pantalla: 'espera',   nota: 'invitado · «Esperando al anfitrión…» · Tú en la silla 1' },
  { id: 'espera-abierta',         pantalla: 'espera',   nota: 'abierta · globo en vez de código · Compartir apagado, misma caja' },
  { id: 'espera-llena',           pantalla: 'espera',   nota: '5/5 · reloj en oro ≤ 0:10 · sin «Jugar ya»' },
  { id: 'espera-fin-cancelada',   pantalla: 'espera',   nota: 'invitado · «El anfitrión cerró la mesa» · «Buscar otra mesa»' },
  { id: 'espera-fin-vencida',     pantalla: 'espera',   nota: 'anfitrión solo · reloj a 0 → resolver → «no llegó gente a tiempo»' },
  { id: 'espera-fin-activa',      pantalla: 'espera',   nota: 'dos sentados · reloj a 0 → resolver → la mesa se abre sola (MES-PvP 3 §3.3)' },
  // MES-PvP 7b · 3 de 5, nombres largos: el mini-perfil y la pasada de 44.
  { id: 'espera-nombres',         pantalla: 'espera',   nota: '3/5 · nombres largos · mini-perfil ajeno y propio · avatar apagado · pasada de 44' },
  // A2 · pantalla 'opciones' porque es donde la app DEBE quedarse: la mesa que
  // el fixture trae es la fila de nulos y la sala no puede pintarse con ella.
  { id: 'espera-fantasma',        pantalla: 'opciones', nota: 'mi_sala devuelve la fila de nulos · la sala NO se pinta' },
]

// Los seis viewports de la casa, los MISMOS de `diagDSK lob`. No se inventa
// ninguno: comparar dos campañas exige que el eje sea el mismo.
const VIEWPORTS = [
  { w: 640, h: 360, note: 'móvil landscape' },
  { w: 360, h: 640, note: 'portrait' },
  { w: 844, h: 390, note: 'móvil landscape' },
  { w: 1024, h: 768, note: 'desktop' },
  { w: 1366, h: 768, note: 'desktop' },
  { w: 1920, h: 937, note: 'desktop' },
]


// ── EL LECTOR DE TOKENS, Y LA TRAMPA QUE LO OBLIGA ──────────────────────────
// `getComputedStyle(el).getPropertyValue('--cta-h')` NO devuelve píxeles:
// devuelve la cadena DECLARADA, `max(44px, calc(var(--u) * 11))`. Las custom
// properties se resuelven en el momento de SUSTITUIRSE en una propiedad de
// verdad, no al declararse, así que un `parseFloat` sobre eso da `NaN` — y un
// `NaN` en una comparación es siempre `false`, es decir, rojo silencioso.
//
// Es una trampa MEDIDA en la campaña DSK y anotada allí. La única forma de leer
// el valor USADO es hacer que el navegador lo use: se planta una sonda invisible
// dentro de `.sal`, se le da el token como alto y ancho, y se lee su caja.
//
// Va DENTRO de `.sal` a propósito: tokens como `--col` y `--cta-w` llevan un
// `min(100%, …)`, y ese `100%` sólo significa lo correcto si el porcentaje se
// resuelve contra el mismo contenedor contra el que lo resuelve el elemento de
// verdad.
const LECTOR_TOKENS = `
  window.__tokenPx = (nombre) => {
    const sal = document.querySelector('main.sal')
    const sonda = document.createElement('div')
    sonda.style.position = 'absolute'
    sonda.style.visibility = 'hidden'
    sonda.style.pointerEvents = 'none'
    sonda.style.height = 'var(' + nombre + ')'
    sonda.style.width = 'var(' + nombre + ')'
    sal.appendChild(sonda)
    const caja = sonda.getBoundingClientRect()
    sonda.remove()
    return { w: caja.width, h: caja.height }
  }
`

const PUNTOS = ['sal.1', 'sal.2', 'sal.3', 'sal.4', 'sal.5', 'sal.6']

const round = (n) => (n == null ? null : Math.round(n * 100) / 100)

// Tolerancia de UN píxel en las comparaciones de caja. No es holgura para tapar
// un fallo: `getBoundingClientRect` devuelve fracciones y el navegador cuantiza
// a 1/64 px (lección medida en DSK), así que una altura que la fórmula clava en
// 44 puede leerse como 43,99. Un píxel es menos de lo que cualquier ojo ve y más
// de lo que la cuantización puede desviar.
const CASI = 1

async function medirCelda(browser, estado, vp) {
  const page = await browser.newPage({ viewport: { width: vp.w, height: vp.h } })
  const consola = []
  // Se recogen los TRES canales que delatan un fallo real. `console.log` no
  // entra: el proyecto lo usa para trazas legítimas.
  page.on('pageerror', (e) => consola.push(`pageerror: ${e.message}`))
  page.on('console', (m) => {
    if (m.type() === 'error' || m.type() === 'warning') consola.push(`${m.type()}: ${m.text()}`)
  })
  page.on('requestfailed', (r) => consola.push(`requestfailed: ${r.url()}`))

  const c = { estado: estado.id, vp: `${vp.w}x${vp.h}`, note: vp.note }

  await page.goto(`${BASE}/?sal=${estado.id}`)
  // MES-PvP 7a · desde MES-PvP 3 §3.3 la mesa que arranca se abre sola (`SalaEspera`, el efecto
  // de `fin === 'activa'`): «¡Arranca la partida!» ya no se queda en pantalla y no hay nada que
  // medir en ella. La celda comprueba eso: que, resuelta la sala, se monta la partida. La celda
  // medía la pantalla vieja y desde entonces tiraba el arnés (`main.sal` desaparecía a mitad, o ni
  // llegaba a verse).
  if (estado.id === 'espera-fin-activa') {
    const entra = await page.waitForSelector('.game-table-screen', { timeout: 15000 }).then(() => true, () => false)
    const punto = { ok: entra, nota: entra ? 'la partida se abre sola' : 'la partida no se abrió en 15 s' }
    for (const k of PUNTOS) c[k] = punto
    c.consola = consola
    c.ok = entra
    mkdirSync(OUT_DIR, { recursive: true })
    c.shot = `${OUT_DIR}/${estado.id}_${vp.w}x${vp.h}.png`
    await page.screenshot({ path: c.shot })
    await page.close()
    return c
  }
  await page.waitForSelector('main.sal', { timeout: 10000 })
  await page.evaluate(LECTOR_TOKENS)
  // Que asiente el primer fotograma: los chips llevan transición de color y la
  // lista se pinta tras la promesa de la API. Medir antes daría cajas de mitad
  // de camino — la lección de `movEsperaEntrada` en `diagDSK`.
  await page.waitForTimeout(350)
  // El puntero fuera de todo: un `:hover` accidental cambia bordes y colores, y
  // dos corridas dejarían de ser comparables por dónde quedó el ratón.
  await page.mouse.move(2, 2)

  // ── sal.1 · la pantalla correcta, y NADA desborda ───────────────────────
  // El desbordamiento HORIZONTAL es siempre un fallo. El vertical sólo lo es
  // fuera del traje apaisado: ese traje declara `overflow: auto` a propósito
  // —«misma columna; la pantalla desplaza»— y exigirle que no desplace sería
  // exigir lo contrario de lo que la lámina dice.
  const p1 = await page.evaluate(() => {
    const sal = document.querySelector('main.sal')
    const cs = getComputedStyle(sal)
    return {
      hay: !!sal,
      cab: document.querySelector('.sal-cab h1')?.textContent?.trim() ?? '',
      // El TÍTULO se pinta del color de la pantalla, y no del que `index.css`
      // impone a todo `h1` (`--text-h`, casi negro). Es un fallo que ninguna
      // medida de caja habría visto —el h1 estaba en su sitio y del tamaño
      // correcto, sólo que ilegible— y que apareció mirando una captura. Se
      // compara contra el color del propio contenedor, así que sigue valiendo
      // el día que la pantalla cambie de paleta.
      tituloDelColor: (() => {
        const h1 = document.querySelector('.sal-cab h1')
        return !!h1 && getComputedStyle(h1).color === getComputedStyle(sal).color
      })(),
      desbordaX: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
      desbordaY: sal.scrollHeight > sal.clientHeight + 1,
      apaisado: cs.overflow === 'auto' || cs.overflowY === 'auto',
      // La casa está en las tres pantallas y es lo último que cabe: si se sale
      // del viewport, es que el traje no apretó lo suficiente.
      casaDentro: (() => {
        const b = document.querySelector('.sal-casa')?.getBoundingClientRect()
        return !!b && b.bottom <= innerHeight + 1 && b.left >= -1
      })(),
    }
  })
  c['sal.1'] = {
    ...p1,
    ok: p1.hay && !p1.desbordaX && (!p1.desbordaY || p1.apaisado)
      && p1.casaDentro && p1.tituloDelColor,
  }

  // ── sal.2 · IDI-0 · consola limpia y CERO ⟦ ─────────────────────────────
  // El `⟦` es el marcador de clave o variable sin resolver que IDI-0 diseñó
  // para que un texto que falta se VEA en vez de salir como hueco. Aquí no
  // puede haber ninguno: uno solo significa una clave sin escribir o una
  // variable que la pantalla olvidó pasar.
  const p2 = await page.evaluate(() => {
    const texto = document.querySelector('main.sal').innerText
    return {
      rotos: (texto.match(/⟦[^⟧]*⟧/g) ?? []),
      lang: document.documentElement.lang,
    }
  })
  c['sal.2'] = { ...p2, consola, ok: p2.rotos.length === 0 && p2.lang === 'es' && consola.length === 0 }

  // ── sal.3 · la ventanilla mide EXACTAMENTE tres tarjetas ────────────────
  // Decisión sellada, y el punto que más caro sale de olvidar: con cinco mesas
  // la caja no puede crecer, y con cero tampoco puede encogerse — si encogiera,
  // el bloque de abajo subiría y la pantalla mediría distinto según cuánta
  // gente esté jugando.
  //
  // La altura esperada se DERIVA de los tokens leídos del navegador
  // (`--tarjeta-h`, `--lista-gap`), no de una cifra escrita aquí: así el día que
  // la lámina cambie la tarjeta, el arnés sigue midiendo la promesa y no un
  // número viejo.
  if (estado.pantalla === 'opciones') {
    const p3 = await page.evaluate(() => {
      const lista = document.querySelector('.sal-lista')
      if (!lista) return { hay: false }
      const tarjeta = window.__tokenPx('--tarjeta-h').h
      const gap = window.__tokenPx('--lista-gap').h
      const tarjetas = [...lista.querySelectorAll('.sal-mesa')]
      return {
        hay: true,
        alto: lista.getBoundingClientRect().height,
        esperado: tarjeta * 3 + gap * 2,
        tarjetas: tarjetas.length,
        // Con más de tres, la caja tiene que poder desplazar por dentro.
        desplaza: lista.scrollHeight > lista.clientHeight + 1,
        // Y el ancho de la lista jamás desborda su columna.
        cabeEnColumna: lista.scrollWidth <= lista.clientWidth + 1,
      }
    })
    c['sal.3'] = {
      ...p3,
      ok: p3.hay
        && Math.abs(p3.alto - p3.esperado) <= CASI
        && p3.cabeEnColumna
        && (p3.tarjetas > 3 ? p3.desplaza : !p3.desplaza),
    }
  } else {
    c['sal.3'] = { noAplica: true, ok: true }
  }

  // ── sal.4 · los CTA miden lo que la lámina dice ─────────────────────────
  // `--cta-h` lleva `max(44px, 11u)`: la fórmula manda en cuanto hay sitio y por
  // debajo manda el dedo. Es la lección que LOB-1 pagó midiendo 36px en un
  // teléfono. Se comprueba contra el token leído en vivo Y contra el piso de 44.
  const p4 = await page.evaluate(() => {
    const ctaH = window.__tokenPx('--cta-h').h
    const cajas = {}
    for (const [nombre, sel] of Object.entries({
      cta: '.sal-cta',
      entrar: '.sal-entrar',
      chip: '.sal-chip',
      secundario: '.sal-secundario',
    })) {
      const el = document.querySelector(sel)
      if (!el) continue
      // F1b · un control que no se ve no se toca: los botones del diálogo de
      // cancelar viven ocultos (`visibility: hidden`, con `scale(.96)` de
      // entrada) hasta que el anfitrión pulsa «Salir», y el piso táctil se
      // exige a lo que el dedo puede alcanzar.
      if (getComputedStyle(el).visibility === 'hidden') continue
      const b = el.getBoundingClientRect()
      cajas[nombre] = { w: b.width, h: b.height }
    }
    return { ctaH, cajas, colMax: window.__tokenPx('--col').w }
  })
  c['sal.4'] = {
    ...p4,
    ok: p4.ctaH >= 44 - CASI
      // El CTA principal mide `--cta-h` exacto; el resto son controles táctiles
      // y lo único que se les exige es el piso de 40px de la campaña DSK.
      && (!p4.cajas.cta || Math.abs(p4.cajas.cta.h - p4.ctaH) <= CASI)
      && Object.entries(p4.cajas).every(([k, b]) => (k === 'cta' ? true : b.h >= 40 - CASI))
      && Object.values(p4.cajas).every((b) => b.w <= p4.colMax + CASI),
  }

  // ── sal.5 · el contrato de iconos: un solo token ────────────────────────
  // TODO icono de acción mide `--ico` y sus botones `1.45·--ico`. Antes de LOB-1
  // cada uno traía su cifra y la simetría existía sólo por disciplina: bastaba
  // tocar una para romperla en un viewport y no en otro. Aquí existe por
  // construcción, y esto es lo que lo comprueba.
  //
  // LOS GLIFOS DE LÍNEA NO ENTRAN: el `+` de la píldora y el candado/globo de
  // las tarjetas de modo se miden en `em` con el texto que acompañan. Meterlos
  // aquí sería exigirles la rejilla de controles a los que no son controles.
  const p5 = await page.evaluate(() => {
    const ico = window.__tokenPx('--ico').h
    const medidos = {}
    for (const [nombre, sel] of Object.entries({
      avatar: '.lob-top .lob-avatar svg',
      ajustes: '.lob-ajustes svg',
      volver: '.sal-volver svg',
      casa: '.sal-casa svg',
      copiar: '.sal-copiar svg',
      // F1b · la moneda de la barra, ahora que §14 la dimensiona bajo `.sal`.
      moneda: '.lob-moneda .chip-token',
    })) {
      const el = document.querySelector(sel)
      if (!el) continue
      const b = el.getBoundingClientRect()
      medidos[nombre] = { w: b.width, h: b.height }
    }
    return { ico, medidos }
  })
  c['sal.5'] = {
    ...p5,
    ok: Object.values(p5.medidos).length > 0
      && Object.values(p5.medidos).every(
        (b) => Math.abs(b.w - p5.ico) <= CASI && Math.abs(b.h - p5.ico) <= CASI
      ),
  }

  // ── sal.6 · lo que este estado, y sólo éste, tiene que enseñar ──────────
  // Un verde mide lo que dice: sin este punto los cinco anteriores saldrían
  // verdes sobre una pantalla vacía, porque «nada desborda» es trivialmente
  // cierto cuando no hay nada.
  c['sal.6'] = await medirEstado(page, estado)

  c.consola = consola
  c.ok = PUNTOS.every((k) => c[k].ok)

  mkdirSync(OUT_DIR, { recursive: true })
  c.shot = `${OUT_DIR}/${estado.id}_${vp.w}x${vp.h}.png`
  await page.screenshot({ path: c.shot })

  await page.close()
  return c
}

// ── El punto propio de cada estado ──────────────────────────────────────────
async function medirEstado(page, estado) {
  switch (estado.id) {
    case 'opciones-vacio': {
      const r = await page.evaluate(() => ({
        vacio: !!document.querySelector('.sal-vacio'),
        tarjetas: document.querySelectorAll('.sal-mesa').length,
        // El estado vacío OCUPA la ventanilla entera: si midiera menos, el
        // bloque de abajo subiría y la pantalla cambiaría de forma según haya
        // mesas o no.
        llenaCaja: (() => {
          const l = document.querySelector('.sal-lista')?.getBoundingClientRect()
          const v = document.querySelector('.sal-vacio')?.getBoundingClientRect()
          return !!l && !!v && Math.abs(l.height - v.height) <= 1
        })(),
      }))
      return { ...r, ok: r.vacio && r.tarjetas === 0 && r.llenaCaja }
    }

    case 'opciones-3': {
      const r = await page.evaluate(() => ({
        tarjetas: document.querySelectorAll('.sal-mesa').length,
        fuera: document.querySelectorAll('.sal-mesa.is-fuera').length,
        unirVivos: [...document.querySelectorAll('.sal-unir')].filter((b) => !b.disabled).length,
      }))
      return { ...r, ok: r.tarjetas === 3 && r.fuera === 0 && r.unirVivos === 3 }
    }

    case 'opciones-mas': {
      // Cinco mesas, ordenadas por «más llenas primero, a igualdad apuesta
      // menor». Los fixtures llegan DESORDENADOS a propósito, así que este punto
      // mide el `sort` y no la suerte.
      const r = await page.evaluate(() => ({
        tarjetas: document.querySelectorAll('.sal-mesa').length,
        orden: [...document.querySelectorAll('.sal-mesa .sal-mesa-l1')].map((e) => e.textContent.trim()),
        desplaza: (() => {
          const l = document.querySelector('.sal-lista')
          return !!l && l.scrollHeight > l.clientHeight + 1
        })(),
      }))
      return {
        ...r,
        ok: r.tarjetas === 5 && r.desplaza
          && r.orden[0].includes('4') && r.orden[0].includes('200'),
      }
    }

    case 'opciones-fuera-alcance': {
      // La cifra de §8.3, palabra por palabra: saldo 5.000, mesa de 5.000, y la
      // resta que el jugador lee es 70.000 (15 × 5.000 − 5.000; MES-PvP 7b,
      // era 20.000 con la regla de 5×). Se comprueba el TEXTO, porque es lo que
      // el jugador ve; el cálculo ya lo sella `salasCore.test.js`.
      const r = await page.evaluate(() => {
        const fuera = document.querySelector('.sal-mesa.is-fuera')
        const todas = [...document.querySelectorAll('.sal-mesa')]
        return {
          hay: !!fuera,
          // Fuera de alcance va AL FINAL, aunque llegara primera del servidor.
          ultima: todas.length > 0 && todas[todas.length - 1] === fuera,
          l2: fuera?.querySelector('.sal-mesa-l2')?.textContent?.trim() ?? '',
          // El botón sigue en su sitio y apagado: la tarjeta conserva sus tres
          // columnas y mide lo mismo que las demás.
          botonApagado: !!fuera?.querySelector('.sal-unir')?.disabled,
          mismaAltura: (() => {
            if (todas.length < 2) return false
            const h = todas.map((e) => e.getBoundingClientRect().height)
            return Math.max(...h) - Math.min(...h) <= 1
          })(),
          atenuada: parseFloat(getComputedStyle(fuera).opacity) < 1,
        }
      })
      return {
        ...r,
        ok: r.hay && r.ultima && r.botonApagado && r.mismaAltura && r.atenuada
          && r.l2.includes('70.000') && !r.l2.includes('Entrada'),
      }
    }

    case 'opciones-llena': {
      // MES-PvP 7b · saldo 5.000. La Llena de 4×100 pide 5.000 y alcanza. La de
      // 3×200 pide 10.000: atenuada y «Te faltan 5.000 HC» (con la regla de la
      // Corta estaría viva). La de 5×5.000 pide 250.000: «Te faltan 245.000 HC»,
      // el peor caso de la línea. La Corta no dice nada. Las cuatro miden lo
      // mismo (O1), las de fuera van al final y ninguna línea se corta: la que
      // no cabe se aprieta (`letra` es su tamaño entre el de la Corta).
      const r = await page.evaluate(() => {
        const todas = [...document.querySelectorAll('.sal-mesa')]
        const l2 = (m) => m.querySelector('.sal-mesa-l2')
        return {
          l1: todas.map((m) => m.querySelector('.sal-mesa-l1').textContent.trim()),
          l2: todas.map((m) => l2(m).textContent.trim()),
          fuera: todas.map((m) => m.classList.contains('is-fuera')),
          unirVivos: todas.map((m) => !m.querySelector('.sal-unir').disabled),
          cortadas: todas.filter((m) => l2(m).scrollWidth > l2(m).clientWidth + 1).length,
          alturas: todas.map((m) => m.getBoundingClientRect().height),
          letra: (() => {
            const corta = todas.find((m) => !m.classList.contains('es-llena'))
            const base = corta ? parseFloat(getComputedStyle(l2(corta)).fontSize) : NaN
            return todas.map((m) => Math.round(parseFloat(getComputedStyle(l2(m)).fontSize) / base * 100) / 100)
          })(),
        }
      })
      // Cada tarjeta por su línea 1, no por su sitio: el orden lo sella `opciones-mas`.
      const de = (l1) => {
        const i = r.l1.findIndex((t) => t.startsWith(l1))
        return i < 0 ? null : { i, l2: r.l2[i], viva: r.unirVivos[i], fuera: r.fuera[i] }
      }
      const m4 = de('Mesa de 4 · 100 HC')
      const m3 = de('Mesa de 3 · 200 HC')
      const m5 = de('Mesa de 5 · 5.000 HC')
      const m2 = de('Mesa de 2 · 100 HC')
      return {
        ...r,
        ok: r.l2.length === 4 && !!m4 && !!m3 && !!m5 && !!m2
          && m4.l2 === '2/4 sentados · Entrada 5.000 HC' && m4.viva && !m4.fuera
          && m2.l2 === '1/2 sentados' && m2.viva && !m2.fuera
          && m3.l2 === 'Te faltan 5.000 HC · Entrada 10.000 HC' && !m3.viva && m3.fuera
          && m5.l2 === 'Te faltan 245.000 HC · Entrada 250.000 HC' && !m5.viva && m5.fuera
          && Math.min(m3.i, m5.i) > Math.max(m4.i, m2.i)
          && r.cortadas === 0
          && Math.max(...r.alturas) - Math.min(...r.alturas) <= 1,
      }
    }

    case 'opciones-error': {
      // Se teclea un código válido y el fixture lo rechaza. Lo que se mide es la
      // conducta de §3.2: aviso visible, código CONSERVADO y foco de vuelta al
      // campo — las tres cosas que hacen que equivocarse no castigue.
      await page.fill('[data-accion="codigo"]', '7K2M')
      await page.click('[data-accion="entrar"]')
      await page.waitForTimeout(250)
      const r = await page.evaluate(() => {
        const aviso = document.querySelector('.sal-aviso-error')
        const campo = document.querySelector('[data-accion="codigo"]')
        return {
          encendido: aviso?.classList.contains('is-on') ?? false,
          texto: aviso?.textContent?.trim() ?? '',
          codigoConservado: campo?.value ?? '',
          foco: document.activeElement === campo,
          // O1 · la caja del aviso estaba reservada, así que encenderlo no puede
          // haber movido la lista ni un píxel.
          reserva: getComputedStyle(aviso).visibility === 'visible',
        }
      })
      return {
        ...r,
        ok: r.encendido && r.reserva && r.codigoConservado === '7K2M' && r.foco
          && r.texto.length > 0 && !r.texto.includes('⟦'),
      }
    }

    case 'opciones-codigo-lleno': {
      // ── A1 §5 · la primera letra del código NO se esconde ────────────────
      // El campo llega LLENO por el camino real —código precargado por el
      // arranque, intento automático, fallo y foco de vuelta al campo—, que es
      // exactamente la secuencia con la que el Motorola enseñó `.HQH`.
      //
      // La caja de un <input> no se puede leer glifo a glifo, pero SU
      // DESPLAZAMIENTO interno sí: el primer glifo empieza en
      // `left + padding − scrollLeft`. Con contenido más ancho que la caja, el
      // navegador desplaza hacia el cursor al recibir el foco y esa x cae por
      // debajo del borde derecho del prefijo `AJ-`. La medida explícita de la
      // ficha es ésa: primer glifo ≥ borde interior del campo + ancho del
      // prefijo. Se añade que el <input> entero quepa dentro del campo, porque
      // un ancho reservado que no cupiera sería el fallo contrario.
      const medir = () => page.evaluate(() => {
        const campo = document.querySelector('.sal-campo')
        const pre = campo?.querySelector('.sal-pre')
        const input = campo?.querySelector('input')
        if (!campo || !pre || !input) return { hay: false }
        const cc = campo.getBoundingClientRect()
        const cp = pre.getBoundingClientRect()
        const ci = input.getBoundingClientRect()
        const csI = getComputedStyle(input)
        const csC = getComputedStyle(campo)
        const padL = parseFloat(csI.paddingLeft) || 0
        return {
          hay: true,
          valor: input.value,
          foco: document.activeElement === input,
          scrollLeft: input.scrollLeft,
          desborda: input.scrollWidth > input.clientWidth + 1,
          primerGlifoX: ci.left + padL - input.scrollLeft,
          bordeInterior: cc.left + (parseFloat(csC.paddingLeft) || 0),
          finPrefijo: cp.right,
          cabe: ci.right <= cc.right - (parseFloat(csC.paddingRight) || 0) + 1,
          errorOn: document.querySelector('.sal-aviso-error')?.classList.contains('is-on') ?? false,
        }
      })
      const precargado = await medir()

      // Y TECLEADO A MANO, con las cuatro letras más anchas del alfabeto: si
      // `MWMW` cabe, cabe cualquier código. Se desenfoca y se vuelve a enfocar
      // porque es el foco lo que dispara el desplazamiento.
      const campo = page.locator('[data-accion="codigo"]')
      await campo.fill('')
      await campo.pressSequentially('MWMW')
      await page.evaluate(() => document.activeElement?.blur())
      await campo.focus()
      await page.waitForTimeout(100)
      const tecleado = await medir()

      const bien = (m) => m.hay && m.foco && !m.desborda && m.scrollLeft === 0 && m.cabe
        && m.primerGlifoX >= m.finPrefijo - CASI
        && m.primerGlifoX >= m.bordeInterior - CASI
      return {
        precargado,
        tecleado,
        ok: bien(precargado) && precargado.valor === 'LHQH' && precargado.errorOn
          && bien(tecleado) && tecleado.valor === 'MWMW',
      }
    }

    case 'armar': {
      const r = await page.evaluate(() => ({
        chipsJug: document.querySelectorAll('.sal-chips.es-jugadores .sal-chip').length,
        chipsApu: document.querySelectorAll('[data-accion="apuesta"]').length,
        // MES-PvP 7b · siete apuestas. Saldo 5.000 con la Corta (15×) → alcanzan
        // 50/100/200; 500, 1.000, 2.000 y 5.000 no.
        apagados: [...document.querySelectorAll('[data-accion="apuesta"]')].filter((b) => b.disabled).length,
        cta: document.querySelector('[data-accion="cta"]')?.textContent?.trim() ?? '',
        avisoOn: document.querySelector('[data-accion="aviso-nuevos"]')?.classList.contains('is-on'),
        recuerdoOn: document.querySelector('[data-accion="recuerdo"]')?.classList.contains('is-on'),
        modoPrivada: document.querySelector('[data-accion="modo-privada"]')?.getAttribute('aria-pressed'),
      }))
      // MES-PvP 7b · las filas Entrada y Ritmo (V-A: Apuesta · Entrada · Ritmo ·
      // modos) y la regla del saldo de la Entrada: con 100, Llena (5.000) alcanza;
      // elegida Llena, subir a 200 (10.000) la apaga y la Entrada vuelve SOLA a
      // Corta. Después se deja otra vez en 100 para la captura.
      const filas = () => page.evaluate(() => {
        const chips = (a) => [...document.querySelectorAll(`[data-accion="${a}"]`)]
          .map((b) => ({ t: b.textContent.trim(), on: b.getAttribute('aria-pressed') === 'true', off: b.disabled }))
        const primero = (a) => document.querySelector(`[data-accion="${a}"]`)
        const antes = (x, y) => !!x && !!y && Boolean(x.compareDocumentPosition(y) & Node.DOCUMENT_POSITION_FOLLOWING)
        return {
          entrada: chips('entrada'),
          ritmo: chips('ritmo'),
          orden: antes(primero('apuesta'), primero('entrada')) && antes(primero('entrada'), primero('ritmo'))
            && antes(primero('ritmo'), primero('modo-privada')),
        }
      })
      const inicio = await filas()
      const chipEntrada = page.locator('[data-accion="entrada"]')
      const chipApuesta = (hc) => page.locator('[data-accion="apuesta"]', { hasText: new RegExp(`^${hc}$`) })
      await chipEntrada.nth(1).click()
      await page.waitForTimeout(150)
      const conLlena = await filas()
      await chipApuesta('200').click()
      await page.waitForTimeout(150)
      const subida = await filas()
      await chipApuesta('100').click()
      await page.waitForTimeout(150)
      await page.mouse.move(2, 2)
      const ver = (f) => f.entrada.map((c) => `${c.t}${c.on ? '*' : ''}${c.off ? '(off)' : ''}`).join(' | ')
      const ritmoOk = inicio.ritmo.length === 2 && inicio.ritmo[0].t === 'Normal' && inicio.ritmo[1].t === 'Rápido'
        && inicio.ritmo[0].on && !inicio.ritmo[1].on && inicio.ritmo.every((c) => !c.off)
      return {
        ...r,
        orden: inicio.orden,
        ritmo: inicio.ritmo.map((c) => `${c.t}${c.on ? '*' : ''}${c.off ? '(off)' : ''}`).join(' | '),
        entrada: { inicio: ver(inicio), conLlena: ver(conLlena), subida: ver(subida) },
        ok: r.chipsJug === 4 && r.chipsApu === 7 && r.apagados === 4
          && r.modoPrivada === 'true' && r.cta === 'Crear mesa privada'
          && !r.avisoOn && !r.recuerdoOn
          && inicio.orden && ritmoOk
          && ver(inicio) === '1.500 HC* | 5.000 HC'
          && ver(conLlena) === '1.500 HC | 5.000 HC*'
          && ver(subida) === '3.000 HC* | 10.000 HC(off)',
      }
    }

    case 'armar-aviso': {
      // 200 HC: 15 × 200 = 3.000 > 2.500 de bono, así que el aviso se enciende
      // y nombra las apuestas que un invitado nuevo SÍ alcanza. Las cifras salen
      // de `salas.js`, no del texto. ECO-1b (B4) re-sella: era la mesa de 500
      // con un bono de 1.200 y alcance «100 o 200». MES-PvP 7b: era la de 1.000
      // con la regla de 5× («100, 200 o 500»); con 15× el saldo del bypass
      // (5.000) no alcanza 1.000, así que el estado sube a 200 (STOP-L).
      const r = await page.evaluate(() => {
        const aviso = document.querySelector('[data-accion="aviso-nuevos"]')
        return {
          on: aviso?.classList.contains('is-on') ?? false,
          texto: aviso?.textContent?.trim() ?? '',
          // O1 · reserva DOS líneas: encenderlo no empuja los modos ni el CTA.
          alto: aviso?.getBoundingClientRect().height ?? 0,
        }
      })
      return {
        ...r,
        ok: r.on && r.texto.includes('2.500') && r.texto.includes('Con 200 HC')
          && r.texto.includes('usa 50 o 100 HC') && !r.texto.includes('⟦'),
      }
    }

    case 'armar-unirme': {
      // La combinación 4×200 existe abierta, así que «Abrir mesa» ya nació como
      // «Unirme a esa mesa» con su nota. Y al cambiar a Privada, el CTA vuelve a
      // «Crear mesa privada» y aparece el recordatorio suave — que es la mitad
      // que la ficha describía y la lámina no.
      // MES-PvP 7b (P-2) · con «Unirme» la fila Ritmo se ve APAGADA y sin chip
      // marcado: el ritmo lo eligió quien la armó. Con Privada vuelve, en Normal.
      const leer = () => page.evaluate(() => ({
        cta: document.querySelector('[data-accion="cta"]')?.textContent?.trim() ?? '',
        nota: document.querySelector('[data-accion="cta-nota"]')?.textContent?.trim() ?? '',
        recuerdo: document.querySelector('[data-accion="recuerdo"]')?.textContent?.trim() ?? '',
        recuerdoOn: document.querySelector('[data-accion="recuerdo"]')?.classList.contains('is-on'),
        ritmo: [...document.querySelectorAll('[data-accion="ritmo"]')]
          .map((b) => `${b.textContent.trim()}${b.getAttribute('aria-pressed') === 'true' ? '*' : ''}${b.disabled ? '(off)' : ''}`)
          .join(' | '),
      }))
      const antes = await leer()
      await page.click('[data-accion="modo-privada"]')
      await page.waitForTimeout(150)
      const despues = await leer()
      return {
        antes,
        despues,
        ok: antes.cta === 'Unirme a esa mesa'
          && antes.nota.includes('3/4') && !antes.nota.includes('⟦')
          && antes.recuerdoOn === false
          && despues.cta === 'Crear mesa privada'
          && despues.recuerdoOn === true
          && despues.recuerdo.includes('200') && !despues.recuerdo.includes('⟦')
          && antes.ritmo === 'Normal(off) | Rápido(off)'
          && despues.ritmo === 'Normal* | Rápido',
      }
    }

    case 'espera-anfitrion':
    case 'espera-invitado':
    case 'espera-abierta':
    case 'espera-llena':
    case 'espera-fin-cancelada':
    case 'espera-fin-vencida':
    case 'espera-fin-activa':
    case 'espera-nombres':
      return medirEspera(page, estado.id)

    case 'espera-fantasma': {
      // ── A2 §3 · LA PRUEBA NEGATIVA ────────────────────────────────────────
      // El fixture pide el stub y trae, como `mi_sala()`, la fila de nulos de
      // PostgREST. La guarda del último metro de `App` (`esMesa`) tiene que
      // rechazarla: nada del stub en el DOM, la pantalla de opciones en su
      // lugar, y ni un `⟦` —que es exactamente lo que los teléfonos vieron
      // («Mesa de ⟦n⟧ · 0 HC · La mesa arrancó»).
      const r = await page.evaluate(() => ({
        stub: !!document.querySelector('[data-accion="sentados"], [data-accion="arranco"], [data-accion="codigo-sala"]'),
        opciones: !!document.querySelector('[data-accion="codigo"]') && !!document.querySelector('[data-accion="armar"]'),
        titulo: document.querySelector('.sal-cab h1')?.textContent?.trim() ?? '',
        rotos: (document.querySelector('main.sal')?.innerText.match(/⟦[^⟧]*⟧/g) ?? []).length,
      }))
      return {
        ...r,
        ok: !r.stub && r.opciones && r.titulo === 'Jugar contra jugadores' && r.rotos === 0,
      }
    }

    default:
      return { ok: false, error: `estado sin punto propio: ${estado.id}` }
  }
}

// ── SAL-B2 F1b · La sala de espera: lo que la lámina enseña en cada estado ──
// Rector §8.3. Un verde mide lo que dice: cada punto lleva el nombre de lo que
// mide, y el veredicto del estado es la conjunción. Los textos esperados son
// los del `DICC` de la lámina v1.5, tal como `textos.es.js` los trae.
const ESPERA = {
  'espera-anfitrion':     { sillas: 4, ocupadas: 2, iniciales: ['D', 'M'], tagAnf: 0, tagTu: 0, accion: 'cta', cta: 'Jugar ya', ctaVivo: true, privada: true },
  'espera-invitado':      { sillas: 4, ocupadas: 2, iniciales: ['C', 'D'], tagAnf: 0, tagTu: 1, accion: 'espera', espera: 'Esperando al anfitrión…', privada: true },
  'espera-abierta':       { sillas: 4, ocupadas: 2, iniciales: ['D', 'M'], tagAnf: 0, tagTu: 0, accion: 'cta', cta: 'Jugar ya', ctaVivo: true, privada: false },
  'espera-llena':         { sillas: 5, ocupadas: 5, iniciales: ['D', 'M', 'J', 'A', 'L'], tagAnf: 0, tagTu: 0, accion: 'espera', espera: '¡Mesa completa! Arranca sola', privada: true, llena: true },
  'espera-fin-cancelada': { sillas: 4, ocupadas: 2, iniciales: ['C', 'D'], tagAnf: 0, tagTu: 1, accion: 'cta', cta: 'Buscar otra mesa', ctaVivo: true, privada: true, fin: 'cancelada', finTexto: 'El anfitrión cerró la mesa' },
  'espera-fin-vencida':   { sillas: 4, ocupadas: 1, iniciales: ['D'], tagAnf: 0, tagTu: 0, accion: 'cta', cta: 'Buscar otra mesa', ctaVivo: true, privada: true, fin: 'vencida', finTexto: 'La mesa se cerró: no llegó gente a tiempo' },
  'espera-fin-activa':    { sillas: 4, ocupadas: 2, iniciales: ['D', 'M'], tagAnf: 0, tagTu: 0, accion: 'cta', cta: 'Entrar a la mesa', ctaVivo: true, privada: true, fin: 'activa', finTexto: '¡Arranca la partida!' },
  'espera-nombres':       { sillas: 5, ocupadas: 3, iniciales: ['D', 'M', 'C'], tagAnf: 0, tagTu: 0, accion: 'cta', cta: 'Jugar ya', ctaVivo: true, privada: true },
}

// La foto de la pantalla que los siete puntos comparten. Se lee en una sola
// evaluación para que los números sean del mismo fotograma.
const LEER_ESPERA = () => {
  const q = (s) => document.querySelector(s)
  const sillas = [...document.querySelectorAll('[data-accion="silla"]')]
  const cuerpo = q('[data-accion="espera-cuerpo"]')
  const columna = cuerpo?.getBoundingClientRect()
  const cajaCodigo = q('[data-accion="codigo-caja"]')?.getBoundingClientRect()
  const cajaConsejo = q('[data-accion="consejo"]')?.getBoundingClientRect()
  const reloj = q('[data-accion="reloj"]')
  const estado = q('[data-accion="estado"]')
  const mazo = q('[data-accion="mazo"]')
  const accion = q('[data-accion="accion"]')
  const salir = q('[data-accion="salir"]')
  const cta = q('[data-accion="cta"]')
  const espera = q('[data-accion="espera"]')
  const caja = (cta ?? espera)?.getBoundingClientRect()
  const zonaCuerpo = cuerpo?.getBoundingClientRect()
  const codigo = q('[data-accion="codigo-caja"]')
  const compartir = q('[data-accion="compartir"]')
  const u = window.__tokenPx('--u').h
  const ctaH = window.__tokenPx('--cta-h').h
  return {
    sillas: {
      total: sillas.length,
      ocupadas: sillas.filter((s) => !s.classList.contains('is-vacia')).length,
      iniciales: sillas.filter((s) => !s.classList.contains('is-vacia')).map((s) => s.querySelector('.sal-esp-ini')?.textContent ?? ''),
      tags: sillas.map((s) => s.querySelector('.sal-esp-tag')?.textContent?.trim() ?? ''),
      llegan: sillas.filter((s) => s.classList.contains('is-llega')).map((s) => Number(s.dataset.asiento)),
      // Ajustes · la silla vacía dice «Libre» (lámina v1.6) y NO se trunca: a
      // 360px «Esperando…» se leía «Esperand…» y ese fue el motivo del cambio,
      // así que lo que se mide es que la palabra QUEPA, no sólo que esté.
      vacias: sillas.filter((s) => s.classList.contains('is-vacia'))
        .map((s) => s.querySelector('.sal-esp-n')?.textContent?.trim() ?? ''),
      vaciasCaben: sillas.filter((s) => s.classList.contains('is-vacia')).every((s) => {
        const n = s.querySelector('.sal-esp-n')
        return !!n && n.scrollWidth <= n.clientWidth + 1
      }),
      // El anillo de la lámina saca las sillas unos píxeles de la caja de la
      // mesa a propósito (el bloque de la silla es más ancho que su aire). Lo
      // que se promete es que ninguna se salga de la columna ni pise la caja
      // del código por arriba o el consejo por abajo.
      dentro: !!columna && !!cajaCodigo && !!cajaConsejo && sillas.every((s) => {
        const b = s.getBoundingClientRect()
        return b.left >= columna.left - 1 && b.right <= columna.right + 1
          && b.top >= cajaCodigo.bottom - 1 && b.bottom <= cajaConsejo.top + 1
      }),
    },
    reloj: {
      texto: reloj?.textContent?.trim() ?? '',
      urge: reloj?.classList.contains('is-urge') ?? false,
      llena: reloj?.classList.contains('is-llena') ?? false,
      oculto: !!reloj && getComputedStyle(reloj).display === 'none',
      estadoOculto: !!estado && getComputedStyle(estado).display === 'none',
      estadoTexto: estado?.textContent?.trim() ?? '',
    },
    // MES-PvP 7b · LA ZONA ANCLADA. Desde la 7b la acción es la zona del pie
    // (IOS-1 1e): el CTA o la caja punteada, su nota y «Salir de la mesa», que
    // vive DENTRO de ella (debajo; a la izquierda del botón en el apaisado de
    // ≤ 520). Se mide que la caja mida `--cta-h` y quede entera en pantalla, que
    // la zona toque el pie del cuerpo y que «Salir» esté en su sitio. Que la
    // zona mida lo MISMO en todas las variantes (O1) se compara entre estados,
    // al final de la corrida (`compararZonas`).
    accion: {
      alto: accion?.getBoundingClientRect().height ?? 0,
      cajaAlto: caja?.height ?? 0,
      ctaH,
      entera: !!caja && caja.top >= -1 && caja.bottom <= innerHeight + 1,
      alPie: !!accion && !!zonaCuerpo && Math.abs(accion.getBoundingClientRect().bottom
        - (zonaCuerpo.bottom - (parseFloat(getComputedStyle(cuerpo).paddingBottom) || 0))) <= 1.5,
      salirDentro: !!accion && !!salir && accion.contains(salir),
      salirSitio: !!caja && !!salir && (() => {
        const b = salir.getBoundingClientRect()
        return b.top >= caja.bottom - 1 || b.right <= caja.left + 1
      })(),
      cta: cta?.textContent?.trim() ?? null,
      ctaVivo: !!cta && !cta.disabled,
      espera: espera?.textContent?.trim() ?? null,
    },
    salir: {
      hay: !!salir,
      alto: salir?.getBoundingClientRect().height ?? 0,
      minimo: Math.max(40, 9 * u),
      texto: salir?.textContent?.trim() ?? '',
      cabe: !!salir && salir.scrollWidth <= salir.clientWidth + 1,
      visible: !!salir && getComputedStyle(salir).visibility === 'visible',
    },
    codigo: {
      alto: codigo?.getBoundingClientRect().height ?? 0,
      // La caja: etiqueta (2.9u a 1.2) + 0.8u + la fila del código, que mide
      // lo que su botón de copiar (`--ico-caja`) + relleno 4.4u + el borde de
      // 1px arriba y abajo; supera el mínimo de 15u. Y la MISMA en abierta,
      // porque la etiqueta y la fila reservan su alto sin botón (O1).
      esperado: Math.max(15 * u + 2, 2.9 * 1.2 * u + 0.8 * u + window.__tokenPx('--ico-caja').h + 4.4 * u + 2),
      texto: q('[data-accion="codigo-sala"]')?.textContent?.trim() ?? '',
      copiar: !!q('[data-accion="copiar"]'),
      globo: !!codigo?.querySelector('.lob-ico-globo'),
      compartirVisible: !!compartir && getComputedStyle(compartir).visibility === 'visible',
    },
    fin: {
      clases: cuerpo ? [...cuerpo.classList].filter((c) => c.startsWith('is-fin')) : [],
      texto: q('[data-accion="fin"]')?.textContent?.trim() ?? '',
      mazoOculto: !!mazo && getComputedStyle(mazo).visibility === 'hidden',
    },
    toast: q('.sal-toast')?.classList.contains('is-on') ? q('.sal-toast').textContent.trim() : '',
    sub: q('[data-accion="sub"]')?.textContent?.trim() ?? '',
    rotos: (q('main.sal')?.innerText.match(/⟦[^⟧]*⟧/g) ?? []).length,
  }
}

async function medirEspera(page, id) {
  const esp = ESPERA[id]
  // Las sillas llegan con la primera medida del `ResizeObserver` y los finales
  // que el reloj decide pasan por `resolver_sala`: se espera a lo que cada
  // estado promete antes de fotografiar.
  await page.waitForSelector('[data-accion="silla"]', { timeout: 5000 })
  if (esp.fin) await page.waitForSelector(`[data-accion="espera-cuerpo"].is-fin-${esp.fin}`, { timeout: 5000 })
  await page.waitForTimeout(150)

  const f = await page.evaluate(LEER_ESPERA)
  const puntos = {}

  // MES-PvP 7a · P-4 · la silla propia dice siempre «Tú», también la del anfitrión que mira.
  const tagEsperado = (i) => (i === esp.tagTu ? 'Tú' : i === esp.tagAnf ? 'Anfitrión' : '')
  puntos['esp.sillas'] = {
    ...f.sillas,
    ok: f.sillas.total === esp.sillas && f.sillas.ocupadas === esp.ocupadas
      && f.sillas.iniciales.join('') === esp.iniciales.join('')
      && f.sillas.tags.every((tag, i) => tag === tagEsperado(i))
      && f.sillas.vacias.every((tx) => tx === 'Libre')
      && f.sillas.vaciasCaben
      && f.sillas.dentro,
  }

  const relojOk = esp.fin
    ? f.reloj.oculto && f.reloj.estadoOculto
    : /^\d+:\d\d$/.test(f.reloj.texto) && !f.reloj.urge
      && (esp.llena
        ? f.reloj.llena && f.reloj.texto <= '0:10' && f.reloj.estadoTexto === '¡Mesa completa!'
        : !f.reloj.llena && f.reloj.estadoTexto === `${esp.ocupadas}/${esp.sillas} sentados`)
  puntos['esp.reloj'] = { ...f.reloj, ok: relojOk }

  puntos['esp.accion'] = {
    ...f.accion,
    ok: Math.abs(f.accion.cajaAlto - f.accion.ctaH) <= 1.5
      && f.accion.entera && f.accion.alPie && f.accion.salirDentro && f.accion.salirSitio
      && (esp.accion === 'cta'
        ? f.accion.cta === esp.cta && f.accion.ctaVivo === esp.ctaVivo && f.accion.espera === null
        : f.accion.espera === esp.espera && f.accion.cta === null),
  }

  // ── esp.salir · el botón de la lámina v1.6, y su caja en los finales ─────
  // Existe en las dos vistas y también con la mesa llena, es tocable (40px de
  // la casa), su texto no desborda, y en los tres finales está apagado con
  // `visibility` —conservando su caja, que es lo que impide que la columna se
  // mueva al terminar la mesa—.
  puntos['esp.salir'] = {
    ...f.salir,
    ok: f.salir.hay && f.salir.alto >= f.salir.minimo - 0.5
      && f.salir.texto === 'Salir de la mesa' && f.salir.cabe
      && f.salir.visible === !esp.fin,
  }

  puntos['esp.codigo'] = {
    ...f.codigo,
    ok: Math.abs(f.codigo.alto - f.codigo.esperado) <= 1.5
      && (esp.privada
        ? f.codigo.texto.includes('AJ-7K2M') && f.codigo.copiar && f.codigo.compartirVisible && !f.codigo.globo
        : f.codigo.globo && !f.codigo.copiar && !f.codigo.compartirVisible && f.codigo.texto.includes('Mesa abierta')),
  }

  puntos['esp.fin'] = {
    ...f.fin,
    ok: esp.fin
      ? f.fin.clases.includes('is-fin') && f.fin.clases.includes(`is-fin-${esp.fin}`)
        && f.fin.texto === esp.finTexto && f.fin.mazoOculto
      : f.fin.clases.length === 0 && f.fin.texto === '' && !f.fin.mazoOculto,
  }

  // El subtítulo del invitado nombra al anfitrión por su username, que llegó
  // por la incrustación de `profiles`: es la prueba de que `asientosDe` pinta.
  puntos['esp.sub'] = {
    sub: f.sub,
    ok: esp.tagTu === 1 ? f.sub === 'Anfitrión: carlos_vzla · Privada' : f.sub.startsWith('Eres el anfitrión'),
  }

  // ── esp.realtime · sólo en `espera-anfitrion` ────────────────────────────
  // Sin backend, la única forma de medir que la pantalla RELEE al recibir: el
  // canal falso guarda los handlers y `window.__salEmitir` los dispara tras
  // mutar los datos. Tres actos: alguien se levanta (el CTA se apaga con uno
  // solo), alguien llega (silla nueva con `is-llega`, toast) y el anfitrión…
  // no: la fila pasa a 'cancelada' y la pantalla lee el final.
  if (id === 'espera-anfitrion') {
    const DEV = '00000000-0000-4000-8000-000000000000'
    const s = (asiento, jugadorId, username) => ({ asiento, jugadorId, username })
    const emitir = (args) => page.evaluate((a) => window.__salEmitir(a), args)

    await emitir({ tabla: 'sala_jugadores', evento: 'DELETE', asientos: [s(0, DEV, 'DevLocal')] })
    await page.waitForTimeout(250)
    const trasSalida = await page.evaluate(LEER_ESPERA)

    // Llega UNA persona nueva (ana_bcn) y ocupa la silla libre más baja, la 1
    // (SAL-A §10): silla con `is-llega`, toast con su nombre, recuento 2/4.
    await emitir({
      tabla: 'sala_jugadores', evento: 'INSERT',
      asientos: [s(0, DEV, 'DevLocal'), s(1, '00000000-0000-4000-8000-000000000013', 'ana_bcn')],
    })
    await page.waitForTimeout(250)
    const trasLlegada = await page.evaluate(LEER_ESPERA)

    // Y el tercer acto es el defecto E5 tal cual se vivió: la fila pasa a
    // 'cancelada' —el barrido la cerró— mientras QUIEN MIRA es el anfitrión.
    // Con la regla de los ajustes lee «no llegó gente a tiempo»; la fila dice
    // lo mismo que en `espera-fin-cancelada`, donde el invitado lee lo otro.
    await emitir({ tabla: 'salas', evento: 'UPDATE', sala: { estado: 'cancelada' } })
    await page.waitForTimeout(250)
    const trasCancelar = await page.evaluate(LEER_ESPERA)

    puntos['esp.realtime'] = {
      trasSalida: { ocupadas: trasSalida.sillas.ocupadas, ctaVivo: trasSalida.accion.ctaVivo, estado: trasSalida.reloj.estadoTexto },
      trasLlegada: { ocupadas: trasLlegada.sillas.ocupadas, llegan: trasLlegada.sillas.llegan, toast: trasLlegada.toast, estado: trasLlegada.reloj.estadoTexto },
      trasCancelar: { clases: trasCancelar.fin.clases, texto: trasCancelar.fin.texto, cta: trasCancelar.accion.cta },
      ok: trasSalida.sillas.ocupadas === 1 && !trasSalida.accion.ctaVivo && trasSalida.reloj.estadoTexto === '1/4 sentados'
        && trasLlegada.sillas.ocupadas === 2 && trasLlegada.sillas.llegan.join() === '1'
        && trasLlegada.toast === 'ana_bcn se sentó' && trasLlegada.reloj.estadoTexto === '2/4 sentados'
        && trasCancelar.fin.clases.includes('is-fin-vencida')
        && trasCancelar.fin.texto === 'La mesa se cerró: no llegó gente a tiempo'
        && trasCancelar.accion.cta === 'Buscar otra mesa' && !trasCancelar.salir.visible,
    }
  }

  if (id === 'espera-nombres') {
    // La pasada de 44 primero: el mini-perfil y el avatar son lo que podría sacar de la sala.
    puntos['esp.tactil'] = await medirTactil(page)
    puntos['esp.perfil'] = await medirPerfil(page)
  }

  puntos.rotos = f.rotos
  puntos.ok = f.rotos === 0 && Object.values(puntos).every((p) => typeof p !== 'object' || p === null || p.ok !== false)
  return puntos
}

// ── MES-PvP 7b · esp.perfil · la silla abre el mini-perfil (B.2) ───────────
// La silla OCUPADA es un botón; la vacía no. La ajena abre su mini-perfil sin
// «Editar»; la propia, con «Editar» apagado: tocarlo cierra la tarjeta y dice
// «Disponible fuera de la mesa». El avatar de la barra, apagado con el mismo
// aviso, y la sala sigue en pantalla (el ⚙ no se toca aquí: lo mide `cfg`).
async function medirPerfil(page) {
  const AVISO = 'Disponible fuera de la mesa'
  const toast = () => page.evaluate(() => {
    const t = document.querySelector('main.sal .sal-toast')
    return t?.classList.contains('is-on') ? t.textContent.trim() : ''
  })
  const sillas = await page.evaluate(() => [...document.querySelectorAll('[data-accion="silla"]')]
    .map((s) => `${s.tagName === 'BUTTON' ? 'B' : 'd'}${s.classList.contains('is-vacia') ? '-' : '+'}`).join(''))
  const tarjeta = () => page.evaluate(() => {
    const v = document.querySelector('.mp-velo')
    return v ? { texto: v.querySelector('.mp-tarjeta')?.textContent ?? '', editar: !!v.querySelector('[data-accion="mp-editar"]') } : null
  })
  // El avatar primero, y se espera a que su aviso se apague (2,6 s): «Editar»
  // dice lo mismo y, con el aviso aún encendido, no se distinguiría quién habló.
  await page.click('main.sal .lob-perfil')
  await page.waitForTimeout(150)
  const avatar = { toast: await toast(), sigueEnSala: await page.evaluate(() => !!document.querySelector('main.sal.es-espera')) }
  // Si el avatar sacó de la sala, lo demás no se puede medir: rojo, sin caerse.
  if (!avatar.sigueEnSala) return { avatar, ok: false }
  await page.waitForFunction(() => !document.querySelector('main.sal .sal-toast')?.classList.contains('is-on'), null, { timeout: 5000 })
  await page.click('[data-accion="silla"][data-asiento="1"]')
  await page.waitForSelector('.mp-velo', { timeout: 3000 }).catch(() => {})
  const ajena = await tarjeta()
  await page.keyboard.press('Escape')
  await page.waitForTimeout(150)
  const cerradaAjena = (await tarjeta()) === null
  await page.click('[data-accion="silla"][data-asiento="0"]')
  await page.waitForSelector('.mp-velo', { timeout: 3000 }).catch(() => {})
  const propia = await tarjeta()
  if (propia?.editar) await page.click('[data-accion="mp-editar"]')
  await page.waitForTimeout(150)
  const trasEditar = { abierta: (await tarjeta()) !== null, toast: await toast() }
  await page.mouse.move(2, 2)
  return {
    sillas,
    ajena,
    cerradaAjena,
    propia,
    trasEditar,
    avatar,
    ok: sillas === 'B+B+B+d-d-'
      && !!ajena && ajena.texto.includes('MaracuchaBrava_') && !ajena.editar && cerradaAjena
      && !!propia && propia.editar && !trasEditar.abierta && trasEditar.toast === AVISO
      && avatar.toast === AVISO && avatar.sigueEnSala,
  }
}

// ── MES-PvP 7b · esp.tactil · la pasada de 44, MEDIDA (B.3) ────────────────
// La zona que el dedo alcanza de verdad: desde el centro de cada botón, el
// punto más lejano que `elementFromPoint` aún le atribuye, empezando 1 px fuera
// de su caja. Copiar, compartir, «Salir», los dos botones del diálogo
// «Cancelar» y la silla tienen que llegar a 44 × 44; los del diálogo se miden
// con él abierto y los demás con él cerrado (su velo los tapa). Flecha, casa y
// barra se apuntan sin veredicto: son de la carcasa y no de esta tanda.
const LEER_ZONAS = (sels) => {
  const out = {}
  for (const [n, s] of Object.entries(sels)) {
    const el = document.querySelector(s)
    if (!el) { out[n] = null; continue }
    const b = el.getBoundingClientRect()
    const cx = b.x + b.width / 2
    const cy = b.y + b.height / 2
    const alcance = (dx, dy) => {
      let k = 1
      for (; k <= 40; k++) {
        const e = document.elementFromPoint(cx + dx * (b.width / 2 - 0.5 + k), cy + dy * (b.height / 2 - 0.5 + k))
        if (!e || !(e === el || el.contains(e))) break
      }
      return k - 1
    }
    out[n] = { w: b.width + alcance(-1, 0) + alcance(1, 0), h: b.height + alcance(0, -1) + alcance(0, 1) }
  }
  return out
}
async function medirTactil(page) {
  const fuera = await page.evaluate(LEER_ZONAS, {
    copiar: '[data-accion="copiar"]',
    compartir: '[data-accion="compartir"]',
    salir: '[data-accion="salir"]',
    silla: '[data-accion="silla"][data-asiento="1"]',
    volver: '[data-accion="volver"]',
    casa: '[data-accion="casa"]',
    avatar: 'main.sal .lob-perfil',
    ajustes: 'main.sal .lob-ajustes',
  })
  await page.click('[data-accion="salir"]')
  await page.waitForTimeout(400)
  const dialogo = await page.evaluate(LEER_ZONAS, {
    'cancelar-no': '[data-accion="cancelar-no"]',
    'cancelar-si': '[data-accion="cancelar-si"]',
  })
  await page.click('[data-accion="cancelar-no"]')
  await page.waitForTimeout(400)
  await page.mouse.move(2, 2)
  const zonas = { ...fuera, ...dialogo }
  const exigidas = ['copiar', 'compartir', 'salir', 'silla', 'cancelar-no', 'cancelar-si']
  const cortas = exigidas.filter((n) => !zonas[n] || zonas[n].w < 44 - 0.5 || zonas[n].h < 44 - 0.5)
  return { zonas, cortas, ok: cortas.length === 0 }
}

// ── MES-PvP 7b · O1 · la zona del pie mide lo mismo en todas las variantes ──
// Por viewport: CTA vivo, caja punteada, final y mesa llena, con o sin
// nombres largos. Una celda cuya zona se separe de la del resto en más de
// 1,5 px pasa a rojo con el punto `esp.accion` y el motivo.
function compararZonas(celdas) {
  const porVp = {}
  for (const c of celdas) {
    const a = c['sal.6']?.['esp.accion']
    if (a && typeof a.alto === 'number') (porVp[c.vp] ??= []).push([c, a])
  }
  for (const lista of Object.values(porVp)) {
    const altos = lista.map(([, a]) => a.alto).sort((x, y) => x - y)
    const mediana = altos[Math.floor(altos.length / 2)]
    for (const [c, a] of lista) {
      a.altoComun = mediana
      if (Math.abs(a.alto - mediana) > 1.5) {
        a.ok = false
        a.o1 = `la zona mide ${round(a.alto)} y la del resto ${round(mediana)}`
        c['sal.6'].ok = false
        c.ok = false
      }
    }
  }
}

// ── sal.0 · las dos listas de estados no se han separado ────────────────────
// El arnés declara los once nombres por su cuenta (no puede importar un módulo
// que usa `import.meta.env` desde Node). Este punto lee el archivo de fixtures
// como TEXTO y comprueba que declara los mismos once. Es barato y cierra el
// único agujero que abre la duplicación.
function comprobarListas() {
  const fuente = readFileSync(new URL('../src/dev/salasFixtures.js', import.meta.url), 'utf8')
  const bloque = fuente.match(/ESTADOS_SAL\s*=\s*\[([^\]]*)\]/)?.[1] ?? ''
  const enFixtures = [...bloque.matchAll(/'([a-z0-9-]+)'/g)].map((m) => m[1])
  const enArnes = ESTADOS.map((e) => e.id)
  const faltan = enArnes.filter((e) => !enFixtures.includes(e))
  const sobran = enFixtures.filter((e) => !enArnes.includes(e))
  return { enFixtures, enArnes, faltan, sobran, ok: faltan.length === 0 && sobran.length === 0 }
}

// ═══════════════════════════════════════════════════════════════════════════
let NAV
try {
  await servidorArnes({ tipo: 'dev', puerto: OPC.puerto || 5173, bypass: true, externo: EXTERNO, base: EXTERNO ? BASE : null })
  NAV = await navegadorArnes()
} catch (e) {
  await fallarInstrumento(e)
}
const browser = NAV.browser
const chromiumVivo = browser.version()

const report = {
  mode: MODE,
  ts: new Date().toISOString(),
  base: BASE,
  arnes: { tanda: 'SAL-B2', playwrightCore: PW_VERSION, chromium: chromiumVivo },
}

try {
  report['sal.0'] = comprobarListas()
  if (!report['sal.0'].ok) {
    console.log('⚠ sal.0 · el arnés y los fixtures declaran estados distintos:', report['sal.0'])
  }

  const objetivo = SOLO ? ESTADOS.filter((e) => e.id === SOLO) : ESTADOS
  if (objetivo.length === 0) {
    throw new Error(`estado desconocido: ${SOLO}. Los ${ESTADOS.length} son: ${ESTADOS.map((e) => e.id).join(', ')}`)
  }

  const celdas = []
  for (const estado of objetivo) {
    for (const vp of VIEWPORTS) {
      celdas.push(await medirCelda(browser, estado, vp))
    }
  }
  compararZonas(celdas)
  report.celdas = celdas
  report.ok = report['sal.0'].ok && celdas.every((c) => c.ok)

  // ── El resumen legible ─────────────────────────────────────────────────
  // Una línea por celda, con los puntos que fallan nombrados. Un arnés que sólo
  // dice «rojo» obliga a abrir el JSON de 3.000 líneas para saber por dónde.
  const verdes = celdas.filter((c) => c.ok).length
  console.log(`\n── sal · las salas PvP ── ${verdes}/${celdas.length} celdas`)
  let estadoActual = null
  for (const c of celdas) {
    if (c.estado !== estadoActual) {
      estadoActual = c.estado
      const e = ESTADOS.find((x) => x.id === estadoActual)
      console.log(`\n  ${estadoActual} · ${e.nota}`)
    }
    const fallos = PUNTOS.filter((k) => !c[k].ok)
    console.log(
      `    ${c.ok ? 'OK  ' : 'FALLA'} ${c.vp} (${c.note})`
      + (fallos.length ? ' · ' + fallos.join(', ') : '')
      + (c.consola.length ? ' · consola: ' + c.consola[0] : '')
    )
  }
} catch (e) {
  report.error = String((e && e.stack) || e)
  console.log('\n⚠ el arnés se cayó:', report.error)
}

await browser.close()

report.commit = commitDelArbol()   // ARN-4d · de qué commit es este veredicto
const json = JSON.stringify(report, (k, v) => (typeof v === 'number' ? round(v) : v), 2)
try {
  mkdirSync(OUT_DIR, { recursive: true })
  writeFileSync(`${OUT_DIR}/diag_${MODE}${SOLO ? `_${SOLO}` : ''}.json`, json)
} catch { /* el veredicto ya salió por consola */ }

// ARN-3a · D5 · el arnés que se cae (estado desconocido, excepción) es 2.
const codigo = report.error ? 2 : codigoDeSalida([report.ok === true ? 'verde' : 'rojo'])
console.log(`\n── diagSAL ${MODE}${SOLO ? ` ${SOLO}` : ''} · ${report.error ? 'el arnés se cayó' : report.ok ? 'verde' : 'rojo'} → código ${codigo}`)
await terminar(codigo)
