const router = require('express').Router();
const crypto = require('node:crypto');
const db = require('../config/database');
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorization');
const validate = require('../middleware/validation');
const fail = require('../utils/businessError');
const {hashPassword} = require('../utils/password');
const mail = require('../services/mailService');
const hash=require('../utils/tokenHash');
const wrap = fn => (req,res,next) => Promise.resolve(fn(req,res)).catch(next);
const limiter = require('express-rate-limit')({windowMs:900000,max:20,standardHeaders:true,legacyHeaders:false});
const invitationSchema=require('../utils/contractValidator').byName('InvitationInput');
router.get('/invitations',auth,authorize('admin'),wrap(async(req,res)=>{
 const rows=await db.query("SELECT id,name,email,role,client_id,created_at,expires_at,used_at FROM user_invitation ORDER BY id DESC LIMIT 100");
 res.json({success:true,data:rows.rows});
}));
router.post('/invitations',auth,authorize('admin'),validate(invitationSchema),wrap(async(req,res)=>{
 if(!mail.configured())throw fail('Configura el correo antes de enviar invitaciones',503);
 const token=crypto.randomBytes(32).toString('hex'),d=req.body;
 const invitation=await db.transaction(async c=>{
  await c.query('SELECT pg_advisory_xact_lock(hashtext(lower($1)))',[d.email]);
  if((await c.query('SELECT id FROM "user" WHERE lower(email)=lower($1)',[d.email])).rowCount)throw fail('Este correo ya tiene una cuenta',409);
  if(d.client_id){
   const client=(await c.query('SELECT id FROM client WHERE id=$1 AND is_active FOR UPDATE',[d.client_id])).rows[0];
   if(!client)throw fail('Huésped no disponible',404);
   if((await c.query('SELECT id FROM "user" WHERE client_id=$1',[d.client_id])).rowCount)throw fail('El huésped ya tiene acceso; adminístralo desde su ficha',409);
  }
  await c.query('UPDATE user_invitation SET used_at=now() WHERE lower(email)=lower($1) AND used_at IS NULL',[d.email]);
  const row=(await c.query("INSERT INTO user_invitation(name,email,role,client_id,token_hash,created_by,expires_at) VALUES($1,$2,$3,$4,$5,$6,now()+interval '48 hours') RETURNING id,name,email,role,expires_at",[d.name,d.email,d.role,d.client_id||null,hash(token),req.user.id])).rows[0];
  const url=new URL('/auth/accept-invitation',process.env.APP_URL||'http://localhost:3001');url.searchParams.set('token',token);
  await c.query('INSERT INTO email_outbox(recipient,subject,body,event_key) VALUES($1,$2,$3,$4)',[d.email,'Tu invitación al hotel',`Te invitamos a crear tu acceso. Elige tu contraseña en este enlace de un solo uso, válido durante 48 horas:\n${url}`,`invite:${row.id}`]);
  return row;
 });
 res.status(201).json({success:true,data:invitation,message:'Invitación enviada a la cola de correo'});
}));
router.delete('/invitations/:id',auth,authorize('admin'),wrap(async(req,res)=>{
 if(!/^\d+$/.test(req.params.id))throw fail('ID no válido',400);
 await db.query('UPDATE user_invitation SET used_at=now() WHERE id=$1 AND used_at IS NULL',[req.params.id]);
 res.json({success:true,data:null});
}));
router.post('/accept-invitation',limiter,validate(require('../utils/contractValidator').byName('AcceptInvitationInput')),wrap(async(req,res)=>{
 const password=await hashPassword(req.body.password);
 await db.transaction(async c=>{
  const row=(await c.query('SELECT * FROM user_invitation WHERE token_hash=$1 AND used_at IS NULL AND expires_at>now() FOR UPDATE',[hash(req.body.token)])).rows[0];
  if(!row)throw fail('La invitación no es válida o venció',400);
  if(!(await c.query("SELECT id FROM \"user\" WHERE id=$1 AND is_active AND role='admin'",[row.created_by])).rowCount)throw fail('Solicita una invitación nueva a un administrador activo',403);
  await c.query('SELECT pg_advisory_xact_lock(hashtext(lower($1)))',[row.email]);
  if((await c.query('SELECT id FROM "user" WHERE lower(email)=lower($1)',[row.email])).rowCount)throw fail('Este correo ya tiene una cuenta',409);
  if(row.client_id && !(await c.query('SELECT id FROM client WHERE id=$1 AND is_active FOR UPDATE',[row.client_id])).rowCount)throw fail('El acceso del huésped está desactivado',403);
  if(row.client_id && (await c.query('SELECT id FROM "user" WHERE client_id=$1',[row.client_id])).rowCount)throw fail('El huésped ya tiene acceso',409);
  await c.query('INSERT INTO "user"(name,email,password,role,is_active,client_id) VALUES($1,$2,$3,$4,true,$5)',[row.name,row.email,password,row.role,row.client_id]);
  await c.query('UPDATE user_invitation SET used_at=now() WHERE id=$1',[row.id]);
 });
 res.json({success:true,message:'Cuenta activada. Ya puedes iniciar sesión.'});
}));
module.exports=router;
