# AJILEI · RNK-1 (Rankings) · Fase 1c-ii · El mini-perfil, el teléfono acostado y el modo `rnk` · Informe · v1.0

**Ficha:** `AJILEI_RNK-1_Fase1c-ii_v1.0.md` (rector) · **Ejecuta:** Claude Code, en la misma sesión de la 1c-i · **Fecha:** 2026-10-25
**Base:** `main` en `fb3c30c` + la 1c-i en el árbol, sin commit (validada por Victor el 2026-10-25).
**Estado:** STOP-E revisado por el rector (2026-10-25: M-1, M-2, M-4, M-5 y M-7 resueltas; M-9 a la 1d). Ajuste B hecho (2026-10-26, **D-11**); a la espera de las pruebas de Victor. **Sin commits.** Nada en `supabase/`, ningún protegido abierto, nada de la 1d ni de la 1e.

---

## Resumen

- **El mini-perfil existe.** Es una sola tarjeta (`MiniPerfil`), montada por portal en `<body>`, fuera de `#root`. Se abre tocando cualquier fila de los dos rankings (tu fila abre la propia) y tocando la banda «Tu posición», también cuando dice «Gana tu primera mano para entrar». Se cierra con la ✕, tocando el velo o con `Escape`, y el foco vuelve a lo que la abrió.
  - **La ajena** lleva inicial, nombre, el hueco de la corona, «País y estado» en hueco y las dos líneas de rankings. Nunca lleva correo.
  - **La propia** añade tu correo de la sesión, «Solo lo ves tú.» y «Editar · Pronto» apagado.
  - **Si el jugador ya no existe,** la tarjeta se va, sale el toast «Jugador no encontrado» y se vuelven a pedir `top` y `mio`.
- **Mide lo de la lámina.**
  - En vertical: ajena 316,8 de alto y propia 468,3 (lámina 317 / 468).
  - Acostado: dos columnas de 600 de ancho, 173,8 / 277,5 de alto (lámina 174 / 278).
  - La ✕ mide 44 × 44 y el círculo 72 px.
- **El teléfono acostado va en dos columnas, sólo en Rankings.** Se aplica con alto ≤ 520 y ancho ≥ 760, y cubre 832×384, 851×393 y 915×412. En 915×412 coincide con la regla vieja y el resultado es el mismo (lista 300,8, cuatro filas, igual que en la 1c-i). Salas y Retar no cambian (`tam` en verde).
- **Hay modo nuevo, `diagDSK rnk`.** Mide 13 puertas más la consola en el 4173, con la sesión simulada y el banco imitado sembrado con los 139 jugadores del bypass. Sale verde en unos 10 s y entra en `humo`.
- **Línea base:**
  - vitest: 77 archivos / **1.873** pruebas en verde (+21; +2 del Ajuste B, D-11).
  - lint: los 21 de siempre; lo nuevo, 0.
  - build: verde, paquete principal 625,82 kB / 184,18 kB gzip (+5,54 / +1,45, con el Ajuste B).
  - arnés: `lob`, `humo`, `tam`, `webkit` y `rnk` en código 0 (tras el Ajuste B se volvió a correr sólo `rnk`: código 0).
  - Las huellas de los seis protegidos no cambian.
- **Desviaciones (detalle en §M):**
  - En 412×915 la ficha pide 400 de ancho; la fórmula sellada y la lámina dan **379**, y se mide contra la lámina (M-1).
  - «Solo lo ves tú.» va a 15 px, como se selló sin querer en la lámina (M-2).
  - En el bypass no hay correo, así que esa línea queda en hueco (M-3).

---

## §1 · Línea base, arnés y huellas

| Qué | Resultado |
|---|---|
| `vitest run` | 77 archivos / 1.873 pruebas, verde (1c-i: 76 / 1.852). Nuevas: `miniPerfilCore.test.js` (12, dos del Ajuste B) y 9 en `testRnk1c.test.js` |
| `eslint .` | 21 problemas (20 errores, 1 aviso), los de siempre: `GameTable.jsx` 19, `CardImage.jsx` 1, `SoundContext.jsx` 1. Lo nuevo, 0 |
| `vite build` | Verde. `index-*.js` 625,82 kB / gzip 184,18 kB tras el Ajuste B (antes, 625,73 / 184,14; 1c-i: 620,28 / 182,73). CSS en `index-*.css` (ahí entra `miniPerfil.css`) |
| `dist/` | Sin `ajilei:billetera-falsa` ni los nombres de `sembradosRanking.js` (p. ej. `Guardacaminos`: 0). Sigue `Bachaquero_VE`, de `SEMBRADOS_DEMO` (M-1 de la 1c-i, a higiene) |
| `diagDSK lob` | código 0 (41 s) |
| `diagDSK humo` | código 0 (223 s; gate, lob, retar y rnk en verde) (ya incluye `rnk`) |
| `diagDSK tam` | código 0 (300 s): Salas y Retar sin cambios |
| `diagDSK webkit` | código 0 (14 s) |
| `diagDSK rnk` | código 0 (10 s); otra vez código 0 tras el Ajuste B (D-11). `lob`, `humo`, `tam` y `webkit` no se repitieron: el ajuste sólo cambia una frase dentro de la tarjeta |

Huellas SHA-256, antes y después, idénticas al byte:

| Protegido | SHA-256 |
|---|---|
| `src/engine/gameEngine.js` | `317452ec5b57408a9010c727c5da4e1af039462d7aec58925bff7bf96719f6e0` |
| `src/engine/aiPlayer.js` | `3a8ea7b0386c7ddfa5e85d849ddfa1204113740da7a97b5bfce0f75714400801` |
| `src/engine/deck.js` | `69f92d6b9aac433cb99e7ec23d6052af1a6aa66c0f61eee180ba8f045911aa82` |
| `src/config/seatLayouts.js` | `0049051fd4b8b891deb86066bb1eb89669e3509f18bb995d288232636b3ee30c` |
| `src/styles/opponentPanel.css` | `4b91338a205e4a6a489466aa9d07ac7c263ca137b3ee12177812ad9a62833f5a` |
| `src/styles/gameTable.css` | `9b6b716f23ade19aaf0a6941efbc3c2bc219b4eca9cbf451dda9181c5ac47306` |

### El modo `rnk` (salida de la última corrida)

| Puerta | Medidas | Resultado |
|---|---|---|
| `rnk-abre` | 360×640 y 1920×1080 llegan a Maestros «listo» desde `[data-accion="rankings"]` | ✓ 2/2 |
| `rnk-fila` | fila 56,00 y círculo 34,72, con 100 filas, en 360×640, 412×915 y 1920×1080 | ✓ 3/3 |
| `rnk-banda` | 78,9 · 82,0 · 82,0 · 93,5 · 93,5 · 93,5 en los seis tamaños; quieta al desplazar | ✓ 6/6 |
| `rnk-desplaza` | lista al final; cuerpo 0, página 0, cabecera pegada (360×640 y 412×915) | ✓ 2/2 |
| `rnk-fin` | 100 filas → «Se muestran los 100 primeros.»; 5 filas → nada | ✓ 2/2 |
| `rnk-2col` | dos columnas en 832×384, 851×393, 915×412 y 1366×623; una en 360×640 y 1920×1080 | ✓ 6/6 |
| `rnk-oro` | la medalla del 1 tiene fondo transparente y borde de 3 px; el único fondo de oro macizo es `lob-mas` | ✓ 1/1 |
| `rnk-vino` | `.sal-fondo` pinta lo mismo que `var(--fondo-vino)`; texto de la píldora a **14,80 : 1** contra el tono más claro del vino | ✓ 1/1 |
| `rnk-perfil` | 412×915: 379,0 × 316,8 · 915×412: 600,0 × 173,8. Nombre de la fila 3, «listo», foco en la ✕; ✕, velo y `Escape` cierran y el foco vuelve a la fila 3. Ajeno sin puntos (D-11): `Rio_Caroni`, tocado en Fortunas (puesto 7 del banco pequeño), dice «Aún no está en este ranking», sin correo; 379,0 × 314,9 | ✓ 3/3 |
| `rnk-propio` | por la banda: 468,3, «Solo lo ves tú.», «Editar» `disabled`, correo `cap@example.invalid`. Con la banda vacía: 466,4 y «Gana tu primera mano para entrar» | ✓ 2/2 |
| `rnk-uuid` | ni un uuid en `main.sal` ni en el dialog; el ajeno no lleva `@` | ✓ 1/1 |
| `rnk-escala` | ningún `[data-escala]`; el dialog es hijo de `<body>`, fuera de `#root` | ✓ 1/1 |
| `rnk-nohay` | toast «Jugador no encontrado», `ranking_top` 1 → 2, sin tarjeta | ✓ 1/1 |
| consola | sin `pageerror` ni `console.error` | ✓ |

Cada puerta cuenta sus medidas y sólo es verde si las tiene todas.

---

## §2 · Medidas

Sonda propia contra el 5173 con el bypass (DevLocal, puesto 7), Chromium del arnés y dpr 1. Capturas fuera del repo:
`C:\Users\victo\AppData\Local\Temp\claude\c--Users-victo-OneDrive-Documents-ajilei\1934b08c-d027-4e70-87e7-bd3e7e7f1296\scratchpad\rnk1c\capturas2\`
(`<tamaño>-pantalla.png`, `-ajeno.png`, `-propio.png`, y `medidas2.json`).

### 2.1 · El mini-perfil contra la lámina (informe 1-L §4)

| Tamaño | Ajeno (medido) | Ajeno (lámina) | Propio (medido) | Propio (lámina) | Columnas | Desplaza |
|---|---|---|---|---|---|---|
| 360×640 | 328 × 316,8 | 328 × 317 | 328 × 468,3 | 328 × 468 | 1 | no |
| 390×844 | 358 × 316,8 | — | 358 × 468,3 | — | 1 | no |
| 412×915 | 379 × 316,8 | 379 × 317 | 379 × 468,3 | 379 × 468 | 1 | no |
| 915×412 | 600 × 173,8 | 600 × 174 | 600 × 277,5 | 600 × 278 | 2 | no |
| 851×393 | 600 × 173,8 | — | 600 × 277,5 | — | 2 | no |
| 832×384 | 600 × 173,8 | — | 600 × 277,5 | — | 2 | no |
| 1366×623 | 400 × 316,8 | 400 × 317 | 400 × 468,3 | 400 × 468 | 1 | no |
| 1920×1080 | 400 × 316,8 | 400 × 317 | 400 × 468,3 | 400 × 468 | 1 | no |

Lo que vale en todos los tamaños:
- La ✕ mide 44 × 44 y el círculo 72 px (64 en dos columnas).
- El velo es `rgba(0, 0, 0, 0.62)` y es hijo de `<body>`.
- El foco entra en la ✕. La ✕, el velo y `Escape` cierran, y el foco vuelve a la fila 3; desde la banda, vuelve a la fila de la banda.

### 2.2 · La pantalla en dos columnas acostada

| Tamaño | Columnas | Izq. / der. | Lista | Filas a la vista | Pestañas | Banda | Página desborda |
|---|---|---|---|---|---|---|---|
| 832×384 | **2** (antes 1) | 307,2 / 414,7 | 280,4 | 4 | 44 | 307,2 × 80,3 | no |
| 851×393 | **2** (antes 1) | 314,4 / 424,4 | 287,0 | 4 | 44 | 314,4 × 80,9 | no |
| 915×412 | 2 (las dos reglas) | 329,6 / 445,0 | 300,8 | 4 | 44 | 329,6 × 82,0 | no |
| 1366×623 | 2 (la de ≥ 900) | 480 / 648 | 461,1 | 7 | 61,3 | 480 × 93,5 | no |
| 360×640 · 412×915 · 390×844 · 1920×1080 | 1 | — | 371 · 615,5 · 555,1 · 676,8 | 6 · 10 · 9 · 11 | — | 78,9 · 82 · 80,7 · 93,5 | no |

En 915×412 aplican la regla nueva y la vieja (≥ 900 × ≤ 830), y el resultado es idéntico al de la 1c-i (lista 300,8, cuatro filas, banda 82).

---

## §3 · Archivo por archivo

| Archivo | Qué | Dónde |
|---|---|---|
| `src/components/MiniPerfil.jsx` (nuevo, 169 l.) | La tarjeta.<br>- Portal a `body` (:105).<br>- `data-mp-estado` en la raíz (:108); `role="dialog"`, `aria-modal`, `aria-labelledby` (:112).<br>- Pide `api.perfil` al montar.<br>- Avisa `onNoHay` (:85).<br>- Foco en la ✕ y `Escape` (:88-98).<br>- Líneas con el puesto en oro y la moneda delante del saldo, con el texto entero de `t()` (`Linea`, :42-60); la frase sin cifras, propia o ajena, va en gris (:47).<br>- Propio: correo, «Solo lo ves tú.» y «Editar · Pronto» `disabled` | :71 componente |
| `src/components/miniPerfilCore.js` (nuevo) | `esPropio` (sobre `esTu`), `lineasDe(perfil, propio)` y `estadoPerfil` | :12, :27, :44 |
| `src/components/miniPerfilCore.test.js` (nuevo) | 12 pruebas (§3 de la ficha, más dos del Ajuste B) | — |
| `src/styles/miniPerfil.css` (nuevo, 194 l.) | Se vale sola, con tokens de `theme.css`, un `--u` propio y su propia letra.<br>- Velo (:17), tarjeta `min(100%, 92u, 400px)` (:27).<br>- Hueco del correo (:147) y «Solo lo ves tú.» a 15 px (:151).<br>- Dos columnas con alto ≤ 520 (:180).<br>- Sin `!important`, sin hex y sin transición | — |
| `src/lib/rankingApi.js` | `REGLA_NOMBRE` (:60).<br>- `traducirPerfil`, que sólo copia los cinco campos (:68).<br>- `pedir`, común a las tres RPC (:89).<br>- `perfil(username)` (:129): un nombre fuera de la regla da `perfil: null` sin llamar; `[]` da `null`; sin red, `sinred` | — |
| `src/screens/Rankings.jsx` | `onJugador(username, el)` abre la tarjeta y guarda quién la abrió (:120).<br>- `cerrarPerfil` devuelve el foco (:124).<br>- `noHay`: cierra, pide el toast de la carcasa y suma un intento (:128).<br>- La banda vacía pasa a botón `rnk-tu-abre` (:167).<br>- `MiniPerfil` con `key` por nombre (:231).<br>- La prop `onJugador` de fuera desaparece (App nunca la pasaba) | — |
| `src/components/PantallaChips.jsx` | Prop `avisoRef` (:97-98): la carcasa deja ahí `avisar(clave)`, la misma función del «Pronto» (:118-124, `useImperativeHandle`).<br>- Cabecera (:70).<br>- Sin la prop, nada cambia | — |
| `src/styles/rankings.css` | §8: dos columnas con alto ≤ 520 × ancho ≥ 760, sólo Rankings, con la columna a 196u (:340-361).<br>- §9: `button.rnk-vacio` (:363).<br>- Aditiva: nada de lo anterior se toca | — |
| `src/config/textos.es.js` | Nueve claves `rnk.perfil.*` (:532-540), con `rnk.perfil.sinpuntos` del Ajuste B (:536). Rótulos reutilizados: `rnk.pestana.*`, `rnk.tu.vacio` y `lob.toast.pronto`. «Cerrar» no existía | — |
| `scripts/testRnk1c.test.js` | `describe('RNK-1c-ii · rankingApi.perfil')` (:131), 9 pruebas:<br>- regla del nombre, sin llamar;<br>- `[]`;<br>- banco ajeno y sin puntos;<br>- `DevLocal` en el 7;<br>- campos de más filtrados;<br>- sin red de cuatro formas | — |
| `scripts/rnk/rnk.mjs` (nuevo, 368 l.) | El modo `rnk`. Lleva un banco por contexto que cuenta llamadas y puede «perder» a un jugador para `mini_perfil` | — |
| `scripts/diagDSK.mjs` | Importa `runRnk` (:334).<br>- `rnk` en `MODOS_PREVIEW` (:429).<br>- Despacho `MODE === 'rnk' \|\| MODE === 'humo'` (:15333).<br>- Cabecera de `humo` | — |
| `scripts/arnes/nucleo.mjs` | `rnk: ARRIBA('verde')` (:212) y `'rnk'` en `MODOS_DSK` (:227) | — |

En esta fase no se tocan `salas.css`, `theme.css`, `App.jsx`, `supabase/` ni ningún protegido. Los tres primeros salen modificados en `git status` por la 1c-i.

---

## §4 · `git status` (sin commits)

```
 M scripts/arnes/nucleo.mjs
 M scripts/diagDSK.mjs
 M src/App.jsx
 M src/components/PantallaChips.jsx
 M src/config/textos.es.js
 M src/config/textos.test.js
 M src/dev/bancoImitado.js
 M src/dev/billeteraFalsa.js
 M src/screens/Lobby.jsx
 M src/styles/salas.css
 M src/styles/theme.css
?? docs/reportes/AJILEI_MOT-1_Fase0_Informe_v1.0.md
?? docs/reportes/AJILEI_MOT-1_Fase1-0_Sonda_Informe_v1.0.md
?? docs/reportes/AJILEI_RNK-1_Fase1c-i_Informe_v1.0.md
?? docs/reportes/AJILEI_RNK-1_Fase1c-ii_Informe_v1.0.md
?? laminas/mon1/_entorno.txt
?? laminas/mon1/lamina.html
?? laminas/mon1/tiempos.json
?? laminas/rnk1/
?? scripts/rnk/
?? scripts/testRnk1c.test.js
?? src/components/MiniPerfil.jsx
?? src/components/miniPerfilCore.js
?? src/components/miniPerfilCore.test.js
?? src/dev/sembradosRanking.js
?? src/lib/rankingApi.js
?? src/screens/Rankings.jsx
?? src/screens/rankingsCore.js
?? src/screens/rankingsCore.test.js
?? src/styles/miniPerfil.css
?? src/styles/rankings.css
```

Todo lo de la 1c-i sigue en el árbol, sin commit; lo de esta fase va encima. También están, sin tocar, tres cosas ajenas a RNK-1: `docs/reportes/AJILEI_MOT-1_*` y `laminas/mon1/`.

---

## §5 · Pruebas de Victor

### A · PC con el bypass (5173) · unos 15 min

`npm run dev`, entrar a Rankings y abrir F12 en modo dispositivo.

| Paso | Qué debe ver |
|---|---|
| 390×844 · tocar la fila 1 (Bachaquero_VE) | Se oscurece el fondo y sale la tarjeta: «B», `Bachaquero_VE`, «País y estado» punteado, «LOS GRANDES MAESTROS · Puesto **1** · 96 puntos» y «LAS GRANDES FORTUNAS · Puesto **2** · 🪙 12.950 Heptacoins». **Sin correo** y sin «Editar» |
| Tocar la ✕ | Se cierra y el foco queda en la fila 1 |
| Abrirla otra vez y tocar fuera de la tarjeta | Se cierra |
| Bajar hasta tu fila 7 (DevLocal · tú) y tocarla | Tarjeta propia: «Puesto 7 · 11 puntos», «Puesto 68 · 5.000 Heptacoins», «CORREO» con la línea **vacía** (en el bypass no hay correo, M-3), «Solo lo ves tú.» y «Editar · PRONTO» apagado |
| Tocar la banda «Tu posición» | La misma tarjeta propia |
| 1920×1080, lo mismo una vez | Tarjeta de 400 de ancho, centrada; mismo contenido |
| Horizontal 851×393 u 832×384 | Rankings en **dos columnas**: a la izquierda pestañas, subtítulo y banda; a la derecha la lista |
| Ahí, tocar una fila | La tarjeta en **dos columnas** (600 de ancho): a la izquierda círculo, nombre y país; a la derecha las líneas |

En la consola seguirá el `401 … rpc/mi_sala` de siempre del bypass. Es anterior (ARN-3c) y no viene de Rankings.

### B · Túnel contra la base real · unos 15 min

Antes del túnel: `npm run build`, para que el 4173 sirva esta versión.

| Aparato · cuenta | Paso | Qué debe ver |
|---|---|---|
| S25 · `test1976` | Rankings → «Las grandes fortunas» → tocar `ticotest2022` | Tarjeta ajena. Fortunas «Puesto **2** · …». Maestros dice «**Aún no está en este ranking**» (no tiene puntos; D-11). Sin correo |
| S25 · `test1976` | Tocar tu fila (o la banda) | Tarjeta propia con **tu correo real**, «Solo lo ves tú.» y «Editar · PRONTO» apagado |
| S25 · `test1976` | Girar el S25 | Rankings en dos columnas. Al tocar una fila, la tarjeta sale en dos columnas |
| S25 | Cerrar con la ✕ y con el velo | Las dos cierran |
| Motorola · `ticotest2022` | Rankings → tocar `test1976` | Tarjeta ajena: Maestros «Puesto **1** · 3 puntos» |

El botón «atrás» del teléfono **no** cierra la tarjeta: queda fuera de esta campaña, tal como se selló (M-10).

### C · Dejarlo como estaba · 1 min

Cerrar el dev y el túnel. No hay commits que deshacer.

Resultado real · 2026-10-26 (Victor): A · bypass en la PC: conforme. B · túnel con el S25 (test1976): tarjeta ajena de 2Alejandro desde Fortunas (sin correo; Maestros sin puntos; Fortunas «Puesto 3 · 3.650»); tarjeta propia con el correo real, «Solo lo ves tú.» y «Editar · Pronto» apagado; S25 acostado: Rankings en dos columnas y la tarjeta en dos columnas de 600 (nena82 y la propia); ✕ y velo cierran. Ajuste B comprobado por túnel: la ajena sin puntos dice «Aún no está en este ranking». Decisiones del rector sobre §M: M-1 queda 379 (la lámina manda; los 400 de la ficha eran error del rector); M-2 quedan 15 px; M-4, M-5 y M-7 aceptadas; M-9 va a la 1d. Veredicto: PASA.

---

## §M · Notas, desviaciones y preguntas

- **M-1 · El ancho del mini-perfil en 412×915 (desviación; pregunta).** La puerta `rnk-perfil` de la ficha pide 400 × 317 en 412×915. La fórmula sellada en §0, `min(100%, 92u, 400px)`, da ahí 92 × 4,12 = **379**, y es lo que midió la lámina (informe 1-L §4: 379×317). Se construyó la fórmula y la puerta mide contra la lámina. Los 400 salen a partir de `--u` = 4,35 (744×1100, 1366×623, 1920×1080). ¿Queda 379? **Rector (2026-10-25): queda 379; el 400 de la ficha era un error y la lámina manda.**
- **M-2 · «Solo lo ves tú.» a 15 px (desviación anotada; pregunta).** En la lámina, la regla de 11,5 px (`.rnk-p-solo`) pierde por especificidad contra `.rnk-p-correo span`, así que la línea sale a 15 px en la imagen aprobada y en el alto de 468. Se reproduce lo sellado (15 px, color `--text-faint`): con 11,5 la tarjeta propia mide 463,9 y sale de los ±2. Si el rector prefiere 11,5, es una línea en `miniPerfil.css:151` y el propio queda en ~464 / ~273. **Rector (2026-10-25): queda 15 px.**
- **M-3 · En el bypass no hay correo.** `useAuth` devuelve `correo: null` con el bypass (`useAuth.js:372`), igual que en la hoja ⚙ del lobby. La línea del correo reserva su alto (O1) y la tarjeta propia mide 468,3 con correo o sin él. En la prueba A la línea sale vacía; en el 4173 del arnés sale `cap@example.invalid`, y en el túnel, el correo real.
- **M-4 · «La tarjeta no se abre» frente a «se abre ya».** §0 pide las dos cosas: abrir con el nombre mientras carga, y no abrir si el jugador no existe. Se resolvió así: abre al instante; si `mini_perfil` contesta «no hay», la tarjeta avisa con `onNoHay` (una prop que la ficha no listaba) y Rankings la cierra, pone el toast y vuelve a pedir la lista. En la práctica es un parpadeo de un fotograma con el banco y de un viaje de red en la base real. **Rector (2026-10-25): aceptada.**
- **M-5 · El toast, por la carcasa.** `SalaOpciones` tiene su propio toast porque no usa `PantallaChips`. Rankings sí la usa, así que se le dio a la carcasa una salida, `avisoRef` (`useImperativeHandle`), para que la pantalla pida el aviso con el mismo reloj que el «Pronto». Retar y Armar mesa no la pasan y no cambian. **Rector (2026-10-25): aceptada.**
- **M-6 · «Jugador no encontrado» en el arnés.** Toda fila sale de un jugador que existe, así que la puerta `rnk-nohay` usa un banco que «pierde» a MaracuchaBrava_ (puesto 3) sólo para `mini_perfil`: es el que se renombró o se borró entre la lista y el toque. El «nombre inventado» de la ficha está en `testRnk1c` (`Inventado_99` → `perfil: null`).
- **M-7 · El círculo de la tarjeta es verde también desde Fortunas.** La lámina sólo dibujó la tarjeta sobre Maestros, y la tarjeta es una sola (la abrirá también la victoria), así que no cambia con el fondo. Si se quiere vino desde Fortunas, es una regla más. **Rector (2026-10-25): aceptada (verde siempre).**
- **M-8 · `rnk` entra en `humo`.** Cuesta unos 10 s con el preview que ya levanta `lob`.
- **M-9 · Falta la fila de `diagDSK rnk` en `docs/AJILEI_Invariantes_v1.0.md` §6.** Esta ficha no toca documentos normativos. Queda para la ficha de commits, si el rector la quiere. **Rector (2026-10-25): va en la 1d, no aquí.**
- **M-10 · Lo que no se hizo, como se selló.** El botón «atrás» del teléfono no cierra la tarjeta. No hay trampa de foco: `Tab` puede salir del dialog, porque §1.6 pide lo mínimo (foco a la ✕, de vuelta al cerrar, `Escape`). No hay transición de entrada.
- **M-11 · Peso.** El paquete principal crece +5,45 kB (+1,41 gzip): tarjeta, núcleo y API. Rankings no es diferida, y la tarjeta va con ella.
- **M-12 · Una trampa nueva de la lámina.** Toda medida sellada sale del CSS tal como se aplicó, no tal como se escribió. Aquí había una regla de la lámina perdida por especificidad (M-2). Conviene que el rector lo tenga en cuenta al sellar una medida con el inspector.

---

## §D · Ajustes tras el STOP-E

- **D-11 · Ajuste B: la tarjeta ajena sin puntos (2026-10-26).** En la tarjeta de otro jugador sin puesto de Maestros, la línea decía «Gana tu primera mano para entrar» (`rnk.tu.vacio`), una frase que le habla a quien mira. Ahora dice «Aún no está en este ranking», con la clave nueva `rnk.perfil.sinpuntos`. La tarjeta propia sigue con `rnk.tu.vacio`, igual que la banda.
  - **Núcleo.** `lineasDe(perfil, propio)` (`miniPerfilCore.js:27`) recibe si la tarjeta es la propia, y por omisión toma «ajena». `MiniPerfil.jsx:101` le pasa `propio`. `Linea` pinta en gris cualquier frase sin cifras (:47), no sólo `rnk.tu.vacio`.
  - **Texto.** `textos.es.js:536`, y el comentario de cabecera de la sección dice cuál va en cada tarjeta.
  - **Prueba.** `miniPerfilCore.test.js` pasa de 10 a 12 pruebas: propio sin puntos → `rnk.tu.vacio`; ajeno sin puntos → `rnk.perfil.sinpuntos` (también por omisión); con puesto, propio y ajeno dicen lo mismo.
  - **Puerta `rnk-perfil` (2/2 → 3/3).** El banco grande sí tiene jugadores sin puntos, pero no se alcanzan: los diez tienen 2.500 o 0 y quedan del 113.º al 139.º en Fortunas, fuera de las 100 filas. La medida nueva usa la celda del banco pequeño (la de `rnk-fin` con 5 filas y la banda vacía), con un sexto sembrado sin puntos, `Rio_Caroni` (2.500). Maestros sigue con 5 filas. En Fortunas sale en el puesto 7; al tocarlo, la tarjeta dice «Aún no está en este ranking», sin correo ni «Solo lo ves tú.».
  - **Alto.** La ajena sin puntos mide 379,0 × 314,9 en 412×915, 1,9 menos que la de la fila 3 (316,8): la frase gris va a 14,5 px y la línea con cifras a 16. Es lo mismo que ya pasaba en la propia con la banda vacía (466,4 frente a 468,3). La puerta no compara ese alto con la lámina, que sólo selló la ajena con puntos.
  - **Corridas.**
    - vitest: 77 archivos / 1.873 pruebas en verde.
    - lint: los 21 de siempre.
    - build: 625,82 kB / 184,18 kB gzip.
    - `diagDSK rnk`: código 0, `VERDE`, 13 puertas y consola.
  - **Prueba de Victor.** En la prueba A (bypass) no se puede ver: ningún sin puntos entra en las 100 filas de Fortunas. Se ve en la B: `ticotest2022` desde `test1976` (paso de §5.B actualizado).
