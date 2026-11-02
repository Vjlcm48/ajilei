# AJILEI · CFG-1 · Fase 1d-L · Lámina del cambio de correo · Informe v1.0 · STOP-L

**Fecha:** 2026-11-01. **Base:** `main` en `859b27f`. **Ficha:** `AJILEI_CFG-1_Fase1d_v1.0.md` §3, con lo resuelto en STOP-0.
**Escrituras:** `laminas/cfg1d/` (sin seguimiento de git) y este informe. Nada en `src/` ni en `supabase/`. Sin commits.

---

## Qué tiene que decidir Victor

1. **La forma de V3:** A (dos campos en una tarjeta) o B (dos pasos). Recomiendo **A**.
2. **Los textos** de §4.
3. **Cinco cosas que añadí** porque las pedía la pantalla y no estaban en la ficha (§3). La primera es la que más conviene mirar: **«Cerrar» en la tarjeta de los códigos**.

## Resultado

| Comprobación | Resultado |
|---|---|
| Capturas | **270:** 36 escenas en los seis tamaños y 54 con teclado |
| Zonas de 44 (INV-07) | **Cero por debajo**, en todas las escenas y tamaños |
| Solapes nuevos | **Cero.** Sigue el de hoy, ⚙ con casa en 915×412 (1,11 px), que esta lámina no toca |
| Desplazamiento horizontal | **Cero** |
| O1 (el botón no salta con un error) | **Δ 0** en los seis tamaños (0,02 px de redondeo en 390 y 360) |
| Las otras filas del perfil | **Δ 0** con la fila normal y con la pendiente |
| Recorrido tocando como el jugador | **27 de 27 pasos bien**, sin errores de página |
| V6 · «Confirmar» con el teclado | **A la vista en todos los casos** (§2) |

---

## 1. Cómo verla

**Vite ya está levantado en el 5174.** Si se cierra: `npx vite --port 5174 --strictPort --host 0.0.0.0`, desde la raíz.

- **PC, visor con escena, tamaño y teclado:** <http://localhost:5174/laminas/cfg1d/lamina.html>
- **S25 en la misma red, con teclado de verdad:** `http://192.168.12.171:5174/laminas/cfg1d/pantalla.html?panel=1&vista=V1N`. Abajo hay un selector de escena.
- **Hojas de contacto, los seis tamaños a la vez:** `laminas/cfg1d/hojas/` (18 PNG). Para el rector, las más útiles son `V3A.png`, `V3B2.png`, `V1P.png`, `E6.png`, `V5L.png` y `V3AX_tecladoB.png`.
- **Capturas sueltas:** `laminas/cfg1d/capturas/`. **Cifras:** `laminas/cfg1d/medidas.json`.

**La tarjeta responde de verdad en la lámina**, sin servidor:
- `test1976…` da «ya tiene una cuenta».
- `000000` en un campo da código incorrecto.
- Cualquier otro código completa el cambio.

**Para rehacerla:** `node laminas/cfg1d/capturar.mjs`, `resumen.mjs` (tablas), `hojas.mjs` (hojas) y `_sonda.mjs` (el recorrido).

**Cómo está hecha:** monta la pantalla **`Perfil` real** y su carcasa. La fila nueva entra por portales en la fila real, y la tarjeta es el molde del Bautizo en edición. Lo que pasará a `src/` en la 1d-i es `correo.jsx`, `cfg1d.css` §1–§2 y `textos.js`.

---

## 2. Lo medido

### V3 · las dos formas (alto de la tarjeta en px)

| Forma | 1920×1080 y 1366×768 | 390, 360 y 412 de ancho | 915×412 |
|---|---|---|---|
| **A · dos campos** | 446 | 389 | 278 (campos lado a lado) |
| **B · dos pasos** | 378 | 323 | 309 |

**Por qué recomiendo A,** igual que el rector:
- Se ve todo de una vez: el jugador abre su correo una vez y copia los dos.
- B ahorra 66 px en el teléfono, pero A ya cabe.
- **B tiene un problema con la API aprobada:** como `confirmar` manda los dos códigos juntos, en B el primer código no se comprueba hasta terminar el paso 2. Si estaba mal, el error sale cuando ya no está en pantalla, y hay que volver atrás. Comprobar cada paso por separado sería otra API.

### V6 · el teclado

Modelo B: el teclado **tapa** y la vista no encoge, que es lo que hace Chrome en Android. Holgura = lo que queda entre «Confirmar» y el teclado.

| Caso | 360×640 (línea 380) | 412×915 (línea 579) |
|---|---|---|
| V2 · editor | 86,8 | 285,8 |
| V2 · direcciones larguísimas | 67,0 | 266,0 |
| V3-A · foco en cualquiera de los dos | **32,5** | 231,6 |
| V3-A · alias de la Prueba C | 32,5 | 231,6 |
| V3-A · direcciones de 60 caracteres | **0,6** | 199,6 |
| V3-B · paso 2 | 98,5 | 297,5 |

El campo con el foco queda siempre a la vista. También se midió 390×844, sin problemas.

**Lo que hay que saber de estas cifras:**
- **El alto del teclado es una estimación**, la misma de la 1b-L (260 y 336), no una medida en un aparato. Por eso conviene que Victor abra V3A en el S25.
- **El caso de 0,6 px es el peor** (dos direcciones de 60 caracteres, en dos líneas cada una), y no tiene margen. Con direcciones normales la holgura es de 32,5.
- **Los enlaces quedan bajo el teclado** en 360×640: «Reenviar», «Usar otro correo» y «Cerrar» se alcanzan al bajarlo.
- **Acostado con el teclado no se midió:** la ficha no lo pide. La tarjeta mide 278 px y al S25 acostado le quedarían unos 200, así que «Confirmar» se taparía; la tecla de ir del teclado también confirma.

### V1 y V5 · la fila y el aviso

- **Alto de la fila:** normal 44 en el teléfono y 61,6 en escritorio. Pendiente 44–48,9 y 70,8. Es la última fila, así que no empuja a ninguna otra.
- **Sin cortes con «…»**, ni con dominios larguísimos.
- **El aviso de V5 estaba mal:** el toast se ancla al 50 % y su ancho se quedaba en media vista, y partía «Listo…» en cuatro líneas. Corregido solo en el perfil (§3-3). Ahora, en 360×640: una línea con `nuevo.correo@gmail.com`, dos con los alias de la Prueba C y tres con 60 caracteres.

### Decisión 3 · «Eliminar cuenta»

El texto nuevo ocupa las mismas dos líneas que el de hoy: **la ventana mide igual en los seis tamaños** (Δ 0).

---

## 3. Lo que añadí y no estaba en la ficha

1. **«Cerrar» en la tarjeta de los códigos.** Lo sellado nombra «Reenviar» y «Usar otro correo», pero sin un tercero el jugador solo saldría tocando fuera de la tarjeta, cosa que en el teléfono no se descubre. **Solo cierra la tarjeta: el cambio sigue pendiente.** Reutiliza `perfil.nombre.cerrar`, y no dice «Cancelar», como se decidió.
2. **Con un cambio pendiente, el editor se comporta distinto.** Se llega ahí con «Usar otro correo»:
   - **El enlace dice «Cerrar», no «Cancelar»,** y no apaga el «Pendiente». Mi primera versión sí lo apagaba, y eso habría sido el «Cancelar» que solo esconde.
   - **«Continuar» enseña la espera** («Continuar en 42 s») hasta cumplir los 60 s, porque antes el servidor contestaría 429 seguro. Sin cambio pendiente, el editor dice «Cancelar» y no espera.
3. **El aviso de V5 lleva la dirección completa.** La Decisión 2 habla de la fila y del editor, no del aviso. Lo dejo completo porque su función es decir con qué correo se entra desde ahora. Para que quepa, el toast cambia de ancho **solo en el perfil** (`.sal[data-perfil] .sal-toast`); los «Guardado» y «Listo: ahora eres…» de esa pantalla también usan ese ancho, sin otro efecto.
4. **Los campos de código no llevan `maxLength`.** El navegador corta lo pegado antes de filtrar, y «123 456» se quedaría en cinco dígitos. El filtro ya deja seis. El campo de la Entrada sí lo lleva y tiene ese defecto; no lo toco.
5. **La fila pendiente va en dos líneas:** «Pendiente: n•••@gmail.com» y debajo «Revisa tus dos correos». En una sola no cabe en 360, y es el mismo molde de la fila del nombre con «Próximo cambio».

---

## 4. Los textos, con su clave

**Nuevos, `perfil.correo.*`:**

| Clave | Texto |
|---|---|
| `titulo` | Cambiar correo |
| `actual` / `nuevo` | Correo actual / Correo nuevo |
| `nuevo_ph` | tucorreo@ejemplo.com |
| `ayuda` | Te llegarán dos códigos, uno a cada correo. |
| `continuar` / `continuar_espera` | Continuar / Continuar en {n} s |
| `enviando` / `comprobando` | Enviando… / Comprobando… |
| `codigo_actual` / `codigo_nuevo` | Código del correo actual / Código del correo nuevo |
| `vence` | Si no confirmas en 10 minutos, el cambio se anula solo. |
| `confirmar` | Confirmar |
| `reenviar` / `reenviar_espera` | Reenviar / Reenviar en {n} s |
| `reenviado` | Te mandamos dos códigos nuevos. |
| `otro` | Usar otro correo |
| `paso` (solo V3-B) | Paso {n} de 2 |
| `pendiente` / `pendiente_2` | Pendiente: {correo} / Revisa tus dos correos |
| `listo` | Listo: desde ahora entras con {correo} |

**Errores, `perfil.correo.e.*`:**

| Motivo | Clave | Texto |
|---|---|---|
| `invalido` | `invalido` | Ese correo no es válido. |
| `mismo` | `mismo` | Es el mismo correo que ya tienes. |
| `en_uso` | `en_uso` | Ese correo ya tiene una cuenta. |
| `codigo_mal` | `codigo_actual` | El código del correo actual no es correcto. |
| `codigo_mal` | `codigo_nuevo` | El código del correo nuevo no es correcto. |
| `codigo_mal` | `codigo_dos` | Los dos códigos no son correctos. |
| `codigo_vencido` | `vencido` | Los códigos vencieron. Pide otros con «Reenviar». |
| `limite` | `limite` | Demasiados intentos. Espera un momento. |
| `red`, `desconocido` | `envio` | No se pudo enviar. Inténtalo de nuevo. |

- **`codigo_mal` son tres textos, no uno,** porque `confirmar` sabe cuál falló; además se marca en rojo el campo.
- **`vencido` va en plural** porque los dos códigos vencen a la vez.
- **Reutilizados:** `perfil.fila.correo`, `perfil.nombre.cancelar` y `perfil.nombre.cerrar`.
- **Decisión 3,** `lob.eliminar.aviso.correo`: «Si vuelves a registrarte con el correo con el que creaste esta cuenta, empezarás de cero y sin bono.»

---

## 5. Lo que no se comprobó

- **El teclado de verdad.** Todo V6 usa altos estimados; falta abrirlo en el S25.
- **WebKit.** Se midió solo con Edge (Chromium).
- **El servidor.** En la lámina contesta una simulación; lo real llega en la 1d-i, con el banco imitado, y en la Prueba C.

## 6. Para la 1d-i

- Al reabrir un cambio pendiente, la espera de «Reenviar» sale de `email_change_sent_at`. En la lámina arranca libre.
- Si la tarjeta sigue abierta cuando vencen los 10 minutos, «Confirmar» da `vencido` y «Reenviar» sigue sirviendo, porque `new_email` sigue en el servidor.

**STOP-L.** Sin commits. Quedan en la carpeta `_sonda.mjs` y `_cifras.mjs`, que no estorban; `laminas/cfg1d/` se puede borrar al cerrar la campaña.
