# AJILEI — Archivos protegidos · Lista canónica v1.3

- **Archivo:** `docs/AJILEI_Protegidos_v1.0.md`
- **Versión:** 1.3
- **Estado:** **LISTA CANÓNICA ÚNICA.** Sellado 2026-08-20 por Victor
  (HEPTACREATION LLC), al cierre de la campaña IDN-1.
- **Actualización v1.1 (2026-08-26):** se cierra el hueco de reconstrucción
  de la §4 declarando que los «7» de EMB-2 incluían **sellados no-archivo**.
  La lista de la §2 no cambia: siguen siendo los cinco evidenciados.
- **Actualización v1.2 (2026-08-26):** refresco de la instantánea §3 tras
  VIS/TAC — dos filas vencidas por movimientos legítimos ya sellados. La
  lista de la §2 sigue sin cambiar; sólo se re-miden las cifras.
- **Actualización v1.3 (2026-08-26):** la prosa de la §2 deja de llevar
  cifras de líneas — envejecían con cada campaña. La medida vive donde se
  mide: la instantánea de la §3.
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

Los dos últimos son **hojas de estilo grandes y sedimentadas** —del orden de
miles de líneas, con la cifra exacta en la instantánea de la §3— donde viven
constantes selladas por medición (las columnas de O1, el alto de
`.rivals-zone`, los tokens `--dsk-*`). Su protección no es dogma: es que
una edición ahí puede romper en silencio una geometría que costó una campaña
entera calibrar.

## 3. Instantánea (sellado 2026-08-20 · refresco 2026-08-26)

Estado exacto de cada archivo, para que cualquier "byte-idéntico" futuro sea
auditable contra algo y no contra un recuerdo. Tres filas siguen siendo las del
sellado; las dos de estilos se refrescaron el 2026-08-26 —el envejecimiento que
el aviso de más abajo anuncia—, con su causa en la nota al pie de la tabla.

| Archivo | blob git | sha256 (16) | líneas | último commit que lo tocó |
|---|---|---|---|---|
| `src/engine/gameEngine.js` | `6ddadd536eb8` | `cad9af74e51e474e` | 548 | `fe8bbd2` (2026-07-21) |
| `src/engine/aiPlayer.js` | `0860812af936` | `9135fe06d0a5d2c0` | 908 | `92774ee` (2026-08-15) |
| `src/config/seatLayouts.js` | `0d1bb8ea66a8` | `0049051fd4b8b891` | 59 | `4721511` (2026-06-16) |
| `src/styles/opponentPanel.css` | `3ce6383eec0d` | `50c98d51a91c3994` | 1084 | `9f7dd13` (2026-08-21) |
| `src/styles/gameTable.css` | `1e21371c8543` | `149591867769ad91` | 6289 | `726733c` (2026-08-21) |

**Refresco 2026-08-26 (v1.2) — qué movió a quién.** La tabla no tiene columna de
causa, así que las dos filas refrescadas la declaran aquí. Ninguna de las dos es
una incidencia: son campañas selladas que tenían autorización para tocar su
archivo.

- `src/styles/opponentPanel.css` — **VIS-2d** (`9f7dd13`, 2026-08-21), la ranura
  vacía que dejó de pintar sobre la carta vecina.
- `src/styles/gameTable.css` — **VIS-2b** (`9945335`, el reverso oficial R-2) y
  **TAC-1** (`726733c`, 2026-08-21, el envoltorio del mazo que se comía el toque
  de la primera carta). La fila registra el último, que es lo que la columna pide.

Las otras tres filas se re-midieron en el mismo barrido y salieron idénticas a lo
ya declarado, así que **no se reescribieron**. Las cinco cifras se recalcularon en
vivo contra HEAD con los mismos comandos que levantaron la instantánea original
(`git hash-object` · `sha256sum` · `wc -l` · `git log -1`): este documento
registra lo medido, nunca lo citado de un reporte.

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

## 4. Reconstrucción CERRADA (v1.1)

**La instrucción de EMB-2 refirió «los 7 protegidos/sellados» y esa enumeración
completa no está versionada en el repositorio.** El documento de instrucción de
aquella campaña no se guardó en `docs/`, así que los **dos** archivos que
faltan para llegar a siete no se pueden reconstruir desde el árbol ni desde el
historial de git: se buscaron en los mensajes de commit, en `docs/` y en
`scripts/diagDSK.mjs`, y no aparecen enumerados en ninguno.

Se deja constancia en vez de completar la tabla a ojo: **inventar dos nombres
para que cuadre un número sería peor que admitir el hueco**, porque produciría
falsos protegidos que nadie podría desautorizar después.

**Cierre (decisión de Victor, 2026-08-26).** La referencia de EMB-2 a «7
protegidos/sellados» mezclaba archivos protegidos con **constantes selladas
no-archivo** (p. ej. las constantes del óvalo O1 y valores sellados
equivalentes). Los dos elementos no identificados **no son archivos**: no
existen en commits, docs ni scripts, y su búsqueda exhaustiva —la registrada
más arriba en esta misma sección desde la v1.0— lo confirmó. Por decisión de
Victor (2026-08-26) este hueco queda **CERRADO**: la lista canónica de archivos
protegidos es y sigue siendo la de los **cinco** evidenciados en la §2.
**Reabrir este punto requiere autorización explícita de Victor en este
documento.**

Los dos párrafos que abren esta sección se conservan tal como se escribieron
en la v1.0: la constancia de la búsqueda es parte del valor del documento, y
quien lea esta sección debe poder ver qué se buscó antes de aceptar el cierre.

**Rige, como hasta ahora, la tabla de §2: cinco archivos.**

## 5. Cómo se mantiene

- Añadir o quitar un protegido es **decisión de Victor**, y se hace **aquí**,
  subiendo la versión de este documento.
- Una instrucción de campaña puede *recordar* la lista, pero no ampliarla ni
  recortarla por su cuenta. Si una instrucción y este documento discrepan,
  manda este documento y se reporta la discrepancia.
- El informe de cierre de cada campaña incluye la verificación de §3 sobre los
  archivos de esta lista.
