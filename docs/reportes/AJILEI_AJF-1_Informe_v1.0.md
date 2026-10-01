# AJILEI · AJF-1 · Ajustes finales, tanda 1 · Informe v1.0

**Fecha:** 2026-10-01
**Ficha:** `AJILEI_AJF-1_v1.0.md`
**Punto de partida:** `main` en `2b9a6df` (DIS-1e), árbol limpio salvo los seis residuos conocidos, que no se han tocado.
**Instrumento:** Edge 154.0.4258.37 · playwright-core del repo · `vite preview` 4173 tras `npm run build`.
**Estado:** STOP final de §6. Sin `git add` y sin commits.

| Tarea | Veredicto | Escribe código |
|---|---|---|
| A · limpieza post-DIS-1 | `mesapc`/`mesav` **retirados**: cero consumidores y ninguna puerta los lee. `baraja.svg`: **ya no está rastreado** (VEC-1a, `cdc996a`), así que no hay nada que hacer | Sí (retiros) |
| B · congelado frente a las IAS | **HECHO** | No |
| C · «Jugar contra jugador» | **Difería en todo** → igualado con la misma clase. **Ajustado después** (§H) a la variante «A + icono» de la lámina AJF-1, con los rótulos en plural | Sí |
| D · entrada Corta de PvP | Constancia, sin editar. La Corta **no existe en el código**: vive solo en el normativo | No |

---

## §A · Limpieza post-DIS-1

### A1 · Inventario (`git grep -n -i -E "mesapc|mesav"`, repo entero)

Archivos rastreados con el nombre: `src/assets/portada/mesapc.webp` (31 050 B), `src/assets/portada/mesav.webp` (35 280 B), `maestras/portada/mesapc.png`, `maestras/portada/mesav.png`, `PUE_mesapc_demo.png`, `PUE_mesav_demo.jpg`.

El objetivo de la tanda son **los dos WebP**. Las dos maestras PNG y los dos `PUE_*_demo` salen en el grep por el nombre, pero son otros archivos y tienen consumidores propios (abajo).

**Caja 1 · Generador**
- `scripts/gen-portada-assets.mjs:9-10` (cabecera que lista las maestras), `:41` («las tres capturas»), `:100-116`: **los dos trabajos que producían los WebP** (`mesav` → `src/assets/portada/mesav.webp`, ancho 340, techo 80 KiB; `mesapc` → `…/mesapc.webp`, ancho 820, techo 120 KiB).
- `scripts/cap/capMesa.mjs:65,67` y `scripts/diagPUE.mjs:1416` (modo `cap`): producen las **maestras PNG**, no los WebP. Quedan intactos.

**Caja 2 · Consumidor en producción: VACÍA**
- `git grep` sobre `src/`, `index.html` y `public/`: 0 apariciones. `Portada.jsx:11-20` importa las cinco copas y `dis_laptop`/`dis_telefono`, y nada más de `assets/portada/`.
- No hay `import.meta.glob` que los recoja: el único es `CardImage.jsx:11`, sobre `assets/cards/webp/`.
- Prueba del bundle: `npm run build` antes del retiro **no emitía ninguno de los dos**, y `grep -rl -i "mesapc|mesav" dist/` devolvía 0 archivos. Ya estaban fuera de producción desde DIS-1b.

**Caja 3 · Arnés: ninguna puerta los lee**
- `scripts/diagPUE.mjs:1104-1108`: solo es un comentario. La expresión de `1.8a` (`:1108`) ya lista `dis_laptop|dis_telefono` y no los nombres viejos.
- `scripts/diagPUE.mjs` modo `cap` y `scripts/cap/capMesa.mjs`: leen y escriben las maestras PNG. `cap.ogRecorte` deriva con un trabajo `og-image` escrito en línea (`diagPUE.mjs:1473`), y el cuerpo de canvas lo extrae `capMesa.mjs:300-307` por dos marcas (`const salida = await pagina.evaluate(` y `}, { uri: comoDataURI(rutaOrigen)`). El retiro no toca ninguna de las dos.
- `scripts/dis1/gen_dispositivos.py:52-54,337,347-348,706,712,762,787` y `maestras/dis1/{laptop,telefono}.json:13`, `maestras/dis1/LEEME.md:19`: leen las **maestras PNG** para hornear los renders. Por eso las PNG **se quedan**.
- `maestras/portada/cap.json:15,65`: traza de las maestras PNG (no es una puerta).

**Caja 4 · Documentación (no se toca)**
- `PUE_lamina_v1.7.html:10,72,96,928,932,1143`: lámina histórica que usa los `PUE_*_demo` de la raíz.
- `docs/`: 18 archivos (auditoría PUE, Sistema de Diseño v1.2 y los informes de CAP-1, DIS-1, IDX-1, LOB-1, PUE y REV-1).

### A2 · Condición de retiro: se cumple
La caja 2 está vacía y la caja 3 no tiene ninguna puerta que lea los WebP. No hay STOP-1.

### A3 · Retiro
- **Generador**, `scripts/gen-portada-assets.mjs`: se quitan solo los dos objetos de `TRABAJOS`. El resto del generador queda idéntico: copas por IDX-1, `og-image`, cuerpo de canvas y sus dos marcas. La cabecera se actualiza en tres sitios: una nota AJF-1 en `:12-16` (por qué ya no salen, y por qué las maestras PNG siguen versionadas), «los ocho» → «los seis» en `:21` y `:48`, y `:46` («la captura que queda»). El mensaje final cambia «los ocho» por «los seis» (`:325`).
- **Comprobación del generador recortado:** `node scripts/gen-portada-assets.mjs` completo da `TOTAL :: 6 derivados · 171345 B · TECHOS :: los seis DENTRO`, y `git status` sobre `src/assets/portada` y `public` solo enseña los dos `D`. Las cinco copas y `og-image-v2.jpg` se reescriben **idénticas al byte**.
- `git rm src/assets/portada/mesapc.webp src/assets/portada/mesav.webp`: OneDrive no bloqueó el borrado. Después se sacó del área de preparación para cumplir el «sin `git add`» de §6, así que el borrado queda en el árbol como ` D`.
- **Arnés:** no hubo que retirar ninguna lectura.
- Repo: −66 330 B. Bundle: ±0, porque ya no viajaban.

### A4 · `baraja.svg` (VEC-1)
`git ls-files | grep -i "baraja.svg"` no devuelve nada, y no está en disco. Lo retiró **VEC-1a, `cdc996a`** (2026-09-04), junto con `baraja2.svg`. `git grep "baraja.svg"` solo encuentra documentación: `AJILEI_CAR1_Cierre_Commits_v1.0.md:62` y `AJILEI_CAR1_Fase1_v1.0.md:107`, que todavía lo ponen «en cola de retiro», y además `AJILEI_Diseno_Landscape_v1.0.md:140`, `AJILEI_Sistema_Diseno_v1.2.md:224` y los informes. Es una cola que ya está cerrada (§G-4).

### A5 · `scripts/dis1/__pycache__/`
No se ha tocado.

---

## §B · Congelado frente a las IAS (solo lectura)

### B1 · Localización
- Definición: `src/hooks/useCongelado.js`, con el núcleo `creaCongelador` en `:48-113`, `enganchaVisibilidad` en `:128-140` y el hook en `:147-170`. Prueba: `src/hooks/useCongelado.test.js`.
- **Un único consumidor:** `src/components/GameTable.jsx`, con el import en `:40` y la llamada en `:398` (`const { congelado, congeladoRef, diferir } = useCongelado()`). Lo usan siete guardas: `:770`, `:962`, `:1021`, `:1050`, `:1234`, `:1637` y `:2368`.
- Historia: FRZ-1a `4ab057a`, FRZ-1b `2a77c87` y GT-HIG `e75adf1` (handle de cancelación para los siete relojes).

### B2 · Punto por punto

**(i) Qué escucha.** Escucha `visibilitychange` (`useCongelado.js:133`) y `pagehide` en `window` (`:134`, que cuenta como ocultarse porque iOS puede mandarlo sin `visibilitychange`, `:124-125`). **No escucha `blur`**. Tampoco escucha `pageshow`, a propósito (`:125-127`): la vuelta la da `visibilitychange`, y si WebKit restaura desde bfcache decide la lectura de `document.hidden` al enganchar (`:132` y estado inicial en `:148`). Una mesa que se monta con la pestaña ya oculta nace congelada.

**(ii) Al ocultarse.**
- **Audio:** `Howler.volume(0)` guardando el volumen previo (`:61-62`). No usa `Howler.mute()`, que es la preferencia persistida del jugador, ni `ctx.suspend()` (`:31-37`). Hay una guarda de reentrada para el doble `pagehide` + `visibilitychange` (`:59`).
- **Reloj de turno del humano:** `GameTable.jsx:769-787`. `if (congelado) return` en `:770`, y `congelado` está en las dependencias (`:787`). Al ocultarse, el cleanup `clearTimeout` (`:786`) mata el tic pendiente. Con eso tampoco pueden saltar los avisos de ≤5 s ni el auto-pasar de 0.
- **Cadena de decisiones de la IA, con el ritmo por `peso`:** `GameTable.jsx:961-996`. Tiene `if (congelado) return` en `:962`, y el `setTimeout(…, ritmoDe(decision.peso))` de `:981-993` tiene cleanup `clearTimeout` (`:994`). `congelado` está en las dependencias (`:996`). Al ocultarse, la jugada programada se cancela.
- **Pasos de un solo salto, que van al slot:** salto del retirado (`:1021`), descarte de los rivales con el humano retirado (`:1050`), arranque del reparto (`commitNewHand`, `:1636-1637`) y «Siguiente mano» (`:2366-2368`).
- **Plazo de la recarga:** `:1234`, también por dependencia (`:1247`).

**(iii) Al volver.** El orden es siempre audio, estado, slot (`useCongelado.js:77-85`).
- **No salta turno:** `timeLeft` no se toca al congelar (`GameTable.jsx:764-767`), así que el reloj reprograma desde el mismo segundo.
- **La IA no juega doble ni con datos viejos:** se reprograma entera y relee `gameRef.current`. Si la mesa se movió, la decisión caduca (`:983-986`, `if (prev.activePlayerIndex !== seat || prev.phase !== phase) return`).
- **No abre mano nueva a oscuras:** el disparo del reparto y la «Siguiente mano» se difieren enteros (`:1636-1637`, `:2364-2368`).
- **No cobra el ante dos veces:** el ante se cobra una sola vez en `commitNewHand` (`setGame(next)`, `:1632`), antes del barajado. Lo que se difiere es solo `setIsShuffling(false)`. El slot es único y se vacía **antes** de invocarse (`useCongelado.js:82-84`), así que una continuación no puede correr dos veces.

**(iv) Dónde se monta.** `GameTable` es la mesa contra las IAS (`App.jsx:487`, pantalla `table`). El hook vive en el componente padre de las dos vías de render, así que las cubre por construcción (`GameTable.jsx:390-393`):
- **Mesas de 5/4/3:** `OpponentPanel` (`:1828`).
- **Mesa de 2, en vertical y en escritorio:** `.ai-zone` (`:1726`, rama `:2114-2121`).
- **Matiz:** en **teléfono apaisado** (`isLandscapeTable`, apaisado con alto ≤ 600) la mesa de 2 **no** usa `.ai-zone` sino `.opp-panel` dentro de `.table-mid` (`:2123-2130`). Está cubierta igual, por la misma razón.

### B3 · Pruebas del hook
`npx vitest run src/hooks/useCongelado.test.js`: **10/10**.

### B4 · Veredicto: **HECHO**
Hay dos matices de diseño. Ninguno es una falta.
1. **Lo que ya está en vuelo termina a oscuras, a propósito** (`useCongelado.js:16-22`): el reparto (por `rAF` + `transitionend`, que se clava solo), la línea de tiempo del descarte, la ceremonia de eliminación y el `setTimeout` de 1 125 ms del descarte con el humano retirado, si ya estaba programado (`GameTable.jsx:1051`, sin `congelado` en las dependencias). Esas secuencias llevan a la fase siguiente con el volumen a 0. Lo que no ocurre es el **paso siguiente**: la IA no decide y el reloj del humano no corre. La red de 6 s de la revelación (`:1205`) también corre a oscuras, pero solo marca `red`, y la cuenta de la recarga sigue guardada.
2. **iOS:** `pagehide` está escuchado y el iPhone sigue en vigilancia desde FRZ-1. La prueba física la hace Victor en el S25: bloquear el teléfono a mitad de una mano y volver.

---

## §C · El botón «Jugar contra jugador»

### C1 · Los dos CTA (antes, `HEAD` = `2b9a6df`)

`src/screens/Lobby.jsx:213-231`:
```jsx
<button
  type="button"
  className="lob-cta-ia"
  data-accion="jugar-ia"
  onClick={jugarIA}
>
  {t('lob.cta.ia')}
</button>
…
<SoundButton className="lob-cta-pvp" data-accion="jugar-pvp" onClick={() => onJugarPvP?.()}>
  <span>{t('lob.cta.pvp')}</span>
</SoundButton>
```

`src/styles/lobby.css`:
- `:97-98`: `--lob-cta-h: max(44px, calc(var(--u) * 11))`, `--lob-cta-w: min(100%, calc(var(--u) * 64))`. En `:798` (`max-height: 660px`) pasa a `max(44px, calc(var(--u) * 10))`.
- `:368-392` `.lobby .lob-cta-ia`: alto `--lob-cta-h`, ancho `--lob-cta-w`, `border: 0`, radio `--lob-cta-h / 2`, degradado `--gold-hover → --gold-brand → --gold-brand-deep`, `color: var(--text-dark)`, `font: inherit; font-weight: 600; font-size: 4.4u`, sombra, `:active`, `:focus-visible`. `:780` quita la transición con movimiento reducido.
- `:452-482` (§5, «El acceso que todavía no existe») `.lobby .lob-cta-pvp`: `inline-flex`, `background: none; border: 0`, `color: var(--text-secondary)`, `font-size: 3.5u`, `padding: u 2u`, radio 999px, con sus descendientes `.lob-ico` y `.lob-pastilla`.

### C2 · Diagnóstico medido (antes)

Medido con una sonda ad hoc en `vite preview` 4173, con la sesión simulada de CAP-1 (`contextoCap`). Ningún arnés cubre el lobby en 4173: `diagDSK lob` y `diagSAL` corren contra el servidor de desarrollo con bypass. La sonda nunca estuvo en el repo. Red fuera de origen: 0. Errores de consola: 0. `⟦`: 0.

| Vista | CTA | Elemento | Caja (w×h) | top | Fuente / peso | Color | Fondo | Borde · radio | Padding |
|---|---|---|---|---|---|---|---|---|---|
| 1920×1080 | IAS | `button.lob-cta-ia` | 384×66 | 658,45 | 26,4 px / 600 | `rgb(26,26,14)` | degradado oro | 0 · 33 px | 1 px 6 px |
| 1920×1080 | jugadores | `button.lob-cta-pvp` > `span` | **222,83×38,09** | 743,64 | **21 px / 500** | **`rgba(245,237,216,.72)`** | **ninguno** | 0 · 999 px | 6 px 12 px |
| 390×844@3 | IAS | `button.lob-cta-ia` | 249,59×44 | 492,05 | 17,16 px / 600 | `rgb(26,26,14)` | degradado oro | 0 · 22 px | 1 px 6 px |
| 390×844@3 | jugadores | `button.lob-cta-pvp` > `span` | **144,84×30,98** | 548,52 | **13,65 px / 500** | **`rgba(245,237,216,.72)`** | **ninguno** | 0 · 999 px | 3,9 px 7,8 px |
| 360×640@3 | IAS | `button.lob-cta-ia` | 230,39×44 | 339,92 | 15,84 px / 600 | `rgb(26,26,14)` | degradado oro | 0 · 22 px | 1 px 6 px |
| 360×640@3 | jugadores | `button.lob-cta-pvp` > `span` | **133,67×30,39** | 391,11 | **12,6 px / 500** | **`rgba(245,237,216,.72)`** | **ninguno** | 0 · 999 px | 3,6 px 7,2 px |

Familia tipográfica igual en los dos (`system-ui, "Segoe UI", Roboto, …`).

Respuestas:
- **¿Es un `<button>`?** Sí, pero es un `SoundButton` (`components/SoundButton.jsx:11`, que pinta un `<button>`), no el mismo componente que el de las IAS (un `<button>` pelado, `Lobby.jsx:136-144`, porque su voz es el golpe de mesa).
- **¿Comparten clase, alto, ancho, fuente, peso, fondo y borde?** Solo comparten la familia y el `border: 0`. Distinta clase, alto (−43 % en escritorio y −30 % en teléfono), ancho (58 % del de las IAS), fuente (80 %), peso (500 frente a 600), color (crema translúcido frente a tinta oscura) y fondo (ninguno frente a oro).
- **¿Hay rótulo secundario?** El «Próximamente» y el candado se retiraron en SAL-B1 (`Lobby.jsx:222-228`). Lo que lo hace leerse como una frase es el traje: texto crema sin fondo y más pequeño, el de un enlace. La sección CSS todavía se titula «El acceso que todavía no existe».
- **¿Llega al mínimo táctil de 44 px?** **No: 30,98 px en 390×844 y 30,39 px en 360×640.**

### C3 · Cambio

> **Superado por §H.** Esto describe el primer paso de la tanda (las dos píldoras doradas con la misma clase). El estado final es el de §H: «A + icono», con clase propia para el botón de jugadores.

- `src/screens/Lobby.jsx:233`: `className="lob-cta-pvp"` → `className="lob-cta-ia"`, y se añade `type="button"`, como el de las IAS. **Sigue siendo `SoundButton`** porque no abre la mesa, sino `SalaOpciones`: su voz es el clic, no el golpe de mesa. Texto por `t('lob.cta.pvp')`, con la clave sin cambiar. `data-accion="jugar-pvp"` sin cambiar. El comentario se amplía en `:229-232`.
- `src/styles/lobby.css:453-456`: **solo un comentario**. Ninguna regla cambia. Declara que `.lob-cta-pvp` y sus dos descendientes se quedaron sin consumidor y que `.lob-pastilla` sigue viva. Las reglas muertas se dejan por la regla de CSS aditivo (§G-2).
- Arnés: ningún selector depende de las clases. `diagDSK` mide el CTA por `[data-accion="jugar-ia"]` (`:947`) y la columna por `.lob-accion` (`:948`).

### C3 · Medidas después (misma sonda, mismo build tras `npm run build`)

| Vista | CTA | Elemento | Caja (w×h) | top | Fuente / peso | Color | Fondo | Borde · radio | Padding |
|---|---|---|---|---|---|---|---|---|---|
| 1920×1080 | IAS | `button.lob-cta-ia` | 384×66 | 644,50 | 26,4 px / 600 | `rgb(26,26,14)` | degradado oro | 0 · 33 px | 1 px 6 px |
| 1920×1080 | jugadores | `button.lob-cta-ia` > `span` | **384×66** | 729,69 | **26,4 px / 600** | **`rgb(26,26,14)`** | **degradado oro** | 0 · 33 px | 1 px 6 px |
| 390×844@3 | IAS | `button.lob-cta-ia` | 249,59×44 | 485,53 | 17,16 px / 600 | `rgb(26,26,14)` | degradado oro | 0 · 22 px | 1 px 6 px |
| 390×844@3 | jugadores | `button.lob-cta-ia` > `span` | **249,59×44** | 542,00 | **17,16 px / 600** | **`rgb(26,26,14)`** | **degradado oro** | 0 · 22 px | 1 px 6 px |
| 360×640@3 | IAS | `button.lob-cta-ia` | 230,39×44 | 333,11 | 15,84 px / 600 | `rgb(26,26,14)` | degradado oro | 0 · 22 px | 1 px 6 px |
| 360×640@3 | jugadores | `button.lob-cta-ia` > `span` | **230,39×44** | 384,30 | **15,84 px / 600** | **`rgb(26,26,14)`** | **degradado oro** | 0 · 22 px | 1 px 6 px |

Idénticos en todo menos en `top`. El de las IAS sube 13,95 px en escritorio, 6,52 en 390×844 y 6,81 en 360×640, porque la columna centrada ahora lleva dos píldoras.

**Comprobación de desborde, añadida porque el segundo botón crece entre 13 y 28 px.** Se miró en los seis viewports de `gate` más el S25 (412×915). En los nueve, `scrollHeight` = `innerHeight` y `scrollWidth` = `clientWidth`, y el botón de jugadores acaba por encima de `.lob-nav`:

| Vista | fondo de «jugadores» | top de `.lob-nav` | holgura |
|---|---|---|---|
| 1920×1080 | 795,69 | 967,73 | 172,0 |
| 1920×937 | 724,19 | 824,73 | 100,5 |
| 1366×768 | 641,14 | 658,63 | **17,5** |
| 1024×768 | 641,14 | 658,63 | **17,5** |
| 844×390 | 230,80 | 310,47 | 79,7 |
| 640×360 | 215,50 | 284,72 | 69,2 |
| 412×915 (S25) | 630,26 | 832,33 | 202,1 |
| 390×844 | 586,00 | 764,47 | 178,5 |
| 360×640 | 428,30 | 564,72 | 136,4 |

En los nueve los dos botones salen a la par: en 412×915 miden 263,67×45,31 los dos.

---

## §D · Entrada Corta de PvP

### D1 · Constantes
- **Medio de vs IA:** `src/config/ajileiConfig.js:34`, `entrada: { piso: 10, medio: 20, techo: 50 }`, en múltiplos de la apuesta de mesa. El Medio es **20×** (1f-A4, antes 15×; motivo en `:26-33`).
- **Entradas PvP (Corta/Llena):** **no están en el código.** `src/config/salas.js` solo tiene `APUESTAS_PVP` (`:40`), `BONO_BIENVENIDA = 1200` (`:44`), la regla de asiento `REGLA_ASIENTO = 5` (`:51`, saldo mínimo = 5 × apuesta, que es la regla para sentarse y no una entrada) y `LLENA_SEG = 10` (`:142`, los segundos de la mesa llena). Tampoco aparecen en `src/` ni en `supabase/migrations/`. `src/engine/entrada.js:12` lo dice: «en PvP la entrada la fija SQL», y esa SQL llegará con MES-PvP. La cifra existe **solo en el normativo:** `docs/AJILEI_APU-1_Reglas_v1.3.md:317`, «Entrada por jugador fija, dos opciones: **Corta 15×** · **Llena 50×**, en HC», con la nota del rector de que la Corta sigue sellada en 15× aunque el Medio de vs IA pasara a 20×.

### D2 · Decisión
«Decisión de Victor (2026-10-01): la entrada Corta de PvP se queda en 15× hasta las pruebas con testers; se retoma solo si de esas pruebas surge un cambio».

No se ha editado nada.

---

## §E · Varas al cierre

Todas sobre el árbol final, tras `npm run build`.

| Vara | Antes | Después | Veredicto |
|---|---|---|---|
| `npm run build` | limpio | limpio. Solo el aviso de siempre de chunk > 500 kB. Ni antes ni después emite `mesa{v,pc}` | ✔ |
| `npx vitest run` | 1056/1056 | **1056/1056** (37 archivos). No hay pruebas nuevas | ✔ |
| `npx eslint .` | 21 problemas | **21** (20 errores y 1 aviso). Los dos archivos de código tocados no aportan ninguno: `eslint src/screens/Lobby.jsx scripts/gen-portada-assets.mjs` sale con código 0 | ✔ |
| `diagPUE` completo (4173) | 182 verdes + `1.8b` | **182 verdes + `1.8b`** | ✔ |
| · `1.8b` | 219,4 KiB (FCP 128 ms, 7 recursos) | **219,4 KiB** (FCP 124 ms, 7 recursos) | sin cambio. Los WebP retirados ya no estaban en el camino crítico ni en el bundle |
| · puertas `dis` (dentro de `todo`) | 68/68 | **68/68** | ✔ |
| `diagSAL sal` | — | **102/102** | ✔ |
| `diagDSK lob` | — | **6/6** celdas (los 6 viewports de `gate`, `lob.1`–`lob.7`) | ✔ |

**Desviación declarada:** `diagSAL` y `diagDSK lob` corren contra el servidor de desarrollo con bypass (`AJILEI_BASE=http://localhost:5174`, levantado para la tanda), no contra 4173. No pueden hacerlo de otra forma (`diagSAL.mjs:10-23`): sin bypass no llegan al lobby y los fixtures de `?sal=` no existen en `dist/`. Las medidas de C2/C3 sí se tomaron en 4173.

`diagDSK` avisa de que las líneas base se tomaron con Edge 151.0.4129.93 y el vivo es 154.0.4258.37. Es la deriva ya conocida y no afecta a `lob`.

**Sondas:** la de C2/C3 (`_sondaCta.mjs` y sus capturas) vivió en el scratchpad de la sesión, fuera del repo, y nunca entró en él. El intento de borrarla al cierre fue denegado y sigue allí, fuera del árbol. En el repo no queda ningún `_*.mjs` nuevo: el único es el residuo conocido `scripts/_cel1bFila.mjs`, que no se ha tocado.

---

## §F · Mapa archivo → commit propuesto

| Commit | Rutas (explícitas) |
|---|---|
Mapa actualizado tras §H, según la instrucción de Victor.

| Commit | Rutas (explícitas) |
|---|---|
| **(a)** `AJF-1a: limpieza post-DIS-1 (mesapc/mesav fuera del generador)` | `scripts/gen-portada-assets.mjs` · `git rm src/assets/portada/mesapc.webp` · `git rm src/assets/portada/mesav.webp` |
| **(b)** `AJF-1b: lobby, los dos accesos en «A + icono» y rótulos en plural` | `src/screens/Lobby.jsx` · `src/styles/lobby.css` · `src/config/textos.es.js` · `src/components/IconosLobby.jsx` · `scripts/diagSAL.mjs` |
| **(c)** `AJF-1c: informe de AJF-1 y lámina` | `docs/reportes/AJILEI_AJF-1_Informe_v1.0.md` · `laminas/ajf1/lamina.html` · `laminas/ajf1/capturar.mjs` · `laminas/ajf1/capturas/hoja.png` · `laminas/ajf1/capturas/medidas.json` |

**Decisiones de Victor sobre este mapa (2026-10-01):**
- Mapa aprobado.
- En **(c)** entran solo los cuatro archivos de la lámina, por ruta explícita. Las 15 capturas PNG no se añaden: Victor las saca del repo.
- El título de `SalaOpciones` en plural, y `diagSAL.mjs` en **(b)**: aceptados.
- `1.8b` a 219,6 KiB: aceptado. Sube por el ajuste pedido, no por la limpieza, y queda para la tanda de higiene del arnés.

Notas:
- **(a)** no lleva ningún archivo del arnés, porque no hubo lectura que retirar. `baraja.svg` ya no sale en el título: lo retiró `cdc996a`.
- **(b)** El icono de dos personas no es archivo nuevo: es `IconoPersonas`, añadido al archivo de iconos que ya existía (`IconosLobby.jsx`). `scripts/diagSAL.mjs` va en este mismo commit porque su línea 600 compara el título de `SalaOpciones` con un texto literal. Si fuera en otro commit, `diagSAL` saldría rojo entre los dos.
- **(c)** `laminas/ajf1/` pesaba unos **16 MB**: `lamina.html` y `capturar.mjs` ocupan ~17 KB; las 15 capturas, 12,5 MB; `hoja.png`, 3,2 MB, y `medidas.json`, 16 KB. Por eso solo entran cuatro archivos (decisión de arriba). Los 15 PNG se regeneran con `capturar.mjs`.

---

## §G · Hallazgos fuera de alcance (solo se anotan)

1. **Los rótulos no eran los de la ficha.** En pantalla salían «Jugar contra la IA» y «Jugar contra jugador» (`src/config/textos.es.js:28-29`). **Resuelto en §H:** los dos rótulos y el título de `SalaOpciones` pasan a plural.
2. **CSS muerto:** `.lobby .lob-cta-pvp`, `.lob-cta-pvp .lob-ico` y `.lob-cta-pvp .lob-pastilla` (`lobby.css:502-535`, tras §H). Retirarlos queda para una tanda de limpieza. `.lob-pastilla` hay que conservarla.
3. **Padding de fábrica:** los dos CTA conservan el `padding: 1px 6px` del `<button>`. Su caja la fijan `height`/`width`, así que hoy no se nota. Pasaría a notarse si el texto llegara a envolver.
4. **Cola documental vencida:** `AJILEI_CAR1_Cierre_Commits_v1.0.md:62` y `AJILEI_CAR1_Fase1_v1.0.md:107` todavía ponen `baraja.svg`/`baraja2.svg` «en cola de retiro», y `AJILEI_Sistema_Diseno_v1.2.md:224` los lista en una tabla. Los retiró VEC-1a (`cdc996a`).
5. **`PUE_mesapc_demo.png` / `PUE_mesav_demo.jpg`** (raíz, rastreados): alimentan la lámina histórica `PUE_lamina_v1.7.html`, y la cabecera del generador dice que se quedan (`:17-20`). No se tocan.
6. **El arnés del lobby no corre en 4173.** `diagDSK lob` y `diagSAL` solo corren en el servidor de desarrollo con bypass (`diagSAL.mjs:10-23`), y eso choca con la regla «el arnés contra `vite preview`» de §0. La sonda de C2 demuestra que la sesión simulada de CAP-1 llega al lobby en 4173 sin red. Puede ser la base de un modo `lob` en preview.
7. **La ficha da por supuesto que la entrada PvP vive en `salas.js`.** No vive en el código (§D1). Cuando MES-PvP la escriba en SQL, convendrá un espejo en `config/` con su prueba, como `LLENA_SEG`.
8. **Etiqueta de la mesa de 2:** la ficha dice «mesa 2 por `.ai-zone`», pero en teléfono apaisado la mesa de 2 es `.opp-panel` (§B2-iv). Es la misma corrección de etiqueta que CAR-1 dejó en cola.
9. **La cabecera de la §4 de `lobby.css` dice que la moneda del saldo «es la única moneda del lobby».** Desde §H hay una segunda, en la píldora de las IAS. La §3.1 lo declara, pero el texto de la §4 no se ha tocado (CSS aditivo).
10. **El comentario de `Lobby.jsx:210-213`** («la moneda del producto pasa a ser una sola») ha quedado igual de viejo por la misma razón. El de AJF-1, justo debajo (`:214-216`), lo corrige.
11. **`src/App.jsx:231`** todavía cita «Jugar contra jugador» en un comentario histórico. No se toca.

---

## §H · Ajuste antes de los commits: «A + icono» y rótulos en plural

Victor pidió el ajuste tras el primer STOP, en dos pasos: primero la lámina, después la variante elegida. Esta sección es el estado final del lobby, y §C3 queda como el paso intermedio.

### H1 · La lámina
- **`laminas/ajf1/lamina.html`**. Se abre con el servidor de desarrollo encendido (`npx vite --port 5174` → `http://localhost:5174/laminas/ajf1/lamina.html`). Por `file://` no funciona.
  - Carga el **lobby real** (`/`, con el bypass) en un iframe del mismo origen y le inyecta una hoja con las variantes, colgadas de `html[data-ajf1="…"]`.
  - No toca el árbol de React (los iconos son `::before`) ni usa `!important`.
  - Interruptor de variante (Hoy · A contorno · B vinotinto `#7c1d30` · C iconos · A+icono) y de vista (1920×1080, 390×844, 360×640), con medidas en vivo de los dos CTA.
  - `?solo=1&v=…` deja el lobby a pantalla completa para capturar.
- **`laminas/ajf1/capturar.mjs`** genera `laminas/ajf1/capturas/`: 15 PNG (cuatro variantes más «hoy», en tres vistas, con densidad 1/3/3), `medidas.json` y `hoja.png`, la hoja de contacto.
- **Resultado de la lámina:** en las 15 combinaciones, los dos CTA miden lo mismo que hoy (384×66 · 249,59×44 · 230,39×44), en una sola línea, sin rebose ni desborde.
- **Trampa de medida que salió aquí:** contar líneas con un `Range` sobre el botón entero da **2** cuando el `<span>` del rótulo es elemento flex, porque su caja de bloque y el rectángulo de su texto tienen tops distintos. Hay que contar solo los nodos de texto. La lámina y la sonda ya lo hacen así.
- **Elección de Victor:** **A + icono**.

### H2 · Rótulos
- `src/config/textos.es.js:28` `lob.cta.ia` → «Jugar contra las IAS».
- `:29` `lob.cta.pvp` → «Jugar contra jugadores».
- `:72` `sal.opciones.titulo` → «Jugar contra jugadores». Esto lo decidió Victor después: la regla sellada en `textos.test.js:94-96` dice que la pantalla se llama como el botón que la abre. Al cambiar el botón, el título de `SalaOpciones` lo sigue, y la prueba no se toca.
- `scripts/diagSAL.mjs:600` compara ese título con un texto literal. Se pasa al plural.
- **Las claves y los `data-accion` no cambian.**

### H3 · El cambio
- **`src/screens/Lobby.jsx`**
  - `:214-224`: el de las IAS sigue siendo el `<button>` pelado con `.lob-cta-ia`, y gana a la izquierda `<span className="lob-cta-ico" aria-hidden="true"><ChipToken size="icon" /></span>`. Es la moneda de la casa, y `ChipToken` ya sale `aria-hidden`.
  - `:234-243`: el de jugadores sigue siendo `SoundButton`, con clase **nueva** `lob-cta-jugadores` y `<IconoPersonas className="lob-cta-ico" />` delante del rótulo.
  - `:28-30`: los dos imports.
- **`src/components/IconosLobby.jsx:124-137`**: `IconoPersonas`, con el dibujo de la lámina aprobada y el contrato de la casa (caja 24, `fill="none"`, `currentColor`, trazo 1.75, `aria-hidden` y `focusable="false"` por `COMUN`). No es archivo nuevo.
- **`src/styles/lobby.css` §3.1 (`:394-441`)**, solo aditivo:
  - `.lobby .lob-cta-ia, .lobby .lob-cta-jugadores`: `inline-flex`, centrado, `gap: .45em` y `white-space: nowrap`, para el icono.
  - `.lobby .lob-cta-jugadores`: la **misma caja** que `.lob-cta-ia` (alto `--lob-cta-h`, ancho `--lob-cta-w`, radio `--lob-cta-h / 2`, `font: inherit` a 600 y `4.4u`, `letter-spacing` 0.02em), con `background: transparent`, `color: var(--gold-brand)` y `box-shadow: inset 0 0 0 2px var(--gold-brand)`. **Sin `border`** (E-33).
  - `:active` y `:focus-visible`, iguales que los del de las IAS.
  - `@media (prefers-reduced-motion: reduce) { transition: none }`.
  - `.lobby .lob-cta-ico`: 1,25 em en `em` del rótulo, y la `.chip-token` llenando la ranura.
  
  No se reutiliza `.lob-cta-pvp`: sigue muerta (§G-2), y su comentario se actualiza para nombrar a `.lob-cta-jugadores`.
- **Dos desviaciones mínimas frente a la lámina, declaradas:**
  1. La moneda va por `ChipToken` y no como `background-image`, así que conserva la sombra de `ChipToken.css:5` (`drop-shadow(0 1px 2px …)`), que en la lámina no tenía. Eso mejora su lectura sobre el oro, el punto débil de C.
  2. Los iconos son elementos del DOM y no `::before`. Mismo tamaño (1,25 em) y mismo `gap`.

### H4 · Medidas antes y después (sonda ad hoc en `vite preview` 4173 con la sesión de CAP-1; Edge 154.0.4258.37)

«Antes» es el estado tras C3 con los rótulos en plural: dos píldoras doradas (tabla de C3, y caso «hoy» de la lámina para los rótulos en plural, con las mismas cajas).

| Vista | CTA | Antes: clase · caja · líneas | Después: clase · caja · líneas · rebose | Icono (después) | Traje (después) |
|---|---|---|---|---|---|
| 1920×1080 | IAS | `lob-cta-ia` · 384×66 · 1 | `lob-cta-ia` · **384×66** · 1 · no | 33×33, `aria-hidden` | oro sólido, texto `rgb(26,26,14)` |
| 1920×1080 | jugadores | `lob-cta-ia` · 384×66 · 1 | `lob-cta-jugadores` · **384×66** · 1 · no | 33×33, `aria-hidden` | transparente, anillo `inset 0 0 0 2px rgb(232,184,75)`, texto `rgb(232,184,75)`, `border` 0 |
| 390×844@3 | IAS | `lob-cta-ia` · 249,59×44 · 1 | `lob-cta-ia` · **249,59×44** · 1 · no | 21,44×21,44 | ídem |
| 390×844@3 | jugadores | `lob-cta-ia` · 249,59×44 · 1 | `lob-cta-jugadores` · **249,59×44** · 1 · no | 21,44×21,44 | ídem |
| 360×640@3 | IAS | `lob-cta-ia` · 230,39×44 · 1 | `lob-cta-ia` · **230,39×44** · 1 · no | 19,8×19,8 | ídem |
| 360×640@3 | jugadores | `lob-cta-ia` · 230,39×44 · 1 | `lob-cta-jugadores` · **230,39×44** · 1 · no | 19,8×19,8 | ídem |

Las posiciones (`top`) tampoco cambian: 644,50 / 729,69 en 1920×1080, 485,53 / 542,00 en 390×844 y 333,11 / 384,30 en 360×640, idénticas a las de C3. El icono no mueve la caja. En las tres vistas: red fuera de origen 0, errores de consola 0, `⟦` 0.

### H5 · Holgura en los nueve viewports
**Idéntica, al centésimo, a la tabla de C3:**

| Vista | fondo de «jugadores» | top de `.lob-nav` | holgura |
|---|---|---|---|
| 1920×1080 | 795,69 | 967,73 | 172,0 |
| 1920×937 | 724,19 | 824,73 | 100,5 |
| 1366×768 | 641,14 | 658,63 | 17,5 |
| 1024×768 | 641,14 | 658,63 | 17,5 |
| 844×390 | 230,80 | 310,47 | 79,7 |
| 640×360 | 215,50 | 284,72 | 69,2 |
| 412×915 (S25) | 630,26 | 832,33 | 202,1 |
| 390×844 | 586,00 | 764,47 | 178,5 |
| 360×640 | 428,30 | 564,72 | 136,4 |

En los nueve, `scrollHeight` = `innerHeight` y `scrollWidth` = `clientWidth`. Los dos CTA salen en una línea y sin rebose, con la misma caja (en el S25, 263,67×45,31 los dos).

### H6 · Varas tras el ajuste

Todas sobre el árbol final, tras `npm run build`.

| Vara | Resultado | Veredicto |
|---|---|---|
| `npm run build` | limpio. Solo el aviso de siempre de chunk > 500 kB | ✔ |
| `npx vitest run` | **1056/1056** (37 archivos). `textos.test.js` vuelve a verde **sin tocarse**: el par `lob.cta.pvp = sal.opciones.titulo` se mantiene | ✔ |
| `npx eslint .` | **21** (20 errores y 1 aviso), los de la línea base. Los seis archivos tocados (`Lobby.jsx`, `IconosLobby.jsx`, `textos.es.js`, `diagSAL.mjs`, `gen-portada-assets.mjs`, `laminas/ajf1/capturar.mjs`) salen con código 0 | ✔ |
| `diagPUE` completo (4173) | **182 verdes + `1.8b`**. `dis` sigue en 68/68 dentro de `todo` | ✔ |
| · `1.8b` | **219,6 KiB** (FCP 112 ms, 7 recursos), frente a 219,4 | sube **+0,2 KiB**, ver abajo. **Aceptado por Victor** |
| `diagSAL sal` (5174) | **102/102**, con el título de `SalaOpciones` ya en plural | ✔ |
| `diagDSK lob` (5174) | **6/6** celdas | ✔ |

**Por qué sube `1.8b`.** La subida es del propio ajuste de §H, no de la limpieza: la limpieza dejó `1.8b` igual (219,4 → 219,4, §E). En el bundle, el CSS pasa de 202,60 a 203,46 kB en crudo (la §3.1 nueva) y el JS de 635,46 a 635,98 kB (`IconoPersonas`, las dos ranuras y los rótulos). Comprimido es un +0,2 KiB en un rojo que ya estaba (techo 200 KiB). La regla de §6 («si sube, STOP») hablaba de la limpieza. Se consigna de todos modos, porque esta tanda ya está parada.

**Lámina después del ajuste.** `laminas/ajf1/capturas/` se tomó **antes** de aplicar «A + icono», cuando el lobby real tenía las dos píldoras doradas. Si se regenera ahora con `capturar.mjs`, el caso «hoy» enseñará ya «A + icono». Las variantes se siguen inyectando por `[data-accion]`, así que la lámina funciona igual.

**Desviación de servidor**, la misma de §E: `diagSAL` y `lob` corren contra el servidor de desarrollo con bypass, en 5174. La sonda de H4/H5 corrió en 4173.
