const pool = require('../config/database');
const { hashPassword } = require('../utils/password');

class User {
  /** @param {import('pg').Pool | import('pg').PoolClient} [client] */
  static async findWithPasswordById(id, client = pool) {
    const result = await client.query('SELECT * FROM "user" WHERE id = $1 FOR UPDATE', [id]);
    return result.rows[0] || null;
  }

  /** @param {import('pg').Pool | import('pg').PoolClient} [client] */
  static async countActiveAdmins(client = pool) {
    const result = await client.query(
      `SELECT COUNT(*)::int AS count FROM "user" WHERE role = 'admin' AND is_active = TRUE`,
    );
    return result.rows[0].count;
  }

  /**
   * Crear nuevo usuario (empleado)
   */
  /** @param {import('pg').Pool | import('pg').PoolClient} [client] */
  static async create(userData, client = pool) {
    const { name, email, password, role } = userData;

    try {
      const hashedPassword = await hashPassword(password);

      const query = `
        INSERT INTO "user" (name, email, password, role, is_active)
        VALUES ($1, $2, $3, $4, true)
        RETURNING id, name, email, role, is_active, password_setup_required, created_at
      `;

      const result = await client.query(query, [name, email, hashedPassword, role]);
      return result.rows[0];
    } catch (error) {
      if (error.code === '23505') {
        // Violación de unique
        throw Object.assign(new Error('El email ya está registrado'), { statusCode: 409 });
      }
      throw error;
    }
  }

  /**
   * Obtener usuario por ID
   */
  /** @param {import('pg').Pool | import('pg').PoolClient} [client] */
  static async findById(id, client = pool, forUpdate = false) {
    const query = `
      SELECT id, name, email, role, is_active, password_setup_required, created_at, updated_at
      FROM "user"
      WHERE id = $1
      ${forUpdate ? 'FOR UPDATE' : ''}
    `;

    const result = await client.query(query, [id]);
    return result.rows[0] || null;
  }

  /**
   * Obtener usuario por email
   */
  /** @param {import('pg').Pool | import('pg').PoolClient} [client] */
  static async findByEmail(email, client = pool, forUpdate = false) {
    const query = `
      SELECT id, name, email, password, role, is_active, password_setup_required, created_at, updated_at
      FROM "user"
      WHERE lower(email) = lower($1)
      ${forUpdate ? 'FOR UPDATE' : ''}
    `;

    const result = await client.query(query, [email]);
    return result.rows[0] || null;
  }

  /**
   * Obtener todos los usuarios
   */
  static async findAll(limit = 10, offset = 0, role = null) {
    let query = `
      SELECT id, name, email, role, is_active, password_setup_required, created_at, updated_at
      FROM "user"
    `;

    const params = [];

    if (role) {
      query += ` WHERE role = $1`;
      params.push(role);
    }

    query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);
    return result.rows;
  }

  /**
   * Contar total de usuarios
   */
  static async countAll(role = null) {
    let query = 'SELECT COUNT(*) FROM "user"';
    const params = [];

    if (role) {
      query += ` WHERE role = $1`;
      params.push(role);
    }

    const result = await pool.query(query, params);
    return parseInt(result.rows[0].count);
  }

  /**
   * Actualizar usuario
   */
  /** @param {import('pg').Pool | import('pg').PoolClient} [client] */
  static async update(id, userData, client = pool) {
    const { name, email, role, is_active } = userData;

    const query = `
      UPDATE "user"
      SET name = $1, email = $2, role = $3, is_active = $4
      WHERE id = $5
      RETURNING id, name, email, role, is_active, updated_at
    `;

    try {
      const result = await client.query(query, [name, email, role, is_active, id]);
      return result.rows[0] || null;
    } catch (error) {
      if (error.code === '23505') {
        throw Object.assign(new Error('El email ya está registrado'), { statusCode: 409 });
      }
      throw error;
    }
  }

  /**
   * Buscar usuarios por nombre o email
   */
  static async search(searchTerm, limit = 10, offset = 0) {
    const query = `
      SELECT id, name, email, role, is_active, password_setup_required, created_at
      FROM "user"
      WHERE name ILIKE $1 OR email ILIKE $1
      ORDER BY name ASC
      LIMIT $2 OFFSET $3
    `;

    const result = await pool.query(query, [`%${searchTerm}%`, limit, offset]);
    return result.rows;
  }
}

module.exports = User;
