// ── ARN-3e · las huellas de los protegidos (INV-01) ─────────────────────────
// La lista y sus huellas viven en UN sitio: `docs/AJILEI_Protegidos_v1.0.md`
// (§2 la lista, §3 la instantánea). Esta prueba no copia nada: lee las dos
// tablas del documento y compara cada fila con los bytes del árbol.
//   · un byte cambiado en un protegido → rojo (blob, sha256 o líneas);
//   · un protegido en §2 sin fila en §3, o al revés → rojo;
//   · un documento que ya no se deja leer (0 filas) → rojo, no verde.
// Una campaña AUTORIZADA a abrir un protegido re-mide su fila de §3 EN EL MISMO
// COMMIT: el diff del documento enseña la apertura al lado del código.
// Los protegidos se leen como bytes, desde fuera: nadie los abre (Protegidos §1).
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { Buffer } from 'node:buffer'

const raiz = new URL('../', import.meta.url)
const DOC = 'docs/AJILEI_Protegidos_v1.0.md'
const doc = readFileSync(new URL(DOC, raiz), 'utf8')

// El trozo de una sección «## N.» hasta la siguiente «## ».
function seccion(n) {
  const ini = doc.search(new RegExp(`^## ${n}\\.`, 'm'))
  if (ini < 0) return ''
  const resto = doc.slice(ini + 1)
  const fin = resto.search(/^## /m)
  return fin < 0 ? resto : resto.slice(0, fin)
}

const lista = [...seccion(2).matchAll(/^\|\s*\d+\s*\|\s*`([^`]+)`/gm)].map((m) => m[1])
const huellas = [...seccion(3).matchAll(
  /^\|\s*`([^`]+)`\s*\|\s*`([0-9a-f]{12})`\s*\|\s*`([0-9a-f]{16})`\s*\|\s*([\d.]+)\s*\|/gm,
)].map((m) => ({ archivo: m[1], blob: m[2], sha256: m[3], lineas: Number(m[4].replace('.', '')) }))

// El blob es el de git (`sha1("blob <n>\0" + bytes)`, la fórmula de
// `bancoNiveles.mjs`); cuadra con `git hash-object` porque el repo es LF.
function medir(archivo) {
  const bytes = readFileSync(new URL(archivo, raiz))
  const cabecera = Buffer.from(`blob ${bytes.length}\0`)
  return {
    blob: createHash('sha1').update(Buffer.concat([cabecera, bytes])).digest('hex').slice(0, 12),
    sha256: createHash('sha256').update(bytes).digest('hex').slice(0, 16),
    lineas: bytes.toString('latin1').split('\n').length - 1,
  }
}

describe('ARN-3e · Protegidos §2 y §3 se leen', () => {
  it('la lista de §2 no está vacía y no repite archivos', () => {
    expect(lista.length).toBeGreaterThan(0)
    expect(new Set(lista).size).toBe(lista.length)
  })

  it('§3 tiene exactamente una fila por cada protegido de §2', () => {
    expect(huellas.map((h) => h.archivo).sort()).toEqual([...lista].sort())
  })
})

describe('ARN-3e · cada protegido conserva su huella de §3', () => {
  for (const h of huellas) {
    it(h.archivo, () => {
      const real = medir(h.archivo)
      const aviso = `${h.archivo} ya no es el de ${DOC} §3. Si la campaña está AUTORIZADA a abrirlo, `
        + `re-mide su fila en el MISMO commit; si no, es una apertura sin permiso.`
      expect(real, aviso).toEqual({ blob: h.blob, sha256: h.sha256, lineas: h.lineas })
    })
  }
})
