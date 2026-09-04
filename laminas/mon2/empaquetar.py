# -*- coding: utf-8 -*-
"""MON-2 · Empaquetado: 135 PNG RGBA → WebP animado con alfa + póster con alfa.

Corre con el Python del sistema (Pillow ya instalado; el de Blender no lo trae):

    python laminas/mon2/empaquetar.py                       # escalera literal (0.4)
    python laminas/mon2/empaquetar.py --fps 24 --escala 0.75 --publicar
    python laminas/mon2/empaquetar.py --salida heptacoin-escalera-literal.webp

Lo que hace, en orden, y por qué (todo MEDIDO en la campaña, no supuesto):

1. **Escala** (si se pide) ANTES de todo lo demás: reescalar después de limpiar
   devuelve el ruido al alfa y rompe la quietud entre cuadros — medido: a
   704 px pesaba MÁS que a 880.
2. **Viñeta sobre el alfa de la SOMBRA** (sellada en la compuerta): en el 10 %
   exterior del cuadro la sombra se atenúa a cero con un smoothstep; sólo los
   píxeles de sombra (RGB < 48), nunca los de moneda. Es la viñeta de la
   decisión 3 de MON-1 trasladada al alfa. Las monedas que ENTRAN por el borde
   superior sí tocan el borde con alfa 255: es la coreografía, no un defecto.
3. **Sombra limpia.** El WebP animado no tiene predicción entre cuadros: cada
   sub-cuadro es una imagen independiente del rectángulo que cambió. Con el
   ruido de Cycles, el alfa de la sombra cambia en TODOS los píxeles en todos
   los cuadros y el codificador reescribe el cuadro entero cada vez (medido:
   un sintético con sombra ruidosa ±2 pesa 14,8 MB; sin ruido, 62 KiB). Así
   que la sombra se alisa (σ=3, sólo píxeles de sombra), su alfa se cuantiza
   a pasos de 16 con tramado ordenado Bayer (sin anillos, sin ruido temporal)
   y su RGB se fija en (6,4,2); y entre cuadros consecutivos
   un píxel que cambia ≤16 (sombra) o ≤3 (moneda: por debajo del error del
   propio códec a estas calidades) conserva su valor anterior. El borde del
   oro contra el verde no se toca: los píxeles de moneda (RGB ≥ 48) sólo
   reciben la estabilización de ±3.
4. **WebP animado**: loop=1 (una sola pasada; la portada rebobina por código),
   alfa SIN pérdida (alpha_quality=100), color con pérdida. Duraciones enteras
   que suman 4 500 ms exactos, la ventana de la escena. kmin/kmax altos para
   que no meta un cuadro clave completo cada 3-5 cuadros.
5. **Escalera de peso** (Bloque 0.4): objetivo ≤ 1,2 MB, techo 1,5 MB.
   Literal: calidad 90→70 · luego fps 24→20→15 · luego escala. Con `--fps` y
   `--escala` explícitos se fija el peldaño y se busca la calidad más alta que
   quepa. La coreografía nunca se recorta: bajar fps es remuestrear la misma
   línea de tiempo, no cortar cuadros del final.
6. **Medición honesta**: PSNR y error máximo sobre los píxeles OPACOS (oro y
   esmalte) de tres cuadros DECODIFICADOS del archivo, alineados por MARCA DE
   TIEMPO (el codificador funde cuadros idénticos consecutivos y el índice ya
   no vale). Contra la fuente limpia (lo que se quiso codificar) y contra el
   render crudo (la desviación total, estabilización incluida).
7. **Póster**: el último cuadro (reposo, de cara) con alfa, calidad 88.
"""
import io, sys, math, time, pathlib, shutil
import numpy as np
from PIL import Image, ImageSequence, ImageFilter

RAIZ = pathlib.Path(__file__).parent.resolve()
PNG = RAIZ / 'render' / 'png'
SALIDA = RAIZ / 'render'
PUBLIC = RAIZ.parent.parent / 'public'
N_CUADROS = 135
FPS = 30
VENTANA_MS = 4500
ANCHO_VINETA = 0.10
UMBRAL_SOMBRA = 48
SIGMA_SOMBRA = 3.0
PASO_ALFA = 16
T_SOMBRA, T_MONEDA = 16, 3
OBJETIVO = 1.2 * 1024 * 1024
TECHO = 1.5 * 1024 * 1024
CALIDADES = (90, 85, 80, 75, 70)
FPS_ESCALERA = (30, 24, 20, 15)
ESCALAS = (1.0, 0.8, 0.75, 0.7)
PSNR_MINIMO = 36.0
KMIN, KMAX = 120, 135


def vineta(w, h):
    x = np.linspace(0, 1, w)
    y = np.linspace(0, 1, h)

    def sm(t):
        t = np.clip(t / ANCHO_VINETA, 0, 1)
        return t * t * (3 - 2 * t)
    return np.outer(np.minimum(sm(y), sm(1 - y)), np.minimum(sm(x), sm(1 - x)))


def cargar(escala=1.0):
    marcos = sorted(PNG.glob('f*.png'))
    if len(marcos) != N_CUADROS:
        raise SystemExit('el maestro tiene %d PNG, se esperaban %d' % (len(marcos), N_CUADROS))
    ims = [Image.open(m).convert('RGBA') for m in marcos]
    if escala != 1.0:
        w, h = ims[0].size
        ims = [im.resize((int(w * escala) // 2 * 2, int(h * escala) // 2 * 2), Image.LANCZOS) for im in ims]
    return ims


BAYER = np.array([[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]], float) / 16.0


def preparar(crudos):
    """Viñeta + sombra limpia + tramado + estabilización. Devuelve arrays int16.

    El alfa de la sombra cuantizado a pasos de 16 dibujaba ANILLOS (se vieron
    en la captura del arnés); a paso 8 seguían y a paso 4 el peso se pasaba del
    techo. La salida es un tramado ORDENADO (Bayer 4×4) antes de cuantizar:
    fijo en el espacio, así lo quieto sigue siendo idéntico entre cuadros y no
    devuelve el ruido temporal que mata al codificador; y sin anillos.
    La viñeta va ANTES de cuantizar para que el borde quede en 0 exacto.
    """
    w, h = crudos[0].size
    V = vineta(w, h)
    B = np.tile(BAYER, (h // 4 + 1, w // 4 + 1))[:h, :w]
    out, pisadas, borde_sombra, borde_moneda = [], 0, 0, 0
    for im in crudos:
        c = np.asarray(im).astype(np.int16).copy()
        sombra = (c[..., :3].max(2) < UMBRAL_SOMBRA) & (c[..., 3] > 0)
        moneda = (~sombra) & (c[..., 3] > 0)
        pisadas += int((moneda & (V < 1)).sum())
        c[..., :3][sombra] = (6, 4, 2)
        al = c[..., 3].astype(np.uint8)
        solo = np.where(sombra, al, 0).astype(np.uint8)
        peso = sombra.astype(np.uint8) * 255
        bl = np.asarray(Image.fromarray(solo).filter(ImageFilter.GaussianBlur(SIGMA_SOMBRA))).astype(float)
        bw = np.asarray(Image.fromarray(peso).filter(ImageFilter.GaussianBlur(SIGMA_SOMBRA))).astype(float)
        suave = np.where(bw > 0, bl / np.maximum(bw, 1e-6) * 255, 0) * V
        q = np.floor((suave + PASO_ALFA * B) / PASO_ALFA) * PASO_ALFA
        c[..., 3] = np.where(sombra, np.clip(q, 0, 255), al)
        if out:
            prev = out[-1]
            Tm = np.where(sombra, T_SOMBRA, T_MONEDA)
            quieto = np.abs(c - prev).max(2) <= Tm
            c = np.where(quieto[..., None], prev, c)
        b = c[..., 3]
        borde = np.concatenate([b[0], b[-1], b[:, 0], b[:, -1]])
        bs = np.concatenate([sombra[0], sombra[-1], sombra[:, 0], sombra[:, -1]])
        if bs.any():
            borde_sombra = max(borde_sombra, int(borde[bs].max()))
        if (~bs).any():
            borde_moneda = max(borde_moneda, int(borde[~bs].max()))
        out.append(c)
    print('LIMPIA :: %d cuadros %dx%d :: viñeta %.0f%% sólo en sombra :: píxeles de moneda en la banda %d '
          '(monedas entrando por arriba) :: alfa de SOMBRA en el borde tras la viñeta: %d :: alfa de moneda en el borde: %d'
          % (len(out), w, h, ANCHO_VINETA * 100, pisadas, borde_sombra, borde_moneda), flush=True)
    return out


def duraciones(n):
    """Enteros en ms que suman EXACTAMENTE la ventana: 33·33·34 a 30 fps."""
    base = VENTANA_MS / n
    acum, out = 0, []
    for k in range(n):
        objetivo = int(round(base * (k + 1)))
        out.append(objetivo - acum)
        acum = objetivo
    return out


def indices_fps(fps):
    if fps == FPS:
        return list(range(N_CUADROS))
    n = int(round(N_CUADROS * fps / FPS))
    return [min(N_CUADROS - 1, int(round(k * (N_CUADROS - 1) / (n - 1)))) for k in range(n)]


def codificar(arrays, calidad, fps, metodo=4):
    """metodo 4 para recorrer la escalera (segundos); 6 sólo para el archivo final."""
    idx = indices_fps(fps)
    fr = [Image.fromarray(arrays[i].astype(np.uint8)) for i in idx]
    b = io.BytesIO()
    fr[0].save(b, 'WEBP', save_all=True, append_images=fr[1:], duration=duraciones(len(fr)),
               loop=1, lossless=False, quality=calidad, alpha_quality=100, method=metodo,
               kmin=KMIN, kmax=KMAX)
    return b.getvalue(), idx


def duraciones_anmf(datos):
    """Las duraciones de los ANMF leídas del contenedor: Pillow las desplaza un
    cuadro (medido: informa 0 ms para el primero) y con cuadros idénticos
    fundidos por el codificador el índice ya no vale para alinear."""
    o, out = 12, []
    while o + 8 <= len(datos):
        tag = datos[o:o + 4]
        ln = int.from_bytes(datos[o + 4:o + 8], 'little')
        if tag == b'ANMF':
            out.append(int.from_bytes(datos[o + 8 + 12:o + 8 + 15], 'little'))
        o += 8 + ln + (ln & 1)
    return out


def decodificar_por_tiempo(datos):
    """Cuadros decodificados con su intervalo [ini, fin) en ms, según el contenedor."""
    im = Image.open(io.BytesIO(datos))
    dur = duraciones_anmf(datos)
    marcos, t = [], 0
    for k, f in enumerate(ImageSequence.Iterator(im)):
        d = dur[k] if k < len(dur) else 0
        marcos.append((t, t + d, f.convert('RGBA').copy()))
        t += d
    return marcos, t, im.n_frames, im.info.get('loop')


def psnr_de(e):
    mse = (e ** 2).mean()
    return 99.0 if mse == 0 else 10 * math.log10(255 ** 2 / mse)


def medir(datos, limpios, crudos, idx, muestras=(16, 78, 134)):
    marcos, total, n, loop = decodificar_por_tiempo(datos)
    dur = duraciones(len(idx))
    inicio = np.cumsum([0] + dur[:-1])
    res = []
    for m in muestras:
        k = min(range(len(idx)), key=lambda j: abs(idx[j] - m))   # el cuadro remuestreado más cercano
        t = inicio[k] + 1
        dec = next(d for (a, b, d) in marcos if a <= t < b) if t < total else marcos[-1][2]
        d = np.asarray(dec).astype(float)
        L = limpios[idx[k]].astype(float)
        C = np.asarray(crudos[idx[k]]).astype(float)
        op = L[..., 3] == 255
        e_l = L[..., :3][op] - d[..., :3][op]
        e_c = C[..., :3][op] - d[..., :3][op]
        alfa_dif = int((L[..., 3] != d[..., 3]).sum())
        res.append((idx[k], psnr_de(e_l), float(np.abs(e_l).max()), psnr_de(e_c), float(np.abs(e_c).max()), alfa_dif))
    return res, total, n, loop


def resumen(res):
    return ' · '.join('f%03d PSNR %.1f dB err %.0f | crudo PSNR %.1f dB err %.0f | alfa≠%d' % r for r in res)


def elegir_literal(por_escala):
    """calidad → fps → escala. Devuelve (escala, fps, q, datos, idx, res)."""
    for escala in ESCALAS:
        limpios, crudos = por_escala(escala)
        for fps in FPS_ESCALERA:
            for q in CALIDADES:
                datos, idx = codificar(limpios, q, fps)
                res, total, n, loop = medir(datos, limpios, crudos, idx)
                peso = len(datos)
                psnr_min = min(r[1] for r in res)
                print('ESCALERA :: escala %.2f · %2d fps · calidad %d :: %7.1f KiB :: PSNR mín %.1f dB'
                      % (escala, fps, q, peso / 1024, psnr_min), flush=True)
                if peso <= OBJETIVO and (psnr_min >= PSNR_MINIMO or q == CALIDADES[-1]):
                    return escala, fps, q, limpios, crudos
    raise SystemExit('ninguna combinación bajo el objetivo')


def elegir_fijo(por_escala, escala, fps):
    limpios, crudos = por_escala(escala)
    for q in CALIDADES:
        datos, idx = codificar(limpios, q, fps)
        res, total, n, loop = medir(datos, limpios, crudos, idx)
        peso = len(datos)
        psnr_min = min(r[1] for r in res)
        print('PELDAÑO FIJO :: escala %.2f · %2d fps · calidad %d :: %7.1f KiB :: PSNR mín %.1f dB'
              % (escala, fps, q, peso / 1024, psnr_min), flush=True)
        if peso <= OBJETIVO:
            return escala, fps, q, limpios, crudos
    raise SystemExit('el peldaño fijo no cabe bajo el objetivo ni a calidad %d' % CALIDADES[-1])


def solo_medir(argv):
    ruta = pathlib.Path(argv[argv.index('--medir') + 1])
    fps = int(argv[argv.index('--fps') + 1]) if '--fps' in argv else FPS
    escala = float(argv[argv.index('--escala') + 1]) if '--escala' in argv else 1.0
    datos = ruta.read_bytes()
    crudos = cargar(escala)
    limpios = preparar(crudos)
    idx = indices_fps(fps)
    res, total, n, loop = medir(datos, limpios, crudos, idx)
    print('MEDIR :: %s :: %.1f KiB :: %d cuadros :: loop=%s :: %d ms' % (ruta.name, len(datos) / 1024, n, loop, total))
    print('MEDIR :: (PSNR/err: contra la fuente limpia / contra el render crudo) :: ' + resumen(res))


def main(argv):
    if '--medir' in argv:
        return solo_medir(argv)
    publicar = '--publicar' in argv
    salida = SALIDA / (argv[argv.index('--salida') + 1] if '--salida' in argv else 'heptacoin.webp')
    fps_fijo = int(argv[argv.index('--fps') + 1]) if '--fps' in argv else None
    escala_fija = float(argv[argv.index('--escala') + 1]) if '--escala' in argv else None
    cache = {}

    def por_escala(escala):
        if escala not in cache:
            crudos = cargar(escala)
            cache[escala] = (preparar(crudos), crudos)
        return cache[escala]

    if fps_fijo or escala_fija:
        escala, fps, q, limpios, crudos = elegir_fijo(por_escala, escala_fija or 1.0, fps_fijo or FPS)
        peldano = 'fijado a mano: escala %.2f · %d fps' % (escala, fps)
    else:
        escala, fps, q, limpios, crudos = elegir_literal(por_escala)
        peldano = ('calidad' if (fps == FPS and escala == 1.0) else ('fps' if escala == 1.0 else 'escala'))

    t0 = time.perf_counter()
    datos, idx = codificar(limpios, q, fps, metodo=6)
    res, total, n, loop = medir(datos, limpios, crudos, idx)
    salida.write_bytes(datos)
    im = Image.open(salida)
    print('FINAL :: %s :: %d B (%.1f KiB) :: %d cuadros en el archivo (%d codificados @ %d fps) :: %dx%d '
          ':: loop=%s :: duración total %d ms :: método 6 en %.0f s :: peldaño: %s · calidad %d'
          % (salida.name, len(datos), len(datos) / 1024, n, len(idx), fps, im.size[0], im.size[1],
             loop, total, time.perf_counter() - t0, peldano, q), flush=True)
    print('FINAL :: (PSNR/err: contra la fuente limpia / contra el render crudo) :: ' + resumen(res))
    veredicto = ('DENTRO del objetivo' if len(datos) <= OBJETIVO
                 else ('bajo el techo' if len(datos) <= TECHO else 'PASADO'))
    print('PESO :: %.1f KiB :: objetivo %.0f KiB · techo %.0f KiB :: %s'
          % (len(datos) / 1024, OBJETIVO / 1024, TECHO / 1024, veredicto))

    poster = salida.with_name(salida.stem + '-poster.webp') if salida.name != 'heptacoin.webp' else SALIDA / 'heptacoin-poster.webp'
    Image.fromarray(limpios[-1].astype(np.uint8)).save(poster, 'WEBP', quality=88, alpha_quality=100, method=6)
    pi = Image.open(poster)
    print('PÓSTER :: %s :: %d B :: %dx%d :: modo %s (cuadro %d, calidad 88, alfa sin pérdida)'
          % (poster.name, poster.stat().st_size, pi.size[0], pi.size[1], pi.mode, N_CUADROS - 1))

    if publicar:
        PUBLIC.mkdir(exist_ok=True)
        for f in (salida, poster):
            shutil.copyfile(f, PUBLIC / f.name)
            print('PUBLIC :: %s :: %d B' % (f.name, (PUBLIC / f.name).stat().st_size))


if __name__ == '__main__':
    main(sys.argv[1:])
