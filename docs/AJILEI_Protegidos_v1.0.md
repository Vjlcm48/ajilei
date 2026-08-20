# AJILEI — Archivos protegidos · Lista canónica v1.0

- **Archivo:** `docs/AJILEI_Protegidos_v1.0.md`
- **Versión:** 1.0
- **Estado:** **LISTA CANÓNICA ÚNICA.** Sellado 2026-08-20 por Victor
  (HEPTACREATION LLC), al cierre de la campaña IDN-1.
- **Alcance:** qué archivos del árbol no se abren sin autorización explícita,
  con qué autoridad, y qué hace un agente cuando una tanda parece exigirlo.

> **Por qué existe este documento.** Hasta hoy la lista de protegidos no tenía
> casa: vivía repartida en las instrucciones de campaña, y por eso había **tres
> versiones distintas y vivas a la vez** — 3 archivos en
> `AJILEI_Diseno_Landscape_v1.0.md`, 4 en la instrucción de IDN-1 y 7 en la de
> EMB-2. Un guardarraíl que cambia de tamaño según qué documento se lea no es un
> guardarraíl. Desde este sellado, **manda esta lista**; las enumeraciones que
> aparezcan en instrucciones de campaña son referencias, no autoridad.

---

## 1. Qué significa "protegido"

Un archivo protegido **no se abre**: no se edita, ni "sólo una línea", ni con un
bloque nuevo al final, ni con `!important` para no tener que tocarlo por dentro.

Cuando una tanda parece exigir tocar uno:

1. **DETENERSE.** No se implementa una versión parcial "a la espera".
2. **Reportar** qué se necesita, por qué, y qué alternativa aditiva existe.
3. **Esperar autorización explícita de Victor**, que es quien decide.

La experiencia de las campañas DSK, EMB e IDN es que la alternativa aditiva casi
siempre existe y suele ser mejor: EMB-2 metió cinco tapetes sin abrir
`gameTable.css` (los fieltros entraron por hoja propia y atributo) e IDN-1
sustituyó las 13 apariciones de moneda y las 3 del wordmark sin abrirlo tampoco.

## 2. La lista

| # | Archivo | Autoridad que lo protege |
|---|---|---|
| 1 | `src/engine/gameEngine.js` | `AJILEI_Diseno_Landscape_v1.0.md` §1 · `AJILEI_Componente_Fichas_v2.0.md` §12 · instrucción IDN-1 |
| 2 | `src/engine/aiPlayer.js` | `AJILEI_Diseno_Landscape_v1.0.md` §1 · `AJILEI_Componente_Fichas_v2.0.md` §12 · instrucción IDN-1 |
| 3 | `src/config/seatLayouts.js` | `AJILEI_Diseno_Landscape_v1.0.md` §1 · `AJILEI_Componente_Fichas_v2.0.md` §12 · instrucción IDN-1 |
| 4 | `src/styles/opponentPanel.css` | Instrucción IDN-1 |
| 5 | `src/styles/gameTable.css` | Instrucción EMB-2 · **reafirmado por fallo de Victor del 2026-08-20** (IDN-1 §5: «Si resultara imprescindible tocar `gameTable.css`: DETENTE y pide autorización») |

Los tres primeros llevan protegidos desde el plan de landscape y su motivo es el
mismo: son el **motor** (reglas del juego), la **IA** y la **geometría de
asientos**. Tocarlos cambia lo que el juego *es*, no cómo se ve, y ninguna
campaña de interfaz tiene por qué hacerlo.

Los dos últimos son **hojas de estilo grandes y sedimentadas** —6260 y 1037
líneas— donde viven constantes selladas por medición (las columnas de O1, el
alto de `.rivals-zone`, los tokens `--dsk-*`). Su protección no es dogma: es que
una edición ahí puede romper en silencio una geometría que costó una campaña
entera calibrar.

## 3. Instantánea de sellado (2026-08-20)

Estado exacto en el momento de sellar esta lista, para que cualquier
"byte-idéntico" futuro sea auditable contra algo y no contra un recuerdo.

| Archivo | blob git | sha256 (16) | líneas | último commit que lo tocó |
|---|---|---|---|---|
| `src/engine/gameEngine.js` | `6ddadd536eb8` | `cad9af74e51e474e` | 548 | `fe8bbd2` (2026-07-21) |
| `src/engine/aiPlayer.js` | `0860812af936` | `9135fe06d0a5d2c0` | 908 | `92774ee` (2026-08-15) |
| `src/config/seatLayouts.js` | `0d1bb8ea66a8` | `0049051fd4b8b891` | 59 | `4721511` (2026-06-16) |
| `src/styles/opponentPanel.css` | `207f9b0d5d0a` | `71aecfdb59e30594` | 1037 | `1dc56a2` (2026-07-10) |
| `src/styles/gameTable.css` | `c8680f68e890` | `7ba731a4ca20e840` | 6260 | `8da6a89` (2026-08-14) |

**Es una instantánea, no un contrato.** Estas cifras envejecen en cuanto Victor
autorice un cambio, y eso es normal. Lo que no envejece es la comprobación, que
no necesita esta tabla:

```sh
# ¿tocó esta tanda algún protegido? (comparar contra la base de la rama)
for f in src/engine/gameEngine.js src/engine/aiPlayer.js \
         src/config/seatLayouts.js src/styles/opponentPanel.css \
         src/styles/gameTable.css; do
  git diff --quiet <base> -- "$f" && echo "INTACTO  $f" || echo "TOCADO   $f"
done
```

## 4. Pendiente de reconstrucción

**La instrucción de EMB-2 refirió «los 7 protegidos/sellados» y esa enumeración
completa no está versionada en el repositorio.** El documento de instrucción de
aquella campaña no se guardó en `docs/`, así que los **dos** archivos que
faltan para llegar a siete no se pueden reconstruir desde el árbol ni desde el
historial de git: se buscaron en los mensajes de commit, en `docs/` y en
`scripts/diagDSK.mjs`, y no aparecen enumerados en ninguno.

Se deja constancia en vez de completar la tabla a ojo: **inventar dos nombres
para que cuadre un número sería peor que admitir el hueco**, porque produciría
falsos protegidos que nadie podría desautorizar después.

**Acción pendiente de Victor:** completar esta sección con los dos archivos que
faltaban, o cerrarla declarando que la lista canónica son cinco y que el «7» de
EMB-2 contaba también documentos u otros artefactos.

Hasta que eso se resuelva, **rige la tabla de §2: cinco archivos.**

## 5. Cómo se mantiene

- Añadir o quitar un protegido es **decisión de Victor**, y se hace **aquí**,
  subiendo la versión de este documento.
- Una instrucción de campaña puede *recordar* la lista, pero no ampliarla ni
  recortarla por su cuenta. Si una instrucción y este documento discrepan,
  manda este documento y se reporta la discrepancia.
- El informe de cierre de cada campaña incluye la verificación de §3 sobre los
  archivos de esta lista.
