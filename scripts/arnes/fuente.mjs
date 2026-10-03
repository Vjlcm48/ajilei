// ── ARN-3e · lo común de las pruebas de fuente ──────────────────────────────
// `testImportant`, `testClavesAlmacen` y `testAvisosPruebas` leen el código como
// texto y buscan algo FUERA de los comentarios: la casa escribe «sin
// `!important`», «sin `localStorage`» o «no `console.warn`» en sus comentarios,
// y eso no puede contar. Aquí viven el recorrido y el quitacomentarios.
//
// El quitacomentarios es deliberadamente simple: borra `/* … */` y, en JS, los
// `//` que no van detrás de `:` (las URL) ni de una comilla. Conserva los saltos
// de línea, para que las líneas que se informan cuadren con el archivo. Si un
// día un `//` dentro de una cadena le engañara, el error sería un ROJO falso
// (más código a la vista), nunca un verde falso.
import { readFileSync, readdirSync } from 'node:fs'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

export const RAIZ = fileURLToPath(new URL('../../', import.meta.url))

/** Los archivos bajo `dir` (relativo a la raíz) cuyo nombre cumple `filtro`, sin `node_modules`. */
export function archivos(dir, filtro) {
  const abs = join(RAIZ, dir)
  return readdirSync(abs, { withFileTypes: true }).flatMap((e) => {
    if (e.name === 'node_modules') return []
    const rel = relative(RAIZ, join(abs, e.name)).split('\\').join('/')
    if (e.isDirectory()) return archivos(rel, filtro)
    return filtro(e.name) ? [rel] : []
  })
}

const blanco = (s) => s.replace(/[^\n]/g, ' ')

/** El texto sin comentarios, con los saltos de línea en su sitio. */
export function sinComentarios(texto, css = false) {
  let t = texto.replace(/\/\*[\s\S]*?\*\//g, blanco)
  if (!css) t = t.replace(/(^|[^:'"`\\])\/\/[^\n]*/g, (m, a) => a + blanco(m.slice(a.length)))
  return t
}

/** Lee un archivo (relativo a la raíz) ya sin comentarios. */
export const codigo = (rel) => sinComentarios(readFileSync(join(RAIZ, rel), 'utf8'), rel.endsWith('.css'))

/** Número de línea (1…) de un índice del texto. */
export const lineaDe = (texto, i) => texto.slice(0, i).split('\n').length
