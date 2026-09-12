# AJILEI · SAL-B1 · Cierre · v1.0
## Fase 1 + A1 + A2 (con addendum) + A3, en seis atómicos sobre `12188af`

**Ficha:** `AJILEI_SAL-B1_Commits_v1.0.md`. **Rectores:** los cinco de SAL-B1 y sus informes en `docs/reportes/`.
**Validación completa (2026-09-11):** doce pruebas con dispositivos reales en verde (S25 `test1976`, Motorola `ticotest2022`, PC con consola); Grupos A y B de A1 y de A3 en verde en Supabase.

---

## 1. Los seis atómicos

Por decisión de la ficha (§3.4) la lista de SHA **no** va aquí, para no abrir un séptimo commit: va en el chat de cierre y en la memoria del proyecto. Aquí, qué contiene cada uno.

| # | Prefijo | Contenido |
|---|---|---|
| (a) | `SAL-B1a` | `BarraSuperior.jsx` extraída del lobby; `Lobby.jsx` la monta y el CTA PvP pierde el candado y la pastilla |
| (b) | `SAL-B1b` | Núcleo: `salasCore.js` (+ `arranqueDeSesion`), `salaRecordada.js`, `salaPendiente.js` (+ `consumir`), `salas.js` (`CLAVE_CONFIG_SALA`, `ACTIVA_SIN_PARTIDA_MIN`), bloque `sal.*` de textos, y sus pruebas |
| (c) | `SAL-B1c` | Pantallas: `SalaOpciones.jsx`, `ArmarMesa.jsx`, `SalaEspera.jsx` (stub), `IconosSalas.jsx`, `salas.css`, `App.jsx` (tres ramas, precedencia de arranque, `entrarSala`, guardia por `uid`) |
| (d) | `SAL-B1d` | `salasApi.js` (`claveDeError`, `contarSentados`, `esMesa`, `mesaOpcional`, traducción del NULL por código) con sus pruebas, y las migraciones `20260911043500_sal_b1_ajuste.sql` y `20260911103000_sal_b1_ajuste_a3.sql` |
| (e) | `SAL-B1e` | Arnés y herramientas: `salasFixtures.js`, `diagSAL.mjs`, `vite.config.js` (`preview.allowedHosts`), `.gitignore` (`capturas-sal/`) |
| (f) | `SAL-B1f` | Los seis informes: Fase 1, A1, A2, A3 Fase 0, A3 Fase 1 y este cierre |

Las dos trazas temporales de A2 (`mesaOpcional` en `salasApi.js` y el arranque en `App.jsx`) se retiraron antes del primer commit; sus lecturas verbatim están en los informes de A2 y A3. Las aserciones que las medían en `salasApi.test.js` se retiraron con ellas (§0.6 de la ficha): las pruebas siguen existiendo y miden la conducta.

**Nota sobre el orden:** (c) referencia `esMesa` de `salasApi.js` y `simulacionSalas` de `salasFixtures.js`, que entran en (d) y (e). El árbol sólo construye completo a partir de (e); es la agrupación que la ficha fija y se deja dicho.

## 2. Cifras finales

| Qué | Resultado |
|---|---|
| Protegidos (`git diff 12188af` sobre los cinco) | vacío, antes del primer commit y después del sexto |
| `npm test` | **618 / 618** (línea base de SAL-Ae: 565) |
| `npx eslint .` | **21** (20 + 1), la línea base exacta |
| `npm run build` | limpio; `dist/` sin fixtures ni nombres de estado |
| `diagSAL sal` | **66 / 66** (11 estados × 6 viewports) |
| `diagDSK lob` | **6 / 6** |
| Migraciones nuevas | 2, aplicadas antes de esta ficha |
| Sin seguimiento al terminar | sólo los seis residuos de mano de Victor (§0.3 de la ficha) |

## 3. Las dos lecciones que se fijan

1. **En una RPC que admite reentrada, «¿sigue vivo el recurso?» va antes que «¿ya estabas dentro?»**; si no, quien estuvo dentro recupera un cadáver. Una fila con `id` pasa todas las guardas del cliente por definición: el cliente decide «hay mesa», el servidor decide «está viva».
2. **Un verde debe medir lo que dice.** «El PC entró sentado por el enlace» medía la reanudación por `mi_sala()` de la misma cuenta, no la invitación. La prueba de invitación exige una cuenta distinta de la del anfitrión, y los enlaces de prueba se generan con el formato sellado (`?sala=`), no a mano con otro.

## 4. Lo que pasa a SAL-B2

- **Textos de final de mesa en la `SalaEspera` real**, tres estados distintos para quien ya estaba sentado: «El anfitrión cerró la mesa» (`cancelada`), «La mesa se cerró: no llegó gente a tiempo» (vencida / barrido), «¡Arranca la partida!» (`activa`). La regla «no distinguir» de A1 protege contra quien sondea códigos desde fuera; no aplica a un miembro.
- **«Actualizar»** desaparece o pasa a respaldo con Realtime.
- **Reloj de 3 minutos** corto para un invitado nuevo; **navegador incrustado** de Gmail/WhatsApp; **recordatorio en Privada** («toca Abierta para unirte»); **`decidirArranque`** como función pura si B2 toca la precedencia de arranque.
- **Deuda declarada:** barra superior duplicada en CSS (`lobby.css` / `salas.css`); `inert=""` en `Lobby.jsx`; la raíz del `line-height: 145%` de `index.css`.
- **Provisional hasta MES-PvP:** la rama del barrido que cancela `activa` sin partida (`ACTIVA_SIN_PARTIDA_MIN`), `mi_sala()` sólo `esperando`, y la reentrada a `activa` en `unirse_sala`.

## 5. Después del push

Cloudflare despliega `main` a `ajilei.io`. Victor comprueba en el S25 con la PWA instalada: lobby → «Jugar contra jugador» → armar una mesa → stub → «Salir de la mesa»; y, por primera vez en el dominio real, `https://ajilei.io/?sala=AJ-XXXX` de una mesa viva desde el Motorola.
