const { Pool } = require('pg');
const fs = require('node:fs');
const path = require('node:path');
const migrate = require('../src/database/migrations');
require('dotenv').config();

(async () => {
  if (!process.env.MIGRATION_DATABASE_URL) throw new Error('Configura MIGRATION_DATABASE_URL con la cuenta de migración; no se usan credenciales runtime para DDL');
  // Conserva los parámetros TLS de la URL. SET ROLE explícito no puede ser
  // sustituido por un parámetro options de connectionString.
  const pool = new Pool({ connectionString: process.env.MIGRATION_DATABASE_URL });
  const migrationPool = {
    connect: async () => {
      const client = await pool.connect();
      try { await client.query('SET ROLE hotel_owner'); return client; }
      catch (error) { client.release(true); throw error; }
    }
  };
  const local = path.join(__dirname, '../../database/migrations');
  const directory = fs.existsSync(local) ? local : path.join(__dirname, '../migrations');
  try {
    await migrate(migrationPool, directory, console.log);
    console.log('Migraciones verificadas; base actualizada');
  } finally { await pool.end(); }
})().catch(error => { console.error(error.message); process.exitCode = 1; });
