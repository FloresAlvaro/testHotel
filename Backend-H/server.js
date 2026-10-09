const app = require('./src/app');
const { PORT } = require('./src/config/environment');
const database = require('./src/config/database');

let server;
let stopMaintenance = async () => {};
const start = async () => {
  await require('./src/config/migrate')();
  stopMaintenance = require('./src/services/authMaintenanceService').start();
  server = app.listen(PORT, () => console.log(`Servidor corriendo en puerto ${PORT}`));
};
start().catch(async () => {
  console.error('No se pudo iniciar el backend. Revisa PostgreSQL y las migraciones.');
  await database.close();
  process.exitCode = 1;
});

let shuttingDown = false;
const shutdown = () => {
  if (shuttingDown) return;
  shuttingDown = true;
  const timeout = setTimeout(() => process.exit(1), 30000);
  timeout.unref();
  if (!server) return;
  server.close(async () => {
    try {
      await stopMaintenance();
      await database.close();
      clearTimeout(timeout);
      process.exit(0);
    } catch (error) {
      console.error('Error cerrando el servidor:', error.message);
      process.exit(1);
    }
  });
};
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
