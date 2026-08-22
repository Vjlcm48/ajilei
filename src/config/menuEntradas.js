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
  // El BADGE de consultas gratis. No es una entrada del panel: es un control
  // propio, con su propia superficie flotante, alojado DENTRO de la entrada
  // "Mano actual". Tiene ID propio porque puede estar vivo o no con
  // independencia de ella — y hoy lo está sólo en escritorio.
  CONTADOR: 'contador',
}

// Escritorio: todo vivo menos Saldo, inerte por diseño desde la v1.0 §3. Es
// también el valor por defecto del panel, así que la rama de escritorio no pasa
// la prop y su render queda idéntico al de antes de esta tanda.
export const VIVAS_ESCRITORIO = [
  ENTRADA.SONIDO, ENTRADA.REACCIONES, ENTRADA.TAPETES, ENTRADA.MANO, ENTRADA.CONTADOR,
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
  ENTRADA.SONIDO, ENTRADA.REACCIONES, ENTRADA.TAPETES, ENTRADA.MANO,
]
