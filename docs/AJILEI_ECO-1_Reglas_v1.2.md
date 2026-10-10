# AJILEI · ECO-1 · Reglas del saldo · v1.2

Normativo de la campaña ECO-1. Lo edita solo el rector. Fecha: 2026-10-09 (v1.1: 2026-10-08; v1.0: 2026-10-06).

**Qué cambia respecto de la v1.1** (ECO-1 Fase 1d, decisiones de Victor y del rector del 2026-10-07 al 2026-10-09):
- §6: la válvula es el **tope diario de ganancia neta contra las IAS**, construido y **apagado**: su definición (por mesa, el día en que se cierra), qué hace encendida (sentarse y recargar dicen que no; la mesa en curso se paga completa) y cómo se enciende y se apaga.
- §7: la **constancia** (qué es un ingreso, la racha, el reinicio, el cobro en múltiplos de 3) y los **límites por minuto** con sus cifras y la regla de que un límite nunca atrapa dinero. `informar_pila` no lleva límite.

**Qué cambió de la v1.0 a la v1.1** (ECO-1 Fase 1c, decisiones de Victor y del rector del 2026-10-08):
- §5: entran la regla general de **una sola partida abierta por cuenta** (C4), el **aviso de saldo** (C5) y el **dispositivo que pierde su mesa** (C6). La regla «una sola mesa abierta contra las IAS» de la v1.0 queda dentro de la general. Entran también la recogida al arrancar (P-4) y las validaciones del servidor (P-1, P-3).
- §8: MES-PvP aplica la misma regla C4 con la misma pieza de cierre.
- §9: la cifra de la celebración es la que devuelve el cobro de la mesa.

La v1.1 y la v1.0 se conservan como historia en `docs/AJILEI_ECO-1_Reglas_v1.1.md` y `docs/AJILEI_ECO-1_Reglas_v1.0.md`.

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

## 5. Contra las IAS
- **La mesa se abre en el servidor:** la entrada sale del saldo al sentarse; cada recarga, al confirmarse. El teléfono no entra a una mesa que el servidor no abrió.
- **La entrada** es un entero, múltiplo de la apuesta de mesa, entre 10 y 50 apuestas, y no mayor que el saldo. La apuesta tiene que ser una de las del reto elegido.
- **La recarga** es un entero, múltiplo de la apuesta, no mayor que el saldo, y la pila avisada más la recarga no pasa del techo de la mesa (50 apuestas).
- **La salida se cobra una sola vez**, topada por el techo de cobro de la mesa: la entrada, más las recargas, más las pilas de las IAS al sentarse, más la holgura de los nivelados (una mesa entera de IAS al techo por cada recarga).
- **El teléfono informa al servidor cada vez que cambia la pila del jugador**, también las apuestas en el momento en que salen al pozo. Si la partida se corta, se cobra la última pila informada; lo ya puesto en el pozo no se recupera.
- **Una sola partida abierta por cuenta, en cualquier modo (C4).** Si la cuenta abre una partida nueva teniendo otra abierta (abandonada en este teléfono o viva en otro dispositivo), la vieja se cierra, se cobra su última pila informada y queda abierta la más reciente. Vale para IAS + IAS, PvP + PvP y sus combinaciones. La cierra una sola pieza del servidor.
- **La partida abandonada se recoge al arrancar.** Al entrar con sesión, la partida que quedó abierta se cierra y se cobra si se abrió desde este mismo dispositivo (una partida no sobrevive a recargar la página) o si lleva más de 10 minutos sin avisos.
- **El aviso de saldo (C5).** Cuando una partida se cierra así, o cuando vuelve dinero fuera de la mesa, un aviso breve junto al saldo lo dice («Volvieron 1.350 HC de tu partida anterior.»), y el saldo cuenta de la cifra vieja a la nueva. Sin fichas que devolver, solo el texto.
- **El dispositivo que pierde su mesa (C6)** se entera en su siguiente aviso al servidor: muestra el aviso («Abriste otra partida en otro dispositivo…») y vuelve al inicio, sin perder dinero.
- **Récord de manos** por jugador y sumado: por reto (Básico, Avanzado, Pro) y por número de jugadores vivos en la mano (2, 3, 4, 5); cuenta manos jugadas, ganadas por el humano y ganadas por las IAS. La mano la gana quien se lleva el pozo principal. Lo consulta Victor; sin pantalla por ahora.
- **Una IA sin fichas para el ante no vuelve:** al recargar, solo se completan las IAS que siguen con al menos una apuesta.

## 6. Válvula
- Camino C: la palanca existe pero está **apagada**. Se decide con los datos de los testers y del récord.
- **Qué es:** un tope diario a la **ganancia neta contra las IAS** de cada jugador, en HC fijas. Apagada = sin tope.
- **La ganancia del día** se cuenta **por mesa**, en el día de Chicago en que la mesa **se cierra**: lo cobrado, menos la entrada, menos las recargas. Se suma además la mesa abierta como si se cerrara en ese momento (su última pila avisada, topada por el techo de cobro, menos su entrada y sus recargas). Una mesa que cruza la medianoche cuenta entera el día que se cierra.
- **Encendida y alcanzado el tope:** no se abre otra mesa contra las IAS ni se recarga la que está en curso hasta el día siguiente. La respuesta es «no» sin efectos: no se cierra la mesa vieja ni se cobra nada. La mesa en curso **se sigue jugando y se paga completa** al salir. Reintentar una apertura que ya se hizo devuelve esa mesa, nunca el «no».
- **Lo que ve el jugador:** en Retar, «Llegaste al tope de hoy contra las IAS. Vuelve mañana o juega contra jugadores.»; en la tarjeta de recarga, que hoy no se puede recargar, con seguir sin recargar o «Salir con mis fichas» (en la forzosa, solo salir).
- **PvP y los videos** no la miran.
- **Cómo se maneja:** solo desde el SQL Editor. Encender o cambiar: `select * from public.valvula_ia(<tope>);`. Apagar: `select * from public.valvula_ia(null);`. El estado está en `ajustes_economia` y cada cambio queda en `valvula_cambios`. El cliente no puede leerla ni tocarla.

## 7. Conteos del servidor
- Video de recompensa: 500 HC, tope de 8 por día. Se cobra contra un boleto emitido al empezar, cobrable una sola vez y solo pasados los segundos mínimos. Cerrar antes de tiempo no cobra y no cuenta para el tope.
- **Constancia:** 500 HC cada 3 días seguidos de ingreso, igual para todos (Premium o no).
  - **Ingreso** = abrir la app con sesión y perfil. Cuenta una vez por día de Chicago, con el reloj del servidor. Abrirla otra vez el mismo día no cuenta ni cobra.
  - **La racha:** el primer ingreso es el día 1; ingresar el día siguiente suma uno; **faltar un día la devuelve a 1**. Las cuentas anteriores a la 1d empiezan en 0: su primer ingreso es el día 1.
  - **El cobro:** cuando la racha llega a 3, 6, 9… (múltiplo de 3). La cuenta sigue después de cobrar. Es automático al abrir la app, con el aviso de saldo («+500 HC por tu constancia.»). Un solo cobro por jugador y día, aunque dos dispositivos abran a la vez.
  - **Lo que se ve:** en el lobby, entre la píldora y el ajuste, tres monedas pequeñas y «n/3». Si en el mismo arranque se recoge una mesa y se cobra la constancia, los dos avisos salen en fila, uno tras otro.
- **Límite de frecuencia por minuto** en toda función que mueve dinero (las lecturas, como `mi_billetera`, no lo llevan), sin raise al anotar: sentarse 10, recargar 20, salir 30, recoger la mesa al arrancar 10, marcar el ingreso 6. `informar_pila` no mueve dinero y no lo lleva: su abuso lo acotan el número de secuencia y que solo escribe en la mesa propia.
- **Un límite nunca atrapa dinero.** La respuesta «límite» se trata como «no contesta»: el teléfono reintenta lo mismo con espera, nunca lo da por rechazado. Una salida o una recogida cortadas dejan la mesa abierta con su última pila, y la cobra la siguiente salida que quepa, la recogida al arrancar o el cierre al sentarse en otra.

## 8. PvP
- Cada jugador se sienta con una entrada fija sacada de su saldo real (Corta 15× / Llena 50×), en garantía mientras dura la mesa; lo que gana o pierde vuelve a su saldo. Lo implementan MOT-1 y MES-PvP.
- **MES-PvP aplica la regla C4 de §5 con la misma pieza de cierre** que las mesas contra las IAS: abrir una partida PvP cierra la que hubiera abierta, en cualquier modo, y al revés.

## 9. Celebración
- El «Saldo actual» de la pantalla de victoria cuenta el saldo real, no las fichas de la mesa: la cifra que devuelve el cobro de la mesa ganada.

## 10. Administración
- Victor puede ajustar saldos desde el SQL Editor con `ajuste_admin`, que exige un motivo y queda anotado en el libro.
