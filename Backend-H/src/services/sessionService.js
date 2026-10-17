const crypto = require('node:crypto');
const db = require('../config/database');
const {SESSION_MAX_AGE} = require('../config/environment');
const hash=require('../utils/tokenHash');
const {cookieName,cookieOptions,readCookie,trustedRequest,validCsrf}=require('../utils/sessionCookies');
async function create(user,req,res) {
 const token=crypto.randomBytes(32).toString('hex'),csrfToken=crypto.randomBytes(32).toString('hex');
 await db.transaction(async c=>{
  await c.query('DELETE FROM web_session WHERE expires_at<=now()');
  const previous=readCookie(req);
  if(previous)await c.query('DELETE FROM web_session WHERE token_hash=$1',[hash(previous)]);
  await c.query("INSERT INTO web_session(token_hash,user_id,auth_version,csrf_token,expires_at) VALUES($1,$2,$3,$4,now()+$5*interval '1 millisecond')",[hash(token),user.id,user.auth_version||0,csrfToken,SESSION_MAX_AGE]);
 });
 res.cookie(cookieName,token,{...cookieOptions(),maxAge:SESSION_MAX_AGE});
 return csrfToken;
}
async function resolve(req) {
 const token=readCookie(req);
 if(!token)return null;
 return (await db.query('SELECT user_id AS id,auth_version AS version,csrf_token FROM web_session WHERE token_hash=$1 AND expires_at>now()',[hash(token)])).rows[0]||null;
}
async function destroy(req,res) {
 const token=readCookie(req);
 if(token)await db.query('DELETE FROM web_session WHERE token_hash=$1',[hash(token)]);
 res.clearCookie(cookieName,cookieOptions());
}
module.exports={create,resolve,destroy,trustedRequest,validCsrf,readCookie};
