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
  // TIE-1 1a · 'tapetes' sale: el tapete se elige en la tienda (y su puerta es
  // la fila «Tapetes» del ⚙). Su ID queda RETIRADO, como 'saldo' y 'cuenta'.
  MANO: 'mano',
  // CFG-1 1e · «Partida rápida», el ritmo de la mesa contra las IAS (INV-70).
  // ID NUEVO en el sitio de 'saldo'. Salen 'saldo' (la Heptacoin inerte, P-14)
  // y 'cuenta' (la figurita de SUP-2b, P-1): sus IDs quedan RETIRADOS y no se
  // reutilizan para otra cosa, que es el contrato que abre este archivo.
  RAPIDA: 'rapida',
  // El BADGE de consultas gratis. No es una entrada del panel: es un control
  // propio, con su propia superficie flotante, alojado DENTRO de la entrada
  // "Mano actual". Tiene ID propio porque puede estar vivo o no con
  // independencia de ella — y hoy lo está sólo en escritorio.
  CONTADOR: 'contador',
}

// Escritorio: todo vivo. Es también el valor por defecto del panel, así que la
// rama de escritorio no pasa la prop.
// CFG-1 1e · Saldo era la única inerte desde la v1.0 §3; con ella y con Cuenta
// fuera, el panel quedó en cinco filas; TIE-1 1a saca Tapetes y quedan cuatro:
// Sonido, Reacciones, Partida rápida y Mano actual.
export const VIVAS_ESCRITORIO = [
  ENTRADA.SONIDO, ENTRADA.REACCIONES, ENTRADA.RAPIDA,
  ENTRADA.MANO, ENTRADA.CONTADOR,
]

// Móvil, a MOV-1b-c. Queda UNA sola ausencia, y por su superficie, no por su
// función: el popup del CONTADOR se ancla al propio badge, y en horizontal el
// panel vive en el filo izquierdo de la pantalla, así que el aviso se saldría.
// CFG-1 1e · la cifra sí se ve: va en una pastilla que no se toca.
//
// REACCIONES entra aquí en MOV-1b-c. La razón por la que faltaba —el selector
// de escritorio mide 732,56px de ancho y no cabe en ninguno de los cuatro
// viewports móviles— la resuelve la LISTA de cuatro visibles con
// desplazamiento (242×186, lámina aprobada por Victor), que es la misma rejilla
// gobernada por `--dsk-u2-cols` con una sola columna.
export const VIVAS_MOVIL = [
  ENTRADA.SONIDO, ENTRADA.REACCIONES, ENTRADA.RAPIDA, ENTRADA.MANO,
]

// ── Qué entradas MONTAN ─────────────────────────────────────────────────────
// El segundo eje del panel, que abrió SUP-2b (quién monta, distinto de quién
// está viva). SUP-2b lo abrió por GEOMETRÍA: en móvil horizontal el corredor
// izquierdo sólo deja 245,72px libres a 640×360 antes del bloque de saldo del
// humano, cinco filas caben (244) y seis no (288), así que "Cuenta" no montaba
// en esa piel.
//
// CFG-1 1e · con "Cuenta" y "Saldo" fuera ese motivo desaparece: son cinco
// filas en todas las pieles y caben en el corredor. El eje queda por FUNCIÓN:
// "Partida rápida" sólo monta contra las IAS (INV-70). Se QUITA del árbol en
// vez de ocultarse con CSS —misma doctrina que el ⋮ en la pantalla de
// victoria (CEL-2e)—, y el panel mide una fila menos.
//
// `null` en el consumidor significa "todas".
// TIE-1 1a · sin Tapetes: cuatro contra las IAS, tres contra humanos.
export const ENTRADAS_PANEL = Object.freeze([
  ENTRADA.SONIDO, ENTRADA.REACCIONES, ENTRADA.RAPIDA, ENTRADA.MANO,
])

/** Las entradas que montan: todas contra las IAS (`null`), sin «Partida rápida» contra humanos. */
export const presentesDe = (contraIAS) => (contraIAS ? null : ENTRADAS_PANEL.filter((id) => id !== ENTRADA.RAPIDA))

/**
 * El alto del panel: filas × 44 + 6 (el filete que separa "Mano actual") +
 * 8 + 8 (relleno) + 1 + 1 (bordes). 4 filas = 200 · 3 filas = 156. Es el espejo
 * de la pinza (`useUtilitiesMenu`) y la cifra que sella el arnés.
 */
export const altoPanel = (filas) => filas * 44 + 24

/** Cuántas filas tiene el panel: 4 contra las IAS, 3 contra humanos (TIE-1 1a). */
export const filasDelPanel = (contraIAS) => (presentesDe(contraIAS) ?? ENTRADAS_PANEL).length
