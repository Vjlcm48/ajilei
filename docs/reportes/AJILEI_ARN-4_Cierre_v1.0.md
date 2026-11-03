# AJILEI · ARN-4 · Informe de cierre de la campaña · v1.0

**Para:** Victor y el rector · **De:** Claude Code · **Fecha:** 2026-11-03
**Sonda:** `AJILEI_ARN-4_Fase0_Informe_v1.0.md` · **Base de la campaña:** `main` en `a32ec2f`
**Estado:** cerrada con la tanda 4c. Ningún protegido abierto en toda la campaña.

---

## En cinco líneas

- **Probar ya no depende de recetas a mano:** `npm test`, `npm run aislado` y `npm run varas` sustituyen a los worktrees y a las corridas sueltas.
- **Las varas dejaron de depender de la suerte:** `apu` y `u3` van sembradas, y una foto roja se repite antes de ser rojo.
- **eslint está en cero** y cualquier problema nuevo es rojo.
- **El jugador ve tres cosas:** el código pegado entra entero, la Portada se lee mejor y el rebote ya no enseña blanco.
- **La base real tiene un cambio:** `profiles` se lee por columnas.

## Qué entró en cada tanda

| Tanda | Qué entró | Último commit |
|---|---|---|
| **Fase 0** | La sonda: inventario, cifras y reparto. Sin commits propios; su informe entró con la 4-0 | — |
| **4-0** | **B7** (el código pegado entra entero, con la puerta 2.4e e INV-80) · **C1** (CLI de Supabase a 2.122.1) · **D-3** (la unión viva, soltada) | `0364a5e` |
| **4a** | **A1** (vitest a prueba de la unidad en minúscula) · **A2 + A3 + A11** (commits aislados y limpieza segura) · **A4** (el orquestador de varas) · **A7** (lecturas con `\r?\n`) · **D-5** (vitest sin build previo) | `afd40a3` |
| **4b** | **A6** y **C5** (azar sembrado) · **A5** corta (repetir una foto roja) · **A10a** (`pue.contraste`, solo medir) | `4b8a911` |
| **4c** | **B1** · **B2** · **B3b** · **B3d** · **C6** · **B8** · la Portada a 4,5 · **B6** · **B9** y **D-2** · **C2** | Ver la validación |

## Qué salió a otras campañas, o se cerró

| ID | Qué | A dónde |
|---|---|---|
| **C3 y C4** | Los límites literales de `consultar_mano` y `comprar_articulo` | Primera migración de MOT-1 |
| **B3a** | `state.winner` en `mesaIACore.js` y `manoCore.js` | MOT-1 |
| **B1 (c)** | Reescribir los 7 efectos de la mesa, hoy silenciados | MOT-1 |
| **D-4** | `supabase/functions/sonda_mot1/`: saber si sigue desplegada | MOT-1 |
| **B3c** | La carga diferida de Rankings y del video | Campaña de peso |
| **B4a y B4b** | `SalaOpciones` y el parche de la 1b | MES-PvP |
| **v3 del CLI** | Decisión aparte | Después de MOT-1 |
| **B5, A9b y A10b** | Sin nada que hacer | Cerrados |

**Sin dueño, para que el rector decida:**
- **A9a:** ninguna ficha lo recogió. Los botones de la victoria ya se miden con escala real, pero la tarjeta «Ver tu nuevo ranking» sigue sin medirse con f ≠ 1 (M-10 de RNK-1 1d).
- **D-1:** los `.mjs` del arnés pasan por eslint sin reglas, y quedó medido en la 4a. Nadie ha decidido si entran con reglas.
- **iOS:** el color de la Portada y el rebote de B6 se miraron solo en el S25.

## Duraciones reales

Desde el mensaje que abrió cada tanda hasta su entrega o su push, con la máquina y las esperas de Victor dentro.

| Tanda | De → a | Duración |
|---|---|---|
| Fase 0 | 04:49 → ~05:08 | ~20 min |
| 4-0 | 05:25 → ~05:38 | ~13 min |
| 4a | 05:43 → ~06:22 | ~39 min |
| 4b | 06:33 → 08:10 | 97 min |
| 4c | 08:24 → ~09:40 | ~75 min |
| **Trabajo** | | **~4 h 05 min** |
| **Campaña entera, con las pausas** | 04:49 → ~09:40 | **~4 h 50 min** |

La Fase 0 había estimado unos 490 min de Claude Code, más unas 4 h de máquina y unos 35 min de Victor. Lo real quedó en la mitad, con la máquina y Victor ya dentro.

## Las herramientas nuevas

| Orden o pieza | Para qué | Cuánto tarda |
|---|---|---|
| `npm test` | Vitest por su lanzador, a prueba de la unidad en minúscula | Unos 7 s |
| `npm run aislado -- <sha>… --perfil=rapido` | Probar cada commit en su copia, con limpieza segura | Unos 15 s por SHA |
| `npm run varas -- rapido` | eslint, vitest, build y guiones | Unos 16 s |
| `npm run varas -- commit` | Lo anterior más `humo` | Unos 13 min |
| `npm run varas -- --solo cfg,lob` | Varas o modos sueltos | Lo que tarde cada uno |
| `npm run varas -- completo` | Todas las varas. **Nunca se ha corrido entero:** sus topes son estimados | Varias horas |
| `diagDSK apu <celda> --semilla=N` · `apu tel.linea` | Comprobar o elegir una semilla | `tel.linea`, unos 40 s |
| `diagPUE contraste` (`pue.contraste`) | La Portada bajo su tinta; desde la 4c, rojo bajo 4,5 | Unos 2 min 30 s |
| `scripts/arnes/siembra.mjs` · `scripts/arnes/repetir.mjs` | Sembrar el azar y repetir una foto roja | — |
| `FIRMA_ESLINT_BASE` | La base de eslint, hoy cero | — |

**Sin corrida real todavía:** `--perfil=commit`, `--dejar`, `--limpiar` y Ctrl+C en `aislado`; `luz` y `tab` enteros con la repetición; `conRepeticion` en `cap` repitiendo de verdad.

## Lo que MOT-1 debe saber

- **Los 7 efectos de `GameTable.jsx`** llevan `eslint-disable-next-line … -- MOT-1 reescribe este flujo`. Salen a la vez que MOT-1 los reescriba; si queda alguno sobrante, sale como aviso, y es rojo.
- **eslint va contra cero:** un error o un aviso nuevo es rojo en `aislado` y en `varas`. `npx eslint .` antes de cada commit.
- **Las semillas pueden envejecer** si MOT-1 cambia el consumo de azar. Un `cobertura` con «re-elegir semilla» es la semilla y no el código: `--semilla=N`, y sellar la buena en `APU_SEMILLAS` o `U3_SEMILLA`.
- **`profiles` se lee por columnas (INV-83):** una columna nueva que el cliente lea necesita su `grant`, y una función que no sea `security definer` tampoco verá las demás.
- **C3 y C4** esperan en la primera migración de MOT-1, y **D-4** pide mirar si `sonda_mot1` sigue desplegada.
- **Con el bypass, las salas ya no van a la base:** `apiSinMesa` contesta sin mesa y sin mesas abiertas. Para probar una mesa, `?sal=`.
- **Los informes de MOT-1 sin seguimiento y `laminas/mon1/`** no se tocaron en toda la campaña.

## Validación

Los commits de la 4c se validan con `npm run aislado -- <a…h> --perfil=rapido`, después de este commit. El resultado y los SHA van en el resumen de cierre, porque este archivo forma parte de lo que se valida.
