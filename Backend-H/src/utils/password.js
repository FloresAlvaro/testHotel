const bcrypt = require('bcryptjs');
const { BCRYPT_ROUNDS } = require('../config/environment');

const hashPassword = (password) => bcrypt.hash(password, BCRYPT_ROUNDS);
const comparePassword = (password, hashedPassword) => bcrypt.compare(password, hashedPassword);

module.exports = {
	hashPassword,
	comparePassword
};
