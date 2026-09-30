# maestras/dis1 · los aparatos de la escena 5 (DIS-1)

Traza de los dos renders que la Portada muestra en la escena 5: la laptop y el teléfono con la captura de la mesa **horneada** en su pantalla (camino B).

## Qué hay aquí

| Archivo | Qué es |
|---|---|
| `laptop.json`, `telefono.json` | La salida de `scripts/dis1/gen_dispositivos.py` para cada aparato. Guardan las esquinas del hueco, la silueta opaca, la tinta con sombra, los px por metro, la pose, la cámara y los tiempos. Su bloque `web` describe el derivado que usa la web, en píxeles del propio derivado. |
| `contrato.json` | Las cajas de imagen que espera la lámina DIS-1 v1.3 en sus siete casos. Lo escribe `scripts/dis1/contrato_lamina.mjs`, y el modo `dis` de `scripts/diagPUE.mjs` compara la Portada contra él. |

Los derivados web viven en `src/assets/portada/`: `dis_laptop.webp` (copia de `laptop_web.webp`) y `dis_telefono.webp` (copia de `telefono_web.webp`).

La geometría CSS de la escena sale de estos JSON con `scripts/dis1/geometria_dis.mjs`. El script escribe en `src/styles/portada.css`, entre las marcas `DIS-1:geometria`.

## De dónde salen

- **Script:** `scripts/dis1/gen_dispositivos.py` (v3.2), con Blender **4.5.10 LTS** y Cycles en CPU, calidad `final`: 512 muestras y semilla 5.
- **Capturas de la pantalla:** las maestras de CAP-1 en `maestras/portada/`. La laptop usa `mesapc.png` entera y el teléfono, la caja dorada de `mesav.png`.
- **Fechas:** render final el 2026-09-30; reencaje con la v3.2 el mismo día.

## Lo que no está en git

Los PNG maestros de 16 bits (`*_hueco.png` y `*_captura.png`, unos 47 MB) están **fuera del repositorio**, en la carpeta de control de Victor:

```
Descargas\AJILEI\DIS-1\render_final_2026-09-30\
```

Allí están también el `_log.txt` del render, `datos.js` y `hoja.html`. Sus sha256 constan en `docs/reportes/AJILEI_DIS-1_Fase1c_Informe_v1.0.md`, §2.

## Si cambia la mesa del juego

No hace falta repetir el render: se reencaja la maestra nueva sobre los `*_hueco.png` guardados. Tarda unos 10 s.

1. Copia los cuatro PNG y los dos JSON del archivo de Victor a una carpeta de trabajo, por ejemplo `capturas-dis/final/`.
2. Con las maestras nuevas ya en `maestras/portada/`, ejecuta desde la raíz:

   ```
   "C:/Program Files/Blender Foundation/Blender 4.5/blender.exe" -b --factory-startup --python scripts/dis1/gen_dispositivos.py -- --reencajar --salida capturas-dis/final
   ```

3. Copia `laptop_web.webp` y `telefono_web.webp` a `src/assets/portada/` como `dis_laptop.webp` y `dis_telefono.webp`, y `laptop.json` y `telefono.json` a esta carpeta.
4. Ejecuta `node scripts/dis1/geometria_dis.mjs`. Si la silueta cambió, reescribe el bloque con `--escribir`.
5. Valida con `node scripts/diagPUE.mjs dis`, contra `npm run build` + `npx vite preview --port 4173`.
