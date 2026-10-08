const app = require('./src/app');
const { PORT } = require('./src/config/environment');
const database = require('./src/config/database');

const server = app.listen(PORT, () => {
  console.log(`✅ Servidor corriendo en puerto ${PORT}`);
});

let shuttingDown = false;
const shutdown = () => {
  if (shuttingDown) return;
  shuttingDown = true;
  const timeout = setTimeout(() => process.exit(1), 30000);
  timeout.unref();
  server.close(async () => {
    try {
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
