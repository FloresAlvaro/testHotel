const errorHandler = require('../src/middleware/errorHandler');
const response = () => ({ status: jest.fn().mockReturnThis(), json: jest.fn() });
test('respeta errores HTTP que usan status', () => {
  const res = response();
  errorHandler(Object.assign(new Error('JSON inválido'), { status: 400 }), {}, res, jest.fn());
  expect(res.status).toHaveBeenCalledWith(400);
});
test('traduce conflictos PostgreSQL sin exponer la consulta', () => {
  const res = response();
  errorHandler(
    Object.assign(new Error('SQL y valores internos'), { code: '23505' }),
    {},
    res,
    jest.fn(),
  );
  expect(res.status).toHaveBeenCalledWith(409);
  expect(res.json).toHaveBeenCalledWith({ success: false, message: 'El registro ya existe' });
});
test('oculta detalles de fallos internos', () => {
  const log = jest.spyOn(console, 'error').mockImplementation(() => {});
  try {
    const res = response();
    errorHandler(new Error('password y detalles privados'), {}, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Error interno del servidor',
    });
  } finally {
    log.mockRestore();
  }
});
