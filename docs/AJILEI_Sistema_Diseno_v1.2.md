# AJILEI — Sistema de Diseño Unificado

**Versión:** 1.3
**Fecha:** 2026-06-12 · última actualización 2026-08-26
**Naturaleza:** Documento maestro de referencia permanente. Toda pantalla actual o futura de AJILEI debe diseñarse citando este documento.
**Changelog v1.3 (2026-08-26):** Campaña ICO-1 — el icono de aplicación oficial entra al repo como activo sellado y se registra como motivo de identidad (sección 2). La tabla de tokens NO cambia: la rampa vinotinto del icono no es token y ninguna pantalla la consume.
**Changelog v1.2:** Tandas 1, 2 y 3 completadas y verificadas — identidad visual unificada en toda la app. Deuda del dorado único SALDADA. Nuevos patrones registrados (secciones 3 y 9). Lección de contraste incorporada como regla (sección 5).

---

## ⚠️ RESTRICCIÓN GENERAL

**Los archivos protegidos** (lista canónica en `AJILEI_Protegidos_v1.0.md` §2; entre ellos `gameEngine.js` y `aiPlayer.js`) **no se modifican sin autorización explícita de Victor.** Este sistema es 100 % capa visual: ninguna campaña de diseño tiene motivo para abrirlos. La excepción pre-autorizada y las aperturas autorizadas viven en Protegidos §6 y §7, y en ningún otro sitio. *(ARN-3e (2026-10-03): decía «NO modificar `gameEngine.js` ni `aiPlayer.js` bajo ninguna circunstancia», que chocaba con Protegidos §6 y §7.)*

---

## 1. ESENCIA DE LA MARCA

> **"Elegancia criolla premium": la tradición venezolana del Ajilei llevada a lo digital con sobriedad, calidez y carácter.**

Tres sensaciones: **tradición** (baraja española, identidad venezolana con finura), **premium** (acabados refinados, dorado fino, sombras trabajadas) y **juego** (vida sutil, recompensa visual).

Patrón de referencia: la pantalla principal (`WelcomeScreen`).

## 2. MOTIVOS DE IDENTIDAD

1. **Arco de 8 estrellas** — LA firma. Estrellas blancas/crema sobre trazo `--flag-blue`. Versión completa (~200px, welcome) y mini (~140px, selección de mesa).
2. **Filigrana de fondo** — token `--filigrana` (reticulado dorado 1px a ~0.05). Presente en TODOS los fondos: se compone como `var(--filigrana), radial-gradient(...)`.
3. **Cartas propias decorativas** — Rey de Oros (`doce_oro.png`) y Caballo de Oros (`once_oro.png`), opacidad ~0.22, ocultas <680px.
4. **Separador dorado fino** — línea 60px × 1px, `rgba(--gold-brand-rgb, 0.3)` (selección de sala). Para pantallas de paso donde el arco se repetiría.
5. **Acento tricolor** — solo abstracto y solo si no hay otro guiño en la vista.
6. **Icono de app oficial** — ver `AJILEI_Icono_v1.0.md`; rampa vinotinto como excepción documentada, solo dentro del activo. Vive fuera de las pantallas (pestaña, lanzador, manifest), así que no entra en la regla de un guiño por pantalla.

**Regla de distribución de guiños:** un guiño por pantalla máximo; pantallas consecutivas no repiten el mismo motivo; en pantallas funcionales intensas (tablero), "ninguno" es válido y preferible — la filigrana de fondo ya es firma suficiente.

## 3. COMPONENTES

### Panel premium
Bordes redondeados generosos (~32px en navegación); borde dorado fino `--gold-brand` (en el tablero: grosor heredado, solo color); sombra trabajada + brillo interno leve (`inset 0 1px 0 rgba(--gold-brand-rgb, 0.10)`); fondo más oscuro que el fondo de pantalla.

### Botones
- **Principal:** fondo `--gold-brand`, texto `--text-dark`. Uno por pantalla.
- **Secundario:** apagado, borde sutil. **Deshabilitado:** atenuado, "Próximamente" como texto externo (`--text-faint`).
- Semánticos del juego (raise naranja, fold rojo): conservan su lógica con tokens.

### Patrón "texto oscuro sobre dorado" (REGISTRADO)
Todo elemento con fondo `--gold-brand` lleva `color: var(--text-dark)`: botón principal, badge MANO (clase unificada para todos los jugadores), `.btn-primary`. Sin excepciones.

### Etiquetas y badges
Estilo contenido y fino; dorado solo para lo positivo/protagónico. Badges equivalentes entre jugadores (ej. MANO) comparten UNA clase — prohibido duplicar estilos por jugador.

### Tarjetas de opción (selección de mesa/sala)
`--surface-card` + borde fino dorado; hover con realce dorado y elevación leve (`transform`); título grande + subtítulo secundario; stagger de entrada ~70ms.

## 4. TIPOGRAFÍA Y ESPACIADO

- Tipografía actual (`--font-base`). Títulos: letter-spacing amplio, `--gold-brand`, **tono cálido** ("Elige tu mesa", "Elige tu sala" — nunca formas técnicas tipo "SELECCIONAR X").
- Narrativa de navegación coherente: cada título continúa la frase del anterior.
- Aire generoso siempre.

## 5. REGLAS DE ANIMACIÓN Y COLOR (ley del proyecto)

1. **Solo `transform` y `opacity`** (más `box-shadow` para halos). Nada que dispare reflow.
2. **Nunca bloquear la interacción.**
3. Entradas: fade + leve subida, una vez, <1s.
4. **Asimetría emocional:** lo positivo se celebra; lo negativo es breve y discreto.
5. Liviandad: PWA, público móvil de gama media.
6. **REGLA DE CONTRASTE (lección Tanda 3):** todo cambio de `background` exige verificar el contraste de TODO texto/ícono que viva encima, en TODAS las instancias del elemento (ej. badge del jugador Y de la IA). La legibilidad es parte del cambio, no un efecto colateral.
7. **Compensación de opacidad:** al migrar a un color más brillante, reducir levemente la opacidad para conservar la intensidad percibida.

## 6. REGLAS DE LAYOUT (ley del proyecto)

1. **Anclaje absoluto** en áreas de juego: alturas fijas, franjas reservadas, ocultamiento sin colapso.
2. Decorativos: `position: absolute`, fuera del flujo.
3. **En el tablero, los bordes solo cambian de color, jamás de grosor.**
4. Responsive en tres niveles: desktop alto (≥768px y ≥900px: cartas +20%), estándar, móvil (<768px; decoraciones <680px ocultas).

## 7. ARQUITECTURA DE TOKENS

Todo valor vive en `src/styles/theme.css` (primer import de `main.jsx`). Nada nuevo se hardcodea: variable existente, o se agrega a `theme.css` Y a la tabla de la sección 8.

## 8. TABLA DE TOKENS (implementada y verificada)

### GOLD
| Token | Valor |
|---|---|
| `--gold-brand` | `#e8b84b` |
| `--gold-brand-rgb` | `232, 184, 75` |
| `--gold-hover` | `#f5cc6a` |
| `--gold-dim` | `#c9973a` — **uso restringido: solo halos Saldo Vivo y filigrana** |
| `--gold-dim-rgb` | `201, 151, 58` |

### GREENS
| Token | Valor |
|---|---|
| `--green-abyss` | `#0a1e10` |
| `--green-darkest` | `#0d2416` |
| `--green-deep` | `#1a4a2e` |
| `--green-base` | `#235c38` |
| `--green-bright` | `#2e7548` |

### SURFACES
| Token | Valor |
|---|---|
| `--surface-panel` | `rgba(10, 28, 14, 0.75)` |
| `--surface-game` | `rgba(35, 92, 56, 0.88)` |
| `--surface-card` | `rgba(10, 30, 15, 0.55)` |
| `--surface-area` | `rgba(10, 30, 15, 0.45)` |
| `--surface-area-light` | `rgba(10, 30, 15, 0.30)` |
| `--surface-modal` | `#0e2518` |

### TEXT
| Token | Valor |
|---|---|
| `--text-primary` | `#f5edd8` |
| `--text-primary-rgb` | `245, 237, 216` |
| `--text-secondary` | `rgba(245, 237, 216, 0.72)` |
| `--text-muted` | `rgba(245, 237, 216, 0.55)` |
| `--text-faint` | `rgba(245, 237, 216, 0.25)` |
| `--text-dark` | `#1a1a0e` |

### IDENTITY
| Token | Valor |
|---|---|
| `--flag-yellow` | `#ffcc00` |
| `--flag-blue` | `#003893` |
| `--flag-red` | `#cf142b` |

### SEMANTIC
| Token | Valor |
|---|---|
| `--loss-red` | `#b71c1c` |
| `--loss-red-rgb` | `183, 28, 28` |
| `--win-green` | `#66bb6a` |
| `--lose-red` | `#ef5350` |
| `--bet-orange` | `#ff8a65` |
| `--raise-orange` | `#e65100` |
| `--raise-orange-rgb` | `230, 81, 0` |

### OTROS
| Token | Valor |
|---|---|
| `--font-base` | `Arial, sans-serif` |
| `--filigrana` | dos `repeating-linear-gradient` de diamante dorado |
| `--card-w` / `--card-h` | `76px` / `118px` → `91px` / `142px` @ `(min-width:768px) and (min-height:900px)` |

## 9. DEUDAS Y EXCEPCIONES

1. ~~**Doble dorado visible**~~ — ✅ **SALDADA (Tandas 1-3).** `--gold-dim` vive solo en su definición, la filigrana y los halos de Saldo Vivo.
2. **Dos rgba sin token** (`--lose-red-rgb`, `--text-dark-rgb` pendientes): hover `.btn-leave` y subtítulo botón activo en modeSelect. Visualmente exactos.
3. **Nombres `--loss-red` vs `--lose-red`:** renombre semántico pendiente.
4. **Tipografía Arial:** candidata a sustitución por una fuente con más carácter en una tanda futura.

## 10. HOJA DE RUTA

| Tanda | Pantalla | Estado |
|---|---|---|
| 0 | Tokenización (`theme.css`) | ✅ COMPLETADA |
| 1 | Selección de mesa | ✅ COMPLETADA |
| 2 | Selección de sala | ✅ COMPLETADA |
| 3 | Tablero (quirúrgica) | ✅ COMPLETADA |
| Futuras | Mesas multi-IA, lobby multijugador, tienda, ranking, perfil | Nacen citando este documento |

## 11. MANTENIMIENTO

- Decisiones estéticas nuevas → se incorporan aquí (v1.3...).
- Conflicto entre instrucción puntual y este sistema → preguntar antes de implementar.
- Toda pantalla nueva comienza con: *"Diseñar conforme a `AJILEI_Sistema_Diseno.md`"*.

---

## 12. NOTA DE CORRECCIÓN — DOS CAMINOS DE RENDER Y REVERSO (2026-09-05, DOC-2b)

Tres etiquetas que circulaban por la cadena de instrucciones quedaron demostradas
incompletas o incorrectas durante la campaña CAR-1. Se corrigen **aquí**, en el
documento maestro, y no en las fichas e informes donde nacieron: un documento
cerrado es registro histórico y no se reescribe.

**1 · Los dos caminos de render del rival dependen de la ORIENTACIÓN, no sólo de
la mesa.** Medido el 2026-09-05 sobre `807b63b`, showdown, contenedor real del
`<img>` de la carta del rival:

| Mesa | Escritorio 1440×850 | Móvil vertical 390×844 | Móvil apaisado 780×360 |
|---|---|---|---|
| **2** | `.ai-zone` | `.ai-zone` | **`.opp-panel` dentro de `.rivals-zone`** |
| **5/4/3** | `.opp-panel` | `.opp-panel` | `.opp-panel` |

En cada celda, la sección de la otra vía está **ausente del DOM**, no oculta: son
dos ramas de JSX excluyentes, no dos capas superpuestas. La fuente está declarada
en [GameTable.jsx:71](../src/components/GameTable.jsx#L71) —«panel compacto
(`.opp-panel`) en landscape y espejo (`.ai-zone`) en portrait»— y se ejerce en las
dos ramas de 1780 y 1789; `renderTwoPlayerRival` (1424) es la que pinta `.ai-zone`.

Consecuencia práctica: **«mesa 2 vía `.ai-zone`» es cierto en dos de tres
viewports y falso en el tercero.** La forma corta que sí aguanta es «mesa 2 usa
`.ai-zone` salvo en apaisado». Quien verifique los dos caminos tiene que cubrir
las **dos orientaciones**, que es exactamente lo que ya pedía
`AJILEI_Tapetes_v1.0.md:38` («cinco fondos × dos caminos × dos orientaciones»);
lo que faltaba en esa línea es que la segunda orientación **cambia la vía**, no
sólo la caja. `AJILEI_Menu_Utilidades_v1.5.md:186` ya lo tenía correcto y es la
redacción de referencia.

**2 · El reverso viaja por las DOS rutas, no sólo por CSS.** Es `<img>` en
[PlayingCard.jsx:3](../src/components/PlayingCard.jsx#L3)
(`reverso_carta.svg?no-inline`, dentro de `opp-card-slot`) y también en
[Portada.jsx:10](../src/screens/Portada.jsx#L10); y es `background: url(...)` en
`gameTable.css` **642, 664 y 1080** (mazo y carta voladora). Decir «el reverso es
un `background-image`» deja fuera la mitad. Sigue siendo un solo SVG de 6 994 B y
ninguna de las dos rutas cambió en CAR-1.

**3 · La matriz de `diagDSK.mjs gate` son SEIS celdas, no cuatro:** 640×360,
360×640, 844×390, 1024×768, 1366×768, 1920×937. El «matriz 4/4» de
`AJILEI_CAR1_Cierre_Commits_v1.0.md` §5 y Paso 2.5 nació de contar líneas sobre
una salida truncada; el arnés escupe JSON y hay que parsearlo, no contarlo.
Léase **6/6** en las dos apariciones. La cifra correcta ya consta en
`docs/reportes/AJILEI_CAR1_Cierre_Reporte_v1.0.md` y en los informes de FRZ-1.

**4 · No existe maestro vectorial de la baraja (2026-09-05, VEC-1).** Retirados
en `cdc996a` los dos pliegos que llevaban años en el árbol sin que nadie mirara
qué eran:

| Archivo | Bytes | md5 |
|---|---|---|
| `src/assets/baraja.svg` | 1 267 756 | `37d1757505d867ed418d29685ab6dbd3` |
| `src/assets/baraja2.svg` | 4 098 052 | `59c8b27e1e3b697efb15410386b7415c` |

Entraron los dos en `819e276` (2026-06-12), el volcado inicial, el mismo commit
que los 40 PNG — coincidencia que no probaba nada porque entró todo a la vez.

**Veredicto medido.** Son vectores reales —0 % base64, 1 538 y 3 299 trazados,
limpios al 400 %— pero de **otra baraja**: el pliego libre «NAIPES LIBRES», con
la cabeza del ñu de GNU en las monedas y el lema «LIBERTAD ES ORO», sin autor ni
licencia declarados en su `<metadata>`. Y ni siquiera está completa: entre los
dos dan las pipas 1-9 y las figuras 10 y 12, pero **el 11 —el caballo— está en
blanco en los cuatro palos de los dos pliegos**, y sobran el 8 y el 9, que la
baraja española del juego no usa.

> **No existe maestro vectorial de la baraja de AJILEI, ni fuera del repo ni
> dentro.** Los 40 PNG de `src/assets/cards/` son la fuente y son el techo: todo
> derivado —los WebP de CAR-1 incluidos— se transcodifica desde ellos, y ninguna
> regeneración degrada nada porque siempre se parte del mismo origen.

Se retiraron del árbol, no del historial. Para recuperar cualquiera de los dos:

```
git show 819e276:src/assets/baraja2.svg > baraja2.svg
```

Con ellos cayeron sus tres únicas herramientas —`scripts/analyze_baraja2.py`,
`scripts/find_all_cards.py`, `scripts/find_ids.mjs`, las tres apuntando al
pliego por ruta absoluta— y dos SVG de plantilla sin referencias, `vite.svg` y
`react.svg`. Ninguna de las siete rutas salía al build: verificado por el hash
agregado de `dist/`, idéntico antes y después del retiro.

**`heptacoin.svg` fue evaluado en la misma pasada y NO es candidato.** Es maestro
vivo: `ChipToken.jsx:17` lo importa con `?no-inline` y de ahí cuelgan
`BalanceDisplay`, `Celebracion` y `GameTable`; sale al build; `Identidad_A_v1.1`
§5.4 lo declara ID de activo de contrato; y `laminas/mon1/heptacoin.py` lee sus
constantes para generar el 3D de la Portada. Lo que MON-1/MON-2 sustituyó fue la
moneda **de la escena 4**, no la del juego.

*La comparación 1:1 del pliego contra `doce_oro.png` no se archiva aquí: pesa
263,5 KB y el tope de esta pasada eran 150 KB. Vive en el informe de Fase 0 de
VEC-1.*

**5 · La moneda de la Portada no se descarga donde la escena no existe
(2026-09-05, MON-2.1).** `heptacoin.webp` pesa 1 040 KB —87 cuadros con alfa a
616×346— y es el **69,4 % de todo lo que la Portada baja** (1 499,0 KB con ella,
458,4 KB sin ella, medido en Fast 4G). La Fase 0 encontró que se bajaba entera
en los dos escalones donde `portada.css` pone `.pue-escenario { display: none }`:
`(orientation: portrait) and (max-height: 520px)` y `(orientation: landscape)
and (max-height: 540px)`. En móvil apaisado la caja del `<img>` mide 0×0 y el
megabyte viajaba igual.

`Portada.jsx` replica esas dos condiciones en un `matchMedia` (`ESCENA_OCULTA`)
y las compone con la de `prefers-reduced-motion` que ya existía: **tres
condiciones que apagan la descarga, ninguna sustituye a otra**. Las condiciones
se copian, no se mueven: la hoja sigue mandando sobre lo que se pinta y el
módulo sólo pregunta. Es reactiva al giro, que es el caso que importa — quien
abre en apaisado y gira a vertical ve la escena 4 entera.

**Los dos assets se mudaron de `public/` a `src/assets/`** para que Vite les
ponga hash de contenido. No es cosmética: sin hash no pueden entrar en la zona
`immutable` de `public/_headers`, y sin ella revalidaban en cada visita —un
viaje de ida y vuelta bloqueante por visita para un archivo que no cambia. La
mudanza no recodifica nada: los md5 de `dist/assets/` son idénticos a los de
origen (`f0d99f58e6e76456…` y `bf923fd4119d63fe…`).

**Lo que NO se tocó, y por qué.** El peso del archivo. La Fase 0 midió que no
sobra resolución —en un teléfono DPR 3 el navegador **amplía** la moneda un
12 %— ni calidad de color: recodificarla más baja la deja **más pesada**, porque
deshace la limpieza Bayer y la estabilización entre cuadros de `empaquetar.py`.
La única palanca real es **menos fotogramas**, y la sombra de vuelo
(`heptacoin_alfa.py:133-142`, mancha rectangular con la solución probada y sin
sellar) exige volver a Blender. Las dos juntas son **MON-3**.

**Dónde vive el origen.** Los 135 PNG RGBA de 880×495 están en
`laminas/mon2/render/png/`, que está en `.gitignore`: **no viajan en el repo**.
Copia de respaldo en `Downloads\AJILEI\mon2_render_2026-09-05`, **verificada el
2026-09-05: los 135 byte a byte idénticos al original**. Sin ellos, cualquier
reempaquetado exige Blender.

*Cabo suelto anotado, no tocado:* `laminas/mon2/empaquetar.py --publicar` sigue
escribiendo en `public/`. Cuando MON-3 regenere el asset tendrá que apuntar a
`src/assets/`; hasta entonces, publicar desde el taller deja el archivo en el
sitio equivocado —sin hash y fuera de la zona `immutable`— sin que nada avise.

*Dos verdes falsos que la mudanza estuvo a punto de crear, y se cerraron en la
misma tanda.* El arnés `diagPUE.mjs` comparaba la ruta del póster por igualdad
literal y filtraba el animado con `/heptacoin\.webp/`: con el hash de Vite
ninguna de las dos casa, y `mon.1`, `mon.6` y `1.6f` habrían medido una ruta
inexistente **en verde**. Ahora reconocen por nombre base, que es lo estable. Y
el comentario de `public/_headers` ponía `heptacoin.webp` de ejemplo de fichero
sin hash; se cambió por los iconos de `icons/`, que sí siguen en `public/`.
Ninguna regla cambió.

**6 · Índice digital de las cartas (IDX-1) — adenda del 2026-09-25, sin cambio
de versión.** *(La ficha de cierre la llama «§12.5»; como la nota 5 ya existía,
entra como 6 para no renumerar nada.)*

**Los PNG maestros no cambian de papel, pero los derivados del juego sí.** Los
40 PNG de `src/assets/cards/` siguen siendo la fuente de la baraja y son,
además, **la baraja clásica**: la que vale para imprenta, con sus dos índices
viejos. Se matiza la nota 4: los derivados del juego **ya no son una simple
reducción** del maestro. `scripts/gen-cards.mjs` pasa cada carta por IDX-1 **en
memoria** antes de reducirla, y lo mismo hace `scripts/gen-portada-assets.mjs`
con las cinco copas de la Portada. **No hay segundo maestro:** en el repo no
existe ningún PNG con el índice nuevo.

**La regla del índice.**

| Qué | Valor |
|---|---|
| Letra | Roboto Condensed 600 (`scripts/fonts/`, OFL) |
| Alto de la tinta de la cifra | 16 % del alto de la carta del 1 al 7 · 12 % en 10, 11 y 12 |
| Posición | la tinta empieza en y = 93 y acaba en x = 976 (px del maestro de 1055×1491), la misma para el 1 y el 11 |
| Contorno | crema `#F5EDD8`, 9 px por lado |
| Lo que desaparece | el índice inferior girado y el símbolo de palo: un solo número, arriba a la derecha |

**Colores por palo** (todas las cartas del palo, figuras incluidas):

| Palo | Color |
|---|---|
| Oros | `#CF142B` |
| Copas | `#235C38` |
| Espadas | `#003893` |
| Bastos | `#7A5200` |

Ninguno es el oro de marca.

**Holgura y factores.**

- **El dibujo ha de quedar a ≥ 18 px del número.** Cuando no llegaba, se encogió
  el dibujo entero de 1 en 1 %, con un **suelo del 85 %**. El 4 de oros es
  aparte: se recolocan sus cuatro monedas al 84 %.
- **El resultado está SELLADO** en la tabla `FACTORES_SELLADOS` de
  `scripts/idx/idxCore.mjs`: 31 cartas a 1 y 9 encogidas (la que más, al 90 %).
  El generador aplica la tabla y **no recalcula**.
- **La regla queda como comprobación:** si una carta baja de **17,0 px** con su
  factor sellado, o le quedan restos del número viejo, el generador **se
  detiene sin escribir nada**.

**Cómo se regenera.**

| Comando | Qué hace |
|---|---|
| `node scripts/gen-cards.mjs` | Las 40 de `src/assets/cards/webp/` (320 px, WebP q80, techo de alarma 0,80 MB) |
| `node scripts/gen-portada-assets.mjs cartas` | Sólo las cinco copas de la Portada (techo de 25 KB por archivo) |
| `node scripts/gen-idx.mjs` | La hoja de contacto de revisión (`capturas-idx/hoja.html`, ignorada): la baraja clásica («Hoy») frente a la nueva, a tamaño de mesa |

Los tres usan el mismo núcleo, `scripts/idx/`: `idxCore.mjs` para la lógica pura
con pruebas, `idxPagina.mjs` para lo que corre en Edge e `idxNavegador.mjs`
para abrir la página. Sólo hace falta regenerar si cambian los maestros.

*Aviso medido:* en las 9 cartas encogidas Edge rasteriza el número por GPU, y
entre corridas el borde de antialias varía ±1 nivel. Esa variación sólo aparece
al regenerar. Lo commiteado es, al byte, lo que Victor aprobó (IDX-1, C-1).
Detalle en `docs/reportes/AJILEI_IDX-1_Fase1b_Informe_v1.0.md` §4.

*Pendiente (IDX-1 Fase 1c, D-14):* las capturas `mesav`, `mesapc` y
`public/og-image.jpg` siguen enseñando la baraja clásica hasta que se rehagan.
**Cerrado por CAP-1** (capturas por arnés, semilla 5; ver
`docs/reportes/AJILEI_CAP-1_Cierre_v1.0.md`).

**7 · Luz y cuerpo de la mesa (LUZ-1) — adenda del 2026-09-25, sin cambio de
versión.** La mesa recibe luz cenital (viñeta, luz central cálida y cuatro
focos), un riel oscuro en el óvalo con cuatro reflejos y sombras de contacto
en cartas, mazo, POZO y fichas. Todo vive en una sola hoja aditiva,
`src/styles/luz.css`, importada como último import de `GameTable.jsx`; ningún
archivo protegido cambia. Lámina sellada: **AJILEI · LUZ-1 · Lámina v1.0**
(<https://claude.ai/artifact/J27hUARTqQJeT7Kw4z8Ktg>). La lámina **no entra en el
repositorio**: pesa unos 3 MB, por encima del tope de 2 MB que fijó el
precedente de la Portada.

**El token `--luz-k`.** Se declara en `.game-table-screen` y vale `1`, que es la
lámina. Todos los alfas de la luz, del riel y de las sombras de contacto se
escriben como `calc(<alfa> * var(--luz-k))`: `0` apaga la luz, y `1.5` es el
techo que la lámina midió sin regresiones de contraste. Hay dos cosas que
**no escalan** con él:

- **los reflejos del óvalo**, porque son SVG en data URI y ahí no llegan las
  custom properties;
- **el filtro de las fichas**, que va horneado para poder retirarlo solo.

No se redefine en `:root`: los tokens del fieltro son compartidos con otras
pantallas.

`calc(<alfa> * var(--luz-k))` es válido en Chromium (Edge 153) y en WebKit 26.5;
el iPhone sigue siendo la prueba visual final.

**La viñeta sube el contraste y la luz lo baja.** Los textos del borde de la
mesa son claros sobre fondo oscuro. Oscurecer el borde los ayuda; iluminar el
centro (luz central y focos) los perjudica, porque la luz cae sobre los paneles
translúcidos de las IAS. Por eso la luz trae dos ajustes que son condición de
ella, no adorno:

| Texto | Antes | Con LUZ-1 |
|---|---|---|
| «Mano #N» (`.hand-badge`) | `rgba(var(--text-primary-rgb), 0.45)` | alfa **0,62** |
| «Pasó» (`.opp-status` sin variante) | `var(--text-muted)` = alfa 0,55 | alfa **0,64** del mismo color |

El token `--text-muted` **no cambia**: es compartido. Quien añada otra fuente de
luz sobre la mesa tiene que volver a medir estos dos textos con las capas
encendidas (modo `luz` de `diagDSK.mjs`).

**Sin sombras en los paneles mientras exista `turnBreath`.** La animación de
turno anima el `box-shadow` de `.opp-panel`, `.ai-zone` y `.player-zone`, y
durante el pulso sustituye cualquier sombra que se les ponga. Una sombra de
contacto en los paneles aparecería y desaparecería con el turno. Quedan fuera
de LUZ-1 hasta que `turnBreath` deje de usar `box-shadow`.

**La carta seleccionada no lleva sombra de contacto.** Conserva su halo dorado
`!important` (`playingCard.css:29-33`; eran `:23-27` antes del comentario que los justifica, ARN-3e (2026-10-03)). Tampoco hay `drop-shadow` en las cartas.
La sombra de contacto va con `:where()` en 0,1,0 y excluye `.card-winner` y
`.card-empty`, que tienen esa misma especificidad y cargan antes: sin la
exclusión, el orden de carga les quitaría el halo y el `none`.

**8 · El reverso de mesa (REV-1) — adenda del 2026-09-25, sin cambio de
versión.** Dentro de la mesa el reverso es una **copia de mesa**,
`src/assets/cards/reverso_carta_mesa.svg` (1005×1420, 7 498 B). El original,
`reverso_carta.svg` (910×1420, 6 994 B), no cambia y sigue siendo el reverso de
la **Portada** y de la **sala de espera**.

**Por qué existe.** El original mide 910:1420 = 0,641 y su propio comentario lo
declara seguro con `cover` hasta 0,693. Las cartas del humano en escritorio y en
teléfono apaisado tienen la proporción de las caras de la baraja, 1055:1491 =
0,699–0,708, y la voladora que va hacia ellas y la IA de mesa 2 en apaisado,
también. En esas cajas `cover` escalaba por el ancho y cortaba un 4,2 % arriba y
otro abajo: los broches quedaban fuera y el marco tocaba el filo (Fase 0 de
REV-1, causa (b)). La copia tiene la proporción de las caras (1420 × 1055/1491 =
1004,8 → 1005), así que con el **mismo** `cover`:

- en las cajas estrechas (≤ 0,641) la escala la fija el alto y se ve igual que
  el original, porque la tela añadida cae fuera;
- en las anchas (0,699–0,708) la tela añadida llena el ancho y el dibujo se ve
  entero;
- en las intermedias (0,642–0,656: mazos de móvil y el humano en vertical) el
  dibujo se ve entero y ligeramente más pequeño, porque la copia deja de
  recortar el 0,1–1,2 % por lado que recortaba el original. Aceptado por el
  rector.

**La regla de la copia: sólo se ensancha la tela.** El campo vinotinto y su
raya diplomática llegan hasta el filo; el marco, los broches, el isotipo y las
estrellas son **los mismos, en las mismas coordenadas, centrados**. No es un
segundo diseño: es el mismo dibujo en un lienzo más ancho.

**Cómo se regenera si cambia el original** (Fase 1 de REV-1, §2.1):

1. `viewBox="0 0 1005 1420"`, y `width="1005"` en el raíz.
2. Todo el contenido del original, `<defs>` incluidas, dentro de
   `<g transform="translate(47.5 0)">`, sin cambiar una coordenada.
3. Sólo las capas de fondo (las dos `rect` del campo: el color y el `pattern`
   de la raya) pasan a `x="-47.5" width="1005"`. La raya es un `pattern` en
   `userSpaceOnUse` que vive dentro del grupo, así que su fase se traslada con
   él y queda continua en las costuras.
4. Ningún elemento que no sea fondo se toca, y los `id` se conservan: cada
   archivo viaja aislado (`<img>` o `url()`).
5. Si algún elemento del dibujo tocara x = 0 o x = 910, ensancharlo sería
   rediseñar: se para y se consulta.

Se regenera con `node scripts/gen-reverso-mesa.mjs`; `--comprobar` verifica sin escribir.

El generador que hace exactamente eso, idempotente al byte, es
`scripts/gen-reverso-mesa.mjs`. La comprobación: la franja central de la copia (x de 47,5 a 957,5)
rasterizada contra el original da Δ medio 0 y máximo 1 a DPR 1 y 3.

**Dónde entra.** Las cartas boca abajo (IAS por las dos vías y humano) la
toman por el import de `PlayingCard.jsx:3`, con el mismo `object-fit: cover`
inline de la línea 9. El mazo, la voladora y el abanico, por
`src/styles/rev.css` (último import de `GameTable.jsx`, detrás de `luz.css`):
`background-image` a la copia y `background-color: #41101c` en 0,2,0, que pisa
sólo la imagen y el color del shorthand 0,1,0 de `gameTable.css` 642, 664 y
1080. Esas tres son las únicas declaraciones de `background` que alcanzan esas
clases. El color de fondo corrige la causa (d) de la Fase 0: bajo el dibujo del
mazo se veía el fieltro. Quien añada otra regla de `background` a `.deck-pile`,
`.flying-card` o `.shuffle-fan-card` tiene que volver a correr el modo `rev` de
`diagDSK.mjs`.

**Dos correcciones a la nota 2** (Fase 0 de REV-1, §J-1). La nota 2 no se
reescribe:

- El reverso tiene un **tercer consumidor `<img>`**:
  [SalaEspera.jsx:3](../src/screens/SalaEspera.jsx#L3), con `?no-inline`.
- De las tres líneas de `gameTable.css`, **la 1080 es el abanico**
  (`.shuffle-fan-card`), no el mazo ni la voladora: 642 es el mazo y 664 la
  voladora.

Desde REV-1, además, la ruta `<img>` de `PlayingCard.jsx:3` apunta a la copia
de mesa, no al original.

**9 · La pregunta que no tapa (REC-1) — adenda del 2026-09-26, sin cambio de
versión.** Normativo: `AJILEI_APU-1_Reglas_v1.2.md` §5.4 y §5.5. Una pregunta
con plazo que llega en un **momento de lectura de la mesa** (el resultado de
una mano, una revelación) no se presenta encima de lo que el jugador está
mirando. Se presenta así:

- **Burbuja, sin velo,** en una **caja reservada** que ya existía (O1): no se
  abre sitio nuevo ni se mueve nada. Si la caja no tiene tamaño propio (en la
  mesa, la ranura de «Siguiente mano» mide 0 de ancho en escritorio y 0 de
  alto en el teléfono apaisado), la burbuja va **absoluta y centrada** dentro
  de ella, nunca en el flujo.
- **Aparece cuando termina la lectura**, no cuando se decide la pregunta. En la
  mesa, al aterrizar el vuelo de fichas; sin vuelo, en el acto; con una red de
  6 s por si la señal no llega.
- **Un solo reloj.** Burbuja y tarjeta leen el mismo contador; abrir o plegar
  no lo reinicia.
- **Abrible y plegable.** Tocar la burbuja abre la tarjeta con el tiempo que
  quede; «Ver la mesa», a la derecha del cronómetro, la vuelve a plegar.
- **Apertura sola al final.** En los últimos 5 s la tarjeta se abre sola y ya
  no se pliega: la decisión nunca vence sin que el jugador la vea.
- **Una pregunta que el jugador pidió** (la recarga voluntaria) no pasa por
  burbuja: se abre directamente.

**La variante C** (lámina REC-1 v1.0, elegida por Victor): 40 px de alto,
fondo `rgba(9,23,14,.94)`, filo de 1,5 px `rgba(232,184,75,.7)`, radio 999,
sombra `0 4px 14px rgba(0,0,0,.5)`, Arial 700 a 15 px. A la izquierda, el reloj
en un **anillo** que se vacía (fondo del trazo al 22 %, trazo `--gold-brand`,
arranca arriba), con los segundos dentro; a la derecha, el icono y el rótulo.
Icono: **triángulo de alerta** si la pregunta es obligatoria y **la Heptacoin
del juego** (`heptacoin.svg?no-inline`, nunca una moneda dibujada) si es una
sugerencia. El anillo se actualiza una vez por segundo **sin transición**.
Entrada: fundido y 8 px de subida en 0,32 s, y ninguna con
`prefers-reduced-motion`. Vive en `src/components/BurbujaRecarga.jsx` y
`src/styles/rec.css`.

**Vara de legibilidad del anillo** (medida por el modo `rec` de `diagDSK.mjs`
en S25 vertical y 360×640): diámetro ≥ 32 px (se escribe 34), número ≥ 12 px y
peso 700 (se escribe 14), y contraste ≥ 4,5 del número y del trazo contra el
fondo de la burbuja, compuesto sobre negro y sobre el verde más claro del
tapete.

**Desmontar, no esconder.** Mientras la pregunta es burbuja, la tarjeta y su
velo **no existen en el DOM**; no se esconden con `visibility`. El cronómetro de
la tarjeta lleva `visibility: visible` en línea (reserva su renglón en la
voluntaria) y sobreviviría a cualquier `visibility: hidden` heredado (Fase 0 de
REC-1, §J-8). La regla vale para cualquier capa con un hijo que fije su propia
visibilidad.

**10 · Dispositivos realistas de la escena 5 (DIS-1) — adenda del 2026-09-30, sin cambio de versión.**

- **Técnica sellada (camino B):** la laptop y el teléfono de la escena 5 son **una imagen por aparato**
  (`src/assets/portada/dis_laptop.webp`, `dis_telefono.webp`) con la captura del juego **horneada** en la
  pantalla. Sin `matrix3d` ni perspectiva CSS: el WebKit de Playwright para Windows no tiene transformaciones
  3D (`-webkit-transform-3d: false`) y descarta los términos de perspectiva, así que una prueba de WebKit sobre
  una `matrix3d` proyectiva no es fiable en esta máquina.
- **Origen:** renders de Blender 4.5 generados por `scripts/dis1/gen_dispositivos.py` (aparatos genéricos,
  laptop grafito y teléfono negro, sombra de contacto del propio render). Las maestras PNG de 16 bits viven
  **fuera de git**, en la carpeta de control de Victor (`Descargas\AJILEI\DIS-1\`). En git solo van los JSON
  (`maestras/dis1/`), el script y los dos WebP.
- **Geometría:** el bloque `DIS-1:geometria` de `portada.css` lo escribe `scripts/dis1/geometria_dis.mjs`
  desde los JSON. **No se edita a mano**; sin `--escribir`, el script comprueba que está al día.
  - Escritorio: laptop de 234 px de silueta a 1920 y teléfono +30 % sobre la escala real, delante de la
    esquina derecha de la laptop; todo escala con el alto del escenario (`cqh`).
  - Móvil (≤ 900 px): los aparatos conservan la caja que tenían los marcos planos; relevo teléfono → laptop.
  - Contrato: la lámina v1.3 (`maestras/dis1/contrato.json`), ±1 px, vigilado por el modo `dis` de `diagPUE`.
- **Comportamiento:** al terminar la escena, los aparatos se desvanecen con ella (su reposo es visible).
  Descargas con la regla de la adenda 5: no se piden donde la escena no existe ni con movimiento reducido.
- **Si cambia la mesa del juego:** nueva maestra de CAP-1 → `gen_dispositivos.py --reencajar` (sin Blender,
  segundos) → copiar los dos `*_web.webp` a `src/assets/portada/` y los JSON a `maestras/dis1/` →
  `node scripts/dis1/geometria_dis.mjs` (si no está al día, `--escribir`) → `diagPUE dis`.

---

## 13. LOS ÓVALOS DE LA MESA SON INTOCABLES (ARN-3e, 2026-10-03)

**Alcance:** «los óvalos» son **el óvalo central de la mesa** (mensajes, pozo y comodín) **en sus versiones para las mesas de 2, 3, 4 y 5**. Texto aprobado por Victor el 2026-10-03 (ARN-3e D19).

> **Los óvalos de la mesa son intocables.** Su caja —posición, tamaño y forma— la fijan las constantes de O1 y DSK-O2, selladas por medición, y no cambia por ninguna vía:
>
> 1. **Ni geometría.** Ninguna campaña mueve, redimensiona ni recoloca un óvalo, en ninguna mesa (2, 3, 4 o 5) ni en ninguna vista.
> 2. **Ni CSS.** Ninguna hoja nueva escribe reglas sobre el óvalo ni sobre su caja. Lo nuevo que deba verse dentro entra como elemento propio, con su clase, y se estiliza ahí (molde `.voz2-texto`, VOZ-2).
> 3. **Ni contenido que lo haga crecer.** Lo que se pinte dentro cabe en la caja sellada o se recorta por dentro (elipsis con `contain: inline-size`, VOZ-2 D7). Ningún texto, cifra, icono ni animación puede empujar la caja, tampoco desde su `min-content`.
>
> Cambiar un óvalo es una decisión de Victor, con la misma ceremonia que abrir un protegido (`AJILEI_Protegidos_v1.0.md` §1): detenerse, reportar y esperar. Lo vigilan `o1`, `o2`, `h1`, `r1`/`r2`, `msg`, `apu` (`solapeOvalo`), `luz`/`rev` (Δ 0) y `diagPUE voz2`; el registro lleva la lista al día (INV-04).

**Dónde lo dice el código** (no cambia; esta sección es su regla escrita):
- O1, `gameTable.css:1194-1196`: «Geometría FIJA del óvalo central … no se mueve ni redimensiona jamás».
- `gameTable.css:4985` y `:5016`: ningún contenido, presente ni futuro, lo mueve ni lo infla desde dentro.
- DSK-O2, `gameTable.css:5473-5475`: el óvalo congelado en las mesas de 4, 3 y 2.
- VOZ-2 D7, `voz2.css:30-39`: «la contención no es opcional»; la regla apunta al `<p>`, nunca al óvalo (`:100`).

`o1` y `o2` solo miden escritorio. En móvil lo vigilan `diagPUE voz2`, `msg` y `apu`: es un hueco aceptado (ARN-3e D8), anotado en INV-04.

**Precisión (Victor, 2026-10-03, PAN-1).** El óvalo **no se toca por diseño ni por contenido**: lo que dicen los tres puntos de arriba. Lo que sí hace es **adaptarse al tamaño de la pantalla**, como al girar el teléfono y como al entrar o salir de la pantalla completa (INV-45). El «Ni geometría» del punto 1 se lee así: ninguna campaña cambia la geometría que el CSS sellado da a cada tamaño de pantalla. El óvalo vertical sigue siendo el vertical, y su CSS no se toca.

---

## 14. PISO TÁCTIL: SE MIDE LA ZONA, NO LA CAJA (PAN-1, 2026-10-05)

**La regla (INV-07):** todo lo tocable de la mesa tiene una **zona táctil de 40 px por eje** (44 en el lobby y en el menú). La zona es lo que responde al dedo, y se mide por **barrido en cruz con `elementFromPoint`** desde el centro, no por la caja visible. Una caja de 28 con una zona transparente de 40 cumple; una caja de 40 tapada por un vecino, no. La dan pseudo-elementos `::after` transparentes en hojas aditivas (`src/styles/tactil.css`, sin `!important`, ganando por especificidad), que solo crecen sobre espacio sin nada tocable. La tarjeta de recarga tiene caja de 36 y zona de 40; la forzosa, 42 (`AJILEI_APU-1_Reglas_v1.3.md:217`).

**Tres comentarios del protegido `gameTable.css` quedaron atrás.** Los comentarios del protegido no se editan (`AJILEI_Protegidos_v1.0.md` §1). Esta nota dice cómo se leen hoy:

1. **«aquí no hay presupuesto para 40 reales»** (`gameTable.css:2042-2053`, BT-1, la fila de acciones comprimida). Sigue siendo cierto de la **caja**, que es de 28. Pero no es un incumplimiento: el `::after` de BT-1 lleva la **zona** a 40, y desde PAN-1 INV-07 se mide por zona. El «incumplimiento conocido» de los 28 px (H3e-ii-1) era una medida de la caja visible.
2. **«NUNCA a la izquierda (left:0)»** (`gameTable.css:3364-3366`, la ✕ de mesa 5 en apaisado, y `:3581-3584`, la de mesa 4). Rige para el **botón visible**, que no debe pisar el panel de la IA. Una **zona transparente** sobre una esquina sin nada tocable sí puede crecer a la izquierda: la ✕ de mesa 5 en apaisado lo hace (`left: -17px`, `tactil.css`). La de mesa 4 lo respeta: crece solo hacia arriba (`top: -10px`).
3. **«su táctil es deuda aparte»** (`gameTable.css:1936-1937`, los multiplicadores). La deuda está pagada: `tactil.css` les da la zona de 40 en el teléfono, en vertical y en apaisado.

Si un día se abre `gameTable.css` por otra causa, estos tres comentarios viajan con `.btn-soon` y `.soon-tag` (aplazado 6).
