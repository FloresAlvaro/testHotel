const {randomUUID}=require('node:crypto');
module.exports=(req,res,next)=>{
 // No confiar en un identificador arbitrario del cliente.
 req.requestId=randomUUID();
 res.setHeader('X-Request-ID',req.requestId);
 const json=res.json.bind(res);
 res.json=body=>{
  if(res.statusCode>=400&&body&&typeof body==='object'&&!Array.isArray(body))return json({...body,success:false,requestId:req.requestId});
  return json(body);
 };
 next();
};
