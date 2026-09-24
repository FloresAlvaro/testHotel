const { createToken, verifyToken } = require('../src/utils/jwt');
const { hashPassword, comparePassword } = require('../src/utils/password');

describe('Autenticacion', () => {
  test('crea y verifica un token JWT', () => {
    const token = createToken({ id: 10, role: 'receptionist' });
    const payload = verifyToken(token);

    expect(payload.id).toBe(10);
    expect(payload.role).toBe('receptionist');
  });

  test('rechaza un token alterado', () => {
    const token = createToken({ id: 10 });
    const alteredToken = `${token}alterado`;

    expect(() => verifyToken(alteredToken)).toThrow();
  });

  test('compara contrasenas correctamente', async () => {
    const password = 'password123';
    const hash = await hashPassword(password);

    await expect(comparePassword(password, hash)).resolves.toBe(true);
    await expect(comparePassword('incorrecta', hash)).resolves.toBe(false);
  });
});
