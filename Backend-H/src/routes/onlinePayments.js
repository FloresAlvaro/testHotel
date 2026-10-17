const router=require('express').Router();
const Joi=require('joi');
const validate=require('../middleware/validation');
const db=require('../config/database');
const fail=require('../utils/businessError');
const service=require('../services/onlinePaymentService');
const {sendSuccess,sendCreated}=require('../utils/response');
const wrap=fn=>(req,res,next)=>Promise.resolve(fn(req,res)).catch(next);
router.param('paymentId',(req,res,next,id)=>{if(Joi.string().guid().validate(id).error)return next(fail('ID no válido',400));next();});
router.post('/reservations/:id/checkout',validate(Joi.object({mode:Joi.string().valid('deposit','balance').required()})),wrap(async(req,res)=>sendCreated(res,await service.create(req.user,req.params.id,req.body.mode))));
router.get('/online-payments/:paymentId',wrap(async(req,res)=>{
 const p=(await db.query('SELECT * FROM online_payment WHERE id=$1 AND user_id=$2',[req.params.paymentId,req.user.id])).rows[0];
 if(!p)throw fail('Pago no encontrado',404);sendSuccess(res,{...service.view(p),reservation_id:p.reservation_id});
}));
router.post('/online-payments/:paymentId/demo-confirm',wrap(async(req,res)=>sendSuccess(res,await service.demoPay(req.user,req.params.paymentId))));
module.exports=router;
