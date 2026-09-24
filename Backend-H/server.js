const app = require('./src/app');
const { PORT } = require('./src/config/environment');

const server = app.listen(PORT, () => {
  console.log(`✅ Servidor corriendo en puerto ${PORT}`);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM señal recibida: cerrando servidor HTTP');
  server.close(() => {
    console.log('Servidor HTTP cerrado');
  });
});