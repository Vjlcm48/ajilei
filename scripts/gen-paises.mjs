// ── gen-paises.mjs · CFG-1 1b · La lista de países y sus banderas ──────────
// Rector: AJILEI_CFG-1_Fase1b_v1.0.md §2.1–§2.2 (R-11 y R-12 del informe de la
// lámina 1b-L, §5.2–§5.3). Escribe `src/config/paises.js`, que queda CONGELADO
// en el repo: no se regenera en cada build.
//
// FUENTE DE LOS NOMBRES: CLDR en español, el que trae el ICU de Node
// (`Intl.DisplayNames`). Se congela en un archivo: el navegador también tiene
// CLDR, pero cada uno trae su versión (Safari no dice lo mismo que Chrome), y
// la lista no puede cambiar según el aparato. Licencia de CLDR: Unicode License
// v3, permisiva, sin atribución visible.
//
// QUÉ CÓDIGOS: los 249 de ISO 3166-1 alfa-2, menos los seis sin población
// permanente (decisión de Victor, §0-7). Kosovo (XK) no es ISO y no entra.
//
// ── LAS BANDERAS ───────────────────────────────────────────────────────────
// `country-flag-icons` 1.6.20 (MIT, © 2020 catamphetamine), carpeta `3x2/`.
// NO es dependencia de `package.json` (§2.2): los SVG se copian UNA vez a
// `public/banderas/3x2/`, solo los de la lista, con su `LICENSE`. Para volver a
// copiarlos, se baja el paquete (`npm pack country-flag-icons@1.6.20`), se
// descomprime fuera del repo y se pasa la carpeta:
//
//   node scripts/gen-paises.mjs                         solo la lista
//   node scripts/gen-paises.mjs --banderas <dir>/package     y las banderas
import { writeFileSync, mkdirSync, copyFileSync, existsSync, readdirSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { RAIZ } from './arnes/fuente.mjs'
import { ESTADOS_VE } from '../src/config/estados.js'

export const ORIGEN_BANDERAS = 'country-flag-icons@1.6.20'

const ISO = 'AF AX AL DZ AS AD AO AI AQ AG AR AM AW AU AT AZ BS BH BD BB BY BE BZ BJ BM BT BO BQ BA BW BV BR IO BN BG BF BI CV KH CM CA KY CF TD CL CN CX CC CO KM CK CR HR CU CW CY CZ CI CD DK DJ DM DO EC EG SV GQ ER EE SZ ET FK FO FM FJ FI FR GF PF TF GA GM GE DE GH GI GR GL GD GP GU GT GG GN GW GY HT HM VA HN HK HU IS IN ID IR IQ IE IM IL IT JM JP JE JO KZ KE KI KW KG LA LV LB LS LR LY LI LT LU MO MG MW MY MV ML MT MH MQ MR MU YT MX MD MC MN ME MS MA MZ MM NA NR NP NL NC NZ NI NE NG NU NF KP MK MP NO OM PK PW PA PG PY PE PH PN PL PT PR QA CG RO RU RW RE BL SH KN LC MF PM VC WS SM ST SA SN RS SC SL SG SX SK SI SB SO ZA GS KR SS ES LK PS SD SR SJ SE CH SY TW TJ TZ TH TL TG TK TO TT TN TM TC TV TR UG UA AE GB UM US UY UZ VU VE VN VG VI WF EH YE ZM ZW'.split(' ')

// Sin población permanente: Antártida, Bouvet, Heard y McDonald, las menores
// alejadas de EE. UU., los Australes Franceses y Georgia del Sur.
const FUERA = new Set(['AQ', 'BV', 'HM', 'UM', 'TF', 'GS'])

// Donde el nombre de CLDR no es el que dice la gente.
const ARREGLOS = {
  HK: 'Hong Kong',          // CLDR: «RAE de Hong Kong (China)»
  MO: 'Macao',              // CLDR: «RAE de Macao (China)»
  CI: 'Costa de Marfil',    // CLDR: «Côte d’Ivoire»
  PS: 'Palestina',          // CLDR: «Territorios Palestinos»
  TL: 'Timor Oriental',     // CLDR: «Timor-Leste»
}

// Lo que se escribe y no es el nombre (ni el inglés, que ya se busca solo).
export const ALIAS = {
  US: ['EEUU', 'EE. UU.', 'USA', 'US', 'Norteamérica'],
  GB: ['UK', 'Inglaterra', 'Gran Bretaña', 'Escocia', 'Gales', 'Irlanda del Norte'],
  NL: ['Holanda'],
  DO: ['RD', 'Dominicana'],
  CZ: ['República Checa'],
  AE: ['EAU', 'Emiratos', 'Dubái', 'Abu Dabi'],
  SA: ['Arabia Saudita'],
  CW: ['Curaçao', 'Curacao'],
  BQ: ['Bonaire', 'San Eustaquio', 'Saba'],
  SX: ['San Martín'],
  PR: ['Borinquen', 'Boricua'],
  VA: ['Vaticano'],
  SZ: ['Suazilandia'],
  MK: ['Macedonia'],
  BY: ['Belarús'],
  KN: ['Saint Kitts'],
  FK: ['Falkland'],
  CI: ['Côte d’Ivoire'],
  TL: ['Timor-Leste'],
  MM: ['Birmania'],
}

const es = new Intl.DisplayNames(['es'], { type: 'region' })
const en = new Intl.DisplayNames(['en'], { type: 'region' })
const orden = new Intl.Collator('es')

const paises = ISO.filter((c) => !FUERA.has(c))
  .map((c) => ({ c, n: ARREGLOS[c] ?? es.of(c), en: en.of(c), a: ALIAS[c] ?? [] }))
  .sort((x, y) => orden.compare(x.n, y.n))

const cab = `// GENERADO por scripts/gen-paises.mjs — no editar a mano.
// CLDR ${process.versions.cldr} (ICU ${process.versions.icu}, Node ${process.version}) · ${paises.length} países y territorios.
// Banderas: public/banderas/3x2/<c>.svg, de ${ORIGEN_BANDERAS} (MIT; LICENSE al lado).
// c = ISO 3166-1 alfa-2 · n = nombre en español · en = en inglés (se busca) · a = alias.
`
const cuerpo = `export const PAISES = Object.freeze([\n${paises.map((p) => '  ' + JSON.stringify(p)).join(',\n')},\n])\n`
const destino = join(RAIZ, 'src/config/paises.js')
writeFileSync(destino, cab + cuerpo)
console.log(`${paises.length} países → ${destino}`)

// PES-1 §3-D · los códigos, de la misma lista: es lo único que viaja en la entrada.
// Los nombres van con lo que los enseña. `lugarCore.test.js` exige que coincidan.
const destinoCodigos = join(RAIZ, 'src/config/lugaresCodigos.js')
writeFileSync(destinoCodigos, `// GENERADO por scripts/gen-paises.mjs — no editar a mano.
// Los códigos de \`paises.js\` y \`estados.js\`, sin los nombres.
export const CODIGOS_PAIS = Object.freeze(${JSON.stringify(paises.map((p) => p.c))})
export const CODIGOS_ESTADO_VE = Object.freeze(${JSON.stringify(ESTADOS_VE.map((e) => e.c))})
`)
console.log(`${paises.length} países y ${ESTADOS_VE.length} estados → ${destinoCodigos}`)

const i = process.argv.indexOf('--banderas')
if (i > 0) {
  const paquete = process.argv[i + 1]
  const origen = join(paquete ?? '', '3x2')
  if (!paquete || !existsSync(origen)) {
    console.error(`✖ no encuentro ${origen}: pasa la carpeta del paquete descomprimido`)
    process.exit(2)
  }
  const carpeta = join(RAIZ, 'public/banderas/3x2')
  rmSync(carpeta, { recursive: true, force: true })
  mkdirSync(carpeta, { recursive: true })
  for (const p of paises) copyFileSync(join(origen, `${p.c}.svg`), join(carpeta, `${p.c}.svg`))
  const licencia = readdirSync(paquete).find((f) => /^licen[cs]e/i.test(f))
  copyFileSync(join(paquete, licencia), join(RAIZ, 'public/banderas/LICENSE'))
  console.log(`${paises.length} banderas de ${ORIGEN_BANDERAS} → ${carpeta}`)
}
