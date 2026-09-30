# -*- coding: utf-8 -*-
"""
AJILEI · DIS-1 · gen_dispositivos.py

Construye por parámetros una laptop y un teléfono GENÉRICOS (sin marca,
sin leyendas de teclas), los renderiza con Cycles y fondo transparente,
y exporta por aparato:

  <aparato>_hueco.png     pantalla transparente (holdout) + sombra de contacto.
                          Es el que usa la web: la captura va DEBAJO.
  <aparato>_captura.png   el mismo render con la maestra real encajada DEBAJO
                          por homografía (como la web): pantalla nítida.
                          Sirve para juzgar la pose y para el video.
  <aparato>.json          esquinas del hueco en píxeles (TL, TR, BR, BL de la
                          captura), silueta opaca, tinta con sombra,
                          px por metro y traza del render.
  hoja.html               hoja de contacto para que Victor juzgue.
  datos.js                los dos JSON juntos, para la lámina (se abre sin servidor).
  <aparato>_web.webp      DERIVADO WEB (camino B, sellado 2026-09-29): la variante
                          «con captura» recortada a su tinta, reducida por área y en
                          WebP con transparencia. La web muestra solo esta imagen,
                          escalada: sin matrix3d, igual en todos los navegadores.

Uso (Windows, desde la raíz del repo):
  "C:\\Program Files\\Blender Foundation\\Blender 4.5\\blender.exe" -b --factory-startup ^
      --python scripts/dis1/gen_dispositivos.py -- --calidad borrador --salida capturas-dis

Opciones (todas tras «--»):
  --calidad borrador|final   (por defecto borrador)
  --salida DIR               (por defecto capturas-dis)
  --maestras DIR             (por defecto maestras/portada)
  --solo laptop|telefono     (por defecto ambos)
  --color grafito|plata      (por defecto grafito)
  --fondo "#rrggbb"          color de fondo de la hoja (el de la Portada)
  --muestras N               fuerza las muestras de Cycles
  --px N                     fuerza el lado mandante en px (pruebas rápidas)
  --reencajar                SIN RENDER: toma los *_hueco.png y *.json ya guardados en
                             --salida y solo vuelve a encajar la maestra actual y a
                             generar *_captura.png y *_web.webp (si cambia la mesa del juego)

La pose, la luz y las medidas viven en las constantes de abajo: cada vuelta
de pose es editar constantes y volver a correr. Nada se ajusta a ojo en CSS.
"""
import sys, os, json, math, argparse, time

import bpy, bmesh
from mathutils import Vector, Matrix, Euler
from bpy_extras.object_utils import world_to_camera_view

# ─────────────────────────────────────────────────────────────── parámetros
# Proporciones selladas por la Fase 0 de DIS-1 (§J1): la captura se ve entera.
PROP_LAPTOP = 2732 / 1536          # 1,7786 · mesapc.png entera
PROP_TELEFONO = 1026 / 2088        # 0,4914 · caja dorada de mesav.png
CAJA_MESAV = (27, 12, 1026, 2088)  # x, y, ancho, alto dentro de 1080×2112

CALIDAD = {
    #            px del lado mandante      muestras  profundidad PNG
    "borrador": {"laptop": 1200, "telefono": 900,  "muestras": 64,  "bits": "8"},
    "final":    {"laptop": 3200, "telefono": 2400, "muestras": 512, "bits": "16"},
}

COLORES = {  # lineales (Cycles), no sRGB
    "grafito": {"cuerpo": (0.016, 0.017, 0.019), "rug": 0.34,
                "marco_tel": (0.020, 0.021, 0.024), "teclas": (0.006, 0.006, 0.007)},
    "plata":   {"cuerpo": (0.60, 0.61, 0.63), "rug": 0.30,
                "marco_tel": (0.020, 0.021, 0.024), "teclas": (0.020, 0.020, 0.022)},
}

# Medidas en metros (aparatos genéricos de tamaño corriente)
LAP = dict(ancho=0.310, fondo=0.215, grosor=0.011, radio=0.012,
           pantalla_ancho=0.286, bisel_lado=0.012, bisel_arriba=0.012, bisel_abajo=0.017,
           tapa_grosor=0.0055, apertura_grados=108.0)
TEL = dict(pantalla_ancho=0.0680, bisel_lado=0.0022, bisel_vert=0.0028,
           grosor=0.0082, radio=0.0095, radio_pantalla=0.0073)

# Pose (grados). Laptop a la izquierda mirando un poco a la derecha;
# teléfono de pie, girado hacia el centro y algo reclinado.
POSE = {
    "laptop":   {"guinada": 18.0, "cabeceo": 0.0, "altura": 0.0005},
    "telefono": {"guinada": -16.0, "reclinado": 7.0, "altura": 0.0040},
}

# Cámara: misma inclinación y distancia para los dos aparatos, para que la
# perspectiva sea coherente al componerlos en escritorio.
CAMARA = {"picado_grados": 12.0, "distancia": 1.05, "margen": 0.07, "huella_sombra": 0.9}

# Luz: clave grande y suave arriba-izquierda-delante, relleno débil,
# contraluz para separar cuerpos oscuros del verde oscuro de la Portada.
LUCES = [
    # nombre, posición, tamaño, energía (W), ¿proyecta sombra?
    ("clave",     (-0.9, -1.0, 1.4), 1.4, 380.0, False),
    ("relleno",   (1.1, -1.3, 0.5),  1.8, 90.0,  False),
    ("contraluz", (0.6, 1.1, 1.0),   0.9, 260.0, False),
    ("cenital",   (0.0, 0.0, 1.8),   0.9, 120.0, True),
]
MUNDO = (0.045, 0.047, 0.050)   # reflejos del entorno, tenues
EXPOSICION = 0.15               # multiplica la energía de todas las luces
SEMILLA = 5
# Derivado web: tamaño en píxeles de la SILUETA (Fase 0 §J3: laptop ~765 px de
# dispositivo como máximo, teléfono ~456 de alto) con algo de margen.
WEB = {"laptop": {"silueta_ancho": 800}, "telefono": {"silueta_alto": 480},
       "margen": 0.02, "calidad": 85}
BORDE_WEB_PX = 4   # píxeles del derivado en los que el alfa del borde se lleva a cero
UMBRAL_TINTA = 10 / 255   # por debajo, la sombra es invisible sobre el verde de la Portada

# ─────────────────────────────────────────────────────────────── argumentos
def leer_args():
    argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    p = argparse.ArgumentParser(prog="gen_dispositivos.py")
    p.add_argument("--calidad", choices=list(CALIDAD), default="borrador")
    p.add_argument("--salida", default="capturas-dis")
    p.add_argument("--maestras", default="maestras/portada")
    p.add_argument("--solo", choices=["laptop", "telefono"])
    p.add_argument("--color", choices=list(COLORES), default="grafito")
    p.add_argument("--fondo", default="#09170e")
    p.add_argument("--muestras", type=int)
    p.add_argument("--px", type=int, help="fuerza el lado mandante en px (pruebas)")
    p.add_argument("--calidad-web", type=int, default=WEB["calidad"], help="calidad WebP del derivado (0-100)")
    p.add_argument("--reencajar", action="store_true",
                   help="sin Blender: reusa <aparato>_hueco.png y <aparato>.json de --salida, "
                        "vuelve a encajar la maestra actual y regenera captura y web")
    return p.parse_args(argv)

# ─────────────────────────────────────────────────────────────── utilidades
def limpiar_escena():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    for col in (bpy.data.meshes, bpy.data.materials, bpy.data.lights,
                bpy.data.cameras, bpy.data.images, bpy.data.worlds):
        for b in list(col):
            col.remove(b)

def material(nombre, color, metal=0.0, rug=0.5, coat=0.0):
    m = bpy.data.materials.new(nombre)
    m.use_nodes = True
    bsdf = m.node_tree.nodes["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value = (*color, 1)
    bsdf.inputs["Metallic"].default_value = metal
    bsdf.inputs["Roughness"].default_value = rug
    if coat:
        bsdf.inputs["Coat Weight"].default_value = coat
        bsdf.inputs["Coat Roughness"].default_value = 0.03
    return m

def material_holdout(nombre):
    m = bpy.data.materials.new(nombre)
    m.use_nodes = True
    nt = m.node_tree
    for n in list(nt.nodes):
        nt.nodes.remove(n)
    out = nt.nodes.new("ShaderNodeOutputMaterial")
    h = nt.nodes.new("ShaderNodeHoldout")
    nt.links.new(h.outputs[0], out.inputs["Surface"])
    return m

def puntos_redondeado(w, h, r, seg=10):
    """Contorno de un rectángulo redondeado centrado, en sentido antihorario."""
    r = min(r, w / 2, h / 2)
    cs = [(w / 2 - r, h / 2 - r, 0), (-w / 2 + r, h / 2 - r, 90),
          (-w / 2 + r, -h / 2 + r, 180), (w / 2 - r, -h / 2 + r, 270)]
    pts = []
    for cx, cy, a0 in cs:
        for i in range(seg + 1):
            a = math.radians(a0 + 90 * i / seg)
            pts.append((cx + r * math.cos(a), cy + r * math.sin(a)))
    return pts

def losa(nombre, w, h, t, r, mat_lados, mat_frente=None, bisel=0.0, seg=10, desplaz_y=0.0):
    """Prisma de planta redondeada en XY, grosor en +Z (0..t). La cara z=t es el «frente»."""
    bm = bmesh.new()
    vs = [bm.verts.new((x, y + desplaz_y, 0)) for x, y in puntos_redondeado(w, h, r, seg)]
    base = bm.faces.new(vs)
    res = bmesh.ops.extrude_face_region(bm, geom=[base])
    nuevos = [e for e in res["geom"] if isinstance(e, bmesh.types.BMVert)]
    bmesh.ops.translate(bm, vec=(0, 0, t), verts=nuevos)
    bm.normal_update()
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    me = bpy.data.meshes.new(nombre)
    bm.to_mesh(me)
    bm.free()
    ob = bpy.data.objects.new(nombre, me)
    bpy.context.collection.objects.link(ob)
    me.materials.append(mat_lados)
    if mat_frente:
        me.materials.append(mat_frente)
        for p in me.polygons:
            if p.normal.z > 0.9 and p.center.z > t * 0.5:
                p.material_index = 1
    for p in me.polygons:
        p.use_smooth = True
    if bisel > 0:
        b = ob.modifiers.new("bisel", "BEVEL")
        b.width = bisel
        b.segments = 4
        b.limit_method = "ANGLE"
        b.angle_limit = math.radians(35)
        b.harden_normals = True
    return ob

def plano_redondeado(nombre, w, h, r, z, mat, uv_rango=None, desplaz_y=0.0, seg=12):
    """Pantalla plana (n-gono) con UV lineal sobre el rectángulo w×h."""
    bm = bmesh.new()
    vs = [bm.verts.new((x, y + desplaz_y, z)) for x, y in puntos_redondeado(w, h, r, seg)]
    f = bm.faces.new(vs)
    uvl = bm.loops.layers.uv.new("UVMap")
    u0, u1, v0, v1 = uv_rango or (0, 1, 0, 1)
    for loop in f.loops:
        x, y = loop.vert.co.x, loop.vert.co.y - desplaz_y
        su, sv = (x + w / 2) / w, (y + h / 2) / h
        loop[uvl].uv = (u0 + su * (u1 - u0), v0 + sv * (v1 - v0))
    me = bpy.data.meshes.new(nombre)
    bm.to_mesh(me)
    bm.free()
    ob = bpy.data.objects.new(nombre, me)
    bpy.context.collection.objects.link(ob)
    me.materials.append(mat)
    return ob

def caja(nombre, sx, sy, sz, loc, mat, bisel=0.0):
    me = bpy.data.meshes.new(nombre)
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    bmesh.ops.scale(bm, vec=(sx, sy, sz), verts=bm.verts)
    bm.to_mesh(me)
    bm.free()
    ob = bpy.data.objects.new(nombre, me)
    ob.location = loc
    bpy.context.collection.objects.link(ob)
    me.materials.append(mat)
    for p in me.polygons:
        p.use_smooth = True
    if bisel:
        b = ob.modifiers.new("bisel", "BEVEL")
        b.width = bisel
        b.segments = 3
        b.harden_normals = True
    return ob

def vacio(nombre, loc=(0, 0, 0)):
    e = bpy.data.objects.new(nombre, None)
    e.location = loc
    bpy.context.collection.objects.link(e)
    return e

def emparentar(hijo, padre):
    hijo.parent = padre

# ─────────────────────────────────────────────────────────────── aparatos
def construir_laptop(cfg, mats, mat_pantalla):
    L = LAP
    raiz = vacio("laptop")
    # Base
    base = losa("lap_base", L["ancho"], L["fondo"], L["grosor"], L["radio"], mats["cuerpo"], bisel=0.0022)
    emparentar(base, raiz)
    top = L["grosor"]
    # Pozo del teclado y teclas (sin leyendas)
    pozo = losa("lap_pozo", 0.276, 0.106, 0.0006, 0.004, mats["pozo"])
    pozo.location = (0, 0.030, top - 0.0003)
    emparentar(pozo, raiz)
    tecla = caja("lap_tecla", 0.0152, 0.0150, 0.0010, (0, 0, 0), mats["teclas"], bisel=0.0008)
    paso = 0.01905
    n_col, n_fil = 14, 5
    tecla.location = (-paso * (n_col - 1) / 2, 0.030 - paso * (n_fil - 1) / 2, top + 0.0005)
    for eje, n in ((0, n_col), (1, n_fil)):
        a = tecla.modifiers.new(f"fila{eje}", "ARRAY")
        a.count = n
        a.use_relative_offset = False
        a.use_constant_offset = True
        a.constant_offset_displace = (paso, 0, 0) if eje == 0 else (0, paso, 0)
    emparentar(tecla, raiz)
    # Panel táctil
    tp = losa("lap_tactil", 0.112, 0.070, 0.0004, 0.005, mats["tactil"])
    tp.location = (0, -0.063, top - 0.0001)
    emparentar(tp, raiz)
    # Bisagra
    bpy.ops.mesh.primitive_cylinder_add(radius=0.0048, depth=0.25, vertices=32,
                                        location=(0, L["fondo"] / 2 - 0.006, top + 0.001),
                                        rotation=(0, math.radians(90), 0))
    bis = bpy.context.active_object
    bis.name = "lap_bisagra"
    bis.data.materials.append(mats["pozo"])
    bpy.ops.object.shade_smooth()
    emparentar(bis, raiz)
    # Tapa: losa en XY → girada +90° en X queda vertical con el frente mirando a −Y
    sw = L["pantalla_ancho"]
    sh = sw / PROP_LAPTOP
    tw = L["ancho"]
    th = sh + L["bisel_arriba"] + L["bisel_abajo"]
    t = L["tapa_grosor"]
    bisagra = vacio("lap_bisagra_eje", (0, L["fondo"] / 2 - 0.006, top + 0.001))
    emparentar(bisagra, raiz)
    abierta = vacio("lap_tapa_abierta")
    abierta.parent = bisagra
    abierta.rotation_euler = (math.radians(L["apertura_grados"] - 90.0) * -1.0, 0, 0)
    tapa_local = vacio("lap_tapa_local")
    tapa_local.parent = abierta
    tapa_local.rotation_euler = (math.radians(90), 0, 0)
    tapa_local.location = (0, t, 0)  # el frente de la tapa queda delante del eje
    tapa = losa("lap_tapa", tw, th, t, 0.010, mats["cuerpo"], mats["cristal"], bisel=0.0018, desplaz_y=th / 2)
    tapa.parent = tapa_local
    # Pantalla (centro vertical del hueco en coordenadas de tapa)
    cy = L["bisel_abajo"] + sh / 2
    pant = plano_redondeado("lap_pantalla", sw, sh, 0.0025, t + 0.00025, mat_pantalla, desplaz_y=cy)
    pant.parent = tapa_local
    cam_disco = losa("lap_webcam", 0.0026, 0.0026, 0.0002, 0.0013, mats["pozo"])
    cam_disco.location = (0, th - L["bisel_arriba"] / 2, t)
    cam_disco.parent = tapa_local
    # Esquinas del hueco (TL, TR, BR, BL de la captura) en coordenadas de tapa_local
    esquinas_locales = [(-sw / 2, cy + sh / 2), (sw / 2, cy + sh / 2),
                        (sw / 2, cy - sh / 2), (-sw / 2, cy - sh / 2)]
    esquinas = [(tapa_local, Vector((x, y, t + 0.00025))) for x, y in esquinas_locales]
    centro = (tapa_local, Vector((0, cy, t + 0.00025)))
    borde = (tapa_local, Vector((0, cy + sh / 2 + L["bisel_arriba"] * 0.5, t)))
    # Pose
    raiz.rotation_euler = (math.radians(POSE["laptop"]["cabeceo"]), 0, math.radians(POSE["laptop"]["guinada"]))
    raiz.location = (0, 0, POSE["laptop"]["altura"])
    return raiz, esquinas, centro, borde

def construir_telefono(cfg, mats, mat_pantalla):
    T = TEL
    sw = T["pantalla_ancho"]
    sh = sw / PROP_TELEFONO
    bw = sw + 2 * T["bisel_lado"]
    bh = sh + 2 * T["bisel_vert"]
    t = T["grosor"]
    raiz = vacio("telefono")
    pie = vacio("tel_pie")          # gira sobre el borde inferior
    pie.parent = raiz
    pie.rotation_euler = (math.radians(-POSE["telefono"]["reclinado"]), 0, 0)
    local = vacio("tel_local")
    local.parent = pie
    local.rotation_euler = (math.radians(90), 0, 0)
    local.location = (0, t / 2, 0)
    cuerpo = losa("tel_cuerpo", bw, bh, t, T["radio"], mats["marco_tel"], mats["cristal"], bisel=0.0012, desplaz_y=bh / 2)
    cuerpo.parent = local
    cy = bh / 2
    pant = plano_redondeado("tel_pantalla", sw, sh, T["radio_pantalla"], t + 0.00015, mat_pantalla, desplaz_y=cy,
                            uv_rango=_uv_caja_mesav())
    pant.parent = local
    esquinas = [(local, Vector((x, y, t + 0.00015))) for x, y in
                [(-sw / 2, cy + sh / 2), (sw / 2, cy + sh / 2), (sw / 2, cy - sh / 2), (-sw / 2, cy - sh / 2)]]
    centro = (local, Vector((0, cy, t + 0.00015)))
    borde = (local, Vector((0, cy + sh / 2 + T["bisel_vert"] * 0.5, t)))
    raiz.rotation_euler = (0, 0, math.radians(POSE["telefono"]["guinada"]))
    raiz.location = (0, 0, POSE["telefono"]["altura"])
    return raiz, esquinas, centro, borde

def _uv_caja_mesav():
    x, y, w, h = CAJA_MESAV
    W, H = 1080, 2112
    return (x / W, (x + w) / W, 1 - (y + h) / H, 1 - y / H)

# ─────────────────────────────────────────────────────────────── escena
def preparar_render(args, cal):
    sc = bpy.context.scene
    sc.render.engine = "CYCLES"
    sc.cycles.device = "CPU"
    sc.cycles.samples = args.muestras or cal["muestras"]
    sc.cycles.use_adaptive_sampling = True
    sc.cycles.use_denoising = True
    sc.cycles.seed = SEMILLA
    sc.render.film_transparent = True
    sc.render.image_settings.file_format = "PNG"
    sc.render.image_settings.color_mode = "RGBA"
    sc.render.image_settings.color_depth = cal["bits"]
    sc.view_settings.view_transform = "Standard"
    sc.view_settings.look = "None"
    sc.render.resolution_percentage = 100
    w = bpy.data.worlds.new("mundo")
    w.use_nodes = True
    w.node_tree.nodes["Background"].inputs["Color"].default_value = (*MUNDO, 1)
    sc.world = w
    for nombre, pos, tam, energia, sombra in LUCES:
        l = bpy.data.lights.new(nombre, "AREA")
        l.shape = "DISK"
        l.size = tam
        l.energy = energia * EXPOSICION
        l.use_shadow = sombra   # en 4.5 es use_shadow (cycles.cast_shadow ya no existe)
        o = bpy.data.objects.new(nombre, l)
        o.location = pos
        dirv = (Vector((0, 0, 0.08)) - Vector(pos)).normalized()
        o.rotation_euler = dirv.to_track_quat("-Z", "Y").to_euler()
        sc.collection.objects.link(o)
    # Captador de sombra (la sombra de contacto viene del render, no de CSS)
    bpy.ops.mesh.primitive_plane_add(size=6, location=(0, 0, 0))
    suelo = bpy.context.active_object
    suelo.name = "captador_sombra"
    suelo.is_shadow_catcher = True
    cam_d = bpy.data.cameras.new("camara")
    cam = bpy.data.objects.new("camara", cam_d)
    sc.collection.objects.link(cam)
    sc.camera = cam
    cam.rotation_euler = (math.radians(90 - CAMARA["picado_grados"]), 0, 0)
    cam_d.sensor_fit = "HORIZONTAL"
    cam_d.sensor_width = 36.0
    return sc, cam

def puntos_mundo(raiz):
    dg = bpy.context.evaluated_depsgraph_get()
    pts = []
    for ob in [raiz] + list(raiz.children_recursive):
        if ob.type != "MESH":
            continue
        ev = ob.evaluated_get(dg)
        me = ev.to_mesh()
        mw = ev.matrix_world
        pts += [mw @ v.co for v in me.vertices]
        ev.to_mesh_clear()
    return pts

def encuadrar(sc, cam, raiz, lado_px, aparato, pantalla, mat_hueco):
    """Encuadre en dos pasos: (A) toma amplia en miniatura para medir dónde cae
    de verdad la tinta (aparato + sombra suave); (B) objetivo y desplazamiento
    de cámara ajustados a esa tinta más un margen. La cámara no se mueve entre
    A y B, así que la perspectiva no cambia: solo se recorta."""
    import tempfile
    bpy.context.view_layer.update()
    pts = puntos_mundo(raiz)
    xs, ys, zs = [p.x for p in pts], [p.y for p in pts], [p.z for p in pts]
    tam = max(max(xs) - min(xs), max(ys) - min(ys), max(zs) - min(zs))
    centro = Vector(((max(xs) + min(xs)) / 2, (max(ys) + min(ys)) / 2, (max(zs) + min(zs)) / 2))
    fwd = cam.rotation_euler.to_matrix() @ Vector((0, 0, -1))
    cam.location = centro - fwd * CAMARA["distancia"]
    cam.data.shift_x = cam.data.shift_y = 0.0
    bpy.context.view_layer.update()
    e = CAMARA["huella_sombra"] * tam
    suelo = [Vector((x, y, 0)) for x in (min(xs) - e, max(xs) + e) for y in (min(ys) - e, max(ys) + e)]
    inv = cam.matrix_world.inverted()
    tan = [((inv @ p).x / -(inv @ p).z, (inv @ p).y / -(inv @ p).z) for p in pts + suelo]
    hxA = max(max(abs(t[0]) for t in tan), max(abs(t[1]) for t in tan))
    cam.data.lens = 18.0 / hxA
    # (A) medida en miniatura, cuadrada, con la pantalla en hueco
    MED = 360
    sc.render.resolution_x = sc.render.resolution_y = MED
    guard = (sc.cycles.samples, sc.render.image_settings.color_depth, sc.render.filepath)
    sc.cycles.samples = 48
    sc.render.image_settings.color_depth = "8"
    pantalla.data.materials[0] = mat_hueco
    ruta = os.path.join(tempfile.gettempdir(), f"dis1_medida_{aparato}.png")
    sc.render.filepath = ruta
    bpy.ops.render.render(write_still=True)
    sc.cycles.samples, sc.render.image_settings.color_depth, sc.render.filepath = guard
    a = suavizar(leer_alfa(ruta), 2)
    t = caja_alfa(a, UMBRAL_TINTA)
    if t is None:
        raise SystemExit("[DIS-1] la medida no encontró el aparato")
    x0p, y0p, wp, hp = t
    if x0p <= 0 or y0p <= 0 or x0p + wp >= MED or y0p + hp >= MED:
        print("[DIS-1] aviso: la sombra toca el borde de la toma amplia; sube CAMARA['huella_sombra']")
    # píxeles de la miniatura → espacio tangente (x a la derecha, y hacia arriba)
    def tx(u): return (u / MED - 0.5) * 2 * hxA
    def ty(v): return (0.5 - v / MED) * 2 * hxA
    x0, x1 = tx(x0p - 1), tx(x0p + wp + 1)
    y1, y0 = ty(y0p - 1), ty(y0p + hp + 1)
    m = CAMARA["margen"] * max(x1 - x0, y1 - y0)
    x0, x1, y0, y1 = x0 - m, x1 + m, y0 - m, y1 + m
    ancho, alto = x1 - x0, y1 - y0
    # (B) objetivo que cubre el ancho medido y desplazamiento que centra la tinta
    cam.data.lens = 18.0 / (ancho / 2)
    cam.data.shift_x = ((x0 + x1) / 2) / ancho
    cam.data.shift_y = ((y0 + y1) / 2) / ancho
    if aparato == "laptop":
        rx, ry = lado_px, round(lado_px * alto / ancho)
    else:
        ry, rx = lado_px, round(lado_px * ancho / alto)
    sc.render.resolution_x, sc.render.resolution_y = rx, ry
    bpy.context.view_layer.update()
    return rx, ry

def proyectar(sc, cam, ob, co_local):
    bpy.context.view_layer.update()
    p = ob.matrix_world @ co_local
    v = world_to_camera_view(sc, cam, p)
    W, H = sc.render.resolution_x, sc.render.resolution_y
    return [round(v.x * W, 3), round((1 - v.y) * H, 3)], p

def leer_alfa(ruta):
    import numpy as np
    im = bpy.data.images.load(os.path.abspath(ruta))
    W, H = im.size
    a = np.array(im.pixels[:], dtype=np.float32).reshape(H, W, 4)[::-1, :, 3]  # fila 0 = arriba
    bpy.data.images.remove(im)
    return a

def suavizar(a, r):
    """Media en caja (2r+1)² para que las motas de ruido no inflen la medida.
    El borde se rellena con cero: con relleno por réplica, una mota en la
    esquina entraba 64 veces en la ventana e inflaba la caja (vuelta 2)."""
    import numpy as np
    k = 2 * r + 1
    p = np.pad(a, r, mode="constant")   # fuera de la imagen no hay tinta: relleno transparente
    c = p.cumsum(0).cumsum(1)
    c = np.pad(c, ((1, 0), (1, 0)))
    return (c[k:, k:] - c[:-k, k:] - c[k:, :-k] + c[:-k, :-k]) / (k * k)

def caja_alfa(a, umbral):
    import numpy as np
    ys, xs = np.where(a >= umbral)
    if len(xs) == 0:
        return None
    return [int(xs.min()), int(ys.min()), int(xs.max() - xs.min() + 1), int(ys.max() - ys.min() + 1)]

# ─────────────────────────────────────────────────────────────── encaje de la captura
SANGRADO_PX = 2.0   # la captura sobresale del hueco; el bisel tapa el exceso

def _lineal(x):
    import numpy as np
    return np.where(x <= 0.04045, x / 12.92, ((x + 0.055) / 1.055) ** 2.4)

def cargar_premult_lineal(ruta):
    """PNG → (alto, ancho, 4) lineal premultiplicado, fila 0 = arriba.
    Blender carga los PNG de 16 bits en float lineal premultiplicado y los de
    8 bits en sRGB crudo con alfa recta; se normalizan los dos casos."""
    import numpy as np
    im = bpy.data.images.load(os.path.abspath(ruta))
    W, H = im.size
    p = np.array(im.pixels[:], dtype=np.float32).reshape(H, W, 4)[::-1]
    if not im.is_float:
        a = p[..., 3:4]
        p = np.concatenate([_lineal(p[..., :3]) * a, a], axis=2)
    bpy.data.images.remove(im)
    return p

def cargar_maestra(ruta):
    """Maestra RGB → (alto, ancho, 3) lineal, fila 0 = arriba."""
    import numpy as np
    im = bpy.data.images.load(os.path.abspath(ruta))
    W, H = im.size
    p = np.array(im.pixels[:], dtype=np.float32).reshape(H, W, 4)[::-1, :, :3]
    if not im.is_float:
        p = _lineal(p)
    bpy.data.images.remove(im)
    return p

def reducir(img, f):
    """Promedio por bloques f×f (antialias antes de muestrear)."""
    if f < 2:
        return img
    H, W = img.shape[0] // f * f, img.shape[1] // f * f
    return img[:H, :W].reshape(H // f, f, W // f, f, -1).mean(axis=(1, 3))

def homografia(src, dst):
    """Matriz 3×3 que lleva los 4 puntos src a los 4 puntos dst."""
    import numpy as np
    A, b = [], []
    for (x, y), (u, v) in zip(src, dst):
        A += [[x, y, 1, 0, 0, 0, -u * x, -u * y], [0, 0, 0, x, y, 1, -v * x, -v * y]]
        b += [u, v]
    h = np.linalg.solve(np.array(A, float), np.array(b, float))
    return np.append(h, 1).reshape(3, 3)

def radio_pantalla_rel(aparato):
    """Radio de las esquinas de la pantalla como fracción de su ancho. La web
    lo usa para el border-radius de la captura (en píxeles de la captura)."""
    if aparato == "laptop":
        return 0.0025 / LAP["pantalla_ancho"]
    return TEL["radio_pantalla"] / TEL["pantalla_ancho"]

def encajar_captura(sc, ruta_hueco, ruta_maestra, caja, esquinas, ruta_salida, radio_rel=0.0):
    import numpy as np
    cuerpo = cargar_premult_lineal(ruta_hueco)
    H, W = cuerpo.shape[:2]
    m = cargar_maestra(ruta_maestra)
    x0, y0, cw, ch = caja
    cw = cw or m.shape[1]
    ch = ch or m.shape[0]
    m = m[y0:y0 + ch, x0:x0 + cw]
    # antialias: reducir la maestra a ~1,5× el tamaño que ocupará
    E = np.array(esquinas, float)
    ancho_quad = max(np.linalg.norm(E[1] - E[0]), np.linalg.norm(E[2] - E[3]))
    f = int(cw / (ancho_quad * 1.5))
    m = reducir(m, f)
    mh, mw = m.shape[:2]
    # píxel de imagen (centro) → coordenada unitaria de la captura (0..1)
    Hm = homografia(E, [(0, 0), (1, 0), (1, 1), (0, 1)])
    xa, ya = np.floor(E.min(0) - 4).astype(int)
    xb, yb = np.ceil(E.max(0) + 4).astype(int)
    xa, ya, xb, yb = max(xa, 0), max(ya, 0), min(xb, W), min(yb, H)
    yy, xx = np.mgrid[ya:yb, xa:xb].astype(np.float64)
    q = Hm @ np.stack([xx.ravel() + 0.5, yy.ravel() + 0.5, np.ones(xx.size)])
    u, v = (q[0] / q[2]).reshape(xx.shape), (q[1] / q[2]).reshape(xx.shape)
    eu, ev = SANGRADO_PX / ancho_quad, SANGRADO_PX / ancho_quad * cw / ch
    dentro = (u >= -eu) & (u <= 1 + eu) & (v >= -ev) & (v <= 1 + ev)
    # Esquinas redondeadas como la pantalla (vuelta 3): sin esto la punta del
    # rectángulo asomaba fuera del cuerpo del teléfono, cuyo radio (9,5 mm)
    # supera al bisel (2,2 mm). En píxeles de la captura, como el border-radius web.
    if radio_rel > 0:
        X, Y = u * cw, v * ch
        b = SANGRADO_PX * cw / ancho_quad          # sangrado en px de captura
        r = radio_rel * cw + b
        x0r, y0r, x1r, y1r = -b, -b, cw + b, ch + b
        cx = np.clip(X, x0r + r, x1r - r)
        cy = np.clip(Y, y0r + r, y1r - r)
        dentro &= (X - cx) ** 2 + (Y - cy) ** 2 <= r * r
    # muestreo bilineal con borde extendido
    sx = np.clip(u * mw - 0.5, 0, mw - 1.001)
    sy = np.clip(v * mh - 0.5, 0, mh - 1.001)
    ix, iy = sx.astype(int), sy.astype(int)
    fx, fy = (sx - ix)[..., None], (sy - iy)[..., None]
    c = (m[iy, ix] * (1 - fx) * (1 - fy) + m[iy, ix + 1] * fx * (1 - fy) +
         m[iy + 1, ix] * (1 - fx) * fy + m[iy + 1, ix + 1] * fx * fy)
    # la captura queda DEBAJO del cuerpo (operación «bajo», premultiplicada)
    reg = cuerpo[ya:yb, xa:xb]
    a = reg[..., 3:4]
    k = dentro[..., None].astype(np.float32) * (1 - a)
    reg[..., :3] = reg[..., :3] + c * k
    reg[..., 3:4] = a + k
    cuerpo[ya:yb, xa:xb] = reg
    im = bpy.data.images.new("captura_encajada", W, H, alpha=True, float_buffer=True)
    im.pixels = cuerpo[::-1].ravel()
    im.save_render(os.path.abspath(ruta_salida), scene=sc)
    bpy.data.images.remove(im)

# ─────────────────────────────────────────────────────────────── derivado web
def matriz_area(n_in, a, b, n_out):
    """Pesos de reducción por área: el tramo [a, b) de la entrada en n_out celdas.
    Vectorizada (v3.1): solape de cada celda de salida con cada píxel de entrada."""
    import numpy as np
    paso = (b - a) / n_out
    e0 = (a + np.arange(n_out, dtype=np.float64) * paso)[:, None]
    e1 = e0 + paso
    jj = np.arange(n_in, dtype=np.float64)[None, :]
    R = np.clip(np.minimum(e1, jj + 1) - np.maximum(e0, jj), 0, None).astype(np.float32)
    R /= np.maximum(R.sum(axis=1, keepdims=True), 1e-9)
    return R

def reducir_eje(img, eje, a, b, n_out):
    """Reducción por área EXACTA de [a, b) a n_out celdas en un eje, con sumas
    acumuladas (v3.2). Coste proporcional a los píxeles, sin producto de matrices:
    el matmul del numpy de Blender tardaba ~65 s en la laptop (Fase 1c §1.2)."""
    import numpy as np
    x = np.moveaxis(img, eje, 0).astype(np.float64)
    n = x.shape[0]
    C = np.concatenate([np.zeros((1,) + x.shape[1:]), np.cumsum(x, axis=0)], axis=0)  # C[k] = suma de [0, k)
    def acumulado(pos):                     # suma de [0, pos) con pos fraccionaria
        pos = np.clip(pos, 0, n)
        k = np.minimum(np.floor(pos).astype(int), n - 1)
        f = (pos - k).reshape((-1,) + (1,) * (x.ndim - 1))
        return C[k] + f * x[k]
    bordes = a + (b - a) * np.arange(n_out + 1) / n_out
    S = acumulado(bordes)
    out = (S[1:] - S[:-1]) / ((b - a) / n_out)
    return np.moveaxis(out.astype(np.float32), 0, eje)

def derivado_web(sc, ruta_captura, datos, aparato, ruta_salida, calidad):
    """Recorta la variante con captura a su tinta (+ margen), la reduce por área en
    lineal premultiplicado (sin halos en los bordes transparentes) y la guarda en
    WebP con alfa. Devuelve el bloque «web» del JSON, en coordenadas del derivado."""
    import numpy as np
    img = cargar_premult_lineal(ruta_captura)          # fila 0 = arriba
    H, W = img.shape[:2]
    tx, ty, tw, th = datos["tinta_con_sombra"]
    m = WEB["margen"] * max(tw, th)
    x0, y0 = max(0.0, tx - m), max(0.0, ty - m)
    x1, y1 = min(float(W), tx + tw + m), min(float(H), ty + th + m)
    sx, sy, sw, sh = datos["silueta_opaca"]
    cfg = WEB[aparato]
    f = cfg["silueta_ancho"] / sw if "silueta_ancho" in cfg else cfg["silueta_alto"] / sh
    ow, oh = max(1, round((x1 - x0) * f)), max(1, round((y1 - y0) * f))
    fx, fy = ow / (x1 - x0), oh / (y1 - y0)               # escala real tras redondear
    out = reducir_eje(reducir_eje(img, 1, x0, x1, ow), 0, y0, y1, oh)   # (oh, ow, 4)
    # Borde desvanecido (v3.1): la cola de sombra muy tenue (alfa 1–5/255) que el
    # margen corta en recto se lleva a cero en los últimos BORDE_WEB_PX píxeles.
    # Premultiplicado: se escalan color y alfa juntos. La silueta nunca llega ahí.
    yy = np.minimum(np.arange(oh), np.arange(oh)[::-1])[:, None]
    xx = np.minimum(np.arange(ow), np.arange(ow)[::-1])[None, :]
    rampa = np.clip(np.minimum(yy, xx) / BORDE_WEB_PX, 0, 1).astype(np.float32)   # fila exterior = 0
    out *= rampa[..., None]
    im = bpy.data.images.new("web", ow, oh, alpha=True, float_buffer=True)
    im.pixels = np.ascontiguousarray(out[::-1], dtype=np.float32).ravel()
    st = sc.render.image_settings
    guard = (st.file_format, st.color_mode, st.quality, st.color_depth)
    st.file_format, st.color_mode, st.quality = "WEBP", "RGBA", calidad
    im.save_render(os.path.abspath(ruta_salida), scene=sc)
    st.file_format, st.color_mode, st.quality = guard[0], guard[1], guard[2]
    st.color_depth = guard[3]
    bpy.data.images.remove(im)
    def caja(c):
        return [round((c[0] - x0) * fx, 2), round((c[1] - y0) * fy, 2), round(c[2] * fx, 2), round(c[3] * fy, 2)]
    return {
        "archivo": os.path.basename(ruta_salida), "tamano": [ow, oh],
        "bytes": os.path.getsize(ruta_salida), "calidad": calidad,
        "escala": round(fx, 6), "recorte_en_render": [round(x0, 2), round(y0, 2), round(x1 - x0, 2), round(y1 - y0, 2)],
        "silueta_opaca": caja(datos["silueta_opaca"]), "tinta_con_sombra": caja(datos["tinta_con_sombra"]),
        "px_por_metro": round(datos["px_por_metro"] * fx, 3),
    }

# ─────────────────────────────────────────────────────────────── principal
def reencajar(args):
    """Actualiza captura y derivado web sin volver a renderizar (v3.1)."""
    limpiar_escena()
    sc = bpy.context.scene
    sc.view_settings.view_transform = "Standard"
    sc.view_settings.look = "None"
    sc.render.image_settings.file_format = "PNG"
    sc.render.image_settings.color_mode = "RGBA"
    aparatos = [args.solo] if args.solo else ["laptop", "telefono"]
    resumen = {}
    for aparato in aparatos:
        rjson = os.path.join(args.salida, f"{aparato}.json")
        rhueco = os.path.join(args.salida, f"{aparato}_hueco.png")
        if not (os.path.exists(rjson) and os.path.exists(rhueco)):
            print(f"[DIS-1] FALTA {rjson} o {rhueco}: --reencajar necesita un render previo")
            sys.exit(2)
        with open(rjson, encoding="utf-8") as f:
            datos = json.load(f)
        maestra = os.path.join(args.maestras, "mesapc.png" if aparato == "laptop" else "mesav.png")
        if not os.path.exists(maestra):
            print(f"[DIS-1] FALTA la maestra {maestra}")
            sys.exit(2)
        sc.render.image_settings.color_depth = CALIDAD[datos["calidad"]]["bits"]
        t0 = time.perf_counter()
        caja = (0, 0, None, None) if aparato == "laptop" else CAJA_MESAV
        rcap = os.path.join(args.salida, f"{aparato}_captura.png")
        encajar_captura(sc, rhueco, maestra, caja, datos["esquinas"], rcap, radio_pantalla_rel(aparato))
        datos["tiempos_s"]["captura"] = round(time.perf_counter() - t0, 2)
        t0 = time.perf_counter()
        datos["web"] = derivado_web(sc, rcap, datos, aparato,
                                    os.path.join(args.salida, f"{aparato}_web.webp"), args.calidad_web)
        datos["tiempos_s"]["web"] = round(time.perf_counter() - t0, 2)
        datos["radio_pantalla_rel"] = round(radio_pantalla_rel(aparato), 6)
        datos["salidas"]["captura"] = os.path.basename(rcap)
        datos["salidas"]["web"] = datos["web"]["archivo"]
        datos["reencajado"] = time.strftime("%Y-%m-%d %H:%M:%S")
        with open(rjson, "w", encoding="utf-8") as f:
            json.dump(datos, f, ensure_ascii=False, indent=2)
        resumen[aparato] = datos
        print(f"[DIS-1] {aparato}: reencajado · captura {datos['tiempos_s']['captura']} s · "
              f"web {datos['web']['tamano'][0]}×{datos['web']['tamano'][1]} {datos['web']['bytes']} B "
              f"en {datos['tiempos_s']['web']} s")
    # datos.js y hoja con TODOS los aparatos presentes en la carpeta
    for otro in ("laptop", "telefono"):
        rj = os.path.join(args.salida, f"{otro}.json")
        if otro not in resumen and os.path.exists(rj):
            with open(rj, encoding="utf-8") as f:
                resumen[otro] = json.load(f)
    escribir_hoja(args, resumen)
    with open(os.path.join(args.salida, "datos.js"), "w", encoding="utf-8") as f:
        f.write("// Generado por gen_dispositivos.py. No editar a mano.\n")
        f.write("window.DIS_DATOS = " + json.dumps(resumen, ensure_ascii=False, indent=1) + ";\n")
    print("[DIS-1] listo (reencajado)")

def main():
    args = leer_args()
    if args.reencajar:
        return reencajar(args)
    cal = CALIDAD[args.calidad]
    os.makedirs(args.salida, exist_ok=True)
    aparatos = [args.solo] if args.solo else ["laptop", "telefono"]
    fallos, resumen = [], {}
    for aparato in aparatos:
        limpiar_escena()
        sc, cam = preparar_render(args, cal)
        col = COLORES[args.color]
        mats = {
            "cuerpo": material("cuerpo", col["cuerpo"], metal=1.0, rug=col["rug"]),
            "pozo": material("pozo", (0.012, 0.012, 0.013), metal=0.2, rug=0.55),
            "teclas": material("teclas", col["teclas"], metal=0.0, rug=0.48),
            "tactil": material("tactil", col["cuerpo"], metal=0.5, rug=0.55),
            "cristal": material("cristal", (0.004, 0.004, 0.005), metal=0.0, rug=0.06, coat=0.6),
            "marco_tel": material("marco_tel", col["marco_tel"], metal=1.0, rug=0.25),
        }
        maestra = os.path.join(args.maestras, "mesapc.png" if aparato == "laptop" else "mesav.png")
        if not os.path.exists(maestra):
            print(f"[DIS-1] FALTA la maestra {maestra}")
            sys.exit(2)
        mat_hueco = material_holdout("hueco")
        constr = construir_laptop if aparato == "laptop" else construir_telefono
        raiz, esquinas, centro, borde = constr(cal, mats, mat_hueco)
        pantalla = bpy.data.objects["lap_pantalla" if aparato == "laptop" else "tel_pantalla"]
        rx, ry = encuadrar(sc, cam, raiz, args.px or cal[aparato], aparato, pantalla, mat_hueco)
        salidas = {}
        tiempos = {}
        pantalla.data.materials[0] = mat_hueco
        ruta = os.path.join(args.salida, f"{aparato}_hueco.png")
        sc.render.filepath = os.path.abspath(ruta)
        t0 = time.perf_counter()
        bpy.ops.render.render(write_still=True)
        tiempos["hueco"] = round(time.perf_counter() - t0, 2)
        salidas["hueco"] = ruta
        # Esquinas y comprobaciones sobre el render
        px_esq = [proyectar(sc, cam, ob, co)[0] for ob, co in esquinas]
        # Variante «con captura»: la maestra se encaja DEBAJO del render por
        # homografía, igual que hará la web. Así la pantalla sale nítida (el
        # filtro de ruido de Cycles no la toca) y el cuerpo es idéntico al hueco.
        t0 = time.perf_counter()
        ruta = os.path.join(args.salida, f"{aparato}_captura.png")
        caja = (0, 0, None, None) if aparato == "laptop" else CAJA_MESAV
        encajar_captura(sc, salidas["hueco"], maestra, caja, px_esq, ruta, radio_pantalla_rel(aparato))
        tiempos["captura"] = round(time.perf_counter() - t0, 2)
        salidas["captura"] = ruta
        px_centro, p_centro = proyectar(sc, cam, *centro)
        px_borde, _ = proyectar(sc, cam, *borde)
        # px por metro en el centro de la pantalla (para componer a escala real)
        dx = (cam.matrix_world.to_3x3() @ Vector((0.05, 0, 0)))
        px_d = world_to_camera_view(sc, cam, p_centro + dx)
        px_por_metro = round(abs(px_d.x * rx - px_centro[0]) / 0.05, 2)
        a_hueco = leer_alfa(salidas["hueco"])
        a_cap = leer_alfa(salidas["captura"])
        def alfa_en(a, pt):
            x, y = int(round(pt[0])), int(round(pt[1]))
            return float(a[min(max(y, 0), ry - 1), min(max(x, 0), rx - 1)])
        comprob = {
            "centro_hueco_transparente": alfa_en(a_hueco, px_centro) < 0.02,
            "centro_captura_opaco": alfa_en(a_cap, px_centro) > 0.98,
            "bisel_opaco": alfa_en(a_hueco, px_borde) > 0.98,
            "esquinas_dentro_de_imagen": all(0 <= x <= rx and 0 <= y <= ry for x, y in px_esq),
            "silueta_no_toca_borde": True,
        }
        sil = caja_alfa(a_cap, 0.5)
        # misma definición de tinta que en la medida: alfa suavizada ≥ umbral
        tinta = caja_alfa(suavizar(a_hueco, max(1, round(max(rx, ry) / 180))), UMBRAL_TINTA)
        if tinta:
            comprob["silueta_no_toca_borde"] = (tinta[0] > 0 and tinta[1] > 0 and
                                               tinta[0] + tinta[2] < rx and tinta[1] + tinta[3] < ry)
        for k, v in comprob.items():
            if not v:
                fallos.append(f"{aparato}: {k}")
        datos = {
            "campana": "DIS-1", "aparato": aparato, "calidad": args.calidad, "color": args.color,
            "blender": bpy.app.version_string, "semilla": SEMILLA,
            "muestras": sc.cycles.samples, "imagen": [rx, ry],
            "maestra": os.path.basename(maestra),
            "proporcion_pantalla": PROP_LAPTOP if aparato == "laptop" else PROP_TELEFONO,
            "esquinas_orden": "TL,TR,BR,BL de la captura; px de imagen, origen arriba-izquierda",
            "esquinas": px_esq,
            "centro_pantalla": px_centro,
            "radio_pantalla_rel": round(radio_pantalla_rel(aparato), 6),
            "silueta_opaca": sil, "tinta_con_sombra": tinta,
            "px_por_metro": px_por_metro,
            "pose": POSE[aparato], "camara": CAMARA,
            "tiempos_s": tiempos, "comprobaciones": comprob,
            "salidas": {k: os.path.basename(v) for k, v in salidas.items()},
        }
        t0 = time.perf_counter()
        datos["web"] = derivado_web(sc, salidas["captura"], datos, aparato,
                                    os.path.join(args.salida, f"{aparato}_web.webp"), args.calidad_web)
        datos["tiempos_s"]["web"] = round(time.perf_counter() - t0, 2)
        datos["salidas"]["web"] = datos["web"]["archivo"]
        with open(os.path.join(args.salida, f"{aparato}.json"), "w", encoding="utf-8") as f:
            json.dump(datos, f, ensure_ascii=False, indent=2)
        resumen[aparato] = datos
        print(f"[DIS-1] {aparato}: {rx}×{ry} · hueco {tiempos['hueco']} s · captura {tiempos['captura']} s · "
              f"web {datos['web']['tamano'][0]}×{datos['web']['tamano'][1]} {datos['web']['bytes']} B · "
              f"comprobaciones {'OK' if all(comprob.values()) else 'FALLO'}")
    escribir_hoja(args, resumen)
    with open(os.path.join(args.salida, "datos.js"), "w", encoding="utf-8") as f:
        f.write("// Generado por gen_dispositivos.py. No editar a mano.\n")
        f.write("window.DIS_DATOS = " + json.dumps(resumen, ensure_ascii=False, indent=1) + ";\n")
    if fallos:
        print("[DIS-1] FALLOS: " + "; ".join(fallos))
        sys.exit(1)
    print("[DIS-1] listo")

def escribir_hoja(args, resumen):
    fondo = args.fondo
    bloques = []
    for ap, d in resumen.items():
        esq = " ".join(f"{x},{y}" for x, y in d["esquinas"])
        w, h = d["imagen"]
        bloques.append(f"""
<section><h2>{ap} · {w}×{h} · {d['calidad']} · {d['color']}</h2>
<div class="fila">
 <figure><div class="lienzo" style="background:{fondo}"><img src="{d['salidas']['captura']}"></div><figcaption>Con la captura, sobre el verde de la Portada</figcaption></figure>
 <figure><div class="lienzo damero"><img src="{d['salidas']['hueco']}">
   <svg viewBox="0 0 {w} {h}"><polygon points="{esq}" fill="none" stroke="#ff2d55" stroke-width="{max(2, w/400):.1f}"/></svg></div>
   <figcaption>Pantalla transparente + esquinas exportadas (rojo) sobre damero</figcaption></figure>
</div></section>""")
    comp = ""
    if "laptop" in resumen and "telefono" in resumen:
        L, T = resumen["laptop"], resumen["telefono"]
        # escala real: el teléfono se dibuja con la misma densidad px/m que la laptop
        esc = (L["px_por_metro"] / T["px_por_metro"]) if T["px_por_metro"] else 0.5
        ancho_tel_rel = T["imagen"][0] * esc / L["imagen"][0] * 100
        comp = f"""
<section><h2>Escritorio · los dos juntos (a escala real)</h2>
<div class="comp" style="background:{fondo}">
 <img class="c-lap" src="{L['salidas']['captura']}">
 <img class="c-tel" src="{T['salidas']['captura']}" style="width:{ancho_tel_rel*0.62:.1f}%">
</div><p class="nota">Composición orientativa; la definitiva la fija la lámina.</p></section>"""
    html = f"""<!doctype html><html lang="es"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>DIS-1 · hoja de renders</title><style>
body{{margin:0;padding:16px;background:#111;color:#ddd;font:14px system-ui,sans-serif}}
h1{{font-size:18px}} h2{{font-size:15px;margin:24px 0 8px}}
.fila{{display:flex;flex-wrap:wrap;gap:12px}} figure{{margin:0;flex:1 1 340px}}
figcaption{{font-size:12px;opacity:.7;margin-top:4px}}
.lienzo{{position:relative;border-radius:8px;overflow:hidden}}
.lienzo img,.lienzo svg{{display:block;width:100%;height:auto}}
.lienzo svg{{position:absolute;inset:0;height:100%}}
.damero{{background:repeating-conic-gradient(#444 0 25%,#666 0 50%) 0 0/24px 24px}}
.comp{{position:relative;display:flex;align-items:flex-end;justify-content:center;padding:24px;border-radius:8px}}
.c-lap{{width:62%;height:auto}} .c-tel{{height:auto;margin-left:-8%;position:relative}}
.nota{{font-size:12px;opacity:.6}}
</style></head><body><h1>AJILEI · DIS-1 · renders ({args.calidad})</h1>{comp}{''.join(bloques)}</body></html>"""
    with open(os.path.join(args.salida, "hoja.html"), "w", encoding="utf-8") as f:
        f.write(html)

if __name__ == "__main__":
    main()
