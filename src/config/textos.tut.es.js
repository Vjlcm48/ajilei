// ── TUT-1 · Los textos del tutorial ─────────────────────────────────────────
// Normativo: AJILEI_Tutorial_v1.4.md (§1.2, §1.4, §1.6, §2.1, §2.2 y §3). Viajan con su
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
// comunes de la capa. Tanda 2: la partida guiada (las tres manos y el cierre). Tanda 3:
// la oferta con la cifra, las tres señales, «Cómo se juega» y el premio del cierre. El
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
  // TUT-1 T4 · el último paso de un capítulo (P-5): pone el ✓; «Cerrar» no.
  'tut.ctl.terminar':  'Terminar',
  'tut.capa.aria':     'Cómo se juega',
  'tut.guiada.nombre': 'Partida guiada',
  // La primera fila del índice de «Cómo se juega» (§1.2) y la marca de visto (§2.1).
  'tut.indice.guiada': 'Partida guiada · 2 min',
  'tut.indice.visto':  'Visto',
}

// ── GUI-1 §1.2 · La oferta del primer login (v1.4: la cifra la dice el servidor) ──
// `{monto}` es lo que devolvió `premio_guiada_estado`, ya con sus puntos de miles.
// «antes de jugar tu primera mano» solo para quien no jugó ninguna (tramo `limpio`).
export const TEXTOS_TUT_OFERTA = {
  'tut.oferta.titulo':  'Aprende en dos minutos',
  'tut.oferta.texto.limpio': 'Completa la partida guiada antes de jugar tu primera mano y recibe **{monto} HC**.',
  'tut.oferta.texto':   'Completa la partida guiada y recibe **{monto} HC**.',
  'tut.oferta.jugar':   'Jugar la guiada',
  'tut.oferta.ahorano': 'Ahora no',
}

// ── GUI-1 §1.6 · Las señales de primera vez (en la mesa real contra las IAS) ──
export const TEXTOS_TUT_SENALES = {
  'tut.senal.iniciar': 'Toca **Iniciar mano** cuando estés listo.',
  'tut.senal.turno':   'Tu turno. Palos distintos: **Pasar**. Mismo palo: **Apostar**. Te apuestan: **Igualar**.',
  'tut.senal.descartar': 'Toca las cartas que no suman y luego **Descartar**. Tienes {s} segundos.',
}

// ── TUT-1 §2.1 (v1.4) · La pantalla «Cómo se juega»: tres tarjetas ──
// El título de la pantalla es `tut.capa.aria` y el de la primera tarjeta, `tut.guiada.nombre`
// (la prueba de textos no admite dos claves con el mismo texto).
export const TEXTOS_TUT_HUB = {
  'tut.hub.guiada.sub':    '3 manos · 2 min',
  'tut.hub.guiada.premio': 'Gana {monto} HC',
  'tut.hub.guiada.hecha':  '✓ Hecha',
  'tut.hub.temas.titulo':  'Aprender por tema',
  'tut.hub.temas.sub':     'Los 10 temas del juego',
  'tut.hub.mia.titulo':    'Pregúntale a Mia',
  'tut.hub.mia.sub':       'Tus dudas, al momento',
  'tut.hub.pronto':        'Pronto',
}

// ── TUT-1 §2.2 · Capítulo 5 · Apostar, pasar, retirarse ──
export const TEXTOS_TUT_CAP5 = {
  'tut.cap5.titulo': 'Apostar, pasar, retirarse',
  'tut.cap5.p1': '**Pasar** no cuesta: dejas que sigan los demás.',
  // v1.5 · partido en dos pasos en la tanda 4 (STOP-T: los dos aros se montaban). v1.4, un paso:
  // «**Apostar** mete monedas al pozo. ×1, ×2, ×5 y ×10 son cuántas apuestas pones.» El capítulo
  // queda de 7 pasos. Los multiplicadores, los de verdad (normativo v1.0, hallazgo 2 de la lámina).
  'tut.cap5.p2': '**Apostar** mete monedas al pozo.',
  'tut.cap5.p3': '**×1, ×2, ×5 y ×10** son cuántas apuestas pones.',
  'tut.cap5.p4': 'Si alguien apostó, **Igualar** es pagar lo mismo para seguir.',
  // Cuando el botón no está montado (no hay apuesta que igualar), el paso señala el hueco de la fila.
  'tut.cap5.p4.hueco': 'Cuando alguien apuesta, aquí sale **Igualar**: pagar lo mismo para seguir.',
  'tut.cap5.p5': '**Subir** es pagar más y obligar a los demás a decidir.',
  'tut.cap5.p5.hueco': 'Cuando alguien apuesta, aquí sale **Subir**: pagar más y obligar a los demás a decidir.',
  'tut.cap5.p6': '**Retirarse** es salir de la mano. Pierdes lo que ya pusiste, no más.',
  'tut.cap5.p7': 'Lo que está en gris no te alcanza o no se puede ahora.',
}

// ── TUT-1 T4 · «Aprender por tema»: el índice y los capítulos 1 a 6 (normativo §2.2) ──
// Los rótulos, tal cual el normativo. Los títulos de los diez van aquí (el índice los
// lista todos); los pasos de 7 a 10, con la tanda 5. El capítulo 5 sigue en su grupo.
export const TEXTOS_TUT_TEMAS = {
  'tut.temas.pista.a': 'El juego',
  'tut.temas.pista.b': 'Apostar',
  'tut.temas.pista.c': 'La app',
  'tut.temas.cap':     'Capítulo {n}',
  // Las dos líneas pequeñas bajo el rótulo (`nota` de la capa).
  'tut.temas.suma':    'Suma: {n}',
  'tut.temas.reloj':   'Tu reloj sigue corriendo.',

  'tut.cap1.titulo': '¿Qué es AJILEI?',
  'tut.cap1.p1': 'Esto es un AJILEI: 51 puntos. La jugada que gana en seco.',
  'tut.cap1.p2': 'Baraja española: 40 cartas. Oros, copas, espadas y bastos.',
  'tut.cap1.p3': 'Se juega de 2 a 5. Contra las IAS o con otras personas.',
  'tut.cap1.p4': 'Se apuesta con Heptacoins. Nunca con dinero real.',

  'tut.cap2.titulo': 'Cuánto vale cada carta',
  // v1.5 · reescritos en la tanda 4 (STOP-T, Victor). v1.4: «El As vale 11.» y «El 6 vale 6 y el
  // 7 vale 7.»
  'tut.cap2.p1': 'El As, de cualquier palo, vale **11**.',
  'tut.cap2.p2': 'El 6 vale **6** y el 7 vale **7**, de cualquier palo.',
  'tut.cap2.p3': 'Todo lo demás vale **10**: las figuras y también el 2, el 3, el 4 y el 5.',
  'tut.cap2.p4': '**Solo suman las del mismo palo.**',
  'tut.cap2.p5': 'Tu suma es la del mejor palo que tengas. Cuantas más cartas del palo, más sumas.',
  // v1.5 · partido en dos pasos en la tanda 4 (STOP-T, Victor: el texto completo, dos líneas cada
  // uno; antes se acortó a «Con 4 y 5, el 7 de Oro es comodín…»). v1.4, un paso: «En las mesas de
  // 4 y 5, el 7 de Oro es comodín: se junta con cualquier palo. Vale 10 con 4 y 11 con 5.» El
  // capítulo queda de 7 pasos.
  'tut.cap2.p6': '**En mesas de 4 y 5 jugadores**, el 7 de Oro es comodín de cualquier palo.',
  // «10 puntos» y «11 puntos» con espacio duro: la cifra no se queda sola al final de una línea.
  'tut.cap2.p7': 'Vale **10\u00a0puntos** con 4 jugadores y **11\u00a0puntos** con 5.',

  'tut.cap3.titulo': 'Cómo va una mano',
  'tut.cap3.p1': 'Primero recibes dos.',
  'tut.cap3.p2': 'Se apuesta.',
  'tut.cap3.p3': 'Llegan tres más. Se apuesta otra vez.',
  'tut.cap3.p4': '**Quédate con tu mejor palo** y cambia el resto. Puedes cambiar hasta {tope}.',
  'tut.cap3.p5': 'Tocas las que cambias y luego **Descartar**. Te reponen una a una.',
  'tut.cap3.p6': 'Se apuesta por última vez.',
  'tut.cap3.p7': 'Se muestran las cartas. Gana la suma más alta.',

  'tut.cap4.titulo': 'Cómo se gana y cómo se pierde',
  'tut.cap4.p1': '**AJILEI**: As y cuatro de diez del mismo palo, 51 puntos.',
  // v1.5 · acortado (tres líneas): sale «Solo hay uno.».
  'tut.cap4.p2': 'En la mesa de 5, As, tres de diez y el 7 de Oro suman **52**. Nadie lo iguala.',
  'tut.cap4.p3': 'Sin AJILEI, gana la suma más alta del mejor palo.',
  'tut.cap4.p4': 'Si empatan, gana **la Mano**; si la Mano no empató, el que está más cerca de ella.',
  // v1.5 · acortado (tres líneas). v1.4: «Pierdes cuando tu pila se queda en cero. Contra las IAS puedes
  // recargar; entre personas, hasta la entrada.»
  'tut.cap4.p5': 'Sin pila, pierdes. Recargas contra las IAS; entre personas, hasta la entrada.',

  'tut.cap6.titulo': 'All-in y pozos',
  // v1.5 · acortados (tres líneas). v1.4: «Si te piden más de lo que tienes, puedes ir…» y «Con all-in
  // solo puedes ganar lo que igualaste…».
  'tut.cap6.p1': 'Si no te alcanza, puedes ir **all-in**: pones toda tu pila y tus cartas siguen jugando.',
  'tut.cap6.p2': 'Con all-in solo ganas lo que igualaste. El resto es otro pozo para los demás.',
  'tut.cap6.p3': 'Lo que nadie iguala, se devuelve.',
  // v1.5 · acortado (tres líneas). v1.4: «Con la pila baja, puedes recargar. Contra las IAS, ellas se
  // nivelan contigo; entre personas, hasta la entrada.»
  'tut.cap6.p4': 'Con poca pila, **recarga**: las IAS se nivelan contigo; entre personas, hasta la entrada.',

  'tut.cap7.titulo':  'Jugar contra las IAS',
  'tut.cap8.titulo':  'Jugar con otras personas',
  'tut.cap9.titulo':  'El menú y los ajustes',
  'tut.cap10.titulo': 'Consejos',

  // La muestra de cartas (P-4): las palabras que pinta junto a los componentes reales.
  'tut.muestra.mano':     'Mano',
  'tut.muestra.tu':       'Tú',
  'tut.muestra.rival':    'IA 1',
  'tut.muestra.pozo2':    'Otro pozo',
  'tut.muestra.vuelve':   'Vuelve a ti',
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
  // El cierre (paso 11 de la mano 3), con la celebración del premio (§1.5, tanda 3).
  'tut.cierre.titulo': '¡Ya sabes jugar!',
  'tut.cierre.texto': 'Palos distintos: pasa. Te apuestan: iguala. Mismo palo: apuesta. Cuantas más del palo, más fuerte. AJILEI: a lo grande.',
  'tut.cierre.jugar': 'Jugar de verdad',
  'tut.cierre.lobby': 'Volver al lobby',
  'tut.cierre.premio': '+{monto} HC',
  'tut.cierre.premio.aria': 'Recibiste {monto} Heptacoins',
  'tut.cierre.sinred': 'Te lo acreditamos en cuanto vuelva la conexión.',
}

// `@__PURE__`: sin nadie que la importe en la app, el empaquetador la quita y con ella los
// grupos que ninguna pieza montada pide (con un objeto `{ ...a, ...b }` no se atrevía).
export const TEXTOS_TUT_ES = /* @__PURE__ */ Object.assign({},
  TEXTOS_TUT_COMUNES, TEXTOS_TUT_OFERTA, TEXTOS_TUT_SENALES, TEXTOS_TUT_HUB, TEXTOS_TUT_CAP5, TEXTOS_TUT_TEMAS, TEXTOS_TUT_GUIADA)
