const {Pool}=require('pg');
const fs=require('node:fs');
const path=require('node:path');
(async()=>{
 const url=process.env.E2E_DATABASE_URL;
 if(process.env.NODE_ENV!=='test'||process.env.E2E_ALLOW_WRITES!=='1'||!url||!new URL(url).pathname.includes('_e2e'))throw new Error('Usa una base _e2e aislada con NODE_ENV=test y E2E_ALLOW_WRITES=1');
 const pool=new Pool({connectionString:url});
 try{
  const tables=await pool.query("SELECT 1 FROM pg_tables WHERE schemaname NOT IN ('pg_catalog','information_schema') LIMIT 1");
  if(tables.rowCount)throw new Error('La preparación E2E requiere una base vacía; no se modificaron datos');
  const root=path.resolve(__dirname,'../../database');
  await pool.query(fs.readFileSync(path.join(root,'init/01-schema.sql'),'utf8'));
  await require('../src/database/migrations')(pool,path.join(root,'migrations'));
  await pool.query(fs.readFileSync(path.join(root,'init/data_seed.sql'),'utf8'));
  if(process.env.MFA_ENABLED==='true'){
   const crypto=require('node:crypto');
   if(!/^[a-fA-F0-9]{64}$/.test(process.env.MFA_ENCRYPTION_KEY||''))throw new Error('Clave MFA E2E requerida');
   const iv=crypto.randomBytes(12),cipher=crypto.createCipheriv('aes-256-gcm',Buffer.from(process.env.MFA_ENCRYPTION_KEY,'hex'),iv);
   const secret='JBSWY3DPEHPK3PXPJBSWY3DPEHPK3PXP'; // Fixture aislado, nunca seed operativo.
   const encrypted=Buffer.concat([cipher.update(secret,'utf8'),cipher.final()]);
   const ciphertext=[iv,cipher.getAuthTag(),encrypted].map(b=>b.toString('base64')).join('.');
   await pool.query('INSERT INTO user_mfa(user_id,secret_ciphertext) SELECT id,$1 FROM "user" WHERE role=\'admin\'',[ciphertext]);
  }
  console.log('Base E2E preparada con migraciones y seed');
 }finally{await pool.end();}
})().catch(()=>{console.error('No se pudo preparar E2E. Verifica que la base aislada esté vacía y disponible.');process.exitCode=1;});
