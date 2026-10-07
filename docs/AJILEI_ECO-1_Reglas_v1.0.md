# AJILEI · ECO-1 · Reglas del saldo · v1.0

Normativo de la campaña ECO-1. Lo edita solo el rector. Fecha: 2026-10-06.

## 1. Principio
El saldo de cada jugador vive en Supabase. Solo lo mueve el servidor, mediante movimientos anotados en un libro de solo inserción. El cliente muestra; nunca decide.

## 2. Billetera y libro
- Una billetera por jugador (`billeteras.saldo`, nunca negativo).
- Todo cambio de saldo es una línea en `movimientos`, con tipo, monto con signo, saldo tras el movimiento y clave idempotente única. Las dos escrituras van en la misma transacción.
- Tipos: bono_bienvenida, constancia, video, entrada_ia, recarga_ia, salida_ia, abandono_ia, compra, ajuste_admin, garantia_pvp, liberacion_pvp, resultado_pvp.
- El resultado de una mano se anota como diferencia de fichas por asiento, nunca a partir de `winner`.
- Ninguna tabla de dinero entra en Realtime.

## 3. Bono de bienvenida
- 2.500 HC, una vez por persona, al crear el perfil.
- Persona = correo canónico. En Gmail/googlemail: minúsculas, sin puntos en la parte local, sin lo que va desde el `+`, dominio gmail.com. En el resto de dominios: minúsculas.
- Se guarda la huella sha256 del correo canónico, sin vínculo con la cuenta, y no caduca: borrar la cuenta y volver con el mismo correo no da otro bono. Se menciona en la política de privacidad.
- Las cuentas anteriores a ECO-1 arrancan igual que las nuevas: 2.500.

## 4. El día
- Un solo día para todos: el de Chicago (America/Chicago, con cambio de horario automático). Rige el tope de videos, la constancia y la válvula.

## 5. Contra las IAS (sub-tanda 1c)
- La mesa se abre en el servidor: la entrada sale del saldo al sentarse; cada recarga, al confirmarse.
- La salida se cobra una sola vez, topada por el techo de la mesa: entrada + recargas + pilas de las IAS, con la holgura de los nivelados.
- El teléfono informa al servidor cada vez que cambia la pila del jugador. Si la partida se corta, se cobra la última pila informada; lo ya puesto en el pozo no se recupera.
- Una sola mesa abierta contra las IAS por cuenta.
- Récord de manos por jugador y sumado: por reto (Básico, Avanzado, Pro) y por número de jugadores vivos en la mano (2, 3, 4, 5); cuenta manos jugadas, ganadas por el humano y ganadas por las IAS. La mano la gana quien se lleva el pozo principal. Lo consulta Victor; sin pantalla por ahora.

## 6. Válvula
- Camino C: la palanca existe pero está apagada. Se decide con los datos de los testers y del récord.

## 7. Conteos del servidor
- Video de recompensa: 500 HC, tope de 8 por día. Se cobra contra un boleto emitido al empezar, cobrable una sola vez y solo pasados los segundos mínimos. Cerrar antes de tiempo no cobra y no cuenta para el tope.
- Constancia: 500 HC cada 3 días seguidos de ingreso.
- Límite de frecuencia por minuto en toda función que mueve dinero (las lecturas, como mi_billetera, no lo llevan), sin raise al anotar.

## 8. PvP
- Cada jugador se sienta con una entrada fija sacada de su saldo real (Corta 15× / Llena 50×), en garantía mientras dura la mesa; lo que gana o pierde vuelve a su saldo. Lo implementan MOT-1 y MES-PvP.

## 9. Celebración
- El «Saldo actual» de la pantalla de victoria cuenta el saldo real, no las fichas de la mesa.

## 10. Administración
- Victor puede ajustar saldos desde el SQL Editor con `ajuste_admin`, que exige un motivo y queda anotado en el libro.
