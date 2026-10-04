jest.mock('../src/config/database', () => ({
  query: jest.fn()
}));

const pool = require('../src/config/database');
const Room = require('../src/models/Room');

describe('Room.findAvailableForDates', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    pool.query.mockResolvedValue({ rows: [] });
  });

  test('usa solapamiento de fechas para habitaciones disponibles, reservadas u ocupadas', async () => {
    await Room.findAvailableForDates('2026-12-20', '2026-12-22');

    const [query, params] = pool.query.mock.calls[0];
    expect(query).toContain("r.status IN ('available', 'reserved', 'occupied')");
    expect(query).toContain('res.check_in < $1 AND res.check_out > $2');
    expect(params).toEqual(['2026-12-22', '2026-12-20']);
  });
});