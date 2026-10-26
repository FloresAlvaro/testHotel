const {fork} = require('node:child_process');
const {once} = require('node:events');
const http = require('node:http');
const zlib = require('node:zlib');
const path = require('node:path');

let child,port;
const request = (route,body,headers={})=>new Promise((resolve,reject)=>{
 const req=http.request({host:'127.0.0.1',port,path:route,method:body===undefined?'GET':'POST',headers:{'content-type':'application/json',...headers}},res=>{
  let text='';res.on('data',chunk=>text+=chunk);res.on('end',()=>resolve({status:res.statusCode,text}));
 });req.on('error',reject);req.end(body);
});
beforeAll(async()=>{
 child=fork(path.join(__dirname,'fixtures/parser-server.js'),{env:{...process.env,PAYMENT_PROVIDER:'disabled'},stdio:['ignore','ignore','ignore','ipc']});
 const [message]=await once(child,'message');port=message.port;
},10000);
afterAll(async()=>{if(child?.connected){child.send('stop');await once(child,'exit');}});

test('rechaza compresión, cuerpos grandes y JSON inválido sin terminar el proceso',async()=>{
 const compressed=Buffer.concat([zlib.gzipSync(Buffer.from('{}')),Buffer.from('trailing bytes')]);
 for(const route of ['/api/users/session','/outside-api','/api/webhooks/stripe']){
  const response=await request(route,compressed,{'content-encoding':'gzip'});
  expect(response.status).toBe(415);
  expect((await request('/api-docs.json')).status).toBe(200);
 }
 expect((await request('/outside-api','{')).status).toBe(400);
 expect((await request('/outside-api',JSON.stringify({data:'a'.repeat(105000)}))).status).toBe(413);
 expect((await request('/outside-api','{}')).status).toBe(404);
 expect((await request('/api-docs.json')).status).toBe(200);
});
test('mantiene los bytes originales para la firma del webhook',async()=>{
 expect((await request('/api/webhooks/stripe','{ "id": "test" }',{'stripe-signature':'test-only'})).status).toBe(200);
 expect((await request('/api/webhooks/stripe','{"id":"test"}',{'stripe-signature':'test-only'})).status).toBe(400);
 expect((await request('/api-docs.json')).status).toBe(200);
});
