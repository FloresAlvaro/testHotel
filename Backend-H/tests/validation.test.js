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
  test('rechaza fechas inexistentes y mantiene días como texto', () => {
    const { date } = require('../src/validators/common');
    expect(date.validate('2026-02-30').error).toBeDefined();
    expect(date.validate('2026-10-08').value).toBe('2026-10-08');
  });
  test('permite editar notas sin reenviar las fechas', () => {
    const { updateSchema } = require('../src/validators/reservationValidator');
    expect(updateSchema.validate({ notes: null }).error).toBeUndefined();
  });
  test('normaliza correo vacío para poder borrarlo y usa documento predeterminado', () => {
    const { createSchema, updateSchema } = require('../src/validators/clientValidator');
    expect(createSchema.validate({ name: 'Ana', document: '123456' }).value.document_type).toBe('cedula');
    expect(updateSchema.validate({ email: '' }).value.email).toBeNull();
  });
  test('rechaza capacidad fraccionaria, NaN y piso negativo', () => {
    const types = require('../src/validators/roomTypeValidator');
    const rooms = require('../src/validators/roomValidator');
    expect(types.createSchema.validate({ name: 'Simple', price: 100, capacity: 1.5 }).error).toBeDefined();
    expect(types.updateSchema.validate({ price: 'abc' }).error).toBeDefined();
    expect(rooms.updateSchema.validate({ floor: -1 }).error).toBeDefined();
  });
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
