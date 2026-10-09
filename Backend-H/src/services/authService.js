const database = require('../config/database');
const User = require('../models/User');
const { hashPassword, comparePassword } = require('../utils/password');
const tokens = require('../utils/authTokens');
const sessions = require('./sessionService');
const mail = require('./mailService');
const audit = require('./auditService');
const error = require('../utils/domainError');
const { frontendURL } = require('../config/auth');
const publicUser = ({ password: _password, ...user }) => user;
const issueToken = async (userId, purpose, client) => {
  const token = tokens.generate();
  await client.query('DELETE FROM auth_action_token WHERE user_id = $1 AND purpose = $2', [
    userId,
    purpose,
  ]);
  await client.query(
    `INSERT INTO auth_action_token (token_hash, user_id, purpose, expires_at)
    VALUES ($1, $2, $3, CURRENT_TIMESTAMP + $4::int * INTERVAL '1 minute')`,
    [tokens.digest(token), userId, purpose, purpose === 'invite' ? 1440 : 30],
  );
  return `${frontendURL}/auth/${purpose === 'invite' ? 'accept-invitation' : 'reset-password'}#token=${token}`;
};
module.exports = {
  login: (email, password, actor) =>
    database.transaction(async (client) => {
      const user = await User.findByEmail(email, client, true);
      if (!user || !(await comparePassword(password, user.password)))
        throw error('Email o contraseña incorrectos', 401);
      if (!user.is_active || user.password_setup_required)
        throw error('La cuenta está inactiva', 403);
      const session = await sessions.create(user, actor, client);
      return { user: publicUser(user), ...session };
    }),
  invite: async (data, actor) => {
    const result = await database.transaction(async (client) => {
      await client.query('SELECT pg_advisory_xact_lock(724001)');
      let user = await User.findByEmail(data.email, client, true);
      if (user && (!user.password_setup_required || user.is_active))
        throw error('El email ya está registrado');
      if (!user) {
        user = await User.create({ ...data, password: tokens.generate() }, client);
      }
      const updated = await client.query(
        `UPDATE "user" SET name = $2, role = $3,
        is_active = FALSE, password_setup_required = TRUE WHERE id = $1
        RETURNING id, name, email, role, is_active, password_setup_required, created_at, updated_at`,
        [user.id, data.name, data.role || 'receptionist'],
      );
      const link = await issueToken(user.id, 'invite', client);
      await audit(client, actor, 'invite', 'user', null, updated.rows[0]);
      return { user: updated.rows[0], invitationUrl: link };
    });
    let delivered = false;
    try {
      delivered = await mail.sendLink(data.email, result.invitationUrl, 'invite');
    } catch {
      console.error('No se pudo enviar la invitación por SMTP');
    }
    return { ...result, delivery: delivered ? 'email' : 'manual' };
  },
  requestReset: async (email) => {
    if (!mail.configured())
      throw error(
        'La recuperación por correo no está configurada. Contacta al administrador.',
        503,
      );
    const result = await database.transaction(async (client) => {
      const user = await User.findByEmail(email, client, true);
      if (!user || !user.is_active || user.password_setup_required) return null;
      return { email: user.email, link: await issueToken(user.id, 'reset', client) };
    });
    if (result) {
      try {
        await mail.sendLink(result.email, result.link, 'reset');
      } catch {
        console.error('No se pudo enviar la recuperación por SMTP');
      }
    }
  },
  consume: (token, password, purpose) =>
    database.transaction(async (client) => {
      const hash = tokens.digest(token);
      const found = await client.query(
        'SELECT user_id FROM auth_action_token WHERE token_hash = $1 AND purpose = $2',
        [hash, purpose],
      );
      if (!found.rowCount) throw error('El enlace es inválido o ha expirado', 400);
      const user = await User.findById(found.rows[0].user_id, client, true);
      const valid = await client.query(
        `SELECT 1 FROM auth_action_token WHERE token_hash = $1 AND purpose = $2
      AND expires_at > CURRENT_TIMESTAMP FOR UPDATE`,
        [hash, purpose],
      );
      if (
        !user ||
        !valid.rowCount ||
        (purpose === 'reset' && (!user.is_active || user.password_setup_required)) ||
        (purpose === 'invite' && !user.password_setup_required)
      )
        throw error('El enlace es inválido o ha expirado', 400);
      await client.query(
        `UPDATE "user" SET password = $2, password_setup_required = FALSE,
      is_active = CASE WHEN $3 = 'invite' THEN TRUE ELSE is_active END WHERE id = $1`,
        [user.id, await hashPassword(password), purpose],
      );
      await client.query('DELETE FROM auth_action_token WHERE user_id = $1', [user.id]);
      await sessions.revokeAll(user.id, client);
      await audit(
        client,
        { id: user.id },
        purpose === 'invite' ? 'accept_invitation' : 'reset_password',
        'user',
        user,
        { ...user, is_active: true },
      );
    }),
  changePassword: (id, currentPassword, password) =>
    database.transaction(async (client) => {
      const user = await User.findWithPasswordById(id, client);
      if (!user || !(await comparePassword(currentPassword, user.password)))
        throw error('Contraseña actual incorrecta', 401);
      await client.query('UPDATE "user" SET password = $2 WHERE id = $1', [
        id,
        await hashPassword(password),
      ]);
      await client.query('DELETE FROM auth_action_token WHERE user_id = $1', [id]);
      await sessions.revokeAll(id, client);
      await audit(client, { id: Number(id) }, 'password', 'user', user, user);
    }),
};
