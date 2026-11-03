# AJILEI · ARN-4 · Tanda 4-0 · Informe v1.0

**Para:** Victor y el rector · **De:** Claude Code · **Fecha:** 2026-11-03
**Ficha:** `AJILEI_ARN-4_Tanda0_v1.0.md` · **Base:** `main` en `a32ec2f` · **Sonda:** `AJILEI_ARN-4_Fase0_Informe_v1.0.md`
**Estado:** STOP-V aprobado. Prueba de Victor: **sí**, seis dígitos y entró.

---

## Qué entró

| ID | Qué | Resultado |
|---|---|---|
| **B7** | El código pegado con separadores entra entero en la entrada | Arreglado en producción al publicarse; puerta 2.4e e INV-80 |
| **C1** | CLI de Supabase de 2.116.0 a 2.122.1 exacta | Hecho. `migration list --linked`: 14 de 14 iguales a la línea base |
| **D-3** | Unión viva hacia el `node_modules` real, en el scratchpad de la sesión `7a71b06a` | Soltada, sin commit. `node_modules` intacto |

Lo demás del informe de la Fase 0 queda para las sub-tandas siguientes.

## B7

`FormularioPuerta.jsx` tenía `maxLength={6}`. El navegador cortaba lo pegado antes de que llegara al filtro de dígitos, así que «123 456» quedaba en cinco dígitos y el botón «Entrar» seguía apagado. El arreglo es quitar esa línea: el filtro ya deja seis dígitos.

| Puerta 2.4e de `diagPUE 2.4` (portapapeles y Ctrl+V) | Antes | Después |
|---|---|---|
| «123 456» | Rojo, `12345` | Verde, `123456` |
| «123-456» | Rojo, `12345` | Verde, `123456` |

La ficha pedía «123 456». El segundo caso se añadió porque INV-80 también promete «otros separadores». La puerta pega de verdad porque `fill` se salta el `maxLength` y nunca habría salido roja.

**Prueba de Victor en la PC:** sobre `vite preview`, con un código real pegado con un espacio en medio. Se vieron seis dígitos y entró. Fue la única prueba en un aparato real; por decisión de la ficha no se probó en teléfono.

## Cifras

| Vara | Resultado |
|---|---|
| `diagPUE 2.4` antes del arreglo | 26 mediciones, 2 en rojo (las de 2.4e), código 1 |
| `diagPUE 2.4` después | 26 de 26 en verde, código 0 |
| `vite build`, tras subir el CLI | Verde |
| `vitest`, tras subir el CLI | 88 de 88 archivos, 2.075 pruebas |
| `vitest`, con INV-80 | 88 de 88 archivos, 2.076 pruebas: la fila nueva suma una |
| `eslint` | 20 errores y 1 aviso, en las mismas líneas de la base |
| `package-lock.json` | 239 paquetes antes y después; solo cambian `supabase`, sus 8 binarios `@supabase/cli-*` y la raíz |

Por la regla de medida justa no se corrieron worktrees, humo completo, `npm run guiones` ni el resto del arnés.

## D-3

Antes de soltarla se comprobó que era una unión, que apuntaba al `node_modules` del repo y que no había otra bajo los scratchpads de este proyecto. Se soltó con `fs.unlinkSync`. El `node_modules` real tiene 155 entradas antes y después, y existen `vite/package.json` y `.package-lock.json`.

**Pendiente de Victor:** el resto de esa carpeta `probe` sigue en su sitio e incluye una copia de `.env.local`. Se puede borrar a mano.

## Quedó por comprobar

- `migration list` sigue imprimiendo «Initialising login role…». Como anotó la Fase 0, probablemente crea un rol temporal en el servidor, y sigue sin comprobarse.
- La v3 del CLI queda para después de MOT-1. La 2.122.1 avisa en cada comando de que existe la 3.0.0; es solo un aviso.

## Desviaciones

- **Caso extra en la puerta:** «123-456», explicado en B7.
- **Fuente de INV-80:** cita el informe de la Fase 0 y no este, porque `testInvariantes` exige que el documento citado exista, y este aún no existía al escribir la fila.
- **Errores míos en D-3:** dos scripts fallaron antes de tocar nada, porque el heredoc de Bash se comía las barras invertidas. Se repitió con la unión comprobada de nuevo.
