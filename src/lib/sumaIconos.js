// ── RNK-1 1e · Los iconos de SumaMente ──────────────────────────────────────
// Los usan dos pantallas: el intersticial (los dos) y la línea de la familia de
// Rankings (el de 64). El de 64 va con `?no-inline`, como `heptacoin.svg` en
// Rankings: incrustado como data URI, el minificador lo copiaba en cada sitio
// donde se usa (2 KB dos veces en el paquete principal); como archivo aparte
// son 1,5 KB que el navegador pide una vez y guarda. El de 512 (44 KB) ya es
// un archivo, y sólo se pide cuando el intersticial lo pinta.
export { default as iconoSumaMente64 } from '../assets/sumamente_64.webp?no-inline'
export { default as iconoSumaMente512 } from '../assets/sumamente_512.png'
