# AJILEI · CAR-1 · Cierre · Reporte

**Desplegado en `ajilei.io` · 04-sep-2026**

Las tres cabeceras de producción salieron exactamente como se diseñaron. La campaña está cerrada de punta a punta.

---

## Los cuatro commits

| SHA | Mensaje |
|---|---|
| `6b0c022` | **CAR-1a**: generador de la baraja en WebP q80 a 320x452 y sus 40 derivados |
| `8ea1e83` | **CAR-1b**: la mesa y la Bienvenida pintan desde los derivados WebP |
| `6f59a61` | **CAR-1c**: la baraja se precarga junto a los sonidos, al salir de la Bienvenida |
| `807b63b` | **GOV-3**: cabeceras de Cloudflare — /assets/\* inmutable, public/ sigue revalidando |

Los cuatro sobre `3e8cd15`, en orden 1→2→3→4. Atómico por ruta explícita, sin un solo `git add -A`. El primero entró con `git add scripts/gen-cards.mjs src/assets/cards/webp/` y el índice confirmó **41 rutas: 40 WebP y el generador**, ni una más. Tras cada commit, lo pendiente coincidió con lo que el plan decía que faltaba.

## Ceremonia de tres SHA

```
rev-parse HEAD        : 807b63b536631722230de159eb574ebaac53abe4
rev-parse origin/main : 807b63b536631722230de159eb574ebaac53abe4
ls-remote origin main : 807b63b536631722230de159eb574ebaac53abe4
```

## Los siete puntos de verificación

1. **`git log`** — los cuatro commits sobre `3e8cd15`. ✅
2. **`git status --short`** — sólo los cuatro residuos: `laminas/mon1/_entorno.txt`, `laminas/mon1/lamina.html`, `laminas/mon1/tiempos.json`, `scripts/_cel1bFila.mjs`. ✅
3. **`npm run build` verde** — `dist/assets/`: **40 WebP de carta (572,4 KB), 0 PNG de carta**; `dist/_headers` presente, 985 B. ✅
4. **`npm test` verde** — 467 pruebas, 17 archivos. ✅
5. **Arnés** — `gate` **6/6** con `matrixOk: true` · `puerta` **6/6** VERDE · `mon` **12/12** VERDE · `2.5` **10/10** VERDE. ✅
6. **`npx eslint .`** — 21 problemas: **20 errores + 1 aviso**, la línea base exacta. ✅
7. **Protegidos** — los cinco INTACTO contra `3e8cd15`, con los blob del registro coincidiendo carácter a carácter: `gameEngine.js` `6ddadd536eb8` · `aiPlayer.js` `0860812af936` · `seatLayouts.js` `0d1bb8ea66a8` · `opponentPanel.css` `3ce6383eec0d` · `gameTable.css` `1e21371c8543`. ✅

> **Sobre el punto 5.** La ficha dice «`gate` matriz 4/4» porque yo se lo dije mal en la Fase 1: conté cuatro filas leyendo salida truncada por `tail` y le achaqué el error a la ficha original, que decía 6/6 y tenía razón. La matriz son **seis viewports** —640×360, 360×640, 844×390, 1024×768, 1366×768, 1920×937— y hoy salen las seis VERDE. Ese número debería volver a 6/6 en la próxima pasada de docs.

## Las tres cabeceras de producción

Esperado el despliegue hasta que `ajilei.io` sirvió `index-DdxeB6z6.js`, el JS de este build:

```
1 · https://ajilei.io/assets/doce_oro-BDayoWCm.webp
    Content-Type:  image/webp
    Cache-Control: public, max-age=31536000, immutable
    CF-Cache-Status: HIT

2 · https://ajilei.io/
    Content-Type:  text/html
    Cache-Control: public, max-age=0, must-revalidate

3 · https://ajilei.io/heptacoin.webp
    Content-Type:  image/webp
    Cache-Control: public, max-age=0, must-revalidate
```

El `_headers` fue leído. La carta con hash queda inmutable un año; el `index.html` y la zona `public/` sin hash siguen revalidando, que es justo la distinción que la Fase 0 marcó como la trampa a evitar. **La mitad barata también está puesta.**

## `git status`

```
?? laminas/mon1/_entorno.txt
?? laminas/mon1/lamina.html
?? laminas/mon1/tiempos.json
?? scripts/_cel1bFila.mjs
```

---

**STOP final.** Puedes cerrar desde la app instalada del S25 contra `ajilei.io` — la primera visita ya no revalida cuarenta veces, y a partir de la segunda las cartas salen de disco sin tocar la red.

Guardado en memoria: las decisiones selladas (maestros PNG en el repo, 320/q80, AVIF descartado, la idempotencia al byte), las dos zonas del `_headers` y por qué, y las dos correcciones de etiqueta que quedan en cola para `docs/` — el rival de mesa 2 es `opp-panel` dentro de `.rivals-zone`, y el reverso es un `<img>` de `reverso_carta.svg?no-inline`, no sólo un fondo CSS.
