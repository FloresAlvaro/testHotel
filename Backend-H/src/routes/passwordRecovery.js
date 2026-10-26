const router=require('express').Router();
const Joi=require('joi');
const crypto=require('crypto');
const db=require('../config/database');
const validate=require('../middleware/validation');
const {hashPassword}=require('../utils/password');
const fail=require('../utils/businessError');
const mail=require('../services/mailService');
const wrap=fn=>(req,res,next)=>Promise.resolve(fn(req,res)).catch(next);
const limiter=require('express-rate-limit')({windowMs:15*60*1000,max:10,standardHeaders:true,legacyHeaders:false});
const hash=require('../utils/tokenHash');
const accountLimiter=require('../middleware/accountRateLimit')(5,false);
router.post('/forgot-password',limiter,accountLimiter,validate(Joi.object({email:Joi.string().email({tlds:false}).max(254).required()})),wrap(async(req,res)=>{
 if(!mail.configured())throw fail('La recuperación por correo aún no está configurada. Contacta con recepción.',503);
 const token=crypto.randomBytes(32).toString('hex');
 await db.transaction(async c=>{
  const u=(await c.query('SELECT id FROM "user" WHERE lower(email)=lower($1) AND is_active FOR UPDATE',[req.body.email])).rows[0];
  if(!u)return;
  const recent=await c.query("SELECT 1 FROM password_reset WHERE user_id=$1 AND created_at>now()-interval '1 minute'",[u.id]);
  if(recent.rowCount)return;
  await c.query('UPDATE password_reset SET used_at=now() WHERE user_id=$1 AND used_at IS NULL',[u.id]);
  const reset=(await c.query("INSERT INTO password_reset(user_id,token_hash,expires_at) VALUES($1,$2,now()+interval '30 minutes') RETURNING id",[u.id,hash(token)])).rows[0];
  const url=new URL('/auth/reset-password',process.env.APP_URL||'http://localhost:3001');url.searchParams.set('token',token);
  await c.query(`INSERT INTO email_outbox(recipient,subject,body,event_key) SELECT email,'Restablece tu contraseña',$1,$2 FROM "user" WHERE id=$3`,[`Abre este enlace para elegir una contraseña. Vence en 30 minutos y solo se puede usar una vez.\n${url}\nSi no lo solicitaste, ignora este mensaje.`,`reset:${reset.id}`,u.id]);
 });
 res.json({success:true,message:'Si la cuenta existe, recibirás un enlace para restablecer tu contraseña.'});
}));
router.post('/reset-password/check',limiter,validate(Joi.object({token:Joi.string().hex().length(64).required()})),wrap(async(req,res)=>{
 const result=await db.query('SELECT 1 FROM password_reset pr JOIN "user" u ON u.id=pr.user_id WHERE pr.token_hash=$1 AND pr.used_at IS NULL AND pr.expires_at>now() AND u.is_active',[hash(req.body.token)]);
 res.json({success:true,data:{valid:result.rowCount>0}});
}));
router.post('/reset-password',limiter,validate(Joi.object({token:Joi.string().hex().length(64).required(),password:require('../validators/passwordValidator').pattern(/[A-Z]/).pattern(/[a-z]/).pattern(/[0-9]/).required()})),wrap(async(req,res)=>{
 const password=await hashPassword(req.body.password);
 await db.transaction(async c=>{
  const row=(await c.query('SELECT user_id FROM password_reset WHERE token_hash=$1',[hash(req.body.token)])).rows[0];
  if(!row)throw fail('El enlace no es válido o venció',400);
  // El usuario se bloquea antes del token, igual que al solicitar otro enlace.
  await c.query('SELECT id FROM "user" WHERE id=$1 FOR UPDATE',[row.user_id]);
  const reset=(await c.query('SELECT id FROM password_reset WHERE token_hash=$1 AND used_at IS NULL AND expires_at>now() FOR UPDATE',[hash(req.body.token)])).rows[0];
  if(!reset)throw fail('El enlace no es válido o venció',400);
  await c.query('UPDATE "user" SET password=$1,auth_version=auth_version+1,updated_at=now() WHERE id=$2 AND is_active',[password,row.user_id]);
  await c.query('UPDATE password_reset SET used_at=now() WHERE user_id=$1 AND used_at IS NULL',[row.user_id]);
 });
 res.json({success:true,message:'Contraseña actualizada. Inicia sesión de nuevo.'});
}));
module.exports=router;
