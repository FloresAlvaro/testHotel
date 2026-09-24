const jwt = require('jsonwebtoken');
const { JWT_SECRET, JWT_EXPIRE } = require('../config/environment');

const createToken = (payload, options = {}) => {
	return jwt.sign(payload, JWT_SECRET, {
		expiresIn: JWT_EXPIRE,
		...options
	});
};

const verifyToken = (token) => jwt.verify(token, JWT_SECRET);

module.exports = {
	createToken,
	verifyToken
};
