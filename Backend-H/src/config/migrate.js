const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');
const database = require('./database');

module.exports = async () =>
  database.transaction(async (client) => {
    await client.query('SELECT pg_advisory_xact_lock(724002)');
    await client.query(`CREATE TABLE IF NOT EXISTS schema_migration (
    name TEXT PRIMARY KEY, checksum TEXT NOT NULL, applied_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`);
    const folder = path.resolve(__dirname, '../../migrations');
    for (const name of fs
      .readdirSync(folder)
      .filter((file) => file.endsWith('.sql'))
      .sort()) {
      const sql = fs.readFileSync(path.join(folder, name), 'utf8').replace(/\r\n/g, '\n');
      const checksum = createHash('sha256').update(sql).digest('hex');
      const applied = await client.query('SELECT checksum FROM schema_migration WHERE name = $1', [
        name,
      ]);
      if (applied.rowCount) {
        if (applied.rows[0].checksum !== checksum)
          throw new Error(`La migración aplicada ${name} fue modificada`);
        continue;
      }
      if (name === '000-initial.sql') {
        const tables =
          await client.query(`SELECT tablename FROM pg_tables WHERE schemaname = current_schema()
          AND tablename <> 'schema_migration'`);
        if (tables.rowCount) {
          const expected = [
            'user',
            'client',
            'room_type',
            'room',
            'reservation',
            'check_in_log',
            'payment',
            'audit_log',
          ];
          const found = new Set(tables.rows.map((row) => row.tablename));
          if (!expected.every((table) => found.has(table)))
            throw new Error(
              'Esquema inicial incompleto: restaura una base compatible antes de migrar',
            );
          // Adopta instalaciones existentes; las migraciones posteriores incorporan cambios.
        } else await client.query(sql);
      } else await client.query(sql);
      await client.query('INSERT INTO schema_migration (name, checksum) VALUES ($1, $2)', [
        name,
        checksum,
      ]);
    }
  });
