import { useState, useEffect, useRef, useCallback } from 'react'
import '../styles/puerta.css'
import '../styles/entrada.css'
import '../styles/portada.css'
import { Wordmark } from '../components/Wordmark'
import FormularioPuerta from '../components/FormularioPuerta'
import { LEMA_PORTADA } from '../config/textosPuerta'
import { useSounds, precargarSonidos, SONIDOS_PORTADA } from '../hooks/useSounds'

import reversoUrl from '../assets/cards/reverso_carta.svg'
import unoUrl from '../assets/portada/uno_copa.webp'
import tresUrl from '../assets/portada/tres_copa.webp'
import cincoUrl from '../assets/portada/cinco_copa.webp'
import diezUrl from '../assets/portada/diez_copa.webp'
import doceUrl from '../assets/portada/doce_copa.webp'
import mesavUrl from '../assets/portada/mesav.webp'
import mesapcUrl from '../assets/portada/mesapc.webp'
// MON-2.1 · los dos assets de la moneda dejan `public/` y pasan por Vite, que
// les pone hash de contenido. Sin hash no pueden entrar en la zona `immutable`
// de `public/_headers`, y la Fase 0 midió lo que costaba: una revalidación
// bloqueante por visita para un archivo de 1 040 KB que nunca cambia.
import heptacoinUrl from '../assets/heptacoin.webp?url'
import heptacoinPosterUrl from '../assets/heptacoin-poster.webp?url'

// ── PUE · La Portada-Entrada ────────────────────────────────────────────────
// Documento rector: la lámina `PUE_lamina_v1.7.html`, contrato visual sellado
// por Victor el 31-ago, con los CINCO DELTAS de AJILEI_PUE_Fase1_v1.0 que mandan
// sobre ella donde difieran. Réplica 1:1, no una reinterpretación.
//
// Esta pantalla sustituye a `Entrada` en el estado `SIN_SESION`. Lo hace sin
// tocar el contrato con App.jsx: recibe las mismas dos funciones y no sabe nada
// de Supabase — la escenografía es nueva, la puerta es la de siempre.
//
// ── Las cinco escenas son ADORNO, y el árbol lo dice ────────────────────────
// El escenario entero va `aria-hidden`: es ambiente, no información. Todo lo
// que un lector de pantalla necesita —la marca, los dos lemas, el formulario—
// está fuera de él. La frase que acompaña a cada escena también queda fuera del
// alcance de la ayuda técnica por la misma razón: cambia sola cada cuatro
// segundos, y un `live region` que se reescribe solo cinco veces por ciclo es
// ruido, no ayuda.

// El compás sellado en la v1.6: baraja 4 · AJILEI 4 · enseñanza 4,5 ·
// monedas 4,5 · mesa 4 = 21 s de ciclo.
const DURACIONES = [4000, 4000, 4500, 4500, 4000]

// La escena 3 revela su frase TARDE a propósito (`data-frase-espera` en la
// lámina): la respuesta «te lo enseñamos en un dos por tres» entra con el
// primer golpe de carta, no antes de que se haya hecho la pregunta.
const ESPERA_FRASE = [350, 350, 2000, 350, 350]

const FRASES = [
  'La baraja de tu casa, estés donde estés.',
  '51 exactos. Eso es un AJILEI. ¿Te atreves?',
  'Tranquilo — te lo enseñamos en un dos por tres.',
  'Gana Heptacoins. Toda la emoción, sin gastar un real.',
  'En tu teléfono o en tu computadora — entras y juegas, sin instalar nada.',
]

// Los cinco naipes del AJILEI natural de 51, certificados contra el motor en
// AJILEI_PUE_Extraccion_v1.0: As·3·5·Sota·Rey de copas.
const MANO_AJILEI = [
  { url: unoUrl,   alto: 11 },
  { url: tresUrl,  alto: 21 },
  { url: cincoUrl, alto: 31 },
  { url: diezUrl,  alto: 41 },
  { url: doceUrl,  alto: 51 },
]

// Los instantes del volteo, los MISMOS que el CSS: .3s + i×.28s de retardo, y el
// número canta a mitad del giro de 0,45s. Si se mueven allí, se mueven aquí — y
// por eso están escritos como la misma fórmula y no como cinco literales.
const VOLTEO_BASE_MS = 300
const VOLTEO_CADENCIA_MS = 280
const VOLTEO_MEDIO_MS = 220

// A los 2,5 s: el patrón que la bitácora 1.8 midió: el formulario ya es usable y
// lo pesado entra sin competir por el ancho de banda del primer pintado.
const ESPERA_PESADAS_MS = 2500

// ── MON-2 · El render 3D de la Heptacoin en la escena 4, con alfa real ──────
// MON-1 horneó el fondo de la portada dentro del video y MON-INT/POR-FID
// intentaron coser ese telón con máscaras: descartado por Victor y el rector.
// El render viaja ahora CON CANAL ALFA como WebP animado —un solo asset,
// Safari no reproduce VP9 con alfa—, y lo que hay detrás de las monedas es la
// propia portada: su degradado y su filigrana, sin capa intermedia. La sombra de
// contacto viene del render (shadow catcher), no de CSS. Sin bucle en el asset
// (loop=1): el cuadro 0 es un vacío sin monedas y el 134 el reposo; la portada
// rebobina por código. El póster ES el cuadro 134 con alfa — si el animado no
// llega (datos, batería, quietud), lo que queda es la escena terminada.
//
// ── Lo que el archivo publicado es de verdad (medido en MON-2.1 Fase 0) ─────
// Aquí decía «135 cuadros a 30 fps». Eso describe el RENDER de origen, no el
// asset: `empaquetar.py` remuestrea y el codificador funde cuadros idénticos
// consecutivos. Lo que se publica son **87 cuadros** con duraciones de 50, 100
// y 150 ms —~19,3 fps de media— que suman los 4 500 ms exactos de la ventana,
// a **616×346**, que es la escala 0,70 del render de 880×495. El peso son los
// 87 sub-cuadros con alfa (99,9 % del archivo), no la calidad del color:
// recodificarlo más bajo lo deja MÁS pesado, medido.
const ESCENA_RENDER = 3
const RENDER_HEPTACOIN = {
  animado: heptacoinUrl,
  poster: heptacoinPosterUrl,
}

// ── MON-2.1 · Dónde la escena 4 NO existe ───────────────────────────────────
// Estas dos condiciones son copia LITERAL de `portada.css` —la de vertical
// mínimo (:919) y la de teléfono horizontal (:927)—, que en ambos casos ponen
// `.pue-escenario { display: none }`. Se REPLICAN aquí en vez de moverlas: la
// hoja manda sobre lo que se pinta y este módulo sólo pregunta.
//
// Y se pregunta porque la Fase 0 midió lo que costaba no preguntar: en móvil
// apaisado la caja del <img> mide 0×0 y el megabyte se descargaba igual. Es el
// 69 % de la Portada para un aparato que nunca enseña la escena.
const ESCENA_OCULTA =
  '(orientation: portrait) and (max-height: 520px), (orientation: landscape) and (max-height: 540px)'

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

function usePrefiereQuietud() {
  const [quieto, setQuieto] = useState(() => {
    try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches }
    catch { return false }
  })
  useEffect(() => {
    let mq
    try { mq = window.matchMedia('(prefers-reduced-motion: reduce)') } catch { return undefined }
    const f = (e) => setQuieto(e.matches)
    mq.addEventListener('change', f)
    return () => mq.removeEventListener('change', f)
  }, [])
  return quieto
}

// MON-2.1 · Mismo molde que la quietud, y a propósito: son dos condiciones
// independientes que apagan lo mismo, y ninguna sustituye a la otra. Reactiva
// al giro del aparato, que es el caso que importa: quien abre la Portada en
// apaisado y gira a vertical tiene que ver la escena 4 entera.
function useEscenaOculta() {
  const [oculta, setOculta] = useState(() => {
    try { return window.matchMedia(ESCENA_OCULTA).matches }
    catch { return false }
  })
  useEffect(() => {
    let mq
    try { mq = window.matchMedia(ESCENA_OCULTA) } catch { return undefined }
    const f = (e) => setOculta(e.matches)
    mq.addEventListener('change', f)
    return () => mq.removeEventListener('change', f)
  }, [])
  return oculta
}

export default function Portada({ onEnviarCodigo, onVerificar }) {
  const quieto = usePrefiereQuietud()
  const escenaOculta = useEscenaOculta()
  const { play } = useSounds()

  // ── Todo lo que depende de la escena se DERIVA, no se resetea ─────────────
  // El molde obvio —un efecto que al cambiar de escena pone el marcador a cero,
  // esconde la frase y apaga el ganador— es exactamente lo que
  // `react-hooks/set-state-in-effect` prohíbe con razón: son renders en cascada
  // para expresar algo que no es estado nuevo sino una consecuencia del que ya
  // hay. Así que cada dato guarda A QUÉ ESCENA pertenece, y el render decide:
  // si el sello no coincide con la escena viva, vale su valor de reposo. El
  // efecto sólo PROGRAMA relojes, y sus setState viven dentro de la devolución
  // de llamada — que es asíncrona y por tanto legítima.
  const [escena, setEscena] = useState(0)
  const [fraseSellada, setFraseSellada] = useState({ i: 0, texto: FRASES[0] })
  const [sumaSellada, setSumaSellada] = useState({ i: -1, valor: 0 })
  const [ganaSellada, setGanaSellada] = useState({ i: -1 })
  const [pesadasTardias, setPesadasTardias] = useState(false)
  const [hoja, setHoja] = useState(false)
  const [listaIdioma, setListaIdioma] = useState(false)
  const [reintento, setReintento] = useState(0)   // rearma el rotor tras una pausa

  // Con movimiento reducido la escena 1 se queda quieta y visible con su frase.
  // Es un DERIVADO y no un `setEscena(0)` en un efecto: la preferencia puede
  // cambiar en caliente y esto la obedece en el mismo render, sin rebote.
  const escenaViva = quieto ? 0 : escena
  const frase = quieto ? FRASES[0] : fraseSellada.texto
  const fraseOculta = !quieto && fraseSellada.i !== escenaViva
  const suma = sumaSellada.i === escenaViva ? sumaSellada.valor : 0
  const gana = ganaSellada.i === escenaViva
  const pesadas = quieto || pesadasTardias

  const pausada = useRef(false)
  const relojes = useRef([])
  const cajaIdioma = useRef(null)
  const render = useRef(null)    // MON-2 · el <img> de la escena 4
  const animado = useRef(null)   // MON-2 · el WebP animado ya bajado (Blob)

  const programa = useCallback((fn, ms) => {
    relojes.current.push(setTimeout(fn, ms))
  }, [])
  const limpia = useCallback(() => {
    relojes.current.forEach(clearTimeout)
    relojes.current = []
  }, [])

  // ── La jaula de 1126px se EXCEPCIONA, no se demuele ───────────────────────
  // `index.css` es la hoja del andamiaje de Vite y esta campaña no la abre. La
  // portada se anuncia con una clase en el <body> y su hoja declara la
  // excepción con alcance —`body.portada-activa #root`, especificidad 0,2,1
  // contra 0,1,0— así que gana sin un solo `!important` y MUERE al desmontar.
  // Ninguna otra pantalla ve la diferencia.
  useEffect(() => {
    document.body.classList.add('portada-activa')
    return () => {
      document.body.classList.remove('portada-activa')
      document.body.classList.remove('hoja-abierta')
    }
  }, [])

  useEffect(() => {
    document.body.classList.toggle('hoja-abierta', hoja)
  }, [hoja])

  // ── Lo pesado, a los 2,5 s ────────────────────────────────────────────────
  // Con movimiento reducido entra YA: no hay rotación que esperar, la escena 1
  // se queda fija y hacer esperar dos segundos y medio a una imagen que se va a
  // ver desde el principio sería castigar a quien pidió menos movimiento.
  useEffect(() => {
    if (quieto) return undefined
    const id = setTimeout(() => setPesadasTardias(true), ESPERA_PESADAS_MS)
    return () => clearTimeout(id)
  }, [quieto])

  // ── El único sonido de la puerta ──────────────────────────────────────────
  // PUE-1.2: la portada precarga ÚNICAMENTE el rasgueo (~114 KB), y diferido un
  // segundo tras el primer pintado. Los diez sonidos de la mesa no bajan aquí:
  // ése era el hallazgo de la Fase 0 y ésta es su cara visible.
  useEffect(() => {
    const id = setTimeout(() => precargarSonidos(SONIDOS_PORTADA), 1000)
    return () => clearTimeout(id)
  }, [])

  // El strum del primer toque usa la rama existente de `useSounds`
  // (STRUM_CORTE_MS 1300 / fade 130): no se duplica ni una línea de audio.
  useEffect(() => {
    const alTocar = () => play('ajileiStrum')
    window.addEventListener('pointerdown', alTocar, { once: true })
    return () => window.removeEventListener('pointerdown', alTocar)
  }, [play])

  // ── El rotor ──────────────────────────────────────────────────────────────
  // Un temporizador por escena y no un intervalo fijo: cada escena dura lo suyo.
  // `document.hidden` frena el avance en segundo plano — sin eso, volver a la
  // pestaña tras un minuto encuentra el ciclo a mitad de una escena que nadie
  // vio empezar.
  //
  // Y CUANDO ESTÁ PAUSADO, SE VUELVE A ARMAR. Lo primero que escribí fue un
  // temporizador de un solo disparo que, si al vencer encontraba el foco dentro
  // del formulario, no hacía nada. Y ahí se acababa el rotor **para siempre**:
  // sin cambio de escena el efecto no vuelve a correr, así que no quedaba nadie
  // que armara el siguiente reloj. El arnés lo cazó —«1.7b el rotor resucita al
  // soltar el foco: índice 0 → 0»— y es justo lo que un arnés tiene que cazar:
  // un fallo que a ojo se ve igual que una pausa que funciona.
  // `reintento` es el contador que rearma. Es el mismo `armar()` recursivo de la
  // lámina, dicho en el idioma de los efectos.
  useEffect(() => {
    if (quieto) return undefined
    const id = setTimeout(() => {
      if (pausada.current || document.hidden) setReintento((n) => n + 1)
      else setEscena((n) => (n + 1) % DURACIONES.length)
    }, DURACIONES[escena])
    return () => clearTimeout(id)
  }, [escena, reintento, quieto])

  // ── Lo que pasa al entrar cada escena ─────────────────────────────────────
  // Sólo relojes. Ni un setState síncrono: al cambiar `escenaViva`, el marcador,
  // la frase y el ganador ya valen su reposo porque su sello dejó de coincidir.
  useEffect(() => {
    if (quieto) return undefined
    limpia()
    programa(() => setFraseSellada({ i: escenaViva, texto: FRASES[escenaViva] }),
      ESPERA_FRASE[escenaViva])

    if (escenaViva === 1) {
      MANO_AJILEI.forEach((c, i) => {
        programa(() => setSumaSellada({ i: 1, valor: c.alto }),
          VOLTEO_BASE_MS + i * VOLTEO_CADENCIA_MS + VOLTEO_MEDIO_MS)
      })
      // El gesto del ganador se dispara en el instante del «51» —cuando la
      // quinta carta termina de girar—, UNA vez. Ver el delta 1 en portada.css.
      programa(() => setGanaSellada({ i: 1 }),
        VOLTEO_BASE_MS + 4 * VOLTEO_CADENCIA_MS + 500)
    }
    return limpia
  }, [escenaViva, quieto, limpia, programa])

  // ── MON-2 · El animado obedece al rotor ───────────────────────────────────
  // Un <img> no tiene play(): «arrancar desde el cuadro 0» significa que el
  // navegador abra una PETICIÓN DE IMAGEN NUEVA. Reasignar el mismo `src` no
  // la abre —la lista de imágenes disponibles la sirve de caché y, en
  // Chromium, la animación sigue por donde iba—, así que en cada activación se
  // crea un object URL NUEVO sobre el MISMO blob: URL distinta → decodificación
  // nueva → cuadro 0, sin un byte de red. Al salir la escena vuelve el póster y
  // se revoca la URL. Con quietud la escena 4 nunca es la viva (escenaViva se
  // clava en 0), así que aquí no se asigna jamás el animado. Si el blob aún no
  // llegó cuando la escena entra, el póster se queda ese ciclo: no se cambia
  // de fuente a mitad. Fallo silencioso: si el animado no decodifica, el
  // `onError` del elemento repone el póster.
  useEffect(() => {
    const img = render.current
    if (!img || quieto || escenaViva !== ESCENA_RENDER || !animado.current) return undefined
    const url = URL.createObjectURL(animado.current)
    img.src = url
    return () => {
      img.src = RENDER_HEPTACOIN.poster
      URL.revokeObjectURL(url)
    }
  }, [escenaViva, quieto])

  // ── MON-2 · El animado entra en la política de los 2,5 s ─────────────────
  // Sellado por el rector en POR-FID y heredado aquí: el animado se baja UNA
  // vez, como blob, con la misma política que trae el póster y las caras, y
  // queda en memoria hasta que la escena lo pida. El marcado no lleva el
  // animado en ningún `src` hasta la activación: ni un byte antes del primer
  // pintado ni fuera de la banda de los 2,5 s. Con quietud no se baja nunca.
  //
  // ── MON-2.1 · y no se baja donde la escena no existe ──────────────────────
  // `escenaOculta` es la TERCERA condición que apaga, y se compone con las dos
  // que ya había: ninguna sustituye a otra. Al girar el aparato el efecto se
  // rearma solo —`escenaOculta` está en las dependencias— así que pasar de
  // apaisado a vertical dispara aquí la misma política de las pesadas, sin un
  // camino aparte que mantener. Al revés no hace nada: si ya está en memoria,
  // `animado.current` corta en la primera línea.
  // El único caso que el rearme sí toca es girar A oculto con la descarga en
  // vuelo: el `abort` del cleanup la corta, y al volver se pide entera otra
  // vez. Se deja así —cortar lo que ya no se va a ver es lo correcto— y queda
  // declarado, que es más de lo que costaría esconderlo.
  useEffect(() => {
    if (!pesadas || quieto || escenaOculta || animado.current) return undefined
    const ctrl = new AbortController()
    fetch(RENDER_HEPTACOIN.animado, { signal: ctrl.signal })
      .then((r) => (r.ok ? r.blob() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((blob) => { animado.current = blob })
      .catch(() => {})
    return () => ctrl.abort()
  }, [pesadas, quieto, escenaOculta])

  const alFallarElAnimado = useCallback((e) => {
    const img = e.currentTarget
    if (img.getAttribute('src') !== RENDER_HEPTACOIN.poster) img.src = RENDER_HEPTACOIN.poster
  }, [])

  useEffect(() => {
    if (!listaIdioma) return undefined
    const fuera = (e) => { if (!cajaIdioma.current?.contains(e.target)) setListaIdioma(false) }
    document.addEventListener('click', fuera)
    return () => document.removeEventListener('click', fuera)
  }, [listaIdioma])

  const abrirHoja = () => {
    setHoja(true)
    // El foco entra cuando la hoja ya subió: enfocar un campo que aún viaja
    // hace que el teclado del teléfono aparezca contra una tarjeta en marcha.
    setTimeout(() => document.getElementById('entrada-correo')?.focus(), 380)
  }

  const esc = (i) => `pue-esc${escenaViva === i ? ' pue-activa' : ''}`

  return (
    <>
      <main className="pue-lienzo portada-lienzo">

        {MOSTRAR_IDIOMA && (
          <div className={`pue-idioma${listaIdioma ? ' pue-abierta' : ''}`} ref={cajaIdioma}>
            <button
              className="pue-idioma-globo"
              type="button"
              aria-label="Idioma"
              aria-expanded={listaIdioma}
              onClick={(e) => { e.stopPropagation(); setListaIdioma((v) => !v) }}
            >🌐</button>
            <div className="pue-idioma-lista">
              {IDIOMAS.map((l) => (
                <button className="pue-idioma-item" type="button" key={l.id} disabled={!l.activo}>
                  {/* Banderas PROVISIONALES en CSS. La campaña IDI trae los SVG
                      oficiales; hasta entonces son la única excepción declarada
                      —junto al cuño— a «ni un hex fuera de theme.css». */}
                  <span className={`pue-bandera ${l.bandera}`} />
                  {l.nombre}
                  {l.activo
                    ? <span className="pue-idioma-check">✓</span>
                    : <span className="pue-idioma-pronto">Pronto</span>}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="pue-escena-grid">
          <section className="pue-hero">
            <div className="pue-marca-wrap pue-sube">
              {/* El anfitrión lleva el `aria-label`: sin él la marca se lee "ILEI". */}
              <h1 className="welcome-title" aria-label="AJILEI"><Wordmark /></h1>
            </div>
            <p className="pue-lema-grande pue-sube">La mesa te espera.</p>
            <p className="pue-lema-categoria pue-sube">
              El juego de cartas venezolano — gratis y sin descargas.
            </p>

            <div className="pue-escenario" aria-hidden="true">

              {/* 1 · la baraja */}
              <div className={esc(0)}>
                <div className="pue-abanico">
                  {[0, 1, 2, 3, 4].map((i) => <img key={i} src={reversoUrl} alt="" />)}
                </div>
              </div>

              {/* 2 · el AJILEI de 51 */}
              <div className={esc(1)}>
                <div className={`pue-mano${gana ? ' pue-gana' : ''}`}>
                  {MANO_AJILEI.map((c, i) => (
                    <div className="pue-carta" style={{ '--i': i }} key={i}>
                      <div className="pue-carta-inner">
                        <div className="pue-dorso"><img src={reversoUrl} alt="" /></div>
                        <div className="pue-cara">
                          <img src={pesadas ? c.url : undefined} alt="" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="pue-marcador">
                  <span className="pue-marcador-caja">
                    <b>{suma}</b>
                    <span className={`pue-ajilei-tag${gana ? ' pue-visible' : ''}`}>AJILEI</span>
                    {/* El gesto del ganador · delta 1. Se MONTA en el instante
                        del «51» y se DESMONTA al cambiar de escena, porque su
                        condición es el sello del ganador. Eso es lo que hace que
                        suene una vez por activación y no en bucle: un
                        `animation-iteration-count: 1` no se reinicia solo, pero
                        un nodo que vuelve a nacer trae su animación de nuevas. */}
                    {gana && <span className="pue-vc-pulso" />}
                  </span>
                </div>
              </div>

              {/* 3 · la enseñanza · «un dos por tres» */}
              <div className={esc(2)}>
                <div className="pue-pregunta">
                  <span className="pue-p1">¿No sabes jugar…</span>
                  <span className="pue-p2">…o no te acuerdas?</span>
                </div>
                <div className="pue-trio">
                  {[0, 1, 2].map((i) => <img key={i} src={reversoUrl} alt="" />)}
                </div>
              </div>

              {/* 4 · Heptacoins · el render 3D con alfa (MON-2): siete se apilan,
                  la héroe cae de canto, rebota, se vuelca de cara y recibe el
                  barrido, sobre el verde de la propia portada y con su sombra.
                  Los vectores 2D de la lámina (.pue-mesa-monedas / .pue-pila /
                  .pue-heroe) quedan desconectados de la escena; sus reglas siguen
                  en portada.css y su retiro se decide al sellar. */}
              <div className={esc(ESCENA_RENDER)}>
                <div className="pue-render-monedas">
                  {/* El <img> es el cuadro 16:9 EXACTO que cabe en el contenedor
                      (mismas cajas que certificó mon.7). El póster entra con la
                      política de lo pesado (2,5 s): antes de eso el elemento es
                      una caja vacía del mismo tamaño, y la escena 4 no se ve
                      hasta los 12,5 s. `alt=""` + aria-hidden: es ornamento. */}
                  <img
                    ref={render}
                    className="pue-heptacoin"
                    src={pesadas ? RENDER_HEPTACOIN.poster : undefined}
                    alt=""
                    aria-hidden="true"
                    decoding="async"
                    draggable={false}
                    onError={alFallarElAnimado}
                  />
                </div>
              </div>

              {/* 5 · la mesa real · escritorio laptop + teléfono · móvil teléfono */}
              <div className={esc(4)}>
                <div className="pue-duo">
                  <div className="pue-laptop">
                    <div className="pue-laptop-pantalla">
                      <img src={pesadas ? mesapcUrl : undefined} alt="" />
                    </div>
                    <div className="pue-laptop-base" />
                  </div>
                  <div className="pue-telefono">
                    <div className="pue-pantalla">
                      <img src={pesadas ? mesavUrl : undefined} alt="" />
                    </div>
                  </div>
                </div>
              </div>

            </div>

            <p className={`pue-frase${fraseOculta ? ' pue-oculta' : ''}`} aria-hidden="true">{frase}</p>

            <div className="pue-cta-movil pue-sube">
              <button className="pue-btn-jugar" type="button" onClick={abrirHoja}>JUGAR</button>
              <p className="pue-cta-vacuna">Gratis · Sin descargas · Solo tu correo</p>
            </div>
          </section>

          {/* La tarjeta pausa el rotor mientras alguien escribe: `focusin` en el
              contenedor cubre los dos pasos sin que el formulario tenga que
              saber que hay escenas detrás. */}
          <section
            className="pue-tarjeta"
            aria-label="Entrar a la mesa"
            onFocus={() => { pausada.current = true }}
            onBlur={() => { pausada.current = false }}
          >
            <h2 className="pue-tarjeta-titulo">Entra a la mesa</h2>
            <FormularioPuerta
              onEnviarCodigo={onEnviarCodigo}
              onVerificar={onVerificar}
              lema={LEMA_PORTADA}
            />
          </section>
        </div>

        <footer className="pue-pie-casa">
          <span className="pue-by pue-sube">by</span>
          <span className="pue-casa pue-sube">HEPTACREATION</span>
        </footer>
      </main>

      {/* El velo cierra la hoja al tocar fuera. Vive fuera del <main> para que su
          `position: fixed` no dependa de ningún ancestro con `transform`. */}
      <div
        className="pue-velo"
        onClick={() => setHoja(false)}
        aria-hidden="true"
      />
    </>
  )
}
