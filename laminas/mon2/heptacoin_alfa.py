# -*- coding: utf-8 -*-
"""MON-2 · Heptacoin con alfa real · el «*_alfa.blend» de un taller sin .blend.

MON-1 no dejó un binario: `laminas/mon1/heptacoin.py` reconstruye la escena
entera desde las constantes del SVG en cada corrida. Por eso el archivo nuevo
que la campaña pide («cualquier cambio se guarda como archivo nuevo») es ESTE
script, que importa el sellado sin tocarlo y cambia sólo tres cosas:

  1. Película transparente (`film_transparent`): el fondo horneado de la
     decisión 3 deja de pintarse. El plano y su material siguen en la escena
     —son los que rebotan luz verde a las monedas— pero ya no se ven.
  2. El plano del fondo pasa a **shadow catcher**: la sombra de contacto y la
     del rebote llegan al alfa; el plano en sí no se pinta.
  3. Resolución 880×495: 2× el ancho máximo que la escena 4 muestra (440 px
     CSS a 1920×1080), bajo el techo de 1280. Misma cámara, mismo encuadre
     16:9 — sólo cambia cuántos píxeles se escriben.

Todo lo demás —geometría, coreografía, luces a 3200 K, roughness 0,24, esmalte
vino, barrido especular, obturador 0,40, 192 muestras, denoise— se toma del
módulo sellado tal cual. La ganancia del fondo no se recalibra: se lleva la que
MON-1 resolvió y verificó a Δ (0,0,0) — (1,23 · 1,56 · 2,24) — porque con
película transparente la sonda de fondo no tiene nada que leer.

Cómo se corre (Blender 4.5.10 LTS):

  & $B -b -P laminas/mon2/heptacoin_alfa.py -- prueba        # 3 fotogramas de compuerta
  & $B -b -P laminas/mon2/heptacoin_alfa.py -- animar        # los 135 RGBA
  & $B -b -P laminas/mon2/heptacoin_alfa.py -- animar 60 89  # un tramo

El empaquetado a WebP animado NO vive aquí: el Python de Blender no trae
Pillow; va en `empaquetar.py`, con el Python del sistema.
"""
import sys, pathlib, time, math

sys.dont_write_bytecode = True           # nada de __pycache__ en mon1 (D12)
RAIZ = pathlib.Path(__file__).parent.resolve()
MON1 = RAIZ.parent / 'mon1'
sys.path.insert(0, str(MON1))

import bpy                                # noqa: E402
import heptacoin as H                     # noqa: E402  · el taller sellado

ANCHO, ALTO = 880, 495                    # 2 × 440 px CSS · 16:9 exacto
GANANCIA_FONDO = (1.23, 1.56, 2.24)       # MON-1 · Fase 1 · decisión 3, verificada
PRUEBA = (16, 78, 134)                    # caída temprana · rebote · reposo de cara
DIR_PNG = RAIZ / 'render' / 'png'


def montar_alfa():
    energia, campo = H.calibrar_oro_sellado()
    print('ORO :: energía sellada=%.2f :: campo=%s' % (energia, campo))
    esc = H.montar_escena(energia, GANANCIA_FONDO)
    piso = esc['piso']
    if not hasattr(piso, 'is_shadow_catcher'):
        raise RuntimeError('esta build no expone is_shadow_catcher')
    piso.is_shadow_catcher = True
    s = H.escena_video(ancho=ANCHO, alto=ALTO)
    s.render.film_transparent = True
    s.render.image_settings.color_mode = 'RGBA'
    print('ALFA :: film_transparent=%s :: shadow_catcher=%s :: %dx%d :: %d muestras :: obturador %.2f'
          % (s.render.film_transparent, piso.is_shadow_catcher, ANCHO, ALTO,
             H.MUESTRAS_LOTE, H.OBTURADOR))
    ocultar_hasta_soltar(esc)
    H.revisar_banda(esc)
    return esc, s


def prueba(frames=PRUEBA):
    esc, s = montar_alfa()
    DIR_PNG.mkdir(parents=True, exist_ok=True)
    tiempos = []
    for f in frames:
        s.frame_set(f)
        s.render.filepath = str(DIR_PNG / ('f%04d' % f))
        t0 = time.perf_counter()
        bpy.ops.render.render(write_still=True)
        dt = time.perf_counter() - t0
        tiempos.append(dt)
        print('PRUEBA :: f%04d :: %.1f s' % (f, dt))
    media = sum(tiempos) / len(tiempos)
    print('PRUEBA :: media %.1f s/fotograma :: lote estimado %.1f min'
          % (media, media * (H.F_FIN + 1) / 60.0))


def animar(rango=None):
    esc, s = montar_alfa()
    ini, fin = rango if rango else (0, H.F_FIN)
    s.frame_start, s.frame_end = ini, fin
    DIR_PNG.mkdir(parents=True, exist_ok=True)
    s.render.filepath = str(DIR_PNG / 'f')
    print('LOTE :: fotogramas %d–%d (%d)' % (ini, fin, fin - ini + 1))
    t0 = time.perf_counter()
    bpy.ops.render.render(animation=True)
    dt = time.perf_counter() - t0
    n = len(list(DIR_PNG.glob('f*.png')))
    print('LOTE :: %d PNG en disco :: %.1f min (%.2f s/fotograma)'
          % (n, dt / 60.0, dt / max(1, fin - ini + 1)))


# ── Las monedas aparcadas no proyectan sombra ───────────────────────────────
# Medido en la compuerta: la «nube» que oscurecía medio cuadro en el f0016 no
# era la moneda que cae, sino las que ESPERAN fuera de cuadro a Z_SALIDA, a
# 0,85 u de una clave de 1,6 u — la héroe aguarda ahí 60 fotogramas. Sobre el
# verde horneado de MON-1 esa sombra pasaba por respiración del fondo; en el
# alfa es una mancha rectangular. No se mueve ninguna clave: cada moneda queda
# `hide_render` hasta el fotograma en que su primera clave de posición la suelta.
def ocultar_hasta_soltar(esc):
    monedas = esc['monedas'] + [esc['heroe']]
    resumen = []
    for ob in monedas:
        z = None
        for fc in H._curvas(ob):
            if fc.data_path == 'location' and fc.array_index == 2:
                z = fc
        if z is None:
            continue
        kps = sorted(z.keyframe_points, key=lambda k: k.co.x)
        suelta = None
        for a, b in zip(kps, kps[1:]):
            if abs(b.co.y - a.co.y) > 1e-6:
                suelta = int(round(a.co.x))
                break
        if suelta is None or suelta <= 0:
            continue
        ob.hide_render = True
        ob.keyframe_insert('hide_render', frame=0)
        ob.hide_render = False
        ob.keyframe_insert('hide_render', frame=suelta)
        resumen.append('%s@%d' % (ob.name.replace('Heptacoin', ''), suelta))
    print('APARCADAS :: ocultas al render hasta soltarse :: ' + ' '.join(resumen))


# ── Sonda de compuerta: la sombra de vuelo ──────────────────────────────────
# La clave sellada es un área de 1,6 u a 2,6 u de altura, y las monedas caen
# desde 1,75 u: al pasar a 0,85 u de una lámpara así, cada moneda tapa MEDIO
# cuadro de suelo. En MON-1 esa sombra de vuelo se veía como un «respirar» del
# verde horneado y la viñeta la escondía en los bordes; sobre la portada
# transparente es una mancha con forma de rectángulo. Esta sonda mide una
# alternativa que NO toca la clave: un sol enlazado SÓLO al plano receptor
# (light linking), que diluye la sombra de vuelo de la clave y añade una
# sombra proyectada del tamaño de la moneda. Las monedas no reciben el sol:
# su oro no cambia. Se rinde para la compuerta, no se sella aquí.
def sol_para_el_suelo(esc, fuerza, angulo_grados=3.0, vertical=False):
    key = esc['key']
    piso = esc['piso']
    donde = (0.0, 0.0, 3.0) if vertical else tuple(key.location)
    bpy.ops.object.light_add(type='SUN', location=donde)
    sol = bpy.context.active_object
    sol.name = 'SolSombra'
    sol.data.energy = fuerza
    sol.data.angle = math.radians(angulo_grados)
    sol.data.color = key.data.color
    t = sol.constraints.new('TRACK_TO')
    t.target = bpy.data.objects['Diana']
    t.track_axis = 'TRACK_NEGATIVE_Z'
    t.up_axis = 'UP_Y'
    col = bpy.data.collections.new('SoloSuelo')
    col.objects.link(piso)
    sol.light_linking.receiver_collection = col
    return sol


def sol(frames=(16, 134), fuerzas=(2.0, 5.0), vertical=False):
    esc, s = montar_alfa()
    d = RAIZ / 'render' / '_sol'
    d.mkdir(parents=True, exist_ok=True)
    lampara = sol_para_el_suelo(esc, fuerzas[0], vertical=vertical)
    for fuerza in fuerzas:
        lampara.data.energy = fuerza
        for f in frames:
            s.frame_set(f)
            s.render.filepath = str(d / ('%s%.0f-f%04d' % ('solv' if vertical else 'sol', fuerza, f)))
            t0 = time.perf_counter()
            bpy.ops.render.render(write_still=True)
            print('SOL :: fuerza %.1f :: f%04d :: %.1f s' % (fuerza, f, time.perf_counter() - t0))


if __name__ == '__main__':
    argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else ['prueba']
    modo = argv[0] if argv else 'prueba'
    if modo == 'prueba':
        prueba()
    elif modo == 'sol':
        sol()
    elif modo == 'solv':
        sol(frames=(16, 78, 134), fuerzas=(float(argv[1]),) if len(argv) > 1 else (3.5,), vertical=True)
    elif modo == 'animar':
        animar((int(argv[1]), int(argv[2])) if len(argv) >= 3 else None)
    else:
        print('MODO DESCONOCIDO :: %s' % modo)
