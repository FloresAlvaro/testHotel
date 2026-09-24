const authorize = require('../src/middleware/authorization');

const responseMock = () => ({
  status: jest.fn().mockReturnThis(),
  json: jest.fn()
});

describe('Autorizacion por roles', () => {
  test('rechaza una solicitud sin usuario', () => {
    const req = {};
    const res = responseMock();
    const next = jest.fn();

    authorize('admin')(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  test('rechaza un rol no permitido', () => {
    const req = { user: { role: 'receptionist' } };
    const res = responseMock();
    const next = jest.fn();

    authorize('admin', 'manager')(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  test('permite un rol autorizado', () => {
    const req = { user: { role: 'manager' } };
    const res = responseMock();
    const next = jest.fn();

    authorize('admin', 'manager')(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });
});
