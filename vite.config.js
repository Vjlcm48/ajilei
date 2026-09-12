import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Permite abrir `vite preview` a través de un túnel temporal de Cloudflare
  // (pruebas con teléfonos reales fuera de la red local). Solo afecta a preview.
  preview: { allowedHosts: ['.trycloudflare.com'] },
})
