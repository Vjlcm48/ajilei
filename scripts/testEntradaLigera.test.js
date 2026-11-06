// ── PES-1 §3-G · El guardián de la entrada (INV-84) ─────────────────────────
// La entrada solo lleva lo que pinta la primera pantalla; toda pantalla nueva nace
// diferida. Generaliza `testMesaDiferida`, y mide lo que mide el empaquetador: el
// grafo de `import` estático desde `main.jsx`. Sigue también `src/dev/`, porque el
// reparto se hace antes de quitar el código muerto (Fase 1, `correoApi`).
//
// Si algo de `FUERA_DE_LA_ENTRADA` vuelve, se rompe esto y dice por qué camino. El
// `1.8b` solo diría que pesa más, y solo cuando cruzara el techo.
//
// LA EXCEPCIÓN, UNA. `dev/repartoGanador.js` (`?apu=gana`) importa `deck.js` para
// fijar el barajado en desarrollo; `siembraAPU` lo llama detrás de `DEV`, y en la
// build desaparece con él: `deck.js` no está en el sourcemap del paquete de entrada
// (informe de la Fase 1, §4). El arnés lo necesita y `deck.js` es protegido.
import { describe, it, expect } from 'vitest'
import { existsSync, readFileSync, statSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { RAIZ, sinComentarios } from './arnes/fuente.mjs'

const FUERA_DE_LA_ENTRADA = [
  // Las pantallas (§3-B).
  'src/screens/Tienda.jsx', 'src/components/Vitrina.jsx', 'src/styles/tienda.css',
  'src/screens/Perfil.jsx', 'src/components/CambiarCorreo.jsx', 'src/hooks/useCambioCorreo.js',
  'src/lib/correoApi.js', 'src/lib/correoCore.js', 'src/styles/perfil.css',
  'src/screens/Rankings.jsx', 'src/components/MiniPerfil.jsx', 'src/screens/rankingsCore.js',
  'src/styles/rankings.css', 'src/styles/miniPerfil.css',
  'src/screens/IntersticialSumaMente.jsx', 'src/styles/sumamente.css',
  'src/screens/SalaOpciones.jsx', 'src/screens/ArmarMesa.jsx', 'src/screens/SalaEspera.jsx', 'src/screens/PartidaPvP.jsx',
  'src/screens/RetarIAS.jsx',
  'src/components/CapasVideo.jsx', 'src/components/CapaVideo.jsx', 'src/components/CelebracionVideo.jsx',
  'src/components/GuardandoVideo.jsx', 'src/components/SinVideo.jsx', 'src/components/IconosVideo.jsx', 'src/styles/video.css',
  // La hoja del ⚙ (§3-C).
  'src/components/HojaContenido.jsx', 'src/components/EliminarCuenta.jsx', 'src/styles/hojaConfiguracion.css',
  // El motor y su canal (§3-A).
  'src/engine/gameEngine.js', 'src/engine/aiPlayer.js', 'src/engine/pozos.js', 'src/engine/handEvaluator.js', 'src/engine/deck.js',
  'src/lib/controlMesaIA.js', 'src/hooks/mesaIACore.js',
  // Los nombres de los lugares (§3-D).
  'src/config/paises.js', 'src/config/estados.js', 'src/lib/lugarCore.js',
  // El motor de sonido (§3-E).
  'pkg:howler',
  // La mesa (ARN-3d).
  'src/components/GameTable.jsx',
  // El árbitro (MOT-1 1b): corre en el servidor. Sus esperas no están aquí, porque
  // `config/esperas.js` lo importa la mesa, que ya es diferida.
  'src/arbitro/index.js', 'src/arbitro/partida.js', 'src/arbitro/vista.js', 'src/arbitro/sorteo.js', 'src/arbitro/reloj.js',
  'src/arbitro/ganador.js', 'src/arbitro/motivos.js', 'src/arbitro/asientos.js', 'src/arbitro/azar.js',
  // El cliente de la partida y su panel de prueba (MOT-1 1f): en `trozos.partidaPvP`.
  'src/lib/partidaCliente.js',
  // El puente de la mesa (MES-PvP 2): también en `trozos.partidaPvP`.
  'src/lib/vistaAMesa.js', 'src/hooks/vozHumanos.js', 'src/hooks/mesaPvPCore.js', 'src/hooks/useMesaPvP.js',
  'src/dev/partidaImitada.js',
  // La mesa viva (MES-PvP 3): su hoja y sus textos, en el mismo trozo.
  'src/styles/pvp.css', 'src/config/textos.pvp.es.js',
]

const MUERTO_EN_LA_BUILD = new Set(['src/dev/repartoGanador.js'])

const ESTATICOS = [
  /(?:^|[\s;])import\s+(?:[\w$*{}\s,]+?\s+from\s+)?["']([^"']+)["']/g,
  /(?:^|[\s;])export\s+(?:[\w$*{}\s,]+?)\s+from\s+["']([^"']+)["']/g,
]

function resolver(desde, esp) {
  if (!esp.startsWith('.')) return `pkg:${esp.split('/').slice(0, esp.startsWith('@') ? 2 : 1).join('/')}`
  const base = resolve(RAIZ, dirname(desde), esp.split('?')[0])
  for (const e of ['', '.js', '.jsx', '.mjs']) {
    if (existsSync(base + e) && statSync(base + e).isFile()) return relative(RAIZ, base + e).replaceAll('\\', '/')
  }
  return null
}

// El grafo desde `main.jsx`, con el padre de cada módulo: el camino más corto.
function grafoDeEntrada(leer) {
  const padre = new Map([['src/main.jsx', null]])
  const cola = ['src/main.jsx']
  while (cola.length) {
    const f = cola.shift()
    if (!/\.(jsx?|mjs)$/.test(f) || MUERTO_EN_LA_BUILD.has(f)) continue
    const texto = sinComentarios(leer(f))
    for (const patron of ESTATICOS) {
      for (const m of texto.matchAll(patron)) {
        const d = resolver(f, m[1])
        if (d === null || padre.has(d)) continue
        padre.set(d, f)
        if (!d.startsWith('pkg:')) cola.push(d)
      }
    }
  }
  return padre
}

const delDisco = (f) => readFileSync(join(RAIZ, f), 'utf8')

function camino(padre, m) {
  const c = []
  for (let k = m; k; k = padre.get(k)) c.unshift(k.replace('src/', ''))
  return c.join(' → ')
}

const culpables = (padre) => FUERA_DE_LA_ENTRADA.filter((m) => padre.has(m)).map((m) => camino(padre, m))

describe('PES-1 · INV-84 · la entrada solo lleva lo que pinta la primera pantalla', () => {
  const padre = grafoDeEntrada(delDisco)

  it('el barrido ve la app (no es una prueba vacía)', () => {
    for (const m of ['src/App.jsx', 'src/screens/Portada.jsx', 'src/screens/Lobby.jsx', 'src/lib/trozos.js', 'pkg:react']) {
      expect(padre.has(m), m).toBe(true)
    }
  })

  it('la lista no envejece: todo lo vigilado existe', () => {
    for (const m of FUERA_DE_LA_ENTRADA.filter((x) => !x.startsWith('pkg:'))) expect(existsSync(join(RAIZ, m)), m).toBe(true)
  })

  it('nada de la lista está en el grafo de la entrada', () => {
    expect(culpables(padre)).toEqual([])
  })

  it('cada pantalla diferida tiene su `import()` en `lib/trozos.js`', () => {
    const trozos = delDisco('src/lib/trozos.js')
    for (const m of ['screens/Tienda', 'screens/Perfil', 'screens/Rankings', 'screens/IntersticialSumaMente', 'screens/SalaOpciones',
      'screens/ArmarMesa', 'screens/SalaEspera', 'screens/PartidaPvP', 'screens/RetarIAS', 'components/CapasVideo', 'components/HojaContenido']) {
      expect(trozos, m).toContain(`import('../${m}')`)
    }
  })

  it('CONTROL ROJO · un `import` estático de prueba lo hace fallar y dice el camino', () => {
    const conFuga = (fuga) => (f) => (f === 'src/App.jsx' ? `${delDisco(f)}\n${fuga}\n` : delDisco(f))
    expect(culpables(grafoDeEntrada(conFuga("import Tienda from './screens/Tienda'"))))
      .toEqual(expect.arrayContaining(['main.jsx → App.jsx → screens/Tienda.jsx']))
    expect(culpables(grafoDeEntrada(conFuga("export { PHASES } from './engine/gameEngine'"))))
      .toEqual(expect.arrayContaining(['main.jsx → App.jsx → engine/gameEngine.js']))
    expect(culpables(grafoDeEntrada(conFuga("import { Howl } from 'howler'")))).toEqual(expect.arrayContaining(['main.jsx → App.jsx → pkg:howler']))
    // Un `import()` y un comentario no son fuga.
    expect(culpables(grafoDeEntrada(conFuga("const t = () => import('./screens/Tienda') // import './screens/Perfil'")))).toEqual([])
  })

  it('la cascada de la vitrina y su luz no depende de quién llegue antes (D-21)', () => {
    const hoja = delDisco('src/components/HojaConfiguracion.jsx')
    expect(hoja.indexOf("import '../styles/vitrina.css'")).toBeGreaterThan(-1)
    expect(hoja.indexOf("import '../styles/luz.css'")).toBeGreaterThan(hoja.indexOf("import '../styles/vitrina.css'"))
    expect(delDisco('src/main.jsx')).not.toContain('luz.css')
    expect(padre.has('src/styles/salas.css')).toBe(true)
  })
})
