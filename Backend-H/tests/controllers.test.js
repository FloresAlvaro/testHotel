jest.mock('../src/models/Room', () => ({
  findById: jest.fn(),
  updateStatus: jest.fn(),
  findAll: jest.fn(),
  countAll: jest.fn()
}));

jest.mock('../src/models/RoomType', () => ({}));

jest.mock('../src/models/Client', () => ({
  findByDocument: jest.fn(),
  create: jest.fn(),
  findById: jest.fn(),
  update: jest.fn()
}));

jest.mock('../src/models/Reservation', () => ({
  findById: jest.fn()
}));
jest.mock('../src/models/Payment', () => ({
  create: jest.fn(),
  findByReservationId: jest.fn(),
  findById: jest.fn(),
  update: jest.fn()
}));

const Room = require('../src/models/Room');
const Client = require('../src/models/Client');
const Payment = require('../src/models/Payment');
const Reservation = require('../src/models/Reservation');
const RoomController = require('../src/controllers/roomController');
const ClientController = require('../src/controllers/clientController');
const PaymentController = require('../src/controllers/paymentController');

const responseMock = () => ({
  status: jest.fn().mockReturnThis(),
  json: jest.fn()
});

describe('RoomController.updateStatus', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('rechaza un estado que no existe sin consultar el modelo', async () => {
    const req = { params: { id: '12' }, body: { status: 'cleaning' } };
    const res = responseMock();
    const next = jest.fn();

    await RoomController.updateStatus(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: false,
      message: 'Estado de habitación inválido'
    }));
    expect(Room.findById).not.toHaveBeenCalled();
    expect(Room.updateStatus).not.toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  test('rechaza una transición no permitida', async () => {
    Room.findById.mockResolvedValue({ id: 12, status: 'occupied' });
    const req = { params: { id: '12' }, body: { status: 'available' } };
    const res = responseMock();
    const next = jest.fn();

    await RoomController.updateStatus(req, res, next);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: false,
      message: 'Transición de estado de habitación no permitida'
    }));
    expect(Room.updateStatus).not.toHaveBeenCalled();
  });

  test('actualiza una transición permitida', async () => {
    const updatedRoom = { id: 12, status: 'reserved' };
    Room.findById.mockResolvedValue({ id: 12, status: 'available' });
    Room.updateStatus.mockResolvedValue(updatedRoom);
    const req = { params: { id: '12' }, body: { status: 'reserved' } };
    const res = responseMock();
    const next = jest.fn();

    await RoomController.updateStatus(req, res, next);

    expect(Room.updateStatus).toHaveBeenCalledWith('12', 'reserved');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      message: 'Estado actualizado a reserved',
      data: updatedRoom
    }));
    expect(next).not.toHaveBeenCalled();
  });
});

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
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: false,
      message: 'Nombre y documento son requeridos'
    }));
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
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: false,
      message: 'El documento ya está registrado'
    }));
    expect(Client.create).not.toHaveBeenCalled();
  });

  test('crea un cliente cuando el documento esta disponible', async () => {
    const client = { id: 8, name: 'Ana', document: '12345' };
    Client.findByDocument.mockResolvedValue(null);
    Client.create.mockResolvedValue(client);
    const req = { body: { name: 'Ana', document: '12345', email: 'ana@example.com', notes: 'VIP' } };
    const res = responseMock();
    const next = jest.fn();

    await ClientController.create(req, res, next);

    expect(Client.findByDocument).toHaveBeenCalledWith('12345');
    expect(Client.create).toHaveBeenCalledWith(expect.objectContaining({
      name: 'Ana',
      document: '12345',
      email: 'ana@example.com',
      notes: 'VIP'
    }));
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      data: client
    }));
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
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      pagination: expect.objectContaining({ page: 2, pageSize: 5, total: 1 })
    }));
  });
});

describe('PaymentController.create', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('responde como pago creado y no como pago completado', async () => {
    const reservation = { id: 4, total_price: '100.00' };
    const payment = { id: 7, reservation_id: 4, amount: '40.00', status: 'pending' };
    Reservation.findById.mockResolvedValue(reservation);
    Payment.findByReservationId.mockResolvedValue([]);
    Payment.create.mockResolvedValue(payment);
    const req = { body: { reservation_id: 4, amount: 40, method: 'cash' } };
    const res = responseMock();

    await PaymentController.create(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      message: 'Pago registrado exitosamente',
      data: payment
    }));
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

    expect(Client.update).toHaveBeenCalledWith('3', expect.objectContaining({
      name: 'Ana',
      nationality: 'Boliviana',
      notes: 'VIP'
    }));
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ data: updatedClient }));
  });
});

describe('PaymentController.update', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('permite actualizar solo pagos pendientes', async () => {
    Reservation.findById.mockResolvedValue({ total_price: '100.00' });
    Payment.findById.mockResolvedValue({
      id: 7,
      amount: '40.00',
      type: 'full',
      method: 'cash',
      status: 'pending',
      transaction_id: null
    });
    const updatedPayment = { id: 7, amount: '45.00', status: 'pending' };
    Payment.update.mockResolvedValue(updatedPayment);
    const req = { params: { id: '7' }, body: { amount: 45 } };
    const res = responseMock();

    await PaymentController.update(req, res, jest.fn());

    expect(Payment.update).toHaveBeenCalledWith('7', expect.objectContaining({
      amount: 45,
      status: 'pending'
    }));
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ data: updatedPayment }));
  });

  test('rechaza un monto actualizado que supera el saldo de la reserva', async () => {
    Reservation.findById.mockResolvedValue({ total_price: '100.00' });
    Payment.findById.mockResolvedValue({
      id: 7,
      reservation_id: 4,
      amount: '40.00',
      type: 'full',
      method: 'cash',
      status: 'pending',
      transaction_id: null
    });
    Payment.findByReservationId.mockResolvedValue([
      { amount: '70.00', status: 'completed' },
      { amount: '40.00', status: 'pending' }
    ]);
    const req = { params: { id: '7' }, body: { amount: 40 } };
    const res = responseMock();

    await PaymentController.update(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      message: 'Monto insuficiente'
    }));
    expect(Payment.update).not.toHaveBeenCalled();
  });
});