// ── MOV-1b-a · Entradas del menú de utilidades: contrato sellado ─────────────
// Documento rector: docs/AJILEI_Menu_Utilidades_v1.1.md §6 (estados de entrada)
// e instrucción MOV-1b-a. FUENTE ÚNICA que consumen la app Y el arnés, nunca
// una copia paralela — molde de config/consultas.js, config/tapetes.js y
// config/reacciones.js. Módulo sin React ni DOM, para que `node` lo importe tal
// cual y el modo `menu-movil` derive sus expectativas de aquí en vez de
// repetirlas a mano.
//
// POR QUÉ UNA LISTA Y NO UN BOOLEANO. La frontera entre las dos ramas ya se ha
// movido dos veces —MOV-1a la dejó en "sólo Sonido", MOV-1b-a mete Tapetes y
// Mano actual— y volverá a moverse en MOV-1b-c con Reacciones. Un booleano
// llamado por lo que había ese día (`soloSonido`) envejece en cada tanda y
// obliga a renombrarlo o a mentir; una lista de IDs no.
//
// LOS IDs SON EL CONTRATO y no se renombran nunca. Los rótulos visibles viven
// en el `title` de cada entrada y son copy declarado PROVISIONAL, así que colgar
// la lógica de ellos sería el defecto de fondo que ARN-2 desmontó en `msg`:
// una puerta atada a un texto se rompe con el próximo ajuste de redacción.
export const ENTRADA = {
  SONIDO: 'sonido',
  REACCIONES: 'reacciones',
  TAPETES: 'tapetes',
  SALDO: 'saldo',
  MANO: 'mano',
  // SUP-2b · La cuenta del jugador: su nombre, cambiarlo y cerrar sesión. ID
  // NUEVO, como manda la adenda de Fase 1 — ninguno de los cinco de arriba se
  // renombra, que es el contrato que abre este archivo.
  CUENTA: 'cuenta',
  // El BADGE de consultas gratis. No es una entrada del panel: es un control
  // propio, con su propia superficie flotante, alojado DENTRO de la entrada
  // "Mano actual". Tiene ID propio porque puede estar vivo o no con
  // independencia de ella — y hoy lo está sólo en escritorio.
  CONTADOR: 'contador',
}

// Escritorio: todo vivo menos Saldo, inerte por diseño desde la v1.0 §3. Es
// también el valor por defecto del panel, así que la rama de escritorio no pasa
// la prop y su render queda idéntico al de antes de esta tanda.
// SUP-2b · CUENTA entra en las DOS listas a la vez, y es la primera entrada de
// la historia del panel que lo hace. No es descuido del puerto móvil: su
// superficie no es un satélite anclado con pinza —como el popup del contador o
// el selector de reacciones, que es por lo que aquéllos se quedaron fuera— sino
// un modal centrado en el viewport, que cabe igual en las cuatro celdas móviles
// que en escritorio. Lo que no cabe es que un jugador sólo pueda salir de su
// cuenta desde un tamaño de pantalla.
export const VIVAS_ESCRITORIO = [
  ENTRADA.SONIDO, ENTRADA.REACCIONES, ENTRADA.TAPETES, ENTRADA.CUENTA,
  ENTRADA.MANO, ENTRADA.CONTADOR,
]

// Móvil, a MOV-1b-c. Queda UNA sola ausencia, y por su superficie, no por su
// función: el popup del CONTADOR se ancla al propio badge, y en horizontal el
// panel vive en el filo izquierdo de la pantalla, así que el aviso se saldría.
// El SALDO de consultas sí es el mismo —una sola clave, un solo contador de
// 20— y la cifra se dice al consultar, en la última línea del aviso.
//
// REACCIONES entra aquí en MOV-1b-c. La razón por la que faltaba —el selector
// de escritorio mide 732,56px de ancho y no cabe en ninguno de los cuatro
// viewports móviles— la resuelve la LISTA de cuatro visibles con
// desplazamiento (242×186, lámina aprobada por Victor), que es la misma rejilla
// gobernada por `--dsk-u2-cols` con una sola columna.
export const VIVAS_MOVIL = [
  ENTRADA.SONIDO, ENTRADA.REACCIONES, ENTRADA.TAPETES, ENTRADA.CUENTA, ENTRADA.MANO,
]

// ── SUP-2b · Un eje NUEVO: qué entradas MONTAN ───────────────────────────
// Hasta hoy este archivo tenía un solo eje —quién está VIVA— y todas las
// entradas montaban en las dos pieles: una entrada apagada seguía ocupando sus
// 44px. Esta lista abre el segundo eje, y lo abre porque la GEOMETRÍA lo obliga,
// no porque convenga:
//
//   En móvil HORIZONTAL el panel vive en el corredor izquierdo, entre el filo de
//   la pantalla y la mano del jugador, y ese corredor termina donde empieza el
//   bloque de saldo del humano: 245,72px libres a 640×360 y 257,34 a 812×375
//   (MEDIDO). Cinco filas caben —244—; seis no —288—, y el panel se metía
//   709,04px² dentro del saldo. Tapar el saldo es defecto con nombre en esta
//   casa: es lo que puso `.player-bar-right` en los techos de D6 y lo que
//   MOV-1a-c persiguió cuando eran 4,3px.
//
// SE DESCARTÓ EL DESPLAZAMIENTO INTERNO, que era la salida de U2 para su lista
// de doce reacciones. Aquí no vale: con cinco visibles de seis, la que queda
// fuera es "Mano actual" —la entrada premium— y el arnés lo cantó en las ocho
// celdas horizontales, porque una entrada tras el desplazamiento no gana su
// propio hit-test. Un menú de seis con una escondida es peor que uno de cinco.
//
// LA CUENTA NO SE PIERDE EN MÓVIL: sigue en el ⋮ en VERTICAL —ahí el panel
// cuelga del disparador con sitio de sobra— y en el acceso de la Bienvenida, que
// se conserva por debajo de 680px justamente para esto. Lo único que no tiene es
// el teléfono acostado a media mano, que es el peor momento imaginable para
// cerrar sesión.
//
// `null` en el consumidor significa "todas": no hay lista de presentes por
// defecto porque el caso normal sigue siendo que monte todo.
export const PRESENTES_MOVIL_HORIZONTAL = [
  ENTRADA.SONIDO, ENTRADA.REACCIONES, ENTRADA.TAPETES, ENTRADA.SALDO, ENTRADA.MANO,
]
