# AJILEI · CFG-1 · Cierre de la campaña · v1.0

**Campaña:** CFG-1 · El menú de configuraciones · **Ejecutor:** Claude Code · **Rector:** Claude (chat) · **Decisor:** Victor
**Fecha:** 2026-11-02 · **Base del cierre:** `6626e24` (`859b27f` más dos commits de Victor que solo tocan el README), más la 1d.

**Estado: CERRADA, A FALTA DEL PUSH DE VICTOR.** Las pruebas de la 1d salieron al 100 %, la plantilla ya está en el panel y los seis commits de la 1d están hechos.

CFG-1 convirtió el ⚙ en un menú de verdad: una hoja en todas las pantallas, un perfil editable, la cuenta que se puede borrar y el correo que se puede cambiar. Además dejó el ⋮ de la mesa solo con lo de la mesa.

---

## 1 · Las sub-tandas

Se ejecutaron en este orden. La «1f» prevista en la Fase 0 no se hizo aquí: se convirtió en la 1a de la campaña TIE-1.

| Sub-tanda | Qué hizo | Commits | Fecha | Invariantes nuevas |
|---|---|---|---|---|
| **Fase 0** | Solo diagnóstico: el ⚙ y el ⋮ | en el `-e` de la 1a | 2026-10-29 | — |
| **1a** · Lo rápido del ⚙ | La hoja como componente en siete pantallas, un solo sonido, versión, sugerencia, ojito y el piso de 44 fuera de la mesa | `abb269d`..`fff91e3` | 2026-10-29 | INV-68, INV-69 |
| **1c** · Eliminar cuenta | La ventana con «ELIMINAR», la Edge Function `eliminar_cuenta` y su guarda, y cerrar sesión que reinicia la pantalla. `e98aef8` solo redispara la compilación | `1e278e5`..`8bf8904`, `e98aef8` | 2026-10-29 | INV-71 |
| **1b** · Perfil editable | La pantalla, las tres puertas, el nombre con su freno de 30 días y «De dónde eres» con banderas | `0b0701f`..`c69fc8d` | 2026-10-30 | INV-72, INV-73, INV-74 |
| **1e** · El ⋮ adelgaza | Salen «Cuenta» y «Saldo», entra «Partida rápida», y Mano actual se paga desde el servidor | `e183ee2`..`2a9857e` | 2026-10-30 | INV-70, INV-75 |
| **1d** · Cambio de correo | Dos códigos dentro de la app, con estado pendiente a la vista y sin migración | `d265adc`..`1f969e7`, y este informe (`CFG-1 1d-f`) | 2026-11-02 | INV-78 |
| **«1f» → TIE-1 1a** | Los tapetes en el ⚙, como puerta de la tienda; salen del ⋮. Pasó a TIE-1 porque necesitaba la tienda y el inventario en el servidor | `faac957`..`859b27f` | 2026-11-01 | INV-76, INV-77 (de TIE-1) |

## 2 · Los documentos

| Documento | Qué es |
|---|---|
| `docs/AJILEI_Configuracion_v1.4.md` | El normativo. Es el vigente; las v1.0 a v1.3 quedan como historia. §14 trae la plantilla de correo y el espejo del panel, que no están en ninguna otra parte del repo |
| `docs/AJILEI_Menu_Utilidades_v1.7.md` | El ⋮ tras la 1e y TIE-1 1a |
| `docs/AJILEI_Tienda_v1.2.md` §13 | La tienda, de TIE-1 |

Informes:
- **Fase 0:** `docs/reportes/AJILEI_CFG-1_Fase0_Informe_v1.0.md`.
- **1a:** `docs/reportes/AJILEI_CFG-1_Fase1aL_Informe_v1.0.md` y `docs/reportes/AJILEI_CFG-1_Fase1a_Informe_v1.0.md`.
- **1c:** `docs/reportes/AJILEI_CFG-1_Fase1c_Informe_v1.0.md`.
- **1b:** `docs/reportes/AJILEI_CFG-1_Fase1bL_Informe_v1.0.md` y `docs/reportes/AJILEI_CFG-1_Fase1b_Informe_v1.0.md`.
- **1e:** `docs/reportes/AJILEI_CFG-1_Fase1e_Informe_v1.0.md`.
- **1d:** `docs/reportes/AJILEI_CFG-1_Fase1d-0_Sonda_Informe_v1.0.md`, `docs/reportes/AJILEI_CFG-1_Fase1dL_Informe_v1.0.md` y `docs/reportes/AJILEI_CFG-1_Fase1d_Informe_v1.0.md`.
- **«1f»:** `docs/reportes/AJILEI_TIE-1_Fase1aL_Informe_v1.0.md` y `docs/reportes/AJILEI_TIE-1_Fase1a_Informe_v1.0.md`.

**Citas que se quedan en la v1.3.** `docs/AJILEI_Tienda_v1.2.md:274` y `docs/AJILEI_Menu_Utilidades_v1.7.md:21` siguen citando Configuración v1.3 (§13, sin cambios en la v1.4). No se tocan en esta tanda: la v1.3 sigue en `docs/`, marcada «Sustituido por v1.4». Se ponen al día cuando esos documentos suban de versión.

## 3 · El registro de invariantes

**Filas nuevas de la campaña:** INV-68 a INV-75 e INV-78. INV-76 e INV-77 son de TIE-1. El registro queda en **78 filas: 71 vigiladas**, 21 de ellas parciales.

**Filas retocadas:**
- **INV-07:** el piso de 44 fuera de la mesa, y su fuente.
- **INV-12:** las claves del aparato.
- **INV-45:** la pantalla completa, también desde la hoja.
- **INV-67:** los rankings traen el lugar, que es público.
- **INV-69:** redactada de nuevo en TIE-1 1a.

**La 1d, en concreto:**
- INV-78 es nueva.
- Las fuentes que citaban Configuración v1.3 pasan a la v1.4.
- §4 suma el cambio de correo y sus dos pruebas.
- En §6, `diagDSK cfg` pasa a 21 puertas.

**Línea de iOS (INV-41):** iPhone y iPad **pendientes**. CFG-1 no se ha probado en iOS. Lo que hay que mirar en la próxima sesión:
- la hoja ⚙ y el perfil;
- la tarjeta del correo con el teclado de Safari. Los campos ya van a 16 px, así que no debería acercar la página;
- si `autocomplete="one-time-code"` sugiere el código desde Mail.

## 4 · Las varas

**Cada commit de la 1d, aislado** (worktree propio, `vite build` antes de `vitest`). En los worktrees sale además una prueba omitida: `testBancoBandas` necesita volcados que git ignora.

| Commit | SHA | `vite build` | `vitest` |
|---|---|---|---|
| a · núcleo, API y textos | `d265adc` | ok | 2.053 |
| b · el GoTrue imitado y los mandos | `2cf7bdc` | ok | 2.061 |
| c · la fila, la tarjeta y el aviso | `f095c5d` | ok | 2.061 |
| d · arnés, `cfg.correo` | `3e8fa63` | ok | 2.061 |
| e · normativos e informes | `1f969e7` | ok | 2.062 |

**Sobre (e), en el árbol principal:**

| Vara | Resultado |
|---|---|
| `vitest run` | **2.063 pasan**, 86 archivos |
| `eslint .` | **20 errores + 1 aviso**, los de siempre (`CardImage`, `GameTable`, `SoundContext`) |
| `diagDSK humo` | **Verde,** código 0: `gate`, `lob`, `retar`, `rnk`, `suma`, `cfg`, `tienda` y aislamiento |
| `diagDSK cfg` | **Verde,** código 0: 21 de 21 puertas y la consola, `cfg.correo` 99 de 99, en 5 min 25 s |
| `diagDSK luz` (STOP-D2) | **Verde,** código 0: 20 celdas y 4 tapetes. `src/` no cambió después |

**Este commit (f) solo trae este informe y la corrección de §7 del de la 1d,** así que no cambia nada de lo que miden las varas. Se repitieron sobre él, y el resultado está en el STOP-C2, porque este informe no puede citarse a sí mismo.

**Las pruebas de Victor de la 1d, con servidor real:**
- **A (bypass en la PC):** al 100 %.
- **B (S25 por túnel con `test1976`):** al 100 %. El teclado real deja «Continuar» y «Cancelar» a la vista.
- **C (cuenta desechable `borrame1d`):** al 100 %, con dos cambios de correo en vez de uno, porque el primero se confirmó a la primera. Se cubrieron el pendiente, los códigos malos, «Reenviar» real, volver a entrar sin que pida nombre, «ya tiene una cuenta» y «Eliminar cuenta».
- **La huella, en la base real:** 6 bonos en total de principio a fin, esa huella 1, ningún disparador en `auth.users`, y `test1976` intacta (24.950 HC, 127 movimientos).

El detalle está en §6 del informe de la 1d.

## 5 · Lo que queda, y de quién es

**La plantilla ya está en el panel** (condición del push, cumplida). Si algún día se restaura el proyecto, hay que volver a pegarla antes de publicar: el texto está en Configuración v1.4 §14.4.

**Observación cerrada:** «Próximo cambio: 2 de diciembre» en la cuenta de la Prueba C es el comportamiento correcto (INV-72). Victor le cambió el nombre desde el perfil (`crroecambio1` → `borrame1d`), y el freno se puso por ese cambio y no por el Bautizo. No se toca código. Está en §7 del informe de la 1d.

**Para ARN-4:**
- **`src/components/FormularioPuerta.jsx:153`:** el `maxLength={6}` del código de la Entrada corta lo pegado («123 456» queda en cinco dígitos). La tarjeta del correo ya lo evita.
- **El límite de `consultar_mano`** va literal y no por `limite_dinero()`, igual que el de `comprar_articulo` (O-3 de la 1e y TIE-1 1a).
- **`u3`:** sembrar sus manos, para que la banda «Tu mejor palo» no dependa del azar del bypass (1e).

**Higiene de permisos:**
- **O-1 de la 1b:** cualquier jugador con sesión puede leer el `nombre_cambiado_en` de otro, por la política `using (true)` de `profiles`. Se cierra con un `grant select` por columnas; el cliente ya no lo necesita.

**Residuo conocido, no de esta campaña:**
- Con el bypass, `mi_sala` va al Supabase real y contesta 401 (O-4 de la 1e).

**Sin puerta todavía (no es deuda de CFG-1):**
- **Idioma** sigue en «Pronto», hasta IDI-1.
- **El avatar** tiene la rejilla; las imágenes llegan con AVA-1.
- **Sala de espera y PvP** siguen sin medir en `cfg`, hueco declarado de INV-07, hasta MES-PvP.

## 6 · Para el que venga

- **El panel no está en el repo.** La plantilla y el tiempo de vencimiento viven en Supabase; su única copia es Configuración v1.4 §14.4. `OTP_EXP_S` es un espejo: si alguien cambia los 600 s en el panel, hay que cambiar la constante y dos textos.
- **Todo cambio de correo pasa por los dos códigos.** El éxito es que vuelva una sesión, no la respuesta de `updateUser` ni que el primer código valga.
- **La huella del bono queda fuera de todo esto.** Nada del cambio de correo la toca (§14.5).
