const bcrypt = require('bcryptjs');
const { BCRYPT_ROUNDS } = require('../config/environment');

const hashPassword = async (password) => {
  if (Buffer.byteLength(password, 'utf8') > 72) {
    throw require('./businessError')('La contraseña no puede superar 72 bytes UTF-8', 422);
  }
  return bcrypt.hash(password, BCRYPT_ROUNDS);
};
const comparePassword = (password, hashedPassword) => Buffer.byteLength(password, 'utf8') > 72
  ? Promise.resolve(false) : bcrypt.compare(password, hashedPassword);

module.exports = {
	hashPassword,
	comparePassword
};
