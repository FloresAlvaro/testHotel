const { randomUUID } = require('node:crypto');
const database = require('../config/database');
const { createToken, verifyToken } = require('../utils/jwt');
const { SESSION_MAX_AGE } = require('../config/environment');

module.exports = {
  /** @param {{id: number}} user @param {{userAgent?: string, ip?: string}} actor @param {import('pg').PoolClient | typeof database} [client] */
  create: async (user, actor, client = database) => {
    const id = randomUUID();
    const token = createToken({ id: user.id, sid: id });
    const payload = verifyToken(token);
    if (!payload.exp) throw new Error('El token de sesión requiere caducidad');
    const expires = new Date(Math.min(payload.exp * 1000, Date.now() + SESSION_MAX_AGE));
    await client.query(
      `INSERT INTO auth_session (id, user_id, expires_at, user_agent, ip_address)
      VALUES ($1, $2, $3, $4, $5)`,
      [id, user.id, expires, (actor.userAgent || '').slice(0, 500), actor.ip],
    );
    return { token, expires };
  },
  /** @param {string} id @param {number} userId @param {import('pg').PoolClient | typeof database} [client] */
  valid: async (id, userId, client = database) => {
    const result = await client.query(
      `SELECT 1 FROM auth_session WHERE id = $1 AND user_id = $2
      AND revoked_at IS NULL AND expires_at > CURRENT_TIMESTAMP`,
      [id, userId],
    );
    return (result.rowCount || 0) > 0;
  },
  /** @param {number} userId @param {import('pg').PoolClient | typeof database} [client] */
  revokeAll: (userId, client = database) =>
    client.query(
      `UPDATE auth_session SET revoked_at = CURRENT_TIMESTAMP
    WHERE user_id = $1 AND revoked_at IS NULL`,
      [userId],
    ),
  /** @param {string} id @param {number} userId @param {import('pg').PoolClient | typeof database} [client] */
  revoke: async (id, userId, client = database) => {
    const result = await client.query(
      `UPDATE auth_session SET revoked_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND user_id = $2 AND revoked_at IS NULL RETURNING id`,
      [id, userId],
    );
    return (result.rowCount || 0) > 0;
  },
  /** @param {number} userId @param {string} currentId */
  list: async (userId, currentId) => {
    const result = await database.query(
      `SELECT id, created_at, expires_at, user_agent, ip_address,
      id = $2::uuid AS current FROM auth_session WHERE user_id = $1 AND revoked_at IS NULL
      AND expires_at > CURRENT_TIMESTAMP ORDER BY created_at DESC`,
      [userId, currentId],
    );
    return result.rows;
  },
};
