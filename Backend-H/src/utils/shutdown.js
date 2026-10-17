module.exports=({server,stopWorkers,closeDatabase,timeoutMs=30000,exit=code=>process.exit(code)})=>{
 let closing;
 return ()=>{
  if(closing)return closing;
  const timer=setTimeout(()=>{console.error(JSON.stringify({event:'shutdown_timeout'}));server.closeAllConnections?.();exit(1);},timeoutMs);timer.unref();
  closing=(async()=>{
   try{
    // Dejar de aceptar tráfico; terminar peticiones y trabajos antes de cerrar PostgreSQL.
    const drained=new Promise((resolve,reject)=>server.close(error=>error?reject(error):resolve()));
    server.closeIdleConnections?.();
    await Promise.all([drained,stopWorkers()]);
    await closeDatabase();clearTimeout(timer);exit(0);
   }catch{clearTimeout(timer);console.error(JSON.stringify({event:'shutdown_failed'}));exit(1);}
  })();
  return closing;
 };
};
