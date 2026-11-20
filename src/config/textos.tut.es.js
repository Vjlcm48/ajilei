// ── TUT-1 · Los textos del tutorial ─────────────────────────────────────────
// Normativo: AJILEI_Tutorial_v1.0.md (§1.2, §1.4, §2.2 y §3). Viajan con su
// trozo, no en la entrada (INV-84, molde de `textos.pvp.es.js`): quien monta la
// capa los suma con `textos.sumarTextos` al cargarse. En la tanda 1 no los suma
// nadie todavía: la capa no está montada.
//
// Mismas reglas que `textos.es.js`: prefijo `tut.`, claves en minúscula, ninguna
// vacía. Los `**` marcan la palabra en negrita: `CapaSenal` los pinta como
// `<strong>`, y el texto sigue siendo uno solo para quien traduzca (IDI-1).
// Techo de cada rótulo: dos líneas en 360 × 640 con la letra de LEC-1 (lo mide
// `diagDSK tut`).
//
// Tanda 1: las claves de la lámina (la oferta, las señales y el capítulo 5) y las
// comunes de la capa. El resto del guion entra con las tandas que lo construyen.
export const TEXTOS_TUT_ES = {
  // ── Comunes (normativo §3): los controles de la capa, el índice y el nombre ──
  'tut.ctl.siguiente': 'Siguiente',
  'tut.ctl.volver':    'Volver',
  'tut.ctl.cerrar':    'Cerrar',
  'tut.ctl.saltar':    'Saltar',
  'tut.ctl.paso':      'Paso {n} de {m}',
  'tut.capa.aria':     'Cómo se juega',
  'tut.guiada.nombre': 'Partida guiada',
  // La primera fila del índice de «Cómo se juega» (§1.2) y la marca de visto (§2.1).
  'tut.indice.guiada': 'Partida guiada · 2 min',
  'tut.indice.visto':  'Visto',

  // ── GUI-1 §1.2 · La oferta del primer login ──
  'tut.oferta.titulo':  '¿Aprendemos en dos minutos?',
  'tut.oferta.texto':   'Una partida guiada. No gastas monedas.',
  'tut.oferta.jugar':   'Jugar la guiada',
  'tut.oferta.ahorano': 'Ahora no',

  // ── GUI-1 §1.4 · Las señales de primera vez ──
  'tut.senal.iniciar': 'Toca **Iniciar mano** cuando estés listo.',
  'tut.senal.turno':   'Tu turno. **Pasar** no cuesta; **Apostar** mete monedas al pozo.',

  // ── TUT-1 §2.2 · Capítulo 5 · Apostar, pasar, retirarse ──
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
