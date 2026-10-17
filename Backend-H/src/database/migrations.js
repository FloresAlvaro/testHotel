const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

// Los archivos históricos ya contienen una envoltura; el runner controla su transacción.
function migrationSql(source) {
  const sql = source.trim();
  if (/^BEGIN\s*;/i.test(sql)) {
    if (!/COMMIT\s*;$/i.test(sql)) throw new Error('La migración tiene una transacción incompleta');
    return sql.replace(/^BEGIN\s*;/i, '').replace(/COMMIT\s*;$/i, '');
  }
  return sql;
}

async function migrate(pool, directory, log = () => {}) {
  const files = fs.readdirSync(directory).filter(name => /^\d+.*\.sql$/.test(name)).sort();
  const migrations = files.map(name => {
    const source = fs.readFileSync(path.join(directory, name), 'utf8').replace(/\r\n/g, '\n');
    return { name, checksum: crypto.createHash('sha256').update(source).digest('hex'), source };
  });
  const client = await pool.connect();
  let locked = false;
  try {
    // Bloqueo de sesión: sobrevive a los commits individuales, incluido el nuevo enum.
    await client.query("SET lock_timeout = '30s'");
    await client.query('SELECT pg_advisory_lock(724002)');
    locked = true;
    const baseline = await client.query("SELECT to_regclass('\"user\"') AS users, to_regclass('reservation') AS reservations");
    if (!baseline.rows[0].users || !baseline.rows[0].reservations) throw new Error('Primero instala database/init/01-schema.sql en una base nueva');
    await client.query(`CREATE TABLE IF NOT EXISTS schema_migrations (
      name TEXT PRIMARY KEY, checksum CHAR(64) NOT NULL, applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )`);
    const history = await client.query('SELECT name, checksum FROM schema_migrations ORDER BY name');
    const applied = new Map(history.rows.map(row => [row.name, row.checksum]));
    // Valida todo el historial antes de ejecutar cualquier cambio pendiente.
    for (const row of history.rows) {
      const file = migrations.find(item => item.name === row.name);
      if (!file || file.checksum !== row.checksum) throw new Error(`Historial alterado: ${row.name}. Restaura el archivo original; crea otra migración para cambios nuevos`);
    }
    for (const file of migrations) {
      if (applied.has(file.name)) continue;
      if (history.rows.some(row => row.name > file.name)) throw new Error(`Migración fuera de orden: ${file.name}`);
      await client.query('BEGIN');
      try {
        await client.query(migrationSql(file.source));
        await client.query('INSERT INTO schema_migrations(name, checksum) VALUES ($1,$2)', [file.name, file.checksum]);
        await client.query('COMMIT');
      } catch (error) {
        await client.query('ROLLBACK');
        throw new Error(`Falló la migración ${file.name}: ${error.message}`);
      }
      log(`Migración aplicada: ${file.name}`);
    }
  } finally {
    try { if (locked) await client.query('SELECT pg_advisory_unlock(724002)'); }
    finally { client.release(true); }
  }
}
module.exports = migrate;
