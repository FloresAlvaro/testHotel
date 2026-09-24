const pool = require('../config/database');

class Payment {
  /**
   * Crear pago
   */
  static async create(paymentData) {
    const { reservation_id, amount, type, method, status, transaction_id, notes } = paymentData;

    const query = `
      INSERT INTO payment (
        reservation_id, amount, type, method, status, transaction_id, notes
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;

    const result = await pool.query(query, [
      reservation_id, amount, type, method, status || 'pending', transaction_id, notes
    ]);

    return result.rows[0];
  }

  /**
   * Obtener pago por ID
   */
  static async findById(id) {
    const query = `
      SELECT p.*, r.check_in, r.check_out, c.name as client_name
      FROM payment p
      JOIN reservation r ON p.reservation_id = r.id
      JOIN client c ON r.client_id = c.id
      WHERE p.id = $1
    `;

    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  }

  /**
   * Obtener pagos de una reserva
   */
  static async findByReservationId(reservationId) {
    const query = `
      SELECT * FROM payment
      WHERE reservation_id = $1
      ORDER BY created_at DESC
    `;

    const result = await pool.query(query, [reservationId]);
    return result.rows;
  }

  /**
   * Obtener todos los pagos
   */
  static async findAll(limit = 10, offset = 0, status = null) {
    let query = `
      SELECT p.*, r.check_in, c.name as client_name
      FROM payment p
      JOIN reservation r ON p.reservation_id = r.id
      JOIN client c ON r.client_id = c.id
    `;

    const params = [];

    if (status) {
      query += ` WHERE p.status = $${params.length + 1}`;
      params.push(status);
    }

    query += ` ORDER BY p.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);
    return result.rows;
  }

  /**
   * Contar total de pagos
   */
  static async countAll(status = null) {
    let query = 'SELECT COUNT(*) FROM payment';
    const params = [];

    if (status) {
      query += ` WHERE status = $1`;
      params.push(status);
    }

    const result = await pool.query(query, params);
    return parseInt(result.rows[0].count);
  }

  /**
   * Actualizar pago
   */
  static async update(id, paymentData) {
    const { amount, type, method, status, transaction_id } = paymentData;

    const query = `
      UPDATE payment
      SET amount = $1, type = $2, method = $3, status = $4,
          transaction_id = $5, updated_at = CURRENT_TIMESTAMP
      WHERE id = $6
      RETURNING *
    `;

    const result = await pool.query(query, [
      amount, type, method, status, transaction_id, id
    ]);

    return result.rows[0] || null;
  }

  /**
   * Cambiar estado de pago
   */
  static async updateStatus(id, status) {
    const query = `
      UPDATE payment
      SET status = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
    `;

    const result = await pool.query(query, [status, id]);
    return result.rows[0] || null;
  }

  /**
   * Obtener ingresos por período
   */
  static async getRevenueByPeriod(startDate, endDate) {
    const query = `
      SELECT 
        DATE(p.created_at) as date,
        COUNT(p.id) as total_payments,
        SUM(p.amount) as total_amount,
        COUNT(CASE WHEN p.status = 'completed' THEN 1 END) as completed_payments
      FROM payment p
      WHERE p.created_at BETWEEN $1 AND $2
      GROUP BY DATE(p.created_at)
      ORDER BY date DESC
    `;

    const result = await pool.query(query, [startDate, endDate]);
    return result.rows;
  }

  /**
   * Obtener ingresos por método de pago
   */
  static async getRevenueByMethod(startDate, endDate) {
    const query = `
      SELECT 
        method,
        COUNT(id) as total_transactions,
        SUM(amount) as total_amount
      FROM payment
      WHERE status = 'completed' AND created_at BETWEEN $1 AND $2
      GROUP BY method
      ORDER BY total_amount DESC
    `;

    const result = await pool.query(query, [startDate, endDate]);
    return result.rows;
  }

  /**
   * Obtener pagos pendientes
   */
  static async findPending(limit = 10, offset = 0) {
    const query = `
      SELECT p.*, c.name as client_name, r.total_price
      FROM payment p
      JOIN reservation r ON p.reservation_id = r.id
      JOIN client c ON r.client_id = c.id
      WHERE p.status = 'pending'
      ORDER BY p.created_at ASC
      LIMIT $1 OFFSET $2
    `;

    const result = await pool.query(query, [limit, offset]);
    return result.rows;
  }
}

module.exports = Payment;