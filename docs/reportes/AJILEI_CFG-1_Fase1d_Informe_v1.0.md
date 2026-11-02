# AJILEI · CFG-1 · Fase 1d · Cambio de correo · Informe v1.0

**Ficha:** `AJILEI_CFG-1_Fase1d_v1.0.md`. **Base:** `main` en `859b27f`. **Sonda:** `AJILEI_CFG-1_Fase1d-0_Sonda_Informe_v1.0.md`. **Lámina:** `AJILEI_CFG-1_Fase1dL_Informe_v1.0.md`.

---

# 1d-i · El código con servidor simulado · STOP-D1

**Fecha:** 2026-11-01. Sin commits, sin migración, sin tocar `profiles`, la huella del bono ni `eliminar_cuenta`.

## Resultado

| Vara | Resultado |
|---|---|
| `vitest run` | **2.062 pasan**, 86 archivos |
| `eslint .` | **20 errores + 1 aviso**, los de siempre (`CardImage`, `GameTable`, `SoundContext`) |
| `diagDSK humo` | **Verde,** código 0: `cfg` 21 de 21 puertas más la consola, y aislamiento verde |
| `diagDSK cfg` | **Verde,** código 0: 21 de 21 puertas más la consola |
| `cfg.correo` | **99 de 99 comprobaciones**, en cinco tamaños y los cinco mandos |

**Lo que falta:** nada de esto ha hablado con el servidor real. Eso es la 1d-ii.

## Qué probar (Victor, en la PC)

`npm run dev` y abrir el Perfil desde el avatar:

| URL | Qué se ve |
|---|---|
| `http://localhost:5173/?cfg=correo-normal` | La fila enmascarada; el cambio entero |
| `…/?cfg=correo-pendiente` | La fila «Pendiente», y «Reenviar» con la espera que queda |
| `…/?cfg=correo-en-uso` | «Ese correo ya tiene una cuenta.» |
| `…/?cfg=correo-codigo-mal` | «Los dos códigos no son correctos.» con cualquier código |
| `…/?cfg=correo-limite` | «Demasiados intentos. Espera un momento.» |

**Códigos del simulacro: `111111` para el correo actual y `222222` para el nuevo.** Cualquier otro es incorrecto. Al revés también completan, porque se prueban cruzados. `test1976@gmail.com` da «ya tiene una cuenta» con cualquier mando.

**Dos cosas del bypass que no son fallos:**
- **Recargar reinicia el simulacro:** hay un banco por carga de página, así que lo pendiente no sobrevive. En la app real sí sobrevive, y el arnés lo mide.
- **La hoja ⚙ no enseña correo:** el bypass no tiene sesión, como hasta hoy.

## Lo construido

| Pieza | Qué es |
|---|---|
| `src/lib/correoCore.js` + pruebas | **Núcleo puro:** normalizar, validar, «el mismo», los diez motivos cerrados, el estado de la fila, la espera, y `OTP_EXP_S = 600` con su comentario de espejo del panel |
| `src/lib/correoApi.js` + pruebas | **API:** `estado`, `pedirCambio`, `confirmar`, `reenviar`. Nunca lanza. No hay `cancelar` |
| `src/hooks/useCambioCorreo.js` | Lee el estado al abrir el perfil y apaga el «Pendiente» cuando vence |
| `src/components/CambiarCorreo.jsx`, `src/styles/correo.css` | La tarjeta sellada en STOP-L: editor y V3-A |
| `src/screens/Perfil.jsx`, `src/styles/perfil.css`, `src/App.jsx` | La fila encendida, el aviso final y el reparto real/bypass |
| `src/config/textos.es.js` | Los textos de §4 de la lámina y el nuevo aviso de «Eliminar cuenta» |
| `src/dev/bancoImitado.js` + pruebas, `src/dev/billeteraFalsa.js` | GoTrue imitado y los cinco mandos |
| `scripts/cfg/correo1d.mjs`, `scripts/cfg/cfg.mjs` | La puerta `cfg.correo` |

**Lo aprobado, cumplido:** `confirmar` manda siempre los dos códigos y el éxito es que vuelva una sesión; si fallan los dos, se prueban cruzados una vez; «Reenviar» usa siempre el correo actual y vacía los dos campos; H-6 y H-7 caen en «No se pudo enviar».

## Qué mide `cfg.correo`

Va contra el **bundle real con el SDK de Auth de verdad**; solo el servidor es imitado, por las rutas `/auth/v1/user`, `/verify` y `/resend`. En 360×640, 412×915, 915×412, 1366×768 y 1920×1080:

- **La fila:** enmascarada, con «›» y sin «Pronto». Pendiente, sobrevive a recargar. Se apaga al vencer aunque `new_email` siga en el servidor.
- **El editor:** arriba en el teléfono, el correo completo, zonas de 44 sin solapes, y «Continuar» y «Confirmar» a la vista con el teclado (360×640 y 412×915, con los altos estimados).
- **Los errores:** no válido y el mismo sin viaje al servidor; en uso y límite con viaje y sin cambiar nada; el botón no salta.
- **Los códigos:** lo pegado con espacios entra entero; uno malo se marca y el bueno queda aceptado; vencido con una sola llamada; `resend` con el correo actual.
- **Con algo pendiente:** el editor dice «Cerrar», enseña «Continuar en N s», no llega a pedir y no apaga la fila.
- **Hecho, con códigos cruzados:** el aviso, la fila, la hoja ⚙ y la sesión guardada con el correo nuevo. `profiles` ni se escribe ni se relee.

## Decisiones menores que tomé

1. **`perfil.correo.paso` no entra:** era solo de V3-B, y V3 es A.
2. **El reintento con un código ya aceptado no se marca como malo.** La API recuerda lo aceptado en ese envío, y lo olvida al reenviar. Sin eso, el jugador leería «Los dos códigos no son correctos» cuando solo uno lo está. Si cierra la app se pierde ese recuerdo, pero `confirmar` igual completa.
3. **La espera sale de `email_change_sent_at`,** la hora del servidor. Con el reloj del aparato muy desviado podría mostrar una cifra errónea (se limita a 0–60 s), y en el peor caso sale el mensaje de «Demasiados intentos».

## Una diferencia con la lámina

**Las etiquetas de la tarjeta se ven en la tipografía del cuerpo,** como el editor del nombre, porque van fuera de `.sal`. En la lámina salían en otra. La geometría de «Confirmar» es la misma que la medida en la lámina.

## Dos rojos del arnés, arreglados

Los dos eran de la puerta nueva y ninguno del producto:
- **La posición del botón se medía durante la animación de entrada** de la tarjeta (14 px, 0,55 s): 5 rojas. Ahora espera, como las demás medidas.
- **0,02 px de redondeo de subpíxel** en 360×640: 1 roja. La comparación exigía igualdad exacta; ahora tolera 0,05 px. Es la misma cifra que ya salió en la lámina.

## Antes de publicar: el orden importa

**La plantilla tiene que ir antes que el código.** La de hoy es la de fábrica, con enlace y sin código. Si se publicara esto antes de cambiarla, quien pida un cambio de correo recibiría dos enlaces y una tarjeta que le pide códigos que nunca le llegaron.

## Pendientes

- **ARN-4:** el campo de código de la Entrada (`src/components/FormularioPuerta.jsx:153`) corta lo pegado con `maxLength` («123 456» queda en cinco dígitos). No se toca en esta tanda.
- **Para el cierre (1d-ii):** la plantilla, las pruebas A, B y C, el modo `luz`, el normativo, la invariante y el informe de cierre.
- **El teclado real** se comprueba en la Prueba B, por túnel.

## Estado del árbol

- **Nuevos:** `scripts/cfg/correo1d.mjs`, `src/components/CambiarCorreo.jsx`, `src/hooks/useCambioCorreo.js`, `src/lib/correoApi.js` y `correoCore.js` con sus pruebas, `src/styles/correo.css`.
- **Modificados:** `scripts/cfg/cfg.mjs`, `scripts/diagDSK.mjs`, `src/App.jsx`, `src/config/textos.es.js`, `src/dev/bancoImitado.js` y su prueba, `src/dev/billeteraFalsa.js`, `src/screens/Perfil.jsx`, `src/styles/perfil.css`.
- **Sin seguimiento y fuera de la tanda:** `laminas/cfg1d/` (no va en ningún commit) y lo de MOT-1, que ya estaba.
- **Protegidos:** ninguno tocado. El CSS nuevo no lleva `!important` ni hex.

**STOP-D1.** Aprobado por el rector: Victor probó los cinco mandos en la PC al 100 %, y quedaron aprobadas las tres decisiones menores y la tipografía de las etiquetas.

---

# 1d-ii · Servidor real · STOP-D2

**Fecha:** 2026-11-01. **Sin commits.** `src/` no cambió desde el STOP-D1. La base subió a `6626e24`, pero esos dos commits de Victor solo tocan el README.

**Estado: validada por Victor contra el servidor real** (STOP-D2, aprobado por el rector). Las pruebas A, B y C, al 100 %, y la plantilla pegada y guardada en el panel. El resultado está en §6.

## Resultado

| Vara | Resultado |
|---|---|
| `vitest run` | **2.063 pasan**, 86 archivos (una más: `testInvariantes` genera una prueba por fila, y entró INV-78) |
| `eslint .` | **20 errores + 1 aviso**, los de siempre |
| `diagDSK luz` | **Verde,** código 0: 20 celdas y 4 tapetes, p1 a p5 y extras; aislamiento verde |
| `diagDSK humo`, `diagDSK cfg` | No se repiten: `src/` y el arnés no han cambiado desde el STOP-D1. Vuelven en la ficha de commits |
| La consulta de la huella | Probada en PGlite con todas las migraciones (abajo) |

**`luz` corrió con `--puerto-aux=5175`,** porque mi vite de la lámina ocupa el 5174.

## 1 · La plantilla «Change email address»

**Se pega en:** Authentication → Email Templates → Change email address.

**Asunto:**

```
Tu código para cambiar de correo en AJILEI
```

**Cuerpo:**

```html
<div style="font-family: Arial, Helvetica, sans-serif; color: #1f2a24; max-width: 480px; margin: 0 auto;">
  <h2 style="font-size: 20px; margin: 0 0 16px;">Cambiar el correo de tu cuenta de AJILEI</h2>
  <p style="margin: 0 0 12px;">Se pidió cambiar el correo de esta cuenta:</p>
  <p style="margin: 0 0 16px;"><strong>De:</strong> {{ .Email }}<br><strong>A:</strong> {{ .NewEmail }}</p>
  <p style="margin: 0 0 4px;">Tu código para este correo es:</p>
  <p style="font-size: 32px; font-weight: 700; letter-spacing: 4px; margin: 0 0 16px;">{{ .Token }}</p>
  <p style="margin: 0 0 12px;">Al otro correo le llega un código distinto. Escribe los dos en AJILEI, en la pantalla donde pediste el cambio. Vencen en 10 minutos.</p>
  <p style="font-size: 13px; color: #5b665f; margin: 0;">¿No fuiste tú? No hagas nada: sin los dos códigos, el correo no cambia.</p>
</div>
```

**Sobre el texto:**
- **Vale para los dos destinatarios sin `{{ .SendingTo }}`:** dice «este correo» y «el otro correo», y no «el actual» ni «el nuevo».
- **«Se pidió» y no «Pediste»:** también lo puede recibir alguien que no lo pidió. La última línea es cierta con «Secure email change» encendido, porque sin los dos códigos el correo no cambia.
- **Sin enlace ni `{{ .ConfirmationURL }}`:** si el mensaje llevara un enlace, se podría confirmar fuera de la tarjeta.
- **«10 minutos»** es el espejo de los 600 s del panel. Si cambian, se cambia aquí y en `OTP_EXP_S`.
- **Lo comprobado:** las tres variables están en `templatemailer.go:301-303` de GoTrue 2.197.0. La dibujé con datos de la Prueba C en 360 y 800 de ancho, sin desbordes y con las dos direcciones largas en una línea cada una.

**Lo que no pude cumplir del todo: «el estilo de las plantillas de la casa».** No las he visto. Viven solo en el panel, no hay copia en el repo y ninguna sesión las recoge. Esta es HTML sencillo con estilos en línea, porque el correo no carga hojas. El rector puede compararla con la de «Magic Link» al pegarla. Si esa tiene otra cabecera o pie, se copia el envoltorio y se conservan las tres variables y el texto.

**El orden:** se puede pegar ya. El cliente de producción no tiene cambio de correo (la fila dice «Pronto»), así que nadie la verá hasta la Prueba C. Es lo contrario de publicar el cliente antes que la plantilla.

**Queda copia** en Configuración v1.4 §14.4, porque en el repo no había ninguna.

## 2 · Las pruebas de Victor

### A · PC con bypass
Hecha en el STOP-D1, al 100 %.

### B · S25 por túnel con `test1976`

Con `npm run build`, `npx vite preview --host` y el túnel.

| Paso | Qué debe ver |
|---|---|
| Avatar → Perfil | La fila «Correo», enmascarada, con «›» y sin «Pronto» |
| Tocar la fila | La tarjeta **arriba**, con el correo actual completo |
| Tocar «Correo nuevo» | **El teclado real:** «Continuar» y «Cancelar» a la vista. Es lo que el arnés solo estima |
| «Cancelar» | Vuelve al perfil. **No se pulsa «Continuar».** |

### C · Cuenta desechable

En ventana de incógnito, con `npm run build` y `npx vite preview` (`http://localhost:4173/`). **La plantilla ya pegada.** Nunca con `test1976` ni `ticotest2022`.

| # | Paso | Qué debe ver |
|---|---|---|
| 1 | **SQL:** la consulta de abajo | `auth.users` 0 y 0 · esa huella 1. **Anotar** «bonos en total» y el saldo de la cuenta base |
| 2 | Entrar con `victorjlcm32+borrar1d@gmail.com` y bautizarla (`borrame1d`) | El lobby con **0 HC y sin bono**: comparte huella con el correo base |
| 3 | **SQL** | Alias original 1 · nuevo 0 · esa cuenta con `saldo=0 · movimientos=0 · bonos cobrados=0` |
| 4 | Avatar → Perfil → Correo. Escribir `victorjlcm32+borrar1dnuevo@gmail.com` → «Continuar» | La tarjeta pasa a los dos códigos |
| 5 | **Gmail** | **Dos correos, en español, con los dos «De» y «A» bien y códigos distintos.** Si llega un enlace y no un código, **parar**: la plantilla no quedó guardada |
| 6 | «Cerrar» | La fila en dos líneas: «Pendiente: v•••@gmail.com» y «Revisa tus dos correos» |
| 7 | Recargar la página | **Sigue pendiente:** esto viene del servidor |
| 8 | Tocar la fila → dos códigos inventados → «Confirmar» | Abre en los códigos. «Los dos códigos no son correctos.» |
| 9 | El código bueno en un campo y `000000` en el otro → «Confirmar» | Se marca **solo** el malo, con su texto. El bueno queda aceptado |
| 10 | *(Añadido, lo propongo yo; no está en la ficha.)* Pasados 60 s, «Reenviar» | Campos vacíos, «Te mandamos dos códigos nuevos» y dos correos más. **Es la llamada que más depende de haber leído bien el fuente** |
| 11 | Los dos códigos últimos → «Confirmar» | El aviso con la dirección **completa**: «Listo: desde ahora entras con victorjlcm32+borrar1dnuevo@gmail.com». Se apaga el «Pendiente» |
| 12 | Tocar la fila otra vez | «Correo actual»: el **nuevo, completo** (ver la trampa 1). «Cancelar» |
| 13 | **SQL** | Alias original **0** · nuevo **1** · esa huella **1** · bonos en total **igual que en el paso 1** · la cuenta con `bonos cobrados=0` |
| 14 | ⚙ → Cerrar sesión. Entrar con el alias **nuevo** | Llega el código, y entra **sin pedir nombre**, con `borrame1d` y 0 HC. **Si pide nombre, parar:** es otra cuenta |
| 15 | Perfil → Correo → la dirección de `test1976` → «Continuar» | «Ese correo ya tiene una cuenta.» Se queda en el editor, y sin «Pendiente» al salir |
| 16 | ⚙ → Eliminar cuenta | El aviso nuevo («…con el correo con el que creaste esta cuenta…»). `eliminar` → la Portada |
| 17 | **SQL** | 0 y 0 · esa huella 1 · bonos en total **igual que en el paso 1** · la cuenta base con **el mismo saldo** |

**No probar** a entrar con el alias original tras el paso 11: crearía otra cuenta que luego habría que borrar.

**Tres trampas de esta prueba:**
1. **La fila no puede enseñar el cambio.** Los dos alias se enmascaran igual: `v•••@gmail.com`. La ficha dice «la fila enseña la dirección nueva», pero con estos alias la fila se ve idéntica. Por eso los pasos 11 y 12 miran la dirección completa. También vale el mini-perfil propio de Rankings.
2. **Los dos correos llegan a la misma bandeja, con el mismo asunto.** Gmail puede juntarlos en una conversación: hay que abrir los dos. Para saber cuál es cuál, mirar el «para:». Si se ponen al revés no pasa nada: `confirmar` los prueba cruzados.
3. **La prueba no puede demostrar por sí sola que la huella «es la del alias original».** Gmail ignora `+algo` y los puntos, así que el alias original, el nuevo y el correo base dan **la misma huella**. Si la huella se moviera entre los dos alias, la fila sería igual. Lo que sí mide esta prueba: el total no sube y no se cobra bono. Para lo que no puede distinguir, ver abajo.

### La consulta de la huella

Solo lee y no tiene huecos. No enseña correos, uuids ni huellas. Se corre en los pasos 1, 3, 13 y 17.

```sql
-- CFG-1 1d · Prueba C · La huella del bono. SOLO LEE: no cambia nada y no tiene huecos.
-- Se corre cuatro veces: antes de crear la cuenta, con la cuenta creada, tras
-- confirmar el cambio y tras eliminarla.
with alias as (
  select 'victorjlcm32+borrar1d@gmail.com'::text      as original,
         'victorjlcm32+borrar1dnuevo@gmail.com'::text as nuevo,
         public.huella_correo('victorjlcm32+borrar1d@gmail.com')      as huella,
         public.huella_correo('victorjlcm32+borrar1dnuevo@gmail.com') as huella_nueva
),
familia as (
  select u.id, lower(u.email) as correo, u.created_at
    from auth.users u, alias a
   where u.email is not null
     and public.huella_correo(u.email) = a.huella
),
filas as (
  select 1 as o, 'los dos alias dan la misma huella' as que,
         case when a.huella = a.huella_nueva then 'sí (gmail: sin +algo ni puntos)' else 'NO' end as valor
    from alias a
  union all
  select 2, 'bonos_bienvenida con esa huella', count(*)::text
    from public.bonos_bienvenida b, alias a where b.correo_hash = a.huella
  union all
  select 3, 'bonos_bienvenida en total', count(*)::text from public.bonos_bienvenida
  union all
  select 4, 'auth.users con el alias original', count(*)::text
    from auth.users u, alias a where lower(u.email) = a.original
  union all
  select 5, 'auth.users con el alias nuevo', count(*)::text
    from auth.users u, alias a where lower(u.email) = a.nuevo
  union all
  select 6, 'cuentas con esa huella', count(*)::text from familia
  union all
  select 7, 'disparadores propios en auth.users',
         coalesce(string_agg(t.tgname, ', '), 'ninguno')
    from pg_catalog.pg_trigger t
    join pg_catalog.pg_class c on c.oid = t.tgrelid
    join pg_catalog.pg_namespace s on s.oid = c.relnamespace
   where s.nspname = 'auth' and c.relname = 'users' and not t.tgisinternal
  union all
  select 10 + row_number() over (order by f.created_at)::int,
         'cuenta ' || coalesce(p.username, '(sin perfil todavía)')
           || case when f.correo = (select original from alias) then ' · alias original'
                   when f.correo = (select nuevo from alias) then ' · alias nuevo'
                   else ' · la otra de la misma huella (no se toca)' end,
         format('saldo=%s · movimientos=%s · bonos cobrados=%s',
                coalesce((select b.saldo::text from public.billeteras b where b.jugador_id = f.id), '—'),
                (select count(*) from public.movimientos m where m.jugador_id = f.id),
                (select count(*) from public.movimientos m where m.jugador_id = f.id and m.tipo = 'bono_bienvenida'))
    from familia f
    left join public.profiles p on p.id = f.id
)
select que, valor from filas order by o;
```

**Lo que dio en PGlite** (todas las migraciones; el cambio de correo, simulado con un `update` de `auth.users`; sin el GoTrue de verdad):

| Momento | Original | Nuevo | Esa huella | Total | Cuentas | La desechable |
|---|---|---|---|---|---|---|
| Antes | 0 | 0 | 1 | 1 | 1 | — |
| Creada | 1 | 0 | 1 | 1 | 2 | saldo 0, 0 movimientos, 0 bonos |
| Confirmado | 0 | 1 | 1 | 1 | 2 | saldo 0, 0 movimientos, 0 bonos |
| Eliminada | 0 | 0 | 1 | 1 | 1 | — |

**Lo que la Prueba C no distingue,** medido en PGlite con dos direcciones de huellas distintas: al cambiar de una a otra, el total sigue igual (2 → 2), la huella vieja sigue (1) y la nueva no nace (0). Las migraciones no ponen ningún disparador en `auth.users`.

**La fila «disparadores propios»** mira eso mismo en la base real, que puede tener alguno creado desde el panel. Debe decir «ninguno». Si sale un nombre no tiene por qué ser un fallo, pero **hay que parar y pasárselo al rector**.

## 3 · Lo dejado listo para el cierre

| Documento | Qué lleva |
|---|---|
| `docs/AJILEI_Configuracion_v1.4.md` | **§14 nueva:** de dónde sale el correo, la fila y la tarjeta, la API, el espejo del panel con la plantilla, la huella y lo que se vigila. Al día §9, §11.1, §12.1 y §12.7. La v1.3 queda marcada «Sustituido por v1.4» (su única modificación) |
| `docs/AJILEI_Invariantes_v1.0.md` | **INV-78,** vigilada y parcial. Recuento de 78 filas, 71 vigiladas y 21 parciales. Las fuentes pasan a la v1.4. §4 y la fila de `diagDSK cfg` al día: 21 puertas, 5 min 26 s |
| `docs/reportes/AJILEI_CFG-1_Cierre_v1.0.md` | Las cinco sub-tandas y la «1f» convertida en TIE-1 1a. **Lleva «(pendiente)»** en los SHA de la 1d, las varas finales y las pruebas B y C |

**La invariante es nueva** y no una ampliación de INV-67: esta habla de los rankings, y la regla del correo también vive en el perfil, la hoja y el servidor.

**Una corrección a lo que iba a escribir:** en un primer borrador puse que «fuera de la tarjeta y del aviso el correo va enmascarado». Es falso: el mini-perfil propio lo enseña completo («solo tú lo ves»), desde RNK-1. La INV-78 lo dice bien, y no se cambia nada del producto.

**Una corrección al STOP-D1:** dije «22 de 22 puertas» de `cfg`. Son 21 puertas y la consola. Ya está corregido arriba.

## 4 · Lo que no está

- **El «estilo de la casa» de la plantilla:** no vi las de la casa (§1).
- **Las citas a la v1.3** de `docs/AJILEI_Tienda_v1.2.md:274` y `docs/AJILEI_Menu_Utilidades_v1.7.md:21` se quedan: la §13 no cambió.
- **El vencimiento real de 10 minutos** no está en la Prueba C. Si Victor quiere verlo: pedir un cambio, esperar 10 minutos con el perfil abierto y comprobar que el «Pendiente» se apaga solo, y luego usar la cuenta desechable como en el paso 16.

## 5 · Estado del árbol

- **Nuevos desde el STOP-D1:** `docs/AJILEI_Configuracion_v1.4.md`, `docs/reportes/AJILEI_CFG-1_Cierre_v1.0.md`.
- **Modificados desde el STOP-D1:** `docs/AJILEI_Configuracion_v1.3.md`, `docs/AJILEI_Invariantes_v1.0.md` y este informe.
- **Lista de borrado para Victor, tras los commits:** la carpeta `laminas/cfg1d/` entera (no va en ningún commit).
- **Fuera de la tanda, no se tocan:** lo de MOT-1 (dos informes y `laminas/mon1/`).
- **Protegidos:** ninguno tocado.

**STOP-D2.** Aprobado por el rector, con el resultado de §6.

## 6 · El resultado de las pruebas (Victor, con servidor real)

| Prueba | Resultado |
|---|---|
| **A** · PC con bypass | Al 100 % (STOP-D1) |
| **B** · S25 por túnel con `test1976` | Al 100 %. **El teclado real deja «Continuar» y «Cancelar» a la vista.** No se cambió el correo |
| **C** · cuenta desechable `borrame1d` | Al 100 %, **con una variación** (abajo) |
| **Plantilla** | Pegada y guardada en el panel: **cumplida la condición del push** |

### La variación de la Prueba C

Victor confirmó **a la primera, con los dos códigos buenos**, así que los pasos 6 a 10 de la tabla se saltaron. Para recuperarlos hizo **un segundo cambio** a un tercer alias, `victorjlcm32+borrar1dotro@gmail.com`.

| Cambio | Qué se vio |
|---|---|
| **1.º** · `+borrar1d` → `+borrar1dnuevo` | Dos correos en español, con «De» y «A» bien. Cambio hecho |
| **2.º** · `+borrar1dnuevo` → `+borrar1dotro` | El pendiente sobrevive a recargar. Dos códigos inventados: los dos en rojo. Uno bueno y otro malo: solo el malo en rojo y el bueno aceptado. **«Reenviar» contra el servidor real:** campos vacíos, el aviso y dos correos nuevos. Con los códigos nuevos, «Listo: desde ahora entras con victorjlcm32+borrar1dotro@gmail.com» |
| **Después** | Cerrar sesión y entrar con `+borrar1dotro` **sin que pida nombre**. La dirección de `test1976`: «Ese correo ya tiene una cuenta». «Eliminar cuenta» lleva a la Portada |

**La variación da más cobertura que la tabla:** la cuenta cambió de correo dos veces.

### La huella, en la base real

La consulta se corrió en los cuatro momentos:

| Lectura | Valor, de principio a fin |
|---|---|
| Bonos en total | **6** |
| Esa huella | **1** |
| Disparadores propios en `auth.users` | **ninguno** |
| `test1976` | Intacta: 24.950 HC, 127 movimientos |
| `borrame1d` | Siempre saldo 0 y 0 bonos; al final, borrada |

**Lo que eso demuestra:** cambiar de correo no creó ninguna huella ni cobró ningún bono, y en la base real no hay disparadores en `auth.users`. Los tres alias comparten huella, así que el caso de dos huellas distintas sigue medido solo en PGlite (§2).

### Lo que estas pruebas no cubrieron

- **El vencimiento real de 10 minutos:** no se esperó. Lo cubren el arnés y `OTP_EXP_S`.
- **iOS:** pendiente (informe de cierre).

## 7 · Observación del rector: «Próximo cambio: 2 de diciembre» en una cuenta recién bautizada

**Lo pedido:** decir, solo leyendo, si el freno cuenta desde el Bautizo por diseño (1b) o por descuido, con la línea que lo causa. No se ha cambiado nada.

**Cerrada: es el comportamiento correcto (INV-72).** Victor confirma que en la Prueba C cambió el nombre desde el perfil (`crroecambio1` → `borrame1d`). El freno se puso por ese cambio y no por el Bautizo, que no pone ninguno. No se toca código.

**Lo que dice el código:**

| Dónde | Qué hace |
|---|---|
| `supabase/migrations/20261030013000_cfg1b_perfil.sql:139-141` | **En un `INSERT`, `nombre_cambiado_en := null`.** El Bautizo es un `INSERT` (`src/lib/perfilApi.js:48`, llamado desde `src/hooks/useAuth.js:365`, con `src/App.jsx:849`) |
| `…cfg1b_perfil.sql:159` | **El único sitio que pone la fecha:** un `UPDATE` con un nombre de verdad distinto |
| `…cfg1b_perfil.sql:203` | `mi_proximo_cambio` no devuelve nada si la fecha es nula |
| `src/screens/Perfil.jsx:201` y `:213` | «Próximo cambio» sale solo si el servidor dio una fecha. El cliente no suma días |
| `src/screens/Perfil.jsx:292` → `src/hooks/useAuth.js:391` | **El único `UPDATE` de nombre de toda la app.** Ninguna migración ni Edge Function escribe en `profiles`, y el otro `actualizar` (`useAuth.js:422`) es el del lugar |

**Es además lo que estaba decidido y medido:**
- **INV-72:** «no cuenta el alta».
- **Configuración v1.4 §12.6:** «en el alta la columna nace nula».
- **La ficha de la 1b, §2:** el freno se diseñó sobre el `UPDATE` («Si el cambio pasa, escribe…»).
- **El guion:** B9 de `supabase/pruebas/cfg1b_verificacion.sql`, 18/18 en la base real el 2026-10-30.

**Lo reproduje** con todas las migraciones en PGlite, con el rol y el JWT del cliente:

| Paso | `nombre_cambiado_en` | `mi_proximo_cambio` |
|---|---|---|
| Bautizo | nula | nada |
| Elegir país | nula | nada |
| Solo mayúsculas | nula | nada |
| Un nombre de verdad nuevo | hoy | hoy + 30 días |

**La línea que lo causó:** `…cfg1b_perfil.sql:159`, al guardar `borrame1d` desde el perfil. De ahí sale «Próximo cambio: 2 de diciembre».

**Una consecuencia para §6:** la cuenta se bautizó `crroecambio1` y pasó a llamarse `borrame1d` durante la prueba.
