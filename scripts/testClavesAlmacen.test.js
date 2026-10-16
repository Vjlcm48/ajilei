// ── ARN-3e · el almacenamiento del navegador, censado (INV-12) ──────────────
// Doctrina: nada se guarda en el navegador sin decirlo. Lo que es de la
// economía nace en Supabase (Tapetes_v1.0 §5: «una billetera `localStorage` es
// falsificable con F12»), y lo que es de una partida no persiste
// (Victory_Celebration_v1.0, «Sin persistencia, deliberado»). Lo que SÍ se
// guarda son comodidades del dedo, con la convención `ajilei.<cosa>`.
//
// Tres cosas salen rojas:
//   · una clave `ajilei.*` en el código que no esté en CLAVES;
//   · un archivo que toque `localStorage`/`sessionStorage` y no esté en
//     ACCESORES (todo acceso pasa por los módulos que ya lo hacen);
//   · una entrada de CLAVES que ya no aparezca en el código (la lista no envejece).
// Los comentarios no cuentan. Censo de ARN-3e (2026-10-03): 12 claves; IOS-1c añade `ajilei.saldoVisto`.
// Fuera de alcance: la sesión de Supabase (`sb-…-auth-token`), que la escribe
// la biblioteca y no el código de `src/`.
import { describe, it, expect } from 'vitest'
import { archivos, codigo, lineaDe } from './arnes/fuente.mjs'

const CLAVES = [
  { clave: 'ajilei.sound', almacen: 'local', fuente: 'Menu_Utilidades_v1.1 · SoundContext.jsx' },
  { clave: 'ajilei.idioma', almacen: 'local', fuente: 'IDI-0 (LOB1_Fase1) · textos.js' },
  { clave: 'ajilei.nivel', almacen: 'local', fuente: 'APU-1_Reglas_v1.0 · LOB1_Fase0:302 · hoy solo LEGADO: retarCore la absorbe y la borra' },
  { clave: 'ajilei.retoConfig', almacen: 'local', fuente: 'APU-1 Fase 1e · retarCore.js' },
  { clave: 'ajilei.consultas', almacen: 'local', fuente: 'Menu_Utilidades_v1.1–v1.4 · consultas.js' },
  { clave: 'ajilei.tapete', almacen: 'local', fuente: 'Tapetes_v1.0:52-53 · LOB1_Fase0:302' },
  { clave: 'ajilei.tapetes.comprados', almacen: 'local', fuente: 'Tapetes_v1.0:52-53 · LOB1_Fase0:302' },
  { clave: 'ajilei.fraseVictoria', almacen: 'local', fuente: 'LOB1_Fase0:302 · frasesVictoria.js' },
  { clave: 'ajilei.melodiaCelebracion', almacen: 'local', fuente: 'LOB1_Fase0:302 · melodiasCelebracion.js' },
  { clave: 'ajilei.salaPendiente', almacen: 'local', fuente: 'SALA Fase 1 · SAL-B1 A3 · salaPendiente.js' },
  { clave: 'ajilei.salaConfig', almacen: 'local', fuente: 'SAL (APU-1_Fase0) · salas.js' },
  { clave: 'ajilei.recargaPorChunk', almacen: 'session', fuente: 'ARN-3d (D11) · main.jsx' },
  { clave: 'ajilei.dispositivo', almacen: 'local', fuente: 'ECO-1 Fase 1c (P-4) · dispositivo.js' },
  { clave: 'ajilei.saldoVisto', almacen: 'local', fuente: 'IOS-1 Fase 1c (S2) · saldoRecordado.js · solo para la vista, nadie juzga con ella' },
]

// Los únicos módulos que tocan el almacenamiento del navegador.
const ACCESORES = [
  'src/config/memoriaChips.js',    // ajilei.retoConfig (y su legado ajilei.nivel), ajilei.salaConfig
  'src/config/salaPendiente.js',   // ajilei.salaPendiente
  'src/config/sinRepetir.js',      // ajilei.fraseVictoria, ajilei.melodiaCelebracion
  'src/context/SoundContext.jsx',  // ajilei.sound
  'src/hooks/useIdioma.js',        // ajilei.idioma
  'src/hooks/useTapetes.js',       // ajilei.tapete, ajilei.tapetes.comprados
  'src/hooks/useUtilitiesMenu.js', // ajilei.consultas
  'src/main.jsx',                  // ajilei.recargaPorChunk (sessionStorage)
  'src/lib/dispositivo.js',        // ajilei.dispositivo (ECO-1c, P-4)
  'src/lib/saldoRecordado.js',     // ajilei.saldoVisto (IOS-1c, S2)
]

const fuentes = archivos('src', (n) => /\.(jsx?)$/.test(n) && !/\.test\.jsx?$/.test(n))
const textos = Object.fromEntries(fuentes.map((a) => [a, codigo(a)]))

describe('ARN-3e · el almacenamiento del navegador, censado', () => {
  it('ninguna clave `ajilei.*` fuera del censo', () => {
    const intrusas = []
    for (const [archivo, t] of Object.entries(textos)) {
      for (const m of t.matchAll(/(['"`])(ajilei\.[A-Za-z0-9_.-]+)\1/g)) {
        if (!CLAVES.some((c) => c.clave === m[2])) intrusas.push({ archivo, linea: lineaDe(t, m.index), clave: m[2] })
      }
    }
    expect(intrusas, 'una clave nueva entra en CLAVES con su fuente documental, o no entra').toEqual([])
  })

  it('solo los accesores censados tocan localStorage o sessionStorage', () => {
    const fuera = Object.entries(textos)
      .filter(([archivo, t]) => /\b(localStorage|sessionStorage)\b/.test(t) && !ACCESORES.includes(archivo))
      .map(([archivo, t]) => ({ archivo, linea: lineaDe(t, t.search(/\b(localStorage|sessionStorage)\b/)) }))
    expect(fuera, 'el acceso pasa por un accesor existente, o el archivo entra en ACCESORES con su porqué').toEqual([])
  })

  it('cada clave del censo sigue en el código', () => {
    const todo = Object.values(textos).join('\n')
    for (const c of CLAVES) expect(todo.includes(`'${c.clave}'`), c.clave).toBe(true)
  })

  it('cada accesor del censo sigue tocando el almacenamiento', () => {
    for (const a of ACCESORES) expect(/\b(localStorage|sessionStorage)\b/.test(textos[a] ?? ''), a).toBe(true)
  })

  it('la única clave de sesión vive donde dice el censo', () => {
    const conSesion = Object.entries(textos).filter(([, t]) => /\bsessionStorage\b/.test(t)).map(([a]) => a)
    expect(conSesion).toEqual(['src/main.jsx'])
  })
})
