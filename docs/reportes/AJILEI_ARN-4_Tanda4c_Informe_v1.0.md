# AJILEI · ARN-4 · Tanda 4c · Limpieza, Portada y servidor · Informe v1.0

**Para:** Victor y el rector · **De:** Claude Code · **Fecha:** 2026-11-03
**Ficha:** `AJILEI_ARN-4_Tanda4c_v1.0.md` · **Base:** `main` en `4b8a911` · **Sonda:** `AJILEI_ARN-4_Fase0_Informe_v1.0.md` §3
**Estado:** STOP-V y STOP-S aprobados por Victor, incluido lo hecho fuera de la ficha. Ningún protegido abierto.

---

## Qué entró

| ID | Qué | Resultado |
|---|---|---|
| **B1** | eslint en cero, opción (b) | 0 errores y 0 avisos. Los 7 efectos de la mesa, silenciados con su motivo y sin tocar |
| **B2 y B3b** | `PERFIL_DEV` y las tablas del banco imitado, fuera del paquete | `DevLocal` y `Bachaquero_VE`, en `PROHIBIDAS` y con 0 apariciones |
| **B3d** | El comentario «CUATRO props» | Ya no cuenta props |
| **C6** | Con el bypass, `mi_sala` no va a la base | `apiSinMesa` en `salasFixtures.js`; `simulacionSalas()` no cambia |
| **B8** | Se retira `swatch` | Con la adenda en `AJILEI_Tapetes_v1.2.md` |
| **Portada** | `.pue-cta-vacuna` y `.pue-lema-categoria` a 4,5 o más | Ojos de Victor en el S25: sí |
| **B6** | El lienzo de `html` en verde abisal | Rebote en el S25: no asoma blanco |
| **B9 y D-2** | Archivos sin uso | 7 bajas, borradas por Victor |
| **C2** | `grant select` por columnas en `profiles` | Aplicado por Victor; 7 de 7 PASA en la base real; perfil y mini-perfil, sí |

## Cifras

| Prueba | Resultado |
|---|---|
| `npm run varas -- commit` | Código 0; `humo` 13 min 10 s |
| `apu 360x640` | Verde, 5 min 10 s |
| `tapetes` | Verde, 1 min 22 s |
| `pue.contraste` | Verde, 2 min 11 s, 0 repeticiones en 20 comparaciones |
| `cap` | Verde, 2 min 36 s, 0 píxeles distintos en las tres maestras |
| C6, con una sonda de una vez fuera del repo | Lobby montado; 0 peticiones a `mi_sala`, 0 a Supabase, sin errores de consola |
| `npm run guiones` | Verde: 15 migraciones, 9 guiones; el nuevo, 7 de 7 |
| Trozos del build | Siguen los 4. El componente `CardImage` pasa de `index` a `GameTable`: +258 B y −421 B, medidos solo con B1 |

## La Portada

| Texto | Alfa | 412×915 | 360×640 | 915×412 | 1920×1080 |
|---|---|---|---|---|---|
| `.pue-lema-categoria` | 0,72 → 0,80 | 4,10 → **4,65** | 4,11 → **4,66** | 5,46 → **6,32** | 4,23 → **4,80** |
| `.pue-cta-vacuna` | 0,55 → 0,58 | 4,32 → **4,63** | 4,50 → **4,83** | no se ve | no se ve |

`.entrada-proximamente` sigue en 2,10, exenta. **`cap` no pidió resellar:** sus tres maestras son de la mesa, y la ficha esperaba que cambiaran.

## Lo borrado y lo que se queda

**Borrados:** `src/App.css`, `src/components/SuitSymbol.jsx`, `src/components/WelcomeScreen.jsx`, `src/hooks/useReloj.js`, `src/screens/Entrada.jsx`, `_diagShuffle.cjs` y `_measureDeck.cjs`.

**Se quedan:** `welcome.css`, `entrada.css`, `PUE_lamina_v1.7.html` y los tres `PUE_*_demo`. La lámina carga `mesav` y `mesapc`, y un comentario de `scripts/gen-portada-assets.mjs` dice que los `PUE_*_demo.*` se quedan, lo que alcanza a `mesah`.

## C2: la comprobación previa

- **Edge Functions:** `eliminar_cuenta` solo nombra `profiles` en un comentario, y `sonda_mot1` no la toca.
- **Cliente:** pide `id, username, pais, estado` (`COLUMNAS_PERFIL`), y `username` en el embebido de asientos.
- **SQL:** las 12 funciones que nombran `profiles` son `security definer`, y ninguna vista la lee.
- **La vuelta atrás** devuelve la lectura a `authenticated`. `anon` se quedaría sin su permiso de tabla, sin efecto para nadie: la política de lectura solo admite a `authenticated`.

## Fuera de la letra de la ficha, aprobado por Victor

- `FIRMA_ESLINT_BASE` baja a cero en el commit a, con `scripts/arnes/aisladoCore.mjs` y su prueba, como dijo la 4a.
- `const [deckHumano] = deckRefs`: con solo el `useState`, `deckRefs[0]` mantenía 8 errores de `refs`. No cambia la lógica.
- `@__PURE__` en todas las tablas del módulo y en el `Intl.DateTimeFormat` de `bancoImitado.js`, no solo en las líneas 46-93: `Bachaquero_VE` está en la 132.
- La puerta da rojo con cualquier texto no exento bajo 4,5, no solo con esos dos, y el exento ya no provoca repeticiones.
- C6 se comprobó con una sonda en el scratchpad: ningún modo existente cuenta esas peticiones. `lob` y `retar` pasan dentro del humo.
- Tres comentarios que decían «sigue en el árbol» se corrigen en el commit f: dos en `App.jsx` y uno en `diagDSK.mjs`.

## Registro

`docs/AJILEI_Invariantes_v1.0.md`: INV-83 nueva; INV-79 con la Portada a 4,5; §2 con el recuento de 83 filas; §3 con eslint en cero; §6 con `diagPUE contraste` y el guion nuevo.

**iOS, pendiente (INV-41):** el color de la Portada y el rebote de B6 se miraron solo en el S25. El rebote es justo lo que Safari pinta distinto, y queda sin mirar en un iPhone.

## Validación de los commits

Con `npm run aislado -- <a…h> --perfil=rapido`, después de este commit. El resultado va en el resumen de cierre, porque este archivo forma parte de lo que se valida.
