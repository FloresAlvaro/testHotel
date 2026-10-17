const router=require('express').Router();
const Joi=require('joi');
const db=require('../config/database');
const service=require('../services/operationsService');
const authorize=require('../middleware/authorization');
const {sendSuccess,sendCreated,sendPaginated}=require('../utils/response');
const fail=require('../utils/businessError');
const wrap=fn=>(req,res,next)=>Promise.resolve(fn(req,res)).catch(next);
const valid=(schema,source='body')=>(req,res,next)=>{const {error,value}=schema.validate(req[source],{abortEarly:false});if(error)return res.status(400).json({success:false,message:error.details.map(d=>d.message).join('; ')});req[source]=value;next();};
const id=Joi.number().integer().positive();
const money=Joi.number().min(0).max(99999999.99).precision(2).strict();
const note=Joi.string().max(2000).allow('').default('');
const date=Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).custom((v,h)=>!Number.isNaN(Date.parse(v))&&new Date(v).toISOString().slice(0,10)===v?v:h.error('any.invalid'));
router.param('id',(req,res,next,value)=>{if(!/^\d+$/.test(value)||Number(value)<1)return res.status(400).json({success:false,message:'ID no válido'});next();});
router.get('/settings',wrap(async(req,res)=>sendSuccess(res,await service.getSettings())));
router.put('/settings',authorize('admin'),valid(Joi.object({hotel_name:Joi.string().trim().max(200).required(),city:Joi.string().max(100).allow('').required(),email:Joi.string().email({tlds:false}).max(200).allow('').required(),phone:Joi.string().max(40).allow('').required(),address:Joi.string().max(300).allow('').required(),check_in_time:Joi.string().pattern(/^([01]\d|2[0-3]):[0-5]\d(:00)?$/).required(),check_out_time:Joi.string().pattern(/^([01]\d|2[0-3]):[0-5]\d(:00)?$/).required(),currency:Joi.string().valid('BOB','USD','EUR').required(),timezone:Joi.string().max(100).required(),version:id.required()})),wrap(async(req,res)=>sendSuccess(res,await service.saveSettings(req.body))));
router.get('/cash-shifts',wrap(async(req,res)=>sendSuccess(res,await service.listShifts(req.user))));
router.post('/cash-shifts',valid(Joi.object({opening_amount:money.required(),notes:note})),wrap(async(req,res)=>sendCreated(res,await service.openShift(req.user,req.body))));
router.post('/cash-shifts/:id/close',valid(Joi.object({counted_amount:money.required(),notes:note})),wrap(async(req,res)=>sendSuccess(res,await service.closeShift(req.user,req.params.id,req.body))));
router.get('/receipts/:id',wrap(async(req,res)=>{
 const receipt=(await db.query('SELECT r.*,p.status AS payment_status FROM payment_receipt r JOIN payment p ON p.id=r.payment_id WHERE payment_id=$1',[req.params.id])).rows[0];
 if(!receipt)throw fail('El pago todavía no tiene comprobante',404);sendSuccess(res,receipt);
}));
router.get('/task-assignees',wrap(async(req,res)=>sendSuccess(res,(await db.query(`SELECT id,name FROM "user" WHERE is_active=true AND role<>'customer' ORDER BY name`)).rows)));
router.get('/tasks',valid(Joi.object({status:Joi.string().valid('pending','in_progress','completed'),page:id.default(1),pageSize:id.max(100).default(20)}),'query'),wrap(async(req,res)=>{
 const {status,page,pageSize}=req.query;
 const where='WHERE ($1::text IS NULL OR t.status=$1)';
 const count=await db.query(`SELECT COUNT(*) FROM housekeeping_task t ${where}`,[status||null]);
 const rows=await db.query(`SELECT t.*,r.number AS room_number,u.name AS assigned_name FROM housekeeping_task t JOIN room r ON r.id=t.room_id LEFT JOIN "user" u ON u.id=t.assigned_to ${where} ORDER BY t.status='completed',t.id DESC LIMIT $2 OFFSET $3`,[status||null,pageSize,(page-1)*pageSize]);
 sendPaginated(res,rows.rows,count.rows[0].count,page,pageSize);
}));
router.post('/tasks',authorize('admin','manager'),valid(Joi.object({room_id:id.required(),kind:Joi.string().valid('cleaning','maintenance').required(),title:Joi.string().trim().max(200).required(),notes:note,assigned_to:id.allow(null).default(null)})),wrap(async(req,res)=>sendCreated(res,await service.createTask(req.user,req.body))));
router.patch('/tasks/:id',valid(Joi.object({status:Joi.string().valid('pending','in_progress','completed'),notes:Joi.string().max(2000).allow(''),assigned_to:id.allow(null)}).min(1)),wrap(async(req,res)=>sendSuccess(res,await service.updateTask(req.user,req.params.id,req.body))));
router.get('/calendar',valid(Joi.object({start:date.required(),end:date.required(),page:id.default(1),pageSize:id.max(100).default(30)}),'query'),wrap(async(req,res)=>{
 const {start,end,page,pageSize}=req.query;
 if(Date.parse(end)<=Date.parse(start)||Date.parse(end)-Date.parse(start)>62*86400000)throw fail('Selecciona un intervalo de 1 a 62 días',400);
 const rooms=(await db.query('SELECT r.id,r.number,r.floor,r.status,rt.name AS room_type_name FROM room r JOIN room_type rt ON rt.id=r.room_type_id ORDER BY r.floor,r.number LIMIT $1 OFFSET $2',[pageSize,(page-1)*pageSize])).rows;
 const reservations=(await db.query(`SELECT r.id,r.room_id,r.status,to_char(r.check_in,'YYYY-MM-DD') AS check_in,to_char(r.check_out,'YYYY-MM-DD') AS check_out,c.name AS client_name FROM reservation r JOIN client c ON c.id=r.client_id WHERE r.room_id=ANY($1::int[]) AND r.status<>'cancelled' AND r.check_in<$3::date AND r.check_out>$2::date ORDER BY r.check_in`,[rooms.map(r=>r.id),start,end])).rows;
 sendSuccess(res,{rooms,reservations,total:Number((await db.query('SELECT COUNT(*) FROM room')).rows[0].count),page,pageSize});
}));
router.get('/audit',authorize('admin','manager'),valid(Joi.object({table:Joi.string().valid('reservation','payment','room','client','user','hotel_settings','housekeeping_task','cash_shift','room_type','check_in_log'),action:Joi.string().valid('INSERT','UPDATE','DELETE'),user_id:id,record_id:id,start:date,end:date,page:id.default(1),pageSize:id.max(100).default(20)}),'query'),wrap(async(req,res)=>{
 const q=req.query;const params=[q.table||null,q.action||null,q.user_id||null,q.record_id||null,q.start||null,q.end||null];
 const where='WHERE ($1::text IS NULL OR a.table_name=$1) AND ($2::text IS NULL OR a.action=$2) AND ($3::int IS NULL OR a.user_id=$3) AND ($4::int IS NULL OR a.record_id=$4) AND ($5::date IS NULL OR a.created_at>=$5::date) AND ($6::date IS NULL OR a.created_at<($6::date+1))';
 const count=await db.query(`SELECT COUNT(*) FROM audit_log a ${where}`,params);
 const rows=await db.query(`SELECT a.id,a.user_id,a.action,a.table_name,a.record_id,(a.old_value-'password') AS old_value,(a.new_value-'password') AS new_value,a.ip_address,a.created_at,u.name AS user_name FROM audit_log a LEFT JOIN "user" u ON u.id=a.user_id ${where} ORDER BY a.id DESC LIMIT $7 OFFSET $8`,[...params,q.pageSize,(q.page-1)*q.pageSize]);sendPaginated(res,rows.rows,count.rows[0].count,q.page,q.pageSize);
}));
router.use(require('./guestOperations'));
module.exports=router;
