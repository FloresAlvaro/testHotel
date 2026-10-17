(async()=>{
 const urls=['http://127.0.0.1:3300/health',process.env.E2E_BASE_URL||'http://127.0.0.1:3311'];
 for(let attempt=0;attempt<60;attempt++){
  const ready=await Promise.all(urls.map(async url=>{try{return (await fetch(url,{signal:AbortSignal.timeout(1000)})).ok;}catch{return false;}}));
  if(ready.every(Boolean))return;
  await new Promise(resolve=>setTimeout(resolve,500));
 }
 throw new Error('La API o el frontend E2E no está disponible');
})().catch(error=>{console.error(error.message);process.exitCode=1;});
