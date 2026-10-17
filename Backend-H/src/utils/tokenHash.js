const crypto = require('node:crypto');
/** @param {string} token @returns {string} */
module.exports = token => crypto.createHash('sha256').update(token).digest('hex');
