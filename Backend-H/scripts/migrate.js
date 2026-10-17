const { Pool } = require('pg');
const fs = require('node:fs');
const path = require('node:path');
const migrate = require('../src/database/migrations');
require('dotenv').config();

(async () => {
  if (!process.env.DATABASE_URL) throw new Error('Configura DATABASE_URL');
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const local = path.join(__dirname, '../../database/migrations');
  const directory = fs.existsSync(local) ? local : path.join(__dirname, '../migrations');
  try {
    await migrate(pool, directory, console.log);
    console.log('Migraciones verificadas; base actualizada');
  } finally { await pool.end(); }
})().catch(error => { console.error(error.message); process.exitCode = 1; });
