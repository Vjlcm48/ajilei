// ── IDI-0 · Diccionario ESPAÑOL · FUENTE ÚNICA de textos del lobby ───────────
// Documento rector: AJILEI_LOB1_Fase1_v1.1.md §2.1. Los valores son los de la
// lámina `AJILEI_LOB1_lamina_v1.3.html`, VERBATIM: la lámina es la autoridad
// visual sellada por Victor y el copy forma parte de lo que selló.
//
// LOS DEMÁS IDIOMAS SON MÓDULOS HERMANOS CON LAS MISMAS CLAVES. `textos.en.js`,
// `textos.pt.js`, `textos.fr.js` y `textos.it.js` nacerán en IDI-1 como copias
// de este archivo con los valores traducidos y NI UNA clave de más ni de menos.
// El test (`textos.test.js`) existe para que esa promesa sea verificable el día
// que haya un segundo diccionario, no sólo el día que se escriba.
//
// Módulo SIN React ni DOM, molde de `config/niveles.js` y `config/tapetes.js`:
// así lo importan igual la app, Vitest y —el día que haga falta— el arnés desde
// `node`, en vez de mantener una copia paralela de los rótulos. La lección es de
// ARN-1 y de `menuEntradas.js`: un arnés colgado de un texto se rompe con el
// próximo ajuste de copy.
//
// ── LAS CLAVES SON EL CONTRATO; LOS VALORES SON COPY ────────────────────────
// Misma doctrina que los `id` de `niveles.js` y `tapetes.js`: la clave no se
// renombra nunca, el valor lo ajusta Victor cuando quiera. Por eso el arnés se
// cuelga de `data-accion`, jamás del rótulo visible.
//
// ALCANCE: sólo el lobby. Esta fase NO externaliza el texto de ninguna otra
// pantalla — ni la mesa, ni la Portada, ni el Bautizo. Meterlas aquí sería
// convertir una plomería de 18 claves en una migración de toda la app.
export const TEXTOS_ES = {
  // ══ BIE-1 · La app entera, fuera de cualquier pantalla ══════════════════
  // Rector: AJILEI_BIE-1_Fase1_v1.0 §0 D7. `app.*` es lo que la app dice antes
  // de saber en qué pantalla está: hoy, sólo el indicador de la rama CARGANDO.
  // «Enviando…» y «Entrando…» de la Portada NO entran: son de IDI-1.
  'app.cargando':        'Cargando',

  // Los dos accesos al juego
  'lob.cta.ia':          'Jugar contra las IAS',
  'lob.cta.pvp':         'Jugar contra jugadores',
  'lob.cta.pronto':      'Próximamente',

  // Barra inferior
  'lob.nav.rankings':    'Rankings',
  'lob.nav.tienda':      'Tienda',
  'lob.nav.reglas':      'Cómo se juega',

  // El aviso de lo que todavía no existe
  'lob.toast.pronto':    'Pronto',

  // Hoja de configuración (⚙)
  'lob.cfg.titulo':      'Configuración',
  'lob.cfg.sonido':      'Sonido',
  'lob.cfg.idioma':      'Idioma',
  'lob.cfg.sugerencias': 'Enviar sugerencia',
  'lob.cfg.salir':       'Cerrar sesión',
  'lob.cfg.acerca':      'Acerca de',
  'lob.cfg.eliminar':    'Eliminar cuenta',
  'lob.acerca.sonidos':  'Sonidos y música:',

  // Nombres accesibles. Van en el diccionario y no en el JSX por la misma razón
  // que los visibles: un `aria-label` es texto que un lector de pantalla LEE en
  // voz alta, así que traducirlo no es opcional. Los tres valores salen de los
  // atributos de la lámina v1.3, verbatim.
  'lob.perfil.aria':     'Perfil',
  'lob.saldo.aria':      'Saldo de Heptacoins',
  'lob.ajustes.aria':    'Configuración',

  // ══ SAL-B1 · Las salas jugador contra jugador ═══════════════════════════
  // Rector: AJILEI_SAL-B1_Fase1_v1.0.md §6. Valores VERBATIM de las láminas
  // SAL-1 v1.2 y SAL-2 v1.2, selladas por Victor.
  //
  // ── LOS NOMBRES DE CLAVE NO SON LOS DE LA LÁMINA, Y ES DELIBERADO ───────
  // Las láminas escriben `sal.titulo`, `sal.codigo.*` y `sal.mesa.*`; la ficha
  // §6.2 manda cuatro sub-bloques —`sal.opciones.*`, `sal.armar.*`,
  // `sal.espera.*`, `sal.error.*`— y §5 declara que los nombres son contrato.
  // El orden de autoridad de la ficha resuelve el empate sin inventar nada: la
  // ficha manda en los NOMBRES, la lámina en los VALORES. Sin el prefijo, el
  // `sal.armar` de SAL-1 (un rótulo de botón) y el `sal.armar.titulo` de SAL-2
  // convivirían en el mismo espacio de nombres sin parentesco real.

  // ── SAL-1 · SalaOpciones ────────────────────────────────────────────────
  'sal.opciones.titulo':          'Jugar contra jugadores',
  'sal.opciones.codigo.titulo':   '¿Te invitaron? Pega tu código',
  'sal.opciones.codigo.entrar':   'Entrar',
  'sal.opciones.codigo.aria':     'Código de invitación',
  'sal.opciones.mesas.titulo':    'Mesas formándose ahora',
  'sal.opciones.mesa.de':         'Mesa de {n}',
  'sal.opciones.mesa.apuesta':    '{hc} HC por mano',
  // ── LA ÚNICA CLAVE QUE NO ES VERBATIM, Y POR QUÉ ────────────────────────
  // La lámina dice `'{x}/{n} sentados · {t}'`, con una cuenta atrás que late
  // cada segundo. La ficha §3.3 enumera la tarjeta sin tiempo y §4 manda el
  // cronómetro entero a B2. Victor resolvió la contradicción el 7-sep-2026 a
  // favor de la ficha: en B1 la tarjeta no cuenta. El `{t}` vuelve en B2, que
  // es cuando existe el reloj vivo que puede sostenerlo — `salas_abiertas()` ya
  // devuelve `expira_en` y `useReloj` ya sabe restar, así que lo que falta es
  // el latido, no el dato.
  'sal.opciones.mesa.estado':     '{x}/{n} sentados',
  'sal.opciones.mesa.unirme':     'Unirme',
  'sal.opciones.mesa.faltan':     'Te faltan {hc} HC',
  'sal.opciones.mesas.vacio':     'Nadie está armando mesa ahora',
  'sal.opciones.mesas.vacio.sub': 'Arma la tuya y comparte el código',
  'sal.opciones.armar':           'Armar una mesa',
  'sal.opciones.armar.nota':      'Privada con código, o abierta a quien quiera unirse',

  // ── SAL-2 · ArmarMesa ───────────────────────────────────────────────────
  'sal.armar.titulo':        'Armar una mesa',
  'sal.armar.jugadores':     'Jugadores',
  'sal.armar.apuesta':       'Apuesta HC por mano',
  'sal.armar.como':          '¿Cómo la llenamos?',
  'sal.armar.privada':       'Privada',
  'sal.armar.privada.d':     'Con código para compartir. Solo entra quien lo tenga.',
  'sal.armar.abierta':       'Abierta',
  'sal.armar.abierta.d':     'Visible para todos. Entra quien quiera.',
  'sal.armar.cta.privada':   'Crear mesa privada',
  'sal.armar.cta.abrir':     'Abrir mesa',
  'sal.armar.cta.unirme':    'Unirme a esa mesa',
  'sal.armar.nota.5x':       'Necesitas {min} HC para sentarte a {hc}',
  'sal.armar.nota.unirme':   '¡Qué suerte! Hay una mesa de {n} a {hc} HC con asientos libres ({x}/{n}).',
  'sal.armar.aviso.nuevos':  'Con {hc} HC, un invitado nuevo ({bono} HC de bienvenida) no podrá sentarse. Para invitar gente nueva, usa {alcance} HC.',
  'sal.armar.recuerdo':      'Hay una mesa de {n} a {hc} HC esperando gente ({x}/{n}).',

  // ── SAL-3 · SalaEspera ───────────────────────────────────────────────────
  // SAL-B2 F1b (rector §7): la pantalla real sustituye al stub de B1. Se
  // CONSERVAN con su nombre del repo las claves que B1 declaró contrato
  // (`anfitrion.tu`, `codigo.copiar`, `codigo.copiado`, `sentados`, `cancelar`,
  // `cancelar.si`, `cancelar.no`, `salir`, `lobby`, `titulo`, `tipo.*`); se
  // RETIRAN las cuatro que sólo el stub usaba (`actualizar`, `provisional`,
  // `arranco`, `anfitrion.otro`); ENTRAN, con los nombres del `DICC` de la
  // lámina v1.5, las que la pantalla real pinta. Los textos son los de la
  // lámina, verbatim, salvo `cancelar.p`, corregido por el rector: los demás
  // NO vuelven a la sala de opciones, leen el final en la misma pantalla.
  //
  // ── AJUSTES (lámina v1.6, tras la validación con dos teléfonos) ─────────
  // · `vacia` pasa de «Esperando…» a «Libre»: a 360px de ancho el bloque de la
  //   silla mide 1.6·silla y la palabra larga se truncaba a «Esperand…»
  //   (informe de F1b §9-7). El texto corto cabe y dice lo mismo.
  // · se RETIRAN `salio` y `lobby`, las dos sin un solo consumidor en `src/`
  //   ni en `scripts/` (decisión de Victor sobre el informe de F1b §9-6): el
  //   invitado que sale abandona la pantalla en el mismo gesto, y el rótulo
  //   «Volver al inicio» del stub de partida es `sal.partida.volver`.
  // · `fin.cerraste` del diccionario de la v1.6 NO entra: con la regla nueva
  //   (`finDe` mira quién mira) no hay camino en el que el anfitrión que cerró
  //   siga en la pantalla para leerla.
  //
  // `compartir.url` NO es texto: el enlace lo construye `enlaceDeSala` con el
  // mismo parámetro que `recogerDeLaUrl()` lee, y así las dos puntas no pueden
  // separarse por una cadena.
  'sal.espera.titulo':          'Mesa de {n} · {hc} HC por mano',
  'sal.espera.anfitrion.tu':    'Eres el anfitrión · {tipo}',
  'sal.espera.sub.inv':         'Anfitrión: {anf} · {tipo}',
  'sal.espera.tipo.privada':    'Privada',
  'sal.espera.tipo.abierta':    'Abierta',
  'sal.espera.cod.eti':         'Código de invitación',
  'sal.espera.codigo.copiar':   'Copiar el código',
  'sal.espera.codigo.copiado':  'Copiado',
  'sal.espera.abierta.rot':     'Mesa abierta · visible para todos',
  'sal.espera.compartir':       'Compartir',
  'sal.espera.compartir.msg':   'Ven a jugar AJILEI conmigo: mesa de {n} a {hc} HC. Entra por aquí: {url}',
  'sal.espera.sentados':        '{x}/{n} sentados',
  'sal.espera.anfitrion':       'Anfitrión',
  'sal.espera.tu':              'Tú',
  'sal.espera.vacia':           'Libre',
  'sal.espera.jugar':           'Jugar ya',
  'sal.espera.jugar.nota':      'Se juega con los que estén sentados',
  'sal.espera.jugar.min':       'Hacen falta al menos 2',
  'sal.espera.esperando':       'Esperando al anfitrión…',
  'sal.espera.salir':           'Salir de la mesa',
  'sal.espera.salir.inv':       'Puedes salir cuando quieras; tu silla queda libre',
  'sal.espera.cancelar':        '¿Cancelar la mesa?',
  'sal.espera.cancelar.p':      'Eres el anfitrión: si sales, la mesa se cierra para todos.',
  'sal.espera.cancelar.si':     'Sí, cancelar',
  'sal.espera.cancelar.no':     'Seguir esperando',
  'sal.espera.llego':           '{quien} se sentó',
  'sal.espera.consejo.1':       'Se juega con los que estén sentados cuando el reloj llegue a cero',
  'sal.espera.consejo.2':       'En mesas de 4 y 5 jugadores entra el comodín',
  'sal.espera.consejo.3':       'Para sentarte necesitas 5 veces la apuesta de la mesa',
  'sal.espera.consejo.4':       'El anfitrión puede arrancar desde 2 jugadores con «Jugar ya»',
  'sal.espera.consejo.5':       'Copia el código o comparte el enlace por WhatsApp: sienta a tu invitado aquí mismo',
  'sal.espera.llena':           '¡Mesa completa! Arranca sola',
  'sal.espera.llena.corta':     '¡Mesa completa!',
  'sal.espera.llena.nota':      'Ya no hace falta «Jugar ya»',
  'sal.espera.fin.cancelada':   'El anfitrión cerró la mesa',
  'sal.espera.fin.vencida':     'La mesa se cerró: no llegó gente a tiempo',
  'sal.espera.fin.activa':      '¡Arranca la partida!',
  'sal.espera.fin.volver':      'Buscar otra mesa',
  'sal.espera.fin.entrar':      'Entrar a la mesa',
  'sal.espera.fin.entrar.nota': 'Partida PvP · Próximamente',

  // ── Partida PvP · el stub que releva a la sala cuando la mesa arranca ────
  // SAL-B2 F1b (rector §5). MES-PvP lo reemplaza con su propio nombre.
  'sal.partida.pronto':  'Partida PvP · Próximamente',
  'sal.partida.volver':  'Volver al inicio',

  // ── Navegación compartida por las tres pantallas ────────────────────────
  'sal.volver.aria':  'Volver',
  'sal.casa.aria':    'Volver al inicio',

  // ══ Los nueve errores del servidor, y el décimo que no lo es ════════════
  // Rector §6.3. Uno por cada `raise exception … using errcode = 'P0001'` de
  // `20260905203158_sal_a_salas.sql`; la lista es la misma —y en el mismo
  // orden— que `CLAVES_ERROR` de `lib/salasApi.js`, y el test lo comprueba.
  //
  // ── EL TONO: QUÉ PASÓ Y QUÉ HACER ──────────────────────────────────────
  // Ninguno enseña el nombre técnico. `sala_llena` es un identificador para el
  // programa; lo que el jugador necesita leer es «Esa mesa ya está llena» y,
  // cuando hay algo que hacer, qué. Ninguno culpa al jugador de un fallo que
  // no cometió: una sala que venció mientras tecleaba no es un error suyo.
  //
  // NINGUNO LLEVA VARIABLES, y es una decisión. Estos textos se pintan desde
  // cinco sitios distintos —la tarjeta, el campo de código, los tres CTA— y un
  // `{hc}` obligaría a que los cinco supieran pasarlo; el que se olvidara
  // pintaría `⟦hc⟧` en la cara del jugador. Donde hacen falta cifras, la
  // pantalla añade su propia nota con la clave que sí las lleva
  // (`sal.armar.nota.5x`).
  'sal.error.no_autenticado':      'Tu sesión se cerró. Vuelve a entrar para seguir jugando.',
  'sal.error.ya_en_sala':          'Ya estás en una mesa. Sal de ella antes de entrar en otra.',
  'sal.error.saldo_insuficiente':  'No te alcanza para sentarte a esa mesa.',
  'sal.error.sala_no_disponible':  'Esa mesa ya no está. Puede que arrancara o que la cancelaran.',
  'sal.error.sala_llena':          'Esa mesa ya está llena. Prueba con otra.',
  'sal.error.demasiados_intentos': 'Demasiados códigos seguidos. Espera un minuto y vuelve a probar.',
  'sal.error.no_eres_anfitrion':   'Solo quien armó la mesa puede hacer eso.',
  'sal.error.faltan_jugadores':    'Hace falta alguien más para arrancar.',
  // Verbatim de la lámina SAL-1 (`sal.codigo.invalido`): es el aviso que Victor
  // selló bajo el campo y el error que la base lanza son la misma cosa dicha
  // desde los dos lados, así que se dicen con el mismo texto.
  'sal.error.codigo_invalido':     'Código no encontrado o mesa ya iniciada',
  // El décimo, y el ÚNICO genérico: lo que no viene de una regla del juego —red
  // caída, sesión vencida, un 500—. Se distingue a propósito de los nueve
  // porque la respuesta del jugador es distinta: «vuelve a intentarlo», no
  // «elige otra mesa».
  'sal.error.desconocido':         'Algo falló. Vuelve a intentarlo.',

  // ══ APU-1 1e · «RETAR A LAS IAS» ═════════════════════════════════
  // Rector: AJILEI_APU-1_Fase1e_v1.0.md §2.4. El prefijo `ia.` es el tercero del
  // diccionario, junto a `lob.` y `sal.`, y cubre la pantalla de entrada a la
  // mesa contra máquinas. Las pantallas que releva —`NivelSelect` y
  // `ModeSelect`— tenían su copy incrustado en el JSX; al retirarlas, lo que
  // sobrevive entra aquí como clave.
  //
  // Los RÓTULOS DE LOS TRES RETOS NO ESTÁN AQUÍ, y no es un olvido: viven en
  // `config/niveles.js` con sus `id` de contrato desde NIV-UI, que es la fuente
  // única que ese documento selló. Duplicarlos sería abrir la puerta a que el
  // chip diga una cosa y el ranking otra.
  'ia.retar.titulo':          'Retar a las IAS',
  'ia.retar.reto':            'Reto',
  'ia.retar.jugadores':       'Jugadores',
  'ia.retar.apuesta':         'Apuesta HC por mano',
  'ia.retar.entrada':         '¿Con cuánto entras?',

  // Los tres montos con nombre. La cifra la calcula `entrada.js` (10× · 20× ·
  // 50× la apuesta de mesa desde 1f-A4; eran 5× · 15× · 50×) y el texto sólo la
  // coloca: escribirla aquí sería dejar cuatro frases que mentirían el día que
  // el normativo mueva un múltiplo — y 1f-A4 es ese día.
  'ia.retar.entrada.piso':    'Mínimo {hc}',
  'ia.retar.entrada.medio':   'Medio {hc}',
  'ia.retar.entrada.techo':   'Techo {hc}',
  'ia.retar.entrada.otra':    'Otra…',
  'ia.retar.entrada.menos':   'Bajar la entrada una apuesta',
  'ia.retar.entrada.mas':     'Subir la entrada una apuesta',

  // La nota de comodín que daba `ModeSelect` en cada tarjeta de mesa. Aquí es
  // una sola línea bajo la fila, porque el chip elegido ya dice cuál es.
  'ia.retar.comodin.si':      'Con esta mesa juega el comodín (7 de Oros).',
  'ia.retar.comodin.no':      'Sin comodín: el 7 de Oros es una carta más.',

  // Lo que la cuarta fila promete antes de pulsar. Sale de `entrada.pilaIA`.
  'ia.retar.aviso.pila':      'Cada IA se sienta con {hc} HC.',

  // El CTA dice las tres decisiones en voz alta, que es lo que lo convierte en
  // una confirmación y no en un botón. Dos frases y no un plural calculado: el
  // español no pluraliza las siglas con una `s`.
  'ia.retar.cta':             'Retar a {n} IAS · mesa {hc} · entras con {entrada}',
  'ia.retar.cta.una':         'Retar a 1 IA · mesa {hc} · entras con {entrada}',
  'ia.retar.cta.vacio':       'Elige tu mesa',
  'ia.retar.cta.falta':       'Elige reto, jugadores, apuesta y entrada.',

  // ── RET-A · El aviso de saldo ─────────────────────────────────────────────
  // Releva a `ia.retar.aviso.saldo`, que explicaba el gris mesa a mesa y en
  // naranja. Lo que faltaba no era la explicación —el chip apagado ya la da—
  // sino la salida, y son estas dos frases más el botón que va debajo.
  //
  // `{reto}` es el RÓTULO del nivel y sale de `niveles.js`, que es donde NIV-UI
  // selló los tres nombres. `retarCore.avisoDeSaldo` devuelve el id y la
  // pantalla lo traduce: aquí no hay ninguna lista de retos que mantener.
  //
  // Ninguna de las dos culpa al jugador ni usa el rojo de los errores: un
  // bolsillo corto no es un fallo, es un estado del que se sale.
  'ia.retar.saldo.reto':      'Tu saldo no alcanza para este reto. Puedes jugar en {reto} o conseguir más monedas.',
  'ia.retar.saldo.ninguno':   'Te faltan fichas para sentarte en una mesa.',
  'ia.retar.saldo.cta':       'Conseguir más monedas',

  // ECO-1b · la cifra viene del servidor y puede tardar o fallar. Mientras
  // tarda, el CTA de Retar se apaga y su nota lo dice; si la lectura falla sin
  // ninguna cifra conocida, un aviso lo dice y ofrece reintentar (ajuste 1 del
  // rector). Ninguna enseña un número: no se inventa un saldo.
  'ia.retar.saldo.cargando':   'Cargando tu saldo…',
  'ia.retar.saldo.error':      'No pudimos leer tu saldo. Revisa tu conexión.',
  'ia.retar.saldo.reintentar': 'Reintentar',

  // ECO-1c · sentarse es una llamada al servidor (`sentarse_ia`). Mientras
  // contesta, el CTA lo dice; si no contesta, la nota lo dice y el mismo CTA
  // reintenta con el mismo token (no cobra dos veces).
  'ia.retar.sentando':         'Sentando…',
  'ia.retar.sentarse.red':     'No pudimos abrir la mesa. Revisa tu conexión y vuelve a intentarlo.',
  'ia.retar.sentarse.saldo':   'Tu saldo no alcanza para esta entrada.',
  'ia.retar.sentarse.otro':    'No pudimos abrir la mesa. Vuelve a intentarlo.',
  // ECO-1d · K7: tras un minuto de reintentos con el mismo token. K8: la
  // válvula, encendida desde el SQL Editor (texto provisional de la ficha 1d).
  'ia.retar.sentarse.limite':  'Demasiados intentos seguidos. Espera un momento y vuelve a intentarlo.',
  'ia.retar.sentarse.tope':    'Llegaste al tope de hoy contra las IAS. Vuelve mañana o juega contra jugadores.',

  // Los tres motivos de `entrada.entradaValida` más el cuarto que añade la
  // pantalla (§2.2). El motor no puede juzgar el bolsillo —no lo conoce— y por
  // eso `sin_saldo` nace en `retarCore` y no en `entrada.js`.
  'ia.entrada.monto_invalido': 'La entrada va de apuesta en apuesta.',
  'ia.entrada.bajo_piso':      'El mínimo para sentarte es {hc} HC.',
  'ia.entrada.sobre_techo':    'El máximo para sentarte es {techo} HC.',
  'ia.entrada.sin_saldo':      'No te alcanza: tienes {saldo} HC.',

  // ── 1e-ii · LA MESA ───────────────────────────────────────
  // Los rótulos de la mesa siguen siendo literales dentro de `GameTable.jsx`
  // —«Pasar», «Igualar (N)», «Subir a N»— y esta tanda NO los muda: mover texto
  // vivo a diccionario es una tanda propia (IDI-1) y mezclarla con la del
  // all-in haría ilegible el diff de las dos. Lo que sí entra aquí es TODO lo
  // que 1e-ii estrena, que es la regla de la ficha §1.
  //
  // El monto del botón es la pila ENTERA, que es lo que el all-in cuesta.
  // Decirlo importa: es la única acción de la mesa que no se puede deshacer ni
  // dosificar, y el jugador tiene derecho a ver la cifra antes de pulsarla.
  'ia.mesa.allin':             'All-in ({hc})',
  // La marca del asiento. Seis caracteres y en versales porque va en una ranura
  // de 151 px de ancho y 18 de alto: medida antes de escribirla, ocupa 69,56.
  'ia.mesa.marca.allin':       'ALL-IN',
  // Y la del humano, que no tiene ranura sino fila de botones — y en all-in la
  // fila está vacía. Sin esta frase veía «La IA está pensando…» y ninguna
  // explicación de por qué a él no le toca. La segunda mitad no es adorno: es
  // la diferencia entre estar en all-in y estar retirado.
  'ia.mesa.humano.allin':      'Estás all-in — tus cartas siguen jugando.',

  // ── 1e-ii · LA RECARGA (§5) ──────────────────────────────────
  // Tres formas de la misma pregunta, y el subtítulo es lo único que las
  // distingue de verdad: la voluntaria informa, la automática avisa y la
  // forzosa constata. Ninguna de las tres empuja a gastar —no hay «¡sigue
  // jugando!» en ninguna—, que es posicionamiento de la casa y no cortesía.
  //
  // 1f-A3 · LOS DOS SUBTÍTULOS BLANDOS DICEN LA PROMESA DE §5.3. Hasta 1f la
  // decía sólo `ia.recarga.nivelado`, en una línea aparte que el teléfono
  // retira por falta de sitio (1f-A2): la promesa se quedaba sin decir justo
  // donde va a jugar casi todo el mundo. Se muda al subtítulo, que siempre se
  // pinta. Lo que sale para hacerle sitio es la pregunta «¿Recargas antes de
  // la próxima mano?»: la hacen los dos botones que hay debajo, y un renglón
  // no puede gastarse en repetir lo que el jugador ya está mirando. La forzosa
  // no la lleva porque ahí no hay nivelación que prometer: o se recarga o se
  // sale de la mesa.
  //
  // 1f-A4 · LAS DOS ACABAN EN «Las IAS se nivelan contigo.», que es la frase
  // entera. A3 la había recortado a «se nivelan» para ganar margen, y el rector
  // devolvió «contigo» al cerrar la Parte B: sin él, «las IAS se nivelan» puede
  // leerse como que se nivelan ENTRE ELLAS, que es justo lo contrario de lo que
  // §5.3 promete. El sitio da para las dos —A3 midió la automática con «contigo»
  // en 72,58 px de margen sobre un hueco de 332—, así que lo que se acorta es la
  // PRIMERA mitad: «Quedan {hc} HC.» y «Hasta {hc} HC más.». El renglón se mide
  // con cinco cifras, que es el peor caso que el producto puede emitir
  // (`topeRecarga` está acotado por `techoDe(unit)`, 50 × 1.000 = 50.000).
  //
  // Lo que salió para hacer sitio, en A3, fue la pregunta «¿Recargas antes de la
  // próxima mano?»: la hacen los dos botones que están justo debajo.
  'ia.recarga.titulo':         'Recargar fichas',
  'ia.recarga.sub.voluntaria': 'Hasta {hc} HC más. Las IAS se nivelan contigo.',
  'ia.recarga.sub.automatica': 'Quedan {hc} HC. Las IAS se nivelan contigo.',
  'ia.recarga.sub.forzosa':    'Con estas fichas la mesa no puede continuar.',
  // REC-2 · caso 3: la forzosa SIN saldo usable. La tarjeta es de sólo salida
  // (no hay primario), y el subtítulo dice las dos razones a la vez para que
  // «Salir con mis fichas» no parezca una elección que se podía evitar.
  'ia.recarga.sub.sinsaldo':   'Con estas fichas la mesa no puede continuar y no te queda saldo para recargar.',
  'ia.recarga.opcion.piso':    'Mínimo {hc}',
  'ia.recarga.opcion.medio':   'Medio {hc}',
  'ia.recarga.opcion.techo':   'Al techo {hc}',
  'ia.recarga.si':             'Recargar {hc}',
  // REC-2 · caso 2: ninguno de los tres montos cabe en el saldo, y la fila se
  // sustituye por uno solo, todo el saldo usable (v1.3 §5.2). La nota va bajo
  // el primario y sólo cuando el monto ES todo el saldo usable; si lo cortara
  // el techo, el primario vuelve a `ia.recarga.si` y no hay nota.
  'ia.recarga.si.todo':        'Recargar todo ({hc})',
  'ia.recarga.todo.nota':      'Es todo tu saldo disponible.',
  'ia.recarga.no':             'No recargar',
  // En la forzosa, decir que no NO es «seguir sin recargar»: es levantarse. Se
  // nombra por lo que hace, y se nombra con lo que el jugador se lleva —que por
  // §2.5 son sus fichas enteras—, para que nadie crea que pierde algo por irse.
  'ia.recarga.no.forzosa':     'Salir con mis fichas',
  'ia.recarga.plazo':          'Se cierra en {s} s',
  'ia.recarga.pedir':          'Recargar',
  // REC-1 · la burbuja (normativo v1.2 §5.5). Su rótulo visible es el mismo
  // «Recargar» de `ia.recarga.pedir`, que se reutiliza; lo propio es el pliegue
  // de la tarjeta y lo que oye un lector de pantalla, que no ve el anillo.
  'ia.recarga.vermesa':        'Ver la mesa',
  'ia.recarga.aria.forzosa':   'Recargar fichas, quedan {s} segundos',
  'ia.recarga.aria.automatica': 'Recargar fichas (opcional), quedan {s} segundos',
  // ECO-1c · la recarga se cobra en el servidor: las fichas llegan cuando
  // contesta. Mientras, el botón lo dice; si no contesta, se dice y se ofrece
  // reintentar (la misma recarga, que no se cobra dos veces).
  'ia.recarga.enviando':       'Recargando…',
  'ia.recarga.error.red':      'No pudimos confirmar la recarga.',
  'ia.recarga.reintentar':     'Reintentar',
  'ia.recarga.error.saldo':    'Tu saldo ya no alcanza para esa recarga.',
  'ia.recarga.error.otro':     'La recarga no se pudo hacer.',
  // P-2b · a los 10 s sin respuesta. El segundo botón pasa a ser
  // `ia.recarga.no.forzosa` («Salir con mis fichas»): salir es posible y no
  // pierde nada, porque si la recarga entra la salida la lleva (P-2a).
  'ia.recarga.error.tope':     'El servidor no responde. Si la recarga entra, sus fichas van contigo.',
  // ECO-1d · P-3 · la válvula: hoy ya no se recarga contra las IAS. La mesa
  // sigue y se paga completa. En la forzosa sólo queda salir.
  'ia.recarga.error.tope_diario':         'Llegaste al tope de hoy contra las IAS: hoy no se puede recargar. Sigue con tus fichas o sal con ellas.',
  'ia.recarga.error.tope_diario.forzosa': 'Llegaste al tope de hoy contra las IAS: hoy no se puede recargar. Tus fichas vuelven a tu saldo.',
  'ia.recarga.seguir':         'Seguir sin recargar',
  // 1f-A4 · `ia.recarga.nivelado` SE RETIRA. Era la promesa de §5.3 en un
  // renglón aparte, y desde A3 la dicen los dos subtítulos blandos. En el
  // teléfono no se pintaba (no cabía) y en escritorio se pintaba justo debajo
  // del subtítulo que ya lo decía: la misma frase dos veces seguidas (E-31).
  // Una sola voz en todas las pantallas. Con la clave se van el `<p>` de
  // `GameTable.jsx` y las reglas `.apu-nota` de `apu.css`.

  // ── ECO-1c · El aviso de saldo (lámina `laminas/eco1c`, aprobada) ────────
  // El dinero que vuelve FUERA de la mesa: la partida recogida al arrancar
  // (a), la que cerró otro dispositivo (b, C6) y la vieja que cierra el
  // sentarse (c, C5). `{hc}` lo pinta el componente en oro. La 1d lo reusará
  // para la constancia; el video de recompensa no.
  'aviso.saldo.recogida':      'Volvieron {hc} HC de tu partida anterior.',
  'aviso.saldo.recogida.cero': 'Tu partida anterior quedó cerrada. No quedaban fichas en la mesa.',
  'aviso.saldo.otro':          'Abriste otra partida en otro dispositivo. Volvieron {hc} HC.',
  'aviso.saldo.otro.cero':     'Abriste otra partida en otro dispositivo. No quedaban fichas en la mesa.',

  // ── ECO-1d · La constancia (lámina `laminas/eco1d`, ubicación A, aprobada) ──
  // El aviso sale sólo el día del cobro (K4, el texto de la escena d de la
  // 1c); la ficha del lobby se lee así en un lector de pantalla.
  'aviso.saldo.constancia':    '+{hc} HC por tu constancia.',
  'lob.constancia.aria':       'Constancia: día {d} de 3',
}

export default TEXTOS_ES
