jest.mock('../src/config/database', () => ({ transaction: (work) => work({ query: jest.fn() }) }));
jest.mock('../src/models/Payment', () => ({
  getRevenueByPeriod: jest.fn(),
  getRevenueByMethod: jest.fn()
}));
jest.mock('../src/models/Reservation', () => ({}));
const Payment = require('../src/models/Payment');
const Controller = require('../src/controllers/paymentController');
const errorHandler = require('../src/middleware/errorHandler');
const response = () => ({ status: jest.fn().mockReturnThis(), json: jest.fn() });

beforeEach(() => jest.clearAllMocks());

describe.each(['getRevenueByPeriod', 'getRevenueByMethod'])('%s', (method) => {
  test.each([
    ['2026-02-30', '2026-03-01'],
    ['2026-10-17', '2026-10-01'],
    [['2026-10-01'], '2026-10-17'],
    ['invalid', '2026-10-17']
  ])('rechaza fechas inválidas o invertidas: %s, %s', async (startDate, endDate) => {
    const res = response();
    await Controller[method]({ query: { startDate, endDate } }, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(400);
    expect(Payment[method]).not.toHaveBeenCalled();
  });
  test('acepta un informe de un solo día', async () => {
    Payment[method].mockResolvedValue([]);
    const res = response();
    await Controller[method]({ query: { startDate: '2026-10-17', endDate: '2026-10-17' } }, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(200);
    expect(Payment[method]).toHaveBeenCalledWith('2026-10-17', '2026-10-17', null);
  });
});

describe('errores HTTP', () => {
  let log;
  beforeEach(() => { log = jest.spyOn(console, 'error').mockImplementation(() => {}); });
  afterEach(() => log.mockRestore());
  test('oculta detalles de infraestructura fuera de desarrollo', () => {
    const res = response();
    errorHandler(new Error('SQL password=secret'), {}, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Error interno del servidor' });
  });
  test('conserva el estado de errores del parser de Express', () => {
    const res = response();
    errorHandler(Object.assign(new Error('JSON inválido'), { status: 400 }), {}, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(400);
  });
});
