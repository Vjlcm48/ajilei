FRZ-1 cerrada y desplegada.

## Los tres commits

| SHA | Mensaje |
|---|---|
| `4ab057a` | **FRZ-1a**: hook useCongelado — visibilidad, volumen con memoria y slot unico |
| `2a77c87` | **FRZ-1b**: la mesa se congela con la visibilidad — guardas de turno, IA, retirados y arranque de mano |
| `3e8cd15` | **GOV-2**: npm test cubre src/ ademas de scripts/ |

Sobre `3ea2e27`, en el orden pedido (1→2→3), cada uno por ruta explícita — ningún `git add -A`. Tras cada commit el `git status --short` coincidió con lo que el plan decía que faltaba: tras el 1º quedaban `package.json` + `GameTable.jsx`; tras el 2º sólo `package.json`; tras el 3º sólo los cuatro residuos.

## Ceremonia de tres SHA

```
HEAD        : 3e8cd15695144de95ac8cb8857ee90c35193bab4
origin/main : 3e8cd15695144de95ac8cb8857ee90c35193bab4
ls-remote   : 3e8cd15695144de95ac8cb8857ee90c35193bab4
```

Los tres idénticos.

## Los seis puntos de verificación

1. **`git log --oneline -4`** — los tres commits sobre `3ea2e27`. ✅
2. **`git status --short`** — sólo los cuatro residuos declarados. ✅
3. **`npm run build`** — verde. ✅
4. **`npm test`** — verde **por el script de la casa**: `Test Files 17 passed (17)`, `Tests 467 passed (467)`, con los **10 casos del hook dentro** (verificado con `--reporter=verbose`: las 10 líneas de `src/hooks/useCongelado.test.js`). ✅
5. **Arnés contra 4173** — `gate` **6/6, matrixOk**, 0 falsos · `puerta` **6/6 TODO VERDE** · `mon` **12/12 TODO VERDE** · `2.5` **10/10 TODO VERDE**, con `2.5h` (el halo envolviendo la mano 1:1, respirando) y `2.5i` (O1: caja idéntica con halo y sin él). ✅
6. **`npx eslint .`** — **20 problemas**, exactamente la línea base. ✅

Protegidos comprobados contra `3ea2e27`: los cinco `INTACTO`.

## Una corrección de cuenta, no un rojo

La ficha pedía `mon` **11/11**; el arnés vivo tiene **12** mediciones y las doce salieron verdes (`mon.0, 1, 2a, 2b, 3, 4, 5, 6, 7, 8, 9, 10`). El número de la ficha se quedó atrás cuando MON-2c añadió `mon.10`, la sonda de fondo único. Nada que arreglar — pero conviene que la próxima instrucción arrastre 12 y no 11.

## Paso 0

`"test": "vitest run scripts/ src/"`. Un solo hunk de `package.json`. La cuenta pasa de 457/16 a **467/17**, y el delta son exactamente los 10 del hook: `src/` no recogió nada indeseado.

---

Cloudflare construye desde `main`; el despliegue va en camino. Cuando verifiques `https://ajilei.io` desde la app instalada del S25, la prueba que más información da es la de bloquear pantalla **con el descarte en vuelo**: la coreografía debe terminar a oscuras y el reloj de BET_3 esperarte en 20s.

Y el iPhone queda en vigilancia por lo que ya sabíamos: `pagehide` sin su `visibilitychange` es el único camino del hook que ningún aparato ha ejercitado todavía. Está cubierto por la guarda de reentrada y sellado por el caso 2b del test, pero sellado no es lo mismo que visto.

**Cola abierta**: `GT-HIG` (siete relojes sin handle) · `ARN-x` (sonda CDP cruda como arnés permanente) · MON-2.1 · retiro de vectores 2D / `heptacoin.svg` · Identidad A al dominio · S8 bajo freeze · PvP.
