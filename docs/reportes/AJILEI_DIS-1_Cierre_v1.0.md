# AJILEI · DIS-1 · Informe de cierre · v1.0

**Campaña:** DIS-1, dispositivos realistas en la escena 5 de la Portada · **Fecha:** 2026-09-30
**Ficha:** `AJILEI_DIS-1_Commits_v1.0.md` · **Base:** `59fa46d` (REC-2e) · **Ejecuta:** Claude Code

## 1. Qué es DIS-1

La escena 5 de la Portada («En tu teléfono o en tu computadora…») enseñaba dos marcos planos de CSS con una captura dentro. DIS-1 los sustituye por **una laptop y un teléfono genéricos renderizados en Blender**, con la mesa real **horneada** en la pantalla, alfa real y su propia sombra de contacto.

Resultado: la escena se pinta **igual en Edge y en WebKit**. Además corrige tres defectos que midió la Fase 0:
- el marco del teléfono roto en WebKit;
- la base de la laptop, que se salía del viewport a 901 px;
- la salida de la escena, que apagaba los aparatos de golpe.

## 2. Decisiones selladas

| Decisión | Contenido |
|---|---|
| **Camino B** (Victor, 29-sep) | Una imagen por aparato (`dis_laptop.webp` y `dis_telefono.webp`), sin `matrix3d` ni perspectiva CSS. El WebKit de Playwright para Windows no tiene 3D (vuelta 4 de la Fase 1a). |
| **Composición de escritorio** | Laptop de 234 px de silueta a 1920 y teléfono +30 % sobre la escala real, delante de su esquina derecha. Escala con el alto del escenario. |
| **Móvil (≤ 900 px), al 0 %** (Victor, 30-sep) | Los aparatos conservan la caja de los marcos de antes. Relevo: primero el teléfono y luego la laptop. |
| **Maestras fuera de git** (Victor, 30-sep) | Los PNG de 16 bits están en `Descargas\AJILEI\DIS-1\render_final_2026-09-30\`. En git solo van los JSON (`maestras/dis1/`), el script y los dos WebP. |
| **Norma** | Adenda 10 del Sistema de Diseño (`docs/AJILEI_Sistema_Diseno_v1.2.md`, sin cambio de versión). |

## 3. Commits

| Commit | SHA | Contenido |
|---|---|---|
| a | `0691dcd` | DIS-1a: recursos de los dispositivos (renders, traza y scripts) |
| b | `4bd5e0b` | DIS-1b: escena 5 con los dispositivos renderizados |
| c | `018208c` | DIS-1c: arnés, modo `dis` (`capvis` retirado, `1.3a` y `1.8a` migrados) |
| d | `afac299` | DIS-1d: informes y adenda 10 del Sistema de Diseño |

Este informe va en su propio commit (e), porque no puede contener su propio SHA.

**Dos ajustes a la ficha, aprobados por Victor antes del primer `git add`:**
- la línea `__pycache__/` no se añadió a `.gitignore`, porque ya estaba (`.gitignore:90`);
- la adenda es la **10**, en el formato de la casa, porque la 8 ya era la de REV-1.

## 4. Verificación sobre `afac299` (d)

| Prueba | Resultado |
|---|---|
| `npm run build` tras **b**, con c y d sin preparar | limpio |
| `npm run build` sobre d | limpio; `index-CWlevo-j.css` e `index-D7swmbtI.js`, los mismos de la Fase 2 |
| `npx vitest run` | **1056/1056** |
| `npx eslint .` | **21** (20 errores y 1 aviso), los de antes |
| `node scripts/dis1/geometria_dis.mjs` | «al día» |
| `node scripts/diagPUE.mjs` (4173) | **182 verdes y 1 rojo**, el `1.8b` conocido. Las 68 puertas `dis` en verde: contrato ≤ 0,22 px y WebKit frente a Edge ≤ 0,03 px |

**Idéntico a la Fase 2.**

**Incidencia del terreno, sin efecto en las cifras:** en el 4173 escuchaban dos `vite preview`:
- uno mío de la Fase 2, que el `TaskStop` no llegó a terminar y que ya está cerrado;
- el `--host` de Victor, que no se tocó.

La primera pasada de `diagPUE` fue contra el mío. Se repitió contra el de Victor con el mismo resultado exacto (`1.8b` 224 698 B en las dos).

## 5. Validación de Victor

| Aparato | Resultado |
|---|---|
| S25 | bien |
| Motorola | bien |
| PC a 1920 | bien |
| iPhone | **pendiente**; se probará contra `ajilei.io` tras el despliegue |

## 6. Pendientes

1. **iPhone real.** Es la primera prueba en un WebKit de verdad (el de Playwright en Windows no es Safari).
2. **Limpieza de `src/assets/portada/mesapc.webp` y `mesav.webp`** y de sus dos trabajos en `scripts/gen-portada-assets.mjs`. No tienen consumidor desde **b** y no salen en `dist/`. Las maestras `maestras/portada/mesapc.png` y `mesav.png` **sí** siguen en uso.
3. **`1.8b`:** el rojo de antes de DIS-1 (219,4 KiB frente a 200). No empeoró: +35 B, de 224 663 a 224 698 B.
4. **Reutilizar los renders para el video.** Anotado desde la Fase 0; las maestras de 16 bits están en la carpeta de control de Victor.
