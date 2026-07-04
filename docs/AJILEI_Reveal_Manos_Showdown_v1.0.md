# AJILEI — Revelar Manos en el Showdown v1.0

**Estado:** IMPLEMENTADO en móvil horizontal, mesas 3/4/5 (commit 58d4127, con
tandas R1 → R3: revelado por tap, apilamiento sólido, protocolo boca abajo,
knob-shake y coreografía de volteo). Pendiente: tratamiento visual propio de
portrait y escritorio — hoy el tap y el protocolo funcionan ahí con canje
instantáneo y el estilo de ganadora preexistente de cada orientación.
**Alcance:** Mesas de 3, 4 y 5 jugadores. Escritorio y móvil (horizontal y vertical).
No aplica a mesa de 2 jugadores (solo hay una IA rival, no hay nada que comparar).

## 1. Objetivo

Cuando termina una mano y hay un showdown, hoy solo se muestran en grande las cartas
de la IA ganadora (ancla lateral + escala 1.6, sin solapamiento — implementado
originalmente en mesa 5 horizontal). Esta spec añade la capacidad de que el jugador
humano también pueda revisar, bajo demanda, las cartas de cualquier otra IA que haya
llegado hasta el final de la mano (aunque no haya ganado), reutilizando el mismo
tratamiento visual grande.

Motivación: transparencia hacia el jugador (entender con qué perdieron los rivales),
valor de exploración, y sienta la base conceptual para "ver la mano de un rival" en
el futuro multijugador humano-vs-humano.

## 2. Elegibilidad

Una IA es "elegible" para ser revisada si y solo si:
- Llegó hasta el final de la mano (no se retiró antes del showdown).
- No es la IA ganadora (la ganadora ya se muestra por defecto).

Las IAs que se retiraron (fold) antes del showdown NO son elegibles: su nombre no
tiene indicador ni interacción, se comportan igual que hoy.

## 3. Comportamiento por defecto

- Al llegar el resultado de la mano, se muestran en grande las cartas de la IA
  ganadora (mecanismo ya definido: ancla al borde del panel para IA1/IA4, centrado
  simétrico para IA2/IA3, escala 1.6, sin solapamiento entre cartas).
- El texto de resultado ("IA X gana con [palo] (NN pts)") permanece SIEMPRE visible,
  sin importar qué mano esté desplegada en pantalla en ese momento.

## 4. Interacción — revisar otra mano

- Tocar/clickear el NOMBRE de una IA elegible: oculta la mano actualmente desplegada
  y despliega la de esa IA, con el MISMO tratamiento visual grande (ancla/centrado +
  escala 1.6 + sin solapamiento) que ya se usa para la ganadora.
- Tocar el nombre de la IA ganadora: vuelve a mostrar su mano (comportamiento por
  defecto).
- Tocar el nombre de la IA cuya mano ya está desplegada en ese momento: no-op (no
  pasa nada).
- Sin límite de alternancias: el usuario puede saltar libremente entre la ganadora
  y cualquier IA elegible, cuantas veces quiera, mientras dure el resultado.
- No hay restricción de "volver primero a la ganadora" para saltar entre elegibles:
  se puede ir directo de una IA elegible a otra.

## 5. Indicador visual — micro-animación "perilla"

Para que el usuario descubra que puede revisar otras manos:

- Cada nombre de IA elegible tiene una micro-animación de "sacudida" (leve giro
  izquierda-derecha, como una perilla física de radio analógico).
- La sacudida se aplica a UNA sola IA elegible a la vez, nunca varias a la vez.
- Orden de rotación: izquierda a derecha según la posición de asiento en la mesa.
- Timing: ~1s de sacudida, seguido de ~1-2s de pausa antes de pasar al nombre de la
  siguiente IA elegible.
- Si solo hay UNA IA elegible (además de la ganadora), su nombre hace el ciclo
  sacudida-pausa-sacudida-pausa en loop continuo (no se "salta turno" a nadie).
- Si no hay ninguna IA elegible (todas las demás se retiraron), no hay ninguna
  animación.
- La sacudida NUNCA se aplica al nombre de la IA ganadora (ya se distingue con su
  propio halo/resplandor de victoria).
- La rotación de sacudidas sigue activa aunque el usuario esté viendo en ese momento
  la mano de otra IA (no se pausa por eso).
- Esta animación es puramente decorativa/afordancia — no cambia qué mano está
  desplegada, solo invita a tocar.

## 6. Independencia de "Siguiente mano"

- Este sistema NO modifica en ningún sentido la lógica ni el flujo de "Siguiente
  mano". Es un proceso totalmente independiente y no debe tocarse al implementar
  esta spec.
- Al presionar "Siguiente mano", el estado de "qué mano se está mostrando" se
  reinicia por completo. La próxima vez que haya un showdown, se vuelve a mostrar
  por defecto la mano de la IA ganadora de esa nueva mano.

## 7. Reutilización técnica (referencia)

El tratamiento visual grande (ancla lateral IA1/IA4, centrado simétrico IA2/IA3,
escala 1.6, anti-solapamiento) ya está implementado para la IA ganadora en mesa de
5 horizontal (ver historial de commits del bloque "ajustes visuales área jugador
humano y panel IA"). Esta spec reutiliza ese mismo mecanismo para cualquier IA
elegible que el usuario seleccione — no se diseña un tratamiento visual nuevo, se
generaliza el existente para que pueda aplicarse a cualquier asiento bajo demanda.

~~Pendiente (fuera de esta spec): replicar el mecanismo base de ancla+escala a
las mesas 3 y 4~~ — **CUMPLIDO** en móvil horizontal (tanda R3, commit 58d4127):
anclas por posición según la regla de la spec — esquinas `side-left/side-right`
en mesas 5 y 4, `top-left/top-right` en mesa 3; centros (top-left/right en 5,
top-center en 4) con crecimiento simétrico. Sigue pendiente la orientación
portrait, que tendrá su propio mecanismo de apreciación en una pasada separada.

## 8. Fuera de alcance

- Mesa de 2 jugadores.
- Cambios a la lógica de "Siguiente mano".
- Cambios a las cartas del jugador humano.
- Animación de despliegue/transición al cambiar de mano mostrada (queda como
  "detalle de lujo" para una fase posterior).
- gameEngine.js, aiPlayer.js, seatLayouts.js (protegidos).

## 9. Historial de versiones

- v1.0 — Spec inicial aprobada. Pendiente de implementación.
- v1.0 + nota de estado (2026-07-04) — Implementado en móvil horizontal, mesas
  3/4/5 (commit 58d4127). Incluye dos adiciones acordadas durante la
  implementación que refinan la spec: protocolo boca abajo (solo la mano
  revelada va boca arriba; el tap sobre la revelada es no-op y nunca vuelve a
  null) y coreografía de volteo en el intercambio (~960ms, cerrar→recoger→
  crecer→abrir). Pendiente: portrait y escritorio (canje instantáneo por ahora).
