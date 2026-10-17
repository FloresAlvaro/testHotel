import { test, expect } from '@playwright/test'

test.skip(process.env.E2E_ALLOW_WRITES!=='1','Requiere una demo aislada y E2E_ALLOW_WRITES=1')
const api=process.env.E2E_API_URL||'http://localhost:3300/api'

for(const kind of ['dates','cancel'] as const)for(const decision of ['approved','rejected'] as const){
 test(`solicitudes: ${kind} → ${decision} desde el modal`,async({page,request})=>{
  const errors:string[]=[]
  page.on('pageerror',e=>errors.push(e.message))
  const login=async(email:string,password:string)=>{
   const result=await request.post(`${api}/users/login`,{data:{email,password}})
   expect(result.ok()).toBeTruthy()
   return {Authorization:`Bearer ${(await result.json()).data.token}`}
  }
  const admin=await login('admin@hotel.com','Admin123!')
  const guest=await login('customer@hotel.com','Customer123!')
  const suffix=`${Date.now()}${kind==='dates'?'D':'C'}${decision==='approved'?'A':'R'}`
  const type=await request.post(`${api}/room-types`,{headers:admin,data:{name:`Solicitud ${suffix}`,price:100,capacity:2}})
  expect(type.status()).toBe(201)
  const room=await request.post(`${api}/rooms`,{headers:admin,data:{number:suffix,room_type_id:(await type.json()).data.id,floor:1}})
  expect(room.status()).toBe(201)
  const booked=await request.post(`${api}/portal/reservations`,{headers:guest,data:{check_in:'2040-01-01',check_out:'2040-01-03',room_id:(await room.json()).data.id,expected_total:200,expected_currency:'BOB'}})
  expect(booked.status()).toBe(201)
  const id=(await booked.json()).data.id
  const created=await request.post(`${api}/portal/reservations/${id}/requests`,{headers:guest,data:{kind,reason:`Prueba de interfaz ${suffix}`,...(kind==='dates'?{check_in:'2040-01-05',check_out:'2040-01-08'}:{})}})
  expect(created.status()).toBe(201)
  const requestId=(await created.json()).data.id
  const original=(await (await request.get(`${api}/portal/reservations/${id}`,{headers:guest})).json()).data
  await page.goto('/auth/login')
  await page.getByLabel('Correo electrónico',{exact:true}).fill('admin@hotel.com')
  await page.getByLabel('Contraseña',{exact:true}).fill('Admin123!')
  await page.getByRole('button',{name:'Iniciar sesión',exact:true}).click()
  await expect(page).not.toHaveURL(/auth\/login/)
  await page.goto('/operations/requests')
  const row=page.getByRole('article').filter({hasText:`Prueba de interfaz ${suffix}`})
  await row.getByRole('button',{name:/Ver solicitud/}).click()
  const modal=page.getByRole('dialog')
  await expect(modal).toBeVisible()
  await modal.getByRole('combobox',{name:'Decisión',exact:true}).selectOption(decision)
  if(kind==='dates'&&decision==='approved')await modal.getByLabel(/Total acordado/).fill('300')
  // Validación nativa: no se puede guardar sin una respuesta.
  await modal.getByRole('button',{name:'Guardar decisión y notificar'}).click()
  await expect(modal).toBeVisible()
  const response=`Decisión de prueba ${suffix}`
  await modal.getByLabel('Respuesta al huésped').fill(response)
  if(kind==='dates'&&decision==='approved'){
   const checkout=await request.post(`${api}/portal/reservations/${id}/checkout`,{headers:guest,data:{mode:'deposit'}})
   expect(checkout.status()).toBe(201)
   const paymentId=(await checkout.json()).data.id
   const blocked=page.waitForResponse(r=>r.url().endsWith(`/reservation-requests/${requestId}/review`)&&r.request().method()==='POST')
   await modal.getByRole('button',{name:'Guardar decisión y notificar'}).click()
   expect((await blocked).status()).toBe(409)
   await expect(modal.getByRole('alert')).toContainText('pago en línea')
   await expect(modal.getByLabel('Respuesta al huésped')).toHaveValue(response)
   await expect(modal).toBeVisible()
   const paid=await request.post(`${api}/portal/online-payments/${paymentId}/demo-confirm`,{headers:guest})
   expect(paid.ok()).toBeTruthy()
  }
  const saved=page.waitForResponse(r=>r.url().endsWith(`/reservation-requests/${requestId}/review`)&&r.request().method()==='POST')
  await modal.getByRole('button',{name:'Guardar decisión y notificar'}).click()
  expect((await saved).status()).toBe(200)
  await expect(modal).not.toBeVisible()
  await expect(row).toHaveCount(0)
  await expect(page.getByRole('status').filter({hasText:'Decisión guardada'})).toBeVisible()
  await page.getByRole('combobox',{name:'Estado',exact:true}).selectOption(decision)
  const resolved=page.getByRole('article').filter({hasText:`Prueba de interfaz ${suffix}`})
  await resolved.getByRole('button',{name:/Ver solicitud/}).click()
  await expect(modal).toContainText(response)
  await expect(modal.getByRole('button',{name:'Guardar decisión y notificar'})).toHaveCount(0)
  const final=(await (await request.get(`${api}/portal/reservations/${id}`,{headers:guest})).json()).data
  if(decision==='rejected'){
   expect(final.status).toBe(original.status)
   expect(final.check_in).toBe(original.check_in)
   expect(final.check_out).toBe(original.check_out)
   expect(final.total_price).toBe(original.total_price)
  }else if(kind==='cancel')expect(final.status).toBe('cancelled')
  else{
   expect(final.check_in.slice(0,10)).toBe('2040-01-05')
   expect(final.check_out.slice(0,10)).toBe('2040-01-08')
   expect(Number(final.total_price)).toBe(300)
  }
  expect(errors).toEqual([])
 })
}
