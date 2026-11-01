# AJILEI — Menú de Utilidades v1.7

**Estado:** Revisión de especificación. Sustituye a `AJILEI_Menu_Utilidades_v1.6.md`, que queda como historial.
**Fecha:** 2026-10-31
**Nace en:** TIE-1, Fase 1a (ficha `AJILEI_TIE-1_Fase1a_v1.0`, §0 V7 y §4; desviación D-7 del informe, aprobada por el rector en el STOP-A2).
**Naturaleza:** **Delta sobre la v1.6.** Todo lo que esta revisión no cambia sigue vigente como está escrito en la v1.6 y, a través de ella, en la v1.5 a la v1.0: el disparador ⋮, el panel flotante `fixed` z:30 de solo iconos, la doctrina D6 de satélites, el circuito de Reacciones, Partida rápida (INV-70), Mano actual de pago (INV-75) y la pastilla de estado. **Lo único que cambia es que «Tapetes» sale.**
**Lo vigilan:** `diagDSK cfg` (cfg.menu, cfg.consulta y cfg.rapida), `diagDSK u1` (sinTapetes), `diagDSK u3`, `diagDSK menu-movil`, `src/lib/partidaRapida.test.js`, `scripts/testConsultas.test.js`, `src/dev/bancoImitado.test.js` y, en el servidor, `supabase/pruebas/cfg1e_verificacion.sql`.

---

## 1. Las entradas

| | v1.6 | **v1.7** |
|---|---|---|
| 1 | Sonido | Sonido |
| 2 | Reacciones | Reacciones |
| 3 | Tapetes | **sale** |
| 4 | Partida rápida | Partida rápida |
| 5 | Mano actual, de pago | Mano actual, de pago |

- **«Tapetes» sale** de las tres listas de `src/config/menuEntradas.js` (`VIVAS_ESCRITORIO`, `VIVAS_MOVIL` y `ENTRADAS_PANEL`) y de `src/components/UtilitiesMenu.jsx`. Se compra y se elige en la tienda (`AJILEI_Tienda_v1.2.md` §13), que se abre desde el lobby, el «+» y la fila «Tapetes» del ⚙ (`AJILEI_Configuracion_v1.3.md` §13). **Desde la mesa no hay puerta a la tienda:** es lo que garantiza que no se compra en mitad de una partida (Tienda §7).
- **El ID `tapetes` queda retirado**, como `saldo` y `cuenta`: no se reutiliza.
- **La mesa sigue pintando el tapete en uso**, con su tono: `useTapeteEnMesa` pone en `<body>` lo que dice el canal de los tapetes, que es lo que dice el servidor (INV-77).
- **El panel mide 64 × 200 contra las IAS** (cuatro filas) **y 64 × 156 contra humanos** (tres: sin Partida rápida), en todas las pieles. `altoPanel(filas) = filas × 44 + 24` sigue siendo la cifra que espeja la pinza (`useUtilitiesMenu.js`) y la que sella el arnés (`scripts/cfg/menu1e.mjs`, ahora derivada de `filasDelPanel`, y `src/lib/partidaRapida.test.js`: 4 / 3 / 200 / 156).
- **Se retiran con la entrada** el panel de tapetes del ⋮ (`TapetesPanel.jsx` y su hoja de estilo, en la lista de borrado del informe), su vista previa en la mesa y su compra en el aparato, que marcaba «comprado» sin cobrar. Lo «comprado» en el aparato no se reconoce (INV-76).

---

## 2. Lo que no cambia

- Partida rápida (§2 de la v1.6, INV-70) y Mano actual de pago (§3 de la v1.6, INV-75), con sus pastillas.
- El disparador ⋮ y su zona táctil; Sonido, que comparte estado con la hoja ⚙ (INV-68).
- **La nota de §4 de la v1.6 sobre «Tapetes ya tiene sus 44»** queda como historia: la entrada ya no existe. `u1` sella ahora su ausencia (ni la fila ni el panel).

---

## 3. Historial de versiones

- **v1.7** — 2026-10-31. **TIE-1 1a.** Sale «Tapetes» (se compra y se elige en la tienda). El panel queda en 64 × 200 contra las IAS y 64 × 156 contra humanos.
- **v1.6** — 2026-10-30. **CFG-1 1e.** Salen «Cuenta» y «Saldo», entra «Partida rápida» y Mano actual pasa a ser de pago. Ver su documento.
- **v1.5 · v1.4 · v1.3 · v1.2 · v1.1 · v1.0** — ver sus documentos.
