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
  // Los dos accesos al juego
  'lob.cta.ia':          'Jugar contra la IA',
  'lob.cta.pvp':         'Jugar contra jugador',
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
  'sal.opciones.titulo':          'Jugar contra jugador',
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

  // ── SAL-3 · SalaEspera · SÓLO lo que el stub usa ────────────────────────
  // El stub de §7 es provisional y B2 lo reemplaza entero. Aquí no se siembran
  // las claves de la lámina SAL-3 que todavía no tienen consumidor: una clave
  // sin pantalla es una promesa que nadie puede comprobar.
  'sal.espera.titulo':          'Mesa de {n} · {hc} HC por mano',
  'sal.espera.anfitrion.tu':    'Eres el anfitrión · {tipo}',
  'sal.espera.anfitrion.otro':  'Estás en la mesa · {tipo}',
  'sal.espera.tipo.privada':    'Privada',
  'sal.espera.tipo.abierta':    'Abierta',
  'sal.espera.codigo.copiar':   'Copiar el código',
  'sal.espera.codigo.copiado':  'Copiado',
  'sal.espera.sentados':        '{x}/{n} sentados',
  'sal.espera.actualizar':      'Actualizar',
  'sal.espera.provisional':     'Sala de espera en construcción',
  'sal.espera.salir':           'Salir de la mesa',
  'sal.espera.cancelar':        '¿Cancelar la mesa?',
  'sal.espera.cancelar.si':     'Sí, cancelar',
  'sal.espera.cancelar.no':     'Seguir esperando',
  'sal.espera.arranco':         'La mesa arrancó · Partida PvP · Próximamente',
  'sal.espera.lobby':           'Volver al inicio',

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
}

export default TEXTOS_ES
