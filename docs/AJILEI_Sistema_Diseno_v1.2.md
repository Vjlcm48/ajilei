# AJILEI — Sistema de Diseño Unificado

**Versión:** 1.3
**Fecha:** 2026-06-12 · última actualización 2026-08-26
**Naturaleza:** Documento maestro de referencia permanente. Toda pantalla actual o futura de AJILEI debe diseñarse citando este documento.
**Changelog v1.3 (2026-08-26):** Campaña ICO-1 — el icono de aplicación oficial entra al repo como activo sellado y se registra como motivo de identidad (sección 2). La tabla de tokens NO cambia: la rampa vinotinto del icono no es token y ninguna pantalla la consume.
**Changelog v1.2:** Tandas 1, 2 y 3 completadas y verificadas — identidad visual unificada en toda la app. Deuda del dorado único SALDADA. Nuevos patrones registrados (secciones 3 y 9). Lección de contraste incorporada como regla (sección 5).

---

## ⚠️ RESTRICCIÓN GENERAL

**NO modificar `gameEngine.js` ni `aiPlayer.js` bajo ninguna circunstancia.** Este sistema es 100% capa visual.

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
