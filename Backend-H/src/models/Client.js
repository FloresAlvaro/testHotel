const pool = require('../config/database');

class Client {
  /**
   * Crear nuevo cliente (huésped)
   */
  static async create(clientData) {
    const {
      name,
      document,
      document_type,
      email,
      phone,
      address,
      city,
      country,
      nationality,
      date_of_birth,
      gender,
      emergency_contact,
      emergency_phone,
      notes,
    } = clientData;

    try {
      const query = `
        INSERT INTO client (
          name, document, document_type, email, phone,
          address, city, country, nationality, date_of_birth,
          gender, emergency_contact, emergency_phone, notes, is_active
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, true)
        RETURNING *
      `;

      const result = await pool.query(query, [
        name,
        document,
        document_type || 'cedula',
        email || null,
        phone,
        address,
        city,
        country,
        nationality,
        date_of_birth,
        gender,
        emergency_contact,
        emergency_phone,
        notes,
      ]);

      return result.rows[0];
    } catch (error) {
      if (error.code === '23505') {
        throw Object.assign(
          new Error(
            error.constraint?.includes('email')
              ? 'El email ya está registrado'
              : 'El documento ya está registrado',
          ),
          { statusCode: 409 },
        );
      }
      throw error;
    }
  }

  /**
   * Obtener cliente por ID
   */
  /** @param {import('pg').Pool | import('pg').PoolClient} [client] */
  static async findById(id, client = pool, forUpdate = false) {
    const query = `
      SELECT * FROM client WHERE id = $1 AND is_active = true ${forUpdate ? 'FOR UPDATE' : ''}
    `;

    const result = await client.query(query, [id]);
    return result.rows[0] || null;
  }

  /**
   * Obtener cliente por documento
   */
  static async findByDocument(document) {
    const query = `
      SELECT * FROM client WHERE document = $1 AND is_active = true
    `;

    const result = await pool.query(query, [document]);
    return result.rows[0] || null;
  }

  /**
   * Obtener cliente por email
   */
  static async findByEmail(email) {
    const query = `
      SELECT * FROM client WHERE email = $1 AND is_active = true
    `;

    const result = await pool.query(query, [email]);
    return result.rows[0] || null;
  }

  /**
   * Obtener todos los clientes
   */
  static async findAll(limit = 10, offset = 0) {
    const query = `
      SELECT * FROM client
      WHERE is_active = true
      ORDER BY created_at DESC
      LIMIT $1 OFFSET $2
    `;

    const result = await pool.query(query, [limit, offset]);
    return result.rows;
  }

  /**
   * Contar total de clientes
   */
  static async countAll() {
    const query = 'SELECT COUNT(*) FROM client WHERE is_active = true';
    const result = await pool.query(query);
    return parseInt(result.rows[0].count);
  }

  /**
   * Actualizar cliente
   */
  /** @param {import('pg').Pool | import('pg').PoolClient} [client] */
  static async update(id, clientData, client = pool) {
    const {
      name,
      email,
      phone,
      address,
      city,
      country,
      nationality,
      date_of_birth,
      gender,
      emergency_contact,
      emergency_phone,
      notes,
    } = clientData;

    const query = `
      UPDATE client
      SET name = $1, email = $2, phone = $3, address = $4,
          city = $5, country = $6, nationality = $7, date_of_birth = $8,
          gender = $9, emergency_contact = $10, emergency_phone = $11,
          notes = $12
      WHERE id = $13 AND is_active = true
      RETURNING *
    `;

    try {
      const result = await client.query(query, [
        name,
        email || null,
        phone,
        address,
        city,
        country,
        nationality,
        date_of_birth,
        gender,
        emergency_contact,
        emergency_phone,
        notes,
        id,
      ]);

      return result.rows[0] || null;
    } catch (error) {
      if (error.code === '23505') {
        throw Object.assign(new Error('El email ya está registrado'), { statusCode: 409 });
      }
      throw error;
    }
  }

  /**
   * Eliminar cliente (soft delete)
   */
  /** @param {import('pg').Pool | import('pg').PoolClient} [client] */
  static async delete(id, client = pool) {
    const query = `
      UPDATE client
      SET is_active = false
      WHERE id = $1
      RETURNING id, name, is_active
    `;

    const result = await client.query(query, [id]);
    return result.rows[0] || null;
  }

  /**
   * Búsqueda de clientes
   */
  static async search(searchTerm, limit = 10, offset = 0) {
    const query = `
      SELECT * FROM client
      WHERE is_active = true AND (
        name ILIKE $1 OR 
        email ILIKE $1 OR 
        document ILIKE $1 OR
        phone ILIKE $1
      )
      ORDER BY name ASC
      LIMIT $2 OFFSET $3
    `;

    const result = await pool.query(query, [`%${searchTerm}%`, limit, offset]);
    return result.rows;
  }

  /**
   * Obtener historial de reservas de cliente
   */
  static async getReservationHistory(clientId, limit = 10, offset = 0) {
    const query = `
      SELECT r.*, rt.name as room_type_name, rm.number as room_number
      FROM reservation r
      JOIN room rm ON r.room_id = rm.id
      JOIN room_type rt ON rm.room_type_id = rt.id
      WHERE r.client_id = $1
      ORDER BY r.created_at DESC
      LIMIT $2 OFFSET $3
    `;

    const result = await pool.query(query, [clientId, limit, offset]);
    return result.rows;
  }

  /**
   * Obtener estadísticas del cliente
   */
  static async getStats(clientId) {
    const query = `
      SELECT 
        COUNT(r.id) as total_reservations,
        COUNT(CASE WHEN r.status = 'checked_out' THEN 1 END) as completed_stays,
        SUM(r.total_price) as total_spent,
        AVG(r.total_price) as avg_spend
      FROM reservation r
      WHERE r.client_id = $1
    `;

    const result = await pool.query(query, [clientId]);
    return result.rows[0];
  }
}

module.exports = Client;
