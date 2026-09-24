const validate = require('../src/middleware/validation');
const { createSchema: reservationSchema } = require('../src/validators/reservationValidator');
const { createSchema: paymentSchema } = require('../src/validators/paymentValidator');

const responseMock = () => ({
  status(code) {
    this.statusCode = code;
    return this;
  },
  json(body) {
    this.body = body;
  }
});

describe('Validacion Joi', () => {
  test('acepta una reserva valida y convierte sus IDs a numero', () => {
    const req = {
      body: {
        check_in: '2026-10-01',
        check_out: '2026-10-03',
        client_id: '4',
        room_id: '8'
      }
    };
    const res = responseMock();
    const next = jest.fn();

    validate(reservationSchema)(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(req.body.client_id).toBe(4);
    expect(req.body.room_id).toBe(8);
  });

  test('rechaza una salida anterior a la entrada', () => {
    const req = {
      body: {
        check_in: '2026-10-03',
        check_out: '2026-10-01',
        client_id: 4,
        room_id: 8
      }
    };
    const res = responseMock();
    const next = jest.fn();

    validate(reservationSchema)(req, res, next);

    expect(res.statusCode).toBe(422);
    expect(res.body.success).toBe(false);
    expect(next).not.toHaveBeenCalled();
  });

  test('rechaza un metodo de pago no permitido', () => {
    const result = paymentSchema.validate({
      reservation_id: 1,
      amount: 100,
      method: 'bitcoin'
    });

    expect(result.error).toBeDefined();
  });
});
