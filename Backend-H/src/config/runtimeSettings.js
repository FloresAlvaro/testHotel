const {isIP}=require('node:net');

// Valida sin imprimir valores que puedan contener credenciales.
module.exports=env=>{
 const integer=(name,fallback,min=1,max=2147483647)=>{
  const raw=env[name]??fallback;
  if(!/^\d+$/.test(String(raw)))throw new Error(`${name} debe ser un entero entre ${min} y ${max}`);
  const value=Number(raw);
  if(!Number.isSafeInteger(value)||value<min||value>max)throw new Error(`${name} debe ser un entero entre ${min} y ${max}`);
  return value;
 };
 for(const name of ['CORS_CREDENTIALS','SMTP_SECURE','MAIL_DEMO','ALLOW_DEMO_PAYMENTS','ENABLE_HEALTH_CHECK']){
  if(env[name]!==undefined&&!['true','false'].includes(env[name]))throw new Error(`${name} debe ser true o false`);
 }
 const production=env.NODE_ENV==='production';
 let database;
 try{database=new URL(env.DATABASE_URL);}catch{throw new Error('DATABASE_URL debe ser una URL PostgreSQL válida');}
 if(!['postgres:','postgresql:'].includes(database.protocol)||!database.hostname||database.pathname.length<2)throw new Error('DATABASE_URL debe indicar servidor y base PostgreSQL');
 if(!env.JWT_SECRET||env.JWT_SECRET.length<32)throw new Error('JWT_SECRET debe tener al menos 32 caracteres');
 if(!/^(?:[1-9]\d*)(?:ms|s|m|h|d|w|y)$/.test(env.JWT_EXPIRE||'24h'))throw new Error('JWT_EXPIRE debe indicar duración y unidad, por ejemplo 24h');
 let app;
 try{app=new URL(env.APP_URL||'http://localhost:3001');}catch{throw new Error('APP_URL debe ser un origen HTTP/HTTPS válido');}
 if(!['http:','https:'].includes(app.protocol)||app.username||app.password||app.pathname!=='/'||app.search||app.hash)throw new Error('APP_URL debe ser un origen HTTP/HTTPS sin ruta, credenciales ni parámetros');
 const origins=(env.CORS_ORIGIN||(production?'https://yourdomain.com':'*')).split(',').map(s=>s.trim()).filter(Boolean);
 for(const origin of origins){if(origin==='*')continue;let url;try{url=new URL(origin);}catch{throw new Error('CORS_ORIGIN contiene un origen no válido');}if(url.origin!==origin||!['http:','https:'].includes(url.protocol))throw new Error('CORS_ORIGIN requiere orígenes HTTP/HTTPS sin rutas');}
 if(production&&origins.includes('*'))throw new Error('En producción CORS_ORIGIN requiere orígenes explícitos');
 if(!origins.length)throw new Error('CORS_ORIGIN debe contener al menos un origen');
 if(env.CORS_CREDENTIALS==='true'&&(origins.includes('*')||!origins.includes(app.origin)))throw new Error('CORS con credenciales requiere orígenes explícitos e incluir APP_URL');
 const proxies=(env.TRUST_PROXY||'').split(',').map(s=>s.trim()).filter(Boolean);
 for(const proxy of proxies){
  if(proxy==='loopback')continue;
  const [address,prefix,...extra]=proxy.split('/');const family=isIP(address);
  if(!family||extra.length||['0.0.0.0','::'].includes(address)||(prefix!==undefined&&(!/^\d+$/.test(prefix)||Number(prefix)<1||Number(prefix)>(family===4?32:128))))throw new Error('TRUST_PROXY requiere IPs/subredes específicas o loopback');
 }
 const provider=env.PAYMENT_PROVIDER||'disabled';
 if(!['disabled','demo','stripe'].includes(provider))throw new Error('PAYMENT_PROVIDER debe ser disabled, demo o stripe');
 if(provider==='demo'&&env.ALLOW_DEMO_PAYMENTS!=='true')throw new Error('El proveedor demo requiere ALLOW_DEMO_PAYMENTS=true');
 if(provider==='stripe'&&(!env.STRIPE_SECRET_KEY||!env.STRIPE_WEBHOOK_SECRET))throw new Error('Stripe requiere STRIPE_SECRET_KEY y STRIPE_WEBHOOK_SECRET');
 if(env.SMTP_HOST&&!env.MAIL_FROM)throw new Error('Configura MAIL_FROM al habilitar SMTP');
 if(env.MAIL_FROM&&(!/^[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+$/.test(env.MAIL_FROM)||/[\r\n]/.test(env.MAIL_FROM)))throw new Error('MAIL_FROM debe ser un correo válido');
 if(Boolean(env.SMTP_USER)!==Boolean(env.SMTP_PASSWORD))throw new Error('SMTP_USER y SMTP_PASSWORD deben configurarse juntos');
 const DB_POOL_MIN=integer('DB_POOL_MIN',production?5:2,0,100);
 const DB_POOL_MAX=integer('DB_POOL_MAX',production?30:20,1,100);
 if(DB_POOL_MIN>DB_POOL_MAX)throw new Error('DB_POOL_MIN no puede superar DB_POOL_MAX');
 return {
  PORT:integer('PORT',3000,1,65535),BCRYPT_ROUNDS:integer('BCRYPT_ROUNDS',10,8,15),
  RATE_LIMIT_WINDOW_MS:integer('RATE_LIMIT_WINDOW_MS',900000),RATE_LIMIT_MAX_REQUESTS:integer('RATE_LIMIT_MAX_REQUESTS',1000),
  DB_POOL_MIN,DB_POOL_MAX,DB_IDLE_TIMEOUT:integer('DB_IDLE_TIMEOUT',30000),DB_CONNECT_TIMEOUT:integer('DB_CONNECT_TIMEOUT',production?5000:2000),
  SMTP_PORT:integer('SMTP_PORT',587,1,65535),SESSION_MAX_AGE:integer('SESSION_MAX_AGE',86400000),
  HEALTH_CHECK_INTERVAL:integer('HEALTH_CHECK_INTERVAL',60000),SHUTDOWN_TIMEOUT_MS:integer('SHUTDOWN_TIMEOUT_MS',30000,1000,300000),
  TRUST_PROXY:proxies.length?proxies:false
 };
};
