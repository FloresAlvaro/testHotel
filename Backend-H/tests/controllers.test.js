jest.mock('../src/models/Room', () => ({
  findById: jest.fn(),
  updateStatus: jest.fn()
}));

jest.mock('../src/models/RoomType', () => ({}));

jest.mock('../src/models/Client', () => ({
  findByDocument: jest.fn(),
  create: jest.fn()
}));

jest.mock('../src/models/Reservation', () => ({}));

const Room = require('../src/models/Room');
const Client = require('../src/models/Client');
const RoomController = require('../src/controllers/roomController');
const ClientController = require('../src/controllers/clientController');

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
    const req = { body: { name: 'Ana', document: '12345', email: 'ana@example.com' } };
    const res = responseMock();
    const next = jest.fn();

    await ClientController.create(req, res, next);

    expect(Client.findByDocument).toHaveBeenCalledWith('12345');
    expect(Client.create).toHaveBeenCalledWith(expect.objectContaining({
      name: 'Ana',
      document: '12345',
      email: 'ana@example.com'
    }));
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      data: client
    }));
    expect(next).not.toHaveBeenCalled();
  });
});