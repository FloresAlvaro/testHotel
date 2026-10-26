jest.mock('../src/config/database',()=>({query:jest.fn(),transaction:jest.fn()}));
const db=require('../src/config/database');
const service=require('../src/services/onlinePaymentService');
const schema=require('../src/validators/roomValidator');
const retention=require('../src/services/securityRetentionService');

describe('Correlación estricta de reembolsos Stripe',()=>{
 const payment={provider_refund:'re_expected',provider_intent:'pi_expected',amount:'123.45',currency:'USD'};
 const receipt={id:'re_expected',payment_intent:'pi_expected',amount:12345,currency:'usd',status:'succeeded'};
 test('solo admite el reembolso completo correlacionado',()=>expect(service.matchesRefund(payment,receipt)).toBe(true));
 test.each([{id:'re_external'},{payment_intent:'pi_other'},{amount:100},{currency:'eur'},{status:'pending'},{amount:'12345'}])('rechaza recibo ajeno, parcial o inválido %j',patch=>expect(service.matchesRefund(payment,{...receipt,...patch})).toBe(false));
 test('un webhook parcial no cierra el pago ni registra un reembolso local',async()=>{
  db.query.mockResolvedValueOnce({rowCount:0}).mockResolvedValueOnce({rows:[payment]}).mockResolvedValueOnce({rowCount:1});
  await service.handleEvent({id:'evt_partial',type:'refund.updated',data:{object:{...receipt,amount:100}}});
  expect(db.transaction).not.toHaveBeenCalled();
  expect(db.query.mock.calls[1][1]).toEqual(['re_expected']);
 });
});

describe('Validación de habitaciones sin parseos parciales',()=>{
 test.each([{price:'10junk',capacity:2},{price:10,capacity:2.5},{price:-10,capacity:2},{price:10,capacity:0},{price:10.001,capacity:2},{price:10,capacity:'2junk'}])('rechaza %j',input=>expect(schema.typeCreate.validate({name:'Doble',...input}).error).toBeDefined());
 test('admite valores numéricos exactos y rechaza campos desconocidos',()=>{
  expect(schema.typeCreate.validate({name:'Doble',price:10.25,capacity:2}).error).toBeUndefined();
  expect(schema.roomCreate.validate({number:'A-1',room_type_id:2,floor:0,owner_id:4}).error).toBeDefined();
  expect(schema.roomUpdate.validate({floor:1.5}).error).toBeDefined();
 });
});

describe('Retención optativa de credenciales vencidas',()=>{
 const previous={enabled:process.env.SECURITY_RETENTION_ENABLED,days:process.env.SECURITY_SESSION_RETENTION_DAYS};
 afterEach(()=>{jest.clearAllMocks();for(const [key,value] of Object.entries({SECURITY_RETENTION_ENABLED:previous.enabled,SECURITY_SESSION_RETENTION_DAYS:previous.days}))if(value===undefined)delete process.env[key];else process.env[key]=value;});
 test('no ejecuta SQL sin política activada',async()=>{delete process.env.SECURITY_RETENTION_ENABLED;await expect(retention.run()).resolves.toEqual({enabled:false});expect(db.transaction).not.toHaveBeenCalled();});
 test('rechaza plazos inválidos',async()=>{process.env.SECURITY_RETENTION_ENABLED='true';process.env.SECURITY_SESSION_RETENTION_DAYS='0';await expect(retention.run()).rejects.toThrow(/entre 1 y 365/);expect(db.transaction).not.toHaveBeenCalled();});
});
