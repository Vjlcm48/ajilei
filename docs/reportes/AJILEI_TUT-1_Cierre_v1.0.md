# AJILEI · TUT-1 / GUI-1 · El tutorial · Cierre de la campaña · v1.0

**Fecha:** 2026-11-25.
**Fichas:** `AJILEI_TUT-1_T1_v1.0.md` a `AJILEI_TUT-1_T6_v1.0.md`, más la Fase 0 y la lámina.
**Base:** `main` local con los commits de las seis tandas sobre `origin/main` = `c83776e`, sin push; respaldo en `respaldo-tut-1`.
**Normativo:** `AJILEI_Tutorial_v1.5.md`. Las notas v1.6 viven en `src/config/textos.tut.es.js`: el normativo no se reescribe.
**Informes:** los `AJILEI_TUT-1_*` de `docs/reportes/`.
**Para qué sirve:** es el punto de partida de quien herede el tutorial (la ola 0, GEN-1 1c, ASI-1, IDI-1). Las reglas viven en el registro de invariantes: INV-47 (su excepción de la guiada), INV-89, INV-90 e INV-12. Aquí queda la historia: qué hizo cada tanda, qué se mide, qué no y qué hereda cada quien.

---

## 1 · Las tandas, con sus SHA

| Tanda | Fecha | Qué hizo, en una línea | Commits |
|---|---|---|---|
| **Fase 0** | 2026-11-20 | La sonda: el mazo dado sin abrir protegidos (`setRng`), la mesa en modo guion y qué existe para la capa | — (su informe entró en 1-d) |
| **L** (lámina) | 2026-11-20 | La capa de señalización por portal, con `?tut=` en una raíz propia, Δ 0 con todo `#root` y el reloj quieto como única guarda | — (el mando nunca llegó a `main`) |
| **T1** | 2026-11-20 | Lo común: `CapaSenal` definitiva, las anclas de la mesa, los literales de la mesa a `t()`, `ajilei.guia` y la vara `diagDSK tut` | `6fa3b8b` · `9c2e031` · `44c507f` · `45e61d6` |
| **T2** | 2026-11-21 | La partida guiada: el mazo dado, las tres manos buscadas con el motor real, la mesa con `guion`, `tut guiada`; y, en todas las mesas, el velo de AJILEI al 55 % y la cola de 1 s del rasgueo | `c624d3c` · `03a77ce` · `318ee89` · `b943853` |
| **T3** | 2026-11-21 | La puerta: el premio de la guiada en el servidor (migración `tut1_guiada`, STOP-A), la tarjeta del primer login, «Cómo se juega» con tres tarjetas, las señales de primera vez, `tut puerta` | `4ae0975` · `37e8d83` · `b726a2b` · `a8ec5fb` |
| **T4** | 2026-11-22 | «Aprender por tema»: el momento congelado de la guiada, la muestra de cartas, los capítulos 1 a 6, la fila «Cómo se juega» del ⋮; `tut temas` y `tut menu` | `feaa115` · `b857f47` · `a930020` · `1c0303f` |
| **T5** | 2026-11-24 | Los capítulos 7 a 10 sobre las pantallas vivas (la Pista C), la colocación única por paso (el React #185 del S25) y la red del capítulo; `tut.app` | `3938591` · `5409d22` · `a2dd147` |
| **T6** | 2026-11-25 | La ruta de la primera vez (intro → capítulo 2 → puente → guiada), la pastilla entre manos que cuenta el camino, el diagnóstico del túnel fuera; `tut ruta` | 6-a `e565eb2` · 6-b (el commit que trae este informe; su SHA va en el chat) |

---

## 2 · Lo que la campaña deja

**Para el jugador:**
- **La tarjeta del primer login**, con la cifra que dice el servidor (2.000 si la cuenta nunca jugó una mano; 1.000 si ya jugó).
- **La ruta de la primera vez**, que «Jugar la guiada» abre mientras el capítulo 2 no tenga su ✓: «¿En qué consiste el juego?», «Cuánto vale cada carta» y «Ahora, a jugar».
- **La partida guiada:** tres manos con el mazo dado; se toca solo lo que se ilumina; AJILEI en la tercera; el cierre con «+N HC» pagado una sola vez por persona.
- **«Cómo se juega»** con tres tarjetas: la guiada (la cifra o «✓ Hecha»), «Aprender por tema» (diez capítulos en tres pistas, cada uno con su ✓) y «Pregúntale a Mia» («Pronto»).
- **Las tres señales de primera vez** en la mesa real contra las IAS.
- **«Cómo se juega» en el ⋮** de las dos mesas: abre el capítulo de la fase en curso sobre la mesa viva (los de la app dicen «En el lobby»).

**En el código:**
- **La capa** (`CapaSenal`, `capaSenalCore`, `senal.css`): portal a `body`, velo con hueco, aro, burbuja o tarjeta, barra fija y colocación calculada una vez por paso.
- **La guiada** (`screens/Guiada.jsx`, `lib/guiaManos.js`, `lib/mazoDado.js`, `GuiaControl`, `CierreGuiada`).
- **Los capítulos** (`guia/capitulos.js`, `Capitulo.jsx`, `momento.js`, `vuelta.js`, `ListaTemas`, `MuestraCartas`).
- **La ruta** (`guia/Ruta.jsx`, `RutaIntro.jsx`, `RutaPuente.jsx`, `ruta.css`).
- **La puerta** (`PuertaGuiada`, `OfertaGuiada`, `ComoSeJuega`, `SenalesPrimeraVez`).
- **En el servidor:** `premios_guiada`, `premio_guiada_estado()` y `cobrar_guiada()` (migración `20261121150000_tut1_guiada.sql`, aplicada).
- **Los textos:** 170 claves `tut.*` en `textos.tut.es.js`, que viajan en el trozo del tutorial y nunca en la entrada.
- **El peso:** `1.8b` cierra en **180,1 KiB**, con techo de 200. Lo único del tutorial que va en la entrada son las ramas de `App` y el `onClick` del lobby; lo demás viaja en el trozo diferido (INV-84).

---

## 3 · Las varas

| Vara | Qué vigila | Perfil |
|---|---|---|
| `diagDSK tut` | La capa sobre la mesa quieta: Δ 0, el hueco, el toque, 44, contraste, respaldo y dos líneas por rótulo. Control `sin-hueco` | `commit` y `completo` (3 s) |
| `diagDSK tut` guiada | La guiada entera en tres tamaños: cada paso avanza con su toque, AJILEI, «+2.000 HC», una sola `cobrar_guiada`, «Salir» en su sitio, Δ 0 y la pastilla entre manos (`tut.pastilla`, T6) | `completo` |
| `diagDSK tut` puerta | La oferta, «Cómo se juega» y las señales de primera vez | `completo` |
| `diagDSK tut` temas | Los diez capítulos en cinco celdas (también la del S25 sembrada) y `tut.app` sobre las pantallas vivas. Controles: `barra-encima`, `hueco-abierto`, `sin-ancla` y `vaiven` | `completo` |
| `diagDSK tut` menu | «Cómo se juega» desde el ⋮: la fila, el capítulo de cada fase, la pausa y el mazo | `completo` |
| `diagDSK tut` ruta | La ruta en cuatro tamaños: la revelación O1, el capítulo 2 con «Salir» y «Siguiente», el puente, la guiada y su cobro, «Salir» en las tres paradas y la puerta directa con el ✓. Control `caja-salta` | `completo` |

**Las pruebas:** `guiaManos.test` (las tres manos con el motor real), `momento.test`, `mazoDado.test`, `guiadaApi.test`, `guia.test`, `capaSenalCore.test`, `textos.test`, `testDistSinMoldes` (lo que entra y lo que no en `dist/`) y `testClavesAlmacen`. **En la nube:** `supabase/pruebas/tut1_verificacion.sql`.

**Veredictos de la tanda 6:** en su informe, §4. La serie de la tanda 5 (33 corridas) está en el suyo, §5.

---

## 4 · Lo que el arnés no mide

- **Las fuentes del aparato.** El React #185 de la tanda 5 solo salió con las fuentes del S25. Desde entonces, `tut.app` cuenta las pintadas por paso y un bucle así sale rojo con cualquier fuente, pero el tamaño real del texto en el aparato solo lo ve un teléfono.
- **Safari.** Las varas corren en Chromium (Edge). Ni la máscara del velo ni el `fixed` con el teclado abierto se midieron en un iPhone (§6).
- **El servidor de verdad.** Las varas cobran contra el banco imitado. El cobro real lo comprobó Victor en el S25 en las tandas 3 y 6 (`premios_guiada` limpio con 2.000 y el `saldo_tras` del movimiento).
- **Si se entiende.** Que una persona en blanco aprenda a jugar con esto lo dice la ola 0, no una vara.

---

## 5 · La herencia, por campaña

- **Ola 0.** Si alguien no entiende un paso, se cambia su rótulo o se añade un paso (nota v1.6 en los textos, o una v1.6 del normativo), nunca un capítulo nuevo. Si rompe algo de la mesa, va a PVP-2, antes de RNK-2.
- **GEN-1 1c.**
  - El tramo `invitado` del premio está escrito contra el tipo reservado `premio_invitacion`, que todavía no está en el `check`: hoy nadie es invitado. GEN-1 solo tiene que redefinir `guiada_premio_invitacion`.
  - El invitado cobra 1.000 al registrarse por el enlace (`origen = 'invitacion'`) y 1.000 más al hacer la guiada: el tope de 2.000 por persona ya lo lleva `cobrar_guiada`.
  - Quien llega por enlace a una mesa no ve la tarjeta: va a su sala.
- **ASI-1** («Pregúntale a Mia»). El corpus es `guia/capitulos.js` (los pasos, sus anclas y sus rótulos) con el normativo v1.5. Su tarjeta ya existe en «Cómo se juega» y dice «Pronto».
- **IDI-1.**
  - Las 170 claves `tut.*` van por `t()`, sin voz.
  - El techo es de dos líneas en 360×640, y las traducciones crecen un 20–30 %: `tut.lineas` mide cada rótulo y `tut ruta` mide las pantallas de la ruta, así que un idioma nuevo debe correr `tut`, `tut temas` y `tut ruta`.
  - La pastilla de la guiada es `nowrap`: `tut.pastilla` dice si cabe.
- **Taller del arnés.**
  - La celda escritorio-1920 de `celebracion` (sin capturas mientras cuenta eventos) y el guion de la 1c de ECO-1 («que pase un minuto») siguen sin dueño.
  - **El rojo intermitente de `tut.menu`** (tanda 6, 1 de 31 corridas). En la serie final, la celda 1920×1080 se cortó esperando un selector (30 s), sin decir cuál. Después salió verde nueve veces seguidas (40–44 s). No se encontró la causa. La hipótesis es el barajado: la mano real de 3 contra las IAS que deja en la fila solo «All-in» y «Retirarse», y un all-in antes del descarte que pierde la pila y deja la mesa sin «Siguiente mano». Desde la tanda 6, la vara dice al cortarse la etapa y los botones de la fila. Si vuelve a salir, ese mensaje es el dato para arreglarla, por ejemplo con una mesa sembrada que no dependa del barajado.

---

## 6 · iOS (INV-41)

**Nada validado en un iPhone durante TUT-1.** Todo lo vio Victor en el S25 (Android) y se midió en Chromium. Lo que hay que mirar en Safari la primera vez que alguien abra el tutorial en un iPhone:
- el velo de la capa (`box-shadow` de 200vmax);
- el `fixed` de la capa y de la ruta con la barra de Safari y el teclado;
- la revelación de la intro con `prefers-reduced-motion`.

Queda para la pasada de iOS siguiente; no bloquea el cierre.

---

## 7 · Lo que falta para cerrar del todo

Es el §5 de la ficha de la tanda 6, de Victor con el rector:

1. **El control de las IAS** en ventana oculta, unas 2 h: el comando va con el STOP-C de la tanda 6. Esta vez toca la mesa (`GameTable.jsx` y `TransicionMano.jsx`, por la pastilla).
2. **El push de `main`** con los tres SHA iguales, en el de 6-b. Después, borrar `respaldo-tut-1`.
3. **ajilei.io en el S25:**
   - «Acerca de» con el SHA nuevo;
   - «Cómo se juega» con los diez temas;
   - una mesa de 3 contra las IAS con el ⋮;
   - la ruta entera con una cuenta nueva de otro dominio, la pastilla de las tres manos y «Eliminar cuenta» al final.
4. **`completo`** esa noche, en ventana oculta.
5. **El guion de la ola 0 v1.1** y la ola 0.
