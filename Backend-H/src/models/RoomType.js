const pool = require('../config/database');

class RoomType {
  /**
   * Crear tipo de habitación
   */
  static async create(roomTypeData) {
    const { name, description, price, capacity, amenities, image } = roomTypeData;

    try {
      const query = `
        INSERT INTO room_type (name, description, price, capacity, amenities, image, is_active)
        VALUES ($1, $2, $3, $4, $5, $6, true)
        RETURNING *
      `;

      const result = await pool.query(query, [name, description, price, capacity, amenities, image]);
      return result.rows[0];
    } catch (error) {
      if (error.code === '23505') {
        throw new Error('El tipo de habitación ya existe');
      }
      throw error;
    }
  }

  /**
   * Obtener tipo de habitación por ID
   */
  static async findById(id) {
    const query = `
      SELECT * FROM room_type WHERE id = $1 AND is_active = true
    `;

    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  }

  /**
   * Obtener todos los tipos de habitación
   */
  static async findAll() {
    const query = `
      SELECT * FROM room_type
      WHERE is_active = true
      ORDER BY price ASC
    `;

    const result = await pool.query(query);
    return result.rows;
  }

  /**
   * Obtener con paginación
   */
  static async findAllPaginated(limit = 10, offset = 0) {
    const query = `
      SELECT * FROM room_type
      WHERE is_active = true
      ORDER BY created_at DESC
      LIMIT $1 OFFSET $2
    `;

    const result = await pool.query(query, [limit, offset]);
    return result.rows;
  }

  /**
   * Contar total
   */
  static async countAll() {
    const query = 'SELECT COUNT(*) FROM room_type WHERE is_active = true';
    const result = await pool.query(query);
    return parseInt(result.rows[0].count);
  }

  /**
   * Actualizar tipo de habitación
   */
  static async update(id, roomTypeData) {
    const { name, description, price, capacity, amenities, image } = roomTypeData;

    const query = `
      UPDATE room_type
      SET name = $1, description = $2, price = $3, capacity = $4,
          amenities = $5, image = $6, updated_at = CURRENT_TIMESTAMP
      WHERE id = $7 AND is_active = true
      RETURNING *
    `;

    try {
      const result = await pool.query(query, [name, description, price, capacity, amenities, image, id]);
      return result.rows[0] || null;
    } catch (error) {
      if (error.code === '23505') {
        throw new Error('El nombre del tipo ya existe');
      }
      throw error;
    }
  }

  /**
   * Desactivar tipo de habitación
   */
  static async deactivate(id) {
    const query = `
      UPDATE room_type
      SET is_active = false, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `;

    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  }

  /**
   * Obtener disponibilidad de tipo de habitación
   */
  static async getAvailabilityStats(roomTypeId) {
    const query = `
      SELECT 
        rt.id,
        rt.name,
        COUNT(r.id) as total_rooms,
        COUNT(CASE WHEN r.status = 'available' THEN 1 END) as available_rooms,
        COUNT(CASE WHEN r.status = 'occupied' THEN 1 END) as occupied_rooms
      FROM room_type rt
      LEFT JOIN room r ON rt.id = r.room_type_id
      WHERE rt.id = $1
      GROUP BY rt.id, rt.name
    `;

    const result = await pool.query(query, [roomTypeId]);
    return result.rows[0] || null;
  }
}

module.exports = RoomType;