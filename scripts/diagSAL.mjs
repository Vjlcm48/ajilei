// ═══════════════════════════════════════════════════════════════════════════
// AJILEI · diagSAL.mjs · El metro de las salas jugador contra jugador
// Rector: AJILEI_SAL-B1_Fase1_v1.0.md §8. Autoridad visual: láminas SAL-1 v1.2
// y SAL-2 v1.2.
//
//   node scripts/diagSAL.mjs sal            → los 11 estados × 6 viewports
//   node scripts/diagSAL.mjs sal <estado>   → un solo estado, para depurar
//   node scripts/diagSAL.mjs shots          → sólo capturas, sin veredicto
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
// `AJILEI_BASE` permite apuntarlo a otro puerto, misma convención que `diagDSK`:
// durante una tanda conviven el servidor de Victor y el de la medición.
//
//   AJILEI_BASE=http://localhost:5174 node scripts/diagSAL.mjs sal
//
// ── QUÉ MIDE Y QUÉ NO ──────────────────────────────────────────────────────
// Mide GEOMETRÍA y silencio: que nada desborde, que la ventanilla sean tres
// tarjetas, que los CTA lleguen al piso táctil, que los iconos midan `--ico`,
// que la consola calle y que no haya un solo `⟦`.
//
// NO mide las reglas del servidor. La regla 5×, el límite de cinco intentos por
// minuto y el índice parcial viven en SQL y se comprueban con dos teléfonos
// (§9.5). Un arnés contra fixtures que dijera «la regla 5× funciona» estaría
// midiendo los fixtures.
// ═══════════════════════════════════════════════════════════════════════════

import { chromium } from 'playwright-core'
import { writeFileSync, mkdirSync, readFileSync } from 'node:fs'

// ARN-1 · el instrumento se autoetiqueta. `playwright-core` va pineado exacto en
// devDependencies porque los píxeles cambian entre versiones; el NAVEGADOR no lo
// pina nadie —`channel: 'msedge'` es el Edge instalado en la máquina, que se
// autoactualiza— así que su versión se relee en vivo y viaja en el JSON.
const PW_VERSION = JSON.parse(
  readFileSync(new URL('../node_modules/playwright-core/package.json', import.meta.url), 'utf8')).version

const BASE = process.env.AJILEI_BASE || 'http://localhost:5173'
const OUT_DIR = 'capturas-sal'
const MODE = process.argv[2] || 'sal'
const SOLO = process.argv[3] || null

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
  { id: 'armar',                  pantalla: 'armar',    nota: 'estado base' },
  { id: 'armar-aviso',            pantalla: 'armar',    nota: 'apuesta 500 · aviso al anfitrión' },
  { id: 'armar-unirme',           pantalla: 'armar',    nota: 'combinación existente · CTA cambiado' },
  { id: 'espera-stub',            pantalla: 'espera',   nota: 'stub provisional' },
  // A2 · pantalla 'opciones' porque es donde la app DEBE quedarse: la mesa que
  // el fixture trae es la fila de nulos y el stub no puede pintarse con ella.
  { id: 'espera-fantasma',        pantalla: 'opciones', nota: 'mi_sala devuelve la fila de nulos · el stub NO se pinta' },
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
      // resta que el jugador lee es 20.000. Se comprueba el TEXTO, porque es lo
      // que el jugador ve; el cálculo ya lo sella `salasCore.test.js`.
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
          && r.l2.includes('20.000'),
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
        // Saldo 5.000 → alcanzan 100/200/500/1000; 2.000 y 5.000 no.
        apagados: [...document.querySelectorAll('[data-accion="apuesta"]')].filter((b) => b.disabled).length,
        cta: document.querySelector('[data-accion="cta"]')?.textContent?.trim() ?? '',
        avisoOn: document.querySelector('[data-accion="aviso-nuevos"]')?.classList.contains('is-on'),
        recuerdoOn: document.querySelector('[data-accion="recuerdo"]')?.classList.contains('is-on'),
        modoPrivada: document.querySelector('[data-accion="modo-privada"]')?.getAttribute('aria-pressed'),
      }))
      return {
        ...r,
        ok: r.chipsJug === 4 && r.chipsApu === 6 && r.apagados === 2
          && r.modoPrivada === 'true' && r.cta === 'Crear mesa privada'
          && !r.avisoOn && !r.recuerdoOn,
      }
    }

    case 'armar-aviso': {
      // 500 HC: 5 × 500 = 2.500 > 1.200 de bono, así que el aviso se enciende y
      // nombra las apuestas que un invitado nuevo SÍ alcanza. Las dos cifras
      // salen de `salas.js`, no del texto.
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
        ok: r.on && r.texto.includes('1.200') && r.texto.includes('500')
          && r.texto.includes('100') && r.texto.includes('200') && !r.texto.includes('⟦'),
      }
    }

    case 'armar-unirme': {
      // La combinación 4×200 existe abierta, así que «Abrir mesa» ya nació como
      // «Unirme a esa mesa» con su nota. Y al cambiar a Privada, el CTA vuelve a
      // «Crear mesa privada» y aparece el recordatorio suave — que es la mitad
      // que la ficha describía y la lámina no.
      const antes = await page.evaluate(() => ({
        cta: document.querySelector('[data-accion="cta"]')?.textContent?.trim() ?? '',
        nota: document.querySelector('[data-accion="cta-nota"]')?.textContent?.trim() ?? '',
        recuerdoOn: document.querySelector('[data-accion="recuerdo"]')?.classList.contains('is-on'),
      }))
      await page.click('[data-accion="modo-privada"]')
      await page.waitForTimeout(150)
      const despues = await page.evaluate(() => ({
        cta: document.querySelector('[data-accion="cta"]')?.textContent?.trim() ?? '',
        recuerdo: document.querySelector('[data-accion="recuerdo"]')?.textContent?.trim() ?? '',
        recuerdoOn: document.querySelector('[data-accion="recuerdo"]')?.classList.contains('is-on'),
      }))
      return {
        antes,
        despues,
        ok: antes.cta === 'Unirme a esa mesa'
          && antes.nota.includes('3/4') && !antes.nota.includes('⟦')
          && antes.recuerdoOn === false
          && despues.cta === 'Crear mesa privada'
          && despues.recuerdoOn === true
          && despues.recuerdo.includes('200') && !despues.recuerdo.includes('⟦'),
      }
    }

    case 'espera-stub': {
      const r = await page.evaluate(() => ({
        codigo: document.querySelector('[data-accion="codigo-sala"]')?.textContent?.trim() ?? '',
        sentados: document.querySelector('[data-accion="sentados"]')?.textContent?.trim() ?? '',
        provisional: document.querySelector('[data-accion="provisional"]')?.textContent?.trim() ?? '',
        actualizar: !!document.querySelector('[data-accion="actualizar"]'),
        salir: !!document.querySelector('[data-accion="salir"]'),
        // §7 · el stub NO tiene «Jugar ya». Si apareciera, alguien habría
        // adelantado B2 sin decirlo.
        sinJugarYa: !document.querySelector('[data-accion="jugar-ya"]'),
      }))
      return {
        ...r,
        ok: r.codigo.includes('AJ-7K2M') && r.sentados.includes('2/4')
          && r.provisional.length > 0 && r.actualizar && r.salir && r.sinJugarYa
          && !r.sentados.includes('⟦'),
      }
    }

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
        ok: !r.stub && r.opciones && r.titulo === 'Jugar contra jugador' && r.rotos === 0,
      }
    }

    default:
      return { ok: false, error: `estado sin punto propio: ${estado.id}` }
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
const browser = await chromium.launch({ channel: 'msedge', headless: true })
const chromiumVivo = browser.version()

const report = {
  mode: MODE,
  ts: new Date().toISOString(),
  base: BASE,
  arnes: { tanda: 'SAL-B1', playwrightCore: PW_VERSION, chromium: chromiumVivo },
}

try {
  report['sal.0'] = comprobarListas()
  if (!report['sal.0'].ok) {
    console.log('⚠ sal.0 · el arnés y los fixtures declaran estados distintos:', report['sal.0'])
  }

  const objetivo = SOLO ? ESTADOS.filter((e) => e.id === SOLO) : ESTADOS
  if (objetivo.length === 0) {
    throw new Error(`estado desconocido: ${SOLO}. Los once son: ${ESTADOS.map((e) => e.id).join(', ')}`)
  }

  const celdas = []
  for (const estado of objetivo) {
    for (const vp of VIEWPORTS) {
      celdas.push(await medirCelda(browser, estado, vp))
    }
  }
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

const json = JSON.stringify(report, (k, v) => (typeof v === 'number' ? round(v) : v), 2)
try {
  mkdirSync(OUT_DIR, { recursive: true })
  writeFileSync(`${OUT_DIR}/diag_${MODE}${SOLO ? `_${SOLO}` : ''}.json`, json)
} catch { /* el veredicto ya salió por consola */ }
