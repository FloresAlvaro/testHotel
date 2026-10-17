const db=require('../config/database');
const fail=require('../utils/businessError');
const lockReservation=require('./reservationLock');
const Reservation=require('../models/Reservation');
const Room=require('../models/Room');
const {cents}=require('../utils/money');
const assertAllowed=async(c,r)=>{
 const rule=(await c.query(`SELECT request_notice_hours,(($1::date+check_in_time) AT TIME ZONE timezone)>now()+request_notice_hours*interval '1 hour' AS allowed FROM hotel_settings WHERE id=1`,[r.check_in])).rows[0];
 if(r.status!=='confirmed'||!rule.allowed)throw fail(`Las solicitudes se permiten en reservas confirmadas hasta ${rule.request_notice_hours} horas antes de la llegada`,409);
};
const create=(user,id,data)=>db.transaction(async c=>{
 const r=(await c.query("SELECT id,to_char(check_in,'YYYY-MM-DD') AS check_in,status FROM reservation WHERE id=$1 AND client_id=$2 FOR UPDATE",[id,user.client_id])).rows[0];
 if(!r)throw fail('Reserva no encontrada',404);
 await assertAllowed(c,r);
 if(data.kind==='dates'){
  const valid=(await c.query('SELECT $1::date>=CURRENT_DATE AND $2::date>$1::date AND $2::date-$1::date<=365 AS valid',[data.check_in,data.check_out])).rows[0].valid;
  if(!valid)throw fail('Selecciona fechas válidas de 1 a 365 noches',400);
 }
 return (await c.query('INSERT INTO reservation_request(reservation_id,client_id,kind,check_in,check_out,reason) VALUES($1,$2,$3,$4,$5,$6) RETURNING *',[id,user.client_id,data.kind,data.check_in||null,data.check_out||null,data.reason])).rows[0];
});
const review=(user,id,data)=>db.transaction(async c=>{
 const snapshot=(await c.query('SELECT reservation_id FROM reservation_request WHERE id=$1',[id])).rows[0];
 if(!snapshot)throw fail('Solicitud no encontrada',404);
 const {reservation:r,room}=await lockReservation(snapshot.reservation_id,c);
 const request=(await c.query('SELECT * FROM reservation_request WHERE id=$1 FOR UPDATE',[id])).rows[0];
 if(request.status!=='pending')throw fail('La solicitud ya fue revisada',409);
 if(data.decision==='approved'){
  if(r.status!=='confirmed')throw fail('La reserva ya no admite cambios',409);
  if((await c.query("SELECT 1 FROM online_payment WHERE reservation_id=$1 AND status IN ('pending','refund_pending')",[r.id])).rowCount)throw fail('Resuelve o espera el vencimiento del pago en línea antes de aprobar',409);
  if(request.kind==='cancel')await Reservation.cancel(r.id,c);
  else{
   const dates=(await c.query("SELECT to_char($1::date,'YYYY-MM-DD') AS arrival,to_char($2::date,'YYYY-MM-DD') AS departure,$2::date-$1::date AS nights,$1::date>=CURRENT_DATE AS future",[request.check_in,request.check_out])).rows[0];
   if(!dates.future||room.status==='maintenance'||await Reservation.hasOverlap(r.room_id,dates.arrival,dates.departure,r.id,c))throw fail('Las fechas solicitadas ya no están disponibles',409);
   // El hotel aprueba explícitamente el precio que comunicará al huésped.
   const paid=(await c.query("SELECT COALESCE(SUM(amount),0) AS total FROM payment WHERE reservation_id=$1 AND status='completed'",[r.id])).rows[0].total;
   if(data.total_price===undefined||cents(data.total_price)<cents(paid))throw fail('Indica un total que cubra los pagos realizados',400);
   await Reservation.update(r.id,{...r,check_in:dates.arrival,check_out:dates.departure,total_price:data.total_price},c);
  }
  await Room.syncReservationStatus(r.room_id,c);
 }
 const result=(await c.query('UPDATE reservation_request SET status=$1,response=$2,reviewed_by=$3,reviewed_at=now() WHERE id=$4 RETURNING *',[data.decision,data.response,user.id,id])).rows[0];
 await c.query(`INSERT INTO email_outbox(recipient,subject,body,event_key) SELECT COALESCE((SELECT email FROM "user" WHERE client_id=client.id AND is_active LIMIT 1),email),'Respuesta a tu solicitud #'||$1,$2,'request:'||$1 FROM client WHERE id=$3 AND COALESCE((SELECT email FROM "user" WHERE client_id=client.id AND is_active LIMIT 1),email,'')<>''`,[id,`Tu solicitud fue ${data.decision==='approved'?'aprobada':'rechazada'}. ${data.response}`,request.client_id]);
 return result;
});
module.exports={create,review};
