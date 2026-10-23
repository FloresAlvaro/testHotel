jest.mock('../src/config/database', () => ({ transaction: jest.fn() }));
jest.mock('../src/models/User', () => ({ findById: jest.fn() }));

const db = require('../src/config/database');
const User = require('../src/models/User');
const account = require('../src/services/customerAccountService');
const auth = require('../src/middleware/auth');
const { createToken } = require('../src/utils/jwt');
const { hashPassword, comparePassword } = require('../src/utils/password');
const passwordSchema = require('../src/validators/passwordValidator');
const { registerSchema, changePasswordSchema } = require('../src/validators/userValidator');
const contracts = require('../src/utils/contractValidator');

describe('Límite de contraseñas en bytes UTF-8', () => {
  test.each(['a'.repeat(73), 'á'.repeat(37), '🔐'.repeat(19)])('rechaza entradas que bcrypt truncaría (%s)', async password => {
    expect(passwordSchema.validate(password).error).toBeDefined();
    expect(registerSchema.validate({ name: 'Test User', email: 'test@example.com', password }).error).toBeDefined();
    expect(changePasswordSchema.validate({ currentPassword: 'Valid123!', newPassword: password, confirmPassword: password }).error).toBeDefined();
    expect(contracts.byName('SessionLoginInput').validate({ email: 'test@example.com', password }).error).toBeDefined();
    expect(contracts.byName('AcceptInvitationInput').validate({ token: 'a'.repeat(64), password: `Aa1${password}` }).error).toBeDefined();
    await expect(hashPassword(password)).rejects.toMatchObject({ statusCode: 422 });
  });

  test('admite exactamente 72 bytes y no acepta otro sufijo por truncamiento', async () => {
    const password = 'á'.repeat(36);
    expect(passwordSchema.validate(password).error).toBeUndefined();
    const hash = await hashPassword(password);
    await expect(comparePassword(password, hash)).resolves.toBe(true);
    await expect(comparePassword(`${password}extra`, hash)).resolves.toBe(false);
  });
});

describe('Revocación del acceso de huéspedes', () => {
  test('incrementa la versión y elimina sesiones dentro de la misma transacción', async () => {
    const connection = { query: jest.fn()
      .mockResolvedValueOnce({ rowCount: 1, rows: [{ id: 7, is_active: false }] })
      .mockResolvedValueOnce({ rowCount: 1 }) };
    db.transaction.mockImplementation(callback => callback(connection));
    await expect(account.changeAccess(12, false)).resolves.toMatchObject({ id: 7 });
    expect(connection.query.mock.calls[0][0]).toMatch(/auth_version=auth_version\+1/);
    expect(connection.query.mock.calls[0][1]).toEqual([false, 12]);
    expect(connection.query).toHaveBeenLastCalledWith('DELETE FROM web_session WHERE user_id=$1', [7]);
  });

  test('un JWT anterior no recupera acceso tras reactivar; uno nuevo sí', async () => {
    const oldToken = createToken({ id: 7, version: 0 });
    User.findById.mockResolvedValue({ id: 7, role: 'customer', client_id: 12, client_active: true, is_active: true, auth_version: 2 });
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();
    await auth({ headers: { authorization: `Bearer ${oldToken}` }, method: 'GET' }, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
    const newToken = createToken({ id: 7, version: 2 });
    await auth({ headers: { authorization: `Bearer ${newToken}` }, method: 'GET' }, res, next);
    expect(next).toHaveBeenCalledTimes(1);
  });

  test('no borra sesiones si la cuenta no existe', async () => {
    const connection = { query: jest.fn().mockResolvedValue({ rowCount: 0 }) };
    db.transaction.mockImplementation(callback => callback(connection));
    await expect(account.changeAccess(999, false)).rejects.toMatchObject({ statusCode: 404 });
    expect(connection.query).toHaveBeenCalledTimes(1);
  });
});
