import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import '../styles/tienda.css'

import PantallaChips from '../components/PantallaChips'
import Vitrina from '../components/Vitrina'
import ChipToken from '../components/ChipToken'
import { IconoPlay, IconoBolsa } from '../components/IconosVideo'
import { CAJA } from '../components/zonaAccionCore'
import { useIdioma } from '../hooks/useIdioma'
import { useSounds } from '../hooks/useSounds'
import { useVideo } from '../hooks/useVideo'
import { useTapetes } from '../hooks/useTapetes'
import { estaComprado } from '../hooks/tapetesCore'
import { ESTANTES, normalizarEstante, vistaArticulo, trasCompra, teQuedaran, TOPE_COMPRA_MS } from '../hooks/tiendaCore'
import { TAPETES, TONOS, conTonos, montoTexto } from '../config/tapetes'
import { saldoOculto as ojitoGuardado } from '../lib/saldoOculto'

// ── TIE-1 1a · La tienda ─────────────────────────────────────────────────────
// Rector: AJILEI_TIE-1_Fase1a_v1.0.md §3.4; lámina `laminas/tie1a`, sellada
// por Victor el 2026-10-31: V2-B (cinco estantes), V3-A (filas), V4-A (la mesa
// entera, muestras redondas), V5-A (ventana centrada).
//
// LA CARCASA ES `PantallaChips` (familia `.sal`): barra con la píldora, ⚙,
// flecha y casa, cuerpo que desplaza y la zona de acción anclada al pie. La
// flecha vuelve a la pantalla de la que se entró (o, desde un artículo, a su
// estante); la casa, al lobby.
//
// ── EL SERVIDOR MANDA ───────────────────────────────────────────────────────
// Lo comprado y lo puesto son la foto del canal (`lib/controlTapetes`), que
// cambia sólo con el `'ok'` del servidor. Comprar, usar y elegir tono son sus
// tres llamadas; aquí no se decide nada por adelantado. Al entrar se relee el
// inventario.
//
// ── EL ESTANTE MONEDAS ES LA HOJA DE ANTES ──────────────────────────────────
// Las dos filas de «Conseguir monedas» (`HojaMonedas`, retirada), con sus
// clases `vid-*` y sus textos `video.*`: el video por el contexto del video
// (`MarcoVideo` envuelve esta pantalla) y los paquetes, «Pronto».
//
// ── EL OJITO (INV-69, redactado de nuevo en la 1a) ──────────────────────────
// La píldora de esta barra tapa la cifra si el jugador la tapó, y deja
// destaparla aquí mismo, como en el lobby. La ventana de compra enseña «Tu
// saldo» y «Te quedarán» SIEMPRE: no se compra a ciegas.

const AVISO_LISTO_MS = 2600

function Estantes({ activo, onElegir, onPronto }) {
  const { t } = useIdioma()
  const fila = useRef(null)
  // En teléfono la fila desplaza: la activa, a la vista.
  useEffect(() => {
    const b = fila.current?.querySelector('[aria-pressed="true"]')
    const f = fila.current
    if (!b || !f || f.scrollWidth <= f.clientWidth) return
    const izq = b.offsetLeft - f.offsetLeft
    if (izq < f.scrollLeft || izq + b.offsetWidth > f.scrollLeft + f.clientWidth) f.scrollLeft = izq
  }, [activo])
  return (
    <div ref={fila} className="sal-chips tie-estantes" role="group" aria-label={t('lob.nav.tienda')}>
      {ESTANTES.map((e) => (
        <button
          key={e.id}
          type="button"
          className={`sal-chip tie-estante${e.pronto ? ' is-pronto' : ''}`}
          data-accion={`tie-estante-${e.id}`}
          aria-pressed={activo === e.id}
          aria-disabled={e.pronto ? 'true' : undefined}
          onClick={() => (e.pronto ? onPronto() : onElegir(e.id))}
        >
          <span>{t(`tie.estante.${e.id}`)}</span>
          {e.pronto && <span className="lob-pastilla tie-pronto">{t('lob.toast.pronto')}</span>}
        </button>
      ))}
    </div>
  )
}

function EstanteMonedas() {
  const { t } = useIdioma()
  const { play } = useSounds()
  const video = useVideo()
  // La hoja de antes preguntaba al abrirse cuántos videos quedan hoy; el
  // estante lo hace al montarse.
  const mirar = video?.mirar
  useEffect(() => { mirar?.() }, [mirar])
  return (
    <div className="tie-monedas" data-accion="tie-monedas">
      <button
        type="button"
        className="vid-fila"
        data-accion="video-pedir"
        disabled={video?.apagado === true}
        onClick={() => { play('buttonClick'); video?.pedir() }}
      >
        <span className="vid-fila-ico"><IconoPlay /></span>
        <span className="vid-fila-txt">
          <b>{t('video.hoja.video')}</b>
          <small className="vid-quedan" data-accion="video-quedan">{video?.contador ?? ' '}</small>
        </span>
        <span className="vid-fila-premio"><ChipToken size="icon" />{t('video.premio.corto', { hc: montoTexto(video?.premio ?? 0) })}</span>
      </button>
      <div className="vid-fila vid-fila-off" data-accion="paquetes" aria-disabled="true">
        <span className="vid-fila-ico"><IconoBolsa /></span>
        <span className="vid-fila-txt"><b>{t('video.hoja.paquetes')}</b></span>
        <span className="vid-pastilla">{t('lob.toast.pronto')}</span>
      </div>
    </div>
  )
}

// La pastilla de la lista: tres franjas (claro · actual · oscuro) en los que
// tienen tonos; una sola en el verde y el tricolor.
function Pastilla({ id }) {
  return (
    <span className="tie-pastilla" aria-hidden="true">
      {conTonos(id)
        ? TONOS.map((tn) => <Vitrina key={tn} tapete={id} tono={tn} tamano="muestra" className="tie-franja" />)
        : <Vitrina tapete={id} tamano="muestra" className="tie-franja" />}
    </span>
  )
}

function ListaTapetes({ foto, ocupado, onAbrir, onUsar }) {
  const { t } = useIdioma()
  const enUso = foto?.enUso
  return (
    <div className="tie-lista" data-accion="tie-lista">
      {TAPETES.map((tap) => {
        const comprado = tap.precio === 0 || (foto?.cargado === true && estaComprado(tap.id, foto.comprados))
        return (
          <div key={tap.id} className={`tie-art${enUso === tap.id ? ' is-enuso' : ''}`} data-tap={tap.id}>
            <button type="button" className="tie-art-abre" data-accion="tie-art" onClick={() => onAbrir(tap.id)}>
              <Pastilla id={tap.id} />
              <span className="tie-art-txt">
                <b>{tap.nombre}</b>
                <small>{tap.descripcion}</small>
              </span>
            </button>
            {enUso === tap.id
              ? <span className="tie-enuso" data-accion="tie-enuso">✓ {t('tie.en_uso')}</span>
              : comprado
                ? (
                  <button type="button" className="sal-chip tie-usar" data-accion="tie-usar" disabled={ocupado} onClick={() => onUsar(tap.id)}>
                    {t('tie.usar')}
                  </button>
                )
                : <span className="tie-precio"><ChipToken size="icon" />{montoTexto(tap.precio)}</span>}
          </div>
        )
      })}
    </div>
  )
}

function SelectorTono({ tapete, tono, onElegir }) {
  const { t } = useIdioma()
  return (
    <div className="tie-tonos" role="radiogroup" aria-label={t('tie.tono')}>
      {TONOS.map((tn) => (
        <button
          key={tn}
          type="button"
          role="radio"
          aria-checked={tono === tn}
          className={`tie-tono${tono === tn ? ' is-on' : ''}`}
          data-accion={`tie-tono-${tn}`}
          onClick={() => onElegir(tn)}
        >
          <Vitrina tapete={tapete} tono={tn} tamano="disco" className="tie-tono-disco" />
          <span>{t(`tie.tono.${tn}`)}</span>
        </button>
      ))}
    </div>
  )
}

// V5-A · molde de la ventana de «Eliminar cuenta»: velo, tarjeta, título,
// cifras y dos botones de 48. `estado`: 'confirmar' · 'comprando' · 'error'.
function Ventana({ estado, tap, saldo, onNo, onSi }) {
  const { t } = useIdioma()
  const titulo = useRef(null)
  const comprando = estado === 'comprando'
  useEffect(() => { titulo.current?.focus({ preventScroll: true }) }, [])
  useEffect(() => {
    const alPulsar = (e) => { if (e.key === 'Escape' && !comprando) onNo() }
    document.addEventListener('keydown', alPulsar)
    return () => document.removeEventListener('keydown', alPulsar)
  }, [comprando, onNo])
  const [antes, despues] = t('tie.compra.titulo', { nombre: '\u0000' }).split('\u0000')
  return createPortal(
    <div className="tie-ven-raiz">
      <div className="tie-ven-velo" aria-hidden="true" onClick={comprando ? undefined : onNo} />
      <div className="tie-ven" role="alertdialog" aria-modal="true" aria-labelledby="tie-ven-t" data-accion="tie-ventana" data-estado={estado}>
        <h2 id="tie-ven-t" className="tie-ven-t" tabIndex={-1} ref={titulo}>{antes}<b>{tap.nombre}</b>{despues}</h2>
        <dl className="tie-ven-cifras">
          <div><dt>{t('tie.compra.precio')}</dt><dd><ChipToken size="icon" />{montoTexto(tap.precio)} HC</dd></div>
          <div><dt>{t('tie.compra.saldo')}</dt><dd data-accion="tie-ven-saldo">{montoTexto(saldo ?? 0)} HC</dd></div>
          <div className="tie-ven-queda"><dt>{t('tie.compra.queda')}</dt><dd data-accion="tie-ven-queda">{montoTexto(teQuedaran(saldo, tap.precio))} HC</dd></div>
        </dl>
        {/* O1 · la línea del error tiene su sitio siempre. */}
        <p className={`tie-ven-error${estado === 'error' ? ' is-on' : ''}`} role="status">
          {estado === 'error' ? t('tie.compra.error') : ' '}
        </p>
        <div className="tie-ven-btns">
          <button type="button" className="tie-ven-btn tie-ven-no" data-accion="tie-compra-no" disabled={comprando} onClick={onNo}>
            {t('lob.cfg.no')}
          </button>
          <button
            type="button"
            className="tie-ven-btn tie-ven-si"
            data-accion="tie-compra-si"
            disabled={comprando}
            aria-busy={comprando || undefined}
            onClick={onSi}
          >
            {comprando ? t('tie.compra.comprando') : t('tie.compra.si')}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}

export default function Tienda({
  cuenta,
  billetera = null,
  aviso = null,
  onAvisoFin,
  control,
  estanteInicial,
  onVolver,
  onLobby,
}) {
  const { t } = useIdioma()
  const { play } = useSounds()
  const foto = useTapetes(control)
  const [estante, setEstante] = useState(() => normalizarEstante(estanteInicial))
  const [articulo, setArticulo] = useState(null)      // id del tapete abierto, o null
  const [previa, setPrevia] = useState(null)          // tono de vista previa (no comprado)
  const [ventana, setVentana] = useState(null)        // null · 'confirmar' · 'comprando' · 'error'
  const [listo, setListo] = useState(false)
  const [ocupado, setOcupado] = useState(false)       // un «Usar» o un tono en vuelo
  const [oculto, setOculto] = useState(() => ojitoGuardado.leer())
  const avisoRef = useRef(null)
  const vivo = useRef(true)
  const relojListo = useRef(null)

  useEffect(() => {
    vivo.current = true
    control?.refrescar()
    return () => { vivo.current = false; clearTimeout(relojListo.current) }
  }, [control])

  const saldo = billetera?.saldo ?? null
  const vista = articulo ? vistaArticulo({ id: articulo, foto, saldo, previa }) : null

  const alternarOjito = () => {
    const nuevo = !oculto
    ojitoGuardado.guardar(nuevo)
    setOculto(nuevo)
  }

  const abrir = (id) => { play('buttonClick'); setArticulo(id); setPrevia(null); setListo(false) }
  const cerrarArticulo = () => { setArticulo(null); setPrevia(null); setListo(false); setVentana(null) }
  const irAEstante = (id) => { cerrarArticulo(); setEstante(id) }

  const cambiar = useCallback(async (llamada) => {
    setOcupado(true)
    const motivo = await llamada()
    if (!vivo.current) return
    setOcupado(false)
    if (motivo !== 'ok') avisoRef.current?.avisar('tie.cambio.error')
  }, [])
  const usar = (id) => { play('buttonClick'); cambiar(() => control.usar(id)) }
  const elegirTono = (tn) => {
    play('buttonClick')
    if (vista?.comprado) cambiar(() => control.elegirTono(articulo, tn))
    else setPrevia(tn)
  }

  const cerrarVentana = useCallback(() => setVentana(null), [])
  const comprar = async () => {
    play('buttonClick')
    setVentana('comprando')
    let reloj
    const tope = new Promise((ok) => { reloj = setTimeout(() => ok(null), TOPE_COMPRA_MS) })
    const motivo = await Promise.race([control.comprar(articulo, vista?.tono ?? null), tope])
    clearTimeout(reloj)
    if (!vivo.current) return
    const r = trasCompra(motivo)
    if (r === 'error') { setVentana('error'); return }
    setVentana(null)
    if (r === 'listo' || r === 'sin_saldo') billetera?.refrescar?.()
    if (r === 'listo') {
      setListo(true)
      clearTimeout(relojListo.current)
      relojListo.current = setTimeout(() => setListo(false), AVISO_LISTO_MS)
    }
  }

  // ── La zona anclada de la vista del artículo ──────────────────────────────
  let cta = null
  let pie = null
  if (vista) {
    const enUsoPie = <p className="tie-enuso tie-enuso-pie" data-accion="tie-enuso">✓ {t('tie.en_uso')}</p>
    if (vista.cta === 'en_uso') {
      pie = listo
        ? <>{enUsoPie}<div className="tie-listo" role="status" data-accion="tie-listo">{t('tie.listo', { nombre: vista.tap.nombre })}</div></>
        : enUsoPie
    } else if (vista.cta === 'usar') {
      cta = { etiqueta: t('tie.usar'), disabled: ocupado, onClick: () => usar(articulo) }
    } else {
      const falta = vista.cta === 'falta'
      cta = {
        etiqueta: t('tie.comprar', { precio: montoTexto(vista.tap.precio) }),
        disabled: vista.cta !== 'comprar',
        caja: falta ? { tipo: CAJA.NOTA, texto: t('tie.falta', { n: montoTexto(vista.falta) }) } : { tipo: CAJA.NADA },
        onClick: () => { play('buttonClick'); setVentana('confirmar') },
      }
      if (falta) {
        pie = (
          <button type="button" className="tie-enlace" data-accion="tie-conseguir" onClick={() => irAEstante('monedas')}>
            {t('video.hoja.titulo')}
          </button>
        )
      }
    }
  }

  return (
    <PantallaChips
      titulo={vista ? vista.tap.nombre : t('lob.nav.tienda')}
      clase={`es-tienda${vista ? ' es-vitrina' : ''}`}
      cuenta={cuenta}
      saldo={saldo}
      estadoSaldo={billetera?.estado}
      recordado={billetera?.recordado ?? null}
      cobrando={billetera?.pendiente === true}
      aviso={aviso}
      onAvisoFin={onAvisoFin}
      saldoOculto={oculto}
      onOjito={alternarOjito}
      onVolver={vista ? cerrarArticulo : onVolver}
      onLobby={onLobby}
      cta={cta}
      pie={pie}
      avisoRef={avisoRef}
      raiz={{ 'data-tienda': vista ? 'vitrina' : estante, 'data-tie-cargado': foto?.cargado ? '' : undefined }}
    >
      {!vista && (
        <Estantes activo={estante} onElegir={(id) => { play('buttonClick'); irAEstante(id) }} onPronto={() => avisoRef.current?.avisar('lob.toast.pronto')} />
      )}
      {!vista && estante === 'monedas' && <EstanteMonedas />}
      {!vista && estante === 'tapetes' && (
        <ListaTapetes foto={foto} ocupado={ocupado} onAbrir={abrir} onUsar={usar} />
      )}
      {vista && (
        <section className="tie-vitrina" data-accion="tie-vitrina" data-tap={articulo}>
          <Vitrina tapete={articulo} tono={vista.tono} />
          {conTonos(articulo) && <SelectorTono tapete={articulo} tono={vista.tono} onElegir={elegirTono} />}
          <p className="tie-ficha">
            <span>{vista.tap.descripcion}</span>
            {!vista.comprado && <span className="tie-precio"><ChipToken size="icon" />{montoTexto(vista.tap.precio)} HC</span>}
            {vista.comprado && !vista.enUso && <span className="tie-comprado">{t('tie.comprado')}</span>}
          </p>
        </section>
      )}
      {vista && ventana && (
        <Ventana estado={ventana} tap={vista.tap} saldo={saldo} onNo={cerrarVentana} onSi={comprar} />
      )}
    </PantallaChips>
  )
}
