import { test, expect, type Page } from '@playwright/test'
import { createRequire } from 'node:module'
const require=createRequire(new URL('../../../Backend-H/package.json',import.meta.url))
const {Pool}=require('pg') as {Pool:new(options:{connectionString:string})=>{query:(sql:string,params?:unknown[])=>Promise<{rows:Record<string,unknown>[]}>,end:()=>Promise<void>}}
const api=process.env.E2E_API_URL||'http://127.0.0.1:3300/api'
test.skip(process.env.E2E_ALLOW_WRITES!=='1','Requiere fixtures E2E aislados')
let targetReservation:number,targetRoom:number,inventoryTotal:number

test.beforeAll(async()=>{
 const url=process.env.E2E_DATABASE_URL||''
 if(!new URL(url).pathname.includes('_e2e'))throw new Error('Solo una base E2E desechable')
 const pool=new Pool({connectionString:url})
 try{
  const type=Number((await pool.query("INSERT INTO room_type(name,price,capacity) VALUES('UX tipo objetivo',100,2) ON CONFLICT(name) DO UPDATE SET price=EXCLUDED.price RETURNING id")).rows[0]!.id)
  await pool.query("INSERT INTO room_type(name,price,capacity) SELECT 'UX tipo extra '||n,100,2 FROM generate_series(1,105)n ON CONFLICT DO NOTHING")
  await pool.query("INSERT INTO room(number,room_type_id,floor) SELECT 'UXL-'||lpad(n::text,3,'0'),$1,12 FROM generate_series(1,12)n ON CONFLICT DO NOTHING",[type])
  targetRoom=Number((await pool.query("SELECT id FROM room WHERE number='UXL-012'")).rows[0]!.id)
  await pool.query("INSERT INTO client(name,document) SELECT 'UX Huésped '||lpad(n::text,3,'0'),'UXDOC-'||n FROM generate_series(1,105)n ON CONFLICT DO NOTHING")
  await pool.query(`INSERT INTO reservation(client_id,room_id,user_id,check_in,check_out,total_price,status)
   SELECT c.id,$1,u.id,'2037-01-01'::date+n*3,'2037-01-03'::date+n*3,200,'confirmed'
   FROM generate_series(1,105)n JOIN client c ON c.document='UXDOC-'||n CROSS JOIN "user" u WHERE u.email='manager@hotel.com' AND NOT EXISTS(SELECT 1 FROM reservation existing WHERE existing.client_id=c.id)`,[targetRoom])
  targetReservation=Number((await pool.query("SELECT r.id FROM reservation r JOIN client c ON c.id=r.client_id WHERE c.document='UXDOC-1'")).rows[0]!.id)
  inventoryTotal=Number((await pool.query('SELECT count(*) FROM room')).rows[0]!.count)
 }finally{await pool.end()}
})
async function login(page:Page){
 const response=await page.request.post(`${api}/users/login`,{data:{email:'manager@hotel.com',password:'Manager123!'}})
 expect(response.status()).toBe(200)
 const session=await page.request.post(`${api}/users/session`,{headers:{'X-Hotel-Request':'1'},data:{email:'manager@hotel.com',password:'Manager123!'}})
 expect(session.status()).toBe(200)
 return (await response.json()).data as {token:string}
}

test('inventario completo, búsqueda por piso y tipos fuera de la primera página',async({page})=>{
 await login(page);await page.goto('/rooms')
 const paging=page.getByRole('navigation',{name:'Paginación de resultados'})
 await expect(paging).toContainText(`${inventoryTotal} resultados`)
 await paging.getByRole('button',{name:'Siguiente'}).click()
 await expect(paging).toContainText('Página 2')
 await page.getByPlaceholder('Buscar habitación #...').fill('UXL-012')
 await expect(page.getByText('Mostrando 1 de 1 habitaciones')).toBeVisible()
 await page.getByRole('spinbutton',{name:'Filtrar por piso'}).fill('12')
 await expect(page.getByText('Mostrando 1 de 1 habitaciones')).toBeVisible()
 await page.getByRole('button',{name:'Nueva Habitación',exact:true}).click()
 const dialog=page.getByRole('dialog')
 await dialog.getByRole('searchbox',{name:'Buscar tipo de habitación'}).fill('UX tipo extra 99')
 const typeSelect=dialog.getByRole('combobox',{name:'Tipo de habitación',exact:true})
 await expect(typeSelect.locator('option').filter({hasText:'UX tipo extra 99'})).toHaveCount(1)
 await typeSelect.selectOption((await typeSelect.locator('option').filter({hasText:'UX tipo extra 99'}).getAttribute('value'))!)
 await expect(dialog.getByRole('combobox',{name:'Tipo de habitación',exact:true})).not.toHaveValue('')
 page.once('dialog',d=>d.accept());await dialog.getByRole('button',{name:'Cancelar',exact:true}).click()
})

test('reserva: búsqueda global, disponibilidad por fecha y borrador protegido',async({page})=>{
 await login(page);await page.goto('/reservations');await expect(page.getByRole('navigation',{name:'Paginación de resultados'})).toBeVisible()
 await page.getByRole('button',{name:/Nueva reserva/i,exact:true}).first().click()
 const dialog=page.getByRole('dialog')
 await dialog.getByRole('searchbox',{name:'Buscar huésped'}).fill('UX Huésped 001')
 await dialog.getByRole('combobox',{name:'Huésped',exact:true}).selectOption({label:'UX Huésped 001 · UXDOC-1'})
 await dialog.getByLabel('Check-in').fill('2038-05-01')
 await dialog.getByLabel('Check-out').fill('2038-05-03')
 await dialog.getByRole('combobox',{name:'Habitación',exact:true}).selectOption(String(targetRoom))
 await dialog.getByLabel('Requerimientos Especiales').fill('Conservar borrador UX')
 page.once('dialog',d=>d.dismiss());await page.keyboard.press('Escape')
 await expect(dialog).toBeVisible();await expect(dialog.getByLabel('Requerimientos Especiales')).toHaveValue('Conservar borrador UX')
 await dialog.getByLabel('Check-in').fill('2037-01-04')
 await dialog.getByLabel('Check-out').fill('2037-01-05')
 await expect(dialog.getByRole('combobox',{name:'Habitación',exact:true})).not.toBeDisabled()
 // La primera reserva de fixture ocupa el 4–6 de enero y queda fuera de la primera página.
 await expect(dialog.getByRole('combobox',{name:'Habitación',exact:true}).locator(`option[value="${targetRoom}"]`)).toHaveCount(0)
 await expect(dialog.getByLabel('Requerimientos Especiales')).toHaveValue('Conservar borrador UX')
 page.once('dialog',d=>d.accept());await dialog.getByRole('button',{name:'Cancelar',exact:true}).click()
 await expect(dialog).not.toBeVisible()
})

test('pago: reserva fuera de la primera página y saldo visible antes de cobrar',async({page})=>{
 await login(page);await page.goto('/payments');await expect(page.getByRole('navigation',{name:'Paginación de resultados'})).toBeVisible()
 await page.getByRole('button',{name:'Nuevo Pago',exact:true}).first().click()
 const dialog=page.getByRole('dialog')
 await dialog.getByRole('searchbox',{name:'Buscar reserva'}).fill('UX Huésped 001')
 await dialog.getByRole('combobox',{name:'Reserva',exact:true}).selectOption(String(targetReservation))
 await expect(dialog.getByLabel('Monto')).toHaveValue('200')
 await expect(dialog.getByText('Saldo pendiente:',{exact:false})).toContainText('200')
 await dialog.getByRole('searchbox',{name:'Buscar reserva'}).fill('Sin coincidencias UX')
 await expect(dialog.getByText('Sin coincidencias. Cambia la búsqueda.')).toBeVisible()
 await expect(dialog.getByRole('combobox',{name:'Reserva',exact:true})).toHaveValue(String(targetReservation))
 await dialog.getByLabel('Monto').fill('201')
 await dialog.getByRole('button',{name:'Registrar Pago',exact:true}).click()
 await expect(dialog).toBeVisible()
 page.once('dialog',d=>d.accept());await dialog.getByRole('button',{name:'Cancelar',exact:true}).click()
})

for(const [counted,difference] of [['100','0'],['90','-10'],['110','10'],['0','-100']]){
 test(`caja: contado deliberado ${counted}, diferencia ${difference} y revisión cancelable`,async({page})=>{
  const {token}=await login(page)
  expect((await page.request.post(`${api}/operations/cash-shifts`,{headers:{Authorization:`Bearer ${token}`},data:{opening_amount:100}})).status()).toBe(201)
  await page.goto('/operations/cash')
  await expect(page.getByLabel('Efectivo contado')).toHaveValue('')
  await page.getByRole('button',{name:'Revisar cierre de caja'}).click()
  await expect(page.getByRole('dialog')).not.toBeVisible()
  await page.getByLabel('Efectivo contado').fill(counted!)
  await page.getByRole('button',{name:'Revisar cierre de caja'}).click()
  const dialog=page.getByRole('dialog')
  await expect(dialog).toContainText(difference==='0'?'El efectivo contado coincide':Number(difference)<0?'faltante':'sobrante')
  await dialog.getByRole('button',{name:'Volver a contar'}).click()
  await expect(page.getByLabel('Efectivo contado')).toHaveValue(counted!)
  await page.getByRole('button',{name:'Revisar cierre de caja'}).click()
  await dialog.getByRole('button',{name:difference==='0'?'Confirmar cierre':'Confirmar cierre con diferencia',exact:true}).click()
  await expect(page.getByRole('button',{name:'Abrir mi turno'})).toBeVisible()
 })
}

test('móvil conserva identidad de reserva y contexto de las acciones',async({page})=>{
 await login(page);await page.setViewportSize({width:390,height:844});await page.goto('/reservations');await expect(page.getByRole('navigation',{name:'Paginación de resultados'})).toBeVisible()
 await page.getByPlaceholder(/Buscar/).fill('UX Huésped 001')
 await expect(page.getByText('Mostrando 1 de 1 reservas')).toBeVisible()
 const card=page.getByRole('article',{name:`Reserva ${targetReservation}`})
 await expect(card).toContainText('UX Huésped 001')
 await expect(card.getByRole('button',{name:`Ver reserva ${targetReservation}`})).toBeVisible()
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true)
 await page.screenshot({path:'/private/tmp/hotel-ux-reservas-mobile.png'})
})


test('nuevo huésped: conserva cambios al cancelar navegación y permite guardar',async({page})=>{
 await login(page);await page.goto('/clients/create')
 // El formulario es SSR: esperar una acción del layout tras la hidratación.
 await expect(page.locator('.workspace-property')).toContainText('Hotel')
 await page.getByLabel('Nombre Completo').fill('UX huésped con borrador')
 await page.getByLabel('Número Documento').fill(Date.now().toString().slice(-8))
 const navigation=page.getByRole('link',{name:'Reservas',exact:true})
 page.once('dialog',d=>d.dismiss());await navigation.click()
 await expect(page).toHaveURL(/\/clients\/create$/)
 await expect(page.getByLabel('Nombre Completo')).toHaveValue('UX huésped con borrador')
 await page.getByRole('button',{name:/Guardar Cliente/}).click()
 await expect(page).toHaveURL(/\/clients$/)
})


test('portal móvil: tareas antes de información secundaria y enlace a mis estancias',async({page})=>{
 const session=await page.request.post(`${api}/users/session`,{headers:{'X-Hotel-Request':'1'},data:{email:'customer@hotel.com',password:'Customer123!'}})
 expect(session.status()).toBe(200)
 await page.setViewportSize({width:390,height:844});await page.goto('/portal')
 await expect(page.getByRole('heading',{name:/Hola,/})).toBeVisible()
 const stays=page.locator('#mis-estancias'),essentials=page.locator('.guest-essentials')
 expect((await stays.boundingBox())!.y).toBeLessThan((await essentials.boundingBox())!.y)
 await expect(page.locator('.welcome-visual')).toBeHidden()
 await expect(page.getByRole('link',{name:'Mis estancias',exact:true})).toHaveAttribute('href','/portal#mis-estancias')
 await page.screenshot({path:'/private/tmp/hotel-ux-portal-mobile.png'})
})
