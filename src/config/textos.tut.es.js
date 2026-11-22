// ── TUT-1 · Los textos del tutorial ─────────────────────────────────────────
// Normativo: AJILEI_Tutorial_v1.3.md (§1.2, §1.4, §2.2 y §3). Viajan con su
// trozo, no en la entrada (INV-84, molde de `textos.pvp.es.js`): quien monta la
// capa los suma con `textos.sumarTextos` al cargarse. En la tanda 1 no los suma
// nadie; desde la tanda 2 los suma la partida guiada (`screens/Guiada.jsx`).
//
// Mismas reglas que `textos.es.js`: prefijo `tut.`, claves en minúscula, ninguna
// vacía. Los `**` marcan la palabra en negrita: `CapaSenal` los pinta como
// `<strong>`, y el texto sigue siendo uno solo para quien traduzca (IDI-1).
// Techo de cada rótulo: dos líneas en 360 × 640 con la letra de LEC-1 (lo mide
// `diagDSK tut`).
//
// Tanda 1: las claves de la lámina (la oferta, las señales y el capítulo 5) y las
// comunes de la capa. Tanda 2: la partida guiada (las tres manos y el cierre). El
// resto del guion entra con las tandas que lo construyen.
//
// TANDA 2 · POR PIEZAS. Cada pieza suma SOLO sus grupos, y los que no importa nadie
// se quedan fuera de `dist/` (son objetos sin efectos: el empaquetador los quita).
// Así la guiada no se lleva los textos de la oferta ni del capítulo 5, que
// `testDistSinMoldes` sigue prohibiendo hasta que su tanda los monte.
// `TEXTOS_TUT_ES` es la suma de todos: la usan las pruebas y la vara.

// ── Comunes (normativo §3): los controles de la capa, el índice y el nombre ──
export const TEXTOS_TUT_COMUNES = {
  'tut.ctl.siguiente': 'Siguiente',
  'tut.ctl.volver':    'Volver',
  'tut.ctl.cerrar':    'Cerrar',
  // «Salir» (v1.3 §1.1): arriba a la derecha, aparte; en los capítulos el mismo botón dice «Cerrar».
  'tut.ctl.salir':     'Salir',
  'tut.ctl.paso':      'Paso {n} de {m}',
  'tut.capa.aria':     'Cómo se juega',
  'tut.guiada.nombre': 'Partida guiada',
  // La primera fila del índice de «Cómo se juega» (§1.2) y la marca de visto (§2.1).
  'tut.indice.guiada': 'Partida guiada · 2 min',
  'tut.indice.visto':  'Visto',
}

// ── GUI-1 §1.2 · La oferta del primer login ──
export const TEXTOS_TUT_OFERTA = {
  'tut.oferta.titulo':  '¿Aprendemos en dos minutos?',
  'tut.oferta.texto':   'Una partida guiada. No gastas monedas.',
  'tut.oferta.jugar':   'Jugar la guiada',
  'tut.oferta.ahorano': 'Ahora no',
}

// ── GUI-1 §1.4 · Las señales de primera vez ──
export const TEXTOS_TUT_SENALES = {
  'tut.senal.iniciar': 'Toca **Iniciar mano** cuando estés listo.',
  'tut.senal.turno':   'Tu turno. **Pasar** no cuesta; **Apostar** mete monedas al pozo.',
}

// ── TUT-1 §2.2 · Capítulo 5 · Apostar, pasar, retirarse ──
export const TEXTOS_TUT_CAP5 = {
  'tut.cap5.titulo': 'Apostar, pasar, retirarse',
  'tut.cap5.p1': '**Pasar** no cuesta: dejas que sigan los demás.',
  // v1.0 del normativo: los multiplicadores de verdad (la lámina decía «×2, ×3…», hallazgo 2).
  'tut.cap5.p2': '**Apostar** mete monedas al pozo. ×1, ×2, ×5 y ×10 son cuántas apuestas pones.',
  'tut.cap5.p3': 'Si alguien apostó, **Igualar** es pagar lo mismo para seguir.',
  // Cuando el botón no está montado (no hay apuesta que igualar), el paso señala el hueco de la fila.
  'tut.cap5.p3.hueco': 'Cuando alguien apuesta, aquí sale **Igualar**: pagar lo mismo para seguir.',
  'tut.cap5.p4': '**Subir** es pagar más y obligar a los demás a decidir.',
  'tut.cap5.p4.hueco': 'Cuando alguien apuesta, aquí sale **Subir**: pagar más y obligar a los demás a decidir.',
  'tut.cap5.p5': '**Retirarse** es salir de la mano. Pierdes lo que ya pusiste, no más.',
  'tut.cap5.p6': 'Lo que está en gris no te alcanza o no se puede ahora.',
}

// ── GUI-1 §1.4 · La partida guiada (normativo v1.3, la escalera) ──
// Los rótulos, tal cual el normativo. Los que se repiten van en una clave
// (`tut.g.*`): la prueba de textos no admite dos claves con el mismo texto.
export const TEXTOS_TUT_GUIADA = {
  'tut.g.descartar': 'Toca **Descartar**.',
  'tut.g.igualaron': 'Igualaron.',
  'tut.g.igualaron.pozo': 'Igualaron. El pozo es de {pozo}.',
  'tut.g.yapostar': 'Y **Apostar**.',
  // Mano 1 · «Mirar y arriesgar»
  'tut.g1.p1': 'Esta es tu mesa. Tú estás abajo. Toca **Iniciar mano**.',
  'tut.g1.p2': 'Tus cartas. Solo suman las del **mismo palo**. Estas no lo son.',
  'tut.g1.p3': 'Todavía no tienes buena mano: **pasa**.',
  'tut.g1.p4': 'Tres del mismo palo suman {n}. Es poco.',
  'tut.g1.p5': 'Pasa.',
  'tut.g1.p6': 'Toca las dos que no suman.',
  'tut.g1.p8': 'No mejoró. Sigues en {n}. Pasa a veces.',
  'tut.g1.p9': 'Sigues en {n}. Pasa y mira qué hacen.',
  'tut.g1.p10': 'IA 1 apostó 100 e IA 2 pagó. Con {n} puedes probar suerte: **iguala**.',
  'tut.g1.p11': '{rival} tenía {m}. Tú {n}. **Gana la suma más alta.**',
  'tut.g1.cierre': 'Igualaste con poco y perdiste. Ahora: mejorar antes de apostar.',
  // Mano 2 · «Mejorar y apostar»
  'tut.g2.p1': 'Dos del mismo palo. Buen comienzo: **apuesta**.',
  'tut.g2.p3': 'Cuatro del mismo palo: {n}. Sube la apuesta.',
  'tut.g2.p4': 'Toca **×2**.',
  'tut.g2.p5': 'Ahora **Apostar**.',
  'tut.g2.p6': 'Toca la que no suma.',
  'tut.g2.p8': '¡Llegó del palo! Cinco del mismo palo: {n}.',
  'tut.g2.p9': 'Apuesta fuerte. Toca **×5**.',
  'tut.g2.p11': '{n} contra {m}. **Ganaste** {pozo}.',
  'tut.g2.cierre': 'Mejoraste y apostaste. Así se gana.',
  // Mano 3 · «AJILEI». El paso 10 es la celebración real, sin rótulo.
  'tut.g3.p1': 'As y una de diez del mismo palo. **Apuesta**.',
  'tut.g3.p3': '**¡AJILEI!** As y cuatro de diez del mismo palo: 51. La jugada más alta.',
  'tut.g3.p4': 'Apuesta a lo grande. Toca **×10**.',
  'tut.g3.p7': 'Ya tienes AJILEI. No cambies nada.',
  'tut.g3.p8': 'Otra vez a lo grande: **×10**.',
  'tut.g3.p9': '**Apostar**.',
  // El cierre (paso 11 de la mano 3). La recompensa (§1.5) entra con la tanda 3.
  'tut.cierre.titulo': '¡Ya sabes jugar!',
  'tut.cierre.texto': 'Palos distintos: pasa. Te apuestan: iguala. Mismo palo: apuesta. Cuantas más del palo, más fuerte. AJILEI: a lo grande.',
  'tut.cierre.jugar': 'Jugar de verdad',
  'tut.cierre.lobby': 'Volver al lobby',
}

// `@__PURE__`: sin nadie que la importe en la app, el empaquetador la quita y con ella los
// grupos que ninguna pieza montada pide (con un objeto `{ ...a, ...b }` no se atrevía).
export const TEXTOS_TUT_ES = /* @__PURE__ */ Object.assign({},
  TEXTOS_TUT_COMUNES, TEXTOS_TUT_OFERTA, TEXTOS_TUT_SENALES, TEXTOS_TUT_CAP5, TEXTOS_TUT_GUIADA)
