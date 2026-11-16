# AJILEI · MED-1a · Tanda 0 (instrumentos) · Informe · v1.0

- **Ficha:** `AJILEI_MED-1a_T0_v1.0.md`. **Base:** `b9474c7`. **Fecha:** 2026-11-16.
- **Diseño:** `docs/reportes/AJILEI_MED-1a_Fase0_Informe_v1.0.md`, §F-1, §F-2 y §F-3. Esta tanda los ejecuta tal como están diagnosticados.
- **Estado:** tramos A, B y C hechos; controles del §7 en verde (§5). Quedan los commits, tras el visto bueno del mapa, y el paso a la nube de Victor (§6 de la ficha).
- **Tiempo:** unos 40 min de Claude Code, más unos 35 min de varas en segundo plano. Elegir semillas costó un solo intento por vara.

---

## Resumen

| Pieza | Qué se hizo | Dónde |
|---|---|---|
| CLI de Supabase | 2.122.1 → **3.1.0** exacta; un párrafo de la v3 en la cabecera de `config.toml` | `package.json:35` · `package-lock.json` · `supabase/config.toml:24-28` |
| `saldo.5` | Elige el chip por su **valor** y deriva la nota de `saldoMinimo` | `scripts/diagDSK.mjs`, `runSaldo` («saldo.5») |
| `h1` y `z1` | Siembran el azar (INV-82): `H1_SEMILLAS` y `Z1_SEMILLAS = { comun: 1 }`, `--semilla` las admite, y un ciclo que no se da sale «sin cobertura · re-elegir semilla» | `scripts/diagDSK.mjs`, `runH1` y `runZ1` |
| Documentos | INV-82 y §3 de Invariantes; este informe; el de la Fase 0 entra al repo | `docs/AJILEI_Invariantes_v1.0.md` |

Nada de esto lo monta la mesa contra las IAS (informe de la Fase 0, §G). No se tocó `src/`, `supabase/migrations/` ni `supabase/functions/`.

---

## 1 · La CLI (tramo A)

- `npm install -D supabase@3.1.0 --save-exact` deja `"supabase": "3.1.0"` en `package.json`.
- El lock cambia solo en `node_modules/supabase` y sus ocho binarios de plataforma (`@supabase/cli-*`): 37 líneas por lado, todas de versión, `resolved` o `integrity`. No hay cambios ajenos.
- `npx supabase --version` → **`3.1.0`**.
- `supabase/config.toml`: un párrafo en la cabecera, debajo de `supabase link` (`:24-28`). Dice que todo comando contra la nube lleva `--remote` y pide confirmación con «No» por defecto; que `--linked`/`--project-ref` siguen funcionando con aviso; que sin `--remote` `db push` apunta a la pila local; y que el deploy sigue siendo `functions deploy <nombre> --use-api --no-verify-jwt`. Nada más cambia.
- `npm run guiones` tras el `install`: **verde**, 21 migraciones, 10 guiones × 2 pasadas, código 0.

## 2 · `saldo.5` (tramo B-1)

**El rojo**, sin volver a correrlo roto: la línea base de `b9474c7` (`%TEMP%\varas-mwhrzfi8\saldo.log:204-227`).
- `despues.nota` = «Necesitas 3.000 HC para sentarte a 200». Fallaba solo `nota.includes('2.500')`.
- La vara pulsaba `:nth-of-type(3)`. Desde MES-PvP 7b-a la lista empieza en 50, así que el tercero es el 200. Además, el «2.500» era la regla de 5×; la Corta pide 15×.

**El arreglo** (solo `scripts/diagDSK.mjs`):
- **La apuesta pulsada** es la mayor de `APUESTAS_PVP` que `SALDO_SERVIDO` (3.700) alcanza en la Corta y que 900 ya no alcanza: hoy, **200**. La siguiente (hoy, **500**) nace apagada. Las dos salen de `APUESTAS_PVP` y `saldoMinimo` (`src/config/salas.js`), por `await import`, porque `salas.js` importa sin extensión y necesita el gancho `_resolveExt`.
- **Sin escenario** (si la lista o la regla cambian tanto que no queda apuesta así), la vara da error de instrumento, no un rojo.
- **El localizador:** dentro de `[data-accion="apuesta"]`, el chip cuyo texto es exactamente `montoTexto(hc)`. El mismo sirve para pulsar y para leer.
- **La nota esperada** contiene `montoTexto(saldoMinimo(200))` + « HC» y termina en ` 200`.
- **Un matiz sobre la ficha:** además del 500 apagado antes y después, que la ficha pide, la vara comprueba lo que de verdad dice el punto, que «los chips se ponen al día»: el chip **pulsado** está encendido antes y se apaga tras la relectura. Con el 500 solo, el punto no medía nada, porque ese chip nace apagado.

**El verde** (`npm run varas -- --solo saldo`, `%TEMP%\varas-mwj7jw3j\saldo.log`):

```
── SALDO · VERDE · saldo.1 ✓ … saldo.5 ✓ … saldo.14 ✓ · consola ✓
"saldo.5": { "pulsada": 200, "apagada": 500, "notaEsperada": { "min": "3.000", "hc": "200" },
  "antes":   { "pildora": "3.700", "lecturas": 1, "chips": { "cuantos": 1, "pulsadaApagada": false, "siguienteApagada": true } },
  "despues": { "nota": "Necesitas 3.000 HC para sentarte a 200", "chips": { "pulsadaApagada": true, "siguienteApagada": true } },
  "pildora": "900", "lecturas": 2, "ok": true }
── diagDSK saldo · saldo verde · aislamiento verde → código 0
```

3 min 18 s; aislamiento: 20 contextos y 0 escapadas.

## 3 · Las semillas de `h1` y `z1` (tramo B-2)

**Lo que cambia** (solo `scripts/diagDSK.mjs`, con la convención de `vuelo`):
- `H1_SEMILLAS = { comun: 1 }` y `Z1_SEMILLAS = { comun: 1 }`. Una clave «<mesa> <ancho>x<alto>» daría la semilla de una celda; no hizo falta ninguna. `semillaDeCelda` resuelve la semilla, y `--semilla=N` la sustituye en todas las celdas.
- `sembrarAzar(page, semilla)` antes de `gotoMesa` en `runH1` y `runZ1`, con la pieza de `arnes/siembra.mjs`.
- `--semilla` admite `h1` y `z1`, con su mensaje al día.
- **`h1`:**
  - Las puertas de **cobertura** (turno visto encendido y apagado, el ciclo Mano/Pie/sin rol y el Pie en las cabeceras) salen de `passed` y deciden el `estado`. Sin ciclo, `sinCobertura` con un motivo que nombra la semilla, qué faltó y `AVISO_SEMILLA`.
  - La geometría (incluida `headsStable`) y el turno fantasma siguen siendo puerta: es la regla de ARN-3b D4 que ya seguían `a1`, `z1` o `vuelo`.
  - La línea por celda dice la semilla, los roles vistos, el Δ de cabeceras y las manos sin cerrar.
- **`z1`:** ya tenía `estado`. Su motivo de cobertura nombra la semilla y lleva `AVISO_SEMILLA`, y la línea por celda dice la semilla y las manos.
- **«Mesa atascada»:** en `h1` y `z1` el bucle corta en la primera mano que no cierra, así que la «atascada» de `vuelo` (3 manos seguidas sin cerrar) no se da. Lo que sí sigue rojo es el turno fantasma.

**Los controles, en el orden de la ficha:**

1. **Rojo del instrumento**, antes de tocar nada:

   ```
   node scripts/diagDSK.mjs h1 --semilla=1  → código 2
   node scripts/diagDSK.mjs z1 --semilla=1  → código 2
   ✖ ERROR DE INSTRUMENTO (código 2): --semilla solo vale en «msg», «apu», «u3» y «vuelo», y como «azar» o un entero (recibido: {"modo":"explicita","base":1})
   ```

2. **La candidata, solo en T5 1920×937.** La semilla 1 dio el caso en las dos, a la primera:

   ```
   h1 T5 1920x937 · semilla=1 · frames=305 · roles=Mano/Pie/sin rol · cabeceras Δmáx=0 · OK      (2 min 42 s)
   T5 1920x937 · semilla=1 · manos=1 · cartas=5 · escala=1.5 … coreo=completa/suprimido · OK     (1 min 3 s)
   ```

3. **Misma semilla, misma partida** (las dos celdas, repetidas):

   ```
   h1 T5 1920x937 · semilla=1 · frames=307 · roles=Mano/Pie/sin rol · cabeceras Δmáx=0 · OK
   T5 1920x937 · semilla=1 · manos=1 · cartas=5 · escala=1.5 … coreo=completa/suprimido · OK
   ```

   - **`z1`:** idéntica, línea por línea.
   - **`h1`:** la partida es la misma, con dos frames de diferencia (305 y 307). `frames` cuenta muestras de un bucle que pulsa a ritmo de reloj, no de la partida, así que no puede repetirse al frame. Coinciden las dos corridas: 3 manos, 3 cerradas, 0 sin cerrar, roles `Mano/Pie` con «sin rol», cabeceras `P/T/M`, el peor Δ del ciclo (0,01 en `tags`, `h0-post`) y `headWorst` 0.

4. **Confirmación con la vara entera** (`npm run varas -- --solo h1.5,z1`, `%TEMP%\varas-mwj80wmo\`):

   | Vara | Código | Duración | Celdas |
   |---|---|---|---|
   | `h1.5` | 0 | 10 min 47 s | 4/4 `medida` y OK, semilla 1; frames 309/305/302/304; 3 manos cerradas en cada una; cabeceras Δ 0 |
   | `z1` | 0 | 10 min 51 s | 16/16 OK, semilla 1; en todas, cartas de cara en la primera mano |

   **Comparación con la línea base sin semilla:**
   - `h1.5` T5 1920×937 daba `frames=194`, sin «sin rol» y con cabeceras a 3,41 px. Ahora da el ciclo entero y cabeceras a 0.
   - `z1` tardaba 10:25 (rojo) o 12:49 (verde repetido). Ahora tarda 10:51, y la celda T5 1920×937 ya no se queda «con una IA pensando».

**El Δ de 3,41 px de las cabeceras** («IA 4.cardsY», `h1-post`) de la línea base era geometría, no cobertura. Con la semilla 1 no aparece en ninguna celda: la mano que lo producía ya no se juega. No es una regresión que se esconda, porque esa misma celda salió verde al repetir sin semilla (`%TEMP%\varas-mwi7y7cp\h1.5.log`). Pero queda anotado: si una semilla futura vuelve a dar un Δ en `IA 4.cardsY`, es un caso real que mirar, no ruido.

## 4 · Documentos (tramo C)

- **INV-82:** `h1` y `z1` se suman a `apu`, `u3` y `vuelo`, con su origen («desde MED-1a T0»); este informe entra en las fuentes y `diagDSK h1` y `diagDSK z1` en los vigilantes. La excepción de `vuelo humano` queda tal cual.
- **Invariantes §3:** la línea de la siembra nombra `h1` y `z1`, `H1_SEMILLAS`/`Z1_SEMILLAS`, la semilla común y la clave por celda, y cómo se prueba otra (`h1 <mesa> <ancho>x<alto> --semilla=N`).
- **La cabecera «Actualizado»** de Invariantes, con la entrada del 2026-11-16.
- **`AJILEI_MED-1a_Fase0_Informe_v1.0.md`** entra en el commit de documentos sin cambios.

## 5 · Los controles del §7

Sobre el árbol con todos los cambios (`b9474c7` + las cuatro letras), `npm run varas -- --solo eslint,vitest,build,guiones,1.8b` (`%TEMP%\varas-mwj8tysy\`), código 0:

| Control | Resultado |
|---|---|
| eslint | 0 errores y 0 avisos, igual que la base |
| vitest | 109/109 archivos, 2978 pruebas, 0 fallidas, 0 omitidas |
| build | compila (367 módulos) |
| guiones | verde: 21 migraciones, 10 guiones × 2 pasadas |
| `1.8b` | **177,9 KiB** en el cable (643,1 en crudo; JS 149,8 · CSS 21,4 · HTML 2,1 · resto 4,6; 6 recursos): idéntica a la línea base |
| `saldo` | verde, 15/15 (§2) |
| `h1.5` · `z1` | verdes con la semilla 1: 4/4 y 16/16 (§3) |
| `git worktree list` | una línea |

**Las intermedias:**
- 0-b (solo el trozo de `saldo.5`) aplica limpio sobre `b9474c7` y pasa `node --check`.
- 0-b + 0-c reconstruyen el `diagDSK.mjs` del árbol byte a byte. Comprobado en el scratchpad, sin worktree.

## 6 · Lo que hereda la tanda 1

Nada nuevo. Las dos semillas quedaron selladas; `msg` (INV-22) y `vuelo humano` (INV-82) siguen como estaban.
