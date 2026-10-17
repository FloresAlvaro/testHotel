// Ejecutar desde Backend-H. Las credenciales se leen de stdin, nunca de argumentos.
const { Pool } = require('pg');
const { Writable } = require('stream');
const readline = require('readline/promises');
const { DATABASE_URL } = require('../src/config/environment');
const { hashPassword } = require('../src/utils/password');
const { registerSchema } = require('../src/validators/userValidator');

async function main() {
  let muted = false;
  const output = new Writable({ write(chunk, encoding, callback) {
    if (!muted) process.stdout.write(chunk, encoding);
    callback();
  } });
  const rl = readline.createInterface({ input: process.stdin, output, terminal: process.stdin.isTTY });
  let credentials;
  try {
    const name = await rl.question('Nombre del primer administrador: ');
    const email = await rl.question('Email: ');
    process.stdout.write('Contraseña (mínimo 8 caracteres, entrada oculta): ');
    muted = true;
    const password = await rl.question('');
    muted = false;
    process.stdout.write('\n');
    const result = registerSchema.validate({ name, email, password, role: 'admin' });
    if (result.error) throw new Error('Revisa nombre, email y contraseña (8–128 caracteres).');
    credentials = result.value;
  } finally { muted = false; rl.close(); }
  const pool = new Pool({ connectionString: DATABASE_URL });
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('LOCK TABLE "user" IN EXCLUSIVE MODE');
    const existing = await client.query('SELECT 1 FROM "user" WHERE role = $1 LIMIT 1', ['admin']);
    if (existing.rowCount) throw new Error('Ya existe un administrador. Usa la administración de usuarios.');
    await client.query('INSERT INTO "user" (name, email, password, role) VALUES ($1, $2, $3, $4)',
      [credentials.name, credentials.email, await hashPassword(credentials.password), 'admin']);
    await client.query('COMMIT');
    console.log('Administrador creado. Ya puedes iniciar sesión.');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally { client.release(); await pool.end(); }
}

main().catch((error) => {
  console.error(error.code ? 'No se pudo crear el administrador. Revisa la conexión y que el email no esté registrado.' : error.message);
  process.exitCode = 1;
});
