// ── supabase.js · El cliente de nube, fuente única ──────────────────────────
// SUP-1 abre la fase de nube del plan PvP cableando el SDK y nada más: aquí
// nace el cliente y aquí espera. Ninguna pantalla lo importa todavía, no hay
// tablas ni auth, y la app se juega exactamente igual que antes de esta tanda.
//
// Doctrina de este módulo:
//
// 1. NINGÚN SECRETO EN EL REPOSITORIO. Los dos valores viven en `.env.local`,
//    que git ignora; lo versionado es `.env.example`, una plantilla vacía. El
//    prefijo `VITE_` es obligatorio para que Vite los exponga al cliente, y es
//    también el recordatorio de que ACABAN EN EL NAVEGADOR: aquí sólo entra la
//    llave publishable/anon, jamás la de servicio.
//
// 2. FALLAR RUIDOSO Y TEMPRANO. Si falta una variable, `createClient` no se
//    llama: se lanza al importar el módulo. Un cliente mudo con credenciales
//    vacías no falla donde está el error —falla tres pantallas después, en una
//    consulta, con un 401 que no dice nada de la causa.
//
// 3. UN SOLO CLIENTE. Este módulo es el singleton; nadie más llama a
//    `createClient`. Dos instancias del SDK sobre el mismo proyecto se pisan la
//    sesión en almacenamiento y abren dos sockets de tiempo real, que es
//    justamente lo que un PvP no puede permitirse.

import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

if (!url || !publishableKey) {
  throw new Error(
    'SUP-1: faltan variables de entorno de Supabase — copia .env.example como .env.local y llena los valores'
  )
}

export const supabase = createClient(url, publishableKey)
