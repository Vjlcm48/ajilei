// APU-1 1e · `STAKE_OPTIONS` SE RETIRA (rector 1e §2.3). Eran las cuatro
// apuestas de la app antes de NIV-UI; desde entonces las tablas por reto viven
// en `config/niveles.js` y esta lista sólo la leía `TableSelect`, que estaba
// fuera del recorrido desde 2026-08. Retirada la pantalla, la constante se
// queda sin un solo lector. Su última mención viva es el comentario de
// `config/salas.js:33`, que la nombra para decir que las del PvP NO son éstas.

export const AJILEI_CONFIG = {
  game: {
    playersMin: 2,
    playersMax: 5,
    deck: 'SPANISH_40',
    handSize: 5,
    maxBettingRounds: 3,
  },

  betting: {
    // Unidad por defecto del motor (`gameEngine.js:20`) cuando nadie le pasa una
    // apuesta de mesa. Se llamaba `entrada`, que era el nombre equivocado: no
    // tiene nada que ver con la entrada a la mesa, que es la de abajo.
    unidadPorDefecto: 10,
    apuestaMinima: 10,

    // APU-1 §10 — SELLADO.
    multiplicadores: [1, 2, 5, 10],             // §3.1, hoy literal en GameTable.jsx:1919
    // 1f-A4 · PISO 10× Y MEDIO 20×, decididos por Victor jugando (Parte B de
    // 1f). Eran 5× y 15×. El piso coincidía con el listón de la recarga
    // automática —los mismos 5× de `recarga.umbral`—, y eso hacía que quien
    // eligiera «Mínimo» cayera bajo el listón con la primera mano perdida: la
    // pregunta de recarga salía antes de que la mesa empezara a ser una mesa.
    // No era una entrada, era una recarga anticipada. El medio sube a 20× para
    // que las tres opciones sigan repartidas (10 · 20 · 50) y no se amontonen
    // las dos de abajo. El techo no se mueve.
    entrada: { piso: 10, medio: 20, techo: 50 }, // §2.2, múltiplos de la apuesta de mesa
    // El plazo pasa de 10 a 15 s por la misma razón y con la misma fuente: con
    // diez el jugador tenía que decidir mientras seguía leyendo el resultado de
    // la mano. El listón se queda en 5× — lo que sobraba era el piso, no él.
    recarga: { umbral: 5, plazoMs: 15000 },     // §5.1, «pila < 5 × unit», 15 s, defecto «no»

    // Retiradas en APU-1 1b (§10, clase RETIRAR): `subidaMinima`,
    // `subidaMaximaPorAccion`, `maximoPorRonda` y `allInEnabled` describían un
    // tope de subida que nadie leía (Fase 0, A-7: cero lectores). Las sustituye
    // el normativo: las subidas no tienen tope de número dentro de una ronda y
    // el monto legal lo fija `pozos.esLegal`.
  },

  ia: {
    // §2.3 — SELLADO por el rector al cerrar 1c-2 (decisión 3 de la orden de
    // 1c-2-iii). La pila de las IAS es PROPORCIONAL a la entrada del humano,
    // no la entrada más un margen fijo:
    //
    //     pila_IA = min( round( entrada_humano × factorPila ) , techo )
    //
    // POR QUÉ SE CAMBIA. `margenPila = 1.000` era una cifra fija en HC, y por
    // eso su EFECTO dependía de la profundidad: a 5× la mesa de 100 sentaba a
    // la IA con ×3,00 la pila del humano, a 15× con ×1,67 y a 50× con ×1,00.
    // Es decir, el mando que más pesa en V1 y V2 cambiaba de valor según la
    // entrada, sin que nadie lo eligiera. D-27 del informe 1c-2 lo midió: no
    // había entrada entre 5× y 50× en la que las dos mitades de V1 (o de V2)
    // pudieran cumplirse a la vez, y la culpable era esta línea.
    //
    // Con un FACTOR, la ventaja de la IA es la misma a toda profundidad: 1,5
    // veces la entrada, topada por el techo de la mesa. Quien entra al techo
    // se sienta exactamente igual que las IAS, igual que antes.
    factorPila: 1.5,

    // APU-1 §6 — cifras de TRABAJO de la Fase 1c, POR RETO.
    //
    // BÁSICO NEUTRO (decisión del rector, ficha 1c §0): en `basico` cada valor
    // es el NEUTRO —`false`, `null`, `0`— y con él la rama nueva ni se ejecuta
    // ni consume azar, así que la decisión cae en la lógica de NIV-2 sin
    // moverse una coma. Lo que lo sella es el test de oro de
    // `scripts/testNivel1.test.js` §1: si 1c moviera las curvas calibradas en
    // NIV-1, ese oro habría que re-derivarlo con el mismo agente que movió el
    // código, que es un guardián débil. Básico se enciende en 1d, con datos y
    // re-derivando el oro UNA vez.
    //
    // Avanzado y Pro llevan las cifras del normativo desde ya. Son de TRABAJO:
    // 1d las barre y las sella.
    subidaFuerte: {                                   // §6.3
      // Umbral de puntaje por tamaño de mesa: cuanta más gente, más alto.
      //
      // R-B (1c-2) · FORMA ANIDADA POR RETO. `aiPlayer.js:84` leía un solo mapa
      // para los tres retos, así que encender Básico le daba EL UMBRAL DE
      // AVANZADO y lo convergía con él: la caída de V3 pasaba de 38,02 a 0,84 pp
      // en mesa 4 (informe 1d, D.9 y D-17). La forma plana sigue valiendo y no
      // cambia ni una decisión; la anidada gana cuando existe.
      porMesa: {
        // SELLADO por el rector (informe 1c-2 §E): Avanzado + 2. Es
        // CONTRAINTUITIVO y lo explica D-23: un umbral BAJO hace que Básico
        // suba fuerte más veces, y eso lo vuelve más DIFÍCIL, no más fácil.
        // Con Av−8 la caída de V3 en mesa 4 era de 0,2 pp; con Av+2 es de 6,3.
        // No sube más porque D-13 («que Básico ponga dinero») lo frena: con
        // Av+2 el ×10 de Básico es la mitad del de Avanzado, no cero.
        basico:   { 2: 43, 3: 42, 4: 40, 5: 41 },
        // SELLADO por el rector (informe 1d §E): mesas 4 y 5 suben hasta que
        // vuelve a existir la franja del ×1 (V6) y el espejo de mesa 5 pasa de
        // 12 manos (V7). Mesas 2 y 3 ya daban banda +9 y +6.
        avanzado: { 2: 41, 3: 40, 4: 38, 5: 39 },
        pro:      { 2: 41, 3: 40, 4: 38, 5: 39 },
      },
      // Básico SE ENCIENDE, y lo gobierna R-D: sin humano en la mano no empuja.
      porReto: { basico: true, avanzado: true, pro: true },
    },

    // R-D (1c-2) · EL COMPROMISO DE FICHAS DEPENDE DE CONTRA QUIÉN SE JUEGA.
    //
    // Lo pide E.2b del informe 1d: con el juego de reglas de 1c, «que Básico
    // ponga dinero» (D-13) y «que una mesa de cinco Básicos no se liquide en 3
    // manos» (V7) son, medidos, incompatibles — la misma regla que hace a
    // Básico empujar contra el humano lo hace empujar contra los otros cuatro.
    // Con esto encendido, los pasos 2, 5 y 6 de la fila de APU-1 sólo se
    // evalúan con un humano vivo en la mano; entre IAS, Básico se queda en la
    // lógica de NIV-2 con ×1. Es una asimetría DECLARADA, no una trampa: la
    // mesa de entrenamiento no tiene por qué comportarse como la de juego.
    soloContraHumano: { basico: true, avanzado: false, pro: false },
    // §6.5 y §6.6 — fracción del pozo que se paga sin mirar el puntaje.
    // `null` = regla apagada (pero el all-in de §6.6 usa 0,25 como respaldo:
    // ahí Básico necesita alguna regla).
    // SELLADO (informe 1c-2 §E, con la V4 re-escrita por el rector a 40–60 %):
    // 0,33 es el MENOR de los tres candidatos que mete las doce celdas en
    // rango, que es lo que la ficha 1c-2 §0 pedía — arreglar V4 por el lado
    // del que paga, no del que farolea. 0,40 también las metía, pero subía las
    // quiebras por mano un tercio (D-26) sin comprar nada a cambio.
    fraccionPozo: { basico: 0.33, avanzado: 0.33, pro: 0.33 },
    allIn: {                                          // §6.6
      // Puntaje desde el que se empuja la pila aunque cueste más de la
      // fracción. `null` = solo por fracción del pozo.
      puntajeMin: { basico: null, avanzado: 31, pro: 31 },
    },
    farol: {                                          // §6.4
      // Tamaño del bloque de manos con UN farol sorteado. `null` = sin farol
      // por bloques (el farol con lectura de Pro, NIV-2 ⑥, sigue aparte).
      // SELLADO (informe 1c-2 §E): 12, 15 y 20 dan el mismo V4 (46,1 / 46,8 /
      // 47,8 %) y la misma mediana de V2. Ninguna vara pide moverlo.
      bloquePorReto: { basico: 15, avanzado: 12, pro: 8 },

      // R-A (1c-2) · PISO DE PUNTAJE PARA FAROLEAR, POR MESA.
      //
      // Lo pide D.4 y D-18 del informe 1d: ningún tamaño de bloque mete V4 en
      // rango, porque el bloque decide CUÁNDO se farolea y V4 pregunta CON QUÉ.
      // El histograma de 100.000 manos por celda dice que las subidas
      // respaldadas por menos de 26 puntos pierden entre el 65 y el 88 % de las
      // veces que alguien las paga, y que el acantilado está entre 25 y 30.
      //
      // Va POR MESA, como el umbral de §6.3: un piso único de 28 deja mesa 2
      // faroleando de menos (45 % → 36 %, por debajo del rango de V4).
      // Sin el mapa no hay piso y la conducta es exactamente la de 1c.
      //
      // SELLADO (informe 1c-2 §E). El barrido de §3.2 midió que el piso SÍ
      // funciona —sube el puntaje medio del farol duro de 23,2–24,1 a
      // 25,2–25,6 y recorta hasta un tercio de los faroles— pero que dentro
      // de 24…30 está SATURADO: los tres candidatos dan el mismo V4b, porque
      // compara `scoreEf` (ya inflado por la lectura viva) y no el puntaje
      // crudo. Eso es R-F, propuesta y NO escrita.
      pisoPuntajePorMesa: { 2: 26, 3: 28, 4: 28, 5: 28 },
    },
    // §6.8 — probabilidad de jugar lento con mano grande en BET_2 y cobrar en
    // BET_3. 0 = nunca.
    pasarConManoGrande: { basico: 0, avanzado: 0.15, pro: 0.25 },
    // §6.7 — el temperamento desplaza los dos umbrales de arriba. Ortogonal al
    // nivel (rector NIV-1 §5.5): el perfil dice CÓMO, el reto dice CUÁNTO.
    desplazamiento: {
      CONSERVADORA: +2, EQUILIBRADA: 0, AGRESIVA: -2, IMPREDECIBLE: 0,
    },
  },

  // APU-1 §6.9 · EL RITMO DE LAS IAS, POR PESO DE LA DECISIÓN (1e §3.3).
  //
  // Hasta aquí toda acción de IA esperaba lo mismo: 1.125 ms
  // (`GameTable.jsx`, `AI_ACTION_MS`), pasara lo que pasara. Una IA que pasa y
  // una IA que empuja su pila entera tardaban IGUAL, y eso le quita a la mesa
  // la única señal de tensión que no cuesta un píxel: el tiempo que el rival
  // se toma. `decidirIA` devuelve `peso` desde 1c justamente para esto.
  //
  // Son PRESENTACIÓN, no regla de juego: no entran al motor, no cambian ni una
  // decisión y el banco de niveles no las lee. Por eso viven en `ui` y no en
  // `ia`.
  //
  // Son RANGOS y no tres cifras, y la diferencia se oye. Tres valores fijos son
  // un metrónomo: la misma espera exacta, mano tras mano, delata que detrás hay
  // una tabla y no alguien pensando. Cada acción saca un uniforme dentro de su
  // banda, las bandas no se solapan —lo leve siempre es más rápido que lo
  // grande— y la de en medio sigue conteniendo el 1.125 de siempre, que es el
  // compas con el que se calibraron las tandas anteriores. El azar es de
  // PANTALLA: sale de `Math.random` y el motor no lo ve, así que ni una
  // decisión ni una siembra del banco cambian por esto.
  ui: {
    ritmoIA: { leve: [700, 1000], media: [1000, 1500], grande: [1500, 2200] },
  },

  economy: {
    // Forma corta de PRUEBAS y BANCO; no es economía del juego. Se llamó
    // `saldoInicial` mientras era las dos cosas a la vez —las fichas con que
    // nacía todo asiento Y el saldo del jugador—, y esa confusión es justo la
    // que APU-1 vino a deshacer: desde 1e las fichas de mesa salen de la
    // ENTRADA que el jugador elige (§2.2) y el saldo del jugador es, desde
    // ECO-1b, la billetera del servidor (`hooks/useBilletera.js`). Lo único que
    // queda aquí es la pila con la que el banco de niveles y las pruebas del
    // motor sientan a todo el mundo por igual, que es lo que hace honesta esa
    // comparación.
    pilaPruebas: 5000,
    // ECO-1b (B5) · al día con lo sellado (Reglas de ECO-1 §7): el video vale
    // 500 HC con un tope de 8 al día, y la constancia da 500 HC cada 3 días
    // seguidos de ingreso. `bonoDiario` (50) se retira: no existe en las reglas.
    // La verdad de estas cifras está en el servidor; aquí sólo dejan de
    // contradecirla.
    //
    // ECO-1g · `videoReward` y `maxVideosPerDay` son el ESPEJO de
    // `video_premio_hc()` y `video_tope_dia()` (la prueba de espejo de
    // `dev/bancoImitado.test.js` los compara con el SQL). El premio que se
    // pinta y se celebra es el que DICE EL SERVIDOR (`premio` en `mi_video` y
    // `cobrar_boleto`); `videoReward` sólo se lee mientras no ha contestado.
    // `maxVideosPerDay` sigue sin lectores: el tope lo trae `mi_video`.
    videoReward: 500,
    maxVideosPerDay: 8,
    // ECO-1g · lo que dura el video A LA VISTA (G4): sólo cuenta el tiempo con
    // la pestaña visible. El servidor exige 35 s desde que emite el boleto
    // (`video_minimo_s()`); los 5 de diferencia son para la latencia (S2). En
    // desarrollo con bypass lo acorta el mando `?apu=video:<ms>`.
    video: { duracionMs: 40000 },
    constancia: { monto: 500, dias: 3 },
  },
}