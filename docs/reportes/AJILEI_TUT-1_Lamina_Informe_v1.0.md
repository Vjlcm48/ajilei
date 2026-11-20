# AJILEI · TUT-1 / GUI-1 · Lámina · Informe · v1.0

- **Fecha:** 2026-11-20. **Base:** `c83776e`, sin commits (STOP-L). El informe de la Fase 0 sigue sin commitear, igual que estaba.
- **Ficha:** `AJILEI_TUT-1_Lamina_v1.0.md`. **Guion:** `AJILEI_Tutorial_v0.1.md`.
- **Tiempo:** dentro del tope de 3 h.
- **Protegidos:** no se tocó ninguno.

---

## 1 · Qué se montó

**Lo que se queda** (la tanda 1 lo hereda tal cual):

| Archivo | Qué es |
|---|---|
| `src/components/CapaSenal.jsx` | La capa. Va por portal a `body` con `position: fixed`, mide el ancla con `getBoundingClientRect` y la vuelve a medir en cada `resize`, giro, desplazamiento, `ResizeObserver` y `MutationObserver` (con `requestAnimationFrame`, sin temporizadores de flujo). **Velo:** cuatro bandas que reciben el toque y un hueco que lo deja pasar o no (`pasa`). **Señalización:** aro con pulso (que respeta `prefers-reduced-motion`) y flecha. **Rótulo:** con `**negrita**` desde `t()`. **Controles:** Siguiente, Volver, Cerrar, Saltar y «Paso n de m». **Accesibilidad:** el foco queda atrapado mientras hay velo, Escape cierra y el foco vuelve a donde estaba. **`unico`:** `data-tut-unico` en `<html>` y `data-tut-activo` en el ancla. **`alTocar`:** la señal se apaga con el toque real |
| `src/components/capaSenalCore.js` | La geometría, pura y sin DOM: `union`, `huecoDe`, `bandas`, `colocarTarjeta`, `colocarBurbuja`, `colocarBarra`, `colocarLibre` (rejilla de 8 px que puntúa lo que pisa por la distancia al ancla), `flechaEntre` y `trozosRotulo`. Se puede probar sin jsdom (las pruebas son de la tanda 1) |
| `src/styles/senal.css` | La hoja de la capa: nueva, aditiva y sin `!important` (INV-03) |
| `src/components/OfertaGuiada.jsx` + `src/styles/ofertaGuiada.css` | La tarjeta del primer login, variantes a y b |
| `src/config/textos.tut.es.js` | 21 claves `tut.*` en un diccionario diferido (`sumarTextos`, molde de `textos.pvp.es.js`), fuera de `1.8b` |

**Lo que se retira en la tanda 1:**

- `src/dev/laminaTut.js` (el mando, con la puerta `DEV` + `VITE_AUTH_BYPASS`).
- `src/dev/LaminaTut.jsx` y `src/dev/montarLaminaTut.js` (montan la lámina en una raíz propia fuera de `#root`, a partir de las anclas de la app real).
- Tres enganches, todos con la misma puerta:
  - `main.jsx`: el `import()` de la lámina.
  - `App.jsx`: con `senal` o `cap5` se sienta solo **una vez** en una mesa de 3, Básico, apuesta 50, entrada 500, contra el banco imitado.
  - `GameTable.jsx`: la guarda `relojQuietoTut()` en el efecto del reloj de turno, junto a la de `congelado`.

**La mesa se queda quieta sin abrir ningún protegido.** El reloj se para con la guarda. La IA ya espera sola, porque en la primera mano el humano es la Mano y habla primero. «Iniciar mano» lo toca Victor a propósito: así el toque es real y en el S25 pide la pantalla completa (INV-45). En `senal`, ahí sale la primera pista del guion §1.4 («Toca **Iniciar mano** cuando estés listo.»).

## 2 · Anclas añadidas en `GameTable.jsx`

Son solo atributos, sin CSS.

| Ancla | Dónde |
|---|---|
| `data-accion="iniciar-mano"` | «Iniciar mano» |
| `data-accion="siguiente-mano"` | «Siguiente mano» |
| `data-accion="mult"` + `data-k` | Los cuatro multiplicadores |
| `data-accion="descartar"` | «Descartar n» / «Sin descartar» |
| `data-ancla="fila-acciones"` | `.action-buttons` (para señalar la fila cuando un botón no está montado) |
| `data-ancla="carta"` + `data-i` | Las cinco ranuras de tus cartas (las cuatro ramas de render) |

Las zonas que no son botones llevan `data-ancla` y no `data-accion`. Así no entran en lo que el arnés recorre como acciones (`autojuego.mjs:40` lee `.action-buttons [data-accion]`). La mesa tiene que seguir dando el mismo Δ (§3).

## 3 · Δ geométrico

Se midieron **todas las cajas de `#root`** (`getBoundingClientRect` de cada descendiente) con la capa montada y después de cerrarla, en la misma página. En el capítulo también se comparó entre los seis pasos. Arnés de Chromium sellado (`navegadorArnes`), teléfono con `isMobile` y `hasTouch`.

| Modo | Vista | Cajas | Δ con / sin capa | Δ entre los 6 pasos |
|---|---|---|---|---|
| `cap5&v=a` | 360×640 | 120 | **0** | **0** |
| `cap5&v=a` | 640×360 | 120 | **0** | **0** |
| `cap5&v=a` | 1920×1080 | 122 | **0** | **0** |
| `cap5&v=b` | 360×640 | 120 | **0** | **0** |
| `cap5&v=b` | 640×360 | 120 | **0** | **0** |
| `cap5&v=b` | 1920×1080 | 122 | **0** | **0** |
| `oferta&v=a` | 360×640 · 390×844 · 1920×1080 | 72 | **0** | — |
| `oferta&v=b` | 360×640 · 390×844 · 1920×1080 | 72 | **0** | — |

La señal (`senal`) es el mismo componente sin velo y no se midió aparte.

**Otras comprobaciones:**

- **Hueco con `&unico=1`:** el toque real (`touchscreen.tap`) en el centro de «Pasar» llega a «Pasar» y la mesa avanza. En el centro de «Apostar» lo recibe una banda. El resto se ve con opacidad 0,4, y al irse la capa quedan limpios `data-tut-unico` y `data-tut-activo`.
- **Sin `unico`** (capítulo de lectura), el hueco no responde.
- **Foco:** seis `Tab` seguidos y el foco no sale de la capa.
- **Botones de la capa:** 44 px de alto (INV-07); en la oferta, 46.
- **Rótulos:** 15 px en el teléfono y 16 desde 600; «Paso n de m», 13. **Ningún rótulo pasa de dos líneas a 360×640**: los seis pasos, las dos señales y la oferta. En 1920, la burbuja del paso 4 con el hueco ocupa tres líneas.
- **Tarjeta de la oferta:** nunca toca la barra de arriba con la píldora de saldo (arriba del todo, alto 39–64; la tarjeta empieza en y ≥ 221).
- **Consola:** sin errores en ninguna corrida.

## 4 · `z-index`

**40**, escrito y comentado en la cabecera de `senal.css` (y en `ofertaGuiada.css`):

- **Por encima de:** la mesa (celebración 26/32), VOZ-2 (20) y el ⋮ del móvil (21).
- **Por debajo de:** el aviso de saldo (60), el mini-perfil (80), salida, quiebra y transición (100/120/140) y los velos de 1000.
- Las cartas que vuelan (200) pasan por encima, pero con la mesa quieta no vuela nada.

## 5 · Lo que salió al montarla (datos para Victor, el rector y las tandas)

1. **Primer turno de la mano: no hay «Igualar» ni «Subir».** Sin apuesta viva no se montan (`puedeHacer`). Los pasos 3 y 4 señalan la fila y lo dicen: «Cuando alguien apuesta, aquí sale **Igualar**…» y «…aquí sale **Subir**…» (dos claves `.hueco`). «Retirarse» sí está. El ×10 sale en gris sin sembrar nada: con la entrada de piso (500) y el ante pagado quedan 450. Para la tanda 4: o el capítulo se monta en un momento con apuesta viva (modo guion), o se queda con el hueco.
2. **⚠ El guion dice «×2, ×3… suben la apuesta»**, pero los multiplicadores son ×1, ×2, ×5 y ×10 (`ajileiConfig.js:25`). El texto está tal cual el guion; hay que corregirlo en la v1.0 del guion.
3. **La variante b de la oferta tapa la entrada a jugar.** En el teléfono tapa media píldora de «Jugar contra las IAS»; en 1920, la de «Jugar contra jugadores». Además deja **dos oros sólidos a la vista a la vez** («Jugar contra las IAS» y «Jugar la guiada»), que roza INV-08 («un solo oro»). En la variante a también son dos, pero el lobby queda atenuado detrás.
4. **Dónde va la señal (posición propuesta):**
   - En vertical, el único sitio que no tapa el óvalo, tus cartas, la fila ni tu barra es **arriba, sobre los rivales**, lejos del ancla.
   - En el acostado, arriba a la derecha.
   - En 1920, justo debajo de la fila, fuera del marco de la mesa.

   El aro sobre la fila une rótulo y ancla. La variante «solo sombra» se ve con `?tut=senal&v=b`.
5. **El hueco de varias anclas es la caja que las envuelve.** En el paso 2 (Apostar + multiplicadores), en 1920 deja ver también un trozo de «Pasar» y de «Retirarse». Con `unico`, esos trozos se podrían tocar. Para GUI-1: un hueco por elemento, o la unión solo si las anclas están pegadas.
6. **Variante b en el teléfono:** «Paso n de m» va dentro de la burbuja. Así la barra lleva solo botones, cabe en una línea a 360 y se queda abajo. Con el número fuera de la burbuja, la barra se partía y saltaba arriba.
7. **Sin sonido en los botones de la capa:** la raíz de la lámina no tiene el contexto de `SoundButton`. Cuando la tanda 1 monte la capa desde las pantallas, decide si suenan.
8. **Peso:** nada de la lámina llega a la build. Se compiló a una carpeta temporal y se buscaron 11 marcas (`tut-capa`, `ofg-tarjeta`, `tut.oferta`, `relojQuietoTut`, `mesaTut`, `montarLaminaTut`, «Aprendemos»…): **0 en todas**. Solo viajan los `data-ancla` en el trozo de la mesa. El efecto de `App` deja un `useRef` y un `useEffect` muertos en la entrada (unos bytes); se van con el mando en la tanda 1. `1.8b` no se midió con la vara.
9. **Varas sueltas:** eslint sobre `src` y `scripts` con código 0 · `vitest` 113 archivos / 3.063 pruebas en verde · `testDistSinMoldes` 36/36 (no conoce la marca de la lámina; la comprobación de `dist/` de arriba se hizo a mano).
10. **Lo que no se pudo hacer sin un protegido:** nada.

## 6 · iOS

Nada que validar en esta lámina (INV-41). La capa es CSS y DOM estándar. Lo que haya que mirar en Safari (el velo con `box-shadow` de 200vmax y el `fixed` con el teclado) entra en las pruebas con teléfonos de la tanda 1.
