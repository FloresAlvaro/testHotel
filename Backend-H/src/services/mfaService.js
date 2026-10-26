const crypto=require('node:crypto');
const OTPAuth=require('otpauth');
const db=require('../config/database');
const hash=require('../utils/tokenHash');
const fail=require('../utils/businessError');
const enabled=()=>process.env.MFA_ENABLED!=='false';
function key(){
 const value=process.env.MFA_ENCRYPTION_KEY;
 if(!value||!/^[a-fA-F0-9]{64}$/.test(value))throw fail('MFA requiere una clave de cifrado configurada',503);
 return Buffer.from(value,'hex');
}
function encrypt(secret){
 const iv=crypto.randomBytes(12),cipher=crypto.createCipheriv('aes-256-gcm',key(),iv);
 const data=Buffer.concat([cipher.update(secret,'utf8'),cipher.final()]);
 return [iv,cipher.getAuthTag(),data].map(b=>b.toString('base64')).join('.');
}
function decrypt(value){
 const [iv,tag,data]=value.split('.').map(v=>Buffer.from(v,'base64'));
 const decipher=crypto.createDecipheriv('aes-256-gcm',key(),iv);decipher.setAuthTag(tag);
 return Buffer.concat([decipher.update(data),decipher.final()]).toString('utf8');
}
function totp(secret,email){return new OTPAuth.TOTP({issuer:'Hotel',label:email,algorithm:'SHA1',digits:6,period:30,secret:OTPAuth.Secret.fromBase32(secret)});}
async function required(user){
 if(!enabled())return false;
 key();
 return (await db.query('SELECT 1 FROM user_mfa WHERE user_id=$1',[user.id])).rowCount>0;
}
async function challenge(user,browser,replaceExisting=false){
 const challengeId=crypto.randomBytes(32).toString('hex');
 return db.transaction(async c=>{
  await c.query('SELECT id FROM "user" WHERE id=$1 FOR UPDATE',[user.id]);
  await c.query('DELETE FROM mfa_challenge WHERE user_id=$1 AND expires_at<=now()',[user.id]);
  const budget=(await c.query('SELECT count(*) AS pending,COALESCE(sum(attempts),0) AS attempts FROM mfa_challenge WHERE user_id=$1 AND auth_version=$2 AND expires_at>now()',[user.id,user.auth_version||0])).rows[0];
  if(Number(budget.attempts)>=10||Number(budget.pending)>=5)throw fail('Demasiados intentos de verificación. Espera diez minutos.',429);
  await c.query('INSERT INTO mfa_challenge(token_hash,user_id,auth_version,browser_session,replace_existing) VALUES($1,$2,$3,$4,$5)',[hash(challengeId),user.id,user.auth_version||0,browser,replaceExisting]);
  const enrolled=(await c.query('SELECT 1 FROM user_mfa WHERE user_id=$1',[user.id])).rowCount>0;
  return {mfaRequired:true,challengeId,enrollmentRequired:replaceExisting||!enrolled};
 });
}
async function locked(c,token){
 const owner=(await c.query('SELECT user_id FROM mfa_challenge WHERE token_hash=$1',[hash(token)])).rows[0];
 if(!owner)throw fail('La verificación venció. Inicia sesión de nuevo.',401);
 await c.query('SELECT id FROM \"user\" WHERE id=$1 FOR UPDATE',[owner.user_id]);
 const row=(await c.query('SELECT c.*,u.email,u.role,u.is_active,u.auth_version AS current_version FROM mfa_challenge c JOIN "user" u ON u.id=c.user_id WHERE token_hash=$1 FOR UPDATE OF c',[hash(token)])).rows[0];
 if(!row||new Date(row.expires_at)<=new Date()||row.attempts>=5||!row.is_active||row.auth_version!==row.current_version)throw fail('La verificación venció. Inicia sesión de nuevo.',401);
 const budget=(await c.query('SELECT COALESCE(sum(attempts),0) AS attempts FROM mfa_challenge WHERE user_id=$1 AND auth_version=$2 AND expires_at>now()',[row.user_id,row.auth_version])).rows[0];
 if(Number(budget.attempts)>=10)throw fail('Demasiados intentos de verificación. Espera diez minutos.',429);
 return row;
}
async function enroll(token){
 return db.transaction(async c=>{
  const row=await locked(c,token);
  if(!row.replace_existing&&(await c.query('SELECT 1 FROM user_mfa WHERE user_id=$1',[row.user_id])).rowCount)throw fail('MFA ya está activado',409);
  const secret=new OTPAuth.Secret({size:20}).base32;
  const recoveryCodes=Array.from({length:10},()=>crypto.randomBytes(8).toString('hex'));
  await c.query('UPDATE mfa_challenge SET pending_secret=$1,pending_recovery=$2 WHERE token_hash=$3',[encrypt(secret),JSON.stringify(recoveryCodes.map(hash)),hash(token)]);
  return {secret,uri:totp(secret,row.email).toString(),recoveryCodes};
 });
}
async function verify(token,code,confirm=false){
 // Failed attempts must commit too; throw only after leaving the transaction.
 const result=await db.transaction(async c=>{
  const row=await locked(c,token);
  await c.query('UPDATE mfa_challenge SET attempts=attempts+1 WHERE token_hash=$1',[hash(token)]);
  const mfa=(await c.query('SELECT * FROM user_mfa WHERE user_id=$1 FOR UPDATE',[row.user_id])).rows[0];
  const secret=confirm?row.pending_secret:mfa?.secret_ciphertext;
  if(!secret||confirm&&mfa&&!row.replace_existing)return {error:true};
  const otp=totp(decrypt(secret),row.email);
  const timestamp=Date.now();
  const delta=/^\d{6}$/.test(code)?otp.validate({token:code,timestamp,window:1}):null;
  const counter=Math.floor(timestamp/30000)+(delta??0);
  let accepted=delta!==null&&counter>Number(confirm?-1:(mfa?.last_counter??-1));
  if(!accepted&&!confirm&&mfa&&/^[a-f0-9]{16}$/.test(code))accepted=(await c.query('UPDATE mfa_recovery_code SET used_at=now() WHERE user_id=$1 AND code_hash=$2 AND used_at IS NULL RETURNING code_hash',[row.user_id,hash(code)])).rowCount>0;
  if(!accepted)return {error:true};
  if(confirm){
   if(!Array.isArray(row.pending_recovery)||row.pending_recovery.length!==10)return {error:true};
   if(row.replace_existing)await c.query('DELETE FROM user_mfa WHERE user_id=$1',[row.user_id]);
   await c.query('INSERT INTO user_mfa(user_id,secret_ciphertext,last_counter) VALUES($1,$2,$3)',[row.user_id,secret,counter]);
   for(const value of row.pending_recovery)await c.query('INSERT INTO mfa_recovery_code(user_id,code_hash) VALUES($1,$2)',[row.user_id,value]);
   await c.query('UPDATE "user" SET auth_version=auth_version+1 WHERE id=$1',[row.user_id]);
   row.auth_version++;
   await c.query('DELETE FROM web_session WHERE user_id=$1',[row.user_id]);
  }else if(delta!==null)await c.query('UPDATE user_mfa SET last_counter=$1 WHERE user_id=$2',[counter,row.user_id]);
  await c.query('DELETE FROM mfa_challenge WHERE token_hash=$1',[hash(token)]);
  return {userId:row.user_id,browser:row.browser_session,authVersion:row.auth_version};
 });
 if(result.error)throw fail('Código incorrecto o ya utilizado',401);
 return result;
}
async function disable(verified){
 return db.transaction(async c=>{
  const user=(await c.query('SELECT id,role,is_active,auth_version FROM "user" WHERE id=$1 FOR UPDATE',[verified.userId])).rows[0];
  if(!user?.is_active||user.role!=='admin'||user.auth_version!==verified.authVersion)throw fail('El acceso ha vencido',401);
  await c.query('DELETE FROM user_mfa WHERE user_id=$1',[user.id]);
  await c.query('DELETE FROM mfa_challenge WHERE user_id=$1',[user.id]);
  await c.query('DELETE FROM web_session WHERE user_id=$1',[user.id]);
  await c.query('UPDATE "user" SET auth_version=auth_version+1 WHERE id=$1',[user.id]);
  return {...verified,authVersion:user.auth_version+1};
 });
}
module.exports={enabled,required,challenge,enroll,verify,disable,encrypt,decrypt};
