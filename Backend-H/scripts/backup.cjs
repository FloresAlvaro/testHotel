const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { spawn } = require('node:child_process');
const { pipeline } = require('node:stream/promises');
require('./backup-env.cjs');
const policy = require('./backup-policy.cjs');
const args = process.argv.slice(3);
const option = (name, fallback) => {
  const index = args.indexOf(`--${name}`);
  if (index < 0) return fallback;
  if (!args[index + 1] || args[index + 1].startsWith('--')) throw new Error(`Falta --${name}`);
  return args[index + 1];
};
const container = option('container', process.env.BACKUP_CONTAINER || 'hotel-db');
const docker = process.env.DOCKER_BIN || 'docker';
async function run(command, input, output) {
  const child = spawn(docker, ['exec', ...(input ? ['-i'] : []), container, ...command], {
    stdio: ['pipe', 'pipe', 'pipe'],
  });
  let result = '',
    error = '';
  child.stderr.on('data', (chunk) => {
    error += chunk;
  });
  const done = new Promise((resolve, reject) => {
    child.on('error', reject);
    child.on('close', (code) =>
      code === 0 ? resolve() : reject(new Error(error || `Docker terminó con ${code}`)),
    );
  });
  if (!output)
    child.stdout.on('data', (chunk) => {
      result += chunk;
    });
  if (!input) child.stdin.end();
  await Promise.all([
    done,
    ...(input ? [pipeline(input, child.stdin)] : []),
    ...(output ? [pipeline(child.stdout, output)] : []),
  ]);
  return result.trim();
}
async function digest(file) {
  const hash = crypto.createHash('sha256');
  for await (const chunk of fs.createReadStream(file)) hash.update(chunk);
  return hash.digest('hex');
}
async function main() {
  const keep = policy.keepCount(process.env.BACKUP_KEEP_COUNT);
  const user = await run(['printenv', 'POSTGRES_USER']);
  const database = await run(['printenv', 'POSTGRES_DB']);
  if (!user || !database) throw new Error('El contenedor debe definir POSTGRES_USER y POSTGRES_DB');
  const directory = path.resolve(
    option('directory', process.env.BACKUP_DIRECTORY || path.join(__dirname, '../../.backups')),
  );
  let file = option('file');
  if (process.argv[2] === 'create') {
    fs.mkdirSync(directory, { recursive: true });
    file = path.join(
      directory,
      `hotel-${Date.now()}-${crypto.randomBytes(4).toString('hex')}.dump`,
    );
    await run(
      ['pg_dump', '-U', user, '-d', database, '-Fc', '--no-owner', '--no-acl'],
      null,
      fs.createWriteStream(file, { flags: 'wx', mode: 0o600 }),
    );
    fs.writeFileSync(`${file}.sha256`, await digest(file), { flag: 'wx', mode: 0o600 });
  } else if (process.argv[2] !== 'verify' || !file)
    throw new Error('Usa create o verify --file archivo.dump');
  file = path.resolve(file);
  const sha256 = await digest(file);
  if (sha256 !== fs.readFileSync(`${file}.sha256`, 'utf8').trim())
    throw new Error('El checksum de la copia no coincide');
  const temporary = `hotel_restore_verify_${crypto.randomBytes(12).toString('hex')}`;
  // El destino se genera aquí: nunca se restaura sobre la base original.
  if (!/^hotel_restore_verify_[a-f0-9]{24}$/.test(temporary) || temporary === database)
    throw new Error('Destino inseguro');
  await run(['createdb', '-U', user, '-T', 'template0', temporary]);
  try {
    await run(
      ['pg_restore', '-U', user, '-d', temporary, '--exit-on-error', '--no-owner', '--no-acl'],
      fs.createReadStream(file),
    );
    const tables = JSON.parse(
      await run([
        'psql',
        '-U',
        user,
        '-d',
        temporary,
        '-At',
        '-c',
        "SELECT COALESCE(json_agg(json_build_object('schema',schemaname,'table',tablename)), '[]') FROM pg_tables WHERE schemaname NOT IN ('pg_catalog','information_schema')",
      ]),
    );
    for (const table of tables) {
      const identifier = (value) => `"${value.replaceAll('"', '""')}"`;
      table.rows = Number(
        await run([
          'psql',
          '-U',
          user,
          '-d',
          temporary,
          '-At',
          '-c',
          `SELECT count(*) FROM ${identifier(table.schema)}.${identifier(table.table)}`,
        ]),
      );
    }
    fs.writeFileSync(
      `${file}.verified.json`,
      JSON.stringify({ verifiedAt: new Date().toISOString(), sha256, tables }, null, 2),
      { mode: 0o600 },
    );
    console.log(`Copia restaurada y verificada: ${file} (${tables.length} tablas)`);
  } finally {
    await run(['dropdb', '-U', user, temporary]);
  }
  if (process.argv[2] === 'create')
    await policy.finalize(file, keep, process.env.BACKUP_MIRROR_DIRECTORY);
}
main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
