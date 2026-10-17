const router=require('express').Router();
const Joi=require('joi');
const db=require('../config/database');
const validate=require('../middleware/validation');
const {sendSuccess,sendCreated}=require('../utils/response');
const requests=require('../services/reservationRequestService');
const {bookingSchema}=require('../validators/portalBookingValidator');
const wrap=fn=>(req,res,next)=>Promise.resolve(fn(req,res)).catch(next);
const dates=bookingSchema.extract('check_in');
const requestSchema=Joi.object({kind:Joi.string().valid('dates','cancel').required(),reason:Joi.string().trim().min(5).max(1000).required(),check_in:Joi.when('kind',{is:'dates',then:dates,otherwise:Joi.forbidden()}),check_out:Joi.when('kind',{is:'dates',then:dates,otherwise:Joi.forbidden()})});
router.get('/reservations/:id/requests',wrap(async(req,res)=>sendSuccess(res,(await db.query(`SELECT q.id,q.kind,to_char(q.check_in,'YYYY-MM-DD') AS check_in,to_char(q.check_out,'YYYY-MM-DD') AS check_out,q.reason,q.status,q.response,q.created_at,q.reviewed_at FROM reservation_request q JOIN reservation r ON r.id=q.reservation_id WHERE r.id=$1 AND r.client_id=$2 ORDER BY q.id DESC LIMIT 50`,[req.params.id,req.user.client_id])).rows)));
router.post('/reservations/:id/requests',validate(requestSchema),wrap(async(req,res)=>sendCreated(res,await requests.create(req.user,req.params.id,req.body),'Solicitud enviada. La reserva conserva sus condiciones hasta la aprobación del hotel.')));
router.get('/presentation',wrap(async(req,res)=>{
 const hotel=(await db.query('SELECT hotel_name,description,cover_image,email,phone,address,city,request_notice_hours,deposit_percent,payment_due_hours FROM hotel_settings WHERE id=1')).rows[0];
 const rooms=(await db.query('SELECT id,name,description,capacity,price,image_url FROM room_type WHERE is_active ORDER BY price,id LIMIT 100')).rows;
 sendSuccess(res,{hotel,rooms,payments:{enabled:require('../services/onlinePaymentService').enabled(),demo:process.env.PAYMENT_PROVIDER==='demo'}});
}));
router.use(require('./onlinePayments'));
module.exports=router;
