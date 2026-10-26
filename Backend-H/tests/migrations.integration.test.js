const { Pool } = require('pg');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const migrate = require('../src/database/migrations');
const suite = process.env.TEST_DATABASE_URL ? describe : describe.skip;
suite('Historial de migraciones PostgreSQL', () => {
  let pool, admin, directory;
  const schema = `migration_test_${process.pid}`;
  beforeAll(async () => {
    admin = new Pool({connectionString:process.env.TEST_DATABASE_URL});
    await admin.query(`CREATE SCHEMA ${schema}`);
    pool = new Pool({connectionString:process.env.TEST_DATABASE_URL,options:`-c search_path=${schema},public`});
    directory = fs.mkdtempSync(path.join(os.tmpdir(),'hotel-migrations-'));
    for(const file of fs.readdirSync(path.resolve(__dirname,'../../database/migrations'))) fs.copyFileSync(path.resolve(__dirname,'../../database/migrations',file),path.join(directory,file));
    await pool.query(fs.readFileSync(path.resolve(__dirname,'../../database/init/01-schema.sql'),'utf8'));
  });
  afterAll(async () => {
    if(pool) await pool.end();
    if(admin) {await admin.query(`DROP SCHEMA IF EXISTS ${schema} CASCADE`); await admin.end();}
    if(directory) fs.rmSync(directory,{recursive:true,force:true});
  });
  test('instala con commits separados y serializa dos ejecutores', async () => {
    await Promise.all([migrate(pool,directory),migrate(pool,directory)]);
    expect((await pool.query('SELECT * FROM schema_migrations')).rowCount).toBe(8);
    expect((await pool.query("SELECT enumlabel FROM pg_enum WHERE enumtypid='user_role'::regtype AND enumlabel='customer'")).rowCount).toBe(1);
  });
  test('omite archivos aplicados y detecta cambios antes de ejecutar pendientes', async () => {
    const first = await pool.query('SELECT * FROM schema_migrations ORDER BY name');
    await migrate(pool,directory);
    expect((await pool.query('SELECT * FROM schema_migrations ORDER BY name')).rows).toEqual(first.rows);
    const file=path.join(directory,'001-operations.sql');
    const source=fs.readFileSync(file,'utf8');
    fs.writeFileSync(file,source+'\n-- alterado\n');
    await expect(migrate(pool,directory)).rejects.toThrow('Historial alterado');
    fs.writeFileSync(file,source);
  });
  test('revierte SQL e historial cuando un archivo falla y permite reintentar', async () => {
    const file=path.join(directory,'999-test.sql');
    fs.writeFileSync(file,'BEGIN; CREATE TABLE migration_probe(id INT); SELECT missing_column; COMMIT;');
    await expect(migrate(pool,directory)).rejects.toThrow('999-test.sql');
    expect((await pool.query("SELECT to_regclass('migration_probe') AS table_name")).rows[0].table_name).toBeNull();
    expect((await pool.query('SELECT * FROM schema_migrations')).rowCount).toBe(8);
    fs.writeFileSync(file,'BEGIN; CREATE TABLE migration_probe(id INT); COMMIT;');
    await migrate(pool,directory);
    expect((await pool.query('SELECT * FROM schema_migrations')).rowCount).toBe(9);
  });
  test('adopta una instalación previa sin perder registros', async () => {
    await pool.query('INSERT INTO migration_probe VALUES (42)');
    await pool.query(fs.readFileSync(path.resolve(__dirname,'../../database/init/data_seed.sql'),'utf8'));
    await pool.query(fs.readFileSync(path.resolve(__dirname,'../../database/verify-demo.sql'),'utf8'));
    const guests = await pool.query('SELECT id, email, role, client_id FROM "user" ORDER BY id');
    const reservations = await pool.query('SELECT * FROM reservation ORDER BY id');
    await pool.query('DROP TABLE schema_migrations');
    fs.unlinkSync(path.join(directory,'999-test.sql'));
    await migrate(pool,directory);
    expect((await pool.query('SELECT id FROM migration_probe')).rows).toEqual([{id:42}]);
    expect((await pool.query('SELECT id, email, role, client_id FROM "user" ORDER BY id')).rows).toEqual(guests.rows);
    expect((await pool.query('SELECT * FROM reservation ORDER BY id')).rows).toEqual(reservations.rows);
    expect((await pool.query('SELECT * FROM schema_migrations')).rowCount).toBe(8);
  });
});
