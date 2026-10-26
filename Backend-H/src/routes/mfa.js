const router=require('express').Router();
const Joi=require('joi');
const db=require('../config/database');
const mfa=require('../services/mfaService');
const sessions=require('../services/sessionService');
const User=require('../models/User');
const {createToken}=require('../utils/jwt');
const validate=require('../middleware/validation');
const auth=require('../middleware/auth');
const fail=require('../utils/businessError');
const wrap=fn=>(req,res,next)=>Promise.resolve(fn(req,res)).catch(next);
const limiter=require('express-rate-limit')({windowMs:15*60*1000,max:30,standardHeaders:true,legacyHeaders:false});
const challengeId=Joi.string().hex().length(64).required();
router.get('/mfa/status',auth,wrap(async(req,res)=>{
 const enabled=(await db.query('SELECT 1 FROM user_mfa WHERE user_id=$1',[req.user.id])).rowCount>0;
 const remaining=Number((await db.query('SELECT count(*) AS count FROM mfa_recovery_code WHERE user_id=$1 AND used_at IS NULL',[req.user.id])).rows[0].count);
 res.json({success:true,data:{enabled,required:mfa.enabled()&&Boolean(enabled),recoveryCodesRemaining:remaining}});
}));
router.post('/mfa/renew',limiter,sessions.trustedRequest,auth,validate(Joi.object({password:require('../validators/passwordValidator').required(),code:Joi.string().pattern(/^(?:\d{6}|[a-f0-9]{16})$/).required()})),wrap(async(req,res)=>{
 if(!mfa.enabled())throw fail('MFA no está configurado',503);
 const user=await User.verifyPassword(req.user.email,req.body.password);
 if(!user)throw fail('Contraseña o factor incorrecto',401);
 const step=await mfa.challenge(user,Boolean(req.session));
 await mfa.verify(step.challengeId,req.body.code);
 const renewal=await mfa.challenge(user,Boolean(req.session),true);
 res.json({success:true,data:renewal});
}));
router.post('/mfa/enroll',limiter,sessions.trustedRequest,validate(Joi.object({challengeId})),wrap(async(req,res)=>{
 if(!mfa.enabled())throw fail('MFA no está configurado',503);
 res.json({success:true,data:await mfa.enroll(req.body.challengeId)});
}));
const issue=async(result,req,res,mfaVerified=true)=>{
 const user=await User.findById(result.userId);
 if(!user?.is_active||(user.auth_version||0)!==result.authVersion||(user.role==='customer'&&user.client_active!==true))throw fail('El acceso ha vencido',401);
 user.auth_version=result.authVersion;
 user.mfa_verified=mfaVerified;
 if(result.browser){const csrfToken=await sessions.create(user,req,res);return res.json({success:true,data:{user,csrfToken}});}
 res.json({success:true,data:{user,token:createToken({id:user.id,email:user.email,role:user.role,version:result.authVersion,mfa_verified:mfaVerified})}});
};
const finish=confirm=>wrap(async(req,res)=>{
 if(!mfa.enabled())throw fail('MFA no está configurado',503);
 return issue(await mfa.verify(req.body.challengeId,req.body.code,confirm),req,res);
});
const admin=require('../middleware/authorization')('admin');
router.post('/mfa/enable',limiter,sessions.trustedRequest,auth,admin,validate(Joi.object({password:require('../validators/passwordValidator')})),wrap(async(req,res)=>{
 if(!mfa.enabled())throw fail('MFA no está configurado',503);
 const user=await User.verifyPassword(req.user.email,req.body.password);
 if(!user||(user.auth_version||0)!==(req.user.version||0))throw fail('Contraseña incorrecta o sesión vencida',401);
 if(await mfa.required(user))throw fail('MFA ya está activado',409);
 res.json({success:true,data:await mfa.challenge(user,Boolean(req.session))});
}));
router.post('/mfa/disable',limiter,sessions.trustedRequest,auth,admin,validate(require('../utils/contractValidator').byName('MfaRenewInput')),wrap(async(req,res)=>{
 const user=await User.verifyPassword(req.user.email,req.body.password);
 if(!user||(user.auth_version||0)!==(req.user.version||0))throw fail('Contraseña incorrecta o sesión vencida',401);
 const step=await mfa.challenge(user,Boolean(req.session));
 const verified=await mfa.verify(step.challengeId,req.body.code);
 return issue(await mfa.disable(verified),req,res,false);
}));
router.post('/mfa/confirm',limiter,sessions.trustedRequest,validate(Joi.object({challengeId,code:Joi.string().pattern(/^\d{6}$/).required(),recoveryCodesSaved:Joi.valid(true).required()})),finish(true));
router.post('/mfa/verify',limiter,sessions.trustedRequest,validate(Joi.object({challengeId,code:Joi.string().pattern(/^(?:\d{6}|[a-f0-9]{16})$/).required()})),finish(false));
module.exports=router;
