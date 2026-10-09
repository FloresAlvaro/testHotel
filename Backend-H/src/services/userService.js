const { transaction } = require('../config/database');
const User = require('../models/User');
const error = require('../utils/domainError');
const audit = require('./auditService');
const sessions = require('./sessionService');

module.exports = {
  update: (id, data, actor) =>
    transaction(async (client) => {
      // Serializa los cambios de permisos para proteger también las desactivaciones simultáneas.
      await client.query('SELECT pg_advisory_xact_lock(724001)');
      const user = await User.findById(id, client, true);
      if (!user) throw error('Usuario no encontrado', 404);
      const next = { ...user, ...data };
      if (user.role === 'admin' && user.is_active && (next.role !== 'admin' || !next.is_active)) {
        const count = await User.countActiveAdmins(client);
        if (count <= 1)
          throw error('No se puede desactivar ni degradar al último administrador activo');
      }
      if (user.password_setup_required && next.is_active)
        throw error('El empleado debe aceptar su invitación para activar la cuenta');
      const updated = await User.update(id, next, client);
      if (user.role !== next.role || user.is_active !== next.is_active) {
        await sessions.revokeAll(id, client);
        await client.query('DELETE FROM auth_action_token WHERE user_id = $1', [id]);
      }
      await audit(client, actor, 'update', 'user', user, updated);
      return updated;
    }),
};
