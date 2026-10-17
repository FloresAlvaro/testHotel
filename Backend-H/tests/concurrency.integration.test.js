// Usa exclusivamente TEST_DATABASE_URL; crea y elimina un esquema propio.
jest.mock('../src/config/database', () => {
  const { Pool } = require('pg');
  const pool = new Pool({
    connectionString: process.env.TEST_DATABASE_URL,
    options: `-c search_path=hotel_test_${process.pid},public`, max: 12
  });
  pool.transaction = async (work) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const context = require('../src/utils/requestContext').getStore();
      if (context) await client.query("SELECT set_config('hotel.actor_id',$1,true),set_config('hotel.actor_ip',$2,true)",[String(context.userId),context.ip||'']);
      const result = await work(client);
      await client.query('COMMIT');
      return result;
    } catch (error) { await client.query('ROLLBACK'); throw error; }
    finally { client.release(); }
  };
  const query = pool.query.bind(pool);
  pool.query = (text, params) => require('../src/utils/requestContext').getStore()
    ? pool.transaction(client => client.query(text, params)) : query(text, params);
  return pool;
});

const pool = require('../src/config/database');
const ReservationService = require('../src/services/reservationService');
const PaymentService = require('../src/services/paymentService');
const ReservationController = require('../src/controllers/reservationController');
const CheckInController = require('../src/controllers/checkInController');
const Payment = require('../src/models/Payment');
const Room = require('../src/models/Room');
const Reservation = require('../src/models/Reservation');
const fs = require('fs');
const path = require('path');
const { createToken } = require('../src/utils/jwt');
const express = require('express');
const userRoutes = require('../src/routes/users');
const errorHandler = require('../src/middleware/errorHandler');
const { hashPassword } = require('../src/utils/password');
const describeDb = process.env.TEST_DATABASE_URL ? describe : describe.skip;

const invoke = async (method, req) => {
  let body;
  let code;
  const res = { status: (value) => { code = value; return res; }, json: (value) => { body = value; } };
  let failure;
  await method(req, res, (err) => { failure = err; });
  if (failure) throw failure;
  if (code >= 400) throw Object.assign(new Error(body.message), { statusCode: code });
  return body.data;
};

// Una transacción mantiene el bloqueo hasta que los dos contendientes están esperando.
const race = async (table, id, operations) => {
  const gate = await pool.connect();
  await gate.query('BEGIN');
  await gate.query(`SELECT id FROM ${table} WHERE id=$1 FOR UPDATE`, [id]);
  const running = operations.map(fn => fn());
  const settled = Promise.allSettled(running);
  try {
    let blocked = false;
    for (let attempt = 0; attempt < 100; attempt++) {
      await gate.query('SELECT pg_stat_clear_snapshot()');
      const result = await gate.query(`SELECT count(*)::int AS count FROM pg_stat_activity
        WHERE datname=current_database() AND pid <> pg_backend_pid() AND wait_event_type='Lock'`);
      if (result.rows[0].count >= operations.length) { blocked = true; break; }
      await new Promise(resolve => setTimeout(resolve, 10));
    }
    if (!blocked) throw new Error('Los contendientes no alcanzaron el bloqueo esperado');
  } finally { await gate.query('COMMIT'); gate.release(); await settled; }
  return settled;
};

let roomId, userId, clientId;
const reserve = async (start, end, total = '100.00') => (await pool.query(`
  INSERT INTO reservation (check_in,check_out,client_id,room_id,user_id,total_price)
  VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`, [start,end,clientId,roomId,userId,total])).rows[0];
const payment = (reservation, amount = '60.00') => Payment.create({ reservation_id: reservation.id, amount, type: 'partial', method: 'cash' });

describeDb('Concurrencia real PostgreSQL y altas de empleados', () => {
  let server;
  let base;
  beforeAll(async () => {
    await pool.query(`CREATE SCHEMA hotel_test_${process.pid}`);
    await pool.query(fs.readFileSync(path.join(__dirname, '../../database/init/01-schema.sql'), 'utf8'));
    for (const file of fs.readdirSync(path.join(__dirname, '../../database/migrations')).filter(f=>f.endsWith('.sql')).sort()) {
      await pool.query(fs.readFileSync(path.join(__dirname, '../../database/migrations',file), 'utf8'));
    }
    const app = express();
    app.use(require('../src/middleware/requestId'));
    app.use(express.json());
    app.use('/users', userRoutes);
    app.use('/api', require('../src/routes'));
    app.use(errorHandler);
    server = app.listen(0, '127.0.0.1');
    await new Promise(resolve => server.once('listening', resolve));
    base = `http://127.0.0.1:${server.address().port}`;
  });
  beforeEach(async () => {
    await pool.query('TRUNCATE "user", client, room_type, room, reservation, payment, check_in_log, audit_log, email_outbox, payment_webhook RESTART IDENTITY CASCADE');
    userId = (await pool.query(`INSERT INTO "user" (name,email,password,role) VALUES ('Admin','admin@example.com','hash','admin') RETURNING id`)).rows[0].id;
    clientId = (await pool.query(`INSERT INTO client (name,document) VALUES ('Huésped','123') RETURNING id`)).rows[0].id;
    const type = (await pool.query(`INSERT INTO room_type (name,price) VALUES ('Doble',100) RETURNING id`)).rows[0].id;
    roomId = (await pool.query(`INSERT INTO room (number,room_type_id,floor) VALUES ('101',$1,1) RETURNING id`,[type])).rows[0].id;
  });
  afterAll(async () => {
    if (server) await new Promise(resolve => server.close(resolve));
    await pool.query(`DROP SCHEMA IF EXISTS hotel_test_${process.pid} CASCADE`);
    await pool.end();
  });

  test('dos creaciones simultáneas de la misma habitación: solo una gana', async () => {
    const create = () => invoke(ReservationController.create, { user: { id: userId }, body: {
      check_in: '2030-01-01', check_out: '2030-01-03', client_id: clientId, room_id: roomId, notes: 'Bienvenida'
    } });
    const results = await race('room', roomId, [create, create]);
    expect(results.filter(r => r.status === 'fulfilled')).toHaveLength(1);
    expect(results.find(r => r.status === 'rejected').reason.statusCode).toBe(409);
    const rows = await pool.query('SELECT * FROM reservation');
    expect(rows.rowCount).toBe(1);
    expect(rows.rows[0].notes).toBe('Bienvenida');
  });

  test('la disponibilidad permite estancias contiguas aunque la habitación esté reservada', async () => {
    await reserve('2030-01-01','2030-01-03');
    await Room.updateStatus(roomId,'reserved');
    const rooms = await Room.findAvailableForDates('2030-01-03','2030-01-05');
    expect(rooms.map(r => r.id)).toContain(roomId);
    expect(await Room.findAvailableForDates('2030-01-02','2030-01-04')).toHaveLength(0);
  });

  test('dos modificaciones simultáneas no pueden terminar solapadas', async () => {
    const a = await reserve('2030-01-01','2030-01-03');
    const b = await reserve('2030-01-06','2030-01-08');
    const results = await race('room', roomId, [
      () => ReservationService.update(a.id, { check_in: '2030-01-03', check_out: '2030-01-05' }),
      () => ReservationService.update(b.id, { check_in: '2030-01-03', check_out: '2030-01-05' })
    ]);
    expect(results.filter(r => r.status === 'fulfilled')).toHaveLength(1);
    expect(results.find(r => r.status === 'rejected').reason.statusCode).toBe(409);
  });

  test('cancelar una reserva conserva la habitación ocupada por otra estancia', async () => {
    const active = await reserve('2030-01-01','2030-01-03');
    const future = await reserve('2030-01-05','2030-01-07');
    await pool.query("UPDATE reservation SET status='checked_in' WHERE id=$1",[active.id]);
    await Room.updateStatus(roomId,'occupied');
    await ReservationService.cancel(future.id);
    expect((await Room.findById(roomId)).status).toBe('occupied');
  });

  test('cancelación y check-in simultáneos: una sola transición se confirma', async () => {
    const r = await reserve('2030-01-01','2030-01-03');
    const results = await race('room', roomId, [
      () => ReservationService.cancel(r.id),
      () => invoke(CheckInController.checkIn, { user: { id: userId }, body: { reservation_id: r.id } })
    ]);
    expect(results.filter(r => r.status === 'fulfilled')).toHaveLength(1);
    const current = (await pool.query('SELECT status FROM reservation WHERE id=$1',[r.id])).rows[0];
    const logs = await pool.query('SELECT * FROM check_in_log');
    expect(logs.rowCount).toBe(current.status === 'checked_in' ? 1 : 0);
  });

  test('completar dos pagos simultáneos no excede el total de la reserva', async () => {
    const r = await reserve('2030-01-01','2030-01-03');
    const a = await payment(r), b = await payment(r);
    const results = await race('reservation', r.id, [
      () => PaymentService.changeStatus(a.id, 'completed', 'pending'),
      () => PaymentService.changeStatus(b.id, 'completed', 'pending')
    ]);
    expect(results.filter(r => r.status === 'fulfilled')).toHaveLength(1);
    expect(results.find(r => r.status === 'rejected').reason.statusCode).toBe(409);
    const total = await pool.query("SELECT SUM(amount) as total FROM payment WHERE status='completed'");
    expect(total.rows[0].total).toBe('60.00');
  });

  test('editar y completar simultáneamente un pago nunca altera un pago completado', async () => {
    const r = await reserve('2030-01-01','2030-01-03');
    const p = await payment(r,'40.00');
    const results = await race('reservation', r.id, [
      () => PaymentService.changeStatus(p.id, 'completed', 'pending'),
      () => PaymentService.update(p.id, { amount: 80 })
    ]);
    expect(results.some(r => r.status === 'fulfilled')).toBe(true);
    const current = await Payment.findById(p.id);
    expect(current.status).toBe('completed');
    expect(['40.00','80.00']).toContain(current.amount);
  });

  test('los centavos permiten cobrar 0.10 + 0.20 de una reserva de 0.30', async () => {
    const r = await reserve('2030-01-01','2030-01-03','0.30');
    const a = await payment(r,'0.10'), b = await payment(r,'0.20');
    await PaymentService.changeStatus(a.id,'completed');
    await PaymentService.changeStatus(b.id,'completed');
    await expect(ReservationService.update(r.id,{ total_price: 0.29 })).rejects.toMatchObject({statusCode:409});
  });

  test('no permite cobrar una reserva cancelada ni completar dos veces el mismo pago', async () => {
    const r = await reserve('2030-01-01','2030-01-03');
    const p = await payment(r);
    await PaymentService.changeStatus(p.id,'completed','pending');
    await expect(PaymentService.changeStatus(p.id,'completed','pending')).rejects.toMatchObject({statusCode:409});
    await ReservationService.cancel(r.id);
    await expect(PaymentService.create({reservation_id:r.id,amount:10,method:'cash'})).rejects.toMatchObject({statusCode:409});
  });

  test('el alta inicial local crea un administrador y rechaza repetirse', async () => {
    await pool.query('DELETE FROM "user"');
    const { spawn } = require('child_process');
    const bootstrap = () => new Promise((resolve, reject) => {
      const url = new URL(process.env.TEST_DATABASE_URL);
      url.searchParams.set('options', `-c search_path=hotel_test_${process.pid},public`);
      const child = spawn(process.execPath, [path.join(__dirname, '../scripts/create-admin.js')], {
        env: { ...process.env, DATABASE_URL: url.toString(), NODE_ENV: 'test' }, stdio: ['pipe', 'pipe', 'pipe']
      });
      let output = '', step = 0;
      const timeout = setTimeout(() => { child.kill(); reject(new Error('El alta inicial no terminó')); }, 5000);
      child.stdout.on('data', chunk => {
        output += chunk.toString();
        if (step === 0 && output.includes('administrador:')) { step++; child.stdin.write('Responsable\n'); }
        if (step === 1 && output.includes('Email:')) { step++; child.stdin.write('responsable@example.com\n'); }
        if (step === 2 && output.includes('entrada oculta):')) { step++; child.stdin.write('test-bootstrap-password\n'); }
      });
      child.stderr.on('data', chunk => { output += chunk.toString(); });
      child.on('error', err => { clearTimeout(timeout); reject(err); });
      child.on('close', code => { clearTimeout(timeout); resolve({ code, output }); });
    });
    const first = await bootstrap();
    expect(first.code).toBe(0);
    expect(first.output).not.toContain('test-bootstrap-password');
    const second = await bootstrap();
    expect(second.code).toBe(1);
    expect(second.output).not.toContain('test-bootstrap-password');
    const admins = await pool.query('SELECT role FROM "user"');
    expect(admins.rows).toEqual([{ role: 'admin' }]);
  });

  test('reducir el total y completar un pago en paralelo no deja un exceso cobrado', async () => {
    const r = await reserve('2030-01-01','2030-01-03');
    const p = await payment(r,'80.00');
    const results = await race('reservation', r.id, [
      () => ReservationService.update(r.id, { total_price: 50 }),
      () => PaymentService.changeStatus(p.id, 'completed', 'pending')
    ]);
    expect(results.filter(r => r.status === 'fulfilled')).toHaveLength(1);
    const current = (await pool.query('SELECT total_price FROM reservation WHERE id=$1',[r.id])).rows[0];
    const paid = await Payment.findById(p.id);
    expect(paid.status === 'completed' ? Number(paid.amount) : 0).toBeLessThanOrEqual(Number(current.total_price));
  });

  test('altas HTTP: bloquea anónimos y recepción, permite admin sin emitir token', async () => {
    const body = { name:'Empleado', email:'empleado@example.com', password:'test-password-123', role:'manager' };
    const post = (route, token) => fetch(base + route, { method:'POST', headers:{'Content-Type':'application/json', ...(token ? {Authorization:'Bearer '+token} : {})}, body:JSON.stringify(body) });
    for (const route of ['/users','/users/register']) expect((await post(route)).status).toBe(401);
    const other = (await pool.query(`INSERT INTO "user" (name,email,password,role) VALUES ('Recepción','recepcion@example.com','hash','receptionist') RETURNING id`)).rows[0];
    for (const route of ['/users','/users/register']) expect((await post(route,createToken({id:other.id}))).status).toBe(403);
    const token = createToken({id:userId});
    const result = await post('/users', token);
    expect(result.status).toBe(201);
    const json = await result.json();
    expect(json.data.role).toBe('manager');
    expect(json.data.password).toBeUndefined();
    expect(json.data.token).toBeUndefined();
    expect((await post('/users',token)).status).toBe(409);
    await pool.query('UPDATE "user" SET password=$1 WHERE id=$2',[await hashPassword('admin-password-123'),userId]);
    const login = await fetch(base+'/users/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:'admin@example.com',password:'admin-password-123'})});
    expect(login.status).toBe(200);
    expect((await login.json()).data.token).toBeDefined();
  });
  const api = async (path, method='GET', body, token) => {
    const result=await fetch(`${base}/api${path}`,{method,headers:{'Content-Type':'application/json',Authorization:`Bearer ${token||createToken({id:userId,role:'admin'})}`},body:body===undefined?undefined:JSON.stringify(body)});
    return {status:result.status,body:await result.json()};
  };
  test('flujo HTTP completo: reserva, caja, cobro, recibo, salida, limpieza y arqueo',async()=>{
    const reservation=await api('/reservations','POST',{check_in:'2031-02-01',check_out:'2031-02-03',client_id:clientId,room_id:roomId});
    expect(reservation.status).toBe(201);
    const rid=reservation.body.data.id;
    expect((await api('/check-in','POST',{reservation_id:rid})).status).toBe(200);
    const p=await api('/payments','POST',{reservation_id:rid,amount:200,method:'cash',type:'full'});
    expect(p.status).toBe(201);
    const pid=p.body.data.id;
    expect((await api(`/payments/${pid}/complete`,'PATCH')).status).toBe(409);
    const shift=await api('/operations/cash-shifts','POST',{opening_amount:50});
    expect(shift.status).toBe(201);
    expect((await api('/operations/cash-shifts','POST',{opening_amount:0})).status).toBe(409);
    expect((await api(`/payments/${pid}/complete`,'PATCH')).status).toBe(200);
    const receipt=await api(`/operations/receipts/${pid}`);
    expect(Number(receipt.body.data.snapshot.payment.amount)).toBe(200);
    expect(receipt.body.data.number).toMatch(/^REC-/);
    expect((await api('/check-in/check-out','POST',{reservation_id:rid})).status).toBe(200);
    const tasks=await api('/operations/tasks');
    expect(tasks.body.data).toHaveLength(1);
    expect((await Room.findById(roomId)).status).toBe('maintenance');
    await expect(Room.updateStatus(roomId,'available')).rejects.toMatchObject({code:'P0001'});
    expect((await api(`/operations/tasks/${tasks.body.data[0].id}`,'PATCH',{status:'completed'})).status).toBe(200);
    expect((await Room.findById(roomId)).status).toBe('available');
    const closed=await api(`/operations/cash-shifts/${shift.body.data.id}/close`,'POST',{counted_amount:250});
    expect(closed.body.data.expected_amount).toBe('250.00');
    expect((await api(`/operations/cash-shifts/${shift.body.data.id}/close`,'POST',{counted_amount:250})).status).toBe(409);
    const audit=await api(`/operations/audit?table=payment&record_id=${pid}`);
    expect(audit.body.data.some(a=>a.user_id===userId&&a.action==='UPDATE')).toBe(true);
    const calendar=await api('/operations/calendar?start=2031-02-01&end=2031-02-04');
    expect(calendar.body.data.reservations.map(r=>r.id)).toContain(rid);
  });
  test('configuración: control de versión, persistencia, permisos y moneda',async()=>{
    const original=(await api('/operations/settings')).body.data;
    const {id,updated_at,...data}=original;
    const saved=await api('/operations/settings','PUT',{...data,hotel_name:'Hotel Compartido',check_out_time:'12:00'});
    expect(saved.status).toBe(200);
    expect((await api('/operations/settings')).body.data.hotel_name).toBe('Hotel Compartido');
    expect((await api('/operations/settings','PUT',data)).status).toBe(409);
    const current=saved.body.data;delete current.id;delete current.updated_at;
    expect((await api('/operations/settings','PUT',{...current,timezone:'Inventada/Zona'})).status).toBe(400);
    await reserve('2030-01-01','2030-01-03');
    expect((await api('/operations/settings','PUT',{...current,currency:'USD'})).status).toBe(409);
    const receptionist=(await pool.query(`INSERT INTO "user"(name,email,password,role) VALUES('Recepción','reception@sample.com','hash','receptionist') RETURNING id`)).rows[0];
    const token=createToken({id:receptionist.id,role:'receptionist'});
    expect((await api('/operations/settings','PUT',current,token)).status).toBe(403);
    expect((await api('/operations/audit','GET',undefined,token)).status).toBe(403);
    expect((await api('/operations/tasks','POST',{room_id:roomId,kind:'cleaning',title:'Prueba'},token)).status).toBe(403);
    const history=await api('/operations/audit?table=user');
    expect(JSON.stringify(history.body.data)).not.toContain('"password"');
  });
  test('reembolso conserva el comprobante y se descuenta del arqueo',async()=>{
    const r=await reserve('2032-01-01','2032-01-03');
    const p=await payment(r,'60.00');
    const shift=await api('/operations/cash-shifts','POST',{opening_amount:10});
    await api(`/payments/${p.id}/complete`,'PATCH');
    const receipt=(await api(`/operations/receipts/${p.id}`)).body.data;
    expect((await api(`/payments/${p.id}/refund`,'PATCH')).status).toBe(200);
    const refunded=(await api(`/operations/receipts/${p.id}`)).body.data;
    expect(refunded.snapshot).toEqual(receipt.snapshot);
    expect(refunded.payment_status).toBe('refunded');
    expect((await api(`/payments/${p.id}/refund`,'PATCH')).status).toBe(409);
    const closed=await api(`/operations/cash-shifts/${shift.body.data.id}/close`,'POST',{counted_amount:10});
    expect(closed.body.data.expected_amount).toBe('10.00');
  });
  test('cierre concurrente con cobro: el movimiento queda incluido o el cobro se rechaza',async()=>{
    const r=await reserve('2032-01-01','2032-01-03');const p=await payment(r,'60.00');
    const shift=(await api('/operations/cash-shifts','POST',{opening_amount:10})).body.data;
    const results=await Promise.all([api(`/operations/cash-shifts/${shift.id}/close`,'POST',{counted_amount:10}),api(`/payments/${p.id}/complete`,'PATCH')]);
    expect(results[0].status).toBe(200);expect([200,409]).toContain(results[1].status);
    expect(results[0].body.data.expected_amount).toBe(results[1].status===200?'70.00':'10.00');
  });

  test('tareas: permisos del responsable y bloqueo hasta completar todas',async()=>{
    const employee=(await pool.query(`INSERT INTO "user"(name,email,password,role) VALUES('Personal','tasks@sample.com','hash','receptionist') RETURNING id`)).rows[0];
    const token=createToken({id:employee.id,role:'receptionist'});
    const a=await api('/operations/tasks','POST',{room_id:roomId,kind:'cleaning',title:'Limpieza',assigned_to:employee.id});
    const b=await api('/operations/tasks','POST',{room_id:roomId,kind:'maintenance',title:'Revisión'});
    expect(a.status).toBe(201);expect(b.status).toBe(201);
    expect((await api(`/operations/tasks/${b.body.data.id}`,'PATCH',{status:'completed'},token)).status).toBe(403);
    expect((await api(`/operations/tasks/${a.body.data.id}`,'PATCH',{assigned_to:null},token)).status).toBe(403);
    expect((await api(`/operations/tasks/${a.body.data.id}`,'PATCH',{status:'completed'},token)).status).toBe(200);
    expect((await Room.findById(roomId)).status).toBe('maintenance');
    expect((await api(`/operations/tasks/${b.body.data.id}`,'PATCH',{status:'completed'})).status).toBe(200);
    expect((await Room.findById(roomId)).status).toBe('available');
    expect((await api('/operations/calendar?start=2030-02-30&end=2030-03-02')).status).toBe(400);
    expect((await api('/operations/calendar?start=2030-01-01&end=2031-01-01')).status).toBe(400);
  });

  const customer = async (guestId,email='guest@sample.com') => {
    const created=await api(`/clients/${guestId}/account`,'POST',{email,password:'Customer123!'});
    expect(created.status).toBe(201);
    const login=await api('/users/login','POST',{email,password:'Customer123!'});
    expect(login.status).toBe(200);
    return {user:created.body.data,token:login.body.data.token};
  };
  test('portal: lista, detalle y comprobante solo del huésped vinculado',async()=>{
    const own=await reserve('2033-03-01','2033-03-03');
    const p=await payment(own,'60.00');await PaymentService.changeStatus(p.id,'completed');
    const stranger=(await pool.query(`INSERT INTO client(name,document,notes) VALUES('Otro huésped','other-document','NOTA PRIVADA') RETURNING id`)).rows[0];
    const other=(await pool.query(`INSERT INTO reservation(check_in,check_out,room_id,client_id,user_id,total_price,notes) VALUES('2033-03-05','2033-03-07',$1,$2,$3,100,'NOTA INTERNA') RETURNING id`,[roomId,stranger.id,userId])).rows[0];
    const otherPayment=await Payment.create({reservation_id:other.id,amount:100,method:'cash',type:'full'});
    await PaymentService.changeStatus(otherPayment.id,'completed');
    const guest=await customer(clientId);
    const list=await api('/portal/reservations','GET',undefined,guest.token);
    expect(list.status).toBe(200);expect(list.body.pagination.total).toBe(1);expect(list.body.data.map(r=>r.id)).toEqual([own.id]);
    const detail=await api(`/portal/reservations/${own.id}`,'GET',undefined,guest.token);
    expect(detail.body.data.payments.map(p=>p.id)).toEqual([p.id]);
    expect(detail.body.data).not.toHaveProperty('user_id');expect(detail.body.data).not.toHaveProperty('notes');
    expect((await api(`/portal/reservations/${other.id}`,'GET',undefined,guest.token)).status).toBe(404);
    expect((await api(`/portal/receipts/${otherPayment.id}`,'GET',undefined,guest.token)).status).toBe(404);
    expect((await api(`/portal/receipts/${p.id}`,'GET',undefined,guest.token)).body.data.snapshot).not.toHaveProperty('issued_by');
    expect((await api(`/portal/receipts/${p.id}`,'GET',undefined,guest.token)).body.data.snapshot.payment).not.toHaveProperty('notes');
    expect((await api(`/portal/receipts/${p.id}`,'GET',undefined,guest.token)).body.data.snapshot.payment).not.toHaveProperty('transaction_id');
    expect((await api('/portal/reservations?client_id='+stranger.id,'GET',undefined,guest.token)).status).toBe(400);
    const forged=createToken({id:guest.user.id,role:'admin',client_id:stranger.id});
    expect((await api('/portal/reservations','GET',undefined,forged)).body.data.map(r=>r.id)).toEqual([own.id]);
    expect((await api('/portal/reservations','GET')).status).toBe(403);
  });
  test('customer no puede consultar ni modificar rutas del personal',async()=>{
    const guest=await customer(clientId);
    const paths=['/clients','/rooms','/room-types','/reservations','/check-in/today','/payments','/dashboard','/operations/settings','/operations/calendar','/operations/tasks','/operations/audit','/operations/task-assignees','/operations/cash-shifts','/users','/users/search?q=Admin'];
    for(const path of paths) expect((await api(path,'GET',undefined,guest.token)).status).toBe(403);
    expect((await api('/reservations','POST',{client_id:clientId},guest.token)).status).toBe(403);
    expect((await api('/users/register','POST',{name:'Escalada',email:'bad@sample.com',password:'Customer123!',role:'admin'},guest.token)).status).toBe(403);
    expect((await api(`/clients/${clientId}/account`,'PATCH',{is_active:false},guest.token)).status).toBe(403);
    expect((await api('/portal/profile','GET',undefined,guest.token)).body.data.name).toBe('Huésped');
    expect((await api('/portal/hotel','GET',undefined,guest.token)).status).toBe(200);
    const staff=await api('/users');expect(staff.body.data.map(u=>u.id)).not.toContain(guest.user.id);
    const assignees=await api('/operations/task-assignees');expect(assignees.body.data.map(u=>u.id)).not.toContain(guest.user.id);
    expect((await api('/operations/tasks','POST',{room_id:roomId,kind:'cleaning',title:'Prueba',assigned_to:guest.user.id})).status).toBe(400);
  });
  test('alta controlada: vínculo único, sin token, y desactivación invalida sesiones',async()=>{
    const guest=await customer(clientId);
    expect(guest.user).not.toHaveProperty('password');expect(guest.user).not.toHaveProperty('token');
    expect((await api(`/clients/${clientId}/account`,'POST',{email:'another@sample.com',password:'Customer123!'})).status).toBe(409);
    expect((await api(`/clients/${clientId}/account`,'PATCH',{is_active:false})).status).toBe(200);
    expect((await api('/portal/reservations','GET',undefined,guest.token)).status).toBe(403);
    expect((await api('/users/login','POST',{email:'guest@sample.com',password:'Customer123!'})).status).toBe(403);
    await api(`/clients/${clientId}/account`,'PATCH',{is_active:true});
    await pool.query('UPDATE client SET is_active=false WHERE id=$1',[clientId]);
    expect((await api('/portal/profile','GET',undefined,guest.token)).status).toBe(403);
    expect((await api('/users/login','POST',{email:'guest@sample.com',password:'Customer123!'})).status).toBe(403);
    await expect(pool.query(`INSERT INTO "user"(name,email,password,role) VALUES('No vinculado','unlinked@sample.com','hash','customer')`)).rejects.toMatchObject({code:'23514'});
  });

  test('reserva customer: cotiza, calcula precio y vincula solo a su ficha',async()=>{
    const guest=await customer(clientId);
    const quote=await api('/portal/availability?check_in=2034-04-01&check_out=2034-04-03','GET',undefined,guest.token);
    expect(quote.status).toBe(200);expect(quote.body.data.nights).toBe(2);
    expect(quote.body.data.rooms[0].total_price).toBe('200.00');
    const body={check_in:'2034-04-01',check_out:'2034-04-03',room_id:roomId,expected_total:200,expected_currency:'BOB'};
    expect((await api('/portal/reservations','POST',{...body,client_id:999},guest.token)).status).toBe(422);
    expect((await api('/portal/reservations','POST',{...body,expected_total:1},guest.token)).status).toBe(409);
    expect((await api('/portal/reservations','POST',{...body,expected_currency:'USD'},guest.token)).status).toBe(409);
    const created=await api('/portal/reservations','POST',body,guest.token);
    expect(created.status).toBe(201);expect(created.body.data.total_price).toBe('200.00');
    const row=(await pool.query('SELECT * FROM reservation WHERE id=$1',[created.body.data.id])).rows[0];
    expect(row.client_id).toBe(clientId);expect(row.user_id).toBe(guest.user.id);expect(row.status).toBe('confirmed');
    expect((await api('/portal/reservations','POST',body,guest.token)).status).toBe(409);
    expect((await api('/portal/availability?check_in=2034-04-01&check_out=2034-04-03','GET',undefined,guest.token)).body.data.rooms).toHaveLength(0);
    expect((await api('/portal/availability?check_in=2034-04-03&check_out=2034-04-05','GET',undefined,guest.token)).body.data.rooms).toHaveLength(1);
    expect((await api('/portal/reservations','POST',body)).status).toBe(403);
  });
  test('reserva customer: rechaza fechas y revalida habitaciones bloqueadas y tarifas',async()=>{
    const guest=await customer(clientId);
    for(const range of ['check_in=2000-01-01&check_out=2000-01-03','check_in=2034-02-30&check_out=2034-03-03','check_in=2034-01-03&check_out=2034-01-01','check_in=2034-01-01&check_out=2036-01-01']){
      expect([400,422]).toContain((await api('/portal/availability?'+range,'GET',undefined,guest.token)).status);
    }
    const body={check_in:'2034-05-01',check_out:'2034-05-03',room_id:roomId,expected_total:200,expected_currency:'BOB'};
    await pool.query('UPDATE room_type SET price=120 WHERE id=(SELECT room_type_id FROM room WHERE id=$1)',[roomId]);
    expect((await api('/portal/reservations','POST',body,guest.token)).status).toBe(409);
    await api('/operations/tasks','POST',{room_id:roomId,kind:'maintenance',title:'Bloqueo'});
    expect((await api('/portal/reservations','POST',{...body,expected_total:240},guest.token)).status).toBe(409);
    expect((await pool.query('SELECT COUNT(*) FROM reservation')).rows[0].count).toBe('0');
  });
  test('dos clientes intentan reservar la misma habitación: una sola confirmación',async()=>{
    const first=await customer(clientId);
    const secondClient=(await pool.query(`INSERT INTO client(name,document) VALUES('Segundo cliente','booking-second') RETURNING id`)).rows[0];
    const second=await customer(secondClient.id,'second-booking@sample.com');
    const body={check_in:'2034-06-01',check_out:'2034-06-03',room_id:roomId,expected_total:200,expected_currency:'BOB'};
    const results=await race('room',roomId,[()=>api('/portal/reservations','POST',body,first.token),()=>api('/portal/reservations','POST',body,second.token)]);
    expect(results.map(r=>r.value.status).sort()).toEqual([201,409]);
    expect((await pool.query('SELECT COUNT(*) FROM reservation')).rows[0].count).toBe('1');
  });

  test('solicitudes: aislamiento, aprobación única y reglas de fechas',async()=>{
    const r=await reserve('2035-02-01','2035-02-03',200),guest=await customer(clientId);
    const body={kind:'dates',check_in:'2035-02-05',check_out:'2035-02-07',reason:'Cambio de viaje solicitado'};
    const q=await api(`/portal/reservations/${r.id}/requests`,'POST',body,guest.token);
    expect(q.status).toBe(201);
    expect((await api(`/portal/reservations/${r.id}/requests`,'POST',body,guest.token)).status).toBe(409);
    expect((await api(`/operations/reservation-requests/${q.body.data.id}/review`,'POST',{decision:'approved',response:'Tarifa acordada de 220 BOB',total_price:220},guest.token)).status).toBe(403);
    const approved=await api(`/operations/reservation-requests/${q.body.data.id}/review`,'POST',{decision:'approved',response:'Tarifa acordada de 220 BOB',total_price:220});
    expect(approved.status).toBe(200);
    expect((await pool.query("SELECT recipient FROM email_outbox WHERE event_key LIKE 'request:%'")).rows[0].recipient).toBe('guest@sample.com');
    expect((await Reservation.findById(r.id)).total_price).toBe('220.00');
    expect((await api(`/operations/reservation-requests/${q.body.data.id}/review`,'POST',{decision:'rejected',response:'Repetición inválida'})).status).toBe(409);
    const other=(await pool.query(`INSERT INTO client(name,document) VALUES('Otro','request-other') RETURNING id`)).rows[0];
    const stranger=await customer(other.id,'request-other@sample.com');
    expect((await api(`/portal/reservations/${r.id}/requests`,'POST',{kind:'cancel',reason:'No es mi reserva'},stranger.token)).status).toBe(404);
  });
  test('no aprueba fechas solapadas ni solicitudes fuera del plazo',async()=>{
    const r=await reserve('2036-01-01','2036-01-03',200),guest=await customer(clientId);
    await reserve('2036-01-05','2036-01-07',200);
    const q=await api(`/portal/reservations/${r.id}/requests`,'POST',{kind:'dates',check_in:'2036-01-05',check_out:'2036-01-06',reason:'Otra fecha para viajar'},guest.token);
    expect((await api(`/operations/reservation-requests/${q.body.data.id}/review`,'POST',{decision:'approved',response:'Aceptamos las nuevas fechas',total_price:200})).status).toBe(409);
    await pool.query('UPDATE reservation SET check_in=CURRENT_DATE,check_out=CURRENT_DATE+1 WHERE id=$1',[r.id]);
    await pool.query('DELETE FROM reservation_request WHERE id=$1',[q.body.data.id]);
    expect((await api(`/portal/reservations/${r.id}/requests`,'POST',{kind:'cancel',reason:'Demasiado tarde para solicitar'},guest.token)).status).toBe(409);
  });
  test('pagos demo: anticipo, duplicados, aislamiento y reembolso idempotente',async()=>{
    process.env.PAYMENT_PROVIDER='demo';process.env.ALLOW_DEMO_PAYMENTS='true';
    try{
      const r=await reserve('2037-01-01','2037-01-03',200),guest=await customer(clientId);
      const checkout=await api(`/portal/reservations/${r.id}/checkout`,'POST',{mode:'deposit'},guest.token);
      expect(checkout.status).toBe(201);expect(checkout.body.data.amount).toBe('60.00');
      const id=checkout.body.data.id;
      expect((await api(`/portal/reservations/${r.id}/checkout`,'POST',{mode:'balance'},guest.token)).body.data.id).toBe(id);
      const results=await Promise.all([1,2].map(()=>api(`/portal/online-payments/${id}/demo-confirm`,'POST',{},guest.token)));
      expect(results.map(v=>v.status)).toEqual([200,200]);
      expect((await pool.query('SELECT * FROM payment WHERE reservation_id=$1',[r.id])).rowCount).toBe(1);
      expect((await pool.query('SELECT * FROM payment_receipt')).rowCount).toBe(1);
      expect((await pool.query('SELECT * FROM cash_movement WHERE shift_id IS NULL')).rowCount).toBe(1);
      const p=(await pool.query('SELECT id FROM payment')).rows[0];
      expect((await api(`/payments/${p.id}/refund`,'PATCH')).status).toBe(409);
      expect((await api(`/operations/online-payments/${id}/refund`,'POST',{},guest.token)).status).toBe(403);
      expect((await api(`/operations/online-payments/${id}/refund`,'POST',{})).status).toBe(200);
      expect((await api(`/operations/online-payments/${id}/refund`,'POST',{})).status).toBe(200);
      expect((await pool.query("SELECT * FROM cash_movement WHERE kind='refund'")).rowCount).toBe(1);
    }finally{delete process.env.PAYMENT_PROVIDER;delete process.env.ALLOW_DEMO_PAYMENTS;}
  });
  test('recuperación: respuesta neutra, token único, sesión revocada y correo en cola',async()=>{
    process.env.SMTP_HOST='isolated-test';process.env.MAIL_FROM='test@hotel.test';
    try{
      const guest=await customer(clientId);
      const existing=await api('/users/forgot-password','POST',{email:'guest@sample.com'});
      const absent=await api('/users/forgot-password','POST',{email:'absent@sample.com'});
      expect(existing.status).toBe(200);expect(existing.body).toEqual(absent.body);
      const email=(await pool.query("SELECT body FROM email_outbox WHERE event_key LIKE 'reset:%'")).rows[0];
      const token=new URL(email.body.split('\n')[1]).searchParams.get('token');
      const body={token,password:'NewCustomer123!'};
      expect((await api('/users/reset-password','POST',body)).status).toBe(200);
      expect((await api('/users/reset-password','POST',body)).status).toBe(400);
      expect((await api('/portal/profile','GET',undefined,guest.token)).status).toBe(401);
      expect((await api('/users/login','POST',{email:'guest@sample.com',password:'NewCustomer123!'})).status).toBe(200);
    }finally{delete process.env.SMTP_HOST;delete process.env.MAIL_FROM;}
  });

  test('webhook Stripe: importe verificado, entrega repetida y cobro tardío',async()=>{
    const service=require('../src/services/onlinePaymentService');
    const r=await reserve('2038-01-01','2038-01-03',200),guest=await customer(clientId);
    const id=require('crypto').randomUUID();
    await pool.query("INSERT INTO online_payment(id,reservation_id,user_id,provider,amount,currency,provider_session,expires_at) VALUES($1,$2,$3,'stripe',200,'USD','cs_isolated',now()+interval '1 hour')",[id,r.id,guest.user.id]);
    const event={id:'evt_isolated',type:'checkout.session.completed',data:{object:{id:'cs_isolated',payment_status:'paid',amount_total:20001,currency:'usd',payment_intent:'pi_isolated'}}};
    await expect(service.handleEvent(event)).rejects.toMatchObject({statusCode:409});
    expect((await pool.query('SELECT * FROM payment')).rowCount).toBe(0);
    event.data.object.amount_total=20000;
    await Promise.all([service.handleEvent(event),service.handleEvent(event)]);
    expect((await pool.query('SELECT * FROM payment')).rowCount).toBe(1);
    expect((await pool.query('SELECT * FROM payment_webhook')).rowCount).toBe(1);
    const other=await reserve('2038-02-01','2038-02-03',200),lateId=require('crypto').randomUUID();
    await pool.query("INSERT INTO online_payment(id,reservation_id,user_id,provider,amount,currency,provider_session,expires_at) VALUES($1,$2,$3,'stripe',200,'USD','cs_late',now()+interval '1 hour')",[lateId,other.id,guest.user.id]);
    await ReservationService.cancel(other.id);
    await service.handleEvent({id:'evt_late',type:'checkout.session.completed',data:{object:{id:'cs_late',payment_status:'paid',amount_total:20000,currency:'usd',payment_intent:'pi_late'}}});
    expect((await pool.query('SELECT status FROM online_payment WHERE id=$1',[lateId])).rows[0].status).toBe('refund_pending');
    expect((await pool.query('SELECT * FROM payment WHERE reservation_id=$1',[other.id])).rowCount).toBe(0);
  });
  test('checkout vencido y enlace de recuperación vencido no se pueden usar',async()=>{
    process.env.PAYMENT_PROVIDER='demo';process.env.ALLOW_DEMO_PAYMENTS='true';
    try{
      const r=await reserve('2039-01-01','2039-01-03',200),guest=await customer(clientId);
      const p=await api(`/portal/reservations/${r.id}/checkout`,'POST',{mode:'deposit'},guest.token);
      await pool.query("UPDATE online_payment SET expires_at=now()-interval '1 minute' WHERE id=$1",[p.body.data.id]);
      expect((await api(`/portal/online-payments/${p.body.data.id}/demo-confirm`,'POST',{},guest.token)).status).toBe(409);
      await require('../src/services/onlinePaymentService').reconcile();
      expect((await pool.query('SELECT status FROM online_payment WHERE id=$1',[p.body.data.id])).rows[0].status).toBe('expired');
      const token='a'.repeat(64),hash=require('crypto').createHash('sha256').update(token).digest('hex');
      await pool.query("INSERT INTO password_reset(user_id,token_hash,expires_at) VALUES($1,$2,now()-interval '1 minute')",[guest.user.id,hash]);
      expect((await api('/users/reset-password','POST',{token,password:'OtherCustomer123!'})).status).toBe(400);
    }finally{delete process.env.PAYMENT_PROVIDER;delete process.env.ALLOW_DEMO_PAYMENTS;}
  });

  test('ocupación: filtra capacidad, rechaza exceso y guarda llegada y solicitudes',async()=>{
    const guest=await customer(clientId);
    await pool.query('UPDATE room_type SET capacity=3');
    const query='/portal/availability?check_in=2041-02-01&check_out=2041-02-03&adults=2&children=2';
    expect((await api(query,'GET',undefined,guest.token)).body.data.total).toBe(0);
    const body={check_in:'2041-02-01',check_out:'2041-02-03',room_id:roomId,expected_total:200,expected_currency:'BOB',adults:2,children:2,arrival_time:'17:30',special_requests:'Solicito cuna si está disponible'};
    expect((await api('/portal/reservations','POST',body,guest.token)).status).toBe(409);
    expect((await api('/portal/reservations','POST',{...body,adults:0},guest.token)).status).toBe(422);
    const booked=await api('/portal/reservations','POST',{...body,children:1},guest.token);
    expect(booked.status).toBe(201);
    const detail=(await api(`/portal/reservations/${booked.body.data.id}`,'GET',undefined,guest.token)).body.data;
    expect(detail).toMatchObject({adults:2,children:1,arrival_time:'17:30',special_requests:body.special_requests});
  });

  test('webhook HTTP valida firma y bytes originales antes de procesar',async()=>{
    process.env.PAYMENT_PROVIDER='stripe';process.env.STRIPE_SECRET_KEY='sk_test_isolated_not_a_real_key';process.env.STRIPE_WEBHOOK_SECRET='whsec_isolated_test';
    const webhookApp=require('../src/app');
    const http=webhookApp.listen(0,'127.0.0.1');await new Promise(resolve=>http.once('listening',resolve));
    try{
      const payload=JSON.stringify({id:'evt_signature_test',type:'ignored.test',data:{object:{}}});
      const signature=require('../src/services/onlinePaymentService').stripe().webhooks.generateTestHeaderString({payload,secret:process.env.STRIPE_WEBHOOK_SECRET});
      const url=`http://127.0.0.1:${http.address().port}/api/webhooks/stripe`;
      const headers={'Content-Type':'application/json','Stripe-Signature':signature};
      expect((await fetch(url,{method:'POST',headers,body:payload+' '})).status).toBe(400);
      expect((await fetch(url,{method:'POST',headers,body:payload})).status).toBe(200);
      expect((await pool.query('SELECT * FROM payment_webhook WHERE id=$1',['evt_signature_test'])).rowCount).toBe(1);
    }finally{await new Promise(resolve=>http.close(resolve));delete process.env.PAYMENT_PROVIDER;delete process.env.STRIPE_SECRET_KEY;delete process.env.STRIPE_WEBHOOK_SECRET;}
  });

  test('último administrador: PUT y PATCH impiden perder acceso y mantienen roles customer aislados',async()=>{
    expect((await api(`/users/${userId}`,'PUT',{name:'Admin',email:'admin@example.com',role:'manager',is_active:true})).status).toBe(409);
    expect((await api(`/users/${userId}/deactivate`,'PATCH',{})).status).toBe(409);
    expect((await pool.query('SELECT is_active,role FROM "user" WHERE id=$1',[userId])).rows[0]).toMatchObject({is_active:true,role:'admin'});
    const guest=await customer(clientId);
    expect((await api(`/users/${guest.user.id}/deactivate`,'PATCH',{})).status).toBe(409);
    expect((await api('/portal/profile','GET',undefined,guest.token)).status).toBe(200);
  });
  test('dos administradores se desactivan simultáneamente: queda exactamente uno activo',async()=>{
    const second=(await pool.query(`INSERT INTO "user"(name,email,password,role) VALUES('Admin dos','admin2@test.example','hash','admin') RETURNING id`)).rows[0];
    const service=require('../src/services/userAdministrationService');
    const results=await Promise.allSettled([service.edit(userId,{is_active:false}),service.edit(second.id,{is_active:false})]);
    expect(results.filter(r=>r.status==='fulfilled')).toHaveLength(1);
    expect(results.find(r=>r.status==='rejected').reason.statusCode).toBe(409);
    expect((await pool.query(`SELECT COUNT(*)::int AS count FROM "user" WHERE role='admin' AND is_active`)).rows[0].count).toBe(1);
  });
  test('cambio de permisos revoca JWT previo y errores incluyen el ID de petición',async()=>{
    const second=(await pool.query(`INSERT INTO "user"(name,email,password,role) VALUES('Admin dos','second-admin@example.com','hash','admin') RETURNING id`)).rows[0];
    const token=createToken({id:second.id,role:'admin'});
    expect((await api(`/users/${second.id}`,'PUT',{name:'Admin dos',email:'second-admin@example.com',role:'manager',is_active:true})).status).toBe(200);
    const response=await fetch(`${base}/api/users/profile`,{headers:{Authorization:`Bearer ${token}`,'X-Request-ID':'id-del-cliente'}});
    expect(response.status).toBe(401);
    const body=await response.json();expect(body.requestId).toBe(response.headers.get('X-Request-ID'));expect(body.requestId).not.toBe('id-del-cliente');
  });
  test('salud responde 503 si falla PostgreSQL y recupera 200',async()=>{
    const original=pool.testConnection;pool.testConnection=jest.fn().mockResolvedValue(false);
    const healthServer=require('../src/app').listen(0,'127.0.0.1');await new Promise(resolve=>healthServer.once('listening',resolve));
    try{
      const url=`http://127.0.0.1:${healthServer.address().port}/health`;
      const down=await fetch(url);expect(down.status).toBe(503);expect((await down.json()).database).toBe('unavailable');
      pool.testConnection.mockResolvedValue(true);const up=await fetch(url);expect(up.status).toBe(200);expect((await up.json()).database).toBe('available');
    }finally{await new Promise(resolve=>healthServer.close(resolve));if(original)pool.testConnection=original;else delete pool.testConnection;}
  });

});
