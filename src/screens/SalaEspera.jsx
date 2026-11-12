import { useCallback, useEffect, useRef, useState } from 'react'
import '../styles/salas.css'
import reversoUrl from '../assets/cards/reverso_carta.svg?no-inline'

import BarraSuperior from '../components/BarraSuperior'
import HojaConfiguracion from '../components/HojaConfiguracion'
import {
  IconoVolver, IconoCasa, IconoCopiar, IconoCheck, IconoGlobo, IconoCompartir,
} from '../components/IconosSalas'
import { useIdioma } from '../hooks/useIdioma'
import { useSounds, precargarSonidos, SONIDOS_SALAS } from '../hooks/useSounds'
import { useCronometroSala } from '../hooks/useCronometroSala'
import { montoTexto } from '../config/tapetes'
import { claveDeError, esMesa } from '../lib/salasApi'
import { marcar } from '../dev/medirArranque'
import {
  enlaceDeSala,
  finDe,
  posicionSilla,
  resumenDe,
  siguienteConsejo,
  salaParaPartida,
  sillasDe,
  urge,
} from './salaEsperaCore'

// ── SAL-B2 F1b · SalaEspera · la pantalla real ───────────────────────────────
// Rector: AJILEI_SAL-B2_Fase1b_v1.0.md §3 y §4, sobre los informes de Fase 0 y
// F1a. Autoridad visual: `AJILEI_SAL3_lamina_v1.5.html`, sellada.
//
// Reemplaza ENTERO el stub de SAL-B1. Dos vistas sobre la misma pantalla
// (anfitrión / invitado), código y compartir sólo en privada, cronómetro del
// servidor, «Jugar ya» desde 2, mesa llena que arranca sola con la cuenta
// corta, y tres finales para quien ya estaba sentado.
//
// ── EL CONTRATO CON EL SERVIDOR, EN UNA FRASE (§3.1) ──────────────────────
// Realtime dice «algo cambió»; la pantalla vuelve a pedir. Ningún evento se
// interpreta por su payload: al recibir cualquier `{tabla, evento}` se releen
// la fila de la sala y los asientos, en paralelo, y se repinta desde el
// resultado. Es el mismo trato que `suscribirAbiertas` adopta, y es lo que hace
// que un `INSERT` sin username no sea un problema.
//
// ── TODO LO QUE DECIDE VIVE EN EL NÚCLEO ──────────────────────────────────
// `sillasDe`, `resumenDe`, `finDe`, `posicionSilla`, `urge`, `siguienteConsejo`
// y `enlaceDeSala` (`salaEsperaCore.js`, sellado en Vitest). Aquí sólo se
// pinta, se escucha y se limpia.
//
// ── GT-HIG ────────────────────────────────────────────────────────────────
// Cada intervalo, cada `setTimeout`, la suscripción y el `ResizeObserver`
// tienen handle y se cancelan al desmontar o al cambiar de fase. Ningún
// `console.warn` en el camino feliz: el arnés exige consola limpia.

const CONSEJOS = 5
const CONSEJO_MS = 7000
const CONSEJO_FUNDIDO_MS = 420
const MAZO_MS = 22000
const LLEGA_MS = 800
const COPIADO_MS = 2000
const TOAST_MS = 2600
// El barajado de fondo a un cuarto de su volumen de receta (0,6): es ambiente,
// no un evento. Se aplica a ESA reproducción con el handle que `play` devuelve.
const VOLUMEN_BARAJADO = 0.15
// ── Cierre · EL ABANICO MANDA Y EL SONIDO SE ACOMPASA A ÉL ────────────────
// La corrección de los ajustes ataba el dibujo al audio y se quedó a medias:
// medido, `card-shuffle.mp3` dura 5,208 s y el recorte del 49 % de la receta
// deja 2 552 ms de sonido, contra un abanico que ningún techo razonable dejaba
// pasar de 1 400. La decisión de Victor (12-sep-2026) invierte quién manda.
//
// POR QUÉ 1 200 Y NO LA DURACIÓN DEL AUDIO. El recorte del 49 % lo diseñó la
// MESA DE JUEGO para su propio gesto —un barajado que reparte una mano—, y una
// receta pensada para otra pantalla no se hereda: aquí el mazo es ambiente en
// el fieltro y el gesto es corto. 1 200 ms es el abanico de la lámina (900) con
// el aire justo para que se lea a este tamaño, y es UNA sola cifra: gobierna la
// animación por `--sal-esp-baraja` y el apagado del sonido por los dos relojes
// de abajo. Ya no se lee `duration()`, así que no hay dos números que puedan
// separarse.
//
// EL SONIDO MUERE CON EL DIBUJO, Y CON CORTINA. Un corte seco se oye feo: a los
// 1 200 − 250 ms se arranca un desvanecido de 250 y al terminar se detiene ESA
// instancia con el `{ sound, id }` que `play` devolvió. `useSounds.js` no se
// toca: su propio recorte sigue programado para los 2 552 ms y encuentra la
// instancia ya parada, que es una operación sin efecto.
const MAZO_ANIM_MS = 1200
const MAZO_FUNDIDO_MS = 250

export default function SalaEspera({
  api,
  cuenta,
  // ECO-1b · la cifra única de `useBilletera` (App). Aquí sólo la pinta la
  // píldora.
  billetera = null,
  salaInicial = null,
  onSalir,
  onLobby,
  onPartida,
}) {
  const { t } = useIdioma()
  // CFG-1 1a · el ⚙ abre la hoja de configuración (antes, «Pronto»).
  const [hojaAbierta, setHojaAbierta] = useState(false)
  const ajustesRef = useRef(null)
  const { play } = useSounds()
  const saldo = billetera?.saldo ?? null
  const uid = cuenta?.id ?? null

  // ── El estado ─────────────────────────────────────────────────────────────
  const [sala, setSala] = useState(salaInicial)
  const [asientos, setAsientos] = useState(null)      // null = todavía no leídos
  const [resuelta, setResuelta] = useState(null)      // la fila de `resolver_sala`
  const [geo, setGeo] = useState(null)                // la caja de la mesa y del óvalo
  const [llegadas, setLlegadas] = useState(() => new Set())   // asientos que acaban de sentarse
  const [confirmando, setConfirmando] = useState(false)
  const [copiado, setCopiado] = useState(false)
  const [toast, setToast] = useState(null)            // { clave, vars } o null
  const [ocupado, setOcupado] = useState(false)
  const [consejo, setConsejo] = useState(0)
  const [consejoFuera, setConsejoFuera] = useState(false)
  const [barajando, setBarajando] = useState(false)

  // ── Refs: lo que los efectos y los handlers leen sin provocar renders ─────
  const montado = useRef(true)
  const relojes = useRef({ toast: null, copia: null, llega: null })
  const previos = useRef(null)          // Set de jugadorId de la última lectura, o null
  const resolviendo = useRef(false)
  const mesaRef = useRef(null)
  const ovaloRef = useRef(null)
  // Las funciones que cambian en cada render de `App` (los callbacks) y las que
  // devuelve un hook sin memoizar (`play`, `t`) se leen desde aquí para que los
  // efectos con dependencias estables no se vuelvan a montar por ellas.
  const fns = useRef({})
  // 5a · la partida nace con las sillas de la sala: la mesa provisional las pinta desde el primer
  // cuadro (`mesaPvPCore.vistaProvisional`), sin «Arrancando la partida…». Solo si este teléfono
  // vio la sala esperando (`enVivo`, abajo): quien vuelve con la partida en curso, sin sillas.
  const enVivo = useRef(false)
  const aPartida = () => {
    if (import.meta.env.DEV) {   // 5a · `?medir=arranque`, solo de desarrollo
      const s = sillasDe(sala, asientos ?? [], uid)
      marcar('resuelta', { anfitrion: s.find((x) => x.esAnfitrion)?.asiento, propia: s.find((x) => x.esTu)?.asiento })
    }
    onPartida?.(salaParaPartida(sala, asientos, uid, enVivo.current))
  }
  useEffect(() => { fns.current = { play, t, onSalir, onLobby, aPartida } })

  const salaId = sala?.id ?? null

  // ── Lo derivado, todo por el núcleo ───────────────────────────────────────
  // El resumen va ANTES que el final: desde los ajustes, `finDe` necesita saber
  // si quien mira es el anfitrión —una fila 'cancelada' no significa lo mismo
  // para él que para un invitado (defecto E5, lámina v1.6)—.
  const resumen = resumenDe(sala, asientos ?? [], uid)
  const fin = finDe(sala, resuelta, resumen.esAnfitrion)
  // MES-PvP 3 §3.3 · la mesa que arranca se abre sola, sin tocar nada: quien no entraba no
  // montaba el cliente y su sorteo vencía con la posición 0 (Fase 0, §B.9). El CTA se queda
  // por si el efecto no llegara a correr.
  useEffect(() => {
    if (fin === null && sala?.estado === 'esperando') enVivo.current = true
    if (fin === 'activa') fns.current.aPartida()
  }, [fin, sala])
  const sillas = sillasDe(sala, asientos ?? [], uid)
  const abierta = sala?.tipo === 'abierta'
  const nombreAnfitrion = sillas.find((s) => s.esAnfitrion)?.username ?? '…'
  const reloj = useCronometroSala(api, sala?.expira_en ?? null)
  const urgeReloj = urge(reloj.segundos, resumen.llena) && fin === null

  // ── Montaje: la jaula, la precarga, el desmontaje ─────────────────────────
  useEffect(() => {
    document.body.classList.add('sal-activa')
    return () => { document.body.classList.remove('sal-activa') }
  }, [])

  useEffect(() => {
    montado.current = true
    // Los tres de la sala, al montar (SAL-A §5.3). Desde MES-PvP 5a, `App`
    // precarga aquí además la mesa, sus sonidos y la baraja (SIN_PRECARGA).
    precargarSonidos(SONIDOS_SALAS)
    const r = relojes.current
    return () => {
      montado.current = false
      clearTimeout(r.toast)
      clearTimeout(r.copia)
      clearTimeout(r.llega)
    }
  }, [])

  const avisar = useCallback((clave, vars) => {
    setToast({ clave, vars })
    clearTimeout(relojes.current.toast)
    relojes.current.toast = setTimeout(() => setToast(null), TOAST_MS)
  }, [])

  // ── Sin mesa al nacer: la de `mi_sala()`, o fuera ─────────────────────────
  // `salaInicial` es una fila real que ya pasó `esMesa` en `App`. Si por lo que
  // fuera llega `null`, se pregunta una vez; sin respuesta, no hay nada que
  // esperar y se vuelve a la sala de opciones.
  useEffect(() => {
    if (sala !== null) return
    let vivo = true
    api.miSala().then(({ data }) => {
      if (!vivo || !montado.current) return
      if (esMesa(data)) setSala(data)
      else fns.current.onSalir?.()
    })
    return () => { vivo = false }
  }, [api, sala])

  // ── Los asientos que llegan: quién es nuevo ───────────────────────────────
  // Se compara contra la lectura anterior por `jugadorId`. La PRIMERA lectura
  // no suena ni salta: es la foto de partida, no una llegada.
  const recibirAsientos = useCallback((filas) => {
    const ids = new Set(filas.map((f) => f.jugadorId))
    const anteriores = previos.current
    previos.current = ids
    setAsientos(filas)
    if (anteriores === null) return

    const nuevos = filas.filter((f) => !anteriores.has(f.jugadorId))
    if (nuevos.length === 0) return
    setLlegadas(new Set(nuevos.map((f) => f.asiento)))
    clearTimeout(relojes.current.llega)
    relojes.current.llega = setTimeout(() => { if (montado.current) setLlegadas(new Set()) }, LLEGA_MS)
    // Ajustes · el golpe en la mesa es «ya llegué»: corto y seco, y no compite
    // con el toast que sale en el mismo instante (decisión de Victor).
    fns.current.play?.('tableKnock')
    avisar('sal.espera.llego', { quien: nuevos[0].username ?? '?' })
  }, [avisar])

  // ── Primera lectura y suscripción ─────────────────────────────────────────
  useEffect(() => {
    if (!salaId) return
    let vivo = true
    const releer = () => {
      Promise.all([api.leerSala(salaId), api.asientosDe(salaId)]).then(([fila, filas]) => {
        if (!vivo || !montado.current) return
        if (esMesa(fila.data)) setSala(fila.data)
        if (Array.isArray(filas.data)) recibirAsientos(filas.data)
      })
    }
    releer()
    const baja = api.suscribirSala(salaId, releer)
    return () => { vivo = false; baja() }
  }, [api, salaId, recibirAsientos])

  // ── El reloj a cero: resolver UNA vez ─────────────────────────────────────
  // Sólo mientras la fila conocida siga 'esperando' y no haya final. Si
  // Realtime trae antes la fila terminal, `finDe(sala, null)` ya decidió y esto
  // no corre. Si el servidor dice que sigue esperando (el reloj local se
  // adelantó), la guarda se suelta y se vuelve a intentar en cuanto el
  // cronómetro corregido llegue otra vez a cero.
  useEffect(() => {
    if (!salaId || fin !== null || sala?.estado !== 'esperando' || reloj.segundos !== 0) return
    if (resolviendo.current) return
    resolviendo.current = true
    if (import.meta.env.DEV) marcar('sala-cero')   // 5a · `?medir=arranque`, solo de desarrollo
    api.resolverSala(salaId).then(({ data }) => {
      resolviendo.current = false
      if (!montado.current || !esMesa(data)) return
      setResuelta(data)
    })
  }, [api, salaId, fin, sala?.estado, reloj.segundos])

  // ── La geometría del anillo ───────────────────────────────────────────────
  // `ResizeObserver` dispara su primer callback al observar, así que no hay
  // `setState` en el cuerpo del efecto: la primera medida llega como cualquier
  // otra. Las sillas son hijas absolutas de la mesa y no cambian su tamaño, así
  // que colocarlas no vuelve a disparar la observación.
  useEffect(() => {
    const mesa = mesaRef.current
    const ovalo = ovaloRef.current
    if (!mesa || !ovalo || typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(() => {
      setGeo({ W: mesa.clientWidth, H: mesa.clientHeight, ow: ovalo.offsetWidth, oh: ovalo.offsetHeight })
    })
    ro.observe(mesa)
    return () => ro.disconnect()
  }, [salaId])

  // ── Consejos: una línea que rota cada 7 s, parada en el final ─────────────
  useEffect(() => {
    if (fin !== null) return
    let fundido = null
    const id = setInterval(() => {
      setConsejoFuera(true)
      fundido = setTimeout(() => {
        setConsejo((i) => siguienteConsejo(i, CONSEJOS))
        setConsejoFuera(false)
      }, CONSEJO_FUNDIDO_MS)
    }, CONSEJO_MS)
    return () => { clearInterval(id); clearTimeout(fundido) }
  }, [fin])

  // ── El mazo se baraja cada 22 s, con `cardShuffle` bajito ────────────────
  // Ajustes · defecto E8: con el Motorola sentado y LA PANTALLA APAGADA se oía
  // barajar. `useCongelado` (FRZ-1) silencia Howler en segundo plano, pero sólo
  // lo monta la mesa de juego, y traerlo aquí abre un frente que esta tanda no
  // tiene. La guarda es doble y barata: el intervalo se PARA al ocultarse la
  // pestaña y vuelve a arrancar al volver —así se reanuda el ciclo normal y no
  // se descarga de golpe ningún barajado acumulado—, y el propio pulso mira
  // `document.hidden` por si la pestaña ya nació oculta y el evento no llega.
  //
  // Y el sonido se acompasa al abanico (cierre): los dos salen del MISMO pulso
  // y del MISMO handle, y el sonido muere con cortina cuando el dibujo se
  // cierra. `callar` cancela los dos relojes Y para la instancia en el mismo
  // gesto —cancelar sin parar dejaría sonando el resto del archivo, que es
  // justo el defecto que esto existe para quitar, y es el molde de
  // `cancelaRecorte` en `useSounds.js`—.
  useEffect(() => {
    if (fin !== null) return
    let vuelta = null
    let fundido = null
    let parada = null
    let id = null
    let vivo = null              // el `{ sound, id }` de la reproducción en curso
    const callar = () => {
      clearTimeout(fundido)
      clearTimeout(parada)
      if (vivo && typeof vivo.sound.stop === 'function') {
        try { vivo.sound.stop(vivo.id) } catch { /* esa instancia ya no existe */ }
      }
      vivo = null
    }
    const baraja = () => {
      if (document.hidden) return
      callar()
      const r = fns.current.play?.('cardShuffle')
      if (r?.sound && typeof r.sound.volume === 'function') {
        r.sound.volume(VOLUMEN_BARAJADO, r.id)
        if (typeof r.sound.fade === 'function') {
          vivo = r
          fundido = setTimeout(() => {
            r.sound.fade(VOLUMEN_BARAJADO, 0, MAZO_FUNDIDO_MS, r.id)
            parada = setTimeout(callar, MAZO_FUNDIDO_MS)
          }, MAZO_ANIM_MS - MAZO_FUNDIDO_MS)
        }
      }
      // Sin handle —el audio está apagado en el `SoundContext`— el abanico
      // corre igual sus 1 200 ms y no hay nada que desvanecer.
      setBarajando(true)
      clearTimeout(vuelta)
      vuelta = setTimeout(() => setBarajando(false), MAZO_ANIM_MS)
    }
    const arranca = () => { if (id === null) id = setInterval(baraja, MAZO_MS) }
    const alCambiar = () => {
      if (!document.hidden) { arranca(); return }
      clearInterval(id); id = null
      clearTimeout(vuelta); setBarajando(false)
      callar()
    }
    if (!document.hidden) arranca()
    document.addEventListener('visibilitychange', alCambiar)
    return () => {
      document.removeEventListener('visibilitychange', alCambiar)
      clearInterval(id)
      clearTimeout(vuelta)
      callar()
    }
  }, [fin])

  // ── Handlers ──────────────────────────────────────────────────────────────
  const copiar = () => {
    if (!sala?.codigo) return
    navigator.clipboard?.writeText(sala.codigo).then(() => {
      if (!montado.current) return
      setCopiado(true)
      clearTimeout(relojes.current.copia)
      relojes.current.copia = setTimeout(() => setCopiado(false), COPIADO_MS)
    }).catch(() => {})
  }

  const compartir = async () => {
    const url = enlaceDeSala(sala?.codigo)
    if (!url) return
    const text = t('sal.espera.compartir.msg', { n: sala.jugadores, hc: montoTexto(sala.apuesta), url })
    if (typeof navigator.share === 'function') {
      try { await navigator.share({ text, url }) } catch { /* el jugador cerró la hoja */ }
      return
    }
    try {
      await navigator.clipboard?.writeText(text)
      avisar('sal.espera.codigo.copiado')
    } catch { /* sin portapapeles: el código sigue en pantalla */ }
  }

  const jugarYa = async () => {
    if (!salaId || ocupado) return
    setOcupado(true)
    const { data, error } = await api.jugarYa(salaId)
    if (!montado.current) return
    setOcupado(false)
    if (error) { avisar(claveDeError(error)); return }
    if (esMesa(data)) {
      // Ajustes · las fichas suenan cuando la apuesta entra en juego (decisión
      // de Victor; antes era el golpe de mesa, que ahora es de la llegada).
      play('chipsCollect')
      setSala(data)
    }
  }

  const salirDeVerdad = async () => {
    setConfirmando(false)
    setOcupado(true)
    const { error } = await api.salirSala(salaId)
    if (!montado.current) return
    setOcupado(false)
    // Se sale IGUAL si el servidor falla: dejar al jugador encerrado por un
    // error de red sería el peor de los dos males, y el barrido cierra la fila.
    if (error) avisar(claveDeError(error))
    onSalir?.()
  }

  // La salida de un final: la mesa está muerta (o arrancó); no hay `salir_sala`.
  const salirDelFinal = () => {
    if (fin === 'activa') aPartida()
    else onSalir?.()
  }

  // «Volver» y «Salir de la mesa»: el anfitrión confirma, el invitado sale.
  const salir = () => {
    if (fin !== null) { salirDelFinal(); return }
    if (resumen.esAnfitrion) setConfirmando(true)
    else salirDeVerdad()
  }

  // La casita NO cancela (sellado): con la mesa viva, reabrir reanuda. En un
  // final hace lo mismo que el CTA del final.
  const casa = () => {
    if (fin !== null) { salirDelFinal(); return }
    onLobby?.()
  }

  useEffect(() => {
    if (!confirmando) return
    const alTeclear = (e) => { if (e.key === 'Escape') setConfirmando(false) }
    document.addEventListener('keydown', alTeclear)
    return () => document.removeEventListener('keydown', alTeclear)
  }, [confirmando])

  // ── Pintura ───────────────────────────────────────────────────────────────
  const claveTipo = abierta ? 'sal.espera.tipo.abierta' : 'sal.espera.tipo.privada'
  const subtitulo = !sala
    ? ' '
    : resumen.esAnfitrion
      ? t('sal.espera.anfitrion.tu', { tipo: t(claveTipo) })
      : t('sal.espera.sub.inv', { anf: nombreAnfitrion, tipo: t(claveTipo) })

  const clasesCuerpo = [
    'sal-cuerpo', 'sal-esp',
    fin !== null ? `is-fin is-fin-${fin}` : '',
    resumen.llena && fin === null ? 'is-llena' : '',
  ].filter(Boolean).join(' ')

  // La acción, en su única caja (O1): CTA o caja punteada, y la nota debajo.
  let accion
  if (fin === 'activa') {
    accion = (
      <>
        <button type="button" className="sal-cta" data-accion="cta" onClick={aPartida}>
          {t('sal.espera.fin.entrar')}
        </button>
        <small data-accion="cta-nota"> </small>
      </>
    )
  } else if (fin !== null) {
    accion = (
      <>
        <button type="button" className="sal-cta" data-accion="cta" onClick={() => onSalir?.()}>
          {t('sal.espera.fin.volver')}
        </button>
        <small data-accion="cta-nota"> </small>
      </>
    )
  } else if (resumen.llena) {
    accion = (
      <>
        <div className="sal-esp-espera" data-accion="espera">{t('sal.espera.llena')}</div>
        <small data-accion="cta-nota">{t(resumen.esAnfitrion ? 'sal.espera.llena.nota' : 'sal.espera.salir.inv')}</small>
      </>
    )
  } else if (resumen.esAnfitrion) {
    accion = (
      <>
        <button
          type="button"
          className="sal-cta"
          data-accion="cta"
          disabled={!resumen.puedeJugarYa || ocupado}
          onClick={jugarYa}
        >
          {t('sal.espera.jugar')}
        </button>
        <small data-accion="cta-nota">{t(resumen.puedeJugarYa ? 'sal.espera.jugar.nota' : 'sal.espera.jugar.min')}</small>
      </>
    )
  } else {
    accion = (
      <>
        <div className="sal-esp-espera" data-accion="espera">{t('sal.espera.esperando')}</div>
        <small data-accion="cta-nota">{t('sal.espera.salir.inv')}</small>
      </>
    )
  }

  return (
    <main className="sal">
      <div className="sal-fondo" aria-hidden="true" />

      <BarraSuperior
        usuario={cuenta?.username ?? ''}
        saldo={saldo}
        estadoSaldo={billetera?.estado}
        recordado={billetera?.recordado ?? null}
        cobrando={billetera?.pendiente === true}
        onPerfil={cuenta?.abrirPerfil ?? (() => avisar('lob.toast.pronto'))}
        onAjustes={() => setHojaAbierta(true)}
        ajustesRef={ajustesRef}
        ajustesExpandido={hojaAbierta}
      />

      <div className="sal-cab">
        <button
          type="button"
          className="sal-volver"
          data-accion="volver"
          aria-label={t('sal.volver.aria')}
          disabled={ocupado}
          onClick={salir}
        >
          <IconoVolver />
        </button>
        <div className="sal-esp-tit">
          <h1>
            {sala ? t('sal.espera.titulo', { n: sala.jugadores, hc: montoTexto(sala.apuesta) }) : ' '}
          </h1>
          <span className="sal-esp-sub" data-accion="sub">{subtitulo}</span>
        </div>
      </div>

      <div className={clasesCuerpo} data-accion="espera-cuerpo">

        {/* ── El código (privada) o el rótulo (abierta): la misma caja, O1 ── */}
        <section className={`sal-esp-codigo${abierta ? ' is-abierta' : ''}`} data-accion="codigo-caja">
          <div className="sal-esp-codigo-col">
            <div className="sal-esp-eti">{abierta ? ' ' : t('sal.espera.cod.eti')}</div>
            <div className="sal-esp-cod" data-accion="codigo-sala">
              {abierta ? (
                <>
                  <IconoGlobo />
                  <span>{t('sal.espera.abierta.rot')}</span>
                </>
              ) : (
                <>
                  <span>{sala?.codigo ?? ' '}</span>
                  {/* PAN-1 1c · copiar y compartir no piden la pantalla completa:
                      pedirla gasta la activación del toque que ellos necesitan. */}
                  <button
                    type="button"
                    className={`sal-copiar${copiado ? ' is-hecho' : ''}`}
                    data-accion="copiar"
                    data-sin-pantalla-completa=""
                    aria-label={t(copiado ? 'sal.espera.codigo.copiado' : 'sal.espera.codigo.copiar')}
                    onClick={copiar}
                  >
                    {copiado ? <IconoCheck /> : <IconoCopiar />}
                  </button>
                </>
              )}
            </div>
          </div>
          <button type="button" className="sal-esp-compartir" data-accion="compartir" data-sin-pantalla-completa="" onClick={compartir}>
            <IconoCompartir />
            <span>{t('sal.espera.compartir')}</span>
          </button>
        </section>

        {/* ── La mesa: óvalo con cronómetro, sillas en anillo ─────────────── */}
        <section className="sal-esp-mesa" ref={mesaRef} aria-label={t('sal.espera.sentados', { x: resumen.sentados, n: resumen.jugadores })} data-accion="mesa">
          <div className="sal-esp-ovalo" ref={ovaloRef}>
            <div className="sal-esp-marca" aria-hidden="true" />
            <div
              className={`sal-esp-mazo${barajando ? ' is-baraja' : ''}`}
              style={barajando ? { '--sal-esp-baraja': `${MAZO_ANIM_MS}ms` } : undefined}
              aria-hidden="true"
              data-accion="mazo"
            >
              <img src={reversoUrl} alt="" />
              <img src={reversoUrl} alt="" />
              <img src={reversoUrl} alt="" />
            </div>
            <div
              className={`sal-esp-reloj${urgeReloj ? ' is-urge' : ''}${resumen.llena && fin === null ? ' is-llena' : ''}`}
              data-accion="reloj"
            >
              {reloj.texto}
            </div>
            <div className="sal-esp-estado" data-accion="estado">
              {resumen.llena
                ? t('sal.espera.llena.corta')
                : t('sal.espera.sentados', { x: resumen.sentados, n: resumen.jugadores })}
            </div>
            <div className="sal-esp-fin" role="status" aria-live="assertive" data-accion="fin">
              {fin !== null ? t(`sal.espera.fin.${fin}`) : ''}
            </div>
          </div>

          {geo && sillas.map((s, i) => {
            const sillaPx = (geo.W - geo.ow) / 2
            const rx = geo.ow / 2 + sillaPx * 0.55
            const ry = geo.oh / 2 + sillaPx * 0.55
            const av = sillaPx * 0.72
            const p = posicionSilla(i, sillas.length, rx, ry, geo.W / 2, geo.H / 2)
            // El borde del avatar se ancla sobre el anillo, como en la lámina.
            const y = p.arriba ? p.y + av / 2 : p.y - av / 2
            const style = p.arriba
              ? { left: `${p.x}px`, bottom: `${geo.H - y}px` }
              : { left: `${p.x}px`, top: `${y}px` }
            const clases = [
              'sal-esp-silla',
              p.arriba ? 'is-arriba' : 'is-abajo',
              s.vacia ? 'is-vacia' : '',
              s.esTu ? 'is-tu' : '',
              llegadas.has(s.asiento) ? 'is-llega' : '',
            ].filter(Boolean).join(' ')
            return (
              <div key={s.asiento} className={clases} style={style} data-accion="silla" data-asiento={s.asiento}>
                <div className="sal-esp-av">
                  {s.vacia ? null : <span className="sal-esp-ini" aria-hidden="true">{s.inicial}</span>}
                </div>
                <div className="sal-esp-n">{s.vacia ? t('sal.espera.vacia') : s.username ?? '?'}</div>
                <div className="sal-esp-tag">
                  {s.esAnfitrion ? t('sal.espera.anfitrion') : s.esTu ? t('sal.espera.tu') : ' '}
                </div>
              </div>
            )
          })}
        </section>

        {/* ── Un consejo mientras esperas, con caja reservada ─────────────── */}
        <p className={`sal-esp-consejo${consejoFuera ? ' is-fuera' : ''}`} aria-live="polite" data-accion="consejo">
          {t(`sal.espera.consejo.${consejo + 1}`)}
        </p>

        {/* ── La acción, siempre en la misma caja ──────────────────────────── */}
        <section className="sal-accion sal-esp-accion" data-accion="accion">
          {accion}
        </section>

        {/* ── Ajustes (lámina v1.6) · «Salir de la mesa» ───────────────────
            FUERA del nodo que la acción repinta y justo debajo, como sella la
            lámina. Hace exactamente lo que la flecha «Volver»: el anfitrión
            confirma, el invitado sale. En los tres finales el CSS lo apaga con
            `visibility` y le conserva la caja: el CTA del final ya es la salida
            y la columna no debe moverse al terminar la mesa (O1). */}
        <button
          type="button"
          className="sal-esp-salir"
          data-accion="salir"
          disabled={ocupado}
          onClick={salir}
        >
          {t('sal.espera.salir')}
        </button>

        {/* ── La confirmación del anfitrión ────────────────────────────────── */}
        <div className={`sal-esp-velo${confirmando ? ' is-on' : ''}`} onClick={() => setConfirmando(false)} aria-hidden="true" />
        <div
          className={`sal-esp-dialogo${confirmando ? ' is-on' : ''}`}
          role="dialog"
          aria-modal="true"
          aria-labelledby="sal-esp-dialogo-titulo"
          aria-hidden={confirmando ? undefined : 'true'}
          data-accion="dialogo"
        >
          <h2 id="sal-esp-dialogo-titulo">{t('sal.espera.cancelar')}</h2>
          <p>{t('sal.espera.cancelar.p')}</p>
          <div className="sal-esp-botones">
            <button type="button" className="sal-secundario is-seguir" data-accion="cancelar-no" onClick={() => setConfirmando(false)}>
              {t('sal.espera.cancelar.no')}
            </button>
            <button type="button" className="sal-secundario is-cancelar" data-accion="cancelar-si" disabled={ocupado} onClick={salirDeVerdad}>
              {t('sal.espera.cancelar.si')}
            </button>
          </div>
        </div>
      </div>

      <button
        type="button"
        className="sal-casa"
        data-accion="casa"
        aria-label={t('sal.casa.aria')}
        onClick={casa}
      >
        <IconoCasa />
      </button>

      <div className={`sal-toast${toast !== null ? ' is-on' : ''}`} role="status" aria-live="polite">
        {toast !== null ? t(toast.clave, toast.vars) : ' '}
      </div>
      {/* CFG-1 1a · la hoja del ⚙, la misma del lobby. Va DESPUÉS de
          `.sal-cuerpo`, hija directa de `main.sal`: su velo (z 6) y ella (z 7)
          quedan por encima del cuerpo (z 1), y con él del velo y el diálogo de
          «Cancelar», que viven DENTRO del cuerpo y no se tocan. «Cerrar
          sesión» desde aquí sale como desde el lobby; la mesa en espera queda
          a cargo del barrido del servidor (MES-PvP). */}
      <HojaConfiguracion
        abierta={hojaAbierta}
        onCerrar={() => setHojaAbierta(false)}
        ajustesRef={ajustesRef}
        cuenta={cuenta}
      />
    </main>
  )
}
