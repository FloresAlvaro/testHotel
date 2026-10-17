const app = require('./src/app');
const { PORT } = require('./src/config/environment');

require('./src/services/mailService').start();
const reconcilePayments=()=>require('./src/services/onlinePaymentService').reconcile().catch(()=>console.error('No se pudieron conciliar los pagos en línea'));
reconcilePayments();
setInterval(reconcilePayments,60000).unref();
const server = app.listen(PORT, () => {
  console.log(`✅ Servidor corriendo en puerto ${PORT}`);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM señal recibida: cerrando servidor HTTP');
  server.close(() => {
    console.log('Servidor HTTP cerrado');
  });
});