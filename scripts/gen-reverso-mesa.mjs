// ── REV-1 · Genera la copia de mesa del reverso ─────────────────────────────
// Lee src/assets/cards/reverso_carta.svg y escribe
// src/assets/cards/reverso_carta_mesa.svg. Nota 8 del §12 del Sistema de Diseño;
// procedimiento de la ficha REV-1 Fase 1 §2.1:
//   · viewBox 1005×1420 (1420 × 1055/1491 = 1004,8, la proporción de las caras);
//   · TODO el contenido dentro de <g transform="translate(47.5 0)">, sin tocar
//     una coordenada;
//   · SÓLO las dos capas de campo (fondo #41101c y raya rvPin) pasan a
//     x=-47.5 width=1005.
// Aborta si el original ya no tiene exactamente esas dos capas: regenerar
// después de cambiar el original obliga a revisarlo (y a correr el modo `rev`).
//
// Uso:
//   node scripts/gen-reverso-mesa.mjs              escribe la copia
//   node scripts/gen-reverso-mesa.mjs --comprobar  no escribe; sale ≠ 0 si la
//                                                  copia en disco difiere
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..')
const ORIGINAL = join(RAIZ, 'src/assets/cards/reverso_carta.svg')
const COPIA = join(RAIZ, 'src/assets/cards/reverso_carta_mesa.svg')
const comprobar = process.argv.includes('--comprobar')

const src = readFileSync(ORIGINAL, 'utf8')
const W = 1005, DX = (W - 910) / 2
const m = src.match(/^(<svg[^>]*>)([\s\S]*)(<\/svg>\s*)$/)
if (!m) throw new Error('raíz <svg> no reconocida')
let [, raiz, cuerpo, cierre] = m
if (!/viewBox="0 0 910 1420"/.test(raiz)) throw new Error('viewBox del original cambió')
raiz = raiz.replace('viewBox="0 0 910 1420"', `viewBox="0 0 ${W} 1420"`).replace('width="910"', `width="${W}"`)
const capas = ['<rect width="910" height="1420" fill="#41101c"/>', '<rect width="910" height="1420" fill="url(#rvPin)"/>']
for (const c of capas) {
  if (cuerpo.split(c).length !== 2) throw new Error('capa de campo no encontrada o repetida: ' + c)
  cuerpo = cuerpo.replace(c, c.replace('width="910"', `x="${-DX}" width="${W}"`))
}
// El comentario de cabecera queda fuera del grupo; se le antepone el de la copia.
// Su texto es parte del archivo sellado (md5 ba2def97…): cambiarlo cambia el asset.
const iDefs = cuerpo.indexOf('<defs>')
const cabecera = cuerpo.slice(0, iDefs), resto = cuerpo.slice(iDefs)
const nota = `
  <!--
    AJILEI · Reverso de MESA · copia ensanchada de reverso_carta.svg (REV-1, 2026-09-25)
    Lienzo ${W} x 1420 = proporción de las caras de la baraja (1055:1491 = 0,7076).
    SOLO se ensancha la tela (campo #41101c y raya rvPin: x=${-DX}, width=${W}); todo el
    dibujo del original va intacto dentro de translate(${DX} 0). La franja central
    x ${DX}..${DX + 910} es el original. Se regenera con scripts/gen-reverso-mesa.mjs.
  -->`
const out = `${raiz}${nota}${cabecera}<g transform="translate(${DX} 0)">\n  ${resto.trimEnd()}\n</g>\n${cierre}`

if (comprobar) {
  const enDisco = existsSync(COPIA) ? readFileSync(COPIA, 'utf8') : null
  if (enDisco !== out) {
    console.error(`DIFIERE: ${COPIA} no es lo que genera el original (${enDisco == null ? 'no existe' : `${enDisco.length} B en disco, ${out.length} B generados`})`)
    process.exit(1)
  }
  console.log('ok · la copia en disco coincide al byte', out.length, 'B')
} else {
  writeFileSync(COPIA, out)
  console.log('ok', out.length, 'B')
}
