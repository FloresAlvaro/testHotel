/** @param {NodeJS.ProcessEnv} env */
module.exports = (env) => {
  /** @param {string} name @param {number} fallback @param {number} [maximum] */
  const integer = (name, fallback, maximum = Number.MAX_SAFE_INTEGER) => {
    const value = Number(env[name] ?? fallback);
    if (!Number.isSafeInteger(value) || value < 1 || value > maximum)
      throw new Error(`${name} debe ser un entero entre 1 y ${maximum}`);
    return value;
  };
  for (const name of ['CORS_CREDENTIALS', 'COOKIE_SECURE', 'SMTP_SECURE']) {
    if (env[name] !== undefined && !['true', 'false'].includes(env[name]))
      throw new Error(`${name} debe ser true o false`);
  }
  const frontend = new URL(env.FRONTEND_URL || 'http://localhost:3001');
  if (
    !['http:', 'https:'].includes(frontend.protocol) ||
    frontend.username ||
    frontend.password ||
    frontend.pathname !== '/' ||
    frontend.search ||
    frontend.hash
  )
    throw new Error('FRONTEND_URL debe ser un origen HTTP/HTTPS sin ruta ni credenciales');
  const origins = (env.CORS_ORIGIN || '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
  if (env.CORS_CREDENTIALS === 'true' && origins.includes('*'))
    throw new Error('CORS con credenciales requiere orígenes explícitos');
  if (env.CORS_CREDENTIALS === 'true' && env.FRONTEND_URL && !origins.includes(frontend.origin))
    throw new Error('CORS_ORIGIN debe incluir FRONTEND_URL');
  if (frontend.protocol === 'https:' && env.COOKIE_SECURE === 'false')
    throw new Error('HTTPS requiere cookies Secure');
  const trustProxy = env.TRUST_PROXY?.split(',')
    .map((value) => value.trim())
    .filter(Boolean);
  if (
    trustProxy?.some(
      (value) => ['true', '*', '0.0.0.0/0', '::/0'].includes(value) || /^\d+$/.test(value),
    )
  )
    throw new Error(
      'TRUST_PROXY requiere IPs/subredes confiables, no confianza global ni número de saltos',
    );
  return {
    SESSION_MAX_AGE: integer('SESSION_MAX_AGE', 86400000),
    SMTP_PORT: integer('SMTP_PORT', 587, 65535),
    SMTP_MAX_ATTEMPTS: integer('SMTP_MAX_ATTEMPTS', 3, 5),
    SMTP_RETRY_DELAY_MS: integer('SMTP_RETRY_DELAY_MS', 500, 10000),
    AUTH_RETENTION_DAYS: integer('AUTH_RETENTION_DAYS', 30, 3650),
    AUTH_CLEANUP_INTERVAL_MS: integer('AUTH_CLEANUP_INTERVAL_MS', 3600000, 2147483647),
    TRUST_PROXY: trustProxy?.length ? trustProxy : false,
  };
};
