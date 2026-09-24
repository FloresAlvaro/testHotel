const pool = require('../config/database');

class CheckInLog {
  /**
   * Crear registro de check-in
   */
  static async create(checkInData, client = pool) {
    const { reservation_id, user_id, check_in_time, notes } = checkInData;

    const query = `
      INSERT INTO check_in_log (reservation_id, user_id, check_in_time, notes)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;

    const result = await client.query(query, [reservation_id, user_id, check_in_time, notes]);
    return result.rows[0];
  }

  /**
   * Obtener log por ID
   */
  static async findById(id) {
    const query = `
      SELECT cil.*, c.name as client_name, rm.number as room_number,
             u.name as receptionist_name
      FROM check_in_log cil
      JOIN reservation r ON cil.reservation_id = r.id
      JOIN client c ON r.client_id = c.id
      JOIN room rm ON r.room_id = rm.id
      JOIN "user" u ON cil.user_id = u.id
      WHERE cil.id = $1
    `;

    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  }

  /**
   * Obtener log por reserva
   */
  static async findByReservationId(reservationId, client = pool, forUpdate = false) {
    const query = `
      SELECT * FROM check_in_log
      WHERE reservation_id = $1
      ${forUpdate ? 'FOR UPDATE' : ''}
    `;

    const result = await client.query(query, [reservationId]);
    return result.rows[0] || null;
  }

  /**
   * Obtener todos los logs
   */
  static async findAll(limit = 10, offset = 0) {
    const query = `
      SELECT cil.*, c.name as client_name, rm.number as room_number
      FROM check_in_log cil
      JOIN reservation r ON cil.reservation_id = r.id
      JOIN client c ON r.client_id = c.id
      JOIN room rm ON r.room_id = rm.id
      ORDER BY cil.created_at DESC
      LIMIT $1 OFFSET $2
    `;

    const result = await pool.query(query, [limit, offset]);
    return result.rows;
  }

  /**
   * Registrar check-out
   */
  static async updateCheckOut(checkInLogId, checkOutTime, client = pool) {
    const query = `
      UPDATE check_in_log
      SET check_out_time = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
    `;

    const result = await client.query(query, [checkOutTime, checkInLogId]);
    return result.rows[0] || null;
  }

  /**
   * Obtener check-ins del día
   */
  static async findTodayCheckIns() {
    const query = `
      SELECT cil.*, c.name as client_name, rm.number as room_number,
             rt.name as room_type_name
      FROM check_in_log cil
      JOIN reservation r ON cil.reservation_id = r.id
      JOIN client c ON r.client_id = c.id
      JOIN room rm ON r.room_id = rm.id
      JOIN room_type rt ON rm.room_type_id = rt.id
      WHERE DATE(cil.check_in_time) = CURRENT_DATE
      ORDER BY cil.check_in_time ASC
    `;

    const result = await pool.query(query);
    return result.rows;
  }

  /**
   * Obtener check-outs pendientes
   */
  static async findPendingCheckOuts() {
    const query = `
      SELECT cil.*, c.name as client_name, rm.number as room_number,
             r.check_out as scheduled_checkout_date
      FROM check_in_log cil
      JOIN reservation r ON cil.reservation_id = r.id
      JOIN client c ON r.client_id = c.id
      JOIN room rm ON r.room_id = rm.id
      WHERE cil.check_out_time IS NULL
      AND r.check_out <= CURRENT_DATE
      ORDER BY r.check_out ASC
    `;

    const result = await pool.query(query);
    return result.rows;
  }

  /**
   * Obtener historial de un cliente
   */
  static async findClientHistory(clientId, limit = 10, offset = 0) {
    const query = `
      SELECT cil.*, rm.number as room_number, rt.name as room_type_name,
             r.total_price
      FROM check_in_log cil
      JOIN reservation r ON cil.reservation_id = r.id
      JOIN client c ON r.client_id = c.id
      JOIN room rm ON r.room_id = rm.id
      JOIN room_type rt ON rm.room_type_id = rt.id
      WHERE c.id = $1
      ORDER BY cil.check_in_time DESC
      LIMIT $2 OFFSET $3
    `;

    const result = await pool.query(query, [clientId, limit, offset]);
    return result.rows;
  }
}

module.exports = CheckInLog;