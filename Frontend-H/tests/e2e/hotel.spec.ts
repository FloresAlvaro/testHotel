import { test, expect } from '@playwright/test'

test.skip(process.env.E2E_ALLOW_WRITES!=='1','Requiere una demo aislada y E2E_ALLOW_WRITES=1')
const apiBase=process.env.E2E_API_URL||'http://localhost:3300/api'
const email=process.env.E2E_EMAIL||'admin@hotel.com'
const password=process.env.E2E_PASSWORD||'Admin123!'
let pageErrors:string[]=[]
test.beforeEach(async({page})=>{pageErrors=[];page.on('pageerror',error=>pageErrors.push(error.message))})
test.afterEach(async()=>{expect(pageErrors,'Sin excepciones de JavaScript en el navegador').toEqual([])})

test('huésped → reserva → entrada → cobro → comprobante → salida → limpieza → arqueo',async({page,request})=>{
  const suffix=Date.now().toString().slice(-8),guest=`Demo E2E ${suffix}`,roomNumber=`E${suffix}`
  const login=await request.post(`${apiBase}/users/login`,{data:{email,password}})
  expect(login.ok()).toBeTruthy()
  const {token}= (await login.json()).data
  const headers={Authorization:`Bearer ${token}`}
  // Preparación exclusiva de la prueba; todas las operaciones de la estancia se realizan en pantalla.
  const type=await request.post(`${apiBase}/room-types`,{headers,data:{name:`E2E ${suffix}`,price:100,capacity:2}})
  expect(type.ok()).toBeTruthy()
  const room=await request.post(`${apiBase}/rooms`,{headers,data:{number:roomNumber,room_type_id:(await type.json()).data.id,floor:1}})
  expect(room.ok()).toBeTruthy()
  await page.goto('/auth/login')
  await page.getByLabel(/Correo|Email/i).fill(email)
  await page.getByLabel('Contraseña',{exact:true}).fill(password)
  await page.getByRole('button',{name:'Iniciar sesión',exact:true}).click()
  await expect(page).toHaveURL(/dashboard/)
  await page.getByRole('link',{name:'Caja',exact:true}).click()
  await page.getByLabel('Fondo inicial').fill('50')
  await page.getByRole('button',{name:'Abrir mi turno'}).click()
  await expect(page.getByText(/Mi turno #/)).toBeVisible()

  await page.goto('/clients/create')
  await page.getByLabel('Nombre Completo').fill(guest)
  await page.getByLabel('Número Documento').fill(suffix)
  const clientSaved=page.waitForResponse(r=>r.url()===`${apiBase}/clients`&&r.request().method()==='POST')
  await page.getByRole('button',{name:/Crear|Registrar|Guardar/}).click()
  expect((await clientSaved).ok()).toBeTruthy()
  await expect(page).toHaveURL(/\/clients$/)
  await page.getByRole('link',{name:'Reservas',exact:true}).click()
  await page.getByRole('button',{name:/Nueva reserva/i,exact:true}).first().click()
  const dialog=page.getByRole('dialog')
  await dialog.getByRole('combobox',{name:'Huésped',exact:true}).selectOption({label:`${guest} · ${suffix}`})
  await dialog.getByRole('combobox',{name:'Habitación',exact:true}).selectOption({label:`${roomNumber} · E2E ${suffix}`})
  await dialog.getByLabel('Check-in').fill('2035-05-01')
  await dialog.getByLabel('Check-out').fill('2035-05-03')
  const reservationSaved=page.waitForResponse(r=>r.url()===`${apiBase}/reservations`&&r.request().method()==='POST')
  await dialog.getByRole('button',{name:'Crear reserva',exact:true}).click()
  const reservationResponse=await reservationSaved
  expect(reservationResponse.ok()).toBeTruthy()
  const reservation=(await reservationResponse.json()).data
  await expect(dialog).not.toBeVisible()
  await page.goto(`/reservations/${reservation.id}`)
  await page.getByRole('button',{name:'Check-in',exact:true}).click()
  await expect(page.getByRole('button',{name:'Check-out',exact:true})).toBeVisible()
  await page.getByRole('button',{name:'Registrar Pago',exact:true}).click()
  const paymentDialog=page.getByRole('dialog')
  await paymentDialog.getByLabel('Monto').fill('200')
  const paymentSaved=page.waitForResponse(r=>r.url()===`${apiBase}/payments`&&r.request().method()==='POST')
  await paymentDialog.getByRole('button',{name:/Registrar pago/i}).click()
  const paymentResponse=await paymentSaved
  expect(paymentResponse.ok()).toBeTruthy()
  const payment=(await paymentResponse.json()).data
  await page.goto(`/payments/${payment.id}`)
  await page.getByRole('button',{name:'Marcar como Completado'}).click()
  await page.getByRole('link',{name:'Ver comprobante'}).click()
  await expect(page.getByText(guest,{exact:false})).toBeVisible()
  await expect(page.getByText(`REC-${String(payment.id).padStart(8,'0')}`,{exact:true})).toBeVisible()
  await expect(page.getByRole('button',{name:'Imprimir',exact:true})).toBeEnabled()
  await page.goto(`/reservations/${reservation.id}`)
  await page.getByRole('button',{name:'Check-out',exact:true}).click()
  await expect(page.getByText('checked_out',{exact:true})).toBeVisible()
  await page.getByRole('link',{name:'Limpieza y mantenimiento',exact:true}).click()
  const row=page.getByRole('row').filter({has:page.getByRole('cell',{name:roomNumber,exact:true})})
  await row.getByRole('button',{name:'Finalizar',exact:true}).click()
  await expect(row.getByText('Finalizada',{exact:true})).toBeVisible()
  await page.getByRole('link',{name:'Caja',exact:true}).click()
  await page.getByLabel('Efectivo contado').fill('250')
  await page.getByRole('button',{name:'Cerrar y guardar arqueo'}).click()
  await expect(page.getByRole('button',{name:'Abrir mi turno'})).toBeVisible()
  await expect(page.getByText(/Diferencia.*0,00/).first()).toBeVisible()
  await page.getByRole('link',{name:'Historial de cambios',exact:true}).click()
  await expect(page.getByRole('heading',{name:'Historial de cambios',exact:true})).toBeVisible()
  await expect(page.getByRole('button',{name:'Filtrar'})).toBeEnabled()
  await page.getByRole('link',{name:'Calendario',exact:true}).click()
  await expect(page.getByRole('heading',{name:'Calendario de habitaciones',exact:true})).toBeVisible()
  await page.getByLabel('Desde',{exact:true}).fill('2035-05-01')
  await page.getByRole('button',{name:'Consultar',exact:true}).click()
  const calendarBooking=page.getByRole('link',{name:`#${reservation.id} ${guest} Finalizada`,exact:true}).first()
  await expect(calendarBooking).toBeVisible()
  await expect(calendarBooking).toHaveAttribute('href',`/reservations/${reservation.id}`)
})

test('configuración compartida entre sesiones y navegación móvil',async({page,browser})=>{
 const login=async(p:typeof page)=>{await p.goto('/auth/login');await p.getByLabel(/Correo|Email/i).fill(email);await p.getByLabel('Contraseña',{exact:true}).fill(password);await p.getByRole('button',{name:'Iniciar sesión',exact:true}).click();await expect(p).toHaveURL(/dashboard/)}
 await login(page)
 await page.getByRole('link',{name:'Configuración',exact:true}).click()
 const field=page.getByLabel('Nombre del Hotel',{exact:false})
 await expect(page.getByRole('button',{name:'Guardar Cambios'})).toBeEnabled()
 const original=await field.inputValue(),name=`Hotel demo ${Date.now()}`
 await field.fill(name)
 await page.getByRole('button',{name:'Guardar Cambios'}).click()
 await expect(page.locator('.workspace-property')).toContainText(name)
 const context=await browser.newContext({viewport:{width:390,height:844}})
 const other=await context.newPage()
 try{
  await login(other)
  await other.getByRole('button',{name:'Abrir navegación',exact:true}).click()
  await expect(other.locator('.workspace-property')).toContainText(name)
  await other.getByRole('link',{name:'Calendario',exact:true}).click()
  await expect(other.getByRole('heading',{name:'Calendario de habitaciones'})).toBeVisible()
  await expect(other.getByRole('button',{name:'Abrir navegación',exact:true})).toHaveAttribute('aria-expanded','false')
 }finally{
  await context.close()
  await field.fill(original)
  await page.getByRole('button',{name:'Guardar Cambios'}).click()
  await expect(page.locator('.workspace-property')).toContainText(original)
 }
})
