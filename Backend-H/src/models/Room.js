const pool = require('../config/database');

class Room {
  /**
   * Crear habitación
   */
  static async create(roomData) {
    const { number, room_type_id, floor } = roomData;

    try {
      const query = `
        INSERT INTO room (number, room_type_id, floor, status)
        VALUES ($1, $2, $3, 'available')
        RETURNING *
      `;

      const result = await pool.query(query, [number, room_type_id, floor]);
      return result.rows[0];
    } catch (error) {
      if (error.code === '23505') {
        throw new Error('El número de habitación ya existe');
      }
      throw error;
    }
  }

  /**
   * Obtener habitación por ID
   */
  static async findById(id, client = pool, forUpdate = false) {
    const query = `
      SELECT r.*, rt.name as room_type_name, rt.price
      FROM room r
      JOIN room_type rt ON r.room_type_id = rt.id
      WHERE r.id = $1
      ${forUpdate ? 'FOR UPDATE' : ''}
    `;

    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  }

  /**
   * Obtener habitación por número
   */
  static async findByNumber(number) {
    const query = `
      SELECT r.*, rt.name as room_type_name, rt.price
      FROM room r
      JOIN room_type rt ON r.room_type_id = rt.id
      WHERE r.number = $1
    `;

    const result = await pool.query(query, [number]);
    return result.rows[0] || null;
  }

  /**
   * Obtener todas las habitaciones
   */
  static async findAll(limit = 10, offset = 0) {
    const query = `
      SELECT r.*, rt.name as room_type_name, rt.price
      FROM room r
      JOIN room_type rt ON r.room_type_id = rt.id
      ORDER BY r.floor, r.number
      LIMIT $1 OFFSET $2
    `;

    const result = await pool.query(query, [limit, offset]);
    return result.rows;
  }

  /**
   * Contar total de habitaciones
   */
  static async countAll() {
    const query = 'SELECT COUNT(*) FROM room';
    const result = await pool.query(query);
    return parseInt(result.rows[0].count);
  }

  /**
   * Obtener habitaciones disponibles
   */
  static async findAvailable(limit = 10, offset = 0) {
    const query = `
      SELECT r.*, rt.name as room_type_name, rt.price, rt.capacity
      FROM room r
      JOIN room_type rt ON r.room_type_id = rt.id
      WHERE r.status = 'available'
      ORDER BY r.floor, r.number
      LIMIT $1 OFFSET $2
    `;

    const result = await pool.query(query, [limit, offset]);
    return result.rows;
  }

  /**
   * Obtener habitaciones disponibles para fechas específicas
   */
  static async findAvailableForDates(checkIn, checkOut, roomTypeId = null, client = pool) {
    let query = `
      SELECT DISTINCT r.id, r.number, r.floor, r.status, 
                      rt.id as room_type_id, rt.name as room_type_name, rt.price, rt.capacity
      FROM room r
      JOIN room_type rt ON r.room_type_id = rt.id
      WHERE r.status = 'available'
      AND NOT EXISTS (
        SELECT 1 FROM reservation res
        WHERE res.room_id = r.id
        AND res.status != 'cancelled'
        AND res.check_in < $1 AND res.check_out > $2
      )
    `;

    const params = [checkOut, checkIn];

    if (roomTypeId) {
      query += ` AND r.room_type_id = $${params.length + 1}`;
      params.push(roomTypeId);
    }

    query += ` ORDER BY r.floor, r.number`;

    const result = await client.query(query, params);
    return result.rows;
  }

  /**
   * Actualizar habitación
   */
  static async update(id, roomData) {
    const { number, room_type_id, floor, status } = roomData;

    const query = `
      UPDATE room
      SET number = $1, room_type_id = $2, floor = $3, status = $4, updated_at = CURRENT_TIMESTAMP
      WHERE id = $5
      RETURNING *
    `;

    try {
      const result = await pool.query(query, [number, room_type_id, floor, status, id]);
      return result.rows[0] || null;
    } catch (error) {
      if (error.code === '23505') {
        throw new Error('El número de habitación ya existe');
      }
      throw error;
    }
  }

  /**
   * Cambiar estado de habitación
   */
  static async updateStatus(id, status, client = pool) {
    const query = `
      UPDATE room
      SET status = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
    `;

    const result = await client.query(query, [status, id]);
    return result.rows[0] || null;
  }

  /**
   * Obtener estado de ocupación
   */
  static async getOccupancyStatus() {
    const query = `
      SELECT 
        COUNT(*) as total_rooms,
        COUNT(CASE WHEN status = 'available' THEN 1 END) as available,
        COUNT(CASE WHEN status = 'occupied' THEN 1 END) as occupied,
        COUNT(CASE WHEN status = 'maintenance' THEN 1 END) as maintenance,
        COUNT(CASE WHEN status = 'reserved' THEN 1 END) as reserved
      FROM room
    `;

    const result = await pool.query(query);
    return result.rows[0];
  }

  /**
   * Obtener habitaciones por piso
   */
  static async findByFloor(floor) {
    const query = `
      SELECT r.*, rt.name as room_type_name, rt.price
      FROM room r
      JOIN room_type rt ON r.room_type_id = rt.id
      WHERE r.floor = $1
      ORDER BY r.number
    `;

    const result = await pool.query(query, [floor]);
    return result.rows;
  }
}

module.exports = Room;