const fs = require('fs');
const path = require('path');
const integrationURL = process.env.BACKEND_INTEGRATION_DATABASE_URL;
const integration = integrationURL ? describe : describe.skip;

integration('Backend con PostgreSQL aislado', () => {
  let database,
    app,
    server,
    ReservationService,
    PaymentService,
    UserService,
    RoomService,
    Client,
    fixture;
  const actor = () => ({ id: fixture.admin.id, ip: '127.0.0.1' });
  const booking = (start = '2027-01-01', end = '2027-01-02', extra = {}) =>
    ReservationService.create(
      {
        client_id: fixture.client.id,
        room_id: fixture.room.id,
        check_in: start,
        check_out: end,
        ...extra,
      },
      actor(),
    );
  const request = async (route, method = 'GET', body, token) => {
    const response = await fetch(`http://127.0.0.1:${server.address().port}/api${route}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      ...(body !== undefined
        ? { body: typeof body === 'string' ? body : JSON.stringify(body) }
        : {}),
    });
    return { status: response.status, headers: response.headers, body: await response.json() };
  };
  beforeAll(async () => {
    const url = new URL(integrationURL);
    if (url.pathname !== '/review')
      throw new Error('Usa exclusivamente una base temporal llamada review');
    const { Pool } = require('pg');
    const setup = new Pool({ connectionString: integrationURL });
    try {
      await setup.query('DROP SCHEMA IF EXISTS backend_review_test CASCADE');
      await setup.query('CREATE SCHEMA backend_review_test');
      await setup.query('SET search_path TO backend_review_test, public');
      await setup.query(
        fs.readFileSync(path.resolve(__dirname, '../../database/init/01-schema.sql'), 'utf8'),
      );
    } finally {
      await setup.end();
    }
    url.searchParams.set('options', '-c search_path=backend_review_test,public');
    process.env.DATABASE_URL = url.toString();
    process.env.JWT_SECRET = 'isolated-integration-test-secret-at-least-32';
    process.env.NODE_ENV = 'test';
    process.env.ENABLE_HEALTH_CHECK = 'false';
    database = require('../src/config/database');
    await database.testConnection();
    ReservationService = require('../src/services/reservationService');
    PaymentService = require('../src/services/paymentService');
    UserService = require('../src/services/userService');
    RoomService = require('../src/services/roomService');
    Client = require('../src/models/Client');
    app = require('../src/app');
    server = await new Promise((resolve) => {
      const listener = app.listen(0, '127.0.0.1', () => resolve(listener));
    });
  }, 30000);
  beforeEach(async () => {
    await database.query(
      'TRUNCATE audit_log, check_in_log, payment, reservation, room, room_type, client, "user" RESTART IDENTITY CASCADE',
    );
    const User = require('../src/models/User');
    const RoomType = require('../src/models/RoomType');
    const Room = require('../src/models/Room');
    fixture = {
      admin: await User.create({
        name: 'Admin',
        email: 'admin@example.com',
        password: 'Review123!',
        role: 'admin',
      }),
      client: await Client.create({ name: 'Ana', document: '123456' }),
      type: await RoomType.create({ name: 'Simple', price: 100, capacity: 2 }),
    };
    fixture.room = await Room.create({ number: '101', room_type_id: fixture.type.id, floor: 0 });
  });
  afterAll(async () => {
    if (server)
      await new Promise((resolve) => {
        server.close(resolve);
        server.closeIdleConnections();
      });
    if (database) await database.close();
  });

  test('cliente mínimo usa cedula y varios emails vacíos se guardan como NULL', async () => {
    const second = await Client.create({ name: 'Bea', document: '654321', email: '' });
    const third = await Client.create({ name: 'Carla', document: '456789', email: '' });
    expect(fixture.client.document_type).toBe('cedula');
    expect(second.email).toBeNull();
    expect(third.email).toBeNull();
  });
  test('notas persistidas y ampliación de fechas recalcula importe', async () => {
    const reservation = await booking(undefined, undefined, { notes: 'VIP' });
    expect(reservation.notes).toBe('VIP');
    const updated = await ReservationService.update(
      reservation.id,
      { check_out: '2027-01-04', notes: null },
      actor(),
    );
    expect(Number(updated.total_price)).toBe(300);
    expect(updated.notes).toBeNull();
  });
  test('editar solo notas conserva precio y fechas', async () => {
    const reservation = await booking();
    const updated = await ReservationService.update(reservation.id, { notes: 'Nota' }, actor());
    expect(Number(updated.total_price)).toBe(100);
    expect(updated.notes).toBe('Nota');
  });
  test('impide entrada directa mediante update', async () => {
    const reservation = await booking();
    await expect(
      ReservationService.update(reservation.id, { status: 'checked_in' }, actor()),
    ).rejects.toMatchObject({ statusCode: 409 });
    const logs = await database.query('SELECT * FROM check_in_log');
    expect(logs.rowCount).toBe(0);
  });
  test('reserva futura y cancelación conservan habitación ocupada', async () => {
    const active = await booking();
    await ReservationService.checkIn(active.id, null, actor());
    const future = await booking('2027-02-01', '2027-02-02');
    let room = await require('../src/models/Room').findById(fixture.room.id);
    expect(room.status).toBe('occupied');
    await ReservationService.cancel(future.id, actor());
    room = await require('../src/models/Room').findById(fixture.room.id);
    expect(room.status).toBe('occupied');
  });
  test('cancelar una reserva conserva otras reservas confirmadas', async () => {
    const first = await booking();
    await booking('2027-02-01', '2027-02-02');
    await ReservationService.cancel(first.id, actor());
    expect((await require('../src/models/Room').findById(fixture.room.id)).status).toBe('reserved');
  });
  test('dos check-ins simultáneos en la misma habitación solo permiten uno', async () => {
    const first = await booking(),
      second = await booking('2027-02-01', '2027-02-02');
    const results = await Promise.allSettled(
      [first, second].map((r) => ReservationService.checkIn(r.id, null, actor())),
    );
    expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
    expect(
      (await database.query("SELECT * FROM reservation WHERE status = 'checked_in'")).rowCount,
    ).toBe(1);
  });
  test('cancelación y entrada concurrentes no dejan estados contradictorios', async () => {
    const reservation = await booking();
    const results = await Promise.allSettled([
      ReservationService.cancel(reservation.id, actor()),
      ReservationService.checkIn(reservation.id, null, actor()),
    ]);
    expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
    const stored = await require('../src/models/Reservation').findById(reservation.id);
    const room = await require('../src/models/Room').findById(fixture.room.id);
    expect(room.status).toBe(stored.status === 'cancelled' ? 'available' : 'occupied');
  });
  test('dos reservas simultáneas solapadas solo permiten una', async () => {
    const results = await Promise.allSettled([booking(), booking()]);
    expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
  });
  test('ampliar reserva no permite solapar otra', async () => {
    const first = await booking();
    await booking('2027-01-03', '2027-01-05');
    await expect(
      ReservationService.update(first.id, { check_out: '2027-01-04' }, actor()),
    ).rejects.toMatchObject({ statusCode: 409 });
  });
  test('dos pagos de 60 no pueden completarse contra una reserva de 100', async () => {
    const reservation = await booking();
    const data = { reservation_id: reservation.id, amount: 60, method: 'cash' };
    const first = await PaymentService.create(data, actor()),
      second = await PaymentService.create(data, actor());
    await PaymentService.changeStatus(first.id, 'completed', actor(), 'pending');
    await expect(
      PaymentService.changeStatus(second.id, 'completed', actor()),
    ).rejects.toMatchObject({ statusCode: 409 });
  });
  test('completar pagos simultáneamente vuelve a comprobar el saldo bajo bloqueo', async () => {
    const reservation = await booking();
    const data = { reservation_id: reservation.id, amount: 60, method: 'cash' };
    const first = await PaymentService.create(data, actor()),
      second = await PaymentService.create(data, actor());
    const results = await Promise.allSettled(
      [first, second].map((p) => PaymentService.changeStatus(p.id, 'completed', actor())),
    );
    expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
    expect(
      Number(
        (
          await database.query(
            "SELECT SUM(amount) AS total FROM payment WHERE status = 'completed'",
          )
        ).rows[0].total,
      ),
    ).toBe(60);
  });
  test('no reduce el precio de una reserva por debajo de lo pagado', async () => {
    const reservation = await booking();
    const payment = await PaymentService.create(
      { reservation_id: reservation.id, amount: 80, method: 'cash' },
      actor(),
    );
    await PaymentService.changeStatus(payment.id, 'completed', actor());
    await expect(
      ReservationService.update(reservation.id, { total_price: 50 }, actor()),
    ).rejects.toMatchObject({ statusCode: 409 });
  });
  test('reportes incluyen último día y excluyen pagos no completados', async () => {
    const reservation = await booking();
    await database.query(
      `INSERT INTO payment (reservation_id, amount, type, method, status, created_at)
      VALUES ($1, 40, 'partial', 'cash', 'completed', '2026-10-08 23:59:59'),
        ($1, 60, 'partial', 'cash', 'pending', '2026-10-08 12:00:00')`,
      [reservation.id],
    );
    const Payment = require('../src/models/Payment');
    const report = await Payment.getRevenueByPeriod('2026-10-08', '2026-10-08');
    expect(Number(report[0].total_amount)).toBe(40);
    expect(
      Number((await Payment.getRevenueByMethod('2026-10-08', '2026-10-08'))[0].total_amount),
    ).toBe(40);
  });
  test('update parcial de usuario conserva campos y protege último admin', async () => {
    const updated = await UserService.update(fixture.admin.id, { name: 'Nuevo admin' }, actor());
    expect(updated.email).toBe('admin@example.com');
    expect(updated.is_active).toBe(true);
    await expect(
      UserService.update(fixture.admin.id, { role: 'manager' }, actor()),
    ).rejects.toMatchObject({ statusCode: 409 });
    await expect(
      UserService.update(fixture.admin.id, { is_active: false }, actor()),
    ).rejects.toMatchObject({ statusCode: 409 });
  });
  test('desactivación concurrente conserva al menos un administrador', async () => {
    const second = await require('../src/models/User').create({
      name: 'Admin2',
      email: 'admin2@example.com',
      password: 'Review123!',
      role: 'admin',
    });
    const results = await Promise.allSettled(
      [fixture.admin, second].map((u) => UserService.update(u.id, { is_active: false }, actor())),
    );
    expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
    expect(await require('../src/models/User').countActiveAdmins()).toBe(1);
  });
  test('impide estados manuales que contradicen estancia activa', async () => {
    const reservation = await booking();
    await ReservationService.checkIn(reservation.id, null, actor());
    await expect(
      RoomService.update(fixture.room.id, { status: 'maintenance' }, actor()),
    ).rejects.toMatchObject({ statusCode: 409 });
    await ReservationService.checkOut(reservation.id, actor());
    expect((await require('../src/models/Room').findById(fixture.room.id)).status).toBe(
      'maintenance',
    );
    await RoomService.update(fixture.room.id, { status: 'available' }, actor());
  });
  test('auditoría acompaña operaciones y rollback no agrega registros', async () => {
    const reservation = await booking();
    const before = (await database.query('SELECT * FROM audit_log')).rowCount;
    await expect(
      ReservationService.update(reservation.id, { status: 'checked_in' }, actor()),
    ).rejects.toThrow();
    const logs = await database.query('SELECT * FROM audit_log');
    expect(logs.rowCount).toBe(before);
    expect(logs.rows[0].new_value.id).toBe(reservation.id);
  });
  test('API rechaza registro público, JSON incorrecto e IDs inválidos', async () => {
    const unauthorized = await request('/users/register', 'POST', {
      name: 'Extra',
      email: 'extra@example.com',
      password: 'Review123!',
    });
    expect(unauthorized.status).toBe(401);
    expect(unauthorized.body.requestId).toBe(unauthorized.headers.get('X-Request-ID'));
    expect((await request('/users/login', 'POST', '{')).status).toBe(400);
    const login = await request('/users/login', 'POST', {
      email: 'admin@example.com',
      password: 'Review123!',
    });
    expect(login.status).toBe(200);
    const token = login.body.data.token;
    expect((await request('/clients/not-an-id', 'GET', undefined, token)).status).toBe(422);
    expect(
      (
        await request(
          '/rooms/available-for-dates?checkIn=2026-02-30&checkOut=2026-03-02',
          'GET',
          undefined,
          token,
        )
      ).status,
    ).toBe(422);
    expect((await request('/reservations/upcoming?days=abc', 'GET', undefined, token)).status).toBe(
      422,
    );
    const type = await request(
      `/room-types/${fixture.type.id}`,
      'PUT',
      { description: 'Nueva descripción' },
      token,
    );
    expect(type.status).toBe(200);
    expect(Number(type.body.data.price)).toBe(100);
    const user = await request(
      `/users/${fixture.admin.id}`,
      'PUT',
      { name: 'Nombre actualizado' },
      token,
    );
    expect(user.status).toBe(200);
    expect(user.body.data.email).toBe('admin@example.com');
    const registration = await request(
      '/users/register',
      'POST',
      {
        name: 'Recepción',
        email: 'new@example.com',
        password: 'Review123!',
      },
      token,
    );
    expect(registration.status).toBe(201);
    expect(registration.body.data.user.role).toBe('receptionist');
    const duplicate = await request(
      '/users/register',
      'POST',
      {
        name: 'Duplicado',
        email: 'new@example.com',
        password: 'Review123!',
      },
      token,
    );
    expect(duplicate.status).toBe(409);
    const client = await request(`/clients/${fixture.client.id}`, 'PUT', { email: '' }, token);
    expect(client.status).toBe(200);
    expect(client.body.data.email).toBeNull();
  });
});
