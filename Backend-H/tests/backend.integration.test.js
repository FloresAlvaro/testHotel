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
        Origin: 'http://localhost:3001',
        ...(token ? { Cookie: token } : {}),
      },
      ...(body !== undefined
        ? { body: typeof body === 'string' ? body : JSON.stringify(body) }
        : {}),
    });
    return { status: response.status, headers: response.headers, body: await response.json() };
  };
  test('HTTP: invitación solo administrativa, activación, validación y recuperación', async () => {
    const mail = require('../src/services/mailService');
    const configured = jest.spyOn(mail, 'configured').mockReturnValue(true);
    const send = jest.spyOn(mail, 'sendLink').mockResolvedValue(true);
    try {
      const login = await request('/users/login', 'POST', {
        email: 'admin@example.com',
        password: 'Review123!',
      });
      const adminCookie = login.headers.get('set-cookie').split(';')[0];
      const invitation = await request(
        '/account/invitations',
        'POST',
        { name: 'Employee', email: 'http@example.com' },
        adminCookie,
      );
      expect(invitation.status).toBe(201);
      const actionToken = new URLSearchParams(
        new URL(invitation.body.data.invitationUrl).hash.slice(1),
      ).get('token');
      expect(
        (
          await request('/account/accept-invitation', 'POST', {
            token: actionToken,
            password: 'Chosen123!',
            confirmPassword: 'Mismatch123!',
          })
        ).status,
      ).toBe(422);
      expect(
        (
          await request('/account/accept-invitation', 'POST', {
            token: actionToken,
            password: 'Chosen123!',
            confirmPassword: 'Chosen123!',
          })
        ).status,
      ).toBe(200);
      const employeeLogin = await request('/users/login', 'POST', {
        email: 'http@example.com',
        password: 'Chosen123!',
      });
      const employeeCookie = employeeLogin.headers.get('set-cookie').split(';')[0];
      expect(
        (
          await request(
            '/account/invitations',
            'POST',
            { name: 'Forbidden', email: 'forbidden@example.com' },
            employeeCookie,
          )
        ).status,
      ).toBe(403);
      const known = await request('/account/forgot-password', 'POST', {
        email: 'http@example.com',
      });
      const unknown = await request('/account/forgot-password', 'POST', {
        email: 'unknown@example.com',
      });
      expect(known.status).toBe(200);
      expect(unknown.body.message).toBe(known.body.message);
      const link = send.mock.calls.find((call) => call[2] === 'reset')[1];
      const token = new URLSearchParams(new URL(link).hash.slice(1)).get('token');
      expect(
        (
          await request('/account/reset-password', 'POST', {
            token,
            password: 'Changed123!',
            confirmPassword: 'Changed123!',
          })
        ).status,
      ).toBe(200);
      expect((await request('/users/profile', 'GET', undefined, employeeCookie)).status).toBe(401);
      const denied = await fetch(`http://127.0.0.1:${server.address().port}/api/account/logout`, {
        method: 'POST',
        headers: { Cookie: adminCookie },
      });
      expect(denied.status).toBe(403);
      expect(await denied.json()).toMatchObject({ success: false, requestId: expect.any(String) });
      const missing = await request('/missing');
      expect(missing.body).toMatchObject({ success: false, requestId: expect.any(String) });
    } finally {
      configured.mockRestore();
      send.mockRestore();
    }
  });
  test('limpieza elimina caducados antiguos y conserva sesiones activas', async () => {
    const service = require('../src/services/authService');
    const jwt = require('../src/utils/jwt');
    const old = await service.login('admin@example.com', 'Review123!', actor());
    const active = await service.login('admin@example.com', 'Review123!', actor());
    await database.query(
      "UPDATE auth_session SET expires_at = CURRENT_TIMESTAMP - INTERVAL '31 days' WHERE id = $1",
      [jwt.verifyToken(old.token).sid],
    );
    await database.query(
      "INSERT INTO auth_action_token(token_hash,user_id,purpose,expires_at) VALUES ($1,$2,'reset',CURRENT_TIMESTAMP - INTERVAL '1 minute')",
      ['f'.repeat(64), fixture.admin.id],
    );
    expect(await require('../src/services/authMaintenanceService').cleanup()).toMatchObject({
      tokens: 1,
      sessions: 1,
    });
    expect(
      await require('../src/services/sessionService').valid(
        jwt.verifyToken(active.token).sid,
        fixture.admin.id,
      ),
    ).toBe(true);
  });
  test('actualizaciones simultáneas conservan campos independientes', async () => {
    const clients = require('../src/services/clientService');
    const types = require('../src/services/roomTypeService');
    await Promise.all([
      clients.update(fixture.client.id, { nationality: 'Boliviana' }),
      clients.update(fixture.client.id, { notes: 'Concurrent' }),
    ]);
    expect(await Client.findById(fixture.client.id)).toMatchObject({
      nationality: 'Boliviana',
      notes: 'Concurrent',
    });
    await Promise.all([
      types.update(fixture.type.id, { capacity: 3 }),
      types.update(fixture.type.id, { description: 'Concurrent' }),
    ]);
    expect(await require('../src/models/RoomType').findById(fixture.type.id)).toMatchObject({
      capacity: 3,
      description: 'Concurrent',
    });
  });
  test('migraciones crean base vacía y son repetibles', async () => {
    const { spawnSync } = require('node:child_process');
    await database.query('CREATE SCHEMA backend_review_fresh');
    try {
      const url = new URL(integrationURL);
      url.searchParams.set('options', '-c search_path=backend_review_fresh,public');
      for (let i = 0; i < 2; i++) {
        const child = spawnSync(
          process.execPath,
          [path.resolve(__dirname, '../scripts/migrate.cjs')],
          {
            env: { ...process.env, DATABASE_URL: url.toString() },
            encoding: 'utf8',
            timeout: 20000,
          },
        );
        expect({ status: child.status, error: child.stderr }).toEqual({ status: 0, error: '' });
      }
      expect(
        (
          await database.query(
            'SELECT count(*)::int AS count FROM backend_review_fresh.schema_migration',
          )
        ).rows[0].count,
      ).toBe(4);
    } finally {
      await database.query('DROP SCHEMA backend_review_fresh CASCADE');
    }
  }, 45000);
  test('migraciones reparan restricciones de instalaciones anteriores sin perder usuarios', async () => {
    expect(
      (
        await database.query(
          "SELECT count(*)::int AS count FROM pg_constraint WHERE conrelid = 'reservation'::regclass AND conname = 'reservation_no_room_overlap'",
        )
      ).rows[0].count,
    ).toBe(1);
    expect(await require('../src/models/User').findById(fixture.admin.id)).not.toBeNull();
    expect(
      (await database.query("SELECT to_regclass('idx_user_email') AS redundant")).rows[0].redundant,
    ).toBeNull();
  });
  test('invitación: activación única y contraseña elegida por el empleado', async () => {
    const service = require('../src/services/authService');
    const invited = await service.invite(
      { name: 'Nuevo empleado', email: 'invite@example.com', role: 'receptionist' },
      actor(),
    );
    expect(invited.user.is_active).toBe(false);
    const token = new URLSearchParams(new URL(invited.invitationUrl).hash.slice(1)).get('token');
    await expect(service.login('invite@example.com', 'Invalid123!', actor())).rejects.toMatchObject(
      { statusCode: 401 },
    );
    await service.consume(token, 'Chosen123!', 'invite');
    await expect(service.consume(token, 'Chosen123!', 'invite')).rejects.toMatchObject({
      statusCode: 400,
    });
    const login = await service.login('INVITE@example.com', 'Chosen123!', actor());
    expect(login.user.is_active).toBe(true);
    expect(login.user.password).toBeUndefined();
  });
  test('recuperación: token hash, caducidad, uso único y revocación de sesiones', async () => {
    const service = require('../src/services/authService');
    const sessions = require('../src/services/sessionService');
    const jwt = require('../src/utils/jwt');
    const mail = require('../src/services/mailService');
    const configured = jest.spyOn(mail, 'configured').mockReturnValue(true);
    const send = jest.spyOn(mail, 'sendLink').mockResolvedValue(true);
    try {
      const login = await service.login('admin@example.com', 'Review123!', actor());
      const sid = jwt.verifyToken(login.token).sid;
      await service.requestReset('unknown@example.com');
      expect(send).not.toHaveBeenCalled();
      await service.requestReset('admin@example.com');
      const token = new URLSearchParams(new URL(send.mock.calls[0][1]).hash.slice(1)).get('token');
      const stored = await database.query('SELECT token_hash FROM auth_action_token');
      expect(stored.rows[0].token_hash).not.toBe(token);
      await service.consume(token, 'Changed123!', 'reset');
      expect(await sessions.valid(sid, fixture.admin.id)).toBe(false);
      await expect(service.consume(token, 'Changed123!', 'reset')).rejects.toMatchObject({
        statusCode: 400,
      });
      await service.login('admin@example.com', 'Changed123!', actor());
      await service.requestReset('admin@example.com');
      const expired = new URLSearchParams(new URL(send.mock.calls[1][1]).hash.slice(1)).get(
        'token',
      );
      await database.query(
        "UPDATE auth_action_token SET expires_at = CURRENT_TIMESTAMP - INTERVAL '1 minute'",
      );
      await expect(service.consume(expired, 'Changed123!', 'reset')).rejects.toMatchObject({
        statusCode: 400,
      });
    } finally {
      configured.mockRestore();
      send.mockRestore();
    }
  });
  test('sesiones: cookie HttpOnly, cierre remoto y aislamiento entre usuarios', async () => {
    const login = await request('/users/login', 'POST', {
      email: 'admin@example.com',
      password: 'Review123!',
    });
    const cookie = login.headers.get('set-cookie');
    expect(cookie).toContain('HttpOnly');
    expect(login.body.data.token).toBeUndefined();
    const token = cookie.split(';')[0];
    const list = await request('/account/sessions', 'GET', undefined, token);
    expect(list.status).toBe(200);
    expect(list.body.data[0].current).toBe(true);
    const User = require('../src/models/User');
    const other = await User.create({
      name: 'Other',
      email: 'other@example.com',
      password: 'Review123!',
      role: 'receptionist',
    });
    const otherLogin = await require('../src/services/authService').login(
      other.email,
      'Review123!',
      actor(),
    );
    const otherSid = require('../src/utils/jwt').verifyToken(otherLogin.token).sid;
    expect(
      (await request(`/account/sessions/${otherSid}`, 'DELETE', undefined, token)).status,
    ).toBe(404);
    expect(await require('../src/services/sessionService').valid(otherSid, other.id)).toBe(true);
    expect((await request('/account/logout-all', 'POST', {}, token)).status).toBe(200);
    expect((await request('/users/profile', 'GET', undefined, token)).status).toBe(401);
  });
  test('migraciones idempotentes y cambio de contraseña invalida sesiones anteriores', async () => {
    await require('../src/config/migrate')();
    const service = require('../src/services/authService');
    const sessions = require('../src/services/sessionService');
    const login = await service.login('admin@example.com', 'Review123!', actor());
    await service.changePassword(fixture.admin.id, 'Review123!', 'Changed123!');
    expect(
      await sessions.valid(
        require('../src/utils/jwt').verifyToken(login.token).sid,
        fixture.admin.id,
      ),
    ).toBe(false);
    await service.login('admin@example.com', 'Changed123!', actor());
  });
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
      // Simula una instalación anterior a las restricciones de concurrencia.
      await setup.query('ALTER TABLE reservation DROP CONSTRAINT reservation_no_room_overlap');
      await setup.query('ALTER TABLE check_in_log DROP CONSTRAINT check_checkout_after_checkin');
      await setup.query('DROP INDEX idx_one_checkin_per_reservation');
    } finally {
      await setup.end();
    }
    url.searchParams.set('options', '-c search_path=backend_review_test,public');
    process.env.DATABASE_URL = url.toString();
    process.env.JWT_SECRET = 'isolated-integration-test-secret-at-least-32';
    process.env.NODE_ENV = 'test';
    process.env.ENABLE_HEALTH_CHECK = 'false';
    process.env.FRONTEND_URL = 'http://localhost:3001';
    process.env.CORS_ORIGIN = 'http://localhost:3001';
    database = require('../src/config/database');
    await database.testConnection();
    await require('../src/config/migrate')();
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
      'TRUNCATE auth_session, auth_action_token, audit_log, check_in_log, payment, reservation, room, room_type, client, "user" RESTART IDENTITY CASCADE',
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
    const token = login.headers.get('set-cookie').split(';')[0];
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
