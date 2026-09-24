const pool = require('../config/database');
const { hashPassword, comparePassword } = require('../utils/password');

class User {
  /**
   * Crear nuevo usuario (empleado)
   */
  static async create(userData) {
    const { name, email, password, role } = userData;
    
    try {
      const hashedPassword = await hashPassword(password);
      
      const query = `
        INSERT INTO "user" (name, email, password, role, is_active)
        VALUES ($1, $2, $3, $4, true)
        RETURNING id, name, email, role, is_active, created_at
      `;
      
      const result = await pool.query(query, [name, email, hashedPassword, role]);
      return result.rows[0];
    } catch (error) {
      if (error.code === '23505') { // Violación de unique
        throw new Error('El email ya está registrado');
      }
      throw error;
    }
  }

  /**
   * Obtener usuario por ID
   */
  static async findById(id) {
    const query = `
      SELECT id, name, email, role, is_active, created_at, updated_at
      FROM "user"
      WHERE id = $1
    `;
    
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  }

  /**
   * Obtener usuario por email
   */
  static async findByEmail(email) {
    const query = `
      SELECT id, name, email, password, role, is_active, created_at, updated_at
      FROM "user"
      WHERE email = $1
    `;
    
    const result = await pool.query(query, [email]);
    return result.rows[0] || null;
  }

  /**
   * Obtener todos los usuarios
   */
  static async findAll(limit = 10, offset = 0, role = null) {
    let query = `
      SELECT id, name, email, role, is_active, created_at, updated_at
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
  static async update(id, userData) {
    const { name, email, role, is_active } = userData;
    
    const query = `
      UPDATE "user"
      SET name = $1, email = $2, role = $3, is_active = $4, updated_at = CURRENT_TIMESTAMP
      WHERE id = $5
      RETURNING id, name, email, role, is_active, updated_at
    `;
    
    try {
      const result = await pool.query(query, [name, email, role, is_active, id]);
      return result.rows[0] || null;
    } catch (error) {
      if (error.code === '23505') {
        throw new Error('El email ya está registrado');
      }
      throw error;
    }
  }

  /**
   * Cambiar contraseña
   */
  static async updatePassword(id, newPassword) {
    const hashedPassword = await hashPassword(newPassword);
    
    const query = `
      UPDATE "user"
      SET password = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING id, name, email
    `;
    
    const result = await pool.query(query, [hashedPassword, id]);
    return result.rows[0] || null;
  }

  /**
   * Verificar contraseña
   */
  static async verifyPassword(id, password) {
    const field = typeof id === 'number' || /^\d+$/.test(String(id)) ? 'id' : 'email';
    const userWithPassword = await pool.query(
      `
        SELECT id, name, email, password, role, is_active, created_at, updated_at
        FROM "user"
        WHERE ${field} = $1
      `,
      [id]
    );

    const user = userWithPassword.rows[0];
    if (!user) return null;
    
    const isValid = await comparePassword(password, user.password);
    return isValid ? user : null;
  }

  /**
   * Desactivar usuario
   */
  static async deactivate(id) {
    const query = `
      UPDATE "user"
      SET is_active = false, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING id, name, is_active
    `;
    
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  }

  /**
   * Activar usuario
   */
  static async activate(id) {
    const query = `
      UPDATE "user"
      SET is_active = true, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING id, name, is_active
    `;
    
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  }

  /**
   * Eliminar usuario (soft delete)
   */
  static async delete(id) {
    return await this.deactivate(id);
  }

  /**
   * Buscar usuarios por nombre o email
   */
  static async search(searchTerm, limit = 10, offset = 0) {
    const query = `
      SELECT id, name, email, role, is_active, created_at
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