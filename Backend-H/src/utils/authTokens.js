const { randomBytes, createHash } = require('node:crypto');
/** @returns {string} */
const generate = () => randomBytes(32).toString('hex');
/** @param {string} token @returns {string} */
const digest = (token) => createHash('sha256').update(token).digest('hex');
module.exports = { generate, digest };
