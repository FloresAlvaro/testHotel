const crypto = require('node:crypto');
const cookieName = 'hotel_session';
/** @returns {import('express').CookieOptions} */
const cookieOptions = () => ({httpOnly:true,secure:new URL(process.env.APP_URL||'http://localhost:3001').protocol==='https:',sameSite:'lax',path:'/'});
/** @param {Pick<import('express').Request, 'headers'>} req @returns {string|null} */
const readCookie = req => {
 const value=(req.headers.cookie||'').split(';').map(v=>v.trim()).find(v=>v.startsWith(`${cookieName}=`))?.slice(cookieName.length+1);
 return value&&/^[a-f0-9]{64}$/.test(value)?value:null;
};
/** @type {import('express').RequestHandler} */
const trustedRequest = (req,res,next) => {
 const origin=req.headers.origin;
 const expected=new URL(process.env.APP_URL||'http://localhost:3001').origin;
 if(req.headers['x-hotel-request']!=='1'||(origin&&origin!==expected)||req.headers['sec-fetch-site']==='cross-site'){
  res.status(403).json({success:false,message:'Solicitud de sesión no permitida'});return;
 }
 next();
};
/** @param {Pick<import('express').Request, 'headers'>} req @param {{csrf_token:string}} session @returns {boolean} */
function validCsrf(req,session) {
 const value=req.headers['x-hotel-csrf'];
 return typeof value==='string'&&/^[a-f0-9]{64}$/.test(value)&&crypto.timingSafeEqual(Buffer.from(value),Buffer.from(session.csrf_token));
}
module.exports={cookieName,cookieOptions,readCookie,trustedRequest,validCsrf};
