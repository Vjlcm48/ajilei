# AJILEI · CFG-1 · Fase 1a · Lo rápido del ⚙ · Informe v1.0

**Escrito para:** el rector y Victor
**Ficha:** `AJILEI_CFG-1_Fase1a_v1.0.md` · **Base:** `main` en `c0bc2c1` · **Fecha:** 2026-10-29
**Estado:** STOP-A2. **Sin commits.** Esperan las pruebas de Victor (§6 y §7).

---

## Resumen

- **La hoja del ⚙ es un componente** (`src/components/HojaConfiguracion.jsx`) que montan el lobby y las seis pantallas de `.sal`. El ⚙ que decía «Pronto» en Retar, Armar mesa, Rankings, Salas, Sala de espera y PvP abre la misma hoja, anclada al relleno de cada pantalla.
  - El desvío de −6,61 y −4,53 px que midió la lámina queda en 0.
  - En la Sala de espera la hoja queda por encima de su cuerpo, de su velo y de su diálogo, sin tocar nada de la sala.
- **Lo que trae la hoja:**
  - Sonido vivo, con «Sí»/«No» y el mismo estado que el ⋮.
  - Idioma: «Español» + «Pronto».
  - «Enviar sugerencia» desplegable, con `mailto:` y «Copiar correo».
  - «Acerca de» empieza por `AJILEI 0.9.0 · c0bc2c1`, con respaldo `local`.
  - Filas a 44.
  - Cabecera fija, salvo en el apaisado bajo.
- **El ojito**, solo en la píldora del lobby:
  - la caja de la cifra mide lo mismo abierta y tapada, también con 9 HC;
  - los puntos no se mueven mientras la cifra cuenta;
  - se recuerda en el aparato (`ajilei.saldoOculto`).
- **Zonas táctiles de 44** en el lobby, Retar, Salas, Armar mesa y Rankings, con los cuatro arreglos de la lámina más dos:
  - **R-9:** en 360, la casa y la flecha crecen hacia abajo;
  - el «+» del lobby, por encima de la ficha de la constancia.
  - Resultado: cero solapes en las cinco celdas.
- **Modo nuevo `diagDSK cfg`**, con diez puertas, en `humo`. Sale verde. De los otros ocho, todos verdes menos `u1`, que sigue en su rojo conocido desde APU-1 (Tapetes del ⋮ a 63×35).
- **Línea base:**
  - vitest 1.903/1.903 (antes 1.896: cuatro del accesor y tres de `testInvariantes`, por las filas nuevas);
  - lint 21;
  - build +5,25 kB (632,54 → 637,79 kB).
- **Desviaciones:** cinco (§4). Las dos que conviene mirar:
  - **D-3:** la hoja trae su propio aviso. El de `.sal` vive bajo el velo y ningún `z-index` lo saca.
  - **D-5:** cambié la métrica de desborde de `lob.8`–`lob.10`, que contaba como desborde la zona invisible del ⚙.

---

## 1. Línea base, arnés y huellas

| | Antes (`c0bc2c1`) | Después |
|---|---|---|
| `vitest run` | 79 archivos · 1.896 | 80 archivos · **1.903**: el archivo nuevo es `src/lib/saldoOculto.test.js` (4 pruebas); +3 en `testInvariantes`, por INV-68, INV-69 y la fila del normativo |
| `npm run lint` | 21 (20 errores, 1 aviso) | 21 (20 errores, 1 aviso) |
| `npm run build`, paquete principal | 632,54 kB · 186,11 gzip | 637,79 kB · 187,77 gzip (**+5,25 kB**, +1,66 gzip) |
| `grep pronto` en `Lobby.jsx` | 7 llamadas (perfil, Tienda, Reglas, Sonido, Idioma, Sugerencia, Eliminar) | 3 en el lobby: perfil, Tienda y «Cómo se juega». En la hoja (`HojaConfiguracion.jsx`) quedan **solo Idioma y Eliminar** |

- **El lint antes de empezar daba 24, no 21.** Los tres de más eran del `guion.js` de la lámina (`laminas/cfg1a`, sin seguimiento): variables sin usar. Los arreglé allí y la vara volvió a 21.
- **La versión en el paquete:**

| Compilación | Lo que enseña «Acerca de» |
|---|---|
| Normal | `0.9.0` + `c0bc2c1` |
| Con `GIT_DIR=/nonexistent` (sin git) | `0.9.0` + `local`, y compila |
| Con `WORKERS_CI_COMMIT_SHA=ABCDEF0123456789` | `abcdef0` |

**Arnés**, uno detrás de otro, el 2026-10-29. Los modos de preview, en `--puerto=4192`: el 4173 es el del túnel de Victor.

| Modo | Resultado | Tiempo |
|---|---|---|
| `diagDSK cfg` | **verde**, las diez puertas y la consola | 64 s |
| `diagDSK lob` | **verde** tras D-5. La primera corrida salió roja en 8 celdas, por lob.8–10, «la barra desborda 6»: es la zona del ⚙ (§4) | 42 s |
| `diagDSK retar` | verde | 26 s |
| `diagDSK rnk` | verde | 12 s |
| `diagDSK suma` | verde | 57 s |
| `diagDSK u1` | **rojo conocido, no de esta fase.** Geometría 20/20 y sonido 2/2 (con `is-off` presente), pero `hits 0/8`: `.util-item-tapetes` mide 63×35 contra 44 en las ocho celdas. Es el rojo que dejó consignado APU-1 (`AJILEI_APU-1_Informe_Cierre_v1.0.md`, §5) y el hueco declarado de INV-07; la Fase 0 de CFG-1 midió lo mismo. La 1a no toca esa fila. Se resuelve cuando la 1e saque Tapetes del ⋮ | 14 min 35 s |
| `diagDSK menu-movil` | verde | 8 min 2 s |
| `diagDSK tapetes` | verde | 3 min 11 s |
| `diagCEL0 celebracion` | verde (0 fallos, control verde) | 8 min 10 s |

**Las diez puertas de `cfg`**, con la consola limpia como undécima:

| Puerta | Qué mide | |
|---|---|---|
| cfg.zona | ≥ 44 geométrica y por barrido (≥ 43,5 y ≥ 43: el barrido va de píxel en píxel) en el ⚙, el avatar, el «+», el ojito, la casa, la flecha, los chips, los ± y «Unirme», en el lobby, Retar y Salas, en las cinco celdas | verde |
| cfg.solape | cero solape entre zonas de tocables | verde |
| cfg.ojito | caja igual abierta y tapada con 5.000 (cinco celdas) y con 9 HC (cuatro celdas); tapada mientras cuenta el aviso de la constancia (5.000 → 5.500 en 412×915, una sola caja durante toda la cuenta); recordada al recargar; Rankings sin ojito y con la cifra a la vista | verde |
| cfg.hoja | filas y botones ≥ 44; 360×640 con «Acerca de» abierto termina en 575,34 (≤ 584) y no se desplaza; cabecera fija, salvo en 915×412, donde se desplaza la hoja entera | verde |
| cfg.ancla | borde derecho − ⚙ = 0 y el hueco igual al del lobby, en el lobby, Retar y Rankings, en 1366×768 y 915×412 | verde |
| cfg.toast | «Copiado» sale, queda encima del velo y el portapapeles dice `soporte@ajilei.io` | verde |
| cfg.sonido | la fila cambia `ajilei.sound` y la pastilla (cinco celdas); hoja → ⋮ → hoja en 412×915 (piel móvil) y en 1366×768 (escritorio): `is-off` con el icono a opacidad 0,5, y encendido en el ⋮ la hoja dice «Sí» | verde |
| cfg.version | `AJILEI 0.9.0 · ` + 7 hex o `local`, y es la primera línea | verde |
| cfg.inv45 | los dos botones de la sugerencia y el crédito (DOM), la línea de SumaMente en Rankings (DOM) y el enlace del intersticial (fuente) | verde |
| cfg.sinojito | Retar, Salas y Rankings sin ojito | verde |

**Huellas.** `git diff --stat` de los seis protegidos sale vacío:
- `src/engine/gameEngine.js`
- `src/engine/aiPlayer.js`
- `src/engine/deck.js`
- `src/config/seatLayouts.js`
- `src/styles/opponentPanel.css`
- `src/styles/gameTable.css`

La regla `is-off` del ⋮ va en `menuMovil.css` y en `hojaConfiguracion.css`, no en `gameTable.css`.

---

## 2. Las medidas, frente a la lámina

**Cómo se mide.** Con `diagDSK cfg`, sobre el bundle real.
- **Zona geométrica** = la caja ∪ el `::after` resuelto.
- **Efectiva** = barrido en cruz con `elementFromPoint`. El barrido cuenta los dos bordes, así que una zona de 44 da 45.

### 2.1 Zonas (caja → zona) y la regla que la produce

| Tocable | 360×640 | 412×915 | 915×412 | 1366×768 | 1920×1080 | Regla |
|---|---|---|---|---|---|---|
| ⚙ | 31,31 → 44 | 35,84 → 44 | 35,84 → 44 | 52,19 | 52,19 | `tactilLobby.css` §3, `inset: min(0px, calc(50% − 22px))`; capa §4 |
| avatar | alto 38,5 → 44 | 44,06 | 44,06 | 64,19 | 64,19 | §3 |
| «+» | 18,36 → 43,98 (ef. 45) | 21 → 44 | 21 → 44 | 30,59 → 44 | 30,59 → 44 | §3 + `z-index: 1` en el lobby |
| ojito | 18,36 → 43,98 (ef. 45) | 21 → 44 | 21 → 44 | 30,59 → 44 | 30,59 → 44 | §3 |
| casa / flecha | 31,31 → 44 | 35,84 → 44 | 35,84 → 44 | 52,19 | 52,19 | §3, casa §3 (`button.sal-casa`), cabecera §4, R-9 §5 en 360 |
| chips (Retar) | alto 40 → 44 | 40 → 44 | 44 | 44,39 | 57 | §3 |
| ± | 40 → 44 | 40 → 44 | 40 → 44 | 42 → 44 | 42 → 44 | §3 |
| «Unirme» | alto 35,19 → 44 | 36,25 → 44 | 44 | 44 | 52,8 | §3 |
| **Solapes** | **0** | 0 | 0 | 0 | 0 | R-9 (§5) |

- **Frente a la lámina:**
  - Las cifras de caja y zona son las mismas.
  - **Solapes en 360:** la lámina medía 3,7 px con V1-C (0,95 con A). Ahora 0, por R-9.
  - **Casa y flecha en 360:** la lámina medía su efectiva en 41 de alto, porque la zona de la barra se comía 3 px. Ahora 45.
  - **El «+» en 360:** daba 42 efectivo, porque la primera pepita de la ficha de la constancia, que va después en el DOM, le comía 1,4 px. La lámina no lo vio: midió con el bypass, sin la ficha completa. Ahora 45.
- **R-9, como se aplicó.**
  - Por debajo de 390 px de ancho, la zona de la casa y la de la flecha sube como mucho 2 px y el resto (10,68 en 360) va hacia abajo. Siguen midiendo 44.
  - Con −2 arriba queda 0,6 px de aire con las zonas de la barra.
  - Hacia abajo no pisa nada: el primer chip de Retar está más abajo y `cfg.solape` lo mide.
- **Zona sobre algo no tocable** (informativo, como en la lámina):
  - El ojito cubre 8,5 px de la cifra en 360 (6,56 en 412).
  - El «+» cubre 5,63 en 360.
  - Tocar el borde de la cifra tapa o destapa, o abre «Conseguir monedas».

### 2.2 La caja de la cifra

| Celda | 5.000 abierta / tapada | 9 HC abierta / tapada | Lámina V1-C (5.000) |
|---|---|---|---|
| 360×640 | 31,25 × 23,2 / 31,25 × 23,2 | 31,25 / 31,25 | 31,05 |
| 412×915 | 35,75 / 35,75 | 35,75 / 35,75 | 35,38 |
| 1366×768 | 52,09 / 52,09 | 52,09 / 52,09 | 51,13 |
| 1920×1080 | 52,09 × 26,09 / 52,09 × 26,09 | 52,09 / 52,09 | 51,13 |

- **Regla:** `tactilLobby.css` §2, `.lobby .lob-pildora .bd-num { min-inline-size: 4.6ch }`, la caja del hueco «—» de ECO-1b, que ahora vale siempre en el lobby.
- **Por qué difiere de la lámina** (+0,2 a +0,96 px): «5.000» mide algo menos que 4,6 ch, y la regla sellada en §0 («los puntitos van en la caja de 4,6 ch») la ensancha hasta ahí. Es lo que hace que con 9 HC la caja mida lo mismo.
- **Por encima de cuatro dígitos** la caja crece con la cifra, igual abierta que tapada: el ancho dice «cinco o más dígitos». Se dejó así porque O1 manda.

### 2.3 La hoja

| | Lámina (V2-A, V4-A) | 1a |
|---|---|---|
| Alto plegada, 360×640 | 383,52 | **383,52** |
| Alto con «Acerca de», 360×640 | 526,03 (`V2A-acerca`, `V4A`) | **526,03**, termina en 575,34 (tope 584), no se desplaza |
| Filas, 360×640 | 44,73 / 44,73 / 44 / 44 / 44 / 45,73 | igual |
| Botones de la sugerencia, 360×640 | 116 × 44 | 116,02 × 44 |
| 412×915 | — | 401,48 plegada · 565,52 con «Acerca de» |
| 915×412 | se desplaza el cuerpo (210 de 282 a la vista) | **se desplaza la hoja entera** (329,59 de alto) |
| 1366×768 con «Acerca de» | se desplaza | se desplaza el cuerpo, con la cabecera quieta |
| 1920×1080 con «Acerca de» | — | 751,69, sin desplazarse |

- **Sobre el 532,14 de la ficha.** La ficha pide «383,52 plegada y 532,14 con "Acerca de" abierto». En las tablas de la lámina no hay ninguna medida de 532,14: con V2-A y V4-A, «Acerca de» abierto mide 526,03 (`medidas.json`, celdas `V2A-acerca_360x640` y `V4A_360x640`).
- **Reglas:**
  - `hojaConfiguracion.css` §2: el alto de siempre, filas `min-height: 44px`, flex en columna, `.cfg-hoja-cuerpo` desplazable.
  - Para el apaisado bajo, el `@media (orientation: landscape) and (max-height: 520px)` del mismo §2.

### 2.4 El anclaje (hoja − ⚙)

| Celda | Lobby (derecha / hueco) | Retar | Rankings | Lámina V6 (Retar/Rankings) |
|---|---|---|---|---|
| 360×640 | 0 / 1,81 | 0 / 1,81 | 0 / 1,81 | — |
| 412×915 | 0 / 2,08 | 0 / 2,08 | 0 / 2,08 | — |
| 915×412 | 0 / 2,08 | 0 / 2,08 | 0 / 2,08 | −4,53 / 6,61 |
| 1366×768 | 0 / 3,00 | 0 / 3,02 | 0 / 3,02 | −6,61 / 9,61 |
| 1920×1080 | 0 / 3,00 | 0 / 3,00 | 0 / 3,00 | — |

- **Regla:** `hojaConfiguracion.css` §0, `--cfg-pad`: `--lob-pad` en el lobby y `--pad` en `.sal`. El «traje apretado» de 2,4 u se recoge solo, porque la variable se resuelve en la pantalla.
- **Sala de espera** (molde `?sal=espera-anfitrion`, sonda aparte): derecha 0 y hueco 1,81 / 2,08 / 3,00 en 360×640, 915×412 y 1366×768.
- **PvP:** igual, salvo en 915×412 (§4, O-1).

---

## 3. Archivo por archivo

**Nuevos**

| Archivo | Qué es |
|---|---|
| `src/components/HojaConfiguracion.jsx` | La hoja. Sale de `Lobby.jsx:283-368`, más Sonido (:162), Idioma (:167), la sugerencia (:172-205), la versión (:226-228), el aviso propio (:252) y el foco, `Escape` y la clase del `<body>` que vivían en `Lobby.jsx:121-135` (:66-81) |
| `src/styles/hojaConfiguracion.css` | §0 `--cfg-pad`/`--cfg-linea`; §1 la pastilla (de `lobby.css` §5); §2 velo, hoja, filas a 44, cuerpo desplazable y la excepción del apaisado bajo (de `lobby.css` §7); §3 la sugerencia; §4 la versión, con el `<code>` desvestido; §5 el aviso; §6 `is-off` del ⋮ en escritorio |
| `src/styles/tactilLobby.css` | §1 el ojito; §2 la cifra en 4,6 ch, abierta y tapada; §3 el camino Z y la casa de la carcasa; §4 las capas; §5 R-9. Cargada en `src/main.jsx:24` |
| `src/lib/saldoOculto.js` + `.test.js` | El accesor de `ajilei.saldoOculto` (`'si'`/`'no'`), con try/catch; cuatro pruebas |
| `src/lib/copiarTexto.js` | `navigator.clipboard` con respaldo por `<textarea>` + `execCommand`; devuelve si pudo |
| `src/config/soporte.js` | `CORREO_SOPORTE` |
| `src/config/version.js` | `VERSION` y `COMMIT` desde las globales de `define`, con respaldo |
| `scripts/cfg/cfg.mjs` | El modo `cfg` |
| `docs/AJILEI_Configuracion_v1.0.md` | El normativo nuevo, §1–§10 |

**Cambiados**

- **Pantallas y componentes**
  - **`src/screens/Lobby.jsx`**
    - Monta `HojaConfiguracion` (:273-279).
    - Estado del ojito con el accesor (:87-92); se lo pasa a la barra (:190-191).
    - Se van los imports de créditos y de `enmascararCorreo`.
    - El enlace del crédito (antes `:352`) se mudó con la hoja y lleva el atributo.
  - **`src/components/BarraSuperior.jsx`**
    - Props `saldoOculto` y `onOjito` (:94-95).
    - El ojito como `SoundButton` con `aria-pressed` y `aria-label` (:140-153).
    - `data-saldo-oculto` (:176); la cifra tapada en `.pil-tapada` con `aria-hidden` (:195).
    - Sin `onOjito` no hay ojito.
  - **`src/components/BalanceDisplay.jsx`**: prop opcional `junto` entre la moneda y la cifra. La mesa no la pasa.
  - **`src/components/IconosLobby.jsx`**: `IconoOjo` e `IconoOjoTachado`.
  - **La hoja en las demás pantallas.** El ⚙ abre la hoja y se pasan `ajustesRef` y `ajustesExpandido`:

    | Archivo | ⚙ | Hoja |
    |---|---|---|
    | `src/components/PantallaChips.jsx` (Retar, Armar mesa, Rankings) | :145 | :198 |
    | `src/screens/SalaOpciones.jsx` | :256 | :419 |
    | `src/screens/SalaEspera.jsx` | :492 | :683, después de `.sal-cuerpo` |
    | `src/screens/PartidaPvP.jsx` | :58 | :98 |

  - **INV-45:**
    - `src/screens/Rankings.jsx:275`: `data-sin-pantalla-completa` en la línea de SumaMente.
    - `src/screens/IntersticialSumaMente.jsx:201`: ídem en el botón de la tienda.
- **Estilos**
  - **`src/styles/lobby.css`:**
    - §5 (la pastilla) y §7 (la hoja) salen a `hojaConfiguracion.css`; quedan dos notas (:514, :552).
    - La hoja y el velo salen también del bloque de `prefers-reduced-motion` (:663).
    - **El comentario falso de `:682-683`** («2,4·u … por encima de los 44px en todo el rango») se fue con la regla. En su sitio nuevo (`hojaConfiguracion.css` §2) dice lo que se midió: 40,45 en 360 y el piso de 44.
  - **`src/styles/menuMovil.css:257-262`**: `.util-item-sound.is-off .util-ico { opacity: 0.5 }`, dentro de la piel móvil.
- **Compilación**
  - `vite.config.js`: `define` con `__APP_VERSION__` y `__APP_COMMIT__` (:40-43); `commitCorto()` con la cadena y el `try` (:20-30).
  - `package.json` y `package-lock.json`: `0.9.0`.
- **Textos**
  - `src/config/textos.es.js:58-68`: once claves `lob.`.
  - `src/config/textos.test.js`: el par declarado `lob.toast.copiado = sal.espera.codigo.copiado`, con su motivo.
- **Arnés y pruebas**
  - `scripts/testClavesAlmacen.test.js`: `ajilei.saldoOculto` y su accesor (16 claves, 12 accesores).
  - `scripts/diagDSK.mjs`:
    - el modo `cfg` en la cabecera, en `MODOS_PREVIEW` y en el despacho, dentro de `humo`;
    - `LOB_BARRA` apaga las zonas mientras mide el desborde (D-5).
  - `scripts/arnes/nucleo.mjs`: `cfg` en `VEREDICTO_DSK` (`verde`) y en `MODOS_DSK`.
- **Documentos**
  - **`docs/AJILEI_Invariantes_v1.0.md`:**
    - INV-68 e INV-69 (nuevas);
    - INV-07: fuente al menú v1.5 y a Configuración §7, vigilante `diagDSK cfg`, hueco declarado de la Sala de espera y PvP;
    - INV-12: 16 claves, 12 accesores. Decía «12 claves, 8 accesores», un número que ya estaba atrasado;
    - INV-45: cinco portadores nuevos, y la cita de `SalaEspera.jsx` pasa de :530 a :536;
    - recuento 69/62;
    - §4: la fila del normativo;
    - §6: la fila de `diagDSK cfg` y la de `humo`.
  - **`docs/AJILEI_Protegidos_v1.0.md`:** sin cambios.

**Fuera de `src/`, sin seguimiento:** `laminas/cfg1a/guion.js` (los tres errores de lint, §1).

---

## 4. Desviaciones

- **D-1 · La hoja se extrajo a componente en la 1a-i, no en la 1a-ii.** Sonido, sugerencia y versión se escribieron directamente en `HojaConfiguracion.jsx`, con el lobby como único consumidor hasta la 1a-ii. Así no se escribió dos veces lo mismo. El resultado final es el que pide §3.2.
- **D-2 · La dirección de soporte es una constante, no un texto** (`lob.cfg.sugerencia.correo` no existe). La ficha lo dejaba abierto. Con las dos, la dirección visible saldría del diccionario y la del `mailto:` y el portapapeles de la constante: dos fuentes que pueden divergir. Una dirección no se traduce.
- **D-3 · La hoja trae su propio aviso (`.cfg-toast`).**
  - Ni «Copiado» ni el «Pronto» de Idioma y Eliminar usan el toast del lobby.
  - **El motivo:** el aviso de las pantallas de `.sal` vive dentro de `.sal-cuerpo`, que es un contexto de apilamiento en z 1, y no hay `z-index` que lo saque de debajo del velo (z 6).
  - Por eso la regla de `cfg1a.css` §8 (toast del lobby a z 8) **no se copió**: con el aviso de la hoja, el toast del lobby ya no se dispara con la hoja abierta y sería código muerto.
  - El aviso de la hoja usa el mismo dibujo, en z 8.
- **D-4 · `«Copiado»` repite el texto de `sal.espera.codigo.copiado`.** La ficha pide «sin duplicados» y a la vez ese texto (§4). Quedó como par declarado en `textos.test.js`, como los otros quince de la casa.
- **D-5 · La métrica de desborde de la barra en `lob` (lob.8, lob.9, lob.10).**
  - Con las zonas de 44, `lob` salió rojo en 8 celdas con «la barra desborda 6».
  - Es el `::after` del ⚙, que asoma 6,34 px por la derecha de la barra, dentro del relleno del lienzo; el lobby y la página seguían en 0.
  - `LOB_BARRA` apaga las zonas mientras lee `scrollWidth`: mide lo visible como siempre, y las zonas las mide `cfg`.
  - Es un cambio de instrumento, no de puerta. Lo dejo dicho por si el rector prefiere otra forma.

**Lo que se vio y no se tocó** (regla 6 de la ficha):
- **O-1 · El stub de PvP en el apaisado bajo.** Su `.sal` usa `grid-template-rows: auto auto auto` (`salas.css:1270`) y el contenido es corto, así que la fila de la barra se estira y el ⚙ baja. La hoja, anclada al relleno, lo pisa 28,89 px en 915×412. En la Sala de espera, donde el contenido llena, no pasa. Es del stub y se va con MES-PvP. Arreglarlo es tocar PvP, y la ficha lo excluye.
- **O-2 · Cerrar sesión no reinicia la pantalla.** Desde Retar, Salas, la Sala de espera o PvP se sale a la Portada como desde el lobby, pero `App` no cambia `screen`: al volver a entrar se aterriza donde se salió. Desde la Sala de espera, la mesa queda «esperando» hasta el barrido del servidor (MES-PvP). No se tocó `App`, porque el mismo `cerrarSesion` lo usa la mesa (⋮ → Cuenta).
- **O-3 · El clic de Sonido**, comprobado en el código, no de oído:
  - **Al apagar:** el clic arranca y `Howler.mute(true)` lo corta en el render siguiente, así que puede oírse un chasquido muy corto o nada.
  - **Al encender:** no suena, porque `play` se pidió cuando aún estaba apagado.
  - La ficha esperaba «antes al apagar, después al encender». Lo segundo no ocurre; que ocurra pide tocar `SoundContext`.
- **O-4 · `SoundContext.jsx:32` escribe `'on'` al montar** si no había nada. Anotado, como pide la ficha.
- **O-5 · La 4,6 ch delata cinco o más dígitos** (§2.2).

**Decisiones del rector:** D-1…D-5 aceptadas; O-1 → MES-PvP; O-2 → 1c (`setScreen('lobby')` al cerrar sesión); O-3 → VIS-1; O-5 se queda (decisión de Victor: la caja de 4,6 ch); el 532,14 era una discrepancia interna del informe de la lámina (su `medidas.json` dice 526,03).

---

## 5. `git status`

```
 M docs/AJILEI_Invariantes_v1.0.md
 M package-lock.json
 M package.json
 M scripts/arnes/nucleo.mjs
 M scripts/diagDSK.mjs
 M scripts/testClavesAlmacen.test.js
 M src/components/BalanceDisplay.jsx
 M src/components/BarraSuperior.jsx
 M src/components/IconosLobby.jsx
 M src/components/PantallaChips.jsx
 M src/config/textos.es.js
 M src/config/textos.test.js
 M src/main.jsx
 M src/screens/IntersticialSumaMente.jsx
 M src/screens/Lobby.jsx
 M src/screens/PartidaPvP.jsx
 M src/screens/Rankings.jsx
 M src/screens/SalaEspera.jsx
 M src/screens/SalaOpciones.jsx
 M src/styles/lobby.css
 M src/styles/menuMovil.css
 M vite.config.js
?? docs/AJILEI_Configuracion_v1.0.md
?? docs/reportes/AJILEI_CFG-1_Fase0_Informe_v1.0.md
?? docs/reportes/AJILEI_CFG-1_Fase1aL_Informe_v1.0.md
?? docs/reportes/AJILEI_CFG-1_Fase1a_Informe_v1.0.md
?? docs/reportes/AJILEI_MOT-1_Fase0_Informe_v1.0.md
?? docs/reportes/AJILEI_MOT-1_Fase1-0_Sonda_Informe_v1.0.md
?? laminas/cfg1a/
?? laminas/mon1/_entorno.txt
?? laminas/mon1/lamina.html
?? laminas/mon1/tiempos.json
?? scripts/cfg/
?? src/components/HojaConfiguracion.jsx
?? src/config/soporte.js
?? src/config/version.js
?? src/lib/copiarTexto.js
?? src/lib/saldoOculto.js
?? src/lib/saldoOculto.test.js
?? src/styles/hojaConfiguracion.css
?? src/styles/tactilLobby.css
```

Se esperaban:
- los informes de la Fase 0 y de la 1a-L de CFG-1, este informe y el normativo;
- `laminas/cfg1a/` y lo de MOT-1;
- los archivos nuevos de `src/` y `scripts/cfg/`.

---

## 6. Pruebas de Victor

**Conformes (2026-10-29): parte A en la PC con el bypass y parte B por túnel con el S25, al 100 %. Victor cerró los procesos del 4191, 5173 y 5174 a mano.**

Lo que el arnés no puede ver:
- el clic de Sonido (O-3);
- el cliente de correo de verdad;
- el portapapeles de Android;
- la vuelta a pantalla completa después del `mailto:`;
- el tacto de los bordes de las zonas.

## 7. Guion de pruebas

**A · PC con el bypass** (`npm run dev` → `http://localhost:5173/`)

| Paso | Qué debe ver |
|---|---|
| ⚙ → «Sonido» | La pastilla pasa de «Sí» a «No» y los clics del lobby callan. Entrar a una mesa → ⋮ → el icono de sonido atenuado. Encender desde el ⋮ y volver: la hoja dice «Sí» |
| ⚙ → «Acerca de» | Primera línea «AJILEI 0.9.0 · xxxxxxx», con los 7 caracteres del commit de su copia (`local` solo si no hay git) |
| ⚙ → «Enviar sugerencia» | Se despliega: la dirección, «Escribir correo» (abre el cliente de correo si la PC tiene uno; si no, nada: la dirección a la vista es la red) y «Copiar correo» → toast «Copiado» por encima de la hoja → pegar en el bloc de notas: `soporte@ajilei.io` |
| Ojito | Tocarlo: la cifra se vuelve «••••» sin que nada se mueva. Recargar: sigue tapada. Ir a Rankings: la píldora muestra la cifra. Volver: tapada. Jugar una mano y volver al lobby: la píldora cuenta tapada (los puntos no se mueven) |
| ⚙ en Retar, Salas, Armar mesa y Rankings | Abre la misma hoja, pegada al ⚙, también con F12 en 1366×768 |
| F12 360×640 | La hoja con «Acerca de» abierto entra sin desplazarse |
| F12 915×412 | La hoja se desplaza entera, cabecera incluida |

**B · Túnel con el S25** (`npm run build` → `npx vite preview --host` → `cloudflared`)

| Paso | Qué debe ver |
|---|---|
| Zonas | Tocar los bordes del ⚙, del «+», de la casa y de la flecha (un dedo «algo fuera» del dibujo): responden |
| «Escribir correo» | Abre Gmail con el asunto y el cuerpo rellenos; la app vuelve en pantalla completa al regresar |
| «Copiar correo» | Toast «Copiado»; pegar en WhatsApp: la dirección |
| Ojito | Como en la PC; además, cobrar el video de 500 HC con el ojito cerrado: los puntos no se mueven |
| Hoja | Vertical: todo entra. Acostado: la hoja se desplaza entera. Sobre Rankings (vino): se lee bien |
| Sala de espera | El ⚙ abre la hoja por encima del cuerpo de la sala; cerrarla deja la sala como estaba |

Claude Code **para en STOP-A2** y espera las pruebas y el visto bueno. Después viene la ficha de commits, que llevará además los informes de la Fase 0 y de la 1a-L.
