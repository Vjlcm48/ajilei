# ── MON-1 · heptacoin.py · La Heptacoin en 3D ───────────────────────────────
# Rector: docs/reportes/AJILEI_MON1_Fase0_Informe_v1.0.md (bloques 2 y 3) con las
# decisiones selladas de AJILEI_MON1_Fase1_v1.0.md, que mandan donde difieran.
#
# NO SE IMPORTA EL SVG. La Fase 0 §2.2 dejó el diagnóstico: el importador de
# Blender convierte rellenos y no trazos, así que el canto (`fill:none` +
# `stroke-dasharray`) y el filete interior no llegarían, y las siete estrellas son
# `<use>` sobre un `<defs>`. La moneda se RECONSTRUYE con los números medidos del
# activo, que están todos en este archivo y son auditables contra
# `src/assets/heptacoin.svg` línea por línea.
#
# Uso:
#   blender -b -P laminas/mon1/heptacoin.py -- retrato    (Paso 1 · compuerta)
#   blender -b -P laminas/mon1/heptacoin.py -- animar     (Paso 2)
import bpy, bmesh, math, time, json, sys, pathlib
from mathutils import Vector, Matrix, Quaternion, Euler

# ════════════════════════════════════════════════════════════════════════════
# LAS CONSTANTES DEL ACTIVO · todas leídas de src/assets/heptacoin.svg
# El SVG trabaja en un viewBox 0 0 100 100 con la moneda centrada en (50,50).
# Aquí 1 unidad SVG = 1 unidad de este script; la escena escala al final con U.
# ════════════════════════════════════════════════════════════════════════════
U = 0.01                      # 1 unidad SVG → 0,01 de Blender

R_FILETE_EXT = 47.0           # <circle r="47" fill="#7c1d30">
R_CAMPO      = 45.0           # <circle r="45" fill="url(#hpcFld)">
R_CANTO      = 42.9           # <circle r="42.9" stroke-width="3.4" dasharray="1.8 2.2">
W_CANTO      = 3.4
R_FIL_INT    = 40.6           # <circle r="40.6" stroke-width="0.7">
W_FIL_INT    = 0.7
R_ESTRELLAS  = 33.0           # los 7 <use> caen a radio 33 del centro
N_ESTRELLAS  = 7

GROSOR       = 10.0           # sellado en la decisión 5 (Ø 94 · ratio 9,4:1)
N_ESTRIAS    = 72             # Fase 0 §2.2: perímetro 269,6 ÷ paso 4,0 = 67,4 → 72
FRAC_ESTRIA  = 1.8 / 4.0      # del `dasharray 1.8 2.2`: 45 % surco, 55 % meseta

PROF_ESTRELLA = 0.6           # bajo relieve
ALTO_H        = 0.8           # alto relieve
PROF_CANTO    = 0.5
PROF_FIL_INT  = 0.3
# DELTA A (Victor, 31-ago): el rebaje del anillo pasa de 0,4 a 0,7 u para que el
# vino VIVA EN SU PROPIA SOMBRA. La geometría del anillo y su hex no se tocan —
# sigue siendo r 45→47 y `#7c1d30`—; lo que cambia es cuánto se hunde, que es lo
# que apaga la banda encendida y la devuelve a la línea fina y oscura del SVG.
# El reparto de material NO depende de esta cifra: se decide por la normal de
# cada cara, así que profundizar el rebaje no obliga a recalibrar ningún umbral.
REBAJE_VINO   = 0.7
DOMO          = 0.2           # abombamiento del campo, ≤0,2 u

# La estrella, del `<path id="hpcStar">`. El SVG tiene la Y hacia ABAJO, así que
# se invierte para la cara de la moneda. Punta exterior r=5, valle r=1,910
# (ratio 0,3820 = 1/φ², el pentagrama canónico).
ESTRELLA = [(0, 5), (1.123, 1.545), (4.755, 1.545), (1.817, -0.59), (2.939, -4.045),
            (0, -1.91), (-2.939, -4.045), (-1.817, -0.59), (-4.755, 1.545), (-1.123, 1.545)]

# La H serifada: los 7 <rect>, pasados de coordenadas SVG (x, y, w, h) a las de
# la cara (x−50, 50−y), que es el mismo cambio de signo que la estrella.
H_RECTS = [(36, 35, 12, 3.5), (36, 61.5, 12, 3.5), (52, 35, 12, 3.5), (52, 61.5, 12, 3.5),
           (39.5, 35, 5, 30), (55.5, 35, 5, 30), (43, 48, 14, 4.5)]

# ── Colores, ya en LINEAL (Fase 0 §2.3) ─────────────────────────────────────
ORO_LINEAL   = (0.8070, 0.4793, 0.0704, 1.0)   # #e8b84b · la base que NO se mueve
VINO_LINEAL  = (0.2016, 0.0123, 0.0296, 1.0)   # #7c1d30
VACIO_LINEAL = (0.0027, 0.0086, 0.0044, 1.0)   # #09170e
# DELTA B (Victor, 31-ago): 0,30 → 0,24. El video vive a 24° de elevación y el
# metal tiene que tener vida EN ESE ÁNGULO; un oro más pulido devuelve el
# especular más apretado y más brillante justo en la incidencia rasante. El
# retrato a 55° queda un punto más vivo y se acepta: es instrumento de
# compuerta, no el producto.
RUGOSIDAD    = 0.24

# DELTA A · el vino deja de ser metal y pasa a ESMALTE PROFUNDO. Con `Metallic`
# a 0,6 el anillo devolvía un especular metálico y se encendía como una banda;
# a 0,15 apenas refleja, y con la rugosidad a 0,55 lo poco que refleja se
# dispersa. Es la diferencia entre un anillo de metal rojo y un cuño esmaltado.
VINO_METALICO  = 0.15
VINO_RUGOSIDAD = 0.55

COLOR_LUZ    = (1.0, 0.776, 0.549)             # ≈3200 K

RAIZ = (pathlib.Path(__file__).parent).resolve()


# ════════════════════════════════════════════════════════════════════════════
# CONSTRUCCIÓN
# ════════════════════════════════════════════════════════════════════════════
def limpiar():
    bpy.ops.wm.read_factory_settings(use_empty=True)


def perfil_moneda():
    """El perfil de media sección, de centro-arriba a centro-abajo.

    Torneado en vez de booleanos: los cuatro anillos concéntricos del activo
    —campo, filete interior, canto y filete vino— son revoluciones puras, y un
    `spin` los da exactos y con la malla limpia. Los booleanos quedan sólo para
    lo que de verdad no es de revolución: las siete estrellas.
    """
    z = GROSOR / 2.0
    p = [
        (0.0,                    z + DOMO),
        (R_FIL_INT - 4.0,        z + DOMO * 0.55),
        (R_FIL_INT - W_FIL_INT / 2, z),
        (R_FIL_INT - W_FIL_INT / 2, z - PROF_FIL_INT),   # filete interior · surco
        (R_FIL_INT + W_FIL_INT / 2, z - PROF_FIL_INT),
        (R_FIL_INT + W_FIL_INT / 2, z),
        (R_CANTO - W_CANTO / 2,  z),
        (R_CANTO - W_CANTO / 2,  z - PROF_CANTO),        # canto acuñado · surco
        (R_CANTO + W_CANTO / 2,  z - PROF_CANTO),
        (R_CANTO + W_CANTO / 2,  z),
        (R_CAMPO,                z),
        (R_CAMPO,                z - REBAJE_VINO),       # filete vino · rebaje
        (R_FILETE_EXT - 0.4,     z - REBAJE_VINO),
        (R_FILETE_EXT,           z - REBAJE_VINO - 0.4), # bisel del borde
        (R_FILETE_EXT,          -z + REBAJE_VINO + 0.4),
        (R_FILETE_EXT - 0.4,    -z + REBAJE_VINO),
        (R_CAMPO,               -z + REBAJE_VINO),
        (R_CAMPO,               -z),
        (R_CANTO + W_CANTO / 2, -z),
        (R_CANTO + W_CANTO / 2, -z + PROF_CANTO),
        (R_CANTO - W_CANTO / 2, -z + PROF_CANTO),
        (R_CANTO - W_CANTO / 2, -z),
        (R_FIL_INT + W_FIL_INT / 2, -z),
        (R_FIL_INT + W_FIL_INT / 2, -z + PROF_FIL_INT),
        (R_FIL_INT - W_FIL_INT / 2, -z + PROF_FIL_INT),
        (R_FIL_INT - W_FIL_INT / 2, -z),
        (R_FIL_INT - 4.0,       -z - DOMO * 0.55),
        (0.0,                   -z - DOMO),
    ]
    return p


def cuerpo_torneado(segmentos=256):
    me = bpy.data.meshes.new('HeptacoinCuerpo')
    bm = bmesh.new()
    verts = [bm.verts.new((r, 0.0, zz)) for r, zz in perfil_moneda()]
    for a, b in zip(verts, verts[1:]):
        bm.edges.new((a, b))
    bmesh.ops.spin(bm, geom=bm.verts[:] + bm.edges[:], axis=(0, 0, 1),
                   cent=(0, 0, 0), dvec=(0, 0, 0), angle=2 * math.pi,
                   steps=segmentos, use_merge=True)
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-5)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.to_mesh(me)
    bm.free()
    ob = bpy.data.objects.new('Heptacoin', me)
    bpy.context.collection.objects.link(ob)
    return ob


def prisma(poligono, z0, z1, nombre):
    """Extruye un polígono plano entre dos alturas. Sin booleanos: geometría."""
    me = bpy.data.meshes.new(nombre)
    bm = bmesh.new()
    abajo = [bm.verts.new((x, y, z0)) for x, y in poligono]
    cara = bm.faces.new(abajo)
    r = bmesh.ops.extrude_face_region(bm, geom=[cara])
    subidos = [v for v in r['geom'] if isinstance(v, bmesh.types.BMVert)]
    bmesh.ops.translate(bm, verts=subidos, vec=(0, 0, z1 - z0))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.to_mesh(me)
    bm.free()
    ob = bpy.data.objects.new(nombre, me)
    bpy.context.collection.objects.link(ob)
    return ob


def estrellas_cortadoras():
    """Las siete estrellas, en BAJO relieve: prismas que se restan de la cara."""
    z = GROSOR / 2.0
    piezas = []
    for k in range(N_ESTRELLAS):
        ang = math.radians(90.0 - k * (360.0 / N_ESTRELLAS))
        cx, cy = R_ESTRELLAS * math.cos(ang), R_ESTRELLAS * math.sin(ang)
        giro = ang - math.radians(90.0)          # la punta mira hacia afuera
        c, s = math.cos(giro), math.sin(giro)
        poli = [(cx + x * c - y * s, cy + x * s + y * c) for x, y in ESTRELLA]
        # Sobresale por arriba para que la resta corte limpio en la superficie.
        piezas.append(prisma(poli, z - PROF_ESTRELLA, z + 2.0, f'estrella{k}'))
    return piezas


# El CONTORNO de la H, como un solo polígono cerrado.
#
# POR QUÉ UN CONTORNO Y NO SIETE CAJAS. El primer intento extruyó los siete
# <rect> por separado y los unió con `join`. MIDIÓ MAL, y se vio en el retrato:
# donde dos cajas se cruzan —asta con travesaño, asta con serif— quedan caras
# INTERNAS enfrentadas, y Cycles las sombrea como lo que son, huecos negros. La
# H salía rota, con manchas negras en cada empalme. Unir sólidos que se solapan
# no es lo mismo que fundirlos.
# El contorno se recorre una vez y sale un ngon limpio, sin geometría interior.
# Las coordenadas salen de los mismos siete <rect>: astas en x ±5,5..±10,5,
# serifs en x ±2..±14 a y ±11,5..±15, travesaño en y −2,5..2.
H_CONTORNO = [
    (-14, 15), (-2, 15), (-2, 11.5), (-5.5, 11.5), (-5.5, 2), (5.5, 2),
    (5.5, 11.5), (2, 11.5), (2, 15), (14, 15), (14, 11.5), (10.5, 11.5),
    (10.5, -11.5), (14, -11.5), (14, -15), (2, -15), (2, -11.5), (5.5, -11.5),
    (5.5, -2.5), (-5.5, -2.5), (-5.5, -11.5), (-2, -11.5), (-2, -15),
    (-14, -15), (-14, -11.5), (-10.5, -11.5), (-10.5, 11.5), (-14, 11.5),
]


def letra_h():
    """La H serifada en ALTO relieve, de una pieza."""
    z = GROSOR / 2.0
    # Arranca por debajo de la superficie para fundirse con el campo.
    return [prisma(H_CONTORNO, z - 0.6, z + ALTO_H, 'letraH')]


def mesetas_canto():
    """Las estrías, al revés de lo obvio: el torno ya dejó el surco del canto
    dando la vuelta entera, así que aquí se AÑADEN las 72 mesetas que lo
    interrumpen. Es la misma lectura del `dasharray 1.8 2.2` —45 % hueco,
    55 % meseta— y ahorra un booleano de 72 piezas."""
    z = GROSOR / 2.0
    r0, r1 = R_CANTO - W_CANTO / 2, R_CANTO + W_CANTO / 2
    paso = 2 * math.pi / N_ESTRIAS
    ancho = paso * (1.0 - FRAC_ESTRIA)          # la meseta, no el surco
    piezas = []
    for cara_z, etiqueta in ((z, 'sup'), (-z, 'inf')):
        for k in range(N_ESTRIAS):
            a0 = k * paso - ancho / 2
            a1 = k * paso + ancho / 2
            poli = [(r0 * math.cos(a0), r0 * math.sin(a0)),
                    (r1 * math.cos(a0), r1 * math.sin(a0)),
                    (r1 * math.cos(a1), r1 * math.sin(a1)),
                    (r0 * math.cos(a1), r0 * math.sin(a1))]
            if cara_z > 0:
                piezas.append(prisma(poli, cara_z - PROF_CANTO - 0.2, cara_z, f'm{etiqueta}{k}'))
            else:
                piezas.append(prisma(poli, cara_z, cara_z + PROF_CANTO + 0.2, f'm{etiqueta}{k}'))
    return piezas


def materiales(ob):
    oro = bpy.data.materials.new('OroHeptacoin')
    oro.use_nodes = True
    p = oro.node_tree.nodes['Principled BSDF']
    p.inputs['Base Color'].default_value = ORO_LINEAL
    p.inputs['Metallic'].default_value = 1.0
    p.inputs['Roughness'].default_value = RUGOSIDAD

    vino = bpy.data.materials.new('VinoFilete')
    vino.use_nodes = True
    q = vino.node_tree.nodes['Principled BSDF']
    q.inputs['Base Color'].default_value = VINO_LINEAL
    q.inputs['Metallic'].default_value = VINO_METALICO
    q.inputs['Roughness'].default_value = VINO_RUGOSIDAD

    ob.data.materials.append(oro)
    ob.data.materials.append(vino)

    # ── DELTA SELLADO POR VICTOR (31-ago-2026, refinado) ────────────────────
    # El vino `#7c1d30` queda confinado EXCLUSIVAMENTE a la **superficie plana**
    # del anillo facial r 45→47, en anverso y reverso. Todo lo demás es oro: la
    # pared cilíndrica lateral, **el bisel de transición** y el escalón del
    # campo. Doctrina sellada: el cuño define el vino como un anillo PLANO de la
    # cara; toda geometría que el 3D inventa —costado, bisel, reverso— rige por
    # el oro único. Con el bisel en oro, la silueta a 24° se lee oro puro.
    #
    # LA FRONTERA ES LA NORMAL, NO UNA COTA. Los umbrales sobre `z` que usaron
    # los dos intentos anteriores daban el resultado correcto sin decir por qué,
    # y se rompen en cuanto alguien recalibra el rebaje o el bisel. La normal,
    # en cambio, distingue las tres superficies por lo que SON, y el perfil las
    # separa con holgura:
    #     anillo plano  → normal vertical           |nz| = 1,000
    #     bisel a 45°   → normal a media pendiente   |nz| = 0,707
    #     escalón/pared → normal radial              |nz| = 0,000
    # Un corte en 0,9 se queda solo con el anillo, y sobrevive a que el bisel
    # cambie de ángulo mientras siga siendo un bisel.
    #
    # El SVG respalda la doctrina: dibuja el vino como el `<circle r="47">` que
    # asoma DETRÁS del campo — un anillo plano, sin canto ni bisel. Lo que el
    # activo no define, el oro único lo decide.
    UMBRAL_PLANO = 0.9
    for f in ob.data.polygons:
        c = f.center
        r = math.hypot(c.x, c.y)
        en_corona = r >= R_CAMPO - 0.05
        es_plana = abs(f.normal.z) > UMBRAL_PLANO
        f.material_index = 1 if (en_corona and es_plana) else 0


def construir_moneda():
    cuerpo = cuerpo_torneado()

    # ── Lo que se RESTA: sólo las estrellas ─────────────────────────────────
    cortadoras = estrellas_cortadoras()
    bpy.context.view_layer.objects.active = cortadoras[0]
    for c in cortadoras:
        c.select_set(True)
    bpy.ops.object.join()
    corte = bpy.context.active_object
    corte.name = 'CorteEstrellas'

    mod = cuerpo.modifiers.new('estrellas', 'BOOLEAN')
    mod.operation = 'DIFFERENCE'
    mod.solver = 'EXACT'
    mod.object = corte
    bpy.context.view_layer.objects.active = cuerpo
    bpy.ops.object.modifier_apply(modifier='estrellas')
    bpy.data.objects.remove(corte, do_unlink=True)

    # ── Lo que se SUMA: la H y las mesetas del canto ────────────────────────
    sumas = letra_h() + mesetas_canto()
    bpy.ops.object.select_all(action='DESELECT')
    for s in sumas:
        s.select_set(True)
    cuerpo.select_set(True)
    bpy.context.view_layer.objects.active = cuerpo
    bpy.ops.object.join()
    cuerpo = bpy.context.active_object
    cuerpo.name = 'Heptacoin'

    materiales(cuerpo)
    bpy.ops.object.shade_smooth()
    # `use_auto_smooth` desapareció de la malla en 4.1: el suavizado por ángulo
    # se hace con un modificador. Aquí EDGE_SPLIT, que es el equivalente directo
    # y no depende de nodos de geometría.
    # Bordes vivos donde toca: sin esto el suavizado redondea los serifs de la H.
    ang = cuerpo.modifiers.new('bordes', 'EDGE_SPLIT')
    ang.split_angle = math.radians(30)

    cuerpo.scale = (U, U, U)
    bpy.ops.object.transform_apply(scale=True)
    return cuerpo


# ════════════════════════════════════════════════════════════════════════════
# LUZ, CÁMARA, MUNDO  ·  decisión 8
# ════════════════════════════════════════════════════════════════════════════
ELEVACION = math.radians(24.0)
AZIMUT    = math.radians(20.0)
LENTE     = 75.0
LLENADO   = 0.62          # fracción del ancho de cuadro que ocupa la moneda


# La elevación del RETRATO no es la del video, y es a propósito.
#
# La decisión 8 sella la cámara del video en 22–25° y ahí se queda. Pero el
# Paso 1 es una compuerta cuyo trabajo es que Victor LEA los cinco elementos
# sellados, y a 24° la caja de la H —28 u de ancho por 30 de alto— se aplasta a
# ~12 u aparentes: el alto relieve se convierte en una mancha y no hay forma
# honesta de sellarlo. El retrato se hace CASI DE CARA (82°), que es lo que la
# ficha pide con esas palabras —«de cara, plana»—, y se entrega ADEMÁS el
# encuadre definitivo para que se vea lo que el video va a mostrar.
# La luz no cambia entre los dos: es «la luz definitiva» en ambos.
#
# Y LA ELEVACIÓN DEL RETRATO TAMPOCO ES 82°, aunque «de cara» lo sugiera.
# MEDIDO: a 82° la cámara queda a 8° del cenit y la clave está a 15°, así que se
# mira casi por el eje del reflejo. Sobre un metal de rugosidad 0,30 eso no es
# un brillo: es la imagen especular del área de luz ocupando media moneda, con
# el campo reventado a blanco y el relieve borrado. El retrato salía peor que el
# encuadre del video, que es lo contrario de lo que una compuerta necesita.
# A 55° la cámara está a 35° del cenit —lejos del reflejo de 15°— y el relieve
# se lee con la MISMA luz definitiva, sin mover una sola lámpara.
ELEVACION_RETRATO = math.radians(55.0)


def camara(elevacion=None, llenado=None, diana_z=0.0):
    """La cámara sellada. `llenado` y `diana_z` sólo los mueve el Paso 2.

    El retrato encuadra UNA moneda y le basta el llenado de 0,62. El video mete
    ocho en el mismo cuadro, así que abre el encuadre (llenado menor) y sube la
    diana para que la composición —pila alta a un lado, héroe en primer plano al
    otro— caiga dentro de la banda segura 16:7. Ni la elevación, ni el azimut, ni
    la lente, ni una sola lámpara se tocan: el encuadre se abre, la luz no.
    """
    elev = ELEVACION if elevacion is None else elevacion
    lle = LLENADO if llenado is None else llenado
    diam = 2 * R_FILETE_EXT * U
    hfov_media = math.atan(18.0 / LENTE)
    d = (diam / lle) / (2 * math.tan(hfov_media))
    cz = diana_z
    x = d * math.cos(elev) * math.sin(AZIMUT)
    y = -d * math.cos(elev) * math.cos(AZIMUT)
    z = cz + d * math.sin(elev)
    bpy.ops.object.camera_add(location=(x, y, z))
    cam = bpy.context.active_object
    cam.data.lens = LENTE
    diana = bpy.data.objects.new('Diana', None)
    bpy.context.collection.objects.link(diana)
    diana.location = (0, 0, cz)
    t = cam.constraints.new('TRACK_TO')
    t.target = diana
    t.track_axis = 'TRACK_NEGATIVE_Z'
    t.up_axis = 'UP_Y'
    bpy.context.scene.camera = cam
    return cam, d


def luces(energia_clave=900.0):
    d = 2.6
    inc = math.radians(15.0)                    # adelantada hacia cámara
    bpy.ops.object.light_add(type='AREA', location=(
        d * math.sin(inc) * math.sin(AZIMUT),
        -d * math.sin(inc) * math.cos(AZIMUT),
        d * math.cos(inc)))
    key = bpy.context.active_object
    key.name = 'Clave'
    key.data.size = 1.6
    key.data.energy = energia_clave
    key.data.color = COLOR_LUZ
    t = key.constraints.new('TRACK_TO')
    t.target = bpy.data.objects['Diana']
    t.track_axis = 'TRACK_NEGATIVE_Z'
    t.up_axis = 'UP_Y'

    bpy.ops.object.light_add(type='AREA', location=(
        -1.4 * math.sin(AZIMUT), 1.4 * math.cos(AZIMUT), 0.55))
    rim = bpy.context.active_object
    rim.name = 'Contorno'
    rim.data.size = 1.8
    rim.data.energy = energia_clave * 0.10      # 10 % · el rango 8–12 % de 3.3
    rim.data.color = COLOR_LUZ
    t2 = rim.constraints.new('TRACK_TO')
    t2.target = bpy.data.objects['Diana']
    t2.track_axis = 'TRACK_NEGATIVE_Z'
    t2.up_axis = 'UP_Y'
    return key, rim


def mundo_vacio():
    w = bpy.data.worlds.new('Vacio')
    w.use_nodes = True
    w.node_tree.nodes['Background'].inputs['Color'].default_value = VACIO_LINEAL
    w.node_tree.nodes['Background'].inputs['Strength'].default_value = 0.35
    bpy.context.scene.world = w


def suelo():
    bpy.ops.mesh.primitive_plane_add(size=12, location=(0, 0, -GROSOR / 2 * U))
    s = bpy.context.active_object
    s.name = 'Vacio'
    m = bpy.data.materials.new('VacioVerde')
    m.use_nodes = True
    n = m.node_tree.nodes['Principled BSDF']
    n.inputs['Base Color'].default_value = VACIO_LINEAL
    n.inputs['Roughness'].default_value = 0.92
    s.data.materials.append(m)
    return s


def escena_render(motor='CYCLES', ancho=1280, alto=720, muestras=192):
    s = bpy.context.scene
    s.render.engine = motor
    # ── LA TRANSFORMACIÓN DE VISTA, Y POR QUÉ NO PUEDE SER LA DE FÁBRICA ─────
    # Blender 4.x trae **AgX** por defecto, un mapeo tonal que desatura los altos
    # a propósito. En el primer retrato el oro salió crema lavado y el filete
    # vino, caramelo: no era la luz, era AgX comiéndose la saturación.
    # Y hay una razón más fuerte que el gusto: el criterio de calibración de la
    # decisión 7 dice que el centro del campo debe dar **#e8b84b**. Ese criterio
    # sólo significa algo si el paso de lineal a sRGB es el directo. Con AgX de
    # por medio se estaría calibrando contra el tonemapper, no contra el oro.
    s.view_settings.view_transform = 'Standard'
    s.view_settings.look = 'None'
    s.view_settings.exposure = 0.0
    s.view_settings.gamma = 1.0
    # ── BALANCE DE BLANCOS · lo que reconcilia las decisiones 7 y 8 ──────────
    # La 8 sella la clave en 3200 K; la 7 sella que el campo dé #e8b84b. Sin
    # más, las dos no pueden cumplirse a la vez: una luz cálida MULTIPLICA el
    # color del material —G a 0,776 y B a 0,549—, así que el oro sale más
    # naranja que su propio tono. Medido en la primera pasada: #e9aa52 contra
    # #e8b84b, con el verde 14 puntos corto.
    # Lo que hace una cámara real ante una luz cálida es balancear el blanco, y
    # se PROBÓ: `use_white_balance` a 3200 K. **SOBRECORRIGIÓ y se retiró.**
    # Medido: el campo pasó de #e9aa52 a #e4d297 — el azul saltó de 82 a 151,
    # 76 puntos por encima del objetivo, y el oro se fue a un dorado pálido.
    # La causa es que el balance neutraliza el cuerpo negro de 3200 K entero,
    # mientras que la clave de la escena no es sólo esa luz: el contorno y el
    # rebote del vacío también aportan, y el conjunto ya no es un iluminante
    # puro. Corregir contra un iluminante que no es el que hay es corregir de
    # más. Se deja SIN balance y la desviación que queda se declara en el
    # informe, que es donde una compuerta la tiene que ver.
    if hasattr(s.view_settings, 'use_white_balance'):
        s.view_settings.use_white_balance = False
    s.render.resolution_x = ancho
    s.render.resolution_y = alto
    s.render.resolution_percentage = 100
    s.render.image_settings.file_format = 'PNG'
    s.render.image_settings.color_mode = 'RGBA'
    s.render.film_transparent = False
    if motor == 'CYCLES':
        s.cycles.device = 'CPU'
        s.cycles.samples = muestras
        s.cycles.use_denoising = True
        s.cycles.use_adaptive_sampling = True
    return s


# ════════════════════════════════════════════════════════════════════════════
# CALIBRACIÓN DEL ORO · el criterio de la decisión 7
# ════════════════════════════════════════════════════════════════════════════
# EL PUNTO DE CALIBRACIÓN, y por qué no es el centro del cuadro.
#
# El primer intento leyó el píxel central y calibró contra un valor que no se
# movía con la luz: en el centro de la moneda está **la H**, no el campo. La
# decisión 7 pide «el píxel del centro del CAMPO», que es otra cosa.
# El campo limpio vive en una corona estrecha: por dentro la H llega a
# r=√(14²+15²)=20,5 y por fuera las estrellas ocupan r 28..38 (centro 33, punta
# 5). Queda la banda **r 20,5 .. 28**. Se muestrea a r=25 y en el ángulo que
# parte en dos el hueco entre dos estrellas —64,3°, la bisectriz de 90° y
# 38,57°—, que es el punto de campo más lejos de cualquier relieve.
R_MUESTRA = 25.0
ANG_MUESTRA = math.radians(90.0 - (360.0 / N_ESTRELLAS) / 2.0)


def punto_campo():
    return Vector((R_MUESTRA * math.cos(ANG_MUESTRA) * U,
                   R_MUESTRA * math.sin(ANG_MUESTRA) * U,
                   (GROSOR / 2.0 + DOMO * 0.4) * U))


def punto_pared():
    """Un punto de la PARED LATERAL, de cara a la cámara y a media altura.

    Existe para poder demostrar el delta sellado con un número en vez de con una
    impresión: si el costado es de oro, este píxel tiene que ser un dorado en
    penumbra y NO un vino. El ángulo es el que mira a la cámara —la cámara está
    en azimut 20°, así que el frente de la moneda cae en −70°— y la altura es
    z=0, el ecuador, lo más lejos posible del bisel por arriba y por abajo.
    """
    ang = AZIMUT - math.radians(90.0)
    return Vector((R_FILETE_EXT * math.cos(ang) * U,
                   R_FILETE_EXT * math.sin(ang) * U,
                   0.0))


def punto_bisel():
    """El punto medio del BISEL, de cara a la cámara.

    El bisel va de (46,60 · 4,60) a (47,00 · 4,20) en el perfil, así que su
    medio cae en r 46,80 · z 4,40. Con el delta refinado tiene que salir ORO;
    antes del refinamiento salía vino, y ésta es la medición que lo distingue.
    """
    ang = AZIMUT - math.radians(90.0)
    r = (R_FILETE_EXT - 0.2)
    return Vector((r * math.cos(ang) * U, r * math.sin(ang) * U,
                   ((GROSOR / 2.0) - REBAJE_VINO - 0.2) * U))


def punto_anillo():
    """El anillo facial PLANO (r 46,0 · z 4,60), que sigue siendo vino."""
    ang = AZIMUT - math.radians(90.0)
    r = 46.0
    return Vector((r * math.cos(ang) * U, r * math.sin(ang) * U,
                   ((GROSOR / 2.0) - REBAJE_VINO) * U))


def leer_pixel(ruta, punto):
    """Devuelve, como bytes sRGB 0-255, el píxel donde cae `punto` (mundo).

    Se lee con la imagen en 'Non-Color': así `pixels` entrega los valores TAL
    COMO están codificados en el PNG y multiplicar por 255 da el byte sRGB
    directo. Con el espacio en sRGB, Blender los convertiría a lineal y la
    comparación contra #e8b84b sería contra otra cosa.
    Se promedia una ventana de 5×5 para que una mota de ruido de Cycles no
    decida la calibración.
    """
    from bpy_extras.object_utils import world_to_camera_view
    s = bpy.context.scene
    uv = world_to_camera_view(s, s.camera, punto)
    img = bpy.data.images.load(str(ruta), check_existing=False)
    img.colorspace_settings.name = 'Non-Color'
    w, h = img.size
    px = list(img.pixels)
    cx = min(max(int(uv.x * w), 2), w - 3)
    cy = min(max(int(uv.y * h), 2), h - 3)
    acc = [0.0, 0.0, 0.0]
    n = 0
    for dy in range(-2, 3):
        for dx in range(-2, 3):
            i = ((cy + dy) * w + (cx + dx)) * 4
            for k in range(3):
                acc[k] += px[i + k]
            n += 1
    bpy.data.images.remove(img)
    return tuple(round(acc[k] / n * 255) for k in range(3))


def hexa(rgb):
    return '#%02x%02x%02x' % rgb


def calibrar_oro(key, iteraciones=6):
    """Ajusta la potencia de la clave hasta que el centro del campo dé #e8b84b.

    Busca sobre el canal ROJO, que es el que primero satura: si el rojo llega a
    232 y el resto sigue la proporción del material, el tono es el sellado. Y el
    render de sonda va a 240×135 con 24 muestras — cuesta menos de un segundo y
    el color medio de una superficie lisa no depende de la resolución.
    """
    objetivo = (232, 184, 75)
    # La sonda va a 640×360: por debajo, la ventana de 5×5 abarca demasiada
    # moneda y se cuela el relieve vecino.
    s = escena_render(ancho=640, alto=360, muestras=32)
    punto = punto_campo()
    lo, hi = 5.0, 5000.0
    mejor = (None, None, 1e9)
    for _ in range(iteraciones):
        med = math.sqrt(lo * hi)                 # bisección geométrica: la luz
        key.data.energy = med                    # es multiplicativa, no lineal
        bpy.data.objects['Contorno'].data.energy = med * 0.10
        s.render.filepath = str(RAIZ / '_calib' / 'sonda')
        bpy.ops.render.render(write_still=True)
        rgb = leer_pixel(RAIZ / '_calib' / 'sonda.png', punto)
        err = abs(rgb[0] - objetivo[0])
        print(f'CALIB :: energia={med:9.1f} :: campo={hexa(rgb)} :: dR={rgb[0]-objetivo[0]:+d}')
        if err < mejor[2]:
            mejor = (med, rgb, err)
        if rgb[0] < objetivo[0]:
            lo = med
        else:
            hi = med
    key.data.energy = mejor[0]
    bpy.data.objects['Contorno'].data.energy = mejor[0] * 0.10
    print(f'CALIB :: SELLADA energia={mejor[0]:.1f} :: campo={hexa(mejor[1])} :: objetivo=#e8b84b')
    return mejor


# ════════════════════════════════════════════════════════════════════════════
# PASO 1 · EL RETRATO
# ════════════════════════════════════════════════════════════════════════════
def retrato():
    limpiar()
    t0 = time.perf_counter()
    moneda = construir_moneda()
    t_geo = time.perf_counter() - t0
    print(f'GEO :: {len(moneda.data.polygons)} polígonos :: {t_geo:.2f} s')

    suelo()
    mundo_vacio()
    cam, dist = camara(ELEVACION_RETRATO)
    key, rim = luces()
    print(f'CAM :: retrato distancia={dist:.3f} :: elevación={math.degrees(ELEVACION_RETRATO):.0f}° '
          f':: azimut={math.degrees(AZIMUT):.0f}° :: lente={LENTE}mm')

    mejor = calibrar_oro(key)

    s = escena_render(ancho=1280, alto=720, muestras=192)
    s.render.filepath = str(RAIZ / 'render' / 'retrato')
    t1 = time.perf_counter()
    bpy.ops.render.render(write_still=True)
    t_ren = time.perf_counter() - t1
    rgb = leer_pixel(RAIZ / 'render' / 'retrato.png', punto_campo())
    print(f'RETRATO :: {t_ren:.2f} s :: campo={hexa(rgb)} :: objetivo=#e8b84b')

    # Y el mismo instante desde la cámara SELLADA del video, para que el sello
    # del material se dé sabiendo cómo se verá de verdad.
    for o in list(bpy.data.objects):
        if o.type == 'CAMERA':
            bpy.data.objects.remove(o, do_unlink=True)
    cam2, d2 = camara(ELEVACION)
    s.render.filepath = str(RAIZ / 'render' / 'encuadre-video')
    t2 = time.perf_counter()
    bpy.ops.render.render(write_still=True)
    t_enc = time.perf_counter() - t2
    print(f'ENCUADRE :: {t_enc:.2f} s :: distancia={d2:.3f} :: elevación=24°')
    # La prueba del delta: el costado, medido en el encuadre del video, que es
    # donde más pared se ve. Vino sería ~#7c1d30 (rojo dominante); oro en
    # penumbra tiene que salir con el rojo por delante del azul y el verde en
    # medio, en la misma familia que #e8b84b pero oscuro.
    # Las tres superficies de la corona, medidas una a una.
    #
    # SE CLASIFICA POR TONO, y hubo que aprenderlo. El primer criterio fue el
    # orden de canales —oro R›G›B, vino R›B›G— y funciona a luz neutra, pero
    # MINTIÓ bajo la clave de 3200 K: la luz cálida multiplica G por 0,776 y B
    # por 0,549, así que hunde el azul más que el verde y le da la vuelta al
    # orden. El anillo de vino medía (160·72·56) y el criterio lo cantaba «oro».
    # El TONO no se deja engañar: el oro de marca vive cerca de 40° y el vino
    # cerca de 5°, y una luz cálida los desplaza a los dos por igual sin
    # acercarlos.
    v = RAIZ / 'render' / 'encuadre-video.png'
    for etiqueta, punto, esperado in (
            ('costado', punto_pared(), 'ORO'),
            ('bisel  ', punto_bisel(), 'ORO (delta refinado)'),
            ('anillo ', punto_anillo(), 'VINO')):
        rgb = leer_pixel(v, punto)
        mx, mn = max(rgb), min(rgb)
        if mx == mn:
            tono = 0.0
        elif mx == rgb[0]:
            tono = (60 * ((rgb[1] - rgb[2]) / (mx - mn))) % 360
        elif mx == rgb[1]:
            tono = 60 * (2 + (rgb[2] - rgb[0]) / (mx - mn))
        else:
            tono = 60 * (4 + (rgb[0] - rgb[1]) / (mx - mn))
        firma = 'ORO' if tono >= 22 else 'VINO'
        print(f'CORONA :: {etiqueta} = {hexa(rgb)}  {rgb}  tono={tono:5.1f}°  '
              f'-> {firma} :: esperado {esperado}')
    # La proyección del lote sale del encuadre DEL VIDEO, no del retrato: el
    # retrato mira la moneda casi de cara y llena más cuadro de metal, que para
    # Cycles es el caso caro. Proyectar con él inflaría la cifra.
    print(f'PROYECCION :: lote 135 = {t_enc*135/60:.1f} min (encuadre del video)')
    return rgb, t_enc, mejor



# ════════════════════════════════════════════════════════════════════════════
# PASO 2 · LA COREOGRAFÍA v2  ·  30 fps · fotogramas 0–134 · 4,5 s
# ════════════════════════════════════════════════════════════════════════════
# Los números de esta sección NO son propuestas: los selló la ficha de Fase 1
# corrigiendo el guion de la Fase 0 (que planteaba 150 fotogramas, cuatro monedas
# y bamboleo). Manda la ficha.
FPS            = 30
F_FIN          = 134
IMPACTOS_A     = (12, 19, 26, 32, 39, 45, 52)   # las siete, selladas
F_PAUSA        = (57, 59)
F_ENTRA        = 60
# DELTA DEL VUELO (Victor, 31-ago). El tramo C se reescribe entero: la héroe cae
# EN VERTICAL, toca de canto, rebota y se vuelca. Los límites del tramo (60–87) y
# todo lo demás —A, B, D— no se mueven un fotograma.
F_CONTACTO     = 72          # contacto de canto
F_APICE        = 76
F_CONTACTO2    = 80          # segundo contacto de canto · arranca el vuelco
F_FRENO        = 70          # el giro de rueda se frena ANTES del contacto
F_REPOSO       = 87          # plana, anverso arriba, en la postura de siempre
F_BARRIDO      = (90, 134)

# La gravedad de la escena. No es 9,81: la moneda mide 0,94 unidades de Blender,
# así que el «metro» de esta escena no es un metro. Se elige el valor que hace
# que la caída de las siete dure lo que la ficha sella (impactos cada 6-7
# fotogramas desde una altura fuera de cuadro) y se usa el MISMO para la héroe,
# que es lo que hace que las ocho monedas pesen igual.
G_ESCENA       = 12.0
Z_SALIDA       = 1.75          # altura de partida, fuera de cuadro por arriba

PILA_XY        = (-0.62, 0.28)   # la pila: al fondo y a la izquierda de cuadro
HEROE_XY       = (0.55, -0.38)   # la héroe: primer plano, a la derecha
DESALINEA      = 2.0 * U         # los «~2 u de desalineación alternada»
ALTURA_REBOTE  = R_FILETE_EXT * U          # «altura ≈ un radio», sellado
RZ_HEROE       = math.radians(8.0)   # la orientación de reposo, INTOCABLE: es la
                                    # que hace bit-idéntico el tramo D
BETA_CANTO     = math.radians(55.0)  # el dial entre «estrías legibles» y «vuelco
                                     # hacia cámara» — ver animar_heroe()
GIRO_RUEDA     = math.radians(40.0)  # el giro leve de rueda en la caída
# La altura de salida no sale de la gravedad de la escena sino de una condición
# de encuadre: **de canto la moneda mide 0,94 u de alto**, no 0,10, así que a la
# altura de la versión plana asomaba por arriba del cuadro durante los sesenta
# fotogramas en que está aparcada. Se sube hasta que el punto más bajo queda
# fuera de cuadro en el 60, y la caída sale más rápida que la de las siete — que
# es literalmente lo que la ficha pide de la héroe: «llega tarde y rápida».
Z_HEROE_SALIDA = 2.05

# EL REBOTE DE CANTO NO PUEDE SER DE UN RADIO, Y ES ARITMETICA DE ENCUADRE.
# De canto la moneda ocupa 0,94 u de alto, no 0,10: su cima esta un radio POR
# ENCIMA del centro, y el centro ya esta a un radio del suelo. Medido sobre la
# silueta real (96 puntos del canto, no la caja envolvente):
#     centro en 0,42 (posada de canto) -> cima en y = 0,778 de cuadro
#     centro en 0,89 (rebote de un radio) -> cima en y = 1,026  <- FUERA DEL CUADRO
# La pendiente es 0,528 de cuadro por unidad de altura, asi que:
#     y <= 0,889 (banda segura 16:7) -> rebote <= 0,210 u = 0,45 radios
#     y <= 1,000 (borde del cuadro)  -> rebote <= 0,421 u = 0,90 radios
# Se elige el que respeta la BANDA. La decision 9 existe para que la portada
# pueda recortar a 16:7 sin cortar una moneda, y su fallo es invisible aqui y
# visible en produccion; el de un rebote mas corto se ve al instante y se
# corrige cambiando este numero. Subirlo a 0,42 recupera el radio casi entero a
# costa de que la cima salga de la banda cinco fotogramas.
ALTURA_REBOTE_CANTO = 0.20

ANCHO_CUADRO   = 3.45            # unidades de Blender que cruzan el cuadro
LLENADO_VIDEO  = 2 * R_FILETE_EXT * U / ANCHO_CUADRO
DIANA_Z        = 0.25            # sube la mira: baja la composición en cuadro

OBTURADOR      = 0.40            # desenfoque de movimiento «sutil»
MUESTRAS_LOTE  = 192

# El barrido especular del tramo D. No es una luz nueva: es un rectángulo
# emisivo INVISIBLE PARA LA CÁMARA que cruza por encima de la héroe, de modo que
# lo que se ve es un reflejo REAL recorriendo el relieve —entra en las estrellas
# hundidas con el retardo que da su profundidad— y no un degradado superpuesto.
# Es el gesto de EMB-1 sobre el título, ahora en tres dimensiones.
BARRIDO_LARGO  = 2.20
BARRIDO_ANCHO  = 0.10
BARRIDO_ALTO   = 0.52            # sobre la cara de la héroe
BARRIDO_SESGO  = math.radians(18.0)
# 16 y no 25: a 25 el campo de la héroe llegaba a 255 en el rojo al paso del
# barrido, y un canal recortado no es un brillo — es relieve borrado. Medido.
BARRIDO_FUERZA = 16.0
BARRIDO_VIAJE  = 1.15            # recorrido a cada lado del centro

# La rampa verde de la portada, tal como vive en `src/styles/theme.css`.
# NO se re-inventa un fondo: se hornea el mismo degradado que la portada pinta
# detrás del video, para que el borde del cuadro y el fondo de la página sean el
# mismo color y la costura no exista.
VERDE_BRIGHT = (0x23, 0x5c, 0x38)      # --green-bright #235c38
VERDE_DEEP   = (0x15, 0x39, 0x22)      # --green-deep   #153922
VERDE_ABYSS  = (0x09, 0x17, 0x0e)      # --green-abyss  #09170e
# `radial-gradient(ellipse at 42% 38%, bright 0%, deep 50%, abyss 100%)` de
# welcome.css, con el tamaño `farthest-corner` que CSS aplica por defecto:
# rx = 0,58·√2 y ry = 0,62·√2 en fracciones de ancho y alto.
FONDO_CX, FONDO_CY = 0.42, 0.38
FONDO_RX = 0.58 * math.sqrt(2.0)
FONDO_RY = 0.62 * math.sqrt(2.0)
FONDO_VINETA = 0.16          # la viñeta que fuerza los CUATRO bordes a abyss
FONDO_SONDA = (0.42, 0.62)   # punto de calibración: el centro de la elipse


def srgb_a_lineal(c):
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4


def lineal_a_srgb(c):
    c = max(0.0, min(1.0, c))
    return c * 12.92 if c <= 0.0031308 else 1.055 * (c ** (1 / 2.4)) - 0.055


def fondo_srgb(x, y):
    """El color del fondo en (x, y) de cuadro, en bytes sRGB. y es de ABAJO a
    arriba (convenio de Blender); CSS mide de arriba a abajo, y aquí se invierte.

    Se interpola en sRGB, no en lineal, porque es lo que hace el navegador: si el
    horneado interpolara en lineal, el degradado del video y el de la portada
    divergirían en los medios tonos y la costura se vería justo donde no debe.
    """
    yc = 1.0 - y
    t = math.hypot((x - FONDO_CX) / FONDO_RX, (yc - FONDO_CY) / FONDO_RY)
    t = min(1.0, max(0.0, t))
    if t <= 0.5:
        u = t / 0.5
        base = [VERDE_BRIGHT[k] + (VERDE_DEEP[k] - VERDE_BRIGHT[k]) * u for k in range(3)]
    else:
        u = (t - 0.5) / 0.5
        base = [VERDE_DEEP[k] + (VERDE_ABYSS[k] - VERDE_DEEP[k]) * u for k in range(3)]

    def suave(d):
        v = min(1.0, max(0.0, d / FONDO_VINETA))
        return v * v * (3 - 2 * v)

    v = suave(min(x, 1 - x)) * suave(min(y, 1 - y))
    return tuple(VERDE_ABYSS[k] + (base[k] - VERDE_ABYSS[k]) * v for k in range(3))


def imagen_fondo(ancho=1280, alto=720):
    """Hornea el degradado en una imagen flotante EN LINEAL, sin pasar por disco.

    Va en `Non-Color` y con búfer flotante a propósito: así los valores que se
    calculan aquí son exactamente los que llegan al sombreador, sin una segunda
    conversión de espacio de color por el camino ni cuantización a 8 bits en un
    degradado, que es donde el bandeado se vería.
    """
    import numpy as np
    x = (np.arange(ancho) + 0.5) / ancho
    y = (np.arange(alto) + 0.5) / alto
    X, Y = np.meshgrid(x, y)
    Yc = 1.0 - Y
    t = np.clip(np.hypot((X - FONDO_CX) / FONDO_RX, (Yc - FONDO_CY) / FONDO_RY), 0.0, 1.0)
    bri = np.array(VERDE_BRIGHT, dtype=np.float64)
    dee = np.array(VERDE_DEEP, dtype=np.float64)
    aby = np.array(VERDE_ABYSS, dtype=np.float64)
    u1 = np.clip(t / 0.5, 0.0, 1.0)[..., None]
    u2 = np.clip((t - 0.5) / 0.5, 0.0, 1.0)[..., None]
    tramo1 = bri + (dee - bri) * u1
    tramo2 = dee + (aby - dee) * u2
    base = np.where((t <= 0.5)[..., None], tramo1, tramo2)

    def suave(d):
        v = np.clip(d / FONDO_VINETA, 0.0, 1.0)
        return v * v * (3 - 2 * v)

    v = (suave(np.minimum(X, 1 - X)) * suave(np.minimum(Y, 1 - Y)))[..., None]
    srgb = (aby + (base - aby) * v) / 255.0
    lin = np.where(srgb <= 0.04045, srgb / 12.92, ((srgb + 0.055) / 1.055) ** 2.4)
    rgba = np.concatenate([lin, np.ones_like(lin[..., :1])], axis=2)
    img = bpy.data.images.new('FondoPortada', ancho, alto, float_buffer=True)
    img.colorspace_settings.name = 'Non-Color'
    img.pixels.foreach_set(rgba.ravel().astype('f4'))
    return img


def suelo_fondo(ganancia=(1.0, 1.0, 1.0)):
    """El fondo OPACO horneado (decisión 3), sobre un plano que llena el cuadro.

    Tres cosas que este material hace a propósito:

    · **Coordenada `Window`.** El degradado es del CUADRO, no del suelo: así la
      viñeta muere en los cuatro BORDES DE LA IMAGEN, que es lo que la decisión 3
      pide, y no en un anillo del plano que la perspectiva deformaría.
    · **Especular a cero.** El suelo de fábrica traía el 0,5 de serie del
      Principled, y MIDIÓ: sobre un verde casi negro ese brillo dieléctrico se
      comía el color y el fondo salía gris cálido (#363529 en el encuadre
      sellado), no verde. Sin especular, el fondo es su albedo y nada más.
    · **Ganancia por canal, no escalar.** La clave de 3200 K multiplica G por
      0,776 y B por 0,549; una ganancia única dejaría el verde virado a cálido y
      la costura se vería en el TONO. Tres ganancias lo clavan, y como los tres
      topes de la rampa comparten tono (H 141-142°), clavar uno los clava todos.
      La ganancia es lineal, así que **no toca el contraste de las sombras**: el
      cociente entre zona iluminada y zona en sombra se conserva intacto.
    """
    bpy.ops.mesh.primitive_plane_add(size=40.0, location=(0, 0, -GROSOR / 2 * U))
    s = bpy.context.active_object
    s.name = 'FondoPortada'
    m = bpy.data.materials.new('FondoRampaVerde')
    m.use_nodes = True
    nt = m.node_tree
    p = nt.nodes['Principled BSDF']
    p.inputs['Roughness'].default_value = 1.0
    for nombre in ('Specular IOR Level', 'Specular'):
        if nombre in p.inputs:
            p.inputs[nombre].default_value = 0.0
    coord = nt.nodes.new('ShaderNodeTexCoord')
    tex = nt.nodes.new('ShaderNodeTexImage')
    tex.image = imagen_fondo()
    tex.extension = 'EXTEND'
    tex.interpolation = 'Linear'
    mul = nt.nodes.new('ShaderNodeVectorMath')     # Vector Math: NO recorta a 1
    mul.operation = 'MULTIPLY'
    mul.inputs[1].default_value = ganancia
    nt.links.new(coord.outputs['Window'], tex.inputs['Vector'])
    nt.links.new(tex.outputs['Color'], mul.inputs[0])
    nt.links.new(mul.outputs['Vector'], p.inputs['Base Color'])
    s.data.materials.append(m)
    return s, mul


# ── Claves de animación ─────────────────────────────────────────────────────
def _curvas(ob):
    """Las F-curves del objeto, con las dos APIs.

    Blender 4.4 metió capas y ranuras en las acciones y `action.fcurves` quedó
    como accesorio heredado. Se prueban las dos para que el script no dependa de
    en qué punto de la 4.x está la máquina.
    """
    ad = ob.animation_data
    if not ad or not ad.action:
        return []
    act = ad.action
    fcs = list(getattr(act, 'fcurves', []))
    if fcs:
        return fcs
    for lay in getattr(act, 'layers', []):
        for st in lay.strips:
            for cb in getattr(st, 'channelbags', []):
                fcs.extend(cb.fcurves)
    return fcs


def _perfilar(ob, ruta, f, interp, easing):
    for fc in _curvas(ob):
        if fc.data_path != ruta:
            continue
        for kp in fc.keyframe_points:
            if abs(kp.co.x - f) < 1e-4:
                kp.interpolation = interp
                if easing:
                    kp.easing = easing


def clave(ob, ruta, valor, f, interp='BEZIER', easing='AUTO'):
    """Pone una clave y le da su curva. `EASE_IN` sobre `QUAD` es la caída libre.

    En Blender la curva de un tramo la manda la clave que lo ABRE, así que la
    aceleración de una caída se pide en la clave de salida, no en la de llegada.
    """
    setattr(ob, ruta, valor)
    ob.keyframe_insert(ruta, frame=f)
    _perfilar(ob, ruta, f, interp, easing)


def fotogramas_caida(z_salida, z_llegada):
    """Los fotogramas que tarda en caer, con la gravedad de la escena."""
    return math.sqrt(2.0 * max(0.0, z_salida - z_llegada) / G_ESCENA) * FPS


def moneda_copia(base, nombre):
    """Una moneda más, compartiendo la MALLA y con sus propios modificadores.

    Ocho objetos, una sola malla de 7 981 polígonos: la memoria no se multiplica
    por ocho y, sobre todo, las ocho monedas son la MISMA moneda — no hay forma
    de que una salga con un relieve distinto del que Victor selló.
    """
    ob = base.copy()
    ob.name = nombre
    ob.animation_data_clear()      # la copia no hereda las claves del original
    bpy.context.collection.objects.link(ob)
    return ob


def animar_pila(base):
    """Las siete que caen y se apilan · tramo A, impactos 12·19·26·32·39·45·52."""
    monedas = []
    grosor = GROSOR * U
    for k, f_imp in enumerate(IMPACTOS_A):
        ob = base if k == 0 else moneda_copia(base, 'Heptacoin%d' % (k + 1))
        z_fin = grosor * k
        # La desalineación alternada de la ficha: ~2 u a un lado y al otro, con
        # la dirección repartida para que la pila no se lea como una escalera.
        ang = math.radians(37.0 * k)
        signo = 1.0 if k % 2 == 0 else -1.0
        x = PILA_XY[0] + DESALINEA * signo * math.cos(ang)
        y = PILA_XY[1] + DESALINEA * signo * math.sin(ang)
        f_ini = f_imp - fotogramas_caida(Z_SALIDA, z_fin)

        ob.location = (x, y, Z_SALIDA)
        clave(ob, 'location', (x, y, Z_SALIDA), 0, 'CONSTANT')
        clave(ob, 'location', (x, y, Z_SALIDA), f_ini, 'QUAD', 'EASE_IN')
        clave(ob, 'location', (x, y, z_fin), f_imp, 'CONSTANT')

        # El giro leve que se FRENA al contacto, más 1,2° de residuo en los tres
        # fotogramas siguientes: el asentamiento corto que pide la Fase 0, hecho
        # con la rotación y no con un hundimiento, porque el aplastamiento está
        # prohibido por la decisión 1.
        rz_fin = math.radians(23.0 * k)
        rz_ini = rz_fin - math.radians(46.0)
        rx_ini = math.radians(6.0) * signo
        ob.rotation_euler = (rx_ini, 0.0, rz_ini)
        clave(ob, 'rotation_euler', (rx_ini, 0.0, rz_ini), 0, 'CONSTANT')
        clave(ob, 'rotation_euler', (rx_ini, 0.0, rz_ini), f_ini, 'QUAD', 'EASE_OUT')
        clave(ob, 'rotation_euler', (0.0, 0.0, rz_fin), f_imp, 'QUAD', 'EASE_OUT')
        clave(ob, 'rotation_euler', (0.0, 0.0, rz_fin + math.radians(1.2) * signo),
              f_imp + 3, 'CONSTANT')
        monedas.append(ob)
    return monedas


def _mismo_hemisferio(q, referencia):
    """Cuaterniones: q y -q son la MISMA rotacion, pero no el mismo camino.

    Blender interpola los cuatro canales por separado, asi que si dos claves
    consecutivas caen en hemisferios opuestos de la 4-esfera el arco que recorre
    es el largo: un vuelco de 90 grados se convierte en una vuelta de 270 por el
    otro lado. Se fuerza el signo antes de poner la clave.
    """
    if q.dot(referencia) < 0.0:
        return Quaternion((-q.w, -q.x, -q.y, -q.z))
    return q


def animar_heroe(base):
    """La héroe · tramo C, con el delta del vuelo sellado el 31-ago.

    CAE EN VERTICAL Y SE VUELCA. El guion v2 escribió «de cara» al eliminar el
    bamboleo, pero lo vetado era la OSCILACIÓN, no la caída vertical de la visión
    original. Aquí la moneda entra de canto —con las estrías dando a cámara—,
    toca de canto en el 72, rebota corto y firme, vuelve a tocar de canto en el
    80 y se vuelca de una sola vez hasta quedar plana con el anverso arriba en el
    87. Sin bamboleo. Sin aplastamiento.

    **El vuelco es UNA rotación, y por eso va en cuaterniones.** Con ángulos de
    Euler, «girar 90° sobre un eje horizontal cualquiera y acabar exactamente en
    la orientación de reposo» obliga a mover dos o tres canales a la vez, y lo
    que se ve entonces no es un vuelco sino un contoneo: cada canal llega a su
    destino por su cuenta. Con un cuaternión hay un solo arco.

    **Y el reposo se calcula hacia atrás, no hacia delante.** La orientación y la
    posición del fotograma 87 tienen que ser las MISMAS de antes del delta, para
    que el tramo D (90–134) siga siendo bit-idéntico y no haya que re-renderizar
    45 fotogramas que nadie ha tocado. Así que se fija el reposo y se despeja la
    postura de canto:  q_canto = q_vuelco⁻¹ · q_reposo.

    **La inclinación del canto es un compromiso medido, y conviene decirlo.** El
    delta pide dos cosas que la geometría no concede a la vez: que las estrías se
    lean a cámara (la normal de la cara perpendicular a la visual) y que el
    vuelco venga HACIA la cámara (la normal apuntando en contra de la cámara, que
    es lo que hace que la moneda caiga hacia el espectador). Son los dos extremos
    de un mismo dial. Se elige **55°**: el vuelco conserva un 57 % de componente
    hacia cámara y la cara queda escorzada a ese mismo 57 %, con el canto
    recorriendo toda la silueta. De canto puro —la moneda como una rendija de
    0,10 u— las estrías se leerían PEOR, no mejor.
    """
    ob = moneda_copia(base, 'HeptacoinHeroe')
    ob.rotation_mode = 'QUATERNION'
    x, y = HEROE_XY
    radio = R_FILETE_EXT * U

    # La normal de la cara mientras está de canto, y el eje del vuelco.
    espejo = Vector((-math.sin(AZIMUT), math.cos(AZIMUT), 0.0))    # se aleja de cámara
    derecha = Vector((math.cos(AZIMUT), math.sin(AZIMUT), 0.0))    # a la derecha de cuadro
    n0 = (espejo * math.cos(BETA_CANTO) + derecha * math.sin(BETA_CANTO)).normalized()
    eje = Vector((0.0, 0.0, 1.0)).cross(n0).normalized()

    q_vuelco = Quaternion(eje, -math.pi / 2.0)      # lleva n0 hasta +Z
    q_reposo = Euler((0.0, 0.0, RZ_HEROE)).to_quaternion()
    q_canto = q_vuelco.inverted() @ q_reposo
    # El giro de rueda es sobre el propio eje de la moneda, así que se compone
    # por la DERECHA: es una rotación local, no una del mundo.
    q_entrada = q_canto @ Quaternion(Vector((0.0, 0.0, 1.0)), GIRO_RUEDA)
    q_canto = _mismo_hemisferio(q_canto, q_entrada)
    q_reposo = _mismo_hemisferio(q_reposo, q_canto)

    # De canto, el centro vive a un radio del suelo; y al volcarse, el centro se
    # desplaza un radio en la dirección de la caída (−n0). Como el reposo está
    # fijado, la postura de canto se coloca un radio ANTES.
    z_canto = -GROSOR / 2 * U + radio
    sx, sy = x + radio * n0.x, y + radio * n0.y

    clave(ob, 'location', (sx, sy, Z_HEROE_SALIDA), 0, 'CONSTANT')
    clave(ob, 'location', (sx, sy, Z_HEROE_SALIDA), F_ENTRA, 'QUAD', 'EASE_IN')
    clave(ob, 'location', (sx, sy, z_canto), F_CONTACTO, 'QUAD', 'EASE_OUT')
    clave(ob, 'location', (sx, sy, z_canto + ALTURA_REBOTE_CANTO), F_APICE,
          'QUAD', 'EASE_IN')
    clave(ob, 'location', (sx, sy, z_canto), F_CONTACTO2, 'QUAD', 'EASE_OUT')
    clave(ob, 'location', (x, y, 0.0), F_REPOSO, 'CONSTANT')

    clave(ob, 'rotation_quaternion', q_entrada, 0, 'CONSTANT')
    clave(ob, 'rotation_quaternion', q_entrada, F_ENTRA, 'QUAD', 'EASE_OUT')
    clave(ob, 'rotation_quaternion', q_canto, F_FRENO, 'CONSTANT')
    clave(ob, 'rotation_quaternion', q_canto, F_CONTACTO2, 'QUAD', 'EASE_OUT')
    clave(ob, 'rotation_quaternion', q_reposo, F_REPOSO, 'CONSTANT')

    print('HEROE :: canto n0=(%.3f, %.3f) beta=%.0f° :: eje del vuelco=(%.3f, %.3f) :: '
          'hacia cámara=%.0f%% :: entrada %.2f -> canto %.2f en %d fotogramas (g=%.1f u/s²)'
          % (n0.x, n0.y, math.degrees(BETA_CANTO), eje.x, eje.y,
             100 * math.cos(BETA_CANTO), Z_HEROE_SALIDA, z_canto,
             F_CONTACTO - F_ENTRA,
             2 * (Z_HEROE_SALIDA - z_canto) / ((F_CONTACTO - F_ENTRA) / FPS) ** 2))
    return ob, Z_HEROE_SALIDA


def barrido_especular():
    """El rectángulo emisivo del tramo D · invisible para la cámara.

    Va colocado en la dirección del ESPEJO, no encima. Un reflejo se ve donde la
    ley de la reflexión dice: con la cámara a 24° de elevación y azimut 20°, la
    imagen especular de la cara plana de la héroe llega desde el azimut opuesto,
    y un rectángulo puesto justo encima no se vería en el metal. Por eso el
    barrido viaja desplazado hacia el lado contrario a la cámara.

    Y no ilumina: sólo se refleja. Sin contribución difusa y sin sombras, lo
    único que hace es aparecer en el especular del oro — que es la definición de
    un barrido especular y no de una luz nueva.
    """
    cx, cy = HEROE_XY
    espejo = Vector((-math.sin(AZIMUT), math.cos(AZIMUT), 0.0))
    centro = Vector((cx, cy, 0.0)) + espejo * 0.42 + Vector((0, 0, BARRIDO_ALTO))
    derecha = Vector((math.cos(AZIMUT), math.sin(AZIMUT), 0.0))

    bpy.ops.mesh.primitive_plane_add(size=1.0, location=centro)
    tira = bpy.context.active_object
    tira.name = 'BarridoEspecular'
    tira.scale = (BARRIDO_ANCHO, BARRIDO_LARGO, 1.0)
    tira.rotation_euler = (0.0, 0.0, AZIMUT + BARRIDO_SESGO)

    m = bpy.data.materials.new('BarridoEmisor')
    m.use_nodes = True
    nt = m.node_tree
    for n in list(nt.nodes):
        if n.type != 'OUTPUT_MATERIAL':
            nt.nodes.remove(n)
    em = nt.nodes.new('ShaderNodeEmission')
    em.inputs['Color'].default_value = COLOR_LUZ + (1.0,)
    em.inputs['Strength'].default_value = BARRIDO_FUERZA
    nt.links.new(em.outputs['Emission'], nt.nodes['Material Output'].inputs['Surface'])
    tira.data.materials.append(m)

    tira.visible_camera = False
    tira.visible_diffuse = False
    tira.visible_shadow = False

    f0, f1 = F_BARRIDO
    p0 = centro - derecha * BARRIDO_VIAJE
    p1 = centro + derecha * BARRIDO_VIAJE
    clave(tira, 'location', p0, 0, 'CONSTANT')
    clave(tira, 'location', p0, f0, 'SINE', 'EASE_IN_OUT')
    clave(tira, 'location', p1, f1, 'CONSTANT')
    return tira


# ════════════════════════════════════════════════════════════════════════════
# EL MONTAJE DE LA ESCENA DEL VIDEO
# ════════════════════════════════════════════════════════════════════════════
def enlazar_contorno(rim, monedas):
    """El contorno alumbra las MONEDAS, no el fondo. Y hubo que medirlo.

    El primer montaje del fondo verde sacó una **costura recta** cruzando el
    suelo por la derecha del cuadro. Se aisló apagando lámpara por lámpara: es el
    contorno. Vive a 0,55 u sobre el suelo, y una lámpara de área es de una sola
    cara — su iluminación se corta en seco en el plano de la propia lámpara, y
    ese corte, sobre un suelo negro, no se veía; sobre el verde de la portada, sí.

    La corrección no toca ni la posición ni la potencia ni el color: usa el
    ENLACE DE LUZ para que el contorno sólo alcance a las ocho monedas. Es
    exactamente para lo que la decisión 8 lo puso —«no es un segundo oro, sólo
    separa la silueta del vacío»—, así que restringirlo a las siluetas no es una
    licencia: es escribir en el motor lo que la decisión ya decía en palabras.
    El oro no cambia en un solo píxel; lo que desaparece es la costura.
    """
    if not hasattr(rim, 'light_linking'):
        print('CONTORNO :: esta build no expone enlace de luz — costura declarada')
        return None
    col = bpy.data.collections.new('ContornoSoloMonedas')
    for ob in monedas:
        col.objects.link(ob)
    rim.light_linking.receiver_collection = col
    print('CONTORNO :: enlazado a %d monedas — el fondo deja de recibirlo' % len(monedas))
    return col


def escena_video(muestras=MUESTRAS_LOTE, ancho=1280, alto=720):
    s = escena_render(ancho=ancho, alto=alto, muestras=muestras)
    s.render.fps = FPS
    s.frame_start = 0
    s.frame_end = F_FIN
    # Desenfoque de movimiento SUTIL. El obturador va a 0,40 de fotograma: lo
    # justo para que la caída y el rebote tengan arrastre y para que los cinco
    # elementos del relieve sigan leyéndose. En los tramos B y D no se mueve
    # nada, así que no cuesta nitidez donde importa.
    s.render.use_motion_blur = True
    s.render.motion_blur_shutter = OBTURADOR
    return s


def montar_escena(energia, ganancia_fondo=(1.0, 1.0, 1.0)):
    limpiar()
    t0 = time.perf_counter()
    base = construir_moneda()
    monedas = animar_pila(base)
    heroe, z_heroe = animar_heroe(base)
    t_geo = time.perf_counter() - t0
    print('GEO :: %d polígonos × 8 monedas (una sola malla) :: %.2f s'
          % (len(base.data.polygons), t_geo))

    piso, mul = suelo_fondo(ganancia_fondo)
    mundo_vacio()
    cam, d = camara(ELEVACION, LLENADO_VIDEO, DIANA_Z)
    key, rim = luces(energia)
    enlazar_contorno(rim, monedas + [heroe])
    tira = barrido_especular()
    print('CAM :: video distancia=%.3f :: elevación=%.0f° :: azimut=%.0f° :: '
          'lente=%.0fmm :: ancho de cuadro=%.2f u :: diana z=%.2f'
          % (d, math.degrees(ELEVACION), math.degrees(AZIMUT), LENTE,
             ANCHO_CUADRO, DIANA_Z))
    return {'monedas': monedas, 'heroe': heroe, 'z_heroe': z_heroe, 'piso': piso,
            'mul': mul, 'cam': cam, 'tira': tira, 'key': key}


# ── La banda segura 16:7 (decisión 9) ───────────────────────────────────────
BANDA_Y0 = 0.5 - 7.0 / 18.0        # 0,1111
BANDA_Y1 = 0.5 + 7.0 / 18.0        # 0,8889


def _puntos_canto(n=48):
    """El CANTO de la moneda en coordenadas locales, no su caja envolvente.

    La caja de una moneda es un ladrillo, y sus esquinas caen a r·raiz(2) del
    centro: fuera del disco. Midiendo con ella, el reposo salia 'fuera de banda'
    por una esquina que no existe. El canto son los puntos que de verdad forman
    la silueta, se mire desde donde se mire.
    """
    r = R_FILETE_EXT * U
    h = GROSOR / 2 * U
    ps = []
    for k in range(n):
        a = 2 * math.pi * k / n
        for z in (h, -h):
            ps.append(Vector((r * math.cos(a), r * math.sin(a), z)))
    return ps


def revisar_banda(esc):
    """Proyecta los extremos de la composicion y los mide contra la banda 16:7.

    No se comprueba a ojo: cada punto pasa por la misma matriz que usa el render
    y se imprime su coordenada de cuadro. Si la portada recorta a 16:7 con
    `object-fit: cover`, lo que este fuera de [0,111 - 0,889] se pierde.

    La heroe se mide **fotograma a fotograma sobre su caja real**, no con puntos
    calculados a mano. Desde el delta del vuelo su orientacion cambia durante el
    tramo, y de canto la moneda mide 0,94 u de alto donde plana medía 0,10: la
    unica medicion honesta es la que evalua la animacion.

    Los fotogramas de ENTRADA quedan fuera del examen a proposito: una moneda que
    entra por arriba esta cortada por definicion, que es lo que es entrar.
    """
    from bpy_extras.object_utils import world_to_camera_view
    s = bpy.context.scene
    r = R_FILETE_EXT * U
    grosor = GROSOR * U
    puntos = []
    for k in range(len(IMPACTOS_A)):
        z = grosor * k
        ang = math.radians(37.0 * k)
        signo = 1.0 if k % 2 == 0 else -1.0
        x = PILA_XY[0] + DESALINEA * signo * math.cos(ang)
        y = PILA_XY[1] + DESALINEA * signo * math.sin(ang)
        for dx, dy in ((0, r), (0, -r), (r, 0), (-r, 0)):
            puntos.append(('pila-%d' % (k + 1), Vector((x + dx, y + dy, z + grosor / 2))))

    s.frame_set(F_FIN)
    y0, y1, x0, x1 = 1e9, -1e9, 1e9, -1e9
    fuera = []
    for etiqueta, p in puntos:
        uv = world_to_camera_view(s, s.camera, p)
        y0, y1 = min(y0, uv.y), max(y1, uv.y)
        x0, x1 = min(x0, uv.x), max(x1, uv.x)
        if uv.y < BANDA_Y0 or uv.y > BANDA_Y1:
            fuera.append((etiqueta, uv.y))
    print('BANDA :: pila  x=[%.3f..%.3f]  y=[%.3f..%.3f]  banda 16:7=[%.3f..%.3f]'
          % (x0, x1, y0, y1, BANDA_Y0, BANDA_Y1))

    heroe = esc['heroe']
    for f, etiqueta in ((F_ENTRA, 'entra   '), (F_CONTACTO, 'contacto'),
                        (F_APICE, 'apice   '), (F_CONTACTO2, 'rebote  '),
                        ((F_CONTACTO2 + F_REPOSO) // 2, 'vuelco  '),
                        (F_REPOSO, 'reposo  ')):
        s.frame_set(f)
        m = heroe.matrix_world
        hy0, hy1, hx0, hx1 = 1e9, -1e9, 1e9, -1e9
        for c in _puntos_canto():
            uv = world_to_camera_view(s, s.camera, m @ c)
            hy0, hy1 = min(hy0, uv.y), max(hy1, uv.y)
            hx0, hx1 = min(hx0, uv.x), max(hx1, uv.x)
        if f == F_ENTRA:
            estado = 'FUERA DE CUADRO' if hy0 > 1.0 else 'ASOMA EN CUADRO'
        elif hy0 < BANDA_Y0 or hy1 > BANDA_Y1:
            estado = 'FUERA DE BANDA'
            fuera.append((etiqueta.strip(), hy1))
        else:
            estado = 'dentro'
        print('BANDA :: heroe f%03d %s x=[%.3f..%.3f]  y=[%.3f..%.3f]  -> %s'
              % (f, etiqueta, hx0, hx1, hy0, hy1, estado))
    s.frame_set(F_FIN)
    print('BANDA :: veredicto = %s' % ('DENTRO' if not fuera else
          'FUERA en ' + ', '.join('%s(y=%.3f)' % t for t in fuera)))
    return not fuera, (x0, x1, y0, y1)


# ── Calibraciones ───────────────────────────────────────────────────────────
def leer_pixel_pantalla(ruta, uv, radio=3):
    """El píxel de una coordenada de CUADRO (0..1), no de mundo."""
    img = bpy.data.images.load(str(ruta), check_existing=False)
    img.colorspace_settings.name = 'Non-Color'
    w, h = img.size
    px = list(img.pixels)
    cx = min(max(int(uv[0] * w), radio), w - radio - 1)
    cy = min(max(int(uv[1] * h), radio), h - radio - 1)
    acc = [0.0, 0.0, 0.0]
    n = 0
    for dy in range(-radio, radio + 1):
        for dx in range(-radio, radio + 1):
            i = ((cy + dy) * w + (cx + dx)) * 4
            for k in range(3):
                acc[k] += px[i + k]
            n += 1
    bpy.data.images.remove(img)
    return tuple(round(acc[k] / n * 255) for k in range(3))


def calibrar_oro_sellado():
    """Reproduce EXACTAMENTE las condiciones del retrato que Victor selló.

    La calibración no se hace sobre la escena del video, y es deliberado: allí la
    héroe reposa a 0,67 u del eje de la clave y el fondo ya no es el mismo, así
    que la bisección devolvería otra potencia y el material dejaría de ser el que
    pasó la compuerta. Se calibra donde se selló —una moneda en el origen, cámara
    a 55°, suelo original— y esa potencia se lleva tal cual al video.
    """
    limpiar()
    construir_moneda()
    suelo()
    mundo_vacio()
    cam, d = camara(ELEVACION_RETRATO)
    key, rim = luces()
    mejor = calibrar_oro(key)
    return mejor[0], mejor[1]


def calibrar_fondo(esc, muestras=64):
    """Una sola medición basta: la respuesta difusa es LINEAL en el albedo.

    Se rinde el fondo SIN monedas —así ningún reflejo ni sombra contamina la
    lectura— y se compara el píxel del centro de la elipse contra el color que la
    portada pinta en ese mismo punto. El cociente, canal a canal, es la ganancia.
    Después se vuelve a rendir para verificar que el ajuste cayó donde se dijo:
    una calibración que no se comprueba es una intención.
    """
    ocultos = list(esc['monedas']) + [esc['heroe'], esc['tira']]
    for o in ocultos:
        o.hide_render = True
    s = escena_video(muestras=muestras, ancho=640, alto=360)
    s.frame_set(F_FIN)
    ruta = RAIZ / '_calib' / 'fondo.png'
    s.render.filepath = str(ruta.with_suffix(''))
    bpy.ops.render.render(write_still=True)
    medido = leer_pixel_pantalla(ruta, FONDO_SONDA)
    objetivo = fondo_srgb(*FONDO_SONDA)

    gan = []
    for k in range(3):
        m = srgb_a_lineal(medido[k] / 255.0)
        o = srgb_a_lineal(objetivo[k] / 255.0)
        gan.append(min(2000.0, max(0.02, o / m)) if m > 1e-7 else 1.0)
    gan = tuple(gan)
    esc['mul'].inputs[1].default_value = gan
    print('FONDO :: sonda(0,1,1)=%s  objetivo=%s  ganancia=(%.2f, %.2f, %.2f)'
          % (hexa(medido), hexa(tuple(round(c) for c in objetivo)), *gan))

    bpy.ops.render.render(write_still=True)
    ver = leer_pixel_pantalla(ruta, FONDO_SONDA)
    print('FONDO :: verificado=%s  objetivo=%s  d=(%+d, %+d, %+d)'
          % (hexa(ver), hexa(tuple(round(c) for c in objetivo)),
             *[ver[k] - round(objetivo[k]) for k in range(3)]))

    # Los cuatro bordes: es donde la costura con la portada se vería, así que es
    # donde el número tiene que estar. La viñeta los fuerza a --green-abyss.
    for etiqueta, uv in (('borde sup', (0.50, 0.985)), ('borde inf', (0.50, 0.015)),
                         ('borde izq', (0.012, 0.50)), ('borde der', (0.988, 0.50))):
        rgb = leer_pixel_pantalla(ruta, uv, radio=2)
        print('FONDO :: %s = %s  contra --green-abyss #09170e' % (etiqueta, hexa(rgb)))

    for o in ocultos:
        o.hide_render = False
    return gan, ver


def sonda_barrido(esc, cuadros=(87, 100, 112, 124, 134), muestras=48):
    """Mide el barrido antes de comprometer el lote: ¿se ve, y no revienta?"""
    s = escena_video(muestras=muestras, ancho=640, alto=360)
    ruta = RAIZ / '_calib' / 'barrido.png'
    s.render.filepath = str(ruta.with_suffix(''))
    from bpy_extras.object_utils import world_to_camera_view
    campo = punto_campo()
    for f in cuadros:
        s.frame_set(f)
        t0 = time.perf_counter()
        bpy.ops.render.render(write_still=True)
        dt = time.perf_counter() - t0
        # La cara de la héroe: el punto de campo, trasladado a donde reposa.
        p = Vector((campo.x + HEROE_XY[0], campo.y + HEROE_XY[1], campo.z))
        uv = world_to_camera_view(s, s.camera, p)
        rgb = leer_pixel_pantalla(ruta, (uv.x, uv.y), radio=2)
        print('SONDA :: f%03d  %.1f s  campo de la héroe=%s %s' % (f, dt, hexa(rgb), rgb))
    return None


# ════════════════════════════════════════════════════════════════════════════
# EL LOTE, LA HOJA DE TIEMPOS Y LA CODIFICACIÓN
# ════════════════════════════════════════════════════════════════════════════
DIR_PNG = 'png'
TECHOS = {'heptacoin-720.mp4': 1.2 * 1024 * 1024,
          'heptacoin-720.webm': 0.9 * 1024 * 1024,
          'heptacoin-poster.webp': 60 * 1024}


def escribir_tiempos():
    """La hoja de impactos, escrita POR EL SCRIPT.

    Se genera desde las mismas constantes que animan, así que no puede
    desincronizarse de lo que se ve. Y va con `mudo: true` porque la decisión 10
    lo sella: el video no lleva audio y la portada no dispara clinks. La hoja se
    entrega igual, como insumo de archivo — el día que alguien quiera sonorizar
    la escena, los nueve fotogramas ya están medidos.
    """
    imp = []
    for k, f in enumerate(IMPACTOS_A):
        imp.append({'id': 'moneda-%d' % (k + 1), 'frame': f, 't': round(f / FPS, 4),
                    'tramo': 'A', 'sonido_sugerido': 'coinBet', 'volumen': 1.0})
    imp.append({'id': 'contacto-canto', 'frame': F_CONTACTO,
                't': round(F_CONTACTO / FPS, 4), 'tramo': 'C',
                'sonido_sugerido': 'chipsCollect', 'volumen': 1.0})
    imp.append({'id': 'rebote-canto', 'frame': F_CONTACTO2,
                't': round(F_CONTACTO2 / FPS, 4), 'tramo': 'C',
                'sonido_sugerido': 'coinBet', 'volumen': 0.6})
    datos = {
        'version': '2.0',
        'guion': 'v2 + delta del vuelo — siete monedas; la héroe cae en vertical, toca de canto, rebota y se vuelca 90 grados. Sin bamboleo.',
        'fps': FPS,
        'frames': F_FIN + 1,
        'duracion_s': round((F_FIN + 1) / FPS, 4),
        'mudo': True,
        'nota_mudo': ('Decisión 10 de la ficha de Fase 1: las escenas son mudas. '
                      'Esta hoja es insumo de archivo, no un disparador.'),
        'bucle': False,
        'congela_en': F_FIN,
        'poster_frame': F_FIN,
        'impactos': imp,
        'vuelco': {
            'frame_ini': F_CONTACTO2, 'frame_fin': F_REPOSO,
            't_ini': round(F_CONTACTO2 / FPS, 4), 't_fin': round(F_REPOSO / FPS, 4),
            'grados': 90, 'ejes': 1,
            'nota': ('Una sola rotacion de 90 grados sobre un eje horizontal, con '
                     'ease-out y sin oscilacion. No es un impacto: no suena.'),
        },
        'tramos': [
            {'id': 'A', 'frame_ini': 0, 'frame_fin': 56, 'nombre': 'siete caen y se apilan'},
            {'id': 'B', 'frame_ini': F_PAUSA[0], 'frame_fin': F_PAUSA[1], 'nombre': 'latido de pausa'},
            {'id': 'C', 'frame_ini': F_ENTRA, 'frame_fin': F_REPOSO,
             'nombre': 'la héroe cae en vertical, toca de canto y se vuelca'},
            {'id': 'D', 'frame_ini': F_BARRIDO[0], 'frame_fin': F_BARRIDO[1], 'nombre': 'barrido especular'},
        ],
        'reposo_s': round(F_REPOSO / FPS, 4),
    }
    ruta = RAIZ / 'tiempos.json'
    ruta.write_text(json.dumps(datos, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print('TIEMPOS :: %s :: %d impactos' % (ruta.name, len(imp)))
    return datos


def lote(esc, rango=None):
    """El lote, entero o por tramo.

    El rango existe para los deltas: cuando sólo cambia el tramo C, re-renderizar
    los 135 sería tirar 24 minutos y —peor— arriesgarse a que un fotograma que
    nadie tocó salga distinto. Los que no entran en el rango se quedan en disco
    tal como estaban. Cycles es determinista con la semilla fija, así que los
    nuevos empalman con los viejos sin costura.
    """
    s = escena_video()
    ini, fin = rango if rango else (0, F_FIN)
    s.frame_start, s.frame_end = ini, fin
    d = RAIZ / 'render' / DIR_PNG
    d.mkdir(parents=True, exist_ok=True)
    s.render.filepath = str(d / 'f')
    print('LOTE :: fotogramas %d–%d (%d) :: %d muestras :: obturador %.2f' %
          (ini, fin, fin - ini + 1, MUESTRAS_LOTE, OBTURADOR))
    t0 = time.perf_counter()
    bpy.ops.render.render(animation=True)
    dt = time.perf_counter() - t0
    n = len(list(d.glob('f*.png')))
    print('LOTE :: %d PNG escritos en %.1f min (%.2f s/fotograma)'
          % (n, dt / 60.0, dt / max(1, n)))
    return n, dt


# ── qt-faststart, en Python puro ────────────────────────────────────────────
CONTENEDORES = {b'moov', b'trak', b'mdia', b'minf', b'stbl', b'edts', b'dinf',
                b'udta', b'mvex', b'moof', b'traf'}


def _atomos(datos, ini, fin):
    i = ini
    while i + 8 <= fin:
        tam = int.from_bytes(datos[i:i + 4], 'big')
        tipo = bytes(datos[i + 4:i + 8])   # bytes, no bytearray: se compara en un set
        cab = 8
        if tam == 1:
            tam = int.from_bytes(datos[i + 8:i + 16], 'big')
            cab = 16
        elif tam == 0:
            tam = fin - i
        if tam < cab or i + tam > fin:
            break
        yield tipo, i, tam, cab
        i += tam


def _desplazar_offsets(buf, ini, fin, delta):
    """Suma `delta` a cada offset de trozo, bajando por los contenedores.

    Se recorre el árbol de verdad en vez de buscar la firma `stco` a pelo por el
    búfer: cuatro bytes cualesquiera de una tabla pueden deletrear `stco`, y
    parchear un número que no era un offset rompe el archivo de una forma que
    sólo se ve al reproducirlo.
    """
    n = 0
    for tipo, off, tam, cab in _atomos(buf, ini, fin):
        if tipo in CONTENEDORES:
            n += _desplazar_offsets(buf, off + cab, off + tam, delta)
        elif tipo in (b'stco', b'co64'):
            p = off + cab + 4                      # versión + banderas
            cuenta = int.from_bytes(buf[p:p + 4], 'big')
            p += 4
            ancho = 4 if tipo == b'stco' else 8
            for _ in range(cuenta):
                v = int.from_bytes(buf[p:p + ancho], 'big') + delta
                buf[p:p + ancho] = v.to_bytes(ancho, 'big')
                p += ancho
            n += cuenta
    return n


def faststart(ruta):
    """Sube el átomo `moov` al principio del MP4.

    El muxer de FFmpeg escribe el índice al FINAL, y un navegador que recibe ese
    archivo por HTTP no puede empezar a reproducir hasta haberlo descargado
    entero. La ficha pide `+faststart` y Blender no expone esa bandera, así que
    la reubicación se hace aquí: es una transformación cerrada —mover el átomo y
    sumarle su tamaño a cada offset de trozo— y se verifica releyendo el archivo.
    """
    datos = bytearray(ruta.read_bytes())
    top = list(_atomos(datos, 0, len(datos)))
    tipos = [t for t, _, _, _ in top]
    if b'moov' not in tipos or b'mdat' not in tipos:
        print('FASTSTART :: no hay moov/mdat reconocibles — se deja como está')
        return False, tipos
    i_moov = tipos.index(b'moov')
    i_mdat = tipos.index(b'mdat')
    if i_moov < i_mdat:
        print('FASTSTART :: moov ya venía delante — nada que hacer')
        return True, tipos
    _, off, tam, _ = top[i_moov]
    moov = bytearray(datos[off:off + tam])
    n = _desplazar_offsets(moov, 0, len(moov), tam)
    resto = datos[:off] + datos[off + tam:]
    # `moov` va detrás de `ftyp`, que tiene que seguir siendo el primer átomo.
    corte = top[0][2] if tipos[0] == b'ftyp' else 0
    nuevo = bytes(resto[:corte]) + bytes(moov) + bytes(resto[corte:])
    assert len(nuevo) == len(datos), 'faststart cambió el tamaño del archivo'
    ruta.write_bytes(nuevo)
    rel = [t.decode('latin-1') for t, _, _, _ in _atomos(bytearray(nuevo), 0, len(nuevo))]
    print('FASTSTART :: moov (%d B) subido, %d offsets corregidos :: orden %s'
          % (tam, n, ' '.join(rel)))
    return rel.index('moov') < rel.index('mdat'), rel


def _renombrar_salida(carpeta, patron, destino):
    cand = sorted(carpeta.glob(patron))
    if not cand:
        raise RuntimeError('no salió ningún archivo con %s' % patron)
    if len(cand) > 1:
        cand = [max(cand, key=lambda p: p.stat().st_size)]
    if destino.exists():
        destino.unlink()
    cand[0].rename(destino)
    return destino


def codificar():
    """MP4 + WebM + póster, desde el maestro PNG y con el FFmpeg de Blender.

    Se codifica DESDE la secuencia, no desde el render: así recodificar no cuesta
    otra hora de Cycles, y el maestro RGBA queda intacto para el 1080 del día que
    alguien lo pida.
    """
    limpiar()
    d = RAIZ / 'render' / DIR_PNG
    marcos = sorted(d.glob('f*.png'))
    if len(marcos) != F_FIN + 1:
        raise RuntimeError('el maestro tiene %d PNG, se esperaban %d'
                           % (len(marcos), F_FIN + 1))
    s = bpy.context.scene
    # El motor no se toca: el secuenciador no lo usa. Lo que importa aquí es que
    # la salida sea RGB — un H.264 no lleva canal alfa, y dejar el RGBA del
    # maestro obliga al muxer a decidir por su cuenta.
    s.render.image_settings.color_mode = 'RGB'
    s.render.resolution_x, s.render.resolution_y = 1280, 720
    s.render.resolution_percentage = 100
    s.render.fps = FPS
    s.frame_start, s.frame_end = 1, F_FIN + 1
    # `Standard` otra vez, y por la misma razón que en el render: los PNG ya son
    # sRGB. Con AgX de por medio la codificación volvería a mapear un tono que ya
    # estaba mapeado y el video saldría lavado respecto al maestro.
    s.view_settings.view_transform = 'Standard'
    s.view_settings.look = 'None'

    se = s.sequence_editor_create()
    coleccion = getattr(se, 'strips', None) or se.sequences
    tira = coleccion.new_image('maestro', str(marcos[0]), 1, 1)
    for m in marcos[1:]:
        tira.elements.append(m.name)

    salidas = {}
    tmp = RAIZ / 'render' / '_tmp'
    tmp.mkdir(parents=True, exist_ok=True)

    for nombre, formato, codec, crf in (
            ('heptacoin-720.mp4', 'MPEG4', 'H264', 'HIGH'),
            ('heptacoin-720.webm', 'WEBM', 'WEBM', 'HIGH')):
        for p in tmp.glob('*'):
            p.unlink()
        s.render.image_settings.file_format = 'FFMPEG'
        s.render.ffmpeg.format = formato
        s.render.ffmpeg.codec = codec
        s.render.ffmpeg.constant_rate_factor = crf
        s.render.ffmpeg.ffmpeg_preset = 'GOOD'
        s.render.ffmpeg.gopsize = FPS
        s.render.ffmpeg.audio_codec = 'NONE'
        s.render.filepath = str(tmp / 'salida')
        t0 = time.perf_counter()
        bpy.ops.render.render(animation=True)
        ext = '.mp4' if formato == 'MPEG4' else '.webm'
        destino = _renombrar_salida(tmp, '*' + ext, RAIZ / 'render' / nombre)
        salidas[nombre] = destino.stat().st_size
        print('CODIF :: %-22s %8d B  %.1f s' % (nombre, salidas[nombre],
                                                time.perf_counter() - t0))

    # El póster es el fotograma 134, no el 0. El 0 es un vacío sin monedas: si el
    # video no arranca —datos móviles, ahorro de batería, `reduced-motion`— lo
    # que tiene que quedar en pantalla es la escena TERMINADA, no el telón.
    img = bpy.data.images.load(str(d / ('f%04d.png' % F_FIN)))
    s.render.image_settings.file_format = 'WEBP'
    s.render.image_settings.color_mode = 'RGB'
    s.render.image_settings.quality = 82
    poster = RAIZ / 'render' / 'heptacoin-poster.webp'
    img.save_render(filepath=str(poster), scene=s)
    salidas['heptacoin-poster.webp'] = poster.stat().st_size
    print('CODIF :: %-22s %8d B  (fotograma %d, calidad 82)'
          % ('heptacoin-poster.webp', salidas['heptacoin-poster.webp'], F_FIN))

    ok, orden = faststart(RAIZ / 'render' / 'heptacoin-720.mp4')
    salidas['heptacoin-720.mp4'] = (RAIZ / 'render' / 'heptacoin-720.mp4').stat().st_size

    print('PESOS :: archivo                 bytes      KiB   techo   veredicto')
    for nombre, techo in TECHOS.items():
        b = salidas.get(nombre, 0)
        print('PESOS :: %-22s %8d  %7.1f  %6.1f  %s'
              % (nombre, b, b / 1024.0, techo / 1024.0,
                 'DENTRO' if b <= techo else 'PASADO'))
    try:
        for p in tmp.glob('*'):
            p.unlink()
        tmp.rmdir()
    except OSError:
        pass
    return salidas, ok


# ════════════════════════════════════════════════════════════════════════════
def paso2(sondear=False, rango=None):
    energia, campo_sellado = calibrar_oro_sellado()
    esc = montar_escena(energia)
    calibrar_fondo(esc)
    revisar_banda(esc)
    if sondear:
        sonda_barrido(esc)
        return
    escribir_tiempos()
    lote(esc, rango)


if __name__ == '__main__':
    argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else ['retrato']
    modo = argv[0] if argv else 'retrato'
    (RAIZ / 'render').mkdir(parents=True, exist_ok=True)
    (RAIZ / '_calib').mkdir(parents=True, exist_ok=True)
    if modo == 'retrato':
        retrato()
    elif modo == 'sonda':
        paso2(sondear=True)
    elif modo == 'animar':
        rango = (int(argv[1]), int(argv[2])) if len(argv) >= 3 else None
        paso2(rango=rango)
    elif modo == 'codificar':
        codificar()
    else:
        print('MODO DESCONOCIDO :: %s' % modo)
