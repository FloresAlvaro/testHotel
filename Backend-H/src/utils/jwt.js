const jwt = require('jsonwebtoken');
const { JWT_SECRET, JWT_EXPIRE } = require('../config/environment');

/** @param {Record<string, unknown>} payload @param {import('jsonwebtoken').SignOptions} [options] */
const createToken = (payload, options = {}) => {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRE,
    ...options,
  });
};

/** @param {string} token @returns {import('jsonwebtoken').JwtPayload} */
const verifyToken = (token) => {
  const payload = jwt.verify(token, JWT_SECRET);
  if (typeof payload === 'string') throw new jwt.JsonWebTokenError('Payload inválido');
  return payload;
};

module.exports = {
  createToken,
  verifyToken,
};
