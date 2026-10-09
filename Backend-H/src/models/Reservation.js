const pool = require('../config/database');

class Reservation {
  /** @param {import('pg').Pool | import('pg').PoolClient} [client] */
  static async getRoomState(roomId, client = pool) {
    const result = await client.query(
      `
      SELECT EXISTS(SELECT 1 FROM reservation WHERE room_id = $1 AND status = 'checked_in') AS occupied,
        EXISTS(SELECT 1 FROM reservation WHERE room_id = $1 AND status = 'confirmed') AS reserved
    `,
      [roomId],
    );
    return result.rows[0];
  }
  /** @param {import('pg').Pool | import('pg').PoolClient} [client] */
  static async hasActiveStay(roomId, client = pool) {
    return (await this.getRoomState(roomId, client)).occupied;
  }
  /** @param {import('pg').Pool | import('pg').PoolClient} [client] */
  static async hasOverlap(roomId, start, end, excludeId, client = pool) {
    const result = await client.query(
      `
      SELECT EXISTS(SELECT 1 FROM reservation WHERE room_id = $1 AND id <> $4
        AND status != 'cancelled' AND check_in < $3::date AND check_out > $2::date) AS overlap
    `,
      [roomId, start, end, excludeId],
    );
    return result.rows[0].overlap;
  }

  /**
   * Crear reserva
   */
  /** @param {import('pg').Pool | import('pg').PoolClient} [client] */
  static async create(reservationData, client = pool) {
    const { check_in, check_out, client_id, room_id, user_id, total_price } = reservationData;

    const result = await client.query(
      `
      INSERT INTO reservation (check_in, check_out, client_id, room_id, user_id, total_price, status, notes)
      VALUES ($1, $2, $3, $4, $5, $6, 'confirmed', $7) RETURNING *
    `,
      [check_in, check_out, client_id, room_id, user_id, total_price, reservationData.notes],
    );
    return result.rows[0];
  }

  /**
   * Obtener reserva por ID
   */
  /** @param {import('pg').Pool | import('pg').PoolClient} [client] */
  static async findById(id, client = pool, forUpdate = false) {
    const query = `
            SELECT r.*, c.name as client_name,
              c.document as client_document, c.phone as client_phone, c.email as client_email,
             rm.number as room_number, rt.name as room_type_name,
             u.name as receptionist_name
      FROM reservation r
      JOIN client c ON r.client_id = c.id
      JOIN room rm ON r.room_id = rm.id
      JOIN room_type rt ON rm.room_type_id = rt.id
      JOIN "user" u ON r.user_id = u.id
      WHERE r.id = $1
      ${forUpdate ? 'FOR UPDATE OF r' : ''}
    `;

    const result = await client.query(query, [id]);
    return result.rows[0] || null;
  }

  /**
   * Obtener todas las reservas
   */
  static async findAll(limit = 10, offset = 0, status = null) {
    let query = `
            SELECT r.*, c.name as client_name, c.document as client_document,
              c.phone as client_phone, c.email as client_email,
              rm.number as room_number,
             rt.name as room_type_name
      FROM reservation r
      JOIN client c ON r.client_id = c.id
      JOIN room rm ON r.room_id = rm.id
      JOIN room_type rt ON rm.room_type_id = rt.id
    `;

    const params = [];

    if (status) {
      query += ` WHERE r.status = $${params.length + 1}`;
      params.push(status);
    }

    query += ` ORDER BY r.check_in DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);
    return result.rows;
  }

  /**
   * Contar total de reservas
   */
  static async countAll(status = null) {
    let query = 'SELECT COUNT(*) FROM reservation';
    const params = [];

    if (status) {
      query += ` WHERE status = $1`;
      params.push(status);
    }

    const result = await pool.query(query, params);
    return parseInt(result.rows[0].count);
  }

  /**
   * Obtener reservas de un cliente
   */
  static async findByClientId(clientId, limit = 10, offset = 0) {
    const query = `
      SELECT r.*, rm.number as room_number, rt.name as room_type_name
      FROM reservation r
      JOIN room rm ON r.room_id = rm.id
      JOIN room_type rt ON rm.room_type_id = rt.id
      WHERE r.client_id = $1
      ORDER BY r.check_in DESC
      LIMIT $2 OFFSET $3
    `;

    const result = await pool.query(query, [clientId, limit, offset]);
    return result.rows;
  }

  /**
   * Obtener reservas de una habitación
   */
  static async findByRoomId(roomId, limit = 10, offset = 0) {
    const query = `
      SELECT r.*, c.name as client_name, c.email
      FROM reservation r
      JOIN client c ON r.client_id = c.id
      WHERE r.room_id = $1 AND r.status != 'cancelled'
      ORDER BY r.check_in DESC
      LIMIT $2 OFFSET $3
    `;

    const result = await pool.query(query, [roomId, limit, offset]);
    return result.rows;
  }

  /**
   * Obtener reservas activas (check-in actual)
   */
  static async findActive() {
    const query = `
      SELECT r.*, c.name as client_name, rm.number as room_number,
             rt.name as room_type_name
      FROM reservation r
      JOIN client c ON r.client_id = c.id
      JOIN room rm ON r.room_id = rm.id
      JOIN room_type rt ON rm.room_type_id = rt.id
      WHERE r.status IN ('confirmed', 'checked_in')
      AND r.check_in <= CURRENT_DATE
      AND r.check_out >= CURRENT_DATE
      ORDER BY r.check_in ASC
    `;

    const result = await pool.query(query);
    return result.rows;
  }

  /**
   * Actualizar reserva
   */
  /** @param {import('pg').Pool | import('pg').PoolClient} [client] */
  static async update(id, reservationData, client = pool) {
    const { check_in, check_out, total_price, status, notes } = reservationData;

    const query = `
      UPDATE reservation
      SET check_in = $1, check_out = $2, total_price = $3, status = $4,
          notes = $5
      WHERE id = $6
      RETURNING *
    `;

    const result = await client.query(query, [check_in, check_out, total_price, status, notes, id]);

    return result.rows[0] || null;
  }

  /**
   * Cambiar estado de reserva
   */
  /** @param {import('pg').Pool | import('pg').PoolClient} [client] */
  static async updateStatus(id, status, client = pool) {
    const query = `
      UPDATE reservation
      SET status = $1
      WHERE id = $2
      RETURNING *
    `;

    const result = await client.query(query, [status, id]);
    return result.rows[0] || null;
  }

  /**
   * Cancelar reserva
   */
  /** @param {import('pg').Pool | import('pg').PoolClient} [client] */
  static async cancel(id, client = pool) {
    return await this.updateStatus(id, 'cancelled', client);
  }

  /**
   * Obtener próximas reservas (próximos 7 días)
   */
  static async findUpcoming(days = 7) {
    const query = `
      SELECT r.*, c.name as client_name, rm.number as room_number,
             rt.name as room_type_name
      FROM reservation r
      JOIN client c ON r.client_id = c.id
      JOIN room rm ON r.room_id = rm.id
      JOIN room_type rt ON rm.room_type_id = rt.id
      WHERE r.status != 'cancelled'
      AND r.check_in BETWEEN CURRENT_DATE AND CURRENT_DATE + $1::int * INTERVAL '1 day'
      ORDER BY r.check_in ASC
    `;

    const result = await pool.query(query, [days]);
    return result.rows;
  }
}

module.exports = Reservation;
