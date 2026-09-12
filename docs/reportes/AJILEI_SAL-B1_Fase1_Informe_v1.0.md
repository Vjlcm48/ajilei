# AJILEI · SAL-B1 · Fase 1 · Informe v1.0
## `SalaOpciones` y `ArmarMesa`, con el stub de `SalaEspera`

**Rector:** `AJILEI_SAL-B1_Fase1_v1.0.md` · **Autoridad visual:** láminas SAL-1 v1.2 y SAL-2 v1.2, selladas.
**Punto de partida:** `12188af` (SAL-Ae). Verificado ancestro de `HEAD`.
**Estado:** **STOP sin commits.** El árbol queda listo para la ficha de commits.

---

## 0. Resumen en cuatro líneas

Las dos pantallas están completas y medidas: **54/54 celdas** del arnés nuevo (9 estados × 6 viewports), **597 pruebas** verdes (+32 sobre la línea base de 565), **build limpio**, **lint 21** (la línea base exacta), y `diagDSK lob` sigue **6/6**. Los cinco protegidos están intactos byte a byte. No se escribió una línea de SQL.

Aparecieron **tres defectos reales de geometría** que ningún documento preveía y que se arreglaron con fórmula, no con cifras: dos los cazó el arnés y **uno lo cazó mirar una captura** — el título de pantalla salía casi negro sobre el verde y los seis puntos del arnés lo daban por bueno. Están en §5.

---

## 1. Las cuatro contradicciones, resueltas por Victor

La regla 7 del rector manda parar y preguntar cuando la lámina y la ficha se contradicen. Se encontraron cuatro y se preguntaron **antes de escribir una línea**, en una sola ronda. Todas se resolvieron el **7-sep-2026**:

| # | Contradicción | Resolución |
|---|---|---|
| 1 | La lámina SAL-1 pinta un cronómetro vivo en la tarjeta (`{x}/{n} sentados · {t}`, tick de 1 s); la ficha §3.3 enumera la tarjeta sin tiempo y §4 manda el cronómetro a B2 | **Sin cronómetro.** Manda la ficha. Es la ÚNICA clave cuyo valor no es verbatim de la lámina |
| 2 | Fuera de alcance: la lámina pone «Te faltan X HC» en la línea 2 y deja «Unirme» apagado; la ficha §3.3 lo pone «en lugar del CTA» | **Como la lámina.** Conservar las tres columnas hace que una tarjeta fuera de alcance mida lo mismo que las demás, y la ventanilla de tres siga siendo de tres |
| 3 | El recordatorio suave: la lámina sólo en modo **Abierta** señalando otra mesa; la ficha §4.3 sólo en **Privada** con la combinación propia | **Los dos, cada uno en su modo.** No eran dos versiones de lo mismo: cada documento describía un modo distinto. No contradice a ninguno |
| 4 | §3.1 pide la barra superior «reutilizada, no copiada»; §2 dice que del lobby «nada más cambia» | **Componente compartido.** Nace `BarraSuperior.jsx` con el marcado exacto de hoy; el lobby pinta el MISMO DOM y `diagDSK lob` lo confirma 6/6 |

---

## 2. Archivos

### Creados (3.349 líneas)

| Archivo | Líneas | Qué es |
|---|---:|---|
| `src/screens/SalaOpciones.jsx` | 369 | SAL-1 completa |
| `src/screens/ArmarMesa.jsx` | 362 | SAL-2 completa |
| `src/screens/SalaEspera.jsx` | 280 | **STUB** de §7 — B2 lo reemplaza entero |
| `src/screens/salasCore.js` | 198 | La semántica pura: orden, máscara, «Te faltan», guarda de §4.4 |
| `src/screens/salasCore.test.js` | 260 | 27 pruebas sobre lo anterior |
| `src/styles/salas.css` | 763 | Hoja única, aditiva, sin un `!important` |
| `src/components/BarraSuperior.jsx` | 116 | La barra extraída del lobby (§3.1) |
| `src/components/IconosSalas.jsx` | 97 | Los cinco iconos nuevos |
| `src/config/salaRecordada.js` | 84 | La memoria de §4.4 |
| `src/dev/salasFixtures.js` | 225 | Los nueve estados de `?sal=` |
| `scripts/diagSAL.mjs` | 595 | El arnés |

**Dos archivos NO están en la lista de §2, y se declaran:** `BarraSuperior.jsx` (lo exige §3.1, y es la resolución de la contradicción 4) e `IconosSalas.jsx`. Este último podría haber ido dentro de `IconosLobby.jsx`, pero aquel archivo se titula «los siete iconos del lobby» y su cabecera argumenta con la ficha de LOB-1 delante **por qué son siete y no cinco**; añadirle cuatro lo habría convertido en un cajón cuyo nombre miente.

`salasCore.js` tampoco estaba previsto, y su razón es dura: **el proyecto no tiene jsdom** (hallazgo de FRZ-1), así que un `.jsx` no se puede montar en Vitest. Todo lo que §9.2 manda probar tenía que vivir fuera del JSX para poder probarse.

### Modificados (aditivo: +563 / −91)

| Archivo | Δ | Qué cambió |
|---|---|---|
| `src/App.jsx` | +195/−9 | Tres ramas nuevas en la cascada, arranque de §5.2/§5.3, guarda de precarga |
| `src/config/textos.es.js` | +114 | El bloque `sal.*` entero |
| `src/config/textos.test.js` | +98/−28 | Cuatro premisas actualizadas (§6) |
| `src/screens/Lobby.jsx` | +26/−54 | Monta `BarraSuperior`; el CTA de PvP pierde candado y pastilla |
| `src/lib/salasApi.js` | +67 | **Dos funciones nuevas**, ninguna existente alterada |
| `src/lib/salasApi.test.js` | +59 | El mapa de errores |
| `src/config/salas.js` | +16 | **Una** constante nueva: `CLAVE_CONFIG_SALA` |
| `.gitignore` | +5 | `capturas-sal/` |

---

## 3. Lo que `salasApi` necesitó de nuevo

§2 autoriza añadir funciones nuevas «sin alterar las existentes». Se añadieron **dos**, y ninguna de las de arriba cambió:

**`claveDeError(error)`** — traduce `sala_llena` → `sal.error.sala_llena`, y cualquier otra cosa → `sal.error.desconocido`. Vive junto a `CLAVES_ERROR` porque es la misma lista mirada desde el otro lado: quien añada un `raise` nuevo se tropieza con las dos.

**`contarSentados(salaId)`** — y ésta merece explicación, porque es la que estuvo a punto de ser un «Requiere autorización».

El stub de §7 tiene que enseñar «x/N sentados». `mi_sala()` devuelve la fila de `salas`, que trae `jugadores` (el tamaño de la mesa) pero **no** el recuento de sentados; y `salas_abiertas()`, que sí lo trae, **sólo ve las abiertas** — una sala privada, que es justo el caso del stub, quedaba sin manera de saberlo. Ninguna de las trece funciones de SAL-A responde esa pregunta.

**No hizo falta SQL nuevo.** La política de lectura de `sala_jugadores` que SAL-A ya escribió permite a un miembro ver los asientos de su sala (`es_miembro`) y a cualquiera los de una abierta que espera (`es_sala_publica`). Un `select` con `count: 'exact', head: true` cae dentro de lo ya concedido. La regla 3 —cero SQL— se cumple sin recortar la pantalla.

---

## 4. La tabla de errores · §6.3

Las nueve claves salen de leer los diecinueve `raise exception ... using errcode = 'P0001'` de `20260905203158_sal_a_salas.sql` (varias líneas lanzan la misma clave). El test recorre `CLAVES_ERROR` y comprueba que cada una tiene texto, así que una décima clave sin texto cae en rojo en vez de salir a pantalla como `⟦…⟧`.

| Error SQL | Líneas de la migración | Clave de texto | Texto |
|---|---|---|---|
| `no_autenticado` | 433, 525, 643, 675 | `sal.error.no_autenticado` | Tu sesión se cerró. Vuelve a entrar para seguir jugando. |
| `ya_en_sala` | 443, 596 | `sal.error.ya_en_sala` | Ya estás en una mesa. Sal de ella antes de entrar en otra. |
| `saldo_insuficiente` | 447, 600 | `sal.error.saldo_insuficiente` | No te alcanza para sentarte a esa mesa. |
| `sala_no_disponible` | 382, 578, 588, 680, 686 | `sal.error.sala_no_disponible` | Esa mesa ya no está. Puede que arrancara o que la cancelaran. |
| `sala_llena` | 605 | `sal.error.sala_llena` | Esa mesa ya está llena. Prueba con otra. |
| `demasiados_intentos` | 567 | `sal.error.demasiados_intentos` | Demasiados códigos seguidos. Espera un minuto y vuelve a probar. |
| `no_eres_anfitrion` | 683 | `sal.error.no_eres_anfitrion` | Solo quien armó la mesa puede hacer eso. |
| `faltan_jugadores` | 691 | `sal.error.faltan_jugadores` | Hace falta alguien más para arrancar. |
| `codigo_invalido` | 546, 574 | `sal.error.codigo_invalido` | Código no encontrado o mesa ya iniciada |
| *(cualquier otro)* | — | `sal.error.desconocido` | Algo falló. Vuelve a intentarlo. |

**Tres decisiones sobre estos textos:**

1. **Ninguno lleva variables.** Se pintan desde cinco sitios y un `{hc}` obligaría a que los cinco supieran pasarlo; el que se olvidara escribiría `⟦hc⟧` en la cara del jugador. Donde hacen falta cifras, la pantalla añade su propia nota con la clave que sí las lleva.
2. **`codigo_invalido` es verbatim de la lámina SAL-1** (`sal.codigo.invalido`): el aviso que Victor selló bajo el campo y el error que la base lanza son la misma cosa dicha desde los dos lados.
3. **`saldo_insuficiente` en `ArmarMesa` se cuenta con `sal.armar.nota.5x`**, no con su texto de error. Ahí sí se conocen las dos cifras, así que «Necesitas 2.500 HC para sentarte a 500» dice lo mismo y además dice cuánto falta. Es también lo que le da consumidor a esa clave de la lámina, que en la lámina estaba declarada y sin usar.

**Los nombres de clave no son los de la lámina.** Las láminas escriben `sal.titulo`, `sal.codigo.*`, `sal.mesa.*`; la ficha §6.2 manda cuatro sub-bloques y §5 declara que los nombres son contrato. El orden de autoridad de la ficha resuelve el empate sin inventar nada: **la ficha manda en los nombres, la lámina en los valores.**

---

## 5. Los tres defectos de geometría que aparecieron, y sus arreglos

Ninguno estaba en la lámina ni en la ficha. Los tres se arreglaron con **fórmula derivada**, no con cifras nuevas.

### 5.1 · El interlineado heredado — tres tarjetas desbordaban su propia ventanilla

`index.css:18` declara `font: 18px/145%`. Un `line-height` en **porcentaje** se computa contra el tamaño de su elemento y **se hereda como longitud fija**, no como razón: cada descendiente recibía 23,2px de interlineado (16px × 145% en móvil) midiera su letra lo que midiera. Para la línea 2 de una tarjeta, que va a 2,9u ≈ 10,4px, eso es más del doble de lo que le toca.

Las dos líneas sumaban 48,56px dentro de una tarjeta de 51,03 con 15,84 de relleno, y **las tres tarjetas desbordaban la ventanilla en los tres viewports de teléfono** — `desplaza: true` con sólo tres, que es exactamente la promesa que no se puede romper. Las láminas no lo veían: un documento suelto hereda el `normal` del navegador.

**Arreglo:** `line-height: 1.2` sobre `.sal` — una razón **sin unidad**, que es lo que se hereda como proporción y se recalcula en cada elemento. Los bloques que quieren más aire (`.sal-vacio` 1.45, `.sal-aviso` 1.4, `.sal-modo-d` 1.35) ya lo declaraban y siguen mandando.

### 5.2 · La tarjeta no tenía suelo, y el dedo se lo pedía

La fórmula de la lámina es `--tarjeta-h: 13.4u` a secas. En un teléfono `--u` toca su suelo de 3,2px, así que da 42,9px de tarjeta para un botón de 35,2 (`0.8 · --cta-h`, y `--cta-h` lleva el `max(44px, …)` del piso táctil) más 15,8 de relleno: **51 que no caben en 43**. En escritorio no pasa porque `13.4u` sobra.

La causa no es la tarjeta: es que el piso táctil de 44px no cabe en una fórmula que se escribió sin él.

**Arreglo:** el suelo se **deriva de lo que la tarjeta tiene que contener**, en vez de escribirse como cifra:

```css
--tarjeta-h: max(
  calc(var(--cta-h) * 0.8 + var(--u) * 4.4),
  calc(var(--u) * 13.4)
);
```

La fórmula de la lámina sigue mandando en cuanto hay sitio —al techo de `--u` gana `13.4u` = 80,4px— y el suelo sólo muerde donde el dedo lo obliga. Es el mismo trato que `--cta-h` ya tenía.

### 5.3 · El título salía casi negro — y el arnés lo daba por bueno

`index.css:69-74` pinta **todo** `h1` y `h2` con `color: var(--text-h)`, que en esquema claro es `#08060d`. `.sal-cab h1` declaraba tamaño, peso, espaciado y margen —todo lo que hacía falta pisar del andamiaje— pero **no color**, así que el título caía a ese negro sobre el verde abismo y era casi ilegible.

**Los seis puntos del arnés lo daban por verde**: el `h1` estaba en su sitio, del tamaño correcto y sin desbordar. Apareció mirando una captura.

**Arreglo:** `color: inherit`, y —más importante— **`sal.1` ahora mide el color del título** contra el de su propia pantalla, así que el fallo no puede volver en silencio. Es la lección barata de esta tanda: un arnés mide lo que se le enseñó a mirar, y hay que mirar las capturas.

---

## 6. Las pruebas del diccionario que hubo que recablear

`textos.test.js` se escribió cuando el diccionario era **sólo del lobby y sin una sola variable**. Cuatro de sus premisas dejaron de ser ciertas al entrar `sal.*`, y se actualizaron —no se relajaron—:

| Prueba | Antes | Ahora |
|---|---|---|
| «toda clave devuelve cadena no vacía» | `t(clave, {})` y no empieza por `⟦` | Lee los nombres de los huecos **del propio valor**, los rellena todos y exige **cero `⟦`**. Es más fuerte: caza un hueco mal escrito (`{ hc }`, `{HC}`) que el patrón no reconozca |
| «ninguna clave lleva espacios ni mayúsculas» | `^[a-z0-9]+(\.[a-z0-9]+)+$` | Admite guion bajo en el último segmento, **sólo** porque las nueve `sal.error.*` son el nombre exacto que lanza la migración y `claveDeError` las compone concatenando |
| «todas las claves viven bajo `lob.`» | prefijo único | Lista de prefijos declarados `['lob.', 'sal.']`. IDI-0 ya había escrito que el prefijo «permitirá que otra campaña añada `mesa.*`»: ésta es esa campaña |
| «las 18 del lobby resuelven sin vars» | todas las claves | Sólo las que **no llevan huecos**. Una clave con `{hc}` pedida sin vars devuelve `⟦hc⟧` **a propósito** |
| «no hay dos textos repetidos» | 1 excepción | **7**, todas declaradas una por una con su motivo en el propio test |

---

## 7. Verificación · §9.1 – §9.4

| # | Qué | Resultado |
|---|---|---|
| 9.1 | `git diff 12188af` sobre los cinco protegidos | **vacío** — `gameEngine.js`, `aiPlayer.js`, `seatLayouts.js`, `opponentPanel.css`, `gameTable.css` intactos |
| 9.2 | `npm test` | **597 / 597** en 24 archivos (línea base 565 → **+32**) |
| 9.3 | `npm run build` | **limpio**, 222 ms |
| 9.3 | `npx eslint .` | **21 problemas (20 + 1)** — la línea base exacta de SAL-Ae, ni uno más |
| 9.3 | `grep` sobre `dist/` | **sin resultado** para `salasFixtures`, `simulacionSalas`, `ESTADOS_SAL`, `?sal=` y los tres nombres de estado. Control: `sal.error.sala_llena` **sí** está |
| 9.4 | `diagSAL sal` | **54/54 celdas** · 9 estados × 6 viewports · consola limpia · cero `⟦` |
| 9.4 | `diagDSK lob` | **6/6 celdas** — el lobby no se movió |
| 10 | `git status` | los seis residuos conocidos + los archivos de esta sub-tanda |

Las pruebas nuevas cubren lo que §9.2 enumera: máscara del código (rechaza O/0/I/1, exige 4), orden de mesas, cálculo de «Te faltan», guarda de §4.4 y el mapa de errores completo (9 + desconocido).

### El arnés no corre donde §8.1 decía, y la causa está en §8.2

§8.1 pide `vite preview` (4173). **No puede**, y lo impide la propia ficha: §8.2 exige que `?sal=` lleve «la misma guarda que el bypass de auth», y esa guarda es `import.meta.env.DEV && VITE_AUTH_BYPASS`. `import.meta.env.DEV` es **false en cualquier build**, así que en `vite preview`:

- no hay bypass → la Portada pide correo y el arnés no llega ni al lobby;
- no hay fixtures → `?sal=` no significa nada, porque §9.3 exige (y este informe verifica) que el archivo entero desaparezca de `dist/`.

Las dos mitades de §8 no pueden cumplirse a la vez. **Manda §8.2**, que es la que protege producción. El arnés corre en el servidor de desarrollo con `VITE_AUTH_BYPASS=1` —exactamente donde corre `diagDSK lob`— y acepta `AJILEI_BASE` para apuntarlo a otro puerto.

### Otras dos desviaciones declaradas

**§5.4 · la guarda de precarga sí se tocó.** La primera frase dice «ni `SalaOpciones` ni `ArmarMesa` disparan precarga de mesa ni de baraja»; la última dice «la guarda que hoy exista se deja como está». Son incompatibles: la guarda decía `screen !== 'lobby'`, así que sin tocarla las tres pantallas nuevas habrían disparado **380 KiB de audio y 0,57 MB de baraja** al entrar a mirar quién está armando mesa — justo lo que PUE-1.2 y CAR-1 sacaron del arranque. Se cumple la primera frase: la condición pasa a ser una lista `SIN_PRECARGA`. **No se mueve el sitio ni el momento**, que es lo que la última frase reserva para B2.

**§2 · `src/config/salas.js` figuraba como «no se toca»**, pero §4.4 manda expresamente que el nombre de la clave de `localStorage` viva ahí. Se añadió **una sola constante** al final, `CLAVE_CONFIG_SALA`; ninguna línea anterior cambió. La lógica vive en `salaRecordada.js` y las guardas en `salasCore.js`.

---

## 8. Lo que queda para B2, y lo que B2 debe respetar

### De `salas.css`
- **Los §1–§11 son de las dos pantallas selladas.** B2 añade al final; no reescribe.
- **`--tarjeta-h` lleva suelo derivado** (§5.2). Si B2 devuelve el cronómetro a la tarjeta, la línea 2 crecerá y ese suelo hay que recalcularlo con la misma forma —derivando, no escribiendo un número.
- **`line-height: 1.2` sobre `.sal` es estructural** (§5.1), no cosmético. Quitarlo devuelve el desbordamiento de las tres tarjetas.
- **El §12 (stub) es descartable**: B2 puede reemplazarlo entero con la pantalla de la lámina SAL-3.
- **La barra superior está duplicada en CSS** bajo `.sal` (marcado no, CSS sí), porque `lobby.css` la acota toda a `.lobby` y esta tanda era de CSS aditivo estricto. Si una tanda futura muda la barra a su propia hoja, esos dos bloques se funden y ése es el día de pagar la deuda.

### De comportamiento
- **El cronómetro de la tarjeta** (contradicción 1): `salas_abiertas()` ya devuelve `expira_en`, `normalizarMesa` ya lo conserva como `expiraEn` y `useReloj` ya sabe restar. **Lo que falta es el latido, no el dato.** La clave `sal.opciones.mesa.estado` recupera su `{t}`.
- **La suscripción del listado**: §3.3 dejó a B2 decidir si «Mesas formándose ahora» se suscribe. `salasApi.suscribirAbiertas` existe y ya está sin filtro por la razón correcta.
- **`jugar_ya`** y la pantalla «Partida PvP · Próximamente».
- **Compartir por `navigator.share`**.
- **Pruebas C y D de la migración** (el barrido).

---

## 9. Requiere autorización

**1 · El nombre del anfitrión en la sala de espera.** §7 pide la cabecera «Anfitrión: nombre · …». `mi_sala()` devuelve `anfitrion_id`, un uuid, y **ninguna de las trece funciones de SAL-A lo traduce a un username**; `profiles` tampoco es legible para un tercero por RLS. Antes que inventar una consulta o pintar un uuid, el invitado lee **«Estás en la mesa · Privada»**, que es cierto y útil. Resolverlo pide una función nueva en la base —algo como `perfil_publico(uuid)`, o añadir el username al retorno de `mi_sala()`— y eso es SQL, que la regla 3 prohíbe a esta sub-tanda.

**2 · Una mesa abierta llena sigue apareciendo en el listado.** `unirse_sala` no cambia el estado al llenarse la última silla: la sala se queda `esperando` hasta que el barrido la arranca a los tres minutos. Así que `salas_abiertas()` puede devolver una mesa 4/4, la tarjeta la enseña y «Unirme» devuelve `sala_llena` con su texto. **Es honesto y se explica solo**, pero es un toque perdido. Ocultarla en cliente sería inventar una regla que la base no tiene; arreglarla de verdad es decidir si una mesa llena debe arrancar sola — y eso es diseño de producto, no de pantalla.

**3 · La fila `sal.armar.nota.5x` de la lámina no tiene consumidor natural.** Los chips fuera de alcance están apagados, así que la apuesta seleccionada siempre alcanza y esa nota no puede salir por elección del jugador. Se le dio consumidor real como respuesta a `saldo_insuficiente` del servidor (§4.3), que es el único camino por el que hoy puede aparecer.

---

## 10. Nota de operación

Con `VITE_AUTH_BYPASS=1` y **sin** `?sal=`, el botón «Jugar contra jugador» lleva a `SalaOpciones` de verdad y la pantalla llama a Supabase con el uuid ficticio de `PERFIL_DEV`, que no existe en la base. El listado sale vacío y `salasApi` escribe un aviso en consola — **es la conducta correcta**: la base rechazó de verdad, y SAL-A ya lo dejó anotado («el modo del arnés que mida contra Supabase NO puede correr con bypass»). Para ver las pantallas con datos, `?sal=<estado>`; para verlas contra la base, sesión real.

---

## 11. STOP

Sin commits y sin push. Quedan por hacer, y son de Victor:

- **§9.5** · las pruebas con dos sesiones reales: **A** (el índice muerde: dos anfitriones, misma combinación abierta, el segundo ve «Unirme a esa mesa»), **B** (el sexto código falso en un minuto devuelve el error de límite), invitado por código privado y por enlace `?sala=` sin cuenta previa, y el anfitrión cancelando desde el stub.
- **§9.6** · la validación en los tres dispositivos: monitor 1920×1080, S25 vertical y horizontal, iPhone de la familia (WebKit).

Sólo después del visto bueno se autorizan los commits, en otra ficha.
