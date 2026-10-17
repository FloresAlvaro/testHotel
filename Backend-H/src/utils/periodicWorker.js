// Un trabajo por proceso; detener espera la operación en curso, sin iniciar otra.
module.exports=(work,interval,onError)=>{
 let stopped=false,pending;
 const tick=()=>{
  if(stopped||pending)return;
  pending=Promise.resolve().then(()=>{if(!stopped)return work();}).catch(onError).finally(()=>{pending=undefined;});
 };
 const timer=setInterval(tick,interval);timer.unref();tick();
 return async()=>{stopped=true;clearInterval(timer);await pending;};
};
