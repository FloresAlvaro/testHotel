jest.mock('../src/models/RoomType', () => ({}));
jest.mock('../src/config/database', () => ({ transaction: (fn) => fn({}) }));
jest.mock('../src/models/Payment', () => ({}));
jest.mock('../src/models/Room', () => ({ findAll: jest.fn(), countAll: jest.fn() }));
jest.mock('../src/models/Client', () => ({
  findByDocument: jest.fn(),
  create: jest.fn(),
  findById: jest.fn(),
  update: jest.fn(),
}));
jest.mock('../src/services/roomService', () => ({ update: jest.fn() }));
jest.mock('../src/services/paymentService', () => ({
  create: jest.fn(),
  update: jest.fn(),
  changeStatus: jest.fn(),
}));
const Room = require('../src/models/Room');
const Client = require('../src/models/Client');
const RoomController = require('../src/controllers/roomController');
const ClientController = require('../src/controllers/clientController');
const PaymentController = require('../src/controllers/paymentController');
const PaymentService = require('../src/services/paymentService');
const RoomService = require('../src/services/roomService');
const responseMock = () => ({ status: jest.fn().mockReturnThis(), json: jest.fn() });
describe('ClientController.create', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('requiere nombre y documento', async () => {
    const req = { body: { name: 'Ana' } };
    const res = responseMock();
    const next = jest.fn();

    await ClientController.create(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: 'Nombre y documento son requeridos',
      }),
    );
    expect(Client.findByDocument).not.toHaveBeenCalled();
    expect(Client.create).not.toHaveBeenCalled();
  });

  test('rechaza un documento ya registrado', async () => {
    Client.findByDocument.mockResolvedValue({ id: 3, document: '12345' });
    const req = { body: { name: 'Ana', document: '12345' } };
    const res = responseMock();
    const next = jest.fn();

    await ClientController.create(req, res, next);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: 'El documento ya está registrado',
      }),
    );
    expect(Client.create).not.toHaveBeenCalled();
  });

  test('crea un cliente cuando el documento esta disponible', async () => {
    const client = { id: 8, name: 'Ana', document: '12345' };
    Client.findByDocument.mockResolvedValue(null);
    Client.create.mockResolvedValue(client);
    const req = {
      body: { name: 'Ana', document: '12345', email: 'ana@example.com', notes: 'VIP' },
    };
    const res = responseMock();
    const next = jest.fn();

    await ClientController.create(req, res, next);

    expect(Client.findByDocument).toHaveBeenCalledWith('12345');
    expect(Client.create).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Ana',
        document: '12345',
        email: 'ana@example.com',
        notes: 'VIP',
      }),
    );
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: client,
      }),
    );
    expect(next).not.toHaveBeenCalled();
  });
});

describe('RoomController.getAll', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('aplica el filtro de estado también al total paginado', async () => {
    Room.findAll.mockResolvedValue([{ id: 1, status: 'maintenance' }]);
    Room.countAll.mockResolvedValue(1);
    const req = { query: { page: '2', pageSize: '5', status: 'maintenance' } };
    const res = responseMock();

    await RoomController.getAll(req, res, jest.fn());

    expect(Room.findAll).toHaveBeenCalledWith(5, 5, 'maintenance');
    expect(Room.countAll).toHaveBeenCalledWith('maintenance');
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        pagination: expect.objectContaining({ page: 2, pageSize: 5, total: 1 }),
      }),
    );
  });
});

describe('ClientController.update', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('conserva los datos existentes y guarda los campos opcionales editables', async () => {
    const existingClient = { id: 3, name: 'Ana', nationality: null, notes: null };
    const updatedClient = { ...existingClient, nationality: 'Boliviana', notes: 'VIP' };
    Client.findById.mockResolvedValue(existingClient);
    Client.update.mockResolvedValue(updatedClient);
    const req = { params: { id: '3' }, body: { nationality: 'Boliviana', notes: 'VIP' } };
    const res = responseMock();

    await ClientController.update(req, res, jest.fn());

    expect(Client.update).toHaveBeenCalledWith(
      '3',
      expect.objectContaining({
        name: 'Ana',
        nationality: 'Boliviana',
        notes: 'VIP',
      }),
      expect.any(Object),
    );
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ data: updatedClient }));
  });
});

describe('Controladores delegan las operaciones transaccionales', () => {
  beforeEach(() => jest.clearAllMocks());
  test('crear pago responde como pendiente con 201', async () => {
    const payment = { id: 7, status: 'pending', amount: 40 };
    PaymentService.create.mockResolvedValue(payment);
    const res = responseMock();
    await PaymentController.create(
      { body: { amount: 40 }, user: { id: 1 }, ip: '127.0.0.1' },
      res,
      jest.fn(),
    );
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ data: payment, message: 'Pago registrado exitosamente' }),
    );
  });
  test('propaga un conflicto del servicio al manejador de errores', async () => {
    const error = Object.assign(new Error('El pago supera el saldo'), { statusCode: 409 });
    PaymentService.update.mockRejectedValue(error);
    const next = jest.fn();
    await PaymentController.update(
      { params: { id: 7 }, body: { amount: 120 }, user: { id: 1 } },
      responseMock(),
      next,
    );
    expect(next).toHaveBeenCalledWith(error);
  });
  test('el cambio de habitación usa la misma lógica que su actualización', async () => {
    RoomService.update.mockResolvedValue({ id: 12, status: 'maintenance' });
    const res = responseMock();
    await RoomController.updateStatus(
      { params: { id: '12' }, body: { status: 'maintenance' }, user: { id: 1 } },
      res,
      jest.fn(),
    );
    expect(RoomService.update).toHaveBeenCalledWith('12', { status: 'maintenance' }, { id: 1 });
    expect(res.status).toHaveBeenCalledWith(200);
  });
});
