# AJILEI · LEC-1 · Letra legible · Cierre de la campaña · v1.0

**Fecha:** 2026-11-19.
**Ficha:** `AJILEI_LEC-1_T2_v1.0.md` (la tanda 2).
**Base:** `main` local con los commits de las tandas 1 y 2 sobre `origin/main` = `295ab7f`; respaldo en `respaldo-lec-1`. Los informes son los `AJILEI_LEC-1_*` de `docs/reportes/`.
**Para qué sirve:** es el punto de partida de las campañas que heredan de LEC-1. Las reglas viven en el registro de invariantes (INV-04, INV-57, INV-61, INV-82 e INV-88), en la cabecera de `src/styles/letra.css` y en `scripts/lec/lec.mjs`. Aquí queda la historia: qué hizo cada tanda, qué cambió en pantalla, qué se decidió y qué hereda cada campaña.

---

## 1 · Las tandas, con sus SHA

Ninguna está todavía en `origin/main`. `main` lo sube Victor después del control de las IAS, con los tres SHA.

| Tanda | Fecha | Qué hizo, en una línea | Commits |
|---|---|---|---|
| **Fase 0** | 2026-11-18 | La sonda: cuánto mide cada letra, qué cabe, qué es protegido y la causa de `vuelo humano` | — (su informe entró en el 1-d) |
| **L** (lámina) | 2026-11-18 | Las variantes A y B, por elemento y en seis tamaños, sobre la app real, con el mando `?lec=` | — (sin commits: el mando nunca llegó a `main`) |
| **T1** | 2026-11-19 | `letra.css` con lo que eligió Victor, las zonas de 44 del acostado y la vara `lec.mapa` | `9f0d5c1` · `d2e0e31` · `c38cdce` · `d8285b1` |
| **T2** | 2026-11-19 | `vuelo humano` en verde, las Invariantes y este cierre | `f9ed5fc` (`2-a`, `vuelo humano`) · `aa9cdb6` (`2-b`, documentos) |
| **2-c** | 2026-11-19 | Tras el control de las IAS (18/19, `tab.resto` rojo): `diagDSK tab` compara la matriz T3 y la frontera con la letra de LEC-1, con el control `TAB_CONTROL=sin-lec` (informe de la tanda 2, §4) | Un commit; su SHA va en el chat y es el tercero de la ceremonia, en lugar de `aa9cdb6` |

---

## 2 · Lo que la campaña deja

### Los tamaños nuevos, por clase

En px visibles, el mínimo de cada pantalla, en T1 (360×640) · T2 (390×844) · T3 (640×360). Solo las clases que cambian.

| Pantalla | Clase | Antes | Ahora |
|---|---|---|---|
| Lobby | `.lob-nav-btn` | 10,4 · 11,3 · 10,4 | 12,9 · 14 · 12,9 |
| Lobby | `.cst-ficha` | 10,8 · 11,7 · 10,8 | 10,8 · 11,7 · 13 |
| ⚙ | `.tie-cfg-txt small` | 9,8 · 10,6 · 9,8 | 10,7 · 11,5 · 10,7 |
| Retar, Salas, Armar | `.sal-bloque h2` | 10,4 · 11,3 · 10,4 | 11,2 · 12,1 · 11,2 |
| Retar, Salas, Armar | `.sal-caja` | 11,2 · 12,1 · 11,2 | 11,2 · 12,1 · 11,5 |
| Armar mesa | `.sal-modo-d` | 10,4 · 11,3 · 10,4 | 11,5 · 12,4 · 12,8 |
| Salas | `.sal-mesa-l2` | 10,4 · 11,3 · 10,4 | 11 · 11,9 · 11 |
| Salas | La Llena más larga | 8,2 · 8,9 · 10,4 | 10,7 · 11,9 · 11 |
| Salas | `.sal-vacio`, `.sal-unir` | 11,5–11,9 · 12,5–12,9 · 11,5–11,9 | 12,9 · 14 · 12,9 |
| Sala de espera | `.sal-esp-espera`, `.sal-esp-compartir`, `.sal-esp-salir` | 11,5–12,2 · 12,5–13,3 · 11,5–12,2 | 12,9 · 14 · 12,9 |
| Sala de espera | «Tú» de la silla | 7,9 · 8,6 · 7,9 | 9,2 · 10 · 9,2 |
| Rankings | `.rnk-cab-lista` | 9,4 · 10,1 · 9,4 | 14 · 15,1 · 14 |
| Rankings | `.rnk-fin`, `.rnk-lugar` | 10,1 · 10,9 · 10,1 | 11 · 11,9 · 11 |
| Rankings | `.rnk-tu-l` | 10,4 · 11,3 · 10,4 | 11,4 · 12,3 · 11,4 |
| Rankings | `.rnk-sub` | 11,2 · 12,1 · 11,2 | 12,2 · 13,2 · 12,2 |
| Rankings | `.rnk-medalla`, `.rnk-pos` | 11,5–11,9 · 12,5–12,9 · 11,5–11,9 | 12,9 · 14 · 12,9 |
| Mesa | «Mano #» | 10 · 10 · 10 | 10,9 · 10,9 · 10,9 |
| Mesa | Insignias de la barra propia | 10 · 10 · 10 | 11 · 11 · 10 |
| Mesa | «Mesa N» | 11 · 11 · 11 | 12 · 12 · 12 |
| Mesa | Botones de acción y multiplicadores | 12 · 12 · 10–11 | 12 · 12 · 12,5 |
| Mesa | Pista de descarte | 11 · 11 · 11 | 11 · 11 · 12,5 |
| Óvalo | Crónica, mesas 3–5 | 13 · 13 · 9 | 13 · 13 · 10 |
| Óvalo | Frase del resultado, mesas 3–5 | 13 · 13 · 9 | 13 · 13 · 11 |
| Óvalo | Comodín | 8 · 10 · 8 | 9 · 10 · 8 |

**T4–T6:**
- «Mano #» pasa de 10 a 10,9 en T4 y T5 (`h`, factor 1).
- La Llena más apretada de T4 pasa de 12,4 a 16,1, por el texto corto.
- En T6 no cambia nada: el zoom de 1,3 ya daba 13 o más.

### El resto

- **La Llena corta.** Dice «Faltan 5.000» y «Entrada 5.000», sin «HC», en `sal.opciones.mesa.faltan` y `sal.opciones.mesa.entrada`. La clave es compartida, así que una mesa normal fuera de alcance también la lleva.
- **Las zonas táctiles de 44 en el acostado** (`tactilLobby.css` §7). Valen por debajo de 860 de ancho y fuera de Rankings. La flecha y la casa crecen hasta 4 px hacia arriba y el ⚙ hasta 5 px a la izquierda. En 640×360, las tres pasan a 44 o más; en el S25 acostado (780×360), la flecha llega a 42,3 porque la corta el «+» de la píldora. Ningún píxel visible se mueve.
- **`src/styles/letra.css` y su regla.** Es global, desde `main.jsx`. Cambia solo `font-size` y, donde la caja crecería, fija el interlineado de hoy. Gana por especificidad, sin `!important`. La pantalla de fuera de la mesa sube solo con `--u` < 6 (lado corto bajo 600). La mesa sube solo sin `data-escala`, salvo «Mano #» en `h`.
- **La vara `lec.mapa`** (`diagDSK lec`, `scripts/lec/lec.mjs`). Vigila 29 pisos y 19 excepciones, y que nada baje de 9 px, en T1, T2, T3 y T6. Tarda 41–43 s y corre en los perfiles `commit` y `completo`. Su control rojo es `--lec-css=<copia>`.
- **`vuelo humano` en verde.** La cifra retenida de la barra propia conserva el ancho de la final (`GameTable.jsx` y `celebracion.css`): dx = 0 en T1 y T6, con volteo y sin volteo. La excepción de INV-82 está retirada.

---

## 3 · Lo que se decidió y por qué

| Decisión | Quién y cuándo | Por qué |
|---|---|---|
| **La opción voluntaria, fuera** | Victor, 2026-11-18: «mismos botones, letras internas más grandes, nada más» | Una letra que se lee no debería pedir un ajuste. Un interruptor duplica cada pantalla que hay que medir |
| **Sustituir, sin interruptor** | Victor, 2026-11-18 | Los tamaños aprobados son los de todos. No queda ningún mando en `main` (`?lec=` vivió solo en la lámina) |
| **A y B por pantalla** | Victor, 2026-11-19 | A (nada se mueve más de 0,5 px) en lobby, Retar, Salas, Armar mesa, Rankings, ⚙ y tienda. B (se mueve lo aprobado: la cabecera y la barra propia de la mesa ≤ 4 px, las sillas y las pastillas ≤ 2 px) en la sala de espera y en la mesa entera |
| **El óvalo, con letra más grande a Δ = 0** | Victor, 2026-11-18 | Dentro del óvalo del teléfono la letra puede subir si el óvalo no cambia. Así subieron la crónica y la frase del resultado del acostado y el comodín del vertical. Está anotado en INV-04 |
| **Los tres rojos que no son rojos** | Victor, STOP-C de la T1 | El ⚙ crece 5 px y no 3,7 (con 4 llegaba a 43,1). Rankings queda fuera de la zona de 44. La flecha en el S25 acostado mide 42,3 |
| **La reserva exacta en `vuelo humano`** | T2 | Un mínimo en `ch` dejaba 0,74 px en T1 y 0,95 en T6: «1250» no mide 4 ch en Arial negrita, y en el teléfono la fuente es otra. La caja lleva una copia invisible de la cifra final |

**Lo que no subió y por qué** (son las 19 de `LEC_EXCEPCIONES`, cada una con su cifra):

| Elemento | Se queda en | Por qué |
|---|---|---|
| «Pozo» y «A igualar», acostado | 8 | A 9 mueven la caja del pozo 2,8 px |
| Comodín, acostado | 8 | A 9 empuja la frase 11 px |
| Pastillas del ⚙, `.vid-pastilla` | 9,5–9,6 | Victor eligió A |
| «Pronto» del estante | 9,3 | Se sale de la pantalla |
| «Te quedan 8 de 8 hoy» | 9,7 | Mueve la fila 0,6 px |
| Nombre en la silla | 9,7 | «MaracuchaBrava_» deja de caber |
| `.sal-aviso` y los textos secundarios de la sala de espera | 10,4–10,8 | Mueven de 0,7 a 3,2 px |
| `.rnk-familia` | 11,2 | Su caja crece 4,8 px |
| «Tú» de la barra propia | 11 | Se recorta a 12 en el acostado |
| Insignias de los rivales | 10 | Mueven su cabecera 0,7–0,9 px |
| «Entendido», «Ahora no», «Omitir», «Salir de la mesa» | 12 | La caja crece 1,2 px |
| `.sal-chip`, `.lob-fila` | 13 y 12,2 | Cambian su caja o la de la hoja |

---

## 4 · Reglas nuevas

- **La letra sube con `font-size`, nunca con la caja.** Donde la caja crecería, se fija el interlineado de hoy, con razón ≥ 1,1 en el texto que puede partir línea. Un botón conserva su caja exterior bajando su propio relleno lateral.
- **Una hoja libre gana a un protegido por especificidad, nunca con `!important`.** `letra.css` lo hace en la mesa sobre `gameTable.css` sin abrirlo.
- **La letra dentro del óvalo del teléfono puede subir si el óvalo no cambia** (Δ = 0, INV-04).
- **Quien baje una letra del mapa la pone roja** (INV-88). La arregla o escribe la excepción en `LEC_EXCEPCIONES`, con su cifra y su condición de retirada.
- **Una cifra que cambia de valor durante un vuelo reserva el ancho de la final.** Lo que se mide antes del cambio tiene que seguir siendo cierto después (O1 aplicada a la cifra).
- **Lección: una campaña que toque el CSS del teléfono sin atributo corre `tab` antes del STOP-C.** INV-57 vigila ese teléfono byte a byte. LEC-1 no lo corrió en ninguna de sus dos tandas, y lo vio el control de las IAS: `tab.resto` salió rojo, con V-cel a 0/88 y V-frontera a 5/16, por la letra que la campaña subió a propósito. Se arregló en la 2-c sin resellar: la vara traduce la fila de antes con la cifra de `LEC_PISOS`, y el óvalo sigue byte a byte. Quien vuelva a cambiar esa letra pone al día `LEC_PISOS`, y la vara lo sigue sola.

---

## 5 · La herencia, por campaña

- **Ola 0.** Si alguien se queja de la letra, ese es el dato para abrir la puerta de mover cajas o la opción voluntaria. Hasta entonces, no.
- **IDI-1.** Hay que medir los anchos con los tamaños nuevos. Las clases con interlineado fijo son las primeras que se parten con un texto más largo:
  - `.tie-cfg-txt small`, `.sal-bloque h2`, `.sal-mesa-l2`, `.sal-modo-d`, `.rnk-fin`, `.rnk-lugar`, `.rnk-sub`, `.rnk-tu-l` y `.discard-hint`, con razón ≥ 1,1. Al partir crecen, pero no se pisan.
  - **Con más cuidado:** `.sal-unir`, `.sal-esp-compartir` y `.sal-esp-salir` llevan interlineado 0,894, y los botones de acción y multiplicadores del acostado, 12 px con letra de 12,5. Una segunda línea se montaría sobre la primera.
  - La Llena ya va corta. Un idioma con «Faltan» más largo vuelve a apretarla (`useEncajeLlena` la encoge).
- **TUT-1.** Las pantallas en estados fijos (`?sal=`, `?pvp=`) ya llevan la letra nueva. Las capturas del tutorial deben tomarse de aquí en adelante.
- **Mantenimiento.** Quien baje una letra, `lec.mapa` lo pone en rojo en el perfil `commit`. Quien cambie `--u`, la mesa o una pantalla del mapa vuelve a medir y pone al día `LEC_PISOS` o `LEC_EXCEPCIONES`.
- **Rankings.** La zona de 44 del acostado no llegó: las pestañas empiezan 6,5 px bajo la flecha, y la zona del ⚙ ya cruza allí la de la casa. Queda anotado, no abierto.

---

## 6 · Lo que falta para cerrar del todo

1. **El control de las IAS** (Victor, ventana oculta): las 19 varas con `pvp.mesa` y `pvp.lm`, unas 2 h, con `node` directo y los veredictos en archivo. La primera corrida, sobre `aa9cdb6`, salió 18/19; la 2-c arregla `tab.resto`, y el verde de esa vara está en el informe de la tanda 2, §4.
2. **El push de `main`** con los tres SHA, y después borrar `respaldo-lec-1`.
3. **La comprobación de Victor en ajilei.io con el S25:** lobby, Salas, la mesa de 5 acostada y el resultado. Lo que ve tiene que ser lo de la lámina.
4. **`completo`** (Victor, ventana oculta, unas 6 h 25 min) como segunda línea base. `vuelo humano` tiene que salir verde ahí, sin excepción.
