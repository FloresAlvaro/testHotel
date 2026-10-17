const app=require('./src/app');
const database=require('./src/config/database');
const {PORT,SHUTDOWN_TIMEOUT_MS}=require('./src/config/environment');
const startWorker=require('./src/utils/periodicWorker');
const start=async()=>{
 if(!await database.testConnection())throw new Error('PostgreSQL no está disponible');
 const server=app.listen(PORT);
 await new Promise((resolve,reject)=>{server.once('listening',resolve);server.once('error',reject);});
 console.log(JSON.stringify({event:'server_started',port:PORT}));
 const stopMail=require('./src/services/mailService').start();
 const stopPayments=startWorker(()=>require('./src/services/onlinePaymentService').reconcile(),60000,()=>console.error(JSON.stringify({event:'payment_reconciliation_failed'})));
 const shutdown=require('./src/utils/shutdown')({server,stopWorkers:()=>Promise.all([stopMail(),stopPayments()]),closeDatabase:database.close,timeoutMs:SHUTDOWN_TIMEOUT_MS});
 process.on('SIGTERM',shutdown);process.on('SIGINT',shutdown);
 server.on('error',()=>{console.error(JSON.stringify({event:'http_server_failed'}));shutdown();});
};
start().catch(async()=>{console.error(JSON.stringify({event:'startup_failed',message:'No se pudo iniciar la API. Revisa configuración y PostgreSQL.'}));await database.close();process.exitCode=1;});
