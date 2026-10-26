const crypto=require('node:crypto');
const rateLimit=require('express-rate-limit');
// Per-process memory, bounded by the existing IP limiter. Hashes avoid retaining email addresses.
// Multiple API replicas require a shared store before increasing replica count.
module.exports=(max=10,skipSuccessfulRequests=true)=>rateLimit({windowMs:15*60*1000,max,standardHeaders:true,legacyHeaders:false,
 keyGenerator:req=>crypto.createHash('sha256').update(String(req.body?.email||'').trim().toLowerCase()).digest('hex'),
 skip:req=>typeof req.body?.email!=='string'||req.body.email.length>254,
 skipSuccessfulRequests,
 message:{success:false,message:'Demasiados intentos para esta cuenta. Intenta nuevamente en unos minutos.'}
});
