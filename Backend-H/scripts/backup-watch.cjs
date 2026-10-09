const { spawn } = require('node:child_process');
const path = require('node:path');
require('./backup-env.cjs');
const { keepCount } = require('./backup-policy.cjs');
const interval = Number(process.env.BACKUP_INTERVAL_HOURS || 24);
if (!Number.isFinite(interval) || interval < 1 || interval > 168)
  throw new Error('BACKUP_INTERVAL_HOURS debe estar entre 1 y 168');
keepCount(process.env.BACKUP_KEEP_COUNT);
let timer,
  stopped = false;
const run = () => {
  const child = spawn(
    process.execPath,
    [path.join(__dirname, 'backup.cjs'), 'create', ...process.argv.slice(2)],
    { stdio: 'inherit' },
  );
  let completed = false;
  const finish = (failed) => {
    if (completed) return;
    completed = true;
    if (failed) console.error('Falló la copia programada; se conservan las copias anteriores');
    if (!stopped) timer = setTimeout(run, interval * 3600000);
  };
  child.on('error', () => finish(true));
  child.on('close', (code) => finish(code !== 0));
};
for (const signal of ['SIGTERM', 'SIGINT'])
  process.on(signal, () => {
    stopped = true;
    clearTimeout(timer);
    // Permitir que una restauración en curso termine y limpie su base temporal.
  });
run();
