// ── APU-1 1e · K-3a · La fila de chips, compartida por las dos pantallas ─────
// Rector: AJILEI_APU-1_Fase1e_v1.0.md §2.1.
//
// Es el bloque que `ArmarMesa` repetía dos veces —jugadores y apuesta— y que
// «Retar a las IAS» necesita CUATRO veces. Se extrae tal cual: las mismas
// clases, el mismo `data-accion`, el mismo `aria-pressed`, el mismo hueco de
// aviso con caja reservada. Que la extracción fuera NEUTRA lo prueba `diagSAL`,
// que sigue midiendo 102/102 sin cambiar una línea del arnés.
//
// ── EL AVISO ES OPCIONAL Y SU CAJA NO ───────────────────────────────────────
// La fila de jugadores de SAL-2 no tiene aviso; la de apuesta sí, y reserva dos
// líneas (O1) para que encenderlo no empuje el CTA bajo el dedo. Por eso el
// párrafo se pinta SÓLO cuando la fila declara un `accionAviso`: añadirlo a
// todas «por simetría» metería una caja de dos líneas en la pantalla del PvP y
// movería su geometría, que es exactamente lo que la neutralidad prohíbe.
//
// ── QUÉ SE ENSEÑA EN ESE HUECO, Y EN QUÉ ORDEN ──────────────────────────────
// Tres fuentes, de más concreta a más general:
//
//   1. `nota` — lo que la pantalla calcula para esta fila ahora mismo.
//   2. el `aviso` de la opción ELEGIDA — «Con 4 y 5 juega el comodín».
//   3. el `aviso` de la primera opción APAGADA — «Necesitas 750 para la de 150».
//
// La tercera es la que hace que el gris se explique solo. Un chip `disabled` no
// recibe clics ni foco, así que su razón no puede esperar a que lo pulsen: en un
// teléfono no hay `title` que asomar. Y se elige la PRIMERA apagada porque las
// listas van de menos a más, así que es la mesa que el jugador está más cerca de
// alcanzar — la única cifra que le sirve para algo.
export default function FilaChips({
  titulo,
  accion,
  opciones,
  valor,
  onChange,
  nota = null,
  claseChips = '',
  claseAviso = '',
  accionAviso = null,
  deshabilitada = false,
  children,
}) {
  const elegida = opciones.find((o) => o.id === valor) ?? null
  const primeraApagada = opciones.find((o) => o.disabled && o.aviso) ?? null
  const textoAviso = nota ?? elegida?.aviso ?? primeraApagada?.aviso ?? null

  return (
    <section className="sal-bloque">
      <h2>{titulo}</h2>

      <div className={`sal-chips${claseChips ? ` ${claseChips}` : ''}`} role="group" aria-label={titulo}>
        {opciones.map((o) => (
          <button
            key={o.id}
            type="button"
            className="sal-chip"
            data-accion={accion}
            aria-pressed={valor === o.id}
            // Una fila que todavía no toca —la cascada de §2.2— se apaga
            // entera. Se hace aquí y no duplicando `disabled` en cada opción
            // para que la pantalla declare la cascada UNA vez.
            disabled={deshabilitada || Boolean(o.disabled)}
            onClick={() => onChange(o.id)}
          >
            {o.etiqueta}
          </button>
        ))}
        {children}
      </div>

      {accionAviso !== null && (
        <p
          className={`sal-aviso${claseAviso ? ` ${claseAviso}` : ''}${textoAviso ? ' is-on' : ''}`}
          data-accion={accionAviso}
        >
          {/* El espacio duro conserva la altura de línea cuando no hay nada que
              decir: la caja está reservada por CSS, pero un párrafo vacío la
              colapsaría en los navegadores que no heredan `min-height`. Es el
              mismo truco que ya usaban las dos filas de `ArmarMesa`. */}
          {textoAviso ?? ' '}
        </p>
      )}
    </section>
  )
}
