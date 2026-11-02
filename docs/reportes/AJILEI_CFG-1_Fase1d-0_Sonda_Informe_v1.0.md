# AJILEI · CFG-1 · Fase 1d · Bloque 0 · Sonda · Informe v1.0 · STOP-0

**Fecha:** 2026-11-01. **Base:** `main` en `859b27f`. **Ficha:** `AJILEI_CFG-1_Fase1d_v1.0.md` §2.
**Escrituras:** solo este informe. Nada en `src/`, `supabase/` ni la base. No se mandó ningún correo.

---

## Veredicto

| Punto | Veredicto | Consecuencia |
|---|---|---|
| **D-a · códigos dentro de la app** | **Sí, limpios** | Hay un código por dirección, se confirman en cualquier orden y no hace falta salir de AJILEI. |
| **D-b · «Cancelar» real** | **Desde el cliente, no.** Con una Edge Function y la API de administración, sí según el fuente, sin probar | **Decisión 1**, §4. Por esto se detiene la tanda. |
| **D-c · límite medido** | **No medido.** Los valores solo se ven en el panel y medirlos exige mandar correos | No frena el diseño, porque cualquier límite cae en el motivo `limite`. Victor lee los valores (§5). |

**De dónde sale cada respuesta.** Todo sale de leer código, no de una prueba contra el servidor:
- El servidor del proyecto dice ser **GoTrue v2.197.0** (`GET /auth/v1/health`).
- Se leyó el fuente de esa etiqueta (`supabase/auth`) y el SDK instalado (`@supabase/auth-js` 2.112.4).
- `/settings` confirma `mailer_autoconfirm: false`. No expone «Secure email change», así que ese dato sigue siendo la comprobación de Victor del 2026-10-29.
- La primera prueba real será la Prueba C (STOP-D2).

---

## 1. Respuestas S-1…S-9

### S-1 · Códigos con «Secure email change»: sí, uno por dirección

- **Se manda un correo a cada dirección**, cada uno con su código y **con la misma plantilla y el mismo asunto** (`templatemailer.go:257-315`).
- En la plantilla, `{{ .Token }}` vale el código de quien recibe ese correo. También existen `{{ .Email }}` (la actual), `{{ .NewEmail }}` y `{{ .SendingTo }}` (el destinatario).
- `{{ .SendingTo }}` está en el fuente (`:305`), pero la guía oficial de plantillas no la menciona.
- **Se confirma con `verifyOtp({ email, token, type: 'email_change' })`, una vez por dirección y en cualquier orden** (`verify.go:546-583`).
- **El `email` debe ser el de la dirección que recibió ese código**, porque el código se comprueba con un hash de correo + código (`verify.go:79`, `mail.go:535`, `:542`). Si se cruzan, el servidor responde «inválido».

| Paso | Respuesta del servidor | Qué ve el SDK |
|---|---|---|
| Primer código bueno | 200 `{ msg, code: "200" }` (`verify.go:294-298`) | `{ user: null, session: null, error: null }` (`lib/fetch.js:135-147`) |
| Segundo código bueno | Correo cambiado y **sesión nueva** (`verify.go:285`, `:623`) | `session` llena y evento `SIGNED_IN` |

### S-2 · La plantilla vive solo en el panel

`supabase/config.toml` solo tiene `project_id` y el ajuste de `eliminar_cuenta`, y no existe `supabase/templates/`. Tampoco hay copia en `docs/`. No se ha visto la plantilla actual. Si sigue la de fábrica, lleva un enlace y **no lleva código**: hay que cambiarla antes de la Prueba C.

### S-3 · El estado pendiente

- `user.new_email` y `user.email_change_sent_at` (`models/user.go:51-52`) están en `auth.users`, así que **sobreviven a cerrar la app**.
- `getUser()` es la lectura fiable. `session.user` solo se actualiza en el aparato que hizo `updateUser` (`GoTrueClient.js:2845-2876`).
- **Trampa: `new_email` no se borra cuando el código vence.** Sin una regla en el cliente, la fila diría «Pendiente» para siempre (§3, H-1).

### S-4 · Reenviar y cancelar

**Reenviar: sí existe.** Es `auth.resend({ type: 'email_change', email })`, con tres trampas:
- **`email` tiene que ser el correo ACTUAL** (`resend.go:88`). Con el nuevo no encuentra al usuario y responde **200 sin mandar nada** (`:93-96`).
- **Genera dos códigos nuevos y vuelve a cero** (`mail.go:532-547`): mueren los dos anteriores, incluso uno ya aceptado. La tarjeta tiene que vaciar los dos campos.
- Le aplica la espera de 60 s por usuario (`mail.go:528`).

**Cancelar: no hay nada para el cliente.**
- `updateUser({ email: actual })` no hace nada: no manda correo ni borra lo pendiente (`user.go:251`).
- `updateUser({ email: otra })` sustituye lo pendiente; no lo cancela.
- **La API de administración sí lo borra.** `PUT /admin/users/{id}` con `email` llama a `ClearAllPendingTokens` (`admin.go:351-355`, `models/user.go:360-395`). El comentario del fuente lo describe como limpieza de seguridad al reasignar un correo, no como «cancelar», y la documentación no lo ofrece como tal.

**Caducidad:** el código vive lo que diga `OtpExp` (`verify.go:785-794`), con el mismo reloj para los dos códigos. Por defecto son 86.400 s (`configuration.go:1202-1203`), pero **el valor real está en el panel**.

### S-5 · Errores y su motivo

| Caso | Respuesta | Motivo |
|---|---|---|
| Formato inválido | 400 `validation_failed` (`mail.go:717-718`) | `invalido` |
| Rechazado por el validador de correo | 400 `email_address_invalid` (`mail.go:926`) | `invalido` |
| El mismo correo | **200 sin error y sin envío** (`user.go:251`) | `mismo`, **solo lo detecta el núcleo** |
| Ya registrado por otra cuenta | 422 `email_exists` (`user.go:134-138`) | `en_uso` |
| Código incorrecto, o de otra dirección, o ya usado | 403 `otp_expired` (`verify.go:779`) | `codigo_mal` |
| Código vencido | **El mismo 403 `otp_expired`** (`verify.go:785-794`) | Ver H-2 |
| Demasiados intentos | 429 `over_request_rate_limit`, por IP (`/verify`: 30 cada 5 min, docs) | `limite` |
| Espera entre envíos | 429 `over_email_send_rate_limit`, «…after N seconds» (`mail.go:724-728`, `errors.go:258`) | `limite` |
| Límite de envíos del proyecto | 429 `over_email_send_rate_limit`, «email rate limit exceeded» (`mail.go:806`) | `limite` |
| Fallo de red o tope | `esFalloDeRed` / `conTope`, como hoy (`useAuth.js`) | `red` |

**No existe un contador de intentos por código:** «demasiados intentos» solo llega como el 429 por IP.

### S-6 · Límite de envíos: los valores reales solo se ven en el panel

| Límite | Valor conocido | Fuente |
|---|---|---|
| Espera por usuario | 60 s por defecto | `configuration.go:1211-1212` |
| Envíos del proyecto | 30/h en el fuente; 2/h con el correo de Supabase y configurable con SMTP propio | `configuration.go:466`, [docs](https://supabase.com/docs/guides/auth/rate-limits) |
| `/user` y `/resend` | 30 cada 5 min por IP | docs |

Un cambio cuenta **una vez** en el límite del proyecto (`mail.go:806`), pero son **dos correos** para el cupo de Resend.

### S-7 · La huella y los disparadores: nada reacciona al cambio

- **Ninguna migración crea un disparador sobre `auth.users`**, y ninguna política ni función usa `auth.email()` o `auth.jwt()`.
- `auth.users.email` solo se lee una vez, en `abrir_billetera` (`eco1a_libro.sql:590`), que corre **al insertar en `profiles`** (`:648-650`). Cambiar de correo no la dispara, así que la huella ni se recalcula ni se duplica.
- `eliminar_cuenta` saca el uid del token y no mira el correo (`functions/eliminar_cuenta/index.ts:7-15`). Borra bien una cuenta cuyo correo cambió, también con un cambio pendiente.
- **La «Edge Function de sugerencias» no existe:** sugerencias es un `mailto:` (`HojaConfiguracion.jsx:160`). En `supabase/functions/` solo están `eliminar_cuenta` y `sonda_mot1`.
- **No hace falta migración.**
- **Límite de esta respuesta:** se leyó el repo, no la base viva. La consulta de §5 lo cierra en un minuto.

### S-8 · Dónde se lee hoy el correo propio

- **Solo de la sesión:** `useAuth.js:437` (`sesion?.user?.email`) → `App.jsx:889` → hoja ⚙, Perfil, mini-perfil, Rankings y mesa.
- **No está en `profiles`** (`perfilApi.js:16`: `id, username, pais, estado`). La app tampoco lo guarda en el aparato; solo el propio SDK guarda la sesión.
- **Al completarse el cambio:** llega una sesión nueva con el evento **`SIGNED_IN`, no `USER_UPDATED`** (`GoTrueClient.js`, `verifyOtp`). `useAuth.js:174-183` acepta cualquier evento con sesión, así que `correo` se actualiza solo. El uid no cambia, así que no se relee el perfil ni se expulsa al jugador.
- **Otros aparatos** enseñan el correo viejo hasta su siguiente refresco de token. No afecta a nada más: ningún dato de la base depende del correo del token.

### S-9 · Cuentas sin contraseña: no se exige nada más

El camino del correo solo pide MFA o bloquea SSO (`user.go:106-108`, `:125`), y este proyecto no usa ninguno de los dos. La reautenticación es solo para contraseñas (`user.go:154`).

---

## 2. Lo que esto cambia en la API de 1d-i

**`confirmar` manda siempre los dos códigos, sin cortar al primer fallo, y el éxito es que vuelva una sesión.** El cliente no puede saber si un código ya se aceptó, porque `email_change_confirm_status` no sale en la API (`models/user.go:53`).

| Situación | Actual | Nuevo | Resultado |
|---|---|---|---|
| Los dos bien | ok | ok | Hecho |
| Uno bien, otro mal | ok | mal | Se marca el malo; el bueno ya quedó aceptado |
| Reintento tras lo anterior | mal (ya usado) | ok | **Hecho**, aunque el primero falle |

**Códigos cruzados entre campos.** Si los dos fallan, se prueban una vez al revés antes de dar el error. Son cuatro llamadas como máximo, contra un límite de 30 cada 5 min. Pasará sobre todo con dos alias en el mismo Gmail, como en la Prueba C.

---

## 3. Hallazgos que la ficha no preguntaba

- **H-1 · El «Pendiente» eterno.** Hace falta una regla: la fila vuelve a `normal` cuando `email_change_sent_at + OTP_EXP` ya pasó. Eso obliga a tener en el núcleo una constante con el valor del panel. Si alguien lo cambia en el panel, hay que cambiarla también.
- **H-2 · `codigo_mal` y `codigo_vencido` son la misma respuesta.** El servidor no los distingue. Con la misma constante, el cliente puede decir «vencido» si ya pasó el plazo e «incorrecto» si no. Sigue habiendo un caso impreciso: un código viejo, sustituido por un reenvío, sale como «incorrecto». Mantengo los dos mensajes de la ficha.
- **H-3 · El aviso de «Eliminar cuenta» deja de ser cierto.** `lob.eliminar.aviso.correo` dice «Si vuelves a registrarte con este correo, empezarás de cero y sin bono». Con A→B→eliminar→registrarse con B **sí hay bono**, porque la huella de B nunca se escribió. No es un abuso nuevo, ya que registrarse con B directamente daría lo mismo, y §0 se cumple. Lo que falla es el texto (**Decisión 3**).
- **H-4 · Entrar con el correo viejo crea otra cuenta.** Tras A→B, entrar con A crea una cuenta nueva y vacía (`shouldCreateUser: true`, `useAuth.js:325-328`), con Bautizo y sin bono. Es coherente, pero puede sorprender a quien olvide el cambio. Lo dejo escrito; no propongo cambiarlo.
- **H-5 · Fila enmascarada o completa.** La 1b sella «el correo enmascarado» (`Perfil.jsx:194`, `:219`), y V1 de esta ficha pide «la dirección actual». Es una contradicción (**Decisión 2**).
- **H-6 · Dos cuentas pueden pedir la misma dirección.** El duplicado solo se comprueba al pedir el cambio (`user.go:134`). Si otra cuenta ocupa esa dirección antes de confirmar, se espera un error del servidor, que caería en `desconocido`. No leí el índice que lo impediría; es un caso muy raro.
- **H-7 · Un fallo a medias.** Los dos correos salen en paralelo y basta un fallo para devolver error (`templatemailer.go:309-322`). Un correo puede haber llegado aunque el cambio no quedó guardado. El jugador lee «no se pudo enviar» y reintenta; el código de ese correo no sirve.

---

## 4. Decisiones para el rector y Victor

### Decisión 1 · «Cancelar»

| | **A · Cancelar real** (recomendada) | **B · Sin «Cancelar»** |
|---|---|---|
| **Cómo** | Edge Function nueva con el molde de `eliminar_cuenta`: el uid sale del token, el correo actual se lee en el servidor y se llama a `updateUserById(uid, { email: actual, email_confirm: true })` | Se quita el botón. Queda «Usar otro correo» y lo pendiente se apaga al vencer el código |
| **Para el jugador** | El botón de D-b, tal como se decidió | Si se equivocó de dirección, la corrige, pero no puede volver a «sin cambios» hasta que venza |
| **Coste** | Una función más, con su despliegue por Victor y un paso más en la Prueba C | Ninguno en el servidor |
| **Riesgo** | Se apoya en un efecto del código, no en una función documentada de «cancelar» | Contradice D-b; si `OTP_EXP` es largo, el «Pendiente» dura mucho |

Si se elige A, hay tres efectos que conviene aceptar a sabiendas:
- **Se borran también otros códigos pendientes de esa cuenta**, como uno de inicio de sesión pedido en otro aparato. El jugador tendría que pedirlo de nuevo.
- **Se reescribe `email_confirmed_at`** con la hora del cancelar (`models/user.go`, `Confirm`). Sin `email_confirm: true` la identidad quedaría como no verificada. Nada en AJILEI lee ese dato.
- **Se abre un agujero que hay que cerrar.** Cancelar pone a cero `email_change_sent_at`, y con él la espera de 60 s. Cancelar y pedir en bucle permitiría mandar correos a una dirección ajena y gastar el cupo de todo el proyecto, inicios de sesión incluidos. **La función debe negarse a cancelar durante los 60 s siguientes al último envío**, con el motivo `limite`.

La función comprobaría después que `new_email` quedó vacío, y si no, devolvería un motivo de fallo: así, si Supabase cambia ese efecto, el botón no miente.

**Por qué recomiendo A:** cumple D-b sin migración y sin tocar `auth.users` a mano. **Descartado:** una función SQL que escriba en `auth.users` (obligaría a una migración sobre un esquema ajeno) y un «Cancelar» que solo esconde (D-b lo prohíbe).

### Decisión 2 · La fila del correo (H-5)

Recomiendo **enmascarada en la fila** (`v•••@gmail.com`, como en la 1b) **y completa dentro del editor**, porque la fila queda a la vista de quien esté al lado cada vez que se abre el Perfil, y el editor es donde hace falta leerla entera. La ficha dice otra cosa, así que la lámina dibuja lo que se decida aquí.

### Decisión 3 · El aviso de «Eliminar cuenta» (H-3)

Recomiendo ajustar el texto para que sea cierto siempre, por ejemplo: «Si vuelves a registrarte con el correo con el que empezaste, no tendrás bono de nuevo». Toca un texto de la 1c: es poco, pero queda fuera de lo que esta ficha pide.

---

## 5. Lo que Victor mira en el panel (solo leer)

| Dato | Dónde | Para qué |
|---|---|---|
| **Caducidad del código** (Email OTP Expiration) | Auth → Sign In / Providers → Email | La constante de H-1 y H-2 |
| **Intervalo mínimo por usuario** | Auth → Rate Limits | La espera visible de «Reenviar» |
| **Límite de envíos por hora** | Auth → Rate Limits | D-c |
| **Plantilla «Change Email Address»: ¿lleva `{{ .Token }}`?** | Auth → Email Templates | Se reescribe en 1d-ii |
| **Aviso «Email address changed»: ¿encendido?** | Auth → Email Templates / notificaciones | Si está encendido, al correo viejo le llega otro mensaje con su propia plantilla, **quizá en inglés** |

Consulta de solo lectura para el SQL Editor, que cierra S-7 contra la base viva. Lo esperado es **cero filas en las dos**:

```sql
select tgname, pg_get_triggerdef(oid)
from pg_trigger
where tgrelid = 'auth.users'::regclass and not tgisinternal;

select n.nspname, p.proname
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.prosrc ~* 'auth\.email\(\)|auth\.jwt\(\)|\.email\M'
  and p.proname <> 'abrir_billetera';
```

---

## 6. Lo que no se comprobó

- **Nada se probó contra el servidor real.** La sonda era de solo lectura, y un cambio real manda correos. Si hay una diferencia entre el fuente y el servidor del proyecto, aparecerá en la Prueba C, después de construir.
- **Cancelar por la API de administración** sale del fuente, sin ejecutar.
- **Etiqueta y despliegue.** Se da por hecho que el fuente de `v2.197.0` es lo que corre. `supabase/.temp/gotrue-version` dice `v2.196.0`, que es un valor guardado en el `link`; se tomó como buena la respuesta de `/health`.
