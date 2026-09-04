# AJILEI · SUP-2b — La puerta: pantallas y flujo de autenticación

**Versión:** 1.0
**Fecha:** 2026-08-27
**Estado:** Aprobado por Victor. Segunda sub-tanda del paso 3. Prerequisitos cumplidos: SUP-1 (cliente) y SUP-2a (esquema ejecutado y verificado en la base real; OTP configurado: 6 dígitos, 600 s).

---

## ⚠️ Restricciones globales

- `docs/AJILEI_Protegidos_v1.0.md` vigente — ninguno se toca. Si el flujo de arranque de la app resultara pasar por un protegido, **STOP y reporte**.
- Aditivo-only; O1 (nada aparece/desaparece a mitad de transición sin espacio reservado); autoridad visual `AJILEI_Sistema_Diseno_v1.2.md` (oro único `--gold-brand`).
- Ningún secreto ni bypass en código versionado. Commits atómicos por ruta explícita. Sin push hasta orden.
- Textos en español venezolano, tono de la casa.

## Decisiones selladas que esta tanda materializa

1. Cuenta obligatoria para jugar. Sin modo invitado (el panel ya lo refleja: anonymous sign-ins apagado).
2. Entrada por **código al correo** (OTP 6 dígitos, vigencia 10 min). Google llega en SUP-3 — dejar el hueco visual si es trivial, sin construir nada.
3. Username 6–15, mutable, único case-insensitive — **la base ya valida todo**; la app no duplica reglas: intenta y traduce el error. Los tres códigos son contrato: `23514` formato · `P0001` vedado · `23505` duplicado.
4. El ID es contrato, el username es rótulo: toda referencia interna usa `auth.uid()`.

---

## 0 · Fase 0 — Diagnóstico de solo lectura

1. **Arranque y navegación:** cómo monta la app sus pantallas hoy (¿router? ¿estado en App.jsx?), dónde vive la decisión menú-vs-mesa, y cuál es el punto natural para interponer una puerta sin tocar protegidos.
2. **El arnés:** inventario de modos que arrancan la app y qué asumen del primer render. Confirmar que un bypass por variable de entorno los deja intactos.
3. **El ⋮:** dónde se registran sus entradas (para añadir "Cuenta / Cerrar sesión").
4. **Distribución actual de `.env`:** confirmar que `import.meta.env` distingue dev de build de producción (`import.meta.env.DEV`).
5. Reportar y esperar OK.

---

## 1 · Arquitectura del flujo

### 1.1 Estados de sesión (fuente única)

Un hook/módulo `useAuth` (o equivalente) que derive UN estado de tres posibles, escuchando `supabase.auth.onAuthStateChange`:

- `SIN_SESION` → pantalla Entrada.
- `SESION_SIN_PERFIL` (hay usuario, no hay fila en `profiles`) → pantalla Bautizo.
- `COMPLETO` (sesión + perfil) → la app tal como existe hoy, sin cambio alguno.

La consulta del perfil se hace una vez por arranque/cambio de sesión, por `id = auth.uid()`.

### 1.2 Bypass de desarrollo (crítico para el arnés)

- Variable `VITE_AUTH_BYPASS` leída SOLO si `import.meta.env.DEV` es verdadero. Con `VITE_AUTH_BYPASS=1` en `.env.local`, el estado salta directo a `COMPLETO` con un perfil ficticio local (`username: "DevLocal"`, id fijo de desarrollo). 
- En build de producción la rama ni se evalúa: la condición `DEV` la corta. Documentarlo en comentario.
- `.env.example` gana la línea `VITE_AUTH_BYPASS=` con comentario explicando su uso; el valor real vive solo en `.env.local` de Victor.
- El arnés no cambia: hereda el bypass del entorno.

### 1.3 Pantalla Entrada (`src/screens/Entrada.jsx` + css propio)

- Composición sobria de marca: isotipo con su resplandor (reutilizar la pieza EMB-1 existente), fondo del verde fieltro del sistema, campo de correo, botón dorado "Enviar código".
- Acción: `signInWithOtp({ email, options: { shouldCreateUser: true } })` — crea la cuenta si no existe; para el usuario, entrar y registrarse son el mismo gesto.
- Tras enviar: la misma pantalla pasa a modo código — mensaje "Te enviamos un código a {correo}", seis casillas (o campo único de 6 dígitos, a criterio contra el sistema de diseño), botón "Entrar", enlace "Reenviar código" con cuenta regresiva de 60 s (el límite de reenvío de Supabase), y "Cambiar correo" para volver.
- Verificación: `verifyOtp({ email, token, type: 'email' })`. Error → mensaje claro ("Código incorrecto o vencido — pide uno nuevo"), sin tecnicismos.
- Estados de carga visibles en el botón (deshabilitado + texto), nunca doble envío.

### 1.4 Pantalla Bautizo (`src/screens/Bautizo.jsx` + css propio)

- Un solo propósito: elegir username. Mismo lenguaje visual de Entrada.
- Campo + regla visible ("6 a 15 caracteres: letras, números y guion bajo"), botón "Confirmar".
- Acción: `insert` en `profiles` con `{ id: auth.uid(), username }`. **Sin validación duplicada en el cliente** más allá de largo/charset para feedback inmediato al teclear — la autoridad es la base.
- Traducción de errores por código: `23514` → "Debe tener entre 6 y 15 caracteres, solo letras, números y guion bajo" · `P0001` → "Ese nombre no está permitido — prueba otro" · `23505` → "Ese nombre ya está tomado". Cualquier otro → mensaje genérico + reintentar.
- Al lograr el insert → `COMPLETO`, entra al menú del juego.

### 1.5 El ⋮ gana "Cuenta"

- Nueva entrada en el menú: muestra el username actual y ofrece "Cambiar nombre" (misma pantalla/modal de Bautizo en modo edición — el UPDATE pasa por las mismas cerraduras y la misma traducción de errores) y "Cerrar sesión" (`signOut()` → estado `SIN_SESION`).
- Respetar el patrón existente del panel (compacto, tooltips, z del patrón carta-voladora).

### 1.6 Lo que esta tanda NO hace

- Nada de saldo ni economía (ECO-1). Nada de Google (SUP-3). Nada de landing (`/` sigue siendo la app tal cual se sirve hoy). Ninguna alteración del juego una vez en `COMPLETO`: mesa, niveles, celebración — intactos byte a byte.

---

## 2 · Verificación

1. **Con bypass** (`VITE_AUTH_BYPASS=1`): la app arranca directo al menú como hoy; arnés completo verde sin cambios; una mano jugada de punta a punta.
2. **Sin bypass** (quitar la variable): arranca en Entrada. Flujo real con el correo de Victor: código llega, 6 dígitos, vigencia; bautizo con username inválido de cada familia (ver los tres mensajes traducidos) y uno válido; recarga de página → sigue adentro (persistencia de sesión); cerrar sesión → Entrada.
3. **Cambio de nombre** desde el ⋮: a uno válido (pasa) y a uno tomado (mensaje de duplicado).
4. Anti-secreto sobre el diff staged; los cinco protegidos intactos; lint en línea base.

Nota operativa para las pruebas: el correo incorporado de Supabase en plan Free permite muy pocos envíos por hora — dosificar los intentos reales; el resto de la iteración visual se hace con bypass.

---

## 3 · Commit

- Por rutas explícitas de lo creado/tocado. Mensaje: `feat(sup): puerta de entrada — OTP por correo, bautizo de username y cuenta en el menu (SUP-2b)`
- Sin push hasta orden.

---

*Confirmar comprensión; reportar Fase 0 completa y esperar OK antes de escribir.*
