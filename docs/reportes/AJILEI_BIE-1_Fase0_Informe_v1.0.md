# AJILEI · BIE-1 · Bienvenida · Fase 0 · Informe v1.0

**Fecha:** 2026-10-01
**Ficha:** `AJILEI_BIE-1_Fase0_v1.0.md`
**Punto de partida:** `main` en `aabaeed` (AJF-1c), árbol limpio salvo los seis residuos conocidos.
**Instrumento:** Edge 154.0.4258.37 · playwright-core del repo · `vite preview` 4173 tras `npm run build` (limpio).
**Escrituras:** solo este informe. Las sondas (`_sondaBie.mjs`, `_duraciones.mjs`) vivieron en el scratchpad de la sesión, fuera del repo. El preview del 4173 se cerró al terminar. Sin commits.

## Resumen

| Pregunta | Respuesta |
|---|---|
| ¿Qué es «la guitarra»? | `ajileiStrum` → `public/sounds/ajilei-strum.mp3` (3,657 s, 117 028 B), el rasgueo de la celebración AJILEI |
| ¿Por qué suena en tres sitios? | **Por un defecto, no por diseño.** La Portada pone un `pointerdown` de un solo uso, pero lo **vuelve a armar en cada render**: `play` es una función nueva en cada render y el efecto depende de ella. **Medido:** con un solo «once», sonó tres veces en un recorrido |
| ¿Hace de desbloqueo de audio? | **No.** Quien desbloquea es Howler (`autoUnlock`), que arma sus propios escuchadores al construirse el **primer** `Howl`, sea cual sea |
| ¿Qué es la pantalla verde? | `App.jsx:339`: `if (auth.estado === CARGANDO) return null`. Sobre ella solo queda el `body` en `--green-abyss`. **Medido:** dura exactamente la lectura de `profiles` |
| ¿Sale en más sitios? | Sí: en el arranque con sesión guardada (PWA o recarga) y en el cambio de cuenta. No sale al cerrar sesión, ni en el Bautizo, ni en el refresco horario del token. No hay carga perezosa |
| ¿Una barra sería honesta? | **No.** Dentro del vacío hay **una sola** espera de red, sin progreso que medir. Unos puntos vivos (indicador indeterminado) dicen la verdad; una barra sería decorativa |

---

## §A · El sonido de guitarra

### A1 · Inventario de sonidos

Todo el audio vive en `public/sounds/`: hay 0 archivos de audio en `src/assets/`. Las duraciones salen de decodificar cada archivo con `decodeAudioData` en Edge. Las licencias, de `src/config/creditos.js:54-74`: todas son Pixabay Content License, que no exige atribución (`:36-40`).

| Archivo | Peso (B) | Duración (s) | Clave en `useSounds.js` (volumen) | Uso / crédito |
|---|---|---|---|---|
| `ajilei-strum.mp3` | 117 028 | 3,657 (útiles ~1,3: `STRUM_CORTE_MS`) | `ajileiStrum` (0,8) · `:38` | **«La guitarra»** · «Guitarra (sustituye al cuatro)», u_op8btczor7 (ver §E-8 sobre el ID) |
| `button-click.mp3` | 16 896 | 0,528 | `buttonClick` (0,4) · `:30` | **«El clic tradicional»** · «Clic de botones», Hanifi Şahin, ID 366460 |
| `card-deal.mp3` | 30 929 | 0,967 | `cardDeal` (0,6) | Repartir cartas · ID 91468 |
| `card-fold.mp3` | 39 288 | 1,228 | `cardFold` (0,5) | Retirarse · ID 102746 |
| `card-shuffle.mp3` | 104 160 | 5,208 | `cardShuffle` (0,6) | Barajar · ID 94662 |
| `chips-collect.mp3` | 30 929 | 0,967 | `chipsCollect` (0,7) | Monedas siendo tomadas · ID 96121 (mismo peso que `card-deal`, pero otro archivo: sha256 distinto) |
| `coin-bet.mp3` | 7 680 | 0,384 | `coinBet` (0,7) | Fichas al apostar · ID 81172 |
| `comodin.mp3` | 65 201 | 2,038 | `comodin` (0,8) | Comodín · ID 115095 |
| `showdown.mp3` | 66 816 | 2,088 | `showdown` (0,7) | Revelar / ganador |
| `table-knock.mp3` | 37 920 | 1,896 | `tableKnock` (0,6) · `:39` | Nudillos (golpe de mesa) |
| `timer-warning.mp3` | 21 504 | 0,672 | `timerWarning` (0,5) | Aviso de cronómetro · ID 433047 |
| `celebracion-*-01.{mp3,ogg}` ×7 | 386 238 (mp3) / 215–247 K (ogg) | 12,000 | (melodías de `useCoreografia`, fuera de `FUENTES`) | Las siete músicas de celebración |

El clic tradicional es `buttonClick`. Lo dispara `SoundButton` (`src/components/SoundButton.jsx:7`) antes de cada `onClick`, en el lobby, las salas y la mesa.

### A2 · Dónde suena la guitarra

`git grep` sobre `src/` da **dos** consumidores de `ajileiStrum`, nada más:

1. **`src/screens/Portada.jsx:258-262`**, el único sonido de la puerta:
   ```js
   useEffect(() => {
     const alTocar = () => play('ajileiStrum')
     window.addEventListener('pointerdown', alTocar, { once: true })
     return () => window.removeEventListener('pointerdown', alTocar)
   }, [play])
   ```
   Lo dispara un evento `pointerdown` en **`window`**, es decir, cualquier toque en cualquier sitio. Va por `useSounds().play` → `obtener()` → `Howl.play()`, y el recorte del rasgueo está en `useSounds.js:187-191`. La precarga es `SONIDOS_PORTADA = ['ajileiStrum']` (`useSounds.js:57`), a 1 s del montaje (`Portada.jsx:251-254`).
2. **`src/hooks/celebracionCore.js:101`**: `if (nivel === 'ajilei') return 'ajileiStrum'`, el sonido de la celebración de un AJILEI en la mesa. Es legítimo y queda fuera del alcance.

No suena en ningún otro sitio: ni en el lobby, ni en la mesa fuera de la celebración, ni en el Bautizo (que no importa `useSounds`), ni en el arranque de la PWA. `Entrada.jsx` está en el árbol pero ninguna rama de `App` la monta.

**Por qué suena tres veces si es «once».** `useSounds()` devuelve un `play` **nuevo en cada render**: es una flecha declarada dentro del hook, `useSounds.js:182`, sin `useCallback`. El efecto de la Portada depende de `[play]`, así que **corre en cada render de la Portada**. El cleanup quita el escuchador si aún no se usó, y el cuerpo pone **uno nuevo de un solo uso**. Resultado: el rasgueo suena en el **primer toque después de cada render** de la Portada. Y la Portada se repinta sin parar: el rotor de escenas, la frase, el marcador, la hoja, la pausa de cortesía al enfocar el correo…

**Medido** en 4173, a 1920×1080, con la red de Supabase simulada (otp, verify, profiles, mi_sala) y un contador sobre `AudioBufferSourceNode.prototype.start`:

| Gesto | `start` del búfer de 3,657 s (rasgueo) |
|---|---|
| G1 · toque en un hueco de la pantalla | **1**, más un búfer de 0 s: el desbloqueo de Howler (A3) |
| G2 · toque en el campo de correo y teclear | **1** |
| G3 · pulsar «Enviar código» | **1** |
| G4 · toque en el campo de código y teclear | 0 en esta pasada |
| G5 · pulsar «Entrar» | 0 en esta pasada |

En dos pasadas idénticas salió lo mismo: **tres rasgueos** con un escuchador declarado de un solo uso. Que suene o no en G4/G5 depende de si la Portada se repintó entre el toque anterior y ese. En la pasada de la sonda los gestos iban separados por menos de un segundo, y con el foco dentro del formulario el rotor está en pausa (1.7a). Con el ritmo de una persona (leer el correo, buscar el código en otra app y volver) el repintado ocurre y el rasgueo vuelve a sonar. Eso explica las tres que vio Victor. **Ninguna de las tres es intencionada:** el diseño (PUE-1.2) era un único rasgueo en el primer toque.

### A3 · ¿Hace de desbloqueo de audio? **No**

Howler 2.2.4 trae `autoUnlock: true` (`node_modules/howler/dist/howler.js:56`). Al construirse **cualquier** `Howl` (`:627-628`, en `Howl.init`) llama a `_unlockAudio()`. Esa función arma en `document`, en captura, `touchstart`, `touchend`, `click` y `keydown` (`:409-412`). En el primer gesto reproduce un búfer de rasca de 1 muestra, que es el `start` de 0 s que cazó la sonda en G1, y desarma.

En la Portada, el primer `Howl` que se construye es el del rasgueo, al segundo, por `precargarSonidos(SONIDOS_PORTADA)`. **Lo que desbloquea no es el rasgueo, sino que exista un `Howl`.** Si `SONIDOS_PORTADA` pasa a `['buttonClick']`, el `Howl` del clic arma el mismo desbloqueo a la misma hora. Si la Portada no precargara **nada**, el primer `Howl` nacería dentro del primer `play('buttonClick')`, ya dentro de un gesto. Funcionaría igual en Chromium, pero en iOS ese primer clic podría quedarse mudo. Por eso conviene seguir precargando un sonido. El iPhone real sigue sin verificar (pendiente desde DIS-1).

### A4 · Propuesta de cambio (no escrita)

1. **Retirar el escuchador global** de `Portada.jsx:258-262`. Si se cambia solo el nombre del sonido (`'ajileiStrum'` → `'buttonClick'`), el **defecto del rearmado se queda**: sonaría un clic en casi cualquier toque y, además, doble en los botones que lleven su propio clic (§E-1).
2. **El clic va en los botones de la puerta, como en el resto de la app.** Los botones son:
   - `FormularioPuerta.jsx:124`: «Enviar código», el «al meter el correo» de Victor.
   - `:161`: «Entrar», el «al meter el código».
   - `:165`: «Reenviar código».
   - `:186`: «Cambiar correo».
   - `Portada.jsx:525`: «JUGAR», que abre la hoja en el teléfono.
   - `Portada.jsx:388/397`: el selector de idioma. Hoy es cara sin mecanismo; conviene decidir si suena.

   Se hace pasando a `SoundButton` o llamando a `play('buttonClick')` en su manejador. `SoundButton` reenvía `type="submit"` y las demás props, y su `onClick` también salta con **Enter** dentro del campo: el envío implícito del formulario hace clic en el botón de envío. Así que «meter el correo» suena tanto si se pulsa el botón como si se teclea Enter.
   
   El «al tocar la pantalla» de Victor era el escuchador global. Con esta propuesta, **tocar un hueco deja de sonar**, como en el resto de la app. Si Victor quiere un clic en cualquier toque, es otra decisión (§G-1).
3. **Precarga:** `SONIDOS_PORTADA` → `['buttonClick']`. Se mantiene el desbloqueo (A3) y el diferido de la Portada baja de ~114 KB a ~16,5 KB (−97 KB).
4. **El archivo `ajilei-strum.mp3` NO se retira:** lo sigue consumiendo la celebración AJILEI (`celebracionCore.js:101`), igual que la rama del recorte (`useSounds.js:120-131,187-191`).
5. **Arnés:** ninguna puerta falla con el cambio.
   - `diagPUE 1.8c` es informativa (siempre verde, `diagPUE.mjs:1141-1143`) y su rótulo dice «(rasgueo incluido)». Habría que cambiarlo, y en la bitácora de `1.8` aparecería `button-click.mp3` en el diferido.
   - `diagCEL0.mjs:44` y `scripts/audioCEL.mjs:35` lo listan como audio de la celebración, sin cambio.
   - `testCelebracion.test.js:144` sella `sonidoDe('ajilei') === 'ajileiStrum'`, sin cambio.
   - Hoy ninguna puerta mide qué suena en la Portada. La Fase 1 debería sellarlo con el contador de la sonda (§C1).
6. Opcional, y aparte: estabilizar `play` con `useCallback` en `useSounds.js` arreglaría el defecto **de raíz** para cualquier otro efecto que dependa de `[play]`. Hoy el único con esa dependencia es el de la Portada (`git grep "\[play\]"`). Toca un hook compartido, así que sería decisión del rector (§G-2).

---

## §B · La pantalla verde de transición

### B1 · Qué es, paso a paso

1. **Pulsar «Entrar»** (`FormularioPuerta.jsx:161`, que envía el formulario y llama a `verificar()`, `:74-86`). `ocupado` pasa a `true` y el botón dice **«Entrando…»** (`:162`). La Portada **sigue a la vista**.
2. `auth.verificarCodigo` → `supabase.auth.verifyOtp({ email, token, type: 'email' })` (`useAuth.js:195-199`) → `POST /auth/v1/verify`. **Primera ida a la red.**
3. El SDK guarda la sesión y emite `SIGNED_IN`. El efecto A (`useAuth.js:106-117`) hace `setSesion(s)`.
4. El estado derivado (`useAuth.js:163-169`) queda con sesión, pero `perfil === undefined`, porque aún no hay perfil de **este** uid (`:152-158`). Eso es **`CARGANDO`**.
5. **`App.jsx:339`: `if (auth.estado === CARGANDO) return null`.** La Portada se desmonta y `#root` se queda **vacío**. Lo único que se ve es el `body` (`welcome.css:1-6`: `background: var(--green-abyss)`, `#09170e`). **Esa es la pantalla verde.** No hay `Suspense`, ni `lazy`, ni pantalla de espera: es la ausencia de pantalla. El comentario de `App.jsx:335-338` lo pensó para «uno o dos fotogramas».
6. El efecto B (`useAuth.js:130-151`) pide `profiles` (`select('id, username').eq('id', uid).maybeSingle()`) → `GET /rest/v1/profiles`. **Segunda ida a la red, en serie con la primera.**
7. Llega el perfil → `COMPLETO` → la cascada cae al `screen` de siempre, que es el **Lobby**, montado sin espera: es un import estático, sin fuentes web (`--font-base: Arial`).
8. **Después** de pintar el lobby, `App.jsx:257-286` pide `mi_sala()` (`POST /rest/v1/rpc/mi_sala`, tercera ida). Si hay mesa en espera, salta a `sala-espera`. Esa ida **no deja vacío**: el lobby ya está pintado (ver §E-6).

**Medido** (4173, red de Supabase simulada; tiempos de la página en ms):

| Caso | `verify` responde → `#root` vacío | `#root` vacío → lobby | Tramo verde |
|---|---|---|---|
| verify 300 ms · profiles 0 ms | 6 318 → 6 621 | 6 621 → 6 628 | **7 ms** |
| verify 300 ms · profiles 400 ms | 6 258 → 6 571 | 6 571 → 6 981 | **410 ms** |

El vacío dura **exactamente lo que tarda `profiles`**. La espera de `verify` no forma parte de él: la cubre el «Entrando…» de la Portada.

### B2 · Dónde más aparece

| Momento | ¿Vacío verde? | Por qué |
|---|---|---|
| Tras meter el código (B1) | **Sí** | `CARGANDO` mientras se lee `profiles` |
| Arranque en frío de la PWA con sesión guardada | **Sí** | `sesion` empieza en `undefined` (`useAuth.js:86`) → `CARGANDO` hasta `getSession`; con la sesión, `CARGANDO` otra vez hasta `profiles`. **Medido** con la sesión de CAP-1: profiles a 0 ms → lobby a los 72 ms (FCP 88); **profiles a 400 ms → lobby a los 480 ms y FCP a los 500**. El vacío tampoco cuenta como primer pintado |
| Recarga de la página con sesión | **Sí** | El mismo camino que el arranque en frío |
| Arranque con el token caducado (más de 1 h fuera) | **Sí, más largo (estimado)** | `getSession` refresca el token (`POST /auth/v1/token`) **antes** de devolver la sesión, y después viene `profiles`: **dos idas en serie**. No se midió |
| Cambio de cuenta en la misma carga (cerrar sesión y entrar con otra) | **Sí** | Uid nuevo → perfil `undefined` → `CARGANDO`, igual que B1 |
| Cerrar sesión | **No** | `signOut` → `SIGNED_OUT` → `sesion === null` → `SIN_SESION` → Portada directa, sin pasar por `CARGANDO` |
| Bautizo → crear perfil | **No** | `crearPerfil` escribe el perfil devuelto en su propio estado → `COMPLETO` sin consulta |
| Refresco horario del token, en partida | **No** | La sesión cambia pero el `uid` no, y el perfil sigue resuelto (`useAuth.js:121-124, `crearPerfil` en `:205-216``) |
| Carga perezosa de pantallas | **No existe** | `git grep "lazy(\|Suspense"` sobre `src/`: 0. Todo va estático en un solo bundle |
| Antes de que React monte (descarga del JS) | El verde de `body`, cuando llega el CSS | No es el mismo vacío y es corto. Es parte del camino crítico de `1.8b` |
| Visitante anónimo | Uno o dos fotogramas | `getSession` sin sesión resuelve en local y casi de inmediato → `SIN_SESION` |

### B3 · Cuánto dura

- **Medido:** solo con la red simulada. El vacío es igual a la latencia de `profiles` (tabla de B1).
- **Sin medir:** la latencia real contra Supabase desde el S25 en ajilei.io. Victor ve **menos de 2 s**.
  - Una ida a PostgREST debería ser de 100-400 ms en 4G, con la conexión ya abierta por `verify`. Que se acerque a 2 s apunta a algo que este banco no ve: una red móvil lenta, la base fría, o la espera del cerrojo de auth del SDK. `from().select()` pide la sesión por dentro, y el SDK serializa con un cerrojo justo después de `SIGNED_IN` (comentario de `useAuth.js:100-105`).
  - **Para saberlo hace falta medir en el teléfono real con sesión real** (§G-8).
- **Idas a la red en serie** dentro del vacío:
  - **1** en el paso del código: `profiles`.
  - **1** en el arranque con el token vigente: `profiles`.
  - **2** en el arranque con el token caducado: `token` y `profiles`.
  - `verify` va antes del vacío y `mi_sala` después.

### B4 · ¿Hay progreso real que medir? **No**

Dentro del vacío hay **una sola incógnita**: «¿ha respondido `profiles`?». No hay bytes que contar ni pasos intermedios. El único caso con dos pasos conocidos es el del token caducado: se puede saber que se está refrescando y después leyendo el perfil. Aun así, cada paso es una espera sin progreso interno, y ese caso no es el que vio Victor.

**Una barra de progreso sería decorativa:** tendría que inventarse el avance, y la casa ya ha medido lo que pasa con lo que se ve bien y mide mal. **Unos puntos vivos**, un indicador indeterminado, dicen exactamente lo que hay: «estoy esperando». Si la lámina prefiere una barra, que sea **indeterminada** (un tramo que recorre la pista) y no una que se llena.

### B5 · Propuesta de sitio (no escrita)

- **Sitio:** la rama de `App.jsx:339`. Pinta un componente de espera en vez de `null`, con un solo sitio para todos los casos de B2 que sí tienen vacío. El componente vive fuera de la Portada, así que **no** depende de `textosPuerta.js`.
- **Retardo antes de mostrarlo:** sí. El motivo de `App.jsx:335-338` sigue siendo cierto: casi todos los arranques del visitante anónimo resuelven en uno o dos fotogramas, y un indicador que aparece y desaparece en 30 ms es peor que nada. Propuesta: **~300 ms** de retardo, sobre fondo verde hasta entonces. Con 300 ms el anónimo no lo ve nunca, y el paso del código solo lo ve si `profiles` tarda.
- **Tiempo mínimo visible una vez mostrado:** sí, **~500-600 ms**, para que no salga como un destello justo antes del lobby. **Coste declarado:** puede retrasar el lobby hasta ese mínimo cuando `profiles` llega justo después de mostrarse. El rector decide los dos números (§G-5).
- **Texto:** clave nueva en `t()`, `textos.es.js`. Propuesta: `app.cargando` = «Cargando». Si son puntos vivos, son glifos animados y no van en el texto, para que el lector de pantalla no lea «punto punto punto». No hay clave reutilizable (§C2).
- **Accesibilidad:** `role="status"` con `aria-live="polite"`, y el texto «Cargando» visible o, si la lámina solo pone puntos, como nombre accesible. Los puntos llevan `aria-hidden`.
- **Movimiento reducido:** los puntos se quedan quietos (tres puntos fijos o «Cargando…» estático), sin animación (`@media (prefers-reduced-motion: reduce)`).
- **Fondo:** el mismo `--green-abyss` del `body`, para que la transición sea **solo** la aparición del indicador, sin cambio de color.

---

## §C · Arnés y textos

### C1 · Qué cubre el arnés hoy y qué se movería

| Modo | Qué cubre | ¿Se mueve con BIE-1? |
|---|---|---|
| `diagPUE puerta` (`:194`, puerta.0–6) | El anónimo llega a la Portada y no lo capturan ni el lobby, ni la Entrada, ni el Bautizo | **Puede moverse** si la rama `CARGANDO` deja de ser `null`. Con el retardo de B5 el anónimo no llega a ver el indicador. Conviene una puerta nueva: «el anónimo nunca ve el indicador» |
| `diagPUE 1.1–1.9` | Escenas, hoja móvil (1.4), idioma (1.5), movimiento reducido (1.6), pausa con el foco en el correo (1.7), red (1.8) | **1.8:** el diferido cambia (rasgueo → clic, −97 KB) y el rótulo de 1.8c. **1.8b** (rojo conocido, 219,6 KiB) **sube** con el CSS y el JS del indicador. **1.7:** no cambia, pero ojo con quitar el escuchador global sin tocar la pausa |
| `diagPUE 2.4` (O1) | Las reservas del formulario en la caja de la Portada | Solo si cambia la geometría de los botones. `SoundButton` sigue pintando `<button>`, así que no debería moverse |
| `diagPUE 2.5`, `mon`, `dis`, `cap` | El gesto del ganador, el render de la escena 4, los aparatos, las capturas de la mesa | No |
| `diagDSK lob` / `diagSAL` | Corren en el servidor de desarrollo **con bypass**: entran ya en `COMPLETO` y nunca pasan por `CARGANDO` ni por la Portada | No, y por eso **no pueden** cubrir BIE-1 |
| `diagCEL0` | El audio de la celebración (lista `ajilei-strum.mp3`) | No |
| **Ninguno** | El paso del código → lobby, y qué suena en la Portada | **Hueco.** La sonda de esta Fase 0 demuestra que se puede medir en 4173: red de Supabase simulada (`otp`, `verify` con la sesión, `profiles` con retardo, `rpc` nulo), contador de `AudioBufferSourceNode.start` y vigía de `#root`. Puede ser el modo `bie` de `diagPUE` en la Fase 1 |

### C2 · Claves de texto reutilizables

**No existe ninguna «Cargando» ni «Un momento…».**
- `textos.es.js` no tiene ninguna. Lo más cercano es `sal.error.demasiados_intentos` (`:210`), que es otro mensaje.
- La puerta **no usa `t()`**: «Enviando…» (`FormularioPuerta.jsx:125`) y «Entrando…» (`:162`) son literales en el JSX, y `textosPuerta.js` solo lleva los dos lemas.
- La clave tiene que ser nueva (`app.cargando`, §B5). Los literales de la puerta son una deuda de IDI-0 que BIE-1 no necesita saldar (§G-7).

---

## §E · Riesgos

1. **Cambiar solo el nombre del sonido deja el defecto.** Si el escuchador global se queda con `'buttonClick'`, sonaría un clic en casi cualquier toque y doble en los botones con `SoundButton`. Hay que **retirarlo**, no renombrarlo.
2. **Desbloqueo en iOS.** Si la Portada deja de precargar todo sonido, el primer `Howl` nacería dentro del primer clic, y en iOS ese clic podría salir mudo. Mitigación: precargar `buttonClick` (A4-3). Sin iPhone real no está verificado.
3. **El mínimo visible retrasa el lobby.** Es un coste real, pequeño, y el rector lo tiene que aceptar con cifra (§G-5).
4. **`1.8b` ya está en rojo y subiría.** El indicador va en el bundle principal (no hay `lazy`). Serán unos cientos de bytes comprimidos, pero suben sobre el rojo conocido.
5. **`FormularioPuerta` es compartido** con `Entrada.jsx`, que está muerta en el árbol, y el Bautizo comparte la clase `puerta-btn`. Un cambio en los botones del formulario alcanza a las dos pantallas que lo usan, y las dos están hoy en la misma situación.
6. **Lobby y después sala.** Con una mesa en espera, el jugador ve el lobby y un instante después la sala de espera (`mi_sala`, B1-8). Si se quiere evitar, el indicador tendría que esperar también a `mi_sala`: una ida más en serie **para todos**. Hay que decidirlo (§G-6).
7. **Latencias reales sin medir.** El banco solo reproduce el mecanismo. Los casi 2 s de Victor no se pueden explicar desde aquí (§B3).
8. **Créditos posiblemente cruzados (fuera de alcance).** `creditos.js:65-66` da el ID 85867 a «Nudillos (golpe de mesa)» y el 504874 a la «Guitarra». En cambio, `AJILEI_Victory_Celebration_v1.0.md:345` da el **85867** a `ajilei-strum.mp3`. Uno de los dos está cruzado; no se ha verificado cuál.

## §F · Caminos

| Camino | Qué hace | Cubre | Coste |
|---|---|---|---|
| **1 · Indicador en la rama `CARGANDO`** | `App.jsx:339` pinta «Cargando» con retardo de ~300 ms y mínimo visible de ~500-600 ms | Todos los casos de B2 que tienen vacío: código, arranque, recarga, token caducado, cambio de cuenta | Un componente y su CSS en el bundle (`1.8b` sube), dos relojes con su limpieza, una clave `t()` y puertas nuevas (el anónimo no lo ve; el paso del código lo enseña tras el retardo) |
| **2 · La Portada aguanta hasta el lobby** | En el paso del código, `App` sigue pintando la Portada, con «Entrando…», mientras dura el `CARGANDO` que viene de `SIN_SESION`. Sin pantalla nueva | **Solo** lo que vio Victor (B1). El arranque con sesión sigue con el vacío | Bajo: un estado en `App` que recuerde de dónde se viene. Riesgo: la Portada recibe la sesión estando montada; el rotor sigue vivo; y el texto del botón tendría que bastar como «Cargando» |
| **3 · Los dos** | 2 para el paso del código (cero pantallas nuevas en el momento que más se ve) y 1 para el arranque y el cambio de cuenta | Todo | La suma de los dos. Es el más completo y el más caro |

**Recomendación:** el **1**. Es un solo sitio, cubre los cinco momentos con vacío, y el «Cargando» que pidió Victor se ve donde lo vio. El 2 es tentador por barato, pero deja el arranque de la PWA con sesión exactamente como hoy.

El sonido (§A4) es independiente del camino y se puede hacer en cualquiera de los tres.

## §G · Preguntas al rector

1. **¿Dónde suena el clic?** Propuesta: en los botones de la puerta (JUGAR, Enviar código, Entrar, Reenviar código, Cambiar correo), como en el resto de la app, y **no** al tocar un hueco. ¿O Victor quiere un clic en cualquier toque de la Portada? ¿Y el selector de idioma, que hoy no hace nada?
2. ¿Se estabiliza `play` con `useCallback` en `useSounds.js` (arreglo de raíz, hook compartido) o basta con retirar el único efecto que dependía de él?
3. **Indicador:** ¿puntos vivos (recomendado, honesto) o barra **indeterminada**? Una barra que se llena no tiene datos detrás (§B4).
4. ¿Camino 1, 2 o 3 (§F)?
5. Retardo antes de mostrar y mínimo visible: ¿~300 ms y ~500-600 ms, o qué cifras?
6. ¿El indicador espera también a `mi_sala`, para evitar el salto lobby → sala, a costa de una ida más para todos?
7. Clave `app.cargando` = «Cargando» en `textos.es.js`. ¿Se pasan de paso «Enviando…» y «Entrando…» a `t()`, o se dejan para IDI?
8. ¿Se mide la latencia real en el S25 con sesión real antes de la Fase 1 (marcas de tiempo en una compilación de preview contra Supabase)? Es lo único que explicaría los casi 2 s.
9. ¿Se sella en la Fase 1 un modo `bie` en `diagPUE` con la red de Supabase simulada (qué suena en la puerta y el tramo del indicador), como la sonda de esta fase?

## §H · Estimación de la Fase 1 (minutos de Claude Code)

| Bloque | ¿Depende de la lámina? | Minutos |
|---|---|---|
| Sonido: retirar el escuchador, poner el clic en los 5-6 botones de la puerta y precargar `buttonClick`; rótulo de 1.8c | No | 20-30 |
| Modo `bie` del arnés: red simulada, contador de audio, vigía de `#root`; puertas «sin rasgueo en la puerta», «clic en los botones», «el anónimo no ve el indicador», «el indicador aparece tras el retardo y dura el mínimo» | En parte (las puertas del indicador) | 35-50 |
| Lámina del indicador (puntos frente a barra indeterminada, sobre el verde, tres vistas) | **Es la lámina** | 25-35 |
| Indicador del camino 1: componente, CSS, relojes, `t()`, `role="status"`, movimiento reducido | **Sí** | 40-60 |
| Varas completas: build, vitest, eslint, `diagPUE` entero (~10 min de reloj), `diagSAL`, `lob`; e informe | No | 30-40 |
| **Total** | | **150-215**, de los que **65-95** cuelgan de la lámina |

El camino 2 restaría unos 20 minutos al bloque del indicador y el 3 sumaría unos 25-35.

---

**STOP.** Informe escrito. Sin `git add` ni commits.
