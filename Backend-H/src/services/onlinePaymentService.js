const crypto=require('crypto');
const db=require('../config/database');
const fail=require('../utils/businessError');
const {cents}=require('../utils/money');
const provider=()=>process.env.PAYMENT_PROVIDER||'disabled';
const demo=()=>provider()==='demo'&&process.env.ALLOW_DEMO_PAYMENTS==='true';
const enabled=()=>demo()||(provider()==='stripe'&&Boolean(process.env.STRIPE_SECRET_KEY&&process.env.STRIPE_WEBHOOK_SECRET));
let stripeClient;
const stripe=()=>stripeClient||(stripeClient=require('stripe')(process.env.STRIPE_SECRET_KEY,{timeout:10000,maxNetworkRetries:1}));
const view=p=>({id:p.id,amount:p.amount,currency:p.currency,status:p.status,provider:p.provider,expires_at:p.expires_at,checkout_url:p.checkout_url});
const create=(user,id,mode)=>db.transaction(async c=>{
 if(!enabled())throw fail('El hotel aún no tiene habilitados los pagos en línea',503);
 const r=(await c.query('SELECT * FROM reservation WHERE id=$1 AND client_id=$2 FOR UPDATE',[id,user.client_id])).rows[0];
 if(!r)throw fail('Reserva no encontrada',404);
 if(!['confirmed','checked_in'].includes(r.status))throw fail('Esta reserva no admite cobros',409);
 const active=(await c.query("SELECT * FROM online_payment WHERE reservation_id=$1 AND status='pending' FOR UPDATE",[id])).rows[0];
 if(active?.checkout_url)return view(active);
 const settings=(await c.query('SELECT currency,deposit_percent,payment_due_hours FROM hotel_settings WHERE id=1 FOR SHARE')).rows[0];
 const paid=cents((await c.query("SELECT COALESCE(SUM(amount),0) AS paid FROM payment WHERE reservation_id=$1 AND status='completed'",[id])).rows[0].paid);
 const remaining=cents(r.total_price)-paid;
 const target=mode==='deposit'?Math.ceil(cents(r.total_price)*settings.deposit_percent/100)-paid:remaining;
 const amount=Math.min(target,remaining);
 if(amount<=0)throw fail(mode==='deposit'?'El anticipo ya está cubierto. Puedes pagar el saldo restante.':'La reserva ya está pagada',409);
 if(provider()==='stripe'&&!(process.env.STRIPE_CURRENCIES||'USD,EUR').split(',').includes(settings.currency))throw fail('La moneda del hotel no está habilitada en esta pasarela',409);
 const p=active||(await c.query("INSERT INTO online_payment(id,reservation_id,user_id,provider,amount,currency,expires_at) VALUES($1,$2,$3,$4,$5,$6,now()+$7*interval '1 hour') RETURNING *",[crypto.randomUUID(),id,user.id,provider(),(amount/100).toFixed(2),settings.currency,settings.payment_due_hours])).rows[0];
 let url,session;
 if(demo())url=`/portal/payments/${p.id}`;
 else{
  const base=process.env.APP_URL||'http://localhost:3001';
  session=await stripe().checkout.sessions.create({mode:'payment',payment_method_types:['card'],line_items:[{price_data:{currency:p.currency.toLowerCase(),unit_amount:cents(p.amount),product_data:{name:`Reserva #${id}`}},quantity:1}],client_reference_id:p.id,metadata:{hotel_payment_id:p.id},success_url:`${base}/portal/reservations/${id}?payment=returned`,cancel_url:`${base}/portal/reservations/${id}?payment=cancelled`,expires_at:Math.floor(Math.min(new Date(p.expires_at).getTime(),Date.now()+23*3600000)/1000)},{idempotencyKey:`checkout:${p.id}`});
  url=session.url;
 }
 const saved=(await c.query('UPDATE online_payment SET checkout_url=$1,provider_session=$2 WHERE id=$3 RETURNING *',[url,session?.id||null,p.id])).rows[0];return view(saved);
});
const settle=async(id,amount,currency,intent)=>db.transaction(async c=>{
 const snapshot=(await c.query('SELECT reservation_id FROM online_payment WHERE id=$1',[id])).rows[0];
 if(!snapshot)throw fail('Pago no encontrado',404);
 const r=(await c.query('SELECT * FROM reservation WHERE id=$1 FOR UPDATE',[snapshot.reservation_id])).rows[0];
 const p=(await c.query('SELECT * FROM online_payment WHERE id=$1 FOR UPDATE',[id])).rows[0];
 if(cents(p.amount)!==amount||p.currency.toLowerCase()!==currency.toLowerCase())throw fail('El importe de la pasarela no coincide',409);
 if(p.status==='paid'||p.status==='refunded'||p.status==='refund_pending')return view(p);
 const paid=cents((await c.query("SELECT COALESCE(SUM(amount),0) AS paid FROM payment WHERE reservation_id=$1 AND status='completed'",[r.id])).rows[0].paid);
 // Un cobro tardío sobre una reserva cancelada o sin saldo se reembolsa, nunca se duplica.
 if(r.status==='cancelled'||paid+amount>cents(r.total_price)){
  return view((await c.query("UPDATE online_payment SET status='refund_pending',provider_intent=$1 WHERE id=$2 RETURNING *",[intent,id])).rows[0]);
 }
 // Es un movimiento de pasarela, sin turno de caja de un empleado.
 await c.query("SELECT set_config('hotel.actor_id','',true)");
 const payment=(await c.query("INSERT INTO payment(reservation_id,amount,type,method,status,transaction_id,notes) VALUES($1,$2,'partial','credit_card','completed',$3,$4) RETURNING id",[r.id,p.amount,intent,p.provider==='demo'?'SIMULACIÓN DEMO: sin cobro real':'Cobro de pasarela confirmado por servidor'])).rows[0];
 return view((await c.query("UPDATE online_payment SET status='paid',provider_intent=$1,payment_id=$2 WHERE id=$3 RETURNING *",[intent,payment.id,id])).rows[0]);
});
const matchesRefund=(p,r)=>Boolean(r?.id && r.id===p.provider_refund && r.payment_intent===p.provider_intent && Number.isSafeInteger(r.amount) && r.amount===cents(p.amount) && typeof r.currency==='string' && r.currency.toLowerCase()===p.currency.toLowerCase() && r.status==='succeeded');
const finishRefund=async (id,receipt)=>db.transaction(async c=>{
 const snapshot=(await c.query('SELECT reservation_id FROM online_payment WHERE id=$1',[id])).rows[0];
 if(!snapshot)throw fail('Pago no encontrado',404);
 await c.query('SELECT id FROM reservation WHERE id=$1 FOR UPDATE',[snapshot.reservation_id]);
 const p=(await c.query('SELECT * FROM online_payment WHERE id=$1 FOR UPDATE',[id])).rows[0];
 if(p.status==='refunded')return view(p);
 if(p.status!=='refund_pending')throw fail('El reembolso no está pendiente',409);
 if(p.provider==='stripe'&&!matchesRefund(p,receipt))throw fail('El reembolso de la pasarela no coincide',409);
 await c.query("SELECT set_config('hotel.actor_id','',true)");
 if(p.payment_id)await c.query("UPDATE payment SET status='refunded',updated_at=now() WHERE id=$1 AND status='completed'",[p.payment_id]);
 await c.query(`INSERT INTO email_outbox(recipient,subject,body,event_key) SELECT COALESCE((SELECT email FROM "user" WHERE client_id=c.id AND is_active LIMIT 1),c.email),'Reembolso de reserva #'||r.id,$1,$2 FROM reservation r JOIN client c ON c.id=r.client_id WHERE r.id=$3 AND COALESCE((SELECT email FROM "user" WHERE client_id=c.id AND is_active LIMIT 1),c.email,'')<>''`,[`Se reembolsó ${p.amount} ${p.currency}${p.provider==='demo'?' (simulación sin dinero real)':''}.`,`refund:${id}`,p.reservation_id]);
 return view((await c.query("UPDATE online_payment SET status='refunded' WHERE id=$1 RETURNING *",[id])).rows[0]);
});
const refund=async id=>{
 const p=await db.transaction(async c=>{
  const p=(await c.query('SELECT * FROM online_payment WHERE id=$1 FOR UPDATE',[id])).rows[0];
  if(!p)throw fail('Pago no encontrado',404);
  if(p.status==='refunded')return p;
  if(!['paid','refund_pending'].includes(p.status))throw fail('Solo puedes reembolsar un pago cobrado',409);
  await c.query("UPDATE online_payment SET status='refund_pending' WHERE id=$1",[id]);return p;
 });
 if(p.status==='refunded')return view(p);
 if(p.provider==='stripe'){
  const result=await stripe().refunds.create({payment_intent:p.provider_intent,amount:cents(p.amount),metadata:{hotel_payment_id:p.id}},{idempotencyKey:`refund:${p.id}`});
  if(!result.id||result.payment_intent!==p.provider_intent||result.amount!==cents(p.amount)||result.currency?.toLowerCase()!==p.currency.toLowerCase())throw fail('El reembolso de la pasarela no coincide',409);
  await db.query('UPDATE online_payment SET provider_refund=$1 WHERE id=$2 AND (provider_refund IS NULL OR provider_refund=$1)',[result.id,p.id]);
  if(result.status!=='succeeded')return {...view(p),status:'refund_pending'};
  return finishRefund(id,result);
 }
 return finishRefund(id);
};
const handleEvent=async event=>{
 if((await db.query('SELECT 1 FROM payment_webhook WHERE id=$1',[event.id])).rowCount)return;
 const object=event.data.object;
 if(['checkout.session.completed','checkout.session.async_payment_succeeded','checkout.session.expired'].includes(event.type)){
  const p=(await db.query('SELECT * FROM online_payment WHERE provider_session=$1',[object.id])).rows[0];
  if(!p)throw fail('La sesión todavía no está registrada; reintentar',409);
  if(object.payment_status==='paid')await settle(p.id,object.amount_total,object.currency,object.payment_intent);
  else if(event.type==='checkout.session.expired')await db.query("UPDATE online_payment SET status='expired' WHERE id=$1 AND status='pending'",[p.id]);
 }
 if(event.type==='refund.updated'&&object.status==='succeeded'){
  const p=(await db.query("SELECT * FROM online_payment WHERE provider_refund=$1 AND status='refund_pending'",[object.id])).rows[0];
  if(p&&matchesRefund(p,object))await finishRefund(p.id,object);
 }
 await db.query('INSERT INTO payment_webhook(id) VALUES($1) ON CONFLICT DO NOTHING',[event.id]);
};
let working=false;
const reconcile=async()=>{
 if(working||(db.isReady&&!db.isReady()))return;working=true;
 try{
  await db.query("UPDATE online_payment SET status='expired' WHERE provider='demo' AND status='pending' AND expires_at<=now()");
  const refunds=(await db.query("SELECT id FROM online_payment WHERE status='refund_pending' ORDER BY created_at LIMIT 10")).rows;
  for(const p of refunds)await refund(p.id);
  if(provider()==='stripe'&&enabled()){
   const due=(await db.query("SELECT * FROM online_payment WHERE provider='stripe' AND status='pending' AND provider_session IS NOT NULL AND expires_at<=now() LIMIT 10")).rows;
   for(const p of due){const s=await stripe().checkout.sessions.retrieve(p.provider_session);if(s.payment_status==='paid')await settle(p.id,s.amount_total,s.currency,s.payment_intent);else if(s.status==='expired')await db.query("UPDATE online_payment SET status='expired' WHERE id=$1 AND status='pending'",[p.id]);}
  }
 }finally{working=false;}
};
const demoPay=async(user,id)=>{
 if(!demo())throw fail('La simulación está deshabilitada',404);
 const p=(await db.query('SELECT * FROM online_payment WHERE id=$1 AND user_id=$2 AND provider=\'demo\'',[id,user.id])).rows[0];
 if(!p)throw fail('Pago no encontrado',404);
 if(p.status==='expired'||new Date(p.expires_at)<=new Date())throw fail('El enlace de pago venció',409);
 return settle(id,cents(p.amount),p.currency,`demo:${id}`);
};
module.exports={create,enabled,demoPay,refund,handleEvent,stripe,reconcile,view,matchesRefund};
