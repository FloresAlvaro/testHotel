const db=require('../config/database');
async function run(){
 if(process.env.SECURITY_RETENTION_ENABLED!=='true')return {enabled:false};
 const days=Number(process.env.SECURITY_SESSION_RETENTION_DAYS||7),hours=Number(process.env.SECURITY_LINK_RETENTION_HOURS||24);
 if(!Number.isInteger(days)||days<1||days>365||!Number.isInteger(hours)||hours<1||hours>168)throw new Error('Configura retención de sesiones entre 1 y 365 días y enlaces entre 1 y 168 horas');
 return db.transaction(async c=>{
  const scrubbed=await c.query(`UPDATE email_outbox SET body='[Enlace vencido eliminado por política de retención]',attempts=8,last_error=NULL WHERE (event_key LIKE 'reset:%' OR event_key LIKE 'invite:%') AND created_at<now()-$1*interval '1 hour' AND body NOT LIKE '[Enlace%' AND (event_key LIKE 'reset:%' OR NOT EXISTS (SELECT 1 FROM user_invitation i WHERE event_key='invite:'||i.id AND i.used_at IS NULL AND i.expires_at>now()))`,[hours]);
  const sessions=await c.query("DELETE FROM web_session WHERE expires_at<now()-$1*interval '1 day'",[days]);
  await c.query('DELETE FROM mfa_challenge WHERE expires_at<=now()');
  return {enabled:true,scrubbed:scrubbed.rowCount,sessions:sessions.rowCount};
 });
}
module.exports={run};
