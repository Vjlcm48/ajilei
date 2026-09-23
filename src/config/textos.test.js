import { describe, it, expect, vi, afterEach } from 'vitest'
import {
  t,
  interpolar,
  clavesDe,
  idiomaValido,
  IDIOMA_POR_DEFECTO,
  IDIOMAS_DISPONIBLES,
  CLAVE_IDIOMA_STORAGE,
} from './textos.js'
import { TEXTOS_ES } from './textos.es.js'

// ── IDI-0 · Contrato del diccionario ────────────────────────────────────────
// Documento rector: AJILEI_LOB1_Fase1_v1.1.md §2.4.
//
// Corre en Node pelado, sin jsdom (que este proyecto NO tiene — hallazgo de
// FRZ-1): por eso el test importa `textos.js` y `textos.es.js`, que no tocan el
// DOM, y jamás `useIdioma.js`, que sí.
//
// Lo que este archivo defiende no es "que las cadenas estén bien escritas" —eso
// lo mira Victor—: es que la FORMA del diccionario aguante el día que haya un
// segundo idioma. Cada aserción existe contra un modo concreto de romperlo.

describe('IDI-0 · diccionario es', () => {
  it('toda clave devuelve una cadena no vacía y sin huecos sin llenar', () => {
    // SAL-B1 · Este test cambia de forma porque el diccionario cambió de forma.
    // Hasta esta sub-tanda ninguna clave llevaba variables, así que bastaba con
    // `t(clave, {})`; ahora doce las llevan, y pedirlas sin vars produce `⟦hc⟧`
    // legítimamente —es el aviso de falta que IDI-0 diseñó, no un defecto—.
    //
    // Lo que se comprueba ahora es MÁS fuerte que antes: se leen los nombres de
    // los huecos del propio valor, se rellenan todos, y se exige que no quede ni
    // un `⟦` en el resultado. Así una clave con un hueco mal escrito —`{ hc }`,
    // `{HC}`— que el patrón no reconozca sale aquí, y no en pantalla.
    const claves = clavesDe('es')
    expect(claves.length).toBeGreaterThan(0)
    for (const clave of claves) {
      const crudo = TEXTOS_ES[clave]
      const vars = {}
      for (const [, nombre] of crudo.matchAll(/\{([a-z0-9_]+)\}/g)) vars[nombre] = 'X'
      const valor = t(clave, vars, 'es')
      expect(typeof valor).toBe('string')
      expect(valor.length).toBeGreaterThan(0)
      // …y no queda ningún marcador de fallo disfrazado de texto.
      expect(valor).not.toContain('⟦')
    }
  })

  it('ninguna clave lleva espacios ni mayúsculas', () => {
    // Las claves son el CONTRATO y viajan a `data-i18n`, a los tests y a los
    // diccionarios hermanos. Una mayúscula o un espacio cuelan una clave que se
    // escribe de dos maneras y sólo funciona en una.
    //
    // SAL-B1 · El guion bajo entra en el último segmento, y SÓLO por una razón:
    // las nueve claves `sal.error.*` son el nombre EXACTO que la migración lanza
    // en su `raise exception` (`sala_llena`, `no_eres_anfitrion`). `claveDeError`
    // las compone concatenando el prefijo, así que renombrarlas a `sala-llena`
    // obligaría a una tabla de traducción entre dos nombres de la misma cosa —y
    // ésa es exactamente la clase de tabla que se desincroniza en silencio.
    for (const clave of clavesDe('es')) {
      expect(clave).toBe(clave.toLowerCase())
      expect(clave).not.toMatch(/\s/)
      expect(clave).toMatch(/^[a-z0-9]+(\.[a-z0-9_]+)+$/)
    }
  })

  it('toda clave vive bajo uno de los prefijos declarados', () => {
    // IDI-0 dejó escrito que el prefijo «permitirá que otra campaña añada
    // `mesa.*` sin pisar nada». SAL-B1 es esa otra campaña, y añade `sal.*`.
    //
    // La lista es una PUERTA, no un inventario: se amplía a propósito cuando una
    // tanda trae una superficie nueva, y así una clave suelta sin prefijo —o con
    // uno inventado a medias— sigue cayendo aquí.
    //
    // APU-1 1e es la tercera campaña que llama: `ia.*` cubre «Retar a las IAS» y
    // la mesa contra máquinas. Es el prefijo que IDI-0 llamaba `mesa.*` cuando
    // escribió la frase de arriba; se nombra por CONTRA QUIÉN se juega y no por
    // dónde se pinta, porque el mismo copy sirve a la pantalla de entrada y a la
    // mesa, y `mesa.` habría dejado fuera a la primera.
    const PREFIJOS = ['lob.', 'sal.', 'ia.']
    for (const clave of clavesDe('es')) {
      expect(PREFIJOS.some((p) => clave.startsWith(p))).toBe(true)
    }
  })

  it('no hay dos claves con el mismo texto por descuido de copia-pega', () => {
    // Cada par de esta lista está DECLARADO, y cada uno tiene su motivo. Lo que
    // el test defiende es que no aparezca un octavo sin que nadie lo piense.
    //
    //   lob.ajustes.aria = lob.cfg.titulo
    //     El rótulo de la hoja y el nombre accesible del engranaje que la abre
    //     son la misma palabra: "Configuración".
    //
    //   lob.cta.pvp = sal.opciones.titulo
    //     La pantalla se llama como el botón que la abre. Es lo que le dice al
    //     jugador que llegó donde tocaba.
    //
    //   sal.armar.titulo = sal.opciones.armar
    //     Lo mismo un piso más abajo: el CTA "Armar una mesa" abre la pantalla
    //     "Armar una mesa".
    //
    //   sal.armar.privada = sal.espera.tipo.privada
    //   sal.armar.abierta = sal.espera.tipo.abierta
    //     El rótulo con el que se ELIGE el modo y el nombre con el que se
    //     RECUERDA en la sala de espera. Separarlas permite que un idioma futuro
    //     los decline distinto —etiqueta suelta contra palabra dentro de una
    //     frase— sin tocar el código.
    //
    //   sal.espera.sentados = sal.opciones.mesa.estado
    //     "{x}/{n} sentados" en la tarjeta del listado y en la sala de espera.
    //     Son dos pantallas de dos sub-tandas: B2 reescribe la segunda entera y
    //     probablemente le añada el cronómetro, y entonces dejarán de coincidir.
    //
    //   sal.casa.aria = sal.partida.volver
    //     El nombre accesible de la casa y el rótulo del botón del stub de
    //     partida, que hace lo mismo cuando la mesa ya arrancó. (Hasta los
    //     ajustes de B2 el par era `sal.casa.aria = sal.espera.lobby`, con
    //     `lobby` de primera; retirada esa clave, el par lo cierra el stub.)
    const vistos = new Map()
    const repetidos = []
    for (const [clave, valor] of Object.entries(TEXTOS_ES)) {
      if (vistos.has(valor)) repetidos.push([vistos.get(valor), clave].sort().join(' = '))
      else vistos.set(valor, clave)
    }
    //
    //   sal.espera.fin.entrar.nota = sal.partida.pronto  (SAL-B2 F1b)
    //     La nota bajo «Entrar a la mesa» y el rótulo de la pantalla a la que
    //     lleva dicen lo mismo: «Partida PvP · Próximamente». Cuando MES-PvP
    //     traiga la partida, la nota desaparece y la pantalla cambia de nombre.
    //
    //   sal.espera.cod.eti = sal.opciones.codigo.aria  (SAL-B2 F1b)
    //     «Código de invitación»: el nombre accesible del campo donde se PEGA
    //     (SAL-1) y la etiqueta sobre el código que se COMPARTE (SAL-3). Un
    //     idioma futuro puede querer el sustantivo suelto en una y la frase en
    //     la otra.
    //
    //   ia.retar.apuesta   = sal.armar.apuesta     (APU-1 1e)
    //   ia.retar.jugadores = sal.armar.jugadores   (APU-1 1e)
    //     Las dos pantallas de chips preguntan lo mismo —cuántos y cuánto— y en
    //     español se dice igual. Se mantienen separadas por la misma razón que
    //     el par `sal.armar.privada = sal.espera.tipo.privada`: son dos
    //     superficies de dos campañas distintas, y la de vs-IA todavía puede
    //     querer decir «Apuesta por mano» sin arrastrar a la del PvP. Lo que NO
    //     se duplica es el rótulo de los tres retos: ése vive en `niveles.js`.
    //
    //   ia.recarga.opcion.piso  = ia.retar.entrada.piso   (APU-1 1e-ii)
    //   ia.recarga.opcion.medio = ia.retar.entrada.medio  (APU-1 1e-ii)
    //     «Mínimo {hc}» y «Medio {hc}» dicen lo mismo en las dos superficies, y
    //     eso NO es casualidad: §5.2 del normativo dice que la recarga «se elige
    //     como una entrada», y son literalmente las mismas dos cifras de
    //     `entrada.js` —piso 10× y medio 20× desde 1f-A4—. Quien aprendió a sentarse sabe
    //     leer esto sin aprender nada nuevo.
    //     Se duplican en vez de compartir clave porque son de dos pantallas
    //     distintas: `ia.retar.*` es la pantalla previa y `ia.recarga.*` la
    //     mesa, y un idioma que abrevie en el modal no tiene por qué abreviar en
    //     la pantalla ancha. El TERCERO no se duplica y ahí se ve el motivo: en
    //     la entrada «Techo» es una cifra fija de la mesa, y en la recarga es lo
    //     que FALTA para llenarla, así que dice «Al techo».
    expect(repetidos.sort()).toEqual([
      'ia.recarga.opcion.medio = ia.retar.entrada.medio',
      'ia.recarga.opcion.piso = ia.retar.entrada.piso',
      'ia.retar.apuesta = sal.armar.apuesta',
      'ia.retar.jugadores = sal.armar.jugadores',
      'lob.ajustes.aria = lob.cfg.titulo',
      'lob.cta.pvp = sal.opciones.titulo',
      'sal.armar.abierta = sal.espera.tipo.abierta',
      'sal.armar.privada = sal.espera.tipo.privada',
      'sal.armar.titulo = sal.opciones.armar',
      'sal.casa.aria = sal.partida.volver',
      'sal.espera.cod.eti = sal.opciones.codigo.aria',
      'sal.espera.fin.entrar.nota = sal.partida.pronto',
      'sal.espera.sentados = sal.opciones.mesa.estado',
    ])
  })

  // ── APU-1 1f-A4 · LA PROMESA DE §5.3, EN UNA SOLA VOZ ───────────────────
  // Vivía en `ia.recarga.nivelado`, un renglón aparte bajo los montos. En el
  // teléfono no cabía y se retiraba por CSS (1f-A2), así que la promesa se
  // callaba justo donde va a jugar casi todo el mundo; en escritorio sí se
  // pintaba, y desde 1f-A3 —que la metió en los subtítulos— repetía la misma
  // frase dos renglones más abajo (E-31). La clave se retira y la promesa se
  // dice una vez, en el subtítulo, que siempre se pinta.
  //
  // Esta prueba sella las dos mitades de esa decisión, porque son la misma: si
  // alguien devuelve la clave, o si alguien recorta el subtítulo y se lleva la
  // promesa por delante, aquí se entera.
  it('la promesa de §5.3 la dicen los dos subtítulos blandos, y nadie más', () => {
    expect(TEXTOS_ES['ia.recarga.nivelado']).toBeUndefined()
    expect(TEXTOS_ES['ia.recarga.sub.automatica']).toContain('Las IAS se nivelan contigo.')
    expect(TEXTOS_ES['ia.recarga.sub.voluntaria']).toContain('Las IAS se nivelan contigo.')
    // La forzosa NO la lleva, y es deliberado: ahí no hay nivelación que
    // prometer — o se recarga o se sale de la mesa (§5.4).
    expect(TEXTOS_ES['ia.recarga.sub.forzosa']).not.toContain('nivelan')
    // Y nadie más la dice: una sola voz en todas las pantallas.
    const dicen = Object.keys(TEXTOS_ES).filter((k) => /se nivelan/.test(TEXTOS_ES[k]))
    expect(dicen.sort()).toEqual(['ia.recarga.sub.automatica', 'ia.recarga.sub.voluntaria'])
  })
})

describe('IDI-0 · fallback', () => {
  afterEach(() => { vi.restoreAllMocks() })

  it('una clave inexistente devuelve ⟦clave⟧, nunca cadena vacía', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    expect(t('lob.no.existe')).toBe('⟦lob.no.existe⟧')
  })

  it('avisa UNA sola vez por clave', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    // Clave nueva en cada corrida del archivo: el guardia `AVISADAS` es de
    // módulo y sobrevive entre tests, así que reusar una ya avisada mediría cero.
    const clave = 'lob.aviso.unico'
    t(clave); t(clave); t(clave)
    expect(warn).toHaveBeenCalledTimes(1)
  })

  it('un idioma sin diccionario cae al por defecto en vez de romper', () => {
    // El caso real: `localStorage` manipulado a mano con 'kl'. La misma
    // doctrina de `normalizarNivel` — basura conocida cae al valor de la casa.
    expect(t('lob.cta.ia', {}, 'kl')).toBe(TEXTOS_ES['lob.cta.ia'])
  })
})

// ── SAL-Aa · Las variables ──────────────────────────────────────────────────
// Rector: AJILEI_SALA_Fase1_v1.0.md §3. La sustitución se prueba contra
// `interpolar`, que es la mitad pura y aislable de `t`: el diccionario real no
// tiene un solo `{` (lo defiende el primer test de este bloque) y sembrarle
// claves de mentira para poder probar sería ensuciar el contrato de LOB-1.
describe('SAL-Aa · t() con variables', () => {
  afterEach(() => { vi.restoreAllMocks() })

  it('el diccionario del lobby sigue SIN un solo hueco', () => {
    // Es lo que garantiza que las 18 claves de LOB-1 pasen por la plomería nueva
    // sin cambiar un byte. Si alguien añade un `{n}` a una clave `lob.*`, este
    // test se pone rojo y obliga a revisar sus llamadas — que hoy no pasan vars.
    for (const clave of clavesDe('es')) {
      expect(t(clave)).not.toMatch(/[{}]/)
    }
  })

  it('sustituye cada hueco por su variable', () => {
    expect(interpolar('{n} de {total} jugadores', { n: 3, total: 5 }))
      .toBe('3 de 5 jugadores')
  })

  it('el mismo hueco repetido se sustituye todas las veces', () => {
    // El `replace` con expresión regular global es lo que lo permite; sin la
    // bandera `g` sólo caería el primero y nadie lo notaría hasta la primera
    // frase que repita un nombre.
    expect(interpolar('{quien} gana, {quien} reparte', { quien: 'Ana' }))
      .toBe('Ana gana, Ana reparte')
  })

  it('el cero es un valor, no una ausencia', () => {
    // El fallo clásico de `||`: «0 sentados» es una frase legítima de la sala de
    // espera y tiene que poder pintarse.
    expect(interpolar('{n} sentados', { n: 0 })).toBe('0 sentados')
  })

  it('una variable ausente pinta ⟦nombre⟧ y avisa', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    expect(interpolar('quedan {seg}s', {}, 'sal.prueba.ausente')).toBe('quedan ⟦seg⟧s')
    expect(warn).toHaveBeenCalledTimes(1)
  })

  it('null cuenta como ausente; undefined también', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    expect(interpolar('{a}|{b}', { a: null, b: undefined }, 'sal.prueba.nulos'))
      .toBe('⟦a⟧|⟦b⟧')
  })

  it('avisa UNA vez por hueco roto, no una por render', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const clave = 'sal.prueba.repetido'
    interpolar('{x}', {}, clave)
    interpolar('{x}', {}, clave)
    interpolar('{x}', {}, clave)
    expect(warn).toHaveBeenCalledTimes(1)
  })

  it('dos huecos rotos de la misma clave avisan los dos', () => {
    // El guardia marca por `clave#nombre` y no sólo por clave: si marcara por
    // clave, el segundo hueco roto quedaría mudo para siempre.
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    interpolar('{uno} y {dos}', {}, 'sal.prueba.dos')
    expect(warn).toHaveBeenCalledTimes(2)
  })

  it('una cadena sin huecos ignora las vars de más', () => {
    expect(t('lob.cta.ia', { sobra: 1, tampoco: 'nada' })).toBe(t('lob.cta.ia'))
  })

  it('toda clave SIN huecos sigue resolviendo sin pasar vars', () => {
    // La promesa de retrocompatibilidad, medida y no prometida: `Lobby.jsx`
    // llama `t(clave)` en sus 18 sitios y ninguno pasa un segundo argumento.
    //
    // SAL-B1 · El filtro es lo único que cambia. Una clave CON huecos pedida sin
    // vars devuelve `⟦hc⟧` a propósito —es el aviso de falta—, así que exigirle
    // su texto crudo sería exigir que el mecanismo de IDI-0 no funcione. Las que
    // no llevan huecos, que son la mayoría y todas las del lobby, siguen atadas
    // exactamente como estaban.
    const sinHuecos = clavesDe('es').filter((k) => !TEXTOS_ES[k].includes('{'))
    expect(sinHuecos.length).toBeGreaterThan(18)
    for (const clave of sinHuecos) {
      expect(t(clave)).toBe(TEXTOS_ES[clave])
    }
  })

  it('el fallback de clave sigue siendo el ⟦⟧ que mide lob.4', () => {
    // El punto 4 del modo `lob` del arnés busca `⟦` en el `innerText`. Ni la
    // firma nueva ni la sustitución pueden haberlo cambiado.
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    expect(t('sal.no.existe.todavia')).toBe('⟦sal.no.existe.todavia⟧')
    expect(t('sal.otra.que.no.existe', { n: 3 })).toBe('⟦sal.otra.que.no.existe⟧')
  })

  it('no interpola nada que no sea {minusculas_digitos}', () => {
    // El patrón es deliberadamente estrecho. Una llave suelta, un espacio o una
    // mayúscula dentro del hueco se quedan como literal en vez de convertirse en
    // un nombre de variable que nadie va a pasar.
    const texto = '{ n } {N} {a-b} { } literal'
    expect(interpolar(texto, { n: 1, N: 2 })).toBe(texto)
  })
})

describe('IDI-0 · constantes de la plomería', () => {
  it('el idioma por defecto tiene diccionario', () => {
    expect(IDIOMAS_DISPONIBLES).toContain(IDIOMA_POR_DEFECTO)
    expect(idiomaValido(IDIOMA_POR_DEFECTO)).toBe(true)
  })

  it('sólo `es` está disponible mientras no exista un segundo diccionario', () => {
    // Este test es un RECORDATORIO deliberado: cuando IDI-1 añada `textos.en.js`
    // esta línea saldrá roja y obligará a actualizar la lista a mano, en vez de
    // dejar un idioma medio conectado que el selector ofrece y `t` no sabe pintar.
    expect(IDIOMAS_DISPONIBLES).toEqual(['es'])
    expect(idiomaValido('en')).toBe(false)
  })

  it('la clave de almacenamiento sigue la convención ajilei.<cosa>', () => {
    expect(CLAVE_IDIOMA_STORAGE).toBe('ajilei.idioma')
  })
})
