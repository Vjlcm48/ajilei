# ── MON-1 · Paso 0.4 · Prueba de humo cronometrada ──────────────────────────
# Un cilindro dorado con el material PBR del informe de Fase 0 §2.3, a 1280x720,
# UN fotograma en Cycles CPU y otro en Eevee, con tiempo de reloj de cada uno.
# Con esos dos números se sella el motor (decisión 7 de la Fase 1).
#
# No se anima nada, no se escribe nada fuera de laminas/mon1/.
import bpy, time, sys, pathlib, platform

# RUTA ABSOLUTA, Y HACE FALTA. Con una relativa, `mkdir` la resuelve contra el
# directorio de trabajo (el proyecto) pero `render.filepath` la resuelve contra
# la RAÍZ DEL DISCO: el primer intento dejó los dos PNG en C:\laminas\mon1\_humo
# mientras la carpeta correcta quedaba vacía. Se resuelve una vez, aquí.
SALIDA = (pathlib.Path.cwd() / 'laminas' / 'mon1' / '_humo').resolve()
SALIDA.mkdir(parents=True, exist_ok=True)

# El oro de §2.3, ya en LINEAL (pegar el hex daría un oro apagado).
ORO_LINEAL = (0.8070, 0.4793, 0.0704, 1.0)
RUGOSIDAD = 0.30
METALICO = 1.0


def limpiar():
    bpy.ops.wm.read_factory_settings(use_empty=True)


def escena():
    """Cilindro dorado, luz cálida cenital adelantada, cámara en tres cuartos."""
    # ── El cilindro: proporción de la moneda sellada (Ø 94 u · grosor 10 u),
    #    a escala 1 u = 0,01 m para que las potencias de luz sean manejables.
    bpy.ops.mesh.primitive_cylinder_add(vertices=128, radius=0.47, depth=0.10,
                                        location=(0, 0, 0.05))
    disco = bpy.context.active_object
    bpy.ops.object.shade_smooth()
    # Bisel de canto: sin él el borde es un filo matemático que el especular
    # delata. Dos segmentos bastan para el retrato de humo.
    bis = disco.modifiers.new('bisel', 'BEVEL')
    bis.width = 0.004
    bis.segments = 2

    mat = bpy.data.materials.new('OroAjilei')
    mat.use_nodes = True
    p = mat.node_tree.nodes['Principled BSDF']
    p.inputs['Base Color'].default_value = ORO_LINEAL
    p.inputs['Metallic'].default_value = METALICO
    p.inputs['Roughness'].default_value = RUGOSIDAD
    disco.data.materials.append(mat)

    # ── Suelo: el vacío verde abismo, en lineal.
    bpy.ops.mesh.primitive_plane_add(size=8, location=(0, 0, 0))
    suelo = bpy.context.active_object
    ms = bpy.data.materials.new('VacioVerde')
    ms.use_nodes = True
    ms.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value = (
        0.0027, 0.0086, 0.0044, 1.0)
    ms.node_tree.nodes['Principled BSDF'].inputs['Roughness'].default_value = 0.9
    suelo.data.materials.append(ms)

    # ── Luz principal: área cálida 3200 K, cenital ADELANTADA ~15° hacia cámara.
    bpy.ops.object.light_add(type='AREA', location=(0.0, -0.35, 1.30))
    key = bpy.context.active_object
    key.data.size = 0.60
    key.data.energy = 220.0
    key.data.color = (1.0, 0.776, 0.549)   # ≈3200 K
    key.rotation_euler = (0.2618, 0.0, 0.0)   # 15° hacia el frente

    # ── Contorno tenue (8–12 % de la principal): separa la silueta del vacío.
    bpy.ops.object.light_add(type='AREA', location=(0.0, 0.95, 0.30))
    rim = bpy.context.active_object
    rim.data.size = 0.80
    rim.data.energy = 22.0                 # 10 % de la principal
    rim.data.color = (1.0, 0.776, 0.549)
    rim.rotation_euler = (1.3963, 0.0, 3.1416)

    # ── Cámara fija: 22–25° de elevación, ~20° de azimut, lente 75 mm.
    #    El retrato del Paso 1 pide la moneda DE CARA, así que el humo usa la
    #    misma familia de encuadre pero mirando la cara.
    bpy.ops.object.camera_add(location=(0.30, -0.78, 0.36))
    cam = bpy.context.active_object
    cam.data.lens = 75.0
    cam.rotation_euler = (1.1519, 0.0, 0.3665)   # 66° de inclinación ≈ 24° de elevación
    bpy.context.scene.camera = cam

    # Apuntar de verdad al disco, sin trigonometría a ojo.
    seg = cam.constraints.new('TRACK_TO')
    seg.target = disco
    seg.track_axis = 'TRACK_NEGATIVE_Z'
    seg.up_axis = 'UP_Y'
    return disco


def salida_comun(s):
    s.render.resolution_x = 1280
    s.render.resolution_y = 720
    s.render.resolution_percentage = 100
    s.render.image_settings.file_format = 'PNG'
    s.render.image_settings.color_mode = 'RGBA'
    s.frame_start = s.frame_end = 1


def cronometrar(motor, nombre):
    limpiar()
    escena()
    s = bpy.context.scene
    salida_comun(s)
    s.render.engine = motor
    if motor == 'CYCLES':
        s.cycles.device = 'CPU'
        s.cycles.samples = 128
        s.cycles.use_denoising = True
        s.cycles.use_adaptive_sampling = True
    s.render.filepath = str(SALIDA / f'humo-{nombre}')
    # Se relee el motor DESPUÉS de fijarlo: si el identificador no existiera en
    # esta compilación, Blender se quedaría con el anterior sin decir nada y los
    # dos cronómetros medirían el mismo motor.
    usado = s.render.engine
    t0 = time.perf_counter()
    bpy.ops.render.render(write_still=True)
    dt = time.perf_counter() - t0
    print(f'CRONO :: {nombre} :: motor_pedido={motor} :: motor_usado={usado} :: {dt:.2f} s')
    return dt


# ── Qué motores existen en esta compilación (Eevee cambió de identificador) ──
motores = [e.identifier for e in
           bpy.types.RenderSettings.bl_rna.properties['engine'].enum_items]
print('MOTORES ::', ','.join(motores))
eevee = next((m for m in motores if 'EEVEE' in m), None)

print('MAQUINA ::', platform.processor(), '::', platform.platform())

tiempos = {}
tiempos['cycles-cpu'] = cronometrar('CYCLES', 'cycles-cpu')
if eevee:
    tiempos[eevee.lower()] = cronometrar(eevee, 'eevee')
else:
    print('CRONO :: eevee :: NO DISPONIBLE')

# Proyección al lote de 135 fotogramas, que es la cifra que decide el motor.
for k, v in tiempos.items():
    print(f'PROYECCION :: {k} :: {v:.2f} s/fotograma :: lote 135 = {v*135/60:.1f} min')
