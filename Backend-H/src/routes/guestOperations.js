const router=require('express').Router();
const Joi=require('joi');
const db=require('../config/database');
const validate=require('../middleware/validation');
const authorize=require('../middleware/authorization');
const {sendSuccess}=require('../utils/response');
const requests=require('../services/reservationRequestService');
const fail=require('../utils/businessError');
router.param('paymentId',(req,res,next,value)=>Joi.string().guid().validate(value).error?next(fail('ID no válido',400)):next());
const wrap=fn=>(req,res,next)=>Promise.resolve(fn(req,res)).catch(next);
router.get('/reservation-requests',validate(Joi.object({status:Joi.string().valid('pending','approved','rejected').default('pending'),page:Joi.number().integer().min(1).max(100000).default(1)}),'query'),wrap(async(req,res)=>sendSuccess(res,(await db.query(`SELECT q.*,to_char(q.check_in,'YYYY-MM-DD') AS check_in,to_char(q.check_out,'YYYY-MM-DD') AS check_out,c.name AS client_name,r.total_price,r.status AS reservation_status FROM reservation_request q JOIN client c ON c.id=q.client_id JOIN reservation r ON r.id=q.reservation_id WHERE q.status=$1 ORDER BY q.id DESC LIMIT 20 OFFSET $2`,[req.query.status,(req.query.page-1)*20])).rows)));
router.post('/reservation-requests/:id/review',authorize('admin','manager'),validate(Joi.object({decision:Joi.string().valid('approved','rejected').required(),response:Joi.string().trim().min(5).max(1000).required(),total_price:Joi.number().min(0).max(99999999.99).precision(2).strict()})),wrap(async(req,res)=>sendSuccess(res,await requests.review(req.user,req.params.id,req.body))));
router.get('/email-status',authorize('admin'),wrap(async(req,res)=>sendSuccess(res,{configured:require('../services/mailService').configured(),demo:process.env.MAIL_DEMO==='true',messages:(await db.query(`SELECT id,recipient,subject,attempts,sent_at,last_error,created_at FROM email_outbox ORDER BY id DESC LIMIT 50`)).rows})));
router.post('/email-status/:id/retry',authorize('admin'),wrap(async(req,res)=>{await db.query('UPDATE email_outbox SET attempts=0,available_at=now() WHERE id=$1 AND sent_at IS NULL',[req.params.id]);sendSuccess(res,{queued:true});}));
router.get('/presentation',authorize('admin','manager'),wrap(async(req,res)=>sendSuccess(res,{hotel:(await db.query('SELECT description,cover_image,request_notice_hours,deposit_percent,payment_due_hours FROM hotel_settings WHERE id=1')).rows[0],rooms:(await db.query('SELECT id,name,description,image_url FROM room_type ORDER BY id LIMIT 100')).rows})));
const image=Joi.string().max(500).pattern(/^(\/images\/[a-zA-Z0-9_./-]+|https:\/\/[^\s]+)$/).allow('');
router.put('/presentation',authorize('admin'),validate(Joi.object({description:Joi.string().max(3000).allow('').required(),cover_image:image.required(),request_notice_hours:Joi.number().integer().min(0).max(720).required(),deposit_percent:Joi.number().integer().min(1).max(100).required(),payment_due_hours:Joi.number().integer().min(1).max(168).required(),rooms:Joi.array().max(100).items(Joi.object({id:Joi.number().integer().positive().required(),description:Joi.string().max(3000).allow('').required(),image_url:image.required()})).unique('id').required()})),wrap(async(req,res)=>{
 await db.transaction(async c=>{
  const d=req.body;await c.query('UPDATE hotel_settings SET description=$1,cover_image=$2,request_notice_hours=$3,deposit_percent=$4,payment_due_hours=$5,version=version+1,updated_at=now() WHERE id=1',[d.description,d.cover_image,d.request_notice_hours,d.deposit_percent,d.payment_due_hours]);
  for(const r of d.rooms){if(!(await c.query('UPDATE room_type SET description=$1,image_url=$2 WHERE id=$3',[r.description,r.image_url,r.id])).rowCount)throw fail('Tipo de habitación no encontrado',404);}
 });sendSuccess(res,{saved:true});
}));
router.post('/online-payments/:paymentId/refund',authorize('admin','manager'),wrap(async(req,res)=>sendSuccess(res,await require('../services/onlinePaymentService').refund(req.params.paymentId))));
router.get('/online-payments',authorize('admin','manager'),wrap(async(req,res)=>sendSuccess(res,(await db.query('SELECT id,reservation_id,provider,amount,currency,status,created_at,expires_at FROM online_payment ORDER BY created_at DESC LIMIT 100')).rows)));
router.get('/backup-status',authorize('admin'),wrap(async(req,res)=>{
 const fs=require('fs/promises');
 let latest=null;
 try{const data=JSON.parse(await fs.readFile('/backups/latest.json','utf8'));latest={verified_at:data.verified_at,archive:data.archive,restored:data.restored===true};}catch(error){if(error.code!=='ENOENT')throw fail('No se pudo leer el estado de los respaldos',503);}
 sendSuccess(res,{latest,storage:'Volumen local separado de PostgreSQL',offsite_configured:false});
}));
module.exports=router;
