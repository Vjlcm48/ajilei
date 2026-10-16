// ── IOS-1c · El último saldo que este aparato vio del servidor ──────────────
// Rector: AJILEI_IOS-1_Fase1c_v1.0.md §3.3 (S2) y el plan aprobado del STOP-1.
//
// UNA entrada, `{ uid, saldo, en }`, bajo `ajilei.saldoVisto`. La píldora la
// enseña atenuada al arrancar, mientras contesta `mi_billetera()`. No es una
// billetera en el aparato —esa sería falsificable (Tapetes_v1.0 §5)—: nadie
// juzga con ella y la cifra del servidor la sustituye en cuanto llega.
//
// Reglas:
//   · se escribe SÓLO con cifras del servidor (`useBilletera`, sobre
//     `servidor`, que sólo cambian la lectura y las funciones de dinero);
//   · es de UNA cuenta: otra cuenta en el mismo aparato no la lee nunca, y su
//     primera cifra la sustituye;
//   · se borra al cerrar sesión (`App`);
//   · el almacén puede fallar o venir vacío: todo va protegido y un fallo es
//     «no hay recuerdo».

const CLAVE = 'ajilei.saldoVisto'

const almacenDelNavegador = () => {
  try { return globalThis.localStorage ?? null } catch { return null }
}

/** @param {() => Storage|null} [almacen] */
export function crearSaldoRecordado(almacen = almacenDelNavegador) {
  return {
    /** `{ uid, saldo, en }` de `uid`, o `null`. */
    leer(uid) {
      if (!uid) return null
      try {
        const crudo = almacen()?.getItem(CLAVE)
        if (!crudo) return null
        const r = JSON.parse(crudo)
        return r && r.uid === uid && Number.isInteger(r.saldo) && r.saldo >= 0 ? r : null
      } catch {
        return null
      }
    },
    guardar(uid, saldo, en = Date.now()) {
      if (!uid || !Number.isInteger(saldo) || saldo < 0) return
      try { almacen()?.setItem(CLAVE, JSON.stringify({ uid, saldo, en })) } catch { /* sin almacén no hay recuerdo */ }
    },
    borrar() {
      try { almacen()?.removeItem(CLAVE) } catch { /* nada que borrar */ }
    },
  }
}

export const saldoRecordado = crearSaldoRecordado()
