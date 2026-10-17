const db = require('../config/database');
const fail = require('../utils/businessError');
const Reservation = require('../models/Reservation');
const Room = require('../models/Room');
const { cents } = require('../utils/money');

const validStay = async (connection, arrival, departure) => {
  const result = await connection.query(`SELECT $1::date >= CURRENT_DATE AS future,
    ($2::date-$1::date) AS nights`, [arrival, departure]);
  const { future, nights } = result.rows[0];
  if (!future) throw fail('La llegada no puede ser anterior a hoy en la zona horaria del hotel', 400);
  if (nights < 1 || nights > 365) throw fail('Selecciona una estancia de 1 a 365 noches', 400);
  return nights;
};
const availableWhere = `FROM room rm JOIN room_type rt ON rt.id=rm.room_type_id
  WHERE rm.status<>'maintenance' AND rt.is_active=true AND rt.capacity >= $3
    AND rt.price*($2::date-$1::date)<=99999999.99
    AND NOT EXISTS(SELECT 1 FROM housekeeping_task t WHERE t.room_id=rm.id AND t.status<>'completed')
    AND NOT EXISTS(SELECT 1 FROM reservation r WHERE r.room_id=rm.id AND r.status<>'cancelled'
      AND r.check_in<$2::date AND r.check_out>$1::date)`;

const availability = data => db.transaction(async connection => {
  const nights = await validStay(connection, data.check_in, data.check_out);
  const settings = (await connection.query('SELECT currency FROM hotel_settings WHERE id=1')).rows[0];
  const guests=(data.adults??1)+(data.children??0);
  if(guests>20)throw fail('La ocupación máxima es de 20 personas por reserva',400);
  const values = [data.check_in, data.check_out,guests];
  const count = await connection.query(`SELECT COUNT(*) ${availableWhere}`, values);
  const result = await connection.query(`SELECT rm.id,rm.number,rt.name AS room_type_name,rt.capacity,rt.price,rt.description,rt.image_url,
    (rt.price*($2::date-$1::date))::numeric(10,2) AS total_price ${availableWhere}
    ORDER BY rt.price,rm.number LIMIT $4 OFFSET $5`, [...values, data.pageSize, (data.page-1)*data.pageSize]);
  return { rooms: result.rows, total: Number(count.rows[0].count), nights, currency: settings.currency };
});

const create = (user, data) => db.transaction(async connection => {
  const nights = await validStay(connection, data.check_in, data.check_out);
  if((data.adults??1)+(data.children??0)>20)throw fail('La ocupación máxima es de 20 personas por reserva',400);
  // Mismo orden de bloqueo que las reservas del personal: habitación antes que reserva.
  const room = (await connection.query(`SELECT rm.id,rm.status,rt.price,rt.is_active FROM room rm
    JOIN room_type rt ON rt.id=rm.room_type_id WHERE rm.id=$1 FOR UPDATE OF rm FOR SHARE OF rt`, [data.room_id])).rows[0];
  if (!room) throw fail('La habitación ya no está disponible', 409);
  const identity = await connection.query(`SELECT u.id FROM "user" u JOIN client c ON c.id=u.client_id
    WHERE u.id=$1 AND u.role='customer' AND u.client_id=$2 AND u.is_active AND c.is_active FOR SHARE OF u,c`, [user.id,user.client_id]);
  if (!identity.rowCount) throw fail('El acceso del huésped está desactivado',403);
  const ready = await connection.query(`SELECT rm.id ${availableWhere} AND rm.id=$4`, [data.check_in,data.check_out,(data.adults??1)+(data.children??0),data.room_id]);
  if (!ready.rowCount) throw fail('Otra reserva o un bloqueo cambió la disponibilidad. Consulta nuevamente.',409);
  const currency = (await connection.query('SELECT currency FROM hotel_settings WHERE id=1 FOR SHARE')).rows[0].currency;
  const totalCents = cents(room.price) * nights;
  if (totalCents > 9999999999) throw fail('El importe supera el máximo permitido',400);
  if (totalCents !== cents(data.expected_total) || currency !== data.expected_currency) {
    throw fail('La tarifa o moneda cambió. Consulta nuevamente antes de confirmar.',409);
  }
  const reservation = await Reservation.create({check_in:data.check_in,check_out:data.check_out,
    room_id:room.id,client_id:user.client_id,user_id:user.id,total_price:(totalCents/100).toFixed(2),notes:null,adults:data.adults??1,children:data.children??0,arrival_time:data.arrival_time,special_requests:data.special_requests},connection);
  await Room.syncReservationStatus(room.id,connection);
  return {id:reservation.id,status:reservation.status,check_in:data.check_in,check_out:data.check_out,total_price:reservation.total_price,currency};
});
module.exports = { availability, create };
