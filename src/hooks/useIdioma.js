import { useEffect, useMemo, useState } from 'react'
import {
  CLAVE_IDIOMA_STORAGE,
  IDIOMA_POR_DEFECTO,
  idiomaValido,
  t as traducir,
} from '../config/textos'

// ── IDI-0 · El único sitio de la plomería que toca el DOM ───────────────────
// Documento rector: AJILEI_LOB1_Fase1_v1.1.md §2.3.
//
// `config/textos.js` resuelve claves y no sabe que existe un navegador; este
// hook lee la preferencia, la normaliza y escribe `<html lang>`. La frontera es
// la misma que separa `nivelCore.js` de `useNivel.js` y `tapetesCore.js` de
// `useTapetes.js`: la semántica en un módulo puro, la infraestructura en el hook.
//
// ── POR QUÉ EL ARCHIVO ES `.js` Y NO `.jsx` ─────────────────────────────────
// No devuelve JSX. Molde de `useAuth.js` y `useNivel.js`: así la regla
// `react-refresh/only-export-components` ni se aplica.
//
// ── NO HAY `setIdioma`, Y ES A PROPÓSITO ────────────────────────────────────
// Con un solo diccionario, un conmutador sería un botón que no puede cambiar
// nada: la lista de destinos posibles tiene un elemento y ya está puesto. El
// conmutador es IDI-1, cuando exista `textos.en.js`. Hasta entonces esta capa
// LEE una preferencia que alguien podría haber sembrado a mano y la respeta si
// es válida, que es todo lo que se puede prometer sin mentir.
//
// EL SELECTOR DE LA PORTADA NO SE TOCA. Sigue siendo la cara sin mecanismo que
// PUE selló (Fase 0 §3.2): cinco banderas, cuatro `disabled`, ningún `onClick`.
// Conectarlo es IDI-1 y necesita el segundo diccionario primero.

// Lectura defensiva, molde exacto de `readNivel`: try/catch porque un storage
// denegado (ventana privada, cookies bloqueadas) no puede tumbar el lobby.
export function readIdioma() {
  try {
    const guardado = window.localStorage.getItem(CLAVE_IDIOMA_STORAGE)
    return idiomaValido(guardado) ? guardado : IDIOMA_POR_DEFECTO
  } catch {
    return IDIOMA_POR_DEFECTO
  }
}

export function useIdioma() {
  // Se lee UNA vez, en el inicializador perezoso del `useState`. Igual que
  // `App.jsx` hace con `readNivel()`: la preferencia es un dato de arranque, no
  // algo que haya que sincronizar con un efecto en cada render.
  const [idioma] = useState(readIdioma)

  // `<html lang>` no es adorno: gobierna la voz del lector de pantalla, el
  // guionado y la corrección ortográfica del navegador. `index.html:2` lo trae
  // clavado a "es" y hasta hoy nadie lo escribía desde código (Fase 0 §3.2);
  // desde aquí queda atado al idioma vivo, así que el día que IDI-1 traiga un
  // segundo diccionario esto ya funciona sin tocar una línea.
  useEffect(() => {
    document.documentElement.lang = idioma
  }, [idioma])

  // `t` se memoiza por idioma para que no cambie de identidad en cada render:
  // los consumidores pueden meterla en dependencias sin provocar cascadas.
  //
  // SAL-Aa · El `t` que ven las pantallas acepta `(clave, vars)` y JAMÁS el
  // idioma: ése lo pone el hook, que es quien lo conoce. Es lo que evita que un
  // componente pinte en un idioma distinto del resto de la app por escribir un
  // tercer argumento de más. `vars` viaja tal cual a `config/textos.js`, que es
  // donde vive la sustitución.
  const t = useMemo(() => (clave, vars) => traducir(clave, vars, idioma), [idioma])

  return { idioma, t }
}
