const {
  addDays,
  calculateNights,
  calculateTotalPrice,
  createPaginatedResponse,
  getPaginationParams,
  getDaysDifference,
  getNestedValue,
  groupByField,
  isValidDocument,
  isValidEmail,
  isValidPhone,
  isValidURL,
  parseJSON,
  parseQueryString,
  searchInArray,
  sortByField,
  toJSON,
  toQueryString,
  truncate,
  validatePassword
} = require('../src/utils/helpers');

describe('Utilidades de validacion y formato', () => {
  test('valida emails, documentos, telefonos y URLs', () => {
    expect(isValidEmail('persona@example.com')).toBe(true);
    expect(isValidEmail('persona@')).toBe(false);
    expect(isValidDocument('12345')).toBe(true);
    expect(isValidDocument('1234')).toBe(false);
    expect(isValidPhone('+59170000000')).toBe(true);
    expect(isValidPhone('7000000')).toBe(false);
    expect(isValidURL('https://hotel.example')).toBe(true);
    expect(isValidURL('no-es-una-url')).toBe(false);
  });

  test('informa cada requisito incumplido de una contrasena', () => {
    expect(validatePassword('Hotel2026').valid).toBe(true);

    const result = validatePassword('corta');
    expect(result.valid).toBe(false);
    expect(result.errors).toHaveLength(3);
  });

  test('trunca solo cuando el texto supera el limite', () => {
    expect(truncate('Hotel', 5)).toBe('Hotel');
    expect(truncate('Hotel central', 5)).toBe('Hotel...');
  });
});

describe('Utilidades de fechas y paginacion', () => {
  test('calcula noches, precio y diferencias de fechas', () => {
    expect(calculateNights('2026-10-01', '2026-10-04')).toBe(3);
    expect(calculateTotalPrice(125.5, '2026-10-01', '2026-10-04')).toBe(376.5);
    expect(getDaysDifference('2026-10-04', '2026-10-01')).toBe(3);
  });

  test('agrega dias sin modificar la fecha de entrada', () => {
    const original = new Date('2026-10-30T12:00:00.000Z');
    const result = addDays(original, 3);

    expect(result.toISOString()).toBe('2026-11-02T12:00:00.000Z');
    expect(original.toISOString()).toBe('2026-10-30T12:00:00.000Z');
  });

  test('normaliza pagina, valores invalidos y tamano maximo', () => {
    expect(getPaginationParams('3', '25')).toEqual({
      offset: 50,
      limit: 25,
      page: 3,
      pageSize: 25
    });
    expect(getPaginationParams('invalida', 'invalido')).toEqual({
      offset: 0,
      limit: 15,
      page: 1,
      pageSize: 15
    });
    expect(getPaginationParams(2, 500).limit).toBe(100);
  });

  test('marca correctamente los limites de una respuesta paginada', () => {
    expect(createPaginatedResponse(['reserva'], 21, 2, 10)).toEqual({
      data: ['reserva'],
      pagination: {
        total: 21,
        page: 2,
        pageSize: 10,
        totalPages: 3,
        hasNextPage: true,
        hasPreviousPage: true
      }
    });
    expect(createPaginatedResponse([], 0, 1, 10).pagination.hasNextPage).toBe(false);
  });
});

describe('Utilidades de conversion y colecciones', () => {
  test('convierte JSON y devuelve null para JSON invalido', () => {
    expect(parseJSON(toJSON({ room: 8 }))).toEqual({ room: 8 });
    expect(parseJSON('{invalido')).toBeNull();
  });

  test('codifica query strings y omite valores nulos', () => {
    const query = toQueryString({ search: 'suite deluxe', page: 2, ignored: null });

    expect(query).toBe('search=suite%20deluxe&page=2');
    expect(parseQueryString(query)).toEqual({ search: 'suite deluxe', page: '2' });
  });

  test('busca sin distinguir mayusculas, agrupa y ordena sin mutar el array', () => {
    const rooms = [
      { number: 202, type: 'Suite' },
      { number: 101, type: 'Simple' },
      { number: 303, type: 'Suite' }
    ];

    expect(searchInArray(rooms, 'suite', ['type'])).toEqual([rooms[0], rooms[2]]);
    expect(Object.keys(groupByField(rooms, 'type'))).toEqual(['Suite', 'Simple']);
    expect(sortByField(rooms, 'number').map(room => room.number)).toEqual([101, 202, 303]);
    expect(rooms.map(room => room.number)).toEqual([202, 101, 303]);
  });

  test('obtiene valores anidados y devuelve undefined si falta una ruta', () => {
    const reservation = { client: { contact: { email: 'guest@example.com' } } };

    expect(getNestedValue(reservation, 'client.contact.email')).toBe('guest@example.com');
    expect(getNestedValue(reservation, 'client.address.city')).toBeUndefined();
  });
});