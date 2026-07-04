# AJILEI — Menú de Utilidades v1.0 (PRELIMINAR)

**Estado:** Preliminar — reserva de decisiones ya tomadas, pendiente de diseño fino e implementación.
**Timing:** Se implementa SOLO tras consolidar el paquete showdown en escritorio.

## 1. Concepto

Bandeja de utilidades que reemplaza el icono de bocina en las salas de juego. Un botón
de tres puntitos (mismo recuadro que hoy ocupa la bocina) despliega las funciones
auxiliares agrupadas.

## 2. Justificación

- Espacio crítico en mesa 5.
- Mínima distracción: son funciones auxiliares, no vitales para la partida.

## 3. Contenido y orden de la bandeja

1. **Bocina** — funcional desde el estreno.
2. **Mensajes** — ubicado, deshabilitado hasta su implementación.
3. **Asistente IA** — icono: burbuja con signo de pregunta. Ubicado, deshabilitado
   hasta su implementación.
4. **Color de mesa** — futuro no cercano. NO se ubica aún.

**Estado de no habilitados:** atenuados y sin respuesta al tap.

## 4. Protocolo de apertura/cierre

- Tap en tres puntitos → despliega la bandeja.
- Tap fuera → cierra.
- Tras usar una opción, la bandeja permanece abierta; autocierre a ~3s sin interacción.
- La bocina conserva su comportamiento toggle actual dentro de la bandeja.

## 5. Reserva de diseño — badge de notificación

El botón de tres puntitos podrá portar un puntito-badge de notificación cuando la
bandeja esté cerrada (para mensajes futuros). Se contempla en el diseño del recuadro
desde el inicio; no se implementa aún.

## 6. Despliegue por escenario

**PENDIENTE** — se define mesa a mesa según espacio disponible (horizontal hacia la
izquierda, vertical hacia abajo, u otro). Se resolverá en la fase de implementación
con validación visual por mesa.

## 7. Sistema

- Regla single-gold.
- Valores fluidos (sin píxeles hardcodeados).
- Ocultamiento por `visibility`/`opacity`.
- Coherencia con `AJILEI_Sistema_Diseno_v1.2.md`.

## 8. Historial de versiones

- v1.0 — Preliminar. Reserva las decisiones ya tomadas; diseño de despliegue por
  escenario e implementación pendientes.
