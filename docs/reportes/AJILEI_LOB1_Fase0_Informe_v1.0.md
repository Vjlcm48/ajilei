# AJILEI · LOB-1 · Fase 0 · Informe

**Fecha:** 2026-09-04
**SHA de partida:** `e75adf1327c150a89f10967b709b39e130522abd` (`e75adf1` — *GT-HIG: handle y cancelacion para los siete relojes que FRZ-1 dejo en cola*)
**Rama:** `main`
**Punto de partida esperado:** verificado. `git merge-base --is-ancestor 3ea2e27 HEAD` → **3ea2e27 ES ancestro de HEAD**, así que el árbol está en `3ea2e27` o posterior tal como la instrucción exige.
**Protegidos:** ninguno de los cinco de `docs/AJILEI_Protegidos_v1.0.md` §2 se abrió. Dos preguntas rozaron uno y se resolvieron sin abrirlo; se declaran en «Requiere autorización».

---

## P1 · Gate de autenticación

### 1.1 Dónde viven los tres estados

**Ruta:** [src/hooks/useAuth.js:25-37](src/hooks/useAuth.js#L25-L37)

```js
// ── Los tres estados del §1.1 ───────────────────────────────────────────────
export const SIN_SESION = 'SIN_SESION'
export const SESION_SIN_PERFIL = 'SESION_SIN_PERFIL'
export const COMPLETO = 'COMPLETO'

// ── …y el cuarto, que el documento no nombra y la realidad exige ────────────
// `getSession()` es asíncrono: entre el primer render y su respuesta hay uno o
// más fotogramas en los que TODAVÍA NO SE SABE si hay sesión. […]
export const CARGANDO = 'CARGANDO'
```

**Lectura:** los estados no son tres sino **cuatro**. `CARGANDO` es tan real como los otros y se pinta primero en todo arranque con sesión viva; LOB-1 tiene que contar con él porque es el estado que ocupa el hueco antes de que el lobby pueda existir.

El estado es **derivado**, nunca sincronizado por efecto — [src/hooks/useAuth.js:163-169](src/hooks/useAuth.js#L163-L169):

```js
  const estado = AUTH_BYPASS
    ? COMPLETO
    : sesion === undefined ? CARGANDO
    : sesion === null ? SIN_SESION
    : perfil === undefined ? CARGANDO
    : perfil === null ? SESION_SIN_PERFIL
    : COMPLETO
```

**Lectura:** `COMPLETO` se alcanza por dos caminos distintos —bypass, o sesión + perfil resueltos— y ambos desembocan en el mismo punto de la cascada de `App`.

### 1.2 Qué se renderiza hoy cuando el estado es COMPLETO

**No hay un `return` etiquetado `COMPLETO`.** `COMPLETO` ni siquiera se importa en `App.jsx`: es la **caída** de la cascada de `if`. Se comprueba en [src/App.jsx:9](src/App.jsx#L9) —el import trae `AUTH_BYPASS, CARGANDO, SIN_SESION, SESION_SIN_PERFIL`, y `COMPLETO` no está—.

La cascada, en [src/App.jsx:74-87](src/App.jsx#L74-L87):

```jsx
  if (auth.estado === CARGANDO) return null

  if (auth.estado === SIN_SESION) {
    return <Portada onEnviarCodigo={auth.enviarCodigo} onVerificar={auth.verificarCodigo} />
  }

  if (auth.estado === SESION_SIN_PERFIL) {
    return <Bautizo onConfirmar={auth.crearPerfil} onCerrarSesion={auth.cerrarSesion} />
  }
```

A partir de la línea 88 **todo lo que queda es `COMPLETO`**, y el primer render de ese tramo es el último `return` del archivo — [src/App.jsx:144](src/App.jsx#L144):

```jsx
  return <WelcomeScreen onSelectMode={() => setScreen('nivel-select')} cuenta={cuentaLobby} />
```

**Lectura:** el destino de `COMPLETO` es **`WelcomeScreen`**, porque `screen` arranca en `'welcome'` ([src/App.jsx:44](src/App.jsx#L44)) y los tres `if` de pantalla (`table`, `mode-select`, `nivel-select`) no se cumplen en el primer render. **Éste es el punto exacto de inserción de LOB-1:** el lobby entra entre la línea 106 (`cuentaLobby`) y la línea 108 (`if (screen === 'table')`), o bien como un nuevo valor del propio `screen` situado antes de `'welcome'`.

### 1.3 Cómo se navega en la app

**Mecanismo: `useState` en `App.jsx`. No hay router.** Está declarado por escrito en [src/App.jsx:21-23](src/App.jsx#L21-L23) y [src/App.jsx:34-37](src/App.jsx#L34-L37):

```
// El paso de pantallas se mantiene con el MISMO patrón que ya usaba el
// proyecto: un `screen` en estado local, sin router. No se reorganizan rutas
// porque no hay rutas que reorganizar.
[…]
// POR QUÉ AQUÍ Y NO EN UN ROUTER. No hay router que interponer, y meter uno para
// esto habría sido reorganizar el recorrido entero para colgar de él dos
// pantallas. El patrón de la casa es un estado y una cascada de `if`; la puerta
// habla ese idioma.
```

El estado que gobierna, en [src/App.jsx:44](src/App.jsx#L44):

```jsx
  const [screen, setScreen] = useState('welcome') // 'welcome' | 'nivel-select' | 'mode-select' | 'table'
```

**Archivo que lo gobierna:** `src/App.jsx`, único. Confirmado además por ausencia: `package.json` no declara `react-router` ni ninguna otra dependencia de rutas — las cuatro dependencias de producción son `@supabase/supabase-js`, `howler`, `react` y `react-dom` ([package.json:13-18](package.json#L13-L18)).

Los cuatro estados de `screen` se resuelven en cascada descendente: `table` (l. 108), `mode-select` (l. 120), `nivel-select` (l. 134), y `welcome` como caída (l. 144). El único ascensor hacia arriba es `onBack`.

### 1.4 Flag o bypass que altera ese destino en dev

**Sí, `VITE_AUTH_BYPASS`.** Se lee en un solo sitio — [src/hooks/useAuth.js:50](src/hooks/useAuth.js#L50):

```js
export const AUTH_BYPASS = Boolean(import.meta.env.DEV && import.meta.env.VITE_AUTH_BYPASS)
```

**Puerta doble:** exige `import.meta.env.DEV` **y** la variable. Bajo `vite build` la rama entera se cae del bundle.

**Está ACTIVO en este árbol.** `.env.local:5` → `VITE_AUTH_BYPASS=1`. Consecuencia medida y documentada por el propio arnés de PUE ([scripts/diagPUE.mjs:10-15](scripts/diagPUE.mjs#L10-L15)): contra `npm run dev` (5173) la Portada **no existe** y la app arranca directa en la Bienvenida con el perfil ficticio `DevLocal`.

El bypass tiene además un **segundo efecto sobre el lobby**, y éste sí es de LOB-1 — [src/App.jsx:100-106](src/App.jsx#L100-L106):

```jsx
  // EL BYPASS APAGA EL ACCESO DE LA BIENVENIDA, Y SÓLO ÉSE. […] su razón es una
  // sola: que los 20 arneses vean la Bienvenida byte-idéntica a la de hoy.
  const cuentaLobby = AUTH_BYPASS ? null : cuenta
```

**Lectura:** con el bypass puesto, el bloque de cuenta de la Bienvenida **no se monta**. Cualquier bloque de perfil que LOB-1 ponga en el lobby será invisible en desarrollo salvo que se apague `VITE_AUTH_BYPASS` o se cambie esa regla — y cambiarla mueve el trato que protege a los arneses.

**Otros flags:** `.env.example` declara sólo tres variables (`VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_AUTH_BYPASS`). No hay ningún otro flag que altere el destino de `COMPLETO`.

---

## P2 · Selección de mesa y nivel — el intocable

El recorrido está declarado en [src/App.jsx:13-19](src/App.jsx#L13-L19):

```
// ── NIV-UI · Recorrido del lobby ─────────────────────────────────────────────
// Rector: docs/AJILEI_Modos_y_Asistencia_v1.0.md §4.1.
//   [Bienvenida] "Jugar vs IA" → (1) dificultad → (2) mesa + apuesta → [Mesa]
// La pantalla de apuesta deja de existir como paso propio: se integró en la de
// mesa. `TableSelect` queda fuera del recorrido y sin usar […]
```

**Lectura clave para LOB-1: no es UNA pantalla, son DOS.** «Selección de mesa y nivel» son dos componentes distintos y consecutivos.

### 2.1 Los componentes

| Paso | Componente | Ruta | Export | Props |
|---|---|---|---|---|
| 1 · dificultad | `NivelSelect` | [src/components/NivelSelect.jsx:19](src/components/NivelSelect.jsx#L19) | `export default function NivelSelect` | `preseleccionado`, `onSelect`, `onBack` |
| 2 · mesa + apuesta | `ModeSelect` | [src/components/ModeSelect.jsx:29](src/components/ModeSelect.jsx#L29) | `export default function ModeSelect` | `nivel`, `onSelectMode`, `onBack` |
| — · huérfano | `TableSelect` | [src/components/TableSelect.jsx:5](src/components/TableSelect.jsx#L5) | `export default function TableSelect` | `onSelect`, `onBack` |

`ModeSelect` es el que muestra la mesa de **2 a 5** — [src/components/ModeSelect.jsx:10-15](src/components/ModeSelect.jsx#L10-L15):

```js
const TABLE_MODES = [
  { players: 2, opponents: '1 IA',  comodin: false },
  { players: 3, opponents: '2 IAs', comodin: false },
  { players: 4, opponents: '3 IAs', comodin: true  },
  { players: 5, opponents: '4 IAs', comodin: true  },
]
```

**`TableSelect` está MUERTO:** nadie lo importa (`grep -rn "TableSelect" src/` sólo devuelve su propia definición y la nota de `App.jsx:17`). Sigue en el árbol por decisión explícita («borrar es otra tanda») y su hoja se sigue usando como referencia de estilo por `nivelSelect.css` y `modeSelect.css`.

### 2.2 Cómo arranca la partida desde ahí

Son **dos callbacks encadenados**, ambos definidos en `App.jsx` y ninguno dentro de los componentes.

Paso 1 → paso 2, en [src/App.jsx:134-142](src/App.jsx#L134-L142):

```jsx
      <NivelSelect
        preseleccionado={nivel}
        onSelect={(id) => { setNivel(id); writeNivel(id); setScreen('mode-select') }}
        onBack={() => setScreen('welcome')}
      />
```

Paso 2 → mesa, en [src/App.jsx:120-132](src/App.jsx#L120-L132):

```jsx
      <ModeSelect
        nivel={nivel}
        onSelectMode={(players, monto) => {
          setPlayerCount(players)
          setStake(monto)
          setScreen('table')
        }}
        onBack={() => setScreen('nivel-select')}
      />
```

Y el disparo real, dentro de la rejilla de apuestas — [src/components/ModeSelect.jsx:107-111](src/components/ModeSelect.jsx#L107-L111):

```jsx
              {apuestas.map((monto, idx) => (
                <SoundButton
                  key={monto}
                  className="mode-stake-btn"
                  onClick={() => onSelectMode(mesa, monto)}
```

**Firma exacta: `onSelectMode(players: number, monto: number)`** — dos argumentos, mesa y apuesta. El **nivel NO viaja en esa llamada**: ya está en el estado de `App` desde el paso 1. La mesa recibe finalmente tres piezas más la cuenta ([src/App.jsx:108-118](src/App.jsx#L108-L118)): `stake`, `numPlayers`, `nivel`, `cuenta`, `onLeave`.

**Lectura:** el CTA «Jugar contra la IA» del lobby de LOB-1 sólo tiene que hacer `setScreen('nivel-select')` — exactamente lo que hoy hace `WelcomeScreen` ([src/App.jsx:144](src/App.jsx#L144)). El contrato de arranque de partida no se toca.

### 2.3 Hojas CSS propiedad de esas pantallas

| Hoja | Líneas | Importada por | ¿Exclusiva? |
|---|---|---|---|
| [src/styles/nivelSelect.css](src/styles/nivelSelect.css) | 193 | `NivelSelect.jsx:1` | **Sí** — un solo import |
| [src/styles/modeSelect.css](src/styles/modeSelect.css) | 383 | `ModeSelect.jsx:2` | **Sí** — un solo import |
| [src/styles/tableSelect.css](src/styles/tableSelect.css) | 160 | `TableSelect.jsx:1` | Sí, pero de un componente muerto |
| [src/styles/welcome.css](src/styles/welcome.css) | 265 | `WelcomeScreen.jsx:1` | **Sí** como import, **no** como autoridad (ver aviso) |

**Aviso sobre `welcome.css`.** Es la única de las cuatro que **otras hojas leen por encima del hombro**. `embellecimiento.css` cuelga de `h1.welcome-title` (l. 216, 506, 515), `puerta.css` copia su fondo y su corte de 680px (l. 30, 264, 277), `portada.css` la sobrescribe con alcance propio (l. 101-118), y `tapetes.css` y `useTapetes.js` dan por hecho su `body { background: var(--green-abyss) }`. **Si LOB-1 mueve o renombra `.welcome-screen` / `.welcome-title`, rompe cinco archivos que no son suyos** — entre ellos `gameTable.css`, que es protegido (ver «Requiere autorización»).

Ninguna de las cuatro hojas se carga desde `main.jsx`: las globales de allí son `theme.css`, `index.css`, `embellecimiento.css`, `tapetes.css` y `menuMovil.css` ([src/main.jsx:3-20](src/main.jsx#L3-L20)).

### 2.4 Lo que hay en esas pantallas que NO es selección de mesa/nivel

La pregunta apunta a lo que LOB-1 absorberá. Está repartido en dos componentes:

**En `WelcomeScreen` (la pantalla que el lobby releva):**

1. **Acceso a la cuenta** — [src/components/WelcomeScreen.jsx:25-32](src/components/WelcomeScreen.jsx#L25-L32). Nombre de usuario + «Cerrar sesión», `position: absolute` y **fuera de flujo a propósito**, para que su ausencia (bypass) no mueva un píxel.
2. **Wordmark / marca** — l. 44, `<h1 className="welcome-title" aria-label="AJILEI"><Wordmark /></h1>`.
3. **Arco de 8 estrellas** — l. 46-56, SVG inline con el azul y el crema de bandera.
4. **Dos cartas decorativas** — l. 34-35, `doce_oro.webp` y `once_oro.webp` al 22 % de opacidad.
5. **Botón «Vs Jugadores» inerte + «Próximamente»** — l. 66-71.
6. **Crédito «by HEPTACREATION»** — l. 74-83, **estilo inline**, sin clase.
7. **Crédito CC BY de los emoji** — l. 85-110, **obligatorio y visible** por licencia. También inline. La nota de l. 88-91 dice explícitamente que vive aquí «porque la marca de la casa vive en esta pantalla»: **si el lobby releva a la Bienvenida, este crédito tiene que viajar con él o la licencia queda incumplida.**

**En `ModeSelect` (el intocable):**

8. **Bloque de SALDO** — [src/components/ModeSelect.jsx:37-42](src/components/ModeSelect.jsx#L37-L42):

```jsx
        <div className="mode-balance" title="Tu saldo">
          <span className="mode-balance-label">SALDO:</span>
          <span className="mode-balance-value">
            <BalanceDisplay chips={AJILEI_CONFIG.economy.saldoInicial} /> Heptacoins
          </span>
        </div>
```

**Lectura:** es la cifra **constante** `AJILEI_CONFIG.economy.saldoInicial = 5000` ([src/config/ajileiConfig.js:22](src/config/ajileiConfig.js#L22)), no un saldo vivo — no hay billetera. Si LOB-1 quiere mostrar saldo en el lobby, no hereda una fuente de verdad: hereda un literal de config.

9. **Segundo arco de estrellas duplicado** — l. 53-61 de `ModeSelect`, idéntico al de `WelcomeScreen` salvo el `id` del `<polygon>` (`ms5` vs `s5`).

---

## P3 · Rastro de i18n — sobre qué nace IDI-0

### 3.1 Barrido de patrones

Patrones buscados sobre `src/` (`*.js`, `*.jsx`, `*.css`): `i18n`, `i18next`, `t(`, `useTranslation`, `locale`, `lang`, `idioma`, `dictionary`, `strings`, `textos`.

| Patrón | Resultado |
|---|---|
| `i18n`, `i18next`, `useTranslation`, `dictionary` | **no encontrado** — cero coincidencias en `src/` |
| `t(` (como función de traducción) | **no encontrado** — el barrido `[^a-zA-Z_.]t\(` devuelve cero |
| `locale` | 1 coincidencia, y **no es i18n**: [src/config/tapetes.js:103](src/config/tapetes.js#L103) explica por qué `montoTexto` **evita** `Intl` («el juego de locales instalado no es una constante del entorno») |
| `lang` | 1 sola: `<html lang="es">` en [index.html:2](index.html#L2), estático |
| `idioma` | el selector de la Portada (§3.2) y prosa en comentarios |
| `textos` | [src/config/textosPuerta.js](src/config/textosPuerta.js) — 2 cadenas (§3.3) |

**Lectura: no hay ninguna capa de i18n. IDI-0 nace en terreno virgen, y eso es una buena noticia** — no hay que desmontar nada, sólo que externalizar.

### 3.2 Cómo implementó PUE el selector de idioma

**Es un selector VISUAL SIN MECANISMO.** La lista, en [src/screens/Portada.jsx:117-128](src/screens/Portada.jsx#L117-L128):

```jsx
// El selector de idioma se ESTRENA visible — decisión sellada de Victor. El
// interruptor queda documentado para que la campaña IDI lo herede: cuando haya
// más de un idioma de verdad, esta constante deja de ser una promesa.
const MOSTRAR_IDIOMA = true

const IDIOMAS = [
  { id: 'es', bandera: 'b-ve', nombre: 'Español',    activo: true },
  { id: 'en', bandera: 'b-us', nombre: 'English',    activo: false },
  { id: 'pt', bandera: 'b-br', nombre: 'Português',  activo: false },
  { id: 'fr', bandera: 'b-fr', nombre: 'Français',   activo: false },
  { id: 'it', bandera: 'b-it', nombre: 'Italiano',   activo: false },
]
```

Y su render, en [src/screens/Portada.jsx:387-398](src/screens/Portada.jsx#L387-L398):

```jsx
            <div className="pue-idioma-lista">
              {IDIOMAS.map((l) => (
                <button className="pue-idioma-item" type="button" key={l.id} disabled={!l.activo}>
                  {/* Banderas PROVISIONALES en CSS. La campaña IDI trae los SVG
                      oficiales […] */}
                  <span className={`pue-bandera ${l.bandera}`} />
                  {l.nombre}
                  {l.activo
                    ? <span className="pue-idioma-check">✓</span>
                    : <span className="pue-idioma-pronto">Pronto</span>}
                </button>
              ))}
            </div>
```

**Respuesta punto por punto a lo que la pregunta plantea:**

- **¿Estado local?** Sólo el de apertura/cierre del desplegable (`listaIdioma`, [Portada.jsx:379-385](src/screens/Portada.jsx#L379-L385)). **No hay estado de idioma elegido.**
- **¿`localStorage`?** **NO.** Las siete claves del proyecto son `ajilei.consultas`, `ajilei.fraseVictoria`, `ajilei.melodiaCelebracion`, `ajilei.nivel`, `ajilei.tapete`, `ajilei.tapetes.comprados` y `ajilei.sound` (`consultas.js:11`, `frasesVictoria.js:29`, `melodiasCelebracion.js:33`, `niveles.js:51`, `tapetes.js:87-88`, `SoundContext.jsx:15`). **`ajilei.idioma` no existe.** Convención de nombre para IDI-0: `ajilei.<cosa>`.
- **¿Atributo `lang` en `<html>`?** Estático a `"es"` en `index.html:2`. **Nadie lo escribe desde JS.**
- **¿Todo lo anterior?** Nada de lo anterior. **El botón `pue-idioma-item` no tiene `onClick`.** Los cuatro idiomas no-ES están `disabled` y el ES no hace nada porque ya es el único.

**Lectura:** IDI-0 hereda de PUE **la cara y los cinco ids**, y nada más. El molde a replicar existe y está sellado; el mecanismo hay que construirlo entero.

### 3.3 Diccionarios o mapas de texto ya centralizados

**Uno solo, y minúsculo:** [src/config/textosPuerta.js:12-17](src/config/textosPuerta.js#L12-L17) — dos constantes de cadena, `LEMA_ENTRADA` y `LEMA_PORTADA`.

**Forma:** exports planos con nombre, **sin clave de idioma y sin envoltorio de diccionario**. La razón por la que existe es de herramienta, no de i18n — [textosPuerta.js:2-5](src/config/textosPuerta.js#L2-L5): `react-refresh/only-export-components` rompe la recarga en caliente si un archivo exporta componente **y** constantes.

**Lectura para IDI-0: el precedente de la casa es «los textos viven en `src/config/` en un módulo sin React ni DOM».** Ese molde ya lo cumplen `niveles.js`, `tapetes.js`, `menuEntradas.js`, `reacciones.js` y `consultas.js`, todos declarados «FUENTE ÚNICA que consumen la app, los tests y el arnés». Un `src/config/textos.<idioma>.js` sería la extensión natural.

**Contra-hallazgo importante:** el copy visible **no está externalizado hoy**. Está literal en el JSX: `'Elige tu reto'`, `'¿Contra quién quieres jugar?'` (`NivelSelect.jsx:23-24`), `'Elige tu mesa'`, `'¿Con cuánto entras?'` (`ModeSelect.jsx:44, 104`), `'Jugar vs IA'`, `'Vs Jugadores'`, `'Próximamente'`, `'El clásico juego de cartas venezolano, ahora digital.'` (`WelcomeScreen.jsx:59-70`). Los `nombre`/`descripcion` de `niveles.js` y `tapetes.js` **sí** están fuera del JSX, pero declarados «copy PROVISIONAL» y sin eje de idioma.

### 3.4 Dependencias de i18n en `package.json`

**Ninguna.** Verificado por barrido de `i18n|intl|polyglot|lingui|translat` sobre [package.json](package.json) → cero coincidencias. Las cuatro dependencias de producción son `@supabase/supabase-js ^2.112.4`, `howler ^2.2.4`, `react ^19.2.6`, `react-dom ^19.2.6`.

---

## P4 · Inventario de iconos

### 4.1 Dependencias de iconos en `package.json`

**Ninguna.** No hay `lucide-react`, `react-icons`, `@phosphor-icons/*`, `@heroicons/*` ni equivalente. Las dependencias completas son las cuatro de producción de §3.4 más doce de desarrollo ([package.json:19-32](package.json#L19-L32)), entre ellas `playwright-core 1.62.1` (fijada sin `^`) y `ffmpeg-static`.

**Lectura:** **la casa dibuja sus propios iconos**, y la razón está escrita (§4.3). LOB-1 no debería introducir una librería sin decisión de Victor.

### 4.2 SVG sueltos que actúan como iconos de interfaz

Excluyendo cartas, isotipo y moneda:

| Ruta | Bytes | KiB | Qué es | ¿Consumido? |
|---|---:|---:|---|---|
| [public/icons/ajilei-icon-maestro.svg](public/icons/ajilei-icon-maestro.svg) | 4 217 | **4,12** | Maestro del icono de app (lienzo 1024) | **Sí** (§4.4) |
| [public/icons.svg](public/icons.svg) | 5 031 | **4,91** | Sprite de iconos **sociales** (`<symbol id="bluesky-icon">`…) | **NO — huérfano** |
| `public/emoji/*.svg` | — | — | **12** emoji de reacciones (+12 `.avif`; 24 archivos, 680 KiB la carpeta) | Sí, vía `rutaEmoji` |

`public/icons.svg` — **hallazgo:** ningún archivo de `src/`, `index.html` ni `scripts/` lo referencia. Sus únicas menciones son documentales, y una de ellas ya lo clasificó: `docs/AJILEI_Diseno_Landscape_v1.0.md:139` — «*el resto de assets son andamiaje (`icons.svg` es un sprite de iconos sociales…)*». Es residuo de la plantilla de arranque, hermano de `src/index.css`.

Los emoji **no son iconos de interfaz** sino contenido de reacciones, y se sirven **autoalojados** por decisión sellada — [src/config/reacciones.js:61-64](src/config/reacciones.js#L61-L64):

```js
// Ruta del recurso AUTOALOJADO (public/emoji/). No se apunta a gstatic: su ruta
// `latest` es mutable y la PWA no puede depender de un tercero para pintar
// (v1.4 §4). `scripts/fetchEmoji.mjs` los baja desde aquí mismo.
export const rutaEmoji = (frase, ext) => `/emoji/${codepointDe(frase)}.${ext}`
```

**Ausencias declaradas:** no existe ningún SVG de interfaz genérico —no hay flecha, engranaje, cerrar, usuario, trofeo, ranking, tienda ni ajustes— fuera de los tres inline de §4.3. Se buscó por `find public src -name "*.svg"`: **16 SVG en total** en todo el árbol fuera de cartas, y ni uno es un icono de UI reutilizable.

### 4.3 Cómo dibuja sus iconos el menú `⋮`

**Tres técnicas conviviendo, y una doctrina explícita.**

**(a) El disparador `⋮` es un CARÁCTER Unicode** — [src/components/UtilitiesMenu.jsx:81-90](src/components/UtilitiesMenu.jsx#L81-L90):

```jsx
    <button
      ref={registerTrigger}
      className={`mute-button utilities-trigger${open ? ' is-open' : ''}`}
      onClick={onToggle}
      aria-haspopup="menu"
      aria-expanded={open}
      title="Utilidades"
    >
      ⋮
    </button>
```

**(b) Dos entradas viejas usan EMOJI** — [src/components/UtilitiesMenu.jsx:183](src/components/UtilitiesMenu.jsx#L183):

```jsx
          <span className="util-ico" aria-hidden="true">{soundEnabled ? '🔊' : '🔇'}</span>
```

**(c) Todo icono NUEVO es SVG inline de la casa**, y la regla está escrita — [src/components/UtilitiesMenu.jsx:49-71](src/components/UtilitiesMenu.jsx#L49-L71):

```jsx
// SUP-2b · Silueta de jugador — icono propio de "Cuenta". Mismo molde que
// CardQueryIcon (U1b) y GodeteIcon (EMB-2): SVG en línea, monocromo, trazo en
// `currentColor` para heredar --text-primary de la entrada, sin un solo relleno
// de color. Se descartó el emoji 👤 […] la costumbre desde U1b es que
// todo icono NUEVO sea SVG de la casa. Single-gold intacto […]
function CuentaIcon() {
  return (
    <svg className="util-ico util-ico-cuenta" viewBox="0 0 24 24"
      aria-hidden="true" focusable="false">
      <circle cx="12" cy="8" r="3.9" fill="none" stroke="currentColor" strokeWidth="1.75" />
      <path d="M4.6 20.4c0-3.9 3.3-6.4 7.4-6.4s7.4 2.5 7.4 6.4"
        fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  )
}
```

Los tres SVG de la casa, con su origen: `CardQueryIcon` (`UtilitiesMenu.jsx:29-47`, viewBox `0 0 22 31`), `CuentaIcon` (`UtilitiesMenu.jsx:56-72`, viewBox `0 0 24 24`) y `GodeteIcon` (`TapetesPanel.jsx:24-44`, viewBox `0 0 26 24`, **exportado** y consumido por `UtilitiesMenu.jsx:4`).

**Contrato común, para que LOB-1 lo herede:** clase `util-ico` + `util-ico-<nombre>`, `viewBox` propio, `aria-hidden="true"`, `focusable="false"`, `fill="none"`, `stroke="currentColor"`, `strokeWidth="1.75"` (1,7 en Godete), **cero relleno de color**. Y la regla de oro citada tres veces: **«single-gold intacto — el único oro sólido del panel es la ficha de Saldo»**.

### 4.4 `public/icons/ajilei-icon-maestro.svg`

- **Ruta:** `public/icons/ajilei-icon-maestro.svg` · **peso: 4 217 B (4,12 KiB)** · lienzo 1024.
- **Consumidores — dos, y de naturaleza distinta:**

**(1) Como favicon**, directo — [index.html:8](index.html#L8):
```html
    <link rel="icon" type="image/svg+xml" href="/icons/ajilei-icon-maestro.svg" />
```

**(2) Como MAESTRO de derivación**, en el generador — [scripts/gen-icons.mjs:21-22](scripts/gen-icons.mjs#L21-L22):
```js
const MAESTRO = new URL('../public/icons/ajilei-icon-maestro.svg', import.meta.url)
const DESTINO = new URL('../public/icons/', import.meta.url)
```

Sus tres derivados PNG conviven en la misma carpeta: `apple-touch-icon.png` (30 596 B, consumido en `index.html:17`), `icon-192.png` (34 531 B) e `icon-512.png` (228 518 B), estos dos declarados en [public/manifest.webmanifest](public/manifest.webmanifest) con `purpose: "any maskable"`.

**Ningún componente de React lo consume.** Es icono de plataforma, no de interfaz. El que sí entra en el árbol de React es otro: [src/assets/ajilei-isotipo.svg](src/assets/ajilei-isotipo.svg) (4 054 B), importado con `?no-inline` en `Wordmark.jsx:5` y usado como `mask-image` en `embellecimiento.css:330-331`.

---

## P5 · Atmósfera

### 5.1 Tapete

**Hallazgo de partida: NO HAY ASSETS DE TAPETE. Los cinco tapetes son CSS puro.** Se buscó por `find public src -iname "*tapet*" -o -iname "*felt*" -o -iname "*mesa*"` y por `url(` / `background-image` dentro de `src/styles/tapetes.css` → **cero imágenes**. Los únicos archivos con «mesa» en el nombre son `src/assets/portada/mesapc.webp` y `mesav.webp`, que son fotogramas de la Portada, no fieltro.

El mecanismo es **redefinición de tokens por atributo**. Cada tapete redeclara la rampa de cinco sobre `body[data-tapete="<id>"]` — [src/styles/tapetes.css:196-206](src/styles/tapetes.css#L196-L206):

```css
body[data-tapete="vinotinto"] {
  --green-abyss:   #1b080d;   /* H 344,2  S 54,3%  L  6,9% */
  --green-darkest: #210910;   /* H 342,5  S 57,1%  L  8,2% */
  --green-deep:    #470f1e;   /* H 343,9  S 65,1%  L 16,9% */
  --green-base:    #5a1426;   /* H 344,6  S 63,6%  L 21,6% */
  --green-bright:  #731931;   /* H 344,0  S 64,3%  L 27,5% */
  --surface-game:  rgba(90, 20, 38, 0.88);
  --surface-area:       rgba(27, 8, 13, 0.45);
  --surface-area-light: rgba(27, 8, 13, 0.30);
}
```

Y el atributo lo pone y lo quita un efecto — [src/hooks/useTapetes.js:126-127](src/hooks/useTapetes.js#L126-L127):

```js
    document.body.dataset.tapete = tapete
    return () => { delete document.body.dataset.tapete }
```

**Por qué en `body` y no en el contenedor de la mesa:** está razonado en `useTapetes.js:111-117` — el fondo del documento lo pinta `body`, y aplicarlo más abajo dejaría el tapete a medio poner.

**El tapete oficial según `AJILEI_Tapetes_v1.1.md`:** el catálogo de **cinco** sigue vigente (`verde`, `grafito`, `azul`, `vinotinto`, `tricolor`) y el **oficial / por defecto es «Verde clásico»** — `TAPETE_POR_DEFECTO = 'verde'` ([src/config/tapetes.js:75](src/config/tapetes.js#L75)), con la nota que importa:

```js
// El default de todo usuario. Sin atributo aplicado = verde byte-idéntico
// (v1.0 §3): el verde NO existe como regla CSS, es la ausencia de variante.
```

**Lectura:** el verde no tiene bloque `body[data-tapete="verde"]`. Vive **en `theme.css`** como la rampa base. La v1.1 (`docs/AJILEI_Tapetes_v1.1.md` §2) lo **recalibró con `k` = 0,78** y sus valores sellados son `#09170e / #0b1c11 / #153922 / #1b482c / #235c38`, exactamente los que `theme.css:42-46` declara hoy.

**Aviso de versión:** la instrucción cita la **v1.1**, pero en `docs/` vive una **v1.2** (2026-08-23) que la sustituye y que cambia una cosa relevante para LOB-1: `tapetes.css` **dejó de estar gateada a escritorio** y ahora es global, y `data-tapete` también se pone en móvil. El catálogo y los colores no cambian.

**Frontera declarada que LOB-1 debe respetar** — [src/styles/theme.css:53-64](src/styles/theme.css#L53-L64): las tres superficies de cromo (`--surface-card`, `--surface-panel`, `--surface-modal`) **no heredan tapete a propósito**, «porque sólo las usa el lobby, donde `data-tapete` no existe». Un lobby que se pintara con tapete rompería esa frontera.

### 5.2 Sonido

**Los `Howl` son perezosos desde PUE-1.2.** La tabla de fuentes es **datos**, no objetos — [src/hooks/useSounds.js:22-40](src/hooks/useSounds.js#L22-L40), y el `Howl` nace en `obtener()` ([useSounds.js:47-52](src/hooks/useSounds.js#L47-L52)):

```js
function obtener(nombre) {
  const receta = FUENTES[nombre]
  if (!receta) return null
  if (!vivos[nombre]) vivos[nombre] = new Howl({ ...receta, preload: true })
  return vivos[nombre]
}
```

**Los once sonidos registrados** (`FUENTES`, `useSounds.js:22-40`):

| Nombre lógico | Archivo | Bytes | Volumen | Grupo |
|---|---|---:|---:|---|
| `cardDeal` | `card-deal.mp3` | 30 929 | 0.6 | MESA |
| `coinBet` | `coin-bet.mp3` | 7 680 | 0.7 | MESA |
| `cardFold` | `card-fold.mp3` | 39 288 | 0.5 | MESA |
| `cardShuffle` | `card-shuffle.mp3` | 104 160 | 0.6 | MESA |
| `timerWarning` | `timer-warning.mp3` | 21 504 | 0.5 | MESA |
| `showdown` | `showdown.mp3` | 66 816 | 0.7 | MESA |
| `comodin` | `comodin.mp3` | 65 201 | 0.8 | MESA |
| `buttonClick` | `button-click.mp3` | 16 896 | 0.4 | MESA |
| `chipsCollect` | `chips-collect.mp3` | 30 929 | 0.7 | celebración |
| `ajileiStrum` | `ajilei-strum.mp3` | 117 028 | 0.8 | PORTADA |
| **`tableKnock`** | **`table-knock.mp3`** | **37 920** | **0.6** | celebración |

Más 7 melodías de celebración × 2 formatos (`.mp3` ~386 KB + `.ogg` ~215-246 KB cada una), cargadas por `useCoreografia`, fuera de esta tabla.

**El «golpe de mesa»: `tableKnock` → `/sounds/table-knock.mp3`, 37 920 B, volumen 0.6.** No es un candidato aproximado: es literalmente ese sonido, y su volumen está calibrado contra pico medido — [src/hooks/useSounds.js:31-36](src/hooks/useSounds.js#L31-L36):

```js
  // Los tres son Pixabay Content License (IDs 96121, 85867, 504874) […]
  // Volúmenes elegidos contra el PICO MEDIDO de cada archivo, no a ojo: knock
  // 0,383 (el más fuerte de los tres, dos golpes secos no deben sobresaltar),
  // chips 0,249, strum 0,188 […]
```

**Mecanismo de carga perezosa que el lobby reutilizaría** — [src/hooks/useSounds.js:57-72](src/hooks/useSounds.js#L57-L72):

```js
export const SONIDOS_PORTADA = ['ajileiStrum']

export const SONIDOS_MESA = [
  'cardDeal', 'coinBet', 'cardFold', 'cardShuffle',
  'timerWarning', 'showdown', 'comodin', 'buttonClick',
]

/** Construye y arranca la descarga de los sonidos nombrados. Idempotente. */
export function precargarSonidos(nombres) {
  if (!Array.isArray(nombres)) return
  nombres.forEach(obtener)
}
```

**Archivo y función: `src/hooks/useSounds.js` → `precargarSonidos(nombres: string[])`, idempotente.** Y el punto donde hoy se llama, que es donde LOB-1 tendrá que decidir si mete un grupo `SONIDOS_LOBBY` — [src/App.jsx:63-68](src/App.jsx#L63-L68):

```jsx
  useEffect(() => {
    if (screen !== 'welcome') precargarSonidos(SONIDOS_MESA)
    if (screen !== 'welcome') precargarBaraja()
  }, [screen])
```

**Aviso:** la condición es `screen !== 'welcome'`. **Si LOB-1 añade un valor nuevo a `screen` situado ANTES de `'welcome'`, esta guarda dispara la precarga de audio y de la baraja al entrar al lobby** — no en el momento previsto. Es la línea más frágil de `App.jsx` frente a esta campaña.

El reproductor propiamente dicho es `useSounds()` ([useSounds.js:129-164](src/hooks/useSounds.js#L129-L164)), que respeta `soundEnabled` de `SoundContext` (clave `ajilei.sound`).

### 5.3 Tokens

**Archivo: [src/styles/theme.css](src/styles/theme.css), 120 líneas, importado UNA vez en [src/main.jsx:3](src/main.jsx#L3).** Su propia cabecera lo declara: «*Single source of truth*». `--gold-brand` está en la línea 6.

**La rampa vinotinto NO vive en `theme.css`.** Vive en [src/styles/tapetes.css:196-206](src/styles/tapetes.css#L196-L206) (transcrita en §5.1) más su disco `--tap-swatch-vinotinto: #5a1426` en `tapetes.css:111`. `theme.css` sólo contiene la familia **verde**.

**Inventario completo de tokens de color en `theme.css`** (sin interpretar, tal como están):

| Grupo | Token | Valor |
|---|---|---|
| GOLD | `--gold-brand` | `#e8b84b` |
| | `--gold-brand-rgb` | `232, 184, 75` |
| | `--gold-hover` | `#f5cc6a` |
| | `--gold-dim` | `#c9973a` |
| | `--gold-dim-rgb` | `201, 151, 58` |
| | `--gold-brand-hi` | `#f5dfae` |
| | `--gold-brand-hi-rgb` | `245, 223, 174` |
| | `--gold-brand-deep` | `#ac7e16` |
| | `--gold-brand-deep-rgb` | `172, 126, 22` |
| GREENS | `--green-abyss` | `#09170e` |
| | `--green-darkest` | `#0b1c11` |
| | `--green-deep` | `#153922` |
| | `--green-base` | `#1b482c` |
| | `--green-bright` | `#235c38` |
| SURFACES | `--surface-panel` | `rgba(9, 21, 13, 0.75)` |
| | `--surface-game` | `rgba(27, 72, 44, 0.88)` |
| | `--surface-card` | `rgba(9, 23, 14, 0.55)` |
| | `--surface-area` | `rgba(9, 23, 14, 0.45)` |
| | `--surface-area-light` | `rgba(9, 23, 14, 0.30)` |
| | `--surface-modal` | `#0c1d13` |
| TEXT | `--text-primary` | `#f5edd8` |
| | `--text-primary-rgb` | `245, 237, 216` |
| | `--text-secondary` | `rgba(245, 237, 216, 0.72)` |
| | `--text-muted` | `rgba(245, 237, 216, 0.55)` |
| | `--text-faint` | `rgba(245, 237, 216, 0.25)` |
| | `--text-dark` | `#1a1a0e` |
| IDENTITY | `--flag-yellow` | `#ffcc00` |
| | `--flag-blue` | `#003893` |
| | `--flag-red` | `#cf142b` |
| SEMANTIC | `--loss-red` | `#b71c1c` |
| | `--loss-red-rgb` | `183, 28, 28` |
| | `--win-green` | `#66bb6a` |
| | `--lose-red` | `#ef5350` |
| | `--bet-orange` | `#ff8a65` |
| | `--raise-orange` | `#e65100` |
| | `--raise-orange-rgb` | `230, 81, 0` |

**Tipografía y dimensiones en `theme.css`:**

| Token | Valor | Nota |
|---|---|---|
| `--font-base` | `Arial, sans-serif` | **El ÚNICO token tipográfico del sistema.** |
| `--card-w` | `76px` → `91px` @ `(min-width:768px) and (min-height:900px)` | l. 98, 117 |
| `--card-h` | `118px` → `142px` (mismo media query) | l. 99, 118 |
| `--filigrana` | dos `repeating-linear-gradient` a 45°/−45° sobre `--gold-dim-rgb` al 0,05 | l. 102-112 |

**Tokens de tapete, en `tapetes.css:107-116` y fuera de toda media query a propósito:** `--tap-swatch-verde: #1b482c`, `--tap-swatch-grafito: #282b2e`, `--tap-swatch-azul: #1b2f48`, `--tap-swatch-vinotinto: #5a1426`, `--tap-swatch-tricolor: linear-gradient(to bottom, #3c331b 0%, #1c2e45 50%, #3e191e 100%)`.

**Regla del proyecto que LOB-1 hereda, citada verbatim de `portada.css:16-19`: «NI UN HEX FUERA DE `theme.css`»**, con dos excepciones declaradas por ficha (banderas provisionales del selector de idioma y el `#fff6e0` de la banda especular).

### 5.4 Tipografía — la familia del wordmark clonado

**Aquí está el hallazgo más frágil de la Fase 0.** `--font-base` es `Arial`, pero **el wordmark NO lo usa**.

El wordmark se pinta sobre `<h1 className="welcome-title">`, y ese `<h1>` **no declara familia ni peso**. `welcome.css:45-50` sólo pone color, tamaño y traza:

```css
.welcome-title {
  color: var(--gold-brand);
  font-size: 72px;
  letter-spacing: 12px;
  margin: 0 0 14px;
}
```

La familia y el peso **los hereda de una regla genérica del andamiaje de Vite** — [src/index.css:14-15](src/index.css#L14-L15) y [src/index.css:69-74](src/index.css#L69-L74):

```css
  --sans: system-ui, 'Segoe UI', Roboto, sans-serif;
  --heading: system-ui, 'Segoe UI', Roboto, sans-serif;
  […]
h1,
h2 {
  font-family: var(--heading);
  font-weight: 500;
  color: var(--text-h);
}
```

**Ése es el «system-ui 500» de la pregunta: sale de `h1, h2` en `src/index.css`, la hoja de plantilla que ninguna campaña ha limpiado.**

**¿Existe una clase reutilizable? NO.** No hay `.wordmark`, `.marca` ni equivalente que agrupe familia + peso. Lo que existe es un **contrato de selector**, y está declarado como tal — [src/styles/portada.css:13-14](src/styles/portada.css#L13-L14):

```
   Las dos excepciones son deliberadas: `h1.welcome-title` y `.wm-slot` son el
   contrato del wordmark y tienen que seguir siendo el MISMO objeto.
```

**Cómo se clona hoy:** la Portada reusa el mismo componente y el mismo selector — [src/screens/Portada.jsx:408](src/screens/Portada.jsx#L408) es idéntico a [src/components/WelcomeScreen.jsx:44](src/components/WelcomeScreen.jsx#L44):

```jsx
              <h1 className="welcome-title" aria-label="AJILEI"><Wordmark /></h1>
```

…y sólo **redeclara la escalera** con alcance de portada ([portada.css:109-118](src/styles/portada.css#L109-L118), especificidad 0,2,1 sobre el 0,1,1 base). Existe un tercer clon en la mesa (`h1.table-title`) y un cuarto en la celebración (`span.vc-ajilei`), gobernados por `--wm-track` desde [src/styles/embellecimiento.css:506-508](src/styles/embellecimiento.css#L506-L508):

```css
h1.welcome-title  { --wm-track: 12px; }   /* welcome.css  .welcome-title      */
h1.table-title    { --wm-track:  5px; }   /* gameTable.css .table-title       */
span.vc-ajilei    { --wm-track: 0.23em; } /* gameTable.css .vc-ajilei (en em) */
```

**Lectura para LOB-1:** el wordmark del lobby se clona **repitiendo `<h1 className="welcome-title" aria-label="AJILEI"><Wordmark /></h1>`** y, si necesita otra escalera, redeclarando `font-size` / `letter-spacing` / `--wm-track` con alcance propio en su hoja. Es el molde que PUE ya validó. Lo que **no** puede hacer es cambiar el selector: cuatro sitios dependen de él, uno de ellos en archivo protegido.

**Riesgo declarado:** la familia del wordmark depende de `src/index.css`, que es andamiaje. Si alguna campaña futura limpia esa hoja —una tentación razonable— **el wordmark de las cuatro pantallas cambia de fuente a la vez** y nada lo advierte. El arnés sí lo mediría: `diagPUE.mjs:249-262` lee `fontFamily` y `fontWeight` computados del `h1.welcome-title`, aunque no los compara contra un esperado.

---

## P6 · Estado del repositorio

### 6.1 Git

```
$ git log -1 --format=%H
e75adf1327c150a89f10967b709b39e130522abd

$ git status --short
?? laminas/mon1/_entorno.txt
?? laminas/mon1/lamina.html
?? laminas/mon1/tiempos.json
?? scripts/_cel1bFila.mjs
```

**Cuatro residuos, cuatro esperados. Ni uno de más.** Coinciden exactamente con los declarados en DOC-1. El árbol está limpio de cambios rastreados (no hay ni una línea `M`, `A`, `D` ni `R`).

Tras esta fase, `git status --short` mostrará esos cuatro más `?? AJILEI_LOB1_Fase0_informe.md`.

### 6.2 Estructura de `src/` a dos niveles

**180 archivos, diez directorios de primer nivel.** Ninguno más profundo que dos niveles salvo `assets/cards/webp/`.

```
src/                     4 archivos sueltos
├── App.css              (0 bytes — VACÍO)
├── App.jsx              147 líneas · la cascada de pantallas
├── index.css            111 líneas · andamiaje de Vite (ver Hallazgos laterales)
├── main.jsx              30 líneas · raíz + 5 hojas globales
├── assets/               5 · isotipo, heptacoin (svg/webp/poster), hero.png
│   ├── cards/           41 · 40 PNG maestros + reverso_carta.svg
│   │   └── webp/        40 · los derivados que viajan (CAR-1)
│   └── portada/          7 · WebP de la Portada
├── components/          22 · 21 .jsx + ChipToken.css
├── config/              11 · módulos sin React ni DOM
├── context/              1 · SoundContext.jsx
├── dev/                  2 · arcoCEL.js, siembraCEL.js
├── engine/               4 · aiPlayer, deck, gameEngine, handEvaluator
├── hooks/               20 · 11 use*.js + 8 *Core.js + useCongelado.test.js
├── lib/                  2 · precargaBaraja.js, supabase.js
├── screens/              3 · Bautizo.jsx, Entrada.jsx, Portada.jsx
└── styles/              18 · hojas, todas en camelCase
```

**Dónde nace `Lobby.jsx` sin romper la convención.** La convención existente es inequívoca y ya tiene precedente exacto:

- **`src/screens/`** guarda las pantallas **de gate/puerta**: `Portada.jsx` (SIN_SESION), `Bautizo.jsx` (SESION_SIN_PERFIL), `Entrada.jsx` (huérfano). Las tres son pantallas completas que ocupan el viewport y las tres se renderizan **directamente desde la cascada de `App.jsx`**.
- **`src/components/`** guarda las pantallas **del recorrido de juego** (`WelcomeScreen`, `NivelSelect`, `ModeSelect`, `TableSelect`, `GameTable`) mezcladas con los componentes reutilizables.

**LOB-1 cae del lado de `screens/`:** el lobby es una pantalla completa que se renderiza desde la cascada de `App` y que releva a `Portada`/`Bautizo` en la misma secuencia. **`src/screens/Lobby.jsx` + `src/styles/lobby.css`** encaja con las dos convenciones a la vez (las hojas van todas en `src/styles/`, sin excepción salvo `components/ChipToken.css`).

**Verificado: nada llamado `Lobby` existe hoy.** `grep -rli "lobby" src/ scripts/` devuelve sólo prosa en comentarios (`App.jsx`, `GameTable.jsx`, `useNivel.js`, `useTapetes.js`, `precargaBaraja.js`, y cuatro hojas de estilo). **El nombre está libre.**

**Nota sobre `src/config/`:** si IDI-0 nace con LOB-1, su diccionario encaja aquí — es el único directorio del proyecto declarado «sin React ni DOM, para que `node` lo importe tal cual», que es la condición para que el arnés y Vitest consuman la misma fuente.

### 6.3 Modos del arnés cuyo anclaje toca la ruta post-login

**Éste es el mayor coste oculto de LOB-1, y hay que decirlo con la cifra exacta.**

#### El punto de estrangulamiento

`diagDSK.mjs` tiene **UN solo sitio** que sabe llegar a la mesa — [scripts/diagDSK.mjs:337-350](scripts/diagDSK.mjs#L337-L350):

```js
async function recorrerRuta(page, n, iNivel, stakeIdx) {
  await page.click('button:has-text("Jugar vs IA")')
  // Pantalla 1 · nivel. `nth-of-type` sobre la rejilla […]
  await page.waitForSelector('.nivel-grid button')
  await page.click(`.nivel-grid button:nth-of-type(${iNivel + 1})`)
  // Pantalla 2 · mesa y monto en la MISMA superficie […]
  await page.click(`button:has-text("Mesa de ${n} jugadores")`)
  await page.waitForSelector('.mode-stake-btn')
  await page.click(`.mode-stake-grid button:nth-of-type(${stakeIdx + 1})`)
  await page.waitForSelector('.game-table')
}
```

Precedido de la ruta canónica declarada — [scripts/diagDSK.mjs:312-313](scripts/diagDSK.mjs#L312-L313):

```
// RUTA CANÓNICA (desde NIV-UI):
//   Welcome → «Jugar vs IA» → NivelSelect → nivel → ModeSelect → «Mesa de N» → apuesta
```

**Lectura: la primera línea de `recorrerRuta` clica «Jugar vs IA» sobre el PRIMER RENDER.** LOB-1 mete una pantalla delante de ese primer render. **Ese clic deja de encontrar su botón, y con él caen todos los modos que llegan a la mesa.** La cabecera del propio arnés (l. 305-310) documenta que exactamente esta avería ya ocurrió una vez con NIV-UI: «*TODOS los modos que navegan en rojo […] y nadie se enteró hasta EMB-1. Un arnés a oscuras es peor que no tenerlo*».

#### Modos de `diagDSK.mjs` (selector: `process.argv[2] || 'all'`, [scripts/diagDSK.mjs:252](scripts/diagDSK.mjs#L252))

**28 modos**, enumerados por sus comparaciones `MODE === '…'`:

`all` · `gate` · `b1` · `p1` · `p2` · `tactil` · `r1` · `r2` · `o1` · `o2` · `h1` · `m1` · `a1` · `a2` · `f1` · `z1` · `d1d2` · `d3` · `u1` · `u2` · `u3` · `vc` · `bug` · `shots` · `menu-movil` · `msg` · `tapetes` · `vuelo`

**Todos los que aterrizan en la mesa pasan por `recorrerRuta`** vía `gotoMesa` / `gotoMesa5` / `volverALaMesa` ([scripts/diagDSK.mjs:320-358](scripts/diagDSK.mjs#L320-L358)). No hay ningún modo de `diagDSK` que mida el lobby por sí mismo: el lobby es **sólo el camino**, nunca el sujeto. **Corolario para Fase 1: `recorrerRuta` es el único punto de reparación de `diagDSK` — un clic más al principio deja los 28 modos verdes de golpe.**

#### Modos de `diagPUE.mjs` (selector: `process.argv[2] || 'todo'`, [scripts/diagPUE.mjs:130](scripts/diagPUE.mjs#L130))

**3:** `todo` · `puerta` · `mon`. Ancla en `vite preview` (**4173**, no 5173) porque bajo `dev` el bypass mata la Portada.

**No recorre la ruta post-login**, pero **sí la vigila por negación**, y ahí hay una trampa — [scripts/diagPUE.mjs:198-199](scripts/diagPUE.mjs#L198-L199):

```js
  anota('puerta.3 la Bienvenida vieja NO captura al visitante', !R.bienvenida && !R.textoViejo,
    `main.welcome-screen=${R.bienvenida} · texto «El clásico juego…»=${R.textoViejo}`)
```

Con `R.bienvenida = !!q('main.welcome-screen')` y `R.textoViejo = /clásico juego de cartas venezolano/.test(document.body.innerText)` ([diagPUE.mjs:185-188](scripts/diagPUE.mjs#L185-L188)).

**Lectura:** si el lobby de LOB-1 reutiliza la clase `main.welcome-screen` **o** conserva el lema «El clásico juego de cartas venezolano, ahora digital.», `puerta.3` **no se pone rojo** —el visitante anónimo sigue viendo la Portada— pero la aserción deja de significar lo que dice. Y el punto `1.2` del mismo arnés ([diagPUE.mjs:249-262](scripts/diagPUE.mjs#L249-L262)) hace `document.querySelector('h1.welcome-title')` **sin guarda de nulo**: si LOB-1 tocara ese selector en la Portada, ese `getComputedStyle(h)` reventaría con `TypeError`.

#### Lo que la instrucción no preguntaba y hay que decir: **no son dos arneses, son veintitrés archivos**

El clic `page.click('button:has-text("Jugar vs IA")')` aparece **25 veces en 23 archivos de `scripts/`**. Sólo **una** de esas 25 está factorizada (la de `diagDSK.mjs`); las **24 restantes son copias literales**:

| Archivo | Nº de copias |
|---|---:|
| `diagDSK.mjs` | 1 (factorizada en `recorrerRuta`) |
| `diagCEL0.mjs` | 2 (l. 140, 1739) |
| `verifyC441.mjs` | 2 (l. 22, 48) |
| `_sh1probe.mjs`, `measurePanel.mjs`, `shotFloat.mjs`, `shotStatus.mjs`, `verifyC43.mjs`, `verifyC431.mjs`, `verifyC44.mjs`, `verifyC441b.mjs`, `verifyC45.mjs`, `verifyC45a.mjs`, `verifyC45b.mjs`, `verifyC45c.mjs`, `verifyEMB1.mjs`, `verifyGameOver.mjs`, `verifyIDN1.mjs`, `verifyMesa5.mjs`, `verifyREN1.mjs`, `verifyShrink.mjs`, `verifyViewport.mjs` | 1 cada uno (19) |
| `_cel1bFila.mjs` (**residuo sin rastrear**) | 1 |

**Total: 25 puntos de rotura, en 23 archivos, de los cuales 22 no comparten ninguna función.** `diagCEL0.mjs` (105 KB, modo `celebracion`) y los 16 `verify*.mjs` **no importan nada de `diagDSK`**: cada uno tiene su propia copia del clic.

**Lectura para la Fase 1:** la instrucción pide «dejarlos verdes o extenderlos». Extender `diagDSK` cuesta una línea; dejar verde el resto del arnés cuesta **22 archivos más**. Es una decisión de alcance que Victor debe tomar antes de que empiece la Fase 1, no durante.

**Escape hatch existente:** `diagDSK.mjs:250` lee `process.env.AJILEI_BASE`, y `diagPUE.mjs:28` lee `process.env.PUE_BASE`. Los otros 21 scripts tienen `http://localhost:5173` cableado.

---

## Hallazgos laterales

Cosas vistas de paso, sin recomendación de diseño. Ninguna bloquea LOB-1.

1. **`src/index.css` es andamiaje de Vite todavía vivo, y gobierna la tipografía de la marca.** 111 líneas con paleta morada (`--accent: #aa3bff`), un bloque `@media (prefers-color-scheme: dark)` completo, reglas para `code` y `.counter`, un `#social .button-icon` que no existe, y **`#root { width: 1126px }`** (l. 57-67). La «jaula de 1126px» es conocida y se excepciona por pantalla, no se demuele: `body.portada-activa #root` en [src/styles/portada.css:30](src/styles/portada.css#L30), y `tapetes.css:29` la cita como restricción de medición. Lo que sí sorprende es que de aquí salga el `font-family` + `font-weight: 500` de las **cuatro** apariciones del wordmark (§5.4).

2. **`src/App.css` existe y pesa 0 bytes.** Nadie lo importa.

3. **`public/icons.svg` (5 031 B) es huérfano.** Sprite de iconos sociales de la plantilla; `docs/AJILEI_Diseno_Landscape_v1.0.md:139` ya lo clasificó como andamiaje. Cero referencias en código.

4. **`src/assets/hero.png` (13 057 B) es huérfano.** Verificado por `grep -rn "hero.png" src/ index.html` → sin coincidencias.

5. **`TableSelect.jsx` + `tableSelect.css` (34 + 160 líneas) son código muerto declarado.** Su hoja, sin embargo, **no** es huérfana en el sentido útil: `nivelSelect.css:61` y `modeSelect.css:260` la citan como origen de sus valores. Borrarla sin leer esos dos comentarios sería un error.

6. **El arco de 8 estrellas está duplicado en dos componentes.** `WelcomeScreen.jsx:46-56` y `ModeSelect.jsx:53-61` son el mismo `viewBox`, el mismo `path`, los mismos ocho pares de coordenadas y el mismo `polygon`; sólo difiere el `id` (`s5` / `ms5`). Si LOB-1 lo hereda, serían tres.

7. **La condición `screen !== 'welcome'` de `App.jsx:64,67` es sensible al orden de pantallas**, no al hecho de encaminarse a la mesa. Detallado en §5.2.

8. **`AJILEI_Tapetes_v1.2.md` sustituye a la v1.1 que la instrucción cita.** No contradice nada de lo respondido; sólo amplía el alcance de `tapetes.css` a móvil. Señalado en §5.1.

9. **Los informes de fase del proyecto viven en `docs/reportes/`** (16 archivos, con el molde `AJILEI_<CAMPAÑA>_Fase0_Informe_v1.0.md`). La §4 de esta instrucción pide **explícitamente** la raíz del repositorio, y así se ha hecho. Se anota la divergencia de convención para que sea decisión de Victor y no un descuido.

10. **`diagPUE.mjs:250-251` hace `getComputedStyle(document.querySelector('h1.welcome-title'))` sin guarda de nulo.** Hoy no falla porque la Portada clona ese selector. Es frágil ante cualquier campaña que toque el contrato del wordmark.

11. **`.env.local` contiene la URL y la clave publicable de Supabase en claro** y no está rastreado (`.gitignore` lo cubre; `git status --short` no lo lista). Se anota porque la clave es `sb_publishable_*` —publicable por diseño, no un secreto— pero conviene que conste que fue vista.

---

## Requiere autorización

Dos preguntas rozaron un archivo protegido. **Ninguno se abrió.** Ambas se respondieron por vía indirecta y aquí queda dicho qué falta y qué costaría.

1. **P5 · Cómo consume el tapete la mesa, del lado de `gameTable.css`.**
   **Protegido:** `src/styles/gameTable.css` (`Protegidos v1.0` §2, fila 5; 6 289 líneas).
   **Respondido sin abrirlo:** el mecanismo entero está en `tapetes.css` (hoja propia, no protegida) y en `useTapetes.js`. EMB-2 metió los cinco tapetes **sin abrir** `gameTable.css` —lo dice el propio documento de protegidos, §1— precisamente porque el fieltro entra por redefinición de tokens sobre `body[data-tapete]`, y `gameTable.css` sólo los consume.
   **Qué falta:** cuál de las reglas concretas de `gameTable.css` pinta el óvalo y el pozo con `--surface-game`. **No hace falta para LOB-1**, que no toca la mesa. Si la Fase 1 lo necesitara, pedir autorización entonces.

2. **P5 · Los otros dos clones del wordmark: `h1.table-title` y `span.vc-ajilei`.**
   **Protegido:** `src/styles/gameTable.css`, donde según `embellecimiento.css:507-508` viven ambos selectores.
   **Respondido sin abrirlo:** los valores que LOB-1 necesita —el `--wm-track` de cada clon: 5px y 0,23em— están declarados **fuera** del protegido, en `embellecimiento.css:506-508`, con el comentario de cada línea nombrando su hoja de origen. Suficiente para replicar el molde.
   **Qué falta:** el `font-size` y el `letter-spacing` exactos de esos dos clones. **No hace falta:** el lobby declarará los suyos con alcance propio, como hizo la Portada en `portada.css:109-118`.

**Los tres protegidos restantes** —`src/engine/gameEngine.js`, `src/engine/aiPlayer.js`, `src/config/seatLayouts.js`— no fueron rozados por ninguna de las seis preguntas. LOB-1 es una campaña de interfaz que vive delante de la selección de mesa; el motor, la IA y la geometría de asientos quedan fuera de su alcance por construcción.

---

**Árbol de trabajo:** idéntico al de partida salvo este archivo. Sin commits. Sin `add`. Sin ningún archivo creado, editado, movido, renombrado ni borrado fuera de `AJILEI_LOB1_Fase0_informe.md`.

STOP
