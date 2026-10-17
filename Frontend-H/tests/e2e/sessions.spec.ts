import {test,expect} from '@playwright/test'
test.skip(process.env.E2E_ALLOW_WRITES!=='1','Requiere datos aislados')
const api=process.env.E2E_API_URL||'http://127.0.0.1:3300/api'
const login=async(page:import('@playwright/test').Page)=>{
 await page.goto('/auth/login')
 await page.getByLabel('Correo electrónico',{exact:true}).fill('admin@hotel.com')
 await page.getByLabel('Contraseña',{exact:true}).fill('Admin123!')
 await page.getByRole('button',{name:'Iniciar sesión',exact:true}).click()
 await expect(page).toHaveURL(/dashboard/)
}
test('cookie HttpOnly: recarga, SSR privado, ausencia de token local y salida revocada',async({page,context,request})=>{
 await login(page)
 const cookie=(await context.cookies()).find(c=>c.name==='hotel_session')
 expect(cookie?.httpOnly).toBe(true);expect(cookie?.sameSite).toBe('Lax')
 expect(await page.evaluate(()=>localStorage.getItem('auth_token'))).toBeNull()
 expect(await page.evaluate(()=>document.cookie.includes('hotel_session'))).toBe(false)
 await page.goto('/operations/calendar')
 await expect(page.getByRole('heading',{name:'Calendario de habitaciones',exact:true})).toBeVisible()
 await page.reload()
 await expect(page.getByRole('heading',{name:'Calendario de habitaciones',exact:true})).toBeVisible()
 await page.getByRole('button',{name:'Cerrar sesión',exact:true}).click()
 await expect(page).toHaveURL(/auth\/login/)
 const old=await request.get(`${api}/users/session`,{headers:{Cookie:`hotel_session=${cookie?.value}`}})
 expect(old.status()).toBe(401)
 await page.goto('/operations/calendar');await expect(page).toHaveURL(/auth\/login/)
})
test('invitar personal desde equipo, recibir correo y elegir contraseña desde móvil',async({page,request,browser})=>{
 test.skip(!process.env.E2E_MAIL_URL,'Requiere SMTP y buzón de prueba local')
 const email=`invite-${Date.now()}@example.com`
 await login(page)
 await page.goto('/admin/settings?tab=users')
 await page.getByRole('button',{name:'Invitar persona',exact:true}).click()
 const dialog=page.getByRole('dialog')
 await dialog.getByLabel(/^Nombre/).fill('Personal invitado')
 await dialog.getByLabel(/^Email/).fill(email)
 await dialog.getByRole('button',{name:/Guardar|Crear|Invitar/}).click()
 await expect(dialog).not.toBeVisible()
 await expect(page.getByText(`Personal invitado · ${email}`,{exact:true})).toBeVisible()
 let id=''
 await expect.poll(async()=>{
  const response=await request.get(`${process.env.E2E_MAIL_URL}/api/v1/messages`)
  const inbox=await response.json() as {messages:Array<{ID:string;To:Array<{Address:string}>}>}
  id=inbox.messages.find(m=>m.To.some(to=>to.Address===email))?.ID||''
  return id
 },{timeout:30000,intervals:[500,1000,2000]}).not.toBe('')
 const mail=await(await request.get(`${process.env.E2E_MAIL_URL}/api/v1/message/${id}`)).json() as {Text:string}
 const link=mail.Text.match(/https?:\/\/\S+/)?.[0];expect(link).toBeTruthy()
 const guest=await browser.newContext({viewport:{width:390,height:844}}),other=await guest.newPage()
 try{
  await other.goto(link!)
  await expect(other.getByRole('heading',{name:'Activa tu cuenta'})).toBeVisible()
  await expect(other).not.toHaveURL(/token=/)
  await other.screenshot({path:'/tmp/hotel-invitation-mobile.png'})
  await other.getByLabel('Nueva contraseña',{exact:true}).fill('Welcome123!')
  await other.getByLabel('Confirmar contraseña',{exact:true}).fill('Welcome123!')
  await other.getByRole('button',{name:'Activar mi cuenta',exact:true}).click()
  await expect(other.getByText('Cuenta activada. Ya puedes iniciar sesión.',{exact:true})).toBeVisible()
  expect(await other.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true)
  await other.getByRole('link',{name:'Iniciar sesión',exact:true}).click()
  await other.getByLabel('Correo electrónico',{exact:true}).fill(email)
  await other.getByLabel('Contraseña',{exact:true}).fill('Welcome123!')
  await other.getByRole('button',{name:'Iniciar sesión',exact:true}).click()
  await expect(other).toHaveURL(/dashboard/)
 }finally{await guest.close()}
})
