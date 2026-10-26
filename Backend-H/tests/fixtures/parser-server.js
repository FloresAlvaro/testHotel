// Disposable child: no workers, no database and no real payment provider.
const app = require('../../src/app');
process.env.PAYMENT_PROVIDER = 'stripe';
const servicePath = require.resolve('../../src/services/onlinePaymentService');
require.cache[servicePath] = { id:servicePath, filename:servicePath, loaded:true, exports:{
  enabled:()=>true,
  stripe:()=>({webhooks:{constructEvent:(body,signature)=>{
    if (!Buffer.isBuffer(body) || body.toString() !== '{ "id": "test" }' || signature !== 'test-only') throw new Error('invalid');
    return {id:'test'};
  }}}),
  handleEvent:async()=>{}
}};
const server = app.listen(0, '127.0.0.1', ()=>process.send({port:server.address().port}));
process.on('message', message=>{if(message==='stop')server.close(()=>process.exit(0));});
