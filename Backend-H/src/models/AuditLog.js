const pool = require('../config/database');

class AuditLog {
  /**
   * Crear registro de auditoría
   */
  static async create(auditData) {
    const { user_id, action, table_name, record_id, old_value, new_value, ip_address } = auditData;

    const query = `
      INSERT INTO audit_log (user_id, action, table_name, record_id, old_value, new_value, ip_address)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;

    const result = await pool.query(query, [
      user_id, action, table_name, record_id, old_value, new_value, ip_address
    ]);

    return result.rows[0];
  }

  /**
   * Obtener logs de auditoría
   */
  static async findAll(limit = 50, offset = 0) {
    const query = `
      SELECT al.*, u.name as user_name
      FROM audit_log al
      LEFT JOIN "user" u ON al.user_id = u.id
      ORDER BY al.created_at DESC
      LIMIT $1 OFFSET $2
    `;

    const result = await pool.query(query, [limit, offset]);
    return result.rows;
  }

  /**
   * Obtener logs por usuario
   */
  static async findByUserId(userId, limit = 50, offset = 0) {
    const query = `
      SELECT *
      FROM audit_log
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
    `;

    const result = await pool.query(query, [userId, limit, offset]);
    return result.rows;
  }

  /**
   * Obtener logs por tabla
   */
  static async findByTable(tableName, limit = 50, offset = 0) {
    const query = `
      SELECT al.*, u.name as user_name
      FROM audit_log al
      LEFT JOIN "user" u ON al.user_id = u.id
      WHERE al.table_name = $1
      ORDER BY al.created_at DESC
      LIMIT $2 OFFSET $3
    `;

    const result = await pool.query(query, [tableName, limit, offset]);
    return result.rows;
  }

  /**
   * Obtener logs por registro
   */
  static async findByRecord(tableName, recordId) {
    const query = `
      SELECT al.*, u.name as user_name
      FROM audit_log al
      LEFT JOIN "user" u ON al.user_id = u.id
      WHERE al.table_name = $1 AND al.record_id = $2
      ORDER BY al.created_at DESC
    `;

    const result = await pool.query(query, [tableName, recordId]);
    return result.rows;
  }

  /**
   * Obtener logs por acción
   */
  static async findByAction(action, limit = 50, offset = 0) {
    const query = `
      SELECT al.*, u.name as user_name
      FROM audit_log al
      LEFT JOIN "user" u ON al.user_id = u.id
      WHERE al.action = $1
      ORDER BY al.created_at DESC
      LIMIT $2 OFFSET $3
    `;

    const result = await pool.query(query, [action, limit, offset]);
    return result.rows;
  }

  /**
   * Obtener logs en período
   */
  static async findByDateRange(startDate, endDate, limit = 100, offset = 0) {
    const query = `
      SELECT al.*, u.name as user_name
      FROM audit_log al
      LEFT JOIN "user" u ON al.user_id = u.id
      WHERE al.created_at BETWEEN $1 AND $2
      ORDER BY al.created_at DESC
      LIMIT $3 OFFSET $4
    `;

    const result = await pool.query(query, [startDate, endDate, limit, offset]);
    return result.rows;
  }

  /**
   * Contar logs
   */
  static async countAll() {
    const query = 'SELECT COUNT(*) FROM audit_log';
    const result = await pool.query(query);
    return parseInt(result.rows[0].count);
  }
}

module.exports = AuditLog;