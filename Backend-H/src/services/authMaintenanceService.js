const database = require('../config/database');
const { AUTH_RETENTION_DAYS, AUTH_CLEANUP_INTERVAL_MS } = require('../config/environment');

const cleanup = () =>
  database.transaction(async (client) => {
    // Solo un proceso limpia a la vez, incluso con varias instancias del backend.
    const lock = await client.query('SELECT pg_try_advisory_xact_lock(724003) AS acquired');
    if (!lock.rows[0].acquired) return { skipped: true };
    const tokens = await client.query(
      'DELETE FROM auth_action_token WHERE expires_at <= CURRENT_TIMESTAMP',
    );
    const sessions = await client.query(
      `DELETE FROM auth_session
    WHERE expires_at < CURRENT_TIMESTAMP - $1::int * INTERVAL '1 day'
       OR revoked_at < CURRENT_TIMESTAMP - $1::int * INTERVAL '1 day'`,
      [AUTH_RETENTION_DAYS],
    );
    return { tokens: tokens.rowCount, sessions: sessions.rowCount };
  });
const start = () => {
  /** @type {Promise<unknown> | null} */
  let running = null;
  const tick = () => {
    if (!running)
      running = cleanup()
        .catch(() => console.error('Falló la limpieza de autenticación'))
        .finally(() => {
          running = null;
        });
  };
  tick();
  const timer = setInterval(tick, AUTH_CLEANUP_INTERVAL_MS);
  timer.unref();
  return async () => {
    clearInterval(timer);
    await running;
  };
};
module.exports = { cleanup, start };
