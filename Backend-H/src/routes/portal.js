const express = require('express');
const Joi = require('joi');
const db = require('../config/database');
const fail = require('../utils/businessError');
const { sendSuccess, sendPaginated, sendCreated } = require('../utils/response');
const router = express.Router();
const wrap = handler => (req,res,next) => Promise.resolve(handler(req,res)).catch(next);
const publicReservation = `r.id,to_char(r.check_in,'YYYY-MM-DD') AS check_in,to_char(r.check_out,'YYYY-MM-DD') AS check_out,
  (r.status='confirmed' AND ((r.check_in+(SELECT check_in_time FROM hotel_settings WHERE id=1)) AT TIME ZONE (SELECT timezone FROM hotel_settings WHERE id=1))>now()+(SELECT request_notice_hours FROM hotel_settings WHERE id=1)*interval '1 hour') AS can_request,r.status,r.total_price,r.adults,r.children,to_char(r.arrival_time,'HH24:MI') AS arrival_time,r.special_requests,rm.number AS room_number,rt.name AS room_type_name,
  COALESCE((SELECT SUM(p.amount) FROM payment p WHERE p.reservation_id=r.id AND p.status='completed'),0) AS paid_amount`;
const reservationJoin = 'FROM reservation r JOIN room rm ON rm.id=r.room_id JOIN room_type rt ON rt.id=rm.room_type_id';
router.param('id',(req,res,next,id)=> {
  if(!/^\d+$/.test(id) || !Number.isSafeInteger(Number(id)) || Number(id)<1) return next(fail('ID no válido',400));
  next();
});
const booking = require('../services/portalBookingService');
const validate = require('../middleware/validation');
const { availabilitySchema, bookingSchema } = require('../validators/portalBookingValidator');
router.get('/availability',validate(availabilitySchema,'query'),wrap(async(req,res)=> {
  sendSuccess(res,await booking.availability(req.query));
}));
router.post('/reservations',validate(bookingSchema),wrap(async(req,res)=> {
  sendCreated(res,await booking.create(req.user,req.body),'Tu reserva está confirmada');
}));
router.get('/hotel',wrap(async(req,res)=>{
  const result=await db.query('SELECT hotel_name,city,email,phone,address,check_in_time,check_out_time,currency,timezone,version FROM hotel_settings WHERE id=1');
  sendSuccess(res,result.rows[0]);
}));
router.get('/profile',wrap(async(req,res)=>{
  const result=await db.query('SELECT name,email,phone FROM client WHERE id=$1',[req.user.client_id]);
  if(!result.rowCount) throw fail('Perfil no disponible',404);
  sendSuccess(res,result.rows[0]);
}));
router.get('/next-stay',wrap(async(req,res)=>{
  const result=await db.query(`SELECT ${publicReservation} ${reservationJoin}
    WHERE r.client_id=$1 AND (r.status='checked_in' OR (r.status='confirmed' AND r.check_out>CURRENT_DATE))
    ORDER BY r.status='checked_in' DESC,r.check_in ASC,r.id ASC LIMIT 1`,[req.user.client_id]);
  sendSuccess(res,result.rows[0]||null);
}));
router.get('/reservations',wrap(async(req,res)=>{
  const schema=Joi.object({page:Joi.number().integer().min(1).max(100000).default(1),pageSize:Joi.number().integer().min(1).max(100).default(10),status:Joi.string().valid('confirmed','checked_in','checked_out','cancelled')});
  const {error,value}=schema.validate(req.query);
  if(error) throw fail('Filtros de reservas no válidos',400);
  const {page,pageSize,status}=value;
  const params=[req.user.client_id,status||null];
  const where='WHERE r.client_id=$1 AND ($2::text IS NULL OR r.status::text=$2)';
  const count=await db.query(`SELECT COUNT(*) FROM reservation r ${where}`,params);
  const result=await db.query(`SELECT ${publicReservation} ${reservationJoin} ${where}
    ORDER BY r.status='checked_in' DESC,r.status='confirmed' DESC,r.check_in DESC,r.id DESC LIMIT $3 OFFSET $4`,[...params,pageSize,(page-1)*pageSize]);
  sendPaginated(res,result.rows,count.rows[0].count,page,pageSize);
}));
router.get('/reservations/:id',wrap(async(req,res)=>{
  // La pertenencia se impone en SQL, sin aceptar client_id del navegador o del token.
  const result=await db.query(`SELECT ${publicReservation} ${reservationJoin} WHERE r.id=$1 AND r.client_id=$2`,[req.params.id,req.user.client_id]);
  if(!result.rowCount) throw fail('Reserva no encontrada',404);
  const payments=await db.query(`SELECT p.id,p.amount,p.type,p.method,p.status,p.created_at,EXISTS(SELECT 1 FROM payment_receipt pr WHERE pr.payment_id=p.id) AS has_receipt
    FROM payment p JOIN reservation r ON r.id=p.reservation_id WHERE r.id=$1 AND r.client_id=$2 ORDER BY p.created_at,p.id`,[req.params.id,req.user.client_id]);
  sendSuccess(res,{...result.rows[0],payments:payments.rows});
}));
router.get('/receipts/:id',wrap(async(req,res)=>{
  const result=await db.query(`SELECT pr.number,pr.issued_at,pr.snapshot,p.status AS payment_status FROM payment_receipt pr
    JOIN payment p ON p.id=pr.payment_id JOIN reservation r ON r.id=p.reservation_id WHERE p.id=$1 AND r.client_id=$2`,[req.params.id,req.user.client_id]);
  if(!result.rowCount) throw fail('Comprobante no encontrado',404);
  const receipt=result.rows[0], snapshot=receipt.snapshot;
  // DTO explícito: no devuelve observaciones internas, referencias bancarias ni quién emitió el cobro.
  sendSuccess(res,{
    number:receipt.number,issued_at:receipt.issued_at,payment_status:receipt.payment_status,
    snapshot:{
      hotel:{hotel_name:snapshot.hotel.hotel_name,city:snapshot.hotel.city,address:snapshot.hotel.address,email:snapshot.hotel.email,phone:snapshot.hotel.phone,currency:snapshot.hotel.currency,timezone:snapshot.hotel.timezone},
      payment:{id:snapshot.payment.id,amount:snapshot.payment.amount,method:snapshot.payment.method},
      client_name:snapshot.client_name,room_number:snapshot.room_number,reservation_id:snapshot.reservation_id,historical:snapshot.historical===true
    }
  });
}));
router.use(require('./guestServices'));
module.exports=router;
