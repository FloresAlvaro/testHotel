const validate=require('../src/config/runtimeSettings');
const base={NODE_ENV:'test',DATABASE_URL:'postgresql://test:test@localhost/hotel_test',JWT_SECRET:'isolated-test-secret-at-least-32-characters'};
describe('Configuración de arranque',()=>{
 test.each([
  {NODE_ENV:'production',APP_URL:'http://hotel.example',CORS_ORIGIN:'http://hotel.example'},{PORT:'3000junk'},{SMTP_PORT:'65536'},{DB_POOL_MIN:'20',DB_POOL_MAX:'5'},
  {CORS_CREDENTIALS:'yes'},{CORS_CREDENTIALS:'true',CORS_ORIGIN:'*'},
  {APP_URL:'https://example.test/portal'},{APP_URL:'https://name:secret@example.test'},
  {CORS_CREDENTIALS:'true',APP_URL:'https://hotel.test',CORS_ORIGIN:'https://otro.test'},
  {TRUST_PROXY:'true'},{TRUST_PROXY:'1'},{TRUST_PROXY:'0.0.0.0/0'},{TRUST_PROXY:'127.0.0.1/33'},
  {JWT_SECRET:'short'},{JWT_EXPIRE:'1'},{ENABLE_HEALTH_CHECK:'maybe'},
  {PAYMENT_PROVIDER:'invalid'},{PAYMENT_PROVIDER:'demo'}, {PAYMENT_PROVIDER:'stripe'},
  {SMTP_HOST:'smtp.test'},{SMTP_USER:'user'}, {MAIL_FROM:'invalid'},
  {DATABASE_URL:'postgresql://localhost/'},{RATE_LIMIT_MAX_REQUESTS:'0'}
 ])('rechaza configuración incompatible %j',bad=>expect(()=>validate({...base,...bad})).toThrow());
 test('admite demo explícita y proxy limitado',()=>{
  const config=validate({...base,APP_URL:'http://localhost:3001',CORS_ORIGIN:'http://localhost:3001',CORS_CREDENTIALS:'true',PAYMENT_PROVIDER:'demo',ALLOW_DEMO_PAYMENTS:'true',SMTP_HOST:'mailpit',MAIL_FROM:'demo@hotel.test',MAIL_DEMO:'true',TRUST_PROXY:'loopback,10.0.0.1/32'});
  expect(config.TRUST_PROXY).toEqual(['loopback','10.0.0.1/32']);expect(config.PORT).toBe(3000);
 });
});

describe('Identificación y logs',()=>{
 test('genera ID propio y lo conserva en respuestas de error',()=>{
  const middleware=require('../src/middleware/requestId');
  const req={headers:{'x-request-id':'untrusted'}};
  const res={statusCode:422,setHeader:jest.fn(),json:jest.fn()};
  const output=res.json;
  middleware(req,res,jest.fn());res.json({message:'Entrada inválida'});
  expect(req.requestId).toMatch(/^[a-f0-9-]{36}$/);
  expect(res.setHeader).toHaveBeenCalledWith('X-Request-ID',req.requestId);
  expect(output).toHaveBeenCalledWith({success:false,message:'Entrada inválida',requestId:req.requestId});
 });
 test('el diagnóstico de error no registra secretos ni parámetros de la URL',()=>{
  const log=jest.spyOn(console,'error').mockImplementation(()=>{});
  try{
   const res={status:jest.fn().mockReturnThis(),json:jest.fn()};
   require('../src/middleware/errorHandler')(new Error('password=secret-token'),{requestId:'id-test',method:'POST',originalUrl:'/api/reset?token=secret-token'},res,jest.fn());
   const line=log.mock.calls[0][0];expect(line).not.toContain('secret-token');expect(JSON.parse(line)).toMatchObject({requestId:'id-test',path:'/api/reset'});
  }finally{log.mockRestore();}
 });
});

describe('Trabajos y cierre ordenado',()=>{
 beforeEach(()=>jest.useFakeTimers());afterEach(()=>jest.useRealTimers());
 test('detener inmediatamente evita iniciar el primer trabajo pendiente',async()=>{
  const work=jest.fn();const stop=require('../src/utils/periodicWorker')(work,100,jest.fn());
  await stop();expect(work).not.toHaveBeenCalled();
 });
 test('un trabajo lento no se solapa y stop espera su finalización',async()=>{
  let release;const work=jest.fn(()=>new Promise(resolve=>{release=resolve;}));
  const stop=require('../src/utils/periodicWorker')(work,100,jest.fn());
  await Promise.resolve();jest.advanceTimersByTime(1000);expect(work).toHaveBeenCalledTimes(1);
  let ended=false;const stopping=stop().then(()=>{ended=true;});await Promise.resolve();expect(ended).toBe(false);
  release();await stopping;jest.advanceTimersByTime(1000);expect(work).toHaveBeenCalledTimes(1);
 });
 test('espera peticiones y trabajador antes de cerrar PostgreSQL; señales repetidas no duplican cierre',async()=>{
  let finishHttp,finishWorker;const events=[];
  const server={close:jest.fn(callback=>{finishHttp=callback;}),closeIdleConnections:jest.fn()};
  const stopWorkers=jest.fn(()=>new Promise(resolve=>{finishWorker=()=>{events.push('worker');resolve();};}));
  const closeDatabase=jest.fn(async()=>{events.push('database');}),exit=jest.fn();
  const shutdown=require('../src/utils/shutdown')({server,stopWorkers,closeDatabase,exit,timeoutMs:1000});
  const pending=shutdown();expect(shutdown()).toBe(pending);expect(closeDatabase).not.toHaveBeenCalled();
  finishHttp();await Promise.resolve();expect(closeDatabase).not.toHaveBeenCalled();finishWorker();await pending;
  expect(events).toEqual(['worker','database']);expect(exit).toHaveBeenCalledWith(0);expect(server.close).toHaveBeenCalledTimes(1);
 });
 test('un cierre bloqueado termina con error al vencer el límite',async()=>{
  const log=jest.spyOn(console,'error').mockImplementation(()=>{});
  try{
   const exit=jest.fn(),server={close:jest.fn(),closeAllConnections:jest.fn()};
   require('../src/utils/shutdown')({server,stopWorkers:()=>new Promise(()=>{}),closeDatabase:jest.fn(),exit,timeoutMs:1000})();
   jest.advanceTimersByTime(1000);expect(exit).toHaveBeenCalledWith(1);expect(server.closeAllConnections).toHaveBeenCalledTimes(1);
  }finally{log.mockRestore();}
 });
});
