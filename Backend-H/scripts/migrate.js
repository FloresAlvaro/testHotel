const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

(async () => {
  if (!process.env.DATABASE_URL) throw new Error('Configura DATABASE_URL');
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const local = path.join(__dirname, '../../database/migrations');
  const directory = fs.existsSync(local) ? local : path.join(__dirname, '../migrations');
  try {
    // Cada archivo se confirma por separado: PostgreSQL exige confirmar ADD VALUE antes de usarlo.
    for (const file of fs.readdirSync(directory).filter(name => /^\d+.*\.sql$/.test(name)).sort()) {
      await pool.query(fs.readFileSync(path.join(directory, file), 'utf8'));
      console.log(`Migración aplicada: ${file}`);
    }
  } finally { await pool.end(); }
})().catch(error => { console.error(error.message); process.exitCode = 1; });
