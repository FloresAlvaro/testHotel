const router=require('express').Router();
const Joi=require('joi');
const db=require('../config/database');
const validate=require('../middleware/validation');
const authorize=require('../middleware/authorization');
const {sendSuccess,sendPaginated}=require('../utils/response');
const requests=require('../services/reservationRequestService');
const fail=require('../utils/businessError');
router.param('paymentId',(req,res,next,value)=>Joi.string().guid().validate(value).error?next(fail('ID no válido',400)):next());
const wrap=fn=>(req,res,next)=>Promise.resolve(fn(req,res)).catch(next);
router.get('/reservation-requests',validate(require('../validators/listValidator').schema(['pending','approved','rejected']),'query'),wrap(async(req,res)=>{
 const result=await require('../services/tableListService').list('requests',{...req.query,status:req.query.status||'pending'});
 sendPaginated(res,result.rows,result.total,req.query.page,req.query.pageSize);
}));
router.post('/reservation-requests/:id/review',authorize('admin','manager'),validate(Joi.object({decision:Joi.string().valid('approved','rejected').required(),response:Joi.string().trim().min(5).max(1000).required(),total_price:Joi.number().min(0).max(99999999.99).precision(2).strict()})),wrap(async(req,res)=>sendSuccess(res,await requests.review(req.user,req.params.id,req.body))));
router.get('/email-status',authorize('admin'),validate(require('../validators/listValidator').schema(['sent','queued','failed']),'query'),wrap(async(req,res)=>{
 const result=await require('../services/tableListService').list('mail',req.query);
 const mail=require('../services/mailService');
 sendPaginated(res,result.rows,result.total,req.query.page,req.query.pageSize,undefined,{configured:mail.configured(),demo:process.env.MAIL_DEMO==='true'});
}));
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
router.get('/online-payments',authorize('admin','manager'),validate(require('../validators/listValidator').schema(['pending','paid','expired','refunded','refund_pending','failed']),'query'),wrap(async(req,res)=>{
 const result=await require('../services/tableListService').list('onlinePayments',req.query);
 sendPaginated(res,result.rows,result.total,req.query.page,req.query.pageSize);
}));
router.get('/backup-status',authorize('admin'),wrap(async(req,res)=>{
 const fs=require('fs/promises');
 let latest=null;
 try{const data=JSON.parse(await fs.readFile('/backups/latest.json','utf8'));latest={verified_at:data.verified_at,archive:data.archive,restored:data.restored===true,offsite_verified:data.offsite_verified===true};}catch(error){if(error.code!=='ENOENT')throw fail('No se pudo leer el estado de los respaldos',503);}
 let status=null;
 try{status=JSON.parse(await fs.readFile('/backups/status.json','utf8'));}catch(error){if(error.code!=='ENOENT')throw fail('No se pudo leer el resultado del respaldo',503);}
 sendSuccess(res,{latest,status,storage:'Volumen local separado de PostgreSQL',offsite_configured:latest?.offsite_verified===true});
}));
module.exports=router;
