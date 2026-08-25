/**
 * CEL-2 · El núcleo del arco de celebración.
 * Rector: lámina CEL-2.
 *
 * Lo que se sella aquí no es "el arco se ve bonito" —eso lo mide el arnés en
 * pantalla— sino las CUENTAS que sostienen sus promesas, que son tres y ninguna
 * se puede comprobar mirando:
 *   · la duración del conteo se mueve entre 1400 y 1800 según la magnitud, con
 *     las puntas planas y sin pasarse jamás;
 *   · la calma dura exactamente lo que la caída más larga (ésa es la promesa de
 *     que ninguna moneda se desvanece a media caída);
 *   · el techo de 18 monedas vivas no depende de la suerte, sale de la cadencia.
 *
 * Ejecutar: npm test
 */
import { describe, it, expect } from 'vitest'

import {
  FASES, TOC_NOMINAL_MS, ANCLA_TOPE_MS,
  CONTEO_MIN_MS, CONTEO_MAX_MS, CONTEO_PISO, CONTEO_TECHO,
  GOTAS_MAX, EMISION_MS, CAIDA_MIN_MS, CAIDA_MAX_MS, CALMA_MS, FADE_CORTE_MS,
  LADO_MIN, LADO_MAX,
  duracionConteo, magnitudConteo, esperaRevienta, perfilGota,
} from '../src/hooks/coreografiaCore.js'
import { CONTEO_MS } from '../src/hooks/sesionCore.js'
import { ESPERA_MARGEN_MS, ESPERA_TOPE_MS } from '../src/hooks/celebracionCore.js'

describe('1. El arco', () => {
  it('son cuatro tiempos y van en este orden', () => {
    expect(FASES).toEqual(['sobria', 'fiesta', 'calma', 'reposo'])
  })

  it('el mínimo del conteo ES el de VC2, no una copia suya', () => {
    // Si alguien recalibra `CONTEO_MS` en sesionCore, esta tanda le sigue.
    expect(CONTEO_MIN_MS).toBe(CONTEO_MS)
    expect(CONTEO_MIN_MS).toBe(1400)
    expect(CONTEO_MAX_MS).toBe(1800)
  })
})

describe('2. La duración del conteo', () => {
  it('las puntas son planas', () => {
    expect(duracionConteo(0)).toBe(CONTEO_MIN_MS)
    expect(duracionConteo(CONTEO_PISO)).toBe(CONTEO_MIN_MS)
    expect(duracionConteo(CONTEO_TECHO)).toBe(CONTEO_MAX_MS)
    expect(duracionConteo(999999)).toBe(CONTEO_MAX_MS)
  })

  it('crece con la magnitud, sin bajar nunca', () => {
    let previa = 0
    for (let m = 0; m <= 30000; m += 250) {
      const d = duracionConteo(m)
      expect(d).toBeGreaterThanOrEqual(previa)
      expect(Number.isInteger(d)).toBe(true)
      expect(d).toBeGreaterThanOrEqual(CONTEO_MIN_MS)
      expect(d).toBeLessThanOrEqual(CONTEO_MAX_MS)
      previa = d
    }
  })

  it('el punto medio cae donde debe', () => {
    const medio = (CONTEO_PISO + CONTEO_TECHO) / 2
    expect(duracionConteo(medio)).toBe(1600)
  })

  it('el signo no cuenta: una pérdida grande tarda lo mismo que una ganancia grande', () => {
    expect(duracionConteo(-CONTEO_TECHO)).toBe(duracionConteo(CONTEO_TECHO))
    expect(duracionConteo(-4000)).toBe(duracionConteo(4000))
  })

  it('basura entra, mínimo sale', () => {
    expect(duracionConteo(NaN)).toBe(CONTEO_MIN_MS)
    expect(duracionConteo(undefined)).toBe(CONTEO_MIN_MS)
    expect(duracionConteo(Infinity)).toBe(CONTEO_MIN_MS)
  })
})

describe('3. La magnitud de los dos contadores', () => {
  it('manda la mayor de las dos, en valor absoluto', () => {
    expect(magnitudConteo(0, 5000)).toBe(5000)
    expect(magnitudConteo(20000, 25000)).toBe(25000)
    expect(magnitudConteo(-3200, 1800)).toBe(3200)
  })

  it('el caso del molde: netas 0 y saldo 5000 lo fija el saldo', () => {
    // Con `?cel` el humano gana la mesa sin ganarle nada a nadie: las netas son
    // 0 y lo que se mira subir es el saldo. Si la magnitud saliera de las netas,
    // el conteo del molde duraría el mínimo y nadie lo notaría en pantalla.
    expect(duracionConteo(magnitudConteo(0, 5000))).toBeGreaterThan(CONTEO_MIN_MS)
  })

  it('sin cifras, cero', () => {
    expect(magnitudConteo(null, undefined)).toBe(0)
    expect(magnitudConteo(NaN, NaN)).toBe(0)
  })
})

describe('4. La espera hasta el estallido', () => {
  const howlFalso = ({ suena = true, dur = 1.896 }) => ({
    sound: { playing: () => suena, duration: () => dur },
    id: 7,
  })

  it('sin sonido que escuchar, manda el reloj nominal del toc-toc', () => {
    // Es LA diferencia con VC2, y es deliberada: allí "no hay a qué esperar"
    // significa "sal ya"; aquí significa "corre el arco visual igual". Con el
    // sonido apagado el jugador tiene que ver la misma pantalla, no una fiesta
    // que empieza antes de que la pantalla haya aparecido.
    expect(esperaRevienta(null)).toBe(TOC_NOMINAL_MS)
    expect(esperaRevienta(undefined)).toBe(TOC_NOMINAL_MS)
    expect(esperaRevienta({ mudo: true })).toBe(TOC_NOMINAL_MS)
    expect(esperaRevienta(howlFalso({ suena: false }))).toBe(TOC_NOMINAL_MS)
  })

  it('con el toc-toc sonando, la red es su duración más el margen de VC2', () => {
    expect(esperaRevienta(howlFalso({ dur: 1.896 }))).toBeCloseTo(1896 + ESPERA_MARGEN_MS, 6)
  })

  it('la red nunca se pasa del tope de VC2', () => {
    expect(esperaRevienta(howlFalso({ dur: 600 }))).toBe(ESPERA_TOPE_MS)
  })

  it('el reloj nominal es el archivo medido, no un número redondo', () => {
    // 1,896 s es lo que mide `table-knock.mp3` (arnés CEL-0). Si el archivo se
    // recorta algún día, esta cifra tiene que moverse con él.
    expect(TOC_NOMINAL_MS).toBe(1896)
    expect(ANCLA_TOPE_MS).toBeLessThan(TOC_NOMINAL_MS)
  })
})

describe('5. La lluvia', () => {
  it('la calma dura EXACTAMENTE la caída más larga', () => {
    // La promesa: ninguna moneda se desvanece a media caída, ni siquiera la que
    // nació en el último milisegundo de la fiesta. Un ms menos la rompe; un ms
    // más es pantalla muerta.
    expect(CALMA_MS).toBe(CAIDA_MAX_MS)
  })

  it('la cadencia deja entre 12 y 18 monedas vivas, que es lo que pide la lámina', () => {
    const enRegimenMin = Math.floor(CAIDA_MIN_MS / EMISION_MS)
    const enRegimenMax = Math.ceil(CAIDA_MAX_MS / EMISION_MS)
    expect(enRegimenMin).toBeGreaterThanOrEqual(12)
    expect(enRegimenMax).toBeLessThanOrEqual(GOTAS_MAX)
    expect(GOTAS_MAX).toBe(18)
  })

  it('el desvanecido del corte es el sellado', () => {
    expect(FADE_CORTE_MS).toBe(300)
  })
})

describe('6. El perfil de una moneda', () => {
  // Secuencia determinista: se barre el espacio del sorteo en vez de confiar en
  // un `Math.random` que en una corrida mala no visita las puntas.
  const secuencia = (vals) => { let i = 0; return () => vals[i++ % vals.length] }

  it('ningún valor se sale de su rango, sortee lo que sortee', () => {
    for (let k = 0; k <= 100; k++) {
      const v = k / 100
      const g = perfilGota(secuencia([v, 1 - v, v * 0.5, 1 - v * 0.5, v]))
      expect(g.izq).toBeGreaterThanOrEqual(0)
      expect(g.izq).toBeLessThanOrEqual(100)
      expect(g.lado).toBeGreaterThanOrEqual(LADO_MIN)
      expect(g.lado).toBeLessThanOrEqual(LADO_MAX)
      expect(g.caida).toBeGreaterThanOrEqual(CAIDA_MIN_MS)
      expect(g.caida).toBeLessThanOrEqual(CAIDA_MAX_MS)
      expect(Math.abs(g.giro)).toBeGreaterThanOrEqual(900)
      expect(Math.abs(g.giro)).toBeLessThanOrEqual(1600)
      expect(Math.abs(g.deriva)).toBeLessThanOrEqual(40)
      expect(g.opacidad).toBeGreaterThanOrEqual(0.55)
      expect(g.opacidad).toBeLessThanOrEqual(1)
    }
  })

  it('lo grande cae deprisa y lo pequeño despacio: eso es la profundidad', () => {
    const pequena = perfilGota(secuencia([0]))       // lado mínimo
    const grande = perfilGota(secuencia([0.999999]))  // lado máximo
    expect(pequena.lado).toBe(LADO_MIN)
    expect(grande.lado).toBe(LADO_MAX)
    expect(pequena.caida).toBe(CAIDA_MAX_MS)
    expect(grande.caida).toBe(CAIDA_MIN_MS)
    // Y las de atrás, más apagadas.
    expect(pequena.opacidad).toBeLessThan(grande.opacidad)
  })

  it('gira en los dos sentidos', () => {
    const sentidos = new Set()
    for (let k = 0; k < 40; k++) sentidos.add(Math.sign(perfilGota(secuencia([k / 40, (k * 7) % 40 / 40])).giro))
    expect(sentidos.has(1)).toBe(true)
    expect(sentidos.has(-1)).toBe(true)
  })

  it('un aleatorio roto no rompe la lluvia', () => {
    const g = perfilGota(() => NaN)
    expect(Number.isFinite(g.lado)).toBe(true)
    expect(Number.isFinite(g.caida)).toBe(true)
    expect(Number.isFinite(g.izq)).toBe(true)
  })
})
