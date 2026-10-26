const express=require('express');
const http=require('node:http');
const accountLimit=require('../src/middleware/accountRateLimit');
let server,port;
const send=(route,email)=>new Promise((resolve,reject)=>{
 const req=http.request({host:'127.0.0.1',port,path:route,method:'POST',headers:{'content-type':'application/json'}},res=>{res.resume();res.on('end',()=>resolve(res.statusCode));});
 req.on('error',reject);req.end(JSON.stringify({email}));
});
beforeAll(async()=>{
 const app=express();app.use(express.json());
 app.post('/failed',accountLimit(2,true),(req,res)=>res.sendStatus(401));
 app.post('/success',accountLimit(2,true),(req,res)=>res.sendStatus(200));
 app.post('/recovery',accountLimit(2,false),(req,res)=>res.sendStatus(200));
 server=app.listen(0,'127.0.0.1');await new Promise(resolve=>server.once('listening',resolve));port=server.address().port;
});
afterAll(()=>new Promise(resolve=>server.close(resolve)));
test('los intentos fallidos comparten presupuesto por cuenta normalizada, no por existencia',async()=>{
 expect(await send('/failed','Guest@Example.test')).toBe(401);
 expect(await send('/failed',' guest@example.test ')).toBe(401);
 expect(await send('/failed','GUEST@example.test')).toBe(429);
 expect(await send('/failed','another@example.test')).toBe(401);
});
test('el acceso correcto no consume el límite de errores',async()=>{
 for(let i=0;i<4;i++)expect(await send('/success','valid@example.test')).toBe(200);
});
test('recuperación limita también respuestas genéricas exitosas',async()=>{
 expect(await send('/recovery','missing@example.test')).toBe(200);
 expect(await send('/recovery','missing@example.test')).toBe(200);
 expect(await send('/recovery','missing@example.test')).toBe(429);
});
