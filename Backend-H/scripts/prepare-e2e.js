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
  console.log('Base E2E preparada con migraciones y seed');
 }finally{await pool.end();}
})().catch(()=>{console.error('No se pudo preparar E2E. Verifica que la base aislada esté vacía y disponible.');process.exitCode=1;});
