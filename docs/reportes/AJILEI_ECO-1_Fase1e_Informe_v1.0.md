# AJILEI · ECO-1 · Fase 1e — Informe: higiene del arnés de ECO-1 · v1.0

**Ficha:** `AJILEI_ECO-1_Fase1e_v1.0.md`, con A-1 = SÍ y el plan del STOP-1 aprobado (respuestas 1 a 5 y precisiones a a d) · **Base:** `main` en `f1ea8d0` · **Fecha:** 2026-10-10
**Ejecutor:** Claude Code · **Rector:** Claude (chat) · **Decisor:** Victor
**Estado:** STOP-2 aprobado, con las respuestas del rector a la §12 (P-1 a P-5 y H-5). Antes de la ceremonia de commit.

---

## 0. Resumen

- **No se tocó producto, ni migraciones, ni la base.** `git diff --stat main -- src/ supabase/migrations/` está vacío (§9). Por eso no hay validación en el teléfono.
- **`mesaia.3` mide ahora el cobro** (E1). Antes entraba con `?cel`: el cobro era la entrada y el saldo volvía a la cifra de partida. Ahora gana una mano y recarga antes de la victoria: 3.700 − 500 − 500 + 1.050 = **3.750**, que no coincide con ninguna otra cifra del recorrido (§2).
- **`mesaia.8` ya teñía; solo mentía su etiqueta** (E2). Corregida. Va a INV-48. `mesaia.9` tiene fila nueva, **INV-53** (§3).
- **`ventana60` vigila y tiñe** (E3): más de la mitad de un tope en 60 s es rojo. Con el recorrido actual, ninguna función pasa de la mitad (§4).
- **`lob` mide el peor nombre** (E6): punto nuevo `lob.8` y cuatro celdas con 15 «W». El nombre lo contesta el Supabase falso del arnés; ningún mando en la app (§5).
- **El corredor de guiones existe** (A-1): `npm run guiones`. Aplica las 8 migraciones en un Postgres en memoria y corre los guiones de la 1a (21/21) y la 1d (23/23), con y sin su transacción, sin rastro, en poco más de un segundo (§7).
- **El registro dice la verdad sobre lo que no se mide** (E4, E5, E7, E9, E10 y el tercer hueco): tres huecos declarados, el guion de la 1c retirado y la lista de varas escrita en una §6 nueva, que `testInvariantes` también lee (§6).
- **Varas en verde** (§8): vitest 1.499 (antes 1.473), lint 21, build correcto, `diagSAL` 102/102, `humo`, `lob` 10/10, `saldo`, `mesaia` 10/10 más `ventana60`, `revive`, `constancia` 7/7, `celebracion` y `npm run guiones`.
- **Los consumidores de `contextoCap`** (respuesta 4): además de `msg` y `diagPUE cap` lo usan `diagPUE mesa` y `diagPUE voz2`; corrí los cuatro. `msg`, `mesa` y `voz2` salen verdes. **`diagPUE cap` trae un rojo, `cap.regresion v`, que ya estaba en `HEAD`** (§11, H-1).
- **Controles rojos, en una copia** (§10): los cuatro salen rojos por su razón.
- **Dos hallazgos que no son de la 1e y no se arreglaron aquí** (§11): `cap.regresion v` está en rojo en `HEAD`, y `celebracion` no ve el defecto que `mesaia.3` sí ve (medido).
- **iOS: nada que validar** (INV-41): no cambia nada que llegue a un navegador.

---

## 1. Lo hecho

### 1.1 Archivos nuevos

| Archivo | Qué es |
|---|---|
| `scripts/guiones.mjs` | El corredor de A-1 (`npm run guiones`) |
| `scripts/eco/guionesCore.mjs` | Lo puro del corredor: la lista de guiones vigentes y retirados, las cuentas previas, el veredicto de una tabla y la comparación de fotos del banco |
| `scripts/eco/guionesCore.test.js` | 18 pruebas de lo anterior, sin cargar PGlite |
| `docs/reportes/AJILEI_ECO-1_Fase1e_Informe_v1.0.md` | Este informe |

### 1.2 Archivos cambiados

| Archivo | Cambio |
|---|---|
| `scripts/eco/mesaia.mjs` | `mesaia.3` nuevo (E1); etiqueta de `mesaia.8` y `mesaia.9` (E2); `ventana60` tiñe (E3); nota del solape con `saldo.2` (E4) |
| `scripts/cap/capMesa.mjs` | `contextoCap` acepta `perfil`, un objeto vivo. Sin él contesta `PERFIL_CAP`, como siempre (E6) |
| `scripts/diagDSK.mjs` | `lob.8` y las cuatro celdas del nombre (E6); nota del solape en `saldo.2` (E4) |
| `scripts/testInvariantes.test.js` | Lee la tercera tabla, la de las varas (§6 del registro): 4 pruebas |
| `scripts/testDistSinMoldes.test.js` | Tres huellas prohibidas más: `@electric-sql`, `pglite` y `PGlite` |
| `docs/AJILEI_Invariantes_v1.0.md` | INV-46 a INV-51, INV-53 nueva, el recuento, §3, §4, §5 y §6 nueva |
| `supabase/pruebas/eco1c_verificacion.sql` | 11 líneas de comentario en la cabecera: retirado (E10). Ninguna línea de lógica |
| `package.json` | `@electric-sql/pglite` `0.5.8` en `devDependencies` y la línea `"guiones"` en `scripts` |
| `package-lock.json` | Las 8 líneas del paquete, marcado `dev` |

**Una precisión sobre `package.json`.** La ficha (§4) dice que cambia «solo en `devDependencies`». Cambia también una línea de `scripts`: es el nombre del comando que la propia ficha pide en §2. Lo señalo para que el rector lo vea.

---

## 2. `mesaia.3` mide el cobro (E1)

**Por qué no lo medía.** Con `?cel` los rivales nacen sin fichas y la mesa acaba sin jugar una mano. El cobro es la entrada, el saldo vuelve a 5.000 y el punto exigía «Saldo actual = 5.000». Habría pasado igual si la celebración pintara el saldo de antes de sentarse.

**Cómo queda.** Usa la receta de `revive`, que ya existía: `?apu=saldo:3700,allinIA,gana`, mesa de 2, Básico, apuesta de 50 y entrada al piso. Ningún mando nuevo.

| Momento | Billetera | Pila en la mesa |
|---|---|---|
| Antes de sentarse | 3.700 | — |
| Sentado (entrada 500) | 3.200 | 500 |
| Gana la primera mano (el ante de la IA en all-in) | 3.200 | 550 |
| Recarga voluntaria (piso, 500) | 2.700 | 1.050 |
| «Siguiente mano» → victoria; cobro 1.050 | **3.750** | — |

Lo medido en la corrida coincide con la cuenta en papel del plan, cifra por cifra. El libro del banco: `entrada_ia −500`, `recarga_ia −500`, `salida_ia 1.050`.

**Qué exige el punto:**
- el libro tiene una entrada, una recarga y una salida;
- la entrada es la de la ruta, y el saldo de sentado y el de tras recargar cuadran con el libro;
- el cobro es la pila leída en la mesa (550 más la recarga);
- «Saldo actual», el saldo del banco y la píldora al salir dicen los tres **saldo inicial − entrada − recargas + cobro**;
- ese esperado no coincide con ninguna otra cifra del recorrido: 3.700, 3.200, 2.700, 550, 1.050, 500 ni los 5.000 del arnés. Si coincidiera, el punto sale rojo: una vara que no puede distinguirlas no mide.

**Si la recarga no se ofrece** (precisión a): la identidad se juzga igual con recargas = 0, y el punto lo declara sin cobertura, con código 1. No se dio en ninguna corrida.

---

## 3. `mesaia.8` y `mesaia.9` (E2)

- **`mesaia.8` ya teñía.** Su `ok` entraba en el veredicto desde la 1c. Lo único falso era la palabra «informativo», en la cabecera y en el JSON. Las dos se corrigieron.
  - Etiqueta nueva: «REGLA SELLADA (P-4 de la 1c, INV-48): una partida que se juega nunca calla N = 10 min, el silencio tras el que otro dispositivo la recoge. Vigila y tiñe».
  - Medido: 15 avisos en 5 manos; el hueco mayor, 43,9 s; la mediana, 12,6 s. El tope es 600 s.
  - Invariante: **INV-48, la existente.** Se añadió el «8» a su vigilante y media frase a su regla.
- **`mesaia.9` tiene fila nueva: INV-53**, «la salida espera a la recarga en vuelo».
  - Fuente (precisión b): el informe de la 1c (P-2a y P-2b) y `src/hooks/mesaIACore.js`.
  - La fila dice que la regla aún no está en las Reglas y que entra en la v1.3, con la 1g.

---

## 4. `ventana60` vigila y tiñe (E3)

Más de la mitad del tope en cualquier ventana de 60 s de un mismo contexto es rojo. La tabla sale en la consola y en el JSON de cada corrida.

| Función | Máximo en 60 s | Tope | Rojo desde | ¿Rojo? |
|---|---|---|---|---|
| `sentarse_ia` | 1 | 10 | 6 | no |
| `recargar_ia` | 3 | 20 | 11 | no |
| `salir_ia` | 1 | 30 | 16 | no |
| `recoger_mesa_ia` | 2 | 10 | 6 | no |
| `marcar_ingreso` | 2 | 6 | 4 | no |
| `informar_pila` | 7 | sin tope | — | solo se reporta |

- Son las mismas cifras de la 1d: el `mesaia.3` nuevo no las movió.
- La ventana cuenta ahora también el banco del bypass de `mesaia.3`, que antes quedaba fuera.
- La más justa es `marcar_ingreso`: dos arranques por contexto en 4a y 4b, de tres permitidos.

---

## 5. `lob.8`: el peor nombre posible (E6)

**Cómo se inyecta.** `contextoCap` acepta un `perfil` vivo. El modo lo crea con el nombre estrecho, mide, cambia el nombre y recarga la página. La app no sabe nada.

**Las cuatro celdas nuevas:** 360×640, 390×844, 412×915 y 640×360. Cada una corre los puntos 1 a 7 con el nombre ancho, más `lob.8`. Las seis celdas de siempre no cambian y también llevan `lob.8`, sin la comparación.

**Qué exige `lob.8`:**
- nada desborda: ni la barra, ni el lobby, ni la página;
- el engranaje queda dentro de la barra y el nombre no pisa la píldora;
- entre `iiiiii` y `WWWWWWWWWWWWWWW`, la barra y el engranaje no se mueven (±0,5 px);
- la píldora, la ficha y el engranaje conservan su ancho;
- el nombre estrecho no se recorta, y el ancho lleva el «…» puesto.

**Lo medido** (el engranaje no se mueve en ninguna: diferencia 0,00 px):

| Celda | Ancho del nombre estrecho | Ancho del nombre de 15 | ¿Cede con «…»? |
|---|---|---|---|
| 360×640 | 21,1 px | 76,6 px | sí |
| 390×844 | 22,9 px | 83,2 px | sí |
| 412×915 | 24,1 px | 88,1 px | sí |
| 640×360 | 21,1 px | 189,7 px | no: cabe entero |

`lob.3b` y `lob.6` salen verdes en las cuatro con el nombre ancho.

**Un ajuste respecto al plan.** El plan decía «el nombre cede con "…"» en las cuatro. A 640×360 los 15 «W» caben enteros, así que no hay nada que ceder: es lo que la 1d decidió («solo cuando no cabe»). El punto exige el «…» donde el nombre no cabe, y el modo declara sin cobertura la corrida en la que no cediera en ninguna celda.

---

## 6. El registro (E2, E4, E5, E7, E8, E9, E10)

Filas tocadas de `docs/AJILEI_Invariantes_v1.0.md`:

| Fila | Cambio |
|---|---|
| INV-46 | El solape de `saldo.2` y `mesaia.1`, con su razón (E4). Hueco declarado: la cifra en `PartidaPvP`, dueño MES-PvP (E5a). Pasa a «vigilado (parcial)» |
| INV-47 | El guion de la 1c, retirado: sus pruebas 4 a 7 las vigilan `bancoImitado.test.js` y `mesaia` |
| INV-48 | `mesaia` 8 en su vigilante y la regla de los 10 min (E2). El guion de la 1c, retirado: sus pruebas 9 a 13 |
| INV-49 | El vigilante SQL pasa al guion de la 1d (22 y 23). `mesaia` 3 mide la identidad entera; `celebracion` mide la coherencia de la tarjeta |
| INV-50 | Hueco declarado: dos dispositivos a la vez, cubierto por diseño y nunca ejecutado en paralelo (E5b) |
| INV-51 | `ventana60` entra como vigilante: la guardia del margen de K7 (E3) |
| INV-53 | Nueva: la salida espera a la recarga en vuelo (E2) |
| Recuento | 53 filas; 46 vigiladas; 11 parciales |
| §3 | Qué modos comparten puerto y que no pueden ir a la vez sin `--puerto` (E7) |
| §4 | `celebracion` y el corredor entran en la fila de las Reglas v1.2 (E9) |
| §6 (nueva) | La lista de varas de ECO-1 (E8) y lo que los guiones no pueden medir |

**La §6 nueva** lleva la tabla de varas (modo o comando, qué vigila, puerto, duración y si entra en `humo`) y cuatro notas:
- el corredor no es la base real: PGlite trae Postgres 18.3 y Supabase tiene 17.6.1. Es otra versión mayor, conocida. Hoy ninguna prueba pasa en uno y falla en el otro;
- una sola conexión: lo que depende de dos dispositivos a la vez no se ejecuta;
- el guion de la 1c está retirado, y es candidato para la ficha de la 1g: adaptarlo para que «pase un minuto» como el de la 1d;
- la lista de guiones es un contrato: un archivo sin declarar pone rojo vitest y saca al corredor con código 2.

**`testInvariantes` lee la tabla de varas** (respuesta 5). Cuatro pruebas:
- la tabla tiene filas completas;
- cada vara nombra algo que existe;
- están las de ECO-1 y el corredor;
- la columna «En humo» dice lo mismo que `diagDSK.mjs`.

No se construyó ningún orquestador (E11).

---

## 7. El corredor de guiones (A-1)

**Comando:** `npm run guiones`. Fuera de vitest.

**Qué hace, en un banco nuevo en memoria:**
1. levanta lo mínimo de Supabase: los tres roles, `auth.users`, `auth.uid()`, los privilegios por defecto, la publicación de Realtime y el disparador que activa RLS;
2. aplica las 8 migraciones en orden, y siembra cuatro cuentas justo antes de la del libro;
3. corre los guiones de la 1a y la 1d y exige sus filas exactas, todas en PASA;
4. los corre otra vez sin `begin/rollback`;
5. compara el contenido de todas las tablas de `public` y `auth` antes y después de cada pasada;
6. sale con 0, 1 o 2.

**La corrida:**

```
PGlite 0.5.8 · PostgreSQL 18.3 (PGlite 0.5.8)
Supabase: Postgres 17.6.1 (proyecto enlazado: 17.6.1.166)
✓ las 8 migraciones
✓ eco1a_verificacion.sql con begin/rollback — 21/21 PASA · sin rastro
✓ eco1a_verificacion.sql sin begin/rollback — 21/21 PASA · sin rastro
✓ eco1d_verificacion.sql con begin/rollback — 23/23 PASA · sin rastro
✓ eco1d_verificacion.sql sin begin/rollback — 23/23 PASA · sin rastro
· eco1c_verificacion.sql — RETIRADO desde ECO-1d
VERDE · 1,3 s → código 0
```

**Tres cosas que conviene saber:**
- **Las cuatro cuentas previas.** Las pruebas 1 y 2 del guion de la 1a cuentan exactamente 4 cuentas de antes de ECO-1. El corredor las siembra entre `sal_b2` y `eco1a_libro`, con correos de `example.com`. Era el riesgo principal del plan: el guion de la 1a nunca se había corrido sobre el esquema posterior a la 1c y la 1d. **Pasa entero, 21/21.**
- **Los códigos.** Una migración que no aplica, un guion que revienta, una fila que no dice PASA, filas de más o de menos, o rastro: código 1. PGlite ausente, el andamio caído o un guion sin declarar: código 2.
- **La dependencia.** `@electric-sql/pglite` `0.5.8`, fijada, solo en `devDependencies`, sin dependencias propias. No aparece en la build: la guardia de `dist/` lo comprueba con tres huellas nuevas, y otra prueba comprueba que nada en `src/` la importa.

**Lo que no es:** no sustituye la corrida en el SQL Editor, que sigue sellando cada migración.

---

## 8. Varas

Sobre el código definitivo. Un solo build en la tanda; el resto, con `--sin-build`.

| Vara | Resultado | Duración |
|---|---|---|
| vitest | **1.499** en verde, 62 archivos (línea base 1.473): +18 del corredor, +3 de la guardia de `dist/`, +5 del registro | 4 s |
| lint | **21** (20 errores y 1 aviso), la línea base | 7 s |
| build | correcto | dentro de `lob` |
| `diagSAL sal` | **102/102** | 1 min 42 s |
| `humo` | verde (`gate`, `lob` 10/10, `retar`, aislamiento) | 3 min 21 s |
| `lob` | **verde, 10/10 celdas** (las 6 de siempre y las 4 del nombre) | 26 s |
| `saldo` | verde, 6/6 y consola | 14 s |
| `mesaia` | **verde, 10/10**, consola y `ventana60` | 6 min 43 s |
| `revive` | verde | 19 s |
| `constancia` | **verde, 7/7** y consola | 1 min 2 s |
| `celebracion` | 0 fallos, 0 conocidos, control verde | 7 min 52 s |
| `msg` (consumidor de `contextoCap`) | verde: semillas 1–15, compositor 92 casos, jugado 7/7 | 18 min 48 s |
| `diagPUE cap` (consumidor de `contextoCap`) | 30 de 31 mediciones en verde. **`cap.regresion v` en rojo, igual que en `HEAD` sin mis cambios** (§11, H-1) | 2 min 36 s |
| `diagPUE mesa` (consumidor de `contextoCap`) | verde, 3 mediciones | 43 s |
| `diagPUE voz2` (consumidor de `contextoCap`) | verde, 222 mediciones | 8 min 44 s |
| `npm run guiones` | **verde**: 8 migraciones, 21/21 y 23/23, sin rastro | 1,3 s |
| Guardia sobre `dist/` | verde (17/17), sin PGlite | dentro de vitest |
| Registro de invariantes | verde, con INV-53 y la tabla de varas | dentro de vitest |
| Protegidos | verde: ninguno abierto | dentro de vitest |
| `rec` | no se corrió: nada de lo tocado lo usa | — |

**Guardia de diff:** en verde (§9).

---

## 9. La guardia de diff

- `git diff --stat main -- src/ supabase/migrations/`: **vacío.**
- Fuera de `scripts/` y `docs/` cambian tres archivos, los tres previstos:
  - `supabase/pruebas/eco1c_verificacion.sql`: 11 líneas añadidas, todas de comentario;
  - `package.json`: la dependencia en `devDependencies` y la línea `"guiones"` en `scripts` (§1.2);
  - `package-lock.json`: 8 líneas, el paquete marcado `dev`.
- `docs/reportes/AJILEI_iOS_Sesion1_Lista_v1.0.md` no se tocó.
- Todo en LF (`git ls-files --eol`).

---

## 10. Controles rojos (en una copia)

En `scratchpad\eco1e\copiaRojo`: `git archive HEAD` más lo cambiado en la tanda, con una unión a `node_modules` y caché de vite propia. Ningún defecto se puso en el árbol principal.

| Vara | Defecto puesto en la copia | Resultado |
|---|---|---|
| Corredor | La clave de la constancia deja de ser por jugador y día (se le añade un uuid al azar) | **código 1.** Caen las pruebas 4, 5 y 23 del guion de la 1d: «constancias=2», «días con dos constancias=1» |
| Corredor | El guion de la 1d deja de deshacerse solo | **código 1.** Con `begin/rollback`, sin rastro; sin él, «DEJA RASTRO» en diez tablas |
| `mesaia.3` | En `GameTable`, la celebración cuenta el saldo sin lo ganado en la mesa (el de antes de sentarse) | **rojo solo `mesaia.3`.** «Saldo actual» dice 3.700 y se esperaban 3.750; el banco y la píldora, 3.750. Los otros nueve puntos, en verde |
| `ventana60` | El recorrido de 4a recarga la página tres veces más: cinco arranques en un minuto | **rojo `ventana60`**, por `marcar_ingreso`: 5 de 6. `recoger_mesa_ia` llega a 5 de 10, la mitad justa, y no tiñe |
| `lob.8` | `constancia.css` sin las tres reglas de la 1d (la barra que mide su hueco y el nombre que cede) | **rojo `lob.8` en las cuatro celdas del nombre.** En vertical el lobby desborda 113, 122 y 129 px, el engranaje se mueve lo mismo y sale de la pantalla, y caen `lob.3`, `lob.3b` y `lob.6`. A 640×360 no desborda, y cae porque el nombre ya no lleva el «…» |

Un tercer control del corredor: con el guion de la 1c quitado de la lista de retirados, sale con **código 2** («guiones sin declarar»).

Los defectos del corredor se restauraron con `cmp` contra el repo. `mesaia` y `lob` corrieron en la copia en los puertos 4183 y 5183. El par verde de cada control es la corrida del árbol principal (§8).

**Lo que enseñan dos de ellos:**
- **El defecto de `mesaia.3` es justo el que la vara vieja no veía.** Con `?cel` las fichas son la entrada, así que «el saldo sin lo ganado» es el saldo real y la cifra no cambia. No corrí la vara vieja contra el defecto: lo afirmo por la cuenta, no por una medida.
- **El de `lob` enseña de qué dependía la vara vieja.** Con el defecto puesto, las seis celdas de siempre solo lo cazan a 360×640, por 2 px y por `lob.6`, gracias a que el nombre del arnés tiene 11 caracteres. Las cuatro celdas nuevas lo cazan por más de 110 px.

---

## 11. Hallazgos

- **H-1 · `diagPUE cap` tiene un rojo en `HEAD`: `cap.regresion v`.**
  - La foto vertical de la mesa (360×704 a 3×) ya no casa con su maestra, `maestras/portada/mesav.png`: 99,309 % de los píxeles dentro de Δ ≤ 2, Δ máximo 212 y 15.867 px distintos. Las otras 30 mediciones salen verdes; la horizontal casa con su maestra.
  - **No es de la 1e.** En una copia limpia de `HEAD` (`git archive`, sin mis cambios) sale el mismo rojo con las mismas tres cifras. Es también la prueba de que la opción `perfil` no cambió nada para `cap`.
  - La maestra se selló en CAP-1b (`59ad115`). Desde entonces tocaron la mesa PAN-1b, PAN-1c, ECO-1c y ECO-1d. **No sé cuál la movió ni si el cambio es querido:** no lo investigué, porque no es de esta ficha. `cap` no está en la lista de varas de ninguna de esas campañas.
  - No toqué la maestra ni el producto.
- **H-2 · `celebracion` no ve el defecto que `mesaia.3` sí ve. Medido.**
  - En la copia, con la celebración contando el saldo sin lo ganado en la mesa, `diagCEL0 celebracion` sale verde, con 0 fallos.
  - Su molde `?cel` no gana fichas, así que exige 5.000, el saldo inicial. Es el mismo punto ciego que tenía `mesaia.3`.
  - Queda declarado en INV-49 y en la §6 del registro, como aprobó el rector. No toqué `diagCEL0`.
- **H-3 · El guion de la 1a pasa entero sobre el esquema de hoy** (21/21). El riesgo principal del plan no se dio.
- **H-4 · A 640×360 el nombre de 15 cabe entero** y no cede (§5).
- **H-5 · `npm install` avisó de 9 paquetes con avisos de `npm audit`.** Ninguno es PGlite, que no tiene dependencias: son `vite`, `vitest`, `postcss` y otros seis que ya estaban. No toqué nada más.
  - **Respuesta del rector: anotados para ARN-4.**

---

## 12. Preguntas al rector, y sus respuestas

- **P-1 · `cap.regresion v` (H-1).** ¿Quién lo recoge? Hay dos salidas: re-sellar la maestra si el cambio de la mesa es querido, o buscar qué commit la movió. No es de ECO-1; lo natural es DIS-1 o ARN-4. Mientras tanto, `diagPUE cap` sale con código 1.
  - **Respuesta: no se arregla en la 1e. Queda pendiente, con dueño: el rector.** Tras el push de la 1e manda un diagnóstico corto, de solo lectura: qué commit movió la foto vertical, y la imagen de la diferencia.
- **P-2 · La línea `"guiones"` en `scripts` de `package.json`.** La ficha (§4) dice «solo en `devDependencies`» y la §2 pide un comando con nombre. Entiendo que la segunda manda. ¿Vale?
  - **Respuesta: vale.** Manda la §2 de la ficha.
- **P-3 · `lob.8` a 640×360.** El nombre de 15 cabe y no cede. El punto exige el «…» solo donde no cabe. ¿Vale así?
  - **Respuesta: vale así.** El «…», solo donde el nombre no cabe.
- **P-4 · `celebracion` (H-2).** ¿Se le da en una ficha futura una celda en la que el cobro no sea la entrada? Hoy el cobro solo lo mide `mesaia.3`.
  - **Respuesta: sí.** Es candidato para la ficha de la 1g, junto con el guion de la 1c e INV-53 en las Reglas v1.3.
- **P-5 · Las Reglas v1.2.** No creo que ninguna línea deba cambiar en la 1e. Para la 1g quedan anotados dos candidatos: INV-53 entra en la v1.3, y el guion de la 1c se adapta para que «pase un minuto».
  - **Respuesta: de acuerdo.** Las Reglas v1.2 no cambian.

**Los tres candidatos para la ficha de la 1g:** una celda de `celebracion` con un cobro que no sea la entrada (P-4), el guion de la 1c adaptado para volver a ser vigente, e INV-53 en las Reglas v1.3.

---

## 13. Cierre de terreno

- **Puertos del arnés** (4173, 4183, 4193, 5173, 5174 y 5183): ninguno escucha.
- **Procesos node:** ninguno vivo.
- **Uniones a `node_modules`:** las dos copias tuvieron una y las dos se quitaron con `cmd /c rmdir`. El `node_modules` del repo está entero.
- **Protegidos:** ninguno abierto; `scripts/testProtegidos.test.js` en verde.
- **git status:**
  - lo de esta tanda (§1), todo sin añadir;
  - los residuos de MOT-1 y `laminas/mon1/`, sin tocar;
  - `docs/reportes/AJILEI_iOS_Sesion1_Lista_v1.0.md`, sin tocar.
  - `capturas-lob/`, `capturas-mesaia/` y las demás carpetas de capturas están ignoradas.
- **Para borrar (Victor):** en el scratchpad de la sesión, la carpeta `eco1e` entera: las copias `copiaRojo` y `copiaHead` (ya sin uniones), los registros de las varas y los parches. `copiaRojo` conserva tres defectos puestos a propósito (`GameTable.jsx`, `constancia.css` y `mesaia.mjs`): no es una copia fiel.
- **Un permiso denegado.** Un comando que borraba un archivo dentro de la copia fue rechazado. Hice ese control de otra forma, sin borrar nada (§10, el tercero del corredor).

---

## 14. El tope

**Dentro del tope, con margen.** Del plan aprobado al STOP-2 pasaron 1 h 13 min de reloj (de 15:09 a 16:22), con las varas y los controles en segundo plano. El STOP-1 no lo cronometré: calculo entre 20 y 25 min. En total, en torno a 1 h 35 min, frente a un tope de 3 h 15 min.

Los controles rojos no se recortaron: se hicieron los cuatro de la ficha, dos más del corredor y la medida de `celebracion` con el defecto puesto.
