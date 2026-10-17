const nodemailer=require('nodemailer');
const db=require('../config/database');
let running=false;
const configured=()=>Boolean(process.env.SMTP_HOST&&process.env.MAIL_FROM);
const processQueue=async()=>{
 if(running||!configured()||(db.isReady&&!db.isReady()))return;
 running=true;
 try{
  const transport=nodemailer.createTransport({host:process.env.SMTP_HOST,port:Number(process.env.SMTP_PORT||587),secure:process.env.SMTP_SECURE==='true',requireTLS:process.env.MAIL_DEMO!=='true',auth:process.env.SMTP_USER?{user:process.env.SMTP_USER,pass:process.env.SMTP_PASSWORD}:undefined,connectionTimeout:10000,greetingTimeout:10000,socketTimeout:15000,disableFileAccess:true,disableUrlAccess:true});
  for(let i=0;i<20;i++){
   const sent=await db.transaction(async c=>{
    const mail=(await c.query('SELECT * FROM email_outbox WHERE sent_at IS NULL AND attempts<8 AND available_at<=now() ORDER BY id FOR UPDATE SKIP LOCKED LIMIT 1')).rows[0];
    if(!mail)return false;
    try{
     await transport.sendMail({from:process.env.MAIL_FROM,to:mail.recipient,subject:mail.subject,text:mail.body,messageId:`<hotel-${mail.id}@${new URL(process.env.APP_URL||'http://localhost:3001').hostname}>`});
     await c.query("UPDATE email_outbox SET sent_at=now(),body=CASE WHEN event_key LIKE 'reset:%' THEN '[Enlace de recuperación eliminado después del envío]' ELSE body END,last_error=NULL WHERE id=$1",[mail.id]);
    }catch{await c.query("UPDATE email_outbox SET attempts=attempts+1,available_at=now()+interval '1 minute'*power(2,attempts),last_error='No se pudo entregar por SMTP; revisa la conexión y configuración' WHERE id=$1",[mail.id]);}
    return true;
   });
   if(!sent)break;
  }
  transport.close();
 }finally{running=false;}
};
const start=()=>{const tick=()=>processQueue().catch(()=>console.error('No se pudo procesar la cola de correo'));tick();const timer=setInterval(tick,15000);timer.unref();return timer;};
module.exports={configured,processQueue,start};
